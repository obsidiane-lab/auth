const PATH_AUTH_ME = '/api/auth/me';
const PATH_AUTH_LOGIN = '/api/auth/login';
const PATH_AUTH_REFRESH = '/api/auth/refresh';
const PATH_AUTH_LOGOUT = '/api/auth/logout';
const PATH_AUTH_REGISTER = '/api/auth/register';
const PATH_AUTH_PASSWORD_FORGOT = '/api/auth/password/forgot';
const PATH_AUTH_PASSWORD_RESET = '/api/auth/password/reset';
const PATH_AUTH_INVITE = '/api/auth/invite';
const PATH_AUTH_INVITE_COMPLETE = '/api/auth/invite/complete';
export class AuthApiClient {
    constructor(http) {
        this.http = http;
    }
    me(signal) {
        return this.http.request('GET', PATH_AUTH_ME, { signal });
    }
    login(email, password, signal) {
        return this.http.request('POST', PATH_AUTH_LOGIN, {
            json: { email, password },
            csrf: true,
            signal,
        });
    }
    refresh(csrfToken, signal) {
        return this.http.request('POST', PATH_AUTH_REFRESH, {
            csrf: csrfToken !== null && csrfToken !== void 0 ? csrfToken : false,
            signal,
        });
    }
    logout(signal) {
        return this.http.request('POST', PATH_AUTH_LOGOUT, {
            csrf: true,
            signal,
        });
    }
    register(input, signal) {
        return this.http.request('POST', PATH_AUTH_REGISTER, {
            json: input,
            csrf: true,
            signal,
        });
    }
    requestPasswordReset(email, signal) {
        return this.http.request('POST', PATH_AUTH_PASSWORD_FORGOT, {
            json: { email },
            csrf: true,
            signal,
        });
    }
    resetPassword(token, password, signal) {
        return this.http.request('POST', PATH_AUTH_PASSWORD_RESET, {
            json: { token, password },
            csrf: true,
            signal,
        });
    }
    inviteUser(email, signal) {
        return this.http.request('POST', PATH_AUTH_INVITE, {
            json: { email },
            csrf: true,
            signal,
        });
    }
    completeInvite(token, password, signal) {
        return this.http.request('POST', PATH_AUTH_INVITE_COMPLETE, {
            json: {
                token,
                password,
                confirmPassword: password,
            },
            csrf: true,
            signal,
        });
    }
}
//# sourceMappingURL=auth.js.map