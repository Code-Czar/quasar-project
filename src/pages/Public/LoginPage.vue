<template>
  <q-page class="video-background">
    <!-- Video Background -->
    <video
      playsinline
      autoplay
      muted
      loop
      class="absolute-position full-width full-height"
    >
      <source src="src/assets/robot_header.webm" type="video/webm" />
    </video>

    <!-- Two-Column Layout -->
    <div class="row items-center full-height">
      <!-- Left Column (2/3 width) -->
      <div class="col-8 hidden-xs">
        <!-- You can add content here if needed -->
      </div>

      <!-- Right Column (1/3 width) with Login Component -->

      <div class="col-md-4 col-xs-12 login-card">
        <q-card
          class="q-ma-md"
          style="
            display: flex;
            flex-direction: column;
            flex-grow: 1;
            background-color: transparent;
            border: unset;
            box-shadow: unset;
          "
        >
          <q-card-section class="row" style="display: flex; flex-grow: 1">
            <div style="margin: 0">
              <h1 class="text-h4 q-mb-md" style="text-align: center">
                {{ $t('login') }}
              </h1>
            </div>
          </q-card-section>
        </q-card>
        <div class="flex-column-center" style="flex-direction: row">
          <div>
            <HeaderLogo />
          </div>
          <div style="width: 30%">{{ $t('loginPage.title') }}</div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script lang="ts" setup>
import { Platform } from 'quasar';

import { createClient } from '@supabase/supabase-js';
import { useUserStore } from 'src/stores/userStore';
import { HeaderLogo } from 'src/components';
// import { SUPABASE_URL } from 'trading-shared';
const SUPABASE_URL = 'https://yhotbknfiebbflhovpws.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlob3Ria25maWViYmZsaG92cHdzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5NDg3MTkxMSwiZXhwIjoyMDEwNDQ3OTExfQ.5dn2ZC9cedTT7vZyvhK7Qxzo71FEtVe1JkAho6FV_7A';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const mobileURLScheme = 'opportunities://auth';

const userStore = useUserStore();
const definePostLoginRedirection = (enableAppRedirect = false) => {
  let redirectUri = null;

  if (Platform.is.android && enableAppRedirect) {
    redirectUri = mobileURLScheme;
  } else if (
    window.location.origin.includes('localhost') ||
    window.location.origin.includes('127.0.0.1')
  ) {
    redirectUri = '/auth';
    console.log(
      '🚀 ~ file: LoginPage.vue:62 ~ redirectUri:',
      window.location.origin,
      redirectUri,
    );
  } else {
    redirectUri = window.location.origin + 'auth';
  }
  return redirectUri;
};

const login = async (provider: 'google' | 'github') => {
  // Determine the redirect URI based on the platform
  // let redirectUri = definePostLoginRedirection();
  // //@ts-expect-error typing
  // const { user, session, error } = await supabase.auth.signInWithOAuth(
  //     {
  //         provider,
  //         options:{
  //             redirectTo: redirectUri ,
  //         }
  //     }
  // );
  // if (user) {
  //     // Redirect to index page after successful login
  //     await userStore.setUserCredentials(user, session);
  //     // Optionally, navigate to a different route
  //     // router.push("/index");
  // } else {
  //     console.error('Login error:', error?.message);
  // }
};
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
  /* Ensure the video plays behind your content */
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
  /* or adjust as needed */
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
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: $page;
  margin: 0;
  opacity: 0.9;
}
</style>
