<template>
  <section class="how-it-works-section section-with-padding">
    <div class="text-h2 text-centered text-h2-spacer q-my-md">
      {{ proxy.$t('howItWorks.header') }}
    </div>

    <div class="card-container">
      <CardComponent
        v-for="(card, index) in cards"
        :key="index"
        :title="card.title"
        :text="card.text"
      />
    </div>
  </section>
</template>

<script setup>
import { getCurrentInstance } from 'vue';
import { CardComponent } from 'src/components';
const { proxy } = getCurrentInstance();
const cards = [
  {
    title: proxy.$t('howItWorks.card1.title'),
    text: proxy.$t('howItWorks.card1.text'),
  },
  {
    title: proxy.$t('howItWorks.card2.title'),
    text: proxy.$t('howItWorks.card2.text'),
  },
  {
    title: proxy.$t('howItWorks.card3.title'),
    text: proxy.$t('howItWorks.card3.text'),
  },
];
</script>

<style lang="scss" scoped>
.card-container {
  // display: flex;
  // flex-direction: row;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  // gap: 10px;
  gap: 2rem;
  text-align: center;
}

</style>
