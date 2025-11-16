import { computed, reactive } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import { email as emailRule, helpers, minLength, required, sameAs } from '@vuelidate/validators';
import { useSubmissionState } from '../../../composables/useSubmissionState';
import { useFormStatus } from './useFormStatus';
import { useAuthNavigation } from './useAuthNavigation';
import { useCsrfTokens } from './useCsrfTokens';
import { usePasswordStrength } from '../../../composables/usePasswordStrength';
import {
  COMMON_UNEXPECTED_ERROR_KEY,
  REGISTER_ERROR_KEYS,
  REGISTER_SUCCESS_KEY,
} from '../constants';
import type { AuthEndpoints, AuthPages, CsrfTokens, SignUpForm } from '../types';
import { createAuthApi, AuthApiError } from '../api';
import { handleApiError } from './useApiErrors';

export interface SignUpFormProps {
  endpoints: AuthEndpoints;
  pages: AuthPages;
  csrf?: CsrfTokens;
}

export const useSignUpForm = (props: SignUpFormProps) => {
  useCsrfTokens();

  const form = reactive<SignUpForm>({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const apiFieldErrors = reactive<Partial<Record<keyof SignUpForm, string>>>({});

  const { submitted, loading, markSubmitted, withLoading } = useSubmissionState();
  const { status, setError, setSuccess, resetStatus } = useFormStatus();
  const navigation = useAuthNavigation(props.pages);
  const authApi = createAuthApi(props.endpoints);

  const passwordValue = computed(() => form.password);
  const { passwordStrength } = usePasswordStrength(passwordValue);

  const v$ = useVuelidate(
    {
      displayName: { required },
      email: { required, email: emailRule },
      password: { required, minLength: minLength(8) },
      confirmPassword: {
        required,
        sameAsPassword: sameAs(passwordValue),
      },
    },
    form,
  );

  const clearFieldErrors = () => {
    Object.keys(apiFieldErrors).forEach((key) => {
      delete apiFieldErrors[key as keyof SignUpForm];
    });
  };

  const handleError = (error: AuthApiError) => {
    handleApiError({
      payload: error.payload,
      translationMap: REGISTER_ERROR_KEYS,
      fallbackKey: COMMON_UNEXPECTED_ERROR_KEY,
      setError,
      fieldMap: {
        email: 'email',
        'identity.displayName': 'displayName',
        plainPassword: 'password',
      },
      defaultField: 'email',
      setFieldError: (field, key) => {
        apiFieldErrors[field as keyof SignUpForm] = key;
      },
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
        await authApi.register(form);
        setSuccess(REGISTER_SUCCESS_KEY);

        window.setTimeout(() => {
          navigation.goToLogin();
        }, 1200);
      } catch (error) {
        if (error instanceof AuthApiError) {
          handleError(error);
          return;
        }

        setError(COMMON_UNEXPECTED_ERROR_KEY);
      }
    });
  };

  const goToSignIn = () => {
    navigation.goToLogin();
  };

  return {
    form,
    passwordStrength,
    submitted,
    loading,
    v$,
    status,
    apiFieldErrors,
    onSubmit,
    goToSignIn,
  };
};
