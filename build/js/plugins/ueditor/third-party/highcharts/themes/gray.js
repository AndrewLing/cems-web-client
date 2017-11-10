/**
 * Gray theme for Highcharts JS
 * @author Torstein Hønsi
 */

Highcharts.theme = {
	colors: ["#DDDF0D", "#7798BF", "#55BF3B", "#DF5353", "#aaeeee", "#ff0066", "#eeaaee",
		"#55BF3B", "#DF5353", "#7798BF", "#aaeeee"],
	chart: {
		backgroundColor: {
			linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
			stops: [
				[0, 'rgb(96, 96, 96)'],
				[1, 'rgb(16, 16, 16)']
			]
		},
		borderWidth: 0,
		borderRadius: 15,
		plotBackgroundColor: null,
		plotShadow: false,
		plotBorderWidth: 0
	},
	title: {
		style: {
			color: '#FFF',
			font: '16px Lucida Grande, Lucida Sans Unicode, Verdana, Arial, Helvetica, sans-serif'
		}
	},
	subtitle: {
		style: {
			color: '#DDD',
			font: '12px Lucida Grande, Lucida Sans Unicode, Verdana, Arial, Helvetica, sans-serif'
		}
	},
	xAxis: {
		gridLineWidth: 0,
		lineColor: '#999',
		tickColor: '#999',
		labels: {
			style: {
				color: '#999',
				fontWeight: 'bold'
			}
		},
		title: {
			style: {
				color: '#AAA',
				font: 'bold 12px Lucida Grande, Lucida Sans Unicode, Verdana, Arial, Helvetica, sans-serif'
			}
		}
	},
	yAxis: {
		alternateGridColor: null,
		minorTickInterval: null,
		gridLineColor: 'rgba(255, 255, 255, .1)',
		minorGridLineColor: 'rgba(255,255,255,0.07)',
		lineWidth: 0,
		tickWidth: 0,
		labels: {
			style: {
				color: '#999',
				fontWeight: 'bold'
			}
		},
		title: {
			style: {
				color: '#AAA',
				font: 'bold 12px Lucida Grande, Lucida Sans Unicode, Verdana, Arial, Helvetica, sans-serif'
			}
		}
	},
	legend: {
		itemStyle: {
			color: '#CCC'
		},
		itemHoverStyle: {
			color: '#FFF'
		},
		itemHiddenStyle: {
			color: '#333'
		}
	},
	labels: {
		style: {
			color: '#CCC'
		}
	},
	tooltip: {
		backgroundColor: {
			linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
			stops: [
				[0, 'rgba(96, 96, 96, .8)'],
				[1, 'rgba(16, 16, 16, .8)']
			]
		},
		borderWidth: 0,
		style: {
			color: '#FFF'
		}
	},


	plotOptions: {
		series: {
			shadow: true
		},
		line: {
			dataLabels: {
				color: '#CCC'
			},
			marker: {
				lineColor: '#333'
			}
		},
		spline: {
			marker: {
				lineColor: '#333'
			}
		},
		scatter: {
			marker: {
				lineColor: '#333'
			}
		},
		candlestick: {
			lineColor: 'white'
		}
	},

	toolbar: {
		itemStyle: {
			color: '#CCC'
		}
	},

	navigation: {
		buttonOptions: {
			symbolStroke: '#DDDDDD',
			hoverSymbolStroke: '#FFFFFF',
			theme: {
				fill: {
					linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
					stops: [
						[0.4, '#606060'],
						[0.6, '#333333']
					]
				},
				stroke: '#000000'
			}
		}
	},

	// scroll charts
	rangeSelector: {
		buttonTheme: {
			fill: {
				linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
				stops: [
					[0.4, '#888'],
					[0.6, '#555']
				]
			},
			stroke: '#000000',
			style: {
				color: '#CCC',
				fontWeight: 'bold'
			},
			states: {
				hover: {
					fill: {
						linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
						stops: [
							[0.4, '#BBB'],
							[0.6, '#888']
						]
					},
					stroke: '#000000',
					style: {
						color: 'white'
					}
				},
				select: {
					fill: {
						linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
						stops: [
							[0.1, '#000'],
							[0.3, '#333']
						]
					},
					stroke: '#000000',
					style: {
						color: 'yellow'
					}
				}
			}
		},
		inputStyle: {
			backgroundColor: '#333',
			color: 'silver'
		},
		labelStyle: {
			color: 'silver'
		}
	},

	navigator: {
		handles: {
			backgroundColor: '#666',
			borderColor: '#AAA'
		},
		outlineColor: '#CCC',
		maskFill: 'rgba(16, 16, 16, 0.5)',
		series: {
			color: '#7798BF',
			lineColor: '#A6C7ED'
		}
	},

	scrollbar: {
		barBackgroundColor: {
				linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
				stops: [
					[0.4, '#888'],
					[0.6, '#555']
				]
			},
		barBorderColor: '#CCC',
		buttonArrowColor: '#CCC',
		buttonBackgroundColor: {
				linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
				stops: [
					[0.4, '#888'],
					[0.6, '#555']
				]
			},
		buttonBorderColor: '#CCC',
		rifleColor: '#FFF',
		trackBackgroundColor: {
			linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
			stops: [
				[0, '#000'],
				[1, '#333']
			]
		},
		trackBorderColor: '#666'
	},

	// special colors for some of the demo examples
	legendBackgroundColor: 'rgba(48, 48, 48, 0.8)',
	legendBackgroundColorSolid: 'rgb(70, 70, 70)',
	dataLabelsColor: '#444',
	textColor: '#E0E0E0',
	maskColor: 'rgba(255,255,255,0.3)'
};

