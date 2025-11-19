/**
 * Utility to project a JSON(-LD) payload into a User model.
 * Peut être utile quand on consomme directement une ressource JSON-LD
 * (`User.jsonld-user.read`) et qu'on veut retrouver un `id` numérique
 * à partir de `@id`.
 */
export const mapUser = (data) => {
    var _a, _b;
    const value = data && typeof data === 'object' ? data : {};
    const rawId = (_a = value.id) !== null && _a !== void 0 ? _a : value['@id'];
    let id = 0;
    if (typeof rawId === 'number') {
        id = rawId;
    }
    else if (typeof rawId === 'string') {
        // Essaye d'interpréter directement la chaîne comme nombre...
        const direct = Number(rawId);
        if (!Number.isNaN(direct)) {
            id = direct;
        }
        else {
            // ...sinon, extraire le segment numérique final d'une IRI JSON-LD (/api/users/123).
            const match = rawId.match(/\/(\d+)(?:\/)?$/);
            if (match) {
                id = Number(match[1]);
            }
        }
    }
    const roles = Array.isArray(value.roles)
        ? value.roles.map((r) => String(r))
        : [];
    const isEmailVerified = value.isEmailVerified === undefined ? undefined : Boolean(value.isEmailVerified);
    return {
        id,
        email: String((_b = value.email) !== null && _b !== void 0 ? _b : ''),
        roles,
        isEmailVerified,
    };
};
export const mapInvite = (data) => {
    var _a, _b;
    const value = data && typeof data === 'object' ? data : {};
    const rawId = (_a = value.id) !== null && _a !== void 0 ? _a : value['@id'];
    let id = 0;
    if (typeof rawId === 'number') {
        id = rawId;
    }
    else if (typeof rawId === 'string') {
        const direct = Number(rawId);
        if (!Number.isNaN(direct)) {
            id = direct;
        }
        else {
            const match = rawId.match(/\/(\d+)(?:\/)?$/);
            if (match) {
                id = Number(match[1]);
            }
        }
    }
    const toDate = (input) => {
        const str = String(input !== null && input !== void 0 ? input : '');
        return new Date(str || new Date().toISOString());
    };
    return {
        id,
        email: String((_b = value.email) !== null && _b !== void 0 ? _b : ''),
        createdAt: toDate(value.createdAt),
        expiresAt: toDate(value.expiresAt),
        acceptedAt: value.acceptedAt === null || value.acceptedAt === undefined
            ? null
            : toDate(value.acceptedAt),
    };
};
// Helpers JSON-LD spécifiques (Item/Collection) peuvent être ajoutés
// au besoin, mais on ne modifie pas la structure retournée par l'API
// : le frontend consomme directement le JSON-LD tel quel via ces types.
//# sourceMappingURL=types.js.map