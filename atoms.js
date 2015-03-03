var inherits = require('util').inherits;

var LengthResult = require('./base').LengthResult;
var WriteResult = require('./base').WriteResult;
var ReadResult = require('./base').ReadResult;
var BufferRW = require('./base').BufferRW;

function AtomRW(width, byteLength, readFrom, writeInto) {
    if (!(this instanceof AtomRW)) {
        return new AtomRW(width, byteLength, readFrom, writeInto);
    }
    var self = this;
    self.width = width;
    BufferRW.call(self, byteLength, readFrom, writeInto);
}
inherits(AtomRW, BufferRW);

function byteLengthUInt8(/* n */) {
    // TODO: type and range check
    return LengthResult.just(1);
}

function readUInt8From(buffer, offset) {
    var remain = buffer.length - offset;
    if (remain < 1) {
        return ReadResult.shortError(1, remain, offset);
    }
    var value = buffer.readUInt8(offset);
    return ReadResult.just(offset + 1, value);
}

function writeUInt8Into(value, buffer, offset) {
    buffer.writeUInt8(value, offset);
    return WriteResult.just(offset + 1);
}

function byteLengthUInt16BE(/* n */) {
    // TODO: type and range check
    return LengthResult.just(2);
}

function readUInt16BEFrom(buffer, offset) {
    var remain = buffer.length - offset;
    if (remain < 2) {
        return ReadResult.shortError(2, remain, offset);
    }
    var value = buffer.readUInt16BE(offset);
    return ReadResult.just(offset + 2, value);
}

function writeUInt16BEInto(value, buffer, offset) {
    buffer.writeUInt16BE(value, offset);
    return WriteResult.just(offset + 2);
}

function byteLengthUInt32BE(/* n */) {
    // TODO: type and range check
    return LengthResult.just(4);
}

function readUInt32BEFrom(buffer, offset) {
    var remain = buffer.length - offset;
    if (remain < 4) {
        return ReadResult.shortError(4, remain, offset);
    }
    var value = buffer.readUInt32BE(offset);
    return ReadResult.just(offset + 4, value);
}

function writeUInt32BEInto(value, buffer, offset) {
    buffer.writeUInt32BE(value, offset);
    return WriteResult.just(offset + 4);
}

var UInt8 = AtomRW(1, byteLengthUInt8, readUInt8From, writeUInt8Into);
var UInt16BE = AtomRW(2, byteLengthUInt16BE, readUInt16BEFrom, writeUInt16BEInto);
var UInt32BE = AtomRW(4, byteLengthUInt32BE, readUInt32BEFrom, writeUInt32BEInto);

// TODO: full coverage of all Buffer primatives

module.exports.AtomRW = AtomRW;
module.exports.UInt8 = UInt8;
module.exports.UInt16BE = UInt16BE;
module.exports.UInt32BE = UInt32BE;
