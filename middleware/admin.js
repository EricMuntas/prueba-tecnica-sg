// middleware/admin.ts
export default defineNuxtRouteMiddleware(async () => {
    const user = useSupabaseUser()
    const client = useSupabaseClient()

    // No autenticado
    if (!user.value) {
        return navigateTo('/login')
    }

    // Verificar rol en la tabla de perfiles
    const { data: profile } = await client
        .from('users')
        .select('role')
        .eq('id', user.value.sub)
        .single()

    console.log(user)

    if (profile?.role !== 'admin') {
        return navigateTo('/unauthorized')
    }
})