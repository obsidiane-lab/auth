# Obsidiane Auth SDK for PHP

Client PHP moderne pour l'API Obsidiane Auth. Intégration Symfony avec gestion automatique des cookies (JWT access/refresh) et validation Origin/Referer.

## Features

✅ **Gestion automatique des sessions** - Cookies HttpOnly sécurisés (access token + refresh token)
✅ **Validation Origin/Referer** - Envoi de l'en-tête Origin pour les requêtes sensibles
✅ **Type-safe** - PHP 8.2+ avec types stricts et PHPDoc complet
✅ **Bundle Symfony** - Intégration native avec injection de dépendances
✅ **API Platform ready** - Support complet JSON-LD et hydra:collection
✅ **Error handling** - Exceptions typées avec codes métier
✅ **Zero config** - Fonctionne dès l'installation avec `base_url` uniquement

## Installation

### Via Composer

```bash
composer require obsidiane/auth-sdk
```

### Configuration Symfony

Si Symfony Flex n'active pas automatiquement le bundle, ajoutez-le manuellement :

**config/bundles.php**
```php
return [
    // ...
    Obsidiane\AuthBundle\ObsidianeAuthBundle::class => ['all' => true],
];
```

**config/packages/obsidiane_auth.yaml**
```yaml
obsidiane_auth:
  base_url: '%env(OBSIDIANE_AUTH_BASE_URL)%'
  # Optionnel : origine pour validation Origin/Referer
  origin: '%env(OBSIDIANE_AUTH_ORIGIN)%'
```

**.env**
```bash
OBSIDIANE_AUTH_BASE_URL=https://auth.example.com
OBSIDIANE_AUTH_ORIGIN=https://app.example.com
```

## Architecture

