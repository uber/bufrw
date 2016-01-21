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

module.exports = VariableBufferRW;

var inherits = require('util').inherits;

var LengthResult = require('./base').LengthResult;
var WriteResult = require('./base').WriteResult;
var ReadResult = require('./base').ReadResult;
var BufferRW = require('./base').BufferRW;
var errors = require('./errors');

function VariableBufferRW(sizerw, lazy) {
    if (!(this instanceof VariableBufferRW)) {
        return new VariableBufferRW(sizerw, lazy);
    }
    this.sizerw = sizerw;
    if (lazy) {
        this.readFrom = this.lazyReadFrom;
    }
    BufferRW.call(this);
}
inherits(VariableBufferRW, BufferRW);

VariableBufferRW.prototype.byteLength = function byteLength(buf) {
    var length = 0;
    if (Buffer.isBuffer(buf)) {
        length = buf.length;
    } else if (buf === null || buf === undefined) {
        length = 0;
    } else {
        return LengthResult.error(errors.expected(buf, 'buffer, null, or undefined'));
    }
    var len = this.sizerw.byteLength(length);
    if (len.err) return len;
    return new LengthResult(null, len.length + length);
};

VariableBufferRW.prototype.writeInto = function writeInto(buf, buffer, offset) {
    var start = offset + this.sizerw.width;
    var length = 0;
    if (Buffer.isBuffer(buf)) {
        length = buf.copy(buffer, start);
    } else if (buf === null || buf === undefined) {
        length = 0;
    } else {
        return WriteResult.error(errors.expected(buf, 'buffer, null, or undefined'), offset);
    }
    var res = this.sizerw.writeInto(length, buffer, offset);
    if (res.err) return res;
    return new WriteResult(null, start + length);
};

VariableBufferRW.prototype.readFrom =
VariableBufferRW.prototype.eagerReadFrom = function eagerReadFrom(buffer, offset) {
    var res = this.sizerw.readFrom(buffer, offset);
    if (res.err) return res;
    var length = res.value;
    var remain = buffer.length - res.offset;
    if (remain < length) {
        return ReadResult.shortError(length, remain, offset, res.offset);
    } else {
        offset = res.offset;
        var buf = Buffer(length);
        buffer.copy(buf, 0, offset);
        return new ReadResult(null, offset + length, buf);
    }
};

VariableBufferRW.prototype.lazyReadFrom = function lazyReadFrom(buffer, offset) {
    var res = this.sizerw.readFrom(buffer, offset);
    if (res.err) return res;
    var length = res.value;
    var remain = buffer.length - res.offset;
    if (remain < length) {
        return ReadResult.shortError(length, remain, offset, res.offset);
    } else {
        offset = res.offset;
        var end = offset + length;
        var buf = buffer.slice(offset, end);
        return new ReadResult(null, end, buf);
    }
};
