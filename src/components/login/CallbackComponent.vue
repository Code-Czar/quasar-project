<template>
    <!-- <div>Processing...</div> -->
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { createClient } from "@supabase/supabase-js";
import { useUserStore } from 'src/stores/userStore';


const SUPABASE_URL= "https://yhotbknfiebbflhovpws.supabase.co"
const SUPABASE_ANON_KEY= "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlob3Ria25maWViYmZsaG92cHdzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5NDg3MTkxMSwiZXhwIjoyMDEwNDQ3OTExfQ.5dn2ZC9cedTT7vZyvhK7Qxzo71FEtVe1JkAho6FV_7A"

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const router = useRouter();
const store = useUserStore();

const isElectron = () => {
  return window.electron && window.electron.isElectron;
}

onMounted(() => {

    // if (window?.electronAPI) {
    //     window.electronAPI.authRedirect(window.location.href)
    //     // ipcRenderer.send('auth-redirect', window.location.href);
    // }


    console.log("🚀 ~ file: CallbackComponent.vue:79 ~ onMounted ~ window.location:", window.location);

    const hashMatch = window.location.hash.match(/access_token=([^&]+)/);
    let hashParams;
    if (hashMatch) {
        // Create URLSearchParams from the extracted part of the hash
        hashParams = new URLSearchParams(hashMatch[0]);
    } else {
        console.error("No access token found in the callback URL.");
        return;
    }

    const accessToken = hashParams.get("access_token");
    const tokenType = hashParams.get("token_type");
    const expiresAt = hashParams.get("expires_at");
    console.log("🚀 ~ onMounted ~ expiresAt:", expiresAt)
    console.log("🚀 ~ onMounted ~ tokenType:", tokenType)
    console.log("🚀 ~ onMounted ~ accessToken:", accessToken)

    if (accessToken) {
        // You might want to securely store the accessToken and related data here

        supabase.auth.setSession({
            access_token: accessToken,
            //@ts-expect-error supabase missing args
            token_type: tokenType,
            expires_at: expiresAt
        });

        supabase.auth.getUser(accessToken).then(async ({ data: { user } }) => {
            if (user) {
                await store.setUserCredentials(user, accessToken);
                await store.pushUserToBackend(user);

                console.log("🚀 ~ file: CallbackComponent.vue:58 ~ store:", user, store.user);

                // if (store.user.isSubscribing && !store.user.isSubscribed) {
                //     router.push({name: 'checkout'})
                // }
                // else if (store.user.isRegisteringBeta) {
                //     router.push({name: 'beta'})
                // }
                // else 
                if (store.user.role !== "Dev" && store.user.role !== "Admin") {
                    // router.push({name: 'beta'})
                    router.push({name: 'catalog'});
                }
                else {
                    // router.push({name: 'app'});
                    router.push({name: 'catalog'});
                }
            }
        })

        // router.push('/app');  // Redirect to the desired page
    } else {
        console.error("No access token found in the callback URL.", hashParams);
        // Handle this case as needed, possibly redirecting to an error page
    }
});
</script>