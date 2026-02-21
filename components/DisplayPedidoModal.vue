<script setup>
const props = defineProps({
    pedido: Object,
})

const pedido = ref(props.pedido);
const emit = defineEmits(['close'])

const closeModal = () => { emit('close') }

const goToEdit = async () => {
    emit('close')
    await nextTick()
    await navigateTo(`/pedido/${Number(pedido.value.event.extendedProps.pedido_id)}/edit-pedido`)
}

const formattedDate = computed(() => {
    const raw = pedido.value?.event?.startStr
    if (!raw) return '—'
    return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(raw))
})

const formattedCost = computed(() => {
    const cost = pedido.value?.event?.extendedProps?.cost
    return cost != null ? `${Number(cost).toFixed(2)} €` : '—'
})
</script>

<template>
    <!-- Backdrop -->
    <div class="fixed inset-0 z-50 flex justify-center items-center p-4"
        style="background: rgba(0,0,0,0.7); backdrop-filter: blur(6px);" @click.self="closeModal">

        <!-- Modal card -->
        <div class="card-glass w-full max-w-sm p-6 animate-modal">

            <!-- Header -->
            <div class="flex items-center gap-3 mb-5">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style="background: rgba(99,102,241,0.15);">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-indigo-400" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                </div>
                <div>
                    <h3 class="text-base font-bold text-white">Detalle del pedido</h3>
                    <p class="text-xs text-slate-500">Pedido #{{ pedido.event.extendedProps.pedido_id }}</p>
                </div>
            </div>

            <!-- Info rows -->
            <div class="flex flex-col gap-3 mb-6">
                <div class="flex items-center justify-between py-2.5 px-3 rounded-xl"
                    style="background: rgba(255,255,255,0.04);">
                    <span class="text-xs text-slate-400">Importe</span>
                    <span class="text-sm font-bold text-white">{{ formattedCost }}</span>
                </div>
                <div class="flex items-center justify-between py-2.5 px-3 rounded-xl"
                    style="background: rgba(255,255,255,0.04);">
                    <span class="text-xs text-slate-400">Fecha</span>
                    <span class="text-sm text-slate-200">{{ formattedDate }}</span>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-3">
                <button type="button" @click="closeModal" class="btn-secondary flex-1">
                    Cerrar
                </button>
                <button type="button" @click="goToEdit"
                    class="btn-primary flex-1 flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Editar pedido
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