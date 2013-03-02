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
    _call_super_: function(scope, method, _arguments_) {
      if (!scope._super_ || scope._super_.hasOwnProperty('_call_')) return;
      
      var fn = scope._super_[method];
      var args = Array.prototype.slice.call(arguments, 2);
      
      scope._super_._call_ = true;
      
      if (fn) fn.apply(this, args);
      
      this._call_super_.apply(this, arguments);
      delete scope._super_._call_;
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
    this._call_super_(this, 'constructor');
    
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
  init: function BBController() {
    this._call_super_(this, 'constructor');
  },
  
  statics: {
    
  },
  
  members: {
    
  }
});

/**
 * BB.View
 */
BB.View = BB.Object.Extend({
  init: function BBView(element) {
    this._call_super_(this, 'constructor');
    
    this.$element = $(this.element = $(element)[0]);
  },
  
  statics: {
    
  },
  
  members: {
    element: null,
    $element: null
  }
});

/**
 * BB.App
 */
BB.App = BB.Object.Extend({
  init: function BBApp(element) {
    this._call_super_(this, 'constructor');
    
    if (!element) return;
    
    this.$element = $(this.element = $(element)[0]);
    this.element.app = this;
  },
  
  statics: {
    
  },
  
  members: {
    element: null,
    $element: null
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
