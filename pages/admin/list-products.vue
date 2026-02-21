<script setup>
import * as XLSX from 'xlsx'
definePageMeta({
    middleware: 'admin'
})
const supabase = useSupabaseClient();

const products = ref(null);
const products_categories = ref(null);
const products_subcategories = ref(null);
const loading = ref(null);

try {
    {
        {
            const { data, error } = await supabase
                .from('products')
                .select('*')

            if (error) {
                console.error('Error al obtener productos:', error)
            }

            if (data) {
                products.value = data
            }
        }
        {
            const { data, error } = await supabase
                .from('products_categories')
                .select('*')

            if (error) {
                console.error('Error al obtener categorias:', error)
            }

            if (data) {
                products_categories.value = data
            }
        }
        {
            const { data, error } = await supabase
                .from('products_subcategories')
                .select('*')

            if (error) {
                console.error('Error al obtener subcategorias:', error)
            }

            if (data) {
                products_subcategories.value = data
            }
        }
    }

} catch (err) {
    console.error('Exception fetching profile:', err)
} finally {
    loading.value = false
}

function exportToXLS() {
    if (!products.value) return;

    // Hoja 1: Productos
    const productsData = products.value.map(p => ({
        ID: p.id,
        Nombre: p.name,
        Descripción: p.description,
    }));

    // Hoja 2: Categorías por producto
    const categoriesData = (products_categories.value || []).map(c => ({
        Product_ID: c.product_id,
        Category_ID: c.category_id,
    }));

    // Hoja 3: Subcategorías por producto
    const subcategoriesData = (products_subcategories.value || []).map(s => ({
        Product_ID: s.product_id,
        Subcategory_ID: s.subcategory_id,
    }));

    const wb = XLSX.utils.book_new();

    const wsProducts = XLSX.utils.json_to_sheet(productsData);
    const wsCategories = XLSX.utils.json_to_sheet(categoriesData);
    const wsSubcategories = XLSX.utils.json_to_sheet(subcategoriesData);

    // Ajustar anchos de columna
    wsProducts['!cols'] = [{ wch: 10 }, { wch: 30 }, { wch: 50 }];
    wsCategories['!cols'] = [{ wch: 15 }, { wch: 15 }];
    wsSubcategories['!cols'] = [{ wch: 15 }, { wch: 18 }];

    XLSX.utils.book_append_sheet(wb, wsProducts, 'Productos');
    XLSX.utils.book_append_sheet(wb, wsCategories, 'Categorías');
    XLSX.utils.book_append_sheet(wb, wsSubcategories, 'Subcategorías');

    XLSX.writeFile(wb, 'productos_export.xlsx');
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
                        <span class="font-semibold uppercase tracking-wider text-xs">Inventario</span>
                    </div>
                    <h1 class="text-3xl font-bold text-white">Gestión de Productos</h1>
                </div>

                <div class="flex items-center gap-3">
                    <button type="button" @click="exportToXLS" :disabled="!products"
                        class="btn-secondary flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Exportar Excel</span>
                    </button>
                    <NuxtLink to="/admin/create-product" class="btn-primary flex items-center gap-2 group">
                        <svg xmlns="http://www.w3.org/2000/svg"
                            class="w-4 h-4 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Nuevo Producto</span>
                    </NuxtLink>
                </div>
            </div>

            <!-- Table Section -->
            <div class="relative mt-8">
                <div v-if="loading" class="flex justify-center p-20">
                    <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
                <ProductTable v-else :products="products"></ProductTable>
            </div>
        </div>
    </div>
</template>