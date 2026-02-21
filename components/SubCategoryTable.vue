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
    <div v-if="subcategories && subcategories.length > 0" class="w-full">
        <div class="table-container">
            <div class="table-header grid grid-cols-8 px-6 py-3">
                <span class="col-span-1">Nombre</span>
                <span class="col-span-1">Categoría</span>
                <span class="col-span-3">Descripción</span>
                <span class="col-span-2">Añadido el</span>
                <span class="col-span-1 text-center">Acciones</span>
            </div>
            <div v-for="subcategory in subcategories" :key="subcategory.id"
                class="table-row grid grid-cols-8 px-6 py-4 items-center">
                <span class="col-span-1 font-medium text-white">{{ subcategory.name }}</span>
                <span class="col-span-1">
                    <span class="badge badge-indigo">{{ getCategory(subcategory.category_id) }}</span>
                </span>
                <span class="col-span-3 text-slate-400 text-sm break-words pr-4">{{ subcategory.description }}</span>
                <span class="col-span-2 text-slate-500 text-sm"> {{ getDate(subcategory.created_at) }} </span>
                <span class="col-span-1 flex justify-center">
                    <NuxtLink :to="`/admin/subcategories/${subcategory.id}`"
                        class="p-2 rounded-lg text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                        title="Editar subcategoría">
                        <Pencil class="size-4"></Pencil>
                    </NuxtLink>
                </span>
            </div>
        </div>
    </div>
    <div v-else class="card-glass p-12 text-center">
        <p class="text-slate-500 italic">No hay subcategorías registradas.</p>
    </div>
</template>