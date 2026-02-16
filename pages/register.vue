<script setup>
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
        // 1. Registrar usuario en Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: formData.value.email,
            password: formData.value.password,
        })

        if (authError) throw authError

        // 2. Insertar datos adicionales en la tabla users
        if (authData.user) {
            const { error: dbError } = await supabase
                .from('users')
                .insert({
                    id: authData.user.id, // Usa el mismo ID del auth
                    name: formData.value.username,
                    email: formData.value.email,
                })

            if (dbError) throw dbError

            success.value = 'Usuario registrado exitosamente'

            // Redirigir después de 2 segundos
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
    <form @submit.prevent="handleRegister">
        <h1>Register</h1>

        <label for="username">Username:</label>
        <input v-model="formData.username" type="text" name="username" id="username" required>

        <label for="mail">Mail:</label>
        <input v-model="formData.email" type="email" name="mail" id="mail" required>

        <label for="password">Password:</label>
        <input v-model="formData.password" type="password" name="password" id="password" required minlength="6">

        <button type="submit" :disabled="loading">
            {{ loading ? 'Registrando...' : 'Registrar' }}
        </button>

        <p v-if="error" class="error">{{ error }}</p>
        <p v-if="success" class="success">{{ success }}</p>
    </form>

    <NuxtLink to="/login">¿Ya tienes cuenta? Inicia sesión</NuxtLink>
</template>



<style scoped>
input {
    @apply border-2 border-black rounded;
}

.error {
    color: red;
    margin-top: 10px;
}

.success {
    color: green;
    margin-top: 10px;
}

button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>