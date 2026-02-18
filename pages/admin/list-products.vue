<script setup>
const supabase = useSupabaseClient();

const products = ref(null);
const loading = ref(null);

try {
    {
        const { data, error } = await supabase
            .from('products')
            .select('*')

        if (error) {
            console.error('Error al obtener categorias:', error)
        }

        if (data) {
            products.value = data
        }

    }

} catch (err) {
    console.error('Exception fetching profile:', err)
} finally {
    loading.value = false
}


</script>


<template>

    <NuxtLink to="/admin/create-product">
        <div class="w-full h-10 bg-purple-500 hover:bg-purple-400 text-white flex justify-evenly items-center">
            CREAR PRODUCTO
        </div>
    </NuxtLink>

    <ProductTable :products="products"></ProductTable>

</template>