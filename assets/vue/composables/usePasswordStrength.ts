import { computed, type Ref } from 'vue';
import type { PasswordPolicyConfig } from '../types/password';
import {
  estimatePasswordStrength,
  meetsPasswordPolicy,
  sanitizePasswordPolicy,
} from '../utils/passwordStrength';

export const usePasswordStrength = (password: Ref<string>, policy?: PasswordPolicyConfig | null) => {
  const sanitizedPolicy = sanitizePasswordPolicy(policy);

  const passwordStrength = computed(() => estimatePasswordStrength(password.value ?? ''));
  const meetsPolicy = computed(() => meetsPasswordPolicy(password.value ?? '', sanitizedPolicy));

  return {
    passwordStrength,
    meetsPolicy,
    requiredScore: sanitizedPolicy.minScore,
  };
};
