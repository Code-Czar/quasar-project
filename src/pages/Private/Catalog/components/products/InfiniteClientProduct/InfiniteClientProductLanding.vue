<template>
  <LandingPage />
</template>

<script lang="ts" setup>
import { ref, defineEmits } from 'vue';
import { computed } from 'vue';

import { useI18n } from 'vue-i18n';
import { useUserStore } from 'src/stores/userStore';
import { BaseStripeProduct } from 'src/components';

import LandingPage from './LandingPage/LandingPage.vue';

import { storeToRefs } from 'pinia';
import { useUiStore } from 'src/stores/uiStore'; // New UI store

const uiStore = useUiStore();
const { leftDrawerOpen } = storeToRefs(uiStore);
leftDrawerOpen.value = false;
</script>

<style scoped lang="scss">
.pricing-card {
  margin-left: auto;
  margin-right: auto;
  max-width: 30%;
}

.features {
  display: flex;
  align-items: center;
  gap: 16px;
}

.price {
  font-size: 2rem;
}
</style>
