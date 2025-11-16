// Stateless CSRF: tokens sont générés côté client par le
// transport HTTP (voir assets/vue/utils/http.ts). Les props `csrf`
// ne sont plus utilisées, ce composable est maintenu pour compatibilité
// interne mais n’a plus de comportement.
export function useCsrfTokens(): void {
  // no-op
}
