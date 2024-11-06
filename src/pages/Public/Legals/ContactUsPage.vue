<template>
  <q-page class="home-page">
    <h1 class="text-centered"> {{ $t('footerWide.contactUs') }}</h1>
    <ContactUsForm />
  </q-page>
</template>

<script lang="ts" setup>
import { ContactUsForm } from 'src/components';
</script>

<style lang="scss" scoped></style>
