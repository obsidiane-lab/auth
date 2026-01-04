import * as i0 from '@angular/core';
import { EnvironmentProviders, Signal, OnDestroy } from '@angular/core';
import { HttpInterceptorFn, HttpParams, HttpHeaders, HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Public configuration types for the bridge.
 *
 * Keep this file dependency-free (no Angular imports) so it can be used from both
 * runtime code and type-only contexts.
 */
interface BridgeLogger {
    debug: (...args: unknown[]) => void;
    info: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
}
interface BridgeDefaults {
    headers?: Record<string, string>;
    timeoutMs?: number;
    retries?: number | {
        count: number;
        delayMs?: number;
        methods?: string[];
    };
}
/**
 * Controls how Mercure topics are sent in the hub URL.
 * - `url`: topics are absolute URLs (recommended default)
 * - `iri`: topics are same-origin relative IRIs (e.g. `/api/...`)
 */
type MercureTopicMode = 'url' | 'iri';

type BridgeAuth = string | {
    type: 'bearer';
    token: string;
} | {
    type: 'bearer';
    getToken: () => string | undefined | Promise<string | undefined>;
} | HttpInterceptorFn;
interface BridgeMercureOptions {
    hubUrl?: string;
    init?: RequestInit;
    topicMode?: MercureTopicMode;
}
interface BridgeOptions {
    /** Base URL of the API (e.g. `http://localhost:8000`). */
    baseUrl: string;
    /** Auth strategy used to attach an Authorization header. */
    auth?: BridgeAuth;
    /**
     * Use `topicMode` to control the `topic=` values sent to the hub.
     */
    mercure?: BridgeMercureOptions;
    /** Default HTTP behaviour (headers, timeout, retries). */
    defaults?: BridgeDefaults;
    /**
     * De-duplicates in-flight HTTP requests.
     *
     * - `true` (default): single-flight for safe methods (`GET/HEAD/OPTIONS`)
     * - `false`: disabled (each call triggers a new request)
     */
    singleFlight?: boolean;
    /** Enables debug logging via the debug interceptor and console logger. */
    debug?: boolean;
    /** Extra `HttpInterceptorFn` applied after bridge interceptors. */
    extraInterceptors?: HttpInterceptorFn[];
}
/** Registers the bridge HTTP client, interceptors, Mercure realtime adapter and configuration tokens. */
declare function provideBridge(opts: BridgeOptions): EnvironmentProviders;

type Iri = string | undefined;
type IriRequired = string;
type BaseHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';
type HttpMethod = BaseHttpMethod | Lowercase<BaseHttpMethod>;
type QueryParamValue = string | number | boolean | Array<string | number | boolean>;
type AnyQuery = Query | Record<string, QueryParamValue> | HttpParams;
interface Item {
    '@id'?: Iri;
    '@context'?: string;
    '@type'?: string;
}
interface View extends Item {
    first?: Iri;
    last?: Iri;
    next?: Iri;
    previous?: Iri;
}
interface IriTemplateMapping extends Item {
    variable: string;
    property?: string;
    required?: boolean;
}
interface IriTemplate extends Item {
    template: string;
    variableRepresentation?: string;
    mapping: IriTemplateMapping[];
}
interface Collection<T> extends Item {
    member: T[];
    totalItems?: number;
    search?: IriTemplate;
    view?: View;
}
interface Query {
    itemsPerPage?: number;
    page?: number;
    filters?: Record<string, QueryParamValue>;
}
interface HttpCallOptions {
    headers?: HttpHeaders | Record<string, string>;
    withCredentials?: boolean;
}
interface ResourceRepository<T> {
    getCollection$(query?: AnyQuery, opts?: HttpCallOptions): Observable<Collection<T>>;
    get$(iri: IriRequired, opts?: HttpCallOptions): Observable<T>;
    post$(payload: Partial<T>, opts?: HttpCallOptions): Observable<T>;
    patch$(iri: IriRequired, changes: Partial<T>, opts?: HttpCallOptions): Observable<T>;
    put$(iri: IriRequired, payload: Partial<T>, opts?: HttpCallOptions): Observable<T>;
    delete$(iri: IriRequired, opts?: HttpCallOptions): Observable<void>;
    request$<R = unknown, B = unknown>(req: HttpRequestConfig<B>): Observable<R>;
}
interface HttpRequestConfig<TBody = unknown> {
    method: HttpMethod;
    url?: Iri;
    query?: AnyQuery;
    body?: TBody;
    headers?: HttpHeaders | Record<string, string>;
    responseType?: 'json' | 'text' | 'blob';
    withCredentials?: boolean;
    options?: Record<string, unknown>;
}

type RealtimeStatus = 'connecting' | 'connected' | 'closed';
interface RealtimeEvent<T> {
    iri: string;
    data?: T;
}
type SubscribeFilter = {
    field: string;
};
interface RealtimePort {
    /**
     * Subscribes to Mercure events for the given topics.
     *
     * Note: topics must be stable strings. Undefined values are ignored by the adapter.
     */
    subscribe$<T>(iris: Iri[], filter?: SubscribeFilter): Observable<RealtimeEvent<T>>;
    unsubscribe(iris: Iri[]): void;
    status$(): Observable<RealtimeStatus>;
}

interface Facade<T extends Item> {
    getCollection$(query?: AnyQuery, opts?: HttpCallOptions): Observable<Collection<T>>;
    get$(iri: IriRequired, opts?: HttpCallOptions): Observable<T>;
    post$(payload: Partial<T>, opts?: HttpCallOptions): Observable<T>;
    patch$(iri: IriRequired, changes: Partial<T>, opts?: HttpCallOptions): Observable<T>;
    put$(iri: IriRequired, payload: Partial<T>, opts?: HttpCallOptions): Observable<T>;
    delete$(iri: IriRequired, opts?: HttpCallOptions): Observable<void>;
    request$<R = unknown, B = unknown>(req: HttpRequestConfig<B>): Observable<R>;
    watch$(iri: Iri | Iri[]): Observable<T>;
    unwatch(iri: Iri | Iri[]): void;
}

declare class ResourceFacade<T extends Item> implements Facade<T> {
    protected readonly repo: ResourceRepository<T>;
    protected readonly realtime: RealtimePort;
    readonly connectionStatus: Signal<RealtimeStatus>;
    constructor(repo: ResourceRepository<T>, realtime: RealtimePort);
    getCollection$(query?: AnyQuery, opts?: HttpCallOptions): Observable<Collection<T>>;
    get$(iri: IriRequired, opts?: HttpCallOptions): Observable<T>;
    patch$(iri: IriRequired, changes: Partial<T>, opts?: HttpCallOptions): Observable<T>;
    post$(payload: Partial<T>, opts?: HttpCallOptions): Observable<T>;
    put$(iri: IriRequired, payload: Partial<T>, opts?: HttpCallOptions): Observable<T>;
    delete$(iri: IriRequired, opts?: HttpCallOptions): Observable<void>;
    request$<R = unknown, B = unknown>(req: HttpRequestConfig<B>): Observable<R>;
    /**
     * Subscribes to real-time updates for one or many IRIs.
     * Undefined/empty values are ignored.
     */
    watch$(iri: Iri | Iri[]): Observable<T>;
    unwatch(iri: Iri | Iri[]): void;
    /**
     * Subscribes to updates of a related sub-resource published on the parent topic.
     * Example: subscribe to Message events on a Conversation topic, filtering by `message.conversation`.
     */
    watchSubResource$<R>(iri: Iri | Iri[], field: string): Observable<R>;
    protected subscribeAndSync(iris: string[]): Observable<T>;
}

type FacadeConfig<T> = {
    url: string;
    repo?: ResourceRepository<T>;
    realtime?: RealtimePort;
};
declare class FacadeFactory {
    private readonly env;
    private readonly http;
    private readonly baseUrl;
    private readonly withCredentials;
    private readonly mercure;
    /**
     * Creates a `ResourceFacade<T>`.
     *
     * Important: `ResourceFacade` uses `toSignal()`, which requires an injection context.
     * This factory ensures that by using `runInInjectionContext`.
     */
    create<T extends Item>(config: FacadeConfig<T>): ResourceFacade<T>;
    static ɵfac: i0.ɵɵFactoryDeclaration<FacadeFactory, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<FacadeFactory>;
}

declare class MercureRealtimeAdapter implements RealtimePort, OnDestroy {
    private readonly apiBase;
    private readonly withCredentialsDefault;
    private readonly platformId;
    private readonly hubUrl?;
    private readonly logger?;
    private lastEventId?;
    private es?;
    private currentKey?;
    private readonly topicsRegistry;
    private readonly urlBuilder;
    private readonly topicMapper;
    private readonly destroy$;
    private connectionStop$;
    private readonly rebuild$;
    private shuttingDown;
    private readonly _status$;
    private readonly incoming$;
    constructor(apiBase: string, withCredentialsDefault: boolean, platformId: object, hubUrl?: string | undefined, topicMode?: MercureTopicMode, logger?: BridgeLogger | undefined);
    status$(): Observable<RealtimeStatus>;
    subscribe$<T>(iris: string[], _filter?: {
        field?: string;
    }): Observable<RealtimeEvent<T>>;
    unsubscribe(iris: string[]): void;
    shutdownBeforeExit(): void;
    ngOnDestroy(): void;
    private scheduleRebuild;
    private rebuildOnce$;
    private teardownConnection;
    private updateGlobalStatus;
    private safeParse;
    private extractRelationIris;
    static ɵfac: i0.ɵɵFactoryDeclaration<MercureRealtimeAdapter, [null, null, null, { optional: true; }, { optional: true; }, { optional: true; }]>;
    static ɵprov: i0.ɵɵInjectableDeclaration<MercureRealtimeAdapter>;
}

/**
 * High-level facade for ad-hoc HTTP calls and Mercure subscriptions.
 *
 * Prefer `FacadeFactory` + `ResourceFacade<T>` when you want a resource-oriented API.
 */
declare class BridgeFacade {
    private readonly http;
    private readonly realtime;
    private readonly apiBase;
    private readonly withCredentialsDefault;
    constructor(http: HttpClient, realtime: MercureRealtimeAdapter, apiBase: string, withCredentialsDefault: boolean);
    get$<R = unknown>(url: IriRequired, opts?: HttpCallOptions): Observable<R>;
    getCollection$<T extends Item = Item>(url: IriRequired, query?: AnyQuery, opts?: HttpCallOptions): Observable<Collection<T>>;
    post$<R = unknown, B = unknown>(url: IriRequired, payload: B, opts?: HttpCallOptions): Observable<R>;
    patch$<R = unknown, B = unknown>(url: IriRequired, changes: B, opts?: HttpCallOptions): Observable<R>;
    put$<R = unknown, B = unknown>(url: IriRequired, payload: B, opts?: HttpCallOptions): Observable<R>;
    delete$(url: IriRequired, opts?: HttpCallOptions): Observable<void>;
    request$<R = unknown, B = unknown>(req: HttpRequestConfig<B>): Observable<R>;
    watch$<T = Item>(iri: Iri | Iri[], subscribeFilter?: SubscribeFilter): Observable<T>;
    unwatch(iri: Iri | Iri[]): void;
    private resolveUrl;
    static ɵfac: i0.ɵɵFactoryDeclaration<BridgeFacade, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<BridgeFacade>;
}

declare function joinUrl(base: string, path: string): string;
/**
 * Resolves an API IRI (e.g. `/api/books/1`) to a full URL using the API base.
 * If `path` is already absolute (http/https), it is returned as-is.
 */
declare function resolveUrl(base: string, path: string): string;

interface Auth extends Item {
    tokenId?: string | null;
}

interface AuthInviteCompleteInputInviteComplete extends Item {
    token: string;
    password: string;
    confirmPassword: string;
}

interface AuthInviteUserInputInviteSend extends Item {
    email: string | null;
}

interface AuthLdJson extends Item {
    tokenId?: string | null;
}

interface AuthPasswordForgotInputPasswordForgot extends Item {
    email: string | null;
}

interface AuthPasswordResetInputPasswordReset extends Item {
    token: string;
    password: string;
}

interface AuthRegisterUserInputUserRegister extends Item {
    email: string | null;
    password: string | null;
}

interface FrontendConfig extends Item {
    id?: string | null;
    registrationEnabled?: boolean;
    passwordStrengthLevel?: number;
    brandingName?: string;
    frontendRedirectUrl?: string;
    environment?: string;
    themeMode?: string;
    themeColor?: string;
}

interface InvitePreview extends Item {
    token?: string | null;
    email?: string | null;
    accepted?: boolean;
    expired?: boolean;
}

interface InviteUserInviteRead extends Item {
    id?: number;
    email?: string;
    createdAt?: string;
    expiresAt?: string;
    acceptedAt?: string | null;
}

interface Setup extends Item {
    tokenId?: string | null;
}

interface SetupRegisterUserInputUserRegister extends Item {
    email: string | null;
    password: string | null;
}

interface UserUserRead extends Item {
    id?: number;
    email: string;
    roles?: string[];
    emailVerified?: boolean;
    lastLoginAt?: string | null;
}

interface UserUpdateUserRolesInputUserRoles extends Item {
    roles: string[] | null;
}

export { BridgeFacade, FacadeFactory, ResourceFacade, joinUrl, provideBridge, resolveUrl };
export type { AnyQuery, Auth, AuthInviteCompleteInputInviteComplete, AuthInviteUserInputInviteSend, AuthLdJson, AuthPasswordForgotInputPasswordForgot, AuthPasswordResetInputPasswordReset, AuthRegisterUserInputUserRegister, BridgeAuth, BridgeDefaults, BridgeLogger, BridgeMercureOptions, BridgeOptions, Collection, FacadeConfig, FrontendConfig, HttpCallOptions, HttpMethod, HttpRequestConfig, InvitePreview, InviteUserInviteRead, Iri, IriRequired, IriTemplate, IriTemplateMapping, Item, MercureTopicMode, Query, QueryParamValue, ResourceRepository, Setup, SetupRegisterUserInputUserRegister, UserUpdateUserRolesInputUserRoles, UserUserRead, View };
