(function() {
  var method;
  var noop = function() {};
  var methods = [
    'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
    'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
    'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
    'timeStamp', 'trace', 'warn'
  ];
  var length = methods.length;
  
  window.console = window.console || {};

  while (length--) {
    method = methods[length];

    // Only stub undefined methods.
    if (!console[method]) console[method] = noop;
  }
})();

(function() {
  var clone = _.clone;
  _.clone = function(obj, deep) {
    return (deep) ? $.extend(true, {}, obj) : clone(obj);
  };
})();

(function($) {
  $.fn.serializeObject = function() {
    var result = {};
    var extend = function (i, element) {
      var node = result[element.name];
      
      if (typeof node !== 'undefined' && node !== null) {
        if ($.isArray(node)) {
          node.push(element.value);
        } else {
          result[element.name] = [node, element.value];
        }
      } else {
        result[element.name] = element.value;
      }
    };
    
    $.each(this.serializeArray(), extend);
    return result;
  };
})($);

window.BB = window.BB || {};

BB._NO_OP_ = (function() {
  var _NO_OP_ = function _NO_OP_() {};
  _NO_OP_.prototype = { constructor: _NO_OP_, '': '_NO_OP_' };
  
  return new _NO_OP_();
})();

BB.Mixin = function BBMixin(klass, mixin, withStaticMembers) {
  if (withStaticMembers) {
    _.extend(klass, mixin.statics);
    _.extend(klass, mixin.members);
    return;
  }
  
  var proto = klass.prototype;
  if (!proto) return console.error('Invalid class', klass);
  
  _.extend(klass, mixin.statics);
  _.extend(proto, mixin.members);
};

BB.Mixins = BB.Mixins || {};

/**
 * BB.Mixins.Extendable
 */
BB.Mixins.Extendable = {
  statics: {
    Extend: function(subclass) {
      if (!subclass || typeof subclass !== 'object') {
        return console.error('Invalid subclass definition', subclass);
      }
      
      var init = subclass.init;
      var type = typeof init;
      
      if (!init || (type !== 'function' && type !== 'string')) {
        return console.error('Invalid subclass constructor', init);
      }
      
      if (type === 'string') {
        init = (function(name) {
          var fn = new Function('return function ' + name + '() {\n' +
            '  this._call_super_init_(this, arguments);\n' +
          '}');
          
          return fn();
        })(init);
      }
      
      init.prototype = new this(BB._NO_OP_);
      init.prototype.constructor = init;
      
      init.prototype._class_ = subclass;
      init.prototype._super_ = this.prototype;
      
      _.extend(init, _.clone(this, true), _.clone(subclass.statics, true));
      _.extend(init.prototype, subclass.members);
      
      return init;
    }
  },
  
  members: {
    _call_super_: function(scope, method, args) {
      if (!scope._super_ || scope._super_.hasOwnProperty('_call_')) return;
      
      var fn = scope._super_[method];
      
      scope._super_._call_ = true;
      
      if (fn) fn.apply(this, args);
      
      this._call_super_.apply(this, arguments);
      delete scope._super_._call_;
    },
    
    _call_super_init_: function(scope, args) {
      this._call_super_(scope, 'constructor', args);
    }
  }
};

/**
 * BB.Mixins.Eventable
 */
BB.Mixins.Eventable = {
  members: {
    _events: null,
    
    on: function(event, callback, scope) {
      var events = this._events = this._events || {};
      var callbacks = events[event] = events[event] || [];
      
      if (!_.contains(callbacks, callback)) callbacks.push(callback);
      if (scope) callback._scope_ = scope;
      
      return this;
    },
    
    off: function(event, callback) {
      var events = this._events = this._events || {};
      
      if (!eventHandler) {
        delete events[event];
        return this;
      }
      
      var callbacks = events[event];
      var index = _.indexOf(callbacks, callback);
       
      if (index !== -1) callbacks.splice(index, 1);
      if (callbacks.length === 0) delete events[event];
      
      return this;
    },
    
    trigger: function(event, _arguments_) {
      var events = this._events = this._events || {};
      var name = event.event;
      if (!name) return console.error('Invalid event', event);
      
      var callbacks = events[name] || [];
      var args = [event].concat(Array.prototype.slice.call(arguments, 1));
      
      _.each(callbacks, function(callback, index) {
        if (typeof callback === 'function') {
          callback.apply((callback._scope_) ? callback._scope_ : this, args);
        }
        
        else {
          callback = this[callback];
          
          if (typeof callback === 'function') {
            callback.apply((callback._scope_) ? callback._scope_ : this, args);
          }
        }
      }, this);
    }
  }
};

