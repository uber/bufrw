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

var color = require('ansi-colors');

module.exports = getAnsiColor;

// istanbul ignore next
function getAnsiColor(colorStr) {
  // split errorColor on + and . for backwards compatibility
  var colorAttrs = (colorStr || '')
    .split(/[\+\.]/)
    .filter(function (c) { return c; });

  var ansiColor = color;

  for(var i=0; i < colorAttrs.length; i++) {
    // deal with color_bg values
    var bgIndex = colorAttrs[i].indexOf('_bg');
    if (bgIndex > -1) {
      var colorName = colorAttrs[i].substring(0, bgIndex);
      colorName = colorName.replace(/^\w/, function (c) {
        return c.toUpperCase();
      });
      colorAttrs[i] = 'bg'+colorName;
    }

    ansiColor = ansiColor[colorAttrs[i]];
    console.log(colorAttrs[i], ansiColor);
  }

  return ansiColor;
}
