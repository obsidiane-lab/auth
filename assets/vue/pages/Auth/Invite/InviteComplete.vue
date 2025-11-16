<template>
  <form class="my-10 space-y-6" novalidate @submit.prevent="onSubmit">
    <header class="space-y-2 text-center">
      <h2 class="text-foreground mb-1 text-3xl font-semibold">
        {{ t('auth.invite.view.heading') }}
        <span class="text-primary">{{ t('auth.invite.view.heading_suffix') }}</span>
      </h2>
      <p class="text-muted-foreground text-sm">
        {{ t('auth.invite.view.subtitle') }}
      </p>
    </header>

    <FormStatusMessage kind="error" :message-key="status.errorKey" :message="status.errorMessage" />
    <FormStatusMessage kind="success" :message-key="status.successKey" />

    <div v-if="alreadyCompleted" class="flex justify-center">
      <AppButton variant="ghost" size="sm" type="button" @click="goToLogin">
        {{ t('auth.invite.view.back_to_login') }}
      </AppButton>
    </div>

    <div v-if="!alreadyCompleted" class="space-y-3 text-left">
      <div class="form__group">
        <div class="form__field">
          <input
            id="invite-email"
            :value="invitedEmail"
            :class="[inputClass(false), 'cursor-not-allowed opacity-70']"
            type="email"
            autocomplete="email"
            placeholder=" "
            disabled
          />
          <label :class="labelClass(false)" for="invite-email">
            {{ t('auth.invite.view.email_label') }}
          </label>
        </div>
      </div>

      <div class="form__group">
        <div class="form__field">
          <input
            id="invite-display-name"
            v-model="form.displayName"
            :class="inputClass(submitted && v$.displayName.$invalid)"
            type="text"
            autocomplete="name"
            placeholder=" "
            :aria-invalid="submitted && v$.displayName.$invalid"
            required
          />
          <label :class="labelClass(submitted && v$.displayName.$invalid)" for="invite-display-name">
            {{ t('auth.invite.view.display_name_label') }}
          </label>
        </div>
        <p
          v-if="apiFieldErrors.displayName || (submitted && v$.displayName.$error)"
          :class="validationErrorClass"
        >
          <span v-if="apiFieldErrors.displayName">{{ t(apiFieldErrors.displayName!) }}</span>
          <span v-else>{{ t(REGISTER_ERROR_KEYS.DISPLAY_NAME_REQUIRED) }}</span>
        </p>
      </div>

      <div class="form__group">
        <div class="form__field">
          <input
            id="invite-password"
            v-model="form.password"
            :type="passwordInputType"
            :class="[inputClass(submitted && v$.password.$invalid), 'pr-12']"
            autocomplete="new-password"
            placeholder=" "
            :aria-invalid="submitted && v$.password.$invalid"
            required
          />
          <label :class="labelClass(submitted && v$.password.$invalid)" for="invite-password">
            {{ t('auth.invite.view.password_label') }}
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
          <span v-if="apiFieldErrors.password">{{ t(apiFieldErrors.password!) }}</span>
          <span v-else>{{ t(REGISTER_ERROR_KEYS.INVALID_PASSWORD) }}</span>
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

      <div class="form__group">
        <div class="form__field">
          <input
            id="invite-confirm-password"
            v-model="form.confirmPassword"
            :class="inputClass(submitted && v$.confirmPassword.$invalid)"
            type="password"
            autocomplete="new-password"
            placeholder=" "
            :aria-invalid="submitted && v$.confirmPassword.$invalid"
            required
          />
          <label
            :class="labelClass(submitted && v$.confirmPassword.$invalid)"
            for="invite-confirm-password"
          >
            {{ t('auth.invite.view.confirm_password_label') }}
          </label>
        </div>
        <p
          v-if="apiFieldErrors.confirmPassword || (submitted && v$.confirmPassword.$error)"
          :class="validationErrorClass"
        >
          <span v-if="apiFieldErrors.confirmPassword">{{ t(apiFieldErrors.confirmPassword!) }}</span>
          <span v-else>{{ t(PASSWORD_MISMATCH_KEY) }}</span>
        </p>
      </div>
    </div>

    <div v-if="!alreadyCompleted">
      <AppButton full variant="primary" size="md" :disabled="loading || !hasToken">
        {{ t('auth.invite.view.submit') }}
      </AppButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { useVuelidate } from '@vuelidate/core';
