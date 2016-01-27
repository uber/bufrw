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

var assert = require('assert');

var errors = require('./errors');

module.exports.BufferRW = BufferRW;
module.exports.LengthResult = LengthResult;
module.exports.WriteResult = WriteResult;
module.exports.ReadResult = ReadResult;

function BufferRW(poolByteLength, poolReadFrom, poolWriteInto) {
    if (!(this instanceof BufferRW)) {
        return new BufferRW(poolByteLength, poolReadFrom, poolWriteInto);
    }

    if (typeof poolByteLength === 'function') this.poolByteLength = poolByteLength;
    if (typeof poolReadFrom === 'function') this.poolReadFrom = poolReadFrom;
    if (typeof poolWriteInto === 'function') this.poolWriteInto = poolWriteInto;

    assert(typeof this.poolByteLength === 'function', 'rw must implement `poolByteLength`');
    assert(typeof this.poolReadFrom === 'function', 'rw must implement `poolReadFrom`');
    assert(typeof this.poolWriteInto === 'function', 'rw must implement `poolWriteInto`');

    assert(this.byteLength === BufferRW.prototype.byteLength, 'rw must not override `byteLength`; implement `poolByteLength`');
    assert(this.readFrom === BufferRW.prototype.readFrom, 'rw must not override `readFrom`; implement `poolReadFrom`');
    assert(this.writeInto === BufferRW.prototype.writeInto, 'rw must not override `writeInto`; implement `poolWriteInto`');
}

BufferRW.prototype.readFrom = function readFrom(buffer, offset) {
    var readResult = new ReadResult();
    this.poolReadFrom(readResult, buffer, offset);
    return readResult;
};

BufferRW.prototype.writeInto = function writeInto(value, buffer, offset) {
    var writeResult = new WriteResult();
    this.poolWriteInto(writeResult, value, buffer, offset);
    return writeResult;
};

BufferRW.prototype.byteLength = function byteLength(arg1, arg2, arg3) {
    var lengthResult = new LengthResult();
    this.poolByteLength(lengthResult, arg1, arg2, arg3);
    return lengthResult;
};

function LengthResult(err, length) {
    this.err = err || null;
    this.length = length || 0;
}

LengthResult.prototype.reset = function reset(err, length) {
    this.err = err;
    this.length = length;
    return this;
}

LengthResult.prototype.copyFrom = function copyFrom(srcRes) {
    this.err = srcRes.err;
    this.length = srcRes.length;
    return this;
};

LengthResult.error = function error(err, length) {
    return new LengthError(err, length);
};

LengthResult.just = function just(length) {
    return new LengthError(null, length);
};

function WriteResult(err, offset) {
    this.err = err || null;
    this.offset = offset || 0;
}

WriteResult.prototype.reset = function reset(err, offset) {
    this.err = err;
    this.offset = offset;
    return this;
};

WriteResult.prototype.copyFrom = function copyFrom(srcResult) {
    this.err = srcResult.err;
    this.offset = srcResult.offset;
};

WriteResult.error = function error(err, offset) {
    return new WriteResult(err, offset);
};

// istanbul ignore next
WriteResult.poolRangedError = function poolRangedError(destResult, err, start, end, value) {
    assert(typeof destResult === 'object' && destResult.constructor.name === 'WriteResult');

    err.offest = start;
    err.endOffset = end;
    return destResult.reset(err, null);
};

WriteResult.rangedError = function rangedError(err, start, end, value) {
    return WriteResult.poolRangedError(new WriteResult(), start, end, value);
}

WriteResult.just = function just(offset) {
    return new WriteResult(null, offset);
};


WriteResult.shortError = function shortError(expected, actual, offset) {
    return WriteResult.poolShortError(new WriteResult(), expected, actual, offset);
}

WriteResult.poolShortError = function poolShortError(destResult, expected, actual, offset) {
    assert(typeof destResult === 'object' && destResult.constructor.name === 'WriteResult');

    return destResult.reset(new errors.ShortBuffer({
        expected: expected,
        actual: actual,
        offset: offset
    }), offset);
};

function ReadResult(err, offset, value) {
    this.err = err || null;
    this.offset = offset || 0;
    this.value = value === undefined ? null : value;
}

ReadResult.prototype.copyFrom = function copyFrom(srcResult) {
    this.err = srcResult.err;
    this.offset = srcResult.offset;
    this.value = srcResult.value;
    return this;
};

ReadResult.prototype.reset = function reset(err, offset, value) {
    this.err = err;
    this.offset = offset;
    this.value = value;
    return this;
};

ReadResult.error = function error(err, offset, value) {
    return new ReadResult(err, offset, value);
};

// istanbul ignore next
ReadResult.poolRangedError = function poolRangedError(destResult, err, start, end, value) {
    assert(typeof destResult === 'object' && destResult.constructor.name === 'ReadResult');

    err.offest = start;
    err.endOffset = end;
    return destResult.reset(err, start, value);
};

ReadResult.rangedError = function rangedError(err, start, end, value) {
    return poolRangedError(new ReadResult(), err, start, end, value);
};

ReadResult.just = function just(offset, value) {
    return new ReadResult(null, offset, value);
};

ReadResult.shortError = function shortError(destResult, expected, actual, offset, endOffset) {
    return ReadResult.poolShortError(new ReadResult(), expected, actual, offset, endOffset);
};

ReadResult.poolShortError = function poolShortError(destResult, expected, actual, offset, endOffset) {
    assert(typeof destResult === 'object' && destResult.constructor.name === 'ReadResult');
    var err;

    if (endOffset === undefined) {
        err = new errors.ShortBuffer({
            expected: expected,
            actual: actual,
            offset: offset
        }); 
    } else {
        err = new errors.ShortBufferRanged({
            expected: expected,
            actual: actual,
            offset: offset,
            endOffset: endOffset
        });
    }

    return destResult.reset(err, offset);
};
