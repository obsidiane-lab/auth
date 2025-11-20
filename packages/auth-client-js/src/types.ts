export interface UserRead {
    email: string;
    roles: string[];
    isEmailVerified?: boolean;
}

export interface User extends UserRead {
    id: number;
}

export interface UpdateUserRolesInput {
    roles: string[];
}

export interface UpdateUserRolesResponse {
    user: User;
}

/**
 * Représentation lecture de la ressource InviteUser exposée par API Platform.
 * Les métadonnées JSON-LD (@id, @type, @context) sont portées par les types Item/Collection.
 */
export interface InviteUserRead {
    email: string;
    createdAt: string;
    expiresAt: string;
    acceptedAt?: string | null;
}

export interface LoginResponse {
    user: User;
    exp: number;
}

export interface MeResponse {
    user: User;
}

export interface RegisterInput {
    email: string;
    password: string;
}

export interface RegisterResponse {
    user: User;
}

export interface RefreshResponse {
    exp: number;
}

export interface PasswordForgotResponse {
    status: string;
}

export interface InviteStatusResponse {
    status: string;
}

export interface CompleteInviteResponse {
    user: User;
}

export interface InitialAdminInput {
    email: string;
    password: string;
}

export interface InitialAdminResponse {
    user: User;
}

export interface Invite {
    id: number;
    email: string;
    createdAt: Date;
    expiresAt: Date;
    acceptedAt: Date | null;
}

export type Iri = string | undefined;

export interface Item {
    '@id'?: Iri;
    '@context'?: string,
    '@type'?: string
}

export interface View extends Item {
    first?: Iri;
    last?: Iri;
    next?: Iri;
    previous?: Iri;
}

export interface IriTemplateMapping extends Item {
    variable: string;
    property?: string;
    required?: boolean;
}

export interface IriTemplate extends Item {
    template: string;
    variableRepresentation?: string;
    mapping: IriTemplateMapping[];
}

export interface Collection<T> extends Item {
    member: T[];
    totalItems?: number;
    search?: IriTemplate;
    view?: View;
}
/**
 * Utility to project a JSON(-LD) payload into a User model.
 * Peut être utile quand on consomme directement une ressource JSON-LD
 * (`User.jsonld-user.read`) et qu'on veut retrouver un `id` numérique
 * à partir de `@id`.
 */
export const mapUser = <T extends Record<string, unknown>>(data: T): User => {
    const value =
        data && typeof data === 'object' ? (data as Record<string, unknown>) : {};

    const rawId = value.id ?? value['@id'];
    let id = 0;

    if (typeof rawId === 'number') {
        id = rawId;
    } else if (typeof rawId === 'string') {
        // Essaye d'interpréter directement la chaîne comme nombre...
        const direct = Number(rawId);
        if (!Number.isNaN(direct)) {
            id = direct;
        } else {
            // ...sinon, extraire le segment numérique final d'une IRI JSON-LD (/api/users/123).
            const match = rawId.match(/\/(\d+)(?:\/)?$/);
            if (match) {
                id = Number(match[1]);
            }
        }
    }

    const roles: string[] = Array.isArray(value.roles)
        ? value.roles.map((r) => String(r))
        : [];

    const isEmailVerified =
        value.isEmailVerified === undefined ? undefined : Boolean(value.isEmailVerified);

    return {
        id,
        email: String(value.email ?? ''),
        roles,
        isEmailVerified,
    };
};

export const mapInvite = <T extends Record<string, unknown>>(data: T): Invite => {
    const value =
        data && typeof data === 'object' ? (data as Record<string, unknown>) : {};

    const rawId = value.id ?? value['@id'];
    let id = 0;

    if (typeof rawId === 'number') {
        id = rawId;
    } else if (typeof rawId === 'string') {
        const direct = Number(rawId);
        if (!Number.isNaN(direct)) {
            id = direct;
        } else {
            const match = rawId.match(/\/(\d+)(?:\/)?$/);
            if (match) {
                id = Number(match[1]);
            }
        }
    }

    const toDate = (input: unknown): Date => {
        const str = String(input ?? '');
        return new Date(str || new Date().toISOString());
    };

    return {
        id,
        email: String(value.email ?? ''),
        createdAt: toDate(value.createdAt),
        expiresAt: toDate(value.expiresAt),
        acceptedAt:
            value.acceptedAt === null || value.acceptedAt === undefined
                ? null
                : toDate(value.acceptedAt),
    };
};

// Helpers JSON-LD spécifiques (Item/Collection) peuvent être ajoutés
// au besoin, mais on ne modifie pas la structure retournée par l'API
// : le frontend consomme directement le JSON-LD tel quel via ces types.
