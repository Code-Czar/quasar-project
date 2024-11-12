<template>
    <div>
      <!-- Expose handleSubscribe as a prop for the slot -->
      <slot name="product-info" :handleSubscribe="handleSubscribe"></slot>
    </div>
  </template>
  
  <script lang="ts" setup>
  import { ref } from 'vue';
  import { apiConnector, CENTRALIZATION_API_URLS } from 'shared-consts';
  import { useUserStore } from 'src/stores/userStore';
  import { useRouter } from 'vue-router';
  
  const userStore_ = useUserStore();
  const router = useRouter();
  const userEmail = userStore_.user?.details?.email || '';
  
  const getStripeConfig = async () => {
    const config = await apiConnector.get(CENTRALIZATION_API_URLS.STRIPE_CONFIG);
    return config.data;
  };
  
  const loadStripe = async () => {
    if (!window.Stripe) {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.async = true;
      document.head.appendChild(script);
      await new Promise((resolve) => (script.onload = resolve));
    }
    const config = await getStripeConfig();
    return window.Stripe(config.publishableKey);
  };
  
  const redirectToCheckout = async (priceId: string) => {
    try {
      const successURL = `${window.location.origin}${router.resolve({
        name: 'subscription_success',
      }).href}`;
      const response = await apiConnector.post(
        `${CENTRALIZATION_API_URLS.STRIPE_CHECKOUT_SESSION}/`,
        {
          priceId,
          successURL,
          cancelURL: window.location.origin,
          email: userEmail,
        },
        {
          'Content-Type': 'application/json',
        }
      );
  
      if (response.status !== 200) throw new Error(`HTTP error: ${response.status}`);
      const sessionId = response.data.sessionId;
      const stripe = await loadStripe();
      await stripe.redirectToCheckout({ sessionId });
    } catch (error) {
      console.error('Stripe redirect error:', error);
    }
  };
  
  const handleSubscribe = async () => {
    if (userStore_.isSubscribed) {
      router.push({ name: 'app' });
    } else {
      const config = await getStripeConfig();
      await redirectToCheckout(config.prices[0].id);
    }
  };
  </script>
  