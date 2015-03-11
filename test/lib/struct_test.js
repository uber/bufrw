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
        for (var i = 0; i < cases.length; i++) {
            var testCase;
            if (Array.isArray(cases[i])) {
                testCase = {
                    value: cases[i][0],
                    bytes: cases[i][1]
                };
            } else if (typeof cases[i] !== 'object') {
                throw new Error('invalid test case ' + i);
            } else {
                testCase = cases[i];
            }

            var err;

            err = writeTest(assert, rw, testCase);
            assert.ifError(err, 'no write error');

            err = readTest(assert, rw, testCase);
            assert.ifError(err, 'no read error');
        }

        (done || assert.end)();
    };
}

function readTest(assert, rw, testCase) {
    var buffer = Buffer(testCase.bytes);

    var tup = bufrw.fromBufferTuple(rw, buffer);
    var err = tup[0];
    var got = tup[1];
    if (err) {
        hexdump(err, buffer, 'read error at');
        return err;
    }
    if (got === undefined) {
        return new Error('Expected to have read a value');
    }
    var val = testCase.value;
    assert.deepEqual(got, val, util.format('read: %j', val));
    if (typeof val === 'object') {
        var gotConsName = got && got.constructor && got.constructor.name;
        var valConsName = val && val.constructor && val.constructor.name;
        assert.equal(gotConsName, valConsName,
            'expected ' + valConsName + ' constructor');
    }
    return null;
}

function writeTest(assert, rw, testCase) {
    var val = testCase.value;
    var tup = bufrw.toBufferTuple(rw, val);
    var err = tup[0];
    var got = tup[1];
    if (err) {
        if (got) {
            hexdump(err, got, 'write error at');
        }
        return err;
    }
    if (!Buffer.isBuffer(got)) {
        return new Error('expected to have wrote a buffer');
    }
    var buf = Buffer(testCase.bytes);
    assert.deepEqual(got, buf, util.format('write: %j', val));
    return null;
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
