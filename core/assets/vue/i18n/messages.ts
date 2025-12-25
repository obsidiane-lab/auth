const wordingName = process.env.BRANDING_NAME ?? 'Obsidiane Auth';

export const messages = {
  fr: {
    layout: {
      default_title: wordingName,
    },
    common: {
      error: {
        session_expired: 'Session expirée, merci de réessayer.',
        unexpected: 'Un problème est survenu. Merci de réessayer.',
        csrf_token_invalid: 'Jeton CSRF invalide. Merci de réessayer.',
        invalid_payload: 'Requête invalide.',
        invalid_csrf_token_id: 'Identifiant CSRF invalide.',
        initial_admin_required: 'Créez d’abord l’administrateur initial.',
      },
    },
    auth: {
      hero: {
        title: '"Rapide, efficace et productif"',
        description:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis <span class="cursor-pointer font-medium text-yellow-400">nostrud</span> exercitation ullamco laboris nisi ut aliquip ex ea commodo <span class="cursor-pointer font-medium text-yellow-400">consequat.</span> Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
        image_alt: 'Aperçu des tableaux de bord',
        logo_alt: 'Logo Obsidiane',
      },
      tabs: {
        login: 'Connexion',
        register: 'Inscription',
        forgot: 'Mot de passe oublié',
        reset: 'Réinitialiser',
      },
      form: {
        toggle_password: 'Afficher ou masquer le mot de passe',
      },
      login: {
        form: {
          title: 'Connexion',
          subtitle: 'Identifiez-vous avec votre adresse.',
          separator: 'ou',
          email: {
            label: 'Adresse email',
            placeholder: 'prenom.nom@entreprise.com',
          },
          password: {
            label: 'Mot de passe',
            placeholder: 'Votre mot de passe sécurisé',
          },
          submit: 'Se connecter',
        },
        social: {
          google: 'Se connecter avec Google',
        },
        view: {
          heading: 'Ravi de vous revoir',
          heading_suffix: '!',
          subtitle: 'Entrez vos identifiants pour accéder à votre compte.',
          separator: 'ou',
          forgot: 'Mot de passe oublié ?',
          not_member: 'Pas encore membre ?',
          sign_up: 'Inscrivez-vous',
        },
        error: {
          credentials_required: 'Identifiants requis.',
          api: {
            INVALID_CREDENTIALS: 'Identifiants invalides.',
            INVALID_PAYLOAD: 'Requête invalide.',
            RATE_LIMIT: 'Trop de tentatives. Réessayez plus tard.',
            UNKNOWN: 'Impossible de vous connecter pour le moment.',
            EMAIL_NOT_VERIFIED: 'Votre adresse email doit être confirmée. Consultez vos emails pour finaliser votre inscription.',
          },
        },
        message: {
          success: 'Authentification réussie. Redirection en cours...',
          redirecting: 'Redirection...',
          verified: 'Adresse email confirmée. Vous pouvez maintenant vous connecter.',
          verify_error: 'Le lien de confirmation est invalide ou expiré.',
        },
      },
      register: {
        form: {
          title: 'Créer un compte',
          subtitle: 'Complétez les informations ci-dessous pour démarrer.',
          email: {
            label: 'Adresse email',
            placeholder: 'prenom.nom@entreprise.com',
          },
          password: {
            label: 'Mot de passe',
            placeholder: 'Mot de passe sécurisé',
          },
          submit: 'Créer mon compte',
          already_registered: 'Déjà inscrit ? <a href="%loginUrl%">Connectez-vous</a>',
        },
        view: {
          heading: 'Inscription',
          heading_suffix: '!',
          subtitle: 'Créez votre compte pour aller plus loin',
          password_hint:
            'Choisissez un mot de passe robuste mélangeant lettres, chiffres et symboles.',
          confirm_password: 'Confirmez le mot de passe',
          already: 'Déjà un compte ?',
          sign_in: 'Se connecter',
        },
        message: {
          success: 'Inscription réussie ! Vérifiez vos emails pour confirmer votre adresse avant de vous connecter.',
        },
      },
      verify: {
        success: 'Adresse email confirmée. Vous pouvez maintenant vous connecter.',
        error: 'Le lien de confirmation est invalide ou expiré.',
      },
      invite: {
        view: {
          heading: 'Complétez votre',
          heading_suffix: ' compte',
          subtitle: 'Définissez votre profil et votre mot de passe pour activer votre accès.',
          email_label: 'Adresse email invitée',
          password_label: 'Mot de passe',
          confirm_password_label: 'Confirmez le mot de passe',
          submit: 'Activer mon compte',
          already_completed:
            'Ce lien a déjà été utilisé et votre compte est activé. Vous pouvez vous connecter avec vos identifiants.',
          back_to_login: 'Retour à la connexion',
        },
      },
    },
    register: {
      error: {
        invalid_email: 'Adresse email invalide.',
        email_exists: 'Cette adresse email est déjà utilisée.',
        invalid_password: 'Mot de passe invalide.',
        generic: 'Impossible de créer le compte. Vérifiez les informations saisies.',
        initial_admin_required: 'Créez d’abord l’administrateur initial.',
      },
    },
    password: {
      request: {
        form: {
          email: {
            label: 'Adresse email',
            placeholder: 'prenom.nom@entreprise.com',
          },
          submit: 'Recevoir le lien de réinitialisation',
          back_to_login: 'Retour à la connexion',
        },
        error: {
          too_many_attempts: 'Trop de tentatives. Réessayez plus tard.',
          email_required: 'Veuillez saisir une adresse email valide.',
          email_send_failed: 'Impossible d’envoyer l’email pour le moment. Merci de réessayer plus tard.',
          generic: 'Impossible de traiter la demande pour le moment.',
          initial_admin_required: 'Créez d’abord l’administrateur initial.',
        },
        message: {
          success: 'Si un compte existe, un email de réinitialisation vient d’être envoyé.',
        },
      },
      forgot: {
        view: {
          heading: 'Mot de passe oublié',
          heading_suffix: '?',
          subtitle: 'Saisissez votre adresse email pour réinitialiser votre mot de passe.',
          submit: 'Envoyer',
          cancel: 'Annuler',
        },
      },
      reset: {
        hero: {
          title: 'Définissez un nouveau mot de passe',
          subtitle: 'Gardez votre compte en sécurité avec un mot de passe robuste d’au moins huit caractères.',
        },
        form: {
          password: {
            label: 'Nouveau mot de passe',
            placeholder: 'Mot de passe sécurisé',
          },
          confirm: {
            label: 'Confirmer le mot de passe',
            placeholder: 'Répétez votre mot de passe',
          },
          submit: 'Mettre à jour le mot de passe',
          back_to_login: 'Retour à la connexion',
        },
        error: {
          mismatch: 'Les mots de passe ne correspondent pas.',
          api: {
            INVALID_REQUEST: 'Requête invalide.',
            INVALID_TOKEN: 'Le lien de réinitialisation est invalide ou expiré.',
            EMPTY_PASSWORD: 'Veuillez fournir un mot de passe valide.',
            UNKNOWN: 'Impossible de réinitialiser le mot de passe pour le moment.',
          },
          token_missing: 'Lien de réinitialisation manquant. Veuillez relancer la procédure.',
        },
        message: {
          success: 'Mot de passe mis à jour. Vous pouvez maintenant vous connecter.',
        },
      },
    },
    setup: {
      initial_admin: {
        badge: 'Initialisation',
        title: 'Créer le premier administrateur',
        subtitle: 'Aucun compte n’est encore présent. Créez l’administrateur initial de <strong>{brand}</strong>.',
        form: {
          email: 'Adresse email',
          password: 'Mot de passe',
          confirm_password: 'Confirmez le mot de passe',
          submit: 'Créer l’administrateur',
          password_hint: 'Choisissez un mot de passe robuste mélangeant lettres, chiffres et symboles.',
        },
        error: {
          email: 'Adresse email invalide.',
          password: 'Mot de passe trop faible.',
          confirm_password: 'Les mots de passe ne correspondent pas.',
          required: 'Créez d’abord l’administrateur initial.',
        },
        message: {
          success: 'Administrateur créé. Vous pouvez maintenant vous connecter.',
          error: 'Impossible de créer l’administrateur. Vérifiez les informations saisies.',
        },
      },
    },
  },
} as const;
