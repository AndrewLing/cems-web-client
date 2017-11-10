/**
 * n角星（n>3）
 * @module zrender/shape/Star
 * @author sushuang (宿爽, sushuang0322@gmail.com)
 * @example
 *     var Star = require('zrender/shape/Star');
 *     var shape = new Star({
 *         style: {
 *             x: 200,
 *             y: 100,
 *             r: 150,
 *             n: 5,
 *             text: '五角星'
 *         }
 *     });
 *     zr.addShape(shape);
 */

/**
 * @typedef {Object} IStarStyle
 * @property {number} x n角星外接圆心x坐标
 * @property {number} y n角星外接圆心y坐标
 * @property {number} r n角星外接圆半径
 * @property {number} [r0] n角星内部顶点（凹点）的外接圆半径。
 *                         如果不指定此参数，则自动计算：取相隔外部顶点连线的交点作内部顶点。
 * @property {number} n 指明几角星
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
         * @alias module:zrender/shape/Star
         * @param {Object} options
         * @constructor
         * @extends module:zrender/shape/Base
         */
        var Star = function(options) {
            Base.call(this, options);
            /**
             * n角星绘制样式
             * @name module:zrender/shape/Star#style
             * @type {module:zrender/shape/Star~IStarStyle}
             */
            /**
             * n角星高亮绘制样式
             * @name module:zrender/shape/Star#highlightStyle
             * @type {module:zrender/shape/Star~IStarStyle}
             */
        };

        Star.prototype = {
            type: 'star',

            /**
             * 创建n角星（n>3）路径
             * @param {CanvasRenderingContext2D} ctx
             * @param {module:zrender/shape/Star~IStarStyle} style
             */
            buildPath : function(ctx, style) {
                var n = style.n;
                if (!n || n < 2) {
                    return;
                }

                var x = style.x;
                var y = style.y;
                var r = style.r;
                var r0 = style.r0;

                // 如果未指定内部顶点外接圆半径，则自动计算
                if (r0 == null) {
                    r0 = n > 4
                        // 相隔的外部顶点的连线的交点，
                        // 被取为内部交点，以此计算r0
                        ? r * cos(2 * PI / n) / cos(PI / n)
                        // 二三四角星的特殊处理
                        : r / 3;
                }

                var dStep = PI / n;
                var deg = -PI / 2;
                var xStart = x + r * cos(deg);
                var yStart = y + r * sin(deg);
                deg += dStep;

                // 记录边界点，用于判断inside
                var pointList = style.pointList = [];
                pointList.push([ xStart, yStart ]);
                for (var i = 0, end = n * 2 - 1, ri; i < end; i++) {
                    ri = i % 2 === 0 ? r0 : r;
                    pointList.push([ x + ri * cos(deg), y + ri * sin(deg) ]);
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
             * 返回n角星包围盒矩形
             * @param {module:zrender/shape/Star~IStarStyle} style
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
                    x : Math.round(style.x - style.r - lineWidth / 2),
                    y : Math.round(style.y - style.r - lineWidth / 2),
                    width : style.r * 2 + lineWidth,
                    height : style.r * 2 + lineWidth
                };
                
                return style.__rect;
            }
        };

        require('../tool/util').inherits(Star, Base);
        return Star;
    }
);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3NoYXBlL1N0YXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBu6KeS5pif77yIbj4z77yJXG4gKiBAbW9kdWxlIHpyZW5kZXIvc2hhcGUvU3RhclxuICogQGF1dGhvciBzdXNodWFuZyAo5a6/54i9LCBzdXNodWFuZzAzMjJAZ21haWwuY29tKVxuICogQGV4YW1wbGVcbiAqICAgICB2YXIgU3RhciA9IHJlcXVpcmUoJ3pyZW5kZXIvc2hhcGUvU3RhcicpO1xuICogICAgIHZhciBzaGFwZSA9IG5ldyBTdGFyKHtcbiAqICAgICAgICAgc3R5bGU6IHtcbiAqICAgICAgICAgICAgIHg6IDIwMCxcbiAqICAgICAgICAgICAgIHk6IDEwMCxcbiAqICAgICAgICAgICAgIHI6IDE1MCxcbiAqICAgICAgICAgICAgIG46IDUsXG4gKiAgICAgICAgICAgICB0ZXh0OiAn5LqU6KeS5pifJ1xuICogICAgICAgICB9XG4gKiAgICAgfSk7XG4gKiAgICAgenIuYWRkU2hhcGUoc2hhcGUpO1xuICovXG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gSVN0YXJTdHlsZVxuICogQHByb3BlcnR5IHtudW1iZXJ9IHggbuinkuaYn+WkluaOpeWchuW/g3jlnZDmoIdcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB5IG7op5LmmJ/lpJbmjqXlnIblv4N55Z2Q5qCHXG4gKiBAcHJvcGVydHkge251bWJlcn0gciBu6KeS5pif5aSW5o6l5ZyG5Y2K5b6EXG4gKiBAcHJvcGVydHkge251bWJlcn0gW3IwXSBu6KeS5pif5YaF6YOo6aG254K577yI5Ye554K577yJ55qE5aSW5o6l5ZyG5Y2K5b6E44CCXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICDlpoLmnpzkuI3mjIflrprmraTlj4LmlbDvvIzliJnoh6rliqjorqHnrpfvvJrlj5bnm7jpmpTlpJbpg6jpobbngrnov57nur/nmoTkuqTngrnkvZzlhoXpg6jpobbngrnjgIJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBuIOaMh+aYjuWHoOinkuaYn1xuICogQHByb3BlcnR5IHtzdHJpbmd9IFticnVzaFR5cGU9J2ZpbGwnXVxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtjb2xvcj0nIzAwMDAwMCddIOWhq+WFheminOiJslxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtzdHJva2VDb2xvcj0nIzAwMDAwMCddIOaPj+i+ueminOiJslxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtsaW5lQ2FwZT0nYnV0dCddIOe6v+W4veagt+W8j++8jOWPr+S7peaYryBidXR0LCByb3VuZCwgc3F1YXJlXG4gKiBAcHJvcGVydHkge251bWJlcn0gW2xpbmVXaWR0aD0xXSDmj4/ovrnlrr3luqZcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbb3BhY2l0eT0xXSDnu5jliLbpgI/mmI7luqZcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbc2hhZG93Qmx1cj0wXSDpmLTlvbHmqKHns4rluqbvvIzlpKfkuo4w5pyJ5pWIXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3NoYWRvd0NvbG9yPScjMDAwMDAwJ10g6Zi05b2x6aKc6ImyXG4gKiBAcHJvcGVydHkge251bWJlcn0gW3NoYWRvd09mZnNldFg9MF0g6Zi05b2x5qiq5ZCR5YGP56e7XG4gKiBAcHJvcGVydHkge251bWJlcn0gW3NoYWRvd09mZnNldFk9MF0g6Zi05b2x57q15ZCR5YGP56e7XG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRdIOWbvuW9ouS4reeahOmZhOWKoOaWh+acrFxuICogQHByb3BlcnR5IHtzdHJpbmd9IFt0ZXh0Q29sb3I9JyMwMDAwMDAnXSDmlofmnKzpopzoibJcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbdGV4dEZvbnRdIOmZhOWKoOaWh+acrOagt+W8j++8jGVnOidib2xkIDE4cHggdmVyZGFuYSdcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbdGV4dFBvc2l0aW9uPSdlbmQnXSDpmYTliqDmlofmnKzkvY3nva4sIOWPr+S7peaYryBpbnNpZGUsIGxlZnQsIHJpZ2h0LCB0b3AsIGJvdHRvbVxuICogQHByb3BlcnR5IHtzdHJpbmd9IFt0ZXh0QWxpZ25dIOm7mOiupOagueaNrnRleHRQb3NpdGlvbuiHquWKqOiuvue9ru+8jOmZhOWKoOaWh+acrOawtOW5s+Wvuem9kOOAglxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIOWPr+S7peaYr3N0YXJ0LCBlbmQsIGxlZnQsIHJpZ2h0LCBjZW50ZXJcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbdGV4dEJhc2VsaW5lXSDpu5jorqTmoLnmja50ZXh0UG9zaXRpb27oh6rliqjorr7nva7vvIzpmYTliqDmlofmnKzlnoLnm7Tlr7npvZDjgIJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDlj6/ku6XmmK90b3AsIGJvdHRvbSwgbWlkZGxlLCBhbHBoYWJldGljLCBoYW5naW5nLCBpZGVvZ3JhcGhpY1xuICovXG5cbmRlZmluZShcbiAgICBmdW5jdGlvbiAocmVxdWlyZSkge1xuXG4gICAgICAgIHZhciBtYXRoID0gcmVxdWlyZSgnLi4vdG9vbC9tYXRoJyk7XG4gICAgICAgIHZhciBzaW4gPSBtYXRoLnNpbjtcbiAgICAgICAgdmFyIGNvcyA9IG1hdGguY29zO1xuICAgICAgICB2YXIgUEkgPSBNYXRoLlBJO1xuXG4gICAgICAgIHZhciBCYXNlID0gcmVxdWlyZSgnLi9CYXNlJyk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBhbGlhcyBtb2R1bGU6enJlbmRlci9zaGFwZS9TdGFyXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gICAgICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAgICAgKiBAZXh0ZW5kcyBtb2R1bGU6enJlbmRlci9zaGFwZS9CYXNlXG4gICAgICAgICAqL1xuICAgICAgICB2YXIgU3RhciA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIEJhc2UuY2FsbCh0aGlzLCBvcHRpb25zKTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogbuinkuaYn+e7mOWItuagt+W8j1xuICAgICAgICAgICAgICogQG5hbWUgbW9kdWxlOnpyZW5kZXIvc2hhcGUvU3RhciNzdHlsZVxuICAgICAgICAgICAgICogQHR5cGUge21vZHVsZTp6cmVuZGVyL3NoYXBlL1N0YXJ+SVN0YXJTdHlsZX1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBu6KeS5pif6auY5Lqu57uY5Yi25qC35byPXG4gICAgICAgICAgICAgKiBAbmFtZSBtb2R1bGU6enJlbmRlci9zaGFwZS9TdGFyI2hpZ2hsaWdodFN0eWxlXG4gICAgICAgICAgICAgKiBAdHlwZSB7bW9kdWxlOnpyZW5kZXIvc2hhcGUvU3Rhcn5JU3RhclN0eWxlfVxuICAgICAgICAgICAgICovXG4gICAgICAgIH07XG5cbiAgICAgICAgU3Rhci5wcm90b3R5cGUgPSB7XG4gICAgICAgICAgICB0eXBlOiAnc3RhcicsXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5Yib5bu6buinkuaYn++8iG4+M++8iei3r+W+hFxuICAgICAgICAgICAgICogQHBhcmFtIHtDYW52YXNSZW5kZXJpbmdDb250ZXh0MkR9IGN0eFxuICAgICAgICAgICAgICogQHBhcmFtIHttb2R1bGU6enJlbmRlci9zaGFwZS9TdGFyfklTdGFyU3R5bGV9IHN0eWxlXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGJ1aWxkUGF0aCA6IGZ1bmN0aW9uKGN0eCwgc3R5bGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgbiA9IHN0eWxlLm47XG4gICAgICAgICAgICAgICAgaWYgKCFuIHx8IG4gPCAyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgeCA9IHN0eWxlLng7XG4gICAgICAgICAgICAgICAgdmFyIHkgPSBzdHlsZS55O1xuICAgICAgICAgICAgICAgIHZhciByID0gc3R5bGUucjtcbiAgICAgICAgICAgICAgICB2YXIgcjAgPSBzdHlsZS5yMDtcblxuICAgICAgICAgICAgICAgIC8vIOWmguaenOacquaMh+WumuWGhemDqOmhtueCueWkluaOpeWchuWNiuW+hO+8jOWImeiHquWKqOiuoeeul1xuICAgICAgICAgICAgICAgIGlmIChyMCA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHIwID0gbiA+IDRcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOebuOmalOeahOWklumDqOmhtueCueeahOi/nue6v+eahOS6pOeCue+8jFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g6KKr5Y+W5Li65YaF6YOo5Lqk54K577yM5Lul5q2k6K6h566XcjBcbiAgICAgICAgICAgICAgICAgICAgICAgID8gciAqIGNvcygyICogUEkgLyBuKSAvIGNvcyhQSSAvIG4pXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDkuozkuInlm5vop5LmmJ/nmoTnibnmrorlpITnkIZcbiAgICAgICAgICAgICAgICAgICAgICAgIDogciAvIDM7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIGRTdGVwID0gUEkgLyBuO1xuICAgICAgICAgICAgICAgIHZhciBkZWcgPSAtUEkgLyAyO1xuICAgICAgICAgICAgICAgIHZhciB4U3RhcnQgPSB4ICsgciAqIGNvcyhkZWcpO1xuICAgICAgICAgICAgICAgIHZhciB5U3RhcnQgPSB5ICsgciAqIHNpbihkZWcpO1xuICAgICAgICAgICAgICAgIGRlZyArPSBkU3RlcDtcblxuICAgICAgICAgICAgICAgIC8vIOiusOW9lei+ueeVjOeCue+8jOeUqOS6juWIpOaWrWluc2lkZVxuICAgICAgICAgICAgICAgIHZhciBwb2ludExpc3QgPSBzdHlsZS5wb2ludExpc3QgPSBbXTtcbiAgICAgICAgICAgICAgICBwb2ludExpc3QucHVzaChbIHhTdGFydCwgeVN0YXJ0IF0pO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBlbmQgPSBuICogMiAtIDEsIHJpOyBpIDwgZW5kOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgcmkgPSBpICUgMiA9PT0gMCA/IHIwIDogcjtcbiAgICAgICAgICAgICAgICAgICAgcG9pbnRMaXN0LnB1c2goWyB4ICsgcmkgKiBjb3MoZGVnKSwgeSArIHJpICogc2luKGRlZykgXSk7XG4gICAgICAgICAgICAgICAgICAgIGRlZyArPSBkU3RlcDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcG9pbnRMaXN0LnB1c2goWyB4U3RhcnQsIHlTdGFydCBdKTtcblxuICAgICAgICAgICAgICAgIC8vIOe7mOWItlxuICAgICAgICAgICAgICAgIGN0eC5tb3ZlVG8ocG9pbnRMaXN0WzBdWzBdLCBwb2ludExpc3RbMF1bMV0pO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcG9pbnRMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5saW5lVG8ocG9pbnRMaXN0W2ldWzBdLCBwb2ludExpc3RbaV1bMV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjdHguY2xvc2VQYXRoKCk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOi/lOWbnm7op5LmmJ/ljIXlm7Tnm5Lnn6nlvaJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bW9kdWxlOnpyZW5kZXIvc2hhcGUvU3Rhcn5JU3RhclN0eWxlfSBzdHlsZVxuICAgICAgICAgICAgICogQHJldHVybiB7bW9kdWxlOnpyZW5kZXIvc2hhcGUvQmFzZX5JQm91bmRpbmdSZWN0fVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBnZXRSZWN0IDogZnVuY3Rpb24oc3R5bGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3R5bGUuX19yZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzdHlsZS5fX3JlY3Q7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHZhciBsaW5lV2lkdGg7XG4gICAgICAgICAgICAgICAgaWYgKHN0eWxlLmJydXNoVHlwZSA9PSAnc3Ryb2tlJyB8fCBzdHlsZS5icnVzaFR5cGUgPT0gJ2ZpbGwnKSB7XG4gICAgICAgICAgICAgICAgICAgIGxpbmVXaWR0aCA9IHN0eWxlLmxpbmVXaWR0aCB8fCAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbGluZVdpZHRoID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc3R5bGUuX19yZWN0ID0ge1xuICAgICAgICAgICAgICAgICAgICB4IDogTWF0aC5yb3VuZChzdHlsZS54IC0gc3R5bGUuciAtIGxpbmVXaWR0aCAvIDIpLFxuICAgICAgICAgICAgICAgICAgICB5IDogTWF0aC5yb3VuZChzdHlsZS55IC0gc3R5bGUuciAtIGxpbmVXaWR0aCAvIDIpLFxuICAgICAgICAgICAgICAgICAgICB3aWR0aCA6IHN0eWxlLnIgKiAyICsgbGluZVdpZHRoLFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQgOiBzdHlsZS5yICogMiArIGxpbmVXaWR0aFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0eWxlLl9fcmVjdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICByZXF1aXJlKCcuLi90b29sL3V0aWwnKS5pbmhlcml0cyhTdGFyLCBCYXNlKTtcbiAgICAgICAgcmV0dXJuIFN0YXI7XG4gICAgfVxuKTtcbiJdLCJmaWxlIjoicGx1Z2lucy96cmVuZGVyLTIuMS4wL3NyYy9zaGFwZS9TdGFyLmpzIn0=
