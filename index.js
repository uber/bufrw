var TypedError = require('error/typed');

var ShortReadError = TypedError({
    type: 'short-read',
    message: 'short read, {remaining} byte left over after consuming {offset}',
    remaining: null,
    offset: null
});

var ShortWriteError = TypedError({
    type: 'short-write',
    message: 'short write, {remaining} byte left over after writing {offset}',
    remaining: null,
    offset: null
});

var emptyBuffer = Buffer(0);

function toBuffer(struct, value) {
    var tup = toBufferTuple(struct, value);
    var err = tup[0];
    var buffer = tup[1];
    if (err) throw err;
    else return buffer;
}

function fromBuffer(struct, buffer, offset) {
    var tup = fromBufferTuple(struct, buffer, offset);
    var err = tup[0];
    var value = tup[1];
    if (err) throw err;
    else return value;
}

function fromBufferTuple(struct, buffer, offset) {
    offset = offset || 0;
    var res = struct.readFrom(buffer, offset);
    offset = res.offset;
    var err = res.err;
    if (!err && offset !== buffer.length) {
        err = ShortReadError({
            remaining: buffer.length - offset,
            offset: offset
        });
    }
    if (err) {
        if (err.offset === undefined) err.offset = offset;
        if (err.buffer === undefined) err.buffer = buffer;
    }
    return [err, res.value];
}

function toBufferTuple(struct, value) {
    var lenRes = struct.byteLength(value);
    if (lenRes.err) return [lenRes.err, emptyBuffer];
    var length = lenRes.length;

    var buffer = new Buffer(length);
    // buffer.fill(0); TODO option
    var writeRes = struct.writeInto(value, buffer, 0);
    if (writeRes.err) return [writeRes.err, buffer];
    var offset = writeRes.offset;

    if (offset !== length) {
        return [ShortWriteError({
            remaining: length - offset,
            offset: offset
        }), buffer];
    }

    return [null, buffer];
}

module.exports.fromBuffer = fromBuffer;
module.exports.toBuffer = toBuffer;
module.exports.fromBufferTuple = fromBufferTuple;
module.exports.toBufferTuple = toBufferTuple;

module.exports.Base = require('./base').BufferRW; // TODO: align names
module.exports.LengthResult = require('./base').LengthResult;
module.exports.WriteResult = require('./base').WriteResult;
module.exports.ReadResult = require('./base').ReadResult;

var UInt8 = require('./atoms').UInt8;
var UInt16BE = require('./atoms').UInt16BE;
var UInt32BE = require('./atoms').UInt32BE;

module.exports.UInt8 = UInt8;
module.exports.UInt16BE = UInt16BE;
module.exports.UInt32BE = UInt32BE;

module.exports.Null = require('./null');
module.exports.FixedWidth = require('./fixed_width_rw');

var VariableBuffer = require('./variable_buffer_rw');
var buf1 = VariableBuffer(UInt8);
var buf2 = VariableBuffer(UInt16BE);
var str1 = VariableBuffer(UInt8, {
    encoding: 'utf8',
    autoDecode: true
});
var str2 = VariableBuffer(UInt16BE, {
    encoding: 'utf8',
    autoDecode: true
});

module.exports.buf1 = buf1;
module.exports.buf2 = buf2;
module.exports.str1 = str1;
module.exports.str2 = str2;
module.exports.VariableBuffer = VariableBuffer;

module.exports.Series = require('./series');
module.exports.Struct = require('./struct');
module.exports.Switch = require('./switch');
module.exports.Repeat = require('./repeat');
module.exports.Skip = require('./skip');
