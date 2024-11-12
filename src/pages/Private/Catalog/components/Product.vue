<template>
    <q-card class="q-mb-md q-pa-md" bordered>
      <q-card-section>
        <div class="text-h6">{{ product.name }}</div>
        <div class="text-subtitle1">{{ product.description }}</div>
      </q-card-section>
      <q-card-actions align="center" class="flex w-100">
        <q-btn label="View" color="primary" class="flex w-100" @click="viewProduct" />
      </q-card-actions>
    </q-card>
  </template>
  
  <script lang="ts" setup>
  import { defineProps } from 'vue';
  import { useRouter } from 'vue-router';

  const router = useRouter();

  const props = defineProps({
    product: {
      type: Object as () => {
        id: number;
        name: string;
        description: string;
        stripe_product_ids: string;
        github_repo_url: string;
        page_name: string;
      },
      required: true,
    },
  });
  
  function viewProduct() {
    // Handle viewing or selecting a product (e.g., navigate to a detail page)
    console.log('Viewing product:', props.product);
    router.push({ path: `/product/${props.product.page_name}`, 
      query: { productIds: JSON.stringify(props.product.stripe_product_ids) } });
  }
  </script>
  
  <style scoped>
  /* Optional styling */
  .q-card {
    max-width: 400px;
  }
  </style>
  