<script setup>
useHead({ title: 'Crear cuenta — PedidosApp' })

const supabase = useSupabaseClient()

const formData = ref({
    username: '',
    email: '',
    password: ''
})

const loading = ref(false)
const error = ref('')
const success = ref('')

const handleRegister = async () => {
    loading.value = true
    error.value = ''
    success.value = ''

    try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: formData.value.email,
            password: formData.value.password,
        })

        if (authError) throw authError

        if (authData.user) {
            const { error: dbError } = await supabase
                .from('users')
                .insert({
                    id: authData.user.id,
                    name: formData.value.username,
                    email: formData.value.email,
                })

            if (dbError) throw dbError

            success.value = 'Cuenta creada correctamente. Redirigiendo...'

            setTimeout(() => {
                navigateTo('/login')
            }, 2000)
        }

    } catch (err) {
        error.value = err.message
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div class="min-h-screen flex items-center justify-center px-4">
        <!-- Background decorations -->
        <div class="absolute inset-0 overflow-hidden pointer-events-none">
            <div class="absolute top-1/3 right-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl"
                style="background: radial-gradient(circle, #8b5cf6, transparent);"></div>
            <div class="absolute bottom-1/3 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
                style="background: radial-gradient(circle, #22d3ee, transparent);"></div>
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
                    <h1 class="text-2xl font-bold text-white mb-1">Crea tu cuenta</h1>
                    <p class="text-sm text-slate-400">Empieza a gestionar tus pedidos hoy</p>
                </div>

                <form @submit.prevent="handleRegister" class="flex flex-col gap-4">

                    <div class="form-items">
                        <label for="username" class="form-label">Nombre de usuario</label>
                        <input v-model="formData.username" type="text" name="username" id="username"
                            placeholder="Tu nombre" required />
                    </div>

                    <div class="form-items">
                        <label for="mail" class="form-label">Correo electrónico</label>
                        <input v-model="formData.email" type="email" name="mail" id="mail" placeholder="tu@email.com"
                            required />
                    </div>

                    <div class="form-items">
                        <label for="password" class="form-label">Contraseña</label>
                        <input v-model="formData.password" type="password" name="password" id="password"
                            placeholder="Mín. 6 caracteres" required minlength="6" />
                    </div>

                    <p v-if="error" class="error flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 flex-shrink-0" fill="none"
                            viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {{ error }}
                    </p>

                    <p v-if="success" class="success flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 flex-shrink-0" fill="none"
                            viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {{ success }}
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
                        {{ loading ? 'Creando cuenta...' : 'Crear cuenta' }}
                    </button>
                </form>

                <p class="mt-6 text-center text-sm text-slate-500">
                    ¿Ya tienes cuenta?
                    <NuxtLink to="/login" class="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                        Inicia sesión
                    </NuxtLink>
                </p>
            </div>
        </div>
    </div>
</template>