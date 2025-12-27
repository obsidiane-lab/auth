export interface ApiErrorPayload {
  error?: string;
  message?: string;
  details?: Record<string, string>;
}

export const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: 'Identifiants invalides.',
  INVALID_PAYLOAD: 'Requête invalide.',
  RATE_LIMIT: 'Trop de tentatives. Réessayez plus tard.',
  CSRF_TOKEN_INVALID: 'Jeton CSRF invalide. Merci de réessayer.',
  EMAIL_NOT_VERIFIED: 'Votre adresse email doit être confirmée.',
  UNKNOWN: 'Impossible de vous connecter pour le moment.',
};

export const REGISTER_ERROR_MESSAGES: Record<string, string> = {
  EMAIL_ALREADY_USED: 'Cette adresse email est déjà utilisée.',
  INVALID_EMAIL: 'Adresse email invalide.',
  INVALID_PASSWORD: 'Mot de passe invalide.',
  CSRF_TOKEN_INVALID: 'Jeton CSRF invalide. Merci de réessayer.',
  INVALID_PAYLOAD: 'Requête invalide.',
  EMAIL_SEND_FAILED: 'Impossible d’envoyer l’email pour le moment.',
  INITIAL_ADMIN_REQUIRED: 'Créez d’abord l’administrateur initial.',
  INITIAL_ADMIN_ALREADY_CREATED: 'Créez d’abord l’administrateur initial.',
  UNKNOWN: 'Impossible de créer le compte. Vérifiez les informations saisies.',
};

export const PASSWORD_REQUEST_ERROR_MESSAGES: Record<string, string> = {
  EMAIL_SEND_FAILED: 'Impossible d’envoyer l’email pour le moment.',
  RESET_REQUEST_FAILED: 'Impossible de traiter la demande pour le moment.',
  RATE_LIMIT: 'Trop de tentatives. Réessayez plus tard.',
  INITIAL_ADMIN_REQUIRED: 'Créez d’abord l’administrateur initial.',
  INITIAL_ADMIN_ALREADY_CREATED: 'Créez d’abord l’administrateur initial.',
  UNKNOWN: 'Impossible de traiter la demande pour le moment.',
};

export const PASSWORD_RESET_ERROR_MESSAGES: Record<string, string> = {
  INVALID_REQUEST: 'Requête invalide.',
  INVALID_TOKEN: 'Le lien de réinitialisation est invalide ou expiré.',
  EMPTY_PASSWORD: 'Veuillez fournir un mot de passe valide.',
  INVALID_PASSWORD: 'Mot de passe invalide.',
  EMAIL_MISSING: 'Adresse email manquante.',
  INVALID_USER: 'Le jeton ne correspond à aucun utilisateur connu.',
  INITIAL_ADMIN_REQUIRED: 'Créez d’abord l’administrateur initial.',
  INITIAL_ADMIN_ALREADY_CREATED: 'Créez d’abord l’administrateur initial.',
  CSRF_TOKEN_INVALID: 'Jeton CSRF invalide. Merci de réessayer.',
  INVALID_PAYLOAD: 'Requête invalide.',
  UNKNOWN: 'Impossible de réinitialiser le mot de passe pour le moment.',
};

export const INITIAL_ADMIN_ERROR_MESSAGES: Record<string, string> = {
  EMAIL_ALREADY_USED: 'Adresse email invalide.',
  INVALID_EMAIL: 'Adresse email invalide.',
  INVALID_PASSWORD: 'Mot de passe trop faible.',
  INITIAL_ADMIN_ALREADY_CREATED: 'Créez d’abord l’administrateur initial.',
  INITIAL_ADMIN_REQUIRED: 'Créez d’abord l’administrateur initial.',
  CSRF_TOKEN_INVALID: 'Jeton CSRF invalide. Merci de réessayer.',
  INVALID_PAYLOAD: 'Requête invalide.',
  EMAIL_SEND_FAILED: 'Impossible de créer l’administrateur.',
  UNKNOWN: 'Impossible de créer l’administrateur.',
};

export const INVITE_ERROR_MESSAGES: Record<string, string> = {
  INVALID_INVITATION: 'Invitation invalide ou expirée.',
  INVITATION_ALREADY_USED: 'Invitation déjà utilisée.',
  INVITATION_EXPIRED: 'Invitation expirée.',
  INVALID_INVITATION_PAYLOAD: 'Données d’invitation invalides.',
  INVALID_PASSWORD: 'Mot de passe invalide.',
  CSRF_TOKEN_INVALID: 'Jeton CSRF invalide. Merci de réessayer.',
  INVALID_PAYLOAD: 'Requête invalide.',
  UNKNOWN: 'Impossible de finaliser l’invitation.',
};

export function resolveApiErrorMessage(payload: ApiErrorPayload | null, messages: Record<string, string>): string | null {
  const code = payload?.error;
  if (code && messages[code]) {
    return messages[code];
  }

  if (payload?.message) {
    return payload.message;
  }

  return null;
}

export function applyFieldErrors(
  payload: ApiErrorPayload | null,
  messages: Record<string, string>,
  fieldMap: Record<string, string>,
  setFieldError: (field: string, message: string) => void,
  defaultField?: string,
): boolean {
  if (!payload?.details) {
    return false;
  }

  let applied = false;

  Object.entries(payload.details).forEach(([field, code]) => {
    if (!code) {
      return;
    }

    const targetField = fieldMap[field] ?? defaultField ?? field;
    const message = messages[code] ?? messages['UNKNOWN'] ?? code;
    setFieldError(targetField, message);
    applied = true;
  });

  return applied;
}
