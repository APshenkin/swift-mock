const fs = require('fs');
const Swift = require('../lib/swift');

const swift = new Swift();

const file = fs.readFileSync('./examples/files/SWIFT_509_ack2.fin', { encoding: 'UTF-8' });

// eslint-disable-next-line no-console
console.log('Got SWIFT message:');
// eslint-disable-next-line no-console
console.log(file);

// eslint-disable-next-line no-console
console.log('Parse SWIFT message:');

const parsed = swift.parse(file);

// eslint-disable-next-line no-console
console.log(parsed);

// eslint-disable-next-line no-console
console.log('Generate SWIFT message:');

const message = swift.generate([
  { block: 1, data: { ...parsed.block1, sequenceNumber: 666666 } },
  { block: 2, data: { ...parsed.block2 } },
  { block: 4, data: parsed.extraBlocks.block4 },
  { block: 5, data: { ...parsed.block5 } },
  { block: 'S', data: { ...parsed.blockS } }]);

// eslint-disable-next-line no-console
console.log(message);
