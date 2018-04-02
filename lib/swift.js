const fs = require('fs');
const path = require('path');
const cuid = require('cuid');
const finParser = require('./finParser.js');
const mtParser = require('./mtParser.js');
const block1Parser = require('./block1Parser');
const block2Parser = require('./block2Parser');
const messageGenerator = require('./messageGenerator');
const chokidar = require('chokidar');
const { Logger, mkDirByPathSync } = require('./utils');
const moment = require('moment');

const logger = new Logger();

class Swift {
  constructor(options = {}) {
    if (options.fieldPatterns) {
      this.fieldPatterns =
        JSON.parse(fs.readFileSync(path.resolve(process.cwd(), options.fieldPatterns)));
    } else {
      this.fieldPatterns = JSON.parse(fs.readFileSync(`${__dirname}/metadata/patterns.json`));
    }
    this.inputFolder = options.in ? path.resolve(process.cwd(), options.in) : path.resolve(process.cwd(), './in');
    this.outputFolder =
      options.out ? path.resolve(process.cwd(), options.out) : path.resolve(process.cwd(), './out');
    logger.setLogLevel(options.logLevel || 0);
    logger.setElastic(false);
    this.saveIncommingImages = options.saveIncommingImages || false;
    this.filters = [];
    this.messages = [];
    this.deleteFiles = options.delete || false;
  }

  run() {
    logger.trace('Starting SWIFT client...');
    if (!fs.existsSync(this.inputFolder)) {
      logger.trace('input folder is missing. Creating...');
      mkDirByPathSync(this.inputFolder);
    }
    if (!fs.existsSync(this.outputFolder)) {
      logger.trace('output folder is missing. Creating...');
      mkDirByPathSync(this.outputFolder);
    }

    // eslint-disable-next-line no-useless-escape
    this.watcher = chokidar.watch(this.inputFolder, { usePolling: true, ignored: /(^|[\/\\])\../ });

    this.watcher
      .on('add', (filePath) => {
        logger.trace(`found new file ${filePath}`);
        return new Promise((resolve, reject) => {
          fs.readFile(filePath, { encoding: 'UTF-8' }, (err, data) => {
            if (err) reject(err);
            else resolve(data);
          });
        }).then((data) => {
          fs.unwatchFile(filePath);
          this.watcher.unwatch(filePath);
          return this.parse(data);
        }).then((decoded) => {
          if (this.saveIncommingImages) {
            this.messages.push(decoded);
          }
          logger.debug('Got Swift message:');
          logger.debug(decoded);
          if (!this.deleteFiles) {
            return decoded;
          }
          return new Promise((resolve, reject) => {
            fs.unlink(filePath, (err) => {
              if (err) reject(err);
              else {
                logger.debug(`Delete in-coming file ${filePath}`);
                resolve(decoded);
              }
            });
          });
        }).then((message) => {
          let acceptedFilter;
          this.filters.some((filter) => {
            if (filter.predicate(message)) {
              logger.debug(`Found callback for message ${filePath} by predicate`);
              acceptedFilter = filter.callback;
              return true;
            }
            return false;
          });
          return { acceptedFilter, message };
        })
          .then((final) => {
            if (final.acceptedFilter) {
              return final.acceptedFilter(final.message);
            }
            return undefined;
          })
          .catch((err) => {
            fs.unwatchFile(filePath);
            this.watcher.unwatch(filePath);
            logger.error(err);
          });
      })
      .on('error', err => logger.error(err));
  }

  cleanMessages() {
    this.messages = [];
  }

  getMessages() {
    return this.messages;
  }

  cleanListeners() {
    this.filters = [];
  }

  on(predicate, callback) {
    if (typeof predicate !== 'function') {
      throw new Error('predicate is not a function');
    }
    if (typeof callback === 'function') {
      this.filters.push({ predicate, callback });
    } else {
      throw new Error('callback should be a function');
    }
  }


  close() {
    logger.trace('closing SWIFT client...');
    return this.watcher.close();
  }

  send(message, outPath = this.outputFolder) {
    let out;
    if (typeof message === 'string') {
      out = message;
    }
    if (Array.isArray(message)) {
      out = this.generate(message);
    }
    if (!out) {
      throw new Error('output message was not created');
    }
    if (out instanceof Error) {
      throw out;
    }
    const filePath = path.resolve(outPath, `${moment().format('YYYY-MM-DD-HH:mm:ss')}-${cuid()}.fin`);
    return new Promise((resolve, reject) => {
      fs.writeFile(filePath, out, (err) => {
        if (err) reject(err);
        else {
          logger.trace(`write outfile ${filePath}`);
          resolve(out);
        }
      });
    });
  }

  parse(swiftMessage) {
    // eslint-disable-next-line no-param-reassign
    swiftMessage = swiftMessage.replace(/\r\n/g, '\n');
    const ast = finParser.parse(swiftMessage);

    const humanizeBlocks = (blocks) => {
      Object.keys(blocks).forEach((name) => {
        switch (name) {
          case 'block1':
            // eslint-disable-next-line no-param-reassign
            blocks.block1 = block1Parser.parse(blocks.block1.content[0]);
            break;
          case 'block2':
            // eslint-disable-next-line no-param-reassign
            blocks.block2 = block2Parser.parse(blocks.block2.content[0]);
            break;
          case 'extraBlocks':
            // eslint-disable-next-line no-param-reassign
            blocks.extraBlocks = humanizeBlocks(blocks.extraBlocks);
            break;
          default:
            // eslint-disable-next-line no-param-reassign
            blocks[name] = mtParser.parse(blocks[name], this.fieldPatterns);
            break;
        }
      });
      return blocks;
    };
    const res = humanizeBlocks(ast);

    return res;
  }

  // eslint-disable-next-line class-methods-use-this
  generate(data) {
    return messageGenerator(data);
  }
}

module.exports = Swift;
