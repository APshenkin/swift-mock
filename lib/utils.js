const fs = require('fs');
const path = require('path');

class Logger {
  constructor(options = {}) {
    this.level = options.level || 0;
    this.elastic = options.elastic || false;
  }

  setLogLevel(level) {
    this.level = level;
  }

  setElastic(elastic) {
    this.elastic = elastic;
  }

  trace(message) {
    if (this.level > 0) {
      if (!this.elastic) {
        console.log(message);
        return;
      }
      if (typeof message === 'object') {
        // eslint-disable-next-line no-param-reassign
        message = JSON.stringify(message, null, 2);
      }
      // eslint-disable-next-line no-console
      console.log(JSON.stringify({ level: 'INFO', message }));
    }
  }

  debug(message) {
    if (this.level > 1) {
      if (!this.elastic) {
        console.log(message);
        return;
      }
      if (typeof message === 'object') {
        // eslint-disable-next-line no-param-reassign
        message = JSON.stringify(message, null, 2);
      }
      // eslint-disable-next-line no-console
      console.log(JSON.stringify({ level: 'DEBUG', message }));
    }
  }

  // eslint-disable-next-line class-methods-use-this
  error(message) {
    if (!this.elastic) {
      console.log(message);
      return;
    }
    if (message instanceof Error) {
      // eslint-disable-next-line no-param-reassign
      message = { message: message.message, stack: message.stack };
    }

    if (typeof message === 'object') {
      // eslint-disable-next-line no-param-reassign
      message = JSON.stringify(message, null, 2);
    }
    console.log(JSON.stringify({ level: 'ERROR', message }));
  }
}

module.exports.Logger = Logger;

module.exports.mkDirByPathSync = (targetDir, { isRelativeToScript = false } = {}) => {
  const { sep } = path;
  const initDir = path.isAbsolute(targetDir) ? sep : '';
  const baseDir = isRelativeToScript ? __dirname : '.';

  targetDir.split(sep).reduce((parentDir, childDir) => {
    const curDir = path.resolve(baseDir, parentDir, childDir);
    if (curDir !== '/') {
      try {
        fs.mkdirSync(curDir);
      } catch (err) {
        if (err.code !== 'EEXIST') {
          throw err;
        }
      }
    }
    return curDir;
  }, initDir);
};
