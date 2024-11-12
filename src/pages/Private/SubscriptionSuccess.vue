<template>
  <div>
    <h1>{{ $t('subscriptionSuccessPage.title') }}</h1>
    <p>{{ $t('subscriptionSuccessPage.text') }}</p>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from 'src/stores/userStore';

const userStore_ = useUserStore();
const router = useRouter();

const handleSubscriptionSuccess = async () => {
  await userStore_.updateStripeCustomer();
  userStore_.setIsSubscribing(false);

  setTimeout(() => {
    // router.push({ name: 'app' });
  }, 3000);
};

onMounted(handleSubscriptionSuccess);

</script>

<style scoped>
</style>
