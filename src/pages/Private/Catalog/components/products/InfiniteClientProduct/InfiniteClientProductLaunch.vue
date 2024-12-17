<template>
  <div class="flex-column flex-grow-1 justify-center align-center">
    <p>{{ updateMessage }}</p>
    <q-spinner size="50px" color="secondary"  v-if="isUpdating"/>

  </div>
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

const openApp = () => {
  const url = 'http://localhost:3001/';
  const retryInterval = 1000; // Retry every 1 second

  const tryConnect = async () => {
    try {
      const response = await fetch(url, { method: 'HEAD' }); // Fast check for server availability
      if (response.ok) {
        console.log('✅ Connection successful! Redirecting to:', url);
        window.location.href = url; // Redirect if server is up
      } else {
        console.warn('⚠️ Server responded but not ready. Retrying...');
        setTimeout(tryConnect, retryInterval);
      }
    } catch (error) {
      console.warn('❌ Unable to connect to the server. Retrying...', error.message);
      setTimeout(tryConnect, retryInterval);
    }
  };

  console.log(`🔄 Attempting to connect to ${url}...`);
  tryConnect();
};


// Function to check for updates
const checkForUpdates = async () => {
  console.log('PRODUCT ID', props.productId);
  console.log('PRODUCT value', props.product);
  isUpdating.value = true;
  try {
    console.log("🚀 ~ checkForUpdates ~ window.electronAPI:", window.electronAPI)
    const { update_available, userResponse } = await window.electronAPI.checkForUpdates(
      props.product.product_name
    );
    
    console.log("🚀 ~ checkForUpdates ~ result:", update_available, userResponse)

    if (update_available && userResponse === 0) {
      await window.electronAPI.installSoftwareUpdate(
        props.product.product_name
      );
    }else {
      isUpdating.value = false;
      await launchDependencies()
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
    console.log("🚀 ~ launchDependencies ~ isUpdating.value:", isUpdating.value)
    await delay(200);
    
  }
  try {
    //  await delay(1000);
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
    openApp()
  }
}, {deep:true})

// Trigger actions on component mount
onMounted(async () => {
  if (isElectron) {
    console.log("ElectronAPI methods: ", window.electronAPI);

    // Listen for update events
    window.electronAPI.onUpdateProgress((event, data) => {
      isUpdating.value = true;
      updateMessage.value = data.stage;
      updateProgress.value = data.progress;
      if(data.progress === 100){
        isUpdating.value = false;
      }
    });
    // Listen for update events
    window.electronAPI.onDependenciesLaunchStatus((event, data) => {
      openApp()
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
  window.electronAPI.killSoftware(props.product.product_name);
});
</script>


