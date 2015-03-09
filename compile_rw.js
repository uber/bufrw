var assert = require('assert');
var escodegen = require('escodegen');
var hex = require('hexer');

var bufrw = require('./');

var depsify = require('anatta/depsify');
var anatta = require('anatta/anatta');

function compileRW(rw, name) {
    // jshint evil:true
    var ast = anatta(rw, name, function exportProp(prop) {
        switch (prop.key.name) {
            case 'byteLength':
            case 'writeInto':
            case 'readFrom':
                return true;
            default:
                return false;
        }
    });
    ast = depsify(ast, name);
    var code = escodegen.generate(ast);
    var func;
    try {
        func = eval('(' + code + ')');
        return func(ast.deps);
    } catch(e) {
        console.error(code);
        throw e;
    }
    // jshint evil:false
}

// proveCompiledRW(
//     bufrw.Series(
//         bufrw.UInt32BE,
//         bufrw.str2
//     ),
//     [ 0x01020304, 'cat' ],
//     [ 0x01, 0x02, 0x03, 0x04,
//       0x00, 0x03,
//       0x63, 0x61, 0x74
//     ]);

function Loc(lat, lng) {
    if (!(this instanceof Loc)) {
        return new Loc(lat, lng);
    }
    var self = this;
    self.lat = lat || 0.0;
    self.lng = lng || 0.0;
}

proveCompiledRW(
    bufrw.Struct(Loc, {
        lat: bufrw.DoubleBE,
        lng: bufrw.DoubleBE
    }),
    Loc(Math.PI, Math.E),
    [ 0x40, 0x09, 0x21, 0xfb,
      0x54, 0x44, 0x2d, 0x18,
      0x40, 0x05, 0xbf, 0x0a,
      0x8b, 0x14, 0x57, 0x69
    ]);

function proveCompiledRW(rw, val, bytes) {
    var n = 10000;
    var crw = compileRW(rw, 'crw');

    console.log('// byteLength:\n%s', crw.byteLength.toString());
    var gotLength = crw.byteLength(val).length;
    assert.equal(gotLength, bytes.length, 'expected byte length');
    console.log('// got expected byteLength for %j: %s\n', val, gotLength);

    console.log('// writeInto:\n%s', crw.writeInto.toString());
    var gotBuffer = bufrw.toBuffer(crw, val);
    assert.deepEqual(gotBuffer, Buffer(bytes), 'expected write buffer');
    console.log('// got expected buffer for %j:', val);
    console.log(hex(gotBuffer, {prefix: '// '}) + '\n');

    console.log('// readFrom:\n%s', crw.readFrom.toString());
    var gotValue = bufrw.fromBuffer(crw, gotBuffer);
    assert.deepEqual(gotValue, val, 'expected read value');
    console.log('// got expected value back: %j\n', gotValue);

    console.log('// timing for %s rounds:', n, {
        rw:  run(rw,  n, Buffer(bytes), val),
        crw: run(crw, n, Buffer(bytes), val)
    });
}

function run(rw, n, buf, val) {
    return {
        R: runR(rw, n, buf),
        W: runW(rw, n, val)
    };
}

function runR(rw, n, buf) {
    var start = Date.now();
    for (var i=0; i<n; i++) {
        bufrw.fromBuffer(rw, buf);
    }
    var end = Date.now();
    return end - start;
}

function runW(rw, n, val) {
    var start = Date.now();
    for (var i=0; i<n; i++) {
        bufrw.toBuffer(rw, val);
    }
    var end = Date.now();
    return end - start;
}
