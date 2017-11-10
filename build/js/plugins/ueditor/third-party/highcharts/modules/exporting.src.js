/**
 * @license Highcharts JS v3.0.6 (2013-10-04)
 * Exporting module
 *
 * (c) 2010-2013 Torstein Hønsi
 *
 * License: www.highcharts.com/license
 */

// JSLint options:
/*global Highcharts, document, window, Math, setTimeout */

(function (Highcharts) { // encapsulate

// create shortcuts
var Chart = Highcharts.Chart,
	addEvent = Highcharts.addEvent,
	removeEvent = Highcharts.removeEvent,
	createElement = Highcharts.createElement,
	discardElement = Highcharts.discardElement,
	css = Highcharts.css,
	merge = Highcharts.merge,
	each = Highcharts.each,
	extend = Highcharts.extend,
	math = Math,
	mathMax = math.max,
	doc = document,
	win = window,
	isTouchDevice = Highcharts.isTouchDevice,
	M = 'M',
	L = 'L',
	DIV = 'div',
	HIDDEN = 'hidden',
	NONE = 'none',
	PREFIX = 'highcharts-',
	ABSOLUTE = 'absolute',
	PX = 'px',
	UNDEFINED,
	symbols = Highcharts.Renderer.prototype.symbols,
	defaultOptions = Highcharts.getOptions(),
	buttonOffset;

	// Add language
	extend(defaultOptions.lang, {
		printChart: 'Print chart',
		downloadPNG: 'Download PNG image',
		downloadJPEG: 'Download JPEG image',
		downloadPDF: 'Download PDF document',
		downloadSVG: 'Download SVG vector image',
		contextButtonTitle: 'Chart context menu'
	});

// Buttons and menus are collected in a separate config option set called 'navigation'.
// This can be extended later to add control buttons like zoom and pan right click menus.
defaultOptions.navigation = {
	menuStyle: {
		border: '1px solid #A0A0A0',
		background: '#FFFFFF',
		padding: '5px 0'
	},
	menuItemStyle: {
		padding: '0 10px',
		background: NONE,
		color: '#303030',
		fontSize: isTouchDevice ? '14px' : '11px'
	},
	menuItemHoverStyle: {
		background: '#4572A5',
		color: '#FFFFFF'
	},

	buttonOptions: {
		symbolFill: '#E0E0E0',
		symbolSize: 14,
		symbolStroke: '#666',
		symbolStrokeWidth: 3,
		symbolX: 12.5,
		symbolY: 10.5,
		align: 'right',
		buttonSpacing: 3, 
		height: 22,
		// text: null,
		theme: {
			fill: 'white', // capture hover
			stroke: 'none'
		},
		verticalAlign: 'top',
		width: 24
	}
};



// Add the export related options
defaultOptions.exporting = {
	//enabled: true,
	//filename: 'chart',
	type: 'image/png',
	url: 'http://export.highcharts.com/',
	//width: undefined,
	//scale: 2
	buttons: {
		contextButton: {
			menuClassName: PREFIX + 'contextmenu',
			//x: -10,
			symbol: 'menu',
			_titleKey: 'contextButtonTitle',
			menuItems: [{
				textKey: 'printChart',
				onclick: function () {
					this.print();
				}
			}, {
				separator: true
			}, {
				textKey: 'downloadPNG',
				onclick: function () {
					this.exportChart();
				}
			}, {
				textKey: 'downloadJPEG',
				onclick: function () {
					this.exportChart({
						type: 'image/jpeg'
					});
				}
			}, {
				textKey: 'downloadPDF',
				onclick: function () {
					this.exportChart({
						type: 'application/pdf'
					});
				}
			}, {
				textKey: 'downloadSVG',
				onclick: function () {
					this.exportChart({
						type: 'image/svg+xml'
					});
				}
			}
			// Enable this block to add "View SVG" to the dropdown menu
			/*
			,{

				text: 'View SVG',
				onclick: function () {
					var svg = this.getSVG()
						.replace(/</g, '\n&lt;')
						.replace(/>/g, '&gt;');

					doc.body.innerHTML = '<pre>' + svg + '</pre>';
				}
			} // */
			]
		}
	}
};

// Add the Highcharts.post utility
Highcharts.post = function (url, data) {
	var name,
		form;
	
	// create the form
	form = createElement('form', {
		method: 'post',
		action: url,
		enctype: 'multipart/form-data'
	}, {
		display: NONE
	}, doc.body);

	// add the data
	for (name in data) {
		createElement('input', {
			type: HIDDEN,
			name: name,
			value: data[name]
		}, null, form);
	}

	// submit
	form.submit();

	// clean up
	discardElement(form);
};

extend(Chart.prototype, {

	/**
	 * Return an SVG representation of the chart
	 *
	 * @param additionalOptions {Object} Additional chart options for the generated SVG representation
	 */
	getSVG: function (additionalOptions) {
		var chart = this,
			chartCopy,
			sandbox,
			svg,
			seriesOptions,
			sourceWidth,
			sourceHeight,
			cssWidth,
			cssHeight,
			options = merge(chart.options, additionalOptions); // copy the options and add extra options

		// IE compatibility hack for generating SVG content that it doesn't really understand
		if (!doc.createElementNS) {
			/*jslint unparam: true*//* allow unused parameter ns in function below */
			doc.createElementNS = function (ns, tagName) {
				return doc.createElement(tagName);
			};
			/*jslint unparam: false*/
		}

		// create a sandbox where a new chart will be generated
		sandbox = createElement(DIV, null, {
			position: ABSOLUTE,
			top: '-9999em',
			width: chart.chartWidth + PX,
			height: chart.chartHeight + PX
		}, doc.body);
		
		// get the source size
		cssWidth = chart.renderTo.style.width;
		cssHeight = chart.renderTo.style.height;
		sourceWidth = options.exporting.sourceWidth ||
			options.chart.width ||
			(/px$/.test(cssWidth) && parseInt(cssWidth, 10)) ||
			600;
		sourceHeight = options.exporting.sourceHeight ||
			options.chart.height ||
			(/px$/.test(cssHeight) && parseInt(cssHeight, 10)) ||
			400;

		// override some options
		extend(options.chart, {
			animation: false,
			renderTo: sandbox,
			forExport: true,
			width: sourceWidth,
			height: sourceHeight
		});
		options.exporting.enabled = false; // hide buttons in print
		
		// prepare for replicating the chart
		options.series = [];
		each(chart.series, function (serie) {
			seriesOptions = merge(serie.options, {
				animation: false, // turn off animation
				showCheckbox: false,
				visible: serie.visible
			});

			if (!seriesOptions.isInternal) { // used for the navigator series that has its own option set
				options.series.push(seriesOptions);
			}
		});

		// generate the chart copy
		chartCopy = new Highcharts.Chart(options, chart.callback);

		// reflect axis extremes in the export
		each(['xAxis', 'yAxis'], function (axisType) {
			each(chart[axisType], function (axis, i) {
				var axisCopy = chartCopy[axisType][i],
					extremes = axis.getExtremes(),
					userMin = extremes.userMin,
					userMax = extremes.userMax;

				if (axisCopy && (userMin !== UNDEFINED || userMax !== UNDEFINED)) {
					axisCopy.setExtremes(userMin, userMax, true, false);
				}
			});
		});

		// get the SVG from the container's innerHTML
		svg = chartCopy.container.innerHTML;

		// free up memory
		options = null;
		chartCopy.destroy();
		discardElement(sandbox);

		// sanitize
		svg = svg
			.replace(/zIndex="[^"]+"/g, '')
			.replace(/isShadow="[^"]+"/g, '')
			.replace(/symbolName="[^"]+"/g, '')
			.replace(/jQuery[0-9]+="[^"]+"/g, '')
			.replace(/url\([^#]+#/g, 'url(#')
			.replace(/<svg /, '<svg xmlns:xlink="http://www.w3.org/1999/xlink" ')
			.replace(/ href=/g, ' xlink:href=')
			.replace(/\n/, ' ')
			.replace(/<\/svg>.*?$/, '</svg>') // any HTML added to the container after the SVG (#894)
			/* This fails in IE < 8
			.replace(/([0-9]+)\.([0-9]+)/g, function(s1, s2, s3) { // round off to save weight
				return s2 +'.'+ s3[0];
			})*/

			// Replace HTML entities, issue #347
			.replace(/&nbsp;/g, '\u00A0') // no-break space
			.replace(/&shy;/g,  '\u00AD') // soft hyphen

			// IE specific
			.replace(/<IMG /g, '<image ')
			.replace(/height=([^" ]+)/g, 'height="$1"')
			.replace(/width=([^" ]+)/g, 'width="$1"')
			.replace(/hc-svg-href="([^"]+)">/g, 'xlink:href="$1"/>')
			.replace(/id=([^" >]+)/g, 'id="$1"')
			.replace(/class=([^" >]+)/g, 'class="$1"')
			.replace(/ transform /g, ' ')
			.replace(/:(path|rect)/g, '$1')
			.replace(/style="([^"]+)"/g, function (s) {
				return s.toLowerCase();
			});

		// IE9 beta bugs with innerHTML. Test again with final IE9.
		svg = svg.replace(/(url\(#highcharts-[0-9]+)&quot;/g, '$1')
			.replace(/&quot;/g, "'");

		return svg;
	},

	/**
	 * Submit the SVG representation of the chart to the server
	 * @param {Object} options Exporting options. Possible members are url, type and width.
	 * @param {Object} chartOptions Additional chart options for the SVG representation of the chart
	 */
	exportChart: function (options, chartOptions) {
		options = options || {};
		
		var chart = this,
			chartExportingOptions = chart.options.exporting,
			svg = chart.getSVG(merge(
				{ chart: { borderRadius: 0 } },
				chartExportingOptions.chartOptions,
				chartOptions, 
				{
					exporting: {
						sourceWidth: options.sourceWidth || chartExportingOptions.sourceWidth,
						sourceHeight: options.sourceHeight || chartExportingOptions.sourceHeight
					}
				}
			));

		// merge the options
		options = merge(chart.options.exporting, options);
		
		// do the post
		Highcharts.post(options.url, {
			filename: options.filename || 'chart',
			type: options.type,
			width: options.width || 0, // IE8 fails to post undefined correctly, so use 0
			scale: options.scale || 2,
			svg: svg
		});

	},
	
	/**
	 * Print the chart
	 */
	print: function () {

		var chart = this,
			container = chart.container,
			origDisplay = [],
			origParent = container.parentNode,
			body = doc.body,
			childNodes = body.childNodes;

		if (chart.isPrinting) { // block the button while in printing mode
			return;
		}

		chart.isPrinting = true;

		// hide all body content
		each(childNodes, function (node, i) {
			if (node.nodeType === 1) {
				origDisplay[i] = node.style.display;
				node.style.display = NONE;
			}
		});

		// pull out the chart
		body.appendChild(container);

		// print
		win.focus(); // #1510
		win.print();

		// allow the browser to prepare before reverting
		setTimeout(function () {

			// put the chart back in
			origParent.appendChild(container);

			// restore all body content
			each(childNodes, function (node, i) {
				if (node.nodeType === 1) {
					node.style.display = origDisplay[i];
				}
			});

			chart.isPrinting = false;

		}, 1000);

	},

	/**
	 * Display a popup menu for choosing the export type
	 *
	 * @param {String} className An identifier for the menu
	 * @param {Array} items A collection with text and onclicks for the items
	 * @param {Number} x The x position of the opener button
	 * @param {Number} y The y position of the opener button
	 * @param {Number} width The width of the opener button
	 * @param {Number} height The height of the opener button
	 */
	contextMenu: function (className, items, x, y, width, height, button) {
		var chart = this,
			navOptions = chart.options.navigation,
			menuItemStyle = navOptions.menuItemStyle,
			chartWidth = chart.chartWidth,
			chartHeight = chart.chartHeight,
			cacheName = 'cache-' + className,
			menu = chart[cacheName],
			menuPadding = mathMax(width, height), // for mouse leave detection
			boxShadow = '3px 3px 10px #888',
			innerMenu,
			hide,
			hideTimer,
			menuStyle;

		// create the menu only the first time
		if (!menu) {

			// create a HTML element above the SVG
			chart[cacheName] = menu = createElement(DIV, {
				className: className
			}, {
				position: ABSOLUTE,
				zIndex: 1000,
				padding: menuPadding + PX
			}, chart.container);

			innerMenu = createElement(DIV, null,
				extend({
					MozBoxShadow: boxShadow,
					WebkitBoxShadow: boxShadow,
					boxShadow: boxShadow
				}, navOptions.menuStyle), menu);

			// hide on mouse out
			hide = function () {
				css(menu, { display: NONE });
				if (button) {
					button.setState(0);
				}
				chart.openMenu = false;
			};

			// Hide the menu some time after mouse leave (#1357)
			addEvent(menu, 'mouseleave', function () {
				hideTimer = setTimeout(hide, 500);
			});
			addEvent(menu, 'mouseenter', function () {
				clearTimeout(hideTimer);
			});
			// Hide it on clicking or touching outside the menu (#2258)
			addEvent(document, 'mousedown', function (e) {
				if (!chart.pointer.inClass(e.target, className)) {
					hide();
				}
			});


			// create the items
			each(items, function (item) {
				if (item) {
					var element = item.separator ? 
						createElement('hr', null, null, innerMenu) :
						createElement(DIV, {
							onmouseover: function () {
								css(this, navOptions.menuItemHoverStyle);
							},
							onmouseout: function () {
								css(this, menuItemStyle);
							},
							onclick: function () {
								hide();
								item.onclick.apply(chart, arguments);
							},
							innerHTML: item.text || chart.options.lang[item.textKey]
						}, extend({
							cursor: 'pointer'
						}, menuItemStyle), innerMenu);


					// Keep references to menu divs to be able to destroy them
					chart.exportDivElements.push(element);
				}
			});

			// Keep references to menu and innerMenu div to be able to destroy them
			chart.exportDivElements.push(innerMenu, menu);

			chart.exportMenuWidth = menu.offsetWidth;
			chart.exportMenuHeight = menu.offsetHeight;
		}

		menuStyle = { display: 'block' };

		// if outside right, right align it
		if (x + chart.exportMenuWidth > chartWidth) {
			menuStyle.right = (chartWidth - x - width - menuPadding) + PX;
		} else {
			menuStyle.left = (x - menuPadding) + PX;
		}
		// if outside bottom, bottom align it
		if (y + height + chart.exportMenuHeight > chartHeight && button.alignOptions.verticalAlign !== 'top') {
			menuStyle.bottom = (chartHeight - y - menuPadding)  + PX;
		} else {
			menuStyle.top = (y + height - menuPadding) + PX;
		}

		css(menu, menuStyle);
		chart.openMenu = true;
	},

	/**
	 * Add the export button to the chart
	 */
	addButton: function (options) {
		var chart = this,
			renderer = chart.renderer,
			btnOptions = merge(chart.options.navigation.buttonOptions, options),
			onclick = btnOptions.onclick,
			menuItems = btnOptions.menuItems,
			symbol,
			button,
			symbolAttr = {
				stroke: btnOptions.symbolStroke,
				fill: btnOptions.symbolFill
			},
			symbolSize = btnOptions.symbolSize || 12;
		if (!chart.btnCount) {
			chart.btnCount = 0;
		}

		// Keeps references to the button elements
		if (!chart.exportDivElements) {
			chart.exportDivElements = [];
			chart.exportSVGElements = [];
		}

		if (btnOptions.enabled === false) {
			return;
		}


		var attr = btnOptions.theme,
			states = attr.states,
			hover = states && states.hover,
			select = states && states.select,
			callback;

		delete attr.states;

		if (onclick) {
			callback = function () {
				onclick.apply(chart, arguments);
			};

		} else if (menuItems) {
			callback = function () {
				chart.contextMenu(
					button.menuClassName, 
					menuItems, 
					button.translateX, 
					button.translateY, 
					button.width, 
					button.height,
					button
				);
				button.setState(2);
			};
		}


		if (btnOptions.text && btnOptions.symbol) {
			attr.paddingLeft = Highcharts.pick(attr.paddingLeft, 25);
		
		} else if (!btnOptions.text) {
			extend(attr, {
				width: btnOptions.width,
				height: btnOptions.height,
				padding: 0
			});
		}

		button = renderer.button(btnOptions.text, 0, 0, callback, attr, hover, select)
			.attr({
				title: chart.options.lang[btnOptions._titleKey],
				'stroke-linecap': 'round'
			});
		button.menuClassName = options.menuClassName || PREFIX + 'menu-' + chart.btnCount++;

		if (btnOptions.symbol) {
			symbol = renderer.symbol(
					btnOptions.symbol,
					btnOptions.symbolX - (symbolSize / 2),
					btnOptions.symbolY - (symbolSize / 2),
					symbolSize,				
					symbolSize
				)
				.attr(extend(symbolAttr, {
					'stroke-width': btnOptions.symbolStrokeWidth || 1,
					zIndex: 1
				})).add(button);
		}

		button.add()
			.align(extend(btnOptions, {
				width: button.width,
				x: Highcharts.pick(btnOptions.x, buttonOffset) // #1654
			}), true, 'spacingBox');

		buttonOffset += (button.width + btnOptions.buttonSpacing) * (btnOptions.align === 'right' ? -1 : 1);

		chart.exportSVGElements.push(button, symbol);

	},

	/**
	 * Destroy the buttons.
	 */
	destroyExport: function (e) {
		var chart = e.target,
			i,
			elem;

		// Destroy the extra buttons added
		for (i = 0; i < chart.exportSVGElements.length; i++) {
			elem = chart.exportSVGElements[i];
			
			// Destroy and null the svg/vml elements
			if (elem) { // #1822
				elem.onclick = elem.ontouchstart = null;
				chart.exportSVGElements[i] = elem.destroy();
			}
		}

		// Destroy the divs for the menu
		for (i = 0; i < chart.exportDivElements.length; i++) {
			elem = chart.exportDivElements[i];

			// Remove the event handler
			removeEvent(elem, 'mouseleave');

			// Remove inline events
			chart.exportDivElements[i] = elem.onmouseout = elem.onmouseover = elem.ontouchstart = elem.onclick = null;

			// Destroy the div by moving to garbage bin
			discardElement(elem);
		}
	}
});


symbols.menu = function (x, y, width, height) {
	var arr = [
		M, x, y + 2.5,
		L, x + width, y + 2.5,
		M, x, y + height / 2 + 0.5,
		L, x + width, y + height / 2 + 0.5,
		M, x, y + height - 1.5,
		L, x + width, y + height - 1.5
	];
	return arr;
};

// Add the buttons on chart load
Chart.prototype.callbacks.push(function (chart) {
	var n,
		exportingOptions = chart.options.exporting,
		buttons = exportingOptions.buttons;

	buttonOffset = 0;

	if (exportingOptions.enabled !== false) {

		for (n in buttons) {
			chart.addButton(buttons[n]);
		}

		// Destroy the export elements at chart destroy
		addEvent(chart, 'destroy', chart.destroyExport);
	}

});


}(Highcharts));

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvdGhpcmQtcGFydHkvaGlnaGNoYXJ0cy9tb2R1bGVzL2V4cG9ydGluZy5zcmMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZSBIaWdoY2hhcnRzIEpTIHYzLjAuNiAoMjAxMy0xMC0wNClcbiAqIEV4cG9ydGluZyBtb2R1bGVcbiAqXG4gKiAoYykgMjAxMC0yMDEzIFRvcnN0ZWluIEjDuG5zaVxuICpcbiAqIExpY2Vuc2U6IHd3dy5oaWdoY2hhcnRzLmNvbS9saWNlbnNlXG4gKi9cblxuLy8gSlNMaW50IG9wdGlvbnM6XG4vKmdsb2JhbCBIaWdoY2hhcnRzLCBkb2N1bWVudCwgd2luZG93LCBNYXRoLCBzZXRUaW1lb3V0ICovXG5cbihmdW5jdGlvbiAoSGlnaGNoYXJ0cykgeyAvLyBlbmNhcHN1bGF0ZVxuXG4vLyBjcmVhdGUgc2hvcnRjdXRzXG52YXIgQ2hhcnQgPSBIaWdoY2hhcnRzLkNoYXJ0LFxuXHRhZGRFdmVudCA9IEhpZ2hjaGFydHMuYWRkRXZlbnQsXG5cdHJlbW92ZUV2ZW50ID0gSGlnaGNoYXJ0cy5yZW1vdmVFdmVudCxcblx0Y3JlYXRlRWxlbWVudCA9IEhpZ2hjaGFydHMuY3JlYXRlRWxlbWVudCxcblx0ZGlzY2FyZEVsZW1lbnQgPSBIaWdoY2hhcnRzLmRpc2NhcmRFbGVtZW50LFxuXHRjc3MgPSBIaWdoY2hhcnRzLmNzcyxcblx0bWVyZ2UgPSBIaWdoY2hhcnRzLm1lcmdlLFxuXHRlYWNoID0gSGlnaGNoYXJ0cy5lYWNoLFxuXHRleHRlbmQgPSBIaWdoY2hhcnRzLmV4dGVuZCxcblx0bWF0aCA9IE1hdGgsXG5cdG1hdGhNYXggPSBtYXRoLm1heCxcblx0ZG9jID0gZG9jdW1lbnQsXG5cdHdpbiA9IHdpbmRvdyxcblx0aXNUb3VjaERldmljZSA9IEhpZ2hjaGFydHMuaXNUb3VjaERldmljZSxcblx0TSA9ICdNJyxcblx0TCA9ICdMJyxcblx0RElWID0gJ2RpdicsXG5cdEhJRERFTiA9ICdoaWRkZW4nLFxuXHROT05FID0gJ25vbmUnLFxuXHRQUkVGSVggPSAnaGlnaGNoYXJ0cy0nLFxuXHRBQlNPTFVURSA9ICdhYnNvbHV0ZScsXG5cdFBYID0gJ3B4Jyxcblx0VU5ERUZJTkVELFxuXHRzeW1ib2xzID0gSGlnaGNoYXJ0cy5SZW5kZXJlci5wcm90b3R5cGUuc3ltYm9scyxcblx0ZGVmYXVsdE9wdGlvbnMgPSBIaWdoY2hhcnRzLmdldE9wdGlvbnMoKSxcblx0YnV0dG9uT2Zmc2V0O1xuXG5cdC8vIEFkZCBsYW5ndWFnZVxuXHRleHRlbmQoZGVmYXVsdE9wdGlvbnMubGFuZywge1xuXHRcdHByaW50Q2hhcnQ6ICdQcmludCBjaGFydCcsXG5cdFx0ZG93bmxvYWRQTkc6ICdEb3dubG9hZCBQTkcgaW1hZ2UnLFxuXHRcdGRvd25sb2FkSlBFRzogJ0Rvd25sb2FkIEpQRUcgaW1hZ2UnLFxuXHRcdGRvd25sb2FkUERGOiAnRG93bmxvYWQgUERGIGRvY3VtZW50Jyxcblx0XHRkb3dubG9hZFNWRzogJ0Rvd25sb2FkIFNWRyB2ZWN0b3IgaW1hZ2UnLFxuXHRcdGNvbnRleHRCdXR0b25UaXRsZTogJ0NoYXJ0IGNvbnRleHQgbWVudSdcblx0fSk7XG5cbi8vIEJ1dHRvbnMgYW5kIG1lbnVzIGFyZSBjb2xsZWN0ZWQgaW4gYSBzZXBhcmF0ZSBjb25maWcgb3B0aW9uIHNldCBjYWxsZWQgJ25hdmlnYXRpb24nLlxuLy8gVGhpcyBjYW4gYmUgZXh0ZW5kZWQgbGF0ZXIgdG8gYWRkIGNvbnRyb2wgYnV0dG9ucyBsaWtlIHpvb20gYW5kIHBhbiByaWdodCBjbGljayBtZW51cy5cbmRlZmF1bHRPcHRpb25zLm5hdmlnYXRpb24gPSB7XG5cdG1lbnVTdHlsZToge1xuXHRcdGJvcmRlcjogJzFweCBzb2xpZCAjQTBBMEEwJyxcblx0XHRiYWNrZ3JvdW5kOiAnI0ZGRkZGRicsXG5cdFx0cGFkZGluZzogJzVweCAwJ1xuXHR9LFxuXHRtZW51SXRlbVN0eWxlOiB7XG5cdFx0cGFkZGluZzogJzAgMTBweCcsXG5cdFx0YmFja2dyb3VuZDogTk9ORSxcblx0XHRjb2xvcjogJyMzMDMwMzAnLFxuXHRcdGZvbnRTaXplOiBpc1RvdWNoRGV2aWNlID8gJzE0cHgnIDogJzExcHgnXG5cdH0sXG5cdG1lbnVJdGVtSG92ZXJTdHlsZToge1xuXHRcdGJhY2tncm91bmQ6ICcjNDU3MkE1Jyxcblx0XHRjb2xvcjogJyNGRkZGRkYnXG5cdH0sXG5cblx0YnV0dG9uT3B0aW9uczoge1xuXHRcdHN5bWJvbEZpbGw6ICcjRTBFMEUwJyxcblx0XHRzeW1ib2xTaXplOiAxNCxcblx0XHRzeW1ib2xTdHJva2U6ICcjNjY2Jyxcblx0XHRzeW1ib2xTdHJva2VXaWR0aDogMyxcblx0XHRzeW1ib2xYOiAxMi41LFxuXHRcdHN5bWJvbFk6IDEwLjUsXG5cdFx0YWxpZ246ICdyaWdodCcsXG5cdFx0YnV0dG9uU3BhY2luZzogMywgXG5cdFx0aGVpZ2h0OiAyMixcblx0XHQvLyB0ZXh0OiBudWxsLFxuXHRcdHRoZW1lOiB7XG5cdFx0XHRmaWxsOiAnd2hpdGUnLCAvLyBjYXB0dXJlIGhvdmVyXG5cdFx0XHRzdHJva2U6ICdub25lJ1xuXHRcdH0sXG5cdFx0dmVydGljYWxBbGlnbjogJ3RvcCcsXG5cdFx0d2lkdGg6IDI0XG5cdH1cbn07XG5cblxuXG4vLyBBZGQgdGhlIGV4cG9ydCByZWxhdGVkIG9wdGlvbnNcbmRlZmF1bHRPcHRpb25zLmV4cG9ydGluZyA9IHtcblx0Ly9lbmFibGVkOiB0cnVlLFxuXHQvL2ZpbGVuYW1lOiAnY2hhcnQnLFxuXHR0eXBlOiAnaW1hZ2UvcG5nJyxcblx0dXJsOiAnaHR0cDovL2V4cG9ydC5oaWdoY2hhcnRzLmNvbS8nLFxuXHQvL3dpZHRoOiB1bmRlZmluZWQsXG5cdC8vc2NhbGU6IDJcblx0YnV0dG9uczoge1xuXHRcdGNvbnRleHRCdXR0b246IHtcblx0XHRcdG1lbnVDbGFzc05hbWU6IFBSRUZJWCArICdjb250ZXh0bWVudScsXG5cdFx0XHQvL3g6IC0xMCxcblx0XHRcdHN5bWJvbDogJ21lbnUnLFxuXHRcdFx0X3RpdGxlS2V5OiAnY29udGV4dEJ1dHRvblRpdGxlJyxcblx0XHRcdG1lbnVJdGVtczogW3tcblx0XHRcdFx0dGV4dEtleTogJ3ByaW50Q2hhcnQnLFxuXHRcdFx0XHRvbmNsaWNrOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0dGhpcy5wcmludCgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9LCB7XG5cdFx0XHRcdHNlcGFyYXRvcjogdHJ1ZVxuXHRcdFx0fSwge1xuXHRcdFx0XHR0ZXh0S2V5OiAnZG93bmxvYWRQTkcnLFxuXHRcdFx0XHRvbmNsaWNrOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0dGhpcy5leHBvcnRDaGFydCgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9LCB7XG5cdFx0XHRcdHRleHRLZXk6ICdkb3dubG9hZEpQRUcnLFxuXHRcdFx0XHRvbmNsaWNrOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0dGhpcy5leHBvcnRDaGFydCh7XG5cdFx0XHRcdFx0XHR0eXBlOiAnaW1hZ2UvanBlZydcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXHRcdFx0fSwge1xuXHRcdFx0XHR0ZXh0S2V5OiAnZG93bmxvYWRQREYnLFxuXHRcdFx0XHRvbmNsaWNrOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0dGhpcy5leHBvcnRDaGFydCh7XG5cdFx0XHRcdFx0XHR0eXBlOiAnYXBwbGljYXRpb24vcGRmJ1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9LCB7XG5cdFx0XHRcdHRleHRLZXk6ICdkb3dubG9hZFNWRycsXG5cdFx0XHRcdG9uY2xpY2s6IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHR0aGlzLmV4cG9ydENoYXJ0KHtcblx0XHRcdFx0XHRcdHR5cGU6ICdpbWFnZS9zdmcreG1sJ1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHQvLyBFbmFibGUgdGhpcyBibG9jayB0byBhZGQgXCJWaWV3IFNWR1wiIHRvIHRoZSBkcm9wZG93biBtZW51XG5cdFx0XHQvKlxuXHRcdFx0LHtcblxuXHRcdFx0XHR0ZXh0OiAnVmlldyBTVkcnLFxuXHRcdFx0XHRvbmNsaWNrOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0dmFyIHN2ZyA9IHRoaXMuZ2V0U1ZHKClcblx0XHRcdFx0XHRcdC5yZXBsYWNlKC88L2csICdcXG4mbHQ7Jylcblx0XHRcdFx0XHRcdC5yZXBsYWNlKC8+L2csICcmZ3Q7Jyk7XG5cblx0XHRcdFx0XHRkb2MuYm9keS5pbm5lckhUTUwgPSAnPHByZT4nICsgc3ZnICsgJzwvcHJlPic7XG5cdFx0XHRcdH1cblx0XHRcdH0gLy8gKi9cblx0XHRcdF1cblx0XHR9XG5cdH1cbn07XG5cbi8vIEFkZCB0aGUgSGlnaGNoYXJ0cy5wb3N0IHV0aWxpdHlcbkhpZ2hjaGFydHMucG9zdCA9IGZ1bmN0aW9uICh1cmwsIGRhdGEpIHtcblx0dmFyIG5hbWUsXG5cdFx0Zm9ybTtcblx0XG5cdC8vIGNyZWF0ZSB0aGUgZm9ybVxuXHRmb3JtID0gY3JlYXRlRWxlbWVudCgnZm9ybScsIHtcblx0XHRtZXRob2Q6ICdwb3N0Jyxcblx0XHRhY3Rpb246IHVybCxcblx0XHRlbmN0eXBlOiAnbXVsdGlwYXJ0L2Zvcm0tZGF0YSdcblx0fSwge1xuXHRcdGRpc3BsYXk6IE5PTkVcblx0fSwgZG9jLmJvZHkpO1xuXG5cdC8vIGFkZCB0aGUgZGF0YVxuXHRmb3IgKG5hbWUgaW4gZGF0YSkge1xuXHRcdGNyZWF0ZUVsZW1lbnQoJ2lucHV0Jywge1xuXHRcdFx0dHlwZTogSElEREVOLFxuXHRcdFx0bmFtZTogbmFtZSxcblx0XHRcdHZhbHVlOiBkYXRhW25hbWVdXG5cdFx0fSwgbnVsbCwgZm9ybSk7XG5cdH1cblxuXHQvLyBzdWJtaXRcblx0Zm9ybS5zdWJtaXQoKTtcblxuXHQvLyBjbGVhbiB1cFxuXHRkaXNjYXJkRWxlbWVudChmb3JtKTtcbn07XG5cbmV4dGVuZChDaGFydC5wcm90b3R5cGUsIHtcblxuXHQvKipcblx0ICogUmV0dXJuIGFuIFNWRyByZXByZXNlbnRhdGlvbiBvZiB0aGUgY2hhcnRcblx0ICpcblx0ICogQHBhcmFtIGFkZGl0aW9uYWxPcHRpb25zIHtPYmplY3R9IEFkZGl0aW9uYWwgY2hhcnQgb3B0aW9ucyBmb3IgdGhlIGdlbmVyYXRlZCBTVkcgcmVwcmVzZW50YXRpb25cblx0ICovXG5cdGdldFNWRzogZnVuY3Rpb24gKGFkZGl0aW9uYWxPcHRpb25zKSB7XG5cdFx0dmFyIGNoYXJ0ID0gdGhpcyxcblx0XHRcdGNoYXJ0Q29weSxcblx0XHRcdHNhbmRib3gsXG5cdFx0XHRzdmcsXG5cdFx0XHRzZXJpZXNPcHRpb25zLFxuXHRcdFx0c291cmNlV2lkdGgsXG5cdFx0XHRzb3VyY2VIZWlnaHQsXG5cdFx0XHRjc3NXaWR0aCxcblx0XHRcdGNzc0hlaWdodCxcblx0XHRcdG9wdGlvbnMgPSBtZXJnZShjaGFydC5vcHRpb25zLCBhZGRpdGlvbmFsT3B0aW9ucyk7IC8vIGNvcHkgdGhlIG9wdGlvbnMgYW5kIGFkZCBleHRyYSBvcHRpb25zXG5cblx0XHQvLyBJRSBjb21wYXRpYmlsaXR5IGhhY2sgZm9yIGdlbmVyYXRpbmcgU1ZHIGNvbnRlbnQgdGhhdCBpdCBkb2Vzbid0IHJlYWxseSB1bmRlcnN0YW5kXG5cdFx0aWYgKCFkb2MuY3JlYXRlRWxlbWVudE5TKSB7XG5cdFx0XHQvKmpzbGludCB1bnBhcmFtOiB0cnVlKi8vKiBhbGxvdyB1bnVzZWQgcGFyYW1ldGVyIG5zIGluIGZ1bmN0aW9uIGJlbG93ICovXG5cdFx0XHRkb2MuY3JlYXRlRWxlbWVudE5TID0gZnVuY3Rpb24gKG5zLCB0YWdOYW1lKSB7XG5cdFx0XHRcdHJldHVybiBkb2MuY3JlYXRlRWxlbWVudCh0YWdOYW1lKTtcblx0XHRcdH07XG5cdFx0XHQvKmpzbGludCB1bnBhcmFtOiBmYWxzZSovXG5cdFx0fVxuXG5cdFx0Ly8gY3JlYXRlIGEgc2FuZGJveCB3aGVyZSBhIG5ldyBjaGFydCB3aWxsIGJlIGdlbmVyYXRlZFxuXHRcdHNhbmRib3ggPSBjcmVhdGVFbGVtZW50KERJViwgbnVsbCwge1xuXHRcdFx0cG9zaXRpb246IEFCU09MVVRFLFxuXHRcdFx0dG9wOiAnLTk5OTllbScsXG5cdFx0XHR3aWR0aDogY2hhcnQuY2hhcnRXaWR0aCArIFBYLFxuXHRcdFx0aGVpZ2h0OiBjaGFydC5jaGFydEhlaWdodCArIFBYXG5cdFx0fSwgZG9jLmJvZHkpO1xuXHRcdFxuXHRcdC8vIGdldCB0aGUgc291cmNlIHNpemVcblx0XHRjc3NXaWR0aCA9IGNoYXJ0LnJlbmRlclRvLnN0eWxlLndpZHRoO1xuXHRcdGNzc0hlaWdodCA9IGNoYXJ0LnJlbmRlclRvLnN0eWxlLmhlaWdodDtcblx0XHRzb3VyY2VXaWR0aCA9IG9wdGlvbnMuZXhwb3J0aW5nLnNvdXJjZVdpZHRoIHx8XG5cdFx0XHRvcHRpb25zLmNoYXJ0LndpZHRoIHx8XG5cdFx0XHQoL3B4JC8udGVzdChjc3NXaWR0aCkgJiYgcGFyc2VJbnQoY3NzV2lkdGgsIDEwKSkgfHxcblx0XHRcdDYwMDtcblx0XHRzb3VyY2VIZWlnaHQgPSBvcHRpb25zLmV4cG9ydGluZy5zb3VyY2VIZWlnaHQgfHxcblx0XHRcdG9wdGlvbnMuY2hhcnQuaGVpZ2h0IHx8XG5cdFx0XHQoL3B4JC8udGVzdChjc3NIZWlnaHQpICYmIHBhcnNlSW50KGNzc0hlaWdodCwgMTApKSB8fFxuXHRcdFx0NDAwO1xuXG5cdFx0Ly8gb3ZlcnJpZGUgc29tZSBvcHRpb25zXG5cdFx0ZXh0ZW5kKG9wdGlvbnMuY2hhcnQsIHtcblx0XHRcdGFuaW1hdGlvbjogZmFsc2UsXG5cdFx0XHRyZW5kZXJUbzogc2FuZGJveCxcblx0XHRcdGZvckV4cG9ydDogdHJ1ZSxcblx0XHRcdHdpZHRoOiBzb3VyY2VXaWR0aCxcblx0XHRcdGhlaWdodDogc291cmNlSGVpZ2h0XG5cdFx0fSk7XG5cdFx0b3B0aW9ucy5leHBvcnRpbmcuZW5hYmxlZCA9IGZhbHNlOyAvLyBoaWRlIGJ1dHRvbnMgaW4gcHJpbnRcblx0XHRcblx0XHQvLyBwcmVwYXJlIGZvciByZXBsaWNhdGluZyB0aGUgY2hhcnRcblx0XHRvcHRpb25zLnNlcmllcyA9IFtdO1xuXHRcdGVhY2goY2hhcnQuc2VyaWVzLCBmdW5jdGlvbiAoc2VyaWUpIHtcblx0XHRcdHNlcmllc09wdGlvbnMgPSBtZXJnZShzZXJpZS5vcHRpb25zLCB7XG5cdFx0XHRcdGFuaW1hdGlvbjogZmFsc2UsIC8vIHR1cm4gb2ZmIGFuaW1hdGlvblxuXHRcdFx0XHRzaG93Q2hlY2tib3g6IGZhbHNlLFxuXHRcdFx0XHR2aXNpYmxlOiBzZXJpZS52aXNpYmxlXG5cdFx0XHR9KTtcblxuXHRcdFx0aWYgKCFzZXJpZXNPcHRpb25zLmlzSW50ZXJuYWwpIHsgLy8gdXNlZCBmb3IgdGhlIG5hdmlnYXRvciBzZXJpZXMgdGhhdCBoYXMgaXRzIG93biBvcHRpb24gc2V0XG5cdFx0XHRcdG9wdGlvbnMuc2VyaWVzLnB1c2goc2VyaWVzT3B0aW9ucyk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQvLyBnZW5lcmF0ZSB0aGUgY2hhcnQgY29weVxuXHRcdGNoYXJ0Q29weSA9IG5ldyBIaWdoY2hhcnRzLkNoYXJ0KG9wdGlvbnMsIGNoYXJ0LmNhbGxiYWNrKTtcblxuXHRcdC8vIHJlZmxlY3QgYXhpcyBleHRyZW1lcyBpbiB0aGUgZXhwb3J0XG5cdFx0ZWFjaChbJ3hBeGlzJywgJ3lBeGlzJ10sIGZ1bmN0aW9uIChheGlzVHlwZSkge1xuXHRcdFx0ZWFjaChjaGFydFtheGlzVHlwZV0sIGZ1bmN0aW9uIChheGlzLCBpKSB7XG5cdFx0XHRcdHZhciBheGlzQ29weSA9IGNoYXJ0Q29weVtheGlzVHlwZV1baV0sXG5cdFx0XHRcdFx0ZXh0cmVtZXMgPSBheGlzLmdldEV4dHJlbWVzKCksXG5cdFx0XHRcdFx0dXNlck1pbiA9IGV4dHJlbWVzLnVzZXJNaW4sXG5cdFx0XHRcdFx0dXNlck1heCA9IGV4dHJlbWVzLnVzZXJNYXg7XG5cblx0XHRcdFx0aWYgKGF4aXNDb3B5ICYmICh1c2VyTWluICE9PSBVTkRFRklORUQgfHwgdXNlck1heCAhPT0gVU5ERUZJTkVEKSkge1xuXHRcdFx0XHRcdGF4aXNDb3B5LnNldEV4dHJlbWVzKHVzZXJNaW4sIHVzZXJNYXgsIHRydWUsIGZhbHNlKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHQvLyBnZXQgdGhlIFNWRyBmcm9tIHRoZSBjb250YWluZXIncyBpbm5lckhUTUxcblx0XHRzdmcgPSBjaGFydENvcHkuY29udGFpbmVyLmlubmVySFRNTDtcblxuXHRcdC8vIGZyZWUgdXAgbWVtb3J5XG5cdFx0b3B0aW9ucyA9IG51bGw7XG5cdFx0Y2hhcnRDb3B5LmRlc3Ryb3koKTtcblx0XHRkaXNjYXJkRWxlbWVudChzYW5kYm94KTtcblxuXHRcdC8vIHNhbml0aXplXG5cdFx0c3ZnID0gc3ZnXG5cdFx0XHQucmVwbGFjZSgvekluZGV4PVwiW15cIl0rXCIvZywgJycpXG5cdFx0XHQucmVwbGFjZSgvaXNTaGFkb3c9XCJbXlwiXStcIi9nLCAnJylcblx0XHRcdC5yZXBsYWNlKC9zeW1ib2xOYW1lPVwiW15cIl0rXCIvZywgJycpXG5cdFx0XHQucmVwbGFjZSgvalF1ZXJ5WzAtOV0rPVwiW15cIl0rXCIvZywgJycpXG5cdFx0XHQucmVwbGFjZSgvdXJsXFwoW14jXSsjL2csICd1cmwoIycpXG5cdFx0XHQucmVwbGFjZSgvPHN2ZyAvLCAnPHN2ZyB4bWxuczp4bGluaz1cImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmtcIiAnKVxuXHRcdFx0LnJlcGxhY2UoLyBocmVmPS9nLCAnIHhsaW5rOmhyZWY9Jylcblx0XHRcdC5yZXBsYWNlKC9cXG4vLCAnICcpXG5cdFx0XHQucmVwbGFjZSgvPFxcL3N2Zz4uKj8kLywgJzwvc3ZnPicpIC8vIGFueSBIVE1MIGFkZGVkIHRvIHRoZSBjb250YWluZXIgYWZ0ZXIgdGhlIFNWRyAoIzg5NClcblx0XHRcdC8qIFRoaXMgZmFpbHMgaW4gSUUgPCA4XG5cdFx0XHQucmVwbGFjZSgvKFswLTldKylcXC4oWzAtOV0rKS9nLCBmdW5jdGlvbihzMSwgczIsIHMzKSB7IC8vIHJvdW5kIG9mZiB0byBzYXZlIHdlaWdodFxuXHRcdFx0XHRyZXR1cm4gczIgKycuJysgczNbMF07XG5cdFx0XHR9KSovXG5cblx0XHRcdC8vIFJlcGxhY2UgSFRNTCBlbnRpdGllcywgaXNzdWUgIzM0N1xuXHRcdFx0LnJlcGxhY2UoLyZuYnNwOy9nLCAnXFx1MDBBMCcpIC8vIG5vLWJyZWFrIHNwYWNlXG5cdFx0XHQucmVwbGFjZSgvJnNoeTsvZywgICdcXHUwMEFEJykgLy8gc29mdCBoeXBoZW5cblxuXHRcdFx0Ly8gSUUgc3BlY2lmaWNcblx0XHRcdC5yZXBsYWNlKC88SU1HIC9nLCAnPGltYWdlICcpXG5cdFx0XHQucmVwbGFjZSgvaGVpZ2h0PShbXlwiIF0rKS9nLCAnaGVpZ2h0PVwiJDFcIicpXG5cdFx0XHQucmVwbGFjZSgvd2lkdGg9KFteXCIgXSspL2csICd3aWR0aD1cIiQxXCInKVxuXHRcdFx0LnJlcGxhY2UoL2hjLXN2Zy1ocmVmPVwiKFteXCJdKylcIj4vZywgJ3hsaW5rOmhyZWY9XCIkMVwiLz4nKVxuXHRcdFx0LnJlcGxhY2UoL2lkPShbXlwiID5dKykvZywgJ2lkPVwiJDFcIicpXG5cdFx0XHQucmVwbGFjZSgvY2xhc3M9KFteXCIgPl0rKS9nLCAnY2xhc3M9XCIkMVwiJylcblx0XHRcdC5yZXBsYWNlKC8gdHJhbnNmb3JtIC9nLCAnICcpXG5cdFx0XHQucmVwbGFjZSgvOihwYXRofHJlY3QpL2csICckMScpXG5cdFx0XHQucmVwbGFjZSgvc3R5bGU9XCIoW15cIl0rKVwiL2csIGZ1bmN0aW9uIChzKSB7XG5cdFx0XHRcdHJldHVybiBzLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHR9KTtcblxuXHRcdC8vIElFOSBiZXRhIGJ1Z3Mgd2l0aCBpbm5lckhUTUwuIFRlc3QgYWdhaW4gd2l0aCBmaW5hbCBJRTkuXG5cdFx0c3ZnID0gc3ZnLnJlcGxhY2UoLyh1cmxcXCgjaGlnaGNoYXJ0cy1bMC05XSspJnF1b3Q7L2csICckMScpXG5cdFx0XHQucmVwbGFjZSgvJnF1b3Q7L2csIFwiJ1wiKTtcblxuXHRcdHJldHVybiBzdmc7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFN1Ym1pdCB0aGUgU1ZHIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBjaGFydCB0byB0aGUgc2VydmVyXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIEV4cG9ydGluZyBvcHRpb25zLiBQb3NzaWJsZSBtZW1iZXJzIGFyZSB1cmwsIHR5cGUgYW5kIHdpZHRoLlxuXHQgKiBAcGFyYW0ge09iamVjdH0gY2hhcnRPcHRpb25zIEFkZGl0aW9uYWwgY2hhcnQgb3B0aW9ucyBmb3IgdGhlIFNWRyByZXByZXNlbnRhdGlvbiBvZiB0aGUgY2hhcnRcblx0ICovXG5cdGV4cG9ydENoYXJ0OiBmdW5jdGlvbiAob3B0aW9ucywgY2hhcnRPcHRpb25zKSB7XG5cdFx0b3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cdFx0XG5cdFx0dmFyIGNoYXJ0ID0gdGhpcyxcblx0XHRcdGNoYXJ0RXhwb3J0aW5nT3B0aW9ucyA9IGNoYXJ0Lm9wdGlvbnMuZXhwb3J0aW5nLFxuXHRcdFx0c3ZnID0gY2hhcnQuZ2V0U1ZHKG1lcmdlKFxuXHRcdFx0XHR7IGNoYXJ0OiB7IGJvcmRlclJhZGl1czogMCB9IH0sXG5cdFx0XHRcdGNoYXJ0RXhwb3J0aW5nT3B0aW9ucy5jaGFydE9wdGlvbnMsXG5cdFx0XHRcdGNoYXJ0T3B0aW9ucywgXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRleHBvcnRpbmc6IHtcblx0XHRcdFx0XHRcdHNvdXJjZVdpZHRoOiBvcHRpb25zLnNvdXJjZVdpZHRoIHx8IGNoYXJ0RXhwb3J0aW5nT3B0aW9ucy5zb3VyY2VXaWR0aCxcblx0XHRcdFx0XHRcdHNvdXJjZUhlaWdodDogb3B0aW9ucy5zb3VyY2VIZWlnaHQgfHwgY2hhcnRFeHBvcnRpbmdPcHRpb25zLnNvdXJjZUhlaWdodFxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0KSk7XG5cblx0XHQvLyBtZXJnZSB0aGUgb3B0aW9uc1xuXHRcdG9wdGlvbnMgPSBtZXJnZShjaGFydC5vcHRpb25zLmV4cG9ydGluZywgb3B0aW9ucyk7XG5cdFx0XG5cdFx0Ly8gZG8gdGhlIHBvc3Rcblx0XHRIaWdoY2hhcnRzLnBvc3Qob3B0aW9ucy51cmwsIHtcblx0XHRcdGZpbGVuYW1lOiBvcHRpb25zLmZpbGVuYW1lIHx8ICdjaGFydCcsXG5cdFx0XHR0eXBlOiBvcHRpb25zLnR5cGUsXG5cdFx0XHR3aWR0aDogb3B0aW9ucy53aWR0aCB8fCAwLCAvLyBJRTggZmFpbHMgdG8gcG9zdCB1bmRlZmluZWQgY29ycmVjdGx5LCBzbyB1c2UgMFxuXHRcdFx0c2NhbGU6IG9wdGlvbnMuc2NhbGUgfHwgMixcblx0XHRcdHN2Zzogc3ZnXG5cdFx0fSk7XG5cblx0fSxcblx0XG5cdC8qKlxuXHQgKiBQcmludCB0aGUgY2hhcnRcblx0ICovXG5cdHByaW50OiBmdW5jdGlvbiAoKSB7XG5cblx0XHR2YXIgY2hhcnQgPSB0aGlzLFxuXHRcdFx0Y29udGFpbmVyID0gY2hhcnQuY29udGFpbmVyLFxuXHRcdFx0b3JpZ0Rpc3BsYXkgPSBbXSxcblx0XHRcdG9yaWdQYXJlbnQgPSBjb250YWluZXIucGFyZW50Tm9kZSxcblx0XHRcdGJvZHkgPSBkb2MuYm9keSxcblx0XHRcdGNoaWxkTm9kZXMgPSBib2R5LmNoaWxkTm9kZXM7XG5cblx0XHRpZiAoY2hhcnQuaXNQcmludGluZykgeyAvLyBibG9jayB0aGUgYnV0dG9uIHdoaWxlIGluIHByaW50aW5nIG1vZGVcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRjaGFydC5pc1ByaW50aW5nID0gdHJ1ZTtcblxuXHRcdC8vIGhpZGUgYWxsIGJvZHkgY29udGVudFxuXHRcdGVhY2goY2hpbGROb2RlcywgZnVuY3Rpb24gKG5vZGUsIGkpIHtcblx0XHRcdGlmIChub2RlLm5vZGVUeXBlID09PSAxKSB7XG5cdFx0XHRcdG9yaWdEaXNwbGF5W2ldID0gbm9kZS5zdHlsZS5kaXNwbGF5O1xuXHRcdFx0XHRub2RlLnN0eWxlLmRpc3BsYXkgPSBOT05FO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gcHVsbCBvdXQgdGhlIGNoYXJ0XG5cdFx0Ym9keS5hcHBlbmRDaGlsZChjb250YWluZXIpO1xuXG5cdFx0Ly8gcHJpbnRcblx0XHR3aW4uZm9jdXMoKTsgLy8gIzE1MTBcblx0XHR3aW4ucHJpbnQoKTtcblxuXHRcdC8vIGFsbG93IHRoZSBicm93c2VyIHRvIHByZXBhcmUgYmVmb3JlIHJldmVydGluZ1xuXHRcdHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXG5cdFx0XHQvLyBwdXQgdGhlIGNoYXJ0IGJhY2sgaW5cblx0XHRcdG9yaWdQYXJlbnQuYXBwZW5kQ2hpbGQoY29udGFpbmVyKTtcblxuXHRcdFx0Ly8gcmVzdG9yZSBhbGwgYm9keSBjb250ZW50XG5cdFx0XHRlYWNoKGNoaWxkTm9kZXMsIGZ1bmN0aW9uIChub2RlLCBpKSB7XG5cdFx0XHRcdGlmIChub2RlLm5vZGVUeXBlID09PSAxKSB7XG5cdFx0XHRcdFx0bm9kZS5zdHlsZS5kaXNwbGF5ID0gb3JpZ0Rpc3BsYXlbaV07XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHRjaGFydC5pc1ByaW50aW5nID0gZmFsc2U7XG5cblx0XHR9LCAxMDAwKTtcblxuXHR9LFxuXG5cdC8qKlxuXHQgKiBEaXNwbGF5IGEgcG9wdXAgbWVudSBmb3IgY2hvb3NpbmcgdGhlIGV4cG9ydCB0eXBlXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBjbGFzc05hbWUgQW4gaWRlbnRpZmllciBmb3IgdGhlIG1lbnVcblx0ICogQHBhcmFtIHtBcnJheX0gaXRlbXMgQSBjb2xsZWN0aW9uIHdpdGggdGV4dCBhbmQgb25jbGlja3MgZm9yIHRoZSBpdGVtc1xuXHQgKiBAcGFyYW0ge051bWJlcn0geCBUaGUgeCBwb3NpdGlvbiBvZiB0aGUgb3BlbmVyIGJ1dHRvblxuXHQgKiBAcGFyYW0ge051bWJlcn0geSBUaGUgeSBwb3NpdGlvbiBvZiB0aGUgb3BlbmVyIGJ1dHRvblxuXHQgKiBAcGFyYW0ge051bWJlcn0gd2lkdGggVGhlIHdpZHRoIG9mIHRoZSBvcGVuZXIgYnV0dG9uXG5cdCAqIEBwYXJhbSB7TnVtYmVyfSBoZWlnaHQgVGhlIGhlaWdodCBvZiB0aGUgb3BlbmVyIGJ1dHRvblxuXHQgKi9cblx0Y29udGV4dE1lbnU6IGZ1bmN0aW9uIChjbGFzc05hbWUsIGl0ZW1zLCB4LCB5LCB3aWR0aCwgaGVpZ2h0LCBidXR0b24pIHtcblx0XHR2YXIgY2hhcnQgPSB0aGlzLFxuXHRcdFx0bmF2T3B0aW9ucyA9IGNoYXJ0Lm9wdGlvbnMubmF2aWdhdGlvbixcblx0XHRcdG1lbnVJdGVtU3R5bGUgPSBuYXZPcHRpb25zLm1lbnVJdGVtU3R5bGUsXG5cdFx0XHRjaGFydFdpZHRoID0gY2hhcnQuY2hhcnRXaWR0aCxcblx0XHRcdGNoYXJ0SGVpZ2h0ID0gY2hhcnQuY2hhcnRIZWlnaHQsXG5cdFx0XHRjYWNoZU5hbWUgPSAnY2FjaGUtJyArIGNsYXNzTmFtZSxcblx0XHRcdG1lbnUgPSBjaGFydFtjYWNoZU5hbWVdLFxuXHRcdFx0bWVudVBhZGRpbmcgPSBtYXRoTWF4KHdpZHRoLCBoZWlnaHQpLCAvLyBmb3IgbW91c2UgbGVhdmUgZGV0ZWN0aW9uXG5cdFx0XHRib3hTaGFkb3cgPSAnM3B4IDNweCAxMHB4ICM4ODgnLFxuXHRcdFx0aW5uZXJNZW51LFxuXHRcdFx0aGlkZSxcblx0XHRcdGhpZGVUaW1lcixcblx0XHRcdG1lbnVTdHlsZTtcblxuXHRcdC8vIGNyZWF0ZSB0aGUgbWVudSBvbmx5IHRoZSBmaXJzdCB0aW1lXG5cdFx0aWYgKCFtZW51KSB7XG5cblx0XHRcdC8vIGNyZWF0ZSBhIEhUTUwgZWxlbWVudCBhYm92ZSB0aGUgU1ZHXG5cdFx0XHRjaGFydFtjYWNoZU5hbWVdID0gbWVudSA9IGNyZWF0ZUVsZW1lbnQoRElWLCB7XG5cdFx0XHRcdGNsYXNzTmFtZTogY2xhc3NOYW1lXG5cdFx0XHR9LCB7XG5cdFx0XHRcdHBvc2l0aW9uOiBBQlNPTFVURSxcblx0XHRcdFx0ekluZGV4OiAxMDAwLFxuXHRcdFx0XHRwYWRkaW5nOiBtZW51UGFkZGluZyArIFBYXG5cdFx0XHR9LCBjaGFydC5jb250YWluZXIpO1xuXG5cdFx0XHRpbm5lck1lbnUgPSBjcmVhdGVFbGVtZW50KERJViwgbnVsbCxcblx0XHRcdFx0ZXh0ZW5kKHtcblx0XHRcdFx0XHRNb3pCb3hTaGFkb3c6IGJveFNoYWRvdyxcblx0XHRcdFx0XHRXZWJraXRCb3hTaGFkb3c6IGJveFNoYWRvdyxcblx0XHRcdFx0XHRib3hTaGFkb3c6IGJveFNoYWRvd1xuXHRcdFx0XHR9LCBuYXZPcHRpb25zLm1lbnVTdHlsZSksIG1lbnUpO1xuXG5cdFx0XHQvLyBoaWRlIG9uIG1vdXNlIG91dFxuXHRcdFx0aGlkZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0Y3NzKG1lbnUsIHsgZGlzcGxheTogTk9ORSB9KTtcblx0XHRcdFx0aWYgKGJ1dHRvbikge1xuXHRcdFx0XHRcdGJ1dHRvbi5zZXRTdGF0ZSgwKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRjaGFydC5vcGVuTWVudSA9IGZhbHNlO1xuXHRcdFx0fTtcblxuXHRcdFx0Ly8gSGlkZSB0aGUgbWVudSBzb21lIHRpbWUgYWZ0ZXIgbW91c2UgbGVhdmUgKCMxMzU3KVxuXHRcdFx0YWRkRXZlbnQobWVudSwgJ21vdXNlbGVhdmUnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdGhpZGVUaW1lciA9IHNldFRpbWVvdXQoaGlkZSwgNTAwKTtcblx0XHRcdH0pO1xuXHRcdFx0YWRkRXZlbnQobWVudSwgJ21vdXNlZW50ZXInLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdGNsZWFyVGltZW91dChoaWRlVGltZXIpO1xuXHRcdFx0fSk7XG5cdFx0XHQvLyBIaWRlIGl0IG9uIGNsaWNraW5nIG9yIHRvdWNoaW5nIG91dHNpZGUgdGhlIG1lbnUgKCMyMjU4KVxuXHRcdFx0YWRkRXZlbnQoZG9jdW1lbnQsICdtb3VzZWRvd24nLCBmdW5jdGlvbiAoZSkge1xuXHRcdFx0XHRpZiAoIWNoYXJ0LnBvaW50ZXIuaW5DbGFzcyhlLnRhcmdldCwgY2xhc3NOYW1lKSkge1xuXHRcdFx0XHRcdGhpZGUoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblxuXHRcdFx0Ly8gY3JlYXRlIHRoZSBpdGVtc1xuXHRcdFx0ZWFjaChpdGVtcywgZnVuY3Rpb24gKGl0ZW0pIHtcblx0XHRcdFx0aWYgKGl0ZW0pIHtcblx0XHRcdFx0XHR2YXIgZWxlbWVudCA9IGl0ZW0uc2VwYXJhdG9yID8gXG5cdFx0XHRcdFx0XHRjcmVhdGVFbGVtZW50KCdocicsIG51bGwsIG51bGwsIGlubmVyTWVudSkgOlxuXHRcdFx0XHRcdFx0Y3JlYXRlRWxlbWVudChESVYsIHtcblx0XHRcdFx0XHRcdFx0b25tb3VzZW92ZXI6IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRcdFx0XHRjc3ModGhpcywgbmF2T3B0aW9ucy5tZW51SXRlbUhvdmVyU3R5bGUpO1xuXHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRvbm1vdXNlb3V0OiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0XHRcdFx0Y3NzKHRoaXMsIG1lbnVJdGVtU3R5bGUpO1xuXHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRvbmNsaWNrOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0XHRcdFx0aGlkZSgpO1xuXHRcdFx0XHRcdFx0XHRcdGl0ZW0ub25jbGljay5hcHBseShjaGFydCwgYXJndW1lbnRzKTtcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0aW5uZXJIVE1MOiBpdGVtLnRleHQgfHwgY2hhcnQub3B0aW9ucy5sYW5nW2l0ZW0udGV4dEtleV1cblx0XHRcdFx0XHRcdH0sIGV4dGVuZCh7XG5cdFx0XHRcdFx0XHRcdGN1cnNvcjogJ3BvaW50ZXInXG5cdFx0XHRcdFx0XHR9LCBtZW51SXRlbVN0eWxlKSwgaW5uZXJNZW51KTtcblxuXG5cdFx0XHRcdFx0Ly8gS2VlcCByZWZlcmVuY2VzIHRvIG1lbnUgZGl2cyB0byBiZSBhYmxlIHRvIGRlc3Ryb3kgdGhlbVxuXHRcdFx0XHRcdGNoYXJ0LmV4cG9ydERpdkVsZW1lbnRzLnB1c2goZWxlbWVudCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHQvLyBLZWVwIHJlZmVyZW5jZXMgdG8gbWVudSBhbmQgaW5uZXJNZW51IGRpdiB0byBiZSBhYmxlIHRvIGRlc3Ryb3kgdGhlbVxuXHRcdFx0Y2hhcnQuZXhwb3J0RGl2RWxlbWVudHMucHVzaChpbm5lck1lbnUsIG1lbnUpO1xuXG5cdFx0XHRjaGFydC5leHBvcnRNZW51V2lkdGggPSBtZW51Lm9mZnNldFdpZHRoO1xuXHRcdFx0Y2hhcnQuZXhwb3J0TWVudUhlaWdodCA9IG1lbnUub2Zmc2V0SGVpZ2h0O1xuXHRcdH1cblxuXHRcdG1lbnVTdHlsZSA9IHsgZGlzcGxheTogJ2Jsb2NrJyB9O1xuXG5cdFx0Ly8gaWYgb3V0c2lkZSByaWdodCwgcmlnaHQgYWxpZ24gaXRcblx0XHRpZiAoeCArIGNoYXJ0LmV4cG9ydE1lbnVXaWR0aCA+IGNoYXJ0V2lkdGgpIHtcblx0XHRcdG1lbnVTdHlsZS5yaWdodCA9IChjaGFydFdpZHRoIC0geCAtIHdpZHRoIC0gbWVudVBhZGRpbmcpICsgUFg7XG5cdFx0fSBlbHNlIHtcblx0XHRcdG1lbnVTdHlsZS5sZWZ0ID0gKHggLSBtZW51UGFkZGluZykgKyBQWDtcblx0XHR9XG5cdFx0Ly8gaWYgb3V0c2lkZSBib3R0b20sIGJvdHRvbSBhbGlnbiBpdFxuXHRcdGlmICh5ICsgaGVpZ2h0ICsgY2hhcnQuZXhwb3J0TWVudUhlaWdodCA+IGNoYXJ0SGVpZ2h0ICYmIGJ1dHRvbi5hbGlnbk9wdGlvbnMudmVydGljYWxBbGlnbiAhPT0gJ3RvcCcpIHtcblx0XHRcdG1lbnVTdHlsZS5ib3R0b20gPSAoY2hhcnRIZWlnaHQgLSB5IC0gbWVudVBhZGRpbmcpICArIFBYO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRtZW51U3R5bGUudG9wID0gKHkgKyBoZWlnaHQgLSBtZW51UGFkZGluZykgKyBQWDtcblx0XHR9XG5cblx0XHRjc3MobWVudSwgbWVudVN0eWxlKTtcblx0XHRjaGFydC5vcGVuTWVudSA9IHRydWU7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEFkZCB0aGUgZXhwb3J0IGJ1dHRvbiB0byB0aGUgY2hhcnRcblx0ICovXG5cdGFkZEJ1dHRvbjogZnVuY3Rpb24gKG9wdGlvbnMpIHtcblx0XHR2YXIgY2hhcnQgPSB0aGlzLFxuXHRcdFx0cmVuZGVyZXIgPSBjaGFydC5yZW5kZXJlcixcblx0XHRcdGJ0bk9wdGlvbnMgPSBtZXJnZShjaGFydC5vcHRpb25zLm5hdmlnYXRpb24uYnV0dG9uT3B0aW9ucywgb3B0aW9ucyksXG5cdFx0XHRvbmNsaWNrID0gYnRuT3B0aW9ucy5vbmNsaWNrLFxuXHRcdFx0bWVudUl0ZW1zID0gYnRuT3B0aW9ucy5tZW51SXRlbXMsXG5cdFx0XHRzeW1ib2wsXG5cdFx0XHRidXR0b24sXG5cdFx0XHRzeW1ib2xBdHRyID0ge1xuXHRcdFx0XHRzdHJva2U6IGJ0bk9wdGlvbnMuc3ltYm9sU3Ryb2tlLFxuXHRcdFx0XHRmaWxsOiBidG5PcHRpb25zLnN5bWJvbEZpbGxcblx0XHRcdH0sXG5cdFx0XHRzeW1ib2xTaXplID0gYnRuT3B0aW9ucy5zeW1ib2xTaXplIHx8IDEyO1xuXHRcdGlmICghY2hhcnQuYnRuQ291bnQpIHtcblx0XHRcdGNoYXJ0LmJ0bkNvdW50ID0gMDtcblx0XHR9XG5cblx0XHQvLyBLZWVwcyByZWZlcmVuY2VzIHRvIHRoZSBidXR0b24gZWxlbWVudHNcblx0XHRpZiAoIWNoYXJ0LmV4cG9ydERpdkVsZW1lbnRzKSB7XG5cdFx0XHRjaGFydC5leHBvcnREaXZFbGVtZW50cyA9IFtdO1xuXHRcdFx0Y2hhcnQuZXhwb3J0U1ZHRWxlbWVudHMgPSBbXTtcblx0XHR9XG5cblx0XHRpZiAoYnRuT3B0aW9ucy5lbmFibGVkID09PSBmYWxzZSkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXG5cdFx0dmFyIGF0dHIgPSBidG5PcHRpb25zLnRoZW1lLFxuXHRcdFx0c3RhdGVzID0gYXR0ci5zdGF0ZXMsXG5cdFx0XHRob3ZlciA9IHN0YXRlcyAmJiBzdGF0ZXMuaG92ZXIsXG5cdFx0XHRzZWxlY3QgPSBzdGF0ZXMgJiYgc3RhdGVzLnNlbGVjdCxcblx0XHRcdGNhbGxiYWNrO1xuXG5cdFx0ZGVsZXRlIGF0dHIuc3RhdGVzO1xuXG5cdFx0aWYgKG9uY2xpY2spIHtcblx0XHRcdGNhbGxiYWNrID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRvbmNsaWNrLmFwcGx5KGNoYXJ0LCBhcmd1bWVudHMpO1xuXHRcdFx0fTtcblxuXHRcdH0gZWxzZSBpZiAobWVudUl0ZW1zKSB7XG5cdFx0XHRjYWxsYmFjayA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0Y2hhcnQuY29udGV4dE1lbnUoXG5cdFx0XHRcdFx0YnV0dG9uLm1lbnVDbGFzc05hbWUsIFxuXHRcdFx0XHRcdG1lbnVJdGVtcywgXG5cdFx0XHRcdFx0YnV0dG9uLnRyYW5zbGF0ZVgsIFxuXHRcdFx0XHRcdGJ1dHRvbi50cmFuc2xhdGVZLCBcblx0XHRcdFx0XHRidXR0b24ud2lkdGgsIFxuXHRcdFx0XHRcdGJ1dHRvbi5oZWlnaHQsXG5cdFx0XHRcdFx0YnV0dG9uXG5cdFx0XHRcdCk7XG5cdFx0XHRcdGJ1dHRvbi5zZXRTdGF0ZSgyKTtcblx0XHRcdH07XG5cdFx0fVxuXG5cblx0XHRpZiAoYnRuT3B0aW9ucy50ZXh0ICYmIGJ0bk9wdGlvbnMuc3ltYm9sKSB7XG5cdFx0XHRhdHRyLnBhZGRpbmdMZWZ0ID0gSGlnaGNoYXJ0cy5waWNrKGF0dHIucGFkZGluZ0xlZnQsIDI1KTtcblx0XHRcblx0XHR9IGVsc2UgaWYgKCFidG5PcHRpb25zLnRleHQpIHtcblx0XHRcdGV4dGVuZChhdHRyLCB7XG5cdFx0XHRcdHdpZHRoOiBidG5PcHRpb25zLndpZHRoLFxuXHRcdFx0XHRoZWlnaHQ6IGJ0bk9wdGlvbnMuaGVpZ2h0LFxuXHRcdFx0XHRwYWRkaW5nOiAwXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRidXR0b24gPSByZW5kZXJlci5idXR0b24oYnRuT3B0aW9ucy50ZXh0LCAwLCAwLCBjYWxsYmFjaywgYXR0ciwgaG92ZXIsIHNlbGVjdClcblx0XHRcdC5hdHRyKHtcblx0XHRcdFx0dGl0bGU6IGNoYXJ0Lm9wdGlvbnMubGFuZ1tidG5PcHRpb25zLl90aXRsZUtleV0sXG5cdFx0XHRcdCdzdHJva2UtbGluZWNhcCc6ICdyb3VuZCdcblx0XHRcdH0pO1xuXHRcdGJ1dHRvbi5tZW51Q2xhc3NOYW1lID0gb3B0aW9ucy5tZW51Q2xhc3NOYW1lIHx8IFBSRUZJWCArICdtZW51LScgKyBjaGFydC5idG5Db3VudCsrO1xuXG5cdFx0aWYgKGJ0bk9wdGlvbnMuc3ltYm9sKSB7XG5cdFx0XHRzeW1ib2wgPSByZW5kZXJlci5zeW1ib2woXG5cdFx0XHRcdFx0YnRuT3B0aW9ucy5zeW1ib2wsXG5cdFx0XHRcdFx0YnRuT3B0aW9ucy5zeW1ib2xYIC0gKHN5bWJvbFNpemUgLyAyKSxcblx0XHRcdFx0XHRidG5PcHRpb25zLnN5bWJvbFkgLSAoc3ltYm9sU2l6ZSAvIDIpLFxuXHRcdFx0XHRcdHN5bWJvbFNpemUsXHRcdFx0XHRcblx0XHRcdFx0XHRzeW1ib2xTaXplXG5cdFx0XHRcdClcblx0XHRcdFx0LmF0dHIoZXh0ZW5kKHN5bWJvbEF0dHIsIHtcblx0XHRcdFx0XHQnc3Ryb2tlLXdpZHRoJzogYnRuT3B0aW9ucy5zeW1ib2xTdHJva2VXaWR0aCB8fCAxLFxuXHRcdFx0XHRcdHpJbmRleDogMVxuXHRcdFx0XHR9KSkuYWRkKGJ1dHRvbik7XG5cdFx0fVxuXG5cdFx0YnV0dG9uLmFkZCgpXG5cdFx0XHQuYWxpZ24oZXh0ZW5kKGJ0bk9wdGlvbnMsIHtcblx0XHRcdFx0d2lkdGg6IGJ1dHRvbi53aWR0aCxcblx0XHRcdFx0eDogSGlnaGNoYXJ0cy5waWNrKGJ0bk9wdGlvbnMueCwgYnV0dG9uT2Zmc2V0KSAvLyAjMTY1NFxuXHRcdFx0fSksIHRydWUsICdzcGFjaW5nQm94Jyk7XG5cblx0XHRidXR0b25PZmZzZXQgKz0gKGJ1dHRvbi53aWR0aCArIGJ0bk9wdGlvbnMuYnV0dG9uU3BhY2luZykgKiAoYnRuT3B0aW9ucy5hbGlnbiA9PT0gJ3JpZ2h0JyA/IC0xIDogMSk7XG5cblx0XHRjaGFydC5leHBvcnRTVkdFbGVtZW50cy5wdXNoKGJ1dHRvbiwgc3ltYm9sKTtcblxuXHR9LFxuXG5cdC8qKlxuXHQgKiBEZXN0cm95IHRoZSBidXR0b25zLlxuXHQgKi9cblx0ZGVzdHJveUV4cG9ydDogZnVuY3Rpb24gKGUpIHtcblx0XHR2YXIgY2hhcnQgPSBlLnRhcmdldCxcblx0XHRcdGksXG5cdFx0XHRlbGVtO1xuXG5cdFx0Ly8gRGVzdHJveSB0aGUgZXh0cmEgYnV0dG9ucyBhZGRlZFxuXHRcdGZvciAoaSA9IDA7IGkgPCBjaGFydC5leHBvcnRTVkdFbGVtZW50cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0ZWxlbSA9IGNoYXJ0LmV4cG9ydFNWR0VsZW1lbnRzW2ldO1xuXHRcdFx0XG5cdFx0XHQvLyBEZXN0cm95IGFuZCBudWxsIHRoZSBzdmcvdm1sIGVsZW1lbnRzXG5cdFx0XHRpZiAoZWxlbSkgeyAvLyAjMTgyMlxuXHRcdFx0XHRlbGVtLm9uY2xpY2sgPSBlbGVtLm9udG91Y2hzdGFydCA9IG51bGw7XG5cdFx0XHRcdGNoYXJ0LmV4cG9ydFNWR0VsZW1lbnRzW2ldID0gZWxlbS5kZXN0cm95KCk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gRGVzdHJveSB0aGUgZGl2cyBmb3IgdGhlIG1lbnVcblx0XHRmb3IgKGkgPSAwOyBpIDwgY2hhcnQuZXhwb3J0RGl2RWxlbWVudHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGVsZW0gPSBjaGFydC5leHBvcnREaXZFbGVtZW50c1tpXTtcblxuXHRcdFx0Ly8gUmVtb3ZlIHRoZSBldmVudCBoYW5kbGVyXG5cdFx0XHRyZW1vdmVFdmVudChlbGVtLCAnbW91c2VsZWF2ZScpO1xuXG5cdFx0XHQvLyBSZW1vdmUgaW5saW5lIGV2ZW50c1xuXHRcdFx0Y2hhcnQuZXhwb3J0RGl2RWxlbWVudHNbaV0gPSBlbGVtLm9ubW91c2VvdXQgPSBlbGVtLm9ubW91c2VvdmVyID0gZWxlbS5vbnRvdWNoc3RhcnQgPSBlbGVtLm9uY2xpY2sgPSBudWxsO1xuXG5cdFx0XHQvLyBEZXN0cm95IHRoZSBkaXYgYnkgbW92aW5nIHRvIGdhcmJhZ2UgYmluXG5cdFx0XHRkaXNjYXJkRWxlbWVudChlbGVtKTtcblx0XHR9XG5cdH1cbn0pO1xuXG5cbnN5bWJvbHMubWVudSA9IGZ1bmN0aW9uICh4LCB5LCB3aWR0aCwgaGVpZ2h0KSB7XG5cdHZhciBhcnIgPSBbXG5cdFx0TSwgeCwgeSArIDIuNSxcblx0XHRMLCB4ICsgd2lkdGgsIHkgKyAyLjUsXG5cdFx0TSwgeCwgeSArIGhlaWdodCAvIDIgKyAwLjUsXG5cdFx0TCwgeCArIHdpZHRoLCB5ICsgaGVpZ2h0IC8gMiArIDAuNSxcblx0XHRNLCB4LCB5ICsgaGVpZ2h0IC0gMS41LFxuXHRcdEwsIHggKyB3aWR0aCwgeSArIGhlaWdodCAtIDEuNVxuXHRdO1xuXHRyZXR1cm4gYXJyO1xufTtcblxuLy8gQWRkIHRoZSBidXR0b25zIG9uIGNoYXJ0IGxvYWRcbkNoYXJ0LnByb3RvdHlwZS5jYWxsYmFja3MucHVzaChmdW5jdGlvbiAoY2hhcnQpIHtcblx0dmFyIG4sXG5cdFx0ZXhwb3J0aW5nT3B0aW9ucyA9IGNoYXJ0Lm9wdGlvbnMuZXhwb3J0aW5nLFxuXHRcdGJ1dHRvbnMgPSBleHBvcnRpbmdPcHRpb25zLmJ1dHRvbnM7XG5cblx0YnV0dG9uT2Zmc2V0ID0gMDtcblxuXHRpZiAoZXhwb3J0aW5nT3B0aW9ucy5lbmFibGVkICE9PSBmYWxzZSkge1xuXG5cdFx0Zm9yIChuIGluIGJ1dHRvbnMpIHtcblx0XHRcdGNoYXJ0LmFkZEJ1dHRvbihidXR0b25zW25dKTtcblx0XHR9XG5cblx0XHQvLyBEZXN0cm95IHRoZSBleHBvcnQgZWxlbWVudHMgYXQgY2hhcnQgZGVzdHJveVxuXHRcdGFkZEV2ZW50KGNoYXJ0LCAnZGVzdHJveScsIGNoYXJ0LmRlc3Ryb3lFeHBvcnQpO1xuXHR9XG5cbn0pO1xuXG5cbn0oSGlnaGNoYXJ0cykpO1xuIl0sImZpbGUiOiJwbHVnaW5zL3VlZGl0b3IvdGhpcmQtcGFydHkvaGlnaGNoYXJ0cy9tb2R1bGVzL2V4cG9ydGluZy5zcmMuanMifQ==
