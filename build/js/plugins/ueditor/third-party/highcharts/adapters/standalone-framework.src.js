/**
 * @license Highcharts JS v3.0.6 (2013-10-04)
 *
 * Standalone Highcharts Framework
 *
 * License: MIT License
 */


/*global Highcharts */
var HighchartsAdapter = (function () {

var UNDEFINED,
	doc = document,
	emptyArray = [],
	timers = [],
	timerId,
	Fx;

Math.easeInOutSine = function (t, b, c, d) {
	return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
};



/**
 * Extend given object with custom events
 */
function augment(obj) {
	function removeOneEvent(el, type, fn) {
		el.removeEventListener(type, fn, false);
	}

	function IERemoveOneEvent(el, type, fn) {
		fn = el.HCProxiedMethods[fn.toString()];
		el.detachEvent('on' + type, fn);
	}

	function removeAllEvents(el, type) {
		var events = el.HCEvents,
			remove,
			types,
			len,
			n;

		if (el.removeEventListener) {
			remove = removeOneEvent;
		} else if (el.attachEvent) {
			remove = IERemoveOneEvent;
		} else {
			return; // break on non-DOM events
		}


		if (type) {
			types = {};
			types[type] = true;
		} else {
			types = events;
		}

		for (n in types) {
			if (events[n]) {
				len = events[n].length;
				while (len--) {
					remove(el, n, events[n][len]);
				}
			}
		}
	}

	if (!obj.HCExtended) {
		Highcharts.extend(obj, {
			HCExtended: true,

			HCEvents: {},

			bind: function (name, fn) {
				var el = this,
					events = this.HCEvents,
					wrappedFn;

				// handle DOM events in modern browsers
				if (el.addEventListener) {
					el.addEventListener(name, fn, false);

				// handle old IE implementation
				} else if (el.attachEvent) {
					
					wrappedFn = function (e) {
						fn.call(el, e);
					};

					if (!el.HCProxiedMethods) {
						el.HCProxiedMethods = {};
					}

					// link wrapped fn with original fn, so we can get this in removeEvent
					el.HCProxiedMethods[fn.toString()] = wrappedFn;

					el.attachEvent('on' + name, wrappedFn);
				}


				if (events[name] === UNDEFINED) {
					events[name] = [];
				}

				events[name].push(fn);
			},

			unbind: function (name, fn) {
				var events,
					index;

				if (name) {
					events = this.HCEvents[name] || [];
					if (fn) {
						index = HighchartsAdapter.inArray(fn, events);
						if (index > -1) {
							events.splice(index, 1);
							this.HCEvents[name] = events;
						}
						if (this.removeEventListener) {
							removeOneEvent(this, name, fn);
						} else if (this.attachEvent) {
							IERemoveOneEvent(this, name, fn);
						}
					} else {
						removeAllEvents(this, name);
						this.HCEvents[name] = [];
					}
				} else {
					removeAllEvents(this);
					this.HCEvents = {};
				}
			},

			trigger: function (name, args) {
				var events = this.HCEvents[name] || [],
					target = this,
					len = events.length,
					i,
					preventDefault,
					fn;

				// Attach a simple preventDefault function to skip default handler if called
				preventDefault = function () {
					args.defaultPrevented = true;
				};
				
				for (i = 0; i < len; i++) {
					fn = events[i];

					// args is never null here
					if (args.stopped) {
						return;
					}

					args.preventDefault = preventDefault;
					args.target = target;
					args.type = name; // #2297	
					
					// If the event handler return false, prevent the default handler from executing
					if (fn.call(this, args) === false) {
						args.preventDefault();
					}
				}
			}
		});
	}

	return obj;
}


return {
	/**
	 * Initialize the adapter. This is run once as Highcharts is first run.
	 */
	init: function (pathAnim) {

		/**
		 * Compatibility section to add support for legacy IE. This can be removed if old IE 
		 * support is not needed.
		 */
		if (!doc.defaultView) {
			this._getStyle = function (el, prop) {
				var val;
				if (el.style[prop]) {
					return el.style[prop];
				} else {
					if (prop === 'opacity') {
						prop = 'filter';
					}
					/*jslint unparam: true*/
					val = el.currentStyle[prop.replace(/\-(\w)/g, function (a, b) { return b.toUpperCase(); })];
					if (prop === 'filter') {
						val = val.replace(
							/alpha\(opacity=([0-9]+)\)/, 
							function (a, b) { 
								return b / 100; 
							}
						);
					}
					/*jslint unparam: false*/
					return val === '' ? 1 : val;
				} 
			};
			this.adapterRun = function (elem, method) {
				var alias = { width: 'clientWidth', height: 'clientHeight' }[method];

				if (alias) {
					elem.style.zoom = 1;
					return elem[alias] - 2 * parseInt(HighchartsAdapter._getStyle(elem, 'padding'), 10);
				}
			};
		}

		if (!Array.prototype.forEach) {
			this.each = function (arr, fn) { // legacy
				var i = 0, 
					len = arr.length;
				for (; i < len; i++) {
					if (fn.call(arr[i], arr[i], i, arr) === false) {
						return i;
					}
				}
			};
		}

		if (!Array.prototype.indexOf) {
			this.inArray = function (item, arr) {
				var len, 
					i = 0;

				if (arr) {
					len = arr.length;
					
					for (; i < len; i++) {
						if (arr[i] === item) {
							return i;
						}
					}
				}

				return -1;
			};
		}

		if (!Array.prototype.filter) {
			this.grep = function (elements, callback) {
				var ret = [],
					i = 0,
					length = elements.length;

				for (; i < length; i++) {
					if (!!callback(elements[i], i)) {
						ret.push(elements[i]);
					}
				}

				return ret;
			};
		}

		//--- End compatibility section ---


		/**
		 * Start of animation specific code
		 */
		Fx = function (elem, options, prop) {
			this.options = options;
			this.elem = elem;
			this.prop = prop;
		};
		Fx.prototype = {
			
			update: function () {
				var styles,
					paths = this.paths,
					elem = this.elem,
					elemelem = elem.element; // if destroyed, it is null

				// Animating a path definition on SVGElement
				if (paths && elemelem) {
					elem.attr('d', pathAnim.step(paths[0], paths[1], this.now, this.toD));
				
				// Other animations on SVGElement
				} else if (elem.attr) {
					if (elemelem) {
						elem.attr(this.prop, this.now);
					}

				// HTML styles
				} else {
					styles = {};
					styles[elem] = this.now + this.unit;
					Highcharts.css(elem, styles);
				}
				
				if (this.options.step) {
					this.options.step.call(this.elem, this.now, this);
				}

			},
			custom: function (from, to, unit) {
				var self = this,
					t = function (gotoEnd) {
						return self.step(gotoEnd);
					},
					i;

				this.startTime = +new Date();
				this.start = from;
				this.end = to;
				this.unit = unit;
				this.now = this.start;
				this.pos = this.state = 0;

				t.elem = this.elem;

				if (t() && timers.push(t) === 1) {
					timerId = setInterval(function () {
						
						for (i = 0; i < timers.length; i++) {
							if (!timers[i]()) {
								timers.splice(i--, 1);
							}
						}

						if (!timers.length) {
							clearInterval(timerId);
						}
					}, 13);
				}
			},
			
			step: function (gotoEnd) {
				var t = +new Date(),
					ret,
					done,
					options = this.options,
					i;

				if (this.elem.stopAnimation) {
					ret = false;

				} else if (gotoEnd || t >= options.duration + this.startTime) {
					this.now = this.end;
					this.pos = this.state = 1;
					this.update();

					this.options.curAnim[this.prop] = true;

					done = true;
					for (i in options.curAnim) {
						if (options.curAnim[i] !== true) {
							done = false;
						}
					}

					if (done) {
						if (options.complete) {
							options.complete.call(this.elem);
						}
					}
					ret = false;

				} else {
					var n = t - this.startTime;
					this.state = n / options.duration;
					this.pos = options.easing(n, 0, 1, options.duration);
					this.now = this.start + ((this.end - this.start) * this.pos);
					this.update();
					ret = true;
				}
				return ret;
			}
		};

		/**
		 * The adapter animate method
		 */
		this.animate = function (el, prop, opt) {
			var start,
				unit = '',
				end,
				fx,
				args,
				name;

			el.stopAnimation = false; // ready for new

			if (typeof opt !== 'object' || opt === null) {
				args = arguments;
				opt = {
					duration: args[2],
					easing: args[3],
					complete: args[4]
				};
			}
			if (typeof opt.duration !== 'number') {
				opt.duration = 400;
			}
			opt.easing = Math[opt.easing] || Math.easeInOutSine;
			opt.curAnim = Highcharts.extend({}, prop);
			
			for (name in prop) {
				fx = new Fx(el, opt, name);
				end = null;
				
				if (name === 'd') {
					fx.paths = pathAnim.init(
						el,
						el.d,
						prop.d
					);
					fx.toD = prop.d;
					start = 0;
					end = 1;
				} else if (el.attr) {
					start = el.attr(name);
				} else {
					start = parseFloat(HighchartsAdapter._getStyle(el, name)) || 0;
					if (name !== 'opacity') {
						unit = 'px';
					}
				}
	
				if (!end) {
					end = parseFloat(prop[name]);
				}
				fx.custom(start, end, unit);
			}	
		};
	},

	/**
	 * Internal method to return CSS value for given element and property
	 */
	_getStyle: function (el, prop) {
		return window.getComputedStyle(el).getPropertyValue(prop);
	},

	/**
	 * Downloads a script and executes a callback when done.
	 * @param {String} scriptLocation
	 * @param {Function} callback
	 */
	getScript: function (scriptLocation, callback) {
		// We cannot assume that Assets class from mootools-more is available so instead insert a script tag to download script.
		var head = doc.getElementsByTagName('head')[0],
			script = doc.createElement('script');

		script.type = 'text/javascript';
		script.src = scriptLocation;
		script.onload = callback;

		head.appendChild(script);
	},

	/**
	 * Return the index of an item in an array, or -1 if not found
	 */
	inArray: function (item, arr) {
		return arr.indexOf ? arr.indexOf(item) : emptyArray.indexOf.call(arr, item);
	},


	/**
	 * A direct link to adapter methods
	 */
	adapterRun: function (elem, method) {
		return parseInt(HighchartsAdapter._getStyle(elem, method), 10);
	},

	/**
	 * Filter an array
	 */
	grep: function (elements, callback) {
		return emptyArray.filter.call(elements, callback);
	},

	/**
	 * Map an array
	 */
	map: function (arr, fn) {
		var results = [], i = 0, len = arr.length;

		for (; i < len; i++) {
			results[i] = fn.call(arr[i], arr[i], i, arr);
		}

		return results;
	},

	offset: function (el) {
		var left = 0,
			top = 0;

		while (el) {
			left += el.offsetLeft;
			top += el.offsetTop;
			el = el.offsetParent;
		}

		return {
			left: left,
			top: top
		};
	},

	/**
	 * Add an event listener
	 */
	addEvent: function (el, type, fn) {
		augment(el).bind(type, fn);
	},

	/**
	 * Remove event added with addEvent
	 */
	removeEvent: function (el, type, fn) {
		augment(el).unbind(type, fn);
	},

	/**
	 * Fire an event on a custom object
	 */
	fireEvent: function (el, type, eventArguments, defaultFunction) {
		var e;

		if (doc.createEvent && (el.dispatchEvent || el.fireEvent)) {
			e = doc.createEvent('Events');
			e.initEvent(type, true, true);
			e.target = el;

			Highcharts.extend(e, eventArguments);

			if (el.dispatchEvent) {
				el.dispatchEvent(e);
			} else {
				el.fireEvent(type, e);
			}

		} else if (el.HCExtended === true) {
			eventArguments = eventArguments || {};
			el.trigger(type, eventArguments);
		}

		if (eventArguments && eventArguments.defaultPrevented) {
			defaultFunction = null;
		}

		if (defaultFunction) {
			defaultFunction(eventArguments);
		}
	},

	washMouseEvent: function (e) {
		return e;
	},


	/**
	 * Stop running animation
	 */
	stop: function (el) {
		el.stopAnimation = true;
	},

	/**
	 * Utility for iterating over an array. Parameters are reversed compared to jQuery.
	 * @param {Array} arr
	 * @param {Function} fn
	 */
	each: function (arr, fn) { // modern browsers
		return Array.prototype.forEach.call(arr, fn);
	}
};
}());

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvdGhpcmQtcGFydHkvaGlnaGNoYXJ0cy9hZGFwdGVycy9zdGFuZGFsb25lLWZyYW1ld29yay5zcmMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZSBIaWdoY2hhcnRzIEpTIHYzLjAuNiAoMjAxMy0xMC0wNClcbiAqXG4gKiBTdGFuZGFsb25lIEhpZ2hjaGFydHMgRnJhbWV3b3JrXG4gKlxuICogTGljZW5zZTogTUlUIExpY2Vuc2VcbiAqL1xuXG5cbi8qZ2xvYmFsIEhpZ2hjaGFydHMgKi9cbnZhciBIaWdoY2hhcnRzQWRhcHRlciA9IChmdW5jdGlvbiAoKSB7XG5cbnZhciBVTkRFRklORUQsXG5cdGRvYyA9IGRvY3VtZW50LFxuXHRlbXB0eUFycmF5ID0gW10sXG5cdHRpbWVycyA9IFtdLFxuXHR0aW1lcklkLFxuXHRGeDtcblxuTWF0aC5lYXNlSW5PdXRTaW5lID0gZnVuY3Rpb24gKHQsIGIsIGMsIGQpIHtcblx0cmV0dXJuIC1jIC8gMiAqIChNYXRoLmNvcyhNYXRoLlBJICogdCAvIGQpIC0gMSkgKyBiO1xufTtcblxuXG5cbi8qKlxuICogRXh0ZW5kIGdpdmVuIG9iamVjdCB3aXRoIGN1c3RvbSBldmVudHNcbiAqL1xuZnVuY3Rpb24gYXVnbWVudChvYmopIHtcblx0ZnVuY3Rpb24gcmVtb3ZlT25lRXZlbnQoZWwsIHR5cGUsIGZuKSB7XG5cdFx0ZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlLCBmbiwgZmFsc2UpO1xuXHR9XG5cblx0ZnVuY3Rpb24gSUVSZW1vdmVPbmVFdmVudChlbCwgdHlwZSwgZm4pIHtcblx0XHRmbiA9IGVsLkhDUHJveGllZE1ldGhvZHNbZm4udG9TdHJpbmcoKV07XG5cdFx0ZWwuZGV0YWNoRXZlbnQoJ29uJyArIHR5cGUsIGZuKTtcblx0fVxuXG5cdGZ1bmN0aW9uIHJlbW92ZUFsbEV2ZW50cyhlbCwgdHlwZSkge1xuXHRcdHZhciBldmVudHMgPSBlbC5IQ0V2ZW50cyxcblx0XHRcdHJlbW92ZSxcblx0XHRcdHR5cGVzLFxuXHRcdFx0bGVuLFxuXHRcdFx0bjtcblxuXHRcdGlmIChlbC5yZW1vdmVFdmVudExpc3RlbmVyKSB7XG5cdFx0XHRyZW1vdmUgPSByZW1vdmVPbmVFdmVudDtcblx0XHR9IGVsc2UgaWYgKGVsLmF0dGFjaEV2ZW50KSB7XG5cdFx0XHRyZW1vdmUgPSBJRVJlbW92ZU9uZUV2ZW50O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm47IC8vIGJyZWFrIG9uIG5vbi1ET00gZXZlbnRzXG5cdFx0fVxuXG5cblx0XHRpZiAodHlwZSkge1xuXHRcdFx0dHlwZXMgPSB7fTtcblx0XHRcdHR5cGVzW3R5cGVdID0gdHJ1ZTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dHlwZXMgPSBldmVudHM7XG5cdFx0fVxuXG5cdFx0Zm9yIChuIGluIHR5cGVzKSB7XG5cdFx0XHRpZiAoZXZlbnRzW25dKSB7XG5cdFx0XHRcdGxlbiA9IGV2ZW50c1tuXS5sZW5ndGg7XG5cdFx0XHRcdHdoaWxlIChsZW4tLSkge1xuXHRcdFx0XHRcdHJlbW92ZShlbCwgbiwgZXZlbnRzW25dW2xlbl0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0aWYgKCFvYmouSENFeHRlbmRlZCkge1xuXHRcdEhpZ2hjaGFydHMuZXh0ZW5kKG9iaiwge1xuXHRcdFx0SENFeHRlbmRlZDogdHJ1ZSxcblxuXHRcdFx0SENFdmVudHM6IHt9LFxuXG5cdFx0XHRiaW5kOiBmdW5jdGlvbiAobmFtZSwgZm4pIHtcblx0XHRcdFx0dmFyIGVsID0gdGhpcyxcblx0XHRcdFx0XHRldmVudHMgPSB0aGlzLkhDRXZlbnRzLFxuXHRcdFx0XHRcdHdyYXBwZWRGbjtcblxuXHRcdFx0XHQvLyBoYW5kbGUgRE9NIGV2ZW50cyBpbiBtb2Rlcm4gYnJvd3NlcnNcblx0XHRcdFx0aWYgKGVsLmFkZEV2ZW50TGlzdGVuZXIpIHtcblx0XHRcdFx0XHRlbC5hZGRFdmVudExpc3RlbmVyKG5hbWUsIGZuLCBmYWxzZSk7XG5cblx0XHRcdFx0Ly8gaGFuZGxlIG9sZCBJRSBpbXBsZW1lbnRhdGlvblxuXHRcdFx0XHR9IGVsc2UgaWYgKGVsLmF0dGFjaEV2ZW50KSB7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0d3JhcHBlZEZuID0gZnVuY3Rpb24gKGUpIHtcblx0XHRcdFx0XHRcdGZuLmNhbGwoZWwsIGUpO1xuXHRcdFx0XHRcdH07XG5cblx0XHRcdFx0XHRpZiAoIWVsLkhDUHJveGllZE1ldGhvZHMpIHtcblx0XHRcdFx0XHRcdGVsLkhDUHJveGllZE1ldGhvZHMgPSB7fTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHQvLyBsaW5rIHdyYXBwZWQgZm4gd2l0aCBvcmlnaW5hbCBmbiwgc28gd2UgY2FuIGdldCB0aGlzIGluIHJlbW92ZUV2ZW50XG5cdFx0XHRcdFx0ZWwuSENQcm94aWVkTWV0aG9kc1tmbi50b1N0cmluZygpXSA9IHdyYXBwZWRGbjtcblxuXHRcdFx0XHRcdGVsLmF0dGFjaEV2ZW50KCdvbicgKyBuYW1lLCB3cmFwcGVkRm4pO1xuXHRcdFx0XHR9XG5cblxuXHRcdFx0XHRpZiAoZXZlbnRzW25hbWVdID09PSBVTkRFRklORUQpIHtcblx0XHRcdFx0XHRldmVudHNbbmFtZV0gPSBbXTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGV2ZW50c1tuYW1lXS5wdXNoKGZuKTtcblx0XHRcdH0sXG5cblx0XHRcdHVuYmluZDogZnVuY3Rpb24gKG5hbWUsIGZuKSB7XG5cdFx0XHRcdHZhciBldmVudHMsXG5cdFx0XHRcdFx0aW5kZXg7XG5cblx0XHRcdFx0aWYgKG5hbWUpIHtcblx0XHRcdFx0XHRldmVudHMgPSB0aGlzLkhDRXZlbnRzW25hbWVdIHx8IFtdO1xuXHRcdFx0XHRcdGlmIChmbikge1xuXHRcdFx0XHRcdFx0aW5kZXggPSBIaWdoY2hhcnRzQWRhcHRlci5pbkFycmF5KGZuLCBldmVudHMpO1xuXHRcdFx0XHRcdFx0aWYgKGluZGV4ID4gLTEpIHtcblx0XHRcdFx0XHRcdFx0ZXZlbnRzLnNwbGljZShpbmRleCwgMSk7XG5cdFx0XHRcdFx0XHRcdHRoaXMuSENFdmVudHNbbmFtZV0gPSBldmVudHM7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRpZiAodGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKSB7XG5cdFx0XHRcdFx0XHRcdHJlbW92ZU9uZUV2ZW50KHRoaXMsIG5hbWUsIGZuKTtcblx0XHRcdFx0XHRcdH0gZWxzZSBpZiAodGhpcy5hdHRhY2hFdmVudCkge1xuXHRcdFx0XHRcdFx0XHRJRVJlbW92ZU9uZUV2ZW50KHRoaXMsIG5hbWUsIGZuKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0cmVtb3ZlQWxsRXZlbnRzKHRoaXMsIG5hbWUpO1xuXHRcdFx0XHRcdFx0dGhpcy5IQ0V2ZW50c1tuYW1lXSA9IFtdO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZW1vdmVBbGxFdmVudHModGhpcyk7XG5cdFx0XHRcdFx0dGhpcy5IQ0V2ZW50cyA9IHt9O1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXG5cdFx0XHR0cmlnZ2VyOiBmdW5jdGlvbiAobmFtZSwgYXJncykge1xuXHRcdFx0XHR2YXIgZXZlbnRzID0gdGhpcy5IQ0V2ZW50c1tuYW1lXSB8fCBbXSxcblx0XHRcdFx0XHR0YXJnZXQgPSB0aGlzLFxuXHRcdFx0XHRcdGxlbiA9IGV2ZW50cy5sZW5ndGgsXG5cdFx0XHRcdFx0aSxcblx0XHRcdFx0XHRwcmV2ZW50RGVmYXVsdCxcblx0XHRcdFx0XHRmbjtcblxuXHRcdFx0XHQvLyBBdHRhY2ggYSBzaW1wbGUgcHJldmVudERlZmF1bHQgZnVuY3Rpb24gdG8gc2tpcCBkZWZhdWx0IGhhbmRsZXIgaWYgY2FsbGVkXG5cdFx0XHRcdHByZXZlbnREZWZhdWx0ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdGFyZ3MuZGVmYXVsdFByZXZlbnRlZCA9IHRydWU7XG5cdFx0XHRcdH07XG5cdFx0XHRcdFxuXHRcdFx0XHRmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdFx0XHRmbiA9IGV2ZW50c1tpXTtcblxuXHRcdFx0XHRcdC8vIGFyZ3MgaXMgbmV2ZXIgbnVsbCBoZXJlXG5cdFx0XHRcdFx0aWYgKGFyZ3Muc3RvcHBlZCkge1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGFyZ3MucHJldmVudERlZmF1bHQgPSBwcmV2ZW50RGVmYXVsdDtcblx0XHRcdFx0XHRhcmdzLnRhcmdldCA9IHRhcmdldDtcblx0XHRcdFx0XHRhcmdzLnR5cGUgPSBuYW1lOyAvLyAjMjI5N1x0XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0Ly8gSWYgdGhlIGV2ZW50IGhhbmRsZXIgcmV0dXJuIGZhbHNlLCBwcmV2ZW50IHRoZSBkZWZhdWx0IGhhbmRsZXIgZnJvbSBleGVjdXRpbmdcblx0XHRcdFx0XHRpZiAoZm4uY2FsbCh0aGlzLCBhcmdzKSA9PT0gZmFsc2UpIHtcblx0XHRcdFx0XHRcdGFyZ3MucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXG5cdHJldHVybiBvYmo7XG59XG5cblxucmV0dXJuIHtcblx0LyoqXG5cdCAqIEluaXRpYWxpemUgdGhlIGFkYXB0ZXIuIFRoaXMgaXMgcnVuIG9uY2UgYXMgSGlnaGNoYXJ0cyBpcyBmaXJzdCBydW4uXG5cdCAqL1xuXHRpbml0OiBmdW5jdGlvbiAocGF0aEFuaW0pIHtcblxuXHRcdC8qKlxuXHRcdCAqIENvbXBhdGliaWxpdHkgc2VjdGlvbiB0byBhZGQgc3VwcG9ydCBmb3IgbGVnYWN5IElFLiBUaGlzIGNhbiBiZSByZW1vdmVkIGlmIG9sZCBJRSBcblx0XHQgKiBzdXBwb3J0IGlzIG5vdCBuZWVkZWQuXG5cdFx0ICovXG5cdFx0aWYgKCFkb2MuZGVmYXVsdFZpZXcpIHtcblx0XHRcdHRoaXMuX2dldFN0eWxlID0gZnVuY3Rpb24gKGVsLCBwcm9wKSB7XG5cdFx0XHRcdHZhciB2YWw7XG5cdFx0XHRcdGlmIChlbC5zdHlsZVtwcm9wXSkge1xuXHRcdFx0XHRcdHJldHVybiBlbC5zdHlsZVtwcm9wXTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRpZiAocHJvcCA9PT0gJ29wYWNpdHknKSB7XG5cdFx0XHRcdFx0XHRwcm9wID0gJ2ZpbHRlcic7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdC8qanNsaW50IHVucGFyYW06IHRydWUqL1xuXHRcdFx0XHRcdHZhbCA9IGVsLmN1cnJlbnRTdHlsZVtwcm9wLnJlcGxhY2UoL1xcLShcXHcpL2csIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBiLnRvVXBwZXJDYXNlKCk7IH0pXTtcblx0XHRcdFx0XHRpZiAocHJvcCA9PT0gJ2ZpbHRlcicpIHtcblx0XHRcdFx0XHRcdHZhbCA9IHZhbC5yZXBsYWNlKFxuXHRcdFx0XHRcdFx0XHQvYWxwaGFcXChvcGFjaXR5PShbMC05XSspXFwpLywgXG5cdFx0XHRcdFx0XHRcdGZ1bmN0aW9uIChhLCBiKSB7IFxuXHRcdFx0XHRcdFx0XHRcdHJldHVybiBiIC8gMTAwOyBcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Lypqc2xpbnQgdW5wYXJhbTogZmFsc2UqL1xuXHRcdFx0XHRcdHJldHVybiB2YWwgPT09ICcnID8gMSA6IHZhbDtcblx0XHRcdFx0fSBcblx0XHRcdH07XG5cdFx0XHR0aGlzLmFkYXB0ZXJSdW4gPSBmdW5jdGlvbiAoZWxlbSwgbWV0aG9kKSB7XG5cdFx0XHRcdHZhciBhbGlhcyA9IHsgd2lkdGg6ICdjbGllbnRXaWR0aCcsIGhlaWdodDogJ2NsaWVudEhlaWdodCcgfVttZXRob2RdO1xuXG5cdFx0XHRcdGlmIChhbGlhcykge1xuXHRcdFx0XHRcdGVsZW0uc3R5bGUuem9vbSA9IDE7XG5cdFx0XHRcdFx0cmV0dXJuIGVsZW1bYWxpYXNdIC0gMiAqIHBhcnNlSW50KEhpZ2hjaGFydHNBZGFwdGVyLl9nZXRTdHlsZShlbGVtLCAncGFkZGluZycpLCAxMCk7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0aWYgKCFBcnJheS5wcm90b3R5cGUuZm9yRWFjaCkge1xuXHRcdFx0dGhpcy5lYWNoID0gZnVuY3Rpb24gKGFyciwgZm4pIHsgLy8gbGVnYWN5XG5cdFx0XHRcdHZhciBpID0gMCwgXG5cdFx0XHRcdFx0bGVuID0gYXJyLmxlbmd0aDtcblx0XHRcdFx0Zm9yICg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0XHRcdGlmIChmbi5jYWxsKGFycltpXSwgYXJyW2ldLCBpLCBhcnIpID09PSBmYWxzZSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIGk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdGlmICghQXJyYXkucHJvdG90eXBlLmluZGV4T2YpIHtcblx0XHRcdHRoaXMuaW5BcnJheSA9IGZ1bmN0aW9uIChpdGVtLCBhcnIpIHtcblx0XHRcdFx0dmFyIGxlbiwgXG5cdFx0XHRcdFx0aSA9IDA7XG5cblx0XHRcdFx0aWYgKGFycikge1xuXHRcdFx0XHRcdGxlbiA9IGFyci5sZW5ndGg7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0Zm9yICg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0XHRcdFx0aWYgKGFycltpXSA9PT0gaXRlbSkge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gaTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gLTE7XG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdGlmICghQXJyYXkucHJvdG90eXBlLmZpbHRlcikge1xuXHRcdFx0dGhpcy5ncmVwID0gZnVuY3Rpb24gKGVsZW1lbnRzLCBjYWxsYmFjaykge1xuXHRcdFx0XHR2YXIgcmV0ID0gW10sXG5cdFx0XHRcdFx0aSA9IDAsXG5cdFx0XHRcdFx0bGVuZ3RoID0gZWxlbWVudHMubGVuZ3RoO1xuXG5cdFx0XHRcdGZvciAoOyBpIDwgbGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRpZiAoISFjYWxsYmFjayhlbGVtZW50c1tpXSwgaSkpIHtcblx0XHRcdFx0XHRcdHJldC5wdXNoKGVsZW1lbnRzW2ldKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gcmV0O1xuXHRcdFx0fTtcblx0XHR9XG5cblx0XHQvLy0tLSBFbmQgY29tcGF0aWJpbGl0eSBzZWN0aW9uIC0tLVxuXG5cblx0XHQvKipcblx0XHQgKiBTdGFydCBvZiBhbmltYXRpb24gc3BlY2lmaWMgY29kZVxuXHRcdCAqL1xuXHRcdEZ4ID0gZnVuY3Rpb24gKGVsZW0sIG9wdGlvbnMsIHByb3ApIHtcblx0XHRcdHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG5cdFx0XHR0aGlzLmVsZW0gPSBlbGVtO1xuXHRcdFx0dGhpcy5wcm9wID0gcHJvcDtcblx0XHR9O1xuXHRcdEZ4LnByb3RvdHlwZSA9IHtcblx0XHRcdFxuXHRcdFx0dXBkYXRlOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdHZhciBzdHlsZXMsXG5cdFx0XHRcdFx0cGF0aHMgPSB0aGlzLnBhdGhzLFxuXHRcdFx0XHRcdGVsZW0gPSB0aGlzLmVsZW0sXG5cdFx0XHRcdFx0ZWxlbWVsZW0gPSBlbGVtLmVsZW1lbnQ7IC8vIGlmIGRlc3Ryb3llZCwgaXQgaXMgbnVsbFxuXG5cdFx0XHRcdC8vIEFuaW1hdGluZyBhIHBhdGggZGVmaW5pdGlvbiBvbiBTVkdFbGVtZW50XG5cdFx0XHRcdGlmIChwYXRocyAmJiBlbGVtZWxlbSkge1xuXHRcdFx0XHRcdGVsZW0uYXR0cignZCcsIHBhdGhBbmltLnN0ZXAocGF0aHNbMF0sIHBhdGhzWzFdLCB0aGlzLm5vdywgdGhpcy50b0QpKTtcblx0XHRcdFx0XG5cdFx0XHRcdC8vIE90aGVyIGFuaW1hdGlvbnMgb24gU1ZHRWxlbWVudFxuXHRcdFx0XHR9IGVsc2UgaWYgKGVsZW0uYXR0cikge1xuXHRcdFx0XHRcdGlmIChlbGVtZWxlbSkge1xuXHRcdFx0XHRcdFx0ZWxlbS5hdHRyKHRoaXMucHJvcCwgdGhpcy5ub3cpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBIVE1MIHN0eWxlc1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHN0eWxlcyA9IHt9O1xuXHRcdFx0XHRcdHN0eWxlc1tlbGVtXSA9IHRoaXMubm93ICsgdGhpcy51bml0O1xuXHRcdFx0XHRcdEhpZ2hjaGFydHMuY3NzKGVsZW0sIHN0eWxlcyk7XG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHRcdGlmICh0aGlzLm9wdGlvbnMuc3RlcCkge1xuXHRcdFx0XHRcdHRoaXMub3B0aW9ucy5zdGVwLmNhbGwodGhpcy5lbGVtLCB0aGlzLm5vdywgdGhpcyk7XG5cdFx0XHRcdH1cblxuXHRcdFx0fSxcblx0XHRcdGN1c3RvbTogZnVuY3Rpb24gKGZyb20sIHRvLCB1bml0KSB7XG5cdFx0XHRcdHZhciBzZWxmID0gdGhpcyxcblx0XHRcdFx0XHR0ID0gZnVuY3Rpb24gKGdvdG9FbmQpIHtcblx0XHRcdFx0XHRcdHJldHVybiBzZWxmLnN0ZXAoZ290b0VuZCk7XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRpO1xuXG5cdFx0XHRcdHRoaXMuc3RhcnRUaW1lID0gK25ldyBEYXRlKCk7XG5cdFx0XHRcdHRoaXMuc3RhcnQgPSBmcm9tO1xuXHRcdFx0XHR0aGlzLmVuZCA9IHRvO1xuXHRcdFx0XHR0aGlzLnVuaXQgPSB1bml0O1xuXHRcdFx0XHR0aGlzLm5vdyA9IHRoaXMuc3RhcnQ7XG5cdFx0XHRcdHRoaXMucG9zID0gdGhpcy5zdGF0ZSA9IDA7XG5cblx0XHRcdFx0dC5lbGVtID0gdGhpcy5lbGVtO1xuXG5cdFx0XHRcdGlmICh0KCkgJiYgdGltZXJzLnB1c2godCkgPT09IDEpIHtcblx0XHRcdFx0XHR0aW1lcklkID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHRmb3IgKGkgPSAwOyBpIDwgdGltZXJzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0XHRcdGlmICghdGltZXJzW2ldKCkpIHtcblx0XHRcdFx0XHRcdFx0XHR0aW1lcnMuc3BsaWNlKGktLSwgMSk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0aWYgKCF0aW1lcnMubGVuZ3RoKSB7XG5cdFx0XHRcdFx0XHRcdGNsZWFySW50ZXJ2YWwodGltZXJJZCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSwgMTMpO1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0XG5cdFx0XHRzdGVwOiBmdW5jdGlvbiAoZ290b0VuZCkge1xuXHRcdFx0XHR2YXIgdCA9ICtuZXcgRGF0ZSgpLFxuXHRcdFx0XHRcdHJldCxcblx0XHRcdFx0XHRkb25lLFxuXHRcdFx0XHRcdG9wdGlvbnMgPSB0aGlzLm9wdGlvbnMsXG5cdFx0XHRcdFx0aTtcblxuXHRcdFx0XHRpZiAodGhpcy5lbGVtLnN0b3BBbmltYXRpb24pIHtcblx0XHRcdFx0XHRyZXQgPSBmYWxzZTtcblxuXHRcdFx0XHR9IGVsc2UgaWYgKGdvdG9FbmQgfHwgdCA+PSBvcHRpb25zLmR1cmF0aW9uICsgdGhpcy5zdGFydFRpbWUpIHtcblx0XHRcdFx0XHR0aGlzLm5vdyA9IHRoaXMuZW5kO1xuXHRcdFx0XHRcdHRoaXMucG9zID0gdGhpcy5zdGF0ZSA9IDE7XG5cdFx0XHRcdFx0dGhpcy51cGRhdGUoKTtcblxuXHRcdFx0XHRcdHRoaXMub3B0aW9ucy5jdXJBbmltW3RoaXMucHJvcF0gPSB0cnVlO1xuXG5cdFx0XHRcdFx0ZG9uZSA9IHRydWU7XG5cdFx0XHRcdFx0Zm9yIChpIGluIG9wdGlvbnMuY3VyQW5pbSkge1xuXHRcdFx0XHRcdFx0aWYgKG9wdGlvbnMuY3VyQW5pbVtpXSAhPT0gdHJ1ZSkge1xuXHRcdFx0XHRcdFx0XHRkb25lID0gZmFsc2U7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKGRvbmUpIHtcblx0XHRcdFx0XHRcdGlmIChvcHRpb25zLmNvbXBsZXRlKSB7XG5cdFx0XHRcdFx0XHRcdG9wdGlvbnMuY29tcGxldGUuY2FsbCh0aGlzLmVsZW0pO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRyZXQgPSBmYWxzZTtcblxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHZhciBuID0gdCAtIHRoaXMuc3RhcnRUaW1lO1xuXHRcdFx0XHRcdHRoaXMuc3RhdGUgPSBuIC8gb3B0aW9ucy5kdXJhdGlvbjtcblx0XHRcdFx0XHR0aGlzLnBvcyA9IG9wdGlvbnMuZWFzaW5nKG4sIDAsIDEsIG9wdGlvbnMuZHVyYXRpb24pO1xuXHRcdFx0XHRcdHRoaXMubm93ID0gdGhpcy5zdGFydCArICgodGhpcy5lbmQgLSB0aGlzLnN0YXJ0KSAqIHRoaXMucG9zKTtcblx0XHRcdFx0XHR0aGlzLnVwZGF0ZSgpO1xuXHRcdFx0XHRcdHJldCA9IHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIHJldDtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogVGhlIGFkYXB0ZXIgYW5pbWF0ZSBtZXRob2Rcblx0XHQgKi9cblx0XHR0aGlzLmFuaW1hdGUgPSBmdW5jdGlvbiAoZWwsIHByb3AsIG9wdCkge1xuXHRcdFx0dmFyIHN0YXJ0LFxuXHRcdFx0XHR1bml0ID0gJycsXG5cdFx0XHRcdGVuZCxcblx0XHRcdFx0ZngsXG5cdFx0XHRcdGFyZ3MsXG5cdFx0XHRcdG5hbWU7XG5cblx0XHRcdGVsLnN0b3BBbmltYXRpb24gPSBmYWxzZTsgLy8gcmVhZHkgZm9yIG5ld1xuXG5cdFx0XHRpZiAodHlwZW9mIG9wdCAhPT0gJ29iamVjdCcgfHwgb3B0ID09PSBudWxsKSB7XG5cdFx0XHRcdGFyZ3MgPSBhcmd1bWVudHM7XG5cdFx0XHRcdG9wdCA9IHtcblx0XHRcdFx0XHRkdXJhdGlvbjogYXJnc1syXSxcblx0XHRcdFx0XHRlYXNpbmc6IGFyZ3NbM10sXG5cdFx0XHRcdFx0Y29tcGxldGU6IGFyZ3NbNF1cblx0XHRcdFx0fTtcblx0XHRcdH1cblx0XHRcdGlmICh0eXBlb2Ygb3B0LmR1cmF0aW9uICE9PSAnbnVtYmVyJykge1xuXHRcdFx0XHRvcHQuZHVyYXRpb24gPSA0MDA7XG5cdFx0XHR9XG5cdFx0XHRvcHQuZWFzaW5nID0gTWF0aFtvcHQuZWFzaW5nXSB8fCBNYXRoLmVhc2VJbk91dFNpbmU7XG5cdFx0XHRvcHQuY3VyQW5pbSA9IEhpZ2hjaGFydHMuZXh0ZW5kKHt9LCBwcm9wKTtcblx0XHRcdFxuXHRcdFx0Zm9yIChuYW1lIGluIHByb3ApIHtcblx0XHRcdFx0ZnggPSBuZXcgRngoZWwsIG9wdCwgbmFtZSk7XG5cdFx0XHRcdGVuZCA9IG51bGw7XG5cdFx0XHRcdFxuXHRcdFx0XHRpZiAobmFtZSA9PT0gJ2QnKSB7XG5cdFx0XHRcdFx0ZngucGF0aHMgPSBwYXRoQW5pbS5pbml0KFxuXHRcdFx0XHRcdFx0ZWwsXG5cdFx0XHRcdFx0XHRlbC5kLFxuXHRcdFx0XHRcdFx0cHJvcC5kXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRmeC50b0QgPSBwcm9wLmQ7XG5cdFx0XHRcdFx0c3RhcnQgPSAwO1xuXHRcdFx0XHRcdGVuZCA9IDE7XG5cdFx0XHRcdH0gZWxzZSBpZiAoZWwuYXR0cikge1xuXHRcdFx0XHRcdHN0YXJ0ID0gZWwuYXR0cihuYW1lKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRzdGFydCA9IHBhcnNlRmxvYXQoSGlnaGNoYXJ0c0FkYXB0ZXIuX2dldFN0eWxlKGVsLCBuYW1lKSkgfHwgMDtcblx0XHRcdFx0XHRpZiAobmFtZSAhPT0gJ29wYWNpdHknKSB7XG5cdFx0XHRcdFx0XHR1bml0ID0gJ3B4Jztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XG5cdFx0XHRcdGlmICghZW5kKSB7XG5cdFx0XHRcdFx0ZW5kID0gcGFyc2VGbG9hdChwcm9wW25hbWVdKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRmeC5jdXN0b20oc3RhcnQsIGVuZCwgdW5pdCk7XG5cdFx0XHR9XHRcblx0XHR9O1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBJbnRlcm5hbCBtZXRob2QgdG8gcmV0dXJuIENTUyB2YWx1ZSBmb3IgZ2l2ZW4gZWxlbWVudCBhbmQgcHJvcGVydHlcblx0ICovXG5cdF9nZXRTdHlsZTogZnVuY3Rpb24gKGVsLCBwcm9wKSB7XG5cdFx0cmV0dXJuIHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsKS5nZXRQcm9wZXJ0eVZhbHVlKHByb3ApO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBEb3dubG9hZHMgYSBzY3JpcHQgYW5kIGV4ZWN1dGVzIGEgY2FsbGJhY2sgd2hlbiBkb25lLlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gc2NyaXB0TG9jYXRpb25cblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcblx0ICovXG5cdGdldFNjcmlwdDogZnVuY3Rpb24gKHNjcmlwdExvY2F0aW9uLCBjYWxsYmFjaykge1xuXHRcdC8vIFdlIGNhbm5vdCBhc3N1bWUgdGhhdCBBc3NldHMgY2xhc3MgZnJvbSBtb290b29scy1tb3JlIGlzIGF2YWlsYWJsZSBzbyBpbnN0ZWFkIGluc2VydCBhIHNjcmlwdCB0YWcgdG8gZG93bmxvYWQgc2NyaXB0LlxuXHRcdHZhciBoZWFkID0gZG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0sXG5cdFx0XHRzY3JpcHQgPSBkb2MuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG5cblx0XHRzY3JpcHQudHlwZSA9ICd0ZXh0L2phdmFzY3JpcHQnO1xuXHRcdHNjcmlwdC5zcmMgPSBzY3JpcHRMb2NhdGlvbjtcblx0XHRzY3JpcHQub25sb2FkID0gY2FsbGJhY2s7XG5cblx0XHRoZWFkLmFwcGVuZENoaWxkKHNjcmlwdCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFJldHVybiB0aGUgaW5kZXggb2YgYW4gaXRlbSBpbiBhbiBhcnJheSwgb3IgLTEgaWYgbm90IGZvdW5kXG5cdCAqL1xuXHRpbkFycmF5OiBmdW5jdGlvbiAoaXRlbSwgYXJyKSB7XG5cdFx0cmV0dXJuIGFyci5pbmRleE9mID8gYXJyLmluZGV4T2YoaXRlbSkgOiBlbXB0eUFycmF5LmluZGV4T2YuY2FsbChhcnIsIGl0ZW0pO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIEEgZGlyZWN0IGxpbmsgdG8gYWRhcHRlciBtZXRob2RzXG5cdCAqL1xuXHRhZGFwdGVyUnVuOiBmdW5jdGlvbiAoZWxlbSwgbWV0aG9kKSB7XG5cdFx0cmV0dXJuIHBhcnNlSW50KEhpZ2hjaGFydHNBZGFwdGVyLl9nZXRTdHlsZShlbGVtLCBtZXRob2QpLCAxMCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEZpbHRlciBhbiBhcnJheVxuXHQgKi9cblx0Z3JlcDogZnVuY3Rpb24gKGVsZW1lbnRzLCBjYWxsYmFjaykge1xuXHRcdHJldHVybiBlbXB0eUFycmF5LmZpbHRlci5jYWxsKGVsZW1lbnRzLCBjYWxsYmFjayk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIE1hcCBhbiBhcnJheVxuXHQgKi9cblx0bWFwOiBmdW5jdGlvbiAoYXJyLCBmbikge1xuXHRcdHZhciByZXN1bHRzID0gW10sIGkgPSAwLCBsZW4gPSBhcnIubGVuZ3RoO1xuXG5cdFx0Zm9yICg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0cmVzdWx0c1tpXSA9IGZuLmNhbGwoYXJyW2ldLCBhcnJbaV0sIGksIGFycik7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJlc3VsdHM7XG5cdH0sXG5cblx0b2Zmc2V0OiBmdW5jdGlvbiAoZWwpIHtcblx0XHR2YXIgbGVmdCA9IDAsXG5cdFx0XHR0b3AgPSAwO1xuXG5cdFx0d2hpbGUgKGVsKSB7XG5cdFx0XHRsZWZ0ICs9IGVsLm9mZnNldExlZnQ7XG5cdFx0XHR0b3AgKz0gZWwub2Zmc2V0VG9wO1xuXHRcdFx0ZWwgPSBlbC5vZmZzZXRQYXJlbnQ7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdGxlZnQ6IGxlZnQsXG5cdFx0XHR0b3A6IHRvcFxuXHRcdH07XG5cdH0sXG5cblx0LyoqXG5cdCAqIEFkZCBhbiBldmVudCBsaXN0ZW5lclxuXHQgKi9cblx0YWRkRXZlbnQ6IGZ1bmN0aW9uIChlbCwgdHlwZSwgZm4pIHtcblx0XHRhdWdtZW50KGVsKS5iaW5kKHR5cGUsIGZuKTtcblx0fSxcblxuXHQvKipcblx0ICogUmVtb3ZlIGV2ZW50IGFkZGVkIHdpdGggYWRkRXZlbnRcblx0ICovXG5cdHJlbW92ZUV2ZW50OiBmdW5jdGlvbiAoZWwsIHR5cGUsIGZuKSB7XG5cdFx0YXVnbWVudChlbCkudW5iaW5kKHR5cGUsIGZuKTtcblx0fSxcblxuXHQvKipcblx0ICogRmlyZSBhbiBldmVudCBvbiBhIGN1c3RvbSBvYmplY3Rcblx0ICovXG5cdGZpcmVFdmVudDogZnVuY3Rpb24gKGVsLCB0eXBlLCBldmVudEFyZ3VtZW50cywgZGVmYXVsdEZ1bmN0aW9uKSB7XG5cdFx0dmFyIGU7XG5cblx0XHRpZiAoZG9jLmNyZWF0ZUV2ZW50ICYmIChlbC5kaXNwYXRjaEV2ZW50IHx8IGVsLmZpcmVFdmVudCkpIHtcblx0XHRcdGUgPSBkb2MuY3JlYXRlRXZlbnQoJ0V2ZW50cycpO1xuXHRcdFx0ZS5pbml0RXZlbnQodHlwZSwgdHJ1ZSwgdHJ1ZSk7XG5cdFx0XHRlLnRhcmdldCA9IGVsO1xuXG5cdFx0XHRIaWdoY2hhcnRzLmV4dGVuZChlLCBldmVudEFyZ3VtZW50cyk7XG5cblx0XHRcdGlmIChlbC5kaXNwYXRjaEV2ZW50KSB7XG5cdFx0XHRcdGVsLmRpc3BhdGNoRXZlbnQoZSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRlbC5maXJlRXZlbnQodHlwZSwgZSk7XG5cdFx0XHR9XG5cblx0XHR9IGVsc2UgaWYgKGVsLkhDRXh0ZW5kZWQgPT09IHRydWUpIHtcblx0XHRcdGV2ZW50QXJndW1lbnRzID0gZXZlbnRBcmd1bWVudHMgfHwge307XG5cdFx0XHRlbC50cmlnZ2VyKHR5cGUsIGV2ZW50QXJndW1lbnRzKTtcblx0XHR9XG5cblx0XHRpZiAoZXZlbnRBcmd1bWVudHMgJiYgZXZlbnRBcmd1bWVudHMuZGVmYXVsdFByZXZlbnRlZCkge1xuXHRcdFx0ZGVmYXVsdEZ1bmN0aW9uID0gbnVsbDtcblx0XHR9XG5cblx0XHRpZiAoZGVmYXVsdEZ1bmN0aW9uKSB7XG5cdFx0XHRkZWZhdWx0RnVuY3Rpb24oZXZlbnRBcmd1bWVudHMpO1xuXHRcdH1cblx0fSxcblxuXHR3YXNoTW91c2VFdmVudDogZnVuY3Rpb24gKGUpIHtcblx0XHRyZXR1cm4gZTtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBTdG9wIHJ1bm5pbmcgYW5pbWF0aW9uXG5cdCAqL1xuXHRzdG9wOiBmdW5jdGlvbiAoZWwpIHtcblx0XHRlbC5zdG9wQW5pbWF0aW9uID0gdHJ1ZTtcblx0fSxcblxuXHQvKipcblx0ICogVXRpbGl0eSBmb3IgaXRlcmF0aW5nIG92ZXIgYW4gYXJyYXkuIFBhcmFtZXRlcnMgYXJlIHJldmVyc2VkIGNvbXBhcmVkIHRvIGpRdWVyeS5cblx0ICogQHBhcmFtIHtBcnJheX0gYXJyXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG5cdCAqL1xuXHRlYWNoOiBmdW5jdGlvbiAoYXJyLCBmbikgeyAvLyBtb2Rlcm4gYnJvd3NlcnNcblx0XHRyZXR1cm4gQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbChhcnIsIGZuKTtcblx0fVxufTtcbn0oKSk7XG4iXSwiZmlsZSI6InBsdWdpbnMvdWVkaXRvci90aGlyZC1wYXJ0eS9oaWdoY2hhcnRzL2FkYXB0ZXJzL3N0YW5kYWxvbmUtZnJhbWV3b3JrLnNyYy5qcyJ9
