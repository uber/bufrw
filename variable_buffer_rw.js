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

var UInt8 = require('./atoms').UInt8;
var UInt16BE = require('./atoms').UInt16BE;
var UInt32BE = require('./atoms').UInt32BE;

var InvalidArgumentError = TypedError({
    type: 'variable-buffer.invalid-argument',
    message: 'invalid argument, expected buffer, null, or undefined',
    argType: null,
    argConstructor: null
});

function VariableBufferRW(size) {
    if (!(this instanceof VariableBufferRW)) {
        return new VariableBufferRW(size);
    }
    var self = this;
    if (typeof size === 'number') {
        switch (size) {
            case 1:
                self.size = UInt8;
                break;
            case 2:
                self.size = UInt16BE;
                break;
            case 4:
                self.size = UInt32BE;
                break;
            default:
                throw new Error('unsupported size ' + size);
        }
    } else {
        self.size = size;
    }
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
    var len = self.size.byteLength(length);
    if (len.err) return len;
    return LengthResult.just(len.length + length);
};

VariableBufferRW.prototype.writeInto = function writeInto(buf, buffer, offset) {
    var self = this;
    var start = offset + self.size.width;
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
    var res = self.size.writeInto(length, buffer, offset);
    if (res.err) return res;
    return WriteResult.just(start + length);
};

VariableBufferRW.prototype.readFrom = function readFrom(buffer, offset) {
    var self = this;
    var res = self.size.readFrom(buffer, offset);
    if (res.err) return res;
    offset = res.offset;
    var length = res.value;
    var end = offset + length;
    if (end > buffer.length) {
        return ReadResult.shortError(length, buffer.length - offset, offset);
    } else {
        var buf = buffer.slice(offset, end);
        return ReadResult.just(end, buf);
    }
};
