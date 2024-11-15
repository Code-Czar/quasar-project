<template>
  <p>{{ message }}</p>
</template>

<script setup lang="ts">
import { ref, defineProps, onMounted } from 'vue';
import { Platform } from 'quasar';

// Props
const props = defineProps({
  productId: {
    type: String,
    required: true,
  },
});

const isElectron = Platform.is.electron;
const message = ref('Initializing...');
const updateMessage = async (inputMessage) =>{
  console.log("🚀 ~ updateMessage ~ inputMessage:", inputMessage)
  message.value = inputMessage
}

// Function to install dependencies with productId
const installDependencies = async (updateMessage) => {
  console.log("🚀🚀🚀 ~ installDependencies ~ installDependencies:", installDependencies)
  try {
    // @ts-expect-error electronAPI
    const result = await window.electronAPI.installDocker(props.productId, updateMessage);
    console.log("🚀 ~ installDependencies ~ result:", result)
    if(result.success){
      checkContainers();
    }
    // console.log(result); // Log or display success message
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
    message.value = result;
  } catch (error) {
    console.error(error); // Handle errors
    message.value = 'Failed to check containers';
  }
};

// Function to check for updates
const checkForUpdates = async (updateMessage) => {
  try {
    //   // @ts-expect-error electronAPI
    console.log("WINDOW ELECTRON API",window.electronAPI); // Check if electronAPI is available
    const result = await window.electronAPI.checkForUpdates(props.productId);
    if (result.shouldUpdate) {
      message.value = `Update available: ${result.latestVersion}. Please update to continue.`;
      installDependencies(updateMessage)
    } else {
      message.value = 'You are using the latest version.';
      // Automatically check containers after a short delay if no update is needed
      setTimeout(()=>{checkContainers()}, 1000);
    }
  } catch (error) {
    console.error('Update check failed:', error);
    message.value = 'Failed to check for updates';
  }
};

// Trigger actions on component mount
onMounted(() => {
  if (isElectron) {
    checkForUpdates(updateMessage);
  } else {
    message.value = 'Not running in Electron environment';
  }
});
</script>
