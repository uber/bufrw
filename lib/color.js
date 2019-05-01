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

var ansi = require('ansi-colors');

module.exports = color;

// The `color` function maps the `ansi-color` api to the `ansi-colors` api
// for backwards compatibility.
//
// http://npm.im/ansi-color
// - color('foo', 'blue+bold+underline+white_bg');
//
// http://npm.im/ansi-colors
// - colors.blue.bold.underline.bgWhite('foo');

function color(str, colors) {
    var colorer = colors
        .split('+')
        .map(function(key) {
            // Convert `color_bg` to `bgColor`
            return key.replace(/^(\w)(\w*)_bg$/, function(all, a, b) {
                return 'bg' + a.toUpperCase() + b;
            });
        })
        .reduce(function(object, key) {
            // Get colorer function
            return object[key];
        }, ansi);

    return colorer(str);
}
