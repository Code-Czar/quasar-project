<template>
  <section class="video-section" style="padding: unset">
    <q-carousel class="video-carousel-header" v-model="slide" animated infinite height="calc(100%)">
      <q-carousel-slide v-for="(item, index) in carouselData" :key="index" :name="index">
        <video :id="'videoBg' + index" autoplay loop muted playsinline width="250">
          <source :src="item.videoSrc" type="video/webm" />
          Your browser does not support the video tag.
        </video>
        <div class="video-overlay"></div>

        <div class="overlay-content" v-if="!isUpdating">
          <div class="two-third">
            <h1 class="text-h2 text-white">{{ item.headline }}</h1>
            <div class="flex-column justify-center" style="align-items: center;">
              <div class="flex-column flex-grow-1" style="display:flex; flex-grow:1">
                <div v-for="line in Object.values(item.text)" :key="line">
                  {{ line }}
                </div>
              </div>
            </div>
          </div>
          <div class="one-third">
            <LoginComponent />
          </div>
        </div>

        <div class="overlay-content" v-else>
          <div class="loading-container">
            <p class="loading-message">{{ message }}</p>
            <p class="loading-progress">{{ updateProgressPercent }}%</p>
            <q-spinner size="50px" color="primary" />
          </div>
        </div>
      </q-carousel-slide>
    </q-carousel>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, defineProps } from "vue";
import { useRouter } from "vue-router";
import { LoginComponent } from 'src/shared-components';
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const router = useRouter();

// Props
defineProps({
  isUpdating: Boolean,
  message: {
    type: String,
    default: "Loading...",
  },
  updateProgressPercent: {
    type: Number,
    default: 0,
  },
});

const slide = ref(0); // Current slide index
const intervalRef = ref(null);
const SLIDE_DURATION = 2000;

const carouselData = computed(() => [
  {
    videoSrc: 'robot_header.webm',
    headline: t('heroHeader.slide1.header'),
    text: {
      line1: t('heroHeader.slide1.subtitle.line1'),
      line2: t('heroHeader.slide1.subtitle.line2'),
    },
  },
  {
    videoSrc: 'client_header.webm',
    headline: t('heroHeader.slide2.header'),
    text: {
      line1: t('heroHeader.slide2.subtitle.line1.text'),
      line2: t('heroHeader.slide2.subtitle.line2'),
      line3: t('heroHeader.slide2.subtitle.line3'),
      line4: t('heroHeader.slide2.subtitle.line4'),
    },
  },
]);

const advanceSlide = () => {
  slide.value = (slide.value + 1) % carouselData.value.length;
};

const goToApp = () => {
  router.push("/app");
};

onMounted(() => {
  intervalRef.value = setInterval(advanceSlide, SLIDE_DURATION);
});

onUnmounted(() => {
  clearInterval(intervalRef.value);
});
</script>

<style scoped lang="scss">
.video-section {
  position: relative;
  height: calc(2 / 3 * 100vh);
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
  display: flex;
  flex-direction: row;
  width: 95%;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.loading-message {
  margin-top: 1rem;
  font-size: 1.25rem;
  color: white;
}

.loading-progress {
  margin-top: 0.5rem;
  font-size: 1rem;
  color: white;
}

.two-third {
  width: calc(2 / 3 * 100%);
}

.one-third {
  width: calc(1 / 3 * 100%);
}
</style>

<style lang="scss">
.video-section .q-panel {
  --q-transition-duration: 1000ms !important;
}
</style>
