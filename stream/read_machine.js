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

var TypedError = require('error/typed');
var ConcatReadBuffer = require('./concat_read_buffer');

var ShortReadError = TypedError({
    type: 'short-read',
    message: 'short read, {remaining} byte left over after consuming {offset}',
    remaining: null,
    buffer: null,
    offset: null
});

var ZeroLengthChunkError = TypedError({
    type: 'zero-length-chunk',
    message: 'zero length chunk encountered'
});

var BrokenReaderStateError = TypedError({
    type: 'broken-reader-state',
    message: 'reader in invalid state {state} expecting {expecting} avail {aval}',
    state: null,
    expecting: null,
    avail: null
});

var TruncatedReadError = TypedError({
    type: 'truncated-read',
    message: 'read truncated by end of stream with {length} bytes in buffer',
    length: null,
    buffer: null,
    state: null,
    expecting: null
});

var BadSizeRWError = TypedError({
    type: 'bad-size-rw',
    message: 'bad sizeRW, expected a fixed-width atom'
});

module.exports = ReadMachine;

var States = {
    PendingLength: 0,
    Seeking: 1
};

function ReadMachine(sizeRW, chunkRW, emit) {
    if (!(this instanceof ReadMachine)) {
        return new ReadMachine(sizeRW, chunkRW, emit);
    }
    // istanbul ignore if
    if (typeof sizeRW.width !== 'number') {
        throw BadSizeRWError();
    }
    var self = this;
    self.sizeRW = sizeRW;
    self.chunkRW = chunkRW;
    self.buffer = new ConcatReadBuffer();
    self.expecting = self.sizeRW.width;
    self.state = States.PendingLength;
    // istanbul ignore else
    if (typeof emit === 'function') self.emit = emit;
}

// istanbul ignore next
ReadMachine.prototype.emit = function emit() {
};

ReadMachine.prototype.handleChunk = function handleChunk(buf) {
    var self = this;
    self.buffer.push(buf);
    var err = null;
    while (self.buffer.avail() >= self.expecting) {
        switch (self.state) {
            case States.PendingLength:
                err = self.pend();
                break;

            case States.Seeking:
                err = self.seek();
                break;

            // istanbul ignore next
            default:
                err = BrokenReaderStateError({
                    state: self.state,
                    expecting: self.expecting,
                    avail: self.buffer.avail()
                });
        }
        if (err) break;
    }
    return err;
};

ReadMachine.prototype.pend = function pend() {
    var self = this;
    var sizeRes = self.sizeRW.readFrom(self.buffer, 0);
    var err = sizeRes.err;
    if (!err && !sizeRes.value) {
        err = ZeroLengthChunkError();
    }
    if (err) {
        self.buffer.shift(self.sizeRW.width);
        self.expecting = self.sizeRW.width;
        self.state = States.PendingLength;
        return err;
    } else {
        self.expecting = sizeRes.value;
        self.state = States.Seeking;
        return null;
    }
};

ReadMachine.prototype.seek = function seek() {
    var self = this;
    var chunk = self.buffer.shift(self.expecting);
    // istanbul ignore if
    if (!chunk.length) {
        return BrokenReaderStateError({
            state: self.state,
            expecting: self.expecting,
            avail: self.buffer.avail()
        });
    }
    self.expecting = self.sizeRW.width;
    self.state = States.PendingLength;
    var err = self._readChunk(chunk);
    if (err) return err;
    return null;
};

ReadMachine.prototype._readChunk = function _readChunk(chunk) {
    var self = this;
    var res = self.chunkRW.readFrom(chunk, 0);
    var err = res.err;

    // istanbul ignore if
    if (!err && res.offset < chunk.length) {
        err = ShortReadError({
            remaining: chunk.length - res.offset,
            buffer: chunk,
            offset: res.offset
        });
    }
    if (err) {
        // istanbul ignore else
        if (err.buffer === undefined) err.buffer = chunk;
        if (err.offset === undefined) err.offset = res.offset;

        return err;
    } else {
        self.emit(res.value);
        return null;
    }
};

ReadMachine.prototype.flush = function flush() {
    var self = this;
    var avail = self.buffer.avail();
    if (avail) {
        self.buffer.clear();
        self.expecting = 4;
        self.state = States.PendingLength;
        return TruncatedReadError({
            length: avail,
            state: self.state,
            expecting: self.expecting
        });
    } else {
        return null;
    }
};
