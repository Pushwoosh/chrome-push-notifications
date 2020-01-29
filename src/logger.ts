import {log as logStorage} from './storage';
import {patchConsole} from './functions';

const levels: { [key: string]: number } = {
  error: 1,
  info: 2,
  debug: 3
};

let limitLevel = 3;

patchConsole();

const Logger: ILogger = {
  setLevel(level) {
    if (!levels[level]) {
      level = 'error';
    }
    limitLevel = levels[level];
  },
  write(type: TWriteType, message: any, additional?: any) {
    if (type === 'error') {
      this.error(message);
    }
    else {
      this.info(message);
    }
    return logStorage.add(type, message, additional);
  }
} as ILogger;

Object.keys(levels).forEach((levelName: string) => {
  const levelNumber = levels[levelName];
  Logger[levelName] = (...args: any[]) => {
    if (levelNumber <= limitLevel) {
      console.groupCollapsed(levelName);
      console.info('', ...args);
      console.trace('trace');
      console.groupEnd();
    }
  };
});

export function logAndThrowError(error: string) {
  const logText = new Error(error);
  Logger.write('error', logText, 'logAndThrowError');
  throw logText;
}

export function logAndRejectError(error: string, reject: (e: any) => void) {
  const logText = new Error(error);
  Logger.write('error', logText, 'logAndRejectError');
  reject(logText);
}

export { Logger };
