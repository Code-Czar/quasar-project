<template>
    <section id="roadmap" class="roadmap-section">
      <div class="text-h2 text-centered q-my-md">{{ $t('roadmap.title') }}</div>
      <div class="roadmap">
        <div class="roadmap-item" v-for="(item, index) in roadmapItems" :key="index">

          
        </div>
        <img src="src/assets/roadmap_v1.webp" />
      </div>
    </section>
  </template>
  
  <script lang="ts" setup>
  import { ref } from 'vue';
  
  const roadmapItems = ref([
    {
      title: 'Phase 1',
      date: 'Q1 2024',
      description: 'Initial development and launch of the platform.'
    },
    {
      title: 'Phase 2',
      date: 'Q2 2024',
      description: 'Introduction of new features such as...'
    },
    // Add more roadmap items as needed
  ]);
  </script>
  
  <style lang="scss" scoped>


  .roadmap{
    display:flex;
    justify-content: center;
  }
  
  .roadmap-item {
    /* Styling for each roadmap item */
  }
  </style>
  