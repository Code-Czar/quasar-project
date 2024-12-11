<template>
<q-layout>
  <q-page-container>
    <q-tabs v-model="activeTab">
      <q-tab name="general" :label="generalTabLabel"></q-tab>
      <q-tab name="subscription" :label="subscriptionTabLabel"></q-tab>
    </q-tabs>

    <q-tab-panels v-model="activeTab">
      <!-- General Tab Panel -->
      <q-tab-panel name="general"
      :class="{'margin-desktop': !$q.screen.xs}">
        <h2 class="text-h6">{{ $t('userPage.general.title') }}</h2><q-list>
          <q-item>
            <q-item-section>
              <q-item-label>
                <q-icon name="email" />
                <span class="q-ml-sm">{{ $t('userPage.general.email') }}:</span>
              </q-item-label>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ userStore_.email }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
              <q-item-label>
                <q-icon name="person" />
                <span class="q-ml-sm">{{ $t('userPage.general.fullname') }}:</span>
              </q-item-label>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ userStore_.fullName }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
              <q-item-label>
                <q-icon name="badge" />
                <span class="q-ml-sm">{{ $t('userPage.general.role') }}:</span>
              </q-item-label>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ userStore_.role }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-tab-panel>

      <!-- Subscription Tab Panel -->
      <q-tab-panel name="subscription"
        :class="{'margin-desktop': !$q.screen.xs}">
        <h2 class="text-h6">{{ $t('userPage.subscription.title') }}</h2><q-list>
          <q-item>
            <q-item-section>
              <q-item-label>
                <span class="q-ml-sm">{{ $t('userPage.subscription.status') }}:</span>
              </q-item-label>
            </q-item-section>
            <q-item-section>
              <q-item-label>
                <q-icon :name="isSubscriptionStatusOk ? 'check' : 'clear'" />
                {{ isSubscriptionStatusOk ? $t('ok') : $t('userPage.subscription.not') }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
            </q-item-section>
            <q-item-section>
              <q-item-label>
                <q-btn @click="cancelSubscription" :label="$t('userPage.subscription.cancelBtn')" :disable="!isSubscriptionStatusOk" color="negative"/>
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-tab-panel>
    </q-tab-panels>


    <q-dialog v-model="prompt" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">{{ $t('userPage.subscription.cancelConfirmation') }}</div>
        </q-card-section>
        <q-card-section>
          <div>{{ $t('userPage.subscription.cancelText') }}</div>
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn flat :label="$t('no')" v-close-popup />
          <q-btn flat :label="$t('yes')" v-close-popup @click="performSubscriptionCancellation()" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page-container>
</q-layout>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useUserStore } from 'src/stores/userStore';
import { storeToRefs } from 'pinia'

const activeTab = ref('general');
const generalTabLabel = ref('general');
const subscriptionTabLabel = ref('subscription');

const prompt = ref(false);
const userStore_ = useUserStore();
const { user } = storeToRefs(userStore_);

const cancelSubscription = () => {
  prompt.value = true
};

const isSubscriptionStatusOk = computed(() => {
  return Boolean(user.value.stripe_customer_details ?? false) && user.value.stripe_customer_details?.payment_status == 'paid';
});

const performSubscriptionCancellation = async () => {
  userStore_.cancelSubscription(userStore_.subscriptionId);
};

</script>
<style type="text/scss">
.q-panel {
  display: flex;
  flex-direction: column;
}
.margin-desktop {
  display: flex;
  flex-direction: column;
  margin-left: auto;
  margin-right: auto;
  flex-grow: 0;
  width:50% !important;
}
</style>