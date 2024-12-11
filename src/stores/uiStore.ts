import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUiStore = defineStore('ui', () => {
  const leftDrawerOpen = ref(false);

  return {
    leftDrawerOpen,
  };
});
