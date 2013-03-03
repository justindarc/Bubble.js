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

window.BB = window.BB || {};

BB.Mixin = function BBMixin(klass, mixin) {
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
      subclass = subclass || {};
      
      var sub = subclass.init || (function() {
        this._super_.constructor();
      });
      
      sub.prototype = new this();
      sub.prototype.constructor = sub;
      
      sub.prototype._class_ = subclass;
      sub.prototype._super_ = this.prototype;
      
      _.extend(sub, _.clone(this, true), _.clone(subclass.statics, true));
      _.extend(sub.prototype, subclass.members);
      
      return sub;
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
    
    on: function(event, callback) {
      var events = this._events = this._events || {};
      var callbacks = events[event] = events[event] || [];
      
      if (!_.contains(callbacks, callback)) callbacks.push(callback);
      
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
      var callbacks = events[event] || [];
      var args = [event].concat(Array.prototype.slice.call(arguments, 1));
      var self = this;
      
      _.each(callbacks, function(callback, index) {
        if (typeof callback === 'function') {
          callback.apply(self, args);
        }
        
        else {
          callback = self[callback];
          
          if (typeof callback === 'function') {
            callback.apply(self, args);
          }
        }
      });
    }
  }
};

/**
 * BB.Object
 */
BB.Object = function BBObject() {
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
    this.trigger('change', {
      object: this,
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
    
    if (!object) return;
    
    this._properties = object;
    this.constructor._items.push(this);
  },
  
  statics: {
    _items: [],
    
    All: function() {
      return this._items;
    },
    Find: function(criteria) {
      if (typeof criteria === 'function') {
        return _.find(this._items, iterator);
      }
      
      if (typeof criteria === 'object') {
        return _.findWhere(this._items, criteria);
      }
      
      return _.findWhere(this._items, { id: criteria });
    },
    Where: function(criteria) {
      if (typeof criteria === 'function') {
        return _.filter(this._items, criteria);
      }
      
      if (typeof criteria === 'object') {
        return _.where(this._items, criteria);
      }
      
      console.error('Invalid criteria; Must be iterator or object', criteria);
    }
  },
  
  members: {
    
  }
});

/**
 * BB.Controller
 */
BB.Controller = BB.Object.Extend({
  init: function BBController(app) {
    this._call_super_init_(this, arguments);
    
    this._app = app;
  },
  
  members: {
    _app: null,
    
    getApp: function() {
      return this._app;
    }
  }
});

/**
 * BB.View
 */
BB.View = BB.Object.Extend({
  init: function BBView(elementOrData, data) {
    this._call_super_init_(this, arguments);
    
    var wrapper = this.getWrapper();
    if (!wrapper || _.isElement(elementOrData)) {
      this.$element = $(this.element = $(elementOrData)[0]);
      this.setData(data || null);
    }
    
    else if (wrapper) {
      this.$element = $(this.element = $(wrapper)[0]);
      this.setData(elementOrData || null);
    }
    
    this._subviews = [];
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
    
    _data: null,
    
    getData: function() {
      return this._data;
    },
    
    setData: function(data) {
      this._data = data;
      this.render();
    },
    
    _subviews: null,
    
    getSubviews: function() {
      return this._subviews;
    },
    
    append: function(subview) {
      this._subviews.push(subview);
      this.$element.append(subview.$element);
    },
    
    remove: function(subview) {
      var subviews = this._subviews;
      var index = _.indexOf(subviews, subview);
      
      if (index !== -1) {
        subviews.splice(index, 1);
        subview.$element.remove();
      }
    },
    
    removeAll: function() {
      var subviews = this._subviews;
      for (var i = 0, length = subviews.length; i < length; i++) {
        subview.$element.remove();
      }
      
      this._subviews.length = 0;
    },
    
    render: function() {
      var template = this.getTemplate();
      if (!template) return;
      
      this.$element.html(template(this._data));
    }
  }
});

/**
 * BB.Router
 */
BB.Router = BB.Object.Extend({
  init: function BBRouter(routes, app) {
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
      var controller = this._routes[path];
      if (controller) controller = new controller(this._app);
      
      this._current = {
        path: path,
        controller: controller
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
