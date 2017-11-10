/**
 * Highcharts Drilldown plugin
 * 
 * Author: Torstein Honsi
 * Last revision: 2013-02-18
 * License: MIT License
 *
 * Demo: http://jsfiddle.net/highcharts/Vf3yT/
 */

/*global HighchartsAdapter*/
(function (H) {

	"use strict";

	var noop = function () {},
		defaultOptions = H.getOptions(),
		each = H.each,
		extend = H.extend,
		wrap = H.wrap,
		Chart = H.Chart,
		seriesTypes = H.seriesTypes,
		PieSeries = seriesTypes.pie,
		ColumnSeries = seriesTypes.column,
		fireEvent = HighchartsAdapter.fireEvent;

	// Utilities
	function tweenColors(startColor, endColor, pos) {
		var rgba = [
				Math.round(startColor[0] + (endColor[0] - startColor[0]) * pos),
				Math.round(startColor[1] + (endColor[1] - startColor[1]) * pos),
				Math.round(startColor[2] + (endColor[2] - startColor[2]) * pos),
				startColor[3] + (endColor[3] - startColor[3]) * pos
			];
		return 'rgba(' + rgba.join(',') + ')';
	}

	// Add language
	extend(defaultOptions.lang, {
		drillUpText: '◁ Back to {series.name}'
	});
	defaultOptions.drilldown = {
		activeAxisLabelStyle: {
			cursor: 'pointer',
			color: '#039',
			fontWeight: 'bold',
			textDecoration: 'underline'			
		},
		activeDataLabelStyle: {
			cursor: 'pointer',
			color: '#039',
			fontWeight: 'bold',
			textDecoration: 'underline'			
		},
		animation: {
			duration: 500
		},
		drillUpButton: {
			position: { 
				align: 'right',
				x: -10,
				y: 10
			}
			// relativeTo: 'plotBox'
			// theme
		}
	};	

	/**
	 * A general fadeIn method
	 */
	H.SVGRenderer.prototype.Element.prototype.fadeIn = function () {
		this
		.attr({
			opacity: 0.1,
			visibility: 'visible'
		})
		.animate({
			opacity: 1
		}, {
			duration: 250
		});
	};

	// Extend the Chart prototype
	Chart.prototype.drilldownLevels = [];

	Chart.prototype.addSeriesAsDrilldown = function (point, ddOptions) {
		var oldSeries = point.series,
			xAxis = oldSeries.xAxis,
			yAxis = oldSeries.yAxis,
			newSeries,
			color = point.color || oldSeries.color,
			pointIndex,
			level;
			
		ddOptions = extend({
			color: color
		}, ddOptions);
		pointIndex = HighchartsAdapter.inArray(this, oldSeries.points);
		level = {
			seriesOptions: oldSeries.userOptions,
			shapeArgs: point.shapeArgs,
			bBox: point.graphic.getBBox(),
			color: color,
			newSeries: ddOptions,
			pointOptions: oldSeries.options.data[pointIndex],
			pointIndex: pointIndex,
			oldExtremes: {
				xMin: xAxis && xAxis.userMin,
				xMax: xAxis && xAxis.userMax,
				yMin: yAxis && yAxis.userMin,
				yMax: yAxis && yAxis.userMax
			}
		};

		this.drilldownLevels.push(level);

		newSeries = this.addSeries(ddOptions, false);
		if (xAxis) {
			xAxis.oldPos = xAxis.pos;
			xAxis.userMin = xAxis.userMax = null;
			yAxis.userMin = yAxis.userMax = null;
		}

		// Run fancy cross-animation on supported and equal types
		if (oldSeries.type === newSeries.type) {
			newSeries.animate = newSeries.animateDrilldown || noop;
			newSeries.options.animation = true;
		}
		
		oldSeries.remove(false);
		
		this.redraw();
		this.showDrillUpButton();
	};

	Chart.prototype.getDrilldownBackText = function () {
		var lastLevel = this.drilldownLevels[this.drilldownLevels.length - 1];

		return this.options.lang.drillUpText.replace('{series.name}', lastLevel.seriesOptions.name);

	};

	Chart.prototype.showDrillUpButton = function () {
		var chart = this,
			backText = this.getDrilldownBackText(),
			buttonOptions = chart.options.drilldown.drillUpButton;
			

		if (!this.drillUpButton) {
			this.drillUpButton = this.renderer.button(
				backText,
				null,
				null,
				function () {
					chart.drillUp(); 
				}
			)
			.attr(extend({
				align: buttonOptions.position.align,
				zIndex: 9
			}, buttonOptions.theme))
			.add()
			.align(buttonOptions.position, false, buttonOptions.relativeTo || 'plotBox');
		} else {
			this.drillUpButton.attr({
				text: backText
			})
			.align();
		}
	};

	Chart.prototype.drillUp = function () {
		var chart = this,
			level = chart.drilldownLevels.pop(),
			oldSeries = chart.series[0],
			oldExtremes = level.oldExtremes,
			newSeries = chart.addSeries(level.seriesOptions, false);
		
		fireEvent(chart, 'drillup', { seriesOptions: level.seriesOptions });

		if (newSeries.type === oldSeries.type) {
			newSeries.drilldownLevel = level;
			newSeries.animate = newSeries.animateDrillupTo || noop;
			newSeries.options.animation = true;

			if (oldSeries.animateDrillupFrom) {
				oldSeries.animateDrillupFrom(level);
			}
		}

		oldSeries.remove(false);

		// Reset the zoom level of the upper series
		if (newSeries.xAxis) {
			newSeries.xAxis.setExtremes(oldExtremes.xMin, oldExtremes.xMax, false);
			newSeries.yAxis.setExtremes(oldExtremes.yMin, oldExtremes.yMax, false);
		}


		this.redraw();

		if (this.drilldownLevels.length === 0) {
			this.drillUpButton = this.drillUpButton.destroy();
		} else {
			this.drillUpButton.attr({
				text: this.getDrilldownBackText()
			})
			.align();
		}
	};

	PieSeries.prototype.animateDrilldown = function (init) {
		var level = this.chart.drilldownLevels[this.chart.drilldownLevels.length - 1],
			animationOptions = this.chart.options.drilldown.animation,
			animateFrom = level.shapeArgs,
			start = animateFrom.start,
			angle = animateFrom.end - start,
			startAngle = angle / this.points.length,
			startColor = H.Color(level.color).rgba;

		if (!init) {
			each(this.points, function (point, i) {
				var endColor = H.Color(point.color).rgba;

				/*jslint unparam: true*/
				point.graphic
					.attr(H.merge(animateFrom, {
						start: start + i * startAngle,
						end: start + (i + 1) * startAngle
					}))
					.animate(point.shapeArgs, H.merge(animationOptions, {
						step: function (val, fx) {
							if (fx.prop === 'start') {
								this.attr({
									fill: tweenColors(startColor, endColor, fx.pos)
								});
							}
						}
					}));
				/*jslint unparam: false*/
			});
		}
	};


	/**
	 * When drilling up, keep the upper series invisible until the lower series has
	 * moved into place
	 */
	PieSeries.prototype.animateDrillupTo = 
			ColumnSeries.prototype.animateDrillupTo = function (init) {
		if (!init) {
			var newSeries = this,
				level = newSeries.drilldownLevel;

			each(this.points, function (point) {
				point.graphic.hide();
				if (point.dataLabel) {
					point.dataLabel.hide();
				}
				if (point.connector) {
					point.connector.hide();
				}
			});


			// Do dummy animation on first point to get to complete
			setTimeout(function () {
				each(newSeries.points, function (point, i) {  
					// Fade in other points			  
					var verb = i === level.pointIndex ? 'show' : 'fadeIn';
					point.graphic[verb]();
					if (point.dataLabel) {
						point.dataLabel[verb]();
					}
					if (point.connector) {
						point.connector[verb]();
					}
				});
			}, Math.max(this.chart.options.drilldown.animation.duration - 50, 0));

			// Reset
			this.animate = noop;
		}

	};
	
	ColumnSeries.prototype.animateDrilldown = function (init) {
		var animateFrom = this.chart.drilldownLevels[this.chart.drilldownLevels.length - 1].shapeArgs,
			animationOptions = this.chart.options.drilldown.animation;
			
		if (!init) {

			animateFrom.x += (this.xAxis.oldPos - this.xAxis.pos);
	
			each(this.points, function (point) {
				point.graphic
					.attr(animateFrom)
					.animate(point.shapeArgs, animationOptions);
			});
		}
		
	};

	/**
	 * When drilling up, pull out the individual point graphics from the lower series
	 * and animate them into the origin point in the upper series.
	 */
	ColumnSeries.prototype.animateDrillupFrom = 
		PieSeries.prototype.animateDrillupFrom =
	function (level) {
		var animationOptions = this.chart.options.drilldown.animation,
			group = this.group;

		delete this.group;
		each(this.points, function (point) {
			var graphic = point.graphic,
				startColor = H.Color(point.color).rgba;

			delete point.graphic;

			/*jslint unparam: true*/
			graphic.animate(level.shapeArgs, H.merge(animationOptions, {

				step: function (val, fx) {
					if (fx.prop === 'start') {
						this.attr({
							fill: tweenColors(startColor, H.Color(level.color).rgba, fx.pos)
						});
					}
				},
				complete: function () {
					graphic.destroy();
					if (group) {
						group = group.destroy();
					}
				}
			}));
			/*jslint unparam: false*/
		});
	};
	
	H.Point.prototype.doDrilldown = function () {
		var series = this.series,
			chart = series.chart,
			drilldown = chart.options.drilldown,
			i = drilldown.series.length,
			seriesOptions;
		
		while (i-- && !seriesOptions) {
			if (drilldown.series[i].id === this.drilldown) {
				seriesOptions = drilldown.series[i];
			}
		}

		// Fire the event. If seriesOptions is undefined, the implementer can check for 
		// seriesOptions, and call addSeriesAsDrilldown async if necessary.
		fireEvent(chart, 'drilldown', { 
			point: this,
			seriesOptions: seriesOptions
		});
		
		if (seriesOptions) {
			chart.addSeriesAsDrilldown(this, seriesOptions);
		}

	};
	
	wrap(H.Point.prototype, 'init', function (proceed, series, options, x) {
		var point = proceed.call(this, series, options, x),
			chart = series.chart,
			tick = series.xAxis && series.xAxis.ticks[x],
			tickLabel = tick && tick.label;
		
		if (point.drilldown) {
			
			// Add the click event to the point label
			H.addEvent(point, 'click', function () {
				point.doDrilldown();
			});
			
			// Make axis labels clickable
			if (tickLabel) {
				if (!tickLabel._basicStyle) {
					tickLabel._basicStyle = tickLabel.element.getAttribute('style');
				}
				tickLabel
					.addClass('highcharts-drilldown-axis-label')
					.css(chart.options.drilldown.activeAxisLabelStyle)
					.on('click', function () {
						if (point.doDrilldown) {
							point.doDrilldown();
						}
					});
					
			}
		} else if (tickLabel && tickLabel._basicStyle) {
			tickLabel.element.setAttribute('style', tickLabel._basicStyle);
		}
		
		return point;
	});

	wrap(H.Series.prototype, 'drawDataLabels', function (proceed) {
		var css = this.chart.options.drilldown.activeDataLabelStyle;

		proceed.call(this);

		each(this.points, function (point) {
			if (point.drilldown && point.dataLabel) {
				point.dataLabel
					.attr({
						'class': 'highcharts-drilldown-data-label'
					})
					.css(css)
					.on('click', function () {
						point.doDrilldown();
					});
			}
		});
	});

	// Mark the trackers with a pointer 
	ColumnSeries.prototype.supportsDrilldown = true;
	PieSeries.prototype.supportsDrilldown = true;
	var type, 
		drawTrackerWrapper = function (proceed) {
			proceed.call(this);
			each(this.points, function (point) {
				if (point.drilldown && point.graphic) {
					point.graphic
						.attr({
							'class': 'highcharts-drilldown-point'
						})
						.css({ cursor: 'pointer' });
				}
			});
		};
	for (type in seriesTypes) {
		if (seriesTypes[type].prototype.supportsDrilldown) {
			wrap(seriesTypes[type].prototype, 'drawTracker', drawTrackerWrapper);
		}
	}
		
}(Highcharts));

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvdGhpcmQtcGFydHkvaGlnaGNoYXJ0cy9tb2R1bGVzL2RyaWxsZG93bi5zcmMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBIaWdoY2hhcnRzIERyaWxsZG93biBwbHVnaW5cbiAqIFxuICogQXV0aG9yOiBUb3JzdGVpbiBIb25zaVxuICogTGFzdCByZXZpc2lvbjogMjAxMy0wMi0xOFxuICogTGljZW5zZTogTUlUIExpY2Vuc2VcbiAqXG4gKiBEZW1vOiBodHRwOi8vanNmaWRkbGUubmV0L2hpZ2hjaGFydHMvVmYzeVQvXG4gKi9cblxuLypnbG9iYWwgSGlnaGNoYXJ0c0FkYXB0ZXIqL1xuKGZ1bmN0aW9uIChIKSB7XG5cblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0dmFyIG5vb3AgPSBmdW5jdGlvbiAoKSB7fSxcblx0XHRkZWZhdWx0T3B0aW9ucyA9IEguZ2V0T3B0aW9ucygpLFxuXHRcdGVhY2ggPSBILmVhY2gsXG5cdFx0ZXh0ZW5kID0gSC5leHRlbmQsXG5cdFx0d3JhcCA9IEgud3JhcCxcblx0XHRDaGFydCA9IEguQ2hhcnQsXG5cdFx0c2VyaWVzVHlwZXMgPSBILnNlcmllc1R5cGVzLFxuXHRcdFBpZVNlcmllcyA9IHNlcmllc1R5cGVzLnBpZSxcblx0XHRDb2x1bW5TZXJpZXMgPSBzZXJpZXNUeXBlcy5jb2x1bW4sXG5cdFx0ZmlyZUV2ZW50ID0gSGlnaGNoYXJ0c0FkYXB0ZXIuZmlyZUV2ZW50O1xuXG5cdC8vIFV0aWxpdGllc1xuXHRmdW5jdGlvbiB0d2VlbkNvbG9ycyhzdGFydENvbG9yLCBlbmRDb2xvciwgcG9zKSB7XG5cdFx0dmFyIHJnYmEgPSBbXG5cdFx0XHRcdE1hdGgucm91bmQoc3RhcnRDb2xvclswXSArIChlbmRDb2xvclswXSAtIHN0YXJ0Q29sb3JbMF0pICogcG9zKSxcblx0XHRcdFx0TWF0aC5yb3VuZChzdGFydENvbG9yWzFdICsgKGVuZENvbG9yWzFdIC0gc3RhcnRDb2xvclsxXSkgKiBwb3MpLFxuXHRcdFx0XHRNYXRoLnJvdW5kKHN0YXJ0Q29sb3JbMl0gKyAoZW5kQ29sb3JbMl0gLSBzdGFydENvbG9yWzJdKSAqIHBvcyksXG5cdFx0XHRcdHN0YXJ0Q29sb3JbM10gKyAoZW5kQ29sb3JbM10gLSBzdGFydENvbG9yWzNdKSAqIHBvc1xuXHRcdFx0XTtcblx0XHRyZXR1cm4gJ3JnYmEoJyArIHJnYmEuam9pbignLCcpICsgJyknO1xuXHR9XG5cblx0Ly8gQWRkIGxhbmd1YWdlXG5cdGV4dGVuZChkZWZhdWx0T3B0aW9ucy5sYW5nLCB7XG5cdFx0ZHJpbGxVcFRleHQ6ICfil4EgQmFjayB0byB7c2VyaWVzLm5hbWV9J1xuXHR9KTtcblx0ZGVmYXVsdE9wdGlvbnMuZHJpbGxkb3duID0ge1xuXHRcdGFjdGl2ZUF4aXNMYWJlbFN0eWxlOiB7XG5cdFx0XHRjdXJzb3I6ICdwb2ludGVyJyxcblx0XHRcdGNvbG9yOiAnIzAzOScsXG5cdFx0XHRmb250V2VpZ2h0OiAnYm9sZCcsXG5cdFx0XHR0ZXh0RGVjb3JhdGlvbjogJ3VuZGVybGluZSdcdFx0XHRcblx0XHR9LFxuXHRcdGFjdGl2ZURhdGFMYWJlbFN0eWxlOiB7XG5cdFx0XHRjdXJzb3I6ICdwb2ludGVyJyxcblx0XHRcdGNvbG9yOiAnIzAzOScsXG5cdFx0XHRmb250V2VpZ2h0OiAnYm9sZCcsXG5cdFx0XHR0ZXh0RGVjb3JhdGlvbjogJ3VuZGVybGluZSdcdFx0XHRcblx0XHR9LFxuXHRcdGFuaW1hdGlvbjoge1xuXHRcdFx0ZHVyYXRpb246IDUwMFxuXHRcdH0sXG5cdFx0ZHJpbGxVcEJ1dHRvbjoge1xuXHRcdFx0cG9zaXRpb246IHsgXG5cdFx0XHRcdGFsaWduOiAncmlnaHQnLFxuXHRcdFx0XHR4OiAtMTAsXG5cdFx0XHRcdHk6IDEwXG5cdFx0XHR9XG5cdFx0XHQvLyByZWxhdGl2ZVRvOiAncGxvdEJveCdcblx0XHRcdC8vIHRoZW1lXG5cdFx0fVxuXHR9O1x0XG5cblx0LyoqXG5cdCAqIEEgZ2VuZXJhbCBmYWRlSW4gbWV0aG9kXG5cdCAqL1xuXHRILlNWR1JlbmRlcmVyLnByb3RvdHlwZS5FbGVtZW50LnByb3RvdHlwZS5mYWRlSW4gPSBmdW5jdGlvbiAoKSB7XG5cdFx0dGhpc1xuXHRcdC5hdHRyKHtcblx0XHRcdG9wYWNpdHk6IDAuMSxcblx0XHRcdHZpc2liaWxpdHk6ICd2aXNpYmxlJ1xuXHRcdH0pXG5cdFx0LmFuaW1hdGUoe1xuXHRcdFx0b3BhY2l0eTogMVxuXHRcdH0sIHtcblx0XHRcdGR1cmF0aW9uOiAyNTBcblx0XHR9KTtcblx0fTtcblxuXHQvLyBFeHRlbmQgdGhlIENoYXJ0IHByb3RvdHlwZVxuXHRDaGFydC5wcm90b3R5cGUuZHJpbGxkb3duTGV2ZWxzID0gW107XG5cblx0Q2hhcnQucHJvdG90eXBlLmFkZFNlcmllc0FzRHJpbGxkb3duID0gZnVuY3Rpb24gKHBvaW50LCBkZE9wdGlvbnMpIHtcblx0XHR2YXIgb2xkU2VyaWVzID0gcG9pbnQuc2VyaWVzLFxuXHRcdFx0eEF4aXMgPSBvbGRTZXJpZXMueEF4aXMsXG5cdFx0XHR5QXhpcyA9IG9sZFNlcmllcy55QXhpcyxcblx0XHRcdG5ld1Nlcmllcyxcblx0XHRcdGNvbG9yID0gcG9pbnQuY29sb3IgfHwgb2xkU2VyaWVzLmNvbG9yLFxuXHRcdFx0cG9pbnRJbmRleCxcblx0XHRcdGxldmVsO1xuXHRcdFx0XG5cdFx0ZGRPcHRpb25zID0gZXh0ZW5kKHtcblx0XHRcdGNvbG9yOiBjb2xvclxuXHRcdH0sIGRkT3B0aW9ucyk7XG5cdFx0cG9pbnRJbmRleCA9IEhpZ2hjaGFydHNBZGFwdGVyLmluQXJyYXkodGhpcywgb2xkU2VyaWVzLnBvaW50cyk7XG5cdFx0bGV2ZWwgPSB7XG5cdFx0XHRzZXJpZXNPcHRpb25zOiBvbGRTZXJpZXMudXNlck9wdGlvbnMsXG5cdFx0XHRzaGFwZUFyZ3M6IHBvaW50LnNoYXBlQXJncyxcblx0XHRcdGJCb3g6IHBvaW50LmdyYXBoaWMuZ2V0QkJveCgpLFxuXHRcdFx0Y29sb3I6IGNvbG9yLFxuXHRcdFx0bmV3U2VyaWVzOiBkZE9wdGlvbnMsXG5cdFx0XHRwb2ludE9wdGlvbnM6IG9sZFNlcmllcy5vcHRpb25zLmRhdGFbcG9pbnRJbmRleF0sXG5cdFx0XHRwb2ludEluZGV4OiBwb2ludEluZGV4LFxuXHRcdFx0b2xkRXh0cmVtZXM6IHtcblx0XHRcdFx0eE1pbjogeEF4aXMgJiYgeEF4aXMudXNlck1pbixcblx0XHRcdFx0eE1heDogeEF4aXMgJiYgeEF4aXMudXNlck1heCxcblx0XHRcdFx0eU1pbjogeUF4aXMgJiYgeUF4aXMudXNlck1pbixcblx0XHRcdFx0eU1heDogeUF4aXMgJiYgeUF4aXMudXNlck1heFxuXHRcdFx0fVxuXHRcdH07XG5cblx0XHR0aGlzLmRyaWxsZG93bkxldmVscy5wdXNoKGxldmVsKTtcblxuXHRcdG5ld1NlcmllcyA9IHRoaXMuYWRkU2VyaWVzKGRkT3B0aW9ucywgZmFsc2UpO1xuXHRcdGlmICh4QXhpcykge1xuXHRcdFx0eEF4aXMub2xkUG9zID0geEF4aXMucG9zO1xuXHRcdFx0eEF4aXMudXNlck1pbiA9IHhBeGlzLnVzZXJNYXggPSBudWxsO1xuXHRcdFx0eUF4aXMudXNlck1pbiA9IHlBeGlzLnVzZXJNYXggPSBudWxsO1xuXHRcdH1cblxuXHRcdC8vIFJ1biBmYW5jeSBjcm9zcy1hbmltYXRpb24gb24gc3VwcG9ydGVkIGFuZCBlcXVhbCB0eXBlc1xuXHRcdGlmIChvbGRTZXJpZXMudHlwZSA9PT0gbmV3U2VyaWVzLnR5cGUpIHtcblx0XHRcdG5ld1Nlcmllcy5hbmltYXRlID0gbmV3U2VyaWVzLmFuaW1hdGVEcmlsbGRvd24gfHwgbm9vcDtcblx0XHRcdG5ld1Nlcmllcy5vcHRpb25zLmFuaW1hdGlvbiA9IHRydWU7XG5cdFx0fVxuXHRcdFxuXHRcdG9sZFNlcmllcy5yZW1vdmUoZmFsc2UpO1xuXHRcdFxuXHRcdHRoaXMucmVkcmF3KCk7XG5cdFx0dGhpcy5zaG93RHJpbGxVcEJ1dHRvbigpO1xuXHR9O1xuXG5cdENoYXJ0LnByb3RvdHlwZS5nZXREcmlsbGRvd25CYWNrVGV4dCA9IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgbGFzdExldmVsID0gdGhpcy5kcmlsbGRvd25MZXZlbHNbdGhpcy5kcmlsbGRvd25MZXZlbHMubGVuZ3RoIC0gMV07XG5cblx0XHRyZXR1cm4gdGhpcy5vcHRpb25zLmxhbmcuZHJpbGxVcFRleHQucmVwbGFjZSgne3Nlcmllcy5uYW1lfScsIGxhc3RMZXZlbC5zZXJpZXNPcHRpb25zLm5hbWUpO1xuXG5cdH07XG5cblx0Q2hhcnQucHJvdG90eXBlLnNob3dEcmlsbFVwQnV0dG9uID0gZnVuY3Rpb24gKCkge1xuXHRcdHZhciBjaGFydCA9IHRoaXMsXG5cdFx0XHRiYWNrVGV4dCA9IHRoaXMuZ2V0RHJpbGxkb3duQmFja1RleHQoKSxcblx0XHRcdGJ1dHRvbk9wdGlvbnMgPSBjaGFydC5vcHRpb25zLmRyaWxsZG93bi5kcmlsbFVwQnV0dG9uO1xuXHRcdFx0XG5cblx0XHRpZiAoIXRoaXMuZHJpbGxVcEJ1dHRvbikge1xuXHRcdFx0dGhpcy5kcmlsbFVwQnV0dG9uID0gdGhpcy5yZW5kZXJlci5idXR0b24oXG5cdFx0XHRcdGJhY2tUZXh0LFxuXHRcdFx0XHRudWxsLFxuXHRcdFx0XHRudWxsLFxuXHRcdFx0XHRmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0Y2hhcnQuZHJpbGxVcCgpOyBcblx0XHRcdFx0fVxuXHRcdFx0KVxuXHRcdFx0LmF0dHIoZXh0ZW5kKHtcblx0XHRcdFx0YWxpZ246IGJ1dHRvbk9wdGlvbnMucG9zaXRpb24uYWxpZ24sXG5cdFx0XHRcdHpJbmRleDogOVxuXHRcdFx0fSwgYnV0dG9uT3B0aW9ucy50aGVtZSkpXG5cdFx0XHQuYWRkKClcblx0XHRcdC5hbGlnbihidXR0b25PcHRpb25zLnBvc2l0aW9uLCBmYWxzZSwgYnV0dG9uT3B0aW9ucy5yZWxhdGl2ZVRvIHx8ICdwbG90Qm94Jyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuZHJpbGxVcEJ1dHRvbi5hdHRyKHtcblx0XHRcdFx0dGV4dDogYmFja1RleHRcblx0XHRcdH0pXG5cdFx0XHQuYWxpZ24oKTtcblx0XHR9XG5cdH07XG5cblx0Q2hhcnQucHJvdG90eXBlLmRyaWxsVXAgPSBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGNoYXJ0ID0gdGhpcyxcblx0XHRcdGxldmVsID0gY2hhcnQuZHJpbGxkb3duTGV2ZWxzLnBvcCgpLFxuXHRcdFx0b2xkU2VyaWVzID0gY2hhcnQuc2VyaWVzWzBdLFxuXHRcdFx0b2xkRXh0cmVtZXMgPSBsZXZlbC5vbGRFeHRyZW1lcyxcblx0XHRcdG5ld1NlcmllcyA9IGNoYXJ0LmFkZFNlcmllcyhsZXZlbC5zZXJpZXNPcHRpb25zLCBmYWxzZSk7XG5cdFx0XG5cdFx0ZmlyZUV2ZW50KGNoYXJ0LCAnZHJpbGx1cCcsIHsgc2VyaWVzT3B0aW9uczogbGV2ZWwuc2VyaWVzT3B0aW9ucyB9KTtcblxuXHRcdGlmIChuZXdTZXJpZXMudHlwZSA9PT0gb2xkU2VyaWVzLnR5cGUpIHtcblx0XHRcdG5ld1Nlcmllcy5kcmlsbGRvd25MZXZlbCA9IGxldmVsO1xuXHRcdFx0bmV3U2VyaWVzLmFuaW1hdGUgPSBuZXdTZXJpZXMuYW5pbWF0ZURyaWxsdXBUbyB8fCBub29wO1xuXHRcdFx0bmV3U2VyaWVzLm9wdGlvbnMuYW5pbWF0aW9uID0gdHJ1ZTtcblxuXHRcdFx0aWYgKG9sZFNlcmllcy5hbmltYXRlRHJpbGx1cEZyb20pIHtcblx0XHRcdFx0b2xkU2VyaWVzLmFuaW1hdGVEcmlsbHVwRnJvbShsZXZlbCk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0b2xkU2VyaWVzLnJlbW92ZShmYWxzZSk7XG5cblx0XHQvLyBSZXNldCB0aGUgem9vbSBsZXZlbCBvZiB0aGUgdXBwZXIgc2VyaWVzXG5cdFx0aWYgKG5ld1Nlcmllcy54QXhpcykge1xuXHRcdFx0bmV3U2VyaWVzLnhBeGlzLnNldEV4dHJlbWVzKG9sZEV4dHJlbWVzLnhNaW4sIG9sZEV4dHJlbWVzLnhNYXgsIGZhbHNlKTtcblx0XHRcdG5ld1Nlcmllcy55QXhpcy5zZXRFeHRyZW1lcyhvbGRFeHRyZW1lcy55TWluLCBvbGRFeHRyZW1lcy55TWF4LCBmYWxzZSk7XG5cdFx0fVxuXG5cblx0XHR0aGlzLnJlZHJhdygpO1xuXG5cdFx0aWYgKHRoaXMuZHJpbGxkb3duTGV2ZWxzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0dGhpcy5kcmlsbFVwQnV0dG9uID0gdGhpcy5kcmlsbFVwQnV0dG9uLmRlc3Ryb3koKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5kcmlsbFVwQnV0dG9uLmF0dHIoe1xuXHRcdFx0XHR0ZXh0OiB0aGlzLmdldERyaWxsZG93bkJhY2tUZXh0KClcblx0XHRcdH0pXG5cdFx0XHQuYWxpZ24oKTtcblx0XHR9XG5cdH07XG5cblx0UGllU2VyaWVzLnByb3RvdHlwZS5hbmltYXRlRHJpbGxkb3duID0gZnVuY3Rpb24gKGluaXQpIHtcblx0XHR2YXIgbGV2ZWwgPSB0aGlzLmNoYXJ0LmRyaWxsZG93bkxldmVsc1t0aGlzLmNoYXJ0LmRyaWxsZG93bkxldmVscy5sZW5ndGggLSAxXSxcblx0XHRcdGFuaW1hdGlvbk9wdGlvbnMgPSB0aGlzLmNoYXJ0Lm9wdGlvbnMuZHJpbGxkb3duLmFuaW1hdGlvbixcblx0XHRcdGFuaW1hdGVGcm9tID0gbGV2ZWwuc2hhcGVBcmdzLFxuXHRcdFx0c3RhcnQgPSBhbmltYXRlRnJvbS5zdGFydCxcblx0XHRcdGFuZ2xlID0gYW5pbWF0ZUZyb20uZW5kIC0gc3RhcnQsXG5cdFx0XHRzdGFydEFuZ2xlID0gYW5nbGUgLyB0aGlzLnBvaW50cy5sZW5ndGgsXG5cdFx0XHRzdGFydENvbG9yID0gSC5Db2xvcihsZXZlbC5jb2xvcikucmdiYTtcblxuXHRcdGlmICghaW5pdCkge1xuXHRcdFx0ZWFjaCh0aGlzLnBvaW50cywgZnVuY3Rpb24gKHBvaW50LCBpKSB7XG5cdFx0XHRcdHZhciBlbmRDb2xvciA9IEguQ29sb3IocG9pbnQuY29sb3IpLnJnYmE7XG5cblx0XHRcdFx0Lypqc2xpbnQgdW5wYXJhbTogdHJ1ZSovXG5cdFx0XHRcdHBvaW50LmdyYXBoaWNcblx0XHRcdFx0XHQuYXR0cihILm1lcmdlKGFuaW1hdGVGcm9tLCB7XG5cdFx0XHRcdFx0XHRzdGFydDogc3RhcnQgKyBpICogc3RhcnRBbmdsZSxcblx0XHRcdFx0XHRcdGVuZDogc3RhcnQgKyAoaSArIDEpICogc3RhcnRBbmdsZVxuXHRcdFx0XHRcdH0pKVxuXHRcdFx0XHRcdC5hbmltYXRlKHBvaW50LnNoYXBlQXJncywgSC5tZXJnZShhbmltYXRpb25PcHRpb25zLCB7XG5cdFx0XHRcdFx0XHRzdGVwOiBmdW5jdGlvbiAodmFsLCBmeCkge1xuXHRcdFx0XHRcdFx0XHRpZiAoZngucHJvcCA9PT0gJ3N0YXJ0Jykge1xuXHRcdFx0XHRcdFx0XHRcdHRoaXMuYXR0cih7XG5cdFx0XHRcdFx0XHRcdFx0XHRmaWxsOiB0d2VlbkNvbG9ycyhzdGFydENvbG9yLCBlbmRDb2xvciwgZngucG9zKVxuXHRcdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSkpO1xuXHRcdFx0XHQvKmpzbGludCB1bnBhcmFtOiBmYWxzZSovXG5cdFx0XHR9KTtcblx0XHR9XG5cdH07XG5cblxuXHQvKipcblx0ICogV2hlbiBkcmlsbGluZyB1cCwga2VlcCB0aGUgdXBwZXIgc2VyaWVzIGludmlzaWJsZSB1bnRpbCB0aGUgbG93ZXIgc2VyaWVzIGhhc1xuXHQgKiBtb3ZlZCBpbnRvIHBsYWNlXG5cdCAqL1xuXHRQaWVTZXJpZXMucHJvdG90eXBlLmFuaW1hdGVEcmlsbHVwVG8gPSBcblx0XHRcdENvbHVtblNlcmllcy5wcm90b3R5cGUuYW5pbWF0ZURyaWxsdXBUbyA9IGZ1bmN0aW9uIChpbml0KSB7XG5cdFx0aWYgKCFpbml0KSB7XG5cdFx0XHR2YXIgbmV3U2VyaWVzID0gdGhpcyxcblx0XHRcdFx0bGV2ZWwgPSBuZXdTZXJpZXMuZHJpbGxkb3duTGV2ZWw7XG5cblx0XHRcdGVhY2godGhpcy5wb2ludHMsIGZ1bmN0aW9uIChwb2ludCkge1xuXHRcdFx0XHRwb2ludC5ncmFwaGljLmhpZGUoKTtcblx0XHRcdFx0aWYgKHBvaW50LmRhdGFMYWJlbCkge1xuXHRcdFx0XHRcdHBvaW50LmRhdGFMYWJlbC5oaWRlKCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKHBvaW50LmNvbm5lY3Rvcikge1xuXHRcdFx0XHRcdHBvaW50LmNvbm5lY3Rvci5oaWRlKCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cblx0XHRcdC8vIERvIGR1bW15IGFuaW1hdGlvbiBvbiBmaXJzdCBwb2ludCB0byBnZXQgdG8gY29tcGxldGVcblx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRlYWNoKG5ld1Nlcmllcy5wb2ludHMsIGZ1bmN0aW9uIChwb2ludCwgaSkgeyAgXG5cdFx0XHRcdFx0Ly8gRmFkZSBpbiBvdGhlciBwb2ludHNcdFx0XHQgIFxuXHRcdFx0XHRcdHZhciB2ZXJiID0gaSA9PT0gbGV2ZWwucG9pbnRJbmRleCA/ICdzaG93JyA6ICdmYWRlSW4nO1xuXHRcdFx0XHRcdHBvaW50LmdyYXBoaWNbdmVyYl0oKTtcblx0XHRcdFx0XHRpZiAocG9pbnQuZGF0YUxhYmVsKSB7XG5cdFx0XHRcdFx0XHRwb2ludC5kYXRhTGFiZWxbdmVyYl0oKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYgKHBvaW50LmNvbm5lY3Rvcikge1xuXHRcdFx0XHRcdFx0cG9pbnQuY29ubmVjdG9yW3ZlcmJdKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH0sIE1hdGgubWF4KHRoaXMuY2hhcnQub3B0aW9ucy5kcmlsbGRvd24uYW5pbWF0aW9uLmR1cmF0aW9uIC0gNTAsIDApKTtcblxuXHRcdFx0Ly8gUmVzZXRcblx0XHRcdHRoaXMuYW5pbWF0ZSA9IG5vb3A7XG5cdFx0fVxuXG5cdH07XG5cdFxuXHRDb2x1bW5TZXJpZXMucHJvdG90eXBlLmFuaW1hdGVEcmlsbGRvd24gPSBmdW5jdGlvbiAoaW5pdCkge1xuXHRcdHZhciBhbmltYXRlRnJvbSA9IHRoaXMuY2hhcnQuZHJpbGxkb3duTGV2ZWxzW3RoaXMuY2hhcnQuZHJpbGxkb3duTGV2ZWxzLmxlbmd0aCAtIDFdLnNoYXBlQXJncyxcblx0XHRcdGFuaW1hdGlvbk9wdGlvbnMgPSB0aGlzLmNoYXJ0Lm9wdGlvbnMuZHJpbGxkb3duLmFuaW1hdGlvbjtcblx0XHRcdFxuXHRcdGlmICghaW5pdCkge1xuXG5cdFx0XHRhbmltYXRlRnJvbS54ICs9ICh0aGlzLnhBeGlzLm9sZFBvcyAtIHRoaXMueEF4aXMucG9zKTtcblx0XG5cdFx0XHRlYWNoKHRoaXMucG9pbnRzLCBmdW5jdGlvbiAocG9pbnQpIHtcblx0XHRcdFx0cG9pbnQuZ3JhcGhpY1xuXHRcdFx0XHRcdC5hdHRyKGFuaW1hdGVGcm9tKVxuXHRcdFx0XHRcdC5hbmltYXRlKHBvaW50LnNoYXBlQXJncywgYW5pbWF0aW9uT3B0aW9ucyk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0XG5cdH07XG5cblx0LyoqXG5cdCAqIFdoZW4gZHJpbGxpbmcgdXAsIHB1bGwgb3V0IHRoZSBpbmRpdmlkdWFsIHBvaW50IGdyYXBoaWNzIGZyb20gdGhlIGxvd2VyIHNlcmllc1xuXHQgKiBhbmQgYW5pbWF0ZSB0aGVtIGludG8gdGhlIG9yaWdpbiBwb2ludCBpbiB0aGUgdXBwZXIgc2VyaWVzLlxuXHQgKi9cblx0Q29sdW1uU2VyaWVzLnByb3RvdHlwZS5hbmltYXRlRHJpbGx1cEZyb20gPSBcblx0XHRQaWVTZXJpZXMucHJvdG90eXBlLmFuaW1hdGVEcmlsbHVwRnJvbSA9XG5cdGZ1bmN0aW9uIChsZXZlbCkge1xuXHRcdHZhciBhbmltYXRpb25PcHRpb25zID0gdGhpcy5jaGFydC5vcHRpb25zLmRyaWxsZG93bi5hbmltYXRpb24sXG5cdFx0XHRncm91cCA9IHRoaXMuZ3JvdXA7XG5cblx0XHRkZWxldGUgdGhpcy5ncm91cDtcblx0XHRlYWNoKHRoaXMucG9pbnRzLCBmdW5jdGlvbiAocG9pbnQpIHtcblx0XHRcdHZhciBncmFwaGljID0gcG9pbnQuZ3JhcGhpYyxcblx0XHRcdFx0c3RhcnRDb2xvciA9IEguQ29sb3IocG9pbnQuY29sb3IpLnJnYmE7XG5cblx0XHRcdGRlbGV0ZSBwb2ludC5ncmFwaGljO1xuXG5cdFx0XHQvKmpzbGludCB1bnBhcmFtOiB0cnVlKi9cblx0XHRcdGdyYXBoaWMuYW5pbWF0ZShsZXZlbC5zaGFwZUFyZ3MsIEgubWVyZ2UoYW5pbWF0aW9uT3B0aW9ucywge1xuXG5cdFx0XHRcdHN0ZXA6IGZ1bmN0aW9uICh2YWwsIGZ4KSB7XG5cdFx0XHRcdFx0aWYgKGZ4LnByb3AgPT09ICdzdGFydCcpIHtcblx0XHRcdFx0XHRcdHRoaXMuYXR0cih7XG5cdFx0XHRcdFx0XHRcdGZpbGw6IHR3ZWVuQ29sb3JzKHN0YXJ0Q29sb3IsIEguQ29sb3IobGV2ZWwuY29sb3IpLnJnYmEsIGZ4LnBvcylcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSxcblx0XHRcdFx0Y29tcGxldGU6IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRncmFwaGljLmRlc3Ryb3koKTtcblx0XHRcdFx0XHRpZiAoZ3JvdXApIHtcblx0XHRcdFx0XHRcdGdyb3VwID0gZ3JvdXAuZGVzdHJveSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSkpO1xuXHRcdFx0Lypqc2xpbnQgdW5wYXJhbTogZmFsc2UqL1xuXHRcdH0pO1xuXHR9O1xuXHRcblx0SC5Qb2ludC5wcm90b3R5cGUuZG9EcmlsbGRvd24gPSBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIHNlcmllcyA9IHRoaXMuc2VyaWVzLFxuXHRcdFx0Y2hhcnQgPSBzZXJpZXMuY2hhcnQsXG5cdFx0XHRkcmlsbGRvd24gPSBjaGFydC5vcHRpb25zLmRyaWxsZG93bixcblx0XHRcdGkgPSBkcmlsbGRvd24uc2VyaWVzLmxlbmd0aCxcblx0XHRcdHNlcmllc09wdGlvbnM7XG5cdFx0XG5cdFx0d2hpbGUgKGktLSAmJiAhc2VyaWVzT3B0aW9ucykge1xuXHRcdFx0aWYgKGRyaWxsZG93bi5zZXJpZXNbaV0uaWQgPT09IHRoaXMuZHJpbGxkb3duKSB7XG5cdFx0XHRcdHNlcmllc09wdGlvbnMgPSBkcmlsbGRvd24uc2VyaWVzW2ldO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIEZpcmUgdGhlIGV2ZW50LiBJZiBzZXJpZXNPcHRpb25zIGlzIHVuZGVmaW5lZCwgdGhlIGltcGxlbWVudGVyIGNhbiBjaGVjayBmb3IgXG5cdFx0Ly8gc2VyaWVzT3B0aW9ucywgYW5kIGNhbGwgYWRkU2VyaWVzQXNEcmlsbGRvd24gYXN5bmMgaWYgbmVjZXNzYXJ5LlxuXHRcdGZpcmVFdmVudChjaGFydCwgJ2RyaWxsZG93bicsIHsgXG5cdFx0XHRwb2ludDogdGhpcyxcblx0XHRcdHNlcmllc09wdGlvbnM6IHNlcmllc09wdGlvbnNcblx0XHR9KTtcblx0XHRcblx0XHRpZiAoc2VyaWVzT3B0aW9ucykge1xuXHRcdFx0Y2hhcnQuYWRkU2VyaWVzQXNEcmlsbGRvd24odGhpcywgc2VyaWVzT3B0aW9ucyk7XG5cdFx0fVxuXG5cdH07XG5cdFxuXHR3cmFwKEguUG9pbnQucHJvdG90eXBlLCAnaW5pdCcsIGZ1bmN0aW9uIChwcm9jZWVkLCBzZXJpZXMsIG9wdGlvbnMsIHgpIHtcblx0XHR2YXIgcG9pbnQgPSBwcm9jZWVkLmNhbGwodGhpcywgc2VyaWVzLCBvcHRpb25zLCB4KSxcblx0XHRcdGNoYXJ0ID0gc2VyaWVzLmNoYXJ0LFxuXHRcdFx0dGljayA9IHNlcmllcy54QXhpcyAmJiBzZXJpZXMueEF4aXMudGlja3NbeF0sXG5cdFx0XHR0aWNrTGFiZWwgPSB0aWNrICYmIHRpY2subGFiZWw7XG5cdFx0XG5cdFx0aWYgKHBvaW50LmRyaWxsZG93bikge1xuXHRcdFx0XG5cdFx0XHQvLyBBZGQgdGhlIGNsaWNrIGV2ZW50IHRvIHRoZSBwb2ludCBsYWJlbFxuXHRcdFx0SC5hZGRFdmVudChwb2ludCwgJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRwb2ludC5kb0RyaWxsZG93bigpO1xuXHRcdFx0fSk7XG5cdFx0XHRcblx0XHRcdC8vIE1ha2UgYXhpcyBsYWJlbHMgY2xpY2thYmxlXG5cdFx0XHRpZiAodGlja0xhYmVsKSB7XG5cdFx0XHRcdGlmICghdGlja0xhYmVsLl9iYXNpY1N0eWxlKSB7XG5cdFx0XHRcdFx0dGlja0xhYmVsLl9iYXNpY1N0eWxlID0gdGlja0xhYmVsLmVsZW1lbnQuZ2V0QXR0cmlidXRlKCdzdHlsZScpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHRpY2tMYWJlbFxuXHRcdFx0XHRcdC5hZGRDbGFzcygnaGlnaGNoYXJ0cy1kcmlsbGRvd24tYXhpcy1sYWJlbCcpXG5cdFx0XHRcdFx0LmNzcyhjaGFydC5vcHRpb25zLmRyaWxsZG93bi5hY3RpdmVBeGlzTGFiZWxTdHlsZSlcblx0XHRcdFx0XHQub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdFx0aWYgKHBvaW50LmRvRHJpbGxkb3duKSB7XG5cdFx0XHRcdFx0XHRcdHBvaW50LmRvRHJpbGxkb3duKCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmICh0aWNrTGFiZWwgJiYgdGlja0xhYmVsLl9iYXNpY1N0eWxlKSB7XG5cdFx0XHR0aWNrTGFiZWwuZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgdGlja0xhYmVsLl9iYXNpY1N0eWxlKTtcblx0XHR9XG5cdFx0XG5cdFx0cmV0dXJuIHBvaW50O1xuXHR9KTtcblxuXHR3cmFwKEguU2VyaWVzLnByb3RvdHlwZSwgJ2RyYXdEYXRhTGFiZWxzJywgZnVuY3Rpb24gKHByb2NlZWQpIHtcblx0XHR2YXIgY3NzID0gdGhpcy5jaGFydC5vcHRpb25zLmRyaWxsZG93bi5hY3RpdmVEYXRhTGFiZWxTdHlsZTtcblxuXHRcdHByb2NlZWQuY2FsbCh0aGlzKTtcblxuXHRcdGVhY2godGhpcy5wb2ludHMsIGZ1bmN0aW9uIChwb2ludCkge1xuXHRcdFx0aWYgKHBvaW50LmRyaWxsZG93biAmJiBwb2ludC5kYXRhTGFiZWwpIHtcblx0XHRcdFx0cG9pbnQuZGF0YUxhYmVsXG5cdFx0XHRcdFx0LmF0dHIoe1xuXHRcdFx0XHRcdFx0J2NsYXNzJzogJ2hpZ2hjaGFydHMtZHJpbGxkb3duLWRhdGEtbGFiZWwnXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQuY3NzKGNzcylcblx0XHRcdFx0XHQub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdFx0cG9pbnQuZG9EcmlsbGRvd24oKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9KTtcblx0fSk7XG5cblx0Ly8gTWFyayB0aGUgdHJhY2tlcnMgd2l0aCBhIHBvaW50ZXIgXG5cdENvbHVtblNlcmllcy5wcm90b3R5cGUuc3VwcG9ydHNEcmlsbGRvd24gPSB0cnVlO1xuXHRQaWVTZXJpZXMucHJvdG90eXBlLnN1cHBvcnRzRHJpbGxkb3duID0gdHJ1ZTtcblx0dmFyIHR5cGUsIFxuXHRcdGRyYXdUcmFja2VyV3JhcHBlciA9IGZ1bmN0aW9uIChwcm9jZWVkKSB7XG5cdFx0XHRwcm9jZWVkLmNhbGwodGhpcyk7XG5cdFx0XHRlYWNoKHRoaXMucG9pbnRzLCBmdW5jdGlvbiAocG9pbnQpIHtcblx0XHRcdFx0aWYgKHBvaW50LmRyaWxsZG93biAmJiBwb2ludC5ncmFwaGljKSB7XG5cdFx0XHRcdFx0cG9pbnQuZ3JhcGhpY1xuXHRcdFx0XHRcdFx0LmF0dHIoe1xuXHRcdFx0XHRcdFx0XHQnY2xhc3MnOiAnaGlnaGNoYXJ0cy1kcmlsbGRvd24tcG9pbnQnXG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0LmNzcyh7IGN1cnNvcjogJ3BvaW50ZXInIH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9O1xuXHRmb3IgKHR5cGUgaW4gc2VyaWVzVHlwZXMpIHtcblx0XHRpZiAoc2VyaWVzVHlwZXNbdHlwZV0ucHJvdG90eXBlLnN1cHBvcnRzRHJpbGxkb3duKSB7XG5cdFx0XHR3cmFwKHNlcmllc1R5cGVzW3R5cGVdLnByb3RvdHlwZSwgJ2RyYXdUcmFja2VyJywgZHJhd1RyYWNrZXJXcmFwcGVyKTtcblx0XHR9XG5cdH1cblx0XHRcbn0oSGlnaGNoYXJ0cykpO1xuIl0sImZpbGUiOiJwbHVnaW5zL3VlZGl0b3IvdGhpcmQtcGFydHkvaGlnaGNoYXJ0cy9tb2R1bGVzL2RyaWxsZG93bi5zcmMuanMifQ==
