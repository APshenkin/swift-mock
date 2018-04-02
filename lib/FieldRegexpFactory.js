const { XRegExp } = require('xregexp');
const peg = require('pegjs');

const syntax = `
starts = p:parts {return {type:"sequence", optional:false, parts:p}}

parts = part*

part = field 
     / '[' p:parts ']'      {return {type:"sequence", optional:true, parts:p}}
     / l:literal            {return {type:"literal", value:l};}

field = n:number s:set       {return {type:"field", count:n, set:s}}
      / n:number '!' s:set   {return {type:"field", count:n, set:s, exact:true}}
      / lines:number '*' n:number s:set      {return {type:"field", count:n, set:s, lines:lines}}

literal = [^\\[\\]]

number = $[0-9]+
set = [ndxcaze]
`;

const parsePattern = peg.generate(syntax).parse;

class FieldNamesParser {
  static initClass() {
    this.fieldNamesRegExp = new XRegExp('\\((.*?)\\)');
  }

  static parseFieldNames(fieldNamesString) {
    if (fieldNamesString === '') {
      return [];
    }

    const names = [];
    this.fieldNamesRegExp.forEach(fieldNamesString, (match) => {
      const escaped = this.escape(match[1]);
      return names.push(escaped);
    });
    if (names.length === 0) {
      throw new Error(`Strange field names: ${fieldNamesString}`);
    }
    return names;
  }

  static escape(name) {
    return name.replace(new XRegExp(' ', 'g'), '_');
  }

  static unescape(name) {
    return name.replace(new XRegExp('_', 'g'), ' ');
  }
}

FieldNamesParser.initClass();

class FieldNames {
  constructor(fieldNamesString) {
    let names;
    this.fieldNamesString = fieldNamesString;
    const fieldNamesParts = this.fieldNamesString.split('$');
    this.names = [];
    Array.from(fieldNamesParts).forEach((fieldNamesPart) => {
      if (fieldNamesPart === '') { // special handling of empty list
        // eslint-disable-next-line no-param-reassign
        fieldNamesPart = '(Value)';
      }
      names = FieldNamesParser.parseFieldNames(fieldNamesPart);
      this.names.push(names);
    });
    this.flatNames = [];
    Array.from(this.names).forEach((section) => {
      Array.from(section).forEach((name) => {
        this.flatNames.push(name);
      });
    });
  }
}

class MandatoryFieldDetector {
  containsMandatory(tree) {
    return this.visitNode(tree);
  }

  visitNode(node) {
    switch (node.type) {
      case 'literal':
        return false;
      case 'sequence':
        if (!node.optional) {
          return Array.from(node.parts).some((child) => {
            if (this.visitNode(child)) {
              return true;
            }
            return false;
          });
        }
        return false;
      case 'field':
        return true;
      default:
        throw new Error(`Unknown node type ${node.type}: ${node}`);
    }
  }
}

// Depth-first, right-to-left traverser
class FieldFinder {
  constructor(predicate) {
    this.predicate = predicate;
  }

  findPath(tree) {
    const path = [];
    this.visitNode(tree, path);
    return path;
  }

  visitNode(node, path) {
    switch (node.type) {
      case 'literal':
        return false;
      case 'field':
        if (this.predicate(node)) {
          path.push(node);
          return true;
        }
        return false;

      case 'sequence':
        path.push(node);
        for (let i = node.parts.length - 1; i >= 0; i -= 1) {
          const child = node.parts[i];
          if (this.visitNode(child, path)) {
            return true;
          }
        }
        path.pop();
        return false;
      default:
        throw new Error(`Unknown node type ${node.type}: ${node}`);
    }
  }
}

class PatternNameInjector {
  injectNames(names, parsedPattern) {
    this.remainingNames = names;
    this.pattern = parsedPattern;
    const result = this.visitNode(parsedPattern);
    if (this.remainingNames.length > 0) {
      throw new Error(`Remaining names after name injection: ${this.remainingNames.toString()}`);
    }
    return result;
  }

  visitNode(node) {
    switch (node.type) {
      case 'literal':
        return this.visitLiteral(node);
      case 'sequence':
        Array.from(node.parts).forEach((child) => {
          this.visitNode(child);
        });
        return node;
      case 'field':
        return this.visitField(node);
      default:
        throw new Error(`Unknown node type ${node.type}: ${node}`);
    }
  }

