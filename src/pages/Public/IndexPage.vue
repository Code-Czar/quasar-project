<template>
  <q-page class="home-page">
    <q-page-sticky position="top">
      <!-- <q-page-scroller
        :scroll-duration="scrollDuration"
        :easing="scrollEasing"
      /> -->
    </q-page-sticky>
    <CarouselLoginHeader
      :is-updating="isUpdating"
      :message="updateMessage"
      :update-progress-percent="updateProgress"
    />
    <PublicFooterWide v-if="!isUpdating"/>
  </q-page>
</template>

<script lang="ts" setup>
import { ref, onMounted, watchEffect } from 'vue';

import { useRoute, useRouter } from 'vue-router';

import { PublicFooterWide } from 'src/components';
import { CarouselLoginHeader } from 'src/shared-components';

const router = useRouter();
const offset = ref(100); // Adjust the offset as needed
console.log("🚀 ~ offset:", offset)

const scrollDuration = ref(500); // Adjust the scroll duration as needed
const scrollEasing = ref('easeInOutQuad'); // Adjust the easing function as needed
const section = ref(useRoute().query.section);
const isUpdating = ref(false);
const updateMessage = ref('');
const updateProgress = ref(0);

onMounted(async () => {
  window.electronAPI.onUpdateProgress((event, data) => {
    isUpdating.value = true;
    console.log("🚀 ~ window.electronAPI.onUpdateProgress ~ isUpdating.value:", isUpdating.value)
    updateMessage.value = data.stage;
    console.log("🚀 ~ window.electronAPI.onUpdateProgress ~ updateMessage.value:", updateMessage.value)
    updateProgress.value = data.progress;
    console.log("🚀 ~ window.electronAPI.onUpdateProgress ~ updateProgress.value:", updateProgress.value)
    if (data.progress === 100) {
      isUpdating.value = false;
    }
  });



  const { update_available, userResponse } =
  await window.electronAPI.checkInstallerUpdates();
  console.log("🚀 ~ onMounted ~ update_available:", update_available)

  
});

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
  width: 99.9vw;
  overflow: hidden;
}

/* Styles for other sections */
section {
  min-height: 400px;
  /* adjust as needed */
  padding: 20px;
}

footer {
  margin-top: auto;
  /* Push footer to the bottom */
}

.video-carousel-header,
.video-section {
  height: 100vh;
}

.footer-container {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
}
</style>
