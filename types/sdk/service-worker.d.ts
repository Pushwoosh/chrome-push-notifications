interface ServiceWorkerClientsMatchOptions {
    includeUncontrolled?: boolean;
    type?: string;
}

interface ServiceWorkerClient {
    postMessage(message: any, transfer?: any): void;
    readonly frameType: string;
    readonly id: string;
    readonly url: string;
}

interface WindowClient extends ServiceWorkerClient {
    focus(): Promise<WindowClient>;
    readonly focused: boolean;
    readonly visibilityState: string;
}

interface ServiceWorkerClients {
    get(clientId: string): Promise<ServiceWorkerClient>;
    matchAll(options?: ServiceWorkerClientsMatchOptions): Promise<ServiceWorkerClient[]>;
    openWindow(url: string): Promise<WindowClient>;
    claim(): Promise<void>;
}

interface ExtendableEvent extends Event {
    waitUntil(promise: Promise<any>): void;
}

interface FetchEvent extends Event {
    readonly isReload: boolean;
    readonly request: Request;
    readonly client: ServiceWorkerClient;
    readonly clientId: string;
    respondWith(all: any): Response;
}

interface InstallEvent extends ExtendableEvent {
    readonly activeWorker: ServiceWorker;
}

interface NotificationEvent extends ExtendableEvent {
    notification: any;
    action: string;
}

interface PushEvent extends ExtendableEvent {
    readonly data: PushMessageData;
}

interface PushMessageData {
    arrayBuffer(): ArrayBuffer;
    blob(): Blob;
    json(): any;
    json<T>(): T;
    text(): string;
}

interface NotificationAction {
    action: string;
    title: string;
    icon?: string;
}

interface ServiceWorkerNotificationOptions {
    actions?: NotificationAction[];
    badge?: string;
    body?: string;
    dir?: 'auto' | 'ltr' | 'rtl';
    icon?: string;
    lang?: string;
    renotify?: boolean;
    requireInteraction?: boolean;
    tag?: string;
    vibrate?: number[];
    data?: any;
}

interface ServiceWorkerGlobalScope extends EventTarget {
    readonly clients: ServiceWorkerClients;
    readonly registration: ServiceWorkerRegistration;
    skipWaiting(): Promise<void>;
}

interface Window extends ServiceWorkerGlobalScope {}