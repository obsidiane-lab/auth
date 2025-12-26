import * as i0 from '@angular/core';
import { InjectionToken, inject, makeEnvironmentProviders, PLATFORM_ID, Inject, Optional, Injectable, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import * as i1 from '@angular/common/http';
import { HttpResponse, provideHttpClient, withFetch, withInterceptors, HttpParams, HttpClient } from '@angular/common/http';
import { timeout, retry, timer, tap, catchError, throwError, finalize, from, switchMap, ReplaySubject, Subject, BehaviorSubject, fromEvent, defer, EMPTY, of, map as map$1, filter as filter$1, share as share$1 } from 'rxjs';
import { auditTime, concatMap, takeUntil, map, filter, finalize as finalize$1, share } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';

/** Base URL of the API (e.g. `http://localhost:8000`). */
const API_BASE_URL = new InjectionToken('API_BASE_URL');
/** Mercure hub URL (e.g. `http://localhost:8000/.well-known/mercure`). */
const MERCURE_HUB_URL = new InjectionToken('MERCURE_HUB_URL');
/**
 * Default credential policy for HTTP requests and Mercure EventSource.
 * When `true`, the bridge sets `withCredentials: true` on HTTP calls and uses cookies for SSE.
 */
const BRIDGE_WITH_CREDENTIALS = new InjectionToken('BRIDGE_WITH_CREDENTIALS');
const MERCURE_TOPIC_MODE = new InjectionToken('MERCURE_TOPIC_MODE');
const BRIDGE_LOGGER = new InjectionToken('BRIDGE_LOGGER');
const BRIDGE_DEFAULTS = new InjectionToken('BRIDGE_DEFAULTS');

const DEFAULT_MEDIA_TYPES = {
    accept: 'application/ld+json',
    post: 'application/ld+json',
    put: 'application/ld+json',
    patch: 'application/merge-patch+json',
};
const contentTypeInterceptor = (req, next) => {
    const mediaTypes = DEFAULT_MEDIA_TYPES;
    let headers = req.headers;
    // Set Accept if missing.
    if (!headers.has('Accept')) {
        headers = headers.set('Accept', mediaTypes.accept);
    }
    // Only methods with a body.
    const isBodyMethod = ['POST', 'PUT', 'PATCH'].includes(req.method);
    // Ignore FormData (browser sets multipart boundary).
    const isFormData = typeof FormData !== 'undefined' && req.body instanceof FormData;
    if (isBodyMethod && !isFormData && !headers.has('Content-Type')) {
        let contentType;
        switch (req.method) {
            case 'PATCH':
                contentType = mediaTypes.patch;
                break;
            case 'PUT':
                contentType = mediaTypes.put;
                break;
            default:
                contentType = mediaTypes.post;
        }
        headers = headers.set('Content-Type', contentType);
    }
    return next(req.clone({ headers }));
};

const DEFAULT_RETRY_METHODS = ['GET', 'HEAD', 'OPTIONS'];
/**
 * Applies default headers, timeout and retry policy configured via `provideBridge({defaults: ...})`.
 */
const bridgeDefaultsInterceptor = (req, next) => {
    const defaults = inject(BRIDGE_DEFAULTS, { optional: true }) ?? {};
    const logger = inject(BRIDGE_LOGGER, { optional: true });
    let nextReq = req;
    if (defaults.headers) {
        for (const [k, v] of Object.entries(defaults.headers)) {
            if (!nextReq.headers.has(k)) {
                nextReq = nextReq.clone({ headers: nextReq.headers.set(k, v) });
            }
        }
    }
    let out$ = next(nextReq);
    const timeoutMs = typeof defaults.timeoutMs === 'number' ? defaults.timeoutMs : undefined;
    if (timeoutMs && timeoutMs > 0) {
        out$ = out$.pipe(timeout({ first: timeoutMs }));
    }
    const retryCfg = defaults.retries;
    const retryCount = typeof retryCfg === 'number' ? retryCfg : retryCfg?.count;
    if (retryCount && retryCount > 0) {
        const methods = (typeof retryCfg === 'object' && retryCfg.methods) ? retryCfg.methods : DEFAULT_RETRY_METHODS;
        const normalizedMethod = req.method.toUpperCase();
        const methodAllowList = new Set(methods.map((m) => m.toUpperCase()));
        if (methodAllowList.has(normalizedMethod)) {
            const delayMs = typeof retryCfg === 'object' ? (retryCfg.delayMs ?? 250) : 250;
            out$ = out$.pipe(retry({
                count: retryCount,
                delay: (_err, retryIndex) => {
                    logger?.debug?.('[Bridge] retry', { url: req.urlWithParams, method: req.method, retryIndex });
                    return timer(delayMs);
                },
            }));
        }
    }
    return out$;
};

/**
 * Lightweight request/response logging controlled by `provideBridge({debug: true})`.
 * Logs are delegated to the injected `BRIDGE_LOGGER`.
 */
const bridgeDebugInterceptor = (req, next) => {
    const logger = inject(BRIDGE_LOGGER, { optional: true });
    if (!logger)
        return next(req);
    const startedAt = Date.now();
    logger.debug('[Bridge] request', { method: req.method, url: req.urlWithParams });
    return next(req).pipe(tap((evt) => {
        if (evt instanceof HttpResponse) {
            logger.debug('[Bridge] response', { method: req.method, url: req.urlWithParams, status: evt.status });
        }
    }), catchError((err) => {
        logger.error('[Bridge] error', { method: req.method, url: req.urlWithParams, err });
        return throwError(() => err);
    }), finalize(() => {
        const durationMs = Date.now() - startedAt;
        logger.debug('[Bridge] done', { method: req.method, url: req.urlWithParams, durationMs });
    }));
};

/** Registers the bridge HTTP client, interceptors, Mercure realtime adapter and configuration tokens. */
function provideBridge(opts) {
    const { baseUrl, auth, mercure, defaults, debug = false, extraInterceptors = [], } = opts;
    if (!baseUrl) {
        throw new Error("provideBridge(): missing 'baseUrl'");
    }
    const resolvedMercureInit = mercure?.init ?? { credentials: 'include' };
    const resolvedMercureHubUrl = mercure?.hubUrl;
    const resolvedMercureTopicMode = mercure?.topicMode ?? 'url';
    const withCredentials = resolveWithCredentials(resolvedMercureInit);
    const loggerProvider = createBridgeLogger(debug);
    const interceptors = [
        contentTypeInterceptor,
        bridgeDefaultsInterceptor,
        ...createAuthInterceptors(auth),
        ...(debug ? [bridgeDebugInterceptor] : []),
        ...extraInterceptors,
    ];
    return makeEnvironmentProviders([
        provideHttpClient(withFetch(), withInterceptors(interceptors)),
        { provide: API_BASE_URL, useValue: baseUrl },
        { provide: BRIDGE_WITH_CREDENTIALS, useValue: withCredentials },
        ...(resolvedMercureHubUrl ? [{ provide: MERCURE_HUB_URL, useValue: resolvedMercureHubUrl }] : []),
        { provide: MERCURE_TOPIC_MODE, useValue: resolvedMercureTopicMode },
        { provide: BRIDGE_DEFAULTS, useValue: defaults ?? {} },
        { provide: BRIDGE_LOGGER, useValue: loggerProvider },
    ]);
}
function createBridgeLogger(debug) {
    const noop = () => undefined;
    return {
        debug: debug ? console.debug.bind(console) : noop,
        info: debug ? console.info.bind(console) : noop,
        warn: debug ? console.warn.bind(console) : noop,
        error: console.error.bind(console),
    };
}
function resolveWithCredentials(init) {
    if (!init)
        return false;
    const anyInit = init;
    return anyInit.withCredentials === true || init.credentials === 'include';
}
function createAuthInterceptors(auth) {
    if (!auth)
        return [];
    if (typeof auth === 'function') {
        return [auth];
    }
    const bearer = typeof auth === 'string'
        ? { type: 'bearer', token: auth }
        : auth;
    if (bearer.type !== 'bearer')
        return [];
    if ('token' in bearer) {
        const token = bearer.token;
        return [createBearerAuthInterceptor(() => token)];
    }
    return [createBearerAuthInterceptor(bearer.getToken)];
}
function createBearerAuthInterceptor(getToken) {
    return (req, next) => {
        if (req.headers.has('Authorization'))
            return next(req);
        return from(Promise.resolve(getToken())).pipe(switchMap((token) => {
            if (!token)
                return next(req);
            return next(req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) }));
        }));
    };
}

