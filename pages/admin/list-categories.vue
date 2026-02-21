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
    <div class="page-wrapper">
        <div class="max-w-6xl w-full mx-auto">
            <!-- Header Section -->
            <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div>
                    <div class="flex items-center gap-2 mb-2 text-indigo-400">
                        <NuxtLink to="/admin/admin-panel" class="hover:text-indigo-300 transition-colors">Panel Admin
                        </NuxtLink>
                        <span>/</span>
                        <span class="font-semibold uppercase tracking-wider text-xs">Productos</span>
                    </div>
                    <h1 class="text-3xl font-bold text-white">Gestión de Categorías</h1>
                </div>

                <NuxtLink to="/admin/create-category" class="flex items-center gap-2 group">
                    <button class="btn-primary flex items-center gap-2 rounded-xl">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Nuevo Categoría/Subcategoría
                    </button>
                </NuxtLink>
            </div>

            <!-- Tab Navigation -->
            <div class="flex gap-1 mb-8 p-1 bg-white/5 rounded-xl border border-white/10 w-fit">
                <NuxtLink to="/admin/list-categories"
                    class="px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                    :class="[$route.path === '/admin/list-categories' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5']">
                    Categorías
                </NuxtLink>
                <NuxtLink to="/admin/list-subcategories"
                    class="px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                    :class="[$route.path === '/admin/list-subcategories' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5']">
                    Subcategorías
                </NuxtLink>
            </div>

            <!-- Table Section -->
            <div class="relative">
                <div v-if="loading" class="flex justify-center p-20">
                    <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
                <CategoryTable v-else :categories="categories"></CategoryTable>
            </div>
        </div>
    </div>
</template>