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
var bufrw = require('bufrw');

module.exports.cases = testCases;

/* jshint maxparams:6 */

function testCases(rw, cases) {
    return function runTestCases(assert, done) {
        if (!done) done = assert.end;
        nextCase(0);

        function nextCase(caseI) {
            if (caseI >= cases.length) {
                done();
                return;
            }

            var testCase;
            if (Array.isArray(cases[caseI])) {
                testCase = {
                    value: cases[caseI][0],
                    bytes: cases[caseI][1]
                };
            } else if (typeof cases[caseI] !== 'object') {
                throw new Error('invalid test case ' + caseI);
            } else {
                testCase = cases[caseI];
            }

            readTest(assert, rw, testCase, eatReadError);

            function eatReadError(err) {
                assert.ifError(err, 'no read error');
                writeTest(assert, rw, testCase, eatWriteError);
            }

            function eatWriteError(err) {
                assert.ifError(err, 'no write error');
                nextCase(caseI + 1);
            }
        }

    };
}

function readTest(assert, rw, testCase, callback) {
    if (!callback) callback = assert.end;
    var buffer = Buffer(testCase.bytes);
    var tup = bufrw.fromBufferTuple(rw, buffer);
    var err = tup[0];
    var got = tup[1];
    if (err) {
        hexdump(err, buffer, 'read error at');
        callback(err);
    } else if (got === undefined) {
        callback(new Error('Expected to have read a value'));
    } else {
        var val = testCase.value;
        assert.deepEqual(got, val, util.format('read: %j', val));
        if (typeof val === 'object') {
            assert.equal(got.constructor.name, val.constructor.name,
                'expected ' + val.constructor.name + ' constructor');
        }
        callback();
    }
}

function writeTest(assert, rw, testCase, callback) {
    if (!callback) callback = assert.end;
    var val = testCase.value;
    var tup = bufrw.toBufferTuple(rw, val);
    var err = tup[0];
    var got = tup[1];
    if (err) {
        if (got) {
            hexdump(err, got, 'write error at');
        }
        callback(err);
    } else if (!Buffer.isBuffer(got)) {
        callback(new Error('expected to have wrote a buffer'));
    } else {
        var buf = Buffer(testCase.bytes);
        assert.deepEqual(got, buf, util.format('write: %j', val));
        callback();
    }
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
    console.log(hexHighlight(buffer, {
        end: {
            desc: desc,
            offset: err && err.offset,
            color: 'red+bold'
        }
    }));
    var errname = err.type ? err.name : err.constructor.name;
    console.log(util.format('- %s: %s', errname, err.message));
}
