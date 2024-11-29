<!-- ProductWrapper.vue -->
<template>
    <component :is="dynamicComponent" />
  </template>
  
  <script lang="ts" setup>
  import { ref, onMounted } from 'vue';
  import { useRoute } from 'vue-router';
  
  const route = useRoute();
  const dynamicComponent = ref();
  
  onMounted(async () => {
    const pageName = route.params.page_name as string;
    console.log("🚀 ~ onMounted ~ pageName:", pageName)

    try {
        console.log("🚀 ~ onMounted ~ pageName:", pageName)
      dynamicComponent.value = (await import(`./products/${pageName}/${pageName}Main.vue`)).default;
    } catch (error) {
      console.error("Component not found:", error);
      // Fallback to a default component if the specific page is not found
    //   dynamicComponent.value = (await import('./NotFound.vue')).default;
    }
  });
  </script>
  