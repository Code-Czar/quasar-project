<template>
  <q-layout view="lHh Lpr lFf" class="main-layout">
    <q-header elevated>
      <q-toolbar>
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
        <q-toolbar-title> Opportunities </q-toolbar-title>
        <ThemeSwitcher />
        <q-item side="right">
          <q-item-section>
            <q-btn v-if="!userStore_.picture" flat round icon="person" class="person" size="1em" />
            <q-avatar v-if="userStore_.picture" size="30px">
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

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from 'src/stores/userStore';
import { HeaderLogo, ThemeSwitcher } from 'src/components';
import NavigationDrawer from './MainDrawer.vue';

const router = useRouter();
const userStore_ = useUserStore();

// Ref to access `NavigationDrawer` and control `leftDrawerOpen`
const navigationDrawer = ref(null);

function toggleLeftDrawer() {
  if (navigationDrawer.value) {
    navigationDrawer.value.leftDrawerOpen = !navigationDrawer.value.leftDrawerOpen;
  }
}

const openUserSettings = () => {
  router.push('user');
};
const userLogout = () => {
  userStore_.logout();
  router.push({ name: 'home' });
};
</script>
