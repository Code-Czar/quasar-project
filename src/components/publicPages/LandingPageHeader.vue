<template>
  <I18nProvider>
    <q-header
      class="bg-transparent"
      style="position: absolute; top: 0; left: 0; 
      /* position:fixed */
      "
    >
      <q-toolbar>

      <HeaderButtons :callback="scrollToSection"/>

      </q-toolbar>
    </q-header>
  </I18nProvider>
</template>

<script setup>
import { HeaderButtons } from 'src/components';
const scrollToSection = (sectionId) => {
  const sectionElement = document.getElementById(sectionId);
  if (sectionElement) {
    console.log('🚀 ~ sectionElement:', sectionElement);
    setTimeout(() => {
      sectionElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 500);
  }
};
</script>

<style>
.bg-transparent {
  background-color: transparent !important;
  box-shadow: unset !important;
}

.nav-menu-item {
  margin-right: 1rem;
  /* Adjust as needed */
}

.flex-container {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  /* Align items vertically */
  /* Add any additional styling as needed */
}
</style>
