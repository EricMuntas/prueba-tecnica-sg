<script setup>
import { X } from 'lucide-vue-next';
import jsPDF from 'jspdf'

const loading = ref(false)
const error = ref('')
const success = ref('')

const supabase = useSupabaseClient();

const route = useRoute();
const product_id = route.params.id;

const formData = ref({
    name: '',
    description: '',
    photo_urls: [],
    start_day: null,
    end_day: null,
    price: 0,
})

// para cargar con fetch
const categories = ref([]);
const subcategories = ref([]); //todas
const subcategoriesByCategory = ref([]); // dependiendo de que categoria escoje

const selectedCategories = ref([]);
const selectedSubcategories = ref([]);

const photoFiles = ref([])

const handlePhotos = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 3) {
        error.value = 'Máximo 3 fotos permitidas.'
        e.target.value = ''
        return
    }
    photoFiles.value = files
}

// 1. Cargar todas las categorías y subcategorías disponibles
try {
    {
        const { data, error } = await supabase
            .from('categories')
            .select('*')

        if (error) console.error('Error al obtener categorias:', error)
        if (data) categories.value = data
    }
    {
        const { data, error } = await supabase
            .from('sub_categories')
            .select('*')

        if (error) console.error('Error al obtener subcategorias:', error)
        if (data) subcategories.value = data
    }
} catch (err) {
    console.error('Exception fetching data:', err)
} finally {
    loading.value = false
}

try {
    const { data: product, error: errorProduct } = await supabase
        .from('products')
        .select('*')
        .eq('id', product_id)
        .single();

    const { data: productCategories, error: errorCategories } = await supabase
        .from('products_categories')
        .select('category_id')
        .eq('product_id', product_id);

    const { data: productSubcategories, error: errorSubcategories } = await supabase
        .from('products_subcategories')
        .select('subcategory_id')
        .eq('product_id', product_id);

    const { data: fees, error: errorFees } = await supabase
        .from('fees')
        .select('*')
        .eq('product_id', product_id)
        .single();

    if (errorProduct || errorCategories || errorSubcategories || errorFees) {
        console.error('Algo ha ido mal');
    }

    if (product) {
        formData.value.name = product.name;
        formData.value.description = product.description;
    }

    if (fees) {
        formData.value.start_day = fees.start_day;
        formData.value.end_day = fees.end_day;
        formData.value.price = fees.price;
    }

    if (productCategories) {
        for (const cat of productCategories) {
            const idStr = String(cat.category_id);
            if (!selectedCategories.value.includes(idStr)) {
                selectedCategories.value.push(idStr);

                // También cargar sus subcategorías en subcategoriesByCategory
                const newSubcategories = subcategories.value.filter(
                    sub => sub.category_id === cat.category_id
                );
                subcategoriesByCategory.value.push(...newSubcategories);
            }
        }
    }

    if (productSubcategories) {
        for (const sub of productSubcategories) {
            const idStr = String(sub.subcategory_id);
            if (!selectedSubcategories.value.includes(idStr)) {
                selectedSubcategories.value.push(idStr);
            }
        }
    }

} catch (err) {
    console.error('Error cargando producto:', err)
} finally {
    loading.value = false
}

