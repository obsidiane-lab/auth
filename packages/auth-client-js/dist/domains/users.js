const PATH_USERS = '/api/users';
export class UsersApiClient {
    constructor(http) {
        this.http = http;
    }
    async list(signal) {
        return this.http.request('GET', PATH_USERS, { signal });
    }
    async get(id, signal) {
        return this.http.request('GET', `${PATH_USERS}/${id}`, { signal });
    }
    delete(id, signal) {
        return this.http.request('DELETE', `${PATH_USERS}/${id}`, { signal });
    }
}
//# sourceMappingURL=users.js.map