<template>
    <section id="features" class="features-section section-with-padding">
      <div class="text-h2 text-h2-spacer text-centered q-my-md">{{$t('features.header')}}</div>
  
      <div class="card-container">
      <CardComponent v-for="(card, index) in cards" :key="index" :title="card.title" :text="card.text" class="card" />
    </div>
    </section>
  </template>
  
  <script lang="ts" setup>
  import {getCurrentInstance} from 'vue'; 
  import {CardComponent} from 'src/components'; 
  const {proxy}= getCurrentInstance()
  const cards = [
    {
      title: proxy.$t('features.card1.title'),
      text: proxy.$t('features.card1.text'),
    },
    {
      title: proxy.$t('features.card2.title'),
      text: proxy.$t('features.card2.text'),
    },
    {
      title: proxy.$t('features.card3.title'),
      text: proxy.$t('features.card3.text'),
    },
    {
      title: proxy.$t('features.card4.title'),
      text: proxy.$t('features.card4.text'),
    },
  ];
  </script>
  
  <style lang="scss" scoped>
 
.card-container {
  // display: flex;
  // flex-direction: row;
  display: grid;
      grid-template-columns: repeat(4, 1fr);
  gap: 2rem;
  text-align: center;
}
.card{
  flex: 1;
}
  </style>
  