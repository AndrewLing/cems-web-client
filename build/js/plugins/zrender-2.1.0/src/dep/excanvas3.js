// Copyright 2006 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


// Known Issues:
//
// * Patterns only support repeat.
// * Radial gradient are not implemented. The VML version of these look very
//   different from the canvas one.
// * Clipping paths are not implemented.
// * Coordsize. The width and height attribute have higher priority than the
//   width and height style values which isn't correct.
// * Painting mode isn't implemented.
// * Canvas width/height should is using content-box by default. IE in
//   Quirks mode will draw the canvas using border-box. Either change your
//   doctype to HTML5
//   (http://www.whatwg.org/specs/web-apps/current-work/#the-doctype)
//   or use Box Sizing Behavior from WebFX
//   (http://webfx.eae.net/dhtml/boxsizing/boxsizing.html)
// * Non uniform scaling does not correctly scale strokes.
// * Optimize. There is always room for speed improvements.

// AMD by kener.linfeng@gmail.com
define(function(require) {
    
// Only add this code if we do not already have a canvas implementation
if (!document.createElement('canvas').getContext) {

(function() {

  // alias some functions to make (compiled) code shorter
  var m = Math;
  var mr = m.round;
  var ms = m.sin;
  var mc = m.cos;
  var abs = m.abs;
  var sqrt = m.sqrt;

  // this is used for sub pixel precision
  var Z = 10;
  var Z2 = Z / 2;

  var IE_VERSION = +navigator.userAgent.match(/MSIE ([\d.]+)?/)[1];

  /**
   * This funtion is assigned to the <canvas> elements as element.getContext().
   * @this {HTMLElement}
   * @return {CanvasRenderingContext2D_}
   */
  function getContext() {
    return this.context_ ||
        (this.context_ = new CanvasRenderingContext2D_(this));
  }

  var slice = Array.prototype.slice;

  /**
   * Binds a function to an object. The returned function will always use the
   * passed in {@code obj} as {@code this}.
   *
   * Example:
   *
   *   g = bind(f, obj, a, b)
   *   g(c, d) // will do f.call(obj, a, b, c, d)
   *
   * @param {Function} f The function to bind the object to
   * @param {Object} obj The object that should act as this when the function
   *     is called
   * @param {*} var_args Rest arguments that will be used as the initial
   *     arguments when the function is called
   * @return {Function} A new function that has bound this
   */
  function bind(f, obj, var_args) {
    var a = slice.call(arguments, 2);
    return function() {
      return f.apply(obj, a.concat(slice.call(arguments)));
    };
  }

  function encodeHtmlAttribute(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  }

  function addNamespace(doc, prefix, urn) {
    if (!doc.namespaces[prefix]) {
      doc.namespaces.add(prefix, urn, '#default#VML');
    }
  }

  function addNamespacesAndStylesheet(doc) {
    addNamespace(doc, 'g_vml_', 'urn:schemas-microsoft-com:vml');
    addNamespace(doc, 'g_o_', 'urn:schemas-microsoft-com:office:office');

    // Setup default CSS.  Only add one style sheet per document
    if (!doc.styleSheets['ex_canvas_']) {
      var ss = doc.createStyleSheet();
      ss.owningElement.id = 'ex_canvas_';
      ss.cssText = 'canvas{display:inline-block;overflow:hidden;' +
          // default size is 300x150 in Gecko and Opera
          'text-align:left;width:300px;height:150px}';
    }
  }

  // Add namespaces and stylesheet at startup.
  addNamespacesAndStylesheet(document);

  var G_vmlCanvasManager_ = {
    init: function(opt_doc) {
      var doc = opt_doc || document;
      // Create a dummy element so that IE will allow canvas elements to be
      // recognized.
      doc.createElement('canvas');
      doc.attachEvent('onreadystatechange', bind(this.init_, this, doc));
    },

    init_: function(doc) {
      // find all canvas elements
      var els = doc.getElementsByTagName('canvas');
      for (var i = 0; i < els.length; i++) {
        this.initElement(els[i]);
      }
    },

    /**
     * Public initializes a canvas element so that it can be used as canvas
     * element from now on. This is called automatically before the page is
     * loaded but if you are creating elements using createElement you need to
     * make sure this is called on the element.
     * @param {HTMLElement} el The canvas element to initialize.
     * @return {HTMLElement} the element that was created.
     */
    initElement: function(el) {
      if (!el.getContext) {
        el.getContext = getContext;

        // Add namespaces and stylesheet to document of the element.
        addNamespacesAndStylesheet(el.ownerDocument);

        // Remove fallback content. There is no way to hide text nodes so we
        // just remove all childNodes. We could hide all elements and remove
        // text nodes but who really cares about the fallback content.
        el.innerHTML = '';

        // do not use inline function because that will leak memory
        el.attachEvent('onpropertychange', onPropertyChange);
        el.attachEvent('onresize', onResize);

        var attrs = el.attributes;
        if (attrs.width && attrs.width.specified) {
          // TODO: use runtimeStyle and coordsize
          // el.getContext().setWidth_(attrs.width.nodeValue);
          el.style.width = attrs.width.nodeValue + 'px';
        } else {
          el.width = el.clientWidth;
        }
        if (attrs.height && attrs.height.specified) {
          // TODO: use runtimeStyle and coordsize
          // el.getContext().setHeight_(attrs.height.nodeValue);
          el.style.height = attrs.height.nodeValue + 'px';
        } else {
          el.height = el.clientHeight;
        }
        //el.getContext().setCoordsize_()
      }
      return el;
    }
  };

  function onPropertyChange(e) {
    var el = e.srcElement;

    switch (e.propertyName) {
      case 'width':
        el.getContext().clearRect();
        el.style.width = el.attributes.width.nodeValue + 'px';
        // In IE8 this does not trigger onresize.
        el.firstChild.style.width =  el.clientWidth + 'px';
        break;
      case 'height':
        el.getContext().clearRect();
        el.style.height = el.attributes.height.nodeValue + 'px';
        el.firstChild.style.height = el.clientHeight + 'px';
        break;
    }
  }

  function onResize(e) {
    var el = e.srcElement;
    if (el.firstChild) {
      el.firstChild.style.width =  el.clientWidth + 'px';
      el.firstChild.style.height = el.clientHeight + 'px';
    }
  }

  G_vmlCanvasManager_.init();

  // precompute "00" to "FF"
  var decToHex = [];
  for (var i = 0; i < 16; i++) {
    for (var j = 0; j < 16; j++) {
      decToHex[i * 16 + j] = i.toString(16) + j.toString(16);
    }
  }

  function createMatrixIdentity() {
    return [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ];
  }

  function matrixMultiply(m1, m2) {
    var result = createMatrixIdentity();

    for (var x = 0; x < 3; x++) {
      for (var y = 0; y < 3; y++) {
        var sum = 0;

        for (var z = 0; z < 3; z++) {
          sum += m1[x][z] * m2[z][y];
        }

        result[x][y] = sum;
      }
    }
    return result;
  }

  function getCoords(ctx, aX, aY) {
    var m = ctx.m_;
    return {
      x: Z * (aX * m[0][0] + aY * m[1][0] + m[2][0]) - Z2,
      y: Z * (aX * m[0][1] + aY * m[1][1] + m[2][1]) - Z2
    };
  };

  function getSkewedCoords(ctx, aX, aY) {
    var m = ctx.m_;
    return {
      x: Z * (aX * m[0][0] + aY * m[1][0]) - Z2,
      y: Z * (aX * m[0][1] + aY * m[1][1]) - Z2
    };
  }

  function copyState(o1, o2) {
    o2.fillStyle     = o1.fillStyle;
    o2.lineCap       = o1.lineCap;
    o2.lineJoin      = o1.lineJoin;
    o2.lineWidth     = o1.lineWidth;
    o2.miterLimit    = o1.miterLimit;
    o2.shadowBlur    = o1.shadowBlur;
    o2.shadowColor   = o1.shadowColor;
    o2.shadowOffsetX = o1.shadowOffsetX;
    o2.shadowOffsetY = o1.shadowOffsetY;
    o2.strokeStyle   = o1.strokeStyle;
    o2.globalAlpha   = o1.globalAlpha;
    o2.font          = o1.font;
    o2.textAlign     = o1.textAlign;
    o2.textBaseline  = o1.textBaseline;
    o2.scaleX_       = o1.scaleX_;
    o2.scaleY_       = o1.scaleY_;
    o2.x_            = o1.x_;
    o2.y_            = o1.y_;
    o2.lineScale_    = o1.lineScale_;
  }

  var colorData = {
    aliceblue: '#F0F8FF',
    antiquewhite: '#FAEBD7',
    aquamarine: '#7FFFD4',
    azure: '#F0FFFF',
    beige: '#F5F5DC',
    bisque: '#FFE4C4',
    black: '#000000',
    blanchedalmond: '#FFEBCD',
    blueviolet: '#8A2BE2',
    brown: '#A52A2A',
    burlywood: '#DEB887',
    cadetblue: '#5F9EA0',
    chartreuse: '#7FFF00',
    chocolate: '#D2691E',
    coral: '#FF7F50',
    cornflowerblue: '#6495ED',
    cornsilk: '#FFF8DC',
    crimson: '#DC143C',
    cyan: '#00FFFF',
    darkblue: '#00008B',
    darkcyan: '#008B8B',
    darkgoldenrod: '#B8860B',
    darkgray: '#A9A9A9',
    darkgreen: '#006400',
    darkgrey: '#A9A9A9',
    darkkhaki: '#BDB76B',
    darkmagenta: '#8B008B',
    darkolivegreen: '#556B2F',
    darkorange: '#FF8C00',
    darkorchid: '#9932CC',
    darkred: '#8B0000',
    darksalmon: '#E9967A',
    darkseagreen: '#8FBC8F',
    darkslateblue: '#483D8B',
    darkslategray: '#2F4F4F',
    darkslategrey: '#2F4F4F',
    darkturquoise: '#00CED1',
    darkviolet: '#9400D3',
    deeppink: '#FF1493',
    deepskyblue: '#00BFFF',
    dimgray: '#696969',
    dimgrey: '#696969',
    dodgerblue: '#1E90FF',
    firebrick: '#B22222',
    floralwhite: '#FFFAF0',
    forestgreen: '#228B22',
    gainsboro: '#DCDCDC',
    ghostwhite: '#F8F8FF',
    gold: '#FFD700',
    goldenrod: '#DAA520',
    grey: '#808080',
    greenyellow: '#ADFF2F',
    honeydew: '#F0FFF0',
    hotpink: '#FF69B4',
    indianred: '#CD5C5C',
    indigo: '#4B0082',
    ivory: '#FFFFF0',
    khaki: '#F0E68C',
    lavender: '#E6E6FA',
    lavenderblush: '#FFF0F5',
    lawngreen: '#7CFC00',
    lemonchiffon: '#FFFACD',
    lightblue: '#ADD8E6',
    lightcoral: '#F08080',
    lightcyan: '#E0FFFF',
    lightgoldenrodyellow: '#FAFAD2',
    lightgreen: '#90EE90',
    lightgrey: '#D3D3D3',
    lightpink: '#FFB6C1',
    lightsalmon: '#FFA07A',
    lightseagreen: '#20B2AA',
    lightskyblue: '#87CEFA',
    lightslategray: '#778899',
    lightslategrey: '#778899',
    lightsteelblue: '#B0C4DE',
    lightyellow: '#FFFFE0',
    limegreen: '#32CD32',
    linen: '#FAF0E6',
    magenta: '#FF00FF',
    mediumaquamarine: '#66CDAA',
    mediumblue: '#0000CD',
    mediumorchid: '#BA55D3',
    mediumpurple: '#9370DB',
    mediumseagreen: '#3CB371',
    mediumslateblue: '#7B68EE',
    mediumspringgreen: '#00FA9A',
    mediumturquoise: '#48D1CC',
    mediumvioletred: '#C71585',
    midnightblue: '#191970',
    mintcream: '#F5FFFA',
    mistyrose: '#FFE4E1',
    moccasin: '#FFE4B5',
    navajowhite: '#FFDEAD',
    oldlace: '#FDF5E6',
    olivedrab: '#6B8E23',
    orange: '#FFA500',
    orangered: '#FF4500',
    orchid: '#DA70D6',
    palegoldenrod: '#EEE8AA',
    palegreen: '#98FB98',
    paleturquoise: '#AFEEEE',
    palevioletred: '#DB7093',
    papayawhip: '#FFEFD5',
    peachpuff: '#FFDAB9',
    peru: '#CD853F',
    pink: '#FFC0CB',
    plum: '#DDA0DD',
    powderblue: '#B0E0E6',
    rosybrown: '#BC8F8F',
    royalblue: '#4169E1',
    saddlebrown: '#8B4513',
    salmon: '#FA8072',
    sandybrown: '#F4A460',
    seagreen: '#2E8B57',
    seashell: '#FFF5EE',
    sienna: '#A0522D',
    skyblue: '#87CEEB',
    slateblue: '#6A5ACD',
    slategray: '#708090',
    slategrey: '#708090',
    snow: '#FFFAFA',
    springgreen: '#00FF7F',
    steelblue: '#4682B4',
    tan: '#D2B48C',
    thistle: '#D8BFD8',
    tomato: '#FF6347',
    turquoise: '#40E0D0',
    violet: '#EE82EE',
    wheat: '#F5DEB3',
    whitesmoke: '#F5F5F5',
    yellowgreen: '#9ACD32'
  };


  function getRgbHslContent(styleString) {
    var start = styleString.indexOf('(', 3);
    var end = styleString.indexOf(')', start + 1);
    var parts = styleString.substring(start + 1, end).split(',');
    // add alpha if needed
    if (parts.length != 4 || styleString.charAt(3) != 'a') {
      parts[3] = 1;
    }
    return parts;
  }

  function percent(s) {
    return parseFloat(s) / 100;
  }

  function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  function hslToRgb(parts){
    var r, g, b, h, s, l;
    h = parseFloat(parts[0]) / 360 % 360;
    if (h < 0)
      h++;
    s = clamp(percent(parts[1]), 0, 1);
    l = clamp(percent(parts[2]), 0, 1);
    if (s == 0) {
      r = g = b = l; // achromatic
    } else {
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hueToRgb(p, q, h + 1 / 3);
      g = hueToRgb(p, q, h);
      b = hueToRgb(p, q, h - 1 / 3);
    }

    return '#' + decToHex[Math.floor(r * 255)] +
        decToHex[Math.floor(g * 255)] +
        decToHex[Math.floor(b * 255)];
  }

  function hueToRgb(m1, m2, h) {
    if (h < 0)
      h++;
    if (h > 1)
      h--;

    if (6 * h < 1)
      return m1 + (m2 - m1) * 6 * h;
    else if (2 * h < 1)
      return m2;
    else if (3 * h < 2)
      return m1 + (m2 - m1) * (2 / 3 - h) * 6;
    else
      return m1;
  }

  var processStyleCache = {};

  function processStyle(styleString) {
    if (styleString in processStyleCache) {
      return processStyleCache[styleString];
    }

    var str, alpha = 1;

    styleString = String(styleString);
    if (styleString.charAt(0) == '#') {
      str = styleString;
    } else if (/^rgb/.test(styleString)) {
      var parts = getRgbHslContent(styleString);
      var str = '#', n;
      for (var i = 0; i < 3; i++) {
        if (parts[i].indexOf('%') != -1) {
          n = Math.floor(percent(parts[i]) * 255);
        } else {
          n = +parts[i];
        }
        str += decToHex[clamp(n, 0, 255)];
      }
      alpha = +parts[3];
    } else if (/^hsl/.test(styleString)) {
      var parts = getRgbHslContent(styleString);
      str = hslToRgb(parts);
      alpha = parts[3];
    } else {
      str = colorData[styleString] || styleString;
    }
    return processStyleCache[styleString] = {color: str, alpha: alpha};
  }

  var DEFAULT_STYLE = {
    style: 'normal',
    variant: 'normal',
    weight: 'normal',
    size: 12,           //10
    family: '微软雅黑'     //'sans-serif'
  };

  // Internal text style cache
  var fontStyleCache = {};

  function processFontStyle(styleString) {
    if (fontStyleCache[styleString]) {
      return fontStyleCache[styleString];
    }

    var el = document.createElement('div');
    var style = el.style;
    var fontFamily;
    try {
      style.font = styleString;
      fontFamily = style.fontFamily.split(',')[0];
    } catch (ex) {
      // Ignore failures to set to invalid font.
    }

    return fontStyleCache[styleString] = {
      style: style.fontStyle || DEFAULT_STYLE.style,
      variant: style.fontVariant || DEFAULT_STYLE.variant,
      weight: style.fontWeight || DEFAULT_STYLE.weight,
      size: style.fontSize || DEFAULT_STYLE.size,
      family: fontFamily || DEFAULT_STYLE.family
    };
  }

  function getComputedStyle(style, element) {
    var computedStyle = {};

    for (var p in style) {
      computedStyle[p] = style[p];
    }

    // Compute the size
    var canvasFontSize = parseFloat(element.currentStyle.fontSize),
        fontSize = parseFloat(style.size);

    if (typeof style.size == 'number') {
      computedStyle.size = style.size;
    } else if (style.size.indexOf('px') != -1) {
      computedStyle.size = fontSize;
    } else if (style.size.indexOf('em') != -1) {
      computedStyle.size = canvasFontSize * fontSize;
    } else if(style.size.indexOf('%') != -1) {
      computedStyle.size = (canvasFontSize / 100) * fontSize;
    } else if (style.size.indexOf('pt') != -1) {
      computedStyle.size = fontSize / .75;
    } else {
      computedStyle.size = canvasFontSize;
    }

    // Different scaling between normal text and VML text. This was found using
    // trial and error to get the same size as non VML text.
    //computedStyle.size *= 0.981;

    return computedStyle;
  }

  function buildStyle(style) {
    return style.style + ' ' + style.variant + ' ' + style.weight + ' ' +
        style.size + "px '" + style.family + "'";
  }

  var lineCapMap = {
    'butt': 'flat',
    'round': 'round'
  };

  function processLineCap(lineCap) {
    return lineCapMap[lineCap] || 'square';
  }

  /**
   * This class implements CanvasRenderingContext2D interface as described by
   * the WHATWG.
   * @param {HTMLElement} canvasElement The element that the 2D context should
   * be associated with
   */
  function CanvasRenderingContext2D_(canvasElement) {
    this.m_ = createMatrixIdentity();

    this.mStack_ = [];
    this.aStack_ = [];
    this.currentPath_ = [];

    // Canvas context properties
    this.strokeStyle = '#000';
    this.fillStyle = '#000';

    this.lineWidth = 1;
    this.lineJoin = 'miter';
    this.lineCap = 'butt';
    this.miterLimit = Z * 1;
    this.globalAlpha = 1;
    // this.font = '10px sans-serif';
    this.font = '12px 微软雅黑';        // 决定还是改这吧，影响代价最小
    this.textAlign = 'left';
    this.textBaseline = 'alphabetic';
    this.canvas = canvasElement;

    var cssText = 'width:' + canvasElement.clientWidth + 'px;height:' +
        canvasElement.clientHeight + 'px;overflow:hidden;position:absolute';
    var el = canvasElement.ownerDocument.createElement('div');
    el.style.cssText = cssText;
    canvasElement.appendChild(el);

    var overlayEl = el.cloneNode(false);
    // Use a non transparent background.
    overlayEl.style.backgroundColor = '#fff'; //red, I don't know why, it work! 
    overlayEl.style.filter = 'alpha(opacity=0)';
    canvasElement.appendChild(overlayEl);

    this.element_ = el;
    this.scaleX_ = 1;
    this.scaleY_ = 1;
    this.x_ = 0;
    this.y_ = 0;
    this.lineScale_ = 1;

    this.html_ = ''; 
  }

  var contextPrototype = CanvasRenderingContext2D_.prototype;
  contextPrototype.clearRect = function() {
    if (this.textMeasureEl_) {
      this.textMeasureEl_.removeNode(true);
      this.textMeasureEl_ = null;
    }
    this.element_.innerHTML = '';
  };

  contextPrototype.flush = function () {
    this.element_.insertAdjacentHTML('beforeEnd', this.html_);
    this.html_ = '';
  }

  contextPrototype.beginPath = function() {
    // TODO: Branch current matrix so that save/restore has no effect
    //       as per safari docs.
    this.currentPath_ = [];
  };

  contextPrototype.moveTo = function(aX, aY) {
    var p = getSkewedCoords(this, aX, aY);
    p.type = 'moveTo';
    this.currentPath_.push(p);
    this.currentX_ = p.x;
    this.currentY_ = p.y;
  };

  contextPrototype.lineTo = function(aX, aY) {
    var p = getSkewedCoords(this, aX, aY);
    p.type = 'lineTo';
    this.currentPath_.push(p);

    this.currentX_ = p.x;
    this.currentY_ = p.y;
  };

  contextPrototype.bezierCurveTo = function(aCP1x, aCP1y,
                                            aCP2x, aCP2y,
                                            aX, aY) {
    var p = getSkewedCoords(this, aX, aY);
    var cp1 = getSkewedCoords(this, aCP1x, aCP1y);
    var cp2 = getSkewedCoords(this, aCP2x, aCP2y);
    bezierCurveTo(this, cp1, cp2, p);
  };

  // Helper function that takes the already fixed cordinates.
  function bezierCurveTo(self, cp1, cp2, p) {
    self.currentPath_.push({
      type: 'bezierCurveTo',
      cp1x: cp1.x,
      cp1y: cp1.y,
      cp2x: cp2.x,
      cp2y: cp2.y,
      x: p.x,
      y: p.y
    });
    self.currentX_ = p.x;
    self.currentY_ = p.y;
  }

  contextPrototype.quadraticCurveTo = function(aCPx, aCPy, aX, aY) {
    // the following is lifted almost directly from
    // http://developer.mozilla.org/en/docs/Canvas_tutorial:Drawing_shapes

    var cp = getSkewedCoords(this, aCPx, aCPy);
    var p = getSkewedCoords(this, aX, aY);

    var cp1 = {
      x: this.currentX_ + 2.0 / 3.0 * (cp.x - this.currentX_),
      y: this.currentY_ + 2.0 / 3.0 * (cp.y - this.currentY_)
    };
    var cp2 = {
      x: cp1.x + (p.x - this.currentX_) / 3.0,
      y: cp1.y + (p.y - this.currentY_) / 3.0
    };

    bezierCurveTo(this, cp1, cp2, p);
  };

  contextPrototype.arc = function(aX, aY, aRadius,
                                  aStartAngle, aEndAngle, aClockwise) {
    aRadius *= Z;
    var arcType = aClockwise ? 'at' : 'wa';

    var xStart = aX + mc(aStartAngle) * aRadius - Z2;
    var yStart = aY + ms(aStartAngle) * aRadius - Z2;

    var xEnd = aX + mc(aEndAngle) * aRadius - Z2;
    var yEnd = aY + ms(aEndAngle) * aRadius - Z2;

    // IE won't render arches drawn counter clockwise if xStart == xEnd.
    if (xStart == xEnd && !aClockwise) {
      xStart += 0.125; // Offset xStart by 1/80 of a pixel. Use something
                       // that can be represented in binary
    }

    var p = getSkewedCoords(this, aX, aY);
    var pStart = getSkewedCoords(this, xStart, yStart);
    var pEnd = getSkewedCoords(this, xEnd, yEnd);

    this.currentPath_.push({type: arcType,
                           x: p.x,
                           y: p.y,
                           radius: aRadius,
                           xStart: pStart.x,
                           yStart: pStart.y,
                           xEnd: pEnd.x,
                           yEnd: pEnd.y});

  };

  contextPrototype.rect = function(aX, aY, aWidth, aHeight) {
    this.moveTo(aX, aY);
    this.lineTo(aX + aWidth, aY);
    this.lineTo(aX + aWidth, aY + aHeight);
    this.lineTo(aX, aY + aHeight);
    this.closePath();
  };

  contextPrototype.strokeRect = function(aX, aY, aWidth, aHeight) {
    var oldPath = this.currentPath_;
    this.beginPath();

    this.moveTo(aX, aY);
    this.lineTo(aX + aWidth, aY);
    this.lineTo(aX + aWidth, aY + aHeight);
    this.lineTo(aX, aY + aHeight);
    this.closePath();
    this.stroke();

    this.currentPath_ = oldPath;
  };

  contextPrototype.fillRect = function(aX, aY, aWidth, aHeight) {
    var oldPath = this.currentPath_;
    this.beginPath();

    this.moveTo(aX, aY);
    this.lineTo(aX + aWidth, aY);
    this.lineTo(aX + aWidth, aY + aHeight);
    this.lineTo(aX, aY + aHeight);
    this.closePath();
    this.fill();

    this.currentPath_ = oldPath;
  };

  contextPrototype.createLinearGradient = function(aX0, aY0, aX1, aY1) {
    var gradient = new CanvasGradient_('gradient');
    gradient.x0_ = aX0;
    gradient.y0_ = aY0;
    gradient.x1_ = aX1;
    gradient.y1_ = aY1;
    return gradient;
  };

  contextPrototype.createRadialGradient = function(aX0, aY0, aR0,
                                                   aX1, aY1, aR1) {
    var gradient = new CanvasGradient_('gradientradial');
    gradient.x0_ = aX0;
    gradient.y0_ = aY0;
    gradient.r0_ = aR0;
    gradient.x1_ = aX1;
    gradient.y1_ = aY1;
    gradient.r1_ = aR1;
    return gradient;
  };

  contextPrototype.drawImage = function(image, var_args) {
    var dx, dy, dw, dh, sx, sy, sw, sh;

    // to find the original width we overide the width and height
    var oldRuntimeWidth = image.runtimeStyle.width;
    var oldRuntimeHeight = image.runtimeStyle.height;
    image.runtimeStyle.width = 'auto';
    image.runtimeStyle.height = 'auto';

    // get the original size
    var w = image.width;
    var h = image.height;
    var m_ = this.m_;

    // and remove overides
    image.runtimeStyle.width = oldRuntimeWidth;
    image.runtimeStyle.height = oldRuntimeHeight;

    if (arguments.length == 3) {
      dx = arguments[1];
      dy = arguments[2];
      sx = sy = 0;
      sw = dw = w;
      sh = dh = h;
    } else if (arguments.length == 5) {
      dx = arguments[1];
      dy = arguments[2];
      dw = arguments[3];
      dh = arguments[4];
      sx = sy = 0;
      sw = w;
      sh = h;
    } else if (arguments.length == 9) {
      sx = arguments[1];
      sy = arguments[2];
      sw = arguments[3];
      sh = arguments[4];
      dx = arguments[5];
      dy = arguments[6];
      dw = arguments[7];
      dh = arguments[8];
    } else {
      throw Error('Invalid number of arguments');
    }

    var w2 = sw / 2;
    var h2 = sh / 2;

    var vmlStr = [];

    var W = 10;
    var H = 10;

    var skewed = m_[1] || m_[2];
    var cropped = sx || sy;
    
    var scaleX = this.scaleX_;
    var scaleY = this.scaleY_;

    var x = this.x_ + dx * scaleX;
    var y = this.y_ + dy * scaleY;
    // If filters are necessary (rotation exists), create them
    // filters are bog-slow, so only create them if abbsolutely necessary
    // The following check doesn't account for skews (which don't exist
    // in the canvas spec (yet) anyway.
    if (!skewed || !cropped) {
      vmlStr.push('<img src="', image.src, '"',
          'style="position:absolute;left:', x, 'px;top:', y, 'px;');
      vmlStr.push('width:', scaleX * dw / sw * w, 'px;height:', scaleY * dh / sh * h, 'px;');
      if (this.globalAlpha < 1) {
        vmlStr.push('filter:alpha(opacity=', mr(this.globalAlpha * 100) + ')');
      }
      vmlStr.push('" />');
    } else if (skewed) {
      // For some reason that I've now forgotten, using divs didn't work
      vmlStr.push(' <g_vml_:group',
                  ' coordsize="', Z * W, ',', Z * H, '"',
                  ' coordorigin="0,0"' ,
                  ' style="width:', W, 'px;height:', H, 'px;position:absolute;');

      var d = getCoords(this, dx, dy);
      var filter = [];

      // Note the 12/21 reversal
      filter.push('M11=', this.m_[0][0] / scaleX, ',',
                  'M12=', this.m_[1][0] / scaleY, ',',
                  'M21=', this.m_[0][1] / scaleX, ',',
                  'M22=', this.m_[1][1] / scaleY, ',',
                  'Dx=', mr(d.x / Z), ',',
                  'Dy=', mr(d.y / Z), '');

      // Bounding box calculation (need to minimize displayed area so that
      // filters don't waste time on unused pixels.
      var max = d;
      var c2 = getCoords(this, dx + dw, dy);
      var c3 = getCoords(this, dx, dy + dh);
      var c4 = getCoords(this, dx + dw, dy + dh);

      max.x = m.max(max.x, c2.x, c3.x, c4.x);
      max.y = m.max(max.y, c2.y, c3.y, c4.y);

      vmlStr.push('padding:0 ', mr(max.x / Z), 'px ', mr(max.y / Z),
                  'px 0;filter:progid:DXImageTransform.Microsoft.Matrix(',
                  filter.join(''), ", SizingMethod='clip');>");

      if (cropped) {
        vmlStr.push('<div style="overflow: hidden; width:', Math.ceil((dw + sx * dw / sw) * scaleX), 'px;',
                  ' height:', Math.ceil((dh + sy * dh / sh) * scaleY), 'px;',
                  ' filter:progid:DxImageTransform.Microsoft.Matrix(Dx=',
                  -sx * dw / sw * scaleX, ',Dy=', -sy * dh / sh * scaleY, ');">');
      }

      vmlStr.push('<img src="', image.src, '"', 'style="position:absolute;');
      vmlStr.push('width:', scaleX * dw / sw * w, 'px;height:', scaleY * dh / sh * h, 'px;');
      if (this.globalAlpha < 1) {
        vmlStr.push('filter:alpha(opacity=', mr(this.globalAlpha * 100) + ')');
      }
      vmlStr.push('" />');
      if (cropped) {
        vmlStr.push('</div>');
      }
      vmlStr.push('</g_vml_:group>')
    } else {
      // Apply scales to width and height
      vmlStr.push('<div style="overflow: hidden; width:', Math.ceil((dw + sx * dw / sw) * scaleX), 'px;',
                  ' height:', Math.ceil((dh + sy * dh / sh) * scaleY), 'px;',
                  'position:absolute;left:', x, 'px;', 'top:', y, 'px;',
                  ' filter:progid:DxImageTransform.Microsoft.Matrix(Dx=',
                  -sx * dw / sw * scaleX, ',Dy=', -sy * dh / sh * scaleY, ');">');

      vmlStr.push('<img src="', image.src, '"', 'style="position:absolute;');
      vmlStr.push('width:', scaleX * dw / sw * w, 'px;height:', scaleY * dh / sh * h, 'px;');
      if (this.globalAlpha < 1) {
        vmlStr.push('filter:alpha(opacity=', mr(this.globalAlpha * 100) + ')');
      }
      vmlStr.push('" /></div>');
    }

    this.html_ += vmlStr.join('');
  };

  contextPrototype.stroke = function(aFill) {
    var lineStr = [];
    var lineOpen = false;

    var W = 10;
    var H = 10;

    var x_ = this.x_;
    var y_ = this.y_;

    lineStr.push('<g_vml_:shape',
                 ' filled="', !!aFill, '"',
                 ' style="position:absolute;width:', W, 'px;height:', H, 'px;', 'left:', x_, 'px;top:', y_, 'px;"',
                 ' coordorigin="0,0"',
                 ' coordsize="', Z * W, ',', Z * H, '"',
                 ' stroked="', !aFill, '"',
                 ' path="');

    var newSeq = false;
    var min = {x: null, y: null};
    var max = {x: null, y: null};

    for (var i = 0; i < this.currentPath_.length; i++) {
      var p = this.currentPath_[i];
      var c;

      switch (p.type) {
        case 'moveTo':
          c = p;
          lineStr.push(' m ', mr(p.x), ',', mr(p.y));
          break;
        case 'lineTo':
          lineStr.push(' l ', mr(p.x), ',', mr(p.y));
          break;
        case 'close':
          lineStr.push(' x ');
          p = null;
          break;
        case 'bezierCurveTo':
          lineStr.push(' c ',
                       mr(p.cp1x), ',', mr(p.cp1y), ',',
                       mr(p.cp2x), ',', mr(p.cp2y), ',',
                       mr(p.x), ',', mr(p.y));
          break;
        case 'at':
        case 'wa':
          lineStr.push(' ', p.type, ' ',
                       mr(p.x - this.scaleX_ * p.radius), ',',
                       mr(p.y - this.scaleY_ * p.radius), ' ',
                       mr(p.x + this.scaleX_ * p.radius), ',',
                       mr(p.y + this.scaleY_ * p.radius), ' ',
                       mr(p.xStart), ',', mr(p.yStart), ' ',
                       mr(p.xEnd), ',', mr(p.yEnd));
          break;
      }


      // TODO: Following is broken for curves due to
      //       move to proper paths.

      // Figure out dimensions so we can do gradient fills
      // properly
      if (p) {
        if (min.x == null || p.x < min.x) {
          min.x = p.x;
        }
        if (max.x == null || p.x > max.x) {
          max.x = p.x;
        }
        if (min.y == null || p.y < min.y) {
          min.y = p.y;
        }
        if (max.y == null || p.y > max.y) {
          max.y = p.y;
        }
      }
    }
    lineStr.push(' ">');

    if (!aFill) {
      appendStroke(this, lineStr);
    } else {
      appendFill(this, lineStr, min, max);
    }

    lineStr.push('</g_vml_:shape>');

    this.html_ += lineStr.join('');
  };

  function appendStroke(ctx, lineStr) {
    var a = processStyle(ctx.strokeStyle);
    var color = a.color;
    var opacity = a.alpha * ctx.globalAlpha;
    var lineWidth = ctx.lineScale_ * ctx.lineWidth;

    // VML cannot correctly render a line if the width is less than 1px.
    // In that case, we dilute the color to make the line look thinner.
    if (lineWidth < 1) {
      opacity *= lineWidth;
    }

    lineStr.push(
      '<g_vml_:stroke',
      ' opacity="', opacity, '"',
      ' joinstyle="', ctx.lineJoin, '"',
      ' miterlimit="', ctx.miterLimit, '"',
      ' endcap="', processLineCap(ctx.lineCap), '"',
      ' weight="', lineWidth, 'px"',
      ' color="', color, '" />'
    );
  }

  function appendFill(ctx, lineStr, min, max) {
    var fillStyle = ctx.fillStyle;
    var arcScaleX = ctx.scaleX_;
    var arcScaleY = ctx.scaleY_;
    var width = max.x - min.x;
    var height = max.y - min.y;
    if (fillStyle instanceof CanvasGradient_) {
      // TODO: Gradients transformed with the transformation matrix.
      var angle = 0;
      var focus = {x: 0, y: 0};

      // additional offset
      var shift = 0;
      // scale factor for offset
      var expansion = 1;

      if (fillStyle.type_ == 'gradient') {
        var x0 = fillStyle.x0_ / arcScaleX;
        var y0 = fillStyle.y0_ / arcScaleY;
        var x1 = fillStyle.x1_ / arcScaleX;
        var y1 = fillStyle.y1_ / arcScaleY;
        var p0 = getCoords(ctx, x0, y0);
        var p1 = getCoords(ctx, x1, y1);
        var dx = p1.x - p0.x;
        var dy = p1.y - p0.y;
        angle = Math.atan2(dx, dy) * 180 / Math.PI;

        // The angle should be a non-negative number.
        if (angle < 0) {
          angle += 360;
        }

        // Very small angles produce an unexpected result because they are
        // converted to a scientific notation string.
        if (angle < 1e-6) {
          angle = 0;
        }
      } else {
        var p0 = getCoords(ctx, fillStyle.x0_, fillStyle.y0_);
        focus = {
          x: (p0.x - min.x) / width,
          y: (p0.y - min.y) / height
        };

        width  /= arcScaleX * Z;
        height /= arcScaleY * Z;
        var dimension = m.max(width, height);
        shift = 2 * fillStyle.r0_ / dimension;
        expansion = 2 * fillStyle.r1_ / dimension - shift;
      }

      // We need to sort the color stops in ascending order by offset,
      // otherwise IE won't interpret it correctly.
      var stops = fillStyle.colors_;
      stops.sort(function(cs1, cs2) {
        return cs1.offset - cs2.offset;
      });

      var length = stops.length;
      var color1 = stops[0].color;
      var color2 = stops[length - 1].color;
      var opacity1 = stops[0].alpha * ctx.globalAlpha;
      var opacity2 = stops[length - 1].alpha * ctx.globalAlpha;

      var colors = [];
      for (var i = 0; i < length; i++) {
        var stop = stops[i];
        colors.push(stop.offset * expansion + shift + ' ' + stop.color);
      }

      // When colors attribute is used, the meanings of opacity and o:opacity2
      // are reversed.
      lineStr.push('<g_vml_:fill type="', fillStyle.type_, '"',
                   ' method="none" focus="100%"',
                   ' color="', color1, '"',
                   ' color2="', color2, '"',
                   ' colors="', colors.join(','), '"',
                   ' opacity="', opacity2, '"',
                   ' g_o_:opacity2="', opacity1, '"',
                   ' angle="', angle, '"',
                   ' focusposition="', focus.x, ',', focus.y, '" />');
    } else if (fillStyle instanceof CanvasPattern_) {
      if (width && height) {
        var deltaLeft = -min.x;
        var deltaTop = -min.y;
        lineStr.push('<g_vml_:fill',
                     ' position="',
                     deltaLeft / width * arcScaleX * arcScaleX, ',',
                     deltaTop / height * arcScaleY * arcScaleY, '"',
                     ' type="tile"',
                     // TODO: Figure out the correct size to fit the scale.
                     //' size="', w, 'px ', h, 'px"',
                     ' src="', fillStyle.src_, '" />');
       }
    } else {
      var a = processStyle(ctx.fillStyle);
      var color = a.color;
      var opacity = a.alpha * ctx.globalAlpha;
      lineStr.push('<g_vml_:fill color="', color, '" opacity="', opacity,
                   '" />');
    }
  }

  contextPrototype.fill = function() {
    this.stroke(true);
  };

  contextPrototype.closePath = function() {
    this.currentPath_.push({type: 'close'});
  };

  contextPrototype.save = function() {
    var o = {};
    copyState(this, o);
    this.aStack_.push(o);
    this.mStack_.push(this.m_);
    this.m_ = matrixMultiply(createMatrixIdentity(), this.m_);
  };

  contextPrototype.restore = function() {
    if (this.aStack_.length) {
      copyState(this.aStack_.pop(), this);
      this.m_ = this.mStack_.pop();
    }
  };

  function matrixIsFinite(m) {
    return isFinite(m[0][0]) && isFinite(m[0][1]) &&
        isFinite(m[1][0]) && isFinite(m[1][1]) &&
        isFinite(m[2][0]) && isFinite(m[2][1]);
  }

  function setM(ctx, m, updateLineScale) {
    if (!matrixIsFinite(m)) {
      return;
    }
    ctx.m_ = m;

    ctx.scaleX_ = Math.sqrt(m[0][0] * m[0][0] + m[0][1] * m[0][1]);
    ctx.scaleY_ = Math.sqrt(m[1][0] * m[1][0] + m[1][1] * m[1][1]);
    ctx.x_ = m[2][0];
    ctx.y_ = m[2][1];

    if (updateLineScale) {
      // Get the line scale.
      // Determinant of this.m_ means how much the area is enlarged by the
      // transformation. So its square root can be used as a scale factor
      // for width.
      var det = m[0][0] * m[1][1] - m[0][1] * m[1][0];
      ctx.lineScale_ = sqrt(abs(det));
    }
  }


  contextPrototype.translate = function(aX, aY) {
    var m1 = [
      [1,  0,  0],
      [0,  1,  0],
      [aX, aY, 1]
    ];

    setM(this, matrixMultiply(m1, this.m_), false);
  };

  contextPrototype.rotate = function(aRot) {
    var c = mc(aRot);
    var s = ms(aRot);

    var m1 = [
      [c,  s, 0],
      [-s, c, 0],
      [0,  0, 1]
    ];

    setM(this, matrixMultiply(m1, this.m_), false);
  };


  contextPrototype.scale = function(aX, aY) {
    var m1 = [
      [aX, 0,  0],
      [0,  aY, 0],
      [0,  0,  1]
    ];

    setM(this, matrixMultiply(m1, this.m_), true);
  };

  contextPrototype.transform = function(m11, m12, m21, m22, dx, dy) {
    var m1 = [
      [m11, m12, 0],
      [m21, m22, 0],
      [dx,  dy,  1]
    ];

    setM(this, matrixMultiply(m1, this.m_), true);

  };

  contextPrototype.setTransform = function(m11, m12, m21, m22, dx, dy) {
    
    var m = [
      [m11, m12, 0],
      [m21, m22, 0],
      [dx,  dy,  1]
    ];

    setM(this, m, true);
  };
  /**
   * The text drawing function.
   * The maxWidth argument isn't taken in account, since no browser supports
   * it yet.
   */
  contextPrototype.drawText_ = function(text, x, y, maxWidth, stroke) {
    var m = this.m_,
        delta = 1000,
        left = 0,
        right = delta,
        offset = {x: 0, y: 0},
        lineStr = [];

    var fontStyle = getComputedStyle(processFontStyle(this.font),
                                     this.element_);

    var fontStyleString = buildStyle(fontStyle);

    var elementStyle = this.element_.currentStyle;
    var textAlign = this.textAlign.toLowerCase();
    switch (textAlign) {
      case 'left':
      case 'center':
      case 'right':
        break;
      case 'end':
        textAlign = elementStyle.direction == 'ltr' ? 'right' : 'left';
        break;
      case 'start':
        textAlign = elementStyle.direction == 'rtl' ? 'right' : 'left';
        break;
      default:
        textAlign = 'left';
    }

    // 1.75 is an arbitrary number, as there is no info about the text baseline
    switch (this.textBaseline) {
      case 'hanging':
      case 'top':
        offset.y = fontStyle.size / 1.75;
        break;
      case 'middle':
        break;
      default:
      case null:
      case 'alphabetic':
      case 'ideographic':
      case 'bottom':
        offset.y = -fontStyle.size / 2.25;
        break;
    }

    switch(textAlign) {
      case 'right':
        left = delta;
        right = 0.05;
        break;
      case 'center':
        left = right = delta / 2;
        break;
    }

    var d = getCoords(this, x + offset.x, y + offset.y);

    lineStr.push('<g_vml_:line from="', -left ,' 0" to="', right ,' 0.05" ',
                 ' coordsize="100 100" coordorigin="0 0"',
                 ' filled="', !stroke, '" stroked="', !!stroke,
                 '" style="position:absolute;width:1px;height:1px;">');

    if (stroke) {
      appendStroke(this, lineStr);
    } else {
      // TODO: Fix the min and max params.
      appendFill(this, lineStr, {x: -left, y: 0},
                 {x: right, y: fontStyle.size});
    }

    var skewM = m[0][0].toFixed(3) + ',' + m[1][0].toFixed(3) + ',' +
                m[0][1].toFixed(3) + ',' + m[1][1].toFixed(3) + ',0,0';

    var skewOffset = mr(d.x / Z) + ',' + mr(d.y / Z);

    lineStr.push('<g_vml_:skew on="t" matrix="', skewM ,'" ',
                 ' offset="', skewOffset, '" origin="', left ,' 0" />',
                 '<g_vml_:path textpathok="true" />',
                 '<g_vml_:textpath on="true" string="',
                 encodeHtmlAttribute(text),
                 '" style="v-text-align:', textAlign,
                 ';font:', encodeHtmlAttribute(fontStyleString),
                 '" /></g_vml_:line>');

    this.html_ += lineStr.join('');
  };

  contextPrototype.fillText = function(text, x, y, maxWidth) {
    this.drawText_(text, x, y, maxWidth, false);
  };

  contextPrototype.strokeText = function(text, x, y, maxWidth) {
    this.drawText_(text, x, y, maxWidth, true);
  };

  contextPrototype.measureText = function(text) {
    if (!this.textMeasureEl_) {
      var s = '<span style="position:absolute;' +
          'top:-20000px;left:0;padding:0;margin:0;border:none;' +
          'white-space:pre;"></span>';
      this.element_.insertAdjacentHTML('beforeEnd', s);
      this.textMeasureEl_ = this.element_.lastChild;
    }
    var doc = this.element_.ownerDocument;
    this.textMeasureEl_.innerHTML = '';
    this.textMeasureEl_.style.font = this.font;
    // Don't use innerHTML or innerText because they allow markup/whitespace.
    this.textMeasureEl_.appendChild(doc.createTextNode(text));
    return {width: this.textMeasureEl_.offsetWidth};
  };

  /******** STUBS ********/
  contextPrototype.clip = function() {
    // TODO: Implement
  };

  contextPrototype.arcTo = function() {
    // TODO: Implement
  };

  contextPrototype.createPattern = function(image, repetition) {
    return new CanvasPattern_(image, repetition);
  };

  // Gradient / Pattern Stubs
  function CanvasGradient_(aType) {
    this.type_ = aType;
    this.x0_ = 0;
    this.y0_ = 0;
    this.r0_ = 0;
    this.x1_ = 0;
    this.y1_ = 0;
    this.r1_ = 0;
    this.colors_ = [];
  }

  CanvasGradient_.prototype.addColorStop = function(aOffset, aColor) {
    aColor = processStyle(aColor);
    this.colors_.push({offset: aOffset,
                       color: aColor.color,
                       alpha: aColor.alpha});
  };

  function CanvasPattern_(image, repetition) {
    assertImageIsValid(image);
    switch (repetition) {
      case 'repeat':
      case null:
      case '':
        this.repetition_ = 'repeat';
        break
      case 'repeat-x':
      case 'repeat-y':
      case 'no-repeat':
        this.repetition_ = repetition;
        break;
      default:
        throwException('SYNTAX_ERR');
    }

    this.src_ = image.src;
    this.width_ = image.width;
    this.height_ = image.height;
  }

  function throwException(s) {
    throw new DOMException_(s);
  }

  function assertImageIsValid(img) {
    if (!img || img.nodeType != 1 || img.tagName != 'IMG') {
      throwException('TYPE_MISMATCH_ERR');
    }
    if (img.readyState != 'complete') {
      throwException('INVALID_STATE_ERR');
    }
  }

  function DOMException_(s) {
    this.code = this[s];
    this.message = s +': DOM Exception ' + this.code;
  }
  var p = DOMException_.prototype = new Error;
  p.INDEX_SIZE_ERR = 1;
  p.DOMSTRING_SIZE_ERR = 2;
  p.HIERARCHY_REQUEST_ERR = 3;
  p.WRONG_DOCUMENT_ERR = 4;
  p.INVALID_CHARACTER_ERR = 5;
  p.NO_DATA_ALLOWED_ERR = 6;
  p.NO_MODIFICATION_ALLOWED_ERR = 7;
  p.NOT_FOUND_ERR = 8;
  p.NOT_SUPPORTED_ERR = 9;
  p.INUSE_ATTRIBUTE_ERR = 10;
  p.INVALID_STATE_ERR = 11;
  p.SYNTAX_ERR = 12;
  p.INVALID_MODIFICATION_ERR = 13;
  p.NAMESPACE_ERR = 14;
  p.INVALID_ACCESS_ERR = 15;
  p.VALIDATION_ERR = 16;
  p.TYPE_MISMATCH_ERR = 17;

  // set up externs
  G_vmlCanvasManager = G_vmlCanvasManager_;
  CanvasRenderingContext2D = CanvasRenderingContext2D_;
  CanvasGradient = CanvasGradient_;
  CanvasPattern = CanvasPattern_;
  DOMException = DOMException_;
})();

} // if
else { // make the canvas test simple by kener.linfeng@gmail.com
    G_vmlCanvasManager = false;
}
return G_vmlCanvasManager;
}); // define
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL2RlcC9leGNhbnZhczMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMDYgR29vZ2xlIEluYy5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuXG5cbi8vIEtub3duIElzc3Vlczpcbi8vXG4vLyAqIFBhdHRlcm5zIG9ubHkgc3VwcG9ydCByZXBlYXQuXG4vLyAqIFJhZGlhbCBncmFkaWVudCBhcmUgbm90IGltcGxlbWVudGVkLiBUaGUgVk1MIHZlcnNpb24gb2YgdGhlc2UgbG9vayB2ZXJ5XG4vLyAgIGRpZmZlcmVudCBmcm9tIHRoZSBjYW52YXMgb25lLlxuLy8gKiBDbGlwcGluZyBwYXRocyBhcmUgbm90IGltcGxlbWVudGVkLlxuLy8gKiBDb29yZHNpemUuIFRoZSB3aWR0aCBhbmQgaGVpZ2h0IGF0dHJpYnV0ZSBoYXZlIGhpZ2hlciBwcmlvcml0eSB0aGFuIHRoZVxuLy8gICB3aWR0aCBhbmQgaGVpZ2h0IHN0eWxlIHZhbHVlcyB3aGljaCBpc24ndCBjb3JyZWN0LlxuLy8gKiBQYWludGluZyBtb2RlIGlzbid0IGltcGxlbWVudGVkLlxuLy8gKiBDYW52YXMgd2lkdGgvaGVpZ2h0IHNob3VsZCBpcyB1c2luZyBjb250ZW50LWJveCBieSBkZWZhdWx0LiBJRSBpblxuLy8gICBRdWlya3MgbW9kZSB3aWxsIGRyYXcgdGhlIGNhbnZhcyB1c2luZyBib3JkZXItYm94LiBFaXRoZXIgY2hhbmdlIHlvdXJcbi8vICAgZG9jdHlwZSB0byBIVE1MNVxuLy8gICAoaHR0cDovL3d3dy53aGF0d2cub3JnL3NwZWNzL3dlYi1hcHBzL2N1cnJlbnQtd29yay8jdGhlLWRvY3R5cGUpXG4vLyAgIG9yIHVzZSBCb3ggU2l6aW5nIEJlaGF2aW9yIGZyb20gV2ViRlhcbi8vICAgKGh0dHA6Ly93ZWJmeC5lYWUubmV0L2RodG1sL2JveHNpemluZy9ib3hzaXppbmcuaHRtbClcbi8vICogTm9uIHVuaWZvcm0gc2NhbGluZyBkb2VzIG5vdCBjb3JyZWN0bHkgc2NhbGUgc3Ryb2tlcy5cbi8vICogT3B0aW1pemUuIFRoZXJlIGlzIGFsd2F5cyByb29tIGZvciBzcGVlZCBpbXByb3ZlbWVudHMuXG5cbi8vIEFNRCBieSBrZW5lci5saW5mZW5nQGdtYWlsLmNvbVxuZGVmaW5lKGZ1bmN0aW9uKHJlcXVpcmUpIHtcbiAgICBcbi8vIE9ubHkgYWRkIHRoaXMgY29kZSBpZiB3ZSBkbyBub3QgYWxyZWFkeSBoYXZlIGEgY2FudmFzIGltcGxlbWVudGF0aW9uXG5pZiAoIWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpLmdldENvbnRleHQpIHtcblxuKGZ1bmN0aW9uKCkge1xuXG4gIC8vIGFsaWFzIHNvbWUgZnVuY3Rpb25zIHRvIG1ha2UgKGNvbXBpbGVkKSBjb2RlIHNob3J0ZXJcbiAgdmFyIG0gPSBNYXRoO1xuICB2YXIgbXIgPSBtLnJvdW5kO1xuICB2YXIgbXMgPSBtLnNpbjtcbiAgdmFyIG1jID0gbS5jb3M7XG4gIHZhciBhYnMgPSBtLmFicztcbiAgdmFyIHNxcnQgPSBtLnNxcnQ7XG5cbiAgLy8gdGhpcyBpcyB1c2VkIGZvciBzdWIgcGl4ZWwgcHJlY2lzaW9uXG4gIHZhciBaID0gMTA7XG4gIHZhciBaMiA9IFogLyAyO1xuXG4gIHZhciBJRV9WRVJTSU9OID0gK25hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL01TSUUgKFtcXGQuXSspPy8pWzFdO1xuXG4gIC8qKlxuICAgKiBUaGlzIGZ1bnRpb24gaXMgYXNzaWduZWQgdG8gdGhlIDxjYW52YXM+IGVsZW1lbnRzIGFzIGVsZW1lbnQuZ2V0Q29udGV4dCgpLlxuICAgKiBAdGhpcyB7SFRNTEVsZW1lbnR9XG4gICAqIEByZXR1cm4ge0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRF99XG4gICAqL1xuICBmdW5jdGlvbiBnZXRDb250ZXh0KCkge1xuICAgIHJldHVybiB0aGlzLmNvbnRleHRfIHx8XG4gICAgICAgICh0aGlzLmNvbnRleHRfID0gbmV3IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRF8odGhpcykpO1xuICB9XG5cbiAgdmFyIHNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xuXG4gIC8qKlxuICAgKiBCaW5kcyBhIGZ1bmN0aW9uIHRvIGFuIG9iamVjdC4gVGhlIHJldHVybmVkIGZ1bmN0aW9uIHdpbGwgYWx3YXlzIHVzZSB0aGVcbiAgICogcGFzc2VkIGluIHtAY29kZSBvYmp9IGFzIHtAY29kZSB0aGlzfS5cbiAgICpcbiAgICogRXhhbXBsZTpcbiAgICpcbiAgICogICBnID0gYmluZChmLCBvYmosIGEsIGIpXG4gICAqICAgZyhjLCBkKSAvLyB3aWxsIGRvIGYuY2FsbChvYmosIGEsIGIsIGMsIGQpXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGYgVGhlIGZ1bmN0aW9uIHRvIGJpbmQgdGhlIG9iamVjdCB0b1xuICAgKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdGhhdCBzaG91bGQgYWN0IGFzIHRoaXMgd2hlbiB0aGUgZnVuY3Rpb25cbiAgICogICAgIGlzIGNhbGxlZFxuICAgKiBAcGFyYW0geyp9IHZhcl9hcmdzIFJlc3QgYXJndW1lbnRzIHRoYXQgd2lsbCBiZSB1c2VkIGFzIHRoZSBpbml0aWFsXG4gICAqICAgICBhcmd1bWVudHMgd2hlbiB0aGUgZnVuY3Rpb24gaXMgY2FsbGVkXG4gICAqIEByZXR1cm4ge0Z1bmN0aW9ufSBBIG5ldyBmdW5jdGlvbiB0aGF0IGhhcyBib3VuZCB0aGlzXG4gICAqL1xuICBmdW5jdGlvbiBiaW5kKGYsIG9iaiwgdmFyX2FyZ3MpIHtcbiAgICB2YXIgYSA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKTtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZi5hcHBseShvYmosIGEuY29uY2F0KHNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBlbmNvZGVIdG1sQXR0cmlidXRlKHMpIHtcbiAgICByZXR1cm4gU3RyaW5nKHMpLnJlcGxhY2UoLyYvZywgJyZhbXA7JykucmVwbGFjZSgvXCIvZywgJyZxdW90OycpO1xuICB9XG5cbiAgZnVuY3Rpb24gYWRkTmFtZXNwYWNlKGRvYywgcHJlZml4LCB1cm4pIHtcbiAgICBpZiAoIWRvYy5uYW1lc3BhY2VzW3ByZWZpeF0pIHtcbiAgICAgIGRvYy5uYW1lc3BhY2VzLmFkZChwcmVmaXgsIHVybiwgJyNkZWZhdWx0I1ZNTCcpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGFkZE5hbWVzcGFjZXNBbmRTdHlsZXNoZWV0KGRvYykge1xuICAgIGFkZE5hbWVzcGFjZShkb2MsICdnX3ZtbF8nLCAndXJuOnNjaGVtYXMtbWljcm9zb2Z0LWNvbTp2bWwnKTtcbiAgICBhZGROYW1lc3BhY2UoZG9jLCAnZ19vXycsICd1cm46c2NoZW1hcy1taWNyb3NvZnQtY29tOm9mZmljZTpvZmZpY2UnKTtcblxuICAgIC8vIFNldHVwIGRlZmF1bHQgQ1NTLiAgT25seSBhZGQgb25lIHN0eWxlIHNoZWV0IHBlciBkb2N1bWVudFxuICAgIGlmICghZG9jLnN0eWxlU2hlZXRzWydleF9jYW52YXNfJ10pIHtcbiAgICAgIHZhciBzcyA9IGRvYy5jcmVhdGVTdHlsZVNoZWV0KCk7XG4gICAgICBzcy5vd25pbmdFbGVtZW50LmlkID0gJ2V4X2NhbnZhc18nO1xuICAgICAgc3MuY3NzVGV4dCA9ICdjYW52YXN7ZGlzcGxheTppbmxpbmUtYmxvY2s7b3ZlcmZsb3c6aGlkZGVuOycgK1xuICAgICAgICAgIC8vIGRlZmF1bHQgc2l6ZSBpcyAzMDB4MTUwIGluIEdlY2tvIGFuZCBPcGVyYVxuICAgICAgICAgICd0ZXh0LWFsaWduOmxlZnQ7d2lkdGg6MzAwcHg7aGVpZ2h0OjE1MHB4fSc7XG4gICAgfVxuICB9XG5cbiAgLy8gQWRkIG5hbWVzcGFjZXMgYW5kIHN0eWxlc2hlZXQgYXQgc3RhcnR1cC5cbiAgYWRkTmFtZXNwYWNlc0FuZFN0eWxlc2hlZXQoZG9jdW1lbnQpO1xuXG4gIHZhciBHX3ZtbENhbnZhc01hbmFnZXJfID0ge1xuICAgIGluaXQ6IGZ1bmN0aW9uKG9wdF9kb2MpIHtcbiAgICAgIHZhciBkb2MgPSBvcHRfZG9jIHx8IGRvY3VtZW50O1xuICAgICAgLy8gQ3JlYXRlIGEgZHVtbXkgZWxlbWVudCBzbyB0aGF0IElFIHdpbGwgYWxsb3cgY2FudmFzIGVsZW1lbnRzIHRvIGJlXG4gICAgICAvLyByZWNvZ25pemVkLlxuICAgICAgZG9jLmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgZG9jLmF0dGFjaEV2ZW50KCdvbnJlYWR5c3RhdGVjaGFuZ2UnLCBiaW5kKHRoaXMuaW5pdF8sIHRoaXMsIGRvYykpO1xuICAgIH0sXG5cbiAgICBpbml0XzogZnVuY3Rpb24oZG9jKSB7XG4gICAgICAvLyBmaW5kIGFsbCBjYW52YXMgZWxlbWVudHNcbiAgICAgIHZhciBlbHMgPSBkb2MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2NhbnZhcycpO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdGhpcy5pbml0RWxlbWVudChlbHNbaV0pO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQdWJsaWMgaW5pdGlhbGl6ZXMgYSBjYW52YXMgZWxlbWVudCBzbyB0aGF0IGl0IGNhbiBiZSB1c2VkIGFzIGNhbnZhc1xuICAgICAqIGVsZW1lbnQgZnJvbSBub3cgb24uIFRoaXMgaXMgY2FsbGVkIGF1dG9tYXRpY2FsbHkgYmVmb3JlIHRoZSBwYWdlIGlzXG4gICAgICogbG9hZGVkIGJ1dCBpZiB5b3UgYXJlIGNyZWF0aW5nIGVsZW1lbnRzIHVzaW5nIGNyZWF0ZUVsZW1lbnQgeW91IG5lZWQgdG9cbiAgICAgKiBtYWtlIHN1cmUgdGhpcyBpcyBjYWxsZWQgb24gdGhlIGVsZW1lbnQuXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgVGhlIGNhbnZhcyBlbGVtZW50IHRvIGluaXRpYWxpemUuXG4gICAgICogQHJldHVybiB7SFRNTEVsZW1lbnR9IHRoZSBlbGVtZW50IHRoYXQgd2FzIGNyZWF0ZWQuXG4gICAgICovXG4gICAgaW5pdEVsZW1lbnQ6IGZ1bmN0aW9uKGVsKSB7XG4gICAgICBpZiAoIWVsLmdldENvbnRleHQpIHtcbiAgICAgICAgZWwuZ2V0Q29udGV4dCA9IGdldENvbnRleHQ7XG5cbiAgICAgICAgLy8gQWRkIG5hbWVzcGFjZXMgYW5kIHN0eWxlc2hlZXQgdG8gZG9jdW1lbnQgb2YgdGhlIGVsZW1lbnQuXG4gICAgICAgIGFkZE5hbWVzcGFjZXNBbmRTdHlsZXNoZWV0KGVsLm93bmVyRG9jdW1lbnQpO1xuXG4gICAgICAgIC8vIFJlbW92ZSBmYWxsYmFjayBjb250ZW50LiBUaGVyZSBpcyBubyB3YXkgdG8gaGlkZSB0ZXh0IG5vZGVzIHNvIHdlXG4gICAgICAgIC8vIGp1c3QgcmVtb3ZlIGFsbCBjaGlsZE5vZGVzLiBXZSBjb3VsZCBoaWRlIGFsbCBlbGVtZW50cyBhbmQgcmVtb3ZlXG4gICAgICAgIC8vIHRleHQgbm9kZXMgYnV0IHdobyByZWFsbHkgY2FyZXMgYWJvdXQgdGhlIGZhbGxiYWNrIGNvbnRlbnQuXG4gICAgICAgIGVsLmlubmVySFRNTCA9ICcnO1xuXG4gICAgICAgIC8vIGRvIG5vdCB1c2UgaW5saW5lIGZ1bmN0aW9uIGJlY2F1c2UgdGhhdCB3aWxsIGxlYWsgbWVtb3J5XG4gICAgICAgIGVsLmF0dGFjaEV2ZW50KCdvbnByb3BlcnR5Y2hhbmdlJywgb25Qcm9wZXJ0eUNoYW5nZSk7XG4gICAgICAgIGVsLmF0dGFjaEV2ZW50KCdvbnJlc2l6ZScsIG9uUmVzaXplKTtcblxuICAgICAgICB2YXIgYXR0cnMgPSBlbC5hdHRyaWJ1dGVzO1xuICAgICAgICBpZiAoYXR0cnMud2lkdGggJiYgYXR0cnMud2lkdGguc3BlY2lmaWVkKSB7XG4gICAgICAgICAgLy8gVE9ETzogdXNlIHJ1bnRpbWVTdHlsZSBhbmQgY29vcmRzaXplXG4gICAgICAgICAgLy8gZWwuZ2V0Q29udGV4dCgpLnNldFdpZHRoXyhhdHRycy53aWR0aC5ub2RlVmFsdWUpO1xuICAgICAgICAgIGVsLnN0eWxlLndpZHRoID0gYXR0cnMud2lkdGgubm9kZVZhbHVlICsgJ3B4JztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbC53aWR0aCA9IGVsLmNsaWVudFdpZHRoO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhdHRycy5oZWlnaHQgJiYgYXR0cnMuaGVpZ2h0LnNwZWNpZmllZCkge1xuICAgICAgICAgIC8vIFRPRE86IHVzZSBydW50aW1lU3R5bGUgYW5kIGNvb3Jkc2l6ZVxuICAgICAgICAgIC8vIGVsLmdldENvbnRleHQoKS5zZXRIZWlnaHRfKGF0dHJzLmhlaWdodC5ub2RlVmFsdWUpO1xuICAgICAgICAgIGVsLnN0eWxlLmhlaWdodCA9IGF0dHJzLmhlaWdodC5ub2RlVmFsdWUgKyAncHgnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVsLmhlaWdodCA9IGVsLmNsaWVudEhlaWdodDtcbiAgICAgICAgfVxuICAgICAgICAvL2VsLmdldENvbnRleHQoKS5zZXRDb29yZHNpemVfKClcbiAgICAgIH1cbiAgICAgIHJldHVybiBlbDtcbiAgICB9XG4gIH07XG5cbiAgZnVuY3Rpb24gb25Qcm9wZXJ0eUNoYW5nZShlKSB7XG4gICAgdmFyIGVsID0gZS5zcmNFbGVtZW50O1xuXG4gICAgc3dpdGNoIChlLnByb3BlcnR5TmFtZSkge1xuICAgICAgY2FzZSAnd2lkdGgnOlxuICAgICAgICBlbC5nZXRDb250ZXh0KCkuY2xlYXJSZWN0KCk7XG4gICAgICAgIGVsLnN0eWxlLndpZHRoID0gZWwuYXR0cmlidXRlcy53aWR0aC5ub2RlVmFsdWUgKyAncHgnO1xuICAgICAgICAvLyBJbiBJRTggdGhpcyBkb2VzIG5vdCB0cmlnZ2VyIG9ucmVzaXplLlxuICAgICAgICBlbC5maXJzdENoaWxkLnN0eWxlLndpZHRoID0gIGVsLmNsaWVudFdpZHRoICsgJ3B4JztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdoZWlnaHQnOlxuICAgICAgICBlbC5nZXRDb250ZXh0KCkuY2xlYXJSZWN0KCk7XG4gICAgICAgIGVsLnN0eWxlLmhlaWdodCA9IGVsLmF0dHJpYnV0ZXMuaGVpZ2h0Lm5vZGVWYWx1ZSArICdweCc7XG4gICAgICAgIGVsLmZpcnN0Q2hpbGQuc3R5bGUuaGVpZ2h0ID0gZWwuY2xpZW50SGVpZ2h0ICsgJ3B4JztcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gb25SZXNpemUoZSkge1xuICAgIHZhciBlbCA9IGUuc3JjRWxlbWVudDtcbiAgICBpZiAoZWwuZmlyc3RDaGlsZCkge1xuICAgICAgZWwuZmlyc3RDaGlsZC5zdHlsZS53aWR0aCA9ICBlbC5jbGllbnRXaWR0aCArICdweCc7XG4gICAgICBlbC5maXJzdENoaWxkLnN0eWxlLmhlaWdodCA9IGVsLmNsaWVudEhlaWdodCArICdweCc7XG4gICAgfVxuICB9XG5cbiAgR192bWxDYW52YXNNYW5hZ2VyXy5pbml0KCk7XG5cbiAgLy8gcHJlY29tcHV0ZSBcIjAwXCIgdG8gXCJGRlwiXG4gIHZhciBkZWNUb0hleCA9IFtdO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IDE2OyBpKyspIHtcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IDE2OyBqKyspIHtcbiAgICAgIGRlY1RvSGV4W2kgKiAxNiArIGpdID0gaS50b1N0cmluZygxNikgKyBqLnRvU3RyaW5nKDE2KTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBjcmVhdGVNYXRyaXhJZGVudGl0eSgpIHtcbiAgICByZXR1cm4gW1xuICAgICAgWzEsIDAsIDBdLFxuICAgICAgWzAsIDEsIDBdLFxuICAgICAgWzAsIDAsIDFdXG4gICAgXTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG1hdHJpeE11bHRpcGx5KG0xLCBtMikge1xuICAgIHZhciByZXN1bHQgPSBjcmVhdGVNYXRyaXhJZGVudGl0eSgpO1xuXG4gICAgZm9yICh2YXIgeCA9IDA7IHggPCAzOyB4KyspIHtcbiAgICAgIGZvciAodmFyIHkgPSAwOyB5IDwgMzsgeSsrKSB7XG4gICAgICAgIHZhciBzdW0gPSAwO1xuXG4gICAgICAgIGZvciAodmFyIHogPSAwOyB6IDwgMzsgeisrKSB7XG4gICAgICAgICAgc3VtICs9IG0xW3hdW3pdICogbTJbel1beV07XG4gICAgICAgIH1cblxuICAgICAgICByZXN1bHRbeF1beV0gPSBzdW07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRDb29yZHMoY3R4LCBhWCwgYVkpIHtcbiAgICB2YXIgbSA9IGN0eC5tXztcbiAgICByZXR1cm4ge1xuICAgICAgeDogWiAqIChhWCAqIG1bMF1bMF0gKyBhWSAqIG1bMV1bMF0gKyBtWzJdWzBdKSAtIFoyLFxuICAgICAgeTogWiAqIChhWCAqIG1bMF1bMV0gKyBhWSAqIG1bMV1bMV0gKyBtWzJdWzFdKSAtIFoyXG4gICAgfTtcbiAgfTtcblxuICBmdW5jdGlvbiBnZXRTa2V3ZWRDb29yZHMoY3R4LCBhWCwgYVkpIHtcbiAgICB2YXIgbSA9IGN0eC5tXztcbiAgICByZXR1cm4ge1xuICAgICAgeDogWiAqIChhWCAqIG1bMF1bMF0gKyBhWSAqIG1bMV1bMF0pIC0gWjIsXG4gICAgICB5OiBaICogKGFYICogbVswXVsxXSArIGFZICogbVsxXVsxXSkgLSBaMlxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBjb3B5U3RhdGUobzEsIG8yKSB7XG4gICAgbzIuZmlsbFN0eWxlICAgICA9IG8xLmZpbGxTdHlsZTtcbiAgICBvMi5saW5lQ2FwICAgICAgID0gbzEubGluZUNhcDtcbiAgICBvMi5saW5lSm9pbiAgICAgID0gbzEubGluZUpvaW47XG4gICAgbzIubGluZVdpZHRoICAgICA9IG8xLmxpbmVXaWR0aDtcbiAgICBvMi5taXRlckxpbWl0ICAgID0gbzEubWl0ZXJMaW1pdDtcbiAgICBvMi5zaGFkb3dCbHVyICAgID0gbzEuc2hhZG93Qmx1cjtcbiAgICBvMi5zaGFkb3dDb2xvciAgID0gbzEuc2hhZG93Q29sb3I7XG4gICAgbzIuc2hhZG93T2Zmc2V0WCA9IG8xLnNoYWRvd09mZnNldFg7XG4gICAgbzIuc2hhZG93T2Zmc2V0WSA9IG8xLnNoYWRvd09mZnNldFk7XG4gICAgbzIuc3Ryb2tlU3R5bGUgICA9IG8xLnN0cm9rZVN0eWxlO1xuICAgIG8yLmdsb2JhbEFscGhhICAgPSBvMS5nbG9iYWxBbHBoYTtcbiAgICBvMi5mb250ICAgICAgICAgID0gbzEuZm9udDtcbiAgICBvMi50ZXh0QWxpZ24gICAgID0gbzEudGV4dEFsaWduO1xuICAgIG8yLnRleHRCYXNlbGluZSAgPSBvMS50ZXh0QmFzZWxpbmU7XG4gICAgbzIuc2NhbGVYXyAgICAgICA9IG8xLnNjYWxlWF87XG4gICAgbzIuc2NhbGVZXyAgICAgICA9IG8xLnNjYWxlWV87XG4gICAgbzIueF8gICAgICAgICAgICA9IG8xLnhfO1xuICAgIG8yLnlfICAgICAgICAgICAgPSBvMS55XztcbiAgICBvMi5saW5lU2NhbGVfICAgID0gbzEubGluZVNjYWxlXztcbiAgfVxuXG4gIHZhciBjb2xvckRhdGEgPSB7XG4gICAgYWxpY2VibHVlOiAnI0YwRjhGRicsXG4gICAgYW50aXF1ZXdoaXRlOiAnI0ZBRUJENycsXG4gICAgYXF1YW1hcmluZTogJyM3RkZGRDQnLFxuICAgIGF6dXJlOiAnI0YwRkZGRicsXG4gICAgYmVpZ2U6ICcjRjVGNURDJyxcbiAgICBiaXNxdWU6ICcjRkZFNEM0JyxcbiAgICBibGFjazogJyMwMDAwMDAnLFxuICAgIGJsYW5jaGVkYWxtb25kOiAnI0ZGRUJDRCcsXG4gICAgYmx1ZXZpb2xldDogJyM4QTJCRTInLFxuICAgIGJyb3duOiAnI0E1MkEyQScsXG4gICAgYnVybHl3b29kOiAnI0RFQjg4NycsXG4gICAgY2FkZXRibHVlOiAnIzVGOUVBMCcsXG4gICAgY2hhcnRyZXVzZTogJyM3RkZGMDAnLFxuICAgIGNob2NvbGF0ZTogJyNEMjY5MUUnLFxuICAgIGNvcmFsOiAnI0ZGN0Y1MCcsXG4gICAgY29ybmZsb3dlcmJsdWU6ICcjNjQ5NUVEJyxcbiAgICBjb3Juc2lsazogJyNGRkY4REMnLFxuICAgIGNyaW1zb246ICcjREMxNDNDJyxcbiAgICBjeWFuOiAnIzAwRkZGRicsXG4gICAgZGFya2JsdWU6ICcjMDAwMDhCJyxcbiAgICBkYXJrY3lhbjogJyMwMDhCOEInLFxuICAgIGRhcmtnb2xkZW5yb2Q6ICcjQjg4NjBCJyxcbiAgICBkYXJrZ3JheTogJyNBOUE5QTknLFxuICAgIGRhcmtncmVlbjogJyMwMDY0MDAnLFxuICAgIGRhcmtncmV5OiAnI0E5QTlBOScsXG4gICAgZGFya2toYWtpOiAnI0JEQjc2QicsXG4gICAgZGFya21hZ2VudGE6ICcjOEIwMDhCJyxcbiAgICBkYXJrb2xpdmVncmVlbjogJyM1NTZCMkYnLFxuICAgIGRhcmtvcmFuZ2U6ICcjRkY4QzAwJyxcbiAgICBkYXJrb3JjaGlkOiAnIzk5MzJDQycsXG4gICAgZGFya3JlZDogJyM4QjAwMDAnLFxuICAgIGRhcmtzYWxtb246ICcjRTk5NjdBJyxcbiAgICBkYXJrc2VhZ3JlZW46ICcjOEZCQzhGJyxcbiAgICBkYXJrc2xhdGVibHVlOiAnIzQ4M0Q4QicsXG4gICAgZGFya3NsYXRlZ3JheTogJyMyRjRGNEYnLFxuICAgIGRhcmtzbGF0ZWdyZXk6ICcjMkY0RjRGJyxcbiAgICBkYXJrdHVycXVvaXNlOiAnIzAwQ0VEMScsXG4gICAgZGFya3Zpb2xldDogJyM5NDAwRDMnLFxuICAgIGRlZXBwaW5rOiAnI0ZGMTQ5MycsXG4gICAgZGVlcHNreWJsdWU6ICcjMDBCRkZGJyxcbiAgICBkaW1ncmF5OiAnIzY5Njk2OScsXG4gICAgZGltZ3JleTogJyM2OTY5NjknLFxuICAgIGRvZGdlcmJsdWU6ICcjMUU5MEZGJyxcbiAgICBmaXJlYnJpY2s6ICcjQjIyMjIyJyxcbiAgICBmbG9yYWx3aGl0ZTogJyNGRkZBRjAnLFxuICAgIGZvcmVzdGdyZWVuOiAnIzIyOEIyMicsXG4gICAgZ2FpbnNib3JvOiAnI0RDRENEQycsXG4gICAgZ2hvc3R3aGl0ZTogJyNGOEY4RkYnLFxuICAgIGdvbGQ6ICcjRkZENzAwJyxcbiAgICBnb2xkZW5yb2Q6ICcjREFBNTIwJyxcbiAgICBncmV5OiAnIzgwODA4MCcsXG4gICAgZ3JlZW55ZWxsb3c6ICcjQURGRjJGJyxcbiAgICBob25leWRldzogJyNGMEZGRjAnLFxuICAgIGhvdHBpbms6ICcjRkY2OUI0JyxcbiAgICBpbmRpYW5yZWQ6ICcjQ0Q1QzVDJyxcbiAgICBpbmRpZ286ICcjNEIwMDgyJyxcbiAgICBpdm9yeTogJyNGRkZGRjAnLFxuICAgIGtoYWtpOiAnI0YwRTY4QycsXG4gICAgbGF2ZW5kZXI6ICcjRTZFNkZBJyxcbiAgICBsYXZlbmRlcmJsdXNoOiAnI0ZGRjBGNScsXG4gICAgbGF3bmdyZWVuOiAnIzdDRkMwMCcsXG4gICAgbGVtb25jaGlmZm9uOiAnI0ZGRkFDRCcsXG4gICAgbGlnaHRibHVlOiAnI0FERDhFNicsXG4gICAgbGlnaHRjb3JhbDogJyNGMDgwODAnLFxuICAgIGxpZ2h0Y3lhbjogJyNFMEZGRkYnLFxuICAgIGxpZ2h0Z29sZGVucm9keWVsbG93OiAnI0ZBRkFEMicsXG4gICAgbGlnaHRncmVlbjogJyM5MEVFOTAnLFxuICAgIGxpZ2h0Z3JleTogJyNEM0QzRDMnLFxuICAgIGxpZ2h0cGluazogJyNGRkI2QzEnLFxuICAgIGxpZ2h0c2FsbW9uOiAnI0ZGQTA3QScsXG4gICAgbGlnaHRzZWFncmVlbjogJyMyMEIyQUEnLFxuICAgIGxpZ2h0c2t5Ymx1ZTogJyM4N0NFRkEnLFxuICAgIGxpZ2h0c2xhdGVncmF5OiAnIzc3ODg5OScsXG4gICAgbGlnaHRzbGF0ZWdyZXk6ICcjNzc4ODk5JyxcbiAgICBsaWdodHN0ZWVsYmx1ZTogJyNCMEM0REUnLFxuICAgIGxpZ2h0eWVsbG93OiAnI0ZGRkZFMCcsXG4gICAgbGltZWdyZWVuOiAnIzMyQ0QzMicsXG4gICAgbGluZW46ICcjRkFGMEU2JyxcbiAgICBtYWdlbnRhOiAnI0ZGMDBGRicsXG4gICAgbWVkaXVtYXF1YW1hcmluZTogJyM2NkNEQUEnLFxuICAgIG1lZGl1bWJsdWU6ICcjMDAwMENEJyxcbiAgICBtZWRpdW1vcmNoaWQ6ICcjQkE1NUQzJyxcbiAgICBtZWRpdW1wdXJwbGU6ICcjOTM3MERCJyxcbiAgICBtZWRpdW1zZWFncmVlbjogJyMzQ0IzNzEnLFxuICAgIG1lZGl1bXNsYXRlYmx1ZTogJyM3QjY4RUUnLFxuICAgIG1lZGl1bXNwcmluZ2dyZWVuOiAnIzAwRkE5QScsXG4gICAgbWVkaXVtdHVycXVvaXNlOiAnIzQ4RDFDQycsXG4gICAgbWVkaXVtdmlvbGV0cmVkOiAnI0M3MTU4NScsXG4gICAgbWlkbmlnaHRibHVlOiAnIzE5MTk3MCcsXG4gICAgbWludGNyZWFtOiAnI0Y1RkZGQScsXG4gICAgbWlzdHlyb3NlOiAnI0ZGRTRFMScsXG4gICAgbW9jY2FzaW46ICcjRkZFNEI1JyxcbiAgICBuYXZham93aGl0ZTogJyNGRkRFQUQnLFxuICAgIG9sZGxhY2U6ICcjRkRGNUU2JyxcbiAgICBvbGl2ZWRyYWI6ICcjNkI4RTIzJyxcbiAgICBvcmFuZ2U6ICcjRkZBNTAwJyxcbiAgICBvcmFuZ2VyZWQ6ICcjRkY0NTAwJyxcbiAgICBvcmNoaWQ6ICcjREE3MEQ2JyxcbiAgICBwYWxlZ29sZGVucm9kOiAnI0VFRThBQScsXG4gICAgcGFsZWdyZWVuOiAnIzk4RkI5OCcsXG4gICAgcGFsZXR1cnF1b2lzZTogJyNBRkVFRUUnLFxuICAgIHBhbGV2aW9sZXRyZWQ6ICcjREI3MDkzJyxcbiAgICBwYXBheWF3aGlwOiAnI0ZGRUZENScsXG4gICAgcGVhY2hwdWZmOiAnI0ZGREFCOScsXG4gICAgcGVydTogJyNDRDg1M0YnLFxuICAgIHBpbms6ICcjRkZDMENCJyxcbiAgICBwbHVtOiAnI0REQTBERCcsXG4gICAgcG93ZGVyYmx1ZTogJyNCMEUwRTYnLFxuICAgIHJvc3licm93bjogJyNCQzhGOEYnLFxuICAgIHJveWFsYmx1ZTogJyM0MTY5RTEnLFxuICAgIHNhZGRsZWJyb3duOiAnIzhCNDUxMycsXG4gICAgc2FsbW9uOiAnI0ZBODA3MicsXG4gICAgc2FuZHlicm93bjogJyNGNEE0NjAnLFxuICAgIHNlYWdyZWVuOiAnIzJFOEI1NycsXG4gICAgc2Vhc2hlbGw6ICcjRkZGNUVFJyxcbiAgICBzaWVubmE6ICcjQTA1MjJEJyxcbiAgICBza3libHVlOiAnIzg3Q0VFQicsXG4gICAgc2xhdGVibHVlOiAnIzZBNUFDRCcsXG4gICAgc2xhdGVncmF5OiAnIzcwODA5MCcsXG4gICAgc2xhdGVncmV5OiAnIzcwODA5MCcsXG4gICAgc25vdzogJyNGRkZBRkEnLFxuICAgIHNwcmluZ2dyZWVuOiAnIzAwRkY3RicsXG4gICAgc3RlZWxibHVlOiAnIzQ2ODJCNCcsXG4gICAgdGFuOiAnI0QyQjQ4QycsXG4gICAgdGhpc3RsZTogJyNEOEJGRDgnLFxuICAgIHRvbWF0bzogJyNGRjYzNDcnLFxuICAgIHR1cnF1b2lzZTogJyM0MEUwRDAnLFxuICAgIHZpb2xldDogJyNFRTgyRUUnLFxuICAgIHdoZWF0OiAnI0Y1REVCMycsXG4gICAgd2hpdGVzbW9rZTogJyNGNUY1RjUnLFxuICAgIHllbGxvd2dyZWVuOiAnIzlBQ0QzMidcbiAgfTtcblxuXG4gIGZ1bmN0aW9uIGdldFJnYkhzbENvbnRlbnQoc3R5bGVTdHJpbmcpIHtcbiAgICB2YXIgc3RhcnQgPSBzdHlsZVN0cmluZy5pbmRleE9mKCcoJywgMyk7XG4gICAgdmFyIGVuZCA9IHN0eWxlU3RyaW5nLmluZGV4T2YoJyknLCBzdGFydCArIDEpO1xuICAgIHZhciBwYXJ0cyA9IHN0eWxlU3RyaW5nLnN1YnN0cmluZyhzdGFydCArIDEsIGVuZCkuc3BsaXQoJywnKTtcbiAgICAvLyBhZGQgYWxwaGEgaWYgbmVlZGVkXG4gICAgaWYgKHBhcnRzLmxlbmd0aCAhPSA0IHx8IHN0eWxlU3RyaW5nLmNoYXJBdCgzKSAhPSAnYScpIHtcbiAgICAgIHBhcnRzWzNdID0gMTtcbiAgICB9XG4gICAgcmV0dXJuIHBhcnRzO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVyY2VudChzKSB7XG4gICAgcmV0dXJuIHBhcnNlRmxvYXQocykgLyAxMDA7XG4gIH1cblxuICBmdW5jdGlvbiBjbGFtcCh2LCBtaW4sIG1heCkge1xuICAgIHJldHVybiBNYXRoLm1pbihtYXgsIE1hdGgubWF4KG1pbiwgdikpO1xuICB9XG5cbiAgZnVuY3Rpb24gaHNsVG9SZ2IocGFydHMpe1xuICAgIHZhciByLCBnLCBiLCBoLCBzLCBsO1xuICAgIGggPSBwYXJzZUZsb2F0KHBhcnRzWzBdKSAvIDM2MCAlIDM2MDtcbiAgICBpZiAoaCA8IDApXG4gICAgICBoKys7XG4gICAgcyA9IGNsYW1wKHBlcmNlbnQocGFydHNbMV0pLCAwLCAxKTtcbiAgICBsID0gY2xhbXAocGVyY2VudChwYXJ0c1syXSksIDAsIDEpO1xuICAgIGlmIChzID09IDApIHtcbiAgICAgIHIgPSBnID0gYiA9IGw7IC8vIGFjaHJvbWF0aWNcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIHEgPSBsIDwgMC41ID8gbCAqICgxICsgcykgOiBsICsgcyAtIGwgKiBzO1xuICAgICAgdmFyIHAgPSAyICogbCAtIHE7XG4gICAgICByID0gaHVlVG9SZ2IocCwgcSwgaCArIDEgLyAzKTtcbiAgICAgIGcgPSBodWVUb1JnYihwLCBxLCBoKTtcbiAgICAgIGIgPSBodWVUb1JnYihwLCBxLCBoIC0gMSAvIDMpO1xuICAgIH1cblxuICAgIHJldHVybiAnIycgKyBkZWNUb0hleFtNYXRoLmZsb29yKHIgKiAyNTUpXSArXG4gICAgICAgIGRlY1RvSGV4W01hdGguZmxvb3IoZyAqIDI1NSldICtcbiAgICAgICAgZGVjVG9IZXhbTWF0aC5mbG9vcihiICogMjU1KV07XG4gIH1cblxuICBmdW5jdGlvbiBodWVUb1JnYihtMSwgbTIsIGgpIHtcbiAgICBpZiAoaCA8IDApXG4gICAgICBoKys7XG4gICAgaWYgKGggPiAxKVxuICAgICAgaC0tO1xuXG4gICAgaWYgKDYgKiBoIDwgMSlcbiAgICAgIHJldHVybiBtMSArIChtMiAtIG0xKSAqIDYgKiBoO1xuICAgIGVsc2UgaWYgKDIgKiBoIDwgMSlcbiAgICAgIHJldHVybiBtMjtcbiAgICBlbHNlIGlmICgzICogaCA8IDIpXG4gICAgICByZXR1cm4gbTEgKyAobTIgLSBtMSkgKiAoMiAvIDMgLSBoKSAqIDY7XG4gICAgZWxzZVxuICAgICAgcmV0dXJuIG0xO1xuICB9XG5cbiAgdmFyIHByb2Nlc3NTdHlsZUNhY2hlID0ge307XG5cbiAgZnVuY3Rpb24gcHJvY2Vzc1N0eWxlKHN0eWxlU3RyaW5nKSB7XG4gICAgaWYgKHN0eWxlU3RyaW5nIGluIHByb2Nlc3NTdHlsZUNhY2hlKSB7XG4gICAgICByZXR1cm4gcHJvY2Vzc1N0eWxlQ2FjaGVbc3R5bGVTdHJpbmddO1xuICAgIH1cblxuICAgIHZhciBzdHIsIGFscGhhID0gMTtcblxuICAgIHN0eWxlU3RyaW5nID0gU3RyaW5nKHN0eWxlU3RyaW5nKTtcbiAgICBpZiAoc3R5bGVTdHJpbmcuY2hhckF0KDApID09ICcjJykge1xuICAgICAgc3RyID0gc3R5bGVTdHJpbmc7XG4gICAgfSBlbHNlIGlmICgvXnJnYi8udGVzdChzdHlsZVN0cmluZykpIHtcbiAgICAgIHZhciBwYXJ0cyA9IGdldFJnYkhzbENvbnRlbnQoc3R5bGVTdHJpbmcpO1xuICAgICAgdmFyIHN0ciA9ICcjJywgbjtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMzsgaSsrKSB7XG4gICAgICAgIGlmIChwYXJ0c1tpXS5pbmRleE9mKCclJykgIT0gLTEpIHtcbiAgICAgICAgICBuID0gTWF0aC5mbG9vcihwZXJjZW50KHBhcnRzW2ldKSAqIDI1NSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbiA9ICtwYXJ0c1tpXTtcbiAgICAgICAgfVxuICAgICAgICBzdHIgKz0gZGVjVG9IZXhbY2xhbXAobiwgMCwgMjU1KV07XG4gICAgICB9XG4gICAgICBhbHBoYSA9ICtwYXJ0c1szXTtcbiAgICB9IGVsc2UgaWYgKC9eaHNsLy50ZXN0KHN0eWxlU3RyaW5nKSkge1xuICAgICAgdmFyIHBhcnRzID0gZ2V0UmdiSHNsQ29udGVudChzdHlsZVN0cmluZyk7XG4gICAgICBzdHIgPSBoc2xUb1JnYihwYXJ0cyk7XG4gICAgICBhbHBoYSA9IHBhcnRzWzNdO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjb2xvckRhdGFbc3R5bGVTdHJpbmddIHx8IHN0eWxlU3RyaW5nO1xuICAgIH1cbiAgICByZXR1cm4gcHJvY2Vzc1N0eWxlQ2FjaGVbc3R5bGVTdHJpbmddID0ge2NvbG9yOiBzdHIsIGFscGhhOiBhbHBoYX07XG4gIH1cblxuICB2YXIgREVGQVVMVF9TVFlMRSA9IHtcbiAgICBzdHlsZTogJ25vcm1hbCcsXG4gICAgdmFyaWFudDogJ25vcm1hbCcsXG4gICAgd2VpZ2h0OiAnbm9ybWFsJyxcbiAgICBzaXplOiAxMiwgICAgICAgICAgIC8vMTBcbiAgICBmYW1pbHk6ICflvq7ova/pm4Xpu5EnICAgICAvLydzYW5zLXNlcmlmJ1xuICB9O1xuXG4gIC8vIEludGVybmFsIHRleHQgc3R5bGUgY2FjaGVcbiAgdmFyIGZvbnRTdHlsZUNhY2hlID0ge307XG5cbiAgZnVuY3Rpb24gcHJvY2Vzc0ZvbnRTdHlsZShzdHlsZVN0cmluZykge1xuICAgIGlmIChmb250U3R5bGVDYWNoZVtzdHlsZVN0cmluZ10pIHtcbiAgICAgIHJldHVybiBmb250U3R5bGVDYWNoZVtzdHlsZVN0cmluZ107XG4gICAgfVxuXG4gICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdmFyIHN0eWxlID0gZWwuc3R5bGU7XG4gICAgdmFyIGZvbnRGYW1pbHk7XG4gICAgdHJ5IHtcbiAgICAgIHN0eWxlLmZvbnQgPSBzdHlsZVN0cmluZztcbiAgICAgIGZvbnRGYW1pbHkgPSBzdHlsZS5mb250RmFtaWx5LnNwbGl0KCcsJylbMF07XG4gICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgIC8vIElnbm9yZSBmYWlsdXJlcyB0byBzZXQgdG8gaW52YWxpZCBmb250LlxuICAgIH1cblxuICAgIHJldHVybiBmb250U3R5bGVDYWNoZVtzdHlsZVN0cmluZ10gPSB7XG4gICAgICBzdHlsZTogc3R5bGUuZm9udFN0eWxlIHx8IERFRkFVTFRfU1RZTEUuc3R5bGUsXG4gICAgICB2YXJpYW50OiBzdHlsZS5mb250VmFyaWFudCB8fCBERUZBVUxUX1NUWUxFLnZhcmlhbnQsXG4gICAgICB3ZWlnaHQ6IHN0eWxlLmZvbnRXZWlnaHQgfHwgREVGQVVMVF9TVFlMRS53ZWlnaHQsXG4gICAgICBzaXplOiBzdHlsZS5mb250U2l6ZSB8fCBERUZBVUxUX1NUWUxFLnNpemUsXG4gICAgICBmYW1pbHk6IGZvbnRGYW1pbHkgfHwgREVGQVVMVF9TVFlMRS5mYW1pbHlcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0Q29tcHV0ZWRTdHlsZShzdHlsZSwgZWxlbWVudCkge1xuICAgIHZhciBjb21wdXRlZFN0eWxlID0ge307XG5cbiAgICBmb3IgKHZhciBwIGluIHN0eWxlKSB7XG4gICAgICBjb21wdXRlZFN0eWxlW3BdID0gc3R5bGVbcF07XG4gICAgfVxuXG4gICAgLy8gQ29tcHV0ZSB0aGUgc2l6ZVxuICAgIHZhciBjYW52YXNGb250U2l6ZSA9IHBhcnNlRmxvYXQoZWxlbWVudC5jdXJyZW50U3R5bGUuZm9udFNpemUpLFxuICAgICAgICBmb250U2l6ZSA9IHBhcnNlRmxvYXQoc3R5bGUuc2l6ZSk7XG5cbiAgICBpZiAodHlwZW9mIHN0eWxlLnNpemUgPT0gJ251bWJlcicpIHtcbiAgICAgIGNvbXB1dGVkU3R5bGUuc2l6ZSA9IHN0eWxlLnNpemU7XG4gICAgfSBlbHNlIGlmIChzdHlsZS5zaXplLmluZGV4T2YoJ3B4JykgIT0gLTEpIHtcbiAgICAgIGNvbXB1dGVkU3R5bGUuc2l6ZSA9IGZvbnRTaXplO1xuICAgIH0gZWxzZSBpZiAoc3R5bGUuc2l6ZS5pbmRleE9mKCdlbScpICE9IC0xKSB7XG4gICAgICBjb21wdXRlZFN0eWxlLnNpemUgPSBjYW52YXNGb250U2l6ZSAqIGZvbnRTaXplO1xuICAgIH0gZWxzZSBpZihzdHlsZS5zaXplLmluZGV4T2YoJyUnKSAhPSAtMSkge1xuICAgICAgY29tcHV0ZWRTdHlsZS5zaXplID0gKGNhbnZhc0ZvbnRTaXplIC8gMTAwKSAqIGZvbnRTaXplO1xuICAgIH0gZWxzZSBpZiAoc3R5bGUuc2l6ZS5pbmRleE9mKCdwdCcpICE9IC0xKSB7XG4gICAgICBjb21wdXRlZFN0eWxlLnNpemUgPSBmb250U2l6ZSAvIC43NTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29tcHV0ZWRTdHlsZS5zaXplID0gY2FudmFzRm9udFNpemU7XG4gICAgfVxuXG4gICAgLy8gRGlmZmVyZW50IHNjYWxpbmcgYmV0d2VlbiBub3JtYWwgdGV4dCBhbmQgVk1MIHRleHQuIFRoaXMgd2FzIGZvdW5kIHVzaW5nXG4gICAgLy8gdHJpYWwgYW5kIGVycm9yIHRvIGdldCB0aGUgc2FtZSBzaXplIGFzIG5vbiBWTUwgdGV4dC5cbiAgICAvL2NvbXB1dGVkU3R5bGUuc2l6ZSAqPSAwLjk4MTtcblxuICAgIHJldHVybiBjb21wdXRlZFN0eWxlO1xuICB9XG5cbiAgZnVuY3Rpb24gYnVpbGRTdHlsZShzdHlsZSkge1xuICAgIHJldHVybiBzdHlsZS5zdHlsZSArICcgJyArIHN0eWxlLnZhcmlhbnQgKyAnICcgKyBzdHlsZS53ZWlnaHQgKyAnICcgK1xuICAgICAgICBzdHlsZS5zaXplICsgXCJweCAnXCIgKyBzdHlsZS5mYW1pbHkgKyBcIidcIjtcbiAgfVxuXG4gIHZhciBsaW5lQ2FwTWFwID0ge1xuICAgICdidXR0JzogJ2ZsYXQnLFxuICAgICdyb3VuZCc6ICdyb3VuZCdcbiAgfTtcblxuICBmdW5jdGlvbiBwcm9jZXNzTGluZUNhcChsaW5lQ2FwKSB7XG4gICAgcmV0dXJuIGxpbmVDYXBNYXBbbGluZUNhcF0gfHwgJ3NxdWFyZSc7XG4gIH1cblxuICAvKipcbiAgICogVGhpcyBjbGFzcyBpbXBsZW1lbnRzIENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCBpbnRlcmZhY2UgYXMgZGVzY3JpYmVkIGJ5XG4gICAqIHRoZSBXSEFUV0cuXG4gICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGNhbnZhc0VsZW1lbnQgVGhlIGVsZW1lbnQgdGhhdCB0aGUgMkQgY29udGV4dCBzaG91bGRcbiAgICogYmUgYXNzb2NpYXRlZCB3aXRoXG4gICAqL1xuICBmdW5jdGlvbiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkRfKGNhbnZhc0VsZW1lbnQpIHtcbiAgICB0aGlzLm1fID0gY3JlYXRlTWF0cml4SWRlbnRpdHkoKTtcblxuICAgIHRoaXMubVN0YWNrXyA9IFtdO1xuICAgIHRoaXMuYVN0YWNrXyA9IFtdO1xuICAgIHRoaXMuY3VycmVudFBhdGhfID0gW107XG5cbiAgICAvLyBDYW52YXMgY29udGV4dCBwcm9wZXJ0aWVzXG4gICAgdGhpcy5zdHJva2VTdHlsZSA9ICcjMDAwJztcbiAgICB0aGlzLmZpbGxTdHlsZSA9ICcjMDAwJztcblxuICAgIHRoaXMubGluZVdpZHRoID0gMTtcbiAgICB0aGlzLmxpbmVKb2luID0gJ21pdGVyJztcbiAgICB0aGlzLmxpbmVDYXAgPSAnYnV0dCc7XG4gICAgdGhpcy5taXRlckxpbWl0ID0gWiAqIDE7XG4gICAgdGhpcy5nbG9iYWxBbHBoYSA9IDE7XG4gICAgLy8gdGhpcy5mb250ID0gJzEwcHggc2Fucy1zZXJpZic7XG4gICAgdGhpcy5mb250ID0gJzEycHgg5b6u6L2v6ZuF6buRJzsgICAgICAgIC8vIOWGs+Wumui/mOaYr+aUuei/meWQp++8jOW9seWTjeS7o+S7t+acgOWwj1xuICAgIHRoaXMudGV4dEFsaWduID0gJ2xlZnQnO1xuICAgIHRoaXMudGV4dEJhc2VsaW5lID0gJ2FscGhhYmV0aWMnO1xuICAgIHRoaXMuY2FudmFzID0gY2FudmFzRWxlbWVudDtcblxuICAgIHZhciBjc3NUZXh0ID0gJ3dpZHRoOicgKyBjYW52YXNFbGVtZW50LmNsaWVudFdpZHRoICsgJ3B4O2hlaWdodDonICtcbiAgICAgICAgY2FudmFzRWxlbWVudC5jbGllbnRIZWlnaHQgKyAncHg7b3ZlcmZsb3c6aGlkZGVuO3Bvc2l0aW9uOmFic29sdXRlJztcbiAgICB2YXIgZWwgPSBjYW52YXNFbGVtZW50Lm93bmVyRG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgZWwuc3R5bGUuY3NzVGV4dCA9IGNzc1RleHQ7XG4gICAgY2FudmFzRWxlbWVudC5hcHBlbmRDaGlsZChlbCk7XG5cbiAgICB2YXIgb3ZlcmxheUVsID0gZWwuY2xvbmVOb2RlKGZhbHNlKTtcbiAgICAvLyBVc2UgYSBub24gdHJhbnNwYXJlbnQgYmFja2dyb3VuZC5cbiAgICBvdmVybGF5RWwuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJyNmZmYnOyAvL3JlZCwgSSBkb24ndCBrbm93IHdoeSwgaXQgd29yayEgXG4gICAgb3ZlcmxheUVsLnN0eWxlLmZpbHRlciA9ICdhbHBoYShvcGFjaXR5PTApJztcbiAgICBjYW52YXNFbGVtZW50LmFwcGVuZENoaWxkKG92ZXJsYXlFbCk7XG5cbiAgICB0aGlzLmVsZW1lbnRfID0gZWw7XG4gICAgdGhpcy5zY2FsZVhfID0gMTtcbiAgICB0aGlzLnNjYWxlWV8gPSAxO1xuICAgIHRoaXMueF8gPSAwO1xuICAgIHRoaXMueV8gPSAwO1xuICAgIHRoaXMubGluZVNjYWxlXyA9IDE7XG5cbiAgICB0aGlzLmh0bWxfID0gJyc7IFxuICB9XG5cbiAgdmFyIGNvbnRleHRQcm90b3R5cGUgPSBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkRfLnByb3RvdHlwZTtcbiAgY29udGV4dFByb3RvdHlwZS5jbGVhclJlY3QgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy50ZXh0TWVhc3VyZUVsXykge1xuICAgICAgdGhpcy50ZXh0TWVhc3VyZUVsXy5yZW1vdmVOb2RlKHRydWUpO1xuICAgICAgdGhpcy50ZXh0TWVhc3VyZUVsXyA9IG51bGw7XG4gICAgfVxuICAgIHRoaXMuZWxlbWVudF8uaW5uZXJIVE1MID0gJyc7XG4gIH07XG5cbiAgY29udGV4dFByb3RvdHlwZS5mbHVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmVsZW1lbnRfLmluc2VydEFkamFjZW50SFRNTCgnYmVmb3JlRW5kJywgdGhpcy5odG1sXyk7XG4gICAgdGhpcy5odG1sXyA9ICcnO1xuICB9XG5cbiAgY29udGV4dFByb3RvdHlwZS5iZWdpblBhdGggPSBmdW5jdGlvbigpIHtcbiAgICAvLyBUT0RPOiBCcmFuY2ggY3VycmVudCBtYXRyaXggc28gdGhhdCBzYXZlL3Jlc3RvcmUgaGFzIG5vIGVmZmVjdFxuICAgIC8vICAgICAgIGFzIHBlciBzYWZhcmkgZG9jcy5cbiAgICB0aGlzLmN1cnJlbnRQYXRoXyA9IFtdO1xuICB9O1xuXG4gIGNvbnRleHRQcm90b3R5cGUubW92ZVRvID0gZnVuY3Rpb24oYVgsIGFZKSB7XG4gICAgdmFyIHAgPSBnZXRTa2V3ZWRDb29yZHModGhpcywgYVgsIGFZKTtcbiAgICBwLnR5cGUgPSAnbW92ZVRvJztcbiAgICB0aGlzLmN1cnJlbnRQYXRoXy5wdXNoKHApO1xuICAgIHRoaXMuY3VycmVudFhfID0gcC54O1xuICAgIHRoaXMuY3VycmVudFlfID0gcC55O1xuICB9O1xuXG4gIGNvbnRleHRQcm90b3R5cGUubGluZVRvID0gZnVuY3Rpb24oYVgsIGFZKSB7XG4gICAgdmFyIHAgPSBnZXRTa2V3ZWRDb29yZHModGhpcywgYVgsIGFZKTtcbiAgICBwLnR5cGUgPSAnbGluZVRvJztcbiAgICB0aGlzLmN1cnJlbnRQYXRoXy5wdXNoKHApO1xuXG4gICAgdGhpcy5jdXJyZW50WF8gPSBwLng7XG4gICAgdGhpcy5jdXJyZW50WV8gPSBwLnk7XG4gIH07XG5cbiAgY29udGV4dFByb3RvdHlwZS5iZXppZXJDdXJ2ZVRvID0gZnVuY3Rpb24oYUNQMXgsIGFDUDF5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhQ1AyeCwgYUNQMnksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFYLCBhWSkge1xuICAgIHZhciBwID0gZ2V0U2tld2VkQ29vcmRzKHRoaXMsIGFYLCBhWSk7XG4gICAgdmFyIGNwMSA9IGdldFNrZXdlZENvb3Jkcyh0aGlzLCBhQ1AxeCwgYUNQMXkpO1xuICAgIHZhciBjcDIgPSBnZXRTa2V3ZWRDb29yZHModGhpcywgYUNQMngsIGFDUDJ5KTtcbiAgICBiZXppZXJDdXJ2ZVRvKHRoaXMsIGNwMSwgY3AyLCBwKTtcbiAgfTtcblxuICAvLyBIZWxwZXIgZnVuY3Rpb24gdGhhdCB0YWtlcyB0aGUgYWxyZWFkeSBmaXhlZCBjb3JkaW5hdGVzLlxuICBmdW5jdGlvbiBiZXppZXJDdXJ2ZVRvKHNlbGYsIGNwMSwgY3AyLCBwKSB7XG4gICAgc2VsZi5jdXJyZW50UGF0aF8ucHVzaCh7XG4gICAgICB0eXBlOiAnYmV6aWVyQ3VydmVUbycsXG4gICAgICBjcDF4OiBjcDEueCxcbiAgICAgIGNwMXk6IGNwMS55LFxuICAgICAgY3AyeDogY3AyLngsXG4gICAgICBjcDJ5OiBjcDIueSxcbiAgICAgIHg6IHAueCxcbiAgICAgIHk6IHAueVxuICAgIH0pO1xuICAgIHNlbGYuY3VycmVudFhfID0gcC54O1xuICAgIHNlbGYuY3VycmVudFlfID0gcC55O1xuICB9XG5cbiAgY29udGV4dFByb3RvdHlwZS5xdWFkcmF0aWNDdXJ2ZVRvID0gZnVuY3Rpb24oYUNQeCwgYUNQeSwgYVgsIGFZKSB7XG4gICAgLy8gdGhlIGZvbGxvd2luZyBpcyBsaWZ0ZWQgYWxtb3N0IGRpcmVjdGx5IGZyb21cbiAgICAvLyBodHRwOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL2RvY3MvQ2FudmFzX3R1dG9yaWFsOkRyYXdpbmdfc2hhcGVzXG5cbiAgICB2YXIgY3AgPSBnZXRTa2V3ZWRDb29yZHModGhpcywgYUNQeCwgYUNQeSk7XG4gICAgdmFyIHAgPSBnZXRTa2V3ZWRDb29yZHModGhpcywgYVgsIGFZKTtcblxuICAgIHZhciBjcDEgPSB7XG4gICAgICB4OiB0aGlzLmN1cnJlbnRYXyArIDIuMCAvIDMuMCAqIChjcC54IC0gdGhpcy5jdXJyZW50WF8pLFxuICAgICAgeTogdGhpcy5jdXJyZW50WV8gKyAyLjAgLyAzLjAgKiAoY3AueSAtIHRoaXMuY3VycmVudFlfKVxuICAgIH07XG4gICAgdmFyIGNwMiA9IHtcbiAgICAgIHg6IGNwMS54ICsgKHAueCAtIHRoaXMuY3VycmVudFhfKSAvIDMuMCxcbiAgICAgIHk6IGNwMS55ICsgKHAueSAtIHRoaXMuY3VycmVudFlfKSAvIDMuMFxuICAgIH07XG5cbiAgICBiZXppZXJDdXJ2ZVRvKHRoaXMsIGNwMSwgY3AyLCBwKTtcbiAgfTtcblxuICBjb250ZXh0UHJvdG90eXBlLmFyYyA9IGZ1bmN0aW9uKGFYLCBhWSwgYVJhZGl1cyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhU3RhcnRBbmdsZSwgYUVuZEFuZ2xlLCBhQ2xvY2t3aXNlKSB7XG4gICAgYVJhZGl1cyAqPSBaO1xuICAgIHZhciBhcmNUeXBlID0gYUNsb2Nrd2lzZSA/ICdhdCcgOiAnd2EnO1xuXG4gICAgdmFyIHhTdGFydCA9IGFYICsgbWMoYVN0YXJ0QW5nbGUpICogYVJhZGl1cyAtIFoyO1xuICAgIHZhciB5U3RhcnQgPSBhWSArIG1zKGFTdGFydEFuZ2xlKSAqIGFSYWRpdXMgLSBaMjtcblxuICAgIHZhciB4RW5kID0gYVggKyBtYyhhRW5kQW5nbGUpICogYVJhZGl1cyAtIFoyO1xuICAgIHZhciB5RW5kID0gYVkgKyBtcyhhRW5kQW5nbGUpICogYVJhZGl1cyAtIFoyO1xuXG4gICAgLy8gSUUgd29uJ3QgcmVuZGVyIGFyY2hlcyBkcmF3biBjb3VudGVyIGNsb2Nrd2lzZSBpZiB4U3RhcnQgPT0geEVuZC5cbiAgICBpZiAoeFN0YXJ0ID09IHhFbmQgJiYgIWFDbG9ja3dpc2UpIHtcbiAgICAgIHhTdGFydCArPSAwLjEyNTsgLy8gT2Zmc2V0IHhTdGFydCBieSAxLzgwIG9mIGEgcGl4ZWwuIFVzZSBzb21ldGhpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhhdCBjYW4gYmUgcmVwcmVzZW50ZWQgaW4gYmluYXJ5XG4gICAgfVxuXG4gICAgdmFyIHAgPSBnZXRTa2V3ZWRDb29yZHModGhpcywgYVgsIGFZKTtcbiAgICB2YXIgcFN0YXJ0ID0gZ2V0U2tld2VkQ29vcmRzKHRoaXMsIHhTdGFydCwgeVN0YXJ0KTtcbiAgICB2YXIgcEVuZCA9IGdldFNrZXdlZENvb3Jkcyh0aGlzLCB4RW5kLCB5RW5kKTtcblxuICAgIHRoaXMuY3VycmVudFBhdGhfLnB1c2goe3R5cGU6IGFyY1R5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICB4OiBwLngsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICB5OiBwLnksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICByYWRpdXM6IGFSYWRpdXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICB4U3RhcnQ6IHBTdGFydC54LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgeVN0YXJ0OiBwU3RhcnQueSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHhFbmQ6IHBFbmQueCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHlFbmQ6IHBFbmQueX0pO1xuXG4gIH07XG5cbiAgY29udGV4dFByb3RvdHlwZS5yZWN0ID0gZnVuY3Rpb24oYVgsIGFZLCBhV2lkdGgsIGFIZWlnaHQpIHtcbiAgICB0aGlzLm1vdmVUbyhhWCwgYVkpO1xuICAgIHRoaXMubGluZVRvKGFYICsgYVdpZHRoLCBhWSk7XG4gICAgdGhpcy5saW5lVG8oYVggKyBhV2lkdGgsIGFZICsgYUhlaWdodCk7XG4gICAgdGhpcy5saW5lVG8oYVgsIGFZICsgYUhlaWdodCk7XG4gICAgdGhpcy5jbG9zZVBhdGgoKTtcbiAgfTtcblxuICBjb250ZXh0UHJvdG90eXBlLnN0cm9rZVJlY3QgPSBmdW5jdGlvbihhWCwgYVksIGFXaWR0aCwgYUhlaWdodCkge1xuICAgIHZhciBvbGRQYXRoID0gdGhpcy5jdXJyZW50UGF0aF87XG4gICAgdGhpcy5iZWdpblBhdGgoKTtcblxuICAgIHRoaXMubW92ZVRvKGFYLCBhWSk7XG4gICAgdGhpcy5saW5lVG8oYVggKyBhV2lkdGgsIGFZKTtcbiAgICB0aGlzLmxpbmVUbyhhWCArIGFXaWR0aCwgYVkgKyBhSGVpZ2h0KTtcbiAgICB0aGlzLmxpbmVUbyhhWCwgYVkgKyBhSGVpZ2h0KTtcbiAgICB0aGlzLmNsb3NlUGF0aCgpO1xuICAgIHRoaXMuc3Ryb2tlKCk7XG5cbiAgICB0aGlzLmN1cnJlbnRQYXRoXyA9IG9sZFBhdGg7XG4gIH07XG5cbiAgY29udGV4dFByb3RvdHlwZS5maWxsUmVjdCA9IGZ1bmN0aW9uKGFYLCBhWSwgYVdpZHRoLCBhSGVpZ2h0KSB7XG4gICAgdmFyIG9sZFBhdGggPSB0aGlzLmN1cnJlbnRQYXRoXztcbiAgICB0aGlzLmJlZ2luUGF0aCgpO1xuXG4gICAgdGhpcy5tb3ZlVG8oYVgsIGFZKTtcbiAgICB0aGlzLmxpbmVUbyhhWCArIGFXaWR0aCwgYVkpO1xuICAgIHRoaXMubGluZVRvKGFYICsgYVdpZHRoLCBhWSArIGFIZWlnaHQpO1xuICAgIHRoaXMubGluZVRvKGFYLCBhWSArIGFIZWlnaHQpO1xuICAgIHRoaXMuY2xvc2VQYXRoKCk7XG4gICAgdGhpcy5maWxsKCk7XG5cbiAgICB0aGlzLmN1cnJlbnRQYXRoXyA9IG9sZFBhdGg7XG4gIH07XG5cbiAgY29udGV4dFByb3RvdHlwZS5jcmVhdGVMaW5lYXJHcmFkaWVudCA9IGZ1bmN0aW9uKGFYMCwgYVkwLCBhWDEsIGFZMSkge1xuICAgIHZhciBncmFkaWVudCA9IG5ldyBDYW52YXNHcmFkaWVudF8oJ2dyYWRpZW50Jyk7XG4gICAgZ3JhZGllbnQueDBfID0gYVgwO1xuICAgIGdyYWRpZW50LnkwXyA9IGFZMDtcbiAgICBncmFkaWVudC54MV8gPSBhWDE7XG4gICAgZ3JhZGllbnQueTFfID0gYVkxO1xuICAgIHJldHVybiBncmFkaWVudDtcbiAgfTtcblxuICBjb250ZXh0UHJvdG90eXBlLmNyZWF0ZVJhZGlhbEdyYWRpZW50ID0gZnVuY3Rpb24oYVgwLCBhWTAsIGFSMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFYMSwgYVkxLCBhUjEpIHtcbiAgICB2YXIgZ3JhZGllbnQgPSBuZXcgQ2FudmFzR3JhZGllbnRfKCdncmFkaWVudHJhZGlhbCcpO1xuICAgIGdyYWRpZW50LngwXyA9IGFYMDtcbiAgICBncmFkaWVudC55MF8gPSBhWTA7XG4gICAgZ3JhZGllbnQucjBfID0gYVIwO1xuICAgIGdyYWRpZW50LngxXyA9IGFYMTtcbiAgICBncmFkaWVudC55MV8gPSBhWTE7XG4gICAgZ3JhZGllbnQucjFfID0gYVIxO1xuICAgIHJldHVybiBncmFkaWVudDtcbiAgfTtcblxuICBjb250ZXh0UHJvdG90eXBlLmRyYXdJbWFnZSA9IGZ1bmN0aW9uKGltYWdlLCB2YXJfYXJncykge1xuICAgIHZhciBkeCwgZHksIGR3LCBkaCwgc3gsIHN5LCBzdywgc2g7XG5cbiAgICAvLyB0byBmaW5kIHRoZSBvcmlnaW5hbCB3aWR0aCB3ZSBvdmVyaWRlIHRoZSB3aWR0aCBhbmQgaGVpZ2h0XG4gICAgdmFyIG9sZFJ1bnRpbWVXaWR0aCA9IGltYWdlLnJ1bnRpbWVTdHlsZS53aWR0aDtcbiAgICB2YXIgb2xkUnVudGltZUhlaWdodCA9IGltYWdlLnJ1bnRpbWVTdHlsZS5oZWlnaHQ7XG4gICAgaW1hZ2UucnVudGltZVN0eWxlLndpZHRoID0gJ2F1dG8nO1xuICAgIGltYWdlLnJ1bnRpbWVTdHlsZS5oZWlnaHQgPSAnYXV0byc7XG5cbiAgICAvLyBnZXQgdGhlIG9yaWdpbmFsIHNpemVcbiAgICB2YXIgdyA9IGltYWdlLndpZHRoO1xuICAgIHZhciBoID0gaW1hZ2UuaGVpZ2h0O1xuICAgIHZhciBtXyA9IHRoaXMubV87XG5cbiAgICAvLyBhbmQgcmVtb3ZlIG92ZXJpZGVzXG4gICAgaW1hZ2UucnVudGltZVN0eWxlLndpZHRoID0gb2xkUnVudGltZVdpZHRoO1xuICAgIGltYWdlLnJ1bnRpbWVTdHlsZS5oZWlnaHQgPSBvbGRSdW50aW1lSGVpZ2h0O1xuXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT0gMykge1xuICAgICAgZHggPSBhcmd1bWVudHNbMV07XG4gICAgICBkeSA9IGFyZ3VtZW50c1syXTtcbiAgICAgIHN4ID0gc3kgPSAwO1xuICAgICAgc3cgPSBkdyA9IHc7XG4gICAgICBzaCA9IGRoID0gaDtcbiAgICB9IGVsc2UgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT0gNSkge1xuICAgICAgZHggPSBhcmd1bWVudHNbMV07XG4gICAgICBkeSA9IGFyZ3VtZW50c1syXTtcbiAgICAgIGR3ID0gYXJndW1lbnRzWzNdO1xuICAgICAgZGggPSBhcmd1bWVudHNbNF07XG4gICAgICBzeCA9IHN5ID0gMDtcbiAgICAgIHN3ID0gdztcbiAgICAgIHNoID0gaDtcbiAgICB9IGVsc2UgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT0gOSkge1xuICAgICAgc3ggPSBhcmd1bWVudHNbMV07XG4gICAgICBzeSA9IGFyZ3VtZW50c1syXTtcbiAgICAgIHN3ID0gYXJndW1lbnRzWzNdO1xuICAgICAgc2ggPSBhcmd1bWVudHNbNF07XG4gICAgICBkeCA9IGFyZ3VtZW50c1s1XTtcbiAgICAgIGR5ID0gYXJndW1lbnRzWzZdO1xuICAgICAgZHcgPSBhcmd1bWVudHNbN107XG4gICAgICBkaCA9IGFyZ3VtZW50c1s4XTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgRXJyb3IoJ0ludmFsaWQgbnVtYmVyIG9mIGFyZ3VtZW50cycpO1xuICAgIH1cblxuICAgIHZhciB3MiA9IHN3IC8gMjtcbiAgICB2YXIgaDIgPSBzaCAvIDI7XG5cbiAgICB2YXIgdm1sU3RyID0gW107XG5cbiAgICB2YXIgVyA9IDEwO1xuICAgIHZhciBIID0gMTA7XG5cbiAgICB2YXIgc2tld2VkID0gbV9bMV0gfHwgbV9bMl07XG4gICAgdmFyIGNyb3BwZWQgPSBzeCB8fCBzeTtcbiAgICBcbiAgICB2YXIgc2NhbGVYID0gdGhpcy5zY2FsZVhfO1xuICAgIHZhciBzY2FsZVkgPSB0aGlzLnNjYWxlWV87XG5cbiAgICB2YXIgeCA9IHRoaXMueF8gKyBkeCAqIHNjYWxlWDtcbiAgICB2YXIgeSA9IHRoaXMueV8gKyBkeSAqIHNjYWxlWTtcbiAgICAvLyBJZiBmaWx0ZXJzIGFyZSBuZWNlc3NhcnkgKHJvdGF0aW9uIGV4aXN0cyksIGNyZWF0ZSB0aGVtXG4gICAgLy8gZmlsdGVycyBhcmUgYm9nLXNsb3csIHNvIG9ubHkgY3JlYXRlIHRoZW0gaWYgYWJic29sdXRlbHkgbmVjZXNzYXJ5XG4gICAgLy8gVGhlIGZvbGxvd2luZyBjaGVjayBkb2Vzbid0IGFjY291bnQgZm9yIHNrZXdzICh3aGljaCBkb24ndCBleGlzdFxuICAgIC8vIGluIHRoZSBjYW52YXMgc3BlYyAoeWV0KSBhbnl3YXkuXG4gICAgaWYgKCFza2V3ZWQgfHwgIWNyb3BwZWQpIHtcbiAgICAgIHZtbFN0ci5wdXNoKCc8aW1nIHNyYz1cIicsIGltYWdlLnNyYywgJ1wiJyxcbiAgICAgICAgICAnc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTtsZWZ0OicsIHgsICdweDt0b3A6JywgeSwgJ3B4OycpO1xuICAgICAgdm1sU3RyLnB1c2goJ3dpZHRoOicsIHNjYWxlWCAqIGR3IC8gc3cgKiB3LCAncHg7aGVpZ2h0OicsIHNjYWxlWSAqIGRoIC8gc2ggKiBoLCAncHg7Jyk7XG4gICAgICBpZiAodGhpcy5nbG9iYWxBbHBoYSA8IDEpIHtcbiAgICAgICAgdm1sU3RyLnB1c2goJ2ZpbHRlcjphbHBoYShvcGFjaXR5PScsIG1yKHRoaXMuZ2xvYmFsQWxwaGEgKiAxMDApICsgJyknKTtcbiAgICAgIH1cbiAgICAgIHZtbFN0ci5wdXNoKCdcIiAvPicpO1xuICAgIH0gZWxzZSBpZiAoc2tld2VkKSB7XG4gICAgICAvLyBGb3Igc29tZSByZWFzb24gdGhhdCBJJ3ZlIG5vdyBmb3Jnb3R0ZW4sIHVzaW5nIGRpdnMgZGlkbid0IHdvcmtcbiAgICAgIHZtbFN0ci5wdXNoKCcgPGdfdm1sXzpncm91cCcsXG4gICAgICAgICAgICAgICAgICAnIGNvb3Jkc2l6ZT1cIicsIFogKiBXLCAnLCcsIFogKiBILCAnXCInLFxuICAgICAgICAgICAgICAgICAgJyBjb29yZG9yaWdpbj1cIjAsMFwiJyAsXG4gICAgICAgICAgICAgICAgICAnIHN0eWxlPVwid2lkdGg6JywgVywgJ3B4O2hlaWdodDonLCBILCAncHg7cG9zaXRpb246YWJzb2x1dGU7Jyk7XG5cbiAgICAgIHZhciBkID0gZ2V0Q29vcmRzKHRoaXMsIGR4LCBkeSk7XG4gICAgICB2YXIgZmlsdGVyID0gW107XG5cbiAgICAgIC8vIE5vdGUgdGhlIDEyLzIxIHJldmVyc2FsXG4gICAgICBmaWx0ZXIucHVzaCgnTTExPScsIHRoaXMubV9bMF1bMF0gLyBzY2FsZVgsICcsJyxcbiAgICAgICAgICAgICAgICAgICdNMTI9JywgdGhpcy5tX1sxXVswXSAvIHNjYWxlWSwgJywnLFxuICAgICAgICAgICAgICAgICAgJ00yMT0nLCB0aGlzLm1fWzBdWzFdIC8gc2NhbGVYLCAnLCcsXG4gICAgICAgICAgICAgICAgICAnTTIyPScsIHRoaXMubV9bMV1bMV0gLyBzY2FsZVksICcsJyxcbiAgICAgICAgICAgICAgICAgICdEeD0nLCBtcihkLnggLyBaKSwgJywnLFxuICAgICAgICAgICAgICAgICAgJ0R5PScsIG1yKGQueSAvIFopLCAnJyk7XG5cbiAgICAgIC8vIEJvdW5kaW5nIGJveCBjYWxjdWxhdGlvbiAobmVlZCB0byBtaW5pbWl6ZSBkaXNwbGF5ZWQgYXJlYSBzbyB0aGF0XG4gICAgICAvLyBmaWx0ZXJzIGRvbid0IHdhc3RlIHRpbWUgb24gdW51c2VkIHBpeGVscy5cbiAgICAgIHZhciBtYXggPSBkO1xuICAgICAgdmFyIGMyID0gZ2V0Q29vcmRzKHRoaXMsIGR4ICsgZHcsIGR5KTtcbiAgICAgIHZhciBjMyA9IGdldENvb3Jkcyh0aGlzLCBkeCwgZHkgKyBkaCk7XG4gICAgICB2YXIgYzQgPSBnZXRDb29yZHModGhpcywgZHggKyBkdywgZHkgKyBkaCk7XG5cbiAgICAgIG1heC54ID0gbS5tYXgobWF4LngsIGMyLngsIGMzLngsIGM0LngpO1xuICAgICAgbWF4LnkgPSBtLm1heChtYXgueSwgYzIueSwgYzMueSwgYzQueSk7XG5cbiAgICAgIHZtbFN0ci5wdXNoKCdwYWRkaW5nOjAgJywgbXIobWF4LnggLyBaKSwgJ3B4ICcsIG1yKG1heC55IC8gWiksXG4gICAgICAgICAgICAgICAgICAncHggMDtmaWx0ZXI6cHJvZ2lkOkRYSW1hZ2VUcmFuc2Zvcm0uTWljcm9zb2Z0Lk1hdHJpeCgnLFxuICAgICAgICAgICAgICAgICAgZmlsdGVyLmpvaW4oJycpLCBcIiwgU2l6aW5nTWV0aG9kPSdjbGlwJyk7PlwiKTtcblxuICAgICAgaWYgKGNyb3BwZWQpIHtcbiAgICAgICAgdm1sU3RyLnB1c2goJzxkaXYgc3R5bGU9XCJvdmVyZmxvdzogaGlkZGVuOyB3aWR0aDonLCBNYXRoLmNlaWwoKGR3ICsgc3ggKiBkdyAvIHN3KSAqIHNjYWxlWCksICdweDsnLFxuICAgICAgICAgICAgICAgICAgJyBoZWlnaHQ6JywgTWF0aC5jZWlsKChkaCArIHN5ICogZGggLyBzaCkgKiBzY2FsZVkpLCAncHg7JyxcbiAgICAgICAgICAgICAgICAgICcgZmlsdGVyOnByb2dpZDpEeEltYWdlVHJhbnNmb3JtLk1pY3Jvc29mdC5NYXRyaXgoRHg9JyxcbiAgICAgICAgICAgICAgICAgIC1zeCAqIGR3IC8gc3cgKiBzY2FsZVgsICcsRHk9JywgLXN5ICogZGggLyBzaCAqIHNjYWxlWSwgJyk7XCI+Jyk7XG4gICAgICB9XG5cbiAgICAgIHZtbFN0ci5wdXNoKCc8aW1nIHNyYz1cIicsIGltYWdlLnNyYywgJ1wiJywgJ3N0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7Jyk7XG4gICAgICB2bWxTdHIucHVzaCgnd2lkdGg6Jywgc2NhbGVYICogZHcgLyBzdyAqIHcsICdweDtoZWlnaHQ6Jywgc2NhbGVZICogZGggLyBzaCAqIGgsICdweDsnKTtcbiAgICAgIGlmICh0aGlzLmdsb2JhbEFscGhhIDwgMSkge1xuICAgICAgICB2bWxTdHIucHVzaCgnZmlsdGVyOmFscGhhKG9wYWNpdHk9JywgbXIodGhpcy5nbG9iYWxBbHBoYSAqIDEwMCkgKyAnKScpO1xuICAgICAgfVxuICAgICAgdm1sU3RyLnB1c2goJ1wiIC8+Jyk7XG4gICAgICBpZiAoY3JvcHBlZCkge1xuICAgICAgICB2bWxTdHIucHVzaCgnPC9kaXY+Jyk7XG4gICAgICB9XG4gICAgICB2bWxTdHIucHVzaCgnPC9nX3ZtbF86Z3JvdXA+JylcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQXBwbHkgc2NhbGVzIHRvIHdpZHRoIGFuZCBoZWlnaHRcbiAgICAgIHZtbFN0ci5wdXNoKCc8ZGl2IHN0eWxlPVwib3ZlcmZsb3c6IGhpZGRlbjsgd2lkdGg6JywgTWF0aC5jZWlsKChkdyArIHN4ICogZHcgLyBzdykgKiBzY2FsZVgpLCAncHg7JyxcbiAgICAgICAgICAgICAgICAgICcgaGVpZ2h0OicsIE1hdGguY2VpbCgoZGggKyBzeSAqIGRoIC8gc2gpICogc2NhbGVZKSwgJ3B4OycsXG4gICAgICAgICAgICAgICAgICAncG9zaXRpb246YWJzb2x1dGU7bGVmdDonLCB4LCAncHg7JywgJ3RvcDonLCB5LCAncHg7JyxcbiAgICAgICAgICAgICAgICAgICcgZmlsdGVyOnByb2dpZDpEeEltYWdlVHJhbnNmb3JtLk1pY3Jvc29mdC5NYXRyaXgoRHg9JyxcbiAgICAgICAgICAgICAgICAgIC1zeCAqIGR3IC8gc3cgKiBzY2FsZVgsICcsRHk9JywgLXN5ICogZGggLyBzaCAqIHNjYWxlWSwgJyk7XCI+Jyk7XG5cbiAgICAgIHZtbFN0ci5wdXNoKCc8aW1nIHNyYz1cIicsIGltYWdlLnNyYywgJ1wiJywgJ3N0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7Jyk7XG4gICAgICB2bWxTdHIucHVzaCgnd2lkdGg6Jywgc2NhbGVYICogZHcgLyBzdyAqIHcsICdweDtoZWlnaHQ6Jywgc2NhbGVZICogZGggLyBzaCAqIGgsICdweDsnKTtcbiAgICAgIGlmICh0aGlzLmdsb2JhbEFscGhhIDwgMSkge1xuICAgICAgICB2bWxTdHIucHVzaCgnZmlsdGVyOmFscGhhKG9wYWNpdHk9JywgbXIodGhpcy5nbG9iYWxBbHBoYSAqIDEwMCkgKyAnKScpO1xuICAgICAgfVxuICAgICAgdm1sU3RyLnB1c2goJ1wiIC8+PC9kaXY+Jyk7XG4gICAgfVxuXG4gICAgdGhpcy5odG1sXyArPSB2bWxTdHIuam9pbignJyk7XG4gIH07XG5cbiAgY29udGV4dFByb3RvdHlwZS5zdHJva2UgPSBmdW5jdGlvbihhRmlsbCkge1xuICAgIHZhciBsaW5lU3RyID0gW107XG4gICAgdmFyIGxpbmVPcGVuID0gZmFsc2U7XG5cbiAgICB2YXIgVyA9IDEwO1xuICAgIHZhciBIID0gMTA7XG5cbiAgICB2YXIgeF8gPSB0aGlzLnhfO1xuICAgIHZhciB5XyA9IHRoaXMueV87XG5cbiAgICBsaW5lU3RyLnB1c2goJzxnX3ZtbF86c2hhcGUnLFxuICAgICAgICAgICAgICAgICAnIGZpbGxlZD1cIicsICEhYUZpbGwsICdcIicsXG4gICAgICAgICAgICAgICAgICcgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt3aWR0aDonLCBXLCAncHg7aGVpZ2h0OicsIEgsICdweDsnLCAnbGVmdDonLCB4XywgJ3B4O3RvcDonLCB5XywgJ3B4O1wiJyxcbiAgICAgICAgICAgICAgICAgJyBjb29yZG9yaWdpbj1cIjAsMFwiJyxcbiAgICAgICAgICAgICAgICAgJyBjb29yZHNpemU9XCInLCBaICogVywgJywnLCBaICogSCwgJ1wiJyxcbiAgICAgICAgICAgICAgICAgJyBzdHJva2VkPVwiJywgIWFGaWxsLCAnXCInLFxuICAgICAgICAgICAgICAgICAnIHBhdGg9XCInKTtcblxuICAgIHZhciBuZXdTZXEgPSBmYWxzZTtcbiAgICB2YXIgbWluID0ge3g6IG51bGwsIHk6IG51bGx9O1xuICAgIHZhciBtYXggPSB7eDogbnVsbCwgeTogbnVsbH07XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuY3VycmVudFBhdGhfLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgcCA9IHRoaXMuY3VycmVudFBhdGhfW2ldO1xuICAgICAgdmFyIGM7XG5cbiAgICAgIHN3aXRjaCAocC50eXBlKSB7XG4gICAgICAgIGNhc2UgJ21vdmVUbyc6XG4gICAgICAgICAgYyA9IHA7XG4gICAgICAgICAgbGluZVN0ci5wdXNoKCcgbSAnLCBtcihwLngpLCAnLCcsIG1yKHAueSkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdsaW5lVG8nOlxuICAgICAgICAgIGxpbmVTdHIucHVzaCgnIGwgJywgbXIocC54KSwgJywnLCBtcihwLnkpKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnY2xvc2UnOlxuICAgICAgICAgIGxpbmVTdHIucHVzaCgnIHggJyk7XG4gICAgICAgICAgcCA9IG51bGw7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2JlemllckN1cnZlVG8nOlxuICAgICAgICAgIGxpbmVTdHIucHVzaCgnIGMgJyxcbiAgICAgICAgICAgICAgICAgICAgICAgbXIocC5jcDF4KSwgJywnLCBtcihwLmNwMXkpLCAnLCcsXG4gICAgICAgICAgICAgICAgICAgICAgIG1yKHAuY3AyeCksICcsJywgbXIocC5jcDJ5KSwgJywnLFxuICAgICAgICAgICAgICAgICAgICAgICBtcihwLngpLCAnLCcsIG1yKHAueSkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdhdCc6XG4gICAgICAgIGNhc2UgJ3dhJzpcbiAgICAgICAgICBsaW5lU3RyLnB1c2goJyAnLCBwLnR5cGUsICcgJyxcbiAgICAgICAgICAgICAgICAgICAgICAgbXIocC54IC0gdGhpcy5zY2FsZVhfICogcC5yYWRpdXMpLCAnLCcsXG4gICAgICAgICAgICAgICAgICAgICAgIG1yKHAueSAtIHRoaXMuc2NhbGVZXyAqIHAucmFkaXVzKSwgJyAnLFxuICAgICAgICAgICAgICAgICAgICAgICBtcihwLnggKyB0aGlzLnNjYWxlWF8gKiBwLnJhZGl1cyksICcsJyxcbiAgICAgICAgICAgICAgICAgICAgICAgbXIocC55ICsgdGhpcy5zY2FsZVlfICogcC5yYWRpdXMpLCAnICcsXG4gICAgICAgICAgICAgICAgICAgICAgIG1yKHAueFN0YXJ0KSwgJywnLCBtcihwLnlTdGFydCksICcgJyxcbiAgICAgICAgICAgICAgICAgICAgICAgbXIocC54RW5kKSwgJywnLCBtcihwLnlFbmQpKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cblxuXG4gICAgICAvLyBUT0RPOiBGb2xsb3dpbmcgaXMgYnJva2VuIGZvciBjdXJ2ZXMgZHVlIHRvXG4gICAgICAvLyAgICAgICBtb3ZlIHRvIHByb3BlciBwYXRocy5cblxuICAgICAgLy8gRmlndXJlIG91dCBkaW1lbnNpb25zIHNvIHdlIGNhbiBkbyBncmFkaWVudCBmaWxsc1xuICAgICAgLy8gcHJvcGVybHlcbiAgICAgIGlmIChwKSB7XG4gICAgICAgIGlmIChtaW4ueCA9PSBudWxsIHx8IHAueCA8IG1pbi54KSB7XG4gICAgICAgICAgbWluLnggPSBwLng7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1heC54ID09IG51bGwgfHwgcC54ID4gbWF4LngpIHtcbiAgICAgICAgICBtYXgueCA9IHAueDtcbiAgICAgICAgfVxuICAgICAgICBpZiAobWluLnkgPT0gbnVsbCB8fCBwLnkgPCBtaW4ueSkge1xuICAgICAgICAgIG1pbi55ID0gcC55O1xuICAgICAgICB9XG4gICAgICAgIGlmIChtYXgueSA9PSBudWxsIHx8IHAueSA+IG1heC55KSB7XG4gICAgICAgICAgbWF4LnkgPSBwLnk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgbGluZVN0ci5wdXNoKCcgXCI+Jyk7XG5cbiAgICBpZiAoIWFGaWxsKSB7XG4gICAgICBhcHBlbmRTdHJva2UodGhpcywgbGluZVN0cik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFwcGVuZEZpbGwodGhpcywgbGluZVN0ciwgbWluLCBtYXgpO1xuICAgIH1cblxuICAgIGxpbmVTdHIucHVzaCgnPC9nX3ZtbF86c2hhcGU+Jyk7XG5cbiAgICB0aGlzLmh0bWxfICs9IGxpbmVTdHIuam9pbignJyk7XG4gIH07XG5cbiAgZnVuY3Rpb24gYXBwZW5kU3Ryb2tlKGN0eCwgbGluZVN0cikge1xuICAgIHZhciBhID0gcHJvY2Vzc1N0eWxlKGN0eC5zdHJva2VTdHlsZSk7XG4gICAgdmFyIGNvbG9yID0gYS5jb2xvcjtcbiAgICB2YXIgb3BhY2l0eSA9IGEuYWxwaGEgKiBjdHguZ2xvYmFsQWxwaGE7XG4gICAgdmFyIGxpbmVXaWR0aCA9IGN0eC5saW5lU2NhbGVfICogY3R4LmxpbmVXaWR0aDtcblxuICAgIC8vIFZNTCBjYW5ub3QgY29ycmVjdGx5IHJlbmRlciBhIGxpbmUgaWYgdGhlIHdpZHRoIGlzIGxlc3MgdGhhbiAxcHguXG4gICAgLy8gSW4gdGhhdCBjYXNlLCB3ZSBkaWx1dGUgdGhlIGNvbG9yIHRvIG1ha2UgdGhlIGxpbmUgbG9vayB0aGlubmVyLlxuICAgIGlmIChsaW5lV2lkdGggPCAxKSB7XG4gICAgICBvcGFjaXR5ICo9IGxpbmVXaWR0aDtcbiAgICB9XG5cbiAgICBsaW5lU3RyLnB1c2goXG4gICAgICAnPGdfdm1sXzpzdHJva2UnLFxuICAgICAgJyBvcGFjaXR5PVwiJywgb3BhY2l0eSwgJ1wiJyxcbiAgICAgICcgam9pbnN0eWxlPVwiJywgY3R4LmxpbmVKb2luLCAnXCInLFxuICAgICAgJyBtaXRlcmxpbWl0PVwiJywgY3R4Lm1pdGVyTGltaXQsICdcIicsXG4gICAgICAnIGVuZGNhcD1cIicsIHByb2Nlc3NMaW5lQ2FwKGN0eC5saW5lQ2FwKSwgJ1wiJyxcbiAgICAgICcgd2VpZ2h0PVwiJywgbGluZVdpZHRoLCAncHhcIicsXG4gICAgICAnIGNvbG9yPVwiJywgY29sb3IsICdcIiAvPidcbiAgICApO1xuICB9XG5cbiAgZnVuY3Rpb24gYXBwZW5kRmlsbChjdHgsIGxpbmVTdHIsIG1pbiwgbWF4KSB7XG4gICAgdmFyIGZpbGxTdHlsZSA9IGN0eC5maWxsU3R5bGU7XG4gICAgdmFyIGFyY1NjYWxlWCA9IGN0eC5zY2FsZVhfO1xuICAgIHZhciBhcmNTY2FsZVkgPSBjdHguc2NhbGVZXztcbiAgICB2YXIgd2lkdGggPSBtYXgueCAtIG1pbi54O1xuICAgIHZhciBoZWlnaHQgPSBtYXgueSAtIG1pbi55O1xuICAgIGlmIChmaWxsU3R5bGUgaW5zdGFuY2VvZiBDYW52YXNHcmFkaWVudF8pIHtcbiAgICAgIC8vIFRPRE86IEdyYWRpZW50cyB0cmFuc2Zvcm1lZCB3aXRoIHRoZSB0cmFuc2Zvcm1hdGlvbiBtYXRyaXguXG4gICAgICB2YXIgYW5nbGUgPSAwO1xuICAgICAgdmFyIGZvY3VzID0ge3g6IDAsIHk6IDB9O1xuXG4gICAgICAvLyBhZGRpdGlvbmFsIG9mZnNldFxuICAgICAgdmFyIHNoaWZ0ID0gMDtcbiAgICAgIC8vIHNjYWxlIGZhY3RvciBmb3Igb2Zmc2V0XG4gICAgICB2YXIgZXhwYW5zaW9uID0gMTtcblxuICAgICAgaWYgKGZpbGxTdHlsZS50eXBlXyA9PSAnZ3JhZGllbnQnKSB7XG4gICAgICAgIHZhciB4MCA9IGZpbGxTdHlsZS54MF8gLyBhcmNTY2FsZVg7XG4gICAgICAgIHZhciB5MCA9IGZpbGxTdHlsZS55MF8gLyBhcmNTY2FsZVk7XG4gICAgICAgIHZhciB4MSA9IGZpbGxTdHlsZS54MV8gLyBhcmNTY2FsZVg7XG4gICAgICAgIHZhciB5MSA9IGZpbGxTdHlsZS55MV8gLyBhcmNTY2FsZVk7XG4gICAgICAgIHZhciBwMCA9IGdldENvb3JkcyhjdHgsIHgwLCB5MCk7XG4gICAgICAgIHZhciBwMSA9IGdldENvb3JkcyhjdHgsIHgxLCB5MSk7XG4gICAgICAgIHZhciBkeCA9IHAxLnggLSBwMC54O1xuICAgICAgICB2YXIgZHkgPSBwMS55IC0gcDAueTtcbiAgICAgICAgYW5nbGUgPSBNYXRoLmF0YW4yKGR4LCBkeSkgKiAxODAgLyBNYXRoLlBJO1xuXG4gICAgICAgIC8vIFRoZSBhbmdsZSBzaG91bGQgYmUgYSBub24tbmVnYXRpdmUgbnVtYmVyLlxuICAgICAgICBpZiAoYW5nbGUgPCAwKSB7XG4gICAgICAgICAgYW5nbGUgKz0gMzYwO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVmVyeSBzbWFsbCBhbmdsZXMgcHJvZHVjZSBhbiB1bmV4cGVjdGVkIHJlc3VsdCBiZWNhdXNlIHRoZXkgYXJlXG4gICAgICAgIC8vIGNvbnZlcnRlZCB0byBhIHNjaWVudGlmaWMgbm90YXRpb24gc3RyaW5nLlxuICAgICAgICBpZiAoYW5nbGUgPCAxZS02KSB7XG4gICAgICAgICAgYW5nbGUgPSAwO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgcDAgPSBnZXRDb29yZHMoY3R4LCBmaWxsU3R5bGUueDBfLCBmaWxsU3R5bGUueTBfKTtcbiAgICAgICAgZm9jdXMgPSB7XG4gICAgICAgICAgeDogKHAwLnggLSBtaW4ueCkgLyB3aWR0aCxcbiAgICAgICAgICB5OiAocDAueSAtIG1pbi55KSAvIGhlaWdodFxuICAgICAgICB9O1xuXG4gICAgICAgIHdpZHRoICAvPSBhcmNTY2FsZVggKiBaO1xuICAgICAgICBoZWlnaHQgLz0gYXJjU2NhbGVZICogWjtcbiAgICAgICAgdmFyIGRpbWVuc2lvbiA9IG0ubWF4KHdpZHRoLCBoZWlnaHQpO1xuICAgICAgICBzaGlmdCA9IDIgKiBmaWxsU3R5bGUucjBfIC8gZGltZW5zaW9uO1xuICAgICAgICBleHBhbnNpb24gPSAyICogZmlsbFN0eWxlLnIxXyAvIGRpbWVuc2lvbiAtIHNoaWZ0O1xuICAgICAgfVxuXG4gICAgICAvLyBXZSBuZWVkIHRvIHNvcnQgdGhlIGNvbG9yIHN0b3BzIGluIGFzY2VuZGluZyBvcmRlciBieSBvZmZzZXQsXG4gICAgICAvLyBvdGhlcndpc2UgSUUgd29uJ3QgaW50ZXJwcmV0IGl0IGNvcnJlY3RseS5cbiAgICAgIHZhciBzdG9wcyA9IGZpbGxTdHlsZS5jb2xvcnNfO1xuICAgICAgc3RvcHMuc29ydChmdW5jdGlvbihjczEsIGNzMikge1xuICAgICAgICByZXR1cm4gY3MxLm9mZnNldCAtIGNzMi5vZmZzZXQ7XG4gICAgICB9KTtcblxuICAgICAgdmFyIGxlbmd0aCA9IHN0b3BzLmxlbmd0aDtcbiAgICAgIHZhciBjb2xvcjEgPSBzdG9wc1swXS5jb2xvcjtcbiAgICAgIHZhciBjb2xvcjIgPSBzdG9wc1tsZW5ndGggLSAxXS5jb2xvcjtcbiAgICAgIHZhciBvcGFjaXR5MSA9IHN0b3BzWzBdLmFscGhhICogY3R4Lmdsb2JhbEFscGhhO1xuICAgICAgdmFyIG9wYWNpdHkyID0gc3RvcHNbbGVuZ3RoIC0gMV0uYWxwaGEgKiBjdHguZ2xvYmFsQWxwaGE7XG5cbiAgICAgIHZhciBjb2xvcnMgPSBbXTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHN0b3AgPSBzdG9wc1tpXTtcbiAgICAgICAgY29sb3JzLnB1c2goc3RvcC5vZmZzZXQgKiBleHBhbnNpb24gKyBzaGlmdCArICcgJyArIHN0b3AuY29sb3IpO1xuICAgICAgfVxuXG4gICAgICAvLyBXaGVuIGNvbG9ycyBhdHRyaWJ1dGUgaXMgdXNlZCwgdGhlIG1lYW5pbmdzIG9mIG9wYWNpdHkgYW5kIG86b3BhY2l0eTJcbiAgICAgIC8vIGFyZSByZXZlcnNlZC5cbiAgICAgIGxpbmVTdHIucHVzaCgnPGdfdm1sXzpmaWxsIHR5cGU9XCInLCBmaWxsU3R5bGUudHlwZV8sICdcIicsXG4gICAgICAgICAgICAgICAgICAgJyBtZXRob2Q9XCJub25lXCIgZm9jdXM9XCIxMDAlXCInLFxuICAgICAgICAgICAgICAgICAgICcgY29sb3I9XCInLCBjb2xvcjEsICdcIicsXG4gICAgICAgICAgICAgICAgICAgJyBjb2xvcjI9XCInLCBjb2xvcjIsICdcIicsXG4gICAgICAgICAgICAgICAgICAgJyBjb2xvcnM9XCInLCBjb2xvcnMuam9pbignLCcpLCAnXCInLFxuICAgICAgICAgICAgICAgICAgICcgb3BhY2l0eT1cIicsIG9wYWNpdHkyLCAnXCInLFxuICAgICAgICAgICAgICAgICAgICcgZ19vXzpvcGFjaXR5Mj1cIicsIG9wYWNpdHkxLCAnXCInLFxuICAgICAgICAgICAgICAgICAgICcgYW5nbGU9XCInLCBhbmdsZSwgJ1wiJyxcbiAgICAgICAgICAgICAgICAgICAnIGZvY3VzcG9zaXRpb249XCInLCBmb2N1cy54LCAnLCcsIGZvY3VzLnksICdcIiAvPicpO1xuICAgIH0gZWxzZSBpZiAoZmlsbFN0eWxlIGluc3RhbmNlb2YgQ2FudmFzUGF0dGVybl8pIHtcbiAgICAgIGlmICh3aWR0aCAmJiBoZWlnaHQpIHtcbiAgICAgICAgdmFyIGRlbHRhTGVmdCA9IC1taW4ueDtcbiAgICAgICAgdmFyIGRlbHRhVG9wID0gLW1pbi55O1xuICAgICAgICBsaW5lU3RyLnB1c2goJzxnX3ZtbF86ZmlsbCcsXG4gICAgICAgICAgICAgICAgICAgICAnIHBvc2l0aW9uPVwiJyxcbiAgICAgICAgICAgICAgICAgICAgIGRlbHRhTGVmdCAvIHdpZHRoICogYXJjU2NhbGVYICogYXJjU2NhbGVYLCAnLCcsXG4gICAgICAgICAgICAgICAgICAgICBkZWx0YVRvcCAvIGhlaWdodCAqIGFyY1NjYWxlWSAqIGFyY1NjYWxlWSwgJ1wiJyxcbiAgICAgICAgICAgICAgICAgICAgICcgdHlwZT1cInRpbGVcIicsXG4gICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBGaWd1cmUgb3V0IHRoZSBjb3JyZWN0IHNpemUgdG8gZml0IHRoZSBzY2FsZS5cbiAgICAgICAgICAgICAgICAgICAgIC8vJyBzaXplPVwiJywgdywgJ3B4ICcsIGgsICdweFwiJyxcbiAgICAgICAgICAgICAgICAgICAgICcgc3JjPVwiJywgZmlsbFN0eWxlLnNyY18sICdcIiAvPicpO1xuICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGEgPSBwcm9jZXNzU3R5bGUoY3R4LmZpbGxTdHlsZSk7XG4gICAgICB2YXIgY29sb3IgPSBhLmNvbG9yO1xuICAgICAgdmFyIG9wYWNpdHkgPSBhLmFscGhhICogY3R4Lmdsb2JhbEFscGhhO1xuICAgICAgbGluZVN0ci5wdXNoKCc8Z192bWxfOmZpbGwgY29sb3I9XCInLCBjb2xvciwgJ1wiIG9wYWNpdHk9XCInLCBvcGFjaXR5LFxuICAgICAgICAgICAgICAgICAgICdcIiAvPicpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnRleHRQcm90b3R5cGUuZmlsbCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc3Ryb2tlKHRydWUpO1xuICB9O1xuXG4gIGNvbnRleHRQcm90b3R5cGUuY2xvc2VQYXRoID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5jdXJyZW50UGF0aF8ucHVzaCh7dHlwZTogJ2Nsb3NlJ30pO1xuICB9O1xuXG4gIGNvbnRleHRQcm90b3R5cGUuc2F2ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBvID0ge307XG4gICAgY29weVN0YXRlKHRoaXMsIG8pO1xuICAgIHRoaXMuYVN0YWNrXy5wdXNoKG8pO1xuICAgIHRoaXMubVN0YWNrXy5wdXNoKHRoaXMubV8pO1xuICAgIHRoaXMubV8gPSBtYXRyaXhNdWx0aXBseShjcmVhdGVNYXRyaXhJZGVudGl0eSgpLCB0aGlzLm1fKTtcbiAgfTtcblxuICBjb250ZXh0UHJvdG90eXBlLnJlc3RvcmUgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5hU3RhY2tfLmxlbmd0aCkge1xuICAgICAgY29weVN0YXRlKHRoaXMuYVN0YWNrXy5wb3AoKSwgdGhpcyk7XG4gICAgICB0aGlzLm1fID0gdGhpcy5tU3RhY2tfLnBvcCgpO1xuICAgIH1cbiAgfTtcblxuICBmdW5jdGlvbiBtYXRyaXhJc0Zpbml0ZShtKSB7XG4gICAgcmV0dXJuIGlzRmluaXRlKG1bMF1bMF0pICYmIGlzRmluaXRlKG1bMF1bMV0pICYmXG4gICAgICAgIGlzRmluaXRlKG1bMV1bMF0pICYmIGlzRmluaXRlKG1bMV1bMV0pICYmXG4gICAgICAgIGlzRmluaXRlKG1bMl1bMF0pICYmIGlzRmluaXRlKG1bMl1bMV0pO1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0TShjdHgsIG0sIHVwZGF0ZUxpbmVTY2FsZSkge1xuICAgIGlmICghbWF0cml4SXNGaW5pdGUobSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY3R4Lm1fID0gbTtcblxuICAgIGN0eC5zY2FsZVhfID0gTWF0aC5zcXJ0KG1bMF1bMF0gKiBtWzBdWzBdICsgbVswXVsxXSAqIG1bMF1bMV0pO1xuICAgIGN0eC5zY2FsZVlfID0gTWF0aC5zcXJ0KG1bMV1bMF0gKiBtWzFdWzBdICsgbVsxXVsxXSAqIG1bMV1bMV0pO1xuICAgIGN0eC54XyA9IG1bMl1bMF07XG4gICAgY3R4LnlfID0gbVsyXVsxXTtcblxuICAgIGlmICh1cGRhdGVMaW5lU2NhbGUpIHtcbiAgICAgIC8vIEdldCB0aGUgbGluZSBzY2FsZS5cbiAgICAgIC8vIERldGVybWluYW50IG9mIHRoaXMubV8gbWVhbnMgaG93IG11Y2ggdGhlIGFyZWEgaXMgZW5sYXJnZWQgYnkgdGhlXG4gICAgICAvLyB0cmFuc2Zvcm1hdGlvbi4gU28gaXRzIHNxdWFyZSByb290IGNhbiBiZSB1c2VkIGFzIGEgc2NhbGUgZmFjdG9yXG4gICAgICAvLyBmb3Igd2lkdGguXG4gICAgICB2YXIgZGV0ID0gbVswXVswXSAqIG1bMV1bMV0gLSBtWzBdWzFdICogbVsxXVswXTtcbiAgICAgIGN0eC5saW5lU2NhbGVfID0gc3FydChhYnMoZGV0KSk7XG4gICAgfVxuICB9XG5cblxuICBjb250ZXh0UHJvdG90eXBlLnRyYW5zbGF0ZSA9IGZ1bmN0aW9uKGFYLCBhWSkge1xuICAgIHZhciBtMSA9IFtcbiAgICAgIFsxLCAgMCwgIDBdLFxuICAgICAgWzAsICAxLCAgMF0sXG4gICAgICBbYVgsIGFZLCAxXVxuICAgIF07XG5cbiAgICBzZXRNKHRoaXMsIG1hdHJpeE11bHRpcGx5KG0xLCB0aGlzLm1fKSwgZmFsc2UpO1xuICB9O1xuXG4gIGNvbnRleHRQcm90b3R5cGUucm90YXRlID0gZnVuY3Rpb24oYVJvdCkge1xuICAgIHZhciBjID0gbWMoYVJvdCk7XG4gICAgdmFyIHMgPSBtcyhhUm90KTtcblxuICAgIHZhciBtMSA9IFtcbiAgICAgIFtjLCAgcywgMF0sXG4gICAgICBbLXMsIGMsIDBdLFxuICAgICAgWzAsICAwLCAxXVxuICAgIF07XG5cbiAgICBzZXRNKHRoaXMsIG1hdHJpeE11bHRpcGx5KG0xLCB0aGlzLm1fKSwgZmFsc2UpO1xuICB9O1xuXG5cbiAgY29udGV4dFByb3RvdHlwZS5zY2FsZSA9IGZ1bmN0aW9uKGFYLCBhWSkge1xuICAgIHZhciBtMSA9IFtcbiAgICAgIFthWCwgMCwgIDBdLFxuICAgICAgWzAsICBhWSwgMF0sXG4gICAgICBbMCwgIDAsICAxXVxuICAgIF07XG5cbiAgICBzZXRNKHRoaXMsIG1hdHJpeE11bHRpcGx5KG0xLCB0aGlzLm1fKSwgdHJ1ZSk7XG4gIH07XG5cbiAgY29udGV4dFByb3RvdHlwZS50cmFuc2Zvcm0gPSBmdW5jdGlvbihtMTEsIG0xMiwgbTIxLCBtMjIsIGR4LCBkeSkge1xuICAgIHZhciBtMSA9IFtcbiAgICAgIFttMTEsIG0xMiwgMF0sXG4gICAgICBbbTIxLCBtMjIsIDBdLFxuICAgICAgW2R4LCAgZHksICAxXVxuICAgIF07XG5cbiAgICBzZXRNKHRoaXMsIG1hdHJpeE11bHRpcGx5KG0xLCB0aGlzLm1fKSwgdHJ1ZSk7XG5cbiAgfTtcblxuICBjb250ZXh0UHJvdG90eXBlLnNldFRyYW5zZm9ybSA9IGZ1bmN0aW9uKG0xMSwgbTEyLCBtMjEsIG0yMiwgZHgsIGR5KSB7XG4gICAgXG4gICAgdmFyIG0gPSBbXG4gICAgICBbbTExLCBtMTIsIDBdLFxuICAgICAgW20yMSwgbTIyLCAwXSxcbiAgICAgIFtkeCwgIGR5LCAgMV1cbiAgICBdO1xuXG4gICAgc2V0TSh0aGlzLCBtLCB0cnVlKTtcbiAgfTtcbiAgLyoqXG4gICAqIFRoZSB0ZXh0IGRyYXdpbmcgZnVuY3Rpb24uXG4gICAqIFRoZSBtYXhXaWR0aCBhcmd1bWVudCBpc24ndCB0YWtlbiBpbiBhY2NvdW50LCBzaW5jZSBubyBicm93c2VyIHN1cHBvcnRzXG4gICAqIGl0IHlldC5cbiAgICovXG4gIGNvbnRleHRQcm90b3R5cGUuZHJhd1RleHRfID0gZnVuY3Rpb24odGV4dCwgeCwgeSwgbWF4V2lkdGgsIHN0cm9rZSkge1xuICAgIHZhciBtID0gdGhpcy5tXyxcbiAgICAgICAgZGVsdGEgPSAxMDAwLFxuICAgICAgICBsZWZ0ID0gMCxcbiAgICAgICAgcmlnaHQgPSBkZWx0YSxcbiAgICAgICAgb2Zmc2V0ID0ge3g6IDAsIHk6IDB9LFxuICAgICAgICBsaW5lU3RyID0gW107XG5cbiAgICB2YXIgZm9udFN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShwcm9jZXNzRm9udFN0eWxlKHRoaXMuZm9udCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50Xyk7XG5cbiAgICB2YXIgZm9udFN0eWxlU3RyaW5nID0gYnVpbGRTdHlsZShmb250U3R5bGUpO1xuXG4gICAgdmFyIGVsZW1lbnRTdHlsZSA9IHRoaXMuZWxlbWVudF8uY3VycmVudFN0eWxlO1xuICAgIHZhciB0ZXh0QWxpZ24gPSB0aGlzLnRleHRBbGlnbi50b0xvd2VyQ2FzZSgpO1xuICAgIHN3aXRjaCAodGV4dEFsaWduKSB7XG4gICAgICBjYXNlICdsZWZ0JzpcbiAgICAgIGNhc2UgJ2NlbnRlcic6XG4gICAgICBjYXNlICdyaWdodCc6XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnZW5kJzpcbiAgICAgICAgdGV4dEFsaWduID0gZWxlbWVudFN0eWxlLmRpcmVjdGlvbiA9PSAnbHRyJyA/ICdyaWdodCcgOiAnbGVmdCc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnc3RhcnQnOlxuICAgICAgICB0ZXh0QWxpZ24gPSBlbGVtZW50U3R5bGUuZGlyZWN0aW9uID09ICdydGwnID8gJ3JpZ2h0JyA6ICdsZWZ0JztcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0ZXh0QWxpZ24gPSAnbGVmdCc7XG4gICAgfVxuXG4gICAgLy8gMS43NSBpcyBhbiBhcmJpdHJhcnkgbnVtYmVyLCBhcyB0aGVyZSBpcyBubyBpbmZvIGFib3V0IHRoZSB0ZXh0IGJhc2VsaW5lXG4gICAgc3dpdGNoICh0aGlzLnRleHRCYXNlbGluZSkge1xuICAgICAgY2FzZSAnaGFuZ2luZyc6XG4gICAgICBjYXNlICd0b3AnOlxuICAgICAgICBvZmZzZXQueSA9IGZvbnRTdHlsZS5zaXplIC8gMS43NTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdtaWRkbGUnOlxuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICBjYXNlIG51bGw6XG4gICAgICBjYXNlICdhbHBoYWJldGljJzpcbiAgICAgIGNhc2UgJ2lkZW9ncmFwaGljJzpcbiAgICAgIGNhc2UgJ2JvdHRvbSc6XG4gICAgICAgIG9mZnNldC55ID0gLWZvbnRTdHlsZS5zaXplIC8gMi4yNTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgc3dpdGNoKHRleHRBbGlnbikge1xuICAgICAgY2FzZSAncmlnaHQnOlxuICAgICAgICBsZWZ0ID0gZGVsdGE7XG4gICAgICAgIHJpZ2h0ID0gMC4wNTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdjZW50ZXInOlxuICAgICAgICBsZWZ0ID0gcmlnaHQgPSBkZWx0YSAvIDI7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIHZhciBkID0gZ2V0Q29vcmRzKHRoaXMsIHggKyBvZmZzZXQueCwgeSArIG9mZnNldC55KTtcblxuICAgIGxpbmVTdHIucHVzaCgnPGdfdm1sXzpsaW5lIGZyb209XCInLCAtbGVmdCAsJyAwXCIgdG89XCInLCByaWdodCAsJyAwLjA1XCIgJyxcbiAgICAgICAgICAgICAgICAgJyBjb29yZHNpemU9XCIxMDAgMTAwXCIgY29vcmRvcmlnaW49XCIwIDBcIicsXG4gICAgICAgICAgICAgICAgICcgZmlsbGVkPVwiJywgIXN0cm9rZSwgJ1wiIHN0cm9rZWQ9XCInLCAhIXN0cm9rZSxcbiAgICAgICAgICAgICAgICAgJ1wiIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7d2lkdGg6MXB4O2hlaWdodDoxcHg7XCI+Jyk7XG5cbiAgICBpZiAoc3Ryb2tlKSB7XG4gICAgICBhcHBlbmRTdHJva2UodGhpcywgbGluZVN0cik7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFRPRE86IEZpeCB0aGUgbWluIGFuZCBtYXggcGFyYW1zLlxuICAgICAgYXBwZW5kRmlsbCh0aGlzLCBsaW5lU3RyLCB7eDogLWxlZnQsIHk6IDB9LFxuICAgICAgICAgICAgICAgICB7eDogcmlnaHQsIHk6IGZvbnRTdHlsZS5zaXplfSk7XG4gICAgfVxuXG4gICAgdmFyIHNrZXdNID0gbVswXVswXS50b0ZpeGVkKDMpICsgJywnICsgbVsxXVswXS50b0ZpeGVkKDMpICsgJywnICtcbiAgICAgICAgICAgICAgICBtWzBdWzFdLnRvRml4ZWQoMykgKyAnLCcgKyBtWzFdWzFdLnRvRml4ZWQoMykgKyAnLDAsMCc7XG5cbiAgICB2YXIgc2tld09mZnNldCA9IG1yKGQueCAvIFopICsgJywnICsgbXIoZC55IC8gWik7XG5cbiAgICBsaW5lU3RyLnB1c2goJzxnX3ZtbF86c2tldyBvbj1cInRcIiBtYXRyaXg9XCInLCBza2V3TSAsJ1wiICcsXG4gICAgICAgICAgICAgICAgICcgb2Zmc2V0PVwiJywgc2tld09mZnNldCwgJ1wiIG9yaWdpbj1cIicsIGxlZnQgLCcgMFwiIC8+JyxcbiAgICAgICAgICAgICAgICAgJzxnX3ZtbF86cGF0aCB0ZXh0cGF0aG9rPVwidHJ1ZVwiIC8+JyxcbiAgICAgICAgICAgICAgICAgJzxnX3ZtbF86dGV4dHBhdGggb249XCJ0cnVlXCIgc3RyaW5nPVwiJyxcbiAgICAgICAgICAgICAgICAgZW5jb2RlSHRtbEF0dHJpYnV0ZSh0ZXh0KSxcbiAgICAgICAgICAgICAgICAgJ1wiIHN0eWxlPVwidi10ZXh0LWFsaWduOicsIHRleHRBbGlnbixcbiAgICAgICAgICAgICAgICAgJztmb250OicsIGVuY29kZUh0bWxBdHRyaWJ1dGUoZm9udFN0eWxlU3RyaW5nKSxcbiAgICAgICAgICAgICAgICAgJ1wiIC8+PC9nX3ZtbF86bGluZT4nKTtcblxuICAgIHRoaXMuaHRtbF8gKz0gbGluZVN0ci5qb2luKCcnKTtcbiAgfTtcblxuICBjb250ZXh0UHJvdG90eXBlLmZpbGxUZXh0ID0gZnVuY3Rpb24odGV4dCwgeCwgeSwgbWF4V2lkdGgpIHtcbiAgICB0aGlzLmRyYXdUZXh0Xyh0ZXh0LCB4LCB5LCBtYXhXaWR0aCwgZmFsc2UpO1xuICB9O1xuXG4gIGNvbnRleHRQcm90b3R5cGUuc3Ryb2tlVGV4dCA9IGZ1bmN0aW9uKHRleHQsIHgsIHksIG1heFdpZHRoKSB7XG4gICAgdGhpcy5kcmF3VGV4dF8odGV4dCwgeCwgeSwgbWF4V2lkdGgsIHRydWUpO1xuICB9O1xuXG4gIGNvbnRleHRQcm90b3R5cGUubWVhc3VyZVRleHQgPSBmdW5jdGlvbih0ZXh0KSB7XG4gICAgaWYgKCF0aGlzLnRleHRNZWFzdXJlRWxfKSB7XG4gICAgICB2YXIgcyA9ICc8c3BhbiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlOycgK1xuICAgICAgICAgICd0b3A6LTIwMDAwcHg7bGVmdDowO3BhZGRpbmc6MDttYXJnaW46MDtib3JkZXI6bm9uZTsnICtcbiAgICAgICAgICAnd2hpdGUtc3BhY2U6cHJlO1wiPjwvc3Bhbj4nO1xuICAgICAgdGhpcy5lbGVtZW50Xy5pbnNlcnRBZGphY2VudEhUTUwoJ2JlZm9yZUVuZCcsIHMpO1xuICAgICAgdGhpcy50ZXh0TWVhc3VyZUVsXyA9IHRoaXMuZWxlbWVudF8ubGFzdENoaWxkO1xuICAgIH1cbiAgICB2YXIgZG9jID0gdGhpcy5lbGVtZW50Xy5vd25lckRvY3VtZW50O1xuICAgIHRoaXMudGV4dE1lYXN1cmVFbF8uaW5uZXJIVE1MID0gJyc7XG4gICAgdGhpcy50ZXh0TWVhc3VyZUVsXy5zdHlsZS5mb250ID0gdGhpcy5mb250O1xuICAgIC8vIERvbid0IHVzZSBpbm5lckhUTUwgb3IgaW5uZXJUZXh0IGJlY2F1c2UgdGhleSBhbGxvdyBtYXJrdXAvd2hpdGVzcGFjZS5cbiAgICB0aGlzLnRleHRNZWFzdXJlRWxfLmFwcGVuZENoaWxkKGRvYy5jcmVhdGVUZXh0Tm9kZSh0ZXh0KSk7XG4gICAgcmV0dXJuIHt3aWR0aDogdGhpcy50ZXh0TWVhc3VyZUVsXy5vZmZzZXRXaWR0aH07XG4gIH07XG5cbiAgLyoqKioqKioqIFNUVUJTICoqKioqKioqL1xuICBjb250ZXh0UHJvdG90eXBlLmNsaXAgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBUT0RPOiBJbXBsZW1lbnRcbiAgfTtcblxuICBjb250ZXh0UHJvdG90eXBlLmFyY1RvID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gVE9ETzogSW1wbGVtZW50XG4gIH07XG5cbiAgY29udGV4dFByb3RvdHlwZS5jcmVhdGVQYXR0ZXJuID0gZnVuY3Rpb24oaW1hZ2UsIHJlcGV0aXRpb24pIHtcbiAgICByZXR1cm4gbmV3IENhbnZhc1BhdHRlcm5fKGltYWdlLCByZXBldGl0aW9uKTtcbiAgfTtcblxuICAvLyBHcmFkaWVudCAvIFBhdHRlcm4gU3R1YnNcbiAgZnVuY3Rpb24gQ2FudmFzR3JhZGllbnRfKGFUeXBlKSB7XG4gICAgdGhpcy50eXBlXyA9IGFUeXBlO1xuICAgIHRoaXMueDBfID0gMDtcbiAgICB0aGlzLnkwXyA9IDA7XG4gICAgdGhpcy5yMF8gPSAwO1xuICAgIHRoaXMueDFfID0gMDtcbiAgICB0aGlzLnkxXyA9IDA7XG4gICAgdGhpcy5yMV8gPSAwO1xuICAgIHRoaXMuY29sb3JzXyA9IFtdO1xuICB9XG5cbiAgQ2FudmFzR3JhZGllbnRfLnByb3RvdHlwZS5hZGRDb2xvclN0b3AgPSBmdW5jdGlvbihhT2Zmc2V0LCBhQ29sb3IpIHtcbiAgICBhQ29sb3IgPSBwcm9jZXNzU3R5bGUoYUNvbG9yKTtcbiAgICB0aGlzLmNvbG9yc18ucHVzaCh7b2Zmc2V0OiBhT2Zmc2V0LFxuICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogYUNvbG9yLmNvbG9yLFxuICAgICAgICAgICAgICAgICAgICAgICBhbHBoYTogYUNvbG9yLmFscGhhfSk7XG4gIH07XG5cbiAgZnVuY3Rpb24gQ2FudmFzUGF0dGVybl8oaW1hZ2UsIHJlcGV0aXRpb24pIHtcbiAgICBhc3NlcnRJbWFnZUlzVmFsaWQoaW1hZ2UpO1xuICAgIHN3aXRjaCAocmVwZXRpdGlvbikge1xuICAgICAgY2FzZSAncmVwZWF0JzpcbiAgICAgIGNhc2UgbnVsbDpcbiAgICAgIGNhc2UgJyc6XG4gICAgICAgIHRoaXMucmVwZXRpdGlvbl8gPSAncmVwZWF0JztcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ3JlcGVhdC14JzpcbiAgICAgIGNhc2UgJ3JlcGVhdC15JzpcbiAgICAgIGNhc2UgJ25vLXJlcGVhdCc6XG4gICAgICAgIHRoaXMucmVwZXRpdGlvbl8gPSByZXBldGl0aW9uO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93RXhjZXB0aW9uKCdTWU5UQVhfRVJSJyk7XG4gICAgfVxuXG4gICAgdGhpcy5zcmNfID0gaW1hZ2Uuc3JjO1xuICAgIHRoaXMud2lkdGhfID0gaW1hZ2Uud2lkdGg7XG4gICAgdGhpcy5oZWlnaHRfID0gaW1hZ2UuaGVpZ2h0O1xuICB9XG5cbiAgZnVuY3Rpb24gdGhyb3dFeGNlcHRpb24ocykge1xuICAgIHRocm93IG5ldyBET01FeGNlcHRpb25fKHMpO1xuICB9XG5cbiAgZnVuY3Rpb24gYXNzZXJ0SW1hZ2VJc1ZhbGlkKGltZykge1xuICAgIGlmICghaW1nIHx8IGltZy5ub2RlVHlwZSAhPSAxIHx8IGltZy50YWdOYW1lICE9ICdJTUcnKSB7XG4gICAgICB0aHJvd0V4Y2VwdGlvbignVFlQRV9NSVNNQVRDSF9FUlInKTtcbiAgICB9XG4gICAgaWYgKGltZy5yZWFkeVN0YXRlICE9ICdjb21wbGV0ZScpIHtcbiAgICAgIHRocm93RXhjZXB0aW9uKCdJTlZBTElEX1NUQVRFX0VSUicpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIERPTUV4Y2VwdGlvbl8ocykge1xuICAgIHRoaXMuY29kZSA9IHRoaXNbc107XG4gICAgdGhpcy5tZXNzYWdlID0gcyArJzogRE9NIEV4Y2VwdGlvbiAnICsgdGhpcy5jb2RlO1xuICB9XG4gIHZhciBwID0gRE9NRXhjZXB0aW9uXy5wcm90b3R5cGUgPSBuZXcgRXJyb3I7XG4gIHAuSU5ERVhfU0laRV9FUlIgPSAxO1xuICBwLkRPTVNUUklOR19TSVpFX0VSUiA9IDI7XG4gIHAuSElFUkFSQ0hZX1JFUVVFU1RfRVJSID0gMztcbiAgcC5XUk9OR19ET0NVTUVOVF9FUlIgPSA0O1xuICBwLklOVkFMSURfQ0hBUkFDVEVSX0VSUiA9IDU7XG4gIHAuTk9fREFUQV9BTExPV0VEX0VSUiA9IDY7XG4gIHAuTk9fTU9ESUZJQ0FUSU9OX0FMTE9XRURfRVJSID0gNztcbiAgcC5OT1RfRk9VTkRfRVJSID0gODtcbiAgcC5OT1RfU1VQUE9SVEVEX0VSUiA9IDk7XG4gIHAuSU5VU0VfQVRUUklCVVRFX0VSUiA9IDEwO1xuICBwLklOVkFMSURfU1RBVEVfRVJSID0gMTE7XG4gIHAuU1lOVEFYX0VSUiA9IDEyO1xuICBwLklOVkFMSURfTU9ESUZJQ0FUSU9OX0VSUiA9IDEzO1xuICBwLk5BTUVTUEFDRV9FUlIgPSAxNDtcbiAgcC5JTlZBTElEX0FDQ0VTU19FUlIgPSAxNTtcbiAgcC5WQUxJREFUSU9OX0VSUiA9IDE2O1xuICBwLlRZUEVfTUlTTUFUQ0hfRVJSID0gMTc7XG5cbiAgLy8gc2V0IHVwIGV4dGVybnNcbiAgR192bWxDYW52YXNNYW5hZ2VyID0gR192bWxDYW52YXNNYW5hZ2VyXztcbiAgQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEID0gQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEXztcbiAgQ2FudmFzR3JhZGllbnQgPSBDYW52YXNHcmFkaWVudF87XG4gIENhbnZhc1BhdHRlcm4gPSBDYW52YXNQYXR0ZXJuXztcbiAgRE9NRXhjZXB0aW9uID0gRE9NRXhjZXB0aW9uXztcbn0pKCk7XG5cbn0gLy8gaWZcbmVsc2UgeyAvLyBtYWtlIHRoZSBjYW52YXMgdGVzdCBzaW1wbGUgYnkga2VuZXIubGluZmVuZ0BnbWFpbC5jb21cbiAgICBHX3ZtbENhbnZhc01hbmFnZXIgPSBmYWxzZTtcbn1cbnJldHVybiBHX3ZtbENhbnZhc01hbmFnZXI7XG59KTsgLy8gZGVmaW5lIl0sImZpbGUiOiJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL2RlcC9leGNhbnZhczMuanMifQ==
