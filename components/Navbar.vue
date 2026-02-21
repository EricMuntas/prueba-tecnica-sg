<script setup>
import { useUserProfile } from '~/composables/useUserProfile.js';
const supabase = useSupabaseClient();
const user = useSupabaseUser();
const { profile } = useUserProfile()

const signOut = async () => {

    try {
        await supabase.auth.signOut()
    }
    finally {
        navigateTo('/')
    }
}

const getInitial = computed(() => {
    if (profile.value?.name) return profile.value.name.charAt(0).toUpperCase()
    if (user.value?.email) return user.value.email.charAt(0).toUpperCase()
    return '?'
})
</script>

<template>
    <nav class="fixed top-0 left-0 right-0 z-40 h-16"
        style="background: rgba(15,15,26,0.8); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.07);">
        <div class="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">

            <!-- Logo -->
            <NuxtLink to="/" class="flex items-center gap-2.5 group">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center"
                    style="background: linear-gradient(135deg, #6366f1, #8b5cf6);">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                    </svg>
                </div>
                <span class="font-bold text-white text-sm tracking-wide">PedidosApp</span>
            </NuxtLink>

            <!-- Right side -->
            <div class="flex items-center gap-2">

                <!-- Admin Panel link -->
                <NuxtLink v-if="profile && profile.role == 'admin'" to="/admin/admin-panel" class="nav-link text-xs">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Admin
                </NuxtLink>

                <!-- User info + logout -->
                <div v-if="user && user.role == 'authenticated'" class="flex items-center gap-2">
                    <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                        style="background: rgba(255,255,255,0.06);">
                        <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                            style="background: linear-gradient(135deg, #6366f1, #8b5cf6);">
                            {{ getInitial }}
                        </div>
                        <span v-if="profile" class="text-sm text-slate-300 hidden sm:block">{{ profile.name }}</span>
                    </div>
                    <button @click="signOut"
                        class="nav-link text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Salir
                    </button>
                </div>

                <NuxtLink v-else to="/login" class="btn-primary text-sm px-4 py-2">
                    Entrar
                </NuxtLink>

            </div>
        </div>
    </nav>
</template>