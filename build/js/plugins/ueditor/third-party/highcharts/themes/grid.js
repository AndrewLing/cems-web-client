/**
 * Grid theme for Highcharts JS
 * @author Torstein Hønsi
 */

Highcharts.theme = {
	colors: ['#058DC7', '#50B432', '#ED561B', '#DDDF00', '#24CBE5', '#64E572', '#FF9655', '#FFF263', '#6AF9C4'],
	chart: {
		backgroundColor: {
			linearGradient: { x1: 0, y1: 0, x2: 1, y2: 1 },
			stops: [
				[0, 'rgb(255, 255, 255)'],
				[1, 'rgb(240, 240, 255)']
			]
		},
		borderWidth: 2,
		plotBackgroundColor: 'rgba(255, 255, 255, .9)',
		plotShadow: true,
		plotBorderWidth: 1
	},
	title: {
		style: {
			color: '#000',
			font: 'bold 16px "Trebuchet MS", Verdana, sans-serif'
		}
	},
	subtitle: {
		style: {
			color: '#666666',
			font: 'bold 12px "Trebuchet MS", Verdana, sans-serif'
		}
	},
	xAxis: {
		gridLineWidth: 1,
		lineColor: '#000',
		tickColor: '#000',
		labels: {
			style: {
				color: '#000',
				font: '11px Trebuchet MS, Verdana, sans-serif'
			}
		},
		title: {
			style: {
				color: '#333',
				fontWeight: 'bold',
				fontSize: '12px',
				fontFamily: 'Trebuchet MS, Verdana, sans-serif'

			}
		}
	},
	yAxis: {
		minorTickInterval: 'auto',
		lineColor: '#000',
		lineWidth: 1,
		tickWidth: 1,
		tickColor: '#000',
		labels: {
			style: {
				color: '#000',
				font: '11px Trebuchet MS, Verdana, sans-serif'
			}
		},
		title: {
			style: {
				color: '#333',
				fontWeight: 'bold',
				fontSize: '12px',
				fontFamily: 'Trebuchet MS, Verdana, sans-serif'
			}
		}
	},
	legend: {
		itemStyle: {
			font: '9pt Trebuchet MS, Verdana, sans-serif',
			color: 'black'

		},
		itemHoverStyle: {
			color: '#039'
		},
		itemHiddenStyle: {
			color: 'gray'
		}
	},
	labels: {
		style: {
			color: '#99b'
		}
	},

	navigation: {
		buttonOptions: {
			theme: {
				stroke: '#CCCCCC'
			}
		}
	}
};