/**
 * Public configuration types for the bridge.
 *
 * Keep this file dependency-free (no Angular imports) so it can be used from both
 * runtime code and type-only contexts.
 */

class EventSourceWrapper {
    url;
    opts;
    logger;
    es;
    statusSub = new ReplaySubject(1);
    eventSub = new Subject();
    status$ = this.statusSub.asObservable();
    events$ = this.eventSub.asObservable();
    constructor(url, opts = {}, logger) {
        this.url = url;
        this.opts = opts;
        this.logger = logger;
        this.setState('closed');
        this.log('[SSE] init', { url, withCredentials: !!opts.withCredentials });
    }
    open() {
        if (this.es) {
            this.log('[SSE] open() ignored: already open');
            return;
        }
        this.setState('connecting');
        this.log('[SSE] open', { url: this.url });
        const es = new EventSource(this.url, {
            withCredentials: !!this.opts.withCredentials,
        });
        this.es = es;
        es.onopen = () => {
            this.setState('connected');
        };
        es.onmessage = (ev) => {
            this.eventSub.next({ type: 'message', data: ev.data, lastEventId: ev.lastEventId || undefined });
        };
        es.onerror = () => {
            // The browser will retry automatically. We stay in "connecting".
            this.log('[SSE] error');
            this.setState('connecting');
        };
    }
    close() {
        if (this.es) {
            this.es.close();
            this.es = undefined;
            this.log('[SSE] closed');
        }
        this.setState('closed');
    }
    // ──────────────── internals ────────────────
    setState(state) {
        this.statusSub.next(state);
    }
    log(...args) {
        this.logger?.debug?.(...args);
    }
}

