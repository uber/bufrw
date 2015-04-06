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

module.exports = RepeatRW;

var TypedError = require('error/typed');
var inherits = require('util').inherits;

var LengthResult = require('./base').LengthResult;
var WriteResult = require('./base').WriteResult;
var ReadResult = require('./base').ReadResult;
var BufferRW = require('./base').BufferRW;

var InvalidArgumentError = TypedError({
    type: 'invalid-argument',
    message: 'invalid argument, not an array',
    argType: null,
    argConstructor: null
});

function RepeatRW(countrw, repeatedrw) {
    if (!(this instanceof RepeatRW)) {
        return new RepeatRW(countrw, repeatedrw);
    }
    var self = this;
    self.countrw = countrw;
    self.repeatedrw = repeatedrw;
}
inherits(RepeatRW, BufferRW);

RepeatRW.prototype.byteLength = function byteLength(values) {
    if (!Array.isArray(values)) {
        return LengthResult.error(InvalidArgumentError({
            argType: typeof values,
            argConstructor: values.constructor.name
        }));
    }
    var self = this;
    var res = self.countrw.byteLength(values.length);
    if (res.err) return res;
    for (var i = 0; i < values.length; i++) {
        var partres = self.repeatedrw.byteLength(values[i]);
        if (partres.err) return partres;
        res.length += partres.length;
    }
    return res;
};

RepeatRW.prototype.writeInto = function writeInto(values, buffer, offset) {
    if (!Array.isArray(values)) {
        return WriteResult.error(InvalidArgumentError({
            argType: typeof values,
            argConstructor: values.constructor.name
        }), offset);
    }
    var self = this;
    var res = self.countrw.writeInto(values.length, buffer, offset);
    if (res.err) return res;
    offset = res.offset;
    for (var i = 0; i < values.length; i++) {
        res = self.repeatedrw.writeInto(values[i], buffer, offset);
        if (res.err) return res;
        offset = res.offset;
    }
    return res;
};

RepeatRW.prototype.readFrom = function readFrom(buffer, offset) {
    var self = this;
    var res = self.countrw.readFrom(buffer, offset);
    if (res.err) return res;
    offset = res.offset;
    var count = res.value;
    var values = new Array(count);
    for (var i = 0; i < count; i++) {
        res = self.repeatedrw.readFrom(buffer, offset);
        if (res.err) return res;
        offset = res.offset;
        values[i] = res.value;
    }
    return new ReadResult(null, offset, values);
};
