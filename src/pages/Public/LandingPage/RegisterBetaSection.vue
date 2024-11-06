<template>
  <section id="beta-section" class="register-beta-section section-with-padding">
    <div style="display:flex; flex-direction: column;">
      <span class="text-h2 text-centered q-my-md">
        {{ $t('registerBeta.header') }}
      </span>
      <span class="text-h3 text-centered q-my-md">
        {{ $t('registerBeta.subHeader') }}
      </span>
      <span style="height:5vh" />
      <q-btn flat :label="$t('registerBeta.callToAction')" @click.stop="goToBetaRegistration" class="button-default"
        style="flex-grow:0" />
    </div>
  </section>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { userStore } from 'src/stores/userStore';
const router = useRouter();
const userStore_ = userStore();

const goToBetaRegistration = async () => {
  userStore_.setIsRegisteringBeta(true);
  router.push('/login');
}
</script>

<style lang="scss" scoped>
.q-btn {
  margin-left: auto;
  margin-right: auto;
}
</style>
