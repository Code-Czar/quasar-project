<template>
  <section class="video-section" style="padding: unset">
    <q-carousel class="video-carousel-header" v-model="slide" animated infinite height="calc(100%)">
      <q-carousel-slide v-for="(item, index) in carouselData" :key="index" :name="index">
        <video :id="'videoBg' + index" autoplay loop muted playsinline width="250">
          <!-- <source src="@/assets/stocks_1.webm" type="video/webm" /> -->
          <source :src="item.videoSrc" type="video/webm" />
          <!-- <source :src="require(item.videoSrc)" type="video/webm" /> -->

          <!-- <source src="@/assets/stocks_1.webm" type="video/webm" /> -->
          Your browser does not support the video tag.
        </video>
        <div class="video-overlay"></div>

        <div class="overlay-content">
          <div class="two-third">
            <h1 class="text-h2 text-white">{{ item.headline }}</h1>
            <div class="flex-column justify-center" style="align-items: center;">
              <div class="flex-column flex-grow-1" style="display:flex; flex-grow:1">

                <div v-for="line in Object.values(item.text)">
                  {{ line }}
                </div>
              </div>
           
              <!-- <q-btn color="primary" @click="goToApp" class="button-default" style="width:calc(20%)">Discover</q-btn> -->
            </div>
          </div>
          <div class="one-third">
            <LoginComponent/>

          </div>
        </div>
      </q-carousel-slide>
    </q-carousel>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import {LoginComponent} from 'src/shared-components'

import { useI18n } from "vue-i18n";
const { t } = useI18n();
const router = useRouter();

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
  intervalRef.value = setInterval(advanceSlide, SLIDE_DURATION); // Change 5000 to however many milliseconds you want each slide to show
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
  /* Adjust opacity as needed */
}

.overlay-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  display:flex;
  flex-direction: row;
  width:95%;
}

.two-third{
  // background-color: red;
  width: calc(2/3 *100%);
}
.one-third{
  // background-color: red;
  width: calc(1/3 *100%);
}

.login-card {
  margin-left: 2rem !important;
  margin-right: 2rem !important;
  border-radius: 8px;
  justify-content: center;
  align-items: center;
}

/* Override the default transition duration */
</style>

<style lang="scss">
.video-section .q-panel {
  --q-transition-duration: 1000ms !important;
}
</style>
