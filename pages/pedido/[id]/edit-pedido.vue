<script setup>
import { X } from 'lucide-vue-next';

useHead({ title: 'Editar Pedido — PedidosApp' })

const route = useRoute();
const pedidoId = Number(route.params.id);

const loading = ref(false);
const error = ref(false);
const success = ref(false);

const supabase = useSupabaseClient();
const user = useSupabaseUser();

const formData = ref({
    products: [],
    date: '',
});

const allProducts = ref([]);
const showingAllProducts = ref([]);
const searchingProduct = ref('');

const totalImporte = computed(() => {
    return formData.value.products.reduce((acc, item) => {
        return acc + (Number(item.price) * item.quantity);
    }, 0);
});

const getPriceForProduct = async (productId) => {
    const today = new Date().toISOString().split('T')[0];

    const { data: vigente } = await supabase
        .from('fees')
        .select('price')
        .eq('product_id', productId)
        .lte('start_day', today)
        .gte('end_day', today)
        .order('start_day', { ascending: false })
        .limit(1)
        .single();

    if (vigente) return vigente.price;

    const { data: reciente } = await supabase
        .from('fees')
        .select('price')
        .eq('product_id', productId)
        .order('start_day', { ascending: false })
        .limit(1)
        .single();

    return reciente?.price ?? 0;
};

const loadPedido = async () => {
    try {
        const { data: pedido, error: pedidoError } = await supabase
            .from('pedidos')
            .select('id, date, cost, user_id')
            .eq('id', pedidoId)
            .single();

        if (pedidoError) return navigateTo('/unauthorized');
        if (pedido.user_id !== user.value.sub) return navigateTo('/unauthorized');

        formData.value.date = pedido.date ?? '';

        const { data: lines, error: linesError } = await supabase
            .from('pedidos_products')
            .select('product_id, quantity')
            .eq('pedido_id', pedidoId);

        if (linesError) throw linesError;

        formData.value.products = await Promise.all(
            lines.map(async (line) => {
                const product = allProducts.value.find(p => p.id === line.product_id);
                const price = await getPriceForProduct(line.product_id);
                return {
                    ...(product ?? { id: line.product_id, name: 'Producto desconocido' }),
                    quantity: line.quantity,
                    price,
                };
            })
        );

    } catch (e) {
        error.value = e.message;
    }
};

const handleSubmit = async () => {
    if (formData.value.products.length === 0) {
        error.value = 'Añade al menos un producto';
        return;
    }

    loading.value = true;
    error.value = false;
    success.value = false;

    try {
        const { error: pedidoError } = await supabase
            .from('pedidos')
            .update({ cost: totalImporte.value, date: formData.value.date })
            .eq('id', pedidoId);

        if (pedidoError) throw pedidoError;

        const { error: deleteError } = await supabase
            .from('pedidos_products')
            .delete()
            .eq('pedido_id', pedidoId);

        if (deleteError) throw deleteError;

        const pedidoProducts = formData.value.products.map(item => ({
            pedido_id: pedidoId,
            product_id: item.id,
            quantity: item.quantity,
        }));

        const { error: productsError } = await supabase
            .from('pedidos_products')
            .insert(pedidoProducts);

        if (productsError) throw productsError;

        success.value = 'Pedido actualizado correctamente';

    } catch (e) {
        error.value = e.message;
    } finally {
        loading.value = false;
    }
};

try {
    const { data, error: supabaseError } = await supabase.from('products').select('*');
    if (supabaseError) throw supabaseError;
    if (data) allProducts.value = data;
} catch (e) {
    error.value = e.message;
}

await loadPedido();

watch(searchingProduct, (newValue) => {
    if (!newValue || newValue.trim() === '') {
        showingAllProducts.value = [];
        return;
    }
    showingAllProducts.value = allProducts.value.filter(product =>
        product.name.toLowerCase().includes(newValue.toLowerCase())
    );
});

const selectProduct = async (product) => {
    const yaExiste = formData.value.products.some(p => p.id === product.id);
    if (!yaExiste) {
        searchingProduct.value = '';
        showingAllProducts.value = [];
        const price = await getPriceForProduct(product.id);
        formData.value.products.push({ ...product, price, quantity: 1 });
    }
};

const handleDeleteProduct = (product) => {
    const index = formData.value.products.findIndex(p => p.id === product.id);
    if (index !== -1) {
        formData.value.products.splice(index, 1);
    }
};

const isDeleteModalOpen = ref(false);
const openDeleteModal = () => { isDeleteModalOpen.value = true };
const closeDeleteModal = () => { isDeleteModalOpen.value = false };
</script>

