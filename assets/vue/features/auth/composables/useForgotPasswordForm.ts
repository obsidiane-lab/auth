import { reactive, ref } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import { email as emailRule, required } from '@vuelidate/validators';
import { useSubmissionState } from '../../../composables/useSubmissionState';
import { useFormStatus } from './useFormStatus';
import { useAuthNavigation } from './useAuthNavigation';
import { useCsrfTokens } from './useCsrfTokens';
import {
  COMMON_UNEXPECTED_ERROR_KEY,
  PASSWORD_REQUEST_ERROR_KEYS,
  PASSWORD_REQUEST_SUCCESS_KEY,
} from '../constants';
import type { AuthEndpoints, AuthPages, CsrfTokens, ForgotPasswordForm } from '../types';
import { createAuthApi, AuthApiError } from '../api';
import { getApiErrorMessage, resolveApiErrorKey } from './useApiErrors';

export interface ForgotPasswordFormProps {
  endpoints: AuthEndpoints;
  pages: AuthPages;
  csrf?: CsrfTokens;
}

export const useForgotPasswordForm = (props: ForgotPasswordFormProps) => {
  useCsrfTokens();

  const form = reactive<ForgotPasswordForm>({ email: '' });
  const apiErrorKey = ref<string | null>(null);

  const { submitted, loading, markSubmitted, withLoading } = useSubmissionState();
  const { status, setError, setSuccess, resetStatus } = useFormStatus();
  const navigation = useAuthNavigation(props.pages);
  const authApi = createAuthApi(props.endpoints);

  const v$ = useVuelidate(
    {
      email: { required, email: emailRule },
    },
    form,
  );

  const onSubmit = async () => {
    markSubmitted();
    resetStatus();
    apiErrorKey.value = null;

    const isValid = await v$.value.$validate();

    if (!isValid) {
      return;
    }

    await withLoading(async () => {
      try {
        await authApi.requestPasswordReset(form);
        setSuccess(PASSWORD_REQUEST_SUCCESS_KEY);
      } catch (error) {
        if (error instanceof AuthApiError) {
          if (error.status === 429) {
            setError(PASSWORD_REQUEST_ERROR_KEYS.RATE_LIMIT);
            return;
          }

          const translationKey = resolveApiErrorKey(error.payload, PASSWORD_REQUEST_ERROR_KEYS);

          if (translationKey) {
            if (error.payload?.error && error.payload.error !== '') {
              setError(translationKey);
            } else {
              apiErrorKey.value = translationKey;
            }
            return;
          }

          const apiMessage = getApiErrorMessage(error.payload);

          if (apiMessage) {
            setError(undefined, apiMessage);
            return;
          }

          setError(COMMON_UNEXPECTED_ERROR_KEY);
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
    apiErrorKey,
    onSubmit,
    goToLogin,
  };
};
