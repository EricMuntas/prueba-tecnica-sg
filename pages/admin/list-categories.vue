<script setup>
definePageMeta({
    middleware: 'admin'
})
const supabase = useSupabaseClient();

const categories = ref(null);
const subcategories = ref(null);
const loading = ref(null);

try {
    {
        const { data, error } = await supabase
            .from('categories')
            .select('*')

        if (error) {
            console.error('Error al obtener categorias:', error)
        }

        if (data) {
            categories.value = data
        }

    }
} catch (err) {
    console.error('Exception fetching profile:', err)
} finally {
    loading.value = false
}

</script>
<template>

    <NuxtLink to="/admin/create-category">
        <div class="w-full h-10 bg-purple-500 hover:bg-purple-400 text-white flex justify-evenly items-center">
            CREAR CATEGORÍA
        </div>
    </NuxtLink>

    <div class="w-full h-10 bg-black text-white flex justify-evenly items-center">
        <NuxtLink :to="'/admin/list-categories'" class="w-full h-full select-view">
            CATEGORIAS
        </NuxtLink>
        <NuxtLink :to="'/admin/list-subcategories'" class="w-full h-full select-view">
            SUBCATEGORIAS
        </NuxtLink>
    </div>

    <CategoryTable :categories="categories"></CategoryTable>


</template>