export interface FrontendConfig {
  registrationEnabled: boolean;
  passwordStrengthLevel: number;
  brandingName: string;
  frontendDefaultRedirect: string;
  frontendRedirectAllowlist: string[];
  themeMode: string;
  themeColor: string;
  themeDirection: string;
  themeColors: string[];
}
