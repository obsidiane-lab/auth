import { onMounted, ref } from 'vue';
import { http, jsonConfig } from '../../../utils/http';

interface ExistingSessionOptions {
  redirectTarget?: string;
}

export const useExistingSession = (options: ExistingSessionOptions = {}) => {
  const alreadyAuthenticated = ref(false);
  const checkingSession = ref(false);
  const logoutLoading = ref(false);

  const checkSession = async () => {
    checkingSession.value = true;

    try {
      const response = await http.get('/api/auth/me');
      alreadyAuthenticated.value = response.status === 200;
    } catch {
      alreadyAuthenticated.value = false;
    } finally {
      checkingSession.value = false;
    }
  };

  const goToService = () => {
    if (!alreadyAuthenticated.value) {
      return;
    }

    const target = options.redirectTarget;

    if (typeof window === 'undefined' || !target || target.trim() === '') {
      return;
    }

    window.location.assign(target.trim());
  };

  const logout = async () => {
    if (logoutLoading.value) {
      return;
    }

    logoutLoading.value = true;

    try {
      await http.post('/api/auth/logout', undefined, jsonConfig(true));
    } catch {
      // Even si l'appel échoue, on force un rechargement pour invalider le contexte local.
    } finally {
      logoutLoading.value = false;

      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }
  };

  onMounted(() => {
    void checkSession();
  });

  return {
    alreadyAuthenticated,
    checkingSession,
    logoutLoading,
    goToService,
    logout,
  };
};
