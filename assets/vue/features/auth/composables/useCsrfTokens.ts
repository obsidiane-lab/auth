import { initializeCsrfTokens } from '../../../utils/http';
import type { CsrfTokens } from '../types';

export function useCsrfTokens(tokens?: CsrfTokens): void {
  initializeCsrfTokens(tokens);
}
