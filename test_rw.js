// Copyright (c) 2015 Uber Technologies, Inc.

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

var hexdiff = require('hexer/diff');
var util = require('util');
var intoBufferResult = require('./interface').intoBufferResult;
var fromBufferResult = require('./interface').fromBufferResult;
var formatError = require('./interface').formatError;

module.exports.cases = testCases;

function testCases(rw, cases) {
    var self = function runTestCases(assert, done) {
        self = Object.create(self);
        self.assert = assert;
        self.rw = rw;
        for (var i = 0; i < cases.length; i++) {
            var testCase;
            if (Array.isArray(cases[i])) {
                var value = cases[i][0];
                var bytes = cases[i][1];
                testCase = {
                    lengthTest: {
                        length: bytes.length,
                        value: value
                    },
                    writeTest: {
                        bytes: bytes,
                        value: value
                    },
                    readTest: {
                        bytes: bytes,
                        value: value
                    }
                };
            } else if (typeof cases[i] !== 'object') {
                throw new Error('invalid test case ' + i);
            } else {
                testCase = cases[i];
            }

            if (testCase.lengthTest) lengthTest(self, testCase.lengthTest);
            if (testCase.writeTest) writeTest(self, testCase.writeTest);
            if (testCase.readTest) readTest(self, testCase.readTest);
        }

        (done || assert.end)();
    };
    self.hexdumpStream = process.stdout;
    self.hexdump = function hexdumpBuffer(desc, err) {
        self.hexdumpStream.write(util.format('%s: %s',
            desc, formatError(err, {color: true})));
    };
    self.assert = null;
    self.rw = null;
    return self;
}

function lengthTest(self, testCase) {
    var val = testCase.value;
    var res = self.rw.byteLength(val);
    if (res.err) {
        if (testCase.error) {
            self.assert.deepEqual(
                copyErr(res.err, testCase.error),
                testCase.error, 'expected length error');
        } else {
            self.assert.ifError(res.err, 'no length error');
        }
    } else if (testCase.error) {
        self.assert.fail('expected length error');
    } else {
        self.assert.deepEqual(res && res.length, testCase.length, util.format('length: %j', val));
    }
}

function writeTest(self, testCase) {
    var val = testCase.value;
    var got = Buffer(testCase.bytes ? testCase.bytes.length : testCase.length || 0);
    got.fill(0);
    var res = intoBufferResult(self.rw, got, val);
    var err = res.error;
    if (err) {
        if (testCase.error) {
            self.assert.deepEqual(
                copyErr(err, testCase.error),
                testCase.error, 'expected write error');
        } else {
            self.hexdump('write error', err);
            self.assert.ifError(err, 'no write error');
        }
    } else if (testCase.error) {
        self.assert.fail('expected write error');
    } else {
        var desc = util.format('write: %j', val);
        var buf = Buffer(testCase.bytes);
        // istanbul ignore if
        if (got.toString('hex') !== buf.toString('hex')) {
            self.assert.comment('expected v actual:\n' +
                hexdiff(buf, got, {colored: true}));
            self.assert.fail(desc);
        } else {
            self.assert.pass(desc);
        }
    }

}

function readTest(self, testCase) {
    var buffer = Buffer(testCase.bytes);
    var res = fromBufferResult(self.rw, buffer);
    var err = res.error;
    var got = res.value;
    if (err) {
        if (testCase.error) {
            self.assert.deepEqual(
                copyErr(err, testCase.error),
                testCase.error, 'expected read error');
        } else {
            // istanbul ignore else
            if (!got && err.buffer) got = err.buffer;
            // istanbul ignore else
            if (Buffer.isBuffer(got)) self.hexdump('read error', err);
            self.assert.ifError(err, 'no read error');
        }
    } else if (testCase.error) {
        self.assert.fail('expected read error');
    } else {
        var val = testCase.value;
        self.assert.deepEqual(got, val, util.format('read: %j', val));
        if (typeof val === 'object') {
            var gotConsName = got && got.constructor && got.constructor.name;
            var valConsName = val && val.constructor && val.constructor.name;
            self.assert.equal(gotConsName, valConsName,
                'expected ' + valConsName + ' constructor');
        }
    }
}

function copyErr(err, tmpl) {
    var out = {};
    // istanbul ignore else
    if (err) {
        Object.keys(tmpl).forEach(function(key) {
            out[key] = err[key];
        });
    }
    return out;
}
