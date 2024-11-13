<template>
    <div class="q-pa-md">
      <q-card v-if="loading" flat bordered class="q-pa-md">
        <q-spinner color="primary" size="md" />
        Loading products...
      </q-card>
  
      <q-card v-else-if="error" flat bordered class="q-pa-md text-negative">
        <div>{{ error }}</div>
      </q-card>
  
      <q-card v-else flat bordered class="q-pa-md">
        <div class="text-h5 q-mb-md">Product Catalog</div>
        <div class="q-gutter-sm row">
          <Product
            v-for="product in products"
            :key="product.id"
            :product="product"
            class="col-xs-12 col-sm-6 col-md-4"
          />
        </div>
      </q-card>
    </div>
  </template>
  
  <script lang="ts" setup>
  import { ref, onMounted } from 'vue';
  import { CENTRALIZATION_API_URLS } from 'src/shared-consts';

  import axios from 'axios';
  import Product from './Product.vue';
  
  const products = ref([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  onMounted(async () => {
    await fetchProducts();
  });
  
  async function fetchProducts() {
    loading.value = true;
    error.value = null;
  
    try {
      console.log("🚀 ~ fetchProducts ~ CENTRALIZATION_API_URLS:", CENTRALIZATION_API_URLS)
      const response = await axios.get(CENTRALIZATION_API_URLS.PRODUCTS_CATALOG); // Replace with your Django backend URL
      products.value = response.data;
    } catch (err) {
      error.value = 'Failed to load products.';
      console.error('Error fetching products:', err);
    } finally {
      loading.value = false;
    }
  }
  </script>
  
  <style scoped>
  .q-gutter-sm > .col {
    display: flex;
    justify-content: center;
  }
  </style>
  