Le client utilise `HttpBrowser` (BrowserKit) avec `CookieJar` pour gérer automatiquement les cookies HttpOnly (`__Secure-at` pour l'access token, `__Host-rt` pour le refresh token). L'en-tête `Origin` est ajouté si configuré pour la validation Same Origin.

### Instanciation manuelle (hors Symfony)

```php
use Obsidiane\AuthBundle\AuthClient;

$client = new AuthClient(
    baseUrl: 'https://auth.example.com',
    defaultHeaders: ['X-App-Version' => '1.0'],
    timeoutMs: 10000,
    origin: 'https://app.example.com'
);
```

## Utilisation de base

### Injection dans un contrôleur

```php
use Obsidiane\AuthBundle\AuthClient;
use Symfony\Component\HttpFoundation\Response;

class AuthController
{
    public function __construct(
        private readonly AuthClient $auth
    ) {}

    public function login(): Response
    {
        $result = $this->auth->auth()->login(
            email: 'user@example.com',
            password: 'Secret123!'
        );

        // $result = [
        //   'user' => ['id' => 1, 'email' => '...', 'roles' => [...]],
        //   'exp' => 1735689600
        // ]

        return $this->json($result);
    }

    public function getConfig(): Response
    {
        $config = $this->auth->config()->get();

        // $config = [
        //   'registrationEnabled' => true,
        //   'brandingName' => 'My App',
        //   'themeMode' => 'dark',
        //   ...
        // ]

        return $this->json($config);
    }
}
```

## API Reference

Le SDK expose 5 endpoints groupés par domaine fonctionnel :

### 1. AuthEndpoint - `$client->auth()`

Authentification et gestion des utilisateurs.

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `me()` | `GET /api/auth/me` | Utilisateur authentifié |
| `login($email, $password)` | `POST /api/auth/login` | Connexion |
| `refresh()` | `POST /api/auth/refresh` | Renouvellement token |
| `logout()` | `POST /api/auth/logout` | Déconnexion |
| `register($input)` | `POST /api/auth/register` | Inscription |
| `requestPasswordReset($email)` | `POST /api/auth/password/forgot` | Demande reset password |
| `resetPassword($token, $password)` | `POST /api/auth/password/reset` | Reset password |
| `inviteUser($email)` | `POST /api/auth/invite` | Invitation (admin) |
| `completeInvite($token, $password)` | `POST /api/auth/invite/complete` | Accepter invitation |
| `invitePreview($token)` | `GET /api/auth/invite/preview` | Prévisualiser invitation |
| `verifyEmail($id, $token, $expires, $hash)` | `GET /api/auth/verify-email` | Vérifier email |

#### Exemples

```php
// Connexion
$result = $this->auth->auth()->login('user@example.com', 'Secret123!');
// ['user' => [...], 'exp' => 1735689600]

// Utilisateur courant
$user = $this->auth->auth()->me();
// ['user' => ['id' => 1, 'email' => '...', 'roles' => [...]]]

// Déconnexion
$this->auth->auth()->logout();

// Inscription
$result = $this->auth->auth()->register([
    'email' => 'newuser@example.com',
    'password' => 'Secret123!'
]);

// Reset password - demande
$this->auth->auth()->requestPasswordReset('user@example.com');

// Reset password - confirmation
$this->auth->auth()->resetPassword('reset-token', 'NewPassword123!');

// Invitation (admin uniquement)
$result = $this->auth->auth()->inviteUser('invite@example.com');

// Accepter invitation
$result = $this->auth->auth()->completeInvite('invite-token', 'Password123!');

// Prévisualiser invitation
$preview = $this->auth->auth()->invitePreview('invite-token');
// ['email' => '...', 'accepted' => false, 'expired' => false]

// Vérifier email
$status = $this->auth->auth()->verifyEmail(12, 'token', 1731520000, 'hash');
// ['status' => 'OK']

// Rafraîchir session
$result = $this->auth->auth()->refresh();
// ['exp' => 1735689600]
```

### 2. FrontendConfigEndpoint - `$client->config()`

Configuration publique de l'application.

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `get()` | `GET /api/config` | Configuration frontend |

#### Exemple

```php
$config = $this->auth->config()->get();

// [
//   'registrationEnabled' => true,
//   'passwordStrengthLevel' => 3,
//   'brandingName' => 'My App',
//   'themeMode' => 'dark',
//   'themeColor' => 'base',
//   'themeMode' => 'dark',
//   ...
// ]
```

### 3. UsersEndpoint - `$client->users()`

Gestion des utilisateurs (API Platform).

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `list()` | `GET /api/users` | Liste des utilisateurs |
| `get($id)` | `GET /api/users/{id}` | Détail utilisateur |
| `updateRoles($id, $roles)` | `POST /api/users/{id}/roles` | Modifier rôles (admin) |
| `delete($id)` | `DELETE /api/users/{id}` | Supprimer utilisateur |

#### Exemples

```php
// Liste (JSON-LD collection)
$users = $this->auth->users()->list();
// ['@context' => '...', 'member' => [...], 'totalItems' => 10]

// Détail (JSON-LD item)
$user = $this->auth->users()->get(1);
// ['@id' => '/api/users/1', 'id' => 1, 'email' => '...', 'roles' => [...]]

// Modifier rôles (admin)
$updated = $this->auth->users()->updateRoles(1, ['ROLE_ADMIN']);

// Supprimer
$this->auth->users()->delete(1);
```

### 4. InvitesEndpoint - `$client->invites()`

Gestion des invitations (API Platform).

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `list()` | `GET /api/invite_users` | Liste des invitations |
| `get($id)` | `GET /api/invite_users/{id}` | Détail invitation |

#### Exemples

```php
// Liste (JSON-LD collection)
$invites = $this->auth->invites()->list();

// Détail (JSON-LD item)
$invite = $this->auth->invites()->get(1);
// ['@id' => '...', 'email' => '...', 'createdAt' => '...', 'expiresAt' => '...']
```

### 5. SetupEndpoint - `$client->setup()`

Initialisation de l'application.

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `createInitialAdmin($input)` | `POST /api/setup/admin` | Créer administrateur initial |

#### Exemple

```php
$admin = $this->auth->setup()->createInitialAdmin([
    'email' => 'admin@example.com',
    'password' => 'AdminSecret123!'
]);

// ['user' => ['id' => 1, 'email' => 'admin@example.com', 'roles' => ['ROLE_ADMIN']]]
```

## Gestion des erreurs

Toutes les erreurs HTTP lèvent une `ApiErrorException` contenant :

```php
use Obsidiane\AuthBundle\Exception\ApiErrorException;

try {
    $this->auth->auth()->login('user@example.com', 'wrong-password');
} catch (ApiErrorException $e) {
    $statusCode = $e->getStatusCode();    // 401
    $errorCode = $e->getErrorCode();      // 'INVALID_CREDENTIALS'
    $details = $e->getDetails();          // ['field' => 'password', ...]

    if ($errorCode === 'INVALID_CREDENTIALS') {
        // Gérer l'erreur de connexion
    }
}
```

### Codes d'erreur courants

| Code | Description |
|------|-------------|
| `INVALID_CREDENTIALS` | Email ou mot de passe incorrect |
| `EMAIL_ALREADY_USED` | Email déjà utilisé |
| `WEAK_PASSWORD` | Mot de passe trop faible |
| `INVALID_TOKEN` | Token invalide ou expiré |
| `USER_NOT_FOUND` | Utilisateur introuvable |
| `ORIGIN_NOT_ALLOWED` | Origine non autorisée |

## Modèles & JSON-LD

Le SDK fournit des wrappers pour manipuler les réponses JSON-LD d'API Platform :

```php
use Obsidiane\AuthBundle\Model\Collection;
use Obsidiane\AuthBundle\Model\Item;

// Collection JSON-LD
$usersData = $this->auth->users()->list();
$collection = Collection::fromArray($usersData);

echo $collection->totalItems();  // 10
$members = $collection->all();   // Item[]

// Item JSON-LD
$first = $members[0] ?? null;
if ($first !== null) {
    $id = $first->id();           // "/api/users/1"
    $type = $first->type();       // "User"
    $data = $first->data();       // ['email' => '...', 'roles' => [...]]
}
```

## Tests

Le SDK est conçu pour être facilement mockable dans vos tests :

```php
use Obsidiane\AuthBundle\AuthClient;
use PHPUnit\Framework\TestCase;

class MyServiceTest extends TestCase
{
    public function testLogin(): void
    {
        $authClient = $this->createMock(AuthClient::class);
        $authClient->method('auth')->willReturn(
            $this->createConfiguredMock(AuthEndpoint::class, [
                'login' => ['user' => ['id' => 1], 'exp' => 1735689600]
            ])
        );

        $service = new MyService($authClient);
        $result = $service->performLogin('user@example.com', 'password');

        $this->assertSame(1, $result['user']['id']);
    }
}
```

## Changelog

### Latest (unreleased)

- ✅ Ajout `FrontendConfigEndpoint` avec `get()` - GET /api/config
- ✅ Ajout `AuthEndpoint::invitePreview()` - GET /api/auth/invite/preview
- ✅ Ajout `AuthEndpoint::verifyEmail()` - GET /api/auth/verify-email
- ✅ Ajout `UsersEndpoint::delete()` - DELETE /api/users/{id}
- ✅ Amélioration gestion query parameters
- ✅ Documentation complète de tous les endpoints

### v0.x

- ✅ Support complet de l'API Obsidiane Auth
- ✅ Gestion automatique cookies + Origin/Referer
- ✅ Intégration Symfony Bundle
- ✅ Support API Platform (JSON-LD)

## Requirements

- PHP 8.2+
- Symfony 6.4+ ou 7.0+
- Extensions : `ext-json`, `ext-random`

## License

Propriétaire - Obsidiane

## Support

Pour signaler un bug ou demander une fonctionnalité, ouvrez une issue sur le dépôt principal du projet Obsidiane Auth.
