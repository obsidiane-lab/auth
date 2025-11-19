/**
 * Decode a fetch Response into a typed payload.
 * - 204 => returns undefined
 * - JSON => parsed object
 * - non-JSON => wrapped as { raw: string }
 * - HTTP error (status >= 400) => throws ApiError
 */
export declare const decodeJsonResponse: <T>(response: Response) => Promise<T>;
