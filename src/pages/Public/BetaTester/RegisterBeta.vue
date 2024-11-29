<!-- RegisterBetaPage.vue -->

<template>
    <q-page class="beta-page">
        <h1 class="text-h2 text-centered" > {{ $t('registerBeta.formLabels.title') }}</h1>
      <form @submit.prevent="submitForm" class="beta-form">
        <div class="question">
          <label>{{ $t('registerBeta.formLabels.haveTraded') }}</label>
          <q-checkbox type="checkbox" v-model="formData.hasTraded" />
        </div>
        <div v-if="formData.hasTraded">
          <div class="question question-vertical">
            <label>{{ $t('registerBeta.formLabels.investedAmount') }}</label>
            <q-input dense v-model="formData.investedAmount" />
          </div>
  
          <div class="question question-vertical">
            <label>{{ $t('registerBeta.formLabels.gainedAmount') }}</label>
            <q-input dense v-model="formData.gainedAmount" />
          </div>
  
          <div class="question question-vertical">
            <label>{{ $t('registerBeta.formLabels.lostAmount') }}</label>
            <q-input dense v-model="formData.lostAmount" />
          </div>
        </div>
  
        <div class="question question-vertical">
          <label>{{ $t('registerBeta.formLabels.knowledgeLevel') }}</label>
          <q-input dense v-model="formData.knowledgeLevel" />
        </div>
  
       
  
        <div class="question question-vertical">
          <label>{{ $t('registerBeta.formLabels.interestedIn') }}</label>
          <div >
            <q-checkbox v-model="formData.interests.shortTerm" /> {{ $t('registerBeta.formLabels.shortTermTrading') }}
            <q-checkbox v-model="formData.interests.midTerm" /> {{ $t('registerBeta.formLabels.midTermTrading') }}
            <q-checkbox v-model="formData.interests.longTerm" /> {{ $t('registerBeta.formLabels.longTermTrading') }}
          </div>
        </div>
  
        <div class="question question-vertical">
          <label>{{ $t('registerBeta.formLabels.featureInterests') }}</label>
          <div >
            <q-checkbox v-model="formData.featureInterests.backtesting" /> {{ $t('registerBeta.formLabels.backtesting') }}
            <q-checkbox v-model="formData.featureInterests.realTimeNotifications" /> {{ $t('registerBeta.formLabels.realTimeNotifications') }}
            <q-checkbox v-model="formData.featureInterests.multipleIndicators" /> {{ $t('registerBeta.formLabels.multipleIndicators') }}
          </div>
        </div>
  
        <div class="question question-vertical">
          <label>{{ $t('registerBeta.formLabels.usedTools') }}</label>
          <q-input dense v-model="formData.usedTools" />
        </div>
  
        <div class="question question-vertical">
          <label>{{ $t('registerBeta.formLabels.additionalFeatures') }}</label>
          <q-input dense v-model="formData.additionalFeatures" />
        </div>
  
        <div class="question question-vertical">
          <label>{{ $t('registerBeta.formLabels.startingAmount') }}</label>
          <q-input dense v-model="formData.startingAmount" />
        </div>
  
        <div class="question question-vertical">
          <label>{{ $t('registerBeta.formLabels.targetEarnings') }}</label>
          <q-input dense v-model="formData.targetEarnings" />
        </div>
  
        <div class="question question-vertical">
          <label>{{ $t('registerBeta.formLabels.riskLevel') }}</label>
          <q-input dense v-model="formData.riskLevel" />
        </div>
  
        <div class="question">
          <label>{{ $t('registerBeta.formLabels.giveFeedback') }}</label>
          <q-checkbox v-model="formData.giveFeedback" />
        </div>
  
        <div class="question">
          <label>{{ $t('registerBeta.formLabels.allowAnonymousData') }}</label>
          <q-checkbox v-model="formData.allowAnonymousData" />
        </div>
  
        <div class="question question-vertical">
          <button type="submit" class="submit-button button-default">{{ $t('registerBeta.formLabels.submit') }}</button>
        </div>
      </form>
    </q-page>
  </template>
  
  <script lang="ts" setup>
  import { ref } from 'vue';
  // import { useRouter } from 'vue-router';
  // import { useUserStore } from 'src/stores/userStore';
  // const router = useRouter();
  // const userStore_ = useUserStore();
  
  const formData = ref({
    hasTraded: false,
    knowledgeLevel: '',
    investedAmount: '',
    gainedAmount: '',
    lostAmount: '',
    interests: {
      shortTerm: false,
      midTerm: false,
      longTerm: false,
    },
    featureInterests: {
      backtesting: false,
      realTimeNotifications: false,
      multipleIndicators: false,
    },
    usedTools: '',
    additionalFeatures: '',
    startingAmount: '',
    targetEarnings: '',
    riskLevel: '',
    giveFeedback: false,
    allowAnonymousData: false,
  });
  
  const submitForm = () => {
    // Perform form submission logic here
    // You can access form data from 'formData' object
  };
  </script>
    
    <style lang="scss" scoped>
    .beta-page {
        padding-top:5rem;
    }
    .beta-form{
        display:flex; 
    flex-direction: column;
    padding:5rem;
     
    }
    .question{
    margin-bottom:2rem;
}

.question-vertical{
    display: flex;
    flex-direction: column;
}
.submit-button{
    background-color: $section-even-background;
    margin:auto; 
    // padding-left: 3rem;
    // padding-right: 3rem;
    // padding-top: 1.5rem;
    // padding-bottom: 1.5rem;
    box-shadow: unset;
    border: unset; 
    text-transform: uppercase;
}
.submit-button:hover{
    background-color: $blue-ia-6;
    transition: all 100ms ease-in;
    // background-color: red !important;
}
  
    </style>
