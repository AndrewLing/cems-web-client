/**
 * 贝塞尔曲线
 * @module zrender/shape/BezierCurve
 * @author Neil (杨骥, 511415343@qq.com)
 * @example
 *     var BezierCurve = require('zrender/shape/BezierCurve');
 *     var shape = new BezierCurve({
 *         style: {
 *             xStart: 0,
 *             yStart: 0,
 *             cpX1: 100,
 *             cpY1: 0,
 *             cpX2: 0,
 *             cpY2: 100,
 *             xEnd: 100,
 *             yEnd: 100,
 *             strokeColor: 'red'
 *         }
 *     });
 *     zr.addShape(shape);
 */

/**
 * @typedef {Object} IBezierCurveStyle
 * @property {number} xStart 起点x坐标
 * @property {number} yStart 起点y坐标
 * @property {number} cpX1 第一个控制点x坐标
 * @property {number} cpY1 第一个控制点y坐标
 * @property {number} [cpX2] 第二个控制点x坐标，如果不给则为二次贝塞尔曲线
 * @property {number} [cpY2] 第二个控制点y坐标，如果不给则为二次贝塞尔曲线
 * @property {number} xEnd 终止点x坐标
 * @property {number} yEnd 终止点y坐标
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

define(
    function (require) {
        'use strict';

        var Base = require('./Base');
        
        /**
         * @alias module:zrender/shape/BezierCurve
         * @constructor
         * @extends module:zrender/shape/Base
         * @param {Object} options
         */
        var BezierCurve = function(options) {
            this.brushTypeOnly = 'stroke';  // 线条只能描边，填充后果自负
            this.textPosition = 'end';
            Base.call(this, options);
            /**
             * 贝赛尔曲线绘制样式
             * @name module:zrender/shape/BezierCurve#style
             * @type {module:zrender/shape/BezierCurve~IBezierCurveStyle}
             */
            /**
             * 贝赛尔曲线高亮绘制样式
             * @name module:zrender/shape/BezierCurve#highlightStyle
             * @type {module:zrender/shape/BezierCurve~IBezierCurveStyle}
             */
        };

        BezierCurve.prototype = {
            type: 'bezier-curve',

            /**
             * 创建贝塞尔曲线路径
             * @param {CanvasRenderingContext2D} ctx
             * @param {module:zrender/shape/BezierCurve~IBezierCurveStyle} style
             */
            buildPath : function(ctx, style) {
                ctx.moveTo(style.xStart, style.yStart);
                if (typeof style.cpX2 != 'undefined'
                    && typeof style.cpY2 != 'undefined'
                ) {
                    ctx.bezierCurveTo(
                        style.cpX1, style.cpY1,
                        style.cpX2, style.cpY2,
                        style.xEnd, style.yEnd
                    );
                }
                else {
                    ctx.quadraticCurveTo(
                        style.cpX1, style.cpY1,
                        style.xEnd, style.yEnd
                    );
                }
            },

            /**
             * 计算返回贝赛尔曲线包围盒矩形。
             * 该包围盒是直接从四个控制点计算，并非最小包围盒。
             * @param {module:zrender/shape/BezierCurve~IBezierCurveStyle} style
             * @return {module:zrender/shape/Base~IBoundingRect}
             */
            getRect : function(style) {
                if (style.__rect) {
                    return style.__rect;
                }
                
                var _minX = Math.min(style.xStart, style.xEnd, style.cpX1);
                var _minY = Math.min(style.yStart, style.yEnd, style.cpY1);
                var _maxX = Math.max(style.xStart, style.xEnd, style.cpX1);
                var _maxY = Math.max(style.yStart, style.yEnd, style.cpY1);
                var _x2 = style.cpX2;
                var _y2 = style.cpY2;

                if (typeof _x2 != 'undefined'
                    && typeof _y2 != 'undefined'
                ) {
                    _minX = Math.min(_minX, _x2);
                    _minY = Math.min(_minY, _y2);
                    _maxX = Math.max(_maxX, _x2);
                    _maxY = Math.max(_maxY, _y2);
                }

                var lineWidth = style.lineWidth || 1;
                style.__rect = {
                    x : _minX - lineWidth,
                    y : _minY - lineWidth,
                    width : _maxX - _minX + lineWidth,
                    height : _maxY - _minY + lineWidth
                };
                
                return style.__rect;
            }
        };

        require('../tool/util').inherits(BezierCurve, Base);
        return BezierCurve;
    }
);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3NoYXBlL0JlemllckN1cnZlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICog6LSd5aGe5bCU5puy57q/XG4gKiBAbW9kdWxlIHpyZW5kZXIvc2hhcGUvQmV6aWVyQ3VydmVcbiAqIEBhdXRob3IgTmVpbCAo5p2o6aqlLCA1MTE0MTUzNDNAcXEuY29tKVxuICogQGV4YW1wbGVcbiAqICAgICB2YXIgQmV6aWVyQ3VydmUgPSByZXF1aXJlKCd6cmVuZGVyL3NoYXBlL0JlemllckN1cnZlJyk7XG4gKiAgICAgdmFyIHNoYXBlID0gbmV3IEJlemllckN1cnZlKHtcbiAqICAgICAgICAgc3R5bGU6IHtcbiAqICAgICAgICAgICAgIHhTdGFydDogMCxcbiAqICAgICAgICAgICAgIHlTdGFydDogMCxcbiAqICAgICAgICAgICAgIGNwWDE6IDEwMCxcbiAqICAgICAgICAgICAgIGNwWTE6IDAsXG4gKiAgICAgICAgICAgICBjcFgyOiAwLFxuICogICAgICAgICAgICAgY3BZMjogMTAwLFxuICogICAgICAgICAgICAgeEVuZDogMTAwLFxuICogICAgICAgICAgICAgeUVuZDogMTAwLFxuICogICAgICAgICAgICAgc3Ryb2tlQ29sb3I6ICdyZWQnXG4gKiAgICAgICAgIH1cbiAqICAgICB9KTtcbiAqICAgICB6ci5hZGRTaGFwZShzaGFwZSk7XG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBJQmV6aWVyQ3VydmVTdHlsZVxuICogQHByb3BlcnR5IHtudW1iZXJ9IHhTdGFydCDotbfngrl45Z2Q5qCHXG4gKiBAcHJvcGVydHkge251bWJlcn0geVN0YXJ0IOi1t+eCuXnlnZDmoIdcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBjcFgxIOesrOS4gOS4quaOp+WItueCuXjlnZDmoIdcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBjcFkxIOesrOS4gOS4quaOp+WItueCuXnlnZDmoIdcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbY3BYMl0g56ys5LqM5Liq5o6n5Yi254K5eOWdkOagh++8jOWmguaenOS4jee7meWImeS4uuS6jOasoei0neWhnuWwlOabsue6v1xuICogQHByb3BlcnR5IHtudW1iZXJ9IFtjcFkyXSDnrKzkuozkuKrmjqfliLbngrl55Z2Q5qCH77yM5aaC5p6c5LiN57uZ5YiZ5Li65LqM5qyh6LSd5aGe5bCU5puy57q/XG4gKiBAcHJvcGVydHkge251bWJlcn0geEVuZCDnu4jmraLngrl45Z2Q5qCHXG4gKiBAcHJvcGVydHkge251bWJlcn0geUVuZCDnu4jmraLngrl55Z2Q5qCHXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3N0cm9rZUNvbG9yPScjMDAwMDAwJ10g5o+P6L656aKc6ImyXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW2xpbmVDYXBlPSdidXR0J10g57q/5bi95qC35byP77yM5Y+v5Lul5pivIGJ1dHQsIHJvdW5kLCBzcXVhcmVcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbbGluZVdpZHRoPTFdIOaPj+i+ueWuveW6plxuICogQHByb3BlcnR5IHtudW1iZXJ9IFtvcGFjaXR5PTFdIOe7mOWItumAj+aYjuW6plxuICogQHByb3BlcnR5IHtudW1iZXJ9IFtzaGFkb3dCbHVyPTBdIOmYtOW9seaooeeziuW6pu+8jOWkp+S6jjDmnInmlYhcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbc2hhZG93Q29sb3I9JyMwMDAwMDAnXSDpmLTlvbHpopzoibJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbc2hhZG93T2Zmc2V0WD0wXSDpmLTlvbHmqKrlkJHlgY/np7tcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbc2hhZG93T2Zmc2V0WT0wXSDpmLTlvbHnurXlkJHlgY/np7tcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbdGV4dF0g5Zu+5b2i5Lit55qE6ZmE5Yqg5paH5pysXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRDb2xvcj0nIzAwMDAwMCddIOaWh+acrOminOiJslxuICogQHByb3BlcnR5IHtzdHJpbmd9IFt0ZXh0Rm9udF0g6ZmE5Yqg5paH5pys5qC35byP77yMZWc6J2JvbGQgMThweCB2ZXJkYW5hJ1xuICogQHByb3BlcnR5IHtzdHJpbmd9IFt0ZXh0UG9zaXRpb249J2VuZCddIOmZhOWKoOaWh+acrOS9jee9riwg5Y+v5Lul5pivIGluc2lkZSwgbGVmdCwgcmlnaHQsIHRvcCwgYm90dG9tXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRBbGlnbl0g6buY6K6k5qC55o2udGV4dFBvc2l0aW9u6Ieq5Yqo6K6+572u77yM6ZmE5Yqg5paH5pys5rC05bmz5a+56b2Q44CCXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg5Y+v5Lul5pivc3RhcnQsIGVuZCwgbGVmdCwgcmlnaHQsIGNlbnRlclxuICogQHByb3BlcnR5IHtzdHJpbmd9IFt0ZXh0QmFzZWxpbmVdIOm7mOiupOagueaNrnRleHRQb3NpdGlvbuiHquWKqOiuvue9ru+8jOmZhOWKoOaWh+acrOWeguebtOWvuem9kOOAglxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIOWPr+S7peaYr3RvcCwgYm90dG9tLCBtaWRkbGUsIGFscGhhYmV0aWMsIGhhbmdpbmcsIGlkZW9ncmFwaGljXG4gKi9cblxuZGVmaW5lKFxuICAgIGZ1bmN0aW9uIChyZXF1aXJlKSB7XG4gICAgICAgICd1c2Ugc3RyaWN0JztcblxuICAgICAgICB2YXIgQmFzZSA9IHJlcXVpcmUoJy4vQmFzZScpO1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBhbGlhcyBtb2R1bGU6enJlbmRlci9zaGFwZS9CZXppZXJDdXJ2ZVxuICAgICAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgICAgICogQGV4dGVuZHMgbW9kdWxlOnpyZW5kZXIvc2hhcGUvQmFzZVxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICAgICAgICAgKi9cbiAgICAgICAgdmFyIEJlemllckN1cnZlID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICAgICAgdGhpcy5icnVzaFR5cGVPbmx5ID0gJ3N0cm9rZSc7ICAvLyDnur/mnaHlj6rog73mj4/ovrnvvIzloavlhYXlkI7mnpzoh6rotJ9cbiAgICAgICAgICAgIHRoaXMudGV4dFBvc2l0aW9uID0gJ2VuZCc7XG4gICAgICAgICAgICBCYXNlLmNhbGwodGhpcywgb3B0aW9ucyk7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOi0nei1m+WwlOabsue6v+e7mOWItuagt+W8j1xuICAgICAgICAgICAgICogQG5hbWUgbW9kdWxlOnpyZW5kZXIvc2hhcGUvQmV6aWVyQ3VydmUjc3R5bGVcbiAgICAgICAgICAgICAqIEB0eXBlIHttb2R1bGU6enJlbmRlci9zaGFwZS9CZXppZXJDdXJ2ZX5JQmV6aWVyQ3VydmVTdHlsZX1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDotJ3otZvlsJTmm7Lnur/pq5jkuq7nu5jliLbmoLflvI9cbiAgICAgICAgICAgICAqIEBuYW1lIG1vZHVsZTp6cmVuZGVyL3NoYXBlL0JlemllckN1cnZlI2hpZ2hsaWdodFN0eWxlXG4gICAgICAgICAgICAgKiBAdHlwZSB7bW9kdWxlOnpyZW5kZXIvc2hhcGUvQmV6aWVyQ3VydmV+SUJlemllckN1cnZlU3R5bGV9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgfTtcblxuICAgICAgICBCZXppZXJDdXJ2ZS5wcm90b3R5cGUgPSB7XG4gICAgICAgICAgICB0eXBlOiAnYmV6aWVyLWN1cnZlJyxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDliJvlu7rotJ3loZ7lsJTmm7Lnur/ot6/lvoRcbiAgICAgICAgICAgICAqIEBwYXJhbSB7Q2FudmFzUmVuZGVyaW5nQ29udGV4dDJEfSBjdHhcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bW9kdWxlOnpyZW5kZXIvc2hhcGUvQmV6aWVyQ3VydmV+SUJlemllckN1cnZlU3R5bGV9IHN0eWxlXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGJ1aWxkUGF0aCA6IGZ1bmN0aW9uKGN0eCwgc3R5bGUpIHtcbiAgICAgICAgICAgICAgICBjdHgubW92ZVRvKHN0eWxlLnhTdGFydCwgc3R5bGUueVN0YXJ0KTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHN0eWxlLmNwWDIgIT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgICAgICAgICAgICAgJiYgdHlwZW9mIHN0eWxlLmNwWTIgIT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8oXG4gICAgICAgICAgICAgICAgICAgICAgICBzdHlsZS5jcFgxLCBzdHlsZS5jcFkxLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGUuY3BYMiwgc3R5bGUuY3BZMixcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlLnhFbmQsIHN0eWxlLnlFbmRcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5xdWFkcmF0aWNDdXJ2ZVRvKFxuICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGUuY3BYMSwgc3R5bGUuY3BZMSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlLnhFbmQsIHN0eWxlLnlFbmRcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOiuoeeul+i/lOWbnui0nei1m+WwlOabsue6v+WMheWbtOebkuefqeW9ouOAglxuICAgICAgICAgICAgICog6K+l5YyF5Zu055uS5piv55u05o6l5LuO5Zub5Liq5o6n5Yi254K56K6h566X77yM5bm26Z2e5pyA5bCP5YyF5Zu055uS44CCXG4gICAgICAgICAgICAgKiBAcGFyYW0ge21vZHVsZTp6cmVuZGVyL3NoYXBlL0JlemllckN1cnZlfklCZXppZXJDdXJ2ZVN0eWxlfSBzdHlsZVxuICAgICAgICAgICAgICogQHJldHVybiB7bW9kdWxlOnpyZW5kZXIvc2hhcGUvQmFzZX5JQm91bmRpbmdSZWN0fVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBnZXRSZWN0IDogZnVuY3Rpb24oc3R5bGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3R5bGUuX19yZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzdHlsZS5fX3JlY3Q7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHZhciBfbWluWCA9IE1hdGgubWluKHN0eWxlLnhTdGFydCwgc3R5bGUueEVuZCwgc3R5bGUuY3BYMSk7XG4gICAgICAgICAgICAgICAgdmFyIF9taW5ZID0gTWF0aC5taW4oc3R5bGUueVN0YXJ0LCBzdHlsZS55RW5kLCBzdHlsZS5jcFkxKTtcbiAgICAgICAgICAgICAgICB2YXIgX21heFggPSBNYXRoLm1heChzdHlsZS54U3RhcnQsIHN0eWxlLnhFbmQsIHN0eWxlLmNwWDEpO1xuICAgICAgICAgICAgICAgIHZhciBfbWF4WSA9IE1hdGgubWF4KHN0eWxlLnlTdGFydCwgc3R5bGUueUVuZCwgc3R5bGUuY3BZMSk7XG4gICAgICAgICAgICAgICAgdmFyIF94MiA9IHN0eWxlLmNwWDI7XG4gICAgICAgICAgICAgICAgdmFyIF95MiA9IHN0eWxlLmNwWTI7XG5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIF94MiAhPSAndW5kZWZpbmVkJ1xuICAgICAgICAgICAgICAgICAgICAmJiB0eXBlb2YgX3kyICE9ICd1bmRlZmluZWQnXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgIF9taW5YID0gTWF0aC5taW4oX21pblgsIF94Mik7XG4gICAgICAgICAgICAgICAgICAgIF9taW5ZID0gTWF0aC5taW4oX21pblksIF95Mik7XG4gICAgICAgICAgICAgICAgICAgIF9tYXhYID0gTWF0aC5tYXgoX21heFgsIF94Mik7XG4gICAgICAgICAgICAgICAgICAgIF9tYXhZID0gTWF0aC5tYXgoX21heFksIF95Mik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIGxpbmVXaWR0aCA9IHN0eWxlLmxpbmVXaWR0aCB8fCAxO1xuICAgICAgICAgICAgICAgIHN0eWxlLl9fcmVjdCA9IHtcbiAgICAgICAgICAgICAgICAgICAgeCA6IF9taW5YIC0gbGluZVdpZHRoLFxuICAgICAgICAgICAgICAgICAgICB5IDogX21pblkgLSBsaW5lV2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoIDogX21heFggLSBfbWluWCArIGxpbmVXaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0IDogX21heFkgLSBfbWluWSArIGxpbmVXaWR0aFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0eWxlLl9fcmVjdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICByZXF1aXJlKCcuLi90b29sL3V0aWwnKS5pbmhlcml0cyhCZXppZXJDdXJ2ZSwgQmFzZSk7XG4gICAgICAgIHJldHVybiBCZXppZXJDdXJ2ZTtcbiAgICB9XG4pO1xuIl0sImZpbGUiOiJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3NoYXBlL0JlemllckN1cnZlLmpzIn0=
