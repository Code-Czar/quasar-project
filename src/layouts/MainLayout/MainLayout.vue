<template>
  <q-layout view="lHh Lpr lFf" class="main-layout">
    <q-header elevated dense>
      <q-toolbar class="toolbar">
        <q-btn
          id="navMenuDrawer-toggleButton"
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />
        <HeaderLogo />
        <q-toolbar-title class="toolbar-title"> {{ t("productName")}} </q-toolbar-title>
        <ThemeSwitcher />
        <LanguageSwitchButton />
        <q-item side="right">
          <q-item-section>
            <q-btn v-if="!userStore_.picture" flat round icon="person" class="person" size="1em" />
            <q-avatar v-if="userStore_.picture" :key="userStore_.picture" size="30px">
              <img :src="userStore_.picture" />
            </q-avatar>
            <q-menu class="userMenu">
              <q-list>
                <q-item clickable @click="openUserSettings">
                  <q-item-label>Settings</q-item-label>
                </q-item>
                <q-item clickable @click="userLogout">
                  <q-item-label>Logout</q-item-label>
                </q-item>
              </q-list>
            </q-menu>
          </q-item-section>
        </q-item>
      </q-toolbar>
    </q-header>

    <!-- Navigation Drawer Component -->
    <NavigationDrawer ref="navigationDrawer" />

    <q-page-container class="page-container">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from "vue-i18n";
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';

import { useUserStore } from 'src/stores/userStore';
import { useUiStore } from 'src/stores/uiStore'; // New UI store

import { LanguageSwitchButton, HeaderLogo, ThemeSwitcher } from 'src/components';
import NavigationDrawer from './MainDrawer.vue';

const router = useRouter();
const userStore_ = useUserStore();
console.log("🚀 ~ userStore_ PICTURE:", userStore_.picture)
const { t } = useI18n();
const uiStore = useUiStore();
const { leftDrawerOpen } = storeToRefs(uiStore);
console.log("🚀 ~ leftDrawerOpen:", leftDrawerOpen)



// Ref to access `NavigationDrawer` and control `leftDrawerOpen`
const navigationDrawer = ref(null);

function toggleLeftDrawer() {
    leftDrawerOpen.value = !leftDrawerOpen.value
}

const openUserSettings = () => {
  router.push('user');
};
const userLogout = () => {
  userStore_.logout();
  router.push({ name: 'home' });
};
</script>


<style lang="scss" scoped>
.toolbar{
  gap:1rem;
}


.toolbar-title{
  padding:unset; 
}


</style>