(function (Highcharts, HighchartsAdapter) {

var UNDEFINED,
	ALIGN_FACTOR,
	ALLOWED_SHAPES,
	Chart = Highcharts.Chart,
	extend = Highcharts.extend,
	each = Highcharts.each;

ALLOWED_SHAPES = ["path", "rect", "circle"];

ALIGN_FACTOR = {
	top: 0,
	left: 0,
	center: 0.5,
	middle: 0.5,
	bottom: 1,
	right: 1
};


// Highcharts helper methods
var inArray = HighchartsAdapter.inArray,
	merge = Highcharts.merge;

function defaultOptions(shapeType) {
	var shapeOptions,
		options;

	options = {
		xAxis: 0,
		yAxis: 0,
		title: {
			style: {},
			text: "",
			x: 0,
			y: 0
		},
		shape: {
			params: {
				stroke: "#000000",
				fill: "transparent",
				strokeWidth: 2
			}
		}
	};

	shapeOptions = {
		circle: {
			params: {
				x: 0,
				y: 0
			}
		}
	};

	if (shapeOptions[shapeType]) {
		options.shape = merge(options.shape, shapeOptions[shapeType]);
	}

	return options;
}

function isArray(obj) {
	return Object.prototype.toString.call(obj) === '[object Array]';
}

function isNumber(n) {
	return typeof n === 'number';
}

function defined(obj) {
	return obj !== UNDEFINED && obj !== null;
}

function translatePath(d, xAxis, yAxis, xOffset, yOffset) {
	var len = d.length,
		i = 0;

	while (i < len) {
		if (typeof d[i] === 'number' && typeof d[i + 1] === 'number') {
			d[i] = xAxis.toPixels(d[i]) - xOffset;
			d[i + 1] = yAxis.toPixels(d[i + 1]) - yOffset;
			i += 2;
		} else {
			i += 1;
		}
	}

	return d;
}


// Define annotation prototype
var Annotation = function () {
	this.init.apply(this, arguments);
};
Annotation.prototype = {
	/* 
	 * Initialize the annotation
	 */
	init: function (chart, options) {
		var shapeType = options.shape && options.shape.type;

		this.chart = chart;
		this.options = merge({}, defaultOptions(shapeType), options);
	},

	/*
	 * Render the annotation
	 */
	render: function (redraw) {
		var annotation = this,
			chart = this.chart,
			renderer = annotation.chart.renderer,
			group = annotation.group,
			title = annotation.title,
			shape = annotation.shape,
			options = annotation.options,
			titleOptions = options.title,
			shapeOptions = options.shape;

		if (!group) {
			group = annotation.group = renderer.g();
		}


		if (!shape && shapeOptions && inArray(shapeOptions.type, ALLOWED_SHAPES) !== -1) {
			shape = annotation.shape = renderer[options.shape.type](shapeOptions.params);
			shape.add(group);
		}

		if (!title && titleOptions) {
			title = annotation.title = renderer.label(titleOptions);
			title.add(group);
		}

		group.add(chart.annotations.group);

		// link annotations to point or series
		annotation.linkObjects();

		if (redraw !== false) {
			annotation.redraw();
		}
	},

	/*
	 * Redraw the annotation title or shape after options update
	 */
	redraw: function () {
		var options = this.options,
			chart = this.chart,
			group = this.group,
			title = this.title,
			shape = this.shape,
			linkedTo = this.linkedObject,
			xAxis = chart.xAxis[options.xAxis],
			yAxis = chart.yAxis[options.yAxis],
			width = options.width,
			height = options.height,
			anchorY = ALIGN_FACTOR[options.anchorY],
			anchorX = ALIGN_FACTOR[options.anchorX],
			resetBBox = false,
			shapeParams,
			linkType,
			series,
			param,
			bbox,
			x,
			y;

		if (linkedTo) {
			linkType = (linkedTo instanceof Highcharts.Point) ? 'point' :
						(linkedTo instanceof Highcharts.Series) ? 'series' : null;

			if (linkType === 'point') {
				options.xValue = linkedTo.x;
				options.yValue = linkedTo.y;
				series = linkedTo.series;
			} else if (linkType === 'series') {
				series = linkedTo;
			}

			if (group.visibility !== series.group.visibility) {
				group.attr({
					visibility: series.group.visibility
				});
			}
		}


		// Based on given options find annotation pixel position
		x = (defined(options.xValue) ? xAxis.toPixels(options.xValue + xAxis.minPointOffset) - xAxis.minPixelPadding : options.x);
		y = defined(options.yValue) ? yAxis.toPixels(options.yValue) : options.y;

		if (isNaN(x) || isNaN(y) || !isNumber(x) || !isNumber(y)) {
			return;
		}


		if (title) {
			title.attr(options.title);
			title.css(options.title.style);
			resetBBox = true;
		}

		if (shape) {
			shapeParams = extend({}, options.shape.params);

			if (options.units === 'values') {
				for (param in shapeParams) {
					if (inArray(param, ['width', 'x']) > -1) {
						shapeParams[param] = xAxis.translate(shapeParams[param]);
					} else if (inArray(param, ['height', 'y']) > -1) {
						shapeParams[param] = yAxis.translate(shapeParams[param]);
					}
				}

				if (shapeParams.width) {
					shapeParams.width -= xAxis.toPixels(0) - xAxis.left;
				}

				if (shapeParams.x) {
					shapeParams.x += xAxis.minPixelPadding;
				}

				if (options.shape.type === 'path') {
					translatePath(shapeParams.d, xAxis, yAxis, x, y);
				}
			}

			// move the center of the circle to shape x/y
			if (options.shape.type === 'circle') {
				shapeParams.x += shapeParams.r;
				shapeParams.y += shapeParams.r;
			}

			resetBBox = true;
			shape.attr(shapeParams);
		}

		group.bBox = null;

		// If annotation width or height is not defined in options use bounding box size
		if (!isNumber(width)) {
			bbox = group.getBBox();
			width = bbox.width;
		}

		if (!isNumber(height)) {
			// get bbox only if it wasn't set before
			if (!bbox) {
				bbox = group.getBBox();
			}

			height = bbox.height;
		}

		// Calculate anchor point
		if (!isNumber(anchorX)) {
			anchorX = ALIGN_FACTOR.center;
		}

		if (!isNumber(anchorY)) {
			anchorY = ALIGN_FACTOR.center;
		}

		// Translate group according to its dimension and anchor point
		x = x - width * anchorX;
		y = y - height * anchorY;

		if (chart.animation && defined(group.translateX) && defined(group.translateY)) {
			group.animate({
				translateX: x,
				translateY: y
			});
		} else {
			group.translate(x, y);
		}
	},

	/*
	 * Destroy the annotation
	 */
	destroy: function () {
		var annotation = this,
			chart = this.chart,
			allItems = chart.annotations.allItems,
			index = allItems.indexOf(annotation);

		if (index > -1) {
			allItems.splice(index, 1);
		}

		each(['title', 'shape', 'group'], function (element) {
			if (annotation[element]) {
				annotation[element].destroy();
				annotation[element] = null;
			}
		});

		annotation.group = annotation.title = annotation.shape = annotation.chart = annotation.options = null;
	},

	/*
	 * Update the annotation with a given options
	 */
	update: function (options, redraw) {
		extend(this.options, options);

		// update link to point or series
		this.linkObjects();

		this.render(redraw);
	},

	linkObjects: function () {
		var annotation = this,
			chart = annotation.chart,
			linkedTo = annotation.linkedObject,
			linkedId = linkedTo && (linkedTo.id || linkedTo.options.id),
			options = annotation.options,
			id = options.linkedTo;

		if (!defined(id)) {
			annotation.linkedObject = null;
		} else if (!defined(linkedTo) || id !== linkedId) {
			annotation.linkedObject = chart.get(id);
		}
	}
};


// Add annotations methods to chart prototype
extend(Chart.prototype, {
	annotations: {
		/*
		 * Unified method for adding annotations to the chart
		 */
		add: function (options, redraw) {
			var annotations = this.allItems,
				chart = this.chart,
				item,
				len;

			if (!isArray(options)) {
				options = [options];
			}

			len = options.length;

			while (len--) {
				item = new Annotation(chart, options[len]);
				annotations.push(item);
				item.render(redraw);
			}
		},

		/**
		 * Redraw all annotations, method used in chart events
		 */
		redraw: function () {
			each(this.allItems, function (annotation) {
				annotation.redraw();
			});
		}
	}
});


// Initialize on chart load
Chart.prototype.callbacks.push(function (chart) {
	var options = chart.options.annotations,
		group;

	group = chart.renderer.g("annotations");
	group.attr({
		zIndex: 7
	});
	group.add();

	// initialize empty array for annotations
	chart.annotations.allItems = [];

	// link chart object to annotations
	chart.annotations.chart = chart;

	// link annotations group element to the chart
	chart.annotations.group = group;

	if (isArray(options) && options.length > 0) {
		chart.annotations.add(chart.options.annotations);
	}

	// update annotations after chart redraw
	Highcharts.addEvent(chart, 'redraw', function () {
		chart.annotations.redraw();
	});
});
}(Highcharts, HighchartsAdapter));

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvdGhpcmQtcGFydHkvaGlnaGNoYXJ0cy9tb2R1bGVzL2Fubm90YXRpb25zLnNyYy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gKEhpZ2hjaGFydHMsIEhpZ2hjaGFydHNBZGFwdGVyKSB7XG5cbnZhciBVTkRFRklORUQsXG5cdEFMSUdOX0ZBQ1RPUixcblx0QUxMT1dFRF9TSEFQRVMsXG5cdENoYXJ0ID0gSGlnaGNoYXJ0cy5DaGFydCxcblx0ZXh0ZW5kID0gSGlnaGNoYXJ0cy5leHRlbmQsXG5cdGVhY2ggPSBIaWdoY2hhcnRzLmVhY2g7XG5cbkFMTE9XRURfU0hBUEVTID0gW1wicGF0aFwiLCBcInJlY3RcIiwgXCJjaXJjbGVcIl07XG5cbkFMSUdOX0ZBQ1RPUiA9IHtcblx0dG9wOiAwLFxuXHRsZWZ0OiAwLFxuXHRjZW50ZXI6IDAuNSxcblx0bWlkZGxlOiAwLjUsXG5cdGJvdHRvbTogMSxcblx0cmlnaHQ6IDFcbn07XG5cblxuLy8gSGlnaGNoYXJ0cyBoZWxwZXIgbWV0aG9kc1xudmFyIGluQXJyYXkgPSBIaWdoY2hhcnRzQWRhcHRlci5pbkFycmF5LFxuXHRtZXJnZSA9IEhpZ2hjaGFydHMubWVyZ2U7XG5cbmZ1bmN0aW9uIGRlZmF1bHRPcHRpb25zKHNoYXBlVHlwZSkge1xuXHR2YXIgc2hhcGVPcHRpb25zLFxuXHRcdG9wdGlvbnM7XG5cblx0b3B0aW9ucyA9IHtcblx0XHR4QXhpczogMCxcblx0XHR5QXhpczogMCxcblx0XHR0aXRsZToge1xuXHRcdFx0c3R5bGU6IHt9LFxuXHRcdFx0dGV4dDogXCJcIixcblx0XHRcdHg6IDAsXG5cdFx0XHR5OiAwXG5cdFx0fSxcblx0XHRzaGFwZToge1xuXHRcdFx0cGFyYW1zOiB7XG5cdFx0XHRcdHN0cm9rZTogXCIjMDAwMDAwXCIsXG5cdFx0XHRcdGZpbGw6IFwidHJhbnNwYXJlbnRcIixcblx0XHRcdFx0c3Ryb2tlV2lkdGg6IDJcblx0XHRcdH1cblx0XHR9XG5cdH07XG5cblx0c2hhcGVPcHRpb25zID0ge1xuXHRcdGNpcmNsZToge1xuXHRcdFx0cGFyYW1zOiB7XG5cdFx0XHRcdHg6IDAsXG5cdFx0XHRcdHk6IDBcblx0XHRcdH1cblx0XHR9XG5cdH07XG5cblx0aWYgKHNoYXBlT3B0aW9uc1tzaGFwZVR5cGVdKSB7XG5cdFx0b3B0aW9ucy5zaGFwZSA9IG1lcmdlKG9wdGlvbnMuc2hhcGUsIHNoYXBlT3B0aW9uc1tzaGFwZVR5cGVdKTtcblx0fVxuXG5cdHJldHVybiBvcHRpb25zO1xufVxuXG5mdW5jdGlvbiBpc0FycmF5KG9iaikge1xuXHRyZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IEFycmF5XSc7XG59XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKG4pIHtcblx0cmV0dXJuIHR5cGVvZiBuID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gZGVmaW5lZChvYmopIHtcblx0cmV0dXJuIG9iaiAhPT0gVU5ERUZJTkVEICYmIG9iaiAhPT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gdHJhbnNsYXRlUGF0aChkLCB4QXhpcywgeUF4aXMsIHhPZmZzZXQsIHlPZmZzZXQpIHtcblx0dmFyIGxlbiA9IGQubGVuZ3RoLFxuXHRcdGkgPSAwO1xuXG5cdHdoaWxlIChpIDwgbGVuKSB7XG5cdFx0aWYgKHR5cGVvZiBkW2ldID09PSAnbnVtYmVyJyAmJiB0eXBlb2YgZFtpICsgMV0gPT09ICdudW1iZXInKSB7XG5cdFx0XHRkW2ldID0geEF4aXMudG9QaXhlbHMoZFtpXSkgLSB4T2Zmc2V0O1xuXHRcdFx0ZFtpICsgMV0gPSB5QXhpcy50b1BpeGVscyhkW2kgKyAxXSkgLSB5T2Zmc2V0O1xuXHRcdFx0aSArPSAyO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpICs9IDE7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIGQ7XG59XG5cblxuLy8gRGVmaW5lIGFubm90YXRpb24gcHJvdG90eXBlXG52YXIgQW5ub3RhdGlvbiA9IGZ1bmN0aW9uICgpIHtcblx0dGhpcy5pbml0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59O1xuQW5ub3RhdGlvbi5wcm90b3R5cGUgPSB7XG5cdC8qIFxuXHQgKiBJbml0aWFsaXplIHRoZSBhbm5vdGF0aW9uXG5cdCAqL1xuXHRpbml0OiBmdW5jdGlvbiAoY2hhcnQsIG9wdGlvbnMpIHtcblx0XHR2YXIgc2hhcGVUeXBlID0gb3B0aW9ucy5zaGFwZSAmJiBvcHRpb25zLnNoYXBlLnR5cGU7XG5cblx0XHR0aGlzLmNoYXJ0ID0gY2hhcnQ7XG5cdFx0dGhpcy5vcHRpb25zID0gbWVyZ2Uoe30sIGRlZmF1bHRPcHRpb25zKHNoYXBlVHlwZSksIG9wdGlvbnMpO1xuXHR9LFxuXG5cdC8qXG5cdCAqIFJlbmRlciB0aGUgYW5ub3RhdGlvblxuXHQgKi9cblx0cmVuZGVyOiBmdW5jdGlvbiAocmVkcmF3KSB7XG5cdFx0dmFyIGFubm90YXRpb24gPSB0aGlzLFxuXHRcdFx0Y2hhcnQgPSB0aGlzLmNoYXJ0LFxuXHRcdFx0cmVuZGVyZXIgPSBhbm5vdGF0aW9uLmNoYXJ0LnJlbmRlcmVyLFxuXHRcdFx0Z3JvdXAgPSBhbm5vdGF0aW9uLmdyb3VwLFxuXHRcdFx0dGl0bGUgPSBhbm5vdGF0aW9uLnRpdGxlLFxuXHRcdFx0c2hhcGUgPSBhbm5vdGF0aW9uLnNoYXBlLFxuXHRcdFx0b3B0aW9ucyA9IGFubm90YXRpb24ub3B0aW9ucyxcblx0XHRcdHRpdGxlT3B0aW9ucyA9IG9wdGlvbnMudGl0bGUsXG5cdFx0XHRzaGFwZU9wdGlvbnMgPSBvcHRpb25zLnNoYXBlO1xuXG5cdFx0aWYgKCFncm91cCkge1xuXHRcdFx0Z3JvdXAgPSBhbm5vdGF0aW9uLmdyb3VwID0gcmVuZGVyZXIuZygpO1xuXHRcdH1cblxuXG5cdFx0aWYgKCFzaGFwZSAmJiBzaGFwZU9wdGlvbnMgJiYgaW5BcnJheShzaGFwZU9wdGlvbnMudHlwZSwgQUxMT1dFRF9TSEFQRVMpICE9PSAtMSkge1xuXHRcdFx0c2hhcGUgPSBhbm5vdGF0aW9uLnNoYXBlID0gcmVuZGVyZXJbb3B0aW9ucy5zaGFwZS50eXBlXShzaGFwZU9wdGlvbnMucGFyYW1zKTtcblx0XHRcdHNoYXBlLmFkZChncm91cCk7XG5cdFx0fVxuXG5cdFx0aWYgKCF0aXRsZSAmJiB0aXRsZU9wdGlvbnMpIHtcblx0XHRcdHRpdGxlID0gYW5ub3RhdGlvbi50aXRsZSA9IHJlbmRlcmVyLmxhYmVsKHRpdGxlT3B0aW9ucyk7XG5cdFx0XHR0aXRsZS5hZGQoZ3JvdXApO1xuXHRcdH1cblxuXHRcdGdyb3VwLmFkZChjaGFydC5hbm5vdGF0aW9ucy5ncm91cCk7XG5cblx0XHQvLyBsaW5rIGFubm90YXRpb25zIHRvIHBvaW50IG9yIHNlcmllc1xuXHRcdGFubm90YXRpb24ubGlua09iamVjdHMoKTtcblxuXHRcdGlmIChyZWRyYXcgIT09IGZhbHNlKSB7XG5cdFx0XHRhbm5vdGF0aW9uLnJlZHJhdygpO1xuXHRcdH1cblx0fSxcblxuXHQvKlxuXHQgKiBSZWRyYXcgdGhlIGFubm90YXRpb24gdGl0bGUgb3Igc2hhcGUgYWZ0ZXIgb3B0aW9ucyB1cGRhdGVcblx0ICovXG5cdHJlZHJhdzogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBvcHRpb25zID0gdGhpcy5vcHRpb25zLFxuXHRcdFx0Y2hhcnQgPSB0aGlzLmNoYXJ0LFxuXHRcdFx0Z3JvdXAgPSB0aGlzLmdyb3VwLFxuXHRcdFx0dGl0bGUgPSB0aGlzLnRpdGxlLFxuXHRcdFx0c2hhcGUgPSB0aGlzLnNoYXBlLFxuXHRcdFx0bGlua2VkVG8gPSB0aGlzLmxpbmtlZE9iamVjdCxcblx0XHRcdHhBeGlzID0gY2hhcnQueEF4aXNbb3B0aW9ucy54QXhpc10sXG5cdFx0XHR5QXhpcyA9IGNoYXJ0LnlBeGlzW29wdGlvbnMueUF4aXNdLFxuXHRcdFx0d2lkdGggPSBvcHRpb25zLndpZHRoLFxuXHRcdFx0aGVpZ2h0ID0gb3B0aW9ucy5oZWlnaHQsXG5cdFx0XHRhbmNob3JZID0gQUxJR05fRkFDVE9SW29wdGlvbnMuYW5jaG9yWV0sXG5cdFx0XHRhbmNob3JYID0gQUxJR05fRkFDVE9SW29wdGlvbnMuYW5jaG9yWF0sXG5cdFx0XHRyZXNldEJCb3ggPSBmYWxzZSxcblx0XHRcdHNoYXBlUGFyYW1zLFxuXHRcdFx0bGlua1R5cGUsXG5cdFx0XHRzZXJpZXMsXG5cdFx0XHRwYXJhbSxcblx0XHRcdGJib3gsXG5cdFx0XHR4LFxuXHRcdFx0eTtcblxuXHRcdGlmIChsaW5rZWRUbykge1xuXHRcdFx0bGlua1R5cGUgPSAobGlua2VkVG8gaW5zdGFuY2VvZiBIaWdoY2hhcnRzLlBvaW50KSA/ICdwb2ludCcgOlxuXHRcdFx0XHRcdFx0KGxpbmtlZFRvIGluc3RhbmNlb2YgSGlnaGNoYXJ0cy5TZXJpZXMpID8gJ3NlcmllcycgOiBudWxsO1xuXG5cdFx0XHRpZiAobGlua1R5cGUgPT09ICdwb2ludCcpIHtcblx0XHRcdFx0b3B0aW9ucy54VmFsdWUgPSBsaW5rZWRUby54O1xuXHRcdFx0XHRvcHRpb25zLnlWYWx1ZSA9IGxpbmtlZFRvLnk7XG5cdFx0XHRcdHNlcmllcyA9IGxpbmtlZFRvLnNlcmllcztcblx0XHRcdH0gZWxzZSBpZiAobGlua1R5cGUgPT09ICdzZXJpZXMnKSB7XG5cdFx0XHRcdHNlcmllcyA9IGxpbmtlZFRvO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZ3JvdXAudmlzaWJpbGl0eSAhPT0gc2VyaWVzLmdyb3VwLnZpc2liaWxpdHkpIHtcblx0XHRcdFx0Z3JvdXAuYXR0cih7XG5cdFx0XHRcdFx0dmlzaWJpbGl0eTogc2VyaWVzLmdyb3VwLnZpc2liaWxpdHlcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cblx0XHQvLyBCYXNlZCBvbiBnaXZlbiBvcHRpb25zIGZpbmQgYW5ub3RhdGlvbiBwaXhlbCBwb3NpdGlvblxuXHRcdHggPSAoZGVmaW5lZChvcHRpb25zLnhWYWx1ZSkgPyB4QXhpcy50b1BpeGVscyhvcHRpb25zLnhWYWx1ZSArIHhBeGlzLm1pblBvaW50T2Zmc2V0KSAtIHhBeGlzLm1pblBpeGVsUGFkZGluZyA6IG9wdGlvbnMueCk7XG5cdFx0eSA9IGRlZmluZWQob3B0aW9ucy55VmFsdWUpID8geUF4aXMudG9QaXhlbHMob3B0aW9ucy55VmFsdWUpIDogb3B0aW9ucy55O1xuXG5cdFx0aWYgKGlzTmFOKHgpIHx8IGlzTmFOKHkpIHx8ICFpc051bWJlcih4KSB8fCAhaXNOdW1iZXIoeSkpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblxuXHRcdGlmICh0aXRsZSkge1xuXHRcdFx0dGl0bGUuYXR0cihvcHRpb25zLnRpdGxlKTtcblx0XHRcdHRpdGxlLmNzcyhvcHRpb25zLnRpdGxlLnN0eWxlKTtcblx0XHRcdHJlc2V0QkJveCA9IHRydWU7XG5cdFx0fVxuXG5cdFx0aWYgKHNoYXBlKSB7XG5cdFx0XHRzaGFwZVBhcmFtcyA9IGV4dGVuZCh7fSwgb3B0aW9ucy5zaGFwZS5wYXJhbXMpO1xuXG5cdFx0XHRpZiAob3B0aW9ucy51bml0cyA9PT0gJ3ZhbHVlcycpIHtcblx0XHRcdFx0Zm9yIChwYXJhbSBpbiBzaGFwZVBhcmFtcykge1xuXHRcdFx0XHRcdGlmIChpbkFycmF5KHBhcmFtLCBbJ3dpZHRoJywgJ3gnXSkgPiAtMSkge1xuXHRcdFx0XHRcdFx0c2hhcGVQYXJhbXNbcGFyYW1dID0geEF4aXMudHJhbnNsYXRlKHNoYXBlUGFyYW1zW3BhcmFtXSk7XG5cdFx0XHRcdFx0fSBlbHNlIGlmIChpbkFycmF5KHBhcmFtLCBbJ2hlaWdodCcsICd5J10pID4gLTEpIHtcblx0XHRcdFx0XHRcdHNoYXBlUGFyYW1zW3BhcmFtXSA9IHlBeGlzLnRyYW5zbGF0ZShzaGFwZVBhcmFtc1twYXJhbV0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChzaGFwZVBhcmFtcy53aWR0aCkge1xuXHRcdFx0XHRcdHNoYXBlUGFyYW1zLndpZHRoIC09IHhBeGlzLnRvUGl4ZWxzKDApIC0geEF4aXMubGVmdDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChzaGFwZVBhcmFtcy54KSB7XG5cdFx0XHRcdFx0c2hhcGVQYXJhbXMueCArPSB4QXhpcy5taW5QaXhlbFBhZGRpbmc7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAob3B0aW9ucy5zaGFwZS50eXBlID09PSAncGF0aCcpIHtcblx0XHRcdFx0XHR0cmFuc2xhdGVQYXRoKHNoYXBlUGFyYW1zLmQsIHhBeGlzLCB5QXhpcywgeCwgeSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly8gbW92ZSB0aGUgY2VudGVyIG9mIHRoZSBjaXJjbGUgdG8gc2hhcGUgeC95XG5cdFx0XHRpZiAob3B0aW9ucy5zaGFwZS50eXBlID09PSAnY2lyY2xlJykge1xuXHRcdFx0XHRzaGFwZVBhcmFtcy54ICs9IHNoYXBlUGFyYW1zLnI7XG5cdFx0XHRcdHNoYXBlUGFyYW1zLnkgKz0gc2hhcGVQYXJhbXMucjtcblx0XHRcdH1cblxuXHRcdFx0cmVzZXRCQm94ID0gdHJ1ZTtcblx0XHRcdHNoYXBlLmF0dHIoc2hhcGVQYXJhbXMpO1xuXHRcdH1cblxuXHRcdGdyb3VwLmJCb3ggPSBudWxsO1xuXG5cdFx0Ly8gSWYgYW5ub3RhdGlvbiB3aWR0aCBvciBoZWlnaHQgaXMgbm90IGRlZmluZWQgaW4gb3B0aW9ucyB1c2UgYm91bmRpbmcgYm94IHNpemVcblx0XHRpZiAoIWlzTnVtYmVyKHdpZHRoKSkge1xuXHRcdFx0YmJveCA9IGdyb3VwLmdldEJCb3goKTtcblx0XHRcdHdpZHRoID0gYmJveC53aWR0aDtcblx0XHR9XG5cblx0XHRpZiAoIWlzTnVtYmVyKGhlaWdodCkpIHtcblx0XHRcdC8vIGdldCBiYm94IG9ubHkgaWYgaXQgd2Fzbid0IHNldCBiZWZvcmVcblx0XHRcdGlmICghYmJveCkge1xuXHRcdFx0XHRiYm94ID0gZ3JvdXAuZ2V0QkJveCgpO1xuXHRcdFx0fVxuXG5cdFx0XHRoZWlnaHQgPSBiYm94LmhlaWdodDtcblx0XHR9XG5cblx0XHQvLyBDYWxjdWxhdGUgYW5jaG9yIHBvaW50XG5cdFx0aWYgKCFpc051bWJlcihhbmNob3JYKSkge1xuXHRcdFx0YW5jaG9yWCA9IEFMSUdOX0ZBQ1RPUi5jZW50ZXI7XG5cdFx0fVxuXG5cdFx0aWYgKCFpc051bWJlcihhbmNob3JZKSkge1xuXHRcdFx0YW5jaG9yWSA9IEFMSUdOX0ZBQ1RPUi5jZW50ZXI7XG5cdFx0fVxuXG5cdFx0Ly8gVHJhbnNsYXRlIGdyb3VwIGFjY29yZGluZyB0byBpdHMgZGltZW5zaW9uIGFuZCBhbmNob3IgcG9pbnRcblx0XHR4ID0geCAtIHdpZHRoICogYW5jaG9yWDtcblx0XHR5ID0geSAtIGhlaWdodCAqIGFuY2hvclk7XG5cblx0XHRpZiAoY2hhcnQuYW5pbWF0aW9uICYmIGRlZmluZWQoZ3JvdXAudHJhbnNsYXRlWCkgJiYgZGVmaW5lZChncm91cC50cmFuc2xhdGVZKSkge1xuXHRcdFx0Z3JvdXAuYW5pbWF0ZSh7XG5cdFx0XHRcdHRyYW5zbGF0ZVg6IHgsXG5cdFx0XHRcdHRyYW5zbGF0ZVk6IHlcblx0XHRcdH0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRncm91cC50cmFuc2xhdGUoeCwgeSk7XG5cdFx0fVxuXHR9LFxuXG5cdC8qXG5cdCAqIERlc3Ryb3kgdGhlIGFubm90YXRpb25cblx0ICovXG5cdGRlc3Ryb3k6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgYW5ub3RhdGlvbiA9IHRoaXMsXG5cdFx0XHRjaGFydCA9IHRoaXMuY2hhcnQsXG5cdFx0XHRhbGxJdGVtcyA9IGNoYXJ0LmFubm90YXRpb25zLmFsbEl0ZW1zLFxuXHRcdFx0aW5kZXggPSBhbGxJdGVtcy5pbmRleE9mKGFubm90YXRpb24pO1xuXG5cdFx0aWYgKGluZGV4ID4gLTEpIHtcblx0XHRcdGFsbEl0ZW1zLnNwbGljZShpbmRleCwgMSk7XG5cdFx0fVxuXG5cdFx0ZWFjaChbJ3RpdGxlJywgJ3NoYXBlJywgJ2dyb3VwJ10sIGZ1bmN0aW9uIChlbGVtZW50KSB7XG5cdFx0XHRpZiAoYW5ub3RhdGlvbltlbGVtZW50XSkge1xuXHRcdFx0XHRhbm5vdGF0aW9uW2VsZW1lbnRdLmRlc3Ryb3koKTtcblx0XHRcdFx0YW5ub3RhdGlvbltlbGVtZW50XSA9IG51bGw7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRhbm5vdGF0aW9uLmdyb3VwID0gYW5ub3RhdGlvbi50aXRsZSA9IGFubm90YXRpb24uc2hhcGUgPSBhbm5vdGF0aW9uLmNoYXJ0ID0gYW5ub3RhdGlvbi5vcHRpb25zID0gbnVsbDtcblx0fSxcblxuXHQvKlxuXHQgKiBVcGRhdGUgdGhlIGFubm90YXRpb24gd2l0aCBhIGdpdmVuIG9wdGlvbnNcblx0ICovXG5cdHVwZGF0ZTogZnVuY3Rpb24gKG9wdGlvbnMsIHJlZHJhdykge1xuXHRcdGV4dGVuZCh0aGlzLm9wdGlvbnMsIG9wdGlvbnMpO1xuXG5cdFx0Ly8gdXBkYXRlIGxpbmsgdG8gcG9pbnQgb3Igc2VyaWVzXG5cdFx0dGhpcy5saW5rT2JqZWN0cygpO1xuXG5cdFx0dGhpcy5yZW5kZXIocmVkcmF3KTtcblx0fSxcblxuXHRsaW5rT2JqZWN0czogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBhbm5vdGF0aW9uID0gdGhpcyxcblx0XHRcdGNoYXJ0ID0gYW5ub3RhdGlvbi5jaGFydCxcblx0XHRcdGxpbmtlZFRvID0gYW5ub3RhdGlvbi5saW5rZWRPYmplY3QsXG5cdFx0XHRsaW5rZWRJZCA9IGxpbmtlZFRvICYmIChsaW5rZWRUby5pZCB8fCBsaW5rZWRUby5vcHRpb25zLmlkKSxcblx0XHRcdG9wdGlvbnMgPSBhbm5vdGF0aW9uLm9wdGlvbnMsXG5cdFx0XHRpZCA9IG9wdGlvbnMubGlua2VkVG87XG5cblx0XHRpZiAoIWRlZmluZWQoaWQpKSB7XG5cdFx0XHRhbm5vdGF0aW9uLmxpbmtlZE9iamVjdCA9IG51bGw7XG5cdFx0fSBlbHNlIGlmICghZGVmaW5lZChsaW5rZWRUbykgfHwgaWQgIT09IGxpbmtlZElkKSB7XG5cdFx0XHRhbm5vdGF0aW9uLmxpbmtlZE9iamVjdCA9IGNoYXJ0LmdldChpZCk7XG5cdFx0fVxuXHR9XG59O1xuXG5cbi8vIEFkZCBhbm5vdGF0aW9ucyBtZXRob2RzIHRvIGNoYXJ0IHByb3RvdHlwZVxuZXh0ZW5kKENoYXJ0LnByb3RvdHlwZSwge1xuXHRhbm5vdGF0aW9uczoge1xuXHRcdC8qXG5cdFx0ICogVW5pZmllZCBtZXRob2QgZm9yIGFkZGluZyBhbm5vdGF0aW9ucyB0byB0aGUgY2hhcnRcblx0XHQgKi9cblx0XHRhZGQ6IGZ1bmN0aW9uIChvcHRpb25zLCByZWRyYXcpIHtcblx0XHRcdHZhciBhbm5vdGF0aW9ucyA9IHRoaXMuYWxsSXRlbXMsXG5cdFx0XHRcdGNoYXJ0ID0gdGhpcy5jaGFydCxcblx0XHRcdFx0aXRlbSxcblx0XHRcdFx0bGVuO1xuXG5cdFx0XHRpZiAoIWlzQXJyYXkob3B0aW9ucykpIHtcblx0XHRcdFx0b3B0aW9ucyA9IFtvcHRpb25zXTtcblx0XHRcdH1cblxuXHRcdFx0bGVuID0gb3B0aW9ucy5sZW5ndGg7XG5cblx0XHRcdHdoaWxlIChsZW4tLSkge1xuXHRcdFx0XHRpdGVtID0gbmV3IEFubm90YXRpb24oY2hhcnQsIG9wdGlvbnNbbGVuXSk7XG5cdFx0XHRcdGFubm90YXRpb25zLnB1c2goaXRlbSk7XG5cdFx0XHRcdGl0ZW0ucmVuZGVyKHJlZHJhdyk7XG5cdFx0XHR9XG5cdFx0fSxcblxuXHRcdC8qKlxuXHRcdCAqIFJlZHJhdyBhbGwgYW5ub3RhdGlvbnMsIG1ldGhvZCB1c2VkIGluIGNoYXJ0IGV2ZW50c1xuXHRcdCAqL1xuXHRcdHJlZHJhdzogZnVuY3Rpb24gKCkge1xuXHRcdFx0ZWFjaCh0aGlzLmFsbEl0ZW1zLCBmdW5jdGlvbiAoYW5ub3RhdGlvbikge1xuXHRcdFx0XHRhbm5vdGF0aW9uLnJlZHJhdygpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9XG59KTtcblxuXG4vLyBJbml0aWFsaXplIG9uIGNoYXJ0IGxvYWRcbkNoYXJ0LnByb3RvdHlwZS5jYWxsYmFja3MucHVzaChmdW5jdGlvbiAoY2hhcnQpIHtcblx0dmFyIG9wdGlvbnMgPSBjaGFydC5vcHRpb25zLmFubm90YXRpb25zLFxuXHRcdGdyb3VwO1xuXG5cdGdyb3VwID0gY2hhcnQucmVuZGVyZXIuZyhcImFubm90YXRpb25zXCIpO1xuXHRncm91cC5hdHRyKHtcblx0XHR6SW5kZXg6IDdcblx0fSk7XG5cdGdyb3VwLmFkZCgpO1xuXG5cdC8vIGluaXRpYWxpemUgZW1wdHkgYXJyYXkgZm9yIGFubm90YXRpb25zXG5cdGNoYXJ0LmFubm90YXRpb25zLmFsbEl0ZW1zID0gW107XG5cblx0Ly8gbGluayBjaGFydCBvYmplY3QgdG8gYW5ub3RhdGlvbnNcblx0Y2hhcnQuYW5ub3RhdGlvbnMuY2hhcnQgPSBjaGFydDtcblxuXHQvLyBsaW5rIGFubm90YXRpb25zIGdyb3VwIGVsZW1lbnQgdG8gdGhlIGNoYXJ0XG5cdGNoYXJ0LmFubm90YXRpb25zLmdyb3VwID0gZ3JvdXA7XG5cblx0aWYgKGlzQXJyYXkob3B0aW9ucykgJiYgb3B0aW9ucy5sZW5ndGggPiAwKSB7XG5cdFx0Y2hhcnQuYW5ub3RhdGlvbnMuYWRkKGNoYXJ0Lm9wdGlvbnMuYW5ub3RhdGlvbnMpO1xuXHR9XG5cblx0Ly8gdXBkYXRlIGFubm90YXRpb25zIGFmdGVyIGNoYXJ0IHJlZHJhd1xuXHRIaWdoY2hhcnRzLmFkZEV2ZW50KGNoYXJ0LCAncmVkcmF3JywgZnVuY3Rpb24gKCkge1xuXHRcdGNoYXJ0LmFubm90YXRpb25zLnJlZHJhdygpO1xuXHR9KTtcbn0pO1xufShIaWdoY2hhcnRzLCBIaWdoY2hhcnRzQWRhcHRlcikpO1xuIl0sImZpbGUiOiJwbHVnaW5zL3VlZGl0b3IvdGhpcmQtcGFydHkvaGlnaGNoYXJ0cy9tb2R1bGVzL2Fubm90YXRpb25zLnNyYy5qcyJ9
