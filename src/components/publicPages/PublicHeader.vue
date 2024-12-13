<template>
  <I18nProvider>
    <q-header
      class="header-container"
      style="position: absolute; top: 0; left: 0; /* position:fixed */"
    >
      <q-toolbar>
        <HeaderLogo />
        <q-toolbar-title> {{ t('productName') }} </q-toolbar-title>
    
        <div
          class="flex-container"
          style="justify-content: flex-end; flex-grow: 1; flex-wrap: nowrap"
        >
        <HeaderButtons/>
        <HomeButton />

          
        </div>
      </q-toolbar>
    </q-header>
  </I18nProvider>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { HeaderLogo, HeaderButtons, HomeButton } from 'src/components';
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n({ useScope: 'global' });

const router = useRouter();

const goToSectionInPage = (pageURL,sectionId) => {
  // Navigate to the OtherPage.vue with the sectionId as a query parameter
  router.push({ path: pageURL, query: { section: sectionId } });
};

const goToLogin = () => {
  router.push('/login');
};

const toggleDrawer = () => {
  // Logic for toggling the drawer (if any)
};
</script>

<style lang="scss" scoped>
.header-container {
  background-color: $section-even-background !important;
  box-shadow: unset !important;
}

.nav-menu-item {
  margin-right: 1rem;
  /* Adjust as needed */
}

.flex-container {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  /* Align items vertically */
  /* Add any additional styling as needed */
}
</style>
