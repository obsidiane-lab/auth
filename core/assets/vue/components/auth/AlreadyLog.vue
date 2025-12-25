<template>
  <div
    v-if="alreadyAuthenticated"
    class="rounded-xl border border-dashed border-primary/40 bg-background/90 p-4 text-sm shadow-sm"
  >
    <div class="flex flex-col gap-4">
      <div class="flex items-start gap-3">
        <div
          class="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-primary/10 text-primary"
        >
          <ArrowRightOnRectangleIcon class="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p class="text-sm font-semibold text-foreground">
            Vous êtes déjà connecté
          </p>
          <p class="mt-1 text-xs text-muted-foreground sm:text-sm">
            Accédez directement au service ou déconnectez-vous pour utiliser un autre compte.
          </p>
        </div>
      </div>

      <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
        <AppButton
          full
          variant="primary"
          size="sm"
          type="button"
          @click="goToService"
        >
          Accéder au service
        </AppButton>
        <AppButton
          full
          variant="ghost"
          size="sm"
          type="button"
          :disabled="logoutLoading"
          @click="logout"
        >
          Se déconnecter
        </AppButton>
      </div>
    </div>
  </div>

  <slot v-else />
</template>

<script setup lang="ts">
import { ArrowRightOnRectangleIcon } from '@heroicons/vue/24/outline';
import AppButton from '../AppButton.vue';
import { useExistingSession } from '../../features/auth/composables/useExistingSession';

const props = defineProps<{
  redirectTarget?: string;
}>();

const { alreadyAuthenticated, logoutLoading, goToService, logout } = useExistingSession({
  redirectTarget: props.redirectTarget,
});
</script>
