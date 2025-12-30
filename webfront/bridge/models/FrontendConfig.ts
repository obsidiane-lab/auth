import type { Item } from '../lib/ports/resource-repository.port';

export interface FrontendConfig extends Item {
  id?: string | null;
  registrationEnabled?: boolean;
  passwordStrengthLevel?: number;
  brandingName?: string;
  frontendDefaultRedirect?: string;
  frontendRedirectAllowlist?: string[];
  themeMode?: string;
  themeColor?: string;
  themeDirection?: string;
  themeColors?: string[];
  csrfCookieName?: string;
  csrfHeaderName?: string;
  csrfCheckHeader?: boolean;
}
