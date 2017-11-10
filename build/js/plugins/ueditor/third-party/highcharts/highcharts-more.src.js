// ==ClosureCompiler==
// @compilation_level SIMPLE_OPTIMIZATIONS

/**
 * @license Highcharts JS v3.0.6 (2013-10-04)
 *
 * (c) 2009-2013 Torstein Hønsi
 *
 * License: www.highcharts.com/license
 */

// JSLint options:
/*global Highcharts, HighchartsAdapter, document, window, navigator, setInterval, clearInterval, clearTimeout, setTimeout, location, jQuery, $, console */

(function (Highcharts, UNDEFINED) {
var arrayMin = Highcharts.arrayMin,
	arrayMax = Highcharts.arrayMax,
	each = Highcharts.each,
	extend = Highcharts.extend,
	merge = Highcharts.merge,
	map = Highcharts.map,
	pick = Highcharts.pick,
	pInt = Highcharts.pInt,
	defaultPlotOptions = Highcharts.getOptions().plotOptions,
	seriesTypes = Highcharts.seriesTypes,
	extendClass = Highcharts.extendClass,
	splat = Highcharts.splat,
	wrap = Highcharts.wrap,
	Axis = Highcharts.Axis,
	Tick = Highcharts.Tick,
	Series = Highcharts.Series,
	colProto = seriesTypes.column.prototype,
	math = Math,
	mathRound = math.round,
	mathFloor = math.floor,
	mathMax = math.max,
	noop = function () {};/**
 * The Pane object allows options that are common to a set of X and Y axes.
 * 
 * In the future, this can be extended to basic Highcharts and Highstock.
 */
function Pane(options, chart, firstAxis) {
	this.init.call(this, options, chart, firstAxis);
}

// Extend the Pane prototype
extend(Pane.prototype, {
	
	/**
	 * Initiate the Pane object
	 */
	init: function (options, chart, firstAxis) {
		var pane = this,
			backgroundOption,
			defaultOptions = pane.defaultOptions;
		
		pane.chart = chart;
		
		// Set options
		if (chart.angular) { // gauges
			defaultOptions.background = {}; // gets extended by this.defaultBackgroundOptions
		}
		pane.options = options = merge(defaultOptions, options);
		
		backgroundOption = options.background;
		
		// To avoid having weighty logic to place, update and remove the backgrounds,
		// push them to the first axis' plot bands and borrow the existing logic there.
		if (backgroundOption) {
			each([].concat(splat(backgroundOption)).reverse(), function (config) {
				var backgroundColor = config.backgroundColor; // if defined, replace the old one (specific for gradients)
				config = merge(pane.defaultBackgroundOptions, config);
				if (backgroundColor) {
					config.backgroundColor = backgroundColor;
				}
				config.color = config.backgroundColor; // due to naming in plotBands
				firstAxis.options.plotBands.unshift(config);
			});
		}
	},
	
	/**
	 * The default options object
	 */
	defaultOptions: {
		// background: {conditional},
		center: ['50%', '50%'],
		size: '85%',
		startAngle: 0
		//endAngle: startAngle + 360
	},	
	
	/**
	 * The default background options
	 */
	defaultBackgroundOptions: {
		shape: 'circle',
		borderWidth: 1,
		borderColor: 'silver',
		backgroundColor: {
			linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
			stops: [
				[0, '#FFF'],
				[1, '#DDD']
			]
		},
		from: Number.MIN_VALUE, // corrected to axis min
		innerRadius: 0,
		to: Number.MAX_VALUE, // corrected to axis max
		outerRadius: '105%'
	}
	
});
var axisProto = Axis.prototype,
	tickProto = Tick.prototype;
	
/**
 * Augmented methods for the x axis in order to hide it completely, used for the X axis in gauges
 */
var hiddenAxisMixin = {
	getOffset: noop,
	redraw: function () {
		this.isDirty = false; // prevent setting Y axis dirty
	},
	render: function () {
		this.isDirty = false; // prevent setting Y axis dirty
	},
	setScale: noop,
	setCategories: noop,
	setTitle: noop
};

/**
 * Augmented methods for the value axis
 */
/*jslint unparam: true*/
var radialAxisMixin = {
	isRadial: true,
	
	/**
	 * The default options extend defaultYAxisOptions
	 */
	defaultRadialGaugeOptions: {
		labels: {
			align: 'center',
			x: 0,
			y: null // auto
		},
		minorGridLineWidth: 0,
		minorTickInterval: 'auto',
		minorTickLength: 10,
		minorTickPosition: 'inside',
		minorTickWidth: 1,
		plotBands: [],
		tickLength: 10,
		tickPosition: 'inside',
		tickWidth: 2,
		title: {
			rotation: 0
		},
		zIndex: 2 // behind dials, points in the series group
	},
	
	// Circular axis around the perimeter of a polar chart
	defaultRadialXOptions: {
		gridLineWidth: 1, // spokes
		labels: {
			align: null, // auto
			distance: 15,
			x: 0,
			y: null // auto
		},
		maxPadding: 0,
		minPadding: 0,
		plotBands: [],
		showLastLabel: false, 
		tickLength: 0
	},
	
	// Radial axis, like a spoke in a polar chart
	defaultRadialYOptions: {
		gridLineInterpolation: 'circle',
		labels: {
			align: 'right',
			x: -3,
			y: -2
		},
		plotBands: [],
		showLastLabel: false,
		title: {
			x: 4,
			text: null,
			rotation: 90
		}
	},
	
	/**
	 * Merge and set options
	 */
	setOptions: function (userOptions) {
		
		this.options = merge(
			this.defaultOptions,
			this.defaultRadialOptions,
			userOptions
		);
		
	},
	
	/**
	 * Wrap the getOffset method to return zero offset for title or labels in a radial 
	 * axis
	 */
	getOffset: function () {
		// Call the Axis prototype method (the method we're in now is on the instance)
		axisProto.getOffset.call(this);
		
		// Title or label offsets are not counted
		this.chart.axisOffset[this.side] = 0;
	},


	/**
	 * Get the path for the axis line. This method is also referenced in the getPlotLinePath
	 * method.
	 */
	getLinePath: function (lineWidth, radius) {
		var center = this.center;
		radius = pick(radius, center[2] / 2 - this.offset);
		
		return this.chart.renderer.symbols.arc(
			this.left + center[0],
			this.top + center[1],
			radius,
			radius, 
			{
				start: this.startAngleRad,
				end: this.endAngleRad,
				open: true,
				innerR: 0
			}
		);
	},

	/**
	 * Override setAxisTranslation by setting the translation to the difference
	 * in rotation. This allows the translate method to return angle for 
	 * any given value.
	 */
	setAxisTranslation: function () {
		
		// Call uber method		
		axisProto.setAxisTranslation.call(this);
			
		// Set transA and minPixelPadding
		if (this.center) { // it's not defined the first time
			if (this.isCircular) {
				
				this.transA = (this.endAngleRad - this.startAngleRad) / 
					((this.max - this.min) || 1);
					
				
			} else { 
				this.transA = (this.center[2] / 2) / ((this.max - this.min) || 1);
			}
			
			if (this.isXAxis) {
				this.minPixelPadding = this.transA * this.minPointOffset +
					(this.reversed ? (this.endAngleRad - this.startAngleRad) / 4 : 0); // ???
			}
		}
	},
	
	/**
	 * In case of auto connect, add one closestPointRange to the max value right before
	 * tickPositions are computed, so that ticks will extend passed the real max.
	 */
	beforeSetTickPositions: function () {
		if (this.autoConnect) {
			this.max += (this.categories && 1) || this.pointRange || this.closestPointRange || 0; // #1197, #2260
		}
	},
	
	/**
	 * Override the setAxisSize method to use the arc's circumference as length. This
	 * allows tickPixelInterval to apply to pixel lengths along the perimeter
	 */
	setAxisSize: function () {
		
		axisProto.setAxisSize.call(this);

		if (this.isRadial) {

			// Set the center array
			this.center = this.pane.center = seriesTypes.pie.prototype.getCenter.call(this.pane);
			
			this.len = this.width = this.height = this.isCircular ?
				this.center[2] * (this.endAngleRad - this.startAngleRad) / 2 :
				this.center[2] / 2;
		}
	},
	
	/**
	 * Returns the x, y coordinate of a point given by a value and a pixel distance
	 * from center
	 */
	getPosition: function (value, length) {
		if (!this.isCircular) {
			length = this.translate(value);
			value = this.min;	
		}
		
		return this.postTranslate(
			this.translate(value),
			pick(length, this.center[2] / 2) - this.offset
		);		
	},
	
	/**
	 * Translate from intermediate plotX (angle), plotY (axis.len - radius) to final chart coordinates. 
	 */
	postTranslate: function (angle, radius) {
		
		var chart = this.chart,
			center = this.center;
			
		angle = this.startAngleRad + angle;
		
		return {
			x: chart.plotLeft + center[0] + Math.cos(angle) * radius,
			y: chart.plotTop + center[1] + Math.sin(angle) * radius
		}; 
		
	},
	
	/**
	 * Find the path for plot bands along the radial axis
	 */
	getPlotBandPath: function (from, to, options) {
		var center = this.center,
			startAngleRad = this.startAngleRad,
			fullRadius = center[2] / 2,
			radii = [
				pick(options.outerRadius, '100%'),
				options.innerRadius,
				pick(options.thickness, 10)
			],
			percentRegex = /%$/,
			start,
			end,
			open,
			isCircular = this.isCircular, // X axis in a polar chart
			ret;
			
		// Polygonal plot bands
		if (this.options.gridLineInterpolation === 'polygon') {
			ret = this.getPlotLinePath(from).concat(this.getPlotLinePath(to, true));
		
		// Circular grid bands
		} else {
			
			// Plot bands on Y axis (radial axis) - inner and outer radius depend on to and from
			if (!isCircular) {
				radii[0] = this.translate(from);
				radii[1] = this.translate(to);
			}
			
			// Convert percentages to pixel values
			radii = map(radii, function (radius) {
				if (percentRegex.test(radius)) {
					radius = (pInt(radius, 10) * fullRadius) / 100;
				}
				return radius;
			});
			
			// Handle full circle
			if (options.shape === 'circle' || !isCircular) {
				start = -Math.PI / 2;
				end = Math.PI * 1.5;
				open = true;
			} else {
				start = startAngleRad + this.translate(from);
				end = startAngleRad + this.translate(to);
			}
		
		
			ret = this.chart.renderer.symbols.arc(
				this.left + center[0],
				this.top + center[1],
				radii[0],
				radii[0],
				{
					start: start,
					end: end,
					innerR: pick(radii[1], radii[0] - radii[2]),
					open: open
				}
			);
		}
		 
		return ret;
	},
	
	/**
	 * Find the path for plot lines perpendicular to the radial axis.
	 */
	getPlotLinePath: function (value, reverse) {
		var axis = this,
			center = axis.center,
			chart = axis.chart,
			end = axis.getPosition(value),
			xAxis,
			xy,
			tickPositions,
			ret;
		
		// Spokes
		if (axis.isCircular) {
			ret = ['M', center[0] + chart.plotLeft, center[1] + chart.plotTop, 'L', end.x, end.y];
		
		// Concentric circles			
		} else if (axis.options.gridLineInterpolation === 'circle') {
			value = axis.translate(value);
			if (value) { // a value of 0 is in the center
				ret = axis.getLinePath(0, value);
			}
		// Concentric polygons 
		} else {
			xAxis = chart.xAxis[0];
			ret = [];
			value = axis.translate(value);
			tickPositions = xAxis.tickPositions;
			if (xAxis.autoConnect) {
				tickPositions = tickPositions.concat([tickPositions[0]]);
			}
			// Reverse the positions for concatenation of polygonal plot bands
			if (reverse) {
				tickPositions = [].concat(tickPositions).reverse();
			}
				
			each(tickPositions, function (pos, i) {
				xy = xAxis.getPosition(pos, value);
				ret.push(i ? 'L' : 'M', xy.x, xy.y);
			});
			
		}
		return ret;
	},
	
	/**
	 * Find the position for the axis title, by default inside the gauge
	 */
	getTitlePosition: function () {
		var center = this.center,
			chart = this.chart,
			titleOptions = this.options.title;
		
		return { 
			x: chart.plotLeft + center[0] + (titleOptions.x || 0), 
			y: chart.plotTop + center[1] - ({ high: 0.5, middle: 0.25, low: 0 }[titleOptions.align] * 
				center[2]) + (titleOptions.y || 0)  
		};
	}
	
};
/*jslint unparam: false*/

/**
 * Override axisProto.init to mix in special axis instance functions and function overrides
 */
wrap(axisProto, 'init', function (proceed, chart, userOptions) {
	var axis = this,
		angular = chart.angular,
		polar = chart.polar,
		isX = userOptions.isX,
		isHidden = angular && isX,
		isCircular,
		startAngleRad,
		endAngleRad,
		options,
		chartOptions = chart.options,
		paneIndex = userOptions.pane || 0,
		pane,
		paneOptions;
		
	// Before prototype.init
	if (angular) {
		extend(this, isHidden ? hiddenAxisMixin : radialAxisMixin);
		isCircular =  !isX;
		if (isCircular) {
			this.defaultRadialOptions = this.defaultRadialGaugeOptions;
		}
		
	} else if (polar) {
		//extend(this, userOptions.isX ? radialAxisMixin : radialAxisMixin);
		extend(this, radialAxisMixin);
		isCircular = isX;
		this.defaultRadialOptions = isX ? this.defaultRadialXOptions : merge(this.defaultYAxisOptions, this.defaultRadialYOptions);
		
	}
	
	// Run prototype.init
	proceed.call(this, chart, userOptions);
	
	if (!isHidden && (angular || polar)) {
		options = this.options;
		
		// Create the pane and set the pane options.
		if (!chart.panes) {
			chart.panes = [];
		}
		this.pane = pane = chart.panes[paneIndex] = chart.panes[paneIndex] || new Pane(
			splat(chartOptions.pane)[paneIndex],
			chart,
			axis
		);
		paneOptions = pane.options;
		
			
		// Disable certain features on angular and polar axes
		chart.inverted = false;
		chartOptions.chart.zoomType = null;
		
		// Start and end angle options are
		// given in degrees relative to top, while internal computations are
		// in radians relative to right (like SVG).
		this.startAngleRad = startAngleRad = (paneOptions.startAngle - 90) * Math.PI / 180;
		this.endAngleRad = endAngleRad = (pick(paneOptions.endAngle, paneOptions.startAngle + 360)  - 90) * Math.PI / 180;
		this.offset = options.offset || 0;
		
		this.isCircular = isCircular;
		
		// Automatically connect grid lines?
		if (isCircular && userOptions.max === UNDEFINED && endAngleRad - startAngleRad === 2 * Math.PI) {
			this.autoConnect = true;
		}
	}
	
});

/**
 * Add special cases within the Tick class' methods for radial axes.
 */	
wrap(tickProto, 'getPosition', function (proceed, horiz, pos, tickmarkOffset, old) {
	var axis = this.axis;
	
	return axis.getPosition ? 
		axis.getPosition(pos) :
		proceed.call(this, horiz, pos, tickmarkOffset, old);	
});

/**
 * Wrap the getLabelPosition function to find the center position of the label
 * based on the distance option
 */	
wrap(tickProto, 'getLabelPosition', function (proceed, x, y, label, horiz, labelOptions, tickmarkOffset, index, step) {
	var axis = this.axis,
		optionsY = labelOptions.y,
		ret,
		align = labelOptions.align,
		angle = ((axis.translate(this.pos) + axis.startAngleRad + Math.PI / 2) / Math.PI * 180) % 360;
	
	if (axis.isRadial) {
		ret = axis.getPosition(this.pos, (axis.center[2] / 2) + pick(labelOptions.distance, -25));
		
		// Automatically rotated
		if (labelOptions.rotation === 'auto') {
			label.attr({ 
				rotation: angle
			});
		
		// Vertically centered
		} else if (optionsY === null) {
			optionsY = pInt(label.styles.lineHeight) * 0.9 - label.getBBox().height / 2;
		
		}
		
		// Automatic alignment
		if (align === null) {
			if (axis.isCircular) {
				if (angle > 20 && angle < 160) {
					align = 'left'; // right hemisphere
				} else if (angle > 200 && angle < 340) {
					align = 'right'; // left hemisphere
				} else {
					align = 'center'; // top or bottom
				}
			} else {
				align = 'center';
			}
			label.attr({
				align: align
			});
		}
		
		ret.x += labelOptions.x;
		ret.y += optionsY;
		
	} else {
		ret = proceed.call(this, x, y, label, horiz, labelOptions, tickmarkOffset, index, step);
	}
	return ret;
});

/**
 * Wrap the getMarkPath function to return the path of the radial marker
 */
wrap(tickProto, 'getMarkPath', function (proceed, x, y, tickLength, tickWidth, horiz, renderer) {
	var axis = this.axis,
		endPoint,
		ret;
		
	if (axis.isRadial) {
		endPoint = axis.getPosition(this.pos, axis.center[2] / 2 + tickLength);
		ret = [
			'M',
			x,
			y,
			'L',
			endPoint.x,
			endPoint.y
		];
	} else {
		ret = proceed.call(this, x, y, tickLength, tickWidth, horiz, renderer);
	}
	return ret;
});/* 
 * The AreaRangeSeries class
 * 
 */

/**
 * Extend the default options with map options
 */
defaultPlotOptions.arearange = merge(defaultPlotOptions.area, {
	lineWidth: 1,
	marker: null,
	threshold: null,
	tooltip: {
		pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.low}</b> - <b>{point.high}</b><br/>' 
	},
	trackByArea: true,
	dataLabels: {
		verticalAlign: null,
		xLow: 0,
		xHigh: 0,
		yLow: 0,
		yHigh: 0	
	}
});

/**
 * Add the series type
 */
seriesTypes.arearange = Highcharts.extendClass(seriesTypes.area, {
	type: 'arearange',
	pointArrayMap: ['low', 'high'],
	toYData: function (point) {
		return [point.low, point.high];
	},
	pointValKey: 'low',
	
	/**
	 * Extend getSegments to force null points if the higher value is null. #1703.
	 */
	getSegments: function () {
		var series = this;

		each(series.points, function (point) {
			if (!series.options.connectNulls && (point.low === null || point.high === null)) {
				point.y = null;
			} else if (point.low === null && point.high !== null) {
				point.y = point.high;
			}
		});
		Series.prototype.getSegments.call(this);
	},
	
	/**
	 * Translate data points from raw values x and y to plotX and plotY
	 */
	translate: function () {
		var series = this,
			yAxis = series.yAxis;

		seriesTypes.area.prototype.translate.apply(series);

		// Set plotLow and plotHigh
		each(series.points, function (point) {

			var low = point.low,
				high = point.high,
				plotY = point.plotY;

			if (high === null && low === null) {
				point.y = null;
			} else if (low === null) {
				point.plotLow = point.plotY = null;
				point.plotHigh = yAxis.translate(high, 0, 1, 0, 1);
			} else if (high === null) {
				point.plotLow = plotY;
				point.plotHigh = null;
			} else {
				point.plotLow = plotY;
				point.plotHigh = yAxis.translate(high, 0, 1, 0, 1);
			}
		});
	},
	
	/**
	 * Extend the line series' getSegmentPath method by applying the segment
	 * path to both lower and higher values of the range
	 */
	getSegmentPath: function (segment) {
		
		var lowSegment,
			highSegment = [],
			i = segment.length,
			baseGetSegmentPath = Series.prototype.getSegmentPath,
			point,
			linePath,
			lowerPath,
			options = this.options,
			step = options.step,
			higherPath;
			
		// Remove nulls from low segment
		lowSegment = HighchartsAdapter.grep(segment, function (point) {
			return point.plotLow !== null;
		});
		
		// Make a segment with plotX and plotY for the top values
		while (i--) {
			point = segment[i];
			if (point.plotHigh !== null) {
				highSegment.push({
					plotX: point.plotX,
					plotY: point.plotHigh
				});
			}
		}
		
		// Get the paths
		lowerPath = baseGetSegmentPath.call(this, lowSegment);
		if (step) {
			if (step === true) {
				step = 'left';
			}
			options.step = { left: 'right', center: 'center', right: 'left' }[step]; // swap for reading in getSegmentPath
		}
		higherPath = baseGetSegmentPath.call(this, highSegment);
		options.step = step;
		
		// Create a line on both top and bottom of the range
		linePath = [].concat(lowerPath, higherPath);
		
		// For the area path, we need to change the 'move' statement into 'lineTo' or 'curveTo'
		higherPath[0] = 'L'; // this probably doesn't work for spline			
		this.areaPath = this.areaPath.concat(lowerPath, higherPath);
		
		return linePath;
	},
	
	/**
	 * Extend the basic drawDataLabels method by running it for both lower and higher
	 * values.
	 */
	drawDataLabels: function () {
		
		var data = this.data,
			length = data.length,
			i,
			originalDataLabels = [],
			seriesProto = Series.prototype,
			dataLabelOptions = this.options.dataLabels,
			point,
			inverted = this.chart.inverted;
			
		if (dataLabelOptions.enabled || this._hasPointLabels) {
			
			// Step 1: set preliminary values for plotY and dataLabel and draw the upper labels
			i = length;
			while (i--) {
				point = data[i];
				
				// Set preliminary values
				point.y = point.high;
				point.plotY = point.plotHigh;
				
				// Store original data labels and set preliminary label objects to be picked up 
				// in the uber method
				originalDataLabels[i] = point.dataLabel;
				point.dataLabel = point.dataLabelUpper;
				
				// Set the default offset
				point.below = false;
				if (inverted) {
					dataLabelOptions.align = 'left';
					dataLabelOptions.x = dataLabelOptions.xHigh;								
				} else {
					dataLabelOptions.y = dataLabelOptions.yHigh;
				}
			}
			seriesProto.drawDataLabels.apply(this, arguments); // #1209
			
			// Step 2: reorganize and handle data labels for the lower values
			i = length;
			while (i--) {
				point = data[i];
				
				// Move the generated labels from step 1, and reassign the original data labels
				point.dataLabelUpper = point.dataLabel;
				point.dataLabel = originalDataLabels[i];
				
				// Reset values
				point.y = point.low;
				point.plotY = point.plotLow;
				
				// Set the default offset
				point.below = true;
				if (inverted) {
					dataLabelOptions.align = 'right';
					dataLabelOptions.x = dataLabelOptions.xLow;
				} else {
					dataLabelOptions.y = dataLabelOptions.yLow;
				}
			}
			seriesProto.drawDataLabels.apply(this, arguments);
		}
	
	},
	
	alignDataLabel: seriesTypes.column.prototype.alignDataLabel,
	
	getSymbol: seriesTypes.column.prototype.getSymbol,
	
	drawPoints: noop
});/**
 * The AreaSplineRangeSeries class
 */

defaultPlotOptions.areasplinerange = merge(defaultPlotOptions.arearange);

/**
 * AreaSplineRangeSeries object
 */
seriesTypes.areasplinerange = extendClass(seriesTypes.arearange, {
	type: 'areasplinerange',
	getPointSpline: seriesTypes.spline.prototype.getPointSpline
});/**
 * The ColumnRangeSeries class
 */
defaultPlotOptions.columnrange = merge(defaultPlotOptions.column, defaultPlotOptions.arearange, {
	lineWidth: 1,
	pointRange: null
});

/**
 * ColumnRangeSeries object
 */
seriesTypes.columnrange = extendClass(seriesTypes.arearange, {
	type: 'columnrange',
	/**
	 * Translate data points from raw values x and y to plotX and plotY
	 */
	translate: function () {
		var series = this,
			yAxis = series.yAxis,
			plotHigh;

		colProto.translate.apply(series);

		// Set plotLow and plotHigh
		each(series.points, function (point) {
			var shapeArgs = point.shapeArgs,
				minPointLength = series.options.minPointLength,
				heightDifference,
				height,
				y;

			point.plotHigh = plotHigh = yAxis.translate(point.high, 0, 1, 0, 1);
			point.plotLow = point.plotY;

			// adjust shape
			y = plotHigh;
			height = point.plotY - plotHigh;

			if (height < minPointLength) {
				heightDifference = (minPointLength - height);
				height += heightDifference;
				y -= heightDifference / 2;
			}
			shapeArgs.height = height;
			shapeArgs.y = y;
		});
	},
	trackerGroups: ['group', 'dataLabels'],
	drawGraph: noop,
	pointAttrToOptions: colProto.pointAttrToOptions,
	drawPoints: colProto.drawPoints,
	drawTracker: colProto.drawTracker,
	animate: colProto.animate,
	getColumnMetrics: colProto.getColumnMetrics
});
/* 
 * The GaugeSeries class
 */



/**
 * Extend the default options
 */
defaultPlotOptions.gauge = merge(defaultPlotOptions.line, {
	dataLabels: {
		enabled: true,
		y: 15,
		borderWidth: 1,
		borderColor: 'silver',
		borderRadius: 3,
		style: {
			fontWeight: 'bold'
		},
		verticalAlign: 'top',
		zIndex: 2
	},
	dial: {
		// radius: '80%',
		// backgroundColor: 'black',
		// borderColor: 'silver',
		// borderWidth: 0,
		// baseWidth: 3,
		// topWidth: 1,
		// baseLength: '70%' // of radius
		// rearLength: '10%'
	},
	pivot: {
		//radius: 5,
		//borderWidth: 0
		//borderColor: 'silver',
		//backgroundColor: 'black'
	},
	tooltip: {
		headerFormat: ''
	},
	showInLegend: false
});

/**
 * Extend the point object
 */
var GaugePoint = Highcharts.extendClass(Highcharts.Point, {
	/**
	 * Don't do any hover colors or anything
	 */
	setState: function (state) {
		this.state = state;
	}
});


/**
 * Add the series type
 */
var GaugeSeries = {
	type: 'gauge',
	pointClass: GaugePoint,
	
	// chart.angular will be set to true when a gauge series is present, and this will
	// be used on the axes
	angular: true, 
	drawGraph: noop,
	fixedBox: true,
	trackerGroups: ['group', 'dataLabels'],
	
	/**
	 * Calculate paths etc
	 */
	translate: function () {
		
		var series = this,
			yAxis = series.yAxis,
			options = series.options,
			center = yAxis.center;
			
		series.generatePoints();
		
		each(series.points, function (point) {
			
			var dialOptions = merge(options.dial, point.dial),
				radius = (pInt(pick(dialOptions.radius, 80)) * center[2]) / 200,
				baseLength = (pInt(pick(dialOptions.baseLength, 70)) * radius) / 100,
				rearLength = (pInt(pick(dialOptions.rearLength, 10)) * radius) / 100,
				baseWidth = dialOptions.baseWidth || 3,
				topWidth = dialOptions.topWidth || 1,
				rotation = yAxis.startAngleRad + yAxis.translate(point.y, null, null, null, true);

			// Handle the wrap option
			if (options.wrap === false) {
				rotation = Math.max(yAxis.startAngleRad, Math.min(yAxis.endAngleRad, rotation));
			}
			rotation = rotation * 180 / Math.PI;
				
			point.shapeType = 'path';
			point.shapeArgs = {
				d: dialOptions.path || [
					'M', 
					-rearLength, -baseWidth / 2, 
					'L', 
					baseLength, -baseWidth / 2,
					radius, -topWidth / 2,
					radius, topWidth / 2,
					baseLength, baseWidth / 2,
					-rearLength, baseWidth / 2,
					'z'
				],
				translateX: center[0],
				translateY: center[1],
				rotation: rotation
			};
			
			// Positions for data label
			point.plotX = center[0];
			point.plotY = center[1];
		});
	},
	
	/**
	 * Draw the points where each point is one needle
	 */
	drawPoints: function () {
		
		var series = this,
			center = series.yAxis.center,
			pivot = series.pivot,
			options = series.options,
			pivotOptions = options.pivot,
			renderer = series.chart.renderer;
		
		each(series.points, function (point) {
			
			var graphic = point.graphic,
				shapeArgs = point.shapeArgs,
				d = shapeArgs.d,
				dialOptions = merge(options.dial, point.dial); // #1233
			
			if (graphic) {
				graphic.animate(shapeArgs);
				shapeArgs.d = d; // animate alters it
			} else {
				point.graphic = renderer[point.shapeType](shapeArgs)
					.attr({
						stroke: dialOptions.borderColor || 'none',
						'stroke-width': dialOptions.borderWidth || 0,
						fill: dialOptions.backgroundColor || 'black',
						rotation: shapeArgs.rotation // required by VML when animation is false
					})
					.add(series.group);
			}
		});
		
		// Add or move the pivot
		if (pivot) {
			pivot.animate({ // #1235
				translateX: center[0],
				translateY: center[1]
			});
		} else {
			series.pivot = renderer.circle(0, 0, pick(pivotOptions.radius, 5))
				.attr({
					'stroke-width': pivotOptions.borderWidth || 0,
					stroke: pivotOptions.borderColor || 'silver',
					fill: pivotOptions.backgroundColor || 'black'
				})
				.translate(center[0], center[1])
				.add(series.group);
		}
	},
	
	/**
	 * Animate the arrow up from startAngle
	 */
	animate: function (init) {
		var series = this;

		if (!init) {
			each(series.points, function (point) {
				var graphic = point.graphic;

				if (graphic) {
					// start value
					graphic.attr({
						rotation: series.yAxis.startAngleRad * 180 / Math.PI
					});

					// animate
					graphic.animate({
						rotation: point.shapeArgs.rotation
					}, series.options.animation);
				}
			});

			// delete this function to allow it only once
			series.animate = null;
		}
	},
	
	render: function () {
		this.group = this.plotGroup(
			'group', 
			'series', 
			this.visible ? 'visible' : 'hidden', 
			this.options.zIndex, 
			this.chart.seriesGroup
		);
		seriesTypes.pie.prototype.render.call(this);
		this.group.clip(this.chart.clipRect);
	},
	
	setData: seriesTypes.pie.prototype.setData,
	drawTracker: seriesTypes.column.prototype.drawTracker
};
seriesTypes.gauge = Highcharts.extendClass(seriesTypes.line, GaugeSeries);/* ****************************************************************************
 * Start Box plot series code											      *
 *****************************************************************************/

// Set default options
defaultPlotOptions.boxplot = merge(defaultPlotOptions.column, {
	fillColor: '#FFFFFF',
	lineWidth: 1,
	//medianColor: null,
	medianWidth: 2,
	states: {
		hover: {
			brightness: -0.3
		}
	},
	//stemColor: null,
	//stemDashStyle: 'solid'
	//stemWidth: null,
	threshold: null,
	tooltip: {
		pointFormat: '<span style="color:{series.color};font-weight:bold">{series.name}</span><br/>' +
			'Maximum: {point.high}<br/>' +
			'Upper quartile: {point.q3}<br/>' +
			'Median: {point.median}<br/>' +
			'Lower quartile: {point.q1}<br/>' +
			'Minimum: {point.low}<br/>'
			
	},
	//whiskerColor: null,
	whiskerLength: '50%',
	whiskerWidth: 2
});

// Create the series object
seriesTypes.boxplot = extendClass(seriesTypes.column, {
	type: 'boxplot',
	pointArrayMap: ['low', 'q1', 'median', 'q3', 'high'], // array point configs are mapped to this
	toYData: function (point) { // return a plain array for speedy calculation
		return [point.low, point.q1, point.median, point.q3, point.high];
	},
	pointValKey: 'high', // defines the top of the tracker
	
	/**
	 * One-to-one mapping from options to SVG attributes
	 */
	pointAttrToOptions: { // mapping between SVG attributes and the corresponding options
		fill: 'fillColor',
		stroke: 'color',
		'stroke-width': 'lineWidth'
	},
	
	/**
	 * Disable data labels for box plot
	 */
	drawDataLabels: noop,

	/**
	 * Translate data points from raw values x and y to plotX and plotY
	 */
	translate: function () {
		var series = this,
			yAxis = series.yAxis,
			pointArrayMap = series.pointArrayMap;

		seriesTypes.column.prototype.translate.apply(series);

		// do the translation on each point dimension
		each(series.points, function (point) {
			each(pointArrayMap, function (key) {
				if (point[key] !== null) {
					point[key + 'Plot'] = yAxis.translate(point[key], 0, 1, 0, 1);
				}
			});
		});
	},

	/**
	 * Draw the data points
	 */
	drawPoints: function () {
		var series = this,  //state = series.state,
			points = series.points,
			options = series.options,
			chart = series.chart,
			renderer = chart.renderer,
			pointAttr,
			q1Plot,
			q3Plot,
			highPlot,
			lowPlot,
			medianPlot,
			crispCorr,
			crispX,
			graphic,
			stemPath,
			stemAttr,
			boxPath,
			whiskersPath,
			whiskersAttr,
			medianPath,
			medianAttr,
			width,
			left,
			right,
			halfWidth,
			shapeArgs,
			color,
			doQuartiles = series.doQuartiles !== false, // error bar inherits this series type but doesn't do quartiles
			whiskerLength = parseInt(series.options.whiskerLength, 10) / 100;


		each(points, function (point) {

			graphic = point.graphic;
			shapeArgs = point.shapeArgs; // the box
			stemAttr = {};
			whiskersAttr = {};
			medianAttr = {};
			color = point.color || series.color;
			
			if (point.plotY !== UNDEFINED) {

				pointAttr = point.pointAttr[point.selected ? 'selected' : ''];

				// crisp vector coordinates
				width = shapeArgs.width;
				left = mathFloor(shapeArgs.x);
				right = left + width;
				halfWidth = mathRound(width / 2);
				//crispX = mathRound(left + halfWidth) + crispCorr;
				q1Plot = mathFloor(doQuartiles ? point.q1Plot : point.lowPlot);// + crispCorr;
				q3Plot = mathFloor(doQuartiles ? point.q3Plot : point.lowPlot);// + crispCorr;
				highPlot = mathFloor(point.highPlot);// + crispCorr;
				lowPlot = mathFloor(point.lowPlot);// + crispCorr;
				
				// Stem attributes
				stemAttr.stroke = point.stemColor || options.stemColor || color;
				stemAttr['stroke-width'] = pick(point.stemWidth, options.stemWidth, options.lineWidth);
				stemAttr.dashstyle = point.stemDashStyle || options.stemDashStyle;
				
				// Whiskers attributes
				whiskersAttr.stroke = point.whiskerColor || options.whiskerColor || color;
				whiskersAttr['stroke-width'] = pick(point.whiskerWidth, options.whiskerWidth, options.lineWidth);
				
				// Median attributes
				medianAttr.stroke = point.medianColor || options.medianColor || color;
				medianAttr['stroke-width'] = pick(point.medianWidth, options.medianWidth, options.lineWidth);
				
				
				// The stem
				crispCorr = (stemAttr['stroke-width'] % 2) / 2;
				crispX = left + halfWidth + crispCorr;				
				stemPath = [
					// stem up
					'M',
					crispX, q3Plot,
					'L',
					crispX, highPlot,
					
					// stem down
					'M',
					crispX, q1Plot,
					'L',
					crispX, lowPlot,
					'z'
				];
				
				// The box
				if (doQuartiles) {
					crispCorr = (pointAttr['stroke-width'] % 2) / 2;
					crispX = mathFloor(crispX) + crispCorr;
					q1Plot = mathFloor(q1Plot) + crispCorr;
					q3Plot = mathFloor(q3Plot) + crispCorr;
					left += crispCorr;
					right += crispCorr;
					boxPath = [
						'M',
						left, q3Plot,
						'L',
						left, q1Plot,
						'L',
						right, q1Plot,
						'L',
						right, q3Plot,
						'L',
						left, q3Plot,
						'z'
					];
				}
				
				// The whiskers
				if (whiskerLength) {
					crispCorr = (whiskersAttr['stroke-width'] % 2) / 2;
					highPlot = highPlot + crispCorr;
					lowPlot = lowPlot + crispCorr;
					whiskersPath = [
						// High whisker
						'M',
						crispX - halfWidth * whiskerLength, 
						highPlot,
						'L',
						crispX + halfWidth * whiskerLength, 
						highPlot,
						
						// Low whisker
						'M',
						crispX - halfWidth * whiskerLength, 
						lowPlot,
						'L',
						crispX + halfWidth * whiskerLength, 
						lowPlot
					];
				}
				
				// The median
				crispCorr = (medianAttr['stroke-width'] % 2) / 2;				
				medianPlot = mathRound(point.medianPlot) + crispCorr;
				medianPath = [
					'M',
					left, 
					medianPlot,
					'L',
					right, 
					medianPlot,
					'z'
				];
				
				// Create or update the graphics
				if (graphic) { // update
					
					point.stem.animate({ d: stemPath });
					if (whiskerLength) {
						point.whiskers.animate({ d: whiskersPath });
					}
					if (doQuartiles) {
						point.box.animate({ d: boxPath });
					}
					point.medianShape.animate({ d: medianPath });
					
				} else { // create new
					point.graphic = graphic = renderer.g()
						.add(series.group);
					
					point.stem = renderer.path(stemPath)
						.attr(stemAttr)
						.add(graphic);
						
					if (whiskerLength) {
						point.whiskers = renderer.path(whiskersPath) 
							.attr(whiskersAttr)
							.add(graphic);
					}
					if (doQuartiles) {
						point.box = renderer.path(boxPath)
							.attr(pointAttr)
							.add(graphic);
					}	
					point.medianShape = renderer.path(medianPath)
						.attr(medianAttr)
						.add(graphic);
				}
			}
		});

	}


});

/* ****************************************************************************
 * End Box plot series code												*
 *****************************************************************************/
/* ****************************************************************************
 * Start error bar series code                                                *
 *****************************************************************************/

// 1 - set default options
defaultPlotOptions.errorbar = merge(defaultPlotOptions.boxplot, {
	color: '#000000',
	grouping: false,
	linkedTo: ':previous',
	tooltip: {
		pointFormat: defaultPlotOptions.arearange.tooltip.pointFormat
	},
	whiskerWidth: null
});

// 2 - Create the series object
seriesTypes.errorbar = extendClass(seriesTypes.boxplot, {
	type: 'errorbar',
	pointArrayMap: ['low', 'high'], // array point configs are mapped to this
	toYData: function (point) { // return a plain array for speedy calculation
		return [point.low, point.high];
	},
	pointValKey: 'high', // defines the top of the tracker
	doQuartiles: false,

	/**
	 * Get the width and X offset, either on top of the linked series column
	 * or standalone
	 */
	getColumnMetrics: function () {
		return (this.linkedParent && this.linkedParent.columnMetrics) || 
			seriesTypes.column.prototype.getColumnMetrics.call(this);
	}
});

/* ****************************************************************************
 * End error bar series code                                                  *
 *****************************************************************************/
/* ****************************************************************************
 * Start Waterfall series code                                                *
 *****************************************************************************/

// 1 - set default options
defaultPlotOptions.waterfall = merge(defaultPlotOptions.column, {
	lineWidth: 1,
	lineColor: '#333',
	dashStyle: 'dot',
	borderColor: '#333'
});


// 2 - Create the series object
seriesTypes.waterfall = extendClass(seriesTypes.column, {
	type: 'waterfall',

	upColorProp: 'fill',

	pointArrayMap: ['low', 'y'],

	pointValKey: 'y',

	/**
	 * Init waterfall series, force stacking
	 */
	init: function (chart, options) {
		// force stacking
		options.stacking = true;

		seriesTypes.column.prototype.init.call(this, chart, options);
	},


	/**
	 * Translate data points from raw values
	 */
	translate: function () {
		var series = this,
			options = series.options,
			axis = series.yAxis,
			len,
			i,
			points,
			point,
			shapeArgs,
			stack,
			y,
			previousY,
			stackPoint,
			threshold = options.threshold,
			crispCorr = (options.borderWidth % 2) / 2;

		// run column series translate
		seriesTypes.column.prototype.translate.apply(this);

		previousY = threshold;
		points = series.points;

		for (i = 0, len = points.length; i < len; i++) {
			// cache current point object
			point = points[i];
			shapeArgs = point.shapeArgs;

			// get current stack
			stack = series.getStack(i);
			stackPoint = stack.points[series.index];

			// override point value for sums
			if (isNaN(point.y)) {
				point.y = series.yData[i];
			}

			// up points
			y = mathMax(previousY, previousY + point.y) + stackPoint[0];
			shapeArgs.y = axis.translate(y, 0, 1);


			// sum points
			if (point.isSum || point.isIntermediateSum) {
				shapeArgs.y = axis.translate(stackPoint[1], 0, 1);
				shapeArgs.height = axis.translate(stackPoint[0], 0, 1) - shapeArgs.y;

			// if it's not the sum point, update previous stack end position
			} else {
				previousY += stack.total;
			}

			// negative points
			if (shapeArgs.height < 0) {
				shapeArgs.y += shapeArgs.height;
				shapeArgs.height *= -1;
			}

			point.plotY = shapeArgs.y = mathRound(shapeArgs.y) - crispCorr;
			shapeArgs.height = mathRound(shapeArgs.height);
			point.yBottom = shapeArgs.y + shapeArgs.height;
		}
	},

	/**
	 * Call default processData then override yData to reflect waterfall's extremes on yAxis
	 */
	processData: function (force) {
		var series = this,
			options = series.options,
			yData = series.yData,
			points = series.points,
			point,
			dataLength = yData.length,
			threshold = options.threshold || 0,
			subSum,
			sum,
			dataMin,
			dataMax,
			y,
			i;

		sum = subSum = dataMin = dataMax = threshold;

		for (i = 0; i < dataLength; i++) {
			y = yData[i];
			point = points && points[i] ? points[i] : {};

			if (y === "sum" || point.isSum) {
				yData[i] = sum;
			} else if (y === "intermediateSum" || point.isIntermediateSum) {
				yData[i] = subSum;
				subSum = threshold;
			} else {
				sum += y;
				subSum += y;
			}
			dataMin = Math.min(sum, dataMin);
			dataMax = Math.max(sum, dataMax);
		}

		Series.prototype.processData.call(this, force);

		// Record extremes
		series.dataMin = dataMin;
		series.dataMax = dataMax;
	},

	/**
	 * Return y value or string if point is sum
	 */
	toYData: function (pt) {
		if (pt.isSum) {
			return "sum";
		} else if (pt.isIntermediateSum) {
			return "intermediateSum";
		}

		return pt.y;
	},

	/**
	 * Postprocess mapping between options and SVG attributes
	 */
	getAttribs: function () {
		seriesTypes.column.prototype.getAttribs.apply(this, arguments);

		var series = this,
			options = series.options,
			stateOptions = options.states,
			upColor = options.upColor || series.color,
			hoverColor = Highcharts.Color(upColor).brighten(0.1).get(),
			seriesDownPointAttr = merge(series.pointAttr),
			upColorProp = series.upColorProp;

		seriesDownPointAttr[''][upColorProp] = upColor;
		seriesDownPointAttr.hover[upColorProp] = stateOptions.hover.upColor || hoverColor;
		seriesDownPointAttr.select[upColorProp] = stateOptions.select.upColor || upColor;

		each(series.points, function (point) {
			if (point.y > 0 && !point.color) {
				point.pointAttr = seriesDownPointAttr;
				point.color = upColor;
			}
		});
	},

	/**
	 * Draw columns' connector lines
	 */
	getGraphPath: function () {

		var data = this.data,
			length = data.length,
			lineWidth = this.options.lineWidth + this.options.borderWidth,
			normalizer = mathRound(lineWidth) % 2 / 2,
			path = [],
			M = 'M',
			L = 'L',
			prevArgs,
			pointArgs,
			i,
			d;

		for (i = 1; i < length; i++) {
			pointArgs = data[i].shapeArgs;
			prevArgs = data[i - 1].shapeArgs;

			d = [
				M,
				prevArgs.x + prevArgs.width, prevArgs.y + normalizer,
				L,
				pointArgs.x, prevArgs.y + normalizer
			];

			if (data[i - 1].y < 0) {
				d[2] += prevArgs.height;
				d[5] += prevArgs.height;
			}

			path = path.concat(d);
		}

		return path;
	},

	/**
	 * Extremes are recorded in processData
	 */
	getExtremes: noop,

	/**
	 * Return stack for given index
	 */
	getStack: function (i) {
		var axis = this.yAxis,
			stacks = axis.stacks,
			key = this.stackKey;

		if (this.processedYData[i] < this.options.threshold) {
			key = '-' + key;
		}

		return stacks[key][i];
	},

	drawGraph: Series.prototype.drawGraph
});

/* ****************************************************************************
 * End Waterfall series code                                                  *
 *****************************************************************************/
/* ****************************************************************************
 * Start Bubble series code											          *
 *****************************************************************************/

// 1 - set default options
defaultPlotOptions.bubble = merge(defaultPlotOptions.scatter, {
	dataLabels: {
		inside: true,
		style: {
			color: 'white',
			textShadow: '0px 0px 3px black'
		},
		verticalAlign: 'middle'
	},
	// displayNegative: true,
	marker: {
		// fillOpacity: 0.5,
		lineColor: null, // inherit from series.color
		lineWidth: 1
	},
	minSize: 8,
	maxSize: '20%',
	// negativeColor: null,
	tooltip: {
		pointFormat: '({point.x}, {point.y}), Size: {point.z}'
	},
	turboThreshold: 0,
	zThreshold: 0
});

// 2 - Create the series object
seriesTypes.bubble = extendClass(seriesTypes.scatter, {
	type: 'bubble',
	pointArrayMap: ['y', 'z'],
	trackerGroups: ['group', 'dataLabelsGroup'],
	
	/**
	 * Mapping between SVG attributes and the corresponding options
	 */
	pointAttrToOptions: { 
		stroke: 'lineColor',
		'stroke-width': 'lineWidth',
		fill: 'fillColor'
	},
	
	/**
	 * Apply the fillOpacity to all fill positions
	 */
	applyOpacity: function (fill) {
		var markerOptions = this.options.marker,
			fillOpacity = pick(markerOptions.fillOpacity, 0.5);
		
		// When called from Legend.colorizeItem, the fill isn't predefined
		fill = fill || markerOptions.fillColor || this.color; 
		
		if (fillOpacity !== 1) {
			fill = Highcharts.Color(fill).setOpacity(fillOpacity).get('rgba');
		}
		return fill;
	},
	
	/**
	 * Extend the convertAttribs method by applying opacity to the fill
	 */
	convertAttribs: function () {
		var obj = Series.prototype.convertAttribs.apply(this, arguments);
		
		obj.fill = this.applyOpacity(obj.fill);
		
		return obj;
	},

	/**
	 * Get the radius for each point based on the minSize, maxSize and each point's Z value. This
	 * must be done prior to Series.translate because the axis needs to add padding in 
	 * accordance with the point sizes.
	 */
	getRadii: function (zMin, zMax, minSize, maxSize) {
		var len,
			i,
			pos,
			zData = this.zData,
			radii = [],
			zRange;
		
		// Set the shape type and arguments to be picked up in drawPoints
		for (i = 0, len = zData.length; i < len; i++) {
			zRange = zMax - zMin;
			pos = zRange > 0 ? // relative size, a number between 0 and 1
				(zData[i] - zMin) / (zMax - zMin) : 
				0.5;
			radii.push(math.ceil(minSize + pos * (maxSize - minSize)) / 2);
		}
		this.radii = radii;
	},
	
	/**
	 * Perform animation on the bubbles
	 */
	animate: function (init) {
		var animation = this.options.animation;
		
		if (!init) { // run the animation
			each(this.points, function (point) {
				var graphic = point.graphic,
					shapeArgs = point.shapeArgs;

				if (graphic && shapeArgs) {
					// start values
					graphic.attr('r', 1);

					// animate
					graphic.animate({
						r: shapeArgs.r
					}, animation);
				}
			});

			// delete this function to allow it only once
			this.animate = null;
		}
	},
	
	/**
	 * Extend the base translate method to handle bubble size
	 */
	translate: function () {
		
		var i,
			data = this.data,
			point,
			radius,
			radii = this.radii;
		
		// Run the parent method
		seriesTypes.scatter.prototype.translate.call(this);
		
		// Set the shape type and arguments to be picked up in drawPoints
		i = data.length;
		
		while (i--) {
			point = data[i];
			radius = radii ? radii[i] : 0; // #1737

			// Flag for negativeColor to be applied in Series.js
			point.negative = point.z < (this.options.zThreshold || 0);
			
			if (radius >= this.minPxSize / 2) {
				// Shape arguments
				point.shapeType = 'circle';
				point.shapeArgs = {
					x: point.plotX,
					y: point.plotY,
					r: radius
				};
				
				// Alignment box for the data label
				point.dlBox = {
					x: point.plotX - radius,
					y: point.plotY - radius,
					width: 2 * radius,
					height: 2 * radius
				};
			} else { // below zThreshold
				point.shapeArgs = point.plotY = point.dlBox = UNDEFINED; // #1691
			}
		}
	},
	
	/**
	 * Get the series' symbol in the legend
	 * 
	 * @param {Object} legend The legend object
	 * @param {Object} item The series (this) or point
	 */
	drawLegendSymbol: function (legend, item) {
		var radius = pInt(legend.itemStyle.fontSize) / 2;
		
		item.legendSymbol = this.chart.renderer.circle(
			radius,
			legend.baseline - radius,
			radius
		).attr({
			zIndex: 3
		}).add(item.legendGroup);
		item.legendSymbol.isMarker = true;	
		
	},
	
	drawPoints: seriesTypes.column.prototype.drawPoints,
	alignDataLabel: seriesTypes.column.prototype.alignDataLabel
});

/**
 * Add logic to pad each axis with the amount of pixels
 * necessary to avoid the bubbles to overflow.
 */
Axis.prototype.beforePadding = function () {
	var axis = this,
		axisLength = this.len,
		chart = this.chart,
		pxMin = 0, 
		pxMax = axisLength,
		isXAxis = this.isXAxis,
		dataKey = isXAxis ? 'xData' : 'yData',
		min = this.min,
		extremes = {},
		smallestSize = math.min(chart.plotWidth, chart.plotHeight),
		zMin = Number.MAX_VALUE,
		zMax = -Number.MAX_VALUE,
		range = this.max - min,
		transA = axisLength / range,
		activeSeries = [];

	// Handle padding on the second pass, or on redraw
	if (this.tickPositions) {
		each(this.series, function (series) {

			var seriesOptions = series.options,
				zData;

			if (series.type === 'bubble' && series.visible) {

				// Correction for #1673
				axis.allowZoomOutside = true;

				// Cache it
				activeSeries.push(series);

				if (isXAxis) { // because X axis is evaluated first
				
					// For each series, translate the size extremes to pixel values
					each(['minSize', 'maxSize'], function (prop) {
						var length = seriesOptions[prop],
							isPercent = /%$/.test(length);
						
						length = pInt(length);
						extremes[prop] = isPercent ?
							smallestSize * length / 100 :
							length;
						
					});
					series.minPxSize = extremes.minSize;
					
					// Find the min and max Z
					zData = series.zData;
					if (zData.length) { // #1735
						zMin = math.min(
							zMin,
							math.max(
								arrayMin(zData), 
								seriesOptions.displayNegative === false ? seriesOptions.zThreshold : -Number.MAX_VALUE
							)
						);
						zMax = math.max(zMax, arrayMax(zData));
					}
				}
			}
		});

		each(activeSeries, function (series) {

			var data = series[dataKey],
				i = data.length,
				radius;

			if (isXAxis) {
				series.getRadii(zMin, zMax, extremes.minSize, extremes.maxSize);
			}
			
			if (range > 0) {
				while (i--) {
					radius = series.radii[i];
					pxMin = Math.min(((data[i] - min) * transA) - radius, pxMin);
					pxMax = Math.max(((data[i] - min) * transA) + radius, pxMax);
				}
			}
		});
		
		if (activeSeries.length && range > 0 && pick(this.options.min, this.userMin) === UNDEFINED && pick(this.options.max, this.userMax) === UNDEFINED) {
			pxMax -= axisLength;
			transA *= (axisLength + pxMin - pxMax) / axisLength;
			this.min += pxMin / transA;
			this.max += pxMax / transA;
		}
	}
};

/* ****************************************************************************
 * End Bubble series code                                                     *
 *****************************************************************************/
/**
 * Extensions for polar charts. Additionally, much of the geometry required for polar charts is
 * gathered in RadialAxes.js.
 * 
 */

var seriesProto = Series.prototype,
	pointerProto = Highcharts.Pointer.prototype;



/**
 * Translate a point's plotX and plotY from the internal angle and radius measures to 
 * true plotX, plotY coordinates
 */
seriesProto.toXY = function (point) {
	var xy,
		chart = this.chart,
		plotX = point.plotX,
		plotY = point.plotY;
	
	// Save rectangular plotX, plotY for later computation
	point.rectPlotX = plotX;
	point.rectPlotY = plotY;
	
	// Record the angle in degrees for use in tooltip
	point.clientX = ((plotX / Math.PI * 180) + this.xAxis.pane.options.startAngle) % 360;
	
	// Find the polar plotX and plotY
	xy = this.xAxis.postTranslate(point.plotX, this.yAxis.len - plotY);
	point.plotX = point.polarPlotX = xy.x - chart.plotLeft;
	point.plotY = point.polarPlotY = xy.y - chart.plotTop;
};

/** 
 * Order the tooltip points to get the mouse capture ranges correct. #1915. 
 */
seriesProto.orderTooltipPoints = function (points) {
	if (this.chart.polar) {
		points.sort(function (a, b) {
			return a.clientX - b.clientX;
		});

		// Wrap mouse tracking around to capture movement on the segment to the left
		// of the north point (#1469, #2093).
		if (points[0]) {
			points[0].wrappedClientX = points[0].clientX + 360;
			points.push(points[0]);
		}
	}
};


/**
 * Add some special init logic to areas and areasplines
 */
function initArea(proceed, chart, options) {
	proceed.call(this, chart, options);
	if (this.chart.polar) {
		
		/**
		 * Overridden method to close a segment path. While in a cartesian plane the area 
		 * goes down to the threshold, in the polar chart it goes to the center.
		 */
		this.closeSegment = function (path) {
			var center = this.xAxis.center;
			path.push(
				'L',
				center[0],
				center[1]
			);			
		};
		
		// Instead of complicated logic to draw an area around the inner area in a stack,
		// just draw it behind
		this.closedStacks = true;
	}
}
wrap(seriesTypes.area.prototype, 'init', initArea);
wrap(seriesTypes.areaspline.prototype, 'init', initArea);
		

/**
 * Overridden method for calculating a spline from one point to the next
 */
wrap(seriesTypes.spline.prototype, 'getPointSpline', function (proceed, segment, point, i) {
	
	var ret,
		smoothing = 1.5, // 1 means control points midway between points, 2 means 1/3 from the point, 3 is 1/4 etc;
		denom = smoothing + 1,
		plotX, 
		plotY,
		lastPoint,
		nextPoint,
		lastX,
		lastY,
		nextX,
		nextY,
		leftContX,
		leftContY,
		rightContX,
		rightContY,
		distanceLeftControlPoint,
		distanceRightControlPoint,
		leftContAngle,
		rightContAngle,
		jointAngle;
		
		
	if (this.chart.polar) {
		
		plotX = point.plotX;
		plotY = point.plotY;
		lastPoint = segment[i - 1];
		nextPoint = segment[i + 1];
			
		// Connect ends
		if (this.connectEnds) {
			if (!lastPoint) {
				lastPoint = segment[segment.length - 2]; // not the last but the second last, because the segment is already connected
			}
			if (!nextPoint) {
				nextPoint = segment[1];
			}	
		}

		// find control points
		if (lastPoint && nextPoint) {
		
			lastX = lastPoint.plotX;
			lastY = lastPoint.plotY;
			nextX = nextPoint.plotX;
			nextY = nextPoint.plotY;
			leftContX = (smoothing * plotX + lastX) / denom;
			leftContY = (smoothing * plotY + lastY) / denom;
			rightContX = (smoothing * plotX + nextX) / denom;
			rightContY = (smoothing * plotY + nextY) / denom;
			distanceLeftControlPoint = Math.sqrt(Math.pow(leftContX - plotX, 2) + Math.pow(leftContY - plotY, 2));
			distanceRightControlPoint = Math.sqrt(Math.pow(rightContX - plotX, 2) + Math.pow(rightContY - plotY, 2));
			leftContAngle = Math.atan2(leftContY - plotY, leftContX - plotX);
			rightContAngle = Math.atan2(rightContY - plotY, rightContX - plotX);
			jointAngle = (Math.PI / 2) + ((leftContAngle + rightContAngle) / 2);
				
				
			// Ensure the right direction, jointAngle should be in the same quadrant as leftContAngle
			if (Math.abs(leftContAngle - jointAngle) > Math.PI / 2) {
				jointAngle -= Math.PI;
			}
			
			// Find the corrected control points for a spline straight through the point
			leftContX = plotX + Math.cos(jointAngle) * distanceLeftControlPoint;
			leftContY = plotY + Math.sin(jointAngle) * distanceLeftControlPoint;
			rightContX = plotX + Math.cos(Math.PI + jointAngle) * distanceRightControlPoint;
			rightContY = plotY + Math.sin(Math.PI + jointAngle) * distanceRightControlPoint;
			
			// Record for drawing in next point
			point.rightContX = rightContX;
			point.rightContY = rightContY;

		}
		
		
		// moveTo or lineTo
		if (!i) {
			ret = ['M', plotX, plotY];
		} else { // curve from last point to this
			ret = [
				'C',
				lastPoint.rightContX || lastPoint.plotX,
				lastPoint.rightContY || lastPoint.plotY,
				leftContX || plotX,
				leftContY || plotY,
				plotX,
				plotY
			];
			lastPoint.rightContX = lastPoint.rightContY = null; // reset for updating series later
		}
		
		
	} else {
		ret = proceed.call(this, segment, point, i);
	}
	return ret;
});

/**
 * Extend translate. The plotX and plotY values are computed as if the polar chart were a
 * cartesian plane, where plotX denotes the angle in radians and (yAxis.len - plotY) is the pixel distance from
 * center. 
 */
wrap(seriesProto, 'translate', function (proceed) {
		
	// Run uber method
	proceed.call(this);
	
	// Postprocess plot coordinates
	if (this.chart.polar && !this.preventPostTranslate) {
		var points = this.points,
			i = points.length;
		while (i--) {
			// Translate plotX, plotY from angle and radius to true plot coordinates
			this.toXY(points[i]);
		}
	}
});

/** 
 * Extend getSegmentPath to allow connecting ends across 0 to provide a closed circle in 
 * line-like series.
 */
wrap(seriesProto, 'getSegmentPath', function (proceed, segment) {
		
	var points = this.points;
	
	// Connect the path
	if (this.chart.polar && this.options.connectEnds !== false && 
			segment[segment.length - 1] === points[points.length - 1] && points[0].y !== null) {
		this.connectEnds = true; // re-used in splines
		segment = [].concat(segment, [points[0]]);
	}
	
	// Run uber method
	return proceed.call(this, segment);
	
});


function polarAnimate(proceed, init) {
	var chart = this.chart,
		animation = this.options.animation,
		group = this.group,
		markerGroup = this.markerGroup,
		center = this.xAxis.center,
		plotLeft = chart.plotLeft,
		plotTop = chart.plotTop,
		attribs;

	// Specific animation for polar charts
	if (chart.polar) {
		
		// Enable animation on polar charts only in SVG. In VML, the scaling is different, plus animation
		// would be so slow it would't matter.
		if (chart.renderer.isSVG) {

			if (animation === true) {
				animation = {};
			}
	
			// Initialize the animation
			if (init) {
				
				// Scale down the group and place it in the center
				attribs = {
					translateX: center[0] + plotLeft,
					translateY: center[1] + plotTop,
					scaleX: 0.001, // #1499
					scaleY: 0.001
				};
					
				group.attr(attribs);
				if (markerGroup) {
					markerGroup.attrSetters = group.attrSetters;
					markerGroup.attr(attribs);
				}
				
			// Run the animation
			} else {
				attribs = {
					translateX: plotLeft,
					translateY: plotTop,
					scaleX: 1,
					scaleY: 1
				};
				group.animate(attribs, animation);
				if (markerGroup) {
					markerGroup.animate(attribs, animation);
				}
				
				// Delete this function to allow it only once
				this.animate = null;
			}
		}
	
	// For non-polar charts, revert to the basic animation
	} else {
		proceed.call(this, init);
	} 
}

// Define the animate method for both regular series and column series and their derivatives
wrap(seriesProto, 'animate', polarAnimate);
wrap(colProto, 'animate', polarAnimate);


/**
 * Throw in a couple of properties to let setTooltipPoints know we're indexing the points
 * in degrees (0-360), not plot pixel width.
 */
wrap(seriesProto, 'setTooltipPoints', function (proceed, renew) {
		
	if (this.chart.polar) {
		extend(this.xAxis, {
			tooltipLen: 360 // degrees are the resolution unit of the tooltipPoints array
		});	
	}
	
	// Run uber method
	return proceed.call(this, renew);
});


/**
 * Extend the column prototype's translate method
 */
wrap(colProto, 'translate', function (proceed) {
		
	var xAxis = this.xAxis,
		len = this.yAxis.len,
		center = xAxis.center,
		startAngleRad = xAxis.startAngleRad,
		renderer = this.chart.renderer,
		start,
		points,
		point,
		i;
	
	this.preventPostTranslate = true;
	
	// Run uber method
	proceed.call(this);
	
	// Postprocess plot coordinates
	if (xAxis.isRadial) {
		points = this.points;
		i = points.length;
		while (i--) {
			point = points[i];
			start = point.barX + startAngleRad;
			point.shapeType = 'path';
			point.shapeArgs = {
				d: renderer.symbols.arc(
					center[0],
					center[1],
					len - point.plotY,
					null, 
					{
						start: start,
						end: start + point.pointWidth,
						innerR: len - pick(point.yBottom, len)
					}
				)
			};
			this.toXY(point); // provide correct plotX, plotY for tooltip
		}
	}
});


/**
 * Align column data labels outside the columns. #1199.
 */
wrap(colProto, 'alignDataLabel', function (proceed, point, dataLabel, options, alignTo, isNew) {
	
	if (this.chart.polar) {
		var angle = point.rectPlotX / Math.PI * 180,
			align,
			verticalAlign;
		
		// Align nicely outside the perimeter of the columns
		if (options.align === null) {
			if (angle > 20 && angle < 160) {
				align = 'left'; // right hemisphere
			} else if (angle > 200 && angle < 340) {
				align = 'right'; // left hemisphere
			} else {
				align = 'center'; // top or bottom
			}
			options.align = align;
		}
		if (options.verticalAlign === null) {
			if (angle < 45 || angle > 315) {
				verticalAlign = 'bottom'; // top part
			} else if (angle > 135 && angle < 225) {
				verticalAlign = 'top'; // bottom part
			} else {
				verticalAlign = 'middle'; // left or right
			}
			options.verticalAlign = verticalAlign;
		}
		
		seriesProto.alignDataLabel.call(this, point, dataLabel, options, alignTo, isNew);
	} else {
		proceed.call(this, point, dataLabel, options, alignTo, isNew);
	}
	
});

/**
 * Extend the mouse tracker to return the tooltip position index in terms of
 * degrees rather than pixels
 */
wrap(pointerProto, 'getIndex', function (proceed, e) {
	var ret,
		chart = this.chart,
		center,
		x,
		y;
	
	if (chart.polar) {
		center = chart.xAxis[0].center;
		x = e.chartX - center[0] - chart.plotLeft;
		y = e.chartY - center[1] - chart.plotTop;
		
		ret = 180 - Math.round(Math.atan2(x, y) / Math.PI * 180);
	
	} else {
	
		// Run uber method
		ret = proceed.call(this, e);
	}
	return ret;
});

/**
 * Extend getCoordinates to prepare for polar axis values
 */
wrap(pointerProto, 'getCoordinates', function (proceed, e) {
	var chart = this.chart,
		ret = {
			xAxis: [],
			yAxis: []
		};
	
	if (chart.polar) {	

		each(chart.axes, function (axis) {
			var isXAxis = axis.isXAxis,
				center = axis.center,
				x = e.chartX - center[0] - chart.plotLeft,
				y = e.chartY - center[1] - chart.plotTop;
			
			ret[isXAxis ? 'xAxis' : 'yAxis'].push({
				axis: axis,
				value: axis.translate(
					isXAxis ?
						Math.PI - Math.atan2(x, y) : // angle 
						Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)), // distance from center
					true
				)
			});
		});
		
	} else {
		ret = proceed.call(this, e);
	}
	
	return ret;
});
}(Highcharts));

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvdGhpcmQtcGFydHkvaGlnaGNoYXJ0cy9oaWdoY2hhcnRzLW1vcmUuc3JjLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vID09Q2xvc3VyZUNvbXBpbGVyPT1cbi8vIEBjb21waWxhdGlvbl9sZXZlbCBTSU1QTEVfT1BUSU1JWkFUSU9OU1xuXG4vKipcbiAqIEBsaWNlbnNlIEhpZ2hjaGFydHMgSlMgdjMuMC42ICgyMDEzLTEwLTA0KVxuICpcbiAqIChjKSAyMDA5LTIwMTMgVG9yc3RlaW4gSMO4bnNpXG4gKlxuICogTGljZW5zZTogd3d3LmhpZ2hjaGFydHMuY29tL2xpY2Vuc2VcbiAqL1xuXG4vLyBKU0xpbnQgb3B0aW9uczpcbi8qZ2xvYmFsIEhpZ2hjaGFydHMsIEhpZ2hjaGFydHNBZGFwdGVyLCBkb2N1bWVudCwgd2luZG93LCBuYXZpZ2F0b3IsIHNldEludGVydmFsLCBjbGVhckludGVydmFsLCBjbGVhclRpbWVvdXQsIHNldFRpbWVvdXQsIGxvY2F0aW9uLCBqUXVlcnksICQsIGNvbnNvbGUgKi9cblxuKGZ1bmN0aW9uIChIaWdoY2hhcnRzLCBVTkRFRklORUQpIHtcbnZhciBhcnJheU1pbiA9IEhpZ2hjaGFydHMuYXJyYXlNaW4sXG5cdGFycmF5TWF4ID0gSGlnaGNoYXJ0cy5hcnJheU1heCxcblx0ZWFjaCA9IEhpZ2hjaGFydHMuZWFjaCxcblx0ZXh0ZW5kID0gSGlnaGNoYXJ0cy5leHRlbmQsXG5cdG1lcmdlID0gSGlnaGNoYXJ0cy5tZXJnZSxcblx0bWFwID0gSGlnaGNoYXJ0cy5tYXAsXG5cdHBpY2sgPSBIaWdoY2hhcnRzLnBpY2ssXG5cdHBJbnQgPSBIaWdoY2hhcnRzLnBJbnQsXG5cdGRlZmF1bHRQbG90T3B0aW9ucyA9IEhpZ2hjaGFydHMuZ2V0T3B0aW9ucygpLnBsb3RPcHRpb25zLFxuXHRzZXJpZXNUeXBlcyA9IEhpZ2hjaGFydHMuc2VyaWVzVHlwZXMsXG5cdGV4dGVuZENsYXNzID0gSGlnaGNoYXJ0cy5leHRlbmRDbGFzcyxcblx0c3BsYXQgPSBIaWdoY2hhcnRzLnNwbGF0LFxuXHR3cmFwID0gSGlnaGNoYXJ0cy53cmFwLFxuXHRBeGlzID0gSGlnaGNoYXJ0cy5BeGlzLFxuXHRUaWNrID0gSGlnaGNoYXJ0cy5UaWNrLFxuXHRTZXJpZXMgPSBIaWdoY2hhcnRzLlNlcmllcyxcblx0Y29sUHJvdG8gPSBzZXJpZXNUeXBlcy5jb2x1bW4ucHJvdG90eXBlLFxuXHRtYXRoID0gTWF0aCxcblx0bWF0aFJvdW5kID0gbWF0aC5yb3VuZCxcblx0bWF0aEZsb29yID0gbWF0aC5mbG9vcixcblx0bWF0aE1heCA9IG1hdGgubWF4LFxuXHRub29wID0gZnVuY3Rpb24gKCkge307LyoqXG4gKiBUaGUgUGFuZSBvYmplY3QgYWxsb3dzIG9wdGlvbnMgdGhhdCBhcmUgY29tbW9uIHRvIGEgc2V0IG9mIFggYW5kIFkgYXhlcy5cbiAqIFxuICogSW4gdGhlIGZ1dHVyZSwgdGhpcyBjYW4gYmUgZXh0ZW5kZWQgdG8gYmFzaWMgSGlnaGNoYXJ0cyBhbmQgSGlnaHN0b2NrLlxuICovXG5mdW5jdGlvbiBQYW5lKG9wdGlvbnMsIGNoYXJ0LCBmaXJzdEF4aXMpIHtcblx0dGhpcy5pbml0LmNhbGwodGhpcywgb3B0aW9ucywgY2hhcnQsIGZpcnN0QXhpcyk7XG59XG5cbi8vIEV4dGVuZCB0aGUgUGFuZSBwcm90b3R5cGVcbmV4dGVuZChQYW5lLnByb3RvdHlwZSwge1xuXHRcblx0LyoqXG5cdCAqIEluaXRpYXRlIHRoZSBQYW5lIG9iamVjdFxuXHQgKi9cblx0aW5pdDogZnVuY3Rpb24gKG9wdGlvbnMsIGNoYXJ0LCBmaXJzdEF4aXMpIHtcblx0XHR2YXIgcGFuZSA9IHRoaXMsXG5cdFx0XHRiYWNrZ3JvdW5kT3B0aW9uLFxuXHRcdFx0ZGVmYXVsdE9wdGlvbnMgPSBwYW5lLmRlZmF1bHRPcHRpb25zO1xuXHRcdFxuXHRcdHBhbmUuY2hhcnQgPSBjaGFydDtcblx0XHRcblx0XHQvLyBTZXQgb3B0aW9uc1xuXHRcdGlmIChjaGFydC5hbmd1bGFyKSB7IC8vIGdhdWdlc1xuXHRcdFx0ZGVmYXVsdE9wdGlvbnMuYmFja2dyb3VuZCA9IHt9OyAvLyBnZXRzIGV4dGVuZGVkIGJ5IHRoaXMuZGVmYXVsdEJhY2tncm91bmRPcHRpb25zXG5cdFx0fVxuXHRcdHBhbmUub3B0aW9ucyA9IG9wdGlvbnMgPSBtZXJnZShkZWZhdWx0T3B0aW9ucywgb3B0aW9ucyk7XG5cdFx0XG5cdFx0YmFja2dyb3VuZE9wdGlvbiA9IG9wdGlvbnMuYmFja2dyb3VuZDtcblx0XHRcblx0XHQvLyBUbyBhdm9pZCBoYXZpbmcgd2VpZ2h0eSBsb2dpYyB0byBwbGFjZSwgdXBkYXRlIGFuZCByZW1vdmUgdGhlIGJhY2tncm91bmRzLFxuXHRcdC8vIHB1c2ggdGhlbSB0byB0aGUgZmlyc3QgYXhpcycgcGxvdCBiYW5kcyBhbmQgYm9ycm93IHRoZSBleGlzdGluZyBsb2dpYyB0aGVyZS5cblx0XHRpZiAoYmFja2dyb3VuZE9wdGlvbikge1xuXHRcdFx0ZWFjaChbXS5jb25jYXQoc3BsYXQoYmFja2dyb3VuZE9wdGlvbikpLnJldmVyc2UoKSwgZnVuY3Rpb24gKGNvbmZpZykge1xuXHRcdFx0XHR2YXIgYmFja2dyb3VuZENvbG9yID0gY29uZmlnLmJhY2tncm91bmRDb2xvcjsgLy8gaWYgZGVmaW5lZCwgcmVwbGFjZSB0aGUgb2xkIG9uZSAoc3BlY2lmaWMgZm9yIGdyYWRpZW50cylcblx0XHRcdFx0Y29uZmlnID0gbWVyZ2UocGFuZS5kZWZhdWx0QmFja2dyb3VuZE9wdGlvbnMsIGNvbmZpZyk7XG5cdFx0XHRcdGlmIChiYWNrZ3JvdW5kQ29sb3IpIHtcblx0XHRcdFx0XHRjb25maWcuYmFja2dyb3VuZENvbG9yID0gYmFja2dyb3VuZENvbG9yO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGNvbmZpZy5jb2xvciA9IGNvbmZpZy5iYWNrZ3JvdW5kQ29sb3I7IC8vIGR1ZSB0byBuYW1pbmcgaW4gcGxvdEJhbmRzXG5cdFx0XHRcdGZpcnN0QXhpcy5vcHRpb25zLnBsb3RCYW5kcy51bnNoaWZ0KGNvbmZpZyk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH0sXG5cdFxuXHQvKipcblx0ICogVGhlIGRlZmF1bHQgb3B0aW9ucyBvYmplY3Rcblx0ICovXG5cdGRlZmF1bHRPcHRpb25zOiB7XG5cdFx0Ly8gYmFja2dyb3VuZDoge2NvbmRpdGlvbmFsfSxcblx0XHRjZW50ZXI6IFsnNTAlJywgJzUwJSddLFxuXHRcdHNpemU6ICc4NSUnLFxuXHRcdHN0YXJ0QW5nbGU6IDBcblx0XHQvL2VuZEFuZ2xlOiBzdGFydEFuZ2xlICsgMzYwXG5cdH0sXHRcblx0XG5cdC8qKlxuXHQgKiBUaGUgZGVmYXVsdCBiYWNrZ3JvdW5kIG9wdGlvbnNcblx0ICovXG5cdGRlZmF1bHRCYWNrZ3JvdW5kT3B0aW9uczoge1xuXHRcdHNoYXBlOiAnY2lyY2xlJyxcblx0XHRib3JkZXJXaWR0aDogMSxcblx0XHRib3JkZXJDb2xvcjogJ3NpbHZlcicsXG5cdFx0YmFja2dyb3VuZENvbG9yOiB7XG5cdFx0XHRsaW5lYXJHcmFkaWVudDogeyB4MTogMCwgeTE6IDAsIHgyOiAwLCB5MjogMSB9LFxuXHRcdFx0c3RvcHM6IFtcblx0XHRcdFx0WzAsICcjRkZGJ10sXG5cdFx0XHRcdFsxLCAnI0RERCddXG5cdFx0XHRdXG5cdFx0fSxcblx0XHRmcm9tOiBOdW1iZXIuTUlOX1ZBTFVFLCAvLyBjb3JyZWN0ZWQgdG8gYXhpcyBtaW5cblx0XHRpbm5lclJhZGl1czogMCxcblx0XHR0bzogTnVtYmVyLk1BWF9WQUxVRSwgLy8gY29ycmVjdGVkIHRvIGF4aXMgbWF4XG5cdFx0b3V0ZXJSYWRpdXM6ICcxMDUlJ1xuXHR9XG5cdFxufSk7XG52YXIgYXhpc1Byb3RvID0gQXhpcy5wcm90b3R5cGUsXG5cdHRpY2tQcm90byA9IFRpY2sucHJvdG90eXBlO1xuXHRcbi8qKlxuICogQXVnbWVudGVkIG1ldGhvZHMgZm9yIHRoZSB4IGF4aXMgaW4gb3JkZXIgdG8gaGlkZSBpdCBjb21wbGV0ZWx5LCB1c2VkIGZvciB0aGUgWCBheGlzIGluIGdhdWdlc1xuICovXG52YXIgaGlkZGVuQXhpc01peGluID0ge1xuXHRnZXRPZmZzZXQ6IG5vb3AsXG5cdHJlZHJhdzogZnVuY3Rpb24gKCkge1xuXHRcdHRoaXMuaXNEaXJ0eSA9IGZhbHNlOyAvLyBwcmV2ZW50IHNldHRpbmcgWSBheGlzIGRpcnR5XG5cdH0sXG5cdHJlbmRlcjogZnVuY3Rpb24gKCkge1xuXHRcdHRoaXMuaXNEaXJ0eSA9IGZhbHNlOyAvLyBwcmV2ZW50IHNldHRpbmcgWSBheGlzIGRpcnR5XG5cdH0sXG5cdHNldFNjYWxlOiBub29wLFxuXHRzZXRDYXRlZ29yaWVzOiBub29wLFxuXHRzZXRUaXRsZTogbm9vcFxufTtcblxuLyoqXG4gKiBBdWdtZW50ZWQgbWV0aG9kcyBmb3IgdGhlIHZhbHVlIGF4aXNcbiAqL1xuLypqc2xpbnQgdW5wYXJhbTogdHJ1ZSovXG52YXIgcmFkaWFsQXhpc01peGluID0ge1xuXHRpc1JhZGlhbDogdHJ1ZSxcblx0XG5cdC8qKlxuXHQgKiBUaGUgZGVmYXVsdCBvcHRpb25zIGV4dGVuZCBkZWZhdWx0WUF4aXNPcHRpb25zXG5cdCAqL1xuXHRkZWZhdWx0UmFkaWFsR2F1Z2VPcHRpb25zOiB7XG5cdFx0bGFiZWxzOiB7XG5cdFx0XHRhbGlnbjogJ2NlbnRlcicsXG5cdFx0XHR4OiAwLFxuXHRcdFx0eTogbnVsbCAvLyBhdXRvXG5cdFx0fSxcblx0XHRtaW5vckdyaWRMaW5lV2lkdGg6IDAsXG5cdFx0bWlub3JUaWNrSW50ZXJ2YWw6ICdhdXRvJyxcblx0XHRtaW5vclRpY2tMZW5ndGg6IDEwLFxuXHRcdG1pbm9yVGlja1Bvc2l0aW9uOiAnaW5zaWRlJyxcblx0XHRtaW5vclRpY2tXaWR0aDogMSxcblx0XHRwbG90QmFuZHM6IFtdLFxuXHRcdHRpY2tMZW5ndGg6IDEwLFxuXHRcdHRpY2tQb3NpdGlvbjogJ2luc2lkZScsXG5cdFx0dGlja1dpZHRoOiAyLFxuXHRcdHRpdGxlOiB7XG5cdFx0XHRyb3RhdGlvbjogMFxuXHRcdH0sXG5cdFx0ekluZGV4OiAyIC8vIGJlaGluZCBkaWFscywgcG9pbnRzIGluIHRoZSBzZXJpZXMgZ3JvdXBcblx0fSxcblx0XG5cdC8vIENpcmN1bGFyIGF4aXMgYXJvdW5kIHRoZSBwZXJpbWV0ZXIgb2YgYSBwb2xhciBjaGFydFxuXHRkZWZhdWx0UmFkaWFsWE9wdGlvbnM6IHtcblx0XHRncmlkTGluZVdpZHRoOiAxLCAvLyBzcG9rZXNcblx0XHRsYWJlbHM6IHtcblx0XHRcdGFsaWduOiBudWxsLCAvLyBhdXRvXG5cdFx0XHRkaXN0YW5jZTogMTUsXG5cdFx0XHR4OiAwLFxuXHRcdFx0eTogbnVsbCAvLyBhdXRvXG5cdFx0fSxcblx0XHRtYXhQYWRkaW5nOiAwLFxuXHRcdG1pblBhZGRpbmc6IDAsXG5cdFx0cGxvdEJhbmRzOiBbXSxcblx0XHRzaG93TGFzdExhYmVsOiBmYWxzZSwgXG5cdFx0dGlja0xlbmd0aDogMFxuXHR9LFxuXHRcblx0Ly8gUmFkaWFsIGF4aXMsIGxpa2UgYSBzcG9rZSBpbiBhIHBvbGFyIGNoYXJ0XG5cdGRlZmF1bHRSYWRpYWxZT3B0aW9uczoge1xuXHRcdGdyaWRMaW5lSW50ZXJwb2xhdGlvbjogJ2NpcmNsZScsXG5cdFx0bGFiZWxzOiB7XG5cdFx0XHRhbGlnbjogJ3JpZ2h0Jyxcblx0XHRcdHg6IC0zLFxuXHRcdFx0eTogLTJcblx0XHR9LFxuXHRcdHBsb3RCYW5kczogW10sXG5cdFx0c2hvd0xhc3RMYWJlbDogZmFsc2UsXG5cdFx0dGl0bGU6IHtcblx0XHRcdHg6IDQsXG5cdFx0XHR0ZXh0OiBudWxsLFxuXHRcdFx0cm90YXRpb246IDkwXG5cdFx0fVxuXHR9LFxuXHRcblx0LyoqXG5cdCAqIE1lcmdlIGFuZCBzZXQgb3B0aW9uc1xuXHQgKi9cblx0c2V0T3B0aW9uczogZnVuY3Rpb24gKHVzZXJPcHRpb25zKSB7XG5cdFx0XG5cdFx0dGhpcy5vcHRpb25zID0gbWVyZ2UoXG5cdFx0XHR0aGlzLmRlZmF1bHRPcHRpb25zLFxuXHRcdFx0dGhpcy5kZWZhdWx0UmFkaWFsT3B0aW9ucyxcblx0XHRcdHVzZXJPcHRpb25zXG5cdFx0KTtcblx0XHRcblx0fSxcblx0XG5cdC8qKlxuXHQgKiBXcmFwIHRoZSBnZXRPZmZzZXQgbWV0aG9kIHRvIHJldHVybiB6ZXJvIG9mZnNldCBmb3IgdGl0bGUgb3IgbGFiZWxzIGluIGEgcmFkaWFsIFxuXHQgKiBheGlzXG5cdCAqL1xuXHRnZXRPZmZzZXQ6IGZ1bmN0aW9uICgpIHtcblx0XHQvLyBDYWxsIHRoZSBBeGlzIHByb3RvdHlwZSBtZXRob2QgKHRoZSBtZXRob2Qgd2UncmUgaW4gbm93IGlzIG9uIHRoZSBpbnN0YW5jZSlcblx0XHRheGlzUHJvdG8uZ2V0T2Zmc2V0LmNhbGwodGhpcyk7XG5cdFx0XG5cdFx0Ly8gVGl0bGUgb3IgbGFiZWwgb2Zmc2V0cyBhcmUgbm90IGNvdW50ZWRcblx0XHR0aGlzLmNoYXJ0LmF4aXNPZmZzZXRbdGhpcy5zaWRlXSA9IDA7XG5cdH0sXG5cblxuXHQvKipcblx0ICogR2V0IHRoZSBwYXRoIGZvciB0aGUgYXhpcyBsaW5lLiBUaGlzIG1ldGhvZCBpcyBhbHNvIHJlZmVyZW5jZWQgaW4gdGhlIGdldFBsb3RMaW5lUGF0aFxuXHQgKiBtZXRob2QuXG5cdCAqL1xuXHRnZXRMaW5lUGF0aDogZnVuY3Rpb24gKGxpbmVXaWR0aCwgcmFkaXVzKSB7XG5cdFx0dmFyIGNlbnRlciA9IHRoaXMuY2VudGVyO1xuXHRcdHJhZGl1cyA9IHBpY2socmFkaXVzLCBjZW50ZXJbMl0gLyAyIC0gdGhpcy5vZmZzZXQpO1xuXHRcdFxuXHRcdHJldHVybiB0aGlzLmNoYXJ0LnJlbmRlcmVyLnN5bWJvbHMuYXJjKFxuXHRcdFx0dGhpcy5sZWZ0ICsgY2VudGVyWzBdLFxuXHRcdFx0dGhpcy50b3AgKyBjZW50ZXJbMV0sXG5cdFx0XHRyYWRpdXMsXG5cdFx0XHRyYWRpdXMsIFxuXHRcdFx0e1xuXHRcdFx0XHRzdGFydDogdGhpcy5zdGFydEFuZ2xlUmFkLFxuXHRcdFx0XHRlbmQ6IHRoaXMuZW5kQW5nbGVSYWQsXG5cdFx0XHRcdG9wZW46IHRydWUsXG5cdFx0XHRcdGlubmVyUjogMFxuXHRcdFx0fVxuXHRcdCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIE92ZXJyaWRlIHNldEF4aXNUcmFuc2xhdGlvbiBieSBzZXR0aW5nIHRoZSB0cmFuc2xhdGlvbiB0byB0aGUgZGlmZmVyZW5jZVxuXHQgKiBpbiByb3RhdGlvbi4gVGhpcyBhbGxvd3MgdGhlIHRyYW5zbGF0ZSBtZXRob2QgdG8gcmV0dXJuIGFuZ2xlIGZvciBcblx0ICogYW55IGdpdmVuIHZhbHVlLlxuXHQgKi9cblx0c2V0QXhpc1RyYW5zbGF0aW9uOiBmdW5jdGlvbiAoKSB7XG5cdFx0XG5cdFx0Ly8gQ2FsbCB1YmVyIG1ldGhvZFx0XHRcblx0XHRheGlzUHJvdG8uc2V0QXhpc1RyYW5zbGF0aW9uLmNhbGwodGhpcyk7XG5cdFx0XHRcblx0XHQvLyBTZXQgdHJhbnNBIGFuZCBtaW5QaXhlbFBhZGRpbmdcblx0XHRpZiAodGhpcy5jZW50ZXIpIHsgLy8gaXQncyBub3QgZGVmaW5lZCB0aGUgZmlyc3QgdGltZVxuXHRcdFx0aWYgKHRoaXMuaXNDaXJjdWxhcikge1xuXHRcdFx0XHRcblx0XHRcdFx0dGhpcy50cmFuc0EgPSAodGhpcy5lbmRBbmdsZVJhZCAtIHRoaXMuc3RhcnRBbmdsZVJhZCkgLyBcblx0XHRcdFx0XHQoKHRoaXMubWF4IC0gdGhpcy5taW4pIHx8IDEpO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcblx0XHRcdH0gZWxzZSB7IFxuXHRcdFx0XHR0aGlzLnRyYW5zQSA9ICh0aGlzLmNlbnRlclsyXSAvIDIpIC8gKCh0aGlzLm1heCAtIHRoaXMubWluKSB8fCAxKTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0aWYgKHRoaXMuaXNYQXhpcykge1xuXHRcdFx0XHR0aGlzLm1pblBpeGVsUGFkZGluZyA9IHRoaXMudHJhbnNBICogdGhpcy5taW5Qb2ludE9mZnNldCArXG5cdFx0XHRcdFx0KHRoaXMucmV2ZXJzZWQgPyAodGhpcy5lbmRBbmdsZVJhZCAtIHRoaXMuc3RhcnRBbmdsZVJhZCkgLyA0IDogMCk7IC8vID8/P1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblx0XG5cdC8qKlxuXHQgKiBJbiBjYXNlIG9mIGF1dG8gY29ubmVjdCwgYWRkIG9uZSBjbG9zZXN0UG9pbnRSYW5nZSB0byB0aGUgbWF4IHZhbHVlIHJpZ2h0IGJlZm9yZVxuXHQgKiB0aWNrUG9zaXRpb25zIGFyZSBjb21wdXRlZCwgc28gdGhhdCB0aWNrcyB3aWxsIGV4dGVuZCBwYXNzZWQgdGhlIHJlYWwgbWF4LlxuXHQgKi9cblx0YmVmb3JlU2V0VGlja1Bvc2l0aW9uczogZnVuY3Rpb24gKCkge1xuXHRcdGlmICh0aGlzLmF1dG9Db25uZWN0KSB7XG5cdFx0XHR0aGlzLm1heCArPSAodGhpcy5jYXRlZ29yaWVzICYmIDEpIHx8IHRoaXMucG9pbnRSYW5nZSB8fCB0aGlzLmNsb3Nlc3RQb2ludFJhbmdlIHx8IDA7IC8vICMxMTk3LCAjMjI2MFxuXHRcdH1cblx0fSxcblx0XG5cdC8qKlxuXHQgKiBPdmVycmlkZSB0aGUgc2V0QXhpc1NpemUgbWV0aG9kIHRvIHVzZSB0aGUgYXJjJ3MgY2lyY3VtZmVyZW5jZSBhcyBsZW5ndGguIFRoaXNcblx0ICogYWxsb3dzIHRpY2tQaXhlbEludGVydmFsIHRvIGFwcGx5IHRvIHBpeGVsIGxlbmd0aHMgYWxvbmcgdGhlIHBlcmltZXRlclxuXHQgKi9cblx0c2V0QXhpc1NpemU6IGZ1bmN0aW9uICgpIHtcblx0XHRcblx0XHRheGlzUHJvdG8uc2V0QXhpc1NpemUuY2FsbCh0aGlzKTtcblxuXHRcdGlmICh0aGlzLmlzUmFkaWFsKSB7XG5cblx0XHRcdC8vIFNldCB0aGUgY2VudGVyIGFycmF5XG5cdFx0XHR0aGlzLmNlbnRlciA9IHRoaXMucGFuZS5jZW50ZXIgPSBzZXJpZXNUeXBlcy5waWUucHJvdG90eXBlLmdldENlbnRlci5jYWxsKHRoaXMucGFuZSk7XG5cdFx0XHRcblx0XHRcdHRoaXMubGVuID0gdGhpcy53aWR0aCA9IHRoaXMuaGVpZ2h0ID0gdGhpcy5pc0NpcmN1bGFyID9cblx0XHRcdFx0dGhpcy5jZW50ZXJbMl0gKiAodGhpcy5lbmRBbmdsZVJhZCAtIHRoaXMuc3RhcnRBbmdsZVJhZCkgLyAyIDpcblx0XHRcdFx0dGhpcy5jZW50ZXJbMl0gLyAyO1xuXHRcdH1cblx0fSxcblx0XG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSB4LCB5IGNvb3JkaW5hdGUgb2YgYSBwb2ludCBnaXZlbiBieSBhIHZhbHVlIGFuZCBhIHBpeGVsIGRpc3RhbmNlXG5cdCAqIGZyb20gY2VudGVyXG5cdCAqL1xuXHRnZXRQb3NpdGlvbjogZnVuY3Rpb24gKHZhbHVlLCBsZW5ndGgpIHtcblx0XHRpZiAoIXRoaXMuaXNDaXJjdWxhcikge1xuXHRcdFx0bGVuZ3RoID0gdGhpcy50cmFuc2xhdGUodmFsdWUpO1xuXHRcdFx0dmFsdWUgPSB0aGlzLm1pbjtcdFxuXHRcdH1cblx0XHRcblx0XHRyZXR1cm4gdGhpcy5wb3N0VHJhbnNsYXRlKFxuXHRcdFx0dGhpcy50cmFuc2xhdGUodmFsdWUpLFxuXHRcdFx0cGljayhsZW5ndGgsIHRoaXMuY2VudGVyWzJdIC8gMikgLSB0aGlzLm9mZnNldFxuXHRcdCk7XHRcdFxuXHR9LFxuXHRcblx0LyoqXG5cdCAqIFRyYW5zbGF0ZSBmcm9tIGludGVybWVkaWF0ZSBwbG90WCAoYW5nbGUpLCBwbG90WSAoYXhpcy5sZW4gLSByYWRpdXMpIHRvIGZpbmFsIGNoYXJ0IGNvb3JkaW5hdGVzLiBcblx0ICovXG5cdHBvc3RUcmFuc2xhdGU6IGZ1bmN0aW9uIChhbmdsZSwgcmFkaXVzKSB7XG5cdFx0XG5cdFx0dmFyIGNoYXJ0ID0gdGhpcy5jaGFydCxcblx0XHRcdGNlbnRlciA9IHRoaXMuY2VudGVyO1xuXHRcdFx0XG5cdFx0YW5nbGUgPSB0aGlzLnN0YXJ0QW5nbGVSYWQgKyBhbmdsZTtcblx0XHRcblx0XHRyZXR1cm4ge1xuXHRcdFx0eDogY2hhcnQucGxvdExlZnQgKyBjZW50ZXJbMF0gKyBNYXRoLmNvcyhhbmdsZSkgKiByYWRpdXMsXG5cdFx0XHR5OiBjaGFydC5wbG90VG9wICsgY2VudGVyWzFdICsgTWF0aC5zaW4oYW5nbGUpICogcmFkaXVzXG5cdFx0fTsgXG5cdFx0XG5cdH0sXG5cdFxuXHQvKipcblx0ICogRmluZCB0aGUgcGF0aCBmb3IgcGxvdCBiYW5kcyBhbG9uZyB0aGUgcmFkaWFsIGF4aXNcblx0ICovXG5cdGdldFBsb3RCYW5kUGF0aDogZnVuY3Rpb24gKGZyb20sIHRvLCBvcHRpb25zKSB7XG5cdFx0dmFyIGNlbnRlciA9IHRoaXMuY2VudGVyLFxuXHRcdFx0c3RhcnRBbmdsZVJhZCA9IHRoaXMuc3RhcnRBbmdsZVJhZCxcblx0XHRcdGZ1bGxSYWRpdXMgPSBjZW50ZXJbMl0gLyAyLFxuXHRcdFx0cmFkaWkgPSBbXG5cdFx0XHRcdHBpY2sob3B0aW9ucy5vdXRlclJhZGl1cywgJzEwMCUnKSxcblx0XHRcdFx0b3B0aW9ucy5pbm5lclJhZGl1cyxcblx0XHRcdFx0cGljayhvcHRpb25zLnRoaWNrbmVzcywgMTApXG5cdFx0XHRdLFxuXHRcdFx0cGVyY2VudFJlZ2V4ID0gLyUkLyxcblx0XHRcdHN0YXJ0LFxuXHRcdFx0ZW5kLFxuXHRcdFx0b3Blbixcblx0XHRcdGlzQ2lyY3VsYXIgPSB0aGlzLmlzQ2lyY3VsYXIsIC8vIFggYXhpcyBpbiBhIHBvbGFyIGNoYXJ0XG5cdFx0XHRyZXQ7XG5cdFx0XHRcblx0XHQvLyBQb2x5Z29uYWwgcGxvdCBiYW5kc1xuXHRcdGlmICh0aGlzLm9wdGlvbnMuZ3JpZExpbmVJbnRlcnBvbGF0aW9uID09PSAncG9seWdvbicpIHtcblx0XHRcdHJldCA9IHRoaXMuZ2V0UGxvdExpbmVQYXRoKGZyb20pLmNvbmNhdCh0aGlzLmdldFBsb3RMaW5lUGF0aCh0bywgdHJ1ZSkpO1xuXHRcdFxuXHRcdC8vIENpcmN1bGFyIGdyaWQgYmFuZHNcblx0XHR9IGVsc2Uge1xuXHRcdFx0XG5cdFx0XHQvLyBQbG90IGJhbmRzIG9uIFkgYXhpcyAocmFkaWFsIGF4aXMpIC0gaW5uZXIgYW5kIG91dGVyIHJhZGl1cyBkZXBlbmQgb24gdG8gYW5kIGZyb21cblx0XHRcdGlmICghaXNDaXJjdWxhcikge1xuXHRcdFx0XHRyYWRpaVswXSA9IHRoaXMudHJhbnNsYXRlKGZyb20pO1xuXHRcdFx0XHRyYWRpaVsxXSA9IHRoaXMudHJhbnNsYXRlKHRvKTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0Ly8gQ29udmVydCBwZXJjZW50YWdlcyB0byBwaXhlbCB2YWx1ZXNcblx0XHRcdHJhZGlpID0gbWFwKHJhZGlpLCBmdW5jdGlvbiAocmFkaXVzKSB7XG5cdFx0XHRcdGlmIChwZXJjZW50UmVnZXgudGVzdChyYWRpdXMpKSB7XG5cdFx0XHRcdFx0cmFkaXVzID0gKHBJbnQocmFkaXVzLCAxMCkgKiBmdWxsUmFkaXVzKSAvIDEwMDtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gcmFkaXVzO1xuXHRcdFx0fSk7XG5cdFx0XHRcblx0XHRcdC8vIEhhbmRsZSBmdWxsIGNpcmNsZVxuXHRcdFx0aWYgKG9wdGlvbnMuc2hhcGUgPT09ICdjaXJjbGUnIHx8ICFpc0NpcmN1bGFyKSB7XG5cdFx0XHRcdHN0YXJ0ID0gLU1hdGguUEkgLyAyO1xuXHRcdFx0XHRlbmQgPSBNYXRoLlBJICogMS41O1xuXHRcdFx0XHRvcGVuID0gdHJ1ZTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHN0YXJ0ID0gc3RhcnRBbmdsZVJhZCArIHRoaXMudHJhbnNsYXRlKGZyb20pO1xuXHRcdFx0XHRlbmQgPSBzdGFydEFuZ2xlUmFkICsgdGhpcy50cmFuc2xhdGUodG8pO1xuXHRcdFx0fVxuXHRcdFxuXHRcdFxuXHRcdFx0cmV0ID0gdGhpcy5jaGFydC5yZW5kZXJlci5zeW1ib2xzLmFyYyhcblx0XHRcdFx0dGhpcy5sZWZ0ICsgY2VudGVyWzBdLFxuXHRcdFx0XHR0aGlzLnRvcCArIGNlbnRlclsxXSxcblx0XHRcdFx0cmFkaWlbMF0sXG5cdFx0XHRcdHJhZGlpWzBdLFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0c3RhcnQ6IHN0YXJ0LFxuXHRcdFx0XHRcdGVuZDogZW5kLFxuXHRcdFx0XHRcdGlubmVyUjogcGljayhyYWRpaVsxXSwgcmFkaWlbMF0gLSByYWRpaVsyXSksXG5cdFx0XHRcdFx0b3Blbjogb3BlblxuXHRcdFx0XHR9XG5cdFx0XHQpO1xuXHRcdH1cblx0XHQgXG5cdFx0cmV0dXJuIHJldDtcblx0fSxcblx0XG5cdC8qKlxuXHQgKiBGaW5kIHRoZSBwYXRoIGZvciBwbG90IGxpbmVzIHBlcnBlbmRpY3VsYXIgdG8gdGhlIHJhZGlhbCBheGlzLlxuXHQgKi9cblx0Z2V0UGxvdExpbmVQYXRoOiBmdW5jdGlvbiAodmFsdWUsIHJldmVyc2UpIHtcblx0XHR2YXIgYXhpcyA9IHRoaXMsXG5cdFx0XHRjZW50ZXIgPSBheGlzLmNlbnRlcixcblx0XHRcdGNoYXJ0ID0gYXhpcy5jaGFydCxcblx0XHRcdGVuZCA9IGF4aXMuZ2V0UG9zaXRpb24odmFsdWUpLFxuXHRcdFx0eEF4aXMsXG5cdFx0XHR4eSxcblx0XHRcdHRpY2tQb3NpdGlvbnMsXG5cdFx0XHRyZXQ7XG5cdFx0XG5cdFx0Ly8gU3Bva2VzXG5cdFx0aWYgKGF4aXMuaXNDaXJjdWxhcikge1xuXHRcdFx0cmV0ID0gWydNJywgY2VudGVyWzBdICsgY2hhcnQucGxvdExlZnQsIGNlbnRlclsxXSArIGNoYXJ0LnBsb3RUb3AsICdMJywgZW5kLngsIGVuZC55XTtcblx0XHRcblx0XHQvLyBDb25jZW50cmljIGNpcmNsZXNcdFx0XHRcblx0XHR9IGVsc2UgaWYgKGF4aXMub3B0aW9ucy5ncmlkTGluZUludGVycG9sYXRpb24gPT09ICdjaXJjbGUnKSB7XG5cdFx0XHR2YWx1ZSA9IGF4aXMudHJhbnNsYXRlKHZhbHVlKTtcblx0XHRcdGlmICh2YWx1ZSkgeyAvLyBhIHZhbHVlIG9mIDAgaXMgaW4gdGhlIGNlbnRlclxuXHRcdFx0XHRyZXQgPSBheGlzLmdldExpbmVQYXRoKDAsIHZhbHVlKTtcblx0XHRcdH1cblx0XHQvLyBDb25jZW50cmljIHBvbHlnb25zIFxuXHRcdH0gZWxzZSB7XG5cdFx0XHR4QXhpcyA9IGNoYXJ0LnhBeGlzWzBdO1xuXHRcdFx0cmV0ID0gW107XG5cdFx0XHR2YWx1ZSA9IGF4aXMudHJhbnNsYXRlKHZhbHVlKTtcblx0XHRcdHRpY2tQb3NpdGlvbnMgPSB4QXhpcy50aWNrUG9zaXRpb25zO1xuXHRcdFx0aWYgKHhBeGlzLmF1dG9Db25uZWN0KSB7XG5cdFx0XHRcdHRpY2tQb3NpdGlvbnMgPSB0aWNrUG9zaXRpb25zLmNvbmNhdChbdGlja1Bvc2l0aW9uc1swXV0pO1xuXHRcdFx0fVxuXHRcdFx0Ly8gUmV2ZXJzZSB0aGUgcG9zaXRpb25zIGZvciBjb25jYXRlbmF0aW9uIG9mIHBvbHlnb25hbCBwbG90IGJhbmRzXG5cdFx0XHRpZiAocmV2ZXJzZSkge1xuXHRcdFx0XHR0aWNrUG9zaXRpb25zID0gW10uY29uY2F0KHRpY2tQb3NpdGlvbnMpLnJldmVyc2UoKTtcblx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHRlYWNoKHRpY2tQb3NpdGlvbnMsIGZ1bmN0aW9uIChwb3MsIGkpIHtcblx0XHRcdFx0eHkgPSB4QXhpcy5nZXRQb3NpdGlvbihwb3MsIHZhbHVlKTtcblx0XHRcdFx0cmV0LnB1c2goaSA/ICdMJyA6ICdNJywgeHkueCwgeHkueSk7XG5cdFx0XHR9KTtcblx0XHRcdFxuXHRcdH1cblx0XHRyZXR1cm4gcmV0O1xuXHR9LFxuXHRcblx0LyoqXG5cdCAqIEZpbmQgdGhlIHBvc2l0aW9uIGZvciB0aGUgYXhpcyB0aXRsZSwgYnkgZGVmYXVsdCBpbnNpZGUgdGhlIGdhdWdlXG5cdCAqL1xuXHRnZXRUaXRsZVBvc2l0aW9uOiBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGNlbnRlciA9IHRoaXMuY2VudGVyLFxuXHRcdFx0Y2hhcnQgPSB0aGlzLmNoYXJ0LFxuXHRcdFx0dGl0bGVPcHRpb25zID0gdGhpcy5vcHRpb25zLnRpdGxlO1xuXHRcdFxuXHRcdHJldHVybiB7IFxuXHRcdFx0eDogY2hhcnQucGxvdExlZnQgKyBjZW50ZXJbMF0gKyAodGl0bGVPcHRpb25zLnggfHwgMCksIFxuXHRcdFx0eTogY2hhcnQucGxvdFRvcCArIGNlbnRlclsxXSAtICh7IGhpZ2g6IDAuNSwgbWlkZGxlOiAwLjI1LCBsb3c6IDAgfVt0aXRsZU9wdGlvbnMuYWxpZ25dICogXG5cdFx0XHRcdGNlbnRlclsyXSkgKyAodGl0bGVPcHRpb25zLnkgfHwgMCkgIFxuXHRcdH07XG5cdH1cblx0XG59O1xuLypqc2xpbnQgdW5wYXJhbTogZmFsc2UqL1xuXG4vKipcbiAqIE92ZXJyaWRlIGF4aXNQcm90by5pbml0IHRvIG1peCBpbiBzcGVjaWFsIGF4aXMgaW5zdGFuY2UgZnVuY3Rpb25zIGFuZCBmdW5jdGlvbiBvdmVycmlkZXNcbiAqL1xud3JhcChheGlzUHJvdG8sICdpbml0JywgZnVuY3Rpb24gKHByb2NlZWQsIGNoYXJ0LCB1c2VyT3B0aW9ucykge1xuXHR2YXIgYXhpcyA9IHRoaXMsXG5cdFx0YW5ndWxhciA9IGNoYXJ0LmFuZ3VsYXIsXG5cdFx0cG9sYXIgPSBjaGFydC5wb2xhcixcblx0XHRpc1ggPSB1c2VyT3B0aW9ucy5pc1gsXG5cdFx0aXNIaWRkZW4gPSBhbmd1bGFyICYmIGlzWCxcblx0XHRpc0NpcmN1bGFyLFxuXHRcdHN0YXJ0QW5nbGVSYWQsXG5cdFx0ZW5kQW5nbGVSYWQsXG5cdFx0b3B0aW9ucyxcblx0XHRjaGFydE9wdGlvbnMgPSBjaGFydC5vcHRpb25zLFxuXHRcdHBhbmVJbmRleCA9IHVzZXJPcHRpb25zLnBhbmUgfHwgMCxcblx0XHRwYW5lLFxuXHRcdHBhbmVPcHRpb25zO1xuXHRcdFxuXHQvLyBCZWZvcmUgcHJvdG90eXBlLmluaXRcblx0aWYgKGFuZ3VsYXIpIHtcblx0XHRleHRlbmQodGhpcywgaXNIaWRkZW4gPyBoaWRkZW5BeGlzTWl4aW4gOiByYWRpYWxBeGlzTWl4aW4pO1xuXHRcdGlzQ2lyY3VsYXIgPSAgIWlzWDtcblx0XHRpZiAoaXNDaXJjdWxhcikge1xuXHRcdFx0dGhpcy5kZWZhdWx0UmFkaWFsT3B0aW9ucyA9IHRoaXMuZGVmYXVsdFJhZGlhbEdhdWdlT3B0aW9ucztcblx0XHR9XG5cdFx0XG5cdH0gZWxzZSBpZiAocG9sYXIpIHtcblx0XHQvL2V4dGVuZCh0aGlzLCB1c2VyT3B0aW9ucy5pc1ggPyByYWRpYWxBeGlzTWl4aW4gOiByYWRpYWxBeGlzTWl4aW4pO1xuXHRcdGV4dGVuZCh0aGlzLCByYWRpYWxBeGlzTWl4aW4pO1xuXHRcdGlzQ2lyY3VsYXIgPSBpc1g7XG5cdFx0dGhpcy5kZWZhdWx0UmFkaWFsT3B0aW9ucyA9IGlzWCA/IHRoaXMuZGVmYXVsdFJhZGlhbFhPcHRpb25zIDogbWVyZ2UodGhpcy5kZWZhdWx0WUF4aXNPcHRpb25zLCB0aGlzLmRlZmF1bHRSYWRpYWxZT3B0aW9ucyk7XG5cdFx0XG5cdH1cblx0XG5cdC8vIFJ1biBwcm90b3R5cGUuaW5pdFxuXHRwcm9jZWVkLmNhbGwodGhpcywgY2hhcnQsIHVzZXJPcHRpb25zKTtcblx0XG5cdGlmICghaXNIaWRkZW4gJiYgKGFuZ3VsYXIgfHwgcG9sYXIpKSB7XG5cdFx0b3B0aW9ucyA9IHRoaXMub3B0aW9ucztcblx0XHRcblx0XHQvLyBDcmVhdGUgdGhlIHBhbmUgYW5kIHNldCB0aGUgcGFuZSBvcHRpb25zLlxuXHRcdGlmICghY2hhcnQucGFuZXMpIHtcblx0XHRcdGNoYXJ0LnBhbmVzID0gW107XG5cdFx0fVxuXHRcdHRoaXMucGFuZSA9IHBhbmUgPSBjaGFydC5wYW5lc1twYW5lSW5kZXhdID0gY2hhcnQucGFuZXNbcGFuZUluZGV4XSB8fCBuZXcgUGFuZShcblx0XHRcdHNwbGF0KGNoYXJ0T3B0aW9ucy5wYW5lKVtwYW5lSW5kZXhdLFxuXHRcdFx0Y2hhcnQsXG5cdFx0XHRheGlzXG5cdFx0KTtcblx0XHRwYW5lT3B0aW9ucyA9IHBhbmUub3B0aW9ucztcblx0XHRcblx0XHRcdFxuXHRcdC8vIERpc2FibGUgY2VydGFpbiBmZWF0dXJlcyBvbiBhbmd1bGFyIGFuZCBwb2xhciBheGVzXG5cdFx0Y2hhcnQuaW52ZXJ0ZWQgPSBmYWxzZTtcblx0XHRjaGFydE9wdGlvbnMuY2hhcnQuem9vbVR5cGUgPSBudWxsO1xuXHRcdFxuXHRcdC8vIFN0YXJ0IGFuZCBlbmQgYW5nbGUgb3B0aW9ucyBhcmVcblx0XHQvLyBnaXZlbiBpbiBkZWdyZWVzIHJlbGF0aXZlIHRvIHRvcCwgd2hpbGUgaW50ZXJuYWwgY29tcHV0YXRpb25zIGFyZVxuXHRcdC8vIGluIHJhZGlhbnMgcmVsYXRpdmUgdG8gcmlnaHQgKGxpa2UgU1ZHKS5cblx0XHR0aGlzLnN0YXJ0QW5nbGVSYWQgPSBzdGFydEFuZ2xlUmFkID0gKHBhbmVPcHRpb25zLnN0YXJ0QW5nbGUgLSA5MCkgKiBNYXRoLlBJIC8gMTgwO1xuXHRcdHRoaXMuZW5kQW5nbGVSYWQgPSBlbmRBbmdsZVJhZCA9IChwaWNrKHBhbmVPcHRpb25zLmVuZEFuZ2xlLCBwYW5lT3B0aW9ucy5zdGFydEFuZ2xlICsgMzYwKSAgLSA5MCkgKiBNYXRoLlBJIC8gMTgwO1xuXHRcdHRoaXMub2Zmc2V0ID0gb3B0aW9ucy5vZmZzZXQgfHwgMDtcblx0XHRcblx0XHR0aGlzLmlzQ2lyY3VsYXIgPSBpc0NpcmN1bGFyO1xuXHRcdFxuXHRcdC8vIEF1dG9tYXRpY2FsbHkgY29ubmVjdCBncmlkIGxpbmVzP1xuXHRcdGlmIChpc0NpcmN1bGFyICYmIHVzZXJPcHRpb25zLm1heCA9PT0gVU5ERUZJTkVEICYmIGVuZEFuZ2xlUmFkIC0gc3RhcnRBbmdsZVJhZCA9PT0gMiAqIE1hdGguUEkpIHtcblx0XHRcdHRoaXMuYXV0b0Nvbm5lY3QgPSB0cnVlO1xuXHRcdH1cblx0fVxuXHRcbn0pO1xuXG4vKipcbiAqIEFkZCBzcGVjaWFsIGNhc2VzIHdpdGhpbiB0aGUgVGljayBjbGFzcycgbWV0aG9kcyBmb3IgcmFkaWFsIGF4ZXMuXG4gKi9cdFxud3JhcCh0aWNrUHJvdG8sICdnZXRQb3NpdGlvbicsIGZ1bmN0aW9uIChwcm9jZWVkLCBob3JpeiwgcG9zLCB0aWNrbWFya09mZnNldCwgb2xkKSB7XG5cdHZhciBheGlzID0gdGhpcy5heGlzO1xuXHRcblx0cmV0dXJuIGF4aXMuZ2V0UG9zaXRpb24gPyBcblx0XHRheGlzLmdldFBvc2l0aW9uKHBvcykgOlxuXHRcdHByb2NlZWQuY2FsbCh0aGlzLCBob3JpeiwgcG9zLCB0aWNrbWFya09mZnNldCwgb2xkKTtcdFxufSk7XG5cbi8qKlxuICogV3JhcCB0aGUgZ2V0TGFiZWxQb3NpdGlvbiBmdW5jdGlvbiB0byBmaW5kIHRoZSBjZW50ZXIgcG9zaXRpb24gb2YgdGhlIGxhYmVsXG4gKiBiYXNlZCBvbiB0aGUgZGlzdGFuY2Ugb3B0aW9uXG4gKi9cdFxud3JhcCh0aWNrUHJvdG8sICdnZXRMYWJlbFBvc2l0aW9uJywgZnVuY3Rpb24gKHByb2NlZWQsIHgsIHksIGxhYmVsLCBob3JpeiwgbGFiZWxPcHRpb25zLCB0aWNrbWFya09mZnNldCwgaW5kZXgsIHN0ZXApIHtcblx0dmFyIGF4aXMgPSB0aGlzLmF4aXMsXG5cdFx0b3B0aW9uc1kgPSBsYWJlbE9wdGlvbnMueSxcblx0XHRyZXQsXG5cdFx0YWxpZ24gPSBsYWJlbE9wdGlvbnMuYWxpZ24sXG5cdFx0YW5nbGUgPSAoKGF4aXMudHJhbnNsYXRlKHRoaXMucG9zKSArIGF4aXMuc3RhcnRBbmdsZVJhZCArIE1hdGguUEkgLyAyKSAvIE1hdGguUEkgKiAxODApICUgMzYwO1xuXHRcblx0aWYgKGF4aXMuaXNSYWRpYWwpIHtcblx0XHRyZXQgPSBheGlzLmdldFBvc2l0aW9uKHRoaXMucG9zLCAoYXhpcy5jZW50ZXJbMl0gLyAyKSArIHBpY2sobGFiZWxPcHRpb25zLmRpc3RhbmNlLCAtMjUpKTtcblx0XHRcblx0XHQvLyBBdXRvbWF0aWNhbGx5IHJvdGF0ZWRcblx0XHRpZiAobGFiZWxPcHRpb25zLnJvdGF0aW9uID09PSAnYXV0bycpIHtcblx0XHRcdGxhYmVsLmF0dHIoeyBcblx0XHRcdFx0cm90YXRpb246IGFuZ2xlXG5cdFx0XHR9KTtcblx0XHRcblx0XHQvLyBWZXJ0aWNhbGx5IGNlbnRlcmVkXG5cdFx0fSBlbHNlIGlmIChvcHRpb25zWSA9PT0gbnVsbCkge1xuXHRcdFx0b3B0aW9uc1kgPSBwSW50KGxhYmVsLnN0eWxlcy5saW5lSGVpZ2h0KSAqIDAuOSAtIGxhYmVsLmdldEJCb3goKS5oZWlnaHQgLyAyO1xuXHRcdFxuXHRcdH1cblx0XHRcblx0XHQvLyBBdXRvbWF0aWMgYWxpZ25tZW50XG5cdFx0aWYgKGFsaWduID09PSBudWxsKSB7XG5cdFx0XHRpZiAoYXhpcy5pc0NpcmN1bGFyKSB7XG5cdFx0XHRcdGlmIChhbmdsZSA+IDIwICYmIGFuZ2xlIDwgMTYwKSB7XG5cdFx0XHRcdFx0YWxpZ24gPSAnbGVmdCc7IC8vIHJpZ2h0IGhlbWlzcGhlcmVcblx0XHRcdFx0fSBlbHNlIGlmIChhbmdsZSA+IDIwMCAmJiBhbmdsZSA8IDM0MCkge1xuXHRcdFx0XHRcdGFsaWduID0gJ3JpZ2h0JzsgLy8gbGVmdCBoZW1pc3BoZXJlXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0YWxpZ24gPSAnY2VudGVyJzsgLy8gdG9wIG9yIGJvdHRvbVxuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRhbGlnbiA9ICdjZW50ZXInO1xuXHRcdFx0fVxuXHRcdFx0bGFiZWwuYXR0cih7XG5cdFx0XHRcdGFsaWduOiBhbGlnblxuXHRcdFx0fSk7XG5cdFx0fVxuXHRcdFxuXHRcdHJldC54ICs9IGxhYmVsT3B0aW9ucy54O1xuXHRcdHJldC55ICs9IG9wdGlvbnNZO1xuXHRcdFxuXHR9IGVsc2Uge1xuXHRcdHJldCA9IHByb2NlZWQuY2FsbCh0aGlzLCB4LCB5LCBsYWJlbCwgaG9yaXosIGxhYmVsT3B0aW9ucywgdGlja21hcmtPZmZzZXQsIGluZGV4LCBzdGVwKTtcblx0fVxuXHRyZXR1cm4gcmV0O1xufSk7XG5cbi8qKlxuICogV3JhcCB0aGUgZ2V0TWFya1BhdGggZnVuY3Rpb24gdG8gcmV0dXJuIHRoZSBwYXRoIG9mIHRoZSByYWRpYWwgbWFya2VyXG4gKi9cbndyYXAodGlja1Byb3RvLCAnZ2V0TWFya1BhdGgnLCBmdW5jdGlvbiAocHJvY2VlZCwgeCwgeSwgdGlja0xlbmd0aCwgdGlja1dpZHRoLCBob3JpeiwgcmVuZGVyZXIpIHtcblx0dmFyIGF4aXMgPSB0aGlzLmF4aXMsXG5cdFx0ZW5kUG9pbnQsXG5cdFx0cmV0O1xuXHRcdFxuXHRpZiAoYXhpcy5pc1JhZGlhbCkge1xuXHRcdGVuZFBvaW50ID0gYXhpcy5nZXRQb3NpdGlvbih0aGlzLnBvcywgYXhpcy5jZW50ZXJbMl0gLyAyICsgdGlja0xlbmd0aCk7XG5cdFx0cmV0ID0gW1xuXHRcdFx0J00nLFxuXHRcdFx0eCxcblx0XHRcdHksXG5cdFx0XHQnTCcsXG5cdFx0XHRlbmRQb2ludC54LFxuXHRcdFx0ZW5kUG9pbnQueVxuXHRcdF07XG5cdH0gZWxzZSB7XG5cdFx0cmV0ID0gcHJvY2VlZC5jYWxsKHRoaXMsIHgsIHksIHRpY2tMZW5ndGgsIHRpY2tXaWR0aCwgaG9yaXosIHJlbmRlcmVyKTtcblx0fVxuXHRyZXR1cm4gcmV0O1xufSk7LyogXG4gKiBUaGUgQXJlYVJhbmdlU2VyaWVzIGNsYXNzXG4gKiBcbiAqL1xuXG4vKipcbiAqIEV4dGVuZCB0aGUgZGVmYXVsdCBvcHRpb25zIHdpdGggbWFwIG9wdGlvbnNcbiAqL1xuZGVmYXVsdFBsb3RPcHRpb25zLmFyZWFyYW5nZSA9IG1lcmdlKGRlZmF1bHRQbG90T3B0aW9ucy5hcmVhLCB7XG5cdGxpbmVXaWR0aDogMSxcblx0bWFya2VyOiBudWxsLFxuXHR0aHJlc2hvbGQ6IG51bGwsXG5cdHRvb2x0aXA6IHtcblx0XHRwb2ludEZvcm1hdDogJzxzcGFuIHN0eWxlPVwiY29sb3I6e3Nlcmllcy5jb2xvcn1cIj57c2VyaWVzLm5hbWV9PC9zcGFuPjogPGI+e3BvaW50Lmxvd308L2I+IC0gPGI+e3BvaW50LmhpZ2h9PC9iPjxici8+JyBcblx0fSxcblx0dHJhY2tCeUFyZWE6IHRydWUsXG5cdGRhdGFMYWJlbHM6IHtcblx0XHR2ZXJ0aWNhbEFsaWduOiBudWxsLFxuXHRcdHhMb3c6IDAsXG5cdFx0eEhpZ2g6IDAsXG5cdFx0eUxvdzogMCxcblx0XHR5SGlnaDogMFx0XG5cdH1cbn0pO1xuXG4vKipcbiAqIEFkZCB0aGUgc2VyaWVzIHR5cGVcbiAqL1xuc2VyaWVzVHlwZXMuYXJlYXJhbmdlID0gSGlnaGNoYXJ0cy5leHRlbmRDbGFzcyhzZXJpZXNUeXBlcy5hcmVhLCB7XG5cdHR5cGU6ICdhcmVhcmFuZ2UnLFxuXHRwb2ludEFycmF5TWFwOiBbJ2xvdycsICdoaWdoJ10sXG5cdHRvWURhdGE6IGZ1bmN0aW9uIChwb2ludCkge1xuXHRcdHJldHVybiBbcG9pbnQubG93LCBwb2ludC5oaWdoXTtcblx0fSxcblx0cG9pbnRWYWxLZXk6ICdsb3cnLFxuXHRcblx0LyoqXG5cdCAqIEV4dGVuZCBnZXRTZWdtZW50cyB0byBmb3JjZSBudWxsIHBvaW50cyBpZiB0aGUgaGlnaGVyIHZhbHVlIGlzIG51bGwuICMxNzAzLlxuXHQgKi9cblx0Z2V0U2VnbWVudHM6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgc2VyaWVzID0gdGhpcztcblxuXHRcdGVhY2goc2VyaWVzLnBvaW50cywgZnVuY3Rpb24gKHBvaW50KSB7XG5cdFx0XHRpZiAoIXNlcmllcy5vcHRpb25zLmNvbm5lY3ROdWxscyAmJiAocG9pbnQubG93ID09PSBudWxsIHx8IHBvaW50LmhpZ2ggPT09IG51bGwpKSB7XG5cdFx0XHRcdHBvaW50LnkgPSBudWxsO1xuXHRcdFx0fSBlbHNlIGlmIChwb2ludC5sb3cgPT09IG51bGwgJiYgcG9pbnQuaGlnaCAhPT0gbnVsbCkge1xuXHRcdFx0XHRwb2ludC55ID0gcG9pbnQuaGlnaDtcblx0XHRcdH1cblx0XHR9KTtcblx0XHRTZXJpZXMucHJvdG90eXBlLmdldFNlZ21lbnRzLmNhbGwodGhpcyk7XG5cdH0sXG5cdFxuXHQvKipcblx0ICogVHJhbnNsYXRlIGRhdGEgcG9pbnRzIGZyb20gcmF3IHZhbHVlcyB4IGFuZCB5IHRvIHBsb3RYIGFuZCBwbG90WVxuXHQgKi9cblx0dHJhbnNsYXRlOiBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIHNlcmllcyA9IHRoaXMsXG5cdFx0XHR5QXhpcyA9IHNlcmllcy55QXhpcztcblxuXHRcdHNlcmllc1R5cGVzLmFyZWEucHJvdG90eXBlLnRyYW5zbGF0ZS5hcHBseShzZXJpZXMpO1xuXG5cdFx0Ly8gU2V0IHBsb3RMb3cgYW5kIHBsb3RIaWdoXG5cdFx0ZWFjaChzZXJpZXMucG9pbnRzLCBmdW5jdGlvbiAocG9pbnQpIHtcblxuXHRcdFx0dmFyIGxvdyA9IHBvaW50Lmxvdyxcblx0XHRcdFx0aGlnaCA9IHBvaW50LmhpZ2gsXG5cdFx0XHRcdHBsb3RZID0gcG9pbnQucGxvdFk7XG5cblx0XHRcdGlmIChoaWdoID09PSBudWxsICYmIGxvdyA9PT0gbnVsbCkge1xuXHRcdFx0XHRwb2ludC55ID0gbnVsbDtcblx0XHRcdH0gZWxzZSBpZiAobG93ID09PSBudWxsKSB7XG5cdFx0XHRcdHBvaW50LnBsb3RMb3cgPSBwb2ludC5wbG90WSA9IG51bGw7XG5cdFx0XHRcdHBvaW50LnBsb3RIaWdoID0geUF4aXMudHJhbnNsYXRlKGhpZ2gsIDAsIDEsIDAsIDEpO1xuXHRcdFx0fSBlbHNlIGlmIChoaWdoID09PSBudWxsKSB7XG5cdFx0XHRcdHBvaW50LnBsb3RMb3cgPSBwbG90WTtcblx0XHRcdFx0cG9pbnQucGxvdEhpZ2ggPSBudWxsO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cG9pbnQucGxvdExvdyA9IHBsb3RZO1xuXHRcdFx0XHRwb2ludC5wbG90SGlnaCA9IHlBeGlzLnRyYW5zbGF0ZShoaWdoLCAwLCAxLCAwLCAxKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fSxcblx0XG5cdC8qKlxuXHQgKiBFeHRlbmQgdGhlIGxpbmUgc2VyaWVzJyBnZXRTZWdtZW50UGF0aCBtZXRob2QgYnkgYXBwbHlpbmcgdGhlIHNlZ21lbnRcblx0ICogcGF0aCB0byBib3RoIGxvd2VyIGFuZCBoaWdoZXIgdmFsdWVzIG9mIHRoZSByYW5nZVxuXHQgKi9cblx0Z2V0U2VnbWVudFBhdGg6IGZ1bmN0aW9uIChzZWdtZW50KSB7XG5cdFx0XG5cdFx0dmFyIGxvd1NlZ21lbnQsXG5cdFx0XHRoaWdoU2VnbWVudCA9IFtdLFxuXHRcdFx0aSA9IHNlZ21lbnQubGVuZ3RoLFxuXHRcdFx0YmFzZUdldFNlZ21lbnRQYXRoID0gU2VyaWVzLnByb3RvdHlwZS5nZXRTZWdtZW50UGF0aCxcblx0XHRcdHBvaW50LFxuXHRcdFx0bGluZVBhdGgsXG5cdFx0XHRsb3dlclBhdGgsXG5cdFx0XHRvcHRpb25zID0gdGhpcy5vcHRpb25zLFxuXHRcdFx0c3RlcCA9IG9wdGlvbnMuc3RlcCxcblx0XHRcdGhpZ2hlclBhdGg7XG5cdFx0XHRcblx0XHQvLyBSZW1vdmUgbnVsbHMgZnJvbSBsb3cgc2VnbWVudFxuXHRcdGxvd1NlZ21lbnQgPSBIaWdoY2hhcnRzQWRhcHRlci5ncmVwKHNlZ21lbnQsIGZ1bmN0aW9uIChwb2ludCkge1xuXHRcdFx0cmV0dXJuIHBvaW50LnBsb3RMb3cgIT09IG51bGw7XG5cdFx0fSk7XG5cdFx0XG5cdFx0Ly8gTWFrZSBhIHNlZ21lbnQgd2l0aCBwbG90WCBhbmQgcGxvdFkgZm9yIHRoZSB0b3AgdmFsdWVzXG5cdFx0d2hpbGUgKGktLSkge1xuXHRcdFx0cG9pbnQgPSBzZWdtZW50W2ldO1xuXHRcdFx0aWYgKHBvaW50LnBsb3RIaWdoICE9PSBudWxsKSB7XG5cdFx0XHRcdGhpZ2hTZWdtZW50LnB1c2goe1xuXHRcdFx0XHRcdHBsb3RYOiBwb2ludC5wbG90WCxcblx0XHRcdFx0XHRwbG90WTogcG9pbnQucGxvdEhpZ2hcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdFxuXHRcdC8vIEdldCB0aGUgcGF0aHNcblx0XHRsb3dlclBhdGggPSBiYXNlR2V0U2VnbWVudFBhdGguY2FsbCh0aGlzLCBsb3dTZWdtZW50KTtcblx0XHRpZiAoc3RlcCkge1xuXHRcdFx0aWYgKHN0ZXAgPT09IHRydWUpIHtcblx0XHRcdFx0c3RlcCA9ICdsZWZ0Jztcblx0XHRcdH1cblx0XHRcdG9wdGlvbnMuc3RlcCA9IHsgbGVmdDogJ3JpZ2h0JywgY2VudGVyOiAnY2VudGVyJywgcmlnaHQ6ICdsZWZ0JyB9W3N0ZXBdOyAvLyBzd2FwIGZvciByZWFkaW5nIGluIGdldFNlZ21lbnRQYXRoXG5cdFx0fVxuXHRcdGhpZ2hlclBhdGggPSBiYXNlR2V0U2VnbWVudFBhdGguY2FsbCh0aGlzLCBoaWdoU2VnbWVudCk7XG5cdFx0b3B0aW9ucy5zdGVwID0gc3RlcDtcblx0XHRcblx0XHQvLyBDcmVhdGUgYSBsaW5lIG9uIGJvdGggdG9wIGFuZCBib3R0b20gb2YgdGhlIHJhbmdlXG5cdFx0bGluZVBhdGggPSBbXS5jb25jYXQobG93ZXJQYXRoLCBoaWdoZXJQYXRoKTtcblx0XHRcblx0XHQvLyBGb3IgdGhlIGFyZWEgcGF0aCwgd2UgbmVlZCB0byBjaGFuZ2UgdGhlICdtb3ZlJyBzdGF0ZW1lbnQgaW50byAnbGluZVRvJyBvciAnY3VydmVUbydcblx0XHRoaWdoZXJQYXRoWzBdID0gJ0wnOyAvLyB0aGlzIHByb2JhYmx5IGRvZXNuJ3Qgd29yayBmb3Igc3BsaW5lXHRcdFx0XG5cdFx0dGhpcy5hcmVhUGF0aCA9IHRoaXMuYXJlYVBhdGguY29uY2F0KGxvd2VyUGF0aCwgaGlnaGVyUGF0aCk7XG5cdFx0XG5cdFx0cmV0dXJuIGxpbmVQYXRoO1xuXHR9LFxuXHRcblx0LyoqXG5cdCAqIEV4dGVuZCB0aGUgYmFzaWMgZHJhd0RhdGFMYWJlbHMgbWV0aG9kIGJ5IHJ1bm5pbmcgaXQgZm9yIGJvdGggbG93ZXIgYW5kIGhpZ2hlclxuXHQgKiB2YWx1ZXMuXG5cdCAqL1xuXHRkcmF3RGF0YUxhYmVsczogZnVuY3Rpb24gKCkge1xuXHRcdFxuXHRcdHZhciBkYXRhID0gdGhpcy5kYXRhLFxuXHRcdFx0bGVuZ3RoID0gZGF0YS5sZW5ndGgsXG5cdFx0XHRpLFxuXHRcdFx0b3JpZ2luYWxEYXRhTGFiZWxzID0gW10sXG5cdFx0XHRzZXJpZXNQcm90byA9IFNlcmllcy5wcm90b3R5cGUsXG5cdFx0XHRkYXRhTGFiZWxPcHRpb25zID0gdGhpcy5vcHRpb25zLmRhdGFMYWJlbHMsXG5cdFx0XHRwb2ludCxcblx0XHRcdGludmVydGVkID0gdGhpcy5jaGFydC5pbnZlcnRlZDtcblx0XHRcdFxuXHRcdGlmIChkYXRhTGFiZWxPcHRpb25zLmVuYWJsZWQgfHwgdGhpcy5faGFzUG9pbnRMYWJlbHMpIHtcblx0XHRcdFxuXHRcdFx0Ly8gU3RlcCAxOiBzZXQgcHJlbGltaW5hcnkgdmFsdWVzIGZvciBwbG90WSBhbmQgZGF0YUxhYmVsIGFuZCBkcmF3IHRoZSB1cHBlciBsYWJlbHNcblx0XHRcdGkgPSBsZW5ndGg7XG5cdFx0XHR3aGlsZSAoaS0tKSB7XG5cdFx0XHRcdHBvaW50ID0gZGF0YVtpXTtcblx0XHRcdFx0XG5cdFx0XHRcdC8vIFNldCBwcmVsaW1pbmFyeSB2YWx1ZXNcblx0XHRcdFx0cG9pbnQueSA9IHBvaW50LmhpZ2g7XG5cdFx0XHRcdHBvaW50LnBsb3RZID0gcG9pbnQucGxvdEhpZ2g7XG5cdFx0XHRcdFxuXHRcdFx0XHQvLyBTdG9yZSBvcmlnaW5hbCBkYXRhIGxhYmVscyBhbmQgc2V0IHByZWxpbWluYXJ5IGxhYmVsIG9iamVjdHMgdG8gYmUgcGlja2VkIHVwIFxuXHRcdFx0XHQvLyBpbiB0aGUgdWJlciBtZXRob2Rcblx0XHRcdFx0b3JpZ2luYWxEYXRhTGFiZWxzW2ldID0gcG9pbnQuZGF0YUxhYmVsO1xuXHRcdFx0XHRwb2ludC5kYXRhTGFiZWwgPSBwb2ludC5kYXRhTGFiZWxVcHBlcjtcblx0XHRcdFx0XG5cdFx0XHRcdC8vIFNldCB0aGUgZGVmYXVsdCBvZmZzZXRcblx0XHRcdFx0cG9pbnQuYmVsb3cgPSBmYWxzZTtcblx0XHRcdFx0aWYgKGludmVydGVkKSB7XG5cdFx0XHRcdFx0ZGF0YUxhYmVsT3B0aW9ucy5hbGlnbiA9ICdsZWZ0Jztcblx0XHRcdFx0XHRkYXRhTGFiZWxPcHRpb25zLnggPSBkYXRhTGFiZWxPcHRpb25zLnhIaWdoO1x0XHRcdFx0XHRcdFx0XHRcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRkYXRhTGFiZWxPcHRpb25zLnkgPSBkYXRhTGFiZWxPcHRpb25zLnlIaWdoO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRzZXJpZXNQcm90by5kcmF3RGF0YUxhYmVscy5hcHBseSh0aGlzLCBhcmd1bWVudHMpOyAvLyAjMTIwOVxuXHRcdFx0XG5cdFx0XHQvLyBTdGVwIDI6IHJlb3JnYW5pemUgYW5kIGhhbmRsZSBkYXRhIGxhYmVscyBmb3IgdGhlIGxvd2VyIHZhbHVlc1xuXHRcdFx0aSA9IGxlbmd0aDtcblx0XHRcdHdoaWxlIChpLS0pIHtcblx0XHRcdFx0cG9pbnQgPSBkYXRhW2ldO1xuXHRcdFx0XHRcblx0XHRcdFx0Ly8gTW92ZSB0aGUgZ2VuZXJhdGVkIGxhYmVscyBmcm9tIHN0ZXAgMSwgYW5kIHJlYXNzaWduIHRoZSBvcmlnaW5hbCBkYXRhIGxhYmVsc1xuXHRcdFx0XHRwb2ludC5kYXRhTGFiZWxVcHBlciA9IHBvaW50LmRhdGFMYWJlbDtcblx0XHRcdFx0cG9pbnQuZGF0YUxhYmVsID0gb3JpZ2luYWxEYXRhTGFiZWxzW2ldO1xuXHRcdFx0XHRcblx0XHRcdFx0Ly8gUmVzZXQgdmFsdWVzXG5cdFx0XHRcdHBvaW50LnkgPSBwb2ludC5sb3c7XG5cdFx0XHRcdHBvaW50LnBsb3RZID0gcG9pbnQucGxvdExvdztcblx0XHRcdFx0XG5cdFx0XHRcdC8vIFNldCB0aGUgZGVmYXVsdCBvZmZzZXRcblx0XHRcdFx0cG9pbnQuYmVsb3cgPSB0cnVlO1xuXHRcdFx0XHRpZiAoaW52ZXJ0ZWQpIHtcblx0XHRcdFx0XHRkYXRhTGFiZWxPcHRpb25zLmFsaWduID0gJ3JpZ2h0Jztcblx0XHRcdFx0XHRkYXRhTGFiZWxPcHRpb25zLnggPSBkYXRhTGFiZWxPcHRpb25zLnhMb3c7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0ZGF0YUxhYmVsT3B0aW9ucy55ID0gZGF0YUxhYmVsT3B0aW9ucy55TG93O1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRzZXJpZXNQcm90by5kcmF3RGF0YUxhYmVscy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHRcdH1cblx0XG5cdH0sXG5cdFxuXHRhbGlnbkRhdGFMYWJlbDogc2VyaWVzVHlwZXMuY29sdW1uLnByb3RvdHlwZS5hbGlnbkRhdGFMYWJlbCxcblx0XG5cdGdldFN5bWJvbDogc2VyaWVzVHlwZXMuY29sdW1uLnByb3RvdHlwZS5nZXRTeW1ib2wsXG5cdFxuXHRkcmF3UG9pbnRzOiBub29wXG59KTsvKipcbiAqIFRoZSBBcmVhU3BsaW5lUmFuZ2VTZXJpZXMgY2xhc3NcbiAqL1xuXG5kZWZhdWx0UGxvdE9wdGlvbnMuYXJlYXNwbGluZXJhbmdlID0gbWVyZ2UoZGVmYXVsdFBsb3RPcHRpb25zLmFyZWFyYW5nZSk7XG5cbi8qKlxuICogQXJlYVNwbGluZVJhbmdlU2VyaWVzIG9iamVjdFxuICovXG5zZXJpZXNUeXBlcy5hcmVhc3BsaW5lcmFuZ2UgPSBleHRlbmRDbGFzcyhzZXJpZXNUeXBlcy5hcmVhcmFuZ2UsIHtcblx0dHlwZTogJ2FyZWFzcGxpbmVyYW5nZScsXG5cdGdldFBvaW50U3BsaW5lOiBzZXJpZXNUeXBlcy5zcGxpbmUucHJvdG90eXBlLmdldFBvaW50U3BsaW5lXG59KTsvKipcbiAqIFRoZSBDb2x1bW5SYW5nZVNlcmllcyBjbGFzc1xuICovXG5kZWZhdWx0UGxvdE9wdGlvbnMuY29sdW1ucmFuZ2UgPSBtZXJnZShkZWZhdWx0UGxvdE9wdGlvbnMuY29sdW1uLCBkZWZhdWx0UGxvdE9wdGlvbnMuYXJlYXJhbmdlLCB7XG5cdGxpbmVXaWR0aDogMSxcblx0cG9pbnRSYW5nZTogbnVsbFxufSk7XG5cbi8qKlxuICogQ29sdW1uUmFuZ2VTZXJpZXMgb2JqZWN0XG4gKi9cbnNlcmllc1R5cGVzLmNvbHVtbnJhbmdlID0gZXh0ZW5kQ2xhc3Moc2VyaWVzVHlwZXMuYXJlYXJhbmdlLCB7XG5cdHR5cGU6ICdjb2x1bW5yYW5nZScsXG5cdC8qKlxuXHQgKiBUcmFuc2xhdGUgZGF0YSBwb2ludHMgZnJvbSByYXcgdmFsdWVzIHggYW5kIHkgdG8gcGxvdFggYW5kIHBsb3RZXG5cdCAqL1xuXHR0cmFuc2xhdGU6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgc2VyaWVzID0gdGhpcyxcblx0XHRcdHlBeGlzID0gc2VyaWVzLnlBeGlzLFxuXHRcdFx0cGxvdEhpZ2g7XG5cblx0XHRjb2xQcm90by50cmFuc2xhdGUuYXBwbHkoc2VyaWVzKTtcblxuXHRcdC8vIFNldCBwbG90TG93IGFuZCBwbG90SGlnaFxuXHRcdGVhY2goc2VyaWVzLnBvaW50cywgZnVuY3Rpb24gKHBvaW50KSB7XG5cdFx0XHR2YXIgc2hhcGVBcmdzID0gcG9pbnQuc2hhcGVBcmdzLFxuXHRcdFx0XHRtaW5Qb2ludExlbmd0aCA9IHNlcmllcy5vcHRpb25zLm1pblBvaW50TGVuZ3RoLFxuXHRcdFx0XHRoZWlnaHREaWZmZXJlbmNlLFxuXHRcdFx0XHRoZWlnaHQsXG5cdFx0XHRcdHk7XG5cblx0XHRcdHBvaW50LnBsb3RIaWdoID0gcGxvdEhpZ2ggPSB5QXhpcy50cmFuc2xhdGUocG9pbnQuaGlnaCwgMCwgMSwgMCwgMSk7XG5cdFx0XHRwb2ludC5wbG90TG93ID0gcG9pbnQucGxvdFk7XG5cblx0XHRcdC8vIGFkanVzdCBzaGFwZVxuXHRcdFx0eSA9IHBsb3RIaWdoO1xuXHRcdFx0aGVpZ2h0ID0gcG9pbnQucGxvdFkgLSBwbG90SGlnaDtcblxuXHRcdFx0aWYgKGhlaWdodCA8IG1pblBvaW50TGVuZ3RoKSB7XG5cdFx0XHRcdGhlaWdodERpZmZlcmVuY2UgPSAobWluUG9pbnRMZW5ndGggLSBoZWlnaHQpO1xuXHRcdFx0XHRoZWlnaHQgKz0gaGVpZ2h0RGlmZmVyZW5jZTtcblx0XHRcdFx0eSAtPSBoZWlnaHREaWZmZXJlbmNlIC8gMjtcblx0XHRcdH1cblx0XHRcdHNoYXBlQXJncy5oZWlnaHQgPSBoZWlnaHQ7XG5cdFx0XHRzaGFwZUFyZ3MueSA9IHk7XG5cdFx0fSk7XG5cdH0sXG5cdHRyYWNrZXJHcm91cHM6IFsnZ3JvdXAnLCAnZGF0YUxhYmVscyddLFxuXHRkcmF3R3JhcGg6IG5vb3AsXG5cdHBvaW50QXR0clRvT3B0aW9uczogY29sUHJvdG8ucG9pbnRBdHRyVG9PcHRpb25zLFxuXHRkcmF3UG9pbnRzOiBjb2xQcm90by5kcmF3UG9pbnRzLFxuXHRkcmF3VHJhY2tlcjogY29sUHJvdG8uZHJhd1RyYWNrZXIsXG5cdGFuaW1hdGU6IGNvbFByb3RvLmFuaW1hdGUsXG5cdGdldENvbHVtbk1ldHJpY3M6IGNvbFByb3RvLmdldENvbHVtbk1ldHJpY3Ncbn0pO1xuLyogXG4gKiBUaGUgR2F1Z2VTZXJpZXMgY2xhc3NcbiAqL1xuXG5cblxuLyoqXG4gKiBFeHRlbmQgdGhlIGRlZmF1bHQgb3B0aW9uc1xuICovXG5kZWZhdWx0UGxvdE9wdGlvbnMuZ2F1Z2UgPSBtZXJnZShkZWZhdWx0UGxvdE9wdGlvbnMubGluZSwge1xuXHRkYXRhTGFiZWxzOiB7XG5cdFx0ZW5hYmxlZDogdHJ1ZSxcblx0XHR5OiAxNSxcblx0XHRib3JkZXJXaWR0aDogMSxcblx0XHRib3JkZXJDb2xvcjogJ3NpbHZlcicsXG5cdFx0Ym9yZGVyUmFkaXVzOiAzLFxuXHRcdHN0eWxlOiB7XG5cdFx0XHRmb250V2VpZ2h0OiAnYm9sZCdcblx0XHR9LFxuXHRcdHZlcnRpY2FsQWxpZ246ICd0b3AnLFxuXHRcdHpJbmRleDogMlxuXHR9LFxuXHRkaWFsOiB7XG5cdFx0Ly8gcmFkaXVzOiAnODAlJyxcblx0XHQvLyBiYWNrZ3JvdW5kQ29sb3I6ICdibGFjaycsXG5cdFx0Ly8gYm9yZGVyQ29sb3I6ICdzaWx2ZXInLFxuXHRcdC8vIGJvcmRlcldpZHRoOiAwLFxuXHRcdC8vIGJhc2VXaWR0aDogMyxcblx0XHQvLyB0b3BXaWR0aDogMSxcblx0XHQvLyBiYXNlTGVuZ3RoOiAnNzAlJyAvLyBvZiByYWRpdXNcblx0XHQvLyByZWFyTGVuZ3RoOiAnMTAlJ1xuXHR9LFxuXHRwaXZvdDoge1xuXHRcdC8vcmFkaXVzOiA1LFxuXHRcdC8vYm9yZGVyV2lkdGg6IDBcblx0XHQvL2JvcmRlckNvbG9yOiAnc2lsdmVyJyxcblx0XHQvL2JhY2tncm91bmRDb2xvcjogJ2JsYWNrJ1xuXHR9LFxuXHR0b29sdGlwOiB7XG5cdFx0aGVhZGVyRm9ybWF0OiAnJ1xuXHR9LFxuXHRzaG93SW5MZWdlbmQ6IGZhbHNlXG59KTtcblxuLyoqXG4gKiBFeHRlbmQgdGhlIHBvaW50IG9iamVjdFxuICovXG52YXIgR2F1Z2VQb2ludCA9IEhpZ2hjaGFydHMuZXh0ZW5kQ2xhc3MoSGlnaGNoYXJ0cy5Qb2ludCwge1xuXHQvKipcblx0ICogRG9uJ3QgZG8gYW55IGhvdmVyIGNvbG9ycyBvciBhbnl0aGluZ1xuXHQgKi9cblx0c2V0U3RhdGU6IGZ1bmN0aW9uIChzdGF0ZSkge1xuXHRcdHRoaXMuc3RhdGUgPSBzdGF0ZTtcblx0fVxufSk7XG5cblxuLyoqXG4gKiBBZGQgdGhlIHNlcmllcyB0eXBlXG4gKi9cbnZhciBHYXVnZVNlcmllcyA9IHtcblx0dHlwZTogJ2dhdWdlJyxcblx0cG9pbnRDbGFzczogR2F1Z2VQb2ludCxcblx0XG5cdC8vIGNoYXJ0LmFuZ3VsYXIgd2lsbCBiZSBzZXQgdG8gdHJ1ZSB3aGVuIGEgZ2F1Z2Ugc2VyaWVzIGlzIHByZXNlbnQsIGFuZCB0aGlzIHdpbGxcblx0Ly8gYmUgdXNlZCBvbiB0aGUgYXhlc1xuXHRhbmd1bGFyOiB0cnVlLCBcblx0ZHJhd0dyYXBoOiBub29wLFxuXHRmaXhlZEJveDogdHJ1ZSxcblx0dHJhY2tlckdyb3VwczogWydncm91cCcsICdkYXRhTGFiZWxzJ10sXG5cdFxuXHQvKipcblx0ICogQ2FsY3VsYXRlIHBhdGhzIGV0Y1xuXHQgKi9cblx0dHJhbnNsYXRlOiBmdW5jdGlvbiAoKSB7XG5cdFx0XG5cdFx0dmFyIHNlcmllcyA9IHRoaXMsXG5cdFx0XHR5QXhpcyA9IHNlcmllcy55QXhpcyxcblx0XHRcdG9wdGlvbnMgPSBzZXJpZXMub3B0aW9ucyxcblx0XHRcdGNlbnRlciA9IHlBeGlzLmNlbnRlcjtcblx0XHRcdFxuXHRcdHNlcmllcy5nZW5lcmF0ZVBvaW50cygpO1xuXHRcdFxuXHRcdGVhY2goc2VyaWVzLnBvaW50cywgZnVuY3Rpb24gKHBvaW50KSB7XG5cdFx0XHRcblx0XHRcdHZhciBkaWFsT3B0aW9ucyA9IG1lcmdlKG9wdGlvbnMuZGlhbCwgcG9pbnQuZGlhbCksXG5cdFx0XHRcdHJhZGl1cyA9IChwSW50KHBpY2soZGlhbE9wdGlvbnMucmFkaXVzLCA4MCkpICogY2VudGVyWzJdKSAvIDIwMCxcblx0XHRcdFx0YmFzZUxlbmd0aCA9IChwSW50KHBpY2soZGlhbE9wdGlvbnMuYmFzZUxlbmd0aCwgNzApKSAqIHJhZGl1cykgLyAxMDAsXG5cdFx0XHRcdHJlYXJMZW5ndGggPSAocEludChwaWNrKGRpYWxPcHRpb25zLnJlYXJMZW5ndGgsIDEwKSkgKiByYWRpdXMpIC8gMTAwLFxuXHRcdFx0XHRiYXNlV2lkdGggPSBkaWFsT3B0aW9ucy5iYXNlV2lkdGggfHwgMyxcblx0XHRcdFx0dG9wV2lkdGggPSBkaWFsT3B0aW9ucy50b3BXaWR0aCB8fCAxLFxuXHRcdFx0XHRyb3RhdGlvbiA9IHlBeGlzLnN0YXJ0QW5nbGVSYWQgKyB5QXhpcy50cmFuc2xhdGUocG9pbnQueSwgbnVsbCwgbnVsbCwgbnVsbCwgdHJ1ZSk7XG5cblx0XHRcdC8vIEhhbmRsZSB0aGUgd3JhcCBvcHRpb25cblx0XHRcdGlmIChvcHRpb25zLndyYXAgPT09IGZhbHNlKSB7XG5cdFx0XHRcdHJvdGF0aW9uID0gTWF0aC5tYXgoeUF4aXMuc3RhcnRBbmdsZVJhZCwgTWF0aC5taW4oeUF4aXMuZW5kQW5nbGVSYWQsIHJvdGF0aW9uKSk7XG5cdFx0XHR9XG5cdFx0XHRyb3RhdGlvbiA9IHJvdGF0aW9uICogMTgwIC8gTWF0aC5QSTtcblx0XHRcdFx0XG5cdFx0XHRwb2ludC5zaGFwZVR5cGUgPSAncGF0aCc7XG5cdFx0XHRwb2ludC5zaGFwZUFyZ3MgPSB7XG5cdFx0XHRcdGQ6IGRpYWxPcHRpb25zLnBhdGggfHwgW1xuXHRcdFx0XHRcdCdNJywgXG5cdFx0XHRcdFx0LXJlYXJMZW5ndGgsIC1iYXNlV2lkdGggLyAyLCBcblx0XHRcdFx0XHQnTCcsIFxuXHRcdFx0XHRcdGJhc2VMZW5ndGgsIC1iYXNlV2lkdGggLyAyLFxuXHRcdFx0XHRcdHJhZGl1cywgLXRvcFdpZHRoIC8gMixcblx0XHRcdFx0XHRyYWRpdXMsIHRvcFdpZHRoIC8gMixcblx0XHRcdFx0XHRiYXNlTGVuZ3RoLCBiYXNlV2lkdGggLyAyLFxuXHRcdFx0XHRcdC1yZWFyTGVuZ3RoLCBiYXNlV2lkdGggLyAyLFxuXHRcdFx0XHRcdCd6J1xuXHRcdFx0XHRdLFxuXHRcdFx0XHR0cmFuc2xhdGVYOiBjZW50ZXJbMF0sXG5cdFx0XHRcdHRyYW5zbGF0ZVk6IGNlbnRlclsxXSxcblx0XHRcdFx0cm90YXRpb246IHJvdGF0aW9uXG5cdFx0XHR9O1xuXHRcdFx0XG5cdFx0XHQvLyBQb3NpdGlvbnMgZm9yIGRhdGEgbGFiZWxcblx0XHRcdHBvaW50LnBsb3RYID0gY2VudGVyWzBdO1xuXHRcdFx0cG9pbnQucGxvdFkgPSBjZW50ZXJbMV07XG5cdFx0fSk7XG5cdH0sXG5cdFxuXHQvKipcblx0ICogRHJhdyB0aGUgcG9pbnRzIHdoZXJlIGVhY2ggcG9pbnQgaXMgb25lIG5lZWRsZVxuXHQgKi9cblx0ZHJhd1BvaW50czogZnVuY3Rpb24gKCkge1xuXHRcdFxuXHRcdHZhciBzZXJpZXMgPSB0aGlzLFxuXHRcdFx0Y2VudGVyID0gc2VyaWVzLnlBeGlzLmNlbnRlcixcblx0XHRcdHBpdm90ID0gc2VyaWVzLnBpdm90LFxuXHRcdFx0b3B0aW9ucyA9IHNlcmllcy5vcHRpb25zLFxuXHRcdFx0cGl2b3RPcHRpb25zID0gb3B0aW9ucy5waXZvdCxcblx0XHRcdHJlbmRlcmVyID0gc2VyaWVzLmNoYXJ0LnJlbmRlcmVyO1xuXHRcdFxuXHRcdGVhY2goc2VyaWVzLnBvaW50cywgZnVuY3Rpb24gKHBvaW50KSB7XG5cdFx0XHRcblx0XHRcdHZhciBncmFwaGljID0gcG9pbnQuZ3JhcGhpYyxcblx0XHRcdFx0c2hhcGVBcmdzID0gcG9pbnQuc2hhcGVBcmdzLFxuXHRcdFx0XHRkID0gc2hhcGVBcmdzLmQsXG5cdFx0XHRcdGRpYWxPcHRpb25zID0gbWVyZ2Uob3B0aW9ucy5kaWFsLCBwb2ludC5kaWFsKTsgLy8gIzEyMzNcblx0XHRcdFxuXHRcdFx0aWYgKGdyYXBoaWMpIHtcblx0XHRcdFx0Z3JhcGhpYy5hbmltYXRlKHNoYXBlQXJncyk7XG5cdFx0XHRcdHNoYXBlQXJncy5kID0gZDsgLy8gYW5pbWF0ZSBhbHRlcnMgaXRcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHBvaW50LmdyYXBoaWMgPSByZW5kZXJlcltwb2ludC5zaGFwZVR5cGVdKHNoYXBlQXJncylcblx0XHRcdFx0XHQuYXR0cih7XG5cdFx0XHRcdFx0XHRzdHJva2U6IGRpYWxPcHRpb25zLmJvcmRlckNvbG9yIHx8ICdub25lJyxcblx0XHRcdFx0XHRcdCdzdHJva2Utd2lkdGgnOiBkaWFsT3B0aW9ucy5ib3JkZXJXaWR0aCB8fCAwLFxuXHRcdFx0XHRcdFx0ZmlsbDogZGlhbE9wdGlvbnMuYmFja2dyb3VuZENvbG9yIHx8ICdibGFjaycsXG5cdFx0XHRcdFx0XHRyb3RhdGlvbjogc2hhcGVBcmdzLnJvdGF0aW9uIC8vIHJlcXVpcmVkIGJ5IFZNTCB3aGVuIGFuaW1hdGlvbiBpcyBmYWxzZVxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0LmFkZChzZXJpZXMuZ3JvdXApO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdFxuXHRcdC8vIEFkZCBvciBtb3ZlIHRoZSBwaXZvdFxuXHRcdGlmIChwaXZvdCkge1xuXHRcdFx0cGl2b3QuYW5pbWF0ZSh7IC8vICMxMjM1XG5cdFx0XHRcdHRyYW5zbGF0ZVg6IGNlbnRlclswXSxcblx0XHRcdFx0dHJhbnNsYXRlWTogY2VudGVyWzFdXG5cdFx0XHR9KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0c2VyaWVzLnBpdm90ID0gcmVuZGVyZXIuY2lyY2xlKDAsIDAsIHBpY2socGl2b3RPcHRpb25zLnJhZGl1cywgNSkpXG5cdFx0XHRcdC5hdHRyKHtcblx0XHRcdFx0XHQnc3Ryb2tlLXdpZHRoJzogcGl2b3RPcHRpb25zLmJvcmRlcldpZHRoIHx8IDAsXG5cdFx0XHRcdFx0c3Ryb2tlOiBwaXZvdE9wdGlvbnMuYm9yZGVyQ29sb3IgfHwgJ3NpbHZlcicsXG5cdFx0XHRcdFx0ZmlsbDogcGl2b3RPcHRpb25zLmJhY2tncm91bmRDb2xvciB8fCAnYmxhY2snXG5cdFx0XHRcdH0pXG5cdFx0XHRcdC50cmFuc2xhdGUoY2VudGVyWzBdLCBjZW50ZXJbMV0pXG5cdFx0XHRcdC5hZGQoc2VyaWVzLmdyb3VwKTtcblx0XHR9XG5cdH0sXG5cdFxuXHQvKipcblx0ICogQW5pbWF0ZSB0aGUgYXJyb3cgdXAgZnJvbSBzdGFydEFuZ2xlXG5cdCAqL1xuXHRhbmltYXRlOiBmdW5jdGlvbiAoaW5pdCkge1xuXHRcdHZhciBzZXJpZXMgPSB0aGlzO1xuXG5cdFx0aWYgKCFpbml0KSB7XG5cdFx0XHRlYWNoKHNlcmllcy5wb2ludHMsIGZ1bmN0aW9uIChwb2ludCkge1xuXHRcdFx0XHR2YXIgZ3JhcGhpYyA9IHBvaW50LmdyYXBoaWM7XG5cblx0XHRcdFx0aWYgKGdyYXBoaWMpIHtcblx0XHRcdFx0XHQvLyBzdGFydCB2YWx1ZVxuXHRcdFx0XHRcdGdyYXBoaWMuYXR0cih7XG5cdFx0XHRcdFx0XHRyb3RhdGlvbjogc2VyaWVzLnlBeGlzLnN0YXJ0QW5nbGVSYWQgKiAxODAgLyBNYXRoLlBJXG5cdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHQvLyBhbmltYXRlXG5cdFx0XHRcdFx0Z3JhcGhpYy5hbmltYXRlKHtcblx0XHRcdFx0XHRcdHJvdGF0aW9uOiBwb2ludC5zaGFwZUFyZ3Mucm90YXRpb25cblx0XHRcdFx0XHR9LCBzZXJpZXMub3B0aW9ucy5hbmltYXRpb24pO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gZGVsZXRlIHRoaXMgZnVuY3Rpb24gdG8gYWxsb3cgaXQgb25seSBvbmNlXG5cdFx0XHRzZXJpZXMuYW5pbWF0ZSA9IG51bGw7XG5cdFx0fVxuXHR9LFxuXHRcblx0cmVuZGVyOiBmdW5jdGlvbiAoKSB7XG5cdFx0dGhpcy5ncm91cCA9IHRoaXMucGxvdEdyb3VwKFxuXHRcdFx0J2dyb3VwJywgXG5cdFx0XHQnc2VyaWVzJywgXG5cdFx0XHR0aGlzLnZpc2libGUgPyAndmlzaWJsZScgOiAnaGlkZGVuJywgXG5cdFx0XHR0aGlzLm9wdGlvbnMuekluZGV4LCBcblx0XHRcdHRoaXMuY2hhcnQuc2VyaWVzR3JvdXBcblx0XHQpO1xuXHRcdHNlcmllc1R5cGVzLnBpZS5wcm90b3R5cGUucmVuZGVyLmNhbGwodGhpcyk7XG5cdFx0dGhpcy5ncm91cC5jbGlwKHRoaXMuY2hhcnQuY2xpcFJlY3QpO1xuXHR9LFxuXHRcblx0c2V0RGF0YTogc2VyaWVzVHlwZXMucGllLnByb3RvdHlwZS5zZXREYXRhLFxuXHRkcmF3VHJhY2tlcjogc2VyaWVzVHlwZXMuY29sdW1uLnByb3RvdHlwZS5kcmF3VHJhY2tlclxufTtcbnNlcmllc1R5cGVzLmdhdWdlID0gSGlnaGNoYXJ0cy5leHRlbmRDbGFzcyhzZXJpZXNUeXBlcy5saW5lLCBHYXVnZVNlcmllcyk7LyogKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogU3RhcnQgQm94IHBsb3Qgc2VyaWVzIGNvZGVcdFx0XHRcdFx0XHRcdFx0XHRcdFx0ICAgICAgKlxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4vLyBTZXQgZGVmYXVsdCBvcHRpb25zXG5kZWZhdWx0UGxvdE9wdGlvbnMuYm94cGxvdCA9IG1lcmdlKGRlZmF1bHRQbG90T3B0aW9ucy5jb2x1bW4sIHtcblx0ZmlsbENvbG9yOiAnI0ZGRkZGRicsXG5cdGxpbmVXaWR0aDogMSxcblx0Ly9tZWRpYW5Db2xvcjogbnVsbCxcblx0bWVkaWFuV2lkdGg6IDIsXG5cdHN0YXRlczoge1xuXHRcdGhvdmVyOiB7XG5cdFx0XHRicmlnaHRuZXNzOiAtMC4zXG5cdFx0fVxuXHR9LFxuXHQvL3N0ZW1Db2xvcjogbnVsbCxcblx0Ly9zdGVtRGFzaFN0eWxlOiAnc29saWQnXG5cdC8vc3RlbVdpZHRoOiBudWxsLFxuXHR0aHJlc2hvbGQ6IG51bGwsXG5cdHRvb2x0aXA6IHtcblx0XHRwb2ludEZvcm1hdDogJzxzcGFuIHN0eWxlPVwiY29sb3I6e3Nlcmllcy5jb2xvcn07Zm9udC13ZWlnaHQ6Ym9sZFwiPntzZXJpZXMubmFtZX08L3NwYW4+PGJyLz4nICtcblx0XHRcdCdNYXhpbXVtOiB7cG9pbnQuaGlnaH08YnIvPicgK1xuXHRcdFx0J1VwcGVyIHF1YXJ0aWxlOiB7cG9pbnQucTN9PGJyLz4nICtcblx0XHRcdCdNZWRpYW46IHtwb2ludC5tZWRpYW59PGJyLz4nICtcblx0XHRcdCdMb3dlciBxdWFydGlsZToge3BvaW50LnExfTxici8+JyArXG5cdFx0XHQnTWluaW11bToge3BvaW50Lmxvd308YnIvPidcblx0XHRcdFxuXHR9LFxuXHQvL3doaXNrZXJDb2xvcjogbnVsbCxcblx0d2hpc2tlckxlbmd0aDogJzUwJScsXG5cdHdoaXNrZXJXaWR0aDogMlxufSk7XG5cbi8vIENyZWF0ZSB0aGUgc2VyaWVzIG9iamVjdFxuc2VyaWVzVHlwZXMuYm94cGxvdCA9IGV4dGVuZENsYXNzKHNlcmllc1R5cGVzLmNvbHVtbiwge1xuXHR0eXBlOiAnYm94cGxvdCcsXG5cdHBvaW50QXJyYXlNYXA6IFsnbG93JywgJ3ExJywgJ21lZGlhbicsICdxMycsICdoaWdoJ10sIC8vIGFycmF5IHBvaW50IGNvbmZpZ3MgYXJlIG1hcHBlZCB0byB0aGlzXG5cdHRvWURhdGE6IGZ1bmN0aW9uIChwb2ludCkgeyAvLyByZXR1cm4gYSBwbGFpbiBhcnJheSBmb3Igc3BlZWR5IGNhbGN1bGF0aW9uXG5cdFx0cmV0dXJuIFtwb2ludC5sb3csIHBvaW50LnExLCBwb2ludC5tZWRpYW4sIHBvaW50LnEzLCBwb2ludC5oaWdoXTtcblx0fSxcblx0cG9pbnRWYWxLZXk6ICdoaWdoJywgLy8gZGVmaW5lcyB0aGUgdG9wIG9mIHRoZSB0cmFja2VyXG5cdFxuXHQvKipcblx0ICogT25lLXRvLW9uZSBtYXBwaW5nIGZyb20gb3B0aW9ucyB0byBTVkcgYXR0cmlidXRlc1xuXHQgKi9cblx0cG9pbnRBdHRyVG9PcHRpb25zOiB7IC8vIG1hcHBpbmcgYmV0d2VlbiBTVkcgYXR0cmlidXRlcyBhbmQgdGhlIGNvcnJlc3BvbmRpbmcgb3B0aW9uc1xuXHRcdGZpbGw6ICdmaWxsQ29sb3InLFxuXHRcdHN0cm9rZTogJ2NvbG9yJyxcblx0XHQnc3Ryb2tlLXdpZHRoJzogJ2xpbmVXaWR0aCdcblx0fSxcblx0XG5cdC8qKlxuXHQgKiBEaXNhYmxlIGRhdGEgbGFiZWxzIGZvciBib3ggcGxvdFxuXHQgKi9cblx0ZHJhd0RhdGFMYWJlbHM6IG5vb3AsXG5cblx0LyoqXG5cdCAqIFRyYW5zbGF0ZSBkYXRhIHBvaW50cyBmcm9tIHJhdyB2YWx1ZXMgeCBhbmQgeSB0byBwbG90WCBhbmQgcGxvdFlcblx0ICovXG5cdHRyYW5zbGF0ZTogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBzZXJpZXMgPSB0aGlzLFxuXHRcdFx0eUF4aXMgPSBzZXJpZXMueUF4aXMsXG5cdFx0XHRwb2ludEFycmF5TWFwID0gc2VyaWVzLnBvaW50QXJyYXlNYXA7XG5cblx0XHRzZXJpZXNUeXBlcy5jb2x1bW4ucHJvdG90eXBlLnRyYW5zbGF0ZS5hcHBseShzZXJpZXMpO1xuXG5cdFx0Ly8gZG8gdGhlIHRyYW5zbGF0aW9uIG9uIGVhY2ggcG9pbnQgZGltZW5zaW9uXG5cdFx0ZWFjaChzZXJpZXMucG9pbnRzLCBmdW5jdGlvbiAocG9pbnQpIHtcblx0XHRcdGVhY2gocG9pbnRBcnJheU1hcCwgZnVuY3Rpb24gKGtleSkge1xuXHRcdFx0XHRpZiAocG9pbnRba2V5XSAhPT0gbnVsbCkge1xuXHRcdFx0XHRcdHBvaW50W2tleSArICdQbG90J10gPSB5QXhpcy50cmFuc2xhdGUocG9pbnRba2V5XSwgMCwgMSwgMCwgMSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH0pO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBEcmF3IHRoZSBkYXRhIHBvaW50c1xuXHQgKi9cblx0ZHJhd1BvaW50czogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBzZXJpZXMgPSB0aGlzLCAgLy9zdGF0ZSA9IHNlcmllcy5zdGF0ZSxcblx0XHRcdHBvaW50cyA9IHNlcmllcy5wb2ludHMsXG5cdFx0XHRvcHRpb25zID0gc2VyaWVzLm9wdGlvbnMsXG5cdFx0XHRjaGFydCA9IHNlcmllcy5jaGFydCxcblx0XHRcdHJlbmRlcmVyID0gY2hhcnQucmVuZGVyZXIsXG5cdFx0XHRwb2ludEF0dHIsXG5cdFx0XHRxMVBsb3QsXG5cdFx0XHRxM1Bsb3QsXG5cdFx0XHRoaWdoUGxvdCxcblx0XHRcdGxvd1Bsb3QsXG5cdFx0XHRtZWRpYW5QbG90LFxuXHRcdFx0Y3Jpc3BDb3JyLFxuXHRcdFx0Y3Jpc3BYLFxuXHRcdFx0Z3JhcGhpYyxcblx0XHRcdHN0ZW1QYXRoLFxuXHRcdFx0c3RlbUF0dHIsXG5cdFx0XHRib3hQYXRoLFxuXHRcdFx0d2hpc2tlcnNQYXRoLFxuXHRcdFx0d2hpc2tlcnNBdHRyLFxuXHRcdFx0bWVkaWFuUGF0aCxcblx0XHRcdG1lZGlhbkF0dHIsXG5cdFx0XHR3aWR0aCxcblx0XHRcdGxlZnQsXG5cdFx0XHRyaWdodCxcblx0XHRcdGhhbGZXaWR0aCxcblx0XHRcdHNoYXBlQXJncyxcblx0XHRcdGNvbG9yLFxuXHRcdFx0ZG9RdWFydGlsZXMgPSBzZXJpZXMuZG9RdWFydGlsZXMgIT09IGZhbHNlLCAvLyBlcnJvciBiYXIgaW5oZXJpdHMgdGhpcyBzZXJpZXMgdHlwZSBidXQgZG9lc24ndCBkbyBxdWFydGlsZXNcblx0XHRcdHdoaXNrZXJMZW5ndGggPSBwYXJzZUludChzZXJpZXMub3B0aW9ucy53aGlza2VyTGVuZ3RoLCAxMCkgLyAxMDA7XG5cblxuXHRcdGVhY2gocG9pbnRzLCBmdW5jdGlvbiAocG9pbnQpIHtcblxuXHRcdFx0Z3JhcGhpYyA9IHBvaW50LmdyYXBoaWM7XG5cdFx0XHRzaGFwZUFyZ3MgPSBwb2ludC5zaGFwZUFyZ3M7IC8vIHRoZSBib3hcblx0XHRcdHN0ZW1BdHRyID0ge307XG5cdFx0XHR3aGlza2Vyc0F0dHIgPSB7fTtcblx0XHRcdG1lZGlhbkF0dHIgPSB7fTtcblx0XHRcdGNvbG9yID0gcG9pbnQuY29sb3IgfHwgc2VyaWVzLmNvbG9yO1xuXHRcdFx0XG5cdFx0XHRpZiAocG9pbnQucGxvdFkgIT09IFVOREVGSU5FRCkge1xuXG5cdFx0XHRcdHBvaW50QXR0ciA9IHBvaW50LnBvaW50QXR0cltwb2ludC5zZWxlY3RlZCA/ICdzZWxlY3RlZCcgOiAnJ107XG5cblx0XHRcdFx0Ly8gY3Jpc3AgdmVjdG9yIGNvb3JkaW5hdGVzXG5cdFx0XHRcdHdpZHRoID0gc2hhcGVBcmdzLndpZHRoO1xuXHRcdFx0XHRsZWZ0ID0gbWF0aEZsb29yKHNoYXBlQXJncy54KTtcblx0XHRcdFx0cmlnaHQgPSBsZWZ0ICsgd2lkdGg7XG5cdFx0XHRcdGhhbGZXaWR0aCA9IG1hdGhSb3VuZCh3aWR0aCAvIDIpO1xuXHRcdFx0XHQvL2NyaXNwWCA9IG1hdGhSb3VuZChsZWZ0ICsgaGFsZldpZHRoKSArIGNyaXNwQ29ycjtcblx0XHRcdFx0cTFQbG90ID0gbWF0aEZsb29yKGRvUXVhcnRpbGVzID8gcG9pbnQucTFQbG90IDogcG9pbnQubG93UGxvdCk7Ly8gKyBjcmlzcENvcnI7XG5cdFx0XHRcdHEzUGxvdCA9IG1hdGhGbG9vcihkb1F1YXJ0aWxlcyA/IHBvaW50LnEzUGxvdCA6IHBvaW50Lmxvd1Bsb3QpOy8vICsgY3Jpc3BDb3JyO1xuXHRcdFx0XHRoaWdoUGxvdCA9IG1hdGhGbG9vcihwb2ludC5oaWdoUGxvdCk7Ly8gKyBjcmlzcENvcnI7XG5cdFx0XHRcdGxvd1Bsb3QgPSBtYXRoRmxvb3IocG9pbnQubG93UGxvdCk7Ly8gKyBjcmlzcENvcnI7XG5cdFx0XHRcdFxuXHRcdFx0XHQvLyBTdGVtIGF0dHJpYnV0ZXNcblx0XHRcdFx0c3RlbUF0dHIuc3Ryb2tlID0gcG9pbnQuc3RlbUNvbG9yIHx8IG9wdGlvbnMuc3RlbUNvbG9yIHx8IGNvbG9yO1xuXHRcdFx0XHRzdGVtQXR0clsnc3Ryb2tlLXdpZHRoJ10gPSBwaWNrKHBvaW50LnN0ZW1XaWR0aCwgb3B0aW9ucy5zdGVtV2lkdGgsIG9wdGlvbnMubGluZVdpZHRoKTtcblx0XHRcdFx0c3RlbUF0dHIuZGFzaHN0eWxlID0gcG9pbnQuc3RlbURhc2hTdHlsZSB8fCBvcHRpb25zLnN0ZW1EYXNoU3R5bGU7XG5cdFx0XHRcdFxuXHRcdFx0XHQvLyBXaGlza2VycyBhdHRyaWJ1dGVzXG5cdFx0XHRcdHdoaXNrZXJzQXR0ci5zdHJva2UgPSBwb2ludC53aGlza2VyQ29sb3IgfHwgb3B0aW9ucy53aGlza2VyQ29sb3IgfHwgY29sb3I7XG5cdFx0XHRcdHdoaXNrZXJzQXR0clsnc3Ryb2tlLXdpZHRoJ10gPSBwaWNrKHBvaW50LndoaXNrZXJXaWR0aCwgb3B0aW9ucy53aGlza2VyV2lkdGgsIG9wdGlvbnMubGluZVdpZHRoKTtcblx0XHRcdFx0XG5cdFx0XHRcdC8vIE1lZGlhbiBhdHRyaWJ1dGVzXG5cdFx0XHRcdG1lZGlhbkF0dHIuc3Ryb2tlID0gcG9pbnQubWVkaWFuQ29sb3IgfHwgb3B0aW9ucy5tZWRpYW5Db2xvciB8fCBjb2xvcjtcblx0XHRcdFx0bWVkaWFuQXR0clsnc3Ryb2tlLXdpZHRoJ10gPSBwaWNrKHBvaW50Lm1lZGlhbldpZHRoLCBvcHRpb25zLm1lZGlhbldpZHRoLCBvcHRpb25zLmxpbmVXaWR0aCk7XG5cdFx0XHRcdFxuXHRcdFx0XHRcblx0XHRcdFx0Ly8gVGhlIHN0ZW1cblx0XHRcdFx0Y3Jpc3BDb3JyID0gKHN0ZW1BdHRyWydzdHJva2Utd2lkdGgnXSAlIDIpIC8gMjtcblx0XHRcdFx0Y3Jpc3BYID0gbGVmdCArIGhhbGZXaWR0aCArIGNyaXNwQ29ycjtcdFx0XHRcdFxuXHRcdFx0XHRzdGVtUGF0aCA9IFtcblx0XHRcdFx0XHQvLyBzdGVtIHVwXG5cdFx0XHRcdFx0J00nLFxuXHRcdFx0XHRcdGNyaXNwWCwgcTNQbG90LFxuXHRcdFx0XHRcdCdMJyxcblx0XHRcdFx0XHRjcmlzcFgsIGhpZ2hQbG90LFxuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdC8vIHN0ZW0gZG93blxuXHRcdFx0XHRcdCdNJyxcblx0XHRcdFx0XHRjcmlzcFgsIHExUGxvdCxcblx0XHRcdFx0XHQnTCcsXG5cdFx0XHRcdFx0Y3Jpc3BYLCBsb3dQbG90LFxuXHRcdFx0XHRcdCd6J1xuXHRcdFx0XHRdO1xuXHRcdFx0XHRcblx0XHRcdFx0Ly8gVGhlIGJveFxuXHRcdFx0XHRpZiAoZG9RdWFydGlsZXMpIHtcblx0XHRcdFx0XHRjcmlzcENvcnIgPSAocG9pbnRBdHRyWydzdHJva2Utd2lkdGgnXSAlIDIpIC8gMjtcblx0XHRcdFx0XHRjcmlzcFggPSBtYXRoRmxvb3IoY3Jpc3BYKSArIGNyaXNwQ29ycjtcblx0XHRcdFx0XHRxMVBsb3QgPSBtYXRoRmxvb3IocTFQbG90KSArIGNyaXNwQ29ycjtcblx0XHRcdFx0XHRxM1Bsb3QgPSBtYXRoRmxvb3IocTNQbG90KSArIGNyaXNwQ29ycjtcblx0XHRcdFx0XHRsZWZ0ICs9IGNyaXNwQ29ycjtcblx0XHRcdFx0XHRyaWdodCArPSBjcmlzcENvcnI7XG5cdFx0XHRcdFx0Ym94UGF0aCA9IFtcblx0XHRcdFx0XHRcdCdNJyxcblx0XHRcdFx0XHRcdGxlZnQsIHEzUGxvdCxcblx0XHRcdFx0XHRcdCdMJyxcblx0XHRcdFx0XHRcdGxlZnQsIHExUGxvdCxcblx0XHRcdFx0XHRcdCdMJyxcblx0XHRcdFx0XHRcdHJpZ2h0LCBxMVBsb3QsXG5cdFx0XHRcdFx0XHQnTCcsXG5cdFx0XHRcdFx0XHRyaWdodCwgcTNQbG90LFxuXHRcdFx0XHRcdFx0J0wnLFxuXHRcdFx0XHRcdFx0bGVmdCwgcTNQbG90LFxuXHRcdFx0XHRcdFx0J3onXG5cdFx0XHRcdFx0XTtcblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdFx0Ly8gVGhlIHdoaXNrZXJzXG5cdFx0XHRcdGlmICh3aGlza2VyTGVuZ3RoKSB7XG5cdFx0XHRcdFx0Y3Jpc3BDb3JyID0gKHdoaXNrZXJzQXR0clsnc3Ryb2tlLXdpZHRoJ10gJSAyKSAvIDI7XG5cdFx0XHRcdFx0aGlnaFBsb3QgPSBoaWdoUGxvdCArIGNyaXNwQ29ycjtcblx0XHRcdFx0XHRsb3dQbG90ID0gbG93UGxvdCArIGNyaXNwQ29ycjtcblx0XHRcdFx0XHR3aGlza2Vyc1BhdGggPSBbXG5cdFx0XHRcdFx0XHQvLyBIaWdoIHdoaXNrZXJcblx0XHRcdFx0XHRcdCdNJyxcblx0XHRcdFx0XHRcdGNyaXNwWCAtIGhhbGZXaWR0aCAqIHdoaXNrZXJMZW5ndGgsIFxuXHRcdFx0XHRcdFx0aGlnaFBsb3QsXG5cdFx0XHRcdFx0XHQnTCcsXG5cdFx0XHRcdFx0XHRjcmlzcFggKyBoYWxmV2lkdGggKiB3aGlza2VyTGVuZ3RoLCBcblx0XHRcdFx0XHRcdGhpZ2hQbG90LFxuXHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHQvLyBMb3cgd2hpc2tlclxuXHRcdFx0XHRcdFx0J00nLFxuXHRcdFx0XHRcdFx0Y3Jpc3BYIC0gaGFsZldpZHRoICogd2hpc2tlckxlbmd0aCwgXG5cdFx0XHRcdFx0XHRsb3dQbG90LFxuXHRcdFx0XHRcdFx0J0wnLFxuXHRcdFx0XHRcdFx0Y3Jpc3BYICsgaGFsZldpZHRoICogd2hpc2tlckxlbmd0aCwgXG5cdFx0XHRcdFx0XHRsb3dQbG90XG5cdFx0XHRcdFx0XTtcblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdFx0Ly8gVGhlIG1lZGlhblxuXHRcdFx0XHRjcmlzcENvcnIgPSAobWVkaWFuQXR0clsnc3Ryb2tlLXdpZHRoJ10gJSAyKSAvIDI7XHRcdFx0XHRcblx0XHRcdFx0bWVkaWFuUGxvdCA9IG1hdGhSb3VuZChwb2ludC5tZWRpYW5QbG90KSArIGNyaXNwQ29ycjtcblx0XHRcdFx0bWVkaWFuUGF0aCA9IFtcblx0XHRcdFx0XHQnTScsXG5cdFx0XHRcdFx0bGVmdCwgXG5cdFx0XHRcdFx0bWVkaWFuUGxvdCxcblx0XHRcdFx0XHQnTCcsXG5cdFx0XHRcdFx0cmlnaHQsIFxuXHRcdFx0XHRcdG1lZGlhblBsb3QsXG5cdFx0XHRcdFx0J3onXG5cdFx0XHRcdF07XG5cdFx0XHRcdFxuXHRcdFx0XHQvLyBDcmVhdGUgb3IgdXBkYXRlIHRoZSBncmFwaGljc1xuXHRcdFx0XHRpZiAoZ3JhcGhpYykgeyAvLyB1cGRhdGVcblx0XHRcdFx0XHRcblx0XHRcdFx0XHRwb2ludC5zdGVtLmFuaW1hdGUoeyBkOiBzdGVtUGF0aCB9KTtcblx0XHRcdFx0XHRpZiAod2hpc2tlckxlbmd0aCkge1xuXHRcdFx0XHRcdFx0cG9pbnQud2hpc2tlcnMuYW5pbWF0ZSh7IGQ6IHdoaXNrZXJzUGF0aCB9KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYgKGRvUXVhcnRpbGVzKSB7XG5cdFx0XHRcdFx0XHRwb2ludC5ib3guYW5pbWF0ZSh7IGQ6IGJveFBhdGggfSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHBvaW50Lm1lZGlhblNoYXBlLmFuaW1hdGUoeyBkOiBtZWRpYW5QYXRoIH0pO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHR9IGVsc2UgeyAvLyBjcmVhdGUgbmV3XG5cdFx0XHRcdFx0cG9pbnQuZ3JhcGhpYyA9IGdyYXBoaWMgPSByZW5kZXJlci5nKClcblx0XHRcdFx0XHRcdC5hZGQoc2VyaWVzLmdyb3VwKTtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHRwb2ludC5zdGVtID0gcmVuZGVyZXIucGF0aChzdGVtUGF0aClcblx0XHRcdFx0XHRcdC5hdHRyKHN0ZW1BdHRyKVxuXHRcdFx0XHRcdFx0LmFkZChncmFwaGljKTtcblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdGlmICh3aGlza2VyTGVuZ3RoKSB7XG5cdFx0XHRcdFx0XHRwb2ludC53aGlza2VycyA9IHJlbmRlcmVyLnBhdGgod2hpc2tlcnNQYXRoKSBcblx0XHRcdFx0XHRcdFx0LmF0dHIod2hpc2tlcnNBdHRyKVxuXHRcdFx0XHRcdFx0XHQuYWRkKGdyYXBoaWMpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAoZG9RdWFydGlsZXMpIHtcblx0XHRcdFx0XHRcdHBvaW50LmJveCA9IHJlbmRlcmVyLnBhdGgoYm94UGF0aClcblx0XHRcdFx0XHRcdFx0LmF0dHIocG9pbnRBdHRyKVxuXHRcdFx0XHRcdFx0XHQuYWRkKGdyYXBoaWMpO1xuXHRcdFx0XHRcdH1cdFxuXHRcdFx0XHRcdHBvaW50Lm1lZGlhblNoYXBlID0gcmVuZGVyZXIucGF0aChtZWRpYW5QYXRoKVxuXHRcdFx0XHRcdFx0LmF0dHIobWVkaWFuQXR0cilcblx0XHRcdFx0XHRcdC5hZGQoZ3JhcGhpYyk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KTtcblxuXHR9XG5cblxufSk7XG5cbi8qICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqIEVuZCBCb3ggcGxvdCBzZXJpZXMgY29kZVx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdCpcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqIFN0YXJ0IGVycm9yIGJhciBzZXJpZXMgY29kZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuLy8gMSAtIHNldCBkZWZhdWx0IG9wdGlvbnNcbmRlZmF1bHRQbG90T3B0aW9ucy5lcnJvcmJhciA9IG1lcmdlKGRlZmF1bHRQbG90T3B0aW9ucy5ib3hwbG90LCB7XG5cdGNvbG9yOiAnIzAwMDAwMCcsXG5cdGdyb3VwaW5nOiBmYWxzZSxcblx0bGlua2VkVG86ICc6cHJldmlvdXMnLFxuXHR0b29sdGlwOiB7XG5cdFx0cG9pbnRGb3JtYXQ6IGRlZmF1bHRQbG90T3B0aW9ucy5hcmVhcmFuZ2UudG9vbHRpcC5wb2ludEZvcm1hdFxuXHR9LFxuXHR3aGlza2VyV2lkdGg6IG51bGxcbn0pO1xuXG4vLyAyIC0gQ3JlYXRlIHRoZSBzZXJpZXMgb2JqZWN0XG5zZXJpZXNUeXBlcy5lcnJvcmJhciA9IGV4dGVuZENsYXNzKHNlcmllc1R5cGVzLmJveHBsb3QsIHtcblx0dHlwZTogJ2Vycm9yYmFyJyxcblx0cG9pbnRBcnJheU1hcDogWydsb3cnLCAnaGlnaCddLCAvLyBhcnJheSBwb2ludCBjb25maWdzIGFyZSBtYXBwZWQgdG8gdGhpc1xuXHR0b1lEYXRhOiBmdW5jdGlvbiAocG9pbnQpIHsgLy8gcmV0dXJuIGEgcGxhaW4gYXJyYXkgZm9yIHNwZWVkeSBjYWxjdWxhdGlvblxuXHRcdHJldHVybiBbcG9pbnQubG93LCBwb2ludC5oaWdoXTtcblx0fSxcblx0cG9pbnRWYWxLZXk6ICdoaWdoJywgLy8gZGVmaW5lcyB0aGUgdG9wIG9mIHRoZSB0cmFja2VyXG5cdGRvUXVhcnRpbGVzOiBmYWxzZSxcblxuXHQvKipcblx0ICogR2V0IHRoZSB3aWR0aCBhbmQgWCBvZmZzZXQsIGVpdGhlciBvbiB0b3Agb2YgdGhlIGxpbmtlZCBzZXJpZXMgY29sdW1uXG5cdCAqIG9yIHN0YW5kYWxvbmVcblx0ICovXG5cdGdldENvbHVtbk1ldHJpY3M6IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gKHRoaXMubGlua2VkUGFyZW50ICYmIHRoaXMubGlua2VkUGFyZW50LmNvbHVtbk1ldHJpY3MpIHx8IFxuXHRcdFx0c2VyaWVzVHlwZXMuY29sdW1uLnByb3RvdHlwZS5nZXRDb2x1bW5NZXRyaWNzLmNhbGwodGhpcyk7XG5cdH1cbn0pO1xuXG4vKiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiBFbmQgZXJyb3IgYmFyIHNlcmllcyBjb2RlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiBTdGFydCBXYXRlcmZhbGwgc2VyaWVzIGNvZGUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbi8vIDEgLSBzZXQgZGVmYXVsdCBvcHRpb25zXG5kZWZhdWx0UGxvdE9wdGlvbnMud2F0ZXJmYWxsID0gbWVyZ2UoZGVmYXVsdFBsb3RPcHRpb25zLmNvbHVtbiwge1xuXHRsaW5lV2lkdGg6IDEsXG5cdGxpbmVDb2xvcjogJyMzMzMnLFxuXHRkYXNoU3R5bGU6ICdkb3QnLFxuXHRib3JkZXJDb2xvcjogJyMzMzMnXG59KTtcblxuXG4vLyAyIC0gQ3JlYXRlIHRoZSBzZXJpZXMgb2JqZWN0XG5zZXJpZXNUeXBlcy53YXRlcmZhbGwgPSBleHRlbmRDbGFzcyhzZXJpZXNUeXBlcy5jb2x1bW4sIHtcblx0dHlwZTogJ3dhdGVyZmFsbCcsXG5cblx0dXBDb2xvclByb3A6ICdmaWxsJyxcblxuXHRwb2ludEFycmF5TWFwOiBbJ2xvdycsICd5J10sXG5cblx0cG9pbnRWYWxLZXk6ICd5JyxcblxuXHQvKipcblx0ICogSW5pdCB3YXRlcmZhbGwgc2VyaWVzLCBmb3JjZSBzdGFja2luZ1xuXHQgKi9cblx0aW5pdDogZnVuY3Rpb24gKGNoYXJ0LCBvcHRpb25zKSB7XG5cdFx0Ly8gZm9yY2Ugc3RhY2tpbmdcblx0XHRvcHRpb25zLnN0YWNraW5nID0gdHJ1ZTtcblxuXHRcdHNlcmllc1R5cGVzLmNvbHVtbi5wcm90b3R5cGUuaW5pdC5jYWxsKHRoaXMsIGNoYXJ0LCBvcHRpb25zKTtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBUcmFuc2xhdGUgZGF0YSBwb2ludHMgZnJvbSByYXcgdmFsdWVzXG5cdCAqL1xuXHR0cmFuc2xhdGU6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgc2VyaWVzID0gdGhpcyxcblx0XHRcdG9wdGlvbnMgPSBzZXJpZXMub3B0aW9ucyxcblx0XHRcdGF4aXMgPSBzZXJpZXMueUF4aXMsXG5cdFx0XHRsZW4sXG5cdFx0XHRpLFxuXHRcdFx0cG9pbnRzLFxuXHRcdFx0cG9pbnQsXG5cdFx0XHRzaGFwZUFyZ3MsXG5cdFx0XHRzdGFjayxcblx0XHRcdHksXG5cdFx0XHRwcmV2aW91c1ksXG5cdFx0XHRzdGFja1BvaW50LFxuXHRcdFx0dGhyZXNob2xkID0gb3B0aW9ucy50aHJlc2hvbGQsXG5cdFx0XHRjcmlzcENvcnIgPSAob3B0aW9ucy5ib3JkZXJXaWR0aCAlIDIpIC8gMjtcblxuXHRcdC8vIHJ1biBjb2x1bW4gc2VyaWVzIHRyYW5zbGF0ZVxuXHRcdHNlcmllc1R5cGVzLmNvbHVtbi5wcm90b3R5cGUudHJhbnNsYXRlLmFwcGx5KHRoaXMpO1xuXG5cdFx0cHJldmlvdXNZID0gdGhyZXNob2xkO1xuXHRcdHBvaW50cyA9IHNlcmllcy5wb2ludHM7XG5cblx0XHRmb3IgKGkgPSAwLCBsZW4gPSBwb2ludHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdC8vIGNhY2hlIGN1cnJlbnQgcG9pbnQgb2JqZWN0XG5cdFx0XHRwb2ludCA9IHBvaW50c1tpXTtcblx0XHRcdHNoYXBlQXJncyA9IHBvaW50LnNoYXBlQXJncztcblxuXHRcdFx0Ly8gZ2V0IGN1cnJlbnQgc3RhY2tcblx0XHRcdHN0YWNrID0gc2VyaWVzLmdldFN0YWNrKGkpO1xuXHRcdFx0c3RhY2tQb2ludCA9IHN0YWNrLnBvaW50c1tzZXJpZXMuaW5kZXhdO1xuXG5cdFx0XHQvLyBvdmVycmlkZSBwb2ludCB2YWx1ZSBmb3Igc3Vtc1xuXHRcdFx0aWYgKGlzTmFOKHBvaW50LnkpKSB7XG5cdFx0XHRcdHBvaW50LnkgPSBzZXJpZXMueURhdGFbaV07XG5cdFx0XHR9XG5cblx0XHRcdC8vIHVwIHBvaW50c1xuXHRcdFx0eSA9IG1hdGhNYXgocHJldmlvdXNZLCBwcmV2aW91c1kgKyBwb2ludC55KSArIHN0YWNrUG9pbnRbMF07XG5cdFx0XHRzaGFwZUFyZ3MueSA9IGF4aXMudHJhbnNsYXRlKHksIDAsIDEpO1xuXG5cblx0XHRcdC8vIHN1bSBwb2ludHNcblx0XHRcdGlmIChwb2ludC5pc1N1bSB8fCBwb2ludC5pc0ludGVybWVkaWF0ZVN1bSkge1xuXHRcdFx0XHRzaGFwZUFyZ3MueSA9IGF4aXMudHJhbnNsYXRlKHN0YWNrUG9pbnRbMV0sIDAsIDEpO1xuXHRcdFx0XHRzaGFwZUFyZ3MuaGVpZ2h0ID0gYXhpcy50cmFuc2xhdGUoc3RhY2tQb2ludFswXSwgMCwgMSkgLSBzaGFwZUFyZ3MueTtcblxuXHRcdFx0Ly8gaWYgaXQncyBub3QgdGhlIHN1bSBwb2ludCwgdXBkYXRlIHByZXZpb3VzIHN0YWNrIGVuZCBwb3NpdGlvblxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cHJldmlvdXNZICs9IHN0YWNrLnRvdGFsO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBuZWdhdGl2ZSBwb2ludHNcblx0XHRcdGlmIChzaGFwZUFyZ3MuaGVpZ2h0IDwgMCkge1xuXHRcdFx0XHRzaGFwZUFyZ3MueSArPSBzaGFwZUFyZ3MuaGVpZ2h0O1xuXHRcdFx0XHRzaGFwZUFyZ3MuaGVpZ2h0ICo9IC0xO1xuXHRcdFx0fVxuXG5cdFx0XHRwb2ludC5wbG90WSA9IHNoYXBlQXJncy55ID0gbWF0aFJvdW5kKHNoYXBlQXJncy55KSAtIGNyaXNwQ29ycjtcblx0XHRcdHNoYXBlQXJncy5oZWlnaHQgPSBtYXRoUm91bmQoc2hhcGVBcmdzLmhlaWdodCk7XG5cdFx0XHRwb2ludC55Qm90dG9tID0gc2hhcGVBcmdzLnkgKyBzaGFwZUFyZ3MuaGVpZ2h0O1xuXHRcdH1cblx0fSxcblxuXHQvKipcblx0ICogQ2FsbCBkZWZhdWx0IHByb2Nlc3NEYXRhIHRoZW4gb3ZlcnJpZGUgeURhdGEgdG8gcmVmbGVjdCB3YXRlcmZhbGwncyBleHRyZW1lcyBvbiB5QXhpc1xuXHQgKi9cblx0cHJvY2Vzc0RhdGE6IGZ1bmN0aW9uIChmb3JjZSkge1xuXHRcdHZhciBzZXJpZXMgPSB0aGlzLFxuXHRcdFx0b3B0aW9ucyA9IHNlcmllcy5vcHRpb25zLFxuXHRcdFx0eURhdGEgPSBzZXJpZXMueURhdGEsXG5cdFx0XHRwb2ludHMgPSBzZXJpZXMucG9pbnRzLFxuXHRcdFx0cG9pbnQsXG5cdFx0XHRkYXRhTGVuZ3RoID0geURhdGEubGVuZ3RoLFxuXHRcdFx0dGhyZXNob2xkID0gb3B0aW9ucy50aHJlc2hvbGQgfHwgMCxcblx0XHRcdHN1YlN1bSxcblx0XHRcdHN1bSxcblx0XHRcdGRhdGFNaW4sXG5cdFx0XHRkYXRhTWF4LFxuXHRcdFx0eSxcblx0XHRcdGk7XG5cblx0XHRzdW0gPSBzdWJTdW0gPSBkYXRhTWluID0gZGF0YU1heCA9IHRocmVzaG9sZDtcblxuXHRcdGZvciAoaSA9IDA7IGkgPCBkYXRhTGVuZ3RoOyBpKyspIHtcblx0XHRcdHkgPSB5RGF0YVtpXTtcblx0XHRcdHBvaW50ID0gcG9pbnRzICYmIHBvaW50c1tpXSA/IHBvaW50c1tpXSA6IHt9O1xuXG5cdFx0XHRpZiAoeSA9PT0gXCJzdW1cIiB8fCBwb2ludC5pc1N1bSkge1xuXHRcdFx0XHR5RGF0YVtpXSA9IHN1bTtcblx0XHRcdH0gZWxzZSBpZiAoeSA9PT0gXCJpbnRlcm1lZGlhdGVTdW1cIiB8fCBwb2ludC5pc0ludGVybWVkaWF0ZVN1bSkge1xuXHRcdFx0XHR5RGF0YVtpXSA9IHN1YlN1bTtcblx0XHRcdFx0c3ViU3VtID0gdGhyZXNob2xkO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0c3VtICs9IHk7XG5cdFx0XHRcdHN1YlN1bSArPSB5O1xuXHRcdFx0fVxuXHRcdFx0ZGF0YU1pbiA9IE1hdGgubWluKHN1bSwgZGF0YU1pbik7XG5cdFx0XHRkYXRhTWF4ID0gTWF0aC5tYXgoc3VtLCBkYXRhTWF4KTtcblx0XHR9XG5cblx0XHRTZXJpZXMucHJvdG90eXBlLnByb2Nlc3NEYXRhLmNhbGwodGhpcywgZm9yY2UpO1xuXG5cdFx0Ly8gUmVjb3JkIGV4dHJlbWVzXG5cdFx0c2VyaWVzLmRhdGFNaW4gPSBkYXRhTWluO1xuXHRcdHNlcmllcy5kYXRhTWF4ID0gZGF0YU1heDtcblx0fSxcblxuXHQvKipcblx0ICogUmV0dXJuIHkgdmFsdWUgb3Igc3RyaW5nIGlmIHBvaW50IGlzIHN1bVxuXHQgKi9cblx0dG9ZRGF0YTogZnVuY3Rpb24gKHB0KSB7XG5cdFx0aWYgKHB0LmlzU3VtKSB7XG5cdFx0XHRyZXR1cm4gXCJzdW1cIjtcblx0XHR9IGVsc2UgaWYgKHB0LmlzSW50ZXJtZWRpYXRlU3VtKSB7XG5cdFx0XHRyZXR1cm4gXCJpbnRlcm1lZGlhdGVTdW1cIjtcblx0XHR9XG5cblx0XHRyZXR1cm4gcHQueTtcblx0fSxcblxuXHQvKipcblx0ICogUG9zdHByb2Nlc3MgbWFwcGluZyBiZXR3ZWVuIG9wdGlvbnMgYW5kIFNWRyBhdHRyaWJ1dGVzXG5cdCAqL1xuXHRnZXRBdHRyaWJzOiBmdW5jdGlvbiAoKSB7XG5cdFx0c2VyaWVzVHlwZXMuY29sdW1uLnByb3RvdHlwZS5nZXRBdHRyaWJzLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cblx0XHR2YXIgc2VyaWVzID0gdGhpcyxcblx0XHRcdG9wdGlvbnMgPSBzZXJpZXMub3B0aW9ucyxcblx0XHRcdHN0YXRlT3B0aW9ucyA9IG9wdGlvbnMuc3RhdGVzLFxuXHRcdFx0dXBDb2xvciA9IG9wdGlvbnMudXBDb2xvciB8fCBzZXJpZXMuY29sb3IsXG5cdFx0XHRob3ZlckNvbG9yID0gSGlnaGNoYXJ0cy5Db2xvcih1cENvbG9yKS5icmlnaHRlbigwLjEpLmdldCgpLFxuXHRcdFx0c2VyaWVzRG93blBvaW50QXR0ciA9IG1lcmdlKHNlcmllcy5wb2ludEF0dHIpLFxuXHRcdFx0dXBDb2xvclByb3AgPSBzZXJpZXMudXBDb2xvclByb3A7XG5cblx0XHRzZXJpZXNEb3duUG9pbnRBdHRyWycnXVt1cENvbG9yUHJvcF0gPSB1cENvbG9yO1xuXHRcdHNlcmllc0Rvd25Qb2ludEF0dHIuaG92ZXJbdXBDb2xvclByb3BdID0gc3RhdGVPcHRpb25zLmhvdmVyLnVwQ29sb3IgfHwgaG92ZXJDb2xvcjtcblx0XHRzZXJpZXNEb3duUG9pbnRBdHRyLnNlbGVjdFt1cENvbG9yUHJvcF0gPSBzdGF0ZU9wdGlvbnMuc2VsZWN0LnVwQ29sb3IgfHwgdXBDb2xvcjtcblxuXHRcdGVhY2goc2VyaWVzLnBvaW50cywgZnVuY3Rpb24gKHBvaW50KSB7XG5cdFx0XHRpZiAocG9pbnQueSA+IDAgJiYgIXBvaW50LmNvbG9yKSB7XG5cdFx0XHRcdHBvaW50LnBvaW50QXR0ciA9IHNlcmllc0Rvd25Qb2ludEF0dHI7XG5cdFx0XHRcdHBvaW50LmNvbG9yID0gdXBDb2xvcjtcblx0XHRcdH1cblx0XHR9KTtcblx0fSxcblxuXHQvKipcblx0ICogRHJhdyBjb2x1bW5zJyBjb25uZWN0b3IgbGluZXNcblx0ICovXG5cdGdldEdyYXBoUGF0aDogZnVuY3Rpb24gKCkge1xuXG5cdFx0dmFyIGRhdGEgPSB0aGlzLmRhdGEsXG5cdFx0XHRsZW5ndGggPSBkYXRhLmxlbmd0aCxcblx0XHRcdGxpbmVXaWR0aCA9IHRoaXMub3B0aW9ucy5saW5lV2lkdGggKyB0aGlzLm9wdGlvbnMuYm9yZGVyV2lkdGgsXG5cdFx0XHRub3JtYWxpemVyID0gbWF0aFJvdW5kKGxpbmVXaWR0aCkgJSAyIC8gMixcblx0XHRcdHBhdGggPSBbXSxcblx0XHRcdE0gPSAnTScsXG5cdFx0XHRMID0gJ0wnLFxuXHRcdFx0cHJldkFyZ3MsXG5cdFx0XHRwb2ludEFyZ3MsXG5cdFx0XHRpLFxuXHRcdFx0ZDtcblxuXHRcdGZvciAoaSA9IDE7IGkgPCBsZW5ndGg7IGkrKykge1xuXHRcdFx0cG9pbnRBcmdzID0gZGF0YVtpXS5zaGFwZUFyZ3M7XG5cdFx0XHRwcmV2QXJncyA9IGRhdGFbaSAtIDFdLnNoYXBlQXJncztcblxuXHRcdFx0ZCA9IFtcblx0XHRcdFx0TSxcblx0XHRcdFx0cHJldkFyZ3MueCArIHByZXZBcmdzLndpZHRoLCBwcmV2QXJncy55ICsgbm9ybWFsaXplcixcblx0XHRcdFx0TCxcblx0XHRcdFx0cG9pbnRBcmdzLngsIHByZXZBcmdzLnkgKyBub3JtYWxpemVyXG5cdFx0XHRdO1xuXG5cdFx0XHRpZiAoZGF0YVtpIC0gMV0ueSA8IDApIHtcblx0XHRcdFx0ZFsyXSArPSBwcmV2QXJncy5oZWlnaHQ7XG5cdFx0XHRcdGRbNV0gKz0gcHJldkFyZ3MuaGVpZ2h0O1xuXHRcdFx0fVxuXG5cdFx0XHRwYXRoID0gcGF0aC5jb25jYXQoZCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHBhdGg7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEV4dHJlbWVzIGFyZSByZWNvcmRlZCBpbiBwcm9jZXNzRGF0YVxuXHQgKi9cblx0Z2V0RXh0cmVtZXM6IG5vb3AsXG5cblx0LyoqXG5cdCAqIFJldHVybiBzdGFjayBmb3IgZ2l2ZW4gaW5kZXhcblx0ICovXG5cdGdldFN0YWNrOiBmdW5jdGlvbiAoaSkge1xuXHRcdHZhciBheGlzID0gdGhpcy55QXhpcyxcblx0XHRcdHN0YWNrcyA9IGF4aXMuc3RhY2tzLFxuXHRcdFx0a2V5ID0gdGhpcy5zdGFja0tleTtcblxuXHRcdGlmICh0aGlzLnByb2Nlc3NlZFlEYXRhW2ldIDwgdGhpcy5vcHRpb25zLnRocmVzaG9sZCkge1xuXHRcdFx0a2V5ID0gJy0nICsga2V5O1xuXHRcdH1cblxuXHRcdHJldHVybiBzdGFja3Nba2V5XVtpXTtcblx0fSxcblxuXHRkcmF3R3JhcGg6IFNlcmllcy5wcm90b3R5cGUuZHJhd0dyYXBoXG59KTtcblxuLyogKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogRW5kIFdhdGVyZmFsbCBzZXJpZXMgY29kZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyogKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogU3RhcnQgQnViYmxlIHNlcmllcyBjb2RlXHRcdFx0XHRcdFx0XHRcdFx0XHRcdCAgICAgICAgICAqXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbi8vIDEgLSBzZXQgZGVmYXVsdCBvcHRpb25zXG5kZWZhdWx0UGxvdE9wdGlvbnMuYnViYmxlID0gbWVyZ2UoZGVmYXVsdFBsb3RPcHRpb25zLnNjYXR0ZXIsIHtcblx0ZGF0YUxhYmVsczoge1xuXHRcdGluc2lkZTogdHJ1ZSxcblx0XHRzdHlsZToge1xuXHRcdFx0Y29sb3I6ICd3aGl0ZScsXG5cdFx0XHR0ZXh0U2hhZG93OiAnMHB4IDBweCAzcHggYmxhY2snXG5cdFx0fSxcblx0XHR2ZXJ0aWNhbEFsaWduOiAnbWlkZGxlJ1xuXHR9LFxuXHQvLyBkaXNwbGF5TmVnYXRpdmU6IHRydWUsXG5cdG1hcmtlcjoge1xuXHRcdC8vIGZpbGxPcGFjaXR5OiAwLjUsXG5cdFx0bGluZUNvbG9yOiBudWxsLCAvLyBpbmhlcml0IGZyb20gc2VyaWVzLmNvbG9yXG5cdFx0bGluZVdpZHRoOiAxXG5cdH0sXG5cdG1pblNpemU6IDgsXG5cdG1heFNpemU6ICcyMCUnLFxuXHQvLyBuZWdhdGl2ZUNvbG9yOiBudWxsLFxuXHR0b29sdGlwOiB7XG5cdFx0cG9pbnRGb3JtYXQ6ICcoe3BvaW50Lnh9LCB7cG9pbnQueX0pLCBTaXplOiB7cG9pbnQuen0nXG5cdH0sXG5cdHR1cmJvVGhyZXNob2xkOiAwLFxuXHR6VGhyZXNob2xkOiAwXG59KTtcblxuLy8gMiAtIENyZWF0ZSB0aGUgc2VyaWVzIG9iamVjdFxuc2VyaWVzVHlwZXMuYnViYmxlID0gZXh0ZW5kQ2xhc3Moc2VyaWVzVHlwZXMuc2NhdHRlciwge1xuXHR0eXBlOiAnYnViYmxlJyxcblx0cG9pbnRBcnJheU1hcDogWyd5JywgJ3onXSxcblx0dHJhY2tlckdyb3VwczogWydncm91cCcsICdkYXRhTGFiZWxzR3JvdXAnXSxcblx0XG5cdC8qKlxuXHQgKiBNYXBwaW5nIGJldHdlZW4gU1ZHIGF0dHJpYnV0ZXMgYW5kIHRoZSBjb3JyZXNwb25kaW5nIG9wdGlvbnNcblx0ICovXG5cdHBvaW50QXR0clRvT3B0aW9uczogeyBcblx0XHRzdHJva2U6ICdsaW5lQ29sb3InLFxuXHRcdCdzdHJva2Utd2lkdGgnOiAnbGluZVdpZHRoJyxcblx0XHRmaWxsOiAnZmlsbENvbG9yJ1xuXHR9LFxuXHRcblx0LyoqXG5cdCAqIEFwcGx5IHRoZSBmaWxsT3BhY2l0eSB0byBhbGwgZmlsbCBwb3NpdGlvbnNcblx0ICovXG5cdGFwcGx5T3BhY2l0eTogZnVuY3Rpb24gKGZpbGwpIHtcblx0XHR2YXIgbWFya2VyT3B0aW9ucyA9IHRoaXMub3B0aW9ucy5tYXJrZXIsXG5cdFx0XHRmaWxsT3BhY2l0eSA9IHBpY2sobWFya2VyT3B0aW9ucy5maWxsT3BhY2l0eSwgMC41KTtcblx0XHRcblx0XHQvLyBXaGVuIGNhbGxlZCBmcm9tIExlZ2VuZC5jb2xvcml6ZUl0ZW0sIHRoZSBmaWxsIGlzbid0IHByZWRlZmluZWRcblx0XHRmaWxsID0gZmlsbCB8fCBtYXJrZXJPcHRpb25zLmZpbGxDb2xvciB8fCB0aGlzLmNvbG9yOyBcblx0XHRcblx0XHRpZiAoZmlsbE9wYWNpdHkgIT09IDEpIHtcblx0XHRcdGZpbGwgPSBIaWdoY2hhcnRzLkNvbG9yKGZpbGwpLnNldE9wYWNpdHkoZmlsbE9wYWNpdHkpLmdldCgncmdiYScpO1xuXHRcdH1cblx0XHRyZXR1cm4gZmlsbDtcblx0fSxcblx0XG5cdC8qKlxuXHQgKiBFeHRlbmQgdGhlIGNvbnZlcnRBdHRyaWJzIG1ldGhvZCBieSBhcHBseWluZyBvcGFjaXR5IHRvIHRoZSBmaWxsXG5cdCAqL1xuXHRjb252ZXJ0QXR0cmliczogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBvYmogPSBTZXJpZXMucHJvdG90eXBlLmNvbnZlcnRBdHRyaWJzLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cdFx0XG5cdFx0b2JqLmZpbGwgPSB0aGlzLmFwcGx5T3BhY2l0eShvYmouZmlsbCk7XG5cdFx0XG5cdFx0cmV0dXJuIG9iajtcblx0fSxcblxuXHQvKipcblx0ICogR2V0IHRoZSByYWRpdXMgZm9yIGVhY2ggcG9pbnQgYmFzZWQgb24gdGhlIG1pblNpemUsIG1heFNpemUgYW5kIGVhY2ggcG9pbnQncyBaIHZhbHVlLiBUaGlzXG5cdCAqIG11c3QgYmUgZG9uZSBwcmlvciB0byBTZXJpZXMudHJhbnNsYXRlIGJlY2F1c2UgdGhlIGF4aXMgbmVlZHMgdG8gYWRkIHBhZGRpbmcgaW4gXG5cdCAqIGFjY29yZGFuY2Ugd2l0aCB0aGUgcG9pbnQgc2l6ZXMuXG5cdCAqL1xuXHRnZXRSYWRpaTogZnVuY3Rpb24gKHpNaW4sIHpNYXgsIG1pblNpemUsIG1heFNpemUpIHtcblx0XHR2YXIgbGVuLFxuXHRcdFx0aSxcblx0XHRcdHBvcyxcblx0XHRcdHpEYXRhID0gdGhpcy56RGF0YSxcblx0XHRcdHJhZGlpID0gW10sXG5cdFx0XHR6UmFuZ2U7XG5cdFx0XG5cdFx0Ly8gU2V0IHRoZSBzaGFwZSB0eXBlIGFuZCBhcmd1bWVudHMgdG8gYmUgcGlja2VkIHVwIGluIGRyYXdQb2ludHNcblx0XHRmb3IgKGkgPSAwLCBsZW4gPSB6RGF0YS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0elJhbmdlID0gek1heCAtIHpNaW47XG5cdFx0XHRwb3MgPSB6UmFuZ2UgPiAwID8gLy8gcmVsYXRpdmUgc2l6ZSwgYSBudW1iZXIgYmV0d2VlbiAwIGFuZCAxXG5cdFx0XHRcdCh6RGF0YVtpXSAtIHpNaW4pIC8gKHpNYXggLSB6TWluKSA6IFxuXHRcdFx0XHQwLjU7XG5cdFx0XHRyYWRpaS5wdXNoKG1hdGguY2VpbChtaW5TaXplICsgcG9zICogKG1heFNpemUgLSBtaW5TaXplKSkgLyAyKTtcblx0XHR9XG5cdFx0dGhpcy5yYWRpaSA9IHJhZGlpO1xuXHR9LFxuXHRcblx0LyoqXG5cdCAqIFBlcmZvcm0gYW5pbWF0aW9uIG9uIHRoZSBidWJibGVzXG5cdCAqL1xuXHRhbmltYXRlOiBmdW5jdGlvbiAoaW5pdCkge1xuXHRcdHZhciBhbmltYXRpb24gPSB0aGlzLm9wdGlvbnMuYW5pbWF0aW9uO1xuXHRcdFxuXHRcdGlmICghaW5pdCkgeyAvLyBydW4gdGhlIGFuaW1hdGlvblxuXHRcdFx0ZWFjaCh0aGlzLnBvaW50cywgZnVuY3Rpb24gKHBvaW50KSB7XG5cdFx0XHRcdHZhciBncmFwaGljID0gcG9pbnQuZ3JhcGhpYyxcblx0XHRcdFx0XHRzaGFwZUFyZ3MgPSBwb2ludC5zaGFwZUFyZ3M7XG5cblx0XHRcdFx0aWYgKGdyYXBoaWMgJiYgc2hhcGVBcmdzKSB7XG5cdFx0XHRcdFx0Ly8gc3RhcnQgdmFsdWVzXG5cdFx0XHRcdFx0Z3JhcGhpYy5hdHRyKCdyJywgMSk7XG5cblx0XHRcdFx0XHQvLyBhbmltYXRlXG5cdFx0XHRcdFx0Z3JhcGhpYy5hbmltYXRlKHtcblx0XHRcdFx0XHRcdHI6IHNoYXBlQXJncy5yXG5cdFx0XHRcdFx0fSwgYW5pbWF0aW9uKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdC8vIGRlbGV0ZSB0aGlzIGZ1bmN0aW9uIHRvIGFsbG93IGl0IG9ubHkgb25jZVxuXHRcdFx0dGhpcy5hbmltYXRlID0gbnVsbDtcblx0XHR9XG5cdH0sXG5cdFxuXHQvKipcblx0ICogRXh0ZW5kIHRoZSBiYXNlIHRyYW5zbGF0ZSBtZXRob2QgdG8gaGFuZGxlIGJ1YmJsZSBzaXplXG5cdCAqL1xuXHR0cmFuc2xhdGU6IGZ1bmN0aW9uICgpIHtcblx0XHRcblx0XHR2YXIgaSxcblx0XHRcdGRhdGEgPSB0aGlzLmRhdGEsXG5cdFx0XHRwb2ludCxcblx0XHRcdHJhZGl1cyxcblx0XHRcdHJhZGlpID0gdGhpcy5yYWRpaTtcblx0XHRcblx0XHQvLyBSdW4gdGhlIHBhcmVudCBtZXRob2Rcblx0XHRzZXJpZXNUeXBlcy5zY2F0dGVyLnByb3RvdHlwZS50cmFuc2xhdGUuY2FsbCh0aGlzKTtcblx0XHRcblx0XHQvLyBTZXQgdGhlIHNoYXBlIHR5cGUgYW5kIGFyZ3VtZW50cyB0byBiZSBwaWNrZWQgdXAgaW4gZHJhd1BvaW50c1xuXHRcdGkgPSBkYXRhLmxlbmd0aDtcblx0XHRcblx0XHR3aGlsZSAoaS0tKSB7XG5cdFx0XHRwb2ludCA9IGRhdGFbaV07XG5cdFx0XHRyYWRpdXMgPSByYWRpaSA/IHJhZGlpW2ldIDogMDsgLy8gIzE3MzdcblxuXHRcdFx0Ly8gRmxhZyBmb3IgbmVnYXRpdmVDb2xvciB0byBiZSBhcHBsaWVkIGluIFNlcmllcy5qc1xuXHRcdFx0cG9pbnQubmVnYXRpdmUgPSBwb2ludC56IDwgKHRoaXMub3B0aW9ucy56VGhyZXNob2xkIHx8IDApO1xuXHRcdFx0XG5cdFx0XHRpZiAocmFkaXVzID49IHRoaXMubWluUHhTaXplIC8gMikge1xuXHRcdFx0XHQvLyBTaGFwZSBhcmd1bWVudHNcblx0XHRcdFx0cG9pbnQuc2hhcGVUeXBlID0gJ2NpcmNsZSc7XG5cdFx0XHRcdHBvaW50LnNoYXBlQXJncyA9IHtcblx0XHRcdFx0XHR4OiBwb2ludC5wbG90WCxcblx0XHRcdFx0XHR5OiBwb2ludC5wbG90WSxcblx0XHRcdFx0XHRyOiByYWRpdXNcblx0XHRcdFx0fTtcblx0XHRcdFx0XG5cdFx0XHRcdC8vIEFsaWdubWVudCBib3ggZm9yIHRoZSBkYXRhIGxhYmVsXG5cdFx0XHRcdHBvaW50LmRsQm94ID0ge1xuXHRcdFx0XHRcdHg6IHBvaW50LnBsb3RYIC0gcmFkaXVzLFxuXHRcdFx0XHRcdHk6IHBvaW50LnBsb3RZIC0gcmFkaXVzLFxuXHRcdFx0XHRcdHdpZHRoOiAyICogcmFkaXVzLFxuXHRcdFx0XHRcdGhlaWdodDogMiAqIHJhZGl1c1xuXHRcdFx0XHR9O1xuXHRcdFx0fSBlbHNlIHsgLy8gYmVsb3cgelRocmVzaG9sZFxuXHRcdFx0XHRwb2ludC5zaGFwZUFyZ3MgPSBwb2ludC5wbG90WSA9IHBvaW50LmRsQm94ID0gVU5ERUZJTkVEOyAvLyAjMTY5MVxuXHRcdFx0fVxuXHRcdH1cblx0fSxcblx0XG5cdC8qKlxuXHQgKiBHZXQgdGhlIHNlcmllcycgc3ltYm9sIGluIHRoZSBsZWdlbmRcblx0ICogXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBsZWdlbmQgVGhlIGxlZ2VuZCBvYmplY3Rcblx0ICogQHBhcmFtIHtPYmplY3R9IGl0ZW0gVGhlIHNlcmllcyAodGhpcykgb3IgcG9pbnRcblx0ICovXG5cdGRyYXdMZWdlbmRTeW1ib2w6IGZ1bmN0aW9uIChsZWdlbmQsIGl0ZW0pIHtcblx0XHR2YXIgcmFkaXVzID0gcEludChsZWdlbmQuaXRlbVN0eWxlLmZvbnRTaXplKSAvIDI7XG5cdFx0XG5cdFx0aXRlbS5sZWdlbmRTeW1ib2wgPSB0aGlzLmNoYXJ0LnJlbmRlcmVyLmNpcmNsZShcblx0XHRcdHJhZGl1cyxcblx0XHRcdGxlZ2VuZC5iYXNlbGluZSAtIHJhZGl1cyxcblx0XHRcdHJhZGl1c1xuXHRcdCkuYXR0cih7XG5cdFx0XHR6SW5kZXg6IDNcblx0XHR9KS5hZGQoaXRlbS5sZWdlbmRHcm91cCk7XG5cdFx0aXRlbS5sZWdlbmRTeW1ib2wuaXNNYXJrZXIgPSB0cnVlO1x0XG5cdFx0XG5cdH0sXG5cdFxuXHRkcmF3UG9pbnRzOiBzZXJpZXNUeXBlcy5jb2x1bW4ucHJvdG90eXBlLmRyYXdQb2ludHMsXG5cdGFsaWduRGF0YUxhYmVsOiBzZXJpZXNUeXBlcy5jb2x1bW4ucHJvdG90eXBlLmFsaWduRGF0YUxhYmVsXG59KTtcblxuLyoqXG4gKiBBZGQgbG9naWMgdG8gcGFkIGVhY2ggYXhpcyB3aXRoIHRoZSBhbW91bnQgb2YgcGl4ZWxzXG4gKiBuZWNlc3NhcnkgdG8gYXZvaWQgdGhlIGJ1YmJsZXMgdG8gb3ZlcmZsb3cuXG4gKi9cbkF4aXMucHJvdG90eXBlLmJlZm9yZVBhZGRpbmcgPSBmdW5jdGlvbiAoKSB7XG5cdHZhciBheGlzID0gdGhpcyxcblx0XHRheGlzTGVuZ3RoID0gdGhpcy5sZW4sXG5cdFx0Y2hhcnQgPSB0aGlzLmNoYXJ0LFxuXHRcdHB4TWluID0gMCwgXG5cdFx0cHhNYXggPSBheGlzTGVuZ3RoLFxuXHRcdGlzWEF4aXMgPSB0aGlzLmlzWEF4aXMsXG5cdFx0ZGF0YUtleSA9IGlzWEF4aXMgPyAneERhdGEnIDogJ3lEYXRhJyxcblx0XHRtaW4gPSB0aGlzLm1pbixcblx0XHRleHRyZW1lcyA9IHt9LFxuXHRcdHNtYWxsZXN0U2l6ZSA9IG1hdGgubWluKGNoYXJ0LnBsb3RXaWR0aCwgY2hhcnQucGxvdEhlaWdodCksXG5cdFx0ek1pbiA9IE51bWJlci5NQVhfVkFMVUUsXG5cdFx0ek1heCA9IC1OdW1iZXIuTUFYX1ZBTFVFLFxuXHRcdHJhbmdlID0gdGhpcy5tYXggLSBtaW4sXG5cdFx0dHJhbnNBID0gYXhpc0xlbmd0aCAvIHJhbmdlLFxuXHRcdGFjdGl2ZVNlcmllcyA9IFtdO1xuXG5cdC8vIEhhbmRsZSBwYWRkaW5nIG9uIHRoZSBzZWNvbmQgcGFzcywgb3Igb24gcmVkcmF3XG5cdGlmICh0aGlzLnRpY2tQb3NpdGlvbnMpIHtcblx0XHRlYWNoKHRoaXMuc2VyaWVzLCBmdW5jdGlvbiAoc2VyaWVzKSB7XG5cblx0XHRcdHZhciBzZXJpZXNPcHRpb25zID0gc2VyaWVzLm9wdGlvbnMsXG5cdFx0XHRcdHpEYXRhO1xuXG5cdFx0XHRpZiAoc2VyaWVzLnR5cGUgPT09ICdidWJibGUnICYmIHNlcmllcy52aXNpYmxlKSB7XG5cblx0XHRcdFx0Ly8gQ29ycmVjdGlvbiBmb3IgIzE2NzNcblx0XHRcdFx0YXhpcy5hbGxvd1pvb21PdXRzaWRlID0gdHJ1ZTtcblxuXHRcdFx0XHQvLyBDYWNoZSBpdFxuXHRcdFx0XHRhY3RpdmVTZXJpZXMucHVzaChzZXJpZXMpO1xuXG5cdFx0XHRcdGlmIChpc1hBeGlzKSB7IC8vIGJlY2F1c2UgWCBheGlzIGlzIGV2YWx1YXRlZCBmaXJzdFxuXHRcdFx0XHRcblx0XHRcdFx0XHQvLyBGb3IgZWFjaCBzZXJpZXMsIHRyYW5zbGF0ZSB0aGUgc2l6ZSBleHRyZW1lcyB0byBwaXhlbCB2YWx1ZXNcblx0XHRcdFx0XHRlYWNoKFsnbWluU2l6ZScsICdtYXhTaXplJ10sIGZ1bmN0aW9uIChwcm9wKSB7XG5cdFx0XHRcdFx0XHR2YXIgbGVuZ3RoID0gc2VyaWVzT3B0aW9uc1twcm9wXSxcblx0XHRcdFx0XHRcdFx0aXNQZXJjZW50ID0gLyUkLy50ZXN0KGxlbmd0aCk7XG5cdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdGxlbmd0aCA9IHBJbnQobGVuZ3RoKTtcblx0XHRcdFx0XHRcdGV4dHJlbWVzW3Byb3BdID0gaXNQZXJjZW50ID9cblx0XHRcdFx0XHRcdFx0c21hbGxlc3RTaXplICogbGVuZ3RoIC8gMTAwIDpcblx0XHRcdFx0XHRcdFx0bGVuZ3RoO1xuXHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0c2VyaWVzLm1pblB4U2l6ZSA9IGV4dHJlbWVzLm1pblNpemU7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0Ly8gRmluZCB0aGUgbWluIGFuZCBtYXggWlxuXHRcdFx0XHRcdHpEYXRhID0gc2VyaWVzLnpEYXRhO1xuXHRcdFx0XHRcdGlmICh6RGF0YS5sZW5ndGgpIHsgLy8gIzE3MzVcblx0XHRcdFx0XHRcdHpNaW4gPSBtYXRoLm1pbihcblx0XHRcdFx0XHRcdFx0ek1pbixcblx0XHRcdFx0XHRcdFx0bWF0aC5tYXgoXG5cdFx0XHRcdFx0XHRcdFx0YXJyYXlNaW4oekRhdGEpLCBcblx0XHRcdFx0XHRcdFx0XHRzZXJpZXNPcHRpb25zLmRpc3BsYXlOZWdhdGl2ZSA9PT0gZmFsc2UgPyBzZXJpZXNPcHRpb25zLnpUaHJlc2hvbGQgOiAtTnVtYmVyLk1BWF9WQUxVRVxuXHRcdFx0XHRcdFx0XHQpXG5cdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdFx0ek1heCA9IG1hdGgubWF4KHpNYXgsIGFycmF5TWF4KHpEYXRhKSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRlYWNoKGFjdGl2ZVNlcmllcywgZnVuY3Rpb24gKHNlcmllcykge1xuXG5cdFx0XHR2YXIgZGF0YSA9IHNlcmllc1tkYXRhS2V5XSxcblx0XHRcdFx0aSA9IGRhdGEubGVuZ3RoLFxuXHRcdFx0XHRyYWRpdXM7XG5cblx0XHRcdGlmIChpc1hBeGlzKSB7XG5cdFx0XHRcdHNlcmllcy5nZXRSYWRpaSh6TWluLCB6TWF4LCBleHRyZW1lcy5taW5TaXplLCBleHRyZW1lcy5tYXhTaXplKTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0aWYgKHJhbmdlID4gMCkge1xuXHRcdFx0XHR3aGlsZSAoaS0tKSB7XG5cdFx0XHRcdFx0cmFkaXVzID0gc2VyaWVzLnJhZGlpW2ldO1xuXHRcdFx0XHRcdHB4TWluID0gTWF0aC5taW4oKChkYXRhW2ldIC0gbWluKSAqIHRyYW5zQSkgLSByYWRpdXMsIHB4TWluKTtcblx0XHRcdFx0XHRweE1heCA9IE1hdGgubWF4KCgoZGF0YVtpXSAtIG1pbikgKiB0cmFuc0EpICsgcmFkaXVzLCBweE1heCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KTtcblx0XHRcblx0XHRpZiAoYWN0aXZlU2VyaWVzLmxlbmd0aCAmJiByYW5nZSA+IDAgJiYgcGljayh0aGlzLm9wdGlvbnMubWluLCB0aGlzLnVzZXJNaW4pID09PSBVTkRFRklORUQgJiYgcGljayh0aGlzLm9wdGlvbnMubWF4LCB0aGlzLnVzZXJNYXgpID09PSBVTkRFRklORUQpIHtcblx0XHRcdHB4TWF4IC09IGF4aXNMZW5ndGg7XG5cdFx0XHR0cmFuc0EgKj0gKGF4aXNMZW5ndGggKyBweE1pbiAtIHB4TWF4KSAvIGF4aXNMZW5ndGg7XG5cdFx0XHR0aGlzLm1pbiArPSBweE1pbiAvIHRyYW5zQTtcblx0XHRcdHRoaXMubWF4ICs9IHB4TWF4IC8gdHJhbnNBO1xuXHRcdH1cblx0fVxufTtcblxuLyogKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogRW5kIEJ1YmJsZSBzZXJpZXMgY29kZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyoqXG4gKiBFeHRlbnNpb25zIGZvciBwb2xhciBjaGFydHMuIEFkZGl0aW9uYWxseSwgbXVjaCBvZiB0aGUgZ2VvbWV0cnkgcmVxdWlyZWQgZm9yIHBvbGFyIGNoYXJ0cyBpc1xuICogZ2F0aGVyZWQgaW4gUmFkaWFsQXhlcy5qcy5cbiAqIFxuICovXG5cbnZhciBzZXJpZXNQcm90byA9IFNlcmllcy5wcm90b3R5cGUsXG5cdHBvaW50ZXJQcm90byA9IEhpZ2hjaGFydHMuUG9pbnRlci5wcm90b3R5cGU7XG5cblxuXG4vKipcbiAqIFRyYW5zbGF0ZSBhIHBvaW50J3MgcGxvdFggYW5kIHBsb3RZIGZyb20gdGhlIGludGVybmFsIGFuZ2xlIGFuZCByYWRpdXMgbWVhc3VyZXMgdG8gXG4gKiB0cnVlIHBsb3RYLCBwbG90WSBjb29yZGluYXRlc1xuICovXG5zZXJpZXNQcm90by50b1hZID0gZnVuY3Rpb24gKHBvaW50KSB7XG5cdHZhciB4eSxcblx0XHRjaGFydCA9IHRoaXMuY2hhcnQsXG5cdFx0cGxvdFggPSBwb2ludC5wbG90WCxcblx0XHRwbG90WSA9IHBvaW50LnBsb3RZO1xuXHRcblx0Ly8gU2F2ZSByZWN0YW5ndWxhciBwbG90WCwgcGxvdFkgZm9yIGxhdGVyIGNvbXB1dGF0aW9uXG5cdHBvaW50LnJlY3RQbG90WCA9IHBsb3RYO1xuXHRwb2ludC5yZWN0UGxvdFkgPSBwbG90WTtcblx0XG5cdC8vIFJlY29yZCB0aGUgYW5nbGUgaW4gZGVncmVlcyBmb3IgdXNlIGluIHRvb2x0aXBcblx0cG9pbnQuY2xpZW50WCA9ICgocGxvdFggLyBNYXRoLlBJICogMTgwKSArIHRoaXMueEF4aXMucGFuZS5vcHRpb25zLnN0YXJ0QW5nbGUpICUgMzYwO1xuXHRcblx0Ly8gRmluZCB0aGUgcG9sYXIgcGxvdFggYW5kIHBsb3RZXG5cdHh5ID0gdGhpcy54QXhpcy5wb3N0VHJhbnNsYXRlKHBvaW50LnBsb3RYLCB0aGlzLnlBeGlzLmxlbiAtIHBsb3RZKTtcblx0cG9pbnQucGxvdFggPSBwb2ludC5wb2xhclBsb3RYID0geHkueCAtIGNoYXJ0LnBsb3RMZWZ0O1xuXHRwb2ludC5wbG90WSA9IHBvaW50LnBvbGFyUGxvdFkgPSB4eS55IC0gY2hhcnQucGxvdFRvcDtcbn07XG5cbi8qKiBcbiAqIE9yZGVyIHRoZSB0b29sdGlwIHBvaW50cyB0byBnZXQgdGhlIG1vdXNlIGNhcHR1cmUgcmFuZ2VzIGNvcnJlY3QuICMxOTE1LiBcbiAqL1xuc2VyaWVzUHJvdG8ub3JkZXJUb29sdGlwUG9pbnRzID0gZnVuY3Rpb24gKHBvaW50cykge1xuXHRpZiAodGhpcy5jaGFydC5wb2xhcikge1xuXHRcdHBvaW50cy5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG5cdFx0XHRyZXR1cm4gYS5jbGllbnRYIC0gYi5jbGllbnRYO1xuXHRcdH0pO1xuXG5cdFx0Ly8gV3JhcCBtb3VzZSB0cmFja2luZyBhcm91bmQgdG8gY2FwdHVyZSBtb3ZlbWVudCBvbiB0aGUgc2VnbWVudCB0byB0aGUgbGVmdFxuXHRcdC8vIG9mIHRoZSBub3J0aCBwb2ludCAoIzE0NjksICMyMDkzKS5cblx0XHRpZiAocG9pbnRzWzBdKSB7XG5cdFx0XHRwb2ludHNbMF0ud3JhcHBlZENsaWVudFggPSBwb2ludHNbMF0uY2xpZW50WCArIDM2MDtcblx0XHRcdHBvaW50cy5wdXNoKHBvaW50c1swXSk7XG5cdFx0fVxuXHR9XG59O1xuXG5cbi8qKlxuICogQWRkIHNvbWUgc3BlY2lhbCBpbml0IGxvZ2ljIHRvIGFyZWFzIGFuZCBhcmVhc3BsaW5lc1xuICovXG5mdW5jdGlvbiBpbml0QXJlYShwcm9jZWVkLCBjaGFydCwgb3B0aW9ucykge1xuXHRwcm9jZWVkLmNhbGwodGhpcywgY2hhcnQsIG9wdGlvbnMpO1xuXHRpZiAodGhpcy5jaGFydC5wb2xhcikge1xuXHRcdFxuXHRcdC8qKlxuXHRcdCAqIE92ZXJyaWRkZW4gbWV0aG9kIHRvIGNsb3NlIGEgc2VnbWVudCBwYXRoLiBXaGlsZSBpbiBhIGNhcnRlc2lhbiBwbGFuZSB0aGUgYXJlYSBcblx0XHQgKiBnb2VzIGRvd24gdG8gdGhlIHRocmVzaG9sZCwgaW4gdGhlIHBvbGFyIGNoYXJ0IGl0IGdvZXMgdG8gdGhlIGNlbnRlci5cblx0XHQgKi9cblx0XHR0aGlzLmNsb3NlU2VnbWVudCA9IGZ1bmN0aW9uIChwYXRoKSB7XG5cdFx0XHR2YXIgY2VudGVyID0gdGhpcy54QXhpcy5jZW50ZXI7XG5cdFx0XHRwYXRoLnB1c2goXG5cdFx0XHRcdCdMJyxcblx0XHRcdFx0Y2VudGVyWzBdLFxuXHRcdFx0XHRjZW50ZXJbMV1cblx0XHRcdCk7XHRcdFx0XG5cdFx0fTtcblx0XHRcblx0XHQvLyBJbnN0ZWFkIG9mIGNvbXBsaWNhdGVkIGxvZ2ljIHRvIGRyYXcgYW4gYXJlYSBhcm91bmQgdGhlIGlubmVyIGFyZWEgaW4gYSBzdGFjayxcblx0XHQvLyBqdXN0IGRyYXcgaXQgYmVoaW5kXG5cdFx0dGhpcy5jbG9zZWRTdGFja3MgPSB0cnVlO1xuXHR9XG59XG53cmFwKHNlcmllc1R5cGVzLmFyZWEucHJvdG90eXBlLCAnaW5pdCcsIGluaXRBcmVhKTtcbndyYXAoc2VyaWVzVHlwZXMuYXJlYXNwbGluZS5wcm90b3R5cGUsICdpbml0JywgaW5pdEFyZWEpO1xuXHRcdFxuXG4vKipcbiAqIE92ZXJyaWRkZW4gbWV0aG9kIGZvciBjYWxjdWxhdGluZyBhIHNwbGluZSBmcm9tIG9uZSBwb2ludCB0byB0aGUgbmV4dFxuICovXG53cmFwKHNlcmllc1R5cGVzLnNwbGluZS5wcm90b3R5cGUsICdnZXRQb2ludFNwbGluZScsIGZ1bmN0aW9uIChwcm9jZWVkLCBzZWdtZW50LCBwb2ludCwgaSkge1xuXHRcblx0dmFyIHJldCxcblx0XHRzbW9vdGhpbmcgPSAxLjUsIC8vIDEgbWVhbnMgY29udHJvbCBwb2ludHMgbWlkd2F5IGJldHdlZW4gcG9pbnRzLCAyIG1lYW5zIDEvMyBmcm9tIHRoZSBwb2ludCwgMyBpcyAxLzQgZXRjO1xuXHRcdGRlbm9tID0gc21vb3RoaW5nICsgMSxcblx0XHRwbG90WCwgXG5cdFx0cGxvdFksXG5cdFx0bGFzdFBvaW50LFxuXHRcdG5leHRQb2ludCxcblx0XHRsYXN0WCxcblx0XHRsYXN0WSxcblx0XHRuZXh0WCxcblx0XHRuZXh0WSxcblx0XHRsZWZ0Q29udFgsXG5cdFx0bGVmdENvbnRZLFxuXHRcdHJpZ2h0Q29udFgsXG5cdFx0cmlnaHRDb250WSxcblx0XHRkaXN0YW5jZUxlZnRDb250cm9sUG9pbnQsXG5cdFx0ZGlzdGFuY2VSaWdodENvbnRyb2xQb2ludCxcblx0XHRsZWZ0Q29udEFuZ2xlLFxuXHRcdHJpZ2h0Q29udEFuZ2xlLFxuXHRcdGpvaW50QW5nbGU7XG5cdFx0XG5cdFx0XG5cdGlmICh0aGlzLmNoYXJ0LnBvbGFyKSB7XG5cdFx0XG5cdFx0cGxvdFggPSBwb2ludC5wbG90WDtcblx0XHRwbG90WSA9IHBvaW50LnBsb3RZO1xuXHRcdGxhc3RQb2ludCA9IHNlZ21lbnRbaSAtIDFdO1xuXHRcdG5leHRQb2ludCA9IHNlZ21lbnRbaSArIDFdO1xuXHRcdFx0XG5cdFx0Ly8gQ29ubmVjdCBlbmRzXG5cdFx0aWYgKHRoaXMuY29ubmVjdEVuZHMpIHtcblx0XHRcdGlmICghbGFzdFBvaW50KSB7XG5cdFx0XHRcdGxhc3RQb2ludCA9IHNlZ21lbnRbc2VnbWVudC5sZW5ndGggLSAyXTsgLy8gbm90IHRoZSBsYXN0IGJ1dCB0aGUgc2Vjb25kIGxhc3QsIGJlY2F1c2UgdGhlIHNlZ21lbnQgaXMgYWxyZWFkeSBjb25uZWN0ZWRcblx0XHRcdH1cblx0XHRcdGlmICghbmV4dFBvaW50KSB7XG5cdFx0XHRcdG5leHRQb2ludCA9IHNlZ21lbnRbMV07XG5cdFx0XHR9XHRcblx0XHR9XG5cblx0XHQvLyBmaW5kIGNvbnRyb2wgcG9pbnRzXG5cdFx0aWYgKGxhc3RQb2ludCAmJiBuZXh0UG9pbnQpIHtcblx0XHRcblx0XHRcdGxhc3RYID0gbGFzdFBvaW50LnBsb3RYO1xuXHRcdFx0bGFzdFkgPSBsYXN0UG9pbnQucGxvdFk7XG5cdFx0XHRuZXh0WCA9IG5leHRQb2ludC5wbG90WDtcblx0XHRcdG5leHRZID0gbmV4dFBvaW50LnBsb3RZO1xuXHRcdFx0bGVmdENvbnRYID0gKHNtb290aGluZyAqIHBsb3RYICsgbGFzdFgpIC8gZGVub207XG5cdFx0XHRsZWZ0Q29udFkgPSAoc21vb3RoaW5nICogcGxvdFkgKyBsYXN0WSkgLyBkZW5vbTtcblx0XHRcdHJpZ2h0Q29udFggPSAoc21vb3RoaW5nICogcGxvdFggKyBuZXh0WCkgLyBkZW5vbTtcblx0XHRcdHJpZ2h0Q29udFkgPSAoc21vb3RoaW5nICogcGxvdFkgKyBuZXh0WSkgLyBkZW5vbTtcblx0XHRcdGRpc3RhbmNlTGVmdENvbnRyb2xQb2ludCA9IE1hdGguc3FydChNYXRoLnBvdyhsZWZ0Q29udFggLSBwbG90WCwgMikgKyBNYXRoLnBvdyhsZWZ0Q29udFkgLSBwbG90WSwgMikpO1xuXHRcdFx0ZGlzdGFuY2VSaWdodENvbnRyb2xQb2ludCA9IE1hdGguc3FydChNYXRoLnBvdyhyaWdodENvbnRYIC0gcGxvdFgsIDIpICsgTWF0aC5wb3cocmlnaHRDb250WSAtIHBsb3RZLCAyKSk7XG5cdFx0XHRsZWZ0Q29udEFuZ2xlID0gTWF0aC5hdGFuMihsZWZ0Q29udFkgLSBwbG90WSwgbGVmdENvbnRYIC0gcGxvdFgpO1xuXHRcdFx0cmlnaHRDb250QW5nbGUgPSBNYXRoLmF0YW4yKHJpZ2h0Q29udFkgLSBwbG90WSwgcmlnaHRDb250WCAtIHBsb3RYKTtcblx0XHRcdGpvaW50QW5nbGUgPSAoTWF0aC5QSSAvIDIpICsgKChsZWZ0Q29udEFuZ2xlICsgcmlnaHRDb250QW5nbGUpIC8gMik7XG5cdFx0XHRcdFxuXHRcdFx0XHRcblx0XHRcdC8vIEVuc3VyZSB0aGUgcmlnaHQgZGlyZWN0aW9uLCBqb2ludEFuZ2xlIHNob3VsZCBiZSBpbiB0aGUgc2FtZSBxdWFkcmFudCBhcyBsZWZ0Q29udEFuZ2xlXG5cdFx0XHRpZiAoTWF0aC5hYnMobGVmdENvbnRBbmdsZSAtIGpvaW50QW5nbGUpID4gTWF0aC5QSSAvIDIpIHtcblx0XHRcdFx0am9pbnRBbmdsZSAtPSBNYXRoLlBJO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHQvLyBGaW5kIHRoZSBjb3JyZWN0ZWQgY29udHJvbCBwb2ludHMgZm9yIGEgc3BsaW5lIHN0cmFpZ2h0IHRocm91Z2ggdGhlIHBvaW50XG5cdFx0XHRsZWZ0Q29udFggPSBwbG90WCArIE1hdGguY29zKGpvaW50QW5nbGUpICogZGlzdGFuY2VMZWZ0Q29udHJvbFBvaW50O1xuXHRcdFx0bGVmdENvbnRZID0gcGxvdFkgKyBNYXRoLnNpbihqb2ludEFuZ2xlKSAqIGRpc3RhbmNlTGVmdENvbnRyb2xQb2ludDtcblx0XHRcdHJpZ2h0Q29udFggPSBwbG90WCArIE1hdGguY29zKE1hdGguUEkgKyBqb2ludEFuZ2xlKSAqIGRpc3RhbmNlUmlnaHRDb250cm9sUG9pbnQ7XG5cdFx0XHRyaWdodENvbnRZID0gcGxvdFkgKyBNYXRoLnNpbihNYXRoLlBJICsgam9pbnRBbmdsZSkgKiBkaXN0YW5jZVJpZ2h0Q29udHJvbFBvaW50O1xuXHRcdFx0XG5cdFx0XHQvLyBSZWNvcmQgZm9yIGRyYXdpbmcgaW4gbmV4dCBwb2ludFxuXHRcdFx0cG9pbnQucmlnaHRDb250WCA9IHJpZ2h0Q29udFg7XG5cdFx0XHRwb2ludC5yaWdodENvbnRZID0gcmlnaHRDb250WTtcblxuXHRcdH1cblx0XHRcblx0XHRcblx0XHQvLyBtb3ZlVG8gb3IgbGluZVRvXG5cdFx0aWYgKCFpKSB7XG5cdFx0XHRyZXQgPSBbJ00nLCBwbG90WCwgcGxvdFldO1xuXHRcdH0gZWxzZSB7IC8vIGN1cnZlIGZyb20gbGFzdCBwb2ludCB0byB0aGlzXG5cdFx0XHRyZXQgPSBbXG5cdFx0XHRcdCdDJyxcblx0XHRcdFx0bGFzdFBvaW50LnJpZ2h0Q29udFggfHwgbGFzdFBvaW50LnBsb3RYLFxuXHRcdFx0XHRsYXN0UG9pbnQucmlnaHRDb250WSB8fCBsYXN0UG9pbnQucGxvdFksXG5cdFx0XHRcdGxlZnRDb250WCB8fCBwbG90WCxcblx0XHRcdFx0bGVmdENvbnRZIHx8IHBsb3RZLFxuXHRcdFx0XHRwbG90WCxcblx0XHRcdFx0cGxvdFlcblx0XHRcdF07XG5cdFx0XHRsYXN0UG9pbnQucmlnaHRDb250WCA9IGxhc3RQb2ludC5yaWdodENvbnRZID0gbnVsbDsgLy8gcmVzZXQgZm9yIHVwZGF0aW5nIHNlcmllcyBsYXRlclxuXHRcdH1cblx0XHRcblx0XHRcblx0fSBlbHNlIHtcblx0XHRyZXQgPSBwcm9jZWVkLmNhbGwodGhpcywgc2VnbWVudCwgcG9pbnQsIGkpO1xuXHR9XG5cdHJldHVybiByZXQ7XG59KTtcblxuLyoqXG4gKiBFeHRlbmQgdHJhbnNsYXRlLiBUaGUgcGxvdFggYW5kIHBsb3RZIHZhbHVlcyBhcmUgY29tcHV0ZWQgYXMgaWYgdGhlIHBvbGFyIGNoYXJ0IHdlcmUgYVxuICogY2FydGVzaWFuIHBsYW5lLCB3aGVyZSBwbG90WCBkZW5vdGVzIHRoZSBhbmdsZSBpbiByYWRpYW5zIGFuZCAoeUF4aXMubGVuIC0gcGxvdFkpIGlzIHRoZSBwaXhlbCBkaXN0YW5jZSBmcm9tXG4gKiBjZW50ZXIuIFxuICovXG53cmFwKHNlcmllc1Byb3RvLCAndHJhbnNsYXRlJywgZnVuY3Rpb24gKHByb2NlZWQpIHtcblx0XHRcblx0Ly8gUnVuIHViZXIgbWV0aG9kXG5cdHByb2NlZWQuY2FsbCh0aGlzKTtcblx0XG5cdC8vIFBvc3Rwcm9jZXNzIHBsb3QgY29vcmRpbmF0ZXNcblx0aWYgKHRoaXMuY2hhcnQucG9sYXIgJiYgIXRoaXMucHJldmVudFBvc3RUcmFuc2xhdGUpIHtcblx0XHR2YXIgcG9pbnRzID0gdGhpcy5wb2ludHMsXG5cdFx0XHRpID0gcG9pbnRzLmxlbmd0aDtcblx0XHR3aGlsZSAoaS0tKSB7XG5cdFx0XHQvLyBUcmFuc2xhdGUgcGxvdFgsIHBsb3RZIGZyb20gYW5nbGUgYW5kIHJhZGl1cyB0byB0cnVlIHBsb3QgY29vcmRpbmF0ZXNcblx0XHRcdHRoaXMudG9YWShwb2ludHNbaV0pO1xuXHRcdH1cblx0fVxufSk7XG5cbi8qKiBcbiAqIEV4dGVuZCBnZXRTZWdtZW50UGF0aCB0byBhbGxvdyBjb25uZWN0aW5nIGVuZHMgYWNyb3NzIDAgdG8gcHJvdmlkZSBhIGNsb3NlZCBjaXJjbGUgaW4gXG4gKiBsaW5lLWxpa2Ugc2VyaWVzLlxuICovXG53cmFwKHNlcmllc1Byb3RvLCAnZ2V0U2VnbWVudFBhdGgnLCBmdW5jdGlvbiAocHJvY2VlZCwgc2VnbWVudCkge1xuXHRcdFxuXHR2YXIgcG9pbnRzID0gdGhpcy5wb2ludHM7XG5cdFxuXHQvLyBDb25uZWN0IHRoZSBwYXRoXG5cdGlmICh0aGlzLmNoYXJ0LnBvbGFyICYmIHRoaXMub3B0aW9ucy5jb25uZWN0RW5kcyAhPT0gZmFsc2UgJiYgXG5cdFx0XHRzZWdtZW50W3NlZ21lbnQubGVuZ3RoIC0gMV0gPT09IHBvaW50c1twb2ludHMubGVuZ3RoIC0gMV0gJiYgcG9pbnRzWzBdLnkgIT09IG51bGwpIHtcblx0XHR0aGlzLmNvbm5lY3RFbmRzID0gdHJ1ZTsgLy8gcmUtdXNlZCBpbiBzcGxpbmVzXG5cdFx0c2VnbWVudCA9IFtdLmNvbmNhdChzZWdtZW50LCBbcG9pbnRzWzBdXSk7XG5cdH1cblx0XG5cdC8vIFJ1biB1YmVyIG1ldGhvZFxuXHRyZXR1cm4gcHJvY2VlZC5jYWxsKHRoaXMsIHNlZ21lbnQpO1xuXHRcbn0pO1xuXG5cbmZ1bmN0aW9uIHBvbGFyQW5pbWF0ZShwcm9jZWVkLCBpbml0KSB7XG5cdHZhciBjaGFydCA9IHRoaXMuY2hhcnQsXG5cdFx0YW5pbWF0aW9uID0gdGhpcy5vcHRpb25zLmFuaW1hdGlvbixcblx0XHRncm91cCA9IHRoaXMuZ3JvdXAsXG5cdFx0bWFya2VyR3JvdXAgPSB0aGlzLm1hcmtlckdyb3VwLFxuXHRcdGNlbnRlciA9IHRoaXMueEF4aXMuY2VudGVyLFxuXHRcdHBsb3RMZWZ0ID0gY2hhcnQucGxvdExlZnQsXG5cdFx0cGxvdFRvcCA9IGNoYXJ0LnBsb3RUb3AsXG5cdFx0YXR0cmlicztcblxuXHQvLyBTcGVjaWZpYyBhbmltYXRpb24gZm9yIHBvbGFyIGNoYXJ0c1xuXHRpZiAoY2hhcnQucG9sYXIpIHtcblx0XHRcblx0XHQvLyBFbmFibGUgYW5pbWF0aW9uIG9uIHBvbGFyIGNoYXJ0cyBvbmx5IGluIFNWRy4gSW4gVk1MLCB0aGUgc2NhbGluZyBpcyBkaWZmZXJlbnQsIHBsdXMgYW5pbWF0aW9uXG5cdFx0Ly8gd291bGQgYmUgc28gc2xvdyBpdCB3b3VsZCd0IG1hdHRlci5cblx0XHRpZiAoY2hhcnQucmVuZGVyZXIuaXNTVkcpIHtcblxuXHRcdFx0aWYgKGFuaW1hdGlvbiA9PT0gdHJ1ZSkge1xuXHRcdFx0XHRhbmltYXRpb24gPSB7fTtcblx0XHRcdH1cblx0XG5cdFx0XHQvLyBJbml0aWFsaXplIHRoZSBhbmltYXRpb25cblx0XHRcdGlmIChpbml0KSB7XG5cdFx0XHRcdFxuXHRcdFx0XHQvLyBTY2FsZSBkb3duIHRoZSBncm91cCBhbmQgcGxhY2UgaXQgaW4gdGhlIGNlbnRlclxuXHRcdFx0XHRhdHRyaWJzID0ge1xuXHRcdFx0XHRcdHRyYW5zbGF0ZVg6IGNlbnRlclswXSArIHBsb3RMZWZ0LFxuXHRcdFx0XHRcdHRyYW5zbGF0ZVk6IGNlbnRlclsxXSArIHBsb3RUb3AsXG5cdFx0XHRcdFx0c2NhbGVYOiAwLjAwMSwgLy8gIzE0OTlcblx0XHRcdFx0XHRzY2FsZVk6IDAuMDAxXG5cdFx0XHRcdH07XG5cdFx0XHRcdFx0XG5cdFx0XHRcdGdyb3VwLmF0dHIoYXR0cmlicyk7XG5cdFx0XHRcdGlmIChtYXJrZXJHcm91cCkge1xuXHRcdFx0XHRcdG1hcmtlckdyb3VwLmF0dHJTZXR0ZXJzID0gZ3JvdXAuYXR0clNldHRlcnM7XG5cdFx0XHRcdFx0bWFya2VyR3JvdXAuYXR0cihhdHRyaWJzKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdC8vIFJ1biB0aGUgYW5pbWF0aW9uXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRhdHRyaWJzID0ge1xuXHRcdFx0XHRcdHRyYW5zbGF0ZVg6IHBsb3RMZWZ0LFxuXHRcdFx0XHRcdHRyYW5zbGF0ZVk6IHBsb3RUb3AsXG5cdFx0XHRcdFx0c2NhbGVYOiAxLFxuXHRcdFx0XHRcdHNjYWxlWTogMVxuXHRcdFx0XHR9O1xuXHRcdFx0XHRncm91cC5hbmltYXRlKGF0dHJpYnMsIGFuaW1hdGlvbik7XG5cdFx0XHRcdGlmIChtYXJrZXJHcm91cCkge1xuXHRcdFx0XHRcdG1hcmtlckdyb3VwLmFuaW1hdGUoYXR0cmlicywgYW5pbWF0aW9uKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdFx0Ly8gRGVsZXRlIHRoaXMgZnVuY3Rpb24gdG8gYWxsb3cgaXQgb25seSBvbmNlXG5cdFx0XHRcdHRoaXMuYW5pbWF0ZSA9IG51bGw7XG5cdFx0XHR9XG5cdFx0fVxuXHRcblx0Ly8gRm9yIG5vbi1wb2xhciBjaGFydHMsIHJldmVydCB0byB0aGUgYmFzaWMgYW5pbWF0aW9uXG5cdH0gZWxzZSB7XG5cdFx0cHJvY2VlZC5jYWxsKHRoaXMsIGluaXQpO1xuXHR9IFxufVxuXG4vLyBEZWZpbmUgdGhlIGFuaW1hdGUgbWV0aG9kIGZvciBib3RoIHJlZ3VsYXIgc2VyaWVzIGFuZCBjb2x1bW4gc2VyaWVzIGFuZCB0aGVpciBkZXJpdmF0aXZlc1xud3JhcChzZXJpZXNQcm90bywgJ2FuaW1hdGUnLCBwb2xhckFuaW1hdGUpO1xud3JhcChjb2xQcm90bywgJ2FuaW1hdGUnLCBwb2xhckFuaW1hdGUpO1xuXG5cbi8qKlxuICogVGhyb3cgaW4gYSBjb3VwbGUgb2YgcHJvcGVydGllcyB0byBsZXQgc2V0VG9vbHRpcFBvaW50cyBrbm93IHdlJ3JlIGluZGV4aW5nIHRoZSBwb2ludHNcbiAqIGluIGRlZ3JlZXMgKDAtMzYwKSwgbm90IHBsb3QgcGl4ZWwgd2lkdGguXG4gKi9cbndyYXAoc2VyaWVzUHJvdG8sICdzZXRUb29sdGlwUG9pbnRzJywgZnVuY3Rpb24gKHByb2NlZWQsIHJlbmV3KSB7XG5cdFx0XG5cdGlmICh0aGlzLmNoYXJ0LnBvbGFyKSB7XG5cdFx0ZXh0ZW5kKHRoaXMueEF4aXMsIHtcblx0XHRcdHRvb2x0aXBMZW46IDM2MCAvLyBkZWdyZWVzIGFyZSB0aGUgcmVzb2x1dGlvbiB1bml0IG9mIHRoZSB0b29sdGlwUG9pbnRzIGFycmF5XG5cdFx0fSk7XHRcblx0fVxuXHRcblx0Ly8gUnVuIHViZXIgbWV0aG9kXG5cdHJldHVybiBwcm9jZWVkLmNhbGwodGhpcywgcmVuZXcpO1xufSk7XG5cblxuLyoqXG4gKiBFeHRlbmQgdGhlIGNvbHVtbiBwcm90b3R5cGUncyB0cmFuc2xhdGUgbWV0aG9kXG4gKi9cbndyYXAoY29sUHJvdG8sICd0cmFuc2xhdGUnLCBmdW5jdGlvbiAocHJvY2VlZCkge1xuXHRcdFxuXHR2YXIgeEF4aXMgPSB0aGlzLnhBeGlzLFxuXHRcdGxlbiA9IHRoaXMueUF4aXMubGVuLFxuXHRcdGNlbnRlciA9IHhBeGlzLmNlbnRlcixcblx0XHRzdGFydEFuZ2xlUmFkID0geEF4aXMuc3RhcnRBbmdsZVJhZCxcblx0XHRyZW5kZXJlciA9IHRoaXMuY2hhcnQucmVuZGVyZXIsXG5cdFx0c3RhcnQsXG5cdFx0cG9pbnRzLFxuXHRcdHBvaW50LFxuXHRcdGk7XG5cdFxuXHR0aGlzLnByZXZlbnRQb3N0VHJhbnNsYXRlID0gdHJ1ZTtcblx0XG5cdC8vIFJ1biB1YmVyIG1ldGhvZFxuXHRwcm9jZWVkLmNhbGwodGhpcyk7XG5cdFxuXHQvLyBQb3N0cHJvY2VzcyBwbG90IGNvb3JkaW5hdGVzXG5cdGlmICh4QXhpcy5pc1JhZGlhbCkge1xuXHRcdHBvaW50cyA9IHRoaXMucG9pbnRzO1xuXHRcdGkgPSBwb2ludHMubGVuZ3RoO1xuXHRcdHdoaWxlIChpLS0pIHtcblx0XHRcdHBvaW50ID0gcG9pbnRzW2ldO1xuXHRcdFx0c3RhcnQgPSBwb2ludC5iYXJYICsgc3RhcnRBbmdsZVJhZDtcblx0XHRcdHBvaW50LnNoYXBlVHlwZSA9ICdwYXRoJztcblx0XHRcdHBvaW50LnNoYXBlQXJncyA9IHtcblx0XHRcdFx0ZDogcmVuZGVyZXIuc3ltYm9scy5hcmMoXG5cdFx0XHRcdFx0Y2VudGVyWzBdLFxuXHRcdFx0XHRcdGNlbnRlclsxXSxcblx0XHRcdFx0XHRsZW4gLSBwb2ludC5wbG90WSxcblx0XHRcdFx0XHRudWxsLCBcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRzdGFydDogc3RhcnQsXG5cdFx0XHRcdFx0XHRlbmQ6IHN0YXJ0ICsgcG9pbnQucG9pbnRXaWR0aCxcblx0XHRcdFx0XHRcdGlubmVyUjogbGVuIC0gcGljayhwb2ludC55Qm90dG9tLCBsZW4pXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHQpXG5cdFx0XHR9O1xuXHRcdFx0dGhpcy50b1hZKHBvaW50KTsgLy8gcHJvdmlkZSBjb3JyZWN0IHBsb3RYLCBwbG90WSBmb3IgdG9vbHRpcFxuXHRcdH1cblx0fVxufSk7XG5cblxuLyoqXG4gKiBBbGlnbiBjb2x1bW4gZGF0YSBsYWJlbHMgb3V0c2lkZSB0aGUgY29sdW1ucy4gIzExOTkuXG4gKi9cbndyYXAoY29sUHJvdG8sICdhbGlnbkRhdGFMYWJlbCcsIGZ1bmN0aW9uIChwcm9jZWVkLCBwb2ludCwgZGF0YUxhYmVsLCBvcHRpb25zLCBhbGlnblRvLCBpc05ldykge1xuXHRcblx0aWYgKHRoaXMuY2hhcnQucG9sYXIpIHtcblx0XHR2YXIgYW5nbGUgPSBwb2ludC5yZWN0UGxvdFggLyBNYXRoLlBJICogMTgwLFxuXHRcdFx0YWxpZ24sXG5cdFx0XHR2ZXJ0aWNhbEFsaWduO1xuXHRcdFxuXHRcdC8vIEFsaWduIG5pY2VseSBvdXRzaWRlIHRoZSBwZXJpbWV0ZXIgb2YgdGhlIGNvbHVtbnNcblx0XHRpZiAob3B0aW9ucy5hbGlnbiA9PT0gbnVsbCkge1xuXHRcdFx0aWYgKGFuZ2xlID4gMjAgJiYgYW5nbGUgPCAxNjApIHtcblx0XHRcdFx0YWxpZ24gPSAnbGVmdCc7IC8vIHJpZ2h0IGhlbWlzcGhlcmVcblx0XHRcdH0gZWxzZSBpZiAoYW5nbGUgPiAyMDAgJiYgYW5nbGUgPCAzNDApIHtcblx0XHRcdFx0YWxpZ24gPSAncmlnaHQnOyAvLyBsZWZ0IGhlbWlzcGhlcmVcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGFsaWduID0gJ2NlbnRlcic7IC8vIHRvcCBvciBib3R0b21cblx0XHRcdH1cblx0XHRcdG9wdGlvbnMuYWxpZ24gPSBhbGlnbjtcblx0XHR9XG5cdFx0aWYgKG9wdGlvbnMudmVydGljYWxBbGlnbiA9PT0gbnVsbCkge1xuXHRcdFx0aWYgKGFuZ2xlIDwgNDUgfHwgYW5nbGUgPiAzMTUpIHtcblx0XHRcdFx0dmVydGljYWxBbGlnbiA9ICdib3R0b20nOyAvLyB0b3AgcGFydFxuXHRcdFx0fSBlbHNlIGlmIChhbmdsZSA+IDEzNSAmJiBhbmdsZSA8IDIyNSkge1xuXHRcdFx0XHR2ZXJ0aWNhbEFsaWduID0gJ3RvcCc7IC8vIGJvdHRvbSBwYXJ0XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR2ZXJ0aWNhbEFsaWduID0gJ21pZGRsZSc7IC8vIGxlZnQgb3IgcmlnaHRcblx0XHRcdH1cblx0XHRcdG9wdGlvbnMudmVydGljYWxBbGlnbiA9IHZlcnRpY2FsQWxpZ247XG5cdFx0fVxuXHRcdFxuXHRcdHNlcmllc1Byb3RvLmFsaWduRGF0YUxhYmVsLmNhbGwodGhpcywgcG9pbnQsIGRhdGFMYWJlbCwgb3B0aW9ucywgYWxpZ25UbywgaXNOZXcpO1xuXHR9IGVsc2Uge1xuXHRcdHByb2NlZWQuY2FsbCh0aGlzLCBwb2ludCwgZGF0YUxhYmVsLCBvcHRpb25zLCBhbGlnblRvLCBpc05ldyk7XG5cdH1cblx0XG59KTtcblxuLyoqXG4gKiBFeHRlbmQgdGhlIG1vdXNlIHRyYWNrZXIgdG8gcmV0dXJuIHRoZSB0b29sdGlwIHBvc2l0aW9uIGluZGV4IGluIHRlcm1zIG9mXG4gKiBkZWdyZWVzIHJhdGhlciB0aGFuIHBpeGVsc1xuICovXG53cmFwKHBvaW50ZXJQcm90bywgJ2dldEluZGV4JywgZnVuY3Rpb24gKHByb2NlZWQsIGUpIHtcblx0dmFyIHJldCxcblx0XHRjaGFydCA9IHRoaXMuY2hhcnQsXG5cdFx0Y2VudGVyLFxuXHRcdHgsXG5cdFx0eTtcblx0XG5cdGlmIChjaGFydC5wb2xhcikge1xuXHRcdGNlbnRlciA9IGNoYXJ0LnhBeGlzWzBdLmNlbnRlcjtcblx0XHR4ID0gZS5jaGFydFggLSBjZW50ZXJbMF0gLSBjaGFydC5wbG90TGVmdDtcblx0XHR5ID0gZS5jaGFydFkgLSBjZW50ZXJbMV0gLSBjaGFydC5wbG90VG9wO1xuXHRcdFxuXHRcdHJldCA9IDE4MCAtIE1hdGgucm91bmQoTWF0aC5hdGFuMih4LCB5KSAvIE1hdGguUEkgKiAxODApO1xuXHRcblx0fSBlbHNlIHtcblx0XG5cdFx0Ly8gUnVuIHViZXIgbWV0aG9kXG5cdFx0cmV0ID0gcHJvY2VlZC5jYWxsKHRoaXMsIGUpO1xuXHR9XG5cdHJldHVybiByZXQ7XG59KTtcblxuLyoqXG4gKiBFeHRlbmQgZ2V0Q29vcmRpbmF0ZXMgdG8gcHJlcGFyZSBmb3IgcG9sYXIgYXhpcyB2YWx1ZXNcbiAqL1xud3JhcChwb2ludGVyUHJvdG8sICdnZXRDb29yZGluYXRlcycsIGZ1bmN0aW9uIChwcm9jZWVkLCBlKSB7XG5cdHZhciBjaGFydCA9IHRoaXMuY2hhcnQsXG5cdFx0cmV0ID0ge1xuXHRcdFx0eEF4aXM6IFtdLFxuXHRcdFx0eUF4aXM6IFtdXG5cdFx0fTtcblx0XG5cdGlmIChjaGFydC5wb2xhcikge1x0XG5cblx0XHRlYWNoKGNoYXJ0LmF4ZXMsIGZ1bmN0aW9uIChheGlzKSB7XG5cdFx0XHR2YXIgaXNYQXhpcyA9IGF4aXMuaXNYQXhpcyxcblx0XHRcdFx0Y2VudGVyID0gYXhpcy5jZW50ZXIsXG5cdFx0XHRcdHggPSBlLmNoYXJ0WCAtIGNlbnRlclswXSAtIGNoYXJ0LnBsb3RMZWZ0LFxuXHRcdFx0XHR5ID0gZS5jaGFydFkgLSBjZW50ZXJbMV0gLSBjaGFydC5wbG90VG9wO1xuXHRcdFx0XG5cdFx0XHRyZXRbaXNYQXhpcyA/ICd4QXhpcycgOiAneUF4aXMnXS5wdXNoKHtcblx0XHRcdFx0YXhpczogYXhpcyxcblx0XHRcdFx0dmFsdWU6IGF4aXMudHJhbnNsYXRlKFxuXHRcdFx0XHRcdGlzWEF4aXMgP1xuXHRcdFx0XHRcdFx0TWF0aC5QSSAtIE1hdGguYXRhbjIoeCwgeSkgOiAvLyBhbmdsZSBcblx0XHRcdFx0XHRcdE1hdGguc3FydChNYXRoLnBvdyh4LCAyKSArIE1hdGgucG93KHksIDIpKSwgLy8gZGlzdGFuY2UgZnJvbSBjZW50ZXJcblx0XHRcdFx0XHR0cnVlXG5cdFx0XHRcdClcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHRcdFxuXHR9IGVsc2Uge1xuXHRcdHJldCA9IHByb2NlZWQuY2FsbCh0aGlzLCBlKTtcblx0fVxuXHRcblx0cmV0dXJuIHJldDtcbn0pO1xufShIaWdoY2hhcnRzKSk7XG4iXSwiZmlsZSI6InBsdWdpbnMvdWVkaXRvci90aGlyZC1wYXJ0eS9oaWdoY2hhcnRzL2hpZ2hjaGFydHMtbW9yZS5zcmMuanMifQ==
