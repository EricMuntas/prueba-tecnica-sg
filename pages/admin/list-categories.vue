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
            console.log('Categorias cargadas existosamente:', data)
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
        console.log('Categorias cargadas existosamente:', data)
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
        <span class="select-view" v-on:click="() => { viewSelector = 'categories' }">CATEGORIAS</span>
        <span class="select-view" v-on:click="() => { viewSelector = 'subcategories' }">SUBCATEGORIAS</span>
    </div>

    <CategoryTable v-if="viewSelector == 'categories'" :categories="categories"></CategoryTable>
    <SubCategoryTable v-if="viewSelector == 'subcategories'" :subcategories="subcategories" :categories="categories">
    </SubCategoryTable>

</template>