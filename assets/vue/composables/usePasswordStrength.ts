import { computed, type Ref } from 'vue';

export const usePasswordStrength = (password: Ref<string>) => {
  const passwordStrength = computed(() => {
    const value = password.value ?? '';
    let strength = 0;

    if (value.length >= 8) {
      strength += 1;
    }

    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) {
      strength += 1;
    }

    if (/[0-9]/.test(value)) {
      strength += 1;
    }

    if (/[^a-zA-Z0-9]/.test(value)) {
      strength += 1;
    }

    return strength;
  });

  return {
    passwordStrength,
  };
};
