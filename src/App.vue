<template>
  <router-view />
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { onMounted } from 'vue';

defineOptions({
  name: 'App'
});

onMounted(() => {
  const router = useRouter();

  window.addEventListener('navigate-to-url', (event) => {
    const url = event.detail;
    // log('🚀 Vue component received navigate-to-url:', url);
    if (url.startsWith('infinityinstaller://') && url.includes('/auth')) {
      const queryParams = url.split('#')[1].split('&');
      const routePath = '/auth';
      const access_token = queryParams.find((e) => e.includes('access_token')).split('=')[1]
      const token_type = queryParams.find((e) => e.includes('token_type')).split('=')[1]
      const expires_at = queryParams.find((e) => e.includes('expires_at')).split('=')[1]
      router.push({ 
        path: routePath, 
        query: { access_token, token_type, expires_at }, 
        params: { access_token, token_type, expires_at } });
    }
  });
});
</script>
