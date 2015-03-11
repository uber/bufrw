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

var testRW = require('./lib/test_rw');
var test = require('tape');

var atoms = require('../atoms');
var StructRW = require('../struct');

/*
 * {
 *     lat : DoubleBE
 *     lng : DoubleBE
 * }
 */

var anonLoc = StructRW({
    lat: atoms.DoubleBE,
    lng: atoms.DoubleBE
});

test('StructRW: anonLoc', testRW.cases(anonLoc, [
    [{lat: 37.775497, lng: -122.417519},
     [0x40, 0x42, 0xe3, 0x43, 0x7c, 0x56, 0x92, 0xb4,
      0xc0, 0x5e, 0x9a, 0xb8, 0xa1, 0x9c, 0x9d, 0x5a]]
]));

function Loc(lat, lng) {
    if (!(this instanceof Loc)) {
        return new Loc(lat, lng);
    }
    var self = this;
    self.lat = lat || 0;
    self.lng = lng || 0;
}

var consLoc = StructRW(Loc, {
    lat: atoms.DoubleBE,
    lng: atoms.DoubleBE
});

test('StructRW: consLoc', testRW.cases(consLoc, [
    [Loc(37.775497, -122.417519),
     [0x40, 0x42, 0xe3, 0x43, 0x7c, 0x56, 0x92, 0xb4,
      0xc0, 0x5e, 0x9a, 0xb8, 0xa1, 0x9c, 0x9d, 0x5a]]
]));

var bufrw = require('../index');

function Frame(mess) {
    if (!(this instanceof Frame)) {
        return new Frame(mess);
    }
    var self = this;
    self.size = 0;
    self.mess = mess || '';
}

Frame.rw = StructRW(Frame, [
    {call: {
        byteLength: function(frame) {
            var res = bufrw.str1.byteLength(frame.mess);
            if (res.err) return res;
            frame.size = res.length + bufrw.UInt16BE.width;
            if (frame.size > 10) {
                return bufrw.LengthResult.error(new Error('arbitrary length limit'));
            } else {
                return bufrw.LengthResult.just(0);
            }
        },
        writeInto: function(frame, buffer, offset) {
            var res = bufrw.str1.byteLength(frame.mess);
            if (res.err) return res;
            frame.size = res.length + bufrw.UInt16BE.width;
            if (buffer.length - offset < frame.size) {
                return bufrw.WriteResult.error(new Error('not enough room'));
            } else {
                return bufrw.WriteResult.just(0);
            }
        }
    }},
    {name: 'size', rw: bufrw.UInt16BE},
    {name: 'mess', rw: bufrw.str1},
    {call: {
        readFrom: function(frame, buffer, offset) {
            if (offset < buffer.length) {
                return bufrw.ReadResult.error(new Error('frame data past message'));
            } else {
                return bufrw.ReadResult.just(offset);
            }
        }
    }}
]);

test('StructRW: frame', testRW.cases(Frame.rw, [
    [Frame('cat'), [0x00, 0x06, 0x03, 0x63, 0x61, 0x74]],

    // provoke call error paths
    {
        lengthTest: {
            value: Frame('what even is this?'),
            error: {
                message: 'arbitrary length limit'
            }
        },
        writeTest: {
            value: Frame('what even is this?'),
            length: 2,
            error: {
                message: 'not enough room'
            }
        },
        readTest: {
            bytes: [0x00, 0x00, 0x00, 0xff],
            error: {
                message: 'frame data past message'
            }
        }
    }
]));
