<script setup>
import { X } from 'lucide-vue-next';


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
    <div class="flex justify-center items-center w-full mt-20">
        <form @submit.prevent="handleSubmit" class="form-container">

            <div class="form-items">
                <label for="name">
                    Nombre:
                </label>
                <input v-model="formData.name" type="text" name="name" id="" placeholder="Nombre...">
            </div>

            <div class="form-items">
                <label for="description">
                    Descripción:
                </label>
                <textarea v-model="formData.description" name="description" id=""
                    placeholder="Descripción..."></textarea>
            </div>

            <div>
                <label for="father-category">Categoría:</label>
                <select v-on:change="handleCategoryChange" name="father-category" id="">
                    <option value="null" disabled="" selected>Selecciona una categoría...</option>
                    <option v-for="category in categories" :key="category.id" :value="category.id"> {{ category.name }}
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
                <label for="father-category">Subcategoría:</label>
                <select v-on:change="handleSubcategoryChange" name="father-category" id="">
                    <option value="null" disabled="" selected>Selecciona una subcategoría...</option>
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


            <div class="">
                <h3>Tarifa inicial</h3>
            </div>
            <div class="flex gap-2">
                <label for="start-day">Dia inicial:</label>
                <input v-model="formData.start_day" type="date" name="start-day">
            </div>

            <div class="flex gap-2">
                <label for="end-day">Dia final:</label>
                <input v-model="formData.end_day" type="date" name="end-day">
            </div>


            <div class="flex gap-2">
                <label for="price">Precio:</label>
                <input v-model="formData.price" type="number" min="0" name="price" placeholder="1.99">
            </div>

            <div class="flex flex-col gap-2">
                <label>Fotos (máx. 3):</label>
                <input type="file" accept="image/*" multiple @change="handlePhotos">
                <p class="text-sm text-gray-500">{{ formData.photo_urls.length }}/3 fotos seleccionadas</p>
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
                <span>{{ loading ? 'Creando...' : 'Crear' }}</span>
            </button>

        </form>
    </div>
</template>
