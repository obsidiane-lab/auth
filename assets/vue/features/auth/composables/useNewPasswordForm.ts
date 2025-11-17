import { computed, reactive, ref, watch } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import { helpers, required, sameAs } from '@vuelidate/validators';
import { useSubmissionState } from '../../../composables/useSubmissionState';
import { useFormStatus } from './useFormStatus';
import { useAuthNavigation } from './useAuthNavigation';
import { usePasswordStrength } from '../../../composables/usePasswordStrength';
import {
  COMMON_UNEXPECTED_ERROR_KEY,
  PASSWORD_MISMATCH_KEY,
  PASSWORD_POLICY_KEY,
  PASSWORD_RESET_ERROR_KEYS,
  PASSWORD_RESET_SUCCESS_KEY,
} from '../constants';
import type { AuthEndpoints, AuthPages, NewPasswordForm, PasswordPolicyConfig } from '../types';
import { createAuthApi, AuthApiError } from '../api';
import { handleApiError } from './useApiErrors';
import { meetsPasswordPolicy } from '../../../utils/passwordStrength';

export interface NewPasswordFormProps {
  endpoints: AuthEndpoints;
  pages: AuthPages;
  resetToken: string;
  passwordPolicy?: PasswordPolicyConfig | null;
}

export const useNewPasswordForm = (props: NewPasswordFormProps) => {
  const form = reactive<NewPasswordForm>({
    password: '',
    confirmPassword: '',
  });

  const token = ref(props.resetToken ?? '');
  const hasToken = computed(() => token.value.trim().length > 0);
  const resetDisabled = computed(() => !hasToken.value);

  const { submitted, loading, markSubmitted, withLoading } = useSubmissionState();
  const { status, setError, setSuccess, resetStatus } = useFormStatus();
  const navigation = useAuthNavigation(props.pages);
  const authApi = createAuthApi(props.endpoints);

  const passwordValue = computed(() => form.password);
  const { passwordStrength } = usePasswordStrength(passwordValue, props.passwordPolicy);

  watch(
    () => props.resetToken,
    (value) => {
      token.value = value ?? '';
    },
  );

  const v$ = useVuelidate(
    {
      password: {
        required,
        strongEnough: helpers.withMessage(
          () => PASSWORD_POLICY_KEY,
          (value: string) =>
            meetsPasswordPolicy(typeof value === 'string' ? value : '', props.passwordPolicy),
        ),
      },
      confirmPassword: {
        required,
        sameAsPassword: helpers.withMessage(
          () => PASSWORD_MISMATCH_KEY,
          sameAs(passwordValue),
        ),
      },
    },
    form,
  );

  const onSubmit = async () => {
    markSubmitted();
    resetStatus();

    if (!hasToken.value) {
      setError(PASSWORD_RESET_ERROR_KEYS.INVALID_TOKEN ?? COMMON_UNEXPECTED_ERROR_KEY);
      return;
    }

    const isValid = await v$.value.$validate();

    if (!isValid) {
      return;
    }

    await withLoading(async () => {
      try {
        await authApi.resetPassword({
          ...form,
          token: token.value,
        });

        setSuccess(PASSWORD_RESET_SUCCESS_KEY);
        window.setTimeout(() => {
          navigation.goToLogin();
        }, 800);
      } catch (error) {
        if (error instanceof AuthApiError) {
          const handled = handleApiError({
            payload: error.payload,
            translationMap: PASSWORD_RESET_ERROR_KEYS,
            fallbackKey: COMMON_UNEXPECTED_ERROR_KEY,
            setError,
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

  const goToLogin = () => {
    navigation.goToLogin();
  };

  return {
    form,
    submitted,
    loading,
    v$,
    status,
    passwordStrength,
    passwordValue,
    hasToken,
    resetDisabled,
    onSubmit,
    goToLogin,
    token,
  };
};
