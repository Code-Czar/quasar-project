<template>
  <q-page class="flex-column gap-1">
    <h1>{{ t('pages.catalog.title') }}</h1>
    <ProductCatalog />
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

import ProductCatalog from './components/ProductCatalog.vue';
import { useI18n } from "vue-i18n";

const { t } = useI18n();

onMounted(() => {
  window.electronAPI.initWebSocket()
})



</script>
