<script setup>
import { X } from 'lucide-vue-next';
definePageMeta({
    middleware: 'admin'
})

const loading = ref(false)
const error = ref('')
const success = ref('')

const supabase = useSupabaseClient();

const product_id = ref(null);


const formData = ref({

    name: '',
    description: '',
    photo_urls: [],
    start_day: null,
    end_day: null,
    price: 0,
    categories_id: null,
    subcategories_id: null,

})

// para cargar con fetch
const categories = ref(null);
const subcategories = ref(null); //todas
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
    {
        const { data, error } = await supabase
            .from('sub_categories')
            .select('*')

        if (error) {
            console.error('Error al obtener subcategorias:', error)
        }

        if (data) {
            subcategories.value = data
        }

    }

} catch (err) {
    console.error('Exception fetching data:', err)
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

        // Hacemos el insert y seleccionamos el id del mismo producto a la vez
        // para poder usarlo en nuevas relaciones
        try {
            const { data: product, error: dbErrorProduct } = await supabase
                .from('products')
                .insert({
                    name: formData.value.name,
                    description: formData.value.description,
                    photo_urls: uploadedUrls,

                })
                .select('id')
                .single();

            product_id.value = product.id;

            if (dbErrorProduct) throw dbErrorProduct
        } catch (error) {

        } finally {

            const { error: dbErrorFee } = await supabase
                .from('fees')
                .insert({
                    product_id: product_id.value,
                    start_day: formData.value.start_day,
                    end_day: formData.value.end_day,
                    price: formData.value.price,
                })

            if (dbErrorFee) throw dbErrorFee

            for (const category of selectedCategories.value) {
                const { data: product, error: dbErrorProduct } = await supabase
                    .from('products_categories')
                    .insert({
                        product_id: product_id.value,
                        category_id: Number(category),
                    });
            }

            for (const subcategory of selectedSubcategories.value) {
                const { data: product, error: dbErrorProduct } = await supabase
                    .from('products_subcategories')
                    .insert({
                        product_id: product_id.value,
                        subcategory_id: Number(subcategory),
                    });
            }
        }

        success.value = 'Producto creado.'
        //toast

        setTimeout(() => {
            navigateTo('/admin/list-categories')
        }, 250)

    } catch (err) {
        error.value = err.message
    } finally {
        // loading.value = false

    }

}

