(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.dragon = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
'use strict';

var touchy = require('./utils/touchy'),
    classes = require('./utils/classes'),
    doc = document,
    docElm = doc.documentElement,
    dragonSpace = {
      dragons: [],
      drags: [],
      containersLookup: [],
      containers: []
    },
    id = 0,

    DEV = false;

touchy(docElm, 'add', 'mousedown', grab);

// ==============================================================================================================================================================
// Dragon =====================================================================================================================================================
// =============================================================================================================================================================
/** is group of containers with same settings */
function Dragon (options) {
  if(DEV) console.log('Dragon instance created, options: ', options);

  this.options = options instanceof Array ? {containers: options} : options || {};
  this.containers = [];
  this.dragonSpace = dragonSpace;
  this.id = this.options.id || 'dragon' + id++;
  
  dragonSpace.dragons.push(this); // register dragon

  if(this.options.containers)
    this.addContainers(this.options.containers);
}

Dragon.prototype.addContainers = function(containers) {
  if(DEV) console.log('Adding containers: ', containers);

  var self = this;
  containers.forEach(function (containerElm) {
    var container = new Container(self, containerElm);
    self.containers.push(container);
    dragonSpace.containers.push(container);
    dragonSpace.containersLookup.push(containerElm);
  });
};


// ==============================================================================================================================================================
// Container =====================================================================================================================================================
// =============================================================================================================================================================

function Container(dragon, elm) {
  if(DEV) console.log('Container instance created, elm:', elm);

  this.id = elm.id || 'container' + id++;
  this.dragon = dragon;
  this.elm = elm;
  this.options = {};
  this.options.mirrorContainer = doc.body;
}

// ==============================================================================================================================================================
// Drag =====================================================================================================================================================
// =============================================================================================================================================================
function Drag(e, item, source) {

  if(DEV) console.log('Drag instance created, params:', e, item, source);

  // this.mirror; // mirror image
  // this.source; // source container element
  // this.source; // source Container object
  // this.item; // item element being dragged
  // this.offsetX; // reference x
  // this.offsetY; // reference y
  // this.moveX; // reference move x
  // this.moveY; // reference move y
  // this.initialSibling; // reference sibling when grabbed
  // this.currentSibling; // reference sibling now
  // this.state; // holds Drag state (grabbed, tracking, waiting, dragging, ...)

  e.preventDefault(); // fixes github.com/bevacqua/dragula/issues/155
  this.moveX = e.clientX;
  this.moveY = e.clientY;

  if(DEV) console.log('*** Changing state: ', this.state, ' -> grabbed');
  this.state = 'grabbed';

  this.item = item;
  this.source = source;
  this.sourceContainer = getContainer(source);
  this.options = this.sourceContainer.options || {};

  this.events();
}

Drag.prototype.destroy = function() {
  if(DEV) console.log('Drag.destroy called');

  this.release({});
};

Drag.prototype.events = function(remove) {
  if(DEV) console.log('Drag.events called, "remove" param:', remove);
  //debugger;
  var op = remove ? 'remove' : 'add';
  touchy(docElm, op, 'mouseup', bind(this, 'release'));
  touchy(docElm, op, 'mousemove', bind(this, 'drag'));
  touchy(docElm, op, 'selectstart', bind(this, 'protectGrab')); // IE8
  touchy(docElm, op, 'click', bind(this, 'protectGrab'));
};

Drag.prototype.protectGrab = function(e) {
  if(DEV) console.log('Drag.protectGrab called, e:', e);

  if (this.state == 'grabbed') {
    e.preventDefault();
  }
};

Drag.prototype.drag = function(e) {
  if(DEV) console.log('Drag.drag called, e:', e);

  if(this.state == 'grabbed'){
    this.startByMovement(e);
    return;
  }
  if(this.state !== 'moved' && this.state !== 'dragging'){
    this.cancel();
    return;
  }

  if(DEV) console.log('*** Changing state: ', this.state, ' -> dragging');
  this.state = 'dragging';

  e.preventDefault();

  var clientX = getCoord('clientX', e),
      clientY = getCoord('clientY', e),
      x = clientX - this.offsetX,
      y = clientY - this.offsetY,
      mirror = this.mirror;

  mirror.style.left = x + 'px';
  mirror.style.top = y + 'px';

  var elementBehindCursor = getElementBehindPoint(mirror, clientX, clientY),
      dropTarget = findDropTarget(elementBehindCursor, clientX, clientY),
      reference,
      immediate = getImmediateChild(dropTarget, elementBehindCursor);

  if (immediate !== null) {
    reference = getReference(dropTarget, immediate, clientX, clientY);
  } else {
    return;
  }
  if (
      reference === null ||
      reference !== this.item &&
      reference !== nextEl(this.item)
  ) {
    this.currentSibling = reference;
    dropTarget.insertBefore(this.item, reference);
  }
};

Drag.prototype.startByMovement = function(e) {
  if(DEV) console.log('Drag.startByMovement called, e:', e);

  // if (whichMouseButton(e) === 0) {
  //   release({});
  //   return; // when text is selected on an input and then dragged, mouseup doesn't fire. this is our only hope
  // }

  // truthy check fixes github.com/bevacqua/dragula/issues/239, equality fixes github.com/bevacqua/dragula/issues/207
  if (e.clientX !== void 0 && e.clientX === this.moveX && e.clientY !== void 0 && e.clientY === this.moveY) {
    return;
  }

  this.initialSibling = this.currentSibling = nextEl(this.item);

  var offset = getOffset(this.item);
  this.offsetX = getCoord('pageX', e) - offset.left;
  this.offsetY = getCoord('pageY', e) - offset.top;

  classes.add(this.item, 'gu-transit');
  this.renderMirrorImage(this.options.mirrorContainer);

  if(DEV) console.log('*** Changing state: ', this.state, ' -> moved');
  this.state = 'moved';
};

Drag.prototype.renderMirrorImage = function(mirrorContainer) {
  if(DEV) console.log('Drag.renderMirrorImage called, e:', mirrorContainer);

  var rect = this.item.getBoundingClientRect();
  var mirror = this.mirror = this.item.cloneNode(true);

  mirror.style.width = getRectWidth(rect) + 'px';
  mirror.style.height = getRectHeight(rect) + 'px';
  classes.rm(mirror, 'gu-transit');
  classes.add(mirror, 'gu-mirror');
  mirrorContainer.appendChild(mirror);
  classes.add(mirrorContainer, 'gu-unselectable');
};

Drag.prototype.release = function(e) {
  if(DEV) console.log('Drag.release called, e:', e);

  touchy(docElm, 'remove', 'mouseup', this.release);

  var clientX = getCoord('clientX', e);
  var clientY = getCoord('clientY', e);

  var elementBehindCursor = getElementBehindPoint(this.mirror, clientX, clientY);
  var dropTarget = findDropTarget(elementBehindCursor, clientX, clientY);
  if (dropTarget && dropTarget !== this.source) {
    this.drop(e, this.item, dropTarget);
  } else {
    this.cancel();
  }
};

Drag.prototype.drop = function() {
  if(DEV) console.log('Drag.drop called');
  if (this.state != 'dragging')
    return;

  if(DEV) console.log('*** Changing state: ', this.state, ' -> dropped');
  this.state = 'dropped';

  this.cleanup();
};

Drag.prototype.remove = function() {
  if(DEV) console.log('Drag.remove called, e:', e);

  if (this.state !== 'draging')
    return;

  if(DEV) console.log('*** Changing state: ', this.state, ' -> dragging');
  this.state = 'removed';

  var parent = getParent(this.item);
  if (parent) {
    parent.removeChild(this.item);
  }
  this.cleanup();
};

Drag.prototype.cancel = function(reverts){
  if(DEV) console.log('Drag.cancel called, reverts:', reverts);

  if (this.state == 'draging'){
      var parent = getParent(this.item);
      var initial = this.isInitialPlacement(parent);
      if (initial === false && reverts) {
          this.source.insertBefore(this.item, this.initialSibling);
      }
  }

  if(DEV) console.log('*** Changing state: ', this.state, ' -> cancelled');
  this.state = 'cancelled';

  this.cleanup();
};

Drag.prototype.cleanup = function() {
  if(DEV) console.log('Drag.cleanup called');

  this.events('remove');

  if(this.mirror)
    removeMirrorImage(this.mirror);

  if (this.item) {
    classes.rm(this.item, 'gu-transit');
  }

  if(DEV) console.log('*** Changing state: ', this.state, ' -> cleaned');
  this.state = 'cleaned';

  this.source = this.item = this.initialSibling = this.currentSibling = null;
};

Drag.prototype.isInitialPlacement  = function(target,s) {
  var sibling;
  if (s !== void 0) {
    sibling = s;
  } else if (this.mirror) {
    sibling = this.currentSibling;
  } else {
    sibling = nextEl(this.item);
  }
  return target === this.source && sibling === this.initialSibling;
};


// Declarations

function grab(e) {
  if(DEV) console.log('grab called, e:', e);

  var item = e.target,
      source;

  // if (isInput(item)) { // see also: github.com/bevacqua/dragula/issues/208
  //   e.target.focus(); // fixes github.com/bevacqua/dragula/issues/176
  //   return;
  // }

  while (getParent(item) && !isContainer(getParent(item), item, e)) {
    item = getParent(item); // drag target should be a top element
  }
  source = getParent(item);
  if (!source) {
    return;
  }
  dragonSpace.drags.push(new Drag(e, item, source));
}

function bind(obj, methodName){
  var bindedName = 'binded' + methodName;
  if(!obj[bindedName])
    obj[bindedName] = function(){
      obj[methodName].apply(obj, arguments);
    };
  return obj[bindedName];
}

function removeMirrorImage (mirror) {
  var mirrorContainer = getParent(mirror);
  classes.rm(mirrorContainer, 'gu-unselectable');
  mirrorContainer.removeChild(mirror);
}

function findDropTarget (elementBehindCursor) {
  var target = elementBehindCursor;
  while (target && !isContainer(target)) {
    target = getParent(target);
  }
  return target;
}

function isContainer(elm) {
  return dragonSpace.containersLookup.indexOf(elm)+1;
}

function getImmediateChild (dropTarget, target) {
  var immediate = target;
  while (immediate !== dropTarget && getParent(immediate) !== dropTarget) {
    immediate = getParent(immediate);
  }
  if (immediate === docElm) {
    return null;
  }
  return immediate;
}

function getReference (dropTarget, target, x, y, direction) {
  var horizontal = direction === 'horizontal';
  return target !== dropTarget ? inside() : outside(); // reference

  function outside () { // slower, but able to figure out any position
    var len = dropTarget.children.length,
        i,
        el,
        rect;

    for (i = 0; i < len; i++) {
      el = dropTarget.children[i];
      rect = el.getBoundingClientRect();
      if (horizontal && (rect.left + rect.width / 2) > x) { return el; }
      if (!horizontal && (rect.top + rect.height / 2) > y) { return el; }
    }

    return null;
  }

  function inside () { // faster, but only available if dropped inside a child element
    var rect = target.getBoundingClientRect();
    if (horizontal) {
      return resolve(x > rect.left + getRectWidth(rect) / 2);
    }
    return resolve(y > rect.top + getRectHeight(rect) / 2);
  }

  function resolve (after) {
    return after ? nextEl(target) : target;
  }
}


// function whichMouseButton (e) {
//   /** @namespace e.touches -- resolving webstorm unresolved variables */
//   if (e.touches !== void 0) { return e.touches.length; }
//   if (e.which !== void 0 && e.which !== 0) { return e.which; } // see github.com/bevacqua/dragula/issues/261
//   if (e.buttons !== void 0) { return e.buttons; }
//   var button = e.button;
//   if (button !== void 0) { // see github.com/jquery/jquery/blob/99e8ff1baa7ae341e94bb89c3e84570c7c3ad9ea/src/event.js#L573-L575
//     return button & 1 ? 1 : button & 2 ? 3 : (button & 4 ? 2 : 0);
//   }
// }

function getOffset (el) {
  var rect = el.getBoundingClientRect();
  return {
    left: rect.left + getScroll('scrollLeft', 'pageXOffset'),
    top: rect.top + getScroll('scrollTop', 'pageYOffset')
  };
}

function getScroll (scrollProp, offsetProp) {
  if (typeof global[offsetProp] !== 'undefined') {
    return global[offsetProp];
  }
  if (docElm.clientHeight) {
    return docElm[scrollProp];
  }
  return doc.body[scrollProp];
}

function getElementBehindPoint (point, x, y) {
  var p = point || {},
      state = p.className,
      el;
  p.className += ' gu-hide';
  el = doc.elementFromPoint(x, y);
  p.className = state;
  return el;
}

function never () { return false; }
function always () { return true; }
function getRectWidth (rect) { return rect.width || (rect.right - rect.left); }
function getRectHeight (rect) { return rect.height || (rect.bottom - rect.top); }
function getParent (el) { return el.parentNode === doc ? null : el.parentNode; }
function getContainer (el) { return dragonSpace.containers[dragonSpace.containersLookup.indexOf(el)] }
function isInput (el) { return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || isEditable(el); }
function isEditable (el) {
  /** @namespace el.contentEditable -- resolving webstorm unresolved variables */
  if (!el) { return false; } // no parents were editable
  if (el.contentEditable === 'false') { return false; } // stop the lookup
  if (el.contentEditable === 'true') { return true; } // found a contentEditable element in the chain
  return isEditable(getParent(el)); // contentEditable is set to 'inherit'
}

function nextEl (el) {
  return el.nextElementSibling || manually();
  function manually () {
    var sibling = el;
    do {
      sibling = sibling.nextSibling;
    } while (sibling && sibling.nodeType !== 1);
    return sibling;
  }
}

function getEventHost (e) {
  // on touchend event, we have to use `e.changedTouches`
  // see http://stackoverflow.com/questions/7192563/touchend-event-properties
  // see github.com/bevacqua/dragula/issues/34
  /** @namespace e.targetTouches -- resolving webstorm unresolved variables */
  /** @namespace e.changedTouches -- resolving webstorm unresolved variables */
  if (e.targetTouches && e.targetTouches.length) {
    return e.targetTouches[0];
  }
  if (e.changedTouches && e.changedTouches.length) {
    return e.changedTouches[0];
  }
  return e;
}

function getCoord (coord, e) {
  var host = getEventHost(e);
  var missMap = {
    pageX: 'clientX', // IE8
    pageY: 'clientY' // IE8
  };
  if (coord in missMap && !(coord in host) && missMap[coord] in host) {
    coord = missMap[coord];
  }
  return host[coord];
}

module.exports = Dragon;
window.Dragon = Dragon;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./utils/classes":5,"./utils/touchy":6}],2:[function(require,module,exports){
(function (global){

var NativeCustomEvent = global.CustomEvent;

function useNative () {
  try {
    var p = new NativeCustomEvent('cat', { detail: { foo: 'bar' } });
    return  'cat' === p.type && 'bar' === p.detail.foo;
  } catch (e) {
  }
  return false;
}

/**
 * Cross-browser `CustomEvent` constructor.
 *
 * https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent.CustomEvent
 *
 * @public
 */

module.exports = useNative() ? NativeCustomEvent :

// IE >= 9
'function' === typeof document.createEvent ? function CustomEvent (type, params) {
  var e = document.createEvent('CustomEvent');
  if (params) {
    e.initCustomEvent(type, params.bubbles, params.cancelable, params.detail);
  } else {
    e.initCustomEvent(type, false, false, void 0);
  }
  return e;
} :

// IE <= 8
function CustomEvent (type, params) {
  var e = document.createEventObject();
  e.type = type;
  if (params) {
    e.bubbles = Boolean(params.bubbles);
    e.cancelable = Boolean(params.cancelable);
    e.detail = params.detail;
  } else {
    e.bubbles = false;
    e.cancelable = false;
    e.detail = void 0;
  }
  return e;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],3:[function(require,module,exports){
(function (global){
'use strict';

var customEvent = require('custom-event');
var eventmap = require('./eventmap');
var doc = global.document;
var addEvent = addEventEasy;
var removeEvent = removeEventEasy;
var hardCache = [];

if (!global.addEventListener) {
  addEvent = addEventHard;
  removeEvent = removeEventHard;
}

module.exports = {
  add: addEvent,
  remove: removeEvent,
  fabricate: fabricateEvent
};

function addEventEasy (el, type, fn, capturing) {
  return el.addEventListener(type, fn, capturing);
}

function addEventHard (el, type, fn) {
  return el.attachEvent('on' + type, wrap(el, type, fn));
}

function removeEventEasy (el, type, fn, capturing) {
  return el.removeEventListener(type, fn, capturing);
}

function removeEventHard (el, type, fn) {
  var listener = unwrap(el, type, fn);
  if (listener) {
    return el.detachEvent('on' + type, listener);
  }
}

function fabricateEvent (el, type, model) {
  var e = eventmap.indexOf(type) === -1 ? makeCustomEvent() : makeClassicEvent();
  if (el.dispatchEvent) {
    el.dispatchEvent(e);
  } else {
    el.fireEvent('on' + type, e);
  }
  function makeClassicEvent () {
    var e;
    if (doc.createEvent) {
      e = doc.createEvent('Event');
      e.initEvent(type, true, true);
    } else if (doc.createEventObject) {
      e = doc.createEventObject();
    }
    return e;
  }
  function makeCustomEvent () {
    return new customEvent(type, { detail: model });
  }
}

function wrapperFactory (el, type, fn) {
  return function wrapper (originalEvent) {
    var e = originalEvent || global.event;
    e.target = e.target || e.srcElement;
    e.preventDefault = e.preventDefault || function preventDefault () { e.returnValue = false; };
    e.stopPropagation = e.stopPropagation || function stopPropagation () { e.cancelBubble = true; };
    e.which = e.which || e.keyCode;
    fn.call(el, e);
  };
}

function wrap (el, type, fn) {
  var wrapper = unwrap(el, type, fn) || wrapperFactory(el, type, fn);
  hardCache.push({
    wrapper: wrapper,
    element: el,
    type: type,
    fn: fn
  });
  return wrapper;
}

function unwrap (el, type, fn) {
  var i = find(el, type, fn);
  if (i) {
    var wrapper = hardCache[i].wrapper;
    hardCache.splice(i, 1); // free up a tad of memory
    return wrapper;
  }
}

function find (el, type, fn) {
  var i, item;
  for (i = 0; i < hardCache.length; i++) {
    item = hardCache[i];
    if (item.element === el && item.type === type && item.fn === fn) {
      return i;
    }
  }
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./eventmap":4,"custom-event":2}],4:[function(require,module,exports){
(function (global){
'use strict';

var eventmap = [];
var eventname = '';
var ron = /^on/;

for (eventname in global) {
  if (ron.test(eventname)) {
    eventmap.push(eventname.slice(2));
  }
}

module.exports = eventmap;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],5:[function(require,module,exports){
'use strict';

var cache = {};
var start = '(?:^|\\s)';
var end = '(?:\\s|$)';

function lookupClass (className) {
  var cached = cache[className];
  if (cached) {
    cached.lastIndex = 0;
  } else {
    cache[className] = cached = new RegExp(start + className + end, 'g');
  }
  return cached;
}

function addClass (el, className) {
  var current = el.className;
  if (!current.length) {
    el.className = className;
  } else if (!lookupClass(className).test(current)) {
    el.className += ' ' + className;
  }
}

function rmClass (el, className) {
  el.className = el.className.replace(lookupClass(className), ' ').trim();
}

module.exports = {
  add: addClass,
  rm: rmClass
};

},{}],6:[function(require,module,exports){
(function (global){
"use strict";
var crossvent = require('crossvent');

module.exports = function touchy (el, op, type, fn) {
    var touch = {
        mouseup: 'touchend',
        mousedown: 'touchstart',
        mousemove: 'touchmove'
    };
    var pointers = {
        mouseup: 'pointerup',
        mousedown: 'pointerdown',
        mousemove: 'pointermove'
    };
    var microsoft = {
        mouseup: 'MSPointerUp',
        mousedown: 'MSPointerDown',
        mousemove: 'MSPointerMove'
    };

    /** @namespace global.navigator.pointerEnabled -- resolving webstorm unresolved variables */
    /** @namespace global.navigator.msPointerEnabled -- resolving webstorm unresolved variables */
    if (global.navigator.pointerEnabled) {
        crossvent[op](el, pointers[type] || type, fn);
    } else if (global.navigator.msPointerEnabled) {
        crossvent[op](el, microsoft[type] || type, fn);
    } else {
        crossvent[op](el, touch[type] || type, fn);
        crossvent[op](el, type, fn);
    }
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"crossvent":3}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkcmFnb24uanMiLCJub2RlX21vZHVsZXMvY3Jvc3N2ZW50L25vZGVfbW9kdWxlcy9jdXN0b20tZXZlbnQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvY3Jvc3N2ZW50L3NyYy9jcm9zc3ZlbnQuanMiLCJub2RlX21vZHVsZXMvY3Jvc3N2ZW50L3NyYy9ldmVudG1hcC5qcyIsInV0aWxzL2NsYXNzZXMuanMiLCJ1dGlscy90b3VjaHkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ3hlQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ3JHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG5cbnZhciB0b3VjaHkgPSByZXF1aXJlKCcuL3V0aWxzL3RvdWNoeScpLFxuICAgIGNsYXNzZXMgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzZXMnKSxcbiAgICBkb2MgPSBkb2N1bWVudCxcbiAgICBkb2NFbG0gPSBkb2MuZG9jdW1lbnRFbGVtZW50LFxuICAgIGRyYWdvblNwYWNlID0ge1xuICAgICAgZHJhZ29uczogW10sXG4gICAgICBkcmFnczogW10sXG4gICAgICBjb250YWluZXJzTG9va3VwOiBbXSxcbiAgICAgIGNvbnRhaW5lcnM6IFtdXG4gICAgfSxcbiAgICBpZCA9IDAsXG5cbiAgICBERVYgPSB0cnVlO1xuXG50b3VjaHkoZG9jRWxtLCAnYWRkJywgJ21vdXNlZG93bicsIGdyYWIpO1xuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8gRHJhZ29uID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vKiogaXMgZ3JvdXAgb2YgY29udGFpbmVycyB3aXRoIHNhbWUgc2V0dGluZ3MgKi9cbmZ1bmN0aW9uIERyYWdvbiAob3B0aW9ucykge1xuICBpZihERVYpIGNvbnNvbGUubG9nKCdEcmFnb24gaW5zdGFuY2UgY3JlYXRlZCwgb3B0aW9uczogJywgb3B0aW9ucyk7XG5cbiAgdGhpcy5vcHRpb25zID0gb3B0aW9ucyBpbnN0YW5jZW9mIEFycmF5ID8ge2NvbnRhaW5lcnM6IG9wdGlvbnN9IDogb3B0aW9ucyB8fCB7fTtcbiAgdGhpcy5jb250YWluZXJzID0gW107XG4gIHRoaXMuZHJhZ29uU3BhY2UgPSBkcmFnb25TcGFjZTtcbiAgdGhpcy5pZCA9IHRoaXMub3B0aW9ucy5pZCB8fCAnZHJhZ29uJyArIGlkKys7XG4gIFxuICBkcmFnb25TcGFjZS5kcmFnb25zLnB1c2godGhpcyk7IC8vIHJlZ2lzdGVyIGRyYWdvblxuXG4gIGlmKHRoaXMub3B0aW9ucy5jb250YWluZXJzKVxuICAgIHRoaXMuYWRkQ29udGFpbmVycyh0aGlzLm9wdGlvbnMuY29udGFpbmVycyk7XG59XG5cbkRyYWdvbi5wcm90b3R5cGUuYWRkQ29udGFpbmVycyA9IGZ1bmN0aW9uKGNvbnRhaW5lcnMpIHtcbiAgaWYoREVWKSBjb25zb2xlLmxvZygnQWRkaW5nIGNvbnRhaW5lcnM6ICcsIGNvbnRhaW5lcnMpO1xuXG4gIHZhciBzZWxmID0gdGhpcztcbiAgY29udGFpbmVycy5mb3JFYWNoKGZ1bmN0aW9uIChjb250YWluZXJFbG0pIHtcbiAgICB2YXIgY29udGFpbmVyID0gbmV3IENvbnRhaW5lcihzZWxmLCBjb250YWluZXJFbG0pO1xuICAgIHNlbGYuY29udGFpbmVycy5wdXNoKGNvbnRhaW5lcik7XG4gICAgZHJhZ29uU3BhY2UuY29udGFpbmVycy5wdXNoKGNvbnRhaW5lcik7XG4gICAgZHJhZ29uU3BhY2UuY29udGFpbmVyc0xvb2t1cC5wdXNoKGNvbnRhaW5lckVsbSk7XG4gIH0pO1xufTtcblxuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8gQ29udGFpbmVyID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbmZ1bmN0aW9uIENvbnRhaW5lcihkcmFnb24sIGVsbSkge1xuICBpZihERVYpIGNvbnNvbGUubG9nKCdDb250YWluZXIgaW5zdGFuY2UgY3JlYXRlZCwgZWxtOicsIGVsbSk7XG5cbiAgdGhpcy5pZCA9IGVsbS5pZCB8fCAnY29udGFpbmVyJyArIGlkKys7XG4gIHRoaXMuZHJhZ29uID0gZHJhZ29uO1xuICB0aGlzLmVsbSA9IGVsbTtcbiAgdGhpcy5vcHRpb25zID0ge307XG4gIHRoaXMub3B0aW9ucy5taXJyb3JDb250YWluZXIgPSBkb2MuYm9keTtcbn1cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vIERyYWcgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmZ1bmN0aW9uIERyYWcoZSwgaXRlbSwgc291cmNlKSB7XG5cbiAgaWYoREVWKSBjb25zb2xlLmxvZygnRHJhZyBpbnN0YW5jZSBjcmVhdGVkLCBwYXJhbXM6JywgZSwgaXRlbSwgc291cmNlKTtcblxuICAvLyB0aGlzLm1pcnJvcjsgLy8gbWlycm9yIGltYWdlXG4gIC8vIHRoaXMuc291cmNlOyAvLyBzb3VyY2UgY29udGFpbmVyIGVsZW1lbnRcbiAgLy8gdGhpcy5zb3VyY2U7IC8vIHNvdXJjZSBDb250YWluZXIgb2JqZWN0XG4gIC8vIHRoaXMuaXRlbTsgLy8gaXRlbSBlbGVtZW50IGJlaW5nIGRyYWdnZWRcbiAgLy8gdGhpcy5vZmZzZXRYOyAvLyByZWZlcmVuY2UgeFxuICAvLyB0aGlzLm9mZnNldFk7IC8vIHJlZmVyZW5jZSB5XG4gIC8vIHRoaXMubW92ZVg7IC8vIHJlZmVyZW5jZSBtb3ZlIHhcbiAgLy8gdGhpcy5tb3ZlWTsgLy8gcmVmZXJlbmNlIG1vdmUgeVxuICAvLyB0aGlzLmluaXRpYWxTaWJsaW5nOyAvLyByZWZlcmVuY2Ugc2libGluZyB3aGVuIGdyYWJiZWRcbiAgLy8gdGhpcy5jdXJyZW50U2libGluZzsgLy8gcmVmZXJlbmNlIHNpYmxpbmcgbm93XG4gIC8vIHRoaXMuc3RhdGU7IC8vIGhvbGRzIERyYWcgc3RhdGUgKGdyYWJiZWQsIHRyYWNraW5nLCB3YWl0aW5nLCBkcmFnZ2luZywgLi4uKVxuXG4gIGUucHJldmVudERlZmF1bHQoKTsgLy8gZml4ZXMgZ2l0aHViLmNvbS9iZXZhY3F1YS9kcmFndWxhL2lzc3Vlcy8xNTVcbiAgdGhpcy5tb3ZlWCA9IGUuY2xpZW50WDtcbiAgdGhpcy5tb3ZlWSA9IGUuY2xpZW50WTtcblxuICBpZihERVYpIGNvbnNvbGUubG9nKCcqKiogQ2hhbmdpbmcgc3RhdGU6ICcsIHRoaXMuc3RhdGUsICcgLT4gZ3JhYmJlZCcpO1xuICB0aGlzLnN0YXRlID0gJ2dyYWJiZWQnO1xuXG4gIHRoaXMuaXRlbSA9IGl0ZW07XG4gIHRoaXMuc291cmNlID0gc291cmNlO1xuICB0aGlzLnNvdXJjZUNvbnRhaW5lciA9IGdldENvbnRhaW5lcihzb3VyY2UpO1xuICB0aGlzLm9wdGlvbnMgPSB0aGlzLnNvdXJjZUNvbnRhaW5lci5vcHRpb25zIHx8IHt9O1xuXG4gIHRoaXMuZXZlbnRzKCk7XG59XG5cbkRyYWcucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcbiAgaWYoREVWKSBjb25zb2xlLmxvZygnRHJhZy5kZXN0cm95IGNhbGxlZCcpO1xuXG4gIHRoaXMucmVsZWFzZSh7fSk7XG59O1xuXG5EcmFnLnByb3RvdHlwZS5ldmVudHMgPSBmdW5jdGlvbihyZW1vdmUpIHtcbiAgaWYoREVWKSBjb25zb2xlLmxvZygnRHJhZy5ldmVudHMgY2FsbGVkLCBcInJlbW92ZVwiIHBhcmFtOicsIHJlbW92ZSk7XG5cbiAgdmFyIG9wID0gcmVtb3ZlID8gJ3JlbW92ZScgOiAnYWRkJztcbiAgdG91Y2h5KGRvY0VsbSwgb3AsICdtb3VzZXVwJywgYmluZCh0aGlzLCAncmVsZWFzZScpKTtcbiAgdG91Y2h5KGRvY0VsbSwgb3AsICdtb3VzZW1vdmUnLCBiaW5kKHRoaXMsICdkcmFnJykpO1xuICB0b3VjaHkoZG9jRWxtLCBvcCwgJ3NlbGVjdHN0YXJ0JywgYmluZCh0aGlzLCAncHJvdGVjdEdyYWInKSk7IC8vIElFOFxuICB0b3VjaHkoZG9jRWxtLCBvcCwgJ2NsaWNrJywgYmluZCh0aGlzLCAncHJvdGVjdEdyYWInKSk7XG59O1xuXG5EcmFnLnByb3RvdHlwZS5wcm90ZWN0R3JhYiA9IGZ1bmN0aW9uKGUpIHtcbiAgaWYoREVWKSBjb25zb2xlLmxvZygnRHJhZy5wcm90ZWN0R3JhYiBjYWxsZWQsIGU6JywgZSk7XG5cbiAgaWYgKHRoaXMuc3RhdGUgPT0gJ2dyYWJiZWQnKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICB9XG59O1xuXG5EcmFnLnByb3RvdHlwZS5kcmFnID0gZnVuY3Rpb24oZSkge1xuICBpZihERVYpIGNvbnNvbGUubG9nKCdEcmFnLmRyYWcgY2FsbGVkLCBlOicsIGUpO1xuXG4gIGlmKHRoaXMuc3RhdGUgPT0gJ2dyYWJiZWQnKXtcbiAgICB0aGlzLnN0YXJ0QnlNb3ZlbWVudChlKTtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYodGhpcy5zdGF0ZSAhPT0gJ21vdmVkJyAmJiB0aGlzLnN0YXRlICE9PSAnZHJhZ2dpbmcnKXtcbiAgICB0aGlzLmNhbmNlbCgpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmKERFVikgY29uc29sZS5sb2coJyoqKiBDaGFuZ2luZyBzdGF0ZTogJywgdGhpcy5zdGF0ZSwgJyAtPiBkcmFnZ2luZycpO1xuICB0aGlzLnN0YXRlID0gJ2RyYWdnaW5nJztcblxuICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgdmFyIGNsaWVudFggPSBnZXRDb29yZCgnY2xpZW50WCcsIGUpLFxuICAgICAgY2xpZW50WSA9IGdldENvb3JkKCdjbGllbnRZJywgZSksXG4gICAgICB4ID0gY2xpZW50WCAtIHRoaXMub2Zmc2V0WCxcbiAgICAgIHkgPSBjbGllbnRZIC0gdGhpcy5vZmZzZXRZLFxuICAgICAgbWlycm9yID0gdGhpcy5taXJyb3I7XG5cbiAgbWlycm9yLnN0eWxlLmxlZnQgPSB4ICsgJ3B4JztcbiAgbWlycm9yLnN0eWxlLnRvcCA9IHkgKyAncHgnO1xuXG4gIHZhciBlbGVtZW50QmVoaW5kQ3Vyc29yID0gZ2V0RWxlbWVudEJlaGluZFBvaW50KG1pcnJvciwgY2xpZW50WCwgY2xpZW50WSksXG4gICAgICBkcm9wVGFyZ2V0ID0gZmluZERyb3BUYXJnZXQoZWxlbWVudEJlaGluZEN1cnNvciwgY2xpZW50WCwgY2xpZW50WSksXG4gICAgICByZWZlcmVuY2UsXG4gICAgICBpbW1lZGlhdGUgPSBnZXRJbW1lZGlhdGVDaGlsZChkcm9wVGFyZ2V0LCBlbGVtZW50QmVoaW5kQ3Vyc29yKTtcblxuICBpZiAoaW1tZWRpYXRlICE9PSBudWxsKSB7XG4gICAgcmVmZXJlbmNlID0gZ2V0UmVmZXJlbmNlKGRyb3BUYXJnZXQsIGltbWVkaWF0ZSwgY2xpZW50WCwgY2xpZW50WSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChcbiAgICAgIHJlZmVyZW5jZSA9PT0gbnVsbCB8fFxuICAgICAgcmVmZXJlbmNlICE9PSB0aGlzLml0ZW0gJiZcbiAgICAgIHJlZmVyZW5jZSAhPT0gbmV4dEVsKHRoaXMuaXRlbSlcbiAgKSB7XG4gICAgdGhpcy5jdXJyZW50U2libGluZyA9IHJlZmVyZW5jZTtcbiAgICBkcm9wVGFyZ2V0Lmluc2VydEJlZm9yZSh0aGlzLml0ZW0sIHJlZmVyZW5jZSk7XG4gIH1cbn07XG5cbkRyYWcucHJvdG90eXBlLnN0YXJ0QnlNb3ZlbWVudCA9IGZ1bmN0aW9uKGUpIHtcbiAgaWYoREVWKSBjb25zb2xlLmxvZygnRHJhZy5zdGFydEJ5TW92ZW1lbnQgY2FsbGVkLCBlOicsIGUpO1xuXG4gIC8vIGlmICh3aGljaE1vdXNlQnV0dG9uKGUpID09PSAwKSB7XG4gIC8vICAgcmVsZWFzZSh7fSk7XG4gIC8vICAgcmV0dXJuOyAvLyB3aGVuIHRleHQgaXMgc2VsZWN0ZWQgb24gYW4gaW5wdXQgYW5kIHRoZW4gZHJhZ2dlZCwgbW91c2V1cCBkb2Vzbid0IGZpcmUuIHRoaXMgaXMgb3VyIG9ubHkgaG9wZVxuICAvLyB9XG5cbiAgLy8gdHJ1dGh5IGNoZWNrIGZpeGVzIGdpdGh1Yi5jb20vYmV2YWNxdWEvZHJhZ3VsYS9pc3N1ZXMvMjM5LCBlcXVhbGl0eSBmaXhlcyBnaXRodWIuY29tL2JldmFjcXVhL2RyYWd1bGEvaXNzdWVzLzIwN1xuICBpZiAoZS5jbGllbnRYICE9PSB2b2lkIDAgJiYgZS5jbGllbnRYID09PSB0aGlzLm1vdmVYICYmIGUuY2xpZW50WSAhPT0gdm9pZCAwICYmIGUuY2xpZW50WSA9PT0gdGhpcy5tb3ZlWSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHRoaXMuaW5pdGlhbFNpYmxpbmcgPSB0aGlzLmN1cnJlbnRTaWJsaW5nID0gbmV4dEVsKHRoaXMuaXRlbSk7XG5cbiAgdmFyIG9mZnNldCA9IGdldE9mZnNldCh0aGlzLml0ZW0pO1xuICB0aGlzLm9mZnNldFggPSBnZXRDb29yZCgncGFnZVgnLCBlKSAtIG9mZnNldC5sZWZ0O1xuICB0aGlzLm9mZnNldFkgPSBnZXRDb29yZCgncGFnZVknLCBlKSAtIG9mZnNldC50b3A7XG5cbiAgY2xhc3Nlcy5hZGQodGhpcy5pdGVtLCAnZ3UtdHJhbnNpdCcpO1xuICB0aGlzLnJlbmRlck1pcnJvckltYWdlKHRoaXMub3B0aW9ucy5taXJyb3JDb250YWluZXIpO1xuXG4gIGlmKERFVikgY29uc29sZS5sb2coJyoqKiBDaGFuZ2luZyBzdGF0ZTogJywgdGhpcy5zdGF0ZSwgJyAtPiBtb3ZlZCcpO1xuICB0aGlzLnN0YXRlID0gJ21vdmVkJztcbn07XG5cbkRyYWcucHJvdG90eXBlLnJlbmRlck1pcnJvckltYWdlID0gZnVuY3Rpb24obWlycm9yQ29udGFpbmVyKSB7XG4gIGlmKERFVikgY29uc29sZS5sb2coJ0RyYWcucmVuZGVyTWlycm9ySW1hZ2UgY2FsbGVkLCBlOicsIG1pcnJvckNvbnRhaW5lcik7XG5cbiAgdmFyIHJlY3QgPSB0aGlzLml0ZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gIHZhciBtaXJyb3IgPSB0aGlzLm1pcnJvciA9IHRoaXMuaXRlbS5jbG9uZU5vZGUodHJ1ZSk7XG5cbiAgbWlycm9yLnN0eWxlLndpZHRoID0gZ2V0UmVjdFdpZHRoKHJlY3QpICsgJ3B4JztcbiAgbWlycm9yLnN0eWxlLmhlaWdodCA9IGdldFJlY3RIZWlnaHQocmVjdCkgKyAncHgnO1xuICBjbGFzc2VzLnJtKG1pcnJvciwgJ2d1LXRyYW5zaXQnKTtcbiAgY2xhc3Nlcy5hZGQobWlycm9yLCAnZ3UtbWlycm9yJyk7XG4gIG1pcnJvckNvbnRhaW5lci5hcHBlbmRDaGlsZChtaXJyb3IpO1xuICBjbGFzc2VzLmFkZChtaXJyb3JDb250YWluZXIsICdndS11bnNlbGVjdGFibGUnKTtcbn07XG5cbkRyYWcucHJvdG90eXBlLnJlbGVhc2UgPSBmdW5jdGlvbihlKSB7XG4gIGlmKERFVikgY29uc29sZS5sb2coJ0RyYWcucmVsZWFzZSBjYWxsZWQsIGU6JywgZSk7XG5cbiAgdG91Y2h5KGRvY0VsbSwgJ3JlbW92ZScsICdtb3VzZXVwJywgdGhpcy5yZWxlYXNlKTtcblxuICB2YXIgY2xpZW50WCA9IGdldENvb3JkKCdjbGllbnRYJywgZSk7XG4gIHZhciBjbGllbnRZID0gZ2V0Q29vcmQoJ2NsaWVudFknLCBlKTtcblxuICB2YXIgZWxlbWVudEJlaGluZEN1cnNvciA9IGdldEVsZW1lbnRCZWhpbmRQb2ludCh0aGlzLm1pcnJvciwgY2xpZW50WCwgY2xpZW50WSk7XG4gIHZhciBkcm9wVGFyZ2V0ID0gZmluZERyb3BUYXJnZXQoZWxlbWVudEJlaGluZEN1cnNvciwgY2xpZW50WCwgY2xpZW50WSk7XG4gIGlmIChkcm9wVGFyZ2V0ICYmIGRyb3BUYXJnZXQgIT09IHRoaXMuc291cmNlKSB7XG4gICAgdGhpcy5kcm9wKGUsIHRoaXMuaXRlbSwgZHJvcFRhcmdldCk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5jYW5jZWwoKTtcbiAgfVxufTtcblxuRHJhZy5wcm90b3R5cGUuZHJvcCA9IGZ1bmN0aW9uKCkge1xuICBpZihERVYpIGNvbnNvbGUubG9nKCdEcmFnLmRyb3AgY2FsbGVkJyk7XG4gIGlmICh0aGlzLnN0YXRlICE9ICdkcmFnZ2luZycpXG4gICAgcmV0dXJuO1xuXG4gIGlmKERFVikgY29uc29sZS5sb2coJyoqKiBDaGFuZ2luZyBzdGF0ZTogJywgdGhpcy5zdGF0ZSwgJyAtPiBkcm9wcGVkJyk7XG4gIHRoaXMuc3RhdGUgPSAnZHJvcHBlZCc7XG5cbiAgdGhpcy5jbGVhbnVwKCk7XG59O1xuXG5EcmFnLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbigpIHtcbiAgaWYoREVWKSBjb25zb2xlLmxvZygnRHJhZy5yZW1vdmUgY2FsbGVkLCBlOicsIGUpO1xuXG4gIGlmICh0aGlzLnN0YXRlICE9PSAnZHJhZ2luZycpXG4gICAgcmV0dXJuO1xuXG4gIGlmKERFVikgY29uc29sZS5sb2coJyoqKiBDaGFuZ2luZyBzdGF0ZTogJywgdGhpcy5zdGF0ZSwgJyAtPiBkcmFnZ2luZycpO1xuICB0aGlzLnN0YXRlID0gJ3JlbW92ZWQnO1xuXG4gIHZhciBwYXJlbnQgPSBnZXRQYXJlbnQodGhpcy5pdGVtKTtcbiAgaWYgKHBhcmVudCkge1xuICAgIHBhcmVudC5yZW1vdmVDaGlsZCh0aGlzLml0ZW0pO1xuICB9XG4gIHRoaXMuY2xlYW51cCgpO1xufTtcblxuRHJhZy5wcm90b3R5cGUuY2FuY2VsID0gZnVuY3Rpb24ocmV2ZXJ0cyl7XG4gIGlmKERFVikgY29uc29sZS5sb2coJ0RyYWcuY2FuY2VsIGNhbGxlZCwgcmV2ZXJ0czonLCByZXZlcnRzKTtcblxuICBpZiAodGhpcy5zdGF0ZSA9PSAnZHJhZ2luZycpe1xuICAgICAgdmFyIHBhcmVudCA9IGdldFBhcmVudCh0aGlzLml0ZW0pO1xuICAgICAgdmFyIGluaXRpYWwgPSB0aGlzLmlzSW5pdGlhbFBsYWNlbWVudChwYXJlbnQpO1xuICAgICAgaWYgKGluaXRpYWwgPT09IGZhbHNlICYmIHJldmVydHMpIHtcbiAgICAgICAgICB0aGlzLnNvdXJjZS5pbnNlcnRCZWZvcmUodGhpcy5pdGVtLCB0aGlzLmluaXRpYWxTaWJsaW5nKTtcbiAgICAgIH1cbiAgfVxuXG4gIGlmKERFVikgY29uc29sZS5sb2coJyoqKiBDaGFuZ2luZyBzdGF0ZTogJywgdGhpcy5zdGF0ZSwgJyAtPiBjYW5jZWxsZWQnKTtcbiAgdGhpcy5zdGF0ZSA9ICdjYW5jZWxsZWQnO1xuXG4gIHRoaXMuY2xlYW51cCgpO1xufTtcblxuRHJhZy5wcm90b3R5cGUuY2xlYW51cCA9IGZ1bmN0aW9uKCkge1xuICBpZihERVYpIGNvbnNvbGUubG9nKCdEcmFnLmNsZWFudXAgY2FsbGVkJyk7XG5cbiAgdGhpcy5ldmVudHMoJ3JlbW92ZScpO1xuXG4gIGlmKHRoaXMubWlycm9yKVxuICAgIHJlbW92ZU1pcnJvckltYWdlKHRoaXMubWlycm9yKTtcblxuICBpZiAodGhpcy5pdGVtKSB7XG4gICAgY2xhc3Nlcy5ybSh0aGlzLml0ZW0sICdndS10cmFuc2l0Jyk7XG4gIH1cblxuICBpZihERVYpIGNvbnNvbGUubG9nKCcqKiogQ2hhbmdpbmcgc3RhdGU6ICcsIHRoaXMuc3RhdGUsICcgLT4gY2xlYW5lZCcpO1xuICB0aGlzLnN0YXRlID0gJ2NsZWFuZWQnO1xuXG4gIHRoaXMuc291cmNlID0gdGhpcy5pdGVtID0gdGhpcy5pbml0aWFsU2libGluZyA9IHRoaXMuY3VycmVudFNpYmxpbmcgPSBudWxsO1xufTtcblxuRHJhZy5wcm90b3R5cGUuaXNJbml0aWFsUGxhY2VtZW50ICA9IGZ1bmN0aW9uKHRhcmdldCxzKSB7XG4gIHZhciBzaWJsaW5nO1xuICBpZiAocyAhPT0gdm9pZCAwKSB7XG4gICAgc2libGluZyA9IHM7XG4gIH0gZWxzZSBpZiAodGhpcy5taXJyb3IpIHtcbiAgICBzaWJsaW5nID0gdGhpcy5jdXJyZW50U2libGluZztcbiAgfSBlbHNlIHtcbiAgICBzaWJsaW5nID0gbmV4dEVsKHRoaXMuaXRlbSk7XG4gIH1cbiAgcmV0dXJuIHRhcmdldCA9PT0gdGhpcy5zb3VyY2UgJiYgc2libGluZyA9PT0gdGhpcy5pbml0aWFsU2libGluZztcbn07XG5cblxuLy8gRGVjbGFyYXRpb25zXG5cbmZ1bmN0aW9uIGdyYWIoZSkge1xuICBpZihERVYpIGNvbnNvbGUubG9nKCdncmFiIGNhbGxlZCwgZTonLCBlKTtcblxuICB2YXIgaXRlbSA9IGUudGFyZ2V0LFxuICAgICAgc291cmNlO1xuXG4gIC8vIGlmIChpc0lucHV0KGl0ZW0pKSB7IC8vIHNlZSBhbHNvOiBnaXRodWIuY29tL2JldmFjcXVhL2RyYWd1bGEvaXNzdWVzLzIwOFxuICAvLyAgIGUudGFyZ2V0LmZvY3VzKCk7IC8vIGZpeGVzIGdpdGh1Yi5jb20vYmV2YWNxdWEvZHJhZ3VsYS9pc3N1ZXMvMTc2XG4gIC8vICAgcmV0dXJuO1xuICAvLyB9XG5cbiAgd2hpbGUgKGdldFBhcmVudChpdGVtKSAmJiAhaXNDb250YWluZXIoZ2V0UGFyZW50KGl0ZW0pLCBpdGVtLCBlKSkge1xuICAgIGl0ZW0gPSBnZXRQYXJlbnQoaXRlbSk7IC8vIGRyYWcgdGFyZ2V0IHNob3VsZCBiZSBhIHRvcCBlbGVtZW50XG4gIH1cbiAgc291cmNlID0gZ2V0UGFyZW50KGl0ZW0pO1xuICBpZiAoIXNvdXJjZSkge1xuICAgIHJldHVybjtcbiAgfVxuICBkcmFnb25TcGFjZS5kcmFncy5wdXNoKG5ldyBEcmFnKGUsIGl0ZW0sIHNvdXJjZSkpO1xufVxuXG5mdW5jdGlvbiBiaW5kKG9iaiwgbWV0aG9kTmFtZSl7XG4gIHZhciBiaW5kZWROYW1lID0gJ2JpbmRlZCcgKyBtZXRob2ROYW1lO1xuICBpZighb2JqW2JpbmRlZE5hbWVdKVxuICAgIG9ialtiaW5kZWROYW1lXSA9IGZ1bmN0aW9uKCl7XG4gICAgICBvYmpbbWV0aG9kTmFtZV0uYXBwbHkob2JqLCBhcmd1bWVudHMpO1xuICAgIH07XG4gIHJldHVybiBvYmpbYmluZGVkTmFtZV07XG59XG5cbmZ1bmN0aW9uIHJlbW92ZU1pcnJvckltYWdlIChtaXJyb3IpIHtcbiAgdmFyIG1pcnJvckNvbnRhaW5lciA9IGdldFBhcmVudChtaXJyb3IpO1xuICBjbGFzc2VzLnJtKG1pcnJvckNvbnRhaW5lciwgJ2d1LXVuc2VsZWN0YWJsZScpO1xuICBtaXJyb3JDb250YWluZXIucmVtb3ZlQ2hpbGQobWlycm9yKTtcbn1cblxuZnVuY3Rpb24gZmluZERyb3BUYXJnZXQgKGVsZW1lbnRCZWhpbmRDdXJzb3IpIHtcbiAgdmFyIHRhcmdldCA9IGVsZW1lbnRCZWhpbmRDdXJzb3I7XG4gIHdoaWxlICh0YXJnZXQgJiYgIWlzQ29udGFpbmVyKHRhcmdldCkpIHtcbiAgICB0YXJnZXQgPSBnZXRQYXJlbnQodGFyZ2V0KTtcbiAgfVxuICByZXR1cm4gdGFyZ2V0O1xufVxuXG5mdW5jdGlvbiBpc0NvbnRhaW5lcihlbG0pIHtcbiAgcmV0dXJuIGRyYWdvblNwYWNlLmNvbnRhaW5lcnNMb29rdXAuaW5kZXhPZihlbG0pKzE7XG59XG5cbmZ1bmN0aW9uIGdldEltbWVkaWF0ZUNoaWxkIChkcm9wVGFyZ2V0LCB0YXJnZXQpIHtcbiAgdmFyIGltbWVkaWF0ZSA9IHRhcmdldDtcbiAgd2hpbGUgKGltbWVkaWF0ZSAhPT0gZHJvcFRhcmdldCAmJiBnZXRQYXJlbnQoaW1tZWRpYXRlKSAhPT0gZHJvcFRhcmdldCkge1xuICAgIGltbWVkaWF0ZSA9IGdldFBhcmVudChpbW1lZGlhdGUpO1xuICB9XG4gIGlmIChpbW1lZGlhdGUgPT09IGRvY0VsbSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHJldHVybiBpbW1lZGlhdGU7XG59XG5cbmZ1bmN0aW9uIGdldFJlZmVyZW5jZSAoZHJvcFRhcmdldCwgdGFyZ2V0LCB4LCB5LCBkaXJlY3Rpb24pIHtcbiAgdmFyIGhvcml6b250YWwgPSBkaXJlY3Rpb24gPT09ICdob3Jpem9udGFsJztcbiAgcmV0dXJuIHRhcmdldCAhPT0gZHJvcFRhcmdldCA/IGluc2lkZSgpIDogb3V0c2lkZSgpOyAvLyByZWZlcmVuY2VcblxuICBmdW5jdGlvbiBvdXRzaWRlICgpIHsgLy8gc2xvd2VyLCBidXQgYWJsZSB0byBmaWd1cmUgb3V0IGFueSBwb3NpdGlvblxuICAgIHZhciBsZW4gPSBkcm9wVGFyZ2V0LmNoaWxkcmVuLmxlbmd0aCxcbiAgICAgICAgaSxcbiAgICAgICAgZWwsXG4gICAgICAgIHJlY3Q7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGVsID0gZHJvcFRhcmdldC5jaGlsZHJlbltpXTtcbiAgICAgIHJlY3QgPSBlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgIGlmIChob3Jpem9udGFsICYmIChyZWN0LmxlZnQgKyByZWN0LndpZHRoIC8gMikgPiB4KSB7IHJldHVybiBlbDsgfVxuICAgICAgaWYgKCFob3Jpem9udGFsICYmIChyZWN0LnRvcCArIHJlY3QuaGVpZ2h0IC8gMikgPiB5KSB7IHJldHVybiBlbDsgfVxuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgZnVuY3Rpb24gaW5zaWRlICgpIHsgLy8gZmFzdGVyLCBidXQgb25seSBhdmFpbGFibGUgaWYgZHJvcHBlZCBpbnNpZGUgYSBjaGlsZCBlbGVtZW50XG4gICAgdmFyIHJlY3QgPSB0YXJnZXQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgaWYgKGhvcml6b250YWwpIHtcbiAgICAgIHJldHVybiByZXNvbHZlKHggPiByZWN0LmxlZnQgKyBnZXRSZWN0V2lkdGgocmVjdCkgLyAyKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc29sdmUoeSA+IHJlY3QudG9wICsgZ2V0UmVjdEhlaWdodChyZWN0KSAvIDIpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVzb2x2ZSAoYWZ0ZXIpIHtcbiAgICByZXR1cm4gYWZ0ZXIgPyBuZXh0RWwodGFyZ2V0KSA6IHRhcmdldDtcbiAgfVxufVxuXG5cbi8vIGZ1bmN0aW9uIHdoaWNoTW91c2VCdXR0b24gKGUpIHtcbi8vICAgLyoqIEBuYW1lc3BhY2UgZS50b3VjaGVzIC0tIHJlc29sdmluZyB3ZWJzdG9ybSB1bnJlc29sdmVkIHZhcmlhYmxlcyAqL1xuLy8gICBpZiAoZS50b3VjaGVzICE9PSB2b2lkIDApIHsgcmV0dXJuIGUudG91Y2hlcy5sZW5ndGg7IH1cbi8vICAgaWYgKGUud2hpY2ggIT09IHZvaWQgMCAmJiBlLndoaWNoICE9PSAwKSB7IHJldHVybiBlLndoaWNoOyB9IC8vIHNlZSBnaXRodWIuY29tL2JldmFjcXVhL2RyYWd1bGEvaXNzdWVzLzI2MVxuLy8gICBpZiAoZS5idXR0b25zICE9PSB2b2lkIDApIHsgcmV0dXJuIGUuYnV0dG9uczsgfVxuLy8gICB2YXIgYnV0dG9uID0gZS5idXR0b247XG4vLyAgIGlmIChidXR0b24gIT09IHZvaWQgMCkgeyAvLyBzZWUgZ2l0aHViLmNvbS9qcXVlcnkvanF1ZXJ5L2Jsb2IvOTllOGZmMWJhYTdhZTM0MWU5NGJiODljM2U4NDU3MGM3YzNhZDllYS9zcmMvZXZlbnQuanMjTDU3My1MNTc1XG4vLyAgICAgcmV0dXJuIGJ1dHRvbiAmIDEgPyAxIDogYnV0dG9uICYgMiA/IDMgOiAoYnV0dG9uICYgNCA/IDIgOiAwKTtcbi8vICAgfVxuLy8gfVxuXG5mdW5jdGlvbiBnZXRPZmZzZXQgKGVsKSB7XG4gIHZhciByZWN0ID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gIHJldHVybiB7XG4gICAgbGVmdDogcmVjdC5sZWZ0ICsgZ2V0U2Nyb2xsKCdzY3JvbGxMZWZ0JywgJ3BhZ2VYT2Zmc2V0JyksXG4gICAgdG9wOiByZWN0LnRvcCArIGdldFNjcm9sbCgnc2Nyb2xsVG9wJywgJ3BhZ2VZT2Zmc2V0JylcbiAgfTtcbn1cblxuZnVuY3Rpb24gZ2V0U2Nyb2xsIChzY3JvbGxQcm9wLCBvZmZzZXRQcm9wKSB7XG4gIGlmICh0eXBlb2YgZ2xvYmFsW29mZnNldFByb3BdICE9PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybiBnbG9iYWxbb2Zmc2V0UHJvcF07XG4gIH1cbiAgaWYgKGRvY0VsbS5jbGllbnRIZWlnaHQpIHtcbiAgICByZXR1cm4gZG9jRWxtW3Njcm9sbFByb3BdO1xuICB9XG4gIHJldHVybiBkb2MuYm9keVtzY3JvbGxQcm9wXTtcbn1cblxuZnVuY3Rpb24gZ2V0RWxlbWVudEJlaGluZFBvaW50IChwb2ludCwgeCwgeSkge1xuICB2YXIgcCA9IHBvaW50IHx8IHt9LFxuICAgICAgc3RhdGUgPSBwLmNsYXNzTmFtZSxcbiAgICAgIGVsO1xuICBwLmNsYXNzTmFtZSArPSAnIGd1LWhpZGUnO1xuICBlbCA9IGRvYy5lbGVtZW50RnJvbVBvaW50KHgsIHkpO1xuICBwLmNsYXNzTmFtZSA9IHN0YXRlO1xuICByZXR1cm4gZWw7XG59XG5cbmZ1bmN0aW9uIG5ldmVyICgpIHsgcmV0dXJuIGZhbHNlOyB9XG5mdW5jdGlvbiBhbHdheXMgKCkgeyByZXR1cm4gdHJ1ZTsgfVxuZnVuY3Rpb24gZ2V0UmVjdFdpZHRoIChyZWN0KSB7IHJldHVybiByZWN0LndpZHRoIHx8IChyZWN0LnJpZ2h0IC0gcmVjdC5sZWZ0KTsgfVxuZnVuY3Rpb24gZ2V0UmVjdEhlaWdodCAocmVjdCkgeyByZXR1cm4gcmVjdC5oZWlnaHQgfHwgKHJlY3QuYm90dG9tIC0gcmVjdC50b3ApOyB9XG5mdW5jdGlvbiBnZXRQYXJlbnQgKGVsKSB7IHJldHVybiBlbC5wYXJlbnROb2RlID09PSBkb2MgPyBudWxsIDogZWwucGFyZW50Tm9kZTsgfVxuZnVuY3Rpb24gZ2V0Q29udGFpbmVyIChlbCkgeyByZXR1cm4gZHJhZ29uU3BhY2UuY29udGFpbmVyc1tkcmFnb25TcGFjZS5jb250YWluZXJzTG9va3VwLmluZGV4T2YoZWwpXSB9XG5mdW5jdGlvbiBpc0lucHV0IChlbCkgeyByZXR1cm4gZWwudGFnTmFtZSA9PT0gJ0lOUFVUJyB8fCBlbC50YWdOYW1lID09PSAnVEVYVEFSRUEnIHx8IGVsLnRhZ05hbWUgPT09ICdTRUxFQ1QnIHx8IGlzRWRpdGFibGUoZWwpOyB9XG5mdW5jdGlvbiBpc0VkaXRhYmxlIChlbCkge1xuICAvKiogQG5hbWVzcGFjZSBlbC5jb250ZW50RWRpdGFibGUgLS0gcmVzb2x2aW5nIHdlYnN0b3JtIHVucmVzb2x2ZWQgdmFyaWFibGVzICovXG4gIGlmICghZWwpIHsgcmV0dXJuIGZhbHNlOyB9IC8vIG5vIHBhcmVudHMgd2VyZSBlZGl0YWJsZVxuICBpZiAoZWwuY29udGVudEVkaXRhYmxlID09PSAnZmFsc2UnKSB7IHJldHVybiBmYWxzZTsgfSAvLyBzdG9wIHRoZSBsb29rdXBcbiAgaWYgKGVsLmNvbnRlbnRFZGl0YWJsZSA9PT0gJ3RydWUnKSB7IHJldHVybiB0cnVlOyB9IC8vIGZvdW5kIGEgY29udGVudEVkaXRhYmxlIGVsZW1lbnQgaW4gdGhlIGNoYWluXG4gIHJldHVybiBpc0VkaXRhYmxlKGdldFBhcmVudChlbCkpOyAvLyBjb250ZW50RWRpdGFibGUgaXMgc2V0IHRvICdpbmhlcml0J1xufVxuXG5mdW5jdGlvbiBuZXh0RWwgKGVsKSB7XG4gIHJldHVybiBlbC5uZXh0RWxlbWVudFNpYmxpbmcgfHwgbWFudWFsbHkoKTtcbiAgZnVuY3Rpb24gbWFudWFsbHkgKCkge1xuICAgIHZhciBzaWJsaW5nID0gZWw7XG4gICAgZG8ge1xuICAgICAgc2libGluZyA9IHNpYmxpbmcubmV4dFNpYmxpbmc7XG4gICAgfSB3aGlsZSAoc2libGluZyAmJiBzaWJsaW5nLm5vZGVUeXBlICE9PSAxKTtcbiAgICByZXR1cm4gc2libGluZztcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRFdmVudEhvc3QgKGUpIHtcbiAgLy8gb24gdG91Y2hlbmQgZXZlbnQsIHdlIGhhdmUgdG8gdXNlIGBlLmNoYW5nZWRUb3VjaGVzYFxuICAvLyBzZWUgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy83MTkyNTYzL3RvdWNoZW5kLWV2ZW50LXByb3BlcnRpZXNcbiAgLy8gc2VlIGdpdGh1Yi5jb20vYmV2YWNxdWEvZHJhZ3VsYS9pc3N1ZXMvMzRcbiAgLyoqIEBuYW1lc3BhY2UgZS50YXJnZXRUb3VjaGVzIC0tIHJlc29sdmluZyB3ZWJzdG9ybSB1bnJlc29sdmVkIHZhcmlhYmxlcyAqL1xuICAvKiogQG5hbWVzcGFjZSBlLmNoYW5nZWRUb3VjaGVzIC0tIHJlc29sdmluZyB3ZWJzdG9ybSB1bnJlc29sdmVkIHZhcmlhYmxlcyAqL1xuICBpZiAoZS50YXJnZXRUb3VjaGVzICYmIGUudGFyZ2V0VG91Y2hlcy5sZW5ndGgpIHtcbiAgICByZXR1cm4gZS50YXJnZXRUb3VjaGVzWzBdO1xuICB9XG4gIGlmIChlLmNoYW5nZWRUb3VjaGVzICYmIGUuY2hhbmdlZFRvdWNoZXMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGUuY2hhbmdlZFRvdWNoZXNbMF07XG4gIH1cbiAgcmV0dXJuIGU7XG59XG5cbmZ1bmN0aW9uIGdldENvb3JkIChjb29yZCwgZSkge1xuICB2YXIgaG9zdCA9IGdldEV2ZW50SG9zdChlKTtcbiAgdmFyIG1pc3NNYXAgPSB7XG4gICAgcGFnZVg6ICdjbGllbnRYJywgLy8gSUU4XG4gICAgcGFnZVk6ICdjbGllbnRZJyAvLyBJRThcbiAgfTtcbiAgaWYgKGNvb3JkIGluIG1pc3NNYXAgJiYgIShjb29yZCBpbiBob3N0KSAmJiBtaXNzTWFwW2Nvb3JkXSBpbiBob3N0KSB7XG4gICAgY29vcmQgPSBtaXNzTWFwW2Nvb3JkXTtcbiAgfVxuICByZXR1cm4gaG9zdFtjb29yZF07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRHJhZ29uO1xud2luZG93LkRyYWdvbiA9IERyYWdvbjtcbiIsIlxudmFyIE5hdGl2ZUN1c3RvbUV2ZW50ID0gZ2xvYmFsLkN1c3RvbUV2ZW50O1xuXG5mdW5jdGlvbiB1c2VOYXRpdmUgKCkge1xuICB0cnkge1xuICAgIHZhciBwID0gbmV3IE5hdGl2ZUN1c3RvbUV2ZW50KCdjYXQnLCB7IGRldGFpbDogeyBmb286ICdiYXInIH0gfSk7XG4gICAgcmV0dXJuICAnY2F0JyA9PT0gcC50eXBlICYmICdiYXInID09PSBwLmRldGFpbC5mb287XG4gIH0gY2F0Y2ggKGUpIHtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogQ3Jvc3MtYnJvd3NlciBgQ3VzdG9tRXZlbnRgIGNvbnN0cnVjdG9yLlxuICpcbiAqIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9DdXN0b21FdmVudC5DdXN0b21FdmVudFxuICpcbiAqIEBwdWJsaWNcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IHVzZU5hdGl2ZSgpID8gTmF0aXZlQ3VzdG9tRXZlbnQgOlxuXG4vLyBJRSA+PSA5XG4nZnVuY3Rpb24nID09PSB0eXBlb2YgZG9jdW1lbnQuY3JlYXRlRXZlbnQgPyBmdW5jdGlvbiBDdXN0b21FdmVudCAodHlwZSwgcGFyYW1zKSB7XG4gIHZhciBlID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0N1c3RvbUV2ZW50Jyk7XG4gIGlmIChwYXJhbXMpIHtcbiAgICBlLmluaXRDdXN0b21FdmVudCh0eXBlLCBwYXJhbXMuYnViYmxlcywgcGFyYW1zLmNhbmNlbGFibGUsIHBhcmFtcy5kZXRhaWwpO1xuICB9IGVsc2Uge1xuICAgIGUuaW5pdEN1c3RvbUV2ZW50KHR5cGUsIGZhbHNlLCBmYWxzZSwgdm9pZCAwKTtcbiAgfVxuICByZXR1cm4gZTtcbn0gOlxuXG4vLyBJRSA8PSA4XG5mdW5jdGlvbiBDdXN0b21FdmVudCAodHlwZSwgcGFyYW1zKSB7XG4gIHZhciBlID0gZG9jdW1lbnQuY3JlYXRlRXZlbnRPYmplY3QoKTtcbiAgZS50eXBlID0gdHlwZTtcbiAgaWYgKHBhcmFtcykge1xuICAgIGUuYnViYmxlcyA9IEJvb2xlYW4ocGFyYW1zLmJ1YmJsZXMpO1xuICAgIGUuY2FuY2VsYWJsZSA9IEJvb2xlYW4ocGFyYW1zLmNhbmNlbGFibGUpO1xuICAgIGUuZGV0YWlsID0gcGFyYW1zLmRldGFpbDtcbiAgfSBlbHNlIHtcbiAgICBlLmJ1YmJsZXMgPSBmYWxzZTtcbiAgICBlLmNhbmNlbGFibGUgPSBmYWxzZTtcbiAgICBlLmRldGFpbCA9IHZvaWQgMDtcbiAgfVxuICByZXR1cm4gZTtcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGN1c3RvbUV2ZW50ID0gcmVxdWlyZSgnY3VzdG9tLWV2ZW50Jyk7XG52YXIgZXZlbnRtYXAgPSByZXF1aXJlKCcuL2V2ZW50bWFwJyk7XG52YXIgZG9jID0gZ2xvYmFsLmRvY3VtZW50O1xudmFyIGFkZEV2ZW50ID0gYWRkRXZlbnRFYXN5O1xudmFyIHJlbW92ZUV2ZW50ID0gcmVtb3ZlRXZlbnRFYXN5O1xudmFyIGhhcmRDYWNoZSA9IFtdO1xuXG5pZiAoIWdsb2JhbC5hZGRFdmVudExpc3RlbmVyKSB7XG4gIGFkZEV2ZW50ID0gYWRkRXZlbnRIYXJkO1xuICByZW1vdmVFdmVudCA9IHJlbW92ZUV2ZW50SGFyZDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGFkZDogYWRkRXZlbnQsXG4gIHJlbW92ZTogcmVtb3ZlRXZlbnQsXG4gIGZhYnJpY2F0ZTogZmFicmljYXRlRXZlbnRcbn07XG5cbmZ1bmN0aW9uIGFkZEV2ZW50RWFzeSAoZWwsIHR5cGUsIGZuLCBjYXB0dXJpbmcpIHtcbiAgcmV0dXJuIGVsLmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgZm4sIGNhcHR1cmluZyk7XG59XG5cbmZ1bmN0aW9uIGFkZEV2ZW50SGFyZCAoZWwsIHR5cGUsIGZuKSB7XG4gIHJldHVybiBlbC5hdHRhY2hFdmVudCgnb24nICsgdHlwZSwgd3JhcChlbCwgdHlwZSwgZm4pKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlRXZlbnRFYXN5IChlbCwgdHlwZSwgZm4sIGNhcHR1cmluZykge1xuICByZXR1cm4gZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlLCBmbiwgY2FwdHVyaW5nKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlRXZlbnRIYXJkIChlbCwgdHlwZSwgZm4pIHtcbiAgdmFyIGxpc3RlbmVyID0gdW53cmFwKGVsLCB0eXBlLCBmbik7XG4gIGlmIChsaXN0ZW5lcikge1xuICAgIHJldHVybiBlbC5kZXRhY2hFdmVudCgnb24nICsgdHlwZSwgbGlzdGVuZXIpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGZhYnJpY2F0ZUV2ZW50IChlbCwgdHlwZSwgbW9kZWwpIHtcbiAgdmFyIGUgPSBldmVudG1hcC5pbmRleE9mKHR5cGUpID09PSAtMSA/IG1ha2VDdXN0b21FdmVudCgpIDogbWFrZUNsYXNzaWNFdmVudCgpO1xuICBpZiAoZWwuZGlzcGF0Y2hFdmVudCkge1xuICAgIGVsLmRpc3BhdGNoRXZlbnQoZSk7XG4gIH0gZWxzZSB7XG4gICAgZWwuZmlyZUV2ZW50KCdvbicgKyB0eXBlLCBlKTtcbiAgfVxuICBmdW5jdGlvbiBtYWtlQ2xhc3NpY0V2ZW50ICgpIHtcbiAgICB2YXIgZTtcbiAgICBpZiAoZG9jLmNyZWF0ZUV2ZW50KSB7XG4gICAgICBlID0gZG9jLmNyZWF0ZUV2ZW50KCdFdmVudCcpO1xuICAgICAgZS5pbml0RXZlbnQodHlwZSwgdHJ1ZSwgdHJ1ZSk7XG4gICAgfSBlbHNlIGlmIChkb2MuY3JlYXRlRXZlbnRPYmplY3QpIHtcbiAgICAgIGUgPSBkb2MuY3JlYXRlRXZlbnRPYmplY3QoKTtcbiAgICB9XG4gICAgcmV0dXJuIGU7XG4gIH1cbiAgZnVuY3Rpb24gbWFrZUN1c3RvbUV2ZW50ICgpIHtcbiAgICByZXR1cm4gbmV3IGN1c3RvbUV2ZW50KHR5cGUsIHsgZGV0YWlsOiBtb2RlbCB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiB3cmFwcGVyRmFjdG9yeSAoZWwsIHR5cGUsIGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiB3cmFwcGVyIChvcmlnaW5hbEV2ZW50KSB7XG4gICAgdmFyIGUgPSBvcmlnaW5hbEV2ZW50IHx8IGdsb2JhbC5ldmVudDtcbiAgICBlLnRhcmdldCA9IGUudGFyZ2V0IHx8IGUuc3JjRWxlbWVudDtcbiAgICBlLnByZXZlbnREZWZhdWx0ID0gZS5wcmV2ZW50RGVmYXVsdCB8fCBmdW5jdGlvbiBwcmV2ZW50RGVmYXVsdCAoKSB7IGUucmV0dXJuVmFsdWUgPSBmYWxzZTsgfTtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbiA9IGUuc3RvcFByb3BhZ2F0aW9uIHx8IGZ1bmN0aW9uIHN0b3BQcm9wYWdhdGlvbiAoKSB7IGUuY2FuY2VsQnViYmxlID0gdHJ1ZTsgfTtcbiAgICBlLndoaWNoID0gZS53aGljaCB8fCBlLmtleUNvZGU7XG4gICAgZm4uY2FsbChlbCwgZSk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHdyYXAgKGVsLCB0eXBlLCBmbikge1xuICB2YXIgd3JhcHBlciA9IHVud3JhcChlbCwgdHlwZSwgZm4pIHx8IHdyYXBwZXJGYWN0b3J5KGVsLCB0eXBlLCBmbik7XG4gIGhhcmRDYWNoZS5wdXNoKHtcbiAgICB3cmFwcGVyOiB3cmFwcGVyLFxuICAgIGVsZW1lbnQ6IGVsLFxuICAgIHR5cGU6IHR5cGUsXG4gICAgZm46IGZuXG4gIH0pO1xuICByZXR1cm4gd3JhcHBlcjtcbn1cblxuZnVuY3Rpb24gdW53cmFwIChlbCwgdHlwZSwgZm4pIHtcbiAgdmFyIGkgPSBmaW5kKGVsLCB0eXBlLCBmbik7XG4gIGlmIChpKSB7XG4gICAgdmFyIHdyYXBwZXIgPSBoYXJkQ2FjaGVbaV0ud3JhcHBlcjtcbiAgICBoYXJkQ2FjaGUuc3BsaWNlKGksIDEpOyAvLyBmcmVlIHVwIGEgdGFkIG9mIG1lbW9yeVxuICAgIHJldHVybiB3cmFwcGVyO1xuICB9XG59XG5cbmZ1bmN0aW9uIGZpbmQgKGVsLCB0eXBlLCBmbikge1xuICB2YXIgaSwgaXRlbTtcbiAgZm9yIChpID0gMDsgaSA8IGhhcmRDYWNoZS5sZW5ndGg7IGkrKykge1xuICAgIGl0ZW0gPSBoYXJkQ2FjaGVbaV07XG4gICAgaWYgKGl0ZW0uZWxlbWVudCA9PT0gZWwgJiYgaXRlbS50eXBlID09PSB0eXBlICYmIGl0ZW0uZm4gPT09IGZuKSB7XG4gICAgICByZXR1cm4gaTtcbiAgICB9XG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGV2ZW50bWFwID0gW107XG52YXIgZXZlbnRuYW1lID0gJyc7XG52YXIgcm9uID0gL15vbi87XG5cbmZvciAoZXZlbnRuYW1lIGluIGdsb2JhbCkge1xuICBpZiAocm9uLnRlc3QoZXZlbnRuYW1lKSkge1xuICAgIGV2ZW50bWFwLnB1c2goZXZlbnRuYW1lLnNsaWNlKDIpKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGV2ZW50bWFwO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY2FjaGUgPSB7fTtcbnZhciBzdGFydCA9ICcoPzpefFxcXFxzKSc7XG52YXIgZW5kID0gJyg/OlxcXFxzfCQpJztcblxuZnVuY3Rpb24gbG9va3VwQ2xhc3MgKGNsYXNzTmFtZSkge1xuICB2YXIgY2FjaGVkID0gY2FjaGVbY2xhc3NOYW1lXTtcbiAgaWYgKGNhY2hlZCkge1xuICAgIGNhY2hlZC5sYXN0SW5kZXggPSAwO1xuICB9IGVsc2Uge1xuICAgIGNhY2hlW2NsYXNzTmFtZV0gPSBjYWNoZWQgPSBuZXcgUmVnRXhwKHN0YXJ0ICsgY2xhc3NOYW1lICsgZW5kLCAnZycpO1xuICB9XG4gIHJldHVybiBjYWNoZWQ7XG59XG5cbmZ1bmN0aW9uIGFkZENsYXNzIChlbCwgY2xhc3NOYW1lKSB7XG4gIHZhciBjdXJyZW50ID0gZWwuY2xhc3NOYW1lO1xuICBpZiAoIWN1cnJlbnQubGVuZ3RoKSB7XG4gICAgZWwuY2xhc3NOYW1lID0gY2xhc3NOYW1lO1xuICB9IGVsc2UgaWYgKCFsb29rdXBDbGFzcyhjbGFzc05hbWUpLnRlc3QoY3VycmVudCkpIHtcbiAgICBlbC5jbGFzc05hbWUgKz0gJyAnICsgY2xhc3NOYW1lO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJtQ2xhc3MgKGVsLCBjbGFzc05hbWUpIHtcbiAgZWwuY2xhc3NOYW1lID0gZWwuY2xhc3NOYW1lLnJlcGxhY2UobG9va3VwQ2xhc3MoY2xhc3NOYW1lKSwgJyAnKS50cmltKCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBhZGQ6IGFkZENsYXNzLFxuICBybTogcm1DbGFzc1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xudmFyIGNyb3NzdmVudCA9IHJlcXVpcmUoJ2Nyb3NzdmVudCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHRvdWNoeSAoZWwsIG9wLCB0eXBlLCBmbikge1xuICAgIHZhciB0b3VjaCA9IHtcbiAgICAgICAgbW91c2V1cDogJ3RvdWNoZW5kJyxcbiAgICAgICAgbW91c2Vkb3duOiAndG91Y2hzdGFydCcsXG4gICAgICAgIG1vdXNlbW92ZTogJ3RvdWNobW92ZSdcbiAgICB9O1xuICAgIHZhciBwb2ludGVycyA9IHtcbiAgICAgICAgbW91c2V1cDogJ3BvaW50ZXJ1cCcsXG4gICAgICAgIG1vdXNlZG93bjogJ3BvaW50ZXJkb3duJyxcbiAgICAgICAgbW91c2Vtb3ZlOiAncG9pbnRlcm1vdmUnXG4gICAgfTtcbiAgICB2YXIgbWljcm9zb2Z0ID0ge1xuICAgICAgICBtb3VzZXVwOiAnTVNQb2ludGVyVXAnLFxuICAgICAgICBtb3VzZWRvd246ICdNU1BvaW50ZXJEb3duJyxcbiAgICAgICAgbW91c2Vtb3ZlOiAnTVNQb2ludGVyTW92ZSdcbiAgICB9O1xuXG4gICAgLyoqIEBuYW1lc3BhY2UgZ2xvYmFsLm5hdmlnYXRvci5wb2ludGVyRW5hYmxlZCAtLSByZXNvbHZpbmcgd2Vic3Rvcm0gdW5yZXNvbHZlZCB2YXJpYWJsZXMgKi9cbiAgICAvKiogQG5hbWVzcGFjZSBnbG9iYWwubmF2aWdhdG9yLm1zUG9pbnRlckVuYWJsZWQgLS0gcmVzb2x2aW5nIHdlYnN0b3JtIHVucmVzb2x2ZWQgdmFyaWFibGVzICovXG4gICAgaWYgKGdsb2JhbC5uYXZpZ2F0b3IucG9pbnRlckVuYWJsZWQpIHtcbiAgICAgICAgY3Jvc3N2ZW50W29wXShlbCwgcG9pbnRlcnNbdHlwZV0gfHwgdHlwZSwgZm4pO1xuICAgIH0gZWxzZSBpZiAoZ2xvYmFsLm5hdmlnYXRvci5tc1BvaW50ZXJFbmFibGVkKSB7XG4gICAgICAgIGNyb3NzdmVudFtvcF0oZWwsIG1pY3Jvc29mdFt0eXBlXSB8fCB0eXBlLCBmbik7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY3Jvc3N2ZW50W29wXShlbCwgdG91Y2hbdHlwZV0gfHwgdHlwZSwgZm4pO1xuICAgICAgICBjcm9zc3ZlbnRbb3BdKGVsLCB0eXBlLCBmbik7XG4gICAgfVxufTsiXX0=

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL2RyYWdvbi9kcmFnb24uanMiXSwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKGYpe2lmKHR5cGVvZiBleHBvcnRzPT09XCJvYmplY3RcIiYmdHlwZW9mIG1vZHVsZSE9PVwidW5kZWZpbmVkXCIpe21vZHVsZS5leHBvcnRzPWYoKX1lbHNlIGlmKHR5cGVvZiBkZWZpbmU9PT1cImZ1bmN0aW9uXCImJmRlZmluZS5hbWQpe2RlZmluZShbXSxmKX1lbHNle3ZhciBnO2lmKHR5cGVvZiB3aW5kb3chPT1cInVuZGVmaW5lZFwiKXtnPXdpbmRvd31lbHNlIGlmKHR5cGVvZiBnbG9iYWwhPT1cInVuZGVmaW5lZFwiKXtnPWdsb2JhbH1lbHNlIGlmKHR5cGVvZiBzZWxmIT09XCJ1bmRlZmluZWRcIil7Zz1zZWxmfWVsc2V7Zz10aGlzfWcuZHJhZ29uID0gZigpfX0pKGZ1bmN0aW9uKCl7dmFyIGRlZmluZSxtb2R1bGUsZXhwb3J0cztyZXR1cm4gKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkoezE6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuKGZ1bmN0aW9uIChnbG9iYWwpe1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgdG91Y2h5ID0gcmVxdWlyZSgnLi91dGlscy90b3VjaHknKSxcbiAgICBjbGFzc2VzID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc2VzJyksXG4gICAgZG9jID0gZG9jdW1lbnQsXG4gICAgZG9jRWxtID0gZG9jLmRvY3VtZW50RWxlbWVudCxcbiAgICBkcmFnb25TcGFjZSA9IHtcbiAgICAgIGRyYWdvbnM6IFtdLFxuICAgICAgZHJhZ3M6IFtdLFxuICAgICAgY29udGFpbmVyc0xvb2t1cDogW10sXG4gICAgICBjb250YWluZXJzOiBbXVxuICAgIH0sXG4gICAgaWQgPSAwLFxuXG4gICAgREVWID0gZmFsc2U7XG5cbnRvdWNoeShkb2NFbG0sICdhZGQnLCAnbW91c2Vkb3duJywgZ3JhYik7XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyBEcmFnb24gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8qKiBpcyBncm91cCBvZiBjb250YWluZXJzIHdpdGggc2FtZSBzZXR0aW5ncyAqL1xuZnVuY3Rpb24gRHJhZ29uIChvcHRpb25zKSB7XG4gIGlmKERFVikgY29uc29sZS5sb2coJ0RyYWdvbiBpbnN0YW5jZSBjcmVhdGVkLCBvcHRpb25zOiAnLCBvcHRpb25zKTtcblxuICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zIGluc3RhbmNlb2YgQXJyYXkgPyB7Y29udGFpbmVyczogb3B0aW9uc30gOiBvcHRpb25zIHx8IHt9O1xuICB0aGlzLmNvbnRhaW5lcnMgPSBbXTtcbiAgdGhpcy5kcmFnb25TcGFjZSA9IGRyYWdvblNwYWNlO1xuICB0aGlzLmlkID0gdGhpcy5vcHRpb25zLmlkIHx8ICdkcmFnb24nICsgaWQrKztcbiAgXG4gIGRyYWdvblNwYWNlLmRyYWdvbnMucHVzaCh0aGlzKTsgLy8gcmVnaXN0ZXIgZHJhZ29uXG5cbiAgaWYodGhpcy5vcHRpb25zLmNvbnRhaW5lcnMpXG4gICAgdGhpcy5hZGRDb250YWluZXJzKHRoaXMub3B0aW9ucy5jb250YWluZXJzKTtcbn1cblxuRHJhZ29uLnByb3RvdHlwZS5hZGRDb250YWluZXJzID0gZnVuY3Rpb24oY29udGFpbmVycykge1xuICBpZihERVYpIGNvbnNvbGUubG9nKCdBZGRpbmcgY29udGFpbmVyczogJywgY29udGFpbmVycyk7XG5cbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBjb250YWluZXJzLmZvckVhY2goZnVuY3Rpb24gKGNvbnRhaW5lckVsbSkge1xuICAgIHZhciBjb250YWluZXIgPSBuZXcgQ29udGFpbmVyKHNlbGYsIGNvbnRhaW5lckVsbSk7XG4gICAgc2VsZi5jb250YWluZXJzLnB1c2goY29udGFpbmVyKTtcbiAgICBkcmFnb25TcGFjZS5jb250YWluZXJzLnB1c2goY29udGFpbmVyKTtcbiAgICBkcmFnb25TcGFjZS5jb250YWluZXJzTG9va3VwLnB1c2goY29udGFpbmVyRWxtKTtcbiAgfSk7XG59O1xuXG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyBDb250YWluZXIgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuZnVuY3Rpb24gQ29udGFpbmVyKGRyYWdvbiwgZWxtKSB7XG4gIGlmKERFVikgY29uc29sZS5sb2coJ0NvbnRhaW5lciBpbnN0YW5jZSBjcmVhdGVkLCBlbG06JywgZWxtKTtcblxuICB0aGlzLmlkID0gZWxtLmlkIHx8ICdjb250YWluZXInICsgaWQrKztcbiAgdGhpcy5kcmFnb24gPSBkcmFnb247XG4gIHRoaXMuZWxtID0gZWxtO1xuICB0aGlzLm9wdGlvbnMgPSB7fTtcbiAgdGhpcy5vcHRpb25zLm1pcnJvckNvbnRhaW5lciA9IGRvYy5ib2R5O1xufVxuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8gRHJhZyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuZnVuY3Rpb24gRHJhZyhlLCBpdGVtLCBzb3VyY2UpIHtcblxuICBpZihERVYpIGNvbnNvbGUubG9nKCdEcmFnIGluc3RhbmNlIGNyZWF0ZWQsIHBhcmFtczonLCBlLCBpdGVtLCBzb3VyY2UpO1xuXG4gIC8vIHRoaXMubWlycm9yOyAvLyBtaXJyb3IgaW1hZ2VcbiAgLy8gdGhpcy5zb3VyY2U7IC8vIHNvdXJjZSBjb250YWluZXIgZWxlbWVudFxuICAvLyB0aGlzLnNvdXJjZTsgLy8gc291cmNlIENvbnRhaW5lciBvYmplY3RcbiAgLy8gdGhpcy5pdGVtOyAvLyBpdGVtIGVsZW1lbnQgYmVpbmcgZHJhZ2dlZFxuICAvLyB0aGlzLm9mZnNldFg7IC8vIHJlZmVyZW5jZSB4XG4gIC8vIHRoaXMub2Zmc2V0WTsgLy8gcmVmZXJlbmNlIHlcbiAgLy8gdGhpcy5tb3ZlWDsgLy8gcmVmZXJlbmNlIG1vdmUgeFxuICAvLyB0aGlzLm1vdmVZOyAvLyByZWZlcmVuY2UgbW92ZSB5XG4gIC8vIHRoaXMuaW5pdGlhbFNpYmxpbmc7IC8vIHJlZmVyZW5jZSBzaWJsaW5nIHdoZW4gZ3JhYmJlZFxuICAvLyB0aGlzLmN1cnJlbnRTaWJsaW5nOyAvLyByZWZlcmVuY2Ugc2libGluZyBub3dcbiAgLy8gdGhpcy5zdGF0ZTsgLy8gaG9sZHMgRHJhZyBzdGF0ZSAoZ3JhYmJlZCwgdHJhY2tpbmcsIHdhaXRpbmcsIGRyYWdnaW5nLCAuLi4pXG5cbiAgZS5wcmV2ZW50RGVmYXVsdCgpOyAvLyBmaXhlcyBnaXRodWIuY29tL2JldmFjcXVhL2RyYWd1bGEvaXNzdWVzLzE1NVxuICB0aGlzLm1vdmVYID0gZS5jbGllbnRYO1xuICB0aGlzLm1vdmVZID0gZS5jbGllbnRZO1xuXG4gIGlmKERFVikgY29uc29sZS5sb2coJyoqKiBDaGFuZ2luZyBzdGF0ZTogJywgdGhpcy5zdGF0ZSwgJyAtPiBncmFiYmVkJyk7XG4gIHRoaXMuc3RhdGUgPSAnZ3JhYmJlZCc7XG5cbiAgdGhpcy5pdGVtID0gaXRlbTtcbiAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XG4gIHRoaXMuc291cmNlQ29udGFpbmVyID0gZ2V0Q29udGFpbmVyKHNvdXJjZSk7XG4gIHRoaXMub3B0aW9ucyA9IHRoaXMuc291cmNlQ29udGFpbmVyLm9wdGlvbnMgfHwge307XG5cbiAgdGhpcy5ldmVudHMoKTtcbn1cblxuRHJhZy5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuICBpZihERVYpIGNvbnNvbGUubG9nKCdEcmFnLmRlc3Ryb3kgY2FsbGVkJyk7XG5cbiAgdGhpcy5yZWxlYXNlKHt9KTtcbn07XG5cbkRyYWcucHJvdG90eXBlLmV2ZW50cyA9IGZ1bmN0aW9uKHJlbW92ZSkge1xuICBpZihERVYpIGNvbnNvbGUubG9nKCdEcmFnLmV2ZW50cyBjYWxsZWQsIFwicmVtb3ZlXCIgcGFyYW06JywgcmVtb3ZlKTtcbiAgLy9kZWJ1Z2dlcjtcbiAgdmFyIG9wID0gcmVtb3ZlID8gJ3JlbW92ZScgOiAnYWRkJztcbiAgdG91Y2h5KGRvY0VsbSwgb3AsICdtb3VzZXVwJywgYmluZCh0aGlzLCAncmVsZWFzZScpKTtcbiAgdG91Y2h5KGRvY0VsbSwgb3AsICdtb3VzZW1vdmUnLCBiaW5kKHRoaXMsICdkcmFnJykpO1xuICB0b3VjaHkoZG9jRWxtLCBvcCwgJ3NlbGVjdHN0YXJ0JywgYmluZCh0aGlzLCAncHJvdGVjdEdyYWInKSk7IC8vIElFOFxuICB0b3VjaHkoZG9jRWxtLCBvcCwgJ2NsaWNrJywgYmluZCh0aGlzLCAncHJvdGVjdEdyYWInKSk7XG59O1xuXG5EcmFnLnByb3RvdHlwZS5wcm90ZWN0R3JhYiA9IGZ1bmN0aW9uKGUpIHtcbiAgaWYoREVWKSBjb25zb2xlLmxvZygnRHJhZy5wcm90ZWN0R3JhYiBjYWxsZWQsIGU6JywgZSk7XG5cbiAgaWYgKHRoaXMuc3RhdGUgPT0gJ2dyYWJiZWQnKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICB9XG59O1xuXG5EcmFnLnByb3RvdHlwZS5kcmFnID0gZnVuY3Rpb24oZSkge1xuICBpZihERVYpIGNvbnNvbGUubG9nKCdEcmFnLmRyYWcgY2FsbGVkLCBlOicsIGUpO1xuXG4gIGlmKHRoaXMuc3RhdGUgPT0gJ2dyYWJiZWQnKXtcbiAgICB0aGlzLnN0YXJ0QnlNb3ZlbWVudChlKTtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYodGhpcy5zdGF0ZSAhPT0gJ21vdmVkJyAmJiB0aGlzLnN0YXRlICE9PSAnZHJhZ2dpbmcnKXtcbiAgICB0aGlzLmNhbmNlbCgpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmKERFVikgY29uc29sZS5sb2coJyoqKiBDaGFuZ2luZyBzdGF0ZTogJywgdGhpcy5zdGF0ZSwgJyAtPiBkcmFnZ2luZycpO1xuICB0aGlzLnN0YXRlID0gJ2RyYWdnaW5nJztcblxuICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgdmFyIGNsaWVudFggPSBnZXRDb29yZCgnY2xpZW50WCcsIGUpLFxuICAgICAgY2xpZW50WSA9IGdldENvb3JkKCdjbGllbnRZJywgZSksXG4gICAgICB4ID0gY2xpZW50WCAtIHRoaXMub2Zmc2V0WCxcbiAgICAgIHkgPSBjbGllbnRZIC0gdGhpcy5vZmZzZXRZLFxuICAgICAgbWlycm9yID0gdGhpcy5taXJyb3I7XG5cbiAgbWlycm9yLnN0eWxlLmxlZnQgPSB4ICsgJ3B4JztcbiAgbWlycm9yLnN0eWxlLnRvcCA9IHkgKyAncHgnO1xuXG4gIHZhciBlbGVtZW50QmVoaW5kQ3Vyc29yID0gZ2V0RWxlbWVudEJlaGluZFBvaW50KG1pcnJvciwgY2xpZW50WCwgY2xpZW50WSksXG4gICAgICBkcm9wVGFyZ2V0ID0gZmluZERyb3BUYXJnZXQoZWxlbWVudEJlaGluZEN1cnNvciwgY2xpZW50WCwgY2xpZW50WSksXG4gICAgICByZWZlcmVuY2UsXG4gICAgICBpbW1lZGlhdGUgPSBnZXRJbW1lZGlhdGVDaGlsZChkcm9wVGFyZ2V0LCBlbGVtZW50QmVoaW5kQ3Vyc29yKTtcblxuICBpZiAoaW1tZWRpYXRlICE9PSBudWxsKSB7XG4gICAgcmVmZXJlbmNlID0gZ2V0UmVmZXJlbmNlKGRyb3BUYXJnZXQsIGltbWVkaWF0ZSwgY2xpZW50WCwgY2xpZW50WSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChcbiAgICAgIHJlZmVyZW5jZSA9PT0gbnVsbCB8fFxuICAgICAgcmVmZXJlbmNlICE9PSB0aGlzLml0ZW0gJiZcbiAgICAgIHJlZmVyZW5jZSAhPT0gbmV4dEVsKHRoaXMuaXRlbSlcbiAgKSB7XG4gICAgdGhpcy5jdXJyZW50U2libGluZyA9IHJlZmVyZW5jZTtcbiAgICBkcm9wVGFyZ2V0Lmluc2VydEJlZm9yZSh0aGlzLml0ZW0sIHJlZmVyZW5jZSk7XG4gIH1cbn07XG5cbkRyYWcucHJvdG90eXBlLnN0YXJ0QnlNb3ZlbWVudCA9IGZ1bmN0aW9uKGUpIHtcbiAgaWYoREVWKSBjb25zb2xlLmxvZygnRHJhZy5zdGFydEJ5TW92ZW1lbnQgY2FsbGVkLCBlOicsIGUpO1xuXG4gIC8vIGlmICh3aGljaE1vdXNlQnV0dG9uKGUpID09PSAwKSB7XG4gIC8vICAgcmVsZWFzZSh7fSk7XG4gIC8vICAgcmV0dXJuOyAvLyB3aGVuIHRleHQgaXMgc2VsZWN0ZWQgb24gYW4gaW5wdXQgYW5kIHRoZW4gZHJhZ2dlZCwgbW91c2V1cCBkb2Vzbid0IGZpcmUuIHRoaXMgaXMgb3VyIG9ubHkgaG9wZVxuICAvLyB9XG5cbiAgLy8gdHJ1dGh5IGNoZWNrIGZpeGVzIGdpdGh1Yi5jb20vYmV2YWNxdWEvZHJhZ3VsYS9pc3N1ZXMvMjM5LCBlcXVhbGl0eSBmaXhlcyBnaXRodWIuY29tL2JldmFjcXVhL2RyYWd1bGEvaXNzdWVzLzIwN1xuICBpZiAoZS5jbGllbnRYICE9PSB2b2lkIDAgJiYgZS5jbGllbnRYID09PSB0aGlzLm1vdmVYICYmIGUuY2xpZW50WSAhPT0gdm9pZCAwICYmIGUuY2xpZW50WSA9PT0gdGhpcy5tb3ZlWSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHRoaXMuaW5pdGlhbFNpYmxpbmcgPSB0aGlzLmN1cnJlbnRTaWJsaW5nID0gbmV4dEVsKHRoaXMuaXRlbSk7XG5cbiAgdmFyIG9mZnNldCA9IGdldE9mZnNldCh0aGlzLml0ZW0pO1xuICB0aGlzLm9mZnNldFggPSBnZXRDb29yZCgncGFnZVgnLCBlKSAtIG9mZnNldC5sZWZ0O1xuICB0aGlzLm9mZnNldFkgPSBnZXRDb29yZCgncGFnZVknLCBlKSAtIG9mZnNldC50b3A7XG5cbiAgY2xhc3Nlcy5hZGQodGhpcy5pdGVtLCAnZ3UtdHJhbnNpdCcpO1xuICB0aGlzLnJlbmRlck1pcnJvckltYWdlKHRoaXMub3B0aW9ucy5taXJyb3JDb250YWluZXIpO1xuXG4gIGlmKERFVikgY29uc29sZS5sb2coJyoqKiBDaGFuZ2luZyBzdGF0ZTogJywgdGhpcy5zdGF0ZSwgJyAtPiBtb3ZlZCcpO1xuICB0aGlzLnN0YXRlID0gJ21vdmVkJztcbn07XG5cbkRyYWcucHJvdG90eXBlLnJlbmRlck1pcnJvckltYWdlID0gZnVuY3Rpb24obWlycm9yQ29udGFpbmVyKSB7XG4gIGlmKERFVikgY29uc29sZS5sb2coJ0RyYWcucmVuZGVyTWlycm9ySW1hZ2UgY2FsbGVkLCBlOicsIG1pcnJvckNvbnRhaW5lcik7XG5cbiAgdmFyIHJlY3QgPSB0aGlzLml0ZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gIHZhciBtaXJyb3IgPSB0aGlzLm1pcnJvciA9IHRoaXMuaXRlbS5jbG9uZU5vZGUodHJ1ZSk7XG5cbiAgbWlycm9yLnN0eWxlLndpZHRoID0gZ2V0UmVjdFdpZHRoKHJlY3QpICsgJ3B4JztcbiAgbWlycm9yLnN0eWxlLmhlaWdodCA9IGdldFJlY3RIZWlnaHQocmVjdCkgKyAncHgnO1xuICBjbGFzc2VzLnJtKG1pcnJvciwgJ2d1LXRyYW5zaXQnKTtcbiAgY2xhc3Nlcy5hZGQobWlycm9yLCAnZ3UtbWlycm9yJyk7XG4gIG1pcnJvckNvbnRhaW5lci5hcHBlbmRDaGlsZChtaXJyb3IpO1xuICBjbGFzc2VzLmFkZChtaXJyb3JDb250YWluZXIsICdndS11bnNlbGVjdGFibGUnKTtcbn07XG5cbkRyYWcucHJvdG90eXBlLnJlbGVhc2UgPSBmdW5jdGlvbihlKSB7XG4gIGlmKERFVikgY29uc29sZS5sb2coJ0RyYWcucmVsZWFzZSBjYWxsZWQsIGU6JywgZSk7XG5cbiAgdG91Y2h5KGRvY0VsbSwgJ3JlbW92ZScsICdtb3VzZXVwJywgdGhpcy5yZWxlYXNlKTtcblxuICB2YXIgY2xpZW50WCA9IGdldENvb3JkKCdjbGllbnRYJywgZSk7XG4gIHZhciBjbGllbnRZID0gZ2V0Q29vcmQoJ2NsaWVudFknLCBlKTtcblxuICB2YXIgZWxlbWVudEJlaGluZEN1cnNvciA9IGdldEVsZW1lbnRCZWhpbmRQb2ludCh0aGlzLm1pcnJvciwgY2xpZW50WCwgY2xpZW50WSk7XG4gIHZhciBkcm9wVGFyZ2V0ID0gZmluZERyb3BUYXJnZXQoZWxlbWVudEJlaGluZEN1cnNvciwgY2xpZW50WCwgY2xpZW50WSk7XG4gIGlmIChkcm9wVGFyZ2V0ICYmIGRyb3BUYXJnZXQgIT09IHRoaXMuc291cmNlKSB7XG4gICAgdGhpcy5kcm9wKGUsIHRoaXMuaXRlbSwgZHJvcFRhcmdldCk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5jYW5jZWwoKTtcbiAgfVxufTtcblxuRHJhZy5wcm90b3R5cGUuZHJvcCA9IGZ1bmN0aW9uKCkge1xuICBpZihERVYpIGNvbnNvbGUubG9nKCdEcmFnLmRyb3AgY2FsbGVkJyk7XG4gIGlmICh0aGlzLnN0YXRlICE9ICdkcmFnZ2luZycpXG4gICAgcmV0dXJuO1xuXG4gIGlmKERFVikgY29uc29sZS5sb2coJyoqKiBDaGFuZ2luZyBzdGF0ZTogJywgdGhpcy5zdGF0ZSwgJyAtPiBkcm9wcGVkJyk7XG4gIHRoaXMuc3RhdGUgPSAnZHJvcHBlZCc7XG5cbiAgdGhpcy5jbGVhbnVwKCk7XG59O1xuXG5EcmFnLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbigpIHtcbiAgaWYoREVWKSBjb25zb2xlLmxvZygnRHJhZy5yZW1vdmUgY2FsbGVkLCBlOicsIGUpO1xuXG4gIGlmICh0aGlzLnN0YXRlICE9PSAnZHJhZ2luZycpXG4gICAgcmV0dXJuO1xuXG4gIGlmKERFVikgY29uc29sZS5sb2coJyoqKiBDaGFuZ2luZyBzdGF0ZTogJywgdGhpcy5zdGF0ZSwgJyAtPiBkcmFnZ2luZycpO1xuICB0aGlzLnN0YXRlID0gJ3JlbW92ZWQnO1xuXG4gIHZhciBwYXJlbnQgPSBnZXRQYXJlbnQodGhpcy5pdGVtKTtcbiAgaWYgKHBhcmVudCkge1xuICAgIHBhcmVudC5yZW1vdmVDaGlsZCh0aGlzLml0ZW0pO1xuICB9XG4gIHRoaXMuY2xlYW51cCgpO1xufTtcblxuRHJhZy5wcm90b3R5cGUuY2FuY2VsID0gZnVuY3Rpb24ocmV2ZXJ0cyl7XG4gIGlmKERFVikgY29uc29sZS5sb2coJ0RyYWcuY2FuY2VsIGNhbGxlZCwgcmV2ZXJ0czonLCByZXZlcnRzKTtcblxuICBpZiAodGhpcy5zdGF0ZSA9PSAnZHJhZ2luZycpe1xuICAgICAgdmFyIHBhcmVudCA9IGdldFBhcmVudCh0aGlzLml0ZW0pO1xuICAgICAgdmFyIGluaXRpYWwgPSB0aGlzLmlzSW5pdGlhbFBsYWNlbWVudChwYXJlbnQpO1xuICAgICAgaWYgKGluaXRpYWwgPT09IGZhbHNlICYmIHJldmVydHMpIHtcbiAgICAgICAgICB0aGlzLnNvdXJjZS5pbnNlcnRCZWZvcmUodGhpcy5pdGVtLCB0aGlzLmluaXRpYWxTaWJsaW5nKTtcbiAgICAgIH1cbiAgfVxuXG4gIGlmKERFVikgY29uc29sZS5sb2coJyoqKiBDaGFuZ2luZyBzdGF0ZTogJywgdGhpcy5zdGF0ZSwgJyAtPiBjYW5jZWxsZWQnKTtcbiAgdGhpcy5zdGF0ZSA9ICdjYW5jZWxsZWQnO1xuXG4gIHRoaXMuY2xlYW51cCgpO1xufTtcblxuRHJhZy5wcm90b3R5cGUuY2xlYW51cCA9IGZ1bmN0aW9uKCkge1xuICBpZihERVYpIGNvbnNvbGUubG9nKCdEcmFnLmNsZWFudXAgY2FsbGVkJyk7XG5cbiAgdGhpcy5ldmVudHMoJ3JlbW92ZScpO1xuXG4gIGlmKHRoaXMubWlycm9yKVxuICAgIHJlbW92ZU1pcnJvckltYWdlKHRoaXMubWlycm9yKTtcblxuICBpZiAodGhpcy5pdGVtKSB7XG4gICAgY2xhc3Nlcy5ybSh0aGlzLml0ZW0sICdndS10cmFuc2l0Jyk7XG4gIH1cblxuICBpZihERVYpIGNvbnNvbGUubG9nKCcqKiogQ2hhbmdpbmcgc3RhdGU6ICcsIHRoaXMuc3RhdGUsICcgLT4gY2xlYW5lZCcpO1xuICB0aGlzLnN0YXRlID0gJ2NsZWFuZWQnO1xuXG4gIHRoaXMuc291cmNlID0gdGhpcy5pdGVtID0gdGhpcy5pbml0aWFsU2libGluZyA9IHRoaXMuY3VycmVudFNpYmxpbmcgPSBudWxsO1xufTtcblxuRHJhZy5wcm90b3R5cGUuaXNJbml0aWFsUGxhY2VtZW50ICA9IGZ1bmN0aW9uKHRhcmdldCxzKSB7XG4gIHZhciBzaWJsaW5nO1xuICBpZiAocyAhPT0gdm9pZCAwKSB7XG4gICAgc2libGluZyA9IHM7XG4gIH0gZWxzZSBpZiAodGhpcy5taXJyb3IpIHtcbiAgICBzaWJsaW5nID0gdGhpcy5jdXJyZW50U2libGluZztcbiAgfSBlbHNlIHtcbiAgICBzaWJsaW5nID0gbmV4dEVsKHRoaXMuaXRlbSk7XG4gIH1cbiAgcmV0dXJuIHRhcmdldCA9PT0gdGhpcy5zb3VyY2UgJiYgc2libGluZyA9PT0gdGhpcy5pbml0aWFsU2libGluZztcbn07XG5cblxuLy8gRGVjbGFyYXRpb25zXG5cbmZ1bmN0aW9uIGdyYWIoZSkge1xuICBpZihERVYpIGNvbnNvbGUubG9nKCdncmFiIGNhbGxlZCwgZTonLCBlKTtcblxuICB2YXIgaXRlbSA9IGUudGFyZ2V0LFxuICAgICAgc291cmNlO1xuXG4gIC8vIGlmIChpc0lucHV0KGl0ZW0pKSB7IC8vIHNlZSBhbHNvOiBnaXRodWIuY29tL2JldmFjcXVhL2RyYWd1bGEvaXNzdWVzLzIwOFxuICAvLyAgIGUudGFyZ2V0LmZvY3VzKCk7IC8vIGZpeGVzIGdpdGh1Yi5jb20vYmV2YWNxdWEvZHJhZ3VsYS9pc3N1ZXMvMTc2XG4gIC8vICAgcmV0dXJuO1xuICAvLyB9XG5cbiAgd2hpbGUgKGdldFBhcmVudChpdGVtKSAmJiAhaXNDb250YWluZXIoZ2V0UGFyZW50KGl0ZW0pLCBpdGVtLCBlKSkge1xuICAgIGl0ZW0gPSBnZXRQYXJlbnQoaXRlbSk7IC8vIGRyYWcgdGFyZ2V0IHNob3VsZCBiZSBhIHRvcCBlbGVtZW50XG4gIH1cbiAgc291cmNlID0gZ2V0UGFyZW50KGl0ZW0pO1xuICBpZiAoIXNvdXJjZSkge1xuICAgIHJldHVybjtcbiAgfVxuICBkcmFnb25TcGFjZS5kcmFncy5wdXNoKG5ldyBEcmFnKGUsIGl0ZW0sIHNvdXJjZSkpO1xufVxuXG5mdW5jdGlvbiBiaW5kKG9iaiwgbWV0aG9kTmFtZSl7XG4gIHZhciBiaW5kZWROYW1lID0gJ2JpbmRlZCcgKyBtZXRob2ROYW1lO1xuICBpZighb2JqW2JpbmRlZE5hbWVdKVxuICAgIG9ialtiaW5kZWROYW1lXSA9IGZ1bmN0aW9uKCl7XG4gICAgICBvYmpbbWV0aG9kTmFtZV0uYXBwbHkob2JqLCBhcmd1bWVudHMpO1xuICAgIH07XG4gIHJldHVybiBvYmpbYmluZGVkTmFtZV07XG59XG5cbmZ1bmN0aW9uIHJlbW92ZU1pcnJvckltYWdlIChtaXJyb3IpIHtcbiAgdmFyIG1pcnJvckNvbnRhaW5lciA9IGdldFBhcmVudChtaXJyb3IpO1xuICBjbGFzc2VzLnJtKG1pcnJvckNvbnRhaW5lciwgJ2d1LXVuc2VsZWN0YWJsZScpO1xuICBtaXJyb3JDb250YWluZXIucmVtb3ZlQ2hpbGQobWlycm9yKTtcbn1cblxuZnVuY3Rpb24gZmluZERyb3BUYXJnZXQgKGVsZW1lbnRCZWhpbmRDdXJzb3IpIHtcbiAgdmFyIHRhcmdldCA9IGVsZW1lbnRCZWhpbmRDdXJzb3I7XG4gIHdoaWxlICh0YXJnZXQgJiYgIWlzQ29udGFpbmVyKHRhcmdldCkpIHtcbiAgICB0YXJnZXQgPSBnZXRQYXJlbnQodGFyZ2V0KTtcbiAgfVxuICByZXR1cm4gdGFyZ2V0O1xufVxuXG5mdW5jdGlvbiBpc0NvbnRhaW5lcihlbG0pIHtcbiAgcmV0dXJuIGRyYWdvblNwYWNlLmNvbnRhaW5lcnNMb29rdXAuaW5kZXhPZihlbG0pKzE7XG59XG5cbmZ1bmN0aW9uIGdldEltbWVkaWF0ZUNoaWxkIChkcm9wVGFyZ2V0LCB0YXJnZXQpIHtcbiAgdmFyIGltbWVkaWF0ZSA9IHRhcmdldDtcbiAgd2hpbGUgKGltbWVkaWF0ZSAhPT0gZHJvcFRhcmdldCAmJiBnZXRQYXJlbnQoaW1tZWRpYXRlKSAhPT0gZHJvcFRhcmdldCkge1xuICAgIGltbWVkaWF0ZSA9IGdldFBhcmVudChpbW1lZGlhdGUpO1xuICB9XG4gIGlmIChpbW1lZGlhdGUgPT09IGRvY0VsbSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHJldHVybiBpbW1lZGlhdGU7XG59XG5cbmZ1bmN0aW9uIGdldFJlZmVyZW5jZSAoZHJvcFRhcmdldCwgdGFyZ2V0LCB4LCB5LCBkaXJlY3Rpb24pIHtcbiAgdmFyIGhvcml6b250YWwgPSBkaXJlY3Rpb24gPT09ICdob3Jpem9udGFsJztcbiAgcmV0dXJuIHRhcmdldCAhPT0gZHJvcFRhcmdldCA/IGluc2lkZSgpIDogb3V0c2lkZSgpOyAvLyByZWZlcmVuY2VcblxuICBmdW5jdGlvbiBvdXRzaWRlICgpIHsgLy8gc2xvd2VyLCBidXQgYWJsZSB0byBmaWd1cmUgb3V0IGFueSBwb3NpdGlvblxuICAgIHZhciBsZW4gPSBkcm9wVGFyZ2V0LmNoaWxkcmVuLmxlbmd0aCxcbiAgICAgICAgaSxcbiAgICAgICAgZWwsXG4gICAgICAgIHJlY3Q7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGVsID0gZHJvcFRhcmdldC5jaGlsZHJlbltpXTtcbiAgICAgIHJlY3QgPSBlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgIGlmIChob3Jpem9udGFsICYmIChyZWN0LmxlZnQgKyByZWN0LndpZHRoIC8gMikgPiB4KSB7IHJldHVybiBlbDsgfVxuICAgICAgaWYgKCFob3Jpem9udGFsICYmIChyZWN0LnRvcCArIHJlY3QuaGVpZ2h0IC8gMikgPiB5KSB7IHJldHVybiBlbDsgfVxuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgZnVuY3Rpb24gaW5zaWRlICgpIHsgLy8gZmFzdGVyLCBidXQgb25seSBhdmFpbGFibGUgaWYgZHJvcHBlZCBpbnNpZGUgYSBjaGlsZCBlbGVtZW50XG4gICAgdmFyIHJlY3QgPSB0YXJnZXQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgaWYgKGhvcml6b250YWwpIHtcbiAgICAgIHJldHVybiByZXNvbHZlKHggPiByZWN0LmxlZnQgKyBnZXRSZWN0V2lkdGgocmVjdCkgLyAyKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc29sdmUoeSA+IHJlY3QudG9wICsgZ2V0UmVjdEhlaWdodChyZWN0KSAvIDIpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVzb2x2ZSAoYWZ0ZXIpIHtcbiAgICByZXR1cm4gYWZ0ZXIgPyBuZXh0RWwodGFyZ2V0KSA6IHRhcmdldDtcbiAgfVxufVxuXG5cbi8vIGZ1bmN0aW9uIHdoaWNoTW91c2VCdXR0b24gKGUpIHtcbi8vICAgLyoqIEBuYW1lc3BhY2UgZS50b3VjaGVzIC0tIHJlc29sdmluZyB3ZWJzdG9ybSB1bnJlc29sdmVkIHZhcmlhYmxlcyAqL1xuLy8gICBpZiAoZS50b3VjaGVzICE9PSB2b2lkIDApIHsgcmV0dXJuIGUudG91Y2hlcy5sZW5ndGg7IH1cbi8vICAgaWYgKGUud2hpY2ggIT09IHZvaWQgMCAmJiBlLndoaWNoICE9PSAwKSB7IHJldHVybiBlLndoaWNoOyB9IC8vIHNlZSBnaXRodWIuY29tL2JldmFjcXVhL2RyYWd1bGEvaXNzdWVzLzI2MVxuLy8gICBpZiAoZS5idXR0b25zICE9PSB2b2lkIDApIHsgcmV0dXJuIGUuYnV0dG9uczsgfVxuLy8gICB2YXIgYnV0dG9uID0gZS5idXR0b247XG4vLyAgIGlmIChidXR0b24gIT09IHZvaWQgMCkgeyAvLyBzZWUgZ2l0aHViLmNvbS9qcXVlcnkvanF1ZXJ5L2Jsb2IvOTllOGZmMWJhYTdhZTM0MWU5NGJiODljM2U4NDU3MGM3YzNhZDllYS9zcmMvZXZlbnQuanMjTDU3My1MNTc1XG4vLyAgICAgcmV0dXJuIGJ1dHRvbiAmIDEgPyAxIDogYnV0dG9uICYgMiA/IDMgOiAoYnV0dG9uICYgNCA/IDIgOiAwKTtcbi8vICAgfVxuLy8gfVxuXG5mdW5jdGlvbiBnZXRPZmZzZXQgKGVsKSB7XG4gIHZhciByZWN0ID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gIHJldHVybiB7XG4gICAgbGVmdDogcmVjdC5sZWZ0ICsgZ2V0U2Nyb2xsKCdzY3JvbGxMZWZ0JywgJ3BhZ2VYT2Zmc2V0JyksXG4gICAgdG9wOiByZWN0LnRvcCArIGdldFNjcm9sbCgnc2Nyb2xsVG9wJywgJ3BhZ2VZT2Zmc2V0JylcbiAgfTtcbn1cblxuZnVuY3Rpb24gZ2V0U2Nyb2xsIChzY3JvbGxQcm9wLCBvZmZzZXRQcm9wKSB7XG4gIGlmICh0eXBlb2YgZ2xvYmFsW29mZnNldFByb3BdICE9PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybiBnbG9iYWxbb2Zmc2V0UHJvcF07XG4gIH1cbiAgaWYgKGRvY0VsbS5jbGllbnRIZWlnaHQpIHtcbiAgICByZXR1cm4gZG9jRWxtW3Njcm9sbFByb3BdO1xuICB9XG4gIHJldHVybiBkb2MuYm9keVtzY3JvbGxQcm9wXTtcbn1cblxuZnVuY3Rpb24gZ2V0RWxlbWVudEJlaGluZFBvaW50IChwb2ludCwgeCwgeSkge1xuICB2YXIgcCA9IHBvaW50IHx8IHt9LFxuICAgICAgc3RhdGUgPSBwLmNsYXNzTmFtZSxcbiAgICAgIGVsO1xuICBwLmNsYXNzTmFtZSArPSAnIGd1LWhpZGUnO1xuICBlbCA9IGRvYy5lbGVtZW50RnJvbVBvaW50KHgsIHkpO1xuICBwLmNsYXNzTmFtZSA9IHN0YXRlO1xuICByZXR1cm4gZWw7XG59XG5cbmZ1bmN0aW9uIG5ldmVyICgpIHsgcmV0dXJuIGZhbHNlOyB9XG5mdW5jdGlvbiBhbHdheXMgKCkgeyByZXR1cm4gdHJ1ZTsgfVxuZnVuY3Rpb24gZ2V0UmVjdFdpZHRoIChyZWN0KSB7IHJldHVybiByZWN0LndpZHRoIHx8IChyZWN0LnJpZ2h0IC0gcmVjdC5sZWZ0KTsgfVxuZnVuY3Rpb24gZ2V0UmVjdEhlaWdodCAocmVjdCkgeyByZXR1cm4gcmVjdC5oZWlnaHQgfHwgKHJlY3QuYm90dG9tIC0gcmVjdC50b3ApOyB9XG5mdW5jdGlvbiBnZXRQYXJlbnQgKGVsKSB7IHJldHVybiBlbC5wYXJlbnROb2RlID09PSBkb2MgPyBudWxsIDogZWwucGFyZW50Tm9kZTsgfVxuZnVuY3Rpb24gZ2V0Q29udGFpbmVyIChlbCkgeyByZXR1cm4gZHJhZ29uU3BhY2UuY29udGFpbmVyc1tkcmFnb25TcGFjZS5jb250YWluZXJzTG9va3VwLmluZGV4T2YoZWwpXSB9XG5mdW5jdGlvbiBpc0lucHV0IChlbCkgeyByZXR1cm4gZWwudGFnTmFtZSA9PT0gJ0lOUFVUJyB8fCBlbC50YWdOYW1lID09PSAnVEVYVEFSRUEnIHx8IGVsLnRhZ05hbWUgPT09ICdTRUxFQ1QnIHx8IGlzRWRpdGFibGUoZWwpOyB9XG5mdW5jdGlvbiBpc0VkaXRhYmxlIChlbCkge1xuICAvKiogQG5hbWVzcGFjZSBlbC5jb250ZW50RWRpdGFibGUgLS0gcmVzb2x2aW5nIHdlYnN0b3JtIHVucmVzb2x2ZWQgdmFyaWFibGVzICovXG4gIGlmICghZWwpIHsgcmV0dXJuIGZhbHNlOyB9IC8vIG5vIHBhcmVudHMgd2VyZSBlZGl0YWJsZVxuICBpZiAoZWwuY29udGVudEVkaXRhYmxlID09PSAnZmFsc2UnKSB7IHJldHVybiBmYWxzZTsgfSAvLyBzdG9wIHRoZSBsb29rdXBcbiAgaWYgKGVsLmNvbnRlbnRFZGl0YWJsZSA9PT0gJ3RydWUnKSB7IHJldHVybiB0cnVlOyB9IC8vIGZvdW5kIGEgY29udGVudEVkaXRhYmxlIGVsZW1lbnQgaW4gdGhlIGNoYWluXG4gIHJldHVybiBpc0VkaXRhYmxlKGdldFBhcmVudChlbCkpOyAvLyBjb250ZW50RWRpdGFibGUgaXMgc2V0IHRvICdpbmhlcml0J1xufVxuXG5mdW5jdGlvbiBuZXh0RWwgKGVsKSB7XG4gIHJldHVybiBlbC5uZXh0RWxlbWVudFNpYmxpbmcgfHwgbWFudWFsbHkoKTtcbiAgZnVuY3Rpb24gbWFudWFsbHkgKCkge1xuICAgIHZhciBzaWJsaW5nID0gZWw7XG4gICAgZG8ge1xuICAgICAgc2libGluZyA9IHNpYmxpbmcubmV4dFNpYmxpbmc7XG4gICAgfSB3aGlsZSAoc2libGluZyAmJiBzaWJsaW5nLm5vZGVUeXBlICE9PSAxKTtcbiAgICByZXR1cm4gc2libGluZztcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRFdmVudEhvc3QgKGUpIHtcbiAgLy8gb24gdG91Y2hlbmQgZXZlbnQsIHdlIGhhdmUgdG8gdXNlIGBlLmNoYW5nZWRUb3VjaGVzYFxuICAvLyBzZWUgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy83MTkyNTYzL3RvdWNoZW5kLWV2ZW50LXByb3BlcnRpZXNcbiAgLy8gc2VlIGdpdGh1Yi5jb20vYmV2YWNxdWEvZHJhZ3VsYS9pc3N1ZXMvMzRcbiAgLyoqIEBuYW1lc3BhY2UgZS50YXJnZXRUb3VjaGVzIC0tIHJlc29sdmluZyB3ZWJzdG9ybSB1bnJlc29sdmVkIHZhcmlhYmxlcyAqL1xuICAvKiogQG5hbWVzcGFjZSBlLmNoYW5nZWRUb3VjaGVzIC0tIHJlc29sdmluZyB3ZWJzdG9ybSB1bnJlc29sdmVkIHZhcmlhYmxlcyAqL1xuICBpZiAoZS50YXJnZXRUb3VjaGVzICYmIGUudGFyZ2V0VG91Y2hlcy5sZW5ndGgpIHtcbiAgICByZXR1cm4gZS50YXJnZXRUb3VjaGVzWzBdO1xuICB9XG4gIGlmIChlLmNoYW5nZWRUb3VjaGVzICYmIGUuY2hhbmdlZFRvdWNoZXMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGUuY2hhbmdlZFRvdWNoZXNbMF07XG4gIH1cbiAgcmV0dXJuIGU7XG59XG5cbmZ1bmN0aW9uIGdldENvb3JkIChjb29yZCwgZSkge1xuICB2YXIgaG9zdCA9IGdldEV2ZW50SG9zdChlKTtcbiAgdmFyIG1pc3NNYXAgPSB7XG4gICAgcGFnZVg6ICdjbGllbnRYJywgLy8gSUU4XG4gICAgcGFnZVk6ICdjbGllbnRZJyAvLyBJRThcbiAgfTtcbiAgaWYgKGNvb3JkIGluIG1pc3NNYXAgJiYgIShjb29yZCBpbiBob3N0KSAmJiBtaXNzTWFwW2Nvb3JkXSBpbiBob3N0KSB7XG4gICAgY29vcmQgPSBtaXNzTWFwW2Nvb3JkXTtcbiAgfVxuICByZXR1cm4gaG9zdFtjb29yZF07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRHJhZ29uO1xud2luZG93LkRyYWdvbiA9IERyYWdvbjtcblxufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pXG5cbn0se1wiLi91dGlscy9jbGFzc2VzXCI6NSxcIi4vdXRpbHMvdG91Y2h5XCI6Nn1dLDI6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuKGZ1bmN0aW9uIChnbG9iYWwpe1xuXG52YXIgTmF0aXZlQ3VzdG9tRXZlbnQgPSBnbG9iYWwuQ3VzdG9tRXZlbnQ7XG5cbmZ1bmN0aW9uIHVzZU5hdGl2ZSAoKSB7XG4gIHRyeSB7XG4gICAgdmFyIHAgPSBuZXcgTmF0aXZlQ3VzdG9tRXZlbnQoJ2NhdCcsIHsgZGV0YWlsOiB7IGZvbzogJ2JhcicgfSB9KTtcbiAgICByZXR1cm4gICdjYXQnID09PSBwLnR5cGUgJiYgJ2JhcicgPT09IHAuZGV0YWlsLmZvbztcbiAgfSBjYXRjaCAoZSkge1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBDcm9zcy1icm93c2VyIGBDdXN0b21FdmVudGAgY29uc3RydWN0b3IuXG4gKlxuICogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0N1c3RvbUV2ZW50LkN1c3RvbUV2ZW50XG4gKlxuICogQHB1YmxpY1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gdXNlTmF0aXZlKCkgPyBOYXRpdmVDdXN0b21FdmVudCA6XG5cbi8vIElFID49IDlcbidmdW5jdGlvbicgPT09IHR5cGVvZiBkb2N1bWVudC5jcmVhdGVFdmVudCA/IGZ1bmN0aW9uIEN1c3RvbUV2ZW50ICh0eXBlLCBwYXJhbXMpIHtcbiAgdmFyIGUgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnQ3VzdG9tRXZlbnQnKTtcbiAgaWYgKHBhcmFtcykge1xuICAgIGUuaW5pdEN1c3RvbUV2ZW50KHR5cGUsIHBhcmFtcy5idWJibGVzLCBwYXJhbXMuY2FuY2VsYWJsZSwgcGFyYW1zLmRldGFpbCk7XG4gIH0gZWxzZSB7XG4gICAgZS5pbml0Q3VzdG9tRXZlbnQodHlwZSwgZmFsc2UsIGZhbHNlLCB2b2lkIDApO1xuICB9XG4gIHJldHVybiBlO1xufSA6XG5cbi8vIElFIDw9IDhcbmZ1bmN0aW9uIEN1c3RvbUV2ZW50ICh0eXBlLCBwYXJhbXMpIHtcbiAgdmFyIGUgPSBkb2N1bWVudC5jcmVhdGVFdmVudE9iamVjdCgpO1xuICBlLnR5cGUgPSB0eXBlO1xuICBpZiAocGFyYW1zKSB7XG4gICAgZS5idWJibGVzID0gQm9vbGVhbihwYXJhbXMuYnViYmxlcyk7XG4gICAgZS5jYW5jZWxhYmxlID0gQm9vbGVhbihwYXJhbXMuY2FuY2VsYWJsZSk7XG4gICAgZS5kZXRhaWwgPSBwYXJhbXMuZGV0YWlsO1xuICB9IGVsc2Uge1xuICAgIGUuYnViYmxlcyA9IGZhbHNlO1xuICAgIGUuY2FuY2VsYWJsZSA9IGZhbHNlO1xuICAgIGUuZGV0YWlsID0gdm9pZCAwO1xuICB9XG4gIHJldHVybiBlO1xufVxuXG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSlcblxufSx7fV0sMzpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4oZnVuY3Rpb24gKGdsb2JhbCl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBjdXN0b21FdmVudCA9IHJlcXVpcmUoJ2N1c3RvbS1ldmVudCcpO1xudmFyIGV2ZW50bWFwID0gcmVxdWlyZSgnLi9ldmVudG1hcCcpO1xudmFyIGRvYyA9IGdsb2JhbC5kb2N1bWVudDtcbnZhciBhZGRFdmVudCA9IGFkZEV2ZW50RWFzeTtcbnZhciByZW1vdmVFdmVudCA9IHJlbW92ZUV2ZW50RWFzeTtcbnZhciBoYXJkQ2FjaGUgPSBbXTtcblxuaWYgKCFnbG9iYWwuYWRkRXZlbnRMaXN0ZW5lcikge1xuICBhZGRFdmVudCA9IGFkZEV2ZW50SGFyZDtcbiAgcmVtb3ZlRXZlbnQgPSByZW1vdmVFdmVudEhhcmQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBhZGQ6IGFkZEV2ZW50LFxuICByZW1vdmU6IHJlbW92ZUV2ZW50LFxuICBmYWJyaWNhdGU6IGZhYnJpY2F0ZUV2ZW50XG59O1xuXG5mdW5jdGlvbiBhZGRFdmVudEVhc3kgKGVsLCB0eXBlLCBmbiwgY2FwdHVyaW5nKSB7XG4gIHJldHVybiBlbC5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGZuLCBjYXB0dXJpbmcpO1xufVxuXG5mdW5jdGlvbiBhZGRFdmVudEhhcmQgKGVsLCB0eXBlLCBmbikge1xuICByZXR1cm4gZWwuYXR0YWNoRXZlbnQoJ29uJyArIHR5cGUsIHdyYXAoZWwsIHR5cGUsIGZuKSk7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUV2ZW50RWFzeSAoZWwsIHR5cGUsIGZuLCBjYXB0dXJpbmcpIHtcbiAgcmV0dXJuIGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgZm4sIGNhcHR1cmluZyk7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUV2ZW50SGFyZCAoZWwsIHR5cGUsIGZuKSB7XG4gIHZhciBsaXN0ZW5lciA9IHVud3JhcChlbCwgdHlwZSwgZm4pO1xuICBpZiAobGlzdGVuZXIpIHtcbiAgICByZXR1cm4gZWwuZGV0YWNoRXZlbnQoJ29uJyArIHR5cGUsIGxpc3RlbmVyKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBmYWJyaWNhdGVFdmVudCAoZWwsIHR5cGUsIG1vZGVsKSB7XG4gIHZhciBlID0gZXZlbnRtYXAuaW5kZXhPZih0eXBlKSA9PT0gLTEgPyBtYWtlQ3VzdG9tRXZlbnQoKSA6IG1ha2VDbGFzc2ljRXZlbnQoKTtcbiAgaWYgKGVsLmRpc3BhdGNoRXZlbnQpIHtcbiAgICBlbC5kaXNwYXRjaEV2ZW50KGUpO1xuICB9IGVsc2Uge1xuICAgIGVsLmZpcmVFdmVudCgnb24nICsgdHlwZSwgZSk7XG4gIH1cbiAgZnVuY3Rpb24gbWFrZUNsYXNzaWNFdmVudCAoKSB7XG4gICAgdmFyIGU7XG4gICAgaWYgKGRvYy5jcmVhdGVFdmVudCkge1xuICAgICAgZSA9IGRvYy5jcmVhdGVFdmVudCgnRXZlbnQnKTtcbiAgICAgIGUuaW5pdEV2ZW50KHR5cGUsIHRydWUsIHRydWUpO1xuICAgIH0gZWxzZSBpZiAoZG9jLmNyZWF0ZUV2ZW50T2JqZWN0KSB7XG4gICAgICBlID0gZG9jLmNyZWF0ZUV2ZW50T2JqZWN0KCk7XG4gICAgfVxuICAgIHJldHVybiBlO1xuICB9XG4gIGZ1bmN0aW9uIG1ha2VDdXN0b21FdmVudCAoKSB7XG4gICAgcmV0dXJuIG5ldyBjdXN0b21FdmVudCh0eXBlLCB7IGRldGFpbDogbW9kZWwgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gd3JhcHBlckZhY3RvcnkgKGVsLCB0eXBlLCBmbikge1xuICByZXR1cm4gZnVuY3Rpb24gd3JhcHBlciAob3JpZ2luYWxFdmVudCkge1xuICAgIHZhciBlID0gb3JpZ2luYWxFdmVudCB8fCBnbG9iYWwuZXZlbnQ7XG4gICAgZS50YXJnZXQgPSBlLnRhcmdldCB8fCBlLnNyY0VsZW1lbnQ7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCA9IGUucHJldmVudERlZmF1bHQgfHwgZnVuY3Rpb24gcHJldmVudERlZmF1bHQgKCkgeyBlLnJldHVyblZhbHVlID0gZmFsc2U7IH07XG4gICAgZS5zdG9wUHJvcGFnYXRpb24gPSBlLnN0b3BQcm9wYWdhdGlvbiB8fCBmdW5jdGlvbiBzdG9wUHJvcGFnYXRpb24gKCkgeyBlLmNhbmNlbEJ1YmJsZSA9IHRydWU7IH07XG4gICAgZS53aGljaCA9IGUud2hpY2ggfHwgZS5rZXlDb2RlO1xuICAgIGZuLmNhbGwoZWwsIGUpO1xuICB9O1xufVxuXG5mdW5jdGlvbiB3cmFwIChlbCwgdHlwZSwgZm4pIHtcbiAgdmFyIHdyYXBwZXIgPSB1bndyYXAoZWwsIHR5cGUsIGZuKSB8fCB3cmFwcGVyRmFjdG9yeShlbCwgdHlwZSwgZm4pO1xuICBoYXJkQ2FjaGUucHVzaCh7XG4gICAgd3JhcHBlcjogd3JhcHBlcixcbiAgICBlbGVtZW50OiBlbCxcbiAgICB0eXBlOiB0eXBlLFxuICAgIGZuOiBmblxuICB9KTtcbiAgcmV0dXJuIHdyYXBwZXI7XG59XG5cbmZ1bmN0aW9uIHVud3JhcCAoZWwsIHR5cGUsIGZuKSB7XG4gIHZhciBpID0gZmluZChlbCwgdHlwZSwgZm4pO1xuICBpZiAoaSkge1xuICAgIHZhciB3cmFwcGVyID0gaGFyZENhY2hlW2ldLndyYXBwZXI7XG4gICAgaGFyZENhY2hlLnNwbGljZShpLCAxKTsgLy8gZnJlZSB1cCBhIHRhZCBvZiBtZW1vcnlcbiAgICByZXR1cm4gd3JhcHBlcjtcbiAgfVxufVxuXG5mdW5jdGlvbiBmaW5kIChlbCwgdHlwZSwgZm4pIHtcbiAgdmFyIGksIGl0ZW07XG4gIGZvciAoaSA9IDA7IGkgPCBoYXJkQ2FjaGUubGVuZ3RoOyBpKyspIHtcbiAgICBpdGVtID0gaGFyZENhY2hlW2ldO1xuICAgIGlmIChpdGVtLmVsZW1lbnQgPT09IGVsICYmIGl0ZW0udHlwZSA9PT0gdHlwZSAmJiBpdGVtLmZuID09PSBmbikge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfVxuICB9XG59XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KVxuXG59LHtcIi4vZXZlbnRtYXBcIjo0LFwiY3VzdG9tLWV2ZW50XCI6Mn1dLDQ6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuKGZ1bmN0aW9uIChnbG9iYWwpe1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgZXZlbnRtYXAgPSBbXTtcbnZhciBldmVudG5hbWUgPSAnJztcbnZhciByb24gPSAvXm9uLztcblxuZm9yIChldmVudG5hbWUgaW4gZ2xvYmFsKSB7XG4gIGlmIChyb24udGVzdChldmVudG5hbWUpKSB7XG4gICAgZXZlbnRtYXAucHVzaChldmVudG5hbWUuc2xpY2UoMikpO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZXZlbnRtYXA7XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KVxuXG59LHt9XSw1OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIGNhY2hlID0ge307XG52YXIgc3RhcnQgPSAnKD86XnxcXFxccyknO1xudmFyIGVuZCA9ICcoPzpcXFxcc3wkKSc7XG5cbmZ1bmN0aW9uIGxvb2t1cENsYXNzIChjbGFzc05hbWUpIHtcbiAgdmFyIGNhY2hlZCA9IGNhY2hlW2NsYXNzTmFtZV07XG4gIGlmIChjYWNoZWQpIHtcbiAgICBjYWNoZWQubGFzdEluZGV4ID0gMDtcbiAgfSBlbHNlIHtcbiAgICBjYWNoZVtjbGFzc05hbWVdID0gY2FjaGVkID0gbmV3IFJlZ0V4cChzdGFydCArIGNsYXNzTmFtZSArIGVuZCwgJ2cnKTtcbiAgfVxuICByZXR1cm4gY2FjaGVkO1xufVxuXG5mdW5jdGlvbiBhZGRDbGFzcyAoZWwsIGNsYXNzTmFtZSkge1xuICB2YXIgY3VycmVudCA9IGVsLmNsYXNzTmFtZTtcbiAgaWYgKCFjdXJyZW50Lmxlbmd0aCkge1xuICAgIGVsLmNsYXNzTmFtZSA9IGNsYXNzTmFtZTtcbiAgfSBlbHNlIGlmICghbG9va3VwQ2xhc3MoY2xhc3NOYW1lKS50ZXN0KGN1cnJlbnQpKSB7XG4gICAgZWwuY2xhc3NOYW1lICs9ICcgJyArIGNsYXNzTmFtZTtcbiAgfVxufVxuXG5mdW5jdGlvbiBybUNsYXNzIChlbCwgY2xhc3NOYW1lKSB7XG4gIGVsLmNsYXNzTmFtZSA9IGVsLmNsYXNzTmFtZS5yZXBsYWNlKGxvb2t1cENsYXNzKGNsYXNzTmFtZSksICcgJykudHJpbSgpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgYWRkOiBhZGRDbGFzcyxcbiAgcm06IHJtQ2xhc3Ncbn07XG5cbn0se31dLDY6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuKGZ1bmN0aW9uIChnbG9iYWwpe1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgY3Jvc3N2ZW50ID0gcmVxdWlyZSgnY3Jvc3N2ZW50Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gdG91Y2h5IChlbCwgb3AsIHR5cGUsIGZuKSB7XG4gICAgdmFyIHRvdWNoID0ge1xuICAgICAgICBtb3VzZXVwOiAndG91Y2hlbmQnLFxuICAgICAgICBtb3VzZWRvd246ICd0b3VjaHN0YXJ0JyxcbiAgICAgICAgbW91c2Vtb3ZlOiAndG91Y2htb3ZlJ1xuICAgIH07XG4gICAgdmFyIHBvaW50ZXJzID0ge1xuICAgICAgICBtb3VzZXVwOiAncG9pbnRlcnVwJyxcbiAgICAgICAgbW91c2Vkb3duOiAncG9pbnRlcmRvd24nLFxuICAgICAgICBtb3VzZW1vdmU6ICdwb2ludGVybW92ZSdcbiAgICB9O1xuICAgIHZhciBtaWNyb3NvZnQgPSB7XG4gICAgICAgIG1vdXNldXA6ICdNU1BvaW50ZXJVcCcsXG4gICAgICAgIG1vdXNlZG93bjogJ01TUG9pbnRlckRvd24nLFxuICAgICAgICBtb3VzZW1vdmU6ICdNU1BvaW50ZXJNb3ZlJ1xuICAgIH07XG5cbiAgICAvKiogQG5hbWVzcGFjZSBnbG9iYWwubmF2aWdhdG9yLnBvaW50ZXJFbmFibGVkIC0tIHJlc29sdmluZyB3ZWJzdG9ybSB1bnJlc29sdmVkIHZhcmlhYmxlcyAqL1xuICAgIC8qKiBAbmFtZXNwYWNlIGdsb2JhbC5uYXZpZ2F0b3IubXNQb2ludGVyRW5hYmxlZCAtLSByZXNvbHZpbmcgd2Vic3Rvcm0gdW5yZXNvbHZlZCB2YXJpYWJsZXMgKi9cbiAgICBpZiAoZ2xvYmFsLm5hdmlnYXRvci5wb2ludGVyRW5hYmxlZCkge1xuICAgICAgICBjcm9zc3ZlbnRbb3BdKGVsLCBwb2ludGVyc1t0eXBlXSB8fCB0eXBlLCBmbik7XG4gICAgfSBlbHNlIGlmIChnbG9iYWwubmF2aWdhdG9yLm1zUG9pbnRlckVuYWJsZWQpIHtcbiAgICAgICAgY3Jvc3N2ZW50W29wXShlbCwgbWljcm9zb2Z0W3R5cGVdIHx8IHR5cGUsIGZuKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjcm9zc3ZlbnRbb3BdKGVsLCB0b3VjaFt0eXBlXSB8fCB0eXBlLCBmbik7XG4gICAgICAgIGNyb3NzdmVudFtvcF0oZWwsIHR5cGUsIGZuKTtcbiAgICB9XG59O1xufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pXG5cbn0se1wiY3Jvc3N2ZW50XCI6M31dfSx7fSxbMV0pKDEpXG59KTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtjaGFyc2V0OnV0Zi04O2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKemIzVnlZMlZ6SWpwYkltNXZaR1ZmYlc5a2RXeGxjeTlpY205M2MyVnlhV1o1TDI1dlpHVmZiVzlrZFd4bGN5OWljbTkzYzJWeUxYQmhZMnN2WDNCeVpXeDFaR1V1YW5NaUxDSmtjbUZuYjI0dWFuTWlMQ0p1YjJSbFgyMXZaSFZzWlhNdlkzSnZjM04yWlc1MEwyNXZaR1ZmYlc5a2RXeGxjeTlqZFhOMGIyMHRaWFpsYm5RdmFXNWtaWGd1YW5NaUxDSnViMlJsWDIxdlpIVnNaWE12WTNKdmMzTjJaVzUwTDNOeVl5OWpjbTl6YzNabGJuUXVhbk1pTENKdWIyUmxYMjF2WkhWc1pYTXZZM0p2YzNOMlpXNTBMM055WXk5bGRtVnVkRzFoY0M1cWN5SXNJblYwYVd4ekwyTnNZWE56WlhNdWFuTWlMQ0oxZEdsc2N5OTBiM1ZqYUhrdWFuTWlYU3dpYm1GdFpYTWlPbHRkTENKdFlYQndhVzVuY3lJNklrRkJRVUU3TzBGRFFVRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPenM3T3p0QlEzaGxRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUczdPenM3UVVOb1JFRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPenM3T3p0QlEzSkhRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CT3pzN08wRkRZa0U3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN096dEJRMnBEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRU0lzSW1acGJHVWlPaUpuWlc1bGNtRjBaV1F1YW5NaUxDSnpiM1Z5WTJWU2IyOTBJam9pSWl3aWMyOTFjbU5sYzBOdmJuUmxiblFpT2xzaUtHWjFibU4wYVc5dUlHVW9kQ3h1TEhJcGUyWjFibU4wYVc5dUlITW9ieXgxS1h0cFppZ2hibHR2WFNsN2FXWW9JWFJiYjEwcGUzWmhjaUJoUFhSNWNHVnZaaUJ5WlhGMWFYSmxQVDFjSW1aMWJtTjBhVzl1WENJbUpuSmxjWFZwY21VN2FXWW9JWFVtSm1FcGNtVjBkWEp1SUdFb2J5d2hNQ2s3YVdZb2FTbHlaWFIxY200Z2FTaHZMQ0V3S1R0MllYSWdaajF1WlhjZ1JYSnliM0lvWENKRFlXNXViM1FnWm1sdVpDQnRiMlIxYkdVZ0oxd2lLMjhyWENJblhDSXBPM1JvY205M0lHWXVZMjlrWlQxY0lrMVBSRlZNUlY5T1QxUmZSazlWVGtSY0lpeG1mWFpoY2lCc1BXNWJiMTA5ZTJWNGNHOXlkSE02ZTMxOU8zUmJiMTFiTUYwdVkyRnNiQ2hzTG1WNGNHOXlkSE1zWm5WdVkzUnBiMjRvWlNsN2RtRnlJRzQ5ZEZ0dlhWc3hYVnRsWFR0eVpYUjFjbTRnY3lodVAyNDZaU2w5TEd3c2JDNWxlSEJ2Y25SekxHVXNkQ3h1TEhJcGZYSmxkSFZ5YmlCdVcyOWRMbVY0Y0c5eWRITjlkbUZ5SUdrOWRIbHdaVzltSUhKbGNYVnBjbVU5UFZ3aVpuVnVZM1JwYjI1Y0lpWW1jbVZ4ZFdseVpUdG1iM0lvZG1GeUlHODlNRHR2UEhJdWJHVnVaM1JvTzI4ckt5bHpLSEpiYjEwcE8zSmxkSFZ5YmlCemZTa2lMQ0luZFhObElITjBjbWxqZENjN1hHNWNiblpoY2lCMGIzVmphSGtnUFNCeVpYRjFhWEpsS0NjdUwzVjBhV3h6TDNSdmRXTm9lU2NwTEZ4dUlDQWdJR05zWVhOelpYTWdQU0J5WlhGMWFYSmxLQ2N1TDNWMGFXeHpMMk5zWVhOelpYTW5LU3hjYmlBZ0lDQmtiMk1nUFNCa2IyTjFiV1Z1ZEN4Y2JpQWdJQ0JrYjJORmJHMGdQU0JrYjJNdVpHOWpkVzFsYm5SRmJHVnRaVzUwTEZ4dUlDQWdJR1J5WVdkdmJsTndZV05sSUQwZ2UxeHVJQ0FnSUNBZ1pISmhaMjl1Y3pvZ1cxMHNYRzRnSUNBZ0lDQmtjbUZuY3pvZ1cxMHNYRzRnSUNBZ0lDQmpiMjUwWVdsdVpYSnpURzl2YTNWd09pQmJYU3hjYmlBZ0lDQWdJR052Ym5SaGFXNWxjbk02SUZ0ZFhHNGdJQ0FnZlN4Y2JpQWdJQ0JwWkNBOUlEQXNYRzVjYmlBZ0lDQkVSVllnUFNCMGNuVmxPMXh1WEc1MGIzVmphSGtvWkc5alJXeHRMQ0FuWVdSa0p5d2dKMjF2ZFhObFpHOTNiaWNzSUdkeVlXSXBPMXh1WEc0dkx5QTlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFZ4dUx5OGdSSEpoWjI5dUlEMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5WEc0dkx5QTlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5WEc0dktpb2dhWE1nWjNKdmRYQWdiMllnWTI5dWRHRnBibVZ5Y3lCM2FYUm9JSE5oYldVZ2MyVjBkR2x1WjNNZ0tpOWNibVoxYm1OMGFXOXVJRVJ5WVdkdmJpQW9iM0IwYVc5dWN5a2dlMXh1SUNCcFppaEVSVllwSUdOdmJuTnZiR1V1Ykc5bktDZEVjbUZuYjI0Z2FXNXpkR0Z1WTJVZ1kzSmxZWFJsWkN3Z2IzQjBhVzl1Y3pvZ0p5d2diM0IwYVc5dWN5azdYRzVjYmlBZ2RHaHBjeTV2Y0hScGIyNXpJRDBnYjNCMGFXOXVjeUJwYm5OMFlXNWpaVzltSUVGeWNtRjVJRDhnZTJOdmJuUmhhVzVsY25NNklHOXdkR2x2Ym5OOUlEb2diM0IwYVc5dWN5QjhmQ0I3ZlR0Y2JpQWdkR2hwY3k1amIyNTBZV2x1WlhKeklEMGdXMTA3WEc0Z0lIUm9hWE11WkhKaFoyOXVVM0JoWTJVZ1BTQmtjbUZuYjI1VGNHRmpaVHRjYmlBZ2RHaHBjeTVwWkNBOUlIUm9hWE11YjNCMGFXOXVjeTVwWkNCOGZDQW5aSEpoWjI5dUp5QXJJR2xrS3lzN1hHNGdJRnh1SUNCa2NtRm5iMjVUY0dGalpTNWtjbUZuYjI1ekxuQjFjMmdvZEdocGN5azdJQzh2SUhKbFoybHpkR1Z5SUdSeVlXZHZibHh1WEc0Z0lHbG1LSFJvYVhNdWIzQjBhVzl1Y3k1amIyNTBZV2x1WlhKektWeHVJQ0FnSUhSb2FYTXVZV1JrUTI5dWRHRnBibVZ5Y3loMGFHbHpMbTl3ZEdsdmJuTXVZMjl1ZEdGcGJtVnljeWs3WEc1OVhHNWNia1J5WVdkdmJpNXdjbTkwYjNSNWNHVXVZV1JrUTI5dWRHRnBibVZ5Y3lBOUlHWjFibU4wYVc5dUtHTnZiblJoYVc1bGNuTXBJSHRjYmlBZ2FXWW9SRVZXS1NCamIyNXpiMnhsTG14dlp5Z25RV1JrYVc1bklHTnZiblJoYVc1bGNuTTZJQ2NzSUdOdmJuUmhhVzVsY25NcE8xeHVYRzRnSUhaaGNpQnpaV3htSUQwZ2RHaHBjenRjYmlBZ1kyOXVkR0ZwYm1WeWN5NW1iM0pGWVdOb0tHWjFibU4wYVc5dUlDaGpiMjUwWVdsdVpYSkZiRzBwSUh0Y2JpQWdJQ0IyWVhJZ1kyOXVkR0ZwYm1WeUlEMGdibVYzSUVOdmJuUmhhVzVsY2loelpXeG1MQ0JqYjI1MFlXbHVaWEpGYkcwcE8xeHVJQ0FnSUhObGJHWXVZMjl1ZEdGcGJtVnljeTV3ZFhOb0tHTnZiblJoYVc1bGNpazdYRzRnSUNBZ1pISmhaMjl1VTNCaFkyVXVZMjl1ZEdGcGJtVnljeTV3ZFhOb0tHTnZiblJoYVc1bGNpazdYRzRnSUNBZ1pISmhaMjl1VTNCaFkyVXVZMjl1ZEdGcGJtVnljMHh2YjJ0MWNDNXdkWE5vS0dOdmJuUmhhVzVsY2tWc2JTazdYRzRnSUgwcE8xeHVmVHRjYmx4dVhHNHZMeUE5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBWeHVMeThnUTI5dWRHRnBibVZ5SUQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlYRzR2THlBOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlYRzVjYm1aMWJtTjBhVzl1SUVOdmJuUmhhVzVsY2loa2NtRm5iMjRzSUdWc2JTa2dlMXh1SUNCcFppaEVSVllwSUdOdmJuTnZiR1V1Ykc5bktDZERiMjUwWVdsdVpYSWdhVzV6ZEdGdVkyVWdZM0psWVhSbFpDd2daV3h0T2ljc0lHVnNiU2s3WEc1Y2JpQWdkR2hwY3k1cFpDQTlJR1ZzYlM1cFpDQjhmQ0FuWTI5dWRHRnBibVZ5SnlBcklHbGtLeXM3WEc0Z0lIUm9hWE11WkhKaFoyOXVJRDBnWkhKaFoyOXVPMXh1SUNCMGFHbHpMbVZzYlNBOUlHVnNiVHRjYmlBZ2RHaHBjeTV2Y0hScGIyNXpJRDBnZTMwN1hHNGdJSFJvYVhNdWIzQjBhVzl1Y3k1dGFYSnliM0pEYjI1MFlXbHVaWElnUFNCa2IyTXVZbTlrZVR0Y2JuMWNibHh1THk4Z1BUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDFjYmk4dklFUnlZV2NnUFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMWNiaTh2SUQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMWNibVoxYm1OMGFXOXVJRVJ5WVdjb1pTd2dhWFJsYlN3Z2MyOTFjbU5sS1NCN1hHNWNiaUFnYVdZb1JFVldLU0JqYjI1emIyeGxMbXh2WnlnblJISmhaeUJwYm5OMFlXNWpaU0JqY21WaGRHVmtMQ0J3WVhKaGJYTTZKeXdnWlN3Z2FYUmxiU3dnYzI5MWNtTmxLVHRjYmx4dUlDQXZMeUIwYUdsekxtMXBjbkp2Y2pzZ0x5OGdiV2x5Y205eUlHbHRZV2RsWEc0Z0lDOHZJSFJvYVhNdWMyOTFjbU5sT3lBdkx5QnpiM1Z5WTJVZ1kyOXVkR0ZwYm1WeUlHVnNaVzFsYm5SY2JpQWdMeThnZEdocGN5NXpiM1Z5WTJVN0lDOHZJSE52ZFhKalpTQkRiMjUwWVdsdVpYSWdiMkpxWldOMFhHNGdJQzh2SUhSb2FYTXVhWFJsYlRzZ0x5OGdhWFJsYlNCbGJHVnRaVzUwSUdKbGFXNW5JR1J5WVdkblpXUmNiaUFnTHk4Z2RHaHBjeTV2Wm1aelpYUllPeUF2THlCeVpXWmxjbVZ1WTJVZ2VGeHVJQ0F2THlCMGFHbHpMbTltWm5ObGRGazdJQzh2SUhKbFptVnlaVzVqWlNCNVhHNGdJQzh2SUhSb2FYTXViVzkyWlZnN0lDOHZJSEpsWm1WeVpXNWpaU0J0YjNabElIaGNiaUFnTHk4Z2RHaHBjeTV0YjNabFdUc2dMeThnY21WbVpYSmxibU5sSUcxdmRtVWdlVnh1SUNBdkx5QjBhR2x6TG1sdWFYUnBZV3hUYVdKc2FXNW5PeUF2THlCeVpXWmxjbVZ1WTJVZ2MybGliR2x1WnlCM2FHVnVJR2R5WVdKaVpXUmNiaUFnTHk4Z2RHaHBjeTVqZFhKeVpXNTBVMmxpYkdsdVp6c2dMeThnY21WbVpYSmxibU5sSUhOcFlteHBibWNnYm05M1hHNGdJQzh2SUhSb2FYTXVjM1JoZEdVN0lDOHZJR2h2YkdSeklFUnlZV2NnYzNSaGRHVWdLR2R5WVdKaVpXUXNJSFJ5WVdOcmFXNW5MQ0IzWVdsMGFXNW5MQ0JrY21GbloybHVaeXdnTGk0dUtWeHVYRzRnSUdVdWNISmxkbVZ1ZEVSbFptRjFiSFFvS1RzZ0x5OGdabWw0WlhNZ1oybDBhSFZpTG1OdmJTOWlaWFpoWTNGMVlTOWtjbUZuZFd4aEwybHpjM1ZsY3k4eE5UVmNiaUFnZEdocGN5NXRiM1psV0NBOUlHVXVZMnhwWlc1MFdEdGNiaUFnZEdocGN5NXRiM1psV1NBOUlHVXVZMnhwWlc1MFdUdGNibHh1SUNCcFppaEVSVllwSUdOdmJuTnZiR1V1Ykc5bktDY3FLaW9nUTJoaGJtZHBibWNnYzNSaGRHVTZJQ2NzSUhSb2FYTXVjM1JoZEdVc0lDY2dMVDRnWjNKaFltSmxaQ2NwTzF4dUlDQjBhR2x6TG5OMFlYUmxJRDBnSjJkeVlXSmlaV1FuTzF4dVhHNGdJSFJvYVhNdWFYUmxiU0E5SUdsMFpXMDdYRzRnSUhSb2FYTXVjMjkxY21ObElEMGdjMjkxY21ObE8xeHVJQ0IwYUdsekxuTnZkWEpqWlVOdmJuUmhhVzVsY2lBOUlHZGxkRU52Ym5SaGFXNWxjaWh6YjNWeVkyVXBPMXh1SUNCMGFHbHpMbTl3ZEdsdmJuTWdQU0IwYUdsekxuTnZkWEpqWlVOdmJuUmhhVzVsY2k1dmNIUnBiMjV6SUh4OElIdDlPMXh1WEc0Z0lIUm9hWE11WlhabGJuUnpLQ2s3WEc1OVhHNWNia1J5WVdjdWNISnZkRzkwZVhCbExtUmxjM1J5YjNrZ1BTQm1kVzVqZEdsdmJpZ3BJSHRjYmlBZ2FXWW9SRVZXS1NCamIyNXpiMnhsTG14dlp5Z25SSEpoWnk1a1pYTjBjbTk1SUdOaGJHeGxaQ2NwTzF4dVhHNGdJSFJvYVhNdWNtVnNaV0Z6WlNoN2ZTazdYRzU5TzF4dVhHNUVjbUZuTG5CeWIzUnZkSGx3WlM1bGRtVnVkSE1nUFNCbWRXNWpkR2x2YmloeVpXMXZkbVVwSUh0Y2JpQWdhV1lvUkVWV0tTQmpiMjV6YjJ4bExteHZaeWduUkhKaFp5NWxkbVZ1ZEhNZ1kyRnNiR1ZrTENCY0luSmxiVzkyWlZ3aUlIQmhjbUZ0T2ljc0lISmxiVzkyWlNrN1hHNWNiaUFnZG1GeUlHOXdJRDBnY21WdGIzWmxJRDhnSjNKbGJXOTJaU2NnT2lBbllXUmtKenRjYmlBZ2RHOTFZMmg1S0dSdlkwVnNiU3dnYjNBc0lDZHRiM1Z6WlhWd0p5d2dZbWx1WkNoMGFHbHpMQ0FuY21Wc1pXRnpaU2NwS1R0Y2JpQWdkRzkxWTJoNUtHUnZZMFZzYlN3Z2IzQXNJQ2R0YjNWelpXMXZkbVVuTENCaWFXNWtLSFJvYVhNc0lDZGtjbUZuSnlrcE8xeHVJQ0IwYjNWamFIa29aRzlqUld4dExDQnZjQ3dnSjNObGJHVmpkSE4wWVhKMEp5d2dZbWx1WkNoMGFHbHpMQ0FuY0hKdmRHVmpkRWR5WVdJbktTazdJQzh2SUVsRk9GeHVJQ0IwYjNWamFIa29aRzlqUld4dExDQnZjQ3dnSjJOc2FXTnJKeXdnWW1sdVpDaDBhR2x6TENBbmNISnZkR1ZqZEVkeVlXSW5LU2s3WEc1OU8xeHVYRzVFY21GbkxuQnliM1J2ZEhsd1pTNXdjbTkwWldOMFIzSmhZaUE5SUdaMWJtTjBhVzl1S0dVcElIdGNiaUFnYVdZb1JFVldLU0JqYjI1emIyeGxMbXh2WnlnblJISmhaeTV3Y205MFpXTjBSM0poWWlCallXeHNaV1FzSUdVNkp5d2daU2s3WEc1Y2JpQWdhV1lnS0hSb2FYTXVjM1JoZEdVZ1BUMGdKMmR5WVdKaVpXUW5LU0I3WEc0Z0lDQWdaUzV3Y21WMlpXNTBSR1ZtWVhWc2RDZ3BPMXh1SUNCOVhHNTlPMXh1WEc1RWNtRm5MbkJ5YjNSdmRIbHdaUzVrY21GbklEMGdablZ1WTNScGIyNG9aU2tnZTF4dUlDQnBaaWhFUlZZcElHTnZibk52YkdVdWJHOW5LQ2RFY21GbkxtUnlZV2NnWTJGc2JHVmtMQ0JsT2ljc0lHVXBPMXh1WEc0Z0lHbG1LSFJvYVhNdWMzUmhkR1VnUFQwZ0oyZHlZV0ppWldRbktYdGNiaUFnSUNCMGFHbHpMbk4wWVhKMFFubE5iM1psYldWdWRDaGxLVHRjYmlBZ0lDQnlaWFIxY200N1hHNGdJSDFjYmlBZ2FXWW9kR2hwY3k1emRHRjBaU0FoUFQwZ0oyMXZkbVZrSnlBbUppQjBhR2x6TG5OMFlYUmxJQ0U5UFNBblpISmhaMmRwYm1jbktYdGNiaUFnSUNCMGFHbHpMbU5oYm1ObGJDZ3BPMXh1SUNBZ0lISmxkSFZ5Ymp0Y2JpQWdmVnh1WEc0Z0lHbG1LRVJGVmlrZ1kyOXVjMjlzWlM1c2IyY29KeW9xS2lCRGFHRnVaMmx1WnlCemRHRjBaVG9nSnl3Z2RHaHBjeTV6ZEdGMFpTd2dKeUF0UGlCa2NtRm5aMmx1WnljcE8xeHVJQ0IwYUdsekxuTjBZWFJsSUQwZ0oyUnlZV2RuYVc1bkp6dGNibHh1SUNCbExuQnlaWFpsYm5SRVpXWmhkV3gwS0NrN1hHNWNiaUFnZG1GeUlHTnNhV1Z1ZEZnZ1BTQm5aWFJEYjI5eVpDZ25ZMnhwWlc1MFdDY3NJR1VwTEZ4dUlDQWdJQ0FnWTJ4cFpXNTBXU0E5SUdkbGRFTnZiM0prS0NkamJHbGxiblJaSnl3Z1pTa3NYRzRnSUNBZ0lDQjRJRDBnWTJ4cFpXNTBXQ0F0SUhSb2FYTXViMlptYzJWMFdDeGNiaUFnSUNBZ0lIa2dQU0JqYkdsbGJuUlpJQzBnZEdocGN5NXZabVp6WlhSWkxGeHVJQ0FnSUNBZ2JXbHljbTl5SUQwZ2RHaHBjeTV0YVhKeWIzSTdYRzVjYmlBZ2JXbHljbTl5TG5OMGVXeGxMbXhsWm5RZ1BTQjRJQ3NnSjNCNEp6dGNiaUFnYldseWNtOXlMbk4wZVd4bExuUnZjQ0E5SUhrZ0t5QW5jSGduTzF4dVhHNGdJSFpoY2lCbGJHVnRaVzUwUW1Wb2FXNWtRM1Z5YzI5eUlEMGdaMlYwUld4bGJXVnVkRUpsYUdsdVpGQnZhVzUwS0cxcGNuSnZjaXdnWTJ4cFpXNTBXQ3dnWTJ4cFpXNTBXU2tzWEc0Z0lDQWdJQ0JrY205d1ZHRnlaMlYwSUQwZ1ptbHVaRVJ5YjNCVVlYSm5aWFFvWld4bGJXVnVkRUpsYUdsdVpFTjFjbk52Y2l3Z1kyeHBaVzUwV0N3Z1kyeHBaVzUwV1Nrc1hHNGdJQ0FnSUNCeVpXWmxjbVZ1WTJVc1hHNGdJQ0FnSUNCcGJXMWxaR2xoZEdVZ1BTQm5aWFJKYlcxbFpHbGhkR1ZEYUdsc1pDaGtjbTl3VkdGeVoyVjBMQ0JsYkdWdFpXNTBRbVZvYVc1a1EzVnljMjl5S1R0Y2JseHVJQ0JwWmlBb2FXMXRaV1JwWVhSbElDRTlQU0J1ZFd4c0tTQjdYRzRnSUNBZ2NtVm1aWEpsYm1ObElEMGdaMlYwVW1WbVpYSmxibU5sS0dSeWIzQlVZWEpuWlhRc0lHbHRiV1ZrYVdGMFpTd2dZMnhwWlc1MFdDd2dZMnhwWlc1MFdTazdYRzRnSUgwZ1pXeHpaU0I3WEc0Z0lDQWdjbVYwZFhKdU8xeHVJQ0I5WEc0Z0lHbG1JQ2hjYmlBZ0lDQWdJSEpsWm1WeVpXNWpaU0E5UFQwZ2JuVnNiQ0I4ZkZ4dUlDQWdJQ0FnY21WbVpYSmxibU5sSUNFOVBTQjBhR2x6TG1sMFpXMGdKaVpjYmlBZ0lDQWdJSEpsWm1WeVpXNWpaU0FoUFQwZ2JtVjRkRVZzS0hSb2FYTXVhWFJsYlNsY2JpQWdLU0I3WEc0Z0lDQWdkR2hwY3k1amRYSnlaVzUwVTJsaWJHbHVaeUE5SUhKbFptVnlaVzVqWlR0Y2JpQWdJQ0JrY205d1ZHRnlaMlYwTG1sdWMyVnlkRUpsWm05eVpTaDBhR2x6TG1sMFpXMHNJSEpsWm1WeVpXNWpaU2s3WEc0Z0lIMWNibjA3WEc1Y2JrUnlZV2N1Y0hKdmRHOTBlWEJsTG5OMFlYSjBRbmxOYjNabGJXVnVkQ0E5SUdaMWJtTjBhVzl1S0dVcElIdGNiaUFnYVdZb1JFVldLU0JqYjI1emIyeGxMbXh2WnlnblJISmhaeTV6ZEdGeWRFSjVUVzkyWlcxbGJuUWdZMkZzYkdWa0xDQmxPaWNzSUdVcE8xeHVYRzRnSUM4dklHbG1JQ2gzYUdsamFFMXZkWE5sUW5WMGRHOXVLR1VwSUQwOVBTQXdLU0I3WEc0Z0lDOHZJQ0FnY21Wc1pXRnpaU2g3ZlNrN1hHNGdJQzh2SUNBZ2NtVjBkWEp1T3lBdkx5QjNhR1Z1SUhSbGVIUWdhWE1nYzJWc1pXTjBaV1FnYjI0Z1lXNGdhVzV3ZFhRZ1lXNWtJSFJvWlc0Z1pISmhaMmRsWkN3Z2JXOTFjMlYxY0NCa2IyVnpiaWQwSUdacGNtVXVJSFJvYVhNZ2FYTWdiM1Z5SUc5dWJIa2dhRzl3WlZ4dUlDQXZMeUI5WEc1Y2JpQWdMeThnZEhKMWRHaDVJR05vWldOcklHWnBlR1Z6SUdkcGRHaDFZaTVqYjIwdlltVjJZV054ZFdFdlpISmhaM1ZzWVM5cGMzTjFaWE12TWpNNUxDQmxjWFZoYkdsMGVTQm1hWGhsY3lCbmFYUm9kV0l1WTI5dEwySmxkbUZqY1hWaEwyUnlZV2QxYkdFdmFYTnpkV1Z6THpJd04xeHVJQ0JwWmlBb1pTNWpiR2xsYm5SWUlDRTlQU0IyYjJsa0lEQWdKaVlnWlM1amJHbGxiblJZSUQwOVBTQjBhR2x6TG0xdmRtVllJQ1ltSUdVdVkyeHBaVzUwV1NBaFBUMGdkbTlwWkNBd0lDWW1JR1V1WTJ4cFpXNTBXU0E5UFQwZ2RHaHBjeTV0YjNabFdTa2dlMXh1SUNBZ0lISmxkSFZ5Ymp0Y2JpQWdmVnh1WEc0Z0lIUm9hWE11YVc1cGRHbGhiRk5wWW14cGJtY2dQU0IwYUdsekxtTjFjbkpsYm5SVGFXSnNhVzVuSUQwZ2JtVjRkRVZzS0hSb2FYTXVhWFJsYlNrN1hHNWNiaUFnZG1GeUlHOW1abk5sZENBOUlHZGxkRTltWm5ObGRDaDBhR2x6TG1sMFpXMHBPMXh1SUNCMGFHbHpMbTltWm5ObGRGZ2dQU0JuWlhSRGIyOXlaQ2duY0dGblpWZ25MQ0JsS1NBdElHOW1abk5sZEM1c1pXWjBPMXh1SUNCMGFHbHpMbTltWm5ObGRGa2dQU0JuWlhSRGIyOXlaQ2duY0dGblpWa25MQ0JsS1NBdElHOW1abk5sZEM1MGIzQTdYRzVjYmlBZ1kyeGhjM05sY3k1aFpHUW9kR2hwY3k1cGRHVnRMQ0FuWjNVdGRISmhibk5wZENjcE8xeHVJQ0IwYUdsekxuSmxibVJsY2sxcGNuSnZja2x0WVdkbEtIUm9hWE11YjNCMGFXOXVjeTV0YVhKeWIzSkRiMjUwWVdsdVpYSXBPMXh1WEc0Z0lHbG1LRVJGVmlrZ1kyOXVjMjlzWlM1c2IyY29KeW9xS2lCRGFHRnVaMmx1WnlCemRHRjBaVG9nSnl3Z2RHaHBjeTV6ZEdGMFpTd2dKeUF0UGlCdGIzWmxaQ2NwTzF4dUlDQjBhR2x6TG5OMFlYUmxJRDBnSjIxdmRtVmtKenRjYm4wN1hHNWNia1J5WVdjdWNISnZkRzkwZVhCbExuSmxibVJsY2sxcGNuSnZja2x0WVdkbElEMGdablZ1WTNScGIyNG9iV2x5Y205eVEyOXVkR0ZwYm1WeUtTQjdYRzRnSUdsbUtFUkZWaWtnWTI5dWMyOXNaUzVzYjJjb0owUnlZV2N1Y21WdVpHVnlUV2x5Y205eVNXMWhaMlVnWTJGc2JHVmtMQ0JsT2ljc0lHMXBjbkp2Y2tOdmJuUmhhVzVsY2lrN1hHNWNiaUFnZG1GeUlISmxZM1FnUFNCMGFHbHpMbWwwWlcwdVoyVjBRbTkxYm1ScGJtZERiR2xsYm5SU1pXTjBLQ2s3WEc0Z0lIWmhjaUJ0YVhKeWIzSWdQU0IwYUdsekxtMXBjbkp2Y2lBOUlIUm9hWE11YVhSbGJTNWpiRzl1WlU1dlpHVW9kSEoxWlNrN1hHNWNiaUFnYldseWNtOXlMbk4wZVd4bExuZHBaSFJvSUQwZ1oyVjBVbVZqZEZkcFpIUm9LSEpsWTNRcElDc2dKM0I0Snp0Y2JpQWdiV2x5Y205eUxuTjBlV3hsTG1obGFXZG9kQ0E5SUdkbGRGSmxZM1JJWldsbmFIUW9jbVZqZENrZ0t5QW5jSGduTzF4dUlDQmpiR0Z6YzJWekxuSnRLRzFwY25KdmNpd2dKMmQxTFhSeVlXNXphWFFuS1R0Y2JpQWdZMnhoYzNObGN5NWhaR1FvYldseWNtOXlMQ0FuWjNVdGJXbHljbTl5SnlrN1hHNGdJRzFwY25KdmNrTnZiblJoYVc1bGNpNWhjSEJsYm1SRGFHbHNaQ2h0YVhKeWIzSXBPMXh1SUNCamJHRnpjMlZ6TG1Ga1pDaHRhWEp5YjNKRGIyNTBZV2x1WlhJc0lDZG5kUzExYm5ObGJHVmpkR0ZpYkdVbktUdGNibjA3WEc1Y2JrUnlZV2N1Y0hKdmRHOTBlWEJsTG5KbGJHVmhjMlVnUFNCbWRXNWpkR2x2YmlobEtTQjdYRzRnSUdsbUtFUkZWaWtnWTI5dWMyOXNaUzVzYjJjb0owUnlZV2N1Y21Wc1pXRnpaU0JqWVd4c1pXUXNJR1U2Snl3Z1pTazdYRzVjYmlBZ2RHOTFZMmg1S0dSdlkwVnNiU3dnSjNKbGJXOTJaU2NzSUNkdGIzVnpaWFZ3Snl3Z2RHaHBjeTV5Wld4bFlYTmxLVHRjYmx4dUlDQjJZWElnWTJ4cFpXNTBXQ0E5SUdkbGRFTnZiM0prS0NkamJHbGxiblJZSnl3Z1pTazdYRzRnSUhaaGNpQmpiR2xsYm5SWklEMGdaMlYwUTI5dmNtUW9KMk5zYVdWdWRGa25MQ0JsS1R0Y2JseHVJQ0IyWVhJZ1pXeGxiV1Z1ZEVKbGFHbHVaRU4xY25OdmNpQTlJR2RsZEVWc1pXMWxiblJDWldocGJtUlFiMmx1ZENoMGFHbHpMbTFwY25KdmNpd2dZMnhwWlc1MFdDd2dZMnhwWlc1MFdTazdYRzRnSUhaaGNpQmtjbTl3VkdGeVoyVjBJRDBnWm1sdVpFUnliM0JVWVhKblpYUW9aV3hsYldWdWRFSmxhR2x1WkVOMWNuTnZjaXdnWTJ4cFpXNTBXQ3dnWTJ4cFpXNTBXU2s3WEc0Z0lHbG1JQ2hrY205d1ZHRnlaMlYwSUNZbUlHUnliM0JVWVhKblpYUWdJVDA5SUhSb2FYTXVjMjkxY21ObEtTQjdYRzRnSUNBZ2RHaHBjeTVrY205d0tHVXNJSFJvYVhNdWFYUmxiU3dnWkhKdmNGUmhjbWRsZENrN1hHNGdJSDBnWld4elpTQjdYRzRnSUNBZ2RHaHBjeTVqWVc1alpXd29LVHRjYmlBZ2ZWeHVmVHRjYmx4dVJISmhaeTV3Y205MGIzUjVjR1V1WkhKdmNDQTlJR1oxYm1OMGFXOXVLQ2tnZTF4dUlDQnBaaWhFUlZZcElHTnZibk52YkdVdWJHOW5LQ2RFY21GbkxtUnliM0FnWTJGc2JHVmtKeWs3WEc0Z0lHbG1JQ2gwYUdsekxuTjBZWFJsSUNFOUlDZGtjbUZuWjJsdVp5Y3BYRzRnSUNBZ2NtVjBkWEp1TzF4dVhHNGdJR2xtS0VSRlZpa2dZMjl1YzI5c1pTNXNiMmNvSnlvcUtpQkRhR0Z1WjJsdVp5QnpkR0YwWlRvZ0p5d2dkR2hwY3k1emRHRjBaU3dnSnlBdFBpQmtjbTl3Y0dWa0p5azdYRzRnSUhSb2FYTXVjM1JoZEdVZ1BTQW5aSEp2Y0hCbFpDYzdYRzVjYmlBZ2RHaHBjeTVqYkdWaGJuVndLQ2s3WEc1OU8xeHVYRzVFY21GbkxuQnliM1J2ZEhsd1pTNXlaVzF2ZG1VZ1BTQm1kVzVqZEdsdmJpZ3BJSHRjYmlBZ2FXWW9SRVZXS1NCamIyNXpiMnhsTG14dlp5Z25SSEpoWnk1eVpXMXZkbVVnWTJGc2JHVmtMQ0JsT2ljc0lHVXBPMXh1WEc0Z0lHbG1JQ2gwYUdsekxuTjBZWFJsSUNFOVBTQW5aSEpoWjJsdVp5Y3BYRzRnSUNBZ2NtVjBkWEp1TzF4dVhHNGdJR2xtS0VSRlZpa2dZMjl1YzI5c1pTNXNiMmNvSnlvcUtpQkRhR0Z1WjJsdVp5QnpkR0YwWlRvZ0p5d2dkR2hwY3k1emRHRjBaU3dnSnlBdFBpQmtjbUZuWjJsdVp5Y3BPMXh1SUNCMGFHbHpMbk4wWVhSbElEMGdKM0psYlc5MlpXUW5PMXh1WEc0Z0lIWmhjaUJ3WVhKbGJuUWdQU0JuWlhSUVlYSmxiblFvZEdocGN5NXBkR1Z0S1R0Y2JpQWdhV1lnS0hCaGNtVnVkQ2tnZTF4dUlDQWdJSEJoY21WdWRDNXlaVzF2ZG1WRGFHbHNaQ2gwYUdsekxtbDBaVzBwTzF4dUlDQjlYRzRnSUhSb2FYTXVZMnhsWVc1MWNDZ3BPMXh1ZlR0Y2JseHVSSEpoWnk1d2NtOTBiM1I1Y0dVdVkyRnVZMlZzSUQwZ1puVnVZM1JwYjI0b2NtVjJaWEowY3lsN1hHNGdJR2xtS0VSRlZpa2dZMjl1YzI5c1pTNXNiMmNvSjBSeVlXY3VZMkZ1WTJWc0lHTmhiR3hsWkN3Z2NtVjJaWEowY3pvbkxDQnlaWFpsY25SektUdGNibHh1SUNCcFppQW9kR2hwY3k1emRHRjBaU0E5UFNBblpISmhaMmx1WnljcGUxeHVJQ0FnSUNBZ2RtRnlJSEJoY21WdWRDQTlJR2RsZEZCaGNtVnVkQ2gwYUdsekxtbDBaVzBwTzF4dUlDQWdJQ0FnZG1GeUlHbHVhWFJwWVd3Z1BTQjBhR2x6TG1selNXNXBkR2xoYkZCc1lXTmxiV1Z1ZENod1lYSmxiblFwTzF4dUlDQWdJQ0FnYVdZZ0tHbHVhWFJwWVd3Z1BUMDlJR1poYkhObElDWW1JSEpsZG1WeWRITXBJSHRjYmlBZ0lDQWdJQ0FnSUNCMGFHbHpMbk52ZFhKalpTNXBibk5sY25SQ1pXWnZjbVVvZEdocGN5NXBkR1Z0TENCMGFHbHpMbWx1YVhScFlXeFRhV0pzYVc1bktUdGNiaUFnSUNBZ0lIMWNiaUFnZlZ4dVhHNGdJR2xtS0VSRlZpa2dZMjl1YzI5c1pTNXNiMmNvSnlvcUtpQkRhR0Z1WjJsdVp5QnpkR0YwWlRvZ0p5d2dkR2hwY3k1emRHRjBaU3dnSnlBdFBpQmpZVzVqWld4c1pXUW5LVHRjYmlBZ2RHaHBjeTV6ZEdGMFpTQTlJQ2RqWVc1alpXeHNaV1FuTzF4dVhHNGdJSFJvYVhNdVkyeGxZVzUxY0NncE8xeHVmVHRjYmx4dVJISmhaeTV3Y205MGIzUjVjR1V1WTJ4bFlXNTFjQ0E5SUdaMWJtTjBhVzl1S0NrZ2UxeHVJQ0JwWmloRVJWWXBJR052Ym5OdmJHVXViRzluS0NkRWNtRm5MbU5zWldGdWRYQWdZMkZzYkdWa0p5azdYRzVjYmlBZ2RHaHBjeTVsZG1WdWRITW9KM0psYlc5MlpTY3BPMXh1WEc0Z0lHbG1LSFJvYVhNdWJXbHljbTl5S1Z4dUlDQWdJSEpsYlc5MlpVMXBjbkp2Y2tsdFlXZGxLSFJvYVhNdWJXbHljbTl5S1R0Y2JseHVJQ0JwWmlBb2RHaHBjeTVwZEdWdEtTQjdYRzRnSUNBZ1kyeGhjM05sY3k1eWJTaDBhR2x6TG1sMFpXMHNJQ2RuZFMxMGNtRnVjMmwwSnlrN1hHNGdJSDFjYmx4dUlDQnBaaWhFUlZZcElHTnZibk52YkdVdWJHOW5LQ2NxS2lvZ1EyaGhibWRwYm1jZ2MzUmhkR1U2SUNjc0lIUm9hWE11YzNSaGRHVXNJQ2NnTFQ0Z1kyeGxZVzVsWkNjcE8xeHVJQ0IwYUdsekxuTjBZWFJsSUQwZ0oyTnNaV0Z1WldRbk8xeHVYRzRnSUhSb2FYTXVjMjkxY21ObElEMGdkR2hwY3k1cGRHVnRJRDBnZEdocGN5NXBibWwwYVdGc1UybGliR2x1WnlBOUlIUm9hWE11WTNWeWNtVnVkRk5wWW14cGJtY2dQU0J1ZFd4c08xeHVmVHRjYmx4dVJISmhaeTV3Y205MGIzUjVjR1V1YVhOSmJtbDBhV0ZzVUd4aFkyVnRaVzUwSUNBOUlHWjFibU4wYVc5dUtIUmhjbWRsZEN4ektTQjdYRzRnSUhaaGNpQnphV0pzYVc1bk8xeHVJQ0JwWmlBb2N5QWhQVDBnZG05cFpDQXdLU0I3WEc0Z0lDQWdjMmxpYkdsdVp5QTlJSE03WEc0Z0lIMGdaV3h6WlNCcFppQW9kR2hwY3k1dGFYSnliM0lwSUh0Y2JpQWdJQ0J6YVdKc2FXNW5JRDBnZEdocGN5NWpkWEp5Wlc1MFUybGliR2x1Wnp0Y2JpQWdmU0JsYkhObElIdGNiaUFnSUNCemFXSnNhVzVuSUQwZ2JtVjRkRVZzS0hSb2FYTXVhWFJsYlNrN1hHNGdJSDFjYmlBZ2NtVjBkWEp1SUhSaGNtZGxkQ0E5UFQwZ2RHaHBjeTV6YjNWeVkyVWdKaVlnYzJsaWJHbHVaeUE5UFQwZ2RHaHBjeTVwYm1sMGFXRnNVMmxpYkdsdVp6dGNibjA3WEc1Y2JseHVMeThnUkdWamJHRnlZWFJwYjI1elhHNWNibVoxYm1OMGFXOXVJR2R5WVdJb1pTa2dlMXh1SUNCcFppaEVSVllwSUdOdmJuTnZiR1V1Ykc5bktDZG5jbUZpSUdOaGJHeGxaQ3dnWlRvbkxDQmxLVHRjYmx4dUlDQjJZWElnYVhSbGJTQTlJR1V1ZEdGeVoyVjBMRnh1SUNBZ0lDQWdjMjkxY21ObE8xeHVYRzRnSUM4dklHbG1JQ2hwYzBsdWNIVjBLR2wwWlcwcEtTQjdJQzh2SUhObFpTQmhiSE52T2lCbmFYUm9kV0l1WTI5dEwySmxkbUZqY1hWaEwyUnlZV2QxYkdFdmFYTnpkV1Z6THpJd09GeHVJQ0F2THlBZ0lHVXVkR0Z5WjJWMExtWnZZM1Z6S0NrN0lDOHZJR1pwZUdWeklHZHBkR2gxWWk1amIyMHZZbVYyWVdOeGRXRXZaSEpoWjNWc1lTOXBjM04xWlhNdk1UYzJYRzRnSUM4dklDQWdjbVYwZFhKdU8xeHVJQ0F2THlCOVhHNWNiaUFnZDJocGJHVWdLR2RsZEZCaGNtVnVkQ2hwZEdWdEtTQW1KaUFoYVhORGIyNTBZV2x1WlhJb1oyVjBVR0Z5Wlc1MEtHbDBaVzBwTENCcGRHVnRMQ0JsS1NrZ2UxeHVJQ0FnSUdsMFpXMGdQU0JuWlhSUVlYSmxiblFvYVhSbGJTazdJQzh2SUdSeVlXY2dkR0Z5WjJWMElITm9iM1ZzWkNCaVpTQmhJSFJ2Y0NCbGJHVnRaVzUwWEc0Z0lIMWNiaUFnYzI5MWNtTmxJRDBnWjJWMFVHRnlaVzUwS0dsMFpXMHBPMXh1SUNCcFppQW9JWE52ZFhKalpTa2dlMXh1SUNBZ0lISmxkSFZ5Ymp0Y2JpQWdmVnh1SUNCa2NtRm5iMjVUY0dGalpTNWtjbUZuY3k1d2RYTm9LRzVsZHlCRWNtRm5LR1VzSUdsMFpXMHNJSE52ZFhKalpTa3BPMXh1ZlZ4dVhHNW1kVzVqZEdsdmJpQmlhVzVrS0c5aWFpd2diV1YwYUc5a1RtRnRaU2w3WEc0Z0lIWmhjaUJpYVc1a1pXUk9ZVzFsSUQwZ0oySnBibVJsWkNjZ0t5QnRaWFJvYjJST1lXMWxPMXh1SUNCcFppZ2hiMkpxVzJKcGJtUmxaRTVoYldWZEtWeHVJQ0FnSUc5aWFsdGlhVzVrWldST1lXMWxYU0E5SUdaMWJtTjBhVzl1S0NsN1hHNGdJQ0FnSUNCdlltcGJiV1YwYUc5a1RtRnRaVjB1WVhCd2JIa29iMkpxTENCaGNtZDFiV1Z1ZEhNcE8xeHVJQ0FnSUgwN1hHNGdJSEpsZEhWeWJpQnZZbXBiWW1sdVpHVmtUbUZ0WlYwN1hHNTlYRzVjYm1aMWJtTjBhVzl1SUhKbGJXOTJaVTFwY25KdmNrbHRZV2RsSUNodGFYSnliM0lwSUh0Y2JpQWdkbUZ5SUcxcGNuSnZja052Ym5SaGFXNWxjaUE5SUdkbGRGQmhjbVZ1ZENodGFYSnliM0lwTzF4dUlDQmpiR0Z6YzJWekxuSnRLRzFwY25KdmNrTnZiblJoYVc1bGNpd2dKMmQxTFhWdWMyVnNaV04wWVdKc1pTY3BPMXh1SUNCdGFYSnliM0pEYjI1MFlXbHVaWEl1Y21WdGIzWmxRMmhwYkdRb2JXbHljbTl5S1R0Y2JuMWNibHh1Wm5WdVkzUnBiMjRnWm1sdVpFUnliM0JVWVhKblpYUWdLR1ZzWlcxbGJuUkNaV2hwYm1SRGRYSnpiM0lwSUh0Y2JpQWdkbUZ5SUhSaGNtZGxkQ0E5SUdWc1pXMWxiblJDWldocGJtUkRkWEp6YjNJN1hHNGdJSGRvYVd4bElDaDBZWEpuWlhRZ0ppWWdJV2x6UTI5dWRHRnBibVZ5S0hSaGNtZGxkQ2twSUh0Y2JpQWdJQ0IwWVhKblpYUWdQU0JuWlhSUVlYSmxiblFvZEdGeVoyVjBLVHRjYmlBZ2ZWeHVJQ0J5WlhSMWNtNGdkR0Z5WjJWME8xeHVmVnh1WEc1bWRXNWpkR2x2YmlCcGMwTnZiblJoYVc1bGNpaGxiRzBwSUh0Y2JpQWdjbVYwZFhKdUlHUnlZV2R2YmxOd1lXTmxMbU52Ym5SaGFXNWxjbk5NYjI5cmRYQXVhVzVrWlhoUFppaGxiRzBwS3pFN1hHNTlYRzVjYm1aMWJtTjBhVzl1SUdkbGRFbHRiV1ZrYVdGMFpVTm9hV3hrSUNoa2NtOXdWR0Z5WjJWMExDQjBZWEpuWlhRcElIdGNiaUFnZG1GeUlHbHRiV1ZrYVdGMFpTQTlJSFJoY21kbGREdGNiaUFnZDJocGJHVWdLR2x0YldWa2FXRjBaU0FoUFQwZ1pISnZjRlJoY21kbGRDQW1KaUJuWlhSUVlYSmxiblFvYVcxdFpXUnBZWFJsS1NBaFBUMGdaSEp2Y0ZSaGNtZGxkQ2tnZTF4dUlDQWdJR2x0YldWa2FXRjBaU0E5SUdkbGRGQmhjbVZ1ZENocGJXMWxaR2xoZEdVcE8xeHVJQ0I5WEc0Z0lHbG1JQ2hwYlcxbFpHbGhkR1VnUFQwOUlHUnZZMFZzYlNrZ2UxeHVJQ0FnSUhKbGRIVnliaUJ1ZFd4c08xeHVJQ0I5WEc0Z0lISmxkSFZ5YmlCcGJXMWxaR2xoZEdVN1hHNTlYRzVjYm1aMWJtTjBhVzl1SUdkbGRGSmxabVZ5Wlc1alpTQW9aSEp2Y0ZSaGNtZGxkQ3dnZEdGeVoyVjBMQ0I0TENCNUxDQmthWEpsWTNScGIyNHBJSHRjYmlBZ2RtRnlJR2h2Y21sNmIyNTBZV3dnUFNCa2FYSmxZM1JwYjI0Z1BUMDlJQ2RvYjNKcGVtOXVkR0ZzSnp0Y2JpQWdjbVYwZFhKdUlIUmhjbWRsZENBaFBUMGdaSEp2Y0ZSaGNtZGxkQ0EvSUdsdWMybGtaU2dwSURvZ2IzVjBjMmxrWlNncE95QXZMeUJ5WldabGNtVnVZMlZjYmx4dUlDQm1kVzVqZEdsdmJpQnZkWFJ6YVdSbElDZ3BJSHNnTHk4Z2MyeHZkMlZ5TENCaWRYUWdZV0pzWlNCMGJ5Qm1hV2QxY21VZ2IzVjBJR0Z1ZVNCd2IzTnBkR2x2Ymx4dUlDQWdJSFpoY2lCc1pXNGdQU0JrY205d1ZHRnlaMlYwTG1Ob2FXeGtjbVZ1TG14bGJtZDBhQ3hjYmlBZ0lDQWdJQ0FnYVN4Y2JpQWdJQ0FnSUNBZ1pXd3NYRzRnSUNBZ0lDQWdJSEpsWTNRN1hHNWNiaUFnSUNCbWIzSWdLR2tnUFNBd095QnBJRHdnYkdWdU95QnBLeXNwSUh0Y2JpQWdJQ0FnSUdWc0lEMGdaSEp2Y0ZSaGNtZGxkQzVqYUdsc1pISmxibHRwWFR0Y2JpQWdJQ0FnSUhKbFkzUWdQU0JsYkM1blpYUkNiM1Z1WkdsdVowTnNhV1Z1ZEZKbFkzUW9LVHRjYmlBZ0lDQWdJR2xtSUNob2IzSnBlbTl1ZEdGc0lDWW1JQ2h5WldOMExteGxablFnS3lCeVpXTjBMbmRwWkhSb0lDOGdNaWtnUGlCNEtTQjdJSEpsZEhWeWJpQmxiRHNnZlZ4dUlDQWdJQ0FnYVdZZ0tDRm9iM0pwZW05dWRHRnNJQ1ltSUNoeVpXTjBMblJ2Y0NBcklISmxZM1F1YUdWcFoyaDBJQzhnTWlrZ1BpQjVLU0I3SUhKbGRIVnliaUJsYkRzZ2ZWeHVJQ0FnSUgxY2JseHVJQ0FnSUhKbGRIVnliaUJ1ZFd4c08xeHVJQ0I5WEc1Y2JpQWdablZ1WTNScGIyNGdhVzV6YVdSbElDZ3BJSHNnTHk4Z1ptRnpkR1Z5TENCaWRYUWdiMjVzZVNCaGRtRnBiR0ZpYkdVZ2FXWWdaSEp2Y0hCbFpDQnBibk5wWkdVZ1lTQmphR2xzWkNCbGJHVnRaVzUwWEc0Z0lDQWdkbUZ5SUhKbFkzUWdQU0IwWVhKblpYUXVaMlYwUW05MWJtUnBibWREYkdsbGJuUlNaV04wS0NrN1hHNGdJQ0FnYVdZZ0tHaHZjbWw2YjI1MFlXd3BJSHRjYmlBZ0lDQWdJSEpsZEhWeWJpQnlaWE52YkhabEtIZ2dQaUJ5WldOMExteGxablFnS3lCblpYUlNaV04wVjJsa2RHZ29jbVZqZENrZ0x5QXlLVHRjYmlBZ0lDQjlYRzRnSUNBZ2NtVjBkWEp1SUhKbGMyOXNkbVVvZVNBK0lISmxZM1F1ZEc5d0lDc2daMlYwVW1WamRFaGxhV2RvZENoeVpXTjBLU0F2SURJcE8xeHVJQ0I5WEc1Y2JpQWdablZ1WTNScGIyNGdjbVZ6YjJ4MlpTQW9ZV1owWlhJcElIdGNiaUFnSUNCeVpYUjFjbTRnWVdaMFpYSWdQeUJ1WlhoMFJXd29kR0Z5WjJWMEtTQTZJSFJoY21kbGREdGNiaUFnZlZ4dWZWeHVYRzVjYmk4dklHWjFibU4wYVc5dUlIZG9hV05vVFc5MWMyVkNkWFIwYjI0Z0tHVXBJSHRjYmk4dklDQWdMeW9xSUVCdVlXMWxjM0JoWTJVZ1pTNTBiM1ZqYUdWeklDMHRJSEpsYzI5c2RtbHVaeUIzWldKemRHOXliU0IxYm5KbGMyOXNkbVZrSUhaaGNtbGhZbXhsY3lBcUwxeHVMeThnSUNCcFppQW9aUzUwYjNWamFHVnpJQ0U5UFNCMmIybGtJREFwSUhzZ2NtVjBkWEp1SUdVdWRHOTFZMmhsY3k1c1pXNW5kR2c3SUgxY2JpOHZJQ0FnYVdZZ0tHVXVkMmhwWTJnZ0lUMDlJSFp2YVdRZ01DQW1KaUJsTG5kb2FXTm9JQ0U5UFNBd0tTQjdJSEpsZEhWeWJpQmxMbmRvYVdOb095QjlJQzh2SUhObFpTQm5hWFJvZFdJdVkyOXRMMkpsZG1GamNYVmhMMlJ5WVdkMWJHRXZhWE56ZFdWekx6STJNVnh1THk4Z0lDQnBaaUFvWlM1aWRYUjBiMjV6SUNFOVBTQjJiMmxrSURBcElIc2djbVYwZFhKdUlHVXVZblYwZEc5dWN6c2dmVnh1THk4Z0lDQjJZWElnWW5WMGRHOXVJRDBnWlM1aWRYUjBiMjQ3WEc0dkx5QWdJR2xtSUNoaWRYUjBiMjRnSVQwOUlIWnZhV1FnTUNrZ2V5QXZMeUJ6WldVZ1oybDBhSFZpTG1OdmJTOXFjWFZsY25rdmFuRjFaWEo1TDJKc2IySXZPVGxsT0dabU1XSmhZVGRoWlRNME1XVTVOR0ppT0Rsak0yVTRORFUzTUdNM1l6TmhaRGxsWVM5emNtTXZaWFpsYm5RdWFuTWpURFUzTXkxTU5UYzFYRzR2THlBZ0lDQWdjbVYwZFhKdUlHSjFkSFJ2YmlBbUlERWdQeUF4SURvZ1luVjBkRzl1SUNZZ01pQS9JRE1nT2lBb1luVjBkRzl1SUNZZ05DQS9JRElnT2lBd0tUdGNiaTh2SUNBZ2ZWeHVMeThnZlZ4dVhHNW1kVzVqZEdsdmJpQm5aWFJQWm1aelpYUWdLR1ZzS1NCN1hHNGdJSFpoY2lCeVpXTjBJRDBnWld3dVoyVjBRbTkxYm1ScGJtZERiR2xsYm5SU1pXTjBLQ2s3WEc0Z0lISmxkSFZ5YmlCN1hHNGdJQ0FnYkdWbWREb2djbVZqZEM1c1pXWjBJQ3NnWjJWMFUyTnliMnhzS0NkelkzSnZiR3hNWldaMEp5d2dKM0JoWjJWWVQyWm1jMlYwSnlrc1hHNGdJQ0FnZEc5d09pQnlaV04wTG5SdmNDQXJJR2RsZEZOamNtOXNiQ2duYzJOeWIyeHNWRzl3Snl3Z0ozQmhaMlZaVDJabWMyVjBKeWxjYmlBZ2ZUdGNibjFjYmx4dVpuVnVZM1JwYjI0Z1oyVjBVMk55YjJ4c0lDaHpZM0p2Ykd4UWNtOXdMQ0J2Wm1aelpYUlFjbTl3S1NCN1hHNGdJR2xtSUNoMGVYQmxiMllnWjJ4dlltRnNXMjltWm5ObGRGQnliM0JkSUNFOVBTQW5kVzVrWldacGJtVmtKeWtnZTF4dUlDQWdJSEpsZEhWeWJpQm5iRzlpWVd4YmIyWm1jMlYwVUhKdmNGMDdYRzRnSUgxY2JpQWdhV1lnS0dSdlkwVnNiUzVqYkdsbGJuUklaV2xuYUhRcElIdGNiaUFnSUNCeVpYUjFjbTRnWkc5alJXeHRXM05qY205c2JGQnliM0JkTzF4dUlDQjlYRzRnSUhKbGRIVnliaUJrYjJNdVltOWtlVnR6WTNKdmJHeFFjbTl3WFR0Y2JuMWNibHh1Wm5WdVkzUnBiMjRnWjJWMFJXeGxiV1Z1ZEVKbGFHbHVaRkJ2YVc1MElDaHdiMmx1ZEN3Z2VDd2dlU2tnZTF4dUlDQjJZWElnY0NBOUlIQnZhVzUwSUh4OElIdDlMRnh1SUNBZ0lDQWdjM1JoZEdVZ1BTQndMbU5zWVhOelRtRnRaU3hjYmlBZ0lDQWdJR1ZzTzF4dUlDQndMbU5zWVhOelRtRnRaU0FyUFNBbklHZDFMV2hwWkdVbk8xeHVJQ0JsYkNBOUlHUnZZeTVsYkdWdFpXNTBSbkp2YlZCdmFXNTBLSGdzSUhrcE8xeHVJQ0J3TG1Oc1lYTnpUbUZ0WlNBOUlITjBZWFJsTzF4dUlDQnlaWFIxY200Z1pXdzdYRzU5WEc1Y2JtWjFibU4wYVc5dUlHNWxkbVZ5SUNncElIc2djbVYwZFhKdUlHWmhiSE5sT3lCOVhHNW1kVzVqZEdsdmJpQmhiSGRoZVhNZ0tDa2dleUJ5WlhSMWNtNGdkSEoxWlRzZ2ZWeHVablZ1WTNScGIyNGdaMlYwVW1WamRGZHBaSFJvSUNoeVpXTjBLU0I3SUhKbGRIVnliaUJ5WldOMExuZHBaSFJvSUh4OElDaHlaV04wTG5KcFoyaDBJQzBnY21WamRDNXNaV1owS1RzZ2ZWeHVablZ1WTNScGIyNGdaMlYwVW1WamRFaGxhV2RvZENBb2NtVmpkQ2tnZXlCeVpYUjFjbTRnY21WamRDNW9aV2xuYUhRZ2ZId2dLSEpsWTNRdVltOTBkRzl0SUMwZ2NtVmpkQzUwYjNBcE95QjlYRzVtZFc1amRHbHZiaUJuWlhSUVlYSmxiblFnS0dWc0tTQjdJSEpsZEhWeWJpQmxiQzV3WVhKbGJuUk9iMlJsSUQwOVBTQmtiMk1nUHlCdWRXeHNJRG9nWld3dWNHRnlaVzUwVG05a1pUc2dmVnh1Wm5WdVkzUnBiMjRnWjJWMFEyOXVkR0ZwYm1WeUlDaGxiQ2tnZXlCeVpYUjFjbTRnWkhKaFoyOXVVM0JoWTJVdVkyOXVkR0ZwYm1WeWMxdGtjbUZuYjI1VGNHRmpaUzVqYjI1MFlXbHVaWEp6VEc5dmEzVndMbWx1WkdWNFQyWW9aV3dwWFNCOVhHNW1kVzVqZEdsdmJpQnBjMGx1Y0hWMElDaGxiQ2tnZXlCeVpYUjFjbTRnWld3dWRHRm5UbUZ0WlNBOVBUMGdKMGxPVUZWVUp5QjhmQ0JsYkM1MFlXZE9ZVzFsSUQwOVBTQW5WRVZZVkVGU1JVRW5JSHg4SUdWc0xuUmhaMDVoYldVZ1BUMDlJQ2RUUlV4RlExUW5JSHg4SUdselJXUnBkR0ZpYkdVb1pXd3BPeUI5WEc1bWRXNWpkR2x2YmlCcGMwVmthWFJoWW14bElDaGxiQ2tnZTF4dUlDQXZLaW9nUUc1aGJXVnpjR0ZqWlNCbGJDNWpiMjUwWlc1MFJXUnBkR0ZpYkdVZ0xTMGdjbVZ6YjJ4MmFXNW5JSGRsWW5OMGIzSnRJSFZ1Y21WemIyeDJaV1FnZG1GeWFXRmliR1Z6SUNvdlhHNGdJR2xtSUNnaFpXd3BJSHNnY21WMGRYSnVJR1poYkhObE95QjlJQzh2SUc1dklIQmhjbVZ1ZEhNZ2QyVnlaU0JsWkdsMFlXSnNaVnh1SUNCcFppQW9aV3d1WTI5dWRHVnVkRVZrYVhSaFlteGxJRDA5UFNBblptRnNjMlVuS1NCN0lISmxkSFZ5YmlCbVlXeHpaVHNnZlNBdkx5QnpkRzl3SUhSb1pTQnNiMjlyZFhCY2JpQWdhV1lnS0dWc0xtTnZiblJsYm5SRlpHbDBZV0pzWlNBOVBUMGdKM1J5ZFdVbktTQjdJSEpsZEhWeWJpQjBjblZsT3lCOUlDOHZJR1p2ZFc1a0lHRWdZMjl1ZEdWdWRFVmthWFJoWW14bElHVnNaVzFsYm5RZ2FXNGdkR2hsSUdOb1lXbHVYRzRnSUhKbGRIVnliaUJwYzBWa2FYUmhZbXhsS0dkbGRGQmhjbVZ1ZENobGJDa3BPeUF2THlCamIyNTBaVzUwUldScGRHRmliR1VnYVhNZ2MyVjBJSFJ2SUNkcGJtaGxjbWwwSjF4dWZWeHVYRzVtZFc1amRHbHZiaUJ1WlhoMFJXd2dLR1ZzS1NCN1hHNGdJSEpsZEhWeWJpQmxiQzV1WlhoMFJXeGxiV1Z1ZEZOcFlteHBibWNnZkh3Z2JXRnVkV0ZzYkhrb0tUdGNiaUFnWm5WdVkzUnBiMjRnYldGdWRXRnNiSGtnS0NrZ2UxeHVJQ0FnSUhaaGNpQnphV0pzYVc1bklEMGdaV3c3WEc0Z0lDQWdaRzhnZTF4dUlDQWdJQ0FnYzJsaWJHbHVaeUE5SUhOcFlteHBibWN1Ym1WNGRGTnBZbXhwYm1jN1hHNGdJQ0FnZlNCM2FHbHNaU0FvYzJsaWJHbHVaeUFtSmlCemFXSnNhVzVuTG01dlpHVlVlWEJsSUNFOVBTQXhLVHRjYmlBZ0lDQnlaWFIxY200Z2MybGliR2x1Wnp0Y2JpQWdmVnh1ZlZ4dVhHNW1kVzVqZEdsdmJpQm5aWFJGZG1WdWRFaHZjM1FnS0dVcElIdGNiaUFnTHk4Z2IyNGdkRzkxWTJobGJtUWdaWFpsYm5Rc0lIZGxJR2hoZG1VZ2RHOGdkWE5sSUdCbExtTm9ZVzVuWldSVWIzVmphR1Z6WUZ4dUlDQXZMeUJ6WldVZ2FIUjBjRG92TDNOMFlXTnJiM1psY21ac2IzY3VZMjl0TDNGMVpYTjBhVzl1Y3k4M01Ua3lOVFl6TDNSdmRXTm9aVzVrTFdWMlpXNTBMWEJ5YjNCbGNuUnBaWE5jYmlBZ0x5OGdjMlZsSUdkcGRHaDFZaTVqYjIwdlltVjJZV054ZFdFdlpISmhaM1ZzWVM5cGMzTjFaWE12TXpSY2JpQWdMeW9xSUVCdVlXMWxjM0JoWTJVZ1pTNTBZWEpuWlhSVWIzVmphR1Z6SUMwdElISmxjMjlzZG1sdVp5QjNaV0p6ZEc5eWJTQjFibkpsYzI5c2RtVmtJSFpoY21saFlteGxjeUFxTDF4dUlDQXZLaW9nUUc1aGJXVnpjR0ZqWlNCbExtTm9ZVzVuWldSVWIzVmphR1Z6SUMwdElISmxjMjlzZG1sdVp5QjNaV0p6ZEc5eWJTQjFibkpsYzI5c2RtVmtJSFpoY21saFlteGxjeUFxTDF4dUlDQnBaaUFvWlM1MFlYSm5aWFJVYjNWamFHVnpJQ1ltSUdVdWRHRnlaMlYwVkc5MVkyaGxjeTVzWlc1bmRHZ3BJSHRjYmlBZ0lDQnlaWFIxY200Z1pTNTBZWEpuWlhSVWIzVmphR1Z6V3pCZE8xeHVJQ0I5WEc0Z0lHbG1JQ2hsTG1Ob1lXNW5aV1JVYjNWamFHVnpJQ1ltSUdVdVkyaGhibWRsWkZSdmRXTm9aWE11YkdWdVozUm9LU0I3WEc0Z0lDQWdjbVYwZFhKdUlHVXVZMmhoYm1kbFpGUnZkV05vWlhOYk1GMDdYRzRnSUgxY2JpQWdjbVYwZFhKdUlHVTdYRzU5WEc1Y2JtWjFibU4wYVc5dUlHZGxkRU52YjNKa0lDaGpiMjl5WkN3Z1pTa2dlMXh1SUNCMllYSWdhRzl6ZENBOUlHZGxkRVYyWlc1MFNHOXpkQ2hsS1R0Y2JpQWdkbUZ5SUcxcGMzTk5ZWEFnUFNCN1hHNGdJQ0FnY0dGblpWZzZJQ2RqYkdsbGJuUllKeXdnTHk4Z1NVVTRYRzRnSUNBZ2NHRm5aVms2SUNkamJHbGxiblJaSnlBdkx5QkpSVGhjYmlBZ2ZUdGNiaUFnYVdZZ0tHTnZiM0prSUdsdUlHMXBjM05OWVhBZ0ppWWdJU2hqYjI5eVpDQnBiaUJvYjNOMEtTQW1KaUJ0YVhOelRXRndXMk52YjNKa1hTQnBiaUJvYjNOMEtTQjdYRzRnSUNBZ1kyOXZjbVFnUFNCdGFYTnpUV0Z3VzJOdmIzSmtYVHRjYmlBZ2ZWeHVJQ0J5WlhSMWNtNGdhRzl6ZEZ0amIyOXlaRjA3WEc1OVhHNWNibTF2WkhWc1pTNWxlSEJ2Y25SeklEMGdSSEpoWjI5dU8xeHVkMmx1Wkc5M0xrUnlZV2R2YmlBOUlFUnlZV2R2Ymp0Y2JpSXNJbHh1ZG1GeUlFNWhkR2wyWlVOMWMzUnZiVVYyWlc1MElEMGdaMnh2WW1Gc0xrTjFjM1J2YlVWMlpXNTBPMXh1WEc1bWRXNWpkR2x2YmlCMWMyVk9ZWFJwZG1VZ0tDa2dlMXh1SUNCMGNua2dlMXh1SUNBZ0lIWmhjaUJ3SUQwZ2JtVjNJRTVoZEdsMlpVTjFjM1J2YlVWMlpXNTBLQ2RqWVhRbkxDQjdJR1JsZEdGcGJEb2dleUJtYjI4NklDZGlZWEluSUgwZ2ZTazdYRzRnSUNBZ2NtVjBkWEp1SUNBblkyRjBKeUE5UFQwZ2NDNTBlWEJsSUNZbUlDZGlZWEluSUQwOVBTQndMbVJsZEdGcGJDNW1iMjg3WEc0Z0lIMGdZMkYwWTJnZ0tHVXBJSHRjYmlBZ2ZWeHVJQ0J5WlhSMWNtNGdabUZzYzJVN1hHNTlYRzVjYmk4cUtseHVJQ29nUTNKdmMzTXRZbkp2ZDNObGNpQmdRM1Z6ZEc5dFJYWmxiblJnSUdOdmJuTjBjblZqZEc5eUxseHVJQ3BjYmlBcUlHaDBkSEJ6T2k4dlpHVjJaV3h2Y0dWeUxtMXZlbWxzYkdFdWIzSm5MMlZ1TFZWVEwyUnZZM012VjJWaUwwRlFTUzlEZFhOMGIyMUZkbVZ1ZEM1RGRYTjBiMjFGZG1WdWRGeHVJQ3BjYmlBcUlFQndkV0pzYVdOY2JpQXFMMXh1WEc1dGIyUjFiR1V1Wlhod2IzSjBjeUE5SUhWelpVNWhkR2wyWlNncElEOGdUbUYwYVhabFEzVnpkRzl0UlhabGJuUWdPbHh1WEc0dkx5QkpSU0ErUFNBNVhHNG5ablZ1WTNScGIyNG5JRDA5UFNCMGVYQmxiMllnWkc5amRXMWxiblF1WTNKbFlYUmxSWFpsYm5RZ1B5Qm1kVzVqZEdsdmJpQkRkWE4wYjIxRmRtVnVkQ0FvZEhsd1pTd2djR0Z5WVcxektTQjdYRzRnSUhaaGNpQmxJRDBnWkc5amRXMWxiblF1WTNKbFlYUmxSWFpsYm5Rb0owTjFjM1J2YlVWMlpXNTBKeWs3WEc0Z0lHbG1JQ2h3WVhKaGJYTXBJSHRjYmlBZ0lDQmxMbWx1YVhSRGRYTjBiMjFGZG1WdWRDaDBlWEJsTENCd1lYSmhiWE11WW5WaVlteGxjeXdnY0dGeVlXMXpMbU5oYm1ObGJHRmliR1VzSUhCaGNtRnRjeTVrWlhSaGFXd3BPMXh1SUNCOUlHVnNjMlVnZTF4dUlDQWdJR1V1YVc1cGRFTjFjM1J2YlVWMlpXNTBLSFI1Y0dVc0lHWmhiSE5sTENCbVlXeHpaU3dnZG05cFpDQXdLVHRjYmlBZ2ZWeHVJQ0J5WlhSMWNtNGdaVHRjYm4wZ09seHVYRzR2THlCSlJTQThQU0E0WEc1bWRXNWpkR2x2YmlCRGRYTjBiMjFGZG1WdWRDQW9kSGx3WlN3Z2NHRnlZVzF6S1NCN1hHNGdJSFpoY2lCbElEMGdaRzlqZFcxbGJuUXVZM0psWVhSbFJYWmxiblJQWW1wbFkzUW9LVHRjYmlBZ1pTNTBlWEJsSUQwZ2RIbHdaVHRjYmlBZ2FXWWdLSEJoY21GdGN5a2dlMXh1SUNBZ0lHVXVZblZpWW14bGN5QTlJRUp2YjJ4bFlXNG9jR0Z5WVcxekxtSjFZbUpzWlhNcE8xeHVJQ0FnSUdVdVkyRnVZMlZzWVdKc1pTQTlJRUp2YjJ4bFlXNG9jR0Z5WVcxekxtTmhibU5sYkdGaWJHVXBPMXh1SUNBZ0lHVXVaR1YwWVdsc0lEMGdjR0Z5WVcxekxtUmxkR0ZwYkR0Y2JpQWdmU0JsYkhObElIdGNiaUFnSUNCbExtSjFZbUpzWlhNZ1BTQm1ZV3h6WlR0Y2JpQWdJQ0JsTG1OaGJtTmxiR0ZpYkdVZ1BTQm1ZV3h6WlR0Y2JpQWdJQ0JsTG1SbGRHRnBiQ0E5SUhadmFXUWdNRHRjYmlBZ2ZWeHVJQ0J5WlhSMWNtNGdaVHRjYm4xY2JpSXNJaWQxYzJVZ2MzUnlhV04wSnp0Y2JseHVkbUZ5SUdOMWMzUnZiVVYyWlc1MElEMGdjbVZ4ZFdseVpTZ25ZM1Z6ZEc5dExXVjJaVzUwSnlrN1hHNTJZWElnWlhabGJuUnRZWEFnUFNCeVpYRjFhWEpsS0NjdUwyVjJaVzUwYldGd0p5azdYRzUyWVhJZ1pHOWpJRDBnWjJ4dlltRnNMbVJ2WTNWdFpXNTBPMXh1ZG1GeUlHRmtaRVYyWlc1MElEMGdZV1JrUlhabGJuUkZZWE41TzF4dWRtRnlJSEpsYlc5MlpVVjJaVzUwSUQwZ2NtVnRiM1psUlhabGJuUkZZWE41TzF4dWRtRnlJR2hoY21SRFlXTm9aU0E5SUZ0ZE8xeHVYRzVwWmlBb0lXZHNiMkpoYkM1aFpHUkZkbVZ1ZEV4cGMzUmxibVZ5S1NCN1hHNGdJR0ZrWkVWMlpXNTBJRDBnWVdSa1JYWmxiblJJWVhKa08xeHVJQ0J5WlcxdmRtVkZkbVZ1ZENBOUlISmxiVzkyWlVWMlpXNTBTR0Z5WkR0Y2JuMWNibHh1Ylc5a2RXeGxMbVY0Y0c5eWRITWdQU0I3WEc0Z0lHRmtaRG9nWVdSa1JYWmxiblFzWEc0Z0lISmxiVzkyWlRvZ2NtVnRiM1psUlhabGJuUXNYRzRnSUdaaFluSnBZMkYwWlRvZ1ptRmljbWxqWVhSbFJYWmxiblJjYm4wN1hHNWNibVoxYm1OMGFXOXVJR0ZrWkVWMlpXNTBSV0Z6ZVNBb1pXd3NJSFI1Y0dVc0lHWnVMQ0JqWVhCMGRYSnBibWNwSUh0Y2JpQWdjbVYwZFhKdUlHVnNMbUZrWkVWMlpXNTBUR2x6ZEdWdVpYSW9kSGx3WlN3Z1ptNHNJR05oY0hSMWNtbHVaeWs3WEc1OVhHNWNibVoxYm1OMGFXOXVJR0ZrWkVWMlpXNTBTR0Z5WkNBb1pXd3NJSFI1Y0dVc0lHWnVLU0I3WEc0Z0lISmxkSFZ5YmlCbGJDNWhkSFJoWTJoRmRtVnVkQ2duYjI0bklDc2dkSGx3WlN3Z2QzSmhjQ2hsYkN3Z2RIbHdaU3dnWm00cEtUdGNibjFjYmx4dVpuVnVZM1JwYjI0Z2NtVnRiM1psUlhabGJuUkZZWE41SUNobGJDd2dkSGx3WlN3Z1ptNHNJR05oY0hSMWNtbHVaeWtnZTF4dUlDQnlaWFIxY200Z1pXd3VjbVZ0YjNabFJYWmxiblJNYVhOMFpXNWxjaWgwZVhCbExDQm1iaXdnWTJGd2RIVnlhVzVuS1R0Y2JuMWNibHh1Wm5WdVkzUnBiMjRnY21WdGIzWmxSWFpsYm5SSVlYSmtJQ2hsYkN3Z2RIbHdaU3dnWm00cElIdGNiaUFnZG1GeUlHeHBjM1JsYm1WeUlEMGdkVzUzY21Gd0tHVnNMQ0IwZVhCbExDQm1iaWs3WEc0Z0lHbG1JQ2hzYVhOMFpXNWxjaWtnZTF4dUlDQWdJSEpsZEhWeWJpQmxiQzVrWlhSaFkyaEZkbVZ1ZENnbmIyNG5JQ3NnZEhsd1pTd2diR2x6ZEdWdVpYSXBPMXh1SUNCOVhHNTlYRzVjYm1aMWJtTjBhVzl1SUdaaFluSnBZMkYwWlVWMlpXNTBJQ2hsYkN3Z2RIbHdaU3dnYlc5a1pXd3BJSHRjYmlBZ2RtRnlJR1VnUFNCbGRtVnVkRzFoY0M1cGJtUmxlRTltS0hSNWNHVXBJRDA5UFNBdE1TQS9JRzFoYTJWRGRYTjBiMjFGZG1WdWRDZ3BJRG9nYldGclpVTnNZWE56YVdORmRtVnVkQ2dwTzF4dUlDQnBaaUFvWld3dVpHbHpjR0YwWTJoRmRtVnVkQ2tnZTF4dUlDQWdJR1ZzTG1ScGMzQmhkR05vUlhabGJuUW9aU2s3WEc0Z0lIMGdaV3h6WlNCN1hHNGdJQ0FnWld3dVptbHlaVVYyWlc1MEtDZHZiaWNnS3lCMGVYQmxMQ0JsS1R0Y2JpQWdmVnh1SUNCbWRXNWpkR2x2YmlCdFlXdGxRMnhoYzNOcFkwVjJaVzUwSUNncElIdGNiaUFnSUNCMllYSWdaVHRjYmlBZ0lDQnBaaUFvWkc5akxtTnlaV0YwWlVWMlpXNTBLU0I3WEc0Z0lDQWdJQ0JsSUQwZ1pHOWpMbU55WldGMFpVVjJaVzUwS0NkRmRtVnVkQ2NwTzF4dUlDQWdJQ0FnWlM1cGJtbDBSWFpsYm5Rb2RIbHdaU3dnZEhKMVpTd2dkSEoxWlNrN1hHNGdJQ0FnZlNCbGJITmxJR2xtSUNoa2IyTXVZM0psWVhSbFJYWmxiblJQWW1wbFkzUXBJSHRjYmlBZ0lDQWdJR1VnUFNCa2IyTXVZM0psWVhSbFJYWmxiblJQWW1wbFkzUW9LVHRjYmlBZ0lDQjlYRzRnSUNBZ2NtVjBkWEp1SUdVN1hHNGdJSDFjYmlBZ1puVnVZM1JwYjI0Z2JXRnJaVU4xYzNSdmJVVjJaVzUwSUNncElIdGNiaUFnSUNCeVpYUjFjbTRnYm1WM0lHTjFjM1J2YlVWMlpXNTBLSFI1Y0dVc0lIc2daR1YwWVdsc09pQnRiMlJsYkNCOUtUdGNiaUFnZlZ4dWZWeHVYRzVtZFc1amRHbHZiaUIzY21Gd2NHVnlSbUZqZEc5eWVTQW9aV3dzSUhSNWNHVXNJR1p1S1NCN1hHNGdJSEpsZEhWeWJpQm1kVzVqZEdsdmJpQjNjbUZ3Y0dWeUlDaHZjbWxuYVc1aGJFVjJaVzUwS1NCN1hHNGdJQ0FnZG1GeUlHVWdQU0J2Y21sbmFXNWhiRVYyWlc1MElIeDhJR2RzYjJKaGJDNWxkbVZ1ZER0Y2JpQWdJQ0JsTG5SaGNtZGxkQ0E5SUdVdWRHRnlaMlYwSUh4OElHVXVjM0pqUld4bGJXVnVkRHRjYmlBZ0lDQmxMbkJ5WlhabGJuUkVaV1poZFd4MElEMGdaUzV3Y21WMlpXNTBSR1ZtWVhWc2RDQjhmQ0JtZFc1amRHbHZiaUJ3Y21WMlpXNTBSR1ZtWVhWc2RDQW9LU0I3SUdVdWNtVjBkWEp1Vm1Gc2RXVWdQU0JtWVd4elpUc2dmVHRjYmlBZ0lDQmxMbk4wYjNCUWNtOXdZV2RoZEdsdmJpQTlJR1V1YzNSdmNGQnliM0JoWjJGMGFXOXVJSHg4SUdaMWJtTjBhVzl1SUhOMGIzQlFjbTl3WVdkaGRHbHZiaUFvS1NCN0lHVXVZMkZ1WTJWc1FuVmlZbXhsSUQwZ2RISjFaVHNnZlR0Y2JpQWdJQ0JsTG5kb2FXTm9JRDBnWlM1M2FHbGphQ0I4ZkNCbExtdGxlVU52WkdVN1hHNGdJQ0FnWm00dVkyRnNiQ2hsYkN3Z1pTazdYRzRnSUgwN1hHNTlYRzVjYm1aMWJtTjBhVzl1SUhkeVlYQWdLR1ZzTENCMGVYQmxMQ0JtYmlrZ2UxeHVJQ0IyWVhJZ2QzSmhjSEJsY2lBOUlIVnVkM0poY0NobGJDd2dkSGx3WlN3Z1ptNHBJSHg4SUhkeVlYQndaWEpHWVdOMGIzSjVLR1ZzTENCMGVYQmxMQ0JtYmlrN1hHNGdJR2hoY21SRFlXTm9aUzV3ZFhOb0tIdGNiaUFnSUNCM2NtRndjR1Z5T2lCM2NtRndjR1Z5TEZ4dUlDQWdJR1ZzWlcxbGJuUTZJR1ZzTEZ4dUlDQWdJSFI1Y0dVNklIUjVjR1VzWEc0Z0lDQWdabTQ2SUdadVhHNGdJSDBwTzF4dUlDQnlaWFIxY200Z2QzSmhjSEJsY2p0Y2JuMWNibHh1Wm5WdVkzUnBiMjRnZFc1M2NtRndJQ2hsYkN3Z2RIbHdaU3dnWm00cElIdGNiaUFnZG1GeUlHa2dQU0JtYVc1a0tHVnNMQ0IwZVhCbExDQm1iaWs3WEc0Z0lHbG1JQ2hwS1NCN1hHNGdJQ0FnZG1GeUlIZHlZWEJ3WlhJZ1BTQm9ZWEprUTJGamFHVmJhVjB1ZDNKaGNIQmxjanRjYmlBZ0lDQm9ZWEprUTJGamFHVXVjM0JzYVdObEtHa3NJREVwT3lBdkx5Qm1jbVZsSUhWd0lHRWdkR0ZrSUc5bUlHMWxiVzl5ZVZ4dUlDQWdJSEpsZEhWeWJpQjNjbUZ3Y0dWeU8xeHVJQ0I5WEc1OVhHNWNibVoxYm1OMGFXOXVJR1pwYm1RZ0tHVnNMQ0IwZVhCbExDQm1iaWtnZTF4dUlDQjJZWElnYVN3Z2FYUmxiVHRjYmlBZ1ptOXlJQ2hwSUQwZ01Ec2dhU0E4SUdoaGNtUkRZV05vWlM1c1pXNW5kR2c3SUdrckt5a2dlMXh1SUNBZ0lHbDBaVzBnUFNCb1lYSmtRMkZqYUdWYmFWMDdYRzRnSUNBZ2FXWWdLR2wwWlcwdVpXeGxiV1Z1ZENBOVBUMGdaV3dnSmlZZ2FYUmxiUzUwZVhCbElEMDlQU0IwZVhCbElDWW1JR2wwWlcwdVptNGdQVDA5SUdadUtTQjdYRzRnSUNBZ0lDQnlaWFIxY200Z2FUdGNiaUFnSUNCOVhHNGdJSDFjYm4xY2JpSXNJaWQxYzJVZ2MzUnlhV04wSnp0Y2JseHVkbUZ5SUdWMlpXNTBiV0Z3SUQwZ1cxMDdYRzUyWVhJZ1pYWmxiblJ1WVcxbElEMGdKeWM3WEc1MllYSWdjbTl1SUQwZ0wxNXZiaTg3WEc1Y2JtWnZjaUFvWlhabGJuUnVZVzFsSUdsdUlHZHNiMkpoYkNrZ2UxeHVJQ0JwWmlBb2NtOXVMblJsYzNRb1pYWmxiblJ1WVcxbEtTa2dlMXh1SUNBZ0lHVjJaVzUwYldGd0xuQjFjMmdvWlhabGJuUnVZVzFsTG5Oc2FXTmxLRElwS1R0Y2JpQWdmVnh1ZlZ4dVhHNXRiMlIxYkdVdVpYaHdiM0owY3lBOUlHVjJaVzUwYldGd08xeHVJaXdpSjNWelpTQnpkSEpwWTNRbk8xeHVYRzUyWVhJZ1kyRmphR1VnUFNCN2ZUdGNiblpoY2lCemRHRnlkQ0E5SUNjb1B6cGVmRnhjWEZ4ektTYzdYRzUyWVhJZ1pXNWtJRDBnSnlnL09seGNYRnh6ZkNRcEp6dGNibHh1Wm5WdVkzUnBiMjRnYkc5dmEzVndRMnhoYzNNZ0tHTnNZWE56VG1GdFpTa2dlMXh1SUNCMllYSWdZMkZqYUdWa0lEMGdZMkZqYUdWYlkyeGhjM05PWVcxbFhUdGNiaUFnYVdZZ0tHTmhZMmhsWkNrZ2UxeHVJQ0FnSUdOaFkyaGxaQzVzWVhOMFNXNWtaWGdnUFNBd08xeHVJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lHTmhZMmhsVzJOc1lYTnpUbUZ0WlYwZ1BTQmpZV05vWldRZ1BTQnVaWGNnVW1WblJYaHdLSE4wWVhKMElDc2dZMnhoYzNOT1lXMWxJQ3NnWlc1a0xDQW5aeWNwTzF4dUlDQjlYRzRnSUhKbGRIVnliaUJqWVdOb1pXUTdYRzU5WEc1Y2JtWjFibU4wYVc5dUlHRmtaRU5zWVhOeklDaGxiQ3dnWTJ4aGMzTk9ZVzFsS1NCN1hHNGdJSFpoY2lCamRYSnlaVzUwSUQwZ1pXd3VZMnhoYzNOT1lXMWxPMXh1SUNCcFppQW9JV04xY25KbGJuUXViR1Z1WjNSb0tTQjdYRzRnSUNBZ1pXd3VZMnhoYzNOT1lXMWxJRDBnWTJ4aGMzTk9ZVzFsTzF4dUlDQjlJR1ZzYzJVZ2FXWWdLQ0ZzYjI5cmRYQkRiR0Z6Y3loamJHRnpjMDVoYldVcExuUmxjM1FvWTNWeWNtVnVkQ2twSUh0Y2JpQWdJQ0JsYkM1amJHRnpjMDVoYldVZ0t6MGdKeUFuSUNzZ1kyeGhjM05PWVcxbE8xeHVJQ0I5WEc1OVhHNWNibVoxYm1OMGFXOXVJSEp0UTJ4aGMzTWdLR1ZzTENCamJHRnpjMDVoYldVcElIdGNiaUFnWld3dVkyeGhjM05PWVcxbElEMGdaV3d1WTJ4aGMzTk9ZVzFsTG5KbGNHeGhZMlVvYkc5dmEzVndRMnhoYzNNb1kyeGhjM05PWVcxbEtTd2dKeUFuS1M1MGNtbHRLQ2s3WEc1OVhHNWNibTF2WkhWc1pTNWxlSEJ2Y25SeklEMGdlMXh1SUNCaFpHUTZJR0ZrWkVOc1lYTnpMRnh1SUNCeWJUb2djbTFEYkdGemMxeHVmVHRjYmlJc0lsd2lkWE5sSUhOMGNtbGpkRndpTzF4dWRtRnlJR055YjNOemRtVnVkQ0E5SUhKbGNYVnBjbVVvSjJOeWIzTnpkbVZ1ZENjcE8xeHVYRzV0YjJSMWJHVXVaWGh3YjNKMGN5QTlJR1oxYm1OMGFXOXVJSFJ2ZFdOb2VTQW9aV3dzSUc5d0xDQjBlWEJsTENCbWJpa2dlMXh1SUNBZ0lIWmhjaUIwYjNWamFDQTlJSHRjYmlBZ0lDQWdJQ0FnYlc5MWMyVjFjRG9nSjNSdmRXTm9aVzVrSnl4Y2JpQWdJQ0FnSUNBZ2JXOTFjMlZrYjNkdU9pQW5kRzkxWTJoemRHRnlkQ2NzWEc0Z0lDQWdJQ0FnSUcxdmRYTmxiVzkyWlRvZ0ozUnZkV05vYlc5MlpTZGNiaUFnSUNCOU8xeHVJQ0FnSUhaaGNpQndiMmx1ZEdWeWN5QTlJSHRjYmlBZ0lDQWdJQ0FnYlc5MWMyVjFjRG9nSjNCdmFXNTBaWEoxY0Njc1hHNGdJQ0FnSUNBZ0lHMXZkWE5sWkc5M2Jqb2dKM0J2YVc1MFpYSmtiM2R1Snl4Y2JpQWdJQ0FnSUNBZ2JXOTFjMlZ0YjNabE9pQW5jRzlwYm5SbGNtMXZkbVVuWEc0Z0lDQWdmVHRjYmlBZ0lDQjJZWElnYldsamNtOXpiMlowSUQwZ2UxeHVJQ0FnSUNBZ0lDQnRiM1Z6WlhWd09pQW5UVk5RYjJsdWRHVnlWWEFuTEZ4dUlDQWdJQ0FnSUNCdGIzVnpaV1J2ZDI0NklDZE5VMUJ2YVc1MFpYSkViM2R1Snl4Y2JpQWdJQ0FnSUNBZ2JXOTFjMlZ0YjNabE9pQW5UVk5RYjJsdWRHVnlUVzkyWlNkY2JpQWdJQ0I5TzF4dVhHNGdJQ0FnTHlvcUlFQnVZVzFsYzNCaFkyVWdaMnh2WW1Gc0xtNWhkbWxuWVhSdmNpNXdiMmx1ZEdWeVJXNWhZbXhsWkNBdExTQnlaWE52YkhacGJtY2dkMlZpYzNSdmNtMGdkVzV5WlhOdmJIWmxaQ0IyWVhKcFlXSnNaWE1nS2k5Y2JpQWdJQ0F2S2lvZ1FHNWhiV1Z6Y0dGalpTQm5iRzlpWVd3dWJtRjJhV2RoZEc5eUxtMXpVRzlwYm5SbGNrVnVZV0pzWldRZ0xTMGdjbVZ6YjJ4MmFXNW5JSGRsWW5OMGIzSnRJSFZ1Y21WemIyeDJaV1FnZG1GeWFXRmliR1Z6SUNvdlhHNGdJQ0FnYVdZZ0tHZHNiMkpoYkM1dVlYWnBaMkYwYjNJdWNHOXBiblJsY2tWdVlXSnNaV1FwSUh0Y2JpQWdJQ0FnSUNBZ1kzSnZjM04yWlc1MFcyOXdYU2hsYkN3Z2NHOXBiblJsY25OYmRIbHdaVjBnZkh3Z2RIbHdaU3dnWm00cE8xeHVJQ0FnSUgwZ1pXeHpaU0JwWmlBb1oyeHZZbUZzTG01aGRtbG5ZWFJ2Y2k1dGMxQnZhVzUwWlhKRmJtRmliR1ZrS1NCN1hHNGdJQ0FnSUNBZ0lHTnliM056ZG1WdWRGdHZjRjBvWld3c0lHMXBZM0p2YzI5bWRGdDBlWEJsWFNCOGZDQjBlWEJsTENCbWJpazdYRzRnSUNBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0FnSUNBZ1kzSnZjM04yWlc1MFcyOXdYU2hsYkN3Z2RHOTFZMmhiZEhsd1pWMGdmSHdnZEhsd1pTd2dabTRwTzF4dUlDQWdJQ0FnSUNCamNtOXpjM1psYm5SYmIzQmRLR1ZzTENCMGVYQmxMQ0JtYmlrN1hHNGdJQ0FnZlZ4dWZUc2lYWDA9XG4iXSwiZmlsZSI6InBsdWdpbnMvZHJhZ29uL2RyYWdvbi5qcyJ9
