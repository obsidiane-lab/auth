export class AuthClientError extends Error {
    constructor(message, payload = {}) {
        super(message);
        this.name = 'AuthClientError';
        this.payload = payload;
        this.status = payload.status;
        this.code = payload.error;
        this.details = payload.details;
    }
}
