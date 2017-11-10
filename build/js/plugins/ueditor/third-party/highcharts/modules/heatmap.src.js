(function (Highcharts) {
	var seriesTypes = Highcharts.seriesTypes,
		each = Highcharts.each;
	
	seriesTypes.heatmap = Highcharts.extendClass(seriesTypes.map, {
		colorKey: 'z',
		useMapGeometry: false,
		pointArrayMap: ['y', 'z'],
		translate: function () {
			var series = this,
				options = series.options,
				dataMin = Number.MAX_VALUE,
				dataMax = Number.MIN_VALUE;

			series.generatePoints();
	
			each(series.data, function (point) {
				var x = point.x,
					y = point.y,
					value = point.z,
					xPad = (options.colsize || 1) / 2,
					yPad = (options.rowsize || 1) / 2;

				point.path = [
					'M', x - xPad, y - yPad,
					'L', x + xPad, y - yPad,
					'L', x + xPad, y + yPad,
					'L', x - xPad, y + yPad,
					'Z'
				];
				
				point.shapeType = 'path';
				point.shapeArgs = {
					d: series.translatePath(point.path)
				};
				
				if (typeof value === 'number') {
					if (value > dataMax) {
						dataMax = value;
					} else if (value < dataMin) {
						dataMin = value;
					}
				}
			});
			
			series.translateColors(dataMin, dataMax);
		},
		
		getBox: function () {}
			
	});
	
}(Highcharts));

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvdGhpcmQtcGFydHkvaGlnaGNoYXJ0cy9tb2R1bGVzL2hlYXRtYXAuc3JjLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiAoSGlnaGNoYXJ0cykge1xuXHR2YXIgc2VyaWVzVHlwZXMgPSBIaWdoY2hhcnRzLnNlcmllc1R5cGVzLFxuXHRcdGVhY2ggPSBIaWdoY2hhcnRzLmVhY2g7XG5cdFxuXHRzZXJpZXNUeXBlcy5oZWF0bWFwID0gSGlnaGNoYXJ0cy5leHRlbmRDbGFzcyhzZXJpZXNUeXBlcy5tYXAsIHtcblx0XHRjb2xvcktleTogJ3onLFxuXHRcdHVzZU1hcEdlb21ldHJ5OiBmYWxzZSxcblx0XHRwb2ludEFycmF5TWFwOiBbJ3knLCAneiddLFxuXHRcdHRyYW5zbGF0ZTogZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyIHNlcmllcyA9IHRoaXMsXG5cdFx0XHRcdG9wdGlvbnMgPSBzZXJpZXMub3B0aW9ucyxcblx0XHRcdFx0ZGF0YU1pbiA9IE51bWJlci5NQVhfVkFMVUUsXG5cdFx0XHRcdGRhdGFNYXggPSBOdW1iZXIuTUlOX1ZBTFVFO1xuXG5cdFx0XHRzZXJpZXMuZ2VuZXJhdGVQb2ludHMoKTtcblx0XG5cdFx0XHRlYWNoKHNlcmllcy5kYXRhLCBmdW5jdGlvbiAocG9pbnQpIHtcblx0XHRcdFx0dmFyIHggPSBwb2ludC54LFxuXHRcdFx0XHRcdHkgPSBwb2ludC55LFxuXHRcdFx0XHRcdHZhbHVlID0gcG9pbnQueixcblx0XHRcdFx0XHR4UGFkID0gKG9wdGlvbnMuY29sc2l6ZSB8fCAxKSAvIDIsXG5cdFx0XHRcdFx0eVBhZCA9IChvcHRpb25zLnJvd3NpemUgfHwgMSkgLyAyO1xuXG5cdFx0XHRcdHBvaW50LnBhdGggPSBbXG5cdFx0XHRcdFx0J00nLCB4IC0geFBhZCwgeSAtIHlQYWQsXG5cdFx0XHRcdFx0J0wnLCB4ICsgeFBhZCwgeSAtIHlQYWQsXG5cdFx0XHRcdFx0J0wnLCB4ICsgeFBhZCwgeSArIHlQYWQsXG5cdFx0XHRcdFx0J0wnLCB4IC0geFBhZCwgeSArIHlQYWQsXG5cdFx0XHRcdFx0J1onXG5cdFx0XHRcdF07XG5cdFx0XHRcdFxuXHRcdFx0XHRwb2ludC5zaGFwZVR5cGUgPSAncGF0aCc7XG5cdFx0XHRcdHBvaW50LnNoYXBlQXJncyA9IHtcblx0XHRcdFx0XHRkOiBzZXJpZXMudHJhbnNsYXRlUGF0aChwb2ludC5wYXRoKVxuXHRcdFx0XHR9O1xuXHRcdFx0XHRcblx0XHRcdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHtcblx0XHRcdFx0XHRpZiAodmFsdWUgPiBkYXRhTWF4KSB7XG5cdFx0XHRcdFx0XHRkYXRhTWF4ID0gdmFsdWU7XG5cdFx0XHRcdFx0fSBlbHNlIGlmICh2YWx1ZSA8IGRhdGFNaW4pIHtcblx0XHRcdFx0XHRcdGRhdGFNaW4gPSB2YWx1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdFx0XG5cdFx0XHRzZXJpZXMudHJhbnNsYXRlQ29sb3JzKGRhdGFNaW4sIGRhdGFNYXgpO1xuXHRcdH0sXG5cdFx0XG5cdFx0Z2V0Qm94OiBmdW5jdGlvbiAoKSB7fVxuXHRcdFx0XG5cdH0pO1xuXHRcbn0oSGlnaGNoYXJ0cykpO1xuIl0sImZpbGUiOiJwbHVnaW5zL3VlZGl0b3IvdGhpcmQtcGFydHkvaGlnaGNoYXJ0cy9tb2R1bGVzL2hlYXRtYXAuc3JjLmpzIn0=
