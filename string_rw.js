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

module.exports = StringRW;

var TypedError = require('error/typed');
var inherits = require('util').inherits;

var LengthResult = require('./base').LengthResult;
var WriteResult = require('./base').WriteResult;
var ReadResult = require('./base').ReadResult;
var VariableBufferRW = require('./variable_buffer_rw');

var InvalidArgumentError = TypedError({
    type: 'variable-buffer.invalid-argument',
    message: 'invalid argument, expected string, null, or undefined',
    argType: null,
    argConstructor: null
});

function StringRW(sizerw, encoding) {
    if (!(this instanceof StringRW)) {
        return new StringRW(sizerw, encoding);
    }
    var self = this;
    self.encoding = encoding || 'utf8';
    VariableBufferRW.call(self, sizerw);
}
inherits(StringRW, VariableBufferRW);

StringRW.prototype.byteLength = function byteLength(str) {
    var self = this;
    if (typeof str === 'string') {
        var length = Buffer.byteLength(str, self.encoding);
        var len = self.sizerw.byteLength(length);
        if (len.err) return len;
        return LengthResult.just(len.length + length);
    } else {
        return LengthResult.error(InvalidArgumentError({
            argType: typeof str,
            argConstructor: str.constructor.name
        }));
    }
};

StringRW.prototype.writeInto = function writeInto(str, buffer, offset) {
    var self = this;
    if (typeof str === 'string') {
        var start = offset + self.sizerw.width;
        var length = 0;
        length = buffer.write(str, start, self.encoding);
        var res = self.sizerw.writeInto(length, buffer, offset);
        if (res.err) return res;
        return WriteResult.just(start + length);
    } else {
        return WriteResult.error(InvalidArgumentError({
            argType: typeof str,
            argConstructor: str.constructor.name
        }), offset);
    }
};

StringRW.prototype.readFrom = function readFrom(buffer, offset) {
    var self = this;
    var res = self.sizerw.readFrom(buffer, offset);
    if (res.err) return res;
    offset = res.offset;
    var length = res.value;
    var end = offset + length;
    var buf = buffer.slice(offset, end);
    if (buf.length < length) {
        return ReadResult.shortError(length, buf.length, offset);
    } else {
        var str = buf.toString(self.encoding);
        return ReadResult.just(end, str);
    }
};
