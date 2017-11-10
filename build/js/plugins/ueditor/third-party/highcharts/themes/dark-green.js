/**
 * Dark blue theme for Highcharts JS
 * @author Torstein Hønsi
 */

Highcharts.theme = {
	colors: ["#DDDF0D", "#55BF3B", "#DF5353", "#7798BF", "#aaeeee", "#ff0066", "#eeaaee",
		"#55BF3B", "#DF5353", "#7798BF", "#aaeeee"],
	chart: {
		backgroundColor: {
			linearGradient: [0, 0, 250, 500],
			stops: [
				[0, 'rgb(48, 96, 48)'],
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvdGhpcmQtcGFydHkvaGlnaGNoYXJ0cy90aGVtZXMvZGFyay1ncmVlbi5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIERhcmsgYmx1ZSB0aGVtZSBmb3IgSGlnaGNoYXJ0cyBKU1xuICogQGF1dGhvciBUb3JzdGVpbiBIw7huc2lcbiAqL1xuXG5IaWdoY2hhcnRzLnRoZW1lID0ge1xuXHRjb2xvcnM6IFtcIiNERERGMERcIiwgXCIjNTVCRjNCXCIsIFwiI0RGNTM1M1wiLCBcIiM3Nzk4QkZcIiwgXCIjYWFlZWVlXCIsIFwiI2ZmMDA2NlwiLCBcIiNlZWFhZWVcIixcblx0XHRcIiM1NUJGM0JcIiwgXCIjREY1MzUzXCIsIFwiIzc3OThCRlwiLCBcIiNhYWVlZWVcIl0sXG5cdGNoYXJ0OiB7XG5cdFx0YmFja2dyb3VuZENvbG9yOiB7XG5cdFx0XHRsaW5lYXJHcmFkaWVudDogWzAsIDAsIDI1MCwgNTAwXSxcblx0XHRcdHN0b3BzOiBbXG5cdFx0XHRcdFswLCAncmdiKDQ4LCA5NiwgNDgpJ10sXG5cdFx0XHRcdFsxLCAncmdiKDAsIDAsIDApJ11cblx0XHRcdF1cblx0XHR9LFxuXHRcdGJvcmRlckNvbG9yOiAnIzAwMDAwMCcsXG5cdFx0Ym9yZGVyV2lkdGg6IDIsXG5cdFx0Y2xhc3NOYW1lOiAnZGFyay1jb250YWluZXInLFxuXHRcdHBsb3RCYWNrZ3JvdW5kQ29sb3I6ICdyZ2JhKDI1NSwgMjU1LCAyNTUsIC4xKScsXG5cdFx0cGxvdEJvcmRlckNvbG9yOiAnI0NDQ0NDQycsXG5cdFx0cGxvdEJvcmRlcldpZHRoOiAxXG5cdH0sXG5cdHRpdGxlOiB7XG5cdFx0c3R5bGU6IHtcblx0XHRcdGNvbG9yOiAnI0MwQzBDMCcsXG5cdFx0XHRmb250OiAnYm9sZCAxNnB4IFwiVHJlYnVjaGV0IE1TXCIsIFZlcmRhbmEsIHNhbnMtc2VyaWYnXG5cdFx0fVxuXHR9LFxuXHRzdWJ0aXRsZToge1xuXHRcdHN0eWxlOiB7XG5cdFx0XHRjb2xvcjogJyM2NjY2NjYnLFxuXHRcdFx0Zm9udDogJ2JvbGQgMTJweCBcIlRyZWJ1Y2hldCBNU1wiLCBWZXJkYW5hLCBzYW5zLXNlcmlmJ1xuXHRcdH1cblx0fSxcblx0eEF4aXM6IHtcblx0XHRncmlkTGluZUNvbG9yOiAnIzMzMzMzMycsXG5cdFx0Z3JpZExpbmVXaWR0aDogMSxcblx0XHRsYWJlbHM6IHtcblx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdGNvbG9yOiAnI0EwQTBBMCdcblx0XHRcdH1cblx0XHR9LFxuXHRcdGxpbmVDb2xvcjogJyNBMEEwQTAnLFxuXHRcdHRpY2tDb2xvcjogJyNBMEEwQTAnLFxuXHRcdHRpdGxlOiB7XG5cdFx0XHRzdHlsZToge1xuXHRcdFx0XHRjb2xvcjogJyNDQ0MnLFxuXHRcdFx0XHRmb250V2VpZ2h0OiAnYm9sZCcsXG5cdFx0XHRcdGZvbnRTaXplOiAnMTJweCcsXG5cdFx0XHRcdGZvbnRGYW1pbHk6ICdUcmVidWNoZXQgTVMsIFZlcmRhbmEsIHNhbnMtc2VyaWYnXG5cblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cdHlBeGlzOiB7XG5cdFx0Z3JpZExpbmVDb2xvcjogJyMzMzMzMzMnLFxuXHRcdGxhYmVsczoge1xuXHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0Y29sb3I6ICcjQTBBMEEwJ1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0bGluZUNvbG9yOiAnI0EwQTBBMCcsXG5cdFx0bWlub3JUaWNrSW50ZXJ2YWw6IG51bGwsXG5cdFx0dGlja0NvbG9yOiAnI0EwQTBBMCcsXG5cdFx0dGlja1dpZHRoOiAxLFxuXHRcdHRpdGxlOiB7XG5cdFx0XHRzdHlsZToge1xuXHRcdFx0XHRjb2xvcjogJyNDQ0MnLFxuXHRcdFx0XHRmb250V2VpZ2h0OiAnYm9sZCcsXG5cdFx0XHRcdGZvbnRTaXplOiAnMTJweCcsXG5cdFx0XHRcdGZvbnRGYW1pbHk6ICdUcmVidWNoZXQgTVMsIFZlcmRhbmEsIHNhbnMtc2VyaWYnXG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXHR0b29sdGlwOiB7XG5cdFx0YmFja2dyb3VuZENvbG9yOiAncmdiYSgwLCAwLCAwLCAwLjc1KScsXG5cdFx0c3R5bGU6IHtcblx0XHRcdGNvbG9yOiAnI0YwRjBGMCdcblx0XHR9XG5cdH0sXG5cdHRvb2xiYXI6IHtcblx0XHRpdGVtU3R5bGU6IHtcblx0XHRcdGNvbG9yOiAnc2lsdmVyJ1xuXHRcdH1cblx0fSxcblx0cGxvdE9wdGlvbnM6IHtcblx0XHRsaW5lOiB7XG5cdFx0XHRkYXRhTGFiZWxzOiB7XG5cdFx0XHRcdGNvbG9yOiAnI0NDQydcblx0XHRcdH0sXG5cdFx0XHRtYXJrZXI6IHtcblx0XHRcdFx0bGluZUNvbG9yOiAnIzMzMydcblx0XHRcdH1cblx0XHR9LFxuXHRcdHNwbGluZToge1xuXHRcdFx0bWFya2VyOiB7XG5cdFx0XHRcdGxpbmVDb2xvcjogJyMzMzMnXG5cdFx0XHR9XG5cdFx0fSxcblx0XHRzY2F0dGVyOiB7XG5cdFx0XHRtYXJrZXI6IHtcblx0XHRcdFx0bGluZUNvbG9yOiAnIzMzMydcblx0XHRcdH1cblx0XHR9LFxuXHRcdGNhbmRsZXN0aWNrOiB7XG5cdFx0XHRsaW5lQ29sb3I6ICd3aGl0ZSdcblx0XHR9XG5cdH0sXG5cdGxlZ2VuZDoge1xuXHRcdGl0ZW1TdHlsZToge1xuXHRcdFx0Zm9udDogJzlwdCBUcmVidWNoZXQgTVMsIFZlcmRhbmEsIHNhbnMtc2VyaWYnLFxuXHRcdFx0Y29sb3I6ICcjQTBBMEEwJ1xuXHRcdH0sXG5cdFx0aXRlbUhvdmVyU3R5bGU6IHtcblx0XHRcdGNvbG9yOiAnI0ZGRidcblx0XHR9LFxuXHRcdGl0ZW1IaWRkZW5TdHlsZToge1xuXHRcdFx0Y29sb3I6ICcjNDQ0J1xuXHRcdH1cblx0fSxcblx0Y3JlZGl0czoge1xuXHRcdHN0eWxlOiB7XG5cdFx0XHRjb2xvcjogJyM2NjYnXG5cdFx0fVxuXHR9LFxuXHRsYWJlbHM6IHtcblx0XHRzdHlsZToge1xuXHRcdFx0Y29sb3I6ICcjQ0NDJ1xuXHRcdH1cblx0fSxcblxuXG5cdG5hdmlnYXRpb246IHtcblx0XHRidXR0b25PcHRpb25zOiB7XG5cdFx0XHRzeW1ib2xTdHJva2U6ICcjREREREREJyxcblx0XHRcdGhvdmVyU3ltYm9sU3Ryb2tlOiAnI0ZGRkZGRicsXG5cdFx0XHR0aGVtZToge1xuXHRcdFx0XHRmaWxsOiB7XG5cdFx0XHRcdFx0bGluZWFyR3JhZGllbnQ6IHsgeDE6IDAsIHkxOiAwLCB4MjogMCwgeTI6IDEgfSxcblx0XHRcdFx0XHRzdG9wczogW1xuXHRcdFx0XHRcdFx0WzAuNCwgJyM2MDYwNjAnXSxcblx0XHRcdFx0XHRcdFswLjYsICcjMzMzMzMzJ11cblx0XHRcdFx0XHRdXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHN0cm9rZTogJyMwMDAwMDAnXG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cdC8vIHNjcm9sbCBjaGFydHNcblx0cmFuZ2VTZWxlY3Rvcjoge1xuXHRcdGJ1dHRvblRoZW1lOiB7XG5cdFx0XHRmaWxsOiB7XG5cdFx0XHRcdGxpbmVhckdyYWRpZW50OiB7IHgxOiAwLCB5MTogMCwgeDI6IDAsIHkyOiAxIH0sXG5cdFx0XHRcdHN0b3BzOiBbXG5cdFx0XHRcdFx0WzAuNCwgJyM4ODgnXSxcblx0XHRcdFx0XHRbMC42LCAnIzU1NSddXG5cdFx0XHRcdF1cblx0XHRcdH0sXG5cdFx0XHRzdHJva2U6ICcjMDAwMDAwJyxcblx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdGNvbG9yOiAnI0NDQycsXG5cdFx0XHRcdGZvbnRXZWlnaHQ6ICdib2xkJ1xuXHRcdFx0fSxcblx0XHRcdHN0YXRlczoge1xuXHRcdFx0XHRob3Zlcjoge1xuXHRcdFx0XHRcdGZpbGw6IHtcblx0XHRcdFx0XHRcdGxpbmVhckdyYWRpZW50OiB7IHgxOiAwLCB5MTogMCwgeDI6IDAsIHkyOiAxIH0sXG5cdFx0XHRcdFx0XHRzdG9wczogW1xuXHRcdFx0XHRcdFx0XHRbMC40LCAnI0JCQiddLFxuXHRcdFx0XHRcdFx0XHRbMC42LCAnIzg4OCddXG5cdFx0XHRcdFx0XHRdXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRzdHJva2U6ICcjMDAwMDAwJyxcblx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0Y29sb3I6ICd3aGl0ZSdcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sXG5cdFx0XHRcdHNlbGVjdDoge1xuXHRcdFx0XHRcdGZpbGw6IHtcblx0XHRcdFx0XHRcdGxpbmVhckdyYWRpZW50OiB7IHgxOiAwLCB5MTogMCwgeDI6IDAsIHkyOiAxIH0sXG5cdFx0XHRcdFx0XHRzdG9wczogW1xuXHRcdFx0XHRcdFx0XHRbMC4xLCAnIzAwMCddLFxuXHRcdFx0XHRcdFx0XHRbMC4zLCAnIzMzMyddXG5cdFx0XHRcdFx0XHRdXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRzdHJva2U6ICcjMDAwMDAwJyxcblx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0Y29sb3I6ICd5ZWxsb3cnXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRpbnB1dFN0eWxlOiB7XG5cdFx0XHRiYWNrZ3JvdW5kQ29sb3I6ICcjMzMzJyxcblx0XHRcdGNvbG9yOiAnc2lsdmVyJ1xuXHRcdH0sXG5cdFx0bGFiZWxTdHlsZToge1xuXHRcdFx0Y29sb3I6ICdzaWx2ZXInXG5cdFx0fVxuXHR9LFxuXG5cdG5hdmlnYXRvcjoge1xuXHRcdGhhbmRsZXM6IHtcblx0XHRcdGJhY2tncm91bmRDb2xvcjogJyM2NjYnLFxuXHRcdFx0Ym9yZGVyQ29sb3I6ICcjQUFBJ1xuXHRcdH0sXG5cdFx0b3V0bGluZUNvbG9yOiAnI0NDQycsXG5cdFx0bWFza0ZpbGw6ICdyZ2JhKDE2LCAxNiwgMTYsIDAuNSknLFxuXHRcdHNlcmllczoge1xuXHRcdFx0Y29sb3I6ICcjNzc5OEJGJyxcblx0XHRcdGxpbmVDb2xvcjogJyNBNkM3RUQnXG5cdFx0fVxuXHR9LFxuXG5cdHNjcm9sbGJhcjoge1xuXHRcdGJhckJhY2tncm91bmRDb2xvcjoge1xuXHRcdFx0XHRsaW5lYXJHcmFkaWVudDogeyB4MTogMCwgeTE6IDAsIHgyOiAwLCB5MjogMSB9LFxuXHRcdFx0XHRzdG9wczogW1xuXHRcdFx0XHRcdFswLjQsICcjODg4J10sXG5cdFx0XHRcdFx0WzAuNiwgJyM1NTUnXVxuXHRcdFx0XHRdXG5cdFx0XHR9LFxuXHRcdGJhckJvcmRlckNvbG9yOiAnI0NDQycsXG5cdFx0YnV0dG9uQXJyb3dDb2xvcjogJyNDQ0MnLFxuXHRcdGJ1dHRvbkJhY2tncm91bmRDb2xvcjoge1xuXHRcdFx0XHRsaW5lYXJHcmFkaWVudDogeyB4MTogMCwgeTE6IDAsIHgyOiAwLCB5MjogMSB9LFxuXHRcdFx0XHRzdG9wczogW1xuXHRcdFx0XHRcdFswLjQsICcjODg4J10sXG5cdFx0XHRcdFx0WzAuNiwgJyM1NTUnXVxuXHRcdFx0XHRdXG5cdFx0XHR9LFxuXHRcdGJ1dHRvbkJvcmRlckNvbG9yOiAnI0NDQycsXG5cdFx0cmlmbGVDb2xvcjogJyNGRkYnLFxuXHRcdHRyYWNrQmFja2dyb3VuZENvbG9yOiB7XG5cdFx0XHRsaW5lYXJHcmFkaWVudDogeyB4MTogMCwgeTE6IDAsIHgyOiAwLCB5MjogMSB9LFxuXHRcdFx0c3RvcHM6IFtcblx0XHRcdFx0WzAsICcjMDAwJ10sXG5cdFx0XHRcdFsxLCAnIzMzMyddXG5cdFx0XHRdXG5cdFx0fSxcblx0XHR0cmFja0JvcmRlckNvbG9yOiAnIzY2Nidcblx0fSxcblxuXHQvLyBzcGVjaWFsIGNvbG9ycyBmb3Igc29tZSBvZiB0aGVcblx0bGVnZW5kQmFja2dyb3VuZENvbG9yOiAncmdiYSgwLCAwLCAwLCAwLjUpJyxcblx0bGVnZW5kQmFja2dyb3VuZENvbG9yU29saWQ6ICdyZ2IoMzUsIDM1LCA3MCknLFxuXHRkYXRhTGFiZWxzQ29sb3I6ICcjNDQ0Jyxcblx0dGV4dENvbG9yOiAnI0MwQzBDMCcsXG5cdG1hc2tDb2xvcjogJ3JnYmEoMjU1LDI1NSwyNTUsMC4zKSdcbn07XG5cbi8vIEFwcGx5IHRoZSB0aGVtZVxudmFyIGhpZ2hjaGFydHNPcHRpb25zID0gSGlnaGNoYXJ0cy5zZXRPcHRpb25zKEhpZ2hjaGFydHMudGhlbWUpO1xuIl0sImZpbGUiOiJwbHVnaW5zL3VlZGl0b3IvdGhpcmQtcGFydHkvaGlnaGNoYXJ0cy90aGVtZXMvZGFyay1ncmVlbi5qcyJ9
