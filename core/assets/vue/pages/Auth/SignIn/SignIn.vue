<template>
  <AlreadyLog :redirect-target="props.redirectTarget">
    <form class="my-10 space-y-6" novalidate @submit.prevent="onSubmit">
      <div class="space-y-4">
        <div
          v-if="flash"
          class="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
          role="status"
        >
          <div class="flex items-start justify-between gap-4">
            <span>{{ flash }}</span>
            <button
              type="button"
              class="text-emerald-700 transition hover:text-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              aria-label="Close"
              @click="dismissFlash"
            >
              &times;
            </button>
          </div>
        </div>

        <div class="text-center">
          <h2 class="text-foreground mb-1 text-3xl font-semibold">
            {{ t('auth.login.view.heading') }}
            <span class="text-primary">{{ t('auth.login.view.heading_suffix') }}</span>
          </h2>
          <p class="text-muted-foreground text-sm">
            {{ t('auth.login.view.subtitle') }}
          </p>
        </div>
      </div>

      <FormStatusMessage kind="error" :message-key="status.errorKey" :message="status.errorMessage" />
      <FormStatusMessage
        kind="success"
        :message-key="status.successKey"
        :description-key="status.infoKey || undefined"
      />

      <div class="space-y-3 text-left">
        <div class="form__group">
          <div class="form__field">
            <input
              id="login-email"
              v-model="form.email"
              :class="inputClass(submitted && v$.email.$invalid)"
              type="email"
              inputmode="email"
              autocomplete="email"
              placeholder=" "
              :aria-invalid="submitted && v$.email.$invalid"
              required
            />
            <label :class="labelClass(submitted && v$.email.$invalid)" for="login-email">
              {{ t('auth.login.form.email.label') }}
            </label>
          </div>
          <p v-if="submitted && v$.email.$error" :class="validationErrorClass">
            <span v-if="v$.email.required">{{ t('auth.login.error.credentials_required') }}</span>
            <span v-else>{{ t('auth.login.error.api.INVALID_PAYLOAD') }}</span>
          </p>
        </div>

        <div class="form__group">
          <div class="form__field">
            <input
              id="login-password"
              v-model="form.password"
              :type="passwordInputType"
              :class="[inputClass(submitted && v$.password.$invalid), 'pr-12']"
              autocomplete="current-password"
              placeholder=" "
              :aria-invalid="submitted && v$.password.$invalid"
              required
            />
            <label :class="labelClass(submitted && v$.password.$invalid)" for="login-password">
              {{ t('auth.login.form.password.label') }}
            </label>
            <button
              type="button"
              class="form__toggle"
              :aria-label="t('auth.form.toggle_password')"
              :aria-pressed="passwordVisible"
              @click="togglePasswordVisibility"
            >
              <EyeSlashIcon v-if="!passwordVisible" class="h-5 w-5" aria-hidden="true" />
              <EyeIcon v-else class="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <p v-if="submitted && v$.password.$error" :class="validationErrorClass">
            {{ t('auth.login.error.credentials_required') }}
          </p>
        </div>
      </div>

      <div class="mb-2 flex items-center justify-end">
        <AppButton variant="ghost" size="sm" type="button" @click="goToForgot">
          {{ t('auth.login.view.forgot') }}
        </AppButton>
      </div>

      <div>
        <AppButton full variant="primary" size="md" :disabled="loading">
          {{ t('auth.login.form.submit') }}
        </AppButton>
      </div>

      <div v-if="canRegister" class="text-muted-foreground flex items-center text-sm">
        <span>{{ t('auth.login.view.not_member') }}</span>
        <AppButton variant="ghost" size="sm" type="button" class="ml-2" @click="goToSignUp">
          {{ t('auth.login.view.sign_up') }}
        </AppButton>
      </div>
    </form>
  </AlreadyLog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline';
import AppButton from '../../../components/AppButton.vue';
import AlreadyLog from '../../../components/auth/AlreadyLog.vue';
import FormStatusMessage from '../../../components/form/FormStatusMessage.vue';
import { useFormFieldClasses } from '../../../composables/useFormFieldClasses';
import { usePasswordVisibility } from '../../../composables/usePasswordVisibility';
import type { AuthEndpoints, AuthPages, FeatureFlagsConfig } from '../../../features/auth/types';
import { useSignInForm } from '../../../features/auth/composables/useSignInForm';

const props = defineProps<{
  endpoints: AuthEndpoints;
  pages: AuthPages;
  redirectTarget: string;
  flashMessageKey?: string | null;
  prefillEmail?: string;
  resetToken?: string;
  featureFlags?: FeatureFlagsConfig;
}>();

const {
  form,
  canRegister,
  submitted,
  loading,
  v$,
  status,
  flashKey,
  dismissFlash,
  onSubmit,
  goToForgot,
  goToSignUp,
} = useSignInForm(props);

const { inputClass, labelClass, validationErrorClass } = useFormFieldClasses();
const {
  visible: passwordVisible,
  inputType: passwordInputType,
  toggle: togglePasswordVisibility,
} = usePasswordVisibility();

const { t } = useI18n();

const flash = computed(() => {
  if (!flashKey.value) {
    return null;
  }
  return t(flashKey.value);
});
</script>
