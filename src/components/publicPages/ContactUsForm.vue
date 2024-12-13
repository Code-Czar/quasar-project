<template>
  <!-- <q-page class="flex-column q-pa-xl"> -->
    <div class="flex-column flex-grow-1">

    <div class="form-container flex-column-centered q-pa-xl">

      <q-form @submit="submitForm" style="margin-left:auto; margin-right:auto; gap:2rem">
        <div class="first-line-container">

          <q-input v-model="formData.name" label="Name" outlined dense required />
          <q-input v-model="formData.email" label="Email" type="email" outlined dense required />
        </div>
        <div class="second-line-container  q-py-xl">
          <textarea v-model="formData.message" class="form-message-area " placeholder="Message" outlined dense required
            style="background-color: transparent; width: calc(100%)" />
        </div>
        <div class="flex-column-centered">

          <q-btn type="submit" color="secondary" label="Submit" class="q-mt-md" :loading="loading" />
        </div>
      </q-form>
    </div>
  </div>

  <!-- </q-page> -->
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const formData = ref({
  name: '',
  email: '',
  message: '',
});

const loading = ref(false);

const submitForm = async () => {
  try {
    // Your form submission logic here
    loading.value = true;
    // Simulate a delay for demonstration purposes
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Form submitted:', formData.value);
    loading.value = false;
    // Reset form data after submission
    formData.value = {
      name: '',
      email: '',
      message: '',
    };
  } catch (error) {
    console.error('Error submitting form:', error);
    loading.value = false;
  }
};
</script>
<style lang="scss" scope>
.form-container {
  margin: auto;
  background-color: var(--primary);
  border-radius: 1rem;
  height: calc(100%)
  // * {
  //   background-color: white;
  // }
}

.first-line-container {
  display: flex;
  gap: 0.3rem;
  margin-bottom: 0.3rem;
  ;
}

.form-message-area {
  border: 1px solid $pristine-white;
  border-radius: 3px;
  min-height: 20vh;
  color: $pristine-white;
}

.q-input, textarea{
  border: 1px solid var(--secondary) !important;
  border-radius: 0.3rem;
}
</style>