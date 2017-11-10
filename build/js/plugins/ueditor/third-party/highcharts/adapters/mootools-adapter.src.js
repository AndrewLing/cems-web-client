/**
 * @license Highcharts JS v3.0.6 (2013-10-04)
 * MooTools adapter
 *
 * (c) 2010-2013 Torstein Hønsi
 *
 * License: www.highcharts.com/license
 */

// JSLint options:
/*global Fx, $, $extend, $each, $merge, Events, Event, DOMEvent */

(function () {

var win = window,
	doc = document,
	mooVersion = win.MooTools.version.substring(0, 3), // Get the first three characters of the version number
	legacy = mooVersion === '1.2' || mooVersion === '1.1', // 1.1 && 1.2 considered legacy, 1.3 is not.
	legacyEvent = legacy || mooVersion === '1.3', // In versions 1.1 - 1.3 the event class is named Event, in newer versions it is named DOMEvent.
	$extend = win.$extend || function () {
		return Object.append.apply(Object, arguments);
	};

win.HighchartsAdapter = {
	/**
	 * Initialize the adapter. This is run once as Highcharts is first run.
	 * @param {Object} pathAnim The helper object to do animations across adapters.
	 */
	init: function (pathAnim) {
		var fxProto = Fx.prototype,
			fxStart = fxProto.start,
			morphProto = Fx.Morph.prototype,
			morphCompute = morphProto.compute;

		// override Fx.start to allow animation of SVG element wrappers
		/*jslint unparam: true*//* allow unused parameters in fx functions */
		fxProto.start = function (from, to) {
			var fx = this,
				elem = fx.element;

			// special for animating paths
			if (from.d) {
				//this.fromD = this.element.d.split(' ');
				fx.paths = pathAnim.init(
					elem,
					elem.d,
					fx.toD
				);
			}
			fxStart.apply(fx, arguments);

			return this; // chainable
		};

		// override Fx.step to allow animation of SVG element wrappers
		morphProto.compute = function (from, to, delta) {
			var fx = this,
				paths = fx.paths;

			if (paths) {
				fx.element.attr(
					'd',
					pathAnim.step(paths[0], paths[1], delta, fx.toD)
				);
			} else {
				return morphCompute.apply(fx, arguments);
			}
		};
		/*jslint unparam: false*/
	},
	
	/**
	 * Run a general method on the framework, following jQuery syntax
	 * @param {Object} el The HTML element
	 * @param {String} method Which method to run on the wrapped element
	 */
	adapterRun: function (el, method) {
		
		// This currently works for getting inner width and height. If adding
		// more methods later, we need a conditional implementation for each.
		if (method === 'width' || method === 'height') {
			return parseInt($(el).getStyle(method), 10);
		}
	},

	/**
	 * Downloads a script and executes a callback when done.
	 * @param {String} scriptLocation
	 * @param {Function} callback
	 */
	getScript: function (scriptLocation, callback) {
		// We cannot assume that Assets class from mootools-more is available so instead insert a script tag to download script.
		var head = doc.getElementsByTagName('head')[0];
		var script = doc.createElement('script');

		script.type = 'text/javascript';
		script.src = scriptLocation;
		script.onload = callback;

		head.appendChild(script);
	},

	/**
	 * Animate a HTML element or SVG element wrapper
	 * @param {Object} el
	 * @param {Object} params
	 * @param {Object} options jQuery-like animation options: duration, easing, callback
	 */
	animate: function (el, params, options) {
		var isSVGElement = el.attr,
			effect,
			complete = options && options.complete;

		if (isSVGElement && !el.setStyle) {
			// add setStyle and getStyle methods for internal use in Moo
			el.getStyle = el.attr;
			el.setStyle = function () { // property value is given as array in Moo - break it down
				var args = arguments;
				this.attr.call(this, args[0], args[1][0]);
			};
			// dirty hack to trick Moo into handling el as an element wrapper
			el.$family = function () { return true; };
		}

		// stop running animations
		win.HighchartsAdapter.stop(el);

		// define and run the effect
		effect = new Fx.Morph(
			isSVGElement ? el : $(el),
			$extend({
				transition: Fx.Transitions.Quad.easeInOut
			}, options)
		);

		// Make sure that the element reference is set when animating svg elements
		if (isSVGElement) {
			effect.element = el;
		}

		// special treatment for paths
		if (params.d) {
			effect.toD = params.d;
		}

		// jQuery-like events
		if (complete) {
			effect.addEvent('complete', complete);
		}

		// run
		effect.start(params);

		// record for use in stop method
		el.fx = effect;
	},

	/**
	 * MooTool's each function
	 *
	 */
	each: function (arr, fn) {
		return legacy ?
			$each(arr, fn) :
			Array.each(arr, fn);
	},

	/**
	 * Map an array
	 * @param {Array} arr
	 * @param {Function} fn
	 */
	map: function (arr, fn) {
		return arr.map(fn);
	},

	/**
	 * Grep or filter an array
	 * @param {Array} arr
	 * @param {Function} fn
	 */
	grep: function (arr, fn) {
		return arr.filter(fn);
	},
	
	/**
	 * Return the index of an item in an array, or -1 if not matched
	 */
	inArray: function (item, arr, from) {
		return arr ? arr.indexOf(item, from) : -1;
	},

	/**
	 * Get the offset of an element relative to the top left corner of the web page
	 */
	offset: function (el) {
		var offsets = el.getPosition(); // #1496
		return {
			left: offsets.x,
			top: offsets.y
		};
	},

	/**
	 * Extends an object with Events, if its not done
	 */
	extendWithEvents: function (el) {
		// if the addEvent method is not defined, el is a custom Highcharts object
		// like series or point
		if (!el.addEvent) {
			if (el.nodeName) {
				el = $(el); // a dynamically generated node
			} else {
				$extend(el, new Events()); // a custom object
			}
		}
	},

	/**
	 * Add an event listener
	 * @param {Object} el HTML element or custom object
	 * @param {String} type Event type
	 * @param {Function} fn Event handler
	 */
	addEvent: function (el, type, fn) {
		if (typeof type === 'string') { // chart broke due to el being string, type function

			if (type === 'unload') { // Moo self destructs before custom unload events
				type = 'beforeunload';
			}

			win.HighchartsAdapter.extendWithEvents(el);

			el.addEvent(type, fn);
		}
	},

	removeEvent: function (el, type, fn) {
		if (typeof el === 'string') {
			// el.removeEvents below apperantly calls this method again. Do not quite understand why, so for now just bail out.
			return;
		}
		
		if (el.addEvent) { // If el doesn't have an addEvent method, there are no events to remove
			if (type) {
				if (type === 'unload') { // Moo self destructs before custom unload events
					type = 'beforeunload';
				}
	
				if (fn) {
					el.removeEvent(type, fn);
				} else if (el.removeEvents) { // #958
					el.removeEvents(type);
				}
			} else {
				el.removeEvents();
			}
		}
	},

	fireEvent: function (el, event, eventArguments, defaultFunction) {
		var eventArgs = {
			type: event,
			target: el
		};
		// create an event object that keeps all functions
		event = legacyEvent ? new Event(eventArgs) : new DOMEvent(eventArgs);
		event = $extend(event, eventArguments);

		// When running an event on the Chart.prototype, MooTools nests the target in event.event
		if (!event.target && event.event) {
			event.target = event.event.target;
		}

		// override the preventDefault function to be able to use
		// this for custom events
		event.preventDefault = function () {
			defaultFunction = null;
		};
		// if fireEvent is not available on the object, there hasn't been added
		// any events to it above
		if (el.fireEvent) {
			el.fireEvent(event.type, event);
		}

		// fire the default if it is passed and it is not prevented above
		if (defaultFunction) {
			defaultFunction(event);
		}
	},
	
	/**
	 * Set back e.pageX and e.pageY that MooTools has abstracted away. #1165, #1346.
	 */
	washMouseEvent: function (e) {
		if (e.page) {
			e.pageX = e.page.x;
			e.pageY = e.page.y;
		}
		return e;
	},

	/**
	 * Stop running animations on the object
	 */
	stop: function (el) {
		if (el.fx) {
			el.fx.cancel();
		}
	}
};

}());

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvdGhpcmQtcGFydHkvaGlnaGNoYXJ0cy9hZGFwdGVycy9tb290b29scy1hZGFwdGVyLnNyYy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlIEhpZ2hjaGFydHMgSlMgdjMuMC42ICgyMDEzLTEwLTA0KVxuICogTW9vVG9vbHMgYWRhcHRlclxuICpcbiAqIChjKSAyMDEwLTIwMTMgVG9yc3RlaW4gSMO4bnNpXG4gKlxuICogTGljZW5zZTogd3d3LmhpZ2hjaGFydHMuY29tL2xpY2Vuc2VcbiAqL1xuXG4vLyBKU0xpbnQgb3B0aW9uczpcbi8qZ2xvYmFsIEZ4LCAkLCAkZXh0ZW5kLCAkZWFjaCwgJG1lcmdlLCBFdmVudHMsIEV2ZW50LCBET01FdmVudCAqL1xuXG4oZnVuY3Rpb24gKCkge1xuXG52YXIgd2luID0gd2luZG93LFxuXHRkb2MgPSBkb2N1bWVudCxcblx0bW9vVmVyc2lvbiA9IHdpbi5Nb29Ub29scy52ZXJzaW9uLnN1YnN0cmluZygwLCAzKSwgLy8gR2V0IHRoZSBmaXJzdCB0aHJlZSBjaGFyYWN0ZXJzIG9mIHRoZSB2ZXJzaW9uIG51bWJlclxuXHRsZWdhY3kgPSBtb29WZXJzaW9uID09PSAnMS4yJyB8fCBtb29WZXJzaW9uID09PSAnMS4xJywgLy8gMS4xICYmIDEuMiBjb25zaWRlcmVkIGxlZ2FjeSwgMS4zIGlzIG5vdC5cblx0bGVnYWN5RXZlbnQgPSBsZWdhY3kgfHwgbW9vVmVyc2lvbiA9PT0gJzEuMycsIC8vIEluIHZlcnNpb25zIDEuMSAtIDEuMyB0aGUgZXZlbnQgY2xhc3MgaXMgbmFtZWQgRXZlbnQsIGluIG5ld2VyIHZlcnNpb25zIGl0IGlzIG5hbWVkIERPTUV2ZW50LlxuXHQkZXh0ZW5kID0gd2luLiRleHRlbmQgfHwgZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiBPYmplY3QuYXBwZW5kLmFwcGx5KE9iamVjdCwgYXJndW1lbnRzKTtcblx0fTtcblxud2luLkhpZ2hjaGFydHNBZGFwdGVyID0ge1xuXHQvKipcblx0ICogSW5pdGlhbGl6ZSB0aGUgYWRhcHRlci4gVGhpcyBpcyBydW4gb25jZSBhcyBIaWdoY2hhcnRzIGlzIGZpcnN0IHJ1bi5cblx0ICogQHBhcmFtIHtPYmplY3R9IHBhdGhBbmltIFRoZSBoZWxwZXIgb2JqZWN0IHRvIGRvIGFuaW1hdGlvbnMgYWNyb3NzIGFkYXB0ZXJzLlxuXHQgKi9cblx0aW5pdDogZnVuY3Rpb24gKHBhdGhBbmltKSB7XG5cdFx0dmFyIGZ4UHJvdG8gPSBGeC5wcm90b3R5cGUsXG5cdFx0XHRmeFN0YXJ0ID0gZnhQcm90by5zdGFydCxcblx0XHRcdG1vcnBoUHJvdG8gPSBGeC5Nb3JwaC5wcm90b3R5cGUsXG5cdFx0XHRtb3JwaENvbXB1dGUgPSBtb3JwaFByb3RvLmNvbXB1dGU7XG5cblx0XHQvLyBvdmVycmlkZSBGeC5zdGFydCB0byBhbGxvdyBhbmltYXRpb24gb2YgU1ZHIGVsZW1lbnQgd3JhcHBlcnNcblx0XHQvKmpzbGludCB1bnBhcmFtOiB0cnVlKi8vKiBhbGxvdyB1bnVzZWQgcGFyYW1ldGVycyBpbiBmeCBmdW5jdGlvbnMgKi9cblx0XHRmeFByb3RvLnN0YXJ0ID0gZnVuY3Rpb24gKGZyb20sIHRvKSB7XG5cdFx0XHR2YXIgZnggPSB0aGlzLFxuXHRcdFx0XHRlbGVtID0gZnguZWxlbWVudDtcblxuXHRcdFx0Ly8gc3BlY2lhbCBmb3IgYW5pbWF0aW5nIHBhdGhzXG5cdFx0XHRpZiAoZnJvbS5kKSB7XG5cdFx0XHRcdC8vdGhpcy5mcm9tRCA9IHRoaXMuZWxlbWVudC5kLnNwbGl0KCcgJyk7XG5cdFx0XHRcdGZ4LnBhdGhzID0gcGF0aEFuaW0uaW5pdChcblx0XHRcdFx0XHRlbGVtLFxuXHRcdFx0XHRcdGVsZW0uZCxcblx0XHRcdFx0XHRmeC50b0Rcblx0XHRcdFx0KTtcblx0XHRcdH1cblx0XHRcdGZ4U3RhcnQuYXBwbHkoZngsIGFyZ3VtZW50cyk7XG5cblx0XHRcdHJldHVybiB0aGlzOyAvLyBjaGFpbmFibGVcblx0XHR9O1xuXG5cdFx0Ly8gb3ZlcnJpZGUgRnguc3RlcCB0byBhbGxvdyBhbmltYXRpb24gb2YgU1ZHIGVsZW1lbnQgd3JhcHBlcnNcblx0XHRtb3JwaFByb3RvLmNvbXB1dGUgPSBmdW5jdGlvbiAoZnJvbSwgdG8sIGRlbHRhKSB7XG5cdFx0XHR2YXIgZnggPSB0aGlzLFxuXHRcdFx0XHRwYXRocyA9IGZ4LnBhdGhzO1xuXG5cdFx0XHRpZiAocGF0aHMpIHtcblx0XHRcdFx0ZnguZWxlbWVudC5hdHRyKFxuXHRcdFx0XHRcdCdkJyxcblx0XHRcdFx0XHRwYXRoQW5pbS5zdGVwKHBhdGhzWzBdLCBwYXRoc1sxXSwgZGVsdGEsIGZ4LnRvRClcblx0XHRcdFx0KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJldHVybiBtb3JwaENvbXB1dGUuYXBwbHkoZngsIGFyZ3VtZW50cyk7XG5cdFx0XHR9XG5cdFx0fTtcblx0XHQvKmpzbGludCB1bnBhcmFtOiBmYWxzZSovXG5cdH0sXG5cdFxuXHQvKipcblx0ICogUnVuIGEgZ2VuZXJhbCBtZXRob2Qgb24gdGhlIGZyYW1ld29yaywgZm9sbG93aW5nIGpRdWVyeSBzeW50YXhcblx0ICogQHBhcmFtIHtPYmplY3R9IGVsIFRoZSBIVE1MIGVsZW1lbnRcblx0ICogQHBhcmFtIHtTdHJpbmd9IG1ldGhvZCBXaGljaCBtZXRob2QgdG8gcnVuIG9uIHRoZSB3cmFwcGVkIGVsZW1lbnRcblx0ICovXG5cdGFkYXB0ZXJSdW46IGZ1bmN0aW9uIChlbCwgbWV0aG9kKSB7XG5cdFx0XG5cdFx0Ly8gVGhpcyBjdXJyZW50bHkgd29ya3MgZm9yIGdldHRpbmcgaW5uZXIgd2lkdGggYW5kIGhlaWdodC4gSWYgYWRkaW5nXG5cdFx0Ly8gbW9yZSBtZXRob2RzIGxhdGVyLCB3ZSBuZWVkIGEgY29uZGl0aW9uYWwgaW1wbGVtZW50YXRpb24gZm9yIGVhY2guXG5cdFx0aWYgKG1ldGhvZCA9PT0gJ3dpZHRoJyB8fCBtZXRob2QgPT09ICdoZWlnaHQnKSB7XG5cdFx0XHRyZXR1cm4gcGFyc2VJbnQoJChlbCkuZ2V0U3R5bGUobWV0aG9kKSwgMTApO1xuXHRcdH1cblx0fSxcblxuXHQvKipcblx0ICogRG93bmxvYWRzIGEgc2NyaXB0IGFuZCBleGVjdXRlcyBhIGNhbGxiYWNrIHdoZW4gZG9uZS5cblx0ICogQHBhcmFtIHtTdHJpbmd9IHNjcmlwdExvY2F0aW9uXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG5cdCAqL1xuXHRnZXRTY3JpcHQ6IGZ1bmN0aW9uIChzY3JpcHRMb2NhdGlvbiwgY2FsbGJhY2spIHtcblx0XHQvLyBXZSBjYW5ub3QgYXNzdW1lIHRoYXQgQXNzZXRzIGNsYXNzIGZyb20gbW9vdG9vbHMtbW9yZSBpcyBhdmFpbGFibGUgc28gaW5zdGVhZCBpbnNlcnQgYSBzY3JpcHQgdGFnIHRvIGRvd25sb2FkIHNjcmlwdC5cblx0XHR2YXIgaGVhZCA9IGRvYy5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdO1xuXHRcdHZhciBzY3JpcHQgPSBkb2MuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG5cblx0XHRzY3JpcHQudHlwZSA9ICd0ZXh0L2phdmFzY3JpcHQnO1xuXHRcdHNjcmlwdC5zcmMgPSBzY3JpcHRMb2NhdGlvbjtcblx0XHRzY3JpcHQub25sb2FkID0gY2FsbGJhY2s7XG5cblx0XHRoZWFkLmFwcGVuZENoaWxkKHNjcmlwdCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEFuaW1hdGUgYSBIVE1MIGVsZW1lbnQgb3IgU1ZHIGVsZW1lbnQgd3JhcHBlclxuXHQgKiBAcGFyYW0ge09iamVjdH0gZWxcblx0ICogQHBhcmFtIHtPYmplY3R9IHBhcmFtc1xuXHQgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBqUXVlcnktbGlrZSBhbmltYXRpb24gb3B0aW9uczogZHVyYXRpb24sIGVhc2luZywgY2FsbGJhY2tcblx0ICovXG5cdGFuaW1hdGU6IGZ1bmN0aW9uIChlbCwgcGFyYW1zLCBvcHRpb25zKSB7XG5cdFx0dmFyIGlzU1ZHRWxlbWVudCA9IGVsLmF0dHIsXG5cdFx0XHRlZmZlY3QsXG5cdFx0XHRjb21wbGV0ZSA9IG9wdGlvbnMgJiYgb3B0aW9ucy5jb21wbGV0ZTtcblxuXHRcdGlmIChpc1NWR0VsZW1lbnQgJiYgIWVsLnNldFN0eWxlKSB7XG5cdFx0XHQvLyBhZGQgc2V0U3R5bGUgYW5kIGdldFN0eWxlIG1ldGhvZHMgZm9yIGludGVybmFsIHVzZSBpbiBNb29cblx0XHRcdGVsLmdldFN0eWxlID0gZWwuYXR0cjtcblx0XHRcdGVsLnNldFN0eWxlID0gZnVuY3Rpb24gKCkgeyAvLyBwcm9wZXJ0eSB2YWx1ZSBpcyBnaXZlbiBhcyBhcnJheSBpbiBNb28gLSBicmVhayBpdCBkb3duXG5cdFx0XHRcdHZhciBhcmdzID0gYXJndW1lbnRzO1xuXHRcdFx0XHR0aGlzLmF0dHIuY2FsbCh0aGlzLCBhcmdzWzBdLCBhcmdzWzFdWzBdKTtcblx0XHRcdH07XG5cdFx0XHQvLyBkaXJ0eSBoYWNrIHRvIHRyaWNrIE1vbyBpbnRvIGhhbmRsaW5nIGVsIGFzIGFuIGVsZW1lbnQgd3JhcHBlclxuXHRcdFx0ZWwuJGZhbWlseSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRydWU7IH07XG5cdFx0fVxuXG5cdFx0Ly8gc3RvcCBydW5uaW5nIGFuaW1hdGlvbnNcblx0XHR3aW4uSGlnaGNoYXJ0c0FkYXB0ZXIuc3RvcChlbCk7XG5cblx0XHQvLyBkZWZpbmUgYW5kIHJ1biB0aGUgZWZmZWN0XG5cdFx0ZWZmZWN0ID0gbmV3IEZ4Lk1vcnBoKFxuXHRcdFx0aXNTVkdFbGVtZW50ID8gZWwgOiAkKGVsKSxcblx0XHRcdCRleHRlbmQoe1xuXHRcdFx0XHR0cmFuc2l0aW9uOiBGeC5UcmFuc2l0aW9ucy5RdWFkLmVhc2VJbk91dFxuXHRcdFx0fSwgb3B0aW9ucylcblx0XHQpO1xuXG5cdFx0Ly8gTWFrZSBzdXJlIHRoYXQgdGhlIGVsZW1lbnQgcmVmZXJlbmNlIGlzIHNldCB3aGVuIGFuaW1hdGluZyBzdmcgZWxlbWVudHNcblx0XHRpZiAoaXNTVkdFbGVtZW50KSB7XG5cdFx0XHRlZmZlY3QuZWxlbWVudCA9IGVsO1xuXHRcdH1cblxuXHRcdC8vIHNwZWNpYWwgdHJlYXRtZW50IGZvciBwYXRoc1xuXHRcdGlmIChwYXJhbXMuZCkge1xuXHRcdFx0ZWZmZWN0LnRvRCA9IHBhcmFtcy5kO1xuXHRcdH1cblxuXHRcdC8vIGpRdWVyeS1saWtlIGV2ZW50c1xuXHRcdGlmIChjb21wbGV0ZSkge1xuXHRcdFx0ZWZmZWN0LmFkZEV2ZW50KCdjb21wbGV0ZScsIGNvbXBsZXRlKTtcblx0XHR9XG5cblx0XHQvLyBydW5cblx0XHRlZmZlY3Quc3RhcnQocGFyYW1zKTtcblxuXHRcdC8vIHJlY29yZCBmb3IgdXNlIGluIHN0b3AgbWV0aG9kXG5cdFx0ZWwuZnggPSBlZmZlY3Q7XG5cdH0sXG5cblx0LyoqXG5cdCAqIE1vb1Rvb2wncyBlYWNoIGZ1bmN0aW9uXG5cdCAqXG5cdCAqL1xuXHRlYWNoOiBmdW5jdGlvbiAoYXJyLCBmbikge1xuXHRcdHJldHVybiBsZWdhY3kgP1xuXHRcdFx0JGVhY2goYXJyLCBmbikgOlxuXHRcdFx0QXJyYXkuZWFjaChhcnIsIGZuKTtcblx0fSxcblxuXHQvKipcblx0ICogTWFwIGFuIGFycmF5XG5cdCAqIEBwYXJhbSB7QXJyYXl9IGFyclxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuXHQgKi9cblx0bWFwOiBmdW5jdGlvbiAoYXJyLCBmbikge1xuXHRcdHJldHVybiBhcnIubWFwKGZuKTtcblx0fSxcblxuXHQvKipcblx0ICogR3JlcCBvciBmaWx0ZXIgYW4gYXJyYXlcblx0ICogQHBhcmFtIHtBcnJheX0gYXJyXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG5cdCAqL1xuXHRncmVwOiBmdW5jdGlvbiAoYXJyLCBmbikge1xuXHRcdHJldHVybiBhcnIuZmlsdGVyKGZuKTtcblx0fSxcblx0XG5cdC8qKlxuXHQgKiBSZXR1cm4gdGhlIGluZGV4IG9mIGFuIGl0ZW0gaW4gYW4gYXJyYXksIG9yIC0xIGlmIG5vdCBtYXRjaGVkXG5cdCAqL1xuXHRpbkFycmF5OiBmdW5jdGlvbiAoaXRlbSwgYXJyLCBmcm9tKSB7XG5cdFx0cmV0dXJuIGFyciA/IGFyci5pbmRleE9mKGl0ZW0sIGZyb20pIDogLTE7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEdldCB0aGUgb2Zmc2V0IG9mIGFuIGVsZW1lbnQgcmVsYXRpdmUgdG8gdGhlIHRvcCBsZWZ0IGNvcm5lciBvZiB0aGUgd2ViIHBhZ2Vcblx0ICovXG5cdG9mZnNldDogZnVuY3Rpb24gKGVsKSB7XG5cdFx0dmFyIG9mZnNldHMgPSBlbC5nZXRQb3NpdGlvbigpOyAvLyAjMTQ5NlxuXHRcdHJldHVybiB7XG5cdFx0XHRsZWZ0OiBvZmZzZXRzLngsXG5cdFx0XHR0b3A6IG9mZnNldHMueVxuXHRcdH07XG5cdH0sXG5cblx0LyoqXG5cdCAqIEV4dGVuZHMgYW4gb2JqZWN0IHdpdGggRXZlbnRzLCBpZiBpdHMgbm90IGRvbmVcblx0ICovXG5cdGV4dGVuZFdpdGhFdmVudHM6IGZ1bmN0aW9uIChlbCkge1xuXHRcdC8vIGlmIHRoZSBhZGRFdmVudCBtZXRob2QgaXMgbm90IGRlZmluZWQsIGVsIGlzIGEgY3VzdG9tIEhpZ2hjaGFydHMgb2JqZWN0XG5cdFx0Ly8gbGlrZSBzZXJpZXMgb3IgcG9pbnRcblx0XHRpZiAoIWVsLmFkZEV2ZW50KSB7XG5cdFx0XHRpZiAoZWwubm9kZU5hbWUpIHtcblx0XHRcdFx0ZWwgPSAkKGVsKTsgLy8gYSBkeW5hbWljYWxseSBnZW5lcmF0ZWQgbm9kZVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0JGV4dGVuZChlbCwgbmV3IEV2ZW50cygpKTsgLy8gYSBjdXN0b20gb2JqZWN0XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cdC8qKlxuXHQgKiBBZGQgYW4gZXZlbnQgbGlzdGVuZXJcblx0ICogQHBhcmFtIHtPYmplY3R9IGVsIEhUTUwgZWxlbWVudCBvciBjdXN0b20gb2JqZWN0XG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlIEV2ZW50IHR5cGVcblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gRXZlbnQgaGFuZGxlclxuXHQgKi9cblx0YWRkRXZlbnQ6IGZ1bmN0aW9uIChlbCwgdHlwZSwgZm4pIHtcblx0XHRpZiAodHlwZW9mIHR5cGUgPT09ICdzdHJpbmcnKSB7IC8vIGNoYXJ0IGJyb2tlIGR1ZSB0byBlbCBiZWluZyBzdHJpbmcsIHR5cGUgZnVuY3Rpb25cblxuXHRcdFx0aWYgKHR5cGUgPT09ICd1bmxvYWQnKSB7IC8vIE1vbyBzZWxmIGRlc3RydWN0cyBiZWZvcmUgY3VzdG9tIHVubG9hZCBldmVudHNcblx0XHRcdFx0dHlwZSA9ICdiZWZvcmV1bmxvYWQnO1xuXHRcdFx0fVxuXG5cdFx0XHR3aW4uSGlnaGNoYXJ0c0FkYXB0ZXIuZXh0ZW5kV2l0aEV2ZW50cyhlbCk7XG5cblx0XHRcdGVsLmFkZEV2ZW50KHR5cGUsIGZuKTtcblx0XHR9XG5cdH0sXG5cblx0cmVtb3ZlRXZlbnQ6IGZ1bmN0aW9uIChlbCwgdHlwZSwgZm4pIHtcblx0XHRpZiAodHlwZW9mIGVsID09PSAnc3RyaW5nJykge1xuXHRcdFx0Ly8gZWwucmVtb3ZlRXZlbnRzIGJlbG93IGFwcGVyYW50bHkgY2FsbHMgdGhpcyBtZXRob2QgYWdhaW4uIERvIG5vdCBxdWl0ZSB1bmRlcnN0YW5kIHdoeSwgc28gZm9yIG5vdyBqdXN0IGJhaWwgb3V0LlxuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRcblx0XHRpZiAoZWwuYWRkRXZlbnQpIHsgLy8gSWYgZWwgZG9lc24ndCBoYXZlIGFuIGFkZEV2ZW50IG1ldGhvZCwgdGhlcmUgYXJlIG5vIGV2ZW50cyB0byByZW1vdmVcblx0XHRcdGlmICh0eXBlKSB7XG5cdFx0XHRcdGlmICh0eXBlID09PSAndW5sb2FkJykgeyAvLyBNb28gc2VsZiBkZXN0cnVjdHMgYmVmb3JlIGN1c3RvbSB1bmxvYWQgZXZlbnRzXG5cdFx0XHRcdFx0dHlwZSA9ICdiZWZvcmV1bmxvYWQnO1xuXHRcdFx0XHR9XG5cdFxuXHRcdFx0XHRpZiAoZm4pIHtcblx0XHRcdFx0XHRlbC5yZW1vdmVFdmVudCh0eXBlLCBmbik7XG5cdFx0XHRcdH0gZWxzZSBpZiAoZWwucmVtb3ZlRXZlbnRzKSB7IC8vICM5NThcblx0XHRcdFx0XHRlbC5yZW1vdmVFdmVudHModHlwZSk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGVsLnJlbW92ZUV2ZW50cygpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXHRmaXJlRXZlbnQ6IGZ1bmN0aW9uIChlbCwgZXZlbnQsIGV2ZW50QXJndW1lbnRzLCBkZWZhdWx0RnVuY3Rpb24pIHtcblx0XHR2YXIgZXZlbnRBcmdzID0ge1xuXHRcdFx0dHlwZTogZXZlbnQsXG5cdFx0XHR0YXJnZXQ6IGVsXG5cdFx0fTtcblx0XHQvLyBjcmVhdGUgYW4gZXZlbnQgb2JqZWN0IHRoYXQga2VlcHMgYWxsIGZ1bmN0aW9uc1xuXHRcdGV2ZW50ID0gbGVnYWN5RXZlbnQgPyBuZXcgRXZlbnQoZXZlbnRBcmdzKSA6IG5ldyBET01FdmVudChldmVudEFyZ3MpO1xuXHRcdGV2ZW50ID0gJGV4dGVuZChldmVudCwgZXZlbnRBcmd1bWVudHMpO1xuXG5cdFx0Ly8gV2hlbiBydW5uaW5nIGFuIGV2ZW50IG9uIHRoZSBDaGFydC5wcm90b3R5cGUsIE1vb1Rvb2xzIG5lc3RzIHRoZSB0YXJnZXQgaW4gZXZlbnQuZXZlbnRcblx0XHRpZiAoIWV2ZW50LnRhcmdldCAmJiBldmVudC5ldmVudCkge1xuXHRcdFx0ZXZlbnQudGFyZ2V0ID0gZXZlbnQuZXZlbnQudGFyZ2V0O1xuXHRcdH1cblxuXHRcdC8vIG92ZXJyaWRlIHRoZSBwcmV2ZW50RGVmYXVsdCBmdW5jdGlvbiB0byBiZSBhYmxlIHRvIHVzZVxuXHRcdC8vIHRoaXMgZm9yIGN1c3RvbSBldmVudHNcblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGRlZmF1bHRGdW5jdGlvbiA9IG51bGw7XG5cdFx0fTtcblx0XHQvLyBpZiBmaXJlRXZlbnQgaXMgbm90IGF2YWlsYWJsZSBvbiB0aGUgb2JqZWN0LCB0aGVyZSBoYXNuJ3QgYmVlbiBhZGRlZFxuXHRcdC8vIGFueSBldmVudHMgdG8gaXQgYWJvdmVcblx0XHRpZiAoZWwuZmlyZUV2ZW50KSB7XG5cdFx0XHRlbC5maXJlRXZlbnQoZXZlbnQudHlwZSwgZXZlbnQpO1xuXHRcdH1cblxuXHRcdC8vIGZpcmUgdGhlIGRlZmF1bHQgaWYgaXQgaXMgcGFzc2VkIGFuZCBpdCBpcyBub3QgcHJldmVudGVkIGFib3ZlXG5cdFx0aWYgKGRlZmF1bHRGdW5jdGlvbikge1xuXHRcdFx0ZGVmYXVsdEZ1bmN0aW9uKGV2ZW50KTtcblx0XHR9XG5cdH0sXG5cdFxuXHQvKipcblx0ICogU2V0IGJhY2sgZS5wYWdlWCBhbmQgZS5wYWdlWSB0aGF0IE1vb1Rvb2xzIGhhcyBhYnN0cmFjdGVkIGF3YXkuICMxMTY1LCAjMTM0Ni5cblx0ICovXG5cdHdhc2hNb3VzZUV2ZW50OiBmdW5jdGlvbiAoZSkge1xuXHRcdGlmIChlLnBhZ2UpIHtcblx0XHRcdGUucGFnZVggPSBlLnBhZ2UueDtcblx0XHRcdGUucGFnZVkgPSBlLnBhZ2UueTtcblx0XHR9XG5cdFx0cmV0dXJuIGU7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFN0b3AgcnVubmluZyBhbmltYXRpb25zIG9uIHRoZSBvYmplY3Rcblx0ICovXG5cdHN0b3A6IGZ1bmN0aW9uIChlbCkge1xuXHRcdGlmIChlbC5meCkge1xuXHRcdFx0ZWwuZnguY2FuY2VsKCk7XG5cdFx0fVxuXHR9XG59O1xuXG59KCkpO1xuIl0sImZpbGUiOiJwbHVnaW5zL3VlZGl0b3IvdGhpcmQtcGFydHkvaGlnaGNoYXJ0cy9hZGFwdGVycy9tb290b29scy1hZGFwdGVyLnNyYy5qcyJ9
