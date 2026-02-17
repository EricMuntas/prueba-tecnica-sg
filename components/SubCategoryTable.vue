<script setup>
import { Eye, Pencil } from 'lucide-vue-next';



const props = defineProps({
    subcategories: Object,
    categories: Object,
})

const subcategories = ref(props.subcategories);
const categories = ref(props.categories);

const getDate = (dateString) => {
    const [year, month, day] = dateString.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
};

const getCategory = (categoryId) => {
    const category = categories.value.find(cat => cat.id === categoryId);
    return category ? category.name : 'Sin categoría';
};

</script>

<template>
    <div v-if="subcategories.length > 0" class="flex flex-col justify-center items-center gap-4 mt-4">
        <h1>Subcategorias</h1>
        <div class="table-container">
            <div class="table-header grid grid-cols-8 p-1">
                <span class="col-span-1">Nombre</span>
                <span class="col-span-1">Categoría</span>
                <span class="col-span-3">Descripción</span>
                <span class="col-span-2">Añadido el</span>
                <span class="col-span-1">Acciones</span>
            </div>
            <div v-for="subcategory in subcategories" class="grid grid-cols-8 p-1">
                <span class="col-span-1">{{ subcategory.name }}</span>
                <span class="col-span-1">{{ getCategory(subcategory.category_id) }}</span>
                <span class="col-span-3 break-words">{{ subcategory.description }}</span>
                <span class="col-span-2"> {{ getDate(subcategory.created_at) }} </span>
                <span class="col-span-1">
                    <Pencil></Pencil>
                </span>
            </div>
        </div>
    </div>
    <div v-else>
        <p>No hay subcategorías</p>
    </div>
</template>