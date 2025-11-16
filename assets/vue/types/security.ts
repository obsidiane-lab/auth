export interface CsrfTokens {
  authenticate?: string;
  register?: string;
  password_request?: string;
  password_reset?: string;
  refresh?: string;
  logout?: string;
  initial_admin?: string;
   invite_user?: string;
   invite_complete?: string;
  [key: string]: string | undefined;
}

export type CsrfTokenId = keyof CsrfTokens;
