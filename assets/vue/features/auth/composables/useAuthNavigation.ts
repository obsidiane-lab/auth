import type { AuthPages } from '../types';

const canNavigate = (target?: string) => typeof target === 'string' && target.trim().length > 0;

const assignLocation = (target: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.location.assign(target);
};

export const useAuthNavigation = (pages: AuthPages) => {
  const navigateTo = (target?: string) => {
    if (!canNavigate(target)) {
      return;
    }

    assignLocation(target!.trim());
  };

  const goToLogin = () => navigateTo(pages.login);
  const goToRegister = () => navigateTo(pages.register);
  const goToForgot = () => navigateTo(pages.forgot);
  const goToReset = () => navigateTo(pages.reset);

  return {
    navigateTo,
    goToLogin,
    goToRegister,
    goToForgot,
    goToReset,
  };
};
