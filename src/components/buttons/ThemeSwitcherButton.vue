<template>
    <q-select
      v-model="currentTheme"
      :options="themeOptions"
      label="Select Theme"
      outlined
      dense
      @update:model-value="updateTheme"
    />
    <!-- Your layout and page content -->
  </template>
  
  <script lang="ts" setup>
  import { ref } from 'vue';
  
  const currentTheme = ref({ label: 'Theme One', value: 'theme-one' }); // Default theme
  const themeOptions = [
    { label: 'Theme One', value: 'theme-one' },
    { label: 'Theme Two', value: 'theme-two' }
  ];
  
  const updateTheme = (newTheme) => {
    document.body.className = `body-${newTheme.value}`;
  };
  
  updateTheme(currentTheme.value); // Set initial theme
  </script>
  