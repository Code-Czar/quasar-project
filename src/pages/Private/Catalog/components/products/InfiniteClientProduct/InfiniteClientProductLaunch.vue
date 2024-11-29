<template>
  <p>{{ message }}</p>
</template>

<script setup lang="ts">
import { ref, defineProps, onMounted, onUnmounted } from 'vue';
import { Platform } from 'quasar';
const { ipcRenderer } = window.require('electron');


// Props
const props = defineProps({
  productId: {
    type: String,
    required: true,
  },
  product:{
    // type: typeof any, 
    required: true,
  }
});

const isElectron = Platform.is.electron;
const message = ref('Initializing...');
const updateStage = ref<string | null>(null);
const updateProgress = ref<number | null>(null);
const updateMessage = ref<string | null>(null);


// const updateMessage = async (inputMessage) =>{
//   console.log("🚀 ~ updateMessage ~ inputMessage:", inputMessage)
//   message.value = inputMessage
// }


// Function to check for updates
const checkForUpdates = async (updateMessage) => {
  // console.log("WINDOW ELECTRON API",window.electronAPI); // Check if electronAPI is available
  console.log("PRODUCT ID ",props.productId); // Check if electronAPI is available
  console.log("PRODUCT value ",props.product); // Check if electronAPI is available
  try {
    // @ts-expect-error electronAPI
    const {update_available, userResponse} = await window.electronAPI.checkForUpdates(props.product.product_name, "mac", "arm64");

    if(update_available && userResponse){

      const result = await window.electronAPI.installSoftwareUpdate(props.product.product_name, "mac", "arm64");
    }
  } catch (error) {
    console.error('Update check failed:', error);
    updateMessage.value = 'Failed to check for updates';
  }
};

// Trigger actions on component mount
onMounted(() => {
  if (isElectron) {
     // Listen for 'update-progress' events
  ipcRenderer.on('update-progress', (event, data) => {
    updateMessage.value = data.stage;
    updateProgress.value = data.progress;
  });

  // Listen for 'update-complete' events
  ipcRenderer.on('update-complete', (event, data) => {
    updateMessage.value = data.stage;
  });

  // Listen for 'update-error' events
  ipcRenderer.on('update-error', (event, data) => {
    updateMessage.value = `Error: ${data.message}`;
  });
    checkForUpdates(updateMessage);
  } else {
    message.value = 'Not running in Electron environment';
  }
});

</script>



