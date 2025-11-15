import { ref } from 'vue';

export const useSubmissionState = () => {
  const submitted = ref(false);
  const loading = ref(false);

  const markSubmitted = () => {
    submitted.value = true;
  };

  const withLoading = async <T>(task: () => Promise<T>) => {
    loading.value = true;

    try {
      return await task();
    } finally {
      loading.value = false;
    }
  };

  const reset = () => {
    submitted.value = false;
    loading.value = false;
  };

  return {
    submitted,
    loading,
    markSubmitted,
    withLoading,
    reset,
  };
};
