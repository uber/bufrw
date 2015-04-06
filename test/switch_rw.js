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

var atoms = require('../atoms');
var SwitchRW = require('../switch');

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

var numbers = SwitchRW(atoms.UInt8, {
    0: atoms.UInt8,
    1: atoms.UInt16BE,
    2: atoms.UInt32BE
});

test('SwitchRW: numbers', testRW.cases(numbers, [
    [[0, 0x11], [0x00, 0x11]],
    [[1, 0x2222], [0x01, 0x22, 0x22]],
    [[2, 0x33333333], [0x02, 0x33, 0x33, 0x33, 0x33]],

    // invalid values
    {
        lengthTest: {
            value: [42, 42],
            error: {
                type: 'invalid-switch-value',
                message: 'invalid switch value 42',
                value: 42
            }
        },
        writeTest: {
            value: [42, 42],
            length: 2,
            error: {
                type: 'invalid-switch-value',
                message: 'invalid switch value 42',
                value: 42
            }
        },
        readTest: {
            bytes: [42, 42],
            error: {
                type: 'invalid-switch-value',
                message: 'invalid switch value 42',
                value: 42
            }
        }
    }
]));

test('SwitchRW: passes valrw error thru', testRW.cases(SwitchRW(brokenRW, {1: atoms.UInt8}), [
    {
        lengthTest: {
            value: [1, 2],
            error: {message: 'boom'}
        },
        writeTest: {
            value: [1, 2],
            length: 2,
            error: {message: 'bang'}
        },
        readTest: {
            bytes: [1, 2],
            error: {message: 'bork'}
        }
    }
]));

test('SwitchRW: passes datarw error thru', testRW.cases(SwitchRW(atoms.UInt8, {1: brokenRW}), [
    {
        lengthTest: {
            value: [1, 2],
            error: {message: 'boom'}
        },
        writeTest: {
            value: [1, 2],
            length: 2,
            error: {message: 'bang'}
        },
        readTest: {
            bytes: [1, 2],
            error: {message: 'bork'}
        }
    }
]));
