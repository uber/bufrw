module.exports = SeriesRW;

var inherits = require('util').inherits;

var LengthResult = require('./base').LengthResult;
var WriteResult = require('./base').WriteResult;
var ReadResult = require('./base').ReadResult;
var BufferRW = require('./base').BufferRW;

function SeriesRW(rws) {
    if (!(this instanceof SeriesRW)) {
        return new SeriesRW(rws);
    }
    if (arguments.length > 1) {
        rws = Array.prototype.slice.call(arguments);
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
