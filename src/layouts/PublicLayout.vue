<!-- Layout.vue -->

<template>
  <q-layout class="home-page-layout">
    <LandingPageHeader />
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { LandingPageHeader } from 'src/components';
</script>

<style lang="scss" scoped>
/* Add any styles specific to the layout component */
</style>
