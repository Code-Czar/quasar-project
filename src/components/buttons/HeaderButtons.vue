<template>
  <div class="header-buttons-container">

    <q-btn flat id="header-login-button" rounded dense class="nav-menu-item" @click="goToLogin">
      {{ $t('buttons.login') }}
    </q-btn>

    <ThemeSwitcher />
    <LanguageSwitchButton />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { LanguageSwitchButton, ThemeSwitcher } from 'src/components';

const props = defineProps(['callback']);

const router = useRouter();

const goToSectionInPage = (pageURL, sectionId) => {
  if (props.callback) {
    props.callback(sectionId); // Call the provided callback function
  } else {
    // Navigate to the OtherPage.vue with the sectionId as a query parameter
    router.push({ path: pageURL, query: { section: sectionId } });
  }
};

const goToLogin = () => {
  router.push({name: 'login'});
};
</script>

<style scoped lang="scss">
.header-buttons-container {
  display: flex;
  flex-direction: row;
  flex-grow: 1;
  justify-content: right;
  align-items: right;
}
</style>
