const finParser = require('./finParser.js');
const mtParser = require('./mtParser.js');
const block1Parser = require('./block1Parser');
const block2Parser = require('./block2Parser');
const patterns = require('./metadata/patterns.json');

class SwiftParser {
  constructor(fieldPatterns) {
    let fieldPatternsObject = fieldPatterns;
    if (typeof fieldPatterns === 'string') {
      fieldPatternsObject = JSON.parse(patterns);
    }
    this.fieldPatterns = fieldPatternsObject || patterns;
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
}

module.exports = SwiftParser;
