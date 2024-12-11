<template>
    <q-drawer
      v-model="leftDrawerOpen"
      bordered
      style="display:flex; flex-direction: column; padding-left: 1rem; padding-right: 1rem;"
      :width="200"
    >
      <div style="display:flex; flex-grow:1">
        <q-list>
          <q-item-label header> Navigation </q-item-label>
  
          <!-- Link to Application -->
          <q-item clickable @click="goToCatalog">
            <q-item-section avatar>
              <q-icon name="apps" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ t('navigationDrawer.items.one.name') }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
      <div style="display:flex; flex-grow:0">
        <q-btn flat class="full-width" icon="home" label="Home" @click="goToHome" />
      </div>
    </q-drawer>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { useUserRole } from 'src/composables/useUserRoles';
  import { useI18n } from "vue-i18n";
  import { storeToRefs } from 'pinia';
  import { useUiStore } from 'src/stores/uiStore'; // New UI store



  const { t } = useI18n();

  const { isDev } = useUserRole();

  const router = useRouter();
  const uiStore = useUiStore();

  const { leftDrawerOpen } = storeToRefs(uiStore);
  
  console.log("🚀 ~ leftDrawerOpen:", leftDrawerOpen)

  
  // Expose `leftDrawerOpen` for parent component access
  defineExpose({ leftDrawerOpen });
  
  // Navigation functions
  const goToAdminPage = () => {
    router.push('/devOnly');
  };
  const goToApp = () => {
    router.push('/app');
  };
  const goToCatalog = () => {
    router.push('/catalog');
  };
  const goToHome = () => {
    router.push('/');
  };
  </script>
  