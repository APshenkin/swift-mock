const peg = require('pegjs');
const { FieldParser } = require('./FieldRegexpFactory');

const syntax = `
    start = eol fields:(complexField/simpleField)* {return fields}

    simpleField = header:fieldHeader fieldText:content {
                          return {
                            type: header.type,
                            option: header.option,
                            fieldValue: fieldText,
                            content: header.text+fieldText
                          };
                        }
    
    complexField = header:fieldHeader ":" qualifier:$(!"/" .)+ "//" fieldText:content {
                          var fieldValue = ":"+qualifier+"//"+fieldText;
                          return {
                            type: header.type,
                            option: header.option,
                            fieldValue: fieldValue,
                            content: header.text+fieldValue
                          };
                        }
    
    
    fieldHeader = ":" type:$(digit digit) option:letter? ":" {return {type: type, option: option === null ? undefined : option, text: text()}}
    
    content = text:$(!((eol ":")/(eol "-")) .)* ((eol &":")/(eol "-")) {return text}
    
    eol = "\\n"
    
    digit = [0-9]
    
    letter = [a-zA-Z]
    `;

module.exports.parse = (input, fieldPatterns) => {
  if (typeof input.content[0] === 'object') {
    const result = {};
    input.content.forEach((field) => {
      let { content } = field;
      if (Array.isArray(field.content) && field.content.length === 1) {
        // eslint-disable-next-line prefer-destructuring
        content = field.content[0];
      }
      result[field.name] = content;
    });
    return result;
  }
  const result = peg.generate(syntax).parse(input.content[0]);

  const fieldParser = new FieldParser(fieldPatterns);

  Array.from(result).forEach((field, index) => {
    const fieldCode = field.type + (field.option != null ? field.option : '');
    const parsedField = fieldParser.parse(fieldCode, field.fieldValue);
    result[index].ast = parsedField;
  });

  return result;
};