class MercureUrlBuilder {
    /**
     * Builds the Mercure hub URL with one `topic=` parameter per topic.
     * The adapter is responsible for canonicalising topics beforehand.
     */
    build(hubUrl, topics, lastEventId) {
        const url = new URL(hubUrl);
        if (lastEventId) {
            url.searchParams.set('lastEventID', lastEventId);
        }
        url.searchParams.delete('topic');
        for (const topic of topics) {
            url.searchParams.append('topic', topic);
        }
        return url.toString();
    }
}

class RefCountTopicRegistry {
    topics = new Set();
    refCounts = new Map();
    /**
     * Increments ref-count for each topic.
     * Callers should pass unique topic strings (deduped).
     */
    addAll(topics) {
        for (const topic of topics) {
            const next = (this.refCounts.get(topic) ?? 0) + 1;
            this.refCounts.set(topic, next);
            this.topics.add(topic);
        }
    }
    /**
     * Decrements ref-count for each topic.
     * Callers should pass unique topic strings (deduped).
     */
    removeAll(topics) {
        for (const topic of topics) {
            const next = (this.refCounts.get(topic) ?? 0) - 1;
            if (next <= 0) {
                this.refCounts.delete(topic);
                this.topics.delete(topic);
            }
            else {
                this.refCounts.set(topic, next);
            }
        }
    }
    hasAny() {
        return this.topics.size > 0;
    }
    snapshot() {
        return new Set(this.topics);
    }
    computeKey(hubUrl, credentialsOn) {
        const topicsSorted = Array.from(this.topics).sort().join('|');
        return `${hubUrl}::${credentialsOn ? '1' : '0'}::${topicsSorted}`;
    }
}

class MercureTopicMapper {
    mode;
    apiBaseUrl;
    constructor(apiBase, mode) {
        this.mode = mode;
        this.apiBaseUrl = new URL(apiBase);
    }
    /**
     * Canonical value used for ref-counting and as the "topic" query param value.
     * - mode "url": always absolute, same-origin resolved
     * - mode "iri": same-origin path+query+hash ("/api/..."), otherwise keep as-is
     */
    toTopic(input) {
        if (this.mode === 'url')
            return this.toAbsoluteUrl(input);
        return this.toRelativeIriIfSameOrigin(input);
    }
    /**
     * Canonical value used to compare incoming payload IRIs with subscribed IRIs.
     * We keep payload matching stable by using same-origin relative IRIs ("/api/...").
     */
    toPayloadIri(input) {
        return this.toRelativeIriIfSameOrigin(input);
    }
    toAbsoluteUrl(input) {
        try {
            return new URL(input, this.apiBaseUrl).toString();
        }
        catch {
            return input;
        }
    }
    toRelativeIriIfSameOrigin(input) {
        try {
            const url = new URL(input, this.apiBaseUrl);
            if (url.origin !== this.apiBaseUrl.origin)
                return input;
            return `${url.pathname}${url.search}${url.hash}`;
        }
        catch {
            return input;
        }
    }
}

