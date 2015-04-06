// Copyright (c) 2015 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

'use strict';

var testRW = require('../test_rw');
var test = require('tape');

var LengthResult = require('../base').LengthResult;
var WriteResult = require('../base').WriteResult;
var ReadResult = require('../base').ReadResult;
var brokenRW = {
    byteLength: function() {
        return new LengthResult(new Error('boom'));
    },
    writeInto: function(val, buffer, offset) {
        return new WriteResult(new Error('bang'), offset);
    },
    readFrom: function(buffer, offset) {
        return new ReadResult(new Error('bork'), offset);
    },
};

var atoms = require('../atoms');
var VariableBufferRW = require('../variable_buffer_rw');

var buf1 = VariableBufferRW(atoms.UInt8);

test('VariableBufferRW: simple buf~1', testRW.cases(buf1, [
    {
        lengthTest: {length: 1, value: undefined},
        writeTest: {bytes: [0x00], value: undefined}
    },
    {
        lengthTest: {length: 1, value: null},
        writeTest: {bytes: [0x00], value: null}
    },
    [ Buffer([0x00, 0x88, 0xff]),
      [0x03, 0x00, 0x88, 0xff]
    ],

    // invalid value length/write errors
    {
        lengthTest: {value: {}, error: {
            type: 'invalid-argument',
            name: 'InvalidArgumentError',
            message: 'invalid argument, expected buffer, null, or undefined',
            argType: 'object',
            argConstructor: 'Object'
        }},
        writeTest: {value: {}, error: {
            name: 'InvalidArgumentError',
            type: 'invalid-argument',
            message: 'invalid argument, expected buffer, null, or undefined',
            argConstructor: 'Object',
            argType: 'object'
        }}
    },

    // truncated buffer
    {
        readTest: {
            bytes: [0x05, 0x01, 0x02, 0x03],
            error: {
                name: 'ShortBufferError',
                type: 'short-buffer',
                message: 'expected at least 5 bytes, only have 3 @[0:1]',
                offset: 0,
                endOffset: 1,
                actual: 3,
                // buffer: <Buffer 05 01 02 03>,
                expected: 5,
            }
        }
    }
]));

test('VariableBufferRW: passes sizerw error thru', testRW.cases(VariableBufferRW(brokenRW), [
    {
        lengthTest: {
            value: Buffer([2]),
            error: {message: 'boom'}
        },
        writeTest: {
            value: Buffer([2]),
            length: 2,
            error: {message: 'bang'}
        },
        readTest: {
            bytes: [1, 2],
            error: {message: 'bork'}
        }
    }
]));
