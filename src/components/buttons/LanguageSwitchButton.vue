<template>
  <!-- ...... -->
  <q-select
    v-model="locale"
    :options="localeOptions"
    dense
    borderless
    emit-value
    map-options
    options-dense
  />
  <!-- ...... -->
</template>

<script>
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'


export default {
  setup () {
    const { locale } = useI18n({ useScope: 'global' })
    const $q = useQuasar()
  const lan = $q.lang.getLocale() // returns a string
  console.log("🚀 ~ setup ~ lan:", lan)

    return {
      locale,
      localeOptions: [
        { value: 'en-US', label: '🇺🇸' },
        { value: 'fr-FR', label: '🇫🇷' }
      ]
    }
  }
}
</script>