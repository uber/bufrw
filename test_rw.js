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
            new RWTestCase(assert, rw, testCase).run();
        }
        (done || assert.end)();
    };
    self.assert = null;
    self.rw = null;
    return self;
}

function RWTestCase(assert, rw, testCase) {
    var self = this;
    self.assert = assert;
    self.rw = rw;
    self.testCase = testCase;
    self.hexdumpStream = process.stdout;
}

RWTestCase.prototype.run = function run() {
    var self = this;
    if (self.testCase.lengthTest) self.runLengthTest();
    if (self.testCase.writeTest) self.runWriteTest();
    if (self.testCase.readTest) self.runReadTest();
};

RWTestCase.prototype.runLengthTest = function runLengthTest() {
    var self = this;
    var testCase = self.testCase.lengthTest;
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
};

RWTestCase.prototype.runWriteTest = function runWriteTest() {
    var self = this;
    var testCase = self.testCase.writeTest;
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
};

RWTestCase.prototype.runReadTest = function runReadTest() {
    var self = this;
    var testCase = self.testCase.readTest;
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
};

RWTestCase.prototype.hexdump = function hexdump(desc, err) {
    var self = this;
    var dump = util.format('%s: %s',
        desc, formatError(err, {color: true}));
    self.hexdumpStream.write(dump);
};

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
