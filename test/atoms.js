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

test('atoms.Int8', structTest.cases(atoms.Int8, [
    [-0x12, [0xee]],
    [    0, [0x00]],
    [ 0x12, [0x12]]
]));

test('atoms.Int16BE', structTest.cases(atoms.Int16BE, [
    [-0x1234, [0xed, 0xcc]],
    [      0, [0x00, 0x00]],
    [ 0x1234, [0x12, 0x34]]
]));

test('atoms.Int32BE', structTest.cases(atoms.Int32BE, [
    [-0x12345678, [0xed, 0xcb, 0xa9, 0x88]],
    [ 0x00000000, [0x00, 0x00, 0x00, 0x00]],
    [ 0x12345678, [0x12, 0x34, 0x56, 0x78]]
]));

test('atoms.Int16LE', structTest.cases(atoms.Int16LE, [
    [-0x1234, [0xcc, 0xed]],
    [      0, [0x00, 0x00]],
    [ 0x1234, [0x34, 0x12]]
]));

test('atoms.Int32LE', structTest.cases(atoms.Int32LE, [
    [-0x12345678, [0x88, 0xa9, 0xcb, 0xed]],
    [ 0x00000000, [0x00, 0x00, 0x00, 0x00]],
    [ 0x12345678, [0x78, 0x56, 0x34, 0x12]]
]));

test('atoms.UInt8', structTest.cases(atoms.UInt8, [
    [   0, [0x00]],
    [0x12, [0x12]],
    [0xee, [0xee]]
]));

test('atoms.UInt16BE', structTest.cases(atoms.UInt16BE, [
    [     0, [0x00, 0x00]],
    [0x1234, [0x12, 0x34]],
    [0xedcc, [0xed, 0xcc]]
]));

test('atoms.UInt32BE', structTest.cases(atoms.UInt32BE, [
    [0x00000000, [0x00, 0x00, 0x00, 0x00]],
    [0x12345678, [0x12, 0x34, 0x56, 0x78]],
    [0xedcba988, [0xed, 0xcb, 0xa9, 0x88]]
]));

test('atoms.UInt16LE', structTest.cases(atoms.UInt16LE, [
    [     0, [0x00, 0x00]],
    [0x1234, [0x34, 0x12]],
    [0xedcc, [0xcc, 0xed]]
]));

test('atoms.UInt32LE', structTest.cases(atoms.UInt32LE, [
    [ 0x00000000, [0x00, 0x00, 0x00, 0x00]],
    [ 0x12345678, [0x78, 0x56, 0x34, 0x12]],
    [ 0xedcba988, [0x88, 0xa9, 0xcb, 0xed]]
]));

test('atoms.FloatLE', structTest.cases(atoms.FloatLE, [
    [-1, [0x00, 0x00, 0x80, 0xbf]],
    [ 0, [0x00, 0x00, 0x00, 0x00]],
    [ 1, [0x00, 0x00, 0x80, 0x3f]]
]));

test('atoms.FloatBE', structTest.cases(atoms.FloatBE, [
    [-1, [0xbf, 0x80, 0x00, 0x00]],
    [ 0, [0x00, 0x00, 0x00, 0x00]],
    [ 1, [0x3f, 0x80, 0x00, 0x00]]
]));

test('atoms.DoubleLE', structTest.cases(atoms.DoubleLE, [
    [-1, [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf0, 0xbf]],
    [ 0, [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]],
    [ 1, [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf0, 0x3f]]
]));

test('atoms.DoubleBE', structTest.cases(atoms.DoubleBE, [
    [-1, [0xbf, 0xf0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]],
    [ 0, [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]],
    [ 1, [0x3f, 0xf0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]]
]));
