<script setup>
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

        // Redirigir al dashboard o página principal
        navigateTo('/dashboard') // Cambia esto a tu ruta deseada

    } catch (err) {
        error.value = err.message || 'Error al iniciar sesión'
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <form @submit.prevent="handleLogin">
        <h1>Login</h1>

        <label for="mail">Mail:</label>
        <input v-model="formData.email" type="email" name="mail" id="mail" required>

        <label for="password">Password:</label>
        <input v-model="formData.password" type="password" name="password" id="password" required>

        <button type="submit" :disabled="loading">
            {{ loading ? 'Iniciando sesión...' : 'Iniciar sesión' }}
        </button>

        <p v-if="error" class="error">{{ error }}</p>
    </form>

    <NuxtLink to="/register">¿No tienes cuenta? Regístrate</NuxtLink>
</template>



<style scoped>
input {
    @apply border-2 border-black rounded;
}

.error {
    color: red;
    margin-top: 10px;
}

button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>