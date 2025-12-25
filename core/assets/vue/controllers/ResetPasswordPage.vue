<template>
  <NewPassword v-bind="props" />
</template>

<script setup lang="ts">
import NewPassword from '../pages/Auth/NewPassword/NewPassword.vue';

const props = defineProps<{ [key: string]: unknown }>();
</script>
