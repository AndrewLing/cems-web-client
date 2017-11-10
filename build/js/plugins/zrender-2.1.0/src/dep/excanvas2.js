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
// Optimized by https://github.com/pissang
// 
// NOTES http://jsperf.com/dom-attr-read-perf/2
// http://jsperf.com/arr-vs-obj-in-ie
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

  var EPSILON = 1e-5;
  var isAroundZero = function (val) {
      return val > -EPSILON && val < EPSILON;
  }
  function isNotAroundZero(val) {
      return val > EPSILON || val < -EPSILON;
  }

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
      // NOTES, It will not work proply if add '#default#VML' 
      // When using appendChild to add dom
      // doc.namespaces.add(prefix, urn, '#default#VML');
      doc.namespaces.add(prefix, urn);
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
          'text-align:left;width:300px;height:150px} .g_vml_ {behavior:url(#default#VML);}';
    }
  }

  function createVMLElement(tagName) {
    // NOTES Why using createElement needs to add behavior:url(#default#VML) in style
    var dom = document.createElement('<g_vml_:' + tagName + ' class="g_vml_">');
    return dom;

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
    o2.strokeStyle   = o1.strokeStyle;
    o2.globalAlpha   = o1.globalAlpha;
    o2.font          = o1.font;
    o2.textAlign     = o1.textAlign;
    o2.textBaseline  = o1.textBaseline;
    o2.scaleX_    = o1.scaleX_;
    o2.scaleY_    = o1.scaleY_;
    o2.x_    = o1.x_;
    o2.y_    = o1.y_;
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

  function createShapeAttr() {
    return {
      filled: false,
      stroked: false,

      path: '',
      fillStyle: null,
      strokeStyle: null,

      globalAlpha: 1,
      lineCap: 'butt',
      lineJoin: 'miter',
      lineWidth: 1,
      miterlimit: Z * 1,

      x: 0,
      y: 0
    };
  }

  function copyShapeAttr(o1, o2) {
    o1.path = o2.path;

    o1.fillStyle = o2.fillStyle;

    o1.globalAlpha = o2.globalAlpha;
    
    // PENDING When shape changed from not stroked to stroked
    if (o2.stroked) {
      o1.strokeStyle = o2.strokeStyle;
      o1.lineCap = o2.lineCap;
      o1.lineJoin = o2.lineJoin;
      o1.lineWidth = o2.lineWidth;
      o1.miterlimit = o2.miterlimit; 
    }

    o1.x = o2.x;
    o1.y = o2.y;

    o1.filled = o2.filled;
    o1.stroked = o2.stroked;
  }

  function createTextAttr() {
    var attr = createShapeAttr();
    attr.text = '';
    attr.font = '12px 微软雅黑';
    attr.textAlign = 'left';
    attr.textBaseline = 'alphabetic';
    attr.offX = 0;
    attr.offY = 0;
    attr.maxWidth = 0;

    return attr;
  }

  function copyTextAttr(o1, o2) {
    copyShapeAttr(o1, o2);

    o1.text = o2.text;
    o1.font = o2.font;
    o1.textAlign = o2.textAlign;
    o1.textBaseline = o2.textBaseline;
    o1.offX = o2.offX;
    o1.offY = o2.offY;
    o1.maxWidth = o2.maxWidth;
  }

  function createImageAttr() {
    return {
      image: '',
      // position after tranformed
      x: 0,
      y: 0,
      padding: '',
      skewM: '',
      cropped: false,
      width: 0,
      height: 0,
      globalAlpha: 1
    };
  }

  function copyImageAttr(o1, o2) {
    o1.image = o2.image;
    o1.x = o2.x;
    o1.y = o2.y;
    o1.width = o2.width;
    o1.height = o2.height;
    o1.globalAlpha = o2.globalAlpha;

    if (o2.skewed) {
      o1.skewM = o2.skewM;
      o1.padding = o2.padding; 
    }

    if (o2.cropped) {
      o1.cropWidth = o2.cropWidth;
      o1.cropHeight = o2.cropHeight;
      o1.cropFilter = o2.cropFilter;
    }

    o1.cropped = o2.cropped;
    o1.skewed = o2.skewed;
  }

  /**
   * Virtual shape dom is created by stroke and fill operation.
   * It will be cached in Context2D object. And created only if needed when redrawing
   * @author https://github.com/pissang/
   */
  function ShapeVirtualDom_() {
    // this.rootEl_ = null;
    // this.strokeEl_ = null;
    // this.fillEl_ = null;

    this.attr_ = createShapeAttr();

    this.attrPrev_ = {};
  }

  ShapeVirtualDom_.prototype.attachTo = function (el) {
    if (!this.attached_) {
      var p = this.rootEl_.parentNode;
      if (p !== el) {
        el.appendChild(this.rootEl_);
      }
    }
    this.attached_ = true;
  }

  ShapeVirtualDom_.prototype.detach = function () {
    if (this.attached_) {
      var p = this.rootEl_.parentNode;
      if (p) {
        p.removeChild(this.rootEl_);
      }
    }
    this.attached_ = false;
  }

  ShapeVirtualDom_.prototype.getElement = function (path) {
    if (!this.rootEl_) {
      this.createShapeEl_(path);
    }
    var attr_ = this.attr_;
    attr_.path = path;
    attr_.filled = false;
    attr_.stroked = false;

    return this.rootEl_;
  };

  ShapeVirtualDom_.prototype.createShapeEl_ = function (path) {

    var W = 10;
    var H = 10;

    var rootEl_ = createVMLElement('shape');
    rootEl_.style.cssText = ['position:absolute;width:', W, 'px;height:', H, 'px'].join('');
    rootEl_.coordorigin = '0 0';
    rootEl_.coordsize = Z * W + ' ' + Z * H;

    rootEl_.filled = 'false';
    rootEl_.stroked = 'false';

    this.rootEl_ = rootEl_;
  };

  ShapeVirtualDom_.prototype.isFilled = function () {
    return this.attr_.filled;
  };

  ShapeVirtualDom_.prototype.isStroked = function () {
    return this.attr_.stroked;
  };

  ShapeVirtualDom_.prototype.fill = function(ctx, min, max) {
    var attr_ = this.attr_;

    attr_.filled = true;
    attr_.fillStyle = ctx.fillStyle;
    attr_.globalAlpha = ctx.globalAlpha;

    attr_.x = ctx.x_;
    attr_.y = ctx.y_;

    if (ctx.fillStyle instanceof CanvasGradient_) {
      attr_.m_ = ctx.m_;
      attr_.scaleX = ctx.scaleX_;
      attr_.scaleY = ctx.scaleY_;
      attr_.min = min;
      attr_.max = max;
    } else if (ctx.fillStyle instanceof CanvasPattern_) {
      attr_.scaleX = ctx.scaleX_;
      attr_.scaleY = ctx.scaleY_;
      attr_.min = min;
      attr_.max = max;
    }
  };

  ShapeVirtualDom_.prototype.stroke = function (ctx) {
    var attr_ = this.attr_;

    attr_.stroked = true;
    attr_.globalAlpha = ctx.globalAlpha;
    attr_.lineCap = ctx.lineCap;
    attr_.lineJoin = ctx.lineJoin;
    attr_.lineWidth = ctx.lineWidth * ctx.lineScale_;
    attr_.miterlimit = ctx.miterlimit;
    attr_.strokeStyle = ctx.strokeStyle;

    attr_.x = ctx.x_;
    attr_.y = ctx.y_;
  }

  ShapeVirtualDom_.prototype.doFill_ = function () {
    var attr_ = this.attr_;
    var attrPrev_ = this.attrPrev_;
    if (attr_.filled !== attrPrev_.filled) {
      var rootEl_ = this.rootEl_;
      if (attr_.filled) {
        rootEl_.filled = 'true';
        if (!this.fillEl_) {
          this.fillEl_ = createVMLElement('fill');
          // PENDING 
          // Set default attribute ?
        }
        rootEl_.appendChild(this.fillEl_);
      } else {
        rootEl_.filled = 'false';
        if (this.fillEl_) {
          rootEl_.removeChild(this.fillEl_);
        }
      }
    }
    if (!attr_.filled) {
      return;
    }

    var fillEl_ = this.fillEl_;

    var fillStyle = attr_.fillStyle;

    if (
      fillStyle !== attrPrev_.fillStyle || 
      attr_.globalAlpha !== attrPrev_.globalAlpha
    ) {
      // TODO Canvas gradient and pattern still not be optimized
      // There problem when canvas gradient add color stop dynamically
      // 
      // Text fill doesn't support Gradient or Pattern
      if ((fillStyle instanceof CanvasGradient_) && attr_.min) {
        // TODO: Gradients transformed with the transformation matrix.
        var angle = 0;
        var focus = {x: 0, y: 0};

        // additional offset
        var shift = 0;
        // scale factor for offset
        var expansion = 1;

        var scaleX = attr_.scaleX_;
        var scaleY = attr_.scaleY_;
        var min = attr_.min;
        var max = attr_.max;
        var width = max.x - min.x;
        var height = max.y - min.y;

        if (fillStyle.type_ == 'gradient') {
          var x0 = fillStyle.x0_ / scaleX;
          var y0 = fillStyle.y0_ / scaleY;
          var x1 = fillStyle.x1_ / scaleX;
          var y1 = fillStyle.y1_ / scaleY;
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

          width /= scaleX * Z;
          height /= scaleY * Z;
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
        var opacity1 = stops[0].alpha * attr_.globalAlpha;
        var opacity2 = stops[length - 1].alpha * attr_.globalAlpha;

        var colors = [];
        for (var i = 0; i < length; i++) {
          var stop = stops[i];
          colors.push(stop.offset * expansion + shift + ' ' + stop.color);
        }

        fillEl_.type = fillStyle.type_;
        fillEl_.method = 'none';
        fillEl_.focus = '100%';
        fillEl_.color = color1;
        fillEl_.color2 = color2;
        fillEl_.colors = colors.join(',');
        fillEl_.opacity = opacity2;
        fillEl_.setAttribute('g_o_:opacity2', opacity1);
        fillEl_.angle = angle;
        fillEl_.focusposition = focus.x + ',' + focus.y;
      }
      else if ((fillStyle instanceof CanvasPattern_) && attr_.min) {
        if (width && height) {
          var deltaLeft = -attr_.min.x;
          var deltaTop = -attr_.min.y;
          fillEl_.position = deltaLeft / width * scaleX * scaleX + ',' +
            deltaTop / height * scaleY * scaleY;
          fillEl_.type = 'tile';
          fillEl_.src = fillStyle.src_;
        }
      }
      else {
        var a = processStyle(fillStyle);
        var color = a.color;
        var opacity = a.alpha * attr_.globalAlpha;
        fillEl_.color = color;
        if (opacity < 1) {
          fillEl_.opacity = opacity;
        }
      }
    }
  };

  ShapeVirtualDom_.prototype.doStroke_ = function () {
    var attr_ = this.attr_;
    var attrPrev_ = this.attrPrev_;
    if (attr_.stroked !== attrPrev_.stroked) {
      var rootEl_ = this.rootEl_;
      if (attr_.stroked) {
        if (!this.strokeEl_) {
          this.strokeEl_ = createVMLElement('stroke');
          // PENDING 
          // Set default attribute ?
        }
        rootEl_.stroked = 'true';
        rootEl_.appendChild(this.strokeEl_);
      } else {
        rootEl_.stroked = 'false';
        if (this.strokeEl_) {
          rootEl_.removeChild(this.strokeEl_);
        }
      }
    }

    if (!attr_.stroked) {
      return;
    }

    if (
      attr_.strokeStyle !== attrPrev_.strokeStyle ||
      attr_.globalAlpha !== attrPrev_.globalAlpha ||
      attr_.lineWidth !== attrPrev_.lineWidth
    ) {
      var a = processStyle(attr_.strokeStyle);
      var opacity = a.alpha * attr_.globalAlpha;
      var lineWidth = attr_.lineWidth;
      // VML cannot correctly render a line if the width is less than 1px.
      // In that case, we dilute the color to make the line look thinner.
      if (lineWidth < 1) {
        opacity *= lineWidth;
      }
      if (opacity < 1) {
        this.strokeEl_.opacity = opacity;
      }
      this.strokeEl_.color = a.color;
    }
    if (attr_.lineJoin !== attrPrev_.lineJoin) {
      this.strokeEl_.joinstyle = attr_.lineJoin;
    }
    if (attr_.miterLimit !== attrPrev_.miterLimit) {
      this.strokeEl_.miterlimit = attr_.miterLimit;
    }
    if (attr_.lineCap !== attrPrev_.lineCap) {
      this.strokeEl_.endcap = processLineCap(attr_.lineCap);
    }
    if (lineWidth !== attrPrev_.lineWidth) {
      this.strokeEl_.weight = lineWidth + 'px';
    }
  };

  ShapeVirtualDom_.prototype.flush = function (ctx) {
    var attr_ = this.attr_;
    var attrPrev_ = this.attrPrev_;
    if (attr_.x !== attrPrev_.x) {
      this.rootEl_.style.left = attr_.x + 'px';
    }
    if (attr_.y !== attrPrev_.y) {
      this.rootEl_.style.top = attr_.y + 'px';
    }
    if (attr_.path !== attrPrev_.path) {
      this.rootEl_.path = attr_.path;
    }
    this.doFill_();
    this.doStroke_();

    copyShapeAttr(attrPrev_, attr_);
  }

  /**
   * Virtual text dom is created by fillText and strokeText operation.
   * It will be cached in Context2D object. And created only if needed when redrawing
   * @author https://github.com/pissang/
   */
  function TextVirtualDom_() {
    // this.rootEl_ = null;
    // this.skewEl_ = null;
    // this.textPathEl_ = null;
    // this.simpleRootEl_ = null;

    this.attr_ = createTextAttr();
    this.attrPrev_ = {};
  }

  TextVirtualDom_.prototype.getElement = function (ctx, text, x, y, maxWidth, stroke) {
    if (!this.rootEl_) {
      this.createEl_();
    }
    var m_ = ctx.m_;

    var attr_ = this.attr_;
    attr_.text = text;

    attr_.sx = x;
    attr_.sy = y;
    attr_.maxWidth = maxWidth;
    attr_.textAlign = ctx.textAlign;
    attr_.textBaseline = ctx.textBaseline;

    attr_.stroked = !!stroke;
    attr_.filled = !stroke;

    var fontStyle = getComputedStyle(processFontStyle(ctx.font),
                                       ctx.element_);
    var fontStyleString = buildStyle(fontStyle);

    attr_.font = fontStyleString;

    var offset = {x: 0, y: 0};
    // 1.75 is an arbitrary number, as there is no info about the text baseline
    switch (ctx.textBaseline) {
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

    var d = getCoords(ctx, x + offset.x, y + offset.y);
    attr_.offX = d.x;
    attr_.offY = d.y;
    // attr_.skewed = isNotAroundZero(m_[0] - 1) || isNotAroundZero(m_[1]) ||
        // isNotAroundZero(m_[3] - 1) || isNotAroundZero(m_[2])
    attr_.skewM = m_[0][0].toFixed(3) + ',' + m_[1][0].toFixed(3) + ',' +
                m_[0][1].toFixed(3) + ',' + m_[1][1].toFixed(3);

    if (stroke) {
      attr_.globalAlpha = ctx.globalAlpha;
      attr_.lineCap = ctx.lineCap;
      attr_.lineJoin = ctx.lineJoin;
      attr_.lineWidth = ctx.lineWidth * ctx.lineScale_;
      attr_.miterlimit = ctx.miterlimit;
      attr_.strokeStyle = ctx.strokeStyle;
    } else {
      attr_.fillStyle = ctx.fillStyle;
      attr_.globalAlpha = ctx.globalAlpha; 
    }
    // TODO It is strange that flush after the rootEl has been appended to document
    // SkewOffset like '10, 10'(which one item is not zero) will cause the shape disappeared.
    this.flush(ctx);

    return this.rootEl_;
  };

  TextVirtualDom_.prototype.createEl_ = function () {
    var W = 10;
    var H = 10;
    this.rootEl_ = createVMLElement('line');
    var rootEl_ = this.rootEl_;
    rootEl_.coordsize = Z * W + ' ' + Z * H;
    rootEl_.coordorigin = '0 0';
    rootEl_.style.cssText = 'position:absolute;width:1px;height:1px';
    rootEl_.stroked = 'false';
    rootEl_.filled = 'false';
  };

  TextVirtualDom_.prototype.flush = function (ctx) {
    var m_ = ctx.m_;
    var delta = 1000;
    var left = 0;
    var right = delta;
    var attr_ = this.attr_;
    var attrPrev_ = this.attrPrev_;
    var rootEl_ = this.rootEl_;

    if (!this.skewEl_) {
      this.skewEl_ = createVMLElement('skew');
      this.skewEl_.on = 't';
      this.textPathEl_ = createVMLElement('textpath');
      this.pathEl_ = createVMLElement('path');
      this.pathEl_.textpathok = 'true';
      this.textPathEl_.on = 'true';

      rootEl_.appendChild(this.skewEl_);
      rootEl_.appendChild(this.pathEl_);
      rootEl_.appendChild(this.textPathEl_);
    }

    var fontStyle = getComputedStyle(processFontStyle(this.attr_.font),
                                       ctx.element_);
    if (
      attr_.font !== attrPrev_.font ||
      attr_.text !== attrPrev_.text
    ) {
      this.textPathEl_.string = encodeHtmlAttribute(attr_.text);
      this.textPathEl_.style.font = encodeHtmlAttribute(attr_.font);
    }

    if (attr_.textAlign !== attrPrev_.textAlign) {
      var elementStyle = ctx.element_.currentStyle;
      var textAlign = attr_.textAlign.toLowerCase();
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
      switch(textAlign) {
        case 'right':
          left = delta;
          right = 0.05;
          break;
        case 'center':
          left = right = delta / 2;
          break;
      }
      rootEl_.from = -left + ' 0';
      rootEl_.to = right + ' 0.05';
      this.skewEl_.origin = left + ' 0';
      this.textPathEl_.style['v-text-align'] = textAlign;
    }

    // if (attr_.skewed || stroke) {
    if (attr_.skewM !== attrPrev_.skewM) {
      this.skewEl_.matrix = attr_.skewM + ',0,0';
    }

    if (attr_.offX !== attrPrev_.offX || 
      attr_.offY !== attrPrev_.offY
    ) {
      var skewOffset = mr(attr_.offX / Z) + ',' + mr(attr_.offY / Z);
      this.skewEl_.offset = skewOffset;
    }
    
    if (attr_.stroked) {
      this.doStroke_();
    } else {
      this.doFill_();
    }

    copyTextAttr(attrPrev_, attr_);

    // } else {
    //   if (!this.simpleRootEl_) {
    //     this.simpleRootEl_ = document.createElement('div');
    //     this.simpleRootEl_.style.position = 'absolute';
    //   }
    //   this.simpleRootEl_.style.font = encodeHtmlAttribute(fontStyleString);

    //   var a = processStyle(ctx.fillStyle);
    //   var color = a.color;
    //   var opacity = a.alpha * ctx.globalAlpha;
    //   this.simpleRootEl_.style.color = color;
    //   if (opacity < 1) {
    //     this.simpleRootEl_.style.filter = 'alpha(opacity=' + mr(opacity * 100) +')';
    //   }

    //   this.simpleRootEl_.innerHTML = text;

    //   switch (ctx.textBaseline) {
    //     case 'hanging':
    //     case 'top':
    //       this.simpleRootEl_.style.top = m_[2][1] + y + 'px';
    //       break;
    //     case 'middle':
    //       // TODO
    //       this.simpleRootEl_.style.top = m_[2][1] + y - fontStyle.size / 2.25 + 'px';
    //       break;
    //     default:
    //     case null:
    //     case 'alphabetic':
    //     case 'ideographic':
    //     case 'bottom':
    //     //
    //       this.simpleRootEl_.style.bottom = ctx.element_.clientHeight - m_[2][1] - y + 'px';
    //       break;
    //   }

    //   switch(textAlign) {
    //     case 'right':
    //       this.simpleRootEl_.style.right = ctx.element_.clientWidth - m_[2][0] - x + 'px';
    //       break;
    //     case 'center':
    //       // TODO
    //       this.simpleRootEl_.style.left = m_[2][0] + x - fontStyle.size / 4.5 * text.length + 'px';
    //       break;
    //     case 'left':
    //       this.simpleRootEl_.style.left = m_[2][0] + x + 'px';
    //       break;
    //   }
    //   return this.simpleRootEl_;
    // }
  }

  TextVirtualDom_.prototype.doFill_ = ShapeVirtualDom_.prototype.doFill_;
  TextVirtualDom_.prototype.doStroke_ = ShapeVirtualDom_.prototype.doStroke_;
  TextVirtualDom_.prototype.attachTo = ShapeVirtualDom_.prototype.attachTo;
  TextVirtualDom_.prototype.detach = ShapeVirtualDom_.prototype.detach;

  /**
   * Virtual image dom is created by drawImage operation.
   * It will be cached in Context2D object. And created only if needed when redrawing
   * @author https://github.com/pissang/
   *
   * TODO Image cropping testing
   */
  function ImageVirtualDom_() {
    // this.rootEl_ = null;
    // this.cropEl_ = null;
    // this.imageEl_ = null;
    // this.groupEl_ = null;

    this.attr_ = createImageAttr();

    this.attrPrev_ = {};
  };

  ImageVirtualDom_.prototype.getElement = function (ctx, image, var_args) {
    var dx, dy, dw, dh, sx, sy, sw, sh;

    // to find the original width we overide the width and height
    var oldRuntimeWidth = image.runtimeStyle.width;
    var oldRuntimeHeight = image.runtimeStyle.height;
    var m_ = ctx.m_;
    image.runtimeStyle.width = 'auto';
    image.runtimeStyle.height = 'auto';

    // get the original size
    var w = image.width;
    var h = image.height;

    // and remove overides
    image.runtimeStyle.width = oldRuntimeWidth;
    image.runtimeStyle.height = oldRuntimeHeight;

    var args = Array.prototype.slice.call(arguments, 1);
    var attr_ = this.attr_;
    attr_.globalAlpha = ctx.globalAlpha;

    var scaleX = ctx.scaleX_;
    var scaleY = ctx.scaleY_;
    if (args.length == 3) {
      dx = args[1];
      dy = args[2];
      sx = sy = 0;
      sw = dw = w;
      sh = dh = h;
    } else if (args.length == 5) {
      dx = args[1];
      dy = args[2];
      dw = args[3];
      dh = args[4];
      sx = sy = 0;
      sw = w;
      sh = h;
    } else if (args.length == 9) {
      sx = args[1];
      sy = args[2];
      sw = args[3];
      sh = args[4];
      dx = args[5];
      dy = args[6];
      dw = args[7];
      dh = args[8];
    } else {
      throw Error('Invalid number of arguments');
    }

    // Have rotation
    attr_.skewed = m_[0][1] || m_[1][0];

    if (attr_.skewed) {
      var d = getCoords(ctx, dx, dy);
      attr_.x = d.x;
      attr_.y = d.y;
      var filter = [];
      filter.push('M11=', m_[0][0] / scaleX, ',',
                  'M12=', m_[1][0] / scaleY, ',',
                  'M21=', m_[0][1] / scaleX, ',',
                  'M22=', m_[1][1] / scaleY, ',',
                  'Dx=', d.x, ',',
                  'Dy=', d.y, '');
      attr_.skewM = filter.join('');

      // Bounding box calculation (need to minimize displayed area so that
      // filters don't waste time on unused pixels.
      var max = d;
      var c2 = getCoords(ctx, dx + dw, dy);
      var c3 = getCoords(ctx, dx, dy + dh);
      var c4 = getCoords(ctx, dx + dw, dy + dh);

      max.x = m.max(max.x, c2.x, c3.x, c4.x);
      max.y = m.max(max.y, c2.y, c3.y, c4.y);

      attr_.padding = [0, Math.max(mr(max.x / Z), 0) + 'px', Math.max(mr(max.y / Z), 0) + 'px', 0].join(' ');
    } else {
      attr_.x = dx * scaleX + ctx.x_;
      attr_.y = dy * scaleY + ctx.y_;
    }

    attr_.cropped = sx || sy;
    if (attr_.cropped) {
      attr_.cropWidth = Math.ceil((dw + sx * dw / sw) * scaleX);
      attr_.cropHeight = Math.ceil((dh + sy * dh / sh) * scaleY);
      attr_.cropFilter = 'progid:DxImageTransform.Microsoft.Matrix(Dx='
          + -dw / sw * scaleX * sx + ',Dy=' + -dh / sh * scaleY * sy + ')';
    }

    attr_.width = scaleX * dw / sw * w;
    attr_.height = scaleY * dh / sh * h;

    attr_.image = image.src;

    if (!this.imageEl_) {
      // NOTES
      // Matrix of rootDom will not work if imageDom.style.position = 'absolute'
      this.imageEl_ = document.createElement('img');
    }

    if (!(attr_.skewed || attr_.cropped)) {
      this.rootEl_ = this.imageEl_;
    } else if (attr_.skewed) {
      if (!this.groupEl_) {
        this.createGroupEl_();
      }
      this.rootEl_ = this.groupEl_;
    } else {
      if (!this.cropEl_) {
        this.cropEl_ = document.createElement('div');
        this.cropEl_.style.cssText = 'position:absolute; overflow:hidden;';
      }
      this.rootEl_ = this.cropEl_;
    }

    this.flush(ctx);
    return this.rootEl_;
  };

  ImageVirtualDom_.prototype.createGroupEl_ = function () {
    var W = 10;
    var H = 10;

    // For some reason that I've now forgotten, using divs didn't work
    this.groupEl_ = createVMLElement('group');
    this.groupEl_.coordsize = Z * W + ' ' + Z * H;
    this.groupEl_.coordorigin = '0 0';

    this.groupEl_.style.cssText = ['position:absolute;width:', W, 'px;height:', H, 'px'].join('');
  }

  ImageVirtualDom_.prototype.flush = function (ctx) {
    var attr_ = this.attr_;
    var attrPrev_ = this.attrPrev_;
    var w2 = attr_.sw / 2;
    var h2 = attr_.sh / 2;

    var imageEl_ = this.imageEl_;

    // If filters are necessary (rotation exists), create them
    // filters are bog-slow, so only create them if abbsolutely necessary
    // The following check doesn't account for skews (which don't exist
    // in the canvas spec (yet) anyway.
    if (!attr_.skewed && !attr_.cropped) {
      if (attr_.x !== attrPrev_.x) {
        imageEl_.style.left = attr_.x + 'px';
      }
      if (attr_.y !== attrPrev_.y) {
        imageEl_.style.top = attr_.y + 'px';
      }
      if (!attrPrev_.skewed) {
        imageEl_.style.position = 'absolute';
      } else {
        imageEl_.style.position = 'static';
      }
    } else if (attr_.skewed) {
      var groupEl_ = this.groupEl_;
      if (attr_.padding !== attrPrev_.padding) {
        groupEl_.style.padding = attr_.padding;
      }

      if (attr_.skewM !== attrPrev_.skewM) {
        groupEl_.style.filter = 'progid:DXImageTransform.Microsoft.Matrix('
          + attr_.skewM + ", SizingMethod='clip')";
      }

      if (attr_.cropped) {
        if (!attrPrev_.cropped) {
          groupEl_.appendChild(this.cropEl_);
          this.cropEl_.appendChild(imageEl_);
        }
      } else {
        if (!attrPrev_.skewed) {
          groupEl_.appendChild(imageEl_);
        }
      }
    } else if (attr_.cropped) {
      if (!attrPrev_.cropped) {
        this.cropEl_.appendChild(imageEl_);
      }
    }

    // Draw a special cropping div if needed
    if (attr_.cropped) {
      var groupEl_ = this.groupEl_;
      if (attr_.cropWidth !== attrPrev_.cropWidth) {
        this.cropEl_.style.width = attr_.cropWidth + 'px';
      }
      if (attr_.cropHeight !== attrPrev_.cropHeight) {
        this.cropEl_.style.height = attr_.cropHeight + 'px';
      }
      if (attr_.filter !== attrPrev_.filter) {
        this.cropEl_.style.filter = attr_.filter;
      }
    }

    if (attr_.width !== attrPrev_.width) {
      imageEl_.style.width = attr_.width + 'px';
    }
    if (attr_.height !== attrPrev_.height) {
      imageEl_.style.height = attr_.height + 'px';
    }

    if (attr_.image !== attrPrev_.image) {
      imageEl_.src = attr_.image;
    }
    if (attr_.globalAlpha !== attrPrev_.globalAlpha) {
      if (imageEl_.style.globalAlpha < 1) {
        imageEl_.style.filter = 'alpha(opacity=' + mr(attr_.globalAlpha * 100) +')';
      } else {
        imageEl_.style.filter = '';
      }
    }

    copyImageAttr(this.attrPrev_, this.attr_);
  }

  ImageVirtualDom_.prototype.attachTo = ShapeVirtualDom_.prototype.attachTo;
  ImageVirtualDom_.prototype.detach = ShapeVirtualDom_.prototype.detach;

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

    // NOTES
    // http://louisremi.com/2009/03/30/changes-in-vml-for-ie8-or-what-feature-can-the-ie-dev-team-break-for-you-today/
    // It is no longer possible to create a VML element outside of the DOM
    // this.fragment_ = document.createDocumentFragment();
    
    // Keep current drawed dom. So we can merge fill and stroke in one shape dom
    this.currentVirtualDom_ = null;

    // Cache the created dom
    this.shapeVDomList_ = [];
    this.textVDomList_ = [];
    this.imageVDomList_ = [];

    this.nShapeVEl_ = 0;
    this.nTextVEl_ = 0;
    this.nImageVEl_ = 0;

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

    this.ghost_ = document.createElement('div');
    var cssText = 'position:absolute; left:0px; right: 0px; top: 0px; bottom: 0px;';
    this.ghost_.style.cssText = cssText;

    this.element_.appendChild(this.ghost_);

    this.x_ = 0;
    this.y_ = 0;
  }

  var contextPrototype = CanvasRenderingContext2D_.prototype;
  contextPrototype.clearRect = function() {
    if (this.textMeasureEl_) {
      this.textMeasureEl_.removeNode(true);
      this.textMeasureEl_ = null;
    }
    // var ghost_ = this.ghost_;
    // Hide everything
    this.ghost_.style.display = 'none';
    // NOTES: Using innerHTML = '' will cause all descendant elements detached
    // while (ghost_.firstChild) {
    //   ghost_.removeChild(ghost_.firstChild);
    // }
    // NOTES: removeChild in IE8 will not set the parentNode to null
    // 
    // TODO Remove ghost element before change the attributes of children each frame is even more slow
    // if (ghost_.parentNode === this.element_) {
    //   this.element_.removeChild(ghost_);
    // }
    this.currentVirtualDom_ = null;

    this.nShapeVEl_ = 0;
    this.nTextVEl_ = 0;
    this.nImageVEl_ = 0;
  };

  contextPrototype.flush = function () {
    for (var i = 0; i < this.nShapeVEl_; i++) {
      this.shapeVDomList_[i].flush(this);
    }
    // Show everything
    this.ghost_.style.display = 'block';

    for (var i = this.nShapeVEl_, len = this.shapeVDomList_.length; i < len; i++) {
      this.shapeVDomList_[i].detach();
    }
    for (var i = this.nImageVEl_, len = this.imageVDomList_.length; i < len; i++) {
      this.imageVDomList_[i].detach();
    }
    for (var i = this.nTextVEl_, len = this.textVDomList_.length; i < len; i++) {
      this.textVDomList_[i].detach();
    }
    this.shapeVDomList_.length = this.nShapeVEl_;
    this.imageVDomList_.length = this.nImageVEl_;
    this.textVDomList_.length = this.nTextVEl_;

    // this.element_.appendChild(this.ghost_);
  }

  contextPrototype.beginPath = function() {
    // TODO: Branch current matrix so that save/restore has no effect
    //       as per safari docs.
    this.currentPath_ = [];

    this.currentVirtualDom_ = null;
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

    this.currentVirtualDom_ = null;
  };

  contextPrototype.bezierCurveTo = function(aCP1x, aCP1y,
                                            aCP2x, aCP2y,
                                            aX, aY) {
    var p = getSkewedCoords(this, aX, aY);
    var cp1 = getSkewedCoords(this, aCP1x, aCP1y);
    var cp2 = getSkewedCoords(this, aCP2x, aCP2y);
    bezierCurveTo(this, cp1, cp2, p);

    this.currentVirtualDom_ = null;
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

    this.currentVirtualDom_ = null;
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

    this.currentVirtualDom_ = null;
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


    this.currentVirtualDom_ = null;
  };

  contextPrototype.rect = function(aX, aY, aWidth, aHeight) {
    this.moveTo(aX, aY);
    this.lineTo(aX + aWidth, aY);
    this.lineTo(aX + aWidth, aY + aHeight);
    this.lineTo(aX, aY + aHeight);
    this.closePath();

    this.currentVirtualDom_ = null;
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

    var vDom = this.imageVDomList_[this.nImageVEl_];
    if (!vDom) {
      vDom = new ImageVirtualDom_();
      this.imageVDomList_[this.nImageVEl_] = vDom;
    }
    this.nImageVEl_++;
    var args = Array.prototype.slice.call(arguments);
    args.unshift(this);
    var el = vDom.getElement.apply(vDom, args);
    
    vDom.attachTo(this.ghost_);

    this.currentVirtualDom_ = null;
  };

  contextPrototype.stroke = function(aFill) {
    if (this.currentVirtualDom_) {
      // Simply append fill or stroke dom
      if (aFill && !this.currentVirtualDom_.isFilled()) {
        this.currentVirtualDom_.fill(this);
      } else if (!aFill && !this.currentVirtualDom_.isStroked()) {
        this.currentVirtualDom_.stroke(this);
      }

      return;
    }

    var pathStr = [];

    var min = {x: null, y: null};
    var max = {x: null, y: null};

    for (var i = 0; i < this.currentPath_.length; i++) {
      var p = this.currentPath_[i];
      var c;

      switch (p.type) {
        case 'moveTo':
          c = p;
          pathStr.push(' m ', mr(p.x), ',', mr(p.y));
          break;
        case 'lineTo':
          pathStr.push(' l ', mr(p.x), ',', mr(p.y));
          break;
        case 'close':
          pathStr.push(' x ');
          p = null;
          break;
        case 'bezierCurveTo':
          pathStr.push(' c ',
                       mr(p.cp1x), ',', mr(p.cp1y), ',',
                       mr(p.cp2x), ',', mr(p.cp2y), ',',
                       mr(p.x), ',', mr(p.y));
          break;
        case 'at':
        case 'wa':
          pathStr.push(' ', p.type, ' ',
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

    pathStr = pathStr.join('');

    var vDom = this.shapeVDomList_[this.nShapeVEl_];
    if (!vDom) {
      vDom = new ShapeVirtualDom_();
      this.shapeVDomList_[this.nShapeVEl_] = vDom;
    }
    this.nShapeVEl_++;

    var shapeEl = vDom.getElement(pathStr, this.x_, this.y_);
    aFill ? vDom.fill(this, min, max) : vDom.stroke(this);

    vDom.attachTo(this.ghost_);

    this.currentVirtualDom_ = vDom;

    return shapeEl;
  };

  contextPrototype.fill = function() {
    return this.stroke(true);
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

  function getSkewedCoords(ctx, aX, aY) {
    var m = ctx.m_;
    return {
      x: Z * (aX * m[0][0] + aY * m[1][0]) - Z2,
      y: Z * (aX * m[0][1] + aY * m[1][1]) - Z2
    };
  }

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
    
    var vDom = this.textVDomList_[this.nTextVEl_];
    if (!vDom) {
      vDom = new TextVirtualDom_();
      this.textVDomList_[this.nTextVEl_] = vDom;
    }
    this.nTextVEl_++;

    var el = vDom.getElement(this, text, x, y, maxWidth, stroke);
    
    vDom.attachTo(this.ghost_);
    
    this.currentVirtualDom_ = null;
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL2RlcC9leGNhbnZhczIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMDYgR29vZ2xlIEluYy5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuXG5cbi8vIEtub3duIElzc3Vlczpcbi8vXG4vLyAqIFBhdHRlcm5zIG9ubHkgc3VwcG9ydCByZXBlYXQuXG4vLyAqIFJhZGlhbCBncmFkaWVudCBhcmUgbm90IGltcGxlbWVudGVkLiBUaGUgVk1MIHZlcnNpb24gb2YgdGhlc2UgbG9vayB2ZXJ5XG4vLyAgIGRpZmZlcmVudCBmcm9tIHRoZSBjYW52YXMgb25lLlxuLy8gKiBDbGlwcGluZyBwYXRocyBhcmUgbm90IGltcGxlbWVudGVkLlxuLy8gKiBDb29yZHNpemUuIFRoZSB3aWR0aCBhbmQgaGVpZ2h0IGF0dHJpYnV0ZSBoYXZlIGhpZ2hlciBwcmlvcml0eSB0aGFuIHRoZVxuLy8gICB3aWR0aCBhbmQgaGVpZ2h0IHN0eWxlIHZhbHVlcyB3aGljaCBpc24ndCBjb3JyZWN0LlxuLy8gKiBQYWludGluZyBtb2RlIGlzbid0IGltcGxlbWVudGVkLlxuLy8gKiBDYW52YXMgd2lkdGgvaGVpZ2h0IHNob3VsZCBpcyB1c2luZyBjb250ZW50LWJveCBieSBkZWZhdWx0LiBJRSBpblxuLy8gICBRdWlya3MgbW9kZSB3aWxsIGRyYXcgdGhlIGNhbnZhcyB1c2luZyBib3JkZXItYm94LiBFaXRoZXIgY2hhbmdlIHlvdXJcbi8vICAgZG9jdHlwZSB0byBIVE1MNVxuLy8gICAoaHR0cDovL3d3dy53aGF0d2cub3JnL3NwZWNzL3dlYi1hcHBzL2N1cnJlbnQtd29yay8jdGhlLWRvY3R5cGUpXG4vLyAgIG9yIHVzZSBCb3ggU2l6aW5nIEJlaGF2aW9yIGZyb20gV2ViRlhcbi8vICAgKGh0dHA6Ly93ZWJmeC5lYWUubmV0L2RodG1sL2JveHNpemluZy9ib3hzaXppbmcuaHRtbClcbi8vICogTm9uIHVuaWZvcm0gc2NhbGluZyBkb2VzIG5vdCBjb3JyZWN0bHkgc2NhbGUgc3Ryb2tlcy5cbi8vICogT3B0aW1pemUuIFRoZXJlIGlzIGFsd2F5cyByb29tIGZvciBzcGVlZCBpbXByb3ZlbWVudHMuXG5cbi8vIEFNRCBieSBrZW5lci5saW5mZW5nQGdtYWlsLmNvbVxuLy8gT3B0aW1pemVkIGJ5IGh0dHBzOi8vZ2l0aHViLmNvbS9waXNzYW5nXG4vLyBcbi8vIE5PVEVTIGh0dHA6Ly9qc3BlcmYuY29tL2RvbS1hdHRyLXJlYWQtcGVyZi8yXG4vLyBodHRwOi8vanNwZXJmLmNvbS9hcnItdnMtb2JqLWluLWllXG5kZWZpbmUoZnVuY3Rpb24ocmVxdWlyZSkge1xuICAgIFxuLy8gT25seSBhZGQgdGhpcyBjb2RlIGlmIHdlIGRvIG5vdCBhbHJlYWR5IGhhdmUgYSBjYW52YXMgaW1wbGVtZW50YXRpb25cbmlmICghZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJykuZ2V0Q29udGV4dCkge1xuXG4oZnVuY3Rpb24oKSB7XG5cbiAgLy8gYWxpYXMgc29tZSBmdW5jdGlvbnMgdG8gbWFrZSAoY29tcGlsZWQpIGNvZGUgc2hvcnRlclxuICB2YXIgbSA9IE1hdGg7XG4gIHZhciBtciA9IG0ucm91bmQ7XG4gIHZhciBtcyA9IG0uc2luO1xuICB2YXIgbWMgPSBtLmNvcztcbiAgdmFyIGFicyA9IG0uYWJzO1xuICB2YXIgc3FydCA9IG0uc3FydDtcblxuICAvLyB0aGlzIGlzIHVzZWQgZm9yIHN1YiBwaXhlbCBwcmVjaXNpb25cbiAgdmFyIFogPSAxMDtcbiAgdmFyIFoyID0gWiAvIDI7XG5cbiAgdmFyIElFX1ZFUlNJT04gPSArbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvTVNJRSAoW1xcZC5dKyk/LylbMV07XG5cbiAgdmFyIEVQU0lMT04gPSAxZS01O1xuICB2YXIgaXNBcm91bmRaZXJvID0gZnVuY3Rpb24gKHZhbCkge1xuICAgICAgcmV0dXJuIHZhbCA+IC1FUFNJTE9OICYmIHZhbCA8IEVQU0lMT047XG4gIH1cbiAgZnVuY3Rpb24gaXNOb3RBcm91bmRaZXJvKHZhbCkge1xuICAgICAgcmV0dXJuIHZhbCA+IEVQU0lMT04gfHwgdmFsIDwgLUVQU0lMT047XG4gIH1cblxuICAvKipcbiAgICogVGhpcyBmdW50aW9uIGlzIGFzc2lnbmVkIHRvIHRoZSA8Y2FudmFzPiBlbGVtZW50cyBhcyBlbGVtZW50LmdldENvbnRleHQoKS5cbiAgICogQHRoaXMge0hUTUxFbGVtZW50fVxuICAgKiBAcmV0dXJuIHtDYW52YXNSZW5kZXJpbmdDb250ZXh0MkRffVxuICAgKi9cbiAgZnVuY3Rpb24gZ2V0Q29udGV4dCgpIHtcbiAgICByZXR1cm4gdGhpcy5jb250ZXh0XyB8fFxuICAgICAgICAodGhpcy5jb250ZXh0XyA9IG5ldyBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkRfKHRoaXMpKTtcbiAgfVxuXG4gIHZhciBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcblxuICAvKipcbiAgICogQmluZHMgYSBmdW5jdGlvbiB0byBhbiBvYmplY3QuIFRoZSByZXR1cm5lZCBmdW5jdGlvbiB3aWxsIGFsd2F5cyB1c2UgdGhlXG4gICAqIHBhc3NlZCBpbiB7QGNvZGUgb2JqfSBhcyB7QGNvZGUgdGhpc30uXG4gICAqXG4gICAqIEV4YW1wbGU6XG4gICAqXG4gICAqICAgZyA9IGJpbmQoZiwgb2JqLCBhLCBiKVxuICAgKiAgIGcoYywgZCkgLy8gd2lsbCBkbyBmLmNhbGwob2JqLCBhLCBiLCBjLCBkKVxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmIFRoZSBmdW5jdGlvbiB0byBiaW5kIHRoZSBvYmplY3QgdG9cbiAgICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRoYXQgc2hvdWxkIGFjdCBhcyB0aGlzIHdoZW4gdGhlIGZ1bmN0aW9uXG4gICAqICAgICBpcyBjYWxsZWRcbiAgICogQHBhcmFtIHsqfSB2YXJfYXJncyBSZXN0IGFyZ3VtZW50cyB0aGF0IHdpbGwgYmUgdXNlZCBhcyB0aGUgaW5pdGlhbFxuICAgKiAgICAgYXJndW1lbnRzIHdoZW4gdGhlIGZ1bmN0aW9uIGlzIGNhbGxlZFxuICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gQSBuZXcgZnVuY3Rpb24gdGhhdCBoYXMgYm91bmQgdGhpc1xuICAgKi9cbiAgZnVuY3Rpb24gYmluZChmLCBvYmosIHZhcl9hcmdzKSB7XG4gICAgdmFyIGEgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMik7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGYuYXBwbHkob2JqLCBhLmNvbmNhdChzbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gZW5jb2RlSHRtbEF0dHJpYnV0ZShzKSB7XG4gICAgcmV0dXJuIFN0cmluZyhzKS5yZXBsYWNlKC8mL2csICcmYW1wOycpLnJlcGxhY2UoL1wiL2csICcmcXVvdDsnKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFkZE5hbWVzcGFjZShkb2MsIHByZWZpeCwgdXJuKSB7XG4gICAgaWYgKCFkb2MubmFtZXNwYWNlc1twcmVmaXhdKSB7XG4gICAgICAvLyBOT1RFUywgSXQgd2lsbCBub3Qgd29yayBwcm9wbHkgaWYgYWRkICcjZGVmYXVsdCNWTUwnIFxuICAgICAgLy8gV2hlbiB1c2luZyBhcHBlbmRDaGlsZCB0byBhZGQgZG9tXG4gICAgICAvLyBkb2MubmFtZXNwYWNlcy5hZGQocHJlZml4LCB1cm4sICcjZGVmYXVsdCNWTUwnKTtcbiAgICAgIGRvYy5uYW1lc3BhY2VzLmFkZChwcmVmaXgsIHVybik7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gYWRkTmFtZXNwYWNlc0FuZFN0eWxlc2hlZXQoZG9jKSB7XG4gICAgYWRkTmFtZXNwYWNlKGRvYywgJ2dfdm1sXycsICd1cm46c2NoZW1hcy1taWNyb3NvZnQtY29tOnZtbCcpO1xuICAgIGFkZE5hbWVzcGFjZShkb2MsICdnX29fJywgJ3VybjpzY2hlbWFzLW1pY3Jvc29mdC1jb206b2ZmaWNlOm9mZmljZScpO1xuXG4gICAgLy8gU2V0dXAgZGVmYXVsdCBDU1MuICBPbmx5IGFkZCBvbmUgc3R5bGUgc2hlZXQgcGVyIGRvY3VtZW50XG4gICAgaWYgKCFkb2Muc3R5bGVTaGVldHNbJ2V4X2NhbnZhc18nXSkge1xuICAgICAgdmFyIHNzID0gZG9jLmNyZWF0ZVN0eWxlU2hlZXQoKTtcbiAgICAgIHNzLm93bmluZ0VsZW1lbnQuaWQgPSAnZXhfY2FudmFzXyc7XG4gICAgICBzcy5jc3NUZXh0ID0gJ2NhbnZhc3tkaXNwbGF5OmlubGluZS1ibG9jaztvdmVyZmxvdzpoaWRkZW47JyArXG4gICAgICAgICAgLy8gZGVmYXVsdCBzaXplIGlzIDMwMHgxNTAgaW4gR2Vja28gYW5kIE9wZXJhXG4gICAgICAgICAgJ3RleHQtYWxpZ246bGVmdDt3aWR0aDozMDBweDtoZWlnaHQ6MTUwcHh9IC5nX3ZtbF8ge2JlaGF2aW9yOnVybCgjZGVmYXVsdCNWTUwpO30nO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZVZNTEVsZW1lbnQodGFnTmFtZSkge1xuICAgIC8vIE5PVEVTIFdoeSB1c2luZyBjcmVhdGVFbGVtZW50IG5lZWRzIHRvIGFkZCBiZWhhdmlvcjp1cmwoI2RlZmF1bHQjVk1MKSBpbiBzdHlsZVxuICAgIHZhciBkb20gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCc8Z192bWxfOicgKyB0YWdOYW1lICsgJyBjbGFzcz1cImdfdm1sX1wiPicpO1xuICAgIHJldHVybiBkb207XG5cbiAgfVxuXG4gIC8vIEFkZCBuYW1lc3BhY2VzIGFuZCBzdHlsZXNoZWV0IGF0IHN0YXJ0dXAuXG4gIGFkZE5hbWVzcGFjZXNBbmRTdHlsZXNoZWV0KGRvY3VtZW50KTtcblxuICB2YXIgR192bWxDYW52YXNNYW5hZ2VyXyA9IHtcbiAgICBpbml0OiBmdW5jdGlvbihvcHRfZG9jKSB7XG4gICAgICB2YXIgZG9jID0gb3B0X2RvYyB8fCBkb2N1bWVudDtcbiAgICAgIC8vIENyZWF0ZSBhIGR1bW15IGVsZW1lbnQgc28gdGhhdCBJRSB3aWxsIGFsbG93IGNhbnZhcyBlbGVtZW50cyB0byBiZVxuICAgICAgLy8gcmVjb2duaXplZC5cbiAgICAgIGRvYy5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgIGRvYy5hdHRhY2hFdmVudCgnb25yZWFkeXN0YXRlY2hhbmdlJywgYmluZCh0aGlzLmluaXRfLCB0aGlzLCBkb2MpKTtcbiAgICB9LFxuXG4gICAgaW5pdF86IGZ1bmN0aW9uKGRvYykge1xuICAgICAgLy8gZmluZCBhbGwgY2FudmFzIGVsZW1lbnRzXG4gICAgICB2YXIgZWxzID0gZG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdjYW52YXMnKTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRoaXMuaW5pdEVsZW1lbnQoZWxzW2ldKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHVibGljIGluaXRpYWxpemVzIGEgY2FudmFzIGVsZW1lbnQgc28gdGhhdCBpdCBjYW4gYmUgdXNlZCBhcyBjYW52YXNcbiAgICAgKiBlbGVtZW50IGZyb20gbm93IG9uLiBUaGlzIGlzIGNhbGxlZCBhdXRvbWF0aWNhbGx5IGJlZm9yZSB0aGUgcGFnZSBpc1xuICAgICAqIGxvYWRlZCBidXQgaWYgeW91IGFyZSBjcmVhdGluZyBlbGVtZW50cyB1c2luZyBjcmVhdGVFbGVtZW50IHlvdSBuZWVkIHRvXG4gICAgICogbWFrZSBzdXJlIHRoaXMgaXMgY2FsbGVkIG9uIHRoZSBlbGVtZW50LlxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIFRoZSBjYW52YXMgZWxlbWVudCB0byBpbml0aWFsaXplLlxuICAgICAqIEByZXR1cm4ge0hUTUxFbGVtZW50fSB0aGUgZWxlbWVudCB0aGF0IHdhcyBjcmVhdGVkLlxuICAgICAqL1xuICAgIGluaXRFbGVtZW50OiBmdW5jdGlvbihlbCkge1xuICAgICAgaWYgKCFlbC5nZXRDb250ZXh0KSB7XG4gICAgICAgIGVsLmdldENvbnRleHQgPSBnZXRDb250ZXh0O1xuXG4gICAgICAgIC8vIEFkZCBuYW1lc3BhY2VzIGFuZCBzdHlsZXNoZWV0IHRvIGRvY3VtZW50IG9mIHRoZSBlbGVtZW50LlxuICAgICAgICBhZGROYW1lc3BhY2VzQW5kU3R5bGVzaGVldChlbC5vd25lckRvY3VtZW50KTtcblxuICAgICAgICAvLyBSZW1vdmUgZmFsbGJhY2sgY29udGVudC4gVGhlcmUgaXMgbm8gd2F5IHRvIGhpZGUgdGV4dCBub2RlcyBzbyB3ZVxuICAgICAgICAvLyBqdXN0IHJlbW92ZSBhbGwgY2hpbGROb2Rlcy4gV2UgY291bGQgaGlkZSBhbGwgZWxlbWVudHMgYW5kIHJlbW92ZVxuICAgICAgICAvLyB0ZXh0IG5vZGVzIGJ1dCB3aG8gcmVhbGx5IGNhcmVzIGFib3V0IHRoZSBmYWxsYmFjayBjb250ZW50LlxuICAgICAgICBlbC5pbm5lckhUTUwgPSAnJztcblxuICAgICAgICAvLyBkbyBub3QgdXNlIGlubGluZSBmdW5jdGlvbiBiZWNhdXNlIHRoYXQgd2lsbCBsZWFrIG1lbW9yeVxuICAgICAgICBlbC5hdHRhY2hFdmVudCgnb25wcm9wZXJ0eWNoYW5nZScsIG9uUHJvcGVydHlDaGFuZ2UpO1xuICAgICAgICBlbC5hdHRhY2hFdmVudCgnb25yZXNpemUnLCBvblJlc2l6ZSk7XG5cbiAgICAgICAgdmFyIGF0dHJzID0gZWwuYXR0cmlidXRlcztcbiAgICAgICAgaWYgKGF0dHJzLndpZHRoICYmIGF0dHJzLndpZHRoLnNwZWNpZmllZCkge1xuICAgICAgICAgIC8vIFRPRE86IHVzZSBydW50aW1lU3R5bGUgYW5kIGNvb3Jkc2l6ZVxuICAgICAgICAgIC8vIGVsLmdldENvbnRleHQoKS5zZXRXaWR0aF8oYXR0cnMud2lkdGgubm9kZVZhbHVlKTtcbiAgICAgICAgICBlbC5zdHlsZS53aWR0aCA9IGF0dHJzLndpZHRoLm5vZGVWYWx1ZSArICdweCc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZWwud2lkdGggPSBlbC5jbGllbnRXaWR0aDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYXR0cnMuaGVpZ2h0ICYmIGF0dHJzLmhlaWdodC5zcGVjaWZpZWQpIHtcbiAgICAgICAgICAvLyBUT0RPOiB1c2UgcnVudGltZVN0eWxlIGFuZCBjb29yZHNpemVcbiAgICAgICAgICAvLyBlbC5nZXRDb250ZXh0KCkuc2V0SGVpZ2h0XyhhdHRycy5oZWlnaHQubm9kZVZhbHVlKTtcbiAgICAgICAgICBlbC5zdHlsZS5oZWlnaHQgPSBhdHRycy5oZWlnaHQubm9kZVZhbHVlICsgJ3B4JztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbC5oZWlnaHQgPSBlbC5jbGllbnRIZWlnaHQ7XG4gICAgICAgIH1cbiAgICAgICAgLy9lbC5nZXRDb250ZXh0KCkuc2V0Q29vcmRzaXplXygpXG4gICAgICB9XG4gICAgICByZXR1cm4gZWw7XG4gICAgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIG9uUHJvcGVydHlDaGFuZ2UoZSkge1xuICAgIHZhciBlbCA9IGUuc3JjRWxlbWVudDtcblxuICAgIHN3aXRjaCAoZS5wcm9wZXJ0eU5hbWUpIHtcbiAgICAgIGNhc2UgJ3dpZHRoJzpcbiAgICAgICAgZWwuZ2V0Q29udGV4dCgpLmNsZWFyUmVjdCgpO1xuICAgICAgICBlbC5zdHlsZS53aWR0aCA9IGVsLmF0dHJpYnV0ZXMud2lkdGgubm9kZVZhbHVlICsgJ3B4JztcbiAgICAgICAgLy8gSW4gSUU4IHRoaXMgZG9lcyBub3QgdHJpZ2dlciBvbnJlc2l6ZS5cbiAgICAgICAgZWwuZmlyc3RDaGlsZC5zdHlsZS53aWR0aCA9ICBlbC5jbGllbnRXaWR0aCArICdweCc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnaGVpZ2h0JzpcbiAgICAgICAgZWwuZ2V0Q29udGV4dCgpLmNsZWFyUmVjdCgpO1xuICAgICAgICBlbC5zdHlsZS5oZWlnaHQgPSBlbC5hdHRyaWJ1dGVzLmhlaWdodC5ub2RlVmFsdWUgKyAncHgnO1xuICAgICAgICBlbC5maXJzdENoaWxkLnN0eWxlLmhlaWdodCA9IGVsLmNsaWVudEhlaWdodCArICdweCc7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG9uUmVzaXplKGUpIHtcbiAgICB2YXIgZWwgPSBlLnNyY0VsZW1lbnQ7XG4gICAgaWYgKGVsLmZpcnN0Q2hpbGQpIHtcbiAgICAgIGVsLmZpcnN0Q2hpbGQuc3R5bGUud2lkdGggPSAgZWwuY2xpZW50V2lkdGggKyAncHgnO1xuICAgICAgZWwuZmlyc3RDaGlsZC5zdHlsZS5oZWlnaHQgPSBlbC5jbGllbnRIZWlnaHQgKyAncHgnO1xuICAgIH1cbiAgfVxuXG4gIEdfdm1sQ2FudmFzTWFuYWdlcl8uaW5pdCgpO1xuXG4gIC8vIHByZWNvbXB1dGUgXCIwMFwiIHRvIFwiRkZcIlxuICB2YXIgZGVjVG9IZXggPSBbXTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCAxNjsgaSsrKSB7XG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCAxNjsgaisrKSB7XG4gICAgICBkZWNUb0hleFtpICogMTYgKyBqXSA9IGkudG9TdHJpbmcoMTYpICsgai50b1N0cmluZygxNik7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlTWF0cml4SWRlbnRpdHkoKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFsxLCAwLCAwXSxcbiAgICAgIFswLCAxLCAwXSxcbiAgICAgIFswLCAwLCAxXVxuICAgIF07XG4gIH1cblxuICBmdW5jdGlvbiBtYXRyaXhNdWx0aXBseShtMSwgbTIpIHtcbiAgICB2YXIgcmVzdWx0ID0gY3JlYXRlTWF0cml4SWRlbnRpdHkoKTtcblxuICAgIGZvciAodmFyIHggPSAwOyB4IDwgMzsgeCsrKSB7XG4gICAgICBmb3IgKHZhciB5ID0gMDsgeSA8IDM7IHkrKykge1xuICAgICAgICB2YXIgc3VtID0gMDtcblxuICAgICAgICBmb3IgKHZhciB6ID0gMDsgeiA8IDM7IHorKykge1xuICAgICAgICAgIHN1bSArPSBtMVt4XVt6XSAqIG0yW3pdW3ldO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVzdWx0W3hdW3ldID0gc3VtO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cblxuICBmdW5jdGlvbiBjb3B5U3RhdGUobzEsIG8yKSB7XG4gICAgbzIuZmlsbFN0eWxlICAgICA9IG8xLmZpbGxTdHlsZTtcbiAgICBvMi5saW5lQ2FwICAgICAgID0gbzEubGluZUNhcDtcbiAgICBvMi5saW5lSm9pbiAgICAgID0gbzEubGluZUpvaW47XG4gICAgbzIubGluZVdpZHRoICAgICA9IG8xLmxpbmVXaWR0aDtcbiAgICBvMi5taXRlckxpbWl0ICAgID0gbzEubWl0ZXJMaW1pdDtcbiAgICBvMi5zdHJva2VTdHlsZSAgID0gbzEuc3Ryb2tlU3R5bGU7XG4gICAgbzIuZ2xvYmFsQWxwaGEgICA9IG8xLmdsb2JhbEFscGhhO1xuICAgIG8yLmZvbnQgICAgICAgICAgPSBvMS5mb250O1xuICAgIG8yLnRleHRBbGlnbiAgICAgPSBvMS50ZXh0QWxpZ247XG4gICAgbzIudGV4dEJhc2VsaW5lICA9IG8xLnRleHRCYXNlbGluZTtcbiAgICBvMi5zY2FsZVhfICAgID0gbzEuc2NhbGVYXztcbiAgICBvMi5zY2FsZVlfICAgID0gbzEuc2NhbGVZXztcbiAgICBvMi54XyAgICA9IG8xLnhfO1xuICAgIG8yLnlfICAgID0gbzEueV87XG4gICAgbzIubGluZVNjYWxlXyAgICA9IG8xLmxpbmVTY2FsZV87XG4gIH1cblxuICB2YXIgY29sb3JEYXRhID0ge1xuICAgIGFsaWNlYmx1ZTogJyNGMEY4RkYnLFxuICAgIGFudGlxdWV3aGl0ZTogJyNGQUVCRDcnLFxuICAgIGFxdWFtYXJpbmU6ICcjN0ZGRkQ0JyxcbiAgICBhenVyZTogJyNGMEZGRkYnLFxuICAgIGJlaWdlOiAnI0Y1RjVEQycsXG4gICAgYmlzcXVlOiAnI0ZGRTRDNCcsXG4gICAgYmxhY2s6ICcjMDAwMDAwJyxcbiAgICBibGFuY2hlZGFsbW9uZDogJyNGRkVCQ0QnLFxuICAgIGJsdWV2aW9sZXQ6ICcjOEEyQkUyJyxcbiAgICBicm93bjogJyNBNTJBMkEnLFxuICAgIGJ1cmx5d29vZDogJyNERUI4ODcnLFxuICAgIGNhZGV0Ymx1ZTogJyM1RjlFQTAnLFxuICAgIGNoYXJ0cmV1c2U6ICcjN0ZGRjAwJyxcbiAgICBjaG9jb2xhdGU6ICcjRDI2OTFFJyxcbiAgICBjb3JhbDogJyNGRjdGNTAnLFxuICAgIGNvcm5mbG93ZXJibHVlOiAnIzY0OTVFRCcsXG4gICAgY29ybnNpbGs6ICcjRkZGOERDJyxcbiAgICBjcmltc29uOiAnI0RDMTQzQycsXG4gICAgY3lhbjogJyMwMEZGRkYnLFxuICAgIGRhcmtibHVlOiAnIzAwMDA4QicsXG4gICAgZGFya2N5YW46ICcjMDA4QjhCJyxcbiAgICBkYXJrZ29sZGVucm9kOiAnI0I4ODYwQicsXG4gICAgZGFya2dyYXk6ICcjQTlBOUE5JyxcbiAgICBkYXJrZ3JlZW46ICcjMDA2NDAwJyxcbiAgICBkYXJrZ3JleTogJyNBOUE5QTknLFxuICAgIGRhcmtraGFraTogJyNCREI3NkInLFxuICAgIGRhcmttYWdlbnRhOiAnIzhCMDA4QicsXG4gICAgZGFya29saXZlZ3JlZW46ICcjNTU2QjJGJyxcbiAgICBkYXJrb3JhbmdlOiAnI0ZGOEMwMCcsXG4gICAgZGFya29yY2hpZDogJyM5OTMyQ0MnLFxuICAgIGRhcmtyZWQ6ICcjOEIwMDAwJyxcbiAgICBkYXJrc2FsbW9uOiAnI0U5OTY3QScsXG4gICAgZGFya3NlYWdyZWVuOiAnIzhGQkM4RicsXG4gICAgZGFya3NsYXRlYmx1ZTogJyM0ODNEOEInLFxuICAgIGRhcmtzbGF0ZWdyYXk6ICcjMkY0RjRGJyxcbiAgICBkYXJrc2xhdGVncmV5OiAnIzJGNEY0RicsXG4gICAgZGFya3R1cnF1b2lzZTogJyMwMENFRDEnLFxuICAgIGRhcmt2aW9sZXQ6ICcjOTQwMEQzJyxcbiAgICBkZWVwcGluazogJyNGRjE0OTMnLFxuICAgIGRlZXBza3libHVlOiAnIzAwQkZGRicsXG4gICAgZGltZ3JheTogJyM2OTY5NjknLFxuICAgIGRpbWdyZXk6ICcjNjk2OTY5JyxcbiAgICBkb2RnZXJibHVlOiAnIzFFOTBGRicsXG4gICAgZmlyZWJyaWNrOiAnI0IyMjIyMicsXG4gICAgZmxvcmFsd2hpdGU6ICcjRkZGQUYwJyxcbiAgICBmb3Jlc3RncmVlbjogJyMyMjhCMjInLFxuICAgIGdhaW5zYm9ybzogJyNEQ0RDREMnLFxuICAgIGdob3N0d2hpdGU6ICcjRjhGOEZGJyxcbiAgICBnb2xkOiAnI0ZGRDcwMCcsXG4gICAgZ29sZGVucm9kOiAnI0RBQTUyMCcsXG4gICAgZ3JleTogJyM4MDgwODAnLFxuICAgIGdyZWVueWVsbG93OiAnI0FERkYyRicsXG4gICAgaG9uZXlkZXc6ICcjRjBGRkYwJyxcbiAgICBob3RwaW5rOiAnI0ZGNjlCNCcsXG4gICAgaW5kaWFucmVkOiAnI0NENUM1QycsXG4gICAgaW5kaWdvOiAnIzRCMDA4MicsXG4gICAgaXZvcnk6ICcjRkZGRkYwJyxcbiAgICBraGFraTogJyNGMEU2OEMnLFxuICAgIGxhdmVuZGVyOiAnI0U2RTZGQScsXG4gICAgbGF2ZW5kZXJibHVzaDogJyNGRkYwRjUnLFxuICAgIGxhd25ncmVlbjogJyM3Q0ZDMDAnLFxuICAgIGxlbW9uY2hpZmZvbjogJyNGRkZBQ0QnLFxuICAgIGxpZ2h0Ymx1ZTogJyNBREQ4RTYnLFxuICAgIGxpZ2h0Y29yYWw6ICcjRjA4MDgwJyxcbiAgICBsaWdodGN5YW46ICcjRTBGRkZGJyxcbiAgICBsaWdodGdvbGRlbnJvZHllbGxvdzogJyNGQUZBRDInLFxuICAgIGxpZ2h0Z3JlZW46ICcjOTBFRTkwJyxcbiAgICBsaWdodGdyZXk6ICcjRDNEM0QzJyxcbiAgICBsaWdodHBpbms6ICcjRkZCNkMxJyxcbiAgICBsaWdodHNhbG1vbjogJyNGRkEwN0EnLFxuICAgIGxpZ2h0c2VhZ3JlZW46ICcjMjBCMkFBJyxcbiAgICBsaWdodHNreWJsdWU6ICcjODdDRUZBJyxcbiAgICBsaWdodHNsYXRlZ3JheTogJyM3Nzg4OTknLFxuICAgIGxpZ2h0c2xhdGVncmV5OiAnIzc3ODg5OScsXG4gICAgbGlnaHRzdGVlbGJsdWU6ICcjQjBDNERFJyxcbiAgICBsaWdodHllbGxvdzogJyNGRkZGRTAnLFxuICAgIGxpbWVncmVlbjogJyMzMkNEMzInLFxuICAgIGxpbmVuOiAnI0ZBRjBFNicsXG4gICAgbWFnZW50YTogJyNGRjAwRkYnLFxuICAgIG1lZGl1bWFxdWFtYXJpbmU6ICcjNjZDREFBJyxcbiAgICBtZWRpdW1ibHVlOiAnIzAwMDBDRCcsXG4gICAgbWVkaXVtb3JjaGlkOiAnI0JBNTVEMycsXG4gICAgbWVkaXVtcHVycGxlOiAnIzkzNzBEQicsXG4gICAgbWVkaXVtc2VhZ3JlZW46ICcjM0NCMzcxJyxcbiAgICBtZWRpdW1zbGF0ZWJsdWU6ICcjN0I2OEVFJyxcbiAgICBtZWRpdW1zcHJpbmdncmVlbjogJyMwMEZBOUEnLFxuICAgIG1lZGl1bXR1cnF1b2lzZTogJyM0OEQxQ0MnLFxuICAgIG1lZGl1bXZpb2xldHJlZDogJyNDNzE1ODUnLFxuICAgIG1pZG5pZ2h0Ymx1ZTogJyMxOTE5NzAnLFxuICAgIG1pbnRjcmVhbTogJyNGNUZGRkEnLFxuICAgIG1pc3R5cm9zZTogJyNGRkU0RTEnLFxuICAgIG1vY2Nhc2luOiAnI0ZGRTRCNScsXG4gICAgbmF2YWpvd2hpdGU6ICcjRkZERUFEJyxcbiAgICBvbGRsYWNlOiAnI0ZERjVFNicsXG4gICAgb2xpdmVkcmFiOiAnIzZCOEUyMycsXG4gICAgb3JhbmdlOiAnI0ZGQTUwMCcsXG4gICAgb3JhbmdlcmVkOiAnI0ZGNDUwMCcsXG4gICAgb3JjaGlkOiAnI0RBNzBENicsXG4gICAgcGFsZWdvbGRlbnJvZDogJyNFRUU4QUEnLFxuICAgIHBhbGVncmVlbjogJyM5OEZCOTgnLFxuICAgIHBhbGV0dXJxdW9pc2U6ICcjQUZFRUVFJyxcbiAgICBwYWxldmlvbGV0cmVkOiAnI0RCNzA5MycsXG4gICAgcGFwYXlhd2hpcDogJyNGRkVGRDUnLFxuICAgIHBlYWNocHVmZjogJyNGRkRBQjknLFxuICAgIHBlcnU6ICcjQ0Q4NTNGJyxcbiAgICBwaW5rOiAnI0ZGQzBDQicsXG4gICAgcGx1bTogJyNEREEwREQnLFxuICAgIHBvd2RlcmJsdWU6ICcjQjBFMEU2JyxcbiAgICByb3N5YnJvd246ICcjQkM4RjhGJyxcbiAgICByb3lhbGJsdWU6ICcjNDE2OUUxJyxcbiAgICBzYWRkbGVicm93bjogJyM4QjQ1MTMnLFxuICAgIHNhbG1vbjogJyNGQTgwNzInLFxuICAgIHNhbmR5YnJvd246ICcjRjRBNDYwJyxcbiAgICBzZWFncmVlbjogJyMyRThCNTcnLFxuICAgIHNlYXNoZWxsOiAnI0ZGRjVFRScsXG4gICAgc2llbm5hOiAnI0EwNTIyRCcsXG4gICAgc2t5Ymx1ZTogJyM4N0NFRUInLFxuICAgIHNsYXRlYmx1ZTogJyM2QTVBQ0QnLFxuICAgIHNsYXRlZ3JheTogJyM3MDgwOTAnLFxuICAgIHNsYXRlZ3JleTogJyM3MDgwOTAnLFxuICAgIHNub3c6ICcjRkZGQUZBJyxcbiAgICBzcHJpbmdncmVlbjogJyMwMEZGN0YnLFxuICAgIHN0ZWVsYmx1ZTogJyM0NjgyQjQnLFxuICAgIHRhbjogJyNEMkI0OEMnLFxuICAgIHRoaXN0bGU6ICcjRDhCRkQ4JyxcbiAgICB0b21hdG86ICcjRkY2MzQ3JyxcbiAgICB0dXJxdW9pc2U6ICcjNDBFMEQwJyxcbiAgICB2aW9sZXQ6ICcjRUU4MkVFJyxcbiAgICB3aGVhdDogJyNGNURFQjMnLFxuICAgIHdoaXRlc21va2U6ICcjRjVGNUY1JyxcbiAgICB5ZWxsb3dncmVlbjogJyM5QUNEMzInXG4gIH07XG5cbiAgZnVuY3Rpb24gZ2V0UmdiSHNsQ29udGVudChzdHlsZVN0cmluZykge1xuICAgIHZhciBzdGFydCA9IHN0eWxlU3RyaW5nLmluZGV4T2YoJygnLCAzKTtcbiAgICB2YXIgZW5kID0gc3R5bGVTdHJpbmcuaW5kZXhPZignKScsIHN0YXJ0ICsgMSk7XG4gICAgdmFyIHBhcnRzID0gc3R5bGVTdHJpbmcuc3Vic3RyaW5nKHN0YXJ0ICsgMSwgZW5kKS5zcGxpdCgnLCcpO1xuICAgIC8vIGFkZCBhbHBoYSBpZiBuZWVkZWRcbiAgICBpZiAocGFydHMubGVuZ3RoICE9IDQgfHwgc3R5bGVTdHJpbmcuY2hhckF0KDMpICE9ICdhJykge1xuICAgICAgcGFydHNbM10gPSAxO1xuICAgIH1cbiAgICByZXR1cm4gcGFydHM7XG4gIH1cblxuICBmdW5jdGlvbiBwZXJjZW50KHMpIHtcbiAgICByZXR1cm4gcGFyc2VGbG9hdChzKSAvIDEwMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNsYW1wKHYsIG1pbiwgbWF4KSB7XG4gICAgcmV0dXJuIE1hdGgubWluKG1heCwgTWF0aC5tYXgobWluLCB2KSk7XG4gIH1cblxuICBmdW5jdGlvbiBoc2xUb1JnYihwYXJ0cyl7XG4gICAgdmFyIHIsIGcsIGIsIGgsIHMsIGw7XG4gICAgaCA9IHBhcnNlRmxvYXQocGFydHNbMF0pIC8gMzYwICUgMzYwO1xuICAgIGlmIChoIDwgMClcbiAgICAgIGgrKztcbiAgICBzID0gY2xhbXAocGVyY2VudChwYXJ0c1sxXSksIDAsIDEpO1xuICAgIGwgPSBjbGFtcChwZXJjZW50KHBhcnRzWzJdKSwgMCwgMSk7XG4gICAgaWYgKHMgPT0gMCkge1xuICAgICAgciA9IGcgPSBiID0gbDsgLy8gYWNocm9tYXRpY1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgcSA9IGwgPCAwLjUgPyBsICogKDEgKyBzKSA6IGwgKyBzIC0gbCAqIHM7XG4gICAgICB2YXIgcCA9IDIgKiBsIC0gcTtcbiAgICAgIHIgPSBodWVUb1JnYihwLCBxLCBoICsgMSAvIDMpO1xuICAgICAgZyA9IGh1ZVRvUmdiKHAsIHEsIGgpO1xuICAgICAgYiA9IGh1ZVRvUmdiKHAsIHEsIGggLSAxIC8gMyk7XG4gICAgfVxuXG4gICAgcmV0dXJuICcjJyArIGRlY1RvSGV4W01hdGguZmxvb3IociAqIDI1NSldICtcbiAgICAgICAgZGVjVG9IZXhbTWF0aC5mbG9vcihnICogMjU1KV0gK1xuICAgICAgICBkZWNUb0hleFtNYXRoLmZsb29yKGIgKiAyNTUpXTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGh1ZVRvUmdiKG0xLCBtMiwgaCkge1xuICAgIGlmIChoIDwgMClcbiAgICAgIGgrKztcbiAgICBpZiAoaCA+IDEpXG4gICAgICBoLS07XG5cbiAgICBpZiAoNiAqIGggPCAxKVxuICAgICAgcmV0dXJuIG0xICsgKG0yIC0gbTEpICogNiAqIGg7XG4gICAgZWxzZSBpZiAoMiAqIGggPCAxKVxuICAgICAgcmV0dXJuIG0yO1xuICAgIGVsc2UgaWYgKDMgKiBoIDwgMilcbiAgICAgIHJldHVybiBtMSArIChtMiAtIG0xKSAqICgyIC8gMyAtIGgpICogNjtcbiAgICBlbHNlXG4gICAgICByZXR1cm4gbTE7XG4gIH1cblxuICB2YXIgcHJvY2Vzc1N0eWxlQ2FjaGUgPSB7fTtcblxuICBmdW5jdGlvbiBwcm9jZXNzU3R5bGUoc3R5bGVTdHJpbmcpIHtcbiAgICBpZiAoc3R5bGVTdHJpbmcgaW4gcHJvY2Vzc1N0eWxlQ2FjaGUpIHtcbiAgICAgIHJldHVybiBwcm9jZXNzU3R5bGVDYWNoZVtzdHlsZVN0cmluZ107XG4gICAgfVxuXG4gICAgdmFyIHN0ciwgYWxwaGEgPSAxO1xuXG4gICAgc3R5bGVTdHJpbmcgPSBTdHJpbmcoc3R5bGVTdHJpbmcpO1xuICAgIGlmIChzdHlsZVN0cmluZy5jaGFyQXQoMCkgPT0gJyMnKSB7XG4gICAgICBzdHIgPSBzdHlsZVN0cmluZztcbiAgICB9IGVsc2UgaWYgKC9ecmdiLy50ZXN0KHN0eWxlU3RyaW5nKSkge1xuICAgICAgdmFyIHBhcnRzID0gZ2V0UmdiSHNsQ29udGVudChzdHlsZVN0cmluZyk7XG4gICAgICB2YXIgc3RyID0gJyMnLCBuO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAzOyBpKyspIHtcbiAgICAgICAgaWYgKHBhcnRzW2ldLmluZGV4T2YoJyUnKSAhPSAtMSkge1xuICAgICAgICAgIG4gPSBNYXRoLmZsb29yKHBlcmNlbnQocGFydHNbaV0pICogMjU1KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuID0gK3BhcnRzW2ldO1xuICAgICAgICB9XG4gICAgICAgIHN0ciArPSBkZWNUb0hleFtjbGFtcChuLCAwLCAyNTUpXTtcbiAgICAgIH1cbiAgICAgIGFscGhhID0gK3BhcnRzWzNdO1xuICAgIH0gZWxzZSBpZiAoL15oc2wvLnRlc3Qoc3R5bGVTdHJpbmcpKSB7XG4gICAgICB2YXIgcGFydHMgPSBnZXRSZ2JIc2xDb250ZW50KHN0eWxlU3RyaW5nKTtcbiAgICAgIHN0ciA9IGhzbFRvUmdiKHBhcnRzKTtcbiAgICAgIGFscGhhID0gcGFydHNbM107XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGNvbG9yRGF0YVtzdHlsZVN0cmluZ10gfHwgc3R5bGVTdHJpbmc7XG4gICAgfVxuICAgIHJldHVybiBwcm9jZXNzU3R5bGVDYWNoZVtzdHlsZVN0cmluZ10gPSB7Y29sb3I6IHN0ciwgYWxwaGE6IGFscGhhfTtcbiAgfVxuXG4gIHZhciBERUZBVUxUX1NUWUxFID0ge1xuICAgIHN0eWxlOiAnbm9ybWFsJyxcbiAgICB2YXJpYW50OiAnbm9ybWFsJyxcbiAgICB3ZWlnaHQ6ICdub3JtYWwnLFxuICAgIHNpemU6IDEyLCAgICAgICAgICAgLy8xMFxuICAgIGZhbWlseTogJ+W+rui9r+mbhem7kScgICAgIC8vJ3NhbnMtc2VyaWYnXG4gIH07XG5cbiAgLy8gSW50ZXJuYWwgdGV4dCBzdHlsZSBjYWNoZVxuICB2YXIgZm9udFN0eWxlQ2FjaGUgPSB7fTtcblxuICBmdW5jdGlvbiBwcm9jZXNzRm9udFN0eWxlKHN0eWxlU3RyaW5nKSB7XG4gICAgaWYgKGZvbnRTdHlsZUNhY2hlW3N0eWxlU3RyaW5nXSkge1xuICAgICAgcmV0dXJuIGZvbnRTdHlsZUNhY2hlW3N0eWxlU3RyaW5nXTtcbiAgICB9XG5cbiAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB2YXIgc3R5bGUgPSBlbC5zdHlsZTtcbiAgICB2YXIgZm9udEZhbWlseTtcbiAgICB0cnkge1xuICAgICAgc3R5bGUuZm9udCA9IHN0eWxlU3RyaW5nO1xuICAgICAgZm9udEZhbWlseSA9IHN0eWxlLmZvbnRGYW1pbHkuc3BsaXQoJywnKVswXTtcbiAgICB9IGNhdGNoIChleCkge1xuICAgICAgLy8gSWdub3JlIGZhaWx1cmVzIHRvIHNldCB0byBpbnZhbGlkIGZvbnQuXG4gICAgfVxuXG4gICAgcmV0dXJuIGZvbnRTdHlsZUNhY2hlW3N0eWxlU3RyaW5nXSA9IHtcbiAgICAgIHN0eWxlOiBzdHlsZS5mb250U3R5bGUgfHwgREVGQVVMVF9TVFlMRS5zdHlsZSxcbiAgICAgIHZhcmlhbnQ6IHN0eWxlLmZvbnRWYXJpYW50IHx8IERFRkFVTFRfU1RZTEUudmFyaWFudCxcbiAgICAgIHdlaWdodDogc3R5bGUuZm9udFdlaWdodCB8fCBERUZBVUxUX1NUWUxFLndlaWdodCxcbiAgICAgIHNpemU6IHN0eWxlLmZvbnRTaXplIHx8IERFRkFVTFRfU1RZTEUuc2l6ZSxcbiAgICAgIGZhbWlseTogZm9udEZhbWlseSB8fCBERUZBVUxUX1NUWUxFLmZhbWlseVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBnZXRDb21wdXRlZFN0eWxlKHN0eWxlLCBlbGVtZW50KSB7XG4gICAgdmFyIGNvbXB1dGVkU3R5bGUgPSB7fTtcblxuICAgIGZvciAodmFyIHAgaW4gc3R5bGUpIHtcbiAgICAgIGNvbXB1dGVkU3R5bGVbcF0gPSBzdHlsZVtwXTtcbiAgICB9XG5cbiAgICAvLyBDb21wdXRlIHRoZSBzaXplXG4gICAgdmFyIGNhbnZhc0ZvbnRTaXplID0gcGFyc2VGbG9hdChlbGVtZW50LmN1cnJlbnRTdHlsZS5mb250U2l6ZSksXG4gICAgICAgIGZvbnRTaXplID0gcGFyc2VGbG9hdChzdHlsZS5zaXplKTtcblxuICAgIGlmICh0eXBlb2Ygc3R5bGUuc2l6ZSA9PSAnbnVtYmVyJykge1xuICAgICAgY29tcHV0ZWRTdHlsZS5zaXplID0gc3R5bGUuc2l6ZTtcbiAgICB9IGVsc2UgaWYgKHN0eWxlLnNpemUuaW5kZXhPZigncHgnKSAhPSAtMSkge1xuICAgICAgY29tcHV0ZWRTdHlsZS5zaXplID0gZm9udFNpemU7XG4gICAgfSBlbHNlIGlmIChzdHlsZS5zaXplLmluZGV4T2YoJ2VtJykgIT0gLTEpIHtcbiAgICAgIGNvbXB1dGVkU3R5bGUuc2l6ZSA9IGNhbnZhc0ZvbnRTaXplICogZm9udFNpemU7XG4gICAgfSBlbHNlIGlmKHN0eWxlLnNpemUuaW5kZXhPZignJScpICE9IC0xKSB7XG4gICAgICBjb21wdXRlZFN0eWxlLnNpemUgPSAoY2FudmFzRm9udFNpemUgLyAxMDApICogZm9udFNpemU7XG4gICAgfSBlbHNlIGlmIChzdHlsZS5zaXplLmluZGV4T2YoJ3B0JykgIT0gLTEpIHtcbiAgICAgIGNvbXB1dGVkU3R5bGUuc2l6ZSA9IGZvbnRTaXplIC8gLjc1O1xuICAgIH0gZWxzZSB7XG4gICAgICBjb21wdXRlZFN0eWxlLnNpemUgPSBjYW52YXNGb250U2l6ZTtcbiAgICB9XG5cbiAgICAvLyBEaWZmZXJlbnQgc2NhbGluZyBiZXR3ZWVuIG5vcm1hbCB0ZXh0IGFuZCBWTUwgdGV4dC4gVGhpcyB3YXMgZm91bmQgdXNpbmdcbiAgICAvLyB0cmlhbCBhbmQgZXJyb3IgdG8gZ2V0IHRoZSBzYW1lIHNpemUgYXMgbm9uIFZNTCB0ZXh0LlxuICAgIC8vY29tcHV0ZWRTdHlsZS5zaXplICo9IDAuOTgxO1xuXG4gICAgcmV0dXJuIGNvbXB1dGVkU3R5bGU7XG4gIH1cblxuICBmdW5jdGlvbiBidWlsZFN0eWxlKHN0eWxlKSB7XG4gICAgcmV0dXJuIHN0eWxlLnN0eWxlICsgJyAnICsgc3R5bGUudmFyaWFudCArICcgJyArIHN0eWxlLndlaWdodCArICcgJyArXG4gICAgICAgIHN0eWxlLnNpemUgKyBcInB4ICdcIiArIHN0eWxlLmZhbWlseSArIFwiJ1wiO1xuICB9XG5cbiAgdmFyIGxpbmVDYXBNYXAgPSB7XG4gICAgJ2J1dHQnOiAnZmxhdCcsXG4gICAgJ3JvdW5kJzogJ3JvdW5kJ1xuICB9O1xuXG4gIGZ1bmN0aW9uIHByb2Nlc3NMaW5lQ2FwKGxpbmVDYXApIHtcbiAgICByZXR1cm4gbGluZUNhcE1hcFtsaW5lQ2FwXSB8fCAnc3F1YXJlJztcbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZVNoYXBlQXR0cigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgZmlsbGVkOiBmYWxzZSxcbiAgICAgIHN0cm9rZWQ6IGZhbHNlLFxuXG4gICAgICBwYXRoOiAnJyxcbiAgICAgIGZpbGxTdHlsZTogbnVsbCxcbiAgICAgIHN0cm9rZVN0eWxlOiBudWxsLFxuXG4gICAgICBnbG9iYWxBbHBoYTogMSxcbiAgICAgIGxpbmVDYXA6ICdidXR0JyxcbiAgICAgIGxpbmVKb2luOiAnbWl0ZXInLFxuICAgICAgbGluZVdpZHRoOiAxLFxuICAgICAgbWl0ZXJsaW1pdDogWiAqIDEsXG5cbiAgICAgIHg6IDAsXG4gICAgICB5OiAwXG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvcHlTaGFwZUF0dHIobzEsIG8yKSB7XG4gICAgbzEucGF0aCA9IG8yLnBhdGg7XG5cbiAgICBvMS5maWxsU3R5bGUgPSBvMi5maWxsU3R5bGU7XG5cbiAgICBvMS5nbG9iYWxBbHBoYSA9IG8yLmdsb2JhbEFscGhhO1xuICAgIFxuICAgIC8vIFBFTkRJTkcgV2hlbiBzaGFwZSBjaGFuZ2VkIGZyb20gbm90IHN0cm9rZWQgdG8gc3Ryb2tlZFxuICAgIGlmIChvMi5zdHJva2VkKSB7XG4gICAgICBvMS5zdHJva2VTdHlsZSA9IG8yLnN0cm9rZVN0eWxlO1xuICAgICAgbzEubGluZUNhcCA9IG8yLmxpbmVDYXA7XG4gICAgICBvMS5saW5lSm9pbiA9IG8yLmxpbmVKb2luO1xuICAgICAgbzEubGluZVdpZHRoID0gbzIubGluZVdpZHRoO1xuICAgICAgbzEubWl0ZXJsaW1pdCA9IG8yLm1pdGVybGltaXQ7IFxuICAgIH1cblxuICAgIG8xLnggPSBvMi54O1xuICAgIG8xLnkgPSBvMi55O1xuXG4gICAgbzEuZmlsbGVkID0gbzIuZmlsbGVkO1xuICAgIG8xLnN0cm9rZWQgPSBvMi5zdHJva2VkO1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlVGV4dEF0dHIoKSB7XG4gICAgdmFyIGF0dHIgPSBjcmVhdGVTaGFwZUF0dHIoKTtcbiAgICBhdHRyLnRleHQgPSAnJztcbiAgICBhdHRyLmZvbnQgPSAnMTJweCDlvq7ova/pm4Xpu5EnO1xuICAgIGF0dHIudGV4dEFsaWduID0gJ2xlZnQnO1xuICAgIGF0dHIudGV4dEJhc2VsaW5lID0gJ2FscGhhYmV0aWMnO1xuICAgIGF0dHIub2ZmWCA9IDA7XG4gICAgYXR0ci5vZmZZID0gMDtcbiAgICBhdHRyLm1heFdpZHRoID0gMDtcblxuICAgIHJldHVybiBhdHRyO1xuICB9XG5cbiAgZnVuY3Rpb24gY29weVRleHRBdHRyKG8xLCBvMikge1xuICAgIGNvcHlTaGFwZUF0dHIobzEsIG8yKTtcblxuICAgIG8xLnRleHQgPSBvMi50ZXh0O1xuICAgIG8xLmZvbnQgPSBvMi5mb250O1xuICAgIG8xLnRleHRBbGlnbiA9IG8yLnRleHRBbGlnbjtcbiAgICBvMS50ZXh0QmFzZWxpbmUgPSBvMi50ZXh0QmFzZWxpbmU7XG4gICAgbzEub2ZmWCA9IG8yLm9mZlg7XG4gICAgbzEub2ZmWSA9IG8yLm9mZlk7XG4gICAgbzEubWF4V2lkdGggPSBvMi5tYXhXaWR0aDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZUltYWdlQXR0cigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgaW1hZ2U6ICcnLFxuICAgICAgLy8gcG9zaXRpb24gYWZ0ZXIgdHJhbmZvcm1lZFxuICAgICAgeDogMCxcbiAgICAgIHk6IDAsXG4gICAgICBwYWRkaW5nOiAnJyxcbiAgICAgIHNrZXdNOiAnJyxcbiAgICAgIGNyb3BwZWQ6IGZhbHNlLFxuICAgICAgd2lkdGg6IDAsXG4gICAgICBoZWlnaHQ6IDAsXG4gICAgICBnbG9iYWxBbHBoYTogMVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBjb3B5SW1hZ2VBdHRyKG8xLCBvMikge1xuICAgIG8xLmltYWdlID0gbzIuaW1hZ2U7XG4gICAgbzEueCA9IG8yLng7XG4gICAgbzEueSA9IG8yLnk7XG4gICAgbzEud2lkdGggPSBvMi53aWR0aDtcbiAgICBvMS5oZWlnaHQgPSBvMi5oZWlnaHQ7XG4gICAgbzEuZ2xvYmFsQWxwaGEgPSBvMi5nbG9iYWxBbHBoYTtcblxuICAgIGlmIChvMi5za2V3ZWQpIHtcbiAgICAgIG8xLnNrZXdNID0gbzIuc2tld007XG4gICAgICBvMS5wYWRkaW5nID0gbzIucGFkZGluZzsgXG4gICAgfVxuXG4gICAgaWYgKG8yLmNyb3BwZWQpIHtcbiAgICAgIG8xLmNyb3BXaWR0aCA9IG8yLmNyb3BXaWR0aDtcbiAgICAgIG8xLmNyb3BIZWlnaHQgPSBvMi5jcm9wSGVpZ2h0O1xuICAgICAgbzEuY3JvcEZpbHRlciA9IG8yLmNyb3BGaWx0ZXI7XG4gICAgfVxuXG4gICAgbzEuY3JvcHBlZCA9IG8yLmNyb3BwZWQ7XG4gICAgbzEuc2tld2VkID0gbzIuc2tld2VkO1xuICB9XG5cbiAgLyoqXG4gICAqIFZpcnR1YWwgc2hhcGUgZG9tIGlzIGNyZWF0ZWQgYnkgc3Ryb2tlIGFuZCBmaWxsIG9wZXJhdGlvbi5cbiAgICogSXQgd2lsbCBiZSBjYWNoZWQgaW4gQ29udGV4dDJEIG9iamVjdC4gQW5kIGNyZWF0ZWQgb25seSBpZiBuZWVkZWQgd2hlbiByZWRyYXdpbmdcbiAgICogQGF1dGhvciBodHRwczovL2dpdGh1Yi5jb20vcGlzc2FuZy9cbiAgICovXG4gIGZ1bmN0aW9uIFNoYXBlVmlydHVhbERvbV8oKSB7XG4gICAgLy8gdGhpcy5yb290RWxfID0gbnVsbDtcbiAgICAvLyB0aGlzLnN0cm9rZUVsXyA9IG51bGw7XG4gICAgLy8gdGhpcy5maWxsRWxfID0gbnVsbDtcblxuICAgIHRoaXMuYXR0cl8gPSBjcmVhdGVTaGFwZUF0dHIoKTtcblxuICAgIHRoaXMuYXR0clByZXZfID0ge307XG4gIH1cblxuICBTaGFwZVZpcnR1YWxEb21fLnByb3RvdHlwZS5hdHRhY2hUbyA9IGZ1bmN0aW9uIChlbCkge1xuICAgIGlmICghdGhpcy5hdHRhY2hlZF8pIHtcbiAgICAgIHZhciBwID0gdGhpcy5yb290RWxfLnBhcmVudE5vZGU7XG4gICAgICBpZiAocCAhPT0gZWwpIHtcbiAgICAgICAgZWwuYXBwZW5kQ2hpbGQodGhpcy5yb290RWxfKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5hdHRhY2hlZF8gPSB0cnVlO1xuICB9XG5cbiAgU2hhcGVWaXJ0dWFsRG9tXy5wcm90b3R5cGUuZGV0YWNoID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLmF0dGFjaGVkXykge1xuICAgICAgdmFyIHAgPSB0aGlzLnJvb3RFbF8ucGFyZW50Tm9kZTtcbiAgICAgIGlmIChwKSB7XG4gICAgICAgIHAucmVtb3ZlQ2hpbGQodGhpcy5yb290RWxfKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5hdHRhY2hlZF8gPSBmYWxzZTtcbiAgfVxuXG4gIFNoYXBlVmlydHVhbERvbV8ucHJvdG90eXBlLmdldEVsZW1lbnQgPSBmdW5jdGlvbiAocGF0aCkge1xuICAgIGlmICghdGhpcy5yb290RWxfKSB7XG4gICAgICB0aGlzLmNyZWF0ZVNoYXBlRWxfKHBhdGgpO1xuICAgIH1cbiAgICB2YXIgYXR0cl8gPSB0aGlzLmF0dHJfO1xuICAgIGF0dHJfLnBhdGggPSBwYXRoO1xuICAgIGF0dHJfLmZpbGxlZCA9IGZhbHNlO1xuICAgIGF0dHJfLnN0cm9rZWQgPSBmYWxzZTtcblxuICAgIHJldHVybiB0aGlzLnJvb3RFbF87XG4gIH07XG5cbiAgU2hhcGVWaXJ0dWFsRG9tXy5wcm90b3R5cGUuY3JlYXRlU2hhcGVFbF8gPSBmdW5jdGlvbiAocGF0aCkge1xuXG4gICAgdmFyIFcgPSAxMDtcbiAgICB2YXIgSCA9IDEwO1xuXG4gICAgdmFyIHJvb3RFbF8gPSBjcmVhdGVWTUxFbGVtZW50KCdzaGFwZScpO1xuICAgIHJvb3RFbF8uc3R5bGUuY3NzVGV4dCA9IFsncG9zaXRpb246YWJzb2x1dGU7d2lkdGg6JywgVywgJ3B4O2hlaWdodDonLCBILCAncHgnXS5qb2luKCcnKTtcbiAgICByb290RWxfLmNvb3Jkb3JpZ2luID0gJzAgMCc7XG4gICAgcm9vdEVsXy5jb29yZHNpemUgPSBaICogVyArICcgJyArIFogKiBIO1xuXG4gICAgcm9vdEVsXy5maWxsZWQgPSAnZmFsc2UnO1xuICAgIHJvb3RFbF8uc3Ryb2tlZCA9ICdmYWxzZSc7XG5cbiAgICB0aGlzLnJvb3RFbF8gPSByb290RWxfO1xuICB9O1xuXG4gIFNoYXBlVmlydHVhbERvbV8ucHJvdG90eXBlLmlzRmlsbGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmF0dHJfLmZpbGxlZDtcbiAgfTtcblxuICBTaGFwZVZpcnR1YWxEb21fLnByb3RvdHlwZS5pc1N0cm9rZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuYXR0cl8uc3Ryb2tlZDtcbiAgfTtcblxuICBTaGFwZVZpcnR1YWxEb21fLnByb3RvdHlwZS5maWxsID0gZnVuY3Rpb24oY3R4LCBtaW4sIG1heCkge1xuICAgIHZhciBhdHRyXyA9IHRoaXMuYXR0cl87XG5cbiAgICBhdHRyXy5maWxsZWQgPSB0cnVlO1xuICAgIGF0dHJfLmZpbGxTdHlsZSA9IGN0eC5maWxsU3R5bGU7XG4gICAgYXR0cl8uZ2xvYmFsQWxwaGEgPSBjdHguZ2xvYmFsQWxwaGE7XG5cbiAgICBhdHRyXy54ID0gY3R4LnhfO1xuICAgIGF0dHJfLnkgPSBjdHgueV87XG5cbiAgICBpZiAoY3R4LmZpbGxTdHlsZSBpbnN0YW5jZW9mIENhbnZhc0dyYWRpZW50Xykge1xuICAgICAgYXR0cl8ubV8gPSBjdHgubV87XG4gICAgICBhdHRyXy5zY2FsZVggPSBjdHguc2NhbGVYXztcbiAgICAgIGF0dHJfLnNjYWxlWSA9IGN0eC5zY2FsZVlfO1xuICAgICAgYXR0cl8ubWluID0gbWluO1xuICAgICAgYXR0cl8ubWF4ID0gbWF4O1xuICAgIH0gZWxzZSBpZiAoY3R4LmZpbGxTdHlsZSBpbnN0YW5jZW9mIENhbnZhc1BhdHRlcm5fKSB7XG4gICAgICBhdHRyXy5zY2FsZVggPSBjdHguc2NhbGVYXztcbiAgICAgIGF0dHJfLnNjYWxlWSA9IGN0eC5zY2FsZVlfO1xuICAgICAgYXR0cl8ubWluID0gbWluO1xuICAgICAgYXR0cl8ubWF4ID0gbWF4O1xuICAgIH1cbiAgfTtcblxuICBTaGFwZVZpcnR1YWxEb21fLnByb3RvdHlwZS5zdHJva2UgPSBmdW5jdGlvbiAoY3R4KSB7XG4gICAgdmFyIGF0dHJfID0gdGhpcy5hdHRyXztcblxuICAgIGF0dHJfLnN0cm9rZWQgPSB0cnVlO1xuICAgIGF0dHJfLmdsb2JhbEFscGhhID0gY3R4Lmdsb2JhbEFscGhhO1xuICAgIGF0dHJfLmxpbmVDYXAgPSBjdHgubGluZUNhcDtcbiAgICBhdHRyXy5saW5lSm9pbiA9IGN0eC5saW5lSm9pbjtcbiAgICBhdHRyXy5saW5lV2lkdGggPSBjdHgubGluZVdpZHRoICogY3R4LmxpbmVTY2FsZV87XG4gICAgYXR0cl8ubWl0ZXJsaW1pdCA9IGN0eC5taXRlcmxpbWl0O1xuICAgIGF0dHJfLnN0cm9rZVN0eWxlID0gY3R4LnN0cm9rZVN0eWxlO1xuXG4gICAgYXR0cl8ueCA9IGN0eC54XztcbiAgICBhdHRyXy55ID0gY3R4LnlfO1xuICB9XG5cbiAgU2hhcGVWaXJ0dWFsRG9tXy5wcm90b3R5cGUuZG9GaWxsXyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYXR0cl8gPSB0aGlzLmF0dHJfO1xuICAgIHZhciBhdHRyUHJldl8gPSB0aGlzLmF0dHJQcmV2XztcbiAgICBpZiAoYXR0cl8uZmlsbGVkICE9PSBhdHRyUHJldl8uZmlsbGVkKSB7XG4gICAgICB2YXIgcm9vdEVsXyA9IHRoaXMucm9vdEVsXztcbiAgICAgIGlmIChhdHRyXy5maWxsZWQpIHtcbiAgICAgICAgcm9vdEVsXy5maWxsZWQgPSAndHJ1ZSc7XG4gICAgICAgIGlmICghdGhpcy5maWxsRWxfKSB7XG4gICAgICAgICAgdGhpcy5maWxsRWxfID0gY3JlYXRlVk1MRWxlbWVudCgnZmlsbCcpO1xuICAgICAgICAgIC8vIFBFTkRJTkcgXG4gICAgICAgICAgLy8gU2V0IGRlZmF1bHQgYXR0cmlidXRlID9cbiAgICAgICAgfVxuICAgICAgICByb290RWxfLmFwcGVuZENoaWxkKHRoaXMuZmlsbEVsXyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByb290RWxfLmZpbGxlZCA9ICdmYWxzZSc7XG4gICAgICAgIGlmICh0aGlzLmZpbGxFbF8pIHtcbiAgICAgICAgICByb290RWxfLnJlbW92ZUNoaWxkKHRoaXMuZmlsbEVsXyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFhdHRyXy5maWxsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgZmlsbEVsXyA9IHRoaXMuZmlsbEVsXztcblxuICAgIHZhciBmaWxsU3R5bGUgPSBhdHRyXy5maWxsU3R5bGU7XG5cbiAgICBpZiAoXG4gICAgICBmaWxsU3R5bGUgIT09IGF0dHJQcmV2Xy5maWxsU3R5bGUgfHwgXG4gICAgICBhdHRyXy5nbG9iYWxBbHBoYSAhPT0gYXR0clByZXZfLmdsb2JhbEFscGhhXG4gICAgKSB7XG4gICAgICAvLyBUT0RPIENhbnZhcyBncmFkaWVudCBhbmQgcGF0dGVybiBzdGlsbCBub3QgYmUgb3B0aW1pemVkXG4gICAgICAvLyBUaGVyZSBwcm9ibGVtIHdoZW4gY2FudmFzIGdyYWRpZW50IGFkZCBjb2xvciBzdG9wIGR5bmFtaWNhbGx5XG4gICAgICAvLyBcbiAgICAgIC8vIFRleHQgZmlsbCBkb2Vzbid0IHN1cHBvcnQgR3JhZGllbnQgb3IgUGF0dGVyblxuICAgICAgaWYgKChmaWxsU3R5bGUgaW5zdGFuY2VvZiBDYW52YXNHcmFkaWVudF8pICYmIGF0dHJfLm1pbikge1xuICAgICAgICAvLyBUT0RPOiBHcmFkaWVudHMgdHJhbnNmb3JtZWQgd2l0aCB0aGUgdHJhbnNmb3JtYXRpb24gbWF0cml4LlxuICAgICAgICB2YXIgYW5nbGUgPSAwO1xuICAgICAgICB2YXIgZm9jdXMgPSB7eDogMCwgeTogMH07XG5cbiAgICAgICAgLy8gYWRkaXRpb25hbCBvZmZzZXRcbiAgICAgICAgdmFyIHNoaWZ0ID0gMDtcbiAgICAgICAgLy8gc2NhbGUgZmFjdG9yIGZvciBvZmZzZXRcbiAgICAgICAgdmFyIGV4cGFuc2lvbiA9IDE7XG5cbiAgICAgICAgdmFyIHNjYWxlWCA9IGF0dHJfLnNjYWxlWF87XG4gICAgICAgIHZhciBzY2FsZVkgPSBhdHRyXy5zY2FsZVlfO1xuICAgICAgICB2YXIgbWluID0gYXR0cl8ubWluO1xuICAgICAgICB2YXIgbWF4ID0gYXR0cl8ubWF4O1xuICAgICAgICB2YXIgd2lkdGggPSBtYXgueCAtIG1pbi54O1xuICAgICAgICB2YXIgaGVpZ2h0ID0gbWF4LnkgLSBtaW4ueTtcblxuICAgICAgICBpZiAoZmlsbFN0eWxlLnR5cGVfID09ICdncmFkaWVudCcpIHtcbiAgICAgICAgICB2YXIgeDAgPSBmaWxsU3R5bGUueDBfIC8gc2NhbGVYO1xuICAgICAgICAgIHZhciB5MCA9IGZpbGxTdHlsZS55MF8gLyBzY2FsZVk7XG4gICAgICAgICAgdmFyIHgxID0gZmlsbFN0eWxlLngxXyAvIHNjYWxlWDtcbiAgICAgICAgICB2YXIgeTEgPSBmaWxsU3R5bGUueTFfIC8gc2NhbGVZO1xuICAgICAgICAgIHZhciBwMCA9IGdldENvb3JkcyhjdHgsIHgwLCB5MCk7XG4gICAgICAgICAgdmFyIHAxID0gZ2V0Q29vcmRzKGN0eCwgeDEsIHkxKTtcbiAgICAgICAgICB2YXIgZHggPSBwMS54IC0gcDAueDtcbiAgICAgICAgICB2YXIgZHkgPSBwMS55IC0gcDAueTtcbiAgICAgICAgICBhbmdsZSA9IE1hdGguYXRhbjIoZHgsIGR5KSAqIDE4MCAvIE1hdGguUEk7XG5cbiAgICAgICAgICAvLyBUaGUgYW5nbGUgc2hvdWxkIGJlIGEgbm9uLW5lZ2F0aXZlIG51bWJlci5cbiAgICAgICAgICBpZiAoYW5nbGUgPCAwKSB7XG4gICAgICAgICAgICBhbmdsZSArPSAzNjA7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gVmVyeSBzbWFsbCBhbmdsZXMgcHJvZHVjZSBhbiB1bmV4cGVjdGVkIHJlc3VsdCBiZWNhdXNlIHRoZXkgYXJlXG4gICAgICAgICAgLy8gY29udmVydGVkIHRvIGEgc2NpZW50aWZpYyBub3RhdGlvbiBzdHJpbmcuXG4gICAgICAgICAgaWYgKGFuZ2xlIDwgMWUtNikge1xuICAgICAgICAgICAgYW5nbGUgPSAwO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgcDAgPSBnZXRDb29yZHMoY3R4LCBmaWxsU3R5bGUueDBfLCBmaWxsU3R5bGUueTBfKTtcbiAgICAgICAgICBmb2N1cyA9IHtcbiAgICAgICAgICAgIHg6IChwMC54IC0gbWluLngpIC8gd2lkdGgsXG4gICAgICAgICAgICB5OiAocDAueSAtIG1pbi55KSAvIGhlaWdodFxuICAgICAgICAgIH07XG5cbiAgICAgICAgICB3aWR0aCAvPSBzY2FsZVggKiBaO1xuICAgICAgICAgIGhlaWdodCAvPSBzY2FsZVkgKiBaO1xuICAgICAgICAgIHZhciBkaW1lbnNpb24gPSBtLm1heCh3aWR0aCwgaGVpZ2h0KTtcbiAgICAgICAgICBzaGlmdCA9IDIgKiBmaWxsU3R5bGUucjBfIC8gZGltZW5zaW9uO1xuICAgICAgICAgIGV4cGFuc2lvbiA9IDIgKiBmaWxsU3R5bGUucjFfIC8gZGltZW5zaW9uIC0gc2hpZnQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBXZSBuZWVkIHRvIHNvcnQgdGhlIGNvbG9yIHN0b3BzIGluIGFzY2VuZGluZyBvcmRlciBieSBvZmZzZXQsXG4gICAgICAgIC8vIG90aGVyd2lzZSBJRSB3b24ndCBpbnRlcnByZXQgaXQgY29ycmVjdGx5LlxuICAgICAgICB2YXIgc3RvcHMgPSBmaWxsU3R5bGUuY29sb3JzXztcbiAgICAgICAgc3RvcHMuc29ydChmdW5jdGlvbihjczEsIGNzMikge1xuICAgICAgICAgIHJldHVybiBjczEub2Zmc2V0IC0gY3MyLm9mZnNldDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIGxlbmd0aCA9IHN0b3BzLmxlbmd0aDtcbiAgICAgICAgdmFyIGNvbG9yMSA9IHN0b3BzWzBdLmNvbG9yO1xuICAgICAgICB2YXIgY29sb3IyID0gc3RvcHNbbGVuZ3RoIC0gMV0uY29sb3I7XG4gICAgICAgIHZhciBvcGFjaXR5MSA9IHN0b3BzWzBdLmFscGhhICogYXR0cl8uZ2xvYmFsQWxwaGE7XG4gICAgICAgIHZhciBvcGFjaXR5MiA9IHN0b3BzW2xlbmd0aCAtIDFdLmFscGhhICogYXR0cl8uZ2xvYmFsQWxwaGE7XG5cbiAgICAgICAgdmFyIGNvbG9ycyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgdmFyIHN0b3AgPSBzdG9wc1tpXTtcbiAgICAgICAgICBjb2xvcnMucHVzaChzdG9wLm9mZnNldCAqIGV4cGFuc2lvbiArIHNoaWZ0ICsgJyAnICsgc3RvcC5jb2xvcik7XG4gICAgICAgIH1cblxuICAgICAgICBmaWxsRWxfLnR5cGUgPSBmaWxsU3R5bGUudHlwZV87XG4gICAgICAgIGZpbGxFbF8ubWV0aG9kID0gJ25vbmUnO1xuICAgICAgICBmaWxsRWxfLmZvY3VzID0gJzEwMCUnO1xuICAgICAgICBmaWxsRWxfLmNvbG9yID0gY29sb3IxO1xuICAgICAgICBmaWxsRWxfLmNvbG9yMiA9IGNvbG9yMjtcbiAgICAgICAgZmlsbEVsXy5jb2xvcnMgPSBjb2xvcnMuam9pbignLCcpO1xuICAgICAgICBmaWxsRWxfLm9wYWNpdHkgPSBvcGFjaXR5MjtcbiAgICAgICAgZmlsbEVsXy5zZXRBdHRyaWJ1dGUoJ2dfb186b3BhY2l0eTInLCBvcGFjaXR5MSk7XG4gICAgICAgIGZpbGxFbF8uYW5nbGUgPSBhbmdsZTtcbiAgICAgICAgZmlsbEVsXy5mb2N1c3Bvc2l0aW9uID0gZm9jdXMueCArICcsJyArIGZvY3VzLnk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmICgoZmlsbFN0eWxlIGluc3RhbmNlb2YgQ2FudmFzUGF0dGVybl8pICYmIGF0dHJfLm1pbikge1xuICAgICAgICBpZiAod2lkdGggJiYgaGVpZ2h0KSB7XG4gICAgICAgICAgdmFyIGRlbHRhTGVmdCA9IC1hdHRyXy5taW4ueDtcbiAgICAgICAgICB2YXIgZGVsdGFUb3AgPSAtYXR0cl8ubWluLnk7XG4gICAgICAgICAgZmlsbEVsXy5wb3NpdGlvbiA9IGRlbHRhTGVmdCAvIHdpZHRoICogc2NhbGVYICogc2NhbGVYICsgJywnICtcbiAgICAgICAgICAgIGRlbHRhVG9wIC8gaGVpZ2h0ICogc2NhbGVZICogc2NhbGVZO1xuICAgICAgICAgIGZpbGxFbF8udHlwZSA9ICd0aWxlJztcbiAgICAgICAgICBmaWxsRWxfLnNyYyA9IGZpbGxTdHlsZS5zcmNfO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgdmFyIGEgPSBwcm9jZXNzU3R5bGUoZmlsbFN0eWxlKTtcbiAgICAgICAgdmFyIGNvbG9yID0gYS5jb2xvcjtcbiAgICAgICAgdmFyIG9wYWNpdHkgPSBhLmFscGhhICogYXR0cl8uZ2xvYmFsQWxwaGE7XG4gICAgICAgIGZpbGxFbF8uY29sb3IgPSBjb2xvcjtcbiAgICAgICAgaWYgKG9wYWNpdHkgPCAxKSB7XG4gICAgICAgICAgZmlsbEVsXy5vcGFjaXR5ID0gb3BhY2l0eTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBTaGFwZVZpcnR1YWxEb21fLnByb3RvdHlwZS5kb1N0cm9rZV8gPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGF0dHJfID0gdGhpcy5hdHRyXztcbiAgICB2YXIgYXR0clByZXZfID0gdGhpcy5hdHRyUHJldl87XG4gICAgaWYgKGF0dHJfLnN0cm9rZWQgIT09IGF0dHJQcmV2Xy5zdHJva2VkKSB7XG4gICAgICB2YXIgcm9vdEVsXyA9IHRoaXMucm9vdEVsXztcbiAgICAgIGlmIChhdHRyXy5zdHJva2VkKSB7XG4gICAgICAgIGlmICghdGhpcy5zdHJva2VFbF8pIHtcbiAgICAgICAgICB0aGlzLnN0cm9rZUVsXyA9IGNyZWF0ZVZNTEVsZW1lbnQoJ3N0cm9rZScpO1xuICAgICAgICAgIC8vIFBFTkRJTkcgXG4gICAgICAgICAgLy8gU2V0IGRlZmF1bHQgYXR0cmlidXRlID9cbiAgICAgICAgfVxuICAgICAgICByb290RWxfLnN0cm9rZWQgPSAndHJ1ZSc7XG4gICAgICAgIHJvb3RFbF8uYXBwZW5kQ2hpbGQodGhpcy5zdHJva2VFbF8pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcm9vdEVsXy5zdHJva2VkID0gJ2ZhbHNlJztcbiAgICAgICAgaWYgKHRoaXMuc3Ryb2tlRWxfKSB7XG4gICAgICAgICAgcm9vdEVsXy5yZW1vdmVDaGlsZCh0aGlzLnN0cm9rZUVsXyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWF0dHJfLnN0cm9rZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICBhdHRyXy5zdHJva2VTdHlsZSAhPT0gYXR0clByZXZfLnN0cm9rZVN0eWxlIHx8XG4gICAgICBhdHRyXy5nbG9iYWxBbHBoYSAhPT0gYXR0clByZXZfLmdsb2JhbEFscGhhIHx8XG4gICAgICBhdHRyXy5saW5lV2lkdGggIT09IGF0dHJQcmV2Xy5saW5lV2lkdGhcbiAgICApIHtcbiAgICAgIHZhciBhID0gcHJvY2Vzc1N0eWxlKGF0dHJfLnN0cm9rZVN0eWxlKTtcbiAgICAgIHZhciBvcGFjaXR5ID0gYS5hbHBoYSAqIGF0dHJfLmdsb2JhbEFscGhhO1xuICAgICAgdmFyIGxpbmVXaWR0aCA9IGF0dHJfLmxpbmVXaWR0aDtcbiAgICAgIC8vIFZNTCBjYW5ub3QgY29ycmVjdGx5IHJlbmRlciBhIGxpbmUgaWYgdGhlIHdpZHRoIGlzIGxlc3MgdGhhbiAxcHguXG4gICAgICAvLyBJbiB0aGF0IGNhc2UsIHdlIGRpbHV0ZSB0aGUgY29sb3IgdG8gbWFrZSB0aGUgbGluZSBsb29rIHRoaW5uZXIuXG4gICAgICBpZiAobGluZVdpZHRoIDwgMSkge1xuICAgICAgICBvcGFjaXR5ICo9IGxpbmVXaWR0aDtcbiAgICAgIH1cbiAgICAgIGlmIChvcGFjaXR5IDwgMSkge1xuICAgICAgICB0aGlzLnN0cm9rZUVsXy5vcGFjaXR5ID0gb3BhY2l0eTtcbiAgICAgIH1cbiAgICAgIHRoaXMuc3Ryb2tlRWxfLmNvbG9yID0gYS5jb2xvcjtcbiAgICB9XG4gICAgaWYgKGF0dHJfLmxpbmVKb2luICE9PSBhdHRyUHJldl8ubGluZUpvaW4pIHtcbiAgICAgIHRoaXMuc3Ryb2tlRWxfLmpvaW5zdHlsZSA9IGF0dHJfLmxpbmVKb2luO1xuICAgIH1cbiAgICBpZiAoYXR0cl8ubWl0ZXJMaW1pdCAhPT0gYXR0clByZXZfLm1pdGVyTGltaXQpIHtcbiAgICAgIHRoaXMuc3Ryb2tlRWxfLm1pdGVybGltaXQgPSBhdHRyXy5taXRlckxpbWl0O1xuICAgIH1cbiAgICBpZiAoYXR0cl8ubGluZUNhcCAhPT0gYXR0clByZXZfLmxpbmVDYXApIHtcbiAgICAgIHRoaXMuc3Ryb2tlRWxfLmVuZGNhcCA9IHByb2Nlc3NMaW5lQ2FwKGF0dHJfLmxpbmVDYXApO1xuICAgIH1cbiAgICBpZiAobGluZVdpZHRoICE9PSBhdHRyUHJldl8ubGluZVdpZHRoKSB7XG4gICAgICB0aGlzLnN0cm9rZUVsXy53ZWlnaHQgPSBsaW5lV2lkdGggKyAncHgnO1xuICAgIH1cbiAgfTtcblxuICBTaGFwZVZpcnR1YWxEb21fLnByb3RvdHlwZS5mbHVzaCA9IGZ1bmN0aW9uIChjdHgpIHtcbiAgICB2YXIgYXR0cl8gPSB0aGlzLmF0dHJfO1xuICAgIHZhciBhdHRyUHJldl8gPSB0aGlzLmF0dHJQcmV2XztcbiAgICBpZiAoYXR0cl8ueCAhPT0gYXR0clByZXZfLngpIHtcbiAgICAgIHRoaXMucm9vdEVsXy5zdHlsZS5sZWZ0ID0gYXR0cl8ueCArICdweCc7XG4gICAgfVxuICAgIGlmIChhdHRyXy55ICE9PSBhdHRyUHJldl8ueSkge1xuICAgICAgdGhpcy5yb290RWxfLnN0eWxlLnRvcCA9IGF0dHJfLnkgKyAncHgnO1xuICAgIH1cbiAgICBpZiAoYXR0cl8ucGF0aCAhPT0gYXR0clByZXZfLnBhdGgpIHtcbiAgICAgIHRoaXMucm9vdEVsXy5wYXRoID0gYXR0cl8ucGF0aDtcbiAgICB9XG4gICAgdGhpcy5kb0ZpbGxfKCk7XG4gICAgdGhpcy5kb1N0cm9rZV8oKTtcblxuICAgIGNvcHlTaGFwZUF0dHIoYXR0clByZXZfLCBhdHRyXyk7XG4gIH1cblxuICAvKipcbiAgICogVmlydHVhbCB0ZXh0IGRvbSBpcyBjcmVhdGVkIGJ5IGZpbGxUZXh0IGFuZCBzdHJva2VUZXh0IG9wZXJhdGlvbi5cbiAgICogSXQgd2lsbCBiZSBjYWNoZWQgaW4gQ29udGV4dDJEIG9iamVjdC4gQW5kIGNyZWF0ZWQgb25seSBpZiBuZWVkZWQgd2hlbiByZWRyYXdpbmdcbiAgICogQGF1dGhvciBodHRwczovL2dpdGh1Yi5jb20vcGlzc2FuZy9cbiAgICovXG4gIGZ1bmN0aW9uIFRleHRWaXJ0dWFsRG9tXygpIHtcbiAgICAvLyB0aGlzLnJvb3RFbF8gPSBudWxsO1xuICAgIC8vIHRoaXMuc2tld0VsXyA9IG51bGw7XG4gICAgLy8gdGhpcy50ZXh0UGF0aEVsXyA9IG51bGw7XG4gICAgLy8gdGhpcy5zaW1wbGVSb290RWxfID0gbnVsbDtcblxuICAgIHRoaXMuYXR0cl8gPSBjcmVhdGVUZXh0QXR0cigpO1xuICAgIHRoaXMuYXR0clByZXZfID0ge307XG4gIH1cblxuICBUZXh0VmlydHVhbERvbV8ucHJvdG90eXBlLmdldEVsZW1lbnQgPSBmdW5jdGlvbiAoY3R4LCB0ZXh0LCB4LCB5LCBtYXhXaWR0aCwgc3Ryb2tlKSB7XG4gICAgaWYgKCF0aGlzLnJvb3RFbF8pIHtcbiAgICAgIHRoaXMuY3JlYXRlRWxfKCk7XG4gICAgfVxuICAgIHZhciBtXyA9IGN0eC5tXztcblxuICAgIHZhciBhdHRyXyA9IHRoaXMuYXR0cl87XG4gICAgYXR0cl8udGV4dCA9IHRleHQ7XG5cbiAgICBhdHRyXy5zeCA9IHg7XG4gICAgYXR0cl8uc3kgPSB5O1xuICAgIGF0dHJfLm1heFdpZHRoID0gbWF4V2lkdGg7XG4gICAgYXR0cl8udGV4dEFsaWduID0gY3R4LnRleHRBbGlnbjtcbiAgICBhdHRyXy50ZXh0QmFzZWxpbmUgPSBjdHgudGV4dEJhc2VsaW5lO1xuXG4gICAgYXR0cl8uc3Ryb2tlZCA9ICEhc3Ryb2tlO1xuICAgIGF0dHJfLmZpbGxlZCA9ICFzdHJva2U7XG5cbiAgICB2YXIgZm9udFN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShwcm9jZXNzRm9udFN0eWxlKGN0eC5mb250KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5lbGVtZW50Xyk7XG4gICAgdmFyIGZvbnRTdHlsZVN0cmluZyA9IGJ1aWxkU3R5bGUoZm9udFN0eWxlKTtcblxuICAgIGF0dHJfLmZvbnQgPSBmb250U3R5bGVTdHJpbmc7XG5cbiAgICB2YXIgb2Zmc2V0ID0ge3g6IDAsIHk6IDB9O1xuICAgIC8vIDEuNzUgaXMgYW4gYXJiaXRyYXJ5IG51bWJlciwgYXMgdGhlcmUgaXMgbm8gaW5mbyBhYm91dCB0aGUgdGV4dCBiYXNlbGluZVxuICAgIHN3aXRjaCAoY3R4LnRleHRCYXNlbGluZSkge1xuICAgICAgY2FzZSAnaGFuZ2luZyc6XG4gICAgICBjYXNlICd0b3AnOlxuICAgICAgICBvZmZzZXQueSA9IGZvbnRTdHlsZS5zaXplIC8gMS43NTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdtaWRkbGUnOlxuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICBjYXNlIG51bGw6XG4gICAgICBjYXNlICdhbHBoYWJldGljJzpcbiAgICAgIGNhc2UgJ2lkZW9ncmFwaGljJzpcbiAgICAgIGNhc2UgJ2JvdHRvbSc6XG4gICAgICAgIG9mZnNldC55ID0gLWZvbnRTdHlsZS5zaXplIC8gMi4yNTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgdmFyIGQgPSBnZXRDb29yZHMoY3R4LCB4ICsgb2Zmc2V0LngsIHkgKyBvZmZzZXQueSk7XG4gICAgYXR0cl8ub2ZmWCA9IGQueDtcbiAgICBhdHRyXy5vZmZZID0gZC55O1xuICAgIC8vIGF0dHJfLnNrZXdlZCA9IGlzTm90QXJvdW5kWmVybyhtX1swXSAtIDEpIHx8IGlzTm90QXJvdW5kWmVybyhtX1sxXSkgfHxcbiAgICAgICAgLy8gaXNOb3RBcm91bmRaZXJvKG1fWzNdIC0gMSkgfHwgaXNOb3RBcm91bmRaZXJvKG1fWzJdKVxuICAgIGF0dHJfLnNrZXdNID0gbV9bMF1bMF0udG9GaXhlZCgzKSArICcsJyArIG1fWzFdWzBdLnRvRml4ZWQoMykgKyAnLCcgK1xuICAgICAgICAgICAgICAgIG1fWzBdWzFdLnRvRml4ZWQoMykgKyAnLCcgKyBtX1sxXVsxXS50b0ZpeGVkKDMpO1xuXG4gICAgaWYgKHN0cm9rZSkge1xuICAgICAgYXR0cl8uZ2xvYmFsQWxwaGEgPSBjdHguZ2xvYmFsQWxwaGE7XG4gICAgICBhdHRyXy5saW5lQ2FwID0gY3R4LmxpbmVDYXA7XG4gICAgICBhdHRyXy5saW5lSm9pbiA9IGN0eC5saW5lSm9pbjtcbiAgICAgIGF0dHJfLmxpbmVXaWR0aCA9IGN0eC5saW5lV2lkdGggKiBjdHgubGluZVNjYWxlXztcbiAgICAgIGF0dHJfLm1pdGVybGltaXQgPSBjdHgubWl0ZXJsaW1pdDtcbiAgICAgIGF0dHJfLnN0cm9rZVN0eWxlID0gY3R4LnN0cm9rZVN0eWxlO1xuICAgIH0gZWxzZSB7XG4gICAgICBhdHRyXy5maWxsU3R5bGUgPSBjdHguZmlsbFN0eWxlO1xuICAgICAgYXR0cl8uZ2xvYmFsQWxwaGEgPSBjdHguZ2xvYmFsQWxwaGE7IFxuICAgIH1cbiAgICAvLyBUT0RPIEl0IGlzIHN0cmFuZ2UgdGhhdCBmbHVzaCBhZnRlciB0aGUgcm9vdEVsIGhhcyBiZWVuIGFwcGVuZGVkIHRvIGRvY3VtZW50XG4gICAgLy8gU2tld09mZnNldCBsaWtlICcxMCwgMTAnKHdoaWNoIG9uZSBpdGVtIGlzIG5vdCB6ZXJvKSB3aWxsIGNhdXNlIHRoZSBzaGFwZSBkaXNhcHBlYXJlZC5cbiAgICB0aGlzLmZsdXNoKGN0eCk7XG5cbiAgICByZXR1cm4gdGhpcy5yb290RWxfO1xuICB9O1xuXG4gIFRleHRWaXJ0dWFsRG9tXy5wcm90b3R5cGUuY3JlYXRlRWxfID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBXID0gMTA7XG4gICAgdmFyIEggPSAxMDtcbiAgICB0aGlzLnJvb3RFbF8gPSBjcmVhdGVWTUxFbGVtZW50KCdsaW5lJyk7XG4gICAgdmFyIHJvb3RFbF8gPSB0aGlzLnJvb3RFbF87XG4gICAgcm9vdEVsXy5jb29yZHNpemUgPSBaICogVyArICcgJyArIFogKiBIO1xuICAgIHJvb3RFbF8uY29vcmRvcmlnaW4gPSAnMCAwJztcbiAgICByb290RWxfLnN0eWxlLmNzc1RleHQgPSAncG9zaXRpb246YWJzb2x1dGU7d2lkdGg6MXB4O2hlaWdodDoxcHgnO1xuICAgIHJvb3RFbF8uc3Ryb2tlZCA9ICdmYWxzZSc7XG4gICAgcm9vdEVsXy5maWxsZWQgPSAnZmFsc2UnO1xuICB9O1xuXG4gIFRleHRWaXJ0dWFsRG9tXy5wcm90b3R5cGUuZmx1c2ggPSBmdW5jdGlvbiAoY3R4KSB7XG4gICAgdmFyIG1fID0gY3R4Lm1fO1xuICAgIHZhciBkZWx0YSA9IDEwMDA7XG4gICAgdmFyIGxlZnQgPSAwO1xuICAgIHZhciByaWdodCA9IGRlbHRhO1xuICAgIHZhciBhdHRyXyA9IHRoaXMuYXR0cl87XG4gICAgdmFyIGF0dHJQcmV2XyA9IHRoaXMuYXR0clByZXZfO1xuICAgIHZhciByb290RWxfID0gdGhpcy5yb290RWxfO1xuXG4gICAgaWYgKCF0aGlzLnNrZXdFbF8pIHtcbiAgICAgIHRoaXMuc2tld0VsXyA9IGNyZWF0ZVZNTEVsZW1lbnQoJ3NrZXcnKTtcbiAgICAgIHRoaXMuc2tld0VsXy5vbiA9ICd0JztcbiAgICAgIHRoaXMudGV4dFBhdGhFbF8gPSBjcmVhdGVWTUxFbGVtZW50KCd0ZXh0cGF0aCcpO1xuICAgICAgdGhpcy5wYXRoRWxfID0gY3JlYXRlVk1MRWxlbWVudCgncGF0aCcpO1xuICAgICAgdGhpcy5wYXRoRWxfLnRleHRwYXRob2sgPSAndHJ1ZSc7XG4gICAgICB0aGlzLnRleHRQYXRoRWxfLm9uID0gJ3RydWUnO1xuXG4gICAgICByb290RWxfLmFwcGVuZENoaWxkKHRoaXMuc2tld0VsXyk7XG4gICAgICByb290RWxfLmFwcGVuZENoaWxkKHRoaXMucGF0aEVsXyk7XG4gICAgICByb290RWxfLmFwcGVuZENoaWxkKHRoaXMudGV4dFBhdGhFbF8pO1xuICAgIH1cblxuICAgIHZhciBmb250U3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKHByb2Nlc3NGb250U3R5bGUodGhpcy5hdHRyXy5mb250KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5lbGVtZW50Xyk7XG4gICAgaWYgKFxuICAgICAgYXR0cl8uZm9udCAhPT0gYXR0clByZXZfLmZvbnQgfHxcbiAgICAgIGF0dHJfLnRleHQgIT09IGF0dHJQcmV2Xy50ZXh0XG4gICAgKSB7XG4gICAgICB0aGlzLnRleHRQYXRoRWxfLnN0cmluZyA9IGVuY29kZUh0bWxBdHRyaWJ1dGUoYXR0cl8udGV4dCk7XG4gICAgICB0aGlzLnRleHRQYXRoRWxfLnN0eWxlLmZvbnQgPSBlbmNvZGVIdG1sQXR0cmlidXRlKGF0dHJfLmZvbnQpO1xuICAgIH1cblxuICAgIGlmIChhdHRyXy50ZXh0QWxpZ24gIT09IGF0dHJQcmV2Xy50ZXh0QWxpZ24pIHtcbiAgICAgIHZhciBlbGVtZW50U3R5bGUgPSBjdHguZWxlbWVudF8uY3VycmVudFN0eWxlO1xuICAgICAgdmFyIHRleHRBbGlnbiA9IGF0dHJfLnRleHRBbGlnbi50b0xvd2VyQ2FzZSgpO1xuICAgICAgc3dpdGNoICh0ZXh0QWxpZ24pIHtcbiAgICAgICAgY2FzZSAnbGVmdCc6XG4gICAgICAgIGNhc2UgJ2NlbnRlcic6XG4gICAgICAgIGNhc2UgJ3JpZ2h0JzpcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnZW5kJzpcbiAgICAgICAgICB0ZXh0QWxpZ24gPSBlbGVtZW50U3R5bGUuZGlyZWN0aW9uID09ICdsdHInID8gJ3JpZ2h0JyA6ICdsZWZ0JztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnc3RhcnQnOlxuICAgICAgICAgIHRleHRBbGlnbiA9IGVsZW1lbnRTdHlsZS5kaXJlY3Rpb24gPT0gJ3J0bCcgPyAncmlnaHQnIDogJ2xlZnQnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHRleHRBbGlnbiA9ICdsZWZ0JztcbiAgICAgIH1cbiAgICAgIHN3aXRjaCh0ZXh0QWxpZ24pIHtcbiAgICAgICAgY2FzZSAncmlnaHQnOlxuICAgICAgICAgIGxlZnQgPSBkZWx0YTtcbiAgICAgICAgICByaWdodCA9IDAuMDU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2NlbnRlcic6XG4gICAgICAgICAgbGVmdCA9IHJpZ2h0ID0gZGVsdGEgLyAyO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgcm9vdEVsXy5mcm9tID0gLWxlZnQgKyAnIDAnO1xuICAgICAgcm9vdEVsXy50byA9IHJpZ2h0ICsgJyAwLjA1JztcbiAgICAgIHRoaXMuc2tld0VsXy5vcmlnaW4gPSBsZWZ0ICsgJyAwJztcbiAgICAgIHRoaXMudGV4dFBhdGhFbF8uc3R5bGVbJ3YtdGV4dC1hbGlnbiddID0gdGV4dEFsaWduO1xuICAgIH1cblxuICAgIC8vIGlmIChhdHRyXy5za2V3ZWQgfHwgc3Ryb2tlKSB7XG4gICAgaWYgKGF0dHJfLnNrZXdNICE9PSBhdHRyUHJldl8uc2tld00pIHtcbiAgICAgIHRoaXMuc2tld0VsXy5tYXRyaXggPSBhdHRyXy5za2V3TSArICcsMCwwJztcbiAgICB9XG5cbiAgICBpZiAoYXR0cl8ub2ZmWCAhPT0gYXR0clByZXZfLm9mZlggfHwgXG4gICAgICBhdHRyXy5vZmZZICE9PSBhdHRyUHJldl8ub2ZmWVxuICAgICkge1xuICAgICAgdmFyIHNrZXdPZmZzZXQgPSBtcihhdHRyXy5vZmZYIC8gWikgKyAnLCcgKyBtcihhdHRyXy5vZmZZIC8gWik7XG4gICAgICB0aGlzLnNrZXdFbF8ub2Zmc2V0ID0gc2tld09mZnNldDtcbiAgICB9XG4gICAgXG4gICAgaWYgKGF0dHJfLnN0cm9rZWQpIHtcbiAgICAgIHRoaXMuZG9TdHJva2VfKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZG9GaWxsXygpO1xuICAgIH1cblxuICAgIGNvcHlUZXh0QXR0cihhdHRyUHJldl8sIGF0dHJfKTtcblxuICAgIC8vIH0gZWxzZSB7XG4gICAgLy8gICBpZiAoIXRoaXMuc2ltcGxlUm9vdEVsXykge1xuICAgIC8vICAgICB0aGlzLnNpbXBsZVJvb3RFbF8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAvLyAgICAgdGhpcy5zaW1wbGVSb290RWxfLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICAvLyAgIH1cbiAgICAvLyAgIHRoaXMuc2ltcGxlUm9vdEVsXy5zdHlsZS5mb250ID0gZW5jb2RlSHRtbEF0dHJpYnV0ZShmb250U3R5bGVTdHJpbmcpO1xuXG4gICAgLy8gICB2YXIgYSA9IHByb2Nlc3NTdHlsZShjdHguZmlsbFN0eWxlKTtcbiAgICAvLyAgIHZhciBjb2xvciA9IGEuY29sb3I7XG4gICAgLy8gICB2YXIgb3BhY2l0eSA9IGEuYWxwaGEgKiBjdHguZ2xvYmFsQWxwaGE7XG4gICAgLy8gICB0aGlzLnNpbXBsZVJvb3RFbF8uc3R5bGUuY29sb3IgPSBjb2xvcjtcbiAgICAvLyAgIGlmIChvcGFjaXR5IDwgMSkge1xuICAgIC8vICAgICB0aGlzLnNpbXBsZVJvb3RFbF8uc3R5bGUuZmlsdGVyID0gJ2FscGhhKG9wYWNpdHk9JyArIG1yKG9wYWNpdHkgKiAxMDApICsnKSc7XG4gICAgLy8gICB9XG5cbiAgICAvLyAgIHRoaXMuc2ltcGxlUm9vdEVsXy5pbm5lckhUTUwgPSB0ZXh0O1xuXG4gICAgLy8gICBzd2l0Y2ggKGN0eC50ZXh0QmFzZWxpbmUpIHtcbiAgICAvLyAgICAgY2FzZSAnaGFuZ2luZyc6XG4gICAgLy8gICAgIGNhc2UgJ3RvcCc6XG4gICAgLy8gICAgICAgdGhpcy5zaW1wbGVSb290RWxfLnN0eWxlLnRvcCA9IG1fWzJdWzFdICsgeSArICdweCc7XG4gICAgLy8gICAgICAgYnJlYWs7XG4gICAgLy8gICAgIGNhc2UgJ21pZGRsZSc6XG4gICAgLy8gICAgICAgLy8gVE9ET1xuICAgIC8vICAgICAgIHRoaXMuc2ltcGxlUm9vdEVsXy5zdHlsZS50b3AgPSBtX1syXVsxXSArIHkgLSBmb250U3R5bGUuc2l6ZSAvIDIuMjUgKyAncHgnO1xuICAgIC8vICAgICAgIGJyZWFrO1xuICAgIC8vICAgICBkZWZhdWx0OlxuICAgIC8vICAgICBjYXNlIG51bGw6XG4gICAgLy8gICAgIGNhc2UgJ2FscGhhYmV0aWMnOlxuICAgIC8vICAgICBjYXNlICdpZGVvZ3JhcGhpYyc6XG4gICAgLy8gICAgIGNhc2UgJ2JvdHRvbSc6XG4gICAgLy8gICAgIC8vXG4gICAgLy8gICAgICAgdGhpcy5zaW1wbGVSb290RWxfLnN0eWxlLmJvdHRvbSA9IGN0eC5lbGVtZW50Xy5jbGllbnRIZWlnaHQgLSBtX1syXVsxXSAtIHkgKyAncHgnO1xuICAgIC8vICAgICAgIGJyZWFrO1xuICAgIC8vICAgfVxuXG4gICAgLy8gICBzd2l0Y2godGV4dEFsaWduKSB7XG4gICAgLy8gICAgIGNhc2UgJ3JpZ2h0JzpcbiAgICAvLyAgICAgICB0aGlzLnNpbXBsZVJvb3RFbF8uc3R5bGUucmlnaHQgPSBjdHguZWxlbWVudF8uY2xpZW50V2lkdGggLSBtX1syXVswXSAtIHggKyAncHgnO1xuICAgIC8vICAgICAgIGJyZWFrO1xuICAgIC8vICAgICBjYXNlICdjZW50ZXInOlxuICAgIC8vICAgICAgIC8vIFRPRE9cbiAgICAvLyAgICAgICB0aGlzLnNpbXBsZVJvb3RFbF8uc3R5bGUubGVmdCA9IG1fWzJdWzBdICsgeCAtIGZvbnRTdHlsZS5zaXplIC8gNC41ICogdGV4dC5sZW5ndGggKyAncHgnO1xuICAgIC8vICAgICAgIGJyZWFrO1xuICAgIC8vICAgICBjYXNlICdsZWZ0JzpcbiAgICAvLyAgICAgICB0aGlzLnNpbXBsZVJvb3RFbF8uc3R5bGUubGVmdCA9IG1fWzJdWzBdICsgeCArICdweCc7XG4gICAgLy8gICAgICAgYnJlYWs7XG4gICAgLy8gICB9XG4gICAgLy8gICByZXR1cm4gdGhpcy5zaW1wbGVSb290RWxfO1xuICAgIC8vIH1cbiAgfVxuXG4gIFRleHRWaXJ0dWFsRG9tXy5wcm90b3R5cGUuZG9GaWxsXyA9IFNoYXBlVmlydHVhbERvbV8ucHJvdG90eXBlLmRvRmlsbF87XG4gIFRleHRWaXJ0dWFsRG9tXy5wcm90b3R5cGUuZG9TdHJva2VfID0gU2hhcGVWaXJ0dWFsRG9tXy5wcm90b3R5cGUuZG9TdHJva2VfO1xuICBUZXh0VmlydHVhbERvbV8ucHJvdG90eXBlLmF0dGFjaFRvID0gU2hhcGVWaXJ0dWFsRG9tXy5wcm90b3R5cGUuYXR0YWNoVG87XG4gIFRleHRWaXJ0dWFsRG9tXy5wcm90b3R5cGUuZGV0YWNoID0gU2hhcGVWaXJ0dWFsRG9tXy5wcm90b3R5cGUuZGV0YWNoO1xuXG4gIC8qKlxuICAgKiBWaXJ0dWFsIGltYWdlIGRvbSBpcyBjcmVhdGVkIGJ5IGRyYXdJbWFnZSBvcGVyYXRpb24uXG4gICAqIEl0IHdpbGwgYmUgY2FjaGVkIGluIENvbnRleHQyRCBvYmplY3QuIEFuZCBjcmVhdGVkIG9ubHkgaWYgbmVlZGVkIHdoZW4gcmVkcmF3aW5nXG4gICAqIEBhdXRob3IgaHR0cHM6Ly9naXRodWIuY29tL3Bpc3NhbmcvXG4gICAqXG4gICAqIFRPRE8gSW1hZ2UgY3JvcHBpbmcgdGVzdGluZ1xuICAgKi9cbiAgZnVuY3Rpb24gSW1hZ2VWaXJ0dWFsRG9tXygpIHtcbiAgICAvLyB0aGlzLnJvb3RFbF8gPSBudWxsO1xuICAgIC8vIHRoaXMuY3JvcEVsXyA9IG51bGw7XG4gICAgLy8gdGhpcy5pbWFnZUVsXyA9IG51bGw7XG4gICAgLy8gdGhpcy5ncm91cEVsXyA9IG51bGw7XG5cbiAgICB0aGlzLmF0dHJfID0gY3JlYXRlSW1hZ2VBdHRyKCk7XG5cbiAgICB0aGlzLmF0dHJQcmV2XyA9IHt9O1xuICB9O1xuXG4gIEltYWdlVmlydHVhbERvbV8ucHJvdG90eXBlLmdldEVsZW1lbnQgPSBmdW5jdGlvbiAoY3R4LCBpbWFnZSwgdmFyX2FyZ3MpIHtcbiAgICB2YXIgZHgsIGR5LCBkdywgZGgsIHN4LCBzeSwgc3csIHNoO1xuXG4gICAgLy8gdG8gZmluZCB0aGUgb3JpZ2luYWwgd2lkdGggd2Ugb3ZlcmlkZSB0aGUgd2lkdGggYW5kIGhlaWdodFxuICAgIHZhciBvbGRSdW50aW1lV2lkdGggPSBpbWFnZS5ydW50aW1lU3R5bGUud2lkdGg7XG4gICAgdmFyIG9sZFJ1bnRpbWVIZWlnaHQgPSBpbWFnZS5ydW50aW1lU3R5bGUuaGVpZ2h0O1xuICAgIHZhciBtXyA9IGN0eC5tXztcbiAgICBpbWFnZS5ydW50aW1lU3R5bGUud2lkdGggPSAnYXV0byc7XG4gICAgaW1hZ2UucnVudGltZVN0eWxlLmhlaWdodCA9ICdhdXRvJztcblxuICAgIC8vIGdldCB0aGUgb3JpZ2luYWwgc2l6ZVxuICAgIHZhciB3ID0gaW1hZ2Uud2lkdGg7XG4gICAgdmFyIGggPSBpbWFnZS5oZWlnaHQ7XG5cbiAgICAvLyBhbmQgcmVtb3ZlIG92ZXJpZGVzXG4gICAgaW1hZ2UucnVudGltZVN0eWxlLndpZHRoID0gb2xkUnVudGltZVdpZHRoO1xuICAgIGltYWdlLnJ1bnRpbWVTdHlsZS5oZWlnaHQgPSBvbGRSdW50aW1lSGVpZ2h0O1xuXG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIHZhciBhdHRyXyA9IHRoaXMuYXR0cl87XG4gICAgYXR0cl8uZ2xvYmFsQWxwaGEgPSBjdHguZ2xvYmFsQWxwaGE7XG5cbiAgICB2YXIgc2NhbGVYID0gY3R4LnNjYWxlWF87XG4gICAgdmFyIHNjYWxlWSA9IGN0eC5zY2FsZVlfO1xuICAgIGlmIChhcmdzLmxlbmd0aCA9PSAzKSB7XG4gICAgICBkeCA9IGFyZ3NbMV07XG4gICAgICBkeSA9IGFyZ3NbMl07XG4gICAgICBzeCA9IHN5ID0gMDtcbiAgICAgIHN3ID0gZHcgPSB3O1xuICAgICAgc2ggPSBkaCA9IGg7XG4gICAgfSBlbHNlIGlmIChhcmdzLmxlbmd0aCA9PSA1KSB7XG4gICAgICBkeCA9IGFyZ3NbMV07XG4gICAgICBkeSA9IGFyZ3NbMl07XG4gICAgICBkdyA9IGFyZ3NbM107XG4gICAgICBkaCA9IGFyZ3NbNF07XG4gICAgICBzeCA9IHN5ID0gMDtcbiAgICAgIHN3ID0gdztcbiAgICAgIHNoID0gaDtcbiAgICB9IGVsc2UgaWYgKGFyZ3MubGVuZ3RoID09IDkpIHtcbiAgICAgIHN4ID0gYXJnc1sxXTtcbiAgICAgIHN5ID0gYXJnc1syXTtcbiAgICAgIHN3ID0gYXJnc1szXTtcbiAgICAgIHNoID0gYXJnc1s0XTtcbiAgICAgIGR4ID0gYXJnc1s1XTtcbiAgICAgIGR5ID0gYXJnc1s2XTtcbiAgICAgIGR3ID0gYXJnc1s3XTtcbiAgICAgIGRoID0gYXJnc1s4XTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgRXJyb3IoJ0ludmFsaWQgbnVtYmVyIG9mIGFyZ3VtZW50cycpO1xuICAgIH1cblxuICAgIC8vIEhhdmUgcm90YXRpb25cbiAgICBhdHRyXy5za2V3ZWQgPSBtX1swXVsxXSB8fCBtX1sxXVswXTtcblxuICAgIGlmIChhdHRyXy5za2V3ZWQpIHtcbiAgICAgIHZhciBkID0gZ2V0Q29vcmRzKGN0eCwgZHgsIGR5KTtcbiAgICAgIGF0dHJfLnggPSBkLng7XG4gICAgICBhdHRyXy55ID0gZC55O1xuICAgICAgdmFyIGZpbHRlciA9IFtdO1xuICAgICAgZmlsdGVyLnB1c2goJ00xMT0nLCBtX1swXVswXSAvIHNjYWxlWCwgJywnLFxuICAgICAgICAgICAgICAgICAgJ00xMj0nLCBtX1sxXVswXSAvIHNjYWxlWSwgJywnLFxuICAgICAgICAgICAgICAgICAgJ00yMT0nLCBtX1swXVsxXSAvIHNjYWxlWCwgJywnLFxuICAgICAgICAgICAgICAgICAgJ00yMj0nLCBtX1sxXVsxXSAvIHNjYWxlWSwgJywnLFxuICAgICAgICAgICAgICAgICAgJ0R4PScsIGQueCwgJywnLFxuICAgICAgICAgICAgICAgICAgJ0R5PScsIGQueSwgJycpO1xuICAgICAgYXR0cl8uc2tld00gPSBmaWx0ZXIuam9pbignJyk7XG5cbiAgICAgIC8vIEJvdW5kaW5nIGJveCBjYWxjdWxhdGlvbiAobmVlZCB0byBtaW5pbWl6ZSBkaXNwbGF5ZWQgYXJlYSBzbyB0aGF0XG4gICAgICAvLyBmaWx0ZXJzIGRvbid0IHdhc3RlIHRpbWUgb24gdW51c2VkIHBpeGVscy5cbiAgICAgIHZhciBtYXggPSBkO1xuICAgICAgdmFyIGMyID0gZ2V0Q29vcmRzKGN0eCwgZHggKyBkdywgZHkpO1xuICAgICAgdmFyIGMzID0gZ2V0Q29vcmRzKGN0eCwgZHgsIGR5ICsgZGgpO1xuICAgICAgdmFyIGM0ID0gZ2V0Q29vcmRzKGN0eCwgZHggKyBkdywgZHkgKyBkaCk7XG5cbiAgICAgIG1heC54ID0gbS5tYXgobWF4LngsIGMyLngsIGMzLngsIGM0LngpO1xuICAgICAgbWF4LnkgPSBtLm1heChtYXgueSwgYzIueSwgYzMueSwgYzQueSk7XG5cbiAgICAgIGF0dHJfLnBhZGRpbmcgPSBbMCwgTWF0aC5tYXgobXIobWF4LnggLyBaKSwgMCkgKyAncHgnLCBNYXRoLm1heChtcihtYXgueSAvIFopLCAwKSArICdweCcsIDBdLmpvaW4oJyAnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXR0cl8ueCA9IGR4ICogc2NhbGVYICsgY3R4LnhfO1xuICAgICAgYXR0cl8ueSA9IGR5ICogc2NhbGVZICsgY3R4LnlfO1xuICAgIH1cblxuICAgIGF0dHJfLmNyb3BwZWQgPSBzeCB8fCBzeTtcbiAgICBpZiAoYXR0cl8uY3JvcHBlZCkge1xuICAgICAgYXR0cl8uY3JvcFdpZHRoID0gTWF0aC5jZWlsKChkdyArIHN4ICogZHcgLyBzdykgKiBzY2FsZVgpO1xuICAgICAgYXR0cl8uY3JvcEhlaWdodCA9IE1hdGguY2VpbCgoZGggKyBzeSAqIGRoIC8gc2gpICogc2NhbGVZKTtcbiAgICAgIGF0dHJfLmNyb3BGaWx0ZXIgPSAncHJvZ2lkOkR4SW1hZ2VUcmFuc2Zvcm0uTWljcm9zb2Z0Lk1hdHJpeChEeD0nXG4gICAgICAgICAgKyAtZHcgLyBzdyAqIHNjYWxlWCAqIHN4ICsgJyxEeT0nICsgLWRoIC8gc2ggKiBzY2FsZVkgKiBzeSArICcpJztcbiAgICB9XG5cbiAgICBhdHRyXy53aWR0aCA9IHNjYWxlWCAqIGR3IC8gc3cgKiB3O1xuICAgIGF0dHJfLmhlaWdodCA9IHNjYWxlWSAqIGRoIC8gc2ggKiBoO1xuXG4gICAgYXR0cl8uaW1hZ2UgPSBpbWFnZS5zcmM7XG5cbiAgICBpZiAoIXRoaXMuaW1hZ2VFbF8pIHtcbiAgICAgIC8vIE5PVEVTXG4gICAgICAvLyBNYXRyaXggb2Ygcm9vdERvbSB3aWxsIG5vdCB3b3JrIGlmIGltYWdlRG9tLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJ1xuICAgICAgdGhpcy5pbWFnZUVsXyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xuICAgIH1cblxuICAgIGlmICghKGF0dHJfLnNrZXdlZCB8fCBhdHRyXy5jcm9wcGVkKSkge1xuICAgICAgdGhpcy5yb290RWxfID0gdGhpcy5pbWFnZUVsXztcbiAgICB9IGVsc2UgaWYgKGF0dHJfLnNrZXdlZCkge1xuICAgICAgaWYgKCF0aGlzLmdyb3VwRWxfKSB7XG4gICAgICAgIHRoaXMuY3JlYXRlR3JvdXBFbF8oKTtcbiAgICAgIH1cbiAgICAgIHRoaXMucm9vdEVsXyA9IHRoaXMuZ3JvdXBFbF87XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICghdGhpcy5jcm9wRWxfKSB7XG4gICAgICAgIHRoaXMuY3JvcEVsXyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICB0aGlzLmNyb3BFbF8uc3R5bGUuY3NzVGV4dCA9ICdwb3NpdGlvbjphYnNvbHV0ZTsgb3ZlcmZsb3c6aGlkZGVuOyc7XG4gICAgICB9XG4gICAgICB0aGlzLnJvb3RFbF8gPSB0aGlzLmNyb3BFbF87XG4gICAgfVxuXG4gICAgdGhpcy5mbHVzaChjdHgpO1xuICAgIHJldHVybiB0aGlzLnJvb3RFbF87XG4gIH07XG5cbiAgSW1hZ2VWaXJ0dWFsRG9tXy5wcm90b3R5cGUuY3JlYXRlR3JvdXBFbF8gPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIFcgPSAxMDtcbiAgICB2YXIgSCA9IDEwO1xuXG4gICAgLy8gRm9yIHNvbWUgcmVhc29uIHRoYXQgSSd2ZSBub3cgZm9yZ290dGVuLCB1c2luZyBkaXZzIGRpZG4ndCB3b3JrXG4gICAgdGhpcy5ncm91cEVsXyA9IGNyZWF0ZVZNTEVsZW1lbnQoJ2dyb3VwJyk7XG4gICAgdGhpcy5ncm91cEVsXy5jb29yZHNpemUgPSBaICogVyArICcgJyArIFogKiBIO1xuICAgIHRoaXMuZ3JvdXBFbF8uY29vcmRvcmlnaW4gPSAnMCAwJztcblxuICAgIHRoaXMuZ3JvdXBFbF8uc3R5bGUuY3NzVGV4dCA9IFsncG9zaXRpb246YWJzb2x1dGU7d2lkdGg6JywgVywgJ3B4O2hlaWdodDonLCBILCAncHgnXS5qb2luKCcnKTtcbiAgfVxuXG4gIEltYWdlVmlydHVhbERvbV8ucHJvdG90eXBlLmZsdXNoID0gZnVuY3Rpb24gKGN0eCkge1xuICAgIHZhciBhdHRyXyA9IHRoaXMuYXR0cl87XG4gICAgdmFyIGF0dHJQcmV2XyA9IHRoaXMuYXR0clByZXZfO1xuICAgIHZhciB3MiA9IGF0dHJfLnN3IC8gMjtcbiAgICB2YXIgaDIgPSBhdHRyXy5zaCAvIDI7XG5cbiAgICB2YXIgaW1hZ2VFbF8gPSB0aGlzLmltYWdlRWxfO1xuXG4gICAgLy8gSWYgZmlsdGVycyBhcmUgbmVjZXNzYXJ5IChyb3RhdGlvbiBleGlzdHMpLCBjcmVhdGUgdGhlbVxuICAgIC8vIGZpbHRlcnMgYXJlIGJvZy1zbG93LCBzbyBvbmx5IGNyZWF0ZSB0aGVtIGlmIGFiYnNvbHV0ZWx5IG5lY2Vzc2FyeVxuICAgIC8vIFRoZSBmb2xsb3dpbmcgY2hlY2sgZG9lc24ndCBhY2NvdW50IGZvciBza2V3cyAod2hpY2ggZG9uJ3QgZXhpc3RcbiAgICAvLyBpbiB0aGUgY2FudmFzIHNwZWMgKHlldCkgYW55d2F5LlxuICAgIGlmICghYXR0cl8uc2tld2VkICYmICFhdHRyXy5jcm9wcGVkKSB7XG4gICAgICBpZiAoYXR0cl8ueCAhPT0gYXR0clByZXZfLngpIHtcbiAgICAgICAgaW1hZ2VFbF8uc3R5bGUubGVmdCA9IGF0dHJfLnggKyAncHgnO1xuICAgICAgfVxuICAgICAgaWYgKGF0dHJfLnkgIT09IGF0dHJQcmV2Xy55KSB7XG4gICAgICAgIGltYWdlRWxfLnN0eWxlLnRvcCA9IGF0dHJfLnkgKyAncHgnO1xuICAgICAgfVxuICAgICAgaWYgKCFhdHRyUHJldl8uc2tld2VkKSB7XG4gICAgICAgIGltYWdlRWxfLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGltYWdlRWxfLnN0eWxlLnBvc2l0aW9uID0gJ3N0YXRpYyc7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChhdHRyXy5za2V3ZWQpIHtcbiAgICAgIHZhciBncm91cEVsXyA9IHRoaXMuZ3JvdXBFbF87XG4gICAgICBpZiAoYXR0cl8ucGFkZGluZyAhPT0gYXR0clByZXZfLnBhZGRpbmcpIHtcbiAgICAgICAgZ3JvdXBFbF8uc3R5bGUucGFkZGluZyA9IGF0dHJfLnBhZGRpbmc7XG4gICAgICB9XG5cbiAgICAgIGlmIChhdHRyXy5za2V3TSAhPT0gYXR0clByZXZfLnNrZXdNKSB7XG4gICAgICAgIGdyb3VwRWxfLnN0eWxlLmZpbHRlciA9ICdwcm9naWQ6RFhJbWFnZVRyYW5zZm9ybS5NaWNyb3NvZnQuTWF0cml4KCdcbiAgICAgICAgICArIGF0dHJfLnNrZXdNICsgXCIsIFNpemluZ01ldGhvZD0nY2xpcCcpXCI7XG4gICAgICB9XG5cbiAgICAgIGlmIChhdHRyXy5jcm9wcGVkKSB7XG4gICAgICAgIGlmICghYXR0clByZXZfLmNyb3BwZWQpIHtcbiAgICAgICAgICBncm91cEVsXy5hcHBlbmRDaGlsZCh0aGlzLmNyb3BFbF8pO1xuICAgICAgICAgIHRoaXMuY3JvcEVsXy5hcHBlbmRDaGlsZChpbWFnZUVsXyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICghYXR0clByZXZfLnNrZXdlZCkge1xuICAgICAgICAgIGdyb3VwRWxfLmFwcGVuZENoaWxkKGltYWdlRWxfKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoYXR0cl8uY3JvcHBlZCkge1xuICAgICAgaWYgKCFhdHRyUHJldl8uY3JvcHBlZCkge1xuICAgICAgICB0aGlzLmNyb3BFbF8uYXBwZW5kQ2hpbGQoaW1hZ2VFbF8pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIERyYXcgYSBzcGVjaWFsIGNyb3BwaW5nIGRpdiBpZiBuZWVkZWRcbiAgICBpZiAoYXR0cl8uY3JvcHBlZCkge1xuICAgICAgdmFyIGdyb3VwRWxfID0gdGhpcy5ncm91cEVsXztcbiAgICAgIGlmIChhdHRyXy5jcm9wV2lkdGggIT09IGF0dHJQcmV2Xy5jcm9wV2lkdGgpIHtcbiAgICAgICAgdGhpcy5jcm9wRWxfLnN0eWxlLndpZHRoID0gYXR0cl8uY3JvcFdpZHRoICsgJ3B4JztcbiAgICAgIH1cbiAgICAgIGlmIChhdHRyXy5jcm9wSGVpZ2h0ICE9PSBhdHRyUHJldl8uY3JvcEhlaWdodCkge1xuICAgICAgICB0aGlzLmNyb3BFbF8uc3R5bGUuaGVpZ2h0ID0gYXR0cl8uY3JvcEhlaWdodCArICdweCc7XG4gICAgICB9XG4gICAgICBpZiAoYXR0cl8uZmlsdGVyICE9PSBhdHRyUHJldl8uZmlsdGVyKSB7XG4gICAgICAgIHRoaXMuY3JvcEVsXy5zdHlsZS5maWx0ZXIgPSBhdHRyXy5maWx0ZXI7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGF0dHJfLndpZHRoICE9PSBhdHRyUHJldl8ud2lkdGgpIHtcbiAgICAgIGltYWdlRWxfLnN0eWxlLndpZHRoID0gYXR0cl8ud2lkdGggKyAncHgnO1xuICAgIH1cbiAgICBpZiAoYXR0cl8uaGVpZ2h0ICE9PSBhdHRyUHJldl8uaGVpZ2h0KSB7XG4gICAgICBpbWFnZUVsXy5zdHlsZS5oZWlnaHQgPSBhdHRyXy5oZWlnaHQgKyAncHgnO1xuICAgIH1cblxuICAgIGlmIChhdHRyXy5pbWFnZSAhPT0gYXR0clByZXZfLmltYWdlKSB7XG4gICAgICBpbWFnZUVsXy5zcmMgPSBhdHRyXy5pbWFnZTtcbiAgICB9XG4gICAgaWYgKGF0dHJfLmdsb2JhbEFscGhhICE9PSBhdHRyUHJldl8uZ2xvYmFsQWxwaGEpIHtcbiAgICAgIGlmIChpbWFnZUVsXy5zdHlsZS5nbG9iYWxBbHBoYSA8IDEpIHtcbiAgICAgICAgaW1hZ2VFbF8uc3R5bGUuZmlsdGVyID0gJ2FscGhhKG9wYWNpdHk9JyArIG1yKGF0dHJfLmdsb2JhbEFscGhhICogMTAwKSArJyknO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW1hZ2VFbF8uc3R5bGUuZmlsdGVyID0gJyc7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29weUltYWdlQXR0cih0aGlzLmF0dHJQcmV2XywgdGhpcy5hdHRyXyk7XG4gIH1cblxuICBJbWFnZVZpcnR1YWxEb21fLnByb3RvdHlwZS5hdHRhY2hUbyA9IFNoYXBlVmlydHVhbERvbV8ucHJvdG90eXBlLmF0dGFjaFRvO1xuICBJbWFnZVZpcnR1YWxEb21fLnByb3RvdHlwZS5kZXRhY2ggPSBTaGFwZVZpcnR1YWxEb21fLnByb3RvdHlwZS5kZXRhY2g7XG5cbiAgLyoqXG4gICAqIFRoaXMgY2xhc3MgaW1wbGVtZW50cyBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQgaW50ZXJmYWNlIGFzIGRlc2NyaWJlZCBieVxuICAgKiB0aGUgV0hBVFdHLlxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBjYW52YXNFbGVtZW50IFRoZSBlbGVtZW50IHRoYXQgdGhlIDJEIGNvbnRleHQgc2hvdWxkXG4gICAqIGJlIGFzc29jaWF0ZWQgd2l0aFxuICAgKi9cbiAgZnVuY3Rpb24gQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEXyhjYW52YXNFbGVtZW50KSB7XG4gICAgdGhpcy5tXyA9IGNyZWF0ZU1hdHJpeElkZW50aXR5KCk7XG5cbiAgICB0aGlzLm1TdGFja18gPSBbXTtcbiAgICB0aGlzLmFTdGFja18gPSBbXTtcbiAgICB0aGlzLmN1cnJlbnRQYXRoXyA9IFtdO1xuXG4gICAgLy8gTk9URVNcbiAgICAvLyBodHRwOi8vbG91aXNyZW1pLmNvbS8yMDA5LzAzLzMwL2NoYW5nZXMtaW4tdm1sLWZvci1pZTgtb3Itd2hhdC1mZWF0dXJlLWNhbi10aGUtaWUtZGV2LXRlYW0tYnJlYWstZm9yLXlvdS10b2RheS9cbiAgICAvLyBJdCBpcyBubyBsb25nZXIgcG9zc2libGUgdG8gY3JlYXRlIGEgVk1MIGVsZW1lbnQgb3V0c2lkZSBvZiB0aGUgRE9NXG4gICAgLy8gdGhpcy5mcmFnbWVudF8gPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgXG4gICAgLy8gS2VlcCBjdXJyZW50IGRyYXdlZCBkb20uIFNvIHdlIGNhbiBtZXJnZSBmaWxsIGFuZCBzdHJva2UgaW4gb25lIHNoYXBlIGRvbVxuICAgIHRoaXMuY3VycmVudFZpcnR1YWxEb21fID0gbnVsbDtcblxuICAgIC8vIENhY2hlIHRoZSBjcmVhdGVkIGRvbVxuICAgIHRoaXMuc2hhcGVWRG9tTGlzdF8gPSBbXTtcbiAgICB0aGlzLnRleHRWRG9tTGlzdF8gPSBbXTtcbiAgICB0aGlzLmltYWdlVkRvbUxpc3RfID0gW107XG5cbiAgICB0aGlzLm5TaGFwZVZFbF8gPSAwO1xuICAgIHRoaXMublRleHRWRWxfID0gMDtcbiAgICB0aGlzLm5JbWFnZVZFbF8gPSAwO1xuXG4gICAgLy8gQ2FudmFzIGNvbnRleHQgcHJvcGVydGllc1xuICAgIHRoaXMuc3Ryb2tlU3R5bGUgPSAnIzAwMCc7XG4gICAgdGhpcy5maWxsU3R5bGUgPSAnIzAwMCc7XG5cbiAgICB0aGlzLmxpbmVXaWR0aCA9IDE7XG4gICAgdGhpcy5saW5lSm9pbiA9ICdtaXRlcic7XG4gICAgdGhpcy5saW5lQ2FwID0gJ2J1dHQnO1xuICAgIHRoaXMubWl0ZXJMaW1pdCA9IFogKiAxO1xuICAgIHRoaXMuZ2xvYmFsQWxwaGEgPSAxO1xuICAgIC8vIHRoaXMuZm9udCA9ICcxMHB4IHNhbnMtc2VyaWYnO1xuICAgIHRoaXMuZm9udCA9ICcxMnB4IOW+rui9r+mbhem7kSc7ICAgICAgICAvLyDlhrPlrprov5jmmK/mlLnov5nlkKfvvIzlvbHlk43ku6Pku7fmnIDlsI9cbiAgICB0aGlzLnRleHRBbGlnbiA9ICdsZWZ0JztcbiAgICB0aGlzLnRleHRCYXNlbGluZSA9ICdhbHBoYWJldGljJztcbiAgICB0aGlzLmNhbnZhcyA9IGNhbnZhc0VsZW1lbnQ7XG5cbiAgICB2YXIgY3NzVGV4dCA9ICd3aWR0aDonICsgY2FudmFzRWxlbWVudC5jbGllbnRXaWR0aCArICdweDtoZWlnaHQ6JyArXG4gICAgICAgIGNhbnZhc0VsZW1lbnQuY2xpZW50SGVpZ2h0ICsgJ3B4O292ZXJmbG93OmhpZGRlbjtwb3NpdGlvbjphYnNvbHV0ZSc7XG4gICAgdmFyIGVsID0gY2FudmFzRWxlbWVudC5vd25lckRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGVsLnN0eWxlLmNzc1RleHQgPSBjc3NUZXh0O1xuICAgIGNhbnZhc0VsZW1lbnQuYXBwZW5kQ2hpbGQoZWwpO1xuXG4gICAgdmFyIG92ZXJsYXlFbCA9IGVsLmNsb25lTm9kZShmYWxzZSk7XG4gICAgLy8gVXNlIGEgbm9uIHRyYW5zcGFyZW50IGJhY2tncm91bmQuXG4gICAgb3ZlcmxheUVsLnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICcjZmZmJzsgLy9yZWQsIEkgZG9uJ3Qga25vdyB3aHksIGl0IHdvcmshIFxuICAgIG92ZXJsYXlFbC5zdHlsZS5maWx0ZXIgPSAnYWxwaGEob3BhY2l0eT0wKSc7XG4gICAgY2FudmFzRWxlbWVudC5hcHBlbmRDaGlsZChvdmVybGF5RWwpO1xuXG4gICAgdGhpcy5lbGVtZW50XyA9IGVsO1xuICAgIHRoaXMuc2NhbGVYXyA9IDE7XG4gICAgdGhpcy5zY2FsZVlfID0gMTtcbiAgICB0aGlzLmxpbmVTY2FsZV8gPSAxO1xuXG4gICAgdGhpcy5naG9zdF8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB2YXIgY3NzVGV4dCA9ICdwb3NpdGlvbjphYnNvbHV0ZTsgbGVmdDowcHg7IHJpZ2h0OiAwcHg7IHRvcDogMHB4OyBib3R0b206IDBweDsnO1xuICAgIHRoaXMuZ2hvc3RfLnN0eWxlLmNzc1RleHQgPSBjc3NUZXh0O1xuXG4gICAgdGhpcy5lbGVtZW50Xy5hcHBlbmRDaGlsZCh0aGlzLmdob3N0Xyk7XG5cbiAgICB0aGlzLnhfID0gMDtcbiAgICB0aGlzLnlfID0gMDtcbiAgfVxuXG4gIHZhciBjb250ZXh0UHJvdG90eXBlID0gQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEXy5wcm90b3R5cGU7XG4gIGNvbnRleHRQcm90b3R5cGUuY2xlYXJSZWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMudGV4dE1lYXN1cmVFbF8pIHtcbiAgICAgIHRoaXMudGV4dE1lYXN1cmVFbF8ucmVtb3ZlTm9kZSh0cnVlKTtcbiAgICAgIHRoaXMudGV4dE1lYXN1cmVFbF8gPSBudWxsO1xuICAgIH1cbiAgICAvLyB2YXIgZ2hvc3RfID0gdGhpcy5naG9zdF87XG4gICAgLy8gSGlkZSBldmVyeXRoaW5nXG4gICAgdGhpcy5naG9zdF8uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAvLyBOT1RFUzogVXNpbmcgaW5uZXJIVE1MID0gJycgd2lsbCBjYXVzZSBhbGwgZGVzY2VuZGFudCBlbGVtZW50cyBkZXRhY2hlZFxuICAgIC8vIHdoaWxlIChnaG9zdF8uZmlyc3RDaGlsZCkge1xuICAgIC8vICAgZ2hvc3RfLnJlbW92ZUNoaWxkKGdob3N0Xy5maXJzdENoaWxkKTtcbiAgICAvLyB9XG4gICAgLy8gTk9URVM6IHJlbW92ZUNoaWxkIGluIElFOCB3aWxsIG5vdCBzZXQgdGhlIHBhcmVudE5vZGUgdG8gbnVsbFxuICAgIC8vIFxuICAgIC8vIFRPRE8gUmVtb3ZlIGdob3N0IGVsZW1lbnQgYmVmb3JlIGNoYW5nZSB0aGUgYXR0cmlidXRlcyBvZiBjaGlsZHJlbiBlYWNoIGZyYW1lIGlzIGV2ZW4gbW9yZSBzbG93XG4gICAgLy8gaWYgKGdob3N0Xy5wYXJlbnROb2RlID09PSB0aGlzLmVsZW1lbnRfKSB7XG4gICAgLy8gICB0aGlzLmVsZW1lbnRfLnJlbW92ZUNoaWxkKGdob3N0Xyk7XG4gICAgLy8gfVxuICAgIHRoaXMuY3VycmVudFZpcnR1YWxEb21fID0gbnVsbDtcblxuICAgIHRoaXMublNoYXBlVkVsXyA9IDA7XG4gICAgdGhpcy5uVGV4dFZFbF8gPSAwO1xuICAgIHRoaXMubkltYWdlVkVsXyA9IDA7XG4gIH07XG5cbiAgY29udGV4dFByb3RvdHlwZS5mbHVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMublNoYXBlVkVsXzsgaSsrKSB7XG4gICAgICB0aGlzLnNoYXBlVkRvbUxpc3RfW2ldLmZsdXNoKHRoaXMpO1xuICAgIH1cbiAgICAvLyBTaG93IGV2ZXJ5dGhpbmdcbiAgICB0aGlzLmdob3N0Xy5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcblxuICAgIGZvciAodmFyIGkgPSB0aGlzLm5TaGFwZVZFbF8sIGxlbiA9IHRoaXMuc2hhcGVWRG9tTGlzdF8ubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIHRoaXMuc2hhcGVWRG9tTGlzdF9baV0uZGV0YWNoKCk7XG4gICAgfVxuICAgIGZvciAodmFyIGkgPSB0aGlzLm5JbWFnZVZFbF8sIGxlbiA9IHRoaXMuaW1hZ2VWRG9tTGlzdF8ubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIHRoaXMuaW1hZ2VWRG9tTGlzdF9baV0uZGV0YWNoKCk7XG4gICAgfVxuICAgIGZvciAodmFyIGkgPSB0aGlzLm5UZXh0VkVsXywgbGVuID0gdGhpcy50ZXh0VkRvbUxpc3RfLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICB0aGlzLnRleHRWRG9tTGlzdF9baV0uZGV0YWNoKCk7XG4gICAgfVxuICAgIHRoaXMuc2hhcGVWRG9tTGlzdF8ubGVuZ3RoID0gdGhpcy5uU2hhcGVWRWxfO1xuICAgIHRoaXMuaW1hZ2VWRG9tTGlzdF8ubGVuZ3RoID0gdGhpcy5uSW1hZ2VWRWxfO1xuICAgIHRoaXMudGV4dFZEb21MaXN0Xy5sZW5ndGggPSB0aGlzLm5UZXh0VkVsXztcblxuICAgIC8vIHRoaXMuZWxlbWVudF8uYXBwZW5kQ2hpbGQodGhpcy5naG9zdF8pO1xuICB9XG5cbiAgY29udGV4dFByb3RvdHlwZS5iZWdpblBhdGggPSBmdW5jdGlvbigpIHtcbiAgICAvLyBUT0RPOiBCcmFuY2ggY3VycmVudCBtYXRyaXggc28gdGhhdCBzYXZlL3Jlc3RvcmUgaGFzIG5vIGVmZmVjdFxuICAgIC8vICAgICAgIGFzIHBlciBzYWZhcmkgZG9jcy5cbiAgICB0aGlzLmN1cnJlbnRQYXRoXyA9IFtdO1xuXG4gICAgdGhpcy5jdXJyZW50VmlydHVhbERvbV8gPSBudWxsO1xuICB9O1xuXG4gIGNvbnRleHRQcm90b3R5cGUubW92ZVRvID0gZnVuY3Rpb24oYVgsIGFZKSB7XG4gICAgdmFyIHAgPSBnZXRTa2V3ZWRDb29yZHModGhpcywgYVgsIGFZKTtcbiAgICBwLnR5cGUgPSAnbW92ZVRvJztcbiAgICB0aGlzLmN1cnJlbnRQYXRoXy5wdXNoKHApO1xuICAgIHRoaXMuY3VycmVudFhfID0gcC54O1xuICAgIHRoaXMuY3VycmVudFlfID0gcC55O1xuICB9O1xuXG4gIGNvbnRleHRQcm90b3R5cGUubGluZVRvID0gZnVuY3Rpb24oYVgsIGFZKSB7XG4gICAgdmFyIHAgPSBnZXRTa2V3ZWRDb29yZHModGhpcywgYVgsIGFZKTtcbiAgICBwLnR5cGUgPSAnbGluZVRvJztcbiAgICB0aGlzLmN1cnJlbnRQYXRoXy5wdXNoKHApO1xuXG4gICAgdGhpcy5jdXJyZW50WF8gPSBwLng7XG4gICAgdGhpcy5jdXJyZW50WV8gPSBwLnk7XG5cbiAgICB0aGlzLmN1cnJlbnRWaXJ0dWFsRG9tXyA9IG51bGw7XG4gIH07XG5cbiAgY29udGV4dFByb3RvdHlwZS5iZXppZXJDdXJ2ZVRvID0gZnVuY3Rpb24oYUNQMXgsIGFDUDF5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhQ1AyeCwgYUNQMnksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFYLCBhWSkge1xuICAgIHZhciBwID0gZ2V0U2tld2VkQ29vcmRzKHRoaXMsIGFYLCBhWSk7XG4gICAgdmFyIGNwMSA9IGdldFNrZXdlZENvb3Jkcyh0aGlzLCBhQ1AxeCwgYUNQMXkpO1xuICAgIHZhciBjcDIgPSBnZXRTa2V3ZWRDb29yZHModGhpcywgYUNQMngsIGFDUDJ5KTtcbiAgICBiZXppZXJDdXJ2ZVRvKHRoaXMsIGNwMSwgY3AyLCBwKTtcblxuICAgIHRoaXMuY3VycmVudFZpcnR1YWxEb21fID0gbnVsbDtcbiAgfTtcblxuICAvLyBIZWxwZXIgZnVuY3Rpb24gdGhhdCB0YWtlcyB0aGUgYWxyZWFkeSBmaXhlZCBjb3JkaW5hdGVzLlxuICBmdW5jdGlvbiBiZXppZXJDdXJ2ZVRvKHNlbGYsIGNwMSwgY3AyLCBwKSB7XG4gICAgc2VsZi5jdXJyZW50UGF0aF8ucHVzaCh7XG4gICAgICB0eXBlOiAnYmV6aWVyQ3VydmVUbycsXG4gICAgICBjcDF4OiBjcDEueCxcbiAgICAgIGNwMXk6IGNwMS55LFxuICAgICAgY3AyeDogY3AyLngsXG4gICAgICBjcDJ5OiBjcDIueSxcbiAgICAgIHg6IHAueCxcbiAgICAgIHk6IHAueVxuICAgIH0pO1xuICAgIHNlbGYuY3VycmVudFhfID0gcC54O1xuICAgIHNlbGYuY3VycmVudFlfID0gcC55O1xuXG4gICAgdGhpcy5jdXJyZW50VmlydHVhbERvbV8gPSBudWxsO1xuICB9XG5cbiAgY29udGV4dFByb3RvdHlwZS5xdWFkcmF0aWNDdXJ2ZVRvID0gZnVuY3Rpb24oYUNQeCwgYUNQeSwgYVgsIGFZKSB7XG4gICAgLy8gdGhlIGZvbGxvd2luZyBpcyBsaWZ0ZWQgYWxtb3N0IGRpcmVjdGx5IGZyb21cbiAgICAvLyBodHRwOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL2RvY3MvQ2FudmFzX3R1dG9yaWFsOkRyYXdpbmdfc2hhcGVzXG5cbiAgICB2YXIgY3AgPSBnZXRTa2V3ZWRDb29yZHModGhpcywgYUNQeCwgYUNQeSk7XG4gICAgdmFyIHAgPSBnZXRTa2V3ZWRDb29yZHModGhpcywgYVgsIGFZKTtcblxuICAgIHZhciBjcDEgPSB7XG4gICAgICB4OiB0aGlzLmN1cnJlbnRYXyArIDIuMCAvIDMuMCAqIChjcC54IC0gdGhpcy5jdXJyZW50WF8pLFxuICAgICAgeTogdGhpcy5jdXJyZW50WV8gKyAyLjAgLyAzLjAgKiAoY3AueSAtIHRoaXMuY3VycmVudFlfKVxuICAgIH07XG4gICAgdmFyIGNwMiA9IHtcbiAgICAgIHg6IGNwMS54ICsgKHAueCAtIHRoaXMuY3VycmVudFhfKSAvIDMuMCxcbiAgICAgIHk6IGNwMS55ICsgKHAueSAtIHRoaXMuY3VycmVudFlfKSAvIDMuMFxuICAgIH07XG5cbiAgICBiZXppZXJDdXJ2ZVRvKHRoaXMsIGNwMSwgY3AyLCBwKTtcblxuICAgIHRoaXMuY3VycmVudFZpcnR1YWxEb21fID0gbnVsbDtcbiAgfTtcblxuICBjb250ZXh0UHJvdG90eXBlLmFyYyA9IGZ1bmN0aW9uKGFYLCBhWSwgYVJhZGl1cyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhU3RhcnRBbmdsZSwgYUVuZEFuZ2xlLCBhQ2xvY2t3aXNlKSB7XG4gICAgYVJhZGl1cyAqPSBaO1xuICAgIHZhciBhcmNUeXBlID0gYUNsb2Nrd2lzZSA/ICdhdCcgOiAnd2EnO1xuXG4gICAgdmFyIHhTdGFydCA9IGFYICsgbWMoYVN0YXJ0QW5nbGUpICogYVJhZGl1cyAtIFoyO1xuICAgIHZhciB5U3RhcnQgPSBhWSArIG1zKGFTdGFydEFuZ2xlKSAqIGFSYWRpdXMgLSBaMjtcblxuICAgIHZhciB4RW5kID0gYVggKyBtYyhhRW5kQW5nbGUpICogYVJhZGl1cyAtIFoyO1xuICAgIHZhciB5RW5kID0gYVkgKyBtcyhhRW5kQW5nbGUpICogYVJhZGl1cyAtIFoyO1xuXG4gICAgLy8gSUUgd29uJ3QgcmVuZGVyIGFyY2hlcyBkcmF3biBjb3VudGVyIGNsb2Nrd2lzZSBpZiB4U3RhcnQgPT0geEVuZC5cbiAgICBpZiAoeFN0YXJ0ID09IHhFbmQgJiYgIWFDbG9ja3dpc2UpIHtcbiAgICAgIHhTdGFydCArPSAwLjEyNTsgLy8gT2Zmc2V0IHhTdGFydCBieSAxLzgwIG9mIGEgcGl4ZWwuIFVzZSBzb21ldGhpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhhdCBjYW4gYmUgcmVwcmVzZW50ZWQgaW4gYmluYXJ5XG4gICAgfVxuXG4gICAgdmFyIHAgPSBnZXRTa2V3ZWRDb29yZHModGhpcywgYVgsIGFZKTtcbiAgICB2YXIgcFN0YXJ0ID0gZ2V0U2tld2VkQ29vcmRzKHRoaXMsIHhTdGFydCwgeVN0YXJ0KTtcbiAgICB2YXIgcEVuZCA9IGdldFNrZXdlZENvb3Jkcyh0aGlzLCB4RW5kLCB5RW5kKTtcblxuICAgIHRoaXMuY3VycmVudFBhdGhfLnB1c2goe3R5cGU6IGFyY1R5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICB4OiBwLngsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICB5OiBwLnksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICByYWRpdXM6IGFSYWRpdXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICB4U3RhcnQ6IHBTdGFydC54LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgeVN0YXJ0OiBwU3RhcnQueSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHhFbmQ6IHBFbmQueCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHlFbmQ6IHBFbmQueX0pO1xuXG5cbiAgICB0aGlzLmN1cnJlbnRWaXJ0dWFsRG9tXyA9IG51bGw7XG4gIH07XG5cbiAgY29udGV4dFByb3RvdHlwZS5yZWN0ID0gZnVuY3Rpb24oYVgsIGFZLCBhV2lkdGgsIGFIZWlnaHQpIHtcbiAgICB0aGlzLm1vdmVUbyhhWCwgYVkpO1xuICAgIHRoaXMubGluZVRvKGFYICsgYVdpZHRoLCBhWSk7XG4gICAgdGhpcy5saW5lVG8oYVggKyBhV2lkdGgsIGFZICsgYUhlaWdodCk7XG4gICAgdGhpcy5saW5lVG8oYVgsIGFZICsgYUhlaWdodCk7XG4gICAgdGhpcy5jbG9zZVBhdGgoKTtcblxuICAgIHRoaXMuY3VycmVudFZpcnR1YWxEb21fID0gbnVsbDtcbiAgfTtcblxuICBjb250ZXh0UHJvdG90eXBlLnN0cm9rZVJlY3QgPSBmdW5jdGlvbihhWCwgYVksIGFXaWR0aCwgYUhlaWdodCkge1xuICAgIHZhciBvbGRQYXRoID0gdGhpcy5jdXJyZW50UGF0aF87XG4gICAgdGhpcy5iZWdpblBhdGgoKTtcblxuICAgIHRoaXMubW92ZVRvKGFYLCBhWSk7XG4gICAgdGhpcy5saW5lVG8oYVggKyBhV2lkdGgsIGFZKTtcbiAgICB0aGlzLmxpbmVUbyhhWCArIGFXaWR0aCwgYVkgKyBhSGVpZ2h0KTtcbiAgICB0aGlzLmxpbmVUbyhhWCwgYVkgKyBhSGVpZ2h0KTtcbiAgICB0aGlzLmNsb3NlUGF0aCgpO1xuICAgIHRoaXMuc3Ryb2tlKCk7XG5cbiAgICB0aGlzLmN1cnJlbnRQYXRoXyA9IG9sZFBhdGg7XG4gIH07XG5cbiAgY29udGV4dFByb3RvdHlwZS5maWxsUmVjdCA9IGZ1bmN0aW9uKGFYLCBhWSwgYVdpZHRoLCBhSGVpZ2h0KSB7XG4gICAgdmFyIG9sZFBhdGggPSB0aGlzLmN1cnJlbnRQYXRoXztcbiAgICB0aGlzLmJlZ2luUGF0aCgpO1xuXG4gICAgdGhpcy5tb3ZlVG8oYVgsIGFZKTtcbiAgICB0aGlzLmxpbmVUbyhhWCArIGFXaWR0aCwgYVkpO1xuICAgIHRoaXMubGluZVRvKGFYICsgYVdpZHRoLCBhWSArIGFIZWlnaHQpO1xuICAgIHRoaXMubGluZVRvKGFYLCBhWSArIGFIZWlnaHQpO1xuICAgIHRoaXMuY2xvc2VQYXRoKCk7XG4gICAgdGhpcy5maWxsKCk7XG5cbiAgICB0aGlzLmN1cnJlbnRQYXRoXyA9IG9sZFBhdGg7XG4gIH07XG5cbiAgY29udGV4dFByb3RvdHlwZS5jcmVhdGVMaW5lYXJHcmFkaWVudCA9IGZ1bmN0aW9uKGFYMCwgYVkwLCBhWDEsIGFZMSkge1xuICAgIHZhciBncmFkaWVudCA9IG5ldyBDYW52YXNHcmFkaWVudF8oJ2dyYWRpZW50Jyk7XG4gICAgZ3JhZGllbnQueDBfID0gYVgwO1xuICAgIGdyYWRpZW50LnkwXyA9IGFZMDtcbiAgICBncmFkaWVudC54MV8gPSBhWDE7XG4gICAgZ3JhZGllbnQueTFfID0gYVkxO1xuICAgIHJldHVybiBncmFkaWVudDtcbiAgfTtcblxuICBjb250ZXh0UHJvdG90eXBlLmNyZWF0ZVJhZGlhbEdyYWRpZW50ID0gZnVuY3Rpb24oYVgwLCBhWTAsIGFSMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFYMSwgYVkxLCBhUjEpIHtcbiAgICB2YXIgZ3JhZGllbnQgPSBuZXcgQ2FudmFzR3JhZGllbnRfKCdncmFkaWVudHJhZGlhbCcpO1xuICAgIGdyYWRpZW50LngwXyA9IGFYMDtcbiAgICBncmFkaWVudC55MF8gPSBhWTA7XG4gICAgZ3JhZGllbnQucjBfID0gYVIwO1xuICAgIGdyYWRpZW50LngxXyA9IGFYMTtcbiAgICBncmFkaWVudC55MV8gPSBhWTE7XG4gICAgZ3JhZGllbnQucjFfID0gYVIxO1xuICAgIHJldHVybiBncmFkaWVudDtcbiAgfTtcbiAgY29udGV4dFByb3RvdHlwZS5kcmF3SW1hZ2UgPSBmdW5jdGlvbihpbWFnZSwgdmFyX2FyZ3MpIHtcblxuICAgIHZhciB2RG9tID0gdGhpcy5pbWFnZVZEb21MaXN0X1t0aGlzLm5JbWFnZVZFbF9dO1xuICAgIGlmICghdkRvbSkge1xuICAgICAgdkRvbSA9IG5ldyBJbWFnZVZpcnR1YWxEb21fKCk7XG4gICAgICB0aGlzLmltYWdlVkRvbUxpc3RfW3RoaXMubkltYWdlVkVsX10gPSB2RG9tO1xuICAgIH1cbiAgICB0aGlzLm5JbWFnZVZFbF8rKztcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgYXJncy51bnNoaWZ0KHRoaXMpO1xuICAgIHZhciBlbCA9IHZEb20uZ2V0RWxlbWVudC5hcHBseSh2RG9tLCBhcmdzKTtcbiAgICBcbiAgICB2RG9tLmF0dGFjaFRvKHRoaXMuZ2hvc3RfKTtcblxuICAgIHRoaXMuY3VycmVudFZpcnR1YWxEb21fID0gbnVsbDtcbiAgfTtcblxuICBjb250ZXh0UHJvdG90eXBlLnN0cm9rZSA9IGZ1bmN0aW9uKGFGaWxsKSB7XG4gICAgaWYgKHRoaXMuY3VycmVudFZpcnR1YWxEb21fKSB7XG4gICAgICAvLyBTaW1wbHkgYXBwZW5kIGZpbGwgb3Igc3Ryb2tlIGRvbVxuICAgICAgaWYgKGFGaWxsICYmICF0aGlzLmN1cnJlbnRWaXJ0dWFsRG9tXy5pc0ZpbGxlZCgpKSB7XG4gICAgICAgIHRoaXMuY3VycmVudFZpcnR1YWxEb21fLmZpbGwodGhpcyk7XG4gICAgICB9IGVsc2UgaWYgKCFhRmlsbCAmJiAhdGhpcy5jdXJyZW50VmlydHVhbERvbV8uaXNTdHJva2VkKCkpIHtcbiAgICAgICAgdGhpcy5jdXJyZW50VmlydHVhbERvbV8uc3Ryb2tlKHRoaXMpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIHBhdGhTdHIgPSBbXTtcblxuICAgIHZhciBtaW4gPSB7eDogbnVsbCwgeTogbnVsbH07XG4gICAgdmFyIG1heCA9IHt4OiBudWxsLCB5OiBudWxsfTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jdXJyZW50UGF0aF8ubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBwID0gdGhpcy5jdXJyZW50UGF0aF9baV07XG4gICAgICB2YXIgYztcblxuICAgICAgc3dpdGNoIChwLnR5cGUpIHtcbiAgICAgICAgY2FzZSAnbW92ZVRvJzpcbiAgICAgICAgICBjID0gcDtcbiAgICAgICAgICBwYXRoU3RyLnB1c2goJyBtICcsIG1yKHAueCksICcsJywgbXIocC55KSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2xpbmVUbyc6XG4gICAgICAgICAgcGF0aFN0ci5wdXNoKCcgbCAnLCBtcihwLngpLCAnLCcsIG1yKHAueSkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdjbG9zZSc6XG4gICAgICAgICAgcGF0aFN0ci5wdXNoKCcgeCAnKTtcbiAgICAgICAgICBwID0gbnVsbDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnYmV6aWVyQ3VydmVUbyc6XG4gICAgICAgICAgcGF0aFN0ci5wdXNoKCcgYyAnLFxuICAgICAgICAgICAgICAgICAgICAgICBtcihwLmNwMXgpLCAnLCcsIG1yKHAuY3AxeSksICcsJyxcbiAgICAgICAgICAgICAgICAgICAgICAgbXIocC5jcDJ4KSwgJywnLCBtcihwLmNwMnkpLCAnLCcsXG4gICAgICAgICAgICAgICAgICAgICAgIG1yKHAueCksICcsJywgbXIocC55KSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2F0JzpcbiAgICAgICAgY2FzZSAnd2EnOlxuICAgICAgICAgIHBhdGhTdHIucHVzaCgnICcsIHAudHlwZSwgJyAnLFxuICAgICAgICAgICAgICAgICAgICAgICBtcihwLnggLSB0aGlzLnNjYWxlWF8gKiBwLnJhZGl1cyksICcsJyxcbiAgICAgICAgICAgICAgICAgICAgICAgbXIocC55IC0gdGhpcy5zY2FsZVlfICogcC5yYWRpdXMpLCAnICcsXG4gICAgICAgICAgICAgICAgICAgICAgIG1yKHAueCArIHRoaXMuc2NhbGVYXyAqIHAucmFkaXVzKSwgJywnLFxuICAgICAgICAgICAgICAgICAgICAgICBtcihwLnkgKyB0aGlzLnNjYWxlWV8gKiBwLnJhZGl1cyksICcgJyxcbiAgICAgICAgICAgICAgICAgICAgICAgbXIocC54U3RhcnQpLCAnLCcsIG1yKHAueVN0YXJ0KSwgJyAnLFxuICAgICAgICAgICAgICAgICAgICAgICBtcihwLnhFbmQpLCAnLCcsIG1yKHAueUVuZCkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICAvLyBUT0RPOiBGb2xsb3dpbmcgaXMgYnJva2VuIGZvciBjdXJ2ZXMgZHVlIHRvXG4gICAgICAvLyAgICAgICBtb3ZlIHRvIHByb3BlciBwYXRocy5cblxuICAgICAgLy8gRmlndXJlIG91dCBkaW1lbnNpb25zIHNvIHdlIGNhbiBkbyBncmFkaWVudCBmaWxsc1xuICAgICAgLy8gcHJvcGVybHlcbiAgICAgIGlmIChwKSB7XG4gICAgICAgIGlmIChtaW4ueCA9PSBudWxsIHx8IHAueCA8IG1pbi54KSB7XG4gICAgICAgICAgbWluLnggPSBwLng7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1heC54ID09IG51bGwgfHwgcC54ID4gbWF4LngpIHtcbiAgICAgICAgICBtYXgueCA9IHAueDtcbiAgICAgICAgfVxuICAgICAgICBpZiAobWluLnkgPT0gbnVsbCB8fCBwLnkgPCBtaW4ueSkge1xuICAgICAgICAgIG1pbi55ID0gcC55O1xuICAgICAgICB9XG4gICAgICAgIGlmIChtYXgueSA9PSBudWxsIHx8IHAueSA+IG1heC55KSB7XG4gICAgICAgICAgbWF4LnkgPSBwLnk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBwYXRoU3RyID0gcGF0aFN0ci5qb2luKCcnKTtcblxuICAgIHZhciB2RG9tID0gdGhpcy5zaGFwZVZEb21MaXN0X1t0aGlzLm5TaGFwZVZFbF9dO1xuICAgIGlmICghdkRvbSkge1xuICAgICAgdkRvbSA9IG5ldyBTaGFwZVZpcnR1YWxEb21fKCk7XG4gICAgICB0aGlzLnNoYXBlVkRvbUxpc3RfW3RoaXMublNoYXBlVkVsX10gPSB2RG9tO1xuICAgIH1cbiAgICB0aGlzLm5TaGFwZVZFbF8rKztcblxuICAgIHZhciBzaGFwZUVsID0gdkRvbS5nZXRFbGVtZW50KHBhdGhTdHIsIHRoaXMueF8sIHRoaXMueV8pO1xuICAgIGFGaWxsID8gdkRvbS5maWxsKHRoaXMsIG1pbiwgbWF4KSA6IHZEb20uc3Ryb2tlKHRoaXMpO1xuXG4gICAgdkRvbS5hdHRhY2hUbyh0aGlzLmdob3N0Xyk7XG5cbiAgICB0aGlzLmN1cnJlbnRWaXJ0dWFsRG9tXyA9IHZEb207XG5cbiAgICByZXR1cm4gc2hhcGVFbDtcbiAgfTtcblxuICBjb250ZXh0UHJvdG90eXBlLmZpbGwgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5zdHJva2UodHJ1ZSk7XG4gIH07XG5cbiAgY29udGV4dFByb3RvdHlwZS5jbG9zZVBhdGggPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmN1cnJlbnRQYXRoXy5wdXNoKHt0eXBlOiAnY2xvc2UnfSk7XG4gIH07XG5cbiAgZnVuY3Rpb24gZ2V0Q29vcmRzKGN0eCwgYVgsIGFZKSB7XG4gICAgdmFyIG0gPSBjdHgubV87XG4gICAgcmV0dXJuIHtcbiAgICAgIHg6IFogKiAoYVggKiBtWzBdWzBdICsgYVkgKiBtWzFdWzBdICsgbVsyXVswXSkgLSBaMixcbiAgICAgIHk6IFogKiAoYVggKiBtWzBdWzFdICsgYVkgKiBtWzFdWzFdICsgbVsyXVsxXSkgLSBaMlxuICAgIH07XG4gIH07XG5cbiAgZnVuY3Rpb24gZ2V0U2tld2VkQ29vcmRzKGN0eCwgYVgsIGFZKSB7XG4gICAgdmFyIG0gPSBjdHgubV87XG4gICAgcmV0dXJuIHtcbiAgICAgIHg6IFogKiAoYVggKiBtWzBdWzBdICsgYVkgKiBtWzFdWzBdKSAtIFoyLFxuICAgICAgeTogWiAqIChhWCAqIG1bMF1bMV0gKyBhWSAqIG1bMV1bMV0pIC0gWjJcbiAgICB9O1xuICB9XG5cbiAgY29udGV4dFByb3RvdHlwZS5zYXZlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIG8gPSB7fTtcbiAgICBjb3B5U3RhdGUodGhpcywgbyk7XG4gICAgdGhpcy5hU3RhY2tfLnB1c2gobyk7XG4gICAgdGhpcy5tU3RhY2tfLnB1c2godGhpcy5tXyk7XG4gICAgdGhpcy5tXyA9IG1hdHJpeE11bHRpcGx5KGNyZWF0ZU1hdHJpeElkZW50aXR5KCksIHRoaXMubV8pO1xuICB9O1xuXG4gIGNvbnRleHRQcm90b3R5cGUucmVzdG9yZSA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLmFTdGFja18ubGVuZ3RoKSB7XG4gICAgICBjb3B5U3RhdGUodGhpcy5hU3RhY2tfLnBvcCgpLCB0aGlzKTtcbiAgICAgIHRoaXMubV8gPSB0aGlzLm1TdGFja18ucG9wKCk7XG4gICAgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIG1hdHJpeElzRmluaXRlKG0pIHtcbiAgICByZXR1cm4gaXNGaW5pdGUobVswXVswXSkgJiYgaXNGaW5pdGUobVswXVsxXSkgJiZcbiAgICAgICAgaXNGaW5pdGUobVsxXVswXSkgJiYgaXNGaW5pdGUobVsxXVsxXSkgJiZcbiAgICAgICAgaXNGaW5pdGUobVsyXVswXSkgJiYgaXNGaW5pdGUobVsyXVsxXSk7XG4gIH1cblxuICBmdW5jdGlvbiBzZXRNKGN0eCwgbSwgdXBkYXRlTGluZVNjYWxlKSB7XG4gICAgaWYgKCFtYXRyaXhJc0Zpbml0ZShtKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjdHgubV8gPSBtO1xuXG4gICAgY3R4LnNjYWxlWF8gPSBNYXRoLnNxcnQobVswXVswXSAqIG1bMF1bMF0gKyBtWzBdWzFdICogbVswXVsxXSk7XG4gICAgY3R4LnNjYWxlWV8gPSBNYXRoLnNxcnQobVsxXVswXSAqIG1bMV1bMF0gKyBtWzFdWzFdICogbVsxXVsxXSk7XG4gICAgY3R4LnhfID0gbVsyXVswXTtcbiAgICBjdHgueV8gPSBtWzJdWzFdO1xuXG4gICAgaWYgKHVwZGF0ZUxpbmVTY2FsZSkge1xuICAgICAgLy8gR2V0IHRoZSBsaW5lIHNjYWxlLlxuICAgICAgLy8gRGV0ZXJtaW5hbnQgb2YgdGhpcy5tXyBtZWFucyBob3cgbXVjaCB0aGUgYXJlYSBpcyBlbmxhcmdlZCBieSB0aGVcbiAgICAgIC8vIHRyYW5zZm9ybWF0aW9uLiBTbyBpdHMgc3F1YXJlIHJvb3QgY2FuIGJlIHVzZWQgYXMgYSBzY2FsZSBmYWN0b3JcbiAgICAgIC8vIGZvciB3aWR0aC5cbiAgICAgIHZhciBkZXQgPSBtWzBdWzBdICogbVsxXVsxXSAtIG1bMF1bMV0gKiBtWzFdWzBdO1xuICAgICAgY3R4LmxpbmVTY2FsZV8gPSBzcXJ0KGFicyhkZXQpKTtcbiAgICB9XG4gIH1cblxuXG4gIGNvbnRleHRQcm90b3R5cGUudHJhbnNsYXRlID0gZnVuY3Rpb24oYVgsIGFZKSB7XG4gICAgdmFyIG0xID0gW1xuICAgICAgWzEsICAwLCAgMF0sXG4gICAgICBbMCwgIDEsICAwXSxcbiAgICAgIFthWCwgYVksIDFdXG4gICAgXTtcblxuICAgIHNldE0odGhpcywgbWF0cml4TXVsdGlwbHkobTEsIHRoaXMubV8pLCBmYWxzZSk7XG4gIH07XG5cbiAgY29udGV4dFByb3RvdHlwZS5yb3RhdGUgPSBmdW5jdGlvbihhUm90KSB7XG4gICAgdmFyIGMgPSBtYyhhUm90KTtcbiAgICB2YXIgcyA9IG1zKGFSb3QpO1xuXG4gICAgdmFyIG0xID0gW1xuICAgICAgW2MsICBzLCAwXSxcbiAgICAgIFstcywgYywgMF0sXG4gICAgICBbMCwgIDAsIDFdXG4gICAgXTtcblxuICAgIHNldE0odGhpcywgbWF0cml4TXVsdGlwbHkobTEsIHRoaXMubV8pLCBmYWxzZSk7XG4gIH07XG5cbiAgY29udGV4dFByb3RvdHlwZS5zY2FsZSA9IGZ1bmN0aW9uKGFYLCBhWSkge1xuICAgIHZhciBtMSA9IFtcbiAgICAgIFthWCwgMCwgIDBdLFxuICAgICAgWzAsICBhWSwgMF0sXG4gICAgICBbMCwgIDAsICAxXVxuICAgIF07XG5cbiAgICBzZXRNKHRoaXMsIG1hdHJpeE11bHRpcGx5KG0xLCB0aGlzLm1fKSwgdHJ1ZSk7XG4gIH07XG5cbiAgY29udGV4dFByb3RvdHlwZS50cmFuc2Zvcm0gPSBmdW5jdGlvbihtMTEsIG0xMiwgbTIxLCBtMjIsIGR4LCBkeSkge1xuICAgIHZhciBtMSA9IFtcbiAgICAgIFttMTEsIG0xMiwgMF0sXG4gICAgICBbbTIxLCBtMjIsIDBdLFxuICAgICAgW2R4LCAgZHksICAxXVxuICAgIF07XG5cbiAgICBzZXRNKHRoaXMsIG1hdHJpeE11bHRpcGx5KG0xLCB0aGlzLm1fKSwgdHJ1ZSk7XG5cbiAgfTtcblxuICBjb250ZXh0UHJvdG90eXBlLnNldFRyYW5zZm9ybSA9IGZ1bmN0aW9uKG0xMSwgbTEyLCBtMjEsIG0yMiwgZHgsIGR5KSB7XG4gICAgXG4gICAgdmFyIG0gPSBbXG4gICAgICBbbTExLCBtMTIsIDBdLFxuICAgICAgW20yMSwgbTIyLCAwXSxcbiAgICAgIFtkeCwgIGR5LCAgMV1cbiAgICBdO1xuXG4gICAgc2V0TSh0aGlzLCBtLCB0cnVlKTtcbiAgfTtcblxuICAvKipcbiAgICogVGhlIHRleHQgZHJhd2luZyBmdW5jdGlvbi5cbiAgICogVGhlIG1heFdpZHRoIGFyZ3VtZW50IGlzbid0IHRha2VuIGluIGFjY291bnQsIHNpbmNlIG5vIGJyb3dzZXIgc3VwcG9ydHNcbiAgICogaXQgeWV0LlxuICAgKi9cbiAgY29udGV4dFByb3RvdHlwZS5kcmF3VGV4dF8gPSBmdW5jdGlvbih0ZXh0LCB4LCB5LCBtYXhXaWR0aCwgc3Ryb2tlKSB7XG4gICAgXG4gICAgdmFyIHZEb20gPSB0aGlzLnRleHRWRG9tTGlzdF9bdGhpcy5uVGV4dFZFbF9dO1xuICAgIGlmICghdkRvbSkge1xuICAgICAgdkRvbSA9IG5ldyBUZXh0VmlydHVhbERvbV8oKTtcbiAgICAgIHRoaXMudGV4dFZEb21MaXN0X1t0aGlzLm5UZXh0VkVsX10gPSB2RG9tO1xuICAgIH1cbiAgICB0aGlzLm5UZXh0VkVsXysrO1xuXG4gICAgdmFyIGVsID0gdkRvbS5nZXRFbGVtZW50KHRoaXMsIHRleHQsIHgsIHksIG1heFdpZHRoLCBzdHJva2UpO1xuICAgIFxuICAgIHZEb20uYXR0YWNoVG8odGhpcy5naG9zdF8pO1xuICAgIFxuICAgIHRoaXMuY3VycmVudFZpcnR1YWxEb21fID0gbnVsbDtcbiAgfTtcblxuICBjb250ZXh0UHJvdG90eXBlLmZpbGxUZXh0ID0gZnVuY3Rpb24odGV4dCwgeCwgeSwgbWF4V2lkdGgpIHtcbiAgICB0aGlzLmRyYXdUZXh0Xyh0ZXh0LCB4LCB5LCBtYXhXaWR0aCwgZmFsc2UpO1xuICB9O1xuXG4gIGNvbnRleHRQcm90b3R5cGUuc3Ryb2tlVGV4dCA9IGZ1bmN0aW9uKHRleHQsIHgsIHksIG1heFdpZHRoKSB7XG4gICAgdGhpcy5kcmF3VGV4dF8odGV4dCwgeCwgeSwgbWF4V2lkdGgsIHRydWUpO1xuICB9O1xuXG4gIGNvbnRleHRQcm90b3R5cGUubWVhc3VyZVRleHQgPSBmdW5jdGlvbih0ZXh0KSB7XG4gICAgaWYgKCF0aGlzLnRleHRNZWFzdXJlRWxfKSB7XG4gICAgICB2YXIgcyA9ICc8c3BhbiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlOycgK1xuICAgICAgICAgICd0b3A6LTIwMDAwcHg7bGVmdDowO3BhZGRpbmc6MDttYXJnaW46MDtib3JkZXI6bm9uZTsnICtcbiAgICAgICAgICAnd2hpdGUtc3BhY2U6cHJlO1wiPjwvc3Bhbj4nO1xuICAgICAgdGhpcy5lbGVtZW50Xy5pbnNlcnRBZGphY2VudEhUTUwoJ2JlZm9yZUVuZCcsIHMpO1xuICAgICAgdGhpcy50ZXh0TWVhc3VyZUVsXyA9IHRoaXMuZWxlbWVudF8ubGFzdENoaWxkO1xuICAgIH1cbiAgICB2YXIgZG9jID0gdGhpcy5lbGVtZW50Xy5vd25lckRvY3VtZW50O1xuICAgIHRoaXMudGV4dE1lYXN1cmVFbF8uaW5uZXJIVE1MID0gJyc7XG4gICAgdGhpcy50ZXh0TWVhc3VyZUVsXy5zdHlsZS5mb250ID0gdGhpcy5mb250O1xuICAgIC8vIERvbid0IHVzZSBpbm5lckhUTUwgb3IgaW5uZXJUZXh0IGJlY2F1c2UgdGhleSBhbGxvdyBtYXJrdXAvd2hpdGVzcGFjZS5cbiAgICB0aGlzLnRleHRNZWFzdXJlRWxfLmFwcGVuZENoaWxkKGRvYy5jcmVhdGVUZXh0Tm9kZSh0ZXh0KSk7XG4gICAgcmV0dXJuIHt3aWR0aDogdGhpcy50ZXh0TWVhc3VyZUVsXy5vZmZzZXRXaWR0aH07XG4gIH07XG5cbiAgLyoqKioqKioqIFNUVUJTICoqKioqKioqL1xuICBjb250ZXh0UHJvdG90eXBlLmNsaXAgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBUT0RPOiBJbXBsZW1lbnRcbiAgfTtcblxuICBjb250ZXh0UHJvdG90eXBlLmFyY1RvID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gVE9ETzogSW1wbGVtZW50XG4gIH07XG5cbiAgY29udGV4dFByb3RvdHlwZS5jcmVhdGVQYXR0ZXJuID0gZnVuY3Rpb24oaW1hZ2UsIHJlcGV0aXRpb24pIHtcbiAgICByZXR1cm4gbmV3IENhbnZhc1BhdHRlcm5fKGltYWdlLCByZXBldGl0aW9uKTtcbiAgfTtcblxuICAvLyBHcmFkaWVudCAvIFBhdHRlcm4gU3R1YnNcbiAgZnVuY3Rpb24gQ2FudmFzR3JhZGllbnRfKGFUeXBlKSB7XG4gICAgdGhpcy50eXBlXyA9IGFUeXBlO1xuICAgIHRoaXMueDBfID0gMDtcbiAgICB0aGlzLnkwXyA9IDA7XG4gICAgdGhpcy5yMF8gPSAwO1xuICAgIHRoaXMueDFfID0gMDtcbiAgICB0aGlzLnkxXyA9IDA7XG4gICAgdGhpcy5yMV8gPSAwO1xuICAgIHRoaXMuY29sb3JzXyA9IFtdO1xuICB9XG5cbiAgQ2FudmFzR3JhZGllbnRfLnByb3RvdHlwZS5hZGRDb2xvclN0b3AgPSBmdW5jdGlvbihhT2Zmc2V0LCBhQ29sb3IpIHtcbiAgICBhQ29sb3IgPSBwcm9jZXNzU3R5bGUoYUNvbG9yKTtcbiAgICB0aGlzLmNvbG9yc18ucHVzaCh7b2Zmc2V0OiBhT2Zmc2V0LFxuICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogYUNvbG9yLmNvbG9yLFxuICAgICAgICAgICAgICAgICAgICAgICBhbHBoYTogYUNvbG9yLmFscGhhfSk7XG4gIH07XG5cbiAgZnVuY3Rpb24gQ2FudmFzUGF0dGVybl8oaW1hZ2UsIHJlcGV0aXRpb24pIHtcbiAgICBhc3NlcnRJbWFnZUlzVmFsaWQoaW1hZ2UpO1xuICAgIHN3aXRjaCAocmVwZXRpdGlvbikge1xuICAgICAgY2FzZSAncmVwZWF0JzpcbiAgICAgIGNhc2UgbnVsbDpcbiAgICAgIGNhc2UgJyc6XG4gICAgICAgIHRoaXMucmVwZXRpdGlvbl8gPSAncmVwZWF0JztcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ3JlcGVhdC14JzpcbiAgICAgIGNhc2UgJ3JlcGVhdC15JzpcbiAgICAgIGNhc2UgJ25vLXJlcGVhdCc6XG4gICAgICAgIHRoaXMucmVwZXRpdGlvbl8gPSByZXBldGl0aW9uO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93RXhjZXB0aW9uKCdTWU5UQVhfRVJSJyk7XG4gICAgfVxuXG4gICAgdGhpcy5zcmNfID0gaW1hZ2Uuc3JjO1xuICAgIHRoaXMud2lkdGhfID0gaW1hZ2Uud2lkdGg7XG4gICAgdGhpcy5oZWlnaHRfID0gaW1hZ2UuaGVpZ2h0O1xuICB9XG5cbiAgZnVuY3Rpb24gdGhyb3dFeGNlcHRpb24ocykge1xuICAgIHRocm93IG5ldyBET01FeGNlcHRpb25fKHMpO1xuICB9XG5cbiAgZnVuY3Rpb24gYXNzZXJ0SW1hZ2VJc1ZhbGlkKGltZykge1xuICAgIGlmICghaW1nIHx8IGltZy5ub2RlVHlwZSAhPSAxIHx8IGltZy50YWdOYW1lICE9ICdJTUcnKSB7XG4gICAgICB0aHJvd0V4Y2VwdGlvbignVFlQRV9NSVNNQVRDSF9FUlInKTtcbiAgICB9XG4gICAgaWYgKGltZy5yZWFkeVN0YXRlICE9ICdjb21wbGV0ZScpIHtcbiAgICAgIHRocm93RXhjZXB0aW9uKCdJTlZBTElEX1NUQVRFX0VSUicpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIERPTUV4Y2VwdGlvbl8ocykge1xuICAgIHRoaXMuY29kZSA9IHRoaXNbc107XG4gICAgdGhpcy5tZXNzYWdlID0gcyArJzogRE9NIEV4Y2VwdGlvbiAnICsgdGhpcy5jb2RlO1xuICB9XG4gIHZhciBwID0gRE9NRXhjZXB0aW9uXy5wcm90b3R5cGUgPSBuZXcgRXJyb3I7XG4gIHAuSU5ERVhfU0laRV9FUlIgPSAxO1xuICBwLkRPTVNUUklOR19TSVpFX0VSUiA9IDI7XG4gIHAuSElFUkFSQ0hZX1JFUVVFU1RfRVJSID0gMztcbiAgcC5XUk9OR19ET0NVTUVOVF9FUlIgPSA0O1xuICBwLklOVkFMSURfQ0hBUkFDVEVSX0VSUiA9IDU7XG4gIHAuTk9fREFUQV9BTExPV0VEX0VSUiA9IDY7XG4gIHAuTk9fTU9ESUZJQ0FUSU9OX0FMTE9XRURfRVJSID0gNztcbiAgcC5OT1RfRk9VTkRfRVJSID0gODtcbiAgcC5OT1RfU1VQUE9SVEVEX0VSUiA9IDk7XG4gIHAuSU5VU0VfQVRUUklCVVRFX0VSUiA9IDEwO1xuICBwLklOVkFMSURfU1RBVEVfRVJSID0gMTE7XG4gIHAuU1lOVEFYX0VSUiA9IDEyO1xuICBwLklOVkFMSURfTU9ESUZJQ0FUSU9OX0VSUiA9IDEzO1xuICBwLk5BTUVTUEFDRV9FUlIgPSAxNDtcbiAgcC5JTlZBTElEX0FDQ0VTU19FUlIgPSAxNTtcbiAgcC5WQUxJREFUSU9OX0VSUiA9IDE2O1xuICBwLlRZUEVfTUlTTUFUQ0hfRVJSID0gMTc7XG5cbiAgLy8gc2V0IHVwIGV4dGVybnNcbiAgR192bWxDYW52YXNNYW5hZ2VyID0gR192bWxDYW52YXNNYW5hZ2VyXztcbiAgQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEID0gQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEXztcbiAgQ2FudmFzR3JhZGllbnQgPSBDYW52YXNHcmFkaWVudF87XG4gIENhbnZhc1BhdHRlcm4gPSBDYW52YXNQYXR0ZXJuXztcbiAgRE9NRXhjZXB0aW9uID0gRE9NRXhjZXB0aW9uXztcbn0pKCk7XG5cbn0gLy8gaWZcbmVsc2UgeyAvLyBtYWtlIHRoZSBjYW52YXMgdGVzdCBzaW1wbGUgYnkga2VuZXIubGluZmVuZ0BnbWFpbC5jb21cbiAgICBHX3ZtbENhbnZhc01hbmFnZXIgPSBmYWxzZTtcbn1cbnJldHVybiBHX3ZtbENhbnZhc01hbmFnZXI7XG59KTsgLy8gZGVmaW5lIl0sImZpbGUiOiJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL2RlcC9leGNhbnZhczIuanMifQ==
