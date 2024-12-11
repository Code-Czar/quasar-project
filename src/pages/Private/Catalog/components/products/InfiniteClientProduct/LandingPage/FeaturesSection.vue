<template >
  <section
    v-for="(section, index) in featureSections"
    :key="index"
    :style="{ backgroundColor: section.background }"
    class="features-section"
    :id="`section${index+1}`"
    
  >
    <h2 v-html="section.sectionTitle"></h2>
    <p v-html="section.sectionSubtitle"></p>
    <div class="features-list q-my-xl">
      <div
        v-for="(feature, idx) in section.list"
        :key="idx"
        class="feature-item flex-column"
      >
        <q-icon :name="feature.icon" class="feature-icon" />
        <div style="display:flex; flex-direction: column; justify-content: center; ">
          <h3 v-html="feature.title" style="display:flex; justify-content: center;"></h3>
          <p v-html="feature.description"></p>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t, locale, messages } = useI18n();

const featureSections = computed(() => {
  const currentLocale = locale.value || 'en'; // Fallback to 'en' if no locale is set
  return messages.value[currentLocale]?.features?.sections || [];
});
const scrollToSection = (sectionId: string) => {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth' });
  }
};
console.log("🚀 ~ featureSections ~ featureSections:", locale, messages, featureSections)
</script>

<style scoped lang="scss">
.features-section {
  padding: 2rem;
  text-align: center;
}

.features-list {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  justify-content: center;

}

.feature-item {
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 300px;
  text-align: left;
}

.feature-icon {
  font-size: 2rem;
  margin-right: 1rem;
  // color: var(--q-secondary);
  color: var(--white-pristine) !important;

}

</style>
