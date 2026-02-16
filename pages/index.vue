<script setup>
import { useUserProfile } from '~/composables/useUserProfile.js';


useHead({
  title: 'Index'
})
const user = useSupabaseUser() ?? null;
console.log('user-----------------------')
console.log(user.value);
console.log('-----------------------')
console.log('auth-----------------------')
const { profile, loading } = useUserProfile()
console.log(profile.value)
console.log('-----------------------')
</script>
<template>
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
    </div>

    <div v-else>
      <p>No hay usuario autenticado</p>
      <NuxtLink to="/login">Iniciar sesión</NuxtLink>
    </div>
  </div>
</template>
