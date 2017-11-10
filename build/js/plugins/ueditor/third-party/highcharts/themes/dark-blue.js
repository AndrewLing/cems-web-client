/**
 * Dark blue theme for Highcharts JS
 * @author Torstein Hønsi
 */

Highcharts.theme = {
	colors: ["#DDDF0D", "#55BF3B", "#DF5353", "#7798BF", "#aaeeee", "#ff0066", "#eeaaee",
		"#55BF3B", "#DF5353", "#7798BF", "#aaeeee"],
	chart: {
		backgroundColor: {
			linearGradient: { x1: 0, y1: 0, x2: 1, y2: 1 },
			stops: [
				[0, 'rgb(48, 48, 96)'],
				[1, 'rgb(0, 0, 0)']
			]
		},
		borderColor: '#000000',
		borderWidth: 2,
		className: 'dark-container',
		plotBackgroundColor: 'rgba(255, 255, 255, .1)',
		plotBorderColor: '#CCCCCC',
		plotBorderWidth: 1
	},
	title: {
		style: {
			color: '#C0C0C0',
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
		gridLineColor: '#333333',
		gridLineWidth: 1,
		labels: {
			style: {
				color: '#A0A0A0'
			}
		},
		lineColor: '#A0A0A0',
		tickColor: '#A0A0A0',
		title: {
			style: {
				color: '#CCC',
				fontWeight: 'bold',
				fontSize: '12px',
				fontFamily: 'Trebuchet MS, Verdana, sans-serif'

			}
		}
	},
	yAxis: {
		gridLineColor: '#333333',
		labels: {
			style: {
				color: '#A0A0A0'
			}
		},
		lineColor: '#A0A0A0',
		minorTickInterval: null,
		tickColor: '#A0A0A0',
		tickWidth: 1,
		title: {
			style: {
				color: '#CCC',
				fontWeight: 'bold',
				fontSize: '12px',
				fontFamily: 'Trebuchet MS, Verdana, sans-serif'
			}
		}
	},
	tooltip: {
		backgroundColor: 'rgba(0, 0, 0, 0.75)',
		style: {
			color: '#F0F0F0'
		}
	},
	toolbar: {
		itemStyle: {
			color: 'silver'
		}
	},
	plotOptions: {
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
	legend: {
		itemStyle: {
			font: '9pt Trebuchet MS, Verdana, sans-serif',
			color: '#A0A0A0'
		},
		itemHoverStyle: {
			color: '#FFF'
		},
		itemHiddenStyle: {
			color: '#444'
		}
	},
	credits: {
		style: {
			color: '#666'
		}
	},
	labels: {
		style: {
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

	// special colors for some of the
	legendBackgroundColor: 'rgba(0, 0, 0, 0.5)',
	legendBackgroundColorSolid: 'rgb(35, 35, 70)',
	dataLabelsColor: '#444',
	textColor: '#C0C0C0',
	maskColor: 'rgba(255,255,255,0.3)'
};

// Apply the theme
var highchartsOptions = Highcharts.setOptions(Highcharts.theme);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvdGhpcmQtcGFydHkvaGlnaGNoYXJ0cy90aGVtZXMvZGFyay1ibHVlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogRGFyayBibHVlIHRoZW1lIGZvciBIaWdoY2hhcnRzIEpTXG4gKiBAYXV0aG9yIFRvcnN0ZWluIEjDuG5zaVxuICovXG5cbkhpZ2hjaGFydHMudGhlbWUgPSB7XG5cdGNvbG9yczogW1wiI0REREYwRFwiLCBcIiM1NUJGM0JcIiwgXCIjREY1MzUzXCIsIFwiIzc3OThCRlwiLCBcIiNhYWVlZWVcIiwgXCIjZmYwMDY2XCIsIFwiI2VlYWFlZVwiLFxuXHRcdFwiIzU1QkYzQlwiLCBcIiNERjUzNTNcIiwgXCIjNzc5OEJGXCIsIFwiI2FhZWVlZVwiXSxcblx0Y2hhcnQ6IHtcblx0XHRiYWNrZ3JvdW5kQ29sb3I6IHtcblx0XHRcdGxpbmVhckdyYWRpZW50OiB7IHgxOiAwLCB5MTogMCwgeDI6IDEsIHkyOiAxIH0sXG5cdFx0XHRzdG9wczogW1xuXHRcdFx0XHRbMCwgJ3JnYig0OCwgNDgsIDk2KSddLFxuXHRcdFx0XHRbMSwgJ3JnYigwLCAwLCAwKSddXG5cdFx0XHRdXG5cdFx0fSxcblx0XHRib3JkZXJDb2xvcjogJyMwMDAwMDAnLFxuXHRcdGJvcmRlcldpZHRoOiAyLFxuXHRcdGNsYXNzTmFtZTogJ2RhcmstY29udGFpbmVyJyxcblx0XHRwbG90QmFja2dyb3VuZENvbG9yOiAncmdiYSgyNTUsIDI1NSwgMjU1LCAuMSknLFxuXHRcdHBsb3RCb3JkZXJDb2xvcjogJyNDQ0NDQ0MnLFxuXHRcdHBsb3RCb3JkZXJXaWR0aDogMVxuXHR9LFxuXHR0aXRsZToge1xuXHRcdHN0eWxlOiB7XG5cdFx0XHRjb2xvcjogJyNDMEMwQzAnLFxuXHRcdFx0Zm9udDogJ2JvbGQgMTZweCBcIlRyZWJ1Y2hldCBNU1wiLCBWZXJkYW5hLCBzYW5zLXNlcmlmJ1xuXHRcdH1cblx0fSxcblx0c3VidGl0bGU6IHtcblx0XHRzdHlsZToge1xuXHRcdFx0Y29sb3I6ICcjNjY2NjY2Jyxcblx0XHRcdGZvbnQ6ICdib2xkIDEycHggXCJUcmVidWNoZXQgTVNcIiwgVmVyZGFuYSwgc2Fucy1zZXJpZidcblx0XHR9XG5cdH0sXG5cdHhBeGlzOiB7XG5cdFx0Z3JpZExpbmVDb2xvcjogJyMzMzMzMzMnLFxuXHRcdGdyaWRMaW5lV2lkdGg6IDEsXG5cdFx0bGFiZWxzOiB7XG5cdFx0XHRzdHlsZToge1xuXHRcdFx0XHRjb2xvcjogJyNBMEEwQTAnXG5cdFx0XHR9XG5cdFx0fSxcblx0XHRsaW5lQ29sb3I6ICcjQTBBMEEwJyxcblx0XHR0aWNrQ29sb3I6ICcjQTBBMEEwJyxcblx0XHR0aXRsZToge1xuXHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0Y29sb3I6ICcjQ0NDJyxcblx0XHRcdFx0Zm9udFdlaWdodDogJ2JvbGQnLFxuXHRcdFx0XHRmb250U2l6ZTogJzEycHgnLFxuXHRcdFx0XHRmb250RmFtaWx5OiAnVHJlYnVjaGV0IE1TLCBWZXJkYW5hLCBzYW5zLXNlcmlmJ1xuXG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXHR5QXhpczoge1xuXHRcdGdyaWRMaW5lQ29sb3I6ICcjMzMzMzMzJyxcblx0XHRsYWJlbHM6IHtcblx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdGNvbG9yOiAnI0EwQTBBMCdcblx0XHRcdH1cblx0XHR9LFxuXHRcdGxpbmVDb2xvcjogJyNBMEEwQTAnLFxuXHRcdG1pbm9yVGlja0ludGVydmFsOiBudWxsLFxuXHRcdHRpY2tDb2xvcjogJyNBMEEwQTAnLFxuXHRcdHRpY2tXaWR0aDogMSxcblx0XHR0aXRsZToge1xuXHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0Y29sb3I6ICcjQ0NDJyxcblx0XHRcdFx0Zm9udFdlaWdodDogJ2JvbGQnLFxuXHRcdFx0XHRmb250U2l6ZTogJzEycHgnLFxuXHRcdFx0XHRmb250RmFtaWx5OiAnVHJlYnVjaGV0IE1TLCBWZXJkYW5hLCBzYW5zLXNlcmlmJ1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblx0dG9vbHRpcDoge1xuXHRcdGJhY2tncm91bmRDb2xvcjogJ3JnYmEoMCwgMCwgMCwgMC43NSknLFxuXHRcdHN0eWxlOiB7XG5cdFx0XHRjb2xvcjogJyNGMEYwRjAnXG5cdFx0fVxuXHR9LFxuXHR0b29sYmFyOiB7XG5cdFx0aXRlbVN0eWxlOiB7XG5cdFx0XHRjb2xvcjogJ3NpbHZlcidcblx0XHR9XG5cdH0sXG5cdHBsb3RPcHRpb25zOiB7XG5cdFx0bGluZToge1xuXHRcdFx0ZGF0YUxhYmVsczoge1xuXHRcdFx0XHRjb2xvcjogJyNDQ0MnXG5cdFx0XHR9LFxuXHRcdFx0bWFya2VyOiB7XG5cdFx0XHRcdGxpbmVDb2xvcjogJyMzMzMnXG5cdFx0XHR9XG5cdFx0fSxcblx0XHRzcGxpbmU6IHtcblx0XHRcdG1hcmtlcjoge1xuXHRcdFx0XHRsaW5lQ29sb3I6ICcjMzMzJ1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0c2NhdHRlcjoge1xuXHRcdFx0bWFya2VyOiB7XG5cdFx0XHRcdGxpbmVDb2xvcjogJyMzMzMnXG5cdFx0XHR9XG5cdFx0fSxcblx0XHRjYW5kbGVzdGljazoge1xuXHRcdFx0bGluZUNvbG9yOiAnd2hpdGUnXG5cdFx0fVxuXHR9LFxuXHRsZWdlbmQ6IHtcblx0XHRpdGVtU3R5bGU6IHtcblx0XHRcdGZvbnQ6ICc5cHQgVHJlYnVjaGV0IE1TLCBWZXJkYW5hLCBzYW5zLXNlcmlmJyxcblx0XHRcdGNvbG9yOiAnI0EwQTBBMCdcblx0XHR9LFxuXHRcdGl0ZW1Ib3ZlclN0eWxlOiB7XG5cdFx0XHRjb2xvcjogJyNGRkYnXG5cdFx0fSxcblx0XHRpdGVtSGlkZGVuU3R5bGU6IHtcblx0XHRcdGNvbG9yOiAnIzQ0NCdcblx0XHR9XG5cdH0sXG5cdGNyZWRpdHM6IHtcblx0XHRzdHlsZToge1xuXHRcdFx0Y29sb3I6ICcjNjY2J1xuXHRcdH1cblx0fSxcblx0bGFiZWxzOiB7XG5cdFx0c3R5bGU6IHtcblx0XHRcdGNvbG9yOiAnI0NDQydcblx0XHR9XG5cdH0sXG5cblx0bmF2aWdhdGlvbjoge1xuXHRcdGJ1dHRvbk9wdGlvbnM6IHtcblx0XHRcdHN5bWJvbFN0cm9rZTogJyNEREREREQnLFxuXHRcdFx0aG92ZXJTeW1ib2xTdHJva2U6ICcjRkZGRkZGJyxcblx0XHRcdHRoZW1lOiB7XG5cdFx0XHRcdGZpbGw6IHtcblx0XHRcdFx0XHRsaW5lYXJHcmFkaWVudDogeyB4MTogMCwgeTE6IDAsIHgyOiAwLCB5MjogMSB9LFxuXHRcdFx0XHRcdHN0b3BzOiBbXG5cdFx0XHRcdFx0XHRbMC40LCAnIzYwNjA2MCddLFxuXHRcdFx0XHRcdFx0WzAuNiwgJyMzMzMzMzMnXVxuXHRcdFx0XHRcdF1cblx0XHRcdFx0fSxcblx0XHRcdFx0c3Ryb2tlOiAnIzAwMDAwMCdcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblx0Ly8gc2Nyb2xsIGNoYXJ0c1xuXHRyYW5nZVNlbGVjdG9yOiB7XG5cdFx0YnV0dG9uVGhlbWU6IHtcblx0XHRcdGZpbGw6IHtcblx0XHRcdFx0bGluZWFyR3JhZGllbnQ6IHsgeDE6IDAsIHkxOiAwLCB4MjogMCwgeTI6IDEgfSxcblx0XHRcdFx0c3RvcHM6IFtcblx0XHRcdFx0XHRbMC40LCAnIzg4OCddLFxuXHRcdFx0XHRcdFswLjYsICcjNTU1J11cblx0XHRcdFx0XVxuXHRcdFx0fSxcblx0XHRcdHN0cm9rZTogJyMwMDAwMDAnLFxuXHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0Y29sb3I6ICcjQ0NDJyxcblx0XHRcdFx0Zm9udFdlaWdodDogJ2JvbGQnXG5cdFx0XHR9LFxuXHRcdFx0c3RhdGVzOiB7XG5cdFx0XHRcdGhvdmVyOiB7XG5cdFx0XHRcdFx0ZmlsbDoge1xuXHRcdFx0XHRcdFx0bGluZWFyR3JhZGllbnQ6IHsgeDE6IDAsIHkxOiAwLCB4MjogMCwgeTI6IDEgfSxcblx0XHRcdFx0XHRcdHN0b3BzOiBbXG5cdFx0XHRcdFx0XHRcdFswLjQsICcjQkJCJ10sXG5cdFx0XHRcdFx0XHRcdFswLjYsICcjODg4J11cblx0XHRcdFx0XHRcdF1cblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdHN0cm9rZTogJyMwMDAwMDAnLFxuXHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRjb2xvcjogJ3doaXRlJ1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSxcblx0XHRcdFx0c2VsZWN0OiB7XG5cdFx0XHRcdFx0ZmlsbDoge1xuXHRcdFx0XHRcdFx0bGluZWFyR3JhZGllbnQ6IHsgeDE6IDAsIHkxOiAwLCB4MjogMCwgeTI6IDEgfSxcblx0XHRcdFx0XHRcdHN0b3BzOiBbXG5cdFx0XHRcdFx0XHRcdFswLjEsICcjMDAwJ10sXG5cdFx0XHRcdFx0XHRcdFswLjMsICcjMzMzJ11cblx0XHRcdFx0XHRcdF1cblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdHN0cm9rZTogJyMwMDAwMDAnLFxuXHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRjb2xvcjogJ3llbGxvdydcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9LFxuXHRcdGlucHV0U3R5bGU6IHtcblx0XHRcdGJhY2tncm91bmRDb2xvcjogJyMzMzMnLFxuXHRcdFx0Y29sb3I6ICdzaWx2ZXInXG5cdFx0fSxcblx0XHRsYWJlbFN0eWxlOiB7XG5cdFx0XHRjb2xvcjogJ3NpbHZlcidcblx0XHR9XG5cdH0sXG5cblx0bmF2aWdhdG9yOiB7XG5cdFx0aGFuZGxlczoge1xuXHRcdFx0YmFja2dyb3VuZENvbG9yOiAnIzY2NicsXG5cdFx0XHRib3JkZXJDb2xvcjogJyNBQUEnXG5cdFx0fSxcblx0XHRvdXRsaW5lQ29sb3I6ICcjQ0NDJyxcblx0XHRtYXNrRmlsbDogJ3JnYmEoMTYsIDE2LCAxNiwgMC41KScsXG5cdFx0c2VyaWVzOiB7XG5cdFx0XHRjb2xvcjogJyM3Nzk4QkYnLFxuXHRcdFx0bGluZUNvbG9yOiAnI0E2QzdFRCdcblx0XHR9XG5cdH0sXG5cblx0c2Nyb2xsYmFyOiB7XG5cdFx0YmFyQmFja2dyb3VuZENvbG9yOiB7XG5cdFx0XHRcdGxpbmVhckdyYWRpZW50OiB7IHgxOiAwLCB5MTogMCwgeDI6IDAsIHkyOiAxIH0sXG5cdFx0XHRcdHN0b3BzOiBbXG5cdFx0XHRcdFx0WzAuNCwgJyM4ODgnXSxcblx0XHRcdFx0XHRbMC42LCAnIzU1NSddXG5cdFx0XHRcdF1cblx0XHRcdH0sXG5cdFx0YmFyQm9yZGVyQ29sb3I6ICcjQ0NDJyxcblx0XHRidXR0b25BcnJvd0NvbG9yOiAnI0NDQycsXG5cdFx0YnV0dG9uQmFja2dyb3VuZENvbG9yOiB7XG5cdFx0XHRcdGxpbmVhckdyYWRpZW50OiB7IHgxOiAwLCB5MTogMCwgeDI6IDAsIHkyOiAxIH0sXG5cdFx0XHRcdHN0b3BzOiBbXG5cdFx0XHRcdFx0WzAuNCwgJyM4ODgnXSxcblx0XHRcdFx0XHRbMC42LCAnIzU1NSddXG5cdFx0XHRcdF1cblx0XHRcdH0sXG5cdFx0YnV0dG9uQm9yZGVyQ29sb3I6ICcjQ0NDJyxcblx0XHRyaWZsZUNvbG9yOiAnI0ZGRicsXG5cdFx0dHJhY2tCYWNrZ3JvdW5kQ29sb3I6IHtcblx0XHRcdGxpbmVhckdyYWRpZW50OiB7IHgxOiAwLCB5MTogMCwgeDI6IDAsIHkyOiAxIH0sXG5cdFx0XHRzdG9wczogW1xuXHRcdFx0XHRbMCwgJyMwMDAnXSxcblx0XHRcdFx0WzEsICcjMzMzJ11cblx0XHRcdF1cblx0XHR9LFxuXHRcdHRyYWNrQm9yZGVyQ29sb3I6ICcjNjY2J1xuXHR9LFxuXG5cdC8vIHNwZWNpYWwgY29sb3JzIGZvciBzb21lIG9mIHRoZVxuXHRsZWdlbmRCYWNrZ3JvdW5kQ29sb3I6ICdyZ2JhKDAsIDAsIDAsIDAuNSknLFxuXHRsZWdlbmRCYWNrZ3JvdW5kQ29sb3JTb2xpZDogJ3JnYigzNSwgMzUsIDcwKScsXG5cdGRhdGFMYWJlbHNDb2xvcjogJyM0NDQnLFxuXHR0ZXh0Q29sb3I6ICcjQzBDMEMwJyxcblx0bWFza0NvbG9yOiAncmdiYSgyNTUsMjU1LDI1NSwwLjMpJ1xufTtcblxuLy8gQXBwbHkgdGhlIHRoZW1lXG52YXIgaGlnaGNoYXJ0c09wdGlvbnMgPSBIaWdoY2hhcnRzLnNldE9wdGlvbnMoSGlnaGNoYXJ0cy50aGVtZSk7XG4iXSwiZmlsZSI6InBsdWdpbnMvdWVkaXRvci90aGlyZC1wYXJ0eS9oaWdoY2hhcnRzL3RoZW1lcy9kYXJrLWJsdWUuanMifQ==
