<template>
  <div class="flex flex-center" style="min-height: 100vh">
    <div class="column items-center">
      <q-spinner-dots size="40" v-if="loading" />
      <div v-if="error" class="text-negative q-mt-md">{{ error }}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { createClient } from '@supabase/supabase-js';
import { useUserStore } from 'src/stores/userStore';

const SUPABASE_URL = 'https://yhotbknfiebbflhovpws.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlob3Ria25maWViYmZsaG92cHdzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5NDg3MTkxMSwiZXhwIjoyMDEwNDQ3OTExfQ.5dn2ZC9cedTT7vZyvhK7Qxzo71FEtVe1JkAho6FV_7A';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const router = useRouter();
const store = useUserStore();
const loading = ref(true);
const error = ref<string | null>(null);

const tryGetToken = () => {
  console.log('Trying to get token from URL:', window.location.href);

  // For hash-based routing (#/auth?access_token=... or #access_token=...)
  if (window.location.hash) {
    console.log('Found hash:', window.location.hash);

    // Remove the leading # and any /auth prefix
    let hashContent = window.location.hash
      .substring(1)
      .replace(/^\/auth\/callback\??/, '')
      .replace('#', '');
    hashContent = hashContent.replace(/^\/auth\??/, '');
    console.log('Hash content:', hashContent);

    const hashParams = new URLSearchParams(hashContent);
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    console.log('Tokens from hash:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
    });
    if (accessToken) {
      return { accessToken, refreshToken };
    }
  }

  // Fallback to regular search params
  // const searchParams = new URLSearchParams(window.location.search);
  // const accessToken = searchParams.get('access_token');
  // const refreshToken = searchParams.get('refresh_token');
  // console.log('Tokens from search params:', { hasAccessToken: !!accessToken, hasRefreshToken: !!refreshToken });

  // return { accessToken, refreshToken };
};

onMounted(async () => {
  try {
    console.log('CallbackComponent mounted');
    console.log('Current URL:', window.location.href);
    console.log('Search params:', window.location.search);
    console.log('Hash:', window.location.hash);

    // Check if we're on the callback route (for hash-based routing)
    const isCallback =
      window.location.pathname.includes('/auth/callback') ||
      window.location.hash.includes('/auth/callback');

    if (isCallback && !process.env.DEV) {
      console.log('On callback route, waiting for redirect...');
      return; // Let the callback server handle the redirect
    }

    const { accessToken, refreshToken } = tryGetToken();
    console.log('Access token found:', !!accessToken);

    if (!accessToken) {
      error.value = 'No access token found in URL';
      throw new Error(error.value);
    }

    // Set the session in Supabase
    console.log('Setting Supabase session...');
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || '',
    });

    if (sessionError) {
      error.value = 'Session error: ' + sessionError.message;
      console.error('Session error:', sessionError);
      throw sessionError;
    }

    if (!session?.user) {
      error.value = 'No user in session';
      throw new Error(error.value);
    }

    console.log('Session established, user:', session.user.email);

    // Update store and redirect
    await store.setUserCredentials(
      {
        id: session.user.id,
        email: session.user.email,
        user_metadata: session.user.user_metadata,
      },
      accessToken,
    );
    console.log('Store updated, pushing to backend...');

    supabase.auth.getUser(accessToken).then(async ({ data: { user } }) => {
      if (user) {
        // await store.setUserCredentials(user, accessToken);
        await store.pushUserToBackend(user);

        console.log(
          '🚀 ~ file: CallbackComponent.vue:58 ~ store:',
          user,
          store.user,
        );

        router.push({ name: 'catalog' });
      }
    });

    loading.value = false;
  } catch (err: any) {
    console.error('Auth callback error:', err);
    error.value = err.message || 'Authentication failed';
    // Wait a bit before redirecting on error
    setTimeout(() => {
      // router.push({ name: 'catalog' }); // Redirect to catalog even on error
    }, 3000);
  }
});
</script>

<style scoped>
.flex {
  display: flex;
}

.flex-center {
  justify-content: center;
  align-items: center;
}

.column {
  flex-direction: column;
}

.items-center {
  align-items: center;
}

.text-negative {
  color: #c10015;
}

.q-mt-md {
  margin-top: 16px;
}
</style>
