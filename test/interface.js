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

var test = require('tape');

var iface = require('../interface');
var LengthResult = require('../base').LengthResult;
var WriteResult = require('../base').WriteResult;
var ReadResult = require('../base').ReadResult;

var byteRW = {
    byteLength: function() {return LengthResult.just(1);},
    writeInto: function(b, buffer, offset) {
        buffer[offset] = b;
        return WriteResult.just(++offset);
    },
    readFrom: function(buffer, offset) {
        var b = buffer[offset];
        return ReadResult.just(++offset, b);
    },
};

var lengthErrorRW = {
    byteLength: function() {return LengthResult(new Error('boom'));}
};

var writeErrorRW = {
    byteLength: function() {return LengthResult.just(0);},
    writeInto: function() {return WriteResult.error(new Error('bang'));}
};

var readErrorRW = {
    readFrom: function() {return ReadResult.error(new Error('zot'));}
};

test('toBuffer', function t(assert) {
    assert.deepEqual(
        iface.toBuffer(byteRW, 1),
        Buffer([0x01]), 'write 1 uint8');
    assert.throws(function() {
        iface.toBuffer(lengthErrorRW, 1);
    }, /boom/, 'length error throws');
    assert.throws(function() {
        iface.toBuffer(writeErrorRW, 1);
    }, /bang/, 'write error throws');
    assert.end();
});

test('intoBuffer', function t(assert) {
    assert.deepEqual(
        iface.intoBuffer(byteRW, Buffer([0]), 1),
        Buffer([0x01]), 'write 1 uint8');
    assert.throws(function() {
        iface.intoBuffer(writeErrorRW, Buffer([0]), 1);
    }, /bang/, 'write error throws');
    assert.throws(function() {
        iface.intoBuffer(byteRW, Buffer([0, 0]), 1);
    }, /short write, 1 byte left over after writing 1/, 'short write error');
    assert.end();
});

test('fromBuffer', function t(assert) {
    assert.equal(
        iface.fromBuffer(byteRW, Buffer([0x01])),
        1, 'read 1 uint8');
    assert.throws(function() {
        iface.fromBuffer(readErrorRW, Buffer(0));
    }, /zot/, 'read error throws');
    assert.throws(function() {
        iface.fromBuffer(byteRW, Buffer([0, 0]));
    }, /short read, 1 byte left over after consuming 1/, 'short read error');
    assert.end();
});
