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

var inherits = require('util').inherits;

var LengthResult = require('./base').LengthResult;
var WriteResult = require('./base').WriteResult;
var ReadResult = require('./base').ReadResult;
var errors = require('./errors');
var VariableBufferRW = require('./variable_buffer_rw');

function StringRW(sizerw, encoding) {
    if (!(this instanceof StringRW)) {
        return new StringRW(sizerw, encoding);
    }
    var self = this;
    self.encoding = encoding || 'utf8';
    // istanbul ignore else
    if (self.encoding === 'utf8') {
        self.writeInto = self.writeUtf8Into;
        self.readFrom = self.readUtf8From;
    }
    VariableBufferRW.call(self, sizerw);
}
inherits(StringRW, VariableBufferRW);

StringRW.prototype.byteLength = function byteLength(str) {
    var self = this;
    var length = 0;
    if (typeof str === 'string') {
        length = Buffer.byteLength(str, self.encoding);
    } else if (str !== null && str !== undefined) {
        return LengthResult.error(errors.expected(str, 'string, null, or undefined'));
    }
    var len = self.sizerw.byteLength(length);
    if (len.err) return len;
    return new LengthResult(null, len.length + length);
};

// istanbul ignore next
StringRW.prototype.writeInto = function writeInto(str, buffer, offset) {
    var self = this;
    var start = offset + self.sizerw.width;
    var length = 0;
    if (typeof str === 'string') {
        length = buffer.write(str, start, self.encoding);
    } else if (str !== null && str !== undefined) {
        return WriteResult.error(errors.expected(str, 'string, null, or undefined'), offset);
    }
    var res = self.sizerw.writeInto(length, buffer, offset);
    if (res.err) return res;
    return new WriteResult(null, start + length);
};

StringRW.prototype.writeUtf8Into = function writeInto(str, buffer, offset) {
    var self = this;
    var start = offset + self.sizerw.width;
    var length = 0;
    if (typeof str === 'string') {
        // istanbul ignore else
        if (buffer.parent) {
            length = buffer.parent.utf8Write(str, buffer.offset + start, buffer.length - start);
        } else {
            length = buffer.write(str, start, self.encoding);
        }
    } else if (str !== null && str !== undefined) {
        return WriteResult.error(errors.expected(str, 'string, null, or undefined'), offset);
    }
    var res = self.sizerw.writeInto(length, buffer, offset);
    if (res.err) return res;
    return new WriteResult(null, start + length);
};

// istanbul ignore next
StringRW.prototype.readFrom = function readFrom(buffer, offset) {
    var self = this;
    var res = self.sizerw.readFrom(buffer, offset);
    if (res.err) return res;
    var length = res.value;
    var remain = buffer.length - res.offset;
    if (remain < length) {
        return ReadResult.shortError(length, remain, offset, res.offset);
    } else {
        offset = res.offset;
        var end = offset + length;
        var str = buffer.toString(self.encoding, offset, end);
        return new ReadResult(null, end, str);
    }
};

StringRW.prototype.readUtf8From = function readFrom(buffer, offset) {
    var self = this;
    var res = self.sizerw.readFrom(buffer, offset);
    if (res.err) return res;
    var length = res.value;
    var remain = buffer.length - res.offset;
    if (remain < length) {
        return ReadResult.shortError(length, remain, offset, res.offset);
    } else {
        offset = res.offset;
        var end = offset + length;
        var str = '';
        if (buffer.parent) {
            str = buffer.parent.utf8Slice(buffer.offset + offset, buffer.offset + end);
        } else {
            str = buffer.toString(self.encoding, offset, end);
        }
        return new ReadResult(null, end, str);
    }
};
