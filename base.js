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

var TypedError = require('error/typed');

module.exports.BufferRW = BufferRW;
module.exports.LengthResult = LengthResult;
module.exports.WriteResult = WriteResult;
module.exports.ReadResult = ReadResult;

var ShortBufferError = TypedError({
    type: 'short-buffer',
    message: 'expected at least {expected} bytes, only have {actual} @{offset}',
    expected: null,
    actual: null,
    buffer: null,
    offset: null
});

var ShortBufferRangedError = TypedError({
    type: 'short-buffer',
    message: 'expected at least {expected} bytes, only have {actual} @[{offset}:{endOffset}]',
    expected: null,
    actual: null,
    offset: null,
    endOffset: null
});

function BufferRW(byteLength, readFrom, writeInto) {
    if (!(this instanceof BufferRW)) {
        return new BufferRW(byteLength, readFrom, writeInto);
    }
    var self = this;
    if (typeof byteLength === 'function') self.byteLength = byteLength;
    if (typeof readFrom === 'function') self.readFrom = readFrom;
    if (typeof writeInto === 'function') self.writeInto = writeInto;
}

function LengthResult(err, length) {
    var self = this;
    self.err = err || null;
    self.length = length || 0;
}

LengthResult.error = function error(err, length) {
    return new LengthResult(err, length);
};

LengthResult.just = function just(length) {
    return new LengthResult(null, length);
};

function WriteResult(err, offset) {
    var self = this;
    self.err = err || null;
    self.offset = offset || 0;
}

WriteResult.error = function error(err, offset) {
    return new WriteResult(err, offset);
};

WriteResult.just = function just(offset) {
    return new WriteResult(null, offset);
};

WriteResult.shortError = function shortError(expected, actual, offset) {
    return new WriteResult(new ShortBufferError({
        expected: expected,
        actual: actual,
        offset: offset
    }), offset);
};

function ReadResult(err, offset, value) {
    var self = this;
    self.err = err || null;
    self.offset = offset || 0;
    self.value = value === undefined ? null : value;
}

ReadResult.error = function error(err, offset, value) {
    return new ReadResult(err, offset, value);
};

ReadResult.just = function just(offset, value) {
    return new ReadResult(null, offset, value);
};

ReadResult.shortError = function shortError(expected, actual, offset, endOffset) {
    if (endOffset === undefined) {
        return new ReadResult(new ShortBufferError({
            expected: expected,
            actual: actual,
            offset: offset
        }), offset);
    } else {
        return new ReadResult(new ShortBufferRangedError({
            expected: expected,
            actual: actual,
            offset: offset,
            endOffset: endOffset
        }), offset);
    }
};
