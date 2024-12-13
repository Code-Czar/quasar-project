<template>
  <q-page class="flex-column q-py-xl">
    <h1 class="text-centered"> {{ $t('footerWide.contactUs') }}</h1>
    <ContactUsForm />
  </q-page>
</template>

<script lang="ts" setup>
import { ContactUsForm } from 'src/components';
</script>

<style lang="scss" scoped></style>