/**
 * BB.Object
 */
BB.Object = function BBObject() {
  if (arguments[0] === BB._NO_OP_) return this;
  
  this._properties = {};
};

BB.Object.prototype = {
  constructor: BB.Object,
  
  _properties: null,
  
  get: function(property) {
    return this._properties[property];
  },
  
  set: function(property, value) {
    var properties = this._properties;
    var previousValue = properties[property];
    properties[property] = value;
    this.trigger({
      event: 'change',
      data: this,
      property: property,
      previousValue: previousValue,
      value: value
    });
  }
};

// Add Extendable mixin to BB.Object
BB.Mixin(BB.Object, BB.Mixins.Extendable);

// Add Eventable mixin to BB.Object
BB.Mixin(BB.Object, BB.Mixins.Eventable);

/**
 * BB.Model
 */
BB.Model = BB.Object.Extend({
  init: function BBModel(object) {
    this._call_super_init_(this, arguments);
    if (arguments[0] === BB._NO_OP_) return this;
    
    this._properties = object;
  }
});

/**
 * BB.Collection
 */
BB.Collection = BB.Object.Extend({
  init: function BBCollection(type, array) {
    this._call_super_init_(this, arguments);
    if (arguments[0] === BB._NO_OP_) return this;
    
    if (typeof type !== 'function') {
      return console.error('Invalid model type', type);
    }
    
    this._type = type;
    this._items = [];
  },
  
  members: {
    _triggerChange: function(_arguments_) {
      this.trigger.apply(this, arguments);
    },
    
    _type: null,
    
    getType: function() { return this._type; },
    
    _items: null,
    
    all: function() { return this._items; },
    
    find: function(criteria) {
      if (typeof criteria === 'function') {
        return _.find(this._items, iterator);
      }
      
      if (typeof criteria === 'object') {
        return _.findWhere(this._items, criteria);
      }
      
      return _.findWhere(this._items, { id: criteria });
    },
    
    where: function(criteria) {
      if (typeof criteria === 'function') {
        return _.filter(this._items, criteria);
      }
      
      if (typeof criteria === 'object') {
        return _.where(this._items, criteria);
      }
      
      console.error('Invalid criteria; Must be iterator or object', criteria);
    },
    
    add: function(model) {
      this._items.push(model);
      this.trigger({ event: 'add', data: model });
      
      // var self = this;
      // model.on('change', function(evt) {
      //   self.trigger.apply(self, arguments);
      // });
      
      model.on('change', this._triggerChange, this);
    },
    
    remove: function(model) {
      
    },
    
    removeAll: function() {
      
    },
    
    create: function(object) {
      this.add(new this._type(object));
    }
  }
});

/**
 * BB.Controller
 */
BB.Controller = BB.Object.Extend({
  init: function BBController(app) {
    this._call_super_init_(this, arguments);
    if (arguments[0] === BB._NO_OP_) return this;
    
    this._app = app;
    
    var viewEvents = this.constructor._viewEvents;
    
    _.defer(function(self) {
      _.each(viewEvents, function(value, key) {
        var handler = value;
        var type = typeof handler;
        if (!handler || (type !== 'function' && type !== 'string')) {
          return console.error('Invalid event handler', handler);
        }
        
        if (type === 'string') {
          handler = self[handler];
          type = typeof handler;
          
          if (!handler || type !== 'function') {
            return console.error('Invalid event handler', value);
          }
        }
        
        var parts = key.split(' ');
        var event = _.first(parts);
        var selector = $.trim(_.rest(parts).join(' '));
        
        if (selector) {
          self._view.$on(event, selector, handler);
        }
        
        else {
          self._view.$on(event, handler);
        }
      });
    }, this);
  },
  
  statics: {
    _viewEvents: null,
    
    ViewEvents: function(viewEvents) {
      this._viewEvents = viewEvents;
      return this;
    }
  },
  
  members: {
    _app: null,
    
    getApp: function() { return this._app; },
    
    _view: null,
    
    getView: function() { return this._view; },
    
    setView: function(view) {
      this._view = view;
      view._app = this._app;
    }
  }
});

/**
 * BB.View
 */
