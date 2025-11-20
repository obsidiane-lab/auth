export interface UserRead {
    email: string;
    roles: string[];
    emailVerified?: boolean;
    lastLoginAt?: string | null;
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
    '@context'?: string;
    '@type'?: string;
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
export declare const mapUser: <T extends Record<string, unknown>>(data: T) => User;
export declare const mapInvite: <T extends Record<string, unknown>>(data: T) => Invite;
