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

'use strict';

var color = require('ansi-color').set;
var extend = require('xtend');
var hex = require('hexer');
var stripColor = require('hexer/render').stripColor;
var inspect = require('util').inspect;

function AnnotatedBuffer(buffer) {
    var self = this;
    self.buffer = buffer;
    self.annotations = [];
}

Object.defineProperty(AnnotatedBuffer.prototype, 'length', {
    enumerable: true,
    get: function getLength() {
        var self = this;
        return self.buffer.length;
    }
});

AnnotatedBuffer.prototype.toString = function toString(encoding, start, end) {
    var self = this;
    var value = self.buffer.toString(encoding, start, end);
    self.annotations.push({
        kind: 'read',
        name: 'string',
        value: value,
        encoding: encoding,
        start: start,
        end: end
    });
    return value;
};

AnnotatedBuffer.prototype.copy = function copy(targetBuffer, targetStart, sourceStart, sourceEnd) {
    var self = this;
    var copied = self.buffer.copy(targetBuffer, targetStart, sourceStart, sourceEnd);
    // istanbul ignore next
    var start = sourceStart || 0;
    var end = sourceEnd || start + copied;
    self.annotations.push({
        kind: 'read',
        name: 'copy',
        value: self.buffer.slice(start, end),
        start: start,
        end: end
    });
    return copied;
};

AnnotatedBuffer.prototype.slice = function slice(start, end) {
    var self = this;
    var value = self.buffer.slice(start, end);
    self.annotations.push({
        kind: 'read',
        name: 'slice',
        value: value,
        start: start,
        end: end
    });
    return value;
};

AnnotatedBuffer.prototype.readInt8 = function readInt8(offset, noAssert) {
    var self = this;
    var value = self.buffer.readInt8(offset, noAssert);
    self.annotations.push({
        kind: 'read',
        name: 'Int8',
        value: value,
        start: offset,
        end: offset + 1
    });
    return value;
};

AnnotatedBuffer.prototype.readUInt8 = function readUInt8(offset, noAssert) {
    var self = this;
    var value = self.buffer.readUInt8(offset, noAssert);
    self.annotations.push({
        kind: 'read',
        name: 'UInt8',
        value: value,
        start: offset,
        end: offset + 1
    });
    return value;
};

AnnotatedBuffer.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
    var self = this;
    var value = self.buffer.readUInt16LE(offset, noAssert);
    self.annotations.push({
        kind: 'read',
        name: 'UInt16LE',
        value: value,
        start: offset,
        end: offset + 2
    });
    return value;
};

AnnotatedBuffer.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
    var self = this;
    var value = self.buffer.readUInt16BE(offset, noAssert);
    self.annotations.push({
        kind: 'read',
        name: 'UInt16BE',
        value: value,
        start: offset,
        end: offset + 2
    });
    return value;
};

AnnotatedBuffer.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
    var self = this;
    var value = self.buffer.readUInt32LE(offset, noAssert);
    self.annotations.push({
        kind: 'read',
        name: 'UInt32LE',
        value: value,
        start: offset,
        end: offset + 4
    });
    return value;
};

AnnotatedBuffer.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
    var self = this;
    var value = self.buffer.readUInt32BE(offset, noAssert);
    self.annotations.push({
        kind: 'read',
        name: 'UInt32BE',
        value: value,
        start: offset,
        end: offset + 4
    });
    return value;
};

AnnotatedBuffer.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
    var self = this;
    var value = self.buffer.readInt16LE(offset, noAssert);
    self.annotations.push({
        kind: 'read',
        name: 'Int16LE',
        value: value,
        start: offset,
        end: offset + 2
    });
    return value;
};

AnnotatedBuffer.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
    var self = this;
    var value = self.buffer.readInt16BE(offset, noAssert);
    self.annotations.push({
        kind: 'read',
        name: 'Int16BE',
        value: value,
        start: offset,
        end: offset + 2
    });
    return value;
};

AnnotatedBuffer.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
    var self = this;
    var value = self.buffer.readInt32LE(offset, noAssert);
    self.annotations.push({
        kind: 'read',
        name: 'Int32LE',
        value: value,
        start: offset,
        end: offset + 4
    });
    return value;
};

AnnotatedBuffer.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
    var self = this;
    var value = self.buffer.readInt32BE(offset, noAssert);
    self.annotations.push({
        kind: 'read',
        name: 'Int32BE',
        value: value,
        start: offset,
        end: offset + 4
    });
    return value;
};

AnnotatedBuffer.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
    var self = this;
    var value = self.buffer.readFloatLE(offset, noAssert);
    self.annotations.push({
        kind: 'read',
        name: 'FloatLE',
        value: value,
        start: offset,
        end: offset + 4
    });
    return value;
};

AnnotatedBuffer.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
    var self = this;
    var value = self.buffer.readFloatBE(offset, noAssert);
    self.annotations.push({
        kind: 'read',
        name: 'FloatBE',
        value: value,
        start: offset,
        end: offset + 4
    });
    return value;
};

AnnotatedBuffer.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
    var self = this;
    var value = self.buffer.readDoubleLE(offset, noAssert);
    self.annotations.push({
        kind: 'read',
        name: 'DoubleLE',
        value: value,
        start: offset,
        end: offset + 8
    });
    return value;
};

AnnotatedBuffer.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
    var self = this;
    var value = self.buffer.readDoubleBE(offset, noAssert);
    self.annotations.push({
        kind: 'read',
        name: 'DoubleBE',
        value: value,
        start: offset,
        end: offset + 8
    });
    return value;
};

// istanbul ignore next
AnnotatedBuffer.prototype.hexdump = function hexdump(options) {
    var self = this;
    options = extend(options, {
        emptyHuman: ' ',
        annotateLine: annotateLine
    });
    if (options.boldStart === undefined) options.boldStart = true;
    if (options.colored) {
        options.decorateHexen = colorRegions;
        options.decorateHuman = colorRegions;
    }
    var colors = options.colors || ['magenta', 'cyan', 'yellow', 'green'];
    var colorI = 0;
    var annI = 0;
    var last = 0;
    return hex(self.buffer, options);

    function annotateLine(start, end) {
        var parts = [];
        for (var i = last; i <= annI; i++) {
            var ann = self.annotations[i];
            if (ann && ann.start >= start && ann.start < end) {
                ann.color = colors[i % colors.length];
                parts.push(ann);
                last = i + 1;
            }
        }
        return '  ' + parts.map(function(part) {
            var desc = part.name;
            if (typeof part.value !== 'string' &&
                !Buffer.isBuffer(part.value)) {
                desc += '(' + inspect(part.value) + ')';
            }
            if (options.colored) {
                desc = color(desc, part.color);
                if (options.highlight) {
                    desc = options.highlight(part.start, 0, desc);
                }

            }
            return desc;
        }).join(' ');
    }

    function colorRegions(i, j, str) {
        var ann = self.annotations[annI];
        while (ann && i >= ann.end) {
            ann = self.annotations[++annI];
            colorI = (colorI + 1) % colors.length;
        }
        if (!ann) return str;
        if (i < ann.start) return str;
        if (i >= ann.start && i < ann.end) {
            str = stripColor(str);
            str = color(str, colors[colorI]);
            if (i === ann.start && options.boldStart) str = color(str, 'bold');
        }
        if (options.highlight) {
            str = options.highlight(i, j, str);
        }
        return str;
    }
};

module.exports = AnnotatedBuffer;
