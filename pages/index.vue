<script setup>
import { useUserProfile } from '~/composables/useUserProfile.js';
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'

useHead({ title: 'Index' })

const supabase = useSupabaseClient();

const user = useSupabaseUser() ?? null;
const { profile, loading } = useUserProfile()

const events = ref([
  { title: 'Evento 1', start: '2026-02-19' }
])

const misPedidos = ref(null);

try {

  const { data, error } = await supabase
    .from('pedidos')
    .select('*')
    .eq('user_id', user.value.sub);

  if (error) throw error;

  misPedidos.value = data;

} catch (error) {

}



const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin],
  initialView: 'dayGridMonth',
  // ✅ Array vacío por defecto evita el crash
  events: (misPedidos.value ?? [])
    .filter(p => p.date)
    .map(p => ({
      title: `Pedido #${p.id} - $${p.cost}`,
      date: p.date,
    })),
  selectable: true,
}))
</script>
<template>
  <NuxtLink to="/create-pedido">
    <div class="w-full h-10 bg-purple-500 hover:bg-purple-400 text-white flex justify-evenly items-center">
      CREAR PEDIDO
    </div>
  </NuxtLink>
  <div>
    <h1>Index</h1>

    <div v-if="loading">
      Cargando datos del usuario...
    </div>

    <div v-else-if="user && profile">
      <h2>Bienvenido, {{ profile.name }}!</h2>
      <p>Email: {{ profile.email }}</p>
      <p>ID: {{ user.id }}</p>
      <p>Role: {{ user.role ?? "..." }}</p>
      <div class="w-1/3">
        <FullCalendar :options="calendarOptions" class=""></FullCalendar>
      </div>

    </div>

    <div v-else>
      <p>No hay usuario autenticado</p>
      <NuxtLink to="/login">Iniciar sesión</NuxtLink>
    </div>
  </div>
</template>
