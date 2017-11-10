/**
 * @license Highcharts JS v3.0.6 (2013-10-04)
 * Plugin for displaying a message when there is no data visible in chart.
 *
 * (c) 2010-2013 Highsoft AS
 * Author: Øystein Moseng
 *
 * License: www.highcharts.com/license
 */

(function (H) { // docs
	
	var seriesTypes = H.seriesTypes,
		chartPrototype = H.Chart.prototype,
		defaultOptions = H.getOptions(),
		extend = H.extend;

	// Add language option
	extend(defaultOptions.lang, {
		noData: 'No data to display'
	});
	
	// Add default display options for message
	defaultOptions.noData = {
		position: {
			x: 0,
			y: 0,			
			align: 'center',
			verticalAlign: 'middle'
		},
		attr: {						
		},
		style: {	
			fontWeight: 'bold',		
			fontSize: '12px',
			color: '#60606a'		
		}
	};

	/**
	 * Define hasData functions for series. These return true if there are data points on this series within the plot area
	 */	
	function hasDataPie() {
		return !!this.points.length; /* != 0 */
	}

	seriesTypes.pie.prototype.hasData = hasDataPie;

	if (seriesTypes.gauge) {
		seriesTypes.gauge.prototype.hasData = hasDataPie;
	}

	if (seriesTypes.waterfall) {
		seriesTypes.waterfall.prototype.hasData = hasDataPie;
	}

	H.Series.prototype.hasData = function () {
		return this.dataMax !== undefined && this.dataMin !== undefined;
	};
	
	/**
	 * Display a no-data message.
	 *
	 * @param {String} str An optional message to show in place of the default one 
	 */
	chartPrototype.showNoData = function (str) {
		var chart = this,
			options = chart.options,
			text = str || options.lang.noData,
			noDataOptions = options.noData;

		if (!chart.noDataLabel) {
			chart.noDataLabel = chart.renderer.label(text, 0, 0, null, null, null, null, null, 'no-data')
				.attr(noDataOptions.attr)
				.css(noDataOptions.style)
				.add();
			chart.noDataLabel.align(extend(chart.noDataLabel.getBBox(), noDataOptions.position), false, 'plotBox');
		}
	};

	/**
	 * Hide no-data message	
	 */	
	chartPrototype.hideNoData = function () {
		var chart = this;
		if (chart.noDataLabel) {
			chart.noDataLabel = chart.noDataLabel.destroy();
		}
	};

	/**
	 * Returns true if there are data points within the plot area now
	 */	
	chartPrototype.hasData = function () {
		var chart = this,
			series = chart.series,
			i = series.length;

		while (i--) {
			if (series[i].hasData() && !series[i].options.isInternal) { 
				return true;
			}	
		}

		return false;
	};

	/**
	 * Show no-data message if there is no data in sight. Otherwise, hide it.
	 */
	function handleNoData() {
		var chart = this;
		if (chart.hasData()) {
			chart.hideNoData();
		} else {
			chart.showNoData();
		}
	}

	/**
	 * Add event listener to handle automatic display of no-data message
	 */
	chartPrototype.callbacks.push(function (chart) {
		H.addEvent(chart, 'load', handleNoData);
		H.addEvent(chart, 'redraw', handleNoData);
	});

}(Highcharts));

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvdGhpcmQtcGFydHkvaGlnaGNoYXJ0cy9tb2R1bGVzL25vLWRhdGEtdG8tZGlzcGxheS5zcmMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZSBIaWdoY2hhcnRzIEpTIHYzLjAuNiAoMjAxMy0xMC0wNClcbiAqIFBsdWdpbiBmb3IgZGlzcGxheWluZyBhIG1lc3NhZ2Ugd2hlbiB0aGVyZSBpcyBubyBkYXRhIHZpc2libGUgaW4gY2hhcnQuXG4gKlxuICogKGMpIDIwMTAtMjAxMyBIaWdoc29mdCBBU1xuICogQXV0aG9yOiDDmHlzdGVpbiBNb3NlbmdcbiAqXG4gKiBMaWNlbnNlOiB3d3cuaGlnaGNoYXJ0cy5jb20vbGljZW5zZVxuICovXG5cbihmdW5jdGlvbiAoSCkgeyAvLyBkb2NzXG5cdFxuXHR2YXIgc2VyaWVzVHlwZXMgPSBILnNlcmllc1R5cGVzLFxuXHRcdGNoYXJ0UHJvdG90eXBlID0gSC5DaGFydC5wcm90b3R5cGUsXG5cdFx0ZGVmYXVsdE9wdGlvbnMgPSBILmdldE9wdGlvbnMoKSxcblx0XHRleHRlbmQgPSBILmV4dGVuZDtcblxuXHQvLyBBZGQgbGFuZ3VhZ2Ugb3B0aW9uXG5cdGV4dGVuZChkZWZhdWx0T3B0aW9ucy5sYW5nLCB7XG5cdFx0bm9EYXRhOiAnTm8gZGF0YSB0byBkaXNwbGF5J1xuXHR9KTtcblx0XG5cdC8vIEFkZCBkZWZhdWx0IGRpc3BsYXkgb3B0aW9ucyBmb3IgbWVzc2FnZVxuXHRkZWZhdWx0T3B0aW9ucy5ub0RhdGEgPSB7XG5cdFx0cG9zaXRpb246IHtcblx0XHRcdHg6IDAsXG5cdFx0XHR5OiAwLFx0XHRcdFxuXHRcdFx0YWxpZ246ICdjZW50ZXInLFxuXHRcdFx0dmVydGljYWxBbGlnbjogJ21pZGRsZSdcblx0XHR9LFxuXHRcdGF0dHI6IHtcdFx0XHRcdFx0XHRcblx0XHR9LFxuXHRcdHN0eWxlOiB7XHRcblx0XHRcdGZvbnRXZWlnaHQ6ICdib2xkJyxcdFx0XG5cdFx0XHRmb250U2l6ZTogJzEycHgnLFxuXHRcdFx0Y29sb3I6ICcjNjA2MDZhJ1x0XHRcblx0XHR9XG5cdH07XG5cblx0LyoqXG5cdCAqIERlZmluZSBoYXNEYXRhIGZ1bmN0aW9ucyBmb3Igc2VyaWVzLiBUaGVzZSByZXR1cm4gdHJ1ZSBpZiB0aGVyZSBhcmUgZGF0YSBwb2ludHMgb24gdGhpcyBzZXJpZXMgd2l0aGluIHRoZSBwbG90IGFyZWFcblx0ICovXHRcblx0ZnVuY3Rpb24gaGFzRGF0YVBpZSgpIHtcblx0XHRyZXR1cm4gISF0aGlzLnBvaW50cy5sZW5ndGg7IC8qICE9IDAgKi9cblx0fVxuXG5cdHNlcmllc1R5cGVzLnBpZS5wcm90b3R5cGUuaGFzRGF0YSA9IGhhc0RhdGFQaWU7XG5cblx0aWYgKHNlcmllc1R5cGVzLmdhdWdlKSB7XG5cdFx0c2VyaWVzVHlwZXMuZ2F1Z2UucHJvdG90eXBlLmhhc0RhdGEgPSBoYXNEYXRhUGllO1xuXHR9XG5cblx0aWYgKHNlcmllc1R5cGVzLndhdGVyZmFsbCkge1xuXHRcdHNlcmllc1R5cGVzLndhdGVyZmFsbC5wcm90b3R5cGUuaGFzRGF0YSA9IGhhc0RhdGFQaWU7XG5cdH1cblxuXHRILlNlcmllcy5wcm90b3R5cGUuaGFzRGF0YSA9IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gdGhpcy5kYXRhTWF4ICE9PSB1bmRlZmluZWQgJiYgdGhpcy5kYXRhTWluICE9PSB1bmRlZmluZWQ7XG5cdH07XG5cdFxuXHQvKipcblx0ICogRGlzcGxheSBhIG5vLWRhdGEgbWVzc2FnZS5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd9IHN0ciBBbiBvcHRpb25hbCBtZXNzYWdlIHRvIHNob3cgaW4gcGxhY2Ugb2YgdGhlIGRlZmF1bHQgb25lIFxuXHQgKi9cblx0Y2hhcnRQcm90b3R5cGUuc2hvd05vRGF0YSA9IGZ1bmN0aW9uIChzdHIpIHtcblx0XHR2YXIgY2hhcnQgPSB0aGlzLFxuXHRcdFx0b3B0aW9ucyA9IGNoYXJ0Lm9wdGlvbnMsXG5cdFx0XHR0ZXh0ID0gc3RyIHx8IG9wdGlvbnMubGFuZy5ub0RhdGEsXG5cdFx0XHRub0RhdGFPcHRpb25zID0gb3B0aW9ucy5ub0RhdGE7XG5cblx0XHRpZiAoIWNoYXJ0Lm5vRGF0YUxhYmVsKSB7XG5cdFx0XHRjaGFydC5ub0RhdGFMYWJlbCA9IGNoYXJ0LnJlbmRlcmVyLmxhYmVsKHRleHQsIDAsIDAsIG51bGwsIG51bGwsIG51bGwsIG51bGwsIG51bGwsICduby1kYXRhJylcblx0XHRcdFx0LmF0dHIobm9EYXRhT3B0aW9ucy5hdHRyKVxuXHRcdFx0XHQuY3NzKG5vRGF0YU9wdGlvbnMuc3R5bGUpXG5cdFx0XHRcdC5hZGQoKTtcblx0XHRcdGNoYXJ0Lm5vRGF0YUxhYmVsLmFsaWduKGV4dGVuZChjaGFydC5ub0RhdGFMYWJlbC5nZXRCQm94KCksIG5vRGF0YU9wdGlvbnMucG9zaXRpb24pLCBmYWxzZSwgJ3Bsb3RCb3gnKTtcblx0XHR9XG5cdH07XG5cblx0LyoqXG5cdCAqIEhpZGUgbm8tZGF0YSBtZXNzYWdlXHRcblx0ICovXHRcblx0Y2hhcnRQcm90b3R5cGUuaGlkZU5vRGF0YSA9IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgY2hhcnQgPSB0aGlzO1xuXHRcdGlmIChjaGFydC5ub0RhdGFMYWJlbCkge1xuXHRcdFx0Y2hhcnQubm9EYXRhTGFiZWwgPSBjaGFydC5ub0RhdGFMYWJlbC5kZXN0cm95KCk7XG5cdFx0fVxuXHR9O1xuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRydWUgaWYgdGhlcmUgYXJlIGRhdGEgcG9pbnRzIHdpdGhpbiB0aGUgcGxvdCBhcmVhIG5vd1xuXHQgKi9cdFxuXHRjaGFydFByb3RvdHlwZS5oYXNEYXRhID0gZnVuY3Rpb24gKCkge1xuXHRcdHZhciBjaGFydCA9IHRoaXMsXG5cdFx0XHRzZXJpZXMgPSBjaGFydC5zZXJpZXMsXG5cdFx0XHRpID0gc2VyaWVzLmxlbmd0aDtcblxuXHRcdHdoaWxlIChpLS0pIHtcblx0XHRcdGlmIChzZXJpZXNbaV0uaGFzRGF0YSgpICYmICFzZXJpZXNbaV0ub3B0aW9ucy5pc0ludGVybmFsKSB7IFxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cdFxuXHRcdH1cblxuXHRcdHJldHVybiBmYWxzZTtcblx0fTtcblxuXHQvKipcblx0ICogU2hvdyBuby1kYXRhIG1lc3NhZ2UgaWYgdGhlcmUgaXMgbm8gZGF0YSBpbiBzaWdodC4gT3RoZXJ3aXNlLCBoaWRlIGl0LlxuXHQgKi9cblx0ZnVuY3Rpb24gaGFuZGxlTm9EYXRhKCkge1xuXHRcdHZhciBjaGFydCA9IHRoaXM7XG5cdFx0aWYgKGNoYXJ0Lmhhc0RhdGEoKSkge1xuXHRcdFx0Y2hhcnQuaGlkZU5vRGF0YSgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRjaGFydC5zaG93Tm9EYXRhKCk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIEFkZCBldmVudCBsaXN0ZW5lciB0byBoYW5kbGUgYXV0b21hdGljIGRpc3BsYXkgb2Ygbm8tZGF0YSBtZXNzYWdlXG5cdCAqL1xuXHRjaGFydFByb3RvdHlwZS5jYWxsYmFja3MucHVzaChmdW5jdGlvbiAoY2hhcnQpIHtcblx0XHRILmFkZEV2ZW50KGNoYXJ0LCAnbG9hZCcsIGhhbmRsZU5vRGF0YSk7XG5cdFx0SC5hZGRFdmVudChjaGFydCwgJ3JlZHJhdycsIGhhbmRsZU5vRGF0YSk7XG5cdH0pO1xuXG59KEhpZ2hjaGFydHMpKTtcbiJdLCJmaWxlIjoicGx1Z2lucy91ZWRpdG9yL3RoaXJkLXBhcnR5L2hpZ2hjaGFydHMvbW9kdWxlcy9uby1kYXRhLXRvLWRpc3BsYXkuc3JjLmpzIn0=
