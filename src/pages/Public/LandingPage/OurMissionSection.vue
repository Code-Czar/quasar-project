<template>
    <section id="our-mission"  class="our-mission-section section" dark="true">
      <div class="text-h2 text-centered q-my-md">{{$t('ourMission.header')}}</div>
      <div class="mission-statement">
        {{ $t('ourMission.content') }}
      </div>
    </section>
  </template>
  
  <script lang="ts" setup>
  // Script (if needed)
  </script>
  
  <style lang="scss" scoped>
  .our-mission-section {
    // padding: 20px;
    text-align: center;
  }
  
  .mission-statement {
    font-size: 1.1em;
    /* Add more styling as per your design */
  }
  </style>
  