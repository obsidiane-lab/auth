<template>
    <form class="my-10 space-y-6" novalidate @submit.prevent="onSubmit">
        <div class="text-center">
            <h2 class="text-foreground mb-1 text-3xl font-semibold">
                {{ t('password.forgot.view.heading') }}
                <span class="text-primary">{{ t('password.forgot.view.heading_suffix') }}</span>
            </h2>
            <p class="text-muted-foreground text-sm">
                {{ t('password.forgot.view.subtitle') }}
            </p>
        </div>

        <FormStatusMessage kind="error" :message-key="status.errorKey" :message="status.errorMessage" />
        <FormStatusMessage kind="success" :message-key="status.successKey" />

        <div class="space-y-3 text-left">
            <div class="form__group">
                <div class="form__field">
                    <input
                        id="forgot-email"
                        v-model="form.email"
                        :class="inputClass(submitted && v$.email.$invalid)"
                        type="email"
                        inputmode="email"
                        autocomplete="email"
                        placeholder=" "
                        :aria-invalid="submitted && v$.email.$invalid"
                        required
                    />
                    <label :class="labelClass(submitted && v$.email.$invalid)" for="forgot-email">
                        {{ t('password.request.form.email.label') }}
                    </label>
                </div>
                <p v-if="submitted && v$.email.$error" :class="validationErrorClass">
                    <span v-if="apiErrorKey">{{ t(apiErrorKey!) }}</span>
                    <span v-else-if="v$.email.email.$invalid">{{ t('auth.login.error.api.INVALID_PAYLOAD') }}</span>
                    <span v-else>{{ t('auth.login.error.credentials_required') }}</span>
                </p>
            </div>
        </div>

        <div class="flex flex-col gap-3 sm:flex-row">
            <AppButton full variant="primary" size="md" :disabled="loading">
                {{ t('password.forgot.view.submit') }}
            </AppButton>
            <AppButton full variant="secondary" size="md" type="button" @click="goToLogin">
                {{ t('password.request.form.back_to_login') }}
            </AppButton>
        </div>
    </form>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import AppButton from '../../../components/AppButton.vue';
import FormStatusMessage from '../../../components/form/FormStatusMessage.vue';
import { useFormFieldClasses } from '../../../composables/useFormFieldClasses';
import type { AuthEndpoints, AuthPages, CsrfTokens } from '../../../features/auth/types';
import { useForgotPasswordForm } from '../../../features/auth/composables/useForgotPasswordForm';

const props = defineProps<{
  endpoints: AuthEndpoints;
  pages: AuthPages;
  resetToken?: string;
  csrf?: CsrfTokens;
}>();

const {
  form,
  submitted,
  loading,
  v$,
  status,
  apiErrorKey,
  onSubmit,
  goToLogin,
} = useForgotPasswordForm(props);

const { inputClass, labelClass, validationErrorClass } = useFormFieldClasses();
const { t } = useI18n();
</script>
