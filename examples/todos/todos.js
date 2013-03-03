var TodoListView = BB.View.Extend({
  init: function TodoListView(elementOrData, data) {
    this._call_super_init_(this, arguments);
    
    _.each(data, function(todo) {
      this.append(new TodoListItemView(todo));
    }, this);
  }
});

var TodoListItemView = BB.View.Extend({
  init: function TodoListItemView(elementOrData, data) {
    this._call_super_init_(this, arguments);
  }
}).Wrapper('<li/>').Template(_.template('<label><%= _properties.title %> <input type="checkbox"></label>'));

var TodoListController = BB.Controller.Extend({
  init: function TodoListController(app) {
    this._call_super_init_(this, arguments);
    
    this.todos = Todo.All();
    
    this.view = new TodoListView(app.$element.find('.todo-list-view')[0], this.todos);
  }
});

var TodosApp = BB.App.Extend({
  init: function TodosApp(element) {
    this._call_super_init_(this, arguments);
  },
  
  members: {
    router: {
      '/': TodoListController
    }
  }
});

var Todo = BB.Model.Extend({
  init: function Todo(object) {
    this._call_super_init_(this, arguments);
  }
});

$(function() {
  new Todo({ id: 1, title: 'Task 1' });
  new Todo({ id: 2, title: 'Task 2' });
  new Todo({ id: 3, title: 'Task 3' });
  
  var app = window.app = $('#app')[0].app;
  app.router.setCurrent('/');
});
