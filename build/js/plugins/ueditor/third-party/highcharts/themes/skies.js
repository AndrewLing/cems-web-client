/**
 * Skies theme for Highcharts JS
 * @author Torstein Hønsi
 */

Highcharts.theme = {
	colors: ["#514F78", "#42A07B", "#9B5E4A", "#72727F", "#1F949A", "#82914E", "#86777F", "#42A07B"],
	chart: {
		className: 'skies',
		borderWidth: 0,
		plotShadow: true,
		plotBackgroundImage: 'http://www.highcharts.com/demo/gfx/skies.jpg',
		plotBackgroundColor: {
			linearGradient: [0, 0, 250, 500],
			stops: [
				[0, 'rgba(255, 255, 255, 1)'],
				[1, 'rgba(255, 255, 255, 0)']
			]
		},
		plotBorderWidth: 1
	},
	title: {
		style: {
			color: '#3E576F',
			font: '16px Lucida Grande, Lucida Sans Unicode, Verdana, Arial, Helvetica, sans-serif'
		}
	},
	subtitle: {
		style: {
			color: '#6D869F',
			font: '12px Lucida Grande, Lucida Sans Unicode, Verdana, Arial, Helvetica, sans-serif'
		}
	},
	xAxis: {
		gridLineWidth: 0,
		lineColor: '#C0D0E0',
		tickColor: '#C0D0E0',
		labels: {
			style: {
				color: '#666',
				fontWeight: 'bold'
			}
		},
		title: {
			style: {
				color: '#666',
				font: '12px Lucida Grande, Lucida Sans Unicode, Verdana, Arial, Helvetica, sans-serif'
			}
		}
	},
	yAxis: {
		alternateGridColor: 'rgba(255, 255, 255, .5)',
		lineColor: '#C0D0E0',
		tickColor: '#C0D0E0',
		tickWidth: 1,
		labels: {
			style: {
				color: '#666',
				fontWeight: 'bold'
			}
		},
		title: {
			style: {
				color: '#666',
				font: '12px Lucida Grande, Lucida Sans Unicode, Verdana, Arial, Helvetica, sans-serif'
			}
		}
	},
	legend: {
		itemStyle: {
			font: '9pt Trebuchet MS, Verdana, sans-serif',
			color: '#3E576F'
		},
		itemHoverStyle: {
			color: 'black'
		},
		itemHiddenStyle: {
			color: 'silver'
		}
	},
	labels: {
		style: {
			color: '#3E576F'
		}
	}
};

