const assert = require('assert');

const eol = require('eol');

const fs = require('fs');

const Swift = require('../lib/swift');

describe('Complete swift parser', () => {
  it('parses full swift, with complex fields, msgType: CADRIP, should pass with no error', () => {
    const swift = new Swift();
    let fileAsString = fs.readFileSync(
      './tests/swiftsExamples/MT564_CADRIP501326_901901370691_852646_20210831123127.txt',
      { encoding: 'UTF-8' },
    );

    fileAsString = eol.lf(fileAsString);

    const regex = new RegExp('(^{1.+-}$)', 'sm');
    const match = regex.exec(fileAsString);
    const result = swift.parse(match[0]);
    assert.equal(typeof result.block4[0], 'object');
  });

  it('parses full swift, with complex fields, msgType: CANOFF, should pass with no error', () => {
    const swift = new Swift();
    let fileAsString = fs.readFileSync(
      './tests/swiftsExamples/MT564_CANOFF4996_901901370691_852646_20210721161304.txt',
      { encoding: 'UTF-8' },
    );

    fileAsString = eol.lf(fileAsString);

    const regex = new RegExp('(^{1.+-}$)', 'sm');
    const match = regex.exec(fileAsString);
    const result = swift.parse(match[0]);
    assert.equal(typeof result.block4[0], 'object');
  });
});
