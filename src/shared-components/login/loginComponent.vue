<template>
  <!-- <div class="col-md-4 col-xs-12 login-card"> -->
    <q-card
      class="q-pa-md w-100 login-card"
      style="
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        background-color: transparent;
        border: unset;
        box-shadow: unset;
      "
    >
      <q-card-section
        class="column justify-center w-100"
        style="display: flex; flex-grow: 1"
      >
        <div style="display: flex; justify-content: center; flex-grow: 0">
          <h1 class="text-h4 q-mb-md" style="text-align: center">
            {{ $t('login') }}
          </h1>
        </div>
        <div
          style="
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            flex-grow: 1;
          "
        >
          <q-btn
            id="login-google-button"
            :label="$t('loginPage.loginWithGoogle')"
            @click="login('google')"
            icon="mdi-google"
            class=" default-button"
            style="min-height: 5rem; width:80%"
          />
        </div>
      </q-card-section>
    </q-card>
  <!-- </div> -->
</template>

<script lang="ts" setup>
import { Platform } from 'quasar';
import { defineExpose } from 'vue';
import { createClient } from '@supabase/supabase-js';
import { useUserStore } from 'src/stores/userStore';
import { useRouter } from 'vue-router';

// Add window type definition
declare global {
  interface Window {
    electronAPI?: {
      openAuthWindow: (url: string) => Promise<string>;
    };
  }
}

const SUPABASE_URL = 'https://yhotbknfiebbflhovpws.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlob3Ria25maWViYmZsaG92cHdzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5NDg3MTkxMSwiZXhwIjoyMDEwNDQ3OTExfQ.5dn2ZC9cedTT7vZyvhK7Qxzo71FEtVe1JkAho6FV_7A';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const router = useRouter();
const store = useUserStore();
console.log('🚀 ~ window:', window);

const mobileURLScheme = 'opportunities://auth';
const definePostLoginRedirection = (enableAppRedirect = false) => {
  // In development, use localhost
  if (process.env.DEV) {
    return 'http://localhost:9300/auth/callback';
  }
  
  // In production electron app
  if (window.location.href.startsWith('file')) {
    // Use custom protocol scheme for auth callback
    return 'infinityinstaller://auth';
  }
  
  // Fallback for web
  return window.location.origin + '/auth/callback';
};

const login = async (provider: 'google' | 'github'= "google") => {
  const redirectUri = definePostLoginRedirection();
  console.log('🚀 ~ LOGIN ~ redirectUri:', redirectUri);

  try {
    // First, get the authorization URL
    const { data: { url }, error: urlError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { 
        redirectTo: redirectUri,
        queryParams: {
          app_source: 'electron'
        }
      },
    });

    if (urlError) {
      console.error('Login URL error:', urlError.message);
      return;
    }

    if (url) {
      console.log('Opening auth URL:', url);
      // Navigate directly in the main window
      window.location.href = url;
    }
  } catch (err) {
    console.error('Unexpected error during login:', err);
  }
};

defineExpose({
  login
})

</script>

<style lang="scss" scoped>
.relative-position {
  position: relative;
}

.absolute-position {
  position: absolute;
  top: 0;
  left: 0;
  z-index: -1;
}

.full-width {
  width: 100%;
}

.full-height {
  height: 100%;
}

.video-background {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 100vh;
}

.video-background video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.centered-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-card {
  //display: flex;
  //flex-direction: column;
  //height: 100%;
  background-color: $background;
  //margin: 0;
  //opacity: 0.9;
  //height: 20rem;
}
</style>