// Apply the theme
var highchartsOptions = Highcharts.setOptions(Highcharts.theme);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvdGhpcmQtcGFydHkvaGlnaGNoYXJ0cy90aGVtZXMvc2tpZXMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBTa2llcyB0aGVtZSBmb3IgSGlnaGNoYXJ0cyBKU1xuICogQGF1dGhvciBUb3JzdGVpbiBIw7huc2lcbiAqL1xuXG5IaWdoY2hhcnRzLnRoZW1lID0ge1xuXHRjb2xvcnM6IFtcIiM1MTRGNzhcIiwgXCIjNDJBMDdCXCIsIFwiIzlCNUU0QVwiLCBcIiM3MjcyN0ZcIiwgXCIjMUY5NDlBXCIsIFwiIzgyOTE0RVwiLCBcIiM4Njc3N0ZcIiwgXCIjNDJBMDdCXCJdLFxuXHRjaGFydDoge1xuXHRcdGNsYXNzTmFtZTogJ3NraWVzJyxcblx0XHRib3JkZXJXaWR0aDogMCxcblx0XHRwbG90U2hhZG93OiB0cnVlLFxuXHRcdHBsb3RCYWNrZ3JvdW5kSW1hZ2U6ICdodHRwOi8vd3d3LmhpZ2hjaGFydHMuY29tL2RlbW8vZ2Z4L3NraWVzLmpwZycsXG5cdFx0cGxvdEJhY2tncm91bmRDb2xvcjoge1xuXHRcdFx0bGluZWFyR3JhZGllbnQ6IFswLCAwLCAyNTAsIDUwMF0sXG5cdFx0XHRzdG9wczogW1xuXHRcdFx0XHRbMCwgJ3JnYmEoMjU1LCAyNTUsIDI1NSwgMSknXSxcblx0XHRcdFx0WzEsICdyZ2JhKDI1NSwgMjU1LCAyNTUsIDApJ11cblx0XHRcdF1cblx0XHR9LFxuXHRcdHBsb3RCb3JkZXJXaWR0aDogMVxuXHR9LFxuXHR0aXRsZToge1xuXHRcdHN0eWxlOiB7XG5cdFx0XHRjb2xvcjogJyMzRTU3NkYnLFxuXHRcdFx0Zm9udDogJzE2cHggTHVjaWRhIEdyYW5kZSwgTHVjaWRhIFNhbnMgVW5pY29kZSwgVmVyZGFuYSwgQXJpYWwsIEhlbHZldGljYSwgc2Fucy1zZXJpZidcblx0XHR9XG5cdH0sXG5cdHN1YnRpdGxlOiB7XG5cdFx0c3R5bGU6IHtcblx0XHRcdGNvbG9yOiAnIzZEODY5RicsXG5cdFx0XHRmb250OiAnMTJweCBMdWNpZGEgR3JhbmRlLCBMdWNpZGEgU2FucyBVbmljb2RlLCBWZXJkYW5hLCBBcmlhbCwgSGVsdmV0aWNhLCBzYW5zLXNlcmlmJ1xuXHRcdH1cblx0fSxcblx0eEF4aXM6IHtcblx0XHRncmlkTGluZVdpZHRoOiAwLFxuXHRcdGxpbmVDb2xvcjogJyNDMEQwRTAnLFxuXHRcdHRpY2tDb2xvcjogJyNDMEQwRTAnLFxuXHRcdGxhYmVsczoge1xuXHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0Y29sb3I6ICcjNjY2Jyxcblx0XHRcdFx0Zm9udFdlaWdodDogJ2JvbGQnXG5cdFx0XHR9XG5cdFx0fSxcblx0XHR0aXRsZToge1xuXHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0Y29sb3I6ICcjNjY2Jyxcblx0XHRcdFx0Zm9udDogJzEycHggTHVjaWRhIEdyYW5kZSwgTHVjaWRhIFNhbnMgVW5pY29kZSwgVmVyZGFuYSwgQXJpYWwsIEhlbHZldGljYSwgc2Fucy1zZXJpZidcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cdHlBeGlzOiB7XG5cdFx0YWx0ZXJuYXRlR3JpZENvbG9yOiAncmdiYSgyNTUsIDI1NSwgMjU1LCAuNSknLFxuXHRcdGxpbmVDb2xvcjogJyNDMEQwRTAnLFxuXHRcdHRpY2tDb2xvcjogJyNDMEQwRTAnLFxuXHRcdHRpY2tXaWR0aDogMSxcblx0XHRsYWJlbHM6IHtcblx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdGNvbG9yOiAnIzY2NicsXG5cdFx0XHRcdGZvbnRXZWlnaHQ6ICdib2xkJ1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0dGl0bGU6IHtcblx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdGNvbG9yOiAnIzY2NicsXG5cdFx0XHRcdGZvbnQ6ICcxMnB4IEx1Y2lkYSBHcmFuZGUsIEx1Y2lkYSBTYW5zIFVuaWNvZGUsIFZlcmRhbmEsIEFyaWFsLCBIZWx2ZXRpY2EsIHNhbnMtc2VyaWYnXG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXHRsZWdlbmQ6IHtcblx0XHRpdGVtU3R5bGU6IHtcblx0XHRcdGZvbnQ6ICc5cHQgVHJlYnVjaGV0IE1TLCBWZXJkYW5hLCBzYW5zLXNlcmlmJyxcblx0XHRcdGNvbG9yOiAnIzNFNTc2Ridcblx0XHR9LFxuXHRcdGl0ZW1Ib3ZlclN0eWxlOiB7XG5cdFx0XHRjb2xvcjogJ2JsYWNrJ1xuXHRcdH0sXG5cdFx0aXRlbUhpZGRlblN0eWxlOiB7XG5cdFx0XHRjb2xvcjogJ3NpbHZlcidcblx0XHR9XG5cdH0sXG5cdGxhYmVsczoge1xuXHRcdHN0eWxlOiB7XG5cdFx0XHRjb2xvcjogJyMzRTU3NkYnXG5cdFx0fVxuXHR9XG59O1xuXG4vLyBBcHBseSB0aGUgdGhlbWVcbnZhciBoaWdoY2hhcnRzT3B0aW9ucyA9IEhpZ2hjaGFydHMuc2V0T3B0aW9ucyhIaWdoY2hhcnRzLnRoZW1lKTtcbiJdLCJmaWxlIjoicGx1Z2lucy91ZWRpdG9yL3RoaXJkLXBhcnR5L2hpZ2hjaGFydHMvdGhlbWVzL3NraWVzLmpzIn0=
