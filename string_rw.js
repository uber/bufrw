module.exports = StringRW;

var TypedError = require('error/typed');
var inherits = require('util').inherits;

var LengthResult = require('./base').LengthResult;
var WriteResult = require('./base').WriteResult;
var ReadResult = require('./base').ReadResult;
var VariableBufferRW = require('./variable_buffer_rw');

var InvalidArgumentError = TypedError({
    type: 'variable-buffer.invalid-argument',
    message: 'invalid argument, expected string, null, or undefined',
    argType: null,
    argConstructor: null
});

function StringRW(size, encoding) {
    if (!(this instanceof StringRW)) {
        return new StringRW(size, encoding);
    }
    var self = this;
    self.encoding = encoding || 'utf8';
    VariableBufferRW.call(self, size);
}
inherits(StringRW, VariableBufferRW);

StringRW.prototype.byteLength = function byteLength(str) {
    var self = this;
    if (typeof str === 'string') {
        var length = Buffer.byteLength(str, self.encoding);
        var len = self.size.byteLength(length);
        if (len.err) return len;
        return LengthResult.just(len.length + length);
    } else {
        return LengthResult.error(InvalidArgumentError({
            argType: typeof str,
            argConstructor: str.constructor.name
        }));
    }
};

StringRW.prototype.writeInto = function writeInto(str, buffer, offset) {
    var self = this;
    if (typeof str === 'string') {
        var start = offset + self.size.width;
        var length = 0;
        length = buffer.write(str, start, self.encoding);
        var res = self.size.writeInto(length, buffer, offset);
        if (res.err) return res;
        return WriteResult.just(start + length);
    } else {
        return WriteResult.error(InvalidArgumentError({
            argType: typeof str,
            argConstructor: str.constructor.name
        }), offset);
    }
};

StringRW.prototype.readFrom = function readFrom(buffer, offset) {
    var self = this;
    var res = self.size.readFrom(buffer, offset);
    if (res.err) return res;
    offset = res.offset;
    var length = res.value;
    var end = offset + length;
    var buf = buffer.slice(offset, end);
    if (buf.length < length) {
        return ReadResult.shortError(length, buf.length, offset);
    } else {
        var str = buf.toString(self.encoding);
        return ReadResult.just(end, str);
    }
};
