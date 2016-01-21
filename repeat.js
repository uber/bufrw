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

var inherits = require('util').inherits;

var LengthResult = require('./base').LengthResult;
var WriteResult = require('./base').WriteResult;
var ReadResult = require('./base').ReadResult;
var BufferRW = require('./base').BufferRW;
var errors = require('./errors');

function RepeatRW(countrw, repeatedrw) {
    if (!(this instanceof RepeatRW)) {
        return new RepeatRW(countrw, repeatedrw);
    }
    this.countrw = countrw;
    this.repeatedrw = repeatedrw;
}
inherits(RepeatRW, BufferRW);

RepeatRW.prototype.byteLength = function byteLength(values) {
    if (!Array.isArray(values)) {
        return LengthResult.error(errors.expected(values, 'an array'));
    }
    var res = this.countrw.byteLength(values.length);
    if (res.err) return res;
    for (var i = 0; i < values.length; i++) {
        var partres = this.repeatedrw.byteLength(values[i]);
        if (partres.err) return partres;
        res.length += partres.length;
    }
    return res;
};

RepeatRW.prototype.writeInto = function writeInto(values, buffer, offset) {
    if (!Array.isArray(values)) {
        return WriteResult.error(errors.expected(values, 'an array'), offset);
    }
    var res = this.countrw.writeInto(values.length, buffer, offset);
    if (res.err) return res;
    offset = res.offset;
    for (var i = 0; i < values.length; i++) {
        res = this.repeatedrw.writeInto(values[i], buffer, offset);
        if (res.err) return res;
        offset = res.offset;
    }
    return res;
};

RepeatRW.prototype.readFrom = function readFrom(buffer, offset) {
    var res = this.countrw.readFrom(buffer, offset);
    if (res.err) return res;
    offset = res.offset;
    var count = res.value;
    var values = new Array(count);
    for (var i = 0; i < count; i++) {
        res = this.repeatedrw.readFrom(buffer, offset);
        if (res.err) return res;
        offset = res.offset;
        values[i] = res.value;
    }
    return new ReadResult(null, offset, values);
};
