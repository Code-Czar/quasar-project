<template>
  <q-layout>
    <q-page-container>
      <q-page>
        <q-btn v-if="isElectron" @click="installDependencies">Install Dependencies</q-btn>
        <p v-if="message">{{ message }}</p>

        <q-btn v-if="isElectron" @click="checkContainers">Check Containers</q-btn>
      </q-page>
    </q-page-container>

    <q-footer>
      <!-- Footer content goes here -->
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, defineProps } from 'vue';
import { Platform } from 'quasar';

// Props
const props = defineProps({
  productId: {
    type: String,
    required: true,
  },
});

const isElectron = Platform.is.electron;
let ipcRenderer;

if (window && window.require) {
  // const electron = window.require('electron');
  // ipcRenderer = electron?.ipcRenderer;
}

const message = ref('');

// Function to install dependencies with productId
const installDependencies = async () => {
  try {
    // @ts-expect-error electronAPI
    const result = await window.electronAPI.installDocker(props.productId);
    console.log(result); // Log or display success message
  } catch (error) {
    console.error(error); // Handle errors
  }
};

// Function to check Docker containers with productId
const checkContainers = async () => {
  try {
    // @ts-expect-error electronAPI
    const result = await window.electronAPI.checkContainers(props.productId);
    console.log(result); // Log or display success message
  } catch (error) {
    console.error(error); // Handle errors
  }
};
</script>
