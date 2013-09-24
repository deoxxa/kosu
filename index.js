var dotty = require("dotty"),
    stream = require("stream");

var compiler = require("./lib/compiler");

var Kosu = module.exports = function Kosu(query) {
  stream.Transform.call(this, {objectMode: true});

  query = query || {};

  this.filter = compiler.compile(query);
  this.fields = query.fields;
};
Kosu.prototype = Object.create(stream.Transform.prototype, {constructor: {value: Kosu}});

Kosu.prototype._transform = function _transform(input, encoding, done) {
  if (this.filter(input)) {
    var o;

    if (this.fields) {
      o = {};

      for (var k in this.fields) {
        if (this.fields[k]) {
          dotty.put(o, k, dotty.get(input, k));
        }
      }
    } else {
      o = input;
    }

    this.push(o);
  }

  return done();
};
