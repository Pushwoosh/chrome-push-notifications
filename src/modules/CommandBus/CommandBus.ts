import * as uuid from 'uuid/v4';

import { TCommandsObserver, TCommands } from './CommandBus.types';

export { TCommands };

export class CommandBus {
  private static instance: CommandBus;
  private observers: TCommandsObserver[] = [];

  private constructor() {

  }

  public static getInstance(): CommandBus {
    if (!CommandBus.instance) {
      CommandBus.instance = new CommandBus();
    }

    return CommandBus.instance;
  }

  public on(event: TCommands.SUBSCRIBE, callback: (params: { commandId: string }) => void): void
  public on(event: TCommands.UNSUBSCRIBE, callback: (params: { commandId: string }) => void): void
  public on(event: TCommands.GET_TAGS, callback: (params: { commandId: string } ) => void): void
  public on(event: TCommands.SET_TAGS, callback: (params: { commandId: string; tags: { [key: string]: unknown } }) => void): void
  public on(event: TCommands.GET_CHANNELS, callback: (params: { commandId: string; channels: string[] }) => void): void
  public on(event: TCommands.CHECK_IS_SUBSCRIBED, callback: (params: { commandId: string; state: boolean }) => void): void
  public on(event: TCommands.CHECK_IS_MANUAL_UNSUBSCRIBED, callback: (params: { commandId: string; state: boolean }) => void): void
  public on(event: TCommands.CLOSE_IN_APP, callback: (params: { commandId: string }) => void): void
  public on(event: TCommands.SHOW_IN_APP, callback: (params: { commandId: string; code: string }) => void): void
  public on(event: TCommands.OPEN_NEW_LINK, callback: (params: { commandId: string; href: string }) => void): void
  public on(event: TCommands.POST_MESSAGE_TO_IFRAME, callback: (params: { commandId: string; options?: any }) => void): void
  public on(arg1: TCommands, callback: (params: any) => void): void {
    this.observers.push({
      command: arg1,
      handler: callback
    })
  }

  public emit(event: TCommands.SUBSCRIBE, id?: string): void
  public emit(event: TCommands.UNSUBSCRIBE, id?: string): void
  public emit(event: TCommands.GET_TAGS, id?: string): void
  public emit(event: TCommands.SET_TAGS, params: { tags: { [key: string]: unknown } }, id?: string): void
  public emit(event: TCommands.GET_CHANNELS, id?: string): void
  public emit(event: TCommands.CHECK_IS_SUBSCRIBED, id?: string): void
  public emit(event: TCommands.CHECK_IS_MANUAL_UNSUBSCRIBED, id?: string): void
  public emit(event: TCommands.CLOSE_IN_APP, id?: string): void
  public emit(event: TCommands.SHOW_IN_APP, params: { code: string }, id?: string): void
  public emit(event: TCommands.OPEN_NEW_LINK, params: { href: string; }, id?: string): void
  public emit(event: TCommands.POST_MESSAGE_TO_IFRAME, params?: any, id?: string): void
  public emit(arg1: keyof typeof TCommands, arg2?: unknown, arg3?: unknown): void {
    let commandId: string = uuid();
    let params: any = {};

    if (typeof arg3 === 'string') {
      commandId = arg3;
    }

    if (typeof arg2 === 'string') {
      commandId = arg2;
    }

    if (typeof arg2 === 'object' && arg2) {
      params = arg2;
    }

    this.observers.forEach((observer): void => {
      if (observer.command === arg1) {
        observer.handler({
          commandId,
          ...params,
        });
      }
    })
  }
}
