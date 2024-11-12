<template>
  <q-layout>
    <q-page-container>
      <q-page>
       <h1>CATALOG</h1>
        <ProductCatalog />
      </q-page>
    </q-page-container>

    <q-footer>
      <!-- Footer content goes here -->
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import ProductCatalog from './components/ProductCatalog.vue';
</script>
