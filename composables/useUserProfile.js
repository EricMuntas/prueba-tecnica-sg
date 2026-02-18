
export const useUserProfile = () => {
    const supabase = useSupabaseClient()
    const user = useSupabaseUser()
    const profile = ref(null)
    const loading = ref(false)

    const fetchProfile = async () => {
        if (!user.value?.sub) {
            return
        }

        loading.value = true

        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.value.sub)
                .single()

            if (error) {
                console.error('Error fetching profile:', error)
            }

            if (data) {
                profile.value = data
            }
        } catch (err) {
            console.error('Exception fetching profile:', err)
        } finally {
            loading.value = false
        }
    }

    // Auto-fetch cuando hay usuario
    watch(user, (newUser) => {
        if (newUser) {
            fetchProfile()
        } else {
            profile.value = null
        }
    }, { immediate: true })

    return {
        profile,
        loading,
        fetchProfile
    }
}