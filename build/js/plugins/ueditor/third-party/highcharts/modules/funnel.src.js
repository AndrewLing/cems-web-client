/**
 * @license 
 * Highcharts funnel module, Beta
 *
 * (c) 2010-2012 Torstein Hønsi
 *
 * License: www.highcharts.com/license
 */

/*global Highcharts */
(function (Highcharts) {
	
'use strict';

// create shortcuts
var defaultOptions = Highcharts.getOptions(),
	defaultPlotOptions = defaultOptions.plotOptions,
	seriesTypes = Highcharts.seriesTypes,
	merge = Highcharts.merge,
	noop = function () {},
	each = Highcharts.each;

// set default options
defaultPlotOptions.funnel = merge(defaultPlotOptions.pie, {
	center: ['50%', '50%'],
	width: '90%',
	neckWidth: '30%',
	height: '100%',
	neckHeight: '25%',

	dataLabels: {
		//position: 'right',
		connectorWidth: 1,
		connectorColor: '#606060'
	},
	size: true, // to avoid adapting to data label size in Pie.drawDataLabels
	states: {
		select: {
			color: '#C0C0C0',
			borderColor: '#000000',
			shadow: false
		}
	}	
});


seriesTypes.funnel = Highcharts.extendClass(seriesTypes.pie, {
	
	type: 'funnel',
	animate: noop,

	/**
	 * Overrides the pie translate method
	 */
	translate: function () {
		
		var 
			// Get positions - either an integer or a percentage string must be given
			getLength = function (length, relativeTo) {
				return (/%$/).test(length) ?
					relativeTo * parseInt(length, 10) / 100 :
					parseInt(length, 10);
			},
			
			sum = 0,
			series = this,
			chart = series.chart,
			plotWidth = chart.plotWidth,
			plotHeight = chart.plotHeight,
			cumulative = 0, // start at top
			options = series.options,
			center = options.center,
			centerX = getLength(center[0], plotWidth),
			centerY = getLength(center[0], plotHeight),
			width = getLength(options.width, plotWidth),
			tempWidth,
			getWidthAt,
			height = getLength(options.height, plotHeight),
			neckWidth = getLength(options.neckWidth, plotWidth),
			neckHeight = getLength(options.neckHeight, plotHeight),
			neckY = height - neckHeight,
			data = series.data,
			path,
			fraction,
			half = options.dataLabels.position === 'left' ? 1 : 0,

			x1, 
			y1, 
			x2, 
			x3, 
			y3, 
			x4, 
			y5;

		// Return the width at a specific y coordinate
		series.getWidthAt = getWidthAt = function (y) {
			return y > height - neckHeight || height === neckHeight ?
				neckWidth :
				neckWidth + (width - neckWidth) * ((height - neckHeight - y) / (height - neckHeight));
		};
		series.getX = function (y, half) {
			return centerX + (half ? -1 : 1) * ((getWidthAt(y) / 2) + options.dataLabels.distance);
		};

		// Expose
		series.center = [centerX, centerY, height];
		series.centerX = centerX;

		/*
		 * Individual point coordinate naming:
		 *
		 * x1,y1 _________________ x2,y1
		 *  \                         /
		 *   \                       /
		 *    \                     /
		 *     \                   /
		 *      \                 /
		 *     x3,y3 _________ x4,y3
		 *
		 * Additional for the base of the neck:
		 *
		 *       |               |
		 *       |               |
		 *       |               |
		 *     x3,y5 _________ x4,y5
		 */




		// get the total sum
		each(data, function (point) {
			sum += point.y;
		});

		each(data, function (point) {
			// set start and end positions
			y5 = null;
			fraction = sum ? point.y / sum : 0;
			y1 = centerY - height / 2 + cumulative * height;
			y3 = y1 + fraction * height;
			//tempWidth = neckWidth + (width - neckWidth) * ((height - neckHeight - y1) / (height - neckHeight));
			tempWidth = getWidthAt(y1);
			x1 = centerX - tempWidth / 2;
			x2 = x1 + tempWidth;
			tempWidth = getWidthAt(y3);
			x3 = centerX - tempWidth / 2;
			x4 = x3 + tempWidth;

			// the entire point is within the neck
			if (y1 > neckY) {
				x1 = x3 = centerX - neckWidth / 2;
				x2 = x4 = centerX + neckWidth / 2;
			
			// the base of the neck
			} else if (y3 > neckY) {
				y5 = y3;

				tempWidth = getWidthAt(neckY);
				x3 = centerX - tempWidth / 2;
				x4 = x3 + tempWidth;

				y3 = neckY;
			}

			// save the path
			path = [
				'M',
				x1, y1,
				'L',
				x2, y1,
				x4, y3
			];
			if (y5) {
				path.push(x4, y5, x3, y5);
			}
			path.push(x3, y3, 'Z');

			// prepare for using shared dr
			point.shapeType = 'path';
			point.shapeArgs = { d: path };


			// for tooltips and data labels
			point.percentage = fraction * 100;
			point.plotX = centerX;
			point.plotY = (y1 + (y5 || y3)) / 2;

			// Placement of tooltips and data labels
			point.tooltipPos = [
				centerX,
				point.plotY
			];

			// Slice is a noop on funnel points
			point.slice = noop;
			
			// Mimicking pie data label placement logic
			point.half = half;

			cumulative += fraction;
		});


		series.setTooltipPoints();
	},
	/**
	 * Draw a single point (wedge)
	 * @param {Object} point The point object
	 * @param {Object} color The color of the point
	 * @param {Number} brightness The brightness relative to the color
	 */
	drawPoints: function () {
		var series = this,
			options = series.options,
			chart = series.chart,
			renderer = chart.renderer;

		each(series.data, function (point) {
			
			var graphic = point.graphic,
				shapeArgs = point.shapeArgs;

			if (!graphic) { // Create the shapes
				point.graphic = renderer.path(shapeArgs).
					attr({
						fill: point.color,
						stroke: options.borderColor,
						'stroke-width': options.borderWidth
					}).
					add(series.group);
					
			} else { // Update the shapes
				graphic.animate(shapeArgs);
			}
		});
	},

	/**
	 * Funnel items don't have angles (#2289)
	 */
	sortByAngle: noop,
	
	/**
	 * Extend the pie data label method
	 */
	drawDataLabels: function () {
		var data = this.data,
			labelDistance = this.options.dataLabels.distance,
			leftSide,
			sign,
			point,
			i = data.length,
			x,
			y;
		
		// In the original pie label anticollision logic, the slots are distributed
		// from one labelDistance above to one labelDistance below the pie. In funnels
		// we don't want this.
		this.center[2] -= 2 * labelDistance;
		
		// Set the label position array for each point.
		while (i--) {
			point = data[i];
			leftSide = point.half;
			sign = leftSide ? 1 : -1;
			y = point.plotY;
			x = this.getX(y, leftSide);
				
			// set the anchor point for data labels
			point.labelPos = [
				0, // first break of connector
				y, // a/a
				x + (labelDistance - 5) * sign, // second break, right outside point shape
				y, // a/a
				x + labelDistance * sign, // landing point for connector
				y, // a/a
				leftSide ? 'right' : 'left', // alignment
				0 // center angle
			];
		}
		
		seriesTypes.pie.prototype.drawDataLabels.call(this);
	}

});


}(Highcharts));

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvdGhpcmQtcGFydHkvaGlnaGNoYXJ0cy9tb2R1bGVzL2Z1bm5lbC5zcmMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZSBcbiAqIEhpZ2hjaGFydHMgZnVubmVsIG1vZHVsZSwgQmV0YVxuICpcbiAqIChjKSAyMDEwLTIwMTIgVG9yc3RlaW4gSMO4bnNpXG4gKlxuICogTGljZW5zZTogd3d3LmhpZ2hjaGFydHMuY29tL2xpY2Vuc2VcbiAqL1xuXG4vKmdsb2JhbCBIaWdoY2hhcnRzICovXG4oZnVuY3Rpb24gKEhpZ2hjaGFydHMpIHtcblx0XG4ndXNlIHN0cmljdCc7XG5cbi8vIGNyZWF0ZSBzaG9ydGN1dHNcbnZhciBkZWZhdWx0T3B0aW9ucyA9IEhpZ2hjaGFydHMuZ2V0T3B0aW9ucygpLFxuXHRkZWZhdWx0UGxvdE9wdGlvbnMgPSBkZWZhdWx0T3B0aW9ucy5wbG90T3B0aW9ucyxcblx0c2VyaWVzVHlwZXMgPSBIaWdoY2hhcnRzLnNlcmllc1R5cGVzLFxuXHRtZXJnZSA9IEhpZ2hjaGFydHMubWVyZ2UsXG5cdG5vb3AgPSBmdW5jdGlvbiAoKSB7fSxcblx0ZWFjaCA9IEhpZ2hjaGFydHMuZWFjaDtcblxuLy8gc2V0IGRlZmF1bHQgb3B0aW9uc1xuZGVmYXVsdFBsb3RPcHRpb25zLmZ1bm5lbCA9IG1lcmdlKGRlZmF1bHRQbG90T3B0aW9ucy5waWUsIHtcblx0Y2VudGVyOiBbJzUwJScsICc1MCUnXSxcblx0d2lkdGg6ICc5MCUnLFxuXHRuZWNrV2lkdGg6ICczMCUnLFxuXHRoZWlnaHQ6ICcxMDAlJyxcblx0bmVja0hlaWdodDogJzI1JScsXG5cblx0ZGF0YUxhYmVsczoge1xuXHRcdC8vcG9zaXRpb246ICdyaWdodCcsXG5cdFx0Y29ubmVjdG9yV2lkdGg6IDEsXG5cdFx0Y29ubmVjdG9yQ29sb3I6ICcjNjA2MDYwJ1xuXHR9LFxuXHRzaXplOiB0cnVlLCAvLyB0byBhdm9pZCBhZGFwdGluZyB0byBkYXRhIGxhYmVsIHNpemUgaW4gUGllLmRyYXdEYXRhTGFiZWxzXG5cdHN0YXRlczoge1xuXHRcdHNlbGVjdDoge1xuXHRcdFx0Y29sb3I6ICcjQzBDMEMwJyxcblx0XHRcdGJvcmRlckNvbG9yOiAnIzAwMDAwMCcsXG5cdFx0XHRzaGFkb3c6IGZhbHNlXG5cdFx0fVxuXHR9XHRcbn0pO1xuXG5cbnNlcmllc1R5cGVzLmZ1bm5lbCA9IEhpZ2hjaGFydHMuZXh0ZW5kQ2xhc3Moc2VyaWVzVHlwZXMucGllLCB7XG5cdFxuXHR0eXBlOiAnZnVubmVsJyxcblx0YW5pbWF0ZTogbm9vcCxcblxuXHQvKipcblx0ICogT3ZlcnJpZGVzIHRoZSBwaWUgdHJhbnNsYXRlIG1ldGhvZFxuXHQgKi9cblx0dHJhbnNsYXRlOiBmdW5jdGlvbiAoKSB7XG5cdFx0XG5cdFx0dmFyIFxuXHRcdFx0Ly8gR2V0IHBvc2l0aW9ucyAtIGVpdGhlciBhbiBpbnRlZ2VyIG9yIGEgcGVyY2VudGFnZSBzdHJpbmcgbXVzdCBiZSBnaXZlblxuXHRcdFx0Z2V0TGVuZ3RoID0gZnVuY3Rpb24gKGxlbmd0aCwgcmVsYXRpdmVUbykge1xuXHRcdFx0XHRyZXR1cm4gKC8lJC8pLnRlc3QobGVuZ3RoKSA/XG5cdFx0XHRcdFx0cmVsYXRpdmVUbyAqIHBhcnNlSW50KGxlbmd0aCwgMTApIC8gMTAwIDpcblx0XHRcdFx0XHRwYXJzZUludChsZW5ndGgsIDEwKTtcblx0XHRcdH0sXG5cdFx0XHRcblx0XHRcdHN1bSA9IDAsXG5cdFx0XHRzZXJpZXMgPSB0aGlzLFxuXHRcdFx0Y2hhcnQgPSBzZXJpZXMuY2hhcnQsXG5cdFx0XHRwbG90V2lkdGggPSBjaGFydC5wbG90V2lkdGgsXG5cdFx0XHRwbG90SGVpZ2h0ID0gY2hhcnQucGxvdEhlaWdodCxcblx0XHRcdGN1bXVsYXRpdmUgPSAwLCAvLyBzdGFydCBhdCB0b3Bcblx0XHRcdG9wdGlvbnMgPSBzZXJpZXMub3B0aW9ucyxcblx0XHRcdGNlbnRlciA9IG9wdGlvbnMuY2VudGVyLFxuXHRcdFx0Y2VudGVyWCA9IGdldExlbmd0aChjZW50ZXJbMF0sIHBsb3RXaWR0aCksXG5cdFx0XHRjZW50ZXJZID0gZ2V0TGVuZ3RoKGNlbnRlclswXSwgcGxvdEhlaWdodCksXG5cdFx0XHR3aWR0aCA9IGdldExlbmd0aChvcHRpb25zLndpZHRoLCBwbG90V2lkdGgpLFxuXHRcdFx0dGVtcFdpZHRoLFxuXHRcdFx0Z2V0V2lkdGhBdCxcblx0XHRcdGhlaWdodCA9IGdldExlbmd0aChvcHRpb25zLmhlaWdodCwgcGxvdEhlaWdodCksXG5cdFx0XHRuZWNrV2lkdGggPSBnZXRMZW5ndGgob3B0aW9ucy5uZWNrV2lkdGgsIHBsb3RXaWR0aCksXG5cdFx0XHRuZWNrSGVpZ2h0ID0gZ2V0TGVuZ3RoKG9wdGlvbnMubmVja0hlaWdodCwgcGxvdEhlaWdodCksXG5cdFx0XHRuZWNrWSA9IGhlaWdodCAtIG5lY2tIZWlnaHQsXG5cdFx0XHRkYXRhID0gc2VyaWVzLmRhdGEsXG5cdFx0XHRwYXRoLFxuXHRcdFx0ZnJhY3Rpb24sXG5cdFx0XHRoYWxmID0gb3B0aW9ucy5kYXRhTGFiZWxzLnBvc2l0aW9uID09PSAnbGVmdCcgPyAxIDogMCxcblxuXHRcdFx0eDEsIFxuXHRcdFx0eTEsIFxuXHRcdFx0eDIsIFxuXHRcdFx0eDMsIFxuXHRcdFx0eTMsIFxuXHRcdFx0eDQsIFxuXHRcdFx0eTU7XG5cblx0XHQvLyBSZXR1cm4gdGhlIHdpZHRoIGF0IGEgc3BlY2lmaWMgeSBjb29yZGluYXRlXG5cdFx0c2VyaWVzLmdldFdpZHRoQXQgPSBnZXRXaWR0aEF0ID0gZnVuY3Rpb24gKHkpIHtcblx0XHRcdHJldHVybiB5ID4gaGVpZ2h0IC0gbmVja0hlaWdodCB8fCBoZWlnaHQgPT09IG5lY2tIZWlnaHQgP1xuXHRcdFx0XHRuZWNrV2lkdGggOlxuXHRcdFx0XHRuZWNrV2lkdGggKyAod2lkdGggLSBuZWNrV2lkdGgpICogKChoZWlnaHQgLSBuZWNrSGVpZ2h0IC0geSkgLyAoaGVpZ2h0IC0gbmVja0hlaWdodCkpO1xuXHRcdH07XG5cdFx0c2VyaWVzLmdldFggPSBmdW5jdGlvbiAoeSwgaGFsZikge1xuXHRcdFx0cmV0dXJuIGNlbnRlclggKyAoaGFsZiA/IC0xIDogMSkgKiAoKGdldFdpZHRoQXQoeSkgLyAyKSArIG9wdGlvbnMuZGF0YUxhYmVscy5kaXN0YW5jZSk7XG5cdFx0fTtcblxuXHRcdC8vIEV4cG9zZVxuXHRcdHNlcmllcy5jZW50ZXIgPSBbY2VudGVyWCwgY2VudGVyWSwgaGVpZ2h0XTtcblx0XHRzZXJpZXMuY2VudGVyWCA9IGNlbnRlclg7XG5cblx0XHQvKlxuXHRcdCAqIEluZGl2aWR1YWwgcG9pbnQgY29vcmRpbmF0ZSBuYW1pbmc6XG5cdFx0ICpcblx0XHQgKiB4MSx5MSBfX19fX19fX19fX19fX19fXyB4Mix5MVxuXHRcdCAqICBcXCAgICAgICAgICAgICAgICAgICAgICAgICAvXG5cdFx0ICogICBcXCAgICAgICAgICAgICAgICAgICAgICAgL1xuXHRcdCAqICAgIFxcICAgICAgICAgICAgICAgICAgICAgL1xuXHRcdCAqICAgICBcXCAgICAgICAgICAgICAgICAgICAvXG5cdFx0ICogICAgICBcXCAgICAgICAgICAgICAgICAgL1xuXHRcdCAqICAgICB4Myx5MyBfX19fX19fX18geDQseTNcblx0XHQgKlxuXHRcdCAqIEFkZGl0aW9uYWwgZm9yIHRoZSBiYXNlIG9mIHRoZSBuZWNrOlxuXHRcdCAqXG5cdFx0ICogICAgICAgfCAgICAgICAgICAgICAgIHxcblx0XHQgKiAgICAgICB8ICAgICAgICAgICAgICAgfFxuXHRcdCAqICAgICAgIHwgICAgICAgICAgICAgICB8XG5cdFx0ICogICAgIHgzLHk1IF9fX19fX19fXyB4NCx5NVxuXHRcdCAqL1xuXG5cblxuXG5cdFx0Ly8gZ2V0IHRoZSB0b3RhbCBzdW1cblx0XHRlYWNoKGRhdGEsIGZ1bmN0aW9uIChwb2ludCkge1xuXHRcdFx0c3VtICs9IHBvaW50Lnk7XG5cdFx0fSk7XG5cblx0XHRlYWNoKGRhdGEsIGZ1bmN0aW9uIChwb2ludCkge1xuXHRcdFx0Ly8gc2V0IHN0YXJ0IGFuZCBlbmQgcG9zaXRpb25zXG5cdFx0XHR5NSA9IG51bGw7XG5cdFx0XHRmcmFjdGlvbiA9IHN1bSA/IHBvaW50LnkgLyBzdW0gOiAwO1xuXHRcdFx0eTEgPSBjZW50ZXJZIC0gaGVpZ2h0IC8gMiArIGN1bXVsYXRpdmUgKiBoZWlnaHQ7XG5cdFx0XHR5MyA9IHkxICsgZnJhY3Rpb24gKiBoZWlnaHQ7XG5cdFx0XHQvL3RlbXBXaWR0aCA9IG5lY2tXaWR0aCArICh3aWR0aCAtIG5lY2tXaWR0aCkgKiAoKGhlaWdodCAtIG5lY2tIZWlnaHQgLSB5MSkgLyAoaGVpZ2h0IC0gbmVja0hlaWdodCkpO1xuXHRcdFx0dGVtcFdpZHRoID0gZ2V0V2lkdGhBdCh5MSk7XG5cdFx0XHR4MSA9IGNlbnRlclggLSB0ZW1wV2lkdGggLyAyO1xuXHRcdFx0eDIgPSB4MSArIHRlbXBXaWR0aDtcblx0XHRcdHRlbXBXaWR0aCA9IGdldFdpZHRoQXQoeTMpO1xuXHRcdFx0eDMgPSBjZW50ZXJYIC0gdGVtcFdpZHRoIC8gMjtcblx0XHRcdHg0ID0geDMgKyB0ZW1wV2lkdGg7XG5cblx0XHRcdC8vIHRoZSBlbnRpcmUgcG9pbnQgaXMgd2l0aGluIHRoZSBuZWNrXG5cdFx0XHRpZiAoeTEgPiBuZWNrWSkge1xuXHRcdFx0XHR4MSA9IHgzID0gY2VudGVyWCAtIG5lY2tXaWR0aCAvIDI7XG5cdFx0XHRcdHgyID0geDQgPSBjZW50ZXJYICsgbmVja1dpZHRoIC8gMjtcblx0XHRcdFxuXHRcdFx0Ly8gdGhlIGJhc2Ugb2YgdGhlIG5lY2tcblx0XHRcdH0gZWxzZSBpZiAoeTMgPiBuZWNrWSkge1xuXHRcdFx0XHR5NSA9IHkzO1xuXG5cdFx0XHRcdHRlbXBXaWR0aCA9IGdldFdpZHRoQXQobmVja1kpO1xuXHRcdFx0XHR4MyA9IGNlbnRlclggLSB0ZW1wV2lkdGggLyAyO1xuXHRcdFx0XHR4NCA9IHgzICsgdGVtcFdpZHRoO1xuXG5cdFx0XHRcdHkzID0gbmVja1k7XG5cdFx0XHR9XG5cblx0XHRcdC8vIHNhdmUgdGhlIHBhdGhcblx0XHRcdHBhdGggPSBbXG5cdFx0XHRcdCdNJyxcblx0XHRcdFx0eDEsIHkxLFxuXHRcdFx0XHQnTCcsXG5cdFx0XHRcdHgyLCB5MSxcblx0XHRcdFx0eDQsIHkzXG5cdFx0XHRdO1xuXHRcdFx0aWYgKHk1KSB7XG5cdFx0XHRcdHBhdGgucHVzaCh4NCwgeTUsIHgzLCB5NSk7XG5cdFx0XHR9XG5cdFx0XHRwYXRoLnB1c2goeDMsIHkzLCAnWicpO1xuXG5cdFx0XHQvLyBwcmVwYXJlIGZvciB1c2luZyBzaGFyZWQgZHJcblx0XHRcdHBvaW50LnNoYXBlVHlwZSA9ICdwYXRoJztcblx0XHRcdHBvaW50LnNoYXBlQXJncyA9IHsgZDogcGF0aCB9O1xuXG5cblx0XHRcdC8vIGZvciB0b29sdGlwcyBhbmQgZGF0YSBsYWJlbHNcblx0XHRcdHBvaW50LnBlcmNlbnRhZ2UgPSBmcmFjdGlvbiAqIDEwMDtcblx0XHRcdHBvaW50LnBsb3RYID0gY2VudGVyWDtcblx0XHRcdHBvaW50LnBsb3RZID0gKHkxICsgKHk1IHx8IHkzKSkgLyAyO1xuXG5cdFx0XHQvLyBQbGFjZW1lbnQgb2YgdG9vbHRpcHMgYW5kIGRhdGEgbGFiZWxzXG5cdFx0XHRwb2ludC50b29sdGlwUG9zID0gW1xuXHRcdFx0XHRjZW50ZXJYLFxuXHRcdFx0XHRwb2ludC5wbG90WVxuXHRcdFx0XTtcblxuXHRcdFx0Ly8gU2xpY2UgaXMgYSBub29wIG9uIGZ1bm5lbCBwb2ludHNcblx0XHRcdHBvaW50LnNsaWNlID0gbm9vcDtcblx0XHRcdFxuXHRcdFx0Ly8gTWltaWNraW5nIHBpZSBkYXRhIGxhYmVsIHBsYWNlbWVudCBsb2dpY1xuXHRcdFx0cG9pbnQuaGFsZiA9IGhhbGY7XG5cblx0XHRcdGN1bXVsYXRpdmUgKz0gZnJhY3Rpb247XG5cdFx0fSk7XG5cblxuXHRcdHNlcmllcy5zZXRUb29sdGlwUG9pbnRzKCk7XG5cdH0sXG5cdC8qKlxuXHQgKiBEcmF3IGEgc2luZ2xlIHBvaW50ICh3ZWRnZSlcblx0ICogQHBhcmFtIHtPYmplY3R9IHBvaW50IFRoZSBwb2ludCBvYmplY3Rcblx0ICogQHBhcmFtIHtPYmplY3R9IGNvbG9yIFRoZSBjb2xvciBvZiB0aGUgcG9pbnRcblx0ICogQHBhcmFtIHtOdW1iZXJ9IGJyaWdodG5lc3MgVGhlIGJyaWdodG5lc3MgcmVsYXRpdmUgdG8gdGhlIGNvbG9yXG5cdCAqL1xuXHRkcmF3UG9pbnRzOiBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIHNlcmllcyA9IHRoaXMsXG5cdFx0XHRvcHRpb25zID0gc2VyaWVzLm9wdGlvbnMsXG5cdFx0XHRjaGFydCA9IHNlcmllcy5jaGFydCxcblx0XHRcdHJlbmRlcmVyID0gY2hhcnQucmVuZGVyZXI7XG5cblx0XHRlYWNoKHNlcmllcy5kYXRhLCBmdW5jdGlvbiAocG9pbnQpIHtcblx0XHRcdFxuXHRcdFx0dmFyIGdyYXBoaWMgPSBwb2ludC5ncmFwaGljLFxuXHRcdFx0XHRzaGFwZUFyZ3MgPSBwb2ludC5zaGFwZUFyZ3M7XG5cblx0XHRcdGlmICghZ3JhcGhpYykgeyAvLyBDcmVhdGUgdGhlIHNoYXBlc1xuXHRcdFx0XHRwb2ludC5ncmFwaGljID0gcmVuZGVyZXIucGF0aChzaGFwZUFyZ3MpLlxuXHRcdFx0XHRcdGF0dHIoe1xuXHRcdFx0XHRcdFx0ZmlsbDogcG9pbnQuY29sb3IsXG5cdFx0XHRcdFx0XHRzdHJva2U6IG9wdGlvbnMuYm9yZGVyQ29sb3IsXG5cdFx0XHRcdFx0XHQnc3Ryb2tlLXdpZHRoJzogb3B0aW9ucy5ib3JkZXJXaWR0aFxuXHRcdFx0XHRcdH0pLlxuXHRcdFx0XHRcdGFkZChzZXJpZXMuZ3JvdXApO1xuXHRcdFx0XHRcdFxuXHRcdFx0fSBlbHNlIHsgLy8gVXBkYXRlIHRoZSBzaGFwZXNcblx0XHRcdFx0Z3JhcGhpYy5hbmltYXRlKHNoYXBlQXJncyk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEZ1bm5lbCBpdGVtcyBkb24ndCBoYXZlIGFuZ2xlcyAoIzIyODkpXG5cdCAqL1xuXHRzb3J0QnlBbmdsZTogbm9vcCxcblx0XG5cdC8qKlxuXHQgKiBFeHRlbmQgdGhlIHBpZSBkYXRhIGxhYmVsIG1ldGhvZFxuXHQgKi9cblx0ZHJhd0RhdGFMYWJlbHM6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgZGF0YSA9IHRoaXMuZGF0YSxcblx0XHRcdGxhYmVsRGlzdGFuY2UgPSB0aGlzLm9wdGlvbnMuZGF0YUxhYmVscy5kaXN0YW5jZSxcblx0XHRcdGxlZnRTaWRlLFxuXHRcdFx0c2lnbixcblx0XHRcdHBvaW50LFxuXHRcdFx0aSA9IGRhdGEubGVuZ3RoLFxuXHRcdFx0eCxcblx0XHRcdHk7XG5cdFx0XG5cdFx0Ly8gSW4gdGhlIG9yaWdpbmFsIHBpZSBsYWJlbCBhbnRpY29sbGlzaW9uIGxvZ2ljLCB0aGUgc2xvdHMgYXJlIGRpc3RyaWJ1dGVkXG5cdFx0Ly8gZnJvbSBvbmUgbGFiZWxEaXN0YW5jZSBhYm92ZSB0byBvbmUgbGFiZWxEaXN0YW5jZSBiZWxvdyB0aGUgcGllLiBJbiBmdW5uZWxzXG5cdFx0Ly8gd2UgZG9uJ3Qgd2FudCB0aGlzLlxuXHRcdHRoaXMuY2VudGVyWzJdIC09IDIgKiBsYWJlbERpc3RhbmNlO1xuXHRcdFxuXHRcdC8vIFNldCB0aGUgbGFiZWwgcG9zaXRpb24gYXJyYXkgZm9yIGVhY2ggcG9pbnQuXG5cdFx0d2hpbGUgKGktLSkge1xuXHRcdFx0cG9pbnQgPSBkYXRhW2ldO1xuXHRcdFx0bGVmdFNpZGUgPSBwb2ludC5oYWxmO1xuXHRcdFx0c2lnbiA9IGxlZnRTaWRlID8gMSA6IC0xO1xuXHRcdFx0eSA9IHBvaW50LnBsb3RZO1xuXHRcdFx0eCA9IHRoaXMuZ2V0WCh5LCBsZWZ0U2lkZSk7XG5cdFx0XHRcdFxuXHRcdFx0Ly8gc2V0IHRoZSBhbmNob3IgcG9pbnQgZm9yIGRhdGEgbGFiZWxzXG5cdFx0XHRwb2ludC5sYWJlbFBvcyA9IFtcblx0XHRcdFx0MCwgLy8gZmlyc3QgYnJlYWsgb2YgY29ubmVjdG9yXG5cdFx0XHRcdHksIC8vIGEvYVxuXHRcdFx0XHR4ICsgKGxhYmVsRGlzdGFuY2UgLSA1KSAqIHNpZ24sIC8vIHNlY29uZCBicmVhaywgcmlnaHQgb3V0c2lkZSBwb2ludCBzaGFwZVxuXHRcdFx0XHR5LCAvLyBhL2Fcblx0XHRcdFx0eCArIGxhYmVsRGlzdGFuY2UgKiBzaWduLCAvLyBsYW5kaW5nIHBvaW50IGZvciBjb25uZWN0b3Jcblx0XHRcdFx0eSwgLy8gYS9hXG5cdFx0XHRcdGxlZnRTaWRlID8gJ3JpZ2h0JyA6ICdsZWZ0JywgLy8gYWxpZ25tZW50XG5cdFx0XHRcdDAgLy8gY2VudGVyIGFuZ2xlXG5cdFx0XHRdO1xuXHRcdH1cblx0XHRcblx0XHRzZXJpZXNUeXBlcy5waWUucHJvdG90eXBlLmRyYXdEYXRhTGFiZWxzLmNhbGwodGhpcyk7XG5cdH1cblxufSk7XG5cblxufShIaWdoY2hhcnRzKSk7XG4iXSwiZmlsZSI6InBsdWdpbnMvdWVkaXRvci90aGlyZC1wYXJ0eS9oaWdoY2hhcnRzL21vZHVsZXMvZnVubmVsLnNyYy5qcyJ9
