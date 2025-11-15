<template>
  <ForgotPassword v-bind="props" />
</template>

<script setup lang="ts">
import ForgotPassword from '../pages/Auth/ForgotPassword/ForgotPassword.vue';

const props = defineProps<{ [key: string]: unknown }>();
</script>
