/* perfect-scrollbar v0.6.16 */
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var ps = require('../main');
var psInstances = require('../plugin/instances');

function mountJQuery(jQuery) {
  jQuery.fn.perfectScrollbar = function (settingOrCommand) {
    return this.each(function () {
      if (typeof settingOrCommand === 'object' ||
          typeof settingOrCommand === 'undefined') {
        // If it's an object or none, initialize.
        var settings = settingOrCommand;

        if (!psInstances.get(this)) {
          ps.initialize(this, settings);
        }
      } else {
        // Unless, it may be a command.
        var command = settingOrCommand;

        if (command === 'update') {
          ps.update(this);
        } else if (command === 'destroy') {
          ps.destroy(this);
        }
      }
    });
  };
}

if (typeof define === 'function' && define.amd) {
  // AMD. Register as an anonymous module.
  define(['jquery'], mountJQuery);
} else {
  var jq = window.jQuery ? window.jQuery : window.$;
  if (typeof jq !== 'undefined') {
    mountJQuery(jq);
  }
}

module.exports = mountJQuery;

},{"../main":7,"../plugin/instances":18}],2:[function(require,module,exports){
'use strict';

function oldAdd(element, className) {
  var classes = element.className.split(' ');
  if (classes.indexOf(className) < 0) {
    classes.push(className);
  }
  element.className = classes.join(' ');
}

function oldRemove(element, className) {
  var classes = element.className.split(' ');
  var idx = classes.indexOf(className);
  if (idx >= 0) {
    classes.splice(idx, 1);
  }
  element.className = classes.join(' ');
}

exports.add = function (element, className) {
  if (element.classList) {
    element.classList.add(className);
  } else {
    oldAdd(element, className);
  }
};

exports.remove = function (element, className) {
  if (element.classList) {
    element.classList.remove(className);
  } else {
    oldRemove(element, className);
  }
};

exports.list = function (element) {
  if (element.classList) {
    return Array.prototype.slice.apply(element.classList);
  } else {
    return element.className.split(' ');
  }
};

},{}],3:[function(require,module,exports){
'use strict';

var DOM = {};

DOM.e = function (tagName, className) {
  var element = document.createElement(tagName);
  element.className = className;
  return element;
};

DOM.appendTo = function (child, parent) {
  parent.appendChild(child);
  return child;
};

function cssGet(element, styleName) {
  return window.getComputedStyle(element)[styleName];
}

function cssSet(element, styleName, styleValue) {
  if (typeof styleValue === 'number') {
    styleValue = styleValue.toString() + 'px';
  }
  element.style[styleName] = styleValue;
  return element;
}

function cssMultiSet(element, obj) {
  for (var key in obj) {
    var val = obj[key];
    if (typeof val === 'number') {
      val = val.toString() + 'px';
    }
    element.style[key] = val;
  }
  return element;
}

DOM.css = function (element, styleNameOrObject, styleValue) {
  if (typeof styleNameOrObject === 'object') {
    // multiple set with object
    return cssMultiSet(element, styleNameOrObject);
  } else {
    if (typeof styleValue === 'undefined') {
      return cssGet(element, styleNameOrObject);
    } else {
      return cssSet(element, styleNameOrObject, styleValue);
    }
  }
};

DOM.matches = function (element, query) {
  if (typeof element.matches !== 'undefined') {
    return element.matches(query);
  } else {
    if (typeof element.matchesSelector !== 'undefined') {
      return element.matchesSelector(query);
    } else if (typeof element.webkitMatchesSelector !== 'undefined') {
      return element.webkitMatchesSelector(query);
    } else if (typeof element.mozMatchesSelector !== 'undefined') {
      return element.mozMatchesSelector(query);
    } else if (typeof element.msMatchesSelector !== 'undefined') {
      return element.msMatchesSelector(query);
    }
  }
};

DOM.remove = function (element) {
  if (typeof element.remove !== 'undefined') {
    element.remove();
  } else {
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }
};

DOM.queryChildren = function (element, selector) {
  return Array.prototype.filter.call(element.childNodes, function (child) {
    return DOM.matches(child, selector);
  });
};

module.exports = DOM;

},{}],4:[function(require,module,exports){
'use strict';

var EventElement = function (element) {
  this.element = element;
  this.events = {};
};

EventElement.prototype.bind = function (eventName, handler) {
  if (typeof this.events[eventName] === 'undefined') {
    this.events[eventName] = [];
  }
  this.events[eventName].push(handler);
  this.element.addEventListener(eventName, handler, false);
};

EventElement.prototype.unbind = function (eventName, handler) {
  var isHandlerProvided = (typeof handler !== 'undefined');
  this.events[eventName] = this.events[eventName].filter(function (hdlr) {
    if (isHandlerProvided && hdlr !== handler) {
      return true;
    }
    this.element.removeEventListener(eventName, hdlr, false);
    return false;
  }, this);
};

EventElement.prototype.unbindAll = function () {
  for (var name in this.events) {
    this.unbind(name);
  }
};

var EventManager = function () {
  this.eventElements = [];
};

EventManager.prototype.eventElement = function (element) {
  var ee = this.eventElements.filter(function (eventElement) {
    return eventElement.element === element;
  })[0];
  if (typeof ee === 'undefined') {
    ee = new EventElement(element);
    this.eventElements.push(ee);
  }
  return ee;
};

EventManager.prototype.bind = function (element, eventName, handler) {
  this.eventElement(element).bind(eventName, handler);
};

EventManager.prototype.unbind = function (element, eventName, handler) {
  this.eventElement(element).unbind(eventName, handler);
};

EventManager.prototype.unbindAll = function () {
  for (var i = 0; i < this.eventElements.length; i++) {
    this.eventElements[i].unbindAll();
  }
};

EventManager.prototype.once = function (element, eventName, handler) {
  var ee = this.eventElement(element);
  var onceHandler = function (e) {
    ee.unbind(eventName, onceHandler);
    handler(e);
  };
  ee.bind(eventName, onceHandler);
};

module.exports = EventManager;

},{}],5:[function(require,module,exports){
'use strict';

module.exports = (function () {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1);
  }
  return function () {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
           s4() + '-' + s4() + s4() + s4();
  };
})();

},{}],6:[function(require,module,exports){
'use strict';

var cls = require('./class');
var dom = require('./dom');

var toInt = exports.toInt = function (x) {
  return parseInt(x, 10) || 0;
};

var clone = exports.clone = function (obj) {
  if (!obj) {
    return null;
  } else if (obj.constructor === Array) {
    return obj.map(clone);
  } else if (typeof obj === 'object') {
    var result = {};
    for (var key in obj) {
      result[key] = clone(obj[key]);
    }
    return result;
  } else {
    return obj;
  }
};

exports.extend = function (original, source) {
  var result = clone(original);
  for (var key in source) {
    result[key] = clone(source[key]);
  }
  return result;
};

exports.isEditable = function (el) {
  return dom.matches(el, "input,[contenteditable]") ||
         dom.matches(el, "select,[contenteditable]") ||
         dom.matches(el, "textarea,[contenteditable]") ||
         dom.matches(el, "button,[contenteditable]");
};

exports.removePsClasses = function (element) {
  var clsList = cls.list(element);
  for (var i = 0; i < clsList.length; i++) {
    var className = clsList[i];
    if (className.indexOf('ps-') === 0) {
      cls.remove(element, className);
    }
  }
};

exports.outerWidth = function (element) {
  return toInt(dom.css(element, 'width')) +
         toInt(dom.css(element, 'paddingLeft')) +
         toInt(dom.css(element, 'paddingRight')) +
         toInt(dom.css(element, 'borderLeftWidth')) +
         toInt(dom.css(element, 'borderRightWidth'));
};

exports.startScrolling = function (element, axis) {
  cls.add(element, 'ps-in-scrolling');
  if (typeof axis !== 'undefined') {
    cls.add(element, 'ps-' + axis);
  } else {
    cls.add(element, 'ps-x');
    cls.add(element, 'ps-y');
  }
};

exports.stopScrolling = function (element, axis) {
  cls.remove(element, 'ps-in-scrolling');
  if (typeof axis !== 'undefined') {
    cls.remove(element, 'ps-' + axis);
  } else {
    cls.remove(element, 'ps-x');
    cls.remove(element, 'ps-y');
  }
};

exports.env = {
  isWebKit: 'WebkitAppearance' in document.documentElement.style,
  supportsTouch: (('ontouchstart' in window) || window.DocumentTouch && document instanceof window.DocumentTouch),
  supportsIePointer: window.navigator.msMaxTouchPoints !== null
};

},{"./class":2,"./dom":3}],7:[function(require,module,exports){
'use strict';

var destroy = require('./plugin/destroy');
var initialize = require('./plugin/initialize');
var update = require('./plugin/update');

module.exports = {
  initialize: initialize,
  update: update,
  destroy: destroy
};

},{"./plugin/destroy":9,"./plugin/initialize":17,"./plugin/update":21}],8:[function(require,module,exports){
'use strict';

module.exports = {
  handlers: ['click-rail', 'drag-scrollbar', 'keyboard', 'wheel', 'touch'],
  maxScrollbarLength: null,
  minScrollbarLength: null,
  scrollXMarginOffset: 0,
  scrollYMarginOffset: 0,
  suppressScrollX: false,
  suppressScrollY: false,
  swipePropagation: true,
  useBothWheelAxes: false,
  wheelPropagation: false,
  wheelSpeed: 1,
  theme: 'default'
};

},{}],9:[function(require,module,exports){
'use strict';

var _ = require('../lib/helper');
var dom = require('../lib/dom');
var instances = require('./instances');

module.exports = function (element) {
  var i = instances.get(element);

  if (!i) {
    return;
  }

  i.event.unbindAll();
  dom.remove(i.scrollbarX);
  dom.remove(i.scrollbarY);
  dom.remove(i.scrollbarXRail);
  dom.remove(i.scrollbarYRail);
  _.removePsClasses(element);

  instances.remove(element);
};

},{"../lib/dom":3,"../lib/helper":6,"./instances":18}],10:[function(require,module,exports){
'use strict';

var instances = require('../instances');
var updateGeometry = require('../update-geometry');
var updateScroll = require('../update-scroll');

function bindClickRailHandler(element, i) {
  function pageOffset(el) {
    return el.getBoundingClientRect();
  }
  var stopPropagation = function (e) { e.stopPropagation(); };

  i.event.bind(i.scrollbarY, 'click', stopPropagation);
  i.event.bind(i.scrollbarYRail, 'click', function (e) {
    var positionTop = e.pageY - window.pageYOffset - pageOffset(i.scrollbarYRail).top;
    var direction = positionTop > i.scrollbarYTop ? 1 : -1;

    updateScroll(element, 'top', element.scrollTop + direction * i.containerHeight);
    updateGeometry(element);

    e.stopPropagation();
  });

  i.event.bind(i.scrollbarX, 'click', stopPropagation);
  i.event.bind(i.scrollbarXRail, 'click', function (e) {
    var positionLeft = e.pageX - window.pageXOffset - pageOffset(i.scrollbarXRail).left;
    var direction = positionLeft > i.scrollbarXLeft ? 1 : -1;

    updateScroll(element, 'left', element.scrollLeft + direction * i.containerWidth);
    updateGeometry(element);

    e.stopPropagation();
  });
}

module.exports = function (element) {
  var i = instances.get(element);
  bindClickRailHandler(element, i);
};

},{"../instances":18,"../update-geometry":19,"../update-scroll":20}],11:[function(require,module,exports){
'use strict';

var _ = require('../../lib/helper');
var dom = require('../../lib/dom');
var instances = require('../instances');
var updateGeometry = require('../update-geometry');
var updateScroll = require('../update-scroll');

function bindMouseScrollXHandler(element, i) {
  var currentLeft = null;
  var currentPageX = null;

  function updateScrollLeft(deltaX) {
    var newLeft = currentLeft + (deltaX * i.railXRatio);
    var maxLeft = Math.max(0, i.scrollbarXRail.getBoundingClientRect().left) + (i.railXRatio * (i.railXWidth - i.scrollbarXWidth));

    if (newLeft < 0) {
      i.scrollbarXLeft = 0;
    } else if (newLeft > maxLeft) {
      i.scrollbarXLeft = maxLeft;
    } else {
      i.scrollbarXLeft = newLeft;
    }

    var scrollLeft = _.toInt(i.scrollbarXLeft * (i.contentWidth - i.containerWidth) / (i.containerWidth - (i.railXRatio * i.scrollbarXWidth))) - i.negativeScrollAdjustment;
    updateScroll(element, 'left', scrollLeft);
  }

  var mouseMoveHandler = function (e) {
    updateScrollLeft(e.pageX - currentPageX);
    updateGeometry(element);
    e.stopPropagation();
    e.preventDefault();
  };

  var mouseUpHandler = function () {
    _.stopScrolling(element, 'x');
    i.event.unbind(i.ownerDocument, 'mousemove', mouseMoveHandler);
  };

  i.event.bind(i.scrollbarX, 'mousedown', function (e) {
    currentPageX = e.pageX;
    currentLeft = _.toInt(dom.css(i.scrollbarX, 'left')) * i.railXRatio;
    _.startScrolling(element, 'x');

    i.event.bind(i.ownerDocument, 'mousemove', mouseMoveHandler);
    i.event.once(i.ownerDocument, 'mouseup', mouseUpHandler);

    e.stopPropagation();
    e.preventDefault();
  });
}

function bindMouseScrollYHandler(element, i) {
  var currentTop = null;
  var currentPageY = null;

  function updateScrollTop(deltaY) {
    var newTop = currentTop + (deltaY * i.railYRatio);
    var maxTop = Math.max(0, i.scrollbarYRail.getBoundingClientRect().top) + (i.railYRatio * (i.railYHeight - i.scrollbarYHeight));

    if (newTop < 0) {
      i.scrollbarYTop = 0;
    } else if (newTop > maxTop) {
      i.scrollbarYTop = maxTop;
    } else {
      i.scrollbarYTop = newTop;
    }

    var scrollTop = _.toInt(i.scrollbarYTop * (i.contentHeight - i.containerHeight) / (i.containerHeight - (i.railYRatio * i.scrollbarYHeight)));
    updateScroll(element, 'top', scrollTop);
  }

  var mouseMoveHandler = function (e) {
    updateScrollTop(e.pageY - currentPageY);
    updateGeometry(element);
    e.stopPropagation();
    e.preventDefault();
  };

  var mouseUpHandler = function () {
    _.stopScrolling(element, 'y');
    i.event.unbind(i.ownerDocument, 'mousemove', mouseMoveHandler);
  };

  i.event.bind(i.scrollbarY, 'mousedown', function (e) {
    currentPageY = e.pageY;
    currentTop = _.toInt(dom.css(i.scrollbarY, 'top')) * i.railYRatio;
    _.startScrolling(element, 'y');

    i.event.bind(i.ownerDocument, 'mousemove', mouseMoveHandler);
    i.event.once(i.ownerDocument, 'mouseup', mouseUpHandler);

    e.stopPropagation();
    e.preventDefault();
  });
}

module.exports = function (element) {
  var i = instances.get(element);
  bindMouseScrollXHandler(element, i);
  bindMouseScrollYHandler(element, i);
};

},{"../../lib/dom":3,"../../lib/helper":6,"../instances":18,"../update-geometry":19,"../update-scroll":20}],12:[function(require,module,exports){
'use strict';

var _ = require('../../lib/helper');
var dom = require('../../lib/dom');
var instances = require('../instances');
var updateGeometry = require('../update-geometry');
var updateScroll = require('../update-scroll');

function bindKeyboardHandler(element, i) {
  var hovered = false;
  i.event.bind(element, 'mouseenter', function () {
    hovered = true;
  });
  i.event.bind(element, 'mouseleave', function () {
    hovered = false;
  });

  var shouldPrevent = false;
  function shouldPreventDefault(deltaX, deltaY) {
    var scrollTop = element.scrollTop;
    if (deltaX === 0) {
      if (!i.scrollbarYActive) {
        return false;
      }
      if ((scrollTop === 0 && deltaY > 0) || (scrollTop >= i.contentHeight - i.containerHeight && deltaY < 0)) {
        return !i.settings.wheelPropagation;
      }
    }

    var scrollLeft = element.scrollLeft;
    if (deltaY === 0) {
      if (!i.scrollbarXActive) {
        return false;
      }
      if ((scrollLeft === 0 && deltaX < 0) || (scrollLeft >= i.contentWidth - i.containerWidth && deltaX > 0)) {
        return !i.settings.wheelPropagation;
      }
    }
    return true;
  }

  i.event.bind(i.ownerDocument, 'keydown', function (e) {
    if ((e.isDefaultPrevented && e.isDefaultPrevented()) || e.defaultPrevented) {
      return;
    }

    var focused = dom.matches(i.scrollbarX, ':focus') ||
                  dom.matches(i.scrollbarY, ':focus');

    if (!hovered && !focused) {
      return;
    }

    var activeElement = document.activeElement ? document.activeElement : i.ownerDocument.activeElement;
    if (activeElement) {
      if (activeElement.tagName === 'IFRAME') {
        activeElement = activeElement.contentDocument.activeElement;
      } else {
        // go deeper if element is a webcomponent
        while (activeElement.shadowRoot) {
          activeElement = activeElement.shadowRoot.activeElement;
        }
      }
      if (_.isEditable(activeElement)) {
        return;
      }
    }

    var deltaX = 0;
    var deltaY = 0;

    switch (e.which) {
    case 37: // left
      if (e.metaKey) {
        deltaX = -i.contentWidth;
      } else if (e.altKey) {
        deltaX = -i.containerWidth;
      } else {
        deltaX = -30;
      }
      break;
    case 38: // up
      if (e.metaKey) {
        deltaY = i.contentHeight;
      } else if (e.altKey) {
        deltaY = i.containerHeight;
      } else {
        deltaY = 30;
      }
      break;
    case 39: // right
      if (e.metaKey) {
        deltaX = i.contentWidth;
      } else if (e.altKey) {
        deltaX = i.containerWidth;
      } else {
        deltaX = 30;
      }
      break;
    case 40: // down
      if (e.metaKey) {
        deltaY = -i.contentHeight;
      } else if (e.altKey) {
        deltaY = -i.containerHeight;
      } else {
        deltaY = -30;
      }
      break;
    case 33: // page up
      deltaY = 90;
      break;
    case 32: // space bar
      if (e.shiftKey) {
        deltaY = 90;
      } else {
        deltaY = -90;
      }
      break;
    case 34: // page down
      deltaY = -90;
      break;
    case 35: // end
      if (e.ctrlKey) {
        deltaY = -i.contentHeight;
      } else {
        deltaY = -i.containerHeight;
      }
      break;
    case 36: // home
      if (e.ctrlKey) {
        deltaY = element.scrollTop;
      } else {
        deltaY = i.containerHeight;
      }
      break;
    default:
      return;
    }

    updateScroll(element, 'top', element.scrollTop - deltaY);
    updateScroll(element, 'left', element.scrollLeft + deltaX);
    updateGeometry(element);

    shouldPrevent = shouldPreventDefault(deltaX, deltaY);
    if (shouldPrevent) {
      e.preventDefault();
    }
  });
}

module.exports = function (element) {
  var i = instances.get(element);
  bindKeyboardHandler(element, i);
};

},{"../../lib/dom":3,"../../lib/helper":6,"../instances":18,"../update-geometry":19,"../update-scroll":20}],13:[function(require,module,exports){
'use strict';

var instances = require('../instances');
var updateGeometry = require('../update-geometry');
var updateScroll = require('../update-scroll');

function bindMouseWheelHandler(element, i) {
  var shouldPrevent = false;

  function shouldPreventDefault(deltaX, deltaY) {
    var scrollTop = element.scrollTop;
    if (deltaX === 0) {
      if (!i.scrollbarYActive) {
        return false;
      }
      if ((scrollTop === 0 && deltaY > 0) || (scrollTop >= i.contentHeight - i.containerHeight && deltaY < 0)) {
        return !i.settings.wheelPropagation;
      }
    }

    var scrollLeft = element.scrollLeft;
    if (deltaY === 0) {
      if (!i.scrollbarXActive) {
        return false;
      }
      if ((scrollLeft === 0 && deltaX < 0) || (scrollLeft >= i.contentWidth - i.containerWidth && deltaX > 0)) {
        return !i.settings.wheelPropagation;
      }
    }
    return true;
  }

  function getDeltaFromEvent(e) {
    var deltaX = e.deltaX;
    var deltaY = -1 * e.deltaY;

    if (typeof deltaX === "undefined" || typeof deltaY === "undefined") {
      // OS X Safari
      deltaX = -1 * e.wheelDeltaX / 6;
      deltaY = e.wheelDeltaY / 6;
    }

    if (e.deltaMode && e.deltaMode === 1) {
      // Firefox in deltaMode 1: Line scrolling
      deltaX *= 10;
      deltaY *= 10;
    }

    if (deltaX !== deltaX && deltaY !== deltaY/* NaN checks */) {
      // IE in some mouse drivers
      deltaX = 0;
      deltaY = e.wheelDelta;
    }

    if (e.shiftKey) {
      // reverse axis with shift key
      return [-deltaY, -deltaX];
    }
    return [deltaX, deltaY];
  }

  function shouldBeConsumedByChild(deltaX, deltaY) {
    var child = element.querySelector('textarea:hover, select[multiple]:hover, .ps-child:hover');
    if (child) {
      if (!window.getComputedStyle(child).overflow.match(/(scroll|auto)/)) {
        // if not scrollable
        return false;
      }

      var maxScrollTop = child.scrollHeight - child.clientHeight;
      if (maxScrollTop > 0) {
        if (!(child.scrollTop === 0 && deltaY > 0) && !(child.scrollTop === maxScrollTop && deltaY < 0)) {
          return true;
        }
      }
      var maxScrollLeft = child.scrollLeft - child.clientWidth;
      if (maxScrollLeft > 0) {
        if (!(child.scrollLeft === 0 && deltaX < 0) && !(child.scrollLeft === maxScrollLeft && deltaX > 0)) {
          return true;
        }
      }
    }
    return false;
  }

  function mousewheelHandler(e) {
    var delta = getDeltaFromEvent(e);

    var deltaX = delta[0];
    var deltaY = delta[1];

    if (shouldBeConsumedByChild(deltaX, deltaY)) {
      return;
    }

    shouldPrevent = false;
    if (!i.settings.useBothWheelAxes) {
      // deltaX will only be used for horizontal scrolling and deltaY will
      // only be used for vertical scrolling - this is the default
      updateScroll(element, 'top', element.scrollTop - (deltaY * i.settings.wheelSpeed));
      updateScroll(element, 'left', element.scrollLeft + (deltaX * i.settings.wheelSpeed));
    } else if (i.scrollbarYActive && !i.scrollbarXActive) {
      // only vertical scrollbar is active and useBothWheelAxes option is
      // active, so let's scroll vertical bar using both mouse wheel axes
      if (deltaY) {
        updateScroll(element, 'top', element.scrollTop - (deltaY * i.settings.wheelSpeed));
      } else {
        updateScroll(element, 'top', element.scrollTop + (deltaX * i.settings.wheelSpeed));
      }
      shouldPrevent = true;
    } else if (i.scrollbarXActive && !i.scrollbarYActive) {
      // useBothWheelAxes and only horizontal bar is active, so use both
      // wheel axes for horizontal bar
      if (deltaX) {
        updateScroll(element, 'left', element.scrollLeft + (deltaX * i.settings.wheelSpeed));
      } else {
        updateScroll(element, 'left', element.scrollLeft - (deltaY * i.settings.wheelSpeed));
      }
      shouldPrevent = true;
    }

    updateGeometry(element);

    shouldPrevent = (shouldPrevent || shouldPreventDefault(deltaX, deltaY));
    if (shouldPrevent) {
      e.stopPropagation();
      e.preventDefault();
    }
  }

  if (typeof window.onwheel !== "undefined") {
    i.event.bind(element, 'wheel', mousewheelHandler);
  } else if (typeof window.onmousewheel !== "undefined") {
    i.event.bind(element, 'mousewheel', mousewheelHandler);
  }
}

module.exports = function (element) {
  var i = instances.get(element);
  bindMouseWheelHandler(element, i);
};

},{"../instances":18,"../update-geometry":19,"../update-scroll":20}],14:[function(require,module,exports){
'use strict';

var instances = require('../instances');
var updateGeometry = require('../update-geometry');

function bindNativeScrollHandler(element, i) {
  i.event.bind(element, 'scroll', function () {
    updateGeometry(element);
  });
}

module.exports = function (element) {
  var i = instances.get(element);
  bindNativeScrollHandler(element, i);
};

},{"../instances":18,"../update-geometry":19}],15:[function(require,module,exports){
'use strict';

var _ = require('../../lib/helper');
var instances = require('../instances');
var updateGeometry = require('../update-geometry');
var updateScroll = require('../update-scroll');

function bindSelectionHandler(element, i) {
  function getRangeNode() {
    var selection = window.getSelection ? window.getSelection() :
                    document.getSelection ? document.getSelection() : '';
    if (selection.toString().length === 0) {
      return null;
    } else {
      return selection.getRangeAt(0).commonAncestorContainer;
    }
  }

  var scrollingLoop = null;
  var scrollDiff = {top: 0, left: 0};
  function startScrolling() {
    if (!scrollingLoop) {
      scrollingLoop = setInterval(function () {
        if (!instances.get(element)) {
          clearInterval(scrollingLoop);
          return;
        }

        updateScroll(element, 'top', element.scrollTop + scrollDiff.top);
        updateScroll(element, 'left', element.scrollLeft + scrollDiff.left);
        updateGeometry(element);
      }, 50); // every .1 sec
    }
  }
  function stopScrolling() {
    if (scrollingLoop) {
      clearInterval(scrollingLoop);
      scrollingLoop = null;
    }
    _.stopScrolling(element);
  }

  var isSelected = false;
  i.event.bind(i.ownerDocument, 'selectionchange', function () {
    if (element.contains(getRangeNode())) {
      isSelected = true;
    } else {
      isSelected = false;
      stopScrolling();
    }
  });
  i.event.bind(window, 'mouseup', function () {
    if (isSelected) {
      isSelected = false;
      stopScrolling();
    }
  });
  i.event.bind(window, 'keyup', function () {
    if (isSelected) {
      isSelected = false;
      stopScrolling();
    }
  });

  i.event.bind(window, 'mousemove', function (e) {
    if (isSelected) {
      var mousePosition = {x: e.pageX, y: e.pageY};
      var containerGeometry = {
        left: element.offsetLeft,
        right: element.offsetLeft + element.offsetWidth,
        top: element.offsetTop,
        bottom: element.offsetTop + element.offsetHeight
      };

      if (mousePosition.x < containerGeometry.left + 3) {
        scrollDiff.left = -5;
        _.startScrolling(element, 'x');
      } else if (mousePosition.x > containerGeometry.right - 3) {
        scrollDiff.left = 5;
        _.startScrolling(element, 'x');
      } else {
        scrollDiff.left = 0;
      }

      if (mousePosition.y < containerGeometry.top + 3) {
        if (containerGeometry.top + 3 - mousePosition.y < 5) {
          scrollDiff.top = -5;
        } else {
          scrollDiff.top = -20;
        }
        _.startScrolling(element, 'y');
      } else if (mousePosition.y > containerGeometry.bottom - 3) {
        if (mousePosition.y - containerGeometry.bottom + 3 < 5) {
          scrollDiff.top = 5;
        } else {
          scrollDiff.top = 20;
        }
        _.startScrolling(element, 'y');
      } else {
        scrollDiff.top = 0;
      }

      if (scrollDiff.top === 0 && scrollDiff.left === 0) {
        stopScrolling();
      } else {
        startScrolling();
      }
    }
  });
}

module.exports = function (element) {
  var i = instances.get(element);
  bindSelectionHandler(element, i);
};

},{"../../lib/helper":6,"../instances":18,"../update-geometry":19,"../update-scroll":20}],16:[function(require,module,exports){
'use strict';

var _ = require('../../lib/helper');
var instances = require('../instances');
var updateGeometry = require('../update-geometry');
var updateScroll = require('../update-scroll');

function bindTouchHandler(element, i, supportsTouch, supportsIePointer) {
  function shouldPreventDefault(deltaX, deltaY) {
    var scrollTop = element.scrollTop;
    var scrollLeft = element.scrollLeft;
    var magnitudeX = Math.abs(deltaX);
    var magnitudeY = Math.abs(deltaY);

    if (magnitudeY > magnitudeX) {
      // user is perhaps trying to swipe up/down the page

      if (((deltaY < 0) && (scrollTop === i.contentHeight - i.containerHeight)) ||
          ((deltaY > 0) && (scrollTop === 0))) {
        return !i.settings.swipePropagation;
      }
    } else if (magnitudeX > magnitudeY) {
      // user is perhaps trying to swipe left/right across the page

      if (((deltaX < 0) && (scrollLeft === i.contentWidth - i.containerWidth)) ||
          ((deltaX > 0) && (scrollLeft === 0))) {
        return !i.settings.swipePropagation;
      }
    }

    return true;
  }

  function applyTouchMove(differenceX, differenceY) {
    updateScroll(element, 'top', element.scrollTop - differenceY);
    updateScroll(element, 'left', element.scrollLeft - differenceX);

    updateGeometry(element);
  }

  var startOffset = {};
  var startTime = 0;
  var speed = {};
  var easingLoop = null;
  var inGlobalTouch = false;
  var inLocalTouch = false;

  function globalTouchStart() {
    inGlobalTouch = true;
  }
  function globalTouchEnd() {
    inGlobalTouch = false;
  }

  function getTouch(e) {
    if (e.targetTouches) {
      return e.targetTouches[0];
    } else {
      // Maybe IE pointer
      return e;
    }
  }
  function shouldHandle(e) {
    if (e.targetTouches && e.targetTouches.length === 1) {
      return true;
    }
    if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== e.MSPOINTER_TYPE_MOUSE) {
      return true;
    }
    return false;
  }
  function touchStart(e) {
    if (shouldHandle(e)) {
      inLocalTouch = true;

      var touch = getTouch(e);

      startOffset.pageX = touch.pageX;
      startOffset.pageY = touch.pageY;

      startTime = (new Date()).getTime();

      if (easingLoop !== null) {
        clearInterval(easingLoop);
      }

      e.stopPropagation();
    }
  }
  function touchMove(e) {
    if (!inLocalTouch && i.settings.swipePropagation) {
      touchStart(e);
    }
    if (!inGlobalTouch && inLocalTouch && shouldHandle(e)) {
      var touch = getTouch(e);

      var currentOffset = {pageX: touch.pageX, pageY: touch.pageY};

      var differenceX = currentOffset.pageX - startOffset.pageX;
      var differenceY = currentOffset.pageY - startOffset.pageY;

      applyTouchMove(differenceX, differenceY);
      startOffset = currentOffset;

      var currentTime = (new Date()).getTime();

      var timeGap = currentTime - startTime;
      if (timeGap > 0) {
        speed.x = differenceX / timeGap;
        speed.y = differenceY / timeGap;
        startTime = currentTime;
      }

      if (shouldPreventDefault(differenceX, differenceY)) {
        e.stopPropagation();
        e.preventDefault();
      }
    }
  }
  function touchEnd() {
    if (!inGlobalTouch && inLocalTouch) {
      inLocalTouch = false;

      clearInterval(easingLoop);
      easingLoop = setInterval(function () {
        if (!instances.get(element)) {
          clearInterval(easingLoop);
          return;
        }

        if (!speed.x && !speed.y) {
          clearInterval(easingLoop);
          return;
        }

        if (Math.abs(speed.x) < 0.01 && Math.abs(speed.y) < 0.01) {
          clearInterval(easingLoop);
          return;
        }

        applyTouchMove(speed.x * 30, speed.y * 30);

        speed.x *= 0.8;
        speed.y *= 0.8;
      }, 10);
    }
  }

  if (supportsTouch) {
    i.event.bind(window, 'touchstart', globalTouchStart);
    i.event.bind(window, 'touchend', globalTouchEnd);
    i.event.bind(element, 'touchstart', touchStart);
    i.event.bind(element, 'touchmove', touchMove);
    i.event.bind(element, 'touchend', touchEnd);
  } else if (supportsIePointer) {
    if (window.PointerEvent) {
      i.event.bind(window, 'pointerdown', globalTouchStart);
      i.event.bind(window, 'pointerup', globalTouchEnd);
      i.event.bind(element, 'pointerdown', touchStart);
      i.event.bind(element, 'pointermove', touchMove);
      i.event.bind(element, 'pointerup', touchEnd);
    } else if (window.MSPointerEvent) {
      i.event.bind(window, 'MSPointerDown', globalTouchStart);
      i.event.bind(window, 'MSPointerUp', globalTouchEnd);
      i.event.bind(element, 'MSPointerDown', touchStart);
      i.event.bind(element, 'MSPointerMove', touchMove);
      i.event.bind(element, 'MSPointerUp', touchEnd);
    }
  }
}

module.exports = function (element) {
  if (!_.env.supportsTouch && !_.env.supportsIePointer) {
    return;
  }

  var i = instances.get(element);
  bindTouchHandler(element, i, _.env.supportsTouch, _.env.supportsIePointer);
};

},{"../../lib/helper":6,"../instances":18,"../update-geometry":19,"../update-scroll":20}],17:[function(require,module,exports){
'use strict';

var _ = require('../lib/helper');
var cls = require('../lib/class');
var instances = require('./instances');
var updateGeometry = require('./update-geometry');

// Handlers
var handlers = {
  'click-rail': require('./handler/click-rail'),
  'drag-scrollbar': require('./handler/drag-scrollbar'),
  'keyboard': require('./handler/keyboard'),
  'wheel': require('./handler/mouse-wheel'),
  'touch': require('./handler/touch'),
  'selection': require('./handler/selection')
};
var nativeScrollHandler = require('./handler/native-scroll');

module.exports = function (element, userSettings) {
  userSettings = typeof userSettings === 'object' ? userSettings : {};

  cls.add(element, 'ps-container');

  // Create a plugin instance.
  var i = instances.add(element);

  i.settings = _.extend(i.settings, userSettings);
  cls.add(element, 'ps-theme-' + i.settings.theme);

  i.settings.handlers.forEach(function (handlerName) {
    handlers[handlerName](element);
  });

  nativeScrollHandler(element);

  updateGeometry(element);
};

},{"../lib/class":2,"../lib/helper":6,"./handler/click-rail":10,"./handler/drag-scrollbar":11,"./handler/keyboard":12,"./handler/mouse-wheel":13,"./handler/native-scroll":14,"./handler/selection":15,"./handler/touch":16,"./instances":18,"./update-geometry":19}],18:[function(require,module,exports){
'use strict';

var _ = require('../lib/helper');
var cls = require('../lib/class');
var defaultSettings = require('./default-setting');
var dom = require('../lib/dom');
var EventManager = require('../lib/event-manager');
var guid = require('../lib/guid');

var instances = {};

function Instance(element) {
  var i = this;

  i.settings = _.clone(defaultSettings);
  i.containerWidth = null;
  i.containerHeight = null;
  i.contentWidth = null;
  i.contentHeight = null;

  i.isRtl = dom.css(element, 'direction') === "rtl";
  i.isNegativeScroll = (function () {
    var originalScrollLeft = element.scrollLeft;
    var result = null;
    element.scrollLeft = -1;
    result = element.scrollLeft < 0;
    element.scrollLeft = originalScrollLeft;
    return result;
  })();
  i.negativeScrollAdjustment = i.isNegativeScroll ? element.scrollWidth - element.clientWidth : 0;
  i.event = new EventManager();
  i.ownerDocument = element.ownerDocument || document;

  function focus() {
    cls.add(element, 'ps-focus');
  }

  function blur() {
    cls.remove(element, 'ps-focus');
  }

  i.scrollbarXRail = dom.appendTo(dom.e('div', 'ps-scrollbar-x-rail'), element);
  i.scrollbarX = dom.appendTo(dom.e('div', 'ps-scrollbar-x'), i.scrollbarXRail);
  i.scrollbarX.setAttribute('tabindex', 0);
  i.event.bind(i.scrollbarX, 'focus', focus);
  i.event.bind(i.scrollbarX, 'blur', blur);
  i.scrollbarXActive = null;
  i.scrollbarXWidth = null;
  i.scrollbarXLeft = null;
  i.scrollbarXBottom = _.toInt(dom.css(i.scrollbarXRail, 'bottom'));
  i.isScrollbarXUsingBottom = i.scrollbarXBottom === i.scrollbarXBottom; // !isNaN
  i.scrollbarXTop = i.isScrollbarXUsingBottom ? null : _.toInt(dom.css(i.scrollbarXRail, 'top'));
  i.railBorderXWidth = _.toInt(dom.css(i.scrollbarXRail, 'borderLeftWidth')) + _.toInt(dom.css(i.scrollbarXRail, 'borderRightWidth'));
  // Set rail to display:block to calculate margins
  dom.css(i.scrollbarXRail, 'display', 'block');
  i.railXMarginWidth = _.toInt(dom.css(i.scrollbarXRail, 'marginLeft')) + _.toInt(dom.css(i.scrollbarXRail, 'marginRight'));
  dom.css(i.scrollbarXRail, 'display', '');
  i.railXWidth = null;
  i.railXRatio = null;

  i.scrollbarYRail = dom.appendTo(dom.e('div', 'ps-scrollbar-y-rail'), element);
  i.scrollbarY = dom.appendTo(dom.e('div', 'ps-scrollbar-y'), i.scrollbarYRail);
  i.scrollbarY.setAttribute('tabindex', 0);
  i.event.bind(i.scrollbarY, 'focus', focus);
  i.event.bind(i.scrollbarY, 'blur', blur);
  i.scrollbarYActive = null;
  i.scrollbarYHeight = null;
  i.scrollbarYTop = null;
  i.scrollbarYRight = _.toInt(dom.css(i.scrollbarYRail, 'right'));
  i.isScrollbarYUsingRight = i.scrollbarYRight === i.scrollbarYRight; // !isNaN
  i.scrollbarYLeft = i.isScrollbarYUsingRight ? null : _.toInt(dom.css(i.scrollbarYRail, 'left'));
  i.scrollbarYOuterWidth = i.isRtl ? _.outerWidth(i.scrollbarY) : null;
  i.railBorderYWidth = _.toInt(dom.css(i.scrollbarYRail, 'borderTopWidth')) + _.toInt(dom.css(i.scrollbarYRail, 'borderBottomWidth'));
  dom.css(i.scrollbarYRail, 'display', 'block');
  i.railYMarginHeight = _.toInt(dom.css(i.scrollbarYRail, 'marginTop')) + _.toInt(dom.css(i.scrollbarYRail, 'marginBottom'));
  dom.css(i.scrollbarYRail, 'display', '');
  i.railYHeight = null;
  i.railYRatio = null;
}

function getId(element) {
  return element.getAttribute('data-ps-id');
}

function setId(element, id) {
  element.setAttribute('data-ps-id', id);
}

function removeId(element) {
  element.removeAttribute('data-ps-id');
}

exports.add = function (element) {
  var newId = guid();
  setId(element, newId);
  instances[newId] = new Instance(element);
  return instances[newId];
};

exports.remove = function (element) {
  delete instances[getId(element)];
  removeId(element);
};

exports.get = function (element) {
  return instances[getId(element)];
};

},{"../lib/class":2,"../lib/dom":3,"../lib/event-manager":4,"../lib/guid":5,"../lib/helper":6,"./default-setting":8}],19:[function(require,module,exports){
'use strict';

var _ = require('../lib/helper');
var cls = require('../lib/class');
var dom = require('../lib/dom');
var instances = require('./instances');
var updateScroll = require('./update-scroll');

function getThumbSize(i, thumbSize) {
  if (i.settings.minScrollbarLength) {
    thumbSize = Math.max(thumbSize, i.settings.minScrollbarLength);
  }
  if (i.settings.maxScrollbarLength) {
    thumbSize = Math.min(thumbSize, i.settings.maxScrollbarLength);
  }
  return thumbSize;
}

function updateCss(element, i) {
  var xRailOffset = {width: i.railXWidth};
  if (i.isRtl) {
    xRailOffset.left = i.negativeScrollAdjustment + element.scrollLeft + i.containerWidth - i.contentWidth;
  } else {
    xRailOffset.left = element.scrollLeft;
  }
  if (i.isScrollbarXUsingBottom) {
    xRailOffset.bottom = i.scrollbarXBottom - element.scrollTop;
  } else {
    xRailOffset.top = i.scrollbarXTop + element.scrollTop;
  }
  dom.css(i.scrollbarXRail, xRailOffset);

  var yRailOffset = {top: element.scrollTop, height: i.railYHeight};
  if (i.isScrollbarYUsingRight) {
    if (i.isRtl) {
      yRailOffset.right = i.contentWidth - (i.negativeScrollAdjustment + element.scrollLeft) - i.scrollbarYRight - i.scrollbarYOuterWidth;
    } else {
      yRailOffset.right = i.scrollbarYRight - element.scrollLeft;
    }
  } else {
    if (i.isRtl) {
      yRailOffset.left = i.negativeScrollAdjustment + element.scrollLeft + i.containerWidth * 2 - i.contentWidth - i.scrollbarYLeft - i.scrollbarYOuterWidth;
    } else {
      yRailOffset.left = i.scrollbarYLeft + element.scrollLeft;
    }
  }
  dom.css(i.scrollbarYRail, yRailOffset);

  dom.css(i.scrollbarX, {left: i.scrollbarXLeft, width: i.scrollbarXWidth - i.railBorderXWidth});
  dom.css(i.scrollbarY, {top: i.scrollbarYTop, height: i.scrollbarYHeight - i.railBorderYWidth});
}

module.exports = function (element) {
  var i = instances.get(element);

  i.containerWidth = element.clientWidth;
  i.containerHeight = element.clientHeight;
  i.contentWidth = element.scrollWidth;
  i.contentHeight = element.scrollHeight;

  var existingRails;
  if (!element.contains(i.scrollbarXRail)) {
    existingRails = dom.queryChildren(element, '.ps-scrollbar-x-rail');
    if (existingRails.length > 0) {
      existingRails.forEach(function (rail) {
        dom.remove(rail);
      });
    }
    dom.appendTo(i.scrollbarXRail, element);
  }
  if (!element.contains(i.scrollbarYRail)) {
    existingRails = dom.queryChildren(element, '.ps-scrollbar-y-rail');
    if (existingRails.length > 0) {
      existingRails.forEach(function (rail) {
        dom.remove(rail);
      });
    }
    dom.appendTo(i.scrollbarYRail, element);
  }

  if (!i.settings.suppressScrollX && i.containerWidth + i.settings.scrollXMarginOffset < i.contentWidth) {
    i.scrollbarXActive = true;
    i.railXWidth = i.containerWidth - i.railXMarginWidth;
    i.railXRatio = i.containerWidth / i.railXWidth;
    i.scrollbarXWidth = getThumbSize(i, _.toInt(i.railXWidth * i.containerWidth / i.contentWidth));
    i.scrollbarXLeft = _.toInt((i.negativeScrollAdjustment + element.scrollLeft) * (i.railXWidth - i.scrollbarXWidth) / (i.contentWidth - i.containerWidth));
  } else {
    i.scrollbarXActive = false;
  }

  if (!i.settings.suppressScrollY && i.containerHeight + i.settings.scrollYMarginOffset < i.contentHeight) {
    i.scrollbarYActive = true;
    i.railYHeight = i.containerHeight - i.railYMarginHeight;
    i.railYRatio = i.containerHeight / i.railYHeight;
    i.scrollbarYHeight = getThumbSize(i, _.toInt(i.railYHeight * i.containerHeight / i.contentHeight));
    i.scrollbarYTop = _.toInt(element.scrollTop * (i.railYHeight - i.scrollbarYHeight) / (i.contentHeight - i.containerHeight));
  } else {
    i.scrollbarYActive = false;
  }

  if (i.scrollbarXLeft >= i.railXWidth - i.scrollbarXWidth) {
    i.scrollbarXLeft = i.railXWidth - i.scrollbarXWidth;
  }
  if (i.scrollbarYTop >= i.railYHeight - i.scrollbarYHeight) {
    i.scrollbarYTop = i.railYHeight - i.scrollbarYHeight;
  }

  updateCss(element, i);

  if (i.scrollbarXActive) {
    cls.add(element, 'ps-active-x');
  } else {
    cls.remove(element, 'ps-active-x');
    i.scrollbarXWidth = 0;
    i.scrollbarXLeft = 0;
    updateScroll(element, 'left', 0);
  }
  if (i.scrollbarYActive) {
    cls.add(element, 'ps-active-y');
  } else {
    cls.remove(element, 'ps-active-y');
    i.scrollbarYHeight = 0;
    i.scrollbarYTop = 0;
    updateScroll(element, 'top', 0);
  }
};

},{"../lib/class":2,"../lib/dom":3,"../lib/helper":6,"./instances":18,"./update-scroll":20}],20:[function(require,module,exports){
'use strict';

var instances = require('./instances');

var lastTop;
var lastLeft;

var createDOMEvent = function (name) {
  var event = document.createEvent("Event");
  event.initEvent(name, true, true);
  return event;
};

module.exports = function (element, axis, value) {
  if (typeof element === 'undefined') {
    throw 'You must provide an element to the update-scroll function';
  }

  if (typeof axis === 'undefined') {
    throw 'You must provide an axis to the update-scroll function';
  }

  if (typeof value === 'undefined') {
    throw 'You must provide a value to the update-scroll function';
  }

  if (axis === 'top' && value <= 0) {
    element.scrollTop = value = 0; // don't allow negative scroll
    element.dispatchEvent(createDOMEvent('ps-y-reach-start'));
  }

  if (axis === 'left' && value <= 0) {
    element.scrollLeft = value = 0; // don't allow negative scroll
    element.dispatchEvent(createDOMEvent('ps-x-reach-start'));
  }

  var i = instances.get(element);

  if (axis === 'top' && value >= i.contentHeight - i.containerHeight) {
    // don't allow scroll past container
    value = i.contentHeight - i.containerHeight;
    if (value - element.scrollTop <= 1) {
      // mitigates rounding errors on non-subpixel scroll values
      value = element.scrollTop;
    } else {
      element.scrollTop = value;
    }
    element.dispatchEvent(createDOMEvent('ps-y-reach-end'));
  }

  if (axis === 'left' && value >= i.contentWidth - i.containerWidth) {
    // don't allow scroll past container
    value = i.contentWidth - i.containerWidth;
    if (value - element.scrollLeft <= 1) {
      // mitigates rounding errors on non-subpixel scroll values
      value = element.scrollLeft;
    } else {
      element.scrollLeft = value;
    }
    element.dispatchEvent(createDOMEvent('ps-x-reach-end'));
  }

  if (!lastTop) {
    lastTop = element.scrollTop;
  }

  if (!lastLeft) {
    lastLeft = element.scrollLeft;
  }

  if (axis === 'top' && value < lastTop) {
    element.dispatchEvent(createDOMEvent('ps-scroll-up'));
  }

  if (axis === 'top' && value > lastTop) {
    element.dispatchEvent(createDOMEvent('ps-scroll-down'));
  }

  if (axis === 'left' && value < lastLeft) {
    element.dispatchEvent(createDOMEvent('ps-scroll-left'));
  }

  if (axis === 'left' && value > lastLeft) {
    element.dispatchEvent(createDOMEvent('ps-scroll-right'));
  }

  if (axis === 'top') {
    element.scrollTop = lastTop = value;
    element.dispatchEvent(createDOMEvent('ps-scroll-y'));
  }

  if (axis === 'left') {
    element.scrollLeft = lastLeft = value;
    element.dispatchEvent(createDOMEvent('ps-scroll-x'));
  }

};

},{"./instances":18}],21:[function(require,module,exports){
'use strict';

var _ = require('../lib/helper');
var dom = require('../lib/dom');
var instances = require('./instances');
var updateGeometry = require('./update-geometry');
var updateScroll = require('./update-scroll');

module.exports = function (element) {
  var i = instances.get(element);

  if (!i) {
    return;
  }

  // Recalcuate negative scrollLeft adjustment
  i.negativeScrollAdjustment = i.isNegativeScroll ? element.scrollWidth - element.clientWidth : 0;

  // Recalculate rail margins
  dom.css(i.scrollbarXRail, 'display', 'block');
  dom.css(i.scrollbarYRail, 'display', 'block');
  i.railXMarginWidth = _.toInt(dom.css(i.scrollbarXRail, 'marginLeft')) + _.toInt(dom.css(i.scrollbarXRail, 'marginRight'));
  i.railYMarginHeight = _.toInt(dom.css(i.scrollbarYRail, 'marginTop')) + _.toInt(dom.css(i.scrollbarYRail, 'marginBottom'));

  // Hide scrollbars not to affect scrollWidth and scrollHeight
  dom.css(i.scrollbarXRail, 'display', 'none');
  dom.css(i.scrollbarYRail, 'display', 'none');

  updateGeometry(element);

  // Update top/left scroll to trigger events
  updateScroll(element, 'top', element.scrollTop);
  updateScroll(element, 'left', element.scrollLeft);

  dom.css(i.scrollbarXRail, 'display', '');
  dom.css(i.scrollbarYRail, 'display', '');
};

},{"../lib/dom":3,"../lib/helper":6,"./instances":18,"./update-geometry":19,"./update-scroll":20}]},{},[1]);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3BlcmZlY3Qtc2Nyb2xsYmFyL3BlcmZlY3Qtc2Nyb2xsYmFyLmpxdWVyeS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiBwZXJmZWN0LXNjcm9sbGJhciB2MC42LjE2ICovXG4oZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSh7MTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBwcyA9IHJlcXVpcmUoJy4uL21haW4nKTtcbnZhciBwc0luc3RhbmNlcyA9IHJlcXVpcmUoJy4uL3BsdWdpbi9pbnN0YW5jZXMnKTtcblxuZnVuY3Rpb24gbW91bnRKUXVlcnkoalF1ZXJ5KSB7XG4gIGpRdWVyeS5mbi5wZXJmZWN0U2Nyb2xsYmFyID0gZnVuY3Rpb24gKHNldHRpbmdPckNvbW1hbmQpIHtcbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICh0eXBlb2Ygc2V0dGluZ09yQ29tbWFuZCA9PT0gJ29iamVjdCcgfHxcbiAgICAgICAgICB0eXBlb2Ygc2V0dGluZ09yQ29tbWFuZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgLy8gSWYgaXQncyBhbiBvYmplY3Qgb3Igbm9uZSwgaW5pdGlhbGl6ZS5cbiAgICAgICAgdmFyIHNldHRpbmdzID0gc2V0dGluZ09yQ29tbWFuZDtcblxuICAgICAgICBpZiAoIXBzSW5zdGFuY2VzLmdldCh0aGlzKSkge1xuICAgICAgICAgIHBzLmluaXRpYWxpemUodGhpcywgc2V0dGluZ3MpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBVbmxlc3MsIGl0IG1heSBiZSBhIGNvbW1hbmQuXG4gICAgICAgIHZhciBjb21tYW5kID0gc2V0dGluZ09yQ29tbWFuZDtcblxuICAgICAgICBpZiAoY29tbWFuZCA9PT0gJ3VwZGF0ZScpIHtcbiAgICAgICAgICBwcy51cGRhdGUodGhpcyk7XG4gICAgICAgIH0gZWxzZSBpZiAoY29tbWFuZCA9PT0gJ2Rlc3Ryb3knKSB7XG4gICAgICAgICAgcHMuZGVzdHJveSh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xufVxuXG5pZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gIC8vIEFNRC4gUmVnaXN0ZXIgYXMgYW4gYW5vbnltb3VzIG1vZHVsZS5cbiAgZGVmaW5lKFsnanF1ZXJ5J10sIG1vdW50SlF1ZXJ5KTtcbn0gZWxzZSB7XG4gIHZhciBqcSA9IHdpbmRvdy5qUXVlcnkgPyB3aW5kb3cualF1ZXJ5IDogd2luZG93LiQ7XG4gIGlmICh0eXBlb2YganEgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgbW91bnRKUXVlcnkoanEpO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gbW91bnRKUXVlcnk7XG5cbn0se1wiLi4vbWFpblwiOjcsXCIuLi9wbHVnaW4vaW5zdGFuY2VzXCI6MTh9XSwyOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gb2xkQWRkKGVsZW1lbnQsIGNsYXNzTmFtZSkge1xuICB2YXIgY2xhc3NlcyA9IGVsZW1lbnQuY2xhc3NOYW1lLnNwbGl0KCcgJyk7XG4gIGlmIChjbGFzc2VzLmluZGV4T2YoY2xhc3NOYW1lKSA8IDApIHtcbiAgICBjbGFzc2VzLnB1c2goY2xhc3NOYW1lKTtcbiAgfVxuICBlbGVtZW50LmNsYXNzTmFtZSA9IGNsYXNzZXMuam9pbignICcpO1xufVxuXG5mdW5jdGlvbiBvbGRSZW1vdmUoZWxlbWVudCwgY2xhc3NOYW1lKSB7XG4gIHZhciBjbGFzc2VzID0gZWxlbWVudC5jbGFzc05hbWUuc3BsaXQoJyAnKTtcbiAgdmFyIGlkeCA9IGNsYXNzZXMuaW5kZXhPZihjbGFzc05hbWUpO1xuICBpZiAoaWR4ID49IDApIHtcbiAgICBjbGFzc2VzLnNwbGljZShpZHgsIDEpO1xuICB9XG4gIGVsZW1lbnQuY2xhc3NOYW1lID0gY2xhc3Nlcy5qb2luKCcgJyk7XG59XG5cbmV4cG9ydHMuYWRkID0gZnVuY3Rpb24gKGVsZW1lbnQsIGNsYXNzTmFtZSkge1xuICBpZiAoZWxlbWVudC5jbGFzc0xpc3QpIHtcbiAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoY2xhc3NOYW1lKTtcbiAgfSBlbHNlIHtcbiAgICBvbGRBZGQoZWxlbWVudCwgY2xhc3NOYW1lKTtcbiAgfVxufTtcblxuZXhwb3J0cy5yZW1vdmUgPSBmdW5jdGlvbiAoZWxlbWVudCwgY2xhc3NOYW1lKSB7XG4gIGlmIChlbGVtZW50LmNsYXNzTGlzdCkge1xuICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShjbGFzc05hbWUpO1xuICB9IGVsc2Uge1xuICAgIG9sZFJlbW92ZShlbGVtZW50LCBjbGFzc05hbWUpO1xuICB9XG59O1xuXG5leHBvcnRzLmxpc3QgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICBpZiAoZWxlbWVudC5jbGFzc0xpc3QpIHtcbiAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmFwcGx5KGVsZW1lbnQuY2xhc3NMaXN0KTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZWxlbWVudC5jbGFzc05hbWUuc3BsaXQoJyAnKTtcbiAgfVxufTtcblxufSx7fV0sMzpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBET00gPSB7fTtcblxuRE9NLmUgPSBmdW5jdGlvbiAodGFnTmFtZSwgY2xhc3NOYW1lKSB7XG4gIHZhciBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWdOYW1lKTtcbiAgZWxlbWVudC5jbGFzc05hbWUgPSBjbGFzc05hbWU7XG4gIHJldHVybiBlbGVtZW50O1xufTtcblxuRE9NLmFwcGVuZFRvID0gZnVuY3Rpb24gKGNoaWxkLCBwYXJlbnQpIHtcbiAgcGFyZW50LmFwcGVuZENoaWxkKGNoaWxkKTtcbiAgcmV0dXJuIGNoaWxkO1xufTtcblxuZnVuY3Rpb24gY3NzR2V0KGVsZW1lbnQsIHN0eWxlTmFtZSkge1xuICByZXR1cm4gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWxlbWVudClbc3R5bGVOYW1lXTtcbn1cblxuZnVuY3Rpb24gY3NzU2V0KGVsZW1lbnQsIHN0eWxlTmFtZSwgc3R5bGVWYWx1ZSkge1xuICBpZiAodHlwZW9mIHN0eWxlVmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgc3R5bGVWYWx1ZSA9IHN0eWxlVmFsdWUudG9TdHJpbmcoKSArICdweCc7XG4gIH1cbiAgZWxlbWVudC5zdHlsZVtzdHlsZU5hbWVdID0gc3R5bGVWYWx1ZTtcbiAgcmV0dXJuIGVsZW1lbnQ7XG59XG5cbmZ1bmN0aW9uIGNzc011bHRpU2V0KGVsZW1lbnQsIG9iaikge1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgdmFyIHZhbCA9IG9ialtrZXldO1xuICAgIGlmICh0eXBlb2YgdmFsID09PSAnbnVtYmVyJykge1xuICAgICAgdmFsID0gdmFsLnRvU3RyaW5nKCkgKyAncHgnO1xuICAgIH1cbiAgICBlbGVtZW50LnN0eWxlW2tleV0gPSB2YWw7XG4gIH1cbiAgcmV0dXJuIGVsZW1lbnQ7XG59XG5cbkRPTS5jc3MgPSBmdW5jdGlvbiAoZWxlbWVudCwgc3R5bGVOYW1lT3JPYmplY3QsIHN0eWxlVmFsdWUpIHtcbiAgaWYgKHR5cGVvZiBzdHlsZU5hbWVPck9iamVjdCA9PT0gJ29iamVjdCcpIHtcbiAgICAvLyBtdWx0aXBsZSBzZXQgd2l0aCBvYmplY3RcbiAgICByZXR1cm4gY3NzTXVsdGlTZXQoZWxlbWVudCwgc3R5bGVOYW1lT3JPYmplY3QpO1xuICB9IGVsc2Uge1xuICAgIGlmICh0eXBlb2Ygc3R5bGVWYWx1ZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHJldHVybiBjc3NHZXQoZWxlbWVudCwgc3R5bGVOYW1lT3JPYmplY3QpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3NzU2V0KGVsZW1lbnQsIHN0eWxlTmFtZU9yT2JqZWN0LCBzdHlsZVZhbHVlKTtcbiAgICB9XG4gIH1cbn07XG5cbkRPTS5tYXRjaGVzID0gZnVuY3Rpb24gKGVsZW1lbnQsIHF1ZXJ5KSB7XG4gIGlmICh0eXBlb2YgZWxlbWVudC5tYXRjaGVzICE9PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybiBlbGVtZW50Lm1hdGNoZXMocXVlcnkpO1xuICB9IGVsc2Uge1xuICAgIGlmICh0eXBlb2YgZWxlbWVudC5tYXRjaGVzU2VsZWN0b3IgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm4gZWxlbWVudC5tYXRjaGVzU2VsZWN0b3IocXVlcnkpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGVsZW1lbnQud2Via2l0TWF0Y2hlc1NlbGVjdG9yICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuIGVsZW1lbnQud2Via2l0TWF0Y2hlc1NlbGVjdG9yKHF1ZXJ5KTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBlbGVtZW50Lm1vek1hdGNoZXNTZWxlY3RvciAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHJldHVybiBlbGVtZW50Lm1vek1hdGNoZXNTZWxlY3RvcihxdWVyeSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZWxlbWVudC5tc01hdGNoZXNTZWxlY3RvciAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHJldHVybiBlbGVtZW50Lm1zTWF0Y2hlc1NlbGVjdG9yKHF1ZXJ5KTtcbiAgICB9XG4gIH1cbn07XG5cbkRPTS5yZW1vdmUgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICBpZiAodHlwZW9mIGVsZW1lbnQucmVtb3ZlICE9PSAndW5kZWZpbmVkJykge1xuICAgIGVsZW1lbnQucmVtb3ZlKCk7XG4gIH0gZWxzZSB7XG4gICAgaWYgKGVsZW1lbnQucGFyZW50Tm9kZSkge1xuICAgICAgZWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGVsZW1lbnQpO1xuICAgIH1cbiAgfVxufTtcblxuRE9NLnF1ZXJ5Q2hpbGRyZW4gPSBmdW5jdGlvbiAoZWxlbWVudCwgc2VsZWN0b3IpIHtcbiAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5maWx0ZXIuY2FsbChlbGVtZW50LmNoaWxkTm9kZXMsIGZ1bmN0aW9uIChjaGlsZCkge1xuICAgIHJldHVybiBET00ubWF0Y2hlcyhjaGlsZCwgc2VsZWN0b3IpO1xuICB9KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRE9NO1xuXG59LHt9XSw0OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIEV2ZW50RWxlbWVudCA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG4gIHRoaXMuZXZlbnRzID0ge307XG59O1xuXG5FdmVudEVsZW1lbnQucHJvdG90eXBlLmJpbmQgPSBmdW5jdGlvbiAoZXZlbnROYW1lLCBoYW5kbGVyKSB7XG4gIGlmICh0eXBlb2YgdGhpcy5ldmVudHNbZXZlbnROYW1lXSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB0aGlzLmV2ZW50c1tldmVudE5hbWVdID0gW107XG4gIH1cbiAgdGhpcy5ldmVudHNbZXZlbnROYW1lXS5wdXNoKGhhbmRsZXIpO1xuICB0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGhhbmRsZXIsIGZhbHNlKTtcbn07XG5cbkV2ZW50RWxlbWVudC5wcm90b3R5cGUudW5iaW5kID0gZnVuY3Rpb24gKGV2ZW50TmFtZSwgaGFuZGxlcikge1xuICB2YXIgaXNIYW5kbGVyUHJvdmlkZWQgPSAodHlwZW9mIGhhbmRsZXIgIT09ICd1bmRlZmluZWQnKTtcbiAgdGhpcy5ldmVudHNbZXZlbnROYW1lXSA9IHRoaXMuZXZlbnRzW2V2ZW50TmFtZV0uZmlsdGVyKGZ1bmN0aW9uIChoZGxyKSB7XG4gICAgaWYgKGlzSGFuZGxlclByb3ZpZGVkICYmIGhkbHIgIT09IGhhbmRsZXIpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICB0aGlzLmVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGhkbHIsIGZhbHNlKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH0sIHRoaXMpO1xufTtcblxuRXZlbnRFbGVtZW50LnByb3RvdHlwZS51bmJpbmRBbGwgPSBmdW5jdGlvbiAoKSB7XG4gIGZvciAodmFyIG5hbWUgaW4gdGhpcy5ldmVudHMpIHtcbiAgICB0aGlzLnVuYmluZChuYW1lKTtcbiAgfVxufTtcblxudmFyIEV2ZW50TWFuYWdlciA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5ldmVudEVsZW1lbnRzID0gW107XG59O1xuXG5FdmVudE1hbmFnZXIucHJvdG90eXBlLmV2ZW50RWxlbWVudCA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gIHZhciBlZSA9IHRoaXMuZXZlbnRFbGVtZW50cy5maWx0ZXIoZnVuY3Rpb24gKGV2ZW50RWxlbWVudCkge1xuICAgIHJldHVybiBldmVudEVsZW1lbnQuZWxlbWVudCA9PT0gZWxlbWVudDtcbiAgfSlbMF07XG4gIGlmICh0eXBlb2YgZWUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgZWUgPSBuZXcgRXZlbnRFbGVtZW50KGVsZW1lbnQpO1xuICAgIHRoaXMuZXZlbnRFbGVtZW50cy5wdXNoKGVlKTtcbiAgfVxuICByZXR1cm4gZWU7XG59O1xuXG5FdmVudE1hbmFnZXIucHJvdG90eXBlLmJpbmQgPSBmdW5jdGlvbiAoZWxlbWVudCwgZXZlbnROYW1lLCBoYW5kbGVyKSB7XG4gIHRoaXMuZXZlbnRFbGVtZW50KGVsZW1lbnQpLmJpbmQoZXZlbnROYW1lLCBoYW5kbGVyKTtcbn07XG5cbkV2ZW50TWFuYWdlci5wcm90b3R5cGUudW5iaW5kID0gZnVuY3Rpb24gKGVsZW1lbnQsIGV2ZW50TmFtZSwgaGFuZGxlcikge1xuICB0aGlzLmV2ZW50RWxlbWVudChlbGVtZW50KS51bmJpbmQoZXZlbnROYW1lLCBoYW5kbGVyKTtcbn07XG5cbkV2ZW50TWFuYWdlci5wcm90b3R5cGUudW5iaW5kQWxsID0gZnVuY3Rpb24gKCkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZXZlbnRFbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgIHRoaXMuZXZlbnRFbGVtZW50c1tpXS51bmJpbmRBbGwoKTtcbiAgfVxufTtcblxuRXZlbnRNYW5hZ2VyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24gKGVsZW1lbnQsIGV2ZW50TmFtZSwgaGFuZGxlcikge1xuICB2YXIgZWUgPSB0aGlzLmV2ZW50RWxlbWVudChlbGVtZW50KTtcbiAgdmFyIG9uY2VIYW5kbGVyID0gZnVuY3Rpb24gKGUpIHtcbiAgICBlZS51bmJpbmQoZXZlbnROYW1lLCBvbmNlSGFuZGxlcik7XG4gICAgaGFuZGxlcihlKTtcbiAgfTtcbiAgZWUuYmluZChldmVudE5hbWUsIG9uY2VIYW5kbGVyKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRNYW5hZ2VyO1xuXG59LHt9XSw1OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBzNCgpIHtcbiAgICByZXR1cm4gTWF0aC5mbG9vcigoMSArIE1hdGgucmFuZG9tKCkpICogMHgxMDAwMClcbiAgICAgICAgICAgICAgIC50b1N0cmluZygxNilcbiAgICAgICAgICAgICAgIC5zdWJzdHJpbmcoMSk7XG4gIH1cbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gczQoKSArIHM0KCkgKyAnLScgKyBzNCgpICsgJy0nICsgczQoKSArICctJyArXG4gICAgICAgICAgIHM0KCkgKyAnLScgKyBzNCgpICsgczQoKSArIHM0KCk7XG4gIH07XG59KSgpO1xuXG59LHt9XSw2OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIGNscyA9IHJlcXVpcmUoJy4vY2xhc3MnKTtcbnZhciBkb20gPSByZXF1aXJlKCcuL2RvbScpO1xuXG52YXIgdG9JbnQgPSBleHBvcnRzLnRvSW50ID0gZnVuY3Rpb24gKHgpIHtcbiAgcmV0dXJuIHBhcnNlSW50KHgsIDEwKSB8fCAwO1xufTtcblxudmFyIGNsb25lID0gZXhwb3J0cy5jbG9uZSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgaWYgKCFvYmopIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfSBlbHNlIGlmIChvYmouY29uc3RydWN0b3IgPT09IEFycmF5KSB7XG4gICAgcmV0dXJuIG9iai5tYXAoY2xvbmUpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBvYmogPT09ICdvYmplY3QnKSB7XG4gICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgIHJlc3VsdFtrZXldID0gY2xvbmUob2JqW2tleV0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBvYmo7XG4gIH1cbn07XG5cbmV4cG9ydHMuZXh0ZW5kID0gZnVuY3Rpb24gKG9yaWdpbmFsLCBzb3VyY2UpIHtcbiAgdmFyIHJlc3VsdCA9IGNsb25lKG9yaWdpbmFsKTtcbiAgZm9yICh2YXIga2V5IGluIHNvdXJjZSkge1xuICAgIHJlc3VsdFtrZXldID0gY2xvbmUoc291cmNlW2tleV0pO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG5leHBvcnRzLmlzRWRpdGFibGUgPSBmdW5jdGlvbiAoZWwpIHtcbiAgcmV0dXJuIGRvbS5tYXRjaGVzKGVsLCBcImlucHV0LFtjb250ZW50ZWRpdGFibGVdXCIpIHx8XG4gICAgICAgICBkb20ubWF0Y2hlcyhlbCwgXCJzZWxlY3QsW2NvbnRlbnRlZGl0YWJsZV1cIikgfHxcbiAgICAgICAgIGRvbS5tYXRjaGVzKGVsLCBcInRleHRhcmVhLFtjb250ZW50ZWRpdGFibGVdXCIpIHx8XG4gICAgICAgICBkb20ubWF0Y2hlcyhlbCwgXCJidXR0b24sW2NvbnRlbnRlZGl0YWJsZV1cIik7XG59O1xuXG5leHBvcnRzLnJlbW92ZVBzQ2xhc3NlcyA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gIHZhciBjbHNMaXN0ID0gY2xzLmxpc3QoZWxlbWVudCk7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgY2xzTGlzdC5sZW5ndGg7IGkrKykge1xuICAgIHZhciBjbGFzc05hbWUgPSBjbHNMaXN0W2ldO1xuICAgIGlmIChjbGFzc05hbWUuaW5kZXhPZigncHMtJykgPT09IDApIHtcbiAgICAgIGNscy5yZW1vdmUoZWxlbWVudCwgY2xhc3NOYW1lKTtcbiAgICB9XG4gIH1cbn07XG5cbmV4cG9ydHMub3V0ZXJXaWR0aCA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gIHJldHVybiB0b0ludChkb20uY3NzKGVsZW1lbnQsICd3aWR0aCcpKSArXG4gICAgICAgICB0b0ludChkb20uY3NzKGVsZW1lbnQsICdwYWRkaW5nTGVmdCcpKSArXG4gICAgICAgICB0b0ludChkb20uY3NzKGVsZW1lbnQsICdwYWRkaW5nUmlnaHQnKSkgK1xuICAgICAgICAgdG9JbnQoZG9tLmNzcyhlbGVtZW50LCAnYm9yZGVyTGVmdFdpZHRoJykpICtcbiAgICAgICAgIHRvSW50KGRvbS5jc3MoZWxlbWVudCwgJ2JvcmRlclJpZ2h0V2lkdGgnKSk7XG59O1xuXG5leHBvcnRzLnN0YXJ0U2Nyb2xsaW5nID0gZnVuY3Rpb24gKGVsZW1lbnQsIGF4aXMpIHtcbiAgY2xzLmFkZChlbGVtZW50LCAncHMtaW4tc2Nyb2xsaW5nJyk7XG4gIGlmICh0eXBlb2YgYXhpcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBjbHMuYWRkKGVsZW1lbnQsICdwcy0nICsgYXhpcyk7XG4gIH0gZWxzZSB7XG4gICAgY2xzLmFkZChlbGVtZW50LCAncHMteCcpO1xuICAgIGNscy5hZGQoZWxlbWVudCwgJ3BzLXknKTtcbiAgfVxufTtcblxuZXhwb3J0cy5zdG9wU2Nyb2xsaW5nID0gZnVuY3Rpb24gKGVsZW1lbnQsIGF4aXMpIHtcbiAgY2xzLnJlbW92ZShlbGVtZW50LCAncHMtaW4tc2Nyb2xsaW5nJyk7XG4gIGlmICh0eXBlb2YgYXhpcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBjbHMucmVtb3ZlKGVsZW1lbnQsICdwcy0nICsgYXhpcyk7XG4gIH0gZWxzZSB7XG4gICAgY2xzLnJlbW92ZShlbGVtZW50LCAncHMteCcpO1xuICAgIGNscy5yZW1vdmUoZWxlbWVudCwgJ3BzLXknKTtcbiAgfVxufTtcblxuZXhwb3J0cy5lbnYgPSB7XG4gIGlzV2ViS2l0OiAnV2Via2l0QXBwZWFyYW5jZScgaW4gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLFxuICBzdXBwb3J0c1RvdWNoOiAoKCdvbnRvdWNoc3RhcnQnIGluIHdpbmRvdykgfHwgd2luZG93LkRvY3VtZW50VG91Y2ggJiYgZG9jdW1lbnQgaW5zdGFuY2VvZiB3aW5kb3cuRG9jdW1lbnRUb3VjaCksXG4gIHN1cHBvcnRzSWVQb2ludGVyOiB3aW5kb3cubmF2aWdhdG9yLm1zTWF4VG91Y2hQb2ludHMgIT09IG51bGxcbn07XG5cbn0se1wiLi9jbGFzc1wiOjIsXCIuL2RvbVwiOjN9XSw3OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIGRlc3Ryb3kgPSByZXF1aXJlKCcuL3BsdWdpbi9kZXN0cm95Jyk7XG52YXIgaW5pdGlhbGl6ZSA9IHJlcXVpcmUoJy4vcGx1Z2luL2luaXRpYWxpemUnKTtcbnZhciB1cGRhdGUgPSByZXF1aXJlKCcuL3BsdWdpbi91cGRhdGUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGluaXRpYWxpemU6IGluaXRpYWxpemUsXG4gIHVwZGF0ZTogdXBkYXRlLFxuICBkZXN0cm95OiBkZXN0cm95XG59O1xuXG59LHtcIi4vcGx1Z2luL2Rlc3Ryb3lcIjo5LFwiLi9wbHVnaW4vaW5pdGlhbGl6ZVwiOjE3LFwiLi9wbHVnaW4vdXBkYXRlXCI6MjF9XSw4OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGhhbmRsZXJzOiBbJ2NsaWNrLXJhaWwnLCAnZHJhZy1zY3JvbGxiYXInLCAna2V5Ym9hcmQnLCAnd2hlZWwnLCAndG91Y2gnXSxcbiAgbWF4U2Nyb2xsYmFyTGVuZ3RoOiBudWxsLFxuICBtaW5TY3JvbGxiYXJMZW5ndGg6IG51bGwsXG4gIHNjcm9sbFhNYXJnaW5PZmZzZXQ6IDAsXG4gIHNjcm9sbFlNYXJnaW5PZmZzZXQ6IDAsXG4gIHN1cHByZXNzU2Nyb2xsWDogZmFsc2UsXG4gIHN1cHByZXNzU2Nyb2xsWTogZmFsc2UsXG4gIHN3aXBlUHJvcGFnYXRpb246IHRydWUsXG4gIHVzZUJvdGhXaGVlbEF4ZXM6IGZhbHNlLFxuICB3aGVlbFByb3BhZ2F0aW9uOiBmYWxzZSxcbiAgd2hlZWxTcGVlZDogMSxcbiAgdGhlbWU6ICdkZWZhdWx0J1xufTtcblxufSx7fV0sOTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBfID0gcmVxdWlyZSgnLi4vbGliL2hlbHBlcicpO1xudmFyIGRvbSA9IHJlcXVpcmUoJy4uL2xpYi9kb20nKTtcbnZhciBpbnN0YW5jZXMgPSByZXF1aXJlKCcuL2luc3RhbmNlcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gIHZhciBpID0gaW5zdGFuY2VzLmdldChlbGVtZW50KTtcblxuICBpZiAoIWkpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBpLmV2ZW50LnVuYmluZEFsbCgpO1xuICBkb20ucmVtb3ZlKGkuc2Nyb2xsYmFyWCk7XG4gIGRvbS5yZW1vdmUoaS5zY3JvbGxiYXJZKTtcbiAgZG9tLnJlbW92ZShpLnNjcm9sbGJhclhSYWlsKTtcbiAgZG9tLnJlbW92ZShpLnNjcm9sbGJhcllSYWlsKTtcbiAgXy5yZW1vdmVQc0NsYXNzZXMoZWxlbWVudCk7XG5cbiAgaW5zdGFuY2VzLnJlbW92ZShlbGVtZW50KTtcbn07XG5cbn0se1wiLi4vbGliL2RvbVwiOjMsXCIuLi9saWIvaGVscGVyXCI6NixcIi4vaW5zdGFuY2VzXCI6MTh9XSwxMDpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBpbnN0YW5jZXMgPSByZXF1aXJlKCcuLi9pbnN0YW5jZXMnKTtcbnZhciB1cGRhdGVHZW9tZXRyeSA9IHJlcXVpcmUoJy4uL3VwZGF0ZS1nZW9tZXRyeScpO1xudmFyIHVwZGF0ZVNjcm9sbCA9IHJlcXVpcmUoJy4uL3VwZGF0ZS1zY3JvbGwnKTtcblxuZnVuY3Rpb24gYmluZENsaWNrUmFpbEhhbmRsZXIoZWxlbWVudCwgaSkge1xuICBmdW5jdGlvbiBwYWdlT2Zmc2V0KGVsKSB7XG4gICAgcmV0dXJuIGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICB9XG4gIHZhciBzdG9wUHJvcGFnYXRpb24gPSBmdW5jdGlvbiAoZSkgeyBlLnN0b3BQcm9wYWdhdGlvbigpOyB9O1xuXG4gIGkuZXZlbnQuYmluZChpLnNjcm9sbGJhclksICdjbGljaycsIHN0b3BQcm9wYWdhdGlvbik7XG4gIGkuZXZlbnQuYmluZChpLnNjcm9sbGJhcllSYWlsLCAnY2xpY2snLCBmdW5jdGlvbiAoZSkge1xuICAgIHZhciBwb3NpdGlvblRvcCA9IGUucGFnZVkgLSB3aW5kb3cucGFnZVlPZmZzZXQgLSBwYWdlT2Zmc2V0KGkuc2Nyb2xsYmFyWVJhaWwpLnRvcDtcbiAgICB2YXIgZGlyZWN0aW9uID0gcG9zaXRpb25Ub3AgPiBpLnNjcm9sbGJhcllUb3AgPyAxIDogLTE7XG5cbiAgICB1cGRhdGVTY3JvbGwoZWxlbWVudCwgJ3RvcCcsIGVsZW1lbnQuc2Nyb2xsVG9wICsgZGlyZWN0aW9uICogaS5jb250YWluZXJIZWlnaHQpO1xuICAgIHVwZGF0ZUdlb21ldHJ5KGVsZW1lbnQpO1xuXG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgfSk7XG5cbiAgaS5ldmVudC5iaW5kKGkuc2Nyb2xsYmFyWCwgJ2NsaWNrJywgc3RvcFByb3BhZ2F0aW9uKTtcbiAgaS5ldmVudC5iaW5kKGkuc2Nyb2xsYmFyWFJhaWwsICdjbGljaycsIGZ1bmN0aW9uIChlKSB7XG4gICAgdmFyIHBvc2l0aW9uTGVmdCA9IGUucGFnZVggLSB3aW5kb3cucGFnZVhPZmZzZXQgLSBwYWdlT2Zmc2V0KGkuc2Nyb2xsYmFyWFJhaWwpLmxlZnQ7XG4gICAgdmFyIGRpcmVjdGlvbiA9IHBvc2l0aW9uTGVmdCA+IGkuc2Nyb2xsYmFyWExlZnQgPyAxIDogLTE7XG5cbiAgICB1cGRhdGVTY3JvbGwoZWxlbWVudCwgJ2xlZnQnLCBlbGVtZW50LnNjcm9sbExlZnQgKyBkaXJlY3Rpb24gKiBpLmNvbnRhaW5lcldpZHRoKTtcbiAgICB1cGRhdGVHZW9tZXRyeShlbGVtZW50KTtcblxuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gIHZhciBpID0gaW5zdGFuY2VzLmdldChlbGVtZW50KTtcbiAgYmluZENsaWNrUmFpbEhhbmRsZXIoZWxlbWVudCwgaSk7XG59O1xuXG59LHtcIi4uL2luc3RhbmNlc1wiOjE4LFwiLi4vdXBkYXRlLWdlb21ldHJ5XCI6MTksXCIuLi91cGRhdGUtc2Nyb2xsXCI6MjB9XSwxMTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBfID0gcmVxdWlyZSgnLi4vLi4vbGliL2hlbHBlcicpO1xudmFyIGRvbSA9IHJlcXVpcmUoJy4uLy4uL2xpYi9kb20nKTtcbnZhciBpbnN0YW5jZXMgPSByZXF1aXJlKCcuLi9pbnN0YW5jZXMnKTtcbnZhciB1cGRhdGVHZW9tZXRyeSA9IHJlcXVpcmUoJy4uL3VwZGF0ZS1nZW9tZXRyeScpO1xudmFyIHVwZGF0ZVNjcm9sbCA9IHJlcXVpcmUoJy4uL3VwZGF0ZS1zY3JvbGwnKTtcblxuZnVuY3Rpb24gYmluZE1vdXNlU2Nyb2xsWEhhbmRsZXIoZWxlbWVudCwgaSkge1xuICB2YXIgY3VycmVudExlZnQgPSBudWxsO1xuICB2YXIgY3VycmVudFBhZ2VYID0gbnVsbDtcblxuICBmdW5jdGlvbiB1cGRhdGVTY3JvbGxMZWZ0KGRlbHRhWCkge1xuICAgIHZhciBuZXdMZWZ0ID0gY3VycmVudExlZnQgKyAoZGVsdGFYICogaS5yYWlsWFJhdGlvKTtcbiAgICB2YXIgbWF4TGVmdCA9IE1hdGgubWF4KDAsIGkuc2Nyb2xsYmFyWFJhaWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkubGVmdCkgKyAoaS5yYWlsWFJhdGlvICogKGkucmFpbFhXaWR0aCAtIGkuc2Nyb2xsYmFyWFdpZHRoKSk7XG5cbiAgICBpZiAobmV3TGVmdCA8IDApIHtcbiAgICAgIGkuc2Nyb2xsYmFyWExlZnQgPSAwO1xuICAgIH0gZWxzZSBpZiAobmV3TGVmdCA+IG1heExlZnQpIHtcbiAgICAgIGkuc2Nyb2xsYmFyWExlZnQgPSBtYXhMZWZ0O1xuICAgIH0gZWxzZSB7XG4gICAgICBpLnNjcm9sbGJhclhMZWZ0ID0gbmV3TGVmdDtcbiAgICB9XG5cbiAgICB2YXIgc2Nyb2xsTGVmdCA9IF8udG9JbnQoaS5zY3JvbGxiYXJYTGVmdCAqIChpLmNvbnRlbnRXaWR0aCAtIGkuY29udGFpbmVyV2lkdGgpIC8gKGkuY29udGFpbmVyV2lkdGggLSAoaS5yYWlsWFJhdGlvICogaS5zY3JvbGxiYXJYV2lkdGgpKSkgLSBpLm5lZ2F0aXZlU2Nyb2xsQWRqdXN0bWVudDtcbiAgICB1cGRhdGVTY3JvbGwoZWxlbWVudCwgJ2xlZnQnLCBzY3JvbGxMZWZ0KTtcbiAgfVxuXG4gIHZhciBtb3VzZU1vdmVIYW5kbGVyID0gZnVuY3Rpb24gKGUpIHtcbiAgICB1cGRhdGVTY3JvbGxMZWZ0KGUucGFnZVggLSBjdXJyZW50UGFnZVgpO1xuICAgIHVwZGF0ZUdlb21ldHJ5KGVsZW1lbnQpO1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICB9O1xuXG4gIHZhciBtb3VzZVVwSGFuZGxlciA9IGZ1bmN0aW9uICgpIHtcbiAgICBfLnN0b3BTY3JvbGxpbmcoZWxlbWVudCwgJ3gnKTtcbiAgICBpLmV2ZW50LnVuYmluZChpLm93bmVyRG9jdW1lbnQsICdtb3VzZW1vdmUnLCBtb3VzZU1vdmVIYW5kbGVyKTtcbiAgfTtcblxuICBpLmV2ZW50LmJpbmQoaS5zY3JvbGxiYXJYLCAnbW91c2Vkb3duJywgZnVuY3Rpb24gKGUpIHtcbiAgICBjdXJyZW50UGFnZVggPSBlLnBhZ2VYO1xuICAgIGN1cnJlbnRMZWZ0ID0gXy50b0ludChkb20uY3NzKGkuc2Nyb2xsYmFyWCwgJ2xlZnQnKSkgKiBpLnJhaWxYUmF0aW87XG4gICAgXy5zdGFydFNjcm9sbGluZyhlbGVtZW50LCAneCcpO1xuXG4gICAgaS5ldmVudC5iaW5kKGkub3duZXJEb2N1bWVudCwgJ21vdXNlbW92ZScsIG1vdXNlTW92ZUhhbmRsZXIpO1xuICAgIGkuZXZlbnQub25jZShpLm93bmVyRG9jdW1lbnQsICdtb3VzZXVwJywgbW91c2VVcEhhbmRsZXIpO1xuXG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBiaW5kTW91c2VTY3JvbGxZSGFuZGxlcihlbGVtZW50LCBpKSB7XG4gIHZhciBjdXJyZW50VG9wID0gbnVsbDtcbiAgdmFyIGN1cnJlbnRQYWdlWSA9IG51bGw7XG5cbiAgZnVuY3Rpb24gdXBkYXRlU2Nyb2xsVG9wKGRlbHRhWSkge1xuICAgIHZhciBuZXdUb3AgPSBjdXJyZW50VG9wICsgKGRlbHRhWSAqIGkucmFpbFlSYXRpbyk7XG4gICAgdmFyIG1heFRvcCA9IE1hdGgubWF4KDAsIGkuc2Nyb2xsYmFyWVJhaWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wKSArIChpLnJhaWxZUmF0aW8gKiAoaS5yYWlsWUhlaWdodCAtIGkuc2Nyb2xsYmFyWUhlaWdodCkpO1xuXG4gICAgaWYgKG5ld1RvcCA8IDApIHtcbiAgICAgIGkuc2Nyb2xsYmFyWVRvcCA9IDA7XG4gICAgfSBlbHNlIGlmIChuZXdUb3AgPiBtYXhUb3ApIHtcbiAgICAgIGkuc2Nyb2xsYmFyWVRvcCA9IG1heFRvcDtcbiAgICB9IGVsc2Uge1xuICAgICAgaS5zY3JvbGxiYXJZVG9wID0gbmV3VG9wO1xuICAgIH1cblxuICAgIHZhciBzY3JvbGxUb3AgPSBfLnRvSW50KGkuc2Nyb2xsYmFyWVRvcCAqIChpLmNvbnRlbnRIZWlnaHQgLSBpLmNvbnRhaW5lckhlaWdodCkgLyAoaS5jb250YWluZXJIZWlnaHQgLSAoaS5yYWlsWVJhdGlvICogaS5zY3JvbGxiYXJZSGVpZ2h0KSkpO1xuICAgIHVwZGF0ZVNjcm9sbChlbGVtZW50LCAndG9wJywgc2Nyb2xsVG9wKTtcbiAgfVxuXG4gIHZhciBtb3VzZU1vdmVIYW5kbGVyID0gZnVuY3Rpb24gKGUpIHtcbiAgICB1cGRhdGVTY3JvbGxUb3AoZS5wYWdlWSAtIGN1cnJlbnRQYWdlWSk7XG4gICAgdXBkYXRlR2VvbWV0cnkoZWxlbWVudCk7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gIH07XG5cbiAgdmFyIG1vdXNlVXBIYW5kbGVyID0gZnVuY3Rpb24gKCkge1xuICAgIF8uc3RvcFNjcm9sbGluZyhlbGVtZW50LCAneScpO1xuICAgIGkuZXZlbnQudW5iaW5kKGkub3duZXJEb2N1bWVudCwgJ21vdXNlbW92ZScsIG1vdXNlTW92ZUhhbmRsZXIpO1xuICB9O1xuXG4gIGkuZXZlbnQuYmluZChpLnNjcm9sbGJhclksICdtb3VzZWRvd24nLCBmdW5jdGlvbiAoZSkge1xuICAgIGN1cnJlbnRQYWdlWSA9IGUucGFnZVk7XG4gICAgY3VycmVudFRvcCA9IF8udG9JbnQoZG9tLmNzcyhpLnNjcm9sbGJhclksICd0b3AnKSkgKiBpLnJhaWxZUmF0aW87XG4gICAgXy5zdGFydFNjcm9sbGluZyhlbGVtZW50LCAneScpO1xuXG4gICAgaS5ldmVudC5iaW5kKGkub3duZXJEb2N1bWVudCwgJ21vdXNlbW92ZScsIG1vdXNlTW92ZUhhbmRsZXIpO1xuICAgIGkuZXZlbnQub25jZShpLm93bmVyRG9jdW1lbnQsICdtb3VzZXVwJywgbW91c2VVcEhhbmRsZXIpO1xuXG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gIH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gIHZhciBpID0gaW5zdGFuY2VzLmdldChlbGVtZW50KTtcbiAgYmluZE1vdXNlU2Nyb2xsWEhhbmRsZXIoZWxlbWVudCwgaSk7XG4gIGJpbmRNb3VzZVNjcm9sbFlIYW5kbGVyKGVsZW1lbnQsIGkpO1xufTtcblxufSx7XCIuLi8uLi9saWIvZG9tXCI6MyxcIi4uLy4uL2xpYi9oZWxwZXJcIjo2LFwiLi4vaW5zdGFuY2VzXCI6MTgsXCIuLi91cGRhdGUtZ2VvbWV0cnlcIjoxOSxcIi4uL3VwZGF0ZS1zY3JvbGxcIjoyMH1dLDEyOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIF8gPSByZXF1aXJlKCcuLi8uLi9saWIvaGVscGVyJyk7XG52YXIgZG9tID0gcmVxdWlyZSgnLi4vLi4vbGliL2RvbScpO1xudmFyIGluc3RhbmNlcyA9IHJlcXVpcmUoJy4uL2luc3RhbmNlcycpO1xudmFyIHVwZGF0ZUdlb21ldHJ5ID0gcmVxdWlyZSgnLi4vdXBkYXRlLWdlb21ldHJ5Jyk7XG52YXIgdXBkYXRlU2Nyb2xsID0gcmVxdWlyZSgnLi4vdXBkYXRlLXNjcm9sbCcpO1xuXG5mdW5jdGlvbiBiaW5kS2V5Ym9hcmRIYW5kbGVyKGVsZW1lbnQsIGkpIHtcbiAgdmFyIGhvdmVyZWQgPSBmYWxzZTtcbiAgaS5ldmVudC5iaW5kKGVsZW1lbnQsICdtb3VzZWVudGVyJywgZnVuY3Rpb24gKCkge1xuICAgIGhvdmVyZWQgPSB0cnVlO1xuICB9KTtcbiAgaS5ldmVudC5iaW5kKGVsZW1lbnQsICdtb3VzZWxlYXZlJywgZnVuY3Rpb24gKCkge1xuICAgIGhvdmVyZWQgPSBmYWxzZTtcbiAgfSk7XG5cbiAgdmFyIHNob3VsZFByZXZlbnQgPSBmYWxzZTtcbiAgZnVuY3Rpb24gc2hvdWxkUHJldmVudERlZmF1bHQoZGVsdGFYLCBkZWx0YVkpIHtcbiAgICB2YXIgc2Nyb2xsVG9wID0gZWxlbWVudC5zY3JvbGxUb3A7XG4gICAgaWYgKGRlbHRhWCA9PT0gMCkge1xuICAgICAgaWYgKCFpLnNjcm9sbGJhcllBY3RpdmUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaWYgKChzY3JvbGxUb3AgPT09IDAgJiYgZGVsdGFZID4gMCkgfHwgKHNjcm9sbFRvcCA+PSBpLmNvbnRlbnRIZWlnaHQgLSBpLmNvbnRhaW5lckhlaWdodCAmJiBkZWx0YVkgPCAwKSkge1xuICAgICAgICByZXR1cm4gIWkuc2V0dGluZ3Mud2hlZWxQcm9wYWdhdGlvbjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgc2Nyb2xsTGVmdCA9IGVsZW1lbnQuc2Nyb2xsTGVmdDtcbiAgICBpZiAoZGVsdGFZID09PSAwKSB7XG4gICAgICBpZiAoIWkuc2Nyb2xsYmFyWEFjdGl2ZSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAoKHNjcm9sbExlZnQgPT09IDAgJiYgZGVsdGFYIDwgMCkgfHwgKHNjcm9sbExlZnQgPj0gaS5jb250ZW50V2lkdGggLSBpLmNvbnRhaW5lcldpZHRoICYmIGRlbHRhWCA+IDApKSB7XG4gICAgICAgIHJldHVybiAhaS5zZXR0aW5ncy53aGVlbFByb3BhZ2F0aW9uO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGkuZXZlbnQuYmluZChpLm93bmVyRG9jdW1lbnQsICdrZXlkb3duJywgZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAoKGUuaXNEZWZhdWx0UHJldmVudGVkICYmIGUuaXNEZWZhdWx0UHJldmVudGVkKCkpIHx8IGUuZGVmYXVsdFByZXZlbnRlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBmb2N1c2VkID0gZG9tLm1hdGNoZXMoaS5zY3JvbGxiYXJYLCAnOmZvY3VzJykgfHxcbiAgICAgICAgICAgICAgICAgIGRvbS5tYXRjaGVzKGkuc2Nyb2xsYmFyWSwgJzpmb2N1cycpO1xuXG4gICAgaWYgKCFob3ZlcmVkICYmICFmb2N1c2VkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGFjdGl2ZUVsZW1lbnQgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50ID8gZG9jdW1lbnQuYWN0aXZlRWxlbWVudCA6IGkub3duZXJEb2N1bWVudC5hY3RpdmVFbGVtZW50O1xuICAgIGlmIChhY3RpdmVFbGVtZW50KSB7XG4gICAgICBpZiAoYWN0aXZlRWxlbWVudC50YWdOYW1lID09PSAnSUZSQU1FJykge1xuICAgICAgICBhY3RpdmVFbGVtZW50ID0gYWN0aXZlRWxlbWVudC5jb250ZW50RG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGdvIGRlZXBlciBpZiBlbGVtZW50IGlzIGEgd2ViY29tcG9uZW50XG4gICAgICAgIHdoaWxlIChhY3RpdmVFbGVtZW50LnNoYWRvd1Jvb3QpIHtcbiAgICAgICAgICBhY3RpdmVFbGVtZW50ID0gYWN0aXZlRWxlbWVudC5zaGFkb3dSb290LmFjdGl2ZUVsZW1lbnQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChfLmlzRWRpdGFibGUoYWN0aXZlRWxlbWVudCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBkZWx0YVggPSAwO1xuICAgIHZhciBkZWx0YVkgPSAwO1xuXG4gICAgc3dpdGNoIChlLndoaWNoKSB7XG4gICAgY2FzZSAzNzogLy8gbGVmdFxuICAgICAgaWYgKGUubWV0YUtleSkge1xuICAgICAgICBkZWx0YVggPSAtaS5jb250ZW50V2lkdGg7XG4gICAgICB9IGVsc2UgaWYgKGUuYWx0S2V5KSB7XG4gICAgICAgIGRlbHRhWCA9IC1pLmNvbnRhaW5lcldpZHRoO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGVsdGFYID0gLTMwO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAzODogLy8gdXBcbiAgICAgIGlmIChlLm1ldGFLZXkpIHtcbiAgICAgICAgZGVsdGFZID0gaS5jb250ZW50SGVpZ2h0O1xuICAgICAgfSBlbHNlIGlmIChlLmFsdEtleSkge1xuICAgICAgICBkZWx0YVkgPSBpLmNvbnRhaW5lckhlaWdodDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRlbHRhWSA9IDMwO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAzOTogLy8gcmlnaHRcbiAgICAgIGlmIChlLm1ldGFLZXkpIHtcbiAgICAgICAgZGVsdGFYID0gaS5jb250ZW50V2lkdGg7XG4gICAgICB9IGVsc2UgaWYgKGUuYWx0S2V5KSB7XG4gICAgICAgIGRlbHRhWCA9IGkuY29udGFpbmVyV2lkdGg7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkZWx0YVggPSAzMDtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgNDA6IC8vIGRvd25cbiAgICAgIGlmIChlLm1ldGFLZXkpIHtcbiAgICAgICAgZGVsdGFZID0gLWkuY29udGVudEhlaWdodDtcbiAgICAgIH0gZWxzZSBpZiAoZS5hbHRLZXkpIHtcbiAgICAgICAgZGVsdGFZID0gLWkuY29udGFpbmVySGVpZ2h0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGVsdGFZID0gLTMwO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAzMzogLy8gcGFnZSB1cFxuICAgICAgZGVsdGFZID0gOTA7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDMyOiAvLyBzcGFjZSBiYXJcbiAgICAgIGlmIChlLnNoaWZ0S2V5KSB7XG4gICAgICAgIGRlbHRhWSA9IDkwO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGVsdGFZID0gLTkwO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAzNDogLy8gcGFnZSBkb3duXG4gICAgICBkZWx0YVkgPSAtOTA7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDM1OiAvLyBlbmRcbiAgICAgIGlmIChlLmN0cmxLZXkpIHtcbiAgICAgICAgZGVsdGFZID0gLWkuY29udGVudEhlaWdodDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRlbHRhWSA9IC1pLmNvbnRhaW5lckhlaWdodDtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgMzY6IC8vIGhvbWVcbiAgICAgIGlmIChlLmN0cmxLZXkpIHtcbiAgICAgICAgZGVsdGFZID0gZWxlbWVudC5zY3JvbGxUb3A7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkZWx0YVkgPSBpLmNvbnRhaW5lckhlaWdodDtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdXBkYXRlU2Nyb2xsKGVsZW1lbnQsICd0b3AnLCBlbGVtZW50LnNjcm9sbFRvcCAtIGRlbHRhWSk7XG4gICAgdXBkYXRlU2Nyb2xsKGVsZW1lbnQsICdsZWZ0JywgZWxlbWVudC5zY3JvbGxMZWZ0ICsgZGVsdGFYKTtcbiAgICB1cGRhdGVHZW9tZXRyeShlbGVtZW50KTtcblxuICAgIHNob3VsZFByZXZlbnQgPSBzaG91bGRQcmV2ZW50RGVmYXVsdChkZWx0YVgsIGRlbHRhWSk7XG4gICAgaWYgKHNob3VsZFByZXZlbnQpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG4gIH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gIHZhciBpID0gaW5zdGFuY2VzLmdldChlbGVtZW50KTtcbiAgYmluZEtleWJvYXJkSGFuZGxlcihlbGVtZW50LCBpKTtcbn07XG5cbn0se1wiLi4vLi4vbGliL2RvbVwiOjMsXCIuLi8uLi9saWIvaGVscGVyXCI6NixcIi4uL2luc3RhbmNlc1wiOjE4LFwiLi4vdXBkYXRlLWdlb21ldHJ5XCI6MTksXCIuLi91cGRhdGUtc2Nyb2xsXCI6MjB9XSwxMzpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBpbnN0YW5jZXMgPSByZXF1aXJlKCcuLi9pbnN0YW5jZXMnKTtcbnZhciB1cGRhdGVHZW9tZXRyeSA9IHJlcXVpcmUoJy4uL3VwZGF0ZS1nZW9tZXRyeScpO1xudmFyIHVwZGF0ZVNjcm9sbCA9IHJlcXVpcmUoJy4uL3VwZGF0ZS1zY3JvbGwnKTtcblxuZnVuY3Rpb24gYmluZE1vdXNlV2hlZWxIYW5kbGVyKGVsZW1lbnQsIGkpIHtcbiAgdmFyIHNob3VsZFByZXZlbnQgPSBmYWxzZTtcblxuICBmdW5jdGlvbiBzaG91bGRQcmV2ZW50RGVmYXVsdChkZWx0YVgsIGRlbHRhWSkge1xuICAgIHZhciBzY3JvbGxUb3AgPSBlbGVtZW50LnNjcm9sbFRvcDtcbiAgICBpZiAoZGVsdGFYID09PSAwKSB7XG4gICAgICBpZiAoIWkuc2Nyb2xsYmFyWUFjdGl2ZSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAoKHNjcm9sbFRvcCA9PT0gMCAmJiBkZWx0YVkgPiAwKSB8fCAoc2Nyb2xsVG9wID49IGkuY29udGVudEhlaWdodCAtIGkuY29udGFpbmVySGVpZ2h0ICYmIGRlbHRhWSA8IDApKSB7XG4gICAgICAgIHJldHVybiAhaS5zZXR0aW5ncy53aGVlbFByb3BhZ2F0aW9uO1xuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBzY3JvbGxMZWZ0ID0gZWxlbWVudC5zY3JvbGxMZWZ0O1xuICAgIGlmIChkZWx0YVkgPT09IDApIHtcbiAgICAgIGlmICghaS5zY3JvbGxiYXJYQWN0aXZlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmICgoc2Nyb2xsTGVmdCA9PT0gMCAmJiBkZWx0YVggPCAwKSB8fCAoc2Nyb2xsTGVmdCA+PSBpLmNvbnRlbnRXaWR0aCAtIGkuY29udGFpbmVyV2lkdGggJiYgZGVsdGFYID4gMCkpIHtcbiAgICAgICAgcmV0dXJuICFpLnNldHRpbmdzLndoZWVsUHJvcGFnYXRpb247XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0RGVsdGFGcm9tRXZlbnQoZSkge1xuICAgIHZhciBkZWx0YVggPSBlLmRlbHRhWDtcbiAgICB2YXIgZGVsdGFZID0gLTEgKiBlLmRlbHRhWTtcblxuICAgIGlmICh0eXBlb2YgZGVsdGFYID09PSBcInVuZGVmaW5lZFwiIHx8IHR5cGVvZiBkZWx0YVkgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIC8vIE9TIFggU2FmYXJpXG4gICAgICBkZWx0YVggPSAtMSAqIGUud2hlZWxEZWx0YVggLyA2O1xuICAgICAgZGVsdGFZID0gZS53aGVlbERlbHRhWSAvIDY7XG4gICAgfVxuXG4gICAgaWYgKGUuZGVsdGFNb2RlICYmIGUuZGVsdGFNb2RlID09PSAxKSB7XG4gICAgICAvLyBGaXJlZm94IGluIGRlbHRhTW9kZSAxOiBMaW5lIHNjcm9sbGluZ1xuICAgICAgZGVsdGFYICo9IDEwO1xuICAgICAgZGVsdGFZICo9IDEwO1xuICAgIH1cblxuICAgIGlmIChkZWx0YVggIT09IGRlbHRhWCAmJiBkZWx0YVkgIT09IGRlbHRhWS8qIE5hTiBjaGVja3MgKi8pIHtcbiAgICAgIC8vIElFIGluIHNvbWUgbW91c2UgZHJpdmVyc1xuICAgICAgZGVsdGFYID0gMDtcbiAgICAgIGRlbHRhWSA9IGUud2hlZWxEZWx0YTtcbiAgICB9XG5cbiAgICBpZiAoZS5zaGlmdEtleSkge1xuICAgICAgLy8gcmV2ZXJzZSBheGlzIHdpdGggc2hpZnQga2V5XG4gICAgICByZXR1cm4gWy1kZWx0YVksIC1kZWx0YVhdO1xuICAgIH1cbiAgICByZXR1cm4gW2RlbHRhWCwgZGVsdGFZXTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3VsZEJlQ29uc3VtZWRCeUNoaWxkKGRlbHRhWCwgZGVsdGFZKSB7XG4gICAgdmFyIGNoaWxkID0gZWxlbWVudC5xdWVyeVNlbGVjdG9yKCd0ZXh0YXJlYTpob3Zlciwgc2VsZWN0W211bHRpcGxlXTpob3ZlciwgLnBzLWNoaWxkOmhvdmVyJyk7XG4gICAgaWYgKGNoaWxkKSB7XG4gICAgICBpZiAoIXdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGNoaWxkKS5vdmVyZmxvdy5tYXRjaCgvKHNjcm9sbHxhdXRvKS8pKSB7XG4gICAgICAgIC8vIGlmIG5vdCBzY3JvbGxhYmxlXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgdmFyIG1heFNjcm9sbFRvcCA9IGNoaWxkLnNjcm9sbEhlaWdodCAtIGNoaWxkLmNsaWVudEhlaWdodDtcbiAgICAgIGlmIChtYXhTY3JvbGxUb3AgPiAwKSB7XG4gICAgICAgIGlmICghKGNoaWxkLnNjcm9sbFRvcCA9PT0gMCAmJiBkZWx0YVkgPiAwKSAmJiAhKGNoaWxkLnNjcm9sbFRvcCA9PT0gbWF4U2Nyb2xsVG9wICYmIGRlbHRhWSA8IDApKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHZhciBtYXhTY3JvbGxMZWZ0ID0gY2hpbGQuc2Nyb2xsTGVmdCAtIGNoaWxkLmNsaWVudFdpZHRoO1xuICAgICAgaWYgKG1heFNjcm9sbExlZnQgPiAwKSB7XG4gICAgICAgIGlmICghKGNoaWxkLnNjcm9sbExlZnQgPT09IDAgJiYgZGVsdGFYIDwgMCkgJiYgIShjaGlsZC5zY3JvbGxMZWZ0ID09PSBtYXhTY3JvbGxMZWZ0ICYmIGRlbHRhWCA+IDApKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgZnVuY3Rpb24gbW91c2V3aGVlbEhhbmRsZXIoZSkge1xuICAgIHZhciBkZWx0YSA9IGdldERlbHRhRnJvbUV2ZW50KGUpO1xuXG4gICAgdmFyIGRlbHRhWCA9IGRlbHRhWzBdO1xuICAgIHZhciBkZWx0YVkgPSBkZWx0YVsxXTtcblxuICAgIGlmIChzaG91bGRCZUNvbnN1bWVkQnlDaGlsZChkZWx0YVgsIGRlbHRhWSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzaG91bGRQcmV2ZW50ID0gZmFsc2U7XG4gICAgaWYgKCFpLnNldHRpbmdzLnVzZUJvdGhXaGVlbEF4ZXMpIHtcbiAgICAgIC8vIGRlbHRhWCB3aWxsIG9ubHkgYmUgdXNlZCBmb3IgaG9yaXpvbnRhbCBzY3JvbGxpbmcgYW5kIGRlbHRhWSB3aWxsXG4gICAgICAvLyBvbmx5IGJlIHVzZWQgZm9yIHZlcnRpY2FsIHNjcm9sbGluZyAtIHRoaXMgaXMgdGhlIGRlZmF1bHRcbiAgICAgIHVwZGF0ZVNjcm9sbChlbGVtZW50LCAndG9wJywgZWxlbWVudC5zY3JvbGxUb3AgLSAoZGVsdGFZICogaS5zZXR0aW5ncy53aGVlbFNwZWVkKSk7XG4gICAgICB1cGRhdGVTY3JvbGwoZWxlbWVudCwgJ2xlZnQnLCBlbGVtZW50LnNjcm9sbExlZnQgKyAoZGVsdGFYICogaS5zZXR0aW5ncy53aGVlbFNwZWVkKSk7XG4gICAgfSBlbHNlIGlmIChpLnNjcm9sbGJhcllBY3RpdmUgJiYgIWkuc2Nyb2xsYmFyWEFjdGl2ZSkge1xuICAgICAgLy8gb25seSB2ZXJ0aWNhbCBzY3JvbGxiYXIgaXMgYWN0aXZlIGFuZCB1c2VCb3RoV2hlZWxBeGVzIG9wdGlvbiBpc1xuICAgICAgLy8gYWN0aXZlLCBzbyBsZXQncyBzY3JvbGwgdmVydGljYWwgYmFyIHVzaW5nIGJvdGggbW91c2Ugd2hlZWwgYXhlc1xuICAgICAgaWYgKGRlbHRhWSkge1xuICAgICAgICB1cGRhdGVTY3JvbGwoZWxlbWVudCwgJ3RvcCcsIGVsZW1lbnQuc2Nyb2xsVG9wIC0gKGRlbHRhWSAqIGkuc2V0dGluZ3Mud2hlZWxTcGVlZCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdXBkYXRlU2Nyb2xsKGVsZW1lbnQsICd0b3AnLCBlbGVtZW50LnNjcm9sbFRvcCArIChkZWx0YVggKiBpLnNldHRpbmdzLndoZWVsU3BlZWQpKTtcbiAgICAgIH1cbiAgICAgIHNob3VsZFByZXZlbnQgPSB0cnVlO1xuICAgIH0gZWxzZSBpZiAoaS5zY3JvbGxiYXJYQWN0aXZlICYmICFpLnNjcm9sbGJhcllBY3RpdmUpIHtcbiAgICAgIC8vIHVzZUJvdGhXaGVlbEF4ZXMgYW5kIG9ubHkgaG9yaXpvbnRhbCBiYXIgaXMgYWN0aXZlLCBzbyB1c2UgYm90aFxuICAgICAgLy8gd2hlZWwgYXhlcyBmb3IgaG9yaXpvbnRhbCBiYXJcbiAgICAgIGlmIChkZWx0YVgpIHtcbiAgICAgICAgdXBkYXRlU2Nyb2xsKGVsZW1lbnQsICdsZWZ0JywgZWxlbWVudC5zY3JvbGxMZWZ0ICsgKGRlbHRhWCAqIGkuc2V0dGluZ3Mud2hlZWxTcGVlZCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdXBkYXRlU2Nyb2xsKGVsZW1lbnQsICdsZWZ0JywgZWxlbWVudC5zY3JvbGxMZWZ0IC0gKGRlbHRhWSAqIGkuc2V0dGluZ3Mud2hlZWxTcGVlZCkpO1xuICAgICAgfVxuICAgICAgc2hvdWxkUHJldmVudCA9IHRydWU7XG4gICAgfVxuXG4gICAgdXBkYXRlR2VvbWV0cnkoZWxlbWVudCk7XG5cbiAgICBzaG91bGRQcmV2ZW50ID0gKHNob3VsZFByZXZlbnQgfHwgc2hvdWxkUHJldmVudERlZmF1bHQoZGVsdGFYLCBkZWx0YVkpKTtcbiAgICBpZiAoc2hvdWxkUHJldmVudCkge1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG4gIH1cblxuICBpZiAodHlwZW9mIHdpbmRvdy5vbndoZWVsICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgaS5ldmVudC5iaW5kKGVsZW1lbnQsICd3aGVlbCcsIG1vdXNld2hlZWxIYW5kbGVyKTtcbiAgfSBlbHNlIGlmICh0eXBlb2Ygd2luZG93Lm9ubW91c2V3aGVlbCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgIGkuZXZlbnQuYmluZChlbGVtZW50LCAnbW91c2V3aGVlbCcsIG1vdXNld2hlZWxIYW5kbGVyKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gIHZhciBpID0gaW5zdGFuY2VzLmdldChlbGVtZW50KTtcbiAgYmluZE1vdXNlV2hlZWxIYW5kbGVyKGVsZW1lbnQsIGkpO1xufTtcblxufSx7XCIuLi9pbnN0YW5jZXNcIjoxOCxcIi4uL3VwZGF0ZS1nZW9tZXRyeVwiOjE5LFwiLi4vdXBkYXRlLXNjcm9sbFwiOjIwfV0sMTQ6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgaW5zdGFuY2VzID0gcmVxdWlyZSgnLi4vaW5zdGFuY2VzJyk7XG52YXIgdXBkYXRlR2VvbWV0cnkgPSByZXF1aXJlKCcuLi91cGRhdGUtZ2VvbWV0cnknKTtcblxuZnVuY3Rpb24gYmluZE5hdGl2ZVNjcm9sbEhhbmRsZXIoZWxlbWVudCwgaSkge1xuICBpLmV2ZW50LmJpbmQoZWxlbWVudCwgJ3Njcm9sbCcsIGZ1bmN0aW9uICgpIHtcbiAgICB1cGRhdGVHZW9tZXRyeShlbGVtZW50KTtcbiAgfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgdmFyIGkgPSBpbnN0YW5jZXMuZ2V0KGVsZW1lbnQpO1xuICBiaW5kTmF0aXZlU2Nyb2xsSGFuZGxlcihlbGVtZW50LCBpKTtcbn07XG5cbn0se1wiLi4vaW5zdGFuY2VzXCI6MTgsXCIuLi91cGRhdGUtZ2VvbWV0cnlcIjoxOX1dLDE1OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIF8gPSByZXF1aXJlKCcuLi8uLi9saWIvaGVscGVyJyk7XG52YXIgaW5zdGFuY2VzID0gcmVxdWlyZSgnLi4vaW5zdGFuY2VzJyk7XG52YXIgdXBkYXRlR2VvbWV0cnkgPSByZXF1aXJlKCcuLi91cGRhdGUtZ2VvbWV0cnknKTtcbnZhciB1cGRhdGVTY3JvbGwgPSByZXF1aXJlKCcuLi91cGRhdGUtc2Nyb2xsJyk7XG5cbmZ1bmN0aW9uIGJpbmRTZWxlY3Rpb25IYW5kbGVyKGVsZW1lbnQsIGkpIHtcbiAgZnVuY3Rpb24gZ2V0UmFuZ2VOb2RlKCkge1xuICAgIHZhciBzZWxlY3Rpb24gPSB3aW5kb3cuZ2V0U2VsZWN0aW9uID8gd2luZG93LmdldFNlbGVjdGlvbigpIDpcbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuZ2V0U2VsZWN0aW9uID8gZG9jdW1lbnQuZ2V0U2VsZWN0aW9uKCkgOiAnJztcbiAgICBpZiAoc2VsZWN0aW9uLnRvU3RyaW5nKCkubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHNlbGVjdGlvbi5nZXRSYW5nZUF0KDApLmNvbW1vbkFuY2VzdG9yQ29udGFpbmVyO1xuICAgIH1cbiAgfVxuXG4gIHZhciBzY3JvbGxpbmdMb29wID0gbnVsbDtcbiAgdmFyIHNjcm9sbERpZmYgPSB7dG9wOiAwLCBsZWZ0OiAwfTtcbiAgZnVuY3Rpb24gc3RhcnRTY3JvbGxpbmcoKSB7XG4gICAgaWYgKCFzY3JvbGxpbmdMb29wKSB7XG4gICAgICBzY3JvbGxpbmdMb29wID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIWluc3RhbmNlcy5nZXQoZWxlbWVudCkpIHtcbiAgICAgICAgICBjbGVhckludGVydmFsKHNjcm9sbGluZ0xvb3ApO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHVwZGF0ZVNjcm9sbChlbGVtZW50LCAndG9wJywgZWxlbWVudC5zY3JvbGxUb3AgKyBzY3JvbGxEaWZmLnRvcCk7XG4gICAgICAgIHVwZGF0ZVNjcm9sbChlbGVtZW50LCAnbGVmdCcsIGVsZW1lbnQuc2Nyb2xsTGVmdCArIHNjcm9sbERpZmYubGVmdCk7XG4gICAgICAgIHVwZGF0ZUdlb21ldHJ5KGVsZW1lbnQpO1xuICAgICAgfSwgNTApOyAvLyBldmVyeSAuMSBzZWNcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gc3RvcFNjcm9sbGluZygpIHtcbiAgICBpZiAoc2Nyb2xsaW5nTG9vcCkge1xuICAgICAgY2xlYXJJbnRlcnZhbChzY3JvbGxpbmdMb29wKTtcbiAgICAgIHNjcm9sbGluZ0xvb3AgPSBudWxsO1xuICAgIH1cbiAgICBfLnN0b3BTY3JvbGxpbmcoZWxlbWVudCk7XG4gIH1cblxuICB2YXIgaXNTZWxlY3RlZCA9IGZhbHNlO1xuICBpLmV2ZW50LmJpbmQoaS5vd25lckRvY3VtZW50LCAnc2VsZWN0aW9uY2hhbmdlJywgZnVuY3Rpb24gKCkge1xuICAgIGlmIChlbGVtZW50LmNvbnRhaW5zKGdldFJhbmdlTm9kZSgpKSkge1xuICAgICAgaXNTZWxlY3RlZCA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlzU2VsZWN0ZWQgPSBmYWxzZTtcbiAgICAgIHN0b3BTY3JvbGxpbmcoKTtcbiAgICB9XG4gIH0pO1xuICBpLmV2ZW50LmJpbmQod2luZG93LCAnbW91c2V1cCcsIGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoaXNTZWxlY3RlZCkge1xuICAgICAgaXNTZWxlY3RlZCA9IGZhbHNlO1xuICAgICAgc3RvcFNjcm9sbGluZygpO1xuICAgIH1cbiAgfSk7XG4gIGkuZXZlbnQuYmluZCh3aW5kb3csICdrZXl1cCcsIGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoaXNTZWxlY3RlZCkge1xuICAgICAgaXNTZWxlY3RlZCA9IGZhbHNlO1xuICAgICAgc3RvcFNjcm9sbGluZygpO1xuICAgIH1cbiAgfSk7XG5cbiAgaS5ldmVudC5iaW5kKHdpbmRvdywgJ21vdXNlbW92ZScsIGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKGlzU2VsZWN0ZWQpIHtcbiAgICAgIHZhciBtb3VzZVBvc2l0aW9uID0ge3g6IGUucGFnZVgsIHk6IGUucGFnZVl9O1xuICAgICAgdmFyIGNvbnRhaW5lckdlb21ldHJ5ID0ge1xuICAgICAgICBsZWZ0OiBlbGVtZW50Lm9mZnNldExlZnQsXG4gICAgICAgIHJpZ2h0OiBlbGVtZW50Lm9mZnNldExlZnQgKyBlbGVtZW50Lm9mZnNldFdpZHRoLFxuICAgICAgICB0b3A6IGVsZW1lbnQub2Zmc2V0VG9wLFxuICAgICAgICBib3R0b206IGVsZW1lbnQub2Zmc2V0VG9wICsgZWxlbWVudC5vZmZzZXRIZWlnaHRcbiAgICAgIH07XG5cbiAgICAgIGlmIChtb3VzZVBvc2l0aW9uLnggPCBjb250YWluZXJHZW9tZXRyeS5sZWZ0ICsgMykge1xuICAgICAgICBzY3JvbGxEaWZmLmxlZnQgPSAtNTtcbiAgICAgICAgXy5zdGFydFNjcm9sbGluZyhlbGVtZW50LCAneCcpO1xuICAgICAgfSBlbHNlIGlmIChtb3VzZVBvc2l0aW9uLnggPiBjb250YWluZXJHZW9tZXRyeS5yaWdodCAtIDMpIHtcbiAgICAgICAgc2Nyb2xsRGlmZi5sZWZ0ID0gNTtcbiAgICAgICAgXy5zdGFydFNjcm9sbGluZyhlbGVtZW50LCAneCcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2Nyb2xsRGlmZi5sZWZ0ID0gMDtcbiAgICAgIH1cblxuICAgICAgaWYgKG1vdXNlUG9zaXRpb24ueSA8IGNvbnRhaW5lckdlb21ldHJ5LnRvcCArIDMpIHtcbiAgICAgICAgaWYgKGNvbnRhaW5lckdlb21ldHJ5LnRvcCArIDMgLSBtb3VzZVBvc2l0aW9uLnkgPCA1KSB7XG4gICAgICAgICAgc2Nyb2xsRGlmZi50b3AgPSAtNTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzY3JvbGxEaWZmLnRvcCA9IC0yMDtcbiAgICAgICAgfVxuICAgICAgICBfLnN0YXJ0U2Nyb2xsaW5nKGVsZW1lbnQsICd5Jyk7XG4gICAgICB9IGVsc2UgaWYgKG1vdXNlUG9zaXRpb24ueSA+IGNvbnRhaW5lckdlb21ldHJ5LmJvdHRvbSAtIDMpIHtcbiAgICAgICAgaWYgKG1vdXNlUG9zaXRpb24ueSAtIGNvbnRhaW5lckdlb21ldHJ5LmJvdHRvbSArIDMgPCA1KSB7XG4gICAgICAgICAgc2Nyb2xsRGlmZi50b3AgPSA1O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNjcm9sbERpZmYudG9wID0gMjA7XG4gICAgICAgIH1cbiAgICAgICAgXy5zdGFydFNjcm9sbGluZyhlbGVtZW50LCAneScpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2Nyb2xsRGlmZi50b3AgPSAwO1xuICAgICAgfVxuXG4gICAgICBpZiAoc2Nyb2xsRGlmZi50b3AgPT09IDAgJiYgc2Nyb2xsRGlmZi5sZWZ0ID09PSAwKSB7XG4gICAgICAgIHN0b3BTY3JvbGxpbmcoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0YXJ0U2Nyb2xsaW5nKCk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICB2YXIgaSA9IGluc3RhbmNlcy5nZXQoZWxlbWVudCk7XG4gIGJpbmRTZWxlY3Rpb25IYW5kbGVyKGVsZW1lbnQsIGkpO1xufTtcblxufSx7XCIuLi8uLi9saWIvaGVscGVyXCI6NixcIi4uL2luc3RhbmNlc1wiOjE4LFwiLi4vdXBkYXRlLWdlb21ldHJ5XCI6MTksXCIuLi91cGRhdGUtc2Nyb2xsXCI6MjB9XSwxNjpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBfID0gcmVxdWlyZSgnLi4vLi4vbGliL2hlbHBlcicpO1xudmFyIGluc3RhbmNlcyA9IHJlcXVpcmUoJy4uL2luc3RhbmNlcycpO1xudmFyIHVwZGF0ZUdlb21ldHJ5ID0gcmVxdWlyZSgnLi4vdXBkYXRlLWdlb21ldHJ5Jyk7XG52YXIgdXBkYXRlU2Nyb2xsID0gcmVxdWlyZSgnLi4vdXBkYXRlLXNjcm9sbCcpO1xuXG5mdW5jdGlvbiBiaW5kVG91Y2hIYW5kbGVyKGVsZW1lbnQsIGksIHN1cHBvcnRzVG91Y2gsIHN1cHBvcnRzSWVQb2ludGVyKSB7XG4gIGZ1bmN0aW9uIHNob3VsZFByZXZlbnREZWZhdWx0KGRlbHRhWCwgZGVsdGFZKSB7XG4gICAgdmFyIHNjcm9sbFRvcCA9IGVsZW1lbnQuc2Nyb2xsVG9wO1xuICAgIHZhciBzY3JvbGxMZWZ0ID0gZWxlbWVudC5zY3JvbGxMZWZ0O1xuICAgIHZhciBtYWduaXR1ZGVYID0gTWF0aC5hYnMoZGVsdGFYKTtcbiAgICB2YXIgbWFnbml0dWRlWSA9IE1hdGguYWJzKGRlbHRhWSk7XG5cbiAgICBpZiAobWFnbml0dWRlWSA+IG1hZ25pdHVkZVgpIHtcbiAgICAgIC8vIHVzZXIgaXMgcGVyaGFwcyB0cnlpbmcgdG8gc3dpcGUgdXAvZG93biB0aGUgcGFnZVxuXG4gICAgICBpZiAoKChkZWx0YVkgPCAwKSAmJiAoc2Nyb2xsVG9wID09PSBpLmNvbnRlbnRIZWlnaHQgLSBpLmNvbnRhaW5lckhlaWdodCkpIHx8XG4gICAgICAgICAgKChkZWx0YVkgPiAwKSAmJiAoc2Nyb2xsVG9wID09PSAwKSkpIHtcbiAgICAgICAgcmV0dXJuICFpLnNldHRpbmdzLnN3aXBlUHJvcGFnYXRpb247XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChtYWduaXR1ZGVYID4gbWFnbml0dWRlWSkge1xuICAgICAgLy8gdXNlciBpcyBwZXJoYXBzIHRyeWluZyB0byBzd2lwZSBsZWZ0L3JpZ2h0IGFjcm9zcyB0aGUgcGFnZVxuXG4gICAgICBpZiAoKChkZWx0YVggPCAwKSAmJiAoc2Nyb2xsTGVmdCA9PT0gaS5jb250ZW50V2lkdGggLSBpLmNvbnRhaW5lcldpZHRoKSkgfHxcbiAgICAgICAgICAoKGRlbHRhWCA+IDApICYmIChzY3JvbGxMZWZ0ID09PSAwKSkpIHtcbiAgICAgICAgcmV0dXJuICFpLnNldHRpbmdzLnN3aXBlUHJvcGFnYXRpb247XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBmdW5jdGlvbiBhcHBseVRvdWNoTW92ZShkaWZmZXJlbmNlWCwgZGlmZmVyZW5jZVkpIHtcbiAgICB1cGRhdGVTY3JvbGwoZWxlbWVudCwgJ3RvcCcsIGVsZW1lbnQuc2Nyb2xsVG9wIC0gZGlmZmVyZW5jZVkpO1xuICAgIHVwZGF0ZVNjcm9sbChlbGVtZW50LCAnbGVmdCcsIGVsZW1lbnQuc2Nyb2xsTGVmdCAtIGRpZmZlcmVuY2VYKTtcblxuICAgIHVwZGF0ZUdlb21ldHJ5KGVsZW1lbnQpO1xuICB9XG5cbiAgdmFyIHN0YXJ0T2Zmc2V0ID0ge307XG4gIHZhciBzdGFydFRpbWUgPSAwO1xuICB2YXIgc3BlZWQgPSB7fTtcbiAgdmFyIGVhc2luZ0xvb3AgPSBudWxsO1xuICB2YXIgaW5HbG9iYWxUb3VjaCA9IGZhbHNlO1xuICB2YXIgaW5Mb2NhbFRvdWNoID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gZ2xvYmFsVG91Y2hTdGFydCgpIHtcbiAgICBpbkdsb2JhbFRvdWNoID0gdHJ1ZTtcbiAgfVxuICBmdW5jdGlvbiBnbG9iYWxUb3VjaEVuZCgpIHtcbiAgICBpbkdsb2JhbFRvdWNoID0gZmFsc2U7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRUb3VjaChlKSB7XG4gICAgaWYgKGUudGFyZ2V0VG91Y2hlcykge1xuICAgICAgcmV0dXJuIGUudGFyZ2V0VG91Y2hlc1swXTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gTWF5YmUgSUUgcG9pbnRlclxuICAgICAgcmV0dXJuIGU7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIHNob3VsZEhhbmRsZShlKSB7XG4gICAgaWYgKGUudGFyZ2V0VG91Y2hlcyAmJiBlLnRhcmdldFRvdWNoZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKGUucG9pbnRlclR5cGUgJiYgZS5wb2ludGVyVHlwZSAhPT0gJ21vdXNlJyAmJiBlLnBvaW50ZXJUeXBlICE9PSBlLk1TUE9JTlRFUl9UWVBFX01PVVNFKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGZ1bmN0aW9uIHRvdWNoU3RhcnQoZSkge1xuICAgIGlmIChzaG91bGRIYW5kbGUoZSkpIHtcbiAgICAgIGluTG9jYWxUb3VjaCA9IHRydWU7XG5cbiAgICAgIHZhciB0b3VjaCA9IGdldFRvdWNoKGUpO1xuXG4gICAgICBzdGFydE9mZnNldC5wYWdlWCA9IHRvdWNoLnBhZ2VYO1xuICAgICAgc3RhcnRPZmZzZXQucGFnZVkgPSB0b3VjaC5wYWdlWTtcblxuICAgICAgc3RhcnRUaW1lID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcblxuICAgICAgaWYgKGVhc2luZ0xvb3AgIT09IG51bGwpIHtcbiAgICAgICAgY2xlYXJJbnRlcnZhbChlYXNpbmdMb29wKTtcbiAgICAgIH1cblxuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gdG91Y2hNb3ZlKGUpIHtcbiAgICBpZiAoIWluTG9jYWxUb3VjaCAmJiBpLnNldHRpbmdzLnN3aXBlUHJvcGFnYXRpb24pIHtcbiAgICAgIHRvdWNoU3RhcnQoZSk7XG4gICAgfVxuICAgIGlmICghaW5HbG9iYWxUb3VjaCAmJiBpbkxvY2FsVG91Y2ggJiYgc2hvdWxkSGFuZGxlKGUpKSB7XG4gICAgICB2YXIgdG91Y2ggPSBnZXRUb3VjaChlKTtcblxuICAgICAgdmFyIGN1cnJlbnRPZmZzZXQgPSB7cGFnZVg6IHRvdWNoLnBhZ2VYLCBwYWdlWTogdG91Y2gucGFnZVl9O1xuXG4gICAgICB2YXIgZGlmZmVyZW5jZVggPSBjdXJyZW50T2Zmc2V0LnBhZ2VYIC0gc3RhcnRPZmZzZXQucGFnZVg7XG4gICAgICB2YXIgZGlmZmVyZW5jZVkgPSBjdXJyZW50T2Zmc2V0LnBhZ2VZIC0gc3RhcnRPZmZzZXQucGFnZVk7XG5cbiAgICAgIGFwcGx5VG91Y2hNb3ZlKGRpZmZlcmVuY2VYLCBkaWZmZXJlbmNlWSk7XG4gICAgICBzdGFydE9mZnNldCA9IGN1cnJlbnRPZmZzZXQ7XG5cbiAgICAgIHZhciBjdXJyZW50VGltZSA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG5cbiAgICAgIHZhciB0aW1lR2FwID0gY3VycmVudFRpbWUgLSBzdGFydFRpbWU7XG4gICAgICBpZiAodGltZUdhcCA+IDApIHtcbiAgICAgICAgc3BlZWQueCA9IGRpZmZlcmVuY2VYIC8gdGltZUdhcDtcbiAgICAgICAgc3BlZWQueSA9IGRpZmZlcmVuY2VZIC8gdGltZUdhcDtcbiAgICAgICAgc3RhcnRUaW1lID0gY3VycmVudFRpbWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChzaG91bGRQcmV2ZW50RGVmYXVsdChkaWZmZXJlbmNlWCwgZGlmZmVyZW5jZVkpKSB7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gdG91Y2hFbmQoKSB7XG4gICAgaWYgKCFpbkdsb2JhbFRvdWNoICYmIGluTG9jYWxUb3VjaCkge1xuICAgICAgaW5Mb2NhbFRvdWNoID0gZmFsc2U7XG5cbiAgICAgIGNsZWFySW50ZXJ2YWwoZWFzaW5nTG9vcCk7XG4gICAgICBlYXNpbmdMb29wID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIWluc3RhbmNlcy5nZXQoZWxlbWVudCkpIHtcbiAgICAgICAgICBjbGVhckludGVydmFsKGVhc2luZ0xvb3ApO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghc3BlZWQueCAmJiAhc3BlZWQueSkge1xuICAgICAgICAgIGNsZWFySW50ZXJ2YWwoZWFzaW5nTG9vcCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKE1hdGguYWJzKHNwZWVkLngpIDwgMC4wMSAmJiBNYXRoLmFicyhzcGVlZC55KSA8IDAuMDEpIHtcbiAgICAgICAgICBjbGVhckludGVydmFsKGVhc2luZ0xvb3ApO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGFwcGx5VG91Y2hNb3ZlKHNwZWVkLnggKiAzMCwgc3BlZWQueSAqIDMwKTtcblxuICAgICAgICBzcGVlZC54ICo9IDAuODtcbiAgICAgICAgc3BlZWQueSAqPSAwLjg7XG4gICAgICB9LCAxMCk7XG4gICAgfVxuICB9XG5cbiAgaWYgKHN1cHBvcnRzVG91Y2gpIHtcbiAgICBpLmV2ZW50LmJpbmQod2luZG93LCAndG91Y2hzdGFydCcsIGdsb2JhbFRvdWNoU3RhcnQpO1xuICAgIGkuZXZlbnQuYmluZCh3aW5kb3csICd0b3VjaGVuZCcsIGdsb2JhbFRvdWNoRW5kKTtcbiAgICBpLmV2ZW50LmJpbmQoZWxlbWVudCwgJ3RvdWNoc3RhcnQnLCB0b3VjaFN0YXJ0KTtcbiAgICBpLmV2ZW50LmJpbmQoZWxlbWVudCwgJ3RvdWNobW92ZScsIHRvdWNoTW92ZSk7XG4gICAgaS5ldmVudC5iaW5kKGVsZW1lbnQsICd0b3VjaGVuZCcsIHRvdWNoRW5kKTtcbiAgfSBlbHNlIGlmIChzdXBwb3J0c0llUG9pbnRlcikge1xuICAgIGlmICh3aW5kb3cuUG9pbnRlckV2ZW50KSB7XG4gICAgICBpLmV2ZW50LmJpbmQod2luZG93LCAncG9pbnRlcmRvd24nLCBnbG9iYWxUb3VjaFN0YXJ0KTtcbiAgICAgIGkuZXZlbnQuYmluZCh3aW5kb3csICdwb2ludGVydXAnLCBnbG9iYWxUb3VjaEVuZCk7XG4gICAgICBpLmV2ZW50LmJpbmQoZWxlbWVudCwgJ3BvaW50ZXJkb3duJywgdG91Y2hTdGFydCk7XG4gICAgICBpLmV2ZW50LmJpbmQoZWxlbWVudCwgJ3BvaW50ZXJtb3ZlJywgdG91Y2hNb3ZlKTtcbiAgICAgIGkuZXZlbnQuYmluZChlbGVtZW50LCAncG9pbnRlcnVwJywgdG91Y2hFbmQpO1xuICAgIH0gZWxzZSBpZiAod2luZG93Lk1TUG9pbnRlckV2ZW50KSB7XG4gICAgICBpLmV2ZW50LmJpbmQod2luZG93LCAnTVNQb2ludGVyRG93bicsIGdsb2JhbFRvdWNoU3RhcnQpO1xuICAgICAgaS5ldmVudC5iaW5kKHdpbmRvdywgJ01TUG9pbnRlclVwJywgZ2xvYmFsVG91Y2hFbmQpO1xuICAgICAgaS5ldmVudC5iaW5kKGVsZW1lbnQsICdNU1BvaW50ZXJEb3duJywgdG91Y2hTdGFydCk7XG4gICAgICBpLmV2ZW50LmJpbmQoZWxlbWVudCwgJ01TUG9pbnRlck1vdmUnLCB0b3VjaE1vdmUpO1xuICAgICAgaS5ldmVudC5iaW5kKGVsZW1lbnQsICdNU1BvaW50ZXJVcCcsIHRvdWNoRW5kKTtcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICBpZiAoIV8uZW52LnN1cHBvcnRzVG91Y2ggJiYgIV8uZW52LnN1cHBvcnRzSWVQb2ludGVyKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIGkgPSBpbnN0YW5jZXMuZ2V0KGVsZW1lbnQpO1xuICBiaW5kVG91Y2hIYW5kbGVyKGVsZW1lbnQsIGksIF8uZW52LnN1cHBvcnRzVG91Y2gsIF8uZW52LnN1cHBvcnRzSWVQb2ludGVyKTtcbn07XG5cbn0se1wiLi4vLi4vbGliL2hlbHBlclwiOjYsXCIuLi9pbnN0YW5jZXNcIjoxOCxcIi4uL3VwZGF0ZS1nZW9tZXRyeVwiOjE5LFwiLi4vdXBkYXRlLXNjcm9sbFwiOjIwfV0sMTc6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgXyA9IHJlcXVpcmUoJy4uL2xpYi9oZWxwZXInKTtcbnZhciBjbHMgPSByZXF1aXJlKCcuLi9saWIvY2xhc3MnKTtcbnZhciBpbnN0YW5jZXMgPSByZXF1aXJlKCcuL2luc3RhbmNlcycpO1xudmFyIHVwZGF0ZUdlb21ldHJ5ID0gcmVxdWlyZSgnLi91cGRhdGUtZ2VvbWV0cnknKTtcblxuLy8gSGFuZGxlcnNcbnZhciBoYW5kbGVycyA9IHtcbiAgJ2NsaWNrLXJhaWwnOiByZXF1aXJlKCcuL2hhbmRsZXIvY2xpY2stcmFpbCcpLFxuICAnZHJhZy1zY3JvbGxiYXInOiByZXF1aXJlKCcuL2hhbmRsZXIvZHJhZy1zY3JvbGxiYXInKSxcbiAgJ2tleWJvYXJkJzogcmVxdWlyZSgnLi9oYW5kbGVyL2tleWJvYXJkJyksXG4gICd3aGVlbCc6IHJlcXVpcmUoJy4vaGFuZGxlci9tb3VzZS13aGVlbCcpLFxuICAndG91Y2gnOiByZXF1aXJlKCcuL2hhbmRsZXIvdG91Y2gnKSxcbiAgJ3NlbGVjdGlvbic6IHJlcXVpcmUoJy4vaGFuZGxlci9zZWxlY3Rpb24nKVxufTtcbnZhciBuYXRpdmVTY3JvbGxIYW5kbGVyID0gcmVxdWlyZSgnLi9oYW5kbGVyL25hdGl2ZS1zY3JvbGwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoZWxlbWVudCwgdXNlclNldHRpbmdzKSB7XG4gIHVzZXJTZXR0aW5ncyA9IHR5cGVvZiB1c2VyU2V0dGluZ3MgPT09ICdvYmplY3QnID8gdXNlclNldHRpbmdzIDoge307XG5cbiAgY2xzLmFkZChlbGVtZW50LCAncHMtY29udGFpbmVyJyk7XG5cbiAgLy8gQ3JlYXRlIGEgcGx1Z2luIGluc3RhbmNlLlxuICB2YXIgaSA9IGluc3RhbmNlcy5hZGQoZWxlbWVudCk7XG5cbiAgaS5zZXR0aW5ncyA9IF8uZXh0ZW5kKGkuc2V0dGluZ3MsIHVzZXJTZXR0aW5ncyk7XG4gIGNscy5hZGQoZWxlbWVudCwgJ3BzLXRoZW1lLScgKyBpLnNldHRpbmdzLnRoZW1lKTtcblxuICBpLnNldHRpbmdzLmhhbmRsZXJzLmZvckVhY2goZnVuY3Rpb24gKGhhbmRsZXJOYW1lKSB7XG4gICAgaGFuZGxlcnNbaGFuZGxlck5hbWVdKGVsZW1lbnQpO1xuICB9KTtcblxuICBuYXRpdmVTY3JvbGxIYW5kbGVyKGVsZW1lbnQpO1xuXG4gIHVwZGF0ZUdlb21ldHJ5KGVsZW1lbnQpO1xufTtcblxufSx7XCIuLi9saWIvY2xhc3NcIjoyLFwiLi4vbGliL2hlbHBlclwiOjYsXCIuL2hhbmRsZXIvY2xpY2stcmFpbFwiOjEwLFwiLi9oYW5kbGVyL2RyYWctc2Nyb2xsYmFyXCI6MTEsXCIuL2hhbmRsZXIva2V5Ym9hcmRcIjoxMixcIi4vaGFuZGxlci9tb3VzZS13aGVlbFwiOjEzLFwiLi9oYW5kbGVyL25hdGl2ZS1zY3JvbGxcIjoxNCxcIi4vaGFuZGxlci9zZWxlY3Rpb25cIjoxNSxcIi4vaGFuZGxlci90b3VjaFwiOjE2LFwiLi9pbnN0YW5jZXNcIjoxOCxcIi4vdXBkYXRlLWdlb21ldHJ5XCI6MTl9XSwxODpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBfID0gcmVxdWlyZSgnLi4vbGliL2hlbHBlcicpO1xudmFyIGNscyA9IHJlcXVpcmUoJy4uL2xpYi9jbGFzcycpO1xudmFyIGRlZmF1bHRTZXR0aW5ncyA9IHJlcXVpcmUoJy4vZGVmYXVsdC1zZXR0aW5nJyk7XG52YXIgZG9tID0gcmVxdWlyZSgnLi4vbGliL2RvbScpO1xudmFyIEV2ZW50TWFuYWdlciA9IHJlcXVpcmUoJy4uL2xpYi9ldmVudC1tYW5hZ2VyJyk7XG52YXIgZ3VpZCA9IHJlcXVpcmUoJy4uL2xpYi9ndWlkJyk7XG5cbnZhciBpbnN0YW5jZXMgPSB7fTtcblxuZnVuY3Rpb24gSW5zdGFuY2UoZWxlbWVudCkge1xuICB2YXIgaSA9IHRoaXM7XG5cbiAgaS5zZXR0aW5ncyA9IF8uY2xvbmUoZGVmYXVsdFNldHRpbmdzKTtcbiAgaS5jb250YWluZXJXaWR0aCA9IG51bGw7XG4gIGkuY29udGFpbmVySGVpZ2h0ID0gbnVsbDtcbiAgaS5jb250ZW50V2lkdGggPSBudWxsO1xuICBpLmNvbnRlbnRIZWlnaHQgPSBudWxsO1xuXG4gIGkuaXNSdGwgPSBkb20uY3NzKGVsZW1lbnQsICdkaXJlY3Rpb24nKSA9PT0gXCJydGxcIjtcbiAgaS5pc05lZ2F0aXZlU2Nyb2xsID0gKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgb3JpZ2luYWxTY3JvbGxMZWZ0ID0gZWxlbWVudC5zY3JvbGxMZWZ0O1xuICAgIHZhciByZXN1bHQgPSBudWxsO1xuICAgIGVsZW1lbnQuc2Nyb2xsTGVmdCA9IC0xO1xuICAgIHJlc3VsdCA9IGVsZW1lbnQuc2Nyb2xsTGVmdCA8IDA7XG4gICAgZWxlbWVudC5zY3JvbGxMZWZ0ID0gb3JpZ2luYWxTY3JvbGxMZWZ0O1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH0pKCk7XG4gIGkubmVnYXRpdmVTY3JvbGxBZGp1c3RtZW50ID0gaS5pc05lZ2F0aXZlU2Nyb2xsID8gZWxlbWVudC5zY3JvbGxXaWR0aCAtIGVsZW1lbnQuY2xpZW50V2lkdGggOiAwO1xuICBpLmV2ZW50ID0gbmV3IEV2ZW50TWFuYWdlcigpO1xuICBpLm93bmVyRG9jdW1lbnQgPSBlbGVtZW50Lm93bmVyRG9jdW1lbnQgfHwgZG9jdW1lbnQ7XG5cbiAgZnVuY3Rpb24gZm9jdXMoKSB7XG4gICAgY2xzLmFkZChlbGVtZW50LCAncHMtZm9jdXMnKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGJsdXIoKSB7XG4gICAgY2xzLnJlbW92ZShlbGVtZW50LCAncHMtZm9jdXMnKTtcbiAgfVxuXG4gIGkuc2Nyb2xsYmFyWFJhaWwgPSBkb20uYXBwZW5kVG8oZG9tLmUoJ2RpdicsICdwcy1zY3JvbGxiYXIteC1yYWlsJyksIGVsZW1lbnQpO1xuICBpLnNjcm9sbGJhclggPSBkb20uYXBwZW5kVG8oZG9tLmUoJ2RpdicsICdwcy1zY3JvbGxiYXIteCcpLCBpLnNjcm9sbGJhclhSYWlsKTtcbiAgaS5zY3JvbGxiYXJYLnNldEF0dHJpYnV0ZSgndGFiaW5kZXgnLCAwKTtcbiAgaS5ldmVudC5iaW5kKGkuc2Nyb2xsYmFyWCwgJ2ZvY3VzJywgZm9jdXMpO1xuICBpLmV2ZW50LmJpbmQoaS5zY3JvbGxiYXJYLCAnYmx1cicsIGJsdXIpO1xuICBpLnNjcm9sbGJhclhBY3RpdmUgPSBudWxsO1xuICBpLnNjcm9sbGJhclhXaWR0aCA9IG51bGw7XG4gIGkuc2Nyb2xsYmFyWExlZnQgPSBudWxsO1xuICBpLnNjcm9sbGJhclhCb3R0b20gPSBfLnRvSW50KGRvbS5jc3MoaS5zY3JvbGxiYXJYUmFpbCwgJ2JvdHRvbScpKTtcbiAgaS5pc1Njcm9sbGJhclhVc2luZ0JvdHRvbSA9IGkuc2Nyb2xsYmFyWEJvdHRvbSA9PT0gaS5zY3JvbGxiYXJYQm90dG9tOyAvLyAhaXNOYU5cbiAgaS5zY3JvbGxiYXJYVG9wID0gaS5pc1Njcm9sbGJhclhVc2luZ0JvdHRvbSA/IG51bGwgOiBfLnRvSW50KGRvbS5jc3MoaS5zY3JvbGxiYXJYUmFpbCwgJ3RvcCcpKTtcbiAgaS5yYWlsQm9yZGVyWFdpZHRoID0gXy50b0ludChkb20uY3NzKGkuc2Nyb2xsYmFyWFJhaWwsICdib3JkZXJMZWZ0V2lkdGgnKSkgKyBfLnRvSW50KGRvbS5jc3MoaS5zY3JvbGxiYXJYUmFpbCwgJ2JvcmRlclJpZ2h0V2lkdGgnKSk7XG4gIC8vIFNldCByYWlsIHRvIGRpc3BsYXk6YmxvY2sgdG8gY2FsY3VsYXRlIG1hcmdpbnNcbiAgZG9tLmNzcyhpLnNjcm9sbGJhclhSYWlsLCAnZGlzcGxheScsICdibG9jaycpO1xuICBpLnJhaWxYTWFyZ2luV2lkdGggPSBfLnRvSW50KGRvbS5jc3MoaS5zY3JvbGxiYXJYUmFpbCwgJ21hcmdpbkxlZnQnKSkgKyBfLnRvSW50KGRvbS5jc3MoaS5zY3JvbGxiYXJYUmFpbCwgJ21hcmdpblJpZ2h0JykpO1xuICBkb20uY3NzKGkuc2Nyb2xsYmFyWFJhaWwsICdkaXNwbGF5JywgJycpO1xuICBpLnJhaWxYV2lkdGggPSBudWxsO1xuICBpLnJhaWxYUmF0aW8gPSBudWxsO1xuXG4gIGkuc2Nyb2xsYmFyWVJhaWwgPSBkb20uYXBwZW5kVG8oZG9tLmUoJ2RpdicsICdwcy1zY3JvbGxiYXIteS1yYWlsJyksIGVsZW1lbnQpO1xuICBpLnNjcm9sbGJhclkgPSBkb20uYXBwZW5kVG8oZG9tLmUoJ2RpdicsICdwcy1zY3JvbGxiYXIteScpLCBpLnNjcm9sbGJhcllSYWlsKTtcbiAgaS5zY3JvbGxiYXJZLnNldEF0dHJpYnV0ZSgndGFiaW5kZXgnLCAwKTtcbiAgaS5ldmVudC5iaW5kKGkuc2Nyb2xsYmFyWSwgJ2ZvY3VzJywgZm9jdXMpO1xuICBpLmV2ZW50LmJpbmQoaS5zY3JvbGxiYXJZLCAnYmx1cicsIGJsdXIpO1xuICBpLnNjcm9sbGJhcllBY3RpdmUgPSBudWxsO1xuICBpLnNjcm9sbGJhcllIZWlnaHQgPSBudWxsO1xuICBpLnNjcm9sbGJhcllUb3AgPSBudWxsO1xuICBpLnNjcm9sbGJhcllSaWdodCA9IF8udG9JbnQoZG9tLmNzcyhpLnNjcm9sbGJhcllSYWlsLCAncmlnaHQnKSk7XG4gIGkuaXNTY3JvbGxiYXJZVXNpbmdSaWdodCA9IGkuc2Nyb2xsYmFyWVJpZ2h0ID09PSBpLnNjcm9sbGJhcllSaWdodDsgLy8gIWlzTmFOXG4gIGkuc2Nyb2xsYmFyWUxlZnQgPSBpLmlzU2Nyb2xsYmFyWVVzaW5nUmlnaHQgPyBudWxsIDogXy50b0ludChkb20uY3NzKGkuc2Nyb2xsYmFyWVJhaWwsICdsZWZ0JykpO1xuICBpLnNjcm9sbGJhcllPdXRlcldpZHRoID0gaS5pc1J0bCA/IF8ub3V0ZXJXaWR0aChpLnNjcm9sbGJhclkpIDogbnVsbDtcbiAgaS5yYWlsQm9yZGVyWVdpZHRoID0gXy50b0ludChkb20uY3NzKGkuc2Nyb2xsYmFyWVJhaWwsICdib3JkZXJUb3BXaWR0aCcpKSArIF8udG9JbnQoZG9tLmNzcyhpLnNjcm9sbGJhcllSYWlsLCAnYm9yZGVyQm90dG9tV2lkdGgnKSk7XG4gIGRvbS5jc3MoaS5zY3JvbGxiYXJZUmFpbCwgJ2Rpc3BsYXknLCAnYmxvY2snKTtcbiAgaS5yYWlsWU1hcmdpbkhlaWdodCA9IF8udG9JbnQoZG9tLmNzcyhpLnNjcm9sbGJhcllSYWlsLCAnbWFyZ2luVG9wJykpICsgXy50b0ludChkb20uY3NzKGkuc2Nyb2xsYmFyWVJhaWwsICdtYXJnaW5Cb3R0b20nKSk7XG4gIGRvbS5jc3MoaS5zY3JvbGxiYXJZUmFpbCwgJ2Rpc3BsYXknLCAnJyk7XG4gIGkucmFpbFlIZWlnaHQgPSBudWxsO1xuICBpLnJhaWxZUmF0aW8gPSBudWxsO1xufVxuXG5mdW5jdGlvbiBnZXRJZChlbGVtZW50KSB7XG4gIHJldHVybiBlbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1wcy1pZCcpO1xufVxuXG5mdW5jdGlvbiBzZXRJZChlbGVtZW50LCBpZCkge1xuICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnZGF0YS1wcy1pZCcsIGlkKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlSWQoZWxlbWVudCkge1xuICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS1wcy1pZCcpO1xufVxuXG5leHBvcnRzLmFkZCA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gIHZhciBuZXdJZCA9IGd1aWQoKTtcbiAgc2V0SWQoZWxlbWVudCwgbmV3SWQpO1xuICBpbnN0YW5jZXNbbmV3SWRdID0gbmV3IEluc3RhbmNlKGVsZW1lbnQpO1xuICByZXR1cm4gaW5zdGFuY2VzW25ld0lkXTtcbn07XG5cbmV4cG9ydHMucmVtb3ZlID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgZGVsZXRlIGluc3RhbmNlc1tnZXRJZChlbGVtZW50KV07XG4gIHJlbW92ZUlkKGVsZW1lbnQpO1xufTtcblxuZXhwb3J0cy5nZXQgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICByZXR1cm4gaW5zdGFuY2VzW2dldElkKGVsZW1lbnQpXTtcbn07XG5cbn0se1wiLi4vbGliL2NsYXNzXCI6MixcIi4uL2xpYi9kb21cIjozLFwiLi4vbGliL2V2ZW50LW1hbmFnZXJcIjo0LFwiLi4vbGliL2d1aWRcIjo1LFwiLi4vbGliL2hlbHBlclwiOjYsXCIuL2RlZmF1bHQtc2V0dGluZ1wiOjh9XSwxOTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBfID0gcmVxdWlyZSgnLi4vbGliL2hlbHBlcicpO1xudmFyIGNscyA9IHJlcXVpcmUoJy4uL2xpYi9jbGFzcycpO1xudmFyIGRvbSA9IHJlcXVpcmUoJy4uL2xpYi9kb20nKTtcbnZhciBpbnN0YW5jZXMgPSByZXF1aXJlKCcuL2luc3RhbmNlcycpO1xudmFyIHVwZGF0ZVNjcm9sbCA9IHJlcXVpcmUoJy4vdXBkYXRlLXNjcm9sbCcpO1xuXG5mdW5jdGlvbiBnZXRUaHVtYlNpemUoaSwgdGh1bWJTaXplKSB7XG4gIGlmIChpLnNldHRpbmdzLm1pblNjcm9sbGJhckxlbmd0aCkge1xuICAgIHRodW1iU2l6ZSA9IE1hdGgubWF4KHRodW1iU2l6ZSwgaS5zZXR0aW5ncy5taW5TY3JvbGxiYXJMZW5ndGgpO1xuICB9XG4gIGlmIChpLnNldHRpbmdzLm1heFNjcm9sbGJhckxlbmd0aCkge1xuICAgIHRodW1iU2l6ZSA9IE1hdGgubWluKHRodW1iU2l6ZSwgaS5zZXR0aW5ncy5tYXhTY3JvbGxiYXJMZW5ndGgpO1xuICB9XG4gIHJldHVybiB0aHVtYlNpemU7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUNzcyhlbGVtZW50LCBpKSB7XG4gIHZhciB4UmFpbE9mZnNldCA9IHt3aWR0aDogaS5yYWlsWFdpZHRofTtcbiAgaWYgKGkuaXNSdGwpIHtcbiAgICB4UmFpbE9mZnNldC5sZWZ0ID0gaS5uZWdhdGl2ZVNjcm9sbEFkanVzdG1lbnQgKyBlbGVtZW50LnNjcm9sbExlZnQgKyBpLmNvbnRhaW5lcldpZHRoIC0gaS5jb250ZW50V2lkdGg7XG4gIH0gZWxzZSB7XG4gICAgeFJhaWxPZmZzZXQubGVmdCA9IGVsZW1lbnQuc2Nyb2xsTGVmdDtcbiAgfVxuICBpZiAoaS5pc1Njcm9sbGJhclhVc2luZ0JvdHRvbSkge1xuICAgIHhSYWlsT2Zmc2V0LmJvdHRvbSA9IGkuc2Nyb2xsYmFyWEJvdHRvbSAtIGVsZW1lbnQuc2Nyb2xsVG9wO1xuICB9IGVsc2Uge1xuICAgIHhSYWlsT2Zmc2V0LnRvcCA9IGkuc2Nyb2xsYmFyWFRvcCArIGVsZW1lbnQuc2Nyb2xsVG9wO1xuICB9XG4gIGRvbS5jc3MoaS5zY3JvbGxiYXJYUmFpbCwgeFJhaWxPZmZzZXQpO1xuXG4gIHZhciB5UmFpbE9mZnNldCA9IHt0b3A6IGVsZW1lbnQuc2Nyb2xsVG9wLCBoZWlnaHQ6IGkucmFpbFlIZWlnaHR9O1xuICBpZiAoaS5pc1Njcm9sbGJhcllVc2luZ1JpZ2h0KSB7XG4gICAgaWYgKGkuaXNSdGwpIHtcbiAgICAgIHlSYWlsT2Zmc2V0LnJpZ2h0ID0gaS5jb250ZW50V2lkdGggLSAoaS5uZWdhdGl2ZVNjcm9sbEFkanVzdG1lbnQgKyBlbGVtZW50LnNjcm9sbExlZnQpIC0gaS5zY3JvbGxiYXJZUmlnaHQgLSBpLnNjcm9sbGJhcllPdXRlcldpZHRoO1xuICAgIH0gZWxzZSB7XG4gICAgICB5UmFpbE9mZnNldC5yaWdodCA9IGkuc2Nyb2xsYmFyWVJpZ2h0IC0gZWxlbWVudC5zY3JvbGxMZWZ0O1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoaS5pc1J0bCkge1xuICAgICAgeVJhaWxPZmZzZXQubGVmdCA9IGkubmVnYXRpdmVTY3JvbGxBZGp1c3RtZW50ICsgZWxlbWVudC5zY3JvbGxMZWZ0ICsgaS5jb250YWluZXJXaWR0aCAqIDIgLSBpLmNvbnRlbnRXaWR0aCAtIGkuc2Nyb2xsYmFyWUxlZnQgLSBpLnNjcm9sbGJhcllPdXRlcldpZHRoO1xuICAgIH0gZWxzZSB7XG4gICAgICB5UmFpbE9mZnNldC5sZWZ0ID0gaS5zY3JvbGxiYXJZTGVmdCArIGVsZW1lbnQuc2Nyb2xsTGVmdDtcbiAgICB9XG4gIH1cbiAgZG9tLmNzcyhpLnNjcm9sbGJhcllSYWlsLCB5UmFpbE9mZnNldCk7XG5cbiAgZG9tLmNzcyhpLnNjcm9sbGJhclgsIHtsZWZ0OiBpLnNjcm9sbGJhclhMZWZ0LCB3aWR0aDogaS5zY3JvbGxiYXJYV2lkdGggLSBpLnJhaWxCb3JkZXJYV2lkdGh9KTtcbiAgZG9tLmNzcyhpLnNjcm9sbGJhclksIHt0b3A6IGkuc2Nyb2xsYmFyWVRvcCwgaGVpZ2h0OiBpLnNjcm9sbGJhcllIZWlnaHQgLSBpLnJhaWxCb3JkZXJZV2lkdGh9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICB2YXIgaSA9IGluc3RhbmNlcy5nZXQoZWxlbWVudCk7XG5cbiAgaS5jb250YWluZXJXaWR0aCA9IGVsZW1lbnQuY2xpZW50V2lkdGg7XG4gIGkuY29udGFpbmVySGVpZ2h0ID0gZWxlbWVudC5jbGllbnRIZWlnaHQ7XG4gIGkuY29udGVudFdpZHRoID0gZWxlbWVudC5zY3JvbGxXaWR0aDtcbiAgaS5jb250ZW50SGVpZ2h0ID0gZWxlbWVudC5zY3JvbGxIZWlnaHQ7XG5cbiAgdmFyIGV4aXN0aW5nUmFpbHM7XG4gIGlmICghZWxlbWVudC5jb250YWlucyhpLnNjcm9sbGJhclhSYWlsKSkge1xuICAgIGV4aXN0aW5nUmFpbHMgPSBkb20ucXVlcnlDaGlsZHJlbihlbGVtZW50LCAnLnBzLXNjcm9sbGJhci14LXJhaWwnKTtcbiAgICBpZiAoZXhpc3RpbmdSYWlscy5sZW5ndGggPiAwKSB7XG4gICAgICBleGlzdGluZ1JhaWxzLmZvckVhY2goZnVuY3Rpb24gKHJhaWwpIHtcbiAgICAgICAgZG9tLnJlbW92ZShyYWlsKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBkb20uYXBwZW5kVG8oaS5zY3JvbGxiYXJYUmFpbCwgZWxlbWVudCk7XG4gIH1cbiAgaWYgKCFlbGVtZW50LmNvbnRhaW5zKGkuc2Nyb2xsYmFyWVJhaWwpKSB7XG4gICAgZXhpc3RpbmdSYWlscyA9IGRvbS5xdWVyeUNoaWxkcmVuKGVsZW1lbnQsICcucHMtc2Nyb2xsYmFyLXktcmFpbCcpO1xuICAgIGlmIChleGlzdGluZ1JhaWxzLmxlbmd0aCA+IDApIHtcbiAgICAgIGV4aXN0aW5nUmFpbHMuZm9yRWFjaChmdW5jdGlvbiAocmFpbCkge1xuICAgICAgICBkb20ucmVtb3ZlKHJhaWwpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGRvbS5hcHBlbmRUbyhpLnNjcm9sbGJhcllSYWlsLCBlbGVtZW50KTtcbiAgfVxuXG4gIGlmICghaS5zZXR0aW5ncy5zdXBwcmVzc1Njcm9sbFggJiYgaS5jb250YWluZXJXaWR0aCArIGkuc2V0dGluZ3Muc2Nyb2xsWE1hcmdpbk9mZnNldCA8IGkuY29udGVudFdpZHRoKSB7XG4gICAgaS5zY3JvbGxiYXJYQWN0aXZlID0gdHJ1ZTtcbiAgICBpLnJhaWxYV2lkdGggPSBpLmNvbnRhaW5lcldpZHRoIC0gaS5yYWlsWE1hcmdpbldpZHRoO1xuICAgIGkucmFpbFhSYXRpbyA9IGkuY29udGFpbmVyV2lkdGggLyBpLnJhaWxYV2lkdGg7XG4gICAgaS5zY3JvbGxiYXJYV2lkdGggPSBnZXRUaHVtYlNpemUoaSwgXy50b0ludChpLnJhaWxYV2lkdGggKiBpLmNvbnRhaW5lcldpZHRoIC8gaS5jb250ZW50V2lkdGgpKTtcbiAgICBpLnNjcm9sbGJhclhMZWZ0ID0gXy50b0ludCgoaS5uZWdhdGl2ZVNjcm9sbEFkanVzdG1lbnQgKyBlbGVtZW50LnNjcm9sbExlZnQpICogKGkucmFpbFhXaWR0aCAtIGkuc2Nyb2xsYmFyWFdpZHRoKSAvIChpLmNvbnRlbnRXaWR0aCAtIGkuY29udGFpbmVyV2lkdGgpKTtcbiAgfSBlbHNlIHtcbiAgICBpLnNjcm9sbGJhclhBY3RpdmUgPSBmYWxzZTtcbiAgfVxuXG4gIGlmICghaS5zZXR0aW5ncy5zdXBwcmVzc1Njcm9sbFkgJiYgaS5jb250YWluZXJIZWlnaHQgKyBpLnNldHRpbmdzLnNjcm9sbFlNYXJnaW5PZmZzZXQgPCBpLmNvbnRlbnRIZWlnaHQpIHtcbiAgICBpLnNjcm9sbGJhcllBY3RpdmUgPSB0cnVlO1xuICAgIGkucmFpbFlIZWlnaHQgPSBpLmNvbnRhaW5lckhlaWdodCAtIGkucmFpbFlNYXJnaW5IZWlnaHQ7XG4gICAgaS5yYWlsWVJhdGlvID0gaS5jb250YWluZXJIZWlnaHQgLyBpLnJhaWxZSGVpZ2h0O1xuICAgIGkuc2Nyb2xsYmFyWUhlaWdodCA9IGdldFRodW1iU2l6ZShpLCBfLnRvSW50KGkucmFpbFlIZWlnaHQgKiBpLmNvbnRhaW5lckhlaWdodCAvIGkuY29udGVudEhlaWdodCkpO1xuICAgIGkuc2Nyb2xsYmFyWVRvcCA9IF8udG9JbnQoZWxlbWVudC5zY3JvbGxUb3AgKiAoaS5yYWlsWUhlaWdodCAtIGkuc2Nyb2xsYmFyWUhlaWdodCkgLyAoaS5jb250ZW50SGVpZ2h0IC0gaS5jb250YWluZXJIZWlnaHQpKTtcbiAgfSBlbHNlIHtcbiAgICBpLnNjcm9sbGJhcllBY3RpdmUgPSBmYWxzZTtcbiAgfVxuXG4gIGlmIChpLnNjcm9sbGJhclhMZWZ0ID49IGkucmFpbFhXaWR0aCAtIGkuc2Nyb2xsYmFyWFdpZHRoKSB7XG4gICAgaS5zY3JvbGxiYXJYTGVmdCA9IGkucmFpbFhXaWR0aCAtIGkuc2Nyb2xsYmFyWFdpZHRoO1xuICB9XG4gIGlmIChpLnNjcm9sbGJhcllUb3AgPj0gaS5yYWlsWUhlaWdodCAtIGkuc2Nyb2xsYmFyWUhlaWdodCkge1xuICAgIGkuc2Nyb2xsYmFyWVRvcCA9IGkucmFpbFlIZWlnaHQgLSBpLnNjcm9sbGJhcllIZWlnaHQ7XG4gIH1cblxuICB1cGRhdGVDc3MoZWxlbWVudCwgaSk7XG5cbiAgaWYgKGkuc2Nyb2xsYmFyWEFjdGl2ZSkge1xuICAgIGNscy5hZGQoZWxlbWVudCwgJ3BzLWFjdGl2ZS14Jyk7XG4gIH0gZWxzZSB7XG4gICAgY2xzLnJlbW92ZShlbGVtZW50LCAncHMtYWN0aXZlLXgnKTtcbiAgICBpLnNjcm9sbGJhclhXaWR0aCA9IDA7XG4gICAgaS5zY3JvbGxiYXJYTGVmdCA9IDA7XG4gICAgdXBkYXRlU2Nyb2xsKGVsZW1lbnQsICdsZWZ0JywgMCk7XG4gIH1cbiAgaWYgKGkuc2Nyb2xsYmFyWUFjdGl2ZSkge1xuICAgIGNscy5hZGQoZWxlbWVudCwgJ3BzLWFjdGl2ZS15Jyk7XG4gIH0gZWxzZSB7XG4gICAgY2xzLnJlbW92ZShlbGVtZW50LCAncHMtYWN0aXZlLXknKTtcbiAgICBpLnNjcm9sbGJhcllIZWlnaHQgPSAwO1xuICAgIGkuc2Nyb2xsYmFyWVRvcCA9IDA7XG4gICAgdXBkYXRlU2Nyb2xsKGVsZW1lbnQsICd0b3AnLCAwKTtcbiAgfVxufTtcblxufSx7XCIuLi9saWIvY2xhc3NcIjoyLFwiLi4vbGliL2RvbVwiOjMsXCIuLi9saWIvaGVscGVyXCI6NixcIi4vaW5zdGFuY2VzXCI6MTgsXCIuL3VwZGF0ZS1zY3JvbGxcIjoyMH1dLDIwOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIGluc3RhbmNlcyA9IHJlcXVpcmUoJy4vaW5zdGFuY2VzJyk7XG5cbnZhciBsYXN0VG9wO1xudmFyIGxhc3RMZWZ0O1xuXG52YXIgY3JlYXRlRE9NRXZlbnQgPSBmdW5jdGlvbiAobmFtZSkge1xuICB2YXIgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudChcIkV2ZW50XCIpO1xuICBldmVudC5pbml0RXZlbnQobmFtZSwgdHJ1ZSwgdHJ1ZSk7XG4gIHJldHVybiBldmVudDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGVsZW1lbnQsIGF4aXMsIHZhbHVlKSB7XG4gIGlmICh0eXBlb2YgZWxlbWVudCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB0aHJvdyAnWW91IG11c3QgcHJvdmlkZSBhbiBlbGVtZW50IHRvIHRoZSB1cGRhdGUtc2Nyb2xsIGZ1bmN0aW9uJztcbiAgfVxuXG4gIGlmICh0eXBlb2YgYXhpcyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB0aHJvdyAnWW91IG11c3QgcHJvdmlkZSBhbiBheGlzIHRvIHRoZSB1cGRhdGUtc2Nyb2xsIGZ1bmN0aW9uJztcbiAgfVxuXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgdGhyb3cgJ1lvdSBtdXN0IHByb3ZpZGUgYSB2YWx1ZSB0byB0aGUgdXBkYXRlLXNjcm9sbCBmdW5jdGlvbic7XG4gIH1cblxuICBpZiAoYXhpcyA9PT0gJ3RvcCcgJiYgdmFsdWUgPD0gMCkge1xuICAgIGVsZW1lbnQuc2Nyb2xsVG9wID0gdmFsdWUgPSAwOyAvLyBkb24ndCBhbGxvdyBuZWdhdGl2ZSBzY3JvbGxcbiAgICBlbGVtZW50LmRpc3BhdGNoRXZlbnQoY3JlYXRlRE9NRXZlbnQoJ3BzLXktcmVhY2gtc3RhcnQnKSk7XG4gIH1cblxuICBpZiAoYXhpcyA9PT0gJ2xlZnQnICYmIHZhbHVlIDw9IDApIHtcbiAgICBlbGVtZW50LnNjcm9sbExlZnQgPSB2YWx1ZSA9IDA7IC8vIGRvbid0IGFsbG93IG5lZ2F0aXZlIHNjcm9sbFxuICAgIGVsZW1lbnQuZGlzcGF0Y2hFdmVudChjcmVhdGVET01FdmVudCgncHMteC1yZWFjaC1zdGFydCcpKTtcbiAgfVxuXG4gIHZhciBpID0gaW5zdGFuY2VzLmdldChlbGVtZW50KTtcblxuICBpZiAoYXhpcyA9PT0gJ3RvcCcgJiYgdmFsdWUgPj0gaS5jb250ZW50SGVpZ2h0IC0gaS5jb250YWluZXJIZWlnaHQpIHtcbiAgICAvLyBkb24ndCBhbGxvdyBzY3JvbGwgcGFzdCBjb250YWluZXJcbiAgICB2YWx1ZSA9IGkuY29udGVudEhlaWdodCAtIGkuY29udGFpbmVySGVpZ2h0O1xuICAgIGlmICh2YWx1ZSAtIGVsZW1lbnQuc2Nyb2xsVG9wIDw9IDEpIHtcbiAgICAgIC8vIG1pdGlnYXRlcyByb3VuZGluZyBlcnJvcnMgb24gbm9uLXN1YnBpeGVsIHNjcm9sbCB2YWx1ZXNcbiAgICAgIHZhbHVlID0gZWxlbWVudC5zY3JvbGxUb3A7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVsZW1lbnQuc2Nyb2xsVG9wID0gdmFsdWU7XG4gICAgfVxuICAgIGVsZW1lbnQuZGlzcGF0Y2hFdmVudChjcmVhdGVET01FdmVudCgncHMteS1yZWFjaC1lbmQnKSk7XG4gIH1cblxuICBpZiAoYXhpcyA9PT0gJ2xlZnQnICYmIHZhbHVlID49IGkuY29udGVudFdpZHRoIC0gaS5jb250YWluZXJXaWR0aCkge1xuICAgIC8vIGRvbid0IGFsbG93IHNjcm9sbCBwYXN0IGNvbnRhaW5lclxuICAgIHZhbHVlID0gaS5jb250ZW50V2lkdGggLSBpLmNvbnRhaW5lcldpZHRoO1xuICAgIGlmICh2YWx1ZSAtIGVsZW1lbnQuc2Nyb2xsTGVmdCA8PSAxKSB7XG4gICAgICAvLyBtaXRpZ2F0ZXMgcm91bmRpbmcgZXJyb3JzIG9uIG5vbi1zdWJwaXhlbCBzY3JvbGwgdmFsdWVzXG4gICAgICB2YWx1ZSA9IGVsZW1lbnQuc2Nyb2xsTGVmdDtcbiAgICB9IGVsc2Uge1xuICAgICAgZWxlbWVudC5zY3JvbGxMZWZ0ID0gdmFsdWU7XG4gICAgfVxuICAgIGVsZW1lbnQuZGlzcGF0Y2hFdmVudChjcmVhdGVET01FdmVudCgncHMteC1yZWFjaC1lbmQnKSk7XG4gIH1cblxuICBpZiAoIWxhc3RUb3ApIHtcbiAgICBsYXN0VG9wID0gZWxlbWVudC5zY3JvbGxUb3A7XG4gIH1cblxuICBpZiAoIWxhc3RMZWZ0KSB7XG4gICAgbGFzdExlZnQgPSBlbGVtZW50LnNjcm9sbExlZnQ7XG4gIH1cblxuICBpZiAoYXhpcyA9PT0gJ3RvcCcgJiYgdmFsdWUgPCBsYXN0VG9wKSB7XG4gICAgZWxlbWVudC5kaXNwYXRjaEV2ZW50KGNyZWF0ZURPTUV2ZW50KCdwcy1zY3JvbGwtdXAnKSk7XG4gIH1cblxuICBpZiAoYXhpcyA9PT0gJ3RvcCcgJiYgdmFsdWUgPiBsYXN0VG9wKSB7XG4gICAgZWxlbWVudC5kaXNwYXRjaEV2ZW50KGNyZWF0ZURPTUV2ZW50KCdwcy1zY3JvbGwtZG93bicpKTtcbiAgfVxuXG4gIGlmIChheGlzID09PSAnbGVmdCcgJiYgdmFsdWUgPCBsYXN0TGVmdCkge1xuICAgIGVsZW1lbnQuZGlzcGF0Y2hFdmVudChjcmVhdGVET01FdmVudCgncHMtc2Nyb2xsLWxlZnQnKSk7XG4gIH1cblxuICBpZiAoYXhpcyA9PT0gJ2xlZnQnICYmIHZhbHVlID4gbGFzdExlZnQpIHtcbiAgICBlbGVtZW50LmRpc3BhdGNoRXZlbnQoY3JlYXRlRE9NRXZlbnQoJ3BzLXNjcm9sbC1yaWdodCcpKTtcbiAgfVxuXG4gIGlmIChheGlzID09PSAndG9wJykge1xuICAgIGVsZW1lbnQuc2Nyb2xsVG9wID0gbGFzdFRvcCA9IHZhbHVlO1xuICAgIGVsZW1lbnQuZGlzcGF0Y2hFdmVudChjcmVhdGVET01FdmVudCgncHMtc2Nyb2xsLXknKSk7XG4gIH1cblxuICBpZiAoYXhpcyA9PT0gJ2xlZnQnKSB7XG4gICAgZWxlbWVudC5zY3JvbGxMZWZ0ID0gbGFzdExlZnQgPSB2YWx1ZTtcbiAgICBlbGVtZW50LmRpc3BhdGNoRXZlbnQoY3JlYXRlRE9NRXZlbnQoJ3BzLXNjcm9sbC14JykpO1xuICB9XG5cbn07XG5cbn0se1wiLi9pbnN0YW5jZXNcIjoxOH1dLDIxOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIF8gPSByZXF1aXJlKCcuLi9saWIvaGVscGVyJyk7XG52YXIgZG9tID0gcmVxdWlyZSgnLi4vbGliL2RvbScpO1xudmFyIGluc3RhbmNlcyA9IHJlcXVpcmUoJy4vaW5zdGFuY2VzJyk7XG52YXIgdXBkYXRlR2VvbWV0cnkgPSByZXF1aXJlKCcuL3VwZGF0ZS1nZW9tZXRyeScpO1xudmFyIHVwZGF0ZVNjcm9sbCA9IHJlcXVpcmUoJy4vdXBkYXRlLXNjcm9sbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gIHZhciBpID0gaW5zdGFuY2VzLmdldChlbGVtZW50KTtcblxuICBpZiAoIWkpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBSZWNhbGN1YXRlIG5lZ2F0aXZlIHNjcm9sbExlZnQgYWRqdXN0bWVudFxuICBpLm5lZ2F0aXZlU2Nyb2xsQWRqdXN0bWVudCA9IGkuaXNOZWdhdGl2ZVNjcm9sbCA/IGVsZW1lbnQuc2Nyb2xsV2lkdGggLSBlbGVtZW50LmNsaWVudFdpZHRoIDogMDtcblxuICAvLyBSZWNhbGN1bGF0ZSByYWlsIG1hcmdpbnNcbiAgZG9tLmNzcyhpLnNjcm9sbGJhclhSYWlsLCAnZGlzcGxheScsICdibG9jaycpO1xuICBkb20uY3NzKGkuc2Nyb2xsYmFyWVJhaWwsICdkaXNwbGF5JywgJ2Jsb2NrJyk7XG4gIGkucmFpbFhNYXJnaW5XaWR0aCA9IF8udG9JbnQoZG9tLmNzcyhpLnNjcm9sbGJhclhSYWlsLCAnbWFyZ2luTGVmdCcpKSArIF8udG9JbnQoZG9tLmNzcyhpLnNjcm9sbGJhclhSYWlsLCAnbWFyZ2luUmlnaHQnKSk7XG4gIGkucmFpbFlNYXJnaW5IZWlnaHQgPSBfLnRvSW50KGRvbS5jc3MoaS5zY3JvbGxiYXJZUmFpbCwgJ21hcmdpblRvcCcpKSArIF8udG9JbnQoZG9tLmNzcyhpLnNjcm9sbGJhcllSYWlsLCAnbWFyZ2luQm90dG9tJykpO1xuXG4gIC8vIEhpZGUgc2Nyb2xsYmFycyBub3QgdG8gYWZmZWN0IHNjcm9sbFdpZHRoIGFuZCBzY3JvbGxIZWlnaHRcbiAgZG9tLmNzcyhpLnNjcm9sbGJhclhSYWlsLCAnZGlzcGxheScsICdub25lJyk7XG4gIGRvbS5jc3MoaS5zY3JvbGxiYXJZUmFpbCwgJ2Rpc3BsYXknLCAnbm9uZScpO1xuXG4gIHVwZGF0ZUdlb21ldHJ5KGVsZW1lbnQpO1xuXG4gIC8vIFVwZGF0ZSB0b3AvbGVmdCBzY3JvbGwgdG8gdHJpZ2dlciBldmVudHNcbiAgdXBkYXRlU2Nyb2xsKGVsZW1lbnQsICd0b3AnLCBlbGVtZW50LnNjcm9sbFRvcCk7XG4gIHVwZGF0ZVNjcm9sbChlbGVtZW50LCAnbGVmdCcsIGVsZW1lbnQuc2Nyb2xsTGVmdCk7XG5cbiAgZG9tLmNzcyhpLnNjcm9sbGJhclhSYWlsLCAnZGlzcGxheScsICcnKTtcbiAgZG9tLmNzcyhpLnNjcm9sbGJhcllSYWlsLCAnZGlzcGxheScsICcnKTtcbn07XG5cbn0se1wiLi4vbGliL2RvbVwiOjMsXCIuLi9saWIvaGVscGVyXCI6NixcIi4vaW5zdGFuY2VzXCI6MTgsXCIuL3VwZGF0ZS1nZW9tZXRyeVwiOjE5LFwiLi91cGRhdGUtc2Nyb2xsXCI6MjB9XX0se30sWzFdKTtcbiJdLCJmaWxlIjoicGx1Z2lucy9wZXJmZWN0LXNjcm9sbGJhci9wZXJmZWN0LXNjcm9sbGJhci5qcXVlcnkuanMifQ==
