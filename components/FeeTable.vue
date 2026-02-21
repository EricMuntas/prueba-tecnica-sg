<script setup>
import { Check, Pencil, Trash, X } from 'lucide-vue-next';

const supabase = useSupabaseClient();

const props = defineProps({
    fees: Object,
    product_id: Number,
})

const errorMessages = ref(null);

const fees = ref(props.fees);
const product_id = ref(props.product_id);

const isCreatingNewFee = ref(false);

const loading = ref(false);

const editingId = ref(null); // ← id del fee que se está editando

const getDate = (dateString) => {
    const [year, month, day] = dateString.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
};

const handleSubmitUpdatebmit = async (fee) => {

    if ((String(fee.price)).trim() == '') {
        errorMessages.value = 'Necesita el campo precio.'
        return;
    }

    if (!fee.start_day || !fee.end_day) {
        errorMessages.value = 'Necesitas poner ambas fechas.'
        return;
    }

    if (new Date(fee.end_day) < new Date(fee.start_day)) {
        errorMessages.value = 'La fecha final no puede ser menor que la inicial.'
        return;
    }

    errorMessages.value = null;

    try {
        const { error } = await supabase
            .from('fees')
            .update({
                start_day: fee.start_day,
                end_day: fee.end_day,
                price: fee.price,
            })
            .eq('id', fee.id)


        if (error) throw error;

        editingId.value = null;

    } catch (error) {
        console.error(error);
    }
}



const newFee = ref({

    product_id: product_id.value,
    start_day: '',
    end_day: '',
    price: '',

})

const handleSubmitNew = async () => {
    loading.value = true;
    try {
        const { error } = await supabase
            .from('fees')
            .insert({
                product_id: Number(product_id.value),
                start_day: newFee.value.start_day,
                end_day: newFee.value.end_day,
                price: newFee.value.price,
            })

        if (error) throw error;

        // setTimeout(() => {
        //     navigateTo(`/admin/products/${product_id}/fees`)
        // }, 250);
        editingId.value = null;
        deleteNewFee();

        window.location.reload();

    } catch (error) {
        console.error(error);
    }

}

const deleteNewFee = () => {

    newFee.value.start_day = '';
    newFee.value.end_day = '';
    newFee.value.price = '';

    isCreatingNewFee.value = false;

}

const getStatus = (fee) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(fee.start_day);
    const end = new Date(fee.end_day);

    if (today < start) return 'Próximamente';
    if (today > end) return 'Caducado';
    return 'Vigente';
}

const getStatusClass = (fee) => {
    const status = getStatus(fee);
    if (status === 'Próximamente') return 'text-blue-500 border-blue-500';
    if (status === 'Vigente') return 'text-green-500 border-green-500';
    return 'text-red-500 border-red-500';
}


const editingBackup = ref(null);

const startEditing = (fee) => {
    editingBackup.value = { ...fee };
    editingId.value = fee.id;
}

const cancelEditing = (fee) => {
    Object.assign(fee, editingBackup.value);
    editingId.value = null;
    editingBackup.value = null;
}

// borrar modal
const isDeleteModalOpen = ref(false);
const feeToDelete = ref(null);

const openDeleteModal = (id) => {
    isDeleteModalOpen.value = true
    feeToDelete.value = id;
}

const closeDeleteModal = () => {
    isDeleteModalOpen.value = false
}

</script>