  visitLiteral(node) {
    if ((node.value === 'N') && (this.remainingNames[0] != null) && /(_|\b)sign(_|\b)/i.test(this.remainingNames[0])) { // the Sign
      let name;
      // eslint-disable-next-line prefer-const
      [name, ...this.remainingNames] = Array.from(this.remainingNames);
      // eslint-disable-next-line no-param-reassign
      node.name = name;
    }
    return node;
  }

  visitField(node) {
    if (node.set === 'e') { // space doesnt' get name
      return node;
    }
    this.attachNameToField(node);
    return node;
  }

  attachNameToField(node) {
    let name;
    if (this.remainingNames.length === 0) {
      return;
    }
    if (this.remainingNames.length === 1) {
      const righmostFieldPath = new FieldFinder(() => true).findPath(this.pattern);
      const currentFieldPath = new FieldFinder((field => field === node)).findPath(this.pattern);
      const length = Math.min(righmostFieldPath.length, currentFieldPath.length);
      let i = 0;
      let commonAncestor = null;
      while ((i < length) && (righmostFieldPath[i] === currentFieldPath[i])) {
        commonAncestor = righmostFieldPath[i];
        i += 1;
      }
      if (i < length) {
        // rewrite the pattern tree to name the remaining fields as a sequence
        if (commonAncestor.type !== 'sequence') {
          throw new Error(`Common ancestor should be a sequence: ${JSON.stringify(commonAncestor)}`);
        }
        const left = commonAncestor.parts.indexOf(currentFieldPath[i]);
        const right = commonAncestor.parts.indexOf(righmostFieldPath[i]);
        if ((left === -1) || (right === -1)) {
          throw new Error(`Left: ${left} Right: ${right}`);
        }
        const newNode = {
          type: 'sequence',
          optional: false,
          parts: commonAncestor.parts.slice(left, +right + 1 || undefined),
        };
        commonAncestor.parts = commonAncestor.parts
          .slice(0, left)
          .concat([newNode])
          .concat(commonAncestor.parts.slice(right + 1));
        // eslint-disable-next-line no-param-reassign
        node = newNode;
      }
    }
    // eslint-disable-next-line prefer-const
    [name, ...this.remainingNames] = Array.from(this.remainingNames);
    // eslint-disable-next-line no-param-reassign
    node.name = name;
  }
}


class FieldRegexpFactory {
  createRegexp(pattern, fieldNamesString) {
    let head;
    const patternParts = pattern.split('$');
    const fieldNames = new FieldNames(fieldNamesString);
    if (patternParts.length !== fieldNames.names.length) {
      throw new Error('Different count of lines in pattern and field names.');
    }

    let regexps = [];
    for (let i = 0; i < patternParts.length; i += 1) {
      const patternPart = patternParts[i];
      const fieldNamesSection = fieldNames.names[i];
      regexps.push(this.createRegexpCore(patternPart, fieldNamesSection));
    }

    const mandatoryFieldDetector = new MandatoryFieldDetector();
    // eslint-disable-next-line prefer-const
    [head, ...regexps] = Array.from(regexps);
    let result = head.regexp;
    const leftMandatory = mandatoryFieldDetector.containsMandatory(head.tree);
    Array.from(regexps).forEach((regexpPart) => {
      const rightMandatory = mandatoryFieldDetector.containsMandatory(regexpPart.tree);
      if (leftMandatory && rightMandatory) {
        result = `${result}\n${regexpPart.regexp}`;
      } else {
        // not 100% correct -- the newlines should be parts of the sequences
        // -- [a]$b --> (a\n)?b instead of (a)?(\n)?b
        result += `(\n)?${regexpPart.regexp}`;
      }
    });

    result = `^${result}$`;
    return result;
  }

  createRegexpCore(pattern, fieldNames) {
    let prefix;
    if (pattern[0] === ':') { // make the leading colon optional not to enforce it in the field value
      prefix = ':?';
      // eslint-disable-next-line no-param-reassign
      pattern = pattern.substring(1);
    }

    const parsedPattern = parsePattern(pattern);
    const injector = new PatternNameInjector();
    injector.injectNames(fieldNames, parsedPattern);
    let regexp = this.visitNode(parsedPattern);
    if (prefix != null) {
      regexp = prefix + regexp;
    }
    return { tree: parsedPattern, regexp };
  }

  visitNodes(array) {
    const result = (Array.from(array).map(node => this.visitNode(node))).join('');
    return result;
  }

