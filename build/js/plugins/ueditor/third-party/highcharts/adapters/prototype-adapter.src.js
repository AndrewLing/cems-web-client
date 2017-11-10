/**
 * @license Highcharts JS v3.0.6 (2013-10-04)
 * Prototype adapter
 *
 * @author Michael Nelson, Torstein Hønsi.
 *
 * Feel free to use and modify this script.
 * Highcharts license: www.highcharts.com/license.
 */

// JSLint options:
/*global Effect, Class, Event, Element, $, $$, $A */

// Adapter interface between prototype and the Highcharts charting library
var HighchartsAdapter = (function () {

var hasEffect = typeof Effect !== 'undefined';

return {

	/**
	 * Initialize the adapter. This is run once as Highcharts is first run.
	 * @param {Object} pathAnim The helper object to do animations across adapters.
	 */
	init: function (pathAnim) {
		if (hasEffect) {
			/**
			 * Animation for Highcharts SVG element wrappers only
			 * @param {Object} element
			 * @param {Object} attribute
			 * @param {Object} to
			 * @param {Object} options
			 */
			Effect.HighchartsTransition = Class.create(Effect.Base, {
				initialize: function (element, attr, to, options) {
					var from,
						opts;

					this.element = element;
					this.key = attr;
					from = element.attr ? element.attr(attr) : $(element).getStyle(attr);

					// special treatment for paths
					if (attr === 'd') {
						this.paths = pathAnim.init(
							element,
							element.d,
							to
						);
						this.toD = to;


						// fake values in order to read relative position as a float in update
						from = 0;
						to = 1;
					}

					opts = Object.extend((options || {}), {
						from: from,
						to: to,
						attribute: attr
					});
					this.start(opts);
				},
				setup: function () {
					HighchartsAdapter._extend(this.element);
					// If this is the first animation on this object, create the _highcharts_animation helper that
					// contain pointers to the animation objects.
					if (!this.element._highchart_animation) {
						this.element._highchart_animation = {};
					}

					// Store a reference to this animation instance.
					this.element._highchart_animation[this.key] = this;
				},
				update: function (position) {
					var paths = this.paths,
						element = this.element,
						obj;

					if (paths) {
						position = pathAnim.step(paths[0], paths[1], position, this.toD);
					}

					if (element.attr) { // SVGElement
						
						if (element.element) { // If not, it has been destroyed (#1405)
							element.attr(this.options.attribute, position);
						}
					
					} else { // HTML, #409
						obj = {};
						obj[this.options.attribute] = position;
						$(element).setStyle(obj);
					}
					
				},
				finish: function () {
					// Delete the property that holds this animation now that it is finished.
					// Both canceled animations and complete ones gets a 'finish' call.
					if (this.element && this.element._highchart_animation) { // #1405
						delete this.element._highchart_animation[this.key];
					}
				}
			});
		}
	},
	
	/**
	 * Run a general method on the framework, following jQuery syntax
	 * @param {Object} el The HTML element
	 * @param {String} method Which method to run on the wrapped element
	 */
	adapterRun: function (el, method) {
		
		// This currently works for getting inner width and height. If adding
		// more methods later, we need a conditional implementation for each.
		return parseInt($(el).getStyle(method), 10);
		
	},

	/**
	 * Downloads a script and executes a callback when done.
	 * @param {String} scriptLocation
	 * @param {Function} callback
	 */
	getScript: function (scriptLocation, callback) {
		var head = $$('head')[0]; // Returns an array, so pick the first element.
		if (head) {
			// Append a new 'script' element, set its type and src attributes, add a 'load' handler that calls the callback
			head.appendChild(new Element('script', { type: 'text/javascript', src: scriptLocation}).observe('load', callback));
		}
	},

	/**
	 * Custom events in prototype needs to be namespaced. This method adds a namespace 'h:' in front of
	 * events that are not recognized as native.
	 */
	addNS: function (eventName) {
		var HTMLEvents = /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/,
			MouseEvents = /^(?:click|mouse(?:down|up|over|move|out))$/;
		return (HTMLEvents.test(eventName) || MouseEvents.test(eventName)) ?
			eventName :
			'h:' + eventName;
	},

	// el needs an event to be attached. el is not necessarily a dom element
	addEvent: function (el, event, fn) {
		if (el.addEventListener || el.attachEvent) {
			Event.observe($(el), HighchartsAdapter.addNS(event), fn);

		} else {
			HighchartsAdapter._extend(el);
			el._highcharts_observe(event, fn);
		}
	},

	// motion makes things pretty. use it if effects is loaded, if not... still get to the end result.
	animate: function (el, params, options) {
		var key,
			fx;

		// default options
		options = options || {};
		options.delay = 0;
		options.duration = (options.duration || 500) / 1000;
		options.afterFinish = options.complete;

		// animate wrappers and DOM elements
		if (hasEffect) {
			for (key in params) {
				// The fx variable is seemingly thrown away here, but the Effect.setup will add itself to the _highcharts_animation object
				// on the element itself so its not really lost.
				fx = new Effect.HighchartsTransition($(el), key, params[key], options);
			}
		} else {
			if (el.attr) { // #409 without effects
				for (key in params) {
					el.attr(key, params[key]);
				}
			}
			if (options.complete) {
				options.complete();
			}
		}

		if (!el.attr) { // HTML element, #409
			$(el).setStyle(params);
		}
	},

	// this only occurs in higcharts 2.0+
	stop: function (el) {
		var key;
		if (el._highcharts_extended && el._highchart_animation) {
			for (key in el._highchart_animation) {
				// Cancel the animation
				// The 'finish' function in the Effect object will remove the reference
				el._highchart_animation[key].cancel();
			}
		}
	},

	// um.. each
	each: function (arr, fn) {
		$A(arr).each(fn);
	},
	
	inArray: function (item, arr, from) {
		return arr ? arr.indexOf(item, from) : -1;
	},

	/**
	 * Get the cumulative offset relative to the top left of the page. This method, unlike its
	 * jQuery and MooTools counterpart, still suffers from issue #208 regarding the position
	 * of a chart within a fixed container.
	 */
	offset: function (el) {
		return $(el).cumulativeOffset();
	},

	// fire an event based on an event name (event) and an object (el).
	// again, el may not be a dom element
	fireEvent: function (el, event, eventArguments, defaultFunction) {
		if (el.fire) {
			el.fire(HighchartsAdapter.addNS(event), eventArguments);
		} else if (el._highcharts_extended) {
			eventArguments = eventArguments || {};
			el._highcharts_fire(event, eventArguments);
		}

		if (eventArguments && eventArguments.defaultPrevented) {
			defaultFunction = null;
		}

		if (defaultFunction) {
			defaultFunction(eventArguments);
		}
	},

	removeEvent: function (el, event, handler) {
		if ($(el).stopObserving) {
			if (event) {
				event = HighchartsAdapter.addNS(event);
			}
			$(el).stopObserving(event, handler);
		} if (window === el) {
			Event.stopObserving(el, event, handler);
		} else {
			HighchartsAdapter._extend(el);
			el._highcharts_stop_observing(event, handler);
		}
	},
	
	washMouseEvent: function (e) {
		return e;
	},

	// um, grep
	grep: function (arr, fn) {
		return arr.findAll(fn);
	},

	// um, map
	map: function (arr, fn) {
		return arr.map(fn);
	},

	// extend an object to handle highchart events (highchart objects, not svg elements).
	// this is a very simple way of handling events but whatever, it works (i think)
	_extend: function (object) {
		if (!object._highcharts_extended) {
			Object.extend(object, {
				_highchart_events: {},
				_highchart_animation: null,
				_highcharts_extended: true,
				_highcharts_observe: function (name, fn) {
					this._highchart_events[name] = [this._highchart_events[name], fn].compact().flatten();
				},
				_highcharts_stop_observing: function (name, fn) {
					if (name) {
						if (fn) {
							this._highchart_events[name] = [this._highchart_events[name]].compact().flatten().without(fn);
						} else {
							delete this._highchart_events[name];
						}
					} else {
						this._highchart_events = {};
					}
				},
				_highcharts_fire: function (name, args) {
					var target = this;
					(this._highchart_events[name] || []).each(function (fn) {
						// args is never null here
						if (args.stopped) {
							return; // "throw $break" wasn't working. i think because of the scope of 'this'.
						}

						// Attach a simple preventDefault function to skip default handler if called
						args.preventDefault = function () {
							args.defaultPrevented = true;
						};
						args.target = target;

						// If the event handler return false, prevent the default handler from executing
						if (fn.bind(this)(args) === false) {
							args.preventDefault();
						}
					}
.bind(this));
				}
			});
		}
	}
};
}());

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvdGhpcmQtcGFydHkvaGlnaGNoYXJ0cy9hZGFwdGVycy9wcm90b3R5cGUtYWRhcHRlci5zcmMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZSBIaWdoY2hhcnRzIEpTIHYzLjAuNiAoMjAxMy0xMC0wNClcbiAqIFByb3RvdHlwZSBhZGFwdGVyXG4gKlxuICogQGF1dGhvciBNaWNoYWVsIE5lbHNvbiwgVG9yc3RlaW4gSMO4bnNpLlxuICpcbiAqIEZlZWwgZnJlZSB0byB1c2UgYW5kIG1vZGlmeSB0aGlzIHNjcmlwdC5cbiAqIEhpZ2hjaGFydHMgbGljZW5zZTogd3d3LmhpZ2hjaGFydHMuY29tL2xpY2Vuc2UuXG4gKi9cblxuLy8gSlNMaW50IG9wdGlvbnM6XG4vKmdsb2JhbCBFZmZlY3QsIENsYXNzLCBFdmVudCwgRWxlbWVudCwgJCwgJCQsICRBICovXG5cbi8vIEFkYXB0ZXIgaW50ZXJmYWNlIGJldHdlZW4gcHJvdG90eXBlIGFuZCB0aGUgSGlnaGNoYXJ0cyBjaGFydGluZyBsaWJyYXJ5XG52YXIgSGlnaGNoYXJ0c0FkYXB0ZXIgPSAoZnVuY3Rpb24gKCkge1xuXG52YXIgaGFzRWZmZWN0ID0gdHlwZW9mIEVmZmVjdCAhPT0gJ3VuZGVmaW5lZCc7XG5cbnJldHVybiB7XG5cblx0LyoqXG5cdCAqIEluaXRpYWxpemUgdGhlIGFkYXB0ZXIuIFRoaXMgaXMgcnVuIG9uY2UgYXMgSGlnaGNoYXJ0cyBpcyBmaXJzdCBydW4uXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBwYXRoQW5pbSBUaGUgaGVscGVyIG9iamVjdCB0byBkbyBhbmltYXRpb25zIGFjcm9zcyBhZGFwdGVycy5cblx0ICovXG5cdGluaXQ6IGZ1bmN0aW9uIChwYXRoQW5pbSkge1xuXHRcdGlmIChoYXNFZmZlY3QpIHtcblx0XHRcdC8qKlxuXHRcdFx0ICogQW5pbWF0aW9uIGZvciBIaWdoY2hhcnRzIFNWRyBlbGVtZW50IHdyYXBwZXJzIG9ubHlcblx0XHRcdCAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtZW50XG5cdFx0XHQgKiBAcGFyYW0ge09iamVjdH0gYXR0cmlidXRlXG5cdFx0XHQgKiBAcGFyYW0ge09iamVjdH0gdG9cblx0XHRcdCAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG5cdFx0XHQgKi9cblx0XHRcdEVmZmVjdC5IaWdoY2hhcnRzVHJhbnNpdGlvbiA9IENsYXNzLmNyZWF0ZShFZmZlY3QuQmFzZSwge1xuXHRcdFx0XHRpbml0aWFsaXplOiBmdW5jdGlvbiAoZWxlbWVudCwgYXR0ciwgdG8sIG9wdGlvbnMpIHtcblx0XHRcdFx0XHR2YXIgZnJvbSxcblx0XHRcdFx0XHRcdG9wdHM7XG5cblx0XHRcdFx0XHR0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuXHRcdFx0XHRcdHRoaXMua2V5ID0gYXR0cjtcblx0XHRcdFx0XHRmcm9tID0gZWxlbWVudC5hdHRyID8gZWxlbWVudC5hdHRyKGF0dHIpIDogJChlbGVtZW50KS5nZXRTdHlsZShhdHRyKTtcblxuXHRcdFx0XHRcdC8vIHNwZWNpYWwgdHJlYXRtZW50IGZvciBwYXRoc1xuXHRcdFx0XHRcdGlmIChhdHRyID09PSAnZCcpIHtcblx0XHRcdFx0XHRcdHRoaXMucGF0aHMgPSBwYXRoQW5pbS5pbml0KFxuXHRcdFx0XHRcdFx0XHRlbGVtZW50LFxuXHRcdFx0XHRcdFx0XHRlbGVtZW50LmQsXG5cdFx0XHRcdFx0XHRcdHRvXG5cdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdFx0dGhpcy50b0QgPSB0bztcblxuXG5cdFx0XHRcdFx0XHQvLyBmYWtlIHZhbHVlcyBpbiBvcmRlciB0byByZWFkIHJlbGF0aXZlIHBvc2l0aW9uIGFzIGEgZmxvYXQgaW4gdXBkYXRlXG5cdFx0XHRcdFx0XHRmcm9tID0gMDtcblx0XHRcdFx0XHRcdHRvID0gMTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRvcHRzID0gT2JqZWN0LmV4dGVuZCgob3B0aW9ucyB8fCB7fSksIHtcblx0XHRcdFx0XHRcdGZyb206IGZyb20sXG5cdFx0XHRcdFx0XHR0bzogdG8sXG5cdFx0XHRcdFx0XHRhdHRyaWJ1dGU6IGF0dHJcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR0aGlzLnN0YXJ0KG9wdHMpO1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRzZXR1cDogZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdEhpZ2hjaGFydHNBZGFwdGVyLl9leHRlbmQodGhpcy5lbGVtZW50KTtcblx0XHRcdFx0XHQvLyBJZiB0aGlzIGlzIHRoZSBmaXJzdCBhbmltYXRpb24gb24gdGhpcyBvYmplY3QsIGNyZWF0ZSB0aGUgX2hpZ2hjaGFydHNfYW5pbWF0aW9uIGhlbHBlciB0aGF0XG5cdFx0XHRcdFx0Ly8gY29udGFpbiBwb2ludGVycyB0byB0aGUgYW5pbWF0aW9uIG9iamVjdHMuXG5cdFx0XHRcdFx0aWYgKCF0aGlzLmVsZW1lbnQuX2hpZ2hjaGFydF9hbmltYXRpb24pIHtcblx0XHRcdFx0XHRcdHRoaXMuZWxlbWVudC5faGlnaGNoYXJ0X2FuaW1hdGlvbiA9IHt9O1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdC8vIFN0b3JlIGEgcmVmZXJlbmNlIHRvIHRoaXMgYW5pbWF0aW9uIGluc3RhbmNlLlxuXHRcdFx0XHRcdHRoaXMuZWxlbWVudC5faGlnaGNoYXJ0X2FuaW1hdGlvblt0aGlzLmtleV0gPSB0aGlzO1xuXHRcdFx0XHR9LFxuXHRcdFx0XHR1cGRhdGU6IGZ1bmN0aW9uIChwb3NpdGlvbikge1xuXHRcdFx0XHRcdHZhciBwYXRocyA9IHRoaXMucGF0aHMsXG5cdFx0XHRcdFx0XHRlbGVtZW50ID0gdGhpcy5lbGVtZW50LFxuXHRcdFx0XHRcdFx0b2JqO1xuXG5cdFx0XHRcdFx0aWYgKHBhdGhzKSB7XG5cdFx0XHRcdFx0XHRwb3NpdGlvbiA9IHBhdGhBbmltLnN0ZXAocGF0aHNbMF0sIHBhdGhzWzFdLCBwb3NpdGlvbiwgdGhpcy50b0QpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmIChlbGVtZW50LmF0dHIpIHsgLy8gU1ZHRWxlbWVudFxuXHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHRpZiAoZWxlbWVudC5lbGVtZW50KSB7IC8vIElmIG5vdCwgaXQgaGFzIGJlZW4gZGVzdHJveWVkICgjMTQwNSlcblx0XHRcdFx0XHRcdFx0ZWxlbWVudC5hdHRyKHRoaXMub3B0aW9ucy5hdHRyaWJ1dGUsIHBvc2l0aW9uKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcblx0XHRcdFx0XHR9IGVsc2UgeyAvLyBIVE1MLCAjNDA5XG5cdFx0XHRcdFx0XHRvYmogPSB7fTtcblx0XHRcdFx0XHRcdG9ialt0aGlzLm9wdGlvbnMuYXR0cmlidXRlXSA9IHBvc2l0aW9uO1xuXHRcdFx0XHRcdFx0JChlbGVtZW50KS5zZXRTdHlsZShvYmopO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcblx0XHRcdFx0fSxcblx0XHRcdFx0ZmluaXNoOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0Ly8gRGVsZXRlIHRoZSBwcm9wZXJ0eSB0aGF0IGhvbGRzIHRoaXMgYW5pbWF0aW9uIG5vdyB0aGF0IGl0IGlzIGZpbmlzaGVkLlxuXHRcdFx0XHRcdC8vIEJvdGggY2FuY2VsZWQgYW5pbWF0aW9ucyBhbmQgY29tcGxldGUgb25lcyBnZXRzIGEgJ2ZpbmlzaCcgY2FsbC5cblx0XHRcdFx0XHRpZiAodGhpcy5lbGVtZW50ICYmIHRoaXMuZWxlbWVudC5faGlnaGNoYXJ0X2FuaW1hdGlvbikgeyAvLyAjMTQwNVxuXHRcdFx0XHRcdFx0ZGVsZXRlIHRoaXMuZWxlbWVudC5faGlnaGNoYXJ0X2FuaW1hdGlvblt0aGlzLmtleV07XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9XG5cdH0sXG5cdFxuXHQvKipcblx0ICogUnVuIGEgZ2VuZXJhbCBtZXRob2Qgb24gdGhlIGZyYW1ld29yaywgZm9sbG93aW5nIGpRdWVyeSBzeW50YXhcblx0ICogQHBhcmFtIHtPYmplY3R9IGVsIFRoZSBIVE1MIGVsZW1lbnRcblx0ICogQHBhcmFtIHtTdHJpbmd9IG1ldGhvZCBXaGljaCBtZXRob2QgdG8gcnVuIG9uIHRoZSB3cmFwcGVkIGVsZW1lbnRcblx0ICovXG5cdGFkYXB0ZXJSdW46IGZ1bmN0aW9uIChlbCwgbWV0aG9kKSB7XG5cdFx0XG5cdFx0Ly8gVGhpcyBjdXJyZW50bHkgd29ya3MgZm9yIGdldHRpbmcgaW5uZXIgd2lkdGggYW5kIGhlaWdodC4gSWYgYWRkaW5nXG5cdFx0Ly8gbW9yZSBtZXRob2RzIGxhdGVyLCB3ZSBuZWVkIGEgY29uZGl0aW9uYWwgaW1wbGVtZW50YXRpb24gZm9yIGVhY2guXG5cdFx0cmV0dXJuIHBhcnNlSW50KCQoZWwpLmdldFN0eWxlKG1ldGhvZCksIDEwKTtcblx0XHRcblx0fSxcblxuXHQvKipcblx0ICogRG93bmxvYWRzIGEgc2NyaXB0IGFuZCBleGVjdXRlcyBhIGNhbGxiYWNrIHdoZW4gZG9uZS5cblx0ICogQHBhcmFtIHtTdHJpbmd9IHNjcmlwdExvY2F0aW9uXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG5cdCAqL1xuXHRnZXRTY3JpcHQ6IGZ1bmN0aW9uIChzY3JpcHRMb2NhdGlvbiwgY2FsbGJhY2spIHtcblx0XHR2YXIgaGVhZCA9ICQkKCdoZWFkJylbMF07IC8vIFJldHVybnMgYW4gYXJyYXksIHNvIHBpY2sgdGhlIGZpcnN0IGVsZW1lbnQuXG5cdFx0aWYgKGhlYWQpIHtcblx0XHRcdC8vIEFwcGVuZCBhIG5ldyAnc2NyaXB0JyBlbGVtZW50LCBzZXQgaXRzIHR5cGUgYW5kIHNyYyBhdHRyaWJ1dGVzLCBhZGQgYSAnbG9hZCcgaGFuZGxlciB0aGF0IGNhbGxzIHRoZSBjYWxsYmFja1xuXHRcdFx0aGVhZC5hcHBlbmRDaGlsZChuZXcgRWxlbWVudCgnc2NyaXB0JywgeyB0eXBlOiAndGV4dC9qYXZhc2NyaXB0Jywgc3JjOiBzY3JpcHRMb2NhdGlvbn0pLm9ic2VydmUoJ2xvYWQnLCBjYWxsYmFjaykpO1xuXHRcdH1cblx0fSxcblxuXHQvKipcblx0ICogQ3VzdG9tIGV2ZW50cyBpbiBwcm90b3R5cGUgbmVlZHMgdG8gYmUgbmFtZXNwYWNlZC4gVGhpcyBtZXRob2QgYWRkcyBhIG5hbWVzcGFjZSAnaDonIGluIGZyb250IG9mXG5cdCAqIGV2ZW50cyB0aGF0IGFyZSBub3QgcmVjb2duaXplZCBhcyBuYXRpdmUuXG5cdCAqL1xuXHRhZGROUzogZnVuY3Rpb24gKGV2ZW50TmFtZSkge1xuXHRcdHZhciBIVE1MRXZlbnRzID0gL14oPzpsb2FkfHVubG9hZHxhYm9ydHxlcnJvcnxzZWxlY3R8Y2hhbmdlfHN1Ym1pdHxyZXNldHxmb2N1c3xibHVyfHJlc2l6ZXxzY3JvbGwpJC8sXG5cdFx0XHRNb3VzZUV2ZW50cyA9IC9eKD86Y2xpY2t8bW91c2UoPzpkb3dufHVwfG92ZXJ8bW92ZXxvdXQpKSQvO1xuXHRcdHJldHVybiAoSFRNTEV2ZW50cy50ZXN0KGV2ZW50TmFtZSkgfHwgTW91c2VFdmVudHMudGVzdChldmVudE5hbWUpKSA/XG5cdFx0XHRldmVudE5hbWUgOlxuXHRcdFx0J2g6JyArIGV2ZW50TmFtZTtcblx0fSxcblxuXHQvLyBlbCBuZWVkcyBhbiBldmVudCB0byBiZSBhdHRhY2hlZC4gZWwgaXMgbm90IG5lY2Vzc2FyaWx5IGEgZG9tIGVsZW1lbnRcblx0YWRkRXZlbnQ6IGZ1bmN0aW9uIChlbCwgZXZlbnQsIGZuKSB7XG5cdFx0aWYgKGVsLmFkZEV2ZW50TGlzdGVuZXIgfHwgZWwuYXR0YWNoRXZlbnQpIHtcblx0XHRcdEV2ZW50Lm9ic2VydmUoJChlbCksIEhpZ2hjaGFydHNBZGFwdGVyLmFkZE5TKGV2ZW50KSwgZm4pO1xuXG5cdFx0fSBlbHNlIHtcblx0XHRcdEhpZ2hjaGFydHNBZGFwdGVyLl9leHRlbmQoZWwpO1xuXHRcdFx0ZWwuX2hpZ2hjaGFydHNfb2JzZXJ2ZShldmVudCwgZm4pO1xuXHRcdH1cblx0fSxcblxuXHQvLyBtb3Rpb24gbWFrZXMgdGhpbmdzIHByZXR0eS4gdXNlIGl0IGlmIGVmZmVjdHMgaXMgbG9hZGVkLCBpZiBub3QuLi4gc3RpbGwgZ2V0IHRvIHRoZSBlbmQgcmVzdWx0LlxuXHRhbmltYXRlOiBmdW5jdGlvbiAoZWwsIHBhcmFtcywgb3B0aW9ucykge1xuXHRcdHZhciBrZXksXG5cdFx0XHRmeDtcblxuXHRcdC8vIGRlZmF1bHQgb3B0aW9uc1xuXHRcdG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXHRcdG9wdGlvbnMuZGVsYXkgPSAwO1xuXHRcdG9wdGlvbnMuZHVyYXRpb24gPSAob3B0aW9ucy5kdXJhdGlvbiB8fCA1MDApIC8gMTAwMDtcblx0XHRvcHRpb25zLmFmdGVyRmluaXNoID0gb3B0aW9ucy5jb21wbGV0ZTtcblxuXHRcdC8vIGFuaW1hdGUgd3JhcHBlcnMgYW5kIERPTSBlbGVtZW50c1xuXHRcdGlmIChoYXNFZmZlY3QpIHtcblx0XHRcdGZvciAoa2V5IGluIHBhcmFtcykge1xuXHRcdFx0XHQvLyBUaGUgZnggdmFyaWFibGUgaXMgc2VlbWluZ2x5IHRocm93biBhd2F5IGhlcmUsIGJ1dCB0aGUgRWZmZWN0LnNldHVwIHdpbGwgYWRkIGl0c2VsZiB0byB0aGUgX2hpZ2hjaGFydHNfYW5pbWF0aW9uIG9iamVjdFxuXHRcdFx0XHQvLyBvbiB0aGUgZWxlbWVudCBpdHNlbGYgc28gaXRzIG5vdCByZWFsbHkgbG9zdC5cblx0XHRcdFx0ZnggPSBuZXcgRWZmZWN0LkhpZ2hjaGFydHNUcmFuc2l0aW9uKCQoZWwpLCBrZXksIHBhcmFtc1trZXldLCBvcHRpb25zKTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYgKGVsLmF0dHIpIHsgLy8gIzQwOSB3aXRob3V0IGVmZmVjdHNcblx0XHRcdFx0Zm9yIChrZXkgaW4gcGFyYW1zKSB7XG5cdFx0XHRcdFx0ZWwuYXR0cihrZXksIHBhcmFtc1trZXldKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYgKG9wdGlvbnMuY29tcGxldGUpIHtcblx0XHRcdFx0b3B0aW9ucy5jb21wbGV0ZSgpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmICghZWwuYXR0cikgeyAvLyBIVE1MIGVsZW1lbnQsICM0MDlcblx0XHRcdCQoZWwpLnNldFN0eWxlKHBhcmFtcyk7XG5cdFx0fVxuXHR9LFxuXG5cdC8vIHRoaXMgb25seSBvY2N1cnMgaW4gaGlnY2hhcnRzIDIuMCtcblx0c3RvcDogZnVuY3Rpb24gKGVsKSB7XG5cdFx0dmFyIGtleTtcblx0XHRpZiAoZWwuX2hpZ2hjaGFydHNfZXh0ZW5kZWQgJiYgZWwuX2hpZ2hjaGFydF9hbmltYXRpb24pIHtcblx0XHRcdGZvciAoa2V5IGluIGVsLl9oaWdoY2hhcnRfYW5pbWF0aW9uKSB7XG5cdFx0XHRcdC8vIENhbmNlbCB0aGUgYW5pbWF0aW9uXG5cdFx0XHRcdC8vIFRoZSAnZmluaXNoJyBmdW5jdGlvbiBpbiB0aGUgRWZmZWN0IG9iamVjdCB3aWxsIHJlbW92ZSB0aGUgcmVmZXJlbmNlXG5cdFx0XHRcdGVsLl9oaWdoY2hhcnRfYW5pbWF0aW9uW2tleV0uY2FuY2VsKCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cdC8vIHVtLi4gZWFjaFxuXHRlYWNoOiBmdW5jdGlvbiAoYXJyLCBmbikge1xuXHRcdCRBKGFycikuZWFjaChmbik7XG5cdH0sXG5cdFxuXHRpbkFycmF5OiBmdW5jdGlvbiAoaXRlbSwgYXJyLCBmcm9tKSB7XG5cdFx0cmV0dXJuIGFyciA/IGFyci5pbmRleE9mKGl0ZW0sIGZyb20pIDogLTE7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEdldCB0aGUgY3VtdWxhdGl2ZSBvZmZzZXQgcmVsYXRpdmUgdG8gdGhlIHRvcCBsZWZ0IG9mIHRoZSBwYWdlLiBUaGlzIG1ldGhvZCwgdW5saWtlIGl0c1xuXHQgKiBqUXVlcnkgYW5kIE1vb1Rvb2xzIGNvdW50ZXJwYXJ0LCBzdGlsbCBzdWZmZXJzIGZyb20gaXNzdWUgIzIwOCByZWdhcmRpbmcgdGhlIHBvc2l0aW9uXG5cdCAqIG9mIGEgY2hhcnQgd2l0aGluIGEgZml4ZWQgY29udGFpbmVyLlxuXHQgKi9cblx0b2Zmc2V0OiBmdW5jdGlvbiAoZWwpIHtcblx0XHRyZXR1cm4gJChlbCkuY3VtdWxhdGl2ZU9mZnNldCgpO1xuXHR9LFxuXG5cdC8vIGZpcmUgYW4gZXZlbnQgYmFzZWQgb24gYW4gZXZlbnQgbmFtZSAoZXZlbnQpIGFuZCBhbiBvYmplY3QgKGVsKS5cblx0Ly8gYWdhaW4sIGVsIG1heSBub3QgYmUgYSBkb20gZWxlbWVudFxuXHRmaXJlRXZlbnQ6IGZ1bmN0aW9uIChlbCwgZXZlbnQsIGV2ZW50QXJndW1lbnRzLCBkZWZhdWx0RnVuY3Rpb24pIHtcblx0XHRpZiAoZWwuZmlyZSkge1xuXHRcdFx0ZWwuZmlyZShIaWdoY2hhcnRzQWRhcHRlci5hZGROUyhldmVudCksIGV2ZW50QXJndW1lbnRzKTtcblx0XHR9IGVsc2UgaWYgKGVsLl9oaWdoY2hhcnRzX2V4dGVuZGVkKSB7XG5cdFx0XHRldmVudEFyZ3VtZW50cyA9IGV2ZW50QXJndW1lbnRzIHx8IHt9O1xuXHRcdFx0ZWwuX2hpZ2hjaGFydHNfZmlyZShldmVudCwgZXZlbnRBcmd1bWVudHMpO1xuXHRcdH1cblxuXHRcdGlmIChldmVudEFyZ3VtZW50cyAmJiBldmVudEFyZ3VtZW50cy5kZWZhdWx0UHJldmVudGVkKSB7XG5cdFx0XHRkZWZhdWx0RnVuY3Rpb24gPSBudWxsO1xuXHRcdH1cblxuXHRcdGlmIChkZWZhdWx0RnVuY3Rpb24pIHtcblx0XHRcdGRlZmF1bHRGdW5jdGlvbihldmVudEFyZ3VtZW50cyk7XG5cdFx0fVxuXHR9LFxuXG5cdHJlbW92ZUV2ZW50OiBmdW5jdGlvbiAoZWwsIGV2ZW50LCBoYW5kbGVyKSB7XG5cdFx0aWYgKCQoZWwpLnN0b3BPYnNlcnZpbmcpIHtcblx0XHRcdGlmIChldmVudCkge1xuXHRcdFx0XHRldmVudCA9IEhpZ2hjaGFydHNBZGFwdGVyLmFkZE5TKGV2ZW50KTtcblx0XHRcdH1cblx0XHRcdCQoZWwpLnN0b3BPYnNlcnZpbmcoZXZlbnQsIGhhbmRsZXIpO1xuXHRcdH0gaWYgKHdpbmRvdyA9PT0gZWwpIHtcblx0XHRcdEV2ZW50LnN0b3BPYnNlcnZpbmcoZWwsIGV2ZW50LCBoYW5kbGVyKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0SGlnaGNoYXJ0c0FkYXB0ZXIuX2V4dGVuZChlbCk7XG5cdFx0XHRlbC5faGlnaGNoYXJ0c19zdG9wX29ic2VydmluZyhldmVudCwgaGFuZGxlcik7XG5cdFx0fVxuXHR9LFxuXHRcblx0d2FzaE1vdXNlRXZlbnQ6IGZ1bmN0aW9uIChlKSB7XG5cdFx0cmV0dXJuIGU7XG5cdH0sXG5cblx0Ly8gdW0sIGdyZXBcblx0Z3JlcDogZnVuY3Rpb24gKGFyciwgZm4pIHtcblx0XHRyZXR1cm4gYXJyLmZpbmRBbGwoZm4pO1xuXHR9LFxuXG5cdC8vIHVtLCBtYXBcblx0bWFwOiBmdW5jdGlvbiAoYXJyLCBmbikge1xuXHRcdHJldHVybiBhcnIubWFwKGZuKTtcblx0fSxcblxuXHQvLyBleHRlbmQgYW4gb2JqZWN0IHRvIGhhbmRsZSBoaWdoY2hhcnQgZXZlbnRzIChoaWdoY2hhcnQgb2JqZWN0cywgbm90IHN2ZyBlbGVtZW50cykuXG5cdC8vIHRoaXMgaXMgYSB2ZXJ5IHNpbXBsZSB3YXkgb2YgaGFuZGxpbmcgZXZlbnRzIGJ1dCB3aGF0ZXZlciwgaXQgd29ya3MgKGkgdGhpbmspXG5cdF9leHRlbmQ6IGZ1bmN0aW9uIChvYmplY3QpIHtcblx0XHRpZiAoIW9iamVjdC5faGlnaGNoYXJ0c19leHRlbmRlZCkge1xuXHRcdFx0T2JqZWN0LmV4dGVuZChvYmplY3QsIHtcblx0XHRcdFx0X2hpZ2hjaGFydF9ldmVudHM6IHt9LFxuXHRcdFx0XHRfaGlnaGNoYXJ0X2FuaW1hdGlvbjogbnVsbCxcblx0XHRcdFx0X2hpZ2hjaGFydHNfZXh0ZW5kZWQ6IHRydWUsXG5cdFx0XHRcdF9oaWdoY2hhcnRzX29ic2VydmU6IGZ1bmN0aW9uIChuYW1lLCBmbikge1xuXHRcdFx0XHRcdHRoaXMuX2hpZ2hjaGFydF9ldmVudHNbbmFtZV0gPSBbdGhpcy5faGlnaGNoYXJ0X2V2ZW50c1tuYW1lXSwgZm5dLmNvbXBhY3QoKS5mbGF0dGVuKCk7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdF9oaWdoY2hhcnRzX3N0b3Bfb2JzZXJ2aW5nOiBmdW5jdGlvbiAobmFtZSwgZm4pIHtcblx0XHRcdFx0XHRpZiAobmFtZSkge1xuXHRcdFx0XHRcdFx0aWYgKGZuKSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMuX2hpZ2hjaGFydF9ldmVudHNbbmFtZV0gPSBbdGhpcy5faGlnaGNoYXJ0X2V2ZW50c1tuYW1lXV0uY29tcGFjdCgpLmZsYXR0ZW4oKS53aXRob3V0KGZuKTtcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdGRlbGV0ZSB0aGlzLl9oaWdoY2hhcnRfZXZlbnRzW25hbWVdO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHR0aGlzLl9oaWdoY2hhcnRfZXZlbnRzID0ge307XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRfaGlnaGNoYXJ0c19maXJlOiBmdW5jdGlvbiAobmFtZSwgYXJncykge1xuXHRcdFx0XHRcdHZhciB0YXJnZXQgPSB0aGlzO1xuXHRcdFx0XHRcdCh0aGlzLl9oaWdoY2hhcnRfZXZlbnRzW25hbWVdIHx8IFtdKS5lYWNoKGZ1bmN0aW9uIChmbikge1xuXHRcdFx0XHRcdFx0Ly8gYXJncyBpcyBuZXZlciBudWxsIGhlcmVcblx0XHRcdFx0XHRcdGlmIChhcmdzLnN0b3BwZWQpIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuOyAvLyBcInRocm93ICRicmVha1wiIHdhc24ndCB3b3JraW5nLiBpIHRoaW5rIGJlY2F1c2Ugb2YgdGhlIHNjb3BlIG9mICd0aGlzJy5cblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0Ly8gQXR0YWNoIGEgc2ltcGxlIHByZXZlbnREZWZhdWx0IGZ1bmN0aW9uIHRvIHNraXAgZGVmYXVsdCBoYW5kbGVyIGlmIGNhbGxlZFxuXHRcdFx0XHRcdFx0YXJncy5wcmV2ZW50RGVmYXVsdCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRcdFx0YXJncy5kZWZhdWx0UHJldmVudGVkID0gdHJ1ZTtcblx0XHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0XHRhcmdzLnRhcmdldCA9IHRhcmdldDtcblxuXHRcdFx0XHRcdFx0Ly8gSWYgdGhlIGV2ZW50IGhhbmRsZXIgcmV0dXJuIGZhbHNlLCBwcmV2ZW50IHRoZSBkZWZhdWx0IGhhbmRsZXIgZnJvbSBleGVjdXRpbmdcblx0XHRcdFx0XHRcdGlmIChmbi5iaW5kKHRoaXMpKGFyZ3MpID09PSBmYWxzZSkge1xuXHRcdFx0XHRcdFx0XHRhcmdzLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuLmJpbmQodGhpcykpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9XG5cdH1cbn07XG59KCkpO1xuIl0sImZpbGUiOiJwbHVnaW5zL3VlZGl0b3IvdGhpcmQtcGFydHkvaGlnaGNoYXJ0cy9hZGFwdGVycy9wcm90b3R5cGUtYWRhcHRlci5zcmMuanMifQ==
