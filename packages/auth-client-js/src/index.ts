import type { AuthClientConfig } from './core/httpClient';
import { InternalHttpClient } from './core/httpClient';
import { ApiError } from './core/errors';
import { AuthApiClient } from './domains/auth';
import { UsersApiClient } from './domains/users';
import { InvitesApiClient } from './domains/invites';
import { SetupApiClient } from './domains/setup';

export type {
  UserRead,
  User,
  LoginResponse,
  MeResponse,
  RegisterInput,
  RegisterResponse,
  RefreshResponse,
  PasswordForgotResponse,
  InviteStatusResponse,
  CompleteInviteResponse,
  InitialAdminInput,
  InitialAdminResponse,
  Invite,
  InviteUserRead,
  Item,
  Collection,
} from './types';

export { ApiError } from './core/errors';

export interface AuthClientOptions extends AuthClientConfig {}

export class AuthClient {
  private readonly http: InternalHttpClient;

  readonly auth: AuthApiClient;
  readonly users: UsersApiClient;
  readonly invites: InvitesApiClient;
  readonly setup: SetupApiClient;

  constructor(options: AuthClientOptions) {
    this.http = new InternalHttpClient(options);
    this.auth = new AuthApiClient(this.http);
    this.users = new UsersApiClient(this.http);
    this.invites = new InvitesApiClient(this.http);
    this.setup = new SetupApiClient(this.http);
  }

  generateCsrfToken(): string {
    return this.http.generateCsrfToken();
  }
}

export { ApiError as AuthSdkError };
