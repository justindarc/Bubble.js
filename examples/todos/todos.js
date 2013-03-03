var JST = {
  TodoListItemTemplate: _.template('<label><input type="checkbox"<%= completed ? " checked" : "" %>> <%= title %></label>')
};

var TodoFormView = BB.View.Extend({
  init: function TodoFormView(elementOrData, data) {
    this._call_super_init_(this, arguments);
  }
});

var TodoFormController = BB.Controller.Extend({
  init: function TodoFormController(app) {
    this._call_super_init_(this, arguments);
    
    this.view = new TodoFormView(app.$element.find('.todo-form-view')[0]);
    this.view.$on('submit', this.$submit);
  },
  
  members: {
    $submit: function(evt) {
      var $element = $(evt.target);
      var todo = $element.serializeObject();
      todo.completed = false;
      todo = new Todo(todo);
      
      $element[0].reset();
      
      evt.preventDefault();
    }
  }
});

var TodoListView = BB.View.Extend({
  init: function TodoListView(elementOrData, data) {
    this._call_super_init_(this, arguments);
    
    this.render();
  },
  
  members: {
    render: function() {
      this.$element.empty();
      
      _.each(this._data, function(todo) {
        this.append(new TodoListItemView(todo));
      }, this);
    }
  }
});

var TodoListItemView = BB.View.Extend({
  init: function TodoListItemView(elementOrData, data) {
    this._call_super_init_(this, arguments);
  }
}).Wrapper('<li/>').Template(JST.TodoListItemTemplate);

var TodoListController = BB.Controller.Extend({
  init: function TodoListController(app) {
    this._call_super_init_(this, arguments);
    
    this.todos = Todo.All();
    Todo.on('create', _.bind(this.create, this));
    
    this.view = new TodoListView(app.$element.find('.todo-list-view')[0], this.todos);
    this.view.$on('change', 'input[type="checkbox"]', this.$change);
  },
  
  members: {    
    create: function(evt, data) {
      this.view.render();
    },
    
    $change: function(evt) {
      var $element = $(evt.target);
      var view = this.getSubviewForElement($element);
      var todo = view.getData();
      
      todo.set('completed', $element.is(':checked'));
    }
  }
});

var TodosApp = BB.App.Extend({
  init: function TodosApp(element) {
    this._call_super_init_(this, arguments);
  },
  
  members: {
    router: {
      '/': [TodoListController, TodoFormController]
    }
  }
});

var Todo = BB.Model.Extend({
  init: function Todo(object) {
    this._call_super_init_(this, arguments);
  }
});

$(function() {
  new Todo({ id: 1, title: 'Task 1', completed: false });
  new Todo({ id: 2, title: 'Task 2', completed: true });
  new Todo({ id: 3, title: 'Task 3', completed: false });
  
  var app = window.app = $('#app')[0].app;
  app.router.setCurrent('/');
});
