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
var errors = require('./errors');

function StructRW(cons, fields, opts) {
    if (!(this instanceof StructRW)) {
        return new StructRW(cons, fields);
    }
    if (typeof cons === 'object') {
        fields = cons;
        cons = null;
    }
    var i;
    opts = opts || {};
    this.cons = cons || Object;
    this.fields = [];
    // TODO: useful to have a StructRWField prototype?
    if (Array.isArray(fields)) {
        this.fields.push.apply(this.fields, fields);
    } else {
        var fieldNames = Object.keys(fields);
        for (i = 0; i < fieldNames.length; ++i) {
            var field = {};
            field.name = fieldNames[i];
            field.rw = fields[field.name];
            this.fields.push(field);
        }
    }
    this.namedFields = {};
    for (i = 0; i < this.fields.length; ++i) {
        if (this.fields[i].name) {
            this.namedFields[this.fields[i].name] = this.fields[i];
        }
    }
}
inherits(StructRW, BufferRW);

StructRW.prototype.byteLength = function byteLength(obj) {
    var length = 0;
    for (var i = 0; i < this.fields.length; i++) {
        var field = this.fields[i];

        if (field.name && !obj.hasOwnProperty(field.name)) {
            return LengthResult.error(errors.MissingStructField({
                field: field.name,
                struct: this.cons.name
            }));
        }

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
    return new LengthResult(null, length);
};

StructRW.prototype.writeInto = function writeInto(obj, buffer, offset) {
    var res = new WriteResult(null, offset);
    for (var i = 0; i < this.fields.length; i++) {
        var field = this.fields[i];

        if (field.name && !obj.hasOwnProperty(field.name)) {
            return WriteResult.error(errors.MissingStructField({
                field: field.name,
                struct: this.cons.name
            }));
        }

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
    var obj = new this.cons();
    for (var i = 0; i < this.fields.length; i++) {
        var field = this.fields[i];
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
    return new ReadResult(null, offset, obj);
};