class MercureRealtimeAdapter {
    apiBase;
    withCredentialsDefault;
    platformId;
    hubUrl;
    logger;
    lastEventId;
    es;
    currentKey;
    topicsRegistry = new RefCountTopicRegistry();
    urlBuilder;
    topicMapper;
    destroy$ = new Subject();
    connectionStop$ = new Subject();
    rebuild$ = new Subject();
    shuttingDown = false;
    _status$ = new BehaviorSubject('closed');
    incoming$ = new Subject();
    constructor(apiBase, withCredentialsDefault, platformId, hubUrl, topicMode, logger) {
        this.apiBase = apiBase;
        this.withCredentialsDefault = withCredentialsDefault;
        this.platformId = platformId;
        this.hubUrl = hubUrl;
        this.logger = logger;
        this.urlBuilder = new MercureUrlBuilder();
        // `topicMode` affects only the `topic=` query param sent to the hub.
        // Payload IRIs are always matched using same-origin relative IRIs (`/api/...`) when possible.
        this.topicMapper = new MercureTopicMapper(apiBase, topicMode ?? 'url');
        this.rebuild$
            .pipe(auditTime(10), concatMap(() => this.rebuildOnce$()))
            .subscribe();
        if (isPlatformBrowser(this.platformId)) {
            fromEvent(window, 'pagehide')
                .pipe(takeUntil(this.destroy$))
                .subscribe(() => this.shutdownBeforeExit());
            fromEvent(window, 'beforeunload')
                .pipe(takeUntil(this.destroy$))
                .subscribe(() => this.shutdownBeforeExit());
        }
    }
    // ──────────────── API publique ────────────────
    status$() {
        return this._status$.asObservable();
    }
    subscribe$(iris, _filter) {
        return defer(() => {
            const inputIris = iris.filter((v) => typeof v === 'string' && v.length > 0);
            if (inputIris.length === 0)
                return EMPTY;
            if (!this.hubUrl) {
                this.logger?.debug?.('[Mercure] hubUrl not configured → realtime disabled');
                return EMPTY;
            }
            // Canonicalise topics (ref-count + URL) to avoid duplicates like:
            // - "/api/conversations/1" and "http://localhost:8000/api/conversations/1"
            const registeredTopics = Array.from(new Set(inputIris.map((i) => this.topicMapper.toTopic(i))));
            this.topicsRegistry.addAll(registeredTopics);
            this.scheduleRebuild();
            // Matching is done against the payload IRIs (typically "/api/...").
            const subscribed = inputIris.map((i) => normalizeIri(this.topicMapper.toPayloadIri(i)));
            const fieldPath = _filter?.field;
            return this.incoming$.pipe(map((evt) => this.safeParse(evt.data)), filter((raw) => !!raw), filter((raw) => {
                if (fieldPath) {
                    const relIris = this.extractRelationIris(raw, fieldPath).map((i) => normalizeIri(this.topicMapper.toPayloadIri(i)));
                    return relIris.some((relIri) => matchesAnySubscribed(relIri, subscribed));
                }
                const rawId = raw?.['@id'];
                const id = typeof rawId === 'string' ? normalizeIri(this.topicMapper.toPayloadIri(rawId)) : undefined;
                return typeof id === 'string' && matchesAnySubscribed(id, subscribed);
            }), map((payload) => ({ iri: payload['@id'], data: payload })), finalize$1(() => {
                this.topicsRegistry.removeAll(registeredTopics);
                this.scheduleRebuild();
            }), share());
        });
    }
    unsubscribe(iris) {
        const inputIris = iris.filter((v) => typeof v === 'string' && v.length > 0);
        if (inputIris.length === 0)
            return;
        const topics = Array.from(new Set(inputIris.map((i) => this.topicMapper.toTopic(i))));
        this.topicsRegistry.removeAll(topics);
        this.scheduleRebuild();
    }
    shutdownBeforeExit() {
        if (this.shuttingDown)
            return;
        this.shuttingDown = true;
        this.teardownConnection();
    }
    ngOnDestroy() {
        this.teardownConnection();
        this._status$.complete();
        this.incoming$.complete();
        this.destroy$.next();
        this.destroy$.complete();
        this.rebuild$.complete();
    }
    // ───────────────── PRIVATE ─────────────────
    scheduleRebuild() {
        if (this.shuttingDown)
            return;
        this.rebuild$.next();
    }
    rebuildOnce$() {
        return defer(() => {
            if (this.shuttingDown)
                return of(void 0);
            try {
                if (!this.hubUrl) {
                    this.currentKey = undefined;
                    this._status$.next('closed');
                    return of(void 0);
                }
                const hasTopics = this.topicsRegistry.hasAny();
                const key = hasTopics ? this.topicsRegistry.computeKey(this.hubUrl, this.withCredentialsDefault) : undefined;
                if (!hasTopics) {
                    if (this.es)
                        this.teardownConnection();
                    this.currentKey = undefined;
                    this._status$.next('closed');
                    return of(void 0);
                }
                if (key && key === this.currentKey) {
                    return of(void 0);
                }
                this.teardownConnection();
                const url = this.urlBuilder.build(this.hubUrl, this.topicsRegistry.snapshot(), this.lastEventId);
                this.logger?.debug?.('[Mercure] connect', { hubUrl: this.hubUrl, topics: this.topicsRegistry.snapshot(), lastEventId: this.lastEventId });
                this.es = new EventSourceWrapper(url, { withCredentials: this.withCredentialsDefault }, this.logger);
                this.connectionStop$ = new Subject();
                this.es.status$
                    .pipe(takeUntil(this.connectionStop$), takeUntil(this.destroy$))
                    .subscribe((st) => this.updateGlobalStatus(st));
                this.es.events$
                    .pipe(takeUntil(this.connectionStop$), takeUntil(this.destroy$))
                    .subscribe((e) => {
                    this.lastEventId = e.lastEventId ?? this.lastEventId;
                    this.incoming$.next(e);
                });
                this._status$.next('connecting');
                this.es.open();
                this.currentKey = key;
            }
            catch (err) {
                this.logger?.error?.('[Mercure] rebuild failed:', err);
                this.currentKey = undefined;
                this._status$.next(this.topicsRegistry.hasAny() ? 'connecting' : 'closed');
            }
            return of(void 0);
        });
    }
    teardownConnection() {
        this.es?.close();
        this.es = undefined;
        this.connectionStop$.next();
        this.connectionStop$.complete();
    }
    updateGlobalStatus(sse) {
        if (sse === 'connected') {
            this._status$.next('connected');
            return;
        }
        if (sse === 'connecting') {
            this._status$.next('connecting');
            return;
        }
        this._status$.next(this.topicsRegistry.hasAny() ? 'connecting' : 'closed');
    }
    safeParse(raw) {
        try {
            return JSON.parse(raw);
        }
        catch (err) {
            this.logger?.debug?.('[Mercure] invalid JSON payload ignored', { raw });
            return undefined;
        }
    }
    extractRelationIris(raw, path) {
        const readPath = (obj, dotPath) => {
            return dotPath
                .split('.')
                .filter(Boolean)
                .reduce((acc, key) => acc?.[key], obj);
        };
        const normalize = (value) => {
            if (!value)
                return [];
            if (typeof value === 'string')
                return value.length > 0 ? [value] : [];
            if (typeof value === 'object' && typeof value['@id'] === 'string')
                return [value['@id']];
            if (Array.isArray(value))
                return value.flatMap(normalize);
            return [];
        };
        return normalize(readPath(raw, path));
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.1.7", ngImport: i0, type: MercureRealtimeAdapter, deps: [{ token: API_BASE_URL }, { token: BRIDGE_WITH_CREDENTIALS }, { token: PLATFORM_ID }, { token: MERCURE_HUB_URL, optional: true }, { token: MERCURE_TOPIC_MODE, optional: true }, { token: BRIDGE_LOGGER, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "20.1.7", ngImport: i0, type: MercureRealtimeAdapter, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.1.7", ngImport: i0, type: MercureRealtimeAdapter, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: () => [{ type: undefined, decorators: [{
                    type: Inject,
                    args: [API_BASE_URL]
                }] }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [BRIDGE_WITH_CREDENTIALS]
                }] }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [PLATFORM_ID]
                }] }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [MERCURE_HUB_URL]
                }] }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [MERCURE_TOPIC_MODE]
                }] }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [BRIDGE_LOGGER]
                }] }] });
