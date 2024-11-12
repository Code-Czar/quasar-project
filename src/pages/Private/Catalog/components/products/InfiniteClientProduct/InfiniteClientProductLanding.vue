<template>
  <BaseStripeProduct>
    <template #product-info="{ handleSubscribe }">
      <section id="pricing" class="pricing-section">
        <div class="text-h2 text-centered q-my-md">{{ $t('pricing.title') }}</div>
        <div class="pricing-content">
          <q-card
            v-for="(card, index) in pricingCards"
            :key="index"
            class="pricing-card flex-column-centered q-mb-md"
          >
            <q-card-section class="flex-column-centered">
              <h4 class="text-h4 text-centered">{{ card.title }}</h4>
            </q-card-section>
            <hr />
            <div class="features" v-for="(item, indexItem) in card.items" :key="indexItem">
              <q-icon :name="item.icon" size="2rem" />
              <span>{{ item.title }}</span>
            </div>
            <hr />
            <q-card-section class="flex-column-centered">
              <div class="price text-centered">
                <span>{{ card.price }}</span>
                <span v-if="card.recurring"> / {{ card.recurring }}</span>
              </div>
              <q-btn @click="handleSubscribe">{{ $t('pricing.buyButton') }}</q-btn>
            </q-card-section>
          </q-card>
        </div>
      </section>
    </template>
  </BaseStripeProduct>
</template>

<script lang="ts" setup>
import { ref, defineEmits } from 'vue';
import { computed } from 'vue';

import { useI18n } from 'vue-i18n';
import { useUserStore } from 'src/stores/userStore';
import { BaseStripeProduct } from 'src/components';

const userStore_ = useUserStore();
const emit = defineEmits(['subscriptionClicked']);

const { t, locale, messages } = useI18n();
const pricingCardsTranslations = messages.value[locale.value]?.pricing?.cards;
console.log("🚀 ~ messages:", messages, locale.value, messages.value[locale.value])
const pricingCards = computed(() => {
  return pricingCardsTranslations ? Object.values(pricingCardsTranslations) : [];
});console.log("🚀 ~ pricingCards:", pricingCards, pricingCardsTranslations)

const emitSubscriptionClick = () => {
  if (userStore_.isSubscribed) {
    emit('subscriptionClicked');
  } else {
    userStore_.setIsSubscribing(true);
    emit('subscriptionClicked');
  }
};
</script>

<style scoped lang="scss">
.pricing-card {
  margin-left: auto;
  margin-right: auto;
  max-width: 30%;
}

.features {
  display: flex;
  align-items: center;
  gap: 16px;
}

.price {
  font-size: 2rem;
}
</style>