import { helpers, minLength, required, sameAs } from '@vuelidate/validators';
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline';
import AppButton from '../../../components/AppButton.vue';
import FormStatusMessage from '../../../components/form/FormStatusMessage.vue';
import { useFormFieldClasses } from '../../../composables/useFormFieldClasses';
import { usePasswordVisibility } from '../../../composables/usePasswordVisibility';
import { usePasswordStrength } from '../../../composables/usePasswordStrength';
import { useSubmissionState } from '../../../composables/useSubmissionState';
import type { AuthEndpoints, AuthPages, CsrfTokens } from '../../../features/auth/types';
import { PASSWORD_MISMATCH_KEY, REGISTER_ERROR_KEYS } from '../../../features/auth/constants';
import { createAuthApi, AuthApiError } from '../../../features/auth/api';
import { useFormStatus } from '../../../features/auth/composables/useFormStatus';
import { useAuthNavigation } from '../../../features/auth/composables/useAuthNavigation';
import { useCsrfTokens } from '../../../features/auth/composables/useCsrfTokens';
import { handleApiError } from '../../../features/auth/composables/useApiErrors';
import { http, jsonConfig } from '../../../utils/http';

const props = defineProps<{
  endpoints: AuthEndpoints;
  pages: AuthPages;
  inviteToken: string;
  invitedEmail?: string | null;
  inviteAlreadyAccepted?: boolean;
  csrf?: CsrfTokens;
}>();

useCsrfTokens();

interface InviteCompleteForm {
  displayName: string;
  password: string;
  confirmPassword: string;
}

const form = reactive<InviteCompleteForm>({
  displayName: '',
  password: '',
  confirmPassword: '',
});

const apiFieldErrors = reactive<Partial<Record<keyof InviteCompleteForm, string>>>({});

const { submitted, loading, markSubmitted, withLoading } = useSubmissionState();
const { status, setError, setSuccess, resetStatus } = useFormStatus();
const navigation = useAuthNavigation(props.pages);

const hasToken = computed(() => typeof props.inviteToken === 'string' && props.inviteToken.trim() !== '');
const invitedEmail = computed(() => props.invitedEmail ?? '');
const alreadyCompleted = computed(() => props.inviteAlreadyAccepted === true);

const passwordValue = computed(() => form.password);
const { passwordStrength } = usePasswordStrength(passwordValue);

const v$ = useVuelidate(
  {
    displayName: { required },
    password: { required, minLength: minLength(8) },
    confirmPassword: {
      required,
      sameAsPassword: sameAs(passwordValue),
    },
  },
  form,
);

const { inputClass, labelClass, validationErrorClass } = useFormFieldClasses();
const {
  visible: passwordVisible,
  inputType: passwordInputType,
  toggle: togglePasswordVisibility,
} = usePasswordVisibility();

const { t } = useI18n();

if (alreadyCompleted.value) {
  setSuccess('auth.invite.view.already_completed');
}

const clearFieldErrors = () => {
  Object.keys(apiFieldErrors).forEach((key) => {
    delete apiFieldErrors[key as keyof InviteCompleteForm];
  });
};

const handleError = (error: AuthApiError) => {
  handleApiError({
    payload: error.payload,
    translationMap: REGISTER_ERROR_KEYS,
    fallbackKey: 'common.error.unexpected',
    setError,
    fieldMap: {
      email: 'email',
      'identity.displayName': 'displayName',
      plainPassword: 'password',
    },
    defaultField: 'displayName',
    setFieldError: (field, key) => {
      apiFieldErrors[field as keyof InviteCompleteForm] = key;
    },
  });
};

const onSubmit = async () => {
  markSubmitted();
  resetStatus();
  clearFieldErrors();

  if (!hasToken.value) {
    setError('INVALID_INVITATION');
    return;
  }

  const isValid = await v$.value.$validate();

  if (!isValid) {
    return;
  }

  await withLoading(async () => {
    try {
      await http.post(
        '/api/auth/invite/complete',
        {
          token: props.inviteToken,
          displayName: form.displayName,
          password: form.password,
          confirmPassword: form.confirmPassword,
        },
        jsonConfig('invite_complete'),
      );

      setSuccess('auth.register.message.success');

      window.setTimeout(() => {
        navigation.goToLogin();
      }, 1200);
    } catch (error) {
      const normalized = error instanceof AuthApiError ? error : new AuthApiError('Unexpected', { cause: error });
      handleError(normalized);
    }
  });
};

const goToLogin = () => {
  navigation.goToLogin();
};

</script>
