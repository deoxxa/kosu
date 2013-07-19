var dotty = require("dotty"),
    escodegen = require("escodegen"),
    stream = require("stream");

var Kosu = module.exports = function Kosu(query) {
  stream.Transform.call(this, {objectMode: true});

  query = query || {};

  this.filter = new Function("obj", escodegen.generate(this._compile(query)));
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

Kosu.prototype._compile = function _compile(query) {
  return {
    type: "ReturnStatement",
    argument: this._compile_condition(query.condition),
  };
};

Kosu.prototype._compile_lhs = function _compile_lhs(condition) {
  return condition.left.split(".").reduce(function(i, v) {
    return {
      type: "LogicalExpression",
      operator: "&&",
      left: i,
      right: {
        type: "MemberExpression",
        computed: true,
        object: i.right ? i.right : i,
        property: {
          type: "Literal",
          value: v,
        }
      }
    };
  }.bind(this), {type: "Identifier", name: "obj"});
};

Kosu.prototype._compile_rhs = function _compile_rhs(condition) {
  return {
    type: "Literal",
    value: condition.right,
  };
};

Kosu.prototype._compile_condition = function _compile_condition(condition) {
  if (typeof condition === "undefined") {
    return {
      type: "Literal",
      value: true,
    };
  }

  if (typeof this["_compile_condition_" + condition.type] !== "function") {
    throw Error("invalid type: " + condition.type);
  }

  return this["_compile_condition_" + condition.type](condition);
};

[["eq", "==="], ["ne", "!=="], ["lt", "<"], ["gt", ">"]].forEach(function(e) {
  Kosu.prototype["_compile_condition_" + e[0]] = function(condition) {
    return {
      type: "BinaryExpression",
      operator: e[1],
      left: this._compile_lhs(condition),
      right: this._compile_rhs(condition),
    };
  };
});

[["and", "&&"], ["or", "||"]].forEach(function(e) {
  Kosu.prototype["_compile_condition_" + e[0]] = function(condition) {
    return condition.data.reduce(function(i, v) {
      if (i === null) {
        return this._compile_condition(v);
      } else {
        return {
          type: "LogicalExpression",
          operator: e[1],
          left: i,
          right: this._compile_condition(v),
        };
      }
    }.bind(this), {type: "Literal", value: true});
  };
});
