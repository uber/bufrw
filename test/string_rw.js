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

var StringRW = require('../string_rw');

var str1 = StringRW(1, 'utf8');

test('should read a simple str~1', function t(assert) {
    var buf = Buffer([0x03, 0x63, 0x61, 0x74]);
    var str = 'cat';
    structTest.read(assert, str1, buf, function s(got, done) {
        assert.deepEqual(got, str);
        done();
    });
});

test('should write a simple str~1', function t(assert) {
    var buf = Buffer([0x03, 0x63, 0x61, 0x74]);
    var str = 'cat';
    structTest.write(assert, str1, str, function s(got, done) {
        assert.deepEqual(got, buf);
        done();
    });
});
