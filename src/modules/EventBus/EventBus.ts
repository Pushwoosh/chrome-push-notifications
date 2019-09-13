import {
  TEventObserver,
  TEventsNames,
  TEventsOptions,
  TEventsCallbacks
} from './EventBus.types';


export class EventBus {
  private static instance: EventBus;
  private observers: TEventObserver<TEventsNames>[] = [];

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }

    return EventBus.instance;
  }

  public on<T extends TEventsNames>(event: T, callback: TEventsCallbacks[T]): void {
    this.observers.push({
      event,
      callback
    });
  }

  public emit<T extends TEventsNames>(event: T, options: TEventsOptions[T]): void {
    this.observers.forEach((observer) => {
      if (observer.event === event) {
        // @ts-ignore
        // will be working in typescript v3
        observer.callback(options);
      }
    })
  }
}
