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

var testRW = require('./lib/test_rw');
var test = require('tape');

var LengthResult = require('../base').LengthResult;
var WriteResult = require('../base').WriteResult;
var ReadResult = require('../base').ReadResult;
var brokenRW = {
    byteLength: function() {
        return LengthResult(new Error('boom'));
    },
    writeInto: function(val, buffer, offset) {
        return WriteResult(new Error('bang'), offset);
    },
    readFrom: function(buffer, offset) {
        return ReadResult(new Error('bork'), offset);
    },
};

var atoms = require('../atoms');
var SeriesRW = require('../series');

var tinyShortWord = SeriesRW(
    atoms.UInt8,
    atoms.UInt16BE,
    atoms.UInt32BE);

test('SeriesRW: tinyShortWord', testRW.cases(tinyShortWord, [
    [[0, 0, 0], [0x00,
                 0x00, 0x00,
                 0x00, 0x00, 0x00, 0x00]],

    // null values is ok
    {
        lengthTest: {
            value: null,
            length: 7,
        },
        writeTest: {
            value: null,
            bytes: [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
        }
    },

    // invalid arg to length/write
    {
        lengthTest: {value: 42, error: {
            type: 'invalid-argument',
            name: 'InvalidArgumentError',
            message: 'invalid argument, expected array or null',
            argType: 'number',
            argConstructor: 'Number'
        }},
        writeTest: {value: 42, error: {
            name: 'InvalidArgumentError',
            type: 'invalid-argument',
            message: 'invalid argument, expected array or null',
            argType: 'number',
            argConstructor: 'Number'
        }}
    }
]));

test('SeriesRW: passes error thru', testRW.cases(SeriesRW(brokenRW), [
    {
        lengthTest: {
            value: [1],
            error: {message: 'boom'}
        },
        writeTest: {
            value: [1],
            length: 1,
            error: {message: 'bang'}
        },
        readTest: {
            bytes: [1],
            error: {message: 'bork'}
        }
    }
]));
