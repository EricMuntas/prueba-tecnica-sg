<script setup>
definePageMeta({
    middleware: 'admin'
})
const loading = ref(false)

const supabase = useSupabaseClient();

const route = useRoute();
const product_id = route.params.id;

const fees = ref(null);

try {
    {
        const { data, error } = await supabase
            .from('fees')
            .select('*')
            .eq('product_id', Number(product_id))
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error al obtener las tarifas:', error)
        }

        if (data) {
            fees.value = data
        }

    }

} catch (err) {
    console.error('Exception fetching profile:', err)
} finally {
    loading.value = false
}

</script>
<template>
    <div class="page-wrapper">
        <div class="w-full max-w-5xl">
            <FeeTable :fees="fees" :product_id="product_id"></FeeTable>
        </div>
    </div>
</template>