function normalizeIri(iri) {
    return iri.endsWith('/') ? iri.slice(0, -1) : iri;
}
function matchesAnySubscribed(candidate, subscribed) {
    for (const iri of subscribed) {
        if (candidate === iri)
            return true;
        if (candidate.startsWith(`${iri}/`))
            return true;
    }
    return false;
}

function toHttpParams(q) {
    if (!q)
        return new HttpParams();
    if (q instanceof HttpParams)
        return q;
    const fromObject = {};
    const consumed = new Set();
    const maybeQuery = q;
    if (maybeQuery.page != null) {
        fromObject['page'] = String(maybeQuery.page);
        consumed.add('page');
    }
    if (maybeQuery.itemsPerPage != null) {
        fromObject['itemsPerPage'] = String(maybeQuery.itemsPerPage);
        consumed.add('itemsPerPage');
    }
    if (q.filters) {
        consumed.add('filters');
        for (const [k, v] of Object.entries(q.filters)) {
            assign(fromObject, k, v);
        }
    }
    for (const [k, v] of Object.entries(q)) {
        if (consumed.has(k))
            continue;
        assign(fromObject, k, v);
    }
    return new HttpParams({ fromObject });
}
function assign(target, key, value) {
    if (value == null)
        return;
    if (Array.isArray(value)) {
        target[key] = value.map(String);
    }
    else {
        target[key] = String(value);
    }
}

