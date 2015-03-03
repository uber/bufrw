var TypedError = require('error/typed');

module.exports.BufferRW = BufferRW;
module.exports.LengthResult = LengthResult;
module.exports.WriteResult = WriteResult;
module.exports.ReadResult = ReadResult;

var ShortBufferError = TypedError({
    type: 'short-buffer',
    message: 'expected at least {expected} bytes, only have {actual} @{offset}',
    expected: null,
    actual: null,
    offset: null
});

function BufferRW(byteLength, readFrom, writeInto) {
    if (!(this instanceof BufferRW)) {
        return new BufferRW(byteLength, readFrom, writeInto);
    }
    var self = this;
    if (typeof byteLength === 'function') self.byteLength = byteLength;
    if (typeof readFrom === 'function') self.readFrom = readFrom;
    if (typeof writeInto === 'function') self.writeInto = writeInto;
}

function LengthResult(err, length) {
    if (!(this instanceof LengthResult)) {
        return new LengthResult(err, length);
    }
    var self = this;
    self.err = err || null;
    self.length = length || 0;
}

LengthResult.error = function error(err, length) {
    return LengthResult(err, length);
};

LengthResult.just = function just(length) {
    return LengthResult(null, length);
};

function WriteResult(err, offset) {
    if (!(this instanceof WriteResult)) {
        return new WriteResult(err, offset);
    }
    var self = this;
    self.err = err || null;
    self.offset = offset || 0;
}

WriteResult.error = function error(err, offset) {
    return WriteResult(err, offset);
};

WriteResult.just = function just(offset) {
    return WriteResult(null, offset);
};

function ReadResult(err, offset, value) {
    if (!(this instanceof ReadResult)) {
        return new ReadResult(err, offset, value);
    }
    var self = this;
    self.err = err || null;
    self.offset = offset || 0;
    self.value = value === undefined ? null : value;
}

ReadResult.error = function error(err, offset, value) {
    return ReadResult(err, offset, value);
};

ReadResult.just = function just(offset, value) {
    return ReadResult(null, offset, value);
};

ReadResult.shortError = function shortError(expected, actual, offset) {
    return ReadResult.error(ShortBufferError({
        expected: expected,
        actual: actual,
        offset: offset
    }), offset);
};
