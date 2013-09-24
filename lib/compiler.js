var escodegen = require("escodegen");

var compiler = module.exports = {};

compiler.compile = function compile(query) {
  return new Function("obj", escodegen.generate(this._compile(query)));
};

compiler._compile = function _compile(query) {
  return {
    type: "ReturnStatement",
    argument: this._compile_condition(query.condition),
  };
};

compiler._compile_lhs = function _compile_lhs(condition) {
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

compiler._compile_rhs = function _compile_rhs(condition) {
  return {
    type: "Literal",
    value: condition.right,
  };
};

compiler._compile_condition = function _compile_condition(condition) {
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

// compiler._compile_condition_eq
// compiler._compile_condition_ne
// compiler._compile_condition_lt
// compiler._compile_condition_gt

[["eq", "==="], ["ne", "!=="], ["lt", "<"], ["gt", ">"]].forEach(function(e) {
  compiler["_compile_condition_" + e[0]] = function(condition) {
    return {
      type: "BinaryExpression",
      operator: e[1],
      left: this._compile_lhs(condition),
      right: this._compile_rhs(condition),
    };
  };
});

// compiler._compile_condition_and
// compiler._compile_condition_or

[["and", "&&"], ["or", "||"]].forEach(function(e) {
  compiler["_compile_condition_" + e[0]] = function(condition) {
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