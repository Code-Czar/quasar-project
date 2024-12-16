<template>
  <BaseStripeProduct>
    <template #product-info="{ handleSubscribe }">
      <section id="pricing" class="pricing-section">
        <h2 class="text-centered q-my-md">{{ $t('pricing.title') }}</h2>
        <div class="pricing-content flex-column align-center">
          <q-card
            v-for="(card, index) in pricingCards"
            :key="index"
            class="pricing-card flex-column-centered q-mb-md"
          >
            <!-- Card Header -->
            <q-card-section class="flex-column-centered card-header-section">
              <h2 class="text-h4 text-centered">{{ card.title }}</h2>
            </q-card-section>

            <!-- Features -->
            <div class="features-list-container  flex-column justify-center align-center q-px-xl" style="display:flex; justify-content: center; align-items: center;">
              <div class="flex flex-column justify-center align-center" style="display:flex; justify-content: center; align-items: center;">
              <div class="category" v-for="(category, idx) in card.items" :key="idx">
                <h3 class="category-title">{{ category.category }}</h3>
                <div class="subcategory" v-for="(sub, subIdx) in category.subcategories" :key="subIdx">
                  <h4 class="subcategory-title">{{ sub.title }}</h4>
                  <!-- Render Features Dynamically -->
                  <div v-if="Array.isArray(sub.features)">
                    <!-- Features with Platforms -->
                    <div v-for="(feature, featureIdx) in sub.features" :key="featureIdx">
                      <strong v-if="feature.platform">{{ feature.platform }}</strong>
                      <ul>
                        <li v-for="(detail, detailIdx) in feature.details" :key="detailIdx" class="feature-item">
                          <i class="fas fa-check-circle check-icon"></i>
                          <span>{{ detail }}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <!-- Render Single-Level Features -->
                  <ul v-else>
                    <li v-for="(detail, detailIdx) in sub.features.details || sub.features" :key="detailIdx" class="feature-item">
                      <i class="fas fa-check-circle check-icon"></i>
                      <span>{{ detail }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            </div>

            <!-- Pricing and CTA -->
            <q-card-section class="flex-column-centered">
              <div class="price text-centered">
                <span
                  v-if="card.reductionPrice"
                  class="regular-price with-reduction"
                >
                  {{ card.price }}
                </span>
                <span v-else class="regular-price">{{ card.price }}</span>
                <span v-if="card.reductionPrice" class="promotion-price">
                  {{ card.reductionPrice }}
                </span>
                <div class="recurring-price">
                  <span v-if="card.recurring">
                    {{ card.recurring }}
                  </span>
                  <div v-if="card.note" class="note">{{ card.note }}</div>
                </div>
              </div>
              <q-btn
                @click="handleSubscribe"
                color="secondary"
              >
                {{ $t('pricing.buyButton') }}
              </q-btn>
            </q-card-section>
          </q-card>
        </div>
      </section>
    </template>
  </BaseStripeProduct>
</template>



<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { BaseStripeProduct } from 'src/components';

const { t, locale, messages } = useI18n();

interface PricingFeature {
  platform?: string;
  details: string[];
}

interface PricingSubcategory {
  title: string;
  features: PricingFeature[] | { details: string[] } | string[];
}

interface PricingCategory {
  category: string;
  subcategories: PricingSubcategory[];
}

interface PricingCard {
  title: string;
  items: PricingCategory[];
  price: string;
  reductionPrice?: string;
  recurring?: string;
  note?: string;
}

const pricingCards = computed<PricingCard[]>(() => {
  const currentLocale = locale.value || 'en';
  const cards = messages.value[currentLocale]?.pricing?.cards || {};
  return Object.values(cards) as PricingCard[];
});
</script>



<style scoped lang="scss">
.card-header-section {
  background-color: var(--q-secondary);
  width: 100%;
}
.pricing-card{
  width: 40%;
}

.features-list-container {
  // width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.category-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-top: 1rem;
  color: var(--text-primary);
}

.subcategory-title {
  font-size: 1.2rem;
  margin: 1rem 0 0.5rem;
  color: var(--text-secondary);
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 0.5rem;
}

.check-icon {
  color: var(--q-secondary); /* Customizable color */
  font-size: 1.2rem;
}

.price {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.regular-price {
  font-size: 1.5rem;
}

.regular-price.with-reduction {
  text-decoration: line-through;
  color: red;
}

.promotion-price {
  font-size: 1.8rem;
  font-weight: bold;
  margin-left: 0.5rem;
  color: var(--q-secondary);
}

.recurring-price {
  font-size: 1rem;
  color: var(--text-primary);
}

.note {
  font-size: 0.8rem;
  color: var(--text-secondary);
}
h3, h4{
  margin: unset;
  padding: unset;
}
</style>
