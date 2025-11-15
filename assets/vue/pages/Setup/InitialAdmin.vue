<template>
  <form class="my-10 space-y-6" novalidate @submit.prevent="onSubmit">
    <div class="text-center">
      <h2 class="text-foreground mb-1 text-3xl font-semibold">
        {{ t('setup.initial_admin.title', { brand: wording }) }}
      </h2>
      <p class="text-muted-foreground text-sm" v-html="t('setup.initial_admin.subtitle', { brand: wording })"></p>
    </div>

    <FormStatusMessage kind="error" :message-key="status.errorKey" :message="status.errorMessage" />
    <FormStatusMessage kind="success" :message-key="status.successKey" />

    <div class="space-y-3 text-left">
      <div class="form__group">
        <div class="form__field">
          <input
            id="setup-display-name"
            v-model="form.displayName"
            :class="inputClass(submitted && v$.displayName.$invalid)"
            type="text"
            autocomplete="name"
            placeholder=" "
            :aria-invalid="submitted && v$.displayName.$invalid"
            required
          />
          <label :class="labelClass(submitted && v$.displayName.$invalid)" for="setup-display-name">
            {{ t('setup.initial_admin.form.display_name') }}
          </label>
        </div>
        <p v-if="apiFieldErrors.displayName || (submitted && v$.displayName.$error)" :class="validationErrorClass">
          <span v-if="apiFieldErrors.displayName">{{ t(apiFieldErrors.displayName) }}</span>
          <span v-else>{{ t('setup.initial_admin.error.display_name') }}</span>
        </p>
      </div>

      <div class="form__group">
        <div class="form__field">
          <input
            id="setup-email"
            v-model="form.email"
            :class="inputClass(submitted && v$.email.$invalid)"
            type="email"
            inputmode="email"
            autocomplete="email"
            placeholder=" "
            :aria-invalid="submitted && v$.email.$invalid"
            required
          />
          <label :class="labelClass(submitted && v$.email.$invalid)" for="setup-email">
            {{ t('setup.initial_admin.form.email') }}
          </label>
        </div>
        <p v-if="apiFieldErrors.email || (submitted && v$.email.$error)" :class="validationErrorClass">
          <span v-if="apiFieldErrors.email">{{ t(apiFieldErrors.email) }}</span>
          <span v-else>{{ t('setup.initial_admin.error.email') }}</span>
        </p>
      </div>

      <div class="form__group">
        <div class="form__field">
          <input
            id="setup-password"
            v-model="form.password"
            :type="passwordInputType"
            :class="[inputClass(submitted && v$.password.$invalid), 'pr-12']"
            autocomplete="new-password"
            placeholder=" "
            :aria-invalid="submitted && v$.password.$invalid"
            required
          />
          <label :class="labelClass(submitted && v$.password.$invalid)" for="setup-password">
            {{ t('setup.initial_admin.form.password') }}
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
        <p v-if="apiFieldErrors.password || (submitted && v$.password.$error)" :class="validationErrorClass">
          <span v-if="apiFieldErrors.password">{{ t(apiFieldErrors.password) }}</span>
          <span v-else>{{ t('setup.initial_admin.error.password') }}</span>
        </p>
        <div class="grid grid-cols-4 gap-2">
          <span
            v-for="index in 4"
            :key="index"
            :class="['h-1 rounded-xs transition', passwordStrength >= index ? 'bg-primary' : 'bg-muted']"
          />
        </div>
        <p class="text-muted-foreground text-xs">
          {{ t('setup.initial_admin.form.password_hint') }}
        </p>
      </div>

      <div class="form__group">
        <div class="form__field">
          <input
            id="setup-password-confirm"
            v-model="form.confirmPassword"
            :class="inputClass(submitted && v$.confirmPassword.$invalid)"
            type="password"
            autocomplete="new-password"
            placeholder=" "
            :aria-invalid="submitted && v$.confirmPassword.$invalid"
            required
          />
          <label :class="labelClass(submitted && v$.confirmPassword.$invalid)" for="setup-password-confirm">
            {{ t('setup.initial_admin.form.confirm_password') }}
          </label>
        </div>
        <p
          v-if="apiFieldErrors.confirmPassword || (submitted && v$.confirmPassword.$error)"
          :class="validationErrorClass"
        >
          <span v-if="apiFieldErrors.confirmPassword">{{ t(apiFieldErrors.confirmPassword) }}</span>
          <span v-else>{{ t('setup.initial_admin.error.confirm_password') }}</span>
        </p>
      </div>
    </div>

    <div>
      <AppButton full variant="primary" size="md" :disabled="loading">
        {{ t('setup.initial_admin.form.submit') }}
      </AppButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline';
import AppButton from '../../components/AppButton.vue';
import FormStatusMessage from '../../components/form/FormStatusMessage.vue';
import { computed } from 'vue';
import { useFormFieldClasses } from '../../composables/useFormFieldClasses';
import { usePasswordVisibility } from '../../composables/usePasswordVisibility';
import { useInitialAdminForm } from '../../features/setup/composables/useInitialAdminForm';
import { useCsrfTokens } from '../../features/auth/composables/useCsrfTokens';
import type { CsrfTokens } from '../../features/auth/types';

const props = defineProps<{
  csrf?: CsrfTokens;
  wordingName?: string;
  endpoints?: {
    submit: string;
  };
  pages?: {
    login: string;
  };
}>();

useCsrfTokens(props.csrf);

const submitEndpoint = computed(() => props.endpoints?.submit ?? '/api/setup/admin');
const loginUrl = computed(() => props.pages?.login ?? '/login');

const {
  form,
  submitted,
  loading,
  status,
  v$,
  passwordStrength,
  apiFieldErrors,
  onSubmit,
} = useInitialAdminForm(submitEndpoint.value, () => {
  window.location.href = loginUrl.value;
});
const { inputClass, labelClass, validationErrorClass } = useFormFieldClasses();
const {
  visible: passwordVisible,
  inputType: passwordInputType,
  toggle: togglePasswordVisibility,
} = usePasswordVisibility();

const wording = computed(() => props.wordingName ?? 'Obsidiane Auth');

const { t } = useI18n();
</script>
