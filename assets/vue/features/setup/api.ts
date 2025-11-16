import axios from 'axios';
import { http, jsonConfig } from '../../utils/http';
import { AuthApiError } from '../auth/api';
import type { ApiErrorPayload } from '../auth/composables/useApiErrors';

export interface InitialAdminPayload {
  displayName: string;
  email: string;
  password: string;
}

export const createInitialAdmin = async (endpoint: string, payload: InitialAdminPayload) => {
  try {
    await http.post(
      endpoint,
      {
        displayName: payload.displayName,
        email: payload.email,
        password: payload.password,
      },
      jsonConfig(true),
    );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const payloadData = (error.response?.data ?? null) as ApiErrorPayload | null;
      throw new AuthApiError(error.message, {
        status: error.response?.status,
        payload: payloadData,
        cause: error,
      });
    }

    throw error;
  }
};
