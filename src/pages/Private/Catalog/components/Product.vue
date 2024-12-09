<template>
    <q-card class="q-mb-md q-pa-md product-card flex-column gap-1" bordered>
      <q-card-section class="flex-column flex-grow-1 gap-1" style="flex-grow:1">
        <div class="text-h6 text-centered ">{{ product.name.replace('_', ' ') }}</div>
        <div class="text-subtitle1 text-height flex-column flex-grow" v-html="formattedDescription"></div>
      </q-card-section>
      <q-card-actions align="center" class="flex w-100" style="flex-grow:0">
        <q-btn label="View" class="flex w-100 default-button" @click="viewProduct" />
      </q-card-actions>
    </q-card>
  </template>
  
  <script lang="ts" setup>
  import { computed, defineProps } from 'vue';
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
  const formattedDescription = computed(() =>
  props.product.description.replace(/\n/g, '<br>')
);

// const formattedDescription = computed(() => 'Line 1<br>Line 2<br>Line 3');
console.log('Product description:', props.product.description);
console.log('Formatted Product description:', formattedDescription);



  function viewProduct() {
    // Handle viewing or selecting a product (e.g., navigate to a detail page)
    console.log('Viewing product:', props.product);
    router.push({ path: `/product/${props.product.page_name}`, 
      query: { productIds: JSON.stringify(props.product.stripe_product_ids) } });
  }
  </script>
  
  <style lang="scss" scoped>
  .q-card {
    max-width: 400px;
    margin:unset;
  }

  .text-height {
  height: auto; /* Adjust the height dynamically */
  overflow: auto; /* Handle overflow if needed */
  white-space: normal; /* Ensure text wraps correctly */
}


  </style>
  