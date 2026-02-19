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
    if (status === 'Próximamente') return 'text-blue-500';
    if (status === 'Vigente') return 'text-green-500';
    return 'text-red-500';
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

    <div v-if="fees.length > 0" class="flex flex-col justify-center items-center gap-4 mt-4">
        <NuxtLink :to="`/admin/products/${product_id}`" class="mt-4">
            <button type="button"
                class="text-white rounded-xl p-2 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 w-full">

                <span>Volver al producto</span>
            </button>
        </NuxtLink>
        <h1>Tarifas</h1>
        <div class="table-container">
            <div class="table-header grid grid-cols-12 p-1">
                <span class="col-span-3">Dia inicial</span>
                <span class="col-span-3">Dia final</span>
                <span class="col-span-2">Estado</span>
                <span class="col-span-2">Precio</span>
                <span class="col-span-2"></span>
            </div>
            <div class="flex justify-center items-center bg-black cursor-pointer"
                v-on:click="() => isCreatingNewFee = true">
                <p class="text-sm text-white">Crear tarifa</p>
            </div>
            <div v-if="isCreatingNewFee == true">
                <form @submit.prevent="handleSubmitNew(newFee)">
                    <div class="grid grid-cols-12 p-1 items-center h-12">
                        <input v-model="newFee.start_day" class="col-span-3 w-1/2" type="date">
                        <input v-model="newFee.end_day" class="col-span-3 w-1/2" type="date">
                        <span class="col-span-2">Creando...</span>
                        <input v-model="newFee.price" class="col-span-2 w-1/2" type="number" min="0" placeholder="1.99">
                        <span class="col-span-2 flex justify-center items-center">
                            <X type="submit" v-on:click="deleteNewFee"></X>
                            <Check type="submit" v-on:click="handleSubmitNew"></Check>
                        </span>
                    </div>
                </form>
            </div>
            <div v-for="fee in fees" :key="fee.id">

                <div v-if="editingId !== fee.id" class="grid grid-cols-12 p-1 items-center h-12">
                    <span class="col-span-3">{{ getDate(fee.start_day) }}</span>
                    <span class="col-span-3">{{ getDate(fee.end_day) }}</span>
                    <span class="col-span-2" :class="getStatusClass(fee)">{{ getStatus(fee) }}</span>
                    <span class="col-span-2">{{ fee.price }}</span>
                    <span class="col-span-2 flex justify-center items-center">
                        <Trash v-on:click="openDeleteModal(fee.id)"></Trash>
                        <Pencil v-on:click="startEditing(fee)"></Pencil>
                    </span>
                </div>

                <form v-else @submit.prevent="handleSubmitUpdatebmit(fee)">
                    <div class="grid grid-cols-12 p-1 items-center h-12">
                        <input v-model="fee.start_day" class="col-span-3 w-1/2" type="date">
                        <input v-model="fee.end_day" class="col-span-3 w-1/2" type="date">
                        <span class="col-span-2" :class="getStatusClass(fee)">{{ getStatus(fee) }}</span>
                        <input v-model="fee.price" class="col-span-2 w-1/2" type="number" min="0" placeholder="1.99">
                        <span class="col-span-2 flex justify-center items-center">
                            <X type="submit" v-on:click="cancelEditing(fee)"></X>
                            <Check type="submit" v-on:click="handleSubmitUpdatebmit(fee)"></Check>
                        </span>
                    </div>
                    <span v-if="errorMessages" class="error">{{ errorMessages }}</span>
                </form>

            </div>
        </div>
    </div>
    <div v-else>
        <p>No hay tarifas</p>
    </div>
    <DeleteModal v-if="isDeleteModalOpen" table="fees" :id="Number(feeToDelete)" @close="closeDeleteModal"
        :redirect="`/admin/products/${product_id}/fees`" />
</template>

<style scoped>
svg {
    @apply cursor-pointer
}
</style>