<script setup>
useHead({
  title: 'PedidosApp',
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
  ]
})
</script>

<template>
  <div class="min-h-screen" style="background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);">
    <Navbar />
    <slot />
  </div>
</template>