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
    console.log('🚀 Vue component received navigate-to-url:', url);
    if (url.startsWith('infinityinstaller://')&& url.includes('subscription_success')) {
    const queryParams = new URL(url).searchParams;
    const routePath = '/subscription_success'; // Adjust as needed
    const sessionId = url.split('session_id').length>1 ?  url.split('session_id')[1] : null;

    if (routePath && sessionId) {
      // Use Vue Router to navigate
      router.push({
        path: routePath,
        query: { session_id: sessionId },
      });
    } else {
      console.error('Invalid URL or parameters:', url);
    }
  }
  });

  window.addEventListener('navigate-to-auth', (event) => {
    const url = event.detail.url;
    console.log('🚀 Vue component received navigate-to-auth:', url);
    if ( url.includes('/auth')) {
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
