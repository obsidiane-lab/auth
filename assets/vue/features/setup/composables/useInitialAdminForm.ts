import { computed, reactive } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import { email as emailRule, helpers, required, sameAs } from '@vuelidate/validators';
import axios from 'axios';
import { useSubmissionState } from '../../../composables/useSubmissionState';
import { useFormStatus } from '../../auth/composables/useFormStatus';
import { COMMON_UNEXPECTED_ERROR_KEY } from '../../auth/constants';
import { handleApiError } from '../../auth/composables/useApiErrors';
import { usePasswordStrength } from '../../../composables/usePasswordStrength';
import { createInitialAdmin } from '../api';
import { INITIAL_ADMIN_ERROR_KEYS } from '../constants';
import type { InitialAdminPayload } from '../api';
import type { ApiErrorPayload } from '../../auth/composables/useApiErrors';
import { AuthApiError } from '../../auth/api';
import type { PasswordPolicyConfig } from '../../auth/types';
import { meetsPasswordPolicy } from '../../../utils/passwordStrength';

export interface InitialAdminForm extends InitialAdminPayload {
  confirmPassword: string;
}

export const useInitialAdminForm = (
  endpoint: string,
  passwordPolicy?: PasswordPolicyConfig | null,
  onSuccess?: () => void,
) => {
  const form = reactive<InitialAdminForm>({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const apiFieldErrors = reactive<Partial<Record<keyof InitialAdminForm, string>>>({});

  const { submitted, loading, markSubmitted, withLoading } = useSubmissionState();
  const { status, setError, setSuccess, resetStatus } = useFormStatus();

  const passwordValue = computed(() => form.password);
  const { passwordStrength } = usePasswordStrength(passwordValue, passwordPolicy);

  const v$ = useVuelidate(
    {
      email: { required, email: emailRule },
      password: {
        required,
        strongEnough: helpers.withMessage(
          () => 'setup.initial_admin.error.password',
          (value: string) =>
            meetsPasswordPolicy(typeof value === 'string' ? value : '', passwordPolicy),
        ),
      },
      confirmPassword: {
        required,
        sameAsPassword: sameAs(passwordValue),
      },
    },
    form,
  );

  const clearFieldErrors = () => {
    Object.keys(apiFieldErrors).forEach((key) => {
      delete apiFieldErrors[key as keyof InitialAdminForm];
    });
  };

  const onSubmit = async () => {
    markSubmitted();
    resetStatus();
    clearFieldErrors();

    const isValid = await v$.value.$validate();

    if (!isValid) {
      return;
    }

    await withLoading(async () => {
      try {
        await createInitialAdmin(endpoint, form);
        setSuccess('setup.initial_admin.message.success');
        if (onSuccess) {
          window.setTimeout(() => onSuccess(), 500);
        }
      } catch (error) {
        if (error instanceof AuthApiError) {
          const handled = handleApiError({
            payload: error.payload,
            translationMap: INITIAL_ADMIN_ERROR_KEYS,
            setError,
            fallbackKey: 'setup.initial_admin.message.error',
            fieldMap: {
              email: 'email',
              plainPassword: 'password',
              password: 'password',
            },
            defaultField: 'email',
            setFieldError: (field, key) => {
              apiFieldErrors[field as keyof InitialAdminForm] = key;
            },
          });

          if (!handled) {
            setError(COMMON_UNEXPECTED_ERROR_KEY);
          }

          return;
        }

        if (axios.isAxiosError(error)) {
          const payload = (error.response?.data ?? null) as ApiErrorPayload | null;
          const handled = handleApiError({
            payload,
            translationMap: INITIAL_ADMIN_ERROR_KEYS,
            setError,
            fallbackKey: 'setup.initial_admin.message.error',
          });

          if (!handled) {
            setError(COMMON_UNEXPECTED_ERROR_KEY);
          }

          return;
        }

        setError(COMMON_UNEXPECTED_ERROR_KEY);
      }
    });
  };

  return {
    form,
    submitted,
    loading,
    status,
    v$,
    passwordStrength,
    apiFieldErrors,
    onSubmit,
  };
};
