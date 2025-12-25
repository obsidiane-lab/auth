import { ApiError } from './errors';

/**
 * Decode a fetch Response into a typed payload.
 * - 204 => returns undefined
 * - JSON => parsed object
 * - non-JSON => wrapped as { raw: string }
 * - HTTP error (status >= 400) => throws ApiError
 */
export const decodeJsonResponse = async <T>(response: Response): Promise<T> => {
  const { status } = response;

  if (status === 204) {
    return undefined as unknown as T;
  }

  let text: string | null = null;

  try {
    text = await response.text();
  } catch {
    text = null;
  }

  let payload: unknown;

  if (text && text !== '') {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }
  } else {
    payload = {};
  }

  if (!response.ok) {
    throw ApiError.fromPayload(status, payload);
  }

  return payload as T;
};

