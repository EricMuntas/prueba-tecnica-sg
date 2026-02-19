<script setup>
import * as XLSX from 'xlsx'

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
    <NuxtLink to="/admin/create-product">
        <div class="w-full h-10 bg-purple-500 hover:bg-purple-400 text-white flex justify-evenly items-center">
            CREAR PRODUCTO
        </div>
    </NuxtLink>
    <div class="mt-4 flex justify-center items-center">
        <button type="button" @click="exportToXLS" :disabled="!products"
            class="text-white rounded-xl p-2 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed">
            <span>Exportar a XLS</span>
        </button>
    </div>
    <ProductTable :products="products"></ProductTable>
</template>