  visitNode(node) {
    switch (node.type) {
      case 'literal':
        return this.visitLiteral(node);
      case 'sequence': {
        const rxOptional = (node.optional) ? '?' : '';
        const rxName = (node.name != null) ? `?<${node.name}>` : '';
        const value = this.visitNodes(node.parts);

        if (!node.optional && (node.name == null)) { // no need to add parentheses
          return value;
        }

        if ((node.parts.length === 1) && (node.name == null)) {
          if (node.optional && /^\(.*\)$/.test(value)) {
            return `${value}?`; // there are already parentheses
          }
        }

        return `(${rxName}${value})${rxOptional}`;
      }
      case 'field':
        return this.visitField(node);
      default:
        throw new Error(`Unknown node type ${node.type}: ${node}`);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  visitField(field) {
    let result;
    const { count } = field;
    const { set } = field;
    const lines = field.lines != null ? field.lines : 1;
    const exact = field.exact != null ? field.exact : false;

    const rxSet = (() => {
      switch (set) {
        case 'e':
          return ' ';
        case 'z':
          return '[\\s\\S]';
        default:
          return '.';
      }
    })();
    const rxCount = exact ? `{${count}}` : `{1,${count}}`;
    const rxName = (field.name != null) ? `?<${field.name}>` : '';
    const rxLines = (lines > 1) ? `(\n${rxSet}${rxCount}){0,${lines - 1}}` : '';

    if (rxName !== '') {
      result = `(${rxName}${rxSet}${rxCount}${rxLines})`;
    } else {
      result = `${rxSet}${rxCount}${rxLines}`;
    }
    return result;
  }

  // eslint-disable-next-line class-methods-use-this
  visitLiteral(node) {
    if (node.name != null) {
      return `(?<${node.name}>${node.value})`;
    }
    return node.value;
  }
}

class FieldContentParser {
  constructor(regexpSt, fieldNames) {
    this.regexpSt = regexpSt;
    this.fieldNames = fieldNames;
    this.regexp = new XRegExp(this.regexpSt);
  }

  parse(fieldValue) {
    const match = this.regexp.xexec(fieldValue);
    if ((match == null)) {
      throw new Error(`Unable to parse '${fieldValue}' with regexp '${this.regexpSt}'.`);
    }

    const result = {};
    Array.from(this.fieldNames.flatNames).forEach((fieldName) => {
      if (match[fieldName] != null) {
        result[FieldNamesParser.unescape(fieldName)] = match[fieldName];
      }
    });

    return result;
  }
}

class FieldParser {
  constructor(fieldPatterns) {
    this.fieldPatterns = fieldPatterns;
    this.fieldParsers = {};
    this.regexpFactory = new FieldRegexpFactory();
  }

  parse(fieldHeader, fieldContent) {
    if ((this.fieldParsers[fieldHeader] == null)) {
      const fieldMetadata = this.fieldPatterns[fieldHeader];
      if (fieldMetadata == null) {
        throw new Error(`Metadata not found for field ${fieldHeader}.`);
      }

      if (fieldHeader === '77E') {
        throw new Error('Parsing of field 77E is not supported.'); // this field has a very strange pattern and
        // multiple fields with the same name
      }

      const regexpSt = this.regexpFactory
        .createRegexp(fieldMetadata.pattern, fieldMetadata.fieldNames);
      // eslint-disable-next-line max-len
      this.fieldParsers[fieldHeader] = new FieldContentParser(regexpSt, new FieldNames(fieldMetadata.fieldNames));
    }
    const parser = this.fieldParsers[fieldHeader];
    const result = parser.parse(fieldContent);
    return result;
  }
}

/* eslint-disable no-useless-escape */

// n - [0-9] -   Digits
// d - [0-9]+,[0-9]* problem with total length   -   Digits with decimal comma
// a - [A-Z]  -   Uppercase letters
// c - [0-9A-Z] -   Uppercase alphanumeric
// e - [ ]   -   Space
// x - [0-9a-zA-Z/\-\?:\(\)\.,&apos;\+ ]   -   SWIFT character set
// z - [0-9a-zA-Z!&quot;%&amp;\*;&lt;&gt; \.,\(\)/=&apos;\+:\?@#&#x0d;&#x0a;\{\-_] - ext. charset
// //h      -   Uppercase hexadecimal
// //y      -   Upper case level A ISO 9735 characters
//
//
// specials:
// ISIN
// N
// //
// ,
// /
//
// new line:
// $

module.exports.FieldRegexpFactory = FieldRegexpFactory;
module.exports.FieldFinder = FieldFinder;
module.exports.FieldNamesParser = FieldNamesParser;
module.exports.FieldContentParser = FieldContentParser;
module.exports.FieldParser = FieldParser;
module.exports.FieldNames = FieldNames;
