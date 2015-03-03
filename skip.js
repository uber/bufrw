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
