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
  
  if (mixin.statics) _.extend(klass, mixin.statics);
  if (mixin.members) _.extend(proto, mixin.members);
};

BB.Mixins = BB.Mixins || {};

/**
 * BB.Mixins.Extendable
 */
BB.Mixins.Extendable = {
  statics: {
    Extend: function(subclass) {
      var sub = subclass.init || (function() {});
      sub.prototype = new this();
      sub.prototype.constructor = sub;
      sub.prototype._super_ = this.prototype;
      
      _.extend(sub, _.clone(this, true), _.clone(subclass.statics, true));
      _.extend(sub.prototype, subclass.members);
      
      return sub;
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
    this._super_.constructor();
  },
  
  statics: {
    _items: [],
    All: function() {
      return this._items;
    },
    Find: function(query) {
      
    }
  },
  
  members: {
    get: function(property) {
      
    },
    
    set: function(property, value) {
      
    }
  }
});

/**
 * BB.Controller
 */
BB.Controller = function BBController() {
  
};

BB.Controller.prototype = {
  constructor: BB.Controller
};

/**
 * BB.View
 */
BB.View = function BBView(element) {
  
};

BB.View.prototype = {
  constructor: BB.View,
  
  element: null,
  $element: null
};
