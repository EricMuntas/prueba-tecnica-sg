<script setup>
import { X } from 'lucide-vue-next';

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

// Obtener el precio vigente de un producto desde fees
const getPriceForProduct = async (productId) => {
    const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

    // 1. Buscar fee vigente hoy
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

    // 2. Si no hay vigente, usar el más reciente
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

    } catch (e) {
        error.value = e.message;
    } finally {
        loading.value = false;
    }
};

try {
    const { data, error: supabaseError } = await supabase
        .from('products')
        .select('*');

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

        // Obtener precio vigente antes de añadir
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
    <div class="flex justify-center items-center w-full mt-20">
        <form @submit.prevent="handleSubmit" class="form-container">

            <div class="form-items">
                <label for="search-bar">Buscar</label>
                <input v-model="searchingProduct" type="text" name="search-bar" id="search-bar"
                    placeholder="Buscar.." />
                <div v-if="showingAllProducts.length > 0" class="border-2 border-black p-1 rounded-xl mt-2">
                    <div v-for="product in showingAllProducts" :key="product.id">
                        <div class="hover:bg-gray-200 cursor-pointer p-1" @click="selectProduct(product)">
                            {{ product.name }}
                        </div>
                    </div>
                </div>
            </div>

            <p v-if="error" class="error">{{ error }}</p>
            <p v-if="success" class="success">{{ success }}</p>

            <div class="table-container !w-full">
                <div class="table-header grid grid-cols-10 p-1 items-center">
                    <span class="col-span-4">PRODUCTO</span>
                    <span class="col-span-2">CANTIDAD</span>
                    <span class="col-span-2">PRECIO UNITARIO</span>
                    <span class="col-span-1">TOTAL</span>
                    <span class="col-span-1"></span>
                </div>
                <div v-for="product in formData.products" :key="product.id" class="grid grid-cols-10 p-1 items-center">
                    <span class="col-span-4">{{ product.name }}</span>
                    <input v-model.number="product.quantity" class="col-span-2" name="quantity" type="number" min="1"
                        placeholder="1">
                    <span class="col-span-2">
                        {{ product.price != null ? `${Number(product.price).toFixed(2)}€` : 'Sin precio' }}
                    </span>
                    <span class="col-span-1">{{ (Number(product.price) * product.quantity).toFixed(2) }}€</span>
                    <X @click="handleDeleteProduct(product)" class="col-span-1"></X>
                </div>
            </div>

            <div class="mt-2 text-right font-bold">
                <p>Importe total: {{ totalImporte.toFixed(2) }}€</p>
            </div>

            <div class="mt-2 font-bold">
                <label for="date">Fecha:</label>
                <input v-model="formData.date" type="date" name="date" id="">
            </div>

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

<style scoped>
svg {
    @apply cursor-pointer
}
</style>