const handleSubmit = async () => {
    error.value = ''
    success.value = ''

    try {
        if (formData.value.name.trim() == '') {
            error.value = 'No puede estar el nombre en blanco.'
            return;
        }
        if (formData.value.description.trim() == '') {
            error.value = 'No puede estar la descripción en blanco.'
            return;
        }
        if (formData.value.start_day == null || formData.value.end_day == null) {
            error.value = 'Necesitas poner ambas fechas.'
            return;
        }
        if (formData.value.price == 0 || formData.value.price == null) {
            error.value = 'Necesitas poner un precio válido.'
            return;
        }

        loading.value = true

        // Subir fotos a Storage
        const uploadedUrls = []
        for (const file of photoFiles.value) {
            const fileName = `${Date.now()}-${file.name}`
            const { data: uploadData, error: uploadError } = await supabase
                .storage
                .from('products')
                .upload(fileName, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase
                .storage
                .from('products')
                .getPublicUrl(fileName)

            uploadedUrls.push(publicUrl)
        }

        // Update producto
        const { error: dbErrorProduct } = await supabase
            .from('products')
            .update({
                name: formData.value.name,
                description: formData.value.description,
                ...(uploadedUrls.length > 0 && { photo_urls: uploadedUrls }),
            })
            .eq('id', product_id);

        if (dbErrorProduct) throw dbErrorProduct

        // Update fee
        const { error: dbErrorFee } = await supabase
            .from('fees')
            .update({
                start_day: formData.value.start_day,
                end_day: formData.value.end_day,
                price: formData.value.price,
            })
            .eq('product_id', product_id)

        if (dbErrorFee) throw dbErrorFee

        // Borrar y reinsertar categorías
        await supabase.from('products_categories').delete().eq('product_id', product_id);
        for (const category of selectedCategories.value) {
            await supabase.from('products_categories').insert({
                product_id: product_id,
                category_id: Number(category),
            });
        }

        // Borrar y reinsertar subcategorías
        await supabase.from('products_subcategories').delete().eq('product_id', product_id);
        for (const subcategory of selectedSubcategories.value) {
            await supabase.from('products_subcategories').insert({
                product_id: product_id,
                subcategory_id: Number(subcategory),
            });
        }

        success.value = 'Producto actualizado.'

        setTimeout(() => {
            navigateTo('/admin/list-categories')
        }, 250)

    } catch (err) {
        error.value = err.message
    } finally {
        loading.value = false
    }
}

const handleCategoryChange = (e) => {
    if (!selectedCategories.value.includes(e.target.value)) {
        selectedCategories.value.push(e.target.value);

        const newSubcategories = subcategories.value.filter(
            subcategory => subcategory.category_id === Number(e.target.value)
        );

        subcategoriesByCategory.value.push(...newSubcategories);
    }
}

const handleSubcategoryChange = (e) => {
    if (!selectedSubcategories.value.includes(e.target.value)) {
        selectedSubcategories.value.push(e.target.value)
    }
}

const deleteSelectedCategory = (id) => {
    if (selectedCategories.value.includes(id)) {
        let index = selectedCategories.value.indexOf(id)
        selectedCategories.value.splice(index, 1);

        subcategoriesByCategory.value = subcategoriesByCategory.value.filter(
            subcategory => subcategory.category_id !== Number(id)
        );

        // También quitar subcategorías seleccionadas que pertenezcan a esta categoría
        selectedSubcategories.value = selectedSubcategories.value.filter(subId => {
            const sub = subcategories.value.find(s => s.id === Number(subId));
            return sub?.category_id !== Number(id);
        });
    }
}

const deleteSelectedSubcategory = (id) => {
    if (selectedSubcategories.value.includes(id)) {
        let index = selectedSubcategories.value.indexOf(id)
        selectedSubcategories.value.splice(index, 1);
    }
}

const getCategoryName = (categoryId) => {
    const category = categories.value.find(cat => cat.id === Number(categoryId));
    return category ? category.name : 'Error';
}

const getSubcategoryName = (subcategoryId) => {
    const subcategory = subcategories.value.find(cat => cat.id === Number(subcategoryId));
    return subcategory ? subcategory.name : 'Error';
}
// borrar modal
const isDeleteModalOpen = ref(false);
const feeToDelete = ref(null);

const openDeleteModal = (id) => {
    isDeleteModalOpen.value = true
    feeToDelete.value = id;
}

const closeDeleteModal = () => {
    isDeleteModalOpen.value = false
}
const exportToPDF = async () => {
    try {
        const { data: product } = await supabase
            .from('products')
            .select('*')
            .eq('id', product_id)
            .single()

        const { data: productCategories } = await supabase
            .from('products_categories')
            .select('category_id, categories(name)')
            .eq('product_id', product_id)

        const { data: productSubcategories } = await supabase
            .from('products_subcategories')
            .select('subcategory_id, sub_categories(name)')
            .eq('product_id', product_id)

        const doc = new jsPDF()
        let y = 20

        doc.setFontSize(18)
        doc.text('Ficha de Producto', 14, y)
        y += 12

        doc.setFontSize(12)
        doc.text(`ID: ${product.id}`, 14, y); y += 8
        doc.text(`Nombre: ${product.name}`, 14, y); y += 8

        // Descripción con salto de línea automático
        const descLines = doc.splitTextToSize(`Descripción: ${product.description}`, 180)
        doc.text(descLines, 14, y); y += descLines.length * 7 + 4

        // Categorías
        const catNames = (productCategories || []).map(c => c.categories?.name).filter(Boolean).join(', ')
        doc.text(`Categorías: ${catNames || '—'}`, 14, y); y += 8

        // Subcategorías
        const subNames = (productSubcategories || []).map(s => s.sub_categories?.name).filter(Boolean).join(', ')
        doc.text(`Subcategorías: ${subNames || '—'}`, 14, y); y += 8

        doc.save(`producto_${product_id}.pdf`)

    } catch (err) {
        error.value = 'Error al exportar PDF: ' + err.message
    }
}
</script>

<template>
    <div class="mt-4 flex justify-center items-center">
        <NuxtLink :to="`/admin/list-products`">
            <button type="button"
                class="text-white rounded-xl p-2 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 w-full">

                <span>Volver al producto</span>
            </button>
        </NuxtLink>
    </div>
    <div class="flex justify-center items-center w-full mt-4">

        <form @submit.prevent="handleSubmit" class="form-container">

            <div class="form-items">
                <label for="name">Nombre:</label>
                <input v-model="formData.name" type="text" name="name" placeholder="Nombre...">
            </div>

            <div class="form-items">
                <label for="description">Descripción:</label>
                <textarea v-model="formData.description" name="description" placeholder="Descripción..."></textarea>
            </div>

            <div>
                <label for="father-category">Categoría:</label>
                <select v-on:change="handleCategoryChange" name="father-category">
                    <option value="null" disabled selected>Selecciona una categoría...</option>
                    <option v-for="category in categories" :key="category.id" :value="category.id">
                        {{ category.name }}
                    </option>
                </select>
                <div class="flex flex-row gap-4">
                    <p>Seleccionado:</p>
                    <p v-for="selectedCategory in selectedCategories" class="flex flex-row items-center gap-1">
                        {{ getCategoryName(selectedCategory) }}
                        <span v-on:click="deleteSelectedCategory(selectedCategory)">
                            <X class="size-4 cursor-pointer"></X>
                        </span>
                    </p>
                </div>
            </div>

            <div v-if="selectedCategories.length > 0">
                <label for="sub-category">Subcategoría:</label>
                <select v-on:change="handleSubcategoryChange" name="sub-category">
                    <option value="null" disabled selected>Selecciona una subcategoría...</option>
                    <option v-for="subcategory in subcategoriesByCategory" :key="subcategory.id"
                        :value="subcategory.id">
                        {{ subcategory.name }}
                    </option>
                </select>
                <div class="flex flex-row gap-4">
                    <p>Seleccionado:</p>
                    <p v-for="selectedSubcategory in selectedSubcategories" class="flex flex-row items-center gap-1">
                        {{ getSubcategoryName(selectedSubcategory) }}
                        <span v-on:click="deleteSelectedSubcategory(selectedSubcategory)">
                            <X class="size-4 cursor-pointer"></X>
                        </span>
                    </p>
                </div>
            </div>

            <div class="flex flex-col gap-2">
                <label>Fotos (máx. 3):</label>
                <input type="file" accept="image/*" multiple @change="handlePhotos">
            </div>

            <p v-if="error" class="error">{{ error }}</p>
            <p v-if="success" class="success">{{ success }}</p>
            <button type="submit" :disabled="loading" :class="loading ? 'bg-blue-300' : 'bg-blue-500 hover:bg-blue-400'"
                class="text-white rounded-xl p-2 flex items-center justify-center gap-2">
                <span v-if="loading" class="spinner">
                    <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none"
                        viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                        </circle>
                        <path class="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                        </path>
                    </svg>
                </span>
                <span>{{ loading ? 'Guardando...' : 'Guardar cambios' }}</span>
            </button>

            <button type="button" :disabled="loading" :class="loading ? 'bg-red-300' : 'bg-red-500 hover:bg-red-400'"
                class="text-white rounded-xl p-2 flex items-center justify-center gap-2" v-on:click="openDeleteModal">
                <span>Eliminar</span>
            </button>
            <NuxtLink :to="`/admin/products/${product_id}/fees`">
                <button type="button"
                    class="text-white rounded-xl p-2 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 w-full">

                    <span>Ver tarifas</span>
                </button>
            </NuxtLink>
            <button type="button" @click="exportToPDF" :disabled="loading"
                class="text-white rounded-xl p-2 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-400 w-full">
                <span>Exportar a PDF</span>
            </button>
        </form>
    </div>
    <DeleteModal v-if="isDeleteModalOpen" table="products" :id="Number(product_id)" @close="closeDeleteModal"
        :redirect="`/admin/list-products`" />
</template>