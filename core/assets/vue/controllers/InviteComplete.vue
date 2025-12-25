<template>
  <InviteComplete v-bind="props" />
</template>

<script setup lang="ts">
import InviteComplete from '../pages/Auth/Invite/InviteComplete.vue';

const props = defineProps<{ [key: string]: unknown }>();
</script>
