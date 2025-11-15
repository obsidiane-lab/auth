<template>
    <form class="my-10 space-y-6" novalidate @submit.prevent="onSubmit">
        <div class="text-center">
            <h2 class="text-foreground mb-1 text-3xl font-semibold">
                {{ t('auth.register.view.heading') }}
                <span class="text-primary">{{ t('auth.register.view.heading_suffix') }}</span>
            </h2>
            <p class="text-muted-foreground text-sm">{{ t('auth.register.view.subtitle') }}</p>
        </div>

        <FormStatusMessage kind="error" :message-key="status.errorKey" :message="status.errorMessage" />
        <FormStatusMessage kind="success" :message-key="status.successKey" />


        <div class="space-y-3 text-left">
            <div class="form__group">
                <div class="form__field">
                    <input
                        id="register-display-name"
                        v-model="form.displayName"
                        :class="inputClass(submitted && v$.displayName.$invalid)"
                        type="text"
                        autocomplete="name"
                        placeholder=" "
                        :aria-invalid="submitted && v$.displayName.$invalid"
                        required
                    />
                    <label :class="labelClass(submitted && v$.displayName.$invalid)" for="register-display-name">
                        {{ t('auth.register.form.display_name.label') }}
                    </label>
                </div>
                <p v-if="apiFieldErrors.displayName || (submitted && v$.displayName.$error)" :class="validationErrorClass">
                    <span v-if="apiFieldErrors.displayName">{{ t(apiFieldErrors.displayName) }}</span>
                    <span v-else>{{ t(REGISTER_ERROR_KEYS.DISPLAY_NAME_REQUIRED) }}</span>
                </p>
            </div>

            <div class="form__group">
                <div class="form__field">
                    <input
                        id="register-email"
                        v-model="form.email"
                        :class="inputClass(submitted && v$.email.$invalid)"
                        type="email"
                        inputmode="email"
                        autocomplete="email"
                        placeholder=" "
                        :aria-invalid="submitted && v$.email.$invalid"
                        required
                    />
                    <label :class="labelClass(submitted && v$.email.$invalid)" for="register-email">
                        {{ t('auth.register.form.email.label') }}
                    </label>
                </div>
                <p v-if="apiFieldErrors.email || (submitted && v$.email.$error)" :class="validationErrorClass">
                    <span v-if="apiFieldErrors.email">{{ t(apiFieldErrors.email) }}</span>
                    <span v-else-if="v$.email.email.$invalid">{{ t('auth.login.error.api.INVALID_PAYLOAD') }}</span>
                    <span v-else>{{ t('auth.login.error.credentials_required') }}</span>
                </p>
            </div>

            <div class="form__group">
                <div class="form__field">
                    <input
                        id="register-password"
                        v-model="form.password"
                        :type="passwordInputType"
                        :class="[inputClass(submitted && v$.password.$invalid), 'pr-12']"
                        autocomplete="new-password"
                        placeholder=" "
                        :aria-invalid="submitted && v$.password.$invalid"
                        required
                    />
                    <label :class="labelClass(submitted && v$.password.$invalid)" for="register-password">
                        {{ t('auth.register.form.password.label') }}
                    </label>
                    <button
                        type="button"
                        class="form__toggle"
                        :aria-label="t('auth.form.toggle_password')"
                        :aria-pressed="passwordVisible"
                        @click="togglePasswordVisibility"
                    >
                        <EyeSlashIcon v-if="!passwordVisible" class="h-5 w-5" aria-hidden="true"/>
                        <EyeIcon v-else class="h-5 w-5" aria-hidden="true"/>
                    </button>
                </div>
                <p v-if="apiFieldErrors.password || (submitted && v$.password.$error)" :class="validationErrorClass">
                    <span v-if="apiFieldErrors.password">{{ t(apiFieldErrors.password) }}</span>
                    <span v-else-if="v$.password.minLength.$invalid">{{
                            t(REGISTER_ERROR_KEYS.INVALID_PASSWORD)
                        }}</span>
                    <span v-else>{{ t('auth.login.error.credentials_required') }}</span>
                </p>
                <div class="grid grid-cols-4 gap-2">
          <span
              v-for="index in 4"
              :key="index"
              :class="['h-1 rounded-xs transition', passwordStrength >= index ? 'bg-primary' : 'bg-muted']"
          />
                </div>
                <p class="text-muted-foreground text-xs">
                    {{ t('auth.register.view.password_hint') }}
                </p>
            </div>

            <div class="form__group">
                <div class="form__field">
                    <input
                        id="register-confirm-password"
                        v-model="form.confirmPassword"
                        :class="inputClass(submitted && v$.confirmPassword.$invalid)"
                        type="password"
                        autocomplete="new-password"
                        placeholder=" "
                        :aria-invalid="submitted && v$.confirmPassword.$invalid"
                        required
                    />
                    <label :class="labelClass(submitted && v$.confirmPassword.$invalid)"
                           for="register-confirm-password">
                        {{ t('auth.register.view.confirm_password') }}
                    </label>
                </div>
                <p v-if="apiFieldErrors.confirmPassword || (submitted && v$.confirmPassword.$error)" :class="validationErrorClass">
                    <span v-if="apiFieldErrors.confirmPassword">{{ t(apiFieldErrors.confirmPassword) }}</span>
                    <span v-else>{{ t('password.reset.error.mismatch') }}</span>
                </p>
            </div>

        </div>
        <div>
            <AppButton full variant="primary" size="md" :disabled="loading">
                {{ t('auth.register.form.submit') }}
            </AppButton>
        </div>

        <div class="text-muted-foreground flex items-center text-sm">
            <span>{{ t('auth.register.view.already') }}</span>
            <AppButton variant="ghost" size="sm" type="button" class="ml-2" @click="goToSignIn">
                {{ t('auth.register.view.sign_in') }}
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
import { REGISTER_ERROR_KEYS } from '../../../features/auth/constants';
import { useSignUpForm } from '../../../features/auth/composables/useSignUpForm';

const props = defineProps<{
  endpoints: AuthEndpoints;
  pages: AuthPages;
  resetToken?: string;
  csrf?: CsrfTokens;
}>();

const {
  form,
  passwordStrength,
  submitted,
  loading,
  v$,
  status,
  apiFieldErrors,
  onSubmit,
  goToSignIn,
} = useSignUpForm(props);

const { inputClass, labelClass, validationErrorClass } = useFormFieldClasses();
const {
  visible: passwordVisible,
  inputType: passwordInputType,
  toggle: togglePasswordVisibility,
} = usePasswordVisibility();

const { t } = useI18n();
</script>
