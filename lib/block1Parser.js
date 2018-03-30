module.exports.parse = (input) => {
  let result = {
    blockId: 1,
  };
  result.content = input;
  const pattern = /(.)(..)(.{12})(....)(.*)/;
  const match = pattern.exec(input);
  if (match != null) {
    result = {
      ...result,
      applicationId: match[1],
      serviceId: match[2],
      receivingLtId: match[3],
      sessionNumber: match[4],
      sequenceNumber: match[5],
    };
  }

  return result;
};