// Apply the theme
var highchartsOptions = Highcharts.setOptions(Highcharts.theme);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvdGhpcmQtcGFydHkvaGlnaGNoYXJ0cy90aGVtZXMvZ3JpZC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEdyaWQgdGhlbWUgZm9yIEhpZ2hjaGFydHMgSlNcbiAqIEBhdXRob3IgVG9yc3RlaW4gSMO4bnNpXG4gKi9cblxuSGlnaGNoYXJ0cy50aGVtZSA9IHtcblx0Y29sb3JzOiBbJyMwNThEQzcnLCAnIzUwQjQzMicsICcjRUQ1NjFCJywgJyNERERGMDAnLCAnIzI0Q0JFNScsICcjNjRFNTcyJywgJyNGRjk2NTUnLCAnI0ZGRjI2MycsICcjNkFGOUM0J10sXG5cdGNoYXJ0OiB7XG5cdFx0YmFja2dyb3VuZENvbG9yOiB7XG5cdFx0XHRsaW5lYXJHcmFkaWVudDogeyB4MTogMCwgeTE6IDAsIHgyOiAxLCB5MjogMSB9LFxuXHRcdFx0c3RvcHM6IFtcblx0XHRcdFx0WzAsICdyZ2IoMjU1LCAyNTUsIDI1NSknXSxcblx0XHRcdFx0WzEsICdyZ2IoMjQwLCAyNDAsIDI1NSknXVxuXHRcdFx0XVxuXHRcdH0sXG5cdFx0Ym9yZGVyV2lkdGg6IDIsXG5cdFx0cGxvdEJhY2tncm91bmRDb2xvcjogJ3JnYmEoMjU1LCAyNTUsIDI1NSwgLjkpJyxcblx0XHRwbG90U2hhZG93OiB0cnVlLFxuXHRcdHBsb3RCb3JkZXJXaWR0aDogMVxuXHR9LFxuXHR0aXRsZToge1xuXHRcdHN0eWxlOiB7XG5cdFx0XHRjb2xvcjogJyMwMDAnLFxuXHRcdFx0Zm9udDogJ2JvbGQgMTZweCBcIlRyZWJ1Y2hldCBNU1wiLCBWZXJkYW5hLCBzYW5zLXNlcmlmJ1xuXHRcdH1cblx0fSxcblx0c3VidGl0bGU6IHtcblx0XHRzdHlsZToge1xuXHRcdFx0Y29sb3I6ICcjNjY2NjY2Jyxcblx0XHRcdGZvbnQ6ICdib2xkIDEycHggXCJUcmVidWNoZXQgTVNcIiwgVmVyZGFuYSwgc2Fucy1zZXJpZidcblx0XHR9XG5cdH0sXG5cdHhBeGlzOiB7XG5cdFx0Z3JpZExpbmVXaWR0aDogMSxcblx0XHRsaW5lQ29sb3I6ICcjMDAwJyxcblx0XHR0aWNrQ29sb3I6ICcjMDAwJyxcblx0XHRsYWJlbHM6IHtcblx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdGNvbG9yOiAnIzAwMCcsXG5cdFx0XHRcdGZvbnQ6ICcxMXB4IFRyZWJ1Y2hldCBNUywgVmVyZGFuYSwgc2Fucy1zZXJpZidcblx0XHRcdH1cblx0XHR9LFxuXHRcdHRpdGxlOiB7XG5cdFx0XHRzdHlsZToge1xuXHRcdFx0XHRjb2xvcjogJyMzMzMnLFxuXHRcdFx0XHRmb250V2VpZ2h0OiAnYm9sZCcsXG5cdFx0XHRcdGZvbnRTaXplOiAnMTJweCcsXG5cdFx0XHRcdGZvbnRGYW1pbHk6ICdUcmVidWNoZXQgTVMsIFZlcmRhbmEsIHNhbnMtc2VyaWYnXG5cblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cdHlBeGlzOiB7XG5cdFx0bWlub3JUaWNrSW50ZXJ2YWw6ICdhdXRvJyxcblx0XHRsaW5lQ29sb3I6ICcjMDAwJyxcblx0XHRsaW5lV2lkdGg6IDEsXG5cdFx0dGlja1dpZHRoOiAxLFxuXHRcdHRpY2tDb2xvcjogJyMwMDAnLFxuXHRcdGxhYmVsczoge1xuXHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0Y29sb3I6ICcjMDAwJyxcblx0XHRcdFx0Zm9udDogJzExcHggVHJlYnVjaGV0IE1TLCBWZXJkYW5hLCBzYW5zLXNlcmlmJ1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0dGl0bGU6IHtcblx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdGNvbG9yOiAnIzMzMycsXG5cdFx0XHRcdGZvbnRXZWlnaHQ6ICdib2xkJyxcblx0XHRcdFx0Zm9udFNpemU6ICcxMnB4Jyxcblx0XHRcdFx0Zm9udEZhbWlseTogJ1RyZWJ1Y2hldCBNUywgVmVyZGFuYSwgc2Fucy1zZXJpZidcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cdGxlZ2VuZDoge1xuXHRcdGl0ZW1TdHlsZToge1xuXHRcdFx0Zm9udDogJzlwdCBUcmVidWNoZXQgTVMsIFZlcmRhbmEsIHNhbnMtc2VyaWYnLFxuXHRcdFx0Y29sb3I6ICdibGFjaydcblxuXHRcdH0sXG5cdFx0aXRlbUhvdmVyU3R5bGU6IHtcblx0XHRcdGNvbG9yOiAnIzAzOSdcblx0XHR9LFxuXHRcdGl0ZW1IaWRkZW5TdHlsZToge1xuXHRcdFx0Y29sb3I6ICdncmF5J1xuXHRcdH1cblx0fSxcblx0bGFiZWxzOiB7XG5cdFx0c3R5bGU6IHtcblx0XHRcdGNvbG9yOiAnIzk5Yidcblx0XHR9XG5cdH0sXG5cblx0bmF2aWdhdGlvbjoge1xuXHRcdGJ1dHRvbk9wdGlvbnM6IHtcblx0XHRcdHRoZW1lOiB7XG5cdFx0XHRcdHN0cm9rZTogJyNDQ0NDQ0MnXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59O1xuXG4vLyBBcHBseSB0aGUgdGhlbWVcbnZhciBoaWdoY2hhcnRzT3B0aW9ucyA9IEhpZ2hjaGFydHMuc2V0T3B0aW9ucyhIaWdoY2hhcnRzLnRoZW1lKTtcbiJdLCJmaWxlIjoicGx1Z2lucy91ZWRpdG9yL3RoaXJkLXBhcnR5L2hpZ2hjaGFydHMvdGhlbWVzL2dyaWQuanMifQ==
