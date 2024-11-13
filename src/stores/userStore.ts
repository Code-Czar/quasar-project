import { defineStore } from 'pinia';
import { CENTRALIZATION_API_URLS } from 'src/shared-consts';
import { apiConnector } from 'src/api';
import { LocalStorage } from 'quasar';

type User = {
  id: string;
  details?: {
    user_metadata?: {
      full_name?: string;
      email?: string;
      picture?: string;
    };
  };
  stripe_customer_id?: string | null;
  stripe_customer_details?: {
    subscription?: string;
    payment_status?: string;
  } | null;
  role?: string;
  isSubscribing?: boolean;
  isRegisteringBeta?: boolean;
};

type CreateMutable<T> = { -readonly [P in keyof T]: T[P] };

// Define an interface for the expected response structure
interface StripeCustomerResponse {
  stripe_customer_id?: string | null;
  stripe_customer_details?: {
    subscription?: string;
    payment_status?: string;
  } | null;
}

const restoreUser = () => {
  const storageUser = LocalStorage.getItem('user');
  if (typeof storageUser === 'string') {
    return JSON.parse(storageUser);
  } else if (!storageUser) {
    return {};
  }
  return storageUser as CreateMutable<User>;
};

export const useUserStore = defineStore('user', {
  state: () => ({
    user: restoreUser(),
    session: null,
    persist: false,
  }),
  getters: {
    fullName: (state) => state.user?.details?.user_metadata?.full_name,
    email: (state) => state.user?.details?.user_metadata?.email,
    picture: (state) => state.user?.details?.user_metadata?.picture,
    role: (state) => state.user?.role,
    subscriptionId: (state) =>
      state.user?.stripe_customer_details?.subscription,
    isSubscribed: (state) =>
      Boolean(state.user?.stripe_customer_details) &&
      state.user?.stripe_customer_details?.payment_status === 'paid',
  },
  actions: {
    async saveUser() {
      LocalStorage.set('user', { ...this.user });
    },
    async setUserCredentials(user, session) {
      const userInfo = { id: user.id, details: user };
      this.user = { ...this.user, ...userInfo };
      this.session = session;
      this.saveUser();
    },
    async setIsRegisteringBeta(status) {
      this.user.isRegisteringBeta = status;
      this.saveUser();
    },
    async setIsSubscribing(status) {
      this.user.isSubscribing = status;
      this.saveUser();
    },
    async updateStripeCustomer() {
      try {
        const response = await apiConnector.get(
          `${CENTRALIZATION_API_URLS.USERS}/${this.user.id}`
        );

        // Explicitly cast response data to the expected structure
        const data = response.data as StripeCustomerResponse;

        this.user.stripe_customer_id = data.stripe_customer_id;
        this.user.stripe_customer_details = data.stripe_customer_details;
        this.saveUser();
      } catch (error) {
        console.error('Error updating Stripe customer:', error);
      }
    },
    async cancelSubscription(subscriptionId) {
      try {
        const stripeInfo = { subscriptionId: subscriptionId };
        const response = await apiConnector.post(
          `${CENTRALIZATION_API_URLS.STRIPE_CANCEL_SUBSCRIPTION}/`,
          stripeInfo
        );

        if (response.status === 200) {
          this.user.stripe_customer_id = null;
          this.user.stripe_customer_details = null;
          this.saveUser();
        }
      } catch (error) {
        console.error('Error cancelling subscription:', error);
      }
    },
    async pushUserToBackend(user) {
      try {
        const checkResponse = await apiConnector.get(
          `${CENTRALIZATION_API_URLS.USERS}/${user.id}`
        );

        let response = null;
        const userInfo = { id: user.id, details: user };
        if (checkResponse.status === 200) {
          response = await apiConnector.patch(
            `${CENTRALIZATION_API_URLS.USERS}/${user.id}/`,
            userInfo
          );
        } else {
          response = await apiConnector.post(
            `${CENTRALIZATION_API_URLS.USERS}/`,
            userInfo
          );
        }

        if (response.status !== 200) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = response.data;
        console.log('User data pushed to backend:', data);
        this.user = { ...this.user, ...data };
        this.saveUser();
      } catch (error) {
        console.error('Error pushing user data to backend:', error);
      }
    },
    logout() {
      this.user = null;
      this.session = null;
      LocalStorage.remove('user');
    },
  },
});
