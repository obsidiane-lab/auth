export interface ApiErrorPayload {
  error?: string;
  message?: string;
  details?: Record<string, string>;
}

export const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: 'Email ou mot de passe incorrect.',
  INVALID_PAYLOAD: 'Merci de vérifier les champs saisis.',
  RATE_LIMIT: 'Trop de tentatives. Réessayez dans quelques minutes.',
  CSRF_TOKEN_INVALID: 'Votre session a expiré. Merci de réessayer.',
  EMAIL_NOT_VERIFIED: 'Votre adresse email n’est pas encore vérifiée.',
  UNKNOWN: 'Connexion impossible pour le moment. Réessayez.',
};

export const REGISTER_ERROR_MESSAGES: Record<string, string> = {
  EMAIL_ALREADY_USED: 'Cette adresse email est déjà utilisée.',
  INVALID_EMAIL: 'Adresse email invalide.',
  INVALID_PASSWORD: 'Mot de passe trop faible.',
  CSRF_TOKEN_INVALID: 'Votre session a expiré. Merci de réessayer.',
  INVALID_PAYLOAD: 'Merci de vérifier les champs saisis.',
  EMAIL_SEND_FAILED: 'Impossible d’envoyer l’email de confirmation. Réessayez.',
  INITIAL_ADMIN_REQUIRED: 'Créez d’abord l’administrateur initial.',
  INITIAL_ADMIN_ALREADY_CREATED: 'Créez d’abord l’administrateur initial.',
  UNKNOWN: 'Impossible de créer le compte pour le moment.',
};

export const PASSWORD_REQUEST_ERROR_MESSAGES: Record<string, string> = {
  EMAIL_SEND_FAILED: 'Impossible d’envoyer l’email de réinitialisation.',
  RESET_REQUEST_FAILED: 'Impossible de traiter la demande. Réessayez.',
  RATE_LIMIT: 'Trop de tentatives. Réessayez dans quelques minutes.',
  INITIAL_ADMIN_REQUIRED: 'Créez d’abord l’administrateur initial.',
  INITIAL_ADMIN_ALREADY_CREATED: 'Un administrateur existe déjà.',
  UNKNOWN: 'Impossible de traiter la demande pour le moment.',
};

export const PASSWORD_RESET_ERROR_MESSAGES: Record<string, string> = {
  INVALID_REQUEST: 'Lien de réinitialisation invalide.',
  INVALID_TOKEN: 'Le lien de réinitialisation est invalide ou expiré.',
  EMPTY_PASSWORD: 'Veuillez saisir un mot de passe.',
  INVALID_PASSWORD: 'Mot de passe trop faible.',
  EMAIL_MISSING: 'Adresse email manquante.',
  INVALID_USER: 'Ce lien ne correspond à aucun utilisateur.',
  INITIAL_ADMIN_REQUIRED: 'Créez d’abord l’administrateur initial.',
  INITIAL_ADMIN_ALREADY_CREATED: 'Un administrateur existe déjà.',
  CSRF_TOKEN_INVALID: 'Votre session a expiré. Merci de réessayer.',
  INVALID_PAYLOAD: 'Merci de vérifier les champs saisis.',
  UNKNOWN: 'Impossible de mettre à jour le mot de passe pour le moment.',
};

export const INITIAL_ADMIN_ERROR_MESSAGES: Record<string, string> = {
  EMAIL_ALREADY_USED: 'Cette adresse email est déjà utilisée.',
  INVALID_EMAIL: 'Adresse email invalide.',
  INVALID_PASSWORD: 'Mot de passe trop faible.',
  INITIAL_ADMIN_ALREADY_CREATED: 'Un administrateur existe déjà.',
  INITIAL_ADMIN_REQUIRED: 'Créez d’abord l’administrateur initial.',
  CSRF_TOKEN_INVALID: 'Votre session a expiré. Merci de réessayer.',
  INVALID_PAYLOAD: 'Merci de vérifier les champs saisis.',
  EMAIL_SEND_FAILED: 'Impossible de créer l’administrateur.',
  UNKNOWN: 'Impossible de créer l’administrateur pour le moment.',
};

export const INVITE_ERROR_MESSAGES: Record<string, string> = {
  INVALID_INVITATION: 'Invitation invalide ou expirée.',
  INVITATION_ALREADY_USED: 'Ce lien a déjà été utilisé.',
  INVITATION_EXPIRED: 'Invitation expirée.',
  INVALID_INVITATION_PAYLOAD: 'Merci de vérifier les champs saisis.',
  INVALID_PASSWORD: 'Mot de passe trop faible.',
  CSRF_TOKEN_INVALID: 'Votre session a expiré. Merci de réessayer.',
  INVALID_PAYLOAD: 'Merci de vérifier les champs saisis.',
  UNKNOWN: 'Impossible de finaliser l’invitation pour le moment.',
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
