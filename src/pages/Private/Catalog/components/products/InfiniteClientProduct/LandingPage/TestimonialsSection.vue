<template>
  <section class="testimonials-section q-py-xl" :style="{ backgroundColor: backgroundColor }">
    <!-- Section Title -->
    <h1 class="text-centered q-my-lg">{{ t('testimonials.header') }}</h1>

    <!-- Carousel -->
    <q-carousel
      v-model="currentSlide"
      swipeable
      animated
      navigation
      arrows
      padding
      control-color="white"
      class="testimonials-carousel bg-transparent text-white shadow-1 rounded-borders"
      height="300px"
    >
      <q-carousel-slide
        v-for="(testimonial, index) in testimonials"
        :key="index"
        :name="index"
        class="testimonial-slide column no-wrap flex-center"
      >
        <!-- <q-img
          :src="testimonial.image"
          alt="Customer Image"
          class="testimonial-image"
          ratio="1"
        /> -->
        <q-rating :value="testimonial.rating" color="yellow" class="q-my-md" />
        <blockquote class="testimonial-quote">{{ testimonial.quote }}</blockquote>
        <p class="testimonial-name">{{ testimonial.name }}</p>
      </q-carousel-slide>
    </q-carousel>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t, locale, messages } = useI18n();

const currentSlide = ref(0);

// Testimonials Data
const testimonials = computed(() => {
  const currentLocale = locale.value || 'en';
  return messages.value[currentLocale]?.testimonials?.list || [];
});

// Background color
const backgroundColor = computed(() => 'var(--section-even-background)');
</script>

<style scoped lang="scss">
.testimonials-section {
  text-align: center;
}

.testimonials-carousel {
  max-width: 800px;
  margin: 0 auto;
}

.testimonial-slide {
  text-align: center;
}

.testimonial-image {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin-bottom: 1rem;
}

.testimonial-quote {
  font-style: italic;
  margin: 0 1rem 1rem;
}

.testimonial-name {
  font-weight: bold;
  margin-top: 1rem;
}
</style>