<template>
    <div class="pt-24 pb-12 px-6 max-w-3xl mx-auto">

        <!-- Page header -->
        <div class="mb-8 flex items-start justify-between">
            <div>
                <div class="flex items-center gap-2 mb-1">
                    <p class="text-sm text-indigo-400 font-medium">Pedidos</p>
                    <span class="badge badge-indigo">Editando #{{ pedidoId }}</span>
                </div>
                <h1 class="text-2xl font-bold text-white">Editar pedido</h1>
                <p class="text-slate-400 text-sm mt-1">Modifica los productos o la fecha del pedido</p>
            </div>
            <NuxtLink to="/" class="btn-secondary text-sm flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Volver
            </NuxtLink>
        </div>

        <form @submit.prevent="handleSubmit" class="flex flex-col gap-6">

            <!-- Search box -->
            <div class="card-glass p-5">
                <h2 class="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-indigo-400" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Añadir producto
                </h2>
                <div class="form-items relative">
                    <input v-model="searchingProduct" type="text" name="search-bar" id="search-bar"
                        placeholder="Buscar producto..." />
                    <div v-if="showingAllProducts.length > 0"
                        class="dropdown-container absolute left-0 right-0 top-full z-10">
                        <div v-for="product in showingAllProducts" :key="product.id" class="dropdown-item"
                            @click="selectProduct(product)">
                            {{ product.name }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Feedback -->
            <p v-if="error" class="error flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ error }}
            </p>
            <p v-if="success" class="success flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ success }}
            </p>

            <!-- Products table -->
            <div v-if="formData.products.length > 0" class="card-glass overflow-hidden">
                <div class="table-header grid grid-cols-10 px-4 py-3 items-center">
                    <span class="col-span-4">Producto</span>
                    <span class="col-span-2">Cantidad</span>
                    <span class="col-span-2">Precio unit.</span>
                    <span class="col-span-1">Total</span>
                    <span class="col-span-1"></span>
                </div>
                <div v-for="product in formData.products" :key="product.id"
                    class="table-row grid grid-cols-10 px-4 py-3 items-center">
                    <span class="col-span-4 text-sm text-slate-200 font-medium">{{ product.name }}</span>
                    <input v-model.number="product.quantity" class="col-span-2 !w-20 !py-1.5 !px-2 text-center text-sm"
                        name="quantity" type="number" min="1" placeholder="1" />
                    <span class="col-span-2 text-sm text-slate-300">
                        {{ product.price != null ? `${Number(product.price).toFixed(2)}€` : 'Sin precio' }}
                    </span>
                    <span class="col-span-1 text-sm font-semibold text-indigo-300">
                        {{ (Number(product.price) * product.quantity).toFixed(2) }}€
                    </span>
                    <button type="button" @click="handleDeleteProduct(product)"
                        class="col-span-1 w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all p-0">
                        <X class="w-3.5 h-3.5" />
                    </button>
                </div>

                <!-- Total row -->
                <div class="px-4 py-3 flex justify-end items-center gap-2"
                    style="border-top: 1px solid rgba(255,255,255,0.06);">
                    <span class="text-sm text-slate-400">Importe total:</span>
                    <span class="text-lg font-bold text-white">{{ totalImporte.toFixed(2) }}€</span>
                </div>
            </div>

            <!-- Empty state -->
            <div v-else class="card-glass py-10 flex flex-col items-center gap-3 text-center">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center"
                    style="background: rgba(99,102,241,0.1);">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-indigo-400" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                    </svg>
                </div>
                <p class="text-slate-400 text-sm">No hay productos en este pedido.<br>Usa el buscador para añadir.</p>
            </div>

            <!-- Date + Actions -->
            <div class="card-glass p-5 flex flex-col sm:flex-row sm:items-end gap-4">
                <div class="form-items flex-1">
                    <label for="date" class="form-label">Fecha del pedido</label>
                    <input v-model="formData.date" type="date" name="date" id="date" />
                </div>
                <div class="flex gap-3">
                    <button type="button" :disabled="loading" @click="openDeleteModal"
                        class="btn-danger flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Eliminar
                    </button>
                    <button type="submit" :disabled="loading"
                        class="btn-primary flex items-center justify-center gap-2">
                        <svg v-if="loading" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none"
                            viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                            </circle>
                            <path class="opacity-75" fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                            </path>
                        </svg>
                        <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {{ loading ? 'Guardando...' : 'Guardar cambios' }}
                    </button>
                </div>
            </div>

        </form>
    </div>

    <DeleteModal v-if="isDeleteModalOpen" table="pedidos" :id="Number(pedidoId)" @close="closeDeleteModal"
        :redirect="`/`" />
</template>