<template>
    <div>
      <PricingSection @subscriptionClicked="handleSubscribe" />
      <!-- <q-btn label="Subscribe" @click="handleSubscribe" /> -->
    </div>
  </template>
  
  <script lang="ts" setup>
  import PricingSection from 'src/pages/Public/LandingPage/PricingSection.vue';
  import { CENTRALIZATION_API_URLS } from 'src/consts/consts';
  import { apiConnector } from 'src/api';
  import { useUserStore } from 'src/stores/userStore';
  import { useRouter } from 'vue-router';
  
  const userStore_ = useUserStore();
  const router = useRouter();
  const user = userStore_.user;
  const userEmail = user.details.email;
  
  // Extend the global Window interface to add Stripe
  declare global {
    interface Window {
        //@ts-expect-error stripe 
      Stripe?: (key: string) => Stripe | undefined;
    }
  }
  
  // Type definitions for Stripe config and response data
  interface StripeConfig {
    publishableKey: string;
    prices: { id: string }[];
  }
  
  interface CheckoutSessionResponse {
    sessionId: string;
  }
  
  async function getStripeConfig(): Promise<StripeConfig> {
    const configResponse = await apiConnector.get(`${CENTRALIZATION_API_URLS.STRIPE_CONFIG}`);
    return configResponse.data as unknown as StripeConfig;
  }
  
   //@ts-expect-error stripe 
  async function loadStripe(): Promise<Stripe | null> {
    if (!window.Stripe) {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.async = true;
      document.head.appendChild(script);
      await new Promise((resolve) => (script.onload = resolve));
    }
    const config = await getStripeConfig();
    console.log("🚀 ~ file: SrCheckout.vue:36 ~ config:", config);
    return window.Stripe ? window.Stripe(config.publishableKey) : null;
  }
  
  async function redirectToCheckout(priceId: string) {
    try {
      const successUrl = `${window.location.origin}/${router.resolve({ name: 'subscription_success' }).href}`;
      const response = await apiConnector.post(
        `${CENTRALIZATION_API_URLS.STRIPE_CHECKOUT_SESSION}/`,
        {
          priceId,
          successURL: successUrl,
          cancelURL: 'http://google.com',
          email: userEmail,
        },
        {
          'Content-Type': 'application/json',
        }
      );
  
      if (response.status !== 200) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const responseData = response.data as unknown as CheckoutSessionResponse;
      const sessionId = responseData.sessionId;
  
      const stripe = await loadStripe(); // Ensure you have loaded Stripe.js
      if (stripe) {
        return stripe.redirectToCheckout({ sessionId });
      } else {
        throw new Error('Stripe failed to load.');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }
  
  const handleSubscribe = async () => {
    if (userStore_.isSubscribed) {
      router.push({ name: 'app' });
    } else {
      const config = await getStripeConfig();
      console.log("🚀 ~ handleSubscribe ~ config:", config);
      await redirectToCheckout(config.prices[0].id);
    }
  };
  </script>
  