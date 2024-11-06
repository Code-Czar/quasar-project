<!-- LanguageSwitch.vue -->
<template>
  <q-select
    v-model="locale"
    :options="localeOptions"
    dense
    borderless
    emit-value
    map-options
    options-dense

    style="max-width: 2rem;"
  />
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { locale, t } = useI18n({ useScope: 'global' });

const localeOptions = [
  { value: 'en-US', label: '🇺🇸' },
  { value: 'fr', label: '🇫🇷' },
];
</script>
