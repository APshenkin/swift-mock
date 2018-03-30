class Logger {
  constructor(level) {
    this.level = level || 0;
  }

  setLogLevel(level) {
    this.level = level;
  }

  trace(message) {
    if (this.level > 1) {
      // eslint-disable-next-line no-console
      console.log(message);
    }
  }

  debug(message) {
    if (this.level > 0) {
      // eslint-disable-next-line no-console
      console.log(message);
    }
  }
}

module.exports.Logger = Logger;
