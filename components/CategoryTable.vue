<script setup>
import { Eye, Pencil } from 'lucide-vue-next';


const props = defineProps({
    categories: Object,
})

const categories = ref(props.categories);

const getDate = (dateString) => {
    const [year, month, day] = dateString.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
};


</script>

<template>
    <div v-if="categories.length > 0" class="flex flex-col justify-center items-center gap-4 mt-4">
        <h1>Categorias</h1>
        <div class="table-container">
            <div class="table-header grid grid-cols-8 p-1">
                <span class="col-span-1">Nombre</span>
                <span class="col-span-4">Descripción</span>
                <span class="col-span-2">Añadido el</span>
                <span class="col-span-1">Acciones</span>
            </div>
            <div v-for="category in categories" class="grid grid-cols-8 p-1">
                <span class="col-span-1">{{ category.name }}</span>
                <span class="col-span-4 break-words">{{ category.description }}</span>
                <span class="col-span-2"> {{ getDate(category.created_at) }} </span>
                <span class="col-span-1">
                    <NuxtLink :to="`/admin/categories/${category.id}`">
                        <Pencil></Pencil>
                    </NuxtLink>
                </span>
            </div>
        </div>
    </div>
    <div v-else>
        <p>No hay categorías</p>
    </div>

</template>