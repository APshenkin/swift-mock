const fs = require('fs');
const path = require('path');

class Logger {
  constructor(level) {
    this.level = level || 0;
  }

  setLogLevel(level) {
    this.level = level;
  }

  trace(message) {
    if (this.level > 0) {
      // eslint-disable-next-line no-console
      console.log(message);
    }
  }

  debug(message) {
    if (this.level > 1) {
      // eslint-disable-next-line no-console
      console.log(message);
    }
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
}
