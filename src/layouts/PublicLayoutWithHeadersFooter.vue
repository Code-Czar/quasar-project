<template>
    <q-layout class="flex">
        <PublicHeader />
        <q-page-container class="flex">
            <router-view />
        </q-page-container>
        <PublicFooterWide class="no-grow" />
    </q-layout>
</template>

<script setup>
import { PublicHeader, PublicFooterWide } from '@/components';
</script>

<style lang="scss">
.flex {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
}
.no-grow {
    flex-grow: 0;
}
</style>
