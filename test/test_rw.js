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
var TypedError = require('error/typed');
var test = require('tape');

var LengthResult = require('../base').LengthResult;
var WriteResult = require('../base').WriteResult;
var ReadResult = require('../base').ReadResult;

var BangError = TypedError({
    type: 'bang',
    message: 'bang'
});

var dummyRW = {
    byteLength: function() {
        return new LengthResult.just(0);
    },
    writeInto: function(val, buffer, offset) {
        return new WriteResult.just(offset);
    },
    readFrom: function(buffer, offset) {
        return new ReadResult.just(offset, null);
    },
};

var brokenRW = {
    byteLength: function() {
        return new LengthResult(new Error('boom'));
    },
    writeInto: function(val, buffer, offset) {
        return new WriteResult(BangError(), offset);
    },
    readFrom: function(buffer, offset) {
        return new ReadResult(new Error('bork'), offset);
    },
};

test('testRW: checks cases', function t(assert) {
    assert.throws(function badTest() {
        testRW.cases(dummyRW, ['BAD'])(null, null);
    }, /invalid test case 0/, 'catches invalid test cases');
    assert.end();
});

test('testRW: unexpected errors', function t(assert) {
    var rwTest = testRW.cases(brokenRW, [
        [null, [0x00]]
    ]);
    runMockedTest(rwTest, function done(results) {
        assert.equal(results[0].name, 'no length error', 'expected "no length error"');
        assert.equal(results[0].actual.message, 'boom', 'expected actual "boom" error');

        assert.equal(results[1].name, 'no write error', 'expected "no write error"');
        assert.equal(results[1].actual.message, 'bang', 'expected actual "bang" error');
        assert.equal(results[2],
            'write error BangError: bang');
        assert.equal(results[3],
            '00\x1b[36m:\x1b[0m \x1b[31m\x1b[1m00\x1b[0m                                       \x1b[31m\x1b[1m.\x1b[0m');

        assert.equal(results[4].name, 'no read error', 'expected "no read error"');
        assert.equal(results[4].actual.message, 'bork', 'expected actual "bork" error');

        assert.equal(results[5],
            'read error Error: bork');
        assert.equal(results[6],
            '00\x1b[36m:\x1b[0m 00                                       \x1b[30m\x1b[1m.\x1b[0m');

        assert.end();
    });
});

test('testRW: error expectations', function t(assert) {
    var rwTest = testRW.cases(dummyRW, [
        {
            lengthTest: {
                value: null,
                error: {message: 'nope length'}
            },
            writeTest: {
                length: 0,
                value: null,
                error: {message: 'nope write'}
            },
            readTest: {
                bytes: [],
                error: {message: 'nope read'}
            }
        }
    ]);
    runMockedTest(rwTest, function done(results) {
        assert.equal(results[0].name, 'expected length error', 'expected "expected length error"');
        assert.equal(results[1].name, 'expected write error', 'expected "expected write error"');
        assert.equal(results[2].name, 'expected read error', 'expected "expected read error"');
        assert.end();
    });
});

function runMockedTest(t, callback) {
    var results = [];
    var assert = require('tape').Test('(mock)');
    assert.on('result', onResult);
    assert.once('end', onEnd);
    t(assert);
    function onResult(msg) {
        results.push(msg);
    }
    function onEnd() {
        assert.removeListener('result', onResult);
        callback(results);
    }
}
