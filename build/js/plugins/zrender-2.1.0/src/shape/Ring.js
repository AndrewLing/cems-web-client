/**
 * 圆环
 * @module zrender/shape/Ring
 * @author Kener (@Kener-林峰, kener.linfeng@gmail.com)
 *
 * @example
 *     var Ring = require('zrender/shape/Ring');
 *     var shape = new Ring({
 *         style: {
 *             x: 100,
 *             y: 100,
 *             r0: 30,
 *             r: 50
 *         }
 *     });
 *     zr.addShape(shape);
 */

/**
 * @typedef {Object} IRingStyle
 * @property {number} x 圆心x坐标
 * @property {number} y 圆心y坐标
 * @property {number} r0 内圆半径
 * @property {number} r 外圆半径
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
         * @alias module:zrender/shape/Ring
         * @constructor
         * @extends module:zrender/shape/Base
         * @param {Object} options
         */
        var Ring = function (options) {
            Base.call(this, options);
            /**
             * 圆环绘制样式
             * @name module:zrender/shape/Ring#style
             * @type {module:zrender/shape/Ring~IRingStyle}
             */
            /**
             * 圆环高亮绘制样式
             * @name module:zrender/shape/Ring#highlightStyle
             * @type {module:zrender/shape/Ring~IRingStyle}
             */
        };

        Ring.prototype = {
            type: 'ring',

            /**
             * 创建圆环路径
             * @param {CanvasRenderingContext2D} ctx
             * @param {module:zrender/shape/Ring~IRingStyle} style
             */
            buildPath : function (ctx, style) {
                // 非零环绕填充优化
                ctx.arc(style.x, style.y, style.r, 0, Math.PI * 2, false);
                ctx.moveTo(style.x + style.r0, style.y);
                ctx.arc(style.x, style.y, style.r0, 0, Math.PI * 2, true);
                return;
            },

            /**
             * 计算返回圆环包围盒矩阵
             * @param {module:zrender/shape/Ring~IRingStyle} style
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

        require('../tool/util').inherits(Ring, Base);
        return Ring;
    }
);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3NoYXBlL1JpbmcuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiDlnIbnjq9cbiAqIEBtb2R1bGUgenJlbmRlci9zaGFwZS9SaW5nXG4gKiBAYXV0aG9yIEtlbmVyIChAS2VuZXIt5p6X5bOwLCBrZW5lci5saW5mZW5nQGdtYWlsLmNvbSlcbiAqXG4gKiBAZXhhbXBsZVxuICogICAgIHZhciBSaW5nID0gcmVxdWlyZSgnenJlbmRlci9zaGFwZS9SaW5nJyk7XG4gKiAgICAgdmFyIHNoYXBlID0gbmV3IFJpbmcoe1xuICogICAgICAgICBzdHlsZToge1xuICogICAgICAgICAgICAgeDogMTAwLFxuICogICAgICAgICAgICAgeTogMTAwLFxuICogICAgICAgICAgICAgcjA6IDMwLFxuICogICAgICAgICAgICAgcjogNTBcbiAqICAgICAgICAgfVxuICogICAgIH0pO1xuICogICAgIHpyLmFkZFNoYXBlKHNoYXBlKTtcbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IElSaW5nU3R5bGVcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB4IOWchuW/g3jlnZDmoIdcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB5IOWchuW/g3nlnZDmoIdcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSByMCDlhoXlnIbljYrlvoRcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSByIOWkluWchuWNiuW+hFxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtjb2xvcj0nIzAwMDAwMCddIOWhq+WFheminOiJslxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtzdHJva2VDb2xvcj0nIzAwMDAwMCddIOaPj+i+ueminOiJslxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtsaW5lQ2FwZT0nYnV0dCddIOe6v+W4veagt+W8j++8jOWPr+S7peaYryBidXR0LCByb3VuZCwgc3F1YXJlXG4gKiBAcHJvcGVydHkge251bWJlcn0gW2xpbmVXaWR0aD0xXSDmj4/ovrnlrr3luqZcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbb3BhY2l0eT0xXSDnu5jliLbpgI/mmI7luqZcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbc2hhZG93Qmx1cj0wXSDpmLTlvbHmqKHns4rluqbvvIzlpKfkuo4w5pyJ5pWIXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3NoYWRvd0NvbG9yPScjMDAwMDAwJ10g6Zi05b2x6aKc6ImyXG4gKiBAcHJvcGVydHkge251bWJlcn0gW3NoYWRvd09mZnNldFg9MF0g6Zi05b2x5qiq5ZCR5YGP56e7XG4gKiBAcHJvcGVydHkge251bWJlcn0gW3NoYWRvd09mZnNldFk9MF0g6Zi05b2x57q15ZCR5YGP56e7XG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRdIOWbvuW9ouS4reeahOmZhOWKoOaWh+acrFxuICogQHByb3BlcnR5IHtzdHJpbmd9IFt0ZXh0Q29sb3I9JyMwMDAwMDAnXSDmlofmnKzpopzoibJcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbdGV4dEZvbnRdIOmZhOWKoOaWh+acrOagt+W8j++8jGVnOidib2xkIDE4cHggdmVyZGFuYSdcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbdGV4dFBvc2l0aW9uPSdlbmQnXSDpmYTliqDmlofmnKzkvY3nva4sIOWPr+S7peaYryBpbnNpZGUsIGxlZnQsIHJpZ2h0LCB0b3AsIGJvdHRvbVxuICogQHByb3BlcnR5IHtzdHJpbmd9IFt0ZXh0QWxpZ25dIOm7mOiupOagueaNrnRleHRQb3NpdGlvbuiHquWKqOiuvue9ru+8jOmZhOWKoOaWh+acrOawtOW5s+Wvuem9kOOAglxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIOWPr+S7peaYr3N0YXJ0LCBlbmQsIGxlZnQsIHJpZ2h0LCBjZW50ZXJcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbdGV4dEJhc2VsaW5lXSDpu5jorqTmoLnmja50ZXh0UG9zaXRpb27oh6rliqjorr7nva7vvIzpmYTliqDmlofmnKzlnoLnm7Tlr7npvZDjgIJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDlj6/ku6XmmK90b3AsIGJvdHRvbSwgbWlkZGxlLCBhbHBoYWJldGljLCBoYW5naW5nLCBpZGVvZ3JhcGhpY1xuICovXG5kZWZpbmUoXG4gICAgZnVuY3Rpb24gKHJlcXVpcmUpIHtcbiAgICAgICAgdmFyIEJhc2UgPSByZXF1aXJlKCcuL0Jhc2UnKTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAYWxpYXMgbW9kdWxlOnpyZW5kZXIvc2hhcGUvUmluZ1xuICAgICAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgICAgICogQGV4dGVuZHMgbW9kdWxlOnpyZW5kZXIvc2hhcGUvQmFzZVxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICAgICAgICAgKi9cbiAgICAgICAgdmFyIFJpbmcgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICAgICAgQmFzZS5jYWxsKHRoaXMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDlnIbnjq/nu5jliLbmoLflvI9cbiAgICAgICAgICAgICAqIEBuYW1lIG1vZHVsZTp6cmVuZGVyL3NoYXBlL1Jpbmcjc3R5bGVcbiAgICAgICAgICAgICAqIEB0eXBlIHttb2R1bGU6enJlbmRlci9zaGFwZS9SaW5nfklSaW5nU3R5bGV9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5ZyG546v6auY5Lqu57uY5Yi25qC35byPXG4gICAgICAgICAgICAgKiBAbmFtZSBtb2R1bGU6enJlbmRlci9zaGFwZS9SaW5nI2hpZ2hsaWdodFN0eWxlXG4gICAgICAgICAgICAgKiBAdHlwZSB7bW9kdWxlOnpyZW5kZXIvc2hhcGUvUmluZ35JUmluZ1N0eWxlfVxuICAgICAgICAgICAgICovXG4gICAgICAgIH07XG5cbiAgICAgICAgUmluZy5wcm90b3R5cGUgPSB7XG4gICAgICAgICAgICB0eXBlOiAncmluZycsXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5Yib5bu65ZyG546v6Lev5b6EXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRH0gY3R4XG4gICAgICAgICAgICAgKiBAcGFyYW0ge21vZHVsZTp6cmVuZGVyL3NoYXBlL1Jpbmd+SVJpbmdTdHlsZX0gc3R5bGVcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgYnVpbGRQYXRoIDogZnVuY3Rpb24gKGN0eCwgc3R5bGUpIHtcbiAgICAgICAgICAgICAgICAvLyDpnZ7pm7bnjq/nu5XloavlhYXkvJjljJZcbiAgICAgICAgICAgICAgICBjdHguYXJjKHN0eWxlLngsIHN0eWxlLnksIHN0eWxlLnIsIDAsIE1hdGguUEkgKiAyLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgY3R4Lm1vdmVUbyhzdHlsZS54ICsgc3R5bGUucjAsIHN0eWxlLnkpO1xuICAgICAgICAgICAgICAgIGN0eC5hcmMoc3R5bGUueCwgc3R5bGUueSwgc3R5bGUucjAsIDAsIE1hdGguUEkgKiAyLCB0cnVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOiuoeeul+i/lOWbnuWchueOr+WMheWbtOebkuefqemYtVxuICAgICAgICAgICAgICogQHBhcmFtIHttb2R1bGU6enJlbmRlci9zaGFwZS9SaW5nfklSaW5nU3R5bGV9IHN0eWxlXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHttb2R1bGU6enJlbmRlci9zaGFwZS9CYXNlfklCb3VuZGluZ1JlY3R9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGdldFJlY3QgOiBmdW5jdGlvbiAoc3R5bGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3R5bGUuX19yZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzdHlsZS5fX3JlY3Q7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHZhciBsaW5lV2lkdGg7XG4gICAgICAgICAgICAgICAgaWYgKHN0eWxlLmJydXNoVHlwZSA9PSAnc3Ryb2tlJyB8fCBzdHlsZS5icnVzaFR5cGUgPT0gJ2ZpbGwnKSB7XG4gICAgICAgICAgICAgICAgICAgIGxpbmVXaWR0aCA9IHN0eWxlLmxpbmVXaWR0aCB8fCAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbGluZVdpZHRoID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc3R5bGUuX19yZWN0ID0ge1xuICAgICAgICAgICAgICAgICAgICB4IDogTWF0aC5yb3VuZChzdHlsZS54IC0gc3R5bGUuciAtIGxpbmVXaWR0aCAvIDIpLFxuICAgICAgICAgICAgICAgICAgICB5IDogTWF0aC5yb3VuZChzdHlsZS55IC0gc3R5bGUuciAtIGxpbmVXaWR0aCAvIDIpLFxuICAgICAgICAgICAgICAgICAgICB3aWR0aCA6IHN0eWxlLnIgKiAyICsgbGluZVdpZHRoLFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQgOiBzdHlsZS5yICogMiArIGxpbmVXaWR0aFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0eWxlLl9fcmVjdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICByZXF1aXJlKCcuLi90b29sL3V0aWwnKS5pbmhlcml0cyhSaW5nLCBCYXNlKTtcbiAgICAgICAgcmV0dXJuIFJpbmc7XG4gICAgfVxuKTtcbiJdLCJmaWxlIjoicGx1Z2lucy96cmVuZGVyLTIuMS4wL3NyYy9zaGFwZS9SaW5nLmpzIn0=
