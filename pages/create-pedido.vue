<script setup>
import { X } from 'lucide-vue-next';

useHead({ title: 'Crear Pedido — PedidosApp' })

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

const handleSubmit = async () => {
    if (formData.value.products.length === 0) {
        error.value = 'Añade al menos un producto';
        return;
    }

    loading.value = true;
    error.value = false;
    success.value = false;

    try {
        const { data: pedido, error: pedidoError } = await supabase
            .from('pedidos')
            .insert({ cost: totalImporte.value, user_id: user.value.sub, date: formData.value.date })
            .select()
            .single();

        if (pedidoError) throw pedidoError;

        const pedidoProducts = formData.value.products.map(item => ({
            pedido_id: pedido.id,
            product_id: item.id,
            quantity: item.quantity,
        }));

        const { error: productsError } = await supabase
            .from('pedidos_products')
            .insert(pedidoProducts);

        if (productsError) throw productsError;

        success.value = 'Pedido creado correctamente';
        formData.value.products = [];
        formData.value.date = '';

        navigateTo('/');

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
</script>

<template>
    <div class="pt-24 pb-12 px-6 max-w-3xl mx-auto">

        <!-- Page header -->
        <div class="mb-8">
            <p class="text-sm text-indigo-400 font-medium mb-1">Pedidos</p>
            <h1 class="text-2xl font-bold text-white">Crear nuevo pedido</h1>
            <p class="text-slate-400 text-sm mt-1">Busca productos y añádelos a tu pedido</p>
        </div>

        <form @submit.prevent="handleSubmit" class="flex flex-col gap-6">

            <!-- Search box -->
            <div class="card-glass p-5 relative z-30">
                <h2 class="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-indigo-400" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Buscar producto
                </h2>
                <div class="form-items relative">
                    <input v-model="searchingProduct" type="text" name="search-bar" id="search-bar"
                        placeholder="Escribe el nombre del producto..." />
                    <div v-if="showingAllProducts.length > 0"
                        class="dropdown-container absolute left-0 right-0 top-full !z-50">
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
                <p class="text-slate-400 text-sm">Aún no has añadido productos.<br>Usa el buscador para añadir.</p>
            </div>

            <!-- Date + Submit -->
            <div class="card-glass p-5 flex flex-col sm:flex-row sm:items-end gap-4">
                <div class="form-items flex-1">
                    <label for="date" class="form-label">Fecha del pedido</label>
                    <input v-model="formData.date" type="date" name="date" id="date" />
                </div>
                <button type="submit" :disabled="loading"
                    class="btn-primary flex items-center justify-center gap-2 sm:w-auto w-full">
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
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    {{ loading ? 'Creando...' : 'Crear pedido' }}
                </button>
            </div>

        </form>
    </div>
</template>