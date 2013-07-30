Kosu
====

Filter streams according to SIQL queries

Overview
--------

Kosu is an implementation of [SIQL](https://github.com/siphon-io/docs/blob/master/siql.md)
in JavaScript, for filtering [Node.JS-style streams](http://nodejs.org/docs/latest/api/stream.html).

It compiles SIQL queries to JavaScript functions, and wraps them in a duplex
stream that filters its input according to the query provided.

A command-line tool is also provided which can filter streams of JSON according
to a query. It is intuitively named `kosu`.

Installation
------------

Available via [npm](http://npmjs.org/):

> $ npm install kosu

Or via git:

> $ npm install git://github.com/deoxxa/kosu.git

**NOTE:** if you want the command-line tool as well, you'll want to add the `-g`
flag to your `npm install` command.

CLI Tool
--------

```
$ kosu <query> [input]
```

The `kosu` command requires at least a query argument. This argument is JSON,
so must be quoted/escaped according to your shell's rules. By default, `kosu`
will read from stdin:

```
$ cat log.json | kosu '{"condition":{"type":"eq","left":"x","right":5}}'
```

By supplying a second argument, you can tell kosu to read from a file instead:

```
$ kosu '{"condition":{"type":"eq","left":"x","right":5}}' ~/log.json
```

Easy as pie!

API
---

**constructor**

Constructs a new Kosu object based on a query.

```javascript
new Kosu(query);
```

```javascript
var kosu = new Kosu({
  condition: {
    type: "eq",
    left: "x",
    right: 1,
  }
});
```

Arguments

* _query_ - an object specifying a [SIQL](https://github.com/siphon-io/docs/blob/master/siql.md)
  query

Example
-------

Also see [example.js](https://github.com/deoxxa/kosu/blob/master/example.js).

```javascript
var Kosu = require("kosu");

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
```

Output:

```
compiled filter function:

function anonymous(obj) {
return true && (obj && obj['x']) === 3 && (true && (obj && obj['info'] && obj['info']['time']) > '2012-08-24T00:00:00.000Z' && (obj && obj['info'] && obj['info']['time']) < '2012-08-24T23:59:59.999Z');
}

matching data:

{ x: 3, y: 7 }
```

License
-------

3-clause BSD. A copy is included with the source.

Contact
-------

* GitHub ([deoxxa](http://github.com/deoxxa))
* Twitter ([@deoxxa](http://twitter.com/deoxxa))
* Email ([deoxxa@fknsrs.biz](mailto:deoxxa@fknsrs.biz))
