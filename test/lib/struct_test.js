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
var series = require('run-series');
var util = require('util');
var bufrw = require('bufrw');

module.exports.cases = testCases;
module.exports.read = testRead;
module.exports.write = testWrite;

/* jshint maxparams:6 */

function testCases(rw, cases) {
    return function runTestCases(assert, done) {
        if (!done) done = assert.end;
        series(flat1(cases.map(function eachCase(testCase) {
            return [
                function readTest(nextTest) {
                    var buf = Buffer(testCase[1]);
                    testRead(assert, rw, buf, function s(got, done) {
                        var val = testCase[0];
                        assert.deepEqual(got, val, util.format('read: %j', val));
                        if (typeof val === 'object') {
                            assert.equal(got.constructor.name, val.constructor.name,
                                'expected ' + val.constructor.name + ' constructor');
                        }
                        done();
                    }, function eatError(err) {
                        assert.ifError(err, 'no read error');
                        nextTest();
                    });
                },
                function writeTest(nextTest) {
                    var val = testCase[0];
                    testWrite(assert, rw, val, function s(got, done) {
                        var buf = Buffer(testCase[1]);
                        assert.deepEqual(got, buf, util.format('write: %j', val));
                        done();
                    }, function eatError(err) {
                        assert.ifError(err, 'no write error');
                        nextTest();
                    });
                }
            ];
        })), done);
    };
}

function testRead(assert, struct, buffer, t, done) {
    if (!done) done = assert.end;
    var tup = bufrw.fromBufferTuple(struct, buffer);
    var err = tup[0];
    var val = tup[1];
    if (err) {
        hexdump(err, buffer, 'read error at');
        done(err);
    } else if (val === undefined) {
        done(new Error('Expected to have read a value'));
    } else {
        t(val, done);
    }
}

testRead.shouldError = function shouldError(assert, struct, buffer, t, done) {
    if (!done) done = assert.end;
    var tup = bufrw.fromBufferTuple(struct, buffer);
    var err = tup[0];
    // var val = tup[1];
    if (err) {
        t(err, done);
    } else {
        done(new Error('expected a read error'));
    }
};

function testWrite(assert, struct, value, t, done) {
    if (!done) done = assert.end;
    var tup = bufrw.toBufferTuple(struct, value);
    var err = tup[0];
    var buffer = tup[1];
    if (err) {
        if (buffer) {
            hexdump(err, buffer, 'write error at');
        }
        done(err);
    } else if (!Buffer.isBuffer(buffer)) {
        done(new Error('expected to have wrote a buffer'));
    } else {
        t(buffer, done);
    }
}

testWrite.shouldError = function shouldError(assert, struct, value, t, done) {
    if (!done) done = assert.end;
    var tup = bufrw.toBufferTuple(struct, value);
    var err = tup[0];
    // var buffer = tup[1];
    if (err) {
        t(err, done);
    } else {
        done(new Error('expected a write error'));
    }
};

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

function flat1(ar) {
    return ar.reduce(concatArs);
}

function concatArs(a, b) {
    return a.concat(b);
}
