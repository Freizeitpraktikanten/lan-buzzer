/**
 * LogLevel ENUM
 * @readonly
 * @enum {number}
 */
const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

class Logger {

  constructor(logLevel = LogLevel.INFO) {
    this.logLevel = logLevel;
  }

  debug(...args) {
    if (this.LogLevel <= LogLevel.DEBUG) {
      console.debug(...args);
    }
  }

  info(...args) {
    if (this.LogLevel <= LogLevel.INFO) {
      console.info(...args);
    }
  }

  warn(...args) {
    if (this.LogLevel <= LogLevel.WARN) {
      console.warn(...args);
    }
  }

  error(...args) {
    if (this.LogLevel <= LogLevel.ERROR) {
      console.debug(...args);
    }
  }
}

module.exports = {
  LogLevel, Logger
};
