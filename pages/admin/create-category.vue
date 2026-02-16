<script setup>

const loading = ref(false)
const error = ref('')
const success = ref('')

const supabase = useSupabaseClient();

const formData = ref({

    name: '',
    description: '',
    isSubCategory: false,
    category_id: null, // només si es una subcategoría, s'agafa la del pare

})

// Obtenim les categories per fer subcategories
const categories = ref(null);

try {
    const { data, error } = await supabase
        .from('categories')
        .select('*')

    if (error) {
        console.error('Error al obtener categorias:', error)
    }

    if (data) {
        categories.value = data
        console.log('Categorias cargadas existosamente:', data)
    }
} catch (err) {
    console.error('Exception fetching profile:', err)
} finally {
    loading.value = false
}

const handleRegister = async () => {
    loading.value = true
    error.value = ''
    success.value = ''

    try {

        if (formData.value.name.trim() !== '') {
            if (!formData.value.isSubCategory) {
                const { error: dbError } = await supabase
                    .from('categories')
                    .insert({
                        name: formData.value.name,
                        description: formData.value.description,
                    })
                if (dbError) throw dbError

                success.value = 'Categoria creada exitosamente'

            } else {
                const { error: dbError } = await supabase
                    .from('sub_categories')
                    .insert({
                        name: formData.value.name,
                        category_id: formData.value.category_id,
                        description: formData.value.description,
                    })
                if (dbError) throw dbError

                success.value = 'Subcategoria creada exitosamente'
            }

        } else {
            error.value = "No puedes dejar el nombre en blanco."
        }

    } catch (err) {
        error.value = err.message
    } finally {
        // loading.value = false
        setTimeout(() => {
            navigateTo('/admin/list-categories')
        }, 1000)
    }

}



</script>
<template>
    <div class="flex justify-center items-center w-full mt-20">
        <form @submit.prevent="handleRegister" class="form-container">

            <div class="form-items">
                <label for="name">
                    Nombre:
                </label>
                <input v-model="formData.name" type="text" name="name" id="" placeholder="Nombre...">
            </div>

            <div class="form-items">
                <label for="description">
                    Descripción:
                </label>
                <textarea v-model="formData.description" name="description" id=""
                    placeholder="Descripción..."></textarea>
            </div>

            <div class="flex gap-2">
                <label for="is-subcategory">Es una subcategoría?</label>
                <input v-model="formData.isSubCategory" type="checkbox" name="is-subcategory">
            </div>

            <div v-if="formData.isSubCategory" class="form-items">
                <label for="father-category">Categoría padre:</label>
                <select v-model="formData.category_id" name="father-category" id="">
                    <option value="" disabled="" selected>Selecciona una categoría...</option>
                    <option v-for="category in categories" :key="category.id" :value="category.id"> {{ category.name }}
                    </option>
                </select>
            </div>
            <p v-if="error" class="error">{{ error }}</p>
            <p v-if="success" class="success">{{ success }}</p>
            <button type="submit" :disabled="loading" :class="loading ? 'bg-blue-300' : 'bg-blue-500 hover:bg-blue-400'"
                class="text-white rounded-xl p-2 flex items-center justify-center gap-2">
                <span v-if="loading" class="spinner">
                    <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none"
                        viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                        </circle>
                        <path class="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                        </path>
                    </svg>
                </span>
                <span>{{ loading ? 'Creando...' : 'Crear' }}</span>
            </button>

        </form>
    </div>
</template>
