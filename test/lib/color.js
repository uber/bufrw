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

var test = require('tape');

var color = require('../../lib/color');

test('color', function t(assert) {
    assert.equal(color('foo', 'red'), '\x1b[31mfoo\x1b[39m');

    assert.equal(
        color('foo', 'yellow+bold'),
        '\x1b[33m\x1b[1mfoo\x1b[22m\x1b[39m'
    );

    assert.equal(
        color('foo', 'green+bold+underline'),
        '\x1b[32m\x1b[1m\x1b[4mfoo\x1b[24m\x1b[22m\x1b[39m'
    );

    assert.equal(
        color('foo', 'blue+bold+underline+white_bg'),
        '\x1b[34m\x1b[1m\x1b[4m\x1b[47mfoo\x1b[49m\x1b[24m\x1b[22m\x1b[39m'
    );

    assert.end();
});
