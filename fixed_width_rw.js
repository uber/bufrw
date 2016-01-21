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

module.exports = FixedWidthRW;

var inherits = require('util').inherits;

var LengthResult = require('./base').LengthResult;
var WriteResult = require('./base').WriteResult;
var ReadResult = require('./base').ReadResult;
var BufferRW = require('./base').BufferRW;
var errors = require('./errors');

function FixedWidthRW(length, readFrom, writeInto) {
    if (!(this instanceof FixedWidthRW)) {
        return new FixedWidthRW(length, readFrom, writeInto);
    }
    this.length = length;
    BufferRW.call(this, null, readFrom, writeInto);
}
inherits(FixedWidthRW, BufferRW);

FixedWidthRW.prototype.byteLength = function byteLength(slice) {
    if (slice.length !== this.length) {
        return LengthResult.error(errors.FixedLengthMismatch({
            expected: this.length,
            got: slice.length
        }));
    } else {
        return new LengthResult(null, this.length);
    }
};

FixedWidthRW.prototype.writeInto = function writeInto(slice, buffer, offset) {
    if (slice.length !== this.length) {
        return WriteResult.error(errors.FixedLengthMismatch({
            expected: this.length,
            got: slice.length
        }), offset);
    }
    slice.copy(buffer, offset);
    return new WriteResult(null, offset + this.length);
};

FixedWidthRW.prototype.readFrom = function readFrom(buffer, offset) {
    var end = offset + this.length;
    if (end > buffer.length) {
        return ReadResult.shortError(this.length, buffer.length - offset, offset);
    } else {
        var res = new ReadResult(null, end, buffer.slice(offset, end));
        return res;
    }
};
