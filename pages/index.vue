<script setup>
import { useUserProfile } from '~/composables/useUserProfile.js';
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import DisplayPedidoModal from '~/components/DisplayPedidoModal.vue';

useHead({ title: 'Dashboard — PedidosApp' })

const supabase = useSupabaseClient();
const user = useSupabaseUser() ?? null;
const { profile, loading } = useUserProfile()

const misPedidos = ref(null);

const { data: pedidosData } = await useAsyncData('mis-pedidos', async () => {
  const { data, error } = await supabase
    .from('pedidos')
    .select('*')
    .eq('user_id', user.value.sub);
  if (error) throw error;
  return data;
});

misPedidos.value = pedidosData.value;

const isDisplayPedidoModalOpen = ref(false);
const selectedPedido = ref(null);

// Stats
const totalPedidos = computed(() => misPedidos.value?.length ?? 0)
const totalImporte = computed(() => {
  if (!misPedidos.value) return 0
  return misPedidos.value.reduce((acc, p) => acc + (Number(p.cost) || 0), 0)
})
const ultimoPedido = computed(() => {
  if (!misPedidos.value || misPedidos.value.length === 0) return null
  return [...misPedidos.value].sort((a, b) => b.id - a.id)[0]
})

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin],
  initialView: 'dayGridMonth',
  locale: 'es',
  buttonText: { today: 'Hoy', month: 'Mes' },
  events: (misPedidos.value ?? [])
    .filter(p => p.date)
    .map(p => ({
      title: `#${p.id} — ${Number(p.cost).toFixed(0)}€`,
      date: p.date,
      pedido_id: p.id,
      cost: p.cost,
      user_id: p.user_id,
    })),
  selectable: true,
  eventClick: function (pedido) {
    selectedPedido.value = pedido;
    isDisplayPedidoModalOpen.value = true;
  }
}))

const closeDisplayPedidoModal = () => {
  isDisplayPedidoModalOpen.value = false;
}
</script>

<template>
  <div class="pt-24 pb-12 px-6 max-w-6xl mx-auto">

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center min-h-[60vh]">
      <div class="flex flex-col items-center gap-4">
        <div class="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-slate-400 text-sm">Cargando tu panel...</p>
      </div>
    </div>

    <template v-else-if="user && profile">
      <!-- Hero header -->
      <div class="mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p class="text-sm text-indigo-400 font-medium mb-1">Panel de usuario</p>
          <h1 class="text-3xl font-bold text-white">
            Hola, <span
              style="background: linear-gradient(90deg, #6366f1, #22d3ee); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">{{
              profile.name }}</span> 👋
          </h1>
          <p class="text-slate-400 text-sm mt-1">Aquí tienes un resumen de tus pedidos</p>
        </div>
        <NuxtLink to="/create-pedido">
          <button class="btn-primary flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Pedido
          </button>
        </NuxtLink>
      </div>

      <!-- Stats cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">

        <!-- Total pedidos -->
        <div class="card-glass p-5 flex items-center gap-4">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style="background: rgba(99,102,241,0.2);">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <p class="text-2xl font-bold text-white">{{ totalPedidos }}</p>
            <p class="text-xs text-slate-400">Total de pedidos</p>
          </div>
        </div>

        <!-- Importe total -->
        <div class="card-glass p-5 flex items-center gap-4">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style="background: rgba(34,211,238,0.15);">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="text-2xl font-bold text-white">{{ totalImporte.toFixed(2) }}€</p>
            <p class="text-xs text-slate-400">Gasto acumulado</p>
          </div>
        </div>

        <!-- Último pedido -->
        <div class="card-glass p-5 flex items-center gap-4">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style="background: rgba(139,92,246,0.2);">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="text-2xl font-bold text-white">
              {{ ultimoPedido ? `#${ultimoPedido.id}` : '—' }}
            </p>
            <p class="text-xs text-slate-400">Último pedido</p>
          </div>
        </div>
      </div>

      <!-- Info row -->
      <div class="mb-6 flex items-center gap-3">
        <div class="w-1 h-5 rounded-full" style="background: linear-gradient(to bottom, #6366f1, #22d3ee);"></div>
        <h2 class="text-base font-semibold text-slate-200">Calendario de pedidos</h2>
        <span class="badge badge-indigo ml-1">Haz clic en un evento para ver detalles</span>
      </div>

      <!-- Calendar -->
      <div class="card-glass p-6">
        <ClientOnly>
          <FullCalendar :options="calendarOptions" />
        </ClientOnly>
      </div>

    </template>

    <!-- Not authenticated -->
    <div v-else class="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div class="w-16 h-16 rounded-2xl flex items-center justify-center" style="background: rgba(99,102,241,0.15);">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24"
          stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <div class="text-center">
        <h2 class="text-xl font-semibold text-white mb-2">No hay sesión activa</h2>
        <p class="text-slate-400 text-sm mb-6">Inicia sesión para ver tu panel de pedidos</p>
        <NuxtLink to="/login">
          <button class="btn-primary">Iniciar sesión</button>
        </NuxtLink>
      </div>
    </div>

  </div>

  <DisplayPedidoModal v-if="isDisplayPedidoModalOpen" @close="closeDisplayPedidoModal" :pedido="selectedPedido" />
</template>
