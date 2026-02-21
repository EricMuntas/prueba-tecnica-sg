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
    <div v-if="products && products.length > 0" class="w-full">
        <div class="table-container">
            <div class="table-header grid grid-cols-8 px-6 py-3">
                <span class="col-span-1">Nombre</span>
                <span class="col-span-4">Descripción</span>
                <span class="col-span-2">Añadido el</span>
                <span class="col-span-1 text-center">Acciones</span>
            </div>
            <div v-for="product in products" :key="product.id"
                class="table-row grid grid-cols-8 px-6 py-4 items-center">
                <span class="col-span-1 font-medium text-white">{{ product.name }}</span>
                <span class="col-span-4 text-slate-400 text-sm break-words pr-4">{{ product.description }}</span>
                <span class="col-span-2 text-slate-500 text-sm"> {{ getDate(product.created_at) }} </span>
                <span class="col-span-1 flex justify-center items-center gap-1">
                    <NuxtLink :to="`/admin/products/${product.id}/fees`"
                        class="p-2 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                        title="Gestionar tarifas">
                        <DollarSign class="size-4"></DollarSign>
                    </NuxtLink>
                    <NuxtLink :to="`/admin/products/${product.id}`"
                        class="p-2 rounded-lg text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                        title="Editar producto">
                        <Pencil class="size-4"></Pencil>
                    </NuxtLink>
                </span>
            </div>
        </div>
    </div>
    <div v-else class="card-glass p-12 text-center">
        <p class="text-slate-500 italic">No hay productos registrados.</p>
    </div>
</template>