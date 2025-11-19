const PATH_INVITE_USERS = '/api/invite_users';
export class InvitesApiClient {
    constructor(http) {
        this.http = http;
    }
    async list(signal) {
        return this.http.request('GET', PATH_INVITE_USERS, { signal });
    }
    async get(id, signal) {
        return this.http.request('GET', `${PATH_INVITE_USERS}/${id}`, { signal });
    }
}
//# sourceMappingURL=invites.js.map