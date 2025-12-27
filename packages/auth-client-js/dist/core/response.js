import { ApiError } from './errors';
/**
 * Decode a fetch Response into a typed payload.
 * - 204 => returns undefined
 * - JSON => parsed object
 * - non-JSON => wrapped as { raw: string }
 * - HTTP error (status >= 400) => throws ApiError
 */
export const decodeJsonResponse = async (response) => {
    const { status } = response;
    if (status === 204) {
        return undefined;
    }
    let text = null;
    try {
        text = await response.text();
    }
    catch {
        text = null;
    }
    let payload;
    if (text && text !== '') {
        try {
            payload = JSON.parse(text);
        }
        catch {
            payload = { raw: text };
        }
    }
    else {
        payload = {};
    }
    if (!response.ok) {
        throw ApiError.fromPayload(status, payload);
    }
    return payload;
};
//# sourceMappingURL=response.js.map