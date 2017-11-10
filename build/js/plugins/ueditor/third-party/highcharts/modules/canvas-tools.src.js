/**
 * @license A class to parse color values
 * @author Stoyan Stefanov <sstoo@gmail.com>
 * @link   http://www.phpied.com/rgb-color-parser-in-javascript/
 * Use it if you like it
 *
 */
function RGBColor(color_string)
{
    this.ok = false;

    // strip any leading #
    if (color_string.charAt(0) == '#') { // remove # if any
        color_string = color_string.substr(1,6);
    }

    color_string = color_string.replace(/ /g,'');
    color_string = color_string.toLowerCase();

    // before getting into regexps, try simple matches
    // and overwrite the input
    var simple_colors = {
        aliceblue: 'f0f8ff',
        antiquewhite: 'faebd7',
        aqua: '00ffff',
        aquamarine: '7fffd4',
        azure: 'f0ffff',
        beige: 'f5f5dc',
        bisque: 'ffe4c4',
        black: '000000',
        blanchedalmond: 'ffebcd',
        blue: '0000ff',
        blueviolet: '8a2be2',
        brown: 'a52a2a',
        burlywood: 'deb887',
        cadetblue: '5f9ea0',
        chartreuse: '7fff00',
        chocolate: 'd2691e',
        coral: 'ff7f50',
        cornflowerblue: '6495ed',
        cornsilk: 'fff8dc',
        crimson: 'dc143c',
        cyan: '00ffff',
        darkblue: '00008b',
        darkcyan: '008b8b',
        darkgoldenrod: 'b8860b',
        darkgray: 'a9a9a9',
        darkgreen: '006400',
        darkkhaki: 'bdb76b',
        darkmagenta: '8b008b',
        darkolivegreen: '556b2f',
        darkorange: 'ff8c00',
        darkorchid: '9932cc',
        darkred: '8b0000',
        darksalmon: 'e9967a',
        darkseagreen: '8fbc8f',
        darkslateblue: '483d8b',
        darkslategray: '2f4f4f',
        darkturquoise: '00ced1',
        darkviolet: '9400d3',
        deeppink: 'ff1493',
        deepskyblue: '00bfff',
        dimgray: '696969',
        dodgerblue: '1e90ff',
        feldspar: 'd19275',
        firebrick: 'b22222',
        floralwhite: 'fffaf0',
        forestgreen: '228b22',
        fuchsia: 'ff00ff',
        gainsboro: 'dcdcdc',
        ghostwhite: 'f8f8ff',
        gold: 'ffd700',
        goldenrod: 'daa520',
        gray: '808080',
        green: '008000',
        greenyellow: 'adff2f',
        honeydew: 'f0fff0',
        hotpink: 'ff69b4',
        indianred : 'cd5c5c',
        indigo : '4b0082',
        ivory: 'fffff0',
        khaki: 'f0e68c',
        lavender: 'e6e6fa',
        lavenderblush: 'fff0f5',
        lawngreen: '7cfc00',
        lemonchiffon: 'fffacd',
        lightblue: 'add8e6',
        lightcoral: 'f08080',
        lightcyan: 'e0ffff',
        lightgoldenrodyellow: 'fafad2',
        lightgrey: 'd3d3d3',
        lightgreen: '90ee90',
        lightpink: 'ffb6c1',
        lightsalmon: 'ffa07a',
        lightseagreen: '20b2aa',
        lightskyblue: '87cefa',
        lightslateblue: '8470ff',
        lightslategray: '778899',
        lightsteelblue: 'b0c4de',
        lightyellow: 'ffffe0',
        lime: '00ff00',
        limegreen: '32cd32',
        linen: 'faf0e6',
        magenta: 'ff00ff',
        maroon: '800000',
        mediumaquamarine: '66cdaa',
        mediumblue: '0000cd',
        mediumorchid: 'ba55d3',
        mediumpurple: '9370d8',
        mediumseagreen: '3cb371',
        mediumslateblue: '7b68ee',
        mediumspringgreen: '00fa9a',
        mediumturquoise: '48d1cc',
        mediumvioletred: 'c71585',
        midnightblue: '191970',
        mintcream: 'f5fffa',
        mistyrose: 'ffe4e1',
        moccasin: 'ffe4b5',
        navajowhite: 'ffdead',
        navy: '000080',
        oldlace: 'fdf5e6',
        olive: '808000',
        olivedrab: '6b8e23',
        orange: 'ffa500',
        orangered: 'ff4500',
        orchid: 'da70d6',
        palegoldenrod: 'eee8aa',
        palegreen: '98fb98',
        paleturquoise: 'afeeee',
        palevioletred: 'd87093',
        papayawhip: 'ffefd5',
        peachpuff: 'ffdab9',
        peru: 'cd853f',
        pink: 'ffc0cb',
        plum: 'dda0dd',
        powderblue: 'b0e0e6',
        purple: '800080',
        red: 'ff0000',
        rosybrown: 'bc8f8f',
        royalblue: '4169e1',
        saddlebrown: '8b4513',
        salmon: 'fa8072',
        sandybrown: 'f4a460',
        seagreen: '2e8b57',
        seashell: 'fff5ee',
        sienna: 'a0522d',
        silver: 'c0c0c0',
        skyblue: '87ceeb',
        slateblue: '6a5acd',
        slategray: '708090',
        snow: 'fffafa',
        springgreen: '00ff7f',
        steelblue: '4682b4',
        tan: 'd2b48c',
        teal: '008080',
        thistle: 'd8bfd8',
        tomato: 'ff6347',
        turquoise: '40e0d0',
        violet: 'ee82ee',
        violetred: 'd02090',
        wheat: 'f5deb3',
        white: 'ffffff',
        whitesmoke: 'f5f5f5',
        yellow: 'ffff00',
        yellowgreen: '9acd32'
    };
    for (var key in simple_colors) {
        if (color_string == key) {
            color_string = simple_colors[key];
        }
    }
    // emd of simple type-in colors

    // array of color definition objects
    var color_defs = [
        {
            re: /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/,
            example: ['rgb(123, 234, 45)', 'rgb(255,234,245)'],
            process: function (bits){
                return [
                    parseInt(bits[1]),
                    parseInt(bits[2]),
                    parseInt(bits[3])
                ];
            }
        },
        {
            re: /^(\w{2})(\w{2})(\w{2})$/,
            example: ['#00ff00', '336699'],
            process: function (bits){
                return [
                    parseInt(bits[1], 16),
                    parseInt(bits[2], 16),
                    parseInt(bits[3], 16)
                ];
            }
        },
        {
            re: /^(\w{1})(\w{1})(\w{1})$/,
            example: ['#fb0', 'f0f'],
            process: function (bits){
                return [
                    parseInt(bits[1] + bits[1], 16),
                    parseInt(bits[2] + bits[2], 16),
                    parseInt(bits[3] + bits[3], 16)
                ];
            }
        }
    ];

    // search through the definitions to find a match
    for (var i = 0; i < color_defs.length; i++) {
        var re = color_defs[i].re;
        var processor = color_defs[i].process;
        var bits = re.exec(color_string);
        if (bits) {
            channels = processor(bits);
            this.r = channels[0];
            this.g = channels[1];
            this.b = channels[2];
            this.ok = true;
        }

    }

    // validate/cleanup values
    this.r = (this.r < 0 || isNaN(this.r)) ? 0 : ((this.r > 255) ? 255 : this.r);
    this.g = (this.g < 0 || isNaN(this.g)) ? 0 : ((this.g > 255) ? 255 : this.g);
    this.b = (this.b < 0 || isNaN(this.b)) ? 0 : ((this.b > 255) ? 255 : this.b);

    // some getters
    this.toRGB = function () {
        return 'rgb(' + this.r + ', ' + this.g + ', ' + this.b + ')';
    }
    this.toHex = function () {
        var r = this.r.toString(16);
        var g = this.g.toString(16);
        var b = this.b.toString(16);
        if (r.length == 1) r = '0' + r;
        if (g.length == 1) g = '0' + g;
        if (b.length == 1) b = '0' + b;
        return '#' + r + g + b;
    }

    // help
    this.getHelpXML = function () {

        var examples = new Array();
        // add regexps
        for (var i = 0; i < color_defs.length; i++) {
            var example = color_defs[i].example;
            for (var j = 0; j < example.length; j++) {
                examples[examples.length] = example[j];
            }
        }
        // add type-in colors
        for (var sc in simple_colors) {
            examples[examples.length] = sc;
        }

        var xml = document.createElement('ul');
        xml.setAttribute('id', 'rgbcolor-examples');
        for (var i = 0; i < examples.length; i++) {
            try {
                var list_item = document.createElement('li');
                var list_color = new RGBColor(examples[i]);
                var example_div = document.createElement('div');
                example_div.style.cssText =
                        'margin: 3px; '
                        + 'border: 1px solid black; '
                        + 'background:' + list_color.toHex() + '; '
                        + 'color:' + list_color.toHex()
                ;
                example_div.appendChild(document.createTextNode('test'));
                var list_item_value = document.createTextNode(
                    ' ' + examples[i] + ' -> ' + list_color.toRGB() + ' -> ' + list_color.toHex()
                );
                list_item.appendChild(example_div);
                list_item.appendChild(list_item_value);
                xml.appendChild(list_item);

            } catch(e){}
        }
        return xml;

    }

}

/**
 * @license canvg.js - Javascript SVG parser and renderer on Canvas
 * MIT Licensed 
 * Gabe Lerner (gabelerner@gmail.com)
 * http://code.google.com/p/canvg/
 *
 * Requires: rgbcolor.js - http://www.phpied.com/rgb-color-parser-in-javascript/
 *
 */
if(!window.console) {
	window.console = {};
	window.console.log = function(str) {};
	window.console.dir = function(str) {};
}

if(!Array.prototype.indexOf){
	Array.prototype.indexOf = function(obj){
		for(var i=0; i<this.length; i++){
			if(this[i]==obj){
				return i;
			}
		}
		return -1;
	}
}

(function(){
	// canvg(target, s)
	// empty parameters: replace all 'svg' elements on page with 'canvas' elements
	// target: canvas element or the id of a canvas element
	// s: svg string, url to svg file, or xml document
	// opts: optional hash of options
	//		 ignoreMouse: true => ignore mouse events
	//		 ignoreAnimation: true => ignore animations
	//		 ignoreDimensions: true => does not try to resize canvas
	//		 ignoreClear: true => does not clear canvas
	//		 offsetX: int => draws at a x offset
	//		 offsetY: int => draws at a y offset
	//		 scaleWidth: int => scales horizontally to width
	//		 scaleHeight: int => scales vertically to height
	//		 renderCallback: function => will call the function after the first render is completed
	//		 forceRedraw: function => will call the function on every frame, if it returns true, will redraw
	this.canvg = function (target, s, opts) {
		// no parameters
		if (target == null && s == null && opts == null) {
			var svgTags = document.getElementsByTagName('svg');
			for (var i=0; i<svgTags.length; i++) {
				var svgTag = svgTags[i];
				var c = document.createElement('canvas');
				c.width = svgTag.clientWidth;
				c.height = svgTag.clientHeight;
				svgTag.parentNode.insertBefore(c, svgTag);
				svgTag.parentNode.removeChild(svgTag);
				var div = document.createElement('div');
				div.appendChild(svgTag);
				canvg(c, div.innerHTML);
			}
			return;
		}	
		opts = opts || {};
	
		if (typeof target == 'string') {
			target = document.getElementById(target);
		}
		
		// reuse class per canvas
		var svg;
		if (target.svg == null) {
			svg = build();
			target.svg = svg;
		}
		else {
			svg = target.svg;
			svg.stop();
		}
		svg.opts = opts;
		
		var ctx = target.getContext('2d');
		if (typeof(s.documentElement) != 'undefined') {
			// load from xml doc
			svg.loadXmlDoc(ctx, s);
		}
		else if (s.substr(0,1) == '<') {
			// load from xml string
			svg.loadXml(ctx, s);
		}
		else {
			// load from url
			svg.load(ctx, s);
		}
	}

	function build() {
		var svg = { };
		
		svg.FRAMERATE = 30;
		svg.MAX_VIRTUAL_PIXELS = 30000;
		
		// globals
		svg.init = function(ctx) {
			svg.Definitions = {};
			svg.Styles = {};
			svg.Animations = [];
			svg.Images = [];
			svg.ctx = ctx;
			svg.ViewPort = new (function () {
				this.viewPorts = [];
				this.Clear = function() { this.viewPorts = []; }
				this.SetCurrent = function(width, height) { this.viewPorts.push({ width: width, height: height }); }
				this.RemoveCurrent = function() { this.viewPorts.pop(); }
				this.Current = function() { return this.viewPorts[this.viewPorts.length - 1]; }
				this.width = function() { return this.Current().width; }
				this.height = function() { return this.Current().height; }
				this.ComputeSize = function(d) {
					if (d != null && typeof(d) == 'number') return d;
					if (d == 'x') return this.width();
					if (d == 'y') return this.height();
					return Math.sqrt(Math.pow(this.width(), 2) + Math.pow(this.height(), 2)) / Math.sqrt(2);			
				}
			});
		}
		svg.init();
		
		// images loaded
		svg.ImagesLoaded = function() { 
			for (var i=0; i<svg.Images.length; i++) {
				if (!svg.Images[i].loaded) return false;
			}
			return true;
		}

		// trim
		svg.trim = function(s) { return s.replace(/^\s+|\s+$/g, ''); }
		
		// compress spaces
		svg.compressSpaces = function(s) { return s.replace(/[\s\r\t\n]+/gm,' '); }
		
		// ajax
		svg.ajax = function(url) {
			var AJAX;
			if(window.XMLHttpRequest){AJAX=new XMLHttpRequest();}
			else{AJAX=new ActiveXObject('Microsoft.XMLHTTP');}
			if(AJAX){
			   AJAX.open('GET',url,false);
			   AJAX.send(null);
			   return AJAX.responseText;
			}
			return null;
		} 
		
		// parse xml
		svg.parseXml = function(xml) {
			if (window.DOMParser)
			{
				var parser = new DOMParser();
				return parser.parseFromString(xml, 'text/xml');
			}
			else 
			{
				xml = xml.replace(/<!DOCTYPE svg[^>]*>/, '');
				var xmlDoc = new ActiveXObject('Microsoft.XMLDOM');
				xmlDoc.async = 'false';
				xmlDoc.loadXML(xml); 
				return xmlDoc;
			}		
		}
		
		svg.Property = function(name, value) {
			this.name = name;
			this.value = value;
			
			this.hasValue = function() {
				return (this.value != null && this.value !== '');
			}
							
			// return the numerical value of the property
			this.numValue = function() {
				if (!this.hasValue()) return 0;
				
				var n = parseFloat(this.value);
				if ((this.value + '').match(/%$/)) {
					n = n / 100.0;
				}
				return n;
			}
			
			this.valueOrDefault = function(def) {
				if (this.hasValue()) return this.value;
				return def;
			}
			
			this.numValueOrDefault = function(def) {
				if (this.hasValue()) return this.numValue();
				return def;
			}
			
			/* EXTENSIONS */
			var that = this;
			
			// color extensions
			this.Color = {
				// augment the current color value with the opacity
				addOpacity: function(opacity) {
					var newValue = that.value;
					if (opacity != null && opacity != '') {
						var color = new RGBColor(that.value);
						if (color.ok) {
							newValue = 'rgba(' + color.r + ', ' + color.g + ', ' + color.b + ', ' + opacity + ')';
						}
					}
					return new svg.Property(that.name, newValue);
				}
			}
			
			// definition extensions
			this.Definition = {
				// get the definition from the definitions table
				getDefinition: function() {
					var name = that.value.replace(/^(url\()?#([^\)]+)\)?$/, '$2');
					return svg.Definitions[name];
				},
				
				isUrl: function() {
					return that.value.indexOf('url(') == 0
				},
				
				getFillStyle: function(e) {
					var def = this.getDefinition();
					
					// gradient
					if (def != null && def.createGradient) {
						return def.createGradient(svg.ctx, e);
					}
					
					// pattern
					if (def != null && def.createPattern) {
						return def.createPattern(svg.ctx, e);
					}
					
					return null;
				}
			}
			
			// length extensions
			this.Length = {
				DPI: function(viewPort) {
					return 96.0; // TODO: compute?
				},
				
				EM: function(viewPort) {
					var em = 12;
					
					var fontSize = new svg.Property('fontSize', svg.Font.Parse(svg.ctx.font).fontSize);
					if (fontSize.hasValue()) em = fontSize.Length.toPixels(viewPort);
					
					return em;
				},
			
				// get the length as pixels
				toPixels: function(viewPort) {
					if (!that.hasValue()) return 0;
					var s = that.value+'';
					if (s.match(/em$/)) return that.numValue() * this.EM(viewPort);
					if (s.match(/ex$/)) return that.numValue() * this.EM(viewPort) / 2.0;
					if (s.match(/px$/)) return that.numValue();
					if (s.match(/pt$/)) return that.numValue() * 1.25;
					if (s.match(/pc$/)) return that.numValue() * 15;
					if (s.match(/cm$/)) return that.numValue() * this.DPI(viewPort) / 2.54;
					if (s.match(/mm$/)) return that.numValue() * this.DPI(viewPort) / 25.4;
					if (s.match(/in$/)) return that.numValue() * this.DPI(viewPort);
					if (s.match(/%$/)) return that.numValue() * svg.ViewPort.ComputeSize(viewPort);
					return that.numValue();
				}
			}
			
			// time extensions
			this.Time = {
				// get the time as milliseconds
				toMilliseconds: function() {
					if (!that.hasValue()) return 0;
					var s = that.value+'';
					if (s.match(/s$/)) return that.numValue() * 1000;
					if (s.match(/ms$/)) return that.numValue();
					return that.numValue();
				}
			}
			
			// angle extensions
			this.Angle = {
				// get the angle as radians
				toRadians: function() {
					if (!that.hasValue()) return 0;
					var s = that.value+'';
					if (s.match(/deg$/)) return that.numValue() * (Math.PI / 180.0);
					if (s.match(/grad$/)) return that.numValue() * (Math.PI / 200.0);
					if (s.match(/rad$/)) return that.numValue();
					return that.numValue() * (Math.PI / 180.0);
				}
			}
		}
		
		// fonts
		svg.Font = new (function() {
			this.Styles = ['normal','italic','oblique','inherit'];
			this.Variants = ['normal','small-caps','inherit'];
			this.Weights = ['normal','bold','bolder','lighter','100','200','300','400','500','600','700','800','900','inherit'];
			
			this.CreateFont = function(fontStyle, fontVariant, fontWeight, fontSize, fontFamily, inherit) { 
				var f = inherit != null ? this.Parse(inherit) : this.CreateFont('', '', '', '', '', svg.ctx.font);
				return { 
					fontFamily: fontFamily || f.fontFamily, 
					fontSize: fontSize || f.fontSize, 
					fontStyle: fontStyle || f.fontStyle, 
					fontWeight: fontWeight || f.fontWeight, 
					fontVariant: fontVariant || f.fontVariant,
					toString: function () { return [this.fontStyle, this.fontVariant, this.fontWeight, this.fontSize, this.fontFamily].join(' ') } 
				} 
			}
			
			var that = this;
			this.Parse = function(s) {
				var f = {};
				var d = svg.trim(svg.compressSpaces(s || '')).split(' ');
				var set = { fontSize: false, fontStyle: false, fontWeight: false, fontVariant: false }
				var ff = '';
				for (var i=0; i<d.length; i++) {
					if (!set.fontStyle && that.Styles.indexOf(d[i]) != -1) { if (d[i] != 'inherit') f.fontStyle = d[i]; set.fontStyle = true; }
					else if (!set.fontVariant && that.Variants.indexOf(d[i]) != -1) { if (d[i] != 'inherit') f.fontVariant = d[i]; set.fontStyle = set.fontVariant = true;	}
					else if (!set.fontWeight && that.Weights.indexOf(d[i]) != -1) {	if (d[i] != 'inherit') f.fontWeight = d[i]; set.fontStyle = set.fontVariant = set.fontWeight = true; }
					else if (!set.fontSize) { if (d[i] != 'inherit') f.fontSize = d[i].split('/')[0]; set.fontStyle = set.fontVariant = set.fontWeight = set.fontSize = true; }
					else { if (d[i] != 'inherit') ff += d[i]; }
				} if (ff != '') f.fontFamily = ff;
				return f;
			}
		});
		
		// points and paths
		svg.ToNumberArray = function(s) {
			var a = svg.trim(svg.compressSpaces((s || '').replace(/,/g, ' '))).split(' ');
			for (var i=0; i<a.length; i++) {
				a[i] = parseFloat(a[i]);
			}
			return a;
		}		
		svg.Point = function(x, y) {
			this.x = x;
			this.y = y;
			
			this.angleTo = function(p) {
				return Math.atan2(p.y - this.y, p.x - this.x);
			}
			
			this.applyTransform = function(v) {
				var xp = this.x * v[0] + this.y * v[2] + v[4];
				var yp = this.x * v[1] + this.y * v[3] + v[5];
				this.x = xp;
				this.y = yp;
			}
		}
		svg.CreatePoint = function(s) {
			var a = svg.ToNumberArray(s);
			return new svg.Point(a[0], a[1]);
		}
		svg.CreatePath = function(s) {
			var a = svg.ToNumberArray(s);
			var path = [];
			for (var i=0; i<a.length; i+=2) {
				path.push(new svg.Point(a[i], a[i+1]));
			}
			return path;
		}
		
		// bounding box
		svg.BoundingBox = function(x1, y1, x2, y2) { // pass in initial points if you want
			this.x1 = Number.NaN;
			this.y1 = Number.NaN;
			this.x2 = Number.NaN;
			this.y2 = Number.NaN;
			
			this.x = function() { return this.x1; }
			this.y = function() { return this.y1; }
			this.width = function() { return this.x2 - this.x1; }
			this.height = function() { return this.y2 - this.y1; }
			
			this.addPoint = function(x, y) {	
				if (x != null) {
					if (isNaN(this.x1) || isNaN(this.x2)) {
						this.x1 = x;
						this.x2 = x;
					}
					if (x < this.x1) this.x1 = x;
					if (x > this.x2) this.x2 = x;
				}
			
				if (y != null) {
					if (isNaN(this.y1) || isNaN(this.y2)) {
						this.y1 = y;
						this.y2 = y;
					}
					if (y < this.y1) this.y1 = y;
					if (y > this.y2) this.y2 = y;
				}
			}			
			this.addX = function(x) { this.addPoint(x, null); }
			this.addY = function(y) { this.addPoint(null, y); }
			
			this.addBoundingBox = function(bb) {
				this.addPoint(bb.x1, bb.y1);
				this.addPoint(bb.x2, bb.y2);
			}
			
			this.addQuadraticCurve = function(p0x, p0y, p1x, p1y, p2x, p2y) {
				var cp1x = p0x + 2/3 * (p1x - p0x); // CP1 = QP0 + 2/3 *(QP1-QP0)
				var cp1y = p0y + 2/3 * (p1y - p0y); // CP1 = QP0 + 2/3 *(QP1-QP0)
				var cp2x = cp1x + 1/3 * (p2x - p0x); // CP2 = CP1 + 1/3 *(QP2-QP0)
				var cp2y = cp1y + 1/3 * (p2y - p0y); // CP2 = CP1 + 1/3 *(QP2-QP0)
				this.addBezierCurve(p0x, p0y, cp1x, cp2x, cp1y,	cp2y, p2x, p2y);
			}
			
			this.addBezierCurve = function(p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y) {
				// from http://blog.hackers-cafe.net/2009/06/how-to-calculate-bezier-curves-bounding.html
				var p0 = [p0x, p0y], p1 = [p1x, p1y], p2 = [p2x, p2y], p3 = [p3x, p3y];
				this.addPoint(p0[0], p0[1]);
				this.addPoint(p3[0], p3[1]);
				
				for (i=0; i<=1; i++) {
					var f = function(t) { 
						return Math.pow(1-t, 3) * p0[i]
						+ 3 * Math.pow(1-t, 2) * t * p1[i]
						+ 3 * (1-t) * Math.pow(t, 2) * p2[i]
						+ Math.pow(t, 3) * p3[i];
					}
					
					var b = 6 * p0[i] - 12 * p1[i] + 6 * p2[i];
					var a = -3 * p0[i] + 9 * p1[i] - 9 * p2[i] + 3 * p3[i];
					var c = 3 * p1[i] - 3 * p0[i];
					
					if (a == 0) {
						if (b == 0) continue;
						var t = -c / b;
						if (0 < t && t < 1) {
							if (i == 0) this.addX(f(t));
							if (i == 1) this.addY(f(t));
						}
						continue;
					}
					
					var b2ac = Math.pow(b, 2) - 4 * c * a;
					if (b2ac < 0) continue;
					var t1 = (-b + Math.sqrt(b2ac)) / (2 * a);
					if (0 < t1 && t1 < 1) {
						if (i == 0) this.addX(f(t1));
						if (i == 1) this.addY(f(t1));
					}
					var t2 = (-b - Math.sqrt(b2ac)) / (2 * a);
					if (0 < t2 && t2 < 1) {
						if (i == 0) this.addX(f(t2));
						if (i == 1) this.addY(f(t2));
					}
				}
			}
			
			this.isPointInBox = function(x, y) {
				return (this.x1 <= x && x <= this.x2 && this.y1 <= y && y <= this.y2);
			}
			
			this.addPoint(x1, y1);
			this.addPoint(x2, y2);
		}
		
		// transforms
		svg.Transform = function(v) {	
			var that = this;
			this.Type = {}
		
			// translate
			this.Type.translate = function(s) {
				this.p = svg.CreatePoint(s);			
				this.apply = function(ctx) {
					ctx.translate(this.p.x || 0.0, this.p.y || 0.0);
				}
				this.applyToPoint = function(p) {
					p.applyTransform([1, 0, 0, 1, this.p.x || 0.0, this.p.y || 0.0]);
				}
			}
			
			// rotate
			this.Type.rotate = function(s) {
				var a = svg.ToNumberArray(s);
				this.angle = new svg.Property('angle', a[0]);
				this.cx = a[1] || 0;
				this.cy = a[2] || 0;
				this.apply = function(ctx) {
					ctx.translate(this.cx, this.cy);
					ctx.rotate(this.angle.Angle.toRadians());
					ctx.translate(-this.cx, -this.cy);
				}
				this.applyToPoint = function(p) {
					var a = this.angle.Angle.toRadians();
					p.applyTransform([1, 0, 0, 1, this.p.x || 0.0, this.p.y || 0.0]);
					p.applyTransform([Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0]);
					p.applyTransform([1, 0, 0, 1, -this.p.x || 0.0, -this.p.y || 0.0]);
				}			
			}
			
			this.Type.scale = function(s) {
				this.p = svg.CreatePoint(s);
				this.apply = function(ctx) {
					ctx.scale(this.p.x || 1.0, this.p.y || this.p.x || 1.0);
				}
				this.applyToPoint = function(p) {
					p.applyTransform([this.p.x || 0.0, 0, 0, this.p.y || 0.0, 0, 0]);
				}				
			}
			
			this.Type.matrix = function(s) {
				this.m = svg.ToNumberArray(s);
				this.apply = function(ctx) {
					ctx.transform(this.m[0], this.m[1], this.m[2], this.m[3], this.m[4], this.m[5]);
				}
				this.applyToPoint = function(p) {
					p.applyTransform(this.m);
				}					
			}
			
			this.Type.SkewBase = function(s) {
				this.base = that.Type.matrix;
				this.base(s);
				this.angle = new svg.Property('angle', s);
			}
			this.Type.SkewBase.prototype = new this.Type.matrix;
			
			this.Type.skewX = function(s) {
				this.base = that.Type.SkewBase;
				this.base(s);
				this.m = [1, 0, Math.tan(this.angle.Angle.toRadians()), 1, 0, 0];
			}
			this.Type.skewX.prototype = new this.Type.SkewBase;
			
			this.Type.skewY = function(s) {
				this.base = that.Type.SkewBase;
				this.base(s);
				this.m = [1, Math.tan(this.angle.Angle.toRadians()), 0, 1, 0, 0];
			}
			this.Type.skewY.prototype = new this.Type.SkewBase;
		
			this.transforms = [];
			
			this.apply = function(ctx) {
				for (var i=0; i<this.transforms.length; i++) {
					this.transforms[i].apply(ctx);
				}
			}
			
			this.applyToPoint = function(p) {
				for (var i=0; i<this.transforms.length; i++) {
					this.transforms[i].applyToPoint(p);
				}
			}
			
			var data = svg.trim(svg.compressSpaces(v)).split(/\s(?=[a-z])/);
			for (var i=0; i<data.length; i++) {
				var type = data[i].split('(')[0];
				var s = data[i].split('(')[1].replace(')','');
				var transform = new this.Type[type](s);
				this.transforms.push(transform);
			}
		}
		
		// aspect ratio
		svg.AspectRatio = function(ctx, aspectRatio, width, desiredWidth, height, desiredHeight, minX, minY, refX, refY) {
			// aspect ratio - http://www.w3.org/TR/SVG/coords.html#PreserveAspectRatioAttribute
			aspectRatio = svg.compressSpaces(aspectRatio);
			aspectRatio = aspectRatio.replace(/^defer\s/,''); // ignore defer
			var align = aspectRatio.split(' ')[0] || 'xMidYMid';
			var meetOrSlice = aspectRatio.split(' ')[1] || 'meet';					
	
			// calculate scale
			var scaleX = width / desiredWidth;
			var scaleY = height / desiredHeight;
			var scaleMin = Math.min(scaleX, scaleY);
			var scaleMax = Math.max(scaleX, scaleY);
			if (meetOrSlice == 'meet') { desiredWidth *= scaleMin; desiredHeight *= scaleMin; }
			if (meetOrSlice == 'slice') { desiredWidth *= scaleMax; desiredHeight *= scaleMax; }	
			
			refX = new svg.Property('refX', refX);
			refY = new svg.Property('refY', refY);
			if (refX.hasValue() && refY.hasValue()) {				
				ctx.translate(-scaleMin * refX.Length.toPixels('x'), -scaleMin * refY.Length.toPixels('y'));
			} 
			else {					
				// align
				if (align.match(/^xMid/) && ((meetOrSlice == 'meet' && scaleMin == scaleY) || (meetOrSlice == 'slice' && scaleMax == scaleY))) ctx.translate(width / 2.0 - desiredWidth / 2.0, 0); 
				if (align.match(/YMid$/) && ((meetOrSlice == 'meet' && scaleMin == scaleX) || (meetOrSlice == 'slice' && scaleMax == scaleX))) ctx.translate(0, height / 2.0 - desiredHeight / 2.0); 
				if (align.match(/^xMax/) && ((meetOrSlice == 'meet' && scaleMin == scaleY) || (meetOrSlice == 'slice' && scaleMax == scaleY))) ctx.translate(width - desiredWidth, 0); 
				if (align.match(/YMax$/) && ((meetOrSlice == 'meet' && scaleMin == scaleX) || (meetOrSlice == 'slice' && scaleMax == scaleX))) ctx.translate(0, height - desiredHeight); 
			}
			
			// scale
			if (align == 'none') ctx.scale(scaleX, scaleY);
			else if (meetOrSlice == 'meet') ctx.scale(scaleMin, scaleMin); 
			else if (meetOrSlice == 'slice') ctx.scale(scaleMax, scaleMax); 	
			
			// translate
			ctx.translate(minX == null ? 0 : -minX, minY == null ? 0 : -minY);			
		}
		
		// elements
		svg.Element = {}
		
		svg.Element.ElementBase = function(node) {	
			this.attributes = {};
			this.styles = {};
			this.children = [];
			
			// get or create attribute
			this.attribute = function(name, createIfNotExists) {
				var a = this.attributes[name];
				if (a != null) return a;
							
				a = new svg.Property(name, '');
				if (createIfNotExists == true) this.attributes[name] = a;
				return a;
			}
			
			// get or create style, crawls up node tree
			this.style = function(name, createIfNotExists) {
				var s = this.styles[name];
				if (s != null) return s;
				
				var a = this.attribute(name);
				if (a != null && a.hasValue()) {
					return a;
				}
				
				var p = this.parent;
				if (p != null) {
					var ps = p.style(name);
					if (ps != null && ps.hasValue()) {
						return ps;
					}
				}
					
				s = new svg.Property(name, '');
				if (createIfNotExists == true) this.styles[name] = s;
				return s;
			}
			
			// base render
			this.render = function(ctx) {
				// don't render display=none
				if (this.style('display').value == 'none') return;
				
				// don't render visibility=hidden
				if (this.attribute('visibility').value == 'hidden') return;
			
				ctx.save();
					this.setContext(ctx);
						// mask
						if (this.attribute('mask').hasValue()) {
							var mask = this.attribute('mask').Definition.getDefinition();
							if (mask != null) mask.apply(ctx, this);
						}
						else if (this.style('filter').hasValue()) {
							var filter = this.style('filter').Definition.getDefinition();
							if (filter != null) filter.apply(ctx, this);
						}
						else this.renderChildren(ctx);				
					this.clearContext(ctx);
				ctx.restore();
			}
			
			// base set context
			this.setContext = function(ctx) {
				// OVERRIDE ME!
			}
			
			// base clear context
			this.clearContext = function(ctx) {
				// OVERRIDE ME!
			}			
			
			// base render children
			this.renderChildren = function(ctx) {
				for (var i=0; i<this.children.length; i++) {
					this.children[i].render(ctx);
				}
			}
			
			this.addChild = function(childNode, create) {
				var child = childNode;
				if (create) child = svg.CreateElement(childNode);
				child.parent = this;
				this.children.push(child);			
			}
				
			if (node != null && node.nodeType == 1) { //ELEMENT_NODE
				// add children
				for (var i=0; i<node.childNodes.length; i++) {
					var childNode = node.childNodes[i];
					if (childNode.nodeType == 1) this.addChild(childNode, true); //ELEMENT_NODE
				}
				
				// add attributes
				for (var i=0; i<node.attributes.length; i++) {
					var attribute = node.attributes[i];
					this.attributes[attribute.nodeName] = new svg.Property(attribute.nodeName, attribute.nodeValue);
				}
										
				// add tag styles
				var styles = svg.Styles[node.nodeName];
				if (styles != null) {
					for (var name in styles) {
						this.styles[name] = styles[name];
					}
				}					
				
				// add class styles
				if (this.attribute('class').hasValue()) {
					var classes = svg.compressSpaces(this.attribute('class').value).split(' ');
					for (var j=0; j<classes.length; j++) {
						styles = svg.Styles['.'+classes[j]];
						if (styles != null) {
							for (var name in styles) {
								this.styles[name] = styles[name];
							}
						}
						styles = svg.Styles[node.nodeName+'.'+classes[j]];
						if (styles != null) {
							for (var name in styles) {
								this.styles[name] = styles[name];
							}
						}
					}
				}
				
				// add inline styles
				if (this.attribute('style').hasValue()) {
					var styles = this.attribute('style').value.split(';');
					for (var i=0; i<styles.length; i++) {
						if (svg.trim(styles[i]) != '') {
							var style = styles[i].split(':');
							var name = svg.trim(style[0]);
							var value = svg.trim(style[1]);
							this.styles[name] = new svg.Property(name, value);
						}
					}
				}	

				// add id
				if (this.attribute('id').hasValue()) {
					if (svg.Definitions[this.attribute('id').value] == null) {
						svg.Definitions[this.attribute('id').value] = this;
					}
				}
			}
		}
		
		svg.Element.RenderedElementBase = function(node) {
			this.base = svg.Element.ElementBase;
			this.base(node);
			
			this.setContext = function(ctx) {
				// fill
				if (this.style('fill').Definition.isUrl()) {
					var fs = this.style('fill').Definition.getFillStyle(this);
					if (fs != null) ctx.fillStyle = fs;
				}
				else if (this.style('fill').hasValue()) {
					var fillStyle = this.style('fill');
					if (this.style('fill-opacity').hasValue()) fillStyle = fillStyle.Color.addOpacity(this.style('fill-opacity').value);
					ctx.fillStyle = (fillStyle.value == 'none' ? 'rgba(0,0,0,0)' : fillStyle.value);
				}
									
				// stroke
				if (this.style('stroke').Definition.isUrl()) {
					var fs = this.style('stroke').Definition.getFillStyle(this);
					if (fs != null) ctx.strokeStyle = fs;
				}
				else if (this.style('stroke').hasValue()) {
					var strokeStyle = this.style('stroke');
					if (this.style('stroke-opacity').hasValue()) strokeStyle = strokeStyle.Color.addOpacity(this.style('stroke-opacity').value);
					ctx.strokeStyle = (strokeStyle.value == 'none' ? 'rgba(0,0,0,0)' : strokeStyle.value);
				}
				if (this.style('stroke-width').hasValue()) ctx.lineWidth = this.style('stroke-width').Length.toPixels();
				if (this.style('stroke-linecap').hasValue()) ctx.lineCap = this.style('stroke-linecap').value;
				if (this.style('stroke-linejoin').hasValue()) ctx.lineJoin = this.style('stroke-linejoin').value;
				if (this.style('stroke-miterlimit').hasValue()) ctx.miterLimit = this.style('stroke-miterlimit').value;

				// font
				if (typeof(ctx.font) != 'undefined') {
					ctx.font = svg.Font.CreateFont( 
						this.style('font-style').value, 
						this.style('font-variant').value, 
						this.style('font-weight').value, 
						this.style('font-size').hasValue() ? this.style('font-size').Length.toPixels() + 'px' : '', 
						this.style('font-family').value).toString();
				}
				
				// transform
				if (this.attribute('transform').hasValue()) { 
					var transform = new svg.Transform(this.attribute('transform').value);
					transform.apply(ctx);
				}
				
				// clip
				if (this.attribute('clip-path').hasValue()) {
					var clip = this.attribute('clip-path').Definition.getDefinition();
					if (clip != null) clip.apply(ctx);
				}
				
				// opacity
				if (this.style('opacity').hasValue()) {
					ctx.globalAlpha = this.style('opacity').numValue();
				}
			}		
		}
		svg.Element.RenderedElementBase.prototype = new svg.Element.ElementBase;
		
		svg.Element.PathElementBase = function(node) {
			this.base = svg.Element.RenderedElementBase;
			this.base(node);
			
			this.path = function(ctx) {
				if (ctx != null) ctx.beginPath();
				return new svg.BoundingBox();
			}
			
			this.renderChildren = function(ctx) {
				this.path(ctx);
				svg.Mouse.checkPath(this, ctx);
				if (ctx.fillStyle != '') ctx.fill();
				if (ctx.strokeStyle != '') ctx.stroke();
				
				var markers = this.getMarkers();
				if (markers != null) {
					if (this.style('marker-start').Definition.isUrl()) {
						var marker = this.style('marker-start').Definition.getDefinition();
						marker.render(ctx, markers[0][0], markers[0][1]);
					}
					if (this.style('marker-mid').Definition.isUrl()) {
						var marker = this.style('marker-mid').Definition.getDefinition();
						for (var i=1;i<markers.length-1;i++) {
							marker.render(ctx, markers[i][0], markers[i][1]);
						}
					}
					if (this.style('marker-end').Definition.isUrl()) {
						var marker = this.style('marker-end').Definition.getDefinition();
						marker.render(ctx, markers[markers.length-1][0], markers[markers.length-1][1]);
					}
				}					
			}
			
			this.getBoundingBox = function() {
				return this.path();
			}
			
			this.getMarkers = function() {
				return null;
			}
		}
		svg.Element.PathElementBase.prototype = new svg.Element.RenderedElementBase;
		
		// svg element
		svg.Element.svg = function(node) {
			this.base = svg.Element.RenderedElementBase;
			this.base(node);
			
			this.baseClearContext = this.clearContext;
			this.clearContext = function(ctx) {
				this.baseClearContext(ctx);
				svg.ViewPort.RemoveCurrent();
			}
			
			this.baseSetContext = this.setContext;
			this.setContext = function(ctx) {
				// initial values
				ctx.strokeStyle = 'rgba(0,0,0,0)';
				ctx.lineCap = 'butt';
				ctx.lineJoin = 'miter';
				ctx.miterLimit = 4;			
			
				this.baseSetContext(ctx);
				
				// create new view port
				if (this.attribute('x').hasValue() && this.attribute('y').hasValue()) {
					ctx.translate(this.attribute('x').Length.toPixels('x'), this.attribute('y').Length.toPixels('y'));
				}
				
				var width = svg.ViewPort.width();
				var height = svg.ViewPort.height();
				if (typeof(this.root) == 'undefined' && this.attribute('width').hasValue() && this.attribute('height').hasValue()) {
					width = this.attribute('width').Length.toPixels('x');
					height = this.attribute('height').Length.toPixels('y');
					
					var x = 0;
					var y = 0;
					if (this.attribute('refX').hasValue() && this.attribute('refY').hasValue()) {
						x = -this.attribute('refX').Length.toPixels('x');
						y = -this.attribute('refY').Length.toPixels('y');
					}
					
					ctx.beginPath();
					ctx.moveTo(x, y);
					ctx.lineTo(width, y);
					ctx.lineTo(width, height);
					ctx.lineTo(x, height);
					ctx.closePath();
					ctx.clip();
				}
				svg.ViewPort.SetCurrent(width, height);	
						
				// viewbox
				if (this.attribute('viewBox').hasValue()) {				
					var viewBox = svg.ToNumberArray(this.attribute('viewBox').value);
					var minX = viewBox[0];
					var minY = viewBox[1];
					width = viewBox[2];
					height = viewBox[3];
					
					svg.AspectRatio(ctx,
									this.attribute('preserveAspectRatio').value, 
									svg.ViewPort.width(), 
									width,
									svg.ViewPort.height(),
									height,
									minX,
									minY,
									this.attribute('refX').value,
									this.attribute('refY').value);
										
					svg.ViewPort.RemoveCurrent();	
					svg.ViewPort.SetCurrent(viewBox[2], viewBox[3]);						
				}				
			}
		}
		svg.Element.svg.prototype = new svg.Element.RenderedElementBase;

		// rect element
		svg.Element.rect = function(node) {
			this.base = svg.Element.PathElementBase;
			this.base(node);
			
			this.path = function(ctx) {
				var x = this.attribute('x').Length.toPixels('x');
				var y = this.attribute('y').Length.toPixels('y');
				var width = this.attribute('width').Length.toPixels('x');
				var height = this.attribute('height').Length.toPixels('y');
				var rx = this.attribute('rx').Length.toPixels('x');
				var ry = this.attribute('ry').Length.toPixels('y');
				if (this.attribute('rx').hasValue() && !this.attribute('ry').hasValue()) ry = rx;
				if (this.attribute('ry').hasValue() && !this.attribute('rx').hasValue()) rx = ry;
				
				if (ctx != null) {
					ctx.beginPath();
					ctx.moveTo(x + rx, y);
					ctx.lineTo(x + width - rx, y);
					ctx.quadraticCurveTo(x + width, y, x + width, y + ry)
					ctx.lineTo(x + width, y + height - ry);
					ctx.quadraticCurveTo(x + width, y + height, x + width - rx, y + height)
					ctx.lineTo(x + rx, y + height);
					ctx.quadraticCurveTo(x, y + height, x, y + height - ry)
					ctx.lineTo(x, y + ry);
					ctx.quadraticCurveTo(x, y, x + rx, y)
					ctx.closePath();
				}
				
				return new svg.BoundingBox(x, y, x + width, y + height);
			}
		}
		svg.Element.rect.prototype = new svg.Element.PathElementBase;
		
		// circle element
		svg.Element.circle = function(node) {
			this.base = svg.Element.PathElementBase;
			this.base(node);
			
			this.path = function(ctx) {
				var cx = this.attribute('cx').Length.toPixels('x');
				var cy = this.attribute('cy').Length.toPixels('y');
				var r = this.attribute('r').Length.toPixels();
			
				if (ctx != null) {
					ctx.beginPath();
					ctx.arc(cx, cy, r, 0, Math.PI * 2, true); 
					ctx.closePath();
				}
				
				return new svg.BoundingBox(cx - r, cy - r, cx + r, cy + r);
			}
		}
		svg.Element.circle.prototype = new svg.Element.PathElementBase;	

		// ellipse element
		svg.Element.ellipse = function(node) {
			this.base = svg.Element.PathElementBase;
			this.base(node);
			
			this.path = function(ctx) {
				var KAPPA = 4 * ((Math.sqrt(2) - 1) / 3);
				var rx = this.attribute('rx').Length.toPixels('x');
				var ry = this.attribute('ry').Length.toPixels('y');
				var cx = this.attribute('cx').Length.toPixels('x');
				var cy = this.attribute('cy').Length.toPixels('y');
				
				if (ctx != null) {
					ctx.beginPath();
					ctx.moveTo(cx, cy - ry);
					ctx.bezierCurveTo(cx + (KAPPA * rx), cy - ry,  cx + rx, cy - (KAPPA * ry), cx + rx, cy);
					ctx.bezierCurveTo(cx + rx, cy + (KAPPA * ry), cx + (KAPPA * rx), cy + ry, cx, cy + ry);
					ctx.bezierCurveTo(cx - (KAPPA * rx), cy + ry, cx - rx, cy + (KAPPA * ry), cx - rx, cy);
					ctx.bezierCurveTo(cx - rx, cy - (KAPPA * ry), cx - (KAPPA * rx), cy - ry, cx, cy - ry);
					ctx.closePath();
				}
				
				return new svg.BoundingBox(cx - rx, cy - ry, cx + rx, cy + ry);
			}
		}
		svg.Element.ellipse.prototype = new svg.Element.PathElementBase;			
		
		// line element
		svg.Element.line = function(node) {
			this.base = svg.Element.PathElementBase;
			this.base(node);
			
			this.getPoints = function() {
				return [
					new svg.Point(this.attribute('x1').Length.toPixels('x'), this.attribute('y1').Length.toPixels('y')),
					new svg.Point(this.attribute('x2').Length.toPixels('x'), this.attribute('y2').Length.toPixels('y'))];
			}
								
			this.path = function(ctx) {
				var points = this.getPoints();
				
				if (ctx != null) {
					ctx.beginPath();
					ctx.moveTo(points[0].x, points[0].y);
					ctx.lineTo(points[1].x, points[1].y);
				}
				
				return new svg.BoundingBox(points[0].x, points[0].y, points[1].x, points[1].y);
			}
			
			this.getMarkers = function() {
				var points = this.getPoints();	
				var a = points[0].angleTo(points[1]);
				return [[points[0], a], [points[1], a]];
			}
		}
		svg.Element.line.prototype = new svg.Element.PathElementBase;		
				
		// polyline element
		svg.Element.polyline = function(node) {
			this.base = svg.Element.PathElementBase;
			this.base(node);
			
			this.points = svg.CreatePath(this.attribute('points').value);
			this.path = function(ctx) {
				var bb = new svg.BoundingBox(this.points[0].x, this.points[0].y);
				if (ctx != null) {
					ctx.beginPath();
					ctx.moveTo(this.points[0].x, this.points[0].y);
				}
				for (var i=1; i<this.points.length; i++) {
					bb.addPoint(this.points[i].x, this.points[i].y);
					if (ctx != null) ctx.lineTo(this.points[i].x, this.points[i].y);
				}
				return bb;
			}
			
			this.getMarkers = function() {
				var markers = [];
				for (var i=0; i<this.points.length - 1; i++) {
					markers.push([this.points[i], this.points[i].angleTo(this.points[i+1])]);
				}
				markers.push([this.points[this.points.length-1], markers[markers.length-1][1]]);
				return markers;
			}			
		}
		svg.Element.polyline.prototype = new svg.Element.PathElementBase;				
				
		// polygon element
		svg.Element.polygon = function(node) {
			this.base = svg.Element.polyline;
			this.base(node);
			
			this.basePath = this.path;
			this.path = function(ctx) {
				var bb = this.basePath(ctx);
				if (ctx != null) {
					ctx.lineTo(this.points[0].x, this.points[0].y);
					ctx.closePath();
				}
				return bb;
			}
		}
		svg.Element.polygon.prototype = new svg.Element.polyline;

		// path element
		svg.Element.path = function(node) {
			this.base = svg.Element.PathElementBase;
			this.base(node);
					
			var d = this.attribute('d').value;
			// TODO: convert to real lexer based on http://www.w3.org/TR/SVG11/paths.html#PathDataBNF
			d = d.replace(/,/gm,' '); // get rid of all commas
			d = d.replace(/([MmZzLlHhVvCcSsQqTtAa])([MmZzLlHhVvCcSsQqTtAa])/gm,'$1 $2'); // separate commands from commands
			d = d.replace(/([MmZzLlHhVvCcSsQqTtAa])([MmZzLlHhVvCcSsQqTtAa])/gm,'$1 $2'); // separate commands from commands
			d = d.replace(/([MmZzLlHhVvCcSsQqTtAa])([^\s])/gm,'$1 $2'); // separate commands from points
			d = d.replace(/([^\s])([MmZzLlHhVvCcSsQqTtAa])/gm,'$1 $2'); // separate commands from points
			d = d.replace(/([0-9])([+\-])/gm,'$1 $2'); // separate digits when no comma
			d = d.replace(/(\.[0-9]*)(\.)/gm,'$1 $2'); // separate digits when no comma
			d = d.replace(/([Aa](\s+[0-9]+){3})\s+([01])\s*([01])/gm,'$1 $3 $4 '); // shorthand elliptical arc path syntax
			d = svg.compressSpaces(d); // compress multiple spaces
			d = svg.trim(d);
			this.PathParser = new (function(d) {
				this.tokens = d.split(' ');
				
				this.reset = function() {
					this.i = -1;
					this.command = '';
					this.previousCommand = '';
					this.start = new svg.Point(0, 0);
					this.control = new svg.Point(0, 0);
					this.current = new svg.Point(0, 0);
					this.points = [];
					this.angles = [];
				}
								
				this.isEnd = function() {
					return this.i >= this.tokens.length - 1;
				}
				
				this.isCommandOrEnd = function() {
					if (this.isEnd()) return true;
					return this.tokens[this.i + 1].match(/^[A-Za-z]$/) != null;
				}
				
				this.isRelativeCommand = function() {
					return this.command == this.command.toLowerCase();
				}
							
				this.getToken = function() {
					this.i = this.i + 1;
					return this.tokens[this.i];
				}
				
				this.getScalar = function() {
					return parseFloat(this.getToken());
				}
				
				this.nextCommand = function() {
					this.previousCommand = this.command;
					this.command = this.getToken();
				}				
				
				this.getPoint = function() {
					var p = new svg.Point(this.getScalar(), this.getScalar());
					return this.makeAbsolute(p);
				}
				
				this.getAsControlPoint = function() {
					var p = this.getPoint();
					this.control = p;
					return p;
				}
				
				this.getAsCurrentPoint = function() {
					var p = this.getPoint();
					this.current = p;
					return p;	
				}
				
				this.getReflectedControlPoint = function() {
					if (this.previousCommand.toLowerCase() != 'c' && this.previousCommand.toLowerCase() != 's') {
						return this.current;
					}
					
					// reflect point
					var p = new svg.Point(2 * this.current.x - this.control.x, 2 * this.current.y - this.control.y);					
					return p;
				}
				
				this.makeAbsolute = function(p) {
					if (this.isRelativeCommand()) {
						p.x = this.current.x + p.x;
						p.y = this.current.y + p.y;
					}
					return p;
				}
				
				this.addMarker = function(p, from, priorTo) {
					// if the last angle isn't filled in because we didn't have this point yet ...
					if (priorTo != null && this.angles.length > 0 && this.angles[this.angles.length-1] == null) {
						this.angles[this.angles.length-1] = this.points[this.points.length-1].angleTo(priorTo);
					}
					this.addMarkerAngle(p, from == null ? null : from.angleTo(p));
				}
				
				this.addMarkerAngle = function(p, a) {
					this.points.push(p);
					this.angles.push(a);
				}				
				
				this.getMarkerPoints = function() { return this.points; }
				this.getMarkerAngles = function() {
					for (var i=0; i<this.angles.length; i++) {
						if (this.angles[i] == null) {
							for (var j=i+1; j<this.angles.length; j++) {
								if (this.angles[j] != null) {
									this.angles[i] = this.angles[j];
									break;
								}
							}
						}
					}
					return this.angles;
				}
			})(d);

			this.path = function(ctx) {
				var pp = this.PathParser;
				pp.reset();

				var bb = new svg.BoundingBox();
				if (ctx != null) ctx.beginPath();
				while (!pp.isEnd()) {
					pp.nextCommand();
					switch (pp.command.toUpperCase()) {
					case 'M':
						var p = pp.getAsCurrentPoint();
						pp.addMarker(p);
						bb.addPoint(p.x, p.y);
						if (ctx != null) ctx.moveTo(p.x, p.y);
						pp.start = pp.current;
						while (!pp.isCommandOrEnd()) {
							var p = pp.getAsCurrentPoint();
							pp.addMarker(p, pp.start);
							bb.addPoint(p.x, p.y);
							if (ctx != null) ctx.lineTo(p.x, p.y);
						}
						break;
					case 'L':
						while (!pp.isCommandOrEnd()) {
							var c = pp.current;
							var p = pp.getAsCurrentPoint();
							pp.addMarker(p, c);
							bb.addPoint(p.x, p.y);
							if (ctx != null) ctx.lineTo(p.x, p.y);
						}
						break;
					case 'H':
						while (!pp.isCommandOrEnd()) {
							var newP = new svg.Point((pp.isRelativeCommand() ? pp.current.x : 0) + pp.getScalar(), pp.current.y);
							pp.addMarker(newP, pp.current);
							pp.current = newP;
							bb.addPoint(pp.current.x, pp.current.y);
							if (ctx != null) ctx.lineTo(pp.current.x, pp.current.y);
						}
						break;
					case 'V':
						while (!pp.isCommandOrEnd()) {
							var newP = new svg.Point(pp.current.x, (pp.isRelativeCommand() ? pp.current.y : 0) + pp.getScalar());
							pp.addMarker(newP, pp.current);
							pp.current = newP;
							bb.addPoint(pp.current.x, pp.current.y);
							if (ctx != null) ctx.lineTo(pp.current.x, pp.current.y);
						}
						break;
					case 'C':
						while (!pp.isCommandOrEnd()) {
							var curr = pp.current;
							var p1 = pp.getPoint();
							var cntrl = pp.getAsControlPoint();
							var cp = pp.getAsCurrentPoint();
							pp.addMarker(cp, cntrl, p1);
							bb.addBezierCurve(curr.x, curr.y, p1.x, p1.y, cntrl.x, cntrl.y, cp.x, cp.y);
							if (ctx != null) ctx.bezierCurveTo(p1.x, p1.y, cntrl.x, cntrl.y, cp.x, cp.y);
						}
						break;
					case 'S':
						while (!pp.isCommandOrEnd()) {
							var curr = pp.current;
							var p1 = pp.getReflectedControlPoint();
							var cntrl = pp.getAsControlPoint();
							var cp = pp.getAsCurrentPoint();
							pp.addMarker(cp, cntrl, p1);
							bb.addBezierCurve(curr.x, curr.y, p1.x, p1.y, cntrl.x, cntrl.y, cp.x, cp.y);
							if (ctx != null) ctx.bezierCurveTo(p1.x, p1.y, cntrl.x, cntrl.y, cp.x, cp.y);
						}
						break;
					case 'Q':
						while (!pp.isCommandOrEnd()) {
							var curr = pp.current;
							var cntrl = pp.getAsControlPoint();
							var cp = pp.getAsCurrentPoint();
							pp.addMarker(cp, cntrl, cntrl);
							bb.addQuadraticCurve(curr.x, curr.y, cntrl.x, cntrl.y, cp.x, cp.y);
							if (ctx != null) ctx.quadraticCurveTo(cntrl.x, cntrl.y, cp.x, cp.y);
						}
						break;
					case 'T':
						while (!pp.isCommandOrEnd()) {
							var curr = pp.current;
							var cntrl = pp.getReflectedControlPoint();
							pp.control = cntrl;
							var cp = pp.getAsCurrentPoint();
							pp.addMarker(cp, cntrl, cntrl);
							bb.addQuadraticCurve(curr.x, curr.y, cntrl.x, cntrl.y, cp.x, cp.y);
							if (ctx != null) ctx.quadraticCurveTo(cntrl.x, cntrl.y, cp.x, cp.y);
						}
						break;
					case 'A':
						while (!pp.isCommandOrEnd()) {
						    var curr = pp.current;
							var rx = pp.getScalar();
							var ry = pp.getScalar();
							var xAxisRotation = pp.getScalar() * (Math.PI / 180.0);
							var largeArcFlag = pp.getScalar();
							var sweepFlag = pp.getScalar();
							var cp = pp.getAsCurrentPoint();

							// Conversion from endpoint to center parameterization
							// http://www.w3.org/TR/SVG11/implnote.html#ArcImplementationNotes
							// x1', y1'
							var currp = new svg.Point(
								Math.cos(xAxisRotation) * (curr.x - cp.x) / 2.0 + Math.sin(xAxisRotation) * (curr.y - cp.y) / 2.0,
								-Math.sin(xAxisRotation) * (curr.x - cp.x) / 2.0 + Math.cos(xAxisRotation) * (curr.y - cp.y) / 2.0
							);
							// adjust radii
							var l = Math.pow(currp.x,2)/Math.pow(rx,2)+Math.pow(currp.y,2)/Math.pow(ry,2);
							if (l > 1) {
								rx *= Math.sqrt(l);
								ry *= Math.sqrt(l);
							}
							// cx', cy'
							var s = (largeArcFlag == sweepFlag ? -1 : 1) * Math.sqrt(
								((Math.pow(rx,2)*Math.pow(ry,2))-(Math.pow(rx,2)*Math.pow(currp.y,2))-(Math.pow(ry,2)*Math.pow(currp.x,2))) /
								(Math.pow(rx,2)*Math.pow(currp.y,2)+Math.pow(ry,2)*Math.pow(currp.x,2))
							);
							if (isNaN(s)) s = 0;
							var cpp = new svg.Point(s * rx * currp.y / ry, s * -ry * currp.x / rx);
							// cx, cy
							var centp = new svg.Point(
								(curr.x + cp.x) / 2.0 + Math.cos(xAxisRotation) * cpp.x - Math.sin(xAxisRotation) * cpp.y,
								(curr.y + cp.y) / 2.0 + Math.sin(xAxisRotation) * cpp.x + Math.cos(xAxisRotation) * cpp.y
							);
							// vector magnitude
							var m = function(v) { return Math.sqrt(Math.pow(v[0],2) + Math.pow(v[1],2)); }
							// ratio between two vectors
							var r = function(u, v) { return (u[0]*v[0]+u[1]*v[1]) / (m(u)*m(v)) }
							// angle between two vectors
							var a = function(u, v) { return (u[0]*v[1] < u[1]*v[0] ? -1 : 1) * Math.acos(r(u,v)); }
							// initial angle
							var a1 = a([1,0], [(currp.x-cpp.x)/rx,(currp.y-cpp.y)/ry]);
							// angle delta
							var u = [(currp.x-cpp.x)/rx,(currp.y-cpp.y)/ry];
							var v = [(-currp.x-cpp.x)/rx,(-currp.y-cpp.y)/ry];
							var ad = a(u, v);
							if (r(u,v) <= -1) ad = Math.PI;
							if (r(u,v) >= 1) ad = 0;

							if (sweepFlag == 0 && ad > 0) ad = ad - 2 * Math.PI;
							if (sweepFlag == 1 && ad < 0) ad = ad + 2 * Math.PI;

							// for markers
							var halfWay = new svg.Point(
								centp.x - rx * Math.cos((a1 + ad) / 2),
								centp.y - ry * Math.sin((a1 + ad) / 2)
							);
							pp.addMarkerAngle(halfWay, (a1 + ad) / 2 + (sweepFlag == 0 ? 1 : -1) * Math.PI / 2);
							pp.addMarkerAngle(cp, ad + (sweepFlag == 0 ? 1 : -1) * Math.PI / 2);

							bb.addPoint(cp.x, cp.y); // TODO: this is too naive, make it better
							if (ctx != null) {
								var r = rx > ry ? rx : ry;
								var sx = rx > ry ? 1 : rx / ry;
								var sy = rx > ry ? ry / rx : 1;

								ctx.translate(centp.x, centp.y);
								ctx.rotate(xAxisRotation);
								ctx.scale(sx, sy);
								ctx.arc(0, 0, r, a1, a1 + ad, 1 - sweepFlag);
								ctx.scale(1/sx, 1/sy);
								ctx.rotate(-xAxisRotation);
								ctx.translate(-centp.x, -centp.y);
							}
						}
						break;
					case 'Z':
						if (ctx != null) ctx.closePath();
						pp.current = pp.start;
					}
				}

				return bb;
			}

			this.getMarkers = function() {
				var points = this.PathParser.getMarkerPoints();
				var angles = this.PathParser.getMarkerAngles();
				
				var markers = [];
				for (var i=0; i<points.length; i++) {
					markers.push([points[i], angles[i]]);
				}
				return markers;
			}
		}
		svg.Element.path.prototype = new svg.Element.PathElementBase;
		
		// pattern element
		svg.Element.pattern = function(node) {
			this.base = svg.Element.ElementBase;
			this.base(node);
			
			this.createPattern = function(ctx, element) {
				// render me using a temporary svg element
				var tempSvg = new svg.Element.svg();
				tempSvg.attributes['viewBox'] = new svg.Property('viewBox', this.attribute('viewBox').value);
				tempSvg.attributes['x'] = new svg.Property('x', this.attribute('x').value);
				tempSvg.attributes['y'] = new svg.Property('y', this.attribute('y').value);
				tempSvg.attributes['width'] = new svg.Property('width', this.attribute('width').value);
				tempSvg.attributes['height'] = new svg.Property('height', this.attribute('height').value);
				tempSvg.children = this.children;
				
				var c = document.createElement('canvas');
				c.width = this.attribute('width').Length.toPixels('x');
				c.height = this.attribute('height').Length.toPixels('y');
				tempSvg.render(c.getContext('2d'));		
				return ctx.createPattern(c, 'repeat');
			}
		}
		svg.Element.pattern.prototype = new svg.Element.ElementBase;
		
		// marker element
		svg.Element.marker = function(node) {
			this.base = svg.Element.ElementBase;
			this.base(node);
			
			this.baseRender = this.render;
			this.render = function(ctx, point, angle) {
				ctx.translate(point.x, point.y);
				if (this.attribute('orient').valueOrDefault('auto') == 'auto') ctx.rotate(angle);
				if (this.attribute('markerUnits').valueOrDefault('strokeWidth') == 'strokeWidth') ctx.scale(ctx.lineWidth, ctx.lineWidth);
				ctx.save();
							
				// render me using a temporary svg element
				var tempSvg = new svg.Element.svg();
				tempSvg.attributes['viewBox'] = new svg.Property('viewBox', this.attribute('viewBox').value);
				tempSvg.attributes['refX'] = new svg.Property('refX', this.attribute('refX').value);
				tempSvg.attributes['refY'] = new svg.Property('refY', this.attribute('refY').value);
				tempSvg.attributes['width'] = new svg.Property('width', this.attribute('markerWidth').value);
				tempSvg.attributes['height'] = new svg.Property('height', this.attribute('markerHeight').value);
				tempSvg.attributes['fill'] = new svg.Property('fill', this.attribute('fill').valueOrDefault('black'));
				tempSvg.attributes['stroke'] = new svg.Property('stroke', this.attribute('stroke').valueOrDefault('none'));
				tempSvg.children = this.children;
				tempSvg.render(ctx);
				
				ctx.restore();
				if (this.attribute('markerUnits').valueOrDefault('strokeWidth') == 'strokeWidth') ctx.scale(1/ctx.lineWidth, 1/ctx.lineWidth);
				if (this.attribute('orient').valueOrDefault('auto') == 'auto') ctx.rotate(-angle);
				ctx.translate(-point.x, -point.y);
			}
		}
		svg.Element.marker.prototype = new svg.Element.ElementBase;
		
		// definitions element
		svg.Element.defs = function(node) {
			this.base = svg.Element.ElementBase;
			this.base(node);	
			
			this.render = function(ctx) {
				// NOOP
			}
		}
		svg.Element.defs.prototype = new svg.Element.ElementBase;
		
		// base for gradients
		svg.Element.GradientBase = function(node) {
			this.base = svg.Element.ElementBase;
			this.base(node);
			
			this.gradientUnits = this.attribute('gradientUnits').valueOrDefault('objectBoundingBox');
			
			this.stops = [];			
			for (var i=0; i<this.children.length; i++) {
				var child = this.children[i];
				this.stops.push(child);
			}	
			
			this.getGradient = function() {
				// OVERRIDE ME!
			}			

			this.createGradient = function(ctx, element) {
				var stopsContainer = this;
				if (this.attribute('xlink:href').hasValue()) {
					stopsContainer = this.attribute('xlink:href').Definition.getDefinition();
				}
			
				var g = this.getGradient(ctx, element);
				for (var i=0; i<stopsContainer.stops.length; i++) {
					g.addColorStop(stopsContainer.stops[i].offset, stopsContainer.stops[i].color);
				}
				
				if (this.attribute('gradientTransform').hasValue()) {
					// render as transformed pattern on temporary canvas
					var rootView = svg.ViewPort.viewPorts[0];
					
					var rect = new svg.Element.rect();
					rect.attributes['x'] = new svg.Property('x', -svg.MAX_VIRTUAL_PIXELS/3.0);
					rect.attributes['y'] = new svg.Property('y', -svg.MAX_VIRTUAL_PIXELS/3.0);
					rect.attributes['width'] = new svg.Property('width', svg.MAX_VIRTUAL_PIXELS);
					rect.attributes['height'] = new svg.Property('height', svg.MAX_VIRTUAL_PIXELS);
					
					var group = new svg.Element.g();
					group.attributes['transform'] = new svg.Property('transform', this.attribute('gradientTransform').value);
					group.children = [ rect ];
					
					var tempSvg = new svg.Element.svg();
					tempSvg.attributes['x'] = new svg.Property('x', 0);
					tempSvg.attributes['y'] = new svg.Property('y', 0);
					tempSvg.attributes['width'] = new svg.Property('width', rootView.width);
					tempSvg.attributes['height'] = new svg.Property('height', rootView.height);
					tempSvg.children = [ group ];
					
					var c = document.createElement('canvas');
					c.width = rootView.width;
					c.height = rootView.height;
					var tempCtx = c.getContext('2d');
					tempCtx.fillStyle = g;
					tempSvg.render(tempCtx);		
					return tempCtx.createPattern(c, 'no-repeat');
				}
				
				return g;				
			}
		}
		svg.Element.GradientBase.prototype = new svg.Element.ElementBase;
		
		// linear gradient element
		svg.Element.linearGradient = function(node) {
			this.base = svg.Element.GradientBase;
			this.base(node);
			
			this.getGradient = function(ctx, element) {
				var bb = element.getBoundingBox();
				
				var x1 = (this.gradientUnits == 'objectBoundingBox' 
					? bb.x() + bb.width() * this.attribute('x1').numValue() 
					: this.attribute('x1').Length.toPixels('x'));
				var y1 = (this.gradientUnits == 'objectBoundingBox' 
					? bb.y() + bb.height() * this.attribute('y1').numValue()
					: this.attribute('y1').Length.toPixels('y'));
				var x2 = (this.gradientUnits == 'objectBoundingBox' 
					? bb.x() + bb.width() * this.attribute('x2').numValue()
					: this.attribute('x2').Length.toPixels('x'));
				var y2 = (this.gradientUnits == 'objectBoundingBox' 
					? bb.y() + bb.height() * this.attribute('y2').numValue()
					: this.attribute('y2').Length.toPixels('y'));

				return ctx.createLinearGradient(x1, y1, x2, y2);
			}
		}
		svg.Element.linearGradient.prototype = new svg.Element.GradientBase;
		
		// radial gradient element
		svg.Element.radialGradient = function(node) {
			this.base = svg.Element.GradientBase;
			this.base(node);
			
			this.getGradient = function(ctx, element) {
				var bb = element.getBoundingBox();
				
				var cx = (this.gradientUnits == 'objectBoundingBox' 
					? bb.x() + bb.width() * this.attribute('cx').numValue() 
					: this.attribute('cx').Length.toPixels('x'));
				var cy = (this.gradientUnits == 'objectBoundingBox' 
					? bb.y() + bb.height() * this.attribute('cy').numValue() 
					: this.attribute('cy').Length.toPixels('y'));
				
				var fx = cx;
				var fy = cy;
				if (this.attribute('fx').hasValue()) {
					fx = (this.gradientUnits == 'objectBoundingBox' 
					? bb.x() + bb.width() * this.attribute('fx').numValue() 
					: this.attribute('fx').Length.toPixels('x'));
				}
				if (this.attribute('fy').hasValue()) {
					fy = (this.gradientUnits == 'objectBoundingBox' 
					? bb.y() + bb.height() * this.attribute('fy').numValue() 
					: this.attribute('fy').Length.toPixels('y'));
				}
				
				var r = (this.gradientUnits == 'objectBoundingBox' 
					? (bb.width() + bb.height()) / 2.0 * this.attribute('r').numValue()
					: this.attribute('r').Length.toPixels());
				
				return ctx.createRadialGradient(fx, fy, 0, cx, cy, r);
			}
		}
		svg.Element.radialGradient.prototype = new svg.Element.GradientBase;
		
		// gradient stop element
		svg.Element.stop = function(node) {
			this.base = svg.Element.ElementBase;
			this.base(node);
			
			this.offset = this.attribute('offset').numValue();
			
			var stopColor = this.style('stop-color');
			if (this.style('stop-opacity').hasValue()) stopColor = stopColor.Color.addOpacity(this.style('stop-opacity').value);
			this.color = stopColor.value;
		}
		svg.Element.stop.prototype = new svg.Element.ElementBase;
		
		// animation base element
		svg.Element.AnimateBase = function(node) {
			this.base = svg.Element.ElementBase;
			this.base(node);
			
			svg.Animations.push(this);
			
			this.duration = 0.0;
			this.begin = this.attribute('begin').Time.toMilliseconds();
			this.maxDuration = this.begin + this.attribute('dur').Time.toMilliseconds();
			
			this.getProperty = function() {
				var attributeType = this.attribute('attributeType').value;
				var attributeName = this.attribute('attributeName').value;
				
				if (attributeType == 'CSS') {
					return this.parent.style(attributeName, true);
				}
				return this.parent.attribute(attributeName, true);			
			};
			
			this.initialValue = null;
			this.removed = false;			

			this.calcValue = function() {
				// OVERRIDE ME!
				return '';
			}
			
			this.update = function(delta) {	
				// set initial value
				if (this.initialValue == null) {
					this.initialValue = this.getProperty().value;
				}
			
				// if we're past the end time
				if (this.duration > this.maxDuration) {
					// loop for indefinitely repeating animations
					if (this.attribute('repeatCount').value == 'indefinite') {
						this.duration = 0.0
					}
					else if (this.attribute('fill').valueOrDefault('remove') == 'remove' && !this.removed) {
						this.removed = true;
						this.getProperty().value = this.initialValue;
						return true;
					}
					else {
						return false; // no updates made
					}
				}			
				this.duration = this.duration + delta;
			
				// if we're past the begin time
				var updated = false;
				if (this.begin < this.duration) {
					var newValue = this.calcValue(); // tween
					
					if (this.attribute('type').hasValue()) {
						// for transform, etc.
						var type = this.attribute('type').value;
						newValue = type + '(' + newValue + ')';
					}
					
					this.getProperty().value = newValue;
					updated = true;
				}
				
				return updated;
			}
			
			// fraction of duration we've covered
			this.progress = function() {
				return ((this.duration - this.begin) / (this.maxDuration - this.begin));
			}			
		}
		svg.Element.AnimateBase.prototype = new svg.Element.ElementBase;
		
		// animate element
		svg.Element.animate = function(node) {
			this.base = svg.Element.AnimateBase;
			this.base(node);
			
			this.calcValue = function() {
				var from = this.attribute('from').numValue();
				var to = this.attribute('to').numValue();
				
				// tween value linearly
				return from + (to - from) * this.progress(); 
			};
		}
		svg.Element.animate.prototype = new svg.Element.AnimateBase;
			
		// animate color element
		svg.Element.animateColor = function(node) {
			this.base = svg.Element.AnimateBase;
			this.base(node);

			this.calcValue = function() {
				var from = new RGBColor(this.attribute('from').value);
				var to = new RGBColor(this.attribute('to').value);
				
				if (from.ok && to.ok) {
					// tween color linearly
					var r = from.r + (to.r - from.r) * this.progress();
					var g = from.g + (to.g - from.g) * this.progress();
					var b = from.b + (to.b - from.b) * this.progress();
					return 'rgb('+parseInt(r,10)+','+parseInt(g,10)+','+parseInt(b,10)+')';
				}
				return this.attribute('from').value;
			};
		}
		svg.Element.animateColor.prototype = new svg.Element.AnimateBase;
		
		// animate transform element
		svg.Element.animateTransform = function(node) {
			this.base = svg.Element.animate;
			this.base(node);
		}
		svg.Element.animateTransform.prototype = new svg.Element.animate;
		
		// font element
		svg.Element.font = function(node) {
			this.base = svg.Element.ElementBase;
			this.base(node);

			this.horizAdvX = this.attribute('horiz-adv-x').numValue();			
			
			this.isRTL = false;
			this.isArabic = false;
			this.fontFace = null;
			this.missingGlyph = null;
			this.glyphs = [];			
			for (var i=0; i<this.children.length; i++) {
				var child = this.children[i];
				if (child.type == 'font-face') {
					this.fontFace = child;
					if (child.style('font-family').hasValue()) {
						svg.Definitions[child.style('font-family').value] = this;
					}
				}
				else if (child.type == 'missing-glyph') this.missingGlyph = child;
				else if (child.type == 'glyph') {
					if (child.arabicForm != '') {
						this.isRTL = true;
						this.isArabic = true;
						if (typeof(this.glyphs[child.unicode]) == 'undefined') this.glyphs[child.unicode] = [];
						this.glyphs[child.unicode][child.arabicForm] = child;
					}
					else {
						this.glyphs[child.unicode] = child;
					}
				}
			}	
		}
		svg.Element.font.prototype = new svg.Element.ElementBase;
		
		// font-face element
		svg.Element.fontface = function(node) {
			this.base = svg.Element.ElementBase;
			this.base(node);	
			
			this.ascent = this.attribute('ascent').value;
			this.descent = this.attribute('descent').value;
			this.unitsPerEm = this.attribute('units-per-em').numValue();				
		}
		svg.Element.fontface.prototype = new svg.Element.ElementBase;
		
		// missing-glyph element
		svg.Element.missingglyph = function(node) {
			this.base = svg.Element.path;
			this.base(node);	
			
			this.horizAdvX = 0;
		}
		svg.Element.missingglyph.prototype = new svg.Element.path;
		
		// glyph element
		svg.Element.glyph = function(node) {
			this.base = svg.Element.path;
			this.base(node);	
			
			this.horizAdvX = this.attribute('horiz-adv-x').numValue();
			this.unicode = this.attribute('unicode').value;
			this.arabicForm = this.attribute('arabic-form').value;
		}
		svg.Element.glyph.prototype = new svg.Element.path;
		
		// text element
		svg.Element.text = function(node) {
			this.base = svg.Element.RenderedElementBase;
			this.base(node);
			
			if (node != null) {
				// add children
				this.children = [];
				for (var i=0; i<node.childNodes.length; i++) {
					var childNode = node.childNodes[i];
					if (childNode.nodeType == 1) { // capture tspan and tref nodes
						this.addChild(childNode, true);
					}
					else if (childNode.nodeType == 3) { // capture text
						this.addChild(new svg.Element.tspan(childNode), false);
					}
				}
			}
			
			this.baseSetContext = this.setContext;
			this.setContext = function(ctx) {
				this.baseSetContext(ctx);
				if (this.style('dominant-baseline').hasValue()) ctx.textBaseline = this.style('dominant-baseline').value;
				if (this.style('alignment-baseline').hasValue()) ctx.textBaseline = this.style('alignment-baseline').value;
			}
			
			this.renderChildren = function(ctx) {
				var textAnchor = this.style('text-anchor').valueOrDefault('start');
				var x = this.attribute('x').Length.toPixels('x');
				var y = this.attribute('y').Length.toPixels('y');
				for (var i=0; i<this.children.length; i++) {
					var child = this.children[i];
				
					if (child.attribute('x').hasValue()) {
						child.x = child.attribute('x').Length.toPixels('x');
					}
					else {
						if (child.attribute('dx').hasValue()) x += child.attribute('dx').Length.toPixels('x');
						child.x = x;
					}
					
					var childLength = child.measureText(ctx);
					if (textAnchor != 'start' && (i==0 || child.attribute('x').hasValue())) { // new group?
						// loop through rest of children
						var groupLength = childLength;
						for (var j=i+1; j<this.children.length; j++) {
							var childInGroup = this.children[j];
							if (childInGroup.attribute('x').hasValue()) break; // new group
							groupLength += childInGroup.measureText(ctx);
						}
						child.x -= (textAnchor == 'end' ? groupLength : groupLength / 2.0);
					}
					x = child.x + childLength;
					
					if (child.attribute('y').hasValue()) {
						child.y = child.attribute('y').Length.toPixels('y');
					}
					else {
						if (child.attribute('dy').hasValue()) y += child.attribute('dy').Length.toPixels('y');
						child.y = y;
					}	
					y = child.y;
					
					child.render(ctx);
				}
			}
		}
		svg.Element.text.prototype = new svg.Element.RenderedElementBase;
		
		// text base
		svg.Element.TextElementBase = function(node) {
			this.base = svg.Element.RenderedElementBase;
			this.base(node);
			
			this.getGlyph = function(font, text, i) {
				var c = text[i];
				var glyph = null;
				if (font.isArabic) {
					var arabicForm = 'isolated';
					if ((i==0 || text[i-1]==' ') && i<text.length-2 && text[i+1]!=' ') arabicForm = 'terminal'; 
					if (i>0 && text[i-1]!=' ' && i<text.length-2 && text[i+1]!=' ') arabicForm = 'medial';
					if (i>0 && text[i-1]!=' ' && (i == text.length-1 || text[i+1]==' ')) arabicForm = 'initial';
					if (typeof(font.glyphs[c]) != 'undefined') {
						glyph = font.glyphs[c][arabicForm];
						if (glyph == null && font.glyphs[c].type == 'glyph') glyph = font.glyphs[c];
					}
				}
				else {
					glyph = font.glyphs[c];
				}
				if (glyph == null) glyph = font.missingGlyph;
				return glyph;
			}
			
			this.renderChildren = function(ctx) {
				var customFont = this.parent.style('font-family').Definition.getDefinition();
				if (customFont != null) {
					var fontSize = this.parent.style('font-size').numValueOrDefault(svg.Font.Parse(svg.ctx.font).fontSize);
					var fontStyle = this.parent.style('font-style').valueOrDefault(svg.Font.Parse(svg.ctx.font).fontStyle);
					var text = this.getText();
					if (customFont.isRTL) text = text.split("").reverse().join("");
					
					var dx = svg.ToNumberArray(this.parent.attribute('dx').value);
					for (var i=0; i<text.length; i++) {
						var glyph = this.getGlyph(customFont, text, i);
						var scale = fontSize / customFont.fontFace.unitsPerEm;
						ctx.translate(this.x, this.y);
						ctx.scale(scale, -scale);
						var lw = ctx.lineWidth;
						ctx.lineWidth = ctx.lineWidth * customFont.fontFace.unitsPerEm / fontSize;
						if (fontStyle == 'italic') ctx.transform(1, 0, .4, 1, 0, 0);
						glyph.render(ctx);
						if (fontStyle == 'italic') ctx.transform(1, 0, -.4, 1, 0, 0);
						ctx.lineWidth = lw;
						ctx.scale(1/scale, -1/scale);
						ctx.translate(-this.x, -this.y);	
						
						this.x += fontSize * (glyph.horizAdvX || customFont.horizAdvX) / customFont.fontFace.unitsPerEm;
						if (typeof(dx[i]) != 'undefined' && !isNaN(dx[i])) {
							this.x += dx[i];
						}
					}
					return;
				}
			
				if (ctx.strokeStyle != '') ctx.strokeText(svg.compressSpaces(this.getText()), this.x, this.y);
				if (ctx.fillStyle != '') ctx.fillText(svg.compressSpaces(this.getText()), this.x, this.y);
			}
			
			this.getText = function() {
				// OVERRIDE ME
			}
			
			this.measureText = function(ctx) {
				var customFont = this.parent.style('font-family').Definition.getDefinition();
				if (customFont != null) {
					var fontSize = this.parent.style('font-size').numValueOrDefault(svg.Font.Parse(svg.ctx.font).fontSize);
					var measure = 0;
					var text = this.getText();
					if (customFont.isRTL) text = text.split("").reverse().join("");
					var dx = svg.ToNumberArray(this.parent.attribute('dx').value);
					for (var i=0; i<text.length; i++) {
						var glyph = this.getGlyph(customFont, text, i);
						measure += (glyph.horizAdvX || customFont.horizAdvX) * fontSize / customFont.fontFace.unitsPerEm;
						if (typeof(dx[i]) != 'undefined' && !isNaN(dx[i])) {
							measure += dx[i];
						}
					}
					return measure;
				}
			
				var textToMeasure = svg.compressSpaces(this.getText());
				if (!ctx.measureText) return textToMeasure.length * 10;
				
				ctx.save();
				this.setContext(ctx);
				var width = ctx.measureText(textToMeasure).width;
				ctx.restore();
				return width;
			}
		}
		svg.Element.TextElementBase.prototype = new svg.Element.RenderedElementBase;
		
		// tspan 
		svg.Element.tspan = function(node) {
			this.base = svg.Element.TextElementBase;
			this.base(node);
			
			this.text = node.nodeType == 3 ? node.nodeValue : // text
						node.childNodes.length > 0 ? node.childNodes[0].nodeValue : // element
						node.text;
			this.getText = function() {
				return this.text;
			}
		}
		svg.Element.tspan.prototype = new svg.Element.TextElementBase;
		
		// tref
		svg.Element.tref = function(node) {
			this.base = svg.Element.TextElementBase;
			this.base(node);
			
			this.getText = function() {
				var element = this.attribute('xlink:href').Definition.getDefinition();
				if (element != null) return element.children[0].getText();
			}
		}
		svg.Element.tref.prototype = new svg.Element.TextElementBase;		
		
		// a element
		svg.Element.a = function(node) {
			this.base = svg.Element.TextElementBase;
			this.base(node);
			
			this.hasText = true;
			for (var i=0; i<node.childNodes.length; i++) {
				if (node.childNodes[i].nodeType != 3) this.hasText = false;
			}
			
			// this might contain text
			this.text = this.hasText ? node.childNodes[0].nodeValue : '';
			this.getText = function() {
				return this.text;
			}		

			this.baseRenderChildren = this.renderChildren;
			this.renderChildren = function(ctx) {
				if (this.hasText) {
					// render as text element
					this.baseRenderChildren(ctx);
					var fontSize = new svg.Property('fontSize', svg.Font.Parse(svg.ctx.font).fontSize);
					svg.Mouse.checkBoundingBox(this, new svg.BoundingBox(this.x, this.y - fontSize.Length.toPixels('y'), this.x + this.measureText(ctx), this.y));					
				}
				else {
					// render as temporary group
					var g = new svg.Element.g();
					g.children = this.children;
					g.parent = this;
					g.render(ctx);
				}
			}
			
			this.onclick = function() {
				window.open(this.attribute('xlink:href').value);
			}
			
			this.onmousemove = function() {
				svg.ctx.canvas.style.cursor = 'pointer';
			}
		}
		svg.Element.a.prototype = new svg.Element.TextElementBase;		
		
		// image element
		svg.Element.image = function(node) {
			this.base = svg.Element.RenderedElementBase;
			this.base(node);
			
			svg.Images.push(this);
			this.img = document.createElement('img');
			this.loaded = false;
			var that = this;
			this.img.onload = function() { that.loaded = true; }
			this.img.src = this.attribute('xlink:href').value;
			
			this.renderChildren = function(ctx) {
				var x = this.attribute('x').Length.toPixels('x');
				var y = this.attribute('y').Length.toPixels('y');
				
				var width = this.attribute('width').Length.toPixels('x');
				var height = this.attribute('height').Length.toPixels('y');			
				if (width == 0 || height == 0) return;
			
				ctx.save();
				ctx.translate(x, y);
				svg.AspectRatio(ctx,
								this.attribute('preserveAspectRatio').value,
								width,
								this.img.width,
								height,
								this.img.height,
								0,
								0);	
				ctx.drawImage(this.img, 0, 0);			
				ctx.restore();
			}
		}
		svg.Element.image.prototype = new svg.Element.RenderedElementBase;
		
		// group element
		svg.Element.g = function(node) {
			this.base = svg.Element.RenderedElementBase;
			this.base(node);
			
			this.getBoundingBox = function() {
				var bb = new svg.BoundingBox();
				for (var i=0; i<this.children.length; i++) {
					bb.addBoundingBox(this.children[i].getBoundingBox());
				}
				return bb;
			};
		}
		svg.Element.g.prototype = new svg.Element.RenderedElementBase;

		// symbol element
		svg.Element.symbol = function(node) {
			this.base = svg.Element.RenderedElementBase;
			this.base(node);
			
			this.baseSetContext = this.setContext;
			this.setContext = function(ctx) {		
				this.baseSetContext(ctx);
				
				// viewbox
				if (this.attribute('viewBox').hasValue()) {				
					var viewBox = svg.ToNumberArray(this.attribute('viewBox').value);
					var minX = viewBox[0];
					var minY = viewBox[1];
					width = viewBox[2];
					height = viewBox[3];
					
					svg.AspectRatio(ctx,
									this.attribute('preserveAspectRatio').value, 
									this.attribute('width').Length.toPixels('x'),
									width,
									this.attribute('height').Length.toPixels('y'),
									height,
									minX,
									minY);

					svg.ViewPort.SetCurrent(viewBox[2], viewBox[3]);						
				}
			}			
		}
		svg.Element.symbol.prototype = new svg.Element.RenderedElementBase;		
			
		// style element
		svg.Element.style = function(node) { 
			this.base = svg.Element.ElementBase;
			this.base(node);
			
			// text, or spaces then CDATA
			var css = node.childNodes[0].nodeValue + (node.childNodes.length > 1 ? node.childNodes[1].nodeValue : '');
			css = css.replace(/(\/\*([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*+\/)|(^[\s]*\/\/.*)/gm, ''); // remove comments
			css = svg.compressSpaces(css); // replace whitespace
			var cssDefs = css.split('}');
			for (var i=0; i<cssDefs.length; i++) {
				if (svg.trim(cssDefs[i]) != '') {
					var cssDef = cssDefs[i].split('{');
					var cssClasses = cssDef[0].split(',');
					var cssProps = cssDef[1].split(';');
					for (var j=0; j<cssClasses.length; j++) {
						var cssClass = svg.trim(cssClasses[j]);
						if (cssClass != '') {
							var props = {};
							for (var k=0; k<cssProps.length; k++) {
								var prop = cssProps[k].indexOf(':');
								var name = cssProps[k].substr(0, prop);
								var value = cssProps[k].substr(prop + 1, cssProps[k].length - prop);
								if (name != null && value != null) {
									props[svg.trim(name)] = new svg.Property(svg.trim(name), svg.trim(value));
								}
							}
							svg.Styles[cssClass] = props;
							if (cssClass == '@font-face') {
								var fontFamily = props['font-family'].value.replace(/"/g,'');
								var srcs = props['src'].value.split(',');
								for (var s=0; s<srcs.length; s++) {
									if (srcs[s].indexOf('format("svg")') > 0) {
										var urlStart = srcs[s].indexOf('url');
										var urlEnd = srcs[s].indexOf(')', urlStart);
										var url = srcs[s].substr(urlStart + 5, urlEnd - urlStart - 6);
										var doc = svg.parseXml(svg.ajax(url));
										var fonts = doc.getElementsByTagName('font');
										for (var f=0; f<fonts.length; f++) {
											var font = svg.CreateElement(fonts[f]);
											svg.Definitions[fontFamily] = font;
										}
									}
								}
							}
						}
					}
				}
			}
		}
		svg.Element.style.prototype = new svg.Element.ElementBase;
		
		// use element 
		svg.Element.use = function(node) {
			this.base = svg.Element.RenderedElementBase;
			this.base(node);
			
			this.baseSetContext = this.setContext;
			this.setContext = function(ctx) {
				this.baseSetContext(ctx);
				if (this.attribute('x').hasValue()) ctx.translate(this.attribute('x').Length.toPixels('x'), 0);
				if (this.attribute('y').hasValue()) ctx.translate(0, this.attribute('y').Length.toPixels('y'));
			}
			
			this.getDefinition = function() {
				var element = this.attribute('xlink:href').Definition.getDefinition();
				if (this.attribute('width').hasValue()) element.attribute('width', true).value = this.attribute('width').value;
				if (this.attribute('height').hasValue()) element.attribute('height', true).value = this.attribute('height').value;
				return element;
			}
			
			this.path = function(ctx) {
				var element = this.getDefinition();
				if (element != null) element.path(ctx);
			}
			
			this.renderChildren = function(ctx) {
				var element = this.getDefinition();
				if (element != null) element.render(ctx);
			}
		}
		svg.Element.use.prototype = new svg.Element.RenderedElementBase;
		
		// mask element
		svg.Element.mask = function(node) {
			this.base = svg.Element.ElementBase;
			this.base(node);
						
			this.apply = function(ctx, element) {
				// render as temp svg	
				var x = this.attribute('x').Length.toPixels('x');
				var y = this.attribute('y').Length.toPixels('y');
				var width = this.attribute('width').Length.toPixels('x');
				var height = this.attribute('height').Length.toPixels('y');
				
				// temporarily remove mask to avoid recursion
				var mask = element.attribute('mask').value;
				element.attribute('mask').value = '';
				
					var cMask = document.createElement('canvas');
					cMask.width = x + width;
					cMask.height = y + height;
					var maskCtx = cMask.getContext('2d');
					this.renderChildren(maskCtx);
				
					var c = document.createElement('canvas');
					c.width = x + width;
					c.height = y + height;
					var tempCtx = c.getContext('2d');
					element.render(tempCtx);
					tempCtx.globalCompositeOperation = 'destination-in';
					tempCtx.fillStyle = maskCtx.createPattern(cMask, 'no-repeat');
					tempCtx.fillRect(0, 0, x + width, y + height);
					
					ctx.fillStyle = tempCtx.createPattern(c, 'no-repeat');
					ctx.fillRect(0, 0, x + width, y + height);
					
				// reassign mask
				element.attribute('mask').value = mask;	
			}
			
			this.render = function(ctx) {
				// NO RENDER
			}
		}
		svg.Element.mask.prototype = new svg.Element.ElementBase;
		
		// clip element
		svg.Element.clipPath = function(node) {
			this.base = svg.Element.ElementBase;
			this.base(node);
			
			this.apply = function(ctx) {
				for (var i=0; i<this.children.length; i++) {
					if (this.children[i].path) {
						this.children[i].path(ctx);
						ctx.clip();
					}
				}
			}
			
			this.render = function(ctx) {
				// NO RENDER
			}
		}
		svg.Element.clipPath.prototype = new svg.Element.ElementBase;

		// filters
		svg.Element.filter = function(node) {
			this.base = svg.Element.ElementBase;
			this.base(node);
						
			this.apply = function(ctx, element) {
				// render as temp svg	
				var bb = element.getBoundingBox();
				var x = this.attribute('x').Length.toPixels('x');
				var y = this.attribute('y').Length.toPixels('y');
				if (x == 0 || y == 0) {
					x = bb.x1;
					y = bb.y1;
				}
				var width = this.attribute('width').Length.toPixels('x');
				var height = this.attribute('height').Length.toPixels('y');
				if (width == 0 || height == 0) {
					width = bb.width();
					height = bb.height();
				}
				
				// temporarily remove filter to avoid recursion
				var filter = element.style('filter').value;
				element.style('filter').value = '';
				
				// max filter distance
				var extraPercent = .20;
				var px = extraPercent * width;
				var py = extraPercent * height;
				
				var c = document.createElement('canvas');
				c.width = width + 2*px;
				c.height = height + 2*py;
				var tempCtx = c.getContext('2d');
				tempCtx.translate(-x + px, -y + py);
				element.render(tempCtx);
			
				// apply filters
				for (var i=0; i<this.children.length; i++) {
					this.children[i].apply(tempCtx, 0, 0, width + 2*px, height + 2*py);
				}
				
				// render on me
				ctx.drawImage(c, 0, 0, width + 2*px, height + 2*py, x - px, y - py, width + 2*px, height + 2*py);
				
				// reassign filter
				element.style('filter', true).value = filter;	
			}
			
			this.render = function(ctx) {
				// NO RENDER
			}		
		}
		svg.Element.filter.prototype = new svg.Element.ElementBase;
		
		svg.Element.feGaussianBlur = function(node) {
			this.base = svg.Element.ElementBase;
			this.base(node);	
			
			function make_fgauss(sigma) {
				sigma = Math.max(sigma, 0.01);			      
				var len = Math.ceil(sigma * 4.0) + 1;                     
				mask = [];                               
				for (var i = 0; i < len; i++) {                             
					mask[i] = Math.exp(-0.5 * (i / sigma) * (i / sigma));                                           
				}                                                           
				return mask; 
			}
			
			function normalize(mask) {
				var sum = 0;
				for (var i = 1; i < mask.length; i++) {
					sum += Math.abs(mask[i]);
				}
				sum = 2 * sum + Math.abs(mask[0]);
				for (var i = 0; i < mask.length; i++) {
					mask[i] /= sum;
				}
				return mask;
			}
			
			function convolve_even(src, dst, mask, width, height) {
			  for (var y = 0; y < height; y++) {
				for (var x = 0; x < width; x++) {
				  var a = imGet(src, x, y, width, height, 3)/255;
				  for (var rgba = 0; rgba < 4; rgba++) {					  
					  var sum = mask[0] * (a==0?255:imGet(src, x, y, width, height, rgba)) * (a==0||rgba==3?1:a);
					  for (var i = 1; i < mask.length; i++) {
						var a1 = imGet(src, Math.max(x-i,0), y, width, height, 3)/255;
					    var a2 = imGet(src, Math.min(x+i, width-1), y, width, height, 3)/255;
						sum += mask[i] * 
						  ((a1==0?255:imGet(src, Math.max(x-i,0), y, width, height, rgba)) * (a1==0||rgba==3?1:a1) + 
						   (a2==0?255:imGet(src, Math.min(x+i, width-1), y, width, height, rgba)) * (a2==0||rgba==3?1:a2));
					  }
					  imSet(dst, y, x, height, width, rgba, sum);
				  }			  
				}
			  }
			}		

			function imGet(img, x, y, width, height, rgba) {
				return img[y*width*4 + x*4 + rgba];
			}
			
			function imSet(img, x, y, width, height, rgba, val) {
				img[y*width*4 + x*4 + rgba] = val;
			}
						
			function blur(ctx, width, height, sigma)
			{
				var srcData = ctx.getImageData(0, 0, width, height);
				var mask = make_fgauss(sigma);
				mask = normalize(mask);
				tmp = [];
				convolve_even(srcData.data, tmp, mask, width, height);
				convolve_even(tmp, srcData.data, mask, height, width);
				ctx.clearRect(0, 0, width, height);
				ctx.putImageData(srcData, 0, 0);
			}			
		
			this.apply = function(ctx, x, y, width, height) {
				// assuming x==0 && y==0 for now
				blur(ctx, width, height, this.attribute('stdDeviation').numValue());
			}
		}
		svg.Element.filter.prototype = new svg.Element.feGaussianBlur;
		
		// title element, do nothing
		svg.Element.title = function(node) {
		}
		svg.Element.title.prototype = new svg.Element.ElementBase;

		// desc element, do nothing
		svg.Element.desc = function(node) {
		}
		svg.Element.desc.prototype = new svg.Element.ElementBase;		
		
		svg.Element.MISSING = function(node) {
			console.log('ERROR: Element \'' + node.nodeName + '\' not yet implemented.');
		}
		svg.Element.MISSING.prototype = new svg.Element.ElementBase;
		
		// element factory
		svg.CreateElement = function(node) {	
			var className = node.nodeName.replace(/^[^:]+:/,''); // remove namespace
			className = className.replace(/\-/g,''); // remove dashes
			var e = null;
			if (typeof(svg.Element[className]) != 'undefined') {
				e = new svg.Element[className](node);
			}
			else {
				e = new svg.Element.MISSING(node);
			}

			e.type = node.nodeName;
			return e;
		}
				
		// load from url
		svg.load = function(ctx, url) {
			svg.loadXml(ctx, svg.ajax(url));
		}
		
		// load from xml
		svg.loadXml = function(ctx, xml) {
			svg.loadXmlDoc(ctx, svg.parseXml(xml));
		}
		
		svg.loadXmlDoc = function(ctx, dom) {
			svg.init(ctx);
			
			var mapXY = function(p) {
				var e = ctx.canvas;
				while (e) {
					p.x -= e.offsetLeft;
					p.y -= e.offsetTop;
					e = e.offsetParent;
				}
				if (window.scrollX) p.x += window.scrollX;
				if (window.scrollY) p.y += window.scrollY;
				return p;
			}
			
			// bind mouse
			if (svg.opts['ignoreMouse'] != true) {
				ctx.canvas.onclick = function(e) {
					var p = mapXY(new svg.Point(e != null ? e.clientX : event.clientX, e != null ? e.clientY : event.clientY));
					svg.Mouse.onclick(p.x, p.y);
				};
				ctx.canvas.onmousemove = function(e) {
					var p = mapXY(new svg.Point(e != null ? e.clientX : event.clientX, e != null ? e.clientY : event.clientY));
					svg.Mouse.onmousemove(p.x, p.y);
				};
			}
		
			var e = svg.CreateElement(dom.documentElement);
			e.root = true;
					
			// render loop
			var isFirstRender = true;
			var draw = function() {
				svg.ViewPort.Clear();
				if (ctx.canvas.parentNode) svg.ViewPort.SetCurrent(ctx.canvas.parentNode.clientWidth, ctx.canvas.parentNode.clientHeight);
			
				if (svg.opts['ignoreDimensions'] != true) {
					// set canvas size
					if (e.style('width').hasValue()) {
						ctx.canvas.width = e.style('width').Length.toPixels('x');
						ctx.canvas.style.width = ctx.canvas.width + 'px';
					}
					if (e.style('height').hasValue()) {
						ctx.canvas.height = e.style('height').Length.toPixels('y');
						ctx.canvas.style.height = ctx.canvas.height + 'px';
					}
				}
				var cWidth = ctx.canvas.clientWidth || ctx.canvas.width;
				var cHeight = ctx.canvas.clientHeight || ctx.canvas.height;
				svg.ViewPort.SetCurrent(cWidth, cHeight);		
				
				if (svg.opts != null && svg.opts['offsetX'] != null) e.attribute('x', true).value = svg.opts['offsetX'];
				if (svg.opts != null && svg.opts['offsetY'] != null) e.attribute('y', true).value = svg.opts['offsetY'];
				if (svg.opts != null && svg.opts['scaleWidth'] != null && svg.opts['scaleHeight'] != null) {
					var xRatio = 1, yRatio = 1;
					if (e.attribute('width').hasValue()) xRatio = e.attribute('width').Length.toPixels('x') / svg.opts['scaleWidth'];
					if (e.attribute('height').hasValue()) yRatio = e.attribute('height').Length.toPixels('y') / svg.opts['scaleHeight'];
				
					e.attribute('width', true).value = svg.opts['scaleWidth'];
					e.attribute('height', true).value = svg.opts['scaleHeight'];			
					e.attribute('viewBox', true).value = '0 0 ' + (cWidth * xRatio) + ' ' + (cHeight * yRatio);
					e.attribute('preserveAspectRatio', true).value = 'none';
				}
			
				// clear and render
				if (svg.opts['ignoreClear'] != true) {
					ctx.clearRect(0, 0, cWidth, cHeight);
				}
				e.render(ctx);
				if (isFirstRender) {
					isFirstRender = false;
					if (svg.opts != null && typeof(svg.opts['renderCallback']) == 'function') svg.opts['renderCallback']();
				}			
			}
			
			var waitingForImages = true;
			if (svg.ImagesLoaded()) {
				waitingForImages = false;
				draw();
			}
			svg.intervalID = setInterval(function() { 
				var needUpdate = false;
				
				if (waitingForImages && svg.ImagesLoaded()) {
					waitingForImages = false;
					needUpdate = true;
				}
			
				// need update from mouse events?
				if (svg.opts['ignoreMouse'] != true) {
					needUpdate = needUpdate | svg.Mouse.hasEvents();
				}
			
				// need update from animations?
				if (svg.opts['ignoreAnimation'] != true) {
					for (var i=0; i<svg.Animations.length; i++) {
						needUpdate = needUpdate | svg.Animations[i].update(1000 / svg.FRAMERATE);
					}
				}
				
				// need update from redraw?
				if (svg.opts != null && typeof(svg.opts['forceRedraw']) == 'function') {
					if (svg.opts['forceRedraw']() == true) needUpdate = true;
				}
				
				// render if needed
				if (needUpdate) {
					draw();				
					svg.Mouse.runEvents(); // run and clear our events
				}
			}, 1000 / svg.FRAMERATE);
		}
		
		svg.stop = function() {
			if (svg.intervalID) {
				clearInterval(svg.intervalID);
			}
		}
		
		svg.Mouse = new (function() {
			this.events = [];
			this.hasEvents = function() { return this.events.length != 0; }
		
			this.onclick = function(x, y) {
				this.events.push({ type: 'onclick', x: x, y: y, 
					run: function(e) { if (e.onclick) e.onclick(); }
				});
			}
			
			this.onmousemove = function(x, y) {
				this.events.push({ type: 'onmousemove', x: x, y: y,
					run: function(e) { if (e.onmousemove) e.onmousemove(); }
				});
			}			
			
			this.eventElements = [];
			
			this.checkPath = function(element, ctx) {
				for (var i=0; i<this.events.length; i++) {
					var e = this.events[i];
					if (ctx.isPointInPath && ctx.isPointInPath(e.x, e.y)) this.eventElements[i] = element;
				}
			}
			
			this.checkBoundingBox = function(element, bb) {
				for (var i=0; i<this.events.length; i++) {
					var e = this.events[i];
					if (bb.isPointInBox(e.x, e.y)) this.eventElements[i] = element;
				}			
			}
			
			this.runEvents = function() {
				svg.ctx.canvas.style.cursor = '';
				
				for (var i=0; i<this.events.length; i++) {
					var e = this.events[i];
					var element = this.eventElements[i];
					while (element) {
						e.run(element);
						element = element.parent;
					}
				}		
			
				// done running, clear
				this.events = []; 
				this.eventElements = [];
			}
		});
		
		return svg;
	}
})();

if (CanvasRenderingContext2D) {
	CanvasRenderingContext2D.prototype.drawSvg = function(s, dx, dy, dw, dh) {
		canvg(this.canvas, s, { 
			ignoreMouse: true, 
			ignoreAnimation: true, 
			ignoreDimensions: true, 
			ignoreClear: true, 
			offsetX: dx, 
			offsetY: dy, 
			scaleWidth: dw, 
			scaleHeight: dh
		});
	}
}/**
 * @license Highcharts JS v3.0.6 (2013-10-04)
 * CanVGRenderer Extension module
 *
 * (c) 2011-2012 Torstein Hønsi, Erik Olsson
 *
 * License: www.highcharts.com/license
 */

// JSLint options:
/*global Highcharts */

(function (Highcharts) { // encapsulate
	var UNDEFINED,
		DIV = 'div',
		ABSOLUTE = 'absolute',
		RELATIVE = 'relative',
		HIDDEN = 'hidden',
		VISIBLE = 'visible',
		PX = 'px',
		css = Highcharts.css,
		CanVGRenderer = Highcharts.CanVGRenderer,
		SVGRenderer = Highcharts.SVGRenderer,
		extend = Highcharts.extend,
		merge = Highcharts.merge,
		addEvent = Highcharts.addEvent,
		createElement = Highcharts.createElement,
		discardElement = Highcharts.discardElement;

	// Extend CanVG renderer on demand, inherit from SVGRenderer
	extend(CanVGRenderer.prototype, SVGRenderer.prototype);

	// Add additional functionality:
	extend(CanVGRenderer.prototype, {
		create: function (chart, container, chartWidth, chartHeight) {
			this.setContainer(container, chartWidth, chartHeight);
			this.configure(chart);
		},
		setContainer: function (container, chartWidth, chartHeight) {
			var containerStyle = container.style,
				containerParent = container.parentNode,
				containerLeft = containerStyle.left,
				containerTop = containerStyle.top,
				containerOffsetWidth = container.offsetWidth,
				containerOffsetHeight = container.offsetHeight,
				canvas,
				initialHiddenStyle = { visibility: HIDDEN, position: ABSOLUTE };

			this.init.apply(this, [container, chartWidth, chartHeight]);

			// add the canvas above it
			canvas = createElement('canvas', {
				width: containerOffsetWidth,
				height: containerOffsetHeight
			}, {
				position: RELATIVE,
				left: containerLeft,
				top: containerTop
			}, container);
			this.canvas = canvas;

			// Create the tooltip line and div, they are placed as siblings to
			// the container (and as direct childs to the div specified in the html page)
			this.ttLine = createElement(DIV, null, initialHiddenStyle, containerParent);
			this.ttDiv = createElement(DIV, null, initialHiddenStyle, containerParent);
			this.ttTimer = UNDEFINED;

			// Move away the svg node to a new div inside the container's parent so we can hide it.
			var hiddenSvg = createElement(DIV, {
				width: containerOffsetWidth,
				height: containerOffsetHeight
			}, {
				visibility: HIDDEN,
				left: containerLeft,
				top: containerTop
			}, containerParent);
			this.hiddenSvg = hiddenSvg;
			hiddenSvg.appendChild(this.box);
		},

		/**
		 * Configures the renderer with the chart. Attach a listener to the event tooltipRefresh.
		 **/
		configure: function (chart) {
			var renderer = this,
				options = chart.options.tooltip,
				borderWidth = options.borderWidth,
				tooltipDiv = renderer.ttDiv,
				tooltipDivStyle = options.style,
				tooltipLine = renderer.ttLine,
				padding = parseInt(tooltipDivStyle.padding, 10);

			// Add border styling from options to the style
			tooltipDivStyle = merge(tooltipDivStyle, {
				padding: padding + PX,
				'background-color': options.backgroundColor,
				'border-style': 'solid',
				'border-width': borderWidth + PX,
				'border-radius': options.borderRadius + PX
			});

			// Optionally add shadow
			if (options.shadow) {
				tooltipDivStyle = merge(tooltipDivStyle, {
					'box-shadow': '1px 1px 3px gray', // w3c
					'-webkit-box-shadow': '1px 1px 3px gray' // webkit
				});
			}
			css(tooltipDiv, tooltipDivStyle);

			// Set simple style on the line
			css(tooltipLine, {
				'border-left': '1px solid darkgray'
			});

			// This event is triggered when a new tooltip should be shown
			addEvent(chart, 'tooltipRefresh', function (args) {
				var chartContainer = chart.container,
					offsetLeft = chartContainer.offsetLeft,
					offsetTop = chartContainer.offsetTop,
					position;

				// Set the content of the tooltip
				tooltipDiv.innerHTML = args.text;

				// Compute the best position for the tooltip based on the divs size and container size.
				position = chart.tooltip.getPosition(tooltipDiv.offsetWidth, tooltipDiv.offsetHeight, {plotX: args.x, plotY: args.y});

				css(tooltipDiv, {
					visibility: VISIBLE,
					left: position.x + PX,
					top: position.y + PX,
					'border-color': args.borderColor
				});

				// Position the tooltip line
				css(tooltipLine, {
					visibility: VISIBLE,
					left: offsetLeft + args.x + PX,
					top: offsetTop + chart.plotTop + PX,
					height: chart.plotHeight  + PX
				});

				// This timeout hides the tooltip after 3 seconds
				// First clear any existing timer
				if (renderer.ttTimer !== UNDEFINED) {
					clearTimeout(renderer.ttTimer);
				}

				// Start a new timer that hides tooltip and line
				renderer.ttTimer = setTimeout(function () {
					css(tooltipDiv, { visibility: HIDDEN });
					css(tooltipLine, { visibility: HIDDEN });
				}, 3000);
			});
		},

		/**
		 * Extend SVGRenderer.destroy to also destroy the elements added by CanVGRenderer.
		 */
		destroy: function () {
			var renderer = this;

			// Remove the canvas
			discardElement(renderer.canvas);

			// Kill the timer
			if (renderer.ttTimer !== UNDEFINED) {
				clearTimeout(renderer.ttTimer);
			}

			// Remove the divs for tooltip and line
			discardElement(renderer.ttLine);
			discardElement(renderer.ttDiv);
			discardElement(renderer.hiddenSvg);

			// Continue with base class
			return SVGRenderer.prototype.destroy.apply(renderer);
		},

		/**
		 * Take a color and return it if it's a string, do not make it a gradient even if it is a
		 * gradient. Currently canvg cannot render gradients (turns out black),
		 * see: http://code.google.com/p/canvg/issues/detail?id=104
		 *
		 * @param {Object} color The color or config object
		 */
		color: function (color, elem, prop) {
			if (color && color.linearGradient) {
				// Pick the end color and forward to base implementation
				color = color.stops[color.stops.length - 1][1];
			}
			return SVGRenderer.prototype.color.call(this, color, elem, prop);
		},

		/**
		 * Draws the SVG on the canvas or adds a draw invokation to the deferred list.
		 */
		draw: function () {
			var renderer = this;
			window.canvg(renderer.canvas, renderer.hiddenSvg.innerHTML);
		}
	});
}(Highcharts));

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvdGhpcmQtcGFydHkvaGlnaGNoYXJ0cy9tb2R1bGVzL2NhbnZhcy10b29scy5zcmMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZSBBIGNsYXNzIHRvIHBhcnNlIGNvbG9yIHZhbHVlc1xuICogQGF1dGhvciBTdG95YW4gU3RlZmFub3YgPHNzdG9vQGdtYWlsLmNvbT5cbiAqIEBsaW5rICAgaHR0cDovL3d3dy5waHBpZWQuY29tL3JnYi1jb2xvci1wYXJzZXItaW4tamF2YXNjcmlwdC9cbiAqIFVzZSBpdCBpZiB5b3UgbGlrZSBpdFxuICpcbiAqL1xuZnVuY3Rpb24gUkdCQ29sb3IoY29sb3Jfc3RyaW5nKVxue1xuICAgIHRoaXMub2sgPSBmYWxzZTtcblxuICAgIC8vIHN0cmlwIGFueSBsZWFkaW5nICNcbiAgICBpZiAoY29sb3Jfc3RyaW5nLmNoYXJBdCgwKSA9PSAnIycpIHsgLy8gcmVtb3ZlICMgaWYgYW55XG4gICAgICAgIGNvbG9yX3N0cmluZyA9IGNvbG9yX3N0cmluZy5zdWJzdHIoMSw2KTtcbiAgICB9XG5cbiAgICBjb2xvcl9zdHJpbmcgPSBjb2xvcl9zdHJpbmcucmVwbGFjZSgvIC9nLCcnKTtcbiAgICBjb2xvcl9zdHJpbmcgPSBjb2xvcl9zdHJpbmcudG9Mb3dlckNhc2UoKTtcblxuICAgIC8vIGJlZm9yZSBnZXR0aW5nIGludG8gcmVnZXhwcywgdHJ5IHNpbXBsZSBtYXRjaGVzXG4gICAgLy8gYW5kIG92ZXJ3cml0ZSB0aGUgaW5wdXRcbiAgICB2YXIgc2ltcGxlX2NvbG9ycyA9IHtcbiAgICAgICAgYWxpY2VibHVlOiAnZjBmOGZmJyxcbiAgICAgICAgYW50aXF1ZXdoaXRlOiAnZmFlYmQ3JyxcbiAgICAgICAgYXF1YTogJzAwZmZmZicsXG4gICAgICAgIGFxdWFtYXJpbmU6ICc3ZmZmZDQnLFxuICAgICAgICBhenVyZTogJ2YwZmZmZicsXG4gICAgICAgIGJlaWdlOiAnZjVmNWRjJyxcbiAgICAgICAgYmlzcXVlOiAnZmZlNGM0JyxcbiAgICAgICAgYmxhY2s6ICcwMDAwMDAnLFxuICAgICAgICBibGFuY2hlZGFsbW9uZDogJ2ZmZWJjZCcsXG4gICAgICAgIGJsdWU6ICcwMDAwZmYnLFxuICAgICAgICBibHVldmlvbGV0OiAnOGEyYmUyJyxcbiAgICAgICAgYnJvd246ICdhNTJhMmEnLFxuICAgICAgICBidXJseXdvb2Q6ICdkZWI4ODcnLFxuICAgICAgICBjYWRldGJsdWU6ICc1ZjllYTAnLFxuICAgICAgICBjaGFydHJldXNlOiAnN2ZmZjAwJyxcbiAgICAgICAgY2hvY29sYXRlOiAnZDI2OTFlJyxcbiAgICAgICAgY29yYWw6ICdmZjdmNTAnLFxuICAgICAgICBjb3JuZmxvd2VyYmx1ZTogJzY0OTVlZCcsXG4gICAgICAgIGNvcm5zaWxrOiAnZmZmOGRjJyxcbiAgICAgICAgY3JpbXNvbjogJ2RjMTQzYycsXG4gICAgICAgIGN5YW46ICcwMGZmZmYnLFxuICAgICAgICBkYXJrYmx1ZTogJzAwMDA4YicsXG4gICAgICAgIGRhcmtjeWFuOiAnMDA4YjhiJyxcbiAgICAgICAgZGFya2dvbGRlbnJvZDogJ2I4ODYwYicsXG4gICAgICAgIGRhcmtncmF5OiAnYTlhOWE5JyxcbiAgICAgICAgZGFya2dyZWVuOiAnMDA2NDAwJyxcbiAgICAgICAgZGFya2toYWtpOiAnYmRiNzZiJyxcbiAgICAgICAgZGFya21hZ2VudGE6ICc4YjAwOGInLFxuICAgICAgICBkYXJrb2xpdmVncmVlbjogJzU1NmIyZicsXG4gICAgICAgIGRhcmtvcmFuZ2U6ICdmZjhjMDAnLFxuICAgICAgICBkYXJrb3JjaGlkOiAnOTkzMmNjJyxcbiAgICAgICAgZGFya3JlZDogJzhiMDAwMCcsXG4gICAgICAgIGRhcmtzYWxtb246ICdlOTk2N2EnLFxuICAgICAgICBkYXJrc2VhZ3JlZW46ICc4ZmJjOGYnLFxuICAgICAgICBkYXJrc2xhdGVibHVlOiAnNDgzZDhiJyxcbiAgICAgICAgZGFya3NsYXRlZ3JheTogJzJmNGY0ZicsXG4gICAgICAgIGRhcmt0dXJxdW9pc2U6ICcwMGNlZDEnLFxuICAgICAgICBkYXJrdmlvbGV0OiAnOTQwMGQzJyxcbiAgICAgICAgZGVlcHBpbms6ICdmZjE0OTMnLFxuICAgICAgICBkZWVwc2t5Ymx1ZTogJzAwYmZmZicsXG4gICAgICAgIGRpbWdyYXk6ICc2OTY5NjknLFxuICAgICAgICBkb2RnZXJibHVlOiAnMWU5MGZmJyxcbiAgICAgICAgZmVsZHNwYXI6ICdkMTkyNzUnLFxuICAgICAgICBmaXJlYnJpY2s6ICdiMjIyMjInLFxuICAgICAgICBmbG9yYWx3aGl0ZTogJ2ZmZmFmMCcsXG4gICAgICAgIGZvcmVzdGdyZWVuOiAnMjI4YjIyJyxcbiAgICAgICAgZnVjaHNpYTogJ2ZmMDBmZicsXG4gICAgICAgIGdhaW5zYm9ybzogJ2RjZGNkYycsXG4gICAgICAgIGdob3N0d2hpdGU6ICdmOGY4ZmYnLFxuICAgICAgICBnb2xkOiAnZmZkNzAwJyxcbiAgICAgICAgZ29sZGVucm9kOiAnZGFhNTIwJyxcbiAgICAgICAgZ3JheTogJzgwODA4MCcsXG4gICAgICAgIGdyZWVuOiAnMDA4MDAwJyxcbiAgICAgICAgZ3JlZW55ZWxsb3c6ICdhZGZmMmYnLFxuICAgICAgICBob25leWRldzogJ2YwZmZmMCcsXG4gICAgICAgIGhvdHBpbms6ICdmZjY5YjQnLFxuICAgICAgICBpbmRpYW5yZWQgOiAnY2Q1YzVjJyxcbiAgICAgICAgaW5kaWdvIDogJzRiMDA4MicsXG4gICAgICAgIGl2b3J5OiAnZmZmZmYwJyxcbiAgICAgICAga2hha2k6ICdmMGU2OGMnLFxuICAgICAgICBsYXZlbmRlcjogJ2U2ZTZmYScsXG4gICAgICAgIGxhdmVuZGVyYmx1c2g6ICdmZmYwZjUnLFxuICAgICAgICBsYXduZ3JlZW46ICc3Y2ZjMDAnLFxuICAgICAgICBsZW1vbmNoaWZmb246ICdmZmZhY2QnLFxuICAgICAgICBsaWdodGJsdWU6ICdhZGQ4ZTYnLFxuICAgICAgICBsaWdodGNvcmFsOiAnZjA4MDgwJyxcbiAgICAgICAgbGlnaHRjeWFuOiAnZTBmZmZmJyxcbiAgICAgICAgbGlnaHRnb2xkZW5yb2R5ZWxsb3c6ICdmYWZhZDInLFxuICAgICAgICBsaWdodGdyZXk6ICdkM2QzZDMnLFxuICAgICAgICBsaWdodGdyZWVuOiAnOTBlZTkwJyxcbiAgICAgICAgbGlnaHRwaW5rOiAnZmZiNmMxJyxcbiAgICAgICAgbGlnaHRzYWxtb246ICdmZmEwN2EnLFxuICAgICAgICBsaWdodHNlYWdyZWVuOiAnMjBiMmFhJyxcbiAgICAgICAgbGlnaHRza3libHVlOiAnODdjZWZhJyxcbiAgICAgICAgbGlnaHRzbGF0ZWJsdWU6ICc4NDcwZmYnLFxuICAgICAgICBsaWdodHNsYXRlZ3JheTogJzc3ODg5OScsXG4gICAgICAgIGxpZ2h0c3RlZWxibHVlOiAnYjBjNGRlJyxcbiAgICAgICAgbGlnaHR5ZWxsb3c6ICdmZmZmZTAnLFxuICAgICAgICBsaW1lOiAnMDBmZjAwJyxcbiAgICAgICAgbGltZWdyZWVuOiAnMzJjZDMyJyxcbiAgICAgICAgbGluZW46ICdmYWYwZTYnLFxuICAgICAgICBtYWdlbnRhOiAnZmYwMGZmJyxcbiAgICAgICAgbWFyb29uOiAnODAwMDAwJyxcbiAgICAgICAgbWVkaXVtYXF1YW1hcmluZTogJzY2Y2RhYScsXG4gICAgICAgIG1lZGl1bWJsdWU6ICcwMDAwY2QnLFxuICAgICAgICBtZWRpdW1vcmNoaWQ6ICdiYTU1ZDMnLFxuICAgICAgICBtZWRpdW1wdXJwbGU6ICc5MzcwZDgnLFxuICAgICAgICBtZWRpdW1zZWFncmVlbjogJzNjYjM3MScsXG4gICAgICAgIG1lZGl1bXNsYXRlYmx1ZTogJzdiNjhlZScsXG4gICAgICAgIG1lZGl1bXNwcmluZ2dyZWVuOiAnMDBmYTlhJyxcbiAgICAgICAgbWVkaXVtdHVycXVvaXNlOiAnNDhkMWNjJyxcbiAgICAgICAgbWVkaXVtdmlvbGV0cmVkOiAnYzcxNTg1JyxcbiAgICAgICAgbWlkbmlnaHRibHVlOiAnMTkxOTcwJyxcbiAgICAgICAgbWludGNyZWFtOiAnZjVmZmZhJyxcbiAgICAgICAgbWlzdHlyb3NlOiAnZmZlNGUxJyxcbiAgICAgICAgbW9jY2FzaW46ICdmZmU0YjUnLFxuICAgICAgICBuYXZham93aGl0ZTogJ2ZmZGVhZCcsXG4gICAgICAgIG5hdnk6ICcwMDAwODAnLFxuICAgICAgICBvbGRsYWNlOiAnZmRmNWU2JyxcbiAgICAgICAgb2xpdmU6ICc4MDgwMDAnLFxuICAgICAgICBvbGl2ZWRyYWI6ICc2YjhlMjMnLFxuICAgICAgICBvcmFuZ2U6ICdmZmE1MDAnLFxuICAgICAgICBvcmFuZ2VyZWQ6ICdmZjQ1MDAnLFxuICAgICAgICBvcmNoaWQ6ICdkYTcwZDYnLFxuICAgICAgICBwYWxlZ29sZGVucm9kOiAnZWVlOGFhJyxcbiAgICAgICAgcGFsZWdyZWVuOiAnOThmYjk4JyxcbiAgICAgICAgcGFsZXR1cnF1b2lzZTogJ2FmZWVlZScsXG4gICAgICAgIHBhbGV2aW9sZXRyZWQ6ICdkODcwOTMnLFxuICAgICAgICBwYXBheWF3aGlwOiAnZmZlZmQ1JyxcbiAgICAgICAgcGVhY2hwdWZmOiAnZmZkYWI5JyxcbiAgICAgICAgcGVydTogJ2NkODUzZicsXG4gICAgICAgIHBpbms6ICdmZmMwY2InLFxuICAgICAgICBwbHVtOiAnZGRhMGRkJyxcbiAgICAgICAgcG93ZGVyYmx1ZTogJ2IwZTBlNicsXG4gICAgICAgIHB1cnBsZTogJzgwMDA4MCcsXG4gICAgICAgIHJlZDogJ2ZmMDAwMCcsXG4gICAgICAgIHJvc3licm93bjogJ2JjOGY4ZicsXG4gICAgICAgIHJveWFsYmx1ZTogJzQxNjllMScsXG4gICAgICAgIHNhZGRsZWJyb3duOiAnOGI0NTEzJyxcbiAgICAgICAgc2FsbW9uOiAnZmE4MDcyJyxcbiAgICAgICAgc2FuZHlicm93bjogJ2Y0YTQ2MCcsXG4gICAgICAgIHNlYWdyZWVuOiAnMmU4YjU3JyxcbiAgICAgICAgc2Vhc2hlbGw6ICdmZmY1ZWUnLFxuICAgICAgICBzaWVubmE6ICdhMDUyMmQnLFxuICAgICAgICBzaWx2ZXI6ICdjMGMwYzAnLFxuICAgICAgICBza3libHVlOiAnODdjZWViJyxcbiAgICAgICAgc2xhdGVibHVlOiAnNmE1YWNkJyxcbiAgICAgICAgc2xhdGVncmF5OiAnNzA4MDkwJyxcbiAgICAgICAgc25vdzogJ2ZmZmFmYScsXG4gICAgICAgIHNwcmluZ2dyZWVuOiAnMDBmZjdmJyxcbiAgICAgICAgc3RlZWxibHVlOiAnNDY4MmI0JyxcbiAgICAgICAgdGFuOiAnZDJiNDhjJyxcbiAgICAgICAgdGVhbDogJzAwODA4MCcsXG4gICAgICAgIHRoaXN0bGU6ICdkOGJmZDgnLFxuICAgICAgICB0b21hdG86ICdmZjYzNDcnLFxuICAgICAgICB0dXJxdW9pc2U6ICc0MGUwZDAnLFxuICAgICAgICB2aW9sZXQ6ICdlZTgyZWUnLFxuICAgICAgICB2aW9sZXRyZWQ6ICdkMDIwOTAnLFxuICAgICAgICB3aGVhdDogJ2Y1ZGViMycsXG4gICAgICAgIHdoaXRlOiAnZmZmZmZmJyxcbiAgICAgICAgd2hpdGVzbW9rZTogJ2Y1ZjVmNScsXG4gICAgICAgIHllbGxvdzogJ2ZmZmYwMCcsXG4gICAgICAgIHllbGxvd2dyZWVuOiAnOWFjZDMyJ1xuICAgIH07XG4gICAgZm9yICh2YXIga2V5IGluIHNpbXBsZV9jb2xvcnMpIHtcbiAgICAgICAgaWYgKGNvbG9yX3N0cmluZyA9PSBrZXkpIHtcbiAgICAgICAgICAgIGNvbG9yX3N0cmluZyA9IHNpbXBsZV9jb2xvcnNba2V5XTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyBlbWQgb2Ygc2ltcGxlIHR5cGUtaW4gY29sb3JzXG5cbiAgICAvLyBhcnJheSBvZiBjb2xvciBkZWZpbml0aW9uIG9iamVjdHNcbiAgICB2YXIgY29sb3JfZGVmcyA9IFtcbiAgICAgICAge1xuICAgICAgICAgICAgcmU6IC9ecmdiXFwoKFxcZHsxLDN9KSxcXHMqKFxcZHsxLDN9KSxcXHMqKFxcZHsxLDN9KVxcKSQvLFxuICAgICAgICAgICAgZXhhbXBsZTogWydyZ2IoMTIzLCAyMzQsIDQ1KScsICdyZ2IoMjU1LDIzNCwyNDUpJ10sXG4gICAgICAgICAgICBwcm9jZXNzOiBmdW5jdGlvbiAoYml0cyl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VJbnQoYml0c1sxXSksXG4gICAgICAgICAgICAgICAgICAgIHBhcnNlSW50KGJpdHNbMl0pLFxuICAgICAgICAgICAgICAgICAgICBwYXJzZUludChiaXRzWzNdKVxuICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJlOiAvXihcXHd7Mn0pKFxcd3syfSkoXFx3ezJ9KSQvLFxuICAgICAgICAgICAgZXhhbXBsZTogWycjMDBmZjAwJywgJzMzNjY5OSddLFxuICAgICAgICAgICAgcHJvY2VzczogZnVuY3Rpb24gKGJpdHMpe1xuICAgICAgICAgICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAgICAgICAgIHBhcnNlSW50KGJpdHNbMV0sIDE2KSxcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VJbnQoYml0c1syXSwgMTYpLFxuICAgICAgICAgICAgICAgICAgICBwYXJzZUludChiaXRzWzNdLCAxNilcbiAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICByZTogL14oXFx3ezF9KShcXHd7MX0pKFxcd3sxfSkkLyxcbiAgICAgICAgICAgIGV4YW1wbGU6IFsnI2ZiMCcsICdmMGYnXSxcbiAgICAgICAgICAgIHByb2Nlc3M6IGZ1bmN0aW9uIChiaXRzKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgICAgICAgICBwYXJzZUludChiaXRzWzFdICsgYml0c1sxXSwgMTYpLFxuICAgICAgICAgICAgICAgICAgICBwYXJzZUludChiaXRzWzJdICsgYml0c1syXSwgMTYpLFxuICAgICAgICAgICAgICAgICAgICBwYXJzZUludChiaXRzWzNdICsgYml0c1szXSwgMTYpXG4gICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIF07XG5cbiAgICAvLyBzZWFyY2ggdGhyb3VnaCB0aGUgZGVmaW5pdGlvbnMgdG8gZmluZCBhIG1hdGNoXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb2xvcl9kZWZzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciByZSA9IGNvbG9yX2RlZnNbaV0ucmU7XG4gICAgICAgIHZhciBwcm9jZXNzb3IgPSBjb2xvcl9kZWZzW2ldLnByb2Nlc3M7XG4gICAgICAgIHZhciBiaXRzID0gcmUuZXhlYyhjb2xvcl9zdHJpbmcpO1xuICAgICAgICBpZiAoYml0cykge1xuICAgICAgICAgICAgY2hhbm5lbHMgPSBwcm9jZXNzb3IoYml0cyk7XG4gICAgICAgICAgICB0aGlzLnIgPSBjaGFubmVsc1swXTtcbiAgICAgICAgICAgIHRoaXMuZyA9IGNoYW5uZWxzWzFdO1xuICAgICAgICAgICAgdGhpcy5iID0gY2hhbm5lbHNbMl07XG4gICAgICAgICAgICB0aGlzLm9rID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgLy8gdmFsaWRhdGUvY2xlYW51cCB2YWx1ZXNcbiAgICB0aGlzLnIgPSAodGhpcy5yIDwgMCB8fCBpc05hTih0aGlzLnIpKSA/IDAgOiAoKHRoaXMuciA+IDI1NSkgPyAyNTUgOiB0aGlzLnIpO1xuICAgIHRoaXMuZyA9ICh0aGlzLmcgPCAwIHx8IGlzTmFOKHRoaXMuZykpID8gMCA6ICgodGhpcy5nID4gMjU1KSA/IDI1NSA6IHRoaXMuZyk7XG4gICAgdGhpcy5iID0gKHRoaXMuYiA8IDAgfHwgaXNOYU4odGhpcy5iKSkgPyAwIDogKCh0aGlzLmIgPiAyNTUpID8gMjU1IDogdGhpcy5iKTtcblxuICAgIC8vIHNvbWUgZ2V0dGVyc1xuICAgIHRoaXMudG9SR0IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAncmdiKCcgKyB0aGlzLnIgKyAnLCAnICsgdGhpcy5nICsgJywgJyArIHRoaXMuYiArICcpJztcbiAgICB9XG4gICAgdGhpcy50b0hleCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHIgPSB0aGlzLnIudG9TdHJpbmcoMTYpO1xuICAgICAgICB2YXIgZyA9IHRoaXMuZy50b1N0cmluZygxNik7XG4gICAgICAgIHZhciBiID0gdGhpcy5iLnRvU3RyaW5nKDE2KTtcbiAgICAgICAgaWYgKHIubGVuZ3RoID09IDEpIHIgPSAnMCcgKyByO1xuICAgICAgICBpZiAoZy5sZW5ndGggPT0gMSkgZyA9ICcwJyArIGc7XG4gICAgICAgIGlmIChiLmxlbmd0aCA9PSAxKSBiID0gJzAnICsgYjtcbiAgICAgICAgcmV0dXJuICcjJyArIHIgKyBnICsgYjtcbiAgICB9XG5cbiAgICAvLyBoZWxwXG4gICAgdGhpcy5nZXRIZWxwWE1MID0gZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIHZhciBleGFtcGxlcyA9IG5ldyBBcnJheSgpO1xuICAgICAgICAvLyBhZGQgcmVnZXhwc1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbG9yX2RlZnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBleGFtcGxlID0gY29sb3JfZGVmc1tpXS5leGFtcGxlO1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBleGFtcGxlLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgZXhhbXBsZXNbZXhhbXBsZXMubGVuZ3RoXSA9IGV4YW1wbGVbal07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gYWRkIHR5cGUtaW4gY29sb3JzXG4gICAgICAgIGZvciAodmFyIHNjIGluIHNpbXBsZV9jb2xvcnMpIHtcbiAgICAgICAgICAgIGV4YW1wbGVzW2V4YW1wbGVzLmxlbmd0aF0gPSBzYztcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB4bWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd1bCcpO1xuICAgICAgICB4bWwuc2V0QXR0cmlidXRlKCdpZCcsICdyZ2Jjb2xvci1leGFtcGxlcycpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGV4YW1wbGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHZhciBsaXN0X2l0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICAgICAgICAgICAgICAgIHZhciBsaXN0X2NvbG9yID0gbmV3IFJHQkNvbG9yKGV4YW1wbGVzW2ldKTtcbiAgICAgICAgICAgICAgICB2YXIgZXhhbXBsZV9kaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICAgICAgICBleGFtcGxlX2Rpdi5zdHlsZS5jc3NUZXh0ID1cbiAgICAgICAgICAgICAgICAgICAgICAgICdtYXJnaW46IDNweDsgJ1xuICAgICAgICAgICAgICAgICAgICAgICAgKyAnYm9yZGVyOiAxcHggc29saWQgYmxhY2s7ICdcbiAgICAgICAgICAgICAgICAgICAgICAgICsgJ2JhY2tncm91bmQ6JyArIGxpc3RfY29sb3IudG9IZXgoKSArICc7ICdcbiAgICAgICAgICAgICAgICAgICAgICAgICsgJ2NvbG9yOicgKyBsaXN0X2NvbG9yLnRvSGV4KClcbiAgICAgICAgICAgICAgICA7XG4gICAgICAgICAgICAgICAgZXhhbXBsZV9kaXYuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoJ3Rlc3QnKSk7XG4gICAgICAgICAgICAgICAgdmFyIGxpc3RfaXRlbV92YWx1ZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFxuICAgICAgICAgICAgICAgICAgICAnICcgKyBleGFtcGxlc1tpXSArICcgLT4gJyArIGxpc3RfY29sb3IudG9SR0IoKSArICcgLT4gJyArIGxpc3RfY29sb3IudG9IZXgoKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgbGlzdF9pdGVtLmFwcGVuZENoaWxkKGV4YW1wbGVfZGl2KTtcbiAgICAgICAgICAgICAgICBsaXN0X2l0ZW0uYXBwZW5kQ2hpbGQobGlzdF9pdGVtX3ZhbHVlKTtcbiAgICAgICAgICAgICAgICB4bWwuYXBwZW5kQ2hpbGQobGlzdF9pdGVtKTtcblxuICAgICAgICAgICAgfSBjYXRjaChlKXt9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHhtbDtcblxuICAgIH1cblxufVxuXG4vKipcbiAqIEBsaWNlbnNlIGNhbnZnLmpzIC0gSmF2YXNjcmlwdCBTVkcgcGFyc2VyIGFuZCByZW5kZXJlciBvbiBDYW52YXNcbiAqIE1JVCBMaWNlbnNlZCBcbiAqIEdhYmUgTGVybmVyIChnYWJlbGVybmVyQGdtYWlsLmNvbSlcbiAqIGh0dHA6Ly9jb2RlLmdvb2dsZS5jb20vcC9jYW52Zy9cbiAqXG4gKiBSZXF1aXJlczogcmdiY29sb3IuanMgLSBodHRwOi8vd3d3LnBocGllZC5jb20vcmdiLWNvbG9yLXBhcnNlci1pbi1qYXZhc2NyaXB0L1xuICpcbiAqL1xuaWYoIXdpbmRvdy5jb25zb2xlKSB7XG5cdHdpbmRvdy5jb25zb2xlID0ge307XG5cdHdpbmRvdy5jb25zb2xlLmxvZyA9IGZ1bmN0aW9uKHN0cikge307XG5cdHdpbmRvdy5jb25zb2xlLmRpciA9IGZ1bmN0aW9uKHN0cikge307XG59XG5cbmlmKCFBcnJheS5wcm90b3R5cGUuaW5kZXhPZil7XG5cdEFycmF5LnByb3RvdHlwZS5pbmRleE9mID0gZnVuY3Rpb24ob2JqKXtcblx0XHRmb3IodmFyIGk9MDsgaTx0aGlzLmxlbmd0aDsgaSsrKXtcblx0XHRcdGlmKHRoaXNbaV09PW9iail7XG5cdFx0XHRcdHJldHVybiBpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gLTE7XG5cdH1cbn1cblxuKGZ1bmN0aW9uKCl7XG5cdC8vIGNhbnZnKHRhcmdldCwgcylcblx0Ly8gZW1wdHkgcGFyYW1ldGVyczogcmVwbGFjZSBhbGwgJ3N2ZycgZWxlbWVudHMgb24gcGFnZSB3aXRoICdjYW52YXMnIGVsZW1lbnRzXG5cdC8vIHRhcmdldDogY2FudmFzIGVsZW1lbnQgb3IgdGhlIGlkIG9mIGEgY2FudmFzIGVsZW1lbnRcblx0Ly8gczogc3ZnIHN0cmluZywgdXJsIHRvIHN2ZyBmaWxlLCBvciB4bWwgZG9jdW1lbnRcblx0Ly8gb3B0czogb3B0aW9uYWwgaGFzaCBvZiBvcHRpb25zXG5cdC8vXHRcdCBpZ25vcmVNb3VzZTogdHJ1ZSA9PiBpZ25vcmUgbW91c2UgZXZlbnRzXG5cdC8vXHRcdCBpZ25vcmVBbmltYXRpb246IHRydWUgPT4gaWdub3JlIGFuaW1hdGlvbnNcblx0Ly9cdFx0IGlnbm9yZURpbWVuc2lvbnM6IHRydWUgPT4gZG9lcyBub3QgdHJ5IHRvIHJlc2l6ZSBjYW52YXNcblx0Ly9cdFx0IGlnbm9yZUNsZWFyOiB0cnVlID0+IGRvZXMgbm90IGNsZWFyIGNhbnZhc1xuXHQvL1x0XHQgb2Zmc2V0WDogaW50ID0+IGRyYXdzIGF0IGEgeCBvZmZzZXRcblx0Ly9cdFx0IG9mZnNldFk6IGludCA9PiBkcmF3cyBhdCBhIHkgb2Zmc2V0XG5cdC8vXHRcdCBzY2FsZVdpZHRoOiBpbnQgPT4gc2NhbGVzIGhvcml6b250YWxseSB0byB3aWR0aFxuXHQvL1x0XHQgc2NhbGVIZWlnaHQ6IGludCA9PiBzY2FsZXMgdmVydGljYWxseSB0byBoZWlnaHRcblx0Ly9cdFx0IHJlbmRlckNhbGxiYWNrOiBmdW5jdGlvbiA9PiB3aWxsIGNhbGwgdGhlIGZ1bmN0aW9uIGFmdGVyIHRoZSBmaXJzdCByZW5kZXIgaXMgY29tcGxldGVkXG5cdC8vXHRcdCBmb3JjZVJlZHJhdzogZnVuY3Rpb24gPT4gd2lsbCBjYWxsIHRoZSBmdW5jdGlvbiBvbiBldmVyeSBmcmFtZSwgaWYgaXQgcmV0dXJucyB0cnVlLCB3aWxsIHJlZHJhd1xuXHR0aGlzLmNhbnZnID0gZnVuY3Rpb24gKHRhcmdldCwgcywgb3B0cykge1xuXHRcdC8vIG5vIHBhcmFtZXRlcnNcblx0XHRpZiAodGFyZ2V0ID09IG51bGwgJiYgcyA9PSBudWxsICYmIG9wdHMgPT0gbnVsbCkge1xuXHRcdFx0dmFyIHN2Z1RhZ3MgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc3ZnJyk7XG5cdFx0XHRmb3IgKHZhciBpPTA7IGk8c3ZnVGFncy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHR2YXIgc3ZnVGFnID0gc3ZnVGFnc1tpXTtcblx0XHRcdFx0dmFyIGMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcblx0XHRcdFx0Yy53aWR0aCA9IHN2Z1RhZy5jbGllbnRXaWR0aDtcblx0XHRcdFx0Yy5oZWlnaHQgPSBzdmdUYWcuY2xpZW50SGVpZ2h0O1xuXHRcdFx0XHRzdmdUYWcucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoYywgc3ZnVGFnKTtcblx0XHRcdFx0c3ZnVGFnLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc3ZnVGFnKTtcblx0XHRcdFx0dmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHRcdFx0XHRkaXYuYXBwZW5kQ2hpbGQoc3ZnVGFnKTtcblx0XHRcdFx0Y2FudmcoYywgZGl2LmlubmVySFRNTCk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm47XG5cdFx0fVx0XG5cdFx0b3B0cyA9IG9wdHMgfHwge307XG5cdFxuXHRcdGlmICh0eXBlb2YgdGFyZ2V0ID09ICdzdHJpbmcnKSB7XG5cdFx0XHR0YXJnZXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0YXJnZXQpO1xuXHRcdH1cblx0XHRcblx0XHQvLyByZXVzZSBjbGFzcyBwZXIgY2FudmFzXG5cdFx0dmFyIHN2Zztcblx0XHRpZiAodGFyZ2V0LnN2ZyA9PSBudWxsKSB7XG5cdFx0XHRzdmcgPSBidWlsZCgpO1xuXHRcdFx0dGFyZ2V0LnN2ZyA9IHN2Zztcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRzdmcgPSB0YXJnZXQuc3ZnO1xuXHRcdFx0c3ZnLnN0b3AoKTtcblx0XHR9XG5cdFx0c3ZnLm9wdHMgPSBvcHRzO1xuXHRcdFxuXHRcdHZhciBjdHggPSB0YXJnZXQuZ2V0Q29udGV4dCgnMmQnKTtcblx0XHRpZiAodHlwZW9mKHMuZG9jdW1lbnRFbGVtZW50KSAhPSAndW5kZWZpbmVkJykge1xuXHRcdFx0Ly8gbG9hZCBmcm9tIHhtbCBkb2Ncblx0XHRcdHN2Zy5sb2FkWG1sRG9jKGN0eCwgcyk7XG5cdFx0fVxuXHRcdGVsc2UgaWYgKHMuc3Vic3RyKDAsMSkgPT0gJzwnKSB7XG5cdFx0XHQvLyBsb2FkIGZyb20geG1sIHN0cmluZ1xuXHRcdFx0c3ZnLmxvYWRYbWwoY3R4LCBzKTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHQvLyBsb2FkIGZyb20gdXJsXG5cdFx0XHRzdmcubG9hZChjdHgsIHMpO1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIGJ1aWxkKCkge1xuXHRcdHZhciBzdmcgPSB7IH07XG5cdFx0XG5cdFx0c3ZnLkZSQU1FUkFURSA9IDMwO1xuXHRcdHN2Zy5NQVhfVklSVFVBTF9QSVhFTFMgPSAzMDAwMDtcblx0XHRcblx0XHQvLyBnbG9iYWxzXG5cdFx0c3ZnLmluaXQgPSBmdW5jdGlvbihjdHgpIHtcblx0XHRcdHN2Zy5EZWZpbml0aW9ucyA9IHt9O1xuXHRcdFx0c3ZnLlN0eWxlcyA9IHt9O1xuXHRcdFx0c3ZnLkFuaW1hdGlvbnMgPSBbXTtcblx0XHRcdHN2Zy5JbWFnZXMgPSBbXTtcblx0XHRcdHN2Zy5jdHggPSBjdHg7XG5cdFx0XHRzdmcuVmlld1BvcnQgPSBuZXcgKGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0dGhpcy52aWV3UG9ydHMgPSBbXTtcblx0XHRcdFx0dGhpcy5DbGVhciA9IGZ1bmN0aW9uKCkgeyB0aGlzLnZpZXdQb3J0cyA9IFtdOyB9XG5cdFx0XHRcdHRoaXMuU2V0Q3VycmVudCA9IGZ1bmN0aW9uKHdpZHRoLCBoZWlnaHQpIHsgdGhpcy52aWV3UG9ydHMucHVzaCh7IHdpZHRoOiB3aWR0aCwgaGVpZ2h0OiBoZWlnaHQgfSk7IH1cblx0XHRcdFx0dGhpcy5SZW1vdmVDdXJyZW50ID0gZnVuY3Rpb24oKSB7IHRoaXMudmlld1BvcnRzLnBvcCgpOyB9XG5cdFx0XHRcdHRoaXMuQ3VycmVudCA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy52aWV3UG9ydHNbdGhpcy52aWV3UG9ydHMubGVuZ3RoIC0gMV07IH1cblx0XHRcdFx0dGhpcy53aWR0aCA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5DdXJyZW50KCkud2lkdGg7IH1cblx0XHRcdFx0dGhpcy5oZWlnaHQgPSBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXMuQ3VycmVudCgpLmhlaWdodDsgfVxuXHRcdFx0XHR0aGlzLkNvbXB1dGVTaXplID0gZnVuY3Rpb24oZCkge1xuXHRcdFx0XHRcdGlmIChkICE9IG51bGwgJiYgdHlwZW9mKGQpID09ICdudW1iZXInKSByZXR1cm4gZDtcblx0XHRcdFx0XHRpZiAoZCA9PSAneCcpIHJldHVybiB0aGlzLndpZHRoKCk7XG5cdFx0XHRcdFx0aWYgKGQgPT0gJ3knKSByZXR1cm4gdGhpcy5oZWlnaHQoKTtcblx0XHRcdFx0XHRyZXR1cm4gTWF0aC5zcXJ0KE1hdGgucG93KHRoaXMud2lkdGgoKSwgMikgKyBNYXRoLnBvdyh0aGlzLmhlaWdodCgpLCAyKSkgLyBNYXRoLnNxcnQoMik7XHRcdFx0XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH1cblx0XHRzdmcuaW5pdCgpO1xuXHRcdFxuXHRcdC8vIGltYWdlcyBsb2FkZWRcblx0XHRzdmcuSW1hZ2VzTG9hZGVkID0gZnVuY3Rpb24oKSB7IFxuXHRcdFx0Zm9yICh2YXIgaT0wOyBpPHN2Zy5JbWFnZXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0aWYgKCFzdmcuSW1hZ2VzW2ldLmxvYWRlZCkgcmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0Ly8gdHJpbVxuXHRcdHN2Zy50cmltID0gZnVuY3Rpb24ocykgeyByZXR1cm4gcy5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJyk7IH1cblx0XHRcblx0XHQvLyBjb21wcmVzcyBzcGFjZXNcblx0XHRzdmcuY29tcHJlc3NTcGFjZXMgPSBmdW5jdGlvbihzKSB7IHJldHVybiBzLnJlcGxhY2UoL1tcXHNcXHJcXHRcXG5dKy9nbSwnICcpOyB9XG5cdFx0XG5cdFx0Ly8gYWpheFxuXHRcdHN2Zy5hamF4ID0gZnVuY3Rpb24odXJsKSB7XG5cdFx0XHR2YXIgQUpBWDtcblx0XHRcdGlmKHdpbmRvdy5YTUxIdHRwUmVxdWVzdCl7QUpBWD1uZXcgWE1MSHR0cFJlcXVlc3QoKTt9XG5cdFx0XHRlbHNle0FKQVg9bmV3IEFjdGl2ZVhPYmplY3QoJ01pY3Jvc29mdC5YTUxIVFRQJyk7fVxuXHRcdFx0aWYoQUpBWCl7XG5cdFx0XHQgICBBSkFYLm9wZW4oJ0dFVCcsdXJsLGZhbHNlKTtcblx0XHRcdCAgIEFKQVguc2VuZChudWxsKTtcblx0XHRcdCAgIHJldHVybiBBSkFYLnJlc3BvbnNlVGV4dDtcblx0XHRcdH1cblx0XHRcdHJldHVybiBudWxsO1xuXHRcdH0gXG5cdFx0XG5cdFx0Ly8gcGFyc2UgeG1sXG5cdFx0c3ZnLnBhcnNlWG1sID0gZnVuY3Rpb24oeG1sKSB7XG5cdFx0XHRpZiAod2luZG93LkRPTVBhcnNlcilcblx0XHRcdHtcblx0XHRcdFx0dmFyIHBhcnNlciA9IG5ldyBET01QYXJzZXIoKTtcblx0XHRcdFx0cmV0dXJuIHBhcnNlci5wYXJzZUZyb21TdHJpbmcoeG1sLCAndGV4dC94bWwnKTtcblx0XHRcdH1cblx0XHRcdGVsc2UgXG5cdFx0XHR7XG5cdFx0XHRcdHhtbCA9IHhtbC5yZXBsYWNlKC88IURPQ1RZUEUgc3ZnW14+XSo+LywgJycpO1xuXHRcdFx0XHR2YXIgeG1sRG9jID0gbmV3IEFjdGl2ZVhPYmplY3QoJ01pY3Jvc29mdC5YTUxET00nKTtcblx0XHRcdFx0eG1sRG9jLmFzeW5jID0gJ2ZhbHNlJztcblx0XHRcdFx0eG1sRG9jLmxvYWRYTUwoeG1sKTsgXG5cdFx0XHRcdHJldHVybiB4bWxEb2M7XG5cdFx0XHR9XHRcdFxuXHRcdH1cblx0XHRcblx0XHRzdmcuUHJvcGVydHkgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSkge1xuXHRcdFx0dGhpcy5uYW1lID0gbmFtZTtcblx0XHRcdHRoaXMudmFsdWUgPSB2YWx1ZTtcblx0XHRcdFxuXHRcdFx0dGhpcy5oYXNWYWx1ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gKHRoaXMudmFsdWUgIT0gbnVsbCAmJiB0aGlzLnZhbHVlICE9PSAnJyk7XG5cdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFxuXHRcdFx0Ly8gcmV0dXJuIHRoZSBudW1lcmljYWwgdmFsdWUgb2YgdGhlIHByb3BlcnR5XG5cdFx0XHR0aGlzLm51bVZhbHVlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGlmICghdGhpcy5oYXNWYWx1ZSgpKSByZXR1cm4gMDtcblx0XHRcdFx0XG5cdFx0XHRcdHZhciBuID0gcGFyc2VGbG9hdCh0aGlzLnZhbHVlKTtcblx0XHRcdFx0aWYgKCh0aGlzLnZhbHVlICsgJycpLm1hdGNoKC8lJC8pKSB7XG5cdFx0XHRcdFx0biA9IG4gLyAxMDAuMDtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gbjtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0dGhpcy52YWx1ZU9yRGVmYXVsdCA9IGZ1bmN0aW9uKGRlZikge1xuXHRcdFx0XHRpZiAodGhpcy5oYXNWYWx1ZSgpKSByZXR1cm4gdGhpcy52YWx1ZTtcblx0XHRcdFx0cmV0dXJuIGRlZjtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0dGhpcy5udW1WYWx1ZU9yRGVmYXVsdCA9IGZ1bmN0aW9uKGRlZikge1xuXHRcdFx0XHRpZiAodGhpcy5oYXNWYWx1ZSgpKSByZXR1cm4gdGhpcy5udW1WYWx1ZSgpO1xuXHRcdFx0XHRyZXR1cm4gZGVmO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHQvKiBFWFRFTlNJT05TICovXG5cdFx0XHR2YXIgdGhhdCA9IHRoaXM7XG5cdFx0XHRcblx0XHRcdC8vIGNvbG9yIGV4dGVuc2lvbnNcblx0XHRcdHRoaXMuQ29sb3IgPSB7XG5cdFx0XHRcdC8vIGF1Z21lbnQgdGhlIGN1cnJlbnQgY29sb3IgdmFsdWUgd2l0aCB0aGUgb3BhY2l0eVxuXHRcdFx0XHRhZGRPcGFjaXR5OiBmdW5jdGlvbihvcGFjaXR5KSB7XG5cdFx0XHRcdFx0dmFyIG5ld1ZhbHVlID0gdGhhdC52YWx1ZTtcblx0XHRcdFx0XHRpZiAob3BhY2l0eSAhPSBudWxsICYmIG9wYWNpdHkgIT0gJycpIHtcblx0XHRcdFx0XHRcdHZhciBjb2xvciA9IG5ldyBSR0JDb2xvcih0aGF0LnZhbHVlKTtcblx0XHRcdFx0XHRcdGlmIChjb2xvci5vaykge1xuXHRcdFx0XHRcdFx0XHRuZXdWYWx1ZSA9ICdyZ2JhKCcgKyBjb2xvci5yICsgJywgJyArIGNvbG9yLmcgKyAnLCAnICsgY29sb3IuYiArICcsICcgKyBvcGFjaXR5ICsgJyknO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRyZXR1cm4gbmV3IHN2Zy5Qcm9wZXJ0eSh0aGF0Lm5hbWUsIG5ld1ZhbHVlKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHQvLyBkZWZpbml0aW9uIGV4dGVuc2lvbnNcblx0XHRcdHRoaXMuRGVmaW5pdGlvbiA9IHtcblx0XHRcdFx0Ly8gZ2V0IHRoZSBkZWZpbml0aW9uIGZyb20gdGhlIGRlZmluaXRpb25zIHRhYmxlXG5cdFx0XHRcdGdldERlZmluaXRpb246IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHZhciBuYW1lID0gdGhhdC52YWx1ZS5yZXBsYWNlKC9eKHVybFxcKCk/IyhbXlxcKV0rKVxcKT8kLywgJyQyJyk7XG5cdFx0XHRcdFx0cmV0dXJuIHN2Zy5EZWZpbml0aW9uc1tuYW1lXTtcblx0XHRcdFx0fSxcblx0XHRcdFx0XG5cdFx0XHRcdGlzVXJsOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRyZXR1cm4gdGhhdC52YWx1ZS5pbmRleE9mKCd1cmwoJykgPT0gMFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRcblx0XHRcdFx0Z2V0RmlsbFN0eWxlOiBmdW5jdGlvbihlKSB7XG5cdFx0XHRcdFx0dmFyIGRlZiA9IHRoaXMuZ2V0RGVmaW5pdGlvbigpO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdC8vIGdyYWRpZW50XG5cdFx0XHRcdFx0aWYgKGRlZiAhPSBudWxsICYmIGRlZi5jcmVhdGVHcmFkaWVudCkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIGRlZi5jcmVhdGVHcmFkaWVudChzdmcuY3R4LCBlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0Ly8gcGF0dGVyblxuXHRcdFx0XHRcdGlmIChkZWYgIT0gbnVsbCAmJiBkZWYuY3JlYXRlUGF0dGVybikge1xuXHRcdFx0XHRcdFx0cmV0dXJuIGRlZi5jcmVhdGVQYXR0ZXJuKHN2Zy5jdHgsIGUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcblx0XHRcdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHQvLyBsZW5ndGggZXh0ZW5zaW9uc1xuXHRcdFx0dGhpcy5MZW5ndGggPSB7XG5cdFx0XHRcdERQSTogZnVuY3Rpb24odmlld1BvcnQpIHtcblx0XHRcdFx0XHRyZXR1cm4gOTYuMDsgLy8gVE9ETzogY29tcHV0ZT9cblx0XHRcdFx0fSxcblx0XHRcdFx0XG5cdFx0XHRcdEVNOiBmdW5jdGlvbih2aWV3UG9ydCkge1xuXHRcdFx0XHRcdHZhciBlbSA9IDEyO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdHZhciBmb250U2l6ZSA9IG5ldyBzdmcuUHJvcGVydHkoJ2ZvbnRTaXplJywgc3ZnLkZvbnQuUGFyc2Uoc3ZnLmN0eC5mb250KS5mb250U2l6ZSk7XG5cdFx0XHRcdFx0aWYgKGZvbnRTaXplLmhhc1ZhbHVlKCkpIGVtID0gZm9udFNpemUuTGVuZ3RoLnRvUGl4ZWxzKHZpZXdQb3J0KTtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHRyZXR1cm4gZW07XG5cdFx0XHRcdH0sXG5cdFx0XHRcblx0XHRcdFx0Ly8gZ2V0IHRoZSBsZW5ndGggYXMgcGl4ZWxzXG5cdFx0XHRcdHRvUGl4ZWxzOiBmdW5jdGlvbih2aWV3UG9ydCkge1xuXHRcdFx0XHRcdGlmICghdGhhdC5oYXNWYWx1ZSgpKSByZXR1cm4gMDtcblx0XHRcdFx0XHR2YXIgcyA9IHRoYXQudmFsdWUrJyc7XG5cdFx0XHRcdFx0aWYgKHMubWF0Y2goL2VtJC8pKSByZXR1cm4gdGhhdC5udW1WYWx1ZSgpICogdGhpcy5FTSh2aWV3UG9ydCk7XG5cdFx0XHRcdFx0aWYgKHMubWF0Y2goL2V4JC8pKSByZXR1cm4gdGhhdC5udW1WYWx1ZSgpICogdGhpcy5FTSh2aWV3UG9ydCkgLyAyLjA7XG5cdFx0XHRcdFx0aWYgKHMubWF0Y2goL3B4JC8pKSByZXR1cm4gdGhhdC5udW1WYWx1ZSgpO1xuXHRcdFx0XHRcdGlmIChzLm1hdGNoKC9wdCQvKSkgcmV0dXJuIHRoYXQubnVtVmFsdWUoKSAqIDEuMjU7XG5cdFx0XHRcdFx0aWYgKHMubWF0Y2goL3BjJC8pKSByZXR1cm4gdGhhdC5udW1WYWx1ZSgpICogMTU7XG5cdFx0XHRcdFx0aWYgKHMubWF0Y2goL2NtJC8pKSByZXR1cm4gdGhhdC5udW1WYWx1ZSgpICogdGhpcy5EUEkodmlld1BvcnQpIC8gMi41NDtcblx0XHRcdFx0XHRpZiAocy5tYXRjaCgvbW0kLykpIHJldHVybiB0aGF0Lm51bVZhbHVlKCkgKiB0aGlzLkRQSSh2aWV3UG9ydCkgLyAyNS40O1xuXHRcdFx0XHRcdGlmIChzLm1hdGNoKC9pbiQvKSkgcmV0dXJuIHRoYXQubnVtVmFsdWUoKSAqIHRoaXMuRFBJKHZpZXdQb3J0KTtcblx0XHRcdFx0XHRpZiAocy5tYXRjaCgvJSQvKSkgcmV0dXJuIHRoYXQubnVtVmFsdWUoKSAqIHN2Zy5WaWV3UG9ydC5Db21wdXRlU2l6ZSh2aWV3UG9ydCk7XG5cdFx0XHRcdFx0cmV0dXJuIHRoYXQubnVtVmFsdWUoKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHQvLyB0aW1lIGV4dGVuc2lvbnNcblx0XHRcdHRoaXMuVGltZSA9IHtcblx0XHRcdFx0Ly8gZ2V0IHRoZSB0aW1lIGFzIG1pbGxpc2Vjb25kc1xuXHRcdFx0XHR0b01pbGxpc2Vjb25kczogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0aWYgKCF0aGF0Lmhhc1ZhbHVlKCkpIHJldHVybiAwO1xuXHRcdFx0XHRcdHZhciBzID0gdGhhdC52YWx1ZSsnJztcblx0XHRcdFx0XHRpZiAocy5tYXRjaCgvcyQvKSkgcmV0dXJuIHRoYXQubnVtVmFsdWUoKSAqIDEwMDA7XG5cdFx0XHRcdFx0aWYgKHMubWF0Y2goL21zJC8pKSByZXR1cm4gdGhhdC5udW1WYWx1ZSgpO1xuXHRcdFx0XHRcdHJldHVybiB0aGF0Lm51bVZhbHVlKCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0Ly8gYW5nbGUgZXh0ZW5zaW9uc1xuXHRcdFx0dGhpcy5BbmdsZSA9IHtcblx0XHRcdFx0Ly8gZ2V0IHRoZSBhbmdsZSBhcyByYWRpYW5zXG5cdFx0XHRcdHRvUmFkaWFuczogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0aWYgKCF0aGF0Lmhhc1ZhbHVlKCkpIHJldHVybiAwO1xuXHRcdFx0XHRcdHZhciBzID0gdGhhdC52YWx1ZSsnJztcblx0XHRcdFx0XHRpZiAocy5tYXRjaCgvZGVnJC8pKSByZXR1cm4gdGhhdC5udW1WYWx1ZSgpICogKE1hdGguUEkgLyAxODAuMCk7XG5cdFx0XHRcdFx0aWYgKHMubWF0Y2goL2dyYWQkLykpIHJldHVybiB0aGF0Lm51bVZhbHVlKCkgKiAoTWF0aC5QSSAvIDIwMC4wKTtcblx0XHRcdFx0XHRpZiAocy5tYXRjaCgvcmFkJC8pKSByZXR1cm4gdGhhdC5udW1WYWx1ZSgpO1xuXHRcdFx0XHRcdHJldHVybiB0aGF0Lm51bVZhbHVlKCkgKiAoTWF0aC5QSSAvIDE4MC4wKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRcblx0XHQvLyBmb250c1xuXHRcdHN2Zy5Gb250ID0gbmV3IChmdW5jdGlvbigpIHtcblx0XHRcdHRoaXMuU3R5bGVzID0gWydub3JtYWwnLCdpdGFsaWMnLCdvYmxpcXVlJywnaW5oZXJpdCddO1xuXHRcdFx0dGhpcy5WYXJpYW50cyA9IFsnbm9ybWFsJywnc21hbGwtY2FwcycsJ2luaGVyaXQnXTtcblx0XHRcdHRoaXMuV2VpZ2h0cyA9IFsnbm9ybWFsJywnYm9sZCcsJ2JvbGRlcicsJ2xpZ2h0ZXInLCcxMDAnLCcyMDAnLCczMDAnLCc0MDAnLCc1MDAnLCc2MDAnLCc3MDAnLCc4MDAnLCc5MDAnLCdpbmhlcml0J107XG5cdFx0XHRcblx0XHRcdHRoaXMuQ3JlYXRlRm9udCA9IGZ1bmN0aW9uKGZvbnRTdHlsZSwgZm9udFZhcmlhbnQsIGZvbnRXZWlnaHQsIGZvbnRTaXplLCBmb250RmFtaWx5LCBpbmhlcml0KSB7IFxuXHRcdFx0XHR2YXIgZiA9IGluaGVyaXQgIT0gbnVsbCA/IHRoaXMuUGFyc2UoaW5oZXJpdCkgOiB0aGlzLkNyZWF0ZUZvbnQoJycsICcnLCAnJywgJycsICcnLCBzdmcuY3R4LmZvbnQpO1xuXHRcdFx0XHRyZXR1cm4geyBcblx0XHRcdFx0XHRmb250RmFtaWx5OiBmb250RmFtaWx5IHx8IGYuZm9udEZhbWlseSwgXG5cdFx0XHRcdFx0Zm9udFNpemU6IGZvbnRTaXplIHx8IGYuZm9udFNpemUsIFxuXHRcdFx0XHRcdGZvbnRTdHlsZTogZm9udFN0eWxlIHx8IGYuZm9udFN0eWxlLCBcblx0XHRcdFx0XHRmb250V2VpZ2h0OiBmb250V2VpZ2h0IHx8IGYuZm9udFdlaWdodCwgXG5cdFx0XHRcdFx0Zm9udFZhcmlhbnQ6IGZvbnRWYXJpYW50IHx8IGYuZm9udFZhcmlhbnQsXG5cdFx0XHRcdFx0dG9TdHJpbmc6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIFt0aGlzLmZvbnRTdHlsZSwgdGhpcy5mb250VmFyaWFudCwgdGhpcy5mb250V2VpZ2h0LCB0aGlzLmZvbnRTaXplLCB0aGlzLmZvbnRGYW1pbHldLmpvaW4oJyAnKSB9IFxuXHRcdFx0XHR9IFxuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHR2YXIgdGhhdCA9IHRoaXM7XG5cdFx0XHR0aGlzLlBhcnNlID0gZnVuY3Rpb24ocykge1xuXHRcdFx0XHR2YXIgZiA9IHt9O1xuXHRcdFx0XHR2YXIgZCA9IHN2Zy50cmltKHN2Zy5jb21wcmVzc1NwYWNlcyhzIHx8ICcnKSkuc3BsaXQoJyAnKTtcblx0XHRcdFx0dmFyIHNldCA9IHsgZm9udFNpemU6IGZhbHNlLCBmb250U3R5bGU6IGZhbHNlLCBmb250V2VpZ2h0OiBmYWxzZSwgZm9udFZhcmlhbnQ6IGZhbHNlIH1cblx0XHRcdFx0dmFyIGZmID0gJyc7XG5cdFx0XHRcdGZvciAodmFyIGk9MDsgaTxkLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0aWYgKCFzZXQuZm9udFN0eWxlICYmIHRoYXQuU3R5bGVzLmluZGV4T2YoZFtpXSkgIT0gLTEpIHsgaWYgKGRbaV0gIT0gJ2luaGVyaXQnKSBmLmZvbnRTdHlsZSA9IGRbaV07IHNldC5mb250U3R5bGUgPSB0cnVlOyB9XG5cdFx0XHRcdFx0ZWxzZSBpZiAoIXNldC5mb250VmFyaWFudCAmJiB0aGF0LlZhcmlhbnRzLmluZGV4T2YoZFtpXSkgIT0gLTEpIHsgaWYgKGRbaV0gIT0gJ2luaGVyaXQnKSBmLmZvbnRWYXJpYW50ID0gZFtpXTsgc2V0LmZvbnRTdHlsZSA9IHNldC5mb250VmFyaWFudCA9IHRydWU7XHR9XG5cdFx0XHRcdFx0ZWxzZSBpZiAoIXNldC5mb250V2VpZ2h0ICYmIHRoYXQuV2VpZ2h0cy5pbmRleE9mKGRbaV0pICE9IC0xKSB7XHRpZiAoZFtpXSAhPSAnaW5oZXJpdCcpIGYuZm9udFdlaWdodCA9IGRbaV07IHNldC5mb250U3R5bGUgPSBzZXQuZm9udFZhcmlhbnQgPSBzZXQuZm9udFdlaWdodCA9IHRydWU7IH1cblx0XHRcdFx0XHRlbHNlIGlmICghc2V0LmZvbnRTaXplKSB7IGlmIChkW2ldICE9ICdpbmhlcml0JykgZi5mb250U2l6ZSA9IGRbaV0uc3BsaXQoJy8nKVswXTsgc2V0LmZvbnRTdHlsZSA9IHNldC5mb250VmFyaWFudCA9IHNldC5mb250V2VpZ2h0ID0gc2V0LmZvbnRTaXplID0gdHJ1ZTsgfVxuXHRcdFx0XHRcdGVsc2UgeyBpZiAoZFtpXSAhPSAnaW5oZXJpdCcpIGZmICs9IGRbaV07IH1cblx0XHRcdFx0fSBpZiAoZmYgIT0gJycpIGYuZm9udEZhbWlseSA9IGZmO1xuXHRcdFx0XHRyZXR1cm4gZjtcblx0XHRcdH1cblx0XHR9KTtcblx0XHRcblx0XHQvLyBwb2ludHMgYW5kIHBhdGhzXG5cdFx0c3ZnLlRvTnVtYmVyQXJyYXkgPSBmdW5jdGlvbihzKSB7XG5cdFx0XHR2YXIgYSA9IHN2Zy50cmltKHN2Zy5jb21wcmVzc1NwYWNlcygocyB8fCAnJykucmVwbGFjZSgvLC9nLCAnICcpKSkuc3BsaXQoJyAnKTtcblx0XHRcdGZvciAodmFyIGk9MDsgaTxhLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGFbaV0gPSBwYXJzZUZsb2F0KGFbaV0pO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGE7XG5cdFx0fVx0XHRcblx0XHRzdmcuUG9pbnQgPSBmdW5jdGlvbih4LCB5KSB7XG5cdFx0XHR0aGlzLnggPSB4O1xuXHRcdFx0dGhpcy55ID0geTtcblx0XHRcdFxuXHRcdFx0dGhpcy5hbmdsZVRvID0gZnVuY3Rpb24ocCkge1xuXHRcdFx0XHRyZXR1cm4gTWF0aC5hdGFuMihwLnkgLSB0aGlzLnksIHAueCAtIHRoaXMueCk7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdHRoaXMuYXBwbHlUcmFuc2Zvcm0gPSBmdW5jdGlvbih2KSB7XG5cdFx0XHRcdHZhciB4cCA9IHRoaXMueCAqIHZbMF0gKyB0aGlzLnkgKiB2WzJdICsgdls0XTtcblx0XHRcdFx0dmFyIHlwID0gdGhpcy54ICogdlsxXSArIHRoaXMueSAqIHZbM10gKyB2WzVdO1xuXHRcdFx0XHR0aGlzLnggPSB4cDtcblx0XHRcdFx0dGhpcy55ID0geXA7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHN2Zy5DcmVhdGVQb2ludCA9IGZ1bmN0aW9uKHMpIHtcblx0XHRcdHZhciBhID0gc3ZnLlRvTnVtYmVyQXJyYXkocyk7XG5cdFx0XHRyZXR1cm4gbmV3IHN2Zy5Qb2ludChhWzBdLCBhWzFdKTtcblx0XHR9XG5cdFx0c3ZnLkNyZWF0ZVBhdGggPSBmdW5jdGlvbihzKSB7XG5cdFx0XHR2YXIgYSA9IHN2Zy5Ub051bWJlckFycmF5KHMpO1xuXHRcdFx0dmFyIHBhdGggPSBbXTtcblx0XHRcdGZvciAodmFyIGk9MDsgaTxhLmxlbmd0aDsgaSs9Mikge1xuXHRcdFx0XHRwYXRoLnB1c2gobmV3IHN2Zy5Qb2ludChhW2ldLCBhW2krMV0pKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBwYXRoO1xuXHRcdH1cblx0XHRcblx0XHQvLyBib3VuZGluZyBib3hcblx0XHRzdmcuQm91bmRpbmdCb3ggPSBmdW5jdGlvbih4MSwgeTEsIHgyLCB5MikgeyAvLyBwYXNzIGluIGluaXRpYWwgcG9pbnRzIGlmIHlvdSB3YW50XG5cdFx0XHR0aGlzLngxID0gTnVtYmVyLk5hTjtcblx0XHRcdHRoaXMueTEgPSBOdW1iZXIuTmFOO1xuXHRcdFx0dGhpcy54MiA9IE51bWJlci5OYU47XG5cdFx0XHR0aGlzLnkyID0gTnVtYmVyLk5hTjtcblx0XHRcdFxuXHRcdFx0dGhpcy54ID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLngxOyB9XG5cdFx0XHR0aGlzLnkgPSBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXMueTE7IH1cblx0XHRcdHRoaXMud2lkdGggPSBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXMueDIgLSB0aGlzLngxOyB9XG5cdFx0XHR0aGlzLmhlaWdodCA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy55MiAtIHRoaXMueTE7IH1cblx0XHRcdFxuXHRcdFx0dGhpcy5hZGRQb2ludCA9IGZ1bmN0aW9uKHgsIHkpIHtcdFxuXHRcdFx0XHRpZiAoeCAhPSBudWxsKSB7XG5cdFx0XHRcdFx0aWYgKGlzTmFOKHRoaXMueDEpIHx8IGlzTmFOKHRoaXMueDIpKSB7XG5cdFx0XHRcdFx0XHR0aGlzLngxID0geDtcblx0XHRcdFx0XHRcdHRoaXMueDIgPSB4O1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAoeCA8IHRoaXMueDEpIHRoaXMueDEgPSB4O1xuXHRcdFx0XHRcdGlmICh4ID4gdGhpcy54MikgdGhpcy54MiA9IHg7XG5cdFx0XHRcdH1cblx0XHRcdFxuXHRcdFx0XHRpZiAoeSAhPSBudWxsKSB7XG5cdFx0XHRcdFx0aWYgKGlzTmFOKHRoaXMueTEpIHx8IGlzTmFOKHRoaXMueTIpKSB7XG5cdFx0XHRcdFx0XHR0aGlzLnkxID0geTtcblx0XHRcdFx0XHRcdHRoaXMueTIgPSB5O1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAoeSA8IHRoaXMueTEpIHRoaXMueTEgPSB5O1xuXHRcdFx0XHRcdGlmICh5ID4gdGhpcy55MikgdGhpcy55MiA9IHk7XG5cdFx0XHRcdH1cblx0XHRcdH1cdFx0XHRcblx0XHRcdHRoaXMuYWRkWCA9IGZ1bmN0aW9uKHgpIHsgdGhpcy5hZGRQb2ludCh4LCBudWxsKTsgfVxuXHRcdFx0dGhpcy5hZGRZID0gZnVuY3Rpb24oeSkgeyB0aGlzLmFkZFBvaW50KG51bGwsIHkpOyB9XG5cdFx0XHRcblx0XHRcdHRoaXMuYWRkQm91bmRpbmdCb3ggPSBmdW5jdGlvbihiYikge1xuXHRcdFx0XHR0aGlzLmFkZFBvaW50KGJiLngxLCBiYi55MSk7XG5cdFx0XHRcdHRoaXMuYWRkUG9pbnQoYmIueDIsIGJiLnkyKTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0dGhpcy5hZGRRdWFkcmF0aWNDdXJ2ZSA9IGZ1bmN0aW9uKHAweCwgcDB5LCBwMXgsIHAxeSwgcDJ4LCBwMnkpIHtcblx0XHRcdFx0dmFyIGNwMXggPSBwMHggKyAyLzMgKiAocDF4IC0gcDB4KTsgLy8gQ1AxID0gUVAwICsgMi8zICooUVAxLVFQMClcblx0XHRcdFx0dmFyIGNwMXkgPSBwMHkgKyAyLzMgKiAocDF5IC0gcDB5KTsgLy8gQ1AxID0gUVAwICsgMi8zICooUVAxLVFQMClcblx0XHRcdFx0dmFyIGNwMnggPSBjcDF4ICsgMS8zICogKHAyeCAtIHAweCk7IC8vIENQMiA9IENQMSArIDEvMyAqKFFQMi1RUDApXG5cdFx0XHRcdHZhciBjcDJ5ID0gY3AxeSArIDEvMyAqIChwMnkgLSBwMHkpOyAvLyBDUDIgPSBDUDEgKyAxLzMgKihRUDItUVAwKVxuXHRcdFx0XHR0aGlzLmFkZEJlemllckN1cnZlKHAweCwgcDB5LCBjcDF4LCBjcDJ4LCBjcDF5LFx0Y3AyeSwgcDJ4LCBwMnkpO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHR0aGlzLmFkZEJlemllckN1cnZlID0gZnVuY3Rpb24ocDB4LCBwMHksIHAxeCwgcDF5LCBwMngsIHAyeSwgcDN4LCBwM3kpIHtcblx0XHRcdFx0Ly8gZnJvbSBodHRwOi8vYmxvZy5oYWNrZXJzLWNhZmUubmV0LzIwMDkvMDYvaG93LXRvLWNhbGN1bGF0ZS1iZXppZXItY3VydmVzLWJvdW5kaW5nLmh0bWxcblx0XHRcdFx0dmFyIHAwID0gW3AweCwgcDB5XSwgcDEgPSBbcDF4LCBwMXldLCBwMiA9IFtwMngsIHAyeV0sIHAzID0gW3AzeCwgcDN5XTtcblx0XHRcdFx0dGhpcy5hZGRQb2ludChwMFswXSwgcDBbMV0pO1xuXHRcdFx0XHR0aGlzLmFkZFBvaW50KHAzWzBdLCBwM1sxXSk7XG5cdFx0XHRcdFxuXHRcdFx0XHRmb3IgKGk9MDsgaTw9MTsgaSsrKSB7XG5cdFx0XHRcdFx0dmFyIGYgPSBmdW5jdGlvbih0KSB7IFxuXHRcdFx0XHRcdFx0cmV0dXJuIE1hdGgucG93KDEtdCwgMykgKiBwMFtpXVxuXHRcdFx0XHRcdFx0KyAzICogTWF0aC5wb3coMS10LCAyKSAqIHQgKiBwMVtpXVxuXHRcdFx0XHRcdFx0KyAzICogKDEtdCkgKiBNYXRoLnBvdyh0LCAyKSAqIHAyW2ldXG5cdFx0XHRcdFx0XHQrIE1hdGgucG93KHQsIDMpICogcDNbaV07XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdHZhciBiID0gNiAqIHAwW2ldIC0gMTIgKiBwMVtpXSArIDYgKiBwMltpXTtcblx0XHRcdFx0XHR2YXIgYSA9IC0zICogcDBbaV0gKyA5ICogcDFbaV0gLSA5ICogcDJbaV0gKyAzICogcDNbaV07XG5cdFx0XHRcdFx0dmFyIGMgPSAzICogcDFbaV0gLSAzICogcDBbaV07XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0aWYgKGEgPT0gMCkge1xuXHRcdFx0XHRcdFx0aWYgKGIgPT0gMCkgY29udGludWU7XG5cdFx0XHRcdFx0XHR2YXIgdCA9IC1jIC8gYjtcblx0XHRcdFx0XHRcdGlmICgwIDwgdCAmJiB0IDwgMSkge1xuXHRcdFx0XHRcdFx0XHRpZiAoaSA9PSAwKSB0aGlzLmFkZFgoZih0KSk7XG5cdFx0XHRcdFx0XHRcdGlmIChpID09IDEpIHRoaXMuYWRkWShmKHQpKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcblx0XHRcdFx0XHR2YXIgYjJhYyA9IE1hdGgucG93KGIsIDIpIC0gNCAqIGMgKiBhO1xuXHRcdFx0XHRcdGlmIChiMmFjIDwgMCkgY29udGludWU7XG5cdFx0XHRcdFx0dmFyIHQxID0gKC1iICsgTWF0aC5zcXJ0KGIyYWMpKSAvICgyICogYSk7XG5cdFx0XHRcdFx0aWYgKDAgPCB0MSAmJiB0MSA8IDEpIHtcblx0XHRcdFx0XHRcdGlmIChpID09IDApIHRoaXMuYWRkWChmKHQxKSk7XG5cdFx0XHRcdFx0XHRpZiAoaSA9PSAxKSB0aGlzLmFkZFkoZih0MSkpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHR2YXIgdDIgPSAoLWIgLSBNYXRoLnNxcnQoYjJhYykpIC8gKDIgKiBhKTtcblx0XHRcdFx0XHRpZiAoMCA8IHQyICYmIHQyIDwgMSkge1xuXHRcdFx0XHRcdFx0aWYgKGkgPT0gMCkgdGhpcy5hZGRYKGYodDIpKTtcblx0XHRcdFx0XHRcdGlmIChpID09IDEpIHRoaXMuYWRkWShmKHQyKSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdHRoaXMuaXNQb2ludEluQm94ID0gZnVuY3Rpb24oeCwgeSkge1xuXHRcdFx0XHRyZXR1cm4gKHRoaXMueDEgPD0geCAmJiB4IDw9IHRoaXMueDIgJiYgdGhpcy55MSA8PSB5ICYmIHkgPD0gdGhpcy55Mik7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdHRoaXMuYWRkUG9pbnQoeDEsIHkxKTtcblx0XHRcdHRoaXMuYWRkUG9pbnQoeDIsIHkyKTtcblx0XHR9XG5cdFx0XG5cdFx0Ly8gdHJhbnNmb3Jtc1xuXHRcdHN2Zy5UcmFuc2Zvcm0gPSBmdW5jdGlvbih2KSB7XHRcblx0XHRcdHZhciB0aGF0ID0gdGhpcztcblx0XHRcdHRoaXMuVHlwZSA9IHt9XG5cdFx0XG5cdFx0XHQvLyB0cmFuc2xhdGVcblx0XHRcdHRoaXMuVHlwZS50cmFuc2xhdGUgPSBmdW5jdGlvbihzKSB7XG5cdFx0XHRcdHRoaXMucCA9IHN2Zy5DcmVhdGVQb2ludChzKTtcdFx0XHRcblx0XHRcdFx0dGhpcy5hcHBseSA9IGZ1bmN0aW9uKGN0eCkge1xuXHRcdFx0XHRcdGN0eC50cmFuc2xhdGUodGhpcy5wLnggfHwgMC4wLCB0aGlzLnAueSB8fCAwLjApO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHRoaXMuYXBwbHlUb1BvaW50ID0gZnVuY3Rpb24ocCkge1xuXHRcdFx0XHRcdHAuYXBwbHlUcmFuc2Zvcm0oWzEsIDAsIDAsIDEsIHRoaXMucC54IHx8IDAuMCwgdGhpcy5wLnkgfHwgMC4wXSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0Ly8gcm90YXRlXG5cdFx0XHR0aGlzLlR5cGUucm90YXRlID0gZnVuY3Rpb24ocykge1xuXHRcdFx0XHR2YXIgYSA9IHN2Zy5Ub051bWJlckFycmF5KHMpO1xuXHRcdFx0XHR0aGlzLmFuZ2xlID0gbmV3IHN2Zy5Qcm9wZXJ0eSgnYW5nbGUnLCBhWzBdKTtcblx0XHRcdFx0dGhpcy5jeCA9IGFbMV0gfHwgMDtcblx0XHRcdFx0dGhpcy5jeSA9IGFbMl0gfHwgMDtcblx0XHRcdFx0dGhpcy5hcHBseSA9IGZ1bmN0aW9uKGN0eCkge1xuXHRcdFx0XHRcdGN0eC50cmFuc2xhdGUodGhpcy5jeCwgdGhpcy5jeSk7XG5cdFx0XHRcdFx0Y3R4LnJvdGF0ZSh0aGlzLmFuZ2xlLkFuZ2xlLnRvUmFkaWFucygpKTtcblx0XHRcdFx0XHRjdHgudHJhbnNsYXRlKC10aGlzLmN4LCAtdGhpcy5jeSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0dGhpcy5hcHBseVRvUG9pbnQgPSBmdW5jdGlvbihwKSB7XG5cdFx0XHRcdFx0dmFyIGEgPSB0aGlzLmFuZ2xlLkFuZ2xlLnRvUmFkaWFucygpO1xuXHRcdFx0XHRcdHAuYXBwbHlUcmFuc2Zvcm0oWzEsIDAsIDAsIDEsIHRoaXMucC54IHx8IDAuMCwgdGhpcy5wLnkgfHwgMC4wXSk7XG5cdFx0XHRcdFx0cC5hcHBseVRyYW5zZm9ybShbTWF0aC5jb3MoYSksIE1hdGguc2luKGEpLCAtTWF0aC5zaW4oYSksIE1hdGguY29zKGEpLCAwLCAwXSk7XG5cdFx0XHRcdFx0cC5hcHBseVRyYW5zZm9ybShbMSwgMCwgMCwgMSwgLXRoaXMucC54IHx8IDAuMCwgLXRoaXMucC55IHx8IDAuMF0pO1xuXHRcdFx0XHR9XHRcdFx0XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdHRoaXMuVHlwZS5zY2FsZSA9IGZ1bmN0aW9uKHMpIHtcblx0XHRcdFx0dGhpcy5wID0gc3ZnLkNyZWF0ZVBvaW50KHMpO1xuXHRcdFx0XHR0aGlzLmFwcGx5ID0gZnVuY3Rpb24oY3R4KSB7XG5cdFx0XHRcdFx0Y3R4LnNjYWxlKHRoaXMucC54IHx8IDEuMCwgdGhpcy5wLnkgfHwgdGhpcy5wLnggfHwgMS4wKTtcblx0XHRcdFx0fVxuXHRcdFx0XHR0aGlzLmFwcGx5VG9Qb2ludCA9IGZ1bmN0aW9uKHApIHtcblx0XHRcdFx0XHRwLmFwcGx5VHJhbnNmb3JtKFt0aGlzLnAueCB8fCAwLjAsIDAsIDAsIHRoaXMucC55IHx8IDAuMCwgMCwgMF0pO1xuXHRcdFx0XHR9XHRcdFx0XHRcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0dGhpcy5UeXBlLm1hdHJpeCA9IGZ1bmN0aW9uKHMpIHtcblx0XHRcdFx0dGhpcy5tID0gc3ZnLlRvTnVtYmVyQXJyYXkocyk7XG5cdFx0XHRcdHRoaXMuYXBwbHkgPSBmdW5jdGlvbihjdHgpIHtcblx0XHRcdFx0XHRjdHgudHJhbnNmb3JtKHRoaXMubVswXSwgdGhpcy5tWzFdLCB0aGlzLm1bMl0sIHRoaXMubVszXSwgdGhpcy5tWzRdLCB0aGlzLm1bNV0pO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHRoaXMuYXBwbHlUb1BvaW50ID0gZnVuY3Rpb24ocCkge1xuXHRcdFx0XHRcdHAuYXBwbHlUcmFuc2Zvcm0odGhpcy5tKTtcblx0XHRcdFx0fVx0XHRcdFx0XHRcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0dGhpcy5UeXBlLlNrZXdCYXNlID0gZnVuY3Rpb24ocykge1xuXHRcdFx0XHR0aGlzLmJhc2UgPSB0aGF0LlR5cGUubWF0cml4O1xuXHRcdFx0XHR0aGlzLmJhc2Uocyk7XG5cdFx0XHRcdHRoaXMuYW5nbGUgPSBuZXcgc3ZnLlByb3BlcnR5KCdhbmdsZScsIHMpO1xuXHRcdFx0fVxuXHRcdFx0dGhpcy5UeXBlLlNrZXdCYXNlLnByb3RvdHlwZSA9IG5ldyB0aGlzLlR5cGUubWF0cml4O1xuXHRcdFx0XG5cdFx0XHR0aGlzLlR5cGUuc2tld1ggPSBmdW5jdGlvbihzKSB7XG5cdFx0XHRcdHRoaXMuYmFzZSA9IHRoYXQuVHlwZS5Ta2V3QmFzZTtcblx0XHRcdFx0dGhpcy5iYXNlKHMpO1xuXHRcdFx0XHR0aGlzLm0gPSBbMSwgMCwgTWF0aC50YW4odGhpcy5hbmdsZS5BbmdsZS50b1JhZGlhbnMoKSksIDEsIDAsIDBdO1xuXHRcdFx0fVxuXHRcdFx0dGhpcy5UeXBlLnNrZXdYLnByb3RvdHlwZSA9IG5ldyB0aGlzLlR5cGUuU2tld0Jhc2U7XG5cdFx0XHRcblx0XHRcdHRoaXMuVHlwZS5za2V3WSA9IGZ1bmN0aW9uKHMpIHtcblx0XHRcdFx0dGhpcy5iYXNlID0gdGhhdC5UeXBlLlNrZXdCYXNlO1xuXHRcdFx0XHR0aGlzLmJhc2Uocyk7XG5cdFx0XHRcdHRoaXMubSA9IFsxLCBNYXRoLnRhbih0aGlzLmFuZ2xlLkFuZ2xlLnRvUmFkaWFucygpKSwgMCwgMSwgMCwgMF07XG5cdFx0XHR9XG5cdFx0XHR0aGlzLlR5cGUuc2tld1kucHJvdG90eXBlID0gbmV3IHRoaXMuVHlwZS5Ta2V3QmFzZTtcblx0XHRcblx0XHRcdHRoaXMudHJhbnNmb3JtcyA9IFtdO1xuXHRcdFx0XG5cdFx0XHR0aGlzLmFwcGx5ID0gZnVuY3Rpb24oY3R4KSB7XG5cdFx0XHRcdGZvciAodmFyIGk9MDsgaTx0aGlzLnRyYW5zZm9ybXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHR0aGlzLnRyYW5zZm9ybXNbaV0uYXBwbHkoY3R4KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHR0aGlzLmFwcGx5VG9Qb2ludCA9IGZ1bmN0aW9uKHApIHtcblx0XHRcdFx0Zm9yICh2YXIgaT0wOyBpPHRoaXMudHJhbnNmb3Jtcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdHRoaXMudHJhbnNmb3Jtc1tpXS5hcHBseVRvUG9pbnQocCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0dmFyIGRhdGEgPSBzdmcudHJpbShzdmcuY29tcHJlc3NTcGFjZXModikpLnNwbGl0KC9cXHMoPz1bYS16XSkvKTtcblx0XHRcdGZvciAodmFyIGk9MDsgaTxkYXRhLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdHZhciB0eXBlID0gZGF0YVtpXS5zcGxpdCgnKCcpWzBdO1xuXHRcdFx0XHR2YXIgcyA9IGRhdGFbaV0uc3BsaXQoJygnKVsxXS5yZXBsYWNlKCcpJywnJyk7XG5cdFx0XHRcdHZhciB0cmFuc2Zvcm0gPSBuZXcgdGhpcy5UeXBlW3R5cGVdKHMpO1xuXHRcdFx0XHR0aGlzLnRyYW5zZm9ybXMucHVzaCh0cmFuc2Zvcm0pO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRcblx0XHQvLyBhc3BlY3QgcmF0aW9cblx0XHRzdmcuQXNwZWN0UmF0aW8gPSBmdW5jdGlvbihjdHgsIGFzcGVjdFJhdGlvLCB3aWR0aCwgZGVzaXJlZFdpZHRoLCBoZWlnaHQsIGRlc2lyZWRIZWlnaHQsIG1pblgsIG1pblksIHJlZlgsIHJlZlkpIHtcblx0XHRcdC8vIGFzcGVjdCByYXRpbyAtIGh0dHA6Ly93d3cudzMub3JnL1RSL1NWRy9jb29yZHMuaHRtbCNQcmVzZXJ2ZUFzcGVjdFJhdGlvQXR0cmlidXRlXG5cdFx0XHRhc3BlY3RSYXRpbyA9IHN2Zy5jb21wcmVzc1NwYWNlcyhhc3BlY3RSYXRpbyk7XG5cdFx0XHRhc3BlY3RSYXRpbyA9IGFzcGVjdFJhdGlvLnJlcGxhY2UoL15kZWZlclxccy8sJycpOyAvLyBpZ25vcmUgZGVmZXJcblx0XHRcdHZhciBhbGlnbiA9IGFzcGVjdFJhdGlvLnNwbGl0KCcgJylbMF0gfHwgJ3hNaWRZTWlkJztcblx0XHRcdHZhciBtZWV0T3JTbGljZSA9IGFzcGVjdFJhdGlvLnNwbGl0KCcgJylbMV0gfHwgJ21lZXQnO1x0XHRcdFx0XHRcblx0XG5cdFx0XHQvLyBjYWxjdWxhdGUgc2NhbGVcblx0XHRcdHZhciBzY2FsZVggPSB3aWR0aCAvIGRlc2lyZWRXaWR0aDtcblx0XHRcdHZhciBzY2FsZVkgPSBoZWlnaHQgLyBkZXNpcmVkSGVpZ2h0O1xuXHRcdFx0dmFyIHNjYWxlTWluID0gTWF0aC5taW4oc2NhbGVYLCBzY2FsZVkpO1xuXHRcdFx0dmFyIHNjYWxlTWF4ID0gTWF0aC5tYXgoc2NhbGVYLCBzY2FsZVkpO1xuXHRcdFx0aWYgKG1lZXRPclNsaWNlID09ICdtZWV0JykgeyBkZXNpcmVkV2lkdGggKj0gc2NhbGVNaW47IGRlc2lyZWRIZWlnaHQgKj0gc2NhbGVNaW47IH1cblx0XHRcdGlmIChtZWV0T3JTbGljZSA9PSAnc2xpY2UnKSB7IGRlc2lyZWRXaWR0aCAqPSBzY2FsZU1heDsgZGVzaXJlZEhlaWdodCAqPSBzY2FsZU1heDsgfVx0XG5cdFx0XHRcblx0XHRcdHJlZlggPSBuZXcgc3ZnLlByb3BlcnR5KCdyZWZYJywgcmVmWCk7XG5cdFx0XHRyZWZZID0gbmV3IHN2Zy5Qcm9wZXJ0eSgncmVmWScsIHJlZlkpO1xuXHRcdFx0aWYgKHJlZlguaGFzVmFsdWUoKSAmJiByZWZZLmhhc1ZhbHVlKCkpIHtcdFx0XHRcdFxuXHRcdFx0XHRjdHgudHJhbnNsYXRlKC1zY2FsZU1pbiAqIHJlZlguTGVuZ3RoLnRvUGl4ZWxzKCd4JyksIC1zY2FsZU1pbiAqIHJlZlkuTGVuZ3RoLnRvUGl4ZWxzKCd5JykpO1xuXHRcdFx0fSBcblx0XHRcdGVsc2Uge1x0XHRcdFx0XHRcblx0XHRcdFx0Ly8gYWxpZ25cblx0XHRcdFx0aWYgKGFsaWduLm1hdGNoKC9eeE1pZC8pICYmICgobWVldE9yU2xpY2UgPT0gJ21lZXQnICYmIHNjYWxlTWluID09IHNjYWxlWSkgfHwgKG1lZXRPclNsaWNlID09ICdzbGljZScgJiYgc2NhbGVNYXggPT0gc2NhbGVZKSkpIGN0eC50cmFuc2xhdGUod2lkdGggLyAyLjAgLSBkZXNpcmVkV2lkdGggLyAyLjAsIDApOyBcblx0XHRcdFx0aWYgKGFsaWduLm1hdGNoKC9ZTWlkJC8pICYmICgobWVldE9yU2xpY2UgPT0gJ21lZXQnICYmIHNjYWxlTWluID09IHNjYWxlWCkgfHwgKG1lZXRPclNsaWNlID09ICdzbGljZScgJiYgc2NhbGVNYXggPT0gc2NhbGVYKSkpIGN0eC50cmFuc2xhdGUoMCwgaGVpZ2h0IC8gMi4wIC0gZGVzaXJlZEhlaWdodCAvIDIuMCk7IFxuXHRcdFx0XHRpZiAoYWxpZ24ubWF0Y2goL154TWF4LykgJiYgKChtZWV0T3JTbGljZSA9PSAnbWVldCcgJiYgc2NhbGVNaW4gPT0gc2NhbGVZKSB8fCAobWVldE9yU2xpY2UgPT0gJ3NsaWNlJyAmJiBzY2FsZU1heCA9PSBzY2FsZVkpKSkgY3R4LnRyYW5zbGF0ZSh3aWR0aCAtIGRlc2lyZWRXaWR0aCwgMCk7IFxuXHRcdFx0XHRpZiAoYWxpZ24ubWF0Y2goL1lNYXgkLykgJiYgKChtZWV0T3JTbGljZSA9PSAnbWVldCcgJiYgc2NhbGVNaW4gPT0gc2NhbGVYKSB8fCAobWVldE9yU2xpY2UgPT0gJ3NsaWNlJyAmJiBzY2FsZU1heCA9PSBzY2FsZVgpKSkgY3R4LnRyYW5zbGF0ZSgwLCBoZWlnaHQgLSBkZXNpcmVkSGVpZ2h0KTsgXG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdC8vIHNjYWxlXG5cdFx0XHRpZiAoYWxpZ24gPT0gJ25vbmUnKSBjdHguc2NhbGUoc2NhbGVYLCBzY2FsZVkpO1xuXHRcdFx0ZWxzZSBpZiAobWVldE9yU2xpY2UgPT0gJ21lZXQnKSBjdHguc2NhbGUoc2NhbGVNaW4sIHNjYWxlTWluKTsgXG5cdFx0XHRlbHNlIGlmIChtZWV0T3JTbGljZSA9PSAnc2xpY2UnKSBjdHguc2NhbGUoc2NhbGVNYXgsIHNjYWxlTWF4KTsgXHRcblx0XHRcdFxuXHRcdFx0Ly8gdHJhbnNsYXRlXG5cdFx0XHRjdHgudHJhbnNsYXRlKG1pblggPT0gbnVsbCA/IDAgOiAtbWluWCwgbWluWSA9PSBudWxsID8gMCA6IC1taW5ZKTtcdFx0XHRcblx0XHR9XG5cdFx0XG5cdFx0Ly8gZWxlbWVudHNcblx0XHRzdmcuRWxlbWVudCA9IHt9XG5cdFx0XG5cdFx0c3ZnLkVsZW1lbnQuRWxlbWVudEJhc2UgPSBmdW5jdGlvbihub2RlKSB7XHRcblx0XHRcdHRoaXMuYXR0cmlidXRlcyA9IHt9O1xuXHRcdFx0dGhpcy5zdHlsZXMgPSB7fTtcblx0XHRcdHRoaXMuY2hpbGRyZW4gPSBbXTtcblx0XHRcdFxuXHRcdFx0Ly8gZ2V0IG9yIGNyZWF0ZSBhdHRyaWJ1dGVcblx0XHRcdHRoaXMuYXR0cmlidXRlID0gZnVuY3Rpb24obmFtZSwgY3JlYXRlSWZOb3RFeGlzdHMpIHtcblx0XHRcdFx0dmFyIGEgPSB0aGlzLmF0dHJpYnV0ZXNbbmFtZV07XG5cdFx0XHRcdGlmIChhICE9IG51bGwpIHJldHVybiBhO1xuXHRcdFx0XHRcdFx0XHRcblx0XHRcdFx0YSA9IG5ldyBzdmcuUHJvcGVydHkobmFtZSwgJycpO1xuXHRcdFx0XHRpZiAoY3JlYXRlSWZOb3RFeGlzdHMgPT0gdHJ1ZSkgdGhpcy5hdHRyaWJ1dGVzW25hbWVdID0gYTtcblx0XHRcdFx0cmV0dXJuIGE7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdC8vIGdldCBvciBjcmVhdGUgc3R5bGUsIGNyYXdscyB1cCBub2RlIHRyZWVcblx0XHRcdHRoaXMuc3R5bGUgPSBmdW5jdGlvbihuYW1lLCBjcmVhdGVJZk5vdEV4aXN0cykge1xuXHRcdFx0XHR2YXIgcyA9IHRoaXMuc3R5bGVzW25hbWVdO1xuXHRcdFx0XHRpZiAocyAhPSBudWxsKSByZXR1cm4gcztcblx0XHRcdFx0XG5cdFx0XHRcdHZhciBhID0gdGhpcy5hdHRyaWJ1dGUobmFtZSk7XG5cdFx0XHRcdGlmIChhICE9IG51bGwgJiYgYS5oYXNWYWx1ZSgpKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGE7XG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHRcdHZhciBwID0gdGhpcy5wYXJlbnQ7XG5cdFx0XHRcdGlmIChwICE9IG51bGwpIHtcblx0XHRcdFx0XHR2YXIgcHMgPSBwLnN0eWxlKG5hbWUpO1xuXHRcdFx0XHRcdGlmIChwcyAhPSBudWxsICYmIHBzLmhhc1ZhbHVlKCkpIHtcblx0XHRcdFx0XHRcdHJldHVybiBwcztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0XHRcblx0XHRcdFx0cyA9IG5ldyBzdmcuUHJvcGVydHkobmFtZSwgJycpO1xuXHRcdFx0XHRpZiAoY3JlYXRlSWZOb3RFeGlzdHMgPT0gdHJ1ZSkgdGhpcy5zdHlsZXNbbmFtZV0gPSBzO1xuXHRcdFx0XHRyZXR1cm4gcztcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0Ly8gYmFzZSByZW5kZXJcblx0XHRcdHRoaXMucmVuZGVyID0gZnVuY3Rpb24oY3R4KSB7XG5cdFx0XHRcdC8vIGRvbid0IHJlbmRlciBkaXNwbGF5PW5vbmVcblx0XHRcdFx0aWYgKHRoaXMuc3R5bGUoJ2Rpc3BsYXknKS52YWx1ZSA9PSAnbm9uZScpIHJldHVybjtcblx0XHRcdFx0XG5cdFx0XHRcdC8vIGRvbid0IHJlbmRlciB2aXNpYmlsaXR5PWhpZGRlblxuXHRcdFx0XHRpZiAodGhpcy5hdHRyaWJ1dGUoJ3Zpc2liaWxpdHknKS52YWx1ZSA9PSAnaGlkZGVuJykgcmV0dXJuO1xuXHRcdFx0XG5cdFx0XHRcdGN0eC5zYXZlKCk7XG5cdFx0XHRcdFx0dGhpcy5zZXRDb250ZXh0KGN0eCk7XG5cdFx0XHRcdFx0XHQvLyBtYXNrXG5cdFx0XHRcdFx0XHRpZiAodGhpcy5hdHRyaWJ1dGUoJ21hc2snKS5oYXNWYWx1ZSgpKSB7XG5cdFx0XHRcdFx0XHRcdHZhciBtYXNrID0gdGhpcy5hdHRyaWJ1dGUoJ21hc2snKS5EZWZpbml0aW9uLmdldERlZmluaXRpb24oKTtcblx0XHRcdFx0XHRcdFx0aWYgKG1hc2sgIT0gbnVsbCkgbWFzay5hcHBseShjdHgsIHRoaXMpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0ZWxzZSBpZiAodGhpcy5zdHlsZSgnZmlsdGVyJykuaGFzVmFsdWUoKSkge1xuXHRcdFx0XHRcdFx0XHR2YXIgZmlsdGVyID0gdGhpcy5zdHlsZSgnZmlsdGVyJykuRGVmaW5pdGlvbi5nZXREZWZpbml0aW9uKCk7XG5cdFx0XHRcdFx0XHRcdGlmIChmaWx0ZXIgIT0gbnVsbCkgZmlsdGVyLmFwcGx5KGN0eCwgdGhpcyk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRlbHNlIHRoaXMucmVuZGVyQ2hpbGRyZW4oY3R4KTtcdFx0XHRcdFxuXHRcdFx0XHRcdHRoaXMuY2xlYXJDb250ZXh0KGN0eCk7XG5cdFx0XHRcdGN0eC5yZXN0b3JlKCk7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdC8vIGJhc2Ugc2V0IGNvbnRleHRcblx0XHRcdHRoaXMuc2V0Q29udGV4dCA9IGZ1bmN0aW9uKGN0eCkge1xuXHRcdFx0XHQvLyBPVkVSUklERSBNRSFcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0Ly8gYmFzZSBjbGVhciBjb250ZXh0XG5cdFx0XHR0aGlzLmNsZWFyQ29udGV4dCA9IGZ1bmN0aW9uKGN0eCkge1xuXHRcdFx0XHQvLyBPVkVSUklERSBNRSFcblx0XHRcdH1cdFx0XHRcblx0XHRcdFxuXHRcdFx0Ly8gYmFzZSByZW5kZXIgY2hpbGRyZW5cblx0XHRcdHRoaXMucmVuZGVyQ2hpbGRyZW4gPSBmdW5jdGlvbihjdHgpIHtcblx0XHRcdFx0Zm9yICh2YXIgaT0wOyBpPHRoaXMuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHR0aGlzLmNoaWxkcmVuW2ldLnJlbmRlcihjdHgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdHRoaXMuYWRkQ2hpbGQgPSBmdW5jdGlvbihjaGlsZE5vZGUsIGNyZWF0ZSkge1xuXHRcdFx0XHR2YXIgY2hpbGQgPSBjaGlsZE5vZGU7XG5cdFx0XHRcdGlmIChjcmVhdGUpIGNoaWxkID0gc3ZnLkNyZWF0ZUVsZW1lbnQoY2hpbGROb2RlKTtcblx0XHRcdFx0Y2hpbGQucGFyZW50ID0gdGhpcztcblx0XHRcdFx0dGhpcy5jaGlsZHJlbi5wdXNoKGNoaWxkKTtcdFx0XHRcblx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHRpZiAobm9kZSAhPSBudWxsICYmIG5vZGUubm9kZVR5cGUgPT0gMSkgeyAvL0VMRU1FTlRfTk9ERVxuXHRcdFx0XHQvLyBhZGQgY2hpbGRyZW5cblx0XHRcdFx0Zm9yICh2YXIgaT0wOyBpPG5vZGUuY2hpbGROb2Rlcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdHZhciBjaGlsZE5vZGUgPSBub2RlLmNoaWxkTm9kZXNbaV07XG5cdFx0XHRcdFx0aWYgKGNoaWxkTm9kZS5ub2RlVHlwZSA9PSAxKSB0aGlzLmFkZENoaWxkKGNoaWxkTm9kZSwgdHJ1ZSk7IC8vRUxFTUVOVF9OT0RFXG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHRcdC8vIGFkZCBhdHRyaWJ1dGVzXG5cdFx0XHRcdGZvciAodmFyIGk9MDsgaTxub2RlLmF0dHJpYnV0ZXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHR2YXIgYXR0cmlidXRlID0gbm9kZS5hdHRyaWJ1dGVzW2ldO1xuXHRcdFx0XHRcdHRoaXMuYXR0cmlidXRlc1thdHRyaWJ1dGUubm9kZU5hbWVdID0gbmV3IHN2Zy5Qcm9wZXJ0eShhdHRyaWJ1dGUubm9kZU5hbWUsIGF0dHJpYnV0ZS5ub2RlVmFsdWUpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFxuXHRcdFx0XHQvLyBhZGQgdGFnIHN0eWxlc1xuXHRcdFx0XHR2YXIgc3R5bGVzID0gc3ZnLlN0eWxlc1tub2RlLm5vZGVOYW1lXTtcblx0XHRcdFx0aWYgKHN0eWxlcyAhPSBudWxsKSB7XG5cdFx0XHRcdFx0Zm9yICh2YXIgbmFtZSBpbiBzdHlsZXMpIHtcblx0XHRcdFx0XHRcdHRoaXMuc3R5bGVzW25hbWVdID0gc3R5bGVzW25hbWVdO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVx0XHRcdFx0XHRcblx0XHRcdFx0XG5cdFx0XHRcdC8vIGFkZCBjbGFzcyBzdHlsZXNcblx0XHRcdFx0aWYgKHRoaXMuYXR0cmlidXRlKCdjbGFzcycpLmhhc1ZhbHVlKCkpIHtcblx0XHRcdFx0XHR2YXIgY2xhc3NlcyA9IHN2Zy5jb21wcmVzc1NwYWNlcyh0aGlzLmF0dHJpYnV0ZSgnY2xhc3MnKS52YWx1ZSkuc3BsaXQoJyAnKTtcblx0XHRcdFx0XHRmb3IgKHZhciBqPTA7IGo8Y2xhc3Nlcy5sZW5ndGg7IGorKykge1xuXHRcdFx0XHRcdFx0c3R5bGVzID0gc3ZnLlN0eWxlc1snLicrY2xhc3Nlc1tqXV07XG5cdFx0XHRcdFx0XHRpZiAoc3R5bGVzICE9IG51bGwpIHtcblx0XHRcdFx0XHRcdFx0Zm9yICh2YXIgbmFtZSBpbiBzdHlsZXMpIHtcblx0XHRcdFx0XHRcdFx0XHR0aGlzLnN0eWxlc1tuYW1lXSA9IHN0eWxlc1tuYW1lXTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0c3R5bGVzID0gc3ZnLlN0eWxlc1tub2RlLm5vZGVOYW1lKycuJytjbGFzc2VzW2pdXTtcblx0XHRcdFx0XHRcdGlmIChzdHlsZXMgIT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0XHRmb3IgKHZhciBuYW1lIGluIHN0eWxlcykge1xuXHRcdFx0XHRcdFx0XHRcdHRoaXMuc3R5bGVzW25hbWVdID0gc3R5bGVzW25hbWVdO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0XHQvLyBhZGQgaW5saW5lIHN0eWxlc1xuXHRcdFx0XHRpZiAodGhpcy5hdHRyaWJ1dGUoJ3N0eWxlJykuaGFzVmFsdWUoKSkge1xuXHRcdFx0XHRcdHZhciBzdHlsZXMgPSB0aGlzLmF0dHJpYnV0ZSgnc3R5bGUnKS52YWx1ZS5zcGxpdCgnOycpO1xuXHRcdFx0XHRcdGZvciAodmFyIGk9MDsgaTxzdHlsZXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRcdGlmIChzdmcudHJpbShzdHlsZXNbaV0pICE9ICcnKSB7XG5cdFx0XHRcdFx0XHRcdHZhciBzdHlsZSA9IHN0eWxlc1tpXS5zcGxpdCgnOicpO1xuXHRcdFx0XHRcdFx0XHR2YXIgbmFtZSA9IHN2Zy50cmltKHN0eWxlWzBdKTtcblx0XHRcdFx0XHRcdFx0dmFyIHZhbHVlID0gc3ZnLnRyaW0oc3R5bGVbMV0pO1xuXHRcdFx0XHRcdFx0XHR0aGlzLnN0eWxlc1tuYW1lXSA9IG5ldyBzdmcuUHJvcGVydHkobmFtZSwgdmFsdWUpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVx0XG5cblx0XHRcdFx0Ly8gYWRkIGlkXG5cdFx0XHRcdGlmICh0aGlzLmF0dHJpYnV0ZSgnaWQnKS5oYXNWYWx1ZSgpKSB7XG5cdFx0XHRcdFx0aWYgKHN2Zy5EZWZpbml0aW9uc1t0aGlzLmF0dHJpYnV0ZSgnaWQnKS52YWx1ZV0gPT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0c3ZnLkRlZmluaXRpb25zW3RoaXMuYXR0cmlidXRlKCdpZCcpLnZhbHVlXSA9IHRoaXM7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdFxuXHRcdHN2Zy5FbGVtZW50LlJlbmRlcmVkRWxlbWVudEJhc2UgPSBmdW5jdGlvbihub2RlKSB7XG5cdFx0XHR0aGlzLmJhc2UgPSBzdmcuRWxlbWVudC5FbGVtZW50QmFzZTtcblx0XHRcdHRoaXMuYmFzZShub2RlKTtcblx0XHRcdFxuXHRcdFx0dGhpcy5zZXRDb250ZXh0ID0gZnVuY3Rpb24oY3R4KSB7XG5cdFx0XHRcdC8vIGZpbGxcblx0XHRcdFx0aWYgKHRoaXMuc3R5bGUoJ2ZpbGwnKS5EZWZpbml0aW9uLmlzVXJsKCkpIHtcblx0XHRcdFx0XHR2YXIgZnMgPSB0aGlzLnN0eWxlKCdmaWxsJykuRGVmaW5pdGlvbi5nZXRGaWxsU3R5bGUodGhpcyk7XG5cdFx0XHRcdFx0aWYgKGZzICE9IG51bGwpIGN0eC5maWxsU3R5bGUgPSBmcztcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIGlmICh0aGlzLnN0eWxlKCdmaWxsJykuaGFzVmFsdWUoKSkge1xuXHRcdFx0XHRcdHZhciBmaWxsU3R5bGUgPSB0aGlzLnN0eWxlKCdmaWxsJyk7XG5cdFx0XHRcdFx0aWYgKHRoaXMuc3R5bGUoJ2ZpbGwtb3BhY2l0eScpLmhhc1ZhbHVlKCkpIGZpbGxTdHlsZSA9IGZpbGxTdHlsZS5Db2xvci5hZGRPcGFjaXR5KHRoaXMuc3R5bGUoJ2ZpbGwtb3BhY2l0eScpLnZhbHVlKTtcblx0XHRcdFx0XHRjdHguZmlsbFN0eWxlID0gKGZpbGxTdHlsZS52YWx1ZSA9PSAnbm9uZScgPyAncmdiYSgwLDAsMCwwKScgOiBmaWxsU3R5bGUudmFsdWUpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHRcblx0XHRcdFx0Ly8gc3Ryb2tlXG5cdFx0XHRcdGlmICh0aGlzLnN0eWxlKCdzdHJva2UnKS5EZWZpbml0aW9uLmlzVXJsKCkpIHtcblx0XHRcdFx0XHR2YXIgZnMgPSB0aGlzLnN0eWxlKCdzdHJva2UnKS5EZWZpbml0aW9uLmdldEZpbGxTdHlsZSh0aGlzKTtcblx0XHRcdFx0XHRpZiAoZnMgIT0gbnVsbCkgY3R4LnN0cm9rZVN0eWxlID0gZnM7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSBpZiAodGhpcy5zdHlsZSgnc3Ryb2tlJykuaGFzVmFsdWUoKSkge1xuXHRcdFx0XHRcdHZhciBzdHJva2VTdHlsZSA9IHRoaXMuc3R5bGUoJ3N0cm9rZScpO1xuXHRcdFx0XHRcdGlmICh0aGlzLnN0eWxlKCdzdHJva2Utb3BhY2l0eScpLmhhc1ZhbHVlKCkpIHN0cm9rZVN0eWxlID0gc3Ryb2tlU3R5bGUuQ29sb3IuYWRkT3BhY2l0eSh0aGlzLnN0eWxlKCdzdHJva2Utb3BhY2l0eScpLnZhbHVlKTtcblx0XHRcdFx0XHRjdHguc3Ryb2tlU3R5bGUgPSAoc3Ryb2tlU3R5bGUudmFsdWUgPT0gJ25vbmUnID8gJ3JnYmEoMCwwLDAsMCknIDogc3Ryb2tlU3R5bGUudmFsdWUpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICh0aGlzLnN0eWxlKCdzdHJva2Utd2lkdGgnKS5oYXNWYWx1ZSgpKSBjdHgubGluZVdpZHRoID0gdGhpcy5zdHlsZSgnc3Ryb2tlLXdpZHRoJykuTGVuZ3RoLnRvUGl4ZWxzKCk7XG5cdFx0XHRcdGlmICh0aGlzLnN0eWxlKCdzdHJva2UtbGluZWNhcCcpLmhhc1ZhbHVlKCkpIGN0eC5saW5lQ2FwID0gdGhpcy5zdHlsZSgnc3Ryb2tlLWxpbmVjYXAnKS52YWx1ZTtcblx0XHRcdFx0aWYgKHRoaXMuc3R5bGUoJ3N0cm9rZS1saW5lam9pbicpLmhhc1ZhbHVlKCkpIGN0eC5saW5lSm9pbiA9IHRoaXMuc3R5bGUoJ3N0cm9rZS1saW5lam9pbicpLnZhbHVlO1xuXHRcdFx0XHRpZiAodGhpcy5zdHlsZSgnc3Ryb2tlLW1pdGVybGltaXQnKS5oYXNWYWx1ZSgpKSBjdHgubWl0ZXJMaW1pdCA9IHRoaXMuc3R5bGUoJ3N0cm9rZS1taXRlcmxpbWl0JykudmFsdWU7XG5cblx0XHRcdFx0Ly8gZm9udFxuXHRcdFx0XHRpZiAodHlwZW9mKGN0eC5mb250KSAhPSAndW5kZWZpbmVkJykge1xuXHRcdFx0XHRcdGN0eC5mb250ID0gc3ZnLkZvbnQuQ3JlYXRlRm9udCggXG5cdFx0XHRcdFx0XHR0aGlzLnN0eWxlKCdmb250LXN0eWxlJykudmFsdWUsIFxuXHRcdFx0XHRcdFx0dGhpcy5zdHlsZSgnZm9udC12YXJpYW50JykudmFsdWUsIFxuXHRcdFx0XHRcdFx0dGhpcy5zdHlsZSgnZm9udC13ZWlnaHQnKS52YWx1ZSwgXG5cdFx0XHRcdFx0XHR0aGlzLnN0eWxlKCdmb250LXNpemUnKS5oYXNWYWx1ZSgpID8gdGhpcy5zdHlsZSgnZm9udC1zaXplJykuTGVuZ3RoLnRvUGl4ZWxzKCkgKyAncHgnIDogJycsIFxuXHRcdFx0XHRcdFx0dGhpcy5zdHlsZSgnZm9udC1mYW1pbHknKS52YWx1ZSkudG9TdHJpbmcoKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdFx0Ly8gdHJhbnNmb3JtXG5cdFx0XHRcdGlmICh0aGlzLmF0dHJpYnV0ZSgndHJhbnNmb3JtJykuaGFzVmFsdWUoKSkgeyBcblx0XHRcdFx0XHR2YXIgdHJhbnNmb3JtID0gbmV3IHN2Zy5UcmFuc2Zvcm0odGhpcy5hdHRyaWJ1dGUoJ3RyYW5zZm9ybScpLnZhbHVlKTtcblx0XHRcdFx0XHR0cmFuc2Zvcm0uYXBwbHkoY3R4KTtcblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdFx0Ly8gY2xpcFxuXHRcdFx0XHRpZiAodGhpcy5hdHRyaWJ1dGUoJ2NsaXAtcGF0aCcpLmhhc1ZhbHVlKCkpIHtcblx0XHRcdFx0XHR2YXIgY2xpcCA9IHRoaXMuYXR0cmlidXRlKCdjbGlwLXBhdGgnKS5EZWZpbml0aW9uLmdldERlZmluaXRpb24oKTtcblx0XHRcdFx0XHRpZiAoY2xpcCAhPSBudWxsKSBjbGlwLmFwcGx5KGN0eCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHRcdC8vIG9wYWNpdHlcblx0XHRcdFx0aWYgKHRoaXMuc3R5bGUoJ29wYWNpdHknKS5oYXNWYWx1ZSgpKSB7XG5cdFx0XHRcdFx0Y3R4Lmdsb2JhbEFscGhhID0gdGhpcy5zdHlsZSgnb3BhY2l0eScpLm51bVZhbHVlKCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cdFx0XG5cdFx0fVxuXHRcdHN2Zy5FbGVtZW50LlJlbmRlcmVkRWxlbWVudEJhc2UucHJvdG90eXBlID0gbmV3IHN2Zy5FbGVtZW50LkVsZW1lbnRCYXNlO1xuXHRcdFxuXHRcdHN2Zy5FbGVtZW50LlBhdGhFbGVtZW50QmFzZSA9IGZ1bmN0aW9uKG5vZGUpIHtcblx0XHRcdHRoaXMuYmFzZSA9IHN2Zy5FbGVtZW50LlJlbmRlcmVkRWxlbWVudEJhc2U7XG5cdFx0XHR0aGlzLmJhc2Uobm9kZSk7XG5cdFx0XHRcblx0XHRcdHRoaXMucGF0aCA9IGZ1bmN0aW9uKGN0eCkge1xuXHRcdFx0XHRpZiAoY3R4ICE9IG51bGwpIGN0eC5iZWdpblBhdGgoKTtcblx0XHRcdFx0cmV0dXJuIG5ldyBzdmcuQm91bmRpbmdCb3goKTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0dGhpcy5yZW5kZXJDaGlsZHJlbiA9IGZ1bmN0aW9uKGN0eCkge1xuXHRcdFx0XHR0aGlzLnBhdGgoY3R4KTtcblx0XHRcdFx0c3ZnLk1vdXNlLmNoZWNrUGF0aCh0aGlzLCBjdHgpO1xuXHRcdFx0XHRpZiAoY3R4LmZpbGxTdHlsZSAhPSAnJykgY3R4LmZpbGwoKTtcblx0XHRcdFx0aWYgKGN0eC5zdHJva2VTdHlsZSAhPSAnJykgY3R4LnN0cm9rZSgpO1xuXHRcdFx0XHRcblx0XHRcdFx0dmFyIG1hcmtlcnMgPSB0aGlzLmdldE1hcmtlcnMoKTtcblx0XHRcdFx0aWYgKG1hcmtlcnMgIT0gbnVsbCkge1xuXHRcdFx0XHRcdGlmICh0aGlzLnN0eWxlKCdtYXJrZXItc3RhcnQnKS5EZWZpbml0aW9uLmlzVXJsKCkpIHtcblx0XHRcdFx0XHRcdHZhciBtYXJrZXIgPSB0aGlzLnN0eWxlKCdtYXJrZXItc3RhcnQnKS5EZWZpbml0aW9uLmdldERlZmluaXRpb24oKTtcblx0XHRcdFx0XHRcdG1hcmtlci5yZW5kZXIoY3R4LCBtYXJrZXJzWzBdWzBdLCBtYXJrZXJzWzBdWzFdKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYgKHRoaXMuc3R5bGUoJ21hcmtlci1taWQnKS5EZWZpbml0aW9uLmlzVXJsKCkpIHtcblx0XHRcdFx0XHRcdHZhciBtYXJrZXIgPSB0aGlzLnN0eWxlKCdtYXJrZXItbWlkJykuRGVmaW5pdGlvbi5nZXREZWZpbml0aW9uKCk7XG5cdFx0XHRcdFx0XHRmb3IgKHZhciBpPTE7aTxtYXJrZXJzLmxlbmd0aC0xO2krKykge1xuXHRcdFx0XHRcdFx0XHRtYXJrZXIucmVuZGVyKGN0eCwgbWFya2Vyc1tpXVswXSwgbWFya2Vyc1tpXVsxXSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmICh0aGlzLnN0eWxlKCdtYXJrZXItZW5kJykuRGVmaW5pdGlvbi5pc1VybCgpKSB7XG5cdFx0XHRcdFx0XHR2YXIgbWFya2VyID0gdGhpcy5zdHlsZSgnbWFya2VyLWVuZCcpLkRlZmluaXRpb24uZ2V0RGVmaW5pdGlvbigpO1xuXHRcdFx0XHRcdFx0bWFya2VyLnJlbmRlcihjdHgsIG1hcmtlcnNbbWFya2Vycy5sZW5ndGgtMV1bMF0sIG1hcmtlcnNbbWFya2Vycy5sZW5ndGgtMV1bMV0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVx0XHRcdFx0XHRcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0dGhpcy5nZXRCb3VuZGluZ0JveCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gdGhpcy5wYXRoKCk7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdHRoaXMuZ2V0TWFya2VycyA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRcdH1cblx0XHR9XG5cdFx0c3ZnLkVsZW1lbnQuUGF0aEVsZW1lbnRCYXNlLnByb3RvdHlwZSA9IG5ldyBzdmcuRWxlbWVudC5SZW5kZXJlZEVsZW1lbnRCYXNlO1xuXHRcdFxuXHRcdC8vIHN2ZyBlbGVtZW50XG5cdFx0c3ZnLkVsZW1lbnQuc3ZnID0gZnVuY3Rpb24obm9kZSkge1xuXHRcdFx0dGhpcy5iYXNlID0gc3ZnLkVsZW1lbnQuUmVuZGVyZWRFbGVtZW50QmFzZTtcblx0XHRcdHRoaXMuYmFzZShub2RlKTtcblx0XHRcdFxuXHRcdFx0dGhpcy5iYXNlQ2xlYXJDb250ZXh0ID0gdGhpcy5jbGVhckNvbnRleHQ7XG5cdFx0XHR0aGlzLmNsZWFyQ29udGV4dCA9IGZ1bmN0aW9uKGN0eCkge1xuXHRcdFx0XHR0aGlzLmJhc2VDbGVhckNvbnRleHQoY3R4KTtcblx0XHRcdFx0c3ZnLlZpZXdQb3J0LlJlbW92ZUN1cnJlbnQoKTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0dGhpcy5iYXNlU2V0Q29udGV4dCA9IHRoaXMuc2V0Q29udGV4dDtcblx0XHRcdHRoaXMuc2V0Q29udGV4dCA9IGZ1bmN0aW9uKGN0eCkge1xuXHRcdFx0XHQvLyBpbml0aWFsIHZhbHVlc1xuXHRcdFx0XHRjdHguc3Ryb2tlU3R5bGUgPSAncmdiYSgwLDAsMCwwKSc7XG5cdFx0XHRcdGN0eC5saW5lQ2FwID0gJ2J1dHQnO1xuXHRcdFx0XHRjdHgubGluZUpvaW4gPSAnbWl0ZXInO1xuXHRcdFx0XHRjdHgubWl0ZXJMaW1pdCA9IDQ7XHRcdFx0XG5cdFx0XHRcblx0XHRcdFx0dGhpcy5iYXNlU2V0Q29udGV4dChjdHgpO1xuXHRcdFx0XHRcblx0XHRcdFx0Ly8gY3JlYXRlIG5ldyB2aWV3IHBvcnRcblx0XHRcdFx0aWYgKHRoaXMuYXR0cmlidXRlKCd4JykuaGFzVmFsdWUoKSAmJiB0aGlzLmF0dHJpYnV0ZSgneScpLmhhc1ZhbHVlKCkpIHtcblx0XHRcdFx0XHRjdHgudHJhbnNsYXRlKHRoaXMuYXR0cmlidXRlKCd4JykuTGVuZ3RoLnRvUGl4ZWxzKCd4JyksIHRoaXMuYXR0cmlidXRlKCd5JykuTGVuZ3RoLnRvUGl4ZWxzKCd5JykpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0XHR2YXIgd2lkdGggPSBzdmcuVmlld1BvcnQud2lkdGgoKTtcblx0XHRcdFx0dmFyIGhlaWdodCA9IHN2Zy5WaWV3UG9ydC5oZWlnaHQoKTtcblx0XHRcdFx0aWYgKHR5cGVvZih0aGlzLnJvb3QpID09ICd1bmRlZmluZWQnICYmIHRoaXMuYXR0cmlidXRlKCd3aWR0aCcpLmhhc1ZhbHVlKCkgJiYgdGhpcy5hdHRyaWJ1dGUoJ2hlaWdodCcpLmhhc1ZhbHVlKCkpIHtcblx0XHRcdFx0XHR3aWR0aCA9IHRoaXMuYXR0cmlidXRlKCd3aWR0aCcpLkxlbmd0aC50b1BpeGVscygneCcpO1xuXHRcdFx0XHRcdGhlaWdodCA9IHRoaXMuYXR0cmlidXRlKCdoZWlnaHQnKS5MZW5ndGgudG9QaXhlbHMoJ3knKTtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHR2YXIgeCA9IDA7XG5cdFx0XHRcdFx0dmFyIHkgPSAwO1xuXHRcdFx0XHRcdGlmICh0aGlzLmF0dHJpYnV0ZSgncmVmWCcpLmhhc1ZhbHVlKCkgJiYgdGhpcy5hdHRyaWJ1dGUoJ3JlZlknKS5oYXNWYWx1ZSgpKSB7XG5cdFx0XHRcdFx0XHR4ID0gLXRoaXMuYXR0cmlidXRlKCdyZWZYJykuTGVuZ3RoLnRvUGl4ZWxzKCd4Jyk7XG5cdFx0XHRcdFx0XHR5ID0gLXRoaXMuYXR0cmlidXRlKCdyZWZZJykuTGVuZ3RoLnRvUGl4ZWxzKCd5Jyk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdGN0eC5iZWdpblBhdGgoKTtcblx0XHRcdFx0XHRjdHgubW92ZVRvKHgsIHkpO1xuXHRcdFx0XHRcdGN0eC5saW5lVG8od2lkdGgsIHkpO1xuXHRcdFx0XHRcdGN0eC5saW5lVG8od2lkdGgsIGhlaWdodCk7XG5cdFx0XHRcdFx0Y3R4LmxpbmVUbyh4LCBoZWlnaHQpO1xuXHRcdFx0XHRcdGN0eC5jbG9zZVBhdGgoKTtcblx0XHRcdFx0XHRjdHguY2xpcCgpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHN2Zy5WaWV3UG9ydC5TZXRDdXJyZW50KHdpZHRoLCBoZWlnaHQpO1x0XG5cdFx0XHRcdFx0XHRcblx0XHRcdFx0Ly8gdmlld2JveFxuXHRcdFx0XHRpZiAodGhpcy5hdHRyaWJ1dGUoJ3ZpZXdCb3gnKS5oYXNWYWx1ZSgpKSB7XHRcdFx0XHRcblx0XHRcdFx0XHR2YXIgdmlld0JveCA9IHN2Zy5Ub051bWJlckFycmF5KHRoaXMuYXR0cmlidXRlKCd2aWV3Qm94JykudmFsdWUpO1xuXHRcdFx0XHRcdHZhciBtaW5YID0gdmlld0JveFswXTtcblx0XHRcdFx0XHR2YXIgbWluWSA9IHZpZXdCb3hbMV07XG5cdFx0XHRcdFx0d2lkdGggPSB2aWV3Qm94WzJdO1xuXHRcdFx0XHRcdGhlaWdodCA9IHZpZXdCb3hbM107XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0c3ZnLkFzcGVjdFJhdGlvKGN0eCxcblx0XHRcdFx0XHRcdFx0XHRcdHRoaXMuYXR0cmlidXRlKCdwcmVzZXJ2ZUFzcGVjdFJhdGlvJykudmFsdWUsIFxuXHRcdFx0XHRcdFx0XHRcdFx0c3ZnLlZpZXdQb3J0LndpZHRoKCksIFxuXHRcdFx0XHRcdFx0XHRcdFx0d2lkdGgsXG5cdFx0XHRcdFx0XHRcdFx0XHRzdmcuVmlld1BvcnQuaGVpZ2h0KCksXG5cdFx0XHRcdFx0XHRcdFx0XHRoZWlnaHQsXG5cdFx0XHRcdFx0XHRcdFx0XHRtaW5YLFxuXHRcdFx0XHRcdFx0XHRcdFx0bWluWSxcblx0XHRcdFx0XHRcdFx0XHRcdHRoaXMuYXR0cmlidXRlKCdyZWZYJykudmFsdWUsXG5cdFx0XHRcdFx0XHRcdFx0XHR0aGlzLmF0dHJpYnV0ZSgncmVmWScpLnZhbHVlKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0c3ZnLlZpZXdQb3J0LlJlbW92ZUN1cnJlbnQoKTtcdFxuXHRcdFx0XHRcdHN2Zy5WaWV3UG9ydC5TZXRDdXJyZW50KHZpZXdCb3hbMl0sIHZpZXdCb3hbM10pO1x0XHRcdFx0XHRcdFxuXHRcdFx0XHR9XHRcdFx0XHRcblx0XHRcdH1cblx0XHR9XG5cdFx0c3ZnLkVsZW1lbnQuc3ZnLnByb3RvdHlwZSA9IG5ldyBzdmcuRWxlbWVudC5SZW5kZXJlZEVsZW1lbnRCYXNlO1xuXG5cdFx0Ly8gcmVjdCBlbGVtZW50XG5cdFx0c3ZnLkVsZW1lbnQucmVjdCA9IGZ1bmN0aW9uKG5vZGUpIHtcblx0XHRcdHRoaXMuYmFzZSA9IHN2Zy5FbGVtZW50LlBhdGhFbGVtZW50QmFzZTtcblx0XHRcdHRoaXMuYmFzZShub2RlKTtcblx0XHRcdFxuXHRcdFx0dGhpcy5wYXRoID0gZnVuY3Rpb24oY3R4KSB7XG5cdFx0XHRcdHZhciB4ID0gdGhpcy5hdHRyaWJ1dGUoJ3gnKS5MZW5ndGgudG9QaXhlbHMoJ3gnKTtcblx0XHRcdFx0dmFyIHkgPSB0aGlzLmF0dHJpYnV0ZSgneScpLkxlbmd0aC50b1BpeGVscygneScpO1xuXHRcdFx0XHR2YXIgd2lkdGggPSB0aGlzLmF0dHJpYnV0ZSgnd2lkdGgnKS5MZW5ndGgudG9QaXhlbHMoJ3gnKTtcblx0XHRcdFx0dmFyIGhlaWdodCA9IHRoaXMuYXR0cmlidXRlKCdoZWlnaHQnKS5MZW5ndGgudG9QaXhlbHMoJ3knKTtcblx0XHRcdFx0dmFyIHJ4ID0gdGhpcy5hdHRyaWJ1dGUoJ3J4JykuTGVuZ3RoLnRvUGl4ZWxzKCd4Jyk7XG5cdFx0XHRcdHZhciByeSA9IHRoaXMuYXR0cmlidXRlKCdyeScpLkxlbmd0aC50b1BpeGVscygneScpO1xuXHRcdFx0XHRpZiAodGhpcy5hdHRyaWJ1dGUoJ3J4JykuaGFzVmFsdWUoKSAmJiAhdGhpcy5hdHRyaWJ1dGUoJ3J5JykuaGFzVmFsdWUoKSkgcnkgPSByeDtcblx0XHRcdFx0aWYgKHRoaXMuYXR0cmlidXRlKCdyeScpLmhhc1ZhbHVlKCkgJiYgIXRoaXMuYXR0cmlidXRlKCdyeCcpLmhhc1ZhbHVlKCkpIHJ4ID0gcnk7XG5cdFx0XHRcdFxuXHRcdFx0XHRpZiAoY3R4ICE9IG51bGwpIHtcblx0XHRcdFx0XHRjdHguYmVnaW5QYXRoKCk7XG5cdFx0XHRcdFx0Y3R4Lm1vdmVUbyh4ICsgcngsIHkpO1xuXHRcdFx0XHRcdGN0eC5saW5lVG8oeCArIHdpZHRoIC0gcngsIHkpO1xuXHRcdFx0XHRcdGN0eC5xdWFkcmF0aWNDdXJ2ZVRvKHggKyB3aWR0aCwgeSwgeCArIHdpZHRoLCB5ICsgcnkpXG5cdFx0XHRcdFx0Y3R4LmxpbmVUbyh4ICsgd2lkdGgsIHkgKyBoZWlnaHQgLSByeSk7XG5cdFx0XHRcdFx0Y3R4LnF1YWRyYXRpY0N1cnZlVG8oeCArIHdpZHRoLCB5ICsgaGVpZ2h0LCB4ICsgd2lkdGggLSByeCwgeSArIGhlaWdodClcblx0XHRcdFx0XHRjdHgubGluZVRvKHggKyByeCwgeSArIGhlaWdodCk7XG5cdFx0XHRcdFx0Y3R4LnF1YWRyYXRpY0N1cnZlVG8oeCwgeSArIGhlaWdodCwgeCwgeSArIGhlaWdodCAtIHJ5KVxuXHRcdFx0XHRcdGN0eC5saW5lVG8oeCwgeSArIHJ5KTtcblx0XHRcdFx0XHRjdHgucXVhZHJhdGljQ3VydmVUbyh4LCB5LCB4ICsgcngsIHkpXG5cdFx0XHRcdFx0Y3R4LmNsb3NlUGF0aCgpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0XHRyZXR1cm4gbmV3IHN2Zy5Cb3VuZGluZ0JveCh4LCB5LCB4ICsgd2lkdGgsIHkgKyBoZWlnaHQpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRzdmcuRWxlbWVudC5yZWN0LnByb3RvdHlwZSA9IG5ldyBzdmcuRWxlbWVudC5QYXRoRWxlbWVudEJhc2U7XG5cdFx0XG5cdFx0Ly8gY2lyY2xlIGVsZW1lbnRcblx0XHRzdmcuRWxlbWVudC5jaXJjbGUgPSBmdW5jdGlvbihub2RlKSB7XG5cdFx0XHR0aGlzLmJhc2UgPSBzdmcuRWxlbWVudC5QYXRoRWxlbWVudEJhc2U7XG5cdFx0XHR0aGlzLmJhc2Uobm9kZSk7XG5cdFx0XHRcblx0XHRcdHRoaXMucGF0aCA9IGZ1bmN0aW9uKGN0eCkge1xuXHRcdFx0XHR2YXIgY3ggPSB0aGlzLmF0dHJpYnV0ZSgnY3gnKS5MZW5ndGgudG9QaXhlbHMoJ3gnKTtcblx0XHRcdFx0dmFyIGN5ID0gdGhpcy5hdHRyaWJ1dGUoJ2N5JykuTGVuZ3RoLnRvUGl4ZWxzKCd5Jyk7XG5cdFx0XHRcdHZhciByID0gdGhpcy5hdHRyaWJ1dGUoJ3InKS5MZW5ndGgudG9QaXhlbHMoKTtcblx0XHRcdFxuXHRcdFx0XHRpZiAoY3R4ICE9IG51bGwpIHtcblx0XHRcdFx0XHRjdHguYmVnaW5QYXRoKCk7XG5cdFx0XHRcdFx0Y3R4LmFyYyhjeCwgY3ksIHIsIDAsIE1hdGguUEkgKiAyLCB0cnVlKTsgXG5cdFx0XHRcdFx0Y3R4LmNsb3NlUGF0aCgpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0XHRyZXR1cm4gbmV3IHN2Zy5Cb3VuZGluZ0JveChjeCAtIHIsIGN5IC0gciwgY3ggKyByLCBjeSArIHIpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRzdmcuRWxlbWVudC5jaXJjbGUucHJvdG90eXBlID0gbmV3IHN2Zy5FbGVtZW50LlBhdGhFbGVtZW50QmFzZTtcdFxuXG5cdFx0Ly8gZWxsaXBzZSBlbGVtZW50XG5cdFx0c3ZnLkVsZW1lbnQuZWxsaXBzZSA9IGZ1bmN0aW9uKG5vZGUpIHtcblx0XHRcdHRoaXMuYmFzZSA9IHN2Zy5FbGVtZW50LlBhdGhFbGVtZW50QmFzZTtcblx0XHRcdHRoaXMuYmFzZShub2RlKTtcblx0XHRcdFxuXHRcdFx0dGhpcy5wYXRoID0gZnVuY3Rpb24oY3R4KSB7XG5cdFx0XHRcdHZhciBLQVBQQSA9IDQgKiAoKE1hdGguc3FydCgyKSAtIDEpIC8gMyk7XG5cdFx0XHRcdHZhciByeCA9IHRoaXMuYXR0cmlidXRlKCdyeCcpLkxlbmd0aC50b1BpeGVscygneCcpO1xuXHRcdFx0XHR2YXIgcnkgPSB0aGlzLmF0dHJpYnV0ZSgncnknKS5MZW5ndGgudG9QaXhlbHMoJ3knKTtcblx0XHRcdFx0dmFyIGN4ID0gdGhpcy5hdHRyaWJ1dGUoJ2N4JykuTGVuZ3RoLnRvUGl4ZWxzKCd4Jyk7XG5cdFx0XHRcdHZhciBjeSA9IHRoaXMuYXR0cmlidXRlKCdjeScpLkxlbmd0aC50b1BpeGVscygneScpO1xuXHRcdFx0XHRcblx0XHRcdFx0aWYgKGN0eCAhPSBudWxsKSB7XG5cdFx0XHRcdFx0Y3R4LmJlZ2luUGF0aCgpO1xuXHRcdFx0XHRcdGN0eC5tb3ZlVG8oY3gsIGN5IC0gcnkpO1xuXHRcdFx0XHRcdGN0eC5iZXppZXJDdXJ2ZVRvKGN4ICsgKEtBUFBBICogcngpLCBjeSAtIHJ5LCAgY3ggKyByeCwgY3kgLSAoS0FQUEEgKiByeSksIGN4ICsgcngsIGN5KTtcblx0XHRcdFx0XHRjdHguYmV6aWVyQ3VydmVUbyhjeCArIHJ4LCBjeSArIChLQVBQQSAqIHJ5KSwgY3ggKyAoS0FQUEEgKiByeCksIGN5ICsgcnksIGN4LCBjeSArIHJ5KTtcblx0XHRcdFx0XHRjdHguYmV6aWVyQ3VydmVUbyhjeCAtIChLQVBQQSAqIHJ4KSwgY3kgKyByeSwgY3ggLSByeCwgY3kgKyAoS0FQUEEgKiByeSksIGN4IC0gcngsIGN5KTtcblx0XHRcdFx0XHRjdHguYmV6aWVyQ3VydmVUbyhjeCAtIHJ4LCBjeSAtIChLQVBQQSAqIHJ5KSwgY3ggLSAoS0FQUEEgKiByeCksIGN5IC0gcnksIGN4LCBjeSAtIHJ5KTtcblx0XHRcdFx0XHRjdHguY2xvc2VQYXRoKCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHRcdHJldHVybiBuZXcgc3ZnLkJvdW5kaW5nQm94KGN4IC0gcngsIGN5IC0gcnksIGN4ICsgcngsIGN5ICsgcnkpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRzdmcuRWxlbWVudC5lbGxpcHNlLnByb3RvdHlwZSA9IG5ldyBzdmcuRWxlbWVudC5QYXRoRWxlbWVudEJhc2U7XHRcdFx0XG5cdFx0XG5cdFx0Ly8gbGluZSBlbGVtZW50XG5cdFx0c3ZnLkVsZW1lbnQubGluZSA9IGZ1bmN0aW9uKG5vZGUpIHtcblx0XHRcdHRoaXMuYmFzZSA9IHN2Zy5FbGVtZW50LlBhdGhFbGVtZW50QmFzZTtcblx0XHRcdHRoaXMuYmFzZShub2RlKTtcblx0XHRcdFxuXHRcdFx0dGhpcy5nZXRQb2ludHMgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0cmV0dXJuIFtcblx0XHRcdFx0XHRuZXcgc3ZnLlBvaW50KHRoaXMuYXR0cmlidXRlKCd4MScpLkxlbmd0aC50b1BpeGVscygneCcpLCB0aGlzLmF0dHJpYnV0ZSgneTEnKS5MZW5ndGgudG9QaXhlbHMoJ3knKSksXG5cdFx0XHRcdFx0bmV3IHN2Zy5Qb2ludCh0aGlzLmF0dHJpYnV0ZSgneDInKS5MZW5ndGgudG9QaXhlbHMoJ3gnKSwgdGhpcy5hdHRyaWJ1dGUoJ3kyJykuTGVuZ3RoLnRvUGl4ZWxzKCd5JykpXTtcblx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRcblx0XHRcdHRoaXMucGF0aCA9IGZ1bmN0aW9uKGN0eCkge1xuXHRcdFx0XHR2YXIgcG9pbnRzID0gdGhpcy5nZXRQb2ludHMoKTtcblx0XHRcdFx0XG5cdFx0XHRcdGlmIChjdHggIT0gbnVsbCkge1xuXHRcdFx0XHRcdGN0eC5iZWdpblBhdGgoKTtcblx0XHRcdFx0XHRjdHgubW92ZVRvKHBvaW50c1swXS54LCBwb2ludHNbMF0ueSk7XG5cdFx0XHRcdFx0Y3R4LmxpbmVUbyhwb2ludHNbMV0ueCwgcG9pbnRzWzFdLnkpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0XHRyZXR1cm4gbmV3IHN2Zy5Cb3VuZGluZ0JveChwb2ludHNbMF0ueCwgcG9pbnRzWzBdLnksIHBvaW50c1sxXS54LCBwb2ludHNbMV0ueSk7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdHRoaXMuZ2V0TWFya2VycyA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR2YXIgcG9pbnRzID0gdGhpcy5nZXRQb2ludHMoKTtcdFxuXHRcdFx0XHR2YXIgYSA9IHBvaW50c1swXS5hbmdsZVRvKHBvaW50c1sxXSk7XG5cdFx0XHRcdHJldHVybiBbW3BvaW50c1swXSwgYV0sIFtwb2ludHNbMV0sIGFdXTtcblx0XHRcdH1cblx0XHR9XG5cdFx0c3ZnLkVsZW1lbnQubGluZS5wcm90b3R5cGUgPSBuZXcgc3ZnLkVsZW1lbnQuUGF0aEVsZW1lbnRCYXNlO1x0XHRcblx0XHRcdFx0XG5cdFx0Ly8gcG9seWxpbmUgZWxlbWVudFxuXHRcdHN2Zy5FbGVtZW50LnBvbHlsaW5lID0gZnVuY3Rpb24obm9kZSkge1xuXHRcdFx0dGhpcy5iYXNlID0gc3ZnLkVsZW1lbnQuUGF0aEVsZW1lbnRCYXNlO1xuXHRcdFx0dGhpcy5iYXNlKG5vZGUpO1xuXHRcdFx0XG5cdFx0XHR0aGlzLnBvaW50cyA9IHN2Zy5DcmVhdGVQYXRoKHRoaXMuYXR0cmlidXRlKCdwb2ludHMnKS52YWx1ZSk7XG5cdFx0XHR0aGlzLnBhdGggPSBmdW5jdGlvbihjdHgpIHtcblx0XHRcdFx0dmFyIGJiID0gbmV3IHN2Zy5Cb3VuZGluZ0JveCh0aGlzLnBvaW50c1swXS54LCB0aGlzLnBvaW50c1swXS55KTtcblx0XHRcdFx0aWYgKGN0eCAhPSBudWxsKSB7XG5cdFx0XHRcdFx0Y3R4LmJlZ2luUGF0aCgpO1xuXHRcdFx0XHRcdGN0eC5tb3ZlVG8odGhpcy5wb2ludHNbMF0ueCwgdGhpcy5wb2ludHNbMF0ueSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0Zm9yICh2YXIgaT0xOyBpPHRoaXMucG9pbnRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0YmIuYWRkUG9pbnQodGhpcy5wb2ludHNbaV0ueCwgdGhpcy5wb2ludHNbaV0ueSk7XG5cdFx0XHRcdFx0aWYgKGN0eCAhPSBudWxsKSBjdHgubGluZVRvKHRoaXMucG9pbnRzW2ldLngsIHRoaXMucG9pbnRzW2ldLnkpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBiYjtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0dGhpcy5nZXRNYXJrZXJzID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHZhciBtYXJrZXJzID0gW107XG5cdFx0XHRcdGZvciAodmFyIGk9MDsgaTx0aGlzLnBvaW50cy5sZW5ndGggLSAxOyBpKyspIHtcblx0XHRcdFx0XHRtYXJrZXJzLnB1c2goW3RoaXMucG9pbnRzW2ldLCB0aGlzLnBvaW50c1tpXS5hbmdsZVRvKHRoaXMucG9pbnRzW2krMV0pXSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0bWFya2Vycy5wdXNoKFt0aGlzLnBvaW50c1t0aGlzLnBvaW50cy5sZW5ndGgtMV0sIG1hcmtlcnNbbWFya2Vycy5sZW5ndGgtMV1bMV1dKTtcblx0XHRcdFx0cmV0dXJuIG1hcmtlcnM7XG5cdFx0XHR9XHRcdFx0XG5cdFx0fVxuXHRcdHN2Zy5FbGVtZW50LnBvbHlsaW5lLnByb3RvdHlwZSA9IG5ldyBzdmcuRWxlbWVudC5QYXRoRWxlbWVudEJhc2U7XHRcdFx0XHRcblx0XHRcdFx0XG5cdFx0Ly8gcG9seWdvbiBlbGVtZW50XG5cdFx0c3ZnLkVsZW1lbnQucG9seWdvbiA9IGZ1bmN0aW9uKG5vZGUpIHtcblx0XHRcdHRoaXMuYmFzZSA9IHN2Zy5FbGVtZW50LnBvbHlsaW5lO1xuXHRcdFx0dGhpcy5iYXNlKG5vZGUpO1xuXHRcdFx0XG5cdFx0XHR0aGlzLmJhc2VQYXRoID0gdGhpcy5wYXRoO1xuXHRcdFx0dGhpcy5wYXRoID0gZnVuY3Rpb24oY3R4KSB7XG5cdFx0XHRcdHZhciBiYiA9IHRoaXMuYmFzZVBhdGgoY3R4KTtcblx0XHRcdFx0aWYgKGN0eCAhPSBudWxsKSB7XG5cdFx0XHRcdFx0Y3R4LmxpbmVUbyh0aGlzLnBvaW50c1swXS54LCB0aGlzLnBvaW50c1swXS55KTtcblx0XHRcdFx0XHRjdHguY2xvc2VQYXRoKCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIGJiO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRzdmcuRWxlbWVudC5wb2x5Z29uLnByb3RvdHlwZSA9IG5ldyBzdmcuRWxlbWVudC5wb2x5bGluZTtcblxuXHRcdC8vIHBhdGggZWxlbWVudFxuXHRcdHN2Zy5FbGVtZW50LnBhdGggPSBmdW5jdGlvbihub2RlKSB7XG5cdFx0XHR0aGlzLmJhc2UgPSBzdmcuRWxlbWVudC5QYXRoRWxlbWVudEJhc2U7XG5cdFx0XHR0aGlzLmJhc2Uobm9kZSk7XG5cdFx0XHRcdFx0XG5cdFx0XHR2YXIgZCA9IHRoaXMuYXR0cmlidXRlKCdkJykudmFsdWU7XG5cdFx0XHQvLyBUT0RPOiBjb252ZXJ0IHRvIHJlYWwgbGV4ZXIgYmFzZWQgb24gaHR0cDovL3d3dy53My5vcmcvVFIvU1ZHMTEvcGF0aHMuaHRtbCNQYXRoRGF0YUJORlxuXHRcdFx0ZCA9IGQucmVwbGFjZSgvLC9nbSwnICcpOyAvLyBnZXQgcmlkIG9mIGFsbCBjb21tYXNcblx0XHRcdGQgPSBkLnJlcGxhY2UoLyhbTW1aekxsSGhWdkNjU3NRcVR0QWFdKShbTW1aekxsSGhWdkNjU3NRcVR0QWFdKS9nbSwnJDEgJDInKTsgLy8gc2VwYXJhdGUgY29tbWFuZHMgZnJvbSBjb21tYW5kc1xuXHRcdFx0ZCA9IGQucmVwbGFjZSgvKFtNbVp6TGxIaFZ2Q2NTc1FxVHRBYV0pKFtNbVp6TGxIaFZ2Q2NTc1FxVHRBYV0pL2dtLCckMSAkMicpOyAvLyBzZXBhcmF0ZSBjb21tYW5kcyBmcm9tIGNvbW1hbmRzXG5cdFx0XHRkID0gZC5yZXBsYWNlKC8oW01tWnpMbEhoVnZDY1NzUXFUdEFhXSkoW15cXHNdKS9nbSwnJDEgJDInKTsgLy8gc2VwYXJhdGUgY29tbWFuZHMgZnJvbSBwb2ludHNcblx0XHRcdGQgPSBkLnJlcGxhY2UoLyhbXlxcc10pKFtNbVp6TGxIaFZ2Q2NTc1FxVHRBYV0pL2dtLCckMSAkMicpOyAvLyBzZXBhcmF0ZSBjb21tYW5kcyBmcm9tIHBvaW50c1xuXHRcdFx0ZCA9IGQucmVwbGFjZSgvKFswLTldKShbK1xcLV0pL2dtLCckMSAkMicpOyAvLyBzZXBhcmF0ZSBkaWdpdHMgd2hlbiBubyBjb21tYVxuXHRcdFx0ZCA9IGQucmVwbGFjZSgvKFxcLlswLTldKikoXFwuKS9nbSwnJDEgJDInKTsgLy8gc2VwYXJhdGUgZGlnaXRzIHdoZW4gbm8gY29tbWFcblx0XHRcdGQgPSBkLnJlcGxhY2UoLyhbQWFdKFxccytbMC05XSspezN9KVxccysoWzAxXSlcXHMqKFswMV0pL2dtLCckMSAkMyAkNCAnKTsgLy8gc2hvcnRoYW5kIGVsbGlwdGljYWwgYXJjIHBhdGggc3ludGF4XG5cdFx0XHRkID0gc3ZnLmNvbXByZXNzU3BhY2VzKGQpOyAvLyBjb21wcmVzcyBtdWx0aXBsZSBzcGFjZXNcblx0XHRcdGQgPSBzdmcudHJpbShkKTtcblx0XHRcdHRoaXMuUGF0aFBhcnNlciA9IG5ldyAoZnVuY3Rpb24oZCkge1xuXHRcdFx0XHR0aGlzLnRva2VucyA9IGQuc3BsaXQoJyAnKTtcblx0XHRcdFx0XG5cdFx0XHRcdHRoaXMucmVzZXQgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHR0aGlzLmkgPSAtMTtcblx0XHRcdFx0XHR0aGlzLmNvbW1hbmQgPSAnJztcblx0XHRcdFx0XHR0aGlzLnByZXZpb3VzQ29tbWFuZCA9ICcnO1xuXHRcdFx0XHRcdHRoaXMuc3RhcnQgPSBuZXcgc3ZnLlBvaW50KDAsIDApO1xuXHRcdFx0XHRcdHRoaXMuY29udHJvbCA9IG5ldyBzdmcuUG9pbnQoMCwgMCk7XG5cdFx0XHRcdFx0dGhpcy5jdXJyZW50ID0gbmV3IHN2Zy5Qb2ludCgwLCAwKTtcblx0XHRcdFx0XHR0aGlzLnBvaW50cyA9IFtdO1xuXHRcdFx0XHRcdHRoaXMuYW5nbGVzID0gW107XG5cdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRcblx0XHRcdFx0dGhpcy5pc0VuZCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLmkgPj0gdGhpcy50b2tlbnMubGVuZ3RoIC0gMTtcblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdFx0dGhpcy5pc0NvbW1hbmRPckVuZCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdGlmICh0aGlzLmlzRW5kKCkpIHJldHVybiB0cnVlO1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLnRva2Vuc1t0aGlzLmkgKyAxXS5tYXRjaCgvXltBLVphLXpdJC8pICE9IG51bGw7XG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHRcdHRoaXMuaXNSZWxhdGl2ZUNvbW1hbmQgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5jb21tYW5kID09IHRoaXMuY29tbWFuZC50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFxuXHRcdFx0XHR0aGlzLmdldFRva2VuID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0dGhpcy5pID0gdGhpcy5pICsgMTtcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy50b2tlbnNbdGhpcy5pXTtcblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdFx0dGhpcy5nZXRTY2FsYXIgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRyZXR1cm4gcGFyc2VGbG9hdCh0aGlzLmdldFRva2VuKCkpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0XHR0aGlzLm5leHRDb21tYW5kID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0dGhpcy5wcmV2aW91c0NvbW1hbmQgPSB0aGlzLmNvbW1hbmQ7XG5cdFx0XHRcdFx0dGhpcy5jb21tYW5kID0gdGhpcy5nZXRUb2tlbigpO1xuXHRcdFx0XHR9XHRcdFx0XHRcblx0XHRcdFx0XG5cdFx0XHRcdHRoaXMuZ2V0UG9pbnQgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHR2YXIgcCA9IG5ldyBzdmcuUG9pbnQodGhpcy5nZXRTY2FsYXIoKSwgdGhpcy5nZXRTY2FsYXIoKSk7XG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMubWFrZUFic29sdXRlKHApO1xuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0XHR0aGlzLmdldEFzQ29udHJvbFBvaW50ID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0dmFyIHAgPSB0aGlzLmdldFBvaW50KCk7XG5cdFx0XHRcdFx0dGhpcy5jb250cm9sID0gcDtcblx0XHRcdFx0XHRyZXR1cm4gcDtcblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdFx0dGhpcy5nZXRBc0N1cnJlbnRQb2ludCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHZhciBwID0gdGhpcy5nZXRQb2ludCgpO1xuXHRcdFx0XHRcdHRoaXMuY3VycmVudCA9IHA7XG5cdFx0XHRcdFx0cmV0dXJuIHA7XHRcblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdFx0dGhpcy5nZXRSZWZsZWN0ZWRDb250cm9sUG9pbnQgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRpZiAodGhpcy5wcmV2aW91c0NvbW1hbmQudG9Mb3dlckNhc2UoKSAhPSAnYycgJiYgdGhpcy5wcmV2aW91c0NvbW1hbmQudG9Mb3dlckNhc2UoKSAhPSAncycpIHtcblx0XHRcdFx0XHRcdHJldHVybiB0aGlzLmN1cnJlbnQ7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdC8vIHJlZmxlY3QgcG9pbnRcblx0XHRcdFx0XHR2YXIgcCA9IG5ldyBzdmcuUG9pbnQoMiAqIHRoaXMuY3VycmVudC54IC0gdGhpcy5jb250cm9sLngsIDIgKiB0aGlzLmN1cnJlbnQueSAtIHRoaXMuY29udHJvbC55KTtcdFx0XHRcdFx0XG5cdFx0XHRcdFx0cmV0dXJuIHA7XG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHRcdHRoaXMubWFrZUFic29sdXRlID0gZnVuY3Rpb24ocCkge1xuXHRcdFx0XHRcdGlmICh0aGlzLmlzUmVsYXRpdmVDb21tYW5kKCkpIHtcblx0XHRcdFx0XHRcdHAueCA9IHRoaXMuY3VycmVudC54ICsgcC54O1xuXHRcdFx0XHRcdFx0cC55ID0gdGhpcy5jdXJyZW50LnkgKyBwLnk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHJldHVybiBwO1xuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0XHR0aGlzLmFkZE1hcmtlciA9IGZ1bmN0aW9uKHAsIGZyb20sIHByaW9yVG8pIHtcblx0XHRcdFx0XHQvLyBpZiB0aGUgbGFzdCBhbmdsZSBpc24ndCBmaWxsZWQgaW4gYmVjYXVzZSB3ZSBkaWRuJ3QgaGF2ZSB0aGlzIHBvaW50IHlldCAuLi5cblx0XHRcdFx0XHRpZiAocHJpb3JUbyAhPSBudWxsICYmIHRoaXMuYW5nbGVzLmxlbmd0aCA+IDAgJiYgdGhpcy5hbmdsZXNbdGhpcy5hbmdsZXMubGVuZ3RoLTFdID09IG51bGwpIHtcblx0XHRcdFx0XHRcdHRoaXMuYW5nbGVzW3RoaXMuYW5nbGVzLmxlbmd0aC0xXSA9IHRoaXMucG9pbnRzW3RoaXMucG9pbnRzLmxlbmd0aC0xXS5hbmdsZVRvKHByaW9yVG8pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHR0aGlzLmFkZE1hcmtlckFuZ2xlKHAsIGZyb20gPT0gbnVsbCA/IG51bGwgOiBmcm9tLmFuZ2xlVG8ocCkpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0XHR0aGlzLmFkZE1hcmtlckFuZ2xlID0gZnVuY3Rpb24ocCwgYSkge1xuXHRcdFx0XHRcdHRoaXMucG9pbnRzLnB1c2gocCk7XG5cdFx0XHRcdFx0dGhpcy5hbmdsZXMucHVzaChhKTtcblx0XHRcdFx0fVx0XHRcdFx0XG5cdFx0XHRcdFxuXHRcdFx0XHR0aGlzLmdldE1hcmtlclBvaW50cyA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5wb2ludHM7IH1cblx0XHRcdFx0dGhpcy5nZXRNYXJrZXJBbmdsZXMgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRmb3IgKHZhciBpPTA7IGk8dGhpcy5hbmdsZXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRcdGlmICh0aGlzLmFuZ2xlc1tpXSA9PSBudWxsKSB7XG5cdFx0XHRcdFx0XHRcdGZvciAodmFyIGo9aSsxOyBqPHRoaXMuYW5nbGVzLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdFx0XHRcdFx0aWYgKHRoaXMuYW5nbGVzW2pdICE9IG51bGwpIHtcblx0XHRcdFx0XHRcdFx0XHRcdHRoaXMuYW5nbGVzW2ldID0gdGhpcy5hbmdsZXNbal07XG5cdFx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuYW5nbGVzO1xuXHRcdFx0XHR9XG5cdFx0XHR9KShkKTtcblxuXHRcdFx0dGhpcy5wYXRoID0gZnVuY3Rpb24oY3R4KSB7XG5cdFx0XHRcdHZhciBwcCA9IHRoaXMuUGF0aFBhcnNlcjtcblx0XHRcdFx0cHAucmVzZXQoKTtcblxuXHRcdFx0XHR2YXIgYmIgPSBuZXcgc3ZnLkJvdW5kaW5nQm94KCk7XG5cdFx0XHRcdGlmIChjdHggIT0gbnVsbCkgY3R4LmJlZ2luUGF0aCgpO1xuXHRcdFx0XHR3aGlsZSAoIXBwLmlzRW5kKCkpIHtcblx0XHRcdFx0XHRwcC5uZXh0Q29tbWFuZCgpO1xuXHRcdFx0XHRcdHN3aXRjaCAocHAuY29tbWFuZC50b1VwcGVyQ2FzZSgpKSB7XG5cdFx0XHRcdFx0Y2FzZSAnTSc6XG5cdFx0XHRcdFx0XHR2YXIgcCA9IHBwLmdldEFzQ3VycmVudFBvaW50KCk7XG5cdFx0XHRcdFx0XHRwcC5hZGRNYXJrZXIocCk7XG5cdFx0XHRcdFx0XHRiYi5hZGRQb2ludChwLngsIHAueSk7XG5cdFx0XHRcdFx0XHRpZiAoY3R4ICE9IG51bGwpIGN0eC5tb3ZlVG8ocC54LCBwLnkpO1xuXHRcdFx0XHRcdFx0cHAuc3RhcnQgPSBwcC5jdXJyZW50O1xuXHRcdFx0XHRcdFx0d2hpbGUgKCFwcC5pc0NvbW1hbmRPckVuZCgpKSB7XG5cdFx0XHRcdFx0XHRcdHZhciBwID0gcHAuZ2V0QXNDdXJyZW50UG9pbnQoKTtcblx0XHRcdFx0XHRcdFx0cHAuYWRkTWFya2VyKHAsIHBwLnN0YXJ0KTtcblx0XHRcdFx0XHRcdFx0YmIuYWRkUG9pbnQocC54LCBwLnkpO1xuXHRcdFx0XHRcdFx0XHRpZiAoY3R4ICE9IG51bGwpIGN0eC5saW5lVG8ocC54LCBwLnkpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0Y2FzZSAnTCc6XG5cdFx0XHRcdFx0XHR3aGlsZSAoIXBwLmlzQ29tbWFuZE9yRW5kKCkpIHtcblx0XHRcdFx0XHRcdFx0dmFyIGMgPSBwcC5jdXJyZW50O1xuXHRcdFx0XHRcdFx0XHR2YXIgcCA9IHBwLmdldEFzQ3VycmVudFBvaW50KCk7XG5cdFx0XHRcdFx0XHRcdHBwLmFkZE1hcmtlcihwLCBjKTtcblx0XHRcdFx0XHRcdFx0YmIuYWRkUG9pbnQocC54LCBwLnkpO1xuXHRcdFx0XHRcdFx0XHRpZiAoY3R4ICE9IG51bGwpIGN0eC5saW5lVG8ocC54LCBwLnkpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0Y2FzZSAnSCc6XG5cdFx0XHRcdFx0XHR3aGlsZSAoIXBwLmlzQ29tbWFuZE9yRW5kKCkpIHtcblx0XHRcdFx0XHRcdFx0dmFyIG5ld1AgPSBuZXcgc3ZnLlBvaW50KChwcC5pc1JlbGF0aXZlQ29tbWFuZCgpID8gcHAuY3VycmVudC54IDogMCkgKyBwcC5nZXRTY2FsYXIoKSwgcHAuY3VycmVudC55KTtcblx0XHRcdFx0XHRcdFx0cHAuYWRkTWFya2VyKG5ld1AsIHBwLmN1cnJlbnQpO1xuXHRcdFx0XHRcdFx0XHRwcC5jdXJyZW50ID0gbmV3UDtcblx0XHRcdFx0XHRcdFx0YmIuYWRkUG9pbnQocHAuY3VycmVudC54LCBwcC5jdXJyZW50LnkpO1xuXHRcdFx0XHRcdFx0XHRpZiAoY3R4ICE9IG51bGwpIGN0eC5saW5lVG8ocHAuY3VycmVudC54LCBwcC5jdXJyZW50LnkpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0Y2FzZSAnVic6XG5cdFx0XHRcdFx0XHR3aGlsZSAoIXBwLmlzQ29tbWFuZE9yRW5kKCkpIHtcblx0XHRcdFx0XHRcdFx0dmFyIG5ld1AgPSBuZXcgc3ZnLlBvaW50KHBwLmN1cnJlbnQueCwgKHBwLmlzUmVsYXRpdmVDb21tYW5kKCkgPyBwcC5jdXJyZW50LnkgOiAwKSArIHBwLmdldFNjYWxhcigpKTtcblx0XHRcdFx0XHRcdFx0cHAuYWRkTWFya2VyKG5ld1AsIHBwLmN1cnJlbnQpO1xuXHRcdFx0XHRcdFx0XHRwcC5jdXJyZW50ID0gbmV3UDtcblx0XHRcdFx0XHRcdFx0YmIuYWRkUG9pbnQocHAuY3VycmVudC54LCBwcC5jdXJyZW50LnkpO1xuXHRcdFx0XHRcdFx0XHRpZiAoY3R4ICE9IG51bGwpIGN0eC5saW5lVG8ocHAuY3VycmVudC54LCBwcC5jdXJyZW50LnkpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0Y2FzZSAnQyc6XG5cdFx0XHRcdFx0XHR3aGlsZSAoIXBwLmlzQ29tbWFuZE9yRW5kKCkpIHtcblx0XHRcdFx0XHRcdFx0dmFyIGN1cnIgPSBwcC5jdXJyZW50O1xuXHRcdFx0XHRcdFx0XHR2YXIgcDEgPSBwcC5nZXRQb2ludCgpO1xuXHRcdFx0XHRcdFx0XHR2YXIgY250cmwgPSBwcC5nZXRBc0NvbnRyb2xQb2ludCgpO1xuXHRcdFx0XHRcdFx0XHR2YXIgY3AgPSBwcC5nZXRBc0N1cnJlbnRQb2ludCgpO1xuXHRcdFx0XHRcdFx0XHRwcC5hZGRNYXJrZXIoY3AsIGNudHJsLCBwMSk7XG5cdFx0XHRcdFx0XHRcdGJiLmFkZEJlemllckN1cnZlKGN1cnIueCwgY3Vyci55LCBwMS54LCBwMS55LCBjbnRybC54LCBjbnRybC55LCBjcC54LCBjcC55KTtcblx0XHRcdFx0XHRcdFx0aWYgKGN0eCAhPSBudWxsKSBjdHguYmV6aWVyQ3VydmVUbyhwMS54LCBwMS55LCBjbnRybC54LCBjbnRybC55LCBjcC54LCBjcC55KTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdGNhc2UgJ1MnOlxuXHRcdFx0XHRcdFx0d2hpbGUgKCFwcC5pc0NvbW1hbmRPckVuZCgpKSB7XG5cdFx0XHRcdFx0XHRcdHZhciBjdXJyID0gcHAuY3VycmVudDtcblx0XHRcdFx0XHRcdFx0dmFyIHAxID0gcHAuZ2V0UmVmbGVjdGVkQ29udHJvbFBvaW50KCk7XG5cdFx0XHRcdFx0XHRcdHZhciBjbnRybCA9IHBwLmdldEFzQ29udHJvbFBvaW50KCk7XG5cdFx0XHRcdFx0XHRcdHZhciBjcCA9IHBwLmdldEFzQ3VycmVudFBvaW50KCk7XG5cdFx0XHRcdFx0XHRcdHBwLmFkZE1hcmtlcihjcCwgY250cmwsIHAxKTtcblx0XHRcdFx0XHRcdFx0YmIuYWRkQmV6aWVyQ3VydmUoY3Vyci54LCBjdXJyLnksIHAxLngsIHAxLnksIGNudHJsLngsIGNudHJsLnksIGNwLngsIGNwLnkpO1xuXHRcdFx0XHRcdFx0XHRpZiAoY3R4ICE9IG51bGwpIGN0eC5iZXppZXJDdXJ2ZVRvKHAxLngsIHAxLnksIGNudHJsLngsIGNudHJsLnksIGNwLngsIGNwLnkpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0Y2FzZSAnUSc6XG5cdFx0XHRcdFx0XHR3aGlsZSAoIXBwLmlzQ29tbWFuZE9yRW5kKCkpIHtcblx0XHRcdFx0XHRcdFx0dmFyIGN1cnIgPSBwcC5jdXJyZW50O1xuXHRcdFx0XHRcdFx0XHR2YXIgY250cmwgPSBwcC5nZXRBc0NvbnRyb2xQb2ludCgpO1xuXHRcdFx0XHRcdFx0XHR2YXIgY3AgPSBwcC5nZXRBc0N1cnJlbnRQb2ludCgpO1xuXHRcdFx0XHRcdFx0XHRwcC5hZGRNYXJrZXIoY3AsIGNudHJsLCBjbnRybCk7XG5cdFx0XHRcdFx0XHRcdGJiLmFkZFF1YWRyYXRpY0N1cnZlKGN1cnIueCwgY3Vyci55LCBjbnRybC54LCBjbnRybC55LCBjcC54LCBjcC55KTtcblx0XHRcdFx0XHRcdFx0aWYgKGN0eCAhPSBudWxsKSBjdHgucXVhZHJhdGljQ3VydmVUbyhjbnRybC54LCBjbnRybC55LCBjcC54LCBjcC55KTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdGNhc2UgJ1QnOlxuXHRcdFx0XHRcdFx0d2hpbGUgKCFwcC5pc0NvbW1hbmRPckVuZCgpKSB7XG5cdFx0XHRcdFx0XHRcdHZhciBjdXJyID0gcHAuY3VycmVudDtcblx0XHRcdFx0XHRcdFx0dmFyIGNudHJsID0gcHAuZ2V0UmVmbGVjdGVkQ29udHJvbFBvaW50KCk7XG5cdFx0XHRcdFx0XHRcdHBwLmNvbnRyb2wgPSBjbnRybDtcblx0XHRcdFx0XHRcdFx0dmFyIGNwID0gcHAuZ2V0QXNDdXJyZW50UG9pbnQoKTtcblx0XHRcdFx0XHRcdFx0cHAuYWRkTWFya2VyKGNwLCBjbnRybCwgY250cmwpO1xuXHRcdFx0XHRcdFx0XHRiYi5hZGRRdWFkcmF0aWNDdXJ2ZShjdXJyLngsIGN1cnIueSwgY250cmwueCwgY250cmwueSwgY3AueCwgY3AueSk7XG5cdFx0XHRcdFx0XHRcdGlmIChjdHggIT0gbnVsbCkgY3R4LnF1YWRyYXRpY0N1cnZlVG8oY250cmwueCwgY250cmwueSwgY3AueCwgY3AueSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRjYXNlICdBJzpcblx0XHRcdFx0XHRcdHdoaWxlICghcHAuaXNDb21tYW5kT3JFbmQoKSkge1xuXHRcdFx0XHRcdFx0ICAgIHZhciBjdXJyID0gcHAuY3VycmVudDtcblx0XHRcdFx0XHRcdFx0dmFyIHJ4ID0gcHAuZ2V0U2NhbGFyKCk7XG5cdFx0XHRcdFx0XHRcdHZhciByeSA9IHBwLmdldFNjYWxhcigpO1xuXHRcdFx0XHRcdFx0XHR2YXIgeEF4aXNSb3RhdGlvbiA9IHBwLmdldFNjYWxhcigpICogKE1hdGguUEkgLyAxODAuMCk7XG5cdFx0XHRcdFx0XHRcdHZhciBsYXJnZUFyY0ZsYWcgPSBwcC5nZXRTY2FsYXIoKTtcblx0XHRcdFx0XHRcdFx0dmFyIHN3ZWVwRmxhZyA9IHBwLmdldFNjYWxhcigpO1xuXHRcdFx0XHRcdFx0XHR2YXIgY3AgPSBwcC5nZXRBc0N1cnJlbnRQb2ludCgpO1xuXG5cdFx0XHRcdFx0XHRcdC8vIENvbnZlcnNpb24gZnJvbSBlbmRwb2ludCB0byBjZW50ZXIgcGFyYW1ldGVyaXphdGlvblxuXHRcdFx0XHRcdFx0XHQvLyBodHRwOi8vd3d3LnczLm9yZy9UUi9TVkcxMS9pbXBsbm90ZS5odG1sI0FyY0ltcGxlbWVudGF0aW9uTm90ZXNcblx0XHRcdFx0XHRcdFx0Ly8geDEnLCB5MSdcblx0XHRcdFx0XHRcdFx0dmFyIGN1cnJwID0gbmV3IHN2Zy5Qb2ludChcblx0XHRcdFx0XHRcdFx0XHRNYXRoLmNvcyh4QXhpc1JvdGF0aW9uKSAqIChjdXJyLnggLSBjcC54KSAvIDIuMCArIE1hdGguc2luKHhBeGlzUm90YXRpb24pICogKGN1cnIueSAtIGNwLnkpIC8gMi4wLFxuXHRcdFx0XHRcdFx0XHRcdC1NYXRoLnNpbih4QXhpc1JvdGF0aW9uKSAqIChjdXJyLnggLSBjcC54KSAvIDIuMCArIE1hdGguY29zKHhBeGlzUm90YXRpb24pICogKGN1cnIueSAtIGNwLnkpIC8gMi4wXG5cdFx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0XHRcdC8vIGFkanVzdCByYWRpaVxuXHRcdFx0XHRcdFx0XHR2YXIgbCA9IE1hdGgucG93KGN1cnJwLngsMikvTWF0aC5wb3cocngsMikrTWF0aC5wb3coY3VycnAueSwyKS9NYXRoLnBvdyhyeSwyKTtcblx0XHRcdFx0XHRcdFx0aWYgKGwgPiAxKSB7XG5cdFx0XHRcdFx0XHRcdFx0cnggKj0gTWF0aC5zcXJ0KGwpO1xuXHRcdFx0XHRcdFx0XHRcdHJ5ICo9IE1hdGguc3FydChsKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHQvLyBjeCcsIGN5J1xuXHRcdFx0XHRcdFx0XHR2YXIgcyA9IChsYXJnZUFyY0ZsYWcgPT0gc3dlZXBGbGFnID8gLTEgOiAxKSAqIE1hdGguc3FydChcblx0XHRcdFx0XHRcdFx0XHQoKE1hdGgucG93KHJ4LDIpKk1hdGgucG93KHJ5LDIpKS0oTWF0aC5wb3cocngsMikqTWF0aC5wb3coY3VycnAueSwyKSktKE1hdGgucG93KHJ5LDIpKk1hdGgucG93KGN1cnJwLngsMikpKSAvXG5cdFx0XHRcdFx0XHRcdFx0KE1hdGgucG93KHJ4LDIpKk1hdGgucG93KGN1cnJwLnksMikrTWF0aC5wb3cocnksMikqTWF0aC5wb3coY3VycnAueCwyKSlcblx0XHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRcdFx0aWYgKGlzTmFOKHMpKSBzID0gMDtcblx0XHRcdFx0XHRcdFx0dmFyIGNwcCA9IG5ldyBzdmcuUG9pbnQocyAqIHJ4ICogY3VycnAueSAvIHJ5LCBzICogLXJ5ICogY3VycnAueCAvIHJ4KTtcblx0XHRcdFx0XHRcdFx0Ly8gY3gsIGN5XG5cdFx0XHRcdFx0XHRcdHZhciBjZW50cCA9IG5ldyBzdmcuUG9pbnQoXG5cdFx0XHRcdFx0XHRcdFx0KGN1cnIueCArIGNwLngpIC8gMi4wICsgTWF0aC5jb3MoeEF4aXNSb3RhdGlvbikgKiBjcHAueCAtIE1hdGguc2luKHhBeGlzUm90YXRpb24pICogY3BwLnksXG5cdFx0XHRcdFx0XHRcdFx0KGN1cnIueSArIGNwLnkpIC8gMi4wICsgTWF0aC5zaW4oeEF4aXNSb3RhdGlvbikgKiBjcHAueCArIE1hdGguY29zKHhBeGlzUm90YXRpb24pICogY3BwLnlcblx0XHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRcdFx0Ly8gdmVjdG9yIG1hZ25pdHVkZVxuXHRcdFx0XHRcdFx0XHR2YXIgbSA9IGZ1bmN0aW9uKHYpIHsgcmV0dXJuIE1hdGguc3FydChNYXRoLnBvdyh2WzBdLDIpICsgTWF0aC5wb3codlsxXSwyKSk7IH1cblx0XHRcdFx0XHRcdFx0Ly8gcmF0aW8gYmV0d2VlbiB0d28gdmVjdG9yc1xuXHRcdFx0XHRcdFx0XHR2YXIgciA9IGZ1bmN0aW9uKHUsIHYpIHsgcmV0dXJuICh1WzBdKnZbMF0rdVsxXSp2WzFdKSAvIChtKHUpKm0odikpIH1cblx0XHRcdFx0XHRcdFx0Ly8gYW5nbGUgYmV0d2VlbiB0d28gdmVjdG9yc1xuXHRcdFx0XHRcdFx0XHR2YXIgYSA9IGZ1bmN0aW9uKHUsIHYpIHsgcmV0dXJuICh1WzBdKnZbMV0gPCB1WzFdKnZbMF0gPyAtMSA6IDEpICogTWF0aC5hY29zKHIodSx2KSk7IH1cblx0XHRcdFx0XHRcdFx0Ly8gaW5pdGlhbCBhbmdsZVxuXHRcdFx0XHRcdFx0XHR2YXIgYTEgPSBhKFsxLDBdLCBbKGN1cnJwLngtY3BwLngpL3J4LChjdXJycC55LWNwcC55KS9yeV0pO1xuXHRcdFx0XHRcdFx0XHQvLyBhbmdsZSBkZWx0YVxuXHRcdFx0XHRcdFx0XHR2YXIgdSA9IFsoY3VycnAueC1jcHAueCkvcngsKGN1cnJwLnktY3BwLnkpL3J5XTtcblx0XHRcdFx0XHRcdFx0dmFyIHYgPSBbKC1jdXJycC54LWNwcC54KS9yeCwoLWN1cnJwLnktY3BwLnkpL3J5XTtcblx0XHRcdFx0XHRcdFx0dmFyIGFkID0gYSh1LCB2KTtcblx0XHRcdFx0XHRcdFx0aWYgKHIodSx2KSA8PSAtMSkgYWQgPSBNYXRoLlBJO1xuXHRcdFx0XHRcdFx0XHRpZiAocih1LHYpID49IDEpIGFkID0gMDtcblxuXHRcdFx0XHRcdFx0XHRpZiAoc3dlZXBGbGFnID09IDAgJiYgYWQgPiAwKSBhZCA9IGFkIC0gMiAqIE1hdGguUEk7XG5cdFx0XHRcdFx0XHRcdGlmIChzd2VlcEZsYWcgPT0gMSAmJiBhZCA8IDApIGFkID0gYWQgKyAyICogTWF0aC5QSTtcblxuXHRcdFx0XHRcdFx0XHQvLyBmb3IgbWFya2Vyc1xuXHRcdFx0XHRcdFx0XHR2YXIgaGFsZldheSA9IG5ldyBzdmcuUG9pbnQoXG5cdFx0XHRcdFx0XHRcdFx0Y2VudHAueCAtIHJ4ICogTWF0aC5jb3MoKGExICsgYWQpIC8gMiksXG5cdFx0XHRcdFx0XHRcdFx0Y2VudHAueSAtIHJ5ICogTWF0aC5zaW4oKGExICsgYWQpIC8gMilcblx0XHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRcdFx0cHAuYWRkTWFya2VyQW5nbGUoaGFsZldheSwgKGExICsgYWQpIC8gMiArIChzd2VlcEZsYWcgPT0gMCA/IDEgOiAtMSkgKiBNYXRoLlBJIC8gMik7XG5cdFx0XHRcdFx0XHRcdHBwLmFkZE1hcmtlckFuZ2xlKGNwLCBhZCArIChzd2VlcEZsYWcgPT0gMCA/IDEgOiAtMSkgKiBNYXRoLlBJIC8gMik7XG5cblx0XHRcdFx0XHRcdFx0YmIuYWRkUG9pbnQoY3AueCwgY3AueSk7IC8vIFRPRE86IHRoaXMgaXMgdG9vIG5haXZlLCBtYWtlIGl0IGJldHRlclxuXHRcdFx0XHRcdFx0XHRpZiAoY3R4ICE9IG51bGwpIHtcblx0XHRcdFx0XHRcdFx0XHR2YXIgciA9IHJ4ID4gcnkgPyByeCA6IHJ5O1xuXHRcdFx0XHRcdFx0XHRcdHZhciBzeCA9IHJ4ID4gcnkgPyAxIDogcnggLyByeTtcblx0XHRcdFx0XHRcdFx0XHR2YXIgc3kgPSByeCA+IHJ5ID8gcnkgLyByeCA6IDE7XG5cblx0XHRcdFx0XHRcdFx0XHRjdHgudHJhbnNsYXRlKGNlbnRwLngsIGNlbnRwLnkpO1xuXHRcdFx0XHRcdFx0XHRcdGN0eC5yb3RhdGUoeEF4aXNSb3RhdGlvbik7XG5cdFx0XHRcdFx0XHRcdFx0Y3R4LnNjYWxlKHN4LCBzeSk7XG5cdFx0XHRcdFx0XHRcdFx0Y3R4LmFyYygwLCAwLCByLCBhMSwgYTEgKyBhZCwgMSAtIHN3ZWVwRmxhZyk7XG5cdFx0XHRcdFx0XHRcdFx0Y3R4LnNjYWxlKDEvc3gsIDEvc3kpO1xuXHRcdFx0XHRcdFx0XHRcdGN0eC5yb3RhdGUoLXhBeGlzUm90YXRpb24pO1xuXHRcdFx0XHRcdFx0XHRcdGN0eC50cmFuc2xhdGUoLWNlbnRwLngsIC1jZW50cC55KTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0Y2FzZSAnWic6XG5cdFx0XHRcdFx0XHRpZiAoY3R4ICE9IG51bGwpIGN0eC5jbG9zZVBhdGgoKTtcblx0XHRcdFx0XHRcdHBwLmN1cnJlbnQgPSBwcC5zdGFydDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gYmI7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMuZ2V0TWFya2VycyA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR2YXIgcG9pbnRzID0gdGhpcy5QYXRoUGFyc2VyLmdldE1hcmtlclBvaW50cygpO1xuXHRcdFx0XHR2YXIgYW5nbGVzID0gdGhpcy5QYXRoUGFyc2VyLmdldE1hcmtlckFuZ2xlcygpO1xuXHRcdFx0XHRcblx0XHRcdFx0dmFyIG1hcmtlcnMgPSBbXTtcblx0XHRcdFx0Zm9yICh2YXIgaT0wOyBpPHBvaW50cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdG1hcmtlcnMucHVzaChbcG9pbnRzW2ldLCBhbmdsZXNbaV1dKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gbWFya2Vycztcblx0XHRcdH1cblx0XHR9XG5cdFx0c3ZnLkVsZW1lbnQucGF0aC5wcm90b3R5cGUgPSBuZXcgc3ZnLkVsZW1lbnQuUGF0aEVsZW1lbnRCYXNlO1xuXHRcdFxuXHRcdC8vIHBhdHRlcm4gZWxlbWVudFxuXHRcdHN2Zy5FbGVtZW50LnBhdHRlcm4gPSBmdW5jdGlvbihub2RlKSB7XG5cdFx0XHR0aGlzLmJhc2UgPSBzdmcuRWxlbWVudC5FbGVtZW50QmFzZTtcblx0XHRcdHRoaXMuYmFzZShub2RlKTtcblx0XHRcdFxuXHRcdFx0dGhpcy5jcmVhdGVQYXR0ZXJuID0gZnVuY3Rpb24oY3R4LCBlbGVtZW50KSB7XG5cdFx0XHRcdC8vIHJlbmRlciBtZSB1c2luZyBhIHRlbXBvcmFyeSBzdmcgZWxlbWVudFxuXHRcdFx0XHR2YXIgdGVtcFN2ZyA9IG5ldyBzdmcuRWxlbWVudC5zdmcoKTtcblx0XHRcdFx0dGVtcFN2Zy5hdHRyaWJ1dGVzWyd2aWV3Qm94J10gPSBuZXcgc3ZnLlByb3BlcnR5KCd2aWV3Qm94JywgdGhpcy5hdHRyaWJ1dGUoJ3ZpZXdCb3gnKS52YWx1ZSk7XG5cdFx0XHRcdHRlbXBTdmcuYXR0cmlidXRlc1sneCddID0gbmV3IHN2Zy5Qcm9wZXJ0eSgneCcsIHRoaXMuYXR0cmlidXRlKCd4JykudmFsdWUpO1xuXHRcdFx0XHR0ZW1wU3ZnLmF0dHJpYnV0ZXNbJ3knXSA9IG5ldyBzdmcuUHJvcGVydHkoJ3knLCB0aGlzLmF0dHJpYnV0ZSgneScpLnZhbHVlKTtcblx0XHRcdFx0dGVtcFN2Zy5hdHRyaWJ1dGVzWyd3aWR0aCddID0gbmV3IHN2Zy5Qcm9wZXJ0eSgnd2lkdGgnLCB0aGlzLmF0dHJpYnV0ZSgnd2lkdGgnKS52YWx1ZSk7XG5cdFx0XHRcdHRlbXBTdmcuYXR0cmlidXRlc1snaGVpZ2h0J10gPSBuZXcgc3ZnLlByb3BlcnR5KCdoZWlnaHQnLCB0aGlzLmF0dHJpYnV0ZSgnaGVpZ2h0JykudmFsdWUpO1xuXHRcdFx0XHR0ZW1wU3ZnLmNoaWxkcmVuID0gdGhpcy5jaGlsZHJlbjtcblx0XHRcdFx0XG5cdFx0XHRcdHZhciBjID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG5cdFx0XHRcdGMud2lkdGggPSB0aGlzLmF0dHJpYnV0ZSgnd2lkdGgnKS5MZW5ndGgudG9QaXhlbHMoJ3gnKTtcblx0XHRcdFx0Yy5oZWlnaHQgPSB0aGlzLmF0dHJpYnV0ZSgnaGVpZ2h0JykuTGVuZ3RoLnRvUGl4ZWxzKCd5Jyk7XG5cdFx0XHRcdHRlbXBTdmcucmVuZGVyKGMuZ2V0Q29udGV4dCgnMmQnKSk7XHRcdFxuXHRcdFx0XHRyZXR1cm4gY3R4LmNyZWF0ZVBhdHRlcm4oYywgJ3JlcGVhdCcpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRzdmcuRWxlbWVudC5wYXR0ZXJuLnByb3RvdHlwZSA9IG5ldyBzdmcuRWxlbWVudC5FbGVtZW50QmFzZTtcblx0XHRcblx0XHQvLyBtYXJrZXIgZWxlbWVudFxuXHRcdHN2Zy5FbGVtZW50Lm1hcmtlciA9IGZ1bmN0aW9uKG5vZGUpIHtcblx0XHRcdHRoaXMuYmFzZSA9IHN2Zy5FbGVtZW50LkVsZW1lbnRCYXNlO1xuXHRcdFx0dGhpcy5iYXNlKG5vZGUpO1xuXHRcdFx0XG5cdFx0XHR0aGlzLmJhc2VSZW5kZXIgPSB0aGlzLnJlbmRlcjtcblx0XHRcdHRoaXMucmVuZGVyID0gZnVuY3Rpb24oY3R4LCBwb2ludCwgYW5nbGUpIHtcblx0XHRcdFx0Y3R4LnRyYW5zbGF0ZShwb2ludC54LCBwb2ludC55KTtcblx0XHRcdFx0aWYgKHRoaXMuYXR0cmlidXRlKCdvcmllbnQnKS52YWx1ZU9yRGVmYXVsdCgnYXV0bycpID09ICdhdXRvJykgY3R4LnJvdGF0ZShhbmdsZSk7XG5cdFx0XHRcdGlmICh0aGlzLmF0dHJpYnV0ZSgnbWFya2VyVW5pdHMnKS52YWx1ZU9yRGVmYXVsdCgnc3Ryb2tlV2lkdGgnKSA9PSAnc3Ryb2tlV2lkdGgnKSBjdHguc2NhbGUoY3R4LmxpbmVXaWR0aCwgY3R4LmxpbmVXaWR0aCk7XG5cdFx0XHRcdGN0eC5zYXZlKCk7XG5cdFx0XHRcdFx0XHRcdFxuXHRcdFx0XHQvLyByZW5kZXIgbWUgdXNpbmcgYSB0ZW1wb3Jhcnkgc3ZnIGVsZW1lbnRcblx0XHRcdFx0dmFyIHRlbXBTdmcgPSBuZXcgc3ZnLkVsZW1lbnQuc3ZnKCk7XG5cdFx0XHRcdHRlbXBTdmcuYXR0cmlidXRlc1sndmlld0JveCddID0gbmV3IHN2Zy5Qcm9wZXJ0eSgndmlld0JveCcsIHRoaXMuYXR0cmlidXRlKCd2aWV3Qm94JykudmFsdWUpO1xuXHRcdFx0XHR0ZW1wU3ZnLmF0dHJpYnV0ZXNbJ3JlZlgnXSA9IG5ldyBzdmcuUHJvcGVydHkoJ3JlZlgnLCB0aGlzLmF0dHJpYnV0ZSgncmVmWCcpLnZhbHVlKTtcblx0XHRcdFx0dGVtcFN2Zy5hdHRyaWJ1dGVzWydyZWZZJ10gPSBuZXcgc3ZnLlByb3BlcnR5KCdyZWZZJywgdGhpcy5hdHRyaWJ1dGUoJ3JlZlknKS52YWx1ZSk7XG5cdFx0XHRcdHRlbXBTdmcuYXR0cmlidXRlc1snd2lkdGgnXSA9IG5ldyBzdmcuUHJvcGVydHkoJ3dpZHRoJywgdGhpcy5hdHRyaWJ1dGUoJ21hcmtlcldpZHRoJykudmFsdWUpO1xuXHRcdFx0XHR0ZW1wU3ZnLmF0dHJpYnV0ZXNbJ2hlaWdodCddID0gbmV3IHN2Zy5Qcm9wZXJ0eSgnaGVpZ2h0JywgdGhpcy5hdHRyaWJ1dGUoJ21hcmtlckhlaWdodCcpLnZhbHVlKTtcblx0XHRcdFx0dGVtcFN2Zy5hdHRyaWJ1dGVzWydmaWxsJ10gPSBuZXcgc3ZnLlByb3BlcnR5KCdmaWxsJywgdGhpcy5hdHRyaWJ1dGUoJ2ZpbGwnKS52YWx1ZU9yRGVmYXVsdCgnYmxhY2snKSk7XG5cdFx0XHRcdHRlbXBTdmcuYXR0cmlidXRlc1snc3Ryb2tlJ10gPSBuZXcgc3ZnLlByb3BlcnR5KCdzdHJva2UnLCB0aGlzLmF0dHJpYnV0ZSgnc3Ryb2tlJykudmFsdWVPckRlZmF1bHQoJ25vbmUnKSk7XG5cdFx0XHRcdHRlbXBTdmcuY2hpbGRyZW4gPSB0aGlzLmNoaWxkcmVuO1xuXHRcdFx0XHR0ZW1wU3ZnLnJlbmRlcihjdHgpO1xuXHRcdFx0XHRcblx0XHRcdFx0Y3R4LnJlc3RvcmUoKTtcblx0XHRcdFx0aWYgKHRoaXMuYXR0cmlidXRlKCdtYXJrZXJVbml0cycpLnZhbHVlT3JEZWZhdWx0KCdzdHJva2VXaWR0aCcpID09ICdzdHJva2VXaWR0aCcpIGN0eC5zY2FsZSgxL2N0eC5saW5lV2lkdGgsIDEvY3R4LmxpbmVXaWR0aCk7XG5cdFx0XHRcdGlmICh0aGlzLmF0dHJpYnV0ZSgnb3JpZW50JykudmFsdWVPckRlZmF1bHQoJ2F1dG8nKSA9PSAnYXV0bycpIGN0eC5yb3RhdGUoLWFuZ2xlKTtcblx0XHRcdFx0Y3R4LnRyYW5zbGF0ZSgtcG9pbnQueCwgLXBvaW50LnkpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRzdmcuRWxlbWVudC5tYXJrZXIucHJvdG90eXBlID0gbmV3IHN2Zy5FbGVtZW50LkVsZW1lbnRCYXNlO1xuXHRcdFxuXHRcdC8vIGRlZmluaXRpb25zIGVsZW1lbnRcblx0XHRzdmcuRWxlbWVudC5kZWZzID0gZnVuY3Rpb24obm9kZSkge1xuXHRcdFx0dGhpcy5iYXNlID0gc3ZnLkVsZW1lbnQuRWxlbWVudEJhc2U7XG5cdFx0XHR0aGlzLmJhc2Uobm9kZSk7XHRcblx0XHRcdFxuXHRcdFx0dGhpcy5yZW5kZXIgPSBmdW5jdGlvbihjdHgpIHtcblx0XHRcdFx0Ly8gTk9PUFxuXHRcdFx0fVxuXHRcdH1cblx0XHRzdmcuRWxlbWVudC5kZWZzLnByb3RvdHlwZSA9IG5ldyBzdmcuRWxlbWVudC5FbGVtZW50QmFzZTtcblx0XHRcblx0XHQvLyBiYXNlIGZvciBncmFkaWVudHNcblx0XHRzdmcuRWxlbWVudC5HcmFkaWVudEJhc2UgPSBmdW5jdGlvbihub2RlKSB7XG5cdFx0XHR0aGlzLmJhc2UgPSBzdmcuRWxlbWVudC5FbGVtZW50QmFzZTtcblx0XHRcdHRoaXMuYmFzZShub2RlKTtcblx0XHRcdFxuXHRcdFx0dGhpcy5ncmFkaWVudFVuaXRzID0gdGhpcy5hdHRyaWJ1dGUoJ2dyYWRpZW50VW5pdHMnKS52YWx1ZU9yRGVmYXVsdCgnb2JqZWN0Qm91bmRpbmdCb3gnKTtcblx0XHRcdFxuXHRcdFx0dGhpcy5zdG9wcyA9IFtdO1x0XHRcdFxuXHRcdFx0Zm9yICh2YXIgaT0wOyBpPHRoaXMuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0dmFyIGNoaWxkID0gdGhpcy5jaGlsZHJlbltpXTtcblx0XHRcdFx0dGhpcy5zdG9wcy5wdXNoKGNoaWxkKTtcblx0XHRcdH1cdFxuXHRcdFx0XG5cdFx0XHR0aGlzLmdldEdyYWRpZW50ID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdC8vIE9WRVJSSURFIE1FIVxuXHRcdFx0fVx0XHRcdFxuXG5cdFx0XHR0aGlzLmNyZWF0ZUdyYWRpZW50ID0gZnVuY3Rpb24oY3R4LCBlbGVtZW50KSB7XG5cdFx0XHRcdHZhciBzdG9wc0NvbnRhaW5lciA9IHRoaXM7XG5cdFx0XHRcdGlmICh0aGlzLmF0dHJpYnV0ZSgneGxpbms6aHJlZicpLmhhc1ZhbHVlKCkpIHtcblx0XHRcdFx0XHRzdG9wc0NvbnRhaW5lciA9IHRoaXMuYXR0cmlidXRlKCd4bGluazpocmVmJykuRGVmaW5pdGlvbi5nZXREZWZpbml0aW9uKCk7XG5cdFx0XHRcdH1cblx0XHRcdFxuXHRcdFx0XHR2YXIgZyA9IHRoaXMuZ2V0R3JhZGllbnQoY3R4LCBlbGVtZW50KTtcblx0XHRcdFx0Zm9yICh2YXIgaT0wOyBpPHN0b3BzQ29udGFpbmVyLnN0b3BzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0Zy5hZGRDb2xvclN0b3Aoc3RvcHNDb250YWluZXIuc3RvcHNbaV0ub2Zmc2V0LCBzdG9wc0NvbnRhaW5lci5zdG9wc1tpXS5jb2xvcik7XG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHRcdGlmICh0aGlzLmF0dHJpYnV0ZSgnZ3JhZGllbnRUcmFuc2Zvcm0nKS5oYXNWYWx1ZSgpKSB7XG5cdFx0XHRcdFx0Ly8gcmVuZGVyIGFzIHRyYW5zZm9ybWVkIHBhdHRlcm4gb24gdGVtcG9yYXJ5IGNhbnZhc1xuXHRcdFx0XHRcdHZhciByb290VmlldyA9IHN2Zy5WaWV3UG9ydC52aWV3UG9ydHNbMF07XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0dmFyIHJlY3QgPSBuZXcgc3ZnLkVsZW1lbnQucmVjdCgpO1xuXHRcdFx0XHRcdHJlY3QuYXR0cmlidXRlc1sneCddID0gbmV3IHN2Zy5Qcm9wZXJ0eSgneCcsIC1zdmcuTUFYX1ZJUlRVQUxfUElYRUxTLzMuMCk7XG5cdFx0XHRcdFx0cmVjdC5hdHRyaWJ1dGVzWyd5J10gPSBuZXcgc3ZnLlByb3BlcnR5KCd5JywgLXN2Zy5NQVhfVklSVFVBTF9QSVhFTFMvMy4wKTtcblx0XHRcdFx0XHRyZWN0LmF0dHJpYnV0ZXNbJ3dpZHRoJ10gPSBuZXcgc3ZnLlByb3BlcnR5KCd3aWR0aCcsIHN2Zy5NQVhfVklSVFVBTF9QSVhFTFMpO1xuXHRcdFx0XHRcdHJlY3QuYXR0cmlidXRlc1snaGVpZ2h0J10gPSBuZXcgc3ZnLlByb3BlcnR5KCdoZWlnaHQnLCBzdmcuTUFYX1ZJUlRVQUxfUElYRUxTKTtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHR2YXIgZ3JvdXAgPSBuZXcgc3ZnLkVsZW1lbnQuZygpO1xuXHRcdFx0XHRcdGdyb3VwLmF0dHJpYnV0ZXNbJ3RyYW5zZm9ybSddID0gbmV3IHN2Zy5Qcm9wZXJ0eSgndHJhbnNmb3JtJywgdGhpcy5hdHRyaWJ1dGUoJ2dyYWRpZW50VHJhbnNmb3JtJykudmFsdWUpO1xuXHRcdFx0XHRcdGdyb3VwLmNoaWxkcmVuID0gWyByZWN0IF07XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0dmFyIHRlbXBTdmcgPSBuZXcgc3ZnLkVsZW1lbnQuc3ZnKCk7XG5cdFx0XHRcdFx0dGVtcFN2Zy5hdHRyaWJ1dGVzWyd4J10gPSBuZXcgc3ZnLlByb3BlcnR5KCd4JywgMCk7XG5cdFx0XHRcdFx0dGVtcFN2Zy5hdHRyaWJ1dGVzWyd5J10gPSBuZXcgc3ZnLlByb3BlcnR5KCd5JywgMCk7XG5cdFx0XHRcdFx0dGVtcFN2Zy5hdHRyaWJ1dGVzWyd3aWR0aCddID0gbmV3IHN2Zy5Qcm9wZXJ0eSgnd2lkdGgnLCByb290Vmlldy53aWR0aCk7XG5cdFx0XHRcdFx0dGVtcFN2Zy5hdHRyaWJ1dGVzWydoZWlnaHQnXSA9IG5ldyBzdmcuUHJvcGVydHkoJ2hlaWdodCcsIHJvb3RWaWV3LmhlaWdodCk7XG5cdFx0XHRcdFx0dGVtcFN2Zy5jaGlsZHJlbiA9IFsgZ3JvdXAgXTtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHR2YXIgYyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuXHRcdFx0XHRcdGMud2lkdGggPSByb290Vmlldy53aWR0aDtcblx0XHRcdFx0XHRjLmhlaWdodCA9IHJvb3RWaWV3LmhlaWdodDtcblx0XHRcdFx0XHR2YXIgdGVtcEN0eCA9IGMuZ2V0Q29udGV4dCgnMmQnKTtcblx0XHRcdFx0XHR0ZW1wQ3R4LmZpbGxTdHlsZSA9IGc7XG5cdFx0XHRcdFx0dGVtcFN2Zy5yZW5kZXIodGVtcEN0eCk7XHRcdFxuXHRcdFx0XHRcdHJldHVybiB0ZW1wQ3R4LmNyZWF0ZVBhdHRlcm4oYywgJ25vLXJlcGVhdCcpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0XHRyZXR1cm4gZztcdFx0XHRcdFxuXHRcdFx0fVxuXHRcdH1cblx0XHRzdmcuRWxlbWVudC5HcmFkaWVudEJhc2UucHJvdG90eXBlID0gbmV3IHN2Zy5FbGVtZW50LkVsZW1lbnRCYXNlO1xuXHRcdFxuXHRcdC8vIGxpbmVhciBncmFkaWVudCBlbGVtZW50XG5cdFx0c3ZnLkVsZW1lbnQubGluZWFyR3JhZGllbnQgPSBmdW5jdGlvbihub2RlKSB7XG5cdFx0XHR0aGlzLmJhc2UgPSBzdmcuRWxlbWVudC5HcmFkaWVudEJhc2U7XG5cdFx0XHR0aGlzLmJhc2Uobm9kZSk7XG5cdFx0XHRcblx0XHRcdHRoaXMuZ2V0R3JhZGllbnQgPSBmdW5jdGlvbihjdHgsIGVsZW1lbnQpIHtcblx0XHRcdFx0dmFyIGJiID0gZWxlbWVudC5nZXRCb3VuZGluZ0JveCgpO1xuXHRcdFx0XHRcblx0XHRcdFx0dmFyIHgxID0gKHRoaXMuZ3JhZGllbnRVbml0cyA9PSAnb2JqZWN0Qm91bmRpbmdCb3gnIFxuXHRcdFx0XHRcdD8gYmIueCgpICsgYmIud2lkdGgoKSAqIHRoaXMuYXR0cmlidXRlKCd4MScpLm51bVZhbHVlKCkgXG5cdFx0XHRcdFx0OiB0aGlzLmF0dHJpYnV0ZSgneDEnKS5MZW5ndGgudG9QaXhlbHMoJ3gnKSk7XG5cdFx0XHRcdHZhciB5MSA9ICh0aGlzLmdyYWRpZW50VW5pdHMgPT0gJ29iamVjdEJvdW5kaW5nQm94JyBcblx0XHRcdFx0XHQ/IGJiLnkoKSArIGJiLmhlaWdodCgpICogdGhpcy5hdHRyaWJ1dGUoJ3kxJykubnVtVmFsdWUoKVxuXHRcdFx0XHRcdDogdGhpcy5hdHRyaWJ1dGUoJ3kxJykuTGVuZ3RoLnRvUGl4ZWxzKCd5JykpO1xuXHRcdFx0XHR2YXIgeDIgPSAodGhpcy5ncmFkaWVudFVuaXRzID09ICdvYmplY3RCb3VuZGluZ0JveCcgXG5cdFx0XHRcdFx0PyBiYi54KCkgKyBiYi53aWR0aCgpICogdGhpcy5hdHRyaWJ1dGUoJ3gyJykubnVtVmFsdWUoKVxuXHRcdFx0XHRcdDogdGhpcy5hdHRyaWJ1dGUoJ3gyJykuTGVuZ3RoLnRvUGl4ZWxzKCd4JykpO1xuXHRcdFx0XHR2YXIgeTIgPSAodGhpcy5ncmFkaWVudFVuaXRzID09ICdvYmplY3RCb3VuZGluZ0JveCcgXG5cdFx0XHRcdFx0PyBiYi55KCkgKyBiYi5oZWlnaHQoKSAqIHRoaXMuYXR0cmlidXRlKCd5MicpLm51bVZhbHVlKClcblx0XHRcdFx0XHQ6IHRoaXMuYXR0cmlidXRlKCd5MicpLkxlbmd0aC50b1BpeGVscygneScpKTtcblxuXHRcdFx0XHRyZXR1cm4gY3R4LmNyZWF0ZUxpbmVhckdyYWRpZW50KHgxLCB5MSwgeDIsIHkyKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0c3ZnLkVsZW1lbnQubGluZWFyR3JhZGllbnQucHJvdG90eXBlID0gbmV3IHN2Zy5FbGVtZW50LkdyYWRpZW50QmFzZTtcblx0XHRcblx0XHQvLyByYWRpYWwgZ3JhZGllbnQgZWxlbWVudFxuXHRcdHN2Zy5FbGVtZW50LnJhZGlhbEdyYWRpZW50ID0gZnVuY3Rpb24obm9kZSkge1xuXHRcdFx0dGhpcy5iYXNlID0gc3ZnLkVsZW1lbnQuR3JhZGllbnRCYXNlO1xuXHRcdFx0dGhpcy5iYXNlKG5vZGUpO1xuXHRcdFx0XG5cdFx0XHR0aGlzLmdldEdyYWRpZW50ID0gZnVuY3Rpb24oY3R4LCBlbGVtZW50KSB7XG5cdFx0XHRcdHZhciBiYiA9IGVsZW1lbnQuZ2V0Qm91bmRpbmdCb3goKTtcblx0XHRcdFx0XG5cdFx0XHRcdHZhciBjeCA9ICh0aGlzLmdyYWRpZW50VW5pdHMgPT0gJ29iamVjdEJvdW5kaW5nQm94JyBcblx0XHRcdFx0XHQ/IGJiLngoKSArIGJiLndpZHRoKCkgKiB0aGlzLmF0dHJpYnV0ZSgnY3gnKS5udW1WYWx1ZSgpIFxuXHRcdFx0XHRcdDogdGhpcy5hdHRyaWJ1dGUoJ2N4JykuTGVuZ3RoLnRvUGl4ZWxzKCd4JykpO1xuXHRcdFx0XHR2YXIgY3kgPSAodGhpcy5ncmFkaWVudFVuaXRzID09ICdvYmplY3RCb3VuZGluZ0JveCcgXG5cdFx0XHRcdFx0PyBiYi55KCkgKyBiYi5oZWlnaHQoKSAqIHRoaXMuYXR0cmlidXRlKCdjeScpLm51bVZhbHVlKCkgXG5cdFx0XHRcdFx0OiB0aGlzLmF0dHJpYnV0ZSgnY3knKS5MZW5ndGgudG9QaXhlbHMoJ3knKSk7XG5cdFx0XHRcdFxuXHRcdFx0XHR2YXIgZnggPSBjeDtcblx0XHRcdFx0dmFyIGZ5ID0gY3k7XG5cdFx0XHRcdGlmICh0aGlzLmF0dHJpYnV0ZSgnZngnKS5oYXNWYWx1ZSgpKSB7XG5cdFx0XHRcdFx0ZnggPSAodGhpcy5ncmFkaWVudFVuaXRzID09ICdvYmplY3RCb3VuZGluZ0JveCcgXG5cdFx0XHRcdFx0PyBiYi54KCkgKyBiYi53aWR0aCgpICogdGhpcy5hdHRyaWJ1dGUoJ2Z4JykubnVtVmFsdWUoKSBcblx0XHRcdFx0XHQ6IHRoaXMuYXR0cmlidXRlKCdmeCcpLkxlbmd0aC50b1BpeGVscygneCcpKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAodGhpcy5hdHRyaWJ1dGUoJ2Z5JykuaGFzVmFsdWUoKSkge1xuXHRcdFx0XHRcdGZ5ID0gKHRoaXMuZ3JhZGllbnRVbml0cyA9PSAnb2JqZWN0Qm91bmRpbmdCb3gnIFxuXHRcdFx0XHRcdD8gYmIueSgpICsgYmIuaGVpZ2h0KCkgKiB0aGlzLmF0dHJpYnV0ZSgnZnknKS5udW1WYWx1ZSgpIFxuXHRcdFx0XHRcdDogdGhpcy5hdHRyaWJ1dGUoJ2Z5JykuTGVuZ3RoLnRvUGl4ZWxzKCd5JykpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0XHR2YXIgciA9ICh0aGlzLmdyYWRpZW50VW5pdHMgPT0gJ29iamVjdEJvdW5kaW5nQm94JyBcblx0XHRcdFx0XHQ/IChiYi53aWR0aCgpICsgYmIuaGVpZ2h0KCkpIC8gMi4wICogdGhpcy5hdHRyaWJ1dGUoJ3InKS5udW1WYWx1ZSgpXG5cdFx0XHRcdFx0OiB0aGlzLmF0dHJpYnV0ZSgncicpLkxlbmd0aC50b1BpeGVscygpKTtcblx0XHRcdFx0XG5cdFx0XHRcdHJldHVybiBjdHguY3JlYXRlUmFkaWFsR3JhZGllbnQoZngsIGZ5LCAwLCBjeCwgY3ksIHIpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRzdmcuRWxlbWVudC5yYWRpYWxHcmFkaWVudC5wcm90b3R5cGUgPSBuZXcgc3ZnLkVsZW1lbnQuR3JhZGllbnRCYXNlO1xuXHRcdFxuXHRcdC8vIGdyYWRpZW50IHN0b3AgZWxlbWVudFxuXHRcdHN2Zy5FbGVtZW50LnN0b3AgPSBmdW5jdGlvbihub2RlKSB7XG5cdFx0XHR0aGlzLmJhc2UgPSBzdmcuRWxlbWVudC5FbGVtZW50QmFzZTtcblx0XHRcdHRoaXMuYmFzZShub2RlKTtcblx0XHRcdFxuXHRcdFx0dGhpcy5vZmZzZXQgPSB0aGlzLmF0dHJpYnV0ZSgnb2Zmc2V0JykubnVtVmFsdWUoKTtcblx0XHRcdFxuXHRcdFx0dmFyIHN0b3BDb2xvciA9IHRoaXMuc3R5bGUoJ3N0b3AtY29sb3InKTtcblx0XHRcdGlmICh0aGlzLnN0eWxlKCdzdG9wLW9wYWNpdHknKS5oYXNWYWx1ZSgpKSBzdG9wQ29sb3IgPSBzdG9wQ29sb3IuQ29sb3IuYWRkT3BhY2l0eSh0aGlzLnN0eWxlKCdzdG9wLW9wYWNpdHknKS52YWx1ZSk7XG5cdFx0XHR0aGlzLmNvbG9yID0gc3RvcENvbG9yLnZhbHVlO1xuXHRcdH1cblx0XHRzdmcuRWxlbWVudC5zdG9wLnByb3RvdHlwZSA9IG5ldyBzdmcuRWxlbWVudC5FbGVtZW50QmFzZTtcblx0XHRcblx0XHQvLyBhbmltYXRpb24gYmFzZSBlbGVtZW50XG5cdFx0c3ZnLkVsZW1lbnQuQW5pbWF0ZUJhc2UgPSBmdW5jdGlvbihub2RlKSB7XG5cdFx0XHR0aGlzLmJhc2UgPSBzdmcuRWxlbWVudC5FbGVtZW50QmFzZTtcblx0XHRcdHRoaXMuYmFzZShub2RlKTtcblx0XHRcdFxuXHRcdFx0c3ZnLkFuaW1hdGlvbnMucHVzaCh0aGlzKTtcblx0XHRcdFxuXHRcdFx0dGhpcy5kdXJhdGlvbiA9IDAuMDtcblx0XHRcdHRoaXMuYmVnaW4gPSB0aGlzLmF0dHJpYnV0ZSgnYmVnaW4nKS5UaW1lLnRvTWlsbGlzZWNvbmRzKCk7XG5cdFx0XHR0aGlzLm1heER1cmF0aW9uID0gdGhpcy5iZWdpbiArIHRoaXMuYXR0cmlidXRlKCdkdXInKS5UaW1lLnRvTWlsbGlzZWNvbmRzKCk7XG5cdFx0XHRcblx0XHRcdHRoaXMuZ2V0UHJvcGVydHkgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyIGF0dHJpYnV0ZVR5cGUgPSB0aGlzLmF0dHJpYnV0ZSgnYXR0cmlidXRlVHlwZScpLnZhbHVlO1xuXHRcdFx0XHR2YXIgYXR0cmlidXRlTmFtZSA9IHRoaXMuYXR0cmlidXRlKCdhdHRyaWJ1dGVOYW1lJykudmFsdWU7XG5cdFx0XHRcdFxuXHRcdFx0XHRpZiAoYXR0cmlidXRlVHlwZSA9PSAnQ1NTJykge1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLnBhcmVudC5zdHlsZShhdHRyaWJ1dGVOYW1lLCB0cnVlKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gdGhpcy5wYXJlbnQuYXR0cmlidXRlKGF0dHJpYnV0ZU5hbWUsIHRydWUpO1x0XHRcdFxuXHRcdFx0fTtcblx0XHRcdFxuXHRcdFx0dGhpcy5pbml0aWFsVmFsdWUgPSBudWxsO1xuXHRcdFx0dGhpcy5yZW1vdmVkID0gZmFsc2U7XHRcdFx0XG5cblx0XHRcdHRoaXMuY2FsY1ZhbHVlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdC8vIE9WRVJSSURFIE1FIVxuXHRcdFx0XHRyZXR1cm4gJyc7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdHRoaXMudXBkYXRlID0gZnVuY3Rpb24oZGVsdGEpIHtcdFxuXHRcdFx0XHQvLyBzZXQgaW5pdGlhbCB2YWx1ZVxuXHRcdFx0XHRpZiAodGhpcy5pbml0aWFsVmFsdWUgPT0gbnVsbCkge1xuXHRcdFx0XHRcdHRoaXMuaW5pdGlhbFZhbHVlID0gdGhpcy5nZXRQcm9wZXJ0eSgpLnZhbHVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcblx0XHRcdFx0Ly8gaWYgd2UncmUgcGFzdCB0aGUgZW5kIHRpbWVcblx0XHRcdFx0aWYgKHRoaXMuZHVyYXRpb24gPiB0aGlzLm1heER1cmF0aW9uKSB7XG5cdFx0XHRcdFx0Ly8gbG9vcCBmb3IgaW5kZWZpbml0ZWx5IHJlcGVhdGluZyBhbmltYXRpb25zXG5cdFx0XHRcdFx0aWYgKHRoaXMuYXR0cmlidXRlKCdyZXBlYXRDb3VudCcpLnZhbHVlID09ICdpbmRlZmluaXRlJykge1xuXHRcdFx0XHRcdFx0dGhpcy5kdXJhdGlvbiA9IDAuMFxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIGlmICh0aGlzLmF0dHJpYnV0ZSgnZmlsbCcpLnZhbHVlT3JEZWZhdWx0KCdyZW1vdmUnKSA9PSAncmVtb3ZlJyAmJiAhdGhpcy5yZW1vdmVkKSB7XG5cdFx0XHRcdFx0XHR0aGlzLnJlbW92ZWQgPSB0cnVlO1xuXHRcdFx0XHRcdFx0dGhpcy5nZXRQcm9wZXJ0eSgpLnZhbHVlID0gdGhpcy5pbml0aWFsVmFsdWU7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7IC8vIG5vIHVwZGF0ZXMgbWFkZVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVx0XHRcdFxuXHRcdFx0XHR0aGlzLmR1cmF0aW9uID0gdGhpcy5kdXJhdGlvbiArIGRlbHRhO1xuXHRcdFx0XG5cdFx0XHRcdC8vIGlmIHdlJ3JlIHBhc3QgdGhlIGJlZ2luIHRpbWVcblx0XHRcdFx0dmFyIHVwZGF0ZWQgPSBmYWxzZTtcblx0XHRcdFx0aWYgKHRoaXMuYmVnaW4gPCB0aGlzLmR1cmF0aW9uKSB7XG5cdFx0XHRcdFx0dmFyIG5ld1ZhbHVlID0gdGhpcy5jYWxjVmFsdWUoKTsgLy8gdHdlZW5cblx0XHRcdFx0XHRcblx0XHRcdFx0XHRpZiAodGhpcy5hdHRyaWJ1dGUoJ3R5cGUnKS5oYXNWYWx1ZSgpKSB7XG5cdFx0XHRcdFx0XHQvLyBmb3IgdHJhbnNmb3JtLCBldGMuXG5cdFx0XHRcdFx0XHR2YXIgdHlwZSA9IHRoaXMuYXR0cmlidXRlKCd0eXBlJykudmFsdWU7XG5cdFx0XHRcdFx0XHRuZXdWYWx1ZSA9IHR5cGUgKyAnKCcgKyBuZXdWYWx1ZSArICcpJztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0dGhpcy5nZXRQcm9wZXJ0eSgpLnZhbHVlID0gbmV3VmFsdWU7XG5cdFx0XHRcdFx0dXBkYXRlZCA9IHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHRcdHJldHVybiB1cGRhdGVkO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHQvLyBmcmFjdGlvbiBvZiBkdXJhdGlvbiB3ZSd2ZSBjb3ZlcmVkXG5cdFx0XHR0aGlzLnByb2dyZXNzID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHJldHVybiAoKHRoaXMuZHVyYXRpb24gLSB0aGlzLmJlZ2luKSAvICh0aGlzLm1heER1cmF0aW9uIC0gdGhpcy5iZWdpbikpO1xuXHRcdFx0fVx0XHRcdFxuXHRcdH1cblx0XHRzdmcuRWxlbWVudC5BbmltYXRlQmFzZS5wcm90b3R5cGUgPSBuZXcgc3ZnLkVsZW1lbnQuRWxlbWVudEJhc2U7XG5cdFx0XG5cdFx0Ly8gYW5pbWF0ZSBlbGVtZW50XG5cdFx0c3ZnLkVsZW1lbnQuYW5pbWF0ZSA9IGZ1bmN0aW9uKG5vZGUpIHtcblx0XHRcdHRoaXMuYmFzZSA9IHN2Zy5FbGVtZW50LkFuaW1hdGVCYXNlO1xuXHRcdFx0dGhpcy5iYXNlKG5vZGUpO1xuXHRcdFx0XG5cdFx0XHR0aGlzLmNhbGNWYWx1ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR2YXIgZnJvbSA9IHRoaXMuYXR0cmlidXRlKCdmcm9tJykubnVtVmFsdWUoKTtcblx0XHRcdFx0dmFyIHRvID0gdGhpcy5hdHRyaWJ1dGUoJ3RvJykubnVtVmFsdWUoKTtcblx0XHRcdFx0XG5cdFx0XHRcdC8vIHR3ZWVuIHZhbHVlIGxpbmVhcmx5XG5cdFx0XHRcdHJldHVybiBmcm9tICsgKHRvIC0gZnJvbSkgKiB0aGlzLnByb2dyZXNzKCk7IFxuXHRcdFx0fTtcblx0XHR9XG5cdFx0c3ZnLkVsZW1lbnQuYW5pbWF0ZS5wcm90b3R5cGUgPSBuZXcgc3ZnLkVsZW1lbnQuQW5pbWF0ZUJhc2U7XG5cdFx0XHRcblx0XHQvLyBhbmltYXRlIGNvbG9yIGVsZW1lbnRcblx0XHRzdmcuRWxlbWVudC5hbmltYXRlQ29sb3IgPSBmdW5jdGlvbihub2RlKSB7XG5cdFx0XHR0aGlzLmJhc2UgPSBzdmcuRWxlbWVudC5BbmltYXRlQmFzZTtcblx0XHRcdHRoaXMuYmFzZShub2RlKTtcblxuXHRcdFx0dGhpcy5jYWxjVmFsdWUgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyIGZyb20gPSBuZXcgUkdCQ29sb3IodGhpcy5hdHRyaWJ1dGUoJ2Zyb20nKS52YWx1ZSk7XG5cdFx0XHRcdHZhciB0byA9IG5ldyBSR0JDb2xvcih0aGlzLmF0dHJpYnV0ZSgndG8nKS52YWx1ZSk7XG5cdFx0XHRcdFxuXHRcdFx0XHRpZiAoZnJvbS5vayAmJiB0by5vaykge1xuXHRcdFx0XHRcdC8vIHR3ZWVuIGNvbG9yIGxpbmVhcmx5XG5cdFx0XHRcdFx0dmFyIHIgPSBmcm9tLnIgKyAodG8uciAtIGZyb20ucikgKiB0aGlzLnByb2dyZXNzKCk7XG5cdFx0XHRcdFx0dmFyIGcgPSBmcm9tLmcgKyAodG8uZyAtIGZyb20uZykgKiB0aGlzLnByb2dyZXNzKCk7XG5cdFx0XHRcdFx0dmFyIGIgPSBmcm9tLmIgKyAodG8uYiAtIGZyb20uYikgKiB0aGlzLnByb2dyZXNzKCk7XG5cdFx0XHRcdFx0cmV0dXJuICdyZ2IoJytwYXJzZUludChyLDEwKSsnLCcrcGFyc2VJbnQoZywxMCkrJywnK3BhcnNlSW50KGIsMTApKycpJztcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gdGhpcy5hdHRyaWJ1dGUoJ2Zyb20nKS52YWx1ZTtcblx0XHRcdH07XG5cdFx0fVxuXHRcdHN2Zy5FbGVtZW50LmFuaW1hdGVDb2xvci5wcm90b3R5cGUgPSBuZXcgc3ZnLkVsZW1lbnQuQW5pbWF0ZUJhc2U7XG5cdFx0XG5cdFx0Ly8gYW5pbWF0ZSB0cmFuc2Zvcm0gZWxlbWVudFxuXHRcdHN2Zy5FbGVtZW50LmFuaW1hdGVUcmFuc2Zvcm0gPSBmdW5jdGlvbihub2RlKSB7XG5cdFx0XHR0aGlzLmJhc2UgPSBzdmcuRWxlbWVudC5hbmltYXRlO1xuXHRcdFx0dGhpcy5iYXNlKG5vZGUpO1xuXHRcdH1cblx0XHRzdmcuRWxlbWVudC5hbmltYXRlVHJhbnNmb3JtLnByb3RvdHlwZSA9IG5ldyBzdmcuRWxlbWVudC5hbmltYXRlO1xuXHRcdFxuXHRcdC8vIGZvbnQgZWxlbWVudFxuXHRcdHN2Zy5FbGVtZW50LmZvbnQgPSBmdW5jdGlvbihub2RlKSB7XG5cdFx0XHR0aGlzLmJhc2UgPSBzdmcuRWxlbWVudC5FbGVtZW50QmFzZTtcblx0XHRcdHRoaXMuYmFzZShub2RlKTtcblxuXHRcdFx0dGhpcy5ob3JpekFkdlggPSB0aGlzLmF0dHJpYnV0ZSgnaG9yaXotYWR2LXgnKS5udW1WYWx1ZSgpO1x0XHRcdFxuXHRcdFx0XG5cdFx0XHR0aGlzLmlzUlRMID0gZmFsc2U7XG5cdFx0XHR0aGlzLmlzQXJhYmljID0gZmFsc2U7XG5cdFx0XHR0aGlzLmZvbnRGYWNlID0gbnVsbDtcblx0XHRcdHRoaXMubWlzc2luZ0dseXBoID0gbnVsbDtcblx0XHRcdHRoaXMuZ2x5cGhzID0gW107XHRcdFx0XG5cdFx0XHRmb3IgKHZhciBpPTA7IGk8dGhpcy5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHR2YXIgY2hpbGQgPSB0aGlzLmNoaWxkcmVuW2ldO1xuXHRcdFx0XHRpZiAoY2hpbGQudHlwZSA9PSAnZm9udC1mYWNlJykge1xuXHRcdFx0XHRcdHRoaXMuZm9udEZhY2UgPSBjaGlsZDtcblx0XHRcdFx0XHRpZiAoY2hpbGQuc3R5bGUoJ2ZvbnQtZmFtaWx5JykuaGFzVmFsdWUoKSkge1xuXHRcdFx0XHRcdFx0c3ZnLkRlZmluaXRpb25zW2NoaWxkLnN0eWxlKCdmb250LWZhbWlseScpLnZhbHVlXSA9IHRoaXM7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2UgaWYgKGNoaWxkLnR5cGUgPT0gJ21pc3NpbmctZ2x5cGgnKSB0aGlzLm1pc3NpbmdHbHlwaCA9IGNoaWxkO1xuXHRcdFx0XHRlbHNlIGlmIChjaGlsZC50eXBlID09ICdnbHlwaCcpIHtcblx0XHRcdFx0XHRpZiAoY2hpbGQuYXJhYmljRm9ybSAhPSAnJykge1xuXHRcdFx0XHRcdFx0dGhpcy5pc1JUTCA9IHRydWU7XG5cdFx0XHRcdFx0XHR0aGlzLmlzQXJhYmljID0gdHJ1ZTtcblx0XHRcdFx0XHRcdGlmICh0eXBlb2YodGhpcy5nbHlwaHNbY2hpbGQudW5pY29kZV0pID09ICd1bmRlZmluZWQnKSB0aGlzLmdseXBoc1tjaGlsZC51bmljb2RlXSA9IFtdO1xuXHRcdFx0XHRcdFx0dGhpcy5nbHlwaHNbY2hpbGQudW5pY29kZV1bY2hpbGQuYXJhYmljRm9ybV0gPSBjaGlsZDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHR0aGlzLmdseXBoc1tjaGlsZC51bmljb2RlXSA9IGNoaWxkO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVx0XG5cdFx0fVxuXHRcdHN2Zy5FbGVtZW50LmZvbnQucHJvdG90eXBlID0gbmV3IHN2Zy5FbGVtZW50LkVsZW1lbnRCYXNlO1xuXHRcdFxuXHRcdC8vIGZvbnQtZmFjZSBlbGVtZW50XG5cdFx0c3ZnLkVsZW1lbnQuZm9udGZhY2UgPSBmdW5jdGlvbihub2RlKSB7XG5cdFx0XHR0aGlzLmJhc2UgPSBzdmcuRWxlbWVudC5FbGVtZW50QmFzZTtcblx0XHRcdHRoaXMuYmFzZShub2RlKTtcdFxuXHRcdFx0XG5cdFx0XHR0aGlzLmFzY2VudCA9IHRoaXMuYXR0cmlidXRlKCdhc2NlbnQnKS52YWx1ZTtcblx0XHRcdHRoaXMuZGVzY2VudCA9IHRoaXMuYXR0cmlidXRlKCdkZXNjZW50JykudmFsdWU7XG5cdFx0XHR0aGlzLnVuaXRzUGVyRW0gPSB0aGlzLmF0dHJpYnV0ZSgndW5pdHMtcGVyLWVtJykubnVtVmFsdWUoKTtcdFx0XHRcdFxuXHRcdH1cblx0XHRzdmcuRWxlbWVudC5mb250ZmFjZS5wcm90b3R5cGUgPSBuZXcgc3ZnLkVsZW1lbnQuRWxlbWVudEJhc2U7XG5cdFx0XG5cdFx0Ly8gbWlzc2luZy1nbHlwaCBlbGVtZW50XG5cdFx0c3ZnLkVsZW1lbnQubWlzc2luZ2dseXBoID0gZnVuY3Rpb24obm9kZSkge1xuXHRcdFx0dGhpcy5iYXNlID0gc3ZnLkVsZW1lbnQucGF0aDtcblx0XHRcdHRoaXMuYmFzZShub2RlKTtcdFxuXHRcdFx0XG5cdFx0XHR0aGlzLmhvcml6QWR2WCA9IDA7XG5cdFx0fVxuXHRcdHN2Zy5FbGVtZW50Lm1pc3NpbmdnbHlwaC5wcm90b3R5cGUgPSBuZXcgc3ZnLkVsZW1lbnQucGF0aDtcblx0XHRcblx0XHQvLyBnbHlwaCBlbGVtZW50XG5cdFx0c3ZnLkVsZW1lbnQuZ2x5cGggPSBmdW5jdGlvbihub2RlKSB7XG5cdFx0XHR0aGlzLmJhc2UgPSBzdmcuRWxlbWVudC5wYXRoO1xuXHRcdFx0dGhpcy5iYXNlKG5vZGUpO1x0XG5cdFx0XHRcblx0XHRcdHRoaXMuaG9yaXpBZHZYID0gdGhpcy5hdHRyaWJ1dGUoJ2hvcml6LWFkdi14JykubnVtVmFsdWUoKTtcblx0XHRcdHRoaXMudW5pY29kZSA9IHRoaXMuYXR0cmlidXRlKCd1bmljb2RlJykudmFsdWU7XG5cdFx0XHR0aGlzLmFyYWJpY0Zvcm0gPSB0aGlzLmF0dHJpYnV0ZSgnYXJhYmljLWZvcm0nKS52YWx1ZTtcblx0XHR9XG5cdFx0c3ZnLkVsZW1lbnQuZ2x5cGgucHJvdG90eXBlID0gbmV3IHN2Zy5FbGVtZW50LnBhdGg7XG5cdFx0XG5cdFx0Ly8gdGV4dCBlbGVtZW50XG5cdFx0c3ZnLkVsZW1lbnQudGV4dCA9IGZ1bmN0aW9uKG5vZGUpIHtcblx0XHRcdHRoaXMuYmFzZSA9IHN2Zy5FbGVtZW50LlJlbmRlcmVkRWxlbWVudEJhc2U7XG5cdFx0XHR0aGlzLmJhc2Uobm9kZSk7XG5cdFx0XHRcblx0XHRcdGlmIChub2RlICE9IG51bGwpIHtcblx0XHRcdFx0Ly8gYWRkIGNoaWxkcmVuXG5cdFx0XHRcdHRoaXMuY2hpbGRyZW4gPSBbXTtcblx0XHRcdFx0Zm9yICh2YXIgaT0wOyBpPG5vZGUuY2hpbGROb2Rlcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdHZhciBjaGlsZE5vZGUgPSBub2RlLmNoaWxkTm9kZXNbaV07XG5cdFx0XHRcdFx0aWYgKGNoaWxkTm9kZS5ub2RlVHlwZSA9PSAxKSB7IC8vIGNhcHR1cmUgdHNwYW4gYW5kIHRyZWYgbm9kZXNcblx0XHRcdFx0XHRcdHRoaXMuYWRkQ2hpbGQoY2hpbGROb2RlLCB0cnVlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSBpZiAoY2hpbGROb2RlLm5vZGVUeXBlID09IDMpIHsgLy8gY2FwdHVyZSB0ZXh0XG5cdFx0XHRcdFx0XHR0aGlzLmFkZENoaWxkKG5ldyBzdmcuRWxlbWVudC50c3BhbihjaGlsZE5vZGUpLCBmYWxzZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdHRoaXMuYmFzZVNldENvbnRleHQgPSB0aGlzLnNldENvbnRleHQ7XG5cdFx0XHR0aGlzLnNldENvbnRleHQgPSBmdW5jdGlvbihjdHgpIHtcblx0XHRcdFx0dGhpcy5iYXNlU2V0Q29udGV4dChjdHgpO1xuXHRcdFx0XHRpZiAodGhpcy5zdHlsZSgnZG9taW5hbnQtYmFzZWxpbmUnKS5oYXNWYWx1ZSgpKSBjdHgudGV4dEJhc2VsaW5lID0gdGhpcy5zdHlsZSgnZG9taW5hbnQtYmFzZWxpbmUnKS52YWx1ZTtcblx0XHRcdFx0aWYgKHRoaXMuc3R5bGUoJ2FsaWdubWVudC1iYXNlbGluZScpLmhhc1ZhbHVlKCkpIGN0eC50ZXh0QmFzZWxpbmUgPSB0aGlzLnN0eWxlKCdhbGlnbm1lbnQtYmFzZWxpbmUnKS52YWx1ZTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0dGhpcy5yZW5kZXJDaGlsZHJlbiA9IGZ1bmN0aW9uKGN0eCkge1xuXHRcdFx0XHR2YXIgdGV4dEFuY2hvciA9IHRoaXMuc3R5bGUoJ3RleHQtYW5jaG9yJykudmFsdWVPckRlZmF1bHQoJ3N0YXJ0Jyk7XG5cdFx0XHRcdHZhciB4ID0gdGhpcy5hdHRyaWJ1dGUoJ3gnKS5MZW5ndGgudG9QaXhlbHMoJ3gnKTtcblx0XHRcdFx0dmFyIHkgPSB0aGlzLmF0dHJpYnV0ZSgneScpLkxlbmd0aC50b1BpeGVscygneScpO1xuXHRcdFx0XHRmb3IgKHZhciBpPTA7IGk8dGhpcy5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdHZhciBjaGlsZCA9IHRoaXMuY2hpbGRyZW5baV07XG5cdFx0XHRcdFxuXHRcdFx0XHRcdGlmIChjaGlsZC5hdHRyaWJ1dGUoJ3gnKS5oYXNWYWx1ZSgpKSB7XG5cdFx0XHRcdFx0XHRjaGlsZC54ID0gY2hpbGQuYXR0cmlidXRlKCd4JykuTGVuZ3RoLnRvUGl4ZWxzKCd4Jyk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0aWYgKGNoaWxkLmF0dHJpYnV0ZSgnZHgnKS5oYXNWYWx1ZSgpKSB4ICs9IGNoaWxkLmF0dHJpYnV0ZSgnZHgnKS5MZW5ndGgudG9QaXhlbHMoJ3gnKTtcblx0XHRcdFx0XHRcdGNoaWxkLnggPSB4O1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcblx0XHRcdFx0XHR2YXIgY2hpbGRMZW5ndGggPSBjaGlsZC5tZWFzdXJlVGV4dChjdHgpO1xuXHRcdFx0XHRcdGlmICh0ZXh0QW5jaG9yICE9ICdzdGFydCcgJiYgKGk9PTAgfHwgY2hpbGQuYXR0cmlidXRlKCd4JykuaGFzVmFsdWUoKSkpIHsgLy8gbmV3IGdyb3VwP1xuXHRcdFx0XHRcdFx0Ly8gbG9vcCB0aHJvdWdoIHJlc3Qgb2YgY2hpbGRyZW5cblx0XHRcdFx0XHRcdHZhciBncm91cExlbmd0aCA9IGNoaWxkTGVuZ3RoO1xuXHRcdFx0XHRcdFx0Zm9yICh2YXIgaj1pKzE7IGo8dGhpcy5jaGlsZHJlbi5sZW5ndGg7IGorKykge1xuXHRcdFx0XHRcdFx0XHR2YXIgY2hpbGRJbkdyb3VwID0gdGhpcy5jaGlsZHJlbltqXTtcblx0XHRcdFx0XHRcdFx0aWYgKGNoaWxkSW5Hcm91cC5hdHRyaWJ1dGUoJ3gnKS5oYXNWYWx1ZSgpKSBicmVhazsgLy8gbmV3IGdyb3VwXG5cdFx0XHRcdFx0XHRcdGdyb3VwTGVuZ3RoICs9IGNoaWxkSW5Hcm91cC5tZWFzdXJlVGV4dChjdHgpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0Y2hpbGQueCAtPSAodGV4dEFuY2hvciA9PSAnZW5kJyA/IGdyb3VwTGVuZ3RoIDogZ3JvdXBMZW5ndGggLyAyLjApO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHR4ID0gY2hpbGQueCArIGNoaWxkTGVuZ3RoO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdGlmIChjaGlsZC5hdHRyaWJ1dGUoJ3knKS5oYXNWYWx1ZSgpKSB7XG5cdFx0XHRcdFx0XHRjaGlsZC55ID0gY2hpbGQuYXR0cmlidXRlKCd5JykuTGVuZ3RoLnRvUGl4ZWxzKCd5Jyk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0aWYgKGNoaWxkLmF0dHJpYnV0ZSgnZHknKS5oYXNWYWx1ZSgpKSB5ICs9IGNoaWxkLmF0dHJpYnV0ZSgnZHknKS5MZW5ndGgudG9QaXhlbHMoJ3knKTtcblx0XHRcdFx0XHRcdGNoaWxkLnkgPSB5O1xuXHRcdFx0XHRcdH1cdFxuXHRcdFx0XHRcdHkgPSBjaGlsZC55O1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdGNoaWxkLnJlbmRlcihjdHgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHN2Zy5FbGVtZW50LnRleHQucHJvdG90eXBlID0gbmV3IHN2Zy5FbGVtZW50LlJlbmRlcmVkRWxlbWVudEJhc2U7XG5cdFx0XG5cdFx0Ly8gdGV4dCBiYXNlXG5cdFx0c3ZnLkVsZW1lbnQuVGV4dEVsZW1lbnRCYXNlID0gZnVuY3Rpb24obm9kZSkge1xuXHRcdFx0dGhpcy5iYXNlID0gc3ZnLkVsZW1lbnQuUmVuZGVyZWRFbGVtZW50QmFzZTtcblx0XHRcdHRoaXMuYmFzZShub2RlKTtcblx0XHRcdFxuXHRcdFx0dGhpcy5nZXRHbHlwaCA9IGZ1bmN0aW9uKGZvbnQsIHRleHQsIGkpIHtcblx0XHRcdFx0dmFyIGMgPSB0ZXh0W2ldO1xuXHRcdFx0XHR2YXIgZ2x5cGggPSBudWxsO1xuXHRcdFx0XHRpZiAoZm9udC5pc0FyYWJpYykge1xuXHRcdFx0XHRcdHZhciBhcmFiaWNGb3JtID0gJ2lzb2xhdGVkJztcblx0XHRcdFx0XHRpZiAoKGk9PTAgfHwgdGV4dFtpLTFdPT0nICcpICYmIGk8dGV4dC5sZW5ndGgtMiAmJiB0ZXh0W2krMV0hPScgJykgYXJhYmljRm9ybSA9ICd0ZXJtaW5hbCc7IFxuXHRcdFx0XHRcdGlmIChpPjAgJiYgdGV4dFtpLTFdIT0nICcgJiYgaTx0ZXh0Lmxlbmd0aC0yICYmIHRleHRbaSsxXSE9JyAnKSBhcmFiaWNGb3JtID0gJ21lZGlhbCc7XG5cdFx0XHRcdFx0aWYgKGk+MCAmJiB0ZXh0W2ktMV0hPScgJyAmJiAoaSA9PSB0ZXh0Lmxlbmd0aC0xIHx8IHRleHRbaSsxXT09JyAnKSkgYXJhYmljRm9ybSA9ICdpbml0aWFsJztcblx0XHRcdFx0XHRpZiAodHlwZW9mKGZvbnQuZ2x5cGhzW2NdKSAhPSAndW5kZWZpbmVkJykge1xuXHRcdFx0XHRcdFx0Z2x5cGggPSBmb250LmdseXBoc1tjXVthcmFiaWNGb3JtXTtcblx0XHRcdFx0XHRcdGlmIChnbHlwaCA9PSBudWxsICYmIGZvbnQuZ2x5cGhzW2NdLnR5cGUgPT0gJ2dseXBoJykgZ2x5cGggPSBmb250LmdseXBoc1tjXTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0Z2x5cGggPSBmb250LmdseXBoc1tjXTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoZ2x5cGggPT0gbnVsbCkgZ2x5cGggPSBmb250Lm1pc3NpbmdHbHlwaDtcblx0XHRcdFx0cmV0dXJuIGdseXBoO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHR0aGlzLnJlbmRlckNoaWxkcmVuID0gZnVuY3Rpb24oY3R4KSB7XG5cdFx0XHRcdHZhciBjdXN0b21Gb250ID0gdGhpcy5wYXJlbnQuc3R5bGUoJ2ZvbnQtZmFtaWx5JykuRGVmaW5pdGlvbi5nZXREZWZpbml0aW9uKCk7XG5cdFx0XHRcdGlmIChjdXN0b21Gb250ICE9IG51bGwpIHtcblx0XHRcdFx0XHR2YXIgZm9udFNpemUgPSB0aGlzLnBhcmVudC5zdHlsZSgnZm9udC1zaXplJykubnVtVmFsdWVPckRlZmF1bHQoc3ZnLkZvbnQuUGFyc2Uoc3ZnLmN0eC5mb250KS5mb250U2l6ZSk7XG5cdFx0XHRcdFx0dmFyIGZvbnRTdHlsZSA9IHRoaXMucGFyZW50LnN0eWxlKCdmb250LXN0eWxlJykudmFsdWVPckRlZmF1bHQoc3ZnLkZvbnQuUGFyc2Uoc3ZnLmN0eC5mb250KS5mb250U3R5bGUpO1xuXHRcdFx0XHRcdHZhciB0ZXh0ID0gdGhpcy5nZXRUZXh0KCk7XG5cdFx0XHRcdFx0aWYgKGN1c3RvbUZvbnQuaXNSVEwpIHRleHQgPSB0ZXh0LnNwbGl0KFwiXCIpLnJldmVyc2UoKS5qb2luKFwiXCIpO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdHZhciBkeCA9IHN2Zy5Ub051bWJlckFycmF5KHRoaXMucGFyZW50LmF0dHJpYnV0ZSgnZHgnKS52YWx1ZSk7XG5cdFx0XHRcdFx0Zm9yICh2YXIgaT0wOyBpPHRleHQubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRcdHZhciBnbHlwaCA9IHRoaXMuZ2V0R2x5cGgoY3VzdG9tRm9udCwgdGV4dCwgaSk7XG5cdFx0XHRcdFx0XHR2YXIgc2NhbGUgPSBmb250U2l6ZSAvIGN1c3RvbUZvbnQuZm9udEZhY2UudW5pdHNQZXJFbTtcblx0XHRcdFx0XHRcdGN0eC50cmFuc2xhdGUodGhpcy54LCB0aGlzLnkpO1xuXHRcdFx0XHRcdFx0Y3R4LnNjYWxlKHNjYWxlLCAtc2NhbGUpO1xuXHRcdFx0XHRcdFx0dmFyIGx3ID0gY3R4LmxpbmVXaWR0aDtcblx0XHRcdFx0XHRcdGN0eC5saW5lV2lkdGggPSBjdHgubGluZVdpZHRoICogY3VzdG9tRm9udC5mb250RmFjZS51bml0c1BlckVtIC8gZm9udFNpemU7XG5cdFx0XHRcdFx0XHRpZiAoZm9udFN0eWxlID09ICdpdGFsaWMnKSBjdHgudHJhbnNmb3JtKDEsIDAsIC40LCAxLCAwLCAwKTtcblx0XHRcdFx0XHRcdGdseXBoLnJlbmRlcihjdHgpO1xuXHRcdFx0XHRcdFx0aWYgKGZvbnRTdHlsZSA9PSAnaXRhbGljJykgY3R4LnRyYW5zZm9ybSgxLCAwLCAtLjQsIDEsIDAsIDApO1xuXHRcdFx0XHRcdFx0Y3R4LmxpbmVXaWR0aCA9IGx3O1xuXHRcdFx0XHRcdFx0Y3R4LnNjYWxlKDEvc2NhbGUsIC0xL3NjYWxlKTtcblx0XHRcdFx0XHRcdGN0eC50cmFuc2xhdGUoLXRoaXMueCwgLXRoaXMueSk7XHRcblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0dGhpcy54ICs9IGZvbnRTaXplICogKGdseXBoLmhvcml6QWR2WCB8fCBjdXN0b21Gb250Lmhvcml6QWR2WCkgLyBjdXN0b21Gb250LmZvbnRGYWNlLnVuaXRzUGVyRW07XG5cdFx0XHRcdFx0XHRpZiAodHlwZW9mKGR4W2ldKSAhPSAndW5kZWZpbmVkJyAmJiAhaXNOYU4oZHhbaV0pKSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMueCArPSBkeFtpXTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cdFx0XHRcblx0XHRcdFx0aWYgKGN0eC5zdHJva2VTdHlsZSAhPSAnJykgY3R4LnN0cm9rZVRleHQoc3ZnLmNvbXByZXNzU3BhY2VzKHRoaXMuZ2V0VGV4dCgpKSwgdGhpcy54LCB0aGlzLnkpO1xuXHRcdFx0XHRpZiAoY3R4LmZpbGxTdHlsZSAhPSAnJykgY3R4LmZpbGxUZXh0KHN2Zy5jb21wcmVzc1NwYWNlcyh0aGlzLmdldFRleHQoKSksIHRoaXMueCwgdGhpcy55KTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0dGhpcy5nZXRUZXh0ID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdC8vIE9WRVJSSURFIE1FXG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdHRoaXMubWVhc3VyZVRleHQgPSBmdW5jdGlvbihjdHgpIHtcblx0XHRcdFx0dmFyIGN1c3RvbUZvbnQgPSB0aGlzLnBhcmVudC5zdHlsZSgnZm9udC1mYW1pbHknKS5EZWZpbml0aW9uLmdldERlZmluaXRpb24oKTtcblx0XHRcdFx0aWYgKGN1c3RvbUZvbnQgIT0gbnVsbCkge1xuXHRcdFx0XHRcdHZhciBmb250U2l6ZSA9IHRoaXMucGFyZW50LnN0eWxlKCdmb250LXNpemUnKS5udW1WYWx1ZU9yRGVmYXVsdChzdmcuRm9udC5QYXJzZShzdmcuY3R4LmZvbnQpLmZvbnRTaXplKTtcblx0XHRcdFx0XHR2YXIgbWVhc3VyZSA9IDA7XG5cdFx0XHRcdFx0dmFyIHRleHQgPSB0aGlzLmdldFRleHQoKTtcblx0XHRcdFx0XHRpZiAoY3VzdG9tRm9udC5pc1JUTCkgdGV4dCA9IHRleHQuc3BsaXQoXCJcIikucmV2ZXJzZSgpLmpvaW4oXCJcIik7XG5cdFx0XHRcdFx0dmFyIGR4ID0gc3ZnLlRvTnVtYmVyQXJyYXkodGhpcy5wYXJlbnQuYXR0cmlidXRlKCdkeCcpLnZhbHVlKTtcblx0XHRcdFx0XHRmb3IgKHZhciBpPTA7IGk8dGV4dC5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdFx0dmFyIGdseXBoID0gdGhpcy5nZXRHbHlwaChjdXN0b21Gb250LCB0ZXh0LCBpKTtcblx0XHRcdFx0XHRcdG1lYXN1cmUgKz0gKGdseXBoLmhvcml6QWR2WCB8fCBjdXN0b21Gb250Lmhvcml6QWR2WCkgKiBmb250U2l6ZSAvIGN1c3RvbUZvbnQuZm9udEZhY2UudW5pdHNQZXJFbTtcblx0XHRcdFx0XHRcdGlmICh0eXBlb2YoZHhbaV0pICE9ICd1bmRlZmluZWQnICYmICFpc05hTihkeFtpXSkpIHtcblx0XHRcdFx0XHRcdFx0bWVhc3VyZSArPSBkeFtpXTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cmV0dXJuIG1lYXN1cmU7XG5cdFx0XHRcdH1cblx0XHRcdFxuXHRcdFx0XHR2YXIgdGV4dFRvTWVhc3VyZSA9IHN2Zy5jb21wcmVzc1NwYWNlcyh0aGlzLmdldFRleHQoKSk7XG5cdFx0XHRcdGlmICghY3R4Lm1lYXN1cmVUZXh0KSByZXR1cm4gdGV4dFRvTWVhc3VyZS5sZW5ndGggKiAxMDtcblx0XHRcdFx0XG5cdFx0XHRcdGN0eC5zYXZlKCk7XG5cdFx0XHRcdHRoaXMuc2V0Q29udGV4dChjdHgpO1xuXHRcdFx0XHR2YXIgd2lkdGggPSBjdHgubWVhc3VyZVRleHQodGV4dFRvTWVhc3VyZSkud2lkdGg7XG5cdFx0XHRcdGN0eC5yZXN0b3JlKCk7XG5cdFx0XHRcdHJldHVybiB3aWR0aDtcblx0XHRcdH1cblx0XHR9XG5cdFx0c3ZnLkVsZW1lbnQuVGV4dEVsZW1lbnRCYXNlLnByb3RvdHlwZSA9IG5ldyBzdmcuRWxlbWVudC5SZW5kZXJlZEVsZW1lbnRCYXNlO1xuXHRcdFxuXHRcdC8vIHRzcGFuIFxuXHRcdHN2Zy5FbGVtZW50LnRzcGFuID0gZnVuY3Rpb24obm9kZSkge1xuXHRcdFx0dGhpcy5iYXNlID0gc3ZnLkVsZW1lbnQuVGV4dEVsZW1lbnRCYXNlO1xuXHRcdFx0dGhpcy5iYXNlKG5vZGUpO1xuXHRcdFx0XG5cdFx0XHR0aGlzLnRleHQgPSBub2RlLm5vZGVUeXBlID09IDMgPyBub2RlLm5vZGVWYWx1ZSA6IC8vIHRleHRcblx0XHRcdFx0XHRcdG5vZGUuY2hpbGROb2Rlcy5sZW5ndGggPiAwID8gbm9kZS5jaGlsZE5vZGVzWzBdLm5vZGVWYWx1ZSA6IC8vIGVsZW1lbnRcblx0XHRcdFx0XHRcdG5vZGUudGV4dDtcblx0XHRcdHRoaXMuZ2V0VGV4dCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gdGhpcy50ZXh0O1xuXHRcdFx0fVxuXHRcdH1cblx0XHRzdmcuRWxlbWVudC50c3Bhbi5wcm90b3R5cGUgPSBuZXcgc3ZnLkVsZW1lbnQuVGV4dEVsZW1lbnRCYXNlO1xuXHRcdFxuXHRcdC8vIHRyZWZcblx0XHRzdmcuRWxlbWVudC50cmVmID0gZnVuY3Rpb24obm9kZSkge1xuXHRcdFx0dGhpcy5iYXNlID0gc3ZnLkVsZW1lbnQuVGV4dEVsZW1lbnRCYXNlO1xuXHRcdFx0dGhpcy5iYXNlKG5vZGUpO1xuXHRcdFx0XG5cdFx0XHR0aGlzLmdldFRleHQgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyIGVsZW1lbnQgPSB0aGlzLmF0dHJpYnV0ZSgneGxpbms6aHJlZicpLkRlZmluaXRpb24uZ2V0RGVmaW5pdGlvbigpO1xuXHRcdFx0XHRpZiAoZWxlbWVudCAhPSBudWxsKSByZXR1cm4gZWxlbWVudC5jaGlsZHJlblswXS5nZXRUZXh0KCk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHN2Zy5FbGVtZW50LnRyZWYucHJvdG90eXBlID0gbmV3IHN2Zy5FbGVtZW50LlRleHRFbGVtZW50QmFzZTtcdFx0XG5cdFx0XG5cdFx0Ly8gYSBlbGVtZW50XG5cdFx0c3ZnLkVsZW1lbnQuYSA9IGZ1bmN0aW9uKG5vZGUpIHtcblx0XHRcdHRoaXMuYmFzZSA9IHN2Zy5FbGVtZW50LlRleHRFbGVtZW50QmFzZTtcblx0XHRcdHRoaXMuYmFzZShub2RlKTtcblx0XHRcdFxuXHRcdFx0dGhpcy5oYXNUZXh0ID0gdHJ1ZTtcblx0XHRcdGZvciAodmFyIGk9MDsgaTxub2RlLmNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0aWYgKG5vZGUuY2hpbGROb2Rlc1tpXS5ub2RlVHlwZSAhPSAzKSB0aGlzLmhhc1RleHQgPSBmYWxzZTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0Ly8gdGhpcyBtaWdodCBjb250YWluIHRleHRcblx0XHRcdHRoaXMudGV4dCA9IHRoaXMuaGFzVGV4dCA/IG5vZGUuY2hpbGROb2Rlc1swXS5ub2RlVmFsdWUgOiAnJztcblx0XHRcdHRoaXMuZ2V0VGV4dCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gdGhpcy50ZXh0O1xuXHRcdFx0fVx0XHRcblxuXHRcdFx0dGhpcy5iYXNlUmVuZGVyQ2hpbGRyZW4gPSB0aGlzLnJlbmRlckNoaWxkcmVuO1xuXHRcdFx0dGhpcy5yZW5kZXJDaGlsZHJlbiA9IGZ1bmN0aW9uKGN0eCkge1xuXHRcdFx0XHRpZiAodGhpcy5oYXNUZXh0KSB7XG5cdFx0XHRcdFx0Ly8gcmVuZGVyIGFzIHRleHQgZWxlbWVudFxuXHRcdFx0XHRcdHRoaXMuYmFzZVJlbmRlckNoaWxkcmVuKGN0eCk7XG5cdFx0XHRcdFx0dmFyIGZvbnRTaXplID0gbmV3IHN2Zy5Qcm9wZXJ0eSgnZm9udFNpemUnLCBzdmcuRm9udC5QYXJzZShzdmcuY3R4LmZvbnQpLmZvbnRTaXplKTtcblx0XHRcdFx0XHRzdmcuTW91c2UuY2hlY2tCb3VuZGluZ0JveCh0aGlzLCBuZXcgc3ZnLkJvdW5kaW5nQm94KHRoaXMueCwgdGhpcy55IC0gZm9udFNpemUuTGVuZ3RoLnRvUGl4ZWxzKCd5JyksIHRoaXMueCArIHRoaXMubWVhc3VyZVRleHQoY3R4KSwgdGhpcy55KSk7XHRcdFx0XHRcdFxuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdC8vIHJlbmRlciBhcyB0ZW1wb3JhcnkgZ3JvdXBcblx0XHRcdFx0XHR2YXIgZyA9IG5ldyBzdmcuRWxlbWVudC5nKCk7XG5cdFx0XHRcdFx0Zy5jaGlsZHJlbiA9IHRoaXMuY2hpbGRyZW47XG5cdFx0XHRcdFx0Zy5wYXJlbnQgPSB0aGlzO1xuXHRcdFx0XHRcdGcucmVuZGVyKGN0eCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0dGhpcy5vbmNsaWNrID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHdpbmRvdy5vcGVuKHRoaXMuYXR0cmlidXRlKCd4bGluazpocmVmJykudmFsdWUpO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHR0aGlzLm9ubW91c2Vtb3ZlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHN2Zy5jdHguY2FudmFzLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcblx0XHRcdH1cblx0XHR9XG5cdFx0c3ZnLkVsZW1lbnQuYS5wcm90b3R5cGUgPSBuZXcgc3ZnLkVsZW1lbnQuVGV4dEVsZW1lbnRCYXNlO1x0XHRcblx0XHRcblx0XHQvLyBpbWFnZSBlbGVtZW50XG5cdFx0c3ZnLkVsZW1lbnQuaW1hZ2UgPSBmdW5jdGlvbihub2RlKSB7XG5cdFx0XHR0aGlzLmJhc2UgPSBzdmcuRWxlbWVudC5SZW5kZXJlZEVsZW1lbnRCYXNlO1xuXHRcdFx0dGhpcy5iYXNlKG5vZGUpO1xuXHRcdFx0XG5cdFx0XHRzdmcuSW1hZ2VzLnB1c2godGhpcyk7XG5cdFx0XHR0aGlzLmltZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xuXHRcdFx0dGhpcy5sb2FkZWQgPSBmYWxzZTtcblx0XHRcdHZhciB0aGF0ID0gdGhpcztcblx0XHRcdHRoaXMuaW1nLm9ubG9hZCA9IGZ1bmN0aW9uKCkgeyB0aGF0LmxvYWRlZCA9IHRydWU7IH1cblx0XHRcdHRoaXMuaW1nLnNyYyA9IHRoaXMuYXR0cmlidXRlKCd4bGluazpocmVmJykudmFsdWU7XG5cdFx0XHRcblx0XHRcdHRoaXMucmVuZGVyQ2hpbGRyZW4gPSBmdW5jdGlvbihjdHgpIHtcblx0XHRcdFx0dmFyIHggPSB0aGlzLmF0dHJpYnV0ZSgneCcpLkxlbmd0aC50b1BpeGVscygneCcpO1xuXHRcdFx0XHR2YXIgeSA9IHRoaXMuYXR0cmlidXRlKCd5JykuTGVuZ3RoLnRvUGl4ZWxzKCd5Jyk7XG5cdFx0XHRcdFxuXHRcdFx0XHR2YXIgd2lkdGggPSB0aGlzLmF0dHJpYnV0ZSgnd2lkdGgnKS5MZW5ndGgudG9QaXhlbHMoJ3gnKTtcblx0XHRcdFx0dmFyIGhlaWdodCA9IHRoaXMuYXR0cmlidXRlKCdoZWlnaHQnKS5MZW5ndGgudG9QaXhlbHMoJ3knKTtcdFx0XHRcblx0XHRcdFx0aWYgKHdpZHRoID09IDAgfHwgaGVpZ2h0ID09IDApIHJldHVybjtcblx0XHRcdFxuXHRcdFx0XHRjdHguc2F2ZSgpO1xuXHRcdFx0XHRjdHgudHJhbnNsYXRlKHgsIHkpO1xuXHRcdFx0XHRzdmcuQXNwZWN0UmF0aW8oY3R4LFxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuYXR0cmlidXRlKCdwcmVzZXJ2ZUFzcGVjdFJhdGlvJykudmFsdWUsXG5cdFx0XHRcdFx0XHRcdFx0d2lkdGgsXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5pbWcud2lkdGgsXG5cdFx0XHRcdFx0XHRcdFx0aGVpZ2h0LFxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuaW1nLmhlaWdodCxcblx0XHRcdFx0XHRcdFx0XHQwLFxuXHRcdFx0XHRcdFx0XHRcdDApO1x0XG5cdFx0XHRcdGN0eC5kcmF3SW1hZ2UodGhpcy5pbWcsIDAsIDApO1x0XHRcdFxuXHRcdFx0XHRjdHgucmVzdG9yZSgpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRzdmcuRWxlbWVudC5pbWFnZS5wcm90b3R5cGUgPSBuZXcgc3ZnLkVsZW1lbnQuUmVuZGVyZWRFbGVtZW50QmFzZTtcblx0XHRcblx0XHQvLyBncm91cCBlbGVtZW50XG5cdFx0c3ZnLkVsZW1lbnQuZyA9IGZ1bmN0aW9uKG5vZGUpIHtcblx0XHRcdHRoaXMuYmFzZSA9IHN2Zy5FbGVtZW50LlJlbmRlcmVkRWxlbWVudEJhc2U7XG5cdFx0XHR0aGlzLmJhc2Uobm9kZSk7XG5cdFx0XHRcblx0XHRcdHRoaXMuZ2V0Qm91bmRpbmdCb3ggPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyIGJiID0gbmV3IHN2Zy5Cb3VuZGluZ0JveCgpO1xuXHRcdFx0XHRmb3IgKHZhciBpPTA7IGk8dGhpcy5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdGJiLmFkZEJvdW5kaW5nQm94KHRoaXMuY2hpbGRyZW5baV0uZ2V0Qm91bmRpbmdCb3goKSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIGJiO1xuXHRcdFx0fTtcblx0XHR9XG5cdFx0c3ZnLkVsZW1lbnQuZy5wcm90b3R5cGUgPSBuZXcgc3ZnLkVsZW1lbnQuUmVuZGVyZWRFbGVtZW50QmFzZTtcblxuXHRcdC8vIHN5bWJvbCBlbGVtZW50XG5cdFx0c3ZnLkVsZW1lbnQuc3ltYm9sID0gZnVuY3Rpb24obm9kZSkge1xuXHRcdFx0dGhpcy5iYXNlID0gc3ZnLkVsZW1lbnQuUmVuZGVyZWRFbGVtZW50QmFzZTtcblx0XHRcdHRoaXMuYmFzZShub2RlKTtcblx0XHRcdFxuXHRcdFx0dGhpcy5iYXNlU2V0Q29udGV4dCA9IHRoaXMuc2V0Q29udGV4dDtcblx0XHRcdHRoaXMuc2V0Q29udGV4dCA9IGZ1bmN0aW9uKGN0eCkge1x0XHRcblx0XHRcdFx0dGhpcy5iYXNlU2V0Q29udGV4dChjdHgpO1xuXHRcdFx0XHRcblx0XHRcdFx0Ly8gdmlld2JveFxuXHRcdFx0XHRpZiAodGhpcy5hdHRyaWJ1dGUoJ3ZpZXdCb3gnKS5oYXNWYWx1ZSgpKSB7XHRcdFx0XHRcblx0XHRcdFx0XHR2YXIgdmlld0JveCA9IHN2Zy5Ub051bWJlckFycmF5KHRoaXMuYXR0cmlidXRlKCd2aWV3Qm94JykudmFsdWUpO1xuXHRcdFx0XHRcdHZhciBtaW5YID0gdmlld0JveFswXTtcblx0XHRcdFx0XHR2YXIgbWluWSA9IHZpZXdCb3hbMV07XG5cdFx0XHRcdFx0d2lkdGggPSB2aWV3Qm94WzJdO1xuXHRcdFx0XHRcdGhlaWdodCA9IHZpZXdCb3hbM107XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0c3ZnLkFzcGVjdFJhdGlvKGN0eCxcblx0XHRcdFx0XHRcdFx0XHRcdHRoaXMuYXR0cmlidXRlKCdwcmVzZXJ2ZUFzcGVjdFJhdGlvJykudmFsdWUsIFxuXHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5hdHRyaWJ1dGUoJ3dpZHRoJykuTGVuZ3RoLnRvUGl4ZWxzKCd4JyksXG5cdFx0XHRcdFx0XHRcdFx0XHR3aWR0aCxcblx0XHRcdFx0XHRcdFx0XHRcdHRoaXMuYXR0cmlidXRlKCdoZWlnaHQnKS5MZW5ndGgudG9QaXhlbHMoJ3knKSxcblx0XHRcdFx0XHRcdFx0XHRcdGhlaWdodCxcblx0XHRcdFx0XHRcdFx0XHRcdG1pblgsXG5cdFx0XHRcdFx0XHRcdFx0XHRtaW5ZKTtcblxuXHRcdFx0XHRcdHN2Zy5WaWV3UG9ydC5TZXRDdXJyZW50KHZpZXdCb3hbMl0sIHZpZXdCb3hbM10pO1x0XHRcdFx0XHRcdFxuXHRcdFx0XHR9XG5cdFx0XHR9XHRcdFx0XG5cdFx0fVxuXHRcdHN2Zy5FbGVtZW50LnN5bWJvbC5wcm90b3R5cGUgPSBuZXcgc3ZnLkVsZW1lbnQuUmVuZGVyZWRFbGVtZW50QmFzZTtcdFx0XG5cdFx0XHRcblx0XHQvLyBzdHlsZSBlbGVtZW50XG5cdFx0c3ZnLkVsZW1lbnQuc3R5bGUgPSBmdW5jdGlvbihub2RlKSB7IFxuXHRcdFx0dGhpcy5iYXNlID0gc3ZnLkVsZW1lbnQuRWxlbWVudEJhc2U7XG5cdFx0XHR0aGlzLmJhc2Uobm9kZSk7XG5cdFx0XHRcblx0XHRcdC8vIHRleHQsIG9yIHNwYWNlcyB0aGVuIENEQVRBXG5cdFx0XHR2YXIgY3NzID0gbm9kZS5jaGlsZE5vZGVzWzBdLm5vZGVWYWx1ZSArIChub2RlLmNoaWxkTm9kZXMubGVuZ3RoID4gMSA/IG5vZGUuY2hpbGROb2Rlc1sxXS5ub2RlVmFsdWUgOiAnJyk7XG5cdFx0XHRjc3MgPSBjc3MucmVwbGFjZSgvKFxcL1xcKihbXipdfFtcXHJcXG5dfChcXCorKFteKlxcL118W1xcclxcbl0pKSkqXFwqK1xcLyl8KF5bXFxzXSpcXC9cXC8uKikvZ20sICcnKTsgLy8gcmVtb3ZlIGNvbW1lbnRzXG5cdFx0XHRjc3MgPSBzdmcuY29tcHJlc3NTcGFjZXMoY3NzKTsgLy8gcmVwbGFjZSB3aGl0ZXNwYWNlXG5cdFx0XHR2YXIgY3NzRGVmcyA9IGNzcy5zcGxpdCgnfScpO1xuXHRcdFx0Zm9yICh2YXIgaT0wOyBpPGNzc0RlZnMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0aWYgKHN2Zy50cmltKGNzc0RlZnNbaV0pICE9ICcnKSB7XG5cdFx0XHRcdFx0dmFyIGNzc0RlZiA9IGNzc0RlZnNbaV0uc3BsaXQoJ3snKTtcblx0XHRcdFx0XHR2YXIgY3NzQ2xhc3NlcyA9IGNzc0RlZlswXS5zcGxpdCgnLCcpO1xuXHRcdFx0XHRcdHZhciBjc3NQcm9wcyA9IGNzc0RlZlsxXS5zcGxpdCgnOycpO1xuXHRcdFx0XHRcdGZvciAodmFyIGo9MDsgajxjc3NDbGFzc2VzLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdFx0XHR2YXIgY3NzQ2xhc3MgPSBzdmcudHJpbShjc3NDbGFzc2VzW2pdKTtcblx0XHRcdFx0XHRcdGlmIChjc3NDbGFzcyAhPSAnJykge1xuXHRcdFx0XHRcdFx0XHR2YXIgcHJvcHMgPSB7fTtcblx0XHRcdFx0XHRcdFx0Zm9yICh2YXIgaz0wOyBrPGNzc1Byb3BzLmxlbmd0aDsgaysrKSB7XG5cdFx0XHRcdFx0XHRcdFx0dmFyIHByb3AgPSBjc3NQcm9wc1trXS5pbmRleE9mKCc6Jyk7XG5cdFx0XHRcdFx0XHRcdFx0dmFyIG5hbWUgPSBjc3NQcm9wc1trXS5zdWJzdHIoMCwgcHJvcCk7XG5cdFx0XHRcdFx0XHRcdFx0dmFyIHZhbHVlID0gY3NzUHJvcHNba10uc3Vic3RyKHByb3AgKyAxLCBjc3NQcm9wc1trXS5sZW5ndGggLSBwcm9wKTtcblx0XHRcdFx0XHRcdFx0XHRpZiAobmFtZSAhPSBudWxsICYmIHZhbHVlICE9IG51bGwpIHtcblx0XHRcdFx0XHRcdFx0XHRcdHByb3BzW3N2Zy50cmltKG5hbWUpXSA9IG5ldyBzdmcuUHJvcGVydHkoc3ZnLnRyaW0obmFtZSksIHN2Zy50cmltKHZhbHVlKSk7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdHN2Zy5TdHlsZXNbY3NzQ2xhc3NdID0gcHJvcHM7XG5cdFx0XHRcdFx0XHRcdGlmIChjc3NDbGFzcyA9PSAnQGZvbnQtZmFjZScpIHtcblx0XHRcdFx0XHRcdFx0XHR2YXIgZm9udEZhbWlseSA9IHByb3BzWydmb250LWZhbWlseSddLnZhbHVlLnJlcGxhY2UoL1wiL2csJycpO1xuXHRcdFx0XHRcdFx0XHRcdHZhciBzcmNzID0gcHJvcHNbJ3NyYyddLnZhbHVlLnNwbGl0KCcsJyk7XG5cdFx0XHRcdFx0XHRcdFx0Zm9yICh2YXIgcz0wOyBzPHNyY3MubGVuZ3RoOyBzKyspIHtcblx0XHRcdFx0XHRcdFx0XHRcdGlmIChzcmNzW3NdLmluZGV4T2YoJ2Zvcm1hdChcInN2Z1wiKScpID4gMCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR2YXIgdXJsU3RhcnQgPSBzcmNzW3NdLmluZGV4T2YoJ3VybCcpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR2YXIgdXJsRW5kID0gc3Jjc1tzXS5pbmRleE9mKCcpJywgdXJsU3RhcnQpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR2YXIgdXJsID0gc3Jjc1tzXS5zdWJzdHIodXJsU3RhcnQgKyA1LCB1cmxFbmQgLSB1cmxTdGFydCAtIDYpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR2YXIgZG9jID0gc3ZnLnBhcnNlWG1sKHN2Zy5hamF4KHVybCkpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR2YXIgZm9udHMgPSBkb2MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2ZvbnQnKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0Zm9yICh2YXIgZj0wOyBmPGZvbnRzLmxlbmd0aDsgZisrKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0dmFyIGZvbnQgPSBzdmcuQ3JlYXRlRWxlbWVudChmb250c1tmXSk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0c3ZnLkRlZmluaXRpb25zW2ZvbnRGYW1pbHldID0gZm9udDtcblx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRzdmcuRWxlbWVudC5zdHlsZS5wcm90b3R5cGUgPSBuZXcgc3ZnLkVsZW1lbnQuRWxlbWVudEJhc2U7XG5cdFx0XG5cdFx0Ly8gdXNlIGVsZW1lbnQgXG5cdFx0c3ZnLkVsZW1lbnQudXNlID0gZnVuY3Rpb24obm9kZSkge1xuXHRcdFx0dGhpcy5iYXNlID0gc3ZnLkVsZW1lbnQuUmVuZGVyZWRFbGVtZW50QmFzZTtcblx0XHRcdHRoaXMuYmFzZShub2RlKTtcblx0XHRcdFxuXHRcdFx0dGhpcy5iYXNlU2V0Q29udGV4dCA9IHRoaXMuc2V0Q29udGV4dDtcblx0XHRcdHRoaXMuc2V0Q29udGV4dCA9IGZ1bmN0aW9uKGN0eCkge1xuXHRcdFx0XHR0aGlzLmJhc2VTZXRDb250ZXh0KGN0eCk7XG5cdFx0XHRcdGlmICh0aGlzLmF0dHJpYnV0ZSgneCcpLmhhc1ZhbHVlKCkpIGN0eC50cmFuc2xhdGUodGhpcy5hdHRyaWJ1dGUoJ3gnKS5MZW5ndGgudG9QaXhlbHMoJ3gnKSwgMCk7XG5cdFx0XHRcdGlmICh0aGlzLmF0dHJpYnV0ZSgneScpLmhhc1ZhbHVlKCkpIGN0eC50cmFuc2xhdGUoMCwgdGhpcy5hdHRyaWJ1dGUoJ3knKS5MZW5ndGgudG9QaXhlbHMoJ3knKSk7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdHRoaXMuZ2V0RGVmaW5pdGlvbiA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR2YXIgZWxlbWVudCA9IHRoaXMuYXR0cmlidXRlKCd4bGluazpocmVmJykuRGVmaW5pdGlvbi5nZXREZWZpbml0aW9uKCk7XG5cdFx0XHRcdGlmICh0aGlzLmF0dHJpYnV0ZSgnd2lkdGgnKS5oYXNWYWx1ZSgpKSBlbGVtZW50LmF0dHJpYnV0ZSgnd2lkdGgnLCB0cnVlKS52YWx1ZSA9IHRoaXMuYXR0cmlidXRlKCd3aWR0aCcpLnZhbHVlO1xuXHRcdFx0XHRpZiAodGhpcy5hdHRyaWJ1dGUoJ2hlaWdodCcpLmhhc1ZhbHVlKCkpIGVsZW1lbnQuYXR0cmlidXRlKCdoZWlnaHQnLCB0cnVlKS52YWx1ZSA9IHRoaXMuYXR0cmlidXRlKCdoZWlnaHQnKS52YWx1ZTtcblx0XHRcdFx0cmV0dXJuIGVsZW1lbnQ7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdHRoaXMucGF0aCA9IGZ1bmN0aW9uKGN0eCkge1xuXHRcdFx0XHR2YXIgZWxlbWVudCA9IHRoaXMuZ2V0RGVmaW5pdGlvbigpO1xuXHRcdFx0XHRpZiAoZWxlbWVudCAhPSBudWxsKSBlbGVtZW50LnBhdGgoY3R4KTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0dGhpcy5yZW5kZXJDaGlsZHJlbiA9IGZ1bmN0aW9uKGN0eCkge1xuXHRcdFx0XHR2YXIgZWxlbWVudCA9IHRoaXMuZ2V0RGVmaW5pdGlvbigpO1xuXHRcdFx0XHRpZiAoZWxlbWVudCAhPSBudWxsKSBlbGVtZW50LnJlbmRlcihjdHgpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRzdmcuRWxlbWVudC51c2UucHJvdG90eXBlID0gbmV3IHN2Zy5FbGVtZW50LlJlbmRlcmVkRWxlbWVudEJhc2U7XG5cdFx0XG5cdFx0Ly8gbWFzayBlbGVtZW50XG5cdFx0c3ZnLkVsZW1lbnQubWFzayA9IGZ1bmN0aW9uKG5vZGUpIHtcblx0XHRcdHRoaXMuYmFzZSA9IHN2Zy5FbGVtZW50LkVsZW1lbnRCYXNlO1xuXHRcdFx0dGhpcy5iYXNlKG5vZGUpO1xuXHRcdFx0XHRcdFx0XG5cdFx0XHR0aGlzLmFwcGx5ID0gZnVuY3Rpb24oY3R4LCBlbGVtZW50KSB7XG5cdFx0XHRcdC8vIHJlbmRlciBhcyB0ZW1wIHN2Z1x0XG5cdFx0XHRcdHZhciB4ID0gdGhpcy5hdHRyaWJ1dGUoJ3gnKS5MZW5ndGgudG9QaXhlbHMoJ3gnKTtcblx0XHRcdFx0dmFyIHkgPSB0aGlzLmF0dHJpYnV0ZSgneScpLkxlbmd0aC50b1BpeGVscygneScpO1xuXHRcdFx0XHR2YXIgd2lkdGggPSB0aGlzLmF0dHJpYnV0ZSgnd2lkdGgnKS5MZW5ndGgudG9QaXhlbHMoJ3gnKTtcblx0XHRcdFx0dmFyIGhlaWdodCA9IHRoaXMuYXR0cmlidXRlKCdoZWlnaHQnKS5MZW5ndGgudG9QaXhlbHMoJ3knKTtcblx0XHRcdFx0XG5cdFx0XHRcdC8vIHRlbXBvcmFyaWx5IHJlbW92ZSBtYXNrIHRvIGF2b2lkIHJlY3Vyc2lvblxuXHRcdFx0XHR2YXIgbWFzayA9IGVsZW1lbnQuYXR0cmlidXRlKCdtYXNrJykudmFsdWU7XG5cdFx0XHRcdGVsZW1lbnQuYXR0cmlidXRlKCdtYXNrJykudmFsdWUgPSAnJztcblx0XHRcdFx0XG5cdFx0XHRcdFx0dmFyIGNNYXNrID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG5cdFx0XHRcdFx0Y01hc2sud2lkdGggPSB4ICsgd2lkdGg7XG5cdFx0XHRcdFx0Y01hc2suaGVpZ2h0ID0geSArIGhlaWdodDtcblx0XHRcdFx0XHR2YXIgbWFza0N0eCA9IGNNYXNrLmdldENvbnRleHQoJzJkJyk7XG5cdFx0XHRcdFx0dGhpcy5yZW5kZXJDaGlsZHJlbihtYXNrQ3R4KTtcblx0XHRcdFx0XG5cdFx0XHRcdFx0dmFyIGMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcblx0XHRcdFx0XHRjLndpZHRoID0geCArIHdpZHRoO1xuXHRcdFx0XHRcdGMuaGVpZ2h0ID0geSArIGhlaWdodDtcblx0XHRcdFx0XHR2YXIgdGVtcEN0eCA9IGMuZ2V0Q29udGV4dCgnMmQnKTtcblx0XHRcdFx0XHRlbGVtZW50LnJlbmRlcih0ZW1wQ3R4KTtcblx0XHRcdFx0XHR0ZW1wQ3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9ICdkZXN0aW5hdGlvbi1pbic7XG5cdFx0XHRcdFx0dGVtcEN0eC5maWxsU3R5bGUgPSBtYXNrQ3R4LmNyZWF0ZVBhdHRlcm4oY01hc2ssICduby1yZXBlYXQnKTtcblx0XHRcdFx0XHR0ZW1wQ3R4LmZpbGxSZWN0KDAsIDAsIHggKyB3aWR0aCwgeSArIGhlaWdodCk7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0Y3R4LmZpbGxTdHlsZSA9IHRlbXBDdHguY3JlYXRlUGF0dGVybihjLCAnbm8tcmVwZWF0Jyk7XG5cdFx0XHRcdFx0Y3R4LmZpbGxSZWN0KDAsIDAsIHggKyB3aWR0aCwgeSArIGhlaWdodCk7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdC8vIHJlYXNzaWduIG1hc2tcblx0XHRcdFx0ZWxlbWVudC5hdHRyaWJ1dGUoJ21hc2snKS52YWx1ZSA9IG1hc2s7XHRcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0dGhpcy5yZW5kZXIgPSBmdW5jdGlvbihjdHgpIHtcblx0XHRcdFx0Ly8gTk8gUkVOREVSXG5cdFx0XHR9XG5cdFx0fVxuXHRcdHN2Zy5FbGVtZW50Lm1hc2sucHJvdG90eXBlID0gbmV3IHN2Zy5FbGVtZW50LkVsZW1lbnRCYXNlO1xuXHRcdFxuXHRcdC8vIGNsaXAgZWxlbWVudFxuXHRcdHN2Zy5FbGVtZW50LmNsaXBQYXRoID0gZnVuY3Rpb24obm9kZSkge1xuXHRcdFx0dGhpcy5iYXNlID0gc3ZnLkVsZW1lbnQuRWxlbWVudEJhc2U7XG5cdFx0XHR0aGlzLmJhc2Uobm9kZSk7XG5cdFx0XHRcblx0XHRcdHRoaXMuYXBwbHkgPSBmdW5jdGlvbihjdHgpIHtcblx0XHRcdFx0Zm9yICh2YXIgaT0wOyBpPHRoaXMuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRpZiAodGhpcy5jaGlsZHJlbltpXS5wYXRoKSB7XG5cdFx0XHRcdFx0XHR0aGlzLmNoaWxkcmVuW2ldLnBhdGgoY3R4KTtcblx0XHRcdFx0XHRcdGN0eC5jbGlwKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdHRoaXMucmVuZGVyID0gZnVuY3Rpb24oY3R4KSB7XG5cdFx0XHRcdC8vIE5PIFJFTkRFUlxuXHRcdFx0fVxuXHRcdH1cblx0XHRzdmcuRWxlbWVudC5jbGlwUGF0aC5wcm90b3R5cGUgPSBuZXcgc3ZnLkVsZW1lbnQuRWxlbWVudEJhc2U7XG5cblx0XHQvLyBmaWx0ZXJzXG5cdFx0c3ZnLkVsZW1lbnQuZmlsdGVyID0gZnVuY3Rpb24obm9kZSkge1xuXHRcdFx0dGhpcy5iYXNlID0gc3ZnLkVsZW1lbnQuRWxlbWVudEJhc2U7XG5cdFx0XHR0aGlzLmJhc2Uobm9kZSk7XG5cdFx0XHRcdFx0XHRcblx0XHRcdHRoaXMuYXBwbHkgPSBmdW5jdGlvbihjdHgsIGVsZW1lbnQpIHtcblx0XHRcdFx0Ly8gcmVuZGVyIGFzIHRlbXAgc3ZnXHRcblx0XHRcdFx0dmFyIGJiID0gZWxlbWVudC5nZXRCb3VuZGluZ0JveCgpO1xuXHRcdFx0XHR2YXIgeCA9IHRoaXMuYXR0cmlidXRlKCd4JykuTGVuZ3RoLnRvUGl4ZWxzKCd4Jyk7XG5cdFx0XHRcdHZhciB5ID0gdGhpcy5hdHRyaWJ1dGUoJ3knKS5MZW5ndGgudG9QaXhlbHMoJ3knKTtcblx0XHRcdFx0aWYgKHggPT0gMCB8fCB5ID09IDApIHtcblx0XHRcdFx0XHR4ID0gYmIueDE7XG5cdFx0XHRcdFx0eSA9IGJiLnkxO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHZhciB3aWR0aCA9IHRoaXMuYXR0cmlidXRlKCd3aWR0aCcpLkxlbmd0aC50b1BpeGVscygneCcpO1xuXHRcdFx0XHR2YXIgaGVpZ2h0ID0gdGhpcy5hdHRyaWJ1dGUoJ2hlaWdodCcpLkxlbmd0aC50b1BpeGVscygneScpO1xuXHRcdFx0XHRpZiAod2lkdGggPT0gMCB8fCBoZWlnaHQgPT0gMCkge1xuXHRcdFx0XHRcdHdpZHRoID0gYmIud2lkdGgoKTtcblx0XHRcdFx0XHRoZWlnaHQgPSBiYi5oZWlnaHQoKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdFx0Ly8gdGVtcG9yYXJpbHkgcmVtb3ZlIGZpbHRlciB0byBhdm9pZCByZWN1cnNpb25cblx0XHRcdFx0dmFyIGZpbHRlciA9IGVsZW1lbnQuc3R5bGUoJ2ZpbHRlcicpLnZhbHVlO1xuXHRcdFx0XHRlbGVtZW50LnN0eWxlKCdmaWx0ZXInKS52YWx1ZSA9ICcnO1xuXHRcdFx0XHRcblx0XHRcdFx0Ly8gbWF4IGZpbHRlciBkaXN0YW5jZVxuXHRcdFx0XHR2YXIgZXh0cmFQZXJjZW50ID0gLjIwO1xuXHRcdFx0XHR2YXIgcHggPSBleHRyYVBlcmNlbnQgKiB3aWR0aDtcblx0XHRcdFx0dmFyIHB5ID0gZXh0cmFQZXJjZW50ICogaGVpZ2h0O1xuXHRcdFx0XHRcblx0XHRcdFx0dmFyIGMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcblx0XHRcdFx0Yy53aWR0aCA9IHdpZHRoICsgMipweDtcblx0XHRcdFx0Yy5oZWlnaHQgPSBoZWlnaHQgKyAyKnB5O1xuXHRcdFx0XHR2YXIgdGVtcEN0eCA9IGMuZ2V0Q29udGV4dCgnMmQnKTtcblx0XHRcdFx0dGVtcEN0eC50cmFuc2xhdGUoLXggKyBweCwgLXkgKyBweSk7XG5cdFx0XHRcdGVsZW1lbnQucmVuZGVyKHRlbXBDdHgpO1xuXHRcdFx0XG5cdFx0XHRcdC8vIGFwcGx5IGZpbHRlcnNcblx0XHRcdFx0Zm9yICh2YXIgaT0wOyBpPHRoaXMuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHR0aGlzLmNoaWxkcmVuW2ldLmFwcGx5KHRlbXBDdHgsIDAsIDAsIHdpZHRoICsgMipweCwgaGVpZ2h0ICsgMipweSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHRcdC8vIHJlbmRlciBvbiBtZVxuXHRcdFx0XHRjdHguZHJhd0ltYWdlKGMsIDAsIDAsIHdpZHRoICsgMipweCwgaGVpZ2h0ICsgMipweSwgeCAtIHB4LCB5IC0gcHksIHdpZHRoICsgMipweCwgaGVpZ2h0ICsgMipweSk7XG5cdFx0XHRcdFxuXHRcdFx0XHQvLyByZWFzc2lnbiBmaWx0ZXJcblx0XHRcdFx0ZWxlbWVudC5zdHlsZSgnZmlsdGVyJywgdHJ1ZSkudmFsdWUgPSBmaWx0ZXI7XHRcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0dGhpcy5yZW5kZXIgPSBmdW5jdGlvbihjdHgpIHtcblx0XHRcdFx0Ly8gTk8gUkVOREVSXG5cdFx0XHR9XHRcdFxuXHRcdH1cblx0XHRzdmcuRWxlbWVudC5maWx0ZXIucHJvdG90eXBlID0gbmV3IHN2Zy5FbGVtZW50LkVsZW1lbnRCYXNlO1xuXHRcdFxuXHRcdHN2Zy5FbGVtZW50LmZlR2F1c3NpYW5CbHVyID0gZnVuY3Rpb24obm9kZSkge1xuXHRcdFx0dGhpcy5iYXNlID0gc3ZnLkVsZW1lbnQuRWxlbWVudEJhc2U7XG5cdFx0XHR0aGlzLmJhc2Uobm9kZSk7XHRcblx0XHRcdFxuXHRcdFx0ZnVuY3Rpb24gbWFrZV9mZ2F1c3Moc2lnbWEpIHtcblx0XHRcdFx0c2lnbWEgPSBNYXRoLm1heChzaWdtYSwgMC4wMSk7XHRcdFx0ICAgICAgXG5cdFx0XHRcdHZhciBsZW4gPSBNYXRoLmNlaWwoc2lnbWEgKiA0LjApICsgMTsgICAgICAgICAgICAgICAgICAgICBcblx0XHRcdFx0bWFzayA9IFtdOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykgeyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG5cdFx0XHRcdFx0bWFza1tpXSA9IE1hdGguZXhwKC0wLjUgKiAoaSAvIHNpZ21hKSAqIChpIC8gc2lnbWEpKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG5cdFx0XHRcdH0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuXHRcdFx0XHRyZXR1cm4gbWFzazsgXG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdGZ1bmN0aW9uIG5vcm1hbGl6ZShtYXNrKSB7XG5cdFx0XHRcdHZhciBzdW0gPSAwO1xuXHRcdFx0XHRmb3IgKHZhciBpID0gMTsgaSA8IG1hc2subGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRzdW0gKz0gTWF0aC5hYnMobWFza1tpXSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0c3VtID0gMiAqIHN1bSArIE1hdGguYWJzKG1hc2tbMF0pO1xuXHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IG1hc2subGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRtYXNrW2ldIC89IHN1bTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gbWFzaztcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0ZnVuY3Rpb24gY29udm9sdmVfZXZlbihzcmMsIGRzdCwgbWFzaywgd2lkdGgsIGhlaWdodCkge1xuXHRcdFx0ICBmb3IgKHZhciB5ID0gMDsgeSA8IGhlaWdodDsgeSsrKSB7XG5cdFx0XHRcdGZvciAodmFyIHggPSAwOyB4IDwgd2lkdGg7IHgrKykge1xuXHRcdFx0XHQgIHZhciBhID0gaW1HZXQoc3JjLCB4LCB5LCB3aWR0aCwgaGVpZ2h0LCAzKS8yNTU7XG5cdFx0XHRcdCAgZm9yICh2YXIgcmdiYSA9IDA7IHJnYmEgPCA0OyByZ2JhKyspIHtcdFx0XHRcdFx0ICBcblx0XHRcdFx0XHQgIHZhciBzdW0gPSBtYXNrWzBdICogKGE9PTA/MjU1OmltR2V0KHNyYywgeCwgeSwgd2lkdGgsIGhlaWdodCwgcmdiYSkpICogKGE9PTB8fHJnYmE9PTM/MTphKTtcblx0XHRcdFx0XHQgIGZvciAodmFyIGkgPSAxOyBpIDwgbWFzay5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdFx0dmFyIGExID0gaW1HZXQoc3JjLCBNYXRoLm1heCh4LWksMCksIHksIHdpZHRoLCBoZWlnaHQsIDMpLzI1NTtcblx0XHRcdFx0XHQgICAgdmFyIGEyID0gaW1HZXQoc3JjLCBNYXRoLm1pbih4K2ksIHdpZHRoLTEpLCB5LCB3aWR0aCwgaGVpZ2h0LCAzKS8yNTU7XG5cdFx0XHRcdFx0XHRzdW0gKz0gbWFza1tpXSAqIFxuXHRcdFx0XHRcdFx0ICAoKGExPT0wPzI1NTppbUdldChzcmMsIE1hdGgubWF4KHgtaSwwKSwgeSwgd2lkdGgsIGhlaWdodCwgcmdiYSkpICogKGExPT0wfHxyZ2JhPT0zPzE6YTEpICsgXG5cdFx0XHRcdFx0XHQgICAoYTI9PTA/MjU1OmltR2V0KHNyYywgTWF0aC5taW4oeCtpLCB3aWR0aC0xKSwgeSwgd2lkdGgsIGhlaWdodCwgcmdiYSkpICogKGEyPT0wfHxyZ2JhPT0zPzE6YTIpKTtcblx0XHRcdFx0XHQgIH1cblx0XHRcdFx0XHQgIGltU2V0KGRzdCwgeSwgeCwgaGVpZ2h0LCB3aWR0aCwgcmdiYSwgc3VtKTtcblx0XHRcdFx0ICB9XHRcdFx0ICBcblx0XHRcdFx0fVxuXHRcdFx0ICB9XG5cdFx0XHR9XHRcdFxuXG5cdFx0XHRmdW5jdGlvbiBpbUdldChpbWcsIHgsIHksIHdpZHRoLCBoZWlnaHQsIHJnYmEpIHtcblx0XHRcdFx0cmV0dXJuIGltZ1t5KndpZHRoKjQgKyB4KjQgKyByZ2JhXTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0ZnVuY3Rpb24gaW1TZXQoaW1nLCB4LCB5LCB3aWR0aCwgaGVpZ2h0LCByZ2JhLCB2YWwpIHtcblx0XHRcdFx0aW1nW3kqd2lkdGgqNCArIHgqNCArIHJnYmFdID0gdmFsO1xuXHRcdFx0fVxuXHRcdFx0XHRcdFx0XG5cdFx0XHRmdW5jdGlvbiBibHVyKGN0eCwgd2lkdGgsIGhlaWdodCwgc2lnbWEpXG5cdFx0XHR7XG5cdFx0XHRcdHZhciBzcmNEYXRhID0gY3R4LmdldEltYWdlRGF0YSgwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcblx0XHRcdFx0dmFyIG1hc2sgPSBtYWtlX2ZnYXVzcyhzaWdtYSk7XG5cdFx0XHRcdG1hc2sgPSBub3JtYWxpemUobWFzayk7XG5cdFx0XHRcdHRtcCA9IFtdO1xuXHRcdFx0XHRjb252b2x2ZV9ldmVuKHNyY0RhdGEuZGF0YSwgdG1wLCBtYXNrLCB3aWR0aCwgaGVpZ2h0KTtcblx0XHRcdFx0Y29udm9sdmVfZXZlbih0bXAsIHNyY0RhdGEuZGF0YSwgbWFzaywgaGVpZ2h0LCB3aWR0aCk7XG5cdFx0XHRcdGN0eC5jbGVhclJlY3QoMCwgMCwgd2lkdGgsIGhlaWdodCk7XG5cdFx0XHRcdGN0eC5wdXRJbWFnZURhdGEoc3JjRGF0YSwgMCwgMCk7XG5cdFx0XHR9XHRcdFx0XG5cdFx0XG5cdFx0XHR0aGlzLmFwcGx5ID0gZnVuY3Rpb24oY3R4LCB4LCB5LCB3aWR0aCwgaGVpZ2h0KSB7XG5cdFx0XHRcdC8vIGFzc3VtaW5nIHg9PTAgJiYgeT09MCBmb3Igbm93XG5cdFx0XHRcdGJsdXIoY3R4LCB3aWR0aCwgaGVpZ2h0LCB0aGlzLmF0dHJpYnV0ZSgnc3RkRGV2aWF0aW9uJykubnVtVmFsdWUoKSk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHN2Zy5FbGVtZW50LmZpbHRlci5wcm90b3R5cGUgPSBuZXcgc3ZnLkVsZW1lbnQuZmVHYXVzc2lhbkJsdXI7XG5cdFx0XG5cdFx0Ly8gdGl0bGUgZWxlbWVudCwgZG8gbm90aGluZ1xuXHRcdHN2Zy5FbGVtZW50LnRpdGxlID0gZnVuY3Rpb24obm9kZSkge1xuXHRcdH1cblx0XHRzdmcuRWxlbWVudC50aXRsZS5wcm90b3R5cGUgPSBuZXcgc3ZnLkVsZW1lbnQuRWxlbWVudEJhc2U7XG5cblx0XHQvLyBkZXNjIGVsZW1lbnQsIGRvIG5vdGhpbmdcblx0XHRzdmcuRWxlbWVudC5kZXNjID0gZnVuY3Rpb24obm9kZSkge1xuXHRcdH1cblx0XHRzdmcuRWxlbWVudC5kZXNjLnByb3RvdHlwZSA9IG5ldyBzdmcuRWxlbWVudC5FbGVtZW50QmFzZTtcdFx0XG5cdFx0XG5cdFx0c3ZnLkVsZW1lbnQuTUlTU0lORyA9IGZ1bmN0aW9uKG5vZGUpIHtcblx0XHRcdGNvbnNvbGUubG9nKCdFUlJPUjogRWxlbWVudCBcXCcnICsgbm9kZS5ub2RlTmFtZSArICdcXCcgbm90IHlldCBpbXBsZW1lbnRlZC4nKTtcblx0XHR9XG5cdFx0c3ZnLkVsZW1lbnQuTUlTU0lORy5wcm90b3R5cGUgPSBuZXcgc3ZnLkVsZW1lbnQuRWxlbWVudEJhc2U7XG5cdFx0XG5cdFx0Ly8gZWxlbWVudCBmYWN0b3J5XG5cdFx0c3ZnLkNyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbihub2RlKSB7XHRcblx0XHRcdHZhciBjbGFzc05hbWUgPSBub2RlLm5vZGVOYW1lLnJlcGxhY2UoL15bXjpdKzovLCcnKTsgLy8gcmVtb3ZlIG5hbWVzcGFjZVxuXHRcdFx0Y2xhc3NOYW1lID0gY2xhc3NOYW1lLnJlcGxhY2UoL1xcLS9nLCcnKTsgLy8gcmVtb3ZlIGRhc2hlc1xuXHRcdFx0dmFyIGUgPSBudWxsO1xuXHRcdFx0aWYgKHR5cGVvZihzdmcuRWxlbWVudFtjbGFzc05hbWVdKSAhPSAndW5kZWZpbmVkJykge1xuXHRcdFx0XHRlID0gbmV3IHN2Zy5FbGVtZW50W2NsYXNzTmFtZV0obm9kZSk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0ZSA9IG5ldyBzdmcuRWxlbWVudC5NSVNTSU5HKG5vZGUpO1xuXHRcdFx0fVxuXG5cdFx0XHRlLnR5cGUgPSBub2RlLm5vZGVOYW1lO1xuXHRcdFx0cmV0dXJuIGU7XG5cdFx0fVxuXHRcdFx0XHRcblx0XHQvLyBsb2FkIGZyb20gdXJsXG5cdFx0c3ZnLmxvYWQgPSBmdW5jdGlvbihjdHgsIHVybCkge1xuXHRcdFx0c3ZnLmxvYWRYbWwoY3R4LCBzdmcuYWpheCh1cmwpKTtcblx0XHR9XG5cdFx0XG5cdFx0Ly8gbG9hZCBmcm9tIHhtbFxuXHRcdHN2Zy5sb2FkWG1sID0gZnVuY3Rpb24oY3R4LCB4bWwpIHtcblx0XHRcdHN2Zy5sb2FkWG1sRG9jKGN0eCwgc3ZnLnBhcnNlWG1sKHhtbCkpO1xuXHRcdH1cblx0XHRcblx0XHRzdmcubG9hZFhtbERvYyA9IGZ1bmN0aW9uKGN0eCwgZG9tKSB7XG5cdFx0XHRzdmcuaW5pdChjdHgpO1xuXHRcdFx0XG5cdFx0XHR2YXIgbWFwWFkgPSBmdW5jdGlvbihwKSB7XG5cdFx0XHRcdHZhciBlID0gY3R4LmNhbnZhcztcblx0XHRcdFx0d2hpbGUgKGUpIHtcblx0XHRcdFx0XHRwLnggLT0gZS5vZmZzZXRMZWZ0O1xuXHRcdFx0XHRcdHAueSAtPSBlLm9mZnNldFRvcDtcblx0XHRcdFx0XHRlID0gZS5vZmZzZXRQYXJlbnQ7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKHdpbmRvdy5zY3JvbGxYKSBwLnggKz0gd2luZG93LnNjcm9sbFg7XG5cdFx0XHRcdGlmICh3aW5kb3cuc2Nyb2xsWSkgcC55ICs9IHdpbmRvdy5zY3JvbGxZO1xuXHRcdFx0XHRyZXR1cm4gcDtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0Ly8gYmluZCBtb3VzZVxuXHRcdFx0aWYgKHN2Zy5vcHRzWydpZ25vcmVNb3VzZSddICE9IHRydWUpIHtcblx0XHRcdFx0Y3R4LmNhbnZhcy5vbmNsaWNrID0gZnVuY3Rpb24oZSkge1xuXHRcdFx0XHRcdHZhciBwID0gbWFwWFkobmV3IHN2Zy5Qb2ludChlICE9IG51bGwgPyBlLmNsaWVudFggOiBldmVudC5jbGllbnRYLCBlICE9IG51bGwgPyBlLmNsaWVudFkgOiBldmVudC5jbGllbnRZKSk7XG5cdFx0XHRcdFx0c3ZnLk1vdXNlLm9uY2xpY2socC54LCBwLnkpO1xuXHRcdFx0XHR9O1xuXHRcdFx0XHRjdHguY2FudmFzLm9ubW91c2Vtb3ZlID0gZnVuY3Rpb24oZSkge1xuXHRcdFx0XHRcdHZhciBwID0gbWFwWFkobmV3IHN2Zy5Qb2ludChlICE9IG51bGwgPyBlLmNsaWVudFggOiBldmVudC5jbGllbnRYLCBlICE9IG51bGwgPyBlLmNsaWVudFkgOiBldmVudC5jbGllbnRZKSk7XG5cdFx0XHRcdFx0c3ZnLk1vdXNlLm9ubW91c2Vtb3ZlKHAueCwgcC55KTtcblx0XHRcdFx0fTtcblx0XHRcdH1cblx0XHRcblx0XHRcdHZhciBlID0gc3ZnLkNyZWF0ZUVsZW1lbnQoZG9tLmRvY3VtZW50RWxlbWVudCk7XG5cdFx0XHRlLnJvb3QgPSB0cnVlO1xuXHRcdFx0XHRcdFxuXHRcdFx0Ly8gcmVuZGVyIGxvb3Bcblx0XHRcdHZhciBpc0ZpcnN0UmVuZGVyID0gdHJ1ZTtcblx0XHRcdHZhciBkcmF3ID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHN2Zy5WaWV3UG9ydC5DbGVhcigpO1xuXHRcdFx0XHRpZiAoY3R4LmNhbnZhcy5wYXJlbnROb2RlKSBzdmcuVmlld1BvcnQuU2V0Q3VycmVudChjdHguY2FudmFzLnBhcmVudE5vZGUuY2xpZW50V2lkdGgsIGN0eC5jYW52YXMucGFyZW50Tm9kZS5jbGllbnRIZWlnaHQpO1xuXHRcdFx0XG5cdFx0XHRcdGlmIChzdmcub3B0c1snaWdub3JlRGltZW5zaW9ucyddICE9IHRydWUpIHtcblx0XHRcdFx0XHQvLyBzZXQgY2FudmFzIHNpemVcblx0XHRcdFx0XHRpZiAoZS5zdHlsZSgnd2lkdGgnKS5oYXNWYWx1ZSgpKSB7XG5cdFx0XHRcdFx0XHRjdHguY2FudmFzLndpZHRoID0gZS5zdHlsZSgnd2lkdGgnKS5MZW5ndGgudG9QaXhlbHMoJ3gnKTtcblx0XHRcdFx0XHRcdGN0eC5jYW52YXMuc3R5bGUud2lkdGggPSBjdHguY2FudmFzLndpZHRoICsgJ3B4Jztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYgKGUuc3R5bGUoJ2hlaWdodCcpLmhhc1ZhbHVlKCkpIHtcblx0XHRcdFx0XHRcdGN0eC5jYW52YXMuaGVpZ2h0ID0gZS5zdHlsZSgnaGVpZ2h0JykuTGVuZ3RoLnRvUGl4ZWxzKCd5Jyk7XG5cdFx0XHRcdFx0XHRjdHguY2FudmFzLnN0eWxlLmhlaWdodCA9IGN0eC5jYW52YXMuaGVpZ2h0ICsgJ3B4Jztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0dmFyIGNXaWR0aCA9IGN0eC5jYW52YXMuY2xpZW50V2lkdGggfHwgY3R4LmNhbnZhcy53aWR0aDtcblx0XHRcdFx0dmFyIGNIZWlnaHQgPSBjdHguY2FudmFzLmNsaWVudEhlaWdodCB8fCBjdHguY2FudmFzLmhlaWdodDtcblx0XHRcdFx0c3ZnLlZpZXdQb3J0LlNldEN1cnJlbnQoY1dpZHRoLCBjSGVpZ2h0KTtcdFx0XG5cdFx0XHRcdFxuXHRcdFx0XHRpZiAoc3ZnLm9wdHMgIT0gbnVsbCAmJiBzdmcub3B0c1snb2Zmc2V0WCddICE9IG51bGwpIGUuYXR0cmlidXRlKCd4JywgdHJ1ZSkudmFsdWUgPSBzdmcub3B0c1snb2Zmc2V0WCddO1xuXHRcdFx0XHRpZiAoc3ZnLm9wdHMgIT0gbnVsbCAmJiBzdmcub3B0c1snb2Zmc2V0WSddICE9IG51bGwpIGUuYXR0cmlidXRlKCd5JywgdHJ1ZSkudmFsdWUgPSBzdmcub3B0c1snb2Zmc2V0WSddO1xuXHRcdFx0XHRpZiAoc3ZnLm9wdHMgIT0gbnVsbCAmJiBzdmcub3B0c1snc2NhbGVXaWR0aCddICE9IG51bGwgJiYgc3ZnLm9wdHNbJ3NjYWxlSGVpZ2h0J10gIT0gbnVsbCkge1xuXHRcdFx0XHRcdHZhciB4UmF0aW8gPSAxLCB5UmF0aW8gPSAxO1xuXHRcdFx0XHRcdGlmIChlLmF0dHJpYnV0ZSgnd2lkdGgnKS5oYXNWYWx1ZSgpKSB4UmF0aW8gPSBlLmF0dHJpYnV0ZSgnd2lkdGgnKS5MZW5ndGgudG9QaXhlbHMoJ3gnKSAvIHN2Zy5vcHRzWydzY2FsZVdpZHRoJ107XG5cdFx0XHRcdFx0aWYgKGUuYXR0cmlidXRlKCdoZWlnaHQnKS5oYXNWYWx1ZSgpKSB5UmF0aW8gPSBlLmF0dHJpYnV0ZSgnaGVpZ2h0JykuTGVuZ3RoLnRvUGl4ZWxzKCd5JykgLyBzdmcub3B0c1snc2NhbGVIZWlnaHQnXTtcblx0XHRcdFx0XG5cdFx0XHRcdFx0ZS5hdHRyaWJ1dGUoJ3dpZHRoJywgdHJ1ZSkudmFsdWUgPSBzdmcub3B0c1snc2NhbGVXaWR0aCddO1xuXHRcdFx0XHRcdGUuYXR0cmlidXRlKCdoZWlnaHQnLCB0cnVlKS52YWx1ZSA9IHN2Zy5vcHRzWydzY2FsZUhlaWdodCddO1x0XHRcdFxuXHRcdFx0XHRcdGUuYXR0cmlidXRlKCd2aWV3Qm94JywgdHJ1ZSkudmFsdWUgPSAnMCAwICcgKyAoY1dpZHRoICogeFJhdGlvKSArICcgJyArIChjSGVpZ2h0ICogeVJhdGlvKTtcblx0XHRcdFx0XHRlLmF0dHJpYnV0ZSgncHJlc2VydmVBc3BlY3RSYXRpbycsIHRydWUpLnZhbHVlID0gJ25vbmUnO1xuXHRcdFx0XHR9XG5cdFx0XHRcblx0XHRcdFx0Ly8gY2xlYXIgYW5kIHJlbmRlclxuXHRcdFx0XHRpZiAoc3ZnLm9wdHNbJ2lnbm9yZUNsZWFyJ10gIT0gdHJ1ZSkge1xuXHRcdFx0XHRcdGN0eC5jbGVhclJlY3QoMCwgMCwgY1dpZHRoLCBjSGVpZ2h0KTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlLnJlbmRlcihjdHgpO1xuXHRcdFx0XHRpZiAoaXNGaXJzdFJlbmRlcikge1xuXHRcdFx0XHRcdGlzRmlyc3RSZW5kZXIgPSBmYWxzZTtcblx0XHRcdFx0XHRpZiAoc3ZnLm9wdHMgIT0gbnVsbCAmJiB0eXBlb2Yoc3ZnLm9wdHNbJ3JlbmRlckNhbGxiYWNrJ10pID09ICdmdW5jdGlvbicpIHN2Zy5vcHRzWydyZW5kZXJDYWxsYmFjayddKCk7XG5cdFx0XHRcdH1cdFx0XHRcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0dmFyIHdhaXRpbmdGb3JJbWFnZXMgPSB0cnVlO1xuXHRcdFx0aWYgKHN2Zy5JbWFnZXNMb2FkZWQoKSkge1xuXHRcdFx0XHR3YWl0aW5nRm9ySW1hZ2VzID0gZmFsc2U7XG5cdFx0XHRcdGRyYXcoKTtcblx0XHRcdH1cblx0XHRcdHN2Zy5pbnRlcnZhbElEID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7IFxuXHRcdFx0XHR2YXIgbmVlZFVwZGF0ZSA9IGZhbHNlO1xuXHRcdFx0XHRcblx0XHRcdFx0aWYgKHdhaXRpbmdGb3JJbWFnZXMgJiYgc3ZnLkltYWdlc0xvYWRlZCgpKSB7XG5cdFx0XHRcdFx0d2FpdGluZ0ZvckltYWdlcyA9IGZhbHNlO1xuXHRcdFx0XHRcdG5lZWRVcGRhdGUgPSB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcblx0XHRcdFx0Ly8gbmVlZCB1cGRhdGUgZnJvbSBtb3VzZSBldmVudHM/XG5cdFx0XHRcdGlmIChzdmcub3B0c1snaWdub3JlTW91c2UnXSAhPSB0cnVlKSB7XG5cdFx0XHRcdFx0bmVlZFVwZGF0ZSA9IG5lZWRVcGRhdGUgfCBzdmcuTW91c2UuaGFzRXZlbnRzKCk7XG5cdFx0XHRcdH1cblx0XHRcdFxuXHRcdFx0XHQvLyBuZWVkIHVwZGF0ZSBmcm9tIGFuaW1hdGlvbnM/XG5cdFx0XHRcdGlmIChzdmcub3B0c1snaWdub3JlQW5pbWF0aW9uJ10gIT0gdHJ1ZSkge1xuXHRcdFx0XHRcdGZvciAodmFyIGk9MDsgaTxzdmcuQW5pbWF0aW9ucy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdFx0bmVlZFVwZGF0ZSA9IG5lZWRVcGRhdGUgfCBzdmcuQW5pbWF0aW9uc1tpXS51cGRhdGUoMTAwMCAvIHN2Zy5GUkFNRVJBVEUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdFx0Ly8gbmVlZCB1cGRhdGUgZnJvbSByZWRyYXc/XG5cdFx0XHRcdGlmIChzdmcub3B0cyAhPSBudWxsICYmIHR5cGVvZihzdmcub3B0c1snZm9yY2VSZWRyYXcnXSkgPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdGlmIChzdmcub3B0c1snZm9yY2VSZWRyYXcnXSgpID09IHRydWUpIG5lZWRVcGRhdGUgPSB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0XHQvLyByZW5kZXIgaWYgbmVlZGVkXG5cdFx0XHRcdGlmIChuZWVkVXBkYXRlKSB7XG5cdFx0XHRcdFx0ZHJhdygpO1x0XHRcdFx0XG5cdFx0XHRcdFx0c3ZnLk1vdXNlLnJ1bkV2ZW50cygpOyAvLyBydW4gYW5kIGNsZWFyIG91ciBldmVudHNcblx0XHRcdFx0fVxuXHRcdFx0fSwgMTAwMCAvIHN2Zy5GUkFNRVJBVEUpO1xuXHRcdH1cblx0XHRcblx0XHRzdmcuc3RvcCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKHN2Zy5pbnRlcnZhbElEKSB7XG5cdFx0XHRcdGNsZWFySW50ZXJ2YWwoc3ZnLmludGVydmFsSUQpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRcblx0XHRzdmcuTW91c2UgPSBuZXcgKGZ1bmN0aW9uKCkge1xuXHRcdFx0dGhpcy5ldmVudHMgPSBbXTtcblx0XHRcdHRoaXMuaGFzRXZlbnRzID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLmV2ZW50cy5sZW5ndGggIT0gMDsgfVxuXHRcdFxuXHRcdFx0dGhpcy5vbmNsaWNrID0gZnVuY3Rpb24oeCwgeSkge1xuXHRcdFx0XHR0aGlzLmV2ZW50cy5wdXNoKHsgdHlwZTogJ29uY2xpY2snLCB4OiB4LCB5OiB5LCBcblx0XHRcdFx0XHRydW46IGZ1bmN0aW9uKGUpIHsgaWYgKGUub25jbGljaykgZS5vbmNsaWNrKCk7IH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdHRoaXMub25tb3VzZW1vdmUgPSBmdW5jdGlvbih4LCB5KSB7XG5cdFx0XHRcdHRoaXMuZXZlbnRzLnB1c2goeyB0eXBlOiAnb25tb3VzZW1vdmUnLCB4OiB4LCB5OiB5LFxuXHRcdFx0XHRcdHJ1bjogZnVuY3Rpb24oZSkgeyBpZiAoZS5vbm1vdXNlbW92ZSkgZS5vbm1vdXNlbW92ZSgpOyB9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVx0XHRcdFxuXHRcdFx0XG5cdFx0XHR0aGlzLmV2ZW50RWxlbWVudHMgPSBbXTtcblx0XHRcdFxuXHRcdFx0dGhpcy5jaGVja1BhdGggPSBmdW5jdGlvbihlbGVtZW50LCBjdHgpIHtcblx0XHRcdFx0Zm9yICh2YXIgaT0wOyBpPHRoaXMuZXZlbnRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0dmFyIGUgPSB0aGlzLmV2ZW50c1tpXTtcblx0XHRcdFx0XHRpZiAoY3R4LmlzUG9pbnRJblBhdGggJiYgY3R4LmlzUG9pbnRJblBhdGgoZS54LCBlLnkpKSB0aGlzLmV2ZW50RWxlbWVudHNbaV0gPSBlbGVtZW50O1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdHRoaXMuY2hlY2tCb3VuZGluZ0JveCA9IGZ1bmN0aW9uKGVsZW1lbnQsIGJiKSB7XG5cdFx0XHRcdGZvciAodmFyIGk9MDsgaTx0aGlzLmV2ZW50cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdHZhciBlID0gdGhpcy5ldmVudHNbaV07XG5cdFx0XHRcdFx0aWYgKGJiLmlzUG9pbnRJbkJveChlLngsIGUueSkpIHRoaXMuZXZlbnRFbGVtZW50c1tpXSA9IGVsZW1lbnQ7XG5cdFx0XHRcdH1cdFx0XHRcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0dGhpcy5ydW5FdmVudHMgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0c3ZnLmN0eC5jYW52YXMuc3R5bGUuY3Vyc29yID0gJyc7XG5cdFx0XHRcdFxuXHRcdFx0XHRmb3IgKHZhciBpPTA7IGk8dGhpcy5ldmVudHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHR2YXIgZSA9IHRoaXMuZXZlbnRzW2ldO1xuXHRcdFx0XHRcdHZhciBlbGVtZW50ID0gdGhpcy5ldmVudEVsZW1lbnRzW2ldO1xuXHRcdFx0XHRcdHdoaWxlIChlbGVtZW50KSB7XG5cdFx0XHRcdFx0XHRlLnJ1bihlbGVtZW50KTtcblx0XHRcdFx0XHRcdGVsZW1lbnQgPSBlbGVtZW50LnBhcmVudDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cdFx0XG5cdFx0XHRcblx0XHRcdFx0Ly8gZG9uZSBydW5uaW5nLCBjbGVhclxuXHRcdFx0XHR0aGlzLmV2ZW50cyA9IFtdOyBcblx0XHRcdFx0dGhpcy5ldmVudEVsZW1lbnRzID0gW107XG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0XG5cdFx0cmV0dXJuIHN2Zztcblx0fVxufSkoKTtcblxuaWYgKENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCkge1xuXHRDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQucHJvdG90eXBlLmRyYXdTdmcgPSBmdW5jdGlvbihzLCBkeCwgZHksIGR3LCBkaCkge1xuXHRcdGNhbnZnKHRoaXMuY2FudmFzLCBzLCB7IFxuXHRcdFx0aWdub3JlTW91c2U6IHRydWUsIFxuXHRcdFx0aWdub3JlQW5pbWF0aW9uOiB0cnVlLCBcblx0XHRcdGlnbm9yZURpbWVuc2lvbnM6IHRydWUsIFxuXHRcdFx0aWdub3JlQ2xlYXI6IHRydWUsIFxuXHRcdFx0b2Zmc2V0WDogZHgsIFxuXHRcdFx0b2Zmc2V0WTogZHksIFxuXHRcdFx0c2NhbGVXaWR0aDogZHcsIFxuXHRcdFx0c2NhbGVIZWlnaHQ6IGRoXG5cdFx0fSk7XG5cdH1cbn0vKipcbiAqIEBsaWNlbnNlIEhpZ2hjaGFydHMgSlMgdjMuMC42ICgyMDEzLTEwLTA0KVxuICogQ2FuVkdSZW5kZXJlciBFeHRlbnNpb24gbW9kdWxlXG4gKlxuICogKGMpIDIwMTEtMjAxMiBUb3JzdGVpbiBIw7huc2ksIEVyaWsgT2xzc29uXG4gKlxuICogTGljZW5zZTogd3d3LmhpZ2hjaGFydHMuY29tL2xpY2Vuc2VcbiAqL1xuXG4vLyBKU0xpbnQgb3B0aW9uczpcbi8qZ2xvYmFsIEhpZ2hjaGFydHMgKi9cblxuKGZ1bmN0aW9uIChIaWdoY2hhcnRzKSB7IC8vIGVuY2Fwc3VsYXRlXG5cdHZhciBVTkRFRklORUQsXG5cdFx0RElWID0gJ2RpdicsXG5cdFx0QUJTT0xVVEUgPSAnYWJzb2x1dGUnLFxuXHRcdFJFTEFUSVZFID0gJ3JlbGF0aXZlJyxcblx0XHRISURERU4gPSAnaGlkZGVuJyxcblx0XHRWSVNJQkxFID0gJ3Zpc2libGUnLFxuXHRcdFBYID0gJ3B4Jyxcblx0XHRjc3MgPSBIaWdoY2hhcnRzLmNzcyxcblx0XHRDYW5WR1JlbmRlcmVyID0gSGlnaGNoYXJ0cy5DYW5WR1JlbmRlcmVyLFxuXHRcdFNWR1JlbmRlcmVyID0gSGlnaGNoYXJ0cy5TVkdSZW5kZXJlcixcblx0XHRleHRlbmQgPSBIaWdoY2hhcnRzLmV4dGVuZCxcblx0XHRtZXJnZSA9IEhpZ2hjaGFydHMubWVyZ2UsXG5cdFx0YWRkRXZlbnQgPSBIaWdoY2hhcnRzLmFkZEV2ZW50LFxuXHRcdGNyZWF0ZUVsZW1lbnQgPSBIaWdoY2hhcnRzLmNyZWF0ZUVsZW1lbnQsXG5cdFx0ZGlzY2FyZEVsZW1lbnQgPSBIaWdoY2hhcnRzLmRpc2NhcmRFbGVtZW50O1xuXG5cdC8vIEV4dGVuZCBDYW5WRyByZW5kZXJlciBvbiBkZW1hbmQsIGluaGVyaXQgZnJvbSBTVkdSZW5kZXJlclxuXHRleHRlbmQoQ2FuVkdSZW5kZXJlci5wcm90b3R5cGUsIFNWR1JlbmRlcmVyLnByb3RvdHlwZSk7XG5cblx0Ly8gQWRkIGFkZGl0aW9uYWwgZnVuY3Rpb25hbGl0eTpcblx0ZXh0ZW5kKENhblZHUmVuZGVyZXIucHJvdG90eXBlLCB7XG5cdFx0Y3JlYXRlOiBmdW5jdGlvbiAoY2hhcnQsIGNvbnRhaW5lciwgY2hhcnRXaWR0aCwgY2hhcnRIZWlnaHQpIHtcblx0XHRcdHRoaXMuc2V0Q29udGFpbmVyKGNvbnRhaW5lciwgY2hhcnRXaWR0aCwgY2hhcnRIZWlnaHQpO1xuXHRcdFx0dGhpcy5jb25maWd1cmUoY2hhcnQpO1xuXHRcdH0sXG5cdFx0c2V0Q29udGFpbmVyOiBmdW5jdGlvbiAoY29udGFpbmVyLCBjaGFydFdpZHRoLCBjaGFydEhlaWdodCkge1xuXHRcdFx0dmFyIGNvbnRhaW5lclN0eWxlID0gY29udGFpbmVyLnN0eWxlLFxuXHRcdFx0XHRjb250YWluZXJQYXJlbnQgPSBjb250YWluZXIucGFyZW50Tm9kZSxcblx0XHRcdFx0Y29udGFpbmVyTGVmdCA9IGNvbnRhaW5lclN0eWxlLmxlZnQsXG5cdFx0XHRcdGNvbnRhaW5lclRvcCA9IGNvbnRhaW5lclN0eWxlLnRvcCxcblx0XHRcdFx0Y29udGFpbmVyT2Zmc2V0V2lkdGggPSBjb250YWluZXIub2Zmc2V0V2lkdGgsXG5cdFx0XHRcdGNvbnRhaW5lck9mZnNldEhlaWdodCA9IGNvbnRhaW5lci5vZmZzZXRIZWlnaHQsXG5cdFx0XHRcdGNhbnZhcyxcblx0XHRcdFx0aW5pdGlhbEhpZGRlblN0eWxlID0geyB2aXNpYmlsaXR5OiBISURERU4sIHBvc2l0aW9uOiBBQlNPTFVURSB9O1xuXG5cdFx0XHR0aGlzLmluaXQuYXBwbHkodGhpcywgW2NvbnRhaW5lciwgY2hhcnRXaWR0aCwgY2hhcnRIZWlnaHRdKTtcblxuXHRcdFx0Ly8gYWRkIHRoZSBjYW52YXMgYWJvdmUgaXRcblx0XHRcdGNhbnZhcyA9IGNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycsIHtcblx0XHRcdFx0d2lkdGg6IGNvbnRhaW5lck9mZnNldFdpZHRoLFxuXHRcdFx0XHRoZWlnaHQ6IGNvbnRhaW5lck9mZnNldEhlaWdodFxuXHRcdFx0fSwge1xuXHRcdFx0XHRwb3NpdGlvbjogUkVMQVRJVkUsXG5cdFx0XHRcdGxlZnQ6IGNvbnRhaW5lckxlZnQsXG5cdFx0XHRcdHRvcDogY29udGFpbmVyVG9wXG5cdFx0XHR9LCBjb250YWluZXIpO1xuXHRcdFx0dGhpcy5jYW52YXMgPSBjYW52YXM7XG5cblx0XHRcdC8vIENyZWF0ZSB0aGUgdG9vbHRpcCBsaW5lIGFuZCBkaXYsIHRoZXkgYXJlIHBsYWNlZCBhcyBzaWJsaW5ncyB0b1xuXHRcdFx0Ly8gdGhlIGNvbnRhaW5lciAoYW5kIGFzIGRpcmVjdCBjaGlsZHMgdG8gdGhlIGRpdiBzcGVjaWZpZWQgaW4gdGhlIGh0bWwgcGFnZSlcblx0XHRcdHRoaXMudHRMaW5lID0gY3JlYXRlRWxlbWVudChESVYsIG51bGwsIGluaXRpYWxIaWRkZW5TdHlsZSwgY29udGFpbmVyUGFyZW50KTtcblx0XHRcdHRoaXMudHREaXYgPSBjcmVhdGVFbGVtZW50KERJViwgbnVsbCwgaW5pdGlhbEhpZGRlblN0eWxlLCBjb250YWluZXJQYXJlbnQpO1xuXHRcdFx0dGhpcy50dFRpbWVyID0gVU5ERUZJTkVEO1xuXG5cdFx0XHQvLyBNb3ZlIGF3YXkgdGhlIHN2ZyBub2RlIHRvIGEgbmV3IGRpdiBpbnNpZGUgdGhlIGNvbnRhaW5lcidzIHBhcmVudCBzbyB3ZSBjYW4gaGlkZSBpdC5cblx0XHRcdHZhciBoaWRkZW5TdmcgPSBjcmVhdGVFbGVtZW50KERJViwge1xuXHRcdFx0XHR3aWR0aDogY29udGFpbmVyT2Zmc2V0V2lkdGgsXG5cdFx0XHRcdGhlaWdodDogY29udGFpbmVyT2Zmc2V0SGVpZ2h0XG5cdFx0XHR9LCB7XG5cdFx0XHRcdHZpc2liaWxpdHk6IEhJRERFTixcblx0XHRcdFx0bGVmdDogY29udGFpbmVyTGVmdCxcblx0XHRcdFx0dG9wOiBjb250YWluZXJUb3Bcblx0XHRcdH0sIGNvbnRhaW5lclBhcmVudCk7XG5cdFx0XHR0aGlzLmhpZGRlblN2ZyA9IGhpZGRlblN2Zztcblx0XHRcdGhpZGRlblN2Zy5hcHBlbmRDaGlsZCh0aGlzLmJveCk7XG5cdFx0fSxcblxuXHRcdC8qKlxuXHRcdCAqIENvbmZpZ3VyZXMgdGhlIHJlbmRlcmVyIHdpdGggdGhlIGNoYXJ0LiBBdHRhY2ggYSBsaXN0ZW5lciB0byB0aGUgZXZlbnQgdG9vbHRpcFJlZnJlc2guXG5cdFx0ICoqL1xuXHRcdGNvbmZpZ3VyZTogZnVuY3Rpb24gKGNoYXJ0KSB7XG5cdFx0XHR2YXIgcmVuZGVyZXIgPSB0aGlzLFxuXHRcdFx0XHRvcHRpb25zID0gY2hhcnQub3B0aW9ucy50b29sdGlwLFxuXHRcdFx0XHRib3JkZXJXaWR0aCA9IG9wdGlvbnMuYm9yZGVyV2lkdGgsXG5cdFx0XHRcdHRvb2x0aXBEaXYgPSByZW5kZXJlci50dERpdixcblx0XHRcdFx0dG9vbHRpcERpdlN0eWxlID0gb3B0aW9ucy5zdHlsZSxcblx0XHRcdFx0dG9vbHRpcExpbmUgPSByZW5kZXJlci50dExpbmUsXG5cdFx0XHRcdHBhZGRpbmcgPSBwYXJzZUludCh0b29sdGlwRGl2U3R5bGUucGFkZGluZywgMTApO1xuXG5cdFx0XHQvLyBBZGQgYm9yZGVyIHN0eWxpbmcgZnJvbSBvcHRpb25zIHRvIHRoZSBzdHlsZVxuXHRcdFx0dG9vbHRpcERpdlN0eWxlID0gbWVyZ2UodG9vbHRpcERpdlN0eWxlLCB7XG5cdFx0XHRcdHBhZGRpbmc6IHBhZGRpbmcgKyBQWCxcblx0XHRcdFx0J2JhY2tncm91bmQtY29sb3InOiBvcHRpb25zLmJhY2tncm91bmRDb2xvcixcblx0XHRcdFx0J2JvcmRlci1zdHlsZSc6ICdzb2xpZCcsXG5cdFx0XHRcdCdib3JkZXItd2lkdGgnOiBib3JkZXJXaWR0aCArIFBYLFxuXHRcdFx0XHQnYm9yZGVyLXJhZGl1cyc6IG9wdGlvbnMuYm9yZGVyUmFkaXVzICsgUFhcblx0XHRcdH0pO1xuXG5cdFx0XHQvLyBPcHRpb25hbGx5IGFkZCBzaGFkb3dcblx0XHRcdGlmIChvcHRpb25zLnNoYWRvdykge1xuXHRcdFx0XHR0b29sdGlwRGl2U3R5bGUgPSBtZXJnZSh0b29sdGlwRGl2U3R5bGUsIHtcblx0XHRcdFx0XHQnYm94LXNoYWRvdyc6ICcxcHggMXB4IDNweCBncmF5JywgLy8gdzNjXG5cdFx0XHRcdFx0Jy13ZWJraXQtYm94LXNoYWRvdyc6ICcxcHggMXB4IDNweCBncmF5JyAvLyB3ZWJraXRcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0XHRjc3ModG9vbHRpcERpdiwgdG9vbHRpcERpdlN0eWxlKTtcblxuXHRcdFx0Ly8gU2V0IHNpbXBsZSBzdHlsZSBvbiB0aGUgbGluZVxuXHRcdFx0Y3NzKHRvb2x0aXBMaW5lLCB7XG5cdFx0XHRcdCdib3JkZXItbGVmdCc6ICcxcHggc29saWQgZGFya2dyYXknXG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gVGhpcyBldmVudCBpcyB0cmlnZ2VyZWQgd2hlbiBhIG5ldyB0b29sdGlwIHNob3VsZCBiZSBzaG93blxuXHRcdFx0YWRkRXZlbnQoY2hhcnQsICd0b29sdGlwUmVmcmVzaCcsIGZ1bmN0aW9uIChhcmdzKSB7XG5cdFx0XHRcdHZhciBjaGFydENvbnRhaW5lciA9IGNoYXJ0LmNvbnRhaW5lcixcblx0XHRcdFx0XHRvZmZzZXRMZWZ0ID0gY2hhcnRDb250YWluZXIub2Zmc2V0TGVmdCxcblx0XHRcdFx0XHRvZmZzZXRUb3AgPSBjaGFydENvbnRhaW5lci5vZmZzZXRUb3AsXG5cdFx0XHRcdFx0cG9zaXRpb247XG5cblx0XHRcdFx0Ly8gU2V0IHRoZSBjb250ZW50IG9mIHRoZSB0b29sdGlwXG5cdFx0XHRcdHRvb2x0aXBEaXYuaW5uZXJIVE1MID0gYXJncy50ZXh0O1xuXG5cdFx0XHRcdC8vIENvbXB1dGUgdGhlIGJlc3QgcG9zaXRpb24gZm9yIHRoZSB0b29sdGlwIGJhc2VkIG9uIHRoZSBkaXZzIHNpemUgYW5kIGNvbnRhaW5lciBzaXplLlxuXHRcdFx0XHRwb3NpdGlvbiA9IGNoYXJ0LnRvb2x0aXAuZ2V0UG9zaXRpb24odG9vbHRpcERpdi5vZmZzZXRXaWR0aCwgdG9vbHRpcERpdi5vZmZzZXRIZWlnaHQsIHtwbG90WDogYXJncy54LCBwbG90WTogYXJncy55fSk7XG5cblx0XHRcdFx0Y3NzKHRvb2x0aXBEaXYsIHtcblx0XHRcdFx0XHR2aXNpYmlsaXR5OiBWSVNJQkxFLFxuXHRcdFx0XHRcdGxlZnQ6IHBvc2l0aW9uLnggKyBQWCxcblx0XHRcdFx0XHR0b3A6IHBvc2l0aW9uLnkgKyBQWCxcblx0XHRcdFx0XHQnYm9yZGVyLWNvbG9yJzogYXJncy5ib3JkZXJDb2xvclxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHQvLyBQb3NpdGlvbiB0aGUgdG9vbHRpcCBsaW5lXG5cdFx0XHRcdGNzcyh0b29sdGlwTGluZSwge1xuXHRcdFx0XHRcdHZpc2liaWxpdHk6IFZJU0lCTEUsXG5cdFx0XHRcdFx0bGVmdDogb2Zmc2V0TGVmdCArIGFyZ3MueCArIFBYLFxuXHRcdFx0XHRcdHRvcDogb2Zmc2V0VG9wICsgY2hhcnQucGxvdFRvcCArIFBYLFxuXHRcdFx0XHRcdGhlaWdodDogY2hhcnQucGxvdEhlaWdodCAgKyBQWFxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHQvLyBUaGlzIHRpbWVvdXQgaGlkZXMgdGhlIHRvb2x0aXAgYWZ0ZXIgMyBzZWNvbmRzXG5cdFx0XHRcdC8vIEZpcnN0IGNsZWFyIGFueSBleGlzdGluZyB0aW1lclxuXHRcdFx0XHRpZiAocmVuZGVyZXIudHRUaW1lciAhPT0gVU5ERUZJTkVEKSB7XG5cdFx0XHRcdFx0Y2xlYXJUaW1lb3V0KHJlbmRlcmVyLnR0VGltZXIpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gU3RhcnQgYSBuZXcgdGltZXIgdGhhdCBoaWRlcyB0b29sdGlwIGFuZCBsaW5lXG5cdFx0XHRcdHJlbmRlcmVyLnR0VGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRjc3ModG9vbHRpcERpdiwgeyB2aXNpYmlsaXR5OiBISURERU4gfSk7XG5cdFx0XHRcdFx0Y3NzKHRvb2x0aXBMaW5lLCB7IHZpc2liaWxpdHk6IEhJRERFTiB9KTtcblx0XHRcdFx0fSwgMzAwMCk7XG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cdFx0LyoqXG5cdFx0ICogRXh0ZW5kIFNWR1JlbmRlcmVyLmRlc3Ryb3kgdG8gYWxzbyBkZXN0cm95IHRoZSBlbGVtZW50cyBhZGRlZCBieSBDYW5WR1JlbmRlcmVyLlxuXHRcdCAqL1xuXHRcdGRlc3Ryb3k6IGZ1bmN0aW9uICgpIHtcblx0XHRcdHZhciByZW5kZXJlciA9IHRoaXM7XG5cblx0XHRcdC8vIFJlbW92ZSB0aGUgY2FudmFzXG5cdFx0XHRkaXNjYXJkRWxlbWVudChyZW5kZXJlci5jYW52YXMpO1xuXG5cdFx0XHQvLyBLaWxsIHRoZSB0aW1lclxuXHRcdFx0aWYgKHJlbmRlcmVyLnR0VGltZXIgIT09IFVOREVGSU5FRCkge1xuXHRcdFx0XHRjbGVhclRpbWVvdXQocmVuZGVyZXIudHRUaW1lcik7XG5cdFx0XHR9XG5cblx0XHRcdC8vIFJlbW92ZSB0aGUgZGl2cyBmb3IgdG9vbHRpcCBhbmQgbGluZVxuXHRcdFx0ZGlzY2FyZEVsZW1lbnQocmVuZGVyZXIudHRMaW5lKTtcblx0XHRcdGRpc2NhcmRFbGVtZW50KHJlbmRlcmVyLnR0RGl2KTtcblx0XHRcdGRpc2NhcmRFbGVtZW50KHJlbmRlcmVyLmhpZGRlblN2Zyk7XG5cblx0XHRcdC8vIENvbnRpbnVlIHdpdGggYmFzZSBjbGFzc1xuXHRcdFx0cmV0dXJuIFNWR1JlbmRlcmVyLnByb3RvdHlwZS5kZXN0cm95LmFwcGx5KHJlbmRlcmVyKTtcblx0XHR9LFxuXG5cdFx0LyoqXG5cdFx0ICogVGFrZSBhIGNvbG9yIGFuZCByZXR1cm4gaXQgaWYgaXQncyBhIHN0cmluZywgZG8gbm90IG1ha2UgaXQgYSBncmFkaWVudCBldmVuIGlmIGl0IGlzIGFcblx0XHQgKiBncmFkaWVudC4gQ3VycmVudGx5IGNhbnZnIGNhbm5vdCByZW5kZXIgZ3JhZGllbnRzICh0dXJucyBvdXQgYmxhY2spLFxuXHRcdCAqIHNlZTogaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL2NhbnZnL2lzc3Vlcy9kZXRhaWw/aWQ9MTA0XG5cdFx0ICpcblx0XHQgKiBAcGFyYW0ge09iamVjdH0gY29sb3IgVGhlIGNvbG9yIG9yIGNvbmZpZyBvYmplY3Rcblx0XHQgKi9cblx0XHRjb2xvcjogZnVuY3Rpb24gKGNvbG9yLCBlbGVtLCBwcm9wKSB7XG5cdFx0XHRpZiAoY29sb3IgJiYgY29sb3IubGluZWFyR3JhZGllbnQpIHtcblx0XHRcdFx0Ly8gUGljayB0aGUgZW5kIGNvbG9yIGFuZCBmb3J3YXJkIHRvIGJhc2UgaW1wbGVtZW50YXRpb25cblx0XHRcdFx0Y29sb3IgPSBjb2xvci5zdG9wc1tjb2xvci5zdG9wcy5sZW5ndGggLSAxXVsxXTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBTVkdSZW5kZXJlci5wcm90b3R5cGUuY29sb3IuY2FsbCh0aGlzLCBjb2xvciwgZWxlbSwgcHJvcCk7XG5cdFx0fSxcblxuXHRcdC8qKlxuXHRcdCAqIERyYXdzIHRoZSBTVkcgb24gdGhlIGNhbnZhcyBvciBhZGRzIGEgZHJhdyBpbnZva2F0aW9uIHRvIHRoZSBkZWZlcnJlZCBsaXN0LlxuXHRcdCAqL1xuXHRcdGRyYXc6IGZ1bmN0aW9uICgpIHtcblx0XHRcdHZhciByZW5kZXJlciA9IHRoaXM7XG5cdFx0XHR3aW5kb3cuY2FudmcocmVuZGVyZXIuY2FudmFzLCByZW5kZXJlci5oaWRkZW5TdmcuaW5uZXJIVE1MKTtcblx0XHR9XG5cdH0pO1xufShIaWdoY2hhcnRzKSk7XG4iXSwiZmlsZSI6InBsdWdpbnMvdWVkaXRvci90aGlyZC1wYXJ0eS9oaWdoY2hhcnRzL21vZHVsZXMvY2FudmFzLXRvb2xzLnNyYy5qcyJ9
