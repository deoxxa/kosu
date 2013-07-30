#!/usr/bin/env node

var Kosu = require("./index");

var query = {
  fields: {
    x: true,
    y: true,
  },
  condition: {type: "and", data: [
    {type: "eq", left: "x", right: 3},
    {type: "and", data: [
      {type: "gt", left: "info.time", right: "2012-08-24T00:00:00.000Z"},
      {type: "lt", left: "info.time", right: "2012-08-24T23:59:59.999Z"},
    ]},
  ]},
};

var kosu = new Kosu(query);

console.warn("compiled filter function:");
console.warn("");
console.warn(kosu.filter.toString());
console.warn("");

console.warn("matching data:");
console.warn("");

kosu.on("data", function(e) {
  console.log(e);
});

kosu.write({x: 3, y: 6});
kosu.write({x: 3, y: 7, info: {time: "2012-08-24T10:00:00.000Z"}});
