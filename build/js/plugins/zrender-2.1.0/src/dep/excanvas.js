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
    o2.scaleX_    = o1.scaleX_;
    o2.scaleY_    = o1.scaleY_;
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
    this.lineScale_ = 1;
  }

  var contextPrototype = CanvasRenderingContext2D_.prototype;
  contextPrototype.clearRect = function() {
    if (this.textMeasureEl_) {
      this.textMeasureEl_.removeNode(true);
      this.textMeasureEl_ = null;
    }
    this.element_.innerHTML = '';
  };

  contextPrototype.beginPath = function() {
    // TODO: Branch current matrix so that save/restore has no effect
    //       as per safari docs.
    this.currentPath_ = [];
  };

  contextPrototype.moveTo = function(aX, aY) {
    var p = getCoords(this, aX, aY);
    this.currentPath_.push({type: 'moveTo', x: p.x, y: p.y});
    this.currentX_ = p.x;
    this.currentY_ = p.y;
  };

  contextPrototype.lineTo = function(aX, aY) {
    var p = getCoords(this, aX, aY);
    this.currentPath_.push({type: 'lineTo', x: p.x, y: p.y});

    this.currentX_ = p.x;
    this.currentY_ = p.y;
  };

  contextPrototype.bezierCurveTo = function(aCP1x, aCP1y,
                                            aCP2x, aCP2y,
                                            aX, aY) {
    var p = getCoords(this, aX, aY);
    var cp1 = getCoords(this, aCP1x, aCP1y);
    var cp2 = getCoords(this, aCP2x, aCP2y);
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

    var cp = getCoords(this, aCPx, aCPy);
    var p = getCoords(this, aX, aY);

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

    var p = getCoords(this, aX, aY);
    var pStart = getCoords(this, xStart, yStart);
    var pEnd = getCoords(this, xEnd, yEnd);

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

    var d = getCoords(this, dx, dy);

    var w2 = sw / 2;
    var h2 = sh / 2;

    var vmlStr = [];

    var W = 10;
    var H = 10;

    var scaleX = scaleY = 1;
    
    // For some reason that I've now forgotten, using divs didn't work
    vmlStr.push(' <g_vml_:group',
                ' coordsize="', Z * W, ',', Z * H, '"',
                ' coordorigin="0,0"' ,
                ' style="width:', W, 'px;height:', H, 'px;position:absolute;');

    // If filters are necessary (rotation exists), create them
    // filters are bog-slow, so only create them if abbsolutely necessary
    // The following check doesn't account for skews (which don't exist
    // in the canvas spec (yet) anyway.

    if (this.m_[0][0] != 1 || this.m_[0][1] ||
        this.m_[1][1] != 1 || this.m_[1][0]) {
      var filter = [];

     var scaleX = this.scaleX_;
     var scaleY = this.scaleY_;
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
                  filter.join(''), ", SizingMethod='clip');");

    } else {
      vmlStr.push('top:', mr(d.y / Z), 'px;left:', mr(d.x / Z), 'px;');
    }

    vmlStr.push(' ">');

    // Draw a special cropping div if needed
    if (sx || sy) {
      // Apply scales to width and height
      vmlStr.push('<div style="overflow: hidden; width:', Math.ceil((dw + sx * dw / sw) * scaleX), 'px;',
                  ' height:', Math.ceil((dh + sy * dh / sh) * scaleY), 'px;',
                  ' filter:progid:DxImageTransform.Microsoft.Matrix(Dx=',
                  -sx * dw / sw * scaleX, ',Dy=', -sy * dh / sh * scaleY, ');">');
    }
    
      
    // Apply scales to width and height
    vmlStr.push('<div style="width:', Math.round(scaleX * w * dw / sw), 'px;',
                ' height:', Math.round(scaleY * h * dh / sh), 'px;',
                ' filter:');
   
    // If there is a globalAlpha, apply it to image
    if(this.globalAlpha < 1) {
      vmlStr.push(' progid:DXImageTransform.Microsoft.Alpha(opacity=' + (this.globalAlpha * 100) + ')');
    }
    
    vmlStr.push(' progid:DXImageTransform.Microsoft.AlphaImageLoader(src=', image.src, ',sizingMethod=scale)">');
    
    // Close the crop div if necessary            
    if (sx || sy) vmlStr.push('</div>');
    
    vmlStr.push('</div></div>');
    
    this.element_.insertAdjacentHTML('BeforeEnd', vmlStr.join(''));
  };

  contextPrototype.stroke = function(aFill) {
    var lineStr = [];
    var lineOpen = false;

    var W = 10;
    var H = 10;

    lineStr.push('<g_vml_:shape',
                 ' filled="', !!aFill, '"',
                 ' style="position:absolute;width:', W, 'px;height:', H, 'px;"',
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

    this.element_.insertAdjacentHTML('beforeEnd', lineStr.join(''));
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

  function getCoords(ctx, aX, aY) {
    var m = ctx.m_;
    return {
      x: Z * (aX * m[0][0] + aY * m[1][0] + m[2][0]) - Z2,
      y: Z * (aX * m[0][1] + aY * m[1][1] + m[2][1]) - Z2
    };
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

    this.element_.insertAdjacentHTML('beforeEnd', lineStr.join(''));
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
    try {
        this.textMeasureEl_.style.font = this.font;
    } catch (ex) {
        // Ignore failures to set to invalid font.
    }
    
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL2RlcC9leGNhbnZhcy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAwNiBHb29nbGUgSW5jLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5cblxuLy8gS25vd24gSXNzdWVzOlxuLy9cbi8vICogUGF0dGVybnMgb25seSBzdXBwb3J0IHJlcGVhdC5cbi8vICogUmFkaWFsIGdyYWRpZW50IGFyZSBub3QgaW1wbGVtZW50ZWQuIFRoZSBWTUwgdmVyc2lvbiBvZiB0aGVzZSBsb29rIHZlcnlcbi8vICAgZGlmZmVyZW50IGZyb20gdGhlIGNhbnZhcyBvbmUuXG4vLyAqIENsaXBwaW5nIHBhdGhzIGFyZSBub3QgaW1wbGVtZW50ZWQuXG4vLyAqIENvb3Jkc2l6ZS4gVGhlIHdpZHRoIGFuZCBoZWlnaHQgYXR0cmlidXRlIGhhdmUgaGlnaGVyIHByaW9yaXR5IHRoYW4gdGhlXG4vLyAgIHdpZHRoIGFuZCBoZWlnaHQgc3R5bGUgdmFsdWVzIHdoaWNoIGlzbid0IGNvcnJlY3QuXG4vLyAqIFBhaW50aW5nIG1vZGUgaXNuJ3QgaW1wbGVtZW50ZWQuXG4vLyAqIENhbnZhcyB3aWR0aC9oZWlnaHQgc2hvdWxkIGlzIHVzaW5nIGNvbnRlbnQtYm94IGJ5IGRlZmF1bHQuIElFIGluXG4vLyAgIFF1aXJrcyBtb2RlIHdpbGwgZHJhdyB0aGUgY2FudmFzIHVzaW5nIGJvcmRlci1ib3guIEVpdGhlciBjaGFuZ2UgeW91clxuLy8gICBkb2N0eXBlIHRvIEhUTUw1XG4vLyAgIChodHRwOi8vd3d3LndoYXR3Zy5vcmcvc3BlY3Mvd2ViLWFwcHMvY3VycmVudC13b3JrLyN0aGUtZG9jdHlwZSlcbi8vICAgb3IgdXNlIEJveCBTaXppbmcgQmVoYXZpb3IgZnJvbSBXZWJGWFxuLy8gICAoaHR0cDovL3dlYmZ4LmVhZS5uZXQvZGh0bWwvYm94c2l6aW5nL2JveHNpemluZy5odG1sKVxuLy8gKiBOb24gdW5pZm9ybSBzY2FsaW5nIGRvZXMgbm90IGNvcnJlY3RseSBzY2FsZSBzdHJva2VzLlxuLy8gKiBPcHRpbWl6ZS4gVGhlcmUgaXMgYWx3YXlzIHJvb20gZm9yIHNwZWVkIGltcHJvdmVtZW50cy5cblxuLy8gQU1EIGJ5IGtlbmVyLmxpbmZlbmdAZ21haWwuY29tXG5kZWZpbmUoZnVuY3Rpb24ocmVxdWlyZSkge1xuICAgIFxuLy8gT25seSBhZGQgdGhpcyBjb2RlIGlmIHdlIGRvIG5vdCBhbHJlYWR5IGhhdmUgYSBjYW52YXMgaW1wbGVtZW50YXRpb25cbmlmICghZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJykuZ2V0Q29udGV4dCkge1xuXG4oZnVuY3Rpb24oKSB7XG5cbiAgLy8gYWxpYXMgc29tZSBmdW5jdGlvbnMgdG8gbWFrZSAoY29tcGlsZWQpIGNvZGUgc2hvcnRlclxuICB2YXIgbSA9IE1hdGg7XG4gIHZhciBtciA9IG0ucm91bmQ7XG4gIHZhciBtcyA9IG0uc2luO1xuICB2YXIgbWMgPSBtLmNvcztcbiAgdmFyIGFicyA9IG0uYWJzO1xuICB2YXIgc3FydCA9IG0uc3FydDtcblxuICAvLyB0aGlzIGlzIHVzZWQgZm9yIHN1YiBwaXhlbCBwcmVjaXNpb25cbiAgdmFyIFogPSAxMDtcbiAgdmFyIFoyID0gWiAvIDI7XG5cbiAgdmFyIElFX1ZFUlNJT04gPSArbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvTVNJRSAoW1xcZC5dKyk/LylbMV07XG5cbiAgLyoqXG4gICAqIFRoaXMgZnVudGlvbiBpcyBhc3NpZ25lZCB0byB0aGUgPGNhbnZhcz4gZWxlbWVudHMgYXMgZWxlbWVudC5nZXRDb250ZXh0KCkuXG4gICAqIEB0aGlzIHtIVE1MRWxlbWVudH1cbiAgICogQHJldHVybiB7Q2FudmFzUmVuZGVyaW5nQ29udGV4dDJEX31cbiAgICovXG4gIGZ1bmN0aW9uIGdldENvbnRleHQoKSB7XG4gICAgcmV0dXJuIHRoaXMuY29udGV4dF8gfHxcbiAgICAgICAgKHRoaXMuY29udGV4dF8gPSBuZXcgQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEXyh0aGlzKSk7XG4gIH1cblxuICB2YXIgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG5cbiAgLyoqXG4gICAqIEJpbmRzIGEgZnVuY3Rpb24gdG8gYW4gb2JqZWN0LiBUaGUgcmV0dXJuZWQgZnVuY3Rpb24gd2lsbCBhbHdheXMgdXNlIHRoZVxuICAgKiBwYXNzZWQgaW4ge0Bjb2RlIG9ian0gYXMge0Bjb2RlIHRoaXN9LlxuICAgKlxuICAgKiBFeGFtcGxlOlxuICAgKlxuICAgKiAgIGcgPSBiaW5kKGYsIG9iaiwgYSwgYilcbiAgICogICBnKGMsIGQpIC8vIHdpbGwgZG8gZi5jYWxsKG9iaiwgYSwgYiwgYywgZClcbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZiBUaGUgZnVuY3Rpb24gdG8gYmluZCB0aGUgb2JqZWN0IHRvXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0aGF0IHNob3VsZCBhY3QgYXMgdGhpcyB3aGVuIHRoZSBmdW5jdGlvblxuICAgKiAgICAgaXMgY2FsbGVkXG4gICAqIEBwYXJhbSB7Kn0gdmFyX2FyZ3MgUmVzdCBhcmd1bWVudHMgdGhhdCB3aWxsIGJlIHVzZWQgYXMgdGhlIGluaXRpYWxcbiAgICogICAgIGFyZ3VtZW50cyB3aGVuIHRoZSBmdW5jdGlvbiBpcyBjYWxsZWRcbiAgICogQHJldHVybiB7RnVuY3Rpb259IEEgbmV3IGZ1bmN0aW9uIHRoYXQgaGFzIGJvdW5kIHRoaXNcbiAgICovXG4gIGZ1bmN0aW9uIGJpbmQoZiwgb2JqLCB2YXJfYXJncykge1xuICAgIHZhciBhID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBmLmFwcGx5KG9iaiwgYS5jb25jYXQoc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGVuY29kZUh0bWxBdHRyaWJ1dGUocykge1xuICAgIHJldHVybiBTdHJpbmcocykucmVwbGFjZSgvJi9nLCAnJmFtcDsnKS5yZXBsYWNlKC9cIi9nLCAnJnF1b3Q7Jyk7XG4gIH1cblxuICBmdW5jdGlvbiBhZGROYW1lc3BhY2UoZG9jLCBwcmVmaXgsIHVybikge1xuICAgIGlmICghZG9jLm5hbWVzcGFjZXNbcHJlZml4XSkge1xuICAgICAgZG9jLm5hbWVzcGFjZXMuYWRkKHByZWZpeCwgdXJuLCAnI2RlZmF1bHQjVk1MJyk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gYWRkTmFtZXNwYWNlc0FuZFN0eWxlc2hlZXQoZG9jKSB7XG4gICAgYWRkTmFtZXNwYWNlKGRvYywgJ2dfdm1sXycsICd1cm46c2NoZW1hcy1taWNyb3NvZnQtY29tOnZtbCcpO1xuICAgIGFkZE5hbWVzcGFjZShkb2MsICdnX29fJywgJ3VybjpzY2hlbWFzLW1pY3Jvc29mdC1jb206b2ZmaWNlOm9mZmljZScpO1xuXG4gICAgLy8gU2V0dXAgZGVmYXVsdCBDU1MuICBPbmx5IGFkZCBvbmUgc3R5bGUgc2hlZXQgcGVyIGRvY3VtZW50XG4gICAgaWYgKCFkb2Muc3R5bGVTaGVldHNbJ2V4X2NhbnZhc18nXSkge1xuICAgICAgdmFyIHNzID0gZG9jLmNyZWF0ZVN0eWxlU2hlZXQoKTtcbiAgICAgIHNzLm93bmluZ0VsZW1lbnQuaWQgPSAnZXhfY2FudmFzXyc7XG4gICAgICBzcy5jc3NUZXh0ID0gJ2NhbnZhc3tkaXNwbGF5OmlubGluZS1ibG9jaztvdmVyZmxvdzpoaWRkZW47JyArXG4gICAgICAgICAgLy8gZGVmYXVsdCBzaXplIGlzIDMwMHgxNTAgaW4gR2Vja28gYW5kIE9wZXJhXG4gICAgICAgICAgJ3RleHQtYWxpZ246bGVmdDt3aWR0aDozMDBweDtoZWlnaHQ6MTUwcHh9JztcbiAgICB9XG4gIH1cblxuICAvLyBBZGQgbmFtZXNwYWNlcyBhbmQgc3R5bGVzaGVldCBhdCBzdGFydHVwLlxuICBhZGROYW1lc3BhY2VzQW5kU3R5bGVzaGVldChkb2N1bWVudCk7XG5cbiAgdmFyIEdfdm1sQ2FudmFzTWFuYWdlcl8gPSB7XG4gICAgaW5pdDogZnVuY3Rpb24ob3B0X2RvYykge1xuICAgICAgdmFyIGRvYyA9IG9wdF9kb2MgfHwgZG9jdW1lbnQ7XG4gICAgICAvLyBDcmVhdGUgYSBkdW1teSBlbGVtZW50IHNvIHRoYXQgSUUgd2lsbCBhbGxvdyBjYW52YXMgZWxlbWVudHMgdG8gYmVcbiAgICAgIC8vIHJlY29nbml6ZWQuXG4gICAgICBkb2MuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICBkb2MuYXR0YWNoRXZlbnQoJ29ucmVhZHlzdGF0ZWNoYW5nZScsIGJpbmQodGhpcy5pbml0XywgdGhpcywgZG9jKSk7XG4gICAgfSxcblxuICAgIGluaXRfOiBmdW5jdGlvbihkb2MpIHtcbiAgICAgIC8vIGZpbmQgYWxsIGNhbnZhcyBlbGVtZW50c1xuICAgICAgdmFyIGVscyA9IGRvYy5nZXRFbGVtZW50c0J5VGFnTmFtZSgnY2FudmFzJyk7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVscy5sZW5ndGg7IGkrKykge1xuICAgICAgICB0aGlzLmluaXRFbGVtZW50KGVsc1tpXSk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFB1YmxpYyBpbml0aWFsaXplcyBhIGNhbnZhcyBlbGVtZW50IHNvIHRoYXQgaXQgY2FuIGJlIHVzZWQgYXMgY2FudmFzXG4gICAgICogZWxlbWVudCBmcm9tIG5vdyBvbi4gVGhpcyBpcyBjYWxsZWQgYXV0b21hdGljYWxseSBiZWZvcmUgdGhlIHBhZ2UgaXNcbiAgICAgKiBsb2FkZWQgYnV0IGlmIHlvdSBhcmUgY3JlYXRpbmcgZWxlbWVudHMgdXNpbmcgY3JlYXRlRWxlbWVudCB5b3UgbmVlZCB0b1xuICAgICAqIG1ha2Ugc3VyZSB0aGlzIGlzIGNhbGxlZCBvbiB0aGUgZWxlbWVudC5cbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCBUaGUgY2FudmFzIGVsZW1lbnQgdG8gaW5pdGlhbGl6ZS5cbiAgICAgKiBAcmV0dXJuIHtIVE1MRWxlbWVudH0gdGhlIGVsZW1lbnQgdGhhdCB3YXMgY3JlYXRlZC5cbiAgICAgKi9cbiAgICBpbml0RWxlbWVudDogZnVuY3Rpb24oZWwpIHtcbiAgICAgIGlmICghZWwuZ2V0Q29udGV4dCkge1xuICAgICAgICBlbC5nZXRDb250ZXh0ID0gZ2V0Q29udGV4dDtcblxuICAgICAgICAvLyBBZGQgbmFtZXNwYWNlcyBhbmQgc3R5bGVzaGVldCB0byBkb2N1bWVudCBvZiB0aGUgZWxlbWVudC5cbiAgICAgICAgYWRkTmFtZXNwYWNlc0FuZFN0eWxlc2hlZXQoZWwub3duZXJEb2N1bWVudCk7XG5cbiAgICAgICAgLy8gUmVtb3ZlIGZhbGxiYWNrIGNvbnRlbnQuIFRoZXJlIGlzIG5vIHdheSB0byBoaWRlIHRleHQgbm9kZXMgc28gd2VcbiAgICAgICAgLy8ganVzdCByZW1vdmUgYWxsIGNoaWxkTm9kZXMuIFdlIGNvdWxkIGhpZGUgYWxsIGVsZW1lbnRzIGFuZCByZW1vdmVcbiAgICAgICAgLy8gdGV4dCBub2RlcyBidXQgd2hvIHJlYWxseSBjYXJlcyBhYm91dCB0aGUgZmFsbGJhY2sgY29udGVudC5cbiAgICAgICAgZWwuaW5uZXJIVE1MID0gJyc7XG5cbiAgICAgICAgLy8gZG8gbm90IHVzZSBpbmxpbmUgZnVuY3Rpb24gYmVjYXVzZSB0aGF0IHdpbGwgbGVhayBtZW1vcnlcbiAgICAgICAgZWwuYXR0YWNoRXZlbnQoJ29ucHJvcGVydHljaGFuZ2UnLCBvblByb3BlcnR5Q2hhbmdlKTtcbiAgICAgICAgZWwuYXR0YWNoRXZlbnQoJ29ucmVzaXplJywgb25SZXNpemUpO1xuXG4gICAgICAgIHZhciBhdHRycyA9IGVsLmF0dHJpYnV0ZXM7XG4gICAgICAgIGlmIChhdHRycy53aWR0aCAmJiBhdHRycy53aWR0aC5zcGVjaWZpZWQpIHtcbiAgICAgICAgICAvLyBUT0RPOiB1c2UgcnVudGltZVN0eWxlIGFuZCBjb29yZHNpemVcbiAgICAgICAgICAvLyBlbC5nZXRDb250ZXh0KCkuc2V0V2lkdGhfKGF0dHJzLndpZHRoLm5vZGVWYWx1ZSk7XG4gICAgICAgICAgZWwuc3R5bGUud2lkdGggPSBhdHRycy53aWR0aC5ub2RlVmFsdWUgKyAncHgnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVsLndpZHRoID0gZWwuY2xpZW50V2lkdGg7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGF0dHJzLmhlaWdodCAmJiBhdHRycy5oZWlnaHQuc3BlY2lmaWVkKSB7XG4gICAgICAgICAgLy8gVE9ETzogdXNlIHJ1bnRpbWVTdHlsZSBhbmQgY29vcmRzaXplXG4gICAgICAgICAgLy8gZWwuZ2V0Q29udGV4dCgpLnNldEhlaWdodF8oYXR0cnMuaGVpZ2h0Lm5vZGVWYWx1ZSk7XG4gICAgICAgICAgZWwuc3R5bGUuaGVpZ2h0ID0gYXR0cnMuaGVpZ2h0Lm5vZGVWYWx1ZSArICdweCc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZWwuaGVpZ2h0ID0gZWwuY2xpZW50SGVpZ2h0O1xuICAgICAgICB9XG4gICAgICAgIC8vZWwuZ2V0Q29udGV4dCgpLnNldENvb3Jkc2l6ZV8oKVxuICAgICAgfVxuICAgICAgcmV0dXJuIGVsO1xuICAgIH1cbiAgfTtcblxuICBmdW5jdGlvbiBvblByb3BlcnR5Q2hhbmdlKGUpIHtcbiAgICB2YXIgZWwgPSBlLnNyY0VsZW1lbnQ7XG5cbiAgICBzd2l0Y2ggKGUucHJvcGVydHlOYW1lKSB7XG4gICAgICBjYXNlICd3aWR0aCc6XG4gICAgICAgIGVsLmdldENvbnRleHQoKS5jbGVhclJlY3QoKTtcbiAgICAgICAgZWwuc3R5bGUud2lkdGggPSBlbC5hdHRyaWJ1dGVzLndpZHRoLm5vZGVWYWx1ZSArICdweCc7XG4gICAgICAgIC8vIEluIElFOCB0aGlzIGRvZXMgbm90IHRyaWdnZXIgb25yZXNpemUuXG4gICAgICAgIGVsLmZpcnN0Q2hpbGQuc3R5bGUud2lkdGggPSAgZWwuY2xpZW50V2lkdGggKyAncHgnO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2hlaWdodCc6XG4gICAgICAgIGVsLmdldENvbnRleHQoKS5jbGVhclJlY3QoKTtcbiAgICAgICAgZWwuc3R5bGUuaGVpZ2h0ID0gZWwuYXR0cmlidXRlcy5oZWlnaHQubm9kZVZhbHVlICsgJ3B4JztcbiAgICAgICAgZWwuZmlyc3RDaGlsZC5zdHlsZS5oZWlnaHQgPSBlbC5jbGllbnRIZWlnaHQgKyAncHgnO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBvblJlc2l6ZShlKSB7XG4gICAgdmFyIGVsID0gZS5zcmNFbGVtZW50O1xuICAgIGlmIChlbC5maXJzdENoaWxkKSB7XG4gICAgICBlbC5maXJzdENoaWxkLnN0eWxlLndpZHRoID0gIGVsLmNsaWVudFdpZHRoICsgJ3B4JztcbiAgICAgIGVsLmZpcnN0Q2hpbGQuc3R5bGUuaGVpZ2h0ID0gZWwuY2xpZW50SGVpZ2h0ICsgJ3B4JztcbiAgICB9XG4gIH1cblxuICBHX3ZtbENhbnZhc01hbmFnZXJfLmluaXQoKTtcblxuICAvLyBwcmVjb21wdXRlIFwiMDBcIiB0byBcIkZGXCJcbiAgdmFyIGRlY1RvSGV4ID0gW107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgMTY7IGkrKykge1xuICAgIGZvciAodmFyIGogPSAwOyBqIDwgMTY7IGorKykge1xuICAgICAgZGVjVG9IZXhbaSAqIDE2ICsgal0gPSBpLnRvU3RyaW5nKDE2KSArIGoudG9TdHJpbmcoMTYpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZU1hdHJpeElkZW50aXR5KCkge1xuICAgIHJldHVybiBbXG4gICAgICBbMSwgMCwgMF0sXG4gICAgICBbMCwgMSwgMF0sXG4gICAgICBbMCwgMCwgMV1cbiAgICBdO1xuICB9XG5cbiAgZnVuY3Rpb24gbWF0cml4TXVsdGlwbHkobTEsIG0yKSB7XG4gICAgdmFyIHJlc3VsdCA9IGNyZWF0ZU1hdHJpeElkZW50aXR5KCk7XG5cbiAgICBmb3IgKHZhciB4ID0gMDsgeCA8IDM7IHgrKykge1xuICAgICAgZm9yICh2YXIgeSA9IDA7IHkgPCAzOyB5KyspIHtcbiAgICAgICAgdmFyIHN1bSA9IDA7XG5cbiAgICAgICAgZm9yICh2YXIgeiA9IDA7IHogPCAzOyB6KyspIHtcbiAgICAgICAgICBzdW0gKz0gbTFbeF1bel0gKiBtMlt6XVt5XTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlc3VsdFt4XVt5XSA9IHN1bTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvcHlTdGF0ZShvMSwgbzIpIHtcbiAgICBvMi5maWxsU3R5bGUgICAgID0gbzEuZmlsbFN0eWxlO1xuICAgIG8yLmxpbmVDYXAgICAgICAgPSBvMS5saW5lQ2FwO1xuICAgIG8yLmxpbmVKb2luICAgICAgPSBvMS5saW5lSm9pbjtcbiAgICBvMi5saW5lV2lkdGggICAgID0gbzEubGluZVdpZHRoO1xuICAgIG8yLm1pdGVyTGltaXQgICAgPSBvMS5taXRlckxpbWl0O1xuICAgIG8yLnNoYWRvd0JsdXIgICAgPSBvMS5zaGFkb3dCbHVyO1xuICAgIG8yLnNoYWRvd0NvbG9yICAgPSBvMS5zaGFkb3dDb2xvcjtcbiAgICBvMi5zaGFkb3dPZmZzZXRYID0gbzEuc2hhZG93T2Zmc2V0WDtcbiAgICBvMi5zaGFkb3dPZmZzZXRZID0gbzEuc2hhZG93T2Zmc2V0WTtcbiAgICBvMi5zdHJva2VTdHlsZSAgID0gbzEuc3Ryb2tlU3R5bGU7XG4gICAgbzIuZ2xvYmFsQWxwaGEgICA9IG8xLmdsb2JhbEFscGhhO1xuICAgIG8yLmZvbnQgICAgICAgICAgPSBvMS5mb250O1xuICAgIG8yLnRleHRBbGlnbiAgICAgPSBvMS50ZXh0QWxpZ247XG4gICAgbzIudGV4dEJhc2VsaW5lICA9IG8xLnRleHRCYXNlbGluZTtcbiAgICBvMi5zY2FsZVhfICAgID0gbzEuc2NhbGVYXztcbiAgICBvMi5zY2FsZVlfICAgID0gbzEuc2NhbGVZXztcbiAgICBvMi5saW5lU2NhbGVfICAgID0gbzEubGluZVNjYWxlXztcbiAgfVxuXG4gIHZhciBjb2xvckRhdGEgPSB7XG4gICAgYWxpY2VibHVlOiAnI0YwRjhGRicsXG4gICAgYW50aXF1ZXdoaXRlOiAnI0ZBRUJENycsXG4gICAgYXF1YW1hcmluZTogJyM3RkZGRDQnLFxuICAgIGF6dXJlOiAnI0YwRkZGRicsXG4gICAgYmVpZ2U6ICcjRjVGNURDJyxcbiAgICBiaXNxdWU6ICcjRkZFNEM0JyxcbiAgICBibGFjazogJyMwMDAwMDAnLFxuICAgIGJsYW5jaGVkYWxtb25kOiAnI0ZGRUJDRCcsXG4gICAgYmx1ZXZpb2xldDogJyM4QTJCRTInLFxuICAgIGJyb3duOiAnI0E1MkEyQScsXG4gICAgYnVybHl3b29kOiAnI0RFQjg4NycsXG4gICAgY2FkZXRibHVlOiAnIzVGOUVBMCcsXG4gICAgY2hhcnRyZXVzZTogJyM3RkZGMDAnLFxuICAgIGNob2NvbGF0ZTogJyNEMjY5MUUnLFxuICAgIGNvcmFsOiAnI0ZGN0Y1MCcsXG4gICAgY29ybmZsb3dlcmJsdWU6ICcjNjQ5NUVEJyxcbiAgICBjb3Juc2lsazogJyNGRkY4REMnLFxuICAgIGNyaW1zb246ICcjREMxNDNDJyxcbiAgICBjeWFuOiAnIzAwRkZGRicsXG4gICAgZGFya2JsdWU6ICcjMDAwMDhCJyxcbiAgICBkYXJrY3lhbjogJyMwMDhCOEInLFxuICAgIGRhcmtnb2xkZW5yb2Q6ICcjQjg4NjBCJyxcbiAgICBkYXJrZ3JheTogJyNBOUE5QTknLFxuICAgIGRhcmtncmVlbjogJyMwMDY0MDAnLFxuICAgIGRhcmtncmV5OiAnI0E5QTlBOScsXG4gICAgZGFya2toYWtpOiAnI0JEQjc2QicsXG4gICAgZGFya21hZ2VudGE6ICcjOEIwMDhCJyxcbiAgICBkYXJrb2xpdmVncmVlbjogJyM1NTZCMkYnLFxuICAgIGRhcmtvcmFuZ2U6ICcjRkY4QzAwJyxcbiAgICBkYXJrb3JjaGlkOiAnIzk5MzJDQycsXG4gICAgZGFya3JlZDogJyM4QjAwMDAnLFxuICAgIGRhcmtzYWxtb246ICcjRTk5NjdBJyxcbiAgICBkYXJrc2VhZ3JlZW46ICcjOEZCQzhGJyxcbiAgICBkYXJrc2xhdGVibHVlOiAnIzQ4M0Q4QicsXG4gICAgZGFya3NsYXRlZ3JheTogJyMyRjRGNEYnLFxuICAgIGRhcmtzbGF0ZWdyZXk6ICcjMkY0RjRGJyxcbiAgICBkYXJrdHVycXVvaXNlOiAnIzAwQ0VEMScsXG4gICAgZGFya3Zpb2xldDogJyM5NDAwRDMnLFxuICAgIGRlZXBwaW5rOiAnI0ZGMTQ5MycsXG4gICAgZGVlcHNreWJsdWU6ICcjMDBCRkZGJyxcbiAgICBkaW1ncmF5OiAnIzY5Njk2OScsXG4gICAgZGltZ3JleTogJyM2OTY5NjknLFxuICAgIGRvZGdlcmJsdWU6ICcjMUU5MEZGJyxcbiAgICBmaXJlYnJpY2s6ICcjQjIyMjIyJyxcbiAgICBmbG9yYWx3aGl0ZTogJyNGRkZBRjAnLFxuICAgIGZvcmVzdGdyZWVuOiAnIzIyOEIyMicsXG4gICAgZ2FpbnNib3JvOiAnI0RDRENEQycsXG4gICAgZ2hvc3R3aGl0ZTogJyNGOEY4RkYnLFxuICAgIGdvbGQ6ICcjRkZENzAwJyxcbiAgICBnb2xkZW5yb2Q6ICcjREFBNTIwJyxcbiAgICBncmV5OiAnIzgwODA4MCcsXG4gICAgZ3JlZW55ZWxsb3c6ICcjQURGRjJGJyxcbiAgICBob25leWRldzogJyNGMEZGRjAnLFxuICAgIGhvdHBpbms6ICcjRkY2OUI0JyxcbiAgICBpbmRpYW5yZWQ6ICcjQ0Q1QzVDJyxcbiAgICBpbmRpZ286ICcjNEIwMDgyJyxcbiAgICBpdm9yeTogJyNGRkZGRjAnLFxuICAgIGtoYWtpOiAnI0YwRTY4QycsXG4gICAgbGF2ZW5kZXI6ICcjRTZFNkZBJyxcbiAgICBsYXZlbmRlcmJsdXNoOiAnI0ZGRjBGNScsXG4gICAgbGF3bmdyZWVuOiAnIzdDRkMwMCcsXG4gICAgbGVtb25jaGlmZm9uOiAnI0ZGRkFDRCcsXG4gICAgbGlnaHRibHVlOiAnI0FERDhFNicsXG4gICAgbGlnaHRjb3JhbDogJyNGMDgwODAnLFxuICAgIGxpZ2h0Y3lhbjogJyNFMEZGRkYnLFxuICAgIGxpZ2h0Z29sZGVucm9keWVsbG93OiAnI0ZBRkFEMicsXG4gICAgbGlnaHRncmVlbjogJyM5MEVFOTAnLFxuICAgIGxpZ2h0Z3JleTogJyNEM0QzRDMnLFxuICAgIGxpZ2h0cGluazogJyNGRkI2QzEnLFxuICAgIGxpZ2h0c2FsbW9uOiAnI0ZGQTA3QScsXG4gICAgbGlnaHRzZWFncmVlbjogJyMyMEIyQUEnLFxuICAgIGxpZ2h0c2t5Ymx1ZTogJyM4N0NFRkEnLFxuICAgIGxpZ2h0c2xhdGVncmF5OiAnIzc3ODg5OScsXG4gICAgbGlnaHRzbGF0ZWdyZXk6ICcjNzc4ODk5JyxcbiAgICBsaWdodHN0ZWVsYmx1ZTogJyNCMEM0REUnLFxuICAgIGxpZ2h0eWVsbG93OiAnI0ZGRkZFMCcsXG4gICAgbGltZWdyZWVuOiAnIzMyQ0QzMicsXG4gICAgbGluZW46ICcjRkFGMEU2JyxcbiAgICBtYWdlbnRhOiAnI0ZGMDBGRicsXG4gICAgbWVkaXVtYXF1YW1hcmluZTogJyM2NkNEQUEnLFxuICAgIG1lZGl1bWJsdWU6ICcjMDAwMENEJyxcbiAgICBtZWRpdW1vcmNoaWQ6ICcjQkE1NUQzJyxcbiAgICBtZWRpdW1wdXJwbGU6ICcjOTM3MERCJyxcbiAgICBtZWRpdW1zZWFncmVlbjogJyMzQ0IzNzEnLFxuICAgIG1lZGl1bXNsYXRlYmx1ZTogJyM3QjY4RUUnLFxuICAgIG1lZGl1bXNwcmluZ2dyZWVuOiAnIzAwRkE5QScsXG4gICAgbWVkaXVtdHVycXVvaXNlOiAnIzQ4RDFDQycsXG4gICAgbWVkaXVtdmlvbGV0cmVkOiAnI0M3MTU4NScsXG4gICAgbWlkbmlnaHRibHVlOiAnIzE5MTk3MCcsXG4gICAgbWludGNyZWFtOiAnI0Y1RkZGQScsXG4gICAgbWlzdHlyb3NlOiAnI0ZGRTRFMScsXG4gICAgbW9jY2FzaW46ICcjRkZFNEI1JyxcbiAgICBuYXZham93aGl0ZTogJyNGRkRFQUQnLFxuICAgIG9sZGxhY2U6ICcjRkRGNUU2JyxcbiAgICBvbGl2ZWRyYWI6ICcjNkI4RTIzJyxcbiAgICBvcmFuZ2U6ICcjRkZBNTAwJyxcbiAgICBvcmFuZ2VyZWQ6ICcjRkY0NTAwJyxcbiAgICBvcmNoaWQ6ICcjREE3MEQ2JyxcbiAgICBwYWxlZ29sZGVucm9kOiAnI0VFRThBQScsXG4gICAgcGFsZWdyZWVuOiAnIzk4RkI5OCcsXG4gICAgcGFsZXR1cnF1b2lzZTogJyNBRkVFRUUnLFxuICAgIHBhbGV2aW9sZXRyZWQ6ICcjREI3MDkzJyxcbiAgICBwYXBheWF3aGlwOiAnI0ZGRUZENScsXG4gICAgcGVhY2hwdWZmOiAnI0ZGREFCOScsXG4gICAgcGVydTogJyNDRDg1M0YnLFxuICAgIHBpbms6ICcjRkZDMENCJyxcbiAgICBwbHVtOiAnI0REQTBERCcsXG4gICAgcG93ZGVyYmx1ZTogJyNCMEUwRTYnLFxuICAgIHJvc3licm93bjogJyNCQzhGOEYnLFxuICAgIHJveWFsYmx1ZTogJyM0MTY5RTEnLFxuICAgIHNhZGRsZWJyb3duOiAnIzhCNDUxMycsXG4gICAgc2FsbW9uOiAnI0ZBODA3MicsXG4gICAgc2FuZHlicm93bjogJyNGNEE0NjAnLFxuICAgIHNlYWdyZWVuOiAnIzJFOEI1NycsXG4gICAgc2Vhc2hlbGw6ICcjRkZGNUVFJyxcbiAgICBzaWVubmE6ICcjQTA1MjJEJyxcbiAgICBza3libHVlOiAnIzg3Q0VFQicsXG4gICAgc2xhdGVibHVlOiAnIzZBNUFDRCcsXG4gICAgc2xhdGVncmF5OiAnIzcwODA5MCcsXG4gICAgc2xhdGVncmV5OiAnIzcwODA5MCcsXG4gICAgc25vdzogJyNGRkZBRkEnLFxuICAgIHNwcmluZ2dyZWVuOiAnIzAwRkY3RicsXG4gICAgc3RlZWxibHVlOiAnIzQ2ODJCNCcsXG4gICAgdGFuOiAnI0QyQjQ4QycsXG4gICAgdGhpc3RsZTogJyNEOEJGRDgnLFxuICAgIHRvbWF0bzogJyNGRjYzNDcnLFxuICAgIHR1cnF1b2lzZTogJyM0MEUwRDAnLFxuICAgIHZpb2xldDogJyNFRTgyRUUnLFxuICAgIHdoZWF0OiAnI0Y1REVCMycsXG4gICAgd2hpdGVzbW9rZTogJyNGNUY1RjUnLFxuICAgIHllbGxvd2dyZWVuOiAnIzlBQ0QzMidcbiAgfTtcblxuXG4gIGZ1bmN0aW9uIGdldFJnYkhzbENvbnRlbnQoc3R5bGVTdHJpbmcpIHtcbiAgICB2YXIgc3RhcnQgPSBzdHlsZVN0cmluZy5pbmRleE9mKCcoJywgMyk7XG4gICAgdmFyIGVuZCA9IHN0eWxlU3RyaW5nLmluZGV4T2YoJyknLCBzdGFydCArIDEpO1xuICAgIHZhciBwYXJ0cyA9IHN0eWxlU3RyaW5nLnN1YnN0cmluZyhzdGFydCArIDEsIGVuZCkuc3BsaXQoJywnKTtcbiAgICAvLyBhZGQgYWxwaGEgaWYgbmVlZGVkXG4gICAgaWYgKHBhcnRzLmxlbmd0aCAhPSA0IHx8IHN0eWxlU3RyaW5nLmNoYXJBdCgzKSAhPSAnYScpIHtcbiAgICAgIHBhcnRzWzNdID0gMTtcbiAgICB9XG4gICAgcmV0dXJuIHBhcnRzO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVyY2VudChzKSB7XG4gICAgcmV0dXJuIHBhcnNlRmxvYXQocykgLyAxMDA7XG4gIH1cblxuICBmdW5jdGlvbiBjbGFtcCh2LCBtaW4sIG1heCkge1xuICAgIHJldHVybiBNYXRoLm1pbihtYXgsIE1hdGgubWF4KG1pbiwgdikpO1xuICB9XG5cbiAgZnVuY3Rpb24gaHNsVG9SZ2IocGFydHMpe1xuICAgIHZhciByLCBnLCBiLCBoLCBzLCBsO1xuICAgIGggPSBwYXJzZUZsb2F0KHBhcnRzWzBdKSAvIDM2MCAlIDM2MDtcbiAgICBpZiAoaCA8IDApXG4gICAgICBoKys7XG4gICAgcyA9IGNsYW1wKHBlcmNlbnQocGFydHNbMV0pLCAwLCAxKTtcbiAgICBsID0gY2xhbXAocGVyY2VudChwYXJ0c1syXSksIDAsIDEpO1xuICAgIGlmIChzID09IDApIHtcbiAgICAgIHIgPSBnID0gYiA9IGw7IC8vIGFjaHJvbWF0aWNcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIHEgPSBsIDwgMC41ID8gbCAqICgxICsgcykgOiBsICsgcyAtIGwgKiBzO1xuICAgICAgdmFyIHAgPSAyICogbCAtIHE7XG4gICAgICByID0gaHVlVG9SZ2IocCwgcSwgaCArIDEgLyAzKTtcbiAgICAgIGcgPSBodWVUb1JnYihwLCBxLCBoKTtcbiAgICAgIGIgPSBodWVUb1JnYihwLCBxLCBoIC0gMSAvIDMpO1xuICAgIH1cblxuICAgIHJldHVybiAnIycgKyBkZWNUb0hleFtNYXRoLmZsb29yKHIgKiAyNTUpXSArXG4gICAgICAgIGRlY1RvSGV4W01hdGguZmxvb3IoZyAqIDI1NSldICtcbiAgICAgICAgZGVjVG9IZXhbTWF0aC5mbG9vcihiICogMjU1KV07XG4gIH1cblxuICBmdW5jdGlvbiBodWVUb1JnYihtMSwgbTIsIGgpIHtcbiAgICBpZiAoaCA8IDApXG4gICAgICBoKys7XG4gICAgaWYgKGggPiAxKVxuICAgICAgaC0tO1xuXG4gICAgaWYgKDYgKiBoIDwgMSlcbiAgICAgIHJldHVybiBtMSArIChtMiAtIG0xKSAqIDYgKiBoO1xuICAgIGVsc2UgaWYgKDIgKiBoIDwgMSlcbiAgICAgIHJldHVybiBtMjtcbiAgICBlbHNlIGlmICgzICogaCA8IDIpXG4gICAgICByZXR1cm4gbTEgKyAobTIgLSBtMSkgKiAoMiAvIDMgLSBoKSAqIDY7XG4gICAgZWxzZVxuICAgICAgcmV0dXJuIG0xO1xuICB9XG5cbiAgdmFyIHByb2Nlc3NTdHlsZUNhY2hlID0ge307XG5cbiAgZnVuY3Rpb24gcHJvY2Vzc1N0eWxlKHN0eWxlU3RyaW5nKSB7XG4gICAgaWYgKHN0eWxlU3RyaW5nIGluIHByb2Nlc3NTdHlsZUNhY2hlKSB7XG4gICAgICByZXR1cm4gcHJvY2Vzc1N0eWxlQ2FjaGVbc3R5bGVTdHJpbmddO1xuICAgIH1cblxuICAgIHZhciBzdHIsIGFscGhhID0gMTtcblxuICAgIHN0eWxlU3RyaW5nID0gU3RyaW5nKHN0eWxlU3RyaW5nKTtcbiAgICBpZiAoc3R5bGVTdHJpbmcuY2hhckF0KDApID09ICcjJykge1xuICAgICAgc3RyID0gc3R5bGVTdHJpbmc7XG4gICAgfSBlbHNlIGlmICgvXnJnYi8udGVzdChzdHlsZVN0cmluZykpIHtcbiAgICAgIHZhciBwYXJ0cyA9IGdldFJnYkhzbENvbnRlbnQoc3R5bGVTdHJpbmcpO1xuICAgICAgdmFyIHN0ciA9ICcjJywgbjtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMzsgaSsrKSB7XG4gICAgICAgIGlmIChwYXJ0c1tpXS5pbmRleE9mKCclJykgIT0gLTEpIHtcbiAgICAgICAgICBuID0gTWF0aC5mbG9vcihwZXJjZW50KHBhcnRzW2ldKSAqIDI1NSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbiA9ICtwYXJ0c1tpXTtcbiAgICAgICAgfVxuICAgICAgICBzdHIgKz0gZGVjVG9IZXhbY2xhbXAobiwgMCwgMjU1KV07XG4gICAgICB9XG4gICAgICBhbHBoYSA9ICtwYXJ0c1szXTtcbiAgICB9IGVsc2UgaWYgKC9eaHNsLy50ZXN0KHN0eWxlU3RyaW5nKSkge1xuICAgICAgdmFyIHBhcnRzID0gZ2V0UmdiSHNsQ29udGVudChzdHlsZVN0cmluZyk7XG4gICAgICBzdHIgPSBoc2xUb1JnYihwYXJ0cyk7XG4gICAgICBhbHBoYSA9IHBhcnRzWzNdO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjb2xvckRhdGFbc3R5bGVTdHJpbmddIHx8IHN0eWxlU3RyaW5nO1xuICAgIH1cbiAgICByZXR1cm4gcHJvY2Vzc1N0eWxlQ2FjaGVbc3R5bGVTdHJpbmddID0ge2NvbG9yOiBzdHIsIGFscGhhOiBhbHBoYX07XG4gIH1cblxuICB2YXIgREVGQVVMVF9TVFlMRSA9IHtcbiAgICBzdHlsZTogJ25vcm1hbCcsXG4gICAgdmFyaWFudDogJ25vcm1hbCcsXG4gICAgd2VpZ2h0OiAnbm9ybWFsJyxcbiAgICBzaXplOiAxMiwgICAgICAgICAgIC8vMTBcbiAgICBmYW1pbHk6ICflvq7ova/pm4Xpu5EnICAgICAvLydzYW5zLXNlcmlmJ1xuICB9O1xuXG4gIC8vIEludGVybmFsIHRleHQgc3R5bGUgY2FjaGVcbiAgdmFyIGZvbnRTdHlsZUNhY2hlID0ge307XG5cbiAgZnVuY3Rpb24gcHJvY2Vzc0ZvbnRTdHlsZShzdHlsZVN0cmluZykge1xuICAgIGlmIChmb250U3R5bGVDYWNoZVtzdHlsZVN0cmluZ10pIHtcbiAgICAgIHJldHVybiBmb250U3R5bGVDYWNoZVtzdHlsZVN0cmluZ107XG4gICAgfVxuXG4gICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdmFyIHN0eWxlID0gZWwuc3R5bGU7XG4gICAgdmFyIGZvbnRGYW1pbHk7XG4gICAgdHJ5IHtcbiAgICAgIHN0eWxlLmZvbnQgPSBzdHlsZVN0cmluZztcbiAgICAgIGZvbnRGYW1pbHkgPSBzdHlsZS5mb250RmFtaWx5LnNwbGl0KCcsJylbMF07XG4gICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgIC8vIElnbm9yZSBmYWlsdXJlcyB0byBzZXQgdG8gaW52YWxpZCBmb250LlxuICAgIH1cblxuICAgIHJldHVybiBmb250U3R5bGVDYWNoZVtzdHlsZVN0cmluZ10gPSB7XG4gICAgICBzdHlsZTogc3R5bGUuZm9udFN0eWxlIHx8IERFRkFVTFRfU1RZTEUuc3R5bGUsXG4gICAgICB2YXJpYW50OiBzdHlsZS5mb250VmFyaWFudCB8fCBERUZBVUxUX1NUWUxFLnZhcmlhbnQsXG4gICAgICB3ZWlnaHQ6IHN0eWxlLmZvbnRXZWlnaHQgfHwgREVGQVVMVF9TVFlMRS53ZWlnaHQsXG4gICAgICBzaXplOiBzdHlsZS5mb250U2l6ZSB8fCBERUZBVUxUX1NUWUxFLnNpemUsXG4gICAgICBmYW1pbHk6IGZvbnRGYW1pbHkgfHwgREVGQVVMVF9TVFlMRS5mYW1pbHlcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0Q29tcHV0ZWRTdHlsZShzdHlsZSwgZWxlbWVudCkge1xuICAgIHZhciBjb21wdXRlZFN0eWxlID0ge307XG5cbiAgICBmb3IgKHZhciBwIGluIHN0eWxlKSB7XG4gICAgICBjb21wdXRlZFN0eWxlW3BdID0gc3R5bGVbcF07XG4gICAgfVxuXG4gICAgLy8gQ29tcHV0ZSB0aGUgc2l6ZVxuICAgIHZhciBjYW52YXNGb250U2l6ZSA9IHBhcnNlRmxvYXQoZWxlbWVudC5jdXJyZW50U3R5bGUuZm9udFNpemUpLFxuICAgICAgICBmb250U2l6ZSA9IHBhcnNlRmxvYXQoc3R5bGUuc2l6ZSk7XG5cbiAgICBpZiAodHlwZW9mIHN0eWxlLnNpemUgPT0gJ251bWJlcicpIHtcbiAgICAgIGNvbXB1dGVkU3R5bGUuc2l6ZSA9IHN0eWxlLnNpemU7XG4gICAgfSBlbHNlIGlmIChzdHlsZS5zaXplLmluZGV4T2YoJ3B4JykgIT0gLTEpIHtcbiAgICAgIGNvbXB1dGVkU3R5bGUuc2l6ZSA9IGZvbnRTaXplO1xuICAgIH0gZWxzZSBpZiAoc3R5bGUuc2l6ZS5pbmRleE9mKCdlbScpICE9IC0xKSB7XG4gICAgICBjb21wdXRlZFN0eWxlLnNpemUgPSBjYW52YXNGb250U2l6ZSAqIGZvbnRTaXplO1xuICAgIH0gZWxzZSBpZihzdHlsZS5zaXplLmluZGV4T2YoJyUnKSAhPSAtMSkge1xuICAgICAgY29tcHV0ZWRTdHlsZS5zaXplID0gKGNhbnZhc0ZvbnRTaXplIC8gMTAwKSAqIGZvbnRTaXplO1xuICAgIH0gZWxzZSBpZiAoc3R5bGUuc2l6ZS5pbmRleE9mKCdwdCcpICE9IC0xKSB7XG4gICAgICBjb21wdXRlZFN0eWxlLnNpemUgPSBmb250U2l6ZSAvIC43NTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29tcHV0ZWRTdHlsZS5zaXplID0gY2FudmFzRm9udFNpemU7XG4gICAgfVxuXG4gICAgLy8gRGlmZmVyZW50IHNjYWxpbmcgYmV0d2VlbiBub3JtYWwgdGV4dCBhbmQgVk1MIHRleHQuIFRoaXMgd2FzIGZvdW5kIHVzaW5nXG4gICAgLy8gdHJpYWwgYW5kIGVycm9yIHRvIGdldCB0aGUgc2FtZSBzaXplIGFzIG5vbiBWTUwgdGV4dC5cbiAgICAvL2NvbXB1dGVkU3R5bGUuc2l6ZSAqPSAwLjk4MTtcblxuICAgIHJldHVybiBjb21wdXRlZFN0eWxlO1xuICB9XG5cbiAgZnVuY3Rpb24gYnVpbGRTdHlsZShzdHlsZSkge1xuICAgIHJldHVybiBzdHlsZS5zdHlsZSArICcgJyArIHN0eWxlLnZhcmlhbnQgKyAnICcgKyBzdHlsZS53ZWlnaHQgKyAnICcgK1xuICAgICAgICBzdHlsZS5zaXplICsgXCJweCAnXCIgKyBzdHlsZS5mYW1pbHkgKyBcIidcIjtcbiAgfVxuXG4gIHZhciBsaW5lQ2FwTWFwID0ge1xuICAgICdidXR0JzogJ2ZsYXQnLFxuICAgICdyb3VuZCc6ICdyb3VuZCdcbiAgfTtcblxuICBmdW5jdGlvbiBwcm9jZXNzTGluZUNhcChsaW5lQ2FwKSB7XG4gICAgcmV0dXJuIGxpbmVDYXBNYXBbbGluZUNhcF0gfHwgJ3NxdWFyZSc7XG4gIH1cblxuICAvKipcbiAgICogVGhpcyBjbGFzcyBpbXBsZW1lbnRzIENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCBpbnRlcmZhY2UgYXMgZGVzY3JpYmVkIGJ5XG4gICAqIHRoZSBXSEFUV0cuXG4gICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGNhbnZhc0VsZW1lbnQgVGhlIGVsZW1lbnQgdGhhdCB0aGUgMkQgY29udGV4dCBzaG91bGRcbiAgICogYmUgYXNzb2NpYXRlZCB3aXRoXG4gICAqL1xuICBmdW5jdGlvbiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkRfKGNhbnZhc0VsZW1lbnQpIHtcbiAgICB0aGlzLm1fID0gY3JlYXRlTWF0cml4SWRlbnRpdHkoKTtcblxuICAgIHRoaXMubVN0YWNrXyA9IFtdO1xuICAgIHRoaXMuYVN0YWNrXyA9IFtdO1xuICAgIHRoaXMuY3VycmVudFBhdGhfID0gW107XG5cbiAgICAvLyBDYW52YXMgY29udGV4dCBwcm9wZXJ0aWVzXG4gICAgdGhpcy5zdHJva2VTdHlsZSA9ICcjMDAwJztcbiAgICB0aGlzLmZpbGxTdHlsZSA9ICcjMDAwJztcblxuICAgIHRoaXMubGluZVdpZHRoID0gMTtcbiAgICB0aGlzLmxpbmVKb2luID0gJ21pdGVyJztcbiAgICB0aGlzLmxpbmVDYXAgPSAnYnV0dCc7XG4gICAgdGhpcy5taXRlckxpbWl0ID0gWiAqIDE7XG4gICAgdGhpcy5nbG9iYWxBbHBoYSA9IDE7XG4gICAgLy8gdGhpcy5mb250ID0gJzEwcHggc2Fucy1zZXJpZic7XG4gICAgdGhpcy5mb250ID0gJzEycHgg5b6u6L2v6ZuF6buRJzsgICAgICAgIC8vIOWGs+Wumui/mOaYr+aUuei/meWQp++8jOW9seWTjeS7o+S7t+acgOWwj1xuICAgIHRoaXMudGV4dEFsaWduID0gJ2xlZnQnO1xuICAgIHRoaXMudGV4dEJhc2VsaW5lID0gJ2FscGhhYmV0aWMnO1xuICAgIHRoaXMuY2FudmFzID0gY2FudmFzRWxlbWVudDtcblxuICAgIHZhciBjc3NUZXh0ID0gJ3dpZHRoOicgKyBjYW52YXNFbGVtZW50LmNsaWVudFdpZHRoICsgJ3B4O2hlaWdodDonICtcbiAgICAgICAgY2FudmFzRWxlbWVudC5jbGllbnRIZWlnaHQgKyAncHg7b3ZlcmZsb3c6aGlkZGVuO3Bvc2l0aW9uOmFic29sdXRlJztcbiAgICB2YXIgZWwgPSBjYW52YXNFbGVtZW50Lm93bmVyRG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgZWwuc3R5bGUuY3NzVGV4dCA9IGNzc1RleHQ7XG4gICAgY2FudmFzRWxlbWVudC5hcHBlbmRDaGlsZChlbCk7XG5cbiAgICB2YXIgb3ZlcmxheUVsID0gZWwuY2xvbmVOb2RlKGZhbHNlKTtcbiAgICAvLyBVc2UgYSBub24gdHJhbnNwYXJlbnQgYmFja2dyb3VuZC5cbiAgICBvdmVybGF5RWwuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJyNmZmYnOyAvL3JlZCwgSSBkb24ndCBrbm93IHdoeSwgaXQgd29yayEgXG4gICAgb3ZlcmxheUVsLnN0eWxlLmZpbHRlciA9ICdhbHBoYShvcGFjaXR5PTApJztcbiAgICBjYW52YXNFbGVtZW50LmFwcGVuZENoaWxkKG92ZXJsYXlFbCk7XG5cbiAgICB0aGlzLmVsZW1lbnRfID0gZWw7XG4gICAgdGhpcy5zY2FsZVhfID0gMTtcbiAgICB0aGlzLnNjYWxlWV8gPSAxO1xuICAgIHRoaXMubGluZVNjYWxlXyA9IDE7XG4gIH1cblxuICB2YXIgY29udGV4dFByb3RvdHlwZSA9IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRF8ucHJvdG90eXBlO1xuICBjb250ZXh0UHJvdG90eXBlLmNsZWFyUmVjdCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLnRleHRNZWFzdXJlRWxfKSB7XG4gICAgICB0aGlzLnRleHRNZWFzdXJlRWxfLnJlbW92ZU5vZGUodHJ1ZSk7XG4gICAgICB0aGlzLnRleHRNZWFzdXJlRWxfID0gbnVsbDtcbiAgICB9XG4gICAgdGhpcy5lbGVtZW50Xy5pbm5lckhUTUwgPSAnJztcbiAgfTtcblxuICBjb250ZXh0UHJvdG90eXBlLmJlZ2luUGF0aCA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIFRPRE86IEJyYW5jaCBjdXJyZW50IG1hdHJpeCBzbyB0aGF0IHNhdmUvcmVzdG9yZSBoYXMgbm8gZWZmZWN0XG4gICAgLy8gICAgICAgYXMgcGVyIHNhZmFyaSBkb2NzLlxuICAgIHRoaXMuY3VycmVudFBhdGhfID0gW107XG4gIH07XG5cbiAgY29udGV4dFByb3RvdHlwZS5tb3ZlVG8gPSBmdW5jdGlvbihhWCwgYVkpIHtcbiAgICB2YXIgcCA9IGdldENvb3Jkcyh0aGlzLCBhWCwgYVkpO1xuICAgIHRoaXMuY3VycmVudFBhdGhfLnB1c2goe3R5cGU6ICdtb3ZlVG8nLCB4OiBwLngsIHk6IHAueX0pO1xuICAgIHRoaXMuY3VycmVudFhfID0gcC54O1xuICAgIHRoaXMuY3VycmVudFlfID0gcC55O1xuICB9O1xuXG4gIGNvbnRleHRQcm90b3R5cGUubGluZVRvID0gZnVuY3Rpb24oYVgsIGFZKSB7XG4gICAgdmFyIHAgPSBnZXRDb29yZHModGhpcywgYVgsIGFZKTtcbiAgICB0aGlzLmN1cnJlbnRQYXRoXy5wdXNoKHt0eXBlOiAnbGluZVRvJywgeDogcC54LCB5OiBwLnl9KTtcblxuICAgIHRoaXMuY3VycmVudFhfID0gcC54O1xuICAgIHRoaXMuY3VycmVudFlfID0gcC55O1xuICB9O1xuXG4gIGNvbnRleHRQcm90b3R5cGUuYmV6aWVyQ3VydmVUbyA9IGZ1bmN0aW9uKGFDUDF4LCBhQ1AxeSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYUNQMngsIGFDUDJ5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhWCwgYVkpIHtcbiAgICB2YXIgcCA9IGdldENvb3Jkcyh0aGlzLCBhWCwgYVkpO1xuICAgIHZhciBjcDEgPSBnZXRDb29yZHModGhpcywgYUNQMXgsIGFDUDF5KTtcbiAgICB2YXIgY3AyID0gZ2V0Q29vcmRzKHRoaXMsIGFDUDJ4LCBhQ1AyeSk7XG4gICAgYmV6aWVyQ3VydmVUbyh0aGlzLCBjcDEsIGNwMiwgcCk7XG4gIH07XG5cbiAgLy8gSGVscGVyIGZ1bmN0aW9uIHRoYXQgdGFrZXMgdGhlIGFscmVhZHkgZml4ZWQgY29yZGluYXRlcy5cbiAgZnVuY3Rpb24gYmV6aWVyQ3VydmVUbyhzZWxmLCBjcDEsIGNwMiwgcCkge1xuICAgIHNlbGYuY3VycmVudFBhdGhfLnB1c2goe1xuICAgICAgdHlwZTogJ2JlemllckN1cnZlVG8nLFxuICAgICAgY3AxeDogY3AxLngsXG4gICAgICBjcDF5OiBjcDEueSxcbiAgICAgIGNwMng6IGNwMi54LFxuICAgICAgY3AyeTogY3AyLnksXG4gICAgICB4OiBwLngsXG4gICAgICB5OiBwLnlcbiAgICB9KTtcbiAgICBzZWxmLmN1cnJlbnRYXyA9IHAueDtcbiAgICBzZWxmLmN1cnJlbnRZXyA9IHAueTtcbiAgfVxuXG4gIGNvbnRleHRQcm90b3R5cGUucXVhZHJhdGljQ3VydmVUbyA9IGZ1bmN0aW9uKGFDUHgsIGFDUHksIGFYLCBhWSkge1xuICAgIC8vIHRoZSBmb2xsb3dpbmcgaXMgbGlmdGVkIGFsbW9zdCBkaXJlY3RseSBmcm9tXG4gICAgLy8gaHR0cDovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi9kb2NzL0NhbnZhc190dXRvcmlhbDpEcmF3aW5nX3NoYXBlc1xuXG4gICAgdmFyIGNwID0gZ2V0Q29vcmRzKHRoaXMsIGFDUHgsIGFDUHkpO1xuICAgIHZhciBwID0gZ2V0Q29vcmRzKHRoaXMsIGFYLCBhWSk7XG5cbiAgICB2YXIgY3AxID0ge1xuICAgICAgeDogdGhpcy5jdXJyZW50WF8gKyAyLjAgLyAzLjAgKiAoY3AueCAtIHRoaXMuY3VycmVudFhfKSxcbiAgICAgIHk6IHRoaXMuY3VycmVudFlfICsgMi4wIC8gMy4wICogKGNwLnkgLSB0aGlzLmN1cnJlbnRZXylcbiAgICB9O1xuICAgIHZhciBjcDIgPSB7XG4gICAgICB4OiBjcDEueCArIChwLnggLSB0aGlzLmN1cnJlbnRYXykgLyAzLjAsXG4gICAgICB5OiBjcDEueSArIChwLnkgLSB0aGlzLmN1cnJlbnRZXykgLyAzLjBcbiAgICB9O1xuXG4gICAgYmV6aWVyQ3VydmVUbyh0aGlzLCBjcDEsIGNwMiwgcCk7XG4gIH07XG5cbiAgY29udGV4dFByb3RvdHlwZS5hcmMgPSBmdW5jdGlvbihhWCwgYVksIGFSYWRpdXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYVN0YXJ0QW5nbGUsIGFFbmRBbmdsZSwgYUNsb2Nrd2lzZSkge1xuICAgIGFSYWRpdXMgKj0gWjtcbiAgICB2YXIgYXJjVHlwZSA9IGFDbG9ja3dpc2UgPyAnYXQnIDogJ3dhJztcblxuICAgIHZhciB4U3RhcnQgPSBhWCArIG1jKGFTdGFydEFuZ2xlKSAqIGFSYWRpdXMgLSBaMjtcbiAgICB2YXIgeVN0YXJ0ID0gYVkgKyBtcyhhU3RhcnRBbmdsZSkgKiBhUmFkaXVzIC0gWjI7XG5cbiAgICB2YXIgeEVuZCA9IGFYICsgbWMoYUVuZEFuZ2xlKSAqIGFSYWRpdXMgLSBaMjtcbiAgICB2YXIgeUVuZCA9IGFZICsgbXMoYUVuZEFuZ2xlKSAqIGFSYWRpdXMgLSBaMjtcblxuICAgIC8vIElFIHdvbid0IHJlbmRlciBhcmNoZXMgZHJhd24gY291bnRlciBjbG9ja3dpc2UgaWYgeFN0YXJ0ID09IHhFbmQuXG4gICAgaWYgKHhTdGFydCA9PSB4RW5kICYmICFhQ2xvY2t3aXNlKSB7XG4gICAgICB4U3RhcnQgKz0gMC4xMjU7IC8vIE9mZnNldCB4U3RhcnQgYnkgMS84MCBvZiBhIHBpeGVsLiBVc2Ugc29tZXRoaW5nXG4gICAgICAgICAgICAgICAgICAgICAgIC8vIHRoYXQgY2FuIGJlIHJlcHJlc2VudGVkIGluIGJpbmFyeVxuICAgIH1cblxuICAgIHZhciBwID0gZ2V0Q29vcmRzKHRoaXMsIGFYLCBhWSk7XG4gICAgdmFyIHBTdGFydCA9IGdldENvb3Jkcyh0aGlzLCB4U3RhcnQsIHlTdGFydCk7XG4gICAgdmFyIHBFbmQgPSBnZXRDb29yZHModGhpcywgeEVuZCwgeUVuZCk7XG5cbiAgICB0aGlzLmN1cnJlbnRQYXRoXy5wdXNoKHt0eXBlOiBhcmNUeXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogcC54LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgeTogcC55LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgcmFkaXVzOiBhUmFkaXVzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgeFN0YXJ0OiBwU3RhcnQueCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHlTdGFydDogcFN0YXJ0LnksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICB4RW5kOiBwRW5kLngsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICB5RW5kOiBwRW5kLnl9KTtcblxuICB9O1xuXG4gIGNvbnRleHRQcm90b3R5cGUucmVjdCA9IGZ1bmN0aW9uKGFYLCBhWSwgYVdpZHRoLCBhSGVpZ2h0KSB7XG4gICAgdGhpcy5tb3ZlVG8oYVgsIGFZKTtcbiAgICB0aGlzLmxpbmVUbyhhWCArIGFXaWR0aCwgYVkpO1xuICAgIHRoaXMubGluZVRvKGFYICsgYVdpZHRoLCBhWSArIGFIZWlnaHQpO1xuICAgIHRoaXMubGluZVRvKGFYLCBhWSArIGFIZWlnaHQpO1xuICAgIHRoaXMuY2xvc2VQYXRoKCk7XG4gIH07XG5cbiAgY29udGV4dFByb3RvdHlwZS5zdHJva2VSZWN0ID0gZnVuY3Rpb24oYVgsIGFZLCBhV2lkdGgsIGFIZWlnaHQpIHtcbiAgICB2YXIgb2xkUGF0aCA9IHRoaXMuY3VycmVudFBhdGhfO1xuICAgIHRoaXMuYmVnaW5QYXRoKCk7XG5cbiAgICB0aGlzLm1vdmVUbyhhWCwgYVkpO1xuICAgIHRoaXMubGluZVRvKGFYICsgYVdpZHRoLCBhWSk7XG4gICAgdGhpcy5saW5lVG8oYVggKyBhV2lkdGgsIGFZICsgYUhlaWdodCk7XG4gICAgdGhpcy5saW5lVG8oYVgsIGFZICsgYUhlaWdodCk7XG4gICAgdGhpcy5jbG9zZVBhdGgoKTtcbiAgICB0aGlzLnN0cm9rZSgpO1xuXG4gICAgdGhpcy5jdXJyZW50UGF0aF8gPSBvbGRQYXRoO1xuICB9O1xuXG4gIGNvbnRleHRQcm90b3R5cGUuZmlsbFJlY3QgPSBmdW5jdGlvbihhWCwgYVksIGFXaWR0aCwgYUhlaWdodCkge1xuICAgIHZhciBvbGRQYXRoID0gdGhpcy5jdXJyZW50UGF0aF87XG4gICAgdGhpcy5iZWdpblBhdGgoKTtcblxuICAgIHRoaXMubW92ZVRvKGFYLCBhWSk7XG4gICAgdGhpcy5saW5lVG8oYVggKyBhV2lkdGgsIGFZKTtcbiAgICB0aGlzLmxpbmVUbyhhWCArIGFXaWR0aCwgYVkgKyBhSGVpZ2h0KTtcbiAgICB0aGlzLmxpbmVUbyhhWCwgYVkgKyBhSGVpZ2h0KTtcbiAgICB0aGlzLmNsb3NlUGF0aCgpO1xuICAgIHRoaXMuZmlsbCgpO1xuXG4gICAgdGhpcy5jdXJyZW50UGF0aF8gPSBvbGRQYXRoO1xuICB9O1xuXG4gIGNvbnRleHRQcm90b3R5cGUuY3JlYXRlTGluZWFyR3JhZGllbnQgPSBmdW5jdGlvbihhWDAsIGFZMCwgYVgxLCBhWTEpIHtcbiAgICB2YXIgZ3JhZGllbnQgPSBuZXcgQ2FudmFzR3JhZGllbnRfKCdncmFkaWVudCcpO1xuICAgIGdyYWRpZW50LngwXyA9IGFYMDtcbiAgICBncmFkaWVudC55MF8gPSBhWTA7XG4gICAgZ3JhZGllbnQueDFfID0gYVgxO1xuICAgIGdyYWRpZW50LnkxXyA9IGFZMTtcbiAgICByZXR1cm4gZ3JhZGllbnQ7XG4gIH07XG5cbiAgY29udGV4dFByb3RvdHlwZS5jcmVhdGVSYWRpYWxHcmFkaWVudCA9IGZ1bmN0aW9uKGFYMCwgYVkwLCBhUjAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhWDEsIGFZMSwgYVIxKSB7XG4gICAgdmFyIGdyYWRpZW50ID0gbmV3IENhbnZhc0dyYWRpZW50XygnZ3JhZGllbnRyYWRpYWwnKTtcbiAgICBncmFkaWVudC54MF8gPSBhWDA7XG4gICAgZ3JhZGllbnQueTBfID0gYVkwO1xuICAgIGdyYWRpZW50LnIwXyA9IGFSMDtcbiAgICBncmFkaWVudC54MV8gPSBhWDE7XG4gICAgZ3JhZGllbnQueTFfID0gYVkxO1xuICAgIGdyYWRpZW50LnIxXyA9IGFSMTtcbiAgICByZXR1cm4gZ3JhZGllbnQ7XG4gIH07XG5cbiAgY29udGV4dFByb3RvdHlwZS5kcmF3SW1hZ2UgPSBmdW5jdGlvbihpbWFnZSwgdmFyX2FyZ3MpIHtcbiAgICB2YXIgZHgsIGR5LCBkdywgZGgsIHN4LCBzeSwgc3csIHNoO1xuXG4gICAgLy8gdG8gZmluZCB0aGUgb3JpZ2luYWwgd2lkdGggd2Ugb3ZlcmlkZSB0aGUgd2lkdGggYW5kIGhlaWdodFxuICAgIHZhciBvbGRSdW50aW1lV2lkdGggPSBpbWFnZS5ydW50aW1lU3R5bGUud2lkdGg7XG4gICAgdmFyIG9sZFJ1bnRpbWVIZWlnaHQgPSBpbWFnZS5ydW50aW1lU3R5bGUuaGVpZ2h0O1xuICAgIGltYWdlLnJ1bnRpbWVTdHlsZS53aWR0aCA9ICdhdXRvJztcbiAgICBpbWFnZS5ydW50aW1lU3R5bGUuaGVpZ2h0ID0gJ2F1dG8nO1xuXG4gICAgLy8gZ2V0IHRoZSBvcmlnaW5hbCBzaXplXG4gICAgdmFyIHcgPSBpbWFnZS53aWR0aDtcbiAgICB2YXIgaCA9IGltYWdlLmhlaWdodDtcblxuICAgIC8vIGFuZCByZW1vdmUgb3ZlcmlkZXNcbiAgICBpbWFnZS5ydW50aW1lU3R5bGUud2lkdGggPSBvbGRSdW50aW1lV2lkdGg7XG4gICAgaW1hZ2UucnVudGltZVN0eWxlLmhlaWdodCA9IG9sZFJ1bnRpbWVIZWlnaHQ7XG5cbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAzKSB7XG4gICAgICBkeCA9IGFyZ3VtZW50c1sxXTtcbiAgICAgIGR5ID0gYXJndW1lbnRzWzJdO1xuICAgICAgc3ggPSBzeSA9IDA7XG4gICAgICBzdyA9IGR3ID0gdztcbiAgICAgIHNoID0gZGggPSBoO1xuICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSA1KSB7XG4gICAgICBkeCA9IGFyZ3VtZW50c1sxXTtcbiAgICAgIGR5ID0gYXJndW1lbnRzWzJdO1xuICAgICAgZHcgPSBhcmd1bWVudHNbM107XG4gICAgICBkaCA9IGFyZ3VtZW50c1s0XTtcbiAgICAgIHN4ID0gc3kgPSAwO1xuICAgICAgc3cgPSB3O1xuICAgICAgc2ggPSBoO1xuICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSA5KSB7XG4gICAgICBzeCA9IGFyZ3VtZW50c1sxXTtcbiAgICAgIHN5ID0gYXJndW1lbnRzWzJdO1xuICAgICAgc3cgPSBhcmd1bWVudHNbM107XG4gICAgICBzaCA9IGFyZ3VtZW50c1s0XTtcbiAgICAgIGR4ID0gYXJndW1lbnRzWzVdO1xuICAgICAgZHkgPSBhcmd1bWVudHNbNl07XG4gICAgICBkdyA9IGFyZ3VtZW50c1s3XTtcbiAgICAgIGRoID0gYXJndW1lbnRzWzhdO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBFcnJvcignSW52YWxpZCBudW1iZXIgb2YgYXJndW1lbnRzJyk7XG4gICAgfVxuXG4gICAgdmFyIGQgPSBnZXRDb29yZHModGhpcywgZHgsIGR5KTtcblxuICAgIHZhciB3MiA9IHN3IC8gMjtcbiAgICB2YXIgaDIgPSBzaCAvIDI7XG5cbiAgICB2YXIgdm1sU3RyID0gW107XG5cbiAgICB2YXIgVyA9IDEwO1xuICAgIHZhciBIID0gMTA7XG5cbiAgICB2YXIgc2NhbGVYID0gc2NhbGVZID0gMTtcbiAgICBcbiAgICAvLyBGb3Igc29tZSByZWFzb24gdGhhdCBJJ3ZlIG5vdyBmb3Jnb3R0ZW4sIHVzaW5nIGRpdnMgZGlkbid0IHdvcmtcbiAgICB2bWxTdHIucHVzaCgnIDxnX3ZtbF86Z3JvdXAnLFxuICAgICAgICAgICAgICAgICcgY29vcmRzaXplPVwiJywgWiAqIFcsICcsJywgWiAqIEgsICdcIicsXG4gICAgICAgICAgICAgICAgJyBjb29yZG9yaWdpbj1cIjAsMFwiJyAsXG4gICAgICAgICAgICAgICAgJyBzdHlsZT1cIndpZHRoOicsIFcsICdweDtoZWlnaHQ6JywgSCwgJ3B4O3Bvc2l0aW9uOmFic29sdXRlOycpO1xuXG4gICAgLy8gSWYgZmlsdGVycyBhcmUgbmVjZXNzYXJ5IChyb3RhdGlvbiBleGlzdHMpLCBjcmVhdGUgdGhlbVxuICAgIC8vIGZpbHRlcnMgYXJlIGJvZy1zbG93LCBzbyBvbmx5IGNyZWF0ZSB0aGVtIGlmIGFiYnNvbHV0ZWx5IG5lY2Vzc2FyeVxuICAgIC8vIFRoZSBmb2xsb3dpbmcgY2hlY2sgZG9lc24ndCBhY2NvdW50IGZvciBza2V3cyAod2hpY2ggZG9uJ3QgZXhpc3RcbiAgICAvLyBpbiB0aGUgY2FudmFzIHNwZWMgKHlldCkgYW55d2F5LlxuXG4gICAgaWYgKHRoaXMubV9bMF1bMF0gIT0gMSB8fCB0aGlzLm1fWzBdWzFdIHx8XG4gICAgICAgIHRoaXMubV9bMV1bMV0gIT0gMSB8fCB0aGlzLm1fWzFdWzBdKSB7XG4gICAgICB2YXIgZmlsdGVyID0gW107XG5cbiAgICAgdmFyIHNjYWxlWCA9IHRoaXMuc2NhbGVYXztcbiAgICAgdmFyIHNjYWxlWSA9IHRoaXMuc2NhbGVZXztcbiAgICAgIC8vIE5vdGUgdGhlIDEyLzIxIHJldmVyc2FsXG4gICAgICBmaWx0ZXIucHVzaCgnTTExPScsIHRoaXMubV9bMF1bMF0gLyBzY2FsZVgsICcsJyxcbiAgICAgICAgICAgICAgICAgICdNMTI9JywgdGhpcy5tX1sxXVswXSAvIHNjYWxlWSwgJywnLFxuICAgICAgICAgICAgICAgICAgJ00yMT0nLCB0aGlzLm1fWzBdWzFdIC8gc2NhbGVYLCAnLCcsXG4gICAgICAgICAgICAgICAgICAnTTIyPScsIHRoaXMubV9bMV1bMV0gLyBzY2FsZVksICcsJyxcbiAgICAgICAgICAgICAgICAgICdEeD0nLCBtcihkLnggLyBaKSwgJywnLFxuICAgICAgICAgICAgICAgICAgJ0R5PScsIG1yKGQueSAvIFopLCAnJyk7XG5cbiAgICAgIC8vIEJvdW5kaW5nIGJveCBjYWxjdWxhdGlvbiAobmVlZCB0byBtaW5pbWl6ZSBkaXNwbGF5ZWQgYXJlYSBzbyB0aGF0XG4gICAgICAvLyBmaWx0ZXJzIGRvbid0IHdhc3RlIHRpbWUgb24gdW51c2VkIHBpeGVscy5cbiAgICAgIHZhciBtYXggPSBkO1xuICAgICAgdmFyIGMyID0gZ2V0Q29vcmRzKHRoaXMsIGR4ICsgZHcsIGR5KTtcbiAgICAgIHZhciBjMyA9IGdldENvb3Jkcyh0aGlzLCBkeCwgZHkgKyBkaCk7XG4gICAgICB2YXIgYzQgPSBnZXRDb29yZHModGhpcywgZHggKyBkdywgZHkgKyBkaCk7XG5cbiAgICAgIG1heC54ID0gbS5tYXgobWF4LngsIGMyLngsIGMzLngsIGM0LngpO1xuICAgICAgbWF4LnkgPSBtLm1heChtYXgueSwgYzIueSwgYzMueSwgYzQueSk7XG5cbiAgICAgIHZtbFN0ci5wdXNoKCdwYWRkaW5nOjAgJywgbXIobWF4LnggLyBaKSwgJ3B4ICcsIG1yKG1heC55IC8gWiksXG4gICAgICAgICAgICAgICAgICAncHggMDtmaWx0ZXI6cHJvZ2lkOkRYSW1hZ2VUcmFuc2Zvcm0uTWljcm9zb2Z0Lk1hdHJpeCgnLFxuICAgICAgICAgICAgICAgICAgZmlsdGVyLmpvaW4oJycpLCBcIiwgU2l6aW5nTWV0aG9kPSdjbGlwJyk7XCIpO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgIHZtbFN0ci5wdXNoKCd0b3A6JywgbXIoZC55IC8gWiksICdweDtsZWZ0OicsIG1yKGQueCAvIFopLCAncHg7Jyk7XG4gICAgfVxuXG4gICAgdm1sU3RyLnB1c2goJyBcIj4nKTtcblxuICAgIC8vIERyYXcgYSBzcGVjaWFsIGNyb3BwaW5nIGRpdiBpZiBuZWVkZWRcbiAgICBpZiAoc3ggfHwgc3kpIHtcbiAgICAgIC8vIEFwcGx5IHNjYWxlcyB0byB3aWR0aCBhbmQgaGVpZ2h0XG4gICAgICB2bWxTdHIucHVzaCgnPGRpdiBzdHlsZT1cIm92ZXJmbG93OiBoaWRkZW47IHdpZHRoOicsIE1hdGguY2VpbCgoZHcgKyBzeCAqIGR3IC8gc3cpICogc2NhbGVYKSwgJ3B4OycsXG4gICAgICAgICAgICAgICAgICAnIGhlaWdodDonLCBNYXRoLmNlaWwoKGRoICsgc3kgKiBkaCAvIHNoKSAqIHNjYWxlWSksICdweDsnLFxuICAgICAgICAgICAgICAgICAgJyBmaWx0ZXI6cHJvZ2lkOkR4SW1hZ2VUcmFuc2Zvcm0uTWljcm9zb2Z0Lk1hdHJpeChEeD0nLFxuICAgICAgICAgICAgICAgICAgLXN4ICogZHcgLyBzdyAqIHNjYWxlWCwgJyxEeT0nLCAtc3kgKiBkaCAvIHNoICogc2NhbGVZLCAnKTtcIj4nKTtcbiAgICB9XG4gICAgXG4gICAgICBcbiAgICAvLyBBcHBseSBzY2FsZXMgdG8gd2lkdGggYW5kIGhlaWdodFxuICAgIHZtbFN0ci5wdXNoKCc8ZGl2IHN0eWxlPVwid2lkdGg6JywgTWF0aC5yb3VuZChzY2FsZVggKiB3ICogZHcgLyBzdyksICdweDsnLFxuICAgICAgICAgICAgICAgICcgaGVpZ2h0OicsIE1hdGgucm91bmQoc2NhbGVZICogaCAqIGRoIC8gc2gpLCAncHg7JyxcbiAgICAgICAgICAgICAgICAnIGZpbHRlcjonKTtcbiAgIFxuICAgIC8vIElmIHRoZXJlIGlzIGEgZ2xvYmFsQWxwaGEsIGFwcGx5IGl0IHRvIGltYWdlXG4gICAgaWYodGhpcy5nbG9iYWxBbHBoYSA8IDEpIHtcbiAgICAgIHZtbFN0ci5wdXNoKCcgcHJvZ2lkOkRYSW1hZ2VUcmFuc2Zvcm0uTWljcm9zb2Z0LkFscGhhKG9wYWNpdHk9JyArICh0aGlzLmdsb2JhbEFscGhhICogMTAwKSArICcpJyk7XG4gICAgfVxuICAgIFxuICAgIHZtbFN0ci5wdXNoKCcgcHJvZ2lkOkRYSW1hZ2VUcmFuc2Zvcm0uTWljcm9zb2Z0LkFscGhhSW1hZ2VMb2FkZXIoc3JjPScsIGltYWdlLnNyYywgJyxzaXppbmdNZXRob2Q9c2NhbGUpXCI+Jyk7XG4gICAgXG4gICAgLy8gQ2xvc2UgdGhlIGNyb3AgZGl2IGlmIG5lY2Vzc2FyeSAgICAgICAgICAgIFxuICAgIGlmIChzeCB8fCBzeSkgdm1sU3RyLnB1c2goJzwvZGl2PicpO1xuICAgIFxuICAgIHZtbFN0ci5wdXNoKCc8L2Rpdj48L2Rpdj4nKTtcbiAgICBcbiAgICB0aGlzLmVsZW1lbnRfLmluc2VydEFkamFjZW50SFRNTCgnQmVmb3JlRW5kJywgdm1sU3RyLmpvaW4oJycpKTtcbiAgfTtcblxuICBjb250ZXh0UHJvdG90eXBlLnN0cm9rZSA9IGZ1bmN0aW9uKGFGaWxsKSB7XG4gICAgdmFyIGxpbmVTdHIgPSBbXTtcbiAgICB2YXIgbGluZU9wZW4gPSBmYWxzZTtcblxuICAgIHZhciBXID0gMTA7XG4gICAgdmFyIEggPSAxMDtcblxuICAgIGxpbmVTdHIucHVzaCgnPGdfdm1sXzpzaGFwZScsXG4gICAgICAgICAgICAgICAgICcgZmlsbGVkPVwiJywgISFhRmlsbCwgJ1wiJyxcbiAgICAgICAgICAgICAgICAgJyBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3dpZHRoOicsIFcsICdweDtoZWlnaHQ6JywgSCwgJ3B4O1wiJyxcbiAgICAgICAgICAgICAgICAgJyBjb29yZG9yaWdpbj1cIjAsMFwiJyxcbiAgICAgICAgICAgICAgICAgJyBjb29yZHNpemU9XCInLCBaICogVywgJywnLCBaICogSCwgJ1wiJyxcbiAgICAgICAgICAgICAgICAgJyBzdHJva2VkPVwiJywgIWFGaWxsLCAnXCInLFxuICAgICAgICAgICAgICAgICAnIHBhdGg9XCInKTtcblxuICAgIHZhciBuZXdTZXEgPSBmYWxzZTtcbiAgICB2YXIgbWluID0ge3g6IG51bGwsIHk6IG51bGx9O1xuICAgIHZhciBtYXggPSB7eDogbnVsbCwgeTogbnVsbH07XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuY3VycmVudFBhdGhfLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgcCA9IHRoaXMuY3VycmVudFBhdGhfW2ldO1xuICAgICAgdmFyIGM7XG5cbiAgICAgIHN3aXRjaCAocC50eXBlKSB7XG4gICAgICAgIGNhc2UgJ21vdmVUbyc6XG4gICAgICAgICAgYyA9IHA7XG4gICAgICAgICAgbGluZVN0ci5wdXNoKCcgbSAnLCBtcihwLngpLCAnLCcsIG1yKHAueSkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdsaW5lVG8nOlxuICAgICAgICAgIGxpbmVTdHIucHVzaCgnIGwgJywgbXIocC54KSwgJywnLCBtcihwLnkpKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnY2xvc2UnOlxuICAgICAgICAgIGxpbmVTdHIucHVzaCgnIHggJyk7XG4gICAgICAgICAgcCA9IG51bGw7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2JlemllckN1cnZlVG8nOlxuICAgICAgICAgIGxpbmVTdHIucHVzaCgnIGMgJyxcbiAgICAgICAgICAgICAgICAgICAgICAgbXIocC5jcDF4KSwgJywnLCBtcihwLmNwMXkpLCAnLCcsXG4gICAgICAgICAgICAgICAgICAgICAgIG1yKHAuY3AyeCksICcsJywgbXIocC5jcDJ5KSwgJywnLFxuICAgICAgICAgICAgICAgICAgICAgICBtcihwLngpLCAnLCcsIG1yKHAueSkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdhdCc6XG4gICAgICAgIGNhc2UgJ3dhJzpcbiAgICAgICAgICBsaW5lU3RyLnB1c2goJyAnLCBwLnR5cGUsICcgJyxcbiAgICAgICAgICAgICAgICAgICAgICAgbXIocC54IC0gdGhpcy5zY2FsZVhfICogcC5yYWRpdXMpLCAnLCcsXG4gICAgICAgICAgICAgICAgICAgICAgIG1yKHAueSAtIHRoaXMuc2NhbGVZXyAqIHAucmFkaXVzKSwgJyAnLFxuICAgICAgICAgICAgICAgICAgICAgICBtcihwLnggKyB0aGlzLnNjYWxlWF8gKiBwLnJhZGl1cyksICcsJyxcbiAgICAgICAgICAgICAgICAgICAgICAgbXIocC55ICsgdGhpcy5zY2FsZVlfICogcC5yYWRpdXMpLCAnICcsXG4gICAgICAgICAgICAgICAgICAgICAgIG1yKHAueFN0YXJ0KSwgJywnLCBtcihwLnlTdGFydCksICcgJyxcbiAgICAgICAgICAgICAgICAgICAgICAgbXIocC54RW5kKSwgJywnLCBtcihwLnlFbmQpKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cblxuXG4gICAgICAvLyBUT0RPOiBGb2xsb3dpbmcgaXMgYnJva2VuIGZvciBjdXJ2ZXMgZHVlIHRvXG4gICAgICAvLyAgICAgICBtb3ZlIHRvIHByb3BlciBwYXRocy5cblxuICAgICAgLy8gRmlndXJlIG91dCBkaW1lbnNpb25zIHNvIHdlIGNhbiBkbyBncmFkaWVudCBmaWxsc1xuICAgICAgLy8gcHJvcGVybHlcbiAgICAgIGlmIChwKSB7XG4gICAgICAgIGlmIChtaW4ueCA9PSBudWxsIHx8IHAueCA8IG1pbi54KSB7XG4gICAgICAgICAgbWluLnggPSBwLng7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1heC54ID09IG51bGwgfHwgcC54ID4gbWF4LngpIHtcbiAgICAgICAgICBtYXgueCA9IHAueDtcbiAgICAgICAgfVxuICAgICAgICBpZiAobWluLnkgPT0gbnVsbCB8fCBwLnkgPCBtaW4ueSkge1xuICAgICAgICAgIG1pbi55ID0gcC55O1xuICAgICAgICB9XG4gICAgICAgIGlmIChtYXgueSA9PSBudWxsIHx8IHAueSA+IG1heC55KSB7XG4gICAgICAgICAgbWF4LnkgPSBwLnk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgbGluZVN0ci5wdXNoKCcgXCI+Jyk7XG5cbiAgICBpZiAoIWFGaWxsKSB7XG4gICAgICBhcHBlbmRTdHJva2UodGhpcywgbGluZVN0cik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFwcGVuZEZpbGwodGhpcywgbGluZVN0ciwgbWluLCBtYXgpO1xuICAgIH1cblxuICAgIGxpbmVTdHIucHVzaCgnPC9nX3ZtbF86c2hhcGU+Jyk7XG5cbiAgICB0aGlzLmVsZW1lbnRfLmluc2VydEFkamFjZW50SFRNTCgnYmVmb3JlRW5kJywgbGluZVN0ci5qb2luKCcnKSk7XG4gIH07XG5cbiAgZnVuY3Rpb24gYXBwZW5kU3Ryb2tlKGN0eCwgbGluZVN0cikge1xuICAgIHZhciBhID0gcHJvY2Vzc1N0eWxlKGN0eC5zdHJva2VTdHlsZSk7XG4gICAgdmFyIGNvbG9yID0gYS5jb2xvcjtcbiAgICB2YXIgb3BhY2l0eSA9IGEuYWxwaGEgKiBjdHguZ2xvYmFsQWxwaGE7XG4gICAgdmFyIGxpbmVXaWR0aCA9IGN0eC5saW5lU2NhbGVfICogY3R4LmxpbmVXaWR0aDtcblxuICAgIC8vIFZNTCBjYW5ub3QgY29ycmVjdGx5IHJlbmRlciBhIGxpbmUgaWYgdGhlIHdpZHRoIGlzIGxlc3MgdGhhbiAxcHguXG4gICAgLy8gSW4gdGhhdCBjYXNlLCB3ZSBkaWx1dGUgdGhlIGNvbG9yIHRvIG1ha2UgdGhlIGxpbmUgbG9vayB0aGlubmVyLlxuICAgIGlmIChsaW5lV2lkdGggPCAxKSB7XG4gICAgICBvcGFjaXR5ICo9IGxpbmVXaWR0aDtcbiAgICB9XG5cbiAgICBsaW5lU3RyLnB1c2goXG4gICAgICAnPGdfdm1sXzpzdHJva2UnLFxuICAgICAgJyBvcGFjaXR5PVwiJywgb3BhY2l0eSwgJ1wiJyxcbiAgICAgICcgam9pbnN0eWxlPVwiJywgY3R4LmxpbmVKb2luLCAnXCInLFxuICAgICAgJyBtaXRlcmxpbWl0PVwiJywgY3R4Lm1pdGVyTGltaXQsICdcIicsXG4gICAgICAnIGVuZGNhcD1cIicsIHByb2Nlc3NMaW5lQ2FwKGN0eC5saW5lQ2FwKSwgJ1wiJyxcbiAgICAgICcgd2VpZ2h0PVwiJywgbGluZVdpZHRoLCAncHhcIicsXG4gICAgICAnIGNvbG9yPVwiJywgY29sb3IsICdcIiAvPidcbiAgICApO1xuICB9XG5cbiAgZnVuY3Rpb24gYXBwZW5kRmlsbChjdHgsIGxpbmVTdHIsIG1pbiwgbWF4KSB7XG4gICAgdmFyIGZpbGxTdHlsZSA9IGN0eC5maWxsU3R5bGU7XG4gICAgdmFyIGFyY1NjYWxlWCA9IGN0eC5zY2FsZVhfO1xuICAgIHZhciBhcmNTY2FsZVkgPSBjdHguc2NhbGVZXztcbiAgICB2YXIgd2lkdGggPSBtYXgueCAtIG1pbi54O1xuICAgIHZhciBoZWlnaHQgPSBtYXgueSAtIG1pbi55O1xuICAgIGlmIChmaWxsU3R5bGUgaW5zdGFuY2VvZiBDYW52YXNHcmFkaWVudF8pIHtcbiAgICAgIC8vIFRPRE86IEdyYWRpZW50cyB0cmFuc2Zvcm1lZCB3aXRoIHRoZSB0cmFuc2Zvcm1hdGlvbiBtYXRyaXguXG4gICAgICB2YXIgYW5nbGUgPSAwO1xuICAgICAgdmFyIGZvY3VzID0ge3g6IDAsIHk6IDB9O1xuXG4gICAgICAvLyBhZGRpdGlvbmFsIG9mZnNldFxuICAgICAgdmFyIHNoaWZ0ID0gMDtcbiAgICAgIC8vIHNjYWxlIGZhY3RvciBmb3Igb2Zmc2V0XG4gICAgICB2YXIgZXhwYW5zaW9uID0gMTtcblxuICAgICAgaWYgKGZpbGxTdHlsZS50eXBlXyA9PSAnZ3JhZGllbnQnKSB7XG4gICAgICAgIHZhciB4MCA9IGZpbGxTdHlsZS54MF8gLyBhcmNTY2FsZVg7XG4gICAgICAgIHZhciB5MCA9IGZpbGxTdHlsZS55MF8gLyBhcmNTY2FsZVk7XG4gICAgICAgIHZhciB4MSA9IGZpbGxTdHlsZS54MV8gLyBhcmNTY2FsZVg7XG4gICAgICAgIHZhciB5MSA9IGZpbGxTdHlsZS55MV8gLyBhcmNTY2FsZVk7XG4gICAgICAgIHZhciBwMCA9IGdldENvb3JkcyhjdHgsIHgwLCB5MCk7XG4gICAgICAgIHZhciBwMSA9IGdldENvb3JkcyhjdHgsIHgxLCB5MSk7XG4gICAgICAgIHZhciBkeCA9IHAxLnggLSBwMC54O1xuICAgICAgICB2YXIgZHkgPSBwMS55IC0gcDAueTtcbiAgICAgICAgYW5nbGUgPSBNYXRoLmF0YW4yKGR4LCBkeSkgKiAxODAgLyBNYXRoLlBJO1xuXG4gICAgICAgIC8vIFRoZSBhbmdsZSBzaG91bGQgYmUgYSBub24tbmVnYXRpdmUgbnVtYmVyLlxuICAgICAgICBpZiAoYW5nbGUgPCAwKSB7XG4gICAgICAgICAgYW5nbGUgKz0gMzYwO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVmVyeSBzbWFsbCBhbmdsZXMgcHJvZHVjZSBhbiB1bmV4cGVjdGVkIHJlc3VsdCBiZWNhdXNlIHRoZXkgYXJlXG4gICAgICAgIC8vIGNvbnZlcnRlZCB0byBhIHNjaWVudGlmaWMgbm90YXRpb24gc3RyaW5nLlxuICAgICAgICBpZiAoYW5nbGUgPCAxZS02KSB7XG4gICAgICAgICAgYW5nbGUgPSAwO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgcDAgPSBnZXRDb29yZHMoY3R4LCBmaWxsU3R5bGUueDBfLCBmaWxsU3R5bGUueTBfKTtcbiAgICAgICAgZm9jdXMgPSB7XG4gICAgICAgICAgeDogKHAwLnggLSBtaW4ueCkgLyB3aWR0aCxcbiAgICAgICAgICB5OiAocDAueSAtIG1pbi55KSAvIGhlaWdodFxuICAgICAgICB9O1xuXG4gICAgICAgIHdpZHRoICAvPSBhcmNTY2FsZVggKiBaO1xuICAgICAgICBoZWlnaHQgLz0gYXJjU2NhbGVZICogWjtcbiAgICAgICAgdmFyIGRpbWVuc2lvbiA9IG0ubWF4KHdpZHRoLCBoZWlnaHQpO1xuICAgICAgICBzaGlmdCA9IDIgKiBmaWxsU3R5bGUucjBfIC8gZGltZW5zaW9uO1xuICAgICAgICBleHBhbnNpb24gPSAyICogZmlsbFN0eWxlLnIxXyAvIGRpbWVuc2lvbiAtIHNoaWZ0O1xuICAgICAgfVxuXG4gICAgICAvLyBXZSBuZWVkIHRvIHNvcnQgdGhlIGNvbG9yIHN0b3BzIGluIGFzY2VuZGluZyBvcmRlciBieSBvZmZzZXQsXG4gICAgICAvLyBvdGhlcndpc2UgSUUgd29uJ3QgaW50ZXJwcmV0IGl0IGNvcnJlY3RseS5cbiAgICAgIHZhciBzdG9wcyA9IGZpbGxTdHlsZS5jb2xvcnNfO1xuICAgICAgc3RvcHMuc29ydChmdW5jdGlvbihjczEsIGNzMikge1xuICAgICAgICByZXR1cm4gY3MxLm9mZnNldCAtIGNzMi5vZmZzZXQ7XG4gICAgICB9KTtcblxuICAgICAgdmFyIGxlbmd0aCA9IHN0b3BzLmxlbmd0aDtcbiAgICAgIHZhciBjb2xvcjEgPSBzdG9wc1swXS5jb2xvcjtcbiAgICAgIHZhciBjb2xvcjIgPSBzdG9wc1tsZW5ndGggLSAxXS5jb2xvcjtcbiAgICAgIHZhciBvcGFjaXR5MSA9IHN0b3BzWzBdLmFscGhhICogY3R4Lmdsb2JhbEFscGhhO1xuICAgICAgdmFyIG9wYWNpdHkyID0gc3RvcHNbbGVuZ3RoIC0gMV0uYWxwaGEgKiBjdHguZ2xvYmFsQWxwaGE7XG5cbiAgICAgIHZhciBjb2xvcnMgPSBbXTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHN0b3AgPSBzdG9wc1tpXTtcbiAgICAgICAgY29sb3JzLnB1c2goc3RvcC5vZmZzZXQgKiBleHBhbnNpb24gKyBzaGlmdCArICcgJyArIHN0b3AuY29sb3IpO1xuICAgICAgfVxuXG4gICAgICAvLyBXaGVuIGNvbG9ycyBhdHRyaWJ1dGUgaXMgdXNlZCwgdGhlIG1lYW5pbmdzIG9mIG9wYWNpdHkgYW5kIG86b3BhY2l0eTJcbiAgICAgIC8vIGFyZSByZXZlcnNlZC5cbiAgICAgIGxpbmVTdHIucHVzaCgnPGdfdm1sXzpmaWxsIHR5cGU9XCInLCBmaWxsU3R5bGUudHlwZV8sICdcIicsXG4gICAgICAgICAgICAgICAgICAgJyBtZXRob2Q9XCJub25lXCIgZm9jdXM9XCIxMDAlXCInLFxuICAgICAgICAgICAgICAgICAgICcgY29sb3I9XCInLCBjb2xvcjEsICdcIicsXG4gICAgICAgICAgICAgICAgICAgJyBjb2xvcjI9XCInLCBjb2xvcjIsICdcIicsXG4gICAgICAgICAgICAgICAgICAgJyBjb2xvcnM9XCInLCBjb2xvcnMuam9pbignLCcpLCAnXCInLFxuICAgICAgICAgICAgICAgICAgICcgb3BhY2l0eT1cIicsIG9wYWNpdHkyLCAnXCInLFxuICAgICAgICAgICAgICAgICAgICcgZ19vXzpvcGFjaXR5Mj1cIicsIG9wYWNpdHkxLCAnXCInLFxuICAgICAgICAgICAgICAgICAgICcgYW5nbGU9XCInLCBhbmdsZSwgJ1wiJyxcbiAgICAgICAgICAgICAgICAgICAnIGZvY3VzcG9zaXRpb249XCInLCBmb2N1cy54LCAnLCcsIGZvY3VzLnksICdcIiAvPicpO1xuICAgIH0gZWxzZSBpZiAoZmlsbFN0eWxlIGluc3RhbmNlb2YgQ2FudmFzUGF0dGVybl8pIHtcbiAgICAgIGlmICh3aWR0aCAmJiBoZWlnaHQpIHtcbiAgICAgICAgdmFyIGRlbHRhTGVmdCA9IC1taW4ueDtcbiAgICAgICAgdmFyIGRlbHRhVG9wID0gLW1pbi55O1xuICAgICAgICBsaW5lU3RyLnB1c2goJzxnX3ZtbF86ZmlsbCcsXG4gICAgICAgICAgICAgICAgICAgICAnIHBvc2l0aW9uPVwiJyxcbiAgICAgICAgICAgICAgICAgICAgIGRlbHRhTGVmdCAvIHdpZHRoICogYXJjU2NhbGVYICogYXJjU2NhbGVYLCAnLCcsXG4gICAgICAgICAgICAgICAgICAgICBkZWx0YVRvcCAvIGhlaWdodCAqIGFyY1NjYWxlWSAqIGFyY1NjYWxlWSwgJ1wiJyxcbiAgICAgICAgICAgICAgICAgICAgICcgdHlwZT1cInRpbGVcIicsXG4gICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBGaWd1cmUgb3V0IHRoZSBjb3JyZWN0IHNpemUgdG8gZml0IHRoZSBzY2FsZS5cbiAgICAgICAgICAgICAgICAgICAgIC8vJyBzaXplPVwiJywgdywgJ3B4ICcsIGgsICdweFwiJyxcbiAgICAgICAgICAgICAgICAgICAgICcgc3JjPVwiJywgZmlsbFN0eWxlLnNyY18sICdcIiAvPicpO1xuICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGEgPSBwcm9jZXNzU3R5bGUoY3R4LmZpbGxTdHlsZSk7XG4gICAgICB2YXIgY29sb3IgPSBhLmNvbG9yO1xuICAgICAgdmFyIG9wYWNpdHkgPSBhLmFscGhhICogY3R4Lmdsb2JhbEFscGhhO1xuICAgICAgbGluZVN0ci5wdXNoKCc8Z192bWxfOmZpbGwgY29sb3I9XCInLCBjb2xvciwgJ1wiIG9wYWNpdHk9XCInLCBvcGFjaXR5LFxuICAgICAgICAgICAgICAgICAgICdcIiAvPicpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnRleHRQcm90b3R5cGUuZmlsbCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc3Ryb2tlKHRydWUpO1xuICB9O1xuXG4gIGNvbnRleHRQcm90b3R5cGUuY2xvc2VQYXRoID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5jdXJyZW50UGF0aF8ucHVzaCh7dHlwZTogJ2Nsb3NlJ30pO1xuICB9O1xuXG4gIGZ1bmN0aW9uIGdldENvb3JkcyhjdHgsIGFYLCBhWSkge1xuICAgIHZhciBtID0gY3R4Lm1fO1xuICAgIHJldHVybiB7XG4gICAgICB4OiBaICogKGFYICogbVswXVswXSArIGFZICogbVsxXVswXSArIG1bMl1bMF0pIC0gWjIsXG4gICAgICB5OiBaICogKGFYICogbVswXVsxXSArIGFZICogbVsxXVsxXSArIG1bMl1bMV0pIC0gWjJcbiAgICB9O1xuICB9O1xuXG4gIGNvbnRleHRQcm90b3R5cGUuc2F2ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBvID0ge307XG4gICAgY29weVN0YXRlKHRoaXMsIG8pO1xuICAgIHRoaXMuYVN0YWNrXy5wdXNoKG8pO1xuICAgIHRoaXMubVN0YWNrXy5wdXNoKHRoaXMubV8pO1xuICAgIHRoaXMubV8gPSBtYXRyaXhNdWx0aXBseShjcmVhdGVNYXRyaXhJZGVudGl0eSgpLCB0aGlzLm1fKTtcbiAgfTtcblxuICBjb250ZXh0UHJvdG90eXBlLnJlc3RvcmUgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5hU3RhY2tfLmxlbmd0aCkge1xuICAgICAgY29weVN0YXRlKHRoaXMuYVN0YWNrXy5wb3AoKSwgdGhpcyk7XG4gICAgICB0aGlzLm1fID0gdGhpcy5tU3RhY2tfLnBvcCgpO1xuICAgIH1cbiAgfTtcblxuICBmdW5jdGlvbiBtYXRyaXhJc0Zpbml0ZShtKSB7XG4gICAgcmV0dXJuIGlzRmluaXRlKG1bMF1bMF0pICYmIGlzRmluaXRlKG1bMF1bMV0pICYmXG4gICAgICAgIGlzRmluaXRlKG1bMV1bMF0pICYmIGlzRmluaXRlKG1bMV1bMV0pICYmXG4gICAgICAgIGlzRmluaXRlKG1bMl1bMF0pICYmIGlzRmluaXRlKG1bMl1bMV0pO1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0TShjdHgsIG0sIHVwZGF0ZUxpbmVTY2FsZSkge1xuICAgIGlmICghbWF0cml4SXNGaW5pdGUobSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY3R4Lm1fID0gbTtcblxuICAgIGN0eC5zY2FsZVhfID0gTWF0aC5zcXJ0KG1bMF1bMF0gKiBtWzBdWzBdICsgbVswXVsxXSAqIG1bMF1bMV0pO1xuICAgIGN0eC5zY2FsZVlfID0gTWF0aC5zcXJ0KG1bMV1bMF0gKiBtWzFdWzBdICsgbVsxXVsxXSAqIG1bMV1bMV0pO1xuXG4gICAgaWYgKHVwZGF0ZUxpbmVTY2FsZSkge1xuICAgICAgLy8gR2V0IHRoZSBsaW5lIHNjYWxlLlxuICAgICAgLy8gRGV0ZXJtaW5hbnQgb2YgdGhpcy5tXyBtZWFucyBob3cgbXVjaCB0aGUgYXJlYSBpcyBlbmxhcmdlZCBieSB0aGVcbiAgICAgIC8vIHRyYW5zZm9ybWF0aW9uLiBTbyBpdHMgc3F1YXJlIHJvb3QgY2FuIGJlIHVzZWQgYXMgYSBzY2FsZSBmYWN0b3JcbiAgICAgIC8vIGZvciB3aWR0aC5cbiAgICAgIHZhciBkZXQgPSBtWzBdWzBdICogbVsxXVsxXSAtIG1bMF1bMV0gKiBtWzFdWzBdO1xuICAgICAgY3R4LmxpbmVTY2FsZV8gPSBzcXJ0KGFicyhkZXQpKTtcbiAgICB9XG4gIH1cblxuICBjb250ZXh0UHJvdG90eXBlLnRyYW5zbGF0ZSA9IGZ1bmN0aW9uKGFYLCBhWSkge1xuICAgIHZhciBtMSA9IFtcbiAgICAgIFsxLCAgMCwgIDBdLFxuICAgICAgWzAsICAxLCAgMF0sXG4gICAgICBbYVgsIGFZLCAxXVxuICAgIF07XG5cbiAgICBzZXRNKHRoaXMsIG1hdHJpeE11bHRpcGx5KG0xLCB0aGlzLm1fKSwgZmFsc2UpO1xuICB9O1xuXG4gIGNvbnRleHRQcm90b3R5cGUucm90YXRlID0gZnVuY3Rpb24oYVJvdCkge1xuICAgIHZhciBjID0gbWMoYVJvdCk7XG4gICAgdmFyIHMgPSBtcyhhUm90KTtcblxuICAgIHZhciBtMSA9IFtcbiAgICAgIFtjLCAgcywgMF0sXG4gICAgICBbLXMsIGMsIDBdLFxuICAgICAgWzAsICAwLCAxXVxuICAgIF07XG5cbiAgICBzZXRNKHRoaXMsIG1hdHJpeE11bHRpcGx5KG0xLCB0aGlzLm1fKSwgZmFsc2UpO1xuICB9O1xuXG4gIGNvbnRleHRQcm90b3R5cGUuc2NhbGUgPSBmdW5jdGlvbihhWCwgYVkpIHtcbiAgICB2YXIgbTEgPSBbXG4gICAgICBbYVgsIDAsICAwXSxcbiAgICAgIFswLCAgYVksIDBdLFxuICAgICAgWzAsICAwLCAgMV1cbiAgICBdO1xuXG4gICAgc2V0TSh0aGlzLCBtYXRyaXhNdWx0aXBseShtMSwgdGhpcy5tXyksIHRydWUpO1xuICB9O1xuXG4gIGNvbnRleHRQcm90b3R5cGUudHJhbnNmb3JtID0gZnVuY3Rpb24obTExLCBtMTIsIG0yMSwgbTIyLCBkeCwgZHkpIHtcbiAgICB2YXIgbTEgPSBbXG4gICAgICBbbTExLCBtMTIsIDBdLFxuICAgICAgW20yMSwgbTIyLCAwXSxcbiAgICAgIFtkeCwgIGR5LCAgMV1cbiAgICBdO1xuXG4gICAgc2V0TSh0aGlzLCBtYXRyaXhNdWx0aXBseShtMSwgdGhpcy5tXyksIHRydWUpO1xuXG4gIH07XG5cbiAgY29udGV4dFByb3RvdHlwZS5zZXRUcmFuc2Zvcm0gPSBmdW5jdGlvbihtMTEsIG0xMiwgbTIxLCBtMjIsIGR4LCBkeSkge1xuICAgIHZhciBtID0gW1xuICAgICAgW20xMSwgbTEyLCAwXSxcbiAgICAgIFttMjEsIG0yMiwgMF0sXG4gICAgICBbZHgsICBkeSwgIDFdXG4gICAgXTtcblxuICAgIHNldE0odGhpcywgbSwgdHJ1ZSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFRoZSB0ZXh0IGRyYXdpbmcgZnVuY3Rpb24uXG4gICAqIFRoZSBtYXhXaWR0aCBhcmd1bWVudCBpc24ndCB0YWtlbiBpbiBhY2NvdW50LCBzaW5jZSBubyBicm93c2VyIHN1cHBvcnRzXG4gICAqIGl0IHlldC5cbiAgICovXG4gIGNvbnRleHRQcm90b3R5cGUuZHJhd1RleHRfID0gZnVuY3Rpb24odGV4dCwgeCwgeSwgbWF4V2lkdGgsIHN0cm9rZSkge1xuICAgIHZhciBtID0gdGhpcy5tXyxcbiAgICAgICAgZGVsdGEgPSAxMDAwLFxuICAgICAgICBsZWZ0ID0gMCxcbiAgICAgICAgcmlnaHQgPSBkZWx0YSxcbiAgICAgICAgb2Zmc2V0ID0ge3g6IDAsIHk6IDB9LFxuICAgICAgICBsaW5lU3RyID0gW107XG5cbiAgICB2YXIgZm9udFN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShwcm9jZXNzRm9udFN0eWxlKHRoaXMuZm9udCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50Xyk7XG5cbiAgICB2YXIgZm9udFN0eWxlU3RyaW5nID0gYnVpbGRTdHlsZShmb250U3R5bGUpO1xuXG4gICAgdmFyIGVsZW1lbnRTdHlsZSA9IHRoaXMuZWxlbWVudF8uY3VycmVudFN0eWxlO1xuICAgIHZhciB0ZXh0QWxpZ24gPSB0aGlzLnRleHRBbGlnbi50b0xvd2VyQ2FzZSgpO1xuICAgIHN3aXRjaCAodGV4dEFsaWduKSB7XG4gICAgICBjYXNlICdsZWZ0JzpcbiAgICAgIGNhc2UgJ2NlbnRlcic6XG4gICAgICBjYXNlICdyaWdodCc6XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnZW5kJzpcbiAgICAgICAgdGV4dEFsaWduID0gZWxlbWVudFN0eWxlLmRpcmVjdGlvbiA9PSAnbHRyJyA/ICdyaWdodCcgOiAnbGVmdCc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnc3RhcnQnOlxuICAgICAgICB0ZXh0QWxpZ24gPSBlbGVtZW50U3R5bGUuZGlyZWN0aW9uID09ICdydGwnID8gJ3JpZ2h0JyA6ICdsZWZ0JztcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0ZXh0QWxpZ24gPSAnbGVmdCc7XG4gICAgfVxuXG4gICAgLy8gMS43NSBpcyBhbiBhcmJpdHJhcnkgbnVtYmVyLCBhcyB0aGVyZSBpcyBubyBpbmZvIGFib3V0IHRoZSB0ZXh0IGJhc2VsaW5lXG4gICAgc3dpdGNoICh0aGlzLnRleHRCYXNlbGluZSkge1xuICAgICAgY2FzZSAnaGFuZ2luZyc6XG4gICAgICBjYXNlICd0b3AnOlxuICAgICAgICBvZmZzZXQueSA9IGZvbnRTdHlsZS5zaXplIC8gMS43NTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdtaWRkbGUnOlxuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICBjYXNlIG51bGw6XG4gICAgICBjYXNlICdhbHBoYWJldGljJzpcbiAgICAgIGNhc2UgJ2lkZW9ncmFwaGljJzpcbiAgICAgIGNhc2UgJ2JvdHRvbSc6XG4gICAgICAgIG9mZnNldC55ID0gLWZvbnRTdHlsZS5zaXplIC8gMi4yNTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgc3dpdGNoKHRleHRBbGlnbikge1xuICAgICAgY2FzZSAncmlnaHQnOlxuICAgICAgICBsZWZ0ID0gZGVsdGE7XG4gICAgICAgIHJpZ2h0ID0gMC4wNTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdjZW50ZXInOlxuICAgICAgICBsZWZ0ID0gcmlnaHQgPSBkZWx0YSAvIDI7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIHZhciBkID0gZ2V0Q29vcmRzKHRoaXMsIHggKyBvZmZzZXQueCwgeSArIG9mZnNldC55KTtcblxuICAgIGxpbmVTdHIucHVzaCgnPGdfdm1sXzpsaW5lIGZyb209XCInLCAtbGVmdCAsJyAwXCIgdG89XCInLCByaWdodCAsJyAwLjA1XCIgJyxcbiAgICAgICAgICAgICAgICAgJyBjb29yZHNpemU9XCIxMDAgMTAwXCIgY29vcmRvcmlnaW49XCIwIDBcIicsXG4gICAgICAgICAgICAgICAgICcgZmlsbGVkPVwiJywgIXN0cm9rZSwgJ1wiIHN0cm9rZWQ9XCInLCAhIXN0cm9rZSxcbiAgICAgICAgICAgICAgICAgJ1wiIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7d2lkdGg6MXB4O2hlaWdodDoxcHg7XCI+Jyk7XG5cbiAgICBpZiAoc3Ryb2tlKSB7XG4gICAgICBhcHBlbmRTdHJva2UodGhpcywgbGluZVN0cik7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFRPRE86IEZpeCB0aGUgbWluIGFuZCBtYXggcGFyYW1zLlxuICAgICAgYXBwZW5kRmlsbCh0aGlzLCBsaW5lU3RyLCB7eDogLWxlZnQsIHk6IDB9LFxuICAgICAgICAgICAgICAgICB7eDogcmlnaHQsIHk6IGZvbnRTdHlsZS5zaXplfSk7XG4gICAgfVxuXG4gICAgdmFyIHNrZXdNID0gbVswXVswXS50b0ZpeGVkKDMpICsgJywnICsgbVsxXVswXS50b0ZpeGVkKDMpICsgJywnICtcbiAgICAgICAgICAgICAgICBtWzBdWzFdLnRvRml4ZWQoMykgKyAnLCcgKyBtWzFdWzFdLnRvRml4ZWQoMykgKyAnLDAsMCc7XG5cbiAgICB2YXIgc2tld09mZnNldCA9IG1yKGQueCAvIFopICsgJywnICsgbXIoZC55IC8gWik7XG5cbiAgICBsaW5lU3RyLnB1c2goJzxnX3ZtbF86c2tldyBvbj1cInRcIiBtYXRyaXg9XCInLCBza2V3TSAsJ1wiICcsXG4gICAgICAgICAgICAgICAgICcgb2Zmc2V0PVwiJywgc2tld09mZnNldCwgJ1wiIG9yaWdpbj1cIicsIGxlZnQgLCcgMFwiIC8+JyxcbiAgICAgICAgICAgICAgICAgJzxnX3ZtbF86cGF0aCB0ZXh0cGF0aG9rPVwidHJ1ZVwiIC8+JyxcbiAgICAgICAgICAgICAgICAgJzxnX3ZtbF86dGV4dHBhdGggb249XCJ0cnVlXCIgc3RyaW5nPVwiJyxcbiAgICAgICAgICAgICAgICAgZW5jb2RlSHRtbEF0dHJpYnV0ZSh0ZXh0KSxcbiAgICAgICAgICAgICAgICAgJ1wiIHN0eWxlPVwidi10ZXh0LWFsaWduOicsIHRleHRBbGlnbixcbiAgICAgICAgICAgICAgICAgJztmb250OicsIGVuY29kZUh0bWxBdHRyaWJ1dGUoZm9udFN0eWxlU3RyaW5nKSxcbiAgICAgICAgICAgICAgICAgJ1wiIC8+PC9nX3ZtbF86bGluZT4nKTtcblxuICAgIHRoaXMuZWxlbWVudF8uaW5zZXJ0QWRqYWNlbnRIVE1MKCdiZWZvcmVFbmQnLCBsaW5lU3RyLmpvaW4oJycpKTtcbiAgfTtcblxuICBjb250ZXh0UHJvdG90eXBlLmZpbGxUZXh0ID0gZnVuY3Rpb24odGV4dCwgeCwgeSwgbWF4V2lkdGgpIHtcbiAgICB0aGlzLmRyYXdUZXh0Xyh0ZXh0LCB4LCB5LCBtYXhXaWR0aCwgZmFsc2UpO1xuICB9O1xuXG4gIGNvbnRleHRQcm90b3R5cGUuc3Ryb2tlVGV4dCA9IGZ1bmN0aW9uKHRleHQsIHgsIHksIG1heFdpZHRoKSB7XG4gICAgdGhpcy5kcmF3VGV4dF8odGV4dCwgeCwgeSwgbWF4V2lkdGgsIHRydWUpO1xuICB9O1xuXG4gIGNvbnRleHRQcm90b3R5cGUubWVhc3VyZVRleHQgPSBmdW5jdGlvbih0ZXh0KSB7XG4gICAgaWYgKCF0aGlzLnRleHRNZWFzdXJlRWxfKSB7XG4gICAgICB2YXIgcyA9ICc8c3BhbiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlOycgK1xuICAgICAgICAgICd0b3A6LTIwMDAwcHg7bGVmdDowO3BhZGRpbmc6MDttYXJnaW46MDtib3JkZXI6bm9uZTsnICtcbiAgICAgICAgICAnd2hpdGUtc3BhY2U6cHJlO1wiPjwvc3Bhbj4nO1xuICAgICAgdGhpcy5lbGVtZW50Xy5pbnNlcnRBZGphY2VudEhUTUwoJ2JlZm9yZUVuZCcsIHMpO1xuICAgICAgdGhpcy50ZXh0TWVhc3VyZUVsXyA9IHRoaXMuZWxlbWVudF8ubGFzdENoaWxkO1xuICAgIH1cbiAgICB2YXIgZG9jID0gdGhpcy5lbGVtZW50Xy5vd25lckRvY3VtZW50O1xuICAgIHRoaXMudGV4dE1lYXN1cmVFbF8uaW5uZXJIVE1MID0gJyc7XG4gICAgdHJ5IHtcbiAgICAgICAgdGhpcy50ZXh0TWVhc3VyZUVsXy5zdHlsZS5mb250ID0gdGhpcy5mb250O1xuICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgIC8vIElnbm9yZSBmYWlsdXJlcyB0byBzZXQgdG8gaW52YWxpZCBmb250LlxuICAgIH1cbiAgICBcbiAgICAvLyBEb24ndCB1c2UgaW5uZXJIVE1MIG9yIGlubmVyVGV4dCBiZWNhdXNlIHRoZXkgYWxsb3cgbWFya3VwL3doaXRlc3BhY2UuXG4gICAgdGhpcy50ZXh0TWVhc3VyZUVsXy5hcHBlbmRDaGlsZChkb2MuY3JlYXRlVGV4dE5vZGUodGV4dCkpO1xuICAgIHJldHVybiB7d2lkdGg6IHRoaXMudGV4dE1lYXN1cmVFbF8ub2Zmc2V0V2lkdGh9O1xuICB9O1xuXG4gIC8qKioqKioqKiBTVFVCUyAqKioqKioqKi9cbiAgY29udGV4dFByb3RvdHlwZS5jbGlwID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gVE9ETzogSW1wbGVtZW50XG4gIH07XG5cbiAgY29udGV4dFByb3RvdHlwZS5hcmNUbyA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIFRPRE86IEltcGxlbWVudFxuICB9O1xuXG4gIGNvbnRleHRQcm90b3R5cGUuY3JlYXRlUGF0dGVybiA9IGZ1bmN0aW9uKGltYWdlLCByZXBldGl0aW9uKSB7XG4gICAgcmV0dXJuIG5ldyBDYW52YXNQYXR0ZXJuXyhpbWFnZSwgcmVwZXRpdGlvbik7XG4gIH07XG5cbiAgLy8gR3JhZGllbnQgLyBQYXR0ZXJuIFN0dWJzXG4gIGZ1bmN0aW9uIENhbnZhc0dyYWRpZW50XyhhVHlwZSkge1xuICAgIHRoaXMudHlwZV8gPSBhVHlwZTtcbiAgICB0aGlzLngwXyA9IDA7XG4gICAgdGhpcy55MF8gPSAwO1xuICAgIHRoaXMucjBfID0gMDtcbiAgICB0aGlzLngxXyA9IDA7XG4gICAgdGhpcy55MV8gPSAwO1xuICAgIHRoaXMucjFfID0gMDtcbiAgICB0aGlzLmNvbG9yc18gPSBbXTtcbiAgfVxuXG4gIENhbnZhc0dyYWRpZW50Xy5wcm90b3R5cGUuYWRkQ29sb3JTdG9wID0gZnVuY3Rpb24oYU9mZnNldCwgYUNvbG9yKSB7XG4gICAgYUNvbG9yID0gcHJvY2Vzc1N0eWxlKGFDb2xvcik7XG4gICAgdGhpcy5jb2xvcnNfLnB1c2goe29mZnNldDogYU9mZnNldCxcbiAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IGFDb2xvci5jb2xvcixcbiAgICAgICAgICAgICAgICAgICAgICAgYWxwaGE6IGFDb2xvci5hbHBoYX0pO1xuICB9O1xuXG4gIGZ1bmN0aW9uIENhbnZhc1BhdHRlcm5fKGltYWdlLCByZXBldGl0aW9uKSB7XG4gICAgYXNzZXJ0SW1hZ2VJc1ZhbGlkKGltYWdlKTtcbiAgICBzd2l0Y2ggKHJlcGV0aXRpb24pIHtcbiAgICAgIGNhc2UgJ3JlcGVhdCc6XG4gICAgICBjYXNlIG51bGw6XG4gICAgICBjYXNlICcnOlxuICAgICAgICB0aGlzLnJlcGV0aXRpb25fID0gJ3JlcGVhdCc7XG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdyZXBlYXQteCc6XG4gICAgICBjYXNlICdyZXBlYXQteSc6XG4gICAgICBjYXNlICduby1yZXBlYXQnOlxuICAgICAgICB0aGlzLnJlcGV0aXRpb25fID0gcmVwZXRpdGlvbjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvd0V4Y2VwdGlvbignU1lOVEFYX0VSUicpO1xuICAgIH1cblxuICAgIHRoaXMuc3JjXyA9IGltYWdlLnNyYztcbiAgICB0aGlzLndpZHRoXyA9IGltYWdlLndpZHRoO1xuICAgIHRoaXMuaGVpZ2h0XyA9IGltYWdlLmhlaWdodDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRocm93RXhjZXB0aW9uKHMpIHtcbiAgICB0aHJvdyBuZXcgRE9NRXhjZXB0aW9uXyhzKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFzc2VydEltYWdlSXNWYWxpZChpbWcpIHtcbiAgICBpZiAoIWltZyB8fCBpbWcubm9kZVR5cGUgIT0gMSB8fCBpbWcudGFnTmFtZSAhPSAnSU1HJykge1xuICAgICAgdGhyb3dFeGNlcHRpb24oJ1RZUEVfTUlTTUFUQ0hfRVJSJyk7XG4gICAgfVxuICAgIGlmIChpbWcucmVhZHlTdGF0ZSAhPSAnY29tcGxldGUnKSB7XG4gICAgICB0aHJvd0V4Y2VwdGlvbignSU5WQUxJRF9TVEFURV9FUlInKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBET01FeGNlcHRpb25fKHMpIHtcbiAgICB0aGlzLmNvZGUgPSB0aGlzW3NdO1xuICAgIHRoaXMubWVzc2FnZSA9IHMgKyc6IERPTSBFeGNlcHRpb24gJyArIHRoaXMuY29kZTtcbiAgfVxuICB2YXIgcCA9IERPTUV4Y2VwdGlvbl8ucHJvdG90eXBlID0gbmV3IEVycm9yO1xuICBwLklOREVYX1NJWkVfRVJSID0gMTtcbiAgcC5ET01TVFJJTkdfU0laRV9FUlIgPSAyO1xuICBwLkhJRVJBUkNIWV9SRVFVRVNUX0VSUiA9IDM7XG4gIHAuV1JPTkdfRE9DVU1FTlRfRVJSID0gNDtcbiAgcC5JTlZBTElEX0NIQVJBQ1RFUl9FUlIgPSA1O1xuICBwLk5PX0RBVEFfQUxMT1dFRF9FUlIgPSA2O1xuICBwLk5PX01PRElGSUNBVElPTl9BTExPV0VEX0VSUiA9IDc7XG4gIHAuTk9UX0ZPVU5EX0VSUiA9IDg7XG4gIHAuTk9UX1NVUFBPUlRFRF9FUlIgPSA5O1xuICBwLklOVVNFX0FUVFJJQlVURV9FUlIgPSAxMDtcbiAgcC5JTlZBTElEX1NUQVRFX0VSUiA9IDExO1xuICBwLlNZTlRBWF9FUlIgPSAxMjtcbiAgcC5JTlZBTElEX01PRElGSUNBVElPTl9FUlIgPSAxMztcbiAgcC5OQU1FU1BBQ0VfRVJSID0gMTQ7XG4gIHAuSU5WQUxJRF9BQ0NFU1NfRVJSID0gMTU7XG4gIHAuVkFMSURBVElPTl9FUlIgPSAxNjtcbiAgcC5UWVBFX01JU01BVENIX0VSUiA9IDE3O1xuXG4gIC8vIHNldCB1cCBleHRlcm5zXG4gIEdfdm1sQ2FudmFzTWFuYWdlciA9IEdfdm1sQ2FudmFzTWFuYWdlcl87XG4gIENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCA9IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRF87XG4gIENhbnZhc0dyYWRpZW50ID0gQ2FudmFzR3JhZGllbnRfO1xuICBDYW52YXNQYXR0ZXJuID0gQ2FudmFzUGF0dGVybl87XG4gIERPTUV4Y2VwdGlvbiA9IERPTUV4Y2VwdGlvbl87XG59KSgpO1xuXG59IC8vIGlmXG5lbHNlIHsgLy8gbWFrZSB0aGUgY2FudmFzIHRlc3Qgc2ltcGxlIGJ5IGtlbmVyLmxpbmZlbmdAZ21haWwuY29tXG4gICAgR192bWxDYW52YXNNYW5hZ2VyID0gZmFsc2U7XG59XG5yZXR1cm4gR192bWxDYW52YXNNYW5hZ2VyO1xufSk7IC8vIGRlZmluZVxuIl0sImZpbGUiOiJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL2RlcC9leGNhbnZhcy5qcyJ9
