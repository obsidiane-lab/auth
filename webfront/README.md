# Obsidiane Auth - Webfront (Angular)

Frontend Angular pour Obsidiane Auth, construit avec Angular 21, Tailwind CSS 4, et des patterns modernes (standalone components, signals, inject()).

## Table des matières

- [Stack technique](#stack-technique)
- [Architecture](#architecture)
- [Développement](#développement)
- [Standards de code](#standards-de-code)
- [Bridge Meridiane](#bridge-meridiane)
- [Thèmes et personnalisation](#thèmes-et-personnalisation)
- [Composants principaux](#composants-principaux)

## Stack technique

- **Angular 21** : Framework principal
- **Tailwind CSS 4** : Framework CSS utility-first
- **TypeScript 5.9** : Langage avec mode strict
- **RxJS 7** : Programmation réactive
- **Angular SVG Icon** : Gestion des icônes SVG
- **ngx-sonner** : Notifications toast
- **ngx-translate** : Internationalisation (français uniquement)

### Dépendances de développement

- **ESLint** : Linter avec règles Angular strictes
- **Prettier** : Formatage du code
- **Playwright** : Tests end-to-end
- **Angular DevTools** : Debugging

## Architecture

### Structure du projet

```
webfront/
├── src/
│   ├── app/
│   │   ├── core/                    # Services, guards, interceptors
│   │   │   ├── forms/              # Types de formulaires réutilisables
│   │   │   ├── guards/             # Route guards
│   │   │   ├── interceptors/       # HTTP interceptors
│   │   │   ├── models/             # Modèles TypeScript
│   │   │   ├── repositories/       # Couche d'accès aux données
│   │   │   ├── services/           # Services métier
│   │   │   ├── stores/             # Stores de state management
│   │   │   └── utils/              # Utilitaires
│   │   │
│   │   ├── modules/                 # Modules fonctionnels
│   │   │   ├── auth/               # Module d'authentification
│   │   │   │   ├── components/     # Composants partagés du module
│   │   │   │   ├── forms/          # Définitions de formulaires
│   │   │   │   ├── pages/          # Pages du module
│   │   │   │   └── utils/          # Utilitaires du module
│   │   │   └── error/              # Pages d'erreur (404, 500)
│   │   │
│   │   ├── shared/                  # Composants partagés globaux
│   │   │   ├── components/         # Composants réutilisables
│   │   │   └── utils/              # Utilitaires partagés
│   │   │
│   │   ├── app.component.ts        # Composant racine
│   │   ├── app.config.ts           # Configuration de l'application
│   │   └── app.routes.ts           # Définition des routes
│   │
│   ├── assets/                      # Assets statiques
│   │   ├── i18n/                   # Fichiers de traduction
│   │   └── icons/                  # Icônes SVG
│   │
│   ├── environments/                # Variables d'environnement
│   ├── styles.css                  # Styles globaux
│   └── main.ts                     # Point d'entrée
│
├── bridge/                          # Bridge Meridiane (généré)
├── .eslintrc.json                  # Configuration ESLint
├── angular.json                    # Configuration Angular
├── tailwind.config.js              # Configuration Tailwind
└── tsconfig.json                   # Configuration TypeScript
```

### Patterns architecturaux

#### 1. Repositories Pattern

Les repositories encapsulent les appels API et retournent des Observables :

```typescript
@Injectable({ providedIn: 'root' })
export class AuthRepository {
  private readonly bridge = inject(BridgeFacade);
  private readonly store = inject(AuthStore);

  readonly user = this.store.user;

  login$(email: string, password: string): Observable<{ user: User }> {
    return this.bridge
      .post$<{ user: User }, { email: string; password: string }>('/auth/login', { email, password })
      .pipe(tap(({ user }) => this.store.setUser(user)));
  }
}
```

#### 2. Stores Pattern

Les stores gèrent l'état applicatif avec des signals :

```typescript
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly userSignal = signal<User | null>(null);

  readonly user = this.userSignal.asReadonly();

  setUser(user: User | null): void {
    this.userSignal.set(user);
  }
}
```

#### 3. Services Pattern

Les services orchestrent la logique métier :

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authRepository = inject(AuthRepository);

  readonly user = this.authRepository.user;
  readonly checkingSession = signal(false);

  async login(email: string, password: string): Promise<User> {
    const { user } = await firstValueFrom(this.authRepository.login$(email, password));
    return user;
  }
}
```

## Développement

### Installation

```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm start

# L'application sera accessible sur http://localhost:4200
```

### Commandes disponibles

| Commande | Description |
|----------|-------------|
| `npm start` | Démarre le serveur de développement |
| `npm run build` | Build de production |
| `npm run lint` | Vérifie le code avec ESLint |
| `npm run lint:fix` | Corrige automatiquement les erreurs ESLint |
| `npm run prettier` | Formate le code avec Prettier |
| `npm run prettier:verify` | Vérifie le formatage |
| `npm run test:e2e` | Lance les tests end-to-end avec Playwright |

### Variables d'environnement

Le frontend consomme sa configuration depuis l'API (`/api/config`) au runtime. Aucune variable d'environnement n'est nécessaire côté client.

## Standards de code

### Modern Angular (v21+)

Le projet utilise exclusivement les patterns modernes d'Angular :

#### ✅ Standalone Components

```typescript
@Component({
  selector: 'app-example',
  standalone: true,  // Toujours standalone
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './example.component.html',
})
export class ExampleComponent {
  // ...
}
```

#### ✅ inject() Function

```typescript
export class MyComponent {
  // ✅ Bon - utiliser inject()
  private readonly service = inject(MyService);
  private readonly route = inject(ActivatedRoute);

  // ❌ Mauvais - éviter constructor injection
  // constructor(private service: MyService) {}
}
```

#### ✅ Signals

```typescript
export class MyComponent {
  // State avec signals
  readonly count = signal(0);
  readonly items = signal<Item[]>([]);

  // Computed values
  readonly total = computed(() =>
    this.items().reduce((sum, item) => sum + item.value, 0)
  );

  increment(): void {
    this.count.update(c => c + 1);
  }
}
```

#### ✅ Control Flow Syntax

```typescript
// ✅ Bon - nouveau control flow
@if (isLoading()) {
  <p>Loading...</p>
} @else if (error()) {
  <p>Error: {{ error() }}</p>
} @else {
  <p>{{ data() }}</p>
}

@for (item of items(); track item.id) {
  <div>{{ item.name }}</div>
} @empty {
  <p>No items</p>
}

// ❌ Mauvais - anciennes directives
<div *ngIf="isLoading">Loading...</div>
<div *ngFor="let item of items">{{ item }}</div>
```

### TypeScript Strict Mode

Le projet utilise TypeScript en mode strict :

```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "strictFunctionTypes": true,
  "strictBindCallApply": true,
  "strictPropertyInitialization": true,
  "noImplicitThis": true,
  "alwaysStrict": true
}
```

**Règles à suivre :**

- ✅ Typer tous les paramètres et retours de fonction
- ✅ Utiliser `unknown` au lieu de `any` quand le type est vraiment inconnu
- ✅ Gérer les cas `null`/`undefined` avec des guards ou l'opérateur `??`
- ❌ Jamais de `any` sans justification très forte
- ❌ Jamais de `@ts-ignore` ou `@ts-expect-error`

### ESLint Rules

Le projet applique 85+ règles ESLint personnalisées :

#### Règles Angular

- `@angular-eslint/prefer-inject` : Utiliser `inject()` au lieu de constructor injection
- `@angular-eslint/template/prefer-control-flow` : Utiliser `@if`/`@for`
- `@angular-eslint/template/click-events-have-key-events` : Accessibilité
- `@angular-eslint/template/interactive-supports-focus` : Accessibilité

#### Règles TypeScript

- `@typescript-eslint/no-explicit-any` : Interdire `any`
- `@typescript-eslint/no-wrapper-object-types` : Utiliser `string` pas `String`
- `@typescript-eslint/explicit-function-return-type` : Types de retour explicites

#### Lancer le linter

```bash
# Vérifier
npm run lint

# Corriger automatiquement
npm run lint:fix
```

## Bridge Meridiane

Le bridge est généré automatiquement depuis la spec OpenAPI de l'API.
Le core doit être lancé avec `API_DOCS_ENABLED=1` (spec sur `http://localhost:8000/api/docs.json`) :

### Génération

```bash
# Depuis la racine du projet
make bridge

# Le bridge sera généré dans webfront/bridge/
```

### Utilisation

Le `baseUrl` du bridge est configuré sur `/api`, donc les routes sont relatives (`/auth/...`).

```typescript
import { inject } from '@angular/core';
import { BridgeFacade } from 'bridge';

export class MyService {
  private readonly bridge = inject(BridgeFacade);

  login(email: string, password: string) {
    return this.bridge.post$('/auth/login', { email, password });
  }
}
```

### Types générés

Le bridge génère automatiquement tous les types TypeScript depuis l'OpenAPI :

```typescript
import type { UserUserRead, AuthLoginInput } from 'bridge';

function handleUser(user: UserUserRead) {
  console.log(user.email);  // Type-safe !
}
```

## Thèmes et personnalisation

### Système de thèmes

Le projet supporte plusieurs thèmes et modes (clair/sombre) :

```typescript
export interface Theme {
  mode: 'light' | 'dark';
  color: ThemeColor;
}

type ThemeColor =
  | 'base' | 'red' | 'blue' | 'orange'
  | 'yellow' | 'green' | 'violet' | 'cyan' | 'rose';
```

### ThemeService

```typescript
import { inject } from '@angular/core';
import { ThemeService } from './core/services/theme.service';

export class MyComponent {
  readonly themeService = inject(ThemeService);

  changeTheme(): void {
    this.themeService.setTheme({ mode: 'dark', color: 'blue' });
  }
}
```

### En environnement dev

- Le thème est persisté dans `localStorage`
- Un switcher est affiché dans l'UI
- Changements en temps réel

### En environnement prod

- Le thème est forcé par la config serveur (`/api/config`)
- Pas de switcher
- Pas de persistence locale

## Composants principaux

### Form Components

#### FormField

Champ de formulaire réutilisable avec validation :

```typescript
<app-form-field
  [control]="form.controls.email"
  [label]="'Email'"
  [type]="'email'"
  [icon]="'envelope'"
  [submitted]="submitted"
  [errors]="emailErrors"
/>
```

#### PasswordInput

Champ de mot de passe avec toggle de visibilité :

```typescript
<app-password-input
  [control]="form.controls.password"
  [label]="'Mot de passe'"
  [submitted]="submitted"
  [showStrength]="true"
  [strengthValue]="passwordStrength()"
/>
```

### Validation

#### Custom Validators

```typescript
import { AbstractControl, ValidationErrors } from '@angular/forms';

export function passwordStrengthValidator(level: number) {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;

    if (!value) return null;

    // Logique de validation...
    const isValid = checkPasswordStrength(value, level);

    return isValid ? null : { passwordStrength: { level } };
  };
}
```

#### Usage

```typescript
this.form = this.fb.group({
  password: ['', [
    Validators.required,
    passwordStrengthValidator(2)
  ]],
});
```

### Messages

Le projet utilise `ngx-sonner` pour les toasts :

```typescript
import { toast } from 'ngx-sonner';

// Succès
toast.success('Opération réussie !');

// Erreur
toast.error('Une erreur est survenue');

// Info
toast.info('Information importante');

// Warning
toast.warning('Attention !');
```

## Tests

### Tests end-to-end avec Playwright

```bash
# Lancer les tests en mode UI
npm run test:e2e

# Lancer les tests headless
npx playwright test

# Générer un rapport
npx playwright show-report
```

### Structure des tests

```typescript
import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('h1')).toContainText('Connexion');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should login successfully', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'user@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
  });
});
```

## Contribution

Voir [CONTRIBUTING.md](../CONTRIBUTING.md) pour les guidelines de contribution.

### Avant de soumettre une PR

```bash
# Vérifier le code
npm run lint

# Build de production
npm run build

# Tests e2e
npm run test:e2e
```

Ou depuis la racine du projet :

```bash
make test
```

## Licence

Voir [LICENSE](../LICENSE) pour plus d'informations.
