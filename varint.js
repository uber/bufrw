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

var LengthResult = require('./base').LengthResult;
var WriteResult = require('./base').WriteResult;
var ReadResult = require('./base').ReadResult;
var BufferRW = require('./base').BufferRW;
var errors = require('./errors');

// TODO: zigzag support for signed-s

module.exports.unsigned = BufferRW(
    unsignedVarIntByteLength,
    readUnsignedVarIntFrom,
    writeUnsignedVarIntInto);

function unsignedVarIntByteLength(n) {
    if (typeof n !== 'number' || n < 0) {
        // TODO: integer check
        return LengthResult.error(errors.expected(n, 'unsigned integer'));
    }
    if (n === 0) LengthResult.just(1);
    var nbits = 1;
    if (n > 0) nbits = Math.log(n) / Math.log(2);
    var needed = Math.ceil(nbits / 7);
    return LengthResult.just(needed);
}

function writeUnsignedVarIntInto(n, buffer, offset) {
    console.log('WRITE %s @%s', n, offset);
    if (typeof n !== 'number' || n < 0) {
        // TODO: integer check
        return WriteResult.error(errors.expected(n, 'unsigned integer'));
    }

    var nbits = 1;
    if (n > 0) nbits = Math.log(n) / Math.log(2);
    var needed = Math.ceil(nbits / 7);
    var start = offset;
    var end = offset + needed;

    if (end > buffer.length) {
        var remain = buffer.length - offset;
        return WriteResult.shortError(needed, remain, offset);
    }

    offset = end;
    while (offset > start) {
        var b = n & 0x7f;
        n >>= 7;
        if (offset !== end) b |= 0x80;
        buffer.writeUInt8(b, --offset, true);
    } while (n > 0);

    return WriteResult.just(end);
}

function readUnsignedVarIntFrom(buffer, offset) {
    var start = offset;
    var n = 0;
    while (offset < buffer.length) {
        var b = buffer.readUInt8(offset++, true);
        if (n !== 0) n <<= 7;
        n += b & 0x7f;
        if (!(b & 0x80)) {
            return ReadResult.just(offset, n);
        }
    }
    var got = offset - start;
    return ReadResult.shortError(got + 1, got, start, offset);
}
