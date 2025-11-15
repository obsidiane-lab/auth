# Configuration & Déploiement

Ce document résume les variables d'environnement clés à exposer lorsque le module est empaqueté dans un container (Docker, K8s, Nomad, etc.). Toutes les variables disposent d'une valeur par défaut compatible développement ; vous n'avez donc qu'à surcharger celles qui diffèrent dans votre environnement cible.

---

## 1. Fichier `.env` / Docker

- Le fichier racine `.env` contient les valeurs de référence pour le développement local.
- `docker compose` supporte automatiquement un fichier `.env` (à la racine) : définissez-y uniquement les overrides souhaités (`UI_ENABLED=0` pour une version API only, etc.).
- Le service `php` du `compose.yaml` utilise la forme `${VARIABLE:-valeur_par_defaut}` : si aucune variable n'est fournie, la valeur par défaut est appliquée. Cela facilite l'usage dans des environnements variés où seules quelques variables doivent être injectées.

> Astuce : créez un fichier `docker/.env.local` (non versionné) pour les overrides locaux, puis exportez-le via `export $(grep -v '^#' docker/.env.local | xargs)` avant d'exécuter `docker compose up`.

---

## 2. Feature flags & UI

| Variable | Type | Défaut | Effet |
| --- | --- | --- | --- |
| `UI_ENABLED` | bool | `1` | Active l’interface Twig/Vue (`/login`, `/register`, `/reset-password`). |
| `REGISTRATION_ENABLED` | bool | `1` | Autorise l’inscription via UI/API. |
| `UI_THEME_COLOR` | string | `red` | Couleur Tailwind par défaut (`emerald`, `indigo`, etc.). |
| `UI_THEME_MODE` | string | `dark` | Définit le mode (light ou dark) appliqué à l’interface. Piloté par l’environnement uniquement (aucun changement côté utilisateur, pas de persistance locale). |
| `BRANDING_NAME` | string | `Obsidiane Auth` | Libellé principal affiché dans les titres, les emails et comme expéditeur. |
| `NOTIFUSE_TEMPLATE_WELCOME` | string | `welcome` | Template Notifuse utilisé à l’inscription. Le contexte inclut `activate_link`, `verify_link` et `verify_link_ttl_minutes`. |

Fonctionnement :
- Les booléens acceptent `0/1`, `true/false`, `yes/no`.
- L’API reste active quelles que soient ces valeurs. Seule l’inscription peut être désactivée.
- Lorsque l’UI est coupée (`UI_ENABLED=0`), seules les routes API sont disponibles.

> **Première exécution** : tant qu’aucun utilisateur n’existe en base, l’application expose `/setup` (et `POST /api/setup/admin`) pour créer l’administrateur initial. Les pages `/login`, `/register` et `/reset-password` redirigent automatiquement vers cette interface dédiée jusqu’à ce que ce compte soit créé.

---

## 3. Exemple d'override (.env)

```env
# .env.ci
APP_ENV=prod
APP_SECRET=${CI_APP_SECRET}
DATABASE_URL=mysql://user:pass@db-internal:3306/auth
JWT_SECRET=${CI_JWT_SECRET}

# Auth module
UI_THEME_COLOR=emerald
UI_ENABLED=0
REGISTRATION_ENABLED=0
FRONTEND_DEFAULT_REDIRECT=https://app.example.com/dashboard
FRONTEND_REDIRECT_ALLOWLIST=https://app.example.com/,https://partners.example.com/
```

Exemple d'utilisation avec `docker compose` :

```bash
export $(grep -v '^#' .env.ci | xargs)
docker compose pull
docker compose up -d
```

---

## 4. Configuration avancée

- **Tuning tokens & cookies** : `JWT_ACCESS_TTL` et les variables `ACCESS_COOKIE_*` pilotent le cookie `__Secure-at`. Le cookie refresh `__Host-rt` est désormais configuré directement dans `config/packages/gesdinet_jwt_refresh_token.yaml` (`token_parameter_name`, bloc `cookie.*`).
- **Rate limiting** : variables séparées par limite et intervalle, ex. `RATE_LOGIN_LIMIT=5` et `RATE_LOGIN_INTERVAL="60 seconds"` (idem pour `RATE_FORGOT_*`).
 - **Redirections** : `FRONTEND_REDIRECT_ALLOWLIST` accepte une liste séparée par virgules. Pour un usage purement API, positionnez `UI_ENABLED=0`.
  - La valeur attend désormais des origines (schéma + host [+ port]) et non des URLs précises. Exemple: `https://app.example.com,https://partners.example.com:8443`. Tous les chemins sous ces origines sont autorisés.
- **CORS** : `ALLOWED_ORIGINS` attend une seule expression régulière (ex: `^https?://(app\\.example\\.com|localhost)(:[0-9]+)?$`). Fournissez une regex englobant toutes vos origines autorisées. Dans Docker, échappez bien les backslashes. `allow_credentials: true` est activé et l’en-tête `X-CSRF-TOKEN` est autorisé côté CORS.

---

## 5. Check-list container

1. Dupliquez `.env` -> `.env.production` (ou utilisez un gestionnaire de secrets) avec vos valeurs.
2. Vérifiez les URLs publiques (issuer, default redirect).
3. Configurez l’instance Notifuse : définissez les variables `NOTIFUSE_API_BASE_URL`, `NOTIFUSE_NOTIFICATION_CENTER_URL`, `NOTIFUSE_WORKSPACE_ID`, `NOTIFUSE_API_KEY` ainsi que les templates (`NOTIFUSE_TEMPLATE_WELCOME` et `NOTIFUSE_TEMPLATE_RESET_PASSWORD`).
4. Ajustez `UI_ENABLED` et `REGISTRATION_ENABLED` selon les besoins (ex : `UI_ENABLED=0` pour un mode API only).
5. Relancez `docker compose up -d --build` pour appliquer les changements.

Bonne configuration !

## 6. Emails transactionnels (Notifuse)

- Les emails de bienvenue et de réinitialisation sont envoyés via `/api/transactional.send` : seules les données dynamiques sont transmises depuis l’application, tout le rendu (sujet, corps, CTA, traductions) doit être défini directement dans les templates Notifuse attachés aux identifiants `NOTIFUSE_TEMPLATE_WELCOME` et `NOTIFUSE_TEMPLATE_RESET_PASSWORD`.
- Les placeholders disponibles dans la charge utile sont `user_name`, `user_email`, `login_url` (pour l’email de bienvenue), `reset_url`, `reset_token`, `ttl_minutes`, `locale` et `brand_name` (ajouté automatiquement). Vous pouvez en ajouter d’autres côté Notifuse si nécessaire ; l’application ne fournit que les champs essentiels au lien de connexion/réinitialisation.
- Si l’instance Notifuse est gérée par un service tiers, vérifiez l’URL (`NOTIFUSE_API_BASE_URL`), la clé d’API (`NOTIFUSE_API_KEY`) et l’ID du workspace (`NOTIFUSE_WORKSPACE_ID`). En développement, le fichier `.env` fournit des valeurs locales, et `docker compose` injecte les mêmes paramètres par défaut.
