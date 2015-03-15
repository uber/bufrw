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

var TypedError = require('error/typed');
var inherits = require('util').inherits;

var LengthResult = require('./base').LengthResult;
var WriteResult = require('./base').WriteResult;
var ReadResult = require('./base').ReadResult;
var BufferRW = require('./base').BufferRW;

var InvalidArgumentError = TypedError({
    type: 'invalid-argument',
    message: 'invalid argument, expected buffer, null, or undefined',
    argType: null,
    argConstructor: null
});

function VariableBufferRW(sizerw) {
    if (!(this instanceof VariableBufferRW)) {
        return new VariableBufferRW(sizerw);
    }
    var self = this;
    self.sizerw = sizerw;
    BufferRW.call(self);
}
inherits(VariableBufferRW, BufferRW);

VariableBufferRW.prototype.byteLength = function byteLength(buf) {
    var self = this;
    var length = 0;
    if (Buffer.isBuffer(buf)) {
        length = buf.length;
    } else if (buf === null || buf === undefined) {
        length = 0;
    } else {
        return LengthResult.error(InvalidArgumentError({
            argType: typeof buf,
            argConstructor: buf.constructor.name
        }));
    }
    var len = self.sizerw.byteLength(length);
    if (len.err) return len;
    return LengthResult.just(len.length + length);
};

VariableBufferRW.prototype.writeInto = function writeInto(buf, buffer, offset) {
    var self = this;
    var start = offset + self.sizerw.width;
    var length = 0;
    if (Buffer.isBuffer(buf)) {
        length = buf.copy(buffer, start);
    } else if (buf === null || buf === undefined) {
        length = 0;
    } else {
        return WriteResult.error(InvalidArgumentError({
            argType: typeof buf,
            argConstructor: buf.constructor.name
        }), offset);
    }
    var res = self.sizerw.writeInto(length, buffer, offset);
    if (res.err) return res;
    return WriteResult.just(start + length);
};

VariableBufferRW.prototype.readFrom = function readFrom(buffer, offset) {
    var self = this;
    var res = self.sizerw.readFrom(buffer, offset);
    if (res.err) return res;
    offset = res.offset;
    var length = res.value;
    var buf = Buffer(length);
    var copied = buffer.copy(buf, 0, offset);
    if (copied < length) {
        return ReadResult.shortError(length, copied, offset);
    } else {
        return ReadResult.just(offset + length, buf);
    }
};
