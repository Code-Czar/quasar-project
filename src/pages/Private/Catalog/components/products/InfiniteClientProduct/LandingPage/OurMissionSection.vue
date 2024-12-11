<template>
  <section class="our-mission-section section " dark="true">
    <!-- Video Carousel Header -->
    <q-carousel
      class="video-carousel-header"
      v-model="slide"
      animated
      infinite
      height="100vh"
    >
      <q-carousel-slide
        v-for="(item, index) in carouselData"
        :key="index"
        :name="index"
      >
        <video
          :id="'videoBg' + index"
          autoplay
          loop
          muted
          playsinline
          width="250"
        >
          <source :src="item.videoSrc" type="video/webm" />
          Your browser does not support the video tag.
        </video>
        <div class="video-overlay"></div>
        <div class="overlay-content">
          <h1 class="" v-html="item.header"></h1>
          <div class="mission-statement">
            <p v-for="line in parseContent(item.content)" :key="line.text">
              <q-icon v-if="line.icon" :name="line.icon" class="icon" />
              <span v-html="line.text"></span>
            </p>
          </div>
          <q-btn color="secondary" @click="scrollToSection('section1')" class="button-default">
  Discover
</q-btn>
        </div>
      </q-carousel-slide>
    </q-carousel>
  </section>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const router = useRouter();
const slide = ref(0);
const intervalRef = ref(null);
const SLIDE_DURATION = 3000;

const carouselData = ref([
  {
    videoSrc: 'robot_header.webm',
    header: t('ourMission.slide1.header'),
    content: t('ourMission.slide1.content'),
  },
  // {
  //   videoSrc: '/Client_header.webm',
  //   header: t('ourMission.slide2.header'),
  //   content: t('ourMission.slide2.content'),
  // },
]);

const advanceSlide = () => {
  slide.value = (slide.value + 1) % carouselData.value.length;
};

const parseContent = (content: string) =>
  content.split('<br />').map((line) => {
    if (line.includes('Facebook')) {
      return {
        text: line.replace('Facebook', '<strong>Facebook</strong>'),
        icon: 'fab fa-facebook',
      };
    }
    if (line.includes('Instagram')) {
      return {
        text: line.replace('Instagram', '<strong>Instagram</strong>'),
        icon: 'fab fa-instagram',
      };
    }
    if (line.includes('TikTok')) {
      return {
        text: line.replace('TikTok', '<strong>TikTok</strong>'),
        icon: 'fab fa-tiktok',
      };
    }
    return { text: line, icon: null };
  });

// const goToApp = () => {
//   router.push('/app');
// };

const scrollToSection = (sectionId: string) => {
  const section = document.getElementById(sectionId);
  console.log("🚀 ~ scrollToSection ~ section:", section)
  if (section) {
    section.scrollIntoView({ behavior: 'smooth' });
  }
};
onMounted(() => {
  intervalRef.value = setInterval(advanceSlide, SLIDE_DURATION);
});

onUnmounted(() => {
  clearInterval(intervalRef.value);
});
</script>

<style scoped lang="scss">
.our-mission-section {
  position: relative;
  text-align: center;
  height: 100vh;
  overflow: hidden;
  color: var(--q-primary);

  .video-carousel-header {
    height: 100%;
    width: 100%;
  }

  video {
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
    background-color: rgba(0, 0, 0, 0.6);
  }

  .overlay-content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    z-index: 2;
  }

  .mission-statement {
    font-size: 1.1em;
    margin-bottom: 2rem;

    .icon {
      margin-right: 0.5rem;
      font-size: 1.2em;
      vertical-align: middle;
    }

    strong {
      color: var(--q-primary);
    }
  }

  .discover-button {
    margin-top: 1.5rem;
  }
}
</style>
