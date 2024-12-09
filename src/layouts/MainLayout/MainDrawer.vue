<template>
    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
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
  const { t } = useI18n();

  const { isDev } = useUserRole();

  const router = useRouter();
  const leftDrawerOpen = ref(false);
  
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
  