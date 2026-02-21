<script setup>
definePageMeta({
    middleware: 'admin'
})
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
    }
} catch (err) {
    console.error('Exception fetching profile:', err)
} finally {
    loading.value = false
}

const handleSubmit = async () => {
    loading.value = true
    error.value = ''
    success.value = ''

    try {

        if (formData.value.name.trim() !== '' && formData.value.description.trim() !== '') {
            if (!formData.value.isSubCategory) {
                const { error: dbError } = await supabase
                    .from('categories')
                    .insert({
                        name: formData.value.name,
                        description: formData.value.description,
                    })
                if (dbError) throw dbError

                success.value = 'Categoria creada exitosamente'

                setTimeout(() => {
                    navigateTo('/admin/list-categories')
                }, 250)

            } else {
                if (formData.value.category_id != null) {
                    const { error: dbError } = await supabase
                        .from('sub_categories')
                        .insert({
                            name: formData.value.name,
                            category_id: formData.value.category_id,
                            description: formData.value.description,
                        })
                    if (dbError) throw dbError

                    success.value = 'Subcategoria creada exitosamente'

                    setTimeout(() => {
                        navigateTo('/admin/list-categories')
                    }, 250)
                }
                else {
                    error.value = 'Debes asignar una categoría padre.'
                    loading.value = false;
                }


            }

        } else {
            error.value = "No puedes dejar el nombre ni la descripción en blanco."
            loading.value = false;
        }

    } catch (err) {
        error.value = err.message
    } finally {
        // loading.value = false

    }

}



</script>
<template>
    <div class="page-wrapper">
        <div class="max-w-2xl w-full mx-auto">
            <!-- Header section -->
            <div class="mb-10">
                <NuxtLink to="/admin/list-categories"
                    class="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 text-sm w-fit">
                    <svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Volver a la lista</span>
                </NuxtLink>
                <div class="flex items-center gap-2 mb-2 text-indigo-400">
                    <div class="w-1.5 h-1.5 rounded-full bg-current"></div>
                    <span class="font-semibold uppercase tracking-wider text-xs">Administración</span>
                </div>
                <h1 class="text-3xl font-bold text-white">Nueva Categoría</h1>
                <p class="text-slate-400 text-sm mt-1">Crea una nueva categoría o subcategoría para organizar tus
                    productos.</p>
            </div>

            <form @submit.prevent="handleSubmit" class="form-container">
                <div class="form-items text-white">
                    <label for="name" class="form-label">Nombre de la categoría</label>
                    <input v-model="formData.name" type="text" name="name" id="name"
                        placeholder="Ej: Electrónica, Ropa...">
                </div>

                <div class="form-items text-white">
                    <label for="description" class="form-label">Descripción</label>
                    <textarea v-model="formData.description" name="description" id="description"
                        placeholder="Describe brevemente de qué trata esta categoría..." rows="3"></textarea>
                </div>

                <div class="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10 group cursor-pointer"
                    @click="formData.isSubCategory = !formData.isSubCategory">
                    <div class="flex items-center justify-center size-5 rounded border border-white/20 transition-colors"
                        :class="[formData.isSubCategory ? 'bg-indigo-500 border-indigo-500' : 'bg-transparent']">
                        <svg v-if="formData.isSubCategory" xmlns="http://www.w3.org/2000/svg"
                            class="size-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clip-rule="evenodd" />
                        </svg>
                    </div>
                    <span class="text-sm font-medium text-slate-300">¿Es una subcategoría?</span>
                </div>

                <div v-if="formData.isSubCategory"
                    class="form-items text-white animate-in fade-in slide-in-from-top-2 duration-300">
                    <label for="father-category" class="form-label">Categoría padre</label>
                    <select v-model="formData.category_id" name="father-category" id="father-category">
                        <option :value="null" disabled selected>Selecciona una categoría padre...</option>
                        <option v-for="category in categories" :key="category.id" :value="category.id">
                            {{ category.name }}
                        </option>
                    </select>
                </div>

                <div v-if="error || success" class="mt-2">
                    <p v-if="error" class="error flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {{ error }}
                    </p>
                    <p v-if="success" class="success flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {{ success }}
                    </p>
                </div>

                <button type="submit" :disabled="loading" class="btn-primary mt-2">
                    <div v-if="loading" class="flex items-center justify-center gap-2">
                        <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none"
                            viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                            </circle>
                            <path class="opacity-75" fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                            </path>
                        </svg>
                        <span>Creando...</span>
                    </div>
                    <span v-else>Crear Categoría</span>
                </button>
            </form>
        </div>
    </div>
</template>
