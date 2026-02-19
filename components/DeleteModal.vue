<script setup>
import Default from '~/layouts/default.vue';

const supabase = useSupabaseClient();

const props = defineProps({

    table: String,
    id: Number,
    redirect: {
        type: String,
        default: '/admin/admin-panel',
    }
})

const emit = defineEmits(['close'])

const table = ref(props.table);
const idToDelete = ref(props.id);
const redirect = ref(props.redirect);

const loading = ref(false)
const error = ref('')
const success = ref('')

const closeModal = () => {
    emit('close')
}

const handleDelete = async () => {
    loading.value = true;
    try {
        const { data, error } = await supabase
            .from(table.value)
            .delete()
            .eq('id', idToDelete.value);


        if (error) {
            console.error('Error al borrar la categoría:', error)
        } else {


            setTimeout(() => {
                // navigateTo('/admin/list-categories')
                navigateTo(redirect.value);
            }, 250);

        }


    } catch (error) {
    }


}


</script>
<template>
    <div class="fixed inset-0 bg-black/50 z-50 flex justify-center items-center">

        <div class=" bg-white rounded-xl flex flex-col p-4 justify-between gap-4">

            <div>
                <p>¿Estás seguro de que quieres eliminar este elemento?</p>
                <p class="error">Esta acción no se puede deshacer.</p>
            </div>
            <div class="flex justify-end items-center gap-4">

                <button type="button" :disabled="loading" :class="'bg-blue-500 hover:bg-blue-400'"
                    class="text-white rounded-xl p-2 flex items-center justify-center gap-2" @click="closeModal">
                    <span>Cancelar</span>
                </button>

                <!-- Eliminar -->
                <button v-on:click="handleDelete" type="button" :disabled="loading"
                    :class="loading ? 'bg-red-300' : 'bg-red-500 hover:bg-red-400'"
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
                    <span>{{ loading ? 'Elmininando...' : 'Eliminar' }}</span>
                </button>
            </div>

        </div>

    </div>
</template>
