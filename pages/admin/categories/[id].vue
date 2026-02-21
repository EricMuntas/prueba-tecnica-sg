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

const category = ref(null);


const formData = ref({

    name: '',
    description: '',

})

const openDeleteModal = () => {
    isDeleteModalOpen.value = true
}

const closeDeleteModal = () => {
    isDeleteModalOpen.value = false
}

try {
    {
        const { data, error } = await supabase.from('categories').select('*').eq('id', id).single();

        if (error) {
            console.error('Error al obtener la categoria:', error)
        }

        if (data) {
            formData.value.name = data.name;
            formData.value.description = data.description;
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

        const { data, error } = await supabase.from('categories').update({
            name: formData.value.name,
            description: formData.value.description,
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
    <div class="page-wrapper pt-32">
        <div class="w-full max-w-lg">
            <!-- Header -->
            <div class="flex items-center justify-between mb-8">
                <div>
                    <h1 class="text-3xl font-bold text-white">Editar categoría</h1>
                    <p class="text-slate-400 text-sm mt-1">Modifica los detalles de la categoría</p>
                </div>
                <NuxtLink to="/admin/list-categories" class="btn-secondary flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Volver</span>
                </NuxtLink>
            </div>

            <form @submit.prevent="handleSubmit" class="form-container">
                <div class="form-items text-white">
                    <label for="name" class="form-label">Nombre de la categoría</label>
                    <input v-model="formData.name" type="text" name="name" id="name" placeholder="Nombre...">
                </div>

                <div class="form-items text-white">
                    <label for="description" class="form-label">Descripción</label>
                    <textarea v-model="formData.description" name="description" id="description"
                        placeholder="Descripción..." rows="4"></textarea>
                </div>

                <div v-if="errorMessage" class="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p class="text-red-400 text-sm text-center font-medium">{{ errorMessage }}</p>
                </div>

                <div class="flex flex-col gap-3 mt-4">
                    <button type="submit" :disabled="loading"
                        class="btn-primary w-full py-3 flex items-center justify-center gap-2">
                        <span v-if="loading"
                            class="animate-spin size-4 border-2 border-white/30 border-t-white rounded-full"></span>
                        <span>{{ loading ? 'Actualizando...' : 'Actualizar categoría' }}</span>
                    </button>

                    <button type="button" :disabled="loading" @click="openDeleteModal"
                        class="w-full py-3 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all font-semibold text-sm">
                        Eliminar categoría
                    </button>
                </div>
            </form>
        </div>

        <DeleteModal v-if="isDeleteModalOpen" table="categories" :id="Number(id)" @close="closeDeleteModal"
            :redirect="`/admin/list-categories`" />
    </div>
</template>
