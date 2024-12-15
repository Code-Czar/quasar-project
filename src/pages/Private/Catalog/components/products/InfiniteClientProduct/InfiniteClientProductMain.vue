<template>
  <div class="flex-column flex-grow-1 justify-center align-center">
    <p v-if="loading">Checking subscription status...</p>

    <!-- Render the appropriate component based on the subscription status -->
    <LandingPage v-if="!loading && !hasActiveSubscription " />
    <AppLaunch 
      v-if="!loading && hasActiveSubscription && !error" 
      :product-id="selectedProductId" 
      :product="selectedProduct" 
    />
    <!-- <ErrorPage v-if="error" /> Replace with an actual error component if needed -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useUserStore } from 'src/stores/userStore';
import { apiConnector, CENTRALIZATION_API_URLS } from 'src/shared-consts';
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

// Parse product IDs from the query parameter
const productIds = computed(() => {
  try {
    // @ts-expect-error ignore
    return JSON.parse(route.query.productIds);
  } catch (e) {
    console.error('Error parsing productIds:', e);
    return null;
  }
});

const selectedProductId = ref<string | null>(null);
const selectedProduct = ref<{}>(null);

console.log("🚀 ~ productIds:", productIds);
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
      // Get the list of subscribed products from the response
      // @ts-expect-error ignore
      const subscriptions = response.data?.subscribed_products || [];
      console.log("🚀 ~ checkSubscriptionStatus ~ subscriptions:", subscriptions, productIds.value, response.data);

      for(const subscription of subscriptions){
        console.log("🚀 ~ checkSubscriptionStatus ~ subscription:", subscription)
        if(!subscription || !subscription.product_id){
          continue
        }
        const products_ids =  Object.values(subscription.product_id)
        // console.log("🚀 ~ checkSubscriptionStatus ~ products_ids:", products_ids, subscription)
        if (products_ids?.includes(productIds.value?.testing)) {
        hasActiveSubscription.value = true;
        selectedProductId.value = productIds.value?.testing;
        selectedProduct.value = subscription;
        break;
      } else if (products_ids?.includes(productIds.value?.production)) {
        hasActiveSubscription.value = true;
        
        selectedProductId.value = productIds.value?.production;
        selectedProduct.value = subscription;
        break;

      } else {
        hasActiveSubscription.value = false;
      }
      }
      // Determine if the user is subscribed to either product ID and set the selected product ID
      

      console.log("🚀 ~ checkSubscriptionStatus ~ hasActiveSubscription.value:", hasActiveSubscription.value);
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
