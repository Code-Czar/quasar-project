<template>
  <div v-if="props.showLoader" class="chart-loader">
    <div class="flex-column-centered">
        <q-spinner-audio  :color="props.color" :width="props.width" :height="props.height"></q-spinner-audio>
    </div>
    <div class="flex-column-centered">{{ $t('backtesting.loaders.backtestLoader.title') }}</div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
    showLoader:{
        required: true, 
        type: Boolean
    }, 
    width:{
        required: false, 
        default:'3rem'
    },
    height:{
        required: false, 
        default:'3rem'
    },
    color:{
        required: false, 
        default:'secondary',
    }
});

</script>

<style scoped lang="scss">
.chart-loader{
    display:flex; 
    flex-direction: column;
    justify-content: center;
    min-height:80vh;
}

</style>