BB.View = BB.Object.Extend({
  init: function BBView(elementOrData, data) {
    this._call_super_init_(this, arguments);
    if (arguments[0] === BB._NO_OP_) return this;
    
    this._subviews = [];
    
    var wrapper = this.getWrapper();
    if (!wrapper || _.isElement(elementOrData)) {
      this.$element = $(this.element = $(elementOrData)[0]).attr('data-bb-view', '');
      this._data = data || null;
    }
    
    else if (wrapper) {
      this.$element = $(this.element = $(wrapper)[0]).attr('data-bb-view', '');
      this._data = elementOrData || null;
    }

    _.defer(function(self) { self.render(); }, this);
  },
  
  statics: {
    _wrapper: null,
    
    Wrapper: function(wrapper) {
      this._wrapper = wrapper;
      return this;
    },
    
    _template: null,
    
    Template: function(template) {
      if (template && !_.isFunction(template)) {
        console.error('Invalid template', template);
        return this;
      }
      
      this._template = template;
      return this;
    }
  },
  
  members: {
    element: null,
    $element: null,
    
    getWrapper: function() {
      return this.constructor._wrapper;
    },
    
    getTemplate: function() {
      return this.constructor._template;
    },
    
    _app: null,
    
    getApp: function() { return this._app; },
    
    _data: null,
    
    getData: function() { return this._data; },
    
    setData: function(data) {
      this._data = data;
      this.render();
    },
    
    _parent: null,
    
    getParent: function() { return this._parent; },
    
    _subviews: null,
    
    getSubviews: function() { return this._subviews; },
    
    getSubviewForElement: function(element) {
      if (!element || !_.isObject(element)) {
        console.error('Invalid element', element);
        return null;
      }
      
      var $element = _.isElement(element) ? $(element) : element;
      var viewElement = $element.closest('[data-bb-view]')[0];
      if (!viewElement) return this;
      
      return _.findWhere(this._subviews, { element: viewElement }) || this;
    },
    
    getSubviewForData: function(data) {
      return _.findWhere(this._subviews, { _data: data });
    },
    
    append: function(subview) {
      this._subviews.push(subview);
      this.$element.append(subview.$element);
      
      subview._app = this._app;
      subview._parent = this;
    },
    
    remove: function(subview) {
      var subviews = this._subviews;
      var index = _.indexOf(subviews, subview);
      
      if (index !== -1) {
        subviews.splice(index, 1);
        subview.$element.remove();
        subview._app = subview._parent = null;
      }
    },
    
    removeAll: function() {
      var subviews = this._subviews;
      for (var i = 0, length = subviews.length; i < length; i++) {
        subview.$element.remove();
        subview._app = subview._parent = null;
      }
      
      this._subviews.length = 0;
    },
    
    $on: function(_arguments_) {
      var fn;
      var args = _.reject(arguments, function(argument) {
        if (typeof argument === 'function') {
          fn = argument;
          return true;
        }
        
        return false;
      });
      
      if (!fn) {
        return console.error('No valid event handler specified', arguments);
      }
      
      var self = this;
      var handler = function() {
        fn.apply(self, arguments);
      };
      
      handler.fn = fn;
      
      args.push(handler);
      
      this.$element.on.apply(this.$element, args);
    },
    
    $off: function(_arguments_) {
      this.$element.off.apply(this.$element, arguments);
    },
    
    $trigger: function(_arguments_) {
      this.$element.trigger.apply(this.$element, arguments);
    },
    
    render: function() {
      var template = this.getTemplate();
      if (!template) return;
      
      var data = this._data;
      data = (data instanceof BB.Model) ? data._properties : data;
      
      this.$element.html(template(data));
    }
  }
});

/**
 * BB.Router
 */
BB.Router = BB.Object.Extend({
  init: function BBRouter(routes, app) {
    this._call_super_init_(this, arguments);
    if (arguments[0] === BB._NO_OP_) return this;
    
    this._routes = routes;
    this._app = app;
  },
   
  members: {    
    _routes: null,
    
    _app: null,
    
    getApp: function() {
      return this._app;
    },
    
    _current: null,
    
    getCurrent: function() {
      return this._current;
    },
    
    setCurrent: function(path) {
      var app = this._app;
      var controllers = this._routes[path];
      if (!_.isArray(controllers)) controllers = [controllers];
      
      _.each(controllers, function(controller) {
        controller = new controller(app);
      });
      
      this._current = {
        path: path,
        controllers: controllers
      };
    }
  }
});

/**
 * BB.App
 */
BB.App = BB.Object.Extend({
  init: function BBApp(element) {
    this._call_super_init_(this, arguments);
    if (arguments[0] === BB._NO_OP_) return this;
    
    if (!element) return;
    
    this.$element = $(this.element = $(element)[0]);
    this.element.app = this;
    
    this.router = new BB.Router(this.router, this);
  },
  
  members: {
    element: null,
    $element: null,
    
    router: null
  }
});

$(function() {
  
  // Auto-init all BB.App elements
  var $apps = $('[data-bb-app]');
  $apps.each(function(index, element) {
    var App = window[$(element).attr('data-bb-app')];
    if (App) new App(element);
  });
});
