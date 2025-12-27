export interface ApiErrorPayload {
  error?: string;
  details?: unknown;
  [key: string]: unknown;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly errorCode: string;
  public readonly details?: unknown;
  public readonly payload: ApiErrorPayload;

  constructor(status: number, errorCode: string, details?: unknown, payload: ApiErrorPayload = {}) {
    const message = `${errorCode} [${status}]`;
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorCode = errorCode;
    this.details = details;
    this.payload = payload;

    Object.setPrototypeOf(this, new.target.prototype);
  }

  static fromPayload(status: number, payload: unknown): ApiError {
    const data = (payload && typeof payload === 'object') ? (payload as Record<string, unknown>) : {};
    const errorCode = typeof data.error === 'string' ? data.error : 'unknown_error';
    const details = data.details;

    return new ApiError(status, errorCode, details, data);
  }
}

