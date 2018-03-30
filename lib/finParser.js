const peg = require('pegjs');

const syntax = `
    start = blocks:blocks [\\n]* {return blocks}

    blocks = block*

    block = "{" name:$[^:]+ ":" content:content "}" {return {name:name, content:content || undefined}}

    content = (emptyBlock / block / text )+
    
    emptyBlock = "{" name:$[^:]+ ":}" {return {name:name, content: undefined}}

    text = chars:$[^{}]+
    `;

module.exports.parse = (input) => {
  const result = peg.generate(syntax).parse(input);
  const map = {};
  result.forEach((block) => {
    if (map[`block${block.name}`]) {
      if (!map.extraBlocks) {
        map.extraBlocks = {};
      }
      if (map.extraBlocks[`block${block.name}`]) {
        throw Error(`too much extra blocks with type ${block.name}`);
      }
      map.extraBlocks[`block${block.name}`] = block;
    } else {
      map[`block${block.name}`] = block;
    }
  });
  return map;
};
