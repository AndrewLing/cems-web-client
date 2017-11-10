/**
 * @fileoverview Main function src.
 */

// HTML5 Shiv. Must be in <head> to support older browsers.
document.createElement('video');
document.createElement('audio');
document.createElement('track');

/**
 * Doubles as the main function for users to create a player instance and also
 * the main library object.
 *
 * **ALIASES** videojs, _V_ (deprecated)
 *
 * The `vjs` function can be used to initialize or retrieve a player.
 *
 *     var myPlayer = vjs('my_video_id');
 *
 * @param  {String|Element} id      Video element or video element ID
 * @param  {Object=} options        Optional options object for config/settings
 * @param  {Function=} ready        Optional ready callback
 * @return {vjs.Player}             A player instance
 * @namespace
 */
var vjs = function(id, options, ready){
  var tag; // Element of ID

  // Allow for element or ID to be passed in
  // String ID
  if (typeof id === 'string') {

    // Adjust for jQuery ID syntax
    if (id.indexOf('#') === 0) {
      id = id.slice(1);
    }

    // If a player instance has already been created for this ID return it.
    if (vjs.players[id]) {
      return vjs.players[id];

    // Otherwise get element for ID
    } else {
      tag = vjs.el(id);
    }

  // ID is a media element
  } else {
    tag = id;
  }

  // Check for a useable element
  if (!tag || !tag.nodeName) { // re: nodeName, could be a box div also
    throw new TypeError('The element or ID supplied is not valid. (videojs)'); // Returns
  }

  // Element may have a player attr referring to an already created player instance.
  // If not, set up a new player and return the instance.
  return tag['player'] || new vjs.Player(tag, options, ready);
};

// Extended name, also available externally, window.videojs
var videojs = vjs;
window.videojs = window.vjs = vjs;

// CDN Version. Used to target right flash swf.
vjs.CDN_VERSION = '4.3';
vjs.ACCESS_PROTOCOL = ('https:' == document.location.protocol ? 'https://' : 'http://');

/**
 * Global Player instance options, surfaced from vjs.Player.prototype.options_
 * vjs.options = vjs.Player.prototype.options_
 * All options should use string keys so they avoid
 * renaming by closure compiler
 * @type {Object}
 */
vjs.options = {
  // Default order of fallback technology
  'techOrder': ['html5','flash'],
  // techOrder: ['flash','html5'],

  'html5': {},
  'flash': {},

  // Default of web browser is 300x150. Should rely on source width/height.
  'width': 300,
  'height': 150,
  // defaultVolume: 0.85,
  'defaultVolume': 0.00, // The freakin seaguls are driving me crazy!

  // Included control sets
  'children': {
    'mediaLoader': {},
    'posterImage': {},
    'textTrackDisplay': {},
    'loadingSpinner': {},
    'bigPlayButton': {},
    'controlBar': {}
  },

  // Default message to show when a video cannot be played.
  'notSupportedMessage': 'Sorry, no compatible source and playback ' +
      'technology were found for this video. Try using another browser ' +
      'like <a href="http://bit.ly/ccMUEC">Chrome</a> or download the ' +
      'latest <a href="http://adobe.ly/mwfN1">Adobe Flash Player</a>.'
};

// Set CDN Version of swf
// The added (+) blocks the replace from changing this 4.3 string
if (vjs.CDN_VERSION !== 'GENERATED'+'_CDN_VSN') {
  videojs.options['flash']['swf'] = vjs.ACCESS_PROTOCOL + 'vjs.zencdn.net/'+vjs.CDN_VERSION+'/video-js.swf';
}

/**
 * Global player list
 * @type {Object}
 */
vjs.players = {};
/**
 * Core Object/Class for objects that use inheritance + contstructors
 *
 * To create a class that can be subclassed itself, extend the CoreObject class.
 *
 *     var Animal = CoreObject.extend();
 *     var Horse = Animal.extend();
 *
 * The constructor can be defined through the init property of an object argument.
 *
 *     var Animal = CoreObject.extend({
 *       init: function(name, sound){
 *         this.name = name;
 *       }
 *     });
 *
 * Other methods and properties can be added the same way, or directly to the
 * prototype.
 *
 *    var Animal = CoreObject.extend({
 *       init: function(name){
 *         this.name = name;
 *       },
 *       getName: function(){
 *         return this.name;
 *       },
 *       sound: '...'
 *    });
 *
 *    Animal.prototype.makeSound = function(){
 *      alert(this.sound);
 *    };
 *
 * To create an instance of a class, use the create method.
 *
 *    var fluffy = Animal.create('Fluffy');
 *    fluffy.getName(); // -> Fluffy
 *
 * Methods and properties can be overridden in subclasses.
 *
 *     var Horse = Animal.extend({
 *       sound: 'Neighhhhh!'
 *     });
 *
 *     var horsey = Horse.create('Horsey');
 *     horsey.getName(); // -> Horsey
 *     horsey.makeSound(); // -> Alert: Neighhhhh!
 *
 * @class
 * @constructor
 */
vjs.CoreObject = vjs['CoreObject'] = function(){};
// Manually exporting vjs['CoreObject'] here for Closure Compiler
// because of the use of the extend/create class methods
// If we didn't do this, those functions would get flattend to something like
// `a = ...` and `this.prototype` would refer to the global object instead of
// CoreObject

/**
 * Create a new object that inherits from this Object
 *
 *     var Animal = CoreObject.extend();
 *     var Horse = Animal.extend();
 *
 * @param {Object} props Functions and properties to be applied to the
 *                       new object's prototype
 * @return {vjs.CoreObject} An object that inherits from CoreObject
 * @this {*}
 */
vjs.CoreObject.extend = function(props){
  var init, subObj;

  props = props || {};
  // Set up the constructor using the supplied init method
  // or using the init of the parent object
  // Make sure to check the unobfuscated version for external libs
  init = props['init'] || props.init || this.prototype['init'] || this.prototype.init || function(){};
  // In Resig's simple class inheritance (previously used) the constructor
  //  is a function that calls `this.init.apply(arguments)`
  // However that would prevent us from using `ParentObject.call(this);`
  //  in a Child constuctor because the `this` in `this.init`
  //  would still refer to the Child and cause an inifinite loop.
  // We would instead have to do
  //    `ParentObject.prototype.init.apply(this, argumnents);`
  //  Bleh. We're not creating a _super() function, so it's good to keep
  //  the parent constructor reference simple.
  subObj = function(){
    init.apply(this, arguments);
  };

  // Inherit from this object's prototype
  subObj.prototype = vjs.obj.create(this.prototype);
  // Reset the constructor property for subObj otherwise
  // instances of subObj would have the constructor of the parent Object
  subObj.prototype.constructor = subObj;

  // Make the class extendable
  subObj.extend = vjs.CoreObject.extend;
  // Make a function for creating instances
  subObj.create = vjs.CoreObject.create;

  // Extend subObj's prototype with functions and other properties from props
  for (var name in props) {
    if (props.hasOwnProperty(name)) {
      subObj.prototype[name] = props[name];
    }
  }

  return subObj;
};

/**
 * Create a new instace of this Object class
 *
 *     var myAnimal = Animal.create();
 *
 * @return {vjs.CoreObject} An instance of a CoreObject subclass
 * @this {*}
 */
vjs.CoreObject.create = function(){
  // Create a new object that inherits from this object's prototype
  var inst = vjs.obj.create(this.prototype);

  // Apply this constructor function to the new object
  this.apply(inst, arguments);

  // Return the new object
  return inst;
};
/**
 * @fileoverview Event System (John Resig - Secrets of a JS Ninja http://jsninja.com/)
 * (Original book version wasn't completely usable, so fixed some things and made Closure Compiler compatible)
 * This should work very similarly to jQuery's events, however it's based off the book version which isn't as
 * robust as jquery's, so there's probably some differences.
 */

/**
 * Add an event listener to element
 * It stores the handler function in a separate cache object
 * and adds a generic handler to the element's event,
 * along with a unique id (guid) to the element.
 * @param  {Element|Object}   elem Element or object to bind listeners to
 * @param  {String}   type Type of event to bind to.
 * @param  {Function} fn   Event listener.
 * @private
 */
vjs.on = function(elem, type, fn){
  var data = vjs.getData(elem);

  // We need a place to store all our handler data
  if (!data.handlers) data.handlers = {};

  if (!data.handlers[type]) data.handlers[type] = [];

  if (!fn.guid) fn.guid = vjs.guid++;

  data.handlers[type].push(fn);

  if (!data.dispatcher) {
    data.disabled = false;

    data.dispatcher = function (event){

      if (data.disabled) return;
      event = vjs.fixEvent(event);

      var handlers = data.handlers[event.type];

      if (handlers) {
        // Copy handlers so if handlers are added/removed during the process it doesn't throw everything off.
        var handlersCopy = handlers.slice(0);

        for (var m = 0, n = handlersCopy.length; m < n; m++) {
          if (event.isImmediatePropagationStopped()) {
            break;
          } else {
            handlersCopy[m].call(elem, event);
          }
        }
      }
    };
  }

  if (data.handlers[type].length == 1) {
    if (document.addEventListener) {
      elem.addEventListener(type, data.dispatcher, false);
    } else if (document.attachEvent) {
      elem.attachEvent('on' + type, data.dispatcher);
    }
  }
};

/**
 * Removes event listeners from an element
 * @param  {Element|Object}   elem Object to remove listeners from
 * @param  {String=}   type Type of listener to remove. Don't include to remove all events from element.
 * @param  {Function} fn   Specific listener to remove. Don't incldue to remove listeners for an event type.
 * @private
 */
vjs.off = function(elem, type, fn) {
  // Don't want to add a cache object through getData if not needed
  if (!vjs.hasData(elem)) return;

  var data = vjs.getData(elem);

  // If no events exist, nothing to unbind
  if (!data.handlers) { return; }

  // Utility function
  var removeType = function(t){
     data.handlers[t] = [];
     vjs.cleanUpEvents(elem,t);
  };

  // Are we removing all bound events?
  if (!type) {
    for (var t in data.handlers) removeType(t);
    return;
  }

  var handlers = data.handlers[type];

  // If no handlers exist, nothing to unbind
  if (!handlers) return;

  // If no listener was provided, remove all listeners for type
  if (!fn) {
    removeType(type);
    return;
  }

  // We're only removing a single handler
  if (fn.guid) {
    for (var n = 0; n < handlers.length; n++) {
      if (handlers[n].guid === fn.guid) {
        handlers.splice(n--, 1);
      }
    }
  }

  vjs.cleanUpEvents(elem, type);
};

/**
 * Clean up the listener cache and dispatchers
 * @param  {Element|Object} elem Element to clean up
 * @param  {String} type Type of event to clean up
 * @private
 */
vjs.cleanUpEvents = function(elem, type) {
  var data = vjs.getData(elem);

  // Remove the events of a particular type if there are none left
  if (data.handlers[type].length === 0) {
    delete data.handlers[type];
    // data.handlers[type] = null;
    // Setting to null was causing an error with data.handlers

    // Remove the meta-handler from the element
    if (document.removeEventListener) {
      elem.removeEventListener(type, data.dispatcher, false);
    } else if (document.detachEvent) {
      elem.detachEvent('on' + type, data.dispatcher);
    }
  }

  // Remove the events object if there are no types left
  if (vjs.isEmpty(data.handlers)) {
    delete data.handlers;
    delete data.dispatcher;
    delete data.disabled;

    // data.handlers = null;
    // data.dispatcher = null;
    // data.disabled = null;
  }

  // Finally remove the expando if there is no data left
  if (vjs.isEmpty(data)) {
    vjs.removeData(elem);
  }
};

/**
 * Fix a native event to have standard property values
 * @param  {Object} event Event object to fix
 * @return {Object}
 * @private
 */
vjs.fixEvent = function(event) {

  function returnTrue() { return true; }
  function returnFalse() { return false; }

  // Test if fixing up is needed
  // Used to check if !event.stopPropagation instead of isPropagationStopped
  // But native events return true for stopPropagation, but don't have
  // other expected methods like isPropagationStopped. Seems to be a problem
  // with the Javascript Ninja code. So we're just overriding all events now.
  if (!event || !event.isPropagationStopped) {
    var old = event || window.event;

    event = {};
    // Clone the old object so that we can modify the values event = {};
    // IE8 Doesn't like when you mess with native event properties
    // Firefox returns false for event.hasOwnProperty('type') and other props
    //  which makes copying more difficult.
    // TODO: Probably best to create a whitelist of event props
    for (var key in old) {
      // Safari 6.0.3 warns you if you try to copy deprecated layerX/Y
      if (key !== 'layerX' && key !== 'layerY') {
        event[key] = old[key];
      }
    }

    // The event occurred on this element
    if (!event.target) {
      event.target = event.srcElement || document;
    }

    // Handle which other element the event is related to
    event.relatedTarget = event.fromElement === event.target ?
      event.toElement :
      event.fromElement;

    // Stop the default browser action
    event.preventDefault = function () {
      if (old.preventDefault) {
        old.preventDefault();
      }
      event.returnValue = false;
      event.isDefaultPrevented = returnTrue;
    };

    event.isDefaultPrevented = returnFalse;

    // Stop the event from bubbling
    event.stopPropagation = function () {
      if (old.stopPropagation) {
        old.stopPropagation();
      }
      event.cancelBubble = true;
      event.isPropagationStopped = returnTrue;
    };

    event.isPropagationStopped = returnFalse;

    // Stop the event from bubbling and executing other handlers
    event.stopImmediatePropagation = function () {
      if (old.stopImmediatePropagation) {
        old.stopImmediatePropagation();
      }
      event.isImmediatePropagationStopped = returnTrue;
      event.stopPropagation();
    };

    event.isImmediatePropagationStopped = returnFalse;

    // Handle mouse position
    if (event.clientX != null) {
      var doc = document.documentElement, body = document.body;

      event.pageX = event.clientX +
        (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
        (doc && doc.clientLeft || body && body.clientLeft || 0);
      event.pageY = event.clientY +
        (doc && doc.scrollTop || body && body.scrollTop || 0) -
        (doc && doc.clientTop || body && body.clientTop || 0);
    }

    // Handle key presses
    event.which = event.charCode || event.keyCode;

    // Fix button for mouse clicks:
    // 0 == left; 1 == middle; 2 == right
    if (event.button != null) {
      event.button = (event.button & 1 ? 0 :
        (event.button & 4 ? 1 :
          (event.button & 2 ? 2 : 0)));
    }
  }

  // Returns fixed-up instance
  return event;
};

/**
 * Trigger an event for an element
 * @param  {Element|Object} elem  Element to trigger an event on
 * @param  {String} event Type of event to trigger
 * @private
 */
vjs.trigger = function(elem, event) {
  // Fetches element data and a reference to the parent (for bubbling).
  // Don't want to add a data object to cache for every parent,
  // so checking hasData first.
  var elemData = (vjs.hasData(elem)) ? vjs.getData(elem) : {};
  var parent = elem.parentNode || elem.ownerDocument;
      // type = event.type || event,
      // handler;

  // If an event name was passed as a string, creates an event out of it
  if (typeof event === 'string') {
    event = { type:event, target:elem };
  }
  // Normalizes the event properties.
  event = vjs.fixEvent(event);

  // If the passed element has a dispatcher, executes the established handlers.
  if (elemData.dispatcher) {
    elemData.dispatcher.call(elem, event);
  }

  // Unless explicitly stopped or the event does not bubble (e.g. media events)
    // recursively calls this function to bubble the event up the DOM.
    if (parent && !event.isPropagationStopped() && event.bubbles !== false) {
    vjs.trigger(parent, event);

  // If at the top of the DOM, triggers the default action unless disabled.
  } else if (!parent && !event.isDefaultPrevented()) {
    var targetData = vjs.getData(event.target);

    // Checks if the target has a default action for this event.
    if (event.target[event.type]) {
      // Temporarily disables event dispatching on the target as we have already executed the handler.
      targetData.disabled = true;
      // Executes the default action.
      if (typeof event.target[event.type] === 'function') {
        event.target[event.type]();
      }
      // Re-enables event dispatching.
      targetData.disabled = false;
    }
  }

  // Inform the triggerer if the default was prevented by returning false
  return !event.isDefaultPrevented();
  /* Original version of js ninja events wasn't complete.
   * We've since updated to the latest version, but keeping this around
   * for now just in case.
   */
  // // Added in attion to book. Book code was broke.
  // event = typeof event === 'object' ?
  //   event[vjs.expando] ?
  //     event :
  //     new vjs.Event(type, event) :
  //   new vjs.Event(type);

  // event.type = type;
  // if (handler) {
  //   handler.call(elem, event);
  // }

  // // Clean up the event in case it is being reused
  // event.result = undefined;
  // event.target = elem;
};

/**
 * Trigger a listener only once for an event
 * @param  {Element|Object}   elem Element or object to
 * @param  {String}   type
 * @param  {Function} fn
 * @private
 */
vjs.one = function(elem, type, fn) {
  var func = function(){
    vjs.off(elem, type, func);
    fn.apply(this, arguments);
  };
  func.guid = fn.guid = fn.guid || vjs.guid++;
  vjs.on(elem, type, func);
};
var hasOwnProp = Object.prototype.hasOwnProperty;

/**
 * Creates an element and applies properties.
 * @param  {String=} tagName    Name of tag to be created.
 * @param  {Object=} properties Element properties to be applied.
 * @return {Element}
 * @private
 */
vjs.createEl = function(tagName, properties){
  var el, propName;

  el = document.createElement(tagName || 'div');

  for (propName in properties){
    if (hasOwnProp.call(properties, propName)) {
      //el[propName] = properties[propName];
      // Not remembering why we were checking for dash
      // but using setAttribute means you have to use getAttribute

      // The check for dash checks for the aria-* attributes, like aria-label, aria-valuemin.
      // The additional check for "role" is because the default method for adding attributes does not
      // add the attribute "role". My guess is because it's not a valid attribute in some namespaces, although
      // browsers handle the attribute just fine. The W3C allows for aria-* attributes to be used in pre-HTML5 docs.
      // http://www.w3.org/TR/wai-aria-primer/#ariahtml. Using setAttribute gets around this problem.

       if (propName.indexOf('aria-') !== -1 || propName=='role') {
         el.setAttribute(propName, properties[propName]);
       } else {
         el[propName] = properties[propName];
       }
    }
  }
  return el;
};

/**
 * Uppercase the first letter of a string
 * @param  {String} string String to be uppercased
 * @return {String}
 * @private
 */
vjs.capitalize = function(string){
  return string.charAt(0).toUpperCase() + string.slice(1);
};

/**
 * Object functions container
 * @type {Object}
 * @private
 */
vjs.obj = {};

/**
 * Object.create shim for prototypal inheritance
 *
 * https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/create
 *
 * @function
 * @param  {Object}   obj Object to use as prototype
 * @private
 */
 vjs.obj.create = Object.create || function(obj){
  //Create a new function called 'F' which is just an empty object.
  function F() {}

  //the prototype of the 'F' function should point to the
  //parameter of the anonymous function.
  F.prototype = obj;

  //create a new constructor function based off of the 'F' function.
  return new F();
};

/**
 * Loop through each property in an object and call a function
 * whose arguments are (key,value)
 * @param  {Object}   obj Object of properties
 * @param  {Function} fn  Function to be called on each property.
 * @this {*}
 * @private
 */
vjs.obj.each = function(obj, fn, context){
  for (var key in obj) {
    if (hasOwnProp.call(obj, key)) {
      fn.call(context || this, key, obj[key]);
    }
  }
};

/**
 * Merge two objects together and return the original.
 * @param  {Object} obj1
 * @param  {Object} obj2
 * @return {Object}
 * @private
 */
vjs.obj.merge = function(obj1, obj2){
  if (!obj2) { return obj1; }
  for (var key in obj2){
    if (hasOwnProp.call(obj2, key)) {
      obj1[key] = obj2[key];
    }
  }
  return obj1;
};

/**
 * Merge two objects, and merge any properties that are objects
 * instead of just overwriting one. Uses to merge options hashes
 * where deeper default settings are important.
 * @param  {Object} obj1 Object to override
 * @param  {Object} obj2 Overriding object
 * @return {Object}      New object. Obj1 and Obj2 will be untouched.
 * @private
 */
vjs.obj.deepMerge = function(obj1, obj2){
  var key, val1, val2;

  // make a copy of obj1 so we're not ovewriting original values.
  // like prototype.options_ and all sub options objects
  obj1 = vjs.obj.copy(obj1);

  for (key in obj2){
    if (hasOwnProp.call(obj2, key)) {
      val1 = obj1[key];
      val2 = obj2[key];

      // Check if both properties are pure objects and do a deep merge if so
      if (vjs.obj.isPlain(val1) && vjs.obj.isPlain(val2)) {
        obj1[key] = vjs.obj.deepMerge(val1, val2);
      } else {
        obj1[key] = obj2[key];
      }
    }
  }
  return obj1;
};

/**
 * Make a copy of the supplied object
 * @param  {Object} obj Object to copy
 * @return {Object}     Copy of object
 * @private
 */
vjs.obj.copy = function(obj){
  return vjs.obj.merge({}, obj);
};

/**
 * Check if an object is plain, and not a dom node or any object sub-instance
 * @param  {Object} obj Object to check
 * @return {Boolean}     True if plain, false otherwise
 * @private
 */
vjs.obj.isPlain = function(obj){
  return !!obj
    && typeof obj === 'object'
    && obj.toString() === '[object Object]'
    && obj.constructor === Object;
};

/**
 * Bind (a.k.a proxy or Context). A simple method for changing the context of a function
   It also stores a unique id on the function so it can be easily removed from events
 * @param  {*}   context The object to bind as scope
 * @param  {Function} fn      The function to be bound to a scope
 * @param  {Number=}   uid     An optional unique ID for the function to be set
 * @return {Function}
 * @private
 */
vjs.bind = function(context, fn, uid) {
  // Make sure the function has a unique ID
  if (!fn.guid) { fn.guid = vjs.guid++; }

  // Create the new function that changes the context
  var ret = function() {
    return fn.apply(context, arguments);
  };

  // Allow for the ability to individualize this function
  // Needed in the case where multiple objects might share the same prototype
  // IF both items add an event listener with the same function, then you try to remove just one
  // it will remove both because they both have the same guid.
  // when using this, you need to use the bind method when you remove the listener as well.
  // currently used in text tracks
  ret.guid = (uid) ? uid + '_' + fn.guid : fn.guid;

  return ret;
};

/**
 * Element Data Store. Allows for binding data to an element without putting it directly on the element.
 * Ex. Event listneres are stored here.
 * (also from jsninja.com, slightly modified and updated for closure compiler)
 * @type {Object}
 * @private
 */
vjs.cache = {};

/**
 * Unique ID for an element or function
 * @type {Number}
 * @private
 */
vjs.guid = 1;

/**
 * Unique attribute name to store an element's guid in
 * @type {String}
 * @constant
 * @private
 */
vjs.expando = 'vdata' + (new Date()).getTime();

/**
 * Returns the cache object where data for an element is stored
 * @param  {Element} el Element to store data for.
 * @return {Object}
 * @private
 */
vjs.getData = function(el){
  var id = el[vjs.expando];
  if (!id) {
    id = el[vjs.expando] = vjs.guid++;
    vjs.cache[id] = {};
  }
  return vjs.cache[id];
};

/**
 * Returns the cache object where data for an element is stored
 * @param  {Element} el Element to store data for.
 * @return {Object}
 * @private
 */
vjs.hasData = function(el){
  var id = el[vjs.expando];
  return !(!id || vjs.isEmpty(vjs.cache[id]));
};

/**
 * Delete data for the element from the cache and the guid attr from getElementById
 * @param  {Element} el Remove data for an element
 * @private
 */
vjs.removeData = function(el){
  var id = el[vjs.expando];
  if (!id) { return; }
  // Remove all stored data
  // Changed to = null
  // http://coding.smashingmagazine.com/2012/11/05/writing-fast-memory-efficient-javascript/
  // vjs.cache[id] = null;
  delete vjs.cache[id];

  // Remove the expando property from the DOM node
  try {
    delete el[vjs.expando];
  } catch(e) {
    if (el.removeAttribute) {
      el.removeAttribute(vjs.expando);
    } else {
      // IE doesn't appear to support removeAttribute on the document element
      el[vjs.expando] = null;
    }
  }
};

/**
 * Check if an object is empty
 * @param  {Object}  obj The object to check for emptiness
 * @return {Boolean}
 * @private
 */
vjs.isEmpty = function(obj) {
  for (var prop in obj) {
    // Inlude null properties as empty.
    if (obj[prop] !== null) {
      return false;
    }
  }
  return true;
};

/**
 * Add a CSS class name to an element
 * @param {Element} element    Element to add class name to
 * @param {String} classToAdd Classname to add
 * @private
 */
vjs.addClass = function(element, classToAdd){
  if ((' '+element.className+' ').indexOf(' '+classToAdd+' ') == -1) {
    element.className = element.className === '' ? classToAdd : element.className + ' ' + classToAdd;
  }
};

/**
 * Remove a CSS class name from an element
 * @param {Element} element    Element to remove from class name
 * @param {String} classToAdd Classname to remove
 * @private
 */
vjs.removeClass = function(element, classToRemove){
  var classNames, i;

  if (element.className.indexOf(classToRemove) == -1) { return; }

  classNames = element.className.split(' ');

  // no arr.indexOf in ie8, and we don't want to add a big shim
  for (i = classNames.length - 1; i >= 0; i--) {
    if (classNames[i] === classToRemove) {
      classNames.splice(i,1);
    }
  }

  element.className = classNames.join(' ');
};

/**
 * Element for testing browser HTML5 video capabilities
 * @type {Element}
 * @constant
 * @private
 */
vjs.TEST_VID = vjs.createEl('video');

/**
 * Useragent for browser testing.
 * @type {String}
 * @constant
 * @private
 */
vjs.USER_AGENT = navigator.userAgent;

/**
 * Device is an iPhone
 * @type {Boolean}
 * @constant
 * @private
 */
vjs.IS_IPHONE = (/iPhone/i).test(vjs.USER_AGENT);
vjs.IS_IPAD = (/iPad/i).test(vjs.USER_AGENT);
vjs.IS_IPOD = (/iPod/i).test(vjs.USER_AGENT);
vjs.IS_IOS = vjs.IS_IPHONE || vjs.IS_IPAD || vjs.IS_IPOD;

vjs.IOS_VERSION = (function(){
  var match = vjs.USER_AGENT.match(/OS (\d+)_/i);
  if (match && match[1]) { return match[1]; }
})();

vjs.IS_ANDROID = (/Android/i).test(vjs.USER_AGENT);
vjs.ANDROID_VERSION = (function() {
  // This matches Android Major.Minor.Patch versions
  // ANDROID_VERSION is Major.Minor as a Number, if Minor isn't available, then only Major is returned
  var match = vjs.USER_AGENT.match(/Android (\d+)(?:\.(\d+))?(?:\.(\d+))*/i),
    major,
    minor;

  if (!match) {
    return null;
  }

  major = match[1] && parseFloat(match[1]);
  minor = match[2] && parseFloat(match[2]);

  if (major && minor) {
    return parseFloat(match[1] + '.' + match[2]);
  } else if (major) {
    return major;
  } else {
    return null;
  }
})();
// Old Android is defined as Version older than 2.3, and requiring a webkit version of the android browser
vjs.IS_OLD_ANDROID = vjs.IS_ANDROID && (/webkit/i).test(vjs.USER_AGENT) && vjs.ANDROID_VERSION < 2.3;

vjs.IS_FIREFOX = (/Firefox/i).test(vjs.USER_AGENT);
vjs.IS_CHROME = (/Chrome/i).test(vjs.USER_AGENT);

vjs.TOUCH_ENABLED = !!(('ontouchstart' in window) || window.DocumentTouch && document instanceof window.DocumentTouch);

/**
 * Get an element's attribute values, as defined on the HTML tag
 * Attributs are not the same as properties. They're defined on the tag
 * or with setAttribute (which shouldn't be used with HTML)
 * This will return true or false for boolean attributes.
 * @param  {Element} tag Element from which to get tag attributes
 * @return {Object}
 * @private
 */
vjs.getAttributeValues = function(tag){
  var obj, knownBooleans, attrs, attrName, attrVal;

  obj = {};

  // known boolean attributes
  // we can check for matching boolean properties, but older browsers
  // won't know about HTML5 boolean attributes that we still read from
  knownBooleans = ','+'autoplay,controls,loop,muted,default'+',';

  if (tag && tag.attributes && tag.attributes.length > 0) {
    attrs = tag.attributes;

    for (var i = attrs.length - 1; i >= 0; i--) {
      attrName = attrs[i].name;
      attrVal = attrs[i].value;

      // check for known booleans
      // the matching element property will return a value for typeof
      if (typeof tag[attrName] === 'boolean' || knownBooleans.indexOf(','+attrName+',') !== -1) {
        // the value of an included boolean attribute is typically an empty
        // string ('') which would equal false if we just check for a false value.
        // we also don't want support bad code like autoplay='false'
        attrVal = (attrVal !== null) ? true : false;
      }

      obj[attrName] = attrVal;
    }
  }

  return obj;
};

/**
 * Get the computed style value for an element
 * From http://robertnyman.com/2006/04/24/get-the-rendered-style-of-an-element/
 * @param  {Element} el        Element to get style value for
 * @param  {String} strCssRule Style name
 * @return {String}            Style value
 * @private
 */
vjs.getComputedDimension = function(el, strCssRule){
  var strValue = '';
  if(document.defaultView && document.defaultView.getComputedStyle){
    strValue = document.defaultView.getComputedStyle(el, '').getPropertyValue(strCssRule);

  } else if(el.currentStyle){
    // IE8 Width/Height support
    strValue = el['client'+strCssRule.substr(0,1).toUpperCase() + strCssRule.substr(1)] + 'px';
  }
  return strValue;
};

/**
 * Insert an element as the first child node of another
 * @param  {Element} child   Element to insert
 * @param  {[type]} parent Element to insert child into
 * @private
 */
vjs.insertFirst = function(child, parent){
  if (parent.firstChild) {
    parent.insertBefore(child, parent.firstChild);
  } else {
    parent.appendChild(child);
  }
};

/**
 * Object to hold browser support information
 * @type {Object}
 * @private
 */
vjs.support = {};

/**
 * Shorthand for document.getElementById()
 * Also allows for CSS (jQuery) ID syntax. But nothing other than IDs.
 * @param  {String} id  Element ID
 * @return {Element}    Element with supplied ID
 * @private
 */
vjs.el = function(id){
  if (id.indexOf('#') === 0) {
    id = id.slice(1);
  }

  return document.getElementById(id);
};

/**
 * Format seconds as a time string, H:MM:SS or M:SS
 * Supplying a guide (in seconds) will force a number of leading zeros
 * to cover the length of the guide
 * @param  {Number} seconds Number of seconds to be turned into a string
 * @param  {Number} guide   Number (in seconds) to model the string after
 * @return {String}         Time formatted as H:MM:SS or M:SS
 * @private
 */
vjs.formatTime = function(seconds, guide) {
  // Default to using seconds as guide
  guide = guide || seconds;
  var s = Math.floor(seconds % 60),
      m = Math.floor(seconds / 60 % 60),
      h = Math.floor(seconds / 3600),
      gm = Math.floor(guide / 60 % 60),
      gh = Math.floor(guide / 3600);

  // handle invalid times
  if (isNaN(seconds) || seconds === Infinity) {
    // '-' is false for all relational operators (e.g. <, >=) so this setting
    // will add the minimum number of fields specified by the guide
    h = m = s = '-';
  }

  // Check if we need to show hours
  h = (h > 0 || gh > 0) ? h + ':' : '';

  // If hours are showing, we may need to add a leading zero.
  // Always show at least one digit of minutes.
  m = (((h || gm >= 10) && m < 10) ? '0' + m : m) + ':';

  // Check if leading zero is need for seconds
  s = (s < 10) ? '0' + s : s;

  return h + m + s;
};

// Attempt to block the ability to select text while dragging controls
vjs.blockTextSelection = function(){
  document.body.focus();
  document.onselectstart = function () { return false; };
};
// Turn off text selection blocking
vjs.unblockTextSelection = function(){ document.onselectstart = function () { return true; }; };

/**
 * Trim whitespace from the ends of a string.
 * @param  {String} string String to trim
 * @return {String}        Trimmed string
 * @private
 */
vjs.trim = function(str){
  return (str+'').replace(/^\s+|\s+$/g, '');
};

/**
 * Should round off a number to a decimal place
 * @param  {Number} num Number to round
 * @param  {Number} dec Number of decimal places to round to
 * @return {Number}     Rounded number
 * @private
 */
vjs.round = function(num, dec) {
  if (!dec) { dec = 0; }
  return Math.round(num*Math.pow(10,dec))/Math.pow(10,dec);
};

/**
 * Should create a fake TimeRange object
 * Mimics an HTML5 time range instance, which has functions that
 * return the start and end times for a range
 * TimeRanges are returned by the buffered() method
 * @param  {Number} start Start time in seconds
 * @param  {Number} end   End time in seconds
 * @return {Object}       Fake TimeRange object
 * @private
 */
vjs.createTimeRange = function(start, end){
  return {
    length: 1,
    start: function() { return start; },
    end: function() { return end; }
  };
};

/**
 * Simple http request for retrieving external files (e.g. text tracks)
 * @param  {String} url           URL of resource
 * @param  {Function=} onSuccess  Success callback
 * @param  {Function=} onError    Error callback
 * @private
 */
vjs.get = function(url, onSuccess, onError){
  var local, request;

  if (typeof XMLHttpRequest === 'undefined') {
    window.XMLHttpRequest = function () {
      try { return new window.ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch (e) {}
      try { return new window.ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch (f) {}
      try { return new window.ActiveXObject('Msxml2.XMLHTTP'); } catch (g) {}
      throw new Error('This browser does not support XMLHttpRequest.');
    };
  }

  request = new XMLHttpRequest();
  try {
    request.open('GET', url);
  } catch(e) {
    onError(e);
  }

  local = (url.indexOf('file:') === 0 || (window.location.href.indexOf('file:') === 0 && url.indexOf('http') === -1));

  request.onreadystatechange = function() {
    if (request.readyState === 4) {
      if (request.status === 200 || local && request.status === 0) {
        onSuccess(request.responseText);
      } else {
        if (onError) {
          onError();
        }
      }
    }
  };

  try {
    request.send();
  } catch(e) {
    if (onError) {
      onError(e);
    }
  }
};

/**
 * Add to local storage (may removeable)
 * @private
 */
vjs.setLocalStorage = function(key, value){
  try {
    // IE was throwing errors referencing the var anywhere without this
    var localStorage = window.localStorage || false;
    if (!localStorage) { return; }
    localStorage[key] = value;
  } catch(e) {
    if (e.code == 22 || e.code == 1014) { // Webkit == 22 / Firefox == 1014
      vjs.log('LocalStorage Full (VideoJS)', e);
    } else {
      if (e.code == 18) {
        vjs.log('LocalStorage not allowed (VideoJS)', e);
      } else {
        vjs.log('LocalStorage Error (VideoJS)', e);
      }
    }
  }
};

/**
 * Get abosolute version of relative URL. Used to tell flash correct URL.
 * http://stackoverflow.com/questions/470832/getting-an-absolute-url-from-a-relative-one-ie6-issue
 * @param  {String} url URL to make absolute
 * @return {String}     Absolute URL
 * @private
 */
vjs.getAbsoluteURL = function(url){

  // Check if absolute URL
  if (!url.match(/^https?:\/\//)) {
    // Convert to absolute URL. Flash hosted off-site needs an absolute URL.
    url = vjs.createEl('div', {
      innerHTML: '<a href="'+url+'">x</a>'
    }).firstChild.href;
  }

  return url;
};

// usage: log('inside coolFunc',this,arguments);
// http://paulirish.com/2009/log-a-lightweight-wrapper-for-consolelog/
vjs.log = function(){
  vjs.log.history = vjs.log.history || [];   // store logs to an array for reference
  vjs.log.history.push(arguments);
  if(window.console){
    window.console.log(Array.prototype.slice.call(arguments));
  }
};

// Offset Left
// getBoundingClientRect technique from John Resig http://ejohn.org/blog/getboundingclientrect-is-awesome/
vjs.findPosition = function(el) {
    var box, docEl, body, clientLeft, scrollLeft, left, clientTop, scrollTop, top;

    if (el.getBoundingClientRect && el.parentNode) {
      box = el.getBoundingClientRect();
    }

    if (!box) {
      return {
        left: 0,
        top: 0
      };
    }

    docEl = document.documentElement;
    body = document.body;

    clientLeft = docEl.clientLeft || body.clientLeft || 0;
    scrollLeft = window.pageXOffset || body.scrollLeft;
    left = box.left + scrollLeft - clientLeft;

    clientTop = docEl.clientTop || body.clientTop || 0;
    scrollTop = window.pageYOffset || body.scrollTop;
    top = box.top + scrollTop - clientTop;

    return {
      left: left,
      top: top
    };
};
/**
 * @fileoverview Player Component - Base class for all UI objects
 *
 */

/**
 * Base UI Component class
 *
 * Components are embeddable UI objects that are represented by both a
 * javascript object and an element in the DOM. They can be children of other
 * components, and can have many children themselves.
 *
 *     // adding a button to the player
 *     var button = player.addChild('button');
 *     button.el(); // -> button element
 *
 *     <div class="video-js">
 *       <div class="vjs-button">Button</div>
 *     </div>
 *
 * Components are also event emitters.
 *
 *     button.on('click', function(){
 *       console.log('Button Clicked!');
 *     });
 *
 *     button.trigger('customevent');
 *
 * @param {Object} player  Main Player
 * @param {Object=} options
 * @class
 * @constructor
 * @extends vjs.CoreObject
 */
vjs.Component = vjs.CoreObject.extend({
  /**
   * the constructor funciton for the class
   *
   * @constructor
   */
  init: function(player, options, ready){
    this.player_ = player;

    // Make a copy of prototype.options_ to protect against overriding global defaults
    this.options_ = vjs.obj.copy(this.options_);

    // Updated options with supplied options
    options = this.options(options);

    // Get ID from options, element, or create using player ID and unique ID
    this.id_ = options['id'] || ((options['el'] && options['el']['id']) ? options['el']['id'] : player.id() + '_component_' + vjs.guid++ );

    this.name_ = options['name'] || null;

    // Create element if one wasn't provided in options
    this.el_ = options['el'] || this.createEl();

    this.children_ = [];
    this.childIndex_ = {};
    this.childNameIndex_ = {};

    // Add any child components in options
    this.initChildren();

    this.ready(ready);
    // Don't want to trigger ready here or it will before init is actually
    // finished for all children that run this constructor
  }
});

/**
 * Dispose of the component and all child components
 */
vjs.Component.prototype.dispose = function(){
  this.trigger('dispose');

  // Dispose all children.
  if (this.children_) {
    for (var i = this.children_.length - 1; i >= 0; i--) {
      if (this.children_[i].dispose) {
        this.children_[i].dispose();
      }
    }
  }

  // Delete child references
  this.children_ = null;
  this.childIndex_ = null;
  this.childNameIndex_ = null;

  // Remove all event listeners.
  this.off();

  // Remove element from DOM
  if (this.el_.parentNode) {
    this.el_.parentNode.removeChild(this.el_);
  }

  vjs.removeData(this.el_);
  this.el_ = null;
};

/**
 * Reference to main player instance
 *
 * @type {vjs.Player}
 * @private
 */
vjs.Component.prototype.player_ = true;

/**
 * Return the component's player
 *
 * @return {vjs.Player}
 */
vjs.Component.prototype.player = function(){
  return this.player_;
};

/**
 * The component's options object
 *
 * @type {Object}
 * @private
 */
vjs.Component.prototype.options_;

/**
 * Deep merge of options objects
 *
 * Whenever a property is an object on both options objects
 * the two properties will be merged using vjs.obj.deepMerge.
 *
 * This is used for merging options for child components. We
 * want it to be easy to override individual options on a child
 * component without having to rewrite all the other default options.
 *
 *     Parent.prototype.options_ = {
 *       children: {
 *         'childOne': { 'foo': 'bar', 'asdf': 'fdsa' },
 *         'childTwo': {},
 *         'childThree': {}
 *       }
 *     }
 *     newOptions = {
 *       children: {
 *         'childOne': { 'foo': 'baz', 'abc': '123' }
 *         'childTwo': null,
 *         'childFour': {}
 *       }
 *     }
 *
 *     this.options(newOptions);
 *
 * RESULT
 *
 *     {
 *       children: {
 *         'childOne': { 'foo': 'baz', 'asdf': 'fdsa', 'abc': '123' },
 *         'childTwo': null, // Disabled. Won't be initialized.
 *         'childThree': {},
 *         'childFour': {}
 *       }
 *     }
 *
 * @param  {Object} obj Object whose values will be overwritten
 * @return {Object}     NEW merged object. Does not return obj1.
 */
vjs.Component.prototype.options = function(obj){
  if (obj === undefined) return this.options_;

  return this.options_ = vjs.obj.deepMerge(this.options_, obj);
};

/**
 * The DOM element for the component
 *
 * @type {Element}
 * @private
 */
vjs.Component.prototype.el_;

/**
 * Create the component's DOM element
 *
 * @param  {String=} tagName  Element's node type. e.g. 'div'
 * @param  {Object=} attributes An object of element attributes that should be set on the element
 * @return {Element}
 */
vjs.Component.prototype.createEl = function(tagName, attributes){
  return vjs.createEl(tagName, attributes);
};

/**
 * Get the component's DOM element
 *
 *     var domEl = myComponent.el();
 *
 * @return {Element}
 */
vjs.Component.prototype.el = function(){
  return this.el_;
};

/**
 * An optional element where, if defined, children will be inserted instead of
 * directly in `el_`
 *
 * @type {Element}
 * @private
 */
vjs.Component.prototype.contentEl_;

/**
 * Return the component's DOM element for embedding content.
 * Will either be el_ or a new element defined in createEl.
 *
 * @return {Element}
 */
vjs.Component.prototype.contentEl = function(){
  return this.contentEl_ || this.el_;
};

/**
 * The ID for the component
 *
 * @type {String}
 * @private
 */
vjs.Component.prototype.id_;

/**
 * Get the component's ID
 *
 *     var id = myComponent.id();
 *
 * @return {String}
 */
vjs.Component.prototype.id = function(){
  return this.id_;
};

/**
 * The name for the component. Often used to reference the component.
 *
 * @type {String}
 * @private
 */
vjs.Component.prototype.name_;

/**
 * Get the component's name. The name is often used to reference the component.
 *
 *     var name = myComponent.name();
 *
 * @return {String}
 */
vjs.Component.prototype.name = function(){
  return this.name_;
};

/**
 * Array of child components
 *
 * @type {Array}
 * @private
 */
vjs.Component.prototype.children_;

/**
 * Get an array of all child components
 *
 *     var kids = myComponent.children();
 *
 * @return {Array} The children
 */
vjs.Component.prototype.children = function(){
  return this.children_;
};

/**
 * Object of child components by ID
 *
 * @type {Object}
 * @private
 */
vjs.Component.prototype.childIndex_;

/**
 * Returns a child component with the provided ID
 *
 * @return {vjs.Component}
 */
vjs.Component.prototype.getChildById = function(id){
  return this.childIndex_[id];
};

/**
 * Object of child components by name
 *
 * @type {Object}
 * @private
 */
vjs.Component.prototype.childNameIndex_;

/**
 * Returns a child component with the provided ID
 *
 * @return {vjs.Component}
 */
vjs.Component.prototype.getChild = function(name){
  return this.childNameIndex_[name];
};

/**
 * Adds a child component inside this component
 *
 *     myComponent.el();
 *     // -> <div class='my-component'></div>
 *     myComonent.children();
 *     // [empty array]
 *
 *     var myButton = myComponent.addChild('MyButton');
 *     // -> <div class='my-component'><div class="my-button">myButton<div></div>
 *     // -> myButton === myComonent.children()[0];
 *
 * Pass in options for child constructors and options for children of the child
 *
 *    var myButton = myComponent.addChild('MyButton', {
 *      text: 'Press Me',
 *      children: {
 *        buttonChildExample: {
 *          buttonChildOption: true
 *        }
 *      }
 *    });
 *
 * @param {String|vjs.Component} child The class name or instance of a child to add
 * @param {Object=} options Options, including options to be passed to children of the child.
 * @return {vjs.Component} The child component (created by this process if a string was used)
 * @suppress {accessControls|checkRegExp|checkTypes|checkVars|const|constantProperty|deprecated|duplicate|es5Strict|fileoverviewTags|globalThis|invalidCasts|missingProperties|nonStandardJsDocs|strictModuleDepCheck|undefinedNames|undefinedVars|unknownDefines|uselessCode|visibility}
 */
vjs.Component.prototype.addChild = function(child, options){
  var component, componentClass, componentName, componentId;

  // If string, create new component with options
  if (typeof child === 'string') {

    componentName = child;

    // Make sure options is at least an empty object to protect against errors
    options = options || {};

    // Assume name of set is a lowercased name of the UI Class (PlayButton, etc.)
    componentClass = options['componentClass'] || vjs.capitalize(componentName);

    // Set name through options
    options['name'] = componentName;

    // Create a new object & element for this controls set
    // If there's no .player_, this is a player
    // Closure Compiler throws an 'incomplete alias' warning if we use the vjs variable directly.
    // Every class should be exported, so this should never be a problem here.
    component = new window['videojs'][componentClass](this.player_ || this, options);

  // child is a component instance
  } else {
    component = child;
  }

  this.children_.push(component);

  if (typeof component.id === 'function') {
    this.childIndex_[component.id()] = component;
  }

  // If a name wasn't used to create the component, check if we can use the
  // name function of the component
  componentName = componentName || (component.name && component.name());

  if (componentName) {
    this.childNameIndex_[componentName] = component;
  }

  // Add the UI object's element to the container div (box)
  // Having an element is not required
  if (typeof component['el'] === 'function' && component['el']()) {
    this.contentEl().appendChild(component['el']());
  }

  // Return so it can stored on parent object if desired.
  return component;
};

/**
 * Remove a child component from this component's list of children, and the
 * child component's element from this component's element
 *
 * @param  {vjs.Component} component Component to remove
 */
vjs.Component.prototype.removeChild = function(component){
  if (typeof component === 'string') {
    component = this.getChild(component);
  }

  if (!component || !this.children_) return;

  var childFound = false;
  for (var i = this.children_.length - 1; i >= 0; i--) {
    if (this.children_[i] === component) {
      childFound = true;
      this.children_.splice(i,1);
      break;
    }
  }

  if (!childFound) return;

  this.childIndex_[component.id] = null;
  this.childNameIndex_[component.name] = null;

  var compEl = component.el();
  if (compEl && compEl.parentNode === this.contentEl()) {
    this.contentEl().removeChild(component.el());
  }
};

/**
 * Add and initialize default child components from options
 *
 *     // when an instance of MyComponent is created, all children in options
 *     // will be added to the instance by their name strings and options
 *     MyComponent.prototype.options_.children = {
 *       myChildComponent: {
 *         myChildOption: true
 *       }
 *     }
 */
vjs.Component.prototype.initChildren = function(){
  var options = this.options_;

  if (options && options['children']) {
    var self = this;

    // Loop through components and add them to the player
    vjs.obj.each(options['children'], function(name, opts){
      // Allow for disabling default components
      // e.g. vjs.options['children']['posterImage'] = false
      if (opts === false) return;

      // Allow waiting to add components until a specific event is called
      var tempAdd = function(){
        // Set property name on player. Could cause conflicts with other prop names, but it's worth making refs easy.
        self[name] = self.addChild(name, opts);
      };

      if (opts['loadEvent']) {
        // this.one(opts.loadEvent, tempAdd)
      } else {
        tempAdd();
      }
    });
  }
};

/**
 * Allows sub components to stack CSS class names
 *
 * @return {String} The constructed class name
 */
vjs.Component.prototype.buildCSSClass = function(){
    // Child classes can include a function that does:
    // return 'CLASS NAME' + this._super();
    return '';
};

/* Events
============================================================================= */

/**
 * Add an event listener to this component's element
 *
 *     var myFunc = function(){
 *       var myPlayer = this;
 *       // Do something when the event is fired
 *     };
 *
 *     myPlayer.on("eventName", myFunc);
 *
 * The context will be the component.
 *
 * @param  {String}   type The event type e.g. 'click'
 * @param  {Function} fn   The event listener
 * @return {vjs.Component} self
 */
vjs.Component.prototype.on = function(type, fn){
  vjs.on(this.el_, type, vjs.bind(this, fn));
  return this;
};

/**
 * Remove an event listener from the component's element
 *
 *     myComponent.off("eventName", myFunc);
 *
 * @param  {String=}   type Event type. Without type it will remove all listeners.
 * @param  {Function=} fn   Event listener. Without fn it will remove all listeners for a type.
 * @return {vjs.Component}
 */
vjs.Component.prototype.off = function(type, fn){
  vjs.off(this.el_, type, fn);
  return this;
};

/**
 * Add an event listener to be triggered only once and then removed
 *
 * @param  {String}   type Event type
 * @param  {Function} fn   Event listener
 * @return {vjs.Component}
 */
vjs.Component.prototype.one = function(type, fn) {
  vjs.one(this.el_, type, vjs.bind(this, fn));
  return this;
};

/**
 * Trigger an event on an element
 *
 *     myComponent.trigger('eventName');
 *
 * @param  {String}       type  The event type to trigger, e.g. 'click'
 * @param  {Event|Object} event The event object to be passed to the listener
 * @return {vjs.Component}      self
 */
vjs.Component.prototype.trigger = function(type, event){
  vjs.trigger(this.el_, type, event);
  return this;
};

/* Ready
================================================================================ */
/**
 * Is the component loaded
 * This can mean different things depending on the component.
 *
 * @private
 * @type {Boolean}
 */
vjs.Component.prototype.isReady_;

/**
 * Trigger ready as soon as initialization is finished
 *
 * Allows for delaying ready. Override on a sub class prototype.
 * If you set this.isReadyOnInitFinish_ it will affect all components.
 * Specially used when waiting for the Flash player to asynchrnously load.
 *
 * @type {Boolean}
 * @private
 */
vjs.Component.prototype.isReadyOnInitFinish_ = true;

/**
 * List of ready listeners
 *
 * @type {Array}
 * @private
 */
vjs.Component.prototype.readyQueue_;

/**
 * Bind a listener to the component's ready state
 *
 * Different from event listeners in that if the ready event has already happend
 * it will trigger the function immediately.
 *
 * @param  {Function} fn Ready listener
 * @return {vjs.Component}
 */
vjs.Component.prototype.ready = function(fn){
  if (fn) {
    if (this.isReady_) {
      fn.call(this);
    } else {
      if (this.readyQueue_ === undefined) {
        this.readyQueue_ = [];
      }
      this.readyQueue_.push(fn);
    }
  }
  return this;
};

/**
 * Trigger the ready listeners
 *
 * @return {vjs.Component}
 */
vjs.Component.prototype.triggerReady = function(){
  this.isReady_ = true;

  var readyQueue = this.readyQueue_;

  if (readyQueue && readyQueue.length > 0) {

    for (var i = 0, j = readyQueue.length; i < j; i++) {
      readyQueue[i].call(this);
    }

    // Reset Ready Queue
    this.readyQueue_ = [];

    // Allow for using event listeners also, in case you want to do something everytime a source is ready.
    this.trigger('ready');
  }
};

/* Display
============================================================================= */

/**
 * Add a CSS class name to the component's element
 *
 * @param {String} classToAdd Classname to add
 * @return {vjs.Component}
 */
vjs.Component.prototype.addClass = function(classToAdd){
  vjs.addClass(this.el_, classToAdd);
  return this;
};

/**
 * Remove a CSS class name from the component's element
 *
 * @param {String} classToRemove Classname to remove
 * @return {vjs.Component}
 */
vjs.Component.prototype.removeClass = function(classToRemove){
  vjs.removeClass(this.el_, classToRemove);
  return this;
};

/**
 * Show the component element if hidden
 *
 * @return {vjs.Component}
 */
vjs.Component.prototype.show = function(){
  this.el_.style.display = 'block';
  return this;
};

/**
 * Hide the component element if hidden
 *
 * @return {vjs.Component}
 */
vjs.Component.prototype.hide = function(){
  this.el_.style.display = 'none';
  return this;
};

/**
 * Lock an item in its visible state
 * To be used with fadeIn/fadeOut.
 *
 * @return {vjs.Component}
 * @private
 */
vjs.Component.prototype.lockShowing = function(){
  this.addClass('vjs-lock-showing');
  return this;
};

/**
 * Unlock an item to be hidden
 * To be used with fadeIn/fadeOut.
 *
 * @return {vjs.Component}
 * @private
 */
vjs.Component.prototype.unlockShowing = function(){
  this.removeClass('vjs-lock-showing');
  return this;
};

/**
 * Disable component by making it unshowable
 */
vjs.Component.prototype.disable = function(){
  this.hide();
  this.show = function(){};
};

/**
 * Set or get the width of the component (CSS values)
 *
 * Video tag width/height only work in pixels. No percents.
 * But allowing limited percents use. e.g. width() will return number+%, not computed width
 *
 * @param  {Number|String=} num   Optional width number
 * @param  {Boolean} skipListeners Skip the 'resize' event trigger
 * @return {vjs.Component} Returns 'this' if width was set
 * @return {Number|String} Returns the width if nothing was set
 */
vjs.Component.prototype.width = function(num, skipListeners){
  return this.dimension('width', num, skipListeners);
};

/**
 * Get or set the height of the component (CSS values)
 *
 * @param  {Number|String=} num     New component height
 * @param  {Boolean=} skipListeners Skip the resize event trigger
 * @return {vjs.Component} The component if the height was set
 * @return {Number|String} The height if it wasn't set
 */
vjs.Component.prototype.height = function(num, skipListeners){
  return this.dimension('height', num, skipListeners);
};

/**
 * Set both width and height at the same time
 *
 * @param  {Number|String} width
 * @param  {Number|String} height
 * @return {vjs.Component} The component
 */
vjs.Component.prototype.dimensions = function(width, height){
  // Skip resize listeners on width for optimization
  return this.width(width, true).height(height);
};

/**
 * Get or set width or height
 *
 * This is the shared code for the width() and height() methods.
 * All for an integer, integer + 'px' or integer + '%';
 *
 * Known issue: Hidden elements officially have a width of 0. We're defaulting
 * to the style.width value and falling back to computedStyle which has the
 * hidden element issue. Info, but probably not an efficient fix:
 * http://www.foliotek.com/devblog/getting-the-width-of-a-hidden-element-with-jquery-using-width/
 *
 * @param  {String} widthOrHeight  'width' or 'height'
 * @param  {Number|String=} num     New dimension
 * @param  {Boolean=} skipListeners Skip resize event trigger
 * @return {vjs.Component} The component if a dimension was set
 * @return {Number|String} The dimension if nothing was set
 * @private
 */
vjs.Component.prototype.dimension = function(widthOrHeight, num, skipListeners){
  if (num !== undefined) {

    // Check if using css width/height (% or px) and adjust
    if ((''+num).indexOf('%') !== -1 || (''+num).indexOf('px') !== -1) {
      this.el_.style[widthOrHeight] = num;
    } else if (num === 'auto') {
      this.el_.style[widthOrHeight] = '';
    } else {
      this.el_.style[widthOrHeight] = num+'px';
    }

    // skipListeners allows us to avoid triggering the resize event when setting both width and height
    if (!skipListeners) { this.trigger('resize'); }

    // Return component
    return this;
  }

  // Not setting a value, so getting it
  // Make sure element exists
  if (!this.el_) return 0;

  // Get dimension value from style
  var val = this.el_.style[widthOrHeight];
  var pxIndex = val.indexOf('px');
  if (pxIndex !== -1) {
    // Return the pixel value with no 'px'
    return parseInt(val.slice(0,pxIndex), 10);

  // No px so using % or no style was set, so falling back to offsetWidth/height
  // If component has display:none, offset will return 0
  // TODO: handle display:none and no dimension style using px
  } else {

    return parseInt(this.el_['offset'+vjs.capitalize(widthOrHeight)], 10);

    // ComputedStyle version.
    // Only difference is if the element is hidden it will return
    // the percent value (e.g. '100%'')
    // instead of zero like offsetWidth returns.
    // var val = vjs.getComputedStyleValue(this.el_, widthOrHeight);
    // var pxIndex = val.indexOf('px');

    // if (pxIndex !== -1) {
    //   return val.slice(0, pxIndex);
    // } else {
    //   return val;
    // }
  }
};

/**
 * Fired when the width and/or height of the component changes
 * @event resize
 */
vjs.Component.prototype.onResize;

/**
 * Emit 'tap' events when touch events are supported
 *
 * This is used to support toggling the controls through a tap on the video.
 *
 * We're requireing them to be enabled because otherwise every component would
 * have this extra overhead unnecessarily, on mobile devices where extra
 * overhead is especially bad.
 * @private
 */
vjs.Component.prototype.emitTapEvents = function(){
  var touchStart, touchTime, couldBeTap, noTap;

  // Track the start time so we can determine how long the touch lasted
  touchStart = 0;

  this.on('touchstart', function(event) {
    // Record start time so we can detect a tap vs. "touch and hold"
    touchStart = new Date().getTime();
    // Reset couldBeTap tracking
    couldBeTap = true;
  });

  noTap = function(){
    couldBeTap = false;
  };
  // TODO: Listen to the original target. http://youtu.be/DujfpXOKUp8?t=13m8s
  this.on('touchmove', noTap);
  this.on('touchleave', noTap);
  this.on('touchcancel', noTap);

  // When the touch ends, measure how long it took and trigger the appropriate
  // event
  this.on('touchend', function() {
    // Proceed only if the touchmove/leave/cancel event didn't happen
    if (couldBeTap === true) {
      // Measure how long the touch lasted
      touchTime = new Date().getTime() - touchStart;
      // The touch needs to be quick in order to consider it a tap
      if (touchTime < 250) {
        this.trigger('tap');
        // It may be good to copy the touchend event object and change the
        // type to tap, if the other event properties aren't exact after
        // vjs.fixEvent runs (e.g. event.target)
      }
    }
  });
};
/* Button - Base class for all buttons
================================================================================ */
/**
 * Base class for all buttons
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 */
vjs.Button = vjs.Component.extend({
  /**
   * @constructor
   * @inheritDoc
   */
  init: function(player, options){
    vjs.Component.call(this, player, options);

    var touchstart = false;
    this.on('touchstart', function(event) {
      // Stop click and other mouse events from triggering also
      event.preventDefault();
      touchstart = true;
    });
    this.on('touchmove', function() {
      touchstart = false;
    });
    var self = this;
    this.on('touchend', function(event) {
      if (touchstart) {
        self.onClick(event);
      }
      event.preventDefault();
    });

    this.on('click', this.onClick);
    this.on('focus', this.onFocus);
    this.on('blur', this.onBlur);
  }
});

vjs.Button.prototype.createEl = function(type, props){
  // Add standard Aria and Tabindex info
  props = vjs.obj.merge({
    className: this.buildCSSClass(),
    innerHTML: '<div class="vjs-control-content"><span class="vjs-control-text">' + (this.buttonText || 'Need Text') + '</span></div>',
    role: 'button',
    'aria-live': 'polite', // let the screen reader user know that the text of the button may change
    tabIndex: 0
  }, props);

  return vjs.Component.prototype.createEl.call(this, type, props);
};

vjs.Button.prototype.buildCSSClass = function(){
  // TODO: Change vjs-control to vjs-button?
  return 'vjs-control ' + vjs.Component.prototype.buildCSSClass.call(this);
};

  // Click - Override with specific functionality for button
vjs.Button.prototype.onClick = function(){};

  // Focus - Add keyboard functionality to element
vjs.Button.prototype.onFocus = function(){
  vjs.on(document, 'keyup', vjs.bind(this, this.onKeyPress));
};

  // KeyPress (document level) - Trigger click when keys are pressed
vjs.Button.prototype.onKeyPress = function(event){
  // Check for space bar (32) or enter (13) keys
  if (event.which == 32 || event.which == 13) {
    event.preventDefault();
    this.onClick();
  }
};

// Blur - Remove keyboard triggers
vjs.Button.prototype.onBlur = function(){
  vjs.off(document, 'keyup', vjs.bind(this, this.onKeyPress));
};
/* Slider
================================================================================ */
/**
 * The base functionality for sliders like the volume bar and seek bar
 *
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.Slider = vjs.Component.extend({
  /** @constructor */
  init: function(player, options){
    vjs.Component.call(this, player, options);

    // Set property names to bar and handle to match with the child Slider class is looking for
    this.bar = this.getChild(this.options_['barName']);
    this.handle = this.getChild(this.options_['handleName']);

    player.on(this.playerEvent, vjs.bind(this, this.update));

    this.on('mousedown', this.onMouseDown);
    this.on('touchstart', this.onMouseDown);
    this.on('focus', this.onFocus);
    this.on('blur', this.onBlur);
    this.on('click', this.onClick);

    this.player_.on('controlsvisible', vjs.bind(this, this.update));

    // This is actually to fix the volume handle position. http://twitter.com/#!/gerritvanaaken/status/159046254519787520
    // this.player_.one('timeupdate', vjs.bind(this, this.update));

    player.ready(vjs.bind(this, this.update));

    this.boundEvents = {};
  }
});

vjs.Slider.prototype.createEl = function(type, props) {
  props = props || {};
  // Add the slider element class to all sub classes
  props.className = props.className + ' vjs-slider';
  props = vjs.obj.merge({
    role: 'slider',
    'aria-valuenow': 0,
    'aria-valuemin': 0,
    'aria-valuemax': 100,
    tabIndex: 0
  }, props);

  return vjs.Component.prototype.createEl.call(this, type, props);
};

vjs.Slider.prototype.onMouseDown = function(event){
  event.preventDefault();
  vjs.blockTextSelection();

  this.boundEvents.move = vjs.bind(this, this.onMouseMove);
  this.boundEvents.end = vjs.bind(this, this.onMouseUp);

  vjs.on(document, 'mousemove', this.boundEvents.move);
  vjs.on(document, 'mouseup', this.boundEvents.end);
  vjs.on(document, 'touchmove', this.boundEvents.move);
  vjs.on(document, 'touchend', this.boundEvents.end);

  this.onMouseMove(event);
};

vjs.Slider.prototype.onMouseUp = function() {
  vjs.unblockTextSelection();
  vjs.off(document, 'mousemove', this.boundEvents.move, false);
  vjs.off(document, 'mouseup', this.boundEvents.end, false);
  vjs.off(document, 'touchmove', this.boundEvents.move, false);
  vjs.off(document, 'touchend', this.boundEvents.end, false);

  this.update();
};

vjs.Slider.prototype.update = function(){
  // In VolumeBar init we have a setTimeout for update that pops and update to the end of the
  // execution stack. The player is destroyed before then update will cause an error
  if (!this.el_) return;

  // If scrubbing, we could use a cached value to make the handle keep up with the user's mouse.
  // On HTML5 browsers scrubbing is really smooth, but some flash players are slow, so we might want to utilize this later.
  // var progress =  (this.player_.scrubbing) ? this.player_.getCache().currentTime / this.player_.duration() : this.player_.currentTime() / this.player_.duration();

  var barProgress,
      progress = this.getPercent(),
      handle = this.handle,
      bar = this.bar;

  // Protect against no duration and other division issues
  if (isNaN(progress)) { progress = 0; }

  barProgress = progress;

  // If there is a handle, we need to account for the handle in our calculation for progress bar
  // so that it doesn't fall short of or extend past the handle.
  if (handle) {

    var box = this.el_,
        boxWidth = box.offsetWidth,

        handleWidth = handle.el().offsetWidth,

        // The width of the handle in percent of the containing box
        // In IE, widths may not be ready yet causing NaN
        handlePercent = (handleWidth) ? handleWidth / boxWidth : 0,

        // Get the adjusted size of the box, considering that the handle's center never touches the left or right side.
        // There is a margin of half the handle's width on both sides.
        boxAdjustedPercent = 1 - handlePercent,

        // Adjust the progress that we'll use to set widths to the new adjusted box width
        adjustedProgress = progress * boxAdjustedPercent;

    // The bar does reach the left side, so we need to account for this in the bar's width
    barProgress = adjustedProgress + (handlePercent / 2);

    // Move the handle from the left based on the adjected progress
    handle.el().style.left = vjs.round(adjustedProgress * 100, 2) + '%';
  }

  // Set the new bar width
  bar.el().style.width = vjs.round(barProgress * 100, 2) + '%';
};

vjs.Slider.prototype.calculateDistance = function(event){
  var el, box, boxX, boxY, boxW, boxH, handle, pageX, pageY;

  el = this.el_;
  box = vjs.findPosition(el);
  boxW = boxH = el.offsetWidth;
  handle = this.handle;

  if (this.options_.vertical) {
    boxY = box.top;

    if (event.changedTouches) {
      pageY = event.changedTouches[0].pageY;
    } else {
      pageY = event.pageY;
    }

    if (handle) {
      var handleH = handle.el().offsetHeight;
      // Adjusted X and Width, so handle doesn't go outside the bar
      boxY = boxY + (handleH / 2);
      boxH = boxH - handleH;
    }

    // Percent that the click is through the adjusted area
    return Math.max(0, Math.min(1, ((boxY - pageY) + boxH) / boxH));

  } else {
    boxX = box.left;

    if (event.changedTouches) {
      pageX = event.changedTouches[0].pageX;
    } else {
      pageX = event.pageX;
    }

    if (handle) {
      var handleW = handle.el().offsetWidth;

      // Adjusted X and Width, so handle doesn't go outside the bar
      boxX = boxX + (handleW / 2);
      boxW = boxW - handleW;
    }

    // Percent that the click is through the adjusted area
    return Math.max(0, Math.min(1, (pageX - boxX) / boxW));
  }
};

vjs.Slider.prototype.onFocus = function(){
  vjs.on(document, 'keyup', vjs.bind(this, this.onKeyPress));
};

vjs.Slider.prototype.onKeyPress = function(event){
  if (event.which == 37) { // Left Arrow
    event.preventDefault();
    this.stepBack();
  } else if (event.which == 39) { // Right Arrow
    event.preventDefault();
    this.stepForward();
  }
};

vjs.Slider.prototype.onBlur = function(){
  vjs.off(document, 'keyup', vjs.bind(this, this.onKeyPress));
};

/**
 * Listener for click events on slider, used to prevent clicks
 *   from bubbling up to parent elements like button menus.
 * @param  {Object} event Event object
 */
vjs.Slider.prototype.onClick = function(event){
  event.stopImmediatePropagation();
  event.preventDefault();
};

/**
 * SeekBar Behavior includes play progress bar, and seek handle
 * Needed so it can determine seek position based on handle position/size
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.SliderHandle = vjs.Component.extend();

/**
 * Default value of the slider
 *
 * @type {Number}
 * @private
 */
vjs.SliderHandle.prototype.defaultValue = 0;

/** @inheritDoc */
vjs.SliderHandle.prototype.createEl = function(type, props) {
  props = props || {};
  // Add the slider element class to all sub classes
  props.className = props.className + ' vjs-slider-handle';
  props = vjs.obj.merge({
    innerHTML: '<span class="vjs-control-text">'+this.defaultValue+'</span>'
  }, props);

  return vjs.Component.prototype.createEl.call(this, 'div', props);
};
/* Menu
================================================================================ */
/**
 * The Menu component is used to build pop up menus, including subtitle and
 * captions selection menus.
 *
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 */
vjs.Menu = vjs.Component.extend();

/**
 * Add a menu item to the menu
 * @param {Object|String} component Component or component type to add
 */
vjs.Menu.prototype.addItem = function(component){
  this.addChild(component);
  component.on('click', vjs.bind(this, function(){
    this.unlockShowing();
  }));
};

/** @inheritDoc */
vjs.Menu.prototype.createEl = function(){
  var contentElType = this.options().contentElType || 'ul';
  this.contentEl_ = vjs.createEl(contentElType, {
    className: 'vjs-menu-content'
  });
  var el = vjs.Component.prototype.createEl.call(this, 'div', {
    append: this.contentEl_,
    className: 'vjs-menu'
  });
  el.appendChild(this.contentEl_);

  // Prevent clicks from bubbling up. Needed for Menu Buttons,
  // where a click on the parent is significant
  vjs.on(el, 'click', function(event){
    event.preventDefault();
    event.stopImmediatePropagation();
  });

  return el;
};

/**
 * The component for a menu item. `<li>`
 *
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 */
vjs.MenuItem = vjs.Button.extend({
  /** @constructor */
  init: function(player, options){
    vjs.Button.call(this, player, options);
    this.selected(options['selected']);
  }
});

/** @inheritDoc */
vjs.MenuItem.prototype.createEl = function(type, props){
  return vjs.Button.prototype.createEl.call(this, 'li', vjs.obj.merge({
    className: 'vjs-menu-item',
    innerHTML: this.options_['label']
  }, props));
};

/**
 * Handle a click on the menu item, and set it to selected
 */
vjs.MenuItem.prototype.onClick = function(){
  this.selected(true);
};

/**
 * Set this menu item as selected or not
 * @param  {Boolean} selected
 */
vjs.MenuItem.prototype.selected = function(selected){
  if (selected) {
    this.addClass('vjs-selected');
    this.el_.setAttribute('aria-selected',true);
  } else {
    this.removeClass('vjs-selected');
    this.el_.setAttribute('aria-selected',false);
  }
};


/**
 * A button class with a popup menu
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.MenuButton = vjs.Button.extend({
  /** @constructor */
  init: function(player, options){
    vjs.Button.call(this, player, options);

    this.menu = this.createMenu();

    // Add list to element
    this.addChild(this.menu);

    // Automatically hide empty menu buttons
    if (this.items && this.items.length === 0) {
      this.hide();
    }

    this.on('keyup', this.onKeyPress);
    this.el_.setAttribute('aria-haspopup', true);
    this.el_.setAttribute('role', 'button');
  }
});

/**
 * Track the state of the menu button
 * @type {Boolean}
 * @private
 */
vjs.MenuButton.prototype.buttonPressed_ = false;

vjs.MenuButton.prototype.createMenu = function(){
  var menu = new vjs.Menu(this.player_);

  // Add a title list item to the top
  if (this.options().title) {
    menu.el().appendChild(vjs.createEl('li', {
      className: 'vjs-menu-title',
      innerHTML: vjs.capitalize(this.kind_),
      tabindex: -1
    }));
  }

  this.items = this['createItems']();

  if (this.items) {
    // Add menu items to the menu
    for (var i = 0; i < this.items.length; i++) {
      menu.addItem(this.items[i]);
    }
  }

  return menu;
};

/**
 * Create the list of menu items. Specific to each subclass.
 */
vjs.MenuButton.prototype.createItems = function(){};

/** @inheritDoc */
vjs.MenuButton.prototype.buildCSSClass = function(){
  return this.className + ' vjs-menu-button ' + vjs.Button.prototype.buildCSSClass.call(this);
};

// Focus - Add keyboard functionality to element
// This function is not needed anymore. Instead, the keyboard functionality is handled by
// treating the button as triggering a submenu. When the button is pressed, the submenu
// appears. Pressing the button again makes the submenu disappear.
vjs.MenuButton.prototype.onFocus = function(){};
// Can't turn off list display that we turned on with focus, because list would go away.
vjs.MenuButton.prototype.onBlur = function(){};

vjs.MenuButton.prototype.onClick = function(){
  // When you click the button it adds focus, which will show the menu indefinitely.
  // So we'll remove focus when the mouse leaves the button.
  // Focus is needed for tab navigation.
  this.one('mouseout', vjs.bind(this, function(){
    this.menu.unlockShowing();
    this.el_.blur();
  }));
  if (this.buttonPressed_){
    this.unpressButton();
  } else {
    this.pressButton();
  }
};

vjs.MenuButton.prototype.onKeyPress = function(event){
  event.preventDefault();

  // Check for space bar (32) or enter (13) keys
  if (event.which == 32 || event.which == 13) {
    if (this.buttonPressed_){
      this.unpressButton();
    } else {
      this.pressButton();
    }
  // Check for escape (27) key
  } else if (event.which == 27){
    if (this.buttonPressed_){
      this.unpressButton();
    }
  }
};

vjs.MenuButton.prototype.pressButton = function(){
  this.buttonPressed_ = true;
  this.menu.lockShowing();
  this.el_.setAttribute('aria-pressed', true);
  if (this.items && this.items.length > 0) {
    this.items[0].el().focus(); // set the focus to the title of the submenu
  }
};

vjs.MenuButton.prototype.unpressButton = function(){
  this.buttonPressed_ = false;
  this.menu.unlockShowing();
  this.el_.setAttribute('aria-pressed', false);
};

/**
 * An instance of the `vjs.Player` class is created when any of the Video.js setup methods are used to initialize a video.
 *
 * ```js
 * var myPlayer = videojs('example_video_1');
 * ```
 *
 * In the follwing example, the `data-setup` attribute tells the Video.js library to create a player instance when the library is ready.
 *
 * ```html
 * <video id="example_video_1" data-setup='{}' controls>
 *   <source src="my-source.mp4" type="video/mp4">
 * </video>
 * ```
 *
 * After an instance has been created it can be accessed globally using `Video('example_video_1')`.
 *
 * @class
 * @extends vjs.Component
 */
vjs.Player = vjs.Component.extend({

  /**
   * player's constructor function
   *
   * @constructs
   * @method init
   * @param {Element} tag        The original video tag used for configuring options
   * @param {Object=} options    Player options
   * @param {Function=} ready    Ready callback function
   */
  init: function(tag, options, ready){
    this.tag = tag; // Store the original tag used to set options

    // Set Options
    // The options argument overrides options set in the video tag
    // which overrides globally set options.
    // This latter part coincides with the load order
    // (tag must exist before Player)
    options = vjs.obj.merge(this.getTagSettings(tag), options);

    // Cache for video property values.
    this.cache_ = {};

    // Set poster
    this.poster_ = options['poster'];
    // Set controls
    this.controls_ = options['controls'];
    // Original tag settings stored in options
    // now remove immediately so native controls don't flash.
    // May be turned back on by HTML5 tech if nativeControlsForTouch is true
    tag.controls = false;

    // Run base component initializing with new options.
    // Builds the element through createEl()
    // Inits and embeds any child components in opts
    vjs.Component.call(this, this, options, ready);

    // Update controls className. Can't do this when the controls are initially
    // set because the element doesn't exist yet.
    if (this.controls()) {
      this.addClass('vjs-controls-enabled');
    } else {
      this.addClass('vjs-controls-disabled');
    }

    // TODO: Make this smarter. Toggle user state between touching/mousing
    // using events, since devices can have both touch and mouse events.
    // if (vjs.TOUCH_ENABLED) {
    //   this.addClass('vjs-touch-enabled');
    // }

    // Firstplay event implimentation. Not sold on the event yet.
    // Could probably just check currentTime==0?
    this.one('play', function(e){
      var fpEvent = { type: 'firstplay', target: this.el_ };
      // Using vjs.trigger so we can check if default was prevented
      var keepGoing = vjs.trigger(this.el_, fpEvent);

      if (!keepGoing) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    });

    this.on('ended', this.onEnded);
    this.on('play', this.onPlay);
    this.on('firstplay', this.onFirstPlay);
    this.on('pause', this.onPause);
    this.on('progress', this.onProgress);
    this.on('durationchange', this.onDurationChange);
    this.on('error', this.onError);
    this.on('fullscreenchange', this.onFullscreenChange);

    // Make player easily findable by ID
    vjs.players[this.id_] = this;

    if (options['plugins']) {
      vjs.obj.each(options['plugins'], function(key, val){
        this[key](val);
      }, this);
    }

    this.listenForUserActivity();
  }
});

/**
 * Player instance options, surfaced using vjs.options
 * vjs.options = vjs.Player.prototype.options_
 * Make changes in vjs.options, not here.
 * All options should use string keys so they avoid
 * renaming by closure compiler
 * @type {Object}
 * @private
 */
vjs.Player.prototype.options_ = vjs.options;

/**
 * Destroys the video player and does any necessary cleanup
 *
 *     myPlayer.dispose();
 *
 * This is especially helpful if you are dynamically adding and removing videos
 * to/from the DOM.
 */
vjs.Player.prototype.dispose = function(){
  this.trigger('dispose');
  // prevent dispose from being called twice
  this.off('dispose');

  // Kill reference to this player
  vjs.players[this.id_] = null;
  if (this.tag && this.tag['player']) { this.tag['player'] = null; }
  if (this.el_ && this.el_['player']) { this.el_['player'] = null; }

  // Ensure that tracking progress and time progress will stop and plater deleted
  this.stopTrackingProgress();
  this.stopTrackingCurrentTime();

  if (this.tech) { this.tech.dispose(); }

  // Component dispose
  vjs.Component.prototype.dispose.call(this);
};

vjs.Player.prototype.getTagSettings = function(tag){
  var options = {
    'sources': [],
    'tracks': []
  };

  vjs.obj.merge(options, vjs.getAttributeValues(tag));

  // Get tag children settings
  if (tag.hasChildNodes()) {
    var children, child, childName, i, j;

    children = tag.childNodes;

    for (i=0,j=children.length; i<j; i++) {
      child = children[i];
      // Change case needed: http://ejohn.org/blog/nodename-case-sensitivity/
      childName = child.nodeName.toLowerCase();
      if (childName === 'source') {
        options['sources'].push(vjs.getAttributeValues(child));
      } else if (childName === 'track') {
        options['tracks'].push(vjs.getAttributeValues(child));
      }
    }
  }

  return options;
};

vjs.Player.prototype.createEl = function(){
  var el = this.el_ = vjs.Component.prototype.createEl.call(this, 'div');
  var tag = this.tag;

  // Remove width/height attrs from tag so CSS can make it 100% width/height
  tag.removeAttribute('width');
  tag.removeAttribute('height');
  // Empty video tag tracks so the built-in player doesn't use them also.
  // This may not be fast enough to stop HTML5 browsers from reading the tags
  // so we'll need to turn off any default tracks if we're manually doing
  // captions and subtitles. videoElement.textTracks
  if (tag.hasChildNodes()) {
    var nodes, nodesLength, i, node, nodeName, removeNodes;

    nodes = tag.childNodes;
    nodesLength = nodes.length;
    removeNodes = [];

    while (nodesLength--) {
      node = nodes[nodesLength];
      nodeName = node.nodeName.toLowerCase();
      if (nodeName === 'track') {
        removeNodes.push(node);
      }
    }

    for (i=0; i<removeNodes.length; i++) {
      tag.removeChild(removeNodes[i]);
    }
  }

  // Make sure tag ID exists
  tag.id = tag.id || 'vjs_video_' + vjs.guid++;

  // Give video tag ID and class to player div
  // ID will now reference player box, not the video tag
  el.id = tag.id;
  el.className = tag.className;

  // Update tag id/class for use as HTML5 playback tech
  // Might think we should do this after embedding in container so .vjs-tech class
  // doesn't flash 100% width/height, but class only applies with .video-js parent
  tag.id += '_html5_api';
  tag.className = 'vjs-tech';

  // Make player findable on elements
  tag['player'] = el['player'] = this;
  // Default state of video is paused
  this.addClass('vjs-paused');

  // Make box use width/height of tag, or rely on default implementation
  // Enforce with CSS since width/height attrs don't work on divs
  this.width(this.options_['width'], true); // (true) Skip resize listener on load
  this.height(this.options_['height'], true);

  // Wrap video tag in div (el/box) container
  if (tag.parentNode) {
    tag.parentNode.insertBefore(el, tag);
  }
  vjs.insertFirst(tag, el); // Breaks iPhone, fixed in HTML5 setup.

  return el;
};

// /* Media Technology (tech)
// ================================================================================ */
// Load/Create an instance of playback technlogy including element and API methods
// And append playback element in player div.
vjs.Player.prototype.loadTech = function(techName, source){

  // Pause and remove current playback technology
  if (this.tech) {
    this.unloadTech();

  // if this is the first time loading, HTML5 tag will exist but won't be initialized
  // so we need to remove it if we're not loading HTML5
  } else if (techName !== 'Html5' && this.tag) {
    vjs.Html5.disposeMediaElement(this.tag);
    this.tag = null;
  }

  this.techName = techName;

  // Turn off API access because we're loading a new tech that might load asynchronously
  this.isReady_ = false;

  var techReady = function(){
    this.player_.triggerReady();

    // Manually track progress in cases where the browser/flash player doesn't report it.
    if (!this.features['progressEvents']) {
      this.player_.manualProgressOn();
    }

    // Manually track timeudpates in cases where the browser/flash player doesn't report it.
    if (!this.features['timeupdateEvents']) {
      this.player_.manualTimeUpdatesOn();
    }
  };

  // Grab tech-specific options from player options and add source and parent element to use.
  var techOptions = vjs.obj.merge({ 'source': source, 'parentEl': this.el_ }, this.options_[techName.toLowerCase()]);

  if (source) {
    if (source.src == this.cache_.src && this.cache_.currentTime > 0) {
      techOptions['startTime'] = this.cache_.currentTime;
    }

    this.cache_.src = source.src;
  }

  // Initialize tech instance
  this.tech = new window['videojs'][techName](this, techOptions);

  this.tech.ready(techReady);
};

vjs.Player.prototype.unloadTech = function(){
  this.isReady_ = false;
  this.tech.dispose();

  // Turn off any manual progress or timeupdate tracking
  if (this.manualProgress) { this.manualProgressOff(); }

  if (this.manualTimeUpdates) { this.manualTimeUpdatesOff(); }

  this.tech = false;
};

// There's many issues around changing the size of a Flash (or other plugin) object.
// First is a plugin reload issue in Firefox that has been around for 11 years: https://bugzilla.mozilla.org/show_bug.cgi?id=90268
// Then with the new fullscreen API, Mozilla and webkit browsers will reload the flash object after going to fullscreen.
// To get around this, we're unloading the tech, caching source and currentTime values, and reloading the tech once the plugin is resized.
// reloadTech: function(betweenFn){
//   vjs.log('unloadingTech')
//   this.unloadTech();
//   vjs.log('unloadedTech')
//   if (betweenFn) { betweenFn.call(); }
//   vjs.log('LoadingTech')
//   this.loadTech(this.techName, { src: this.cache_.src })
//   vjs.log('loadedTech')
// },

/* Fallbacks for unsupported event types
================================================================================ */
// Manually trigger progress events based on changes to the buffered amount
// Many flash players and older HTML5 browsers don't send progress or progress-like events
vjs.Player.prototype.manualProgressOn = function(){
  this.manualProgress = true;

  // Trigger progress watching when a source begins loading
  this.trackProgress();

  // Watch for a native progress event call on the tech element
  // In HTML5, some older versions don't support the progress event
  // So we're assuming they don't, and turning off manual progress if they do.
  // As opposed to doing user agent detection
  this.tech.one('progress', function(){

    // Update known progress support for this playback technology
    this.features['progressEvents'] = true;

    // Turn off manual progress tracking
    this.player_.manualProgressOff();
  });
};

vjs.Player.prototype.manualProgressOff = function(){
  this.manualProgress = false;
  this.stopTrackingProgress();
};

vjs.Player.prototype.trackProgress = function(){

  this.progressInterval = setInterval(vjs.bind(this, function(){
    // Don't trigger unless buffered amount is greater than last time
    // log(this.cache_.bufferEnd, this.buffered().end(0), this.duration())
    /* TODO: update for multiple buffered regions */
    if (this.cache_.bufferEnd < this.buffered().end(0)) {
      this.trigger('progress');
    } else if (this.bufferedPercent() == 1) {
      this.stopTrackingProgress();
      this.trigger('progress'); // Last update
    }
  }), 500);
};
vjs.Player.prototype.stopTrackingProgress = function(){ clearInterval(this.progressInterval); };

/*! Time Tracking -------------------------------------------------------------- */
vjs.Player.prototype.manualTimeUpdatesOn = function(){
  this.manualTimeUpdates = true;

  this.on('play', this.trackCurrentTime);
  this.on('pause', this.stopTrackingCurrentTime);
  // timeupdate is also called by .currentTime whenever current time is set

  // Watch for native timeupdate event
  this.tech.one('timeupdate', function(){
    // Update known progress support for this playback technology
    this.features['timeupdateEvents'] = true;
    // Turn off manual progress tracking
    this.player_.manualTimeUpdatesOff();
  });
};

vjs.Player.prototype.manualTimeUpdatesOff = function(){
  this.manualTimeUpdates = false;
  this.stopTrackingCurrentTime();
  this.off('play', this.trackCurrentTime);
  this.off('pause', this.stopTrackingCurrentTime);
};

vjs.Player.prototype.trackCurrentTime = function(){
  if (this.currentTimeInterval) { this.stopTrackingCurrentTime(); }
  this.currentTimeInterval = setInterval(vjs.bind(this, function(){
    this.trigger('timeupdate');
  }), 250); // 42 = 24 fps // 250 is what Webkit uses // FF uses 15
};

// Turn off play progress tracking (when paused or dragging)
vjs.Player.prototype.stopTrackingCurrentTime = function(){ clearInterval(this.currentTimeInterval); };

// /* Player event handlers (how the player reacts to certain events)
// ================================================================================ */

/**
 * Fired when the user agent begins looking for media data
 * @event loadstart
 */
vjs.Player.prototype.onLoadStart;

/**
 * Fired when the player has initial duration and dimension information
 * @event loadedmetadata
 */
vjs.Player.prototype.onLoadedMetaData;

/**
 * Fired when the player has downloaded data at the current playback position
 * @event loadeddata
 */
vjs.Player.prototype.onLoadedData;

/**
 * Fired when the player has finished downloading the source data
 * @event loadedalldata
 */
vjs.Player.prototype.onLoadedAllData;

/**
 * Fired whenever the media begins or resumes playback
 * @event play
 */
vjs.Player.prototype.onPlay = function(){
  vjs.removeClass(this.el_, 'vjs-paused');
  vjs.addClass(this.el_, 'vjs-playing');
};

/**
 * Fired the first time a video is played
 *
 * Not part of the HLS spec, and we're not sure if this is the best
 * implementation yet, so use sparingly. If you don't have a reason to
 * prevent playback, use `myPlayer.one('play');` instead.
 *
 * @event firstplay
 */
vjs.Player.prototype.onFirstPlay = function(){
    //If the first starttime attribute is specified
    //then we will start at the given offset in seconds
    if(this.options_['starttime']){
      this.currentTime(this.options_['starttime']);
    }

    this.addClass('vjs-has-started');
};

/**
 * Fired whenever the media has been paused
 * @event pause
 */
vjs.Player.prototype.onPause = function(){
  vjs.removeClass(this.el_, 'vjs-playing');
  vjs.addClass(this.el_, 'vjs-paused');
};

/**
 * Fired when the current playback position has changed
 *
 * During playback this is fired every 15-250 milliseconds, depnding on the
 * playback technology in use.
 * @event timeupdate
 */
vjs.Player.prototype.onTimeUpdate;

/**
 * Fired while the user agent is downloading media data
 * @event progress
 */
vjs.Player.prototype.onProgress = function(){
  // Add custom event for when source is finished downloading.
  if (this.bufferedPercent() == 1) {
    this.trigger('loadedalldata');
  }
};

/**
 * Fired when the end of the media resource is reached (currentTime == duration)
 * @event ended
 */
vjs.Player.prototype.onEnded = function(){
  if (this.options_['loop']) {
    this.currentTime(0);
    this.play();
  }
};

/**
 * Fired when the duration of the media resource is first known or changed
 * @event durationchange
 */
vjs.Player.prototype.onDurationChange = function(){
  // Allows for cacheing value instead of asking player each time.
  this.duration(this.techGet('duration'));
};

/**
 * Fired when the volume changes
 * @event volumechange
 */
vjs.Player.prototype.onVolumeChange;

/**
 * Fired when the player switches in or out of fullscreen mode
 * @event fullscreenchange
 */
vjs.Player.prototype.onFullscreenChange = function() {
  if (this.isFullScreen) {
    this.addClass('vjs-fullscreen');
  } else {
    this.removeClass('vjs-fullscreen');
  }
};

/**
 * Fired when there is an error in playback
 * @event error
 */
vjs.Player.prototype.onError = function(e) {
  vjs.log('Video Error', e);
};

// /* Player API
// ================================================================================ */

/**
 * Object for cached values.
 * @private
 */
vjs.Player.prototype.cache_;

vjs.Player.prototype.getCache = function(){
  return this.cache_;
};

// Pass values to the playback tech
vjs.Player.prototype.techCall = function(method, arg){
  // If it's not ready yet, call method when it is
  if (this.tech && !this.tech.isReady_) {
    this.tech.ready(function(){
      this[method](arg);
    });

  // Otherwise call method now
  } else {
    try {
      this.tech[method](arg);
    } catch(e) {
      vjs.log(e);
      throw e;
    }
  }
};

// Get calls can't wait for the tech, and sometimes don't need to.
vjs.Player.prototype.techGet = function(method){

  if (this.tech && this.tech.isReady_) {

    // Flash likes to die and reload when you hide or reposition it.
    // In these cases the object methods go away and we get errors.
    // When that happens we'll catch the errors and inform tech that it's not ready any more.
    try {
      return this.tech[method]();
    } catch(e) {
      // When building additional tech libs, an expected method may not be defined yet
      if (this.tech[method] === undefined) {
        vjs.log('Video.js: ' + method + ' method not defined for '+this.techName+' playback technology.', e);
      } else {
        // When a method isn't available on the object it throws a TypeError
        if (e.name == 'TypeError') {
          vjs.log('Video.js: ' + method + ' unavailable on '+this.techName+' playback technology element.', e);
          this.tech.isReady_ = false;
        } else {
          vjs.log(e);
        }
      }
      throw e;
    }
  }

  return;
};

/**
 * start media playback
 *
 *     myPlayer.play();
 *
 * @return {vjs.Player} self
 */
vjs.Player.prototype.play = function(){
  this.techCall('play');
  return this;
};

/**
 * Pause the video playback
 *
 *     myPlayer.pause();
 *
 * @return {vjs.Player} self
 */
vjs.Player.prototype.pause = function(){
  this.techCall('pause');
  return this;
};

/**
 * Check if the player is paused
 *
 *     var isPaused = myPlayer.paused();
 *     var isPlaying = !myPlayer.paused();
 *
 * @return {Boolean} false if the media is currently playing, or true otherwise
 */
vjs.Player.prototype.paused = function(){
  // The initial state of paused should be true (in Safari it's actually false)
  return (this.techGet('paused') === false) ? false : true;
};

/**
 * Get or set the current time (in seconds)
 *
 *     // get
 *     var whereYouAt = myPlayer.currentTime();
 *
 *     // set
 *     myPlayer.currentTime(120); // 2 minutes into the video
 *
 * @param  {Number|String=} seconds The time to seek to
 * @return {Number}        The time in seconds, when not setting
 * @return {vjs.Player}    self, when the current time is set
 */
vjs.Player.prototype.currentTime = function(seconds){
  if (seconds !== undefined) {

    // cache the last set value for smoother scrubbing
    this.cache_.lastSetCurrentTime = seconds;

    this.techCall('setCurrentTime', seconds);

    // improve the accuracy of manual timeupdates
    if (this.manualTimeUpdates) { this.trigger('timeupdate'); }

    return this;
  }

  // cache last currentTime and return
  // default to 0 seconds
  return this.cache_.currentTime = (this.techGet('currentTime') || 0);
};

/**
 * Get the length in time of the video in seconds
 *
 *     var lengthOfVideo = myPlayer.duration();
 *
 * **NOTE**: The video must have started loading before the duration can be
 * known, and in the case of Flash, may not be known until the video starts
 * playing.
 *
 * @return {Number} The duration of the video in seconds
 */
vjs.Player.prototype.duration = function(seconds){
  if (seconds !== undefined) {

    // cache the last set value for optimiized scrubbing (esp. Flash)
    this.cache_.duration = parseFloat(seconds);

    return this;
  }

  if (this.cache_.duration === undefined) {
    this.onDurationChange();
  }

  return this.cache_.duration;
};

// Calculates how much time is left. Not in spec, but useful.
vjs.Player.prototype.remainingTime = function(){
  return this.duration() - this.currentTime();
};

// http://dev.w3.org/html5/spec/video.html#dom-media-buffered
// Buffered returns a timerange object.
// Kind of like an array of portions of the video that have been downloaded.
// So far no browsers return more than one range (portion)

/**
 * Get a TimeRange object with the times of the video that have been downloaded
 *
 * If you just want the percent of the video that's been downloaded,
 * use bufferedPercent.
 *
 *     // Number of different ranges of time have been buffered. Usually 1.
 *     numberOfRanges = bufferedTimeRange.length,
 *
 *     // Time in seconds when the first range starts. Usually 0.
 *     firstRangeStart = bufferedTimeRange.start(0),
 *
 *     // Time in seconds when the first range ends
 *     firstRangeEnd = bufferedTimeRange.end(0),
 *
 *     // Length in seconds of the first time range
 *     firstRangeLength = firstRangeEnd - firstRangeStart;
 *
 * @return {Object} A mock TimeRange object (following HTML spec)
 */
vjs.Player.prototype.buffered = function(){
  var buffered = this.techGet('buffered'),
      start = 0,
      buflast = buffered.length - 1,
      // Default end to 0 and store in values
      end = this.cache_.bufferEnd = this.cache_.bufferEnd || 0;

  if (buffered && buflast >= 0 && buffered.end(buflast) !== end) {
    end = buffered.end(buflast);
    // Storing values allows them be overridden by setBufferedFromProgress
    this.cache_.bufferEnd = end;
  }

  return vjs.createTimeRange(start, end);
};

/**
 * Get the percent (as a decimal) of the video that's been downloaded
 *
 *     var howMuchIsDownloaded = myPlayer.bufferedPercent();
 *
 * 0 means none, 1 means all.
 * (This method isn't in the HTML5 spec, but it's very convenient)
 *
 * @return {Number} A decimal between 0 and 1 representing the percent
 */
vjs.Player.prototype.bufferedPercent = function(){
  return (this.duration()) ? this.buffered().end(0) / this.duration() : 0;
};

/**
 * Get or set the current volume of the media
 *
 *     // get
 *     var howLoudIsIt = myPlayer.volume();
 *
 *     // set
 *     myPlayer.volume(0.5); // Set volume to half
 *
 * 0 is off (muted), 1.0 is all the way up, 0.5 is half way.
 *
 * @param  {Number} percentAsDecimal The new volume as a decimal percent
 * @return {Number}                  The current volume, when getting
 * @return {vjs.Player}              self, when setting
 */
vjs.Player.prototype.volume = function(percentAsDecimal){
  var vol;

  if (percentAsDecimal !== undefined) {
    vol = Math.max(0, Math.min(1, parseFloat(percentAsDecimal))); // Force value to between 0 and 1
    this.cache_.volume = vol;
    this.techCall('setVolume', vol);
    vjs.setLocalStorage('volume', vol);
    return this;
  }

  // Default to 1 when returning current volume.
  vol = parseFloat(this.techGet('volume'));
  return (isNaN(vol)) ? 1 : vol;
};


/**
 * Get the current muted state, or turn mute on or off
 *
 *     // get
 *     var isVolumeMuted = myPlayer.muted();
 *
 *     // set
 *     myPlayer.muted(true); // mute the volume
 *
 * @param  {Boolean=} muted True to mute, false to unmute
 * @return {Boolean} True if mute is on, false if not, when getting
 * @return {vjs.Player} self, when setting mute
 */
vjs.Player.prototype.muted = function(muted){
  if (muted !== undefined) {
    this.techCall('setMuted', muted);
    return this;
  }
  return this.techGet('muted') || false; // Default to false
};

// Check if current tech can support native fullscreen (e.g. with built in controls lik iOS, so not our flash swf)
vjs.Player.prototype.supportsFullScreen = function(){ return this.techGet('supportsFullScreen') || false; };

/**
 * Increase the size of the video to full screen
 *
 *     myPlayer.requestFullScreen();
 *
 * In some browsers, full screen is not supported natively, so it enters
 * "full window mode", where the video fills the browser window.
 * In browsers and devices that support native full screen, sometimes the
 * browser's default controls will be shown, and not the Video.js custom skin.
 * This includes most mobile devices (iOS, Android) and older versions of
 * Safari.
 *
 * @return {vjs.Player} self
 */
vjs.Player.prototype.requestFullScreen = function(){
  var requestFullScreen = vjs.support.requestFullScreen;
  this.isFullScreen = true;

  if (requestFullScreen) {
    // the browser supports going fullscreen at the element level so we can
    // take the controls fullscreen as well as the video

    // Trigger fullscreenchange event after change
    // We have to specifically add this each time, and remove
    // when cancelling fullscreen. Otherwise if there's multiple
    // players on a page, they would all be reacting to the same fullscreen
    // events
    vjs.on(document, requestFullScreen.eventName, vjs.bind(this, function(e){
      this.isFullScreen = document[requestFullScreen.isFullScreen];

      // If cancelling fullscreen, remove event listener.
      if (this.isFullScreen === false) {
        vjs.off(document, requestFullScreen.eventName, arguments.callee);
      }

      this.trigger('fullscreenchange');
    }));

    this.el_[requestFullScreen.requestFn]();

  } else if (this.tech.supportsFullScreen()) {
    // we can't take the video.js controls fullscreen but we can go fullscreen
    // with native controls
    this.techCall('enterFullScreen');
  } else {
    // fullscreen isn't supported so we'll just stretch the video element to
    // fill the viewport
    this.enterFullWindow();
    this.trigger('fullscreenchange');
  }

  return this;
};

/**
 * Return the video to its normal size after having been in full screen mode
 *
 *     myPlayer.cancelFullScreen();
 *
 * @return {vjs.Player} self
 */
vjs.Player.prototype.cancelFullScreen = function(){
  var requestFullScreen = vjs.support.requestFullScreen;
  this.isFullScreen = false;

  // Check for browser element fullscreen support
  if (requestFullScreen) {
    document[requestFullScreen.cancelFn]();
  } else if (this.tech.supportsFullScreen()) {
   this.techCall('exitFullScreen');
  } else {
   this.exitFullWindow();
   this.trigger('fullscreenchange');
  }

  return this;
};

// When fullscreen isn't supported we can stretch the video container to as wide as the browser will let us.
vjs.Player.prototype.enterFullWindow = function(){
  this.isFullWindow = true;

  // Storing original doc overflow value to return to when fullscreen is off
  this.docOrigOverflow = document.documentElement.style.overflow;

  // Add listener for esc key to exit fullscreen
  vjs.on(document, 'keydown', vjs.bind(this, this.fullWindowOnEscKey));

  // Hide any scroll bars
  document.documentElement.style.overflow = 'hidden';

  // Apply fullscreen styles
  vjs.addClass(document.body, 'vjs-full-window');

  this.trigger('enterFullWindow');
};
vjs.Player.prototype.fullWindowOnEscKey = function(event){
  if (event.keyCode === 27) {
    if (this.isFullScreen === true) {
      this.cancelFullScreen();
    } else {
      this.exitFullWindow();
    }
  }
};

vjs.Player.prototype.exitFullWindow = function(){
  this.isFullWindow = false;
  vjs.off(document, 'keydown', this.fullWindowOnEscKey);

  // Unhide scroll bars.
  document.documentElement.style.overflow = this.docOrigOverflow;

  // Remove fullscreen styles
  vjs.removeClass(document.body, 'vjs-full-window');

  // Resize the box, controller, and poster to original sizes
  // this.positionAll();
  this.trigger('exitFullWindow');
};

vjs.Player.prototype.selectSource = function(sources){

  // Loop through each playback technology in the options order
  for (var i=0,j=this.options_['techOrder'];i<j.length;i++) {
    var techName = vjs.capitalize(j[i]),
        tech = window['videojs'][techName];

    // Check if the browser supports this technology
    if (tech.isSupported()) {
      // Loop through each source object
      for (var a=0,b=sources;a<b.length;a++) {
        var source = b[a];

        // Check if source can be played with this technology
        if (tech['canPlaySource'](source)) {
          return { source: source, tech: techName };
        }
      }
    }
  }

  return false;
};

/**
 * The source function updates the video source
 *
 * There are three types of variables you can pass as the argument.
 *
 * **URL String**: A URL to the the video file. Use this method if you are sure
 * the current playback technology (HTML5/Flash) can support the source you
 * provide. Currently only MP4 files can be used in both HTML5 and Flash.
 *
 *     myPlayer.src("http://www.example.com/path/to/video.mp4");
 *
 * **Source Object (or element):** A javascript object containing information
 * about the source file. Use this method if you want the player to determine if
 * it can support the file using the type information.
 *
 *     myPlayer.src({ type: "video/mp4", src: "http://www.example.com/path/to/video.mp4" });
 *
 * **Array of Source Objects:** To provide multiple versions of the source so
 * that it can be played using HTML5 across browsers you can use an array of
 * source objects. Video.js will detect which version is supported and load that
 * file.
 *
 *     myPlayer.src([
 *       { type: "video/mp4", src: "http://www.example.com/path/to/video.mp4" },
 *       { type: "video/webm", src: "http://www.example.com/path/to/video.webm" },
 *       { type: "video/ogg", src: "http://www.example.com/path/to/video.ogv" }
 *     ]);
 *
 * @param  {String|Object|Array=} source The source URL, object, or array of sources
 * @return {vjs.Player} self
 */
vjs.Player.prototype.src = function(source){
  // Case: Array of source objects to choose from and pick the best to play
  if (source instanceof Array) {

    var sourceTech = this.selectSource(source),
        techName;

    if (sourceTech) {
        source = sourceTech.source;
        techName = sourceTech.tech;

      // If this technology is already loaded, set source
      if (techName == this.techName) {
        this.src(source); // Passing the source object
      // Otherwise load this technology with chosen source
      } else {
        this.loadTech(techName, source);
      }
    } else {
      this.el_.appendChild(vjs.createEl('p', {
        innerHTML: this.options()['notSupportedMessage']
      }));
    }

  // Case: Source object { src: '', type: '' ... }
  } else if (source instanceof Object) {

    if (window['videojs'][this.techName]['canPlaySource'](source)) {
      this.src(source.src);
    } else {
      // Send through tech loop to check for a compatible technology.
      this.src([source]);
    }

  // Case: URL String (http://myvideo...)
  } else {
    // Cache for getting last set source
    this.cache_.src = source;

    if (!this.isReady_) {
      this.ready(function(){
        this.src(source);
      });
    } else {
      this.techCall('src', source);
      if (this.options_['preload'] == 'auto') {
        this.load();
      }
      if (this.options_['autoplay']) {
        this.play();
      }
    }
  }
  return this;
};

// Begin loading the src data
// http://dev.w3.org/html5/spec/video.html#dom-media-load
vjs.Player.prototype.load = function(){
  this.techCall('load');
  return this;
};

// http://dev.w3.org/html5/spec/video.html#dom-media-currentsrc
vjs.Player.prototype.currentSrc = function(){
  return this.techGet('currentSrc') || this.cache_.src || '';
};

// Attributes/Options
vjs.Player.prototype.preload = function(value){
  if (value !== undefined) {
    this.techCall('setPreload', value);
    this.options_['preload'] = value;
    return this;
  }
  return this.techGet('preload');
};
vjs.Player.prototype.autoplay = function(value){
  if (value !== undefined) {
    this.techCall('setAutoplay', value);
    this.options_['autoplay'] = value;
    return this;
  }
  return this.techGet('autoplay', value);
};
vjs.Player.prototype.loop = function(value){
  if (value !== undefined) {
    this.techCall('setLoop', value);
    this.options_['loop'] = value;
    return this;
  }
  return this.techGet('loop');
};

/**
 * the url of the poster image source
 * @type {String}
 * @private
 */
vjs.Player.prototype.poster_;

/**
 * get or set the poster image source url
 *
 * ##### EXAMPLE:
 *
 *     // getting
 *     var currentPoster = myPlayer.poster();
 *
 *     // setting
 *     myPlayer.poster('http://example.com/myImage.jpg');
 *
 * @param  {String=} [src] Poster image source URL
 * @return {String} poster URL when getting
 * @return {vjs.Player} self when setting
 */
vjs.Player.prototype.poster = function(src){
  if (src !== undefined) {
    this.poster_ = src;
    return this;
  }
  return this.poster_;
};

/**
 * Whether or not the controls are showing
 * @type {Boolean}
 * @private
 */
vjs.Player.prototype.controls_;

/**
 * Get or set whether or not the controls are showing.
 * @param  {Boolean} controls Set controls to showing or not
 * @return {Boolean}    Controls are showing
 */
vjs.Player.prototype.controls = function(bool){
  if (bool !== undefined) {
    bool = !!bool; // force boolean
    // Don't trigger a change event unless it actually changed
    if (this.controls_ !== bool) {
      this.controls_ = bool;
      if (bool) {
        this.removeClass('vjs-controls-disabled');
        this.addClass('vjs-controls-enabled');
        this.trigger('controlsenabled');
      } else {
        this.removeClass('vjs-controls-enabled');
        this.addClass('vjs-controls-disabled');
        this.trigger('controlsdisabled');
      }
    }
    return this;
  }
  return this.controls_;
};

vjs.Player.prototype.usingNativeControls_;

/**
 * Toggle native controls on/off. Native controls are the controls built into
 * devices (e.g. default iPhone controls), Flash, or other techs
 * (e.g. Vimeo Controls)
 *
 * **This should only be set by the current tech, because only the tech knows
 * if it can support native controls**
 *
 * @param  {Boolean} bool    True signals that native controls are on
 * @return {vjs.Player}      Returns the player
 * @private
 */
vjs.Player.prototype.usingNativeControls = function(bool){
  if (bool !== undefined) {
    bool = !!bool; // force boolean
    // Don't trigger a change event unless it actually changed
    if (this.usingNativeControls_ !== bool) {
      this.usingNativeControls_ = bool;
      if (bool) {
        this.addClass('vjs-using-native-controls');

        /**
         * player is using the native device controls
         *
         * @event usingnativecontrols
         * @memberof vjs.Player
         * @instance
         * @private
         */
        this.trigger('usingnativecontrols');
      } else {
        this.removeClass('vjs-using-native-controls');

        /**
         * player is using the custom HTML controls
         *
         * @event usingcustomcontrols
         * @memberof vjs.Player
         * @instance
         * @private
         */
        this.trigger('usingcustomcontrols');
      }
    }
    return this;
  }
  return this.usingNativeControls_;
};

vjs.Player.prototype.error = function(){ return this.techGet('error'); };
vjs.Player.prototype.ended = function(){ return this.techGet('ended'); };
vjs.Player.prototype.seeking = function(){ return this.techGet('seeking'); };

// When the player is first initialized, trigger activity so components
// like the control bar show themselves if needed
vjs.Player.prototype.userActivity_ = true;
vjs.Player.prototype.reportUserActivity = function(event){
  this.userActivity_ = true;
};

vjs.Player.prototype.userActive_ = true;
vjs.Player.prototype.userActive = function(bool){
  if (bool !== undefined) {
    bool = !!bool;
    if (bool !== this.userActive_) {
      this.userActive_ = bool;
      if (bool) {
        // If the user was inactive and is now active we want to reset the
        // inactivity timer
        this.userActivity_ = true;
        this.removeClass('vjs-user-inactive');
        this.addClass('vjs-user-active');
        this.trigger('useractive');
      } else {
        // We're switching the state to inactive manually, so erase any other
        // activity
        this.userActivity_ = false;

        // Chrome/Safari/IE have bugs where when you change the cursor it can
        // trigger a mousemove event. This causes an issue when you're hiding
        // the cursor when the user is inactive, and a mousemove signals user
        // activity. Making it impossible to go into inactive mode. Specifically
        // this happens in fullscreen when we really need to hide the cursor.
        //
        // When this gets resolved in ALL browsers it can be removed
        // https://code.google.com/p/chromium/issues/detail?id=103041
        this.tech.one('mousemove', function(e){
          e.stopPropagation();
          e.preventDefault();
        });
        this.removeClass('vjs-user-active');
        this.addClass('vjs-user-inactive');
        this.trigger('userinactive');
      }
    }
    return this;
  }
  return this.userActive_;
};

vjs.Player.prototype.listenForUserActivity = function(){
  var onMouseActivity, onMouseDown, mouseInProgress, onMouseUp,
      activityCheck, inactivityTimeout;

  onMouseActivity = this.reportUserActivity;

  onMouseDown = function() {
    onMouseActivity();
    // For as long as the they are touching the device or have their mouse down,
    // we consider them active even if they're not moving their finger or mouse.
    // So we want to continue to update that they are active
    clearInterval(mouseInProgress);
    // Setting userActivity=true now and setting the interval to the same time
    // as the activityCheck interval (250) should ensure we never miss the
    // next activityCheck
    mouseInProgress = setInterval(vjs.bind(this, onMouseActivity), 250);
  };

  onMouseUp = function(event) {
    onMouseActivity();
    // Stop the interval that maintains activity if the mouse/touch is down
    clearInterval(mouseInProgress);
  };

  // Any mouse movement will be considered user activity
  this.on('mousedown', onMouseDown);
  this.on('mousemove', onMouseActivity);
  this.on('mouseup', onMouseUp);

  // Listen for keyboard navigation
  // Shouldn't need to use inProgress interval because of key repeat
  this.on('keydown', onMouseActivity);
  this.on('keyup', onMouseActivity);

  // Consider any touch events that bubble up to be activity
  // Certain touches on the tech will be blocked from bubbling because they
  // toggle controls
  this.on('touchstart', onMouseDown);
  this.on('touchmove', onMouseActivity);
  this.on('touchend', onMouseUp);
  this.on('touchcancel', onMouseUp);

  // Run an interval every 250 milliseconds instead of stuffing everything into
  // the mousemove/touchmove function itself, to prevent performance degradation.
  // `this.reportUserActivity` simply sets this.userActivity_ to true, which
  // then gets picked up by this loop
  // http://ejohn.org/blog/learning-from-twitter/
  activityCheck = setInterval(vjs.bind(this, function() {
    // Check to see if mouse/touch activity has happened
    if (this.userActivity_) {
      // Reset the activity tracker
      this.userActivity_ = false;

      // If the user state was inactive, set the state to active
      this.userActive(true);

      // Clear any existing inactivity timeout to start the timer over
      clearTimeout(inactivityTimeout);

      // In X seconds, if no more activity has occurred the user will be
      // considered inactive
      inactivityTimeout = setTimeout(vjs.bind(this, function() {
        // Protect against the case where the inactivityTimeout can trigger just
        // before the next user activity is picked up by the activityCheck loop
        // causing a flicker
        if (!this.userActivity_) {
          this.userActive(false);
        }
      }), 2000);
    }
  }), 250);

  // Clean up the intervals when we kill the player
  this.on('dispose', function(){
    clearInterval(activityCheck);
    clearTimeout(inactivityTimeout);
  });
};

// Methods to add support for
// networkState: function(){ return this.techCall('networkState'); },
// readyState: function(){ return this.techCall('readyState'); },
// seeking: function(){ return this.techCall('seeking'); },
// initialTime: function(){ return this.techCall('initialTime'); },
// startOffsetTime: function(){ return this.techCall('startOffsetTime'); },
// played: function(){ return this.techCall('played'); },
// seekable: function(){ return this.techCall('seekable'); },
// videoTracks: function(){ return this.techCall('videoTracks'); },
// audioTracks: function(){ return this.techCall('audioTracks'); },
// videoWidth: function(){ return this.techCall('videoWidth'); },
// videoHeight: function(){ return this.techCall('videoHeight'); },
// defaultPlaybackRate: function(){ return this.techCall('defaultPlaybackRate'); },
// playbackRate: function(){ return this.techCall('playbackRate'); },
// mediaGroup: function(){ return this.techCall('mediaGroup'); },
// controller: function(){ return this.techCall('controller'); },
// defaultMuted: function(){ return this.techCall('defaultMuted'); }

// TODO
// currentSrcList: the array of sources including other formats and bitrates
// playList: array of source lists in order of playback

// RequestFullscreen API
(function(){
  var prefix, requestFS, div;

  div = document.createElement('div');

  requestFS = {};

  // Current W3C Spec
  // http://dvcs.w3.org/hg/fullscreen/raw-file/tip/Overview.html#api
  // Mozilla Draft: https://wiki.mozilla.org/Gecko:FullScreenAPI#fullscreenchange_event
  // New: https://dvcs.w3.org/hg/fullscreen/raw-file/529a67b8d9f3/Overview.html
  if (div.cancelFullscreen !== undefined) {
    requestFS.requestFn = 'requestFullscreen';
    requestFS.cancelFn = 'exitFullscreen';
    requestFS.eventName = 'fullscreenchange';
    requestFS.isFullScreen = 'fullScreen';

  // Webkit (Chrome/Safari) and Mozilla (Firefox) have working implementations
  // that use prefixes and vary slightly from the new W3C spec. Specifically,
  // using 'exit' instead of 'cancel', and lowercasing the 'S' in Fullscreen.
  // Other browsers don't have any hints of which version they might follow yet,
  // so not going to try to predict by looping through all prefixes.
  } else {

    if (document.mozCancelFullScreen) {
      prefix = 'moz';
      requestFS.isFullScreen = prefix + 'FullScreen';
    } else {
      prefix = 'webkit';
      requestFS.isFullScreen = prefix + 'IsFullScreen';
    }

    if (div[prefix + 'RequestFullScreen']) {
      requestFS.requestFn = prefix + 'RequestFullScreen';
      requestFS.cancelFn = prefix + 'CancelFullScreen';
    }
    requestFS.eventName = prefix + 'fullscreenchange';
  }

  if (document[requestFS.cancelFn]) {
    vjs.support.requestFullScreen = requestFS;
  }

})();


/**
 * Container of main controls
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 * @extends vjs.Component
 */
vjs.ControlBar = vjs.Component.extend();

vjs.ControlBar.prototype.options_ = {
  loadEvent: 'play',
  children: {
    'playToggle': {},
    'currentTimeDisplay': {},
    'timeDivider': {},
    'durationDisplay': {},
    'remainingTimeDisplay': {},
    'progressControl': {},
    'fullscreenToggle': {},
    'volumeControl': {},
    'muteToggle': {}
    // 'volumeMenuButton': {}
  }
};

vjs.ControlBar.prototype.createEl = function(){
  return vjs.createEl('div', {
    className: 'vjs-control-bar'
  });
};
/**
 * Button to toggle between play and pause
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 */
vjs.PlayToggle = vjs.Button.extend({
  /** @constructor */
  init: function(player, options){
    vjs.Button.call(this, player, options);

    player.on('play', vjs.bind(this, this.onPlay));
    player.on('pause', vjs.bind(this, this.onPause));
  }
});

vjs.PlayToggle.prototype.buttonText = 'Play';

vjs.PlayToggle.prototype.buildCSSClass = function(){
  return 'vjs-play-control ' + vjs.Button.prototype.buildCSSClass.call(this);
};

// OnClick - Toggle between play and pause
vjs.PlayToggle.prototype.onClick = function(){
  if (this.player_.paused()) {
    this.player_.play();
  } else {
    this.player_.pause();
  }
};

  // OnPlay - Add the vjs-playing class to the element so it can change appearance
vjs.PlayToggle.prototype.onPlay = function(){
  vjs.removeClass(this.el_, 'vjs-paused');
  vjs.addClass(this.el_, 'vjs-playing');
  this.el_.children[0].children[0].innerHTML = 'Pause'; // change the button text to "Pause"
};

  // OnPause - Add the vjs-paused class to the element so it can change appearance
vjs.PlayToggle.prototype.onPause = function(){
  vjs.removeClass(this.el_, 'vjs-playing');
  vjs.addClass(this.el_, 'vjs-paused');
  this.el_.children[0].children[0].innerHTML = 'Play'; // change the button text to "Play"
};
/**
 * Displays the current time
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.CurrentTimeDisplay = vjs.Component.extend({
  /** @constructor */
  init: function(player, options){
    vjs.Component.call(this, player, options);

    player.on('timeupdate', vjs.bind(this, this.updateContent));
  }
});

vjs.CurrentTimeDisplay.prototype.createEl = function(){
  var el = vjs.Component.prototype.createEl.call(this, 'div', {
    className: 'vjs-current-time vjs-time-controls vjs-control'
  });

  this.content = vjs.createEl('div', {
    className: 'vjs-current-time-display',
    innerHTML: '<span class="vjs-control-text">Current Time </span>' + '0:00', // label the current time for screen reader users
    'aria-live': 'off' // tell screen readers not to automatically read the time as it changes
  });

  el.appendChild(vjs.createEl('div').appendChild(this.content));
  return el;
};

vjs.CurrentTimeDisplay.prototype.updateContent = function(){
  // Allows for smooth scrubbing, when player can't keep up.
  var time = (this.player_.scrubbing) ? this.player_.getCache().currentTime : this.player_.currentTime();
  this.content.innerHTML = '<span class="vjs-control-text">Current Time </span>' + vjs.formatTime(time, this.player_.duration());
};

/**
 * Displays the duration
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.DurationDisplay = vjs.Component.extend({
  /** @constructor */
  init: function(player, options){
    vjs.Component.call(this, player, options);

    player.on('timeupdate', vjs.bind(this, this.updateContent)); // this might need to be changes to 'durationchange' instead of 'timeupdate' eventually, however the durationchange event fires before this.player_.duration() is set, so the value cannot be written out using this method. Once the order of durationchange and this.player_.duration() being set is figured out, this can be updated.
  }
});

vjs.DurationDisplay.prototype.createEl = function(){
  var el = vjs.Component.prototype.createEl.call(this, 'div', {
    className: 'vjs-duration vjs-time-controls vjs-control'
  });

  this.content = vjs.createEl('div', {
    className: 'vjs-duration-display',
    innerHTML: '<span class="vjs-control-text">Duration Time </span>' + '0:00', // label the duration time for screen reader users
    'aria-live': 'off' // tell screen readers not to automatically read the time as it changes
  });

  el.appendChild(vjs.createEl('div').appendChild(this.content));
  return el;
};

vjs.DurationDisplay.prototype.updateContent = function(){
  var duration = this.player_.duration();
  if (duration) {
      this.content.innerHTML = '<span class="vjs-control-text">Duration Time </span>' + vjs.formatTime(duration); // label the duration time for screen reader users
  }
};

/**
 * The separator between the current time and duration
 *
 * Can be hidden if it's not needed in the design.
 *
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.TimeDivider = vjs.Component.extend({
  /** @constructor */
  init: function(player, options){
    vjs.Component.call(this, player, options);
  }
});

vjs.TimeDivider.prototype.createEl = function(){
  return vjs.Component.prototype.createEl.call(this, 'div', {
    className: 'vjs-time-divider',
    innerHTML: '<div><span>/</span></div>'
  });
};

/**
 * Displays the time left in the video
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.RemainingTimeDisplay = vjs.Component.extend({
  /** @constructor */
  init: function(player, options){
    vjs.Component.call(this, player, options);

    player.on('timeupdate', vjs.bind(this, this.updateContent));
  }
});

vjs.RemainingTimeDisplay.prototype.createEl = function(){
  var el = vjs.Component.prototype.createEl.call(this, 'div', {
    className: 'vjs-remaining-time vjs-time-controls vjs-control'
  });

  this.content = vjs.createEl('div', {
    className: 'vjs-remaining-time-display',
    innerHTML: '<span class="vjs-control-text">Remaining Time </span>' + '-0:00', // label the remaining time for screen reader users
    'aria-live': 'off' // tell screen readers not to automatically read the time as it changes
  });

  el.appendChild(vjs.createEl('div').appendChild(this.content));
  return el;
};

vjs.RemainingTimeDisplay.prototype.updateContent = function(){
  if (this.player_.duration()) {
    this.content.innerHTML = '<span class="vjs-control-text">Remaining Time </span>' + '-'+ vjs.formatTime(this.player_.remainingTime());
  }

  // Allows for smooth scrubbing, when player can't keep up.
  // var time = (this.player_.scrubbing) ? this.player_.getCache().currentTime : this.player_.currentTime();
  // this.content.innerHTML = vjs.formatTime(time, this.player_.duration());
};
/**
 * Toggle fullscreen video
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @class
 * @extends vjs.Button
 */
vjs.FullscreenToggle = vjs.Button.extend({
  /**
   * @constructor
   * @memberof vjs.FullscreenToggle
   * @instance
   */
  init: function(player, options){
    vjs.Button.call(this, player, options);
  }
});

vjs.FullscreenToggle.prototype.buttonText = 'Fullscreen';

vjs.FullscreenToggle.prototype.buildCSSClass = function(){
  return 'vjs-fullscreen-control ' + vjs.Button.prototype.buildCSSClass.call(this);
};

vjs.FullscreenToggle.prototype.onClick = function(){
  if (!this.player_.isFullScreen) {
    this.player_.requestFullScreen();
    this.el_.children[0].children[0].innerHTML = 'Non-Fullscreen'; // change the button text to "Non-Fullscreen"
  } else {
    this.player_.cancelFullScreen();
    this.el_.children[0].children[0].innerHTML = 'Fullscreen'; // change the button to "Fullscreen"
  }
};
/**
 * The Progress Control component contains the seek bar, load progress,
 * and play progress
 *
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.ProgressControl = vjs.Component.extend({
  /** @constructor */
  init: function(player, options){
    vjs.Component.call(this, player, options);
  }
});

vjs.ProgressControl.prototype.options_ = {
  children: {
    'seekBar': {}
  }
};

vjs.ProgressControl.prototype.createEl = function(){
  return vjs.Component.prototype.createEl.call(this, 'div', {
    className: 'vjs-progress-control vjs-control'
  });
};

/**
 * Seek Bar and holder for the progress bars
 *
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.SeekBar = vjs.Slider.extend({
  /** @constructor */
  init: function(player, options){
    vjs.Slider.call(this, player, options);
    player.on('timeupdate', vjs.bind(this, this.updateARIAAttributes));
    player.ready(vjs.bind(this, this.updateARIAAttributes));
  }
});

vjs.SeekBar.prototype.options_ = {
  children: {
    'loadProgressBar': {},
    'playProgressBar': {},
    'seekHandle': {}
  },
  'barName': 'playProgressBar',
  'handleName': 'seekHandle'
};

vjs.SeekBar.prototype.playerEvent = 'timeupdate';

vjs.SeekBar.prototype.createEl = function(){
  return vjs.Slider.prototype.createEl.call(this, 'div', {
    className: 'vjs-progress-holder',
    'aria-label': 'video progress bar'
  });
};

vjs.SeekBar.prototype.updateARIAAttributes = function(){
    // Allows for smooth scrubbing, when player can't keep up.
    var time = (this.player_.scrubbing) ? this.player_.getCache().currentTime : this.player_.currentTime();
    this.el_.setAttribute('aria-valuenow',vjs.round(this.getPercent()*100, 2)); // machine readable value of progress bar (percentage complete)
    this.el_.setAttribute('aria-valuetext',vjs.formatTime(time, this.player_.duration())); // human readable value of progress bar (time complete)
};

vjs.SeekBar.prototype.getPercent = function(){
  var currentTime;
  // Flash RTMP provider will not report the correct time
  // immediately after a seek. This isn't noticeable if you're
  // seeking while the video is playing, but it is if you seek
  // while the video is paused.
  if (this.player_.techName === 'Flash' && this.player_.seeking()) {
    var cache = this.player_.getCache();
    if (cache.lastSetCurrentTime) {
      currentTime = cache.lastSetCurrentTime;
    }
    else {
      currentTime = this.player_.currentTime();
    }
  }
  else {
    currentTime = this.player_.currentTime();
  }

  return currentTime / this.player_.duration();
};

vjs.SeekBar.prototype.onMouseDown = function(event){
  vjs.Slider.prototype.onMouseDown.call(this, event);

  this.player_.scrubbing = true;

  this.videoWasPlaying = !this.player_.paused();
  this.player_.pause();
};

vjs.SeekBar.prototype.onMouseMove = function(event){
  var newTime = this.calculateDistance(event) * this.player_.duration();

  // Don't let video end while scrubbing.
  if (newTime == this.player_.duration()) { newTime = newTime - 0.1; }

  // Set new time (tell player to seek to new time)
  this.player_.currentTime(newTime);
};

vjs.SeekBar.prototype.onMouseUp = function(event){
  vjs.Slider.prototype.onMouseUp.call(this, event);

  this.player_.scrubbing = false;
  if (this.videoWasPlaying) {
    this.player_.play();
  }
};

vjs.SeekBar.prototype.stepForward = function(){
  this.player_.currentTime(this.player_.currentTime() + 5); // more quickly fast forward for keyboard-only users
};

vjs.SeekBar.prototype.stepBack = function(){
  this.player_.currentTime(this.player_.currentTime() - 5); // more quickly rewind for keyboard-only users
};


/**
 * Shows load progress
 *
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.LoadProgressBar = vjs.Component.extend({
  /** @constructor */
  init: function(player, options){
    vjs.Component.call(this, player, options);
    player.on('progress', vjs.bind(this, this.update));
  }
});

vjs.LoadProgressBar.prototype.createEl = function(){
  return vjs.Component.prototype.createEl.call(this, 'div', {
    className: 'vjs-load-progress',
    innerHTML: '<span class="vjs-control-text">Loaded: 0%</span>'
  });
};

vjs.LoadProgressBar.prototype.update = function(){
  if (this.el_.style) { this.el_.style.width = vjs.round(this.player_.bufferedPercent() * 100, 2) + '%'; }
};


/**
 * Shows play progress
 *
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.PlayProgressBar = vjs.Component.extend({
  /** @constructor */
  init: function(player, options){
    vjs.Component.call(this, player, options);
  }
});

vjs.PlayProgressBar.prototype.createEl = function(){
  return vjs.Component.prototype.createEl.call(this, 'div', {
    className: 'vjs-play-progress',
    innerHTML: '<span class="vjs-control-text">Progress: 0%</span>'
  });
};

/**
 * The Seek Handle shows the current position of the playhead during playback,
 * and can be dragged to adjust the playhead.
 *
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.SeekHandle = vjs.SliderHandle.extend();

/**
 * The default value for the handle content, which may be read by screen readers
 *
 * @type {String}
 * @private
 */
vjs.SeekHandle.prototype.defaultValue = '00:00';

/** @inheritDoc */
vjs.SeekHandle.prototype.createEl = function(){
  return vjs.SliderHandle.prototype.createEl.call(this, 'div', {
    className: 'vjs-seek-handle'
  });
};
/**
 * The component for controlling the volume level
 *
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.VolumeControl = vjs.Component.extend({
  /** @constructor */
  init: function(player, options){
    vjs.Component.call(this, player, options);

    // hide volume controls when they're not supported by the current tech
    if (player.tech && player.tech.features && player.tech.features['volumeControl'] === false) {
      this.addClass('vjs-hidden');
    }
    player.on('loadstart', vjs.bind(this, function(){
      if (player.tech.features && player.tech.features['volumeControl'] === false) {
        this.addClass('vjs-hidden');
      } else {
        this.removeClass('vjs-hidden');
      }
    }));
  }
});

vjs.VolumeControl.prototype.options_ = {
  children: {
    'volumeBar': {}
  }
};

vjs.VolumeControl.prototype.createEl = function(){
  return vjs.Component.prototype.createEl.call(this, 'div', {
    className: 'vjs-volume-control vjs-control'
  });
};

/**
 * The bar that contains the volume level and can be clicked on to adjust the level
 *
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.VolumeBar = vjs.Slider.extend({
  /** @constructor */
  init: function(player, options){
    vjs.Slider.call(this, player, options);
    player.on('volumechange', vjs.bind(this, this.updateARIAAttributes));
    player.ready(vjs.bind(this, this.updateARIAAttributes));
    setTimeout(vjs.bind(this, this.update), 0); // update when elements is in DOM
  }
});

vjs.VolumeBar.prototype.updateARIAAttributes = function(){
  // Current value of volume bar as a percentage
  this.el_.setAttribute('aria-valuenow',vjs.round(this.player_.volume()*100, 2));
  this.el_.setAttribute('aria-valuetext',vjs.round(this.player_.volume()*100, 2)+'%');
};

vjs.VolumeBar.prototype.options_ = {
  children: {
    'volumeLevel': {},
    'volumeHandle': {}
  },
  'barName': 'volumeLevel',
  'handleName': 'volumeHandle'
};

vjs.VolumeBar.prototype.playerEvent = 'volumechange';

vjs.VolumeBar.prototype.createEl = function(){
  return vjs.Slider.prototype.createEl.call(this, 'div', {
    className: 'vjs-volume-bar',
    'aria-label': 'volume level'
  });
};

vjs.VolumeBar.prototype.onMouseMove = function(event) {
  if (this.player_.muted()) {
    this.player_.muted(false);
  }

  this.player_.volume(this.calculateDistance(event));
};

vjs.VolumeBar.prototype.getPercent = function(){
  if (this.player_.muted()) {
    return 0;
  } else {
    return this.player_.volume();
  }
};

vjs.VolumeBar.prototype.stepForward = function(){
  this.player_.volume(this.player_.volume() + 0.1);
};

vjs.VolumeBar.prototype.stepBack = function(){
  this.player_.volume(this.player_.volume() - 0.1);
};

/**
 * Shows volume level
 *
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.VolumeLevel = vjs.Component.extend({
  /** @constructor */
  init: function(player, options){
    vjs.Component.call(this, player, options);
  }
});

vjs.VolumeLevel.prototype.createEl = function(){
  return vjs.Component.prototype.createEl.call(this, 'div', {
    className: 'vjs-volume-level',
    innerHTML: '<span class="vjs-control-text"></span>'
  });
};

/**
 * The volume handle can be dragged to adjust the volume level
 *
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
 vjs.VolumeHandle = vjs.SliderHandle.extend();

 vjs.VolumeHandle.prototype.defaultValue = '00:00';

 /** @inheritDoc */
 vjs.VolumeHandle.prototype.createEl = function(){
   return vjs.SliderHandle.prototype.createEl.call(this, 'div', {
     className: 'vjs-volume-handle'
   });
 };
/**
 * A button component for muting the audio
 *
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.MuteToggle = vjs.Button.extend({
  /** @constructor */
  init: function(player, options){
    vjs.Button.call(this, player, options);

    player.on('volumechange', vjs.bind(this, this.update));

    // hide mute toggle if the current tech doesn't support volume control
    if (player.tech && player.tech.features && player.tech.features['volumeControl'] === false) {
      this.addClass('vjs-hidden');
    }
    player.on('loadstart', vjs.bind(this, function(){
      if (player.tech.features && player.tech.features['volumeControl'] === false) {
        this.addClass('vjs-hidden');
      } else {
        this.removeClass('vjs-hidden');
      }
    }));
  }
});

vjs.MuteToggle.prototype.createEl = function(){
  return vjs.Button.prototype.createEl.call(this, 'div', {
    className: 'vjs-mute-control vjs-control',
    innerHTML: '<div><span class="vjs-control-text">Mute</span></div>'
  });
};

vjs.MuteToggle.prototype.onClick = function(){
  this.player_.muted( this.player_.muted() ? false : true );
};

vjs.MuteToggle.prototype.update = function(){
  var vol = this.player_.volume(),
      level = 3;

  if (vol === 0 || this.player_.muted()) {
    level = 0;
  } else if (vol < 0.33) {
    level = 1;
  } else if (vol < 0.67) {
    level = 2;
  }

  // Don't rewrite the button text if the actual text doesn't change.
  // This causes unnecessary and confusing information for screen reader users.
  // This check is needed because this function gets called every time the volume level is changed.
  if(this.player_.muted()){
      if(this.el_.children[0].children[0].innerHTML!='Unmute'){
          this.el_.children[0].children[0].innerHTML = 'Unmute'; // change the button text to "Unmute"
      }
  } else {
      if(this.el_.children[0].children[0].innerHTML!='Mute'){
          this.el_.children[0].children[0].innerHTML = 'Mute'; // change the button text to "Mute"
      }
  }

  /* TODO improve muted icon classes */
  for (var i = 0; i < 4; i++) {
    vjs.removeClass(this.el_, 'vjs-vol-'+i);
  }
  vjs.addClass(this.el_, 'vjs-vol-'+level);
};
/**
 * Menu button with a popup for showing the volume slider.
 * @constructor
 */
vjs.VolumeMenuButton = vjs.MenuButton.extend({
  /** @constructor */
  init: function(player, options){
    vjs.MenuButton.call(this, player, options);

    // Same listeners as MuteToggle
    player.on('volumechange', vjs.bind(this, this.update));

    // hide mute toggle if the current tech doesn't support volume control
    if (player.tech && player.tech.features && player.tech.features.volumeControl === false) {
      this.addClass('vjs-hidden');
    }
    player.on('loadstart', vjs.bind(this, function(){
      if (player.tech.features && player.tech.features.volumeControl === false) {
        this.addClass('vjs-hidden');
      } else {
        this.removeClass('vjs-hidden');
      }
    }));
    this.addClass('vjs-menu-button');
  }
});

vjs.VolumeMenuButton.prototype.createMenu = function(){
  var menu = new vjs.Menu(this.player_, {
    contentElType: 'div'
  });
  var vc = new vjs.VolumeBar(this.player_, vjs.obj.merge({vertical: true}, this.options_.volumeBar));
  menu.addChild(vc);
  return menu;
};

vjs.VolumeMenuButton.prototype.onClick = function(){
  vjs.MuteToggle.prototype.onClick.call(this);
  vjs.MenuButton.prototype.onClick.call(this);
};

vjs.VolumeMenuButton.prototype.createEl = function(){
  return vjs.Button.prototype.createEl.call(this, 'div', {
    className: 'vjs-volume-menu-button vjs-menu-button vjs-control',
    innerHTML: '<div><span class="vjs-control-text">Mute</span></div>'
  });
};
vjs.VolumeMenuButton.prototype.update = vjs.MuteToggle.prototype.update;
/* Poster Image
================================================================================ */
/**
 * The component that handles showing the poster image.
 *
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.PosterImage = vjs.Button.extend({
  /** @constructor */
  init: function(player, options){
    vjs.Button.call(this, player, options);

    if (!player.poster() || !player.controls()) {
      this.hide();
    }

    player.on('play', vjs.bind(this, this.hide));
  }
});

vjs.PosterImage.prototype.createEl = function(){
  var el = vjs.createEl('div', {
        className: 'vjs-poster',

        // Don't want poster to be tabbable.
        tabIndex: -1
      }),
      poster = this.player_.poster();

  if (poster) {
    if ('backgroundSize' in el.style) {
      el.style.backgroundImage = 'url("' + poster + '")';
    } else {
      el.appendChild(vjs.createEl('img', { src: poster }));
    }
  }

  return el;
};

vjs.PosterImage.prototype.onClick = function(){
  // Only accept clicks when controls are enabled
  if (this.player().controls()) {
    this.player_.play();
  }
};
/* Loading Spinner
================================================================================ */
/**
 * Loading spinner for waiting events
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 */
vjs.LoadingSpinner = vjs.Component.extend({
  /** @constructor */
  init: function(player, options){
    vjs.Component.call(this, player, options);

    player.on('canplay', vjs.bind(this, this.hide));
    player.on('canplaythrough', vjs.bind(this, this.hide));
    player.on('playing', vjs.bind(this, this.hide));
    player.on('seeked', vjs.bind(this, this.hide));

    player.on('seeking', vjs.bind(this, this.show));

    // in some browsers seeking does not trigger the 'playing' event,
    // so we also need to trap 'seeked' if we are going to set a
    // 'seeking' event
    player.on('seeked', vjs.bind(this, this.hide));

    player.on('error', vjs.bind(this, this.show));

    // Not showing spinner on stalled any more. Browsers may stall and then not trigger any events that would remove the spinner.
    // Checked in Chrome 16 and Safari 5.1.2. http://help.videojs.com/discussions/problems/883-why-is-the-download-progress-showing
    // player.on('stalled', vjs.bind(this, this.show));

    player.on('waiting', vjs.bind(this, this.show));
  }
});

vjs.LoadingSpinner.prototype.createEl = function(){
  return vjs.Component.prototype.createEl.call(this, 'div', {
    className: 'vjs-loading-spinner'
  });
};
/* Big Play Button
================================================================================ */
/**
 * Initial play button. Shows before the video has played. The hiding of the
 * big play button is done via CSS and player states.
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 */
vjs.BigPlayButton = vjs.Button.extend();

vjs.BigPlayButton.prototype.createEl = function(){
  return vjs.Button.prototype.createEl.call(this, 'div', {
    className: 'vjs-big-play-button',
    innerHTML: '<span aria-hidden="true"></span>',
    'aria-label': 'play video'
  });
};

vjs.BigPlayButton.prototype.onClick = function(){
  this.player_.play();
};
/**
 * @fileoverview Media Technology Controller - Base class for media playback
 * technology controllers like Flash and HTML5
 */

/**
 * Base class for media (HTML5 Video, Flash) controllers
 * @param {vjs.Player|Object} player  Central player instance
 * @param {Object=} options Options object
 * @constructor
 */
vjs.MediaTechController = vjs.Component.extend({
  /** @constructor */
  init: function(player, options, ready){
    vjs.Component.call(this, player, options, ready);

    this.initControlsListeners();
  }
});

/**
 * Set up click and touch listeners for the playback element
 * On desktops, a click on the video itself will toggle playback,
 * on a mobile device a click on the video toggles controls.
 * (toggling controls is done by toggling the user state between active and
 * inactive)
 *
 * A tap can signal that a user has become active, or has become inactive
 * e.g. a quick tap on an iPhone movie should reveal the controls. Another
 * quick tap should hide them again (signaling the user is in an inactive
 * viewing state)
 *
 * In addition to this, we still want the user to be considered inactive after
 * a few seconds of inactivity.
 *
 * Note: the only part of iOS interaction we can't mimic with this setup
 * is a touch and hold on the video element counting as activity in order to
 * keep the controls showing, but that shouldn't be an issue. A touch and hold on
 * any controls will still keep the user active
 */
vjs.MediaTechController.prototype.initControlsListeners = function(){
  var player, tech, activateControls, deactivateControls;

  tech = this;
  player = this.player();

  var activateControls = function(){
    if (player.controls() && !player.usingNativeControls()) {
      tech.addControlsListeners();
    }
  };

  deactivateControls = vjs.bind(tech, tech.removeControlsListeners);

  // Set up event listeners once the tech is ready and has an element to apply
  // listeners to
  this.ready(activateControls);
  player.on('controlsenabled', activateControls);
  player.on('controlsdisabled', deactivateControls);
};

vjs.MediaTechController.prototype.addControlsListeners = function(){
  var preventBubble, userWasActive;

  // Some browsers (Chrome & IE) don't trigger a click on a flash swf, but do
  // trigger mousedown/up.
  // http://stackoverflow.com/questions/1444562/javascript-onclick-event-over-flash-object
  // Any touch events are set to block the mousedown event from happening
  this.on('mousedown', this.onClick);

  // We need to block touch events on the video element from bubbling up,
  // otherwise they'll signal activity prematurely. The specific use case is
  // when the video is playing and the controls have faded out. In this case
  // only a tap (fast touch) should toggle the user active state and turn the
  // controls back on. A touch and move or touch and hold should not trigger
  // the controls (per iOS as an example at least)
  //
  // We always want to stop propagation on touchstart because touchstart
  // at the player level starts the touchInProgress interval. We can still
  // report activity on the other events, but won't let them bubble for
  // consistency. We don't want to bubble a touchend without a touchstart.
  this.on('touchstart', function(event) {
    // Stop the mouse events from also happening
    event.preventDefault();
    event.stopPropagation();
    // Record if the user was active now so we don't have to keep polling it
    userWasActive = this.player_.userActive();
  });

  preventBubble = function(event){
    event.stopPropagation();
    if (userWasActive) {
      this.player_.reportUserActivity();
    }
  };

  // Treat all touch events the same for consistency
  this.on('touchmove', preventBubble);
  this.on('touchleave', preventBubble);
  this.on('touchcancel', preventBubble);
  this.on('touchend', preventBubble);

  // Turn on component tap events
  this.emitTapEvents();

  // The tap listener needs to come after the touchend listener because the tap
  // listener cancels out any reportedUserActivity when setting userActive(false)
  this.on('tap', this.onTap);
};

/**
 * Remove the listeners used for click and tap controls. This is needed for
 * toggling to controls disabled, where a tap/touch should do nothing.
 */
vjs.MediaTechController.prototype.removeControlsListeners = function(){
  // We don't want to just use `this.off()` because there might be other needed
  // listeners added by techs that extend this.
  this.off('tap');
  this.off('touchstart');
  this.off('touchmove');
  this.off('touchleave');
  this.off('touchcancel');
  this.off('touchend');
  this.off('click');
  this.off('mousedown');
};

/**
 * Handle a click on the media element. By default will play/pause the media.
 */
vjs.MediaTechController.prototype.onClick = function(event){
  // We're using mousedown to detect clicks thanks to Flash, but mousedown
  // will also be triggered with right-clicks, so we need to prevent that
  if (event.button !== 0) return;

  // When controls are disabled a click should not toggle playback because
  // the click is considered a control
  if (this.player().controls()) {
    if (this.player().paused()) {
      this.player().play();
    } else {
      this.player().pause();
    }
  }
};

/**
 * Handle a tap on the media element. By default it will toggle the user
 * activity state, which hides and shows the controls.
 */

vjs.MediaTechController.prototype.onTap = function(){
  this.player().userActive(!this.player().userActive());
};

vjs.MediaTechController.prototype.features = {
  'volumeControl': true,

  // Resizing plugins using request fullscreen reloads the plugin
  'fullscreenResize': false,

  // Optional events that we can manually mimic with timers
  // currently not triggered by video-js-swf
  'progressEvents': false,
  'timeupdateEvents': false
};

vjs.media = {};

/**
 * List of default API methods for any MediaTechController
 * @type {String}
 */
vjs.media.ApiMethods = 'play,pause,paused,currentTime,setCurrentTime,duration,buffered,volume,setVolume,muted,setMuted,width,height,supportsFullScreen,enterFullScreen,src,load,currentSrc,preload,setPreload,autoplay,setAutoplay,loop,setLoop,error,networkState,readyState,seeking,initialTime,startOffsetTime,played,seekable,ended,videoTracks,audioTracks,videoWidth,videoHeight,textTracks,defaultPlaybackRate,playbackRate,mediaGroup,controller,controls,defaultMuted'.split(',');
// Create placeholder methods for each that warn when a method isn't supported by the current playback technology

function createMethod(methodName){
  return function(){
    throw new Error('The "'+methodName+'" method is not available on the playback technology\'s API');
  };
}

for (var i = vjs.media.ApiMethods.length - 1; i >= 0; i--) {
  var methodName = vjs.media.ApiMethods[i];
  vjs.MediaTechController.prototype[vjs.media.ApiMethods[i]] = createMethod(methodName);
}
/**
 * @fileoverview HTML5 Media Controller - Wrapper for HTML5 Media API
 */

/**
 * HTML5 Media Controller - Wrapper for HTML5 Media API
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @param {Function=} ready
 * @constructor
 */
vjs.Html5 = vjs.MediaTechController.extend({
  /** @constructor */
  init: function(player, options, ready){
    // volume cannot be changed from 1 on iOS
    this.features['volumeControl'] = vjs.Html5.canControlVolume();

    // In iOS, if you move a video element in the DOM, it breaks video playback.
    this.features['movingMediaElementInDOM'] = !vjs.IS_IOS;

    // HTML video is able to automatically resize when going to fullscreen
    this.features['fullscreenResize'] = true;

    vjs.MediaTechController.call(this, player, options, ready);

    var source = options['source'];

    // If the element source is already set, we may have missed the loadstart event, and want to trigger it.
    // We don't want to set the source again and interrupt playback.
    if (source && this.el_.currentSrc === source.src && this.el_.networkState > 0) {
      player.trigger('loadstart');

    // Otherwise set the source if one was provided.
    } else if (source) {
      this.el_.src = source.src;
    }

    // Determine if native controls should be used
    // Our goal should be to get the custom controls on mobile solid everywhere
    // so we can remove this all together. Right now this will block custom
    // controls on touch enabled laptops like the Chrome Pixel
    if (vjs.TOUCH_ENABLED && player.options()['nativeControlsForTouch'] !== false) {
      this.useNativeControls();
    }

    // Chrome and Safari both have issues with autoplay.
    // In Safari (5.1.1), when we move the video element into the container div, autoplay doesn't work.
    // In Chrome (15), if you have autoplay + a poster + no controls, the video gets hidden (but audio plays)
    // This fixes both issues. Need to wait for API, so it updates displays correctly
    player.ready(function(){
      if (this.tag && this.options_['autoplay'] && this.paused()) {
        delete this.tag['poster']; // Chrome Fix. Fixed in Chrome v16.
        this.play();
      }
    });

    this.setupTriggers();
    this.triggerReady();
  }
});

vjs.Html5.prototype.dispose = function(){
  vjs.MediaTechController.prototype.dispose.call(this);
};

vjs.Html5.prototype.createEl = function(){
  var player = this.player_,
      // If possible, reuse original tag for HTML5 playback technology element
      el = player.tag,
      newEl,
      clone;

  // Check if this browser supports moving the element into the box.
  // On the iPhone video will break if you move the element,
  // So we have to create a brand new element.
  if (!el || this.features['movingMediaElementInDOM'] === false) {

    // If the original tag is still there, clone and remove it.
    if (el) {
      clone = el.cloneNode(false);
      vjs.Html5.disposeMediaElement(el);
      el = clone;
      player.tag = null;
    } else {
      el = vjs.createEl('video', {
        id:player.id() + '_html5_api',
        className:'vjs-tech'
      });
    }
    // associate the player with the new tag
    el['player'] = player;

    vjs.insertFirst(el, player.el());
  }

  // Update specific tag settings, in case they were overridden
  var attrs = ['autoplay','preload','loop','muted'];
  for (var i = attrs.length - 1; i >= 0; i--) {
    var attr = attrs[i];
    if (player.options_[attr] !== null) {
      el[attr] = player.options_[attr];
    }
  }

  return el;
  // jenniisawesome = true;
};

// Make video events trigger player events
// May seem verbose here, but makes other APIs possible.
vjs.Html5.prototype.setupTriggers = function(){
  for (var i = vjs.Html5.Events.length - 1; i >= 0; i--) {
    vjs.on(this.el_, vjs.Html5.Events[i], vjs.bind(this.player_, this.eventHandler));
  }
};
// Triggers removed using this.off when disposed

vjs.Html5.prototype.eventHandler = function(e){
  this.trigger(e);

  // No need for media events to bubble up.
  e.stopPropagation();
};

vjs.Html5.prototype.useNativeControls = function(){
  var tech, player, controlsOn, controlsOff, cleanUp;

  tech = this;
  player = this.player();

  // If the player controls are enabled turn on the native controls
  tech.setControls(player.controls());

  // Update the native controls when player controls state is updated
  controlsOn = function(){
    tech.setControls(true);
  };
  controlsOff = function(){
    tech.setControls(false);
  };
  player.on('controlsenabled', controlsOn);
  player.on('controlsdisabled', controlsOff);

  // Clean up when not using native controls anymore
  cleanUp = function(){
    player.off('controlsenabled', controlsOn);
    player.off('controlsdisabled', controlsOff);
  };
  tech.on('dispose', cleanUp);
  player.on('usingcustomcontrols', cleanUp);

  // Update the state of the player to using native controls
  player.usingNativeControls(true);
};


vjs.Html5.prototype.play = function(){ this.el_.play(); };
vjs.Html5.prototype.pause = function(){ this.el_.pause(); };
vjs.Html5.prototype.paused = function(){ return this.el_.paused; };

vjs.Html5.prototype.currentTime = function(){ return this.el_.currentTime; };
vjs.Html5.prototype.setCurrentTime = function(seconds){
  try {
    this.el_.currentTime = seconds;
  } catch(e) {
    vjs.log(e, 'Video is not ready. (Video.js)');
    // this.warning(VideoJS.warnings.videoNotReady);
  }
};

vjs.Html5.prototype.duration = function(){ return this.el_.duration || 0; };
vjs.Html5.prototype.buffered = function(){ return this.el_.buffered; };

vjs.Html5.prototype.volume = function(){ return this.el_.volume; };
vjs.Html5.prototype.setVolume = function(percentAsDecimal){ this.el_.volume = percentAsDecimal; };
vjs.Html5.prototype.muted = function(){ return this.el_.muted; };
vjs.Html5.prototype.setMuted = function(muted){ this.el_.muted = muted; };

vjs.Html5.prototype.width = function(){ return this.el_.offsetWidth; };
vjs.Html5.prototype.height = function(){ return this.el_.offsetHeight; };

vjs.Html5.prototype.supportsFullScreen = function(){
  if (typeof this.el_.webkitEnterFullScreen == 'function') {

    // Seems to be broken in Chromium/Chrome && Safari in Leopard
    if (/Android/.test(vjs.USER_AGENT) || !/Chrome|Mac OS X 10.5/.test(vjs.USER_AGENT)) {
      return true;
    }
  }
  return false;
};

vjs.Html5.prototype.enterFullScreen = function(){
  var video = this.el_;
  if (video.paused && video.networkState <= video.HAVE_METADATA) {
    // attempt to prime the video element for programmatic access
    // this isn't necessary on the desktop but shouldn't hurt
    this.el_.play();

    // playing and pausing synchronously during the transition to fullscreen
    // can get iOS ~6.1 devices into a play/pause loop
    setTimeout(function(){
      video.pause();
      video.webkitEnterFullScreen();
    }, 0);
  } else {
    video.webkitEnterFullScreen();
  }
};
vjs.Html5.prototype.exitFullScreen = function(){
  this.el_.webkitExitFullScreen();
};
vjs.Html5.prototype.src = function(src){ this.el_.src = src; };
vjs.Html5.prototype.load = function(){ this.el_.load(); };
vjs.Html5.prototype.currentSrc = function(){ return this.el_.currentSrc; };

vjs.Html5.prototype.preload = function(){ return this.el_.preload; };
vjs.Html5.prototype.setPreload = function(val){ this.el_.preload = val; };

vjs.Html5.prototype.autoplay = function(){ return this.el_.autoplay; };
vjs.Html5.prototype.setAutoplay = function(val){ this.el_.autoplay = val; };

vjs.Html5.prototype.controls = function(){ return this.el_.controls; }
vjs.Html5.prototype.setControls = function(val){ this.el_.controls = !!val; }

vjs.Html5.prototype.loop = function(){ return this.el_.loop; };
vjs.Html5.prototype.setLoop = function(val){ this.el_.loop = val; };

vjs.Html5.prototype.error = function(){ return this.el_.error; };
vjs.Html5.prototype.seeking = function(){ return this.el_.seeking; };
vjs.Html5.prototype.ended = function(){ return this.el_.ended; };
vjs.Html5.prototype.defaultMuted = function(){ return this.el_.defaultMuted; };

/* HTML5 Support Testing ---------------------------------------------------- */

vjs.Html5.isSupported = function(){
  return !!vjs.TEST_VID.canPlayType;
};

vjs.Html5.canPlaySource = function(srcObj){
  // IE9 on Windows 7 without MediaPlayer throws an error here
  // https://github.com/videojs/video.js/issues/519
  try {
    return !!vjs.TEST_VID.canPlayType(srcObj.type);
  } catch(e) {
    return '';
  }
  // TODO: Check Type
  // If no Type, check ext
  // Check Media Type
};

vjs.Html5.canControlVolume = function(){
  var volume =  vjs.TEST_VID.volume;
  vjs.TEST_VID.volume = (volume / 2) + 0.1;
  return volume !== vjs.TEST_VID.volume;
};

// List of all HTML5 events (various uses).
vjs.Html5.Events = 'loadstart,suspend,abort,error,emptied,stalled,loadedmetadata,loadeddata,canplay,canplaythrough,playing,waiting,seeking,seeked,ended,durationchange,timeupdate,progress,play,pause,ratechange,volumechange'.split(',');

vjs.Html5.disposeMediaElement = function(el){
  if (!el) { return; }

  el['player'] = null;

  if (el.parentNode) {
    el.parentNode.removeChild(el);
  }

  // remove any child track or source nodes to prevent their loading
  while(el.hasChildNodes()) {
    el.removeChild(el.firstChild);
  }

  // remove any src reference. not setting `src=''` because that causes a warning
  // in firefox
  el.removeAttribute('src');

  // force the media element to update its loading state by calling load()
  if (typeof el.load === 'function') {
    el.load();
  }
};

// HTML5 Feature detection and Device Fixes --------------------------------- //

  // Override Android 2.2 and less canPlayType method which is broken
if (vjs.IS_OLD_ANDROID) {
  document.createElement('video').constructor.prototype.canPlayType = function(type){
    return (type && type.toLowerCase().indexOf('video/mp4') != -1) ? 'maybe' : '';
  };
}
/**
 * @fileoverview VideoJS-SWF - Custom Flash Player with HTML5-ish API
 * https://github.com/zencoder/video-js-swf
 * Not using setupTriggers. Using global onEvent func to distribute events
 */

/**
 * Flash Media Controller - Wrapper for fallback SWF API
 *
 * @param {vjs.Player} player
 * @param {Object=} options
 * @param {Function=} ready
 * @constructor
 */
vjs.Flash = vjs.MediaTechController.extend({
  /** @constructor */
  init: function(player, options, ready){
    vjs.MediaTechController.call(this, player, options, ready);

    var source = options['source'],

        // Which element to embed in
        parentEl = options['parentEl'],

        // Create a temporary element to be replaced by swf object
        placeHolder = this.el_ = vjs.createEl('div', { id: player.id() + '_temp_flash' }),

        // Generate ID for swf object
        objId = player.id()+'_flash_api',

        // Store player options in local var for optimization
        // TODO: switch to using player methods instead of options
        // e.g. player.autoplay();
        playerOptions = player.options_,

        // Merge default flashvars with ones passed in to init
        flashVars = vjs.obj.merge({

          // SWF Callback Functions
          'readyFunction': 'videojs.Flash.onReady',
          'eventProxyFunction': 'videojs.Flash.onEvent',
          'errorEventProxyFunction': 'videojs.Flash.onError',

          // Player Settings
          'autoplay': playerOptions.autoplay,
          'preload': playerOptions.preload,
          'loop': playerOptions.loop,
          'muted': playerOptions.muted

        }, options['flashVars']),

        // Merge default parames with ones passed in
        params = vjs.obj.merge({
          'wmode': 'opaque', // Opaque is needed to overlay controls, but can affect playback performance
          'bgcolor': '#000000' // Using bgcolor prevents a white flash when the object is loading
        }, options['params']),

        // Merge default attributes with ones passed in
        attributes = vjs.obj.merge({
          'id': objId,
          'name': objId, // Both ID and Name needed or swf to identifty itself
          'class': 'vjs-tech'
        }, options['attributes'])
    ;

    // If source was supplied pass as a flash var.
    if (source) {
      if (source.type && vjs.Flash.isStreamingType(source.type)) {
        var parts = vjs.Flash.streamToParts(source.src);
        flashVars['rtmpConnection'] = encodeURIComponent(parts.connection);
        flashVars['rtmpStream'] = encodeURIComponent(parts.stream);
      }
      else {
        flashVars['src'] = encodeURIComponent(vjs.getAbsoluteURL(source.src));
      }
    }

    // Add placeholder to player div
    vjs.insertFirst(placeHolder, parentEl);

    // Having issues with Flash reloading on certain page actions (hide/resize/fullscreen) in certain browsers
    // This allows resetting the playhead when we catch the reload
    if (options['startTime']) {
      this.ready(function(){
        this.load();
        this.play();
        this.currentTime(options['startTime']);
      });
    }

    // Flash iFrame Mode
    // In web browsers there are multiple instances where changing the parent element or visibility of a plugin causes the plugin to reload.
    // - Firefox just about always. https://bugzilla.mozilla.org/show_bug.cgi?id=90268 (might be fixed by version 13)
    // - Webkit when hiding the plugin
    // - Webkit and Firefox when using requestFullScreen on a parent element
    // Loading the flash plugin into a dynamically generated iFrame gets around most of these issues.
    // Issues that remain include hiding the element and requestFullScreen in Firefox specifically

    // There's on particularly annoying issue with this method which is that Firefox throws a security error on an offsite Flash object loaded into a dynamically created iFrame.
    // Even though the iframe was inserted into a page on the web, Firefox + Flash considers it a local app trying to access an internet file.
    // I tried mulitple ways of setting the iframe src attribute but couldn't find a src that worked well. Tried a real/fake source, in/out of domain.
    // Also tried a method from stackoverflow that caused a security error in all browsers. http://stackoverflow.com/questions/2486901/how-to-set-document-domain-for-a-dynamically-generated-iframe
    // In the end the solution I found to work was setting the iframe window.location.href right before doing a document.write of the Flash object.
    // The only downside of this it seems to trigger another http request to the original page (no matter what's put in the href). Not sure why that is.

    // NOTE (2012-01-29): Cannot get Firefox to load the remote hosted SWF into a dynamically created iFrame
    // Firefox 9 throws a security error, unleess you call location.href right before doc.write.
    //    Not sure why that even works, but it causes the browser to look like it's continuously trying to load the page.
    // Firefox 3.6 keeps calling the iframe onload function anytime I write to it, causing an endless loop.

    if (options['iFrameMode'] === true && !vjs.IS_FIREFOX) {

      // Create iFrame with vjs-tech class so it's 100% width/height
      var iFrm = vjs.createEl('iframe', {
        'id': objId + '_iframe',
        'name': objId + '_iframe',
        'className': 'vjs-tech',
        'scrolling': 'no',
        'marginWidth': 0,
        'marginHeight': 0,
        'frameBorder': 0
      });

      // Update ready function names in flash vars for iframe window
      flashVars['readyFunction'] = 'ready';
      flashVars['eventProxyFunction'] = 'events';
      flashVars['errorEventProxyFunction'] = 'errors';

      // Tried multiple methods to get this to work in all browsers

      // Tried embedding the flash object in the page first, and then adding a place holder to the iframe, then replacing the placeholder with the page object.
      // The goal here was to try to load the swf URL in the parent page first and hope that got around the firefox security error
      // var newObj = vjs.Flash.embed(options['swf'], placeHolder, flashVars, params, attributes);
      // (in onload)
      //  var temp = vjs.createEl('a', { id:'asdf', innerHTML: 'asdf' } );
      //  iDoc.body.appendChild(temp);

      // Tried embedding the flash object through javascript in the iframe source.
      // This works in webkit but still triggers the firefox security error
      // iFrm.src = 'javascript: document.write('"+vjs.Flash.getEmbedCode(options['swf'], flashVars, params, attributes)+"');";

      // Tried an actual local iframe just to make sure that works, but it kills the easiness of the CDN version if you require the user to host an iframe
      // We should add an option to host the iframe locally though, because it could help a lot of issues.
      // iFrm.src = "iframe.html";

      // Wait until iFrame has loaded to write into it.
      vjs.on(iFrm, 'load', vjs.bind(this, function(){

        var iDoc,
            iWin = iFrm.contentWindow;

        // The one working method I found was to use the iframe's document.write() to create the swf object
        // This got around the security issue in all browsers except firefox.
        // I did find a hack where if I call the iframe's window.location.href='', it would get around the security error
        // However, the main page would look like it was loading indefinitely (URL bar loading spinner would never stop)
        // Plus Firefox 3.6 didn't work no matter what I tried.
        // if (vjs.USER_AGENT.match('Firefox')) {
        //   iWin.location.href = '';
        // }

        // Get the iFrame's document depending on what the browser supports
        iDoc = iFrm.contentDocument ? iFrm.contentDocument : iFrm.contentWindow.document;

        // Tried ensuring both document domains were the same, but they already were, so that wasn't the issue.
        // Even tried adding /. that was mentioned in a browser security writeup
        // document.domain = document.domain+'/.';
        // iDoc.domain = document.domain+'/.';

        // Tried adding the object to the iframe doc's innerHTML. Security error in all browsers.
        // iDoc.body.innerHTML = swfObjectHTML;

        // Tried appending the object to the iframe doc's body. Security error in all browsers.
        // iDoc.body.appendChild(swfObject);

        // Using document.write actually got around the security error that browsers were throwing.
        // Again, it's a dynamically generated (same domain) iframe, loading an external Flash swf.
        // Not sure why that's a security issue, but apparently it is.
        iDoc.write(vjs.Flash.getEmbedCode(options['swf'], flashVars, params, attributes));

        // Setting variables on the window needs to come after the doc write because otherwise they can get reset in some browsers
        // So far no issues with swf ready event being called before it's set on the window.
        iWin['player'] = this.player_;

        // Create swf ready function for iFrame window
        iWin['ready'] = vjs.bind(this.player_, function(currSwf){
          var el = iDoc.getElementById(currSwf),
              player = this,
              tech = player.tech;

          // Update reference to playback technology element
          tech.el_ = el;

          // Make sure swf is actually ready. Sometimes the API isn't actually yet.
          vjs.Flash.checkReady(tech);
        });

        // Create event listener for all swf events
        iWin['events'] = vjs.bind(this.player_, function(swfID, eventName){
          var player = this;
          if (player && player.techName === 'flash') {
            player.trigger(eventName);
          }
        });

        // Create error listener for all swf errors
        iWin['errors'] = vjs.bind(this.player_, function(swfID, eventName){
          vjs.log('Flash Error', eventName);
        });

      }));

      // Replace placeholder with iFrame (it will load now)
      placeHolder.parentNode.replaceChild(iFrm, placeHolder);

    // If not using iFrame mode, embed as normal object
    } else {
      vjs.Flash.embed(options['swf'], placeHolder, flashVars, params, attributes);
    }
  }
});

vjs.Flash.prototype.dispose = function(){
  vjs.MediaTechController.prototype.dispose.call(this);
};

vjs.Flash.prototype.play = function(){
  this.el_.vjs_play();
};

vjs.Flash.prototype.pause = function(){
  this.el_.vjs_pause();
};

vjs.Flash.prototype.src = function(src){
  if (vjs.Flash.isStreamingSrc(src)) {
    src = vjs.Flash.streamToParts(src);
    this.setRtmpConnection(src.connection);
    this.setRtmpStream(src.stream);
  }
  else {
    // Make sure source URL is abosolute.
    src = vjs.getAbsoluteURL(src);
    this.el_.vjs_src(src);
  }

  // Currently the SWF doesn't autoplay if you load a source later.
  // e.g. Load player w/ no source, wait 2s, set src.
  if (this.player_.autoplay()) {
    var tech = this;
    setTimeout(function(){ tech.play(); }, 0);
  }
};

vjs.Flash.prototype.currentSrc = function(){
  var src = this.el_.vjs_getProperty('currentSrc');
  // no src, check and see if RTMP
  if (src == null) {
    var connection = this.rtmpConnection(),
        stream = this.rtmpStream();

    if (connection && stream) {
      src = vjs.Flash.streamFromParts(connection, stream);
    }
  }
  return src;
};

vjs.Flash.prototype.load = function(){
  this.el_.vjs_load();
};

vjs.Flash.prototype.poster = function(){
  this.el_.vjs_getProperty('poster');
};

vjs.Flash.prototype.buffered = function(){
  return vjs.createTimeRange(0, this.el_.vjs_getProperty('buffered'));
};

vjs.Flash.prototype.supportsFullScreen = function(){
  return false; // Flash does not allow fullscreen through javascript
};

vjs.Flash.prototype.enterFullScreen = function(){
  return false;
};


// Create setters and getters for attributes
var api = vjs.Flash.prototype,
    readWrite = 'rtmpConnection,rtmpStream,preload,currentTime,defaultPlaybackRate,playbackRate,autoplay,loop,mediaGroup,controller,controls,volume,muted,defaultMuted'.split(','),
    readOnly = 'error,currentSrc,networkState,readyState,seeking,initialTime,duration,startOffsetTime,paused,played,seekable,ended,videoTracks,audioTracks,videoWidth,videoHeight,textTracks'.split(',');
    // Overridden: buffered

/**
 * @this {*}
 * @private
 */
var createSetter = function(attr){
  var attrUpper = attr.charAt(0).toUpperCase() + attr.slice(1);
  api['set'+attrUpper] = function(val){ return this.el_.vjs_setProperty(attr, val); };
};

/**
 * @this {*}
 * @private
 */
var createGetter = function(attr){
  api[attr] = function(){ return this.el_.vjs_getProperty(attr); };
};

(function(){
  var i;
  // Create getter and setters for all read/write attributes
  for (i = 0; i < readWrite.length; i++) {
    createGetter(readWrite[i]);
    createSetter(readWrite[i]);
  }

  // Create getters for read-only attributes
  for (i = 0; i < readOnly.length; i++) {
    createGetter(readOnly[i]);
  }
})();

/* Flash Support Testing -------------------------------------------------------- */

vjs.Flash.isSupported = function(){
  return vjs.Flash.version()[0] >= 10;
  // return swfobject.hasFlashPlayerVersion('10');
};

vjs.Flash.canPlaySource = function(srcObj){
  var type;

  if (!srcObj.type) {
    return '';
  }

  type = srcObj.type.replace(/;.*/,'').toLowerCase();
  if (type in vjs.Flash.formats || type in vjs.Flash.streamingFormats) {
    return 'maybe';
  }
};

vjs.Flash.formats = {
  'video/flv': 'FLV',
  'video/x-flv': 'FLV',
  'video/mp4': 'MP4',
  'video/m4v': 'MP4'
};

vjs.Flash.streamingFormats = {
  'rtmp/mp4': 'MP4',
  'rtmp/flv': 'FLV'
};

vjs.Flash['onReady'] = function(currSwf){
  var el = vjs.el(currSwf);

  // Get player from box
  // On firefox reloads, el might already have a player
  var player = el['player'] || el.parentNode['player'],
      tech = player.tech;

  // Reference player on tech element
  el['player'] = player;

  // Update reference to playback technology element
  tech.el_ = el;

  vjs.Flash.checkReady(tech);
};

// The SWF isn't alwasy ready when it says it is. Sometimes the API functions still need to be added to the object.
// If it's not ready, we set a timeout to check again shortly.
vjs.Flash.checkReady = function(tech){

  // Check if API property exists
  if (tech.el().vjs_getProperty) {

    // If so, tell tech it's ready
    tech.triggerReady();

  // Otherwise wait longer.
  } else {

    setTimeout(function(){
      vjs.Flash.checkReady(tech);
    }, 50);

  }
};

// Trigger events from the swf on the player
vjs.Flash['onEvent'] = function(swfID, eventName){
  var player = vjs.el(swfID)['player'];
  player.trigger(eventName);
};

// Log errors from the swf
vjs.Flash['onError'] = function(swfID, err){
  var player = vjs.el(swfID)['player'];
  player.trigger('error');
  vjs.log('Flash Error', err, swfID);
};

// Flash Version Check
vjs.Flash.version = function(){
  var version = '0,0,0';

  // IE
  try {
    version = new window.ActiveXObject('ShockwaveFlash.ShockwaveFlash').GetVariable('$version').replace(/\D+/g, ',').match(/^,?(.+),?$/)[1];

  // other browsers
  } catch(e) {
    try {
      if (navigator.mimeTypes['application/x-shockwave-flash'].enabledPlugin){
        version = (navigator.plugins['Shockwave Flash 2.0'] || navigator.plugins['Shockwave Flash']).description.replace(/\D+/g, ',').match(/^,?(.+),?$/)[1];
      }
    } catch(err) {}
  }
  return version.split(',');
};

// Flash embedding method. Only used in non-iframe mode
vjs.Flash.embed = function(swf, placeHolder, flashVars, params, attributes){
  var code = vjs.Flash.getEmbedCode(swf, flashVars, params, attributes),

      // Get element by embedding code and retrieving created element
      obj = vjs.createEl('div', { innerHTML: code }).childNodes[0],

      par = placeHolder.parentNode
  ;

  placeHolder.parentNode.replaceChild(obj, placeHolder);

  // IE6 seems to have an issue where it won't initialize the swf object after injecting it.
  // This is a dumb fix
  var newObj = par.childNodes[0];
  setTimeout(function(){
    newObj.style.display = 'block';
  }, 1000);

  return obj;

};

vjs.Flash.getEmbedCode = function(swf, flashVars, params, attributes){

  var objTag = '<object type="application/x-shockwave-flash"',
      flashVarsString = '',
      paramsString = '',
      attrsString = '';

  // Convert flash vars to string
  if (flashVars) {
    vjs.obj.each(flashVars, function(key, val){
      flashVarsString += (key + '=' + val + '&amp;');
    });
  }

  // Add swf, flashVars, and other default params
  params = vjs.obj.merge({
    'movie': swf,
    'flashvars': flashVarsString,
    'allowScriptAccess': 'always', // Required to talk to swf
    'allowNetworking': 'all' // All should be default, but having security issues.
  }, params);

  // Create param tags string
  vjs.obj.each(params, function(key, val){
    paramsString += '<param name="'+key+'" value="'+val+'" />';
  });

  attributes = vjs.obj.merge({
    // Add swf to attributes (need both for IE and Others to work)
    'data': swf,

    // Default to 100% width/height
    'width': '100%',
    'height': '100%'

  }, attributes);

  // Create Attributes string
  vjs.obj.each(attributes, function(key, val){
    attrsString += (key + '="' + val + '" ');
  });

  return objTag + attrsString + '>' + paramsString + '</object>';
};

vjs.Flash.streamFromParts = function(connection, stream) {
  return connection + '&' + stream;
};

vjs.Flash.streamToParts = function(src) {
  var parts = {
    connection: '',
    stream: ''
  };

  if (! src) {
    return parts;
  }

  // Look for the normal URL separator we expect, '&'.
  // If found, we split the URL into two pieces around the
  // first '&'.
  var connEnd = src.indexOf('&');
  var streamBegin;
  if (connEnd !== -1) {
    streamBegin = connEnd + 1;
  }
  else {
    // If there's not a '&', we use the last '/' as the delimiter.
    connEnd = streamBegin = src.lastIndexOf('/') + 1;
    if (connEnd === 0) {
      // really, there's not a '/'?
      connEnd = streamBegin = src.length;
    }
  }
  parts.connection = src.substring(0, connEnd);
  parts.stream = src.substring(streamBegin, src.length);

  return parts;
};

vjs.Flash.isStreamingType = function(srcType) {
  return srcType in vjs.Flash.streamingFormats;
};

// RTMP has four variations, any string starting
// with one of these protocols should be valid
vjs.Flash.RTMP_RE = /^rtmp[set]?:\/\//i;

vjs.Flash.isStreamingSrc = function(src) {
  return vjs.Flash.RTMP_RE.test(src);
};
/**
 * The Media Loader is the component that decides which playback technology to load
 * when the player is initialized.
 *
 * @constructor
 */
vjs.MediaLoader = vjs.Component.extend({
  /** @constructor */
  init: function(player, options, ready){
    vjs.Component.call(this, player, options, ready);

    // If there are no sources when the player is initialized,
    // load the first supported playback technology.
    if (!player.options_['sources'] || player.options_['sources'].length === 0) {
      for (var i=0,j=player.options_['techOrder']; i<j.length; i++) {
        var techName = vjs.capitalize(j[i]),
            tech = window['videojs'][techName];

        // Check if the browser supports this technology
        if (tech && tech.isSupported()) {
          player.loadTech(techName);
          break;
        }
      }
    } else {
      // // Loop through playback technologies (HTML5, Flash) and check for support.
      // // Then load the best source.
      // // A few assumptions here:
      // //   All playback technologies respect preload false.
      player.src(player.options_['sources']);
    }
  }
});
/**
 * @fileoverview Text Tracks
 * Text tracks are tracks of timed text events.
 * Captions - text displayed over the video for the hearing impared
 * Subtitles - text displayed over the video for those who don't understand langauge in the video
 * Chapters - text displayed in a menu allowing the user to jump to particular points (chapters) in the video
 * Descriptions (not supported yet) - audio descriptions that are read back to the user by a screen reading device
 */

// Player Additions - Functions add to the player object for easier access to tracks

/**
 * List of associated text tracks
 * @type {Array}
 * @private
 */
vjs.Player.prototype.textTracks_;

/**
 * Get an array of associated text tracks. captions, subtitles, chapters, descriptions
 * http://www.w3.org/html/wg/drafts/html/master/embedded-content-0.html#dom-media-texttracks
 * @return {Array}           Array of track objects
 * @private
 */
vjs.Player.prototype.textTracks = function(){
  this.textTracks_ = this.textTracks_ || [];
  return this.textTracks_;
};

/**
 * Add a text track
 * In addition to the W3C settings we allow adding additional info through options.
 * http://www.w3.org/html/wg/drafts/html/master/embedded-content-0.html#dom-media-addtexttrack
 * @param {String}  kind        Captions, subtitles, chapters, descriptions, or metadata
 * @param {String=} label       Optional label
 * @param {String=} language    Optional language
 * @param {Object=} options     Additional track options, like src
 * @private
 */
vjs.Player.prototype.addTextTrack = function(kind, label, language, options){
  var tracks = this.textTracks_ = this.textTracks_ || [];
  options = options || {};

  options['kind'] = kind;
  options['label'] = label;
  options['language'] = language;

  // HTML5 Spec says default to subtitles.
  // Uppercase first letter to match class names
  var Kind = vjs.capitalize(kind || 'subtitles');

  // Create correct texttrack class. CaptionsTrack, etc.
  var track = new window['videojs'][Kind + 'Track'](this, options);

  tracks.push(track);

  // If track.dflt() is set, start showing immediately
  // TODO: Add a process to deterime the best track to show for the specific kind
  // Incase there are mulitple defaulted tracks of the same kind
  // Or the user has a set preference of a specific language that should override the default
  // if (track.dflt()) {
  //   this.ready(vjs.bind(track, track.show));
  // }

  return track;
};

/**
 * Add an array of text tracks. captions, subtitles, chapters, descriptions
 * Track objects will be stored in the player.textTracks() array
 * @param {Array} trackList Array of track elements or objects (fake track elements)
 * @private
 */
vjs.Player.prototype.addTextTracks = function(trackList){
  var trackObj;

  for (var i = 0; i < trackList.length; i++) {
    trackObj = trackList[i];
    this.addTextTrack(trackObj['kind'], trackObj['label'], trackObj['language'], trackObj);
  }

  return this;
};

// Show a text track
// disableSameKind: disable all other tracks of the same kind. Value should be a track kind (captions, etc.)
vjs.Player.prototype.showTextTrack = function(id, disableSameKind){
  var tracks = this.textTracks_,
      i = 0,
      j = tracks.length,
      track, showTrack, kind;

  // Find Track with same ID
  for (;i<j;i++) {
    track = tracks[i];
    if (track.id() === id) {
      track.show();
      showTrack = track;

    // Disable tracks of the same kind
    } else if (disableSameKind && track.kind() == disableSameKind && track.mode() > 0) {
      track.disable();
    }
  }

  // Get track kind from shown track or disableSameKind
  kind = (showTrack) ? showTrack.kind() : ((disableSameKind) ? disableSameKind : false);

  // Trigger trackchange event, captionstrackchange, subtitlestrackchange, etc.
  if (kind) {
    this.trigger(kind+'trackchange');
  }

  return this;
};

/**
 * The base class for all text tracks
 *
 * Handles the parsing, hiding, and showing of text track cues
 *
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.TextTrack = vjs.Component.extend({
  /** @constructor */
  init: function(player, options){
    vjs.Component.call(this, player, options);

    // Apply track info to track object
    // Options will often be a track element

    // Build ID if one doesn't exist
    this.id_ = options['id'] || ('vjs_' + options['kind'] + '_' + options['language'] + '_' + vjs.guid++);
    this.src_ = options['src'];
    // 'default' is a reserved keyword in js so we use an abbreviated version
    this.dflt_ = options['default'] || options['dflt'];
    this.title_ = options['title'];
    this.language_ = options['srclang'];
    this.label_ = options['label'];
    this.cues_ = [];
    this.activeCues_ = [];
    this.readyState_ = 0;
    this.mode_ = 0;

    this.player_.on('fullscreenchange', vjs.bind(this, this.adjustFontSize));
  }
});

/**
 * Track kind value. Captions, subtitles, etc.
 * @private
 */
vjs.TextTrack.prototype.kind_;

/**
 * Get the track kind value
 * @return {String}
 */
vjs.TextTrack.prototype.kind = function(){
  return this.kind_;
};

/**
 * Track src value
 * @private
 */
vjs.TextTrack.prototype.src_;

/**
 * Get the track src value
 * @return {String}
 */
vjs.TextTrack.prototype.src = function(){
  return this.src_;
};

/**
 * Track default value
 * If default is used, subtitles/captions to start showing
 * @private
 */
vjs.TextTrack.prototype.dflt_;

/**
 * Get the track default value. ('default' is a reserved keyword)
 * @return {Boolean}
 */
vjs.TextTrack.prototype.dflt = function(){
  return this.dflt_;
};

/**
 * Track title value
 * @private
 */
vjs.TextTrack.prototype.title_;

/**
 * Get the track title value
 * @return {String}
 */
vjs.TextTrack.prototype.title = function(){
  return this.title_;
};

/**
 * Language - two letter string to represent track language, e.g. 'en' for English
 * Spec def: readonly attribute DOMString language;
 * @private
 */
vjs.TextTrack.prototype.language_;

/**
 * Get the track language value
 * @return {String}
 */
vjs.TextTrack.prototype.language = function(){
  return this.language_;
};

/**
 * Track label e.g. 'English'
 * Spec def: readonly attribute DOMString label;
 * @private
 */
vjs.TextTrack.prototype.label_;

/**
 * Get the track label value
 * @return {String}
 */
vjs.TextTrack.prototype.label = function(){
  return this.label_;
};

/**
 * All cues of the track. Cues have a startTime, endTime, text, and other properties.
 * Spec def: readonly attribute TextTrackCueList cues;
 * @private
 */
vjs.TextTrack.prototype.cues_;

/**
 * Get the track cues
 * @return {Array}
 */
vjs.TextTrack.prototype.cues = function(){
  return this.cues_;
};

/**
 * ActiveCues is all cues that are currently showing
 * Spec def: readonly attribute TextTrackCueList activeCues;
 * @private
 */
vjs.TextTrack.prototype.activeCues_;

/**
 * Get the track active cues
 * @return {Array}
 */
vjs.TextTrack.prototype.activeCues = function(){
  return this.activeCues_;
};

/**
 * ReadyState describes if the text file has been loaded
 * const unsigned short NONE = 0;
 * const unsigned short LOADING = 1;
 * const unsigned short LOADED = 2;
 * const unsigned short ERROR = 3;
 * readonly attribute unsigned short readyState;
 * @private
 */
vjs.TextTrack.prototype.readyState_;

/**
 * Get the track readyState
 * @return {Number}
 */
vjs.TextTrack.prototype.readyState = function(){
  return this.readyState_;
};

/**
 * Mode describes if the track is showing, hidden, or disabled
 * const unsigned short OFF = 0;
 * const unsigned short HIDDEN = 1; (still triggering cuechange events, but not visible)
 * const unsigned short SHOWING = 2;
 * attribute unsigned short mode;
 * @private
 */
vjs.TextTrack.prototype.mode_;

/**
 * Get the track mode
 * @return {Number}
 */
vjs.TextTrack.prototype.mode = function(){
  return this.mode_;
};

/**
 * Change the font size of the text track to make it larger when playing in fullscreen mode
 * and restore it to its normal size when not in fullscreen mode.
 */
vjs.TextTrack.prototype.adjustFontSize = function(){
    if (this.player_.isFullScreen) {
        // Scale the font by the same factor as increasing the video width to the full screen window width.
        // Additionally, multiply that factor by 1.4, which is the default font size for
        // the caption track (from the CSS)
        this.el_.style.fontSize = screen.width / this.player_.width() * 1.4 * 100 + '%';
    } else {
        // Change the font size of the text track back to its original non-fullscreen size
        this.el_.style.fontSize = '';
    }
};

/**
 * Create basic div to hold cue text
 * @return {Element}
 */
vjs.TextTrack.prototype.createEl = function(){
  return vjs.Component.prototype.createEl.call(this, 'div', {
    className: 'vjs-' + this.kind_ + ' vjs-text-track'
  });
};

/**
 * Show: Mode Showing (2)
 * Indicates that the text track is active. If no attempt has yet been made to obtain the track's cues, the user agent will perform such an attempt momentarily.
 * The user agent is maintaining a list of which cues are active, and events are being fired accordingly.
 * In addition, for text tracks whose kind is subtitles or captions, the cues are being displayed over the video as appropriate;
 * for text tracks whose kind is descriptions, the user agent is making the cues available to the user in a non-visual fashion;
 * and for text tracks whose kind is chapters, the user agent is making available to the user a mechanism by which the user can navigate to any point in the media resource by selecting a cue.
 * The showing by default state is used in conjunction with the default attribute on track elements to indicate that the text track was enabled due to that attribute.
 * This allows the user agent to override the state if a later track is discovered that is more appropriate per the user's preferences.
 */
vjs.TextTrack.prototype.show = function(){
  this.activate();

  this.mode_ = 2;

  // Show element.
  vjs.Component.prototype.show.call(this);
};

/**
 * Hide: Mode Hidden (1)
 * Indicates that the text track is active, but that the user agent is not actively displaying the cues.
 * If no attempt has yet been made to obtain the track's cues, the user agent will perform such an attempt momentarily.
 * The user agent is maintaining a list of which cues are active, and events are being fired accordingly.
 */
vjs.TextTrack.prototype.hide = function(){
  // When hidden, cues are still triggered. Disable to stop triggering.
  this.activate();

  this.mode_ = 1;

  // Hide element.
  vjs.Component.prototype.hide.call(this);
};

/**
 * Disable: Mode Off/Disable (0)
 * Indicates that the text track is not active. Other than for the purposes of exposing the track in the DOM, the user agent is ignoring the text track.
 * No cues are active, no events are fired, and the user agent will not attempt to obtain the track's cues.
 */
vjs.TextTrack.prototype.disable = function(){
  // If showing, hide.
  if (this.mode_ == 2) { this.hide(); }

  // Stop triggering cues
  this.deactivate();

  // Switch Mode to Off
  this.mode_ = 0;
};

/**
 * Turn on cue tracking. Tracks that are showing OR hidden are active.
 */
vjs.TextTrack.prototype.activate = function(){
  // Load text file if it hasn't been yet.
  if (this.readyState_ === 0) { this.load(); }

  // Only activate if not already active.
  if (this.mode_ === 0) {
    // Update current cue on timeupdate
    // Using unique ID for bind function so other tracks don't remove listener
    this.player_.on('timeupdate', vjs.bind(this, this.update, this.id_));

    // Reset cue time on media end
    this.player_.on('ended', vjs.bind(this, this.reset, this.id_));

    // Add to display
    if (this.kind_ === 'captions' || this.kind_ === 'subtitles') {
      this.player_.getChild('textTrackDisplay').addChild(this);
    }
  }
};

/**
 * Turn off cue tracking.
 */
vjs.TextTrack.prototype.deactivate = function(){
  // Using unique ID for bind function so other tracks don't remove listener
  this.player_.off('timeupdate', vjs.bind(this, this.update, this.id_));
  this.player_.off('ended', vjs.bind(this, this.reset, this.id_));
  this.reset(); // Reset

  // Remove from display
  this.player_.getChild('textTrackDisplay').removeChild(this);
};

// A readiness state
// One of the following:
//
// Not loaded
// Indicates that the text track is known to exist (e.g. it has been declared with a track element), but its cues have not been obtained.
//
// Loading
// Indicates that the text track is loading and there have been no fatal errors encountered so far. Further cues might still be added to the track.
//
// Loaded
// Indicates that the text track has been loaded with no fatal errors. No new cues will be added to the track except if the text track corresponds to a MutableTextTrack object.
//
// Failed to load
// Indicates that the text track was enabled, but when the user agent attempted to obtain it, this failed in some way (e.g. URL could not be resolved, network error, unknown text track format). Some or all of the cues are likely missing and will not be obtained.
vjs.TextTrack.prototype.load = function(){

  // Only load if not loaded yet.
  if (this.readyState_ === 0) {
    this.readyState_ = 1;
    vjs.get(this.src_, vjs.bind(this, this.parseCues), vjs.bind(this, this.onError));
  }

};

vjs.TextTrack.prototype.onError = function(err){
  this.error = err;
  this.readyState_ = 3;
  this.trigger('error');
};

// Parse the WebVTT text format for cue times.
// TODO: Separate parser into own class so alternative timed text formats can be used. (TTML, DFXP)
vjs.TextTrack.prototype.parseCues = function(srcContent) {
  var cue, time, text,
      lines = srcContent.split('\n'),
      line = '', id;

  for (var i=1, j=lines.length; i<j; i++) {
    // Line 0 should be 'WEBVTT', so skipping i=0

    line = vjs.trim(lines[i]); // Trim whitespace and linebreaks

    if (line) { // Loop until a line with content

      // First line could be an optional cue ID
      // Check if line has the time separator
      if (line.indexOf('-->') == -1) {
        id = line;
        // Advance to next line for timing.
        line = vjs.trim(lines[++i]);
      } else {
        id = this.cues_.length;
      }

      // First line - Number
      cue = {
        id: id, // Cue Number
        index: this.cues_.length // Position in Array
      };

      // Timing line
      time = line.split(' --> ');
      cue.startTime = this.parseCueTime(time[0]);
      cue.endTime = this.parseCueTime(time[1]);

      // Additional lines - Cue Text
      text = [];

      // Loop until a blank line or end of lines
      // Assumeing trim('') returns false for blank lines
      while (lines[++i] && (line = vjs.trim(lines[i]))) {
        text.push(line);
      }

      cue.text = text.join('<br/>');

      // Add this cue
      this.cues_.push(cue);
    }
  }

  this.readyState_ = 2;
  this.trigger('loaded');
};


vjs.TextTrack.prototype.parseCueTime = function(timeText) {
  var parts = timeText.split(':'),
      time = 0,
      hours, minutes, other, seconds, ms;

  // Check if optional hours place is included
  // 00:00:00.000 vs. 00:00.000
  if (parts.length == 3) {
    hours = parts[0];
    minutes = parts[1];
    other = parts[2];
  } else {
    hours = 0;
    minutes = parts[0];
    other = parts[1];
  }

  // Break other (seconds, milliseconds, and flags) by spaces
  // TODO: Make additional cue layout settings work with flags
  other = other.split(/\s+/);
  // Remove seconds. Seconds is the first part before any spaces.
  seconds = other.splice(0,1)[0];
  // Could use either . or , for decimal
  seconds = seconds.split(/\.|,/);
  // Get milliseconds
  ms = parseFloat(seconds[1]);
  seconds = seconds[0];

  // hours => seconds
  time += parseFloat(hours) * 3600;
  // minutes => seconds
  time += parseFloat(minutes) * 60;
  // Add seconds
  time += parseFloat(seconds);
  // Add milliseconds
  if (ms) { time += ms/1000; }

  return time;
};

// Update active cues whenever timeupdate events are triggered on the player.
vjs.TextTrack.prototype.update = function(){
  if (this.cues_.length > 0) {

    // Get curent player time
    var time = this.player_.currentTime();

    // Check if the new time is outside the time box created by the the last update.
    if (this.prevChange === undefined || time < this.prevChange || this.nextChange <= time) {
      var cues = this.cues_,

          // Create a new time box for this state.
          newNextChange = this.player_.duration(), // Start at beginning of the timeline
          newPrevChange = 0, // Start at end

          reverse = false, // Set the direction of the loop through the cues. Optimized the cue check.
          newCues = [], // Store new active cues.

          // Store where in the loop the current active cues are, to provide a smart starting point for the next loop.
          firstActiveIndex, lastActiveIndex,
          cue, i; // Loop vars

      // Check if time is going forwards or backwards (scrubbing/rewinding)
      // If we know the direction we can optimize the starting position and direction of the loop through the cues array.
      if (time >= this.nextChange || this.nextChange === undefined) { // NextChange should happen
        // Forwards, so start at the index of the first active cue and loop forward
        i = (this.firstActiveIndex !== undefined) ? this.firstActiveIndex : 0;
      } else {
        // Backwards, so start at the index of the last active cue and loop backward
        reverse = true;
        i = (this.lastActiveIndex !== undefined) ? this.lastActiveIndex : cues.length - 1;
      }

      while (true) { // Loop until broken
        cue = cues[i];

        // Cue ended at this point
        if (cue.endTime <= time) {
          newPrevChange = Math.max(newPrevChange, cue.endTime);

          if (cue.active) {
            cue.active = false;
          }

          // No earlier cues should have an active start time.
          // Nevermind. Assume first cue could have a duration the same as the video.
          // In that case we need to loop all the way back to the beginning.
          // if (reverse && cue.startTime) { break; }

        // Cue hasn't started
        } else if (time < cue.startTime) {
          newNextChange = Math.min(newNextChange, cue.startTime);

          if (cue.active) {
            cue.active = false;
          }

          // No later cues should have an active start time.
          if (!reverse) { break; }

        // Cue is current
        } else {

          if (reverse) {
            // Add cue to front of array to keep in time order
            newCues.splice(0,0,cue);

            // If in reverse, the first current cue is our lastActiveCue
            if (lastActiveIndex === undefined) { lastActiveIndex = i; }
            firstActiveIndex = i;
          } else {
            // Add cue to end of array
            newCues.push(cue);

            // If forward, the first current cue is our firstActiveIndex
            if (firstActiveIndex === undefined) { firstActiveIndex = i; }
            lastActiveIndex = i;
          }

          newNextChange = Math.min(newNextChange, cue.endTime);
          newPrevChange = Math.max(newPrevChange, cue.startTime);

          cue.active = true;
        }

        if (reverse) {
          // Reverse down the array of cues, break if at first
          if (i === 0) { break; } else { i--; }
        } else {
          // Walk up the array fo cues, break if at last
          if (i === cues.length - 1) { break; } else { i++; }
        }

      }

      this.activeCues_ = newCues;
      this.nextChange = newNextChange;
      this.prevChange = newPrevChange;
      this.firstActiveIndex = firstActiveIndex;
      this.lastActiveIndex = lastActiveIndex;

      this.updateDisplay();

      this.trigger('cuechange');
    }
  }
};

// Add cue HTML to display
vjs.TextTrack.prototype.updateDisplay = function(){
  var cues = this.activeCues_,
      html = '',
      i=0,j=cues.length;

  for (;i<j;i++) {
    html += '<span class="vjs-tt-cue">'+cues[i].text+'</span>';
  }

  this.el_.innerHTML = html;
};

// Set all loop helper values back
vjs.TextTrack.prototype.reset = function(){
  this.nextChange = 0;
  this.prevChange = this.player_.duration();
  this.firstActiveIndex = 0;
  this.lastActiveIndex = 0;
};

// Create specific track types
/**
 * The track component for managing the hiding and showing of captions
 *
 * @constructor
 */
vjs.CaptionsTrack = vjs.TextTrack.extend();
vjs.CaptionsTrack.prototype.kind_ = 'captions';
// Exporting here because Track creation requires the track kind
// to be available on global object. e.g. new window['videojs'][Kind + 'Track']

/**
 * The track component for managing the hiding and showing of subtitles
 *
 * @constructor
 */
vjs.SubtitlesTrack = vjs.TextTrack.extend();
vjs.SubtitlesTrack.prototype.kind_ = 'subtitles';

/**
 * The track component for managing the hiding and showing of chapters
 *
 * @constructor
 */
vjs.ChaptersTrack = vjs.TextTrack.extend();
vjs.ChaptersTrack.prototype.kind_ = 'chapters';


/* Text Track Display
============================================================================= */
// Global container for both subtitle and captions text. Simple div container.

/**
 * The component for displaying text track cues
 *
 * @constructor
 */
vjs.TextTrackDisplay = vjs.Component.extend({
  /** @constructor */
  init: function(player, options, ready){
    vjs.Component.call(this, player, options, ready);

    // This used to be called during player init, but was causing an error
    // if a track should show by default and the display hadn't loaded yet.
    // Should probably be moved to an external track loader when we support
    // tracks that don't need a display.
    if (player.options_['tracks'] && player.options_['tracks'].length > 0) {
      this.player_.addTextTracks(player.options_['tracks']);
    }
  }
});

vjs.TextTrackDisplay.prototype.createEl = function(){
  return vjs.Component.prototype.createEl.call(this, 'div', {
    className: 'vjs-text-track-display'
  });
};


/**
 * The specific menu item type for selecting a language within a text track kind
 *
 * @constructor
 */
vjs.TextTrackMenuItem = vjs.MenuItem.extend({
  /** @constructor */
  init: function(player, options){
    var track = this.track = options['track'];

    // Modify options for parent MenuItem class's init.
    options['label'] = track.label();
    options['selected'] = track.dflt();
    vjs.MenuItem.call(this, player, options);

    this.player_.on(track.kind() + 'trackchange', vjs.bind(this, this.update));
  }
});

vjs.TextTrackMenuItem.prototype.onClick = function(){
  vjs.MenuItem.prototype.onClick.call(this);
  this.player_.showTextTrack(this.track.id_, this.track.kind());
};

vjs.TextTrackMenuItem.prototype.update = function(){
  this.selected(this.track.mode() == 2);
};

/**
 * A special menu item for turning of a specific type of text track
 *
 * @constructor
 */
vjs.OffTextTrackMenuItem = vjs.TextTrackMenuItem.extend({
  /** @constructor */
  init: function(player, options){
    // Create pseudo track info
    // Requires options['kind']
    options['track'] = {
      kind: function() { return options['kind']; },
      player: player,
      label: function(){ return options['kind'] + ' off'; },
      dflt: function(){ return false; },
      mode: function(){ return false; }
    };
    vjs.TextTrackMenuItem.call(this, player, options);
    this.selected(true);
  }
});

vjs.OffTextTrackMenuItem.prototype.onClick = function(){
  vjs.TextTrackMenuItem.prototype.onClick.call(this);
  this.player_.showTextTrack(this.track.id_, this.track.kind());
};

vjs.OffTextTrackMenuItem.prototype.update = function(){
  var tracks = this.player_.textTracks(),
      i=0, j=tracks.length, track,
      off = true;

  for (;i<j;i++) {
    track = tracks[i];
    if (track.kind() == this.track.kind() && track.mode() == 2) {
      off = false;
    }
  }

  this.selected(off);
};

/**
 * The base class for buttons that toggle specific text track types (e.g. subtitles)
 *
 * @constructor
 */
vjs.TextTrackButton = vjs.MenuButton.extend({
  /** @constructor */
  init: function(player, options){
    vjs.MenuButton.call(this, player, options);

    if (this.items.length <= 1) {
      this.hide();
    }
  }
});

// vjs.TextTrackButton.prototype.buttonPressed = false;

// vjs.TextTrackButton.prototype.createMenu = function(){
//   var menu = new vjs.Menu(this.player_);

//   // Add a title list item to the top
//   // menu.el().appendChild(vjs.createEl('li', {
//   //   className: 'vjs-menu-title',
//   //   innerHTML: vjs.capitalize(this.kind_),
//   //   tabindex: -1
//   // }));

//   this.items = this.createItems();

//   // Add menu items to the menu
//   for (var i = 0; i < this.items.length; i++) {
//     menu.addItem(this.items[i]);
//   }

//   // Add list to element
//   this.addChild(menu);

//   return menu;
// };

// Create a menu item for each text track
vjs.TextTrackButton.prototype.createItems = function(){
  var items = [], track;

  // Add an OFF menu item to turn all tracks off
  items.push(new vjs.OffTextTrackMenuItem(this.player_, { 'kind': this.kind_ }));

  for (var i = 0; i < this.player_.textTracks().length; i++) {
    track = this.player_.textTracks()[i];
    if (track.kind() === this.kind_) {
      items.push(new vjs.TextTrackMenuItem(this.player_, {
        'track': track
      }));
    }
  }

  return items;
};

/**
 * The button component for toggling and selecting captions
 *
 * @constructor
 */
vjs.CaptionsButton = vjs.TextTrackButton.extend({
  /** @constructor */
  init: function(player, options, ready){
    vjs.TextTrackButton.call(this, player, options, ready);
    this.el_.setAttribute('aria-label','Captions Menu');
  }
});
vjs.CaptionsButton.prototype.kind_ = 'captions';
vjs.CaptionsButton.prototype.buttonText = 'Captions';
vjs.CaptionsButton.prototype.className = 'vjs-captions-button';

/**
 * The button component for toggling and selecting subtitles
 *
 * @constructor
 */
vjs.SubtitlesButton = vjs.TextTrackButton.extend({
  /** @constructor */
  init: function(player, options, ready){
    vjs.TextTrackButton.call(this, player, options, ready);
    this.el_.setAttribute('aria-label','Subtitles Menu');
  }
});
vjs.SubtitlesButton.prototype.kind_ = 'subtitles';
vjs.SubtitlesButton.prototype.buttonText = 'Subtitles';
vjs.SubtitlesButton.prototype.className = 'vjs-subtitles-button';

// Chapters act much differently than other text tracks
// Cues are navigation vs. other tracks of alternative languages
/**
 * The button component for toggling and selecting chapters
 *
 * @constructor
 */
vjs.ChaptersButton = vjs.TextTrackButton.extend({
  /** @constructor */
  init: function(player, options, ready){
    vjs.TextTrackButton.call(this, player, options, ready);
    this.el_.setAttribute('aria-label','Chapters Menu');
  }
});
vjs.ChaptersButton.prototype.kind_ = 'chapters';
vjs.ChaptersButton.prototype.buttonText = 'Chapters';
vjs.ChaptersButton.prototype.className = 'vjs-chapters-button';

// Create a menu item for each text track
vjs.ChaptersButton.prototype.createItems = function(){
  var items = [], track;

  for (var i = 0; i < this.player_.textTracks().length; i++) {
    track = this.player_.textTracks()[i];
    if (track.kind() === this.kind_) {
      items.push(new vjs.TextTrackMenuItem(this.player_, {
        'track': track
      }));
    }
  }

  return items;
};

vjs.ChaptersButton.prototype.createMenu = function(){
  var tracks = this.player_.textTracks(),
      i = 0,
      j = tracks.length,
      track, chaptersTrack,
      items = this.items = [];

  for (;i<j;i++) {
    track = tracks[i];
    if (track.kind() == this.kind_ && track.dflt()) {
      if (track.readyState() < 2) {
        this.chaptersTrack = track;
        track.on('loaded', vjs.bind(this, this.createMenu));
        return;
      } else {
        chaptersTrack = track;
        break;
      }
    }
  }

  var menu = this.menu = new vjs.Menu(this.player_);

  menu.el_.appendChild(vjs.createEl('li', {
    className: 'vjs-menu-title',
    innerHTML: vjs.capitalize(this.kind_),
    tabindex: -1
  }));

  if (chaptersTrack) {
    var cues = chaptersTrack.cues_, cue, mi;
    i = 0;
    j = cues.length;

    for (;i<j;i++) {
      cue = cues[i];

      mi = new vjs.ChaptersTrackMenuItem(this.player_, {
        'track': chaptersTrack,
        'cue': cue
      });

      items.push(mi);

      menu.addChild(mi);
    }
  }

  if (this.items.length > 0) {
    this.show();
  }

  return menu;
};


/**
 * @constructor
 */
vjs.ChaptersTrackMenuItem = vjs.MenuItem.extend({
  /** @constructor */
  init: function(player, options){
    var track = this.track = options['track'],
        cue = this.cue = options['cue'],
        currentTime = player.currentTime();

    // Modify options for parent MenuItem class's init.
    options['label'] = cue.text;
    options['selected'] = (cue.startTime <= currentTime && currentTime < cue.endTime);
    vjs.MenuItem.call(this, player, options);

    track.on('cuechange', vjs.bind(this, this.update));
  }
});

vjs.ChaptersTrackMenuItem.prototype.onClick = function(){
  vjs.MenuItem.prototype.onClick.call(this);
  this.player_.currentTime(this.cue.startTime);
  this.update(this.cue.startTime);
};

vjs.ChaptersTrackMenuItem.prototype.update = function(){
  var cue = this.cue,
      currentTime = this.player_.currentTime();

  // vjs.log(currentTime, cue.startTime);
  this.selected(cue.startTime <= currentTime && currentTime < cue.endTime);
};

// Add Buttons to controlBar
vjs.obj.merge(vjs.ControlBar.prototype.options_['children'], {
  'subtitlesButton': {},
  'captionsButton': {},
  'chaptersButton': {}
});

// vjs.Cue = vjs.Component.extend({
//   /** @constructor */
//   init: function(player, options){
//     vjs.Component.call(this, player, options);
//   }
// });
/**
 * @fileoverview Add JSON support
 * @suppress {undefinedVars}
 * (Compiler doesn't like JSON not being declared)
 */

/**
 * Javascript JSON implementation
 * (Parse Method Only)
 * https://github.com/douglascrockford/JSON-js/blob/master/json2.js
 * Only using for parse method when parsing data-setup attribute JSON.
 * @suppress {undefinedVars}
 * @namespace
 * @private
 */
vjs.JSON;

if (typeof window.JSON !== 'undefined' && window.JSON.parse === 'function') {
  vjs.JSON = window.JSON;

} else {
  vjs.JSON = {};

  var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;

  /**
   * parse the json
   *
   * @memberof vjs.JSON
   * @return {Object|Array} The parsed JSON
   */
  vjs.JSON.parse = function (text, reviver) {
      var j;

      function walk(holder, key) {
          var k, v, value = holder[key];
          if (value && typeof value === 'object') {
              for (k in value) {
                  if (Object.prototype.hasOwnProperty.call(value, k)) {
                      v = walk(value, k);
                      if (v !== undefined) {
                          value[k] = v;
                      } else {
                          delete value[k];
                      }
                  }
              }
          }
          return reviver.call(holder, key, value);
      }
      text = String(text);
      cx.lastIndex = 0;
      if (cx.test(text)) {
          text = text.replace(cx, function (a) {
              return '\\u' +
                  ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
          });
      }

      if (/^[\],:{}\s]*$/
              .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                  .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                  .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

          j = eval('(' + text + ')');

          return typeof reviver === 'function' ?
              walk({'': j}, '') : j;
      }

      throw new SyntaxError('JSON.parse(): invalid or malformed JSON data');
  };
}
/**
 * @fileoverview Functions for automatically setting up a player
 * based on the data-setup attribute of the video tag
 */

// Automatically set up any tags that have a data-setup attribute
vjs.autoSetup = function(){
  var options, vid, player,
      vids = document.getElementsByTagName('video');

  // Check if any media elements exist
  if (vids && vids.length > 0) {

    for (var i=0,j=vids.length; i<j; i++) {
      vid = vids[i];

      // Check if element exists, has getAttribute func.
      // IE seems to consider typeof el.getAttribute == 'object' instead of 'function' like expected, at least when loading the player immediately.
      if (vid && vid.getAttribute) {

        // Make sure this player hasn't already been set up.
        if (vid['player'] === undefined) {
          options = vid.getAttribute('data-setup');

          // Check if data-setup attr exists.
          // We only auto-setup if they've added the data-setup attr.
          if (options !== null) {

            // Parse options JSON
            // If empty string, make it a parsable json object.
            options = vjs.JSON.parse(options || '{}');

            // Create new video.js instance.
            player = videojs(vid, options);
          }
        }

      // If getAttribute isn't defined, we need to wait for the DOM.
      } else {
        vjs.autoSetupTimeout(1);
        break;
      }
    }

  // No videos were found, so keep looping unless page is finisehd loading.
  } else if (!vjs.windowLoaded) {
    vjs.autoSetupTimeout(1);
  }
};

// Pause to let the DOM keep processing
vjs.autoSetupTimeout = function(wait){
  setTimeout(vjs.autoSetup, wait);
};

if (document.readyState === 'complete') {
  vjs.windowLoaded = true;
} else {
  vjs.one(window, 'load', function(){
    vjs.windowLoaded = true;
  });
}

// Run Auto-load players
// You have to wait at least once in case this script is loaded after your video in the DOM (weird behavior only with minified version)
vjs.autoSetupTimeout(1);
/**
 * the method for registering a video.js plugin
 *
 * @param  {String} name The name of the plugin
 * @param  {Function} init The function that is run when the player inits
 */
vjs.plugin = function(name, init){
  vjs.Player.prototype[name] = init;
};

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvdGhpcmQtcGFydHkvdmlkZW8tanMvdmlkZW8uZGV2LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGZpbGVvdmVydmlldyBNYWluIGZ1bmN0aW9uIHNyYy5cbiAqL1xuXG4vLyBIVE1MNSBTaGl2LiBNdXN0IGJlIGluIDxoZWFkPiB0byBzdXBwb3J0IG9sZGVyIGJyb3dzZXJzLlxuZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndmlkZW8nKTtcbmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2F1ZGlvJyk7XG5kb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0cmFjaycpO1xuXG4vKipcbiAqIERvdWJsZXMgYXMgdGhlIG1haW4gZnVuY3Rpb24gZm9yIHVzZXJzIHRvIGNyZWF0ZSBhIHBsYXllciBpbnN0YW5jZSBhbmQgYWxzb1xuICogdGhlIG1haW4gbGlicmFyeSBvYmplY3QuXG4gKlxuICogKipBTElBU0VTKiogdmlkZW9qcywgX1ZfIChkZXByZWNhdGVkKVxuICpcbiAqIFRoZSBgdmpzYCBmdW5jdGlvbiBjYW4gYmUgdXNlZCB0byBpbml0aWFsaXplIG9yIHJldHJpZXZlIGEgcGxheWVyLlxuICpcbiAqICAgICB2YXIgbXlQbGF5ZXIgPSB2anMoJ215X3ZpZGVvX2lkJyk7XG4gKlxuICogQHBhcmFtICB7U3RyaW5nfEVsZW1lbnR9IGlkICAgICAgVmlkZW8gZWxlbWVudCBvciB2aWRlbyBlbGVtZW50IElEXG4gKiBAcGFyYW0gIHtPYmplY3Q9fSBvcHRpb25zICAgICAgICBPcHRpb25hbCBvcHRpb25zIG9iamVjdCBmb3IgY29uZmlnL3NldHRpbmdzXG4gKiBAcGFyYW0gIHtGdW5jdGlvbj19IHJlYWR5ICAgICAgICBPcHRpb25hbCByZWFkeSBjYWxsYmFja1xuICogQHJldHVybiB7dmpzLlBsYXllcn0gICAgICAgICAgICAgQSBwbGF5ZXIgaW5zdGFuY2VcbiAqIEBuYW1lc3BhY2VcbiAqL1xudmFyIHZqcyA9IGZ1bmN0aW9uKGlkLCBvcHRpb25zLCByZWFkeSl7XG4gIHZhciB0YWc7IC8vIEVsZW1lbnQgb2YgSURcblxuICAvLyBBbGxvdyBmb3IgZWxlbWVudCBvciBJRCB0byBiZSBwYXNzZWQgaW5cbiAgLy8gU3RyaW5nIElEXG4gIGlmICh0eXBlb2YgaWQgPT09ICdzdHJpbmcnKSB7XG5cbiAgICAvLyBBZGp1c3QgZm9yIGpRdWVyeSBJRCBzeW50YXhcbiAgICBpZiAoaWQuaW5kZXhPZignIycpID09PSAwKSB7XG4gICAgICBpZCA9IGlkLnNsaWNlKDEpO1xuICAgIH1cblxuICAgIC8vIElmIGEgcGxheWVyIGluc3RhbmNlIGhhcyBhbHJlYWR5IGJlZW4gY3JlYXRlZCBmb3IgdGhpcyBJRCByZXR1cm4gaXQuXG4gICAgaWYgKHZqcy5wbGF5ZXJzW2lkXSkge1xuICAgICAgcmV0dXJuIHZqcy5wbGF5ZXJzW2lkXTtcblxuICAgIC8vIE90aGVyd2lzZSBnZXQgZWxlbWVudCBmb3IgSURcbiAgICB9IGVsc2Uge1xuICAgICAgdGFnID0gdmpzLmVsKGlkKTtcbiAgICB9XG5cbiAgLy8gSUQgaXMgYSBtZWRpYSBlbGVtZW50XG4gIH0gZWxzZSB7XG4gICAgdGFnID0gaWQ7XG4gIH1cblxuICAvLyBDaGVjayBmb3IgYSB1c2VhYmxlIGVsZW1lbnRcbiAgaWYgKCF0YWcgfHwgIXRhZy5ub2RlTmFtZSkgeyAvLyByZTogbm9kZU5hbWUsIGNvdWxkIGJlIGEgYm94IGRpdiBhbHNvXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIGVsZW1lbnQgb3IgSUQgc3VwcGxpZWQgaXMgbm90IHZhbGlkLiAodmlkZW9qcyknKTsgLy8gUmV0dXJuc1xuICB9XG5cbiAgLy8gRWxlbWVudCBtYXkgaGF2ZSBhIHBsYXllciBhdHRyIHJlZmVycmluZyB0byBhbiBhbHJlYWR5IGNyZWF0ZWQgcGxheWVyIGluc3RhbmNlLlxuICAvLyBJZiBub3QsIHNldCB1cCBhIG5ldyBwbGF5ZXIgYW5kIHJldHVybiB0aGUgaW5zdGFuY2UuXG4gIHJldHVybiB0YWdbJ3BsYXllciddIHx8IG5ldyB2anMuUGxheWVyKHRhZywgb3B0aW9ucywgcmVhZHkpO1xufTtcblxuLy8gRXh0ZW5kZWQgbmFtZSwgYWxzbyBhdmFpbGFibGUgZXh0ZXJuYWxseSwgd2luZG93LnZpZGVvanNcbnZhciB2aWRlb2pzID0gdmpzO1xud2luZG93LnZpZGVvanMgPSB3aW5kb3cudmpzID0gdmpzO1xuXG4vLyBDRE4gVmVyc2lvbi4gVXNlZCB0byB0YXJnZXQgcmlnaHQgZmxhc2ggc3dmLlxudmpzLkNETl9WRVJTSU9OID0gJzQuMyc7XG52anMuQUNDRVNTX1BST1RPQ09MID0gKCdodHRwczonID09IGRvY3VtZW50LmxvY2F0aW9uLnByb3RvY29sID8gJ2h0dHBzOi8vJyA6ICdodHRwOi8vJyk7XG5cbi8qKlxuICogR2xvYmFsIFBsYXllciBpbnN0YW5jZSBvcHRpb25zLCBzdXJmYWNlZCBmcm9tIHZqcy5QbGF5ZXIucHJvdG90eXBlLm9wdGlvbnNfXG4gKiB2anMub3B0aW9ucyA9IHZqcy5QbGF5ZXIucHJvdG90eXBlLm9wdGlvbnNfXG4gKiBBbGwgb3B0aW9ucyBzaG91bGQgdXNlIHN0cmluZyBrZXlzIHNvIHRoZXkgYXZvaWRcbiAqIHJlbmFtaW5nIGJ5IGNsb3N1cmUgY29tcGlsZXJcbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbnZqcy5vcHRpb25zID0ge1xuICAvLyBEZWZhdWx0IG9yZGVyIG9mIGZhbGxiYWNrIHRlY2hub2xvZ3lcbiAgJ3RlY2hPcmRlcic6IFsnaHRtbDUnLCdmbGFzaCddLFxuICAvLyB0ZWNoT3JkZXI6IFsnZmxhc2gnLCdodG1sNSddLFxuXG4gICdodG1sNSc6IHt9LFxuICAnZmxhc2gnOiB7fSxcblxuICAvLyBEZWZhdWx0IG9mIHdlYiBicm93c2VyIGlzIDMwMHgxNTAuIFNob3VsZCByZWx5IG9uIHNvdXJjZSB3aWR0aC9oZWlnaHQuXG4gICd3aWR0aCc6IDMwMCxcbiAgJ2hlaWdodCc6IDE1MCxcbiAgLy8gZGVmYXVsdFZvbHVtZTogMC44NSxcbiAgJ2RlZmF1bHRWb2x1bWUnOiAwLjAwLCAvLyBUaGUgZnJlYWtpbiBzZWFndWxzIGFyZSBkcml2aW5nIG1lIGNyYXp5IVxuXG4gIC8vIEluY2x1ZGVkIGNvbnRyb2wgc2V0c1xuICAnY2hpbGRyZW4nOiB7XG4gICAgJ21lZGlhTG9hZGVyJzoge30sXG4gICAgJ3Bvc3RlckltYWdlJzoge30sXG4gICAgJ3RleHRUcmFja0Rpc3BsYXknOiB7fSxcbiAgICAnbG9hZGluZ1NwaW5uZXInOiB7fSxcbiAgICAnYmlnUGxheUJ1dHRvbic6IHt9LFxuICAgICdjb250cm9sQmFyJzoge31cbiAgfSxcblxuICAvLyBEZWZhdWx0IG1lc3NhZ2UgdG8gc2hvdyB3aGVuIGEgdmlkZW8gY2Fubm90IGJlIHBsYXllZC5cbiAgJ25vdFN1cHBvcnRlZE1lc3NhZ2UnOiAnU29ycnksIG5vIGNvbXBhdGlibGUgc291cmNlIGFuZCBwbGF5YmFjayAnICtcbiAgICAgICd0ZWNobm9sb2d5IHdlcmUgZm91bmQgZm9yIHRoaXMgdmlkZW8uIFRyeSB1c2luZyBhbm90aGVyIGJyb3dzZXIgJyArXG4gICAgICAnbGlrZSA8YSBocmVmPVwiaHR0cDovL2JpdC5seS9jY01VRUNcIj5DaHJvbWU8L2E+IG9yIGRvd25sb2FkIHRoZSAnICtcbiAgICAgICdsYXRlc3QgPGEgaHJlZj1cImh0dHA6Ly9hZG9iZS5seS9td2ZOMVwiPkFkb2JlIEZsYXNoIFBsYXllcjwvYT4uJ1xufTtcblxuLy8gU2V0IENETiBWZXJzaW9uIG9mIHN3ZlxuLy8gVGhlIGFkZGVkICgrKSBibG9ja3MgdGhlIHJlcGxhY2UgZnJvbSBjaGFuZ2luZyB0aGlzIDQuMyBzdHJpbmdcbmlmICh2anMuQ0ROX1ZFUlNJT04gIT09ICdHRU5FUkFURUQnKydfQ0ROX1ZTTicpIHtcbiAgdmlkZW9qcy5vcHRpb25zWydmbGFzaCddWydzd2YnXSA9IHZqcy5BQ0NFU1NfUFJPVE9DT0wgKyAndmpzLnplbmNkbi5uZXQvJyt2anMuQ0ROX1ZFUlNJT04rJy92aWRlby1qcy5zd2YnO1xufVxuXG4vKipcbiAqIEdsb2JhbCBwbGF5ZXIgbGlzdFxuICogQHR5cGUge09iamVjdH1cbiAqL1xudmpzLnBsYXllcnMgPSB7fTtcbi8qKlxuICogQ29yZSBPYmplY3QvQ2xhc3MgZm9yIG9iamVjdHMgdGhhdCB1c2UgaW5oZXJpdGFuY2UgKyBjb250c3RydWN0b3JzXG4gKlxuICogVG8gY3JlYXRlIGEgY2xhc3MgdGhhdCBjYW4gYmUgc3ViY2xhc3NlZCBpdHNlbGYsIGV4dGVuZCB0aGUgQ29yZU9iamVjdCBjbGFzcy5cbiAqXG4gKiAgICAgdmFyIEFuaW1hbCA9IENvcmVPYmplY3QuZXh0ZW5kKCk7XG4gKiAgICAgdmFyIEhvcnNlID0gQW5pbWFsLmV4dGVuZCgpO1xuICpcbiAqIFRoZSBjb25zdHJ1Y3RvciBjYW4gYmUgZGVmaW5lZCB0aHJvdWdoIHRoZSBpbml0IHByb3BlcnR5IG9mIGFuIG9iamVjdCBhcmd1bWVudC5cbiAqXG4gKiAgICAgdmFyIEFuaW1hbCA9IENvcmVPYmplY3QuZXh0ZW5kKHtcbiAqICAgICAgIGluaXQ6IGZ1bmN0aW9uKG5hbWUsIHNvdW5kKXtcbiAqICAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAqICAgICAgIH1cbiAqICAgICB9KTtcbiAqXG4gKiBPdGhlciBtZXRob2RzIGFuZCBwcm9wZXJ0aWVzIGNhbiBiZSBhZGRlZCB0aGUgc2FtZSB3YXksIG9yIGRpcmVjdGx5IHRvIHRoZVxuICogcHJvdG90eXBlLlxuICpcbiAqICAgIHZhciBBbmltYWwgPSBDb3JlT2JqZWN0LmV4dGVuZCh7XG4gKiAgICAgICBpbml0OiBmdW5jdGlvbihuYW1lKXtcbiAqICAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAqICAgICAgIH0sXG4gKiAgICAgICBnZXROYW1lOiBmdW5jdGlvbigpe1xuICogICAgICAgICByZXR1cm4gdGhpcy5uYW1lO1xuICogICAgICAgfSxcbiAqICAgICAgIHNvdW5kOiAnLi4uJ1xuICogICAgfSk7XG4gKlxuICogICAgQW5pbWFsLnByb3RvdHlwZS5tYWtlU291bmQgPSBmdW5jdGlvbigpe1xuICogICAgICBhbGVydCh0aGlzLnNvdW5kKTtcbiAqICAgIH07XG4gKlxuICogVG8gY3JlYXRlIGFuIGluc3RhbmNlIG9mIGEgY2xhc3MsIHVzZSB0aGUgY3JlYXRlIG1ldGhvZC5cbiAqXG4gKiAgICB2YXIgZmx1ZmZ5ID0gQW5pbWFsLmNyZWF0ZSgnRmx1ZmZ5Jyk7XG4gKiAgICBmbHVmZnkuZ2V0TmFtZSgpOyAvLyAtPiBGbHVmZnlcbiAqXG4gKiBNZXRob2RzIGFuZCBwcm9wZXJ0aWVzIGNhbiBiZSBvdmVycmlkZGVuIGluIHN1YmNsYXNzZXMuXG4gKlxuICogICAgIHZhciBIb3JzZSA9IEFuaW1hbC5leHRlbmQoe1xuICogICAgICAgc291bmQ6ICdOZWlnaGhoaGghJ1xuICogICAgIH0pO1xuICpcbiAqICAgICB2YXIgaG9yc2V5ID0gSG9yc2UuY3JlYXRlKCdIb3JzZXknKTtcbiAqICAgICBob3JzZXkuZ2V0TmFtZSgpOyAvLyAtPiBIb3JzZXlcbiAqICAgICBob3JzZXkubWFrZVNvdW5kKCk7IC8vIC0+IEFsZXJ0OiBOZWlnaGhoaGghXG4gKlxuICogQGNsYXNzXG4gKiBAY29uc3RydWN0b3JcbiAqL1xudmpzLkNvcmVPYmplY3QgPSB2anNbJ0NvcmVPYmplY3QnXSA9IGZ1bmN0aW9uKCl7fTtcbi8vIE1hbnVhbGx5IGV4cG9ydGluZyB2anNbJ0NvcmVPYmplY3QnXSBoZXJlIGZvciBDbG9zdXJlIENvbXBpbGVyXG4vLyBiZWNhdXNlIG9mIHRoZSB1c2Ugb2YgdGhlIGV4dGVuZC9jcmVhdGUgY2xhc3MgbWV0aG9kc1xuLy8gSWYgd2UgZGlkbid0IGRvIHRoaXMsIHRob3NlIGZ1bmN0aW9ucyB3b3VsZCBnZXQgZmxhdHRlbmQgdG8gc29tZXRoaW5nIGxpa2Vcbi8vIGBhID0gLi4uYCBhbmQgYHRoaXMucHJvdG90eXBlYCB3b3VsZCByZWZlciB0byB0aGUgZ2xvYmFsIG9iamVjdCBpbnN0ZWFkIG9mXG4vLyBDb3JlT2JqZWN0XG5cbi8qKlxuICogQ3JlYXRlIGEgbmV3IG9iamVjdCB0aGF0IGluaGVyaXRzIGZyb20gdGhpcyBPYmplY3RcbiAqXG4gKiAgICAgdmFyIEFuaW1hbCA9IENvcmVPYmplY3QuZXh0ZW5kKCk7XG4gKiAgICAgdmFyIEhvcnNlID0gQW5pbWFsLmV4dGVuZCgpO1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBwcm9wcyBGdW5jdGlvbnMgYW5kIHByb3BlcnRpZXMgdG8gYmUgYXBwbGllZCB0byB0aGVcbiAqICAgICAgICAgICAgICAgICAgICAgICBuZXcgb2JqZWN0J3MgcHJvdG90eXBlXG4gKiBAcmV0dXJuIHt2anMuQ29yZU9iamVjdH0gQW4gb2JqZWN0IHRoYXQgaW5oZXJpdHMgZnJvbSBDb3JlT2JqZWN0XG4gKiBAdGhpcyB7Kn1cbiAqL1xudmpzLkNvcmVPYmplY3QuZXh0ZW5kID0gZnVuY3Rpb24ocHJvcHMpe1xuICB2YXIgaW5pdCwgc3ViT2JqO1xuXG4gIHByb3BzID0gcHJvcHMgfHwge307XG4gIC8vIFNldCB1cCB0aGUgY29uc3RydWN0b3IgdXNpbmcgdGhlIHN1cHBsaWVkIGluaXQgbWV0aG9kXG4gIC8vIG9yIHVzaW5nIHRoZSBpbml0IG9mIHRoZSBwYXJlbnQgb2JqZWN0XG4gIC8vIE1ha2Ugc3VyZSB0byBjaGVjayB0aGUgdW5vYmZ1c2NhdGVkIHZlcnNpb24gZm9yIGV4dGVybmFsIGxpYnNcbiAgaW5pdCA9IHByb3BzWydpbml0J10gfHwgcHJvcHMuaW5pdCB8fCB0aGlzLnByb3RvdHlwZVsnaW5pdCddIHx8IHRoaXMucHJvdG90eXBlLmluaXQgfHwgZnVuY3Rpb24oKXt9O1xuICAvLyBJbiBSZXNpZydzIHNpbXBsZSBjbGFzcyBpbmhlcml0YW5jZSAocHJldmlvdXNseSB1c2VkKSB0aGUgY29uc3RydWN0b3JcbiAgLy8gIGlzIGEgZnVuY3Rpb24gdGhhdCBjYWxscyBgdGhpcy5pbml0LmFwcGx5KGFyZ3VtZW50cylgXG4gIC8vIEhvd2V2ZXIgdGhhdCB3b3VsZCBwcmV2ZW50IHVzIGZyb20gdXNpbmcgYFBhcmVudE9iamVjdC5jYWxsKHRoaXMpO2BcbiAgLy8gIGluIGEgQ2hpbGQgY29uc3R1Y3RvciBiZWNhdXNlIHRoZSBgdGhpc2AgaW4gYHRoaXMuaW5pdGBcbiAgLy8gIHdvdWxkIHN0aWxsIHJlZmVyIHRvIHRoZSBDaGlsZCBhbmQgY2F1c2UgYW4gaW5pZmluaXRlIGxvb3AuXG4gIC8vIFdlIHdvdWxkIGluc3RlYWQgaGF2ZSB0byBkb1xuICAvLyAgICBgUGFyZW50T2JqZWN0LnByb3RvdHlwZS5pbml0LmFwcGx5KHRoaXMsIGFyZ3VtbmVudHMpO2BcbiAgLy8gIEJsZWguIFdlJ3JlIG5vdCBjcmVhdGluZyBhIF9zdXBlcigpIGZ1bmN0aW9uLCBzbyBpdCdzIGdvb2QgdG8ga2VlcFxuICAvLyAgdGhlIHBhcmVudCBjb25zdHJ1Y3RvciByZWZlcmVuY2Ugc2ltcGxlLlxuICBzdWJPYmogPSBmdW5jdGlvbigpe1xuICAgIGluaXQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfTtcblxuICAvLyBJbmhlcml0IGZyb20gdGhpcyBvYmplY3QncyBwcm90b3R5cGVcbiAgc3ViT2JqLnByb3RvdHlwZSA9IHZqcy5vYmouY3JlYXRlKHRoaXMucHJvdG90eXBlKTtcbiAgLy8gUmVzZXQgdGhlIGNvbnN0cnVjdG9yIHByb3BlcnR5IGZvciBzdWJPYmogb3RoZXJ3aXNlXG4gIC8vIGluc3RhbmNlcyBvZiBzdWJPYmogd291bGQgaGF2ZSB0aGUgY29uc3RydWN0b3Igb2YgdGhlIHBhcmVudCBPYmplY3RcbiAgc3ViT2JqLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IHN1Yk9iajtcblxuICAvLyBNYWtlIHRoZSBjbGFzcyBleHRlbmRhYmxlXG4gIHN1Yk9iai5leHRlbmQgPSB2anMuQ29yZU9iamVjdC5leHRlbmQ7XG4gIC8vIE1ha2UgYSBmdW5jdGlvbiBmb3IgY3JlYXRpbmcgaW5zdGFuY2VzXG4gIHN1Yk9iai5jcmVhdGUgPSB2anMuQ29yZU9iamVjdC5jcmVhdGU7XG5cbiAgLy8gRXh0ZW5kIHN1Yk9iaidzIHByb3RvdHlwZSB3aXRoIGZ1bmN0aW9ucyBhbmQgb3RoZXIgcHJvcGVydGllcyBmcm9tIHByb3BzXG4gIGZvciAodmFyIG5hbWUgaW4gcHJvcHMpIHtcbiAgICBpZiAocHJvcHMuaGFzT3duUHJvcGVydHkobmFtZSkpIHtcbiAgICAgIHN1Yk9iai5wcm90b3R5cGVbbmFtZV0gPSBwcm9wc1tuYW1lXTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gc3ViT2JqO1xufTtcblxuLyoqXG4gKiBDcmVhdGUgYSBuZXcgaW5zdGFjZSBvZiB0aGlzIE9iamVjdCBjbGFzc1xuICpcbiAqICAgICB2YXIgbXlBbmltYWwgPSBBbmltYWwuY3JlYXRlKCk7XG4gKlxuICogQHJldHVybiB7dmpzLkNvcmVPYmplY3R9IEFuIGluc3RhbmNlIG9mIGEgQ29yZU9iamVjdCBzdWJjbGFzc1xuICogQHRoaXMgeyp9XG4gKi9cbnZqcy5Db3JlT2JqZWN0LmNyZWF0ZSA9IGZ1bmN0aW9uKCl7XG4gIC8vIENyZWF0ZSBhIG5ldyBvYmplY3QgdGhhdCBpbmhlcml0cyBmcm9tIHRoaXMgb2JqZWN0J3MgcHJvdG90eXBlXG4gIHZhciBpbnN0ID0gdmpzLm9iai5jcmVhdGUodGhpcy5wcm90b3R5cGUpO1xuXG4gIC8vIEFwcGx5IHRoaXMgY29uc3RydWN0b3IgZnVuY3Rpb24gdG8gdGhlIG5ldyBvYmplY3RcbiAgdGhpcy5hcHBseShpbnN0LCBhcmd1bWVudHMpO1xuXG4gIC8vIFJldHVybiB0aGUgbmV3IG9iamVjdFxuICByZXR1cm4gaW5zdDtcbn07XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRXZlbnQgU3lzdGVtIChKb2huIFJlc2lnIC0gU2VjcmV0cyBvZiBhIEpTIE5pbmphIGh0dHA6Ly9qc25pbmphLmNvbS8pXG4gKiAoT3JpZ2luYWwgYm9vayB2ZXJzaW9uIHdhc24ndCBjb21wbGV0ZWx5IHVzYWJsZSwgc28gZml4ZWQgc29tZSB0aGluZ3MgYW5kIG1hZGUgQ2xvc3VyZSBDb21waWxlciBjb21wYXRpYmxlKVxuICogVGhpcyBzaG91bGQgd29yayB2ZXJ5IHNpbWlsYXJseSB0byBqUXVlcnkncyBldmVudHMsIGhvd2V2ZXIgaXQncyBiYXNlZCBvZmYgdGhlIGJvb2sgdmVyc2lvbiB3aGljaCBpc24ndCBhc1xuICogcm9idXN0IGFzIGpxdWVyeSdzLCBzbyB0aGVyZSdzIHByb2JhYmx5IHNvbWUgZGlmZmVyZW5jZXMuXG4gKi9cblxuLyoqXG4gKiBBZGQgYW4gZXZlbnQgbGlzdGVuZXIgdG8gZWxlbWVudFxuICogSXQgc3RvcmVzIHRoZSBoYW5kbGVyIGZ1bmN0aW9uIGluIGEgc2VwYXJhdGUgY2FjaGUgb2JqZWN0XG4gKiBhbmQgYWRkcyBhIGdlbmVyaWMgaGFuZGxlciB0byB0aGUgZWxlbWVudCdzIGV2ZW50LFxuICogYWxvbmcgd2l0aCBhIHVuaXF1ZSBpZCAoZ3VpZCkgdG8gdGhlIGVsZW1lbnQuXG4gKiBAcGFyYW0gIHtFbGVtZW50fE9iamVjdH0gICBlbGVtIEVsZW1lbnQgb3Igb2JqZWN0IHRvIGJpbmQgbGlzdGVuZXJzIHRvXG4gKiBAcGFyYW0gIHtTdHJpbmd9ICAgdHlwZSBUeXBlIG9mIGV2ZW50IHRvIGJpbmQgdG8uXG4gKiBAcGFyYW0gIHtGdW5jdGlvbn0gZm4gICBFdmVudCBsaXN0ZW5lci5cbiAqIEBwcml2YXRlXG4gKi9cbnZqcy5vbiA9IGZ1bmN0aW9uKGVsZW0sIHR5cGUsIGZuKXtcbiAgdmFyIGRhdGEgPSB2anMuZ2V0RGF0YShlbGVtKTtcblxuICAvLyBXZSBuZWVkIGEgcGxhY2UgdG8gc3RvcmUgYWxsIG91ciBoYW5kbGVyIGRhdGFcbiAgaWYgKCFkYXRhLmhhbmRsZXJzKSBkYXRhLmhhbmRsZXJzID0ge307XG5cbiAgaWYgKCFkYXRhLmhhbmRsZXJzW3R5cGVdKSBkYXRhLmhhbmRsZXJzW3R5cGVdID0gW107XG5cbiAgaWYgKCFmbi5ndWlkKSBmbi5ndWlkID0gdmpzLmd1aWQrKztcblxuICBkYXRhLmhhbmRsZXJzW3R5cGVdLnB1c2goZm4pO1xuXG4gIGlmICghZGF0YS5kaXNwYXRjaGVyKSB7XG4gICAgZGF0YS5kaXNhYmxlZCA9IGZhbHNlO1xuXG4gICAgZGF0YS5kaXNwYXRjaGVyID0gZnVuY3Rpb24gKGV2ZW50KXtcblxuICAgICAgaWYgKGRhdGEuZGlzYWJsZWQpIHJldHVybjtcbiAgICAgIGV2ZW50ID0gdmpzLmZpeEV2ZW50KGV2ZW50KTtcblxuICAgICAgdmFyIGhhbmRsZXJzID0gZGF0YS5oYW5kbGVyc1tldmVudC50eXBlXTtcblxuICAgICAgaWYgKGhhbmRsZXJzKSB7XG4gICAgICAgIC8vIENvcHkgaGFuZGxlcnMgc28gaWYgaGFuZGxlcnMgYXJlIGFkZGVkL3JlbW92ZWQgZHVyaW5nIHRoZSBwcm9jZXNzIGl0IGRvZXNuJ3QgdGhyb3cgZXZlcnl0aGluZyBvZmYuXG4gICAgICAgIHZhciBoYW5kbGVyc0NvcHkgPSBoYW5kbGVycy5zbGljZSgwKTtcblxuICAgICAgICBmb3IgKHZhciBtID0gMCwgbiA9IGhhbmRsZXJzQ29weS5sZW5ndGg7IG0gPCBuOyBtKyspIHtcbiAgICAgICAgICBpZiAoZXZlbnQuaXNJbW1lZGlhdGVQcm9wYWdhdGlvblN0b3BwZWQoKSkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGhhbmRsZXJzQ29weVttXS5jYWxsKGVsZW0sIGV2ZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgaWYgKGRhdGEuaGFuZGxlcnNbdHlwZV0ubGVuZ3RoID09IDEpIHtcbiAgICBpZiAoZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcikge1xuICAgICAgZWxlbS5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGRhdGEuZGlzcGF0Y2hlciwgZmFsc2UpO1xuICAgIH0gZWxzZSBpZiAoZG9jdW1lbnQuYXR0YWNoRXZlbnQpIHtcbiAgICAgIGVsZW0uYXR0YWNoRXZlbnQoJ29uJyArIHR5cGUsIGRhdGEuZGlzcGF0Y2hlcik7XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIFJlbW92ZXMgZXZlbnQgbGlzdGVuZXJzIGZyb20gYW4gZWxlbWVudFxuICogQHBhcmFtICB7RWxlbWVudHxPYmplY3R9ICAgZWxlbSBPYmplY3QgdG8gcmVtb3ZlIGxpc3RlbmVycyBmcm9tXG4gKiBAcGFyYW0gIHtTdHJpbmc9fSAgIHR5cGUgVHlwZSBvZiBsaXN0ZW5lciB0byByZW1vdmUuIERvbid0IGluY2x1ZGUgdG8gcmVtb3ZlIGFsbCBldmVudHMgZnJvbSBlbGVtZW50LlxuICogQHBhcmFtICB7RnVuY3Rpb259IGZuICAgU3BlY2lmaWMgbGlzdGVuZXIgdG8gcmVtb3ZlLiBEb24ndCBpbmNsZHVlIHRvIHJlbW92ZSBsaXN0ZW5lcnMgZm9yIGFuIGV2ZW50IHR5cGUuXG4gKiBAcHJpdmF0ZVxuICovXG52anMub2ZmID0gZnVuY3Rpb24oZWxlbSwgdHlwZSwgZm4pIHtcbiAgLy8gRG9uJ3Qgd2FudCB0byBhZGQgYSBjYWNoZSBvYmplY3QgdGhyb3VnaCBnZXREYXRhIGlmIG5vdCBuZWVkZWRcbiAgaWYgKCF2anMuaGFzRGF0YShlbGVtKSkgcmV0dXJuO1xuXG4gIHZhciBkYXRhID0gdmpzLmdldERhdGEoZWxlbSk7XG5cbiAgLy8gSWYgbm8gZXZlbnRzIGV4aXN0LCBub3RoaW5nIHRvIHVuYmluZFxuICBpZiAoIWRhdGEuaGFuZGxlcnMpIHsgcmV0dXJuOyB9XG5cbiAgLy8gVXRpbGl0eSBmdW5jdGlvblxuICB2YXIgcmVtb3ZlVHlwZSA9IGZ1bmN0aW9uKHQpe1xuICAgICBkYXRhLmhhbmRsZXJzW3RdID0gW107XG4gICAgIHZqcy5jbGVhblVwRXZlbnRzKGVsZW0sdCk7XG4gIH07XG5cbiAgLy8gQXJlIHdlIHJlbW92aW5nIGFsbCBib3VuZCBldmVudHM/XG4gIGlmICghdHlwZSkge1xuICAgIGZvciAodmFyIHQgaW4gZGF0YS5oYW5kbGVycykgcmVtb3ZlVHlwZSh0KTtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgaGFuZGxlcnMgPSBkYXRhLmhhbmRsZXJzW3R5cGVdO1xuXG4gIC8vIElmIG5vIGhhbmRsZXJzIGV4aXN0LCBub3RoaW5nIHRvIHVuYmluZFxuICBpZiAoIWhhbmRsZXJzKSByZXR1cm47XG5cbiAgLy8gSWYgbm8gbGlzdGVuZXIgd2FzIHByb3ZpZGVkLCByZW1vdmUgYWxsIGxpc3RlbmVycyBmb3IgdHlwZVxuICBpZiAoIWZuKSB7XG4gICAgcmVtb3ZlVHlwZSh0eXBlKTtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBXZSdyZSBvbmx5IHJlbW92aW5nIGEgc2luZ2xlIGhhbmRsZXJcbiAgaWYgKGZuLmd1aWQpIHtcbiAgICBmb3IgKHZhciBuID0gMDsgbiA8IGhhbmRsZXJzLmxlbmd0aDsgbisrKSB7XG4gICAgICBpZiAoaGFuZGxlcnNbbl0uZ3VpZCA9PT0gZm4uZ3VpZCkge1xuICAgICAgICBoYW5kbGVycy5zcGxpY2Uobi0tLCAxKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB2anMuY2xlYW5VcEV2ZW50cyhlbGVtLCB0eXBlKTtcbn07XG5cbi8qKlxuICogQ2xlYW4gdXAgdGhlIGxpc3RlbmVyIGNhY2hlIGFuZCBkaXNwYXRjaGVyc1xuICogQHBhcmFtICB7RWxlbWVudHxPYmplY3R9IGVsZW0gRWxlbWVudCB0byBjbGVhbiB1cFxuICogQHBhcmFtICB7U3RyaW5nfSB0eXBlIFR5cGUgb2YgZXZlbnQgdG8gY2xlYW4gdXBcbiAqIEBwcml2YXRlXG4gKi9cbnZqcy5jbGVhblVwRXZlbnRzID0gZnVuY3Rpb24oZWxlbSwgdHlwZSkge1xuICB2YXIgZGF0YSA9IHZqcy5nZXREYXRhKGVsZW0pO1xuXG4gIC8vIFJlbW92ZSB0aGUgZXZlbnRzIG9mIGEgcGFydGljdWxhciB0eXBlIGlmIHRoZXJlIGFyZSBub25lIGxlZnRcbiAgaWYgKGRhdGEuaGFuZGxlcnNbdHlwZV0ubGVuZ3RoID09PSAwKSB7XG4gICAgZGVsZXRlIGRhdGEuaGFuZGxlcnNbdHlwZV07XG4gICAgLy8gZGF0YS5oYW5kbGVyc1t0eXBlXSA9IG51bGw7XG4gICAgLy8gU2V0dGluZyB0byBudWxsIHdhcyBjYXVzaW5nIGFuIGVycm9yIHdpdGggZGF0YS5oYW5kbGVyc1xuXG4gICAgLy8gUmVtb3ZlIHRoZSBtZXRhLWhhbmRsZXIgZnJvbSB0aGUgZWxlbWVudFxuICAgIGlmIChkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKSB7XG4gICAgICBlbGVtLnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgZGF0YS5kaXNwYXRjaGVyLCBmYWxzZSk7XG4gICAgfSBlbHNlIGlmIChkb2N1bWVudC5kZXRhY2hFdmVudCkge1xuICAgICAgZWxlbS5kZXRhY2hFdmVudCgnb24nICsgdHlwZSwgZGF0YS5kaXNwYXRjaGVyKTtcbiAgICB9XG4gIH1cblxuICAvLyBSZW1vdmUgdGhlIGV2ZW50cyBvYmplY3QgaWYgdGhlcmUgYXJlIG5vIHR5cGVzIGxlZnRcbiAgaWYgKHZqcy5pc0VtcHR5KGRhdGEuaGFuZGxlcnMpKSB7XG4gICAgZGVsZXRlIGRhdGEuaGFuZGxlcnM7XG4gICAgZGVsZXRlIGRhdGEuZGlzcGF0Y2hlcjtcbiAgICBkZWxldGUgZGF0YS5kaXNhYmxlZDtcblxuICAgIC8vIGRhdGEuaGFuZGxlcnMgPSBudWxsO1xuICAgIC8vIGRhdGEuZGlzcGF0Y2hlciA9IG51bGw7XG4gICAgLy8gZGF0YS5kaXNhYmxlZCA9IG51bGw7XG4gIH1cblxuICAvLyBGaW5hbGx5IHJlbW92ZSB0aGUgZXhwYW5kbyBpZiB0aGVyZSBpcyBubyBkYXRhIGxlZnRcbiAgaWYgKHZqcy5pc0VtcHR5KGRhdGEpKSB7XG4gICAgdmpzLnJlbW92ZURhdGEoZWxlbSk7XG4gIH1cbn07XG5cbi8qKlxuICogRml4IGEgbmF0aXZlIGV2ZW50IHRvIGhhdmUgc3RhbmRhcmQgcHJvcGVydHkgdmFsdWVzXG4gKiBAcGFyYW0gIHtPYmplY3R9IGV2ZW50IEV2ZW50IG9iamVjdCB0byBmaXhcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqIEBwcml2YXRlXG4gKi9cbnZqcy5maXhFdmVudCA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cbiAgZnVuY3Rpb24gcmV0dXJuVHJ1ZSgpIHsgcmV0dXJuIHRydWU7IH1cbiAgZnVuY3Rpb24gcmV0dXJuRmFsc2UoKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIC8vIFRlc3QgaWYgZml4aW5nIHVwIGlzIG5lZWRlZFxuICAvLyBVc2VkIHRvIGNoZWNrIGlmICFldmVudC5zdG9wUHJvcGFnYXRpb24gaW5zdGVhZCBvZiBpc1Byb3BhZ2F0aW9uU3RvcHBlZFxuICAvLyBCdXQgbmF0aXZlIGV2ZW50cyByZXR1cm4gdHJ1ZSBmb3Igc3RvcFByb3BhZ2F0aW9uLCBidXQgZG9uJ3QgaGF2ZVxuICAvLyBvdGhlciBleHBlY3RlZCBtZXRob2RzIGxpa2UgaXNQcm9wYWdhdGlvblN0b3BwZWQuIFNlZW1zIHRvIGJlIGEgcHJvYmxlbVxuICAvLyB3aXRoIHRoZSBKYXZhc2NyaXB0IE5pbmphIGNvZGUuIFNvIHdlJ3JlIGp1c3Qgb3ZlcnJpZGluZyBhbGwgZXZlbnRzIG5vdy5cbiAgaWYgKCFldmVudCB8fCAhZXZlbnQuaXNQcm9wYWdhdGlvblN0b3BwZWQpIHtcbiAgICB2YXIgb2xkID0gZXZlbnQgfHwgd2luZG93LmV2ZW50O1xuXG4gICAgZXZlbnQgPSB7fTtcbiAgICAvLyBDbG9uZSB0aGUgb2xkIG9iamVjdCBzbyB0aGF0IHdlIGNhbiBtb2RpZnkgdGhlIHZhbHVlcyBldmVudCA9IHt9O1xuICAgIC8vIElFOCBEb2Vzbid0IGxpa2Ugd2hlbiB5b3UgbWVzcyB3aXRoIG5hdGl2ZSBldmVudCBwcm9wZXJ0aWVzXG4gICAgLy8gRmlyZWZveCByZXR1cm5zIGZhbHNlIGZvciBldmVudC5oYXNPd25Qcm9wZXJ0eSgndHlwZScpIGFuZCBvdGhlciBwcm9wc1xuICAgIC8vICB3aGljaCBtYWtlcyBjb3B5aW5nIG1vcmUgZGlmZmljdWx0LlxuICAgIC8vIFRPRE86IFByb2JhYmx5IGJlc3QgdG8gY3JlYXRlIGEgd2hpdGVsaXN0IG9mIGV2ZW50IHByb3BzXG4gICAgZm9yICh2YXIga2V5IGluIG9sZCkge1xuICAgICAgLy8gU2FmYXJpIDYuMC4zIHdhcm5zIHlvdSBpZiB5b3UgdHJ5IHRvIGNvcHkgZGVwcmVjYXRlZCBsYXllclgvWVxuICAgICAgaWYgKGtleSAhPT0gJ2xheWVyWCcgJiYga2V5ICE9PSAnbGF5ZXJZJykge1xuICAgICAgICBldmVudFtrZXldID0gb2xkW2tleV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVGhlIGV2ZW50IG9jY3VycmVkIG9uIHRoaXMgZWxlbWVudFxuICAgIGlmICghZXZlbnQudGFyZ2V0KSB7XG4gICAgICBldmVudC50YXJnZXQgPSBldmVudC5zcmNFbGVtZW50IHx8IGRvY3VtZW50O1xuICAgIH1cblxuICAgIC8vIEhhbmRsZSB3aGljaCBvdGhlciBlbGVtZW50IHRoZSBldmVudCBpcyByZWxhdGVkIHRvXG4gICAgZXZlbnQucmVsYXRlZFRhcmdldCA9IGV2ZW50LmZyb21FbGVtZW50ID09PSBldmVudC50YXJnZXQgP1xuICAgICAgZXZlbnQudG9FbGVtZW50IDpcbiAgICAgIGV2ZW50LmZyb21FbGVtZW50O1xuXG4gICAgLy8gU3RvcCB0aGUgZGVmYXVsdCBicm93c2VyIGFjdGlvblxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKG9sZC5wcmV2ZW50RGVmYXVsdCkge1xuICAgICAgICBvbGQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIH1cbiAgICAgIGV2ZW50LnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgICBldmVudC5pc0RlZmF1bHRQcmV2ZW50ZWQgPSByZXR1cm5UcnVlO1xuICAgIH07XG5cbiAgICBldmVudC5pc0RlZmF1bHRQcmV2ZW50ZWQgPSByZXR1cm5GYWxzZTtcblxuICAgIC8vIFN0b3AgdGhlIGV2ZW50IGZyb20gYnViYmxpbmdcbiAgICBldmVudC5zdG9wUHJvcGFnYXRpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAob2xkLnN0b3BQcm9wYWdhdGlvbikge1xuICAgICAgICBvbGQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICB9XG4gICAgICBldmVudC5jYW5jZWxCdWJibGUgPSB0cnVlO1xuICAgICAgZXZlbnQuaXNQcm9wYWdhdGlvblN0b3BwZWQgPSByZXR1cm5UcnVlO1xuICAgIH07XG5cbiAgICBldmVudC5pc1Byb3BhZ2F0aW9uU3RvcHBlZCA9IHJldHVybkZhbHNlO1xuXG4gICAgLy8gU3RvcCB0aGUgZXZlbnQgZnJvbSBidWJibGluZyBhbmQgZXhlY3V0aW5nIG90aGVyIGhhbmRsZXJzXG4gICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKG9sZC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24pIHtcbiAgICAgICAgb2xkLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICAgICAgfVxuICAgICAgZXZlbnQuaXNJbW1lZGlhdGVQcm9wYWdhdGlvblN0b3BwZWQgPSByZXR1cm5UcnVlO1xuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfTtcblxuICAgIGV2ZW50LmlzSW1tZWRpYXRlUHJvcGFnYXRpb25TdG9wcGVkID0gcmV0dXJuRmFsc2U7XG5cbiAgICAvLyBIYW5kbGUgbW91c2UgcG9zaXRpb25cbiAgICBpZiAoZXZlbnQuY2xpZW50WCAhPSBudWxsKSB7XG4gICAgICB2YXIgZG9jID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCBib2R5ID0gZG9jdW1lbnQuYm9keTtcblxuICAgICAgZXZlbnQucGFnZVggPSBldmVudC5jbGllbnRYICtcbiAgICAgICAgKGRvYyAmJiBkb2Muc2Nyb2xsTGVmdCB8fCBib2R5ICYmIGJvZHkuc2Nyb2xsTGVmdCB8fCAwKSAtXG4gICAgICAgIChkb2MgJiYgZG9jLmNsaWVudExlZnQgfHwgYm9keSAmJiBib2R5LmNsaWVudExlZnQgfHwgMCk7XG4gICAgICBldmVudC5wYWdlWSA9IGV2ZW50LmNsaWVudFkgK1xuICAgICAgICAoZG9jICYmIGRvYy5zY3JvbGxUb3AgfHwgYm9keSAmJiBib2R5LnNjcm9sbFRvcCB8fCAwKSAtXG4gICAgICAgIChkb2MgJiYgZG9jLmNsaWVudFRvcCB8fCBib2R5ICYmIGJvZHkuY2xpZW50VG9wIHx8IDApO1xuICAgIH1cblxuICAgIC8vIEhhbmRsZSBrZXkgcHJlc3Nlc1xuICAgIGV2ZW50LndoaWNoID0gZXZlbnQuY2hhckNvZGUgfHwgZXZlbnQua2V5Q29kZTtcblxuICAgIC8vIEZpeCBidXR0b24gZm9yIG1vdXNlIGNsaWNrczpcbiAgICAvLyAwID09IGxlZnQ7IDEgPT0gbWlkZGxlOyAyID09IHJpZ2h0XG4gICAgaWYgKGV2ZW50LmJ1dHRvbiAhPSBudWxsKSB7XG4gICAgICBldmVudC5idXR0b24gPSAoZXZlbnQuYnV0dG9uICYgMSA/IDAgOlxuICAgICAgICAoZXZlbnQuYnV0dG9uICYgNCA/IDEgOlxuICAgICAgICAgIChldmVudC5idXR0b24gJiAyID8gMiA6IDApKSk7XG4gICAgfVxuICB9XG5cbiAgLy8gUmV0dXJucyBmaXhlZC11cCBpbnN0YW5jZVxuICByZXR1cm4gZXZlbnQ7XG59O1xuXG4vKipcbiAqIFRyaWdnZXIgYW4gZXZlbnQgZm9yIGFuIGVsZW1lbnRcbiAqIEBwYXJhbSAge0VsZW1lbnR8T2JqZWN0fSBlbGVtICBFbGVtZW50IHRvIHRyaWdnZXIgYW4gZXZlbnQgb25cbiAqIEBwYXJhbSAge1N0cmluZ30gZXZlbnQgVHlwZSBvZiBldmVudCB0byB0cmlnZ2VyXG4gKiBAcHJpdmF0ZVxuICovXG52anMudHJpZ2dlciA9IGZ1bmN0aW9uKGVsZW0sIGV2ZW50KSB7XG4gIC8vIEZldGNoZXMgZWxlbWVudCBkYXRhIGFuZCBhIHJlZmVyZW5jZSB0byB0aGUgcGFyZW50IChmb3IgYnViYmxpbmcpLlxuICAvLyBEb24ndCB3YW50IHRvIGFkZCBhIGRhdGEgb2JqZWN0IHRvIGNhY2hlIGZvciBldmVyeSBwYXJlbnQsXG4gIC8vIHNvIGNoZWNraW5nIGhhc0RhdGEgZmlyc3QuXG4gIHZhciBlbGVtRGF0YSA9ICh2anMuaGFzRGF0YShlbGVtKSkgPyB2anMuZ2V0RGF0YShlbGVtKSA6IHt9O1xuICB2YXIgcGFyZW50ID0gZWxlbS5wYXJlbnROb2RlIHx8IGVsZW0ub3duZXJEb2N1bWVudDtcbiAgICAgIC8vIHR5cGUgPSBldmVudC50eXBlIHx8IGV2ZW50LFxuICAgICAgLy8gaGFuZGxlcjtcblxuICAvLyBJZiBhbiBldmVudCBuYW1lIHdhcyBwYXNzZWQgYXMgYSBzdHJpbmcsIGNyZWF0ZXMgYW4gZXZlbnQgb3V0IG9mIGl0XG4gIGlmICh0eXBlb2YgZXZlbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgZXZlbnQgPSB7IHR5cGU6ZXZlbnQsIHRhcmdldDplbGVtIH07XG4gIH1cbiAgLy8gTm9ybWFsaXplcyB0aGUgZXZlbnQgcHJvcGVydGllcy5cbiAgZXZlbnQgPSB2anMuZml4RXZlbnQoZXZlbnQpO1xuXG4gIC8vIElmIHRoZSBwYXNzZWQgZWxlbWVudCBoYXMgYSBkaXNwYXRjaGVyLCBleGVjdXRlcyB0aGUgZXN0YWJsaXNoZWQgaGFuZGxlcnMuXG4gIGlmIChlbGVtRGF0YS5kaXNwYXRjaGVyKSB7XG4gICAgZWxlbURhdGEuZGlzcGF0Y2hlci5jYWxsKGVsZW0sIGV2ZW50KTtcbiAgfVxuXG4gIC8vIFVubGVzcyBleHBsaWNpdGx5IHN0b3BwZWQgb3IgdGhlIGV2ZW50IGRvZXMgbm90IGJ1YmJsZSAoZS5nLiBtZWRpYSBldmVudHMpXG4gICAgLy8gcmVjdXJzaXZlbHkgY2FsbHMgdGhpcyBmdW5jdGlvbiB0byBidWJibGUgdGhlIGV2ZW50IHVwIHRoZSBET00uXG4gICAgaWYgKHBhcmVudCAmJiAhZXZlbnQuaXNQcm9wYWdhdGlvblN0b3BwZWQoKSAmJiBldmVudC5idWJibGVzICE9PSBmYWxzZSkge1xuICAgIHZqcy50cmlnZ2VyKHBhcmVudCwgZXZlbnQpO1xuXG4gIC8vIElmIGF0IHRoZSB0b3Agb2YgdGhlIERPTSwgdHJpZ2dlcnMgdGhlIGRlZmF1bHQgYWN0aW9uIHVubGVzcyBkaXNhYmxlZC5cbiAgfSBlbHNlIGlmICghcGFyZW50ICYmICFldmVudC5pc0RlZmF1bHRQcmV2ZW50ZWQoKSkge1xuICAgIHZhciB0YXJnZXREYXRhID0gdmpzLmdldERhdGEoZXZlbnQudGFyZ2V0KTtcblxuICAgIC8vIENoZWNrcyBpZiB0aGUgdGFyZ2V0IGhhcyBhIGRlZmF1bHQgYWN0aW9uIGZvciB0aGlzIGV2ZW50LlxuICAgIGlmIChldmVudC50YXJnZXRbZXZlbnQudHlwZV0pIHtcbiAgICAgIC8vIFRlbXBvcmFyaWx5IGRpc2FibGVzIGV2ZW50IGRpc3BhdGNoaW5nIG9uIHRoZSB0YXJnZXQgYXMgd2UgaGF2ZSBhbHJlYWR5IGV4ZWN1dGVkIHRoZSBoYW5kbGVyLlxuICAgICAgdGFyZ2V0RGF0YS5kaXNhYmxlZCA9IHRydWU7XG4gICAgICAvLyBFeGVjdXRlcyB0aGUgZGVmYXVsdCBhY3Rpb24uXG4gICAgICBpZiAodHlwZW9mIGV2ZW50LnRhcmdldFtldmVudC50eXBlXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBldmVudC50YXJnZXRbZXZlbnQudHlwZV0oKTtcbiAgICAgIH1cbiAgICAgIC8vIFJlLWVuYWJsZXMgZXZlbnQgZGlzcGF0Y2hpbmcuXG4gICAgICB0YXJnZXREYXRhLmRpc2FibGVkID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgLy8gSW5mb3JtIHRoZSB0cmlnZ2VyZXIgaWYgdGhlIGRlZmF1bHQgd2FzIHByZXZlbnRlZCBieSByZXR1cm5pbmcgZmFsc2VcbiAgcmV0dXJuICFldmVudC5pc0RlZmF1bHRQcmV2ZW50ZWQoKTtcbiAgLyogT3JpZ2luYWwgdmVyc2lvbiBvZiBqcyBuaW5qYSBldmVudHMgd2Fzbid0IGNvbXBsZXRlLlxuICAgKiBXZSd2ZSBzaW5jZSB1cGRhdGVkIHRvIHRoZSBsYXRlc3QgdmVyc2lvbiwgYnV0IGtlZXBpbmcgdGhpcyBhcm91bmRcbiAgICogZm9yIG5vdyBqdXN0IGluIGNhc2UuXG4gICAqL1xuICAvLyAvLyBBZGRlZCBpbiBhdHRpb24gdG8gYm9vay4gQm9vayBjb2RlIHdhcyBicm9rZS5cbiAgLy8gZXZlbnQgPSB0eXBlb2YgZXZlbnQgPT09ICdvYmplY3QnID9cbiAgLy8gICBldmVudFt2anMuZXhwYW5kb10gP1xuICAvLyAgICAgZXZlbnQgOlxuICAvLyAgICAgbmV3IHZqcy5FdmVudCh0eXBlLCBldmVudCkgOlxuICAvLyAgIG5ldyB2anMuRXZlbnQodHlwZSk7XG5cbiAgLy8gZXZlbnQudHlwZSA9IHR5cGU7XG4gIC8vIGlmIChoYW5kbGVyKSB7XG4gIC8vICAgaGFuZGxlci5jYWxsKGVsZW0sIGV2ZW50KTtcbiAgLy8gfVxuXG4gIC8vIC8vIENsZWFuIHVwIHRoZSBldmVudCBpbiBjYXNlIGl0IGlzIGJlaW5nIHJldXNlZFxuICAvLyBldmVudC5yZXN1bHQgPSB1bmRlZmluZWQ7XG4gIC8vIGV2ZW50LnRhcmdldCA9IGVsZW07XG59O1xuXG4vKipcbiAqIFRyaWdnZXIgYSBsaXN0ZW5lciBvbmx5IG9uY2UgZm9yIGFuIGV2ZW50XG4gKiBAcGFyYW0gIHtFbGVtZW50fE9iamVjdH0gICBlbGVtIEVsZW1lbnQgb3Igb2JqZWN0IHRvXG4gKiBAcGFyYW0gIHtTdHJpbmd9ICAgdHlwZVxuICogQHBhcmFtICB7RnVuY3Rpb259IGZuXG4gKiBAcHJpdmF0ZVxuICovXG52anMub25lID0gZnVuY3Rpb24oZWxlbSwgdHlwZSwgZm4pIHtcbiAgdmFyIGZ1bmMgPSBmdW5jdGlvbigpe1xuICAgIHZqcy5vZmYoZWxlbSwgdHlwZSwgZnVuYyk7XG4gICAgZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfTtcbiAgZnVuYy5ndWlkID0gZm4uZ3VpZCA9IGZuLmd1aWQgfHwgdmpzLmd1aWQrKztcbiAgdmpzLm9uKGVsZW0sIHR5cGUsIGZ1bmMpO1xufTtcbnZhciBoYXNPd25Qcm9wID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqXG4gKiBDcmVhdGVzIGFuIGVsZW1lbnQgYW5kIGFwcGxpZXMgcHJvcGVydGllcy5cbiAqIEBwYXJhbSAge1N0cmluZz19IHRhZ05hbWUgICAgTmFtZSBvZiB0YWcgdG8gYmUgY3JlYXRlZC5cbiAqIEBwYXJhbSAge09iamVjdD19IHByb3BlcnRpZXMgRWxlbWVudCBwcm9wZXJ0aWVzIHRvIGJlIGFwcGxpZWQuXG4gKiBAcmV0dXJuIHtFbGVtZW50fVxuICogQHByaXZhdGVcbiAqL1xudmpzLmNyZWF0ZUVsID0gZnVuY3Rpb24odGFnTmFtZSwgcHJvcGVydGllcyl7XG4gIHZhciBlbCwgcHJvcE5hbWU7XG5cbiAgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZ05hbWUgfHwgJ2RpdicpO1xuXG4gIGZvciAocHJvcE5hbWUgaW4gcHJvcGVydGllcyl7XG4gICAgaWYgKGhhc093blByb3AuY2FsbChwcm9wZXJ0aWVzLCBwcm9wTmFtZSkpIHtcbiAgICAgIC8vZWxbcHJvcE5hbWVdID0gcHJvcGVydGllc1twcm9wTmFtZV07XG4gICAgICAvLyBOb3QgcmVtZW1iZXJpbmcgd2h5IHdlIHdlcmUgY2hlY2tpbmcgZm9yIGRhc2hcbiAgICAgIC8vIGJ1dCB1c2luZyBzZXRBdHRyaWJ1dGUgbWVhbnMgeW91IGhhdmUgdG8gdXNlIGdldEF0dHJpYnV0ZVxuXG4gICAgICAvLyBUaGUgY2hlY2sgZm9yIGRhc2ggY2hlY2tzIGZvciB0aGUgYXJpYS0qIGF0dHJpYnV0ZXMsIGxpa2UgYXJpYS1sYWJlbCwgYXJpYS12YWx1ZW1pbi5cbiAgICAgIC8vIFRoZSBhZGRpdGlvbmFsIGNoZWNrIGZvciBcInJvbGVcIiBpcyBiZWNhdXNlIHRoZSBkZWZhdWx0IG1ldGhvZCBmb3IgYWRkaW5nIGF0dHJpYnV0ZXMgZG9lcyBub3RcbiAgICAgIC8vIGFkZCB0aGUgYXR0cmlidXRlIFwicm9sZVwiLiBNeSBndWVzcyBpcyBiZWNhdXNlIGl0J3Mgbm90IGEgdmFsaWQgYXR0cmlidXRlIGluIHNvbWUgbmFtZXNwYWNlcywgYWx0aG91Z2hcbiAgICAgIC8vIGJyb3dzZXJzIGhhbmRsZSB0aGUgYXR0cmlidXRlIGp1c3QgZmluZS4gVGhlIFczQyBhbGxvd3MgZm9yIGFyaWEtKiBhdHRyaWJ1dGVzIHRvIGJlIHVzZWQgaW4gcHJlLUhUTUw1IGRvY3MuXG4gICAgICAvLyBodHRwOi8vd3d3LnczLm9yZy9UUi93YWktYXJpYS1wcmltZXIvI2FyaWFodG1sLiBVc2luZyBzZXRBdHRyaWJ1dGUgZ2V0cyBhcm91bmQgdGhpcyBwcm9ibGVtLlxuXG4gICAgICAgaWYgKHByb3BOYW1lLmluZGV4T2YoJ2FyaWEtJykgIT09IC0xIHx8IHByb3BOYW1lPT0ncm9sZScpIHtcbiAgICAgICAgIGVsLnNldEF0dHJpYnV0ZShwcm9wTmFtZSwgcHJvcGVydGllc1twcm9wTmFtZV0pO1xuICAgICAgIH0gZWxzZSB7XG4gICAgICAgICBlbFtwcm9wTmFtZV0gPSBwcm9wZXJ0aWVzW3Byb3BOYW1lXTtcbiAgICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBlbDtcbn07XG5cbi8qKlxuICogVXBwZXJjYXNlIHRoZSBmaXJzdCBsZXR0ZXIgb2YgYSBzdHJpbmdcbiAqIEBwYXJhbSAge1N0cmluZ30gc3RyaW5nIFN0cmluZyB0byBiZSB1cHBlcmNhc2VkXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAcHJpdmF0ZVxuICovXG52anMuY2FwaXRhbGl6ZSA9IGZ1bmN0aW9uKHN0cmluZyl7XG4gIHJldHVybiBzdHJpbmcuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHJpbmcuc2xpY2UoMSk7XG59O1xuXG4vKipcbiAqIE9iamVjdCBmdW5jdGlvbnMgY29udGFpbmVyXG4gKiBAdHlwZSB7T2JqZWN0fVxuICogQHByaXZhdGVcbiAqL1xudmpzLm9iaiA9IHt9O1xuXG4vKipcbiAqIE9iamVjdC5jcmVhdGUgc2hpbSBmb3IgcHJvdG90eXBhbCBpbmhlcml0YW5jZVxuICpcbiAqIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvT2JqZWN0L2NyZWF0ZVxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtICB7T2JqZWN0fSAgIG9iaiBPYmplY3QgdG8gdXNlIGFzIHByb3RvdHlwZVxuICogQHByaXZhdGVcbiAqL1xuIHZqcy5vYmouY3JlYXRlID0gT2JqZWN0LmNyZWF0ZSB8fCBmdW5jdGlvbihvYmope1xuICAvL0NyZWF0ZSBhIG5ldyBmdW5jdGlvbiBjYWxsZWQgJ0YnIHdoaWNoIGlzIGp1c3QgYW4gZW1wdHkgb2JqZWN0LlxuICBmdW5jdGlvbiBGKCkge31cblxuICAvL3RoZSBwcm90b3R5cGUgb2YgdGhlICdGJyBmdW5jdGlvbiBzaG91bGQgcG9pbnQgdG8gdGhlXG4gIC8vcGFyYW1ldGVyIG9mIHRoZSBhbm9ueW1vdXMgZnVuY3Rpb24uXG4gIEYucHJvdG90eXBlID0gb2JqO1xuXG4gIC8vY3JlYXRlIGEgbmV3IGNvbnN0cnVjdG9yIGZ1bmN0aW9uIGJhc2VkIG9mZiBvZiB0aGUgJ0YnIGZ1bmN0aW9uLlxuICByZXR1cm4gbmV3IEYoKTtcbn07XG5cbi8qKlxuICogTG9vcCB0aHJvdWdoIGVhY2ggcHJvcGVydHkgaW4gYW4gb2JqZWN0IGFuZCBjYWxsIGEgZnVuY3Rpb25cbiAqIHdob3NlIGFyZ3VtZW50cyBhcmUgKGtleSx2YWx1ZSlcbiAqIEBwYXJhbSAge09iamVjdH0gICBvYmogT2JqZWN0IG9mIHByb3BlcnRpZXNcbiAqIEBwYXJhbSAge0Z1bmN0aW9ufSBmbiAgRnVuY3Rpb24gdG8gYmUgY2FsbGVkIG9uIGVhY2ggcHJvcGVydHkuXG4gKiBAdGhpcyB7Kn1cbiAqIEBwcml2YXRlXG4gKi9cbnZqcy5vYmouZWFjaCA9IGZ1bmN0aW9uKG9iaiwgZm4sIGNvbnRleHQpe1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgaWYgKGhhc093blByb3AuY2FsbChvYmosIGtleSkpIHtcbiAgICAgIGZuLmNhbGwoY29udGV4dCB8fCB0aGlzLCBrZXksIG9ialtrZXldKTtcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogTWVyZ2UgdHdvIG9iamVjdHMgdG9nZXRoZXIgYW5kIHJldHVybiB0aGUgb3JpZ2luYWwuXG4gKiBAcGFyYW0gIHtPYmplY3R9IG9iajFcbiAqIEBwYXJhbSAge09iamVjdH0gb2JqMlxuICogQHJldHVybiB7T2JqZWN0fVxuICogQHByaXZhdGVcbiAqL1xudmpzLm9iai5tZXJnZSA9IGZ1bmN0aW9uKG9iajEsIG9iajIpe1xuICBpZiAoIW9iajIpIHsgcmV0dXJuIG9iajE7IH1cbiAgZm9yICh2YXIga2V5IGluIG9iajIpe1xuICAgIGlmIChoYXNPd25Qcm9wLmNhbGwob2JqMiwga2V5KSkge1xuICAgICAgb2JqMVtrZXldID0gb2JqMltrZXldO1xuICAgIH1cbiAgfVxuICByZXR1cm4gb2JqMTtcbn07XG5cbi8qKlxuICogTWVyZ2UgdHdvIG9iamVjdHMsIGFuZCBtZXJnZSBhbnkgcHJvcGVydGllcyB0aGF0IGFyZSBvYmplY3RzXG4gKiBpbnN0ZWFkIG9mIGp1c3Qgb3ZlcndyaXRpbmcgb25lLiBVc2VzIHRvIG1lcmdlIG9wdGlvbnMgaGFzaGVzXG4gKiB3aGVyZSBkZWVwZXIgZGVmYXVsdCBzZXR0aW5ncyBhcmUgaW1wb3J0YW50LlxuICogQHBhcmFtICB7T2JqZWN0fSBvYmoxIE9iamVjdCB0byBvdmVycmlkZVxuICogQHBhcmFtICB7T2JqZWN0fSBvYmoyIE92ZXJyaWRpbmcgb2JqZWN0XG4gKiBAcmV0dXJuIHtPYmplY3R9ICAgICAgTmV3IG9iamVjdC4gT2JqMSBhbmQgT2JqMiB3aWxsIGJlIHVudG91Y2hlZC5cbiAqIEBwcml2YXRlXG4gKi9cbnZqcy5vYmouZGVlcE1lcmdlID0gZnVuY3Rpb24ob2JqMSwgb2JqMil7XG4gIHZhciBrZXksIHZhbDEsIHZhbDI7XG5cbiAgLy8gbWFrZSBhIGNvcHkgb2Ygb2JqMSBzbyB3ZSdyZSBub3Qgb3Zld3JpdGluZyBvcmlnaW5hbCB2YWx1ZXMuXG4gIC8vIGxpa2UgcHJvdG90eXBlLm9wdGlvbnNfIGFuZCBhbGwgc3ViIG9wdGlvbnMgb2JqZWN0c1xuICBvYmoxID0gdmpzLm9iai5jb3B5KG9iajEpO1xuXG4gIGZvciAoa2V5IGluIG9iajIpe1xuICAgIGlmIChoYXNPd25Qcm9wLmNhbGwob2JqMiwga2V5KSkge1xuICAgICAgdmFsMSA9IG9iajFba2V5XTtcbiAgICAgIHZhbDIgPSBvYmoyW2tleV07XG5cbiAgICAgIC8vIENoZWNrIGlmIGJvdGggcHJvcGVydGllcyBhcmUgcHVyZSBvYmplY3RzIGFuZCBkbyBhIGRlZXAgbWVyZ2UgaWYgc29cbiAgICAgIGlmICh2anMub2JqLmlzUGxhaW4odmFsMSkgJiYgdmpzLm9iai5pc1BsYWluKHZhbDIpKSB7XG4gICAgICAgIG9iajFba2V5XSA9IHZqcy5vYmouZGVlcE1lcmdlKHZhbDEsIHZhbDIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb2JqMVtrZXldID0gb2JqMltrZXldO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gb2JqMTtcbn07XG5cbi8qKlxuICogTWFrZSBhIGNvcHkgb2YgdGhlIHN1cHBsaWVkIG9iamVjdFxuICogQHBhcmFtICB7T2JqZWN0fSBvYmogT2JqZWN0IHRvIGNvcHlcbiAqIEByZXR1cm4ge09iamVjdH0gICAgIENvcHkgb2Ygb2JqZWN0XG4gKiBAcHJpdmF0ZVxuICovXG52anMub2JqLmNvcHkgPSBmdW5jdGlvbihvYmope1xuICByZXR1cm4gdmpzLm9iai5tZXJnZSh7fSwgb2JqKTtcbn07XG5cbi8qKlxuICogQ2hlY2sgaWYgYW4gb2JqZWN0IGlzIHBsYWluLCBhbmQgbm90IGEgZG9tIG5vZGUgb3IgYW55IG9iamVjdCBzdWItaW5zdGFuY2VcbiAqIEBwYXJhbSAge09iamVjdH0gb2JqIE9iamVjdCB0byBjaGVja1xuICogQHJldHVybiB7Qm9vbGVhbn0gICAgIFRydWUgaWYgcGxhaW4sIGZhbHNlIG90aGVyd2lzZVxuICogQHByaXZhdGVcbiAqL1xudmpzLm9iai5pc1BsYWluID0gZnVuY3Rpb24ob2JqKXtcbiAgcmV0dXJuICEhb2JqXG4gICAgJiYgdHlwZW9mIG9iaiA9PT0gJ29iamVjdCdcbiAgICAmJiBvYmoudG9TdHJpbmcoKSA9PT0gJ1tvYmplY3QgT2JqZWN0XSdcbiAgICAmJiBvYmouY29uc3RydWN0b3IgPT09IE9iamVjdDtcbn07XG5cbi8qKlxuICogQmluZCAoYS5rLmEgcHJveHkgb3IgQ29udGV4dCkuIEEgc2ltcGxlIG1ldGhvZCBmb3IgY2hhbmdpbmcgdGhlIGNvbnRleHQgb2YgYSBmdW5jdGlvblxuICAgSXQgYWxzbyBzdG9yZXMgYSB1bmlxdWUgaWQgb24gdGhlIGZ1bmN0aW9uIHNvIGl0IGNhbiBiZSBlYXNpbHkgcmVtb3ZlZCBmcm9tIGV2ZW50c1xuICogQHBhcmFtICB7Kn0gICBjb250ZXh0IFRoZSBvYmplY3QgdG8gYmluZCBhcyBzY29wZVxuICogQHBhcmFtICB7RnVuY3Rpb259IGZuICAgICAgVGhlIGZ1bmN0aW9uIHRvIGJlIGJvdW5kIHRvIGEgc2NvcGVcbiAqIEBwYXJhbSAge051bWJlcj19ICAgdWlkICAgICBBbiBvcHRpb25hbCB1bmlxdWUgSUQgZm9yIHRoZSBmdW5jdGlvbiB0byBiZSBzZXRcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICogQHByaXZhdGVcbiAqL1xudmpzLmJpbmQgPSBmdW5jdGlvbihjb250ZXh0LCBmbiwgdWlkKSB7XG4gIC8vIE1ha2Ugc3VyZSB0aGUgZnVuY3Rpb24gaGFzIGEgdW5pcXVlIElEXG4gIGlmICghZm4uZ3VpZCkgeyBmbi5ndWlkID0gdmpzLmd1aWQrKzsgfVxuXG4gIC8vIENyZWF0ZSB0aGUgbmV3IGZ1bmN0aW9uIHRoYXQgY2hhbmdlcyB0aGUgY29udGV4dFxuICB2YXIgcmV0ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGZuLmFwcGx5KGNvbnRleHQsIGFyZ3VtZW50cyk7XG4gIH07XG5cbiAgLy8gQWxsb3cgZm9yIHRoZSBhYmlsaXR5IHRvIGluZGl2aWR1YWxpemUgdGhpcyBmdW5jdGlvblxuICAvLyBOZWVkZWQgaW4gdGhlIGNhc2Ugd2hlcmUgbXVsdGlwbGUgb2JqZWN0cyBtaWdodCBzaGFyZSB0aGUgc2FtZSBwcm90b3R5cGVcbiAgLy8gSUYgYm90aCBpdGVtcyBhZGQgYW4gZXZlbnQgbGlzdGVuZXIgd2l0aCB0aGUgc2FtZSBmdW5jdGlvbiwgdGhlbiB5b3UgdHJ5IHRvIHJlbW92ZSBqdXN0IG9uZVxuICAvLyBpdCB3aWxsIHJlbW92ZSBib3RoIGJlY2F1c2UgdGhleSBib3RoIGhhdmUgdGhlIHNhbWUgZ3VpZC5cbiAgLy8gd2hlbiB1c2luZyB0aGlzLCB5b3UgbmVlZCB0byB1c2UgdGhlIGJpbmQgbWV0aG9kIHdoZW4geW91IHJlbW92ZSB0aGUgbGlzdGVuZXIgYXMgd2VsbC5cbiAgLy8gY3VycmVudGx5IHVzZWQgaW4gdGV4dCB0cmFja3NcbiAgcmV0Lmd1aWQgPSAodWlkKSA/IHVpZCArICdfJyArIGZuLmd1aWQgOiBmbi5ndWlkO1xuXG4gIHJldHVybiByZXQ7XG59O1xuXG4vKipcbiAqIEVsZW1lbnQgRGF0YSBTdG9yZS4gQWxsb3dzIGZvciBiaW5kaW5nIGRhdGEgdG8gYW4gZWxlbWVudCB3aXRob3V0IHB1dHRpbmcgaXQgZGlyZWN0bHkgb24gdGhlIGVsZW1lbnQuXG4gKiBFeC4gRXZlbnQgbGlzdG5lcmVzIGFyZSBzdG9yZWQgaGVyZS5cbiAqIChhbHNvIGZyb20ganNuaW5qYS5jb20sIHNsaWdodGx5IG1vZGlmaWVkIGFuZCB1cGRhdGVkIGZvciBjbG9zdXJlIGNvbXBpbGVyKVxuICogQHR5cGUge09iamVjdH1cbiAqIEBwcml2YXRlXG4gKi9cbnZqcy5jYWNoZSA9IHt9O1xuXG4vKipcbiAqIFVuaXF1ZSBJRCBmb3IgYW4gZWxlbWVudCBvciBmdW5jdGlvblxuICogQHR5cGUge051bWJlcn1cbiAqIEBwcml2YXRlXG4gKi9cbnZqcy5ndWlkID0gMTtcblxuLyoqXG4gKiBVbmlxdWUgYXR0cmlidXRlIG5hbWUgdG8gc3RvcmUgYW4gZWxlbWVudCdzIGd1aWQgaW5cbiAqIEB0eXBlIHtTdHJpbmd9XG4gKiBAY29uc3RhbnRcbiAqIEBwcml2YXRlXG4gKi9cbnZqcy5leHBhbmRvID0gJ3ZkYXRhJyArIChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG5cbi8qKlxuICogUmV0dXJucyB0aGUgY2FjaGUgb2JqZWN0IHdoZXJlIGRhdGEgZm9yIGFuIGVsZW1lbnQgaXMgc3RvcmVkXG4gKiBAcGFyYW0gIHtFbGVtZW50fSBlbCBFbGVtZW50IHRvIHN0b3JlIGRhdGEgZm9yLlxuICogQHJldHVybiB7T2JqZWN0fVxuICogQHByaXZhdGVcbiAqL1xudmpzLmdldERhdGEgPSBmdW5jdGlvbihlbCl7XG4gIHZhciBpZCA9IGVsW3Zqcy5leHBhbmRvXTtcbiAgaWYgKCFpZCkge1xuICAgIGlkID0gZWxbdmpzLmV4cGFuZG9dID0gdmpzLmd1aWQrKztcbiAgICB2anMuY2FjaGVbaWRdID0ge307XG4gIH1cbiAgcmV0dXJuIHZqcy5jYWNoZVtpZF07XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIGNhY2hlIG9iamVjdCB3aGVyZSBkYXRhIGZvciBhbiBlbGVtZW50IGlzIHN0b3JlZFxuICogQHBhcmFtICB7RWxlbWVudH0gZWwgRWxlbWVudCB0byBzdG9yZSBkYXRhIGZvci5cbiAqIEByZXR1cm4ge09iamVjdH1cbiAqIEBwcml2YXRlXG4gKi9cbnZqcy5oYXNEYXRhID0gZnVuY3Rpb24oZWwpe1xuICB2YXIgaWQgPSBlbFt2anMuZXhwYW5kb107XG4gIHJldHVybiAhKCFpZCB8fCB2anMuaXNFbXB0eSh2anMuY2FjaGVbaWRdKSk7XG59O1xuXG4vKipcbiAqIERlbGV0ZSBkYXRhIGZvciB0aGUgZWxlbWVudCBmcm9tIHRoZSBjYWNoZSBhbmQgdGhlIGd1aWQgYXR0ciBmcm9tIGdldEVsZW1lbnRCeUlkXG4gKiBAcGFyYW0gIHtFbGVtZW50fSBlbCBSZW1vdmUgZGF0YSBmb3IgYW4gZWxlbWVudFxuICogQHByaXZhdGVcbiAqL1xudmpzLnJlbW92ZURhdGEgPSBmdW5jdGlvbihlbCl7XG4gIHZhciBpZCA9IGVsW3Zqcy5leHBhbmRvXTtcbiAgaWYgKCFpZCkgeyByZXR1cm47IH1cbiAgLy8gUmVtb3ZlIGFsbCBzdG9yZWQgZGF0YVxuICAvLyBDaGFuZ2VkIHRvID0gbnVsbFxuICAvLyBodHRwOi8vY29kaW5nLnNtYXNoaW5nbWFnYXppbmUuY29tLzIwMTIvMTEvMDUvd3JpdGluZy1mYXN0LW1lbW9yeS1lZmZpY2llbnQtamF2YXNjcmlwdC9cbiAgLy8gdmpzLmNhY2hlW2lkXSA9IG51bGw7XG4gIGRlbGV0ZSB2anMuY2FjaGVbaWRdO1xuXG4gIC8vIFJlbW92ZSB0aGUgZXhwYW5kbyBwcm9wZXJ0eSBmcm9tIHRoZSBET00gbm9kZVxuICB0cnkge1xuICAgIGRlbGV0ZSBlbFt2anMuZXhwYW5kb107XG4gIH0gY2F0Y2goZSkge1xuICAgIGlmIChlbC5yZW1vdmVBdHRyaWJ1dGUpIHtcbiAgICAgIGVsLnJlbW92ZUF0dHJpYnV0ZSh2anMuZXhwYW5kbyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIElFIGRvZXNuJ3QgYXBwZWFyIHRvIHN1cHBvcnQgcmVtb3ZlQXR0cmlidXRlIG9uIHRoZSBkb2N1bWVudCBlbGVtZW50XG4gICAgICBlbFt2anMuZXhwYW5kb10gPSBudWxsO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBDaGVjayBpZiBhbiBvYmplY3QgaXMgZW1wdHlcbiAqIEBwYXJhbSAge09iamVjdH0gIG9iaiBUaGUgb2JqZWN0IHRvIGNoZWNrIGZvciBlbXB0aW5lc3NcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAcHJpdmF0ZVxuICovXG52anMuaXNFbXB0eSA9IGZ1bmN0aW9uKG9iaikge1xuICBmb3IgKHZhciBwcm9wIGluIG9iaikge1xuICAgIC8vIElubHVkZSBudWxsIHByb3BlcnRpZXMgYXMgZW1wdHkuXG4gICAgaWYgKG9ialtwcm9wXSAhPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbi8qKlxuICogQWRkIGEgQ1NTIGNsYXNzIG5hbWUgdG8gYW4gZWxlbWVudFxuICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50ICAgIEVsZW1lbnQgdG8gYWRkIGNsYXNzIG5hbWUgdG9cbiAqIEBwYXJhbSB7U3RyaW5nfSBjbGFzc1RvQWRkIENsYXNzbmFtZSB0byBhZGRcbiAqIEBwcml2YXRlXG4gKi9cbnZqcy5hZGRDbGFzcyA9IGZ1bmN0aW9uKGVsZW1lbnQsIGNsYXNzVG9BZGQpe1xuICBpZiAoKCcgJytlbGVtZW50LmNsYXNzTmFtZSsnICcpLmluZGV4T2YoJyAnK2NsYXNzVG9BZGQrJyAnKSA9PSAtMSkge1xuICAgIGVsZW1lbnQuY2xhc3NOYW1lID0gZWxlbWVudC5jbGFzc05hbWUgPT09ICcnID8gY2xhc3NUb0FkZCA6IGVsZW1lbnQuY2xhc3NOYW1lICsgJyAnICsgY2xhc3NUb0FkZDtcbiAgfVxufTtcblxuLyoqXG4gKiBSZW1vdmUgYSBDU1MgY2xhc3MgbmFtZSBmcm9tIGFuIGVsZW1lbnRcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbWVudCAgICBFbGVtZW50IHRvIHJlbW92ZSBmcm9tIGNsYXNzIG5hbWVcbiAqIEBwYXJhbSB7U3RyaW5nfSBjbGFzc1RvQWRkIENsYXNzbmFtZSB0byByZW1vdmVcbiAqIEBwcml2YXRlXG4gKi9cbnZqcy5yZW1vdmVDbGFzcyA9IGZ1bmN0aW9uKGVsZW1lbnQsIGNsYXNzVG9SZW1vdmUpe1xuICB2YXIgY2xhc3NOYW1lcywgaTtcblxuICBpZiAoZWxlbWVudC5jbGFzc05hbWUuaW5kZXhPZihjbGFzc1RvUmVtb3ZlKSA9PSAtMSkgeyByZXR1cm47IH1cblxuICBjbGFzc05hbWVzID0gZWxlbWVudC5jbGFzc05hbWUuc3BsaXQoJyAnKTtcblxuICAvLyBubyBhcnIuaW5kZXhPZiBpbiBpZTgsIGFuZCB3ZSBkb24ndCB3YW50IHRvIGFkZCBhIGJpZyBzaGltXG4gIGZvciAoaSA9IGNsYXNzTmFtZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBpZiAoY2xhc3NOYW1lc1tpXSA9PT0gY2xhc3NUb1JlbW92ZSkge1xuICAgICAgY2xhc3NOYW1lcy5zcGxpY2UoaSwxKTtcbiAgICB9XG4gIH1cblxuICBlbGVtZW50LmNsYXNzTmFtZSA9IGNsYXNzTmFtZXMuam9pbignICcpO1xufTtcblxuLyoqXG4gKiBFbGVtZW50IGZvciB0ZXN0aW5nIGJyb3dzZXIgSFRNTDUgdmlkZW8gY2FwYWJpbGl0aWVzXG4gKiBAdHlwZSB7RWxlbWVudH1cbiAqIEBjb25zdGFudFxuICogQHByaXZhdGVcbiAqL1xudmpzLlRFU1RfVklEID0gdmpzLmNyZWF0ZUVsKCd2aWRlbycpO1xuXG4vKipcbiAqIFVzZXJhZ2VudCBmb3IgYnJvd3NlciB0ZXN0aW5nLlxuICogQHR5cGUge1N0cmluZ31cbiAqIEBjb25zdGFudFxuICogQHByaXZhdGVcbiAqL1xudmpzLlVTRVJfQUdFTlQgPSBuYXZpZ2F0b3IudXNlckFnZW50O1xuXG4vKipcbiAqIERldmljZSBpcyBhbiBpUGhvbmVcbiAqIEB0eXBlIHtCb29sZWFufVxuICogQGNvbnN0YW50XG4gKiBAcHJpdmF0ZVxuICovXG52anMuSVNfSVBIT05FID0gKC9pUGhvbmUvaSkudGVzdCh2anMuVVNFUl9BR0VOVCk7XG52anMuSVNfSVBBRCA9ICgvaVBhZC9pKS50ZXN0KHZqcy5VU0VSX0FHRU5UKTtcbnZqcy5JU19JUE9EID0gKC9pUG9kL2kpLnRlc3QodmpzLlVTRVJfQUdFTlQpO1xudmpzLklTX0lPUyA9IHZqcy5JU19JUEhPTkUgfHwgdmpzLklTX0lQQUQgfHwgdmpzLklTX0lQT0Q7XG5cbnZqcy5JT1NfVkVSU0lPTiA9IChmdW5jdGlvbigpe1xuICB2YXIgbWF0Y2ggPSB2anMuVVNFUl9BR0VOVC5tYXRjaCgvT1MgKFxcZCspXy9pKTtcbiAgaWYgKG1hdGNoICYmIG1hdGNoWzFdKSB7IHJldHVybiBtYXRjaFsxXTsgfVxufSkoKTtcblxudmpzLklTX0FORFJPSUQgPSAoL0FuZHJvaWQvaSkudGVzdCh2anMuVVNFUl9BR0VOVCk7XG52anMuQU5EUk9JRF9WRVJTSU9OID0gKGZ1bmN0aW9uKCkge1xuICAvLyBUaGlzIG1hdGNoZXMgQW5kcm9pZCBNYWpvci5NaW5vci5QYXRjaCB2ZXJzaW9uc1xuICAvLyBBTkRST0lEX1ZFUlNJT04gaXMgTWFqb3IuTWlub3IgYXMgYSBOdW1iZXIsIGlmIE1pbm9yIGlzbid0IGF2YWlsYWJsZSwgdGhlbiBvbmx5IE1ham9yIGlzIHJldHVybmVkXG4gIHZhciBtYXRjaCA9IHZqcy5VU0VSX0FHRU5ULm1hdGNoKC9BbmRyb2lkIChcXGQrKSg/OlxcLihcXGQrKSk/KD86XFwuKFxcZCspKSovaSksXG4gICAgbWFqb3IsXG4gICAgbWlub3I7XG5cbiAgaWYgKCFtYXRjaCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgbWFqb3IgPSBtYXRjaFsxXSAmJiBwYXJzZUZsb2F0KG1hdGNoWzFdKTtcbiAgbWlub3IgPSBtYXRjaFsyXSAmJiBwYXJzZUZsb2F0KG1hdGNoWzJdKTtcblxuICBpZiAobWFqb3IgJiYgbWlub3IpIHtcbiAgICByZXR1cm4gcGFyc2VGbG9hdChtYXRjaFsxXSArICcuJyArIG1hdGNoWzJdKTtcbiAgfSBlbHNlIGlmIChtYWpvcikge1xuICAgIHJldHVybiBtYWpvcjtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufSkoKTtcbi8vIE9sZCBBbmRyb2lkIGlzIGRlZmluZWQgYXMgVmVyc2lvbiBvbGRlciB0aGFuIDIuMywgYW5kIHJlcXVpcmluZyBhIHdlYmtpdCB2ZXJzaW9uIG9mIHRoZSBhbmRyb2lkIGJyb3dzZXJcbnZqcy5JU19PTERfQU5EUk9JRCA9IHZqcy5JU19BTkRST0lEICYmICgvd2Via2l0L2kpLnRlc3QodmpzLlVTRVJfQUdFTlQpICYmIHZqcy5BTkRST0lEX1ZFUlNJT04gPCAyLjM7XG5cbnZqcy5JU19GSVJFRk9YID0gKC9GaXJlZm94L2kpLnRlc3QodmpzLlVTRVJfQUdFTlQpO1xudmpzLklTX0NIUk9NRSA9ICgvQ2hyb21lL2kpLnRlc3QodmpzLlVTRVJfQUdFTlQpO1xuXG52anMuVE9VQ0hfRU5BQkxFRCA9ICEhKCgnb250b3VjaHN0YXJ0JyBpbiB3aW5kb3cpIHx8IHdpbmRvdy5Eb2N1bWVudFRvdWNoICYmIGRvY3VtZW50IGluc3RhbmNlb2Ygd2luZG93LkRvY3VtZW50VG91Y2gpO1xuXG4vKipcbiAqIEdldCBhbiBlbGVtZW50J3MgYXR0cmlidXRlIHZhbHVlcywgYXMgZGVmaW5lZCBvbiB0aGUgSFRNTCB0YWdcbiAqIEF0dHJpYnV0cyBhcmUgbm90IHRoZSBzYW1lIGFzIHByb3BlcnRpZXMuIFRoZXkncmUgZGVmaW5lZCBvbiB0aGUgdGFnXG4gKiBvciB3aXRoIHNldEF0dHJpYnV0ZSAod2hpY2ggc2hvdWxkbid0IGJlIHVzZWQgd2l0aCBIVE1MKVxuICogVGhpcyB3aWxsIHJldHVybiB0cnVlIG9yIGZhbHNlIGZvciBib29sZWFuIGF0dHJpYnV0ZXMuXG4gKiBAcGFyYW0gIHtFbGVtZW50fSB0YWcgRWxlbWVudCBmcm9tIHdoaWNoIHRvIGdldCB0YWcgYXR0cmlidXRlc1xuICogQHJldHVybiB7T2JqZWN0fVxuICogQHByaXZhdGVcbiAqL1xudmpzLmdldEF0dHJpYnV0ZVZhbHVlcyA9IGZ1bmN0aW9uKHRhZyl7XG4gIHZhciBvYmosIGtub3duQm9vbGVhbnMsIGF0dHJzLCBhdHRyTmFtZSwgYXR0clZhbDtcblxuICBvYmogPSB7fTtcblxuICAvLyBrbm93biBib29sZWFuIGF0dHJpYnV0ZXNcbiAgLy8gd2UgY2FuIGNoZWNrIGZvciBtYXRjaGluZyBib29sZWFuIHByb3BlcnRpZXMsIGJ1dCBvbGRlciBicm93c2Vyc1xuICAvLyB3b24ndCBrbm93IGFib3V0IEhUTUw1IGJvb2xlYW4gYXR0cmlidXRlcyB0aGF0IHdlIHN0aWxsIHJlYWQgZnJvbVxuICBrbm93bkJvb2xlYW5zID0gJywnKydhdXRvcGxheSxjb250cm9scyxsb29wLG11dGVkLGRlZmF1bHQnKycsJztcblxuICBpZiAodGFnICYmIHRhZy5hdHRyaWJ1dGVzICYmIHRhZy5hdHRyaWJ1dGVzLmxlbmd0aCA+IDApIHtcbiAgICBhdHRycyA9IHRhZy5hdHRyaWJ1dGVzO1xuXG4gICAgZm9yICh2YXIgaSA9IGF0dHJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICBhdHRyTmFtZSA9IGF0dHJzW2ldLm5hbWU7XG4gICAgICBhdHRyVmFsID0gYXR0cnNbaV0udmFsdWU7XG5cbiAgICAgIC8vIGNoZWNrIGZvciBrbm93biBib29sZWFuc1xuICAgICAgLy8gdGhlIG1hdGNoaW5nIGVsZW1lbnQgcHJvcGVydHkgd2lsbCByZXR1cm4gYSB2YWx1ZSBmb3IgdHlwZW9mXG4gICAgICBpZiAodHlwZW9mIHRhZ1thdHRyTmFtZV0gPT09ICdib29sZWFuJyB8fCBrbm93bkJvb2xlYW5zLmluZGV4T2YoJywnK2F0dHJOYW1lKycsJykgIT09IC0xKSB7XG4gICAgICAgIC8vIHRoZSB2YWx1ZSBvZiBhbiBpbmNsdWRlZCBib29sZWFuIGF0dHJpYnV0ZSBpcyB0eXBpY2FsbHkgYW4gZW1wdHlcbiAgICAgICAgLy8gc3RyaW5nICgnJykgd2hpY2ggd291bGQgZXF1YWwgZmFsc2UgaWYgd2UganVzdCBjaGVjayBmb3IgYSBmYWxzZSB2YWx1ZS5cbiAgICAgICAgLy8gd2UgYWxzbyBkb24ndCB3YW50IHN1cHBvcnQgYmFkIGNvZGUgbGlrZSBhdXRvcGxheT0nZmFsc2UnXG4gICAgICAgIGF0dHJWYWwgPSAoYXR0clZhbCAhPT0gbnVsbCkgPyB0cnVlIDogZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIG9ialthdHRyTmFtZV0gPSBhdHRyVmFsO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBvYmo7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgY29tcHV0ZWQgc3R5bGUgdmFsdWUgZm9yIGFuIGVsZW1lbnRcbiAqIEZyb20gaHR0cDovL3JvYmVydG55bWFuLmNvbS8yMDA2LzA0LzI0L2dldC10aGUtcmVuZGVyZWQtc3R5bGUtb2YtYW4tZWxlbWVudC9cbiAqIEBwYXJhbSAge0VsZW1lbnR9IGVsICAgICAgICBFbGVtZW50IHRvIGdldCBzdHlsZSB2YWx1ZSBmb3JcbiAqIEBwYXJhbSAge1N0cmluZ30gc3RyQ3NzUnVsZSBTdHlsZSBuYW1lXG4gKiBAcmV0dXJuIHtTdHJpbmd9ICAgICAgICAgICAgU3R5bGUgdmFsdWVcbiAqIEBwcml2YXRlXG4gKi9cbnZqcy5nZXRDb21wdXRlZERpbWVuc2lvbiA9IGZ1bmN0aW9uKGVsLCBzdHJDc3NSdWxlKXtcbiAgdmFyIHN0clZhbHVlID0gJyc7XG4gIGlmKGRvY3VtZW50LmRlZmF1bHRWaWV3ICYmIGRvY3VtZW50LmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUpe1xuICAgIHN0clZhbHVlID0gZG9jdW1lbnQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZShlbCwgJycpLmdldFByb3BlcnR5VmFsdWUoc3RyQ3NzUnVsZSk7XG5cbiAgfSBlbHNlIGlmKGVsLmN1cnJlbnRTdHlsZSl7XG4gICAgLy8gSUU4IFdpZHRoL0hlaWdodCBzdXBwb3J0XG4gICAgc3RyVmFsdWUgPSBlbFsnY2xpZW50JytzdHJDc3NSdWxlLnN1YnN0cigwLDEpLnRvVXBwZXJDYXNlKCkgKyBzdHJDc3NSdWxlLnN1YnN0cigxKV0gKyAncHgnO1xuICB9XG4gIHJldHVybiBzdHJWYWx1ZTtcbn07XG5cbi8qKlxuICogSW5zZXJ0IGFuIGVsZW1lbnQgYXMgdGhlIGZpcnN0IGNoaWxkIG5vZGUgb2YgYW5vdGhlclxuICogQHBhcmFtICB7RWxlbWVudH0gY2hpbGQgICBFbGVtZW50IHRvIGluc2VydFxuICogQHBhcmFtICB7W3R5cGVdfSBwYXJlbnQgRWxlbWVudCB0byBpbnNlcnQgY2hpbGQgaW50b1xuICogQHByaXZhdGVcbiAqL1xudmpzLmluc2VydEZpcnN0ID0gZnVuY3Rpb24oY2hpbGQsIHBhcmVudCl7XG4gIGlmIChwYXJlbnQuZmlyc3RDaGlsZCkge1xuICAgIHBhcmVudC5pbnNlcnRCZWZvcmUoY2hpbGQsIHBhcmVudC5maXJzdENoaWxkKTtcbiAgfSBlbHNlIHtcbiAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoY2hpbGQpO1xuICB9XG59O1xuXG4vKipcbiAqIE9iamVjdCB0byBob2xkIGJyb3dzZXIgc3VwcG9ydCBpbmZvcm1hdGlvblxuICogQHR5cGUge09iamVjdH1cbiAqIEBwcml2YXRlXG4gKi9cbnZqcy5zdXBwb3J0ID0ge307XG5cbi8qKlxuICogU2hvcnRoYW5kIGZvciBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgpXG4gKiBBbHNvIGFsbG93cyBmb3IgQ1NTIChqUXVlcnkpIElEIHN5bnRheC4gQnV0IG5vdGhpbmcgb3RoZXIgdGhhbiBJRHMuXG4gKiBAcGFyYW0gIHtTdHJpbmd9IGlkICBFbGVtZW50IElEXG4gKiBAcmV0dXJuIHtFbGVtZW50fSAgICBFbGVtZW50IHdpdGggc3VwcGxpZWQgSURcbiAqIEBwcml2YXRlXG4gKi9cbnZqcy5lbCA9IGZ1bmN0aW9uKGlkKXtcbiAgaWYgKGlkLmluZGV4T2YoJyMnKSA9PT0gMCkge1xuICAgIGlkID0gaWQuc2xpY2UoMSk7XG4gIH1cblxuICByZXR1cm4gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xufTtcblxuLyoqXG4gKiBGb3JtYXQgc2Vjb25kcyBhcyBhIHRpbWUgc3RyaW5nLCBIOk1NOlNTIG9yIE06U1NcbiAqIFN1cHBseWluZyBhIGd1aWRlIChpbiBzZWNvbmRzKSB3aWxsIGZvcmNlIGEgbnVtYmVyIG9mIGxlYWRpbmcgemVyb3NcbiAqIHRvIGNvdmVyIHRoZSBsZW5ndGggb2YgdGhlIGd1aWRlXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IHNlY29uZHMgTnVtYmVyIG9mIHNlY29uZHMgdG8gYmUgdHVybmVkIGludG8gYSBzdHJpbmdcbiAqIEBwYXJhbSAge051bWJlcn0gZ3VpZGUgICBOdW1iZXIgKGluIHNlY29uZHMpIHRvIG1vZGVsIHRoZSBzdHJpbmcgYWZ0ZXJcbiAqIEByZXR1cm4ge1N0cmluZ30gICAgICAgICBUaW1lIGZvcm1hdHRlZCBhcyBIOk1NOlNTIG9yIE06U1NcbiAqIEBwcml2YXRlXG4gKi9cbnZqcy5mb3JtYXRUaW1lID0gZnVuY3Rpb24oc2Vjb25kcywgZ3VpZGUpIHtcbiAgLy8gRGVmYXVsdCB0byB1c2luZyBzZWNvbmRzIGFzIGd1aWRlXG4gIGd1aWRlID0gZ3VpZGUgfHwgc2Vjb25kcztcbiAgdmFyIHMgPSBNYXRoLmZsb29yKHNlY29uZHMgJSA2MCksXG4gICAgICBtID0gTWF0aC5mbG9vcihzZWNvbmRzIC8gNjAgJSA2MCksXG4gICAgICBoID0gTWF0aC5mbG9vcihzZWNvbmRzIC8gMzYwMCksXG4gICAgICBnbSA9IE1hdGguZmxvb3IoZ3VpZGUgLyA2MCAlIDYwKSxcbiAgICAgIGdoID0gTWF0aC5mbG9vcihndWlkZSAvIDM2MDApO1xuXG4gIC8vIGhhbmRsZSBpbnZhbGlkIHRpbWVzXG4gIGlmIChpc05hTihzZWNvbmRzKSB8fCBzZWNvbmRzID09PSBJbmZpbml0eSkge1xuICAgIC8vICctJyBpcyBmYWxzZSBmb3IgYWxsIHJlbGF0aW9uYWwgb3BlcmF0b3JzIChlLmcuIDwsID49KSBzbyB0aGlzIHNldHRpbmdcbiAgICAvLyB3aWxsIGFkZCB0aGUgbWluaW11bSBudW1iZXIgb2YgZmllbGRzIHNwZWNpZmllZCBieSB0aGUgZ3VpZGVcbiAgICBoID0gbSA9IHMgPSAnLSc7XG4gIH1cblxuICAvLyBDaGVjayBpZiB3ZSBuZWVkIHRvIHNob3cgaG91cnNcbiAgaCA9IChoID4gMCB8fCBnaCA+IDApID8gaCArICc6JyA6ICcnO1xuXG4gIC8vIElmIGhvdXJzIGFyZSBzaG93aW5nLCB3ZSBtYXkgbmVlZCB0byBhZGQgYSBsZWFkaW5nIHplcm8uXG4gIC8vIEFsd2F5cyBzaG93IGF0IGxlYXN0IG9uZSBkaWdpdCBvZiBtaW51dGVzLlxuICBtID0gKCgoaCB8fCBnbSA+PSAxMCkgJiYgbSA8IDEwKSA/ICcwJyArIG0gOiBtKSArICc6JztcblxuICAvLyBDaGVjayBpZiBsZWFkaW5nIHplcm8gaXMgbmVlZCBmb3Igc2Vjb25kc1xuICBzID0gKHMgPCAxMCkgPyAnMCcgKyBzIDogcztcblxuICByZXR1cm4gaCArIG0gKyBzO1xufTtcblxuLy8gQXR0ZW1wdCB0byBibG9jayB0aGUgYWJpbGl0eSB0byBzZWxlY3QgdGV4dCB3aGlsZSBkcmFnZ2luZyBjb250cm9sc1xudmpzLmJsb2NrVGV4dFNlbGVjdGlvbiA9IGZ1bmN0aW9uKCl7XG4gIGRvY3VtZW50LmJvZHkuZm9jdXMoKTtcbiAgZG9jdW1lbnQub25zZWxlY3RzdGFydCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGZhbHNlOyB9O1xufTtcbi8vIFR1cm4gb2ZmIHRleHQgc2VsZWN0aW9uIGJsb2NraW5nXG52anMudW5ibG9ja1RleHRTZWxlY3Rpb24gPSBmdW5jdGlvbigpeyBkb2N1bWVudC5vbnNlbGVjdHN0YXJ0ID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdHJ1ZTsgfTsgfTtcblxuLyoqXG4gKiBUcmltIHdoaXRlc3BhY2UgZnJvbSB0aGUgZW5kcyBvZiBhIHN0cmluZy5cbiAqIEBwYXJhbSAge1N0cmluZ30gc3RyaW5nIFN0cmluZyB0byB0cmltXG4gKiBAcmV0dXJuIHtTdHJpbmd9ICAgICAgICBUcmltbWVkIHN0cmluZ1xuICogQHByaXZhdGVcbiAqL1xudmpzLnRyaW0gPSBmdW5jdGlvbihzdHIpe1xuICByZXR1cm4gKHN0cisnJykucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpO1xufTtcblxuLyoqXG4gKiBTaG91bGQgcm91bmQgb2ZmIGEgbnVtYmVyIHRvIGEgZGVjaW1hbCBwbGFjZVxuICogQHBhcmFtICB7TnVtYmVyfSBudW0gTnVtYmVyIHRvIHJvdW5kXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IGRlYyBOdW1iZXIgb2YgZGVjaW1hbCBwbGFjZXMgdG8gcm91bmQgdG9cbiAqIEByZXR1cm4ge051bWJlcn0gICAgIFJvdW5kZWQgbnVtYmVyXG4gKiBAcHJpdmF0ZVxuICovXG52anMucm91bmQgPSBmdW5jdGlvbihudW0sIGRlYykge1xuICBpZiAoIWRlYykgeyBkZWMgPSAwOyB9XG4gIHJldHVybiBNYXRoLnJvdW5kKG51bSpNYXRoLnBvdygxMCxkZWMpKS9NYXRoLnBvdygxMCxkZWMpO1xufTtcblxuLyoqXG4gKiBTaG91bGQgY3JlYXRlIGEgZmFrZSBUaW1lUmFuZ2Ugb2JqZWN0XG4gKiBNaW1pY3MgYW4gSFRNTDUgdGltZSByYW5nZSBpbnN0YW5jZSwgd2hpY2ggaGFzIGZ1bmN0aW9ucyB0aGF0XG4gKiByZXR1cm4gdGhlIHN0YXJ0IGFuZCBlbmQgdGltZXMgZm9yIGEgcmFuZ2VcbiAqIFRpbWVSYW5nZXMgYXJlIHJldHVybmVkIGJ5IHRoZSBidWZmZXJlZCgpIG1ldGhvZFxuICogQHBhcmFtICB7TnVtYmVyfSBzdGFydCBTdGFydCB0aW1lIGluIHNlY29uZHNcbiAqIEBwYXJhbSAge051bWJlcn0gZW5kICAgRW5kIHRpbWUgaW4gc2Vjb25kc1xuICogQHJldHVybiB7T2JqZWN0fSAgICAgICBGYWtlIFRpbWVSYW5nZSBvYmplY3RcbiAqIEBwcml2YXRlXG4gKi9cbnZqcy5jcmVhdGVUaW1lUmFuZ2UgPSBmdW5jdGlvbihzdGFydCwgZW5kKXtcbiAgcmV0dXJuIHtcbiAgICBsZW5ndGg6IDEsXG4gICAgc3RhcnQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gc3RhcnQ7IH0sXG4gICAgZW5kOiBmdW5jdGlvbigpIHsgcmV0dXJuIGVuZDsgfVxuICB9O1xufTtcblxuLyoqXG4gKiBTaW1wbGUgaHR0cCByZXF1ZXN0IGZvciByZXRyaWV2aW5nIGV4dGVybmFsIGZpbGVzIChlLmcuIHRleHQgdHJhY2tzKVxuICogQHBhcmFtICB7U3RyaW5nfSB1cmwgICAgICAgICAgIFVSTCBvZiByZXNvdXJjZVxuICogQHBhcmFtICB7RnVuY3Rpb249fSBvblN1Y2Nlc3MgIFN1Y2Nlc3MgY2FsbGJhY2tcbiAqIEBwYXJhbSAge0Z1bmN0aW9uPX0gb25FcnJvciAgICBFcnJvciBjYWxsYmFja1xuICogQHByaXZhdGVcbiAqL1xudmpzLmdldCA9IGZ1bmN0aW9uKHVybCwgb25TdWNjZXNzLCBvbkVycm9yKXtcbiAgdmFyIGxvY2FsLCByZXF1ZXN0O1xuXG4gIGlmICh0eXBlb2YgWE1MSHR0cFJlcXVlc3QgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgd2luZG93LlhNTEh0dHBSZXF1ZXN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgdHJ5IHsgcmV0dXJuIG5ldyB3aW5kb3cuQWN0aXZlWE9iamVjdCgnTXN4bWwyLlhNTEhUVFAuNi4wJyk7IH0gY2F0Y2ggKGUpIHt9XG4gICAgICB0cnkgeyByZXR1cm4gbmV3IHdpbmRvdy5BY3RpdmVYT2JqZWN0KCdNc3htbDIuWE1MSFRUUC4zLjAnKTsgfSBjYXRjaCAoZikge31cbiAgICAgIHRyeSB7IHJldHVybiBuZXcgd2luZG93LkFjdGl2ZVhPYmplY3QoJ01zeG1sMi5YTUxIVFRQJyk7IH0gY2F0Y2ggKGcpIHt9XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoaXMgYnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IFhNTEh0dHBSZXF1ZXN0LicpO1xuICAgIH07XG4gIH1cblxuICByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gIHRyeSB7XG4gICAgcmVxdWVzdC5vcGVuKCdHRVQnLCB1cmwpO1xuICB9IGNhdGNoKGUpIHtcbiAgICBvbkVycm9yKGUpO1xuICB9XG5cbiAgbG9jYWwgPSAodXJsLmluZGV4T2YoJ2ZpbGU6JykgPT09IDAgfHwgKHdpbmRvdy5sb2NhdGlvbi5ocmVmLmluZGV4T2YoJ2ZpbGU6JykgPT09IDAgJiYgdXJsLmluZGV4T2YoJ2h0dHAnKSA9PT0gLTEpKTtcblxuICByZXF1ZXN0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuICAgIGlmIChyZXF1ZXN0LnJlYWR5U3RhdGUgPT09IDQpIHtcbiAgICAgIGlmIChyZXF1ZXN0LnN0YXR1cyA9PT0gMjAwIHx8IGxvY2FsICYmIHJlcXVlc3Quc3RhdHVzID09PSAwKSB7XG4gICAgICAgIG9uU3VjY2VzcyhyZXF1ZXN0LnJlc3BvbnNlVGV4dCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAob25FcnJvcikge1xuICAgICAgICAgIG9uRXJyb3IoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICB0cnkge1xuICAgIHJlcXVlc3Quc2VuZCgpO1xuICB9IGNhdGNoKGUpIHtcbiAgICBpZiAob25FcnJvcikge1xuICAgICAgb25FcnJvcihlKTtcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogQWRkIHRvIGxvY2FsIHN0b3JhZ2UgKG1heSByZW1vdmVhYmxlKVxuICogQHByaXZhdGVcbiAqL1xudmpzLnNldExvY2FsU3RvcmFnZSA9IGZ1bmN0aW9uKGtleSwgdmFsdWUpe1xuICB0cnkge1xuICAgIC8vIElFIHdhcyB0aHJvd2luZyBlcnJvcnMgcmVmZXJlbmNpbmcgdGhlIHZhciBhbnl3aGVyZSB3aXRob3V0IHRoaXNcbiAgICB2YXIgbG9jYWxTdG9yYWdlID0gd2luZG93LmxvY2FsU3RvcmFnZSB8fCBmYWxzZTtcbiAgICBpZiAoIWxvY2FsU3RvcmFnZSkgeyByZXR1cm47IH1cbiAgICBsb2NhbFN0b3JhZ2Vba2V5XSA9IHZhbHVlO1xuICB9IGNhdGNoKGUpIHtcbiAgICBpZiAoZS5jb2RlID09IDIyIHx8IGUuY29kZSA9PSAxMDE0KSB7IC8vIFdlYmtpdCA9PSAyMiAvIEZpcmVmb3ggPT0gMTAxNFxuICAgICAgdmpzLmxvZygnTG9jYWxTdG9yYWdlIEZ1bGwgKFZpZGVvSlMpJywgZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChlLmNvZGUgPT0gMTgpIHtcbiAgICAgICAgdmpzLmxvZygnTG9jYWxTdG9yYWdlIG5vdCBhbGxvd2VkIChWaWRlb0pTKScsIGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmpzLmxvZygnTG9jYWxTdG9yYWdlIEVycm9yIChWaWRlb0pTKScsIGUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBHZXQgYWJvc29sdXRlIHZlcnNpb24gb2YgcmVsYXRpdmUgVVJMLiBVc2VkIHRvIHRlbGwgZmxhc2ggY29ycmVjdCBVUkwuXG4gKiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzQ3MDgzMi9nZXR0aW5nLWFuLWFic29sdXRlLXVybC1mcm9tLWEtcmVsYXRpdmUtb25lLWllNi1pc3N1ZVxuICogQHBhcmFtICB7U3RyaW5nfSB1cmwgVVJMIHRvIG1ha2UgYWJzb2x1dGVcbiAqIEByZXR1cm4ge1N0cmluZ30gICAgIEFic29sdXRlIFVSTFxuICogQHByaXZhdGVcbiAqL1xudmpzLmdldEFic29sdXRlVVJMID0gZnVuY3Rpb24odXJsKXtcblxuICAvLyBDaGVjayBpZiBhYnNvbHV0ZSBVUkxcbiAgaWYgKCF1cmwubWF0Y2goL15odHRwcz86XFwvXFwvLykpIHtcbiAgICAvLyBDb252ZXJ0IHRvIGFic29sdXRlIFVSTC4gRmxhc2ggaG9zdGVkIG9mZi1zaXRlIG5lZWRzIGFuIGFic29sdXRlIFVSTC5cbiAgICB1cmwgPSB2anMuY3JlYXRlRWwoJ2RpdicsIHtcbiAgICAgIGlubmVySFRNTDogJzxhIGhyZWY9XCInK3VybCsnXCI+eDwvYT4nXG4gICAgfSkuZmlyc3RDaGlsZC5ocmVmO1xuICB9XG5cbiAgcmV0dXJuIHVybDtcbn07XG5cbi8vIHVzYWdlOiBsb2coJ2luc2lkZSBjb29sRnVuYycsdGhpcyxhcmd1bWVudHMpO1xuLy8gaHR0cDovL3BhdWxpcmlzaC5jb20vMjAwOS9sb2ctYS1saWdodHdlaWdodC13cmFwcGVyLWZvci1jb25zb2xlbG9nL1xudmpzLmxvZyA9IGZ1bmN0aW9uKCl7XG4gIHZqcy5sb2cuaGlzdG9yeSA9IHZqcy5sb2cuaGlzdG9yeSB8fCBbXTsgICAvLyBzdG9yZSBsb2dzIHRvIGFuIGFycmF5IGZvciByZWZlcmVuY2VcbiAgdmpzLmxvZy5oaXN0b3J5LnB1c2goYXJndW1lbnRzKTtcbiAgaWYod2luZG93LmNvbnNvbGUpe1xuICAgIHdpbmRvdy5jb25zb2xlLmxvZyhBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpKTtcbiAgfVxufTtcblxuLy8gT2Zmc2V0IExlZnRcbi8vIGdldEJvdW5kaW5nQ2xpZW50UmVjdCB0ZWNobmlxdWUgZnJvbSBKb2huIFJlc2lnIGh0dHA6Ly9lam9obi5vcmcvYmxvZy9nZXRib3VuZGluZ2NsaWVudHJlY3QtaXMtYXdlc29tZS9cbnZqcy5maW5kUG9zaXRpb24gPSBmdW5jdGlvbihlbCkge1xuICAgIHZhciBib3gsIGRvY0VsLCBib2R5LCBjbGllbnRMZWZ0LCBzY3JvbGxMZWZ0LCBsZWZ0LCBjbGllbnRUb3AsIHNjcm9sbFRvcCwgdG9wO1xuXG4gICAgaWYgKGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCAmJiBlbC5wYXJlbnROb2RlKSB7XG4gICAgICBib3ggPSBlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICB9XG5cbiAgICBpZiAoIWJveCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogMCxcbiAgICAgICAgdG9wOiAwXG4gICAgICB9O1xuICAgIH1cblxuICAgIGRvY0VsID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuICAgIGJvZHkgPSBkb2N1bWVudC5ib2R5O1xuXG4gICAgY2xpZW50TGVmdCA9IGRvY0VsLmNsaWVudExlZnQgfHwgYm9keS5jbGllbnRMZWZ0IHx8IDA7XG4gICAgc2Nyb2xsTGVmdCA9IHdpbmRvdy5wYWdlWE9mZnNldCB8fCBib2R5LnNjcm9sbExlZnQ7XG4gICAgbGVmdCA9IGJveC5sZWZ0ICsgc2Nyb2xsTGVmdCAtIGNsaWVudExlZnQ7XG5cbiAgICBjbGllbnRUb3AgPSBkb2NFbC5jbGllbnRUb3AgfHwgYm9keS5jbGllbnRUb3AgfHwgMDtcbiAgICBzY3JvbGxUb3AgPSB3aW5kb3cucGFnZVlPZmZzZXQgfHwgYm9keS5zY3JvbGxUb3A7XG4gICAgdG9wID0gYm94LnRvcCArIHNjcm9sbFRvcCAtIGNsaWVudFRvcDtcblxuICAgIHJldHVybiB7XG4gICAgICBsZWZ0OiBsZWZ0LFxuICAgICAgdG9wOiB0b3BcbiAgICB9O1xufTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBQbGF5ZXIgQ29tcG9uZW50IC0gQmFzZSBjbGFzcyBmb3IgYWxsIFVJIG9iamVjdHNcbiAqXG4gKi9cblxuLyoqXG4gKiBCYXNlIFVJIENvbXBvbmVudCBjbGFzc1xuICpcbiAqIENvbXBvbmVudHMgYXJlIGVtYmVkZGFibGUgVUkgb2JqZWN0cyB0aGF0IGFyZSByZXByZXNlbnRlZCBieSBib3RoIGFcbiAqIGphdmFzY3JpcHQgb2JqZWN0IGFuZCBhbiBlbGVtZW50IGluIHRoZSBET00uIFRoZXkgY2FuIGJlIGNoaWxkcmVuIG9mIG90aGVyXG4gKiBjb21wb25lbnRzLCBhbmQgY2FuIGhhdmUgbWFueSBjaGlsZHJlbiB0aGVtc2VsdmVzLlxuICpcbiAqICAgICAvLyBhZGRpbmcgYSBidXR0b24gdG8gdGhlIHBsYXllclxuICogICAgIHZhciBidXR0b24gPSBwbGF5ZXIuYWRkQ2hpbGQoJ2J1dHRvbicpO1xuICogICAgIGJ1dHRvbi5lbCgpOyAvLyAtPiBidXR0b24gZWxlbWVudFxuICpcbiAqICAgICA8ZGl2IGNsYXNzPVwidmlkZW8tanNcIj5cbiAqICAgICAgIDxkaXYgY2xhc3M9XCJ2anMtYnV0dG9uXCI+QnV0dG9uPC9kaXY+XG4gKiAgICAgPC9kaXY+XG4gKlxuICogQ29tcG9uZW50cyBhcmUgYWxzbyBldmVudCBlbWl0dGVycy5cbiAqXG4gKiAgICAgYnV0dG9uLm9uKCdjbGljaycsIGZ1bmN0aW9uKCl7XG4gKiAgICAgICBjb25zb2xlLmxvZygnQnV0dG9uIENsaWNrZWQhJyk7XG4gKiAgICAgfSk7XG4gKlxuICogICAgIGJ1dHRvbi50cmlnZ2VyKCdjdXN0b21ldmVudCcpO1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBwbGF5ZXIgIE1haW4gUGxheWVyXG4gKiBAcGFyYW0ge09iamVjdD19IG9wdGlvbnNcbiAqIEBjbGFzc1xuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyB2anMuQ29yZU9iamVjdFxuICovXG52anMuQ29tcG9uZW50ID0gdmpzLkNvcmVPYmplY3QuZXh0ZW5kKHtcbiAgLyoqXG4gICAqIHRoZSBjb25zdHJ1Y3RvciBmdW5jaXRvbiBmb3IgdGhlIGNsYXNzXG4gICAqXG4gICAqIEBjb25zdHJ1Y3RvclxuICAgKi9cbiAgaW5pdDogZnVuY3Rpb24ocGxheWVyLCBvcHRpb25zLCByZWFkeSl7XG4gICAgdGhpcy5wbGF5ZXJfID0gcGxheWVyO1xuXG4gICAgLy8gTWFrZSBhIGNvcHkgb2YgcHJvdG90eXBlLm9wdGlvbnNfIHRvIHByb3RlY3QgYWdhaW5zdCBvdmVycmlkaW5nIGdsb2JhbCBkZWZhdWx0c1xuICAgIHRoaXMub3B0aW9uc18gPSB2anMub2JqLmNvcHkodGhpcy5vcHRpb25zXyk7XG5cbiAgICAvLyBVcGRhdGVkIG9wdGlvbnMgd2l0aCBzdXBwbGllZCBvcHRpb25zXG4gICAgb3B0aW9ucyA9IHRoaXMub3B0aW9ucyhvcHRpb25zKTtcblxuICAgIC8vIEdldCBJRCBmcm9tIG9wdGlvbnMsIGVsZW1lbnQsIG9yIGNyZWF0ZSB1c2luZyBwbGF5ZXIgSUQgYW5kIHVuaXF1ZSBJRFxuICAgIHRoaXMuaWRfID0gb3B0aW9uc1snaWQnXSB8fCAoKG9wdGlvbnNbJ2VsJ10gJiYgb3B0aW9uc1snZWwnXVsnaWQnXSkgPyBvcHRpb25zWydlbCddWydpZCddIDogcGxheWVyLmlkKCkgKyAnX2NvbXBvbmVudF8nICsgdmpzLmd1aWQrKyApO1xuXG4gICAgdGhpcy5uYW1lXyA9IG9wdGlvbnNbJ25hbWUnXSB8fCBudWxsO1xuXG4gICAgLy8gQ3JlYXRlIGVsZW1lbnQgaWYgb25lIHdhc24ndCBwcm92aWRlZCBpbiBvcHRpb25zXG4gICAgdGhpcy5lbF8gPSBvcHRpb25zWydlbCddIHx8IHRoaXMuY3JlYXRlRWwoKTtcblxuICAgIHRoaXMuY2hpbGRyZW5fID0gW107XG4gICAgdGhpcy5jaGlsZEluZGV4XyA9IHt9O1xuICAgIHRoaXMuY2hpbGROYW1lSW5kZXhfID0ge307XG5cbiAgICAvLyBBZGQgYW55IGNoaWxkIGNvbXBvbmVudHMgaW4gb3B0aW9uc1xuICAgIHRoaXMuaW5pdENoaWxkcmVuKCk7XG5cbiAgICB0aGlzLnJlYWR5KHJlYWR5KTtcbiAgICAvLyBEb24ndCB3YW50IHRvIHRyaWdnZXIgcmVhZHkgaGVyZSBvciBpdCB3aWxsIGJlZm9yZSBpbml0IGlzIGFjdHVhbGx5XG4gICAgLy8gZmluaXNoZWQgZm9yIGFsbCBjaGlsZHJlbiB0aGF0IHJ1biB0aGlzIGNvbnN0cnVjdG9yXG4gIH1cbn0pO1xuXG4vKipcbiAqIERpc3Bvc2Ugb2YgdGhlIGNvbXBvbmVudCBhbmQgYWxsIGNoaWxkIGNvbXBvbmVudHNcbiAqL1xudmpzLkNvbXBvbmVudC5wcm90b3R5cGUuZGlzcG9zZSA9IGZ1bmN0aW9uKCl7XG4gIHRoaXMudHJpZ2dlcignZGlzcG9zZScpO1xuXG4gIC8vIERpc3Bvc2UgYWxsIGNoaWxkcmVuLlxuICBpZiAodGhpcy5jaGlsZHJlbl8pIHtcbiAgICBmb3IgKHZhciBpID0gdGhpcy5jaGlsZHJlbl8ubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIGlmICh0aGlzLmNoaWxkcmVuX1tpXS5kaXNwb3NlKSB7XG4gICAgICAgIHRoaXMuY2hpbGRyZW5fW2ldLmRpc3Bvc2UoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBEZWxldGUgY2hpbGQgcmVmZXJlbmNlc1xuICB0aGlzLmNoaWxkcmVuXyA9IG51bGw7XG4gIHRoaXMuY2hpbGRJbmRleF8gPSBudWxsO1xuICB0aGlzLmNoaWxkTmFtZUluZGV4XyA9IG51bGw7XG5cbiAgLy8gUmVtb3ZlIGFsbCBldmVudCBsaXN0ZW5lcnMuXG4gIHRoaXMub2ZmKCk7XG5cbiAgLy8gUmVtb3ZlIGVsZW1lbnQgZnJvbSBET01cbiAgaWYgKHRoaXMuZWxfLnBhcmVudE5vZGUpIHtcbiAgICB0aGlzLmVsXy5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuZWxfKTtcbiAgfVxuXG4gIHZqcy5yZW1vdmVEYXRhKHRoaXMuZWxfKTtcbiAgdGhpcy5lbF8gPSBudWxsO1xufTtcblxuLyoqXG4gKiBSZWZlcmVuY2UgdG8gbWFpbiBwbGF5ZXIgaW5zdGFuY2VcbiAqXG4gKiBAdHlwZSB7dmpzLlBsYXllcn1cbiAqIEBwcml2YXRlXG4gKi9cbnZqcy5Db21wb25lbnQucHJvdG90eXBlLnBsYXllcl8gPSB0cnVlO1xuXG4vKipcbiAqIFJldHVybiB0aGUgY29tcG9uZW50J3MgcGxheWVyXG4gKlxuICogQHJldHVybiB7dmpzLlBsYXllcn1cbiAqL1xudmpzLkNvbXBvbmVudC5wcm90b3R5cGUucGxheWVyID0gZnVuY3Rpb24oKXtcbiAgcmV0dXJuIHRoaXMucGxheWVyXztcbn07XG5cbi8qKlxuICogVGhlIGNvbXBvbmVudCdzIG9wdGlvbnMgb2JqZWN0XG4gKlxuICogQHR5cGUge09iamVjdH1cbiAqIEBwcml2YXRlXG4gKi9cbnZqcy5Db21wb25lbnQucHJvdG90eXBlLm9wdGlvbnNfO1xuXG4vKipcbiAqIERlZXAgbWVyZ2Ugb2Ygb3B0aW9ucyBvYmplY3RzXG4gKlxuICogV2hlbmV2ZXIgYSBwcm9wZXJ0eSBpcyBhbiBvYmplY3Qgb24gYm90aCBvcHRpb25zIG9iamVjdHNcbiAqIHRoZSB0d28gcHJvcGVydGllcyB3aWxsIGJlIG1lcmdlZCB1c2luZyB2anMub2JqLmRlZXBNZXJnZS5cbiAqXG4gKiBUaGlzIGlzIHVzZWQgZm9yIG1lcmdpbmcgb3B0aW9ucyBmb3IgY2hpbGQgY29tcG9uZW50cy4gV2VcbiAqIHdhbnQgaXQgdG8gYmUgZWFzeSB0byBvdmVycmlkZSBpbmRpdmlkdWFsIG9wdGlvbnMgb24gYSBjaGlsZFxuICogY29tcG9uZW50IHdpdGhvdXQgaGF2aW5nIHRvIHJld3JpdGUgYWxsIHRoZSBvdGhlciBkZWZhdWx0IG9wdGlvbnMuXG4gKlxuICogICAgIFBhcmVudC5wcm90b3R5cGUub3B0aW9uc18gPSB7XG4gKiAgICAgICBjaGlsZHJlbjoge1xuICogICAgICAgICAnY2hpbGRPbmUnOiB7ICdmb28nOiAnYmFyJywgJ2FzZGYnOiAnZmRzYScgfSxcbiAqICAgICAgICAgJ2NoaWxkVHdvJzoge30sXG4gKiAgICAgICAgICdjaGlsZFRocmVlJzoge31cbiAqICAgICAgIH1cbiAqICAgICB9XG4gKiAgICAgbmV3T3B0aW9ucyA9IHtcbiAqICAgICAgIGNoaWxkcmVuOiB7XG4gKiAgICAgICAgICdjaGlsZE9uZSc6IHsgJ2Zvbyc6ICdiYXonLCAnYWJjJzogJzEyMycgfVxuICogICAgICAgICAnY2hpbGRUd28nOiBudWxsLFxuICogICAgICAgICAnY2hpbGRGb3VyJzoge31cbiAqICAgICAgIH1cbiAqICAgICB9XG4gKlxuICogICAgIHRoaXMub3B0aW9ucyhuZXdPcHRpb25zKTtcbiAqXG4gKiBSRVNVTFRcbiAqXG4gKiAgICAge1xuICogICAgICAgY2hpbGRyZW46IHtcbiAqICAgICAgICAgJ2NoaWxkT25lJzogeyAnZm9vJzogJ2JheicsICdhc2RmJzogJ2Zkc2EnLCAnYWJjJzogJzEyMycgfSxcbiAqICAgICAgICAgJ2NoaWxkVHdvJzogbnVsbCwgLy8gRGlzYWJsZWQuIFdvbid0IGJlIGluaXRpYWxpemVkLlxuICogICAgICAgICAnY2hpbGRUaHJlZSc6IHt9LFxuICogICAgICAgICAnY2hpbGRGb3VyJzoge31cbiAqICAgICAgIH1cbiAqICAgICB9XG4gKlxuICogQHBhcmFtICB7T2JqZWN0fSBvYmogT2JqZWN0IHdob3NlIHZhbHVlcyB3aWxsIGJlIG92ZXJ3cml0dGVuXG4gKiBAcmV0dXJuIHtPYmplY3R9ICAgICBORVcgbWVyZ2VkIG9iamVjdC4gRG9lcyBub3QgcmV0dXJuIG9iajEuXG4gKi9cbnZqcy5Db21wb25lbnQucHJvdG90eXBlLm9wdGlvbnMgPSBmdW5jdGlvbihvYmope1xuICBpZiAob2JqID09PSB1bmRlZmluZWQpIHJldHVybiB0aGlzLm9wdGlvbnNfO1xuXG4gIHJldHVybiB0aGlzLm9wdGlvbnNfID0gdmpzLm9iai5kZWVwTWVyZ2UodGhpcy5vcHRpb25zXywgb2JqKTtcbn07XG5cbi8qKlxuICogVGhlIERPTSBlbGVtZW50IGZvciB0aGUgY29tcG9uZW50XG4gKlxuICogQHR5cGUge0VsZW1lbnR9XG4gKiBAcHJpdmF0ZVxuICovXG52anMuQ29tcG9uZW50LnByb3RvdHlwZS5lbF87XG5cbi8qKlxuICogQ3JlYXRlIHRoZSBjb21wb25lbnQncyBET00gZWxlbWVudFxuICpcbiAqIEBwYXJhbSAge1N0cmluZz19IHRhZ05hbWUgIEVsZW1lbnQncyBub2RlIHR5cGUuIGUuZy4gJ2RpdidcbiAqIEBwYXJhbSAge09iamVjdD19IGF0dHJpYnV0ZXMgQW4gb2JqZWN0IG9mIGVsZW1lbnQgYXR0cmlidXRlcyB0aGF0IHNob3VsZCBiZSBzZXQgb24gdGhlIGVsZW1lbnRcbiAqIEByZXR1cm4ge0VsZW1lbnR9XG4gKi9cbnZqcy5Db21wb25lbnQucHJvdG90eXBlLmNyZWF0ZUVsID0gZnVuY3Rpb24odGFnTmFtZSwgYXR0cmlidXRlcyl7XG4gIHJldHVybiB2anMuY3JlYXRlRWwodGFnTmFtZSwgYXR0cmlidXRlcyk7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgY29tcG9uZW50J3MgRE9NIGVsZW1lbnRcbiAqXG4gKiAgICAgdmFyIGRvbUVsID0gbXlDb21wb25lbnQuZWwoKTtcbiAqXG4gKiBAcmV0dXJuIHtFbGVtZW50fVxuICovXG52anMuQ29tcG9uZW50LnByb3RvdHlwZS5lbCA9IGZ1bmN0aW9uKCl7XG4gIHJldHVybiB0aGlzLmVsXztcbn07XG5cbi8qKlxuICogQW4gb3B0aW9uYWwgZWxlbWVudCB3aGVyZSwgaWYgZGVmaW5lZCwgY2hpbGRyZW4gd2lsbCBiZSBpbnNlcnRlZCBpbnN0ZWFkIG9mXG4gKiBkaXJlY3RseSBpbiBgZWxfYFxuICpcbiAqIEB0eXBlIHtFbGVtZW50fVxuICogQHByaXZhdGVcbiAqL1xudmpzLkNvbXBvbmVudC5wcm90b3R5cGUuY29udGVudEVsXztcblxuLyoqXG4gKiBSZXR1cm4gdGhlIGNvbXBvbmVudCdzIERPTSBlbGVtZW50IGZvciBlbWJlZGRpbmcgY29udGVudC5cbiAqIFdpbGwgZWl0aGVyIGJlIGVsXyBvciBhIG5ldyBlbGVtZW50IGRlZmluZWQgaW4gY3JlYXRlRWwuXG4gKlxuICogQHJldHVybiB7RWxlbWVudH1cbiAqL1xudmpzLkNvbXBvbmVudC5wcm90b3R5cGUuY29udGVudEVsID0gZnVuY3Rpb24oKXtcbiAgcmV0dXJuIHRoaXMuY29udGVudEVsXyB8fCB0aGlzLmVsXztcbn07XG5cbi8qKlxuICogVGhlIElEIGZvciB0aGUgY29tcG9uZW50XG4gKlxuICogQHR5cGUge1N0cmluZ31cbiAqIEBwcml2YXRlXG4gKi9cbnZqcy5Db21wb25lbnQucHJvdG90eXBlLmlkXztcblxuLyoqXG4gKiBHZXQgdGhlIGNvbXBvbmVudCdzIElEXG4gKlxuICogICAgIHZhciBpZCA9IG15Q29tcG9uZW50LmlkKCk7XG4gKlxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG52anMuQ29tcG9uZW50LnByb3RvdHlwZS5pZCA9IGZ1bmN0aW9uKCl7XG4gIHJldHVybiB0aGlzLmlkXztcbn07XG5cbi8qKlxuICogVGhlIG5hbWUgZm9yIHRoZSBjb21wb25lbnQuIE9mdGVuIHVzZWQgdG8gcmVmZXJlbmNlIHRoZSBjb21wb25lbnQuXG4gKlxuICogQHR5cGUge1N0cmluZ31cbiAqIEBwcml2YXRlXG4gKi9cbnZqcy5Db21wb25lbnQucHJvdG90eXBlLm5hbWVfO1xuXG4vKipcbiAqIEdldCB0aGUgY29tcG9uZW50J3MgbmFtZS4gVGhlIG5hbWUgaXMgb2Z0ZW4gdXNlZCB0byByZWZlcmVuY2UgdGhlIGNvbXBvbmVudC5cbiAqXG4gKiAgICAgdmFyIG5hbWUgPSBteUNvbXBvbmVudC5uYW1lKCk7XG4gKlxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG52anMuQ29tcG9uZW50LnByb3RvdHlwZS5uYW1lID0gZnVuY3Rpb24oKXtcbiAgcmV0dXJuIHRoaXMubmFtZV87XG59O1xuXG4vKipcbiAqIEFycmF5IG9mIGNoaWxkIGNvbXBvbmVudHNcbiAqXG4gKiBAdHlwZSB7QXJyYXl9XG4gKiBAcHJpdmF0ZVxuICovXG52anMuQ29tcG9uZW50LnByb3RvdHlwZS5jaGlsZHJlbl87XG5cbi8qKlxuICogR2V0IGFuIGFycmF5IG9mIGFsbCBjaGlsZCBjb21wb25lbnRzXG4gKlxuICogICAgIHZhciBraWRzID0gbXlDb21wb25lbnQuY2hpbGRyZW4oKTtcbiAqXG4gKiBAcmV0dXJuIHtBcnJheX0gVGhlIGNoaWxkcmVuXG4gKi9cbnZqcy5Db21wb25lbnQucHJvdG90eXBlLmNoaWxkcmVuID0gZnVuY3Rpb24oKXtcbiAgcmV0dXJuIHRoaXMuY2hpbGRyZW5fO1xufTtcblxuLyoqXG4gKiBPYmplY3Qgb2YgY2hpbGQgY29tcG9uZW50cyBieSBJRFxuICpcbiAqIEB0eXBlIHtPYmplY3R9XG4gKiBAcHJpdmF0ZVxuICovXG52anMuQ29tcG9uZW50LnByb3RvdHlwZS5jaGlsZEluZGV4XztcblxuLyoqXG4gKiBSZXR1cm5zIGEgY2hpbGQgY29tcG9uZW50IHdpdGggdGhlIHByb3ZpZGVkIElEXG4gKlxuICogQHJldHVybiB7dmpzLkNvbXBvbmVudH1cbiAqL1xudmpzLkNvbXBvbmVudC5wcm90b3R5cGUuZ2V0Q2hpbGRCeUlkID0gZnVuY3Rpb24oaWQpe1xuICByZXR1cm4gdGhpcy5jaGlsZEluZGV4X1tpZF07XG59O1xuXG4vKipcbiAqIE9iamVjdCBvZiBjaGlsZCBjb21wb25lbnRzIGJ5IG5hbWVcbiAqXG4gKiBAdHlwZSB7T2JqZWN0fVxuICogQHByaXZhdGVcbiAqL1xudmpzLkNvbXBvbmVudC5wcm90b3R5cGUuY2hpbGROYW1lSW5kZXhfO1xuXG4vKipcbiAqIFJldHVybnMgYSBjaGlsZCBjb21wb25lbnQgd2l0aCB0aGUgcHJvdmlkZWQgSURcbiAqXG4gKiBAcmV0dXJuIHt2anMuQ29tcG9uZW50fVxuICovXG52anMuQ29tcG9uZW50LnByb3RvdHlwZS5nZXRDaGlsZCA9IGZ1bmN0aW9uKG5hbWUpe1xuICByZXR1cm4gdGhpcy5jaGlsZE5hbWVJbmRleF9bbmFtZV07XG59O1xuXG4vKipcbiAqIEFkZHMgYSBjaGlsZCBjb21wb25lbnQgaW5zaWRlIHRoaXMgY29tcG9uZW50XG4gKlxuICogICAgIG15Q29tcG9uZW50LmVsKCk7XG4gKiAgICAgLy8gLT4gPGRpdiBjbGFzcz0nbXktY29tcG9uZW50Jz48L2Rpdj5cbiAqICAgICBteUNvbW9uZW50LmNoaWxkcmVuKCk7XG4gKiAgICAgLy8gW2VtcHR5IGFycmF5XVxuICpcbiAqICAgICB2YXIgbXlCdXR0b24gPSBteUNvbXBvbmVudC5hZGRDaGlsZCgnTXlCdXR0b24nKTtcbiAqICAgICAvLyAtPiA8ZGl2IGNsYXNzPSdteS1jb21wb25lbnQnPjxkaXYgY2xhc3M9XCJteS1idXR0b25cIj5teUJ1dHRvbjxkaXY+PC9kaXY+XG4gKiAgICAgLy8gLT4gbXlCdXR0b24gPT09IG15Q29tb25lbnQuY2hpbGRyZW4oKVswXTtcbiAqXG4gKiBQYXNzIGluIG9wdGlvbnMgZm9yIGNoaWxkIGNvbnN0cnVjdG9ycyBhbmQgb3B0aW9ucyBmb3IgY2hpbGRyZW4gb2YgdGhlIGNoaWxkXG4gKlxuICogICAgdmFyIG15QnV0dG9uID0gbXlDb21wb25lbnQuYWRkQ2hpbGQoJ015QnV0dG9uJywge1xuICogICAgICB0ZXh0OiAnUHJlc3MgTWUnLFxuICogICAgICBjaGlsZHJlbjoge1xuICogICAgICAgIGJ1dHRvbkNoaWxkRXhhbXBsZToge1xuICogICAgICAgICAgYnV0dG9uQ2hpbGRPcHRpb246IHRydWVcbiAqICAgICAgICB9XG4gKiAgICAgIH1cbiAqICAgIH0pO1xuICpcbiAqIEBwYXJhbSB7U3RyaW5nfHZqcy5Db21wb25lbnR9IGNoaWxkIFRoZSBjbGFzcyBuYW1lIG9yIGluc3RhbmNlIG9mIGEgY2hpbGQgdG8gYWRkXG4gKiBAcGFyYW0ge09iamVjdD19IG9wdGlvbnMgT3B0aW9ucywgaW5jbHVkaW5nIG9wdGlvbnMgdG8gYmUgcGFzc2VkIHRvIGNoaWxkcmVuIG9mIHRoZSBjaGlsZC5cbiAqIEByZXR1cm4ge3Zqcy5Db21wb25lbnR9IFRoZSBjaGlsZCBjb21wb25lbnQgKGNyZWF0ZWQgYnkgdGhpcyBwcm9jZXNzIGlmIGEgc3RyaW5nIHdhcyB1c2VkKVxuICogQHN1cHByZXNzIHthY2Nlc3NDb250cm9sc3xjaGVja1JlZ0V4cHxjaGVja1R5cGVzfGNoZWNrVmFyc3xjb25zdHxjb25zdGFudFByb3BlcnR5fGRlcHJlY2F0ZWR8ZHVwbGljYXRlfGVzNVN0cmljdHxmaWxlb3ZlcnZpZXdUYWdzfGdsb2JhbFRoaXN8aW52YWxpZENhc3RzfG1pc3NpbmdQcm9wZXJ0aWVzfG5vblN0YW5kYXJkSnNEb2NzfHN0cmljdE1vZHVsZURlcENoZWNrfHVuZGVmaW5lZE5hbWVzfHVuZGVmaW5lZFZhcnN8dW5rbm93bkRlZmluZXN8dXNlbGVzc0NvZGV8dmlzaWJpbGl0eX1cbiAqL1xudmpzLkNvbXBvbmVudC5wcm90b3R5cGUuYWRkQ2hpbGQgPSBmdW5jdGlvbihjaGlsZCwgb3B0aW9ucyl7XG4gIHZhciBjb21wb25lbnQsIGNvbXBvbmVudENsYXNzLCBjb21wb25lbnROYW1lLCBjb21wb25lbnRJZDtcblxuICAvLyBJZiBzdHJpbmcsIGNyZWF0ZSBuZXcgY29tcG9uZW50IHdpdGggb3B0aW9uc1xuICBpZiAodHlwZW9mIGNoaWxkID09PSAnc3RyaW5nJykge1xuXG4gICAgY29tcG9uZW50TmFtZSA9IGNoaWxkO1xuXG4gICAgLy8gTWFrZSBzdXJlIG9wdGlvbnMgaXMgYXQgbGVhc3QgYW4gZW1wdHkgb2JqZWN0IHRvIHByb3RlY3QgYWdhaW5zdCBlcnJvcnNcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIC8vIEFzc3VtZSBuYW1lIG9mIHNldCBpcyBhIGxvd2VyY2FzZWQgbmFtZSBvZiB0aGUgVUkgQ2xhc3MgKFBsYXlCdXR0b24sIGV0Yy4pXG4gICAgY29tcG9uZW50Q2xhc3MgPSBvcHRpb25zWydjb21wb25lbnRDbGFzcyddIHx8IHZqcy5jYXBpdGFsaXplKGNvbXBvbmVudE5hbWUpO1xuXG4gICAgLy8gU2V0IG5hbWUgdGhyb3VnaCBvcHRpb25zXG4gICAgb3B0aW9uc1snbmFtZSddID0gY29tcG9uZW50TmFtZTtcblxuICAgIC8vIENyZWF0ZSBhIG5ldyBvYmplY3QgJiBlbGVtZW50IGZvciB0aGlzIGNvbnRyb2xzIHNldFxuICAgIC8vIElmIHRoZXJlJ3Mgbm8gLnBsYXllcl8sIHRoaXMgaXMgYSBwbGF5ZXJcbiAgICAvLyBDbG9zdXJlIENvbXBpbGVyIHRocm93cyBhbiAnaW5jb21wbGV0ZSBhbGlhcycgd2FybmluZyBpZiB3ZSB1c2UgdGhlIHZqcyB2YXJpYWJsZSBkaXJlY3RseS5cbiAgICAvLyBFdmVyeSBjbGFzcyBzaG91bGQgYmUgZXhwb3J0ZWQsIHNvIHRoaXMgc2hvdWxkIG5ldmVyIGJlIGEgcHJvYmxlbSBoZXJlLlxuICAgIGNvbXBvbmVudCA9IG5ldyB3aW5kb3dbJ3ZpZGVvanMnXVtjb21wb25lbnRDbGFzc10odGhpcy5wbGF5ZXJfIHx8IHRoaXMsIG9wdGlvbnMpO1xuXG4gIC8vIGNoaWxkIGlzIGEgY29tcG9uZW50IGluc3RhbmNlXG4gIH0gZWxzZSB7XG4gICAgY29tcG9uZW50ID0gY2hpbGQ7XG4gIH1cblxuICB0aGlzLmNoaWxkcmVuXy5wdXNoKGNvbXBvbmVudCk7XG5cbiAgaWYgKHR5cGVvZiBjb21wb25lbnQuaWQgPT09ICdmdW5jdGlvbicpIHtcbiAgICB0aGlzLmNoaWxkSW5kZXhfW2NvbXBvbmVudC5pZCgpXSA9IGNvbXBvbmVudDtcbiAgfVxuXG4gIC8vIElmIGEgbmFtZSB3YXNuJ3QgdXNlZCB0byBjcmVhdGUgdGhlIGNvbXBvbmVudCwgY2hlY2sgaWYgd2UgY2FuIHVzZSB0aGVcbiAgLy8gbmFtZSBmdW5jdGlvbiBvZiB0aGUgY29tcG9uZW50XG4gIGNvbXBvbmVudE5hbWUgPSBjb21wb25lbnROYW1lIHx8IChjb21wb25lbnQubmFtZSAmJiBjb21wb25lbnQubmFtZSgpKTtcblxuICBpZiAoY29tcG9uZW50TmFtZSkge1xuICAgIHRoaXMuY2hpbGROYW1lSW5kZXhfW2NvbXBvbmVudE5hbWVdID0gY29tcG9uZW50O1xuICB9XG5cbiAgLy8gQWRkIHRoZSBVSSBvYmplY3QncyBlbGVtZW50IHRvIHRoZSBjb250YWluZXIgZGl2IChib3gpXG4gIC8vIEhhdmluZyBhbiBlbGVtZW50IGlzIG5vdCByZXF1aXJlZFxuICBpZiAodHlwZW9mIGNvbXBvbmVudFsnZWwnXSA9PT0gJ2Z1bmN0aW9uJyAmJiBjb21wb25lbnRbJ2VsJ10oKSkge1xuICAgIHRoaXMuY29udGVudEVsKCkuYXBwZW5kQ2hpbGQoY29tcG9uZW50WydlbCddKCkpO1xuICB9XG5cbiAgLy8gUmV0dXJuIHNvIGl0IGNhbiBzdG9yZWQgb24gcGFyZW50IG9iamVjdCBpZiBkZXNpcmVkLlxuICByZXR1cm4gY29tcG9uZW50O1xufTtcblxuLyoqXG4gKiBSZW1vdmUgYSBjaGlsZCBjb21wb25lbnQgZnJvbSB0aGlzIGNvbXBvbmVudCdzIGxpc3Qgb2YgY2hpbGRyZW4sIGFuZCB0aGVcbiAqIGNoaWxkIGNvbXBvbmVudCdzIGVsZW1lbnQgZnJvbSB0aGlzIGNvbXBvbmVudCdzIGVsZW1lbnRcbiAqXG4gKiBAcGFyYW0gIHt2anMuQ29tcG9uZW50fSBjb21wb25lbnQgQ29tcG9uZW50IHRvIHJlbW92ZVxuICovXG52anMuQ29tcG9uZW50LnByb3RvdHlwZS5yZW1vdmVDaGlsZCA9IGZ1bmN0aW9uKGNvbXBvbmVudCl7XG4gIGlmICh0eXBlb2YgY29tcG9uZW50ID09PSAnc3RyaW5nJykge1xuICAgIGNvbXBvbmVudCA9IHRoaXMuZ2V0Q2hpbGQoY29tcG9uZW50KTtcbiAgfVxuXG4gIGlmICghY29tcG9uZW50IHx8ICF0aGlzLmNoaWxkcmVuXykgcmV0dXJuO1xuXG4gIHZhciBjaGlsZEZvdW5kID0gZmFsc2U7XG4gIGZvciAodmFyIGkgPSB0aGlzLmNoaWxkcmVuXy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGlmICh0aGlzLmNoaWxkcmVuX1tpXSA9PT0gY29tcG9uZW50KSB7XG4gICAgICBjaGlsZEZvdW5kID0gdHJ1ZTtcbiAgICAgIHRoaXMuY2hpbGRyZW5fLnNwbGljZShpLDEpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFjaGlsZEZvdW5kKSByZXR1cm47XG5cbiAgdGhpcy5jaGlsZEluZGV4X1tjb21wb25lbnQuaWRdID0gbnVsbDtcbiAgdGhpcy5jaGlsZE5hbWVJbmRleF9bY29tcG9uZW50Lm5hbWVdID0gbnVsbDtcblxuICB2YXIgY29tcEVsID0gY29tcG9uZW50LmVsKCk7XG4gIGlmIChjb21wRWwgJiYgY29tcEVsLnBhcmVudE5vZGUgPT09IHRoaXMuY29udGVudEVsKCkpIHtcbiAgICB0aGlzLmNvbnRlbnRFbCgpLnJlbW92ZUNoaWxkKGNvbXBvbmVudC5lbCgpKTtcbiAgfVxufTtcblxuLyoqXG4gKiBBZGQgYW5kIGluaXRpYWxpemUgZGVmYXVsdCBjaGlsZCBjb21wb25lbnRzIGZyb20gb3B0aW9uc1xuICpcbiAqICAgICAvLyB3aGVuIGFuIGluc3RhbmNlIG9mIE15Q29tcG9uZW50IGlzIGNyZWF0ZWQsIGFsbCBjaGlsZHJlbiBpbiBvcHRpb25zXG4gKiAgICAgLy8gd2lsbCBiZSBhZGRlZCB0byB0aGUgaW5zdGFuY2UgYnkgdGhlaXIgbmFtZSBzdHJpbmdzIGFuZCBvcHRpb25zXG4gKiAgICAgTXlDb21wb25lbnQucHJvdG90eXBlLm9wdGlvbnNfLmNoaWxkcmVuID0ge1xuICogICAgICAgbXlDaGlsZENvbXBvbmVudDoge1xuICogICAgICAgICBteUNoaWxkT3B0aW9uOiB0cnVlXG4gKiAgICAgICB9XG4gKiAgICAgfVxuICovXG52anMuQ29tcG9uZW50LnByb3RvdHlwZS5pbml0Q2hpbGRyZW4gPSBmdW5jdGlvbigpe1xuICB2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9uc187XG5cbiAgaWYgKG9wdGlvbnMgJiYgb3B0aW9uc1snY2hpbGRyZW4nXSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIC8vIExvb3AgdGhyb3VnaCBjb21wb25lbnRzIGFuZCBhZGQgdGhlbSB0byB0aGUgcGxheWVyXG4gICAgdmpzLm9iai5lYWNoKG9wdGlvbnNbJ2NoaWxkcmVuJ10sIGZ1bmN0aW9uKG5hbWUsIG9wdHMpe1xuICAgICAgLy8gQWxsb3cgZm9yIGRpc2FibGluZyBkZWZhdWx0IGNvbXBvbmVudHNcbiAgICAgIC8vIGUuZy4gdmpzLm9wdGlvbnNbJ2NoaWxkcmVuJ11bJ3Bvc3RlckltYWdlJ10gPSBmYWxzZVxuICAgICAgaWYgKG9wdHMgPT09IGZhbHNlKSByZXR1cm47XG5cbiAgICAgIC8vIEFsbG93IHdhaXRpbmcgdG8gYWRkIGNvbXBvbmVudHMgdW50aWwgYSBzcGVjaWZpYyBldmVudCBpcyBjYWxsZWRcbiAgICAgIHZhciB0ZW1wQWRkID0gZnVuY3Rpb24oKXtcbiAgICAgICAgLy8gU2V0IHByb3BlcnR5IG5hbWUgb24gcGxheWVyLiBDb3VsZCBjYXVzZSBjb25mbGljdHMgd2l0aCBvdGhlciBwcm9wIG5hbWVzLCBidXQgaXQncyB3b3J0aCBtYWtpbmcgcmVmcyBlYXN5LlxuICAgICAgICBzZWxmW25hbWVdID0gc2VsZi5hZGRDaGlsZChuYW1lLCBvcHRzKTtcbiAgICAgIH07XG5cbiAgICAgIGlmIChvcHRzWydsb2FkRXZlbnQnXSkge1xuICAgICAgICAvLyB0aGlzLm9uZShvcHRzLmxvYWRFdmVudCwgdGVtcEFkZClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRlbXBBZGQoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufTtcblxuLyoqXG4gKiBBbGxvd3Mgc3ViIGNvbXBvbmVudHMgdG8gc3RhY2sgQ1NTIGNsYXNzIG5hbWVzXG4gKlxuICogQHJldHVybiB7U3RyaW5nfSBUaGUgY29uc3RydWN0ZWQgY2xhc3MgbmFtZVxuICovXG52anMuQ29tcG9uZW50LnByb3RvdHlwZS5idWlsZENTU0NsYXNzID0gZnVuY3Rpb24oKXtcbiAgICAvLyBDaGlsZCBjbGFzc2VzIGNhbiBpbmNsdWRlIGEgZnVuY3Rpb24gdGhhdCBkb2VzOlxuICAgIC8vIHJldHVybiAnQ0xBU1MgTkFNRScgKyB0aGlzLl9zdXBlcigpO1xuICAgIHJldHVybiAnJztcbn07XG5cbi8qIEV2ZW50c1xuPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi9cblxuLyoqXG4gKiBBZGQgYW4gZXZlbnQgbGlzdGVuZXIgdG8gdGhpcyBjb21wb25lbnQncyBlbGVtZW50XG4gKlxuICogICAgIHZhciBteUZ1bmMgPSBmdW5jdGlvbigpe1xuICogICAgICAgdmFyIG15UGxheWVyID0gdGhpcztcbiAqICAgICAgIC8vIERvIHNvbWV0aGluZyB3aGVuIHRoZSBldmVudCBpcyBmaXJlZFxuICogICAgIH07XG4gKlxuICogICAgIG15UGxheWVyLm9uKFwiZXZlbnROYW1lXCIsIG15RnVuYyk7XG4gKlxuICogVGhlIGNvbnRleHQgd2lsbCBiZSB0aGUgY29tcG9uZW50LlxuICpcbiAqIEBwYXJhbSAge1N0cmluZ30gICB0eXBlIFRoZSBldmVudCB0eXBlIGUuZy4gJ2NsaWNrJ1xuICogQHBhcmFtICB7RnVuY3Rpb259IGZuICAgVGhlIGV2ZW50IGxpc3RlbmVyXG4gKiBAcmV0dXJuIHt2anMuQ29tcG9uZW50fSBzZWxmXG4gKi9cbnZqcy5Db21wb25lbnQucHJvdG90eXBlLm9uID0gZnVuY3Rpb24odHlwZSwgZm4pe1xuICB2anMub24odGhpcy5lbF8sIHR5cGUsIHZqcy5iaW5kKHRoaXMsIGZuKSk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgYW4gZXZlbnQgbGlzdGVuZXIgZnJvbSB0aGUgY29tcG9uZW50J3MgZWxlbWVudFxuICpcbiAqICAgICBteUNvbXBvbmVudC5vZmYoXCJldmVudE5hbWVcIiwgbXlGdW5jKTtcbiAqXG4gKiBAcGFyYW0gIHtTdHJpbmc9fSAgIHR5cGUgRXZlbnQgdHlwZS4gV2l0aG91dCB0eXBlIGl0IHdpbGwgcmVtb3ZlIGFsbCBsaXN0ZW5lcnMuXG4gKiBAcGFyYW0gIHtGdW5jdGlvbj19IGZuICAgRXZlbnQgbGlzdGVuZXIuIFdpdGhvdXQgZm4gaXQgd2lsbCByZW1vdmUgYWxsIGxpc3RlbmVycyBmb3IgYSB0eXBlLlxuICogQHJldHVybiB7dmpzLkNvbXBvbmVudH1cbiAqL1xudmpzLkNvbXBvbmVudC5wcm90b3R5cGUub2ZmID0gZnVuY3Rpb24odHlwZSwgZm4pe1xuICB2anMub2ZmKHRoaXMuZWxfLCB0eXBlLCBmbik7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBZGQgYW4gZXZlbnQgbGlzdGVuZXIgdG8gYmUgdHJpZ2dlcmVkIG9ubHkgb25jZSBhbmQgdGhlbiByZW1vdmVkXG4gKlxuICogQHBhcmFtICB7U3RyaW5nfSAgIHR5cGUgRXZlbnQgdHlwZVxuICogQHBhcmFtICB7RnVuY3Rpb259IGZuICAgRXZlbnQgbGlzdGVuZXJcbiAqIEByZXR1cm4ge3Zqcy5Db21wb25lbnR9XG4gKi9cbnZqcy5Db21wb25lbnQucHJvdG90eXBlLm9uZSA9IGZ1bmN0aW9uKHR5cGUsIGZuKSB7XG4gIHZqcy5vbmUodGhpcy5lbF8sIHR5cGUsIHZqcy5iaW5kKHRoaXMsIGZuKSk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBUcmlnZ2VyIGFuIGV2ZW50IG9uIGFuIGVsZW1lbnRcbiAqXG4gKiAgICAgbXlDb21wb25lbnQudHJpZ2dlcignZXZlbnROYW1lJyk7XG4gKlxuICogQHBhcmFtICB7U3RyaW5nfSAgICAgICB0eXBlICBUaGUgZXZlbnQgdHlwZSB0byB0cmlnZ2VyLCBlLmcuICdjbGljaydcbiAqIEBwYXJhbSAge0V2ZW50fE9iamVjdH0gZXZlbnQgVGhlIGV2ZW50IG9iamVjdCB0byBiZSBwYXNzZWQgdG8gdGhlIGxpc3RlbmVyXG4gKiBAcmV0dXJuIHt2anMuQ29tcG9uZW50fSAgICAgIHNlbGZcbiAqL1xudmpzLkNvbXBvbmVudC5wcm90b3R5cGUudHJpZ2dlciA9IGZ1bmN0aW9uKHR5cGUsIGV2ZW50KXtcbiAgdmpzLnRyaWdnZXIodGhpcy5lbF8sIHR5cGUsIGV2ZW50KTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKiBSZWFkeVxuPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi9cbi8qKlxuICogSXMgdGhlIGNvbXBvbmVudCBsb2FkZWRcbiAqIFRoaXMgY2FuIG1lYW4gZGlmZmVyZW50IHRoaW5ncyBkZXBlbmRpbmcgb24gdGhlIGNvbXBvbmVudC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHR5cGUge0Jvb2xlYW59XG4gKi9cbnZqcy5Db21wb25lbnQucHJvdG90eXBlLmlzUmVhZHlfO1xuXG4vKipcbiAqIFRyaWdnZXIgcmVhZHkgYXMgc29vbiBhcyBpbml0aWFsaXphdGlvbiBpcyBmaW5pc2hlZFxuICpcbiAqIEFsbG93cyBmb3IgZGVsYXlpbmcgcmVhZHkuIE92ZXJyaWRlIG9uIGEgc3ViIGNsYXNzIHByb3RvdHlwZS5cbiAqIElmIHlvdSBzZXQgdGhpcy5pc1JlYWR5T25Jbml0RmluaXNoXyBpdCB3aWxsIGFmZmVjdCBhbGwgY29tcG9uZW50cy5cbiAqIFNwZWNpYWxseSB1c2VkIHdoZW4gd2FpdGluZyBmb3IgdGhlIEZsYXNoIHBsYXllciB0byBhc3luY2hybm91c2x5IGxvYWQuXG4gKlxuICogQHR5cGUge0Jvb2xlYW59XG4gKiBAcHJpdmF0ZVxuICovXG52anMuQ29tcG9uZW50LnByb3RvdHlwZS5pc1JlYWR5T25Jbml0RmluaXNoXyA9IHRydWU7XG5cbi8qKlxuICogTGlzdCBvZiByZWFkeSBsaXN0ZW5lcnNcbiAqXG4gKiBAdHlwZSB7QXJyYXl9XG4gKiBAcHJpdmF0ZVxuICovXG52anMuQ29tcG9uZW50LnByb3RvdHlwZS5yZWFkeVF1ZXVlXztcblxuLyoqXG4gKiBCaW5kIGEgbGlzdGVuZXIgdG8gdGhlIGNvbXBvbmVudCdzIHJlYWR5IHN0YXRlXG4gKlxuICogRGlmZmVyZW50IGZyb20gZXZlbnQgbGlzdGVuZXJzIGluIHRoYXQgaWYgdGhlIHJlYWR5IGV2ZW50IGhhcyBhbHJlYWR5IGhhcHBlbmRcbiAqIGl0IHdpbGwgdHJpZ2dlciB0aGUgZnVuY3Rpb24gaW1tZWRpYXRlbHkuXG4gKlxuICogQHBhcmFtICB7RnVuY3Rpb259IGZuIFJlYWR5IGxpc3RlbmVyXG4gKiBAcmV0dXJuIHt2anMuQ29tcG9uZW50fVxuICovXG52anMuQ29tcG9uZW50LnByb3RvdHlwZS5yZWFkeSA9IGZ1bmN0aW9uKGZuKXtcbiAgaWYgKGZuKSB7XG4gICAgaWYgKHRoaXMuaXNSZWFkeV8pIHtcbiAgICAgIGZuLmNhbGwodGhpcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGlzLnJlYWR5UXVldWVfID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy5yZWFkeVF1ZXVlXyA9IFtdO1xuICAgICAgfVxuICAgICAgdGhpcy5yZWFkeVF1ZXVlXy5wdXNoKGZuKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFRyaWdnZXIgdGhlIHJlYWR5IGxpc3RlbmVyc1xuICpcbiAqIEByZXR1cm4ge3Zqcy5Db21wb25lbnR9XG4gKi9cbnZqcy5Db21wb25lbnQucHJvdG90eXBlLnRyaWdnZXJSZWFkeSA9IGZ1bmN0aW9uKCl7XG4gIHRoaXMuaXNSZWFkeV8gPSB0cnVlO1xuXG4gIHZhciByZWFkeVF1ZXVlID0gdGhpcy5yZWFkeVF1ZXVlXztcblxuICBpZiAocmVhZHlRdWV1ZSAmJiByZWFkeVF1ZXVlLmxlbmd0aCA+IDApIHtcblxuICAgIGZvciAodmFyIGkgPSAwLCBqID0gcmVhZHlRdWV1ZS5sZW5ndGg7IGkgPCBqOyBpKyspIHtcbiAgICAgIHJlYWR5UXVldWVbaV0uY2FsbCh0aGlzKTtcbiAgICB9XG5cbiAgICAvLyBSZXNldCBSZWFkeSBRdWV1ZVxuICAgIHRoaXMucmVhZHlRdWV1ZV8gPSBbXTtcblxuICAgIC8vIEFsbG93IGZvciB1c2luZyBldmVudCBsaXN0ZW5lcnMgYWxzbywgaW4gY2FzZSB5b3Ugd2FudCB0byBkbyBzb21ldGhpbmcgZXZlcnl0aW1lIGEgc291cmNlIGlzIHJlYWR5LlxuICAgIHRoaXMudHJpZ2dlcigncmVhZHknKTtcbiAgfVxufTtcblxuLyogRGlzcGxheVxuPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi9cblxuLyoqXG4gKiBBZGQgYSBDU1MgY2xhc3MgbmFtZSB0byB0aGUgY29tcG9uZW50J3MgZWxlbWVudFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBjbGFzc1RvQWRkIENsYXNzbmFtZSB0byBhZGRcbiAqIEByZXR1cm4ge3Zqcy5Db21wb25lbnR9XG4gKi9cbnZqcy5Db21wb25lbnQucHJvdG90eXBlLmFkZENsYXNzID0gZnVuY3Rpb24oY2xhc3NUb0FkZCl7XG4gIHZqcy5hZGRDbGFzcyh0aGlzLmVsXywgY2xhc3NUb0FkZCk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgYSBDU1MgY2xhc3MgbmFtZSBmcm9tIHRoZSBjb21wb25lbnQncyBlbGVtZW50XG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGNsYXNzVG9SZW1vdmUgQ2xhc3NuYW1lIHRvIHJlbW92ZVxuICogQHJldHVybiB7dmpzLkNvbXBvbmVudH1cbiAqL1xudmpzLkNvbXBvbmVudC5wcm90b3R5cGUucmVtb3ZlQ2xhc3MgPSBmdW5jdGlvbihjbGFzc1RvUmVtb3ZlKXtcbiAgdmpzLnJlbW92ZUNsYXNzKHRoaXMuZWxfLCBjbGFzc1RvUmVtb3ZlKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFNob3cgdGhlIGNvbXBvbmVudCBlbGVtZW50IGlmIGhpZGRlblxuICpcbiAqIEByZXR1cm4ge3Zqcy5Db21wb25lbnR9XG4gKi9cbnZqcy5Db21wb25lbnQucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbigpe1xuICB0aGlzLmVsXy5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEhpZGUgdGhlIGNvbXBvbmVudCBlbGVtZW50IGlmIGhpZGRlblxuICpcbiAqIEByZXR1cm4ge3Zqcy5Db21wb25lbnR9XG4gKi9cbnZqcy5Db21wb25lbnQucHJvdG90eXBlLmhpZGUgPSBmdW5jdGlvbigpe1xuICB0aGlzLmVsXy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogTG9jayBhbiBpdGVtIGluIGl0cyB2aXNpYmxlIHN0YXRlXG4gKiBUbyBiZSB1c2VkIHdpdGggZmFkZUluL2ZhZGVPdXQuXG4gKlxuICogQHJldHVybiB7dmpzLkNvbXBvbmVudH1cbiAqIEBwcml2YXRlXG4gKi9cbnZqcy5Db21wb25lbnQucHJvdG90eXBlLmxvY2tTaG93aW5nID0gZnVuY3Rpb24oKXtcbiAgdGhpcy5hZGRDbGFzcygndmpzLWxvY2stc2hvd2luZycpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogVW5sb2NrIGFuIGl0ZW0gdG8gYmUgaGlkZGVuXG4gKiBUbyBiZSB1c2VkIHdpdGggZmFkZUluL2ZhZGVPdXQuXG4gKlxuICogQHJldHVybiB7dmpzLkNvbXBvbmVudH1cbiAqIEBwcml2YXRlXG4gKi9cbnZqcy5Db21wb25lbnQucHJvdG90eXBlLnVubG9ja1Nob3dpbmcgPSBmdW5jdGlvbigpe1xuICB0aGlzLnJlbW92ZUNsYXNzKCd2anMtbG9jay1zaG93aW5nJyk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBEaXNhYmxlIGNvbXBvbmVudCBieSBtYWtpbmcgaXQgdW5zaG93YWJsZVxuICovXG52anMuQ29tcG9uZW50LnByb3RvdHlwZS5kaXNhYmxlID0gZnVuY3Rpb24oKXtcbiAgdGhpcy5oaWRlKCk7XG4gIHRoaXMuc2hvdyA9IGZ1bmN0aW9uKCl7fTtcbn07XG5cbi8qKlxuICogU2V0IG9yIGdldCB0aGUgd2lkdGggb2YgdGhlIGNvbXBvbmVudCAoQ1NTIHZhbHVlcylcbiAqXG4gKiBWaWRlbyB0YWcgd2lkdGgvaGVpZ2h0IG9ubHkgd29yayBpbiBwaXhlbHMuIE5vIHBlcmNlbnRzLlxuICogQnV0IGFsbG93aW5nIGxpbWl0ZWQgcGVyY2VudHMgdXNlLiBlLmcuIHdpZHRoKCkgd2lsbCByZXR1cm4gbnVtYmVyKyUsIG5vdCBjb21wdXRlZCB3aWR0aFxuICpcbiAqIEBwYXJhbSAge051bWJlcnxTdHJpbmc9fSBudW0gICBPcHRpb25hbCB3aWR0aCBudW1iZXJcbiAqIEBwYXJhbSAge0Jvb2xlYW59IHNraXBMaXN0ZW5lcnMgU2tpcCB0aGUgJ3Jlc2l6ZScgZXZlbnQgdHJpZ2dlclxuICogQHJldHVybiB7dmpzLkNvbXBvbmVudH0gUmV0dXJucyAndGhpcycgaWYgd2lkdGggd2FzIHNldFxuICogQHJldHVybiB7TnVtYmVyfFN0cmluZ30gUmV0dXJucyB0aGUgd2lkdGggaWYgbm90aGluZyB3YXMgc2V0XG4gKi9cbnZqcy5Db21wb25lbnQucHJvdG90eXBlLndpZHRoID0gZnVuY3Rpb24obnVtLCBza2lwTGlzdGVuZXJzKXtcbiAgcmV0dXJuIHRoaXMuZGltZW5zaW9uKCd3aWR0aCcsIG51bSwgc2tpcExpc3RlbmVycyk7XG59O1xuXG4vKipcbiAqIEdldCBvciBzZXQgdGhlIGhlaWdodCBvZiB0aGUgY29tcG9uZW50IChDU1MgdmFsdWVzKVxuICpcbiAqIEBwYXJhbSAge051bWJlcnxTdHJpbmc9fSBudW0gICAgIE5ldyBjb21wb25lbnQgaGVpZ2h0XG4gKiBAcGFyYW0gIHtCb29sZWFuPX0gc2tpcExpc3RlbmVycyBTa2lwIHRoZSByZXNpemUgZXZlbnQgdHJpZ2dlclxuICogQHJldHVybiB7dmpzLkNvbXBvbmVudH0gVGhlIGNvbXBvbmVudCBpZiB0aGUgaGVpZ2h0IHdhcyBzZXRcbiAqIEByZXR1cm4ge051bWJlcnxTdHJpbmd9IFRoZSBoZWlnaHQgaWYgaXQgd2Fzbid0IHNldFxuICovXG52anMuQ29tcG9uZW50LnByb3RvdHlwZS5oZWlnaHQgPSBmdW5jdGlvbihudW0sIHNraXBMaXN0ZW5lcnMpe1xuICByZXR1cm4gdGhpcy5kaW1lbnNpb24oJ2hlaWdodCcsIG51bSwgc2tpcExpc3RlbmVycyk7XG59O1xuXG4vKipcbiAqIFNldCBib3RoIHdpZHRoIGFuZCBoZWlnaHQgYXQgdGhlIHNhbWUgdGltZVxuICpcbiAqIEBwYXJhbSAge051bWJlcnxTdHJpbmd9IHdpZHRoXG4gKiBAcGFyYW0gIHtOdW1iZXJ8U3RyaW5nfSBoZWlnaHRcbiAqIEByZXR1cm4ge3Zqcy5Db21wb25lbnR9IFRoZSBjb21wb25lbnRcbiAqL1xudmpzLkNvbXBvbmVudC5wcm90b3R5cGUuZGltZW5zaW9ucyA9IGZ1bmN0aW9uKHdpZHRoLCBoZWlnaHQpe1xuICAvLyBTa2lwIHJlc2l6ZSBsaXN0ZW5lcnMgb24gd2lkdGggZm9yIG9wdGltaXphdGlvblxuICByZXR1cm4gdGhpcy53aWR0aCh3aWR0aCwgdHJ1ZSkuaGVpZ2h0KGhlaWdodCk7XG59O1xuXG4vKipcbiAqIEdldCBvciBzZXQgd2lkdGggb3IgaGVpZ2h0XG4gKlxuICogVGhpcyBpcyB0aGUgc2hhcmVkIGNvZGUgZm9yIHRoZSB3aWR0aCgpIGFuZCBoZWlnaHQoKSBtZXRob2RzLlxuICogQWxsIGZvciBhbiBpbnRlZ2VyLCBpbnRlZ2VyICsgJ3B4JyBvciBpbnRlZ2VyICsgJyUnO1xuICpcbiAqIEtub3duIGlzc3VlOiBIaWRkZW4gZWxlbWVudHMgb2ZmaWNpYWxseSBoYXZlIGEgd2lkdGggb2YgMC4gV2UncmUgZGVmYXVsdGluZ1xuICogdG8gdGhlIHN0eWxlLndpZHRoIHZhbHVlIGFuZCBmYWxsaW5nIGJhY2sgdG8gY29tcHV0ZWRTdHlsZSB3aGljaCBoYXMgdGhlXG4gKiBoaWRkZW4gZWxlbWVudCBpc3N1ZS4gSW5mbywgYnV0IHByb2JhYmx5IG5vdCBhbiBlZmZpY2llbnQgZml4OlxuICogaHR0cDovL3d3dy5mb2xpb3Rlay5jb20vZGV2YmxvZy9nZXR0aW5nLXRoZS13aWR0aC1vZi1hLWhpZGRlbi1lbGVtZW50LXdpdGgtanF1ZXJ5LXVzaW5nLXdpZHRoL1xuICpcbiAqIEBwYXJhbSAge1N0cmluZ30gd2lkdGhPckhlaWdodCAgJ3dpZHRoJyBvciAnaGVpZ2h0J1xuICogQHBhcmFtICB7TnVtYmVyfFN0cmluZz19IG51bSAgICAgTmV3IGRpbWVuc2lvblxuICogQHBhcmFtICB7Qm9vbGVhbj19IHNraXBMaXN0ZW5lcnMgU2tpcCByZXNpemUgZXZlbnQgdHJpZ2dlclxuICogQHJldHVybiB7dmpzLkNvbXBvbmVudH0gVGhlIGNvbXBvbmVudCBpZiBhIGRpbWVuc2lvbiB3YXMgc2V0XG4gKiBAcmV0dXJuIHtOdW1iZXJ8U3RyaW5nfSBUaGUgZGltZW5zaW9uIGlmIG5vdGhpbmcgd2FzIHNldFxuICogQHByaXZhdGVcbiAqL1xudmpzLkNvbXBvbmVudC5wcm90b3R5cGUuZGltZW5zaW9uID0gZnVuY3Rpb24od2lkdGhPckhlaWdodCwgbnVtLCBza2lwTGlzdGVuZXJzKXtcbiAgaWYgKG51bSAhPT0gdW5kZWZpbmVkKSB7XG5cbiAgICAvLyBDaGVjayBpZiB1c2luZyBjc3Mgd2lkdGgvaGVpZ2h0ICglIG9yIHB4KSBhbmQgYWRqdXN0XG4gICAgaWYgKCgnJytudW0pLmluZGV4T2YoJyUnKSAhPT0gLTEgfHwgKCcnK251bSkuaW5kZXhPZigncHgnKSAhPT0gLTEpIHtcbiAgICAgIHRoaXMuZWxfLnN0eWxlW3dpZHRoT3JIZWlnaHRdID0gbnVtO1xuICAgIH0gZWxzZSBpZiAobnVtID09PSAnYXV0bycpIHtcbiAgICAgIHRoaXMuZWxfLnN0eWxlW3dpZHRoT3JIZWlnaHRdID0gJyc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZWxfLnN0eWxlW3dpZHRoT3JIZWlnaHRdID0gbnVtKydweCc7XG4gICAgfVxuXG4gICAgLy8gc2tpcExpc3RlbmVycyBhbGxvd3MgdXMgdG8gYXZvaWQgdHJpZ2dlcmluZyB0aGUgcmVzaXplIGV2ZW50IHdoZW4gc2V0dGluZyBib3RoIHdpZHRoIGFuZCBoZWlnaHRcbiAgICBpZiAoIXNraXBMaXN0ZW5lcnMpIHsgdGhpcy50cmlnZ2VyKCdyZXNpemUnKTsgfVxuXG4gICAgLy8gUmV0dXJuIGNvbXBvbmVudFxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gTm90IHNldHRpbmcgYSB2YWx1ZSwgc28gZ2V0dGluZyBpdFxuICAvLyBNYWtlIHN1cmUgZWxlbWVudCBleGlzdHNcbiAgaWYgKCF0aGlzLmVsXykgcmV0dXJuIDA7XG5cbiAgLy8gR2V0IGRpbWVuc2lvbiB2YWx1ZSBmcm9tIHN0eWxlXG4gIHZhciB2YWwgPSB0aGlzLmVsXy5zdHlsZVt3aWR0aE9ySGVpZ2h0XTtcbiAgdmFyIHB4SW5kZXggPSB2YWwuaW5kZXhPZigncHgnKTtcbiAgaWYgKHB4SW5kZXggIT09IC0xKSB7XG4gICAgLy8gUmV0dXJuIHRoZSBwaXhlbCB2YWx1ZSB3aXRoIG5vICdweCdcbiAgICByZXR1cm4gcGFyc2VJbnQodmFsLnNsaWNlKDAscHhJbmRleCksIDEwKTtcblxuICAvLyBObyBweCBzbyB1c2luZyAlIG9yIG5vIHN0eWxlIHdhcyBzZXQsIHNvIGZhbGxpbmcgYmFjayB0byBvZmZzZXRXaWR0aC9oZWlnaHRcbiAgLy8gSWYgY29tcG9uZW50IGhhcyBkaXNwbGF5Om5vbmUsIG9mZnNldCB3aWxsIHJldHVybiAwXG4gIC8vIFRPRE86IGhhbmRsZSBkaXNwbGF5Om5vbmUgYW5kIG5vIGRpbWVuc2lvbiBzdHlsZSB1c2luZyBweFxuICB9IGVsc2Uge1xuXG4gICAgcmV0dXJuIHBhcnNlSW50KHRoaXMuZWxfWydvZmZzZXQnK3Zqcy5jYXBpdGFsaXplKHdpZHRoT3JIZWlnaHQpXSwgMTApO1xuXG4gICAgLy8gQ29tcHV0ZWRTdHlsZSB2ZXJzaW9uLlxuICAgIC8vIE9ubHkgZGlmZmVyZW5jZSBpcyBpZiB0aGUgZWxlbWVudCBpcyBoaWRkZW4gaXQgd2lsbCByZXR1cm5cbiAgICAvLyB0aGUgcGVyY2VudCB2YWx1ZSAoZS5nLiAnMTAwJScnKVxuICAgIC8vIGluc3RlYWQgb2YgemVybyBsaWtlIG9mZnNldFdpZHRoIHJldHVybnMuXG4gICAgLy8gdmFyIHZhbCA9IHZqcy5nZXRDb21wdXRlZFN0eWxlVmFsdWUodGhpcy5lbF8sIHdpZHRoT3JIZWlnaHQpO1xuICAgIC8vIHZhciBweEluZGV4ID0gdmFsLmluZGV4T2YoJ3B4Jyk7XG5cbiAgICAvLyBpZiAocHhJbmRleCAhPT0gLTEpIHtcbiAgICAvLyAgIHJldHVybiB2YWwuc2xpY2UoMCwgcHhJbmRleCk7XG4gICAgLy8gfSBlbHNlIHtcbiAgICAvLyAgIHJldHVybiB2YWw7XG4gICAgLy8gfVxuICB9XG59O1xuXG4vKipcbiAqIEZpcmVkIHdoZW4gdGhlIHdpZHRoIGFuZC9vciBoZWlnaHQgb2YgdGhlIGNvbXBvbmVudCBjaGFuZ2VzXG4gKiBAZXZlbnQgcmVzaXplXG4gKi9cbnZqcy5Db21wb25lbnQucHJvdG90eXBlLm9uUmVzaXplO1xuXG4vKipcbiAqIEVtaXQgJ3RhcCcgZXZlbnRzIHdoZW4gdG91Y2ggZXZlbnRzIGFyZSBzdXBwb3J0ZWRcbiAqXG4gKiBUaGlzIGlzIHVzZWQgdG8gc3VwcG9ydCB0b2dnbGluZyB0aGUgY29udHJvbHMgdGhyb3VnaCBhIHRhcCBvbiB0aGUgdmlkZW8uXG4gKlxuICogV2UncmUgcmVxdWlyZWluZyB0aGVtIHRvIGJlIGVuYWJsZWQgYmVjYXVzZSBvdGhlcndpc2UgZXZlcnkgY29tcG9uZW50IHdvdWxkXG4gKiBoYXZlIHRoaXMgZXh0cmEgb3ZlcmhlYWQgdW5uZWNlc3NhcmlseSwgb24gbW9iaWxlIGRldmljZXMgd2hlcmUgZXh0cmFcbiAqIG92ZXJoZWFkIGlzIGVzcGVjaWFsbHkgYmFkLlxuICogQHByaXZhdGVcbiAqL1xudmpzLkNvbXBvbmVudC5wcm90b3R5cGUuZW1pdFRhcEV2ZW50cyA9IGZ1bmN0aW9uKCl7XG4gIHZhciB0b3VjaFN0YXJ0LCB0b3VjaFRpbWUsIGNvdWxkQmVUYXAsIG5vVGFwO1xuXG4gIC8vIFRyYWNrIHRoZSBzdGFydCB0aW1lIHNvIHdlIGNhbiBkZXRlcm1pbmUgaG93IGxvbmcgdGhlIHRvdWNoIGxhc3RlZFxuICB0b3VjaFN0YXJ0ID0gMDtcblxuICB0aGlzLm9uKCd0b3VjaHN0YXJ0JywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAvLyBSZWNvcmQgc3RhcnQgdGltZSBzbyB3ZSBjYW4gZGV0ZWN0IGEgdGFwIHZzLiBcInRvdWNoIGFuZCBob2xkXCJcbiAgICB0b3VjaFN0YXJ0ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgLy8gUmVzZXQgY291bGRCZVRhcCB0cmFja2luZ1xuICAgIGNvdWxkQmVUYXAgPSB0cnVlO1xuICB9KTtcblxuICBub1RhcCA9IGZ1bmN0aW9uKCl7XG4gICAgY291bGRCZVRhcCA9IGZhbHNlO1xuICB9O1xuICAvLyBUT0RPOiBMaXN0ZW4gdG8gdGhlIG9yaWdpbmFsIHRhcmdldC4gaHR0cDovL3lvdXR1LmJlL0R1amZwWE9LVXA4P3Q9MTNtOHNcbiAgdGhpcy5vbigndG91Y2htb3ZlJywgbm9UYXApO1xuICB0aGlzLm9uKCd0b3VjaGxlYXZlJywgbm9UYXApO1xuICB0aGlzLm9uKCd0b3VjaGNhbmNlbCcsIG5vVGFwKTtcblxuICAvLyBXaGVuIHRoZSB0b3VjaCBlbmRzLCBtZWFzdXJlIGhvdyBsb25nIGl0IHRvb2sgYW5kIHRyaWdnZXIgdGhlIGFwcHJvcHJpYXRlXG4gIC8vIGV2ZW50XG4gIHRoaXMub24oJ3RvdWNoZW5kJywgZnVuY3Rpb24oKSB7XG4gICAgLy8gUHJvY2VlZCBvbmx5IGlmIHRoZSB0b3VjaG1vdmUvbGVhdmUvY2FuY2VsIGV2ZW50IGRpZG4ndCBoYXBwZW5cbiAgICBpZiAoY291bGRCZVRhcCA9PT0gdHJ1ZSkge1xuICAgICAgLy8gTWVhc3VyZSBob3cgbG9uZyB0aGUgdG91Y2ggbGFzdGVkXG4gICAgICB0b3VjaFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIHRvdWNoU3RhcnQ7XG4gICAgICAvLyBUaGUgdG91Y2ggbmVlZHMgdG8gYmUgcXVpY2sgaW4gb3JkZXIgdG8gY29uc2lkZXIgaXQgYSB0YXBcbiAgICAgIGlmICh0b3VjaFRpbWUgPCAyNTApIHtcbiAgICAgICAgdGhpcy50cmlnZ2VyKCd0YXAnKTtcbiAgICAgICAgLy8gSXQgbWF5IGJlIGdvb2QgdG8gY29weSB0aGUgdG91Y2hlbmQgZXZlbnQgb2JqZWN0IGFuZCBjaGFuZ2UgdGhlXG4gICAgICAgIC8vIHR5cGUgdG8gdGFwLCBpZiB0aGUgb3RoZXIgZXZlbnQgcHJvcGVydGllcyBhcmVuJ3QgZXhhY3QgYWZ0ZXJcbiAgICAgICAgLy8gdmpzLmZpeEV2ZW50IHJ1bnMgKGUuZy4gZXZlbnQudGFyZ2V0KVxuICAgICAgfVxuICAgIH1cbiAgfSk7XG59O1xuLyogQnV0dG9uIC0gQmFzZSBjbGFzcyBmb3IgYWxsIGJ1dHRvbnNcbj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovXG4vKipcbiAqIEJhc2UgY2xhc3MgZm9yIGFsbCBidXR0b25zXG4gKiBAcGFyYW0ge3Zqcy5QbGF5ZXJ8T2JqZWN0fSBwbGF5ZXJcbiAqIEBwYXJhbSB7T2JqZWN0PX0gb3B0aW9uc1xuICogQGNsYXNzXG4gKiBAY29uc3RydWN0b3JcbiAqL1xudmpzLkJ1dHRvbiA9IHZqcy5Db21wb25lbnQuZXh0ZW5kKHtcbiAgLyoqXG4gICAqIEBjb25zdHJ1Y3RvclxuICAgKiBAaW5oZXJpdERvY1xuICAgKi9cbiAgaW5pdDogZnVuY3Rpb24ocGxheWVyLCBvcHRpb25zKXtcbiAgICB2anMuQ29tcG9uZW50LmNhbGwodGhpcywgcGxheWVyLCBvcHRpb25zKTtcblxuICAgIHZhciB0b3VjaHN0YXJ0ID0gZmFsc2U7XG4gICAgdGhpcy5vbigndG91Y2hzdGFydCcsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAvLyBTdG9wIGNsaWNrIGFuZCBvdGhlciBtb3VzZSBldmVudHMgZnJvbSB0cmlnZ2VyaW5nIGFsc29cbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB0b3VjaHN0YXJ0ID0gdHJ1ZTtcbiAgICB9KTtcbiAgICB0aGlzLm9uKCd0b3VjaG1vdmUnLCBmdW5jdGlvbigpIHtcbiAgICAgIHRvdWNoc3RhcnQgPSBmYWxzZTtcbiAgICB9KTtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5vbigndG91Y2hlbmQnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgaWYgKHRvdWNoc3RhcnQpIHtcbiAgICAgICAgc2VsZi5vbkNsaWNrKGV2ZW50KTtcbiAgICAgIH1cbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLm9uKCdjbGljaycsIHRoaXMub25DbGljayk7XG4gICAgdGhpcy5vbignZm9jdXMnLCB0aGlzLm9uRm9jdXMpO1xuICAgIHRoaXMub24oJ2JsdXInLCB0aGlzLm9uQmx1cik7XG4gIH1cbn0pO1xuXG52anMuQnV0dG9uLnByb3RvdHlwZS5jcmVhdGVFbCA9IGZ1bmN0aW9uKHR5cGUsIHByb3BzKXtcbiAgLy8gQWRkIHN0YW5kYXJkIEFyaWEgYW5kIFRhYmluZGV4IGluZm9cbiAgcHJvcHMgPSB2anMub2JqLm1lcmdlKHtcbiAgICBjbGFzc05hbWU6IHRoaXMuYnVpbGRDU1NDbGFzcygpLFxuICAgIGlubmVySFRNTDogJzxkaXYgY2xhc3M9XCJ2anMtY29udHJvbC1jb250ZW50XCI+PHNwYW4gY2xhc3M9XCJ2anMtY29udHJvbC10ZXh0XCI+JyArICh0aGlzLmJ1dHRvblRleHQgfHwgJ05lZWQgVGV4dCcpICsgJzwvc3Bhbj48L2Rpdj4nLFxuICAgIHJvbGU6ICdidXR0b24nLFxuICAgICdhcmlhLWxpdmUnOiAncG9saXRlJywgLy8gbGV0IHRoZSBzY3JlZW4gcmVhZGVyIHVzZXIga25vdyB0aGF0IHRoZSB0ZXh0IG9mIHRoZSBidXR0b24gbWF5IGNoYW5nZVxuICAgIHRhYkluZGV4OiAwXG4gIH0sIHByb3BzKTtcblxuICByZXR1cm4gdmpzLkNvbXBvbmVudC5wcm90b3R5cGUuY3JlYXRlRWwuY2FsbCh0aGlzLCB0eXBlLCBwcm9wcyk7XG59O1xuXG52anMuQnV0dG9uLnByb3RvdHlwZS5idWlsZENTU0NsYXNzID0gZnVuY3Rpb24oKXtcbiAgLy8gVE9ETzogQ2hhbmdlIHZqcy1jb250cm9sIHRvIHZqcy1idXR0b24/XG4gIHJldHVybiAndmpzLWNvbnRyb2wgJyArIHZqcy5Db21wb25lbnQucHJvdG90eXBlLmJ1aWxkQ1NTQ2xhc3MuY2FsbCh0aGlzKTtcbn07XG5cbiAgLy8gQ2xpY2sgLSBPdmVycmlkZSB3aXRoIHNwZWNpZmljIGZ1bmN0aW9uYWxpdHkgZm9yIGJ1dHRvblxudmpzLkJ1dHRvbi5wcm90b3R5cGUub25DbGljayA9IGZ1bmN0aW9uKCl7fTtcblxuICAvLyBGb2N1cyAtIEFkZCBrZXlib2FyZCBmdW5jdGlvbmFsaXR5IHRvIGVsZW1lbnRcbnZqcy5CdXR0b24ucHJvdG90eXBlLm9uRm9jdXMgPSBmdW5jdGlvbigpe1xuICB2anMub24oZG9jdW1lbnQsICdrZXl1cCcsIHZqcy5iaW5kKHRoaXMsIHRoaXMub25LZXlQcmVzcykpO1xufTtcblxuICAvLyBLZXlQcmVzcyAoZG9jdW1lbnQgbGV2ZWwpIC0gVHJpZ2dlciBjbGljayB3aGVuIGtleXMgYXJlIHByZXNzZWRcbnZqcy5CdXR0b24ucHJvdG90eXBlLm9uS2V5UHJlc3MgPSBmdW5jdGlvbihldmVudCl7XG4gIC8vIENoZWNrIGZvciBzcGFjZSBiYXIgKDMyKSBvciBlbnRlciAoMTMpIGtleXNcbiAgaWYgKGV2ZW50LndoaWNoID09IDMyIHx8IGV2ZW50LndoaWNoID09IDEzKSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB0aGlzLm9uQ2xpY2soKTtcbiAgfVxufTtcblxuLy8gQmx1ciAtIFJlbW92ZSBrZXlib2FyZCB0cmlnZ2Vyc1xudmpzLkJ1dHRvbi5wcm90b3R5cGUub25CbHVyID0gZnVuY3Rpb24oKXtcbiAgdmpzLm9mZihkb2N1bWVudCwgJ2tleXVwJywgdmpzLmJpbmQodGhpcywgdGhpcy5vbktleVByZXNzKSk7XG59O1xuLyogU2xpZGVyXG49PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqL1xuLyoqXG4gKiBUaGUgYmFzZSBmdW5jdGlvbmFsaXR5IGZvciBzbGlkZXJzIGxpa2UgdGhlIHZvbHVtZSBiYXIgYW5kIHNlZWsgYmFyXG4gKlxuICogQHBhcmFtIHt2anMuUGxheWVyfE9iamVjdH0gcGxheWVyXG4gKiBAcGFyYW0ge09iamVjdD19IG9wdGlvbnNcbiAqIEBjb25zdHJ1Y3RvclxuICovXG52anMuU2xpZGVyID0gdmpzLkNvbXBvbmVudC5leHRlbmQoe1xuICAvKiogQGNvbnN0cnVjdG9yICovXG4gIGluaXQ6IGZ1bmN0aW9uKHBsYXllciwgb3B0aW9ucyl7XG4gICAgdmpzLkNvbXBvbmVudC5jYWxsKHRoaXMsIHBsYXllciwgb3B0aW9ucyk7XG5cbiAgICAvLyBTZXQgcHJvcGVydHkgbmFtZXMgdG8gYmFyIGFuZCBoYW5kbGUgdG8gbWF0Y2ggd2l0aCB0aGUgY2hpbGQgU2xpZGVyIGNsYXNzIGlzIGxvb2tpbmcgZm9yXG4gICAgdGhpcy5iYXIgPSB0aGlzLmdldENoaWxkKHRoaXMub3B0aW9uc19bJ2Jhck5hbWUnXSk7XG4gICAgdGhpcy5oYW5kbGUgPSB0aGlzLmdldENoaWxkKHRoaXMub3B0aW9uc19bJ2hhbmRsZU5hbWUnXSk7XG5cbiAgICBwbGF5ZXIub24odGhpcy5wbGF5ZXJFdmVudCwgdmpzLmJpbmQodGhpcywgdGhpcy51cGRhdGUpKTtcblxuICAgIHRoaXMub24oJ21vdXNlZG93bicsIHRoaXMub25Nb3VzZURvd24pO1xuICAgIHRoaXMub24oJ3RvdWNoc3RhcnQnLCB0aGlzLm9uTW91c2VEb3duKTtcbiAgICB0aGlzLm9uKCdmb2N1cycsIHRoaXMub25Gb2N1cyk7XG4gICAgdGhpcy5vbignYmx1cicsIHRoaXMub25CbHVyKTtcbiAgICB0aGlzLm9uKCdjbGljaycsIHRoaXMub25DbGljayk7XG5cbiAgICB0aGlzLnBsYXllcl8ub24oJ2NvbnRyb2xzdmlzaWJsZScsIHZqcy5iaW5kKHRoaXMsIHRoaXMudXBkYXRlKSk7XG5cbiAgICAvLyBUaGlzIGlzIGFjdHVhbGx5IHRvIGZpeCB0aGUgdm9sdW1lIGhhbmRsZSBwb3NpdGlvbi4gaHR0cDovL3R3aXR0ZXIuY29tLyMhL2dlcnJpdHZhbmFha2VuL3N0YXR1cy8xNTkwNDYyNTQ1MTk3ODc1MjBcbiAgICAvLyB0aGlzLnBsYXllcl8ub25lKCd0aW1ldXBkYXRlJywgdmpzLmJpbmQodGhpcywgdGhpcy51cGRhdGUpKTtcblxuICAgIHBsYXllci5yZWFkeSh2anMuYmluZCh0aGlzLCB0aGlzLnVwZGF0ZSkpO1xuXG4gICAgdGhpcy5ib3VuZEV2ZW50cyA9IHt9O1xuICB9XG59KTtcblxudmpzLlNsaWRlci5wcm90b3R5cGUuY3JlYXRlRWwgPSBmdW5jdGlvbih0eXBlLCBwcm9wcykge1xuICBwcm9wcyA9IHByb3BzIHx8IHt9O1xuICAvLyBBZGQgdGhlIHNsaWRlciBlbGVtZW50IGNsYXNzIHRvIGFsbCBzdWIgY2xhc3Nlc1xuICBwcm9wcy5jbGFzc05hbWUgPSBwcm9wcy5jbGFzc05hbWUgKyAnIHZqcy1zbGlkZXInO1xuICBwcm9wcyA9IHZqcy5vYmoubWVyZ2Uoe1xuICAgIHJvbGU6ICdzbGlkZXInLFxuICAgICdhcmlhLXZhbHVlbm93JzogMCxcbiAgICAnYXJpYS12YWx1ZW1pbic6IDAsXG4gICAgJ2FyaWEtdmFsdWVtYXgnOiAxMDAsXG4gICAgdGFiSW5kZXg6IDBcbiAgfSwgcHJvcHMpO1xuXG4gIHJldHVybiB2anMuQ29tcG9uZW50LnByb3RvdHlwZS5jcmVhdGVFbC5jYWxsKHRoaXMsIHR5cGUsIHByb3BzKTtcbn07XG5cbnZqcy5TbGlkZXIucHJvdG90eXBlLm9uTW91c2VEb3duID0gZnVuY3Rpb24oZXZlbnQpe1xuICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICB2anMuYmxvY2tUZXh0U2VsZWN0aW9uKCk7XG5cbiAgdGhpcy5ib3VuZEV2ZW50cy5tb3ZlID0gdmpzLmJpbmQodGhpcywgdGhpcy5vbk1vdXNlTW92ZSk7XG4gIHRoaXMuYm91bmRFdmVudHMuZW5kID0gdmpzLmJpbmQodGhpcywgdGhpcy5vbk1vdXNlVXApO1xuXG4gIHZqcy5vbihkb2N1bWVudCwgJ21vdXNlbW92ZScsIHRoaXMuYm91bmRFdmVudHMubW92ZSk7XG4gIHZqcy5vbihkb2N1bWVudCwgJ21vdXNldXAnLCB0aGlzLmJvdW5kRXZlbnRzLmVuZCk7XG4gIHZqcy5vbihkb2N1bWVudCwgJ3RvdWNobW92ZScsIHRoaXMuYm91bmRFdmVudHMubW92ZSk7XG4gIHZqcy5vbihkb2N1bWVudCwgJ3RvdWNoZW5kJywgdGhpcy5ib3VuZEV2ZW50cy5lbmQpO1xuXG4gIHRoaXMub25Nb3VzZU1vdmUoZXZlbnQpO1xufTtcblxudmpzLlNsaWRlci5wcm90b3R5cGUub25Nb3VzZVVwID0gZnVuY3Rpb24oKSB7XG4gIHZqcy51bmJsb2NrVGV4dFNlbGVjdGlvbigpO1xuICB2anMub2ZmKGRvY3VtZW50LCAnbW91c2Vtb3ZlJywgdGhpcy5ib3VuZEV2ZW50cy5tb3ZlLCBmYWxzZSk7XG4gIHZqcy5vZmYoZG9jdW1lbnQsICdtb3VzZXVwJywgdGhpcy5ib3VuZEV2ZW50cy5lbmQsIGZhbHNlKTtcbiAgdmpzLm9mZihkb2N1bWVudCwgJ3RvdWNobW92ZScsIHRoaXMuYm91bmRFdmVudHMubW92ZSwgZmFsc2UpO1xuICB2anMub2ZmKGRvY3VtZW50LCAndG91Y2hlbmQnLCB0aGlzLmJvdW5kRXZlbnRzLmVuZCwgZmFsc2UpO1xuXG4gIHRoaXMudXBkYXRlKCk7XG59O1xuXG52anMuU2xpZGVyLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbigpe1xuICAvLyBJbiBWb2x1bWVCYXIgaW5pdCB3ZSBoYXZlIGEgc2V0VGltZW91dCBmb3IgdXBkYXRlIHRoYXQgcG9wcyBhbmQgdXBkYXRlIHRvIHRoZSBlbmQgb2YgdGhlXG4gIC8vIGV4ZWN1dGlvbiBzdGFjay4gVGhlIHBsYXllciBpcyBkZXN0cm95ZWQgYmVmb3JlIHRoZW4gdXBkYXRlIHdpbGwgY2F1c2UgYW4gZXJyb3JcbiAgaWYgKCF0aGlzLmVsXykgcmV0dXJuO1xuXG4gIC8vIElmIHNjcnViYmluZywgd2UgY291bGQgdXNlIGEgY2FjaGVkIHZhbHVlIHRvIG1ha2UgdGhlIGhhbmRsZSBrZWVwIHVwIHdpdGggdGhlIHVzZXIncyBtb3VzZS5cbiAgLy8gT24gSFRNTDUgYnJvd3NlcnMgc2NydWJiaW5nIGlzIHJlYWxseSBzbW9vdGgsIGJ1dCBzb21lIGZsYXNoIHBsYXllcnMgYXJlIHNsb3csIHNvIHdlIG1pZ2h0IHdhbnQgdG8gdXRpbGl6ZSB0aGlzIGxhdGVyLlxuICAvLyB2YXIgcHJvZ3Jlc3MgPSAgKHRoaXMucGxheWVyXy5zY3J1YmJpbmcpID8gdGhpcy5wbGF5ZXJfLmdldENhY2hlKCkuY3VycmVudFRpbWUgLyB0aGlzLnBsYXllcl8uZHVyYXRpb24oKSA6IHRoaXMucGxheWVyXy5jdXJyZW50VGltZSgpIC8gdGhpcy5wbGF5ZXJfLmR1cmF0aW9uKCk7XG5cbiAgdmFyIGJhclByb2dyZXNzLFxuICAgICAgcHJvZ3Jlc3MgPSB0aGlzLmdldFBlcmNlbnQoKSxcbiAgICAgIGhhbmRsZSA9IHRoaXMuaGFuZGxlLFxuICAgICAgYmFyID0gdGhpcy5iYXI7XG5cbiAgLy8gUHJvdGVjdCBhZ2FpbnN0IG5vIGR1cmF0aW9uIGFuZCBvdGhlciBkaXZpc2lvbiBpc3N1ZXNcbiAgaWYgKGlzTmFOKHByb2dyZXNzKSkgeyBwcm9ncmVzcyA9IDA7IH1cblxuICBiYXJQcm9ncmVzcyA9IHByb2dyZXNzO1xuXG4gIC8vIElmIHRoZXJlIGlzIGEgaGFuZGxlLCB3ZSBuZWVkIHRvIGFjY291bnQgZm9yIHRoZSBoYW5kbGUgaW4gb3VyIGNhbGN1bGF0aW9uIGZvciBwcm9ncmVzcyBiYXJcbiAgLy8gc28gdGhhdCBpdCBkb2Vzbid0IGZhbGwgc2hvcnQgb2Ygb3IgZXh0ZW5kIHBhc3QgdGhlIGhhbmRsZS5cbiAgaWYgKGhhbmRsZSkge1xuXG4gICAgdmFyIGJveCA9IHRoaXMuZWxfLFxuICAgICAgICBib3hXaWR0aCA9IGJveC5vZmZzZXRXaWR0aCxcblxuICAgICAgICBoYW5kbGVXaWR0aCA9IGhhbmRsZS5lbCgpLm9mZnNldFdpZHRoLFxuXG4gICAgICAgIC8vIFRoZSB3aWR0aCBvZiB0aGUgaGFuZGxlIGluIHBlcmNlbnQgb2YgdGhlIGNvbnRhaW5pbmcgYm94XG4gICAgICAgIC8vIEluIElFLCB3aWR0aHMgbWF5IG5vdCBiZSByZWFkeSB5ZXQgY2F1c2luZyBOYU5cbiAgICAgICAgaGFuZGxlUGVyY2VudCA9IChoYW5kbGVXaWR0aCkgPyBoYW5kbGVXaWR0aCAvIGJveFdpZHRoIDogMCxcblxuICAgICAgICAvLyBHZXQgdGhlIGFkanVzdGVkIHNpemUgb2YgdGhlIGJveCwgY29uc2lkZXJpbmcgdGhhdCB0aGUgaGFuZGxlJ3MgY2VudGVyIG5ldmVyIHRvdWNoZXMgdGhlIGxlZnQgb3IgcmlnaHQgc2lkZS5cbiAgICAgICAgLy8gVGhlcmUgaXMgYSBtYXJnaW4gb2YgaGFsZiB0aGUgaGFuZGxlJ3Mgd2lkdGggb24gYm90aCBzaWRlcy5cbiAgICAgICAgYm94QWRqdXN0ZWRQZXJjZW50ID0gMSAtIGhhbmRsZVBlcmNlbnQsXG5cbiAgICAgICAgLy8gQWRqdXN0IHRoZSBwcm9ncmVzcyB0aGF0IHdlJ2xsIHVzZSB0byBzZXQgd2lkdGhzIHRvIHRoZSBuZXcgYWRqdXN0ZWQgYm94IHdpZHRoXG4gICAgICAgIGFkanVzdGVkUHJvZ3Jlc3MgPSBwcm9ncmVzcyAqIGJveEFkanVzdGVkUGVyY2VudDtcblxuICAgIC8vIFRoZSBiYXIgZG9lcyByZWFjaCB0aGUgbGVmdCBzaWRlLCBzbyB3ZSBuZWVkIHRvIGFjY291bnQgZm9yIHRoaXMgaW4gdGhlIGJhcidzIHdpZHRoXG4gICAgYmFyUHJvZ3Jlc3MgPSBhZGp1c3RlZFByb2dyZXNzICsgKGhhbmRsZVBlcmNlbnQgLyAyKTtcblxuICAgIC8vIE1vdmUgdGhlIGhhbmRsZSBmcm9tIHRoZSBsZWZ0IGJhc2VkIG9uIHRoZSBhZGplY3RlZCBwcm9ncmVzc1xuICAgIGhhbmRsZS5lbCgpLnN0eWxlLmxlZnQgPSB2anMucm91bmQoYWRqdXN0ZWRQcm9ncmVzcyAqIDEwMCwgMikgKyAnJSc7XG4gIH1cblxuICAvLyBTZXQgdGhlIG5ldyBiYXIgd2lkdGhcbiAgYmFyLmVsKCkuc3R5bGUud2lkdGggPSB2anMucm91bmQoYmFyUHJvZ3Jlc3MgKiAxMDAsIDIpICsgJyUnO1xufTtcblxudmpzLlNsaWRlci5wcm90b3R5cGUuY2FsY3VsYXRlRGlzdGFuY2UgPSBmdW5jdGlvbihldmVudCl7XG4gIHZhciBlbCwgYm94LCBib3hYLCBib3hZLCBib3hXLCBib3hILCBoYW5kbGUsIHBhZ2VYLCBwYWdlWTtcblxuICBlbCA9IHRoaXMuZWxfO1xuICBib3ggPSB2anMuZmluZFBvc2l0aW9uKGVsKTtcbiAgYm94VyA9IGJveEggPSBlbC5vZmZzZXRXaWR0aDtcbiAgaGFuZGxlID0gdGhpcy5oYW5kbGU7XG5cbiAgaWYgKHRoaXMub3B0aW9uc18udmVydGljYWwpIHtcbiAgICBib3hZID0gYm94LnRvcDtcblxuICAgIGlmIChldmVudC5jaGFuZ2VkVG91Y2hlcykge1xuICAgICAgcGFnZVkgPSBldmVudC5jaGFuZ2VkVG91Y2hlc1swXS5wYWdlWTtcbiAgICB9IGVsc2Uge1xuICAgICAgcGFnZVkgPSBldmVudC5wYWdlWTtcbiAgICB9XG5cbiAgICBpZiAoaGFuZGxlKSB7XG4gICAgICB2YXIgaGFuZGxlSCA9IGhhbmRsZS5lbCgpLm9mZnNldEhlaWdodDtcbiAgICAgIC8vIEFkanVzdGVkIFggYW5kIFdpZHRoLCBzbyBoYW5kbGUgZG9lc24ndCBnbyBvdXRzaWRlIHRoZSBiYXJcbiAgICAgIGJveFkgPSBib3hZICsgKGhhbmRsZUggLyAyKTtcbiAgICAgIGJveEggPSBib3hIIC0gaGFuZGxlSDtcbiAgICB9XG5cbiAgICAvLyBQZXJjZW50IHRoYXQgdGhlIGNsaWNrIGlzIHRocm91Z2ggdGhlIGFkanVzdGVkIGFyZWFcbiAgICByZXR1cm4gTWF0aC5tYXgoMCwgTWF0aC5taW4oMSwgKChib3hZIC0gcGFnZVkpICsgYm94SCkgLyBib3hIKSk7XG5cbiAgfSBlbHNlIHtcbiAgICBib3hYID0gYm94LmxlZnQ7XG5cbiAgICBpZiAoZXZlbnQuY2hhbmdlZFRvdWNoZXMpIHtcbiAgICAgIHBhZ2VYID0gZXZlbnQuY2hhbmdlZFRvdWNoZXNbMF0ucGFnZVg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBhZ2VYID0gZXZlbnQucGFnZVg7XG4gICAgfVxuXG4gICAgaWYgKGhhbmRsZSkge1xuICAgICAgdmFyIGhhbmRsZVcgPSBoYW5kbGUuZWwoKS5vZmZzZXRXaWR0aDtcblxuICAgICAgLy8gQWRqdXN0ZWQgWCBhbmQgV2lkdGgsIHNvIGhhbmRsZSBkb2Vzbid0IGdvIG91dHNpZGUgdGhlIGJhclxuICAgICAgYm94WCA9IGJveFggKyAoaGFuZGxlVyAvIDIpO1xuICAgICAgYm94VyA9IGJveFcgLSBoYW5kbGVXO1xuICAgIH1cblxuICAgIC8vIFBlcmNlbnQgdGhhdCB0aGUgY2xpY2sgaXMgdGhyb3VnaCB0aGUgYWRqdXN0ZWQgYXJlYVxuICAgIHJldHVybiBNYXRoLm1heCgwLCBNYXRoLm1pbigxLCAocGFnZVggLSBib3hYKSAvIGJveFcpKTtcbiAgfVxufTtcblxudmpzLlNsaWRlci5wcm90b3R5cGUub25Gb2N1cyA9IGZ1bmN0aW9uKCl7XG4gIHZqcy5vbihkb2N1bWVudCwgJ2tleXVwJywgdmpzLmJpbmQodGhpcywgdGhpcy5vbktleVByZXNzKSk7XG59O1xuXG52anMuU2xpZGVyLnByb3RvdHlwZS5vbktleVByZXNzID0gZnVuY3Rpb24oZXZlbnQpe1xuICBpZiAoZXZlbnQud2hpY2ggPT0gMzcpIHsgLy8gTGVmdCBBcnJvd1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgdGhpcy5zdGVwQmFjaygpO1xuICB9IGVsc2UgaWYgKGV2ZW50LndoaWNoID09IDM5KSB7IC8vIFJpZ2h0IEFycm93XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB0aGlzLnN0ZXBGb3J3YXJkKCk7XG4gIH1cbn07XG5cbnZqcy5TbGlkZXIucHJvdG90eXBlLm9uQmx1ciA9IGZ1bmN0aW9uKCl7XG4gIHZqcy5vZmYoZG9jdW1lbnQsICdrZXl1cCcsIHZqcy5iaW5kKHRoaXMsIHRoaXMub25LZXlQcmVzcykpO1xufTtcblxuLyoqXG4gKiBMaXN0ZW5lciBmb3IgY2xpY2sgZXZlbnRzIG9uIHNsaWRlciwgdXNlZCB0byBwcmV2ZW50IGNsaWNrc1xuICogICBmcm9tIGJ1YmJsaW5nIHVwIHRvIHBhcmVudCBlbGVtZW50cyBsaWtlIGJ1dHRvbiBtZW51cy5cbiAqIEBwYXJhbSAge09iamVjdH0gZXZlbnQgRXZlbnQgb2JqZWN0XG4gKi9cbnZqcy5TbGlkZXIucHJvdG90eXBlLm9uQ2xpY2sgPSBmdW5jdGlvbihldmVudCl7XG4gIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xufTtcblxuLyoqXG4gKiBTZWVrQmFyIEJlaGF2aW9yIGluY2x1ZGVzIHBsYXkgcHJvZ3Jlc3MgYmFyLCBhbmQgc2VlayBoYW5kbGVcbiAqIE5lZWRlZCBzbyBpdCBjYW4gZGV0ZXJtaW5lIHNlZWsgcG9zaXRpb24gYmFzZWQgb24gaGFuZGxlIHBvc2l0aW9uL3NpemVcbiAqIEBwYXJhbSB7dmpzLlBsYXllcnxPYmplY3R9IHBsYXllclxuICogQHBhcmFtIHtPYmplY3Q9fSBvcHRpb25zXG4gKiBAY29uc3RydWN0b3JcbiAqL1xudmpzLlNsaWRlckhhbmRsZSA9IHZqcy5Db21wb25lbnQuZXh0ZW5kKCk7XG5cbi8qKlxuICogRGVmYXVsdCB2YWx1ZSBvZiB0aGUgc2xpZGVyXG4gKlxuICogQHR5cGUge051bWJlcn1cbiAqIEBwcml2YXRlXG4gKi9cbnZqcy5TbGlkZXJIYW5kbGUucHJvdG90eXBlLmRlZmF1bHRWYWx1ZSA9IDA7XG5cbi8qKiBAaW5oZXJpdERvYyAqL1xudmpzLlNsaWRlckhhbmRsZS5wcm90b3R5cGUuY3JlYXRlRWwgPSBmdW5jdGlvbih0eXBlLCBwcm9wcykge1xuICBwcm9wcyA9IHByb3BzIHx8IHt9O1xuICAvLyBBZGQgdGhlIHNsaWRlciBlbGVtZW50IGNsYXNzIHRvIGFsbCBzdWIgY2xhc3Nlc1xuICBwcm9wcy5jbGFzc05hbWUgPSBwcm9wcy5jbGFzc05hbWUgKyAnIHZqcy1zbGlkZXItaGFuZGxlJztcbiAgcHJvcHMgPSB2anMub2JqLm1lcmdlKHtcbiAgICBpbm5lckhUTUw6ICc8c3BhbiBjbGFzcz1cInZqcy1jb250cm9sLXRleHRcIj4nK3RoaXMuZGVmYXVsdFZhbHVlKyc8L3NwYW4+J1xuICB9LCBwcm9wcyk7XG5cbiAgcmV0dXJuIHZqcy5Db21wb25lbnQucHJvdG90eXBlLmNyZWF0ZUVsLmNhbGwodGhpcywgJ2RpdicsIHByb3BzKTtcbn07XG4vKiBNZW51XG49PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqL1xuLyoqXG4gKiBUaGUgTWVudSBjb21wb25lbnQgaXMgdXNlZCB0byBidWlsZCBwb3AgdXAgbWVudXMsIGluY2x1ZGluZyBzdWJ0aXRsZSBhbmRcbiAqIGNhcHRpb25zIHNlbGVjdGlvbiBtZW51cy5cbiAqXG4gKiBAcGFyYW0ge3Zqcy5QbGF5ZXJ8T2JqZWN0fSBwbGF5ZXJcbiAqIEBwYXJhbSB7T2JqZWN0PX0gb3B0aW9uc1xuICogQGNsYXNzXG4gKiBAY29uc3RydWN0b3JcbiAqL1xudmpzLk1lbnUgPSB2anMuQ29tcG9uZW50LmV4dGVuZCgpO1xuXG4vKipcbiAqIEFkZCBhIG1lbnUgaXRlbSB0byB0aGUgbWVudVxuICogQHBhcmFtIHtPYmplY3R8U3RyaW5nfSBjb21wb25lbnQgQ29tcG9uZW50IG9yIGNvbXBvbmVudCB0eXBlIHRvIGFkZFxuICovXG52anMuTWVudS5wcm90b3R5cGUuYWRkSXRlbSA9IGZ1bmN0aW9uKGNvbXBvbmVudCl7XG4gIHRoaXMuYWRkQ2hpbGQoY29tcG9uZW50KTtcbiAgY29tcG9uZW50Lm9uKCdjbGljaycsIHZqcy5iaW5kKHRoaXMsIGZ1bmN0aW9uKCl7XG4gICAgdGhpcy51bmxvY2tTaG93aW5nKCk7XG4gIH0pKTtcbn07XG5cbi8qKiBAaW5oZXJpdERvYyAqL1xudmpzLk1lbnUucHJvdG90eXBlLmNyZWF0ZUVsID0gZnVuY3Rpb24oKXtcbiAgdmFyIGNvbnRlbnRFbFR5cGUgPSB0aGlzLm9wdGlvbnMoKS5jb250ZW50RWxUeXBlIHx8ICd1bCc7XG4gIHRoaXMuY29udGVudEVsXyA9IHZqcy5jcmVhdGVFbChjb250ZW50RWxUeXBlLCB7XG4gICAgY2xhc3NOYW1lOiAndmpzLW1lbnUtY29udGVudCdcbiAgfSk7XG4gIHZhciBlbCA9IHZqcy5Db21wb25lbnQucHJvdG90eXBlLmNyZWF0ZUVsLmNhbGwodGhpcywgJ2RpdicsIHtcbiAgICBhcHBlbmQ6IHRoaXMuY29udGVudEVsXyxcbiAgICBjbGFzc05hbWU6ICd2anMtbWVudSdcbiAgfSk7XG4gIGVsLmFwcGVuZENoaWxkKHRoaXMuY29udGVudEVsXyk7XG5cbiAgLy8gUHJldmVudCBjbGlja3MgZnJvbSBidWJibGluZyB1cC4gTmVlZGVkIGZvciBNZW51IEJ1dHRvbnMsXG4gIC8vIHdoZXJlIGEgY2xpY2sgb24gdGhlIHBhcmVudCBpcyBzaWduaWZpY2FudFxuICB2anMub24oZWwsICdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KXtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICB9KTtcblxuICByZXR1cm4gZWw7XG59O1xuXG4vKipcbiAqIFRoZSBjb21wb25lbnQgZm9yIGEgbWVudSBpdGVtLiBgPGxpPmBcbiAqXG4gKiBAcGFyYW0ge3Zqcy5QbGF5ZXJ8T2JqZWN0fSBwbGF5ZXJcbiAqIEBwYXJhbSB7T2JqZWN0PX0gb3B0aW9uc1xuICogQGNsYXNzXG4gKiBAY29uc3RydWN0b3JcbiAqL1xudmpzLk1lbnVJdGVtID0gdmpzLkJ1dHRvbi5leHRlbmQoe1xuICAvKiogQGNvbnN0cnVjdG9yICovXG4gIGluaXQ6IGZ1bmN0aW9uKHBsYXllciwgb3B0aW9ucyl7XG4gICAgdmpzLkJ1dHRvbi5jYWxsKHRoaXMsIHBsYXllciwgb3B0aW9ucyk7XG4gICAgdGhpcy5zZWxlY3RlZChvcHRpb25zWydzZWxlY3RlZCddKTtcbiAgfVxufSk7XG5cbi8qKiBAaW5oZXJpdERvYyAqL1xudmpzLk1lbnVJdGVtLnByb3RvdHlwZS5jcmVhdGVFbCA9IGZ1bmN0aW9uKHR5cGUsIHByb3BzKXtcbiAgcmV0dXJuIHZqcy5CdXR0b24ucHJvdG90eXBlLmNyZWF0ZUVsLmNhbGwodGhpcywgJ2xpJywgdmpzLm9iai5tZXJnZSh7XG4gICAgY2xhc3NOYW1lOiAndmpzLW1lbnUtaXRlbScsXG4gICAgaW5uZXJIVE1MOiB0aGlzLm9wdGlvbnNfWydsYWJlbCddXG4gIH0sIHByb3BzKSk7XG59O1xuXG4vKipcbiAqIEhhbmRsZSBhIGNsaWNrIG9uIHRoZSBtZW51IGl0ZW0sIGFuZCBzZXQgaXQgdG8gc2VsZWN0ZWRcbiAqL1xudmpzLk1lbnVJdGVtLnByb3RvdHlwZS5vbkNsaWNrID0gZnVuY3Rpb24oKXtcbiAgdGhpcy5zZWxlY3RlZCh0cnVlKTtcbn07XG5cbi8qKlxuICogU2V0IHRoaXMgbWVudSBpdGVtIGFzIHNlbGVjdGVkIG9yIG5vdFxuICogQHBhcmFtICB7Qm9vbGVhbn0gc2VsZWN0ZWRcbiAqL1xudmpzLk1lbnVJdGVtLnByb3RvdHlwZS5zZWxlY3RlZCA9IGZ1bmN0aW9uKHNlbGVjdGVkKXtcbiAgaWYgKHNlbGVjdGVkKSB7XG4gICAgdGhpcy5hZGRDbGFzcygndmpzLXNlbGVjdGVkJyk7XG4gICAgdGhpcy5lbF8uc2V0QXR0cmlidXRlKCdhcmlhLXNlbGVjdGVkJyx0cnVlKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLnJlbW92ZUNsYXNzKCd2anMtc2VsZWN0ZWQnKTtcbiAgICB0aGlzLmVsXy5zZXRBdHRyaWJ1dGUoJ2FyaWEtc2VsZWN0ZWQnLGZhbHNlKTtcbiAgfVxufTtcblxuXG4vKipcbiAqIEEgYnV0dG9uIGNsYXNzIHdpdGggYSBwb3B1cCBtZW51XG4gKiBAcGFyYW0ge3Zqcy5QbGF5ZXJ8T2JqZWN0fSBwbGF5ZXJcbiAqIEBwYXJhbSB7T2JqZWN0PX0gb3B0aW9uc1xuICogQGNvbnN0cnVjdG9yXG4gKi9cbnZqcy5NZW51QnV0dG9uID0gdmpzLkJ1dHRvbi5leHRlbmQoe1xuICAvKiogQGNvbnN0cnVjdG9yICovXG4gIGluaXQ6IGZ1bmN0aW9uKHBsYXllciwgb3B0aW9ucyl7XG4gICAgdmpzLkJ1dHRvbi5jYWxsKHRoaXMsIHBsYXllciwgb3B0aW9ucyk7XG5cbiAgICB0aGlzLm1lbnUgPSB0aGlzLmNyZWF0ZU1lbnUoKTtcblxuICAgIC8vIEFkZCBsaXN0IHRvIGVsZW1lbnRcbiAgICB0aGlzLmFkZENoaWxkKHRoaXMubWVudSk7XG5cbiAgICAvLyBBdXRvbWF0aWNhbGx5IGhpZGUgZW1wdHkgbWVudSBidXR0b25zXG4gICAgaWYgKHRoaXMuaXRlbXMgJiYgdGhpcy5pdGVtcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRoaXMuaGlkZSgpO1xuICAgIH1cblxuICAgIHRoaXMub24oJ2tleXVwJywgdGhpcy5vbktleVByZXNzKTtcbiAgICB0aGlzLmVsXy5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGFzcG9wdXAnLCB0cnVlKTtcbiAgICB0aGlzLmVsXy5zZXRBdHRyaWJ1dGUoJ3JvbGUnLCAnYnV0dG9uJyk7XG4gIH1cbn0pO1xuXG4vKipcbiAqIFRyYWNrIHRoZSBzdGF0ZSBvZiB0aGUgbWVudSBidXR0b25cbiAqIEB0eXBlIHtCb29sZWFufVxuICogQHByaXZhdGVcbiAqL1xudmpzLk1lbnVCdXR0b24ucHJvdG90eXBlLmJ1dHRvblByZXNzZWRfID0gZmFsc2U7XG5cbnZqcy5NZW51QnV0dG9uLnByb3RvdHlwZS5jcmVhdGVNZW51ID0gZnVuY3Rpb24oKXtcbiAgdmFyIG1lbnUgPSBuZXcgdmpzLk1lbnUodGhpcy5wbGF5ZXJfKTtcblxuICAvLyBBZGQgYSB0aXRsZSBsaXN0IGl0ZW0gdG8gdGhlIHRvcFxuICBpZiAodGhpcy5vcHRpb25zKCkudGl0bGUpIHtcbiAgICBtZW51LmVsKCkuYXBwZW5kQ2hpbGQodmpzLmNyZWF0ZUVsKCdsaScsIHtcbiAgICAgIGNsYXNzTmFtZTogJ3Zqcy1tZW51LXRpdGxlJyxcbiAgICAgIGlubmVySFRNTDogdmpzLmNhcGl0YWxpemUodGhpcy5raW5kXyksXG4gICAgICB0YWJpbmRleDogLTFcbiAgICB9KSk7XG4gIH1cblxuICB0aGlzLml0ZW1zID0gdGhpc1snY3JlYXRlSXRlbXMnXSgpO1xuXG4gIGlmICh0aGlzLml0ZW1zKSB7XG4gICAgLy8gQWRkIG1lbnUgaXRlbXMgdG8gdGhlIG1lbnVcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuaXRlbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG1lbnUuYWRkSXRlbSh0aGlzLml0ZW1zW2ldKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbWVudTtcbn07XG5cbi8qKlxuICogQ3JlYXRlIHRoZSBsaXN0IG9mIG1lbnUgaXRlbXMuIFNwZWNpZmljIHRvIGVhY2ggc3ViY2xhc3MuXG4gKi9cbnZqcy5NZW51QnV0dG9uLnByb3RvdHlwZS5jcmVhdGVJdGVtcyA9IGZ1bmN0aW9uKCl7fTtcblxuLyoqIEBpbmhlcml0RG9jICovXG52anMuTWVudUJ1dHRvbi5wcm90b3R5cGUuYnVpbGRDU1NDbGFzcyA9IGZ1bmN0aW9uKCl7XG4gIHJldHVybiB0aGlzLmNsYXNzTmFtZSArICcgdmpzLW1lbnUtYnV0dG9uICcgKyB2anMuQnV0dG9uLnByb3RvdHlwZS5idWlsZENTU0NsYXNzLmNhbGwodGhpcyk7XG59O1xuXG4vLyBGb2N1cyAtIEFkZCBrZXlib2FyZCBmdW5jdGlvbmFsaXR5IHRvIGVsZW1lbnRcbi8vIFRoaXMgZnVuY3Rpb24gaXMgbm90IG5lZWRlZCBhbnltb3JlLiBJbnN0ZWFkLCB0aGUga2V5Ym9hcmQgZnVuY3Rpb25hbGl0eSBpcyBoYW5kbGVkIGJ5XG4vLyB0cmVhdGluZyB0aGUgYnV0dG9uIGFzIHRyaWdnZXJpbmcgYSBzdWJtZW51LiBXaGVuIHRoZSBidXR0b24gaXMgcHJlc3NlZCwgdGhlIHN1Ym1lbnVcbi8vIGFwcGVhcnMuIFByZXNzaW5nIHRoZSBidXR0b24gYWdhaW4gbWFrZXMgdGhlIHN1Ym1lbnUgZGlzYXBwZWFyLlxudmpzLk1lbnVCdXR0b24ucHJvdG90eXBlLm9uRm9jdXMgPSBmdW5jdGlvbigpe307XG4vLyBDYW4ndCB0dXJuIG9mZiBsaXN0IGRpc3BsYXkgdGhhdCB3ZSB0dXJuZWQgb24gd2l0aCBmb2N1cywgYmVjYXVzZSBsaXN0IHdvdWxkIGdvIGF3YXkuXG52anMuTWVudUJ1dHRvbi5wcm90b3R5cGUub25CbHVyID0gZnVuY3Rpb24oKXt9O1xuXG52anMuTWVudUJ1dHRvbi5wcm90b3R5cGUub25DbGljayA9IGZ1bmN0aW9uKCl7XG4gIC8vIFdoZW4geW91IGNsaWNrIHRoZSBidXR0b24gaXQgYWRkcyBmb2N1cywgd2hpY2ggd2lsbCBzaG93IHRoZSBtZW51IGluZGVmaW5pdGVseS5cbiAgLy8gU28gd2UnbGwgcmVtb3ZlIGZvY3VzIHdoZW4gdGhlIG1vdXNlIGxlYXZlcyB0aGUgYnV0dG9uLlxuICAvLyBGb2N1cyBpcyBuZWVkZWQgZm9yIHRhYiBuYXZpZ2F0aW9uLlxuICB0aGlzLm9uZSgnbW91c2VvdXQnLCB2anMuYmluZCh0aGlzLCBmdW5jdGlvbigpe1xuICAgIHRoaXMubWVudS51bmxvY2tTaG93aW5nKCk7XG4gICAgdGhpcy5lbF8uYmx1cigpO1xuICB9KSk7XG4gIGlmICh0aGlzLmJ1dHRvblByZXNzZWRfKXtcbiAgICB0aGlzLnVucHJlc3NCdXR0b24oKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLnByZXNzQnV0dG9uKCk7XG4gIH1cbn07XG5cbnZqcy5NZW51QnV0dG9uLnByb3RvdHlwZS5vbktleVByZXNzID0gZnVuY3Rpb24oZXZlbnQpe1xuICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gIC8vIENoZWNrIGZvciBzcGFjZSBiYXIgKDMyKSBvciBlbnRlciAoMTMpIGtleXNcbiAgaWYgKGV2ZW50LndoaWNoID09IDMyIHx8IGV2ZW50LndoaWNoID09IDEzKSB7XG4gICAgaWYgKHRoaXMuYnV0dG9uUHJlc3NlZF8pe1xuICAgICAgdGhpcy51bnByZXNzQnV0dG9uKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucHJlc3NCdXR0b24oKTtcbiAgICB9XG4gIC8vIENoZWNrIGZvciBlc2NhcGUgKDI3KSBrZXlcbiAgfSBlbHNlIGlmIChldmVudC53aGljaCA9PSAyNyl7XG4gICAgaWYgKHRoaXMuYnV0dG9uUHJlc3NlZF8pe1xuICAgICAgdGhpcy51bnByZXNzQnV0dG9uKCk7XG4gICAgfVxuICB9XG59O1xuXG52anMuTWVudUJ1dHRvbi5wcm90b3R5cGUucHJlc3NCdXR0b24gPSBmdW5jdGlvbigpe1xuICB0aGlzLmJ1dHRvblByZXNzZWRfID0gdHJ1ZTtcbiAgdGhpcy5tZW51LmxvY2tTaG93aW5nKCk7XG4gIHRoaXMuZWxfLnNldEF0dHJpYnV0ZSgnYXJpYS1wcmVzc2VkJywgdHJ1ZSk7XG4gIGlmICh0aGlzLml0ZW1zICYmIHRoaXMuaXRlbXMubGVuZ3RoID4gMCkge1xuICAgIHRoaXMuaXRlbXNbMF0uZWwoKS5mb2N1cygpOyAvLyBzZXQgdGhlIGZvY3VzIHRvIHRoZSB0aXRsZSBvZiB0aGUgc3VibWVudVxuICB9XG59O1xuXG52anMuTWVudUJ1dHRvbi5wcm90b3R5cGUudW5wcmVzc0J1dHRvbiA9IGZ1bmN0aW9uKCl7XG4gIHRoaXMuYnV0dG9uUHJlc3NlZF8gPSBmYWxzZTtcbiAgdGhpcy5tZW51LnVubG9ja1Nob3dpbmcoKTtcbiAgdGhpcy5lbF8uc2V0QXR0cmlidXRlKCdhcmlhLXByZXNzZWQnLCBmYWxzZSk7XG59O1xuXG4vKipcbiAqIEFuIGluc3RhbmNlIG9mIHRoZSBgdmpzLlBsYXllcmAgY2xhc3MgaXMgY3JlYXRlZCB3aGVuIGFueSBvZiB0aGUgVmlkZW8uanMgc2V0dXAgbWV0aG9kcyBhcmUgdXNlZCB0byBpbml0aWFsaXplIGEgdmlkZW8uXG4gKlxuICogYGBganNcbiAqIHZhciBteVBsYXllciA9IHZpZGVvanMoJ2V4YW1wbGVfdmlkZW9fMScpO1xuICogYGBgXG4gKlxuICogSW4gdGhlIGZvbGx3aW5nIGV4YW1wbGUsIHRoZSBgZGF0YS1zZXR1cGAgYXR0cmlidXRlIHRlbGxzIHRoZSBWaWRlby5qcyBsaWJyYXJ5IHRvIGNyZWF0ZSBhIHBsYXllciBpbnN0YW5jZSB3aGVuIHRoZSBsaWJyYXJ5IGlzIHJlYWR5LlxuICpcbiAqIGBgYGh0bWxcbiAqIDx2aWRlbyBpZD1cImV4YW1wbGVfdmlkZW9fMVwiIGRhdGEtc2V0dXA9J3t9JyBjb250cm9scz5cbiAqICAgPHNvdXJjZSBzcmM9XCJteS1zb3VyY2UubXA0XCIgdHlwZT1cInZpZGVvL21wNFwiPlxuICogPC92aWRlbz5cbiAqIGBgYFxuICpcbiAqIEFmdGVyIGFuIGluc3RhbmNlIGhhcyBiZWVuIGNyZWF0ZWQgaXQgY2FuIGJlIGFjY2Vzc2VkIGdsb2JhbGx5IHVzaW5nIGBWaWRlbygnZXhhbXBsZV92aWRlb18xJylgLlxuICpcbiAqIEBjbGFzc1xuICogQGV4dGVuZHMgdmpzLkNvbXBvbmVudFxuICovXG52anMuUGxheWVyID0gdmpzLkNvbXBvbmVudC5leHRlbmQoe1xuXG4gIC8qKlxuICAgKiBwbGF5ZXIncyBjb25zdHJ1Y3RvciBmdW5jdGlvblxuICAgKlxuICAgKiBAY29uc3RydWN0c1xuICAgKiBAbWV0aG9kIGluaXRcbiAgICogQHBhcmFtIHtFbGVtZW50fSB0YWcgICAgICAgIFRoZSBvcmlnaW5hbCB2aWRlbyB0YWcgdXNlZCBmb3IgY29uZmlndXJpbmcgb3B0aW9uc1xuICAgKiBAcGFyYW0ge09iamVjdD19IG9wdGlvbnMgICAgUGxheWVyIG9wdGlvbnNcbiAgICogQHBhcmFtIHtGdW5jdGlvbj19IHJlYWR5ICAgIFJlYWR5IGNhbGxiYWNrIGZ1bmN0aW9uXG4gICAqL1xuICBpbml0OiBmdW5jdGlvbih0YWcsIG9wdGlvbnMsIHJlYWR5KXtcbiAgICB0aGlzLnRhZyA9IHRhZzsgLy8gU3RvcmUgdGhlIG9yaWdpbmFsIHRhZyB1c2VkIHRvIHNldCBvcHRpb25zXG5cbiAgICAvLyBTZXQgT3B0aW9uc1xuICAgIC8vIFRoZSBvcHRpb25zIGFyZ3VtZW50IG92ZXJyaWRlcyBvcHRpb25zIHNldCBpbiB0aGUgdmlkZW8gdGFnXG4gICAgLy8gd2hpY2ggb3ZlcnJpZGVzIGdsb2JhbGx5IHNldCBvcHRpb25zLlxuICAgIC8vIFRoaXMgbGF0dGVyIHBhcnQgY29pbmNpZGVzIHdpdGggdGhlIGxvYWQgb3JkZXJcbiAgICAvLyAodGFnIG11c3QgZXhpc3QgYmVmb3JlIFBsYXllcilcbiAgICBvcHRpb25zID0gdmpzLm9iai5tZXJnZSh0aGlzLmdldFRhZ1NldHRpbmdzKHRhZyksIG9wdGlvbnMpO1xuXG4gICAgLy8gQ2FjaGUgZm9yIHZpZGVvIHByb3BlcnR5IHZhbHVlcy5cbiAgICB0aGlzLmNhY2hlXyA9IHt9O1xuXG4gICAgLy8gU2V0IHBvc3RlclxuICAgIHRoaXMucG9zdGVyXyA9IG9wdGlvbnNbJ3Bvc3RlciddO1xuICAgIC8vIFNldCBjb250cm9sc1xuICAgIHRoaXMuY29udHJvbHNfID0gb3B0aW9uc1snY29udHJvbHMnXTtcbiAgICAvLyBPcmlnaW5hbCB0YWcgc2V0dGluZ3Mgc3RvcmVkIGluIG9wdGlvbnNcbiAgICAvLyBub3cgcmVtb3ZlIGltbWVkaWF0ZWx5IHNvIG5hdGl2ZSBjb250cm9scyBkb24ndCBmbGFzaC5cbiAgICAvLyBNYXkgYmUgdHVybmVkIGJhY2sgb24gYnkgSFRNTDUgdGVjaCBpZiBuYXRpdmVDb250cm9sc0ZvclRvdWNoIGlzIHRydWVcbiAgICB0YWcuY29udHJvbHMgPSBmYWxzZTtcblxuICAgIC8vIFJ1biBiYXNlIGNvbXBvbmVudCBpbml0aWFsaXppbmcgd2l0aCBuZXcgb3B0aW9ucy5cbiAgICAvLyBCdWlsZHMgdGhlIGVsZW1lbnQgdGhyb3VnaCBjcmVhdGVFbCgpXG4gICAgLy8gSW5pdHMgYW5kIGVtYmVkcyBhbnkgY2hpbGQgY29tcG9uZW50cyBpbiBvcHRzXG4gICAgdmpzLkNvbXBvbmVudC5jYWxsKHRoaXMsIHRoaXMsIG9wdGlvbnMsIHJlYWR5KTtcblxuICAgIC8vIFVwZGF0ZSBjb250cm9scyBjbGFzc05hbWUuIENhbid0IGRvIHRoaXMgd2hlbiB0aGUgY29udHJvbHMgYXJlIGluaXRpYWxseVxuICAgIC8vIHNldCBiZWNhdXNlIHRoZSBlbGVtZW50IGRvZXNuJ3QgZXhpc3QgeWV0LlxuICAgIGlmICh0aGlzLmNvbnRyb2xzKCkpIHtcbiAgICAgIHRoaXMuYWRkQ2xhc3MoJ3Zqcy1jb250cm9scy1lbmFibGVkJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuYWRkQ2xhc3MoJ3Zqcy1jb250cm9scy1kaXNhYmxlZCcpO1xuICAgIH1cblxuICAgIC8vIFRPRE86IE1ha2UgdGhpcyBzbWFydGVyLiBUb2dnbGUgdXNlciBzdGF0ZSBiZXR3ZWVuIHRvdWNoaW5nL21vdXNpbmdcbiAgICAvLyB1c2luZyBldmVudHMsIHNpbmNlIGRldmljZXMgY2FuIGhhdmUgYm90aCB0b3VjaCBhbmQgbW91c2UgZXZlbnRzLlxuICAgIC8vIGlmICh2anMuVE9VQ0hfRU5BQkxFRCkge1xuICAgIC8vICAgdGhpcy5hZGRDbGFzcygndmpzLXRvdWNoLWVuYWJsZWQnKTtcbiAgICAvLyB9XG5cbiAgICAvLyBGaXJzdHBsYXkgZXZlbnQgaW1wbGltZW50YXRpb24uIE5vdCBzb2xkIG9uIHRoZSBldmVudCB5ZXQuXG4gICAgLy8gQ291bGQgcHJvYmFibHkganVzdCBjaGVjayBjdXJyZW50VGltZT09MD9cbiAgICB0aGlzLm9uZSgncGxheScsIGZ1bmN0aW9uKGUpe1xuICAgICAgdmFyIGZwRXZlbnQgPSB7IHR5cGU6ICdmaXJzdHBsYXknLCB0YXJnZXQ6IHRoaXMuZWxfIH07XG4gICAgICAvLyBVc2luZyB2anMudHJpZ2dlciBzbyB3ZSBjYW4gY2hlY2sgaWYgZGVmYXVsdCB3YXMgcHJldmVudGVkXG4gICAgICB2YXIga2VlcEdvaW5nID0gdmpzLnRyaWdnZXIodGhpcy5lbF8sIGZwRXZlbnQpO1xuXG4gICAgICBpZiAoIWtlZXBHb2luZykge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLm9uKCdlbmRlZCcsIHRoaXMub25FbmRlZCk7XG4gICAgdGhpcy5vbigncGxheScsIHRoaXMub25QbGF5KTtcbiAgICB0aGlzLm9uKCdmaXJzdHBsYXknLCB0aGlzLm9uRmlyc3RQbGF5KTtcbiAgICB0aGlzLm9uKCdwYXVzZScsIHRoaXMub25QYXVzZSk7XG4gICAgdGhpcy5vbigncHJvZ3Jlc3MnLCB0aGlzLm9uUHJvZ3Jlc3MpO1xuICAgIHRoaXMub24oJ2R1cmF0aW9uY2hhbmdlJywgdGhpcy5vbkR1cmF0aW9uQ2hhbmdlKTtcbiAgICB0aGlzLm9uKCdlcnJvcicsIHRoaXMub25FcnJvcik7XG4gICAgdGhpcy5vbignZnVsbHNjcmVlbmNoYW5nZScsIHRoaXMub25GdWxsc2NyZWVuQ2hhbmdlKTtcblxuICAgIC8vIE1ha2UgcGxheWVyIGVhc2lseSBmaW5kYWJsZSBieSBJRFxuICAgIHZqcy5wbGF5ZXJzW3RoaXMuaWRfXSA9IHRoaXM7XG5cbiAgICBpZiAob3B0aW9uc1sncGx1Z2lucyddKSB7XG4gICAgICB2anMub2JqLmVhY2gob3B0aW9uc1sncGx1Z2lucyddLCBmdW5jdGlvbihrZXksIHZhbCl7XG4gICAgICAgIHRoaXNba2V5XSh2YWwpO1xuICAgICAgfSwgdGhpcyk7XG4gICAgfVxuXG4gICAgdGhpcy5saXN0ZW5Gb3JVc2VyQWN0aXZpdHkoKTtcbiAgfVxufSk7XG5cbi8qKlxuICogUGxheWVyIGluc3RhbmNlIG9wdGlvbnMsIHN1cmZhY2VkIHVzaW5nIHZqcy5vcHRpb25zXG4gKiB2anMub3B0aW9ucyA9IHZqcy5QbGF5ZXIucHJvdG90eXBlLm9wdGlvbnNfXG4gKiBNYWtlIGNoYW5nZXMgaW4gdmpzLm9wdGlvbnMsIG5vdCBoZXJlLlxuICogQWxsIG9wdGlvbnMgc2hvdWxkIHVzZSBzdHJpbmcga2V5cyBzbyB0aGV5IGF2b2lkXG4gKiByZW5hbWluZyBieSBjbG9zdXJlIGNvbXBpbGVyXG4gKiBAdHlwZSB7T2JqZWN0fVxuICogQHByaXZhdGVcbiAqL1xudmpzLlBsYXllci5wcm90b3R5cGUub3B0aW9uc18gPSB2anMub3B0aW9ucztcblxuLyoqXG4gKiBEZXN0cm95cyB0aGUgdmlkZW8gcGxheWVyIGFuZCBkb2VzIGFueSBuZWNlc3NhcnkgY2xlYW51cFxuICpcbiAqICAgICBteVBsYXllci5kaXNwb3NlKCk7XG4gKlxuICogVGhpcyBpcyBlc3BlY2lhbGx5IGhlbHBmdWwgaWYgeW91IGFyZSBkeW5hbWljYWxseSBhZGRpbmcgYW5kIHJlbW92aW5nIHZpZGVvc1xuICogdG8vZnJvbSB0aGUgRE9NLlxuICovXG52anMuUGxheWVyLnByb3RvdHlwZS5kaXNwb3NlID0gZnVuY3Rpb24oKXtcbiAgdGhpcy50cmlnZ2VyKCdkaXNwb3NlJyk7XG4gIC8vIHByZXZlbnQgZGlzcG9zZSBmcm9tIGJlaW5nIGNhbGxlZCB0d2ljZVxuICB0aGlzLm9mZignZGlzcG9zZScpO1xuXG4gIC8vIEtpbGwgcmVmZXJlbmNlIHRvIHRoaXMgcGxheWVyXG4gIHZqcy5wbGF5ZXJzW3RoaXMuaWRfXSA9IG51bGw7XG4gIGlmICh0aGlzLnRhZyAmJiB0aGlzLnRhZ1sncGxheWVyJ10pIHsgdGhpcy50YWdbJ3BsYXllciddID0gbnVsbDsgfVxuICBpZiAodGhpcy5lbF8gJiYgdGhpcy5lbF9bJ3BsYXllciddKSB7IHRoaXMuZWxfWydwbGF5ZXInXSA9IG51bGw7IH1cblxuICAvLyBFbnN1cmUgdGhhdCB0cmFja2luZyBwcm9ncmVzcyBhbmQgdGltZSBwcm9ncmVzcyB3aWxsIHN0b3AgYW5kIHBsYXRlciBkZWxldGVkXG4gIHRoaXMuc3RvcFRyYWNraW5nUHJvZ3Jlc3MoKTtcbiAgdGhpcy5zdG9wVHJhY2tpbmdDdXJyZW50VGltZSgpO1xuXG4gIGlmICh0aGlzLnRlY2gpIHsgdGhpcy50ZWNoLmRpc3Bvc2UoKTsgfVxuXG4gIC8vIENvbXBvbmVudCBkaXNwb3NlXG4gIHZqcy5Db21wb25lbnQucHJvdG90eXBlLmRpc3Bvc2UuY2FsbCh0aGlzKTtcbn07XG5cbnZqcy5QbGF5ZXIucHJvdG90eXBlLmdldFRhZ1NldHRpbmdzID0gZnVuY3Rpb24odGFnKXtcbiAgdmFyIG9wdGlvbnMgPSB7XG4gICAgJ3NvdXJjZXMnOiBbXSxcbiAgICAndHJhY2tzJzogW11cbiAgfTtcblxuICB2anMub2JqLm1lcmdlKG9wdGlvbnMsIHZqcy5nZXRBdHRyaWJ1dGVWYWx1ZXModGFnKSk7XG5cbiAgLy8gR2V0IHRhZyBjaGlsZHJlbiBzZXR0aW5nc1xuICBpZiAodGFnLmhhc0NoaWxkTm9kZXMoKSkge1xuICAgIHZhciBjaGlsZHJlbiwgY2hpbGQsIGNoaWxkTmFtZSwgaSwgajtcblxuICAgIGNoaWxkcmVuID0gdGFnLmNoaWxkTm9kZXM7XG5cbiAgICBmb3IgKGk9MCxqPWNoaWxkcmVuLmxlbmd0aDsgaTxqOyBpKyspIHtcbiAgICAgIGNoaWxkID0gY2hpbGRyZW5baV07XG4gICAgICAvLyBDaGFuZ2UgY2FzZSBuZWVkZWQ6IGh0dHA6Ly9lam9obi5vcmcvYmxvZy9ub2RlbmFtZS1jYXNlLXNlbnNpdGl2aXR5L1xuICAgICAgY2hpbGROYW1lID0gY2hpbGQubm9kZU5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgIGlmIChjaGlsZE5hbWUgPT09ICdzb3VyY2UnKSB7XG4gICAgICAgIG9wdGlvbnNbJ3NvdXJjZXMnXS5wdXNoKHZqcy5nZXRBdHRyaWJ1dGVWYWx1ZXMoY2hpbGQpKTtcbiAgICAgIH0gZWxzZSBpZiAoY2hpbGROYW1lID09PSAndHJhY2snKSB7XG4gICAgICAgIG9wdGlvbnNbJ3RyYWNrcyddLnB1c2godmpzLmdldEF0dHJpYnV0ZVZhbHVlcyhjaGlsZCkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBvcHRpb25zO1xufTtcblxudmpzLlBsYXllci5wcm90b3R5cGUuY3JlYXRlRWwgPSBmdW5jdGlvbigpe1xuICB2YXIgZWwgPSB0aGlzLmVsXyA9IHZqcy5Db21wb25lbnQucHJvdG90eXBlLmNyZWF0ZUVsLmNhbGwodGhpcywgJ2RpdicpO1xuICB2YXIgdGFnID0gdGhpcy50YWc7XG5cbiAgLy8gUmVtb3ZlIHdpZHRoL2hlaWdodCBhdHRycyBmcm9tIHRhZyBzbyBDU1MgY2FuIG1ha2UgaXQgMTAwJSB3aWR0aC9oZWlnaHRcbiAgdGFnLnJlbW92ZUF0dHJpYnV0ZSgnd2lkdGgnKTtcbiAgdGFnLnJlbW92ZUF0dHJpYnV0ZSgnaGVpZ2h0Jyk7XG4gIC8vIEVtcHR5IHZpZGVvIHRhZyB0cmFja3Mgc28gdGhlIGJ1aWx0LWluIHBsYXllciBkb2Vzbid0IHVzZSB0aGVtIGFsc28uXG4gIC8vIFRoaXMgbWF5IG5vdCBiZSBmYXN0IGVub3VnaCB0byBzdG9wIEhUTUw1IGJyb3dzZXJzIGZyb20gcmVhZGluZyB0aGUgdGFnc1xuICAvLyBzbyB3ZSdsbCBuZWVkIHRvIHR1cm4gb2ZmIGFueSBkZWZhdWx0IHRyYWNrcyBpZiB3ZSdyZSBtYW51YWxseSBkb2luZ1xuICAvLyBjYXB0aW9ucyBhbmQgc3VidGl0bGVzLiB2aWRlb0VsZW1lbnQudGV4dFRyYWNrc1xuICBpZiAodGFnLmhhc0NoaWxkTm9kZXMoKSkge1xuICAgIHZhciBub2Rlcywgbm9kZXNMZW5ndGgsIGksIG5vZGUsIG5vZGVOYW1lLCByZW1vdmVOb2RlcztcblxuICAgIG5vZGVzID0gdGFnLmNoaWxkTm9kZXM7XG4gICAgbm9kZXNMZW5ndGggPSBub2Rlcy5sZW5ndGg7XG4gICAgcmVtb3ZlTm9kZXMgPSBbXTtcblxuICAgIHdoaWxlIChub2Rlc0xlbmd0aC0tKSB7XG4gICAgICBub2RlID0gbm9kZXNbbm9kZXNMZW5ndGhdO1xuICAgICAgbm9kZU5hbWUgPSBub2RlLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICBpZiAobm9kZU5hbWUgPT09ICd0cmFjaycpIHtcbiAgICAgICAgcmVtb3ZlTm9kZXMucHVzaChub2RlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGk9MDsgaTxyZW1vdmVOb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgdGFnLnJlbW92ZUNoaWxkKHJlbW92ZU5vZGVzW2ldKTtcbiAgICB9XG4gIH1cblxuICAvLyBNYWtlIHN1cmUgdGFnIElEIGV4aXN0c1xuICB0YWcuaWQgPSB0YWcuaWQgfHwgJ3Zqc192aWRlb18nICsgdmpzLmd1aWQrKztcblxuICAvLyBHaXZlIHZpZGVvIHRhZyBJRCBhbmQgY2xhc3MgdG8gcGxheWVyIGRpdlxuICAvLyBJRCB3aWxsIG5vdyByZWZlcmVuY2UgcGxheWVyIGJveCwgbm90IHRoZSB2aWRlbyB0YWdcbiAgZWwuaWQgPSB0YWcuaWQ7XG4gIGVsLmNsYXNzTmFtZSA9IHRhZy5jbGFzc05hbWU7XG5cbiAgLy8gVXBkYXRlIHRhZyBpZC9jbGFzcyBmb3IgdXNlIGFzIEhUTUw1IHBsYXliYWNrIHRlY2hcbiAgLy8gTWlnaHQgdGhpbmsgd2Ugc2hvdWxkIGRvIHRoaXMgYWZ0ZXIgZW1iZWRkaW5nIGluIGNvbnRhaW5lciBzbyAudmpzLXRlY2ggY2xhc3NcbiAgLy8gZG9lc24ndCBmbGFzaCAxMDAlIHdpZHRoL2hlaWdodCwgYnV0IGNsYXNzIG9ubHkgYXBwbGllcyB3aXRoIC52aWRlby1qcyBwYXJlbnRcbiAgdGFnLmlkICs9ICdfaHRtbDVfYXBpJztcbiAgdGFnLmNsYXNzTmFtZSA9ICd2anMtdGVjaCc7XG5cbiAgLy8gTWFrZSBwbGF5ZXIgZmluZGFibGUgb24gZWxlbWVudHNcbiAgdGFnWydwbGF5ZXInXSA9IGVsWydwbGF5ZXInXSA9IHRoaXM7XG4gIC8vIERlZmF1bHQgc3RhdGUgb2YgdmlkZW8gaXMgcGF1c2VkXG4gIHRoaXMuYWRkQ2xhc3MoJ3Zqcy1wYXVzZWQnKTtcblxuICAvLyBNYWtlIGJveCB1c2Ugd2lkdGgvaGVpZ2h0IG9mIHRhZywgb3IgcmVseSBvbiBkZWZhdWx0IGltcGxlbWVudGF0aW9uXG4gIC8vIEVuZm9yY2Ugd2l0aCBDU1Mgc2luY2Ugd2lkdGgvaGVpZ2h0IGF0dHJzIGRvbid0IHdvcmsgb24gZGl2c1xuICB0aGlzLndpZHRoKHRoaXMub3B0aW9uc19bJ3dpZHRoJ10sIHRydWUpOyAvLyAodHJ1ZSkgU2tpcCByZXNpemUgbGlzdGVuZXIgb24gbG9hZFxuICB0aGlzLmhlaWdodCh0aGlzLm9wdGlvbnNfWydoZWlnaHQnXSwgdHJ1ZSk7XG5cbiAgLy8gV3JhcCB2aWRlbyB0YWcgaW4gZGl2IChlbC9ib3gpIGNvbnRhaW5lclxuICBpZiAodGFnLnBhcmVudE5vZGUpIHtcbiAgICB0YWcucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoZWwsIHRhZyk7XG4gIH1cbiAgdmpzLmluc2VydEZpcnN0KHRhZywgZWwpOyAvLyBCcmVha3MgaVBob25lLCBmaXhlZCBpbiBIVE1MNSBzZXR1cC5cblxuICByZXR1cm4gZWw7XG59O1xuXG4vLyAvKiBNZWRpYSBUZWNobm9sb2d5ICh0ZWNoKVxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi9cbi8vIExvYWQvQ3JlYXRlIGFuIGluc3RhbmNlIG9mIHBsYXliYWNrIHRlY2hubG9neSBpbmNsdWRpbmcgZWxlbWVudCBhbmQgQVBJIG1ldGhvZHNcbi8vIEFuZCBhcHBlbmQgcGxheWJhY2sgZWxlbWVudCBpbiBwbGF5ZXIgZGl2LlxudmpzLlBsYXllci5wcm90b3R5cGUubG9hZFRlY2ggPSBmdW5jdGlvbih0ZWNoTmFtZSwgc291cmNlKXtcblxuICAvLyBQYXVzZSBhbmQgcmVtb3ZlIGN1cnJlbnQgcGxheWJhY2sgdGVjaG5vbG9neVxuICBpZiAodGhpcy50ZWNoKSB7XG4gICAgdGhpcy51bmxvYWRUZWNoKCk7XG5cbiAgLy8gaWYgdGhpcyBpcyB0aGUgZmlyc3QgdGltZSBsb2FkaW5nLCBIVE1MNSB0YWcgd2lsbCBleGlzdCBidXQgd29uJ3QgYmUgaW5pdGlhbGl6ZWRcbiAgLy8gc28gd2UgbmVlZCB0byByZW1vdmUgaXQgaWYgd2UncmUgbm90IGxvYWRpbmcgSFRNTDVcbiAgfSBlbHNlIGlmICh0ZWNoTmFtZSAhPT0gJ0h0bWw1JyAmJiB0aGlzLnRhZykge1xuICAgIHZqcy5IdG1sNS5kaXNwb3NlTWVkaWFFbGVtZW50KHRoaXMudGFnKTtcbiAgICB0aGlzLnRhZyA9IG51bGw7XG4gIH1cblxuICB0aGlzLnRlY2hOYW1lID0gdGVjaE5hbWU7XG5cbiAgLy8gVHVybiBvZmYgQVBJIGFjY2VzcyBiZWNhdXNlIHdlJ3JlIGxvYWRpbmcgYSBuZXcgdGVjaCB0aGF0IG1pZ2h0IGxvYWQgYXN5bmNocm9ub3VzbHlcbiAgdGhpcy5pc1JlYWR5XyA9IGZhbHNlO1xuXG4gIHZhciB0ZWNoUmVhZHkgPSBmdW5jdGlvbigpe1xuICAgIHRoaXMucGxheWVyXy50cmlnZ2VyUmVhZHkoKTtcblxuICAgIC8vIE1hbnVhbGx5IHRyYWNrIHByb2dyZXNzIGluIGNhc2VzIHdoZXJlIHRoZSBicm93c2VyL2ZsYXNoIHBsYXllciBkb2Vzbid0IHJlcG9ydCBpdC5cbiAgICBpZiAoIXRoaXMuZmVhdHVyZXNbJ3Byb2dyZXNzRXZlbnRzJ10pIHtcbiAgICAgIHRoaXMucGxheWVyXy5tYW51YWxQcm9ncmVzc09uKCk7XG4gICAgfVxuXG4gICAgLy8gTWFudWFsbHkgdHJhY2sgdGltZXVkcGF0ZXMgaW4gY2FzZXMgd2hlcmUgdGhlIGJyb3dzZXIvZmxhc2ggcGxheWVyIGRvZXNuJ3QgcmVwb3J0IGl0LlxuICAgIGlmICghdGhpcy5mZWF0dXJlc1sndGltZXVwZGF0ZUV2ZW50cyddKSB7XG4gICAgICB0aGlzLnBsYXllcl8ubWFudWFsVGltZVVwZGF0ZXNPbigpO1xuICAgIH1cbiAgfTtcblxuICAvLyBHcmFiIHRlY2gtc3BlY2lmaWMgb3B0aW9ucyBmcm9tIHBsYXllciBvcHRpb25zIGFuZCBhZGQgc291cmNlIGFuZCBwYXJlbnQgZWxlbWVudCB0byB1c2UuXG4gIHZhciB0ZWNoT3B0aW9ucyA9IHZqcy5vYmoubWVyZ2UoeyAnc291cmNlJzogc291cmNlLCAncGFyZW50RWwnOiB0aGlzLmVsXyB9LCB0aGlzLm9wdGlvbnNfW3RlY2hOYW1lLnRvTG93ZXJDYXNlKCldKTtcblxuICBpZiAoc291cmNlKSB7XG4gICAgaWYgKHNvdXJjZS5zcmMgPT0gdGhpcy5jYWNoZV8uc3JjICYmIHRoaXMuY2FjaGVfLmN1cnJlbnRUaW1lID4gMCkge1xuICAgICAgdGVjaE9wdGlvbnNbJ3N0YXJ0VGltZSddID0gdGhpcy5jYWNoZV8uY3VycmVudFRpbWU7XG4gICAgfVxuXG4gICAgdGhpcy5jYWNoZV8uc3JjID0gc291cmNlLnNyYztcbiAgfVxuXG4gIC8vIEluaXRpYWxpemUgdGVjaCBpbnN0YW5jZVxuICB0aGlzLnRlY2ggPSBuZXcgd2luZG93Wyd2aWRlb2pzJ11bdGVjaE5hbWVdKHRoaXMsIHRlY2hPcHRpb25zKTtcblxuICB0aGlzLnRlY2gucmVhZHkodGVjaFJlYWR5KTtcbn07XG5cbnZqcy5QbGF5ZXIucHJvdG90eXBlLnVubG9hZFRlY2ggPSBmdW5jdGlvbigpe1xuICB0aGlzLmlzUmVhZHlfID0gZmFsc2U7XG4gIHRoaXMudGVjaC5kaXNwb3NlKCk7XG5cbiAgLy8gVHVybiBvZmYgYW55IG1hbnVhbCBwcm9ncmVzcyBvciB0aW1ldXBkYXRlIHRyYWNraW5nXG4gIGlmICh0aGlzLm1hbnVhbFByb2dyZXNzKSB7IHRoaXMubWFudWFsUHJvZ3Jlc3NPZmYoKTsgfVxuXG4gIGlmICh0aGlzLm1hbnVhbFRpbWVVcGRhdGVzKSB7IHRoaXMubWFudWFsVGltZVVwZGF0ZXNPZmYoKTsgfVxuXG4gIHRoaXMudGVjaCA9IGZhbHNlO1xufTtcblxuLy8gVGhlcmUncyBtYW55IGlzc3VlcyBhcm91bmQgY2hhbmdpbmcgdGhlIHNpemUgb2YgYSBGbGFzaCAob3Igb3RoZXIgcGx1Z2luKSBvYmplY3QuXG4vLyBGaXJzdCBpcyBhIHBsdWdpbiByZWxvYWQgaXNzdWUgaW4gRmlyZWZveCB0aGF0IGhhcyBiZWVuIGFyb3VuZCBmb3IgMTEgeWVhcnM6IGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTkwMjY4XG4vLyBUaGVuIHdpdGggdGhlIG5ldyBmdWxsc2NyZWVuIEFQSSwgTW96aWxsYSBhbmQgd2Via2l0IGJyb3dzZXJzIHdpbGwgcmVsb2FkIHRoZSBmbGFzaCBvYmplY3QgYWZ0ZXIgZ29pbmcgdG8gZnVsbHNjcmVlbi5cbi8vIFRvIGdldCBhcm91bmQgdGhpcywgd2UncmUgdW5sb2FkaW5nIHRoZSB0ZWNoLCBjYWNoaW5nIHNvdXJjZSBhbmQgY3VycmVudFRpbWUgdmFsdWVzLCBhbmQgcmVsb2FkaW5nIHRoZSB0ZWNoIG9uY2UgdGhlIHBsdWdpbiBpcyByZXNpemVkLlxuLy8gcmVsb2FkVGVjaDogZnVuY3Rpb24oYmV0d2VlbkZuKXtcbi8vICAgdmpzLmxvZygndW5sb2FkaW5nVGVjaCcpXG4vLyAgIHRoaXMudW5sb2FkVGVjaCgpO1xuLy8gICB2anMubG9nKCd1bmxvYWRlZFRlY2gnKVxuLy8gICBpZiAoYmV0d2VlbkZuKSB7IGJldHdlZW5Gbi5jYWxsKCk7IH1cbi8vICAgdmpzLmxvZygnTG9hZGluZ1RlY2gnKVxuLy8gICB0aGlzLmxvYWRUZWNoKHRoaXMudGVjaE5hbWUsIHsgc3JjOiB0aGlzLmNhY2hlXy5zcmMgfSlcbi8vICAgdmpzLmxvZygnbG9hZGVkVGVjaCcpXG4vLyB9LFxuXG4vKiBGYWxsYmFja3MgZm9yIHVuc3VwcG9ydGVkIGV2ZW50IHR5cGVzXG49PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqL1xuLy8gTWFudWFsbHkgdHJpZ2dlciBwcm9ncmVzcyBldmVudHMgYmFzZWQgb24gY2hhbmdlcyB0byB0aGUgYnVmZmVyZWQgYW1vdW50XG4vLyBNYW55IGZsYXNoIHBsYXllcnMgYW5kIG9sZGVyIEhUTUw1IGJyb3dzZXJzIGRvbid0IHNlbmQgcHJvZ3Jlc3Mgb3IgcHJvZ3Jlc3MtbGlrZSBldmVudHNcbnZqcy5QbGF5ZXIucHJvdG90eXBlLm1hbnVhbFByb2dyZXNzT24gPSBmdW5jdGlvbigpe1xuICB0aGlzLm1hbnVhbFByb2dyZXNzID0gdHJ1ZTtcblxuICAvLyBUcmlnZ2VyIHByb2dyZXNzIHdhdGNoaW5nIHdoZW4gYSBzb3VyY2UgYmVnaW5zIGxvYWRpbmdcbiAgdGhpcy50cmFja1Byb2dyZXNzKCk7XG5cbiAgLy8gV2F0Y2ggZm9yIGEgbmF0aXZlIHByb2dyZXNzIGV2ZW50IGNhbGwgb24gdGhlIHRlY2ggZWxlbWVudFxuICAvLyBJbiBIVE1MNSwgc29tZSBvbGRlciB2ZXJzaW9ucyBkb24ndCBzdXBwb3J0IHRoZSBwcm9ncmVzcyBldmVudFxuICAvLyBTbyB3ZSdyZSBhc3N1bWluZyB0aGV5IGRvbid0LCBhbmQgdHVybmluZyBvZmYgbWFudWFsIHByb2dyZXNzIGlmIHRoZXkgZG8uXG4gIC8vIEFzIG9wcG9zZWQgdG8gZG9pbmcgdXNlciBhZ2VudCBkZXRlY3Rpb25cbiAgdGhpcy50ZWNoLm9uZSgncHJvZ3Jlc3MnLCBmdW5jdGlvbigpe1xuXG4gICAgLy8gVXBkYXRlIGtub3duIHByb2dyZXNzIHN1cHBvcnQgZm9yIHRoaXMgcGxheWJhY2sgdGVjaG5vbG9neVxuICAgIHRoaXMuZmVhdHVyZXNbJ3Byb2dyZXNzRXZlbnRzJ10gPSB0cnVlO1xuXG4gICAgLy8gVHVybiBvZmYgbWFudWFsIHByb2dyZXNzIHRyYWNraW5nXG4gICAgdGhpcy5wbGF5ZXJfLm1hbnVhbFByb2dyZXNzT2ZmKCk7XG4gIH0pO1xufTtcblxudmpzLlBsYXllci5wcm90b3R5cGUubWFudWFsUHJvZ3Jlc3NPZmYgPSBmdW5jdGlvbigpe1xuICB0aGlzLm1hbnVhbFByb2dyZXNzID0gZmFsc2U7XG4gIHRoaXMuc3RvcFRyYWNraW5nUHJvZ3Jlc3MoKTtcbn07XG5cbnZqcy5QbGF5ZXIucHJvdG90eXBlLnRyYWNrUHJvZ3Jlc3MgPSBmdW5jdGlvbigpe1xuXG4gIHRoaXMucHJvZ3Jlc3NJbnRlcnZhbCA9IHNldEludGVydmFsKHZqcy5iaW5kKHRoaXMsIGZ1bmN0aW9uKCl7XG4gICAgLy8gRG9uJ3QgdHJpZ2dlciB1bmxlc3MgYnVmZmVyZWQgYW1vdW50IGlzIGdyZWF0ZXIgdGhhbiBsYXN0IHRpbWVcbiAgICAvLyBsb2codGhpcy5jYWNoZV8uYnVmZmVyRW5kLCB0aGlzLmJ1ZmZlcmVkKCkuZW5kKDApLCB0aGlzLmR1cmF0aW9uKCkpXG4gICAgLyogVE9ETzogdXBkYXRlIGZvciBtdWx0aXBsZSBidWZmZXJlZCByZWdpb25zICovXG4gICAgaWYgKHRoaXMuY2FjaGVfLmJ1ZmZlckVuZCA8IHRoaXMuYnVmZmVyZWQoKS5lbmQoMCkpIHtcbiAgICAgIHRoaXMudHJpZ2dlcigncHJvZ3Jlc3MnKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuYnVmZmVyZWRQZXJjZW50KCkgPT0gMSkge1xuICAgICAgdGhpcy5zdG9wVHJhY2tpbmdQcm9ncmVzcygpO1xuICAgICAgdGhpcy50cmlnZ2VyKCdwcm9ncmVzcycpOyAvLyBMYXN0IHVwZGF0ZVxuICAgIH1cbiAgfSksIDUwMCk7XG59O1xudmpzLlBsYXllci5wcm90b3R5cGUuc3RvcFRyYWNraW5nUHJvZ3Jlc3MgPSBmdW5jdGlvbigpeyBjbGVhckludGVydmFsKHRoaXMucHJvZ3Jlc3NJbnRlcnZhbCk7IH07XG5cbi8qISBUaW1lIFRyYWNraW5nIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG52anMuUGxheWVyLnByb3RvdHlwZS5tYW51YWxUaW1lVXBkYXRlc09uID0gZnVuY3Rpb24oKXtcbiAgdGhpcy5tYW51YWxUaW1lVXBkYXRlcyA9IHRydWU7XG5cbiAgdGhpcy5vbigncGxheScsIHRoaXMudHJhY2tDdXJyZW50VGltZSk7XG4gIHRoaXMub24oJ3BhdXNlJywgdGhpcy5zdG9wVHJhY2tpbmdDdXJyZW50VGltZSk7XG4gIC8vIHRpbWV1cGRhdGUgaXMgYWxzbyBjYWxsZWQgYnkgLmN1cnJlbnRUaW1lIHdoZW5ldmVyIGN1cnJlbnQgdGltZSBpcyBzZXRcblxuICAvLyBXYXRjaCBmb3IgbmF0aXZlIHRpbWV1cGRhdGUgZXZlbnRcbiAgdGhpcy50ZWNoLm9uZSgndGltZXVwZGF0ZScsIGZ1bmN0aW9uKCl7XG4gICAgLy8gVXBkYXRlIGtub3duIHByb2dyZXNzIHN1cHBvcnQgZm9yIHRoaXMgcGxheWJhY2sgdGVjaG5vbG9neVxuICAgIHRoaXMuZmVhdHVyZXNbJ3RpbWV1cGRhdGVFdmVudHMnXSA9IHRydWU7XG4gICAgLy8gVHVybiBvZmYgbWFudWFsIHByb2dyZXNzIHRyYWNraW5nXG4gICAgdGhpcy5wbGF5ZXJfLm1hbnVhbFRpbWVVcGRhdGVzT2ZmKCk7XG4gIH0pO1xufTtcblxudmpzLlBsYXllci5wcm90b3R5cGUubWFudWFsVGltZVVwZGF0ZXNPZmYgPSBmdW5jdGlvbigpe1xuICB0aGlzLm1hbnVhbFRpbWVVcGRhdGVzID0gZmFsc2U7XG4gIHRoaXMuc3RvcFRyYWNraW5nQ3VycmVudFRpbWUoKTtcbiAgdGhpcy5vZmYoJ3BsYXknLCB0aGlzLnRyYWNrQ3VycmVudFRpbWUpO1xuICB0aGlzLm9mZigncGF1c2UnLCB0aGlzLnN0b3BUcmFja2luZ0N1cnJlbnRUaW1lKTtcbn07XG5cbnZqcy5QbGF5ZXIucHJvdG90eXBlLnRyYWNrQ3VycmVudFRpbWUgPSBmdW5jdGlvbigpe1xuICBpZiAodGhpcy5jdXJyZW50VGltZUludGVydmFsKSB7IHRoaXMuc3RvcFRyYWNraW5nQ3VycmVudFRpbWUoKTsgfVxuICB0aGlzLmN1cnJlbnRUaW1lSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCh2anMuYmluZCh0aGlzLCBmdW5jdGlvbigpe1xuICAgIHRoaXMudHJpZ2dlcigndGltZXVwZGF0ZScpO1xuICB9KSwgMjUwKTsgLy8gNDIgPSAyNCBmcHMgLy8gMjUwIGlzIHdoYXQgV2Via2l0IHVzZXMgLy8gRkYgdXNlcyAxNVxufTtcblxuLy8gVHVybiBvZmYgcGxheSBwcm9ncmVzcyB0cmFja2luZyAod2hlbiBwYXVzZWQgb3IgZHJhZ2dpbmcpXG52anMuUGxheWVyLnByb3RvdHlwZS5zdG9wVHJhY2tpbmdDdXJyZW50VGltZSA9IGZ1bmN0aW9uKCl7IGNsZWFySW50ZXJ2YWwodGhpcy5jdXJyZW50VGltZUludGVydmFsKTsgfTtcblxuLy8gLyogUGxheWVyIGV2ZW50IGhhbmRsZXJzIChob3cgdGhlIHBsYXllciByZWFjdHMgdG8gY2VydGFpbiBldmVudHMpXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqL1xuXG4vKipcbiAqIEZpcmVkIHdoZW4gdGhlIHVzZXIgYWdlbnQgYmVnaW5zIGxvb2tpbmcgZm9yIG1lZGlhIGRhdGFcbiAqIEBldmVudCBsb2Fkc3RhcnRcbiAqL1xudmpzLlBsYXllci5wcm90b3R5cGUub25Mb2FkU3RhcnQ7XG5cbi8qKlxuICogRmlyZWQgd2hlbiB0aGUgcGxheWVyIGhhcyBpbml0aWFsIGR1cmF0aW9uIGFuZCBkaW1lbnNpb24gaW5mb3JtYXRpb25cbiAqIEBldmVudCBsb2FkZWRtZXRhZGF0YVxuICovXG52anMuUGxheWVyLnByb3RvdHlwZS5vbkxvYWRlZE1ldGFEYXRhO1xuXG4vKipcbiAqIEZpcmVkIHdoZW4gdGhlIHBsYXllciBoYXMgZG93bmxvYWRlZCBkYXRhIGF0IHRoZSBjdXJyZW50IHBsYXliYWNrIHBvc2l0aW9uXG4gKiBAZXZlbnQgbG9hZGVkZGF0YVxuICovXG52anMuUGxheWVyLnByb3RvdHlwZS5vbkxvYWRlZERhdGE7XG5cbi8qKlxuICogRmlyZWQgd2hlbiB0aGUgcGxheWVyIGhhcyBmaW5pc2hlZCBkb3dubG9hZGluZyB0aGUgc291cmNlIGRhdGFcbiAqIEBldmVudCBsb2FkZWRhbGxkYXRhXG4gKi9cbnZqcy5QbGF5ZXIucHJvdG90eXBlLm9uTG9hZGVkQWxsRGF0YTtcblxuLyoqXG4gKiBGaXJlZCB3aGVuZXZlciB0aGUgbWVkaWEgYmVnaW5zIG9yIHJlc3VtZXMgcGxheWJhY2tcbiAqIEBldmVudCBwbGF5XG4gKi9cbnZqcy5QbGF5ZXIucHJvdG90eXBlLm9uUGxheSA9IGZ1bmN0aW9uKCl7XG4gIHZqcy5yZW1vdmVDbGFzcyh0aGlzLmVsXywgJ3Zqcy1wYXVzZWQnKTtcbiAgdmpzLmFkZENsYXNzKHRoaXMuZWxfLCAndmpzLXBsYXlpbmcnKTtcbn07XG5cbi8qKlxuICogRmlyZWQgdGhlIGZpcnN0IHRpbWUgYSB2aWRlbyBpcyBwbGF5ZWRcbiAqXG4gKiBOb3QgcGFydCBvZiB0aGUgSExTIHNwZWMsIGFuZCB3ZSdyZSBub3Qgc3VyZSBpZiB0aGlzIGlzIHRoZSBiZXN0XG4gKiBpbXBsZW1lbnRhdGlvbiB5ZXQsIHNvIHVzZSBzcGFyaW5nbHkuIElmIHlvdSBkb24ndCBoYXZlIGEgcmVhc29uIHRvXG4gKiBwcmV2ZW50IHBsYXliYWNrLCB1c2UgYG15UGxheWVyLm9uZSgncGxheScpO2AgaW5zdGVhZC5cbiAqXG4gKiBAZXZlbnQgZmlyc3RwbGF5XG4gKi9cbnZqcy5QbGF5ZXIucHJvdG90eXBlLm9uRmlyc3RQbGF5ID0gZnVuY3Rpb24oKXtcbiAgICAvL0lmIHRoZSBmaXJzdCBzdGFydHRpbWUgYXR0cmlidXRlIGlzIHNwZWNpZmllZFxuICAgIC8vdGhlbiB3ZSB3aWxsIHN0YXJ0IGF0IHRoZSBnaXZlbiBvZmZzZXQgaW4gc2Vjb25kc1xuICAgIGlmKHRoaXMub3B0aW9uc19bJ3N0YXJ0dGltZSddKXtcbiAgICAgIHRoaXMuY3VycmVudFRpbWUodGhpcy5vcHRpb25zX1snc3RhcnR0aW1lJ10pO1xuICAgIH1cblxuICAgIHRoaXMuYWRkQ2xhc3MoJ3Zqcy1oYXMtc3RhcnRlZCcpO1xufTtcblxuLyoqXG4gKiBGaXJlZCB3aGVuZXZlciB0aGUgbWVkaWEgaGFzIGJlZW4gcGF1c2VkXG4gKiBAZXZlbnQgcGF1c2VcbiAqL1xudmpzLlBsYXllci5wcm90b3R5cGUub25QYXVzZSA9IGZ1bmN0aW9uKCl7XG4gIHZqcy5yZW1vdmVDbGFzcyh0aGlzLmVsXywgJ3Zqcy1wbGF5aW5nJyk7XG4gIHZqcy5hZGRDbGFzcyh0aGlzLmVsXywgJ3Zqcy1wYXVzZWQnKTtcbn07XG5cbi8qKlxuICogRmlyZWQgd2hlbiB0aGUgY3VycmVudCBwbGF5YmFjayBwb3NpdGlvbiBoYXMgY2hhbmdlZFxuICpcbiAqIER1cmluZyBwbGF5YmFjayB0aGlzIGlzIGZpcmVkIGV2ZXJ5IDE1LTI1MCBtaWxsaXNlY29uZHMsIGRlcG5kaW5nIG9uIHRoZVxuICogcGxheWJhY2sgdGVjaG5vbG9neSBpbiB1c2UuXG4gKiBAZXZlbnQgdGltZXVwZGF0ZVxuICovXG52anMuUGxheWVyLnByb3RvdHlwZS5vblRpbWVVcGRhdGU7XG5cbi8qKlxuICogRmlyZWQgd2hpbGUgdGhlIHVzZXIgYWdlbnQgaXMgZG93bmxvYWRpbmcgbWVkaWEgZGF0YVxuICogQGV2ZW50IHByb2dyZXNzXG4gKi9cbnZqcy5QbGF5ZXIucHJvdG90eXBlLm9uUHJvZ3Jlc3MgPSBmdW5jdGlvbigpe1xuICAvLyBBZGQgY3VzdG9tIGV2ZW50IGZvciB3aGVuIHNvdXJjZSBpcyBmaW5pc2hlZCBkb3dubG9hZGluZy5cbiAgaWYgKHRoaXMuYnVmZmVyZWRQZXJjZW50KCkgPT0gMSkge1xuICAgIHRoaXMudHJpZ2dlcignbG9hZGVkYWxsZGF0YScpO1xuICB9XG59O1xuXG4vKipcbiAqIEZpcmVkIHdoZW4gdGhlIGVuZCBvZiB0aGUgbWVkaWEgcmVzb3VyY2UgaXMgcmVhY2hlZCAoY3VycmVudFRpbWUgPT0gZHVyYXRpb24pXG4gKiBAZXZlbnQgZW5kZWRcbiAqL1xudmpzLlBsYXllci5wcm90b3R5cGUub25FbmRlZCA9IGZ1bmN0aW9uKCl7XG4gIGlmICh0aGlzLm9wdGlvbnNfWydsb29wJ10pIHtcbiAgICB0aGlzLmN1cnJlbnRUaW1lKDApO1xuICAgIHRoaXMucGxheSgpO1xuICB9XG59O1xuXG4vKipcbiAqIEZpcmVkIHdoZW4gdGhlIGR1cmF0aW9uIG9mIHRoZSBtZWRpYSByZXNvdXJjZSBpcyBmaXJzdCBrbm93biBvciBjaGFuZ2VkXG4gKiBAZXZlbnQgZHVyYXRpb25jaGFuZ2VcbiAqL1xudmpzLlBsYXllci5wcm90b3R5cGUub25EdXJhdGlvbkNoYW5nZSA9IGZ1bmN0aW9uKCl7XG4gIC8vIEFsbG93cyBmb3IgY2FjaGVpbmcgdmFsdWUgaW5zdGVhZCBvZiBhc2tpbmcgcGxheWVyIGVhY2ggdGltZS5cbiAgdGhpcy5kdXJhdGlvbih0aGlzLnRlY2hHZXQoJ2R1cmF0aW9uJykpO1xufTtcblxuLyoqXG4gKiBGaXJlZCB3aGVuIHRoZSB2b2x1bWUgY2hhbmdlc1xuICogQGV2ZW50IHZvbHVtZWNoYW5nZVxuICovXG52anMuUGxheWVyLnByb3RvdHlwZS5vblZvbHVtZUNoYW5nZTtcblxuLyoqXG4gKiBGaXJlZCB3aGVuIHRoZSBwbGF5ZXIgc3dpdGNoZXMgaW4gb3Igb3V0IG9mIGZ1bGxzY3JlZW4gbW9kZVxuICogQGV2ZW50IGZ1bGxzY3JlZW5jaGFuZ2VcbiAqL1xudmpzLlBsYXllci5wcm90b3R5cGUub25GdWxsc2NyZWVuQ2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLmlzRnVsbFNjcmVlbikge1xuICAgIHRoaXMuYWRkQ2xhc3MoJ3Zqcy1mdWxsc2NyZWVuJyk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5yZW1vdmVDbGFzcygndmpzLWZ1bGxzY3JlZW4nKTtcbiAgfVxufTtcblxuLyoqXG4gKiBGaXJlZCB3aGVuIHRoZXJlIGlzIGFuIGVycm9yIGluIHBsYXliYWNrXG4gKiBAZXZlbnQgZXJyb3JcbiAqL1xudmpzLlBsYXllci5wcm90b3R5cGUub25FcnJvciA9IGZ1bmN0aW9uKGUpIHtcbiAgdmpzLmxvZygnVmlkZW8gRXJyb3InLCBlKTtcbn07XG5cbi8vIC8qIFBsYXllciBBUElcbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovXG5cbi8qKlxuICogT2JqZWN0IGZvciBjYWNoZWQgdmFsdWVzLlxuICogQHByaXZhdGVcbiAqL1xudmpzLlBsYXllci5wcm90b3R5cGUuY2FjaGVfO1xuXG52anMuUGxheWVyLnByb3RvdHlwZS5nZXRDYWNoZSA9IGZ1bmN0aW9uKCl7XG4gIHJldHVybiB0aGlzLmNhY2hlXztcbn07XG5cbi8vIFBhc3MgdmFsdWVzIHRvIHRoZSBwbGF5YmFjayB0ZWNoXG52anMuUGxheWVyLnByb3RvdHlwZS50ZWNoQ2FsbCA9IGZ1bmN0aW9uKG1ldGhvZCwgYXJnKXtcbiAgLy8gSWYgaXQncyBub3QgcmVhZHkgeWV0LCBjYWxsIG1ldGhvZCB3aGVuIGl0IGlzXG4gIGlmICh0aGlzLnRlY2ggJiYgIXRoaXMudGVjaC5pc1JlYWR5Xykge1xuICAgIHRoaXMudGVjaC5yZWFkeShmdW5jdGlvbigpe1xuICAgICAgdGhpc1ttZXRob2RdKGFyZyk7XG4gICAgfSk7XG5cbiAgLy8gT3RoZXJ3aXNlIGNhbGwgbWV0aG9kIG5vd1xuICB9IGVsc2Uge1xuICAgIHRyeSB7XG4gICAgICB0aGlzLnRlY2hbbWV0aG9kXShhcmcpO1xuICAgIH0gY2F0Y2goZSkge1xuICAgICAgdmpzLmxvZyhlKTtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG59O1xuXG4vLyBHZXQgY2FsbHMgY2FuJ3Qgd2FpdCBmb3IgdGhlIHRlY2gsIGFuZCBzb21ldGltZXMgZG9uJ3QgbmVlZCB0by5cbnZqcy5QbGF5ZXIucHJvdG90eXBlLnRlY2hHZXQgPSBmdW5jdGlvbihtZXRob2Qpe1xuXG4gIGlmICh0aGlzLnRlY2ggJiYgdGhpcy50ZWNoLmlzUmVhZHlfKSB7XG5cbiAgICAvLyBGbGFzaCBsaWtlcyB0byBkaWUgYW5kIHJlbG9hZCB3aGVuIHlvdSBoaWRlIG9yIHJlcG9zaXRpb24gaXQuXG4gICAgLy8gSW4gdGhlc2UgY2FzZXMgdGhlIG9iamVjdCBtZXRob2RzIGdvIGF3YXkgYW5kIHdlIGdldCBlcnJvcnMuXG4gICAgLy8gV2hlbiB0aGF0IGhhcHBlbnMgd2UnbGwgY2F0Y2ggdGhlIGVycm9ycyBhbmQgaW5mb3JtIHRlY2ggdGhhdCBpdCdzIG5vdCByZWFkeSBhbnkgbW9yZS5cbiAgICB0cnkge1xuICAgICAgcmV0dXJuIHRoaXMudGVjaFttZXRob2RdKCk7XG4gICAgfSBjYXRjaChlKSB7XG4gICAgICAvLyBXaGVuIGJ1aWxkaW5nIGFkZGl0aW9uYWwgdGVjaCBsaWJzLCBhbiBleHBlY3RlZCBtZXRob2QgbWF5IG5vdCBiZSBkZWZpbmVkIHlldFxuICAgICAgaWYgKHRoaXMudGVjaFttZXRob2RdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdmpzLmxvZygnVmlkZW8uanM6ICcgKyBtZXRob2QgKyAnIG1ldGhvZCBub3QgZGVmaW5lZCBmb3IgJyt0aGlzLnRlY2hOYW1lKycgcGxheWJhY2sgdGVjaG5vbG9neS4nLCBlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFdoZW4gYSBtZXRob2QgaXNuJ3QgYXZhaWxhYmxlIG9uIHRoZSBvYmplY3QgaXQgdGhyb3dzIGEgVHlwZUVycm9yXG4gICAgICAgIGlmIChlLm5hbWUgPT0gJ1R5cGVFcnJvcicpIHtcbiAgICAgICAgICB2anMubG9nKCdWaWRlby5qczogJyArIG1ldGhvZCArICcgdW5hdmFpbGFibGUgb24gJyt0aGlzLnRlY2hOYW1lKycgcGxheWJhY2sgdGVjaG5vbG9neSBlbGVtZW50LicsIGUpO1xuICAgICAgICAgIHRoaXMudGVjaC5pc1JlYWR5XyA9IGZhbHNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZqcy5sb2coZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuO1xufTtcblxuLyoqXG4gKiBzdGFydCBtZWRpYSBwbGF5YmFja1xuICpcbiAqICAgICBteVBsYXllci5wbGF5KCk7XG4gKlxuICogQHJldHVybiB7dmpzLlBsYXllcn0gc2VsZlxuICovXG52anMuUGxheWVyLnByb3RvdHlwZS5wbGF5ID0gZnVuY3Rpb24oKXtcbiAgdGhpcy50ZWNoQ2FsbCgncGxheScpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUGF1c2UgdGhlIHZpZGVvIHBsYXliYWNrXG4gKlxuICogICAgIG15UGxheWVyLnBhdXNlKCk7XG4gKlxuICogQHJldHVybiB7dmpzLlBsYXllcn0gc2VsZlxuICovXG52anMuUGxheWVyLnByb3RvdHlwZS5wYXVzZSA9IGZ1bmN0aW9uKCl7XG4gIHRoaXMudGVjaENhbGwoJ3BhdXNlJyk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBDaGVjayBpZiB0aGUgcGxheWVyIGlzIHBhdXNlZFxuICpcbiAqICAgICB2YXIgaXNQYXVzZWQgPSBteVBsYXllci5wYXVzZWQoKTtcbiAqICAgICB2YXIgaXNQbGF5aW5nID0gIW15UGxheWVyLnBhdXNlZCgpO1xuICpcbiAqIEByZXR1cm4ge0Jvb2xlYW59IGZhbHNlIGlmIHRoZSBtZWRpYSBpcyBjdXJyZW50bHkgcGxheWluZywgb3IgdHJ1ZSBvdGhlcndpc2VcbiAqL1xudmpzLlBsYXllci5wcm90b3R5cGUucGF1c2VkID0gZnVuY3Rpb24oKXtcbiAgLy8gVGhlIGluaXRpYWwgc3RhdGUgb2YgcGF1c2VkIHNob3VsZCBiZSB0cnVlIChpbiBTYWZhcmkgaXQncyBhY3R1YWxseSBmYWxzZSlcbiAgcmV0dXJuICh0aGlzLnRlY2hHZXQoJ3BhdXNlZCcpID09PSBmYWxzZSkgPyBmYWxzZSA6IHRydWU7XG59O1xuXG4vKipcbiAqIEdldCBvciBzZXQgdGhlIGN1cnJlbnQgdGltZSAoaW4gc2Vjb25kcylcbiAqXG4gKiAgICAgLy8gZ2V0XG4gKiAgICAgdmFyIHdoZXJlWW91QXQgPSBteVBsYXllci5jdXJyZW50VGltZSgpO1xuICpcbiAqICAgICAvLyBzZXRcbiAqICAgICBteVBsYXllci5jdXJyZW50VGltZSgxMjApOyAvLyAyIG1pbnV0ZXMgaW50byB0aGUgdmlkZW9cbiAqXG4gKiBAcGFyYW0gIHtOdW1iZXJ8U3RyaW5nPX0gc2Vjb25kcyBUaGUgdGltZSB0byBzZWVrIHRvXG4gKiBAcmV0dXJuIHtOdW1iZXJ9ICAgICAgICBUaGUgdGltZSBpbiBzZWNvbmRzLCB3aGVuIG5vdCBzZXR0aW5nXG4gKiBAcmV0dXJuIHt2anMuUGxheWVyfSAgICBzZWxmLCB3aGVuIHRoZSBjdXJyZW50IHRpbWUgaXMgc2V0XG4gKi9cbnZqcy5QbGF5ZXIucHJvdG90eXBlLmN1cnJlbnRUaW1lID0gZnVuY3Rpb24oc2Vjb25kcyl7XG4gIGlmIChzZWNvbmRzICE9PSB1bmRlZmluZWQpIHtcblxuICAgIC8vIGNhY2hlIHRoZSBsYXN0IHNldCB2YWx1ZSBmb3Igc21vb3RoZXIgc2NydWJiaW5nXG4gICAgdGhpcy5jYWNoZV8ubGFzdFNldEN1cnJlbnRUaW1lID0gc2Vjb25kcztcblxuICAgIHRoaXMudGVjaENhbGwoJ3NldEN1cnJlbnRUaW1lJywgc2Vjb25kcyk7XG5cbiAgICAvLyBpbXByb3ZlIHRoZSBhY2N1cmFjeSBvZiBtYW51YWwgdGltZXVwZGF0ZXNcbiAgICBpZiAodGhpcy5tYW51YWxUaW1lVXBkYXRlcykgeyB0aGlzLnRyaWdnZXIoJ3RpbWV1cGRhdGUnKTsgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBjYWNoZSBsYXN0IGN1cnJlbnRUaW1lIGFuZCByZXR1cm5cbiAgLy8gZGVmYXVsdCB0byAwIHNlY29uZHNcbiAgcmV0dXJuIHRoaXMuY2FjaGVfLmN1cnJlbnRUaW1lID0gKHRoaXMudGVjaEdldCgnY3VycmVudFRpbWUnKSB8fCAwKTtcbn07XG5cbi8qKlxuICogR2V0IHRoZSBsZW5ndGggaW4gdGltZSBvZiB0aGUgdmlkZW8gaW4gc2Vjb25kc1xuICpcbiAqICAgICB2YXIgbGVuZ3RoT2ZWaWRlbyA9IG15UGxheWVyLmR1cmF0aW9uKCk7XG4gKlxuICogKipOT1RFKio6IFRoZSB2aWRlbyBtdXN0IGhhdmUgc3RhcnRlZCBsb2FkaW5nIGJlZm9yZSB0aGUgZHVyYXRpb24gY2FuIGJlXG4gKiBrbm93biwgYW5kIGluIHRoZSBjYXNlIG9mIEZsYXNoLCBtYXkgbm90IGJlIGtub3duIHVudGlsIHRoZSB2aWRlbyBzdGFydHNcbiAqIHBsYXlpbmcuXG4gKlxuICogQHJldHVybiB7TnVtYmVyfSBUaGUgZHVyYXRpb24gb2YgdGhlIHZpZGVvIGluIHNlY29uZHNcbiAqL1xudmpzLlBsYXllci5wcm90b3R5cGUuZHVyYXRpb24gPSBmdW5jdGlvbihzZWNvbmRzKXtcbiAgaWYgKHNlY29uZHMgIT09IHVuZGVmaW5lZCkge1xuXG4gICAgLy8gY2FjaGUgdGhlIGxhc3Qgc2V0IHZhbHVlIGZvciBvcHRpbWlpemVkIHNjcnViYmluZyAoZXNwLiBGbGFzaClcbiAgICB0aGlzLmNhY2hlXy5kdXJhdGlvbiA9IHBhcnNlRmxvYXQoc2Vjb25kcyk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGlmICh0aGlzLmNhY2hlXy5kdXJhdGlvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5vbkR1cmF0aW9uQ2hhbmdlKCk7XG4gIH1cblxuICByZXR1cm4gdGhpcy5jYWNoZV8uZHVyYXRpb247XG59O1xuXG4vLyBDYWxjdWxhdGVzIGhvdyBtdWNoIHRpbWUgaXMgbGVmdC4gTm90IGluIHNwZWMsIGJ1dCB1c2VmdWwuXG52anMuUGxheWVyLnByb3RvdHlwZS5yZW1haW5pbmdUaW1lID0gZnVuY3Rpb24oKXtcbiAgcmV0dXJuIHRoaXMuZHVyYXRpb24oKSAtIHRoaXMuY3VycmVudFRpbWUoKTtcbn07XG5cbi8vIGh0dHA6Ly9kZXYudzMub3JnL2h0bWw1L3NwZWMvdmlkZW8uaHRtbCNkb20tbWVkaWEtYnVmZmVyZWRcbi8vIEJ1ZmZlcmVkIHJldHVybnMgYSB0aW1lcmFuZ2Ugb2JqZWN0LlxuLy8gS2luZCBvZiBsaWtlIGFuIGFycmF5IG9mIHBvcnRpb25zIG9mIHRoZSB2aWRlbyB0aGF0IGhhdmUgYmVlbiBkb3dubG9hZGVkLlxuLy8gU28gZmFyIG5vIGJyb3dzZXJzIHJldHVybiBtb3JlIHRoYW4gb25lIHJhbmdlIChwb3J0aW9uKVxuXG4vKipcbiAqIEdldCBhIFRpbWVSYW5nZSBvYmplY3Qgd2l0aCB0aGUgdGltZXMgb2YgdGhlIHZpZGVvIHRoYXQgaGF2ZSBiZWVuIGRvd25sb2FkZWRcbiAqXG4gKiBJZiB5b3UganVzdCB3YW50IHRoZSBwZXJjZW50IG9mIHRoZSB2aWRlbyB0aGF0J3MgYmVlbiBkb3dubG9hZGVkLFxuICogdXNlIGJ1ZmZlcmVkUGVyY2VudC5cbiAqXG4gKiAgICAgLy8gTnVtYmVyIG9mIGRpZmZlcmVudCByYW5nZXMgb2YgdGltZSBoYXZlIGJlZW4gYnVmZmVyZWQuIFVzdWFsbHkgMS5cbiAqICAgICBudW1iZXJPZlJhbmdlcyA9IGJ1ZmZlcmVkVGltZVJhbmdlLmxlbmd0aCxcbiAqXG4gKiAgICAgLy8gVGltZSBpbiBzZWNvbmRzIHdoZW4gdGhlIGZpcnN0IHJhbmdlIHN0YXJ0cy4gVXN1YWxseSAwLlxuICogICAgIGZpcnN0UmFuZ2VTdGFydCA9IGJ1ZmZlcmVkVGltZVJhbmdlLnN0YXJ0KDApLFxuICpcbiAqICAgICAvLyBUaW1lIGluIHNlY29uZHMgd2hlbiB0aGUgZmlyc3QgcmFuZ2UgZW5kc1xuICogICAgIGZpcnN0UmFuZ2VFbmQgPSBidWZmZXJlZFRpbWVSYW5nZS5lbmQoMCksXG4gKlxuICogICAgIC8vIExlbmd0aCBpbiBzZWNvbmRzIG9mIHRoZSBmaXJzdCB0aW1lIHJhbmdlXG4gKiAgICAgZmlyc3RSYW5nZUxlbmd0aCA9IGZpcnN0UmFuZ2VFbmQgLSBmaXJzdFJhbmdlU3RhcnQ7XG4gKlxuICogQHJldHVybiB7T2JqZWN0fSBBIG1vY2sgVGltZVJhbmdlIG9iamVjdCAoZm9sbG93aW5nIEhUTUwgc3BlYylcbiAqL1xudmpzLlBsYXllci5wcm90b3R5cGUuYnVmZmVyZWQgPSBmdW5jdGlvbigpe1xuICB2YXIgYnVmZmVyZWQgPSB0aGlzLnRlY2hHZXQoJ2J1ZmZlcmVkJyksXG4gICAgICBzdGFydCA9IDAsXG4gICAgICBidWZsYXN0ID0gYnVmZmVyZWQubGVuZ3RoIC0gMSxcbiAgICAgIC8vIERlZmF1bHQgZW5kIHRvIDAgYW5kIHN0b3JlIGluIHZhbHVlc1xuICAgICAgZW5kID0gdGhpcy5jYWNoZV8uYnVmZmVyRW5kID0gdGhpcy5jYWNoZV8uYnVmZmVyRW5kIHx8IDA7XG5cbiAgaWYgKGJ1ZmZlcmVkICYmIGJ1Zmxhc3QgPj0gMCAmJiBidWZmZXJlZC5lbmQoYnVmbGFzdCkgIT09IGVuZCkge1xuICAgIGVuZCA9IGJ1ZmZlcmVkLmVuZChidWZsYXN0KTtcbiAgICAvLyBTdG9yaW5nIHZhbHVlcyBhbGxvd3MgdGhlbSBiZSBvdmVycmlkZGVuIGJ5IHNldEJ1ZmZlcmVkRnJvbVByb2dyZXNzXG4gICAgdGhpcy5jYWNoZV8uYnVmZmVyRW5kID0gZW5kO1xuICB9XG5cbiAgcmV0dXJuIHZqcy5jcmVhdGVUaW1lUmFuZ2Uoc3RhcnQsIGVuZCk7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgcGVyY2VudCAoYXMgYSBkZWNpbWFsKSBvZiB0aGUgdmlkZW8gdGhhdCdzIGJlZW4gZG93bmxvYWRlZFxuICpcbiAqICAgICB2YXIgaG93TXVjaElzRG93bmxvYWRlZCA9IG15UGxheWVyLmJ1ZmZlcmVkUGVyY2VudCgpO1xuICpcbiAqIDAgbWVhbnMgbm9uZSwgMSBtZWFucyBhbGwuXG4gKiAoVGhpcyBtZXRob2QgaXNuJ3QgaW4gdGhlIEhUTUw1IHNwZWMsIGJ1dCBpdCdzIHZlcnkgY29udmVuaWVudClcbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IEEgZGVjaW1hbCBiZXR3ZWVuIDAgYW5kIDEgcmVwcmVzZW50aW5nIHRoZSBwZXJjZW50XG4gKi9cbnZqcy5QbGF5ZXIucHJvdG90eXBlLmJ1ZmZlcmVkUGVyY2VudCA9IGZ1bmN0aW9uKCl7XG4gIHJldHVybiAodGhpcy5kdXJhdGlvbigpKSA/IHRoaXMuYnVmZmVyZWQoKS5lbmQoMCkgLyB0aGlzLmR1cmF0aW9uKCkgOiAwO1xufTtcblxuLyoqXG4gKiBHZXQgb3Igc2V0IHRoZSBjdXJyZW50IHZvbHVtZSBvZiB0aGUgbWVkaWFcbiAqXG4gKiAgICAgLy8gZ2V0XG4gKiAgICAgdmFyIGhvd0xvdWRJc0l0ID0gbXlQbGF5ZXIudm9sdW1lKCk7XG4gKlxuICogICAgIC8vIHNldFxuICogICAgIG15UGxheWVyLnZvbHVtZSgwLjUpOyAvLyBTZXQgdm9sdW1lIHRvIGhhbGZcbiAqXG4gKiAwIGlzIG9mZiAobXV0ZWQpLCAxLjAgaXMgYWxsIHRoZSB3YXkgdXAsIDAuNSBpcyBoYWxmIHdheS5cbiAqXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IHBlcmNlbnRBc0RlY2ltYWwgVGhlIG5ldyB2b2x1bWUgYXMgYSBkZWNpbWFsIHBlcmNlbnRcbiAqIEByZXR1cm4ge051bWJlcn0gICAgICAgICAgICAgICAgICBUaGUgY3VycmVudCB2b2x1bWUsIHdoZW4gZ2V0dGluZ1xuICogQHJldHVybiB7dmpzLlBsYXllcn0gICAgICAgICAgICAgIHNlbGYsIHdoZW4gc2V0dGluZ1xuICovXG52anMuUGxheWVyLnByb3RvdHlwZS52b2x1bWUgPSBmdW5jdGlvbihwZXJjZW50QXNEZWNpbWFsKXtcbiAgdmFyIHZvbDtcblxuICBpZiAocGVyY2VudEFzRGVjaW1hbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgdm9sID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMSwgcGFyc2VGbG9hdChwZXJjZW50QXNEZWNpbWFsKSkpOyAvLyBGb3JjZSB2YWx1ZSB0byBiZXR3ZWVuIDAgYW5kIDFcbiAgICB0aGlzLmNhY2hlXy52b2x1bWUgPSB2b2w7XG4gICAgdGhpcy50ZWNoQ2FsbCgnc2V0Vm9sdW1lJywgdm9sKTtcbiAgICB2anMuc2V0TG9jYWxTdG9yYWdlKCd2b2x1bWUnLCB2b2wpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gRGVmYXVsdCB0byAxIHdoZW4gcmV0dXJuaW5nIGN1cnJlbnQgdm9sdW1lLlxuICB2b2wgPSBwYXJzZUZsb2F0KHRoaXMudGVjaEdldCgndm9sdW1lJykpO1xuICByZXR1cm4gKGlzTmFOKHZvbCkpID8gMSA6IHZvbDtcbn07XG5cblxuLyoqXG4gKiBHZXQgdGhlIGN1cnJlbnQgbXV0ZWQgc3RhdGUsIG9yIHR1cm4gbXV0ZSBvbiBvciBvZmZcbiAqXG4gKiAgICAgLy8gZ2V0XG4gKiAgICAgdmFyIGlzVm9sdW1lTXV0ZWQgPSBteVBsYXllci5tdXRlZCgpO1xuICpcbiAqICAgICAvLyBzZXRcbiAqICAgICBteVBsYXllci5tdXRlZCh0cnVlKTsgLy8gbXV0ZSB0aGUgdm9sdW1lXG4gKlxuICogQHBhcmFtICB7Qm9vbGVhbj19IG11dGVkIFRydWUgdG8gbXV0ZSwgZmFsc2UgdG8gdW5tdXRlXG4gKiBAcmV0dXJuIHtCb29sZWFufSBUcnVlIGlmIG11dGUgaXMgb24sIGZhbHNlIGlmIG5vdCwgd2hlbiBnZXR0aW5nXG4gKiBAcmV0dXJuIHt2anMuUGxheWVyfSBzZWxmLCB3aGVuIHNldHRpbmcgbXV0ZVxuICovXG52anMuUGxheWVyLnByb3RvdHlwZS5tdXRlZCA9IGZ1bmN0aW9uKG11dGVkKXtcbiAgaWYgKG11dGVkICE9PSB1bmRlZmluZWQpIHtcbiAgICB0aGlzLnRlY2hDYWxsKCdzZXRNdXRlZCcsIG11dGVkKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICByZXR1cm4gdGhpcy50ZWNoR2V0KCdtdXRlZCcpIHx8IGZhbHNlOyAvLyBEZWZhdWx0IHRvIGZhbHNlXG59O1xuXG4vLyBDaGVjayBpZiBjdXJyZW50IHRlY2ggY2FuIHN1cHBvcnQgbmF0aXZlIGZ1bGxzY3JlZW4gKGUuZy4gd2l0aCBidWlsdCBpbiBjb250cm9scyBsaWsgaU9TLCBzbyBub3Qgb3VyIGZsYXNoIHN3ZilcbnZqcy5QbGF5ZXIucHJvdG90eXBlLnN1cHBvcnRzRnVsbFNjcmVlbiA9IGZ1bmN0aW9uKCl7IHJldHVybiB0aGlzLnRlY2hHZXQoJ3N1cHBvcnRzRnVsbFNjcmVlbicpIHx8IGZhbHNlOyB9O1xuXG4vKipcbiAqIEluY3JlYXNlIHRoZSBzaXplIG9mIHRoZSB2aWRlbyB0byBmdWxsIHNjcmVlblxuICpcbiAqICAgICBteVBsYXllci5yZXF1ZXN0RnVsbFNjcmVlbigpO1xuICpcbiAqIEluIHNvbWUgYnJvd3NlcnMsIGZ1bGwgc2NyZWVuIGlzIG5vdCBzdXBwb3J0ZWQgbmF0aXZlbHksIHNvIGl0IGVudGVyc1xuICogXCJmdWxsIHdpbmRvdyBtb2RlXCIsIHdoZXJlIHRoZSB2aWRlbyBmaWxscyB0aGUgYnJvd3NlciB3aW5kb3cuXG4gKiBJbiBicm93c2VycyBhbmQgZGV2aWNlcyB0aGF0IHN1cHBvcnQgbmF0aXZlIGZ1bGwgc2NyZWVuLCBzb21ldGltZXMgdGhlXG4gKiBicm93c2VyJ3MgZGVmYXVsdCBjb250cm9scyB3aWxsIGJlIHNob3duLCBhbmQgbm90IHRoZSBWaWRlby5qcyBjdXN0b20gc2tpbi5cbiAqIFRoaXMgaW5jbHVkZXMgbW9zdCBtb2JpbGUgZGV2aWNlcyAoaU9TLCBBbmRyb2lkKSBhbmQgb2xkZXIgdmVyc2lvbnMgb2ZcbiAqIFNhZmFyaS5cbiAqXG4gKiBAcmV0dXJuIHt2anMuUGxheWVyfSBzZWxmXG4gKi9cbnZqcy5QbGF5ZXIucHJvdG90eXBlLnJlcXVlc3RGdWxsU2NyZWVuID0gZnVuY3Rpb24oKXtcbiAgdmFyIHJlcXVlc3RGdWxsU2NyZWVuID0gdmpzLnN1cHBvcnQucmVxdWVzdEZ1bGxTY3JlZW47XG4gIHRoaXMuaXNGdWxsU2NyZWVuID0gdHJ1ZTtcblxuICBpZiAocmVxdWVzdEZ1bGxTY3JlZW4pIHtcbiAgICAvLyB0aGUgYnJvd3NlciBzdXBwb3J0cyBnb2luZyBmdWxsc2NyZWVuIGF0IHRoZSBlbGVtZW50IGxldmVsIHNvIHdlIGNhblxuICAgIC8vIHRha2UgdGhlIGNvbnRyb2xzIGZ1bGxzY3JlZW4gYXMgd2VsbCBhcyB0aGUgdmlkZW9cblxuICAgIC8vIFRyaWdnZXIgZnVsbHNjcmVlbmNoYW5nZSBldmVudCBhZnRlciBjaGFuZ2VcbiAgICAvLyBXZSBoYXZlIHRvIHNwZWNpZmljYWxseSBhZGQgdGhpcyBlYWNoIHRpbWUsIGFuZCByZW1vdmVcbiAgICAvLyB3aGVuIGNhbmNlbGxpbmcgZnVsbHNjcmVlbi4gT3RoZXJ3aXNlIGlmIHRoZXJlJ3MgbXVsdGlwbGVcbiAgICAvLyBwbGF5ZXJzIG9uIGEgcGFnZSwgdGhleSB3b3VsZCBhbGwgYmUgcmVhY3RpbmcgdG8gdGhlIHNhbWUgZnVsbHNjcmVlblxuICAgIC8vIGV2ZW50c1xuICAgIHZqcy5vbihkb2N1bWVudCwgcmVxdWVzdEZ1bGxTY3JlZW4uZXZlbnROYW1lLCB2anMuYmluZCh0aGlzLCBmdW5jdGlvbihlKXtcbiAgICAgIHRoaXMuaXNGdWxsU2NyZWVuID0gZG9jdW1lbnRbcmVxdWVzdEZ1bGxTY3JlZW4uaXNGdWxsU2NyZWVuXTtcblxuICAgICAgLy8gSWYgY2FuY2VsbGluZyBmdWxsc2NyZWVuLCByZW1vdmUgZXZlbnQgbGlzdGVuZXIuXG4gICAgICBpZiAodGhpcy5pc0Z1bGxTY3JlZW4gPT09IGZhbHNlKSB7XG4gICAgICAgIHZqcy5vZmYoZG9jdW1lbnQsIHJlcXVlc3RGdWxsU2NyZWVuLmV2ZW50TmFtZSwgYXJndW1lbnRzLmNhbGxlZSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMudHJpZ2dlcignZnVsbHNjcmVlbmNoYW5nZScpO1xuICAgIH0pKTtcblxuICAgIHRoaXMuZWxfW3JlcXVlc3RGdWxsU2NyZWVuLnJlcXVlc3RGbl0oKTtcblxuICB9IGVsc2UgaWYgKHRoaXMudGVjaC5zdXBwb3J0c0Z1bGxTY3JlZW4oKSkge1xuICAgIC8vIHdlIGNhbid0IHRha2UgdGhlIHZpZGVvLmpzIGNvbnRyb2xzIGZ1bGxzY3JlZW4gYnV0IHdlIGNhbiBnbyBmdWxsc2NyZWVuXG4gICAgLy8gd2l0aCBuYXRpdmUgY29udHJvbHNcbiAgICB0aGlzLnRlY2hDYWxsKCdlbnRlckZ1bGxTY3JlZW4nKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBmdWxsc2NyZWVuIGlzbid0IHN1cHBvcnRlZCBzbyB3ZSdsbCBqdXN0IHN0cmV0Y2ggdGhlIHZpZGVvIGVsZW1lbnQgdG9cbiAgICAvLyBmaWxsIHRoZSB2aWV3cG9ydFxuICAgIHRoaXMuZW50ZXJGdWxsV2luZG93KCk7XG4gICAgdGhpcy50cmlnZ2VyKCdmdWxsc2NyZWVuY2hhbmdlJyk7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmV0dXJuIHRoZSB2aWRlbyB0byBpdHMgbm9ybWFsIHNpemUgYWZ0ZXIgaGF2aW5nIGJlZW4gaW4gZnVsbCBzY3JlZW4gbW9kZVxuICpcbiAqICAgICBteVBsYXllci5jYW5jZWxGdWxsU2NyZWVuKCk7XG4gKlxuICogQHJldHVybiB7dmpzLlBsYXllcn0gc2VsZlxuICovXG52anMuUGxheWVyLnByb3RvdHlwZS5jYW5jZWxGdWxsU2NyZWVuID0gZnVuY3Rpb24oKXtcbiAgdmFyIHJlcXVlc3RGdWxsU2NyZWVuID0gdmpzLnN1cHBvcnQucmVxdWVzdEZ1bGxTY3JlZW47XG4gIHRoaXMuaXNGdWxsU2NyZWVuID0gZmFsc2U7XG5cbiAgLy8gQ2hlY2sgZm9yIGJyb3dzZXIgZWxlbWVudCBmdWxsc2NyZWVuIHN1cHBvcnRcbiAgaWYgKHJlcXVlc3RGdWxsU2NyZWVuKSB7XG4gICAgZG9jdW1lbnRbcmVxdWVzdEZ1bGxTY3JlZW4uY2FuY2VsRm5dKCk7XG4gIH0gZWxzZSBpZiAodGhpcy50ZWNoLnN1cHBvcnRzRnVsbFNjcmVlbigpKSB7XG4gICB0aGlzLnRlY2hDYWxsKCdleGl0RnVsbFNjcmVlbicpO1xuICB9IGVsc2Uge1xuICAgdGhpcy5leGl0RnVsbFdpbmRvdygpO1xuICAgdGhpcy50cmlnZ2VyKCdmdWxsc2NyZWVuY2hhbmdlJyk7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIFdoZW4gZnVsbHNjcmVlbiBpc24ndCBzdXBwb3J0ZWQgd2UgY2FuIHN0cmV0Y2ggdGhlIHZpZGVvIGNvbnRhaW5lciB0byBhcyB3aWRlIGFzIHRoZSBicm93c2VyIHdpbGwgbGV0IHVzLlxudmpzLlBsYXllci5wcm90b3R5cGUuZW50ZXJGdWxsV2luZG93ID0gZnVuY3Rpb24oKXtcbiAgdGhpcy5pc0Z1bGxXaW5kb3cgPSB0cnVlO1xuXG4gIC8vIFN0b3Jpbmcgb3JpZ2luYWwgZG9jIG92ZXJmbG93IHZhbHVlIHRvIHJldHVybiB0byB3aGVuIGZ1bGxzY3JlZW4gaXMgb2ZmXG4gIHRoaXMuZG9jT3JpZ092ZXJmbG93ID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLm92ZXJmbG93O1xuXG4gIC8vIEFkZCBsaXN0ZW5lciBmb3IgZXNjIGtleSB0byBleGl0IGZ1bGxzY3JlZW5cbiAgdmpzLm9uKGRvY3VtZW50LCAna2V5ZG93bicsIHZqcy5iaW5kKHRoaXMsIHRoaXMuZnVsbFdpbmRvd09uRXNjS2V5KSk7XG5cbiAgLy8gSGlkZSBhbnkgc2Nyb2xsIGJhcnNcbiAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XG5cbiAgLy8gQXBwbHkgZnVsbHNjcmVlbiBzdHlsZXNcbiAgdmpzLmFkZENsYXNzKGRvY3VtZW50LmJvZHksICd2anMtZnVsbC13aW5kb3cnKTtcblxuICB0aGlzLnRyaWdnZXIoJ2VudGVyRnVsbFdpbmRvdycpO1xufTtcbnZqcy5QbGF5ZXIucHJvdG90eXBlLmZ1bGxXaW5kb3dPbkVzY0tleSA9IGZ1bmN0aW9uKGV2ZW50KXtcbiAgaWYgKGV2ZW50LmtleUNvZGUgPT09IDI3KSB7XG4gICAgaWYgKHRoaXMuaXNGdWxsU2NyZWVuID09PSB0cnVlKSB7XG4gICAgICB0aGlzLmNhbmNlbEZ1bGxTY3JlZW4oKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5leGl0RnVsbFdpbmRvdygpO1xuICAgIH1cbiAgfVxufTtcblxudmpzLlBsYXllci5wcm90b3R5cGUuZXhpdEZ1bGxXaW5kb3cgPSBmdW5jdGlvbigpe1xuICB0aGlzLmlzRnVsbFdpbmRvdyA9IGZhbHNlO1xuICB2anMub2ZmKGRvY3VtZW50LCAna2V5ZG93bicsIHRoaXMuZnVsbFdpbmRvd09uRXNjS2V5KTtcblxuICAvLyBVbmhpZGUgc2Nyb2xsIGJhcnMuXG4gIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5vdmVyZmxvdyA9IHRoaXMuZG9jT3JpZ092ZXJmbG93O1xuXG4gIC8vIFJlbW92ZSBmdWxsc2NyZWVuIHN0eWxlc1xuICB2anMucmVtb3ZlQ2xhc3MoZG9jdW1lbnQuYm9keSwgJ3Zqcy1mdWxsLXdpbmRvdycpO1xuXG4gIC8vIFJlc2l6ZSB0aGUgYm94LCBjb250cm9sbGVyLCBhbmQgcG9zdGVyIHRvIG9yaWdpbmFsIHNpemVzXG4gIC8vIHRoaXMucG9zaXRpb25BbGwoKTtcbiAgdGhpcy50cmlnZ2VyKCdleGl0RnVsbFdpbmRvdycpO1xufTtcblxudmpzLlBsYXllci5wcm90b3R5cGUuc2VsZWN0U291cmNlID0gZnVuY3Rpb24oc291cmNlcyl7XG5cbiAgLy8gTG9vcCB0aHJvdWdoIGVhY2ggcGxheWJhY2sgdGVjaG5vbG9neSBpbiB0aGUgb3B0aW9ucyBvcmRlclxuICBmb3IgKHZhciBpPTAsaj10aGlzLm9wdGlvbnNfWyd0ZWNoT3JkZXInXTtpPGoubGVuZ3RoO2krKykge1xuICAgIHZhciB0ZWNoTmFtZSA9IHZqcy5jYXBpdGFsaXplKGpbaV0pLFxuICAgICAgICB0ZWNoID0gd2luZG93Wyd2aWRlb2pzJ11bdGVjaE5hbWVdO1xuXG4gICAgLy8gQ2hlY2sgaWYgdGhlIGJyb3dzZXIgc3VwcG9ydHMgdGhpcyB0ZWNobm9sb2d5XG4gICAgaWYgKHRlY2guaXNTdXBwb3J0ZWQoKSkge1xuICAgICAgLy8gTG9vcCB0aHJvdWdoIGVhY2ggc291cmNlIG9iamVjdFxuICAgICAgZm9yICh2YXIgYT0wLGI9c291cmNlczthPGIubGVuZ3RoO2ErKykge1xuICAgICAgICB2YXIgc291cmNlID0gYlthXTtcblxuICAgICAgICAvLyBDaGVjayBpZiBzb3VyY2UgY2FuIGJlIHBsYXllZCB3aXRoIHRoaXMgdGVjaG5vbG9neVxuICAgICAgICBpZiAodGVjaFsnY2FuUGxheVNvdXJjZSddKHNvdXJjZSkpIHtcbiAgICAgICAgICByZXR1cm4geyBzb3VyY2U6IHNvdXJjZSwgdGVjaDogdGVjaE5hbWUgfTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn07XG5cbi8qKlxuICogVGhlIHNvdXJjZSBmdW5jdGlvbiB1cGRhdGVzIHRoZSB2aWRlbyBzb3VyY2VcbiAqXG4gKiBUaGVyZSBhcmUgdGhyZWUgdHlwZXMgb2YgdmFyaWFibGVzIHlvdSBjYW4gcGFzcyBhcyB0aGUgYXJndW1lbnQuXG4gKlxuICogKipVUkwgU3RyaW5nKio6IEEgVVJMIHRvIHRoZSB0aGUgdmlkZW8gZmlsZS4gVXNlIHRoaXMgbWV0aG9kIGlmIHlvdSBhcmUgc3VyZVxuICogdGhlIGN1cnJlbnQgcGxheWJhY2sgdGVjaG5vbG9neSAoSFRNTDUvRmxhc2gpIGNhbiBzdXBwb3J0IHRoZSBzb3VyY2UgeW91XG4gKiBwcm92aWRlLiBDdXJyZW50bHkgb25seSBNUDQgZmlsZXMgY2FuIGJlIHVzZWQgaW4gYm90aCBIVE1MNSBhbmQgRmxhc2guXG4gKlxuICogICAgIG15UGxheWVyLnNyYyhcImh0dHA6Ly93d3cuZXhhbXBsZS5jb20vcGF0aC90by92aWRlby5tcDRcIik7XG4gKlxuICogKipTb3VyY2UgT2JqZWN0IChvciBlbGVtZW50KToqKiBBIGphdmFzY3JpcHQgb2JqZWN0IGNvbnRhaW5pbmcgaW5mb3JtYXRpb25cbiAqIGFib3V0IHRoZSBzb3VyY2UgZmlsZS4gVXNlIHRoaXMgbWV0aG9kIGlmIHlvdSB3YW50IHRoZSBwbGF5ZXIgdG8gZGV0ZXJtaW5lIGlmXG4gKiBpdCBjYW4gc3VwcG9ydCB0aGUgZmlsZSB1c2luZyB0aGUgdHlwZSBpbmZvcm1hdGlvbi5cbiAqXG4gKiAgICAgbXlQbGF5ZXIuc3JjKHsgdHlwZTogXCJ2aWRlby9tcDRcIiwgc3JjOiBcImh0dHA6Ly93d3cuZXhhbXBsZS5jb20vcGF0aC90by92aWRlby5tcDRcIiB9KTtcbiAqXG4gKiAqKkFycmF5IG9mIFNvdXJjZSBPYmplY3RzOioqIFRvIHByb3ZpZGUgbXVsdGlwbGUgdmVyc2lvbnMgb2YgdGhlIHNvdXJjZSBzb1xuICogdGhhdCBpdCBjYW4gYmUgcGxheWVkIHVzaW5nIEhUTUw1IGFjcm9zcyBicm93c2VycyB5b3UgY2FuIHVzZSBhbiBhcnJheSBvZlxuICogc291cmNlIG9iamVjdHMuIFZpZGVvLmpzIHdpbGwgZGV0ZWN0IHdoaWNoIHZlcnNpb24gaXMgc3VwcG9ydGVkIGFuZCBsb2FkIHRoYXRcbiAqIGZpbGUuXG4gKlxuICogICAgIG15UGxheWVyLnNyYyhbXG4gKiAgICAgICB7IHR5cGU6IFwidmlkZW8vbXA0XCIsIHNyYzogXCJodHRwOi8vd3d3LmV4YW1wbGUuY29tL3BhdGgvdG8vdmlkZW8ubXA0XCIgfSxcbiAqICAgICAgIHsgdHlwZTogXCJ2aWRlby93ZWJtXCIsIHNyYzogXCJodHRwOi8vd3d3LmV4YW1wbGUuY29tL3BhdGgvdG8vdmlkZW8ud2VibVwiIH0sXG4gKiAgICAgICB7IHR5cGU6IFwidmlkZW8vb2dnXCIsIHNyYzogXCJodHRwOi8vd3d3LmV4YW1wbGUuY29tL3BhdGgvdG8vdmlkZW8ub2d2XCIgfVxuICogICAgIF0pO1xuICpcbiAqIEBwYXJhbSAge1N0cmluZ3xPYmplY3R8QXJyYXk9fSBzb3VyY2UgVGhlIHNvdXJjZSBVUkwsIG9iamVjdCwgb3IgYXJyYXkgb2Ygc291cmNlc1xuICogQHJldHVybiB7dmpzLlBsYXllcn0gc2VsZlxuICovXG52anMuUGxheWVyLnByb3RvdHlwZS5zcmMgPSBmdW5jdGlvbihzb3VyY2Upe1xuICAvLyBDYXNlOiBBcnJheSBvZiBzb3VyY2Ugb2JqZWN0cyB0byBjaG9vc2UgZnJvbSBhbmQgcGljayB0aGUgYmVzdCB0byBwbGF5XG4gIGlmIChzb3VyY2UgaW5zdGFuY2VvZiBBcnJheSkge1xuXG4gICAgdmFyIHNvdXJjZVRlY2ggPSB0aGlzLnNlbGVjdFNvdXJjZShzb3VyY2UpLFxuICAgICAgICB0ZWNoTmFtZTtcblxuICAgIGlmIChzb3VyY2VUZWNoKSB7XG4gICAgICAgIHNvdXJjZSA9IHNvdXJjZVRlY2guc291cmNlO1xuICAgICAgICB0ZWNoTmFtZSA9IHNvdXJjZVRlY2gudGVjaDtcblxuICAgICAgLy8gSWYgdGhpcyB0ZWNobm9sb2d5IGlzIGFscmVhZHkgbG9hZGVkLCBzZXQgc291cmNlXG4gICAgICBpZiAodGVjaE5hbWUgPT0gdGhpcy50ZWNoTmFtZSkge1xuICAgICAgICB0aGlzLnNyYyhzb3VyY2UpOyAvLyBQYXNzaW5nIHRoZSBzb3VyY2Ugb2JqZWN0XG4gICAgICAvLyBPdGhlcndpc2UgbG9hZCB0aGlzIHRlY2hub2xvZ3kgd2l0aCBjaG9zZW4gc291cmNlXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmxvYWRUZWNoKHRlY2hOYW1lLCBzb3VyY2UpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVsXy5hcHBlbmRDaGlsZCh2anMuY3JlYXRlRWwoJ3AnLCB7XG4gICAgICAgIGlubmVySFRNTDogdGhpcy5vcHRpb25zKClbJ25vdFN1cHBvcnRlZE1lc3NhZ2UnXVxuICAgICAgfSkpO1xuICAgIH1cblxuICAvLyBDYXNlOiBTb3VyY2Ugb2JqZWN0IHsgc3JjOiAnJywgdHlwZTogJycgLi4uIH1cbiAgfSBlbHNlIGlmIChzb3VyY2UgaW5zdGFuY2VvZiBPYmplY3QpIHtcblxuICAgIGlmICh3aW5kb3dbJ3ZpZGVvanMnXVt0aGlzLnRlY2hOYW1lXVsnY2FuUGxheVNvdXJjZSddKHNvdXJjZSkpIHtcbiAgICAgIHRoaXMuc3JjKHNvdXJjZS5zcmMpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBTZW5kIHRocm91Z2ggdGVjaCBsb29wIHRvIGNoZWNrIGZvciBhIGNvbXBhdGlibGUgdGVjaG5vbG9neS5cbiAgICAgIHRoaXMuc3JjKFtzb3VyY2VdKTtcbiAgICB9XG5cbiAgLy8gQ2FzZTogVVJMIFN0cmluZyAoaHR0cDovL215dmlkZW8uLi4pXG4gIH0gZWxzZSB7XG4gICAgLy8gQ2FjaGUgZm9yIGdldHRpbmcgbGFzdCBzZXQgc291cmNlXG4gICAgdGhpcy5jYWNoZV8uc3JjID0gc291cmNlO1xuXG4gICAgaWYgKCF0aGlzLmlzUmVhZHlfKSB7XG4gICAgICB0aGlzLnJlYWR5KGZ1bmN0aW9uKCl7XG4gICAgICAgIHRoaXMuc3JjKHNvdXJjZSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy50ZWNoQ2FsbCgnc3JjJywgc291cmNlKTtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnNfWydwcmVsb2FkJ10gPT0gJ2F1dG8nKSB7XG4gICAgICAgIHRoaXMubG9hZCgpO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMub3B0aW9uc19bJ2F1dG9wbGF5J10pIHtcbiAgICAgICAgdGhpcy5wbGF5KCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gQmVnaW4gbG9hZGluZyB0aGUgc3JjIGRhdGFcbi8vIGh0dHA6Ly9kZXYudzMub3JnL2h0bWw1L3NwZWMvdmlkZW8uaHRtbCNkb20tbWVkaWEtbG9hZFxudmpzLlBsYXllci5wcm90b3R5cGUubG9hZCA9IGZ1bmN0aW9uKCl7XG4gIHRoaXMudGVjaENhbGwoJ2xvYWQnKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBodHRwOi8vZGV2LnczLm9yZy9odG1sNS9zcGVjL3ZpZGVvLmh0bWwjZG9tLW1lZGlhLWN1cnJlbnRzcmNcbnZqcy5QbGF5ZXIucHJvdG90eXBlLmN1cnJlbnRTcmMgPSBmdW5jdGlvbigpe1xuICByZXR1cm4gdGhpcy50ZWNoR2V0KCdjdXJyZW50U3JjJykgfHwgdGhpcy5jYWNoZV8uc3JjIHx8ICcnO1xufTtcblxuLy8gQXR0cmlidXRlcy9PcHRpb25zXG52anMuUGxheWVyLnByb3RvdHlwZS5wcmVsb2FkID0gZnVuY3Rpb24odmFsdWUpe1xuICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgIHRoaXMudGVjaENhbGwoJ3NldFByZWxvYWQnLCB2YWx1ZSk7XG4gICAgdGhpcy5vcHRpb25zX1sncHJlbG9hZCddID0gdmFsdWU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgcmV0dXJuIHRoaXMudGVjaEdldCgncHJlbG9hZCcpO1xufTtcbnZqcy5QbGF5ZXIucHJvdG90eXBlLmF1dG9wbGF5ID0gZnVuY3Rpb24odmFsdWUpe1xuICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgIHRoaXMudGVjaENhbGwoJ3NldEF1dG9wbGF5JywgdmFsdWUpO1xuICAgIHRoaXMub3B0aW9uc19bJ2F1dG9wbGF5J10gPSB2YWx1ZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICByZXR1cm4gdGhpcy50ZWNoR2V0KCdhdXRvcGxheScsIHZhbHVlKTtcbn07XG52anMuUGxheWVyLnByb3RvdHlwZS5sb29wID0gZnVuY3Rpb24odmFsdWUpe1xuICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgIHRoaXMudGVjaENhbGwoJ3NldExvb3AnLCB2YWx1ZSk7XG4gICAgdGhpcy5vcHRpb25zX1snbG9vcCddID0gdmFsdWU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgcmV0dXJuIHRoaXMudGVjaEdldCgnbG9vcCcpO1xufTtcblxuLyoqXG4gKiB0aGUgdXJsIG9mIHRoZSBwb3N0ZXIgaW1hZ2Ugc291cmNlXG4gKiBAdHlwZSB7U3RyaW5nfVxuICogQHByaXZhdGVcbiAqL1xudmpzLlBsYXllci5wcm90b3R5cGUucG9zdGVyXztcblxuLyoqXG4gKiBnZXQgb3Igc2V0IHRoZSBwb3N0ZXIgaW1hZ2Ugc291cmNlIHVybFxuICpcbiAqICMjIyMjIEVYQU1QTEU6XG4gKlxuICogICAgIC8vIGdldHRpbmdcbiAqICAgICB2YXIgY3VycmVudFBvc3RlciA9IG15UGxheWVyLnBvc3RlcigpO1xuICpcbiAqICAgICAvLyBzZXR0aW5nXG4gKiAgICAgbXlQbGF5ZXIucG9zdGVyKCdodHRwOi8vZXhhbXBsZS5jb20vbXlJbWFnZS5qcGcnKTtcbiAqXG4gKiBAcGFyYW0gIHtTdHJpbmc9fSBbc3JjXSBQb3N0ZXIgaW1hZ2Ugc291cmNlIFVSTFxuICogQHJldHVybiB7U3RyaW5nfSBwb3N0ZXIgVVJMIHdoZW4gZ2V0dGluZ1xuICogQHJldHVybiB7dmpzLlBsYXllcn0gc2VsZiB3aGVuIHNldHRpbmdcbiAqL1xudmpzLlBsYXllci5wcm90b3R5cGUucG9zdGVyID0gZnVuY3Rpb24oc3JjKXtcbiAgaWYgKHNyYyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5wb3N0ZXJfID0gc3JjO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIHJldHVybiB0aGlzLnBvc3Rlcl87XG59O1xuXG4vKipcbiAqIFdoZXRoZXIgb3Igbm90IHRoZSBjb250cm9scyBhcmUgc2hvd2luZ1xuICogQHR5cGUge0Jvb2xlYW59XG4gKiBAcHJpdmF0ZVxuICovXG52anMuUGxheWVyLnByb3RvdHlwZS5jb250cm9sc187XG5cbi8qKlxuICogR2V0IG9yIHNldCB3aGV0aGVyIG9yIG5vdCB0aGUgY29udHJvbHMgYXJlIHNob3dpbmcuXG4gKiBAcGFyYW0gIHtCb29sZWFufSBjb250cm9scyBTZXQgY29udHJvbHMgdG8gc2hvd2luZyBvciBub3RcbiAqIEByZXR1cm4ge0Jvb2xlYW59ICAgIENvbnRyb2xzIGFyZSBzaG93aW5nXG4gKi9cbnZqcy5QbGF5ZXIucHJvdG90eXBlLmNvbnRyb2xzID0gZnVuY3Rpb24oYm9vbCl7XG4gIGlmIChib29sICE9PSB1bmRlZmluZWQpIHtcbiAgICBib29sID0gISFib29sOyAvLyBmb3JjZSBib29sZWFuXG4gICAgLy8gRG9uJ3QgdHJpZ2dlciBhIGNoYW5nZSBldmVudCB1bmxlc3MgaXQgYWN0dWFsbHkgY2hhbmdlZFxuICAgIGlmICh0aGlzLmNvbnRyb2xzXyAhPT0gYm9vbCkge1xuICAgICAgdGhpcy5jb250cm9sc18gPSBib29sO1xuICAgICAgaWYgKGJvb2wpIHtcbiAgICAgICAgdGhpcy5yZW1vdmVDbGFzcygndmpzLWNvbnRyb2xzLWRpc2FibGVkJyk7XG4gICAgICAgIHRoaXMuYWRkQ2xhc3MoJ3Zqcy1jb250cm9scy1lbmFibGVkJyk7XG4gICAgICAgIHRoaXMudHJpZ2dlcignY29udHJvbHNlbmFibGVkJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnJlbW92ZUNsYXNzKCd2anMtY29udHJvbHMtZW5hYmxlZCcpO1xuICAgICAgICB0aGlzLmFkZENsYXNzKCd2anMtY29udHJvbHMtZGlzYWJsZWQnKTtcbiAgICAgICAgdGhpcy50cmlnZ2VyKCdjb250cm9sc2Rpc2FibGVkJyk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIHJldHVybiB0aGlzLmNvbnRyb2xzXztcbn07XG5cbnZqcy5QbGF5ZXIucHJvdG90eXBlLnVzaW5nTmF0aXZlQ29udHJvbHNfO1xuXG4vKipcbiAqIFRvZ2dsZSBuYXRpdmUgY29udHJvbHMgb24vb2ZmLiBOYXRpdmUgY29udHJvbHMgYXJlIHRoZSBjb250cm9scyBidWlsdCBpbnRvXG4gKiBkZXZpY2VzIChlLmcuIGRlZmF1bHQgaVBob25lIGNvbnRyb2xzKSwgRmxhc2gsIG9yIG90aGVyIHRlY2hzXG4gKiAoZS5nLiBWaW1lbyBDb250cm9scylcbiAqXG4gKiAqKlRoaXMgc2hvdWxkIG9ubHkgYmUgc2V0IGJ5IHRoZSBjdXJyZW50IHRlY2gsIGJlY2F1c2Ugb25seSB0aGUgdGVjaCBrbm93c1xuICogaWYgaXQgY2FuIHN1cHBvcnQgbmF0aXZlIGNvbnRyb2xzKipcbiAqXG4gKiBAcGFyYW0gIHtCb29sZWFufSBib29sICAgIFRydWUgc2lnbmFscyB0aGF0IG5hdGl2ZSBjb250cm9scyBhcmUgb25cbiAqIEByZXR1cm4ge3Zqcy5QbGF5ZXJ9ICAgICAgUmV0dXJucyB0aGUgcGxheWVyXG4gKiBAcHJpdmF0ZVxuICovXG52anMuUGxheWVyLnByb3RvdHlwZS51c2luZ05hdGl2ZUNvbnRyb2xzID0gZnVuY3Rpb24oYm9vbCl7XG4gIGlmIChib29sICE9PSB1bmRlZmluZWQpIHtcbiAgICBib29sID0gISFib29sOyAvLyBmb3JjZSBib29sZWFuXG4gICAgLy8gRG9uJ3QgdHJpZ2dlciBhIGNoYW5nZSBldmVudCB1bmxlc3MgaXQgYWN0dWFsbHkgY2hhbmdlZFxuICAgIGlmICh0aGlzLnVzaW5nTmF0aXZlQ29udHJvbHNfICE9PSBib29sKSB7XG4gICAgICB0aGlzLnVzaW5nTmF0aXZlQ29udHJvbHNfID0gYm9vbDtcbiAgICAgIGlmIChib29sKSB7XG4gICAgICAgIHRoaXMuYWRkQ2xhc3MoJ3Zqcy11c2luZy1uYXRpdmUtY29udHJvbHMnKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogcGxheWVyIGlzIHVzaW5nIHRoZSBuYXRpdmUgZGV2aWNlIGNvbnRyb2xzXG4gICAgICAgICAqXG4gICAgICAgICAqIEBldmVudCB1c2luZ25hdGl2ZWNvbnRyb2xzXG4gICAgICAgICAqIEBtZW1iZXJvZiB2anMuUGxheWVyXG4gICAgICAgICAqIEBpbnN0YW5jZVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy50cmlnZ2VyKCd1c2luZ25hdGl2ZWNvbnRyb2xzJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnJlbW92ZUNsYXNzKCd2anMtdXNpbmctbmF0aXZlLWNvbnRyb2xzJyk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIHBsYXllciBpcyB1c2luZyB0aGUgY3VzdG9tIEhUTUwgY29udHJvbHNcbiAgICAgICAgICpcbiAgICAgICAgICogQGV2ZW50IHVzaW5nY3VzdG9tY29udHJvbHNcbiAgICAgICAgICogQG1lbWJlcm9mIHZqcy5QbGF5ZXJcbiAgICAgICAgICogQGluc3RhbmNlXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnRyaWdnZXIoJ3VzaW5nY3VzdG9tY29udHJvbHMnKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgcmV0dXJuIHRoaXMudXNpbmdOYXRpdmVDb250cm9sc187XG59O1xuXG52anMuUGxheWVyLnByb3RvdHlwZS5lcnJvciA9IGZ1bmN0aW9uKCl7IHJldHVybiB0aGlzLnRlY2hHZXQoJ2Vycm9yJyk7IH07XG52anMuUGxheWVyLnByb3RvdHlwZS5lbmRlZCA9IGZ1bmN0aW9uKCl7IHJldHVybiB0aGlzLnRlY2hHZXQoJ2VuZGVkJyk7IH07XG52anMuUGxheWVyLnByb3RvdHlwZS5zZWVraW5nID0gZnVuY3Rpb24oKXsgcmV0dXJuIHRoaXMudGVjaEdldCgnc2Vla2luZycpOyB9O1xuXG4vLyBXaGVuIHRoZSBwbGF5ZXIgaXMgZmlyc3QgaW5pdGlhbGl6ZWQsIHRyaWdnZXIgYWN0aXZpdHkgc28gY29tcG9uZW50c1xuLy8gbGlrZSB0aGUgY29udHJvbCBiYXIgc2hvdyB0aGVtc2VsdmVzIGlmIG5lZWRlZFxudmpzLlBsYXllci5wcm90b3R5cGUudXNlckFjdGl2aXR5XyA9IHRydWU7XG52anMuUGxheWVyLnByb3RvdHlwZS5yZXBvcnRVc2VyQWN0aXZpdHkgPSBmdW5jdGlvbihldmVudCl7XG4gIHRoaXMudXNlckFjdGl2aXR5XyA9IHRydWU7XG59O1xuXG52anMuUGxheWVyLnByb3RvdHlwZS51c2VyQWN0aXZlXyA9IHRydWU7XG52anMuUGxheWVyLnByb3RvdHlwZS51c2VyQWN0aXZlID0gZnVuY3Rpb24oYm9vbCl7XG4gIGlmIChib29sICE9PSB1bmRlZmluZWQpIHtcbiAgICBib29sID0gISFib29sO1xuICAgIGlmIChib29sICE9PSB0aGlzLnVzZXJBY3RpdmVfKSB7XG4gICAgICB0aGlzLnVzZXJBY3RpdmVfID0gYm9vbDtcbiAgICAgIGlmIChib29sKSB7XG4gICAgICAgIC8vIElmIHRoZSB1c2VyIHdhcyBpbmFjdGl2ZSBhbmQgaXMgbm93IGFjdGl2ZSB3ZSB3YW50IHRvIHJlc2V0IHRoZVxuICAgICAgICAvLyBpbmFjdGl2aXR5IHRpbWVyXG4gICAgICAgIHRoaXMudXNlckFjdGl2aXR5XyA9IHRydWU7XG4gICAgICAgIHRoaXMucmVtb3ZlQ2xhc3MoJ3Zqcy11c2VyLWluYWN0aXZlJyk7XG4gICAgICAgIHRoaXMuYWRkQ2xhc3MoJ3Zqcy11c2VyLWFjdGl2ZScpO1xuICAgICAgICB0aGlzLnRyaWdnZXIoJ3VzZXJhY3RpdmUnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFdlJ3JlIHN3aXRjaGluZyB0aGUgc3RhdGUgdG8gaW5hY3RpdmUgbWFudWFsbHksIHNvIGVyYXNlIGFueSBvdGhlclxuICAgICAgICAvLyBhY3Rpdml0eVxuICAgICAgICB0aGlzLnVzZXJBY3Rpdml0eV8gPSBmYWxzZTtcblxuICAgICAgICAvLyBDaHJvbWUvU2FmYXJpL0lFIGhhdmUgYnVncyB3aGVyZSB3aGVuIHlvdSBjaGFuZ2UgdGhlIGN1cnNvciBpdCBjYW5cbiAgICAgICAgLy8gdHJpZ2dlciBhIG1vdXNlbW92ZSBldmVudC4gVGhpcyBjYXVzZXMgYW4gaXNzdWUgd2hlbiB5b3UncmUgaGlkaW5nXG4gICAgICAgIC8vIHRoZSBjdXJzb3Igd2hlbiB0aGUgdXNlciBpcyBpbmFjdGl2ZSwgYW5kIGEgbW91c2Vtb3ZlIHNpZ25hbHMgdXNlclxuICAgICAgICAvLyBhY3Rpdml0eS4gTWFraW5nIGl0IGltcG9zc2libGUgdG8gZ28gaW50byBpbmFjdGl2ZSBtb2RlLiBTcGVjaWZpY2FsbHlcbiAgICAgICAgLy8gdGhpcyBoYXBwZW5zIGluIGZ1bGxzY3JlZW4gd2hlbiB3ZSByZWFsbHkgbmVlZCB0byBoaWRlIHRoZSBjdXJzb3IuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFdoZW4gdGhpcyBnZXRzIHJlc29sdmVkIGluIEFMTCBicm93c2VycyBpdCBjYW4gYmUgcmVtb3ZlZFxuICAgICAgICAvLyBodHRwczovL2NvZGUuZ29vZ2xlLmNvbS9wL2Nocm9taXVtL2lzc3Vlcy9kZXRhaWw/aWQ9MTAzMDQxXG4gICAgICAgIHRoaXMudGVjaC5vbmUoJ21vdXNlbW92ZScsIGZ1bmN0aW9uKGUpe1xuICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5yZW1vdmVDbGFzcygndmpzLXVzZXItYWN0aXZlJyk7XG4gICAgICAgIHRoaXMuYWRkQ2xhc3MoJ3Zqcy11c2VyLWluYWN0aXZlJyk7XG4gICAgICAgIHRoaXMudHJpZ2dlcigndXNlcmluYWN0aXZlJyk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIHJldHVybiB0aGlzLnVzZXJBY3RpdmVfO1xufTtcblxudmpzLlBsYXllci5wcm90b3R5cGUubGlzdGVuRm9yVXNlckFjdGl2aXR5ID0gZnVuY3Rpb24oKXtcbiAgdmFyIG9uTW91c2VBY3Rpdml0eSwgb25Nb3VzZURvd24sIG1vdXNlSW5Qcm9ncmVzcywgb25Nb3VzZVVwLFxuICAgICAgYWN0aXZpdHlDaGVjaywgaW5hY3Rpdml0eVRpbWVvdXQ7XG5cbiAgb25Nb3VzZUFjdGl2aXR5ID0gdGhpcy5yZXBvcnRVc2VyQWN0aXZpdHk7XG5cbiAgb25Nb3VzZURvd24gPSBmdW5jdGlvbigpIHtcbiAgICBvbk1vdXNlQWN0aXZpdHkoKTtcbiAgICAvLyBGb3IgYXMgbG9uZyBhcyB0aGUgdGhleSBhcmUgdG91Y2hpbmcgdGhlIGRldmljZSBvciBoYXZlIHRoZWlyIG1vdXNlIGRvd24sXG4gICAgLy8gd2UgY29uc2lkZXIgdGhlbSBhY3RpdmUgZXZlbiBpZiB0aGV5J3JlIG5vdCBtb3ZpbmcgdGhlaXIgZmluZ2VyIG9yIG1vdXNlLlxuICAgIC8vIFNvIHdlIHdhbnQgdG8gY29udGludWUgdG8gdXBkYXRlIHRoYXQgdGhleSBhcmUgYWN0aXZlXG4gICAgY2xlYXJJbnRlcnZhbChtb3VzZUluUHJvZ3Jlc3MpO1xuICAgIC8vIFNldHRpbmcgdXNlckFjdGl2aXR5PXRydWUgbm93IGFuZCBzZXR0aW5nIHRoZSBpbnRlcnZhbCB0byB0aGUgc2FtZSB0aW1lXG4gICAgLy8gYXMgdGhlIGFjdGl2aXR5Q2hlY2sgaW50ZXJ2YWwgKDI1MCkgc2hvdWxkIGVuc3VyZSB3ZSBuZXZlciBtaXNzIHRoZVxuICAgIC8vIG5leHQgYWN0aXZpdHlDaGVja1xuICAgIG1vdXNlSW5Qcm9ncmVzcyA9IHNldEludGVydmFsKHZqcy5iaW5kKHRoaXMsIG9uTW91c2VBY3Rpdml0eSksIDI1MCk7XG4gIH07XG5cbiAgb25Nb3VzZVVwID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICBvbk1vdXNlQWN0aXZpdHkoKTtcbiAgICAvLyBTdG9wIHRoZSBpbnRlcnZhbCB0aGF0IG1haW50YWlucyBhY3Rpdml0eSBpZiB0aGUgbW91c2UvdG91Y2ggaXMgZG93blxuICAgIGNsZWFySW50ZXJ2YWwobW91c2VJblByb2dyZXNzKTtcbiAgfTtcblxuICAvLyBBbnkgbW91c2UgbW92ZW1lbnQgd2lsbCBiZSBjb25zaWRlcmVkIHVzZXIgYWN0aXZpdHlcbiAgdGhpcy5vbignbW91c2Vkb3duJywgb25Nb3VzZURvd24pO1xuICB0aGlzLm9uKCdtb3VzZW1vdmUnLCBvbk1vdXNlQWN0aXZpdHkpO1xuICB0aGlzLm9uKCdtb3VzZXVwJywgb25Nb3VzZVVwKTtcblxuICAvLyBMaXN0ZW4gZm9yIGtleWJvYXJkIG5hdmlnYXRpb25cbiAgLy8gU2hvdWxkbid0IG5lZWQgdG8gdXNlIGluUHJvZ3Jlc3MgaW50ZXJ2YWwgYmVjYXVzZSBvZiBrZXkgcmVwZWF0XG4gIHRoaXMub24oJ2tleWRvd24nLCBvbk1vdXNlQWN0aXZpdHkpO1xuICB0aGlzLm9uKCdrZXl1cCcsIG9uTW91c2VBY3Rpdml0eSk7XG5cbiAgLy8gQ29uc2lkZXIgYW55IHRvdWNoIGV2ZW50cyB0aGF0IGJ1YmJsZSB1cCB0byBiZSBhY3Rpdml0eVxuICAvLyBDZXJ0YWluIHRvdWNoZXMgb24gdGhlIHRlY2ggd2lsbCBiZSBibG9ja2VkIGZyb20gYnViYmxpbmcgYmVjYXVzZSB0aGV5XG4gIC8vIHRvZ2dsZSBjb250cm9sc1xuICB0aGlzLm9uKCd0b3VjaHN0YXJ0Jywgb25Nb3VzZURvd24pO1xuICB0aGlzLm9uKCd0b3VjaG1vdmUnLCBvbk1vdXNlQWN0aXZpdHkpO1xuICB0aGlzLm9uKCd0b3VjaGVuZCcsIG9uTW91c2VVcCk7XG4gIHRoaXMub24oJ3RvdWNoY2FuY2VsJywgb25Nb3VzZVVwKTtcblxuICAvLyBSdW4gYW4gaW50ZXJ2YWwgZXZlcnkgMjUwIG1pbGxpc2Vjb25kcyBpbnN0ZWFkIG9mIHN0dWZmaW5nIGV2ZXJ5dGhpbmcgaW50b1xuICAvLyB0aGUgbW91c2Vtb3ZlL3RvdWNobW92ZSBmdW5jdGlvbiBpdHNlbGYsIHRvIHByZXZlbnQgcGVyZm9ybWFuY2UgZGVncmFkYXRpb24uXG4gIC8vIGB0aGlzLnJlcG9ydFVzZXJBY3Rpdml0eWAgc2ltcGx5IHNldHMgdGhpcy51c2VyQWN0aXZpdHlfIHRvIHRydWUsIHdoaWNoXG4gIC8vIHRoZW4gZ2V0cyBwaWNrZWQgdXAgYnkgdGhpcyBsb29wXG4gIC8vIGh0dHA6Ly9lam9obi5vcmcvYmxvZy9sZWFybmluZy1mcm9tLXR3aXR0ZXIvXG4gIGFjdGl2aXR5Q2hlY2sgPSBzZXRJbnRlcnZhbCh2anMuYmluZCh0aGlzLCBmdW5jdGlvbigpIHtcbiAgICAvLyBDaGVjayB0byBzZWUgaWYgbW91c2UvdG91Y2ggYWN0aXZpdHkgaGFzIGhhcHBlbmVkXG4gICAgaWYgKHRoaXMudXNlckFjdGl2aXR5Xykge1xuICAgICAgLy8gUmVzZXQgdGhlIGFjdGl2aXR5IHRyYWNrZXJcbiAgICAgIHRoaXMudXNlckFjdGl2aXR5XyA9IGZhbHNlO1xuXG4gICAgICAvLyBJZiB0aGUgdXNlciBzdGF0ZSB3YXMgaW5hY3RpdmUsIHNldCB0aGUgc3RhdGUgdG8gYWN0aXZlXG4gICAgICB0aGlzLnVzZXJBY3RpdmUodHJ1ZSk7XG5cbiAgICAgIC8vIENsZWFyIGFueSBleGlzdGluZyBpbmFjdGl2aXR5IHRpbWVvdXQgdG8gc3RhcnQgdGhlIHRpbWVyIG92ZXJcbiAgICAgIGNsZWFyVGltZW91dChpbmFjdGl2aXR5VGltZW91dCk7XG5cbiAgICAgIC8vIEluIFggc2Vjb25kcywgaWYgbm8gbW9yZSBhY3Rpdml0eSBoYXMgb2NjdXJyZWQgdGhlIHVzZXIgd2lsbCBiZVxuICAgICAgLy8gY29uc2lkZXJlZCBpbmFjdGl2ZVxuICAgICAgaW5hY3Rpdml0eVRpbWVvdXQgPSBzZXRUaW1lb3V0KHZqcy5iaW5kKHRoaXMsIGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBQcm90ZWN0IGFnYWluc3QgdGhlIGNhc2Ugd2hlcmUgdGhlIGluYWN0aXZpdHlUaW1lb3V0IGNhbiB0cmlnZ2VyIGp1c3RcbiAgICAgICAgLy8gYmVmb3JlIHRoZSBuZXh0IHVzZXIgYWN0aXZpdHkgaXMgcGlja2VkIHVwIGJ5IHRoZSBhY3Rpdml0eUNoZWNrIGxvb3BcbiAgICAgICAgLy8gY2F1c2luZyBhIGZsaWNrZXJcbiAgICAgICAgaWYgKCF0aGlzLnVzZXJBY3Rpdml0eV8pIHtcbiAgICAgICAgICB0aGlzLnVzZXJBY3RpdmUoZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9KSwgMjAwMCk7XG4gICAgfVxuICB9KSwgMjUwKTtcblxuICAvLyBDbGVhbiB1cCB0aGUgaW50ZXJ2YWxzIHdoZW4gd2Uga2lsbCB0aGUgcGxheWVyXG4gIHRoaXMub24oJ2Rpc3Bvc2UnLCBmdW5jdGlvbigpe1xuICAgIGNsZWFySW50ZXJ2YWwoYWN0aXZpdHlDaGVjayk7XG4gICAgY2xlYXJUaW1lb3V0KGluYWN0aXZpdHlUaW1lb3V0KTtcbiAgfSk7XG59O1xuXG4vLyBNZXRob2RzIHRvIGFkZCBzdXBwb3J0IGZvclxuLy8gbmV0d29ya1N0YXRlOiBmdW5jdGlvbigpeyByZXR1cm4gdGhpcy50ZWNoQ2FsbCgnbmV0d29ya1N0YXRlJyk7IH0sXG4vLyByZWFkeVN0YXRlOiBmdW5jdGlvbigpeyByZXR1cm4gdGhpcy50ZWNoQ2FsbCgncmVhZHlTdGF0ZScpOyB9LFxuLy8gc2Vla2luZzogZnVuY3Rpb24oKXsgcmV0dXJuIHRoaXMudGVjaENhbGwoJ3NlZWtpbmcnKTsgfSxcbi8vIGluaXRpYWxUaW1lOiBmdW5jdGlvbigpeyByZXR1cm4gdGhpcy50ZWNoQ2FsbCgnaW5pdGlhbFRpbWUnKTsgfSxcbi8vIHN0YXJ0T2Zmc2V0VGltZTogZnVuY3Rpb24oKXsgcmV0dXJuIHRoaXMudGVjaENhbGwoJ3N0YXJ0T2Zmc2V0VGltZScpOyB9LFxuLy8gcGxheWVkOiBmdW5jdGlvbigpeyByZXR1cm4gdGhpcy50ZWNoQ2FsbCgncGxheWVkJyk7IH0sXG4vLyBzZWVrYWJsZTogZnVuY3Rpb24oKXsgcmV0dXJuIHRoaXMudGVjaENhbGwoJ3NlZWthYmxlJyk7IH0sXG4vLyB2aWRlb1RyYWNrczogZnVuY3Rpb24oKXsgcmV0dXJuIHRoaXMudGVjaENhbGwoJ3ZpZGVvVHJhY2tzJyk7IH0sXG4vLyBhdWRpb1RyYWNrczogZnVuY3Rpb24oKXsgcmV0dXJuIHRoaXMudGVjaENhbGwoJ2F1ZGlvVHJhY2tzJyk7IH0sXG4vLyB2aWRlb1dpZHRoOiBmdW5jdGlvbigpeyByZXR1cm4gdGhpcy50ZWNoQ2FsbCgndmlkZW9XaWR0aCcpOyB9LFxuLy8gdmlkZW9IZWlnaHQ6IGZ1bmN0aW9uKCl7IHJldHVybiB0aGlzLnRlY2hDYWxsKCd2aWRlb0hlaWdodCcpOyB9LFxuLy8gZGVmYXVsdFBsYXliYWNrUmF0ZTogZnVuY3Rpb24oKXsgcmV0dXJuIHRoaXMudGVjaENhbGwoJ2RlZmF1bHRQbGF5YmFja1JhdGUnKTsgfSxcbi8vIHBsYXliYWNrUmF0ZTogZnVuY3Rpb24oKXsgcmV0dXJuIHRoaXMudGVjaENhbGwoJ3BsYXliYWNrUmF0ZScpOyB9LFxuLy8gbWVkaWFHcm91cDogZnVuY3Rpb24oKXsgcmV0dXJuIHRoaXMudGVjaENhbGwoJ21lZGlhR3JvdXAnKTsgfSxcbi8vIGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCl7IHJldHVybiB0aGlzLnRlY2hDYWxsKCdjb250cm9sbGVyJyk7IH0sXG4vLyBkZWZhdWx0TXV0ZWQ6IGZ1bmN0aW9uKCl7IHJldHVybiB0aGlzLnRlY2hDYWxsKCdkZWZhdWx0TXV0ZWQnKTsgfVxuXG4vLyBUT0RPXG4vLyBjdXJyZW50U3JjTGlzdDogdGhlIGFycmF5IG9mIHNvdXJjZXMgaW5jbHVkaW5nIG90aGVyIGZvcm1hdHMgYW5kIGJpdHJhdGVzXG4vLyBwbGF5TGlzdDogYXJyYXkgb2Ygc291cmNlIGxpc3RzIGluIG9yZGVyIG9mIHBsYXliYWNrXG5cbi8vIFJlcXVlc3RGdWxsc2NyZWVuIEFQSVxuKGZ1bmN0aW9uKCl7XG4gIHZhciBwcmVmaXgsIHJlcXVlc3RGUywgZGl2O1xuXG4gIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXG4gIHJlcXVlc3RGUyA9IHt9O1xuXG4gIC8vIEN1cnJlbnQgVzNDIFNwZWNcbiAgLy8gaHR0cDovL2R2Y3MudzMub3JnL2hnL2Z1bGxzY3JlZW4vcmF3LWZpbGUvdGlwL092ZXJ2aWV3Lmh0bWwjYXBpXG4gIC8vIE1vemlsbGEgRHJhZnQ6IGh0dHBzOi8vd2lraS5tb3ppbGxhLm9yZy9HZWNrbzpGdWxsU2NyZWVuQVBJI2Z1bGxzY3JlZW5jaGFuZ2VfZXZlbnRcbiAgLy8gTmV3OiBodHRwczovL2R2Y3MudzMub3JnL2hnL2Z1bGxzY3JlZW4vcmF3LWZpbGUvNTI5YTY3YjhkOWYzL092ZXJ2aWV3Lmh0bWxcbiAgaWYgKGRpdi5jYW5jZWxGdWxsc2NyZWVuICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXF1ZXN0RlMucmVxdWVzdEZuID0gJ3JlcXVlc3RGdWxsc2NyZWVuJztcbiAgICByZXF1ZXN0RlMuY2FuY2VsRm4gPSAnZXhpdEZ1bGxzY3JlZW4nO1xuICAgIHJlcXVlc3RGUy5ldmVudE5hbWUgPSAnZnVsbHNjcmVlbmNoYW5nZSc7XG4gICAgcmVxdWVzdEZTLmlzRnVsbFNjcmVlbiA9ICdmdWxsU2NyZWVuJztcblxuICAvLyBXZWJraXQgKENocm9tZS9TYWZhcmkpIGFuZCBNb3ppbGxhIChGaXJlZm94KSBoYXZlIHdvcmtpbmcgaW1wbGVtZW50YXRpb25zXG4gIC8vIHRoYXQgdXNlIHByZWZpeGVzIGFuZCB2YXJ5IHNsaWdodGx5IGZyb20gdGhlIG5ldyBXM0Mgc3BlYy4gU3BlY2lmaWNhbGx5LFxuICAvLyB1c2luZyAnZXhpdCcgaW5zdGVhZCBvZiAnY2FuY2VsJywgYW5kIGxvd2VyY2FzaW5nIHRoZSAnUycgaW4gRnVsbHNjcmVlbi5cbiAgLy8gT3RoZXIgYnJvd3NlcnMgZG9uJ3QgaGF2ZSBhbnkgaGludHMgb2Ygd2hpY2ggdmVyc2lvbiB0aGV5IG1pZ2h0IGZvbGxvdyB5ZXQsXG4gIC8vIHNvIG5vdCBnb2luZyB0byB0cnkgdG8gcHJlZGljdCBieSBsb29waW5nIHRocm91Z2ggYWxsIHByZWZpeGVzLlxuICB9IGVsc2Uge1xuXG4gICAgaWYgKGRvY3VtZW50Lm1vekNhbmNlbEZ1bGxTY3JlZW4pIHtcbiAgICAgIHByZWZpeCA9ICdtb3onO1xuICAgICAgcmVxdWVzdEZTLmlzRnVsbFNjcmVlbiA9IHByZWZpeCArICdGdWxsU2NyZWVuJztcbiAgICB9IGVsc2Uge1xuICAgICAgcHJlZml4ID0gJ3dlYmtpdCc7XG4gICAgICByZXF1ZXN0RlMuaXNGdWxsU2NyZWVuID0gcHJlZml4ICsgJ0lzRnVsbFNjcmVlbic7XG4gICAgfVxuXG4gICAgaWYgKGRpdltwcmVmaXggKyAnUmVxdWVzdEZ1bGxTY3JlZW4nXSkge1xuICAgICAgcmVxdWVzdEZTLnJlcXVlc3RGbiA9IHByZWZpeCArICdSZXF1ZXN0RnVsbFNjcmVlbic7XG4gICAgICByZXF1ZXN0RlMuY2FuY2VsRm4gPSBwcmVmaXggKyAnQ2FuY2VsRnVsbFNjcmVlbic7XG4gICAgfVxuICAgIHJlcXVlc3RGUy5ldmVudE5hbWUgPSBwcmVmaXggKyAnZnVsbHNjcmVlbmNoYW5nZSc7XG4gIH1cblxuICBpZiAoZG9jdW1lbnRbcmVxdWVzdEZTLmNhbmNlbEZuXSkge1xuICAgIHZqcy5zdXBwb3J0LnJlcXVlc3RGdWxsU2NyZWVuID0gcmVxdWVzdEZTO1xuICB9XG5cbn0pKCk7XG5cblxuLyoqXG4gKiBDb250YWluZXIgb2YgbWFpbiBjb250cm9sc1xuICogQHBhcmFtIHt2anMuUGxheWVyfE9iamVjdH0gcGxheWVyXG4gKiBAcGFyYW0ge09iamVjdD19IG9wdGlvbnNcbiAqIEBjbGFzc1xuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyB2anMuQ29tcG9uZW50XG4gKi9cbnZqcy5Db250cm9sQmFyID0gdmpzLkNvbXBvbmVudC5leHRlbmQoKTtcblxudmpzLkNvbnRyb2xCYXIucHJvdG90eXBlLm9wdGlvbnNfID0ge1xuICBsb2FkRXZlbnQ6ICdwbGF5JyxcbiAgY2hpbGRyZW46IHtcbiAgICAncGxheVRvZ2dsZSc6IHt9LFxuICAgICdjdXJyZW50VGltZURpc3BsYXknOiB7fSxcbiAgICAndGltZURpdmlkZXInOiB7fSxcbiAgICAnZHVyYXRpb25EaXNwbGF5Jzoge30sXG4gICAgJ3JlbWFpbmluZ1RpbWVEaXNwbGF5Jzoge30sXG4gICAgJ3Byb2dyZXNzQ29udHJvbCc6IHt9LFxuICAgICdmdWxsc2NyZWVuVG9nZ2xlJzoge30sXG4gICAgJ3ZvbHVtZUNvbnRyb2wnOiB7fSxcbiAgICAnbXV0ZVRvZ2dsZSc6IHt9XG4gICAgLy8gJ3ZvbHVtZU1lbnVCdXR0b24nOiB7fVxuICB9XG59O1xuXG52anMuQ29udHJvbEJhci5wcm90b3R5cGUuY3JlYXRlRWwgPSBmdW5jdGlvbigpe1xuICByZXR1cm4gdmpzLmNyZWF0ZUVsKCdkaXYnLCB7XG4gICAgY2xhc3NOYW1lOiAndmpzLWNvbnRyb2wtYmFyJ1xuICB9KTtcbn07XG4vKipcbiAqIEJ1dHRvbiB0byB0b2dnbGUgYmV0d2VlbiBwbGF5IGFuZCBwYXVzZVxuICogQHBhcmFtIHt2anMuUGxheWVyfE9iamVjdH0gcGxheWVyXG4gKiBAcGFyYW0ge09iamVjdD19IG9wdGlvbnNcbiAqIEBjbGFzc1xuICogQGNvbnN0cnVjdG9yXG4gKi9cbnZqcy5QbGF5VG9nZ2xlID0gdmpzLkJ1dHRvbi5leHRlbmQoe1xuICAvKiogQGNvbnN0cnVjdG9yICovXG4gIGluaXQ6IGZ1bmN0aW9uKHBsYXllciwgb3B0aW9ucyl7XG4gICAgdmpzLkJ1dHRvbi5jYWxsKHRoaXMsIHBsYXllciwgb3B0aW9ucyk7XG5cbiAgICBwbGF5ZXIub24oJ3BsYXknLCB2anMuYmluZCh0aGlzLCB0aGlzLm9uUGxheSkpO1xuICAgIHBsYXllci5vbigncGF1c2UnLCB2anMuYmluZCh0aGlzLCB0aGlzLm9uUGF1c2UpKTtcbiAgfVxufSk7XG5cbnZqcy5QbGF5VG9nZ2xlLnByb3RvdHlwZS5idXR0b25UZXh0ID0gJ1BsYXknO1xuXG52anMuUGxheVRvZ2dsZS5wcm90b3R5cGUuYnVpbGRDU1NDbGFzcyA9IGZ1bmN0aW9uKCl7XG4gIHJldHVybiAndmpzLXBsYXktY29udHJvbCAnICsgdmpzLkJ1dHRvbi5wcm90b3R5cGUuYnVpbGRDU1NDbGFzcy5jYWxsKHRoaXMpO1xufTtcblxuLy8gT25DbGljayAtIFRvZ2dsZSBiZXR3ZWVuIHBsYXkgYW5kIHBhdXNlXG52anMuUGxheVRvZ2dsZS5wcm90b3R5cGUub25DbGljayA9IGZ1bmN0aW9uKCl7XG4gIGlmICh0aGlzLnBsYXllcl8ucGF1c2VkKCkpIHtcbiAgICB0aGlzLnBsYXllcl8ucGxheSgpO1xuICB9IGVsc2Uge1xuICAgIHRoaXMucGxheWVyXy5wYXVzZSgpO1xuICB9XG59O1xuXG4gIC8vIE9uUGxheSAtIEFkZCB0aGUgdmpzLXBsYXlpbmcgY2xhc3MgdG8gdGhlIGVsZW1lbnQgc28gaXQgY2FuIGNoYW5nZSBhcHBlYXJhbmNlXG52anMuUGxheVRvZ2dsZS5wcm90b3R5cGUub25QbGF5ID0gZnVuY3Rpb24oKXtcbiAgdmpzLnJlbW92ZUNsYXNzKHRoaXMuZWxfLCAndmpzLXBhdXNlZCcpO1xuICB2anMuYWRkQ2xhc3ModGhpcy5lbF8sICd2anMtcGxheWluZycpO1xuICB0aGlzLmVsXy5jaGlsZHJlblswXS5jaGlsZHJlblswXS5pbm5lckhUTUwgPSAnUGF1c2UnOyAvLyBjaGFuZ2UgdGhlIGJ1dHRvbiB0ZXh0IHRvIFwiUGF1c2VcIlxufTtcblxuICAvLyBPblBhdXNlIC0gQWRkIHRoZSB2anMtcGF1c2VkIGNsYXNzIHRvIHRoZSBlbGVtZW50IHNvIGl0IGNhbiBjaGFuZ2UgYXBwZWFyYW5jZVxudmpzLlBsYXlUb2dnbGUucHJvdG90eXBlLm9uUGF1c2UgPSBmdW5jdGlvbigpe1xuICB2anMucmVtb3ZlQ2xhc3ModGhpcy5lbF8sICd2anMtcGxheWluZycpO1xuICB2anMuYWRkQ2xhc3ModGhpcy5lbF8sICd2anMtcGF1c2VkJyk7XG4gIHRoaXMuZWxfLmNoaWxkcmVuWzBdLmNoaWxkcmVuWzBdLmlubmVySFRNTCA9ICdQbGF5JzsgLy8gY2hhbmdlIHRoZSBidXR0b24gdGV4dCB0byBcIlBsYXlcIlxufTtcbi8qKlxuICogRGlzcGxheXMgdGhlIGN1cnJlbnQgdGltZVxuICogQHBhcmFtIHt2anMuUGxheWVyfE9iamVjdH0gcGxheWVyXG4gKiBAcGFyYW0ge09iamVjdD19IG9wdGlvbnNcbiAqIEBjb25zdHJ1Y3RvclxuICovXG52anMuQ3VycmVudFRpbWVEaXNwbGF5ID0gdmpzLkNvbXBvbmVudC5leHRlbmQoe1xuICAvKiogQGNvbnN0cnVjdG9yICovXG4gIGluaXQ6IGZ1bmN0aW9uKHBsYXllciwgb3B0aW9ucyl7XG4gICAgdmpzLkNvbXBvbmVudC5jYWxsKHRoaXMsIHBsYXllciwgb3B0aW9ucyk7XG5cbiAgICBwbGF5ZXIub24oJ3RpbWV1cGRhdGUnLCB2anMuYmluZCh0aGlzLCB0aGlzLnVwZGF0ZUNvbnRlbnQpKTtcbiAgfVxufSk7XG5cbnZqcy5DdXJyZW50VGltZURpc3BsYXkucHJvdG90eXBlLmNyZWF0ZUVsID0gZnVuY3Rpb24oKXtcbiAgdmFyIGVsID0gdmpzLkNvbXBvbmVudC5wcm90b3R5cGUuY3JlYXRlRWwuY2FsbCh0aGlzLCAnZGl2Jywge1xuICAgIGNsYXNzTmFtZTogJ3Zqcy1jdXJyZW50LXRpbWUgdmpzLXRpbWUtY29udHJvbHMgdmpzLWNvbnRyb2wnXG4gIH0pO1xuXG4gIHRoaXMuY29udGVudCA9IHZqcy5jcmVhdGVFbCgnZGl2Jywge1xuICAgIGNsYXNzTmFtZTogJ3Zqcy1jdXJyZW50LXRpbWUtZGlzcGxheScsXG4gICAgaW5uZXJIVE1MOiAnPHNwYW4gY2xhc3M9XCJ2anMtY29udHJvbC10ZXh0XCI+Q3VycmVudCBUaW1lIDwvc3Bhbj4nICsgJzA6MDAnLCAvLyBsYWJlbCB0aGUgY3VycmVudCB0aW1lIGZvciBzY3JlZW4gcmVhZGVyIHVzZXJzXG4gICAgJ2FyaWEtbGl2ZSc6ICdvZmYnIC8vIHRlbGwgc2NyZWVuIHJlYWRlcnMgbm90IHRvIGF1dG9tYXRpY2FsbHkgcmVhZCB0aGUgdGltZSBhcyBpdCBjaGFuZ2VzXG4gIH0pO1xuXG4gIGVsLmFwcGVuZENoaWxkKHZqcy5jcmVhdGVFbCgnZGl2JykuYXBwZW5kQ2hpbGQodGhpcy5jb250ZW50KSk7XG4gIHJldHVybiBlbDtcbn07XG5cbnZqcy5DdXJyZW50VGltZURpc3BsYXkucHJvdG90eXBlLnVwZGF0ZUNvbnRlbnQgPSBmdW5jdGlvbigpe1xuICAvLyBBbGxvd3MgZm9yIHNtb290aCBzY3J1YmJpbmcsIHdoZW4gcGxheWVyIGNhbid0IGtlZXAgdXAuXG4gIHZhciB0aW1lID0gKHRoaXMucGxheWVyXy5zY3J1YmJpbmcpID8gdGhpcy5wbGF5ZXJfLmdldENhY2hlKCkuY3VycmVudFRpbWUgOiB0aGlzLnBsYXllcl8uY3VycmVudFRpbWUoKTtcbiAgdGhpcy5jb250ZW50LmlubmVySFRNTCA9ICc8c3BhbiBjbGFzcz1cInZqcy1jb250cm9sLXRleHRcIj5DdXJyZW50IFRpbWUgPC9zcGFuPicgKyB2anMuZm9ybWF0VGltZSh0aW1lLCB0aGlzLnBsYXllcl8uZHVyYXRpb24oKSk7XG59O1xuXG4vKipcbiAqIERpc3BsYXlzIHRoZSBkdXJhdGlvblxuICogQHBhcmFtIHt2anMuUGxheWVyfE9iamVjdH0gcGxheWVyXG4gKiBAcGFyYW0ge09iamVjdD19IG9wdGlvbnNcbiAqIEBjb25zdHJ1Y3RvclxuICovXG52anMuRHVyYXRpb25EaXNwbGF5ID0gdmpzLkNvbXBvbmVudC5leHRlbmQoe1xuICAvKiogQGNvbnN0cnVjdG9yICovXG4gIGluaXQ6IGZ1bmN0aW9uKHBsYXllciwgb3B0aW9ucyl7XG4gICAgdmpzLkNvbXBvbmVudC5jYWxsKHRoaXMsIHBsYXllciwgb3B0aW9ucyk7XG5cbiAgICBwbGF5ZXIub24oJ3RpbWV1cGRhdGUnLCB2anMuYmluZCh0aGlzLCB0aGlzLnVwZGF0ZUNvbnRlbnQpKTsgLy8gdGhpcyBtaWdodCBuZWVkIHRvIGJlIGNoYW5nZXMgdG8gJ2R1cmF0aW9uY2hhbmdlJyBpbnN0ZWFkIG9mICd0aW1ldXBkYXRlJyBldmVudHVhbGx5LCBob3dldmVyIHRoZSBkdXJhdGlvbmNoYW5nZSBldmVudCBmaXJlcyBiZWZvcmUgdGhpcy5wbGF5ZXJfLmR1cmF0aW9uKCkgaXMgc2V0LCBzbyB0aGUgdmFsdWUgY2Fubm90IGJlIHdyaXR0ZW4gb3V0IHVzaW5nIHRoaXMgbWV0aG9kLiBPbmNlIHRoZSBvcmRlciBvZiBkdXJhdGlvbmNoYW5nZSBhbmQgdGhpcy5wbGF5ZXJfLmR1cmF0aW9uKCkgYmVpbmcgc2V0IGlzIGZpZ3VyZWQgb3V0LCB0aGlzIGNhbiBiZSB1cGRhdGVkLlxuICB9XG59KTtcblxudmpzLkR1cmF0aW9uRGlzcGxheS5wcm90b3R5cGUuY3JlYXRlRWwgPSBmdW5jdGlvbigpe1xuICB2YXIgZWwgPSB2anMuQ29tcG9uZW50LnByb3RvdHlwZS5jcmVhdGVFbC5jYWxsKHRoaXMsICdkaXYnLCB7XG4gICAgY2xhc3NOYW1lOiAndmpzLWR1cmF0aW9uIHZqcy10aW1lLWNvbnRyb2xzIHZqcy1jb250cm9sJ1xuICB9KTtcblxuICB0aGlzLmNvbnRlbnQgPSB2anMuY3JlYXRlRWwoJ2RpdicsIHtcbiAgICBjbGFzc05hbWU6ICd2anMtZHVyYXRpb24tZGlzcGxheScsXG4gICAgaW5uZXJIVE1MOiAnPHNwYW4gY2xhc3M9XCJ2anMtY29udHJvbC10ZXh0XCI+RHVyYXRpb24gVGltZSA8L3NwYW4+JyArICcwOjAwJywgLy8gbGFiZWwgdGhlIGR1cmF0aW9uIHRpbWUgZm9yIHNjcmVlbiByZWFkZXIgdXNlcnNcbiAgICAnYXJpYS1saXZlJzogJ29mZicgLy8gdGVsbCBzY3JlZW4gcmVhZGVycyBub3QgdG8gYXV0b21hdGljYWxseSByZWFkIHRoZSB0aW1lIGFzIGl0IGNoYW5nZXNcbiAgfSk7XG5cbiAgZWwuYXBwZW5kQ2hpbGQodmpzLmNyZWF0ZUVsKCdkaXYnKS5hcHBlbmRDaGlsZCh0aGlzLmNvbnRlbnQpKTtcbiAgcmV0dXJuIGVsO1xufTtcblxudmpzLkR1cmF0aW9uRGlzcGxheS5wcm90b3R5cGUudXBkYXRlQ29udGVudCA9IGZ1bmN0aW9uKCl7XG4gIHZhciBkdXJhdGlvbiA9IHRoaXMucGxheWVyXy5kdXJhdGlvbigpO1xuICBpZiAoZHVyYXRpb24pIHtcbiAgICAgIHRoaXMuY29udGVudC5pbm5lckhUTUwgPSAnPHNwYW4gY2xhc3M9XCJ2anMtY29udHJvbC10ZXh0XCI+RHVyYXRpb24gVGltZSA8L3NwYW4+JyArIHZqcy5mb3JtYXRUaW1lKGR1cmF0aW9uKTsgLy8gbGFiZWwgdGhlIGR1cmF0aW9uIHRpbWUgZm9yIHNjcmVlbiByZWFkZXIgdXNlcnNcbiAgfVxufTtcblxuLyoqXG4gKiBUaGUgc2VwYXJhdG9yIGJldHdlZW4gdGhlIGN1cnJlbnQgdGltZSBhbmQgZHVyYXRpb25cbiAqXG4gKiBDYW4gYmUgaGlkZGVuIGlmIGl0J3Mgbm90IG5lZWRlZCBpbiB0aGUgZGVzaWduLlxuICpcbiAqIEBwYXJhbSB7dmpzLlBsYXllcnxPYmplY3R9IHBsYXllclxuICogQHBhcmFtIHtPYmplY3Q9fSBvcHRpb25zXG4gKiBAY29uc3RydWN0b3JcbiAqL1xudmpzLlRpbWVEaXZpZGVyID0gdmpzLkNvbXBvbmVudC5leHRlbmQoe1xuICAvKiogQGNvbnN0cnVjdG9yICovXG4gIGluaXQ6IGZ1bmN0aW9uKHBsYXllciwgb3B0aW9ucyl7XG4gICAgdmpzLkNvbXBvbmVudC5jYWxsKHRoaXMsIHBsYXllciwgb3B0aW9ucyk7XG4gIH1cbn0pO1xuXG52anMuVGltZURpdmlkZXIucHJvdG90eXBlLmNyZWF0ZUVsID0gZnVuY3Rpb24oKXtcbiAgcmV0dXJuIHZqcy5Db21wb25lbnQucHJvdG90eXBlLmNyZWF0ZUVsLmNhbGwodGhpcywgJ2RpdicsIHtcbiAgICBjbGFzc05hbWU6ICd2anMtdGltZS1kaXZpZGVyJyxcbiAgICBpbm5lckhUTUw6ICc8ZGl2PjxzcGFuPi88L3NwYW4+PC9kaXY+J1xuICB9KTtcbn07XG5cbi8qKlxuICogRGlzcGxheXMgdGhlIHRpbWUgbGVmdCBpbiB0aGUgdmlkZW9cbiAqIEBwYXJhbSB7dmpzLlBsYXllcnxPYmplY3R9IHBsYXllclxuICogQHBhcmFtIHtPYmplY3Q9fSBvcHRpb25zXG4gKiBAY29uc3RydWN0b3JcbiAqL1xudmpzLlJlbWFpbmluZ1RpbWVEaXNwbGF5ID0gdmpzLkNvbXBvbmVudC5leHRlbmQoe1xuICAvKiogQGNvbnN0cnVjdG9yICovXG4gIGluaXQ6IGZ1bmN0aW9uKHBsYXllciwgb3B0aW9ucyl7XG4gICAgdmpzLkNvbXBvbmVudC5jYWxsKHRoaXMsIHBsYXllciwgb3B0aW9ucyk7XG5cbiAgICBwbGF5ZXIub24oJ3RpbWV1cGRhdGUnLCB2anMuYmluZCh0aGlzLCB0aGlzLnVwZGF0ZUNvbnRlbnQpKTtcbiAgfVxufSk7XG5cbnZqcy5SZW1haW5pbmdUaW1lRGlzcGxheS5wcm90b3R5cGUuY3JlYXRlRWwgPSBmdW5jdGlvbigpe1xuICB2YXIgZWwgPSB2anMuQ29tcG9uZW50LnByb3RvdHlwZS5jcmVhdGVFbC5jYWxsKHRoaXMsICdkaXYnLCB7XG4gICAgY2xhc3NOYW1lOiAndmpzLXJlbWFpbmluZy10aW1lIHZqcy10aW1lLWNvbnRyb2xzIHZqcy1jb250cm9sJ1xuICB9KTtcblxuICB0aGlzLmNvbnRlbnQgPSB2anMuY3JlYXRlRWwoJ2RpdicsIHtcbiAgICBjbGFzc05hbWU6ICd2anMtcmVtYWluaW5nLXRpbWUtZGlzcGxheScsXG4gICAgaW5uZXJIVE1MOiAnPHNwYW4gY2xhc3M9XCJ2anMtY29udHJvbC10ZXh0XCI+UmVtYWluaW5nIFRpbWUgPC9zcGFuPicgKyAnLTA6MDAnLCAvLyBsYWJlbCB0aGUgcmVtYWluaW5nIHRpbWUgZm9yIHNjcmVlbiByZWFkZXIgdXNlcnNcbiAgICAnYXJpYS1saXZlJzogJ29mZicgLy8gdGVsbCBzY3JlZW4gcmVhZGVycyBub3QgdG8gYXV0b21hdGljYWxseSByZWFkIHRoZSB0aW1lIGFzIGl0IGNoYW5nZXNcbiAgfSk7XG5cbiAgZWwuYXBwZW5kQ2hpbGQodmpzLmNyZWF0ZUVsKCdkaXYnKS5hcHBlbmRDaGlsZCh0aGlzLmNvbnRlbnQpKTtcbiAgcmV0dXJuIGVsO1xufTtcblxudmpzLlJlbWFpbmluZ1RpbWVEaXNwbGF5LnByb3RvdHlwZS51cGRhdGVDb250ZW50ID0gZnVuY3Rpb24oKXtcbiAgaWYgKHRoaXMucGxheWVyXy5kdXJhdGlvbigpKSB7XG4gICAgdGhpcy5jb250ZW50LmlubmVySFRNTCA9ICc8c3BhbiBjbGFzcz1cInZqcy1jb250cm9sLXRleHRcIj5SZW1haW5pbmcgVGltZSA8L3NwYW4+JyArICctJysgdmpzLmZvcm1hdFRpbWUodGhpcy5wbGF5ZXJfLnJlbWFpbmluZ1RpbWUoKSk7XG4gIH1cblxuICAvLyBBbGxvd3MgZm9yIHNtb290aCBzY3J1YmJpbmcsIHdoZW4gcGxheWVyIGNhbid0IGtlZXAgdXAuXG4gIC8vIHZhciB0aW1lID0gKHRoaXMucGxheWVyXy5zY3J1YmJpbmcpID8gdGhpcy5wbGF5ZXJfLmdldENhY2hlKCkuY3VycmVudFRpbWUgOiB0aGlzLnBsYXllcl8uY3VycmVudFRpbWUoKTtcbiAgLy8gdGhpcy5jb250ZW50LmlubmVySFRNTCA9IHZqcy5mb3JtYXRUaW1lKHRpbWUsIHRoaXMucGxheWVyXy5kdXJhdGlvbigpKTtcbn07XG4vKipcbiAqIFRvZ2dsZSBmdWxsc2NyZWVuIHZpZGVvXG4gKiBAcGFyYW0ge3Zqcy5QbGF5ZXJ8T2JqZWN0fSBwbGF5ZXJcbiAqIEBwYXJhbSB7T2JqZWN0PX0gb3B0aW9uc1xuICogQGNsYXNzXG4gKiBAZXh0ZW5kcyB2anMuQnV0dG9uXG4gKi9cbnZqcy5GdWxsc2NyZWVuVG9nZ2xlID0gdmpzLkJ1dHRvbi5leHRlbmQoe1xuICAvKipcbiAgICogQGNvbnN0cnVjdG9yXG4gICAqIEBtZW1iZXJvZiB2anMuRnVsbHNjcmVlblRvZ2dsZVxuICAgKiBAaW5zdGFuY2VcbiAgICovXG4gIGluaXQ6IGZ1bmN0aW9uKHBsYXllciwgb3B0aW9ucyl7XG4gICAgdmpzLkJ1dHRvbi5jYWxsKHRoaXMsIHBsYXllciwgb3B0aW9ucyk7XG4gIH1cbn0pO1xuXG52anMuRnVsbHNjcmVlblRvZ2dsZS5wcm90b3R5cGUuYnV0dG9uVGV4dCA9ICdGdWxsc2NyZWVuJztcblxudmpzLkZ1bGxzY3JlZW5Ub2dnbGUucHJvdG90eXBlLmJ1aWxkQ1NTQ2xhc3MgPSBmdW5jdGlvbigpe1xuICByZXR1cm4gJ3Zqcy1mdWxsc2NyZWVuLWNvbnRyb2wgJyArIHZqcy5CdXR0b24ucHJvdG90eXBlLmJ1aWxkQ1NTQ2xhc3MuY2FsbCh0aGlzKTtcbn07XG5cbnZqcy5GdWxsc2NyZWVuVG9nZ2xlLnByb3RvdHlwZS5vbkNsaWNrID0gZnVuY3Rpb24oKXtcbiAgaWYgKCF0aGlzLnBsYXllcl8uaXNGdWxsU2NyZWVuKSB7XG4gICAgdGhpcy5wbGF5ZXJfLnJlcXVlc3RGdWxsU2NyZWVuKCk7XG4gICAgdGhpcy5lbF8uY2hpbGRyZW5bMF0uY2hpbGRyZW5bMF0uaW5uZXJIVE1MID0gJ05vbi1GdWxsc2NyZWVuJzsgLy8gY2hhbmdlIHRoZSBidXR0b24gdGV4dCB0byBcIk5vbi1GdWxsc2NyZWVuXCJcbiAgfSBlbHNlIHtcbiAgICB0aGlzLnBsYXllcl8uY2FuY2VsRnVsbFNjcmVlbigpO1xuICAgIHRoaXMuZWxfLmNoaWxkcmVuWzBdLmNoaWxkcmVuWzBdLmlubmVySFRNTCA9ICdGdWxsc2NyZWVuJzsgLy8gY2hhbmdlIHRoZSBidXR0b24gdG8gXCJGdWxsc2NyZWVuXCJcbiAgfVxufTtcbi8qKlxuICogVGhlIFByb2dyZXNzIENvbnRyb2wgY29tcG9uZW50IGNvbnRhaW5zIHRoZSBzZWVrIGJhciwgbG9hZCBwcm9ncmVzcyxcbiAqIGFuZCBwbGF5IHByb2dyZXNzXG4gKlxuICogQHBhcmFtIHt2anMuUGxheWVyfE9iamVjdH0gcGxheWVyXG4gKiBAcGFyYW0ge09iamVjdD19IG9wdGlvbnNcbiAqIEBjb25zdHJ1Y3RvclxuICovXG52anMuUHJvZ3Jlc3NDb250cm9sID0gdmpzLkNvbXBvbmVudC5leHRlbmQoe1xuICAvKiogQGNvbnN0cnVjdG9yICovXG4gIGluaXQ6IGZ1bmN0aW9uKHBsYXllciwgb3B0aW9ucyl7XG4gICAgdmpzLkNvbXBvbmVudC5jYWxsKHRoaXMsIHBsYXllciwgb3B0aW9ucyk7XG4gIH1cbn0pO1xuXG52anMuUHJvZ3Jlc3NDb250cm9sLnByb3RvdHlwZS5vcHRpb25zXyA9IHtcbiAgY2hpbGRyZW46IHtcbiAgICAnc2Vla0Jhcic6IHt9XG4gIH1cbn07XG5cbnZqcy5Qcm9ncmVzc0NvbnRyb2wucHJvdG90eXBlLmNyZWF0ZUVsID0gZnVuY3Rpb24oKXtcbiAgcmV0dXJuIHZqcy5Db21wb25lbnQucHJvdG90eXBlLmNyZWF0ZUVsLmNhbGwodGhpcywgJ2RpdicsIHtcbiAgICBjbGFzc05hbWU6ICd2anMtcHJvZ3Jlc3MtY29udHJvbCB2anMtY29udHJvbCdcbiAgfSk7XG59O1xuXG4vKipcbiAqIFNlZWsgQmFyIGFuZCBob2xkZXIgZm9yIHRoZSBwcm9ncmVzcyBiYXJzXG4gKlxuICogQHBhcmFtIHt2anMuUGxheWVyfE9iamVjdH0gcGxheWVyXG4gKiBAcGFyYW0ge09iamVjdD19IG9wdGlvbnNcbiAqIEBjb25zdHJ1Y3RvclxuICovXG52anMuU2Vla0JhciA9IHZqcy5TbGlkZXIuZXh0ZW5kKHtcbiAgLyoqIEBjb25zdHJ1Y3RvciAqL1xuICBpbml0OiBmdW5jdGlvbihwbGF5ZXIsIG9wdGlvbnMpe1xuICAgIHZqcy5TbGlkZXIuY2FsbCh0aGlzLCBwbGF5ZXIsIG9wdGlvbnMpO1xuICAgIHBsYXllci5vbigndGltZXVwZGF0ZScsIHZqcy5iaW5kKHRoaXMsIHRoaXMudXBkYXRlQVJJQUF0dHJpYnV0ZXMpKTtcbiAgICBwbGF5ZXIucmVhZHkodmpzLmJpbmQodGhpcywgdGhpcy51cGRhdGVBUklBQXR0cmlidXRlcykpO1xuICB9XG59KTtcblxudmpzLlNlZWtCYXIucHJvdG90eXBlLm9wdGlvbnNfID0ge1xuICBjaGlsZHJlbjoge1xuICAgICdsb2FkUHJvZ3Jlc3NCYXInOiB7fSxcbiAgICAncGxheVByb2dyZXNzQmFyJzoge30sXG4gICAgJ3NlZWtIYW5kbGUnOiB7fVxuICB9LFxuICAnYmFyTmFtZSc6ICdwbGF5UHJvZ3Jlc3NCYXInLFxuICAnaGFuZGxlTmFtZSc6ICdzZWVrSGFuZGxlJ1xufTtcblxudmpzLlNlZWtCYXIucHJvdG90eXBlLnBsYXllckV2ZW50ID0gJ3RpbWV1cGRhdGUnO1xuXG52anMuU2Vla0Jhci5wcm90b3R5cGUuY3JlYXRlRWwgPSBmdW5jdGlvbigpe1xuICByZXR1cm4gdmpzLlNsaWRlci5wcm90b3R5cGUuY3JlYXRlRWwuY2FsbCh0aGlzLCAnZGl2Jywge1xuICAgIGNsYXNzTmFtZTogJ3Zqcy1wcm9ncmVzcy1ob2xkZXInLFxuICAgICdhcmlhLWxhYmVsJzogJ3ZpZGVvIHByb2dyZXNzIGJhcidcbiAgfSk7XG59O1xuXG52anMuU2Vla0Jhci5wcm90b3R5cGUudXBkYXRlQVJJQUF0dHJpYnV0ZXMgPSBmdW5jdGlvbigpe1xuICAgIC8vIEFsbG93cyBmb3Igc21vb3RoIHNjcnViYmluZywgd2hlbiBwbGF5ZXIgY2FuJ3Qga2VlcCB1cC5cbiAgICB2YXIgdGltZSA9ICh0aGlzLnBsYXllcl8uc2NydWJiaW5nKSA/IHRoaXMucGxheWVyXy5nZXRDYWNoZSgpLmN1cnJlbnRUaW1lIDogdGhpcy5wbGF5ZXJfLmN1cnJlbnRUaW1lKCk7XG4gICAgdGhpcy5lbF8uc2V0QXR0cmlidXRlKCdhcmlhLXZhbHVlbm93Jyx2anMucm91bmQodGhpcy5nZXRQZXJjZW50KCkqMTAwLCAyKSk7IC8vIG1hY2hpbmUgcmVhZGFibGUgdmFsdWUgb2YgcHJvZ3Jlc3MgYmFyIChwZXJjZW50YWdlIGNvbXBsZXRlKVxuICAgIHRoaXMuZWxfLnNldEF0dHJpYnV0ZSgnYXJpYS12YWx1ZXRleHQnLHZqcy5mb3JtYXRUaW1lKHRpbWUsIHRoaXMucGxheWVyXy5kdXJhdGlvbigpKSk7IC8vIGh1bWFuIHJlYWRhYmxlIHZhbHVlIG9mIHByb2dyZXNzIGJhciAodGltZSBjb21wbGV0ZSlcbn07XG5cbnZqcy5TZWVrQmFyLnByb3RvdHlwZS5nZXRQZXJjZW50ID0gZnVuY3Rpb24oKXtcbiAgdmFyIGN1cnJlbnRUaW1lO1xuICAvLyBGbGFzaCBSVE1QIHByb3ZpZGVyIHdpbGwgbm90IHJlcG9ydCB0aGUgY29ycmVjdCB0aW1lXG4gIC8vIGltbWVkaWF0ZWx5IGFmdGVyIGEgc2Vlay4gVGhpcyBpc24ndCBub3RpY2VhYmxlIGlmIHlvdSdyZVxuICAvLyBzZWVraW5nIHdoaWxlIHRoZSB2aWRlbyBpcyBwbGF5aW5nLCBidXQgaXQgaXMgaWYgeW91IHNlZWtcbiAgLy8gd2hpbGUgdGhlIHZpZGVvIGlzIHBhdXNlZC5cbiAgaWYgKHRoaXMucGxheWVyXy50ZWNoTmFtZSA9PT0gJ0ZsYXNoJyAmJiB0aGlzLnBsYXllcl8uc2Vla2luZygpKSB7XG4gICAgdmFyIGNhY2hlID0gdGhpcy5wbGF5ZXJfLmdldENhY2hlKCk7XG4gICAgaWYgKGNhY2hlLmxhc3RTZXRDdXJyZW50VGltZSkge1xuICAgICAgY3VycmVudFRpbWUgPSBjYWNoZS5sYXN0U2V0Q3VycmVudFRpbWU7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgY3VycmVudFRpbWUgPSB0aGlzLnBsYXllcl8uY3VycmVudFRpbWUoKTtcbiAgICB9XG4gIH1cbiAgZWxzZSB7XG4gICAgY3VycmVudFRpbWUgPSB0aGlzLnBsYXllcl8uY3VycmVudFRpbWUoKTtcbiAgfVxuXG4gIHJldHVybiBjdXJyZW50VGltZSAvIHRoaXMucGxheWVyXy5kdXJhdGlvbigpO1xufTtcblxudmpzLlNlZWtCYXIucHJvdG90eXBlLm9uTW91c2VEb3duID0gZnVuY3Rpb24oZXZlbnQpe1xuICB2anMuU2xpZGVyLnByb3RvdHlwZS5vbk1vdXNlRG93bi5jYWxsKHRoaXMsIGV2ZW50KTtcblxuICB0aGlzLnBsYXllcl8uc2NydWJiaW5nID0gdHJ1ZTtcblxuICB0aGlzLnZpZGVvV2FzUGxheWluZyA9ICF0aGlzLnBsYXllcl8ucGF1c2VkKCk7XG4gIHRoaXMucGxheWVyXy5wYXVzZSgpO1xufTtcblxudmpzLlNlZWtCYXIucHJvdG90eXBlLm9uTW91c2VNb3ZlID0gZnVuY3Rpb24oZXZlbnQpe1xuICB2YXIgbmV3VGltZSA9IHRoaXMuY2FsY3VsYXRlRGlzdGFuY2UoZXZlbnQpICogdGhpcy5wbGF5ZXJfLmR1cmF0aW9uKCk7XG5cbiAgLy8gRG9uJ3QgbGV0IHZpZGVvIGVuZCB3aGlsZSBzY3J1YmJpbmcuXG4gIGlmIChuZXdUaW1lID09IHRoaXMucGxheWVyXy5kdXJhdGlvbigpKSB7IG5ld1RpbWUgPSBuZXdUaW1lIC0gMC4xOyB9XG5cbiAgLy8gU2V0IG5ldyB0aW1lICh0ZWxsIHBsYXllciB0byBzZWVrIHRvIG5ldyB0aW1lKVxuICB0aGlzLnBsYXllcl8uY3VycmVudFRpbWUobmV3VGltZSk7XG59O1xuXG52anMuU2Vla0Jhci5wcm90b3R5cGUub25Nb3VzZVVwID0gZnVuY3Rpb24oZXZlbnQpe1xuICB2anMuU2xpZGVyLnByb3RvdHlwZS5vbk1vdXNlVXAuY2FsbCh0aGlzLCBldmVudCk7XG5cbiAgdGhpcy5wbGF5ZXJfLnNjcnViYmluZyA9IGZhbHNlO1xuICBpZiAodGhpcy52aWRlb1dhc1BsYXlpbmcpIHtcbiAgICB0aGlzLnBsYXllcl8ucGxheSgpO1xuICB9XG59O1xuXG52anMuU2Vla0Jhci5wcm90b3R5cGUuc3RlcEZvcndhcmQgPSBmdW5jdGlvbigpe1xuICB0aGlzLnBsYXllcl8uY3VycmVudFRpbWUodGhpcy5wbGF5ZXJfLmN1cnJlbnRUaW1lKCkgKyA1KTsgLy8gbW9yZSBxdWlja2x5IGZhc3QgZm9yd2FyZCBmb3Iga2V5Ym9hcmQtb25seSB1c2Vyc1xufTtcblxudmpzLlNlZWtCYXIucHJvdG90eXBlLnN0ZXBCYWNrID0gZnVuY3Rpb24oKXtcbiAgdGhpcy5wbGF5ZXJfLmN1cnJlbnRUaW1lKHRoaXMucGxheWVyXy5jdXJyZW50VGltZSgpIC0gNSk7IC8vIG1vcmUgcXVpY2tseSByZXdpbmQgZm9yIGtleWJvYXJkLW9ubHkgdXNlcnNcbn07XG5cblxuLyoqXG4gKiBTaG93cyBsb2FkIHByb2dyZXNzXG4gKlxuICogQHBhcmFtIHt2anMuUGxheWVyfE9iamVjdH0gcGxheWVyXG4gKiBAcGFyYW0ge09iamVjdD19IG9wdGlvbnNcbiAqIEBjb25zdHJ1Y3RvclxuICovXG52anMuTG9hZFByb2dyZXNzQmFyID0gdmpzLkNvbXBvbmVudC5leHRlbmQoe1xuICAvKiogQGNvbnN0cnVjdG9yICovXG4gIGluaXQ6IGZ1bmN0aW9uKHBsYXllciwgb3B0aW9ucyl7XG4gICAgdmpzLkNvbXBvbmVudC5jYWxsKHRoaXMsIHBsYXllciwgb3B0aW9ucyk7XG4gICAgcGxheWVyLm9uKCdwcm9ncmVzcycsIHZqcy5iaW5kKHRoaXMsIHRoaXMudXBkYXRlKSk7XG4gIH1cbn0pO1xuXG52anMuTG9hZFByb2dyZXNzQmFyLnByb3RvdHlwZS5jcmVhdGVFbCA9IGZ1bmN0aW9uKCl7XG4gIHJldHVybiB2anMuQ29tcG9uZW50LnByb3RvdHlwZS5jcmVhdGVFbC5jYWxsKHRoaXMsICdkaXYnLCB7XG4gICAgY2xhc3NOYW1lOiAndmpzLWxvYWQtcHJvZ3Jlc3MnLFxuICAgIGlubmVySFRNTDogJzxzcGFuIGNsYXNzPVwidmpzLWNvbnRyb2wtdGV4dFwiPkxvYWRlZDogMCU8L3NwYW4+J1xuICB9KTtcbn07XG5cbnZqcy5Mb2FkUHJvZ3Jlc3NCYXIucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKCl7XG4gIGlmICh0aGlzLmVsXy5zdHlsZSkgeyB0aGlzLmVsXy5zdHlsZS53aWR0aCA9IHZqcy5yb3VuZCh0aGlzLnBsYXllcl8uYnVmZmVyZWRQZXJjZW50KCkgKiAxMDAsIDIpICsgJyUnOyB9XG59O1xuXG5cbi8qKlxuICogU2hvd3MgcGxheSBwcm9ncmVzc1xuICpcbiAqIEBwYXJhbSB7dmpzLlBsYXllcnxPYmplY3R9IHBsYXllclxuICogQHBhcmFtIHtPYmplY3Q9fSBvcHRpb25zXG4gKiBAY29uc3RydWN0b3JcbiAqL1xudmpzLlBsYXlQcm9ncmVzc0JhciA9IHZqcy5Db21wb25lbnQuZXh0ZW5kKHtcbiAgLyoqIEBjb25zdHJ1Y3RvciAqL1xuICBpbml0OiBmdW5jdGlvbihwbGF5ZXIsIG9wdGlvbnMpe1xuICAgIHZqcy5Db21wb25lbnQuY2FsbCh0aGlzLCBwbGF5ZXIsIG9wdGlvbnMpO1xuICB9XG59KTtcblxudmpzLlBsYXlQcm9ncmVzc0Jhci5wcm90b3R5cGUuY3JlYXRlRWwgPSBmdW5jdGlvbigpe1xuICByZXR1cm4gdmpzLkNvbXBvbmVudC5wcm90b3R5cGUuY3JlYXRlRWwuY2FsbCh0aGlzLCAnZGl2Jywge1xuICAgIGNsYXNzTmFtZTogJ3Zqcy1wbGF5LXByb2dyZXNzJyxcbiAgICBpbm5lckhUTUw6ICc8c3BhbiBjbGFzcz1cInZqcy1jb250cm9sLXRleHRcIj5Qcm9ncmVzczogMCU8L3NwYW4+J1xuICB9KTtcbn07XG5cbi8qKlxuICogVGhlIFNlZWsgSGFuZGxlIHNob3dzIHRoZSBjdXJyZW50IHBvc2l0aW9uIG9mIHRoZSBwbGF5aGVhZCBkdXJpbmcgcGxheWJhY2ssXG4gKiBhbmQgY2FuIGJlIGRyYWdnZWQgdG8gYWRqdXN0IHRoZSBwbGF5aGVhZC5cbiAqXG4gKiBAcGFyYW0ge3Zqcy5QbGF5ZXJ8T2JqZWN0fSBwbGF5ZXJcbiAqIEBwYXJhbSB7T2JqZWN0PX0gb3B0aW9uc1xuICogQGNvbnN0cnVjdG9yXG4gKi9cbnZqcy5TZWVrSGFuZGxlID0gdmpzLlNsaWRlckhhbmRsZS5leHRlbmQoKTtcblxuLyoqXG4gKiBUaGUgZGVmYXVsdCB2YWx1ZSBmb3IgdGhlIGhhbmRsZSBjb250ZW50LCB3aGljaCBtYXkgYmUgcmVhZCBieSBzY3JlZW4gcmVhZGVyc1xuICpcbiAqIEB0eXBlIHtTdHJpbmd9XG4gKiBAcHJpdmF0ZVxuICovXG52anMuU2Vla0hhbmRsZS5wcm90b3R5cGUuZGVmYXVsdFZhbHVlID0gJzAwOjAwJztcblxuLyoqIEBpbmhlcml0RG9jICovXG52anMuU2Vla0hhbmRsZS5wcm90b3R5cGUuY3JlYXRlRWwgPSBmdW5jdGlvbigpe1xuICByZXR1cm4gdmpzLlNsaWRlckhhbmRsZS5wcm90b3R5cGUuY3JlYXRlRWwuY2FsbCh0aGlzLCAnZGl2Jywge1xuICAgIGNsYXNzTmFtZTogJ3Zqcy1zZWVrLWhhbmRsZSdcbiAgfSk7XG59O1xuLyoqXG4gKiBUaGUgY29tcG9uZW50IGZvciBjb250cm9sbGluZyB0aGUgdm9sdW1lIGxldmVsXG4gKlxuICogQHBhcmFtIHt2anMuUGxheWVyfE9iamVjdH0gcGxheWVyXG4gKiBAcGFyYW0ge09iamVjdD19IG9wdGlvbnNcbiAqIEBjb25zdHJ1Y3RvclxuICovXG52anMuVm9sdW1lQ29udHJvbCA9IHZqcy5Db21wb25lbnQuZXh0ZW5kKHtcbiAgLyoqIEBjb25zdHJ1Y3RvciAqL1xuICBpbml0OiBmdW5jdGlvbihwbGF5ZXIsIG9wdGlvbnMpe1xuICAgIHZqcy5Db21wb25lbnQuY2FsbCh0aGlzLCBwbGF5ZXIsIG9wdGlvbnMpO1xuXG4gICAgLy8gaGlkZSB2b2x1bWUgY29udHJvbHMgd2hlbiB0aGV5J3JlIG5vdCBzdXBwb3J0ZWQgYnkgdGhlIGN1cnJlbnQgdGVjaFxuICAgIGlmIChwbGF5ZXIudGVjaCAmJiBwbGF5ZXIudGVjaC5mZWF0dXJlcyAmJiBwbGF5ZXIudGVjaC5mZWF0dXJlc1sndm9sdW1lQ29udHJvbCddID09PSBmYWxzZSkge1xuICAgICAgdGhpcy5hZGRDbGFzcygndmpzLWhpZGRlbicpO1xuICAgIH1cbiAgICBwbGF5ZXIub24oJ2xvYWRzdGFydCcsIHZqcy5iaW5kKHRoaXMsIGZ1bmN0aW9uKCl7XG4gICAgICBpZiAocGxheWVyLnRlY2guZmVhdHVyZXMgJiYgcGxheWVyLnRlY2guZmVhdHVyZXNbJ3ZvbHVtZUNvbnRyb2wnXSA9PT0gZmFsc2UpIHtcbiAgICAgICAgdGhpcy5hZGRDbGFzcygndmpzLWhpZGRlbicpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5yZW1vdmVDbGFzcygndmpzLWhpZGRlbicpO1xuICAgICAgfVxuICAgIH0pKTtcbiAgfVxufSk7XG5cbnZqcy5Wb2x1bWVDb250cm9sLnByb3RvdHlwZS5vcHRpb25zXyA9IHtcbiAgY2hpbGRyZW46IHtcbiAgICAndm9sdW1lQmFyJzoge31cbiAgfVxufTtcblxudmpzLlZvbHVtZUNvbnRyb2wucHJvdG90eXBlLmNyZWF0ZUVsID0gZnVuY3Rpb24oKXtcbiAgcmV0dXJuIHZqcy5Db21wb25lbnQucHJvdG90eXBlLmNyZWF0ZUVsLmNhbGwodGhpcywgJ2RpdicsIHtcbiAgICBjbGFzc05hbWU6ICd2anMtdm9sdW1lLWNvbnRyb2wgdmpzLWNvbnRyb2wnXG4gIH0pO1xufTtcblxuLyoqXG4gKiBUaGUgYmFyIHRoYXQgY29udGFpbnMgdGhlIHZvbHVtZSBsZXZlbCBhbmQgY2FuIGJlIGNsaWNrZWQgb24gdG8gYWRqdXN0IHRoZSBsZXZlbFxuICpcbiAqIEBwYXJhbSB7dmpzLlBsYXllcnxPYmplY3R9IHBsYXllclxuICogQHBhcmFtIHtPYmplY3Q9fSBvcHRpb25zXG4gKiBAY29uc3RydWN0b3JcbiAqL1xudmpzLlZvbHVtZUJhciA9IHZqcy5TbGlkZXIuZXh0ZW5kKHtcbiAgLyoqIEBjb25zdHJ1Y3RvciAqL1xuICBpbml0OiBmdW5jdGlvbihwbGF5ZXIsIG9wdGlvbnMpe1xuICAgIHZqcy5TbGlkZXIuY2FsbCh0aGlzLCBwbGF5ZXIsIG9wdGlvbnMpO1xuICAgIHBsYXllci5vbigndm9sdW1lY2hhbmdlJywgdmpzLmJpbmQodGhpcywgdGhpcy51cGRhdGVBUklBQXR0cmlidXRlcykpO1xuICAgIHBsYXllci5yZWFkeSh2anMuYmluZCh0aGlzLCB0aGlzLnVwZGF0ZUFSSUFBdHRyaWJ1dGVzKSk7XG4gICAgc2V0VGltZW91dCh2anMuYmluZCh0aGlzLCB0aGlzLnVwZGF0ZSksIDApOyAvLyB1cGRhdGUgd2hlbiBlbGVtZW50cyBpcyBpbiBET01cbiAgfVxufSk7XG5cbnZqcy5Wb2x1bWVCYXIucHJvdG90eXBlLnVwZGF0ZUFSSUFBdHRyaWJ1dGVzID0gZnVuY3Rpb24oKXtcbiAgLy8gQ3VycmVudCB2YWx1ZSBvZiB2b2x1bWUgYmFyIGFzIGEgcGVyY2VudGFnZVxuICB0aGlzLmVsXy5zZXRBdHRyaWJ1dGUoJ2FyaWEtdmFsdWVub3cnLHZqcy5yb3VuZCh0aGlzLnBsYXllcl8udm9sdW1lKCkqMTAwLCAyKSk7XG4gIHRoaXMuZWxfLnNldEF0dHJpYnV0ZSgnYXJpYS12YWx1ZXRleHQnLHZqcy5yb3VuZCh0aGlzLnBsYXllcl8udm9sdW1lKCkqMTAwLCAyKSsnJScpO1xufTtcblxudmpzLlZvbHVtZUJhci5wcm90b3R5cGUub3B0aW9uc18gPSB7XG4gIGNoaWxkcmVuOiB7XG4gICAgJ3ZvbHVtZUxldmVsJzoge30sXG4gICAgJ3ZvbHVtZUhhbmRsZSc6IHt9XG4gIH0sXG4gICdiYXJOYW1lJzogJ3ZvbHVtZUxldmVsJyxcbiAgJ2hhbmRsZU5hbWUnOiAndm9sdW1lSGFuZGxlJ1xufTtcblxudmpzLlZvbHVtZUJhci5wcm90b3R5cGUucGxheWVyRXZlbnQgPSAndm9sdW1lY2hhbmdlJztcblxudmpzLlZvbHVtZUJhci5wcm90b3R5cGUuY3JlYXRlRWwgPSBmdW5jdGlvbigpe1xuICByZXR1cm4gdmpzLlNsaWRlci5wcm90b3R5cGUuY3JlYXRlRWwuY2FsbCh0aGlzLCAnZGl2Jywge1xuICAgIGNsYXNzTmFtZTogJ3Zqcy12b2x1bWUtYmFyJyxcbiAgICAnYXJpYS1sYWJlbCc6ICd2b2x1bWUgbGV2ZWwnXG4gIH0pO1xufTtcblxudmpzLlZvbHVtZUJhci5wcm90b3R5cGUub25Nb3VzZU1vdmUgPSBmdW5jdGlvbihldmVudCkge1xuICBpZiAodGhpcy5wbGF5ZXJfLm11dGVkKCkpIHtcbiAgICB0aGlzLnBsYXllcl8ubXV0ZWQoZmFsc2UpO1xuICB9XG5cbiAgdGhpcy5wbGF5ZXJfLnZvbHVtZSh0aGlzLmNhbGN1bGF0ZURpc3RhbmNlKGV2ZW50KSk7XG59O1xuXG52anMuVm9sdW1lQmFyLnByb3RvdHlwZS5nZXRQZXJjZW50ID0gZnVuY3Rpb24oKXtcbiAgaWYgKHRoaXMucGxheWVyXy5tdXRlZCgpKSB7XG4gICAgcmV0dXJuIDA7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHRoaXMucGxheWVyXy52b2x1bWUoKTtcbiAgfVxufTtcblxudmpzLlZvbHVtZUJhci5wcm90b3R5cGUuc3RlcEZvcndhcmQgPSBmdW5jdGlvbigpe1xuICB0aGlzLnBsYXllcl8udm9sdW1lKHRoaXMucGxheWVyXy52b2x1bWUoKSArIDAuMSk7XG59O1xuXG52anMuVm9sdW1lQmFyLnByb3RvdHlwZS5zdGVwQmFjayA9IGZ1bmN0aW9uKCl7XG4gIHRoaXMucGxheWVyXy52b2x1bWUodGhpcy5wbGF5ZXJfLnZvbHVtZSgpIC0gMC4xKTtcbn07XG5cbi8qKlxuICogU2hvd3Mgdm9sdW1lIGxldmVsXG4gKlxuICogQHBhcmFtIHt2anMuUGxheWVyfE9iamVjdH0gcGxheWVyXG4gKiBAcGFyYW0ge09iamVjdD19IG9wdGlvbnNcbiAqIEBjb25zdHJ1Y3RvclxuICovXG52anMuVm9sdW1lTGV2ZWwgPSB2anMuQ29tcG9uZW50LmV4dGVuZCh7XG4gIC8qKiBAY29uc3RydWN0b3IgKi9cbiAgaW5pdDogZnVuY3Rpb24ocGxheWVyLCBvcHRpb25zKXtcbiAgICB2anMuQ29tcG9uZW50LmNhbGwodGhpcywgcGxheWVyLCBvcHRpb25zKTtcbiAgfVxufSk7XG5cbnZqcy5Wb2x1bWVMZXZlbC5wcm90b3R5cGUuY3JlYXRlRWwgPSBmdW5jdGlvbigpe1xuICByZXR1cm4gdmpzLkNvbXBvbmVudC5wcm90b3R5cGUuY3JlYXRlRWwuY2FsbCh0aGlzLCAnZGl2Jywge1xuICAgIGNsYXNzTmFtZTogJ3Zqcy12b2x1bWUtbGV2ZWwnLFxuICAgIGlubmVySFRNTDogJzxzcGFuIGNsYXNzPVwidmpzLWNvbnRyb2wtdGV4dFwiPjwvc3Bhbj4nXG4gIH0pO1xufTtcblxuLyoqXG4gKiBUaGUgdm9sdW1lIGhhbmRsZSBjYW4gYmUgZHJhZ2dlZCB0byBhZGp1c3QgdGhlIHZvbHVtZSBsZXZlbFxuICpcbiAqIEBwYXJhbSB7dmpzLlBsYXllcnxPYmplY3R9IHBsYXllclxuICogQHBhcmFtIHtPYmplY3Q9fSBvcHRpb25zXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuIHZqcy5Wb2x1bWVIYW5kbGUgPSB2anMuU2xpZGVySGFuZGxlLmV4dGVuZCgpO1xuXG4gdmpzLlZvbHVtZUhhbmRsZS5wcm90b3R5cGUuZGVmYXVsdFZhbHVlID0gJzAwOjAwJztcblxuIC8qKiBAaW5oZXJpdERvYyAqL1xuIHZqcy5Wb2x1bWVIYW5kbGUucHJvdG90eXBlLmNyZWF0ZUVsID0gZnVuY3Rpb24oKXtcbiAgIHJldHVybiB2anMuU2xpZGVySGFuZGxlLnByb3RvdHlwZS5jcmVhdGVFbC5jYWxsKHRoaXMsICdkaXYnLCB7XG4gICAgIGNsYXNzTmFtZTogJ3Zqcy12b2x1bWUtaGFuZGxlJ1xuICAgfSk7XG4gfTtcbi8qKlxuICogQSBidXR0b24gY29tcG9uZW50IGZvciBtdXRpbmcgdGhlIGF1ZGlvXG4gKlxuICogQHBhcmFtIHt2anMuUGxheWVyfE9iamVjdH0gcGxheWVyXG4gKiBAcGFyYW0ge09iamVjdD19IG9wdGlvbnNcbiAqIEBjb25zdHJ1Y3RvclxuICovXG52anMuTXV0ZVRvZ2dsZSA9IHZqcy5CdXR0b24uZXh0ZW5kKHtcbiAgLyoqIEBjb25zdHJ1Y3RvciAqL1xuICBpbml0OiBmdW5jdGlvbihwbGF5ZXIsIG9wdGlvbnMpe1xuICAgIHZqcy5CdXR0b24uY2FsbCh0aGlzLCBwbGF5ZXIsIG9wdGlvbnMpO1xuXG4gICAgcGxheWVyLm9uKCd2b2x1bWVjaGFuZ2UnLCB2anMuYmluZCh0aGlzLCB0aGlzLnVwZGF0ZSkpO1xuXG4gICAgLy8gaGlkZSBtdXRlIHRvZ2dsZSBpZiB0aGUgY3VycmVudCB0ZWNoIGRvZXNuJ3Qgc3VwcG9ydCB2b2x1bWUgY29udHJvbFxuICAgIGlmIChwbGF5ZXIudGVjaCAmJiBwbGF5ZXIudGVjaC5mZWF0dXJlcyAmJiBwbGF5ZXIudGVjaC5mZWF0dXJlc1sndm9sdW1lQ29udHJvbCddID09PSBmYWxzZSkge1xuICAgICAgdGhpcy5hZGRDbGFzcygndmpzLWhpZGRlbicpO1xuICAgIH1cbiAgICBwbGF5ZXIub24oJ2xvYWRzdGFydCcsIHZqcy5iaW5kKHRoaXMsIGZ1bmN0aW9uKCl7XG4gICAgICBpZiAocGxheWVyLnRlY2guZmVhdHVyZXMgJiYgcGxheWVyLnRlY2guZmVhdHVyZXNbJ3ZvbHVtZUNvbnRyb2wnXSA9PT0gZmFsc2UpIHtcbiAgICAgICAgdGhpcy5hZGRDbGFzcygndmpzLWhpZGRlbicpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5yZW1vdmVDbGFzcygndmpzLWhpZGRlbicpO1xuICAgICAgfVxuICAgIH0pKTtcbiAgfVxufSk7XG5cbnZqcy5NdXRlVG9nZ2xlLnByb3RvdHlwZS5jcmVhdGVFbCA9IGZ1bmN0aW9uKCl7XG4gIHJldHVybiB2anMuQnV0dG9uLnByb3RvdHlwZS5jcmVhdGVFbC5jYWxsKHRoaXMsICdkaXYnLCB7XG4gICAgY2xhc3NOYW1lOiAndmpzLW11dGUtY29udHJvbCB2anMtY29udHJvbCcsXG4gICAgaW5uZXJIVE1MOiAnPGRpdj48c3BhbiBjbGFzcz1cInZqcy1jb250cm9sLXRleHRcIj5NdXRlPC9zcGFuPjwvZGl2PidcbiAgfSk7XG59O1xuXG52anMuTXV0ZVRvZ2dsZS5wcm90b3R5cGUub25DbGljayA9IGZ1bmN0aW9uKCl7XG4gIHRoaXMucGxheWVyXy5tdXRlZCggdGhpcy5wbGF5ZXJfLm11dGVkKCkgPyBmYWxzZSA6IHRydWUgKTtcbn07XG5cbnZqcy5NdXRlVG9nZ2xlLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbigpe1xuICB2YXIgdm9sID0gdGhpcy5wbGF5ZXJfLnZvbHVtZSgpLFxuICAgICAgbGV2ZWwgPSAzO1xuXG4gIGlmICh2b2wgPT09IDAgfHwgdGhpcy5wbGF5ZXJfLm11dGVkKCkpIHtcbiAgICBsZXZlbCA9IDA7XG4gIH0gZWxzZSBpZiAodm9sIDwgMC4zMykge1xuICAgIGxldmVsID0gMTtcbiAgfSBlbHNlIGlmICh2b2wgPCAwLjY3KSB7XG4gICAgbGV2ZWwgPSAyO1xuICB9XG5cbiAgLy8gRG9uJ3QgcmV3cml0ZSB0aGUgYnV0dG9uIHRleHQgaWYgdGhlIGFjdHVhbCB0ZXh0IGRvZXNuJ3QgY2hhbmdlLlxuICAvLyBUaGlzIGNhdXNlcyB1bm5lY2Vzc2FyeSBhbmQgY29uZnVzaW5nIGluZm9ybWF0aW9uIGZvciBzY3JlZW4gcmVhZGVyIHVzZXJzLlxuICAvLyBUaGlzIGNoZWNrIGlzIG5lZWRlZCBiZWNhdXNlIHRoaXMgZnVuY3Rpb24gZ2V0cyBjYWxsZWQgZXZlcnkgdGltZSB0aGUgdm9sdW1lIGxldmVsIGlzIGNoYW5nZWQuXG4gIGlmKHRoaXMucGxheWVyXy5tdXRlZCgpKXtcbiAgICAgIGlmKHRoaXMuZWxfLmNoaWxkcmVuWzBdLmNoaWxkcmVuWzBdLmlubmVySFRNTCE9J1VubXV0ZScpe1xuICAgICAgICAgIHRoaXMuZWxfLmNoaWxkcmVuWzBdLmNoaWxkcmVuWzBdLmlubmVySFRNTCA9ICdVbm11dGUnOyAvLyBjaGFuZ2UgdGhlIGJ1dHRvbiB0ZXh0IHRvIFwiVW5tdXRlXCJcbiAgICAgIH1cbiAgfSBlbHNlIHtcbiAgICAgIGlmKHRoaXMuZWxfLmNoaWxkcmVuWzBdLmNoaWxkcmVuWzBdLmlubmVySFRNTCE9J011dGUnKXtcbiAgICAgICAgICB0aGlzLmVsXy5jaGlsZHJlblswXS5jaGlsZHJlblswXS5pbm5lckhUTUwgPSAnTXV0ZSc7IC8vIGNoYW5nZSB0aGUgYnV0dG9uIHRleHQgdG8gXCJNdXRlXCJcbiAgICAgIH1cbiAgfVxuXG4gIC8qIFRPRE8gaW1wcm92ZSBtdXRlZCBpY29uIGNsYXNzZXMgKi9cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICB2anMucmVtb3ZlQ2xhc3ModGhpcy5lbF8sICd2anMtdm9sLScraSk7XG4gIH1cbiAgdmpzLmFkZENsYXNzKHRoaXMuZWxfLCAndmpzLXZvbC0nK2xldmVsKTtcbn07XG4vKipcbiAqIE1lbnUgYnV0dG9uIHdpdGggYSBwb3B1cCBmb3Igc2hvd2luZyB0aGUgdm9sdW1lIHNsaWRlci5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG52anMuVm9sdW1lTWVudUJ1dHRvbiA9IHZqcy5NZW51QnV0dG9uLmV4dGVuZCh7XG4gIC8qKiBAY29uc3RydWN0b3IgKi9cbiAgaW5pdDogZnVuY3Rpb24ocGxheWVyLCBvcHRpb25zKXtcbiAgICB2anMuTWVudUJ1dHRvbi5jYWxsKHRoaXMsIHBsYXllciwgb3B0aW9ucyk7XG5cbiAgICAvLyBTYW1lIGxpc3RlbmVycyBhcyBNdXRlVG9nZ2xlXG4gICAgcGxheWVyLm9uKCd2b2x1bWVjaGFuZ2UnLCB2anMuYmluZCh0aGlzLCB0aGlzLnVwZGF0ZSkpO1xuXG4gICAgLy8gaGlkZSBtdXRlIHRvZ2dsZSBpZiB0aGUgY3VycmVudCB0ZWNoIGRvZXNuJ3Qgc3VwcG9ydCB2b2x1bWUgY29udHJvbFxuICAgIGlmIChwbGF5ZXIudGVjaCAmJiBwbGF5ZXIudGVjaC5mZWF0dXJlcyAmJiBwbGF5ZXIudGVjaC5mZWF0dXJlcy52b2x1bWVDb250cm9sID09PSBmYWxzZSkge1xuICAgICAgdGhpcy5hZGRDbGFzcygndmpzLWhpZGRlbicpO1xuICAgIH1cbiAgICBwbGF5ZXIub24oJ2xvYWRzdGFydCcsIHZqcy5iaW5kKHRoaXMsIGZ1bmN0aW9uKCl7XG4gICAgICBpZiAocGxheWVyLnRlY2guZmVhdHVyZXMgJiYgcGxheWVyLnRlY2guZmVhdHVyZXMudm9sdW1lQ29udHJvbCA9PT0gZmFsc2UpIHtcbiAgICAgICAgdGhpcy5hZGRDbGFzcygndmpzLWhpZGRlbicpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5yZW1vdmVDbGFzcygndmpzLWhpZGRlbicpO1xuICAgICAgfVxuICAgIH0pKTtcbiAgICB0aGlzLmFkZENsYXNzKCd2anMtbWVudS1idXR0b24nKTtcbiAgfVxufSk7XG5cbnZqcy5Wb2x1bWVNZW51QnV0dG9uLnByb3RvdHlwZS5jcmVhdGVNZW51ID0gZnVuY3Rpb24oKXtcbiAgdmFyIG1lbnUgPSBuZXcgdmpzLk1lbnUodGhpcy5wbGF5ZXJfLCB7XG4gICAgY29udGVudEVsVHlwZTogJ2RpdidcbiAgfSk7XG4gIHZhciB2YyA9IG5ldyB2anMuVm9sdW1lQmFyKHRoaXMucGxheWVyXywgdmpzLm9iai5tZXJnZSh7dmVydGljYWw6IHRydWV9LCB0aGlzLm9wdGlvbnNfLnZvbHVtZUJhcikpO1xuICBtZW51LmFkZENoaWxkKHZjKTtcbiAgcmV0dXJuIG1lbnU7XG59O1xuXG52anMuVm9sdW1lTWVudUJ1dHRvbi5wcm90b3R5cGUub25DbGljayA9IGZ1bmN0aW9uKCl7XG4gIHZqcy5NdXRlVG9nZ2xlLnByb3RvdHlwZS5vbkNsaWNrLmNhbGwodGhpcyk7XG4gIHZqcy5NZW51QnV0dG9uLnByb3RvdHlwZS5vbkNsaWNrLmNhbGwodGhpcyk7XG59O1xuXG52anMuVm9sdW1lTWVudUJ1dHRvbi5wcm90b3R5cGUuY3JlYXRlRWwgPSBmdW5jdGlvbigpe1xuICByZXR1cm4gdmpzLkJ1dHRvbi5wcm90b3R5cGUuY3JlYXRlRWwuY2FsbCh0aGlzLCAnZGl2Jywge1xuICAgIGNsYXNzTmFtZTogJ3Zqcy12b2x1bWUtbWVudS1idXR0b24gdmpzLW1lbnUtYnV0dG9uIHZqcy1jb250cm9sJyxcbiAgICBpbm5lckhUTUw6ICc8ZGl2PjxzcGFuIGNsYXNzPVwidmpzLWNvbnRyb2wtdGV4dFwiPk11dGU8L3NwYW4+PC9kaXY+J1xuICB9KTtcbn07XG52anMuVm9sdW1lTWVudUJ1dHRvbi5wcm90b3R5cGUudXBkYXRlID0gdmpzLk11dGVUb2dnbGUucHJvdG90eXBlLnVwZGF0ZTtcbi8qIFBvc3RlciBJbWFnZVxuPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi9cbi8qKlxuICogVGhlIGNvbXBvbmVudCB0aGF0IGhhbmRsZXMgc2hvd2luZyB0aGUgcG9zdGVyIGltYWdlLlxuICpcbiAqIEBwYXJhbSB7dmpzLlBsYXllcnxPYmplY3R9IHBsYXllclxuICogQHBhcmFtIHtPYmplY3Q9fSBvcHRpb25zXG4gKiBAY29uc3RydWN0b3JcbiAqL1xudmpzLlBvc3RlckltYWdlID0gdmpzLkJ1dHRvbi5leHRlbmQoe1xuICAvKiogQGNvbnN0cnVjdG9yICovXG4gIGluaXQ6IGZ1bmN0aW9uKHBsYXllciwgb3B0aW9ucyl7XG4gICAgdmpzLkJ1dHRvbi5jYWxsKHRoaXMsIHBsYXllciwgb3B0aW9ucyk7XG5cbiAgICBpZiAoIXBsYXllci5wb3N0ZXIoKSB8fCAhcGxheWVyLmNvbnRyb2xzKCkpIHtcbiAgICAgIHRoaXMuaGlkZSgpO1xuICAgIH1cblxuICAgIHBsYXllci5vbigncGxheScsIHZqcy5iaW5kKHRoaXMsIHRoaXMuaGlkZSkpO1xuICB9XG59KTtcblxudmpzLlBvc3RlckltYWdlLnByb3RvdHlwZS5jcmVhdGVFbCA9IGZ1bmN0aW9uKCl7XG4gIHZhciBlbCA9IHZqcy5jcmVhdGVFbCgnZGl2Jywge1xuICAgICAgICBjbGFzc05hbWU6ICd2anMtcG9zdGVyJyxcblxuICAgICAgICAvLyBEb24ndCB3YW50IHBvc3RlciB0byBiZSB0YWJiYWJsZS5cbiAgICAgICAgdGFiSW5kZXg6IC0xXG4gICAgICB9KSxcbiAgICAgIHBvc3RlciA9IHRoaXMucGxheWVyXy5wb3N0ZXIoKTtcblxuICBpZiAocG9zdGVyKSB7XG4gICAgaWYgKCdiYWNrZ3JvdW5kU2l6ZScgaW4gZWwuc3R5bGUpIHtcbiAgICAgIGVsLnN0eWxlLmJhY2tncm91bmRJbWFnZSA9ICd1cmwoXCInICsgcG9zdGVyICsgJ1wiKSc7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVsLmFwcGVuZENoaWxkKHZqcy5jcmVhdGVFbCgnaW1nJywgeyBzcmM6IHBvc3RlciB9KSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGVsO1xufTtcblxudmpzLlBvc3RlckltYWdlLnByb3RvdHlwZS5vbkNsaWNrID0gZnVuY3Rpb24oKXtcbiAgLy8gT25seSBhY2NlcHQgY2xpY2tzIHdoZW4gY29udHJvbHMgYXJlIGVuYWJsZWRcbiAgaWYgKHRoaXMucGxheWVyKCkuY29udHJvbHMoKSkge1xuICAgIHRoaXMucGxheWVyXy5wbGF5KCk7XG4gIH1cbn07XG4vKiBMb2FkaW5nIFNwaW5uZXJcbj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovXG4vKipcbiAqIExvYWRpbmcgc3Bpbm5lciBmb3Igd2FpdGluZyBldmVudHNcbiAqIEBwYXJhbSB7dmpzLlBsYXllcnxPYmplY3R9IHBsYXllclxuICogQHBhcmFtIHtPYmplY3Q9fSBvcHRpb25zXG4gKiBAY2xhc3NcbiAqIEBjb25zdHJ1Y3RvclxuICovXG52anMuTG9hZGluZ1NwaW5uZXIgPSB2anMuQ29tcG9uZW50LmV4dGVuZCh7XG4gIC8qKiBAY29uc3RydWN0b3IgKi9cbiAgaW5pdDogZnVuY3Rpb24ocGxheWVyLCBvcHRpb25zKXtcbiAgICB2anMuQ29tcG9uZW50LmNhbGwodGhpcywgcGxheWVyLCBvcHRpb25zKTtcblxuICAgIHBsYXllci5vbignY2FucGxheScsIHZqcy5iaW5kKHRoaXMsIHRoaXMuaGlkZSkpO1xuICAgIHBsYXllci5vbignY2FucGxheXRocm91Z2gnLCB2anMuYmluZCh0aGlzLCB0aGlzLmhpZGUpKTtcbiAgICBwbGF5ZXIub24oJ3BsYXlpbmcnLCB2anMuYmluZCh0aGlzLCB0aGlzLmhpZGUpKTtcbiAgICBwbGF5ZXIub24oJ3NlZWtlZCcsIHZqcy5iaW5kKHRoaXMsIHRoaXMuaGlkZSkpO1xuXG4gICAgcGxheWVyLm9uKCdzZWVraW5nJywgdmpzLmJpbmQodGhpcywgdGhpcy5zaG93KSk7XG5cbiAgICAvLyBpbiBzb21lIGJyb3dzZXJzIHNlZWtpbmcgZG9lcyBub3QgdHJpZ2dlciB0aGUgJ3BsYXlpbmcnIGV2ZW50LFxuICAgIC8vIHNvIHdlIGFsc28gbmVlZCB0byB0cmFwICdzZWVrZWQnIGlmIHdlIGFyZSBnb2luZyB0byBzZXQgYVxuICAgIC8vICdzZWVraW5nJyBldmVudFxuICAgIHBsYXllci5vbignc2Vla2VkJywgdmpzLmJpbmQodGhpcywgdGhpcy5oaWRlKSk7XG5cbiAgICBwbGF5ZXIub24oJ2Vycm9yJywgdmpzLmJpbmQodGhpcywgdGhpcy5zaG93KSk7XG5cbiAgICAvLyBOb3Qgc2hvd2luZyBzcGlubmVyIG9uIHN0YWxsZWQgYW55IG1vcmUuIEJyb3dzZXJzIG1heSBzdGFsbCBhbmQgdGhlbiBub3QgdHJpZ2dlciBhbnkgZXZlbnRzIHRoYXQgd291bGQgcmVtb3ZlIHRoZSBzcGlubmVyLlxuICAgIC8vIENoZWNrZWQgaW4gQ2hyb21lIDE2IGFuZCBTYWZhcmkgNS4xLjIuIGh0dHA6Ly9oZWxwLnZpZGVvanMuY29tL2Rpc2N1c3Npb25zL3Byb2JsZW1zLzg4My13aHktaXMtdGhlLWRvd25sb2FkLXByb2dyZXNzLXNob3dpbmdcbiAgICAvLyBwbGF5ZXIub24oJ3N0YWxsZWQnLCB2anMuYmluZCh0aGlzLCB0aGlzLnNob3cpKTtcblxuICAgIHBsYXllci5vbignd2FpdGluZycsIHZqcy5iaW5kKHRoaXMsIHRoaXMuc2hvdykpO1xuICB9XG59KTtcblxudmpzLkxvYWRpbmdTcGlubmVyLnByb3RvdHlwZS5jcmVhdGVFbCA9IGZ1bmN0aW9uKCl7XG4gIHJldHVybiB2anMuQ29tcG9uZW50LnByb3RvdHlwZS5jcmVhdGVFbC5jYWxsKHRoaXMsICdkaXYnLCB7XG4gICAgY2xhc3NOYW1lOiAndmpzLWxvYWRpbmctc3Bpbm5lcidcbiAgfSk7XG59O1xuLyogQmlnIFBsYXkgQnV0dG9uXG49PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqL1xuLyoqXG4gKiBJbml0aWFsIHBsYXkgYnV0dG9uLiBTaG93cyBiZWZvcmUgdGhlIHZpZGVvIGhhcyBwbGF5ZWQuIFRoZSBoaWRpbmcgb2YgdGhlXG4gKiBiaWcgcGxheSBidXR0b24gaXMgZG9uZSB2aWEgQ1NTIGFuZCBwbGF5ZXIgc3RhdGVzLlxuICogQHBhcmFtIHt2anMuUGxheWVyfE9iamVjdH0gcGxheWVyXG4gKiBAcGFyYW0ge09iamVjdD19IG9wdGlvbnNcbiAqIEBjbGFzc1xuICogQGNvbnN0cnVjdG9yXG4gKi9cbnZqcy5CaWdQbGF5QnV0dG9uID0gdmpzLkJ1dHRvbi5leHRlbmQoKTtcblxudmpzLkJpZ1BsYXlCdXR0b24ucHJvdG90eXBlLmNyZWF0ZUVsID0gZnVuY3Rpb24oKXtcbiAgcmV0dXJuIHZqcy5CdXR0b24ucHJvdG90eXBlLmNyZWF0ZUVsLmNhbGwodGhpcywgJ2RpdicsIHtcbiAgICBjbGFzc05hbWU6ICd2anMtYmlnLXBsYXktYnV0dG9uJyxcbiAgICBpbm5lckhUTUw6ICc8c3BhbiBhcmlhLWhpZGRlbj1cInRydWVcIj48L3NwYW4+JyxcbiAgICAnYXJpYS1sYWJlbCc6ICdwbGF5IHZpZGVvJ1xuICB9KTtcbn07XG5cbnZqcy5CaWdQbGF5QnV0dG9uLnByb3RvdHlwZS5vbkNsaWNrID0gZnVuY3Rpb24oKXtcbiAgdGhpcy5wbGF5ZXJfLnBsYXkoKTtcbn07XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTWVkaWEgVGVjaG5vbG9neSBDb250cm9sbGVyIC0gQmFzZSBjbGFzcyBmb3IgbWVkaWEgcGxheWJhY2tcbiAqIHRlY2hub2xvZ3kgY29udHJvbGxlcnMgbGlrZSBGbGFzaCBhbmQgSFRNTDVcbiAqL1xuXG4vKipcbiAqIEJhc2UgY2xhc3MgZm9yIG1lZGlhIChIVE1MNSBWaWRlbywgRmxhc2gpIGNvbnRyb2xsZXJzXG4gKiBAcGFyYW0ge3Zqcy5QbGF5ZXJ8T2JqZWN0fSBwbGF5ZXIgIENlbnRyYWwgcGxheWVyIGluc3RhbmNlXG4gKiBAcGFyYW0ge09iamVjdD19IG9wdGlvbnMgT3B0aW9ucyBvYmplY3RcbiAqIEBjb25zdHJ1Y3RvclxuICovXG52anMuTWVkaWFUZWNoQ29udHJvbGxlciA9IHZqcy5Db21wb25lbnQuZXh0ZW5kKHtcbiAgLyoqIEBjb25zdHJ1Y3RvciAqL1xuICBpbml0OiBmdW5jdGlvbihwbGF5ZXIsIG9wdGlvbnMsIHJlYWR5KXtcbiAgICB2anMuQ29tcG9uZW50LmNhbGwodGhpcywgcGxheWVyLCBvcHRpb25zLCByZWFkeSk7XG5cbiAgICB0aGlzLmluaXRDb250cm9sc0xpc3RlbmVycygpO1xuICB9XG59KTtcblxuLyoqXG4gKiBTZXQgdXAgY2xpY2sgYW5kIHRvdWNoIGxpc3RlbmVycyBmb3IgdGhlIHBsYXliYWNrIGVsZW1lbnRcbiAqIE9uIGRlc2t0b3BzLCBhIGNsaWNrIG9uIHRoZSB2aWRlbyBpdHNlbGYgd2lsbCB0b2dnbGUgcGxheWJhY2ssXG4gKiBvbiBhIG1vYmlsZSBkZXZpY2UgYSBjbGljayBvbiB0aGUgdmlkZW8gdG9nZ2xlcyBjb250cm9scy5cbiAqICh0b2dnbGluZyBjb250cm9scyBpcyBkb25lIGJ5IHRvZ2dsaW5nIHRoZSB1c2VyIHN0YXRlIGJldHdlZW4gYWN0aXZlIGFuZFxuICogaW5hY3RpdmUpXG4gKlxuICogQSB0YXAgY2FuIHNpZ25hbCB0aGF0IGEgdXNlciBoYXMgYmVjb21lIGFjdGl2ZSwgb3IgaGFzIGJlY29tZSBpbmFjdGl2ZVxuICogZS5nLiBhIHF1aWNrIHRhcCBvbiBhbiBpUGhvbmUgbW92aWUgc2hvdWxkIHJldmVhbCB0aGUgY29udHJvbHMuIEFub3RoZXJcbiAqIHF1aWNrIHRhcCBzaG91bGQgaGlkZSB0aGVtIGFnYWluIChzaWduYWxpbmcgdGhlIHVzZXIgaXMgaW4gYW4gaW5hY3RpdmVcbiAqIHZpZXdpbmcgc3RhdGUpXG4gKlxuICogSW4gYWRkaXRpb24gdG8gdGhpcywgd2Ugc3RpbGwgd2FudCB0aGUgdXNlciB0byBiZSBjb25zaWRlcmVkIGluYWN0aXZlIGFmdGVyXG4gKiBhIGZldyBzZWNvbmRzIG9mIGluYWN0aXZpdHkuXG4gKlxuICogTm90ZTogdGhlIG9ubHkgcGFydCBvZiBpT1MgaW50ZXJhY3Rpb24gd2UgY2FuJ3QgbWltaWMgd2l0aCB0aGlzIHNldHVwXG4gKiBpcyBhIHRvdWNoIGFuZCBob2xkIG9uIHRoZSB2aWRlbyBlbGVtZW50IGNvdW50aW5nIGFzIGFjdGl2aXR5IGluIG9yZGVyIHRvXG4gKiBrZWVwIHRoZSBjb250cm9scyBzaG93aW5nLCBidXQgdGhhdCBzaG91bGRuJ3QgYmUgYW4gaXNzdWUuIEEgdG91Y2ggYW5kIGhvbGQgb25cbiAqIGFueSBjb250cm9scyB3aWxsIHN0aWxsIGtlZXAgdGhlIHVzZXIgYWN0aXZlXG4gKi9cbnZqcy5NZWRpYVRlY2hDb250cm9sbGVyLnByb3RvdHlwZS5pbml0Q29udHJvbHNMaXN0ZW5lcnMgPSBmdW5jdGlvbigpe1xuICB2YXIgcGxheWVyLCB0ZWNoLCBhY3RpdmF0ZUNvbnRyb2xzLCBkZWFjdGl2YXRlQ29udHJvbHM7XG5cbiAgdGVjaCA9IHRoaXM7XG4gIHBsYXllciA9IHRoaXMucGxheWVyKCk7XG5cbiAgdmFyIGFjdGl2YXRlQ29udHJvbHMgPSBmdW5jdGlvbigpe1xuICAgIGlmIChwbGF5ZXIuY29udHJvbHMoKSAmJiAhcGxheWVyLnVzaW5nTmF0aXZlQ29udHJvbHMoKSkge1xuICAgICAgdGVjaC5hZGRDb250cm9sc0xpc3RlbmVycygpO1xuICAgIH1cbiAgfTtcblxuICBkZWFjdGl2YXRlQ29udHJvbHMgPSB2anMuYmluZCh0ZWNoLCB0ZWNoLnJlbW92ZUNvbnRyb2xzTGlzdGVuZXJzKTtcblxuICAvLyBTZXQgdXAgZXZlbnQgbGlzdGVuZXJzIG9uY2UgdGhlIHRlY2ggaXMgcmVhZHkgYW5kIGhhcyBhbiBlbGVtZW50IHRvIGFwcGx5XG4gIC8vIGxpc3RlbmVycyB0b1xuICB0aGlzLnJlYWR5KGFjdGl2YXRlQ29udHJvbHMpO1xuICBwbGF5ZXIub24oJ2NvbnRyb2xzZW5hYmxlZCcsIGFjdGl2YXRlQ29udHJvbHMpO1xuICBwbGF5ZXIub24oJ2NvbnRyb2xzZGlzYWJsZWQnLCBkZWFjdGl2YXRlQ29udHJvbHMpO1xufTtcblxudmpzLk1lZGlhVGVjaENvbnRyb2xsZXIucHJvdG90eXBlLmFkZENvbnRyb2xzTGlzdGVuZXJzID0gZnVuY3Rpb24oKXtcbiAgdmFyIHByZXZlbnRCdWJibGUsIHVzZXJXYXNBY3RpdmU7XG5cbiAgLy8gU29tZSBicm93c2VycyAoQ2hyb21lICYgSUUpIGRvbid0IHRyaWdnZXIgYSBjbGljayBvbiBhIGZsYXNoIHN3ZiwgYnV0IGRvXG4gIC8vIHRyaWdnZXIgbW91c2Vkb3duL3VwLlxuICAvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzE0NDQ1NjIvamF2YXNjcmlwdC1vbmNsaWNrLWV2ZW50LW92ZXItZmxhc2gtb2JqZWN0XG4gIC8vIEFueSB0b3VjaCBldmVudHMgYXJlIHNldCB0byBibG9jayB0aGUgbW91c2Vkb3duIGV2ZW50IGZyb20gaGFwcGVuaW5nXG4gIHRoaXMub24oJ21vdXNlZG93bicsIHRoaXMub25DbGljayk7XG5cbiAgLy8gV2UgbmVlZCB0byBibG9jayB0b3VjaCBldmVudHMgb24gdGhlIHZpZGVvIGVsZW1lbnQgZnJvbSBidWJibGluZyB1cCxcbiAgLy8gb3RoZXJ3aXNlIHRoZXknbGwgc2lnbmFsIGFjdGl2aXR5IHByZW1hdHVyZWx5LiBUaGUgc3BlY2lmaWMgdXNlIGNhc2UgaXNcbiAgLy8gd2hlbiB0aGUgdmlkZW8gaXMgcGxheWluZyBhbmQgdGhlIGNvbnRyb2xzIGhhdmUgZmFkZWQgb3V0LiBJbiB0aGlzIGNhc2VcbiAgLy8gb25seSBhIHRhcCAoZmFzdCB0b3VjaCkgc2hvdWxkIHRvZ2dsZSB0aGUgdXNlciBhY3RpdmUgc3RhdGUgYW5kIHR1cm4gdGhlXG4gIC8vIGNvbnRyb2xzIGJhY2sgb24uIEEgdG91Y2ggYW5kIG1vdmUgb3IgdG91Y2ggYW5kIGhvbGQgc2hvdWxkIG5vdCB0cmlnZ2VyXG4gIC8vIHRoZSBjb250cm9scyAocGVyIGlPUyBhcyBhbiBleGFtcGxlIGF0IGxlYXN0KVxuICAvL1xuICAvLyBXZSBhbHdheXMgd2FudCB0byBzdG9wIHByb3BhZ2F0aW9uIG9uIHRvdWNoc3RhcnQgYmVjYXVzZSB0b3VjaHN0YXJ0XG4gIC8vIGF0IHRoZSBwbGF5ZXIgbGV2ZWwgc3RhcnRzIHRoZSB0b3VjaEluUHJvZ3Jlc3MgaW50ZXJ2YWwuIFdlIGNhbiBzdGlsbFxuICAvLyByZXBvcnQgYWN0aXZpdHkgb24gdGhlIG90aGVyIGV2ZW50cywgYnV0IHdvbid0IGxldCB0aGVtIGJ1YmJsZSBmb3JcbiAgLy8gY29uc2lzdGVuY3kuIFdlIGRvbid0IHdhbnQgdG8gYnViYmxlIGEgdG91Y2hlbmQgd2l0aG91dCBhIHRvdWNoc3RhcnQuXG4gIHRoaXMub24oJ3RvdWNoc3RhcnQnLCBmdW5jdGlvbihldmVudCkge1xuICAgIC8vIFN0b3AgdGhlIG1vdXNlIGV2ZW50cyBmcm9tIGFsc28gaGFwcGVuaW5nXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAvLyBSZWNvcmQgaWYgdGhlIHVzZXIgd2FzIGFjdGl2ZSBub3cgc28gd2UgZG9uJ3QgaGF2ZSB0byBrZWVwIHBvbGxpbmcgaXRcbiAgICB1c2VyV2FzQWN0aXZlID0gdGhpcy5wbGF5ZXJfLnVzZXJBY3RpdmUoKTtcbiAgfSk7XG5cbiAgcHJldmVudEJ1YmJsZSA9IGZ1bmN0aW9uKGV2ZW50KXtcbiAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICBpZiAodXNlcldhc0FjdGl2ZSkge1xuICAgICAgdGhpcy5wbGF5ZXJfLnJlcG9ydFVzZXJBY3Rpdml0eSgpO1xuICAgIH1cbiAgfTtcblxuICAvLyBUcmVhdCBhbGwgdG91Y2ggZXZlbnRzIHRoZSBzYW1lIGZvciBjb25zaXN0ZW5jeVxuICB0aGlzLm9uKCd0b3VjaG1vdmUnLCBwcmV2ZW50QnViYmxlKTtcbiAgdGhpcy5vbigndG91Y2hsZWF2ZScsIHByZXZlbnRCdWJibGUpO1xuICB0aGlzLm9uKCd0b3VjaGNhbmNlbCcsIHByZXZlbnRCdWJibGUpO1xuICB0aGlzLm9uKCd0b3VjaGVuZCcsIHByZXZlbnRCdWJibGUpO1xuXG4gIC8vIFR1cm4gb24gY29tcG9uZW50IHRhcCBldmVudHNcbiAgdGhpcy5lbWl0VGFwRXZlbnRzKCk7XG5cbiAgLy8gVGhlIHRhcCBsaXN0ZW5lciBuZWVkcyB0byBjb21lIGFmdGVyIHRoZSB0b3VjaGVuZCBsaXN0ZW5lciBiZWNhdXNlIHRoZSB0YXBcbiAgLy8gbGlzdGVuZXIgY2FuY2VscyBvdXQgYW55IHJlcG9ydGVkVXNlckFjdGl2aXR5IHdoZW4gc2V0dGluZyB1c2VyQWN0aXZlKGZhbHNlKVxuICB0aGlzLm9uKCd0YXAnLCB0aGlzLm9uVGFwKTtcbn07XG5cbi8qKlxuICogUmVtb3ZlIHRoZSBsaXN0ZW5lcnMgdXNlZCBmb3IgY2xpY2sgYW5kIHRhcCBjb250cm9scy4gVGhpcyBpcyBuZWVkZWQgZm9yXG4gKiB0b2dnbGluZyB0byBjb250cm9scyBkaXNhYmxlZCwgd2hlcmUgYSB0YXAvdG91Y2ggc2hvdWxkIGRvIG5vdGhpbmcuXG4gKi9cbnZqcy5NZWRpYVRlY2hDb250cm9sbGVyLnByb3RvdHlwZS5yZW1vdmVDb250cm9sc0xpc3RlbmVycyA9IGZ1bmN0aW9uKCl7XG4gIC8vIFdlIGRvbid0IHdhbnQgdG8ganVzdCB1c2UgYHRoaXMub2ZmKClgIGJlY2F1c2UgdGhlcmUgbWlnaHQgYmUgb3RoZXIgbmVlZGVkXG4gIC8vIGxpc3RlbmVycyBhZGRlZCBieSB0ZWNocyB0aGF0IGV4dGVuZCB0aGlzLlxuICB0aGlzLm9mZigndGFwJyk7XG4gIHRoaXMub2ZmKCd0b3VjaHN0YXJ0Jyk7XG4gIHRoaXMub2ZmKCd0b3VjaG1vdmUnKTtcbiAgdGhpcy5vZmYoJ3RvdWNobGVhdmUnKTtcbiAgdGhpcy5vZmYoJ3RvdWNoY2FuY2VsJyk7XG4gIHRoaXMub2ZmKCd0b3VjaGVuZCcpO1xuICB0aGlzLm9mZignY2xpY2snKTtcbiAgdGhpcy5vZmYoJ21vdXNlZG93bicpO1xufTtcblxuLyoqXG4gKiBIYW5kbGUgYSBjbGljayBvbiB0aGUgbWVkaWEgZWxlbWVudC4gQnkgZGVmYXVsdCB3aWxsIHBsYXkvcGF1c2UgdGhlIG1lZGlhLlxuICovXG52anMuTWVkaWFUZWNoQ29udHJvbGxlci5wcm90b3R5cGUub25DbGljayA9IGZ1bmN0aW9uKGV2ZW50KXtcbiAgLy8gV2UncmUgdXNpbmcgbW91c2Vkb3duIHRvIGRldGVjdCBjbGlja3MgdGhhbmtzIHRvIEZsYXNoLCBidXQgbW91c2Vkb3duXG4gIC8vIHdpbGwgYWxzbyBiZSB0cmlnZ2VyZWQgd2l0aCByaWdodC1jbGlja3MsIHNvIHdlIG5lZWQgdG8gcHJldmVudCB0aGF0XG4gIGlmIChldmVudC5idXR0b24gIT09IDApIHJldHVybjtcblxuICAvLyBXaGVuIGNvbnRyb2xzIGFyZSBkaXNhYmxlZCBhIGNsaWNrIHNob3VsZCBub3QgdG9nZ2xlIHBsYXliYWNrIGJlY2F1c2VcbiAgLy8gdGhlIGNsaWNrIGlzIGNvbnNpZGVyZWQgYSBjb250cm9sXG4gIGlmICh0aGlzLnBsYXllcigpLmNvbnRyb2xzKCkpIHtcbiAgICBpZiAodGhpcy5wbGF5ZXIoKS5wYXVzZWQoKSkge1xuICAgICAgdGhpcy5wbGF5ZXIoKS5wbGF5KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucGxheWVyKCkucGF1c2UoKTtcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogSGFuZGxlIGEgdGFwIG9uIHRoZSBtZWRpYSBlbGVtZW50LiBCeSBkZWZhdWx0IGl0IHdpbGwgdG9nZ2xlIHRoZSB1c2VyXG4gKiBhY3Rpdml0eSBzdGF0ZSwgd2hpY2ggaGlkZXMgYW5kIHNob3dzIHRoZSBjb250cm9scy5cbiAqL1xuXG52anMuTWVkaWFUZWNoQ29udHJvbGxlci5wcm90b3R5cGUub25UYXAgPSBmdW5jdGlvbigpe1xuICB0aGlzLnBsYXllcigpLnVzZXJBY3RpdmUoIXRoaXMucGxheWVyKCkudXNlckFjdGl2ZSgpKTtcbn07XG5cbnZqcy5NZWRpYVRlY2hDb250cm9sbGVyLnByb3RvdHlwZS5mZWF0dXJlcyA9IHtcbiAgJ3ZvbHVtZUNvbnRyb2wnOiB0cnVlLFxuXG4gIC8vIFJlc2l6aW5nIHBsdWdpbnMgdXNpbmcgcmVxdWVzdCBmdWxsc2NyZWVuIHJlbG9hZHMgdGhlIHBsdWdpblxuICAnZnVsbHNjcmVlblJlc2l6ZSc6IGZhbHNlLFxuXG4gIC8vIE9wdGlvbmFsIGV2ZW50cyB0aGF0IHdlIGNhbiBtYW51YWxseSBtaW1pYyB3aXRoIHRpbWVyc1xuICAvLyBjdXJyZW50bHkgbm90IHRyaWdnZXJlZCBieSB2aWRlby1qcy1zd2ZcbiAgJ3Byb2dyZXNzRXZlbnRzJzogZmFsc2UsXG4gICd0aW1ldXBkYXRlRXZlbnRzJzogZmFsc2Vcbn07XG5cbnZqcy5tZWRpYSA9IHt9O1xuXG4vKipcbiAqIExpc3Qgb2YgZGVmYXVsdCBBUEkgbWV0aG9kcyBmb3IgYW55IE1lZGlhVGVjaENvbnRyb2xsZXJcbiAqIEB0eXBlIHtTdHJpbmd9XG4gKi9cbnZqcy5tZWRpYS5BcGlNZXRob2RzID0gJ3BsYXkscGF1c2UscGF1c2VkLGN1cnJlbnRUaW1lLHNldEN1cnJlbnRUaW1lLGR1cmF0aW9uLGJ1ZmZlcmVkLHZvbHVtZSxzZXRWb2x1bWUsbXV0ZWQsc2V0TXV0ZWQsd2lkdGgsaGVpZ2h0LHN1cHBvcnRzRnVsbFNjcmVlbixlbnRlckZ1bGxTY3JlZW4sc3JjLGxvYWQsY3VycmVudFNyYyxwcmVsb2FkLHNldFByZWxvYWQsYXV0b3BsYXksc2V0QXV0b3BsYXksbG9vcCxzZXRMb29wLGVycm9yLG5ldHdvcmtTdGF0ZSxyZWFkeVN0YXRlLHNlZWtpbmcsaW5pdGlhbFRpbWUsc3RhcnRPZmZzZXRUaW1lLHBsYXllZCxzZWVrYWJsZSxlbmRlZCx2aWRlb1RyYWNrcyxhdWRpb1RyYWNrcyx2aWRlb1dpZHRoLHZpZGVvSGVpZ2h0LHRleHRUcmFja3MsZGVmYXVsdFBsYXliYWNrUmF0ZSxwbGF5YmFja1JhdGUsbWVkaWFHcm91cCxjb250cm9sbGVyLGNvbnRyb2xzLGRlZmF1bHRNdXRlZCcuc3BsaXQoJywnKTtcbi8vIENyZWF0ZSBwbGFjZWhvbGRlciBtZXRob2RzIGZvciBlYWNoIHRoYXQgd2FybiB3aGVuIGEgbWV0aG9kIGlzbid0IHN1cHBvcnRlZCBieSB0aGUgY3VycmVudCBwbGF5YmFjayB0ZWNobm9sb2d5XG5cbmZ1bmN0aW9uIGNyZWF0ZU1ldGhvZChtZXRob2ROYW1lKXtcbiAgcmV0dXJuIGZ1bmN0aW9uKCl7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgXCInK21ldGhvZE5hbWUrJ1wiIG1ldGhvZCBpcyBub3QgYXZhaWxhYmxlIG9uIHRoZSBwbGF5YmFjayB0ZWNobm9sb2d5XFwncyBBUEknKTtcbiAgfTtcbn1cblxuZm9yICh2YXIgaSA9IHZqcy5tZWRpYS5BcGlNZXRob2RzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gIHZhciBtZXRob2ROYW1lID0gdmpzLm1lZGlhLkFwaU1ldGhvZHNbaV07XG4gIHZqcy5NZWRpYVRlY2hDb250cm9sbGVyLnByb3RvdHlwZVt2anMubWVkaWEuQXBpTWV0aG9kc1tpXV0gPSBjcmVhdGVNZXRob2QobWV0aG9kTmFtZSk7XG59XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgSFRNTDUgTWVkaWEgQ29udHJvbGxlciAtIFdyYXBwZXIgZm9yIEhUTUw1IE1lZGlhIEFQSVxuICovXG5cbi8qKlxuICogSFRNTDUgTWVkaWEgQ29udHJvbGxlciAtIFdyYXBwZXIgZm9yIEhUTUw1IE1lZGlhIEFQSVxuICogQHBhcmFtIHt2anMuUGxheWVyfE9iamVjdH0gcGxheWVyXG4gKiBAcGFyYW0ge09iamVjdD19IG9wdGlvbnNcbiAqIEBwYXJhbSB7RnVuY3Rpb249fSByZWFkeVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbnZqcy5IdG1sNSA9IHZqcy5NZWRpYVRlY2hDb250cm9sbGVyLmV4dGVuZCh7XG4gIC8qKiBAY29uc3RydWN0b3IgKi9cbiAgaW5pdDogZnVuY3Rpb24ocGxheWVyLCBvcHRpb25zLCByZWFkeSl7XG4gICAgLy8gdm9sdW1lIGNhbm5vdCBiZSBjaGFuZ2VkIGZyb20gMSBvbiBpT1NcbiAgICB0aGlzLmZlYXR1cmVzWyd2b2x1bWVDb250cm9sJ10gPSB2anMuSHRtbDUuY2FuQ29udHJvbFZvbHVtZSgpO1xuXG4gICAgLy8gSW4gaU9TLCBpZiB5b3UgbW92ZSBhIHZpZGVvIGVsZW1lbnQgaW4gdGhlIERPTSwgaXQgYnJlYWtzIHZpZGVvIHBsYXliYWNrLlxuICAgIHRoaXMuZmVhdHVyZXNbJ21vdmluZ01lZGlhRWxlbWVudEluRE9NJ10gPSAhdmpzLklTX0lPUztcblxuICAgIC8vIEhUTUwgdmlkZW8gaXMgYWJsZSB0byBhdXRvbWF0aWNhbGx5IHJlc2l6ZSB3aGVuIGdvaW5nIHRvIGZ1bGxzY3JlZW5cbiAgICB0aGlzLmZlYXR1cmVzWydmdWxsc2NyZWVuUmVzaXplJ10gPSB0cnVlO1xuXG4gICAgdmpzLk1lZGlhVGVjaENvbnRyb2xsZXIuY2FsbCh0aGlzLCBwbGF5ZXIsIG9wdGlvbnMsIHJlYWR5KTtcblxuICAgIHZhciBzb3VyY2UgPSBvcHRpb25zWydzb3VyY2UnXTtcblxuICAgIC8vIElmIHRoZSBlbGVtZW50IHNvdXJjZSBpcyBhbHJlYWR5IHNldCwgd2UgbWF5IGhhdmUgbWlzc2VkIHRoZSBsb2Fkc3RhcnQgZXZlbnQsIGFuZCB3YW50IHRvIHRyaWdnZXIgaXQuXG4gICAgLy8gV2UgZG9uJ3Qgd2FudCB0byBzZXQgdGhlIHNvdXJjZSBhZ2FpbiBhbmQgaW50ZXJydXB0IHBsYXliYWNrLlxuICAgIGlmIChzb3VyY2UgJiYgdGhpcy5lbF8uY3VycmVudFNyYyA9PT0gc291cmNlLnNyYyAmJiB0aGlzLmVsXy5uZXR3b3JrU3RhdGUgPiAwKSB7XG4gICAgICBwbGF5ZXIudHJpZ2dlcignbG9hZHN0YXJ0Jyk7XG5cbiAgICAvLyBPdGhlcndpc2Ugc2V0IHRoZSBzb3VyY2UgaWYgb25lIHdhcyBwcm92aWRlZC5cbiAgICB9IGVsc2UgaWYgKHNvdXJjZSkge1xuICAgICAgdGhpcy5lbF8uc3JjID0gc291cmNlLnNyYztcbiAgICB9XG5cbiAgICAvLyBEZXRlcm1pbmUgaWYgbmF0aXZlIGNvbnRyb2xzIHNob3VsZCBiZSB1c2VkXG4gICAgLy8gT3VyIGdvYWwgc2hvdWxkIGJlIHRvIGdldCB0aGUgY3VzdG9tIGNvbnRyb2xzIG9uIG1vYmlsZSBzb2xpZCBldmVyeXdoZXJlXG4gICAgLy8gc28gd2UgY2FuIHJlbW92ZSB0aGlzIGFsbCB0b2dldGhlci4gUmlnaHQgbm93IHRoaXMgd2lsbCBibG9jayBjdXN0b21cbiAgICAvLyBjb250cm9scyBvbiB0b3VjaCBlbmFibGVkIGxhcHRvcHMgbGlrZSB0aGUgQ2hyb21lIFBpeGVsXG4gICAgaWYgKHZqcy5UT1VDSF9FTkFCTEVEICYmIHBsYXllci5vcHRpb25zKClbJ25hdGl2ZUNvbnRyb2xzRm9yVG91Y2gnXSAhPT0gZmFsc2UpIHtcbiAgICAgIHRoaXMudXNlTmF0aXZlQ29udHJvbHMoKTtcbiAgICB9XG5cbiAgICAvLyBDaHJvbWUgYW5kIFNhZmFyaSBib3RoIGhhdmUgaXNzdWVzIHdpdGggYXV0b3BsYXkuXG4gICAgLy8gSW4gU2FmYXJpICg1LjEuMSksIHdoZW4gd2UgbW92ZSB0aGUgdmlkZW8gZWxlbWVudCBpbnRvIHRoZSBjb250YWluZXIgZGl2LCBhdXRvcGxheSBkb2Vzbid0IHdvcmsuXG4gICAgLy8gSW4gQ2hyb21lICgxNSksIGlmIHlvdSBoYXZlIGF1dG9wbGF5ICsgYSBwb3N0ZXIgKyBubyBjb250cm9scywgdGhlIHZpZGVvIGdldHMgaGlkZGVuIChidXQgYXVkaW8gcGxheXMpXG4gICAgLy8gVGhpcyBmaXhlcyBib3RoIGlzc3Vlcy4gTmVlZCB0byB3YWl0IGZvciBBUEksIHNvIGl0IHVwZGF0ZXMgZGlzcGxheXMgY29ycmVjdGx5XG4gICAgcGxheWVyLnJlYWR5KGZ1bmN0aW9uKCl7XG4gICAgICBpZiAodGhpcy50YWcgJiYgdGhpcy5vcHRpb25zX1snYXV0b3BsYXknXSAmJiB0aGlzLnBhdXNlZCgpKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLnRhZ1sncG9zdGVyJ107IC8vIENocm9tZSBGaXguIEZpeGVkIGluIENocm9tZSB2MTYuXG4gICAgICAgIHRoaXMucGxheSgpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5zZXR1cFRyaWdnZXJzKCk7XG4gICAgdGhpcy50cmlnZ2VyUmVhZHkoKTtcbiAgfVxufSk7XG5cbnZqcy5IdG1sNS5wcm90b3R5cGUuZGlzcG9zZSA9IGZ1bmN0aW9uKCl7XG4gIHZqcy5NZWRpYVRlY2hDb250cm9sbGVyLnByb3RvdHlwZS5kaXNwb3NlLmNhbGwodGhpcyk7XG59O1xuXG52anMuSHRtbDUucHJvdG90eXBlLmNyZWF0ZUVsID0gZnVuY3Rpb24oKXtcbiAgdmFyIHBsYXllciA9IHRoaXMucGxheWVyXyxcbiAgICAgIC8vIElmIHBvc3NpYmxlLCByZXVzZSBvcmlnaW5hbCB0YWcgZm9yIEhUTUw1IHBsYXliYWNrIHRlY2hub2xvZ3kgZWxlbWVudFxuICAgICAgZWwgPSBwbGF5ZXIudGFnLFxuICAgICAgbmV3RWwsXG4gICAgICBjbG9uZTtcblxuICAvLyBDaGVjayBpZiB0aGlzIGJyb3dzZXIgc3VwcG9ydHMgbW92aW5nIHRoZSBlbGVtZW50IGludG8gdGhlIGJveC5cbiAgLy8gT24gdGhlIGlQaG9uZSB2aWRlbyB3aWxsIGJyZWFrIGlmIHlvdSBtb3ZlIHRoZSBlbGVtZW50LFxuICAvLyBTbyB3ZSBoYXZlIHRvIGNyZWF0ZSBhIGJyYW5kIG5ldyBlbGVtZW50LlxuICBpZiAoIWVsIHx8IHRoaXMuZmVhdHVyZXNbJ21vdmluZ01lZGlhRWxlbWVudEluRE9NJ10gPT09IGZhbHNlKSB7XG5cbiAgICAvLyBJZiB0aGUgb3JpZ2luYWwgdGFnIGlzIHN0aWxsIHRoZXJlLCBjbG9uZSBhbmQgcmVtb3ZlIGl0LlxuICAgIGlmIChlbCkge1xuICAgICAgY2xvbmUgPSBlbC5jbG9uZU5vZGUoZmFsc2UpO1xuICAgICAgdmpzLkh0bWw1LmRpc3Bvc2VNZWRpYUVsZW1lbnQoZWwpO1xuICAgICAgZWwgPSBjbG9uZTtcbiAgICAgIHBsYXllci50YWcgPSBudWxsO1xuICAgIH0gZWxzZSB7XG4gICAgICBlbCA9IHZqcy5jcmVhdGVFbCgndmlkZW8nLCB7XG4gICAgICAgIGlkOnBsYXllci5pZCgpICsgJ19odG1sNV9hcGknLFxuICAgICAgICBjbGFzc05hbWU6J3Zqcy10ZWNoJ1xuICAgICAgfSk7XG4gICAgfVxuICAgIC8vIGFzc29jaWF0ZSB0aGUgcGxheWVyIHdpdGggdGhlIG5ldyB0YWdcbiAgICBlbFsncGxheWVyJ10gPSBwbGF5ZXI7XG5cbiAgICB2anMuaW5zZXJ0Rmlyc3QoZWwsIHBsYXllci5lbCgpKTtcbiAgfVxuXG4gIC8vIFVwZGF0ZSBzcGVjaWZpYyB0YWcgc2V0dGluZ3MsIGluIGNhc2UgdGhleSB3ZXJlIG92ZXJyaWRkZW5cbiAgdmFyIGF0dHJzID0gWydhdXRvcGxheScsJ3ByZWxvYWQnLCdsb29wJywnbXV0ZWQnXTtcbiAgZm9yICh2YXIgaSA9IGF0dHJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgdmFyIGF0dHIgPSBhdHRyc1tpXTtcbiAgICBpZiAocGxheWVyLm9wdGlvbnNfW2F0dHJdICE9PSBudWxsKSB7XG4gICAgICBlbFthdHRyXSA9IHBsYXllci5vcHRpb25zX1thdHRyXTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZWw7XG4gIC8vIGplbm5paXNhd2Vzb21lID0gdHJ1ZTtcbn07XG5cbi8vIE1ha2UgdmlkZW8gZXZlbnRzIHRyaWdnZXIgcGxheWVyIGV2ZW50c1xuLy8gTWF5IHNlZW0gdmVyYm9zZSBoZXJlLCBidXQgbWFrZXMgb3RoZXIgQVBJcyBwb3NzaWJsZS5cbnZqcy5IdG1sNS5wcm90b3R5cGUuc2V0dXBUcmlnZ2VycyA9IGZ1bmN0aW9uKCl7XG4gIGZvciAodmFyIGkgPSB2anMuSHRtbDUuRXZlbnRzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgdmpzLm9uKHRoaXMuZWxfLCB2anMuSHRtbDUuRXZlbnRzW2ldLCB2anMuYmluZCh0aGlzLnBsYXllcl8sIHRoaXMuZXZlbnRIYW5kbGVyKSk7XG4gIH1cbn07XG4vLyBUcmlnZ2VycyByZW1vdmVkIHVzaW5nIHRoaXMub2ZmIHdoZW4gZGlzcG9zZWRcblxudmpzLkh0bWw1LnByb3RvdHlwZS5ldmVudEhhbmRsZXIgPSBmdW5jdGlvbihlKXtcbiAgdGhpcy50cmlnZ2VyKGUpO1xuXG4gIC8vIE5vIG5lZWQgZm9yIG1lZGlhIGV2ZW50cyB0byBidWJibGUgdXAuXG4gIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG59O1xuXG52anMuSHRtbDUucHJvdG90eXBlLnVzZU5hdGl2ZUNvbnRyb2xzID0gZnVuY3Rpb24oKXtcbiAgdmFyIHRlY2gsIHBsYXllciwgY29udHJvbHNPbiwgY29udHJvbHNPZmYsIGNsZWFuVXA7XG5cbiAgdGVjaCA9IHRoaXM7XG4gIHBsYXllciA9IHRoaXMucGxheWVyKCk7XG5cbiAgLy8gSWYgdGhlIHBsYXllciBjb250cm9scyBhcmUgZW5hYmxlZCB0dXJuIG9uIHRoZSBuYXRpdmUgY29udHJvbHNcbiAgdGVjaC5zZXRDb250cm9scyhwbGF5ZXIuY29udHJvbHMoKSk7XG5cbiAgLy8gVXBkYXRlIHRoZSBuYXRpdmUgY29udHJvbHMgd2hlbiBwbGF5ZXIgY29udHJvbHMgc3RhdGUgaXMgdXBkYXRlZFxuICBjb250cm9sc09uID0gZnVuY3Rpb24oKXtcbiAgICB0ZWNoLnNldENvbnRyb2xzKHRydWUpO1xuICB9O1xuICBjb250cm9sc09mZiA9IGZ1bmN0aW9uKCl7XG4gICAgdGVjaC5zZXRDb250cm9scyhmYWxzZSk7XG4gIH07XG4gIHBsYXllci5vbignY29udHJvbHNlbmFibGVkJywgY29udHJvbHNPbik7XG4gIHBsYXllci5vbignY29udHJvbHNkaXNhYmxlZCcsIGNvbnRyb2xzT2ZmKTtcblxuICAvLyBDbGVhbiB1cCB3aGVuIG5vdCB1c2luZyBuYXRpdmUgY29udHJvbHMgYW55bW9yZVxuICBjbGVhblVwID0gZnVuY3Rpb24oKXtcbiAgICBwbGF5ZXIub2ZmKCdjb250cm9sc2VuYWJsZWQnLCBjb250cm9sc09uKTtcbiAgICBwbGF5ZXIub2ZmKCdjb250cm9sc2Rpc2FibGVkJywgY29udHJvbHNPZmYpO1xuICB9O1xuICB0ZWNoLm9uKCdkaXNwb3NlJywgY2xlYW5VcCk7XG4gIHBsYXllci5vbigndXNpbmdjdXN0b21jb250cm9scycsIGNsZWFuVXApO1xuXG4gIC8vIFVwZGF0ZSB0aGUgc3RhdGUgb2YgdGhlIHBsYXllciB0byB1c2luZyBuYXRpdmUgY29udHJvbHNcbiAgcGxheWVyLnVzaW5nTmF0aXZlQ29udHJvbHModHJ1ZSk7XG59O1xuXG5cbnZqcy5IdG1sNS5wcm90b3R5cGUucGxheSA9IGZ1bmN0aW9uKCl7IHRoaXMuZWxfLnBsYXkoKTsgfTtcbnZqcy5IdG1sNS5wcm90b3R5cGUucGF1c2UgPSBmdW5jdGlvbigpeyB0aGlzLmVsXy5wYXVzZSgpOyB9O1xudmpzLkh0bWw1LnByb3RvdHlwZS5wYXVzZWQgPSBmdW5jdGlvbigpeyByZXR1cm4gdGhpcy5lbF8ucGF1c2VkOyB9O1xuXG52anMuSHRtbDUucHJvdG90eXBlLmN1cnJlbnRUaW1lID0gZnVuY3Rpb24oKXsgcmV0dXJuIHRoaXMuZWxfLmN1cnJlbnRUaW1lOyB9O1xudmpzLkh0bWw1LnByb3RvdHlwZS5zZXRDdXJyZW50VGltZSA9IGZ1bmN0aW9uKHNlY29uZHMpe1xuICB0cnkge1xuICAgIHRoaXMuZWxfLmN1cnJlbnRUaW1lID0gc2Vjb25kcztcbiAgfSBjYXRjaChlKSB7XG4gICAgdmpzLmxvZyhlLCAnVmlkZW8gaXMgbm90IHJlYWR5LiAoVmlkZW8uanMpJyk7XG4gICAgLy8gdGhpcy53YXJuaW5nKFZpZGVvSlMud2FybmluZ3MudmlkZW9Ob3RSZWFkeSk7XG4gIH1cbn07XG5cbnZqcy5IdG1sNS5wcm90b3R5cGUuZHVyYXRpb24gPSBmdW5jdGlvbigpeyByZXR1cm4gdGhpcy5lbF8uZHVyYXRpb24gfHwgMDsgfTtcbnZqcy5IdG1sNS5wcm90b3R5cGUuYnVmZmVyZWQgPSBmdW5jdGlvbigpeyByZXR1cm4gdGhpcy5lbF8uYnVmZmVyZWQ7IH07XG5cbnZqcy5IdG1sNS5wcm90b3R5cGUudm9sdW1lID0gZnVuY3Rpb24oKXsgcmV0dXJuIHRoaXMuZWxfLnZvbHVtZTsgfTtcbnZqcy5IdG1sNS5wcm90b3R5cGUuc2V0Vm9sdW1lID0gZnVuY3Rpb24ocGVyY2VudEFzRGVjaW1hbCl7IHRoaXMuZWxfLnZvbHVtZSA9IHBlcmNlbnRBc0RlY2ltYWw7IH07XG52anMuSHRtbDUucHJvdG90eXBlLm11dGVkID0gZnVuY3Rpb24oKXsgcmV0dXJuIHRoaXMuZWxfLm11dGVkOyB9O1xudmpzLkh0bWw1LnByb3RvdHlwZS5zZXRNdXRlZCA9IGZ1bmN0aW9uKG11dGVkKXsgdGhpcy5lbF8ubXV0ZWQgPSBtdXRlZDsgfTtcblxudmpzLkh0bWw1LnByb3RvdHlwZS53aWR0aCA9IGZ1bmN0aW9uKCl7IHJldHVybiB0aGlzLmVsXy5vZmZzZXRXaWR0aDsgfTtcbnZqcy5IdG1sNS5wcm90b3R5cGUuaGVpZ2h0ID0gZnVuY3Rpb24oKXsgcmV0dXJuIHRoaXMuZWxfLm9mZnNldEhlaWdodDsgfTtcblxudmpzLkh0bWw1LnByb3RvdHlwZS5zdXBwb3J0c0Z1bGxTY3JlZW4gPSBmdW5jdGlvbigpe1xuICBpZiAodHlwZW9mIHRoaXMuZWxfLndlYmtpdEVudGVyRnVsbFNjcmVlbiA9PSAnZnVuY3Rpb24nKSB7XG5cbiAgICAvLyBTZWVtcyB0byBiZSBicm9rZW4gaW4gQ2hyb21pdW0vQ2hyb21lICYmIFNhZmFyaSBpbiBMZW9wYXJkXG4gICAgaWYgKC9BbmRyb2lkLy50ZXN0KHZqcy5VU0VSX0FHRU5UKSB8fCAhL0Nocm9tZXxNYWMgT1MgWCAxMC41Ly50ZXN0KHZqcy5VU0VSX0FHRU5UKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn07XG5cbnZqcy5IdG1sNS5wcm90b3R5cGUuZW50ZXJGdWxsU2NyZWVuID0gZnVuY3Rpb24oKXtcbiAgdmFyIHZpZGVvID0gdGhpcy5lbF87XG4gIGlmICh2aWRlby5wYXVzZWQgJiYgdmlkZW8ubmV0d29ya1N0YXRlIDw9IHZpZGVvLkhBVkVfTUVUQURBVEEpIHtcbiAgICAvLyBhdHRlbXB0IHRvIHByaW1lIHRoZSB2aWRlbyBlbGVtZW50IGZvciBwcm9ncmFtbWF0aWMgYWNjZXNzXG4gICAgLy8gdGhpcyBpc24ndCBuZWNlc3Nhcnkgb24gdGhlIGRlc2t0b3AgYnV0IHNob3VsZG4ndCBodXJ0XG4gICAgdGhpcy5lbF8ucGxheSgpO1xuXG4gICAgLy8gcGxheWluZyBhbmQgcGF1c2luZyBzeW5jaHJvbm91c2x5IGR1cmluZyB0aGUgdHJhbnNpdGlvbiB0byBmdWxsc2NyZWVuXG4gICAgLy8gY2FuIGdldCBpT1MgfjYuMSBkZXZpY2VzIGludG8gYSBwbGF5L3BhdXNlIGxvb3BcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICB2aWRlby5wYXVzZSgpO1xuICAgICAgdmlkZW8ud2Via2l0RW50ZXJGdWxsU2NyZWVuKCk7XG4gICAgfSwgMCk7XG4gIH0gZWxzZSB7XG4gICAgdmlkZW8ud2Via2l0RW50ZXJGdWxsU2NyZWVuKCk7XG4gIH1cbn07XG52anMuSHRtbDUucHJvdG90eXBlLmV4aXRGdWxsU2NyZWVuID0gZnVuY3Rpb24oKXtcbiAgdGhpcy5lbF8ud2Via2l0RXhpdEZ1bGxTY3JlZW4oKTtcbn07XG52anMuSHRtbDUucHJvdG90eXBlLnNyYyA9IGZ1bmN0aW9uKHNyYyl7IHRoaXMuZWxfLnNyYyA9IHNyYzsgfTtcbnZqcy5IdG1sNS5wcm90b3R5cGUubG9hZCA9IGZ1bmN0aW9uKCl7IHRoaXMuZWxfLmxvYWQoKTsgfTtcbnZqcy5IdG1sNS5wcm90b3R5cGUuY3VycmVudFNyYyA9IGZ1bmN0aW9uKCl7IHJldHVybiB0aGlzLmVsXy5jdXJyZW50U3JjOyB9O1xuXG52anMuSHRtbDUucHJvdG90eXBlLnByZWxvYWQgPSBmdW5jdGlvbigpeyByZXR1cm4gdGhpcy5lbF8ucHJlbG9hZDsgfTtcbnZqcy5IdG1sNS5wcm90b3R5cGUuc2V0UHJlbG9hZCA9IGZ1bmN0aW9uKHZhbCl7IHRoaXMuZWxfLnByZWxvYWQgPSB2YWw7IH07XG5cbnZqcy5IdG1sNS5wcm90b3R5cGUuYXV0b3BsYXkgPSBmdW5jdGlvbigpeyByZXR1cm4gdGhpcy5lbF8uYXV0b3BsYXk7IH07XG52anMuSHRtbDUucHJvdG90eXBlLnNldEF1dG9wbGF5ID0gZnVuY3Rpb24odmFsKXsgdGhpcy5lbF8uYXV0b3BsYXkgPSB2YWw7IH07XG5cbnZqcy5IdG1sNS5wcm90b3R5cGUuY29udHJvbHMgPSBmdW5jdGlvbigpeyByZXR1cm4gdGhpcy5lbF8uY29udHJvbHM7IH1cbnZqcy5IdG1sNS5wcm90b3R5cGUuc2V0Q29udHJvbHMgPSBmdW5jdGlvbih2YWwpeyB0aGlzLmVsXy5jb250cm9scyA9ICEhdmFsOyB9XG5cbnZqcy5IdG1sNS5wcm90b3R5cGUubG9vcCA9IGZ1bmN0aW9uKCl7IHJldHVybiB0aGlzLmVsXy5sb29wOyB9O1xudmpzLkh0bWw1LnByb3RvdHlwZS5zZXRMb29wID0gZnVuY3Rpb24odmFsKXsgdGhpcy5lbF8ubG9vcCA9IHZhbDsgfTtcblxudmpzLkh0bWw1LnByb3RvdHlwZS5lcnJvciA9IGZ1bmN0aW9uKCl7IHJldHVybiB0aGlzLmVsXy5lcnJvcjsgfTtcbnZqcy5IdG1sNS5wcm90b3R5cGUuc2Vla2luZyA9IGZ1bmN0aW9uKCl7IHJldHVybiB0aGlzLmVsXy5zZWVraW5nOyB9O1xudmpzLkh0bWw1LnByb3RvdHlwZS5lbmRlZCA9IGZ1bmN0aW9uKCl7IHJldHVybiB0aGlzLmVsXy5lbmRlZDsgfTtcbnZqcy5IdG1sNS5wcm90b3R5cGUuZGVmYXVsdE11dGVkID0gZnVuY3Rpb24oKXsgcmV0dXJuIHRoaXMuZWxfLmRlZmF1bHRNdXRlZDsgfTtcblxuLyogSFRNTDUgU3VwcG9ydCBUZXN0aW5nIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxudmpzLkh0bWw1LmlzU3VwcG9ydGVkID0gZnVuY3Rpb24oKXtcbiAgcmV0dXJuICEhdmpzLlRFU1RfVklELmNhblBsYXlUeXBlO1xufTtcblxudmpzLkh0bWw1LmNhblBsYXlTb3VyY2UgPSBmdW5jdGlvbihzcmNPYmope1xuICAvLyBJRTkgb24gV2luZG93cyA3IHdpdGhvdXQgTWVkaWFQbGF5ZXIgdGhyb3dzIGFuIGVycm9yIGhlcmVcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3ZpZGVvanMvdmlkZW8uanMvaXNzdWVzLzUxOVxuICB0cnkge1xuICAgIHJldHVybiAhIXZqcy5URVNUX1ZJRC5jYW5QbGF5VHlwZShzcmNPYmoudHlwZSk7XG4gIH0gY2F0Y2goZSkge1xuICAgIHJldHVybiAnJztcbiAgfVxuICAvLyBUT0RPOiBDaGVjayBUeXBlXG4gIC8vIElmIG5vIFR5cGUsIGNoZWNrIGV4dFxuICAvLyBDaGVjayBNZWRpYSBUeXBlXG59O1xuXG52anMuSHRtbDUuY2FuQ29udHJvbFZvbHVtZSA9IGZ1bmN0aW9uKCl7XG4gIHZhciB2b2x1bWUgPSAgdmpzLlRFU1RfVklELnZvbHVtZTtcbiAgdmpzLlRFU1RfVklELnZvbHVtZSA9ICh2b2x1bWUgLyAyKSArIDAuMTtcbiAgcmV0dXJuIHZvbHVtZSAhPT0gdmpzLlRFU1RfVklELnZvbHVtZTtcbn07XG5cbi8vIExpc3Qgb2YgYWxsIEhUTUw1IGV2ZW50cyAodmFyaW91cyB1c2VzKS5cbnZqcy5IdG1sNS5FdmVudHMgPSAnbG9hZHN0YXJ0LHN1c3BlbmQsYWJvcnQsZXJyb3IsZW1wdGllZCxzdGFsbGVkLGxvYWRlZG1ldGFkYXRhLGxvYWRlZGRhdGEsY2FucGxheSxjYW5wbGF5dGhyb3VnaCxwbGF5aW5nLHdhaXRpbmcsc2Vla2luZyxzZWVrZWQsZW5kZWQsZHVyYXRpb25jaGFuZ2UsdGltZXVwZGF0ZSxwcm9ncmVzcyxwbGF5LHBhdXNlLHJhdGVjaGFuZ2Usdm9sdW1lY2hhbmdlJy5zcGxpdCgnLCcpO1xuXG52anMuSHRtbDUuZGlzcG9zZU1lZGlhRWxlbWVudCA9IGZ1bmN0aW9uKGVsKXtcbiAgaWYgKCFlbCkgeyByZXR1cm47IH1cblxuICBlbFsncGxheWVyJ10gPSBudWxsO1xuXG4gIGlmIChlbC5wYXJlbnROb2RlKSB7XG4gICAgZWwucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChlbCk7XG4gIH1cblxuICAvLyByZW1vdmUgYW55IGNoaWxkIHRyYWNrIG9yIHNvdXJjZSBub2RlcyB0byBwcmV2ZW50IHRoZWlyIGxvYWRpbmdcbiAgd2hpbGUoZWwuaGFzQ2hpbGROb2RlcygpKSB7XG4gICAgZWwucmVtb3ZlQ2hpbGQoZWwuZmlyc3RDaGlsZCk7XG4gIH1cblxuICAvLyByZW1vdmUgYW55IHNyYyByZWZlcmVuY2UuIG5vdCBzZXR0aW5nIGBzcmM9JydgIGJlY2F1c2UgdGhhdCBjYXVzZXMgYSB3YXJuaW5nXG4gIC8vIGluIGZpcmVmb3hcbiAgZWwucmVtb3ZlQXR0cmlidXRlKCdzcmMnKTtcblxuICAvLyBmb3JjZSB0aGUgbWVkaWEgZWxlbWVudCB0byB1cGRhdGUgaXRzIGxvYWRpbmcgc3RhdGUgYnkgY2FsbGluZyBsb2FkKClcbiAgaWYgKHR5cGVvZiBlbC5sb2FkID09PSAnZnVuY3Rpb24nKSB7XG4gICAgZWwubG9hZCgpO1xuICB9XG59O1xuXG4vLyBIVE1MNSBGZWF0dXJlIGRldGVjdGlvbiBhbmQgRGV2aWNlIEZpeGVzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4gIC8vIE92ZXJyaWRlIEFuZHJvaWQgMi4yIGFuZCBsZXNzIGNhblBsYXlUeXBlIG1ldGhvZCB3aGljaCBpcyBicm9rZW5cbmlmICh2anMuSVNfT0xEX0FORFJPSUQpIHtcbiAgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndmlkZW8nKS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUuY2FuUGxheVR5cGUgPSBmdW5jdGlvbih0eXBlKXtcbiAgICByZXR1cm4gKHR5cGUgJiYgdHlwZS50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ3ZpZGVvL21wNCcpICE9IC0xKSA/ICdtYXliZScgOiAnJztcbiAgfTtcbn1cbi8qKlxuICogQGZpbGVvdmVydmlldyBWaWRlb0pTLVNXRiAtIEN1c3RvbSBGbGFzaCBQbGF5ZXIgd2l0aCBIVE1MNS1pc2ggQVBJXG4gKiBodHRwczovL2dpdGh1Yi5jb20vemVuY29kZXIvdmlkZW8tanMtc3dmXG4gKiBOb3QgdXNpbmcgc2V0dXBUcmlnZ2Vycy4gVXNpbmcgZ2xvYmFsIG9uRXZlbnQgZnVuYyB0byBkaXN0cmlidXRlIGV2ZW50c1xuICovXG5cbi8qKlxuICogRmxhc2ggTWVkaWEgQ29udHJvbGxlciAtIFdyYXBwZXIgZm9yIGZhbGxiYWNrIFNXRiBBUElcbiAqXG4gKiBAcGFyYW0ge3Zqcy5QbGF5ZXJ9IHBsYXllclxuICogQHBhcmFtIHtPYmplY3Q9fSBvcHRpb25zXG4gKiBAcGFyYW0ge0Z1bmN0aW9uPX0gcmVhZHlcbiAqIEBjb25zdHJ1Y3RvclxuICovXG52anMuRmxhc2ggPSB2anMuTWVkaWFUZWNoQ29udHJvbGxlci5leHRlbmQoe1xuICAvKiogQGNvbnN0cnVjdG9yICovXG4gIGluaXQ6IGZ1bmN0aW9uKHBsYXllciwgb3B0aW9ucywgcmVhZHkpe1xuICAgIHZqcy5NZWRpYVRlY2hDb250cm9sbGVyLmNhbGwodGhpcywgcGxheWVyLCBvcHRpb25zLCByZWFkeSk7XG5cbiAgICB2YXIgc291cmNlID0gb3B0aW9uc1snc291cmNlJ10sXG5cbiAgICAgICAgLy8gV2hpY2ggZWxlbWVudCB0byBlbWJlZCBpblxuICAgICAgICBwYXJlbnRFbCA9IG9wdGlvbnNbJ3BhcmVudEVsJ10sXG5cbiAgICAgICAgLy8gQ3JlYXRlIGEgdGVtcG9yYXJ5IGVsZW1lbnQgdG8gYmUgcmVwbGFjZWQgYnkgc3dmIG9iamVjdFxuICAgICAgICBwbGFjZUhvbGRlciA9IHRoaXMuZWxfID0gdmpzLmNyZWF0ZUVsKCdkaXYnLCB7IGlkOiBwbGF5ZXIuaWQoKSArICdfdGVtcF9mbGFzaCcgfSksXG5cbiAgICAgICAgLy8gR2VuZXJhdGUgSUQgZm9yIHN3ZiBvYmplY3RcbiAgICAgICAgb2JqSWQgPSBwbGF5ZXIuaWQoKSsnX2ZsYXNoX2FwaScsXG5cbiAgICAgICAgLy8gU3RvcmUgcGxheWVyIG9wdGlvbnMgaW4gbG9jYWwgdmFyIGZvciBvcHRpbWl6YXRpb25cbiAgICAgICAgLy8gVE9ETzogc3dpdGNoIHRvIHVzaW5nIHBsYXllciBtZXRob2RzIGluc3RlYWQgb2Ygb3B0aW9uc1xuICAgICAgICAvLyBlLmcuIHBsYXllci5hdXRvcGxheSgpO1xuICAgICAgICBwbGF5ZXJPcHRpb25zID0gcGxheWVyLm9wdGlvbnNfLFxuXG4gICAgICAgIC8vIE1lcmdlIGRlZmF1bHQgZmxhc2h2YXJzIHdpdGggb25lcyBwYXNzZWQgaW4gdG8gaW5pdFxuICAgICAgICBmbGFzaFZhcnMgPSB2anMub2JqLm1lcmdlKHtcblxuICAgICAgICAgIC8vIFNXRiBDYWxsYmFjayBGdW5jdGlvbnNcbiAgICAgICAgICAncmVhZHlGdW5jdGlvbic6ICd2aWRlb2pzLkZsYXNoLm9uUmVhZHknLFxuICAgICAgICAgICdldmVudFByb3h5RnVuY3Rpb24nOiAndmlkZW9qcy5GbGFzaC5vbkV2ZW50JyxcbiAgICAgICAgICAnZXJyb3JFdmVudFByb3h5RnVuY3Rpb24nOiAndmlkZW9qcy5GbGFzaC5vbkVycm9yJyxcblxuICAgICAgICAgIC8vIFBsYXllciBTZXR0aW5nc1xuICAgICAgICAgICdhdXRvcGxheSc6IHBsYXllck9wdGlvbnMuYXV0b3BsYXksXG4gICAgICAgICAgJ3ByZWxvYWQnOiBwbGF5ZXJPcHRpb25zLnByZWxvYWQsXG4gICAgICAgICAgJ2xvb3AnOiBwbGF5ZXJPcHRpb25zLmxvb3AsXG4gICAgICAgICAgJ211dGVkJzogcGxheWVyT3B0aW9ucy5tdXRlZFxuXG4gICAgICAgIH0sIG9wdGlvbnNbJ2ZsYXNoVmFycyddKSxcblxuICAgICAgICAvLyBNZXJnZSBkZWZhdWx0IHBhcmFtZXMgd2l0aCBvbmVzIHBhc3NlZCBpblxuICAgICAgICBwYXJhbXMgPSB2anMub2JqLm1lcmdlKHtcbiAgICAgICAgICAnd21vZGUnOiAnb3BhcXVlJywgLy8gT3BhcXVlIGlzIG5lZWRlZCB0byBvdmVybGF5IGNvbnRyb2xzLCBidXQgY2FuIGFmZmVjdCBwbGF5YmFjayBwZXJmb3JtYW5jZVxuICAgICAgICAgICdiZ2NvbG9yJzogJyMwMDAwMDAnIC8vIFVzaW5nIGJnY29sb3IgcHJldmVudHMgYSB3aGl0ZSBmbGFzaCB3aGVuIHRoZSBvYmplY3QgaXMgbG9hZGluZ1xuICAgICAgICB9LCBvcHRpb25zWydwYXJhbXMnXSksXG5cbiAgICAgICAgLy8gTWVyZ2UgZGVmYXVsdCBhdHRyaWJ1dGVzIHdpdGggb25lcyBwYXNzZWQgaW5cbiAgICAgICAgYXR0cmlidXRlcyA9IHZqcy5vYmoubWVyZ2Uoe1xuICAgICAgICAgICdpZCc6IG9iaklkLFxuICAgICAgICAgICduYW1lJzogb2JqSWQsIC8vIEJvdGggSUQgYW5kIE5hbWUgbmVlZGVkIG9yIHN3ZiB0byBpZGVudGlmdHkgaXRzZWxmXG4gICAgICAgICAgJ2NsYXNzJzogJ3Zqcy10ZWNoJ1xuICAgICAgICB9LCBvcHRpb25zWydhdHRyaWJ1dGVzJ10pXG4gICAgO1xuXG4gICAgLy8gSWYgc291cmNlIHdhcyBzdXBwbGllZCBwYXNzIGFzIGEgZmxhc2ggdmFyLlxuICAgIGlmIChzb3VyY2UpIHtcbiAgICAgIGlmIChzb3VyY2UudHlwZSAmJiB2anMuRmxhc2guaXNTdHJlYW1pbmdUeXBlKHNvdXJjZS50eXBlKSkge1xuICAgICAgICB2YXIgcGFydHMgPSB2anMuRmxhc2guc3RyZWFtVG9QYXJ0cyhzb3VyY2Uuc3JjKTtcbiAgICAgICAgZmxhc2hWYXJzWydydG1wQ29ubmVjdGlvbiddID0gZW5jb2RlVVJJQ29tcG9uZW50KHBhcnRzLmNvbm5lY3Rpb24pO1xuICAgICAgICBmbGFzaFZhcnNbJ3J0bXBTdHJlYW0nXSA9IGVuY29kZVVSSUNvbXBvbmVudChwYXJ0cy5zdHJlYW0pO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGZsYXNoVmFyc1snc3JjJ10gPSBlbmNvZGVVUklDb21wb25lbnQodmpzLmdldEFic29sdXRlVVJMKHNvdXJjZS5zcmMpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBBZGQgcGxhY2Vob2xkZXIgdG8gcGxheWVyIGRpdlxuICAgIHZqcy5pbnNlcnRGaXJzdChwbGFjZUhvbGRlciwgcGFyZW50RWwpO1xuXG4gICAgLy8gSGF2aW5nIGlzc3VlcyB3aXRoIEZsYXNoIHJlbG9hZGluZyBvbiBjZXJ0YWluIHBhZ2UgYWN0aW9ucyAoaGlkZS9yZXNpemUvZnVsbHNjcmVlbikgaW4gY2VydGFpbiBicm93c2Vyc1xuICAgIC8vIFRoaXMgYWxsb3dzIHJlc2V0dGluZyB0aGUgcGxheWhlYWQgd2hlbiB3ZSBjYXRjaCB0aGUgcmVsb2FkXG4gICAgaWYgKG9wdGlvbnNbJ3N0YXJ0VGltZSddKSB7XG4gICAgICB0aGlzLnJlYWR5KGZ1bmN0aW9uKCl7XG4gICAgICAgIHRoaXMubG9hZCgpO1xuICAgICAgICB0aGlzLnBsYXkoKTtcbiAgICAgICAgdGhpcy5jdXJyZW50VGltZShvcHRpb25zWydzdGFydFRpbWUnXSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBGbGFzaCBpRnJhbWUgTW9kZVxuICAgIC8vIEluIHdlYiBicm93c2VycyB0aGVyZSBhcmUgbXVsdGlwbGUgaW5zdGFuY2VzIHdoZXJlIGNoYW5naW5nIHRoZSBwYXJlbnQgZWxlbWVudCBvciB2aXNpYmlsaXR5IG9mIGEgcGx1Z2luIGNhdXNlcyB0aGUgcGx1Z2luIHRvIHJlbG9hZC5cbiAgICAvLyAtIEZpcmVmb3gganVzdCBhYm91dCBhbHdheXMuIGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTkwMjY4IChtaWdodCBiZSBmaXhlZCBieSB2ZXJzaW9uIDEzKVxuICAgIC8vIC0gV2Via2l0IHdoZW4gaGlkaW5nIHRoZSBwbHVnaW5cbiAgICAvLyAtIFdlYmtpdCBhbmQgRmlyZWZveCB3aGVuIHVzaW5nIHJlcXVlc3RGdWxsU2NyZWVuIG9uIGEgcGFyZW50IGVsZW1lbnRcbiAgICAvLyBMb2FkaW5nIHRoZSBmbGFzaCBwbHVnaW4gaW50byBhIGR5bmFtaWNhbGx5IGdlbmVyYXRlZCBpRnJhbWUgZ2V0cyBhcm91bmQgbW9zdCBvZiB0aGVzZSBpc3N1ZXMuXG4gICAgLy8gSXNzdWVzIHRoYXQgcmVtYWluIGluY2x1ZGUgaGlkaW5nIHRoZSBlbGVtZW50IGFuZCByZXF1ZXN0RnVsbFNjcmVlbiBpbiBGaXJlZm94IHNwZWNpZmljYWxseVxuXG4gICAgLy8gVGhlcmUncyBvbiBwYXJ0aWN1bGFybHkgYW5ub3lpbmcgaXNzdWUgd2l0aCB0aGlzIG1ldGhvZCB3aGljaCBpcyB0aGF0IEZpcmVmb3ggdGhyb3dzIGEgc2VjdXJpdHkgZXJyb3Igb24gYW4gb2Zmc2l0ZSBGbGFzaCBvYmplY3QgbG9hZGVkIGludG8gYSBkeW5hbWljYWxseSBjcmVhdGVkIGlGcmFtZS5cbiAgICAvLyBFdmVuIHRob3VnaCB0aGUgaWZyYW1lIHdhcyBpbnNlcnRlZCBpbnRvIGEgcGFnZSBvbiB0aGUgd2ViLCBGaXJlZm94ICsgRmxhc2ggY29uc2lkZXJzIGl0IGEgbG9jYWwgYXBwIHRyeWluZyB0byBhY2Nlc3MgYW4gaW50ZXJuZXQgZmlsZS5cbiAgICAvLyBJIHRyaWVkIG11bGl0cGxlIHdheXMgb2Ygc2V0dGluZyB0aGUgaWZyYW1lIHNyYyBhdHRyaWJ1dGUgYnV0IGNvdWxkbid0IGZpbmQgYSBzcmMgdGhhdCB3b3JrZWQgd2VsbC4gVHJpZWQgYSByZWFsL2Zha2Ugc291cmNlLCBpbi9vdXQgb2YgZG9tYWluLlxuICAgIC8vIEFsc28gdHJpZWQgYSBtZXRob2QgZnJvbSBzdGFja292ZXJmbG93IHRoYXQgY2F1c2VkIGEgc2VjdXJpdHkgZXJyb3IgaW4gYWxsIGJyb3dzZXJzLiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzI0ODY5MDEvaG93LXRvLXNldC1kb2N1bWVudC1kb21haW4tZm9yLWEtZHluYW1pY2FsbHktZ2VuZXJhdGVkLWlmcmFtZVxuICAgIC8vIEluIHRoZSBlbmQgdGhlIHNvbHV0aW9uIEkgZm91bmQgdG8gd29yayB3YXMgc2V0dGluZyB0aGUgaWZyYW1lIHdpbmRvdy5sb2NhdGlvbi5ocmVmIHJpZ2h0IGJlZm9yZSBkb2luZyBhIGRvY3VtZW50LndyaXRlIG9mIHRoZSBGbGFzaCBvYmplY3QuXG4gICAgLy8gVGhlIG9ubHkgZG93bnNpZGUgb2YgdGhpcyBpdCBzZWVtcyB0byB0cmlnZ2VyIGFub3RoZXIgaHR0cCByZXF1ZXN0IHRvIHRoZSBvcmlnaW5hbCBwYWdlIChubyBtYXR0ZXIgd2hhdCdzIHB1dCBpbiB0aGUgaHJlZikuIE5vdCBzdXJlIHdoeSB0aGF0IGlzLlxuXG4gICAgLy8gTk9URSAoMjAxMi0wMS0yOSk6IENhbm5vdCBnZXQgRmlyZWZveCB0byBsb2FkIHRoZSByZW1vdGUgaG9zdGVkIFNXRiBpbnRvIGEgZHluYW1pY2FsbHkgY3JlYXRlZCBpRnJhbWVcbiAgICAvLyBGaXJlZm94IDkgdGhyb3dzIGEgc2VjdXJpdHkgZXJyb3IsIHVubGVlc3MgeW91IGNhbGwgbG9jYXRpb24uaHJlZiByaWdodCBiZWZvcmUgZG9jLndyaXRlLlxuICAgIC8vICAgIE5vdCBzdXJlIHdoeSB0aGF0IGV2ZW4gd29ya3MsIGJ1dCBpdCBjYXVzZXMgdGhlIGJyb3dzZXIgdG8gbG9vayBsaWtlIGl0J3MgY29udGludW91c2x5IHRyeWluZyB0byBsb2FkIHRoZSBwYWdlLlxuICAgIC8vIEZpcmVmb3ggMy42IGtlZXBzIGNhbGxpbmcgdGhlIGlmcmFtZSBvbmxvYWQgZnVuY3Rpb24gYW55dGltZSBJIHdyaXRlIHRvIGl0LCBjYXVzaW5nIGFuIGVuZGxlc3MgbG9vcC5cblxuICAgIGlmIChvcHRpb25zWydpRnJhbWVNb2RlJ10gPT09IHRydWUgJiYgIXZqcy5JU19GSVJFRk9YKSB7XG5cbiAgICAgIC8vIENyZWF0ZSBpRnJhbWUgd2l0aCB2anMtdGVjaCBjbGFzcyBzbyBpdCdzIDEwMCUgd2lkdGgvaGVpZ2h0XG4gICAgICB2YXIgaUZybSA9IHZqcy5jcmVhdGVFbCgnaWZyYW1lJywge1xuICAgICAgICAnaWQnOiBvYmpJZCArICdfaWZyYW1lJyxcbiAgICAgICAgJ25hbWUnOiBvYmpJZCArICdfaWZyYW1lJyxcbiAgICAgICAgJ2NsYXNzTmFtZSc6ICd2anMtdGVjaCcsXG4gICAgICAgICdzY3JvbGxpbmcnOiAnbm8nLFxuICAgICAgICAnbWFyZ2luV2lkdGgnOiAwLFxuICAgICAgICAnbWFyZ2luSGVpZ2h0JzogMCxcbiAgICAgICAgJ2ZyYW1lQm9yZGVyJzogMFxuICAgICAgfSk7XG5cbiAgICAgIC8vIFVwZGF0ZSByZWFkeSBmdW5jdGlvbiBuYW1lcyBpbiBmbGFzaCB2YXJzIGZvciBpZnJhbWUgd2luZG93XG4gICAgICBmbGFzaFZhcnNbJ3JlYWR5RnVuY3Rpb24nXSA9ICdyZWFkeSc7XG4gICAgICBmbGFzaFZhcnNbJ2V2ZW50UHJveHlGdW5jdGlvbiddID0gJ2V2ZW50cyc7XG4gICAgICBmbGFzaFZhcnNbJ2Vycm9yRXZlbnRQcm94eUZ1bmN0aW9uJ10gPSAnZXJyb3JzJztcblxuICAgICAgLy8gVHJpZWQgbXVsdGlwbGUgbWV0aG9kcyB0byBnZXQgdGhpcyB0byB3b3JrIGluIGFsbCBicm93c2Vyc1xuXG4gICAgICAvLyBUcmllZCBlbWJlZGRpbmcgdGhlIGZsYXNoIG9iamVjdCBpbiB0aGUgcGFnZSBmaXJzdCwgYW5kIHRoZW4gYWRkaW5nIGEgcGxhY2UgaG9sZGVyIHRvIHRoZSBpZnJhbWUsIHRoZW4gcmVwbGFjaW5nIHRoZSBwbGFjZWhvbGRlciB3aXRoIHRoZSBwYWdlIG9iamVjdC5cbiAgICAgIC8vIFRoZSBnb2FsIGhlcmUgd2FzIHRvIHRyeSB0byBsb2FkIHRoZSBzd2YgVVJMIGluIHRoZSBwYXJlbnQgcGFnZSBmaXJzdCBhbmQgaG9wZSB0aGF0IGdvdCBhcm91bmQgdGhlIGZpcmVmb3ggc2VjdXJpdHkgZXJyb3JcbiAgICAgIC8vIHZhciBuZXdPYmogPSB2anMuRmxhc2guZW1iZWQob3B0aW9uc1snc3dmJ10sIHBsYWNlSG9sZGVyLCBmbGFzaFZhcnMsIHBhcmFtcywgYXR0cmlidXRlcyk7XG4gICAgICAvLyAoaW4gb25sb2FkKVxuICAgICAgLy8gIHZhciB0ZW1wID0gdmpzLmNyZWF0ZUVsKCdhJywgeyBpZDonYXNkZicsIGlubmVySFRNTDogJ2FzZGYnIH0gKTtcbiAgICAgIC8vICBpRG9jLmJvZHkuYXBwZW5kQ2hpbGQodGVtcCk7XG5cbiAgICAgIC8vIFRyaWVkIGVtYmVkZGluZyB0aGUgZmxhc2ggb2JqZWN0IHRocm91Z2ggamF2YXNjcmlwdCBpbiB0aGUgaWZyYW1lIHNvdXJjZS5cbiAgICAgIC8vIFRoaXMgd29ya3MgaW4gd2Via2l0IGJ1dCBzdGlsbCB0cmlnZ2VycyB0aGUgZmlyZWZveCBzZWN1cml0eSBlcnJvclxuICAgICAgLy8gaUZybS5zcmMgPSAnamF2YXNjcmlwdDogZG9jdW1lbnQud3JpdGUoJ1wiK3Zqcy5GbGFzaC5nZXRFbWJlZENvZGUob3B0aW9uc1snc3dmJ10sIGZsYXNoVmFycywgcGFyYW1zLCBhdHRyaWJ1dGVzKStcIicpO1wiO1xuXG4gICAgICAvLyBUcmllZCBhbiBhY3R1YWwgbG9jYWwgaWZyYW1lIGp1c3QgdG8gbWFrZSBzdXJlIHRoYXQgd29ya3MsIGJ1dCBpdCBraWxscyB0aGUgZWFzaW5lc3Mgb2YgdGhlIENETiB2ZXJzaW9uIGlmIHlvdSByZXF1aXJlIHRoZSB1c2VyIHRvIGhvc3QgYW4gaWZyYW1lXG4gICAgICAvLyBXZSBzaG91bGQgYWRkIGFuIG9wdGlvbiB0byBob3N0IHRoZSBpZnJhbWUgbG9jYWxseSB0aG91Z2gsIGJlY2F1c2UgaXQgY291bGQgaGVscCBhIGxvdCBvZiBpc3N1ZXMuXG4gICAgICAvLyBpRnJtLnNyYyA9IFwiaWZyYW1lLmh0bWxcIjtcblxuICAgICAgLy8gV2FpdCB1bnRpbCBpRnJhbWUgaGFzIGxvYWRlZCB0byB3cml0ZSBpbnRvIGl0LlxuICAgICAgdmpzLm9uKGlGcm0sICdsb2FkJywgdmpzLmJpbmQodGhpcywgZnVuY3Rpb24oKXtcblxuICAgICAgICB2YXIgaURvYyxcbiAgICAgICAgICAgIGlXaW4gPSBpRnJtLmNvbnRlbnRXaW5kb3c7XG5cbiAgICAgICAgLy8gVGhlIG9uZSB3b3JraW5nIG1ldGhvZCBJIGZvdW5kIHdhcyB0byB1c2UgdGhlIGlmcmFtZSdzIGRvY3VtZW50LndyaXRlKCkgdG8gY3JlYXRlIHRoZSBzd2Ygb2JqZWN0XG4gICAgICAgIC8vIFRoaXMgZ290IGFyb3VuZCB0aGUgc2VjdXJpdHkgaXNzdWUgaW4gYWxsIGJyb3dzZXJzIGV4Y2VwdCBmaXJlZm94LlxuICAgICAgICAvLyBJIGRpZCBmaW5kIGEgaGFjayB3aGVyZSBpZiBJIGNhbGwgdGhlIGlmcmFtZSdzIHdpbmRvdy5sb2NhdGlvbi5ocmVmPScnLCBpdCB3b3VsZCBnZXQgYXJvdW5kIHRoZSBzZWN1cml0eSBlcnJvclxuICAgICAgICAvLyBIb3dldmVyLCB0aGUgbWFpbiBwYWdlIHdvdWxkIGxvb2sgbGlrZSBpdCB3YXMgbG9hZGluZyBpbmRlZmluaXRlbHkgKFVSTCBiYXIgbG9hZGluZyBzcGlubmVyIHdvdWxkIG5ldmVyIHN0b3ApXG4gICAgICAgIC8vIFBsdXMgRmlyZWZveCAzLjYgZGlkbid0IHdvcmsgbm8gbWF0dGVyIHdoYXQgSSB0cmllZC5cbiAgICAgICAgLy8gaWYgKHZqcy5VU0VSX0FHRU5ULm1hdGNoKCdGaXJlZm94JykpIHtcbiAgICAgICAgLy8gICBpV2luLmxvY2F0aW9uLmhyZWYgPSAnJztcbiAgICAgICAgLy8gfVxuXG4gICAgICAgIC8vIEdldCB0aGUgaUZyYW1lJ3MgZG9jdW1lbnQgZGVwZW5kaW5nIG9uIHdoYXQgdGhlIGJyb3dzZXIgc3VwcG9ydHNcbiAgICAgICAgaURvYyA9IGlGcm0uY29udGVudERvY3VtZW50ID8gaUZybS5jb250ZW50RG9jdW1lbnQgOiBpRnJtLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQ7XG5cbiAgICAgICAgLy8gVHJpZWQgZW5zdXJpbmcgYm90aCBkb2N1bWVudCBkb21haW5zIHdlcmUgdGhlIHNhbWUsIGJ1dCB0aGV5IGFscmVhZHkgd2VyZSwgc28gdGhhdCB3YXNuJ3QgdGhlIGlzc3VlLlxuICAgICAgICAvLyBFdmVuIHRyaWVkIGFkZGluZyAvLiB0aGF0IHdhcyBtZW50aW9uZWQgaW4gYSBicm93c2VyIHNlY3VyaXR5IHdyaXRldXBcbiAgICAgICAgLy8gZG9jdW1lbnQuZG9tYWluID0gZG9jdW1lbnQuZG9tYWluKycvLic7XG4gICAgICAgIC8vIGlEb2MuZG9tYWluID0gZG9jdW1lbnQuZG9tYWluKycvLic7XG5cbiAgICAgICAgLy8gVHJpZWQgYWRkaW5nIHRoZSBvYmplY3QgdG8gdGhlIGlmcmFtZSBkb2MncyBpbm5lckhUTUwuIFNlY3VyaXR5IGVycm9yIGluIGFsbCBicm93c2Vycy5cbiAgICAgICAgLy8gaURvYy5ib2R5LmlubmVySFRNTCA9IHN3Zk9iamVjdEhUTUw7XG5cbiAgICAgICAgLy8gVHJpZWQgYXBwZW5kaW5nIHRoZSBvYmplY3QgdG8gdGhlIGlmcmFtZSBkb2MncyBib2R5LiBTZWN1cml0eSBlcnJvciBpbiBhbGwgYnJvd3NlcnMuXG4gICAgICAgIC8vIGlEb2MuYm9keS5hcHBlbmRDaGlsZChzd2ZPYmplY3QpO1xuXG4gICAgICAgIC8vIFVzaW5nIGRvY3VtZW50LndyaXRlIGFjdHVhbGx5IGdvdCBhcm91bmQgdGhlIHNlY3VyaXR5IGVycm9yIHRoYXQgYnJvd3NlcnMgd2VyZSB0aHJvd2luZy5cbiAgICAgICAgLy8gQWdhaW4sIGl0J3MgYSBkeW5hbWljYWxseSBnZW5lcmF0ZWQgKHNhbWUgZG9tYWluKSBpZnJhbWUsIGxvYWRpbmcgYW4gZXh0ZXJuYWwgRmxhc2ggc3dmLlxuICAgICAgICAvLyBOb3Qgc3VyZSB3aHkgdGhhdCdzIGEgc2VjdXJpdHkgaXNzdWUsIGJ1dCBhcHBhcmVudGx5IGl0IGlzLlxuICAgICAgICBpRG9jLndyaXRlKHZqcy5GbGFzaC5nZXRFbWJlZENvZGUob3B0aW9uc1snc3dmJ10sIGZsYXNoVmFycywgcGFyYW1zLCBhdHRyaWJ1dGVzKSk7XG5cbiAgICAgICAgLy8gU2V0dGluZyB2YXJpYWJsZXMgb24gdGhlIHdpbmRvdyBuZWVkcyB0byBjb21lIGFmdGVyIHRoZSBkb2Mgd3JpdGUgYmVjYXVzZSBvdGhlcndpc2UgdGhleSBjYW4gZ2V0IHJlc2V0IGluIHNvbWUgYnJvd3NlcnNcbiAgICAgICAgLy8gU28gZmFyIG5vIGlzc3VlcyB3aXRoIHN3ZiByZWFkeSBldmVudCBiZWluZyBjYWxsZWQgYmVmb3JlIGl0J3Mgc2V0IG9uIHRoZSB3aW5kb3cuXG4gICAgICAgIGlXaW5bJ3BsYXllciddID0gdGhpcy5wbGF5ZXJfO1xuXG4gICAgICAgIC8vIENyZWF0ZSBzd2YgcmVhZHkgZnVuY3Rpb24gZm9yIGlGcmFtZSB3aW5kb3dcbiAgICAgICAgaVdpblsncmVhZHknXSA9IHZqcy5iaW5kKHRoaXMucGxheWVyXywgZnVuY3Rpb24oY3VyclN3Zil7XG4gICAgICAgICAgdmFyIGVsID0gaURvYy5nZXRFbGVtZW50QnlJZChjdXJyU3dmKSxcbiAgICAgICAgICAgICAgcGxheWVyID0gdGhpcyxcbiAgICAgICAgICAgICAgdGVjaCA9IHBsYXllci50ZWNoO1xuXG4gICAgICAgICAgLy8gVXBkYXRlIHJlZmVyZW5jZSB0byBwbGF5YmFjayB0ZWNobm9sb2d5IGVsZW1lbnRcbiAgICAgICAgICB0ZWNoLmVsXyA9IGVsO1xuXG4gICAgICAgICAgLy8gTWFrZSBzdXJlIHN3ZiBpcyBhY3R1YWxseSByZWFkeS4gU29tZXRpbWVzIHRoZSBBUEkgaXNuJ3QgYWN0dWFsbHkgeWV0LlxuICAgICAgICAgIHZqcy5GbGFzaC5jaGVja1JlYWR5KHRlY2gpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBDcmVhdGUgZXZlbnQgbGlzdGVuZXIgZm9yIGFsbCBzd2YgZXZlbnRzXG4gICAgICAgIGlXaW5bJ2V2ZW50cyddID0gdmpzLmJpbmQodGhpcy5wbGF5ZXJfLCBmdW5jdGlvbihzd2ZJRCwgZXZlbnROYW1lKXtcbiAgICAgICAgICB2YXIgcGxheWVyID0gdGhpcztcbiAgICAgICAgICBpZiAocGxheWVyICYmIHBsYXllci50ZWNoTmFtZSA9PT0gJ2ZsYXNoJykge1xuICAgICAgICAgICAgcGxheWVyLnRyaWdnZXIoZXZlbnROYW1lKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIENyZWF0ZSBlcnJvciBsaXN0ZW5lciBmb3IgYWxsIHN3ZiBlcnJvcnNcbiAgICAgICAgaVdpblsnZXJyb3JzJ10gPSB2anMuYmluZCh0aGlzLnBsYXllcl8sIGZ1bmN0aW9uKHN3ZklELCBldmVudE5hbWUpe1xuICAgICAgICAgIHZqcy5sb2coJ0ZsYXNoIEVycm9yJywgZXZlbnROYW1lKTtcbiAgICAgICAgfSk7XG5cbiAgICAgIH0pKTtcblxuICAgICAgLy8gUmVwbGFjZSBwbGFjZWhvbGRlciB3aXRoIGlGcmFtZSAoaXQgd2lsbCBsb2FkIG5vdylcbiAgICAgIHBsYWNlSG9sZGVyLnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKGlGcm0sIHBsYWNlSG9sZGVyKTtcblxuICAgIC8vIElmIG5vdCB1c2luZyBpRnJhbWUgbW9kZSwgZW1iZWQgYXMgbm9ybWFsIG9iamVjdFxuICAgIH0gZWxzZSB7XG4gICAgICB2anMuRmxhc2guZW1iZWQob3B0aW9uc1snc3dmJ10sIHBsYWNlSG9sZGVyLCBmbGFzaFZhcnMsIHBhcmFtcywgYXR0cmlidXRlcyk7XG4gICAgfVxuICB9XG59KTtcblxudmpzLkZsYXNoLnByb3RvdHlwZS5kaXNwb3NlID0gZnVuY3Rpb24oKXtcbiAgdmpzLk1lZGlhVGVjaENvbnRyb2xsZXIucHJvdG90eXBlLmRpc3Bvc2UuY2FsbCh0aGlzKTtcbn07XG5cbnZqcy5GbGFzaC5wcm90b3R5cGUucGxheSA9IGZ1bmN0aW9uKCl7XG4gIHRoaXMuZWxfLnZqc19wbGF5KCk7XG59O1xuXG52anMuRmxhc2gucHJvdG90eXBlLnBhdXNlID0gZnVuY3Rpb24oKXtcbiAgdGhpcy5lbF8udmpzX3BhdXNlKCk7XG59O1xuXG52anMuRmxhc2gucHJvdG90eXBlLnNyYyA9IGZ1bmN0aW9uKHNyYyl7XG4gIGlmICh2anMuRmxhc2guaXNTdHJlYW1pbmdTcmMoc3JjKSkge1xuICAgIHNyYyA9IHZqcy5GbGFzaC5zdHJlYW1Ub1BhcnRzKHNyYyk7XG4gICAgdGhpcy5zZXRSdG1wQ29ubmVjdGlvbihzcmMuY29ubmVjdGlvbik7XG4gICAgdGhpcy5zZXRSdG1wU3RyZWFtKHNyYy5zdHJlYW0pO1xuICB9XG4gIGVsc2Uge1xuICAgIC8vIE1ha2Ugc3VyZSBzb3VyY2UgVVJMIGlzIGFib3NvbHV0ZS5cbiAgICBzcmMgPSB2anMuZ2V0QWJzb2x1dGVVUkwoc3JjKTtcbiAgICB0aGlzLmVsXy52anNfc3JjKHNyYyk7XG4gIH1cblxuICAvLyBDdXJyZW50bHkgdGhlIFNXRiBkb2Vzbid0IGF1dG9wbGF5IGlmIHlvdSBsb2FkIGEgc291cmNlIGxhdGVyLlxuICAvLyBlLmcuIExvYWQgcGxheWVyIHcvIG5vIHNvdXJjZSwgd2FpdCAycywgc2V0IHNyYy5cbiAgaWYgKHRoaXMucGxheWVyXy5hdXRvcGxheSgpKSB7XG4gICAgdmFyIHRlY2ggPSB0aGlzO1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgdGVjaC5wbGF5KCk7IH0sIDApO1xuICB9XG59O1xuXG52anMuRmxhc2gucHJvdG90eXBlLmN1cnJlbnRTcmMgPSBmdW5jdGlvbigpe1xuICB2YXIgc3JjID0gdGhpcy5lbF8udmpzX2dldFByb3BlcnR5KCdjdXJyZW50U3JjJyk7XG4gIC8vIG5vIHNyYywgY2hlY2sgYW5kIHNlZSBpZiBSVE1QXG4gIGlmIChzcmMgPT0gbnVsbCkge1xuICAgIHZhciBjb25uZWN0aW9uID0gdGhpcy5ydG1wQ29ubmVjdGlvbigpLFxuICAgICAgICBzdHJlYW0gPSB0aGlzLnJ0bXBTdHJlYW0oKTtcblxuICAgIGlmIChjb25uZWN0aW9uICYmIHN0cmVhbSkge1xuICAgICAgc3JjID0gdmpzLkZsYXNoLnN0cmVhbUZyb21QYXJ0cyhjb25uZWN0aW9uLCBzdHJlYW0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3JjO1xufTtcblxudmpzLkZsYXNoLnByb3RvdHlwZS5sb2FkID0gZnVuY3Rpb24oKXtcbiAgdGhpcy5lbF8udmpzX2xvYWQoKTtcbn07XG5cbnZqcy5GbGFzaC5wcm90b3R5cGUucG9zdGVyID0gZnVuY3Rpb24oKXtcbiAgdGhpcy5lbF8udmpzX2dldFByb3BlcnR5KCdwb3N0ZXInKTtcbn07XG5cbnZqcy5GbGFzaC5wcm90b3R5cGUuYnVmZmVyZWQgPSBmdW5jdGlvbigpe1xuICByZXR1cm4gdmpzLmNyZWF0ZVRpbWVSYW5nZSgwLCB0aGlzLmVsXy52anNfZ2V0UHJvcGVydHkoJ2J1ZmZlcmVkJykpO1xufTtcblxudmpzLkZsYXNoLnByb3RvdHlwZS5zdXBwb3J0c0Z1bGxTY3JlZW4gPSBmdW5jdGlvbigpe1xuICByZXR1cm4gZmFsc2U7IC8vIEZsYXNoIGRvZXMgbm90IGFsbG93IGZ1bGxzY3JlZW4gdGhyb3VnaCBqYXZhc2NyaXB0XG59O1xuXG52anMuRmxhc2gucHJvdG90eXBlLmVudGVyRnVsbFNjcmVlbiA9IGZ1bmN0aW9uKCl7XG4gIHJldHVybiBmYWxzZTtcbn07XG5cblxuLy8gQ3JlYXRlIHNldHRlcnMgYW5kIGdldHRlcnMgZm9yIGF0dHJpYnV0ZXNcbnZhciBhcGkgPSB2anMuRmxhc2gucHJvdG90eXBlLFxuICAgIHJlYWRXcml0ZSA9ICdydG1wQ29ubmVjdGlvbixydG1wU3RyZWFtLHByZWxvYWQsY3VycmVudFRpbWUsZGVmYXVsdFBsYXliYWNrUmF0ZSxwbGF5YmFja1JhdGUsYXV0b3BsYXksbG9vcCxtZWRpYUdyb3VwLGNvbnRyb2xsZXIsY29udHJvbHMsdm9sdW1lLG11dGVkLGRlZmF1bHRNdXRlZCcuc3BsaXQoJywnKSxcbiAgICByZWFkT25seSA9ICdlcnJvcixjdXJyZW50U3JjLG5ldHdvcmtTdGF0ZSxyZWFkeVN0YXRlLHNlZWtpbmcsaW5pdGlhbFRpbWUsZHVyYXRpb24sc3RhcnRPZmZzZXRUaW1lLHBhdXNlZCxwbGF5ZWQsc2Vla2FibGUsZW5kZWQsdmlkZW9UcmFja3MsYXVkaW9UcmFja3MsdmlkZW9XaWR0aCx2aWRlb0hlaWdodCx0ZXh0VHJhY2tzJy5zcGxpdCgnLCcpO1xuICAgIC8vIE92ZXJyaWRkZW46IGJ1ZmZlcmVkXG5cbi8qKlxuICogQHRoaXMgeyp9XG4gKiBAcHJpdmF0ZVxuICovXG52YXIgY3JlYXRlU2V0dGVyID0gZnVuY3Rpb24oYXR0cil7XG4gIHZhciBhdHRyVXBwZXIgPSBhdHRyLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgYXR0ci5zbGljZSgxKTtcbiAgYXBpWydzZXQnK2F0dHJVcHBlcl0gPSBmdW5jdGlvbih2YWwpeyByZXR1cm4gdGhpcy5lbF8udmpzX3NldFByb3BlcnR5KGF0dHIsIHZhbCk7IH07XG59O1xuXG4vKipcbiAqIEB0aGlzIHsqfVxuICogQHByaXZhdGVcbiAqL1xudmFyIGNyZWF0ZUdldHRlciA9IGZ1bmN0aW9uKGF0dHIpe1xuICBhcGlbYXR0cl0gPSBmdW5jdGlvbigpeyByZXR1cm4gdGhpcy5lbF8udmpzX2dldFByb3BlcnR5KGF0dHIpOyB9O1xufTtcblxuKGZ1bmN0aW9uKCl7XG4gIHZhciBpO1xuICAvLyBDcmVhdGUgZ2V0dGVyIGFuZCBzZXR0ZXJzIGZvciBhbGwgcmVhZC93cml0ZSBhdHRyaWJ1dGVzXG4gIGZvciAoaSA9IDA7IGkgPCByZWFkV3JpdGUubGVuZ3RoOyBpKyspIHtcbiAgICBjcmVhdGVHZXR0ZXIocmVhZFdyaXRlW2ldKTtcbiAgICBjcmVhdGVTZXR0ZXIocmVhZFdyaXRlW2ldKTtcbiAgfVxuXG4gIC8vIENyZWF0ZSBnZXR0ZXJzIGZvciByZWFkLW9ubHkgYXR0cmlidXRlc1xuICBmb3IgKGkgPSAwOyBpIDwgcmVhZE9ubHkubGVuZ3RoOyBpKyspIHtcbiAgICBjcmVhdGVHZXR0ZXIocmVhZE9ubHlbaV0pO1xuICB9XG59KSgpO1xuXG4vKiBGbGFzaCBTdXBwb3J0IFRlc3RpbmcgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxudmpzLkZsYXNoLmlzU3VwcG9ydGVkID0gZnVuY3Rpb24oKXtcbiAgcmV0dXJuIHZqcy5GbGFzaC52ZXJzaW9uKClbMF0gPj0gMTA7XG4gIC8vIHJldHVybiBzd2ZvYmplY3QuaGFzRmxhc2hQbGF5ZXJWZXJzaW9uKCcxMCcpO1xufTtcblxudmpzLkZsYXNoLmNhblBsYXlTb3VyY2UgPSBmdW5jdGlvbihzcmNPYmope1xuICB2YXIgdHlwZTtcblxuICBpZiAoIXNyY09iai50eXBlKSB7XG4gICAgcmV0dXJuICcnO1xuICB9XG5cbiAgdHlwZSA9IHNyY09iai50eXBlLnJlcGxhY2UoLzsuKi8sJycpLnRvTG93ZXJDYXNlKCk7XG4gIGlmICh0eXBlIGluIHZqcy5GbGFzaC5mb3JtYXRzIHx8IHR5cGUgaW4gdmpzLkZsYXNoLnN0cmVhbWluZ0Zvcm1hdHMpIHtcbiAgICByZXR1cm4gJ21heWJlJztcbiAgfVxufTtcblxudmpzLkZsYXNoLmZvcm1hdHMgPSB7XG4gICd2aWRlby9mbHYnOiAnRkxWJyxcbiAgJ3ZpZGVvL3gtZmx2JzogJ0ZMVicsXG4gICd2aWRlby9tcDQnOiAnTVA0JyxcbiAgJ3ZpZGVvL200dic6ICdNUDQnXG59O1xuXG52anMuRmxhc2guc3RyZWFtaW5nRm9ybWF0cyA9IHtcbiAgJ3J0bXAvbXA0JzogJ01QNCcsXG4gICdydG1wL2Zsdic6ICdGTFYnXG59O1xuXG52anMuRmxhc2hbJ29uUmVhZHknXSA9IGZ1bmN0aW9uKGN1cnJTd2Ype1xuICB2YXIgZWwgPSB2anMuZWwoY3VyclN3Zik7XG5cbiAgLy8gR2V0IHBsYXllciBmcm9tIGJveFxuICAvLyBPbiBmaXJlZm94IHJlbG9hZHMsIGVsIG1pZ2h0IGFscmVhZHkgaGF2ZSBhIHBsYXllclxuICB2YXIgcGxheWVyID0gZWxbJ3BsYXllciddIHx8IGVsLnBhcmVudE5vZGVbJ3BsYXllciddLFxuICAgICAgdGVjaCA9IHBsYXllci50ZWNoO1xuXG4gIC8vIFJlZmVyZW5jZSBwbGF5ZXIgb24gdGVjaCBlbGVtZW50XG4gIGVsWydwbGF5ZXInXSA9IHBsYXllcjtcblxuICAvLyBVcGRhdGUgcmVmZXJlbmNlIHRvIHBsYXliYWNrIHRlY2hub2xvZ3kgZWxlbWVudFxuICB0ZWNoLmVsXyA9IGVsO1xuXG4gIHZqcy5GbGFzaC5jaGVja1JlYWR5KHRlY2gpO1xufTtcblxuLy8gVGhlIFNXRiBpc24ndCBhbHdhc3kgcmVhZHkgd2hlbiBpdCBzYXlzIGl0IGlzLiBTb21ldGltZXMgdGhlIEFQSSBmdW5jdGlvbnMgc3RpbGwgbmVlZCB0byBiZSBhZGRlZCB0byB0aGUgb2JqZWN0LlxuLy8gSWYgaXQncyBub3QgcmVhZHksIHdlIHNldCBhIHRpbWVvdXQgdG8gY2hlY2sgYWdhaW4gc2hvcnRseS5cbnZqcy5GbGFzaC5jaGVja1JlYWR5ID0gZnVuY3Rpb24odGVjaCl7XG5cbiAgLy8gQ2hlY2sgaWYgQVBJIHByb3BlcnR5IGV4aXN0c1xuICBpZiAodGVjaC5lbCgpLnZqc19nZXRQcm9wZXJ0eSkge1xuXG4gICAgLy8gSWYgc28sIHRlbGwgdGVjaCBpdCdzIHJlYWR5XG4gICAgdGVjaC50cmlnZ2VyUmVhZHkoKTtcblxuICAvLyBPdGhlcndpc2Ugd2FpdCBsb25nZXIuXG4gIH0gZWxzZSB7XG5cbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICB2anMuRmxhc2guY2hlY2tSZWFkeSh0ZWNoKTtcbiAgICB9LCA1MCk7XG5cbiAgfVxufTtcblxuLy8gVHJpZ2dlciBldmVudHMgZnJvbSB0aGUgc3dmIG9uIHRoZSBwbGF5ZXJcbnZqcy5GbGFzaFsnb25FdmVudCddID0gZnVuY3Rpb24oc3dmSUQsIGV2ZW50TmFtZSl7XG4gIHZhciBwbGF5ZXIgPSB2anMuZWwoc3dmSUQpWydwbGF5ZXInXTtcbiAgcGxheWVyLnRyaWdnZXIoZXZlbnROYW1lKTtcbn07XG5cbi8vIExvZyBlcnJvcnMgZnJvbSB0aGUgc3dmXG52anMuRmxhc2hbJ29uRXJyb3InXSA9IGZ1bmN0aW9uKHN3ZklELCBlcnIpe1xuICB2YXIgcGxheWVyID0gdmpzLmVsKHN3ZklEKVsncGxheWVyJ107XG4gIHBsYXllci50cmlnZ2VyKCdlcnJvcicpO1xuICB2anMubG9nKCdGbGFzaCBFcnJvcicsIGVyciwgc3dmSUQpO1xufTtcblxuLy8gRmxhc2ggVmVyc2lvbiBDaGVja1xudmpzLkZsYXNoLnZlcnNpb24gPSBmdW5jdGlvbigpe1xuICB2YXIgdmVyc2lvbiA9ICcwLDAsMCc7XG5cbiAgLy8gSUVcbiAgdHJ5IHtcbiAgICB2ZXJzaW9uID0gbmV3IHdpbmRvdy5BY3RpdmVYT2JqZWN0KCdTaG9ja3dhdmVGbGFzaC5TaG9ja3dhdmVGbGFzaCcpLkdldFZhcmlhYmxlKCckdmVyc2lvbicpLnJlcGxhY2UoL1xcRCsvZywgJywnKS5tYXRjaCgvXiw/KC4rKSw/JC8pWzFdO1xuXG4gIC8vIG90aGVyIGJyb3dzZXJzXG4gIH0gY2F0Y2goZSkge1xuICAgIHRyeSB7XG4gICAgICBpZiAobmF2aWdhdG9yLm1pbWVUeXBlc1snYXBwbGljYXRpb24veC1zaG9ja3dhdmUtZmxhc2gnXS5lbmFibGVkUGx1Z2luKXtcbiAgICAgICAgdmVyc2lvbiA9IChuYXZpZ2F0b3IucGx1Z2luc1snU2hvY2t3YXZlIEZsYXNoIDIuMCddIHx8IG5hdmlnYXRvci5wbHVnaW5zWydTaG9ja3dhdmUgRmxhc2gnXSkuZGVzY3JpcHRpb24ucmVwbGFjZSgvXFxEKy9nLCAnLCcpLm1hdGNoKC9eLD8oLispLD8kLylbMV07XG4gICAgICB9XG4gICAgfSBjYXRjaChlcnIpIHt9XG4gIH1cbiAgcmV0dXJuIHZlcnNpb24uc3BsaXQoJywnKTtcbn07XG5cbi8vIEZsYXNoIGVtYmVkZGluZyBtZXRob2QuIE9ubHkgdXNlZCBpbiBub24taWZyYW1lIG1vZGVcbnZqcy5GbGFzaC5lbWJlZCA9IGZ1bmN0aW9uKHN3ZiwgcGxhY2VIb2xkZXIsIGZsYXNoVmFycywgcGFyYW1zLCBhdHRyaWJ1dGVzKXtcbiAgdmFyIGNvZGUgPSB2anMuRmxhc2guZ2V0RW1iZWRDb2RlKHN3ZiwgZmxhc2hWYXJzLCBwYXJhbXMsIGF0dHJpYnV0ZXMpLFxuXG4gICAgICAvLyBHZXQgZWxlbWVudCBieSBlbWJlZGRpbmcgY29kZSBhbmQgcmV0cmlldmluZyBjcmVhdGVkIGVsZW1lbnRcbiAgICAgIG9iaiA9IHZqcy5jcmVhdGVFbCgnZGl2JywgeyBpbm5lckhUTUw6IGNvZGUgfSkuY2hpbGROb2Rlc1swXSxcblxuICAgICAgcGFyID0gcGxhY2VIb2xkZXIucGFyZW50Tm9kZVxuICA7XG5cbiAgcGxhY2VIb2xkZXIucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQob2JqLCBwbGFjZUhvbGRlcik7XG5cbiAgLy8gSUU2IHNlZW1zIHRvIGhhdmUgYW4gaXNzdWUgd2hlcmUgaXQgd29uJ3QgaW5pdGlhbGl6ZSB0aGUgc3dmIG9iamVjdCBhZnRlciBpbmplY3RpbmcgaXQuXG4gIC8vIFRoaXMgaXMgYSBkdW1iIGZpeFxuICB2YXIgbmV3T2JqID0gcGFyLmNoaWxkTm9kZXNbMF07XG4gIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICBuZXdPYmouc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gIH0sIDEwMDApO1xuXG4gIHJldHVybiBvYmo7XG5cbn07XG5cbnZqcy5GbGFzaC5nZXRFbWJlZENvZGUgPSBmdW5jdGlvbihzd2YsIGZsYXNoVmFycywgcGFyYW1zLCBhdHRyaWJ1dGVzKXtcblxuICB2YXIgb2JqVGFnID0gJzxvYmplY3QgdHlwZT1cImFwcGxpY2F0aW9uL3gtc2hvY2t3YXZlLWZsYXNoXCInLFxuICAgICAgZmxhc2hWYXJzU3RyaW5nID0gJycsXG4gICAgICBwYXJhbXNTdHJpbmcgPSAnJyxcbiAgICAgIGF0dHJzU3RyaW5nID0gJyc7XG5cbiAgLy8gQ29udmVydCBmbGFzaCB2YXJzIHRvIHN0cmluZ1xuICBpZiAoZmxhc2hWYXJzKSB7XG4gICAgdmpzLm9iai5lYWNoKGZsYXNoVmFycywgZnVuY3Rpb24oa2V5LCB2YWwpe1xuICAgICAgZmxhc2hWYXJzU3RyaW5nICs9IChrZXkgKyAnPScgKyB2YWwgKyAnJmFtcDsnKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIEFkZCBzd2YsIGZsYXNoVmFycywgYW5kIG90aGVyIGRlZmF1bHQgcGFyYW1zXG4gIHBhcmFtcyA9IHZqcy5vYmoubWVyZ2Uoe1xuICAgICdtb3ZpZSc6IHN3ZixcbiAgICAnZmxhc2h2YXJzJzogZmxhc2hWYXJzU3RyaW5nLFxuICAgICdhbGxvd1NjcmlwdEFjY2Vzcyc6ICdhbHdheXMnLCAvLyBSZXF1aXJlZCB0byB0YWxrIHRvIHN3ZlxuICAgICdhbGxvd05ldHdvcmtpbmcnOiAnYWxsJyAvLyBBbGwgc2hvdWxkIGJlIGRlZmF1bHQsIGJ1dCBoYXZpbmcgc2VjdXJpdHkgaXNzdWVzLlxuICB9LCBwYXJhbXMpO1xuXG4gIC8vIENyZWF0ZSBwYXJhbSB0YWdzIHN0cmluZ1xuICB2anMub2JqLmVhY2gocGFyYW1zLCBmdW5jdGlvbihrZXksIHZhbCl7XG4gICAgcGFyYW1zU3RyaW5nICs9ICc8cGFyYW0gbmFtZT1cIicra2V5KydcIiB2YWx1ZT1cIicrdmFsKydcIiAvPic7XG4gIH0pO1xuXG4gIGF0dHJpYnV0ZXMgPSB2anMub2JqLm1lcmdlKHtcbiAgICAvLyBBZGQgc3dmIHRvIGF0dHJpYnV0ZXMgKG5lZWQgYm90aCBmb3IgSUUgYW5kIE90aGVycyB0byB3b3JrKVxuICAgICdkYXRhJzogc3dmLFxuXG4gICAgLy8gRGVmYXVsdCB0byAxMDAlIHdpZHRoL2hlaWdodFxuICAgICd3aWR0aCc6ICcxMDAlJyxcbiAgICAnaGVpZ2h0JzogJzEwMCUnXG5cbiAgfSwgYXR0cmlidXRlcyk7XG5cbiAgLy8gQ3JlYXRlIEF0dHJpYnV0ZXMgc3RyaW5nXG4gIHZqcy5vYmouZWFjaChhdHRyaWJ1dGVzLCBmdW5jdGlvbihrZXksIHZhbCl7XG4gICAgYXR0cnNTdHJpbmcgKz0gKGtleSArICc9XCInICsgdmFsICsgJ1wiICcpO1xuICB9KTtcblxuICByZXR1cm4gb2JqVGFnICsgYXR0cnNTdHJpbmcgKyAnPicgKyBwYXJhbXNTdHJpbmcgKyAnPC9vYmplY3Q+Jztcbn07XG5cbnZqcy5GbGFzaC5zdHJlYW1Gcm9tUGFydHMgPSBmdW5jdGlvbihjb25uZWN0aW9uLCBzdHJlYW0pIHtcbiAgcmV0dXJuIGNvbm5lY3Rpb24gKyAnJicgKyBzdHJlYW07XG59O1xuXG52anMuRmxhc2guc3RyZWFtVG9QYXJ0cyA9IGZ1bmN0aW9uKHNyYykge1xuICB2YXIgcGFydHMgPSB7XG4gICAgY29ubmVjdGlvbjogJycsXG4gICAgc3RyZWFtOiAnJ1xuICB9O1xuXG4gIGlmICghIHNyYykge1xuICAgIHJldHVybiBwYXJ0cztcbiAgfVxuXG4gIC8vIExvb2sgZm9yIHRoZSBub3JtYWwgVVJMIHNlcGFyYXRvciB3ZSBleHBlY3QsICcmJy5cbiAgLy8gSWYgZm91bmQsIHdlIHNwbGl0IHRoZSBVUkwgaW50byB0d28gcGllY2VzIGFyb3VuZCB0aGVcbiAgLy8gZmlyc3QgJyYnLlxuICB2YXIgY29ubkVuZCA9IHNyYy5pbmRleE9mKCcmJyk7XG4gIHZhciBzdHJlYW1CZWdpbjtcbiAgaWYgKGNvbm5FbmQgIT09IC0xKSB7XG4gICAgc3RyZWFtQmVnaW4gPSBjb25uRW5kICsgMTtcbiAgfVxuICBlbHNlIHtcbiAgICAvLyBJZiB0aGVyZSdzIG5vdCBhICcmJywgd2UgdXNlIHRoZSBsYXN0ICcvJyBhcyB0aGUgZGVsaW1pdGVyLlxuICAgIGNvbm5FbmQgPSBzdHJlYW1CZWdpbiA9IHNyYy5sYXN0SW5kZXhPZignLycpICsgMTtcbiAgICBpZiAoY29ubkVuZCA9PT0gMCkge1xuICAgICAgLy8gcmVhbGx5LCB0aGVyZSdzIG5vdCBhICcvJz9cbiAgICAgIGNvbm5FbmQgPSBzdHJlYW1CZWdpbiA9IHNyYy5sZW5ndGg7XG4gICAgfVxuICB9XG4gIHBhcnRzLmNvbm5lY3Rpb24gPSBzcmMuc3Vic3RyaW5nKDAsIGNvbm5FbmQpO1xuICBwYXJ0cy5zdHJlYW0gPSBzcmMuc3Vic3RyaW5nKHN0cmVhbUJlZ2luLCBzcmMubGVuZ3RoKTtcblxuICByZXR1cm4gcGFydHM7XG59O1xuXG52anMuRmxhc2guaXNTdHJlYW1pbmdUeXBlID0gZnVuY3Rpb24oc3JjVHlwZSkge1xuICByZXR1cm4gc3JjVHlwZSBpbiB2anMuRmxhc2guc3RyZWFtaW5nRm9ybWF0cztcbn07XG5cbi8vIFJUTVAgaGFzIGZvdXIgdmFyaWF0aW9ucywgYW55IHN0cmluZyBzdGFydGluZ1xuLy8gd2l0aCBvbmUgb2YgdGhlc2UgcHJvdG9jb2xzIHNob3VsZCBiZSB2YWxpZFxudmpzLkZsYXNoLlJUTVBfUkUgPSAvXnJ0bXBbc2V0XT86XFwvXFwvL2k7XG5cbnZqcy5GbGFzaC5pc1N0cmVhbWluZ1NyYyA9IGZ1bmN0aW9uKHNyYykge1xuICByZXR1cm4gdmpzLkZsYXNoLlJUTVBfUkUudGVzdChzcmMpO1xufTtcbi8qKlxuICogVGhlIE1lZGlhIExvYWRlciBpcyB0aGUgY29tcG9uZW50IHRoYXQgZGVjaWRlcyB3aGljaCBwbGF5YmFjayB0ZWNobm9sb2d5IHRvIGxvYWRcbiAqIHdoZW4gdGhlIHBsYXllciBpcyBpbml0aWFsaXplZC5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqL1xudmpzLk1lZGlhTG9hZGVyID0gdmpzLkNvbXBvbmVudC5leHRlbmQoe1xuICAvKiogQGNvbnN0cnVjdG9yICovXG4gIGluaXQ6IGZ1bmN0aW9uKHBsYXllciwgb3B0aW9ucywgcmVhZHkpe1xuICAgIHZqcy5Db21wb25lbnQuY2FsbCh0aGlzLCBwbGF5ZXIsIG9wdGlvbnMsIHJlYWR5KTtcblxuICAgIC8vIElmIHRoZXJlIGFyZSBubyBzb3VyY2VzIHdoZW4gdGhlIHBsYXllciBpcyBpbml0aWFsaXplZCxcbiAgICAvLyBsb2FkIHRoZSBmaXJzdCBzdXBwb3J0ZWQgcGxheWJhY2sgdGVjaG5vbG9neS5cbiAgICBpZiAoIXBsYXllci5vcHRpb25zX1snc291cmNlcyddIHx8IHBsYXllci5vcHRpb25zX1snc291cmNlcyddLmxlbmd0aCA9PT0gMCkge1xuICAgICAgZm9yICh2YXIgaT0wLGo9cGxheWVyLm9wdGlvbnNfWyd0ZWNoT3JkZXInXTsgaTxqLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciB0ZWNoTmFtZSA9IHZqcy5jYXBpdGFsaXplKGpbaV0pLFxuICAgICAgICAgICAgdGVjaCA9IHdpbmRvd1sndmlkZW9qcyddW3RlY2hOYW1lXTtcblxuICAgICAgICAvLyBDaGVjayBpZiB0aGUgYnJvd3NlciBzdXBwb3J0cyB0aGlzIHRlY2hub2xvZ3lcbiAgICAgICAgaWYgKHRlY2ggJiYgdGVjaC5pc1N1cHBvcnRlZCgpKSB7XG4gICAgICAgICAgcGxheWVyLmxvYWRUZWNoKHRlY2hOYW1lKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyAvLyBMb29wIHRocm91Z2ggcGxheWJhY2sgdGVjaG5vbG9naWVzIChIVE1MNSwgRmxhc2gpIGFuZCBjaGVjayBmb3Igc3VwcG9ydC5cbiAgICAgIC8vIC8vIFRoZW4gbG9hZCB0aGUgYmVzdCBzb3VyY2UuXG4gICAgICAvLyAvLyBBIGZldyBhc3N1bXB0aW9ucyBoZXJlOlxuICAgICAgLy8gLy8gICBBbGwgcGxheWJhY2sgdGVjaG5vbG9naWVzIHJlc3BlY3QgcHJlbG9hZCBmYWxzZS5cbiAgICAgIHBsYXllci5zcmMocGxheWVyLm9wdGlvbnNfWydzb3VyY2VzJ10pO1xuICAgIH1cbiAgfVxufSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgVGV4dCBUcmFja3NcbiAqIFRleHQgdHJhY2tzIGFyZSB0cmFja3Mgb2YgdGltZWQgdGV4dCBldmVudHMuXG4gKiBDYXB0aW9ucyAtIHRleHQgZGlzcGxheWVkIG92ZXIgdGhlIHZpZGVvIGZvciB0aGUgaGVhcmluZyBpbXBhcmVkXG4gKiBTdWJ0aXRsZXMgLSB0ZXh0IGRpc3BsYXllZCBvdmVyIHRoZSB2aWRlbyBmb3IgdGhvc2Ugd2hvIGRvbid0IHVuZGVyc3RhbmQgbGFuZ2F1Z2UgaW4gdGhlIHZpZGVvXG4gKiBDaGFwdGVycyAtIHRleHQgZGlzcGxheWVkIGluIGEgbWVudSBhbGxvd2luZyB0aGUgdXNlciB0byBqdW1wIHRvIHBhcnRpY3VsYXIgcG9pbnRzIChjaGFwdGVycykgaW4gdGhlIHZpZGVvXG4gKiBEZXNjcmlwdGlvbnMgKG5vdCBzdXBwb3J0ZWQgeWV0KSAtIGF1ZGlvIGRlc2NyaXB0aW9ucyB0aGF0IGFyZSByZWFkIGJhY2sgdG8gdGhlIHVzZXIgYnkgYSBzY3JlZW4gcmVhZGluZyBkZXZpY2VcbiAqL1xuXG4vLyBQbGF5ZXIgQWRkaXRpb25zIC0gRnVuY3Rpb25zIGFkZCB0byB0aGUgcGxheWVyIG9iamVjdCBmb3IgZWFzaWVyIGFjY2VzcyB0byB0cmFja3NcblxuLyoqXG4gKiBMaXN0IG9mIGFzc29jaWF0ZWQgdGV4dCB0cmFja3NcbiAqIEB0eXBlIHtBcnJheX1cbiAqIEBwcml2YXRlXG4gKi9cbnZqcy5QbGF5ZXIucHJvdG90eXBlLnRleHRUcmFja3NfO1xuXG4vKipcbiAqIEdldCBhbiBhcnJheSBvZiBhc3NvY2lhdGVkIHRleHQgdHJhY2tzLiBjYXB0aW9ucywgc3VidGl0bGVzLCBjaGFwdGVycywgZGVzY3JpcHRpb25zXG4gKiBodHRwOi8vd3d3LnczLm9yZy9odG1sL3dnL2RyYWZ0cy9odG1sL21hc3Rlci9lbWJlZGRlZC1jb250ZW50LTAuaHRtbCNkb20tbWVkaWEtdGV4dHRyYWNrc1xuICogQHJldHVybiB7QXJyYXl9ICAgICAgICAgICBBcnJheSBvZiB0cmFjayBvYmplY3RzXG4gKiBAcHJpdmF0ZVxuICovXG52anMuUGxheWVyLnByb3RvdHlwZS50ZXh0VHJhY2tzID0gZnVuY3Rpb24oKXtcbiAgdGhpcy50ZXh0VHJhY2tzXyA9IHRoaXMudGV4dFRyYWNrc18gfHwgW107XG4gIHJldHVybiB0aGlzLnRleHRUcmFja3NfO1xufTtcblxuLyoqXG4gKiBBZGQgYSB0ZXh0IHRyYWNrXG4gKiBJbiBhZGRpdGlvbiB0byB0aGUgVzNDIHNldHRpbmdzIHdlIGFsbG93IGFkZGluZyBhZGRpdGlvbmFsIGluZm8gdGhyb3VnaCBvcHRpb25zLlxuICogaHR0cDovL3d3dy53My5vcmcvaHRtbC93Zy9kcmFmdHMvaHRtbC9tYXN0ZXIvZW1iZWRkZWQtY29udGVudC0wLmh0bWwjZG9tLW1lZGlhLWFkZHRleHR0cmFja1xuICogQHBhcmFtIHtTdHJpbmd9ICBraW5kICAgICAgICBDYXB0aW9ucywgc3VidGl0bGVzLCBjaGFwdGVycywgZGVzY3JpcHRpb25zLCBvciBtZXRhZGF0YVxuICogQHBhcmFtIHtTdHJpbmc9fSBsYWJlbCAgICAgICBPcHRpb25hbCBsYWJlbFxuICogQHBhcmFtIHtTdHJpbmc9fSBsYW5ndWFnZSAgICBPcHRpb25hbCBsYW5ndWFnZVxuICogQHBhcmFtIHtPYmplY3Q9fSBvcHRpb25zICAgICBBZGRpdGlvbmFsIHRyYWNrIG9wdGlvbnMsIGxpa2Ugc3JjXG4gKiBAcHJpdmF0ZVxuICovXG52anMuUGxheWVyLnByb3RvdHlwZS5hZGRUZXh0VHJhY2sgPSBmdW5jdGlvbihraW5kLCBsYWJlbCwgbGFuZ3VhZ2UsIG9wdGlvbnMpe1xuICB2YXIgdHJhY2tzID0gdGhpcy50ZXh0VHJhY2tzXyA9IHRoaXMudGV4dFRyYWNrc18gfHwgW107XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gIG9wdGlvbnNbJ2tpbmQnXSA9IGtpbmQ7XG4gIG9wdGlvbnNbJ2xhYmVsJ10gPSBsYWJlbDtcbiAgb3B0aW9uc1snbGFuZ3VhZ2UnXSA9IGxhbmd1YWdlO1xuXG4gIC8vIEhUTUw1IFNwZWMgc2F5cyBkZWZhdWx0IHRvIHN1YnRpdGxlcy5cbiAgLy8gVXBwZXJjYXNlIGZpcnN0IGxldHRlciB0byBtYXRjaCBjbGFzcyBuYW1lc1xuICB2YXIgS2luZCA9IHZqcy5jYXBpdGFsaXplKGtpbmQgfHwgJ3N1YnRpdGxlcycpO1xuXG4gIC8vIENyZWF0ZSBjb3JyZWN0IHRleHR0cmFjayBjbGFzcy4gQ2FwdGlvbnNUcmFjaywgZXRjLlxuICB2YXIgdHJhY2sgPSBuZXcgd2luZG93Wyd2aWRlb2pzJ11bS2luZCArICdUcmFjayddKHRoaXMsIG9wdGlvbnMpO1xuXG4gIHRyYWNrcy5wdXNoKHRyYWNrKTtcblxuICAvLyBJZiB0cmFjay5kZmx0KCkgaXMgc2V0LCBzdGFydCBzaG93aW5nIGltbWVkaWF0ZWx5XG4gIC8vIFRPRE86IEFkZCBhIHByb2Nlc3MgdG8gZGV0ZXJpbWUgdGhlIGJlc3QgdHJhY2sgdG8gc2hvdyBmb3IgdGhlIHNwZWNpZmljIGtpbmRcbiAgLy8gSW5jYXNlIHRoZXJlIGFyZSBtdWxpdHBsZSBkZWZhdWx0ZWQgdHJhY2tzIG9mIHRoZSBzYW1lIGtpbmRcbiAgLy8gT3IgdGhlIHVzZXIgaGFzIGEgc2V0IHByZWZlcmVuY2Ugb2YgYSBzcGVjaWZpYyBsYW5ndWFnZSB0aGF0IHNob3VsZCBvdmVycmlkZSB0aGUgZGVmYXVsdFxuICAvLyBpZiAodHJhY2suZGZsdCgpKSB7XG4gIC8vICAgdGhpcy5yZWFkeSh2anMuYmluZCh0cmFjaywgdHJhY2suc2hvdykpO1xuICAvLyB9XG5cbiAgcmV0dXJuIHRyYWNrO1xufTtcblxuLyoqXG4gKiBBZGQgYW4gYXJyYXkgb2YgdGV4dCB0cmFja3MuIGNhcHRpb25zLCBzdWJ0aXRsZXMsIGNoYXB0ZXJzLCBkZXNjcmlwdGlvbnNcbiAqIFRyYWNrIG9iamVjdHMgd2lsbCBiZSBzdG9yZWQgaW4gdGhlIHBsYXllci50ZXh0VHJhY2tzKCkgYXJyYXlcbiAqIEBwYXJhbSB7QXJyYXl9IHRyYWNrTGlzdCBBcnJheSBvZiB0cmFjayBlbGVtZW50cyBvciBvYmplY3RzIChmYWtlIHRyYWNrIGVsZW1lbnRzKVxuICogQHByaXZhdGVcbiAqL1xudmpzLlBsYXllci5wcm90b3R5cGUuYWRkVGV4dFRyYWNrcyA9IGZ1bmN0aW9uKHRyYWNrTGlzdCl7XG4gIHZhciB0cmFja09iajtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHRyYWNrTGlzdC5sZW5ndGg7IGkrKykge1xuICAgIHRyYWNrT2JqID0gdHJhY2tMaXN0W2ldO1xuICAgIHRoaXMuYWRkVGV4dFRyYWNrKHRyYWNrT2JqWydraW5kJ10sIHRyYWNrT2JqWydsYWJlbCddLCB0cmFja09ialsnbGFuZ3VhZ2UnXSwgdHJhY2tPYmopO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBTaG93IGEgdGV4dCB0cmFja1xuLy8gZGlzYWJsZVNhbWVLaW5kOiBkaXNhYmxlIGFsbCBvdGhlciB0cmFja3Mgb2YgdGhlIHNhbWUga2luZC4gVmFsdWUgc2hvdWxkIGJlIGEgdHJhY2sga2luZCAoY2FwdGlvbnMsIGV0Yy4pXG52anMuUGxheWVyLnByb3RvdHlwZS5zaG93VGV4dFRyYWNrID0gZnVuY3Rpb24oaWQsIGRpc2FibGVTYW1lS2luZCl7XG4gIHZhciB0cmFja3MgPSB0aGlzLnRleHRUcmFja3NfLFxuICAgICAgaSA9IDAsXG4gICAgICBqID0gdHJhY2tzLmxlbmd0aCxcbiAgICAgIHRyYWNrLCBzaG93VHJhY2ssIGtpbmQ7XG5cbiAgLy8gRmluZCBUcmFjayB3aXRoIHNhbWUgSURcbiAgZm9yICg7aTxqO2krKykge1xuICAgIHRyYWNrID0gdHJhY2tzW2ldO1xuICAgIGlmICh0cmFjay5pZCgpID09PSBpZCkge1xuICAgICAgdHJhY2suc2hvdygpO1xuICAgICAgc2hvd1RyYWNrID0gdHJhY2s7XG5cbiAgICAvLyBEaXNhYmxlIHRyYWNrcyBvZiB0aGUgc2FtZSBraW5kXG4gICAgfSBlbHNlIGlmIChkaXNhYmxlU2FtZUtpbmQgJiYgdHJhY2sua2luZCgpID09IGRpc2FibGVTYW1lS2luZCAmJiB0cmFjay5tb2RlKCkgPiAwKSB7XG4gICAgICB0cmFjay5kaXNhYmxlKCk7XG4gICAgfVxuICB9XG5cbiAgLy8gR2V0IHRyYWNrIGtpbmQgZnJvbSBzaG93biB0cmFjayBvciBkaXNhYmxlU2FtZUtpbmRcbiAga2luZCA9IChzaG93VHJhY2spID8gc2hvd1RyYWNrLmtpbmQoKSA6ICgoZGlzYWJsZVNhbWVLaW5kKSA/IGRpc2FibGVTYW1lS2luZCA6IGZhbHNlKTtcblxuICAvLyBUcmlnZ2VyIHRyYWNrY2hhbmdlIGV2ZW50LCBjYXB0aW9uc3RyYWNrY2hhbmdlLCBzdWJ0aXRsZXN0cmFja2NoYW5nZSwgZXRjLlxuICBpZiAoa2luZCkge1xuICAgIHRoaXMudHJpZ2dlcihraW5kKyd0cmFja2NoYW5nZScpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFRoZSBiYXNlIGNsYXNzIGZvciBhbGwgdGV4dCB0cmFja3NcbiAqXG4gKiBIYW5kbGVzIHRoZSBwYXJzaW5nLCBoaWRpbmcsIGFuZCBzaG93aW5nIG9mIHRleHQgdHJhY2sgY3Vlc1xuICpcbiAqIEBwYXJhbSB7dmpzLlBsYXllcnxPYmplY3R9IHBsYXllclxuICogQHBhcmFtIHtPYmplY3Q9fSBvcHRpb25zXG4gKiBAY29uc3RydWN0b3JcbiAqL1xudmpzLlRleHRUcmFjayA9IHZqcy5Db21wb25lbnQuZXh0ZW5kKHtcbiAgLyoqIEBjb25zdHJ1Y3RvciAqL1xuICBpbml0OiBmdW5jdGlvbihwbGF5ZXIsIG9wdGlvbnMpe1xuICAgIHZqcy5Db21wb25lbnQuY2FsbCh0aGlzLCBwbGF5ZXIsIG9wdGlvbnMpO1xuXG4gICAgLy8gQXBwbHkgdHJhY2sgaW5mbyB0byB0cmFjayBvYmplY3RcbiAgICAvLyBPcHRpb25zIHdpbGwgb2Z0ZW4gYmUgYSB0cmFjayBlbGVtZW50XG5cbiAgICAvLyBCdWlsZCBJRCBpZiBvbmUgZG9lc24ndCBleGlzdFxuICAgIHRoaXMuaWRfID0gb3B0aW9uc1snaWQnXSB8fCAoJ3Zqc18nICsgb3B0aW9uc1sna2luZCddICsgJ18nICsgb3B0aW9uc1snbGFuZ3VhZ2UnXSArICdfJyArIHZqcy5ndWlkKyspO1xuICAgIHRoaXMuc3JjXyA9IG9wdGlvbnNbJ3NyYyddO1xuICAgIC8vICdkZWZhdWx0JyBpcyBhIHJlc2VydmVkIGtleXdvcmQgaW4ganMgc28gd2UgdXNlIGFuIGFiYnJldmlhdGVkIHZlcnNpb25cbiAgICB0aGlzLmRmbHRfID0gb3B0aW9uc1snZGVmYXVsdCddIHx8IG9wdGlvbnNbJ2RmbHQnXTtcbiAgICB0aGlzLnRpdGxlXyA9IG9wdGlvbnNbJ3RpdGxlJ107XG4gICAgdGhpcy5sYW5ndWFnZV8gPSBvcHRpb25zWydzcmNsYW5nJ107XG4gICAgdGhpcy5sYWJlbF8gPSBvcHRpb25zWydsYWJlbCddO1xuICAgIHRoaXMuY3Vlc18gPSBbXTtcbiAgICB0aGlzLmFjdGl2ZUN1ZXNfID0gW107XG4gICAgdGhpcy5yZWFkeVN0YXRlXyA9IDA7XG4gICAgdGhpcy5tb2RlXyA9IDA7XG5cbiAgICB0aGlzLnBsYXllcl8ub24oJ2Z1bGxzY3JlZW5jaGFuZ2UnLCB2anMuYmluZCh0aGlzLCB0aGlzLmFkanVzdEZvbnRTaXplKSk7XG4gIH1cbn0pO1xuXG4vKipcbiAqIFRyYWNrIGtpbmQgdmFsdWUuIENhcHRpb25zLCBzdWJ0aXRsZXMsIGV0Yy5cbiAqIEBwcml2YXRlXG4gKi9cbnZqcy5UZXh0VHJhY2sucHJvdG90eXBlLmtpbmRfO1xuXG4vKipcbiAqIEdldCB0aGUgdHJhY2sga2luZCB2YWx1ZVxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG52anMuVGV4dFRyYWNrLnByb3RvdHlwZS5raW5kID0gZnVuY3Rpb24oKXtcbiAgcmV0dXJuIHRoaXMua2luZF87XG59O1xuXG4vKipcbiAqIFRyYWNrIHNyYyB2YWx1ZVxuICogQHByaXZhdGVcbiAqL1xudmpzLlRleHRUcmFjay5wcm90b3R5cGUuc3JjXztcblxuLyoqXG4gKiBHZXQgdGhlIHRyYWNrIHNyYyB2YWx1ZVxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG52anMuVGV4dFRyYWNrLnByb3RvdHlwZS5zcmMgPSBmdW5jdGlvbigpe1xuICByZXR1cm4gdGhpcy5zcmNfO1xufTtcblxuLyoqXG4gKiBUcmFjayBkZWZhdWx0IHZhbHVlXG4gKiBJZiBkZWZhdWx0IGlzIHVzZWQsIHN1YnRpdGxlcy9jYXB0aW9ucyB0byBzdGFydCBzaG93aW5nXG4gKiBAcHJpdmF0ZVxuICovXG52anMuVGV4dFRyYWNrLnByb3RvdHlwZS5kZmx0XztcblxuLyoqXG4gKiBHZXQgdGhlIHRyYWNrIGRlZmF1bHQgdmFsdWUuICgnZGVmYXVsdCcgaXMgYSByZXNlcnZlZCBrZXl3b3JkKVxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqL1xudmpzLlRleHRUcmFjay5wcm90b3R5cGUuZGZsdCA9IGZ1bmN0aW9uKCl7XG4gIHJldHVybiB0aGlzLmRmbHRfO1xufTtcblxuLyoqXG4gKiBUcmFjayB0aXRsZSB2YWx1ZVxuICogQHByaXZhdGVcbiAqL1xudmpzLlRleHRUcmFjay5wcm90b3R5cGUudGl0bGVfO1xuXG4vKipcbiAqIEdldCB0aGUgdHJhY2sgdGl0bGUgdmFsdWVcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xudmpzLlRleHRUcmFjay5wcm90b3R5cGUudGl0bGUgPSBmdW5jdGlvbigpe1xuICByZXR1cm4gdGhpcy50aXRsZV87XG59O1xuXG4vKipcbiAqIExhbmd1YWdlIC0gdHdvIGxldHRlciBzdHJpbmcgdG8gcmVwcmVzZW50IHRyYWNrIGxhbmd1YWdlLCBlLmcuICdlbicgZm9yIEVuZ2xpc2hcbiAqIFNwZWMgZGVmOiByZWFkb25seSBhdHRyaWJ1dGUgRE9NU3RyaW5nIGxhbmd1YWdlO1xuICogQHByaXZhdGVcbiAqL1xudmpzLlRleHRUcmFjay5wcm90b3R5cGUubGFuZ3VhZ2VfO1xuXG4vKipcbiAqIEdldCB0aGUgdHJhY2sgbGFuZ3VhZ2UgdmFsdWVcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xudmpzLlRleHRUcmFjay5wcm90b3R5cGUubGFuZ3VhZ2UgPSBmdW5jdGlvbigpe1xuICByZXR1cm4gdGhpcy5sYW5ndWFnZV87XG59O1xuXG4vKipcbiAqIFRyYWNrIGxhYmVsIGUuZy4gJ0VuZ2xpc2gnXG4gKiBTcGVjIGRlZjogcmVhZG9ubHkgYXR0cmlidXRlIERPTVN0cmluZyBsYWJlbDtcbiAqIEBwcml2YXRlXG4gKi9cbnZqcy5UZXh0VHJhY2sucHJvdG90eXBlLmxhYmVsXztcblxuLyoqXG4gKiBHZXQgdGhlIHRyYWNrIGxhYmVsIHZhbHVlXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cbnZqcy5UZXh0VHJhY2sucHJvdG90eXBlLmxhYmVsID0gZnVuY3Rpb24oKXtcbiAgcmV0dXJuIHRoaXMubGFiZWxfO1xufTtcblxuLyoqXG4gKiBBbGwgY3VlcyBvZiB0aGUgdHJhY2suIEN1ZXMgaGF2ZSBhIHN0YXJ0VGltZSwgZW5kVGltZSwgdGV4dCwgYW5kIG90aGVyIHByb3BlcnRpZXMuXG4gKiBTcGVjIGRlZjogcmVhZG9ubHkgYXR0cmlidXRlIFRleHRUcmFja0N1ZUxpc3QgY3VlcztcbiAqIEBwcml2YXRlXG4gKi9cbnZqcy5UZXh0VHJhY2sucHJvdG90eXBlLmN1ZXNfO1xuXG4vKipcbiAqIEdldCB0aGUgdHJhY2sgY3Vlc1xuICogQHJldHVybiB7QXJyYXl9XG4gKi9cbnZqcy5UZXh0VHJhY2sucHJvdG90eXBlLmN1ZXMgPSBmdW5jdGlvbigpe1xuICByZXR1cm4gdGhpcy5jdWVzXztcbn07XG5cbi8qKlxuICogQWN0aXZlQ3VlcyBpcyBhbGwgY3VlcyB0aGF0IGFyZSBjdXJyZW50bHkgc2hvd2luZ1xuICogU3BlYyBkZWY6IHJlYWRvbmx5IGF0dHJpYnV0ZSBUZXh0VHJhY2tDdWVMaXN0IGFjdGl2ZUN1ZXM7XG4gKiBAcHJpdmF0ZVxuICovXG52anMuVGV4dFRyYWNrLnByb3RvdHlwZS5hY3RpdmVDdWVzXztcblxuLyoqXG4gKiBHZXQgdGhlIHRyYWNrIGFjdGl2ZSBjdWVzXG4gKiBAcmV0dXJuIHtBcnJheX1cbiAqL1xudmpzLlRleHRUcmFjay5wcm90b3R5cGUuYWN0aXZlQ3VlcyA9IGZ1bmN0aW9uKCl7XG4gIHJldHVybiB0aGlzLmFjdGl2ZUN1ZXNfO1xufTtcblxuLyoqXG4gKiBSZWFkeVN0YXRlIGRlc2NyaWJlcyBpZiB0aGUgdGV4dCBmaWxlIGhhcyBiZWVuIGxvYWRlZFxuICogY29uc3QgdW5zaWduZWQgc2hvcnQgTk9ORSA9IDA7XG4gKiBjb25zdCB1bnNpZ25lZCBzaG9ydCBMT0FESU5HID0gMTtcbiAqIGNvbnN0IHVuc2lnbmVkIHNob3J0IExPQURFRCA9IDI7XG4gKiBjb25zdCB1bnNpZ25lZCBzaG9ydCBFUlJPUiA9IDM7XG4gKiByZWFkb25seSBhdHRyaWJ1dGUgdW5zaWduZWQgc2hvcnQgcmVhZHlTdGF0ZTtcbiAqIEBwcml2YXRlXG4gKi9cbnZqcy5UZXh0VHJhY2sucHJvdG90eXBlLnJlYWR5U3RhdGVfO1xuXG4vKipcbiAqIEdldCB0aGUgdHJhY2sgcmVhZHlTdGF0ZVxuICogQHJldHVybiB7TnVtYmVyfVxuICovXG52anMuVGV4dFRyYWNrLnByb3RvdHlwZS5yZWFkeVN0YXRlID0gZnVuY3Rpb24oKXtcbiAgcmV0dXJuIHRoaXMucmVhZHlTdGF0ZV87XG59O1xuXG4vKipcbiAqIE1vZGUgZGVzY3JpYmVzIGlmIHRoZSB0cmFjayBpcyBzaG93aW5nLCBoaWRkZW4sIG9yIGRpc2FibGVkXG4gKiBjb25zdCB1bnNpZ25lZCBzaG9ydCBPRkYgPSAwO1xuICogY29uc3QgdW5zaWduZWQgc2hvcnQgSElEREVOID0gMTsgKHN0aWxsIHRyaWdnZXJpbmcgY3VlY2hhbmdlIGV2ZW50cywgYnV0IG5vdCB2aXNpYmxlKVxuICogY29uc3QgdW5zaWduZWQgc2hvcnQgU0hPV0lORyA9IDI7XG4gKiBhdHRyaWJ1dGUgdW5zaWduZWQgc2hvcnQgbW9kZTtcbiAqIEBwcml2YXRlXG4gKi9cbnZqcy5UZXh0VHJhY2sucHJvdG90eXBlLm1vZGVfO1xuXG4vKipcbiAqIEdldCB0aGUgdHJhY2sgbW9kZVxuICogQHJldHVybiB7TnVtYmVyfVxuICovXG52anMuVGV4dFRyYWNrLnByb3RvdHlwZS5tb2RlID0gZnVuY3Rpb24oKXtcbiAgcmV0dXJuIHRoaXMubW9kZV87XG59O1xuXG4vKipcbiAqIENoYW5nZSB0aGUgZm9udCBzaXplIG9mIHRoZSB0ZXh0IHRyYWNrIHRvIG1ha2UgaXQgbGFyZ2VyIHdoZW4gcGxheWluZyBpbiBmdWxsc2NyZWVuIG1vZGVcbiAqIGFuZCByZXN0b3JlIGl0IHRvIGl0cyBub3JtYWwgc2l6ZSB3aGVuIG5vdCBpbiBmdWxsc2NyZWVuIG1vZGUuXG4gKi9cbnZqcy5UZXh0VHJhY2sucHJvdG90eXBlLmFkanVzdEZvbnRTaXplID0gZnVuY3Rpb24oKXtcbiAgICBpZiAodGhpcy5wbGF5ZXJfLmlzRnVsbFNjcmVlbikge1xuICAgICAgICAvLyBTY2FsZSB0aGUgZm9udCBieSB0aGUgc2FtZSBmYWN0b3IgYXMgaW5jcmVhc2luZyB0aGUgdmlkZW8gd2lkdGggdG8gdGhlIGZ1bGwgc2NyZWVuIHdpbmRvdyB3aWR0aC5cbiAgICAgICAgLy8gQWRkaXRpb25hbGx5LCBtdWx0aXBseSB0aGF0IGZhY3RvciBieSAxLjQsIHdoaWNoIGlzIHRoZSBkZWZhdWx0IGZvbnQgc2l6ZSBmb3JcbiAgICAgICAgLy8gdGhlIGNhcHRpb24gdHJhY2sgKGZyb20gdGhlIENTUylcbiAgICAgICAgdGhpcy5lbF8uc3R5bGUuZm9udFNpemUgPSBzY3JlZW4ud2lkdGggLyB0aGlzLnBsYXllcl8ud2lkdGgoKSAqIDEuNCAqIDEwMCArICclJztcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBDaGFuZ2UgdGhlIGZvbnQgc2l6ZSBvZiB0aGUgdGV4dCB0cmFjayBiYWNrIHRvIGl0cyBvcmlnaW5hbCBub24tZnVsbHNjcmVlbiBzaXplXG4gICAgICAgIHRoaXMuZWxfLnN0eWxlLmZvbnRTaXplID0gJyc7XG4gICAgfVxufTtcblxuLyoqXG4gKiBDcmVhdGUgYmFzaWMgZGl2IHRvIGhvbGQgY3VlIHRleHRcbiAqIEByZXR1cm4ge0VsZW1lbnR9XG4gKi9cbnZqcy5UZXh0VHJhY2sucHJvdG90eXBlLmNyZWF0ZUVsID0gZnVuY3Rpb24oKXtcbiAgcmV0dXJuIHZqcy5Db21wb25lbnQucHJvdG90eXBlLmNyZWF0ZUVsLmNhbGwodGhpcywgJ2RpdicsIHtcbiAgICBjbGFzc05hbWU6ICd2anMtJyArIHRoaXMua2luZF8gKyAnIHZqcy10ZXh0LXRyYWNrJ1xuICB9KTtcbn07XG5cbi8qKlxuICogU2hvdzogTW9kZSBTaG93aW5nICgyKVxuICogSW5kaWNhdGVzIHRoYXQgdGhlIHRleHQgdHJhY2sgaXMgYWN0aXZlLiBJZiBubyBhdHRlbXB0IGhhcyB5ZXQgYmVlbiBtYWRlIHRvIG9idGFpbiB0aGUgdHJhY2sncyBjdWVzLCB0aGUgdXNlciBhZ2VudCB3aWxsIHBlcmZvcm0gc3VjaCBhbiBhdHRlbXB0IG1vbWVudGFyaWx5LlxuICogVGhlIHVzZXIgYWdlbnQgaXMgbWFpbnRhaW5pbmcgYSBsaXN0IG9mIHdoaWNoIGN1ZXMgYXJlIGFjdGl2ZSwgYW5kIGV2ZW50cyBhcmUgYmVpbmcgZmlyZWQgYWNjb3JkaW5nbHkuXG4gKiBJbiBhZGRpdGlvbiwgZm9yIHRleHQgdHJhY2tzIHdob3NlIGtpbmQgaXMgc3VidGl0bGVzIG9yIGNhcHRpb25zLCB0aGUgY3VlcyBhcmUgYmVpbmcgZGlzcGxheWVkIG92ZXIgdGhlIHZpZGVvIGFzIGFwcHJvcHJpYXRlO1xuICogZm9yIHRleHQgdHJhY2tzIHdob3NlIGtpbmQgaXMgZGVzY3JpcHRpb25zLCB0aGUgdXNlciBhZ2VudCBpcyBtYWtpbmcgdGhlIGN1ZXMgYXZhaWxhYmxlIHRvIHRoZSB1c2VyIGluIGEgbm9uLXZpc3VhbCBmYXNoaW9uO1xuICogYW5kIGZvciB0ZXh0IHRyYWNrcyB3aG9zZSBraW5kIGlzIGNoYXB0ZXJzLCB0aGUgdXNlciBhZ2VudCBpcyBtYWtpbmcgYXZhaWxhYmxlIHRvIHRoZSB1c2VyIGEgbWVjaGFuaXNtIGJ5IHdoaWNoIHRoZSB1c2VyIGNhbiBuYXZpZ2F0ZSB0byBhbnkgcG9pbnQgaW4gdGhlIG1lZGlhIHJlc291cmNlIGJ5IHNlbGVjdGluZyBhIGN1ZS5cbiAqIFRoZSBzaG93aW5nIGJ5IGRlZmF1bHQgc3RhdGUgaXMgdXNlZCBpbiBjb25qdW5jdGlvbiB3aXRoIHRoZSBkZWZhdWx0IGF0dHJpYnV0ZSBvbiB0cmFjayBlbGVtZW50cyB0byBpbmRpY2F0ZSB0aGF0IHRoZSB0ZXh0IHRyYWNrIHdhcyBlbmFibGVkIGR1ZSB0byB0aGF0IGF0dHJpYnV0ZS5cbiAqIFRoaXMgYWxsb3dzIHRoZSB1c2VyIGFnZW50IHRvIG92ZXJyaWRlIHRoZSBzdGF0ZSBpZiBhIGxhdGVyIHRyYWNrIGlzIGRpc2NvdmVyZWQgdGhhdCBpcyBtb3JlIGFwcHJvcHJpYXRlIHBlciB0aGUgdXNlcidzIHByZWZlcmVuY2VzLlxuICovXG52anMuVGV4dFRyYWNrLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24oKXtcbiAgdGhpcy5hY3RpdmF0ZSgpO1xuXG4gIHRoaXMubW9kZV8gPSAyO1xuXG4gIC8vIFNob3cgZWxlbWVudC5cbiAgdmpzLkNvbXBvbmVudC5wcm90b3R5cGUuc2hvdy5jYWxsKHRoaXMpO1xufTtcblxuLyoqXG4gKiBIaWRlOiBNb2RlIEhpZGRlbiAoMSlcbiAqIEluZGljYXRlcyB0aGF0IHRoZSB0ZXh0IHRyYWNrIGlzIGFjdGl2ZSwgYnV0IHRoYXQgdGhlIHVzZXIgYWdlbnQgaXMgbm90IGFjdGl2ZWx5IGRpc3BsYXlpbmcgdGhlIGN1ZXMuXG4gKiBJZiBubyBhdHRlbXB0IGhhcyB5ZXQgYmVlbiBtYWRlIHRvIG9idGFpbiB0aGUgdHJhY2sncyBjdWVzLCB0aGUgdXNlciBhZ2VudCB3aWxsIHBlcmZvcm0gc3VjaCBhbiBhdHRlbXB0IG1vbWVudGFyaWx5LlxuICogVGhlIHVzZXIgYWdlbnQgaXMgbWFpbnRhaW5pbmcgYSBsaXN0IG9mIHdoaWNoIGN1ZXMgYXJlIGFjdGl2ZSwgYW5kIGV2ZW50cyBhcmUgYmVpbmcgZmlyZWQgYWNjb3JkaW5nbHkuXG4gKi9cbnZqcy5UZXh0VHJhY2sucHJvdG90eXBlLmhpZGUgPSBmdW5jdGlvbigpe1xuICAvLyBXaGVuIGhpZGRlbiwgY3VlcyBhcmUgc3RpbGwgdHJpZ2dlcmVkLiBEaXNhYmxlIHRvIHN0b3AgdHJpZ2dlcmluZy5cbiAgdGhpcy5hY3RpdmF0ZSgpO1xuXG4gIHRoaXMubW9kZV8gPSAxO1xuXG4gIC8vIEhpZGUgZWxlbWVudC5cbiAgdmpzLkNvbXBvbmVudC5wcm90b3R5cGUuaGlkZS5jYWxsKHRoaXMpO1xufTtcblxuLyoqXG4gKiBEaXNhYmxlOiBNb2RlIE9mZi9EaXNhYmxlICgwKVxuICogSW5kaWNhdGVzIHRoYXQgdGhlIHRleHQgdHJhY2sgaXMgbm90IGFjdGl2ZS4gT3RoZXIgdGhhbiBmb3IgdGhlIHB1cnBvc2VzIG9mIGV4cG9zaW5nIHRoZSB0cmFjayBpbiB0aGUgRE9NLCB0aGUgdXNlciBhZ2VudCBpcyBpZ25vcmluZyB0aGUgdGV4dCB0cmFjay5cbiAqIE5vIGN1ZXMgYXJlIGFjdGl2ZSwgbm8gZXZlbnRzIGFyZSBmaXJlZCwgYW5kIHRoZSB1c2VyIGFnZW50IHdpbGwgbm90IGF0dGVtcHQgdG8gb2J0YWluIHRoZSB0cmFjaydzIGN1ZXMuXG4gKi9cbnZqcy5UZXh0VHJhY2sucHJvdG90eXBlLmRpc2FibGUgPSBmdW5jdGlvbigpe1xuICAvLyBJZiBzaG93aW5nLCBoaWRlLlxuICBpZiAodGhpcy5tb2RlXyA9PSAyKSB7IHRoaXMuaGlkZSgpOyB9XG5cbiAgLy8gU3RvcCB0cmlnZ2VyaW5nIGN1ZXNcbiAgdGhpcy5kZWFjdGl2YXRlKCk7XG5cbiAgLy8gU3dpdGNoIE1vZGUgdG8gT2ZmXG4gIHRoaXMubW9kZV8gPSAwO1xufTtcblxuLyoqXG4gKiBUdXJuIG9uIGN1ZSB0cmFja2luZy4gVHJhY2tzIHRoYXQgYXJlIHNob3dpbmcgT1IgaGlkZGVuIGFyZSBhY3RpdmUuXG4gKi9cbnZqcy5UZXh0VHJhY2sucHJvdG90eXBlLmFjdGl2YXRlID0gZnVuY3Rpb24oKXtcbiAgLy8gTG9hZCB0ZXh0IGZpbGUgaWYgaXQgaGFzbid0IGJlZW4geWV0LlxuICBpZiAodGhpcy5yZWFkeVN0YXRlXyA9PT0gMCkgeyB0aGlzLmxvYWQoKTsgfVxuXG4gIC8vIE9ubHkgYWN0aXZhdGUgaWYgbm90IGFscmVhZHkgYWN0aXZlLlxuICBpZiAodGhpcy5tb2RlXyA9PT0gMCkge1xuICAgIC8vIFVwZGF0ZSBjdXJyZW50IGN1ZSBvbiB0aW1ldXBkYXRlXG4gICAgLy8gVXNpbmcgdW5pcXVlIElEIGZvciBiaW5kIGZ1bmN0aW9uIHNvIG90aGVyIHRyYWNrcyBkb24ndCByZW1vdmUgbGlzdGVuZXJcbiAgICB0aGlzLnBsYXllcl8ub24oJ3RpbWV1cGRhdGUnLCB2anMuYmluZCh0aGlzLCB0aGlzLnVwZGF0ZSwgdGhpcy5pZF8pKTtcblxuICAgIC8vIFJlc2V0IGN1ZSB0aW1lIG9uIG1lZGlhIGVuZFxuICAgIHRoaXMucGxheWVyXy5vbignZW5kZWQnLCB2anMuYmluZCh0aGlzLCB0aGlzLnJlc2V0LCB0aGlzLmlkXykpO1xuXG4gICAgLy8gQWRkIHRvIGRpc3BsYXlcbiAgICBpZiAodGhpcy5raW5kXyA9PT0gJ2NhcHRpb25zJyB8fCB0aGlzLmtpbmRfID09PSAnc3VidGl0bGVzJykge1xuICAgICAgdGhpcy5wbGF5ZXJfLmdldENoaWxkKCd0ZXh0VHJhY2tEaXNwbGF5JykuYWRkQ2hpbGQodGhpcyk7XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIFR1cm4gb2ZmIGN1ZSB0cmFja2luZy5cbiAqL1xudmpzLlRleHRUcmFjay5wcm90b3R5cGUuZGVhY3RpdmF0ZSA9IGZ1bmN0aW9uKCl7XG4gIC8vIFVzaW5nIHVuaXF1ZSBJRCBmb3IgYmluZCBmdW5jdGlvbiBzbyBvdGhlciB0cmFja3MgZG9uJ3QgcmVtb3ZlIGxpc3RlbmVyXG4gIHRoaXMucGxheWVyXy5vZmYoJ3RpbWV1cGRhdGUnLCB2anMuYmluZCh0aGlzLCB0aGlzLnVwZGF0ZSwgdGhpcy5pZF8pKTtcbiAgdGhpcy5wbGF5ZXJfLm9mZignZW5kZWQnLCB2anMuYmluZCh0aGlzLCB0aGlzLnJlc2V0LCB0aGlzLmlkXykpO1xuICB0aGlzLnJlc2V0KCk7IC8vIFJlc2V0XG5cbiAgLy8gUmVtb3ZlIGZyb20gZGlzcGxheVxuICB0aGlzLnBsYXllcl8uZ2V0Q2hpbGQoJ3RleHRUcmFja0Rpc3BsYXknKS5yZW1vdmVDaGlsZCh0aGlzKTtcbn07XG5cbi8vIEEgcmVhZGluZXNzIHN0YXRlXG4vLyBPbmUgb2YgdGhlIGZvbGxvd2luZzpcbi8vXG4vLyBOb3QgbG9hZGVkXG4vLyBJbmRpY2F0ZXMgdGhhdCB0aGUgdGV4dCB0cmFjayBpcyBrbm93biB0byBleGlzdCAoZS5nLiBpdCBoYXMgYmVlbiBkZWNsYXJlZCB3aXRoIGEgdHJhY2sgZWxlbWVudCksIGJ1dCBpdHMgY3VlcyBoYXZlIG5vdCBiZWVuIG9idGFpbmVkLlxuLy9cbi8vIExvYWRpbmdcbi8vIEluZGljYXRlcyB0aGF0IHRoZSB0ZXh0IHRyYWNrIGlzIGxvYWRpbmcgYW5kIHRoZXJlIGhhdmUgYmVlbiBubyBmYXRhbCBlcnJvcnMgZW5jb3VudGVyZWQgc28gZmFyLiBGdXJ0aGVyIGN1ZXMgbWlnaHQgc3RpbGwgYmUgYWRkZWQgdG8gdGhlIHRyYWNrLlxuLy9cbi8vIExvYWRlZFxuLy8gSW5kaWNhdGVzIHRoYXQgdGhlIHRleHQgdHJhY2sgaGFzIGJlZW4gbG9hZGVkIHdpdGggbm8gZmF0YWwgZXJyb3JzLiBObyBuZXcgY3VlcyB3aWxsIGJlIGFkZGVkIHRvIHRoZSB0cmFjayBleGNlcHQgaWYgdGhlIHRleHQgdHJhY2sgY29ycmVzcG9uZHMgdG8gYSBNdXRhYmxlVGV4dFRyYWNrIG9iamVjdC5cbi8vXG4vLyBGYWlsZWQgdG8gbG9hZFxuLy8gSW5kaWNhdGVzIHRoYXQgdGhlIHRleHQgdHJhY2sgd2FzIGVuYWJsZWQsIGJ1dCB3aGVuIHRoZSB1c2VyIGFnZW50IGF0dGVtcHRlZCB0byBvYnRhaW4gaXQsIHRoaXMgZmFpbGVkIGluIHNvbWUgd2F5IChlLmcuIFVSTCBjb3VsZCBub3QgYmUgcmVzb2x2ZWQsIG5ldHdvcmsgZXJyb3IsIHVua25vd24gdGV4dCB0cmFjayBmb3JtYXQpLiBTb21lIG9yIGFsbCBvZiB0aGUgY3VlcyBhcmUgbGlrZWx5IG1pc3NpbmcgYW5kIHdpbGwgbm90IGJlIG9idGFpbmVkLlxudmpzLlRleHRUcmFjay5wcm90b3R5cGUubG9hZCA9IGZ1bmN0aW9uKCl7XG5cbiAgLy8gT25seSBsb2FkIGlmIG5vdCBsb2FkZWQgeWV0LlxuICBpZiAodGhpcy5yZWFkeVN0YXRlXyA9PT0gMCkge1xuICAgIHRoaXMucmVhZHlTdGF0ZV8gPSAxO1xuICAgIHZqcy5nZXQodGhpcy5zcmNfLCB2anMuYmluZCh0aGlzLCB0aGlzLnBhcnNlQ3VlcyksIHZqcy5iaW5kKHRoaXMsIHRoaXMub25FcnJvcikpO1xuICB9XG5cbn07XG5cbnZqcy5UZXh0VHJhY2sucHJvdG90eXBlLm9uRXJyb3IgPSBmdW5jdGlvbihlcnIpe1xuICB0aGlzLmVycm9yID0gZXJyO1xuICB0aGlzLnJlYWR5U3RhdGVfID0gMztcbiAgdGhpcy50cmlnZ2VyKCdlcnJvcicpO1xufTtcblxuLy8gUGFyc2UgdGhlIFdlYlZUVCB0ZXh0IGZvcm1hdCBmb3IgY3VlIHRpbWVzLlxuLy8gVE9ETzogU2VwYXJhdGUgcGFyc2VyIGludG8gb3duIGNsYXNzIHNvIGFsdGVybmF0aXZlIHRpbWVkIHRleHQgZm9ybWF0cyBjYW4gYmUgdXNlZC4gKFRUTUwsIERGWFApXG52anMuVGV4dFRyYWNrLnByb3RvdHlwZS5wYXJzZUN1ZXMgPSBmdW5jdGlvbihzcmNDb250ZW50KSB7XG4gIHZhciBjdWUsIHRpbWUsIHRleHQsXG4gICAgICBsaW5lcyA9IHNyY0NvbnRlbnQuc3BsaXQoJ1xcbicpLFxuICAgICAgbGluZSA9ICcnLCBpZDtcblxuICBmb3IgKHZhciBpPTEsIGo9bGluZXMubGVuZ3RoOyBpPGo7IGkrKykge1xuICAgIC8vIExpbmUgMCBzaG91bGQgYmUgJ1dFQlZUVCcsIHNvIHNraXBwaW5nIGk9MFxuXG4gICAgbGluZSA9IHZqcy50cmltKGxpbmVzW2ldKTsgLy8gVHJpbSB3aGl0ZXNwYWNlIGFuZCBsaW5lYnJlYWtzXG5cbiAgICBpZiAobGluZSkgeyAvLyBMb29wIHVudGlsIGEgbGluZSB3aXRoIGNvbnRlbnRcblxuICAgICAgLy8gRmlyc3QgbGluZSBjb3VsZCBiZSBhbiBvcHRpb25hbCBjdWUgSURcbiAgICAgIC8vIENoZWNrIGlmIGxpbmUgaGFzIHRoZSB0aW1lIHNlcGFyYXRvclxuICAgICAgaWYgKGxpbmUuaW5kZXhPZignLS0+JykgPT0gLTEpIHtcbiAgICAgICAgaWQgPSBsaW5lO1xuICAgICAgICAvLyBBZHZhbmNlIHRvIG5leHQgbGluZSBmb3IgdGltaW5nLlxuICAgICAgICBsaW5lID0gdmpzLnRyaW0obGluZXNbKytpXSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZCA9IHRoaXMuY3Vlc18ubGVuZ3RoO1xuICAgICAgfVxuXG4gICAgICAvLyBGaXJzdCBsaW5lIC0gTnVtYmVyXG4gICAgICBjdWUgPSB7XG4gICAgICAgIGlkOiBpZCwgLy8gQ3VlIE51bWJlclxuICAgICAgICBpbmRleDogdGhpcy5jdWVzXy5sZW5ndGggLy8gUG9zaXRpb24gaW4gQXJyYXlcbiAgICAgIH07XG5cbiAgICAgIC8vIFRpbWluZyBsaW5lXG4gICAgICB0aW1lID0gbGluZS5zcGxpdCgnIC0tPiAnKTtcbiAgICAgIGN1ZS5zdGFydFRpbWUgPSB0aGlzLnBhcnNlQ3VlVGltZSh0aW1lWzBdKTtcbiAgICAgIGN1ZS5lbmRUaW1lID0gdGhpcy5wYXJzZUN1ZVRpbWUodGltZVsxXSk7XG5cbiAgICAgIC8vIEFkZGl0aW9uYWwgbGluZXMgLSBDdWUgVGV4dFxuICAgICAgdGV4dCA9IFtdO1xuXG4gICAgICAvLyBMb29wIHVudGlsIGEgYmxhbmsgbGluZSBvciBlbmQgb2YgbGluZXNcbiAgICAgIC8vIEFzc3VtZWluZyB0cmltKCcnKSByZXR1cm5zIGZhbHNlIGZvciBibGFuayBsaW5lc1xuICAgICAgd2hpbGUgKGxpbmVzWysraV0gJiYgKGxpbmUgPSB2anMudHJpbShsaW5lc1tpXSkpKSB7XG4gICAgICAgIHRleHQucHVzaChsaW5lKTtcbiAgICAgIH1cblxuICAgICAgY3VlLnRleHQgPSB0ZXh0LmpvaW4oJzxici8+Jyk7XG5cbiAgICAgIC8vIEFkZCB0aGlzIGN1ZVxuICAgICAgdGhpcy5jdWVzXy5wdXNoKGN1ZSk7XG4gICAgfVxuICB9XG5cbiAgdGhpcy5yZWFkeVN0YXRlXyA9IDI7XG4gIHRoaXMudHJpZ2dlcignbG9hZGVkJyk7XG59O1xuXG5cbnZqcy5UZXh0VHJhY2sucHJvdG90eXBlLnBhcnNlQ3VlVGltZSA9IGZ1bmN0aW9uKHRpbWVUZXh0KSB7XG4gIHZhciBwYXJ0cyA9IHRpbWVUZXh0LnNwbGl0KCc6JyksXG4gICAgICB0aW1lID0gMCxcbiAgICAgIGhvdXJzLCBtaW51dGVzLCBvdGhlciwgc2Vjb25kcywgbXM7XG5cbiAgLy8gQ2hlY2sgaWYgb3B0aW9uYWwgaG91cnMgcGxhY2UgaXMgaW5jbHVkZWRcbiAgLy8gMDA6MDA6MDAuMDAwIHZzLiAwMDowMC4wMDBcbiAgaWYgKHBhcnRzLmxlbmd0aCA9PSAzKSB7XG4gICAgaG91cnMgPSBwYXJ0c1swXTtcbiAgICBtaW51dGVzID0gcGFydHNbMV07XG4gICAgb3RoZXIgPSBwYXJ0c1syXTtcbiAgfSBlbHNlIHtcbiAgICBob3VycyA9IDA7XG4gICAgbWludXRlcyA9IHBhcnRzWzBdO1xuICAgIG90aGVyID0gcGFydHNbMV07XG4gIH1cblxuICAvLyBCcmVhayBvdGhlciAoc2Vjb25kcywgbWlsbGlzZWNvbmRzLCBhbmQgZmxhZ3MpIGJ5IHNwYWNlc1xuICAvLyBUT0RPOiBNYWtlIGFkZGl0aW9uYWwgY3VlIGxheW91dCBzZXR0aW5ncyB3b3JrIHdpdGggZmxhZ3NcbiAgb3RoZXIgPSBvdGhlci5zcGxpdCgvXFxzKy8pO1xuICAvLyBSZW1vdmUgc2Vjb25kcy4gU2Vjb25kcyBpcyB0aGUgZmlyc3QgcGFydCBiZWZvcmUgYW55IHNwYWNlcy5cbiAgc2Vjb25kcyA9IG90aGVyLnNwbGljZSgwLDEpWzBdO1xuICAvLyBDb3VsZCB1c2UgZWl0aGVyIC4gb3IgLCBmb3IgZGVjaW1hbFxuICBzZWNvbmRzID0gc2Vjb25kcy5zcGxpdCgvXFwufCwvKTtcbiAgLy8gR2V0IG1pbGxpc2Vjb25kc1xuICBtcyA9IHBhcnNlRmxvYXQoc2Vjb25kc1sxXSk7XG4gIHNlY29uZHMgPSBzZWNvbmRzWzBdO1xuXG4gIC8vIGhvdXJzID0+IHNlY29uZHNcbiAgdGltZSArPSBwYXJzZUZsb2F0KGhvdXJzKSAqIDM2MDA7XG4gIC8vIG1pbnV0ZXMgPT4gc2Vjb25kc1xuICB0aW1lICs9IHBhcnNlRmxvYXQobWludXRlcykgKiA2MDtcbiAgLy8gQWRkIHNlY29uZHNcbiAgdGltZSArPSBwYXJzZUZsb2F0KHNlY29uZHMpO1xuICAvLyBBZGQgbWlsbGlzZWNvbmRzXG4gIGlmIChtcykgeyB0aW1lICs9IG1zLzEwMDA7IH1cblxuICByZXR1cm4gdGltZTtcbn07XG5cbi8vIFVwZGF0ZSBhY3RpdmUgY3VlcyB3aGVuZXZlciB0aW1ldXBkYXRlIGV2ZW50cyBhcmUgdHJpZ2dlcmVkIG9uIHRoZSBwbGF5ZXIuXG52anMuVGV4dFRyYWNrLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbigpe1xuICBpZiAodGhpcy5jdWVzXy5sZW5ndGggPiAwKSB7XG5cbiAgICAvLyBHZXQgY3VyZW50IHBsYXllciB0aW1lXG4gICAgdmFyIHRpbWUgPSB0aGlzLnBsYXllcl8uY3VycmVudFRpbWUoKTtcblxuICAgIC8vIENoZWNrIGlmIHRoZSBuZXcgdGltZSBpcyBvdXRzaWRlIHRoZSB0aW1lIGJveCBjcmVhdGVkIGJ5IHRoZSB0aGUgbGFzdCB1cGRhdGUuXG4gICAgaWYgKHRoaXMucHJldkNoYW5nZSA9PT0gdW5kZWZpbmVkIHx8IHRpbWUgPCB0aGlzLnByZXZDaGFuZ2UgfHwgdGhpcy5uZXh0Q2hhbmdlIDw9IHRpbWUpIHtcbiAgICAgIHZhciBjdWVzID0gdGhpcy5jdWVzXyxcblxuICAgICAgICAgIC8vIENyZWF0ZSBhIG5ldyB0aW1lIGJveCBmb3IgdGhpcyBzdGF0ZS5cbiAgICAgICAgICBuZXdOZXh0Q2hhbmdlID0gdGhpcy5wbGF5ZXJfLmR1cmF0aW9uKCksIC8vIFN0YXJ0IGF0IGJlZ2lubmluZyBvZiB0aGUgdGltZWxpbmVcbiAgICAgICAgICBuZXdQcmV2Q2hhbmdlID0gMCwgLy8gU3RhcnQgYXQgZW5kXG5cbiAgICAgICAgICByZXZlcnNlID0gZmFsc2UsIC8vIFNldCB0aGUgZGlyZWN0aW9uIG9mIHRoZSBsb29wIHRocm91Z2ggdGhlIGN1ZXMuIE9wdGltaXplZCB0aGUgY3VlIGNoZWNrLlxuICAgICAgICAgIG5ld0N1ZXMgPSBbXSwgLy8gU3RvcmUgbmV3IGFjdGl2ZSBjdWVzLlxuXG4gICAgICAgICAgLy8gU3RvcmUgd2hlcmUgaW4gdGhlIGxvb3AgdGhlIGN1cnJlbnQgYWN0aXZlIGN1ZXMgYXJlLCB0byBwcm92aWRlIGEgc21hcnQgc3RhcnRpbmcgcG9pbnQgZm9yIHRoZSBuZXh0IGxvb3AuXG4gICAgICAgICAgZmlyc3RBY3RpdmVJbmRleCwgbGFzdEFjdGl2ZUluZGV4LFxuICAgICAgICAgIGN1ZSwgaTsgLy8gTG9vcCB2YXJzXG5cbiAgICAgIC8vIENoZWNrIGlmIHRpbWUgaXMgZ29pbmcgZm9yd2FyZHMgb3IgYmFja3dhcmRzIChzY3J1YmJpbmcvcmV3aW5kaW5nKVxuICAgICAgLy8gSWYgd2Uga25vdyB0aGUgZGlyZWN0aW9uIHdlIGNhbiBvcHRpbWl6ZSB0aGUgc3RhcnRpbmcgcG9zaXRpb24gYW5kIGRpcmVjdGlvbiBvZiB0aGUgbG9vcCB0aHJvdWdoIHRoZSBjdWVzIGFycmF5LlxuICAgICAgaWYgKHRpbWUgPj0gdGhpcy5uZXh0Q2hhbmdlIHx8IHRoaXMubmV4dENoYW5nZSA9PT0gdW5kZWZpbmVkKSB7IC8vIE5leHRDaGFuZ2Ugc2hvdWxkIGhhcHBlblxuICAgICAgICAvLyBGb3J3YXJkcywgc28gc3RhcnQgYXQgdGhlIGluZGV4IG9mIHRoZSBmaXJzdCBhY3RpdmUgY3VlIGFuZCBsb29wIGZvcndhcmRcbiAgICAgICAgaSA9ICh0aGlzLmZpcnN0QWN0aXZlSW5kZXggIT09IHVuZGVmaW5lZCkgPyB0aGlzLmZpcnN0QWN0aXZlSW5kZXggOiAwO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gQmFja3dhcmRzLCBzbyBzdGFydCBhdCB0aGUgaW5kZXggb2YgdGhlIGxhc3QgYWN0aXZlIGN1ZSBhbmQgbG9vcCBiYWNrd2FyZFxuICAgICAgICByZXZlcnNlID0gdHJ1ZTtcbiAgICAgICAgaSA9ICh0aGlzLmxhc3RBY3RpdmVJbmRleCAhPT0gdW5kZWZpbmVkKSA/IHRoaXMubGFzdEFjdGl2ZUluZGV4IDogY3Vlcy5sZW5ndGggLSAxO1xuICAgICAgfVxuXG4gICAgICB3aGlsZSAodHJ1ZSkgeyAvLyBMb29wIHVudGlsIGJyb2tlblxuICAgICAgICBjdWUgPSBjdWVzW2ldO1xuXG4gICAgICAgIC8vIEN1ZSBlbmRlZCBhdCB0aGlzIHBvaW50XG4gICAgICAgIGlmIChjdWUuZW5kVGltZSA8PSB0aW1lKSB7XG4gICAgICAgICAgbmV3UHJldkNoYW5nZSA9IE1hdGgubWF4KG5ld1ByZXZDaGFuZ2UsIGN1ZS5lbmRUaW1lKTtcblxuICAgICAgICAgIGlmIChjdWUuYWN0aXZlKSB7XG4gICAgICAgICAgICBjdWUuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gTm8gZWFybGllciBjdWVzIHNob3VsZCBoYXZlIGFuIGFjdGl2ZSBzdGFydCB0aW1lLlxuICAgICAgICAgIC8vIE5ldmVybWluZC4gQXNzdW1lIGZpcnN0IGN1ZSBjb3VsZCBoYXZlIGEgZHVyYXRpb24gdGhlIHNhbWUgYXMgdGhlIHZpZGVvLlxuICAgICAgICAgIC8vIEluIHRoYXQgY2FzZSB3ZSBuZWVkIHRvIGxvb3AgYWxsIHRoZSB3YXkgYmFjayB0byB0aGUgYmVnaW5uaW5nLlxuICAgICAgICAgIC8vIGlmIChyZXZlcnNlICYmIGN1ZS5zdGFydFRpbWUpIHsgYnJlYWs7IH1cblxuICAgICAgICAvLyBDdWUgaGFzbid0IHN0YXJ0ZWRcbiAgICAgICAgfSBlbHNlIGlmICh0aW1lIDwgY3VlLnN0YXJ0VGltZSkge1xuICAgICAgICAgIG5ld05leHRDaGFuZ2UgPSBNYXRoLm1pbihuZXdOZXh0Q2hhbmdlLCBjdWUuc3RhcnRUaW1lKTtcblxuICAgICAgICAgIGlmIChjdWUuYWN0aXZlKSB7XG4gICAgICAgICAgICBjdWUuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gTm8gbGF0ZXIgY3VlcyBzaG91bGQgaGF2ZSBhbiBhY3RpdmUgc3RhcnQgdGltZS5cbiAgICAgICAgICBpZiAoIXJldmVyc2UpIHsgYnJlYWs7IH1cblxuICAgICAgICAvLyBDdWUgaXMgY3VycmVudFxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgaWYgKHJldmVyc2UpIHtcbiAgICAgICAgICAgIC8vIEFkZCBjdWUgdG8gZnJvbnQgb2YgYXJyYXkgdG8ga2VlcCBpbiB0aW1lIG9yZGVyXG4gICAgICAgICAgICBuZXdDdWVzLnNwbGljZSgwLDAsY3VlKTtcblxuICAgICAgICAgICAgLy8gSWYgaW4gcmV2ZXJzZSwgdGhlIGZpcnN0IGN1cnJlbnQgY3VlIGlzIG91ciBsYXN0QWN0aXZlQ3VlXG4gICAgICAgICAgICBpZiAobGFzdEFjdGl2ZUluZGV4ID09PSB1bmRlZmluZWQpIHsgbGFzdEFjdGl2ZUluZGV4ID0gaTsgfVxuICAgICAgICAgICAgZmlyc3RBY3RpdmVJbmRleCA9IGk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIEFkZCBjdWUgdG8gZW5kIG9mIGFycmF5XG4gICAgICAgICAgICBuZXdDdWVzLnB1c2goY3VlKTtcblxuICAgICAgICAgICAgLy8gSWYgZm9yd2FyZCwgdGhlIGZpcnN0IGN1cnJlbnQgY3VlIGlzIG91ciBmaXJzdEFjdGl2ZUluZGV4XG4gICAgICAgICAgICBpZiAoZmlyc3RBY3RpdmVJbmRleCA9PT0gdW5kZWZpbmVkKSB7IGZpcnN0QWN0aXZlSW5kZXggPSBpOyB9XG4gICAgICAgICAgICBsYXN0QWN0aXZlSW5kZXggPSBpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIG5ld05leHRDaGFuZ2UgPSBNYXRoLm1pbihuZXdOZXh0Q2hhbmdlLCBjdWUuZW5kVGltZSk7XG4gICAgICAgICAgbmV3UHJldkNoYW5nZSA9IE1hdGgubWF4KG5ld1ByZXZDaGFuZ2UsIGN1ZS5zdGFydFRpbWUpO1xuXG4gICAgICAgICAgY3VlLmFjdGl2ZSA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocmV2ZXJzZSkge1xuICAgICAgICAgIC8vIFJldmVyc2UgZG93biB0aGUgYXJyYXkgb2YgY3VlcywgYnJlYWsgaWYgYXQgZmlyc3RcbiAgICAgICAgICBpZiAoaSA9PT0gMCkgeyBicmVhazsgfSBlbHNlIHsgaS0tOyB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gV2FsayB1cCB0aGUgYXJyYXkgZm8gY3VlcywgYnJlYWsgaWYgYXQgbGFzdFxuICAgICAgICAgIGlmIChpID09PSBjdWVzLmxlbmd0aCAtIDEpIHsgYnJlYWs7IH0gZWxzZSB7IGkrKzsgfVxuICAgICAgICB9XG5cbiAgICAgIH1cblxuICAgICAgdGhpcy5hY3RpdmVDdWVzXyA9IG5ld0N1ZXM7XG4gICAgICB0aGlzLm5leHRDaGFuZ2UgPSBuZXdOZXh0Q2hhbmdlO1xuICAgICAgdGhpcy5wcmV2Q2hhbmdlID0gbmV3UHJldkNoYW5nZTtcbiAgICAgIHRoaXMuZmlyc3RBY3RpdmVJbmRleCA9IGZpcnN0QWN0aXZlSW5kZXg7XG4gICAgICB0aGlzLmxhc3RBY3RpdmVJbmRleCA9IGxhc3RBY3RpdmVJbmRleDtcblxuICAgICAgdGhpcy51cGRhdGVEaXNwbGF5KCk7XG5cbiAgICAgIHRoaXMudHJpZ2dlcignY3VlY2hhbmdlJyk7XG4gICAgfVxuICB9XG59O1xuXG4vLyBBZGQgY3VlIEhUTUwgdG8gZGlzcGxheVxudmpzLlRleHRUcmFjay5wcm90b3R5cGUudXBkYXRlRGlzcGxheSA9IGZ1bmN0aW9uKCl7XG4gIHZhciBjdWVzID0gdGhpcy5hY3RpdmVDdWVzXyxcbiAgICAgIGh0bWwgPSAnJyxcbiAgICAgIGk9MCxqPWN1ZXMubGVuZ3RoO1xuXG4gIGZvciAoO2k8ajtpKyspIHtcbiAgICBodG1sICs9ICc8c3BhbiBjbGFzcz1cInZqcy10dC1jdWVcIj4nK2N1ZXNbaV0udGV4dCsnPC9zcGFuPic7XG4gIH1cblxuICB0aGlzLmVsXy5pbm5lckhUTUwgPSBodG1sO1xufTtcblxuLy8gU2V0IGFsbCBsb29wIGhlbHBlciB2YWx1ZXMgYmFja1xudmpzLlRleHRUcmFjay5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbigpe1xuICB0aGlzLm5leHRDaGFuZ2UgPSAwO1xuICB0aGlzLnByZXZDaGFuZ2UgPSB0aGlzLnBsYXllcl8uZHVyYXRpb24oKTtcbiAgdGhpcy5maXJzdEFjdGl2ZUluZGV4ID0gMDtcbiAgdGhpcy5sYXN0QWN0aXZlSW5kZXggPSAwO1xufTtcblxuLy8gQ3JlYXRlIHNwZWNpZmljIHRyYWNrIHR5cGVzXG4vKipcbiAqIFRoZSB0cmFjayBjb21wb25lbnQgZm9yIG1hbmFnaW5nIHRoZSBoaWRpbmcgYW5kIHNob3dpbmcgb2YgY2FwdGlvbnNcbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqL1xudmpzLkNhcHRpb25zVHJhY2sgPSB2anMuVGV4dFRyYWNrLmV4dGVuZCgpO1xudmpzLkNhcHRpb25zVHJhY2sucHJvdG90eXBlLmtpbmRfID0gJ2NhcHRpb25zJztcbi8vIEV4cG9ydGluZyBoZXJlIGJlY2F1c2UgVHJhY2sgY3JlYXRpb24gcmVxdWlyZXMgdGhlIHRyYWNrIGtpbmRcbi8vIHRvIGJlIGF2YWlsYWJsZSBvbiBnbG9iYWwgb2JqZWN0LiBlLmcuIG5ldyB3aW5kb3dbJ3ZpZGVvanMnXVtLaW5kICsgJ1RyYWNrJ11cblxuLyoqXG4gKiBUaGUgdHJhY2sgY29tcG9uZW50IGZvciBtYW5hZ2luZyB0aGUgaGlkaW5nIGFuZCBzaG93aW5nIG9mIHN1YnRpdGxlc1xuICpcbiAqIEBjb25zdHJ1Y3RvclxuICovXG52anMuU3VidGl0bGVzVHJhY2sgPSB2anMuVGV4dFRyYWNrLmV4dGVuZCgpO1xudmpzLlN1YnRpdGxlc1RyYWNrLnByb3RvdHlwZS5raW5kXyA9ICdzdWJ0aXRsZXMnO1xuXG4vKipcbiAqIFRoZSB0cmFjayBjb21wb25lbnQgZm9yIG1hbmFnaW5nIHRoZSBoaWRpbmcgYW5kIHNob3dpbmcgb2YgY2hhcHRlcnNcbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqL1xudmpzLkNoYXB0ZXJzVHJhY2sgPSB2anMuVGV4dFRyYWNrLmV4dGVuZCgpO1xudmpzLkNoYXB0ZXJzVHJhY2sucHJvdG90eXBlLmtpbmRfID0gJ2NoYXB0ZXJzJztcblxuXG4vKiBUZXh0IFRyYWNrIERpc3BsYXlcbj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovXG4vLyBHbG9iYWwgY29udGFpbmVyIGZvciBib3RoIHN1YnRpdGxlIGFuZCBjYXB0aW9ucyB0ZXh0LiBTaW1wbGUgZGl2IGNvbnRhaW5lci5cblxuLyoqXG4gKiBUaGUgY29tcG9uZW50IGZvciBkaXNwbGF5aW5nIHRleHQgdHJhY2sgY3Vlc1xuICpcbiAqIEBjb25zdHJ1Y3RvclxuICovXG52anMuVGV4dFRyYWNrRGlzcGxheSA9IHZqcy5Db21wb25lbnQuZXh0ZW5kKHtcbiAgLyoqIEBjb25zdHJ1Y3RvciAqL1xuICBpbml0OiBmdW5jdGlvbihwbGF5ZXIsIG9wdGlvbnMsIHJlYWR5KXtcbiAgICB2anMuQ29tcG9uZW50LmNhbGwodGhpcywgcGxheWVyLCBvcHRpb25zLCByZWFkeSk7XG5cbiAgICAvLyBUaGlzIHVzZWQgdG8gYmUgY2FsbGVkIGR1cmluZyBwbGF5ZXIgaW5pdCwgYnV0IHdhcyBjYXVzaW5nIGFuIGVycm9yXG4gICAgLy8gaWYgYSB0cmFjayBzaG91bGQgc2hvdyBieSBkZWZhdWx0IGFuZCB0aGUgZGlzcGxheSBoYWRuJ3QgbG9hZGVkIHlldC5cbiAgICAvLyBTaG91bGQgcHJvYmFibHkgYmUgbW92ZWQgdG8gYW4gZXh0ZXJuYWwgdHJhY2sgbG9hZGVyIHdoZW4gd2Ugc3VwcG9ydFxuICAgIC8vIHRyYWNrcyB0aGF0IGRvbid0IG5lZWQgYSBkaXNwbGF5LlxuICAgIGlmIChwbGF5ZXIub3B0aW9uc19bJ3RyYWNrcyddICYmIHBsYXllci5vcHRpb25zX1sndHJhY2tzJ10ubGVuZ3RoID4gMCkge1xuICAgICAgdGhpcy5wbGF5ZXJfLmFkZFRleHRUcmFja3MocGxheWVyLm9wdGlvbnNfWyd0cmFja3MnXSk7XG4gICAgfVxuICB9XG59KTtcblxudmpzLlRleHRUcmFja0Rpc3BsYXkucHJvdG90eXBlLmNyZWF0ZUVsID0gZnVuY3Rpb24oKXtcbiAgcmV0dXJuIHZqcy5Db21wb25lbnQucHJvdG90eXBlLmNyZWF0ZUVsLmNhbGwodGhpcywgJ2RpdicsIHtcbiAgICBjbGFzc05hbWU6ICd2anMtdGV4dC10cmFjay1kaXNwbGF5J1xuICB9KTtcbn07XG5cblxuLyoqXG4gKiBUaGUgc3BlY2lmaWMgbWVudSBpdGVtIHR5cGUgZm9yIHNlbGVjdGluZyBhIGxhbmd1YWdlIHdpdGhpbiBhIHRleHQgdHJhY2sga2luZFxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICovXG52anMuVGV4dFRyYWNrTWVudUl0ZW0gPSB2anMuTWVudUl0ZW0uZXh0ZW5kKHtcbiAgLyoqIEBjb25zdHJ1Y3RvciAqL1xuICBpbml0OiBmdW5jdGlvbihwbGF5ZXIsIG9wdGlvbnMpe1xuICAgIHZhciB0cmFjayA9IHRoaXMudHJhY2sgPSBvcHRpb25zWyd0cmFjayddO1xuXG4gICAgLy8gTW9kaWZ5IG9wdGlvbnMgZm9yIHBhcmVudCBNZW51SXRlbSBjbGFzcydzIGluaXQuXG4gICAgb3B0aW9uc1snbGFiZWwnXSA9IHRyYWNrLmxhYmVsKCk7XG4gICAgb3B0aW9uc1snc2VsZWN0ZWQnXSA9IHRyYWNrLmRmbHQoKTtcbiAgICB2anMuTWVudUl0ZW0uY2FsbCh0aGlzLCBwbGF5ZXIsIG9wdGlvbnMpO1xuXG4gICAgdGhpcy5wbGF5ZXJfLm9uKHRyYWNrLmtpbmQoKSArICd0cmFja2NoYW5nZScsIHZqcy5iaW5kKHRoaXMsIHRoaXMudXBkYXRlKSk7XG4gIH1cbn0pO1xuXG52anMuVGV4dFRyYWNrTWVudUl0ZW0ucHJvdG90eXBlLm9uQ2xpY2sgPSBmdW5jdGlvbigpe1xuICB2anMuTWVudUl0ZW0ucHJvdG90eXBlLm9uQ2xpY2suY2FsbCh0aGlzKTtcbiAgdGhpcy5wbGF5ZXJfLnNob3dUZXh0VHJhY2sodGhpcy50cmFjay5pZF8sIHRoaXMudHJhY2sua2luZCgpKTtcbn07XG5cbnZqcy5UZXh0VHJhY2tNZW51SXRlbS5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24oKXtcbiAgdGhpcy5zZWxlY3RlZCh0aGlzLnRyYWNrLm1vZGUoKSA9PSAyKTtcbn07XG5cbi8qKlxuICogQSBzcGVjaWFsIG1lbnUgaXRlbSBmb3IgdHVybmluZyBvZiBhIHNwZWNpZmljIHR5cGUgb2YgdGV4dCB0cmFja1xuICpcbiAqIEBjb25zdHJ1Y3RvclxuICovXG52anMuT2ZmVGV4dFRyYWNrTWVudUl0ZW0gPSB2anMuVGV4dFRyYWNrTWVudUl0ZW0uZXh0ZW5kKHtcbiAgLyoqIEBjb25zdHJ1Y3RvciAqL1xuICBpbml0OiBmdW5jdGlvbihwbGF5ZXIsIG9wdGlvbnMpe1xuICAgIC8vIENyZWF0ZSBwc2V1ZG8gdHJhY2sgaW5mb1xuICAgIC8vIFJlcXVpcmVzIG9wdGlvbnNbJ2tpbmQnXVxuICAgIG9wdGlvbnNbJ3RyYWNrJ10gPSB7XG4gICAgICBraW5kOiBmdW5jdGlvbigpIHsgcmV0dXJuIG9wdGlvbnNbJ2tpbmQnXTsgfSxcbiAgICAgIHBsYXllcjogcGxheWVyLFxuICAgICAgbGFiZWw6IGZ1bmN0aW9uKCl7IHJldHVybiBvcHRpb25zWydraW5kJ10gKyAnIG9mZic7IH0sXG4gICAgICBkZmx0OiBmdW5jdGlvbigpeyByZXR1cm4gZmFsc2U7IH0sXG4gICAgICBtb2RlOiBmdW5jdGlvbigpeyByZXR1cm4gZmFsc2U7IH1cbiAgICB9O1xuICAgIHZqcy5UZXh0VHJhY2tNZW51SXRlbS5jYWxsKHRoaXMsIHBsYXllciwgb3B0aW9ucyk7XG4gICAgdGhpcy5zZWxlY3RlZCh0cnVlKTtcbiAgfVxufSk7XG5cbnZqcy5PZmZUZXh0VHJhY2tNZW51SXRlbS5wcm90b3R5cGUub25DbGljayA9IGZ1bmN0aW9uKCl7XG4gIHZqcy5UZXh0VHJhY2tNZW51SXRlbS5wcm90b3R5cGUub25DbGljay5jYWxsKHRoaXMpO1xuICB0aGlzLnBsYXllcl8uc2hvd1RleHRUcmFjayh0aGlzLnRyYWNrLmlkXywgdGhpcy50cmFjay5raW5kKCkpO1xufTtcblxudmpzLk9mZlRleHRUcmFja01lbnVJdGVtLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbigpe1xuICB2YXIgdHJhY2tzID0gdGhpcy5wbGF5ZXJfLnRleHRUcmFja3MoKSxcbiAgICAgIGk9MCwgaj10cmFja3MubGVuZ3RoLCB0cmFjayxcbiAgICAgIG9mZiA9IHRydWU7XG5cbiAgZm9yICg7aTxqO2krKykge1xuICAgIHRyYWNrID0gdHJhY2tzW2ldO1xuICAgIGlmICh0cmFjay5raW5kKCkgPT0gdGhpcy50cmFjay5raW5kKCkgJiYgdHJhY2subW9kZSgpID09IDIpIHtcbiAgICAgIG9mZiA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHRoaXMuc2VsZWN0ZWQob2ZmKTtcbn07XG5cbi8qKlxuICogVGhlIGJhc2UgY2xhc3MgZm9yIGJ1dHRvbnMgdGhhdCB0b2dnbGUgc3BlY2lmaWMgdGV4dCB0cmFjayB0eXBlcyAoZS5nLiBzdWJ0aXRsZXMpXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbnZqcy5UZXh0VHJhY2tCdXR0b24gPSB2anMuTWVudUJ1dHRvbi5leHRlbmQoe1xuICAvKiogQGNvbnN0cnVjdG9yICovXG4gIGluaXQ6IGZ1bmN0aW9uKHBsYXllciwgb3B0aW9ucyl7XG4gICAgdmpzLk1lbnVCdXR0b24uY2FsbCh0aGlzLCBwbGF5ZXIsIG9wdGlvbnMpO1xuXG4gICAgaWYgKHRoaXMuaXRlbXMubGVuZ3RoIDw9IDEpIHtcbiAgICAgIHRoaXMuaGlkZSgpO1xuICAgIH1cbiAgfVxufSk7XG5cbi8vIHZqcy5UZXh0VHJhY2tCdXR0b24ucHJvdG90eXBlLmJ1dHRvblByZXNzZWQgPSBmYWxzZTtcblxuLy8gdmpzLlRleHRUcmFja0J1dHRvbi5wcm90b3R5cGUuY3JlYXRlTWVudSA9IGZ1bmN0aW9uKCl7XG4vLyAgIHZhciBtZW51ID0gbmV3IHZqcy5NZW51KHRoaXMucGxheWVyXyk7XG5cbi8vICAgLy8gQWRkIGEgdGl0bGUgbGlzdCBpdGVtIHRvIHRoZSB0b3Bcbi8vICAgLy8gbWVudS5lbCgpLmFwcGVuZENoaWxkKHZqcy5jcmVhdGVFbCgnbGknLCB7XG4vLyAgIC8vICAgY2xhc3NOYW1lOiAndmpzLW1lbnUtdGl0bGUnLFxuLy8gICAvLyAgIGlubmVySFRNTDogdmpzLmNhcGl0YWxpemUodGhpcy5raW5kXyksXG4vLyAgIC8vICAgdGFiaW5kZXg6IC0xXG4vLyAgIC8vIH0pKTtcblxuLy8gICB0aGlzLml0ZW1zID0gdGhpcy5jcmVhdGVJdGVtcygpO1xuXG4vLyAgIC8vIEFkZCBtZW51IGl0ZW1zIHRvIHRoZSBtZW51XG4vLyAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5pdGVtcy5sZW5ndGg7IGkrKykge1xuLy8gICAgIG1lbnUuYWRkSXRlbSh0aGlzLml0ZW1zW2ldKTtcbi8vICAgfVxuXG4vLyAgIC8vIEFkZCBsaXN0IHRvIGVsZW1lbnRcbi8vICAgdGhpcy5hZGRDaGlsZChtZW51KTtcblxuLy8gICByZXR1cm4gbWVudTtcbi8vIH07XG5cbi8vIENyZWF0ZSBhIG1lbnUgaXRlbSBmb3IgZWFjaCB0ZXh0IHRyYWNrXG52anMuVGV4dFRyYWNrQnV0dG9uLnByb3RvdHlwZS5jcmVhdGVJdGVtcyA9IGZ1bmN0aW9uKCl7XG4gIHZhciBpdGVtcyA9IFtdLCB0cmFjaztcblxuICAvLyBBZGQgYW4gT0ZGIG1lbnUgaXRlbSB0byB0dXJuIGFsbCB0cmFja3Mgb2ZmXG4gIGl0ZW1zLnB1c2gobmV3IHZqcy5PZmZUZXh0VHJhY2tNZW51SXRlbSh0aGlzLnBsYXllcl8sIHsgJ2tpbmQnOiB0aGlzLmtpbmRfIH0pKTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucGxheWVyXy50ZXh0VHJhY2tzKCkubGVuZ3RoOyBpKyspIHtcbiAgICB0cmFjayA9IHRoaXMucGxheWVyXy50ZXh0VHJhY2tzKClbaV07XG4gICAgaWYgKHRyYWNrLmtpbmQoKSA9PT0gdGhpcy5raW5kXykge1xuICAgICAgaXRlbXMucHVzaChuZXcgdmpzLlRleHRUcmFja01lbnVJdGVtKHRoaXMucGxheWVyXywge1xuICAgICAgICAndHJhY2snOiB0cmFja1xuICAgICAgfSkpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBpdGVtcztcbn07XG5cbi8qKlxuICogVGhlIGJ1dHRvbiBjb21wb25lbnQgZm9yIHRvZ2dsaW5nIGFuZCBzZWxlY3RpbmcgY2FwdGlvbnNcbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqL1xudmpzLkNhcHRpb25zQnV0dG9uID0gdmpzLlRleHRUcmFja0J1dHRvbi5leHRlbmQoe1xuICAvKiogQGNvbnN0cnVjdG9yICovXG4gIGluaXQ6IGZ1bmN0aW9uKHBsYXllciwgb3B0aW9ucywgcmVhZHkpe1xuICAgIHZqcy5UZXh0VHJhY2tCdXR0b24uY2FsbCh0aGlzLCBwbGF5ZXIsIG9wdGlvbnMsIHJlYWR5KTtcbiAgICB0aGlzLmVsXy5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGFiZWwnLCdDYXB0aW9ucyBNZW51Jyk7XG4gIH1cbn0pO1xudmpzLkNhcHRpb25zQnV0dG9uLnByb3RvdHlwZS5raW5kXyA9ICdjYXB0aW9ucyc7XG52anMuQ2FwdGlvbnNCdXR0b24ucHJvdG90eXBlLmJ1dHRvblRleHQgPSAnQ2FwdGlvbnMnO1xudmpzLkNhcHRpb25zQnV0dG9uLnByb3RvdHlwZS5jbGFzc05hbWUgPSAndmpzLWNhcHRpb25zLWJ1dHRvbic7XG5cbi8qKlxuICogVGhlIGJ1dHRvbiBjb21wb25lbnQgZm9yIHRvZ2dsaW5nIGFuZCBzZWxlY3Rpbmcgc3VidGl0bGVzXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbnZqcy5TdWJ0aXRsZXNCdXR0b24gPSB2anMuVGV4dFRyYWNrQnV0dG9uLmV4dGVuZCh7XG4gIC8qKiBAY29uc3RydWN0b3IgKi9cbiAgaW5pdDogZnVuY3Rpb24ocGxheWVyLCBvcHRpb25zLCByZWFkeSl7XG4gICAgdmpzLlRleHRUcmFja0J1dHRvbi5jYWxsKHRoaXMsIHBsYXllciwgb3B0aW9ucywgcmVhZHkpO1xuICAgIHRoaXMuZWxfLnNldEF0dHJpYnV0ZSgnYXJpYS1sYWJlbCcsJ1N1YnRpdGxlcyBNZW51Jyk7XG4gIH1cbn0pO1xudmpzLlN1YnRpdGxlc0J1dHRvbi5wcm90b3R5cGUua2luZF8gPSAnc3VidGl0bGVzJztcbnZqcy5TdWJ0aXRsZXNCdXR0b24ucHJvdG90eXBlLmJ1dHRvblRleHQgPSAnU3VidGl0bGVzJztcbnZqcy5TdWJ0aXRsZXNCdXR0b24ucHJvdG90eXBlLmNsYXNzTmFtZSA9ICd2anMtc3VidGl0bGVzLWJ1dHRvbic7XG5cbi8vIENoYXB0ZXJzIGFjdCBtdWNoIGRpZmZlcmVudGx5IHRoYW4gb3RoZXIgdGV4dCB0cmFja3Ncbi8vIEN1ZXMgYXJlIG5hdmlnYXRpb24gdnMuIG90aGVyIHRyYWNrcyBvZiBhbHRlcm5hdGl2ZSBsYW5ndWFnZXNcbi8qKlxuICogVGhlIGJ1dHRvbiBjb21wb25lbnQgZm9yIHRvZ2dsaW5nIGFuZCBzZWxlY3RpbmcgY2hhcHRlcnNcbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqL1xudmpzLkNoYXB0ZXJzQnV0dG9uID0gdmpzLlRleHRUcmFja0J1dHRvbi5leHRlbmQoe1xuICAvKiogQGNvbnN0cnVjdG9yICovXG4gIGluaXQ6IGZ1bmN0aW9uKHBsYXllciwgb3B0aW9ucywgcmVhZHkpe1xuICAgIHZqcy5UZXh0VHJhY2tCdXR0b24uY2FsbCh0aGlzLCBwbGF5ZXIsIG9wdGlvbnMsIHJlYWR5KTtcbiAgICB0aGlzLmVsXy5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGFiZWwnLCdDaGFwdGVycyBNZW51Jyk7XG4gIH1cbn0pO1xudmpzLkNoYXB0ZXJzQnV0dG9uLnByb3RvdHlwZS5raW5kXyA9ICdjaGFwdGVycyc7XG52anMuQ2hhcHRlcnNCdXR0b24ucHJvdG90eXBlLmJ1dHRvblRleHQgPSAnQ2hhcHRlcnMnO1xudmpzLkNoYXB0ZXJzQnV0dG9uLnByb3RvdHlwZS5jbGFzc05hbWUgPSAndmpzLWNoYXB0ZXJzLWJ1dHRvbic7XG5cbi8vIENyZWF0ZSBhIG1lbnUgaXRlbSBmb3IgZWFjaCB0ZXh0IHRyYWNrXG52anMuQ2hhcHRlcnNCdXR0b24ucHJvdG90eXBlLmNyZWF0ZUl0ZW1zID0gZnVuY3Rpb24oKXtcbiAgdmFyIGl0ZW1zID0gW10sIHRyYWNrO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5wbGF5ZXJfLnRleHRUcmFja3MoKS5sZW5ndGg7IGkrKykge1xuICAgIHRyYWNrID0gdGhpcy5wbGF5ZXJfLnRleHRUcmFja3MoKVtpXTtcbiAgICBpZiAodHJhY2sua2luZCgpID09PSB0aGlzLmtpbmRfKSB7XG4gICAgICBpdGVtcy5wdXNoKG5ldyB2anMuVGV4dFRyYWNrTWVudUl0ZW0odGhpcy5wbGF5ZXJfLCB7XG4gICAgICAgICd0cmFjayc6IHRyYWNrXG4gICAgICB9KSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGl0ZW1zO1xufTtcblxudmpzLkNoYXB0ZXJzQnV0dG9uLnByb3RvdHlwZS5jcmVhdGVNZW51ID0gZnVuY3Rpb24oKXtcbiAgdmFyIHRyYWNrcyA9IHRoaXMucGxheWVyXy50ZXh0VHJhY2tzKCksXG4gICAgICBpID0gMCxcbiAgICAgIGogPSB0cmFja3MubGVuZ3RoLFxuICAgICAgdHJhY2ssIGNoYXB0ZXJzVHJhY2ssXG4gICAgICBpdGVtcyA9IHRoaXMuaXRlbXMgPSBbXTtcblxuICBmb3IgKDtpPGo7aSsrKSB7XG4gICAgdHJhY2sgPSB0cmFja3NbaV07XG4gICAgaWYgKHRyYWNrLmtpbmQoKSA9PSB0aGlzLmtpbmRfICYmIHRyYWNrLmRmbHQoKSkge1xuICAgICAgaWYgKHRyYWNrLnJlYWR5U3RhdGUoKSA8IDIpIHtcbiAgICAgICAgdGhpcy5jaGFwdGVyc1RyYWNrID0gdHJhY2s7XG4gICAgICAgIHRyYWNrLm9uKCdsb2FkZWQnLCB2anMuYmluZCh0aGlzLCB0aGlzLmNyZWF0ZU1lbnUpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2hhcHRlcnNUcmFjayA9IHRyYWNrO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB2YXIgbWVudSA9IHRoaXMubWVudSA9IG5ldyB2anMuTWVudSh0aGlzLnBsYXllcl8pO1xuXG4gIG1lbnUuZWxfLmFwcGVuZENoaWxkKHZqcy5jcmVhdGVFbCgnbGknLCB7XG4gICAgY2xhc3NOYW1lOiAndmpzLW1lbnUtdGl0bGUnLFxuICAgIGlubmVySFRNTDogdmpzLmNhcGl0YWxpemUodGhpcy5raW5kXyksXG4gICAgdGFiaW5kZXg6IC0xXG4gIH0pKTtcblxuICBpZiAoY2hhcHRlcnNUcmFjaykge1xuICAgIHZhciBjdWVzID0gY2hhcHRlcnNUcmFjay5jdWVzXywgY3VlLCBtaTtcbiAgICBpID0gMDtcbiAgICBqID0gY3Vlcy5sZW5ndGg7XG5cbiAgICBmb3IgKDtpPGo7aSsrKSB7XG4gICAgICBjdWUgPSBjdWVzW2ldO1xuXG4gICAgICBtaSA9IG5ldyB2anMuQ2hhcHRlcnNUcmFja01lbnVJdGVtKHRoaXMucGxheWVyXywge1xuICAgICAgICAndHJhY2snOiBjaGFwdGVyc1RyYWNrLFxuICAgICAgICAnY3VlJzogY3VlXG4gICAgICB9KTtcblxuICAgICAgaXRlbXMucHVzaChtaSk7XG5cbiAgICAgIG1lbnUuYWRkQ2hpbGQobWkpO1xuICAgIH1cbiAgfVxuXG4gIGlmICh0aGlzLml0ZW1zLmxlbmd0aCA+IDApIHtcbiAgICB0aGlzLnNob3coKTtcbiAgfVxuXG4gIHJldHVybiBtZW51O1xufTtcblxuXG4vKipcbiAqIEBjb25zdHJ1Y3RvclxuICovXG52anMuQ2hhcHRlcnNUcmFja01lbnVJdGVtID0gdmpzLk1lbnVJdGVtLmV4dGVuZCh7XG4gIC8qKiBAY29uc3RydWN0b3IgKi9cbiAgaW5pdDogZnVuY3Rpb24ocGxheWVyLCBvcHRpb25zKXtcbiAgICB2YXIgdHJhY2sgPSB0aGlzLnRyYWNrID0gb3B0aW9uc1sndHJhY2snXSxcbiAgICAgICAgY3VlID0gdGhpcy5jdWUgPSBvcHRpb25zWydjdWUnXSxcbiAgICAgICAgY3VycmVudFRpbWUgPSBwbGF5ZXIuY3VycmVudFRpbWUoKTtcblxuICAgIC8vIE1vZGlmeSBvcHRpb25zIGZvciBwYXJlbnQgTWVudUl0ZW0gY2xhc3MncyBpbml0LlxuICAgIG9wdGlvbnNbJ2xhYmVsJ10gPSBjdWUudGV4dDtcbiAgICBvcHRpb25zWydzZWxlY3RlZCddID0gKGN1ZS5zdGFydFRpbWUgPD0gY3VycmVudFRpbWUgJiYgY3VycmVudFRpbWUgPCBjdWUuZW5kVGltZSk7XG4gICAgdmpzLk1lbnVJdGVtLmNhbGwodGhpcywgcGxheWVyLCBvcHRpb25zKTtcblxuICAgIHRyYWNrLm9uKCdjdWVjaGFuZ2UnLCB2anMuYmluZCh0aGlzLCB0aGlzLnVwZGF0ZSkpO1xuICB9XG59KTtcblxudmpzLkNoYXB0ZXJzVHJhY2tNZW51SXRlbS5wcm90b3R5cGUub25DbGljayA9IGZ1bmN0aW9uKCl7XG4gIHZqcy5NZW51SXRlbS5wcm90b3R5cGUub25DbGljay5jYWxsKHRoaXMpO1xuICB0aGlzLnBsYXllcl8uY3VycmVudFRpbWUodGhpcy5jdWUuc3RhcnRUaW1lKTtcbiAgdGhpcy51cGRhdGUodGhpcy5jdWUuc3RhcnRUaW1lKTtcbn07XG5cbnZqcy5DaGFwdGVyc1RyYWNrTWVudUl0ZW0ucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKCl7XG4gIHZhciBjdWUgPSB0aGlzLmN1ZSxcbiAgICAgIGN1cnJlbnRUaW1lID0gdGhpcy5wbGF5ZXJfLmN1cnJlbnRUaW1lKCk7XG5cbiAgLy8gdmpzLmxvZyhjdXJyZW50VGltZSwgY3VlLnN0YXJ0VGltZSk7XG4gIHRoaXMuc2VsZWN0ZWQoY3VlLnN0YXJ0VGltZSA8PSBjdXJyZW50VGltZSAmJiBjdXJyZW50VGltZSA8IGN1ZS5lbmRUaW1lKTtcbn07XG5cbi8vIEFkZCBCdXR0b25zIHRvIGNvbnRyb2xCYXJcbnZqcy5vYmoubWVyZ2UodmpzLkNvbnRyb2xCYXIucHJvdG90eXBlLm9wdGlvbnNfWydjaGlsZHJlbiddLCB7XG4gICdzdWJ0aXRsZXNCdXR0b24nOiB7fSxcbiAgJ2NhcHRpb25zQnV0dG9uJzoge30sXG4gICdjaGFwdGVyc0J1dHRvbic6IHt9XG59KTtcblxuLy8gdmpzLkN1ZSA9IHZqcy5Db21wb25lbnQuZXh0ZW5kKHtcbi8vICAgLyoqIEBjb25zdHJ1Y3RvciAqL1xuLy8gICBpbml0OiBmdW5jdGlvbihwbGF5ZXIsIG9wdGlvbnMpe1xuLy8gICAgIHZqcy5Db21wb25lbnQuY2FsbCh0aGlzLCBwbGF5ZXIsIG9wdGlvbnMpO1xuLy8gICB9XG4vLyB9KTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBBZGQgSlNPTiBzdXBwb3J0XG4gKiBAc3VwcHJlc3Mge3VuZGVmaW5lZFZhcnN9XG4gKiAoQ29tcGlsZXIgZG9lc24ndCBsaWtlIEpTT04gbm90IGJlaW5nIGRlY2xhcmVkKVxuICovXG5cbi8qKlxuICogSmF2YXNjcmlwdCBKU09OIGltcGxlbWVudGF0aW9uXG4gKiAoUGFyc2UgTWV0aG9kIE9ubHkpXG4gKiBodHRwczovL2dpdGh1Yi5jb20vZG91Z2xhc2Nyb2NrZm9yZC9KU09OLWpzL2Jsb2IvbWFzdGVyL2pzb24yLmpzXG4gKiBPbmx5IHVzaW5nIGZvciBwYXJzZSBtZXRob2Qgd2hlbiBwYXJzaW5nIGRhdGEtc2V0dXAgYXR0cmlidXRlIEpTT04uXG4gKiBAc3VwcHJlc3Mge3VuZGVmaW5lZFZhcnN9XG4gKiBAbmFtZXNwYWNlXG4gKiBAcHJpdmF0ZVxuICovXG52anMuSlNPTjtcblxuaWYgKHR5cGVvZiB3aW5kb3cuSlNPTiAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LkpTT04ucGFyc2UgPT09ICdmdW5jdGlvbicpIHtcbiAgdmpzLkpTT04gPSB3aW5kb3cuSlNPTjtcblxufSBlbHNlIHtcbiAgdmpzLkpTT04gPSB7fTtcblxuICB2YXIgY3ggPSAvW1xcdTAwMDBcXHUwMGFkXFx1MDYwMC1cXHUwNjA0XFx1MDcwZlxcdTE3YjRcXHUxN2I1XFx1MjAwYy1cXHUyMDBmXFx1MjAyOC1cXHUyMDJmXFx1MjA2MC1cXHUyMDZmXFx1ZmVmZlxcdWZmZjAtXFx1ZmZmZl0vZztcblxuICAvKipcbiAgICogcGFyc2UgdGhlIGpzb25cbiAgICpcbiAgICogQG1lbWJlcm9mIHZqcy5KU09OXG4gICAqIEByZXR1cm4ge09iamVjdHxBcnJheX0gVGhlIHBhcnNlZCBKU09OXG4gICAqL1xuICB2anMuSlNPTi5wYXJzZSA9IGZ1bmN0aW9uICh0ZXh0LCByZXZpdmVyKSB7XG4gICAgICB2YXIgajtcblxuICAgICAgZnVuY3Rpb24gd2Fsayhob2xkZXIsIGtleSkge1xuICAgICAgICAgIHZhciBrLCB2LCB2YWx1ZSA9IGhvbGRlcltrZXldO1xuICAgICAgICAgIGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgIGZvciAoayBpbiB2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh2YWx1ZSwgaykpIHtcbiAgICAgICAgICAgICAgICAgICAgICB2ID0gd2Fsayh2YWx1ZSwgayk7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKHYgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZVtrXSA9IHY7XG4gICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHZhbHVlW2tdO1xuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcmV2aXZlci5jYWxsKGhvbGRlciwga2V5LCB2YWx1ZSk7XG4gICAgICB9XG4gICAgICB0ZXh0ID0gU3RyaW5nKHRleHQpO1xuICAgICAgY3gubGFzdEluZGV4ID0gMDtcbiAgICAgIGlmIChjeC50ZXN0KHRleHQpKSB7XG4gICAgICAgICAgdGV4dCA9IHRleHQucmVwbGFjZShjeCwgZnVuY3Rpb24gKGEpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdcXFxcdScgK1xuICAgICAgICAgICAgICAgICAgKCcwMDAwJyArIGEuY2hhckNvZGVBdCgwKS50b1N0cmluZygxNikpLnNsaWNlKC00KTtcbiAgICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKC9eW1xcXSw6e31cXHNdKiQvXG4gICAgICAgICAgICAgIC50ZXN0KHRleHQucmVwbGFjZSgvXFxcXCg/OltcIlxcXFxcXC9iZm5ydF18dVswLTlhLWZBLUZdezR9KS9nLCAnQCcpXG4gICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXCJbXlwiXFxcXFxcblxccl0qXCJ8dHJ1ZXxmYWxzZXxudWxsfC0/XFxkKyg/OlxcLlxcZCopPyg/OltlRV1bK1xcLV0/XFxkKyk/L2csICddJylcbiAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oPzpefDp8LCkoPzpcXHMqXFxbKSsvZywgJycpKSkge1xuXG4gICAgICAgICAgaiA9IGV2YWwoJygnICsgdGV4dCArICcpJyk7XG5cbiAgICAgICAgICByZXR1cm4gdHlwZW9mIHJldml2ZXIgPT09ICdmdW5jdGlvbicgP1xuICAgICAgICAgICAgICB3YWxrKHsnJzogan0sICcnKSA6IGo7XG4gICAgICB9XG5cbiAgICAgIHRocm93IG5ldyBTeW50YXhFcnJvcignSlNPTi5wYXJzZSgpOiBpbnZhbGlkIG9yIG1hbGZvcm1lZCBKU09OIGRhdGEnKTtcbiAgfTtcbn1cbi8qKlxuICogQGZpbGVvdmVydmlldyBGdW5jdGlvbnMgZm9yIGF1dG9tYXRpY2FsbHkgc2V0dGluZyB1cCBhIHBsYXllclxuICogYmFzZWQgb24gdGhlIGRhdGEtc2V0dXAgYXR0cmlidXRlIG9mIHRoZSB2aWRlbyB0YWdcbiAqL1xuXG4vLyBBdXRvbWF0aWNhbGx5IHNldCB1cCBhbnkgdGFncyB0aGF0IGhhdmUgYSBkYXRhLXNldHVwIGF0dHJpYnV0ZVxudmpzLmF1dG9TZXR1cCA9IGZ1bmN0aW9uKCl7XG4gIHZhciBvcHRpb25zLCB2aWQsIHBsYXllcixcbiAgICAgIHZpZHMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgndmlkZW8nKTtcblxuICAvLyBDaGVjayBpZiBhbnkgbWVkaWEgZWxlbWVudHMgZXhpc3RcbiAgaWYgKHZpZHMgJiYgdmlkcy5sZW5ndGggPiAwKSB7XG5cbiAgICBmb3IgKHZhciBpPTAsaj12aWRzLmxlbmd0aDsgaTxqOyBpKyspIHtcbiAgICAgIHZpZCA9IHZpZHNbaV07XG5cbiAgICAgIC8vIENoZWNrIGlmIGVsZW1lbnQgZXhpc3RzLCBoYXMgZ2V0QXR0cmlidXRlIGZ1bmMuXG4gICAgICAvLyBJRSBzZWVtcyB0byBjb25zaWRlciB0eXBlb2YgZWwuZ2V0QXR0cmlidXRlID09ICdvYmplY3QnIGluc3RlYWQgb2YgJ2Z1bmN0aW9uJyBsaWtlIGV4cGVjdGVkLCBhdCBsZWFzdCB3aGVuIGxvYWRpbmcgdGhlIHBsYXllciBpbW1lZGlhdGVseS5cbiAgICAgIGlmICh2aWQgJiYgdmlkLmdldEF0dHJpYnV0ZSkge1xuXG4gICAgICAgIC8vIE1ha2Ugc3VyZSB0aGlzIHBsYXllciBoYXNuJ3QgYWxyZWFkeSBiZWVuIHNldCB1cC5cbiAgICAgICAgaWYgKHZpZFsncGxheWVyJ10gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIG9wdGlvbnMgPSB2aWQuZ2V0QXR0cmlidXRlKCdkYXRhLXNldHVwJyk7XG5cbiAgICAgICAgICAvLyBDaGVjayBpZiBkYXRhLXNldHVwIGF0dHIgZXhpc3RzLlxuICAgICAgICAgIC8vIFdlIG9ubHkgYXV0by1zZXR1cCBpZiB0aGV5J3ZlIGFkZGVkIHRoZSBkYXRhLXNldHVwIGF0dHIuXG4gICAgICAgICAgaWYgKG9wdGlvbnMgIT09IG51bGwpIHtcblxuICAgICAgICAgICAgLy8gUGFyc2Ugb3B0aW9ucyBKU09OXG4gICAgICAgICAgICAvLyBJZiBlbXB0eSBzdHJpbmcsIG1ha2UgaXQgYSBwYXJzYWJsZSBqc29uIG9iamVjdC5cbiAgICAgICAgICAgIG9wdGlvbnMgPSB2anMuSlNPTi5wYXJzZShvcHRpb25zIHx8ICd7fScpO1xuXG4gICAgICAgICAgICAvLyBDcmVhdGUgbmV3IHZpZGVvLmpzIGluc3RhbmNlLlxuICAgICAgICAgICAgcGxheWVyID0gdmlkZW9qcyh2aWQsIG9wdGlvbnMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAvLyBJZiBnZXRBdHRyaWJ1dGUgaXNuJ3QgZGVmaW5lZCwgd2UgbmVlZCB0byB3YWl0IGZvciB0aGUgRE9NLlxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmpzLmF1dG9TZXR1cFRpbWVvdXQoMSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAvLyBObyB2aWRlb3Mgd2VyZSBmb3VuZCwgc28ga2VlcCBsb29waW5nIHVubGVzcyBwYWdlIGlzIGZpbmlzZWhkIGxvYWRpbmcuXG4gIH0gZWxzZSBpZiAoIXZqcy53aW5kb3dMb2FkZWQpIHtcbiAgICB2anMuYXV0b1NldHVwVGltZW91dCgxKTtcbiAgfVxufTtcblxuLy8gUGF1c2UgdG8gbGV0IHRoZSBET00ga2VlcCBwcm9jZXNzaW5nXG52anMuYXV0b1NldHVwVGltZW91dCA9IGZ1bmN0aW9uKHdhaXQpe1xuICBzZXRUaW1lb3V0KHZqcy5hdXRvU2V0dXAsIHdhaXQpO1xufTtcblxuaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdjb21wbGV0ZScpIHtcbiAgdmpzLndpbmRvd0xvYWRlZCA9IHRydWU7XG59IGVsc2Uge1xuICB2anMub25lKHdpbmRvdywgJ2xvYWQnLCBmdW5jdGlvbigpe1xuICAgIHZqcy53aW5kb3dMb2FkZWQgPSB0cnVlO1xuICB9KTtcbn1cblxuLy8gUnVuIEF1dG8tbG9hZCBwbGF5ZXJzXG4vLyBZb3UgaGF2ZSB0byB3YWl0IGF0IGxlYXN0IG9uY2UgaW4gY2FzZSB0aGlzIHNjcmlwdCBpcyBsb2FkZWQgYWZ0ZXIgeW91ciB2aWRlbyBpbiB0aGUgRE9NICh3ZWlyZCBiZWhhdmlvciBvbmx5IHdpdGggbWluaWZpZWQgdmVyc2lvbilcbnZqcy5hdXRvU2V0dXBUaW1lb3V0KDEpO1xuLyoqXG4gKiB0aGUgbWV0aG9kIGZvciByZWdpc3RlcmluZyBhIHZpZGVvLmpzIHBsdWdpblxuICpcbiAqIEBwYXJhbSAge1N0cmluZ30gbmFtZSBUaGUgbmFtZSBvZiB0aGUgcGx1Z2luXG4gKiBAcGFyYW0gIHtGdW5jdGlvbn0gaW5pdCBUaGUgZnVuY3Rpb24gdGhhdCBpcyBydW4gd2hlbiB0aGUgcGxheWVyIGluaXRzXG4gKi9cbnZqcy5wbHVnaW4gPSBmdW5jdGlvbihuYW1lLCBpbml0KXtcbiAgdmpzLlBsYXllci5wcm90b3R5cGVbbmFtZV0gPSBpbml0O1xufTtcbiJdLCJmaWxlIjoicGx1Z2lucy91ZWRpdG9yL3RoaXJkLXBhcnR5L3ZpZGVvLWpzL3ZpZGVvLmRldi5qcyJ9
