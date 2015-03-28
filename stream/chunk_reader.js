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
var inherits = require('util').inherits;
var Transform = require('readable-stream').Transform;
var ConcatReadBuffer = require('./concat_read_buffer');
var fromBufferTuple = require('../interface').fromBufferTuple;

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

module.exports = ChunkReader;

var States = {
    PendingLength: 0,
    Seeking: 1
};

function ChunkReader(sizeRW, chunkRW, options) {
    if (!(this instanceof ChunkReader)) {
        return new ChunkReader(sizeRW, chunkRW, options);
    }
    options = options || {};
    // istanbul ignore if
    if (typeof sizeRW.width !== 'number') {
        throw BadSizeRWError();
    }
    var self = this;
    Transform.call(self, options);
    self._readableState.objectMode = true;
    self.sizeRW = sizeRW;
    self.chunkRW = chunkRW;
    self.buffer = new ConcatReadBuffer();
    self.expecting = self.sizeRW.width;
    self.state = States.PendingLength;
}

inherits(ChunkReader, Transform);

ChunkReader.prototype._transform = function _transform(buf, encoding, callback) {
    var self = this;
    self.buffer.push(buf);
    var err = null;
    while (self.buffer.avail() >= self.expecting) {
        switch (self.state) {
            case States.PendingLength:
                var sizeRes = self.sizeRW.readFrom(self.buffer, 0);
                err = sizeRes.err;
                if (!err && !sizeRes.value) {
                    err = ZeroLengthChunkError();
                }
                if (err) {
                    self.buffer.shift(self.sizeRW.width);
                    self.expecting = self.sizeRW.width;
                    self.state = States.PendingLength;
                    callback(err);
                    return;
                } else {
                    self.expecting = sizeRes.value;
                    self.state = States.Seeking;
                }
                break;

            case States.Seeking:
                var chunk = self.buffer.shift(self.expecting);
                // istanbul ignore if
                if (!chunk.length) {
                    callback(BrokenReaderStateError({
                        state: self.state,
                        expecting: self.expecting,
                        avail: self.buffer.avail()
                    }));
                    return;
                }
                self.expecting = self.sizeRW.width;
                self.state = States.PendingLength;
                err = self._readChunk(chunk);
                if (err) {
                    callback(err);
                    return;
                }
                break;

            // istanbul ignore next
            default:
                callback(BrokenReaderStateError({
                    state: self.state,
                    expecting: self.expecting,
                    avail: self.buffer.avail()
                }));
                return;
        }
    }
    callback();
};

ChunkReader.prototype._flush = function _flush(callback) {
    var self = this;
    var avail = self.buffer.avail();
    if (avail) {
        self.buffer.clear();
        self.expecting = 4;
        self.state = States.PendingLength;
        callback(TruncatedReadError({
            length: avail,
            state: self.state,
            expecting: self.expecting
        }));
    } else {
        callback();
    }
};

ChunkReader.prototype._readChunk = function _readChunk(chunk) {
    var self = this;
    var tup = fromBufferTuple(self.chunkRW, chunk);
    var err = tup[0];
    var value = tup[1];
    if (err) {
        return err;
    } else {
        self.push(value);
        return null;
    }
};
