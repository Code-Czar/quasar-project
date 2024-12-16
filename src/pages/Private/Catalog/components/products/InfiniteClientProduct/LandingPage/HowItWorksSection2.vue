<template>
  <section 
    class="how-it-works-section q-py-xl q-px-md" 
    :style="{ backgroundColor: backgroundColor }"
  >
    <!-- Title -->
    <h1 class="text-centered q-my-xl">
      {{ t('howItWorks.header') }}
    </h1>

    <!-- Steps Timeline -->
    <div class="steps-timeline">
      <div
        v-for="(step, index) in steps"
        :key="index"
        class="step-item flex-column text-centered justify-center"
      >
        <q-icon :name="step.icon" class="step-icon" style="margin:unset"/>
        <div class="step-content text-centered">
          <h3 v-html="step.title"></h3>
          <p v-html="step.description"></p>
        </div>
      </div>
    </div>

    <!-- CTA Button -->
    <div class="cta-container">
      <!-- <q-btn color="primary" :label=" t('buttons.discover') " @click="handleDiscoverClick" /> -->
      <q-btn color="secondary" @click="scrollToSection('pricing')" class="button-default">
  Discover
</q-btn>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t, locale, messages } = useI18n();

// Background color for the section
const backgroundColor = computed(() => 'var(--blue-ia-3)');

// Steps for "How It Works"
const steps = computed(() => {
  const currentLocale = locale.value || 'en'; // Fallback to 'en' if no locale is set
  return messages.value[currentLocale]?.howItWorks?.steps || [];
});

const scrollToSection = (sectionId: string) => {
  const section = document.getElementById(sectionId);
  console.log("🚀 ~ scrollToSection ~ section:", section)
  if (section) {
    section.scrollIntoView({ behavior: 'smooth' });
  }
};

// Handle CTA button click
const handleDiscoverClick = () => {
  console.log('CTA Button Clicked!');
};
</script>

<style lang="scss" scoped>
.how-it-works-section {
  text-align: center;
  padding: 2rem;
}

.steps-timeline {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  justify-content: center;
  margin: 2rem 0;
}

.step-item {
  display: flex;
  align-items: center;
  text-align: left;
  max-width: 300px;
  min-width: 20rem;

}

.step-icon {
  font-size: 2rem;
  margin-right: 1rem;
  color: var(--q-white);
}

.step-content {
  h3 {
    font-size: 1.2rem;
    font-weight: bold;
  }

  p {
    font-size: 1rem;
    color: var(--text-primary);
  }
}

.cta-container {
  margin-top: 2rem;
}
</style>
