<template>
  <section id="pricing" class="pricing-section">
    <div class="text-h2 text-centered q-my-md">{{ $t('pricing.title') }}</div>
    <div class="pricing-content">
      <q-card
        v-for="(card, index) in pricingCards"
        :key="index"
        class="pricing-card flex-column-centered  q-mb-md"
      >
        <q-card-section class="flex-column-centered" style="padding: unset">
          <h4 class="text-h4 text-centered" style="padding: unset">
            {{ card.title }}
          </h4>
        </q-card-section>
        <hr style="width: 100%" />
        <div
          style="
            justify-content: center;
            align-items: center;
            padding-top: 3rem;
            padding-bottom: 3rem;
          "
        >
          <div
            v-for="(item, indexItem) in card.items"
            :key="indexItem"
            class="price-item-line-container"
          >
            <div class="centered-content">
              <q-icon :name="item.icon" size="2rem" class="centered-content" />
            </div>
            <span>{{ item.title }}</span>
          </div>
        </div>
        <hr style="width: 100%" />
        <q-card-section class="flex-column-centered">
          <div class="price text-centered">
            <span>{{ card.price }}</span>
            <span v-if="card.recurring"> / {{ card.recurring }}</span>
          </div>
          <q-btn class="button-default" @click.stop="goToSubscription">
            {{ $t('pricing.buyButton') }}
          </q-btn>
        </q-card-section>
      </q-card>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { ref, defineEmits } from 'vue';
import { getCurrentInstance } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useUserStore } from 'src/stores/userStore';

const router = useRouter();
const userStore_ = useUserStore();
const { t, messages, locale } = useI18n({ useScope: 'global' });

const emit = defineEmits(['subscriptionClicked']);

interface PricingItem {
  icon: string;
  title: string;
}

interface Card {
  title: string;
  items: PricingItem[];
  price: string;
  recurring?: string;
}

// Get translated pricing cards and type it as an array of Card
const pricingCards = ref<Card[]>(Object.values(messages.value[locale.value]['pricing']['cards']));

// Function to handle subscription click
const goToSubscription = async () => {
  if (userStore_.user.isSubscribing || userStore_.isSubscribed) {
    emit('subscriptionClicked');
  } else {
    userStore_.setIsSubscribing(true);
    router.push({ name: 'login' });
  }
};
</script>

<style lang="scss" scoped>
.pricing-card {
  margin-left: auto;
  margin-right: auto;
  max-width: 30%;
}
.price-item-line-container {
  justify-content: center;
  align-items: center;
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 16px;
  width: 100%;
}
.centered-content {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: auto;
}
.price {
  font-size: 2rem;
}
</style>
