# SWIFT Mock
JavaScript SWIFT mock that can emulate SWIFT network, parse and generate SWIFT [ISO 15022](http://www.iso15022.org/) messages. Swift parser was taked from [swift-parser](https://github.com/pstodulka/swift-parser), but it was refactored (moving to ES6 syntax, update API). Mock and message generator were created from scratch.

[![Test Status](https://travis-ci.org/APshenkin/swift-mock.svg?branch=master)](https://travis-ci.org/APshenkin/swift-mock)

## Features
* parse FIN MT message defined by the [ISO 15022](http://www.iso15022.org/) standard
* generate FIN MT messages
* emulate SWIFT network

## Limitations
* cannot parse field `77E` - message _MT n98 Proprietary Message_

## Installation
```Shell
$ npm install --save swift-mock
```

## Usage
```JavaScript
const Swift = require('swift-mock');

const swift = new Swift();


swift.on((msg) => {
    return msg.block1.receivingLtId === 'RMSFGB2LAXXX' && msg.block2.msgType === '502'
}, (msg) => {
    return [
        { block: 1, data: { ...msg.block1, sequenceNumber: 666666 } },
        { block: 2, data: { ...msg.block2 } },
        { block: 4, data: msg.extraBlocks.block4 },
        { block: 5, data: { ...msg.block5 } }]
})

swift.on((msg) => {
    return msg.block1.receivingLtId === 'RMSFGB2LAXXX' && msg.block2.msgType === '509'
}, (msg) => {
    return [
        { block: 1, data: { ...msg.block1, sequenceNumber: 300200 } },
        { block: 2, data: { ...msg.block2 } },
        { block: 4, data: msg.extraBlocks.block4 },
        { block: 5, data: { ...msg.block5 } },
        { block: 'S', data: { ...msg.blockS } }]
})


swift.run();

```

## API

### new SwiftParser([options])
Initializes a new instance of `SWIFT Mock` using given metadata. If `metadata` is omitted, the default metadata is used.

#### options Parameters

* `in` - folder, from where mock will take messages (default: `./in`)
* `out` - folder, where mock will store answers for messages (default: `./out`)
* `logLevel` - logging level (default: 0)
* `fieldPatterns` - path to block 4 field patterns
* `saveIncomingMessages` - save parsed incoming messages in memory (default: `false`)
* `delete` - delete incoming messages after reading (default: `false`)
* `elastic` - format log messages in Elastic format or not (default: `false`)
* `persistent` - indicates whether the process should continue to run as long as files are being watched. (default: `true`)

### swift.parse(swift)
Parses the `swift` message. The line breaks of `swift` must be in Unix format (`\n`).
```
const Swift = require('./parser/swift');
const swift = new Swift();
const fs = require('fs');

const file = fs.readFileSync('./files/SWIFT_509.fin', { encoding: 'UTF-8' });

const ast = swift.parse(file)
```

### swift.generate(data)
Generate swift message. data should be array of blocks. Blocks order will be the same as in array.
```
const Swift = require('./parser/swift');
const swift = new Swift();

const message = swift.generate([
  {
    block: 1, data: {
      "applicationId": "F",
      "serviceId": "21",
      "receivingLtId": "RMSFGB2LAXXX",
      "sessionNumber": "0094",
      "sequenceNumber": "049783"
    }
  },
  {
    block: 2, data: {
      "direction": "O",
      "msgType": "509",
      "inputTime": "1606",
      "inputDate": "170725",
      "bic": "SOPPLULXAXXX",
      "sessionNumber": "5416",
      "sequenceNumber": "290317",
      "outputDate": "170725",
      "outputTime": "1506",
      "prio": "N"
    }
  },
  {
    block: 3, data: {
      "108": "MF00000000000022"
    }
  },
  {
    block: 4, data: [
      {
        "type": "16",
        "option": "R",
        "fieldValue": "GENL",
        "content": ":16R:GENL"
      },
      {
        "type": "20",
        "option": "C",
        "fieldValue": ":SEME//MF00000000000022",
        "content": ":20C::SEME//MF00000000000022"
      },
      {
        "type": "16",
        "option": "S",
        "fieldValue": "SETDET",
        "content": ":16S:SETDET"
      }
    ]
  },
  {
    block: 5, data: {
      "MAC": "00000000",
      "CHK": "11E37804E6A0"
    }
  },
  {
    block: 'S', data: {
      "SAC": undefined,
      "COP": "P"
    }
  }
]);

```

Below are rules how to build blocks.

#### Block 1
Data should be a object with required fields or string
```
let block = {
  block: 1, data: {
    "applicationId": "F",
    "serviceId": "21",
    "receivingLtId": "RMSFGB2LAXXX",
    "sessionNumber": "0094",
    "sequenceNumber": "049783"
  }
}

or

let block = 'F21RMSFGB2LAXXX0094002855'
```

#### Block 2
Data should be a object with required fields or string
```
let block = {
  block: 2, data: {
    "direction": "O",
    "msgType": "509",
    "inputTime": "1606",
    "inputDate": "170725",
    "bic": "SOPPLULXAXXX",
    "sessionNumber": "5416",
    "sequenceNumber": "290317",
    "outputDate": "170725",
    "outputTime": "1506",
    "prio": "N"
  }
}

or

let block = 'I502SOPPLULXXXXXN'
```

#### Block 3
Data should be an object with depth === 1
```
let block = {
  block: 3, data: {
    "108": "MF00000000000022"
  }
}
```

#### Block 4
Data should be an object with depth === 1 or should be an array of fields in valid format.
There is two strategy to take values:
* content
* combine

content:
```
let block = {
  block: 4, data: {
    "177": "1707251406",
    "451": "0"
  }
}

or

//content strategy
let block = {
  block: 4, data: [
    {
      "content": ":16R:GENL"
    },
    {
      "content": ":20C::SEME//MF00000000000022"
    },
    {
      "content": ":16S:SETDET"
    }
  ]
}

or

//combine stategy
let block = {
  block: 4, strategy: 'combine', data: [
    {
      "type": "16",
      "option": "R",
      "fieldValue": "GENL"
    },
    {
      "type": "20",
      "option": "C",
      "fieldValue": ":SEME//MF00000000000022"
    },
    {
      "type": "16",
      "option": "S",
      "fieldValue": "SETDET"
    }
  ]
}
```

#### Block 5
Data should be an object with depth === 1
```
let block = {
  block: 5, data: {
    "MAC": "00000000",
    "CHK": "577F2F5104EA"
  }
}
```

#### Block S
Data should be an object with depth === 1
```
let block = {
  block: 'S', data: {
    "SAC": undefined,
    "COP": "P"
  }
}
```

Values that are `undefined` will displays like this `{SAC:}`


### swift.on(predicate, callback)
Create a listener that will check incoming messages by predicate function and do callback.
For `swift.on` only first passed predicate will be applied
* predicate - function
* callback - function
```
swift.on((msg) => {
    return msg.block1.receivingLtId === 'RMSFGB2LAXXX' && msg.block2.msgType === '509'
}, (msg) => {
    return [
        { block: 1, data: { ...msg.block1, sequenceNumber: 300200 } },
        { block: 2, data: { ...msg.block2 } },
        { block: 4, data: msg.extraBlocks.block4 },
        { block: 5, data: { ...msg.block5 } },
        { block: 'S', data: { ...msg.blockS } }]
})
```

###swift.onEvery(predicate, callback)
Create a listener that will check incoming messages by predicate function and do callback.
For `swift.onEvery` every passed predicate will be applied
* predicate - function
* callback - function
```
swift.on((msg) => {
    return msg.block1.receivingLtId === 'RMSFGB2LAXXX' && msg.block2.msgType === '509'
}, (msg) => {
    return [
        { block: 1, data: { ...msg.block1, sequenceNumber: 300200 } },
        { block: 2, data: { ...msg.block2 } },
        { block: 4, data: msg.extraBlocks.block4 },
        { block: 5, data: { ...msg.block5 } },
        { block: 'S', data: { ...msg.blockS } }]
})
```

### swift.send(message, outPath)
Place swift message to outPath folder. Message could be a string or array of blocks.
* message - string or array of blocks
* filenamePrefix - outgoing filename prefix (default: '');
* outPath - output folder path (default: `this.outputFolder`);

```
swift.send([
  {
    block: 1, data: {
      "applicationId": "F",
      "serviceId": "21",
      "receivingLtId": "RMSFGB2LAXXX",
      "sessionNumber": "0094",
      "sequenceNumber": "049783"
    }
  },
  {
    block: 2, data: {
      "direction": "O",
      "msgType": "509",
      "inputTime": "1606",
      "inputDate": "170725",
      "bic": "SOPPLULXAXXX",
      "sessionNumber": "5416",
      "sequenceNumber": "290317",
      "outputDate": "170725",
      "outputTime": "1506",
      "prio": "N"
    }
  }])
```

### swift.run()
Start swift listener

### swift.close()
Stop swift listener

### swift.cleanMessages()
Clean saved incoming messages

### swift.getMessages()
Get incoming messages

### swift.cleanListeners()
Clean listeners

## Current State
swift-mock is in its early days. Any feedback, issues, and pull requests are welcome.

## License
MIT © [Apshenkin](https://github.com/APshenkin)
