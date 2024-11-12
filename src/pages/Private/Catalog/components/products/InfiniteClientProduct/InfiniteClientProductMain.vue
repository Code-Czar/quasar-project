<template>
  <div>
    <p v-if="loading">Checking subscription status...</p>

    <!-- Render the appropriate component based on the subscription status -->
    <LandingPage v-if="!loading && !hasActiveSubscription " />
    <AppLaunch v-if="!loading && hasActiveSubscription && !error" />
    <!-- <ErrorPage v-if="error" /> Replace with an actual error component if needed -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useUserStore } from 'src/stores/userStore';
import { apiConnector, CENTRALIZATION_API_URLS } from 'shared-consts';
import { useRoute } from 'vue-router';

// Import the components that will render conditionally
import LandingPage from './InfiniteClientProductLanding.vue';
import AppLaunch from './InfiniteClientProductLaunch.vue';
// import ErrorPage from '@/components/ErrorPage.vue';

const userStore = useUserStore();
const route = useRoute(); // Get the current route

const loading = ref(true);
const hasActiveSubscription = ref(false);
const error = ref(false);

const productIds = JSON.parse(route.query.productIds); // Assumes `productId` is passed as a query parameter

console.log("🚀 ~ productId:", productIds)
const checkSubscriptionStatus = async () => {
  try {
    const userId = userStore.user?.id;
    if (!userId) {
      error.value = true; // User not logged in, treat as an error
      return;
    }
    console.log("🚀 ~ checkSubscriptionStatus ~ userStore.user:", userStore.user);

    // Fetch the user's subscriptions from your backend
    const response = await apiConnector.get(
      `${CENTRALIZATION_API_URLS.STRIPE_CHECK_SUBSCRIPTION}/${userId}`
    );

    if (response.status === 200) {
      const subscriptions = response.data?.subscribed_products;
      console.log("🚀 ~ checkSubscriptionStatus ~ subscriptions:", subscriptions, productIds)
      hasActiveSubscription.value = subscriptions.includes(
        productIds.testing
      ) || subscriptions.includes(
        productIds.production
      );;
      console.log("🚀 ~ checkSubscriptionStatus ~ hasActiveSubscription.value:", hasActiveSubscription.value)
    } else {
      error.value = true;
    }
  } catch (e) {
    console.error('Error checking subscription status:', e);
    error.value = true;
  } finally {
    loading.value = false; // End loading state
  }
};

onMounted(() => {
  checkSubscriptionStatus();
});
</script>

<style scoped>
/* Optional: Add styling for loading, error, or other states if needed */
</style>
