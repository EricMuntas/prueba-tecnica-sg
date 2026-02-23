<script setup>
import { ChevronLeft, ChevronRight, Tag } from 'lucide-vue-next';

const supabase = useSupabaseClient();

const products = ref([]);
const loading = ref(true);

// Carrusel: índice de foto activa por producto
const activePhoto = ref({});

const getCurrentFee = (fees) => {
    if (!fees || fees.length === 0) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return fees.find(fee => {
        const start = new Date(fee.start_day);
        const end = new Date(fee.end_day);
        return today >= start && today <= end;
    }) ?? null;
};

const nextPhoto = (productId, total) => {
    const current = activePhoto.value[productId] ?? 0;
    activePhoto.value[productId] = (current + 1) % total;
};

const prevPhoto = (productId, total) => {
    const current = activePhoto.value[productId] ?? 0;
    activePhoto.value[productId] = (current - 1 + total) % total;
};

try {
    const { data, error } = await supabase
        .from('products')
        .select(`
            *,
            fees (
                id,
                start_day,
                end_day,
                price
            ),
            products_categories (
                categories ( id, name )
            )
        `)
        .order('created_at', { ascending: false });

    if (error) throw error;

    if (data) {
        products.value = data;
        // Inicializar carrusel
        data.forEach(p => {
            activePhoto.value[p.id] = 0;
        });
    }
} catch (err) {
    console.error('Error fetching products:', err);
} finally {
    loading.value = false;
}
</script>

<template>
    <div class="page-wrapper px-4">
        <div class="max-w-7xl w-full mx-auto pb-20">

            <!-- Header -->
            <div class="mb-12 text-center">
                <h1 class="text-4xl font-bold text-white mb-3">Nuestros Productos</h1>
                <p class="text-slate-400 max-w-xl mx-auto text-sm">Explora toda nuestra colección y consulta las tarifas
                    actuales.</p>
            </div>

            <!-- Loading -->
            <div v-if="loading" class="flex justify-center items-center py-32">
                <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
            </div>

            <!-- Empty state -->
            <div v-else-if="products.length === 0" class="card-glass p-16 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="size-12 text-slate-600 mx-auto mb-4" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round"
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p class="text-slate-500 italic">No hay productos disponibles por el momento.</p>
            </div>

            <!-- Products Grid -->
            <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <div v-for="product in products" :key="product.id"
                    class="card-glass overflow-hidden flex flex-col group hover:border-indigo-500/30  transition-all duration-300">

                    <!-- Photo / Carousel -->
                    <div class="relative w-full h-52 bg-white/5 overflow-hidden">
                        <!-- Con fotos -->
                        <template v-if="product.photo_urls && product.photo_urls.length > 0">
                            <img :src="product.photo_urls[activePhoto[product.id] ?? 0]" :alt="product.name"
                                class="w-full h-full object-cover transition-opacity duration-300" />

                            <!-- Controles carrusel (solo si hay más de 1 foto) -->
                            <template v-if="product.photo_urls.length > 1">
                                <button @click.prevent="prevPhoto(product.id, product.photo_urls.length)"
                                    class="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-sm border border-white/10">
                                    <ChevronLeft class="size-4" />
                                </button>
                                <button @click.prevent="nextPhoto(product.id, product.photo_urls.length)"
                                    class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-sm border border-white/10">
                                    <ChevronRight class="size-4" />
                                </button>

                                <!-- Dots -->
                                <div class="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                                    <button v-for="(_, idx) in product.photo_urls" :key="idx"
                                        @click.prevent="activePhoto[product.id] = idx"
                                        class="w-1.5 h-1.5 rounded-full transition-all duration-200" :class="(activePhoto[product.id] ?? 0) === idx
                                            ? 'bg-white scale-125'
                                            : 'bg-white/40 hover:bg-white/70'" />
                                </div>
                            </template>
                        </template>

                        <!-- Sin fotos -->
                        <template v-else>
                            <div class="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-600">
                                <svg xmlns="http://www.w3.org/2000/svg" class="size-10" fill="none" viewBox="0 0 24 24"
                                    stroke="currentColor" stroke-width="1">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span class="text-xs">Sin imagen</span>
                            </div>
                        </template>

                        <!-- Badge precio actual (si hay tarifa vigente) -->
                        <div v-if="getCurrentFee(product.fees)"
                            class="absolute top-3 right-3 bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                            {{ Number(getCurrentFee(product.fees).price).toLocaleString('es-ES', {
                                style: 'currency', currency: 'EUR'
                            }) }}
                        </div>
                        <div v-else
                            class="absolute top-3 right-3 bg-slate-700/80 backdrop-blur-sm text-slate-400 text-xs font-medium px-2.5 py-1 rounded-full">
                            Sin tarifa
                        </div>
                    </div>

                    <!-- Card body -->
                    <div class="p-5 flex flex-col gap-3 flex-1">
                        <div>
                            <h3 class="text-white font-semibold text-base leading-snug">{{ product.name }}</h3>
                            <p class="text-slate-400 text-xs mt-1.5 line-clamp-3 leading-relaxed">
                                {{ product.description }}
                            </p>
                        </div>

                        <!-- Categorías -->
                        <div v-if="product.products_categories && product.products_categories.length > 0"
                            class="flex flex-wrap gap-1.5 mt-auto pt-3 border-t border-white/5">
                            <span v-for="pc in product.products_categories" :key="pc.categories?.id"
                                class="badge badge-indigo flex items-center gap-1">
                                <Tag class="size-2.5" />
                                {{ pc.categories?.name }}
                            </span>
                        </div>

                        <!-- Info tarifa activa -->
                        <div v-if="getCurrentFee(product.fees)"
                            class="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
                            <div class="text-xs text-slate-500">Tarifa vigente hasta:</div>
                            <div class="text-xs font-medium text-emerald-400">
                                {{ new Date(getCurrentFee(product.fees).end_day).toLocaleDateString('es-ES') }}
                            </div>
                        </div>
                        <div v-else-if="product.fees && product.fees.length > 0"
                            class="mt-auto pt-3 border-t border-white/5 text-xs text-slate-500 italic">
                            Sin tarifa activa actualmente
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>