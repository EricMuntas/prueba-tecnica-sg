<script setup>
import { X } from 'lucide-vue-next';
import jsPDF from 'jspdf'
definePageMeta({
    middleware: 'admin'
})

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
    <div class="page-wrapper">
        <div class="w-full max-w-4xl">
            <!-- Header -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div>
                    <div
                        class="flex items-center gap-2 text-slate-500 text-xs font-medium uppercase tracking-wider mb-2">
                        <NuxtLink to="/admin/list-products" class="hover:text-indigo-400 transition-colors">Productos
                        </NuxtLink>
                        <span>/</span>
                        <span class="text-slate-300">Editar producto</span>
                    </div>
                    <h1 class="text-3xl font-bold text-white">Editar producto</h1>
                </div>

                <div class="flex items-center gap-3">
                    <button @click="exportToPDF" :disabled="loading"
                        class="btn-secondary flex items-center gap-2 border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/40">
                        <svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Exportar PDF</span>
                    </button>
                    <NuxtLink :to="`/admin/products/${product_id}/fees`"
                        class="btn-secondary flex items-center gap-2 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/40">
                        <svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Gestionar tarifas</span>
                    </NuxtLink>
                    <NuxtLink to="/admin/list-products" class="btn-secondary flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Volver</span>
                    </NuxtLink>
                </div>
            </div>

            <form @submit.prevent="handleSubmit" class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Left Column: Basic Info & Categories -->
                <div class="space-y-6">
                    <div class="form-container">
                        <h2
                            class="text-lg font-semibold text-white mb-2 flex items-center gap-2 border-b border-white/5 pb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" class="size-5 text-indigo-400" fill="none"
                                viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Información general
                        </h2>

                        <div class="form-items text-white">
                            <label for="name" class="form-label">Nombre del producto</label>
                            <input v-model="formData.name" type="text" name="name" id="name"
                                placeholder="Ej: Hamburguesa Suprema...">
                        </div>

                        <div class="form-items text-white">
                            <label for="description" class="form-label">Descripción detallada</label>
                            <textarea v-model="formData.description" name="description" id="description"
                                placeholder="Ingredientes, alérgenos, etc..." rows="6"></textarea>
                        </div>
                    </div>

                    <div class="form-container">
                        <h2
                            class="text-lg font-semibold text-white mb-2 flex items-center gap-2 border-b border-white/5 pb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" class="size-5 text-amber-400" fill="none"
                                viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            Categorización
                        </h2>

                        <div class="form-items text-white">
                            <label for="categories" class="form-label">Añadir Categoría</label>
                            <select @change="handleCategoryChange" name="categories" id="categories">
                                <option value="null" disabled selected>Selecciona una categoría...</option>
                                <option v-for="category in categories" :key="category.id" :value="category.id">
                                    {{ category.name }}
                                </option>
                            </select>

                            <!-- Chips -->
                            <div class="flex flex-wrap gap-2 mt-3">
                                <div v-for="catId in selectedCategories" :key="catId"
                                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm">
                                    <span>{{ getCategoryName(catId) }}</span>
                                    <button type="button" @click="deleteSelectedCategory(catId)"
                                        class="hover:text-white transition-colors">
                                        <X class="size-3.5"></X>
                                    </button>
                                </div>
                                <p v-if="selectedCategories.length === 0" class="text-slate-500 text-xs italic">Ninguna
                                    categoría seleccionada</p>
                            </div>
                        </div>

                        <div v-if="selectedCategories.length > 0"
                            class="form-items text-white mt-4 border-t border-white/5 pt-4">
                            <label for="subcategories" class="form-label">Añadir Subcategoría</label>
                            <select @change="handleSubcategoryChange" name="subcategories" id="subcategories">
                                <option value="null" disabled selected>Selecciona una subcategoría...</option>
                                <option v-for="sub in subcategoriesByCategory" :key="sub.id" :value="sub.id">
                                    {{ sub.name }}
                                </option>
                            </select>

                            <!-- Chips -->
                            <div class="flex flex-wrap gap-2 mt-3">
                                <div v-for="subId in selectedSubcategories" :key="subId"
                                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
                                    <span>{{ getSubcategoryName(subId) }}</span>
                                    <button type="button" @click="deleteSelectedSubcategory(subId)"
                                        class="hover:text-white transition-colors">
                                        <X class="size-3.5"></X>
                                    </button>
                                </div>
                                <p v-if="selectedSubcategories.length === 0" class="text-slate-500 text-xs italic">
                                    Ninguna subcategoría seleccionada</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Column: Initial Fee & Photos -->
                <div class="space-y-6">
                    <div class="form-container">
                        <h2
                            class="text-lg font-semibold text-white mb-2 flex items-center gap-2 border-b border-white/5 pb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" class="size-5 text-emerald-400" fill="none"
                                viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Tarifa inicial
                        </h2>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="form-items text-white">
                                <label for="start-day" class="form-label">Fecha inicio</label>
                                <input v-model="formData.start_day" type="date" name="start-day" id="start-day">
                            </div>
                            <div class="form-items text-white">
                                <label for="end-day" class="form-label">Fecha fin</label>
                                <input v-model="formData.end_day" type="date" name="end-day" id="end-day">
                            </div>
                        </div>

                        <div class="form-items text-white mt-2">
                            <label for="price" class="form-label">Precio (€)</label>
                            <div class="relative">
                                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs">€</span>
                                <input v-model="formData.price" type="number" step="0.01" min="0" name="price"
                                    id="price" placeholder="0.00" class="pl-8">
                            </div>
                        </div>

                        <p
                            class="text-[10px] text-slate-500 mt-2 bg-white/5 p-2 rounded-lg leading-tight uppercase tracking-tight italic">
                            Nota: Para editar tarifas históricas o añadir nuevas, utiliza el botón "Gestionar tarifas"
                            en la cabecera.
                        </p>
                    </div>

                    <div class="form-container">
                        <h2
                            class="text-lg font-semibold text-white mb-2 flex items-center gap-2 border-b border-white/5 pb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" class="size-5 text-purple-400" fill="none"
                                viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Material visual
                        </h2>

                        <div class="form-items text-white">
                            <label for="photos" class="form-label">Actualizar fotos (Máx. 3)</label>
                            <label class="photo-upload-zone group">
                                <input type="file" id="photos" accept="image/*" multiple @change="handlePhotos"
                                    class="hidden">
                                <div class="flex flex-col items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg"
                                        class="size-8 text-slate-500 group-hover:text-indigo-400 transition-colors mb-2"
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                                        <path stroke-linecap="round" stroke-linejoin="round"
                                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <span class="text-sm font-medium text-slate-400 group-hover:text-slate-300">Arrastra
                                        o haz click para subir</span>
                                    <span class="text-[10px] text-slate-600 mt-1 uppercase tracking-wider">Formatos:
                                        JPG, PNG, WEBP</span>
                                </div>
                            </label>

                            <div v-if="photoFiles.length > 0" class="mt-4">
                                <p class="text-xs font-semibold text-indigo-400 mb-2 uppercase tracking-wider">Archivos
                                    preparados:</p>
                                <ul class="space-y-1">
                                    <li v-for="(file, idx) in photoFiles" :key="idx"
                                        class="text-xs text-slate-400 flex items-center justify-between bg-white/5 px-2 py-1.5 rounded-lg border border-white/5">
                                        <span class="truncate max-w-[150px]">{{ file.name }}</span>
                                        <span class="text-[10px] text-slate-600">{{ (file.size / 1024).toFixed(1) }}
                                            KB</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <p class="text-[10px] text-slate-500 mt-2 italic leading-tight uppercase tracking-tight">
                            Nota: Subir nuevas fotos reemplazará las actuales del producto.
                        </p>
                    </div>

                    <div v-if="error || success" class="p-4 rounded-xl border"
                        :class="error ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'">
                        <p class="text-sm text-center font-medium" :class="error ? 'text-red-400' : 'text-emerald-400'">
                            {{ error || success }}
                        </p>
                    </div>

                    <div class="flex flex-col gap-3">
                        <button type="submit" :disabled="loading"
                            class="btn-primary w-full py-4 text-base flex items-center justify-center gap-3">
                            <span v-if="loading"
                                class="animate-spin size-5 border-2 border-white/30 border-t-white rounded-full"></span>
                            <span>{{ loading ? 'Sincronizando...' : 'Guardar cambios' }}</span>
                        </button>

                        <button type="button" :disabled="loading" @click="openDeleteModal"
                            class="w-full py-4 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-all font-semibold text-sm">
                            Eliminar producto
                        </button>
                    </div>
                </div>
            </form>
        </div>

        <DeleteModal v-if="isDeleteModalOpen" table="products" :id="Number(product_id)" @close="closeDeleteModal"
            :redirect="`/admin/list-products`" />
    </div>
</template>
