const PATH_SETUP_INITIAL_ADMIN = '/api/setup/admin';
export class SetupApiClient {
    constructor(http) {
        this.http = http;
    }
    createInitialAdmin(input, signal) {
        return this.http.request('POST', PATH_SETUP_INITIAL_ADMIN, {
            json: input,
            csrf: true,
            signal,
        });
    }
}
//# sourceMappingURL=setup.js.map