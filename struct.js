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

module.exports = StructRW;

var inherits = require('util').inherits;

var LengthResult = require('./base').LengthResult;
var WriteResult = require('./base').WriteResult;
var ReadResult = require('./base').ReadResult;
var BufferRW = require('./base').BufferRW;

function StructRW(cons, fields, opts) {
    if (!(this instanceof StructRW)) {
        return new StructRW(cons, fields);
    }
    if (typeof cons === 'object') {
        fields = cons;
        cons = null;
    }
    var self = this;
    opts = opts || {};
    self.cons = cons || makeObject;
    self.fields = [];
    // TODO: useful to have a StructRWField prototype?
    if (Array.isArray(fields)) {
        self.fields.push.apply(self.fields, fields);
    } else {
        Object.keys(fields).forEach(function eachFieldName(fieldName) {
            var field = {};
            field.name = fieldName;
            field.rw = fields[field.name];
            self.fields.push(field);
        });
    }
}
inherits(StructRW, BufferRW);

StructRW.prototype.byteLength = function byteLength(obj) {
    var self = this;
    var length = 0;
    for (var i = 0; i < self.fields.length; i++) {
        var field = self.fields[i];
        var value = field.name && obj && obj[field.name];
        var res;
        if (field.call) {
            if (!field.call.byteLength) continue;
            res = field.call.byteLength(obj);
        } else {
            res = field.rw.byteLength(value);
        }
        if (res.err) return res;
        length += res.length;
    }
    return LengthResult.just(length);
};

StructRW.prototype.writeInto = function writeInto(obj, buffer, offset) {
    var self = this;
    var res = WriteResult.just(offset);
    for (var i = 0; i < self.fields.length; i++) {
        var field = self.fields[i];
        var value = field.name && obj[field.name];
        if (field.call) {
            if (!field.call.writeInto) continue;
            res = field.call.writeInto(obj, buffer, offset);
        } else {
            res = field.rw.writeInto(value, buffer, offset);
        }
        if (res.err) return res;
        offset = res.offset;
    }
    return res;
};

StructRW.prototype.readFrom = function readFrom(buffer, offset) {
    var self = this;
    var obj = self.cons();
    for (var i = 0; i < self.fields.length; i++) {
        var field = self.fields[i];
        var res;
        if (field.call) {
            if (!field.call.readFrom) continue;
            res = field.call.readFrom(obj, buffer, offset);
        } else {
            res = field.rw.readFrom(buffer, offset);
        }
        if (res.err) return res;
        offset = res.offset;
        if (field.name) {
            obj[field.name] = res.value;
        }
    }
    return ReadResult.just(offset, obj);
};

function makeObject() {
    return {};
}
