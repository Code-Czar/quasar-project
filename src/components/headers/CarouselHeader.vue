<template>
  <section class="video-section" style="padding:unset">
    <q-carousel v-model="slide" animated infinite height="calc(2/3 * 100vh)">
      <q-carousel-slide v-for="(item, index) in translatedCarouselData" :key="index" :name="index">
        <video :id="'videoBg' + index" autoplay loop muted playsinline width="250">
          <source :src="item.videoSrc" type="video/webm" />
          Your browser does not support the video tag.
        </video>
        <div class="video-overlay"></div>
        <div class="overlay-content">
          <h1 class="text-h2 text-white">{{ item.headline }}</h1>
          <div v-if="item.text.line1" class="text-subtitle1 q-my-md text-white">{{ item.text.line1 }}</div>
          <div v-if="item.text.line2" class="text-subtitle1 q-my-md text-white">{{ item.text.line2 }}</div>
          <q-btn color="primary" @click="goToApp" class="button-default">Discover</q-btn>
        </div>
      </q-carousel-slide>
    </q-carousel>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n({ useScope: 'global' });
console.log("🚀 ~ locale:", locale)
const router = useRouter();
const slide = ref(0);
const intervalRef = ref(null);
const SLIDE_DURATION = 3000;

// Use a separate reactive ref to track the locale
const currentLocale = ref(locale.value);

// Watch for changes in i18n's locale and update `currentLocale`
watch(
  locale,
  (newLocale) => {
    console.log("🚀 ~ newLocale:", newLocale)

    currentLocale.value = newLocale;
    
  },
  { immediate: true }
);

// Compute `carouselData` based on `currentLocale`
const translatedCarouselData = computed(() => [
  {
    videoSrc: 'robot_header.webm',
    headline: t('heroHeader.slide1.header'),
    text: {
      line1: t('heroHeader.slide1.subtitle.line1'),
      line2: t('heroHeader.slide1.subtitle.line2'),
    },
  },
  {
    videoSrc: '/Client_header.webm',
    headline: t('heroHeader.slide2.header'),
    text: {
      line1: t('heroHeader.slide2.subtitle.line1'),
    },
  },
]);

const advanceSlide = () => {
  slide.value = (slide.value + 1) % translatedCarouselData.value.length;
};

const goToApp = () => {
  router.push('/app');
};

onMounted(() => {
  intervalRef.value = setInterval(advanceSlide, SLIDE_DURATION);
});

onUnmounted(() => {
  clearInterval(intervalRef.value);
});

// Watch for `currentLocale` changes to refresh `translatedCarouselData`
watch(currentLocale, () => {
  slide.value = 0; // Reset slide to the beginning when locale changes
});
</script>

<style scoped lang="scss">
.video-section {
  position: relative;
  height: calc(2/3 * 100vh);
  overflow: hidden;
}

.video-section video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}

.overlay-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}
</style>
