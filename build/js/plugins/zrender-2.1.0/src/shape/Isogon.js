/**
 * 正多边形
 * @module zrender/shape/Isogon
 * @author sushuang (宿爽, sushuang0322@gmail.com)
 */

/**
 * @typedef {Object} IIsogonStyle
 * @property {number} x 正n边形外接圆心x坐标
 * @property {number} y 正n边形外接圆心y坐标
 * @property {number} r 正n边形外接圆半径
 * @property {number} n 指明正几边形
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
        var math = require('../tool/math');
        var sin = math.sin;
        var cos = math.cos;
        var PI = Math.PI;

        var Base = require('./Base');

        /**
         * @constructor
         * @alias module:zrender/shape/Isogon
         * @param {Object} options
         */
        function Isogon(options) {
            Base.call(this, options);
            /**
             * 多边形绘制样式
             * @name module:zrender/shape/Isogon#style
             * @type {module:zrender/shape/Isogon~IIsogonStyle}
             */
            /**
             * 多边形高亮绘制样式
             * @name module:zrender/shape/Isogon#highlightStyle
             * @type {module:zrender/shape/Isogon~IIsogonStyle}
             */
        }

        Isogon.prototype = {
            type: 'isogon',

            /**
             * 创建n角星（n>=3）路径
             * @param {CanvasRenderingContext2D} ctx
             * @param {module:zrender/shape/Isogon~IIsogonStyle} style
             */
            buildPath : function (ctx, style) {
                var n = style.n;
                if (!n || n < 2) {
                    return;
                }

                var x = style.x;
                var y = style.y;
                var r = style.r;

                var dStep = 2 * PI / n;
                var deg = -PI / 2;
                var xStart = x + r * cos(deg);
                var yStart = y + r * sin(deg);
                deg += dStep;

                // 记录边界点，用于判断insight
                var pointList = style.pointList = [];
                pointList.push([ xStart, yStart ]);
                for (var i = 0, end = n - 1; i < end; i++) {
                    pointList.push([ x + r * cos(deg), y + r * sin(deg) ]);
                    deg += dStep;
                }
                pointList.push([ xStart, yStart ]);

                // 绘制
                ctx.moveTo(pointList[0][0], pointList[0][1]);
                for (var i = 0; i < pointList.length; i++) {
                    ctx.lineTo(pointList[i][0], pointList[i][1]);
                }
                ctx.closePath();

                return;
            },

            /**
             * 计算返回正多边形的包围盒矩形
             * @param {module:zrender/shape/Isogon~IIsogonStyle} style
             * @return {module:zrender/shape/Base~IBoundingRect}
             */
            getRect : function (style) {
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
                    x : Math.round(style.x - style.r - lineWidth / 2),
                    y : Math.round(style.y - style.r - lineWidth / 2),
                    width : style.r * 2 + lineWidth,
                    height : style.r * 2 + lineWidth
                };
                
                return style.__rect;
            }
        };

        require('../tool/util').inherits(Isogon, Base);
        return Isogon;
    }
);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3NoYXBlL0lzb2dvbi5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIOato+Wkmui+ueW9olxuICogQG1vZHVsZSB6cmVuZGVyL3NoYXBlL0lzb2dvblxuICogQGF1dGhvciBzdXNodWFuZyAo5a6/54i9LCBzdXNodWFuZzAzMjJAZ21haWwuY29tKVxuICovXG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gSUlzb2dvblN0eWxlXG4gKiBAcHJvcGVydHkge251bWJlcn0geCDmraNu6L655b2i5aSW5o6l5ZyG5b+DeOWdkOagh1xuICogQHByb3BlcnR5IHtudW1iZXJ9IHkg5q2jbui+ueW9ouWkluaOpeWchuW/g3nlnZDmoIdcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSByIOato27ovrnlvaLlpJbmjqXlnIbljYrlvoRcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBuIOaMh+aYjuato+WHoOi+ueW9olxuICogQHByb3BlcnR5IHtzdHJpbmd9IFticnVzaFR5cGU9J2ZpbGwnXVxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtjb2xvcj0nIzAwMDAwMCddIOWhq+WFheminOiJslxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtzdHJva2VDb2xvcj0nIzAwMDAwMCddIOaPj+i+ueminOiJslxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtsaW5lQ2FwZT0nYnV0dCddIOe6v+W4veagt+W8j++8jOWPr+S7peaYryBidXR0LCByb3VuZCwgc3F1YXJlXG4gKiBAcHJvcGVydHkge251bWJlcn0gW2xpbmVXaWR0aD0xXSDmj4/ovrnlrr3luqZcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbb3BhY2l0eT0xXSDnu5jliLbpgI/mmI7luqZcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbc2hhZG93Qmx1cj0wXSDpmLTlvbHmqKHns4rluqbvvIzlpKfkuo4w5pyJ5pWIXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3NoYWRvd0NvbG9yPScjMDAwMDAwJ10g6Zi05b2x6aKc6ImyXG4gKiBAcHJvcGVydHkge251bWJlcn0gW3NoYWRvd09mZnNldFg9MF0g6Zi05b2x5qiq5ZCR5YGP56e7XG4gKiBAcHJvcGVydHkge251bWJlcn0gW3NoYWRvd09mZnNldFk9MF0g6Zi05b2x57q15ZCR5YGP56e7XG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRdIOWbvuW9ouS4reeahOmZhOWKoOaWh+acrFxuICogQHByb3BlcnR5IHtzdHJpbmd9IFt0ZXh0Q29sb3I9JyMwMDAwMDAnXSDmlofmnKzpopzoibJcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbdGV4dEZvbnRdIOmZhOWKoOaWh+acrOagt+W8j++8jGVnOidib2xkIDE4cHggdmVyZGFuYSdcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbdGV4dFBvc2l0aW9uPSdlbmQnXSDpmYTliqDmlofmnKzkvY3nva4sIOWPr+S7peaYryBpbnNpZGUsIGxlZnQsIHJpZ2h0LCB0b3AsIGJvdHRvbVxuICogQHByb3BlcnR5IHtzdHJpbmd9IFt0ZXh0QWxpZ25dIOm7mOiupOagueaNrnRleHRQb3NpdGlvbuiHquWKqOiuvue9ru+8jOmZhOWKoOaWh+acrOawtOW5s+Wvuem9kOOAglxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIOWPr+S7peaYr3N0YXJ0LCBlbmQsIGxlZnQsIHJpZ2h0LCBjZW50ZXJcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbdGV4dEJhc2VsaW5lXSDpu5jorqTmoLnmja50ZXh0UG9zaXRpb27oh6rliqjorr7nva7vvIzpmYTliqDmlofmnKzlnoLnm7Tlr7npvZDjgIJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDlj6/ku6XmmK90b3AsIGJvdHRvbSwgbWlkZGxlLCBhbHBoYWJldGljLCBoYW5naW5nLCBpZGVvZ3JhcGhpY1xuICovXG5kZWZpbmUoXG4gICAgZnVuY3Rpb24gKHJlcXVpcmUpIHtcbiAgICAgICAgdmFyIG1hdGggPSByZXF1aXJlKCcuLi90b29sL21hdGgnKTtcbiAgICAgICAgdmFyIHNpbiA9IG1hdGguc2luO1xuICAgICAgICB2YXIgY29zID0gbWF0aC5jb3M7XG4gICAgICAgIHZhciBQSSA9IE1hdGguUEk7XG5cbiAgICAgICAgdmFyIEJhc2UgPSByZXF1aXJlKCcuL0Jhc2UnKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQGNvbnN0cnVjdG9yXG4gICAgICAgICAqIEBhbGlhcyBtb2R1bGU6enJlbmRlci9zaGFwZS9Jc29nb25cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIElzb2dvbihvcHRpb25zKSB7XG4gICAgICAgICAgICBCYXNlLmNhbGwodGhpcywgb3B0aW9ucyk7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOWkmui+ueW9oue7mOWItuagt+W8j1xuICAgICAgICAgICAgICogQG5hbWUgbW9kdWxlOnpyZW5kZXIvc2hhcGUvSXNvZ29uI3N0eWxlXG4gICAgICAgICAgICAgKiBAdHlwZSB7bW9kdWxlOnpyZW5kZXIvc2hhcGUvSXNvZ29ufklJc29nb25TdHlsZX1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDlpJrovrnlvaLpq5jkuq7nu5jliLbmoLflvI9cbiAgICAgICAgICAgICAqIEBuYW1lIG1vZHVsZTp6cmVuZGVyL3NoYXBlL0lzb2dvbiNoaWdobGlnaHRTdHlsZVxuICAgICAgICAgICAgICogQHR5cGUge21vZHVsZTp6cmVuZGVyL3NoYXBlL0lzb2dvbn5JSXNvZ29uU3R5bGV9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgfVxuXG4gICAgICAgIElzb2dvbi5wcm90b3R5cGUgPSB7XG4gICAgICAgICAgICB0eXBlOiAnaXNvZ29uJyxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDliJvlu7pu6KeS5pif77yIbj49M++8iei3r+W+hFxuICAgICAgICAgICAgICogQHBhcmFtIHtDYW52YXNSZW5kZXJpbmdDb250ZXh0MkR9IGN0eFxuICAgICAgICAgICAgICogQHBhcmFtIHttb2R1bGU6enJlbmRlci9zaGFwZS9Jc29nb25+SUlzb2dvblN0eWxlfSBzdHlsZVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBidWlsZFBhdGggOiBmdW5jdGlvbiAoY3R4LCBzdHlsZSkge1xuICAgICAgICAgICAgICAgIHZhciBuID0gc3R5bGUubjtcbiAgICAgICAgICAgICAgICBpZiAoIW4gfHwgbiA8IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciB4ID0gc3R5bGUueDtcbiAgICAgICAgICAgICAgICB2YXIgeSA9IHN0eWxlLnk7XG4gICAgICAgICAgICAgICAgdmFyIHIgPSBzdHlsZS5yO1xuXG4gICAgICAgICAgICAgICAgdmFyIGRTdGVwID0gMiAqIFBJIC8gbjtcbiAgICAgICAgICAgICAgICB2YXIgZGVnID0gLVBJIC8gMjtcbiAgICAgICAgICAgICAgICB2YXIgeFN0YXJ0ID0geCArIHIgKiBjb3MoZGVnKTtcbiAgICAgICAgICAgICAgICB2YXIgeVN0YXJ0ID0geSArIHIgKiBzaW4oZGVnKTtcbiAgICAgICAgICAgICAgICBkZWcgKz0gZFN0ZXA7XG5cbiAgICAgICAgICAgICAgICAvLyDorrDlvZXovrnnlYzngrnvvIznlKjkuo7liKTmlq1pbnNpZ2h0XG4gICAgICAgICAgICAgICAgdmFyIHBvaW50TGlzdCA9IHN0eWxlLnBvaW50TGlzdCA9IFtdO1xuICAgICAgICAgICAgICAgIHBvaW50TGlzdC5wdXNoKFsgeFN0YXJ0LCB5U3RhcnQgXSk7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGVuZCA9IG4gLSAxOyBpIDwgZW5kOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgcG9pbnRMaXN0LnB1c2goWyB4ICsgciAqIGNvcyhkZWcpLCB5ICsgciAqIHNpbihkZWcpIF0pO1xuICAgICAgICAgICAgICAgICAgICBkZWcgKz0gZFN0ZXA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHBvaW50TGlzdC5wdXNoKFsgeFN0YXJ0LCB5U3RhcnQgXSk7XG5cbiAgICAgICAgICAgICAgICAvLyDnu5jliLZcbiAgICAgICAgICAgICAgICBjdHgubW92ZVRvKHBvaW50TGlzdFswXVswXSwgcG9pbnRMaXN0WzBdWzFdKTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBvaW50TGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBjdHgubGluZVRvKHBvaW50TGlzdFtpXVswXSwgcG9pbnRMaXN0W2ldWzFdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY3R4LmNsb3NlUGF0aCgpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDorqHnrpfov5Tlm57mraPlpJrovrnlvaLnmoTljIXlm7Tnm5Lnn6nlvaJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bW9kdWxlOnpyZW5kZXIvc2hhcGUvSXNvZ29ufklJc29nb25TdHlsZX0gc3R5bGVcbiAgICAgICAgICAgICAqIEByZXR1cm4ge21vZHVsZTp6cmVuZGVyL3NoYXBlL0Jhc2V+SUJvdW5kaW5nUmVjdH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZ2V0UmVjdCA6IGZ1bmN0aW9uIChzdHlsZSkge1xuICAgICAgICAgICAgICAgIGlmIChzdHlsZS5fX3JlY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN0eWxlLl9fcmVjdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIGxpbmVXaWR0aDtcbiAgICAgICAgICAgICAgICBpZiAoc3R5bGUuYnJ1c2hUeXBlID09ICdzdHJva2UnIHx8IHN0eWxlLmJydXNoVHlwZSA9PSAnZmlsbCcpIHtcbiAgICAgICAgICAgICAgICAgICAgbGluZVdpZHRoID0gc3R5bGUubGluZVdpZHRoIHx8IDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBsaW5lV2lkdGggPSAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzdHlsZS5fX3JlY3QgPSB7XG4gICAgICAgICAgICAgICAgICAgIHggOiBNYXRoLnJvdW5kKHN0eWxlLnggLSBzdHlsZS5yIC0gbGluZVdpZHRoIC8gMiksXG4gICAgICAgICAgICAgICAgICAgIHkgOiBNYXRoLnJvdW5kKHN0eWxlLnkgLSBzdHlsZS5yIC0gbGluZVdpZHRoIC8gMiksXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoIDogc3R5bGUuciAqIDIgKyBsaW5lV2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodCA6IHN0eWxlLnIgKiAyICsgbGluZVdpZHRoXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gc3R5bGUuX19yZWN0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHJlcXVpcmUoJy4uL3Rvb2wvdXRpbCcpLmluaGVyaXRzKElzb2dvbiwgQmFzZSk7XG4gICAgICAgIHJldHVybiBJc29nb247XG4gICAgfVxuKTtcbiJdLCJmaWxlIjoicGx1Z2lucy96cmVuZGVyLTIuMS4wL3NyYy9zaGFwZS9Jc29nb24uanMifQ==
