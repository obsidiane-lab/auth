<template>
  <form class="my-10 space-y-6" novalidate @submit.prevent="onSubmit">
    <header class="space-y-2 text-center">
      <h2 class="text-3xl font-semibold text-foreground">
        {{ t('password.reset.hero.title') }}
      </h2>
      <p class="text-sm text-muted-foreground">
        {{ t('password.reset.hero.subtitle') }}
      </p>
    </header>

    <div
      v-if="!hasToken"
      class="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
      role="alert"
    >
      {{ t('password.reset.error.token_missing') }}
    </div>

    <FormStatusMessage kind="error" :message-key="status.errorKey" :message="status.errorMessage" />
    <FormStatusMessage kind="success" :message-key="status.successKey" />

    <div class="space-y-3" :aria-disabled="!hasToken">
      <div class="space-y-2">
        <div class="relative">
          <input
            id="reset-password"
            v-model="form.password"
            :class="[inputClass(submitted && v$.password.$invalid), disabledInputClass]"
            :disabled="!hasToken || loading"
            :type="passwordInputType"
            autocomplete="new-password"
            placeholder=" "
            :aria-invalid="submitted && v$.password.$invalid"
            required
          />
          <label :class="labelClass(submitted && v$.password.$invalid)" for="reset-password">
            {{ t('password.reset.form.password.label') }}
          </label>
          <button
            type="button"
            class="form__toggle"
            :aria-label="t('auth.form.toggle_password')"
            :disabled="!hasToken"
            :aria-pressed="passwordVisible"
            @click="togglePasswordVisibility"
          >
            <EyeSlashIcon v-if="!passwordVisible" class="h-5 w-5" aria-hidden="true" />
            <EyeIcon v-else class="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <p v-if="submitted && v$.password.$error" :class="validationErrorClass">
          <span v-if="v$.password.minLength?.$invalid">
            {{ t(PASSWORD_POLICY_KEY) }}
          </span>
          <span v-else>{{ t('auth.login.error.credentials_required') }}</span>
        </p>
        <div class="mt-3 grid grid-cols-4 gap-2">
          <span
            v-for="index in 4"
            :key="index"
            :class="[
              'h-1 rounded-xs transition',
              passwordStrength >= index ? 'bg-primary' : 'bg-border/80',
            ]"
          />
        </div>
        <p class="mt-2 text-xs text-muted-foreground">
          {{ t('auth.register.view.password_hint') }}
        </p>
      </div>

      <div class="space-y-2">
        <div class="relative">
          <input
            id="reset-confirm-password"
            v-model="form.confirmPassword"
            :class="[inputClass(submitted && v$.confirmPassword.$invalid), disabledInputClass]"
            :disabled="!hasToken || loading"
            :type="confirmInputType"
            autocomplete="new-password"
            placeholder=" "
            :aria-invalid="submitted && v$.confirmPassword.$invalid"
            required
          />
          <label :class="labelClass(submitted && v$.confirmPassword.$invalid)" for="reset-confirm-password">
            {{ t('password.reset.form.confirm.label') }}
          </label>
          <button
            type="button"
            class="form__toggle"
            :aria-label="t('auth.form.toggle_password')"
            :disabled="!hasToken"
            :aria-pressed="confirmVisible"
            @click="toggleConfirmVisibility"
          >
            <EyeSlashIcon v-if="!confirmVisible" class="h-5 w-5" aria-hidden="true" />
            <EyeIcon v-else class="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <p v-if="submitted && v$.confirmPassword.$error" :class="validationErrorClass">
          {{ t(PASSWORD_MISMATCH_KEY) }}
        </p>
      </div>
    </div>

    <div class="flex flex-col gap-3 sm:flex-row">
      <AppButton full variant="primary" size="md" :disabled="loading || !hasToken">
        {{ t('password.reset.form.submit') }}
      </AppButton>
      <AppButton full variant="secondary" size="md" type="button" @click="goToLogin">
        {{ t('password.reset.form.back_to_login') }}
      </AppButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline';
import AppButton from '../../../components/AppButton.vue';
import FormStatusMessage from '../../../components/form/FormStatusMessage.vue';
import { useFormFieldClasses } from '../../../composables/useFormFieldClasses';
import { usePasswordVisibility } from '../../../composables/usePasswordVisibility';
import type { AuthEndpoints, AuthPages, CsrfTokens } from '../../../features/auth/types';
import {
  PASSWORD_MISMATCH_KEY,
  PASSWORD_POLICY_KEY,
} from '../../../features/auth/constants';
import { useNewPasswordForm } from '../../../features/auth/composables/useNewPasswordForm';

const props = defineProps<{
  endpoints: AuthEndpoints;
  pages: AuthPages;
  resetToken: string;
  csrf?: CsrfTokens;
}>();

const {
  form,
  submitted,
  loading,
  v$,
  status,
  passwordStrength,
  hasToken,
  resetDisabled,
  onSubmit,
  goToLogin,
} = useNewPasswordForm(props);

const {
  inputClass,
  labelClass,
  validationErrorClass,
  disabledInputClass,
} = useFormFieldClasses({
  disabled: resetDisabled,
});

const {
  visible: passwordVisible,
  inputType: passwordInputType,
  toggle: togglePasswordVisibility,
} = usePasswordVisibility();

const {
  visible: confirmVisible,
  inputType: confirmInputType,
  toggle: toggleConfirmVisibility,
} = usePasswordVisibility();

const { t } = useI18n();
</script>
