<script setup>
import { DollarSign, Eye, Pencil } from 'lucide-vue-next';


const props = defineProps({
    products: Object,
})

const products = ref(props.products);

const getDate = (dateString) => {
    const [year, month, day] = dateString.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
};


</script>

<template>
    <div v-if="products.length > 0" class="flex flex-col justify-center items-center gap-4 mt-4">
        <h1>Productos</h1>
        <div class="table-container">
            <div class="table-header grid grid-cols-8 p-1">
                <span class="col-span-1">Nombre</span>
                <span class="col-span-4">Descripción</span>
                <span class="col-span-2">Añadido el</span>
                <span class="col-span-1">Acciones</span>
            </div>
            <div v-for="product in products" class="grid grid-cols-8 p-1">
                <span class="col-span-1">{{ product.name }}</span>
                <span class="col-span-4 break-words">{{ product.description }}</span>
                <span class="col-span-2"> {{ getDate(product.created_at) }} </span>
                <span class="col-span-1 flex justify-center items-center">
                    <NuxtLink :to="`/admin/products/${product.id}/fees`">
                        <DollarSign></DollarSign>
                    </NuxtLink>
                    <NuxtLink :to="`/admin/products/${product.id}`">
                        <Pencil></Pencil>
                    </NuxtLink>
                </span>
            </div>
        </div>
    </div>
    <div v-else>
        <p>No hay productos</p>
    </div>

</template>