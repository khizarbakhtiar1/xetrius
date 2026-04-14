/* eslint-disable no-console */

type LogArgs = unknown[];

const PREFIX = '[Xetrius]';
const isProduction = process.env.NODE_ENV === 'production';

function timestamp(): string {
  return new Date().toISOString();
}

export const logger = {
  debug(...args: LogArgs) {
    if (!isProduction) {
      console.debug(PREFIX, timestamp(), ...args);
    }
  },

  info(...args: LogArgs) {
    if (!isProduction) {
      console.info(PREFIX, timestamp(), ...args);
    }
  },

  warn(...args: LogArgs) {
    console.warn(PREFIX, timestamp(), ...args);
  },

  error(...args: LogArgs) {
    console.error(PREFIX, timestamp(), ...args);
  },
};
