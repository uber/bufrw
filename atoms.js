// Copyright (c) 2015 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

var inherits = require('util').inherits;

var LengthResult = require('./base').LengthResult;
var WriteResult = require('./base').WriteResult;
var ReadResult = require('./base').ReadResult;
var BufferRW = require('./base').BufferRW;

function AtomRW(width, readAtomFrom, writeAtomInto) {
    if (!(this instanceof AtomRW)) {
        return new AtomRW(width, readAtomFrom, writeAtomInto);
    }
    var self = this;
    self.width = width;
    self.readAtomFrom = readAtomFrom;
    self.writeAtomInto = writeAtomInto;
    BufferRW.call(self);
}
inherits(AtomRW, BufferRW);

AtomRW.prototype.byteLength = function byteLength() {
    var self = this;
    return new LengthResult(null, self.width);
};

AtomRW.prototype.readFrom = function readFrom(buffer, offset) {
    var self = this;
    var remain = buffer.length - offset;
    if (remain < self.width) {
        return ReadResult.shortError(self.width, remain, offset);
    }
    return self.readAtomFrom(buffer, offset);
};

AtomRW.prototype.writeInto = function writeInto(value, buffer, offset) {
    var self = this;
    var remain = buffer.length - offset;
    if (remain < self.width) {
        return WriteResult.shortError(self.width, remain, offset);
    }
    return self.writeAtomInto(value, buffer, offset);
};

var Int8 = AtomRW(1,
    function readInt8From(buffer, offset) {
        var value = buffer.readInt8(offset);
        return new ReadResult(null, offset + 1, value);
    },
    function writeInt8Into(value, buffer, offset) {
        buffer.writeInt8(value, offset);
        return new WriteResult(null, offset + 1);
    });

var Int16BE = AtomRW(2,
    function readInt16BEFrom(buffer, offset) {
        var value = buffer.readInt16BE(offset);
        return new ReadResult(null, offset + 2, value);
    },
    function writeInt16BEInto(value, buffer, offset) {
        buffer.writeInt16BE(value, offset);
        return new WriteResult(null, offset + 2);
    });

var Int32BE = AtomRW(4,
    function readInt32BEFrom(buffer, offset) {
        var value = buffer.readInt32BE(offset);
        return new ReadResult(null, offset + 4, value);
    },
    function writeInt32BEInto(value, buffer, offset) {
        buffer.writeInt32BE(value, offset);
        return new WriteResult(null, offset + 4);
    });

var Int16LE = AtomRW(2,
    function readInt16LEFrom(buffer, offset) {
        var value = buffer.readInt16LE(offset);
        return new ReadResult(null, offset + 2, value);
    },
    function writeInt16LEInto(value, buffer, offset) {
        buffer.writeInt16LE(value, offset);
        return new WriteResult(null, offset + 2);
    });

var Int32LE = AtomRW(4,
    function readInt32LEFrom(buffer, offset) {
        var value = buffer.readInt32LE(offset);
        return new ReadResult(null, offset + 4, value);
    },
    function writeInt32LEInto(value, buffer, offset) {
        buffer.writeInt32LE(value, offset);
        return new WriteResult(null, offset + 4);
    });

var UInt8 = AtomRW(1,
    function readUInt8From(buffer, offset) {
        var value = buffer.readUInt8(offset);
        return new ReadResult(null, offset + 1, value);
    },
    function writeUInt8Into(value, buffer, offset) {
        buffer.writeUInt8(value, offset);
        return new WriteResult(null, offset + 1);
    });

var UInt16BE = AtomRW(2,
    function readUInt16BEFrom(buffer, offset) {
        var value = buffer.readUInt16BE(offset);
        return new ReadResult(null, offset + 2, value);
    },
    function writeUInt16BEInto(value, buffer, offset) {
        buffer.writeUInt16BE(value, offset);
        return new WriteResult(null, offset + 2);
    });

var UInt32BE = AtomRW(4,
    function readUInt32BEFrom(buffer, offset) {
        var value = buffer.readUInt32BE(offset);
        return new ReadResult(null, offset + 4, value);
    },
    function writeUInt32BEInto(value, buffer, offset) {
        buffer.writeUInt32BE(value, offset);
        return new WriteResult(null, offset + 4);
    });

var UInt16LE = AtomRW(2,
    function readUInt16LEFrom(buffer, offset) {
        var value = buffer.readUInt16LE(offset);
        return new ReadResult(null, offset + 2, value);
    },
    function writeUInt16LEInto(value, buffer, offset) {
        buffer.writeUInt16LE(value, offset);
        return new WriteResult(null, offset + 2);
    });

var UInt32LE = AtomRW(4,
    function readUInt32LEFrom(buffer, offset) {
        var value = buffer.readUInt32LE(offset);
        return new ReadResult(null, offset + 4, value);
    },
    function writeUInt32LEInto(value, buffer, offset) {
        buffer.writeUInt32LE(value, offset);
        return new WriteResult(null, offset + 4);
    });

var FloatLE = AtomRW(4,
    function readFloatLEFrom(buffer, offset) {
        var value = buffer.readFloatLE(offset);
        return new ReadResult(null, offset + 4, value);
    },
    function writeFloatLEInto(value, buffer, offset) {
        buffer.writeFloatLE(value, offset);
        return new WriteResult(null, offset + 4);
    });

var FloatBE = AtomRW(4,
    function readFloatBEFrom(buffer, offset) {
        var value = buffer.readFloatBE(offset);
        return new ReadResult(null, offset + 4, value);
    },
    function writeFloatBEInto(value, buffer, offset) {
        buffer.writeFloatBE(value, offset);
        return new WriteResult(null, offset + 4);
    });

var DoubleLE = AtomRW(8,
    function readDoubleLEFrom(buffer, offset) {
        var value = buffer.readDoubleLE(offset);
        return new ReadResult(null, offset + 8, value);
    },
    function writeDoubleLEInto(value, buffer, offset) {
        buffer.writeDoubleLE(value, offset);
        return new WriteResult(null, offset + 8);
    });

var DoubleBE = AtomRW(8,
    function readDoubleBEFrom(buffer, offset) {
        var value = buffer.readDoubleBE(offset);
        return new ReadResult(null, offset + 8, value);
    },
    function writeDoubleBEInto(value, buffer, offset) {
        buffer.writeDoubleBE(value, offset);
        return new WriteResult(null, offset + 8);
    });

module.exports.AtomRW = AtomRW;
module.exports.Int8 = Int8;
module.exports.Int16BE = Int16BE;
module.exports.Int32BE = Int32BE;
module.exports.Int16LE = Int16LE;
module.exports.Int32LE = Int32LE;
module.exports.UInt8 = UInt8;
module.exports.UInt16BE = UInt16BE;
module.exports.UInt32BE = UInt32BE;
module.exports.UInt16LE = UInt16LE;
module.exports.UInt32LE = UInt32LE;
module.exports.FloatLE = FloatLE;
module.exports.FloatBE = FloatBE;
module.exports.DoubleLE = DoubleLE;
module.exports.DoubleBE = DoubleBE;
