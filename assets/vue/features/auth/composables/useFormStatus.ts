import { reactive } from 'vue';

export interface FormStatusState {
  errorKey: string;
  errorMessage: string;
  successKey: string;
  infoKey: string;
}

const createEmptyStatus = (): FormStatusState => ({
  errorKey: '',
  errorMessage: '',
  successKey: '',
  infoKey: '',
});

export const useFormStatus = () => {
  const status = reactive<FormStatusState>(createEmptyStatus());

  const resetStatus = () => {
    status.errorKey = '';
    status.errorMessage = '';
    status.successKey = '';
    status.infoKey = '';
  };

  const setError = (key?: string, message?: string) => {
    resetStatus();
    status.errorKey = key ?? '';
    status.errorMessage = message ?? '';
  };

  const setSuccess = (key?: string) => {
    resetStatus();
    status.successKey = key ?? '';
  };

  const setInfo = (key?: string) => {
    status.infoKey = key ?? '';
  };

  return {
    status,
    setError,
    setSuccess,
    setInfo,
    resetStatus,
  };
};
