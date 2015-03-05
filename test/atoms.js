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

var series = require('run-series');
var structTest = require('./lib/struct_test');
var test = require('tape');
var util = require('util');

var atoms = require('../atoms');

[
    {
        name: 'Int8',
        cases: [
            [-0x12, [0xee]],
            [    0, [0x00]],
            [ 0x12, [0x12]]
        ]
    },

    {
        name: 'Int16BE',
        cases: [
            [-0x1234, [0xed, 0xcc]],
            [      0, [0x00, 0x00]],
            [ 0x1234, [0x12, 0x34]]
        ]
    },

    {
        name: 'Int32BE',
        cases: [
            [-0x12345678, [0xed, 0xcb, 0xa9, 0x88]],
            [ 0x00000000, [0x00, 0x00, 0x00, 0x00]],
            [ 0x12345678, [0x12, 0x34, 0x56, 0x78]]
        ]
    },

    {
        name: 'Int16LE',
        cases: [
            [-0x1234, [0xcc, 0xed]],
            [      0, [0x00, 0x00]],
            [ 0x1234, [0x34, 0x12]]
        ]
    },

    {
        name: 'Int32LE',
        cases: [
            [-0x12345678, [0x88, 0xa9, 0xcb, 0xed]],
            [ 0x00000000, [0x00, 0x00, 0x00, 0x00]],
            [ 0x12345678, [0x78, 0x56, 0x34, 0x12]]
        ]
    },

    {
        name: 'UInt8',
        cases: [
            [   0, [0x00]],
            [0x12, [0x12]],
            [0xee, [0xee]]
        ]
    },

    {
        name: 'UInt16BE',
        cases: [
            [     0, [0x00, 0x00]],
            [0x1234, [0x12, 0x34]],
            [0xedcc, [0xed, 0xcc]]
        ]
    },

    {
        name: 'UInt32BE',
        cases: [
            [0x00000000, [0x00, 0x00, 0x00, 0x00]],
            [0x12345678, [0x12, 0x34, 0x56, 0x78]],
            [0xedcba988, [0xed, 0xcb, 0xa9, 0x88]]
        ]
    },

    {
        name: 'UInt16LE',
        cases: [
            [     0, [0x00, 0x00]],
            [0x1234, [0x34, 0x12]],
            [0xedcc, [0xcc, 0xed]]
        ]
    },

    {
        name: 'UInt32LE',
        cases: [
            [ 0x00000000, [0x00, 0x00, 0x00, 0x00]],
            [ 0x12345678, [0x78, 0x56, 0x34, 0x12]],
            [ 0xedcba988, [0x88, 0xa9, 0xcb, 0xed]]
        ]
    },

    {
        name: 'FloatLE',
        cases: [
            [-1, [0x00, 0x00, 0x80, 0xbf]],
            [ 0, [0x00, 0x00, 0x00, 0x00]],
            [ 1, [0x00, 0x00, 0x80, 0x3f]]
        ]
    },

    {
        name: 'FloatBE',
        cases: [
            [-1, [0xbf, 0x80, 0x00, 0x00]],
            [ 0, [0x00, 0x00, 0x00, 0x00]],
            [ 1, [0x3f, 0x80, 0x00, 0x00]]
        ]
    },

    {
        name: 'DoubleLE',
        cases: [
            [-1, [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf0, 0xbf]],
            [ 0, [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]],
            [ 1, [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf0, 0x3f]]
        ]
    },

    {
        name: 'DoubleBE',
        cases: [
            [-1, [0xbf, 0xf0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]],
            [ 0, [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]],
            [ 1, [0x3f, 0xf0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]]
        ]
    }


].forEach(function eachAtomType(atomTest) {
    var name = atomTest.name;
    var rw = atoms[name];

    test('read atom ' + name, function t(assert) {
        series(atomTest.cases.map(function eachCase(testCase) {
            var val = testCase[0];
            var buf = Buffer(testCase[1]);
            return structTest.read.bind(null, assert, rw, buf, function s(got, done) {
                assert.equal(got, val, util.format('read %s: %j', name, val));
                done();
            });
        }), assert.end);
    });

    test('write atom ' + name, function t(assert) {
        series(atomTest.cases.map(function eachCase(testCase) {
            var val = testCase[0];
            var buf = Buffer(testCase[1]);
            return structTest.write.bind(null, assert, rw, val, function s(got, done) {
                assert.deepEqual(got, buf, util.format('write %s: %j', name, val));
                done();
            });
        }), assert.end);
    });

});
