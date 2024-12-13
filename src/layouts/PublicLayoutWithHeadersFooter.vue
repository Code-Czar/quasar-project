<template>
    <q-layout class="flex flex-column">
        <PublicHeader />
        <q-page-container class="flex-column flex-grow-1">
            <router-view />
        </q-page-container>
        <PublicFooterWide class="no-grow" />
    </q-layout>
</template>

<script setup>
import { PublicHeader, PublicFooterWide } from 'src/components';
</script>

<style lang="scss" scoped>
.flex {
    // display: flex;
    // flex-direction: column;
    // flex-grow: 1;
    // min-height: calc(90%);
}
.no-grow {
    flex-grow: 0;
}
</style>
