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

var hex = require('hexer');
var util = require('util');
var Result = require('./result');
var errors = require('./errors');
var errorHighlighter = require('./error_highlighter');

var emptyBuffer = Buffer(0);

function fromBuffer(struct, buffer, offset) {
    return fromBufferResult(struct, buffer, offset).toValue();
}

function byteLength(struct, value) {
    return byteLengthResult(struct, value).toValue();
}

function toBuffer(struct, value) {
    return toBufferResult(struct, value).toValue();
}

function intoBuffer(struct, buffer, value) {
    return intoBufferResult(struct, buffer, value).toValue();
}

// The "Tuple" methods are deprecated

/* istanbul ignore next */
function fromBufferTuple(struct, buffer, offset) {
    return fromBufferResult(struct, buffer, offset).toTuple();
}

/* istanbul ignore next */
function byteLengthTuple(struct, value) {
    return byteLengthResult(struct, value).toTuple();
}

/* istanbul ignore next */
function toBufferTuple(struct, value) {
    return toBufferResult(struct, value).toTuple();
}

/* istanbul ignore next */
function intoBufferTuple(struct, buffer, value) {
    return intoBufferResult(struct, buffer, value).toTuple();
}

function fromBufferResult(struct, buffer, offset) {
    offset = offset || 0;
    var res = struct.readFrom(buffer, offset);
    offset = res.offset;
    var err = res.err;
    if (!err && offset !== buffer.length) {
        err = errors.ShortRead({
            remaining: buffer.length - offset,
            buffer: buffer,
            offset: offset
        });
    }
    if (err) {
        if (err.offset === undefined) err.offset = offset;
        if (err.buffer === undefined) err.buffer = buffer;
    }
    return new Result(err, res.value);
}

function byteLengthResult(struct, value) {
    var lenRes = struct.byteLength(value);
    if (lenRes.err) return new Result(lenRes.err, 0);
    else return new Result(null, lenRes.length);
}

function toBufferResult(struct, value) {
    var lenRes = struct.byteLength(value);
    if (lenRes.err) return new Result(lenRes.err, emptyBuffer);
    var length = lenRes.length;
    var buffer = new Buffer(length);
    // buffer.fill(0); TODO option
    return intoBufferResult(struct, buffer, value);
}

function intoBufferResult(struct, buffer, value) {
    var writeRes = struct.writeInto(value, buffer, 0);
    if (writeRes.err) {
        // istanbul ignore else
        if (!Buffer.isBuffer(writeRes.err.buffer)) writeRes.err.buffer = buffer;
        if (typeof writeRes.err.offset !== 'number') writeRes.err.offset = writeRes.offset;
        return new Result(writeRes.err, buffer);
    }
    var offset = writeRes.offset;
    if (offset !== buffer.length) {
        return new Result(errors.ShortWrite({
            remaining: buffer.length - offset,
            buffer: buffer,
            offset: offset
        }), buffer);
    }
    return new Result(null, buffer);
}

// istanbul ignore next TODO
function formatError(err, options) {
    options = options || {};
    var name = err.name || err.constructor.name;
    var str = util.format('%s: %s\n', name, err.message);
    if (Buffer.isBuffer(err.buffer)) {
        if (options.color) {
            str += formatBufferColored(err, options);
        } else {
            str += formatBufferUncolored(err, options);
        }
        str += '\n';
    }
    return str;
}

// istanbul ignore next TODO
function formatBufferColored(err, options) {
    options = options || {};
    var opts = options.hexerOptions ? Object.create(options.hexerOptions) : {};
    if (opts.colored === undefined) {
        opts.colored = true;
    }
    var highlight = errorHighlighter(err, options);
    opts.decorateHexen = highlight;
    opts.decorateHuman = highlight;
    return hex(err.buffer, opts);
}

// istanbul ignore next TODO
function formatBufferUncolored(err, options) {
    options = options || {};

    var hasOffset = !(err.offset === undefined || err.offset === null);
    var hasEnd = !(err.endOffset === undefined || err.endOffset === null);
    var markStart = options.markStart || '>';
    var markEnd = options.markEnd || '<';
    var accum = 0;

    var opts = options.hexerOptions ? Object.create(options.hexerOptions) : {};
    if (hasOffset) {
        opts.groupSeparator = '';
        if (hasEnd) {
            opts.decorateHexen = decorateRangedError;
        } else {
            opts.decorateHexen = decorateError;
        }
    }
    return hex(err.buffer, opts);

    // TODO: suspected broken across lines, should either test and complete or
    // use some sort of alternate notation such as interstitial lines
    function decorateRangedError(totalOffset, screenOffset, hexen) {
        var s;
        if (totalOffset === err.offset) {
            accum = 1;
            s = markStart + hexen;
            if (totalOffset === err.endOffset-1) {
                s += markEnd;
                accum = 0;
            } else {
                s = ' ' + s;
            }
            return s;
        } else if (totalOffset === err.endOffset-1) {
            s = hexen + markEnd;
            while (accum-- > 0) s += ' ';
            accum = 0;
            return s;
        } else if (accum) {
            accum += 2;
            return hexen;
        } else {
            return ' ' + hexen + ' ';
        }
    }

    function decorateError(totalOffset, screenOffset, hexen) {
        if (totalOffset === err.offset) {
            return markStart + hexen + markEnd;
        } else {
            return ' ' + hexen + ' ';
        }
    }
}

module.exports.fromBuffer = fromBuffer;
module.exports.byteLength = byteLength;
module.exports.toBuffer = toBuffer;
module.exports.intoBuffer = intoBuffer;
module.exports.formatError = formatError;

module.exports.fromBufferTuple = fromBufferTuple;
module.exports.byteLengthTuple = byteLengthTuple;
module.exports.toBufferTuple = toBufferTuple;
module.exports.intoBufferTuple = intoBufferTuple;

module.exports.fromBufferResult = fromBufferResult;
module.exports.byteLengthResult = byteLengthResult;
module.exports.toBufferResult = toBufferResult;
module.exports.intoBufferResult = intoBufferResult;
