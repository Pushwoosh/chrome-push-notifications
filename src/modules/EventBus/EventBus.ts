import * as uuid from 'uuid/v4';

import { TEventObserver, TEvents } from './EventBus.types';

export { TEvents };

export class EventBus {
  private static instance: EventBus;
  private observers: TEventObserver[] = [];

  private constructor() {

  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }

    return EventBus.instance;
  }

  public on(event: TEvents.SUBSCRIBE, callback: (params: { eventId: string }) => void): void
  public on(event: TEvents.UNSUBSCRIBE, callback: (params: { eventId: string }) => void): void
  public on(event: TEvents.GET_TAGS, callback: (params: { eventId: string; tags: { [key: string]: unknown } }) => void): void
  public on(event: TEvents.SET_TAGS, callback: (params: { eventId: string }) => void): void
  public on(event: TEvents.GET_CHANNELS, callback: (params: { eventId: string; channels: string[] }) => void): void
  public on(event: TEvents.CHECK_IS_SUBSCRIBED, callback: (params: { eventId: string; state: boolean }) => void): void
  public on(event: TEvents.CHECK_IS_MANUAL_UNSUBSCRIBED, callback: (params: { eventId: string; state: boolean }) => void): void
  public on(event: TEvents.SHOW_NOTIFICATION_PERMISSION_DIALOG, callback: (params: { eventId: string }) => void): void
  public on(event: TEvents.HIDE_NOTIFICATION_PERMISSION_DIALOG, callback: (params: { eventId: string }) => void): void
  public on(event: TEvents.INIT_IN_APPS_MODULE, callback: (params: { eventId: string }) => void): void
  public on(arg1: TEvents, callback: (params: any) => void): void {
    this.observers.push({
      event: arg1,
      handler: callback
    })
  }

  public emit(event: TEvents.SUBSCRIBE, id?: string): void
  public emit(event: TEvents.UNSUBSCRIBE, id?: string): void
  public emit(event: TEvents.GET_TAGS, params: { tags: { [key: string]: unknown } }, id?: string): void
  public emit(event: TEvents.SET_TAGS, id?: string): void
  public emit(event: TEvents.GET_CHANNELS, params: { channels: string[] }, id?: string): void
  public emit(event: TEvents.CHECK_IS_SUBSCRIBED, params: { state: boolean }, id?: string): void
  public emit(event: TEvents.CHECK_IS_MANUAL_UNSUBSCRIBED, params: { state: boolean }, id?: string): void
  public emit(event: TEvents.SHOW_NOTIFICATION_PERMISSION_DIALOG, id?: string): void
  public emit(event: TEvents.HIDE_NOTIFICATION_PERMISSION_DIALOG, id?: string): void
  public emit(event: TEvents.INIT_IN_APPS_MODULE, id?: string): void
  public emit(arg1: keyof typeof TEvents, arg2?: unknown, arg3?: unknown): void {
    let eventId: string = uuid();
    let params: any = {};

    if (typeof arg3 === 'string') {
      eventId = arg3;
    }

    if (typeof arg2 === 'string') {
      eventId = arg2;
    }

    if (typeof arg2 === 'object' && arg2) {
      params = arg2;
    }

    this.observers.forEach((observer): void => {
      if (observer.event === arg1) {
        observer.handler({
          eventId,
          ...params,
        });
      }
    })
  }
}
