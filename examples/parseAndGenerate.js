const Swift = require('../lib/swift');

const swift = new Swift();
const fs = require('fs');

const file = fs.readFileSync('./examples/files/SWIFT_509_ack2.fin', { encoding: 'UTF-8' });

console.log('Got SWIFT message:');
console.log(file);

console.log('Parse SWIFT message:');

const parsed = swift.parse(file);

console.log(parsed);

console.log('Generate SWIFT message:');

const message = swift.generate([
  { block: 1, data: { ...parsed.block1, sequenceNumber: 666666 } },
  { block: 2, data: { ...parsed.block2 } },
  { block: 4, data: parsed.extraBlocks.block4 },
  { block: 5, data: { ...parsed.block5 } },
  { block: 'S', data: { ...parsed.blockS } }]);

console.log(message);
