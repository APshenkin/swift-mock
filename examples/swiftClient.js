const Swift = require('../lib/swift');

const swift = new Swift({ in: './examples/files', out: './examples/out', logLevel: 2 });

swift.on(msg => msg.block1.receivingLtId === 'RMSFGB2LAXXX' && msg.block2.msgType === '502', msg => swift.send([
  { block: 1, data: { ...msg.block1, sequenceNumber: 666666 } },
  { block: 2, data: { ...msg.block2 } },
  { block: 4, data: msg.extraBlocks.block4 },
  { block: 5, data: { ...msg.block5 } }]));

swift.on(msg => msg.block1.receivingLtId === 'RMSFGB2LAXXX' && msg.block2.msgType === '509', msg => swift.send([
  { block: 1, data: { ...msg.block1, sequenceNumber: 300200 } },
  { block: 2, data: { ...msg.block2 } },
  { block: 4, data: msg.extraBlocks.block4 },
  { block: 5, data: { ...msg.block5 } },
  { block: 'S', data: { ...msg.blockS } }]));


swift.run();
