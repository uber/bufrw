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

var varint = require('../varint');

test('Unsigned VarInt', testRW.cases(varint.unsigned, [
    [0, [0x00]],
    [42, [0x2a]],
    [420, [
        0x80 | 0x03,
        0x24
    ]],
    [123456, [
        0x80 | 0x07,
        0x80 | 0x44,
        0x40
    ]],

    // invalid arg to length/write
    {
        lengthTest: {value: -1, error: {
            type: 'bufrw.invalid-argument',
            name: 'BufrwInvalidArgumentError',
            message: 'invalid argument, expected unsigned integer'
        }},
        writeTest: {value: -1, error: {
            name: 'BufrwInvalidArgumentError',
            type: 'bufrw.invalid-argument',
            message: 'invalid argument, expected unsigned integer',
        }}
    },

    // XXX truncated buffer
    {
        writeTest: {
            value: 420,
            length: 1,
            bytes: [0x80], // continue w/ zero'd 7 bits
            error: {
                name: 'BufrwShortBufferError',
                type: 'bufrw.short-buffer',
                message: 'expected at least 2 bytes, only have 1 @0',
                offset: 0,
                actual: 1,
                expected: 2,
            }
        },
        readTest: {
            bytes: [0x80], // continue w/ zero'd 7 bits
            error: {
                name: 'BufrwShortBufferError',
                type: 'bufrw.short-buffer',
                message: 'expected at least 2 bytes, only have 1 @[0:1]',
                offset: 0,
                endOffset: 1,
                actual: 1,
                expected: 2,
            }
        }
    }
]));
