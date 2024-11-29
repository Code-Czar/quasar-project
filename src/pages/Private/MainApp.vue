<template>
  <q-layout>
    <!--  -->

    <q-page-container>
      <q-page>
        <q-btn v-if=isElectron @click="installDependencies">Install Dependencies</q-btn>
        <p v-if="message">{{ message }}</p>
        
        <q-btn v-if=isElectron @click="checkContainers">Check Containers</q-btn>

      </q-page>
    </q-page-container>

    <q-footer>
      <!-- Footer content goes here -->
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Platform } from 'quasar';
const isElectron = Platform.is.electron;

// Check if running in Electron environment
let ipcRenderer;
if (window && window.require) {
  // const electron = window.require('electron');
  // ipcRenderer = electron?.ipcRenderer;
}

const message = ref('');

const installDependencies = async () => {
  try {
    // @ts-expect-error electronapi
    const result = await window.electronAPI.installDocker();
    console.log(result); // Log or display success message
  } catch (error) {
    console.error(error); // Handle errors
  }
};
const checkContainers = async () => {
  try {
    // @ts-expect-error electronapi

    const result = await window.electronAPI.checkContainers();
    console.log(result); // Log or display success message
  } catch (error) {
    console.error(error); // Handle errors
  }
};
</script>
