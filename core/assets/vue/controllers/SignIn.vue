<template>
  <SignIn v-bind="props" />
</template>

<script setup lang="ts">
import SignIn from '../pages/Auth/SignIn/SignIn.vue';

const props = defineProps<{ [key: string]: unknown }>();
</script>
