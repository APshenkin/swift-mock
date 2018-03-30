const _ = require('lodash');

/**
 * Generate Swift message from blocks. Blocks order is the same as in array. No
 * [{block: 1, data: value},{block:2, data:2}]
 * @param {array} arrayOfBlocks
 * @returns {*}
 */

function hasAllProps(obj, props) {
  const propsTrue = _.chain(props)
    .map(prop => _.has(obj, prop))
    .without(false)
    .value();
  return (propsTrue.length === props.length);
}

const depthOf = (object) => {
  let level = 1;
  Object.keys(object).forEach((key) => {
    // eslint-disable-next-line no-prototype-builtins
    if (object.hasOwnProperty(key) && typeof object[key] === 'object') {
      const depth = depthOf(object[key]) + 1;
      level = Math.max(depth, level);
    }
  });
  return level;
};

function generateJsonDataBlock(data, blockname) {
  let subst = '';
  if (depthOf(data) !== 1) {
    throw new Error(`block data ${blockname} has several depth level, but should 1`);
  }
  Object.keys(data).forEach((key) => {
    if (data[key] === undefined) {
      subst += `{${key}:}`;
    } else {
      subst += `{${key}:${data[key]}}`;
    }
  });
  return `{${blockname}:${subst}}`;
}

module.exports = (arrayOfBlocks) => {
  let message = '';
  try {
    if (!Array.isArray(arrayOfBlocks)) {
      throw new Error('invalid swift message format');
    }
    arrayOfBlocks.forEach((block) => {
      if (!block.block || !block.data) {
        throw new Error('invalid swift message block');
      }
      // let data;
      switch (block.block) {
        case 1: {
          /**
           * generate block 1
           */
          const { data } = block;
          /**
           * if data is string, than take it as is
           */
          if (typeof data === 'string') {
            message += `{1:${data}}`;
            break;
          }
          /**
           * if data is object, validate that we have required keys and generate block
           */
          if (typeof data === 'object') {
            if (hasAllProps(
              data,
              ['applicationId', 'serviceId', 'receivingLtId', 'sessionNumber',
                'sequenceNumber'],
            )) {
              message +=
                `{1:${data.applicationId}${data.serviceId}${data.receivingLtId}${data.sessionNumber}${data.sequenceNumber}}`;
              break;
            }
            throw new Error(`Invalid data for block 1. something is missing ${JSON.stringify(data)}}`);
          }
          throw new Error('Invalid block 1 format. It must be a string or object with required fields');
        }
        case 2: {
          /**
           * generate block 2
           */
          const { data } = block;
          /**
           * if data is string, than take it as is
           */
          if (typeof data === 'string') {
            message += `{2:${data}}`;
            break;
          }
          /**
           * if data is object, validate that we have required keys and generate block
           */
          if (typeof data === 'object') {
            if (hasAllProps(
              data,
              ['direction', 'msgType', 'bic', 'prio'],
            )) {
              message +=
                `{2:${data.direction}${data.msgType}${data.bic}${data.prio}}`;
              break;
            }
            throw new Error(`Invalid data for block 2. something is missing ${JSON.stringify(data)}`);
          }
          throw new Error('Invalid block 2 format. It must be a string or object with required fields');
        }
        case 3: {
          /**
           * generate block 3
           */
          const { data } = block;
          /**
           * block 3 should be an object with key/value pairs
           */
          if (typeof block === 'object') {
            message += generateJsonDataBlock(data, 3);
            break;
          }
          throw new Error('Invalid block 3 format. It must be a object with key/value pairs');
        }
        case 4: {
          /**
           * generate block 4
           */
          const { data } = block;
          // eslint-disable-next-line no-param-reassign
          block.strategy = block.strategy || 'content';
          /**
           * block 4 may be an array with fields
           */
          if (Array.isArray(data)) {
            let subst = '';
            data.forEach((field) => {
              if (block.strategy === 'content') {
                subst += `${field.content}\n`;
              }
              if (block.strategy === 'combine') {
                subst += `:${field.type}${field.option}:${field.fieldValue}\n`;
              }
            });
            message += `{4:\n${subst}-}`;
            break;
          }
          /**
           * block 3 may be an object with key/value pairs
           */
          if (typeof block === 'object') {
            message += generateJsonDataBlock(data, 4);
            break;
          }
          throw new Error('Invalid block 4 format. It must be a object with key/value pairs or array');
        }
        case 5: {
          /**
           * generate block 5
           */
          const { data } = block;
          /**
           * block 5 should be an object with key/value pairs
           */
          if (typeof block === 'object') {
            message += generateJsonDataBlock(data, 5);
            break;
          }
          throw new Error('Invalid block 5 format. It must be a object with key/value pairs');
        }
        case 'S': {
          /**
           * generate block S
           */
          const { data } = block;
          /**
           * block S should be an object with key/value pairs
           */
          if (typeof block === 'object') {
            message += generateJsonDataBlock(data, 'S');
            break;
          }
          throw new Error('Invalid block S format. It must be a object with key/value pairs');
        }
        default:
          throw new Error(`invalid block type ${block.block}`);
      }
    });

    return message;
  } catch (err) {
    return err;
  }
};
