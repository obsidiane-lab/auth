import type { Item } from '../lib/ports/resource-repository.port';

export interface FrontendConfig extends Item {
  id?: string | null;
  registrationEnabled?: boolean;
  passwordStrengthLevel?: number;
  brandingName?: string;
  frontendRedirectUrl?: string;
  environment?: string;
  themeMode?: string;
  themeColor?: string;
}
