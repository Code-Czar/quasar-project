<template>
  <p>{{ updateMessage }}</p>
</template>

<script setup lang="ts">
import { ref, defineProps, onMounted, onUnmounted, watch } from 'vue';
import { Platform } from 'quasar';

const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
// Props
const props = defineProps({
  productId: {
    type: String,
    required: true,
  },
  product: {
    required: true,
  },
});

const isElectron = Platform.is.electron;
const message = ref('Initializing...');
const updateStage = ref<string | null>(null);
const updateProgress = ref<number | null>(null);
const updateMessage = ref<string | null>(null);
const isUpdating = ref<bool>(true);

// Function to check for updates
const checkForUpdates = async () => {
  console.log('PRODUCT ID', props.productId);
  console.log('PRODUCT value', props.product);
  isUpdating.value = true;
  try {
    const { update_available, userResponse } = await window.electronAPI.checkForUpdates(
      props.product.product_name
    );
    // const result = await window.electronAPI.checkForUpdates(
    //   props.product.product_name,
    //   'mac',
    //   'arm64'
    // );
    console.log("🚀 ~ checkForUpdates ~ result:", update_available, userResponse)

    if (update_available && userResponse === 0) {
      await window.electronAPI.installSoftwareUpdate(
        props.product.product_name
      );
    }else {
      launchDependencies()
    }
  } catch (error) {
    console.error('Update check failed:', error);
    updateMessage.value = `Failed to check for updates  ${error}`;
  }finally{
    isUpdating.value = false;
  }
  
};
const launchDependencies = async () => {

  console.log('Launching : ', props.product.product_name);
  while(isUpdating.value){
    await delay(1000);
    
  }
  try {
     await window.electronAPI.launchSoftware(
      props.product.product_name,
    );
    console.log("🚀 ~ launchSoftware ~ delay:")
    await delay(1000);
  
  } catch (error) {
    console.error('Launch failed:', error);
    updateMessage.value = 'Launch failed';
  }
 
};

watch(isUpdating.value, async (newValue)=>{
  if(newValue.value === false){
    await launchDependencies();
  }
}, {deep:true})

// Trigger actions on component mount
onMounted(async () => {
  if (isElectron) {
    console.log("ElectronAPI methods: ", window.electronAPI);

    // Listen for update events
    window.electronAPI.onUpdateProgress((event, data) => {
      updateMessage.value = data.stage;
      updateProgress.value = data.progress;
      if(data.progress === 100){
        isUpdating.value = false;
      }
    });
    // Listen for update events
    window.electronAPI.onDependenciesLaunchStatus((event, data) => {
      window.location.href = 'http://localhost:3001/'
    });

    window.electronAPI.onUpdateComplete((event, data) => {
      updateMessage.value = data.message;
      isUpdating.value = false;
      launchDependencies();
    });

    window.electronAPI.onUpdateError((event, data) => {
      updateMessage.value = `Error: ${data.message}`;
    });

    await checkForUpdates();
  } else {
    message.value = 'Not running in Electron environment';
  }
});

onUnmounted(() => {
  // Clean up listeners
  window.electronAPI.onUpdateProgress((()=>{}));
  window.electronAPI.onUpdateComplete(()=>{});
  window.electronAPI.onUpdateError(()=>{});
});
</script>


