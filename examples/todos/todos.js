var o = new BB.Object();

o.on('change', function(evt, data) {
  console.log(evt, data);
});

var Foo = BB.Model.Extend({
  init: function Foo() {}
});

var Bar = BB.Model.Extend({
  init: function Bar() {}
});

var m = new BB.Model();
var foo = new Foo();
var bar = new Bar();
