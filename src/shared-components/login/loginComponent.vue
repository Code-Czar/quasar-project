<template>
    <div class="col-md-4 col-xs-12 login-card">
        <q-card class="q-ma-md"
            style="display:flex; flex-direction:column; flex-grow: 1;background-color: transparent; border:unset; box-shadow: unset;">
            <q-card-section class="row items-center justify-center" style="display: flex; flex-grow: 1">
                <div style="margin: 0">
                    <h1 class="text-h4 q-mb-md" style="text-align: center">
                        {{ $t('login') }}
                    </h1>

                    <q-btn id="login-google-button" :label="$t('loginPage.loginWithGoogle')" @click="login('google')"
                        icon="mdi-google" color="primary" class="full-width q-mb-sm" />
                    <q-btn :label="$t('loginPage.loginWithGithub')" @click="login('github')" color="secondary"
                        class="full-width q-mb-sm" icon="mdi-github" />
                    <!-- Add more buttons for other providers as needed -->
                </div>
            </q-card-section>

        </q-card>
        <div class="flex-column-center" style="flex-direction: row">
            <!-- <div style="width:30%; text-align: right;">
                            Infinite</div> -->
            <div>
                <HeaderLogo />
            </div>
            <div style="width:30%">{{ $t('loginPage.title') }}</div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { Platform } from 'quasar';

import { createClient } from '@supabase/supabase-js';
import { useUserStore } from 'src/stores/userStore';
import { HeaderLogo } from 'src/components';
// import { SUPABASE_URL } from 'trading-shared';
const SUPABASE_URL = "https://yhotbknfiebbflhovpws.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlob3Ria25maWViYmZsaG92cHdzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5NDg3MTkxMSwiZXhwIjoyMDEwNDQ3OTExfQ.5dn2ZC9cedTT7vZyvhK7Qxzo71FEtVe1JkAho6FV_7A"


const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY
// , {
//   auth: {
//     // redirectTo: 'installer://auth', // Your custom protocol
//     // detectSessionInUrl: true, // Ensure Supabase detects the session
//     // flowType: 'pkce', // Use PKCE for improved security
//     // persistSession: true, // Persist session in storage
//     // storageKey: 'supabase-auth-token',
//   },
// }
);
console.log("🚀 ~ window:", window)

const mobileURLScheme = 'opportunities://auth';
const definePostLoginRedirection = (enableAppRedirect = false) => {
    console.log("🚀 ~ definePostLoginRedirection ~  window.location.origin:",  window.location.origin)
    console.log("🚀 ~ definePostLoginRedirection ~  window.location.href:",  window.location.href)

    let redirectUri = null;

    if (Platform.is.android && enableAppRedirect) {
        redirectUri = mobileURLScheme;
    } else if (
        window.location.origin.includes('localhost') ||
        window.location.origin.includes('127.0.0.1')
    ) {
        redirectUri = 'http://localhost:9300/#/auth';
        console.log(
            '🚀 ~ file: LoginPage.vue:62 ~ redirectUri:',
            window.location.origin,
            redirectUri
        );
    } 
    else if (
        window.location.href.startsWith('file')
    ){
      
        // redirectUri = `${window.location.href}/auth`
        // redirectUri = encodeURIComponent('installer://auth');
        redirectUri ='infinityinstaller://auth';
    }   
    // else if(window.location.href.startsWith('file')){

    // }
    else {
        redirectUri = window.location.origin + 'auth';
    }
    return redirectUri
};

const login = async (provider: 'google' | 'github') => {
    const redirectUri = definePostLoginRedirection();
    console.log("🚀 ~ LOGIN ~ redirectUri:", redirectUri, window.location);

    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: { redirectTo: redirectUri },
            // options: { redirectTo: 'http://localhost:9300/auth' },
            // options: { redirectTo: `${window.location.href}auth` },
        });

        if (error) {
            console.error('Login error:', error.message);
            return;
        }

        if (data) {
            console.log('Login successful:', data);
            // Set user credentials if needed
            // @ts-expect-error ignore
            console.log("🚀 ~ login ~ data:", data)
            await useUserStore().setUserCredentials(data.user, data.session);
        }
    } catch (err) {
        console.error('Unexpected error during login:', err);
    }
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
