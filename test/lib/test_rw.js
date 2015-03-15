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

var color = require('ansi-color').set;
var hex = require('hexer');
var util = require('util');
var intoBufferTuple = require('../../interface').intoBufferTuple;
var fromBufferTuple = require('../../interface').fromBufferTuple;

module.exports.cases = testCases;

/* jshint maxparams:6 */

function testCases(rw, cases) {
    return function runTestCases(assert, done) {
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

            var err, res, buf;

            if (testCase.lengthTest) {
                err = lengthTest(assert, rw, testCase.lengthTest);
                if (testCase.lengthTest.error) {
                    assert.deepEqual(
                        copyErr(err, testCase.lengthTest.error),
                        testCase.lengthTest.error, 'expected length error');
                } else {
                    assert.ifError(err, 'no length error');
                }
            }

            if (testCase.writeTest) {
                res = writeTest(assert, rw, testCase.writeTest);
                err = res[0];
                buf = res[1];
                if (testCase.writeTest.error) {
                    assert.deepEqual(
                        copyErr(err, testCase.writeTest.error),
                        testCase.writeTest.error, 'expected write error');
                } else {
                    if (err) hexdump(err, buf, 'write error at');
                    assert.ifError(err, 'no write error');
                }
            }

            if (testCase.readTest) {
                res = readTest(assert, rw, testCase.readTest);
                err = res[0];
                buf = res[1];
                if (testCase.readTest.error) {
                    assert.deepEqual(
                        copyErr(err, testCase.readTest.error),
                        testCase.readTest.error, 'expected read error');
                } else {
                    if (err) hexdump(err, buf, 'read error at');
                    assert.ifError(err, 'no read error');
                }
            }
        }

        (done || assert.end)();
    };
}

function lengthTest(assert, rw, testCase) {
    var val = testCase.value;
    var res = rw.byteLength(val);
    if (res.err) {
        return res.err;
    }
    assert.deepEqual(res && res.length, testCase.length, util.format('length: %j', val));
    return null;
}

function writeTest(assert, rw, testCase) {
    var val = testCase.value;
    var got = Buffer(testCase.bytes ? testCase.bytes.length : testCase.length || 0);
    got.fill(0);
    var tup = intoBufferTuple(rw, got, val);
    var err = tup[0];
    if (err) {
        return [err, got];
    }
    var buf = Buffer(testCase.bytes);
    assert.deepEqual(got, buf, util.format('write: %j', val));
    return [null, got];
}

function readTest(assert, rw, testCase) {
    var buffer = Buffer(testCase.bytes);
    var tup = fromBufferTuple(rw, buffer);
    var err = tup[0];
    var got = tup[1];
    if (!err && got === undefined) {
        err = new Error('Expected to have read a value');
    }
    if (err) {
        return [err, got];
    }
    var val = testCase.value;
    assert.deepEqual(got, val, util.format('read: %j', val));
    if (typeof val === 'object') {
        var gotConsName = got && got.constructor && got.constructor.name;
        var valConsName = val && val.constructor && val.constructor.name;
        assert.equal(gotConsName, valConsName,
            'expected ' + valConsName + ' constructor');
    }
    return [null, got];
}

function hexHighlight(buffer, highlights) {
    var highlight = {};
    var trail = '';

    Object.keys(highlights).forEach(function eachHighlight(name) {
        var h = highlights[name];
        highlight[h.offset] = h.color;
    });

    var opts = {
        decorateHexen: decorate,
        decorateHuman: decorate
    };
    var out = hex(buffer, opts);

    Object.keys(highlights).forEach(function eachHighlight(name) {
        var h = highlights[name];
        var off = h.offset.toString(16);
        off = '0x' + pad('0', off, opts.offsetWidth);
        trail += util.format('- %s: %s\n',
            h.desc || name,
            color(off, h.color));
    });

    out += '\n' + trail;
    out = out.replace(/\n+$/, '');
    return out;
    function decorate(bufOffset, screenOffset, str) {
        var c = highlight[bufOffset];
        if (c) str = color(str, c);
        return str;
    }
}

function pad(c, s, width) {
    while (s.length < width) s = c + s;
    return s;
}

function hexdump(err, buffer, desc) {
    var highlights = {};
    var offset = err && err.offset;
    if (typeof offset === 'number') {
        highlights.end = {
            desc: desc,
            offset: err && err.offset,
            color: 'red+bold'
        };
    }
    console.log(hexHighlight(buffer, highlights));
    var errname = err.type ? err.name : err.constructor.name;
    console.log(util.format('- %s: %s', errname, err.message));
}

function copyErr(err, tmpl) {
    var out = {};
    if (err) {
        Object.keys(tmpl).forEach(function(key) {
            out[key] = err[key];
        });
    }
    return out;
}
