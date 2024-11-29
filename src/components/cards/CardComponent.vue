<template>
    <q-card class="feature-card q-mb-md">
      <q-card-section>
        <q-icon :name="iconName" size="3rem" />
        <div class="text-h6">{{ title }}</div>
      </q-card-section>
      <q-card-section>
        {{ text }}
      </q-card-section>
    </q-card>
  </template>
  
  <script lang="ts" setup>
  import {defineProps}from 'vue'
  const props = defineProps(['title', 'text']);
  
  // Assuming you have a mapping from card titles to icon names
  const iconNameMap = {
    'Market analysis': 'fa-solid fa-chart-line',
    'Strategy analysis': 'mdi-bullseye-arrow',
    'AI and Machine Learning': 'mdi-brain',
    // Add more mappings as needed
  };
  
  const iconName = iconNameMap[props.title] || ''; // Default to an empty string if no matching icon
  </script>
  