// Apply the theme
var highchartsOptions = Highcharts.setOptions(Highcharts.theme);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvdGhpcmQtcGFydHkvaGlnaGNoYXJ0cy90aGVtZXMvZ3JheS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEdyYXkgdGhlbWUgZm9yIEhpZ2hjaGFydHMgSlNcbiAqIEBhdXRob3IgVG9yc3RlaW4gSMO4bnNpXG4gKi9cblxuSGlnaGNoYXJ0cy50aGVtZSA9IHtcblx0Y29sb3JzOiBbXCIjRERERjBEXCIsIFwiIzc3OThCRlwiLCBcIiM1NUJGM0JcIiwgXCIjREY1MzUzXCIsIFwiI2FhZWVlZVwiLCBcIiNmZjAwNjZcIiwgXCIjZWVhYWVlXCIsXG5cdFx0XCIjNTVCRjNCXCIsIFwiI0RGNTM1M1wiLCBcIiM3Nzk4QkZcIiwgXCIjYWFlZWVlXCJdLFxuXHRjaGFydDoge1xuXHRcdGJhY2tncm91bmRDb2xvcjoge1xuXHRcdFx0bGluZWFyR3JhZGllbnQ6IHsgeDE6IDAsIHkxOiAwLCB4MjogMCwgeTI6IDEgfSxcblx0XHRcdHN0b3BzOiBbXG5cdFx0XHRcdFswLCAncmdiKDk2LCA5NiwgOTYpJ10sXG5cdFx0XHRcdFsxLCAncmdiKDE2LCAxNiwgMTYpJ11cblx0XHRcdF1cblx0XHR9LFxuXHRcdGJvcmRlcldpZHRoOiAwLFxuXHRcdGJvcmRlclJhZGl1czogMTUsXG5cdFx0cGxvdEJhY2tncm91bmRDb2xvcjogbnVsbCxcblx0XHRwbG90U2hhZG93OiBmYWxzZSxcblx0XHRwbG90Qm9yZGVyV2lkdGg6IDBcblx0fSxcblx0dGl0bGU6IHtcblx0XHRzdHlsZToge1xuXHRcdFx0Y29sb3I6ICcjRkZGJyxcblx0XHRcdGZvbnQ6ICcxNnB4IEx1Y2lkYSBHcmFuZGUsIEx1Y2lkYSBTYW5zIFVuaWNvZGUsIFZlcmRhbmEsIEFyaWFsLCBIZWx2ZXRpY2EsIHNhbnMtc2VyaWYnXG5cdFx0fVxuXHR9LFxuXHRzdWJ0aXRsZToge1xuXHRcdHN0eWxlOiB7XG5cdFx0XHRjb2xvcjogJyNEREQnLFxuXHRcdFx0Zm9udDogJzEycHggTHVjaWRhIEdyYW5kZSwgTHVjaWRhIFNhbnMgVW5pY29kZSwgVmVyZGFuYSwgQXJpYWwsIEhlbHZldGljYSwgc2Fucy1zZXJpZidcblx0XHR9XG5cdH0sXG5cdHhBeGlzOiB7XG5cdFx0Z3JpZExpbmVXaWR0aDogMCxcblx0XHRsaW5lQ29sb3I6ICcjOTk5Jyxcblx0XHR0aWNrQ29sb3I6ICcjOTk5Jyxcblx0XHRsYWJlbHM6IHtcblx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdGNvbG9yOiAnIzk5OScsXG5cdFx0XHRcdGZvbnRXZWlnaHQ6ICdib2xkJ1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0dGl0bGU6IHtcblx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdGNvbG9yOiAnI0FBQScsXG5cdFx0XHRcdGZvbnQ6ICdib2xkIDEycHggTHVjaWRhIEdyYW5kZSwgTHVjaWRhIFNhbnMgVW5pY29kZSwgVmVyZGFuYSwgQXJpYWwsIEhlbHZldGljYSwgc2Fucy1zZXJpZidcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cdHlBeGlzOiB7XG5cdFx0YWx0ZXJuYXRlR3JpZENvbG9yOiBudWxsLFxuXHRcdG1pbm9yVGlja0ludGVydmFsOiBudWxsLFxuXHRcdGdyaWRMaW5lQ29sb3I6ICdyZ2JhKDI1NSwgMjU1LCAyNTUsIC4xKScsXG5cdFx0bWlub3JHcmlkTGluZUNvbG9yOiAncmdiYSgyNTUsMjU1LDI1NSwwLjA3KScsXG5cdFx0bGluZVdpZHRoOiAwLFxuXHRcdHRpY2tXaWR0aDogMCxcblx0XHRsYWJlbHM6IHtcblx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdGNvbG9yOiAnIzk5OScsXG5cdFx0XHRcdGZvbnRXZWlnaHQ6ICdib2xkJ1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0dGl0bGU6IHtcblx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdGNvbG9yOiAnI0FBQScsXG5cdFx0XHRcdGZvbnQ6ICdib2xkIDEycHggTHVjaWRhIEdyYW5kZSwgTHVjaWRhIFNhbnMgVW5pY29kZSwgVmVyZGFuYSwgQXJpYWwsIEhlbHZldGljYSwgc2Fucy1zZXJpZidcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cdGxlZ2VuZDoge1xuXHRcdGl0ZW1TdHlsZToge1xuXHRcdFx0Y29sb3I6ICcjQ0NDJ1xuXHRcdH0sXG5cdFx0aXRlbUhvdmVyU3R5bGU6IHtcblx0XHRcdGNvbG9yOiAnI0ZGRidcblx0XHR9LFxuXHRcdGl0ZW1IaWRkZW5TdHlsZToge1xuXHRcdFx0Y29sb3I6ICcjMzMzJ1xuXHRcdH1cblx0fSxcblx0bGFiZWxzOiB7XG5cdFx0c3R5bGU6IHtcblx0XHRcdGNvbG9yOiAnI0NDQydcblx0XHR9XG5cdH0sXG5cdHRvb2x0aXA6IHtcblx0XHRiYWNrZ3JvdW5kQ29sb3I6IHtcblx0XHRcdGxpbmVhckdyYWRpZW50OiB7IHgxOiAwLCB5MTogMCwgeDI6IDAsIHkyOiAxIH0sXG5cdFx0XHRzdG9wczogW1xuXHRcdFx0XHRbMCwgJ3JnYmEoOTYsIDk2LCA5NiwgLjgpJ10sXG5cdFx0XHRcdFsxLCAncmdiYSgxNiwgMTYsIDE2LCAuOCknXVxuXHRcdFx0XVxuXHRcdH0sXG5cdFx0Ym9yZGVyV2lkdGg6IDAsXG5cdFx0c3R5bGU6IHtcblx0XHRcdGNvbG9yOiAnI0ZGRidcblx0XHR9XG5cdH0sXG5cblxuXHRwbG90T3B0aW9uczoge1xuXHRcdHNlcmllczoge1xuXHRcdFx0c2hhZG93OiB0cnVlXG5cdFx0fSxcblx0XHRsaW5lOiB7XG5cdFx0XHRkYXRhTGFiZWxzOiB7XG5cdFx0XHRcdGNvbG9yOiAnI0NDQydcblx0XHRcdH0sXG5cdFx0XHRtYXJrZXI6IHtcblx0XHRcdFx0bGluZUNvbG9yOiAnIzMzMydcblx0XHRcdH1cblx0XHR9LFxuXHRcdHNwbGluZToge1xuXHRcdFx0bWFya2VyOiB7XG5cdFx0XHRcdGxpbmVDb2xvcjogJyMzMzMnXG5cdFx0XHR9XG5cdFx0fSxcblx0XHRzY2F0dGVyOiB7XG5cdFx0XHRtYXJrZXI6IHtcblx0XHRcdFx0bGluZUNvbG9yOiAnIzMzMydcblx0XHRcdH1cblx0XHR9LFxuXHRcdGNhbmRsZXN0aWNrOiB7XG5cdFx0XHRsaW5lQ29sb3I6ICd3aGl0ZSdcblx0XHR9XG5cdH0sXG5cblx0dG9vbGJhcjoge1xuXHRcdGl0ZW1TdHlsZToge1xuXHRcdFx0Y29sb3I6ICcjQ0NDJ1xuXHRcdH1cblx0fSxcblxuXHRuYXZpZ2F0aW9uOiB7XG5cdFx0YnV0dG9uT3B0aW9uczoge1xuXHRcdFx0c3ltYm9sU3Ryb2tlOiAnI0RERERERCcsXG5cdFx0XHRob3ZlclN5bWJvbFN0cm9rZTogJyNGRkZGRkYnLFxuXHRcdFx0dGhlbWU6IHtcblx0XHRcdFx0ZmlsbDoge1xuXHRcdFx0XHRcdGxpbmVhckdyYWRpZW50OiB7IHgxOiAwLCB5MTogMCwgeDI6IDAsIHkyOiAxIH0sXG5cdFx0XHRcdFx0c3RvcHM6IFtcblx0XHRcdFx0XHRcdFswLjQsICcjNjA2MDYwJ10sXG5cdFx0XHRcdFx0XHRbMC42LCAnIzMzMzMzMyddXG5cdFx0XHRcdFx0XVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRzdHJva2U6ICcjMDAwMDAwJ1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXHQvLyBzY3JvbGwgY2hhcnRzXG5cdHJhbmdlU2VsZWN0b3I6IHtcblx0XHRidXR0b25UaGVtZToge1xuXHRcdFx0ZmlsbDoge1xuXHRcdFx0XHRsaW5lYXJHcmFkaWVudDogeyB4MTogMCwgeTE6IDAsIHgyOiAwLCB5MjogMSB9LFxuXHRcdFx0XHRzdG9wczogW1xuXHRcdFx0XHRcdFswLjQsICcjODg4J10sXG5cdFx0XHRcdFx0WzAuNiwgJyM1NTUnXVxuXHRcdFx0XHRdXG5cdFx0XHR9LFxuXHRcdFx0c3Ryb2tlOiAnIzAwMDAwMCcsXG5cdFx0XHRzdHlsZToge1xuXHRcdFx0XHRjb2xvcjogJyNDQ0MnLFxuXHRcdFx0XHRmb250V2VpZ2h0OiAnYm9sZCdcblx0XHRcdH0sXG5cdFx0XHRzdGF0ZXM6IHtcblx0XHRcdFx0aG92ZXI6IHtcblx0XHRcdFx0XHRmaWxsOiB7XG5cdFx0XHRcdFx0XHRsaW5lYXJHcmFkaWVudDogeyB4MTogMCwgeTE6IDAsIHgyOiAwLCB5MjogMSB9LFxuXHRcdFx0XHRcdFx0c3RvcHM6IFtcblx0XHRcdFx0XHRcdFx0WzAuNCwgJyNCQkInXSxcblx0XHRcdFx0XHRcdFx0WzAuNiwgJyM4ODgnXVxuXHRcdFx0XHRcdFx0XVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0c3Ryb2tlOiAnIzAwMDAwMCcsXG5cdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdGNvbG9yOiAnd2hpdGUnXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRzZWxlY3Q6IHtcblx0XHRcdFx0XHRmaWxsOiB7XG5cdFx0XHRcdFx0XHRsaW5lYXJHcmFkaWVudDogeyB4MTogMCwgeTE6IDAsIHgyOiAwLCB5MjogMSB9LFxuXHRcdFx0XHRcdFx0c3RvcHM6IFtcblx0XHRcdFx0XHRcdFx0WzAuMSwgJyMwMDAnXSxcblx0XHRcdFx0XHRcdFx0WzAuMywgJyMzMzMnXVxuXHRcdFx0XHRcdFx0XVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0c3Ryb2tlOiAnIzAwMDAwMCcsXG5cdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdGNvbG9yOiAneWVsbG93J1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0aW5wdXRTdHlsZToge1xuXHRcdFx0YmFja2dyb3VuZENvbG9yOiAnIzMzMycsXG5cdFx0XHRjb2xvcjogJ3NpbHZlcidcblx0XHR9LFxuXHRcdGxhYmVsU3R5bGU6IHtcblx0XHRcdGNvbG9yOiAnc2lsdmVyJ1xuXHRcdH1cblx0fSxcblxuXHRuYXZpZ2F0b3I6IHtcblx0XHRoYW5kbGVzOiB7XG5cdFx0XHRiYWNrZ3JvdW5kQ29sb3I6ICcjNjY2Jyxcblx0XHRcdGJvcmRlckNvbG9yOiAnI0FBQSdcblx0XHR9LFxuXHRcdG91dGxpbmVDb2xvcjogJyNDQ0MnLFxuXHRcdG1hc2tGaWxsOiAncmdiYSgxNiwgMTYsIDE2LCAwLjUpJyxcblx0XHRzZXJpZXM6IHtcblx0XHRcdGNvbG9yOiAnIzc3OThCRicsXG5cdFx0XHRsaW5lQ29sb3I6ICcjQTZDN0VEJ1xuXHRcdH1cblx0fSxcblxuXHRzY3JvbGxiYXI6IHtcblx0XHRiYXJCYWNrZ3JvdW5kQ29sb3I6IHtcblx0XHRcdFx0bGluZWFyR3JhZGllbnQ6IHsgeDE6IDAsIHkxOiAwLCB4MjogMCwgeTI6IDEgfSxcblx0XHRcdFx0c3RvcHM6IFtcblx0XHRcdFx0XHRbMC40LCAnIzg4OCddLFxuXHRcdFx0XHRcdFswLjYsICcjNTU1J11cblx0XHRcdFx0XVxuXHRcdFx0fSxcblx0XHRiYXJCb3JkZXJDb2xvcjogJyNDQ0MnLFxuXHRcdGJ1dHRvbkFycm93Q29sb3I6ICcjQ0NDJyxcblx0XHRidXR0b25CYWNrZ3JvdW5kQ29sb3I6IHtcblx0XHRcdFx0bGluZWFyR3JhZGllbnQ6IHsgeDE6IDAsIHkxOiAwLCB4MjogMCwgeTI6IDEgfSxcblx0XHRcdFx0c3RvcHM6IFtcblx0XHRcdFx0XHRbMC40LCAnIzg4OCddLFxuXHRcdFx0XHRcdFswLjYsICcjNTU1J11cblx0XHRcdFx0XVxuXHRcdFx0fSxcblx0XHRidXR0b25Cb3JkZXJDb2xvcjogJyNDQ0MnLFxuXHRcdHJpZmxlQ29sb3I6ICcjRkZGJyxcblx0XHR0cmFja0JhY2tncm91bmRDb2xvcjoge1xuXHRcdFx0bGluZWFyR3JhZGllbnQ6IHsgeDE6IDAsIHkxOiAwLCB4MjogMCwgeTI6IDEgfSxcblx0XHRcdHN0b3BzOiBbXG5cdFx0XHRcdFswLCAnIzAwMCddLFxuXHRcdFx0XHRbMSwgJyMzMzMnXVxuXHRcdFx0XVxuXHRcdH0sXG5cdFx0dHJhY2tCb3JkZXJDb2xvcjogJyM2NjYnXG5cdH0sXG5cblx0Ly8gc3BlY2lhbCBjb2xvcnMgZm9yIHNvbWUgb2YgdGhlIGRlbW8gZXhhbXBsZXNcblx0bGVnZW5kQmFja2dyb3VuZENvbG9yOiAncmdiYSg0OCwgNDgsIDQ4LCAwLjgpJyxcblx0bGVnZW5kQmFja2dyb3VuZENvbG9yU29saWQ6ICdyZ2IoNzAsIDcwLCA3MCknLFxuXHRkYXRhTGFiZWxzQ29sb3I6ICcjNDQ0Jyxcblx0dGV4dENvbG9yOiAnI0UwRTBFMCcsXG5cdG1hc2tDb2xvcjogJ3JnYmEoMjU1LDI1NSwyNTUsMC4zKSdcbn07XG5cbi8vIEFwcGx5IHRoZSB0aGVtZVxudmFyIGhpZ2hjaGFydHNPcHRpb25zID0gSGlnaGNoYXJ0cy5zZXRPcHRpb25zKEhpZ2hjaGFydHMudGhlbWUpO1xuIl0sImZpbGUiOiJwbHVnaW5zL3VlZGl0b3IvdGhpcmQtcGFydHkvaGlnaGNoYXJ0cy90aGVtZXMvZ3JheS5qcyJ9
