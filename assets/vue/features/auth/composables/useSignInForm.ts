import { computed, reactive, ref, watch } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import { email as emailRule, required } from '@vuelidate/validators';
import { useSubmissionState } from '../../../composables/useSubmissionState';
import { useFormStatus } from './useFormStatus';
import { useAuthNavigation } from './useAuthNavigation';
import { useCsrfTokens } from './useCsrfTokens';
import {
  COMMON_UNEXPECTED_ERROR_KEY,
  DEFAULT_FEATURE_FLAGS,
  LOGIN_ERROR_KEYS,
  LOGIN_REDIRECT_KEY,
  LOGIN_SUCCESS_KEY,
} from '../constants';
import type {
  AuthEndpoints,
  AuthPages,
  CsrfTokens,
  FeatureFlagsConfig,
  SignInForm,
} from '../types';
import { createAuthApi, AuthApiError } from '../api';
import { handleApiError } from './useApiErrors';

export interface SignInFormProps {
  endpoints: AuthEndpoints;
  pages: AuthPages;
  redirectTarget: string;
  flashMessageKey?: string | null;
  prefillEmail?: string;
  featureFlags?: FeatureFlagsConfig;
  csrf?: CsrfTokens;
}

export const useSignInForm = (props: SignInFormProps) => {
  useCsrfTokens(props.csrf);

  const form = reactive<SignInForm>({
    email: props.prefillEmail ?? '',
    password: '',
  });

  const featureFlags = computed<FeatureFlagsConfig>(() => ({
    ...DEFAULT_FEATURE_FLAGS,
    ...(props.featureFlags ?? {}),
  }));

  const canRegister = computed(() => featureFlags.value.registrationEnabled);

  const flashKey = ref(props.flashMessageKey ?? null);

  const { submitted, loading, markSubmitted, withLoading } = useSubmissionState();
  const { status, setError, setSuccess, setInfo, resetStatus } = useFormStatus();
  const navigation = useAuthNavigation(props.pages);
  const authApi = createAuthApi(props.endpoints);

  const v$ = useVuelidate(
    {
      email: { required, email: emailRule },
      password: { required },
    },
    form,
  );

  watch(
    () => props.prefillEmail,
    (value) => {
      if (typeof value === 'string' && value !== form.email) {
        form.email = value;
      }
    },
  );

  watch(
    () => props.flashMessageKey,
    (value) => {
      flashKey.value = value ?? null;
    },
  );

  const dismissFlash = () => {
    flashKey.value = null;
  };

  const navigateAfterSuccess = () => {
    window.setTimeout(() => {
      setInfo(LOGIN_REDIRECT_KEY);
    }, 350);

    window.setTimeout(() => {
      navigation.navigateTo(props.redirectTarget);
    }, 1000);
  };

  const onSubmit = async () => {
    markSubmitted();
    resetStatus();
    flashKey.value = null;

    const isValid = await v$.value.$validate();

    if (!isValid) {
      return;
    }

    await withLoading(async () => {
      try {
        await authApi.login(form);
        setSuccess(LOGIN_SUCCESS_KEY);
        navigateAfterSuccess();
      } catch (error) {
        if (error instanceof AuthApiError) {
          const statusCode = error.status ?? null;
          let forcedCode: string | null = null;

          if (statusCode === 429) {
            forcedCode = 'RATE_LIMIT';
          } else if (statusCode === 401) {
            forcedCode = 'INVALID_CREDENTIALS';
          }

          const normalizedPayload = {
            ...error.payload,
            error: error.payload?.error ?? forcedCode ?? undefined,
          };

          const fallbackKey =
            (forcedCode ? LOGIN_ERROR_KEYS[forcedCode] : null) ?? COMMON_UNEXPECTED_ERROR_KEY;

          const handled = handleApiError({
            payload: normalizedPayload,
            translationMap: LOGIN_ERROR_KEYS,
            setError,
            fallbackKey,
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

  const goToForgot = () => {
    navigation.goToForgot();
  };

  const goToSignUp = () => {
    if (canRegister.value) {
      navigation.goToRegister();
    }
  };

  return {
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
  };
};
