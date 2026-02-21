<script setup>
useHead({ title: 'Iniciar sesión — PedidosApp' })

const supabase = useSupabaseClient()

const formData = ref({
    email: '',
    password: ''
})

const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
    loading.value = true
    error.value = ''

    try {
        const { data, error: loginError } = await supabase.auth.signInWithPassword({
            email: formData.value.email,
            password: formData.value.password,
        })

        if (loginError) throw loginError

        navigateTo('/')

    } catch (err) {
        error.value = err.message || 'Error al iniciar sesión'
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div class="min-h-screen flex items-center justify-center px-4">
        <!-- Background decorations -->
        <div class="absolute inset-0 overflow-hidden pointer-events-none">
            <div class="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl"
                style="background: radial-gradient(circle, #6366f1, transparent);"></div>
            <div class="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
                style="background: radial-gradient(circle, #8b5cf6, transparent);"></div>
        </div>

        <div class="relative w-full max-w-md">
            <!-- Logo -->
            <div class="flex justify-center mb-8">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30"
                        style="background: linear-gradient(135deg, #6366f1, #8b5cf6);">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white" fill="none"
                            viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                        </svg>
                    </div>
                    <span class="text-xl font-bold text-white">PedidosApp</span>
                </div>
            </div>

            <!-- Card -->
            <div class="card-glass p-8">
                <div class="mb-6">
                    <h1 class="text-2xl font-bold text-white mb-1">Bienvenido de nuevo</h1>
                    <p class="text-sm text-slate-400">Inicia sesión para continuar</p>
                </div>

                <form @submit.prevent="handleLogin" class="flex flex-col gap-4">

                    <div class="form-items">
                        <label for="mail" class="form-label">Correo electrónico</label>
                        <input v-model="formData.email" type="email" name="mail" id="mail" placeholder="tu@email.com"
                            required />
                    </div>

                    <div class="form-items">
                        <label for="password" class="form-label">Contraseña</label>
                        <input v-model="formData.password" type="password" name="password" id="password"
                            placeholder="••••••••" required />
                    </div>

                    <p v-if="error" class="error flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 flex-shrink-0" fill="none"
                            viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {{ error }}
                    </p>

                    <button type="submit" :disabled="loading"
                        class="btn-primary w-full flex items-center justify-center gap-2 mt-2">
                        <svg v-if="loading" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none"
                            viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                            </circle>
                            <path class="opacity-75" fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                            </path>
                        </svg>
                        {{ loading ? 'Iniciando sesión...' : 'Iniciar sesión' }}
                    </button>
                </form>

                <p class="mt-6 text-center text-sm text-slate-500">
                    ¿No tienes cuenta?
                    <NuxtLink to="/register"
                        class="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                        Regístrate gratis
                    </NuxtLink>
                </p>
            </div>
        </div>
    </div>
</template>