function joinUrl(base, path) {
    const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${normalizedBase}${normalizedPath}`;
}
/**
 * Resolves an API IRI (e.g. `/api/books/1`) to a full URL using the API base.
 * If `path` is already absolute (http/https), it is returned as-is.
 */
function resolveUrl(base, path) {
    if (/^https?:\/\//i.test(path))
        return path;
    if (path.startsWith('//'))
        return path;
    return joinUrl(base, path);
}

class ApiPlatformRestRepository {
    http;
    apiBase;
    resourcePath;
    withCredentialsDefault;
    constructor(http, apiBase, resourcePath, withCredentialsDefault) {
        this.http = http;
        this.apiBase = apiBase;
        this.resourcePath = resourcePath;
        this.withCredentialsDefault = withCredentialsDefault;
    }
    getCollection$(query, opts) {
        const params = toHttpParams(query);
        return this.http.get(this.resolveUrl(this.resourcePath), {
            params,
            headers: opts?.headers,
            withCredentials: opts?.withCredentials ?? this.withCredentialsDefault,
        });
    }
    get$(iri, opts) {
        return this.http.get(this.resolveUrl(iri), {
            headers: opts?.headers,
            withCredentials: opts?.withCredentials ?? this.withCredentialsDefault,
        });
    }
    post$(payload, opts) {
        return this.http.post(this.resolveUrl(this.resourcePath), payload, {
            headers: opts?.headers,
            withCredentials: opts?.withCredentials ?? this.withCredentialsDefault,
        });
    }
    patch$(iri, changes, opts) {
        return this.http.patch(this.resolveUrl(iri), changes, {
            headers: opts?.headers,
            withCredentials: opts?.withCredentials ?? this.withCredentialsDefault,
        });
    }
    put$(iri, payload, opts) {
        return this.http.put(this.resolveUrl(iri), payload, {
            headers: opts?.headers,
            withCredentials: opts?.withCredentials ?? this.withCredentialsDefault,
        });
    }
    delete$(iri, opts) {
        return this.http.delete(this.resolveUrl(iri), {
            headers: opts?.headers,
            withCredentials: opts?.withCredentials ?? this.withCredentialsDefault,
        });
    }
    request$(req) {
        // Low-level escape hatch for non-standard endpoints (custom controllers, uploads, etc.).
        const { method, url, query, body, headers, responseType, withCredentials, options = {}, } = req;
        const targetUrl = this.resolveUrl(url ?? this.resourcePath);
        const mergedOptions = { ...options };
        mergedOptions['responseType'] = (responseType ?? mergedOptions['responseType'] ?? 'json');
        mergedOptions['withCredentials'] = withCredentials ?? mergedOptions['withCredentials'] ?? this.withCredentialsDefault;
        if (headers)
            mergedOptions['headers'] = headers;
        if (query)
            mergedOptions['params'] = toHttpParams(query);
        if (body !== undefined)
            mergedOptions['body'] = body;
        mergedOptions['observe'] = 'body';
        return this.http.request(method, targetUrl, mergedOptions);
    }
    resolveUrl(path) {
        const effectivePath = path ?? this.resourcePath;
        if (!effectivePath)
            throw new Error('ApiPlatformRestRepository: missing url and resourcePath');
        return resolveUrl(this.apiBase, effectivePath);
    }
}

class ResourceFacade {
    repo;
    realtime;
    connectionStatus;
    constructor(repo, realtime) {
        this.repo = repo;
        this.realtime = realtime;
        this.connectionStatus = toSignal(this.realtime.status$(), { initialValue: 'closed' });
    }
    getCollection$(query, opts) {
        return this.repo.getCollection$(query, opts);
    }
    get$(iri, opts) {
        return this.repo.get$(iri, opts);
    }
    patch$(iri, changes, opts) {
        return this.repo.patch$(iri, changes, opts);
    }
    post$(payload, opts) {
        return this.repo.post$(payload, opts);
    }
    put$(iri, payload, opts) {
        return this.repo.put$(iri, payload, opts);
    }
    delete$(iri, opts) {
        return this.repo.delete$(iri, opts);
    }
    request$(req) {
        return this.repo.request$(req);
    }
    /**
     * Subscribes to real-time updates for one or many IRIs.
     * Undefined/empty values are ignored.
     */
    watch$(iri) {
        const iris = (Array.isArray(iri) ? iri : [iri]).filter((v) => typeof v === 'string' && v.length > 0);
        return this.subscribeAndSync(iris);
    }
    unwatch(iri) {
        const iris = (Array.isArray(iri) ? iri : [iri]).filter((v) => typeof v === 'string' && v.length > 0);
        this.realtime.unsubscribe(iris);
    }
    /**
     * Subscribes to updates of a related sub-resource published on the parent topic.
     * Example: subscribe to Message events on a Conversation topic, filtering by `message.conversation`.
     */
    watchSubResource$(iri, field) {
        const iris = (Array.isArray(iri) ? iri : [iri]).filter((v) => typeof v === 'string' && v.length > 0);
        return this.realtime
            .subscribe$(iris, { field: field })
            .pipe(map$1(e => e.data), filter$1((d) => d !== undefined), share$1());
    }
    subscribeAndSync(iris) {
        return this.realtime
            .subscribe$(iris)
            .pipe(map$1(event => event.data), filter$1((data) => data !== undefined), share$1());
    }
}

class FacadeFactory {
    env = inject(EnvironmentInjector);
    http = inject(HttpClient);
    baseUrl = inject(API_BASE_URL);
    withCredentials = inject(BRIDGE_WITH_CREDENTIALS);
    mercure = inject(MercureRealtimeAdapter);
    /**
     * Creates a `ResourceFacade<T>`.
     *
     * Important: `ResourceFacade` uses `toSignal()`, which requires an injection context.
     * This factory ensures that by using `runInInjectionContext`.
     */
    create(config) {
        const url = config.url;
        const repo = config.repo ?? new ApiPlatformRestRepository(this.http, this.baseUrl, url, this.withCredentials);
        const realtime = config.realtime ?? this.mercure;
        return runInInjectionContext(this.env, () => new ResourceFacade(repo, realtime));
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.1.7", ngImport: i0, type: FacadeFactory, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "20.1.7", ngImport: i0, type: FacadeFactory, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.1.7", ngImport: i0, type: FacadeFactory, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }] });

/**
 * High-level facade for ad-hoc HTTP calls and Mercure subscriptions.
 *
 * Prefer `FacadeFactory` + `ResourceFacade<T>` when you want a resource-oriented API.
 */
class BridgeFacade {
    http;
    realtime;
    apiBase;
    withCredentialsDefault;
    constructor(http, realtime, apiBase, withCredentialsDefault) {
        this.http = http;
        this.realtime = realtime;
        this.apiBase = apiBase;
        this.withCredentialsDefault = withCredentialsDefault;
    }
    // ──────────────── HTTP ────────────────
    get$(url, opts) {
        return this.http.get(this.resolveUrl(url), {
            headers: opts?.headers,
            withCredentials: opts?.withCredentials ?? this.withCredentialsDefault,
        });
    }
    getCollection$(url, query, opts) {
        const params = toHttpParams(query);
        return this.http.get(this.resolveUrl(url), {
            params,
            headers: opts?.headers,
            withCredentials: opts?.withCredentials ?? this.withCredentialsDefault,
        });
    }
    post$(url, payload, opts) {
        return this.http.post(this.resolveUrl(url), payload, {
            headers: opts?.headers,
            withCredentials: opts?.withCredentials ?? this.withCredentialsDefault,
        });
    }
    patch$(url, changes, opts) {
        return this.http.patch(this.resolveUrl(url), changes, {
            headers: opts?.headers,
            withCredentials: opts?.withCredentials ?? this.withCredentialsDefault,
        });
    }
    put$(url, payload, opts) {
        return this.http.put(this.resolveUrl(url), payload, {
            headers: opts?.headers,
            withCredentials: opts?.withCredentials ?? this.withCredentialsDefault,
        });
    }
    delete$(url, opts) {
        return this.http.delete(this.resolveUrl(url), {
            headers: opts?.headers,
            withCredentials: opts?.withCredentials ?? this.withCredentialsDefault,
        });
    }
    request$(req) {
        const { method, url, query, body, headers, responseType, withCredentials, options = {} } = req;
        const targetUrl = this.resolveUrl(url);
        const mergedOptions = { ...options };
        if (headers)
            mergedOptions['headers'] = headers;
        if (query)
            mergedOptions['params'] = toHttpParams(query);
        if (body !== undefined)
            mergedOptions['body'] = body;
        mergedOptions['responseType'] = (responseType ?? mergedOptions['responseType'] ?? 'json');
        mergedOptions['withCredentials'] =
            withCredentials ?? mergedOptions['withCredentials'] ?? this.withCredentialsDefault;
        mergedOptions['observe'] = 'body';
        return this.http.request(method, targetUrl, mergedOptions);
    }
    // ──────────────── SSE / Mercure ────────────────
    watch$(iri, subscribeFilter) {
        const iris = (Array.isArray(iri) ? iri : [iri]).filter((v) => typeof v === 'string' && v.length > 0);
        return this.realtime
            .subscribe$(iris, subscribeFilter)
            .pipe(map((event) => event.data), filter((data) => data !== undefined), share());
    }
    unwatch(iri) {
        const iris = (Array.isArray(iri) ? iri : [iri]).filter((v) => typeof v === 'string' && v.length > 0);
        this.realtime.unsubscribe(iris);
    }
    resolveUrl(path) {
        if (!path)
            throw new Error('BridgeFacade: missing url');
        return resolveUrl(this.apiBase, path);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.1.7", ngImport: i0, type: BridgeFacade, deps: [{ token: i1.HttpClient }, { token: MercureRealtimeAdapter }, { token: API_BASE_URL }, { token: BRIDGE_WITH_CREDENTIALS }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "20.1.7", ngImport: i0, type: BridgeFacade, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.1.7", ngImport: i0, type: BridgeFacade, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: () => [{ type: i1.HttpClient }, { type: MercureRealtimeAdapter }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [API_BASE_URL]
                }] }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [BRIDGE_WITH_CREDENTIALS]
                }] }] });

/**
 * Generated bundle index. Do not edit.
 */

export { BridgeFacade, FacadeFactory, ResourceFacade, joinUrl, provideBridge, resolveUrl };
//# sourceMappingURL=bridge.mjs.map
