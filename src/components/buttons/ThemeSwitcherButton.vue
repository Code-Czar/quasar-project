<template>
  <div class="theme-toggle-container">
    <q-btn
      flat
      round
      :icon="!isDarkTheme ? 'fa-solid fa-moon' : 'fa-solid fa-sun'"
      color="primary"
      @click="toggleTheme"
      aria-label="Toggle Theme"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

// State to manage the theme toggle
const isDarkTheme = ref(true); // Default theme: light
const themeOptions = [
  { label: 'Light Theme', value: 'theme-one' },
  { label: 'Dark Theme', value: 'theme-two' },
];

// Toggle the theme
const toggleTheme = () => {
  isDarkTheme.value = !isDarkTheme.value;
  const selectedTheme = isDarkTheme.value ? themeOptions[1] : themeOptions[0];
  document.body.className = `body-${selectedTheme.value}`;
};

// Set the initial theme
toggleTheme();
</script>

<style scoped>
.theme-toggle-container {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
