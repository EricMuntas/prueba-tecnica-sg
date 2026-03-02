<script setup>
const props = defineProps({
    pedido: Object,
})

const pedido = ref(props.pedido)
const emit = defineEmits(['close'])

const supabase = useSupabaseClient()

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

// ── Product lines ──────────────────────────────────────────
const lines = ref([])
const loadingLines = ref(true)

const pedidoId = computed(() => pedido.value?.event?.extendedProps?.pedido_id)

onMounted(async () => {
    if (!pedidoId.value) return
    try {
        // 1. Get pedido_products rows
        const { data: productLines, error: linesError } = await supabase
            .from('pedidos_products')
            .select('product_id, quantity')
            .eq('pedido_id', pedidoId.value)

        if (linesError) throw linesError

        // 2. For each line get product name + current price (same logic as edit-pedido)
        const today = new Date().toISOString().split('T')[0]

        lines.value = await Promise.all(
            productLines.map(async (line) => {
                // Product name
                const { data: product } = await supabase
                    .from('products')
                    .select('name')
                    .eq('id', line.product_id)
                    .single()

                // Current fee price (vigente → most recent fallback)
                let price = 0
                const { data: vigente } = await supabase
                    .from('fees')
                    .select('price')
                    .eq('product_id', line.product_id)
                    .lte('start_day', today)
                    .gte('end_day', today)
                    .order('start_day', { ascending: false })
                    .limit(1)
                    .single()

                if (vigente) {
                    price = vigente.price
                } else {
                    const { data: reciente } = await supabase
                        .from('fees')
                        .select('price')
                        .eq('product_id', line.product_id)
                        .order('start_day', { ascending: false })
                        .limit(1)
                        .single()
                    price = reciente?.price ?? 0
                }

                return {
                    name: product?.name ?? 'Producto desconocido',
                    quantity: line.quantity,
                    price,
                    total: Number(price) * line.quantity,
                }
            })
        )
    } catch (e) {
        console.error('Error cargando líneas del pedido:', e)
    } finally {
        loadingLines.value = false
    }
})
</script>

<template>
    <!-- Backdrop -->
    <div class="fixed inset-0 z-50 flex justify-center items-center p-4"
        style="background: rgba(0,0,0,0.7); backdrop-filter: blur(6px);" @click.self="closeModal">

        <!-- Modal card -->
        <div class="card-glass w-full max-w-md p-6 animate-modal">

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
            <div class="flex flex-col gap-3 mb-5">
                <div class="flex items-center justify-between py-2.5 px-3 rounded-xl"
                    style="background: rgba(255,255,255,0.04);">
                    <span class="text-xs text-slate-400">Importe total</span>
                    <span class="text-sm font-bold text-white">{{ formattedCost }}</span>
                </div>
                <div class="flex items-center justify-between py-2.5 px-3 rounded-xl"
                    style="background: rgba(255,255,255,0.04);">
                    <span class="text-xs text-slate-400">Fecha</span>
                    <span class="text-sm text-slate-200">{{ formattedDate }}</span>
                </div>
            </div>

            <!-- Products section -->
            <div class="mb-6">
                <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Productos</p>

                <!-- Loading -->
                <div v-if="loadingLines" class="flex items-center justify-center py-6">
                    <div class="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>

                <!-- Empty -->
                <div v-else-if="lines.length === 0"
                    class="text-center py-4 text-xs text-slate-500 rounded-xl"
                    style="background: rgba(255,255,255,0.03);">
                    Sin productos registrados
                </div>

                <!-- Table -->
                <div v-else class="rounded-xl overflow-hidden" style="background: rgba(255,255,255,0.03);">
                    <!-- Table header -->
                    <div class="grid grid-cols-10 px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide"
                        style="border-bottom: 1px solid rgba(255,255,255,0.06);">
                        <span class="col-span-5">Producto</span>
                        <span class="col-span-2 text-center">Cant.</span>
                        <span class="col-span-3 text-right">Total</span>
                    </div>
                    <!-- Rows -->
                    <div v-for="(line, i) in lines" :key="i"
                        class="grid grid-cols-10 px-3 py-2.5 items-center text-sm"
                        :style="i < lines.length - 1 ? 'border-bottom: 1px solid rgba(255,255,255,0.04)' : ''">
                        <span class="col-span-5 text-slate-200 font-medium truncate">{{ line.name }}</span>
                        <span class="col-span-2 text-center text-slate-400">× {{ line.quantity }}</span>
                        <span class="col-span-3 text-right font-semibold text-indigo-300">
                            {{ line.total.toFixed(2) }} €
                        </span>
                    </div>
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