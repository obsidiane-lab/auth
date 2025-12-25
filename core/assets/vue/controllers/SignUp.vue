<template>
  <SignUp v-bind="props" />
</template>

<script setup lang="ts">
import SignUp from '../pages/Auth/SignUp/SignUp.vue';

const props = defineProps<{ [key: string]: unknown }>();
</script>
