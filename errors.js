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

module.exports.BrokenReaderStateError = TypedError({
    type: 'broken-reader-state',
    message: 'reader in invalid state {state} expecting {expecting} avail {aval}',
    state: null,
    expecting: null,
    avail: null
});

module.exports.FixedLengthMismatchError = TypedError({
    type: 'fixed-length-mismatch',
    message: 'supplied length {got} mismatches fixed length {expected}',
    expected: null,
    got: null
});

module.exports.InvalidArgumentError = TypedError({
    type: 'invalid-argument',
    message: 'invalid argument, expected {expected}',
    expected: null,
    argType: null,
    argConstructor: null
});

module.exports.InvalidSwitchValueError = TypedError({
    type: 'invalid-switch-value',
    message: 'invalid switch value {value}',
    value: null
});

module.exports.MissingStructFieldError = TypedError({
    type: 'missing.field',
    message: 'missing field {field} on {struct}',
    field: null,
    struct: null
});

module.exports.ShortBufferError = TypedError({
    type: 'short-buffer',
    message: 'expected at least {expected} bytes, only have {actual} @{offset}',
    expected: null,
    actual: null,
    buffer: null,
    offset: null
});

module.exports.ShortBufferRangedError = TypedError({
    type: 'short-buffer',
    message: 'expected at least {expected} bytes, only have {actual} @[{offset}:{endOffset}]',
    expected: null,
    actual: null,
    offset: null,
    endOffset: null
});

module.exports.ShortReadError = TypedError({
    type: 'short-read',
    message: 'short read, {remaining} byte left over after consuming {offset}',
    remaining: null,
    buffer: null,
    offset: null
});

module.exports.ShortWriteError = TypedError({
    type: 'short-write',
    message: 'short write, {remaining} byte left over after writing {offset}',
    remaining: null,
    buffer: null,
    offset: null
});

module.exports.TruncatedReadError = TypedError({
    type: 'truncated-read',
    message: 'read truncated by end of stream with {length} bytes in buffer',
    length: null,
    buffer: null,
    state: null,
    expecting: null
});

module.exports.ZeroLengthChunkError = TypedError({
    type: 'zero-length-chunk',
    message: 'zero length chunk encountered'
});
