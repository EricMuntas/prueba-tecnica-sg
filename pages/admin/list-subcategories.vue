<script setup>
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
    const { data, error } = await supabase
        .from('sub_categories')
        .select('*')

    if (error) {
        console.error('Error al obtener subcategorias:', error)
    }

    if (data) {
        subcategories.value = data
    }

} catch (err) {
    console.error('Exception fetching profile:', err)
} finally {
    loading.value = false
}



const viewSelector = ref('categories');

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


    <SubCategoryTable :subcategories="subcategories" :categories="categories"></SubCategoryTable>

</template>