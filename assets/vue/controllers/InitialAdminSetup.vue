<template>
  <InitialAdmin v-bind="props" />
</template>

<script setup lang="ts">
import InitialAdmin from '../pages/Setup/InitialAdmin.vue';

const props = defineProps<{ [key: string]: unknown }>();
</script>

