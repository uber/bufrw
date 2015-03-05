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

module.exports = SkipRW;

var inherits = require('util').inherits;

var LengthResult = require('./base').LengthResult;
var WriteResult = require('./base').WriteResult;
var ReadResult = require('./base').ReadResult;
var FixedWidthRW = require('./fixed_width_rw');

function SkipRW(length, fill) {
    if (!(this instanceof SkipRW)) {
        return new SkipRW(length, fill);
    }
    var self = this;
    self.fill = fill || 0;
    FixedWidthRW.call(self, length);
}
inherits(SkipRW, FixedWidthRW);

SkipRW.prototype.byteLength = function byteLength() {
    var self = this;
    return LengthResult.just(self.length);
};

SkipRW.prototype.writeInto = function writeInto(val, buffer, offset) {
    var self = this;
    var end = offset + self.length;
    buffer.fill(self.fill, offset, end);
    return WriteResult.just(end);
};

SkipRW.prototype.readFrom = function readFrom(buffer, offset) {
    var self = this;
    var end = offset + self.length;
    if (end > buffer.length) {
        return ReadResult.shortError(self.length, buffer.length - offset, offset);
    } else {
        return ReadResult.just(end, null);
    }
};