const handleCategoryChange = (e) => {

    // e.target.value = id caregoria

    if (!selectedCategories.value.includes(e.target.value)) {
        selectedCategories.value.push(e.target.value);

        const newSubcategories = subcategories.value.filter(
            subcategory => subcategory.category_id === Number(e.target.value)
        );

        subcategoriesByCategory.value.push(...newSubcategories);

        console.log(subcategoriesByCategory.value);

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


</script>
<template>
    <div class="page-wrapper px-4">
        <div class="max-w-3xl w-full mx-auto pb-20">
            <!-- Header section -->
            <div class="mb-10">
                <NuxtLink to="/admin/list-products"
                    class="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 text-sm w-fit">
                    <svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Volver al inventario</span>
                </NuxtLink>
                <div class="flex items-center gap-2 mb-2 text-indigo-400">
                    <div class="w-1.5 h-1.5 rounded-full bg-current"></div>
                    <span class="font-semibold uppercase tracking-wider text-xs">Administración</span>
                </div>
                <h1 class="text-3xl font-bold text-white">Nuevo Producto</h1>
                <p class="text-slate-400 text-sm mt-1">Añade un nuevo producto a tu catálogo con imágenes y categorías.
                </p>
            </div>

            <form @submit.prevent="handleSubmit" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Main Info -->
                <div class="lg:col-span-2 flex flex-col gap-6">
                    <div class="form-container">
                        <h2 class="text-lg font-semibold text-white mb-2 flex items-center gap-2">
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
                                placeholder="Nombre del producto...">
                        </div>

                        <div class="form-items text-white">
                            <label for="description" class="form-label">Descripción detailada</label>
                            <textarea v-model="formData.description" name="description" id="description"
                                placeholder="Descripción..." rows="5"></textarea>
                        </div>
                    </div>

                    <div class="form-container">
                        <h2 class="text-lg font-semibold text-white mb-2 flex items-center gap-2">
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
                                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">€</span>
                                <input v-model="formData.price" type="number" step="0.01" min="0" name="price"
                                    id="price" placeholder="0.00" class="pl-8">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Sidebar Info -->
                <div class="flex flex-col gap-6">
                    <!-- Categories -->
                    <div class="form-container">
                        <h2 class="text-lg font-semibold text-white mb-2 flex items-center gap-2 text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" class="size-5 text-purple-400" fill="none"
                                viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            Clasificación
                        </h2>

                        <div class="form-items text-white text-white">
                            <label class="form-label text-white text-white">Categorías</label>
                            <select @change="handleCategoryChange" class="mb-2 ">
                                <option value="null" disabled selected class="text-black">Añadir categoría...</option>
                                <option v-for="category in categories" :key="category.id" :value="category.id"
                                    class="text-black">
                                    {{ category.name }}
                                </option>
                            </select>
                            <div class="flex flex-wrap gap-2 mt-2">
                                <span v-for="catId in selectedCategories" :key="catId"
                                    class="badge badge-indigo flex items-center gap-1.5 py-1.5 pr-1.5 pl-3">
                                    {{ getCategoryName(catId) }}
                                    <button @click="deleteSelectedCategory(catId)" type="button"
                                        class="p-0.5 hover:bg-white/10 rounded transition-colors">
                                        <X class="size-3"></X>
                                    </button>
                                </span>
                                <p v-if="selectedCategories.length === 0" class="text-xs text-slate-500 italic px-1">Sin
                                    categorías seleccionadas</p>
                            </div>
                        </div>

                        <div v-if="selectedCategories.length > 0"
                            class="form-items text-white mt-4 animate-in fade-in duration-300">
                            <label class="form-label text-white text-white">Subcategorías</label>
                            <select @change="handleSubcategoryChange" class="mb-2">
                                <option value="null" disabled selected>Añadir subcategoría...</option>
                                <option v-for="sub in subcategoriesByCategory" :key="sub.id" :value="sub.id">
                                    {{ sub.name }}
                                </option>
                            </select>
                            <div class="flex flex-wrap gap-2 mt-2">
                                <span v-for="subId in selectedSubcategories" :key="subId"
                                    class="badge badge-indigo bg-purple-500/20 text-purple-300 border-purple-500/30 flex items-center gap-1.5 py-1.5 pr-1.5 pl-3">
                                    {{ getSubcategoryName(subId) }}
                                    <button @click="deleteSelectedSubcategory(subId)" type="button"
                                        class="p-0.5 hover:bg-white/10 rounded transition-colors">
                                        <X class="size-3"></X>
                                    </button>
                                </span>
                                <p v-if="selectedSubcategories.length === 0" class="text-xs text-slate-500 italic px-1">
                                    Sin subcategorías</p>
                            </div>
                        </div>
                    </div>

                    <!-- Photos -->
                    <div class="form-container">
                        <h2 class="text-lg font-semibold text-white mb-2 flex items-center gap-2 text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" class="size-5 text-cyan-400" fill="none"
                                viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Imágenes
                        </h2>

                        <div class="form-items text-white text-white">
                            <label class="form-label text-white text-white">Fotos (máx. 3)</label>
                            <div
                                class="group relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/10 rounded-xl hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all cursor-pointer">
                                <input type="file" accept="image/*" multiple @change="handlePhotos"
                                    class="absolute inset-0 opacity-0 cursor-pointer">
                                <svg xmlns="http://www.w3.org/2000/svg"
                                    class="size-8 text-slate-500 mb-2 group-hover:text-indigo-400 transition-colors"
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                <span class="text-xs text-slate-400 group-hover:text-slate-300">Click para subir o
                                    arrastra</span>
                            </div>
                            <div class="mt-3 space-y-2">
                                <div v-for="(file, idx) in photoFiles" :key="idx"
                                    class="flex items-center justify-between text-xs py-2 px-3 bg-white/5 rounded-lg border border-white/10">
                                    <span class="truncate max-w-[150px]">{{ file.name }}</span>
                                    <span class="text-slate-500">{{ (file.size / 1024).toFixed(0) }} KB</span>
                                </div>
                                <p v-if="photoFiles.length === 0" class="text-xs text-slate-500 text-center italic">
                                    Ninguna foto seleccionada</p>
                                <p v-else
                                    class="text-[10px] text-center text-indigo-400 font-medium uppercase tracking-widest">
                                    {{ photoFiles.length }}/3 FOTOS</p>
                            </div>
                        </div>

                        <!-- Submit Section inside Sidebar for better UX -->
                        <div class="mt-8 border-t border-white/10 pt-6">
                            <div v-if="error || success" class="mb-4">
                                <p v-if="error" class="error text-xs mb-2">{{ error }}</p>
                                <p v-if="success" class="success text-xs mb-2">{{ success }}</p>
                            </div>

                            <button type="submit" :disabled="loading"
                                class="btn-primary w-full flex items-center justify-center gap-2">
                                <svg v-if="loading" class="animate-spin size-4" xmlns="http://www.w3.org/2000/svg"
                                    fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                        stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                                    </path>
                                </svg>
                                <span>{{ loading ? 'Creando...' : 'Crear Producto' }}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    </div>
</template>
