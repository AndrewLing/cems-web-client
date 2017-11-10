/**
 * shape基类
 * @module zrender/shape/Base
 * @author  Kener (@Kener-林峰, kener.linfeng@gmail.com)
 *          errorrik (errorrik@gmail.com)
 */

/**
 * @typedef {Object} IBaseShapeStyle
 * @property {string} [brushType='fill']
 * @property {string} [color='#000000'] 填充颜色
 * @property {string} [strokeColor='#000000'] 描边颜色
 * @property {string} [lineCape='butt'] 线帽样式，可以是 butt, round, square
 * @property {number} [lineWidth=1] 描边宽度
 * @property {number} [opacity=1] 绘制透明度
 * @property {number} [shadowBlur=0] 阴影模糊度，大于0有效
 * @property {string} [shadowColor='#000000'] 阴影颜色
 * @property {number} [shadowOffsetX=0] 阴影横向偏移
 * @property {number} [shadowOffsetY=0] 阴影纵向偏移
 * @property {string} [text] 图形中的附加文本
 * @property {string} [textColor='#000000'] 文本颜色
 * @property {string} [textFont] 附加文本样式，eg:'bold 18px verdana'
 * @property {string} [textPosition='end'] 附加文本位置, 可以是 inside, left, right, top, bottom
 * @property {string} [textAlign] 默认根据textPosition自动设置，附加文本水平对齐。
 *                                可以是start, end, left, right, center
 * @property {string} [textBaseline] 默认根据textPosition自动设置，附加文本垂直对齐。
 *                                可以是top, bottom, middle, alphabetic, hanging, ideographic
 */

/**
 * @typedef {Object} module:zrender/shape/Base~IBoundingRect
 * @property {number} x 左上角顶点x轴坐标 
 * @property {number} y 左上角顶点y轴坐标
 * @property {number} width 包围盒矩形宽度
 * @property {number} height 包围盒矩形高度
 */

