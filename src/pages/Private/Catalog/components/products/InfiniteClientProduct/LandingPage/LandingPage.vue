<template>
    <q-page class="home-page">
      <q-page-sticky position="top">
        <q-page-scroller :offset="offset" :scroll-duration="scrollDuration" :easing="scrollEasing" />
      </q-page-sticky>
  
      <OurMissionSection />
      <FeaturesSection />
      <HowItWorksSection2 />
      <TestimonialsSection />
      <!-- Features Section -->
      <!-- How It Works Section -->
      <!-- <RoadmapSection /> -->
      <!-- <RegisterBetaSection /> -->
      <PricingSection @subscriptionClicked="handleSubscribe" />
  
      <!-- <PublicFooterWide /> -->
    </q-page>
  </template>
  
  <script lang="ts" setup>
  import { ref, onMounted, watchEffect } from 'vue';
  
  import { useRoute, useRouter } from 'vue-router';
  
//   import { PublicFooterWide } from '@/components';
//   import { CarouselHeader } from '@/components';
  // import HowItWorksSection from './LandingPage/HowItWorksSection.vue';
  import HowItWorksSection2 from './HowItWorksSection2.vue';
  import FeaturesSection from './FeaturesSection.vue';
  import RoadmapSection from './RoadmapSection.vue';
  import OurMissionSection from './OurMissionSection.vue';
  import RegisterBetaSection from './RegisterBetaSection.vue';
  import PricingSection from './PricingSection.vue';
  import TestimonialsSection from './TestimonialsSection.vue';
  
  const router = useRouter();
  const offset = ref(100); // Adjust the offset as needed
  
  const scrollDuration = ref(500); // Adjust the scroll duration as needed
  const scrollEasing = ref('easeInOutQuad'); // Adjust the easing function as needed
  const section = ref(useRoute().query.section);
  
  onMounted(() => {
    const sectionId = section.value;
    if (sectionId) {
      scrollToSection(sectionId);
    }
  });
  
  const handleSubscribe = async () => {
    router.push({name: 'login'});
  };
  
  const scrollToSection = (sectionId) => {
    const sectionElement = document.getElementById(sectionId);
    if (sectionElement) {
      console.log('🚀 ~ sectionElement:', sectionElement);
      setTimeout(() => {
        sectionElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 500);
    }
  };
  
  watchEffect(() => {
    // section.value = useRoute().query.section;
    if (section.value) {
      scrollToSection(section.value);
    }
  });
  </script>
  
  <style lang="scss" scoped>
  .home-page {
    display: flex;
    flex-direction: column;
    position: absolute;
    top: 0;
    left: 0;
    width: calc(100%);
  }
  
  /* Styles for other sections */
  section {
    min-height: 400px;
    /* adjust as needed */
    // padding: 20px;
  }
  
  footer {
    margin-top: auto;
    /* Push footer to the bottom */
  }
  .q-icon{
    margin:unset !important;
  }
  </style>
  