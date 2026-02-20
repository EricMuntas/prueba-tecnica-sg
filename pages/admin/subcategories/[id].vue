<script setup>
definePageMeta({
    middleware: 'admin'
})
const supabase = useSupabaseClient();

const loading = ref(false)
const errorMessage = ref('')
const success = ref('')
const isDeleteModalOpen = ref(false)

const route = useRoute();
const id = route.params.id;


const formData = ref({

    name: '',
    description: '',
    category_id: null,

})

const categories = ref(null); // para el select

const openDeleteModal = () => {
    isDeleteModalOpen.value = true
}

const closeDeleteModal = () => {
    isDeleteModalOpen.value = false
}

try {
    {
        {
            // Obtener la subcategoría
            const { data, error } = await supabase.from('sub_categories').select('*').eq('id', id).single();

            if (error) {
                console.error('Error al obtener la subcategoria:', error)
            }

            if (data) {
                formData.value.name = data.name;
                formData.value.description = data.description;
                formData.value.category_id = data.category_id;
            }
        }
        {
            // Obtener todas las categorías para el input
            const { data, error } = await supabase.from('categories').select('*');

            if (error) {
                console.error('Error al obtener las categorías:', error)
            }

            if (data) {
                categories.value = data;
            }
        }
    }
} catch (err) {
    console.error('', err)
} finally {
    loading.value = false
}


const handleSubmit = async () => {
    loading.value = true;
    try {
        if (formData.value.name.trim() == '') {
            errorMessage.value = 'No puedes dejar el nombre en blanco.'
            loading.value = false;
            return;

        }

        if (formData.value.description.trim() == '') {
            errorMessage.value = 'No puedes dejar la descripción en blanco.'
            loading.value = false;
            return;

        }

        if (formData.value.category_id == null) {
            errorMessage.value = 'Debes escojer una categoría padre.'
            loading.value = false;
            return;

        }

        const { data, error } = await supabase.from('sub_categories').update({
            name: formData.value.name,
            description: formData.value.description,
            category_id: formData.value.category_id,
        }).eq('id', id);

        if (error) throw error;

        // success.value = "Actualizado correctamente."
        setTimeout(() => {
            navigateTo('/admin/list-categories')
        }, 250);



    } catch (error) {

    }

}

</script>

<template>
    <div class="flex justify-center items-center w-full mt-20">
        <form @submit.prevent="handleSubmit" class="form-container">

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

            <label for="father-category">Categoría padre:</label>
            <select v-model="formData.category_id" name="father-category" id="">
                <option value="null" disabled="" selected>Selecciona una categoría...</option>
                <option v-for="category in categories" :key="category.id" :value="category.id"> {{ category.name }}
                </option>
            </select>

            <div class="form-items">
                <p class="error">{{ errorMessage }}</p>
            </div>

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
                <span>{{ loading ? 'Actualizando...' : 'Actualizar' }}</span>
            </button>

            <button type="button" :disabled="loading" :class="loading ? 'bg-red-300' : 'bg-red-500 hover:bg-red-400'"
                class="text-white rounded-xl p-2 flex items-center justify-center gap-2" v-on:click="openDeleteModal">
                <span>Eliminar</span>
            </button>

        </form>

        <DeleteModal v-if="isDeleteModalOpen" table="sub_categories" :id="Number(id)" @close="closeDeleteModal"
            :redirect="`/admin/list-subcategories`" />
    </div>
</template>