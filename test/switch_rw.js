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

var atoms = require('../atoms');
var SwitchRW = require('../switch');

/*
 * {
 *     lat : DoubleBE
 *     lng : DoubleBE
 * }
 */

var numbers = SwitchRW(atoms.UInt8, {
    0: atoms.UInt8,
    1: atoms.UInt16BE,
    2: atoms.UInt32BE
});

test('SwitchRW: numbers', structTest.cases(numbers, [
    [[0, 0x11], [0x00, 0x11]],
    [[1, 0x2222], [0x01, 0x22, 0x22]],
    [[2, 0x33333333], [0x02, 0x33, 0x33, 0x33, 0x33]]
]));
