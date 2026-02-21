<script setup>
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

const closeModal = () => { emit('close') }

const handleDelete = async () => {
    loading.value = true;
    try {
        const { error: deleteError } = await supabase
            .from(table.value)
            .delete()
            .eq('id', idToDelete.value);

        if (deleteError) {
            error.value = deleteError.message;
        } else {
            setTimeout(() => {
                navigateTo(redirect.value);
            }, 250);
        }
    } catch (e) {
        error.value = e.message;
    } finally {
        loading.value = false;
    }
}
</script>

<template>
    <!-- Backdrop -->
    <div class="fixed inset-0 z-50 flex justify-center items-center p-4"
        style="background: rgba(0,0,0,0.7); backdrop-filter: blur(6px);" @click.self="closeModal">

        <!-- Modal card -->
        <div class="card-glass w-full max-w-sm p-6 animate-modal">

            <!-- Warning icon -->
            <div class="flex justify-center mb-4">
                <div class="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style="background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.2);">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor" stroke-width="1.8">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
            </div>

            <h3 class="text-lg font-bold text-white text-center mb-2">¿Eliminar elemento?</h3>
            <p class="text-sm text-slate-400 text-center mb-1">Esta acción no se puede deshacer.</p>
            <p class="text-xs text-red-400 text-center mb-6">El elemento será eliminado permanentemente.</p>

            <p v-if="error" class="error text-center mb-4">{{ error }}</p>

            <div class="flex gap-3">
                <button type="button" @click="closeModal" class="btn-secondary flex-1">
                    Cancelar
                </button>
                <button type="button" @click="handleDelete" :disabled="loading"
                    class="btn-danger flex-1 flex items-center justify-center gap-2">
                    <svg v-if="loading" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none"
                        viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                        </circle>
                        <path class="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                        </path>
                    </svg>
                    {{ loading ? 'Eliminando...' : 'Eliminar' }}
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
@keyframes modal-in {
    from {
        opacity: 0;
        transform: scale(0.95) translateY(8px);
    }

    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

.animate-modal {
    animation: modal-in 0.2s ease-out forwards;
}
</style>
