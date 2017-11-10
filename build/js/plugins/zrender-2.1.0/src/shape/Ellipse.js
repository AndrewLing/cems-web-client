/**
 * 水滴形状
 * @module zrender/shape/Ellipse
 * @example
 *   var Ellipse = require('zrender/shape/Ellipse');
 *   var shape = new Ellipse({
 *       style: {
 *           x: 100,
 *           y: 100,
 *           a: 40,
 *           b: 20,
 *           brushType: 'both',
 *           color: 'blue',
 *           strokeColor: 'red',
 *           lineWidth: 3,
 *           text: 'Ellipse'
 *       }    
 *   });
 *   zr.addShape(shape);
 */

/**
 * @typedef {Object} IEllipseStyle
 * @property {number} x 圆心x坐标
 * @property {number} y 圆心y坐标
 * @property {number} a 横轴半径
 * @property {number} b 纵轴半径
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
define(
    function (require) {
        var Base = require('./Base');

        /**
         * @alias module:zrender/shape/Ellipse
         * @constructor
         * @extends module:zrender/shape/Base
         * @param {Object} options
         */
        var Ellipse = function(options) {
            Base.call(this, options);
            /**
             * 椭圆绘制样式
             * @name module:zrender/shape/Ellipse#style
             * @type {module:zrender/shape/Ellipse~IEllipseStyle}
             */
            /**
             * 椭圆高亮绘制样式
             * @name module:zrender/shape/Ellipse#highlightStyle
             * @type {module:zrender/shape/Ellipse~IEllipseStyle}
             */
        };

        Ellipse.prototype = {
            type: 'ellipse',

            /**
             * 构建椭圆的Path
             * @param {CanvasRenderingContext2D} ctx
             * @param {module:zrender/shape/Ellipse~IEllipseStyle} style
             */
            buildPath : function(ctx, style) {
                var k = 0.5522848;
                var x = style.x;
                var y = style.y;
                var a = style.a;
                var b = style.b;
                var ox = a * k; // 水平控制点偏移量
                var oy = b * k; // 垂直控制点偏移量
                // 从椭圆的左端点开始顺时针绘制四条三次贝塞尔曲线
                ctx.moveTo(x - a, y);
                ctx.bezierCurveTo(x - a, y - oy, x - ox, y - b, x, y - b);
                ctx.bezierCurveTo(x + ox, y - b, x + a, y - oy, x + a, y);
                ctx.bezierCurveTo(x + a, y + oy, x + ox, y + b, x, y + b);
                ctx.bezierCurveTo(x - ox, y + b, x - a, y + oy, x - a, y);
                ctx.closePath();
            },

            /**
            /**
             * 计算返回椭圆包围盒矩形。
             * @param {module:zrender/shape/Ellipse~IEllipseStyle} style
             * @return {module:zrender/shape/Base~IBoundingRect}
             */
            getRect : function(style) {
                if (style.__rect) {
                    return style.__rect;
                }
                
                var lineWidth;
                if (style.brushType == 'stroke' || style.brushType == 'fill') {
                    lineWidth = style.lineWidth || 1;
                }
                else {
                    lineWidth = 0;
                }
                style.__rect = {
                    x : Math.round(style.x - style.a - lineWidth / 2),
                    y : Math.round(style.y - style.b - lineWidth / 2),
                    width : style.a * 2 + lineWidth,
                    height : style.b * 2 + lineWidth
                };
                
                return style.__rect;
            }
        };

        require('../tool/util').inherits(Ellipse, Base);
        return Ellipse;
    }
);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3NoYXBlL0VsbGlwc2UuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiDmsLTmu7TlvaLnirZcbiAqIEBtb2R1bGUgenJlbmRlci9zaGFwZS9FbGxpcHNlXG4gKiBAZXhhbXBsZVxuICogICB2YXIgRWxsaXBzZSA9IHJlcXVpcmUoJ3pyZW5kZXIvc2hhcGUvRWxsaXBzZScpO1xuICogICB2YXIgc2hhcGUgPSBuZXcgRWxsaXBzZSh7XG4gKiAgICAgICBzdHlsZToge1xuICogICAgICAgICAgIHg6IDEwMCxcbiAqICAgICAgICAgICB5OiAxMDAsXG4gKiAgICAgICAgICAgYTogNDAsXG4gKiAgICAgICAgICAgYjogMjAsXG4gKiAgICAgICAgICAgYnJ1c2hUeXBlOiAnYm90aCcsXG4gKiAgICAgICAgICAgY29sb3I6ICdibHVlJyxcbiAqICAgICAgICAgICBzdHJva2VDb2xvcjogJ3JlZCcsXG4gKiAgICAgICAgICAgbGluZVdpZHRoOiAzLFxuICogICAgICAgICAgIHRleHQ6ICdFbGxpcHNlJ1xuICogICAgICAgfSAgICBcbiAqICAgfSk7XG4gKiAgIHpyLmFkZFNoYXBlKHNoYXBlKTtcbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IElFbGxpcHNlU3R5bGVcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB4IOWchuW/g3jlnZDmoIdcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB5IOWchuW/g3nlnZDmoIdcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBhIOaoqui9tOWNiuW+hFxuICogQHByb3BlcnR5IHtudW1iZXJ9IGIg57q16L205Y2K5b6EXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW2JydXNoVHlwZT0nZmlsbCddXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW2NvbG9yPScjMDAwMDAwJ10g5aGr5YWF6aKc6ImyXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3N0cm9rZUNvbG9yPScjMDAwMDAwJ10g5o+P6L656aKc6ImyXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW2xpbmVDYXBlPSdidXR0J10g57q/5bi95qC35byP77yM5Y+v5Lul5pivIGJ1dHQsIHJvdW5kLCBzcXVhcmVcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbbGluZVdpZHRoPTFdIOaPj+i+ueWuveW6plxuICogQHByb3BlcnR5IHtudW1iZXJ9IFtvcGFjaXR5PTFdIOe7mOWItumAj+aYjuW6plxuICogQHByb3BlcnR5IHtudW1iZXJ9IFtzaGFkb3dCbHVyPTBdIOmYtOW9seaooeeziuW6pu+8jOWkp+S6jjDmnInmlYhcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbc2hhZG93Q29sb3I9JyMwMDAwMDAnXSDpmLTlvbHpopzoibJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbc2hhZG93T2Zmc2V0WD0wXSDpmLTlvbHmqKrlkJHlgY/np7tcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbc2hhZG93T2Zmc2V0WT0wXSDpmLTlvbHnurXlkJHlgY/np7tcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbdGV4dF0g5Zu+5b2i5Lit55qE6ZmE5Yqg5paH5pysXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRDb2xvcj0nIzAwMDAwMCddIOaWh+acrOminOiJslxuICogQHByb3BlcnR5IHtzdHJpbmd9IFt0ZXh0Rm9udF0g6ZmE5Yqg5paH5pys5qC35byP77yMZWc6J2JvbGQgMThweCB2ZXJkYW5hJ1xuICogQHByb3BlcnR5IHtzdHJpbmd9IFt0ZXh0UG9zaXRpb249J2VuZCddIOmZhOWKoOaWh+acrOS9jee9riwg5Y+v5Lul5pivIGluc2lkZSwgbGVmdCwgcmlnaHQsIHRvcCwgYm90dG9tXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRBbGlnbl0g6buY6K6k5qC55o2udGV4dFBvc2l0aW9u6Ieq5Yqo6K6+572u77yM6ZmE5Yqg5paH5pys5rC05bmz5a+56b2Q44CCXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg5Y+v5Lul5pivc3RhcnQsIGVuZCwgbGVmdCwgcmlnaHQsIGNlbnRlclxuICogQHByb3BlcnR5IHtzdHJpbmd9IFt0ZXh0QmFzZWxpbmVdIOm7mOiupOagueaNrnRleHRQb3NpdGlvbuiHquWKqOiuvue9ru+8jOmZhOWKoOaWh+acrOWeguebtOWvuem9kOOAglxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIOWPr+S7peaYr3RvcCwgYm90dG9tLCBtaWRkbGUsIGFscGhhYmV0aWMsIGhhbmdpbmcsIGlkZW9ncmFwaGljXG4gKi9cbmRlZmluZShcbiAgICBmdW5jdGlvbiAocmVxdWlyZSkge1xuICAgICAgICB2YXIgQmFzZSA9IHJlcXVpcmUoJy4vQmFzZScpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAYWxpYXMgbW9kdWxlOnpyZW5kZXIvc2hhcGUvRWxsaXBzZVxuICAgICAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgICAgICogQGV4dGVuZHMgbW9kdWxlOnpyZW5kZXIvc2hhcGUvQmFzZVxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICAgICAgICAgKi9cbiAgICAgICAgdmFyIEVsbGlwc2UgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgICAgICBCYXNlLmNhbGwodGhpcywgb3B0aW9ucyk7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOakreWchue7mOWItuagt+W8j1xuICAgICAgICAgICAgICogQG5hbWUgbW9kdWxlOnpyZW5kZXIvc2hhcGUvRWxsaXBzZSNzdHlsZVxuICAgICAgICAgICAgICogQHR5cGUge21vZHVsZTp6cmVuZGVyL3NoYXBlL0VsbGlwc2V+SUVsbGlwc2VTdHlsZX1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDmpK3lnIbpq5jkuq7nu5jliLbmoLflvI9cbiAgICAgICAgICAgICAqIEBuYW1lIG1vZHVsZTp6cmVuZGVyL3NoYXBlL0VsbGlwc2UjaGlnaGxpZ2h0U3R5bGVcbiAgICAgICAgICAgICAqIEB0eXBlIHttb2R1bGU6enJlbmRlci9zaGFwZS9FbGxpcHNlfklFbGxpcHNlU3R5bGV9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgfTtcblxuICAgICAgICBFbGxpcHNlLnByb3RvdHlwZSA9IHtcbiAgICAgICAgICAgIHR5cGU6ICdlbGxpcHNlJyxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDmnoTlu7rmpK3lnIbnmoRQYXRoXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRH0gY3R4XG4gICAgICAgICAgICAgKiBAcGFyYW0ge21vZHVsZTp6cmVuZGVyL3NoYXBlL0VsbGlwc2V+SUVsbGlwc2VTdHlsZX0gc3R5bGVcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgYnVpbGRQYXRoIDogZnVuY3Rpb24oY3R4LCBzdHlsZSkge1xuICAgICAgICAgICAgICAgIHZhciBrID0gMC41NTIyODQ4O1xuICAgICAgICAgICAgICAgIHZhciB4ID0gc3R5bGUueDtcbiAgICAgICAgICAgICAgICB2YXIgeSA9IHN0eWxlLnk7XG4gICAgICAgICAgICAgICAgdmFyIGEgPSBzdHlsZS5hO1xuICAgICAgICAgICAgICAgIHZhciBiID0gc3R5bGUuYjtcbiAgICAgICAgICAgICAgICB2YXIgb3ggPSBhICogazsgLy8g5rC05bmz5o6n5Yi254K55YGP56e76YePXG4gICAgICAgICAgICAgICAgdmFyIG95ID0gYiAqIGs7IC8vIOWeguebtOaOp+WItueCueWBj+enu+mHj1xuICAgICAgICAgICAgICAgIC8vIOS7juakreWchueahOW3puerr+eCueW8gOWni+mhuuaXtumSiOe7mOWItuWbm+adoeS4ieasoei0neWhnuWwlOabsue6v1xuICAgICAgICAgICAgICAgIGN0eC5tb3ZlVG8oeCAtIGEsIHkpO1xuICAgICAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKHggLSBhLCB5IC0gb3ksIHggLSBveCwgeSAtIGIsIHgsIHkgLSBiKTtcbiAgICAgICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyh4ICsgb3gsIHkgLSBiLCB4ICsgYSwgeSAtIG95LCB4ICsgYSwgeSk7XG4gICAgICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8oeCArIGEsIHkgKyBveSwgeCArIG94LCB5ICsgYiwgeCwgeSArIGIpO1xuICAgICAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKHggLSBveCwgeSArIGIsIHggLSBhLCB5ICsgb3ksIHggLSBhLCB5KTtcbiAgICAgICAgICAgICAgICBjdHguY2xvc2VQYXRoKCk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog6K6h566X6L+U5Zue5qSt5ZyG5YyF5Zu055uS55+p5b2i44CCXG4gICAgICAgICAgICAgKiBAcGFyYW0ge21vZHVsZTp6cmVuZGVyL3NoYXBlL0VsbGlwc2V+SUVsbGlwc2VTdHlsZX0gc3R5bGVcbiAgICAgICAgICAgICAqIEByZXR1cm4ge21vZHVsZTp6cmVuZGVyL3NoYXBlL0Jhc2V+SUJvdW5kaW5nUmVjdH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZ2V0UmVjdCA6IGZ1bmN0aW9uKHN0eWxlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0eWxlLl9fcmVjdCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3R5bGUuX19yZWN0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB2YXIgbGluZVdpZHRoO1xuICAgICAgICAgICAgICAgIGlmIChzdHlsZS5icnVzaFR5cGUgPT0gJ3N0cm9rZScgfHwgc3R5bGUuYnJ1c2hUeXBlID09ICdmaWxsJykge1xuICAgICAgICAgICAgICAgICAgICBsaW5lV2lkdGggPSBzdHlsZS5saW5lV2lkdGggfHwgMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGxpbmVXaWR0aCA9IDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHN0eWxlLl9fcmVjdCA9IHtcbiAgICAgICAgICAgICAgICAgICAgeCA6IE1hdGgucm91bmQoc3R5bGUueCAtIHN0eWxlLmEgLSBsaW5lV2lkdGggLyAyKSxcbiAgICAgICAgICAgICAgICAgICAgeSA6IE1hdGgucm91bmQoc3R5bGUueSAtIHN0eWxlLmIgLSBsaW5lV2lkdGggLyAyKSxcbiAgICAgICAgICAgICAgICAgICAgd2lkdGggOiBzdHlsZS5hICogMiArIGxpbmVXaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0IDogc3R5bGUuYiAqIDIgKyBsaW5lV2lkdGhcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBzdHlsZS5fX3JlY3Q7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgcmVxdWlyZSgnLi4vdG9vbC91dGlsJykuaW5oZXJpdHMoRWxsaXBzZSwgQmFzZSk7XG4gICAgICAgIHJldHVybiBFbGxpcHNlO1xuICAgIH1cbik7XG4iXSwiZmlsZSI6InBsdWdpbnMvenJlbmRlci0yLjEuMC9zcmMvc2hhcGUvRWxsaXBzZS5qcyJ9
