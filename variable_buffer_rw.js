module.exports = VariableBufferRW;

var TypedError = require('error/typed');
var inherits = require('util').inherits;

var LengthResult = require('./base').LengthResult;
var WriteResult = require('./base').WriteResult;
var ReadResult = require('./base').ReadResult;
var BufferRW = require('./base').BufferRW;

var UInt8 = require('./atoms').UInt8;
var UInt16BE = require('./atoms').UInt16BE;
var UInt32BE = require('./atoms').UInt32BE;

var InvalidArgumentError = TypedError({
    type: 'variable-buffer.invalid-argument',
    message: 'invalid argument, expected string, buffer, null, or undefined',
    argType: null,
    argConstructor: null
});

function VariableBufferRW(size, opts) {
    if (!(this instanceof VariableBufferRW)) {
        return new VariableBufferRW(size, opts);
    }
    var self = this;
    if (typeof size === 'number') {
        switch (size) {
            case 1:
                self.size = UInt8;
                break;
            case 2:
                self.size = UInt16BE;
                break;
            case 4:
                self.size = UInt32BE;
                break;
            default:
                throw new Error('unsupported size ' + size);
        }
    } else {
        self.size = size;
    }
    opts = opts || {};
    self.encoding = opts.encoding || 'utf8';
    self.autoDecode = opts.autoDecode || false;
    BufferRW.call(self);
}
inherits(VariableBufferRW, BufferRW);

VariableBufferRW.prototype.byteLength = function byteLength(strOrBuf) {
    var self = this;
    var length = 0;
    if (typeof strOrBuf === 'string') {
        length = Buffer.byteLength(strOrBuf, self.encoding);
    } else if (Buffer.isBuffer(strOrBuf)) {
        length = strOrBuf.length;
    } else if (strOrBuf === null || strOrBuf === undefined) {
        length = 0;
    } else {
        return LengthResult.error(InvalidArgumentError({
            argType: typeof strOrBuf,
            argConstructor: strOrBuf.constructor.name
        }));
    }
    var len = self.size.byteLength(length);
    if (len.err) return len;
    return LengthResult.just(len.length + length);
};

VariableBufferRW.prototype.writeInto = function writeInto(strOrBuf, buffer, offset) {
    var self = this;
    var start = offset + self.size.width;
    var length = 0;
    if (typeof strOrBuf === 'string') {
        length = buffer.write(strOrBuf, start, self.encoding);
    } else if (Buffer.isBuffer(strOrBuf)) {
        length = strOrBuf.copy(buffer, start);
    } else if (strOrBuf === null || strOrBuf === undefined) {
        length = 0;
    } else {
        return WriteResult.error(InvalidArgumentError({
            argType: typeof strOrBuf,
            argConstructor: strOrBuf.constructor.name
        }), offset);
    }
    var res = self.size.writeInto(length, buffer, offset);
    if (res.err) return res;
    return WriteResult.just(start + length);
};

VariableBufferRW.prototype.readFrom = function readFrom(buffer, offset) {
    var self = this;
    var res = self.size.readFrom(buffer, offset);
    if (res.err) return res;
    offset = res.offset;
    var length = res.value;
    var end = offset + length;
    if (end > buffer.length) {
        return ReadResult.shortError(length, buffer.length - offset, offset);
    } else {
        var buf = buffer.slice(offset, end);
        if (self.autoDecode) {
            var str = buf.toString(self.encoding);
            return ReadResult.just(end, str);
        } else {
            return ReadResult.just(end, buf);
        }
    }
};
