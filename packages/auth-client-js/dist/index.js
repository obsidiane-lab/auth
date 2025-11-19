import { InternalHttpClient } from './core/httpClient';
import { ApiError } from './core/errors';
import { AuthApiClient } from './domains/auth';
import { UsersApiClient } from './domains/users';
import { InvitesApiClient } from './domains/invites';
import { SetupApiClient } from './domains/setup';
export { ApiError } from './core/errors';
export class AuthClient {
    constructor(options) {
        this.http = new InternalHttpClient(options);
        this.auth = new AuthApiClient(this.http);
        this.users = new UsersApiClient(this.http);
        this.invites = new InvitesApiClient(this.http);
        this.setup = new SetupApiClient(this.http);
    }
    generateCsrfToken() {
        return this.http.generateCsrfToken();
    }
}
export { ApiError as AuthSdkError };
//# sourceMappingURL=index.js.map