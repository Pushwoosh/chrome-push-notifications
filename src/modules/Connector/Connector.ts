import * as uuid from 'uuid/v4';

import { keyValue } from '../../storage';
import { CHANNELS } from '../../constants';

import { CommandBus, TCommands } from '../CommandBus/CommandBus';
import { EventBus, TEvents } from '../EventBus/EventBus';

export class Connector {
  private event: EventBus;
  private command: CommandBus;

  constructor(command?: CommandBus, event?: EventBus) {
    this.event = event || EventBus.getInstance();
    this.command = command || CommandBus.getInstance();
  }

  public subscribe(id?: string): Promise<void> {
    const uid: string = id || uuid();

    return new Promise((resolve) => {
      this.event.on(TEvents.SUBSCRIBE, ({ eventId }) => {
        if (eventId === uid) {
          resolve()
        }
      });

      this.command.emit(TCommands.SUBSCRIBE, uid);
    });
  }

  public unsubscribe(id?: string): Promise<void> {
    const uid: string = id || uuid();

    return new Promise((resolve) => {
      this.event.on(TEvents.UNSUBSCRIBE, ({ eventId }) => {
        if (eventId === uid) {
          resolve()
        }
      });

      this.command.emit(TCommands.UNSUBSCRIBE, uid);
    });
  }

  public getTags(id?: string): Promise<{ [key: string]: unknown }> {
    const uid: string = id || uuid();

    return new Promise((resolve) => {
      this.event.on(TEvents.GET_TAGS, ({ eventId, tags }) => {
        if (eventId === uid) {
          resolve(tags);
        }
      });

      this.command.emit(TCommands.GET_TAGS, uid);
    });
  }

  public setTags(tags: { [key: string]: unknown }, id?: string): Promise<void> {
    const uid: string = id || uuid();

    return new Promise((resolve) => {
      this.event.on(TEvents.SET_TAGS, ({ eventId }) => {
        if (eventId === uid) {
          resolve();
        }
      });

      this.command.emit(TCommands.SET_TAGS, { tags }, uid);
    });
  }

  public checkIsSubscribed(id?: string): Promise<boolean> {
    const uid: string = id || uuid();

    return new Promise((resolve) => {
      this.event.on(TEvents.CHECK_IS_SUBSCRIBED, ({ eventId, state }) => {
        if (eventId === uid) {
          resolve(state);
        }
      });

      this.command.emit(TCommands.CHECK_IS_SUBSCRIBED, uid);
    });
  }

  public checkIsManualUnsubscribed(id?: string): Promise<boolean> {
    const uid: string = id || uuid();

    return new Promise((resolve) => {
      this.event.on(TEvents.CHECK_IS_MANUAL_UNSUBSCRIBED, ({ eventId, state }) => {
        if (eventId === uid) {
          resolve(state);
        }
      });

      this.command.emit(TCommands.CHECK_IS_MANUAL_UNSUBSCRIBED, uid);
    });
  }

  public getChannels(): Promise<ISubscriptionSegment[] | undefined> {
    return keyValue.get(CHANNELS);
  }
}
