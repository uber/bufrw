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
    self.writeGuard = opts.writeGuard || null;
    self.readGuard = opts.readGuard || null;
    if (Array.isArray(fields)) {
        self.fields = fields;
    } else {
        var keys = Object.keys(fields);
        self.fields = new Array(keys.length);
        for (var i = 0; i < keys.length; i++) {
            var field = {}; // TODO: useful to have a StructRWField prototype?
            field.name = keys[i];
            field.rw = fields[field.name];
            self.fields[i] = field;
        }
    }
}
inherits(StructRW, BufferRW);

StructRW.prototype.byteLength = function byteLength(obj) {
    var self = this;
    if (self.writeGuard) {
        var err = self.writeGuard(obj);
        if (err) return LengthResult.error(err);
    }
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
    if (self.writeGuard) {
        var err = self.writeGuard(obj);
        if (err) return WriteResult.error(err, offset);
    }
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
    if (self.readGuard) {
        var err = self.readGuard(obj);
        if (err) return ReadResult.error(err, offset, obj);
    }
    return ReadResult(null, offset, obj);
};

function makeObject() {
    return {};
}
