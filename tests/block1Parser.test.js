const assert = require('assert');
const parser = require('../lib/block1Parser');

describe('Block1 Parser', () => {
  it('parses correct input', () => {
    const text = 'F01SARACHBBAXXX8059525613';
    const block = parser.parse(text);
    assert.notEqual(block, undefined);
    assert.equal(block.blockId, '1');
    assert.equal(block.content, text);
    assert.equal(block.applicationId, 'F');
    assert.equal(block.serviceId, '01');
    assert.equal(block.receivingLtId, 'SARACHBBAXXX');
    assert.equal(block.sessionNumber, '8059');
    return assert.equal(block.sequenceNumber, '525613');
  });
  it('doesn\'t parse short input', () => {
    const text = 'F01SARACHBB3';
    const block = parser.parse(text);
    assert.notEqual(block, undefined);
    assert.equal(block.blockId, '1');
    assert.equal(block.content, text);
    assert.equal(block.applicationId, undefined);
    assert.equal(block.serviceId, undefined);
    assert.equal(block.receivingLtId, undefined);
    assert.equal(block.sessionNumber, undefined);
    return assert.equal(block.sequenceNumber, undefined);
  });
  return it('parses long input', () => {
    const text = 'F01SARACHBBAXXX80595256131234567890';
    const block = parser.parse(text);
    assert.notEqual(block, undefined);
    assert.equal(block.blockId, '1');
    assert.equal(block.content, text);
    assert.equal(block.applicationId, 'F');
    assert.equal(block.serviceId, '01');
    assert.equal(block.receivingLtId, 'SARACHBBAXXX');
    assert.equal(block.sessionNumber, '8059');
    return assert.equal(block.sequenceNumber, '5256131234567890');
  });
});
