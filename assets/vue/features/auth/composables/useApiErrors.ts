export type ApiErrorPayload = {
  error?: string;
  message?: string;
  details?: Record<string, string>;
};

export const resolveApiErrorKey = (
  payload: ApiErrorPayload | null,
  translationMap: Record<string, string>
): string | null => {
  const code = payload?.error;

  if (typeof code === 'string' && code !== '') {
    return translationMap[code] ?? null;
  }

  return null;
};

export const getApiErrorMessage = (payload: ApiErrorPayload | null): string | null => {
  if (typeof payload?.message === 'string' && payload.message.trim() !== '') {
    return payload.message;
  }

  return null;
};

export const applyFieldErrorsFromPayload = (
  payload: ApiErrorPayload | null,
  fieldMap: Record<string, string>,
  translationMap: Record<string, string>,
  setFieldError: (field: string, translationKey: string) => void,
  defaultField?: string,
): boolean => {
  if (!payload?.details || typeof payload.details !== 'object') {
    return false;
  }

  let applied = false;

  Object.entries(payload.details).forEach(([field, code]) => {
    if (typeof code !== 'string') {
      return;
    }

    const targetField = fieldMap[field] ?? defaultField ?? field;
    const translationKey = translationMap[code] ?? translationMap.UNKNOWN ?? code;

    setFieldError(targetField, translationKey);
    applied = true;
  });

  return applied;
};

export interface HandleApiErrorOptions {
  payload: ApiErrorPayload | null;
  translationMap: Record<string, string>;
  setError: (translationKey?: string, message?: string) => void;
  fallbackKey?: string;
  fieldMap?: Record<string, string>;
  defaultField?: string;
  setFieldError?: (field: string, translationKey: string) => void;
}

export const handleApiError = (options: HandleApiErrorOptions): boolean => {
  const {
    payload,
    translationMap,
    setError,
    fallbackKey,
    fieldMap,
    defaultField,
    setFieldError,
  } = options;

  if (
    fieldMap &&
    setFieldError &&
    applyFieldErrorsFromPayload(payload, fieldMap, translationMap, setFieldError, defaultField)
  ) {
    return true;
  }

  const translationKey = resolveApiErrorKey(payload, translationMap);

  if (translationKey) {
    setError(translationKey);
    return true;
  }

  const apiMessage = getApiErrorMessage(payload);

  if (apiMessage) {
    setError(undefined, apiMessage);
    return true;
  }

  if (fallbackKey) {
    setError(fallbackKey);
    return true;
  }

  return false;
};
