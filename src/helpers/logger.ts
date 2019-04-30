import {
  Logger,
  handlerSematext
} from '@pushwoosh/logger';

type TLogMessage = {
  message: string,
  code: string,
  error: any,

  [key: string]: any
}

const logger = new Logger({
  level: 'error',
  subscribers: [
    {
      level: 'fatal',
      handler: handlerSematext
    },
    {
      level: 'error',
      handler: handlerSematext
    }
  ]
});

async function sendFatalLogToRemoteServer(params: TLogMessage) {
  const message = makeMessage(params);

  return logger.fatal(message.text, message.code, message.options);
}

async function sendErrorLogToRemoteServer(params: TLogMessage) {
  const message = makeMessage(params);

  return logger.error(message.text, message.code, message.options);
}

function makeMessage(params: TLogMessage) {
  const {
    message,
    code,
    error,
    ...data
  } = params;

  const cleanError = makeCleanError(error);

  const options = {
    ...data,
    errorText: cleanError.message,
    errorStack: cleanError.stack
  };

  return {
    text: message,
    code,
    options
  }
}

function makeCleanError(error: any): Error {
  let cleanError: Error = new Error('unknown error');

  if (typeof error === 'string' || typeof error === 'number' || typeof error === 'boolean') {
    cleanError.message = error.toString();
  }

  if (error instanceof Error) {
    cleanError = error;
  }

  return cleanError;
}

export {
  logger,
  sendFatalLogToRemoteServer,
  sendErrorLogToRemoteServer
}
