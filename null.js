var LengthResult = require('./base').LengthResult;
var WriteResult = require('./base').WriteResult;
var ReadResult = require('./base').ReadResult;
var BufferRW = require('./base').BufferRW;

function nullByteLength() {
    return LengthResult.just(0);
}

function nullWriteInto(val, buffer, offset) {
    return WriteResult.just(offset);
}

function nullReadFrom(buffer, offset) {
    return ReadResult.just(offset, null);
}

var NullRW = BufferRW(nullByteLength, nullReadFrom, nullWriteInto);

module.exports = NullRW;
