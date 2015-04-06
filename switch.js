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

module.exports = SwitchRW;

var inherits = require('util').inherits;
var TypedError = require('error/typed');

var LengthResult = require('./base').LengthResult;
var WriteResult = require('./base').WriteResult;
var ReadResult = require('./base').ReadResult;
var BufferRW = require('./base').BufferRW;

var InvalidValueError = TypedError({
    type: 'invalid-switch-value',
    message: 'invalid switch value {value}',
    value: null
});

// TODO: cases should be an es6 map

function SwitchRW(valrw, cases, opts) {
    if (!(this instanceof SwitchRW)) {
        return new SwitchRW(valrw, cases, opts);
    }
    opts = opts || {};
    var self = this;
    self.valrw = valrw;
    self.cases = cases;
    self.cons = opts.cons || Pair;
    self.valKey = opts.valKey || '0';
    self.dataKey = opts.dataKey || '1';
}
inherits(BufferRW, BufferRW);

SwitchRW.prototype.byteLength = function byteLength(obj) {
    var self = this;
    var val = obj[self.valKey];
    var data = obj[self.dataKey];
    var datarw = self.cases[val];
    if (datarw === undefined) {
        return LengthResult.error(InvalidValueError({
            value: val
        }));
    }
    var vallen = self.valrw.byteLength(val);
    if (vallen.err) return vallen;
    var caselen = datarw.byteLength(data);
    if (caselen.err) return caselen;
    return new LengthResult(null, vallen.length + caselen.length);
};

SwitchRW.prototype.writeInto = function writeInto(obj, buffer, offset) {
    var self = this;
    var val = obj[self.valKey];
    var data = obj[self.dataKey];
    var datarw = self.cases[val];
    if (datarw === undefined) {
        return WriteResult.error(InvalidValueError({
            value: val
        }), offset);
    }
    var res = self.valrw.writeInto(val, buffer, offset);
    if (res.err) return res;
    res = datarw.writeInto(data, buffer, res.offset);
    return res;
};

SwitchRW.prototype.readFrom = function readFrom(buffer, offset) {
    var self = this;
    var res = self.valrw.readFrom(buffer, offset);
    if (res.err) return res;
    offset = res.offset;
    var val = res.value;
    var datarw = self.cases[val];
    if (datarw === undefined) {
        return ReadResult.error(InvalidValueError({
            value: val
        }), offset);
    }
    res = datarw.readFrom(buffer, offset);
    if (res.err) return res;
    offset = res.offset;
    var data = res.value;
    var obj = new self.cons(val, data);
    return new ReadResult(null, offset, obj);
};

function Pair(a, b) {
    var self = this;
    Array.call(self);
    self[0] = a;
    self[1] = b;
}
inherits(Pair, Array);

SwitchRW.Pair = Pair;
