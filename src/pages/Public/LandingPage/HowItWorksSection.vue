<template>
  <section class="how-it-works-section">
    <div class="text-h2 text-centered q-my-md">{{ $t('howItWorks.header') }}</div>

    <q-card class="feature-card q-mb-md">
      <q-card-section>
        <div class="text-h6">{{ $t('howItWorks.card1.title') }}</div>
      </q-card-section>
      <q-card-section>
        {{ $t('howItWorks.card1.text') }}
      </q-card-section>
    </q-card>

    <q-card class="feature-card q-mb-md">
      <q-card-section>
        <div class="text-h6">{{ $t('howItWorks.card2.title') }}</div>
      </q-card-section>
      <q-card-section>
        {{ $t('howItWorks.card2.text') }}
      </q-card-section>
    </q-card>
    <q-card class="feature-card q-mb-md">
      <q-card-section>
        <div class="text-h6">{{ $t('howItWorks.card3.title') }}</div>
      </q-card-section>
      <q-card-section class="multiline-string">
        <!-- <html> -->

        {{ $t('howItWorks.card3.text') }}
        <!-- </html> -->
      </q-card-section>
    </q-card>




  </section>
</template>
  
<script lang="ts" setup>
// Script (if needed)
</script>
  
<style lang="scss" scoped>
.how-it-works-section {
  /* Styling for the how-it-works section */
  background-color: $dark-page;
}

.step {
  /* Styling for each step */
}
</style>
  