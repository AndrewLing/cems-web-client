/**
 * @license Map plugin v0.1 for Highcharts
 *
 * (c) 2011-2013 Torstein Hønsi
 *
 * License: www.highcharts.com/license
 */

/* 
 * See www.highcharts.com/studies/world-map.htm for use case.
 *
 * To do:
 * - Optimize long variable names and alias adapter methods and Highcharts namespace variables
 * - Zoom and pan GUI
 */
(function (Highcharts) {
	var UNDEFINED,
		Axis = Highcharts.Axis,
		Chart = Highcharts.Chart,
		Point = Highcharts.Point,
		Pointer = Highcharts.Pointer,
		each = Highcharts.each,
		extend = Highcharts.extend,
		merge = Highcharts.merge,
		pick = Highcharts.pick,
		numberFormat = Highcharts.numberFormat,
		defaultOptions = Highcharts.getOptions(),
		seriesTypes = Highcharts.seriesTypes,
		plotOptions = defaultOptions.plotOptions,
		wrap = Highcharts.wrap,
		Color = Highcharts.Color,
		noop = function () {};

	

	/*
	 * Return an intermediate color between two colors, according to pos where 0
	 * is the from color and 1 is the to color
	 */
	function tweenColors(from, to, pos) {
		var i = 4,
			rgba = [];

		while (i--) {
			rgba[i] = Math.round(
				to.rgba[i] + (from.rgba[i] - to.rgba[i]) * (1 - pos)
			);
		}
		return 'rgba(' + rgba.join(',') + ')';
	}

	// Set the default map navigation options
	defaultOptions.mapNavigation = {
		buttonOptions: {
			align: 'right',
			verticalAlign: 'bottom',
			x: 0,
			width: 18,
			height: 18,
			style: {
				fontSize: '15px',
				fontWeight: 'bold',
				textAlign: 'center'
			}
		},
		buttons: {
			zoomIn: {
				onclick: function () {
					this.mapZoom(0.5);
				},
				text: '+',
				y: -32
			},
			zoomOut: {
				onclick: function () {
					this.mapZoom(2);
				},
				text: '-',
				y: 0
			}
		}
		// enableButtons: false,
		// enableTouchZoom: false,
		// zoomOnDoubleClick: false,
		// zoomOnMouseWheel: false

	};
	
	/**
	 * Utility for reading SVG paths directly.
	 */
	Highcharts.splitPath = function (path) {
		var i;

		// Move letters apart
		path = path.replace(/([A-Za-z])/g, ' $1 ');
		// Trim
		path = path.replace(/^\s*/, "").replace(/\s*$/, "");
		
		// Split on spaces and commas
		path = path.split(/[ ,]+/);
		
		// Parse numbers
		for (i = 0; i < path.length; i++) {
			if (!/[a-zA-Z]/.test(path[i])) {
				path[i] = parseFloat(path[i]);
			}
		}
		return path;
	};

	// A placeholder for map definitions
	Highcharts.maps = {};
	
	/**
	 * Override to use the extreme coordinates from the SVG shape, not the
	 * data values
	 */
	wrap(Axis.prototype, 'getSeriesExtremes', function (proceed) {
		var isXAxis = this.isXAxis,
			dataMin,
			dataMax,
			xData = [];

		// Remove the xData array and cache it locally so that the proceed method doesn't use it
		each(this.series, function (series, i) {
			if (series.useMapGeometry) {
				xData[i] = series.xData;
				series.xData = [];
			}
		});

		// Call base to reach normal cartesian series (like mappoint)
		proceed.call(this);

		// Run extremes logic for map and mapline
		dataMin = pick(this.dataMin, Number.MAX_VALUE);
		dataMax = pick(this.dataMax, Number.MIN_VALUE);
		each(this.series, function (series, i) {
			if (series.useMapGeometry) {
				dataMin = Math.min(dataMin, series[isXAxis ? 'minX' : 'minY']);
				dataMax = Math.max(dataMax, series[isXAxis ? 'maxX' : 'maxY']);
				series.xData = xData[i]; // Reset xData array
			}
		});
		
		this.dataMin = dataMin;
		this.dataMax = dataMax;
	});
	
	/**
	 * Override axis translation to make sure the aspect ratio is always kept
	 */
	wrap(Axis.prototype, 'setAxisTranslation', function (proceed) {
		var chart = this.chart,
			mapRatio,
			plotRatio = chart.plotWidth / chart.plotHeight,
			isXAxis = this.isXAxis,
			adjustedAxisLength,
			xAxis = chart.xAxis[0],
			padAxis;
		
		// Run the parent method
		proceed.call(this);
		
		// On Y axis, handle both
		if (chart.options.chart.type === 'map' && !isXAxis && xAxis.transA !== UNDEFINED) {
			
			// Use the same translation for both axes
			this.transA = xAxis.transA = Math.min(this.transA, xAxis.transA);
			
			mapRatio = (xAxis.max - xAxis.min) / (this.max - this.min);
			
			// What axis to pad to put the map in the middle
			padAxis = mapRatio > plotRatio ? this : xAxis;
			
			// Pad it
			adjustedAxisLength = (padAxis.max - padAxis.min) * padAxis.transA;
			padAxis.minPixelPadding = (padAxis.len - adjustedAxisLength) / 2;
		}
	});


	//--- Start zooming and panning features

	wrap(Chart.prototype, 'render', function (proceed) {
		var chart = this,
			mapNavigation = chart.options.mapNavigation;

		proceed.call(chart);

		// Render the plus and minus buttons
		chart.renderMapNavigation();

		// Add the double click event
		if (mapNavigation.zoomOnDoubleClick) {
			Highcharts.addEvent(chart.container, 'dblclick', function (e) {
				chart.pointer.onContainerDblClick(e);
			});
		}

		// Add the mousewheel event
		if (mapNavigation.zoomOnMouseWheel) {
			Highcharts.addEvent(chart.container, document.onmousewheel === undefined ? 'DOMMouseScroll' : 'mousewheel', function (e) {
				chart.pointer.onContainerMouseWheel(e);
			});
		}
	});

	// Extend the Pointer
	extend(Pointer.prototype, {

		/**
		 * The event handler for the doubleclick event
		 */
		onContainerDblClick: function (e) {
			var chart = this.chart;

			e = this.normalize(e);

			if (chart.isInsidePlot(e.chartX - chart.plotLeft, e.chartY - chart.plotTop)) {
				chart.mapZoom(
					0.5,
					chart.xAxis[0].toValue(e.chartX),
					chart.yAxis[0].toValue(e.chartY)
				);
			}
		},

		/**
		 * The event handler for the mouse scroll event
		 */
		onContainerMouseWheel: function (e) {
			var chart = this.chart,
				delta;

			e = this.normalize(e);

			// Firefox uses e.detail, WebKit and IE uses wheelDelta
			delta = e.detail || -(e.wheelDelta / 120);
			if (chart.isInsidePlot(e.chartX - chart.plotLeft, e.chartY - chart.plotTop)) {
				chart.mapZoom(
					delta > 0 ? 2 : 0.5,
					chart.xAxis[0].toValue(e.chartX),
					chart.yAxis[0].toValue(e.chartY)
				);
			}
		}
	});
	// Implement the pinchType option
	wrap(Pointer.prototype, 'init', function (proceed, chart, options) {

		proceed.call(this, chart, options);

		// Pinch status
		if (options.mapNavigation.enableTouchZoom) {
			this.pinchX = this.pinchHor = 
				this.pinchY = this.pinchVert = true;
		}
	});

	// Add events to the Chart object itself
	extend(Chart.prototype, {
		renderMapNavigation: function () {
			var chart = this,
				options = this.options.mapNavigation,
				buttons = options.buttons,
				n,
				button,
				buttonOptions,
				outerHandler = function () { 
					this.handler.call(chart); 
				};

			if (options.enableButtons) {
				for (n in buttons) {
					if (buttons.hasOwnProperty(n)) {
						buttonOptions = merge(options.buttonOptions, buttons[n]);

						button = chart.renderer.button(buttonOptions.text, 0, 0, outerHandler)
							.attr({
								width: buttonOptions.width,
								height: buttonOptions.height
							})
							.css(buttonOptions.style)
							.add();
						button.handler = buttonOptions.onclick;
						button.align(extend(buttonOptions, { width: button.width, height: button.height }), null, 'spacingBox');
					}
				}
			}
		},

		/**
		 * Fit an inner box to an outer. If the inner box overflows left or right, align it to the sides of the
		 * outer. If it overflows both sides, fit it within the outer. This is a pattern that occurs more places
		 * in Highcharts, perhaps it should be elevated to a common utility function.
		 */
		fitToBox: function (inner, outer) {
			each([['x', 'width'], ['y', 'height']], function (dim) {
				var pos = dim[0],
					size = dim[1];
				if (inner[pos] + inner[size] > outer[pos] + outer[size]) { // right overflow
					if (inner[size] > outer[size]) { // the general size is greater, fit fully to outer
						inner[size] = outer[size];
						inner[pos] = outer[pos];
					} else { // align right
						inner[pos] = outer[pos] + outer[size] - inner[size];
					}
				}
				if (inner[size] > outer[size]) {
					inner[size] = outer[size];
				}
				if (inner[pos] < outer[pos]) {
					inner[pos] = outer[pos];
				}
				
			});

			return inner;
		},

		/**
		 * Zoom the map in or out by a certain amount. Less than 1 zooms in, greater than 1 zooms out.
		 */
		mapZoom: function (howMuch, centerXArg, centerYArg) {

			if (this.isMapZooming) {
				return;
			}

			var chart = this,
				xAxis = chart.xAxis[0],
				xRange = xAxis.max - xAxis.min,
				centerX = pick(centerXArg, xAxis.min + xRange / 2),
				newXRange = xRange * howMuch,
				yAxis = chart.yAxis[0],
				yRange = yAxis.max - yAxis.min,
				centerY = pick(centerYArg, yAxis.min + yRange / 2),
				newYRange = yRange * howMuch,
				newXMin = centerX - newXRange / 2,
				newYMin = centerY - newYRange / 2,
				animation = pick(chart.options.chart.animation, true),
				delay,
				newExt = chart.fitToBox({
					x: newXMin,
					y: newYMin,
					width: newXRange,
					height: newYRange
				}, {
					x: xAxis.dataMin,
					y: yAxis.dataMin,
					width: xAxis.dataMax - xAxis.dataMin,
					height: yAxis.dataMax - yAxis.dataMin
				});

			xAxis.setExtremes(newExt.x, newExt.x + newExt.width, false);
			yAxis.setExtremes(newExt.y, newExt.y + newExt.height, false);

			// Prevent zooming until this one is finished animating
			delay = animation ? animation.duration || 500 : 0;
			if (delay) {
				chart.isMapZooming = true;
				setTimeout(function () {
					chart.isMapZooming = false;
				}, delay);
			}

			chart.redraw();
		}
	});
	
	/**
	 * Extend the default options with map options
	 */
	plotOptions.map = merge(plotOptions.scatter, {
		animation: false, // makes the complex shapes slow
		nullColor: '#F8F8F8',
		borderColor: 'silver',
		borderWidth: 1,
		marker: null,
		stickyTracking: false,
		dataLabels: {
			verticalAlign: 'middle'
		},
		turboThreshold: 0,
		tooltip: {
			followPointer: true,
			pointFormat: '{point.name}: {point.y}<br/>'
		},
		states: {
			normal: {
				animation: true
			}
		}
	});

	var MapAreaPoint = Highcharts.extendClass(Point, {
		/**
		 * Extend the Point object to split paths
		 */
		applyOptions: function (options, x) {

			var point = Point.prototype.applyOptions.call(this, options, x);

			if (point.path && typeof point.path === 'string') {
				point.path = point.options.path = Highcharts.splitPath(point.path);
			}

			return point;
		},
		/**
		 * Stop the fade-out 
		 */
		onMouseOver: function () {
			clearTimeout(this.colorInterval);
			Point.prototype.onMouseOver.call(this);
		},
		/**
		 * Custom animation for tweening out the colors. Animation reduces blinking when hovering
		 * over islands and coast lines. We run a custom implementation of animation becuase we
		 * need to be able to run this independently from other animations like zoom redraw. Also,
		 * adding color animation to the adapters would introduce almost the same amount of code.
		 */
		onMouseOut: function () {
			var point = this,
				start = +new Date(),
				normalColor = Color(point.options.color),
				hoverColor = Color(point.pointAttr.hover.fill),
				animation = point.series.options.states.normal.animation,
				duration = animation && (animation.duration || 500);

			if (duration && normalColor.rgba.length === 4 && hoverColor.rgba.length === 4) {
				delete point.pointAttr[''].fill; // avoid resetting it in Point.setState

				clearTimeout(point.colorInterval);
				point.colorInterval = setInterval(function () {
					var pos = (new Date() - start) / duration,
						graphic = point.graphic;
					if (pos > 1) {
						pos = 1;
					}
					if (graphic) {
						graphic.attr('fill', tweenColors(hoverColor, normalColor, pos));
					}
					if (pos >= 1) {
						clearTimeout(point.colorInterval);
					}
				}, 13);
			}
			Point.prototype.onMouseOut.call(point);
		}
	});

	/**
	 * Add the series type
	 */
	seriesTypes.map = Highcharts.extendClass(seriesTypes.scatter, {
		type: 'map',
		pointAttrToOptions: { // mapping between SVG attributes and the corresponding options
			stroke: 'borderColor',
			'stroke-width': 'borderWidth',
			fill: 'color'
		},
		colorKey: 'y',
		pointClass: MapAreaPoint,
		trackerGroups: ['group', 'markerGroup', 'dataLabelsGroup'],
		getSymbol: noop,
		supportsDrilldown: true,
		getExtremesFromAll: true,
		useMapGeometry: true, // get axis extremes from paths, not values
		init: function (chart) {
			var series = this,
				valueDecimals = chart.options.legend.valueDecimals,
				legendItems = [],
				name,
				from,
				to,
				fromLabel,
				toLabel,
				colorRange,
				valueRanges,
				gradientColor,
				grad,
				tmpLabel,
				horizontal = chart.options.legend.layout === 'horizontal';

			
			Highcharts.Series.prototype.init.apply(this, arguments);
			colorRange = series.options.colorRange;
			valueRanges = series.options.valueRanges;

			if (valueRanges) {
				each(valueRanges, function (range) {
					from = range.from;
					to = range.to;
					
					// Assemble the default name. This can be overridden by legend.options.labelFormatter
					name = '';
					if (from === UNDEFINED) {
						name = '< ';
					} else if (to === UNDEFINED) {
						name = '> ';
					}
					if (from !== UNDEFINED) {
						name += numberFormat(from, valueDecimals);
					}
					if (from !== UNDEFINED && to !== UNDEFINED) {
						name += ' - ';
					}
					if (to !== UNDEFINED) {
						name += numberFormat(to, valueDecimals);
					}
					
					// Add a mock object to the legend items
					legendItems.push(Highcharts.extend({
						chart: series.chart,
						name: name,
						options: {},
						drawLegendSymbol: seriesTypes.area.prototype.drawLegendSymbol,
						visible: true,
						setState: function () {},
						setVisible: function () {}
					}, range));
				});
				series.legendItems = legendItems;

			} else if (colorRange) {

				from = colorRange.from;
				to = colorRange.to;
				fromLabel = colorRange.fromLabel;
				toLabel = colorRange.toLabel;

				// Flips linearGradient variables and label text.
				grad = horizontal ? [0, 0, 1, 0] : [0, 1, 0, 0]; 
				if (!horizontal) {
					tmpLabel = fromLabel;
					fromLabel = toLabel;
					toLabel = tmpLabel;
				} 

				// Creates color gradient.
				gradientColor = {
					linearGradient: { x1: grad[0], y1: grad[1], x2: grad[2], y2: grad[3] },
					stops: 
					[
						[0, from],
						[1, to]
					]
				};

				// Add a mock object to the legend items.
				legendItems = [{
					chart: series.chart,
					options: {},
					fromLabel: fromLabel,
					toLabel: toLabel,
					color: gradientColor,
					drawLegendSymbol: this.drawLegendSymbolGradient,
					visible: true,
					setState: function () {},
					setVisible: function () {}
				}];

				series.legendItems = legendItems;
			}
		},

		/**
		 * If neither valueRanges nor colorRanges are defined, use basic area symbol.
		 */
		drawLegendSymbol: seriesTypes.area.prototype.drawLegendSymbol,

		/**
		 * Gets the series' symbol in the legend and extended legend with more information.
		 * 
		 * @param {Object} legend The legend object
		 * @param {Object} item The series (this) or point
		 */
		drawLegendSymbolGradient: function (legend, item) {
			var spacing = legend.options.symbolPadding,
				padding = pick(legend.options.padding, 8),
				positionY,
				positionX,
				gradientSize = this.chart.renderer.fontMetrics(legend.options.itemStyle.fontSize).h,
				horizontal = legend.options.layout === 'horizontal',
				box1,
				box2,
				box3,
				rectangleLength = pick(legend.options.rectangleLength, 200);

			// Set local variables based on option.
			if (horizontal) {
				positionY = -(spacing / 2);
				positionX = 0;
			} else {
				positionY = -rectangleLength + legend.baseline - (spacing / 2);
				positionX = padding + gradientSize;
			}

			// Creates the from text.
			item.fromText = this.chart.renderer.text(
					item.fromLabel,	// Text.
					positionX,		// Lower left x.
					positionY		// Lower left y.
				).attr({
					zIndex: 2
				}).add(item.legendGroup);
			box1 = item.fromText.getBBox();

			// Creates legend symbol.
			// Ternary changes variables based on option.
			item.legendSymbol = this.chart.renderer.rect(
				horizontal ? box1.x + box1.width + spacing : box1.x - gradientSize - spacing,		// Upper left x.
				box1.y,																				// Upper left y.
				horizontal ? rectangleLength : gradientSize,											// Width.
				horizontal ? gradientSize : rectangleLength,										// Height.
				2																					// Corner radius.
			).attr({
				zIndex: 1
			}).add(item.legendGroup);
			box2 = item.legendSymbol.getBBox();

			// Creates the to text.
			// Vertical coordinate changed based on option.
			item.toText = this.chart.renderer.text(
					item.toLabel,
					box2.x + box2.width + spacing,
					horizontal ? positionY : box2.y + box2.height - spacing
				).attr({
					zIndex: 2
				}).add(item.legendGroup);
			box3 = item.toText.getBBox();

			// Changes legend box settings based on option.
			if (horizontal) {
				legend.offsetWidth = box1.width + box2.width + box3.width + (spacing * 2) + padding;
				legend.itemY = gradientSize + padding;
			} else {
				legend.offsetWidth = Math.max(box1.width, box3.width) + (spacing) + box2.width + padding;
				legend.itemY = box2.height + padding;
				legend.itemX = spacing;
			}
		},

		/**
		 * Get the bounding box of all paths in the map combined.
		 */
		getBox: function (paths) {
			var maxX = Number.MIN_VALUE, 
				minX =  Number.MAX_VALUE, 
				maxY = Number.MIN_VALUE, 
				minY =  Number.MAX_VALUE;
			
			
			// Find the bounding box
			each(paths || this.options.data, function (point) {
				var path = point.path,
					i = path.length,
					even = false, // while loop reads from the end
					pointMaxX = Number.MIN_VALUE, 
					pointMinX =  Number.MAX_VALUE, 
					pointMaxY = Number.MIN_VALUE, 
					pointMinY =  Number.MAX_VALUE;
					
				while (i--) {
					if (typeof path[i] === 'number' && !isNaN(path[i])) {
						if (even) { // even = x
							pointMaxX = Math.max(pointMaxX, path[i]);
							pointMinX = Math.min(pointMinX, path[i]);
						} else { // odd = Y
							pointMaxY = Math.max(pointMaxY, path[i]);
							pointMinY = Math.min(pointMinY, path[i]);
						}
						even = !even;
					}
				}
				// Cache point bounding box for use to position data labels
				point._maxX = pointMaxX;
				point._minX = pointMinX;
				point._maxY = pointMaxY;
				point._minY = pointMinY;

				maxX = Math.max(maxX, pointMaxX);
				minX = Math.min(minX, pointMinX);
				maxY = Math.max(maxY, pointMaxY);
				minY = Math.min(minY, pointMinY);
			});
			this.minY = minY;
			this.maxY = maxY;
			this.minX = minX;
			this.maxX = maxX;
			
		},
		
		
		
		/**
		 * Translate the path so that it automatically fits into the plot area box
		 * @param {Object} path
		 */
		translatePath: function (path) {
			
			var series = this,
				even = false, // while loop reads from the end
				xAxis = series.xAxis,
				yAxis = series.yAxis,
				i;
				
			// Preserve the original
			path = [].concat(path);
				
			// Do the translation
			i = path.length;
			while (i--) {
				if (typeof path[i] === 'number') {
					if (even) { // even = x
						path[i] = Math.round(xAxis.translate(path[i]));
					} else { // odd = Y
						path[i] = Math.round(yAxis.len - yAxis.translate(path[i]));
					}
					even = !even;
				}
			}
			return path;
		},
		
		setData: function () {
			Highcharts.Series.prototype.setData.apply(this, arguments);
			this.getBox();
		},
		
		/**
		 * Add the path option for data points. Find the max value for color calculation.
		 */
		translate: function () {
			var series = this,
				dataMin = Number.MAX_VALUE,
				dataMax = Number.MIN_VALUE;
	
			series.generatePoints();
	
			each(series.data, function (point) {
				
				point.shapeType = 'path';
				point.shapeArgs = {
					d: series.translatePath(point.path)
				};
				
				// TODO: do point colors in drawPoints instead of point.init
				if (typeof point.y === 'number') {
					if (point.y > dataMax) {
						dataMax = point.y;
					} else if (point.y < dataMin) {
						dataMin = point.y;
					}
				}
			});
			
			series.translateColors(dataMin, dataMax);
		},
		
		/**
		 * In choropleth maps, the color is a result of the value, so this needs translation too
		 */
		translateColors: function (dataMin, dataMax) {
			
			var seriesOptions = this.options,
				valueRanges = seriesOptions.valueRanges,
				colorRange = seriesOptions.colorRange,
				colorKey = this.colorKey,
				from,
				to;

			if (colorRange) {
				from = Color(colorRange.from);
				to = Color(colorRange.to);
			}
			
			each(this.data, function (point) {
				var value = point[colorKey],
					range,
					color,
					i,
					pos;

				if (valueRanges) {
					i = valueRanges.length;
					while (i--) {
						range = valueRanges[i];
						from = range.from;
						to = range.to;
						if ((from === UNDEFINED || value >= from) && (to === UNDEFINED || value <= to)) {
							color = range.color;
							break;
						}
							
					}
				} else if (colorRange && value !== undefined) {

					pos = 1 - ((dataMax - value) / (dataMax - dataMin));
					color = value === null ? seriesOptions.nullColor : tweenColors(from, to, pos);
				}

				if (color) {
					point.color = null; // reset from previous drilldowns, use of the same data options
					point.options.color = color;
				}
			});
		},
		
		drawGraph: noop,
		
		/**
		 * We need the points' bounding boxes in order to draw the data labels, so 
		 * we skip it now and call if from drawPoints instead.
		 */
		drawDataLabels: noop,
		
		/** 
		 * Use the drawPoints method of column, that is able to handle simple shapeArgs.
		 * Extend it by assigning the tooltip position.
		 */
		drawPoints: function () {
			var series = this,
				xAxis = series.xAxis,
				yAxis = series.yAxis,
				colorKey = series.colorKey;
			
			// Make points pass test in drawing
			each(series.data, function (point) {
				point.plotY = 1; // pass null test in column.drawPoints
				if (point[colorKey] === null) {
					point[colorKey] = 0;
					point.isNull = true;
				}
			});
			
			// Draw them
			seriesTypes.column.prototype.drawPoints.apply(series);
			
			each(series.data, function (point) {

				var dataLabels = point.dataLabels,
					minX = xAxis.toPixels(point._minX, true),
					maxX = xAxis.toPixels(point._maxX, true),
					minY = yAxis.toPixels(point._minY, true),
					maxY = yAxis.toPixels(point._maxY, true);

				point.plotX = Math.round(minX + (maxX - minX) * pick(dataLabels && dataLabels.anchorX, 0.5));
				point.plotY = Math.round(minY + (maxY - minY) * pick(dataLabels && dataLabels.anchorY, 0.5)); 
				
				
				// Reset escaped null points
				if (point.isNull) {
					point[colorKey] = null;
				}
			});

			// Now draw the data labels
			Highcharts.Series.prototype.drawDataLabels.call(series);
			
		},

		/**
		 * Animate in the new series from the clicked point in the old series.
		 * Depends on the drilldown.js module
		 */
		animateDrilldown: function (init) {
			var toBox = this.chart.plotBox,
				level = this.chart.drilldownLevels[this.chart.drilldownLevels.length - 1],
				fromBox = level.bBox,
				animationOptions = this.chart.options.drilldown.animation,
				scale;
				
			if (!init) {

				scale = Math.min(fromBox.width / toBox.width, fromBox.height / toBox.height);
				level.shapeArgs = {
					scaleX: scale,
					scaleY: scale,
					translateX: fromBox.x,
					translateY: fromBox.y
				};
				
				// TODO: Animate this.group instead
				each(this.points, function (point) {

					point.graphic
						.attr(level.shapeArgs)
						.animate({
							scaleX: 1,
							scaleY: 1,
							translateX: 0,
							translateY: 0
						}, animationOptions);

				});

				delete this.animate;
			}
			
		},

		/**
		 * When drilling up, pull out the individual point graphics from the lower series
		 * and animate them into the origin point in the upper series.
		 */
		animateDrillupFrom: function (level) {
			seriesTypes.column.prototype.animateDrillupFrom.call(this, level);
		},


		/**
		 * When drilling up, keep the upper series invisible until the lower series has
		 * moved into place
		 */
		animateDrillupTo: function (init) {
			seriesTypes.column.prototype.animateDrillupTo.call(this, init);
		}
	});


	// The mapline series type
	plotOptions.mapline = merge(plotOptions.map, {
		lineWidth: 1,
		backgroundColor: 'none'
	});
	seriesTypes.mapline = Highcharts.extendClass(seriesTypes.map, {
		type: 'mapline',
		pointAttrToOptions: { // mapping between SVG attributes and the corresponding options
			stroke: 'color',
			'stroke-width': 'lineWidth',
			fill: 'backgroundColor'
		},
		drawLegendSymbol: seriesTypes.line.prototype.drawLegendSymbol
	});

	// The mappoint series type
	plotOptions.mappoint = merge(plotOptions.scatter, {
		dataLabels: {
			enabled: true,
			format: '{point.name}',
			color: 'black',
			style: {
				textShadow: '0 0 5px white'
			}
		}
	});
	seriesTypes.mappoint = Highcharts.extendClass(seriesTypes.scatter, {
		type: 'mappoint'
	});
	

	
	/**
	 * A wrapper for Chart with all the default values for a Map
	 */
	Highcharts.Map = function (options, callback) {
		
		var hiddenAxis = {
				endOnTick: false,
				gridLineWidth: 0,
				labels: {
					enabled: false
				},
				lineWidth: 0,
				minPadding: 0,
				maxPadding: 0,
				startOnTick: false,
				tickWidth: 0,
				title: null
			},
			seriesOptions;
		
		// Don't merge the data
		seriesOptions = options.series;
		options.series = null;
		
		options = merge({
			chart: {
				type: 'map',
				panning: 'xy'
			},
			xAxis: hiddenAxis,
			yAxis: merge(hiddenAxis, { reversed: true })	
		},
		options, // user's options
	
		{ // forced options
			chart: {
				inverted: false
			}
		});
	
		options.series = seriesOptions;
	
	
		return new Highcharts.Chart(options, callback);
	};
}(Highcharts));

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvdGhpcmQtcGFydHkvaGlnaGNoYXJ0cy9tb2R1bGVzL21hcC5zcmMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZSBNYXAgcGx1Z2luIHYwLjEgZm9yIEhpZ2hjaGFydHNcbiAqXG4gKiAoYykgMjAxMS0yMDEzIFRvcnN0ZWluIEjDuG5zaVxuICpcbiAqIExpY2Vuc2U6IHd3dy5oaWdoY2hhcnRzLmNvbS9saWNlbnNlXG4gKi9cblxuLyogXG4gKiBTZWUgd3d3LmhpZ2hjaGFydHMuY29tL3N0dWRpZXMvd29ybGQtbWFwLmh0bSBmb3IgdXNlIGNhc2UuXG4gKlxuICogVG8gZG86XG4gKiAtIE9wdGltaXplIGxvbmcgdmFyaWFibGUgbmFtZXMgYW5kIGFsaWFzIGFkYXB0ZXIgbWV0aG9kcyBhbmQgSGlnaGNoYXJ0cyBuYW1lc3BhY2UgdmFyaWFibGVzXG4gKiAtIFpvb20gYW5kIHBhbiBHVUlcbiAqL1xuKGZ1bmN0aW9uIChIaWdoY2hhcnRzKSB7XG5cdHZhciBVTkRFRklORUQsXG5cdFx0QXhpcyA9IEhpZ2hjaGFydHMuQXhpcyxcblx0XHRDaGFydCA9IEhpZ2hjaGFydHMuQ2hhcnQsXG5cdFx0UG9pbnQgPSBIaWdoY2hhcnRzLlBvaW50LFxuXHRcdFBvaW50ZXIgPSBIaWdoY2hhcnRzLlBvaW50ZXIsXG5cdFx0ZWFjaCA9IEhpZ2hjaGFydHMuZWFjaCxcblx0XHRleHRlbmQgPSBIaWdoY2hhcnRzLmV4dGVuZCxcblx0XHRtZXJnZSA9IEhpZ2hjaGFydHMubWVyZ2UsXG5cdFx0cGljayA9IEhpZ2hjaGFydHMucGljayxcblx0XHRudW1iZXJGb3JtYXQgPSBIaWdoY2hhcnRzLm51bWJlckZvcm1hdCxcblx0XHRkZWZhdWx0T3B0aW9ucyA9IEhpZ2hjaGFydHMuZ2V0T3B0aW9ucygpLFxuXHRcdHNlcmllc1R5cGVzID0gSGlnaGNoYXJ0cy5zZXJpZXNUeXBlcyxcblx0XHRwbG90T3B0aW9ucyA9IGRlZmF1bHRPcHRpb25zLnBsb3RPcHRpb25zLFxuXHRcdHdyYXAgPSBIaWdoY2hhcnRzLndyYXAsXG5cdFx0Q29sb3IgPSBIaWdoY2hhcnRzLkNvbG9yLFxuXHRcdG5vb3AgPSBmdW5jdGlvbiAoKSB7fTtcblxuXHRcblxuXHQvKlxuXHQgKiBSZXR1cm4gYW4gaW50ZXJtZWRpYXRlIGNvbG9yIGJldHdlZW4gdHdvIGNvbG9ycywgYWNjb3JkaW5nIHRvIHBvcyB3aGVyZSAwXG5cdCAqIGlzIHRoZSBmcm9tIGNvbG9yIGFuZCAxIGlzIHRoZSB0byBjb2xvclxuXHQgKi9cblx0ZnVuY3Rpb24gdHdlZW5Db2xvcnMoZnJvbSwgdG8sIHBvcykge1xuXHRcdHZhciBpID0gNCxcblx0XHRcdHJnYmEgPSBbXTtcblxuXHRcdHdoaWxlIChpLS0pIHtcblx0XHRcdHJnYmFbaV0gPSBNYXRoLnJvdW5kKFxuXHRcdFx0XHR0by5yZ2JhW2ldICsgKGZyb20ucmdiYVtpXSAtIHRvLnJnYmFbaV0pICogKDEgLSBwb3MpXG5cdFx0XHQpO1xuXHRcdH1cblx0XHRyZXR1cm4gJ3JnYmEoJyArIHJnYmEuam9pbignLCcpICsgJyknO1xuXHR9XG5cblx0Ly8gU2V0IHRoZSBkZWZhdWx0IG1hcCBuYXZpZ2F0aW9uIG9wdGlvbnNcblx0ZGVmYXVsdE9wdGlvbnMubWFwTmF2aWdhdGlvbiA9IHtcblx0XHRidXR0b25PcHRpb25zOiB7XG5cdFx0XHRhbGlnbjogJ3JpZ2h0Jyxcblx0XHRcdHZlcnRpY2FsQWxpZ246ICdib3R0b20nLFxuXHRcdFx0eDogMCxcblx0XHRcdHdpZHRoOiAxOCxcblx0XHRcdGhlaWdodDogMTgsXG5cdFx0XHRzdHlsZToge1xuXHRcdFx0XHRmb250U2l6ZTogJzE1cHgnLFxuXHRcdFx0XHRmb250V2VpZ2h0OiAnYm9sZCcsXG5cdFx0XHRcdHRleHRBbGlnbjogJ2NlbnRlcidcblx0XHRcdH1cblx0XHR9LFxuXHRcdGJ1dHRvbnM6IHtcblx0XHRcdHpvb21Jbjoge1xuXHRcdFx0XHRvbmNsaWNrOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0dGhpcy5tYXBab29tKDAuNSk7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdHRleHQ6ICcrJyxcblx0XHRcdFx0eTogLTMyXG5cdFx0XHR9LFxuXHRcdFx0em9vbU91dDoge1xuXHRcdFx0XHRvbmNsaWNrOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0dGhpcy5tYXBab29tKDIpO1xuXHRcdFx0XHR9LFxuXHRcdFx0XHR0ZXh0OiAnLScsXG5cdFx0XHRcdHk6IDBcblx0XHRcdH1cblx0XHR9XG5cdFx0Ly8gZW5hYmxlQnV0dG9uczogZmFsc2UsXG5cdFx0Ly8gZW5hYmxlVG91Y2hab29tOiBmYWxzZSxcblx0XHQvLyB6b29tT25Eb3VibGVDbGljazogZmFsc2UsXG5cdFx0Ly8gem9vbU9uTW91c2VXaGVlbDogZmFsc2VcblxuXHR9O1xuXHRcblx0LyoqXG5cdCAqIFV0aWxpdHkgZm9yIHJlYWRpbmcgU1ZHIHBhdGhzIGRpcmVjdGx5LlxuXHQgKi9cblx0SGlnaGNoYXJ0cy5zcGxpdFBhdGggPSBmdW5jdGlvbiAocGF0aCkge1xuXHRcdHZhciBpO1xuXG5cdFx0Ly8gTW92ZSBsZXR0ZXJzIGFwYXJ0XG5cdFx0cGF0aCA9IHBhdGgucmVwbGFjZSgvKFtBLVphLXpdKS9nLCAnICQxICcpO1xuXHRcdC8vIFRyaW1cblx0XHRwYXRoID0gcGF0aC5yZXBsYWNlKC9eXFxzKi8sIFwiXCIpLnJlcGxhY2UoL1xccyokLywgXCJcIik7XG5cdFx0XG5cdFx0Ly8gU3BsaXQgb24gc3BhY2VzIGFuZCBjb21tYXNcblx0XHRwYXRoID0gcGF0aC5zcGxpdCgvWyAsXSsvKTtcblx0XHRcblx0XHQvLyBQYXJzZSBudW1iZXJzXG5cdFx0Zm9yIChpID0gMDsgaSA8IHBhdGgubGVuZ3RoOyBpKyspIHtcblx0XHRcdGlmICghL1thLXpBLVpdLy50ZXN0KHBhdGhbaV0pKSB7XG5cdFx0XHRcdHBhdGhbaV0gPSBwYXJzZUZsb2F0KHBhdGhbaV0pO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gcGF0aDtcblx0fTtcblxuXHQvLyBBIHBsYWNlaG9sZGVyIGZvciBtYXAgZGVmaW5pdGlvbnNcblx0SGlnaGNoYXJ0cy5tYXBzID0ge307XG5cdFxuXHQvKipcblx0ICogT3ZlcnJpZGUgdG8gdXNlIHRoZSBleHRyZW1lIGNvb3JkaW5hdGVzIGZyb20gdGhlIFNWRyBzaGFwZSwgbm90IHRoZVxuXHQgKiBkYXRhIHZhbHVlc1xuXHQgKi9cblx0d3JhcChBeGlzLnByb3RvdHlwZSwgJ2dldFNlcmllc0V4dHJlbWVzJywgZnVuY3Rpb24gKHByb2NlZWQpIHtcblx0XHR2YXIgaXNYQXhpcyA9IHRoaXMuaXNYQXhpcyxcblx0XHRcdGRhdGFNaW4sXG5cdFx0XHRkYXRhTWF4LFxuXHRcdFx0eERhdGEgPSBbXTtcblxuXHRcdC8vIFJlbW92ZSB0aGUgeERhdGEgYXJyYXkgYW5kIGNhY2hlIGl0IGxvY2FsbHkgc28gdGhhdCB0aGUgcHJvY2VlZCBtZXRob2QgZG9lc24ndCB1c2UgaXRcblx0XHRlYWNoKHRoaXMuc2VyaWVzLCBmdW5jdGlvbiAoc2VyaWVzLCBpKSB7XG5cdFx0XHRpZiAoc2VyaWVzLnVzZU1hcEdlb21ldHJ5KSB7XG5cdFx0XHRcdHhEYXRhW2ldID0gc2VyaWVzLnhEYXRhO1xuXHRcdFx0XHRzZXJpZXMueERhdGEgPSBbXTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdC8vIENhbGwgYmFzZSB0byByZWFjaCBub3JtYWwgY2FydGVzaWFuIHNlcmllcyAobGlrZSBtYXBwb2ludClcblx0XHRwcm9jZWVkLmNhbGwodGhpcyk7XG5cblx0XHQvLyBSdW4gZXh0cmVtZXMgbG9naWMgZm9yIG1hcCBhbmQgbWFwbGluZVxuXHRcdGRhdGFNaW4gPSBwaWNrKHRoaXMuZGF0YU1pbiwgTnVtYmVyLk1BWF9WQUxVRSk7XG5cdFx0ZGF0YU1heCA9IHBpY2sodGhpcy5kYXRhTWF4LCBOdW1iZXIuTUlOX1ZBTFVFKTtcblx0XHRlYWNoKHRoaXMuc2VyaWVzLCBmdW5jdGlvbiAoc2VyaWVzLCBpKSB7XG5cdFx0XHRpZiAoc2VyaWVzLnVzZU1hcEdlb21ldHJ5KSB7XG5cdFx0XHRcdGRhdGFNaW4gPSBNYXRoLm1pbihkYXRhTWluLCBzZXJpZXNbaXNYQXhpcyA/ICdtaW5YJyA6ICdtaW5ZJ10pO1xuXHRcdFx0XHRkYXRhTWF4ID0gTWF0aC5tYXgoZGF0YU1heCwgc2VyaWVzW2lzWEF4aXMgPyAnbWF4WCcgOiAnbWF4WSddKTtcblx0XHRcdFx0c2VyaWVzLnhEYXRhID0geERhdGFbaV07IC8vIFJlc2V0IHhEYXRhIGFycmF5XG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0XG5cdFx0dGhpcy5kYXRhTWluID0gZGF0YU1pbjtcblx0XHR0aGlzLmRhdGFNYXggPSBkYXRhTWF4O1xuXHR9KTtcblx0XG5cdC8qKlxuXHQgKiBPdmVycmlkZSBheGlzIHRyYW5zbGF0aW9uIHRvIG1ha2Ugc3VyZSB0aGUgYXNwZWN0IHJhdGlvIGlzIGFsd2F5cyBrZXB0XG5cdCAqL1xuXHR3cmFwKEF4aXMucHJvdG90eXBlLCAnc2V0QXhpc1RyYW5zbGF0aW9uJywgZnVuY3Rpb24gKHByb2NlZWQpIHtcblx0XHR2YXIgY2hhcnQgPSB0aGlzLmNoYXJ0LFxuXHRcdFx0bWFwUmF0aW8sXG5cdFx0XHRwbG90UmF0aW8gPSBjaGFydC5wbG90V2lkdGggLyBjaGFydC5wbG90SGVpZ2h0LFxuXHRcdFx0aXNYQXhpcyA9IHRoaXMuaXNYQXhpcyxcblx0XHRcdGFkanVzdGVkQXhpc0xlbmd0aCxcblx0XHRcdHhBeGlzID0gY2hhcnQueEF4aXNbMF0sXG5cdFx0XHRwYWRBeGlzO1xuXHRcdFxuXHRcdC8vIFJ1biB0aGUgcGFyZW50IG1ldGhvZFxuXHRcdHByb2NlZWQuY2FsbCh0aGlzKTtcblx0XHRcblx0XHQvLyBPbiBZIGF4aXMsIGhhbmRsZSBib3RoXG5cdFx0aWYgKGNoYXJ0Lm9wdGlvbnMuY2hhcnQudHlwZSA9PT0gJ21hcCcgJiYgIWlzWEF4aXMgJiYgeEF4aXMudHJhbnNBICE9PSBVTkRFRklORUQpIHtcblx0XHRcdFxuXHRcdFx0Ly8gVXNlIHRoZSBzYW1lIHRyYW5zbGF0aW9uIGZvciBib3RoIGF4ZXNcblx0XHRcdHRoaXMudHJhbnNBID0geEF4aXMudHJhbnNBID0gTWF0aC5taW4odGhpcy50cmFuc0EsIHhBeGlzLnRyYW5zQSk7XG5cdFx0XHRcblx0XHRcdG1hcFJhdGlvID0gKHhBeGlzLm1heCAtIHhBeGlzLm1pbikgLyAodGhpcy5tYXggLSB0aGlzLm1pbik7XG5cdFx0XHRcblx0XHRcdC8vIFdoYXQgYXhpcyB0byBwYWQgdG8gcHV0IHRoZSBtYXAgaW4gdGhlIG1pZGRsZVxuXHRcdFx0cGFkQXhpcyA9IG1hcFJhdGlvID4gcGxvdFJhdGlvID8gdGhpcyA6IHhBeGlzO1xuXHRcdFx0XG5cdFx0XHQvLyBQYWQgaXRcblx0XHRcdGFkanVzdGVkQXhpc0xlbmd0aCA9IChwYWRBeGlzLm1heCAtIHBhZEF4aXMubWluKSAqIHBhZEF4aXMudHJhbnNBO1xuXHRcdFx0cGFkQXhpcy5taW5QaXhlbFBhZGRpbmcgPSAocGFkQXhpcy5sZW4gLSBhZGp1c3RlZEF4aXNMZW5ndGgpIC8gMjtcblx0XHR9XG5cdH0pO1xuXG5cblx0Ly8tLS0gU3RhcnQgem9vbWluZyBhbmQgcGFubmluZyBmZWF0dXJlc1xuXG5cdHdyYXAoQ2hhcnQucHJvdG90eXBlLCAncmVuZGVyJywgZnVuY3Rpb24gKHByb2NlZWQpIHtcblx0XHR2YXIgY2hhcnQgPSB0aGlzLFxuXHRcdFx0bWFwTmF2aWdhdGlvbiA9IGNoYXJ0Lm9wdGlvbnMubWFwTmF2aWdhdGlvbjtcblxuXHRcdHByb2NlZWQuY2FsbChjaGFydCk7XG5cblx0XHQvLyBSZW5kZXIgdGhlIHBsdXMgYW5kIG1pbnVzIGJ1dHRvbnNcblx0XHRjaGFydC5yZW5kZXJNYXBOYXZpZ2F0aW9uKCk7XG5cblx0XHQvLyBBZGQgdGhlIGRvdWJsZSBjbGljayBldmVudFxuXHRcdGlmIChtYXBOYXZpZ2F0aW9uLnpvb21PbkRvdWJsZUNsaWNrKSB7XG5cdFx0XHRIaWdoY2hhcnRzLmFkZEV2ZW50KGNoYXJ0LmNvbnRhaW5lciwgJ2RibGNsaWNrJywgZnVuY3Rpb24gKGUpIHtcblx0XHRcdFx0Y2hhcnQucG9pbnRlci5vbkNvbnRhaW5lckRibENsaWNrKGUpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Ly8gQWRkIHRoZSBtb3VzZXdoZWVsIGV2ZW50XG5cdFx0aWYgKG1hcE5hdmlnYXRpb24uem9vbU9uTW91c2VXaGVlbCkge1xuXHRcdFx0SGlnaGNoYXJ0cy5hZGRFdmVudChjaGFydC5jb250YWluZXIsIGRvY3VtZW50Lm9ubW91c2V3aGVlbCA9PT0gdW5kZWZpbmVkID8gJ0RPTU1vdXNlU2Nyb2xsJyA6ICdtb3VzZXdoZWVsJywgZnVuY3Rpb24gKGUpIHtcblx0XHRcdFx0Y2hhcnQucG9pbnRlci5vbkNvbnRhaW5lck1vdXNlV2hlZWwoZSk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH0pO1xuXG5cdC8vIEV4dGVuZCB0aGUgUG9pbnRlclxuXHRleHRlbmQoUG9pbnRlci5wcm90b3R5cGUsIHtcblxuXHRcdC8qKlxuXHRcdCAqIFRoZSBldmVudCBoYW5kbGVyIGZvciB0aGUgZG91YmxlY2xpY2sgZXZlbnRcblx0XHQgKi9cblx0XHRvbkNvbnRhaW5lckRibENsaWNrOiBmdW5jdGlvbiAoZSkge1xuXHRcdFx0dmFyIGNoYXJ0ID0gdGhpcy5jaGFydDtcblxuXHRcdFx0ZSA9IHRoaXMubm9ybWFsaXplKGUpO1xuXG5cdFx0XHRpZiAoY2hhcnQuaXNJbnNpZGVQbG90KGUuY2hhcnRYIC0gY2hhcnQucGxvdExlZnQsIGUuY2hhcnRZIC0gY2hhcnQucGxvdFRvcCkpIHtcblx0XHRcdFx0Y2hhcnQubWFwWm9vbShcblx0XHRcdFx0XHQwLjUsXG5cdFx0XHRcdFx0Y2hhcnQueEF4aXNbMF0udG9WYWx1ZShlLmNoYXJ0WCksXG5cdFx0XHRcdFx0Y2hhcnQueUF4aXNbMF0udG9WYWx1ZShlLmNoYXJ0WSlcblx0XHRcdFx0KTtcblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0LyoqXG5cdFx0ICogVGhlIGV2ZW50IGhhbmRsZXIgZm9yIHRoZSBtb3VzZSBzY3JvbGwgZXZlbnRcblx0XHQgKi9cblx0XHRvbkNvbnRhaW5lck1vdXNlV2hlZWw6IGZ1bmN0aW9uIChlKSB7XG5cdFx0XHR2YXIgY2hhcnQgPSB0aGlzLmNoYXJ0LFxuXHRcdFx0XHRkZWx0YTtcblxuXHRcdFx0ZSA9IHRoaXMubm9ybWFsaXplKGUpO1xuXG5cdFx0XHQvLyBGaXJlZm94IHVzZXMgZS5kZXRhaWwsIFdlYktpdCBhbmQgSUUgdXNlcyB3aGVlbERlbHRhXG5cdFx0XHRkZWx0YSA9IGUuZGV0YWlsIHx8IC0oZS53aGVlbERlbHRhIC8gMTIwKTtcblx0XHRcdGlmIChjaGFydC5pc0luc2lkZVBsb3QoZS5jaGFydFggLSBjaGFydC5wbG90TGVmdCwgZS5jaGFydFkgLSBjaGFydC5wbG90VG9wKSkge1xuXHRcdFx0XHRjaGFydC5tYXBab29tKFxuXHRcdFx0XHRcdGRlbHRhID4gMCA/IDIgOiAwLjUsXG5cdFx0XHRcdFx0Y2hhcnQueEF4aXNbMF0udG9WYWx1ZShlLmNoYXJ0WCksXG5cdFx0XHRcdFx0Y2hhcnQueUF4aXNbMF0udG9WYWx1ZShlLmNoYXJ0WSlcblx0XHRcdFx0KTtcblx0XHRcdH1cblx0XHR9XG5cdH0pO1xuXHQvLyBJbXBsZW1lbnQgdGhlIHBpbmNoVHlwZSBvcHRpb25cblx0d3JhcChQb2ludGVyLnByb3RvdHlwZSwgJ2luaXQnLCBmdW5jdGlvbiAocHJvY2VlZCwgY2hhcnQsIG9wdGlvbnMpIHtcblxuXHRcdHByb2NlZWQuY2FsbCh0aGlzLCBjaGFydCwgb3B0aW9ucyk7XG5cblx0XHQvLyBQaW5jaCBzdGF0dXNcblx0XHRpZiAob3B0aW9ucy5tYXBOYXZpZ2F0aW9uLmVuYWJsZVRvdWNoWm9vbSkge1xuXHRcdFx0dGhpcy5waW5jaFggPSB0aGlzLnBpbmNoSG9yID0gXG5cdFx0XHRcdHRoaXMucGluY2hZID0gdGhpcy5waW5jaFZlcnQgPSB0cnVlO1xuXHRcdH1cblx0fSk7XG5cblx0Ly8gQWRkIGV2ZW50cyB0byB0aGUgQ2hhcnQgb2JqZWN0IGl0c2VsZlxuXHRleHRlbmQoQ2hhcnQucHJvdG90eXBlLCB7XG5cdFx0cmVuZGVyTWFwTmF2aWdhdGlvbjogZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyIGNoYXJ0ID0gdGhpcyxcblx0XHRcdFx0b3B0aW9ucyA9IHRoaXMub3B0aW9ucy5tYXBOYXZpZ2F0aW9uLFxuXHRcdFx0XHRidXR0b25zID0gb3B0aW9ucy5idXR0b25zLFxuXHRcdFx0XHRuLFxuXHRcdFx0XHRidXR0b24sXG5cdFx0XHRcdGJ1dHRvbk9wdGlvbnMsXG5cdFx0XHRcdG91dGVySGFuZGxlciA9IGZ1bmN0aW9uICgpIHsgXG5cdFx0XHRcdFx0dGhpcy5oYW5kbGVyLmNhbGwoY2hhcnQpOyBcblx0XHRcdFx0fTtcblxuXHRcdFx0aWYgKG9wdGlvbnMuZW5hYmxlQnV0dG9ucykge1xuXHRcdFx0XHRmb3IgKG4gaW4gYnV0dG9ucykge1xuXHRcdFx0XHRcdGlmIChidXR0b25zLmhhc093blByb3BlcnR5KG4pKSB7XG5cdFx0XHRcdFx0XHRidXR0b25PcHRpb25zID0gbWVyZ2Uob3B0aW9ucy5idXR0b25PcHRpb25zLCBidXR0b25zW25dKTtcblxuXHRcdFx0XHRcdFx0YnV0dG9uID0gY2hhcnQucmVuZGVyZXIuYnV0dG9uKGJ1dHRvbk9wdGlvbnMudGV4dCwgMCwgMCwgb3V0ZXJIYW5kbGVyKVxuXHRcdFx0XHRcdFx0XHQuYXR0cih7XG5cdFx0XHRcdFx0XHRcdFx0d2lkdGg6IGJ1dHRvbk9wdGlvbnMud2lkdGgsXG5cdFx0XHRcdFx0XHRcdFx0aGVpZ2h0OiBidXR0b25PcHRpb25zLmhlaWdodFxuXHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHQuY3NzKGJ1dHRvbk9wdGlvbnMuc3R5bGUpXG5cdFx0XHRcdFx0XHRcdC5hZGQoKTtcblx0XHRcdFx0XHRcdGJ1dHRvbi5oYW5kbGVyID0gYnV0dG9uT3B0aW9ucy5vbmNsaWNrO1xuXHRcdFx0XHRcdFx0YnV0dG9uLmFsaWduKGV4dGVuZChidXR0b25PcHRpb25zLCB7IHdpZHRoOiBidXR0b24ud2lkdGgsIGhlaWdodDogYnV0dG9uLmhlaWdodCB9KSwgbnVsbCwgJ3NwYWNpbmdCb3gnKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0LyoqXG5cdFx0ICogRml0IGFuIGlubmVyIGJveCB0byBhbiBvdXRlci4gSWYgdGhlIGlubmVyIGJveCBvdmVyZmxvd3MgbGVmdCBvciByaWdodCwgYWxpZ24gaXQgdG8gdGhlIHNpZGVzIG9mIHRoZVxuXHRcdCAqIG91dGVyLiBJZiBpdCBvdmVyZmxvd3MgYm90aCBzaWRlcywgZml0IGl0IHdpdGhpbiB0aGUgb3V0ZXIuIFRoaXMgaXMgYSBwYXR0ZXJuIHRoYXQgb2NjdXJzIG1vcmUgcGxhY2VzXG5cdFx0ICogaW4gSGlnaGNoYXJ0cywgcGVyaGFwcyBpdCBzaG91bGQgYmUgZWxldmF0ZWQgdG8gYSBjb21tb24gdXRpbGl0eSBmdW5jdGlvbi5cblx0XHQgKi9cblx0XHRmaXRUb0JveDogZnVuY3Rpb24gKGlubmVyLCBvdXRlcikge1xuXHRcdFx0ZWFjaChbWyd4JywgJ3dpZHRoJ10sIFsneScsICdoZWlnaHQnXV0sIGZ1bmN0aW9uIChkaW0pIHtcblx0XHRcdFx0dmFyIHBvcyA9IGRpbVswXSxcblx0XHRcdFx0XHRzaXplID0gZGltWzFdO1xuXHRcdFx0XHRpZiAoaW5uZXJbcG9zXSArIGlubmVyW3NpemVdID4gb3V0ZXJbcG9zXSArIG91dGVyW3NpemVdKSB7IC8vIHJpZ2h0IG92ZXJmbG93XG5cdFx0XHRcdFx0aWYgKGlubmVyW3NpemVdID4gb3V0ZXJbc2l6ZV0pIHsgLy8gdGhlIGdlbmVyYWwgc2l6ZSBpcyBncmVhdGVyLCBmaXQgZnVsbHkgdG8gb3V0ZXJcblx0XHRcdFx0XHRcdGlubmVyW3NpemVdID0gb3V0ZXJbc2l6ZV07XG5cdFx0XHRcdFx0XHRpbm5lcltwb3NdID0gb3V0ZXJbcG9zXTtcblx0XHRcdFx0XHR9IGVsc2UgeyAvLyBhbGlnbiByaWdodFxuXHRcdFx0XHRcdFx0aW5uZXJbcG9zXSA9IG91dGVyW3Bvc10gKyBvdXRlcltzaXplXSAtIGlubmVyW3NpemVdO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoaW5uZXJbc2l6ZV0gPiBvdXRlcltzaXplXSkge1xuXHRcdFx0XHRcdGlubmVyW3NpemVdID0gb3V0ZXJbc2l6ZV07XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGlubmVyW3Bvc10gPCBvdXRlcltwb3NdKSB7XG5cdFx0XHRcdFx0aW5uZXJbcG9zXSA9IG91dGVyW3Bvc107XG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuIGlubmVyO1xuXHRcdH0sXG5cblx0XHQvKipcblx0XHQgKiBab29tIHRoZSBtYXAgaW4gb3Igb3V0IGJ5IGEgY2VydGFpbiBhbW91bnQuIExlc3MgdGhhbiAxIHpvb21zIGluLCBncmVhdGVyIHRoYW4gMSB6b29tcyBvdXQuXG5cdFx0ICovXG5cdFx0bWFwWm9vbTogZnVuY3Rpb24gKGhvd011Y2gsIGNlbnRlclhBcmcsIGNlbnRlcllBcmcpIHtcblxuXHRcdFx0aWYgKHRoaXMuaXNNYXBab29taW5nKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0dmFyIGNoYXJ0ID0gdGhpcyxcblx0XHRcdFx0eEF4aXMgPSBjaGFydC54QXhpc1swXSxcblx0XHRcdFx0eFJhbmdlID0geEF4aXMubWF4IC0geEF4aXMubWluLFxuXHRcdFx0XHRjZW50ZXJYID0gcGljayhjZW50ZXJYQXJnLCB4QXhpcy5taW4gKyB4UmFuZ2UgLyAyKSxcblx0XHRcdFx0bmV3WFJhbmdlID0geFJhbmdlICogaG93TXVjaCxcblx0XHRcdFx0eUF4aXMgPSBjaGFydC55QXhpc1swXSxcblx0XHRcdFx0eVJhbmdlID0geUF4aXMubWF4IC0geUF4aXMubWluLFxuXHRcdFx0XHRjZW50ZXJZID0gcGljayhjZW50ZXJZQXJnLCB5QXhpcy5taW4gKyB5UmFuZ2UgLyAyKSxcblx0XHRcdFx0bmV3WVJhbmdlID0geVJhbmdlICogaG93TXVjaCxcblx0XHRcdFx0bmV3WE1pbiA9IGNlbnRlclggLSBuZXdYUmFuZ2UgLyAyLFxuXHRcdFx0XHRuZXdZTWluID0gY2VudGVyWSAtIG5ld1lSYW5nZSAvIDIsXG5cdFx0XHRcdGFuaW1hdGlvbiA9IHBpY2soY2hhcnQub3B0aW9ucy5jaGFydC5hbmltYXRpb24sIHRydWUpLFxuXHRcdFx0XHRkZWxheSxcblx0XHRcdFx0bmV3RXh0ID0gY2hhcnQuZml0VG9Cb3goe1xuXHRcdFx0XHRcdHg6IG5ld1hNaW4sXG5cdFx0XHRcdFx0eTogbmV3WU1pbixcblx0XHRcdFx0XHR3aWR0aDogbmV3WFJhbmdlLFxuXHRcdFx0XHRcdGhlaWdodDogbmV3WVJhbmdlXG5cdFx0XHRcdH0sIHtcblx0XHRcdFx0XHR4OiB4QXhpcy5kYXRhTWluLFxuXHRcdFx0XHRcdHk6IHlBeGlzLmRhdGFNaW4sXG5cdFx0XHRcdFx0d2lkdGg6IHhBeGlzLmRhdGFNYXggLSB4QXhpcy5kYXRhTWluLFxuXHRcdFx0XHRcdGhlaWdodDogeUF4aXMuZGF0YU1heCAtIHlBeGlzLmRhdGFNaW5cblx0XHRcdFx0fSk7XG5cblx0XHRcdHhBeGlzLnNldEV4dHJlbWVzKG5ld0V4dC54LCBuZXdFeHQueCArIG5ld0V4dC53aWR0aCwgZmFsc2UpO1xuXHRcdFx0eUF4aXMuc2V0RXh0cmVtZXMobmV3RXh0LnksIG5ld0V4dC55ICsgbmV3RXh0LmhlaWdodCwgZmFsc2UpO1xuXG5cdFx0XHQvLyBQcmV2ZW50IHpvb21pbmcgdW50aWwgdGhpcyBvbmUgaXMgZmluaXNoZWQgYW5pbWF0aW5nXG5cdFx0XHRkZWxheSA9IGFuaW1hdGlvbiA/IGFuaW1hdGlvbi5kdXJhdGlvbiB8fCA1MDAgOiAwO1xuXHRcdFx0aWYgKGRlbGF5KSB7XG5cdFx0XHRcdGNoYXJ0LmlzTWFwWm9vbWluZyA9IHRydWU7XG5cdFx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdGNoYXJ0LmlzTWFwWm9vbWluZyA9IGZhbHNlO1xuXHRcdFx0XHR9LCBkZWxheSk7XG5cdFx0XHR9XG5cblx0XHRcdGNoYXJ0LnJlZHJhdygpO1xuXHRcdH1cblx0fSk7XG5cdFxuXHQvKipcblx0ICogRXh0ZW5kIHRoZSBkZWZhdWx0IG9wdGlvbnMgd2l0aCBtYXAgb3B0aW9uc1xuXHQgKi9cblx0cGxvdE9wdGlvbnMubWFwID0gbWVyZ2UocGxvdE9wdGlvbnMuc2NhdHRlciwge1xuXHRcdGFuaW1hdGlvbjogZmFsc2UsIC8vIG1ha2VzIHRoZSBjb21wbGV4IHNoYXBlcyBzbG93XG5cdFx0bnVsbENvbG9yOiAnI0Y4RjhGOCcsXG5cdFx0Ym9yZGVyQ29sb3I6ICdzaWx2ZXInLFxuXHRcdGJvcmRlcldpZHRoOiAxLFxuXHRcdG1hcmtlcjogbnVsbCxcblx0XHRzdGlja3lUcmFja2luZzogZmFsc2UsXG5cdFx0ZGF0YUxhYmVsczoge1xuXHRcdFx0dmVydGljYWxBbGlnbjogJ21pZGRsZSdcblx0XHR9LFxuXHRcdHR1cmJvVGhyZXNob2xkOiAwLFxuXHRcdHRvb2x0aXA6IHtcblx0XHRcdGZvbGxvd1BvaW50ZXI6IHRydWUsXG5cdFx0XHRwb2ludEZvcm1hdDogJ3twb2ludC5uYW1lfToge3BvaW50Lnl9PGJyLz4nXG5cdFx0fSxcblx0XHRzdGF0ZXM6IHtcblx0XHRcdG5vcm1hbDoge1xuXHRcdFx0XHRhbmltYXRpb246IHRydWVcblx0XHRcdH1cblx0XHR9XG5cdH0pO1xuXG5cdHZhciBNYXBBcmVhUG9pbnQgPSBIaWdoY2hhcnRzLmV4dGVuZENsYXNzKFBvaW50LCB7XG5cdFx0LyoqXG5cdFx0ICogRXh0ZW5kIHRoZSBQb2ludCBvYmplY3QgdG8gc3BsaXQgcGF0aHNcblx0XHQgKi9cblx0XHRhcHBseU9wdGlvbnM6IGZ1bmN0aW9uIChvcHRpb25zLCB4KSB7XG5cblx0XHRcdHZhciBwb2ludCA9IFBvaW50LnByb3RvdHlwZS5hcHBseU9wdGlvbnMuY2FsbCh0aGlzLCBvcHRpb25zLCB4KTtcblxuXHRcdFx0aWYgKHBvaW50LnBhdGggJiYgdHlwZW9mIHBvaW50LnBhdGggPT09ICdzdHJpbmcnKSB7XG5cdFx0XHRcdHBvaW50LnBhdGggPSBwb2ludC5vcHRpb25zLnBhdGggPSBIaWdoY2hhcnRzLnNwbGl0UGF0aChwb2ludC5wYXRoKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHBvaW50O1xuXHRcdH0sXG5cdFx0LyoqXG5cdFx0ICogU3RvcCB0aGUgZmFkZS1vdXQgXG5cdFx0ICovXG5cdFx0b25Nb3VzZU92ZXI6IGZ1bmN0aW9uICgpIHtcblx0XHRcdGNsZWFyVGltZW91dCh0aGlzLmNvbG9ySW50ZXJ2YWwpO1xuXHRcdFx0UG9pbnQucHJvdG90eXBlLm9uTW91c2VPdmVyLmNhbGwodGhpcyk7XG5cdFx0fSxcblx0XHQvKipcblx0XHQgKiBDdXN0b20gYW5pbWF0aW9uIGZvciB0d2VlbmluZyBvdXQgdGhlIGNvbG9ycy4gQW5pbWF0aW9uIHJlZHVjZXMgYmxpbmtpbmcgd2hlbiBob3ZlcmluZ1xuXHRcdCAqIG92ZXIgaXNsYW5kcyBhbmQgY29hc3QgbGluZXMuIFdlIHJ1biBhIGN1c3RvbSBpbXBsZW1lbnRhdGlvbiBvZiBhbmltYXRpb24gYmVjdWFzZSB3ZVxuXHRcdCAqIG5lZWQgdG8gYmUgYWJsZSB0byBydW4gdGhpcyBpbmRlcGVuZGVudGx5IGZyb20gb3RoZXIgYW5pbWF0aW9ucyBsaWtlIHpvb20gcmVkcmF3LiBBbHNvLFxuXHRcdCAqIGFkZGluZyBjb2xvciBhbmltYXRpb24gdG8gdGhlIGFkYXB0ZXJzIHdvdWxkIGludHJvZHVjZSBhbG1vc3QgdGhlIHNhbWUgYW1vdW50IG9mIGNvZGUuXG5cdFx0ICovXG5cdFx0b25Nb3VzZU91dDogZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyIHBvaW50ID0gdGhpcyxcblx0XHRcdFx0c3RhcnQgPSArbmV3IERhdGUoKSxcblx0XHRcdFx0bm9ybWFsQ29sb3IgPSBDb2xvcihwb2ludC5vcHRpb25zLmNvbG9yKSxcblx0XHRcdFx0aG92ZXJDb2xvciA9IENvbG9yKHBvaW50LnBvaW50QXR0ci5ob3Zlci5maWxsKSxcblx0XHRcdFx0YW5pbWF0aW9uID0gcG9pbnQuc2VyaWVzLm9wdGlvbnMuc3RhdGVzLm5vcm1hbC5hbmltYXRpb24sXG5cdFx0XHRcdGR1cmF0aW9uID0gYW5pbWF0aW9uICYmIChhbmltYXRpb24uZHVyYXRpb24gfHwgNTAwKTtcblxuXHRcdFx0aWYgKGR1cmF0aW9uICYmIG5vcm1hbENvbG9yLnJnYmEubGVuZ3RoID09PSA0ICYmIGhvdmVyQ29sb3IucmdiYS5sZW5ndGggPT09IDQpIHtcblx0XHRcdFx0ZGVsZXRlIHBvaW50LnBvaW50QXR0clsnJ10uZmlsbDsgLy8gYXZvaWQgcmVzZXR0aW5nIGl0IGluIFBvaW50LnNldFN0YXRlXG5cblx0XHRcdFx0Y2xlYXJUaW1lb3V0KHBvaW50LmNvbG9ySW50ZXJ2YWwpO1xuXHRcdFx0XHRwb2ludC5jb2xvckludGVydmFsID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdHZhciBwb3MgPSAobmV3IERhdGUoKSAtIHN0YXJ0KSAvIGR1cmF0aW9uLFxuXHRcdFx0XHRcdFx0Z3JhcGhpYyA9IHBvaW50LmdyYXBoaWM7XG5cdFx0XHRcdFx0aWYgKHBvcyA+IDEpIHtcblx0XHRcdFx0XHRcdHBvcyA9IDE7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmIChncmFwaGljKSB7XG5cdFx0XHRcdFx0XHRncmFwaGljLmF0dHIoJ2ZpbGwnLCB0d2VlbkNvbG9ycyhob3ZlckNvbG9yLCBub3JtYWxDb2xvciwgcG9zKSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmIChwb3MgPj0gMSkge1xuXHRcdFx0XHRcdFx0Y2xlYXJUaW1lb3V0KHBvaW50LmNvbG9ySW50ZXJ2YWwpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSwgMTMpO1xuXHRcdFx0fVxuXHRcdFx0UG9pbnQucHJvdG90eXBlLm9uTW91c2VPdXQuY2FsbChwb2ludCk7XG5cdFx0fVxuXHR9KTtcblxuXHQvKipcblx0ICogQWRkIHRoZSBzZXJpZXMgdHlwZVxuXHQgKi9cblx0c2VyaWVzVHlwZXMubWFwID0gSGlnaGNoYXJ0cy5leHRlbmRDbGFzcyhzZXJpZXNUeXBlcy5zY2F0dGVyLCB7XG5cdFx0dHlwZTogJ21hcCcsXG5cdFx0cG9pbnRBdHRyVG9PcHRpb25zOiB7IC8vIG1hcHBpbmcgYmV0d2VlbiBTVkcgYXR0cmlidXRlcyBhbmQgdGhlIGNvcnJlc3BvbmRpbmcgb3B0aW9uc1xuXHRcdFx0c3Ryb2tlOiAnYm9yZGVyQ29sb3InLFxuXHRcdFx0J3N0cm9rZS13aWR0aCc6ICdib3JkZXJXaWR0aCcsXG5cdFx0XHRmaWxsOiAnY29sb3InXG5cdFx0fSxcblx0XHRjb2xvcktleTogJ3knLFxuXHRcdHBvaW50Q2xhc3M6IE1hcEFyZWFQb2ludCxcblx0XHR0cmFja2VyR3JvdXBzOiBbJ2dyb3VwJywgJ21hcmtlckdyb3VwJywgJ2RhdGFMYWJlbHNHcm91cCddLFxuXHRcdGdldFN5bWJvbDogbm9vcCxcblx0XHRzdXBwb3J0c0RyaWxsZG93bjogdHJ1ZSxcblx0XHRnZXRFeHRyZW1lc0Zyb21BbGw6IHRydWUsXG5cdFx0dXNlTWFwR2VvbWV0cnk6IHRydWUsIC8vIGdldCBheGlzIGV4dHJlbWVzIGZyb20gcGF0aHMsIG5vdCB2YWx1ZXNcblx0XHRpbml0OiBmdW5jdGlvbiAoY2hhcnQpIHtcblx0XHRcdHZhciBzZXJpZXMgPSB0aGlzLFxuXHRcdFx0XHR2YWx1ZURlY2ltYWxzID0gY2hhcnQub3B0aW9ucy5sZWdlbmQudmFsdWVEZWNpbWFscyxcblx0XHRcdFx0bGVnZW5kSXRlbXMgPSBbXSxcblx0XHRcdFx0bmFtZSxcblx0XHRcdFx0ZnJvbSxcblx0XHRcdFx0dG8sXG5cdFx0XHRcdGZyb21MYWJlbCxcblx0XHRcdFx0dG9MYWJlbCxcblx0XHRcdFx0Y29sb3JSYW5nZSxcblx0XHRcdFx0dmFsdWVSYW5nZXMsXG5cdFx0XHRcdGdyYWRpZW50Q29sb3IsXG5cdFx0XHRcdGdyYWQsXG5cdFx0XHRcdHRtcExhYmVsLFxuXHRcdFx0XHRob3Jpem9udGFsID0gY2hhcnQub3B0aW9ucy5sZWdlbmQubGF5b3V0ID09PSAnaG9yaXpvbnRhbCc7XG5cblx0XHRcdFxuXHRcdFx0SGlnaGNoYXJ0cy5TZXJpZXMucHJvdG90eXBlLmluaXQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0XHRcdGNvbG9yUmFuZ2UgPSBzZXJpZXMub3B0aW9ucy5jb2xvclJhbmdlO1xuXHRcdFx0dmFsdWVSYW5nZXMgPSBzZXJpZXMub3B0aW9ucy52YWx1ZVJhbmdlcztcblxuXHRcdFx0aWYgKHZhbHVlUmFuZ2VzKSB7XG5cdFx0XHRcdGVhY2godmFsdWVSYW5nZXMsIGZ1bmN0aW9uIChyYW5nZSkge1xuXHRcdFx0XHRcdGZyb20gPSByYW5nZS5mcm9tO1xuXHRcdFx0XHRcdHRvID0gcmFuZ2UudG87XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0Ly8gQXNzZW1ibGUgdGhlIGRlZmF1bHQgbmFtZS4gVGhpcyBjYW4gYmUgb3ZlcnJpZGRlbiBieSBsZWdlbmQub3B0aW9ucy5sYWJlbEZvcm1hdHRlclxuXHRcdFx0XHRcdG5hbWUgPSAnJztcblx0XHRcdFx0XHRpZiAoZnJvbSA9PT0gVU5ERUZJTkVEKSB7XG5cdFx0XHRcdFx0XHRuYW1lID0gJzwgJztcblx0XHRcdFx0XHR9IGVsc2UgaWYgKHRvID09PSBVTkRFRklORUQpIHtcblx0XHRcdFx0XHRcdG5hbWUgPSAnPiAnO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAoZnJvbSAhPT0gVU5ERUZJTkVEKSB7XG5cdFx0XHRcdFx0XHRuYW1lICs9IG51bWJlckZvcm1hdChmcm9tLCB2YWx1ZURlY2ltYWxzKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYgKGZyb20gIT09IFVOREVGSU5FRCAmJiB0byAhPT0gVU5ERUZJTkVEKSB7XG5cdFx0XHRcdFx0XHRuYW1lICs9ICcgLSAnO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAodG8gIT09IFVOREVGSU5FRCkge1xuXHRcdFx0XHRcdFx0bmFtZSArPSBudW1iZXJGb3JtYXQodG8sIHZhbHVlRGVjaW1hbHMpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcblx0XHRcdFx0XHQvLyBBZGQgYSBtb2NrIG9iamVjdCB0byB0aGUgbGVnZW5kIGl0ZW1zXG5cdFx0XHRcdFx0bGVnZW5kSXRlbXMucHVzaChIaWdoY2hhcnRzLmV4dGVuZCh7XG5cdFx0XHRcdFx0XHRjaGFydDogc2VyaWVzLmNoYXJ0LFxuXHRcdFx0XHRcdFx0bmFtZTogbmFtZSxcblx0XHRcdFx0XHRcdG9wdGlvbnM6IHt9LFxuXHRcdFx0XHRcdFx0ZHJhd0xlZ2VuZFN5bWJvbDogc2VyaWVzVHlwZXMuYXJlYS5wcm90b3R5cGUuZHJhd0xlZ2VuZFN5bWJvbCxcblx0XHRcdFx0XHRcdHZpc2libGU6IHRydWUsXG5cdFx0XHRcdFx0XHRzZXRTdGF0ZTogZnVuY3Rpb24gKCkge30sXG5cdFx0XHRcdFx0XHRzZXRWaXNpYmxlOiBmdW5jdGlvbiAoKSB7fVxuXHRcdFx0XHRcdH0sIHJhbmdlKSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRzZXJpZXMubGVnZW5kSXRlbXMgPSBsZWdlbmRJdGVtcztcblxuXHRcdFx0fSBlbHNlIGlmIChjb2xvclJhbmdlKSB7XG5cblx0XHRcdFx0ZnJvbSA9IGNvbG9yUmFuZ2UuZnJvbTtcblx0XHRcdFx0dG8gPSBjb2xvclJhbmdlLnRvO1xuXHRcdFx0XHRmcm9tTGFiZWwgPSBjb2xvclJhbmdlLmZyb21MYWJlbDtcblx0XHRcdFx0dG9MYWJlbCA9IGNvbG9yUmFuZ2UudG9MYWJlbDtcblxuXHRcdFx0XHQvLyBGbGlwcyBsaW5lYXJHcmFkaWVudCB2YXJpYWJsZXMgYW5kIGxhYmVsIHRleHQuXG5cdFx0XHRcdGdyYWQgPSBob3Jpem9udGFsID8gWzAsIDAsIDEsIDBdIDogWzAsIDEsIDAsIDBdOyBcblx0XHRcdFx0aWYgKCFob3Jpem9udGFsKSB7XG5cdFx0XHRcdFx0dG1wTGFiZWwgPSBmcm9tTGFiZWw7XG5cdFx0XHRcdFx0ZnJvbUxhYmVsID0gdG9MYWJlbDtcblx0XHRcdFx0XHR0b0xhYmVsID0gdG1wTGFiZWw7XG5cdFx0XHRcdH0gXG5cblx0XHRcdFx0Ly8gQ3JlYXRlcyBjb2xvciBncmFkaWVudC5cblx0XHRcdFx0Z3JhZGllbnRDb2xvciA9IHtcblx0XHRcdFx0XHRsaW5lYXJHcmFkaWVudDogeyB4MTogZ3JhZFswXSwgeTE6IGdyYWRbMV0sIHgyOiBncmFkWzJdLCB5MjogZ3JhZFszXSB9LFxuXHRcdFx0XHRcdHN0b3BzOiBcblx0XHRcdFx0XHRbXG5cdFx0XHRcdFx0XHRbMCwgZnJvbV0sXG5cdFx0XHRcdFx0XHRbMSwgdG9dXG5cdFx0XHRcdFx0XVxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdC8vIEFkZCBhIG1vY2sgb2JqZWN0IHRvIHRoZSBsZWdlbmQgaXRlbXMuXG5cdFx0XHRcdGxlZ2VuZEl0ZW1zID0gW3tcblx0XHRcdFx0XHRjaGFydDogc2VyaWVzLmNoYXJ0LFxuXHRcdFx0XHRcdG9wdGlvbnM6IHt9LFxuXHRcdFx0XHRcdGZyb21MYWJlbDogZnJvbUxhYmVsLFxuXHRcdFx0XHRcdHRvTGFiZWw6IHRvTGFiZWwsXG5cdFx0XHRcdFx0Y29sb3I6IGdyYWRpZW50Q29sb3IsXG5cdFx0XHRcdFx0ZHJhd0xlZ2VuZFN5bWJvbDogdGhpcy5kcmF3TGVnZW5kU3ltYm9sR3JhZGllbnQsXG5cdFx0XHRcdFx0dmlzaWJsZTogdHJ1ZSxcblx0XHRcdFx0XHRzZXRTdGF0ZTogZnVuY3Rpb24gKCkge30sXG5cdFx0XHRcdFx0c2V0VmlzaWJsZTogZnVuY3Rpb24gKCkge31cblx0XHRcdFx0fV07XG5cblx0XHRcdFx0c2VyaWVzLmxlZ2VuZEl0ZW1zID0gbGVnZW5kSXRlbXM7XG5cdFx0XHR9XG5cdFx0fSxcblxuXHRcdC8qKlxuXHRcdCAqIElmIG5laXRoZXIgdmFsdWVSYW5nZXMgbm9yIGNvbG9yUmFuZ2VzIGFyZSBkZWZpbmVkLCB1c2UgYmFzaWMgYXJlYSBzeW1ib2wuXG5cdFx0ICovXG5cdFx0ZHJhd0xlZ2VuZFN5bWJvbDogc2VyaWVzVHlwZXMuYXJlYS5wcm90b3R5cGUuZHJhd0xlZ2VuZFN5bWJvbCxcblxuXHRcdC8qKlxuXHRcdCAqIEdldHMgdGhlIHNlcmllcycgc3ltYm9sIGluIHRoZSBsZWdlbmQgYW5kIGV4dGVuZGVkIGxlZ2VuZCB3aXRoIG1vcmUgaW5mb3JtYXRpb24uXG5cdFx0ICogXG5cdFx0ICogQHBhcmFtIHtPYmplY3R9IGxlZ2VuZCBUaGUgbGVnZW5kIG9iamVjdFxuXHRcdCAqIEBwYXJhbSB7T2JqZWN0fSBpdGVtIFRoZSBzZXJpZXMgKHRoaXMpIG9yIHBvaW50XG5cdFx0ICovXG5cdFx0ZHJhd0xlZ2VuZFN5bWJvbEdyYWRpZW50OiBmdW5jdGlvbiAobGVnZW5kLCBpdGVtKSB7XG5cdFx0XHR2YXIgc3BhY2luZyA9IGxlZ2VuZC5vcHRpb25zLnN5bWJvbFBhZGRpbmcsXG5cdFx0XHRcdHBhZGRpbmcgPSBwaWNrKGxlZ2VuZC5vcHRpb25zLnBhZGRpbmcsIDgpLFxuXHRcdFx0XHRwb3NpdGlvblksXG5cdFx0XHRcdHBvc2l0aW9uWCxcblx0XHRcdFx0Z3JhZGllbnRTaXplID0gdGhpcy5jaGFydC5yZW5kZXJlci5mb250TWV0cmljcyhsZWdlbmQub3B0aW9ucy5pdGVtU3R5bGUuZm9udFNpemUpLmgsXG5cdFx0XHRcdGhvcml6b250YWwgPSBsZWdlbmQub3B0aW9ucy5sYXlvdXQgPT09ICdob3Jpem9udGFsJyxcblx0XHRcdFx0Ym94MSxcblx0XHRcdFx0Ym94Mixcblx0XHRcdFx0Ym94Myxcblx0XHRcdFx0cmVjdGFuZ2xlTGVuZ3RoID0gcGljayhsZWdlbmQub3B0aW9ucy5yZWN0YW5nbGVMZW5ndGgsIDIwMCk7XG5cblx0XHRcdC8vIFNldCBsb2NhbCB2YXJpYWJsZXMgYmFzZWQgb24gb3B0aW9uLlxuXHRcdFx0aWYgKGhvcml6b250YWwpIHtcblx0XHRcdFx0cG9zaXRpb25ZID0gLShzcGFjaW5nIC8gMik7XG5cdFx0XHRcdHBvc2l0aW9uWCA9IDA7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRwb3NpdGlvblkgPSAtcmVjdGFuZ2xlTGVuZ3RoICsgbGVnZW5kLmJhc2VsaW5lIC0gKHNwYWNpbmcgLyAyKTtcblx0XHRcdFx0cG9zaXRpb25YID0gcGFkZGluZyArIGdyYWRpZW50U2l6ZTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gQ3JlYXRlcyB0aGUgZnJvbSB0ZXh0LlxuXHRcdFx0aXRlbS5mcm9tVGV4dCA9IHRoaXMuY2hhcnQucmVuZGVyZXIudGV4dChcblx0XHRcdFx0XHRpdGVtLmZyb21MYWJlbCxcdC8vIFRleHQuXG5cdFx0XHRcdFx0cG9zaXRpb25YLFx0XHQvLyBMb3dlciBsZWZ0IHguXG5cdFx0XHRcdFx0cG9zaXRpb25ZXHRcdC8vIExvd2VyIGxlZnQgeS5cblx0XHRcdFx0KS5hdHRyKHtcblx0XHRcdFx0XHR6SW5kZXg6IDJcblx0XHRcdFx0fSkuYWRkKGl0ZW0ubGVnZW5kR3JvdXApO1xuXHRcdFx0Ym94MSA9IGl0ZW0uZnJvbVRleHQuZ2V0QkJveCgpO1xuXG5cdFx0XHQvLyBDcmVhdGVzIGxlZ2VuZCBzeW1ib2wuXG5cdFx0XHQvLyBUZXJuYXJ5IGNoYW5nZXMgdmFyaWFibGVzIGJhc2VkIG9uIG9wdGlvbi5cblx0XHRcdGl0ZW0ubGVnZW5kU3ltYm9sID0gdGhpcy5jaGFydC5yZW5kZXJlci5yZWN0KFxuXHRcdFx0XHRob3Jpem9udGFsID8gYm94MS54ICsgYm94MS53aWR0aCArIHNwYWNpbmcgOiBib3gxLnggLSBncmFkaWVudFNpemUgLSBzcGFjaW5nLFx0XHQvLyBVcHBlciBsZWZ0IHguXG5cdFx0XHRcdGJveDEueSxcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Ly8gVXBwZXIgbGVmdCB5LlxuXHRcdFx0XHRob3Jpem9udGFsID8gcmVjdGFuZ2xlTGVuZ3RoIDogZ3JhZGllbnRTaXplLFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQvLyBXaWR0aC5cblx0XHRcdFx0aG9yaXpvbnRhbCA/IGdyYWRpZW50U2l6ZSA6IHJlY3RhbmdsZUxlbmd0aCxcdFx0XHRcdFx0XHRcdFx0XHRcdC8vIEhlaWdodC5cblx0XHRcdFx0Mlx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdC8vIENvcm5lciByYWRpdXMuXG5cdFx0XHQpLmF0dHIoe1xuXHRcdFx0XHR6SW5kZXg6IDFcblx0XHRcdH0pLmFkZChpdGVtLmxlZ2VuZEdyb3VwKTtcblx0XHRcdGJveDIgPSBpdGVtLmxlZ2VuZFN5bWJvbC5nZXRCQm94KCk7XG5cblx0XHRcdC8vIENyZWF0ZXMgdGhlIHRvIHRleHQuXG5cdFx0XHQvLyBWZXJ0aWNhbCBjb29yZGluYXRlIGNoYW5nZWQgYmFzZWQgb24gb3B0aW9uLlxuXHRcdFx0aXRlbS50b1RleHQgPSB0aGlzLmNoYXJ0LnJlbmRlcmVyLnRleHQoXG5cdFx0XHRcdFx0aXRlbS50b0xhYmVsLFxuXHRcdFx0XHRcdGJveDIueCArIGJveDIud2lkdGggKyBzcGFjaW5nLFxuXHRcdFx0XHRcdGhvcml6b250YWwgPyBwb3NpdGlvblkgOiBib3gyLnkgKyBib3gyLmhlaWdodCAtIHNwYWNpbmdcblx0XHRcdFx0KS5hdHRyKHtcblx0XHRcdFx0XHR6SW5kZXg6IDJcblx0XHRcdFx0fSkuYWRkKGl0ZW0ubGVnZW5kR3JvdXApO1xuXHRcdFx0Ym94MyA9IGl0ZW0udG9UZXh0LmdldEJCb3goKTtcblxuXHRcdFx0Ly8gQ2hhbmdlcyBsZWdlbmQgYm94IHNldHRpbmdzIGJhc2VkIG9uIG9wdGlvbi5cblx0XHRcdGlmIChob3Jpem9udGFsKSB7XG5cdFx0XHRcdGxlZ2VuZC5vZmZzZXRXaWR0aCA9IGJveDEud2lkdGggKyBib3gyLndpZHRoICsgYm94My53aWR0aCArIChzcGFjaW5nICogMikgKyBwYWRkaW5nO1xuXHRcdFx0XHRsZWdlbmQuaXRlbVkgPSBncmFkaWVudFNpemUgKyBwYWRkaW5nO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0bGVnZW5kLm9mZnNldFdpZHRoID0gTWF0aC5tYXgoYm94MS53aWR0aCwgYm94My53aWR0aCkgKyAoc3BhY2luZykgKyBib3gyLndpZHRoICsgcGFkZGluZztcblx0XHRcdFx0bGVnZW5kLml0ZW1ZID0gYm94Mi5oZWlnaHQgKyBwYWRkaW5nO1xuXHRcdFx0XHRsZWdlbmQuaXRlbVggPSBzcGFjaW5nO1xuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHQvKipcblx0XHQgKiBHZXQgdGhlIGJvdW5kaW5nIGJveCBvZiBhbGwgcGF0aHMgaW4gdGhlIG1hcCBjb21iaW5lZC5cblx0XHQgKi9cblx0XHRnZXRCb3g6IGZ1bmN0aW9uIChwYXRocykge1xuXHRcdFx0dmFyIG1heFggPSBOdW1iZXIuTUlOX1ZBTFVFLCBcblx0XHRcdFx0bWluWCA9ICBOdW1iZXIuTUFYX1ZBTFVFLCBcblx0XHRcdFx0bWF4WSA9IE51bWJlci5NSU5fVkFMVUUsIFxuXHRcdFx0XHRtaW5ZID0gIE51bWJlci5NQVhfVkFMVUU7XG5cdFx0XHRcblx0XHRcdFxuXHRcdFx0Ly8gRmluZCB0aGUgYm91bmRpbmcgYm94XG5cdFx0XHRlYWNoKHBhdGhzIHx8IHRoaXMub3B0aW9ucy5kYXRhLCBmdW5jdGlvbiAocG9pbnQpIHtcblx0XHRcdFx0dmFyIHBhdGggPSBwb2ludC5wYXRoLFxuXHRcdFx0XHRcdGkgPSBwYXRoLmxlbmd0aCxcblx0XHRcdFx0XHRldmVuID0gZmFsc2UsIC8vIHdoaWxlIGxvb3AgcmVhZHMgZnJvbSB0aGUgZW5kXG5cdFx0XHRcdFx0cG9pbnRNYXhYID0gTnVtYmVyLk1JTl9WQUxVRSwgXG5cdFx0XHRcdFx0cG9pbnRNaW5YID0gIE51bWJlci5NQVhfVkFMVUUsIFxuXHRcdFx0XHRcdHBvaW50TWF4WSA9IE51bWJlci5NSU5fVkFMVUUsIFxuXHRcdFx0XHRcdHBvaW50TWluWSA9ICBOdW1iZXIuTUFYX1ZBTFVFO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHR3aGlsZSAoaS0tKSB7XG5cdFx0XHRcdFx0aWYgKHR5cGVvZiBwYXRoW2ldID09PSAnbnVtYmVyJyAmJiAhaXNOYU4ocGF0aFtpXSkpIHtcblx0XHRcdFx0XHRcdGlmIChldmVuKSB7IC8vIGV2ZW4gPSB4XG5cdFx0XHRcdFx0XHRcdHBvaW50TWF4WCA9IE1hdGgubWF4KHBvaW50TWF4WCwgcGF0aFtpXSk7XG5cdFx0XHRcdFx0XHRcdHBvaW50TWluWCA9IE1hdGgubWluKHBvaW50TWluWCwgcGF0aFtpXSk7XG5cdFx0XHRcdFx0XHR9IGVsc2UgeyAvLyBvZGQgPSBZXG5cdFx0XHRcdFx0XHRcdHBvaW50TWF4WSA9IE1hdGgubWF4KHBvaW50TWF4WSwgcGF0aFtpXSk7XG5cdFx0XHRcdFx0XHRcdHBvaW50TWluWSA9IE1hdGgubWluKHBvaW50TWluWSwgcGF0aFtpXSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRldmVuID0gIWV2ZW47XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIENhY2hlIHBvaW50IGJvdW5kaW5nIGJveCBmb3IgdXNlIHRvIHBvc2l0aW9uIGRhdGEgbGFiZWxzXG5cdFx0XHRcdHBvaW50Ll9tYXhYID0gcG9pbnRNYXhYO1xuXHRcdFx0XHRwb2ludC5fbWluWCA9IHBvaW50TWluWDtcblx0XHRcdFx0cG9pbnQuX21heFkgPSBwb2ludE1heFk7XG5cdFx0XHRcdHBvaW50Ll9taW5ZID0gcG9pbnRNaW5ZO1xuXG5cdFx0XHRcdG1heFggPSBNYXRoLm1heChtYXhYLCBwb2ludE1heFgpO1xuXHRcdFx0XHRtaW5YID0gTWF0aC5taW4obWluWCwgcG9pbnRNaW5YKTtcblx0XHRcdFx0bWF4WSA9IE1hdGgubWF4KG1heFksIHBvaW50TWF4WSk7XG5cdFx0XHRcdG1pblkgPSBNYXRoLm1pbihtaW5ZLCBwb2ludE1pblkpO1xuXHRcdFx0fSk7XG5cdFx0XHR0aGlzLm1pblkgPSBtaW5ZO1xuXHRcdFx0dGhpcy5tYXhZID0gbWF4WTtcblx0XHRcdHRoaXMubWluWCA9IG1pblg7XG5cdFx0XHR0aGlzLm1heFggPSBtYXhYO1xuXHRcdFx0XG5cdFx0fSxcblx0XHRcblx0XHRcblx0XHRcblx0XHQvKipcblx0XHQgKiBUcmFuc2xhdGUgdGhlIHBhdGggc28gdGhhdCBpdCBhdXRvbWF0aWNhbGx5IGZpdHMgaW50byB0aGUgcGxvdCBhcmVhIGJveFxuXHRcdCAqIEBwYXJhbSB7T2JqZWN0fSBwYXRoXG5cdFx0ICovXG5cdFx0dHJhbnNsYXRlUGF0aDogZnVuY3Rpb24gKHBhdGgpIHtcblx0XHRcdFxuXHRcdFx0dmFyIHNlcmllcyA9IHRoaXMsXG5cdFx0XHRcdGV2ZW4gPSBmYWxzZSwgLy8gd2hpbGUgbG9vcCByZWFkcyBmcm9tIHRoZSBlbmRcblx0XHRcdFx0eEF4aXMgPSBzZXJpZXMueEF4aXMsXG5cdFx0XHRcdHlBeGlzID0gc2VyaWVzLnlBeGlzLFxuXHRcdFx0XHRpO1xuXHRcdFx0XHRcblx0XHRcdC8vIFByZXNlcnZlIHRoZSBvcmlnaW5hbFxuXHRcdFx0cGF0aCA9IFtdLmNvbmNhdChwYXRoKTtcblx0XHRcdFx0XG5cdFx0XHQvLyBEbyB0aGUgdHJhbnNsYXRpb25cblx0XHRcdGkgPSBwYXRoLmxlbmd0aDtcblx0XHRcdHdoaWxlIChpLS0pIHtcblx0XHRcdFx0aWYgKHR5cGVvZiBwYXRoW2ldID09PSAnbnVtYmVyJykge1xuXHRcdFx0XHRcdGlmIChldmVuKSB7IC8vIGV2ZW4gPSB4XG5cdFx0XHRcdFx0XHRwYXRoW2ldID0gTWF0aC5yb3VuZCh4QXhpcy50cmFuc2xhdGUocGF0aFtpXSkpO1xuXHRcdFx0XHRcdH0gZWxzZSB7IC8vIG9kZCA9IFlcblx0XHRcdFx0XHRcdHBhdGhbaV0gPSBNYXRoLnJvdW5kKHlBeGlzLmxlbiAtIHlBeGlzLnRyYW5zbGF0ZShwYXRoW2ldKSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGV2ZW4gPSAhZXZlbjtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHBhdGg7XG5cdFx0fSxcblx0XHRcblx0XHRzZXREYXRhOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRIaWdoY2hhcnRzLlNlcmllcy5wcm90b3R5cGUuc2V0RGF0YS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHRcdFx0dGhpcy5nZXRCb3goKTtcblx0XHR9LFxuXHRcdFxuXHRcdC8qKlxuXHRcdCAqIEFkZCB0aGUgcGF0aCBvcHRpb24gZm9yIGRhdGEgcG9pbnRzLiBGaW5kIHRoZSBtYXggdmFsdWUgZm9yIGNvbG9yIGNhbGN1bGF0aW9uLlxuXHRcdCAqL1xuXHRcdHRyYW5zbGF0ZTogZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyIHNlcmllcyA9IHRoaXMsXG5cdFx0XHRcdGRhdGFNaW4gPSBOdW1iZXIuTUFYX1ZBTFVFLFxuXHRcdFx0XHRkYXRhTWF4ID0gTnVtYmVyLk1JTl9WQUxVRTtcblx0XG5cdFx0XHRzZXJpZXMuZ2VuZXJhdGVQb2ludHMoKTtcblx0XG5cdFx0XHRlYWNoKHNlcmllcy5kYXRhLCBmdW5jdGlvbiAocG9pbnQpIHtcblx0XHRcdFx0XG5cdFx0XHRcdHBvaW50LnNoYXBlVHlwZSA9ICdwYXRoJztcblx0XHRcdFx0cG9pbnQuc2hhcGVBcmdzID0ge1xuXHRcdFx0XHRcdGQ6IHNlcmllcy50cmFuc2xhdGVQYXRoKHBvaW50LnBhdGgpXG5cdFx0XHRcdH07XG5cdFx0XHRcdFxuXHRcdFx0XHQvLyBUT0RPOiBkbyBwb2ludCBjb2xvcnMgaW4gZHJhd1BvaW50cyBpbnN0ZWFkIG9mIHBvaW50LmluaXRcblx0XHRcdFx0aWYgKHR5cGVvZiBwb2ludC55ID09PSAnbnVtYmVyJykge1xuXHRcdFx0XHRcdGlmIChwb2ludC55ID4gZGF0YU1heCkge1xuXHRcdFx0XHRcdFx0ZGF0YU1heCA9IHBvaW50Lnk7XG5cdFx0XHRcdFx0fSBlbHNlIGlmIChwb2ludC55IDwgZGF0YU1pbikge1xuXHRcdFx0XHRcdFx0ZGF0YU1pbiA9IHBvaW50Lnk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHRcdFxuXHRcdFx0c2VyaWVzLnRyYW5zbGF0ZUNvbG9ycyhkYXRhTWluLCBkYXRhTWF4KTtcblx0XHR9LFxuXHRcdFxuXHRcdC8qKlxuXHRcdCAqIEluIGNob3JvcGxldGggbWFwcywgdGhlIGNvbG9yIGlzIGEgcmVzdWx0IG9mIHRoZSB2YWx1ZSwgc28gdGhpcyBuZWVkcyB0cmFuc2xhdGlvbiB0b29cblx0XHQgKi9cblx0XHR0cmFuc2xhdGVDb2xvcnM6IGZ1bmN0aW9uIChkYXRhTWluLCBkYXRhTWF4KSB7XG5cdFx0XHRcblx0XHRcdHZhciBzZXJpZXNPcHRpb25zID0gdGhpcy5vcHRpb25zLFxuXHRcdFx0XHR2YWx1ZVJhbmdlcyA9IHNlcmllc09wdGlvbnMudmFsdWVSYW5nZXMsXG5cdFx0XHRcdGNvbG9yUmFuZ2UgPSBzZXJpZXNPcHRpb25zLmNvbG9yUmFuZ2UsXG5cdFx0XHRcdGNvbG9yS2V5ID0gdGhpcy5jb2xvcktleSxcblx0XHRcdFx0ZnJvbSxcblx0XHRcdFx0dG87XG5cblx0XHRcdGlmIChjb2xvclJhbmdlKSB7XG5cdFx0XHRcdGZyb20gPSBDb2xvcihjb2xvclJhbmdlLmZyb20pO1xuXHRcdFx0XHR0byA9IENvbG9yKGNvbG9yUmFuZ2UudG8pO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHRlYWNoKHRoaXMuZGF0YSwgZnVuY3Rpb24gKHBvaW50KSB7XG5cdFx0XHRcdHZhciB2YWx1ZSA9IHBvaW50W2NvbG9yS2V5XSxcblx0XHRcdFx0XHRyYW5nZSxcblx0XHRcdFx0XHRjb2xvcixcblx0XHRcdFx0XHRpLFxuXHRcdFx0XHRcdHBvcztcblxuXHRcdFx0XHRpZiAodmFsdWVSYW5nZXMpIHtcblx0XHRcdFx0XHRpID0gdmFsdWVSYW5nZXMubGVuZ3RoO1xuXHRcdFx0XHRcdHdoaWxlIChpLS0pIHtcblx0XHRcdFx0XHRcdHJhbmdlID0gdmFsdWVSYW5nZXNbaV07XG5cdFx0XHRcdFx0XHRmcm9tID0gcmFuZ2UuZnJvbTtcblx0XHRcdFx0XHRcdHRvID0gcmFuZ2UudG87XG5cdFx0XHRcdFx0XHRpZiAoKGZyb20gPT09IFVOREVGSU5FRCB8fCB2YWx1ZSA+PSBmcm9tKSAmJiAodG8gPT09IFVOREVGSU5FRCB8fCB2YWx1ZSA8PSB0bykpIHtcblx0XHRcdFx0XHRcdFx0Y29sb3IgPSByYW5nZS5jb2xvcjtcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIGlmIChjb2xvclJhbmdlICYmIHZhbHVlICE9PSB1bmRlZmluZWQpIHtcblxuXHRcdFx0XHRcdHBvcyA9IDEgLSAoKGRhdGFNYXggLSB2YWx1ZSkgLyAoZGF0YU1heCAtIGRhdGFNaW4pKTtcblx0XHRcdFx0XHRjb2xvciA9IHZhbHVlID09PSBudWxsID8gc2VyaWVzT3B0aW9ucy5udWxsQ29sb3IgOiB0d2VlbkNvbG9ycyhmcm9tLCB0bywgcG9zKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChjb2xvcikge1xuXHRcdFx0XHRcdHBvaW50LmNvbG9yID0gbnVsbDsgLy8gcmVzZXQgZnJvbSBwcmV2aW91cyBkcmlsbGRvd25zLCB1c2Ugb2YgdGhlIHNhbWUgZGF0YSBvcHRpb25zXG5cdFx0XHRcdFx0cG9pbnQub3B0aW9ucy5jb2xvciA9IGNvbG9yO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9LFxuXHRcdFxuXHRcdGRyYXdHcmFwaDogbm9vcCxcblx0XHRcblx0XHQvKipcblx0XHQgKiBXZSBuZWVkIHRoZSBwb2ludHMnIGJvdW5kaW5nIGJveGVzIGluIG9yZGVyIHRvIGRyYXcgdGhlIGRhdGEgbGFiZWxzLCBzbyBcblx0XHQgKiB3ZSBza2lwIGl0IG5vdyBhbmQgY2FsbCBpZiBmcm9tIGRyYXdQb2ludHMgaW5zdGVhZC5cblx0XHQgKi9cblx0XHRkcmF3RGF0YUxhYmVsczogbm9vcCxcblx0XHRcblx0XHQvKiogXG5cdFx0ICogVXNlIHRoZSBkcmF3UG9pbnRzIG1ldGhvZCBvZiBjb2x1bW4sIHRoYXQgaXMgYWJsZSB0byBoYW5kbGUgc2ltcGxlIHNoYXBlQXJncy5cblx0XHQgKiBFeHRlbmQgaXQgYnkgYXNzaWduaW5nIHRoZSB0b29sdGlwIHBvc2l0aW9uLlxuXHRcdCAqL1xuXHRcdGRyYXdQb2ludHM6IGZ1bmN0aW9uICgpIHtcblx0XHRcdHZhciBzZXJpZXMgPSB0aGlzLFxuXHRcdFx0XHR4QXhpcyA9IHNlcmllcy54QXhpcyxcblx0XHRcdFx0eUF4aXMgPSBzZXJpZXMueUF4aXMsXG5cdFx0XHRcdGNvbG9yS2V5ID0gc2VyaWVzLmNvbG9yS2V5O1xuXHRcdFx0XG5cdFx0XHQvLyBNYWtlIHBvaW50cyBwYXNzIHRlc3QgaW4gZHJhd2luZ1xuXHRcdFx0ZWFjaChzZXJpZXMuZGF0YSwgZnVuY3Rpb24gKHBvaW50KSB7XG5cdFx0XHRcdHBvaW50LnBsb3RZID0gMTsgLy8gcGFzcyBudWxsIHRlc3QgaW4gY29sdW1uLmRyYXdQb2ludHNcblx0XHRcdFx0aWYgKHBvaW50W2NvbG9yS2V5XSA9PT0gbnVsbCkge1xuXHRcdFx0XHRcdHBvaW50W2NvbG9yS2V5XSA9IDA7XG5cdFx0XHRcdFx0cG9pbnQuaXNOdWxsID0gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHRcblx0XHRcdC8vIERyYXcgdGhlbVxuXHRcdFx0c2VyaWVzVHlwZXMuY29sdW1uLnByb3RvdHlwZS5kcmF3UG9pbnRzLmFwcGx5KHNlcmllcyk7XG5cdFx0XHRcblx0XHRcdGVhY2goc2VyaWVzLmRhdGEsIGZ1bmN0aW9uIChwb2ludCkge1xuXG5cdFx0XHRcdHZhciBkYXRhTGFiZWxzID0gcG9pbnQuZGF0YUxhYmVscyxcblx0XHRcdFx0XHRtaW5YID0geEF4aXMudG9QaXhlbHMocG9pbnQuX21pblgsIHRydWUpLFxuXHRcdFx0XHRcdG1heFggPSB4QXhpcy50b1BpeGVscyhwb2ludC5fbWF4WCwgdHJ1ZSksXG5cdFx0XHRcdFx0bWluWSA9IHlBeGlzLnRvUGl4ZWxzKHBvaW50Ll9taW5ZLCB0cnVlKSxcblx0XHRcdFx0XHRtYXhZID0geUF4aXMudG9QaXhlbHMocG9pbnQuX21heFksIHRydWUpO1xuXG5cdFx0XHRcdHBvaW50LnBsb3RYID0gTWF0aC5yb3VuZChtaW5YICsgKG1heFggLSBtaW5YKSAqIHBpY2soZGF0YUxhYmVscyAmJiBkYXRhTGFiZWxzLmFuY2hvclgsIDAuNSkpO1xuXHRcdFx0XHRwb2ludC5wbG90WSA9IE1hdGgucm91bmQobWluWSArIChtYXhZIC0gbWluWSkgKiBwaWNrKGRhdGFMYWJlbHMgJiYgZGF0YUxhYmVscy5hbmNob3JZLCAwLjUpKTsgXG5cdFx0XHRcdFxuXHRcdFx0XHRcblx0XHRcdFx0Ly8gUmVzZXQgZXNjYXBlZCBudWxsIHBvaW50c1xuXHRcdFx0XHRpZiAocG9pbnQuaXNOdWxsKSB7XG5cdFx0XHRcdFx0cG9pbnRbY29sb3JLZXldID0gbnVsbDtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdC8vIE5vdyBkcmF3IHRoZSBkYXRhIGxhYmVsc1xuXHRcdFx0SGlnaGNoYXJ0cy5TZXJpZXMucHJvdG90eXBlLmRyYXdEYXRhTGFiZWxzLmNhbGwoc2VyaWVzKTtcblx0XHRcdFxuXHRcdH0sXG5cblx0XHQvKipcblx0XHQgKiBBbmltYXRlIGluIHRoZSBuZXcgc2VyaWVzIGZyb20gdGhlIGNsaWNrZWQgcG9pbnQgaW4gdGhlIG9sZCBzZXJpZXMuXG5cdFx0ICogRGVwZW5kcyBvbiB0aGUgZHJpbGxkb3duLmpzIG1vZHVsZVxuXHRcdCAqL1xuXHRcdGFuaW1hdGVEcmlsbGRvd246IGZ1bmN0aW9uIChpbml0KSB7XG5cdFx0XHR2YXIgdG9Cb3ggPSB0aGlzLmNoYXJ0LnBsb3RCb3gsXG5cdFx0XHRcdGxldmVsID0gdGhpcy5jaGFydC5kcmlsbGRvd25MZXZlbHNbdGhpcy5jaGFydC5kcmlsbGRvd25MZXZlbHMubGVuZ3RoIC0gMV0sXG5cdFx0XHRcdGZyb21Cb3ggPSBsZXZlbC5iQm94LFxuXHRcdFx0XHRhbmltYXRpb25PcHRpb25zID0gdGhpcy5jaGFydC5vcHRpb25zLmRyaWxsZG93bi5hbmltYXRpb24sXG5cdFx0XHRcdHNjYWxlO1xuXHRcdFx0XHRcblx0XHRcdGlmICghaW5pdCkge1xuXG5cdFx0XHRcdHNjYWxlID0gTWF0aC5taW4oZnJvbUJveC53aWR0aCAvIHRvQm94LndpZHRoLCBmcm9tQm94LmhlaWdodCAvIHRvQm94LmhlaWdodCk7XG5cdFx0XHRcdGxldmVsLnNoYXBlQXJncyA9IHtcblx0XHRcdFx0XHRzY2FsZVg6IHNjYWxlLFxuXHRcdFx0XHRcdHNjYWxlWTogc2NhbGUsXG5cdFx0XHRcdFx0dHJhbnNsYXRlWDogZnJvbUJveC54LFxuXHRcdFx0XHRcdHRyYW5zbGF0ZVk6IGZyb21Cb3gueVxuXHRcdFx0XHR9O1xuXHRcdFx0XHRcblx0XHRcdFx0Ly8gVE9ETzogQW5pbWF0ZSB0aGlzLmdyb3VwIGluc3RlYWRcblx0XHRcdFx0ZWFjaCh0aGlzLnBvaW50cywgZnVuY3Rpb24gKHBvaW50KSB7XG5cblx0XHRcdFx0XHRwb2ludC5ncmFwaGljXG5cdFx0XHRcdFx0XHQuYXR0cihsZXZlbC5zaGFwZUFyZ3MpXG5cdFx0XHRcdFx0XHQuYW5pbWF0ZSh7XG5cdFx0XHRcdFx0XHRcdHNjYWxlWDogMSxcblx0XHRcdFx0XHRcdFx0c2NhbGVZOiAxLFxuXHRcdFx0XHRcdFx0XHR0cmFuc2xhdGVYOiAwLFxuXHRcdFx0XHRcdFx0XHR0cmFuc2xhdGVZOiAwXG5cdFx0XHRcdFx0XHR9LCBhbmltYXRpb25PcHRpb25zKTtcblxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRkZWxldGUgdGhpcy5hbmltYXRlO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0fSxcblxuXHRcdC8qKlxuXHRcdCAqIFdoZW4gZHJpbGxpbmcgdXAsIHB1bGwgb3V0IHRoZSBpbmRpdmlkdWFsIHBvaW50IGdyYXBoaWNzIGZyb20gdGhlIGxvd2VyIHNlcmllc1xuXHRcdCAqIGFuZCBhbmltYXRlIHRoZW0gaW50byB0aGUgb3JpZ2luIHBvaW50IGluIHRoZSB1cHBlciBzZXJpZXMuXG5cdFx0ICovXG5cdFx0YW5pbWF0ZURyaWxsdXBGcm9tOiBmdW5jdGlvbiAobGV2ZWwpIHtcblx0XHRcdHNlcmllc1R5cGVzLmNvbHVtbi5wcm90b3R5cGUuYW5pbWF0ZURyaWxsdXBGcm9tLmNhbGwodGhpcywgbGV2ZWwpO1xuXHRcdH0sXG5cblxuXHRcdC8qKlxuXHRcdCAqIFdoZW4gZHJpbGxpbmcgdXAsIGtlZXAgdGhlIHVwcGVyIHNlcmllcyBpbnZpc2libGUgdW50aWwgdGhlIGxvd2VyIHNlcmllcyBoYXNcblx0XHQgKiBtb3ZlZCBpbnRvIHBsYWNlXG5cdFx0ICovXG5cdFx0YW5pbWF0ZURyaWxsdXBUbzogZnVuY3Rpb24gKGluaXQpIHtcblx0XHRcdHNlcmllc1R5cGVzLmNvbHVtbi5wcm90b3R5cGUuYW5pbWF0ZURyaWxsdXBUby5jYWxsKHRoaXMsIGluaXQpO1xuXHRcdH1cblx0fSk7XG5cblxuXHQvLyBUaGUgbWFwbGluZSBzZXJpZXMgdHlwZVxuXHRwbG90T3B0aW9ucy5tYXBsaW5lID0gbWVyZ2UocGxvdE9wdGlvbnMubWFwLCB7XG5cdFx0bGluZVdpZHRoOiAxLFxuXHRcdGJhY2tncm91bmRDb2xvcjogJ25vbmUnXG5cdH0pO1xuXHRzZXJpZXNUeXBlcy5tYXBsaW5lID0gSGlnaGNoYXJ0cy5leHRlbmRDbGFzcyhzZXJpZXNUeXBlcy5tYXAsIHtcblx0XHR0eXBlOiAnbWFwbGluZScsXG5cdFx0cG9pbnRBdHRyVG9PcHRpb25zOiB7IC8vIG1hcHBpbmcgYmV0d2VlbiBTVkcgYXR0cmlidXRlcyBhbmQgdGhlIGNvcnJlc3BvbmRpbmcgb3B0aW9uc1xuXHRcdFx0c3Ryb2tlOiAnY29sb3InLFxuXHRcdFx0J3N0cm9rZS13aWR0aCc6ICdsaW5lV2lkdGgnLFxuXHRcdFx0ZmlsbDogJ2JhY2tncm91bmRDb2xvcidcblx0XHR9LFxuXHRcdGRyYXdMZWdlbmRTeW1ib2w6IHNlcmllc1R5cGVzLmxpbmUucHJvdG90eXBlLmRyYXdMZWdlbmRTeW1ib2xcblx0fSk7XG5cblx0Ly8gVGhlIG1hcHBvaW50IHNlcmllcyB0eXBlXG5cdHBsb3RPcHRpb25zLm1hcHBvaW50ID0gbWVyZ2UocGxvdE9wdGlvbnMuc2NhdHRlciwge1xuXHRcdGRhdGFMYWJlbHM6IHtcblx0XHRcdGVuYWJsZWQ6IHRydWUsXG5cdFx0XHRmb3JtYXQ6ICd7cG9pbnQubmFtZX0nLFxuXHRcdFx0Y29sb3I6ICdibGFjaycsXG5cdFx0XHRzdHlsZToge1xuXHRcdFx0XHR0ZXh0U2hhZG93OiAnMCAwIDVweCB3aGl0ZSdcblx0XHRcdH1cblx0XHR9XG5cdH0pO1xuXHRzZXJpZXNUeXBlcy5tYXBwb2ludCA9IEhpZ2hjaGFydHMuZXh0ZW5kQ2xhc3Moc2VyaWVzVHlwZXMuc2NhdHRlciwge1xuXHRcdHR5cGU6ICdtYXBwb2ludCdcblx0fSk7XG5cdFxuXG5cdFxuXHQvKipcblx0ICogQSB3cmFwcGVyIGZvciBDaGFydCB3aXRoIGFsbCB0aGUgZGVmYXVsdCB2YWx1ZXMgZm9yIGEgTWFwXG5cdCAqL1xuXHRIaWdoY2hhcnRzLk1hcCA9IGZ1bmN0aW9uIChvcHRpb25zLCBjYWxsYmFjaykge1xuXHRcdFxuXHRcdHZhciBoaWRkZW5BeGlzID0ge1xuXHRcdFx0XHRlbmRPblRpY2s6IGZhbHNlLFxuXHRcdFx0XHRncmlkTGluZVdpZHRoOiAwLFxuXHRcdFx0XHRsYWJlbHM6IHtcblx0XHRcdFx0XHRlbmFibGVkOiBmYWxzZVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRsaW5lV2lkdGg6IDAsXG5cdFx0XHRcdG1pblBhZGRpbmc6IDAsXG5cdFx0XHRcdG1heFBhZGRpbmc6IDAsXG5cdFx0XHRcdHN0YXJ0T25UaWNrOiBmYWxzZSxcblx0XHRcdFx0dGlja1dpZHRoOiAwLFxuXHRcdFx0XHR0aXRsZTogbnVsbFxuXHRcdFx0fSxcblx0XHRcdHNlcmllc09wdGlvbnM7XG5cdFx0XG5cdFx0Ly8gRG9uJ3QgbWVyZ2UgdGhlIGRhdGFcblx0XHRzZXJpZXNPcHRpb25zID0gb3B0aW9ucy5zZXJpZXM7XG5cdFx0b3B0aW9ucy5zZXJpZXMgPSBudWxsO1xuXHRcdFxuXHRcdG9wdGlvbnMgPSBtZXJnZSh7XG5cdFx0XHRjaGFydDoge1xuXHRcdFx0XHR0eXBlOiAnbWFwJyxcblx0XHRcdFx0cGFubmluZzogJ3h5J1xuXHRcdFx0fSxcblx0XHRcdHhBeGlzOiBoaWRkZW5BeGlzLFxuXHRcdFx0eUF4aXM6IG1lcmdlKGhpZGRlbkF4aXMsIHsgcmV2ZXJzZWQ6IHRydWUgfSlcdFxuXHRcdH0sXG5cdFx0b3B0aW9ucywgLy8gdXNlcidzIG9wdGlvbnNcblx0XG5cdFx0eyAvLyBmb3JjZWQgb3B0aW9uc1xuXHRcdFx0Y2hhcnQ6IHtcblx0XHRcdFx0aW52ZXJ0ZWQ6IGZhbHNlXG5cdFx0XHR9XG5cdFx0fSk7XG5cdFxuXHRcdG9wdGlvbnMuc2VyaWVzID0gc2VyaWVzT3B0aW9ucztcblx0XG5cdFxuXHRcdHJldHVybiBuZXcgSGlnaGNoYXJ0cy5DaGFydChvcHRpb25zLCBjYWxsYmFjayk7XG5cdH07XG59KEhpZ2hjaGFydHMpKTtcbiJdLCJmaWxlIjoicGx1Z2lucy91ZWRpdG9yL3RoaXJkLXBhcnR5L2hpZ2hjaGFydHMvbW9kdWxlcy9tYXAuc3JjLmpzIn0=
