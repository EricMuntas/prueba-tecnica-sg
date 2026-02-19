<script setup>
import { useUserProfile } from '~/composables/useUserProfile.js';
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'

useHead({ title: 'Index' })

const user = useSupabaseUser() ?? null;
const { profile, loading } = useUserProfile()

const events = ref([
  { title: 'Evento 1', start: '2026-02-19' }
])

const calendarOptions = ref({
  plugins: [dayGridPlugin],
  initialView: 'dayGridMonth',
  events: events.value
})

// Para añadir un evento dinámicamente:
function addEvent() {
  events.value.push({ title: 'Nuevo evento', start: '2026-02-25' })
  calendarOptions.value.events = [...events.value]
}
</script>
<template>
  <NuxtLink to="/create-order">
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
