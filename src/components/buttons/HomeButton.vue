<template>
  <q-btn color="primary" @click="goToApp" class="button-default" flat>{{
    $t('navigationMenu.homeHeader.home')
  }}</q-btn>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const goToApp = () => {
  router.push({ path: '/' });
};
</script>


