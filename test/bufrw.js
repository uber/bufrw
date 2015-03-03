'use strict';

var test = require('tape');

var bufrw = require('../index.js');

test('bufrw is a function', function t(assert) {
    assert.equal(typeof bufrw, 'function');

    assert.end();
});

test('bufrw is not implemented', function t(assert) {
    assert.throws(function throwIt() {
        bufrw();
    }, /Not Implemented/);

    assert.end();
});
