var TodosApp = BB.App.Extend({
  init: function TodosApp(element) {
    this._call_super_(this, 'constructor', element);
  },
  
  statics: {
    
  },
  
  members: {
    
  }
});

var Todo = BB.Model.Extend({
  init: function Todo(object) {
    this._call_super_(this, 'constructor', object);
  }
});

new Todo({ id: 1 });
new Todo({ id: 2 });
new Todo({ id: 3 });

$(function() {
  window.app = $('div')[0].app;
});
