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

var structTest = require('./lib/struct_test');
var test = require('tape');

var VariableBufferRW = require('../variable_buffer_rw');

var buf1 = VariableBufferRW(1);

test('should read a simple buf~1', function t(assert) {
    var inBuf = Buffer([0x03, 0x00, 0x88, 0xff]);
    var outBuf = Buffer([0x00, 0x88, 0xff]);
    structTest.read(assert, buf1, inBuf, function s(got, done) {
        assert.deepEqual(got, outBuf);
        done();
    });
});

test('should write a simple buf~1', function t(assert) {
    var inBuf = Buffer([0x00, 0x88, 0xff]);
    var outBuf = Buffer([0x03, 0x00, 0x88, 0xff]);
    structTest.write(assert, buf1, inBuf, function s(got, done) {
        assert.deepEqual(got, outBuf);
        done();
    });
});