define(
    function(require) {
        var vmlCanvasManager = window['G_vmlCanvasManager'];

        var matrix = require('../tool/matrix');
        var guid = require('../tool/guid');
        var util = require('../tool/util');
        var log = require('../tool/log');

        var Transformable = require('../mixin/Transformable');
        var Eventful = require('../mixin/Eventful');

        function _fillText(ctx, text, x, y, textFont, textAlign, textBaseline) {
            if (textFont) {
                ctx.font = textFont;
            }
            ctx.textAlign = textAlign;
            ctx.textBaseline = textBaseline;
            var rect = _getTextRect(
                text, x, y, textFont, textAlign, textBaseline
            );
            
            text = (text + '').split('\n');
            var lineHeight = require('../tool/area').getTextHeight('国', textFont);
            
            switch (textBaseline) {
                case 'top':
                    y = rect.y;
                    break;
                case 'bottom':
                    y = rect.y + lineHeight;
                    break;
                default:
                    y = rect.y + lineHeight / 2;
            }
            
            for (var i = 0, l = text.length; i < l; i++) {
                ctx.fillText(text[i], x, y);
                y += lineHeight;
            }
        }

        /**
         * 返回矩形区域，用于局部刷新和文字定位
         * @inner
         * @param {string} text
         * @param {number} x
         * @param {number} y
         * @param {string} textFont
         * @param {string} textAlign
         * @param {string} textBaseline
         */
        function _getTextRect(text, x, y, textFont, textAlign, textBaseline) {
            var area = require('../tool/area');
            var width = area.getTextWidth(text, textFont);
            var lineHeight = area.getTextHeight('国', textFont);
            
            text = (text + '').split('\n');
            
            switch (textAlign) {
                case 'end':
                case 'right':
                    x -= width;
                    break;
                case 'center':
                    x -= (width / 2);
                    break;
            }

            switch (textBaseline) {
                case 'top':
                    break;
                case 'bottom':
                    y -= lineHeight * text.length;
                    break;
                default:
                    y -= lineHeight * text.length / 2;
            }

            return {
                x : x,
                y : y,
                width : width,
                height : lineHeight * text.length
            };
        }

        /**
         * @alias module:zrender/shape/Base
         * @constructor
         * @extends module:zrender/mixin/Transformable
         * @extends module:zrender/mixin/Eventful
         * @param {Object} options 关于shape的配置项，可以是shape的自有属性，也可以是自定义的属性。
         */
        var Base = function(options) {
            
            options = options || {};
            
            /**
             * Shape id, 全局唯一
             * @type {string}
             */
            this.id = options.id || guid();

            for (var key in options) {
                this[key] = options[key];
            }

            /**
             * 基础绘制样式
             * @type {module:zrender/shape/Base~IBaseShapeStyle}
             */
            this.style = this.style || {};

            /**
             * 高亮样式
             * @type {module:zrender/shape/Base~IBaseShapeStyle}
             */
            this.highlightStyle = this.highlightStyle || null;

            /**
             * 父节点
             * @readonly
             * @type {module:zrender/Group}
             * @default null
             */
            this.parent = null;

            this.__dirty = true;

            this.__clipShapes = [];

            Transformable.call(this);
            Eventful.call(this);
        };
        /**
         * 图形是否可见，为true时不绘制图形，但是仍能触发鼠标事件
         * @name module:zrender/shape/Base#invisible
         * @type {boolean}
         * @default false
         */
        Base.prototype.invisible = false;

        /**
         * 图形是否忽略，为true时忽略图形的绘制以及事件触发
         * @name module:zrender/shape/Base#ignore
         * @type {boolean}
         * @default false
         */
        Base.prototype.ignore = false;

        /**
         * z层level，决定绘画在哪层canvas中
         * @name module:zrender/shape/Base#zlevel
         * @type {number}
         * @default 0
         */
        Base.prototype.zlevel = 0;

        /**
         * 是否可拖拽
         * @name module:zrender/shape/Base#draggable
         * @type {boolean}
         * @default false
         */
        Base.prototype.draggable = false;

        /**
         * 是否可点击
         * @name module:zrender/shape/Base#clickable
         * @type {boolean}
         * @default false
         */
        Base.prototype.clickable = false;

        /**
         * 是否可以hover
         * @name module:zrender/shape/Base#hoverable
         * @type {boolean}
         * @default true
         */
        Base.prototype.hoverable = true;
        
        /**
         * z值，跟zlevel一样影响shape绘制的前后顺序，z值大的shape会覆盖在z值小的上面，
         * 但是并不会创建新的canvas，所以优先级低于zlevel，而且频繁改动的开销比zlevel小很多。
         * 
         * @name module:zrender/shape/Base#z
         * @type {number}
         * @default 0
         */
        Base.prototype.z = 0;

        /**
         * 绘制图形
         * 
         * @param {CanvasRenderingContext2D} ctx
         * @param {boolean} [isHighlight=false] 是否使用高亮属性
         * @param {Function} [updateCallback]
         *        需要异步加载资源的shape可以通过这个callback(e), 
         *        让painter更新视图，base.brush没用，需要的话重载brush
         */
        Base.prototype.brush = function (ctx, isHighlight) {

            var style = this.beforeBrush(ctx, isHighlight);

            ctx.beginPath();
            this.buildPath(ctx, style);

            switch (style.brushType) {
                /* jshint ignore:start */
                case 'both':
                    ctx.fill();
                case 'stroke':
                    style.lineWidth > 0 && ctx.stroke();
                    break;
                /* jshint ignore:end */
                default:
                    ctx.fill();
            }
            
            this.drawText(ctx, style, this.style);

            this.afterBrush(ctx);
        };

        /**
         * 具体绘制操作前的一些公共操作
         * @param {CanvasRenderingContext2D} ctx
         * @param {boolean} [isHighlight=false] 是否使用高亮属性
         * @return {Object} 处理后的样式
         */
        Base.prototype.beforeBrush = function (ctx, isHighlight) {
            var style = this.style;
            
            if (this.brushTypeOnly) {
                style.brushType = this.brushTypeOnly;
            }

            if (isHighlight) {
                // 根据style扩展默认高亮样式
                style = this.getHighlightStyle(
                    style,
                    this.highlightStyle || {},
                    this.brushTypeOnly
                );
            }

            if (this.brushTypeOnly == 'stroke') {
                style.strokeColor = style.strokeColor || style.color;
            }

            ctx.save();

            this.doClip(ctx);

            this.setContext(ctx, style);

            // 设置transform
            this.setTransform(ctx);

            return style;
        };

        /**
         * 绘制后的处理
         * @param {CanvasRenderingContext2D} ctx
         */
        Base.prototype.afterBrush = function (ctx) {
            ctx.restore();
        };

        var STYLE_CTX_MAP = [
            [ 'color', 'fillStyle' ],
            [ 'strokeColor', 'strokeStyle' ],
            [ 'opacity', 'globalAlpha' ],
            [ 'lineCap', 'lineCap' ],
            [ 'lineJoin', 'lineJoin' ],
            [ 'miterLimit', 'miterLimit' ],
            [ 'lineWidth', 'lineWidth' ],
            [ 'shadowBlur', 'shadowBlur' ],
            [ 'shadowColor', 'shadowColor' ],
            [ 'shadowOffsetX', 'shadowOffsetX' ],
            [ 'shadowOffsetY', 'shadowOffsetY' ]
        ];

        /**
         * 设置 fillStyle, strokeStyle, shadow 等通用绘制样式
         * @param {CanvasRenderingContext2D} ctx
         * @param {module:zrender/shape/Base~IBaseShapeStyle} style
         */
        Base.prototype.setContext = function (ctx, style) {
            for (var i = 0, len = STYLE_CTX_MAP.length; i < len; i++) {
                var styleProp = STYLE_CTX_MAP[i][0];
                var styleValue = style[styleProp];
                var ctxProp = STYLE_CTX_MAP[i][1];

                if (typeof styleValue != 'undefined') {
                    ctx[ctxProp] = styleValue;
                }
            }
        };

        var clipShapeInvTransform = matrix.create();
        Base.prototype.doClip = function (ctx) {
            if (this.__clipShapes && !vmlCanvasManager) {
                for (var i = 0; i < this.__clipShapes.length; i++) {
                    var clipShape = this.__clipShapes[i];
                    if (clipShape.needTransform) {
                        var m = clipShape.transform;
                        matrix.invert(clipShapeInvTransform, m);
                        ctx.transform(
                            m[0], m[1],
                            m[2], m[3],
                            m[4], m[5]
                        );
                    }
                    ctx.beginPath();
                    clipShape.buildPath(ctx, clipShape.style);
                    ctx.clip();
                    // Transform back
                    if (clipShape.needTransform) {
                        var m = clipShapeInvTransform;
                        ctx.transform(
                            m[0], m[1],
                            m[2], m[3],
                            m[4], m[5]
                        );
                    }
                }
            }
        };
    
        /**
         * 根据默认样式扩展高亮样式
         * 
         * @param {module:zrender/shape/Base~IBaseShapeStyle} style 默认样式
         * @param {module:zrender/shape/Base~IBaseShapeStyle} highlightStyle 高亮样式
         * @param {string} brushTypeOnly
         */
        Base.prototype.getHighlightStyle = function (style, highlightStyle, brushTypeOnly) {
            var newStyle = {};
            for (var k in style) {
                newStyle[k] = style[k];
            }

            var color = require('../tool/color');
            var highlightColor = color.getHighlightColor();
            // 根据highlightStyle扩展
            if (style.brushType != 'stroke') {
                // 带填充则用高亮色加粗边线
                newStyle.strokeColor = highlightColor;
                newStyle.lineWidth = (style.lineWidth || 1)
                                      + this.getHighlightZoom();
                newStyle.brushType = 'both';
            }
            else {
                if (brushTypeOnly != 'stroke') {
                    // 描边型的则用原色加工高亮
                    newStyle.strokeColor = highlightColor;
                    newStyle.lineWidth = (style.lineWidth || 1)
                                          + this.getHighlightZoom();
                } 
                else {
                    // 线型的则用原色加工高亮
                    newStyle.strokeColor = highlightStyle.strokeColor
                                           || color.mix(
                                                 style.strokeColor,
                                                 color.toRGB(highlightColor)
                                              );
                }
            }

            // 可自定义覆盖默认值
            for (var k in highlightStyle) {
                if (typeof highlightStyle[k] != 'undefined') {
                    newStyle[k] = highlightStyle[k];
                }
            }

            return newStyle;
        };

        // 高亮放大效果参数
        // 当前统一设置为6，如有需要差异设置，通过this.type判断实例类型
        Base.prototype.getHighlightZoom = function () {
            return this.type != 'text' ? 6 : 2;
        };

        /**
         * 移动位置
         * @param {number} dx 横坐标变化
         * @param {number} dy 纵坐标变化
         */
        Base.prototype.drift = function (dx, dy) {
            this.position[0] += dx;
            this.position[1] += dy;
        };

        /**
         * 构建绘制的Path
         * @param {CanvasRenderingContext2D} ctx
         * @param {module:zrender/shape/Base~IBaseShapeStyle} style
         */
        Base.prototype.buildPath = function (ctx, style) {
            log('buildPath not implemented in ' + this.type);
        };

        /**
         * 计算返回包围盒矩形
         * @param {module:zrender/shape/Base~IBaseShapeStyle} style
         * @return {module:zrender/shape/Base~IBoundingRect}
         */
        Base.prototype.getRect = function (style) {
            log('getRect not implemented in ' + this.type);   
        };
        
        /**
         * 判断鼠标位置是否在图形内
         * @param {number} x
         * @param {number} y
         * @return {boolean}
         */
        Base.prototype.isCover = function (x, y) {
            var originPos = this.transformCoordToLocal(x, y);
            x = originPos[0];
            y = originPos[1];

            // 快速预判并保留判断矩形
            if (this.isCoverRect(x, y)) {
                // 矩形内
                return require('../tool/area').isInside(this, this.style, x, y);
            }
            
            return false;
        };

        Base.prototype.isCoverRect = function (x, y) {
            // 快速预判并保留判断矩形
            var rect = this.style.__rect;
            if (!rect) {
                rect = this.style.__rect = this.getRect(this.style);
            }
            return x >= rect.x
                && x <= (rect.x + rect.width)
                && y >= rect.y
                && y <= (rect.y + rect.height);
        };

        /**
         * 绘制附加文本
         * @param {CanvasRenderingContext2D} ctx
         * @param {module:zrender/shape/Base~IBaseShapeStyle} style 样式
         * @param {module:zrender/shape/Base~IBaseShapeStyle} normalStyle 默认样式，用于定位文字显示
         */
        Base.prototype.drawText = function (ctx, style, normalStyle) {
            if (typeof(style.text) == 'undefined' || style.text === false) {
                return;
            }
            // 字体颜色策略
            var textColor = style.textColor || style.color || style.strokeColor;
            ctx.fillStyle = textColor;

            // 文本与图形间空白间隙
            var dd = 10;
            var al;         // 文本水平对齐
            var bl;         // 文本垂直对齐
            var tx;         // 文本横坐标
            var ty;         // 文本纵坐标

            var textPosition = style.textPosition       // 用户定义
                               || this.textPosition     // shape默认
                               || 'top';                // 全局默认

            switch (textPosition) {
                case 'inside': 
                case 'top': 
                case 'bottom': 
                case 'left': 
                case 'right': 
                    if (this.getRect) {
                        var rect = (normalStyle || style).__rect
                                   || this.getRect(normalStyle || style);

                        switch (textPosition) {
                            case 'inside':
                                tx = rect.x + rect.width / 2;
                                ty = rect.y + rect.height / 2;
                                al = 'center';
                                bl = 'middle';
                                if (style.brushType != 'stroke'
                                    && textColor == style.color
                                ) {
                                    ctx.fillStyle = '#fff';
                                }
                                break;
                            case 'left':
                                tx = rect.x - dd;
                                ty = rect.y + rect.height / 2;
                                al = 'end';
                                bl = 'middle';
                                break;
                            case 'right':
                                tx = rect.x + rect.width + dd;
                                ty = rect.y + rect.height / 2;
                                al = 'start';
                                bl = 'middle';
                                break;
                            case 'top':
                                tx = rect.x + rect.width / 2;
                                ty = rect.y - dd;
                                al = 'center';
                                bl = 'bottom';
                                break;
                            case 'bottom':
                                tx = rect.x + rect.width / 2;
                                ty = rect.y + rect.height + dd;
                                al = 'center';
                                bl = 'top';
                                break;
                        }
                    }
                    break;
                case 'start':
                case 'end':
                    var pointList = style.pointList
                                    || [
                                        [style.xStart || 0, style.yStart || 0],
                                        [style.xEnd || 0, style.yEnd || 0]
                                    ];
                    var length = pointList.length;
                    if (length < 2) {
                        // 少于2个点就不画了~
                        return;
                    }
                    var xStart;
                    var xEnd;
                    var yStart;
                    var yEnd;
                    switch (textPosition) {
                        case 'start':
                            xStart = pointList[1][0];
                            xEnd = pointList[0][0];
                            yStart = pointList[1][1];
                            yEnd = pointList[0][1];
                            break;
                        case 'end':
                            xStart = pointList[length - 2][0];
                            xEnd = pointList[length - 1][0];
                            yStart = pointList[length - 2][1];
                            yEnd = pointList[length - 1][1];
                            break;
                    }
                    tx = xEnd;
                    ty = yEnd;
                    
                    var angle = Math.atan((yStart - yEnd) / (xEnd - xStart)) / Math.PI * 180;
                    if ((xEnd - xStart) < 0) {
                        angle += 180;
                    }
                    else if ((yStart - yEnd) < 0) {
                        angle += 360;
                    }
                    
                    dd = 5;
                    if (angle >= 30 && angle <= 150) {
                        al = 'center';
                        bl = 'bottom';
                        ty -= dd;
                    }
                    else if (angle > 150 && angle < 210) {
                        al = 'right';
                        bl = 'middle';
                        tx -= dd;
                    }
                    else if (angle >= 210 && angle <= 330) {
                        al = 'center';
                        bl = 'top';
                        ty += dd;
                    }
                    else {
                        al = 'left';
                        bl = 'middle';
                        tx += dd;
                    }
                    break;
                case 'specific':
                    tx = style.textX || 0;
                    ty = style.textY || 0;
                    al = 'start';
                    bl = 'middle';
                    break;
            }

            if (tx != null && ty != null) {
                _fillText(
                    ctx,
                    style.text, 
                    tx, ty, 
                    style.textFont,
                    style.textAlign || al,
                    style.textBaseline || bl
                );
            }
        };

        Base.prototype.modSelf = function() {
            this.__dirty = true;
            if (this.style) {
                this.style.__rect = null;
            }
            if (this.highlightStyle) {
                this.highlightStyle.__rect = null;
            }
        };

        /**
         * 图形是否会触发事件
         * @return {boolean}
         */
        // TODO, 通过 bind 绑定的事件
        Base.prototype.isSilent = function () {
            return !(
                this.hoverable || this.draggable || this.clickable
                || this.onmousemove || this.onmouseover || this.onmouseout
                || this.onmousedown || this.onmouseup || this.onclick
                || this.ondragenter || this.ondragover || this.ondragleave
                || this.ondrop
            );
        };

        util.merge(Base.prototype, Transformable.prototype, true);
        util.merge(Base.prototype, Eventful.prototype, true);

        return Base;
    }
);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3NoYXBlL0Jhc2UuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBzaGFwZeWfuuexu1xuICogQG1vZHVsZSB6cmVuZGVyL3NoYXBlL0Jhc2VcbiAqIEBhdXRob3IgIEtlbmVyIChAS2VuZXIt5p6X5bOwLCBrZW5lci5saW5mZW5nQGdtYWlsLmNvbSlcbiAqICAgICAgICAgIGVycm9ycmlrIChlcnJvcnJpa0BnbWFpbC5jb20pXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBJQmFzZVNoYXBlU3R5bGVcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbYnJ1c2hUeXBlPSdmaWxsJ11cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbY29sb3I9JyMwMDAwMDAnXSDloavlhYXpopzoibJcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbc3Ryb2tlQ29sb3I9JyMwMDAwMDAnXSDmj4/ovrnpopzoibJcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbbGluZUNhcGU9J2J1dHQnXSDnur/luL3moLflvI/vvIzlj6/ku6XmmK8gYnV0dCwgcm91bmQsIHNxdWFyZVxuICogQHByb3BlcnR5IHtudW1iZXJ9IFtsaW5lV2lkdGg9MV0g5o+P6L655a695bqmXG4gKiBAcHJvcGVydHkge251bWJlcn0gW29wYWNpdHk9MV0g57uY5Yi26YCP5piO5bqmXG4gKiBAcHJvcGVydHkge251bWJlcn0gW3NoYWRvd0JsdXI9MF0g6Zi05b2x5qih57OK5bqm77yM5aSn5LqOMOacieaViFxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtzaGFkb3dDb2xvcj0nIzAwMDAwMCddIOmYtOW9seminOiJslxuICogQHByb3BlcnR5IHtudW1iZXJ9IFtzaGFkb3dPZmZzZXRYPTBdIOmYtOW9seaoquWQkeWBj+enu1xuICogQHByb3BlcnR5IHtudW1iZXJ9IFtzaGFkb3dPZmZzZXRZPTBdIOmYtOW9see6teWQkeWBj+enu1xuICogQHByb3BlcnR5IHtzdHJpbmd9IFt0ZXh0XSDlm77lvaLkuK3nmoTpmYTliqDmlofmnKxcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbdGV4dENvbG9yPScjMDAwMDAwJ10g5paH5pys6aKc6ImyXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRGb250XSDpmYTliqDmlofmnKzmoLflvI/vvIxlZzonYm9sZCAxOHB4IHZlcmRhbmEnXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRQb3NpdGlvbj0nZW5kJ10g6ZmE5Yqg5paH5pys5L2N572uLCDlj6/ku6XmmK8gaW5zaWRlLCBsZWZ0LCByaWdodCwgdG9wLCBib3R0b21cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbdGV4dEFsaWduXSDpu5jorqTmoLnmja50ZXh0UG9zaXRpb27oh6rliqjorr7nva7vvIzpmYTliqDmlofmnKzmsLTlubPlr7npvZDjgIJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDlj6/ku6XmmK9zdGFydCwgZW5kLCBsZWZ0LCByaWdodCwgY2VudGVyXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRCYXNlbGluZV0g6buY6K6k5qC55o2udGV4dFBvc2l0aW9u6Ieq5Yqo6K6+572u77yM6ZmE5Yqg5paH5pys5Z6C55u05a+56b2Q44CCXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg5Y+v5Lul5pivdG9wLCBib3R0b20sIG1pZGRsZSwgYWxwaGFiZXRpYywgaGFuZ2luZywgaWRlb2dyYXBoaWNcbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IG1vZHVsZTp6cmVuZGVyL3NoYXBlL0Jhc2V+SUJvdW5kaW5nUmVjdFxuICogQHByb3BlcnR5IHtudW1iZXJ9IHgg5bem5LiK6KeS6aG254K5eOi9tOWdkOaghyBcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB5IOW3puS4iuinkumhtueCuXnovbTlnZDmoIdcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB3aWR0aCDljIXlm7Tnm5Lnn6nlvaLlrr3luqZcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBoZWlnaHQg5YyF5Zu055uS55+p5b2i6auY5bqmXG4gKi9cblxuZGVmaW5lKFxuICAgIGZ1bmN0aW9uKHJlcXVpcmUpIHtcbiAgICAgICAgdmFyIHZtbENhbnZhc01hbmFnZXIgPSB3aW5kb3dbJ0dfdm1sQ2FudmFzTWFuYWdlciddO1xuXG4gICAgICAgIHZhciBtYXRyaXggPSByZXF1aXJlKCcuLi90b29sL21hdHJpeCcpO1xuICAgICAgICB2YXIgZ3VpZCA9IHJlcXVpcmUoJy4uL3Rvb2wvZ3VpZCcpO1xuICAgICAgICB2YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3Rvb2wvdXRpbCcpO1xuICAgICAgICB2YXIgbG9nID0gcmVxdWlyZSgnLi4vdG9vbC9sb2cnKTtcblxuICAgICAgICB2YXIgVHJhbnNmb3JtYWJsZSA9IHJlcXVpcmUoJy4uL21peGluL1RyYW5zZm9ybWFibGUnKTtcbiAgICAgICAgdmFyIEV2ZW50ZnVsID0gcmVxdWlyZSgnLi4vbWl4aW4vRXZlbnRmdWwnKTtcblxuICAgICAgICBmdW5jdGlvbiBfZmlsbFRleHQoY3R4LCB0ZXh0LCB4LCB5LCB0ZXh0Rm9udCwgdGV4dEFsaWduLCB0ZXh0QmFzZWxpbmUpIHtcbiAgICAgICAgICAgIGlmICh0ZXh0Rm9udCkge1xuICAgICAgICAgICAgICAgIGN0eC5mb250ID0gdGV4dEZvbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjdHgudGV4dEFsaWduID0gdGV4dEFsaWduO1xuICAgICAgICAgICAgY3R4LnRleHRCYXNlbGluZSA9IHRleHRCYXNlbGluZTtcbiAgICAgICAgICAgIHZhciByZWN0ID0gX2dldFRleHRSZWN0KFxuICAgICAgICAgICAgICAgIHRleHQsIHgsIHksIHRleHRGb250LCB0ZXh0QWxpZ24sIHRleHRCYXNlbGluZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGV4dCA9ICh0ZXh0ICsgJycpLnNwbGl0KCdcXG4nKTtcbiAgICAgICAgICAgIHZhciBsaW5lSGVpZ2h0ID0gcmVxdWlyZSgnLi4vdG9vbC9hcmVhJykuZ2V0VGV4dEhlaWdodCgn5Zu9JywgdGV4dEZvbnQpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBzd2l0Y2ggKHRleHRCYXNlbGluZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ3RvcCc6XG4gICAgICAgICAgICAgICAgICAgIHkgPSByZWN0Lnk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2JvdHRvbSc6XG4gICAgICAgICAgICAgICAgICAgIHkgPSByZWN0LnkgKyBsaW5lSGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICB5ID0gcmVjdC55ICsgbGluZUhlaWdodCAvIDI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gdGV4dC5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjdHguZmlsbFRleHQodGV4dFtpXSwgeCwgeSk7XG4gICAgICAgICAgICAgICAgeSArPSBsaW5lSGVpZ2h0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOi/lOWbnuefqeW9ouWMuuWfn++8jOeUqOS6juWxgOmDqOWIt+aWsOWSjOaWh+Wtl+WumuS9jVxuICAgICAgICAgKiBAaW5uZXJcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHRleHRcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHhcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHlcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHRleHRGb250XG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0QWxpZ25cbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHRleHRCYXNlbGluZVxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gX2dldFRleHRSZWN0KHRleHQsIHgsIHksIHRleHRGb250LCB0ZXh0QWxpZ24sIHRleHRCYXNlbGluZSkge1xuICAgICAgICAgICAgdmFyIGFyZWEgPSByZXF1aXJlKCcuLi90b29sL2FyZWEnKTtcbiAgICAgICAgICAgIHZhciB3aWR0aCA9IGFyZWEuZ2V0VGV4dFdpZHRoKHRleHQsIHRleHRGb250KTtcbiAgICAgICAgICAgIHZhciBsaW5lSGVpZ2h0ID0gYXJlYS5nZXRUZXh0SGVpZ2h0KCflm70nLCB0ZXh0Rm9udCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRleHQgPSAodGV4dCArICcnKS5zcGxpdCgnXFxuJyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHN3aXRjaCAodGV4dEFsaWduKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnZW5kJzpcbiAgICAgICAgICAgICAgICBjYXNlICdyaWdodCc6XG4gICAgICAgICAgICAgICAgICAgIHggLT0gd2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2NlbnRlcic6XG4gICAgICAgICAgICAgICAgICAgIHggLT0gKHdpZHRoIC8gMik7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzd2l0Y2ggKHRleHRCYXNlbGluZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ3RvcCc6XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2JvdHRvbSc6XG4gICAgICAgICAgICAgICAgICAgIHkgLT0gbGluZUhlaWdodCAqIHRleHQubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICB5IC09IGxpbmVIZWlnaHQgKiB0ZXh0Lmxlbmd0aCAvIDI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgeCA6IHgsXG4gICAgICAgICAgICAgICAgeSA6IHksXG4gICAgICAgICAgICAgICAgd2lkdGggOiB3aWR0aCxcbiAgICAgICAgICAgICAgICBoZWlnaHQgOiBsaW5lSGVpZ2h0ICogdGV4dC5sZW5ndGhcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogQGFsaWFzIG1vZHVsZTp6cmVuZGVyL3NoYXBlL0Jhc2VcbiAgICAgICAgICogQGNvbnN0cnVjdG9yXG4gICAgICAgICAqIEBleHRlbmRzIG1vZHVsZTp6cmVuZGVyL21peGluL1RyYW5zZm9ybWFibGVcbiAgICAgICAgICogQGV4dGVuZHMgbW9kdWxlOnpyZW5kZXIvbWl4aW4vRXZlbnRmdWxcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMg5YWz5LqOc2hhcGXnmoTphY3nva7pobnvvIzlj6/ku6XmmK9zaGFwZeeahOiHquacieWxnuaAp++8jOS5n+WPr+S7peaYr+iHquWumuS5ieeahOWxnuaAp+OAglxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIEJhc2UgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFNoYXBlIGlkLCDlhajlsYDllK/kuIBcbiAgICAgICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRoaXMuaWQgPSBvcHRpb25zLmlkIHx8IGd1aWQoKTtcblxuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICB0aGlzW2tleV0gPSBvcHRpb25zW2tleV07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5Z+656GA57uY5Yi25qC35byPXG4gICAgICAgICAgICAgKiBAdHlwZSB7bW9kdWxlOnpyZW5kZXIvc2hhcGUvQmFzZX5JQmFzZVNoYXBlU3R5bGV9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRoaXMuc3R5bGUgPSB0aGlzLnN0eWxlIHx8IHt9O1xuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOmrmOS6ruagt+W8j1xuICAgICAgICAgICAgICogQHR5cGUge21vZHVsZTp6cmVuZGVyL3NoYXBlL0Jhc2V+SUJhc2VTaGFwZVN0eWxlfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLmhpZ2hsaWdodFN0eWxlID0gdGhpcy5oaWdobGlnaHRTdHlsZSB8fCBudWxsO1xuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOeItuiKgueCuVxuICAgICAgICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICAgICAgKiBAdHlwZSB7bW9kdWxlOnpyZW5kZXIvR3JvdXB9XG4gICAgICAgICAgICAgKiBAZGVmYXVsdCBudWxsXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRoaXMucGFyZW50ID0gbnVsbDtcblxuICAgICAgICAgICAgdGhpcy5fX2RpcnR5ID0gdHJ1ZTtcblxuICAgICAgICAgICAgdGhpcy5fX2NsaXBTaGFwZXMgPSBbXTtcblxuICAgICAgICAgICAgVHJhbnNmb3JtYWJsZS5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgRXZlbnRmdWwuY2FsbCh0aGlzKTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWbvuW9ouaYr+WQpuWPr+inge+8jOS4unRydWXml7bkuI3nu5jliLblm77lvaLvvIzkvYbmmK/ku43og73op6blj5HpvKDmoIfkuovku7ZcbiAgICAgICAgICogQG5hbWUgbW9kdWxlOnpyZW5kZXIvc2hhcGUvQmFzZSNpbnZpc2libGVcbiAgICAgICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICAgICAqIEBkZWZhdWx0IGZhbHNlXG4gICAgICAgICAqL1xuICAgICAgICBCYXNlLnByb3RvdHlwZS5pbnZpc2libGUgPSBmYWxzZTtcblxuICAgICAgICAvKipcbiAgICAgICAgICog5Zu+5b2i5piv5ZCm5b+955Wl77yM5Li6dHJ1ZeaXtuW/veeVpeWbvuW9oueahOe7mOWItuS7peWPiuS6i+S7tuinpuWPkVxuICAgICAgICAgKiBAbmFtZSBtb2R1bGU6enJlbmRlci9zaGFwZS9CYXNlI2lnbm9yZVxuICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgICAgICogQGRlZmF1bHQgZmFsc2VcbiAgICAgICAgICovXG4gICAgICAgIEJhc2UucHJvdG90eXBlLmlnbm9yZSA9IGZhbHNlO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiB65bGCbGV2ZWzvvIzlhrPlrprnu5jnlLvlnKjlk6rlsYJjYW52YXPkuK1cbiAgICAgICAgICogQG5hbWUgbW9kdWxlOnpyZW5kZXIvc2hhcGUvQmFzZSN6bGV2ZWxcbiAgICAgICAgICogQHR5cGUge251bWJlcn1cbiAgICAgICAgICogQGRlZmF1bHQgMFxuICAgICAgICAgKi9cbiAgICAgICAgQmFzZS5wcm90b3R5cGUuemxldmVsID0gMDtcblxuICAgICAgICAvKipcbiAgICAgICAgICog5piv5ZCm5Y+v5ouW5ou9XG4gICAgICAgICAqIEBuYW1lIG1vZHVsZTp6cmVuZGVyL3NoYXBlL0Jhc2UjZHJhZ2dhYmxlXG4gICAgICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAgICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgICAgICAgKi9cbiAgICAgICAgQmFzZS5wcm90b3R5cGUuZHJhZ2dhYmxlID0gZmFsc2U7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOaYr+WQpuWPr+eCueWHu1xuICAgICAgICAgKiBAbmFtZSBtb2R1bGU6enJlbmRlci9zaGFwZS9CYXNlI2NsaWNrYWJsZVxuICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgICAgICogQGRlZmF1bHQgZmFsc2VcbiAgICAgICAgICovXG4gICAgICAgIEJhc2UucHJvdG90eXBlLmNsaWNrYWJsZSA9IGZhbHNlO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDmmK/lkKblj6/ku6Vob3ZlclxuICAgICAgICAgKiBAbmFtZSBtb2R1bGU6enJlbmRlci9zaGFwZS9CYXNlI2hvdmVyYWJsZVxuICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgICAgICogQGRlZmF1bHQgdHJ1ZVxuICAgICAgICAgKi9cbiAgICAgICAgQmFzZS5wcm90b3R5cGUuaG92ZXJhYmxlID0gdHJ1ZTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAgKiB65YC877yM6LefemxldmVs5LiA5qC35b2x5ZONc2hhcGXnu5jliLbnmoTliY3lkI7pobrluo/vvIx65YC85aSn55qEc2hhcGXkvJropobnm5blnKh65YC85bCP55qE5LiK6Z2i77yMXG4gICAgICAgICAqIOS9huaYr+W5tuS4jeS8muWIm+W7uuaWsOeahGNhbnZhc++8jOaJgOS7peS8mOWFiOe6p+S9juS6jnpsZXZlbO+8jOiAjOS4lOmikee5geaUueWKqOeahOW8gOmUgOavlHpsZXZlbOWwj+W+iOWkmuOAglxuICAgICAgICAgKiBcbiAgICAgICAgICogQG5hbWUgbW9kdWxlOnpyZW5kZXIvc2hhcGUvQmFzZSN6XG4gICAgICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICAgICAqIEBkZWZhdWx0IDBcbiAgICAgICAgICovXG4gICAgICAgIEJhc2UucHJvdG90eXBlLnogPSAwO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDnu5jliLblm77lvaJcbiAgICAgICAgICogXG4gICAgICAgICAqIEBwYXJhbSB7Q2FudmFzUmVuZGVyaW5nQ29udGV4dDJEfSBjdHhcbiAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBbaXNIaWdobGlnaHQ9ZmFsc2VdIOaYr+WQpuS9v+eUqOmrmOS6ruWxnuaAp1xuICAgICAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbdXBkYXRlQ2FsbGJhY2tdXG4gICAgICAgICAqICAgICAgICDpnIDopoHlvILmraXliqDovb3otYTmupDnmoRzaGFwZeWPr+S7pemAmui/h+i/meS4qmNhbGxiYWNrKGUpLCBcbiAgICAgICAgICogICAgICAgIOiuqXBhaW50ZXLmm7TmlrDop4blm77vvIxiYXNlLmJydXNo5rKh55So77yM6ZyA6KaB55qE6K+d6YeN6L29YnJ1c2hcbiAgICAgICAgICovXG4gICAgICAgIEJhc2UucHJvdG90eXBlLmJydXNoID0gZnVuY3Rpb24gKGN0eCwgaXNIaWdobGlnaHQpIHtcblxuICAgICAgICAgICAgdmFyIHN0eWxlID0gdGhpcy5iZWZvcmVCcnVzaChjdHgsIGlzSGlnaGxpZ2h0KTtcblxuICAgICAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgdGhpcy5idWlsZFBhdGgoY3R4LCBzdHlsZSk7XG5cbiAgICAgICAgICAgIHN3aXRjaCAoc3R5bGUuYnJ1c2hUeXBlKSB7XG4gICAgICAgICAgICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xuICAgICAgICAgICAgICAgIGNhc2UgJ2JvdGgnOlxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbCgpO1xuICAgICAgICAgICAgICAgIGNhc2UgJ3N0cm9rZSc6XG4gICAgICAgICAgICAgICAgICAgIHN0eWxlLmxpbmVXaWR0aCA+IDAgJiYgY3R4LnN0cm9rZSgpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRoaXMuZHJhd1RleHQoY3R4LCBzdHlsZSwgdGhpcy5zdHlsZSk7XG5cbiAgICAgICAgICAgIHRoaXMuYWZ0ZXJCcnVzaChjdHgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDlhbfkvZPnu5jliLbmk43kvZzliY3nmoTkuIDkupvlhazlhbHmk43kvZxcbiAgICAgICAgICogQHBhcmFtIHtDYW52YXNSZW5kZXJpbmdDb250ZXh0MkR9IGN0eFxuICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc0hpZ2hsaWdodD1mYWxzZV0g5piv5ZCm5L2/55So6auY5Lqu5bGe5oCnXG4gICAgICAgICAqIEByZXR1cm4ge09iamVjdH0g5aSE55CG5ZCO55qE5qC35byPXG4gICAgICAgICAqL1xuICAgICAgICBCYXNlLnByb3RvdHlwZS5iZWZvcmVCcnVzaCA9IGZ1bmN0aW9uIChjdHgsIGlzSGlnaGxpZ2h0KSB7XG4gICAgICAgICAgICB2YXIgc3R5bGUgPSB0aGlzLnN0eWxlO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAodGhpcy5icnVzaFR5cGVPbmx5KSB7XG4gICAgICAgICAgICAgICAgc3R5bGUuYnJ1c2hUeXBlID0gdGhpcy5icnVzaFR5cGVPbmx5O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoaXNIaWdobGlnaHQpIHtcbiAgICAgICAgICAgICAgICAvLyDmoLnmja5zdHlsZeaJqeWxlem7mOiupOmrmOS6ruagt+W8j1xuICAgICAgICAgICAgICAgIHN0eWxlID0gdGhpcy5nZXRIaWdobGlnaHRTdHlsZShcbiAgICAgICAgICAgICAgICAgICAgc3R5bGUsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaGlnaGxpZ2h0U3R5bGUgfHwge30sXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYnJ1c2hUeXBlT25seVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmJydXNoVHlwZU9ubHkgPT0gJ3N0cm9rZScpIHtcbiAgICAgICAgICAgICAgICBzdHlsZS5zdHJva2VDb2xvciA9IHN0eWxlLnN0cm9rZUNvbG9yIHx8IHN0eWxlLmNvbG9yO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjdHguc2F2ZSgpO1xuXG4gICAgICAgICAgICB0aGlzLmRvQ2xpcChjdHgpO1xuXG4gICAgICAgICAgICB0aGlzLnNldENvbnRleHQoY3R4LCBzdHlsZSk7XG5cbiAgICAgICAgICAgIC8vIOiuvue9rnRyYW5zZm9ybVxuICAgICAgICAgICAgdGhpcy5zZXRUcmFuc2Zvcm0oY3R4KTtcblxuICAgICAgICAgICAgcmV0dXJuIHN0eWxlO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDnu5jliLblkI7nmoTlpITnkIZcbiAgICAgICAgICogQHBhcmFtIHtDYW52YXNSZW5kZXJpbmdDb250ZXh0MkR9IGN0eFxuICAgICAgICAgKi9cbiAgICAgICAgQmFzZS5wcm90b3R5cGUuYWZ0ZXJCcnVzaCA9IGZ1bmN0aW9uIChjdHgpIHtcbiAgICAgICAgICAgIGN0eC5yZXN0b3JlKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIFNUWUxFX0NUWF9NQVAgPSBbXG4gICAgICAgICAgICBbICdjb2xvcicsICdmaWxsU3R5bGUnIF0sXG4gICAgICAgICAgICBbICdzdHJva2VDb2xvcicsICdzdHJva2VTdHlsZScgXSxcbiAgICAgICAgICAgIFsgJ29wYWNpdHknLCAnZ2xvYmFsQWxwaGEnIF0sXG4gICAgICAgICAgICBbICdsaW5lQ2FwJywgJ2xpbmVDYXAnIF0sXG4gICAgICAgICAgICBbICdsaW5lSm9pbicsICdsaW5lSm9pbicgXSxcbiAgICAgICAgICAgIFsgJ21pdGVyTGltaXQnLCAnbWl0ZXJMaW1pdCcgXSxcbiAgICAgICAgICAgIFsgJ2xpbmVXaWR0aCcsICdsaW5lV2lkdGgnIF0sXG4gICAgICAgICAgICBbICdzaGFkb3dCbHVyJywgJ3NoYWRvd0JsdXInIF0sXG4gICAgICAgICAgICBbICdzaGFkb3dDb2xvcicsICdzaGFkb3dDb2xvcicgXSxcbiAgICAgICAgICAgIFsgJ3NoYWRvd09mZnNldFgnLCAnc2hhZG93T2Zmc2V0WCcgXSxcbiAgICAgICAgICAgIFsgJ3NoYWRvd09mZnNldFknLCAnc2hhZG93T2Zmc2V0WScgXVxuICAgICAgICBdO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDorr7nva4gZmlsbFN0eWxlLCBzdHJva2VTdHlsZSwgc2hhZG93IOetiemAmueUqOe7mOWItuagt+W8j1xuICAgICAgICAgKiBAcGFyYW0ge0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRH0gY3R4XG4gICAgICAgICAqIEBwYXJhbSB7bW9kdWxlOnpyZW5kZXIvc2hhcGUvQmFzZX5JQmFzZVNoYXBlU3R5bGV9IHN0eWxlXG4gICAgICAgICAqL1xuICAgICAgICBCYXNlLnByb3RvdHlwZS5zZXRDb250ZXh0ID0gZnVuY3Rpb24gKGN0eCwgc3R5bGUpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBTVFlMRV9DVFhfTUFQLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0eWxlUHJvcCA9IFNUWUxFX0NUWF9NQVBbaV1bMF07XG4gICAgICAgICAgICAgICAgdmFyIHN0eWxlVmFsdWUgPSBzdHlsZVtzdHlsZVByb3BdO1xuICAgICAgICAgICAgICAgIHZhciBjdHhQcm9wID0gU1RZTEVfQ1RYX01BUFtpXVsxXTtcblxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygc3R5bGVWYWx1ZSAhPSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICBjdHhbY3R4UHJvcF0gPSBzdHlsZVZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgY2xpcFNoYXBlSW52VHJhbnNmb3JtID0gbWF0cml4LmNyZWF0ZSgpO1xuICAgICAgICBCYXNlLnByb3RvdHlwZS5kb0NsaXAgPSBmdW5jdGlvbiAoY3R4KSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fX2NsaXBTaGFwZXMgJiYgIXZtbENhbnZhc01hbmFnZXIpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX19jbGlwU2hhcGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjbGlwU2hhcGUgPSB0aGlzLl9fY2xpcFNoYXBlc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNsaXBTaGFwZS5uZWVkVHJhbnNmb3JtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbSA9IGNsaXBTaGFwZS50cmFuc2Zvcm07XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXRyaXguaW52ZXJ0KGNsaXBTaGFwZUludlRyYW5zZm9ybSwgbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHgudHJhbnNmb3JtKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1bMF0sIG1bMV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbVsyXSwgbVszXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtWzRdLCBtWzVdXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgICAgICAgICAgY2xpcFNoYXBlLmJ1aWxkUGF0aChjdHgsIGNsaXBTaGFwZS5zdHlsZSk7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5jbGlwKCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRyYW5zZm9ybSBiYWNrXG4gICAgICAgICAgICAgICAgICAgIGlmIChjbGlwU2hhcGUubmVlZFRyYW5zZm9ybSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG0gPSBjbGlwU2hhcGVJbnZUcmFuc2Zvcm07XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHgudHJhbnNmb3JtKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1bMF0sIG1bMV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbVsyXSwgbVszXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtWzRdLCBtWzVdXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIFxuICAgICAgICAvKipcbiAgICAgICAgICog5qC55o2u6buY6K6k5qC35byP5omp5bGV6auY5Lqu5qC35byPXG4gICAgICAgICAqIFxuICAgICAgICAgKiBAcGFyYW0ge21vZHVsZTp6cmVuZGVyL3NoYXBlL0Jhc2V+SUJhc2VTaGFwZVN0eWxlfSBzdHlsZSDpu5jorqTmoLflvI9cbiAgICAgICAgICogQHBhcmFtIHttb2R1bGU6enJlbmRlci9zaGFwZS9CYXNlfklCYXNlU2hhcGVTdHlsZX0gaGlnaGxpZ2h0U3R5bGUg6auY5Lqu5qC35byPXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBicnVzaFR5cGVPbmx5XG4gICAgICAgICAqL1xuICAgICAgICBCYXNlLnByb3RvdHlwZS5nZXRIaWdobGlnaHRTdHlsZSA9IGZ1bmN0aW9uIChzdHlsZSwgaGlnaGxpZ2h0U3R5bGUsIGJydXNoVHlwZU9ubHkpIHtcbiAgICAgICAgICAgIHZhciBuZXdTdHlsZSA9IHt9O1xuICAgICAgICAgICAgZm9yICh2YXIgayBpbiBzdHlsZSkge1xuICAgICAgICAgICAgICAgIG5ld1N0eWxlW2tdID0gc3R5bGVba107XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBjb2xvciA9IHJlcXVpcmUoJy4uL3Rvb2wvY29sb3InKTtcbiAgICAgICAgICAgIHZhciBoaWdobGlnaHRDb2xvciA9IGNvbG9yLmdldEhpZ2hsaWdodENvbG9yKCk7XG4gICAgICAgICAgICAvLyDmoLnmja5oaWdobGlnaHRTdHlsZeaJqeWxlVxuICAgICAgICAgICAgaWYgKHN0eWxlLmJydXNoVHlwZSAhPSAnc3Ryb2tlJykge1xuICAgICAgICAgICAgICAgIC8vIOW4puWhq+WFheWImeeUqOmrmOS6ruiJsuWKoOeyl+i+uee6v1xuICAgICAgICAgICAgICAgIG5ld1N0eWxlLnN0cm9rZUNvbG9yID0gaGlnaGxpZ2h0Q29sb3I7XG4gICAgICAgICAgICAgICAgbmV3U3R5bGUubGluZVdpZHRoID0gKHN0eWxlLmxpbmVXaWR0aCB8fCAxKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIHRoaXMuZ2V0SGlnaGxpZ2h0Wm9vbSgpO1xuICAgICAgICAgICAgICAgIG5ld1N0eWxlLmJydXNoVHlwZSA9ICdib3RoJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChicnVzaFR5cGVPbmx5ICE9ICdzdHJva2UnKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOaPj+i+ueWei+eahOWImeeUqOWOn+iJsuWKoOW3pemrmOS6rlxuICAgICAgICAgICAgICAgICAgICBuZXdTdHlsZS5zdHJva2VDb2xvciA9IGhpZ2hsaWdodENvbG9yO1xuICAgICAgICAgICAgICAgICAgICBuZXdTdHlsZS5saW5lV2lkdGggPSAoc3R5bGUubGluZVdpZHRoIHx8IDEpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIHRoaXMuZ2V0SGlnaGxpZ2h0Wm9vbSgpO1xuICAgICAgICAgICAgICAgIH0gXG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOe6v+Wei+eahOWImeeUqOWOn+iJsuWKoOW3pemrmOS6rlxuICAgICAgICAgICAgICAgICAgICBuZXdTdHlsZS5zdHJva2VDb2xvciA9IGhpZ2hsaWdodFN0eWxlLnN0cm9rZUNvbG9yXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfHwgY29sb3IubWl4KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlLnN0cm9rZUNvbG9yLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yLnRvUkdCKGhpZ2hsaWdodENvbG9yKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDlj6/oh6rlrprkuYnopobnm5bpu5jorqTlgLxcbiAgICAgICAgICAgIGZvciAodmFyIGsgaW4gaGlnaGxpZ2h0U3R5bGUpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGhpZ2hsaWdodFN0eWxlW2tdICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgIG5ld1N0eWxlW2tdID0gaGlnaGxpZ2h0U3R5bGVba107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gbmV3U3R5bGU7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8g6auY5Lqu5pS+5aSn5pWI5p6c5Y+C5pWwXG4gICAgICAgIC8vIOW9k+WJjee7n+S4gOiuvue9ruS4ujbvvIzlpoLmnInpnIDopoHlt67lvILorr7nva7vvIzpgJrov4d0aGlzLnR5cGXliKTmlq3lrp7kvovnsbvlnotcbiAgICAgICAgQmFzZS5wcm90b3R5cGUuZ2V0SGlnaGxpZ2h0Wm9vbSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnR5cGUgIT0gJ3RleHQnID8gNiA6IDI7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOenu+WKqOS9jee9rlxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gZHgg5qiq5Z2Q5qCH5Y+Y5YyWXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBkeSDnurXlnZDmoIflj5jljJZcbiAgICAgICAgICovXG4gICAgICAgIEJhc2UucHJvdG90eXBlLmRyaWZ0ID0gZnVuY3Rpb24gKGR4LCBkeSkge1xuICAgICAgICAgICAgdGhpcy5wb3NpdGlvblswXSArPSBkeDtcbiAgICAgICAgICAgIHRoaXMucG9zaXRpb25bMV0gKz0gZHk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOaehOW7uue7mOWItueahFBhdGhcbiAgICAgICAgICogQHBhcmFtIHtDYW52YXNSZW5kZXJpbmdDb250ZXh0MkR9IGN0eFxuICAgICAgICAgKiBAcGFyYW0ge21vZHVsZTp6cmVuZGVyL3NoYXBlL0Jhc2V+SUJhc2VTaGFwZVN0eWxlfSBzdHlsZVxuICAgICAgICAgKi9cbiAgICAgICAgQmFzZS5wcm90b3R5cGUuYnVpbGRQYXRoID0gZnVuY3Rpb24gKGN0eCwgc3R5bGUpIHtcbiAgICAgICAgICAgIGxvZygnYnVpbGRQYXRoIG5vdCBpbXBsZW1lbnRlZCBpbiAnICsgdGhpcy50eXBlKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICog6K6h566X6L+U5Zue5YyF5Zu055uS55+p5b2iXG4gICAgICAgICAqIEBwYXJhbSB7bW9kdWxlOnpyZW5kZXIvc2hhcGUvQmFzZX5JQmFzZVNoYXBlU3R5bGV9IHN0eWxlXG4gICAgICAgICAqIEByZXR1cm4ge21vZHVsZTp6cmVuZGVyL3NoYXBlL0Jhc2V+SUJvdW5kaW5nUmVjdH1cbiAgICAgICAgICovXG4gICAgICAgIEJhc2UucHJvdG90eXBlLmdldFJlY3QgPSBmdW5jdGlvbiAoc3R5bGUpIHtcbiAgICAgICAgICAgIGxvZygnZ2V0UmVjdCBub3QgaW1wbGVtZW50ZWQgaW4gJyArIHRoaXMudHlwZSk7ICAgXG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgICog5Yik5pat6byg5qCH5L2N572u5piv5ZCm5Zyo5Zu+5b2i5YaFXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB4XG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB5XG4gICAgICAgICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAgICAgICAqL1xuICAgICAgICBCYXNlLnByb3RvdHlwZS5pc0NvdmVyID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgICAgIHZhciBvcmlnaW5Qb3MgPSB0aGlzLnRyYW5zZm9ybUNvb3JkVG9Mb2NhbCh4LCB5KTtcbiAgICAgICAgICAgIHggPSBvcmlnaW5Qb3NbMF07XG4gICAgICAgICAgICB5ID0gb3JpZ2luUG9zWzFdO1xuXG4gICAgICAgICAgICAvLyDlv6vpgJ/pooTliKTlubbkv53nlZnliKTmlq3nn6nlvaJcbiAgICAgICAgICAgIGlmICh0aGlzLmlzQ292ZXJSZWN0KHgsIHkpKSB7XG4gICAgICAgICAgICAgICAgLy8g55+p5b2i5YaFXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcXVpcmUoJy4uL3Rvb2wvYXJlYScpLmlzSW5zaWRlKHRoaXMsIHRoaXMuc3R5bGUsIHgsIHkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgQmFzZS5wcm90b3R5cGUuaXNDb3ZlclJlY3QgPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICAgICAgLy8g5b+r6YCf6aKE5Yik5bm25L+d55WZ5Yik5pat55+p5b2iXG4gICAgICAgICAgICB2YXIgcmVjdCA9IHRoaXMuc3R5bGUuX19yZWN0O1xuICAgICAgICAgICAgaWYgKCFyZWN0KSB7XG4gICAgICAgICAgICAgICAgcmVjdCA9IHRoaXMuc3R5bGUuX19yZWN0ID0gdGhpcy5nZXRSZWN0KHRoaXMuc3R5bGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHggPj0gcmVjdC54XG4gICAgICAgICAgICAgICAgJiYgeCA8PSAocmVjdC54ICsgcmVjdC53aWR0aClcbiAgICAgICAgICAgICAgICAmJiB5ID49IHJlY3QueVxuICAgICAgICAgICAgICAgICYmIHkgPD0gKHJlY3QueSArIHJlY3QuaGVpZ2h0KTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICog57uY5Yi26ZmE5Yqg5paH5pysXG4gICAgICAgICAqIEBwYXJhbSB7Q2FudmFzUmVuZGVyaW5nQ29udGV4dDJEfSBjdHhcbiAgICAgICAgICogQHBhcmFtIHttb2R1bGU6enJlbmRlci9zaGFwZS9CYXNlfklCYXNlU2hhcGVTdHlsZX0gc3R5bGUg5qC35byPXG4gICAgICAgICAqIEBwYXJhbSB7bW9kdWxlOnpyZW5kZXIvc2hhcGUvQmFzZX5JQmFzZVNoYXBlU3R5bGV9IG5vcm1hbFN0eWxlIOm7mOiupOagt+W8j++8jOeUqOS6juWumuS9jeaWh+Wtl+aYvuekulxuICAgICAgICAgKi9cbiAgICAgICAgQmFzZS5wcm90b3R5cGUuZHJhd1RleHQgPSBmdW5jdGlvbiAoY3R4LCBzdHlsZSwgbm9ybWFsU3R5bGUpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Yoc3R5bGUudGV4dCkgPT0gJ3VuZGVmaW5lZCcgfHwgc3R5bGUudGV4dCA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyDlrZfkvZPpopzoibLnrZbnlaVcbiAgICAgICAgICAgIHZhciB0ZXh0Q29sb3IgPSBzdHlsZS50ZXh0Q29sb3IgfHwgc3R5bGUuY29sb3IgfHwgc3R5bGUuc3Ryb2tlQ29sb3I7XG4gICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gdGV4dENvbG9yO1xuXG4gICAgICAgICAgICAvLyDmlofmnKzkuI7lm77lvaLpl7Tnqbrnmb3pl7TpmplcbiAgICAgICAgICAgIHZhciBkZCA9IDEwO1xuICAgICAgICAgICAgdmFyIGFsOyAgICAgICAgIC8vIOaWh+acrOawtOW5s+Wvuem9kFxuICAgICAgICAgICAgdmFyIGJsOyAgICAgICAgIC8vIOaWh+acrOWeguebtOWvuem9kFxuICAgICAgICAgICAgdmFyIHR4OyAgICAgICAgIC8vIOaWh+acrOaoquWdkOagh1xuICAgICAgICAgICAgdmFyIHR5OyAgICAgICAgIC8vIOaWh+acrOe6teWdkOagh1xuXG4gICAgICAgICAgICB2YXIgdGV4dFBvc2l0aW9uID0gc3R5bGUudGV4dFBvc2l0aW9uICAgICAgIC8vIOeUqOaIt+WumuS5iVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHx8IHRoaXMudGV4dFBvc2l0aW9uICAgICAvLyBzaGFwZem7mOiupFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHx8ICd0b3AnOyAgICAgICAgICAgICAgICAvLyDlhajlsYDpu5jorqRcblxuICAgICAgICAgICAgc3dpdGNoICh0ZXh0UG9zaXRpb24pIHtcbiAgICAgICAgICAgICAgICBjYXNlICdpbnNpZGUnOiBcbiAgICAgICAgICAgICAgICBjYXNlICd0b3AnOiBcbiAgICAgICAgICAgICAgICBjYXNlICdib3R0b20nOiBcbiAgICAgICAgICAgICAgICBjYXNlICdsZWZ0JzogXG4gICAgICAgICAgICAgICAgY2FzZSAncmlnaHQnOiBcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuZ2V0UmVjdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlY3QgPSAobm9ybWFsU3R5bGUgfHwgc3R5bGUpLl9fcmVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8fCB0aGlzLmdldFJlY3Qobm9ybWFsU3R5bGUgfHwgc3R5bGUpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHRleHRQb3NpdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2luc2lkZSc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR4ID0gcmVjdC54ICsgcmVjdC53aWR0aCAvIDI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5ID0gcmVjdC55ICsgcmVjdC5oZWlnaHQgLyAyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbCA9ICdjZW50ZXInO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBibCA9ICdtaWRkbGUnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3R5bGUuYnJ1c2hUeXBlICE9ICdzdHJva2UnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiB0ZXh0Q29sb3IgPT0gc3R5bGUuY29sb3JcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gJyNmZmYnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2xlZnQnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eCA9IHJlY3QueCAtIGRkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eSA9IHJlY3QueSArIHJlY3QuaGVpZ2h0IC8gMjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWwgPSAnZW5kJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmwgPSAnbWlkZGxlJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAncmlnaHQnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eCA9IHJlY3QueCArIHJlY3Qud2lkdGggKyBkZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHkgPSByZWN0LnkgKyByZWN0LmhlaWdodCAvIDI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsID0gJ3N0YXJ0JztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmwgPSAnbWlkZGxlJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAndG9wJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHggPSByZWN0LnggKyByZWN0LndpZHRoIC8gMjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHkgPSByZWN0LnkgLSBkZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWwgPSAnY2VudGVyJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmwgPSAnYm90dG9tJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnYm90dG9tJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHggPSByZWN0LnggKyByZWN0LndpZHRoIC8gMjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHkgPSByZWN0LnkgKyByZWN0LmhlaWdodCArIGRkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbCA9ICdjZW50ZXInO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBibCA9ICd0b3AnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdzdGFydCc6XG4gICAgICAgICAgICAgICAgY2FzZSAnZW5kJzpcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBvaW50TGlzdCA9IHN0eWxlLnBvaW50TGlzdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfHwgW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtzdHlsZS54U3RhcnQgfHwgMCwgc3R5bGUueVN0YXJ0IHx8IDBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtzdHlsZS54RW5kIHx8IDAsIHN0eWxlLnlFbmQgfHwgMF1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICAgICAgICAgIHZhciBsZW5ndGggPSBwb2ludExpc3QubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICBpZiAobGVuZ3RoIDwgMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5bCR5LqOMuS4queCueWwseS4jeeUu+S6hn5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB2YXIgeFN0YXJ0O1xuICAgICAgICAgICAgICAgICAgICB2YXIgeEVuZDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHlTdGFydDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHlFbmQ7XG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAodGV4dFBvc2l0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdzdGFydCc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeFN0YXJ0ID0gcG9pbnRMaXN0WzFdWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHhFbmQgPSBwb2ludExpc3RbMF1bMF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeVN0YXJ0ID0gcG9pbnRMaXN0WzFdWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHlFbmQgPSBwb2ludExpc3RbMF1bMV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdlbmQnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHhTdGFydCA9IHBvaW50TGlzdFtsZW5ndGggLSAyXVswXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4RW5kID0gcG9pbnRMaXN0W2xlbmd0aCAtIDFdWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHlTdGFydCA9IHBvaW50TGlzdFtsZW5ndGggLSAyXVsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB5RW5kID0gcG9pbnRMaXN0W2xlbmd0aCAtIDFdWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHR4ID0geEVuZDtcbiAgICAgICAgICAgICAgICAgICAgdHkgPSB5RW5kO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFuZ2xlID0gTWF0aC5hdGFuKCh5U3RhcnQgLSB5RW5kKSAvICh4RW5kIC0geFN0YXJ0KSkgLyBNYXRoLlBJICogMTgwO1xuICAgICAgICAgICAgICAgICAgICBpZiAoKHhFbmQgLSB4U3RhcnQpIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYW5nbGUgKz0gMTgwO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCh5U3RhcnQgLSB5RW5kKSA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFuZ2xlICs9IDM2MDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgZGQgPSA1O1xuICAgICAgICAgICAgICAgICAgICBpZiAoYW5nbGUgPj0gMzAgJiYgYW5nbGUgPD0gMTUwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhbCA9ICdjZW50ZXInO1xuICAgICAgICAgICAgICAgICAgICAgICAgYmwgPSAnYm90dG9tJztcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5IC09IGRkO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGFuZ2xlID4gMTUwICYmIGFuZ2xlIDwgMjEwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhbCA9ICdyaWdodCc7XG4gICAgICAgICAgICAgICAgICAgICAgICBibCA9ICdtaWRkbGUnO1xuICAgICAgICAgICAgICAgICAgICAgICAgdHggLT0gZGQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoYW5nbGUgPj0gMjEwICYmIGFuZ2xlIDw9IDMzMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWwgPSAnY2VudGVyJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJsID0gJ3RvcCc7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eSArPSBkZDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsID0gJ2xlZnQnO1xuICAgICAgICAgICAgICAgICAgICAgICAgYmwgPSAnbWlkZGxlJztcbiAgICAgICAgICAgICAgICAgICAgICAgIHR4ICs9IGRkO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ3NwZWNpZmljJzpcbiAgICAgICAgICAgICAgICAgICAgdHggPSBzdHlsZS50ZXh0WCB8fCAwO1xuICAgICAgICAgICAgICAgICAgICB0eSA9IHN0eWxlLnRleHRZIHx8IDA7XG4gICAgICAgICAgICAgICAgICAgIGFsID0gJ3N0YXJ0JztcbiAgICAgICAgICAgICAgICAgICAgYmwgPSAnbWlkZGxlJztcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eCAhPSBudWxsICYmIHR5ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBfZmlsbFRleHQoXG4gICAgICAgICAgICAgICAgICAgIGN0eCxcbiAgICAgICAgICAgICAgICAgICAgc3R5bGUudGV4dCwgXG4gICAgICAgICAgICAgICAgICAgIHR4LCB0eSwgXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlLnRleHRGb250LFxuICAgICAgICAgICAgICAgICAgICBzdHlsZS50ZXh0QWxpZ24gfHwgYWwsXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlLnRleHRCYXNlbGluZSB8fCBibFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgQmFzZS5wcm90b3R5cGUubW9kU2VsZiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5fX2RpcnR5ID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmICh0aGlzLnN0eWxlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdHlsZS5fX3JlY3QgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuaGlnaGxpZ2h0U3R5bGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmhpZ2hsaWdodFN0eWxlLl9fcmVjdCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWbvuW9ouaYr+WQpuS8muinpuWPkeS6i+S7tlxuICAgICAgICAgKiBAcmV0dXJuIHtib29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgLy8gVE9ETywg6YCa6L+HIGJpbmQg57uR5a6a55qE5LqL5Lu2XG4gICAgICAgIEJhc2UucHJvdG90eXBlLmlzU2lsZW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICEoXG4gICAgICAgICAgICAgICAgdGhpcy5ob3ZlcmFibGUgfHwgdGhpcy5kcmFnZ2FibGUgfHwgdGhpcy5jbGlja2FibGVcbiAgICAgICAgICAgICAgICB8fCB0aGlzLm9ubW91c2Vtb3ZlIHx8IHRoaXMub25tb3VzZW92ZXIgfHwgdGhpcy5vbm1vdXNlb3V0XG4gICAgICAgICAgICAgICAgfHwgdGhpcy5vbm1vdXNlZG93biB8fCB0aGlzLm9ubW91c2V1cCB8fCB0aGlzLm9uY2xpY2tcbiAgICAgICAgICAgICAgICB8fCB0aGlzLm9uZHJhZ2VudGVyIHx8IHRoaXMub25kcmFnb3ZlciB8fCB0aGlzLm9uZHJhZ2xlYXZlXG4gICAgICAgICAgICAgICAgfHwgdGhpcy5vbmRyb3BcbiAgICAgICAgICAgICk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdXRpbC5tZXJnZShCYXNlLnByb3RvdHlwZSwgVHJhbnNmb3JtYWJsZS5wcm90b3R5cGUsIHRydWUpO1xuICAgICAgICB1dGlsLm1lcmdlKEJhc2UucHJvdG90eXBlLCBFdmVudGZ1bC5wcm90b3R5cGUsIHRydWUpO1xuXG4gICAgICAgIHJldHVybiBCYXNlO1xuICAgIH1cbik7XG4iXSwiZmlsZSI6InBsdWdpbnMvenJlbmRlci0yLjEuMC9zcmMvc2hhcGUvQmFzZS5qcyJ9