<template>
    <div class="w-full">
        <!-- Action Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <h1 class="text-2xl font-bold text-white flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="size-6 text-emerald-400" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round"
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Gestión de Tarifas
            </h1>

            <div class="flex items-center gap-3">
                <NuxtLink :to="`/admin/products/${product_id}`" class="btn-secondary flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Volver al producto</span>
                </NuxtLink>
                <button v-if="!isCreatingNewFee" @click="isCreatingNewFee = true"
                    class="btn-primary flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Añadir Tarifa</span>
                </button>
            </div>
        </div>

        <div class="table-container">
            <div class="table-header grid grid-cols-12 px-6 py-3">
                <span class="col-span-3">Día inicial</span>
                <span class="col-span-3">Día final</span>
                <span class="col-span-2">Estado</span>
                <span class="col-span-2 text-right">Precio</span>
                <span class="col-span-2 text-center">Acciones</span>
            </div>

            <!-- New Fee Form -->
            <div v-if="isCreatingNewFee"
                class="bg-indigo-500/5 border-b border-indigo-500/20 animate-in fade-in duration-300">
                <form @submit.prevent="handleSubmitNew" class="grid grid-cols-12 px-6 py-4 items-center gap-4">
                    <div class="col-span-3">
                        <input v-model="newFee.start_day" type="date">
                    </div>
                    <div class="col-span-3">
                        <input v-model="newFee.end_day" type="date">
                    </div>
                    <div class="col-span-2">
                        <span class="text-xs font-semibold text-indigo-400 uppercase">Nueva</span>
                    </div>
                    <div class="col-span-2 relative">
                        <span
                            class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs text-white">€</span>
                        <input v-model="newFee.price" type="number" step="0.01" min="0" placeholder="0.00" class="pl-7">
                    </div>
                    <div class="col-span-2 flex justify-center items-center gap-2">
                        <button @click="deleteNewFee" type="button"
                            class="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors">
                            <X class="size-4"></X>
                        </button>
                        <button type="submit"
                            class="p-2 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                            <Check class="size-4"></Check>
                        </button>
                    </div>
                </form>
            </div>

            <!-- Existing Fees -->
            <div v-if="fees.length > 0">
                <div v-for="fee in fees" :key="fee.id" class="">
                    <!-- Display Mode -->
                    <div v-if="editingId !== fee.id" class="grid grid-cols-12 px-6 py-4 items-center">
                        <span class="col-span-3 text-slate-300">{{ getDate(fee.start_day) }}</span>
                        <span class="col-span-3 text-slate-300">{{ getDate(fee.end_day) }}</span>
                        <div class="col-span-2">
                            <span :class="getStatusClass(fee)"
                                class="text-xs font-medium px-2 py-0.5 rounded-full bg-current/10 border border-current/20">
                                {{ getStatus(fee) }}
                            </span>
                        </div>
                        <span class="col-span-2 text-right font-semibold text-white">{{ fee.price }} €</span>
                        <div class="col-span-2 flex justify-center items-center gap-1">
                            <button @click="startEditing(fee)"
                                class="p-2 rounded-lg text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                                title="Editar">
                                <Pencil class="size-4"></Pencil>
                            </button>
                            <button @click="openDeleteModal(fee.id)"
                                class="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                                title="Eliminar">
                                <Trash class="size-4"></Trash>
                            </button>
                        </div>
                    </div>

                    <!-- Edit Mode -->
                    <form v-else @submit.prevent="handleSubmitUpdatebmit(fee)"
                        class="grid grid-cols-12 px-6 py-4 items-center gap-4 bg-white/[0.02]">
                        <div class="col-span-3">
                            <input v-model="fee.start_day" type="date">
                        </div>
                        <div class="col-span-3">
                            <input v-model="fee.end_day" type="date">
                        </div>
                        <div class="col-span-2">
                            <span :class="getStatusClass(fee)"
                                class="text-xs font-medium px-2 py-0.5 rounded-full bg-current/10 border border-current/20">
                                {{ getStatus(fee) }}
                            </span>
                        </div>
                        <div class="col-span-2 relative">
                            <span
                                class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs text-white">€</span>
                            <input v-model="fee.price" type="number" step="0.01" min="0" class="pl-7">
                        </div>
                        <div class="col-span-2 flex justify-center items-center gap-2">
                            <button @click="cancelEditing(fee)" type="button"
                                class="p-2 rounded-lg text-slate-400 hover:bg-white/10 transition-colors">
                                <X class="size-4"></X>
                            </button>
                            <button type="submit"
                                class="p-2 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                                <Check class="size-4"></Check>
                            </button>
                        </div>
                        <div v-if="errorMessages" class="col-span-12 mt-1">
                            <p class="text-xs text-red-400">{{ errorMessages }}</p>
                        </div>
                    </form>
                </div>
            </div>

            <div v-else class="p-12 text-center">
                <p class="text-slate-500 italic">No hay tarifas para este producto.</p>
            </div>
        </div>
    </div>

    <DeleteModal v-if="isDeleteModalOpen" table="fees" :id="Number(feeToDelete)" @close="closeDeleteModal"
        :redirect="`/admin/products/${product_id}/fees`" />
</template>

<style scoped>
svg {
    @apply cursor-pointer
}
</style>