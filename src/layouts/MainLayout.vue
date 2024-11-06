<template>
  <q-layout view="lHh Lpr lFf" class="main-layout">
    <q-header elevated>
      <q-toolbar>
        <q-btn id="navMenuDrawer-toggleButton" flat dense round icon="menu" aria-label="Menu"
          @click="toggleLeftDrawer" />
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

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered
      style="display:flex; flex-direction: column; padding-left: 1rem; padding-right: 1rem;" :width=200>
      <div style="display:flex; flex-grow:1">
        <q-list>
          <q-item-label header> Navigation </q-item-label>

          <!-- Link to Monitoring Page -->
          <q-item v-if="isDev" clickable>
            <q-item-section avatar>
              <q-icon name="admin_panel_settings" />
            </q-item-section>

            <q-item-section @click="goToAdminPage">
              <q-item-label>
                <span>Dev Panel</span>
              </q-item-label>
            </q-item-section>
          </q-item>
          <q-item clickable>
            <q-item-section avatar>
              <q-icon name="apps" />
            </q-item-section>
            <q-item-section @click="goToApp">
              <q-item-label>
                <span>Application </span>
              </q-item-label>
            </q-item-section>
          </q-item>
          <q-item v-if="isDev" clickable>
            <q-item-section avatar>
              <q-icon name="notifications" />
            </q-item-section>
            <q-item-section id="navMenu-alertPanel-link" @click="gotToAlertsPage">
              <q-item-label>
                <span>Alerts Panel</span>
              </q-item-label>
            </q-item-section>
          </q-item>
          <!-- <q-item v-if="isDev" clickable>
          <q-item-section avatar>
            <q-icon name="Admin" />
          </q-item-section>
        </q-item> -->
          <!-- <q-item clickable>
          <q-item-section avatar>
            <q-icon name="monitor" />
          </q-item-section>
          <q-item-section @click="gotToMonitoringPage">
            <q-item-label>
              <span >Monitoring</span>
            </q-item-label>
          </q-item-section>
        </q-item> -->
        </q-list>
      </div>
      <div style="display:flex; flex-grow:0">
        <q-btn flat class="full-width" icon="home" label="Home" @click="goToHome" />
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from 'src/stores/userStore';
import { useUserRole } from 'src/composables/useUserRoles';
import { HeaderLogo, ThemeSwitcher } from 'src/components';

const { isDev } = useUserRole();

const router = useRouter();
const leftDrawerOpen = ref(false);
const userStore_ = useUserStore();

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}
const openUserSettings = () => {
  router.push('user');
}
/*const gotToMonitoringPage = () => {
  router.push('/monitoring');
};*/
const goToAdminPage = () => {
  router.push('/devOnly');
};
const gotToAlertsPage = () => {
  router.push('/premiumAlerts');
}
const userLogout = () => {
  userStore_.logout();
  router.push({ name: 'home' });
};
const goToApp = () => {
  router.push('/app');
};
const goToHome = () => {
  router.push('/'); // Adjust the path according to your home route
};
</script>

<style lang="scss">
.q-item {
  min-height: 1em;
}

.q-avatar {
  cursor: pointer;
}
</style>
