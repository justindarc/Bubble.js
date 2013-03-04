/**
 * Models
 */
var Todo = BB.Model.Extend({ init: 'Todo' });

/**
 * Views
 */
var TodoListItemView = BB.View.Extend({
  init: 'TodoListItemView'
}).Wrapper('<li/>').Template(_.template('<label><input type="checkbox"<%= completed ? " checked" : "" %>> <%= title %></label>'));
 
var TodoListView = BB.CollectionView.Extend({ init: 'TodoListView' }).ItemView(TodoListItemView);

/**
 * Controllers
 */
var TodoFormController = BB.Controller.Extend({
  init: function TodoFormController(app) {
    this._call_super_init_(this, arguments);
    
    this.setView(new BB.View(app.$element.find('.todo-form-view')));
  }
}).ViewEvents({
  'submit': function(evt) {
    var $input = this.$element.find('.todo-title-input');
    var todos = this.getApp().todos;
    todos.create({ title: $input.val(), completed: false });
    
    $input.val('');
    
    evt.preventDefault();
  }
});

var TodoListController = BB.Controller.Extend({
  init: function TodoListController(app) {
    this._call_super_init_(this, arguments);
    
    var todos = app.todos;
    todos.on('add',    _.bind(this.add,    this));
    todos.on('change', _.bind(this.change, this));
    
    this.setView(new TodoListView(app.$element.find('.todo-list-view'), todos.all()));
  },
  
  members: {    
    add: function(evt) {
      var todo = evt.data;
      this.getView().append(new TodoListItemView(todo));
    },
    
    change: function(evt) {
      var todo = evt.data;
      this.getView().getSubviewForData(todo).render();
    }
  }
}).ViewEvents({
  'change input[type="checkbox"]': function(evt) {
    var $input = $(evt.target);
    var todo = this.getSubviewForElement($input).getData();
    todo.set('completed', $input.is(':checked'));
  }
});

/**
 * App
 */
var TodosApp = BB.App.Extend({
  init: function TodosApp() {
    this._call_super_init_(this, arguments);
    
    this.todos = new BB.Collection(Todo);
  },
  
  members: {
    router: {
      '/': [TodoListController, TodoFormController]
    }
  }
});

$(function() {  
  var app = window.app = $('#app')[0].app;
  
  app.todos.create({ title: 'Task 1', completed: false });
  app.todos.create({ title: 'Task 2', completed: true  });
  app.todos.create({ title: 'Task 3', completed: false });
  
  app.router.setCurrent('/');
});
