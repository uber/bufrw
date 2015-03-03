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
    self.cons = opts.cons || makePair;
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
    return LengthResult.just(vallen.length + caselen.length);
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
    var obj = self.cons(val, data);
    return ReadResult.just(offset, obj);
};

function makePair(a, b) {
    return [a, b];
}
