<script setup>
useHead({

    title: 'Admin'
})
</script>


<template>

    <div class="button-container bg-gray-100 flex justify-center items-center gap-4">

        <NuxtLink to="/admin/list-categories">
            <div class="admin-panel-btn">Ver categorias</div>
        </NuxtLink>

        <NuxtLink to="/">
            <div class="admin-panel-btn">Crear comidas</div>
        </NuxtLink>



    </div>

</template>

<style scoped>
/* Tamaño  */
.button-container {
    width: 100vw;
    height: calc(100vh - 3rem);
    /*maximo - h-12 del navabar*/
}

.admin-panel-btn {
    @apply w-52 h-52 border-black border-2 rounded flex justify-center items-center hover:bg-gray-300 cursor-pointer;
}
</style>