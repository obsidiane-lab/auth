export class ApiError extends Error {
    constructor(status, errorCode, details, payload = {}) {
        const message = `${errorCode} [${status}]`;
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.errorCode = errorCode;
        this.details = details;
        this.payload = payload;
        Object.setPrototypeOf(this, new.target.prototype);
    }
    static fromPayload(status, payload) {
        const data = (payload && typeof payload === 'object') ? payload : {};
        const errorCode = typeof data.error === 'string' ? data.error : 'unknown_error';
        const details = data.details;
        return new ApiError(status, errorCode, details, data);
    }
}
//# sourceMappingURL=errors.js.map