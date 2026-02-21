<script setup>
useHead({ title: 'Panel de Administración — PedidosApp' })
definePageMeta({ middleware: 'admin' })

const adminLinks = [
    {
        to: '/admin/list-categories',
        label: 'Categorías',
        description: 'Gestiona las categorías de productos',
        icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>`,
        color: 'rgba(99,102,241,0.15)',
        textColor: '#818cf8',
    },
    {
        to: '/admin/list-subcategories',
        label: 'Subcategorías',
        description: 'Organiza subcategorías de productos',
        icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>`,
        color: 'rgba(139,92,246,0.15)',
        textColor: '#a78bfa',
    },
    {
        to: '/admin/list-products',
        label: 'Productos',
        description: 'Añade, edita o elimina productos',
        icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"/>`,
        color: 'rgba(34,211,238,0.12)',
        textColor: '#22d3ee',
    },

]
</script>

<template>
    <div class="pt-24 pb-12 px-6 max-w-5xl mx-auto">

        <div class="mb-10">
            <div class="flex items-center gap-2 mb-2">
                <div class="w-6 h-6 rounded flex items-center justify-center" style="background: rgba(99,102,241,0.2);">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-indigo-400" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                </div>
                <span class="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Administración</span>
            </div>
            <h1 class="text-3xl font-bold text-white">Panel de administración</h1>
            <p class="text-slate-400 text-sm mt-1">Gestiona todos los recursos de la plataforma</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <NuxtLink v-for="link in adminLinks" :key="link.to" :to="link.to" class="group block">
                <div class="card-glass p-6 h-full transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl cursor-pointer"
                    style="border: 1px solid rgba(255,255,255,0.08);">
                    <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                        :style="`background: ${link.color};`">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor" stroke-width="1.8" :style="`color: ${link.textColor};`"
                            v-html="link.icon">
                        </svg>
                    </div>
                    <h2 class="text-base font-semibold text-white mb-1 group-hover:text-indigo-300 transition-colors">
                        {{ link.label }}
                    </h2>
                    <p class="text-sm text-slate-500 leading-snug">{{ link.description }}</p>
                    <div class="mt-4 flex items-center gap-1 text-xs font-medium transition-colors duration-200"
                        :style="`color: ${link.textColor};`">
                        <span>Gestionar</span>
                        <svg xmlns="http://www.w3.org/2000/svg"
                            class="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none"
                            viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </div>
            </NuxtLink>
        </div>

    </div>
</template>