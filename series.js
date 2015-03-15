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

module.exports = SeriesRW;

var inherits = require('util').inherits;

var LengthResult = require('./base').LengthResult;
var WriteResult = require('./base').WriteResult;
var ReadResult = require('./base').ReadResult;
var BufferRW = require('./base').BufferRW;

function SeriesRW(rws) {
    if (!Array.isArray(rws) || arguments.length > 1) {
        rws = Array.prototype.slice.call(arguments);
    }
    if (!(this instanceof SeriesRW)) {
        return new SeriesRW(rws);
    }
    var self = this;
    self.rws = rws;
}
inherits(SeriesRW, BufferRW);

SeriesRW.prototype.byteLength = function byteLength(values) {
    if (!Array.isArray(values)) values = null;
    var self = this;
    var length = 0;
    for (var i = 0; i < self.rws.length; i++) {
        var res = self.rws[i].byteLength(values && values[i]);
        if (res.err) return res;
        length += res.length;
    }
    return LengthResult.just(length);
};

SeriesRW.prototype.writeInto = function writeInto(values, buffer, offset) {
    var self = this;
    if (!Array.isArray(values)) values = null;
    var res = WriteResult.just(offset);
    for (var i = 0; i < self.rws.length; i++) {
        res = self.rws[i].writeInto(values[i], buffer, offset);
        if (res.err) return res;
        offset = res.offset;
    }
    return res;
};

SeriesRW.prototype.readFrom = function readFrom(buffer, offset) {
    var self = this;
    var values = new Array(self.rws.length);
    for (var i = 0; i < self.rws.length; i++) {
        var res = self.rws[i].readFrom(buffer, offset);
        if (res.err) return res;
        offset = res.offset;
        values[i] = res.value;
    }
    return ReadResult(null, offset, values);
};
