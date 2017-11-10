/**
 * 圆形
 * @module zrender/shape/Circle
 * @author Kener (@Kener-林峰, kener.linfeng@gmail.com)
 * @example
 *   var Circle = require('zrender/shape/Circle');
 *   var shape = new Circle({
 *       style: {
 *           x: 100,
 *           y: 100,
 *           r: 40,
 *           brushType: 'both',
 *           color: 'blue',
 *           strokeColor: 'red',
 *           lineWidth: 3,
 *           text: 'Circle'
 *       }    
 *   });
 *   zr.addShape(shape);
 */

/**
 * @typedef {Object} ICircleStyle
 * @property {number} x 圆心x坐标
 * @property {number} y 圆心y坐标
 * @property {number} r 半径
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
        'use strict';

        var Base = require('./Base');

        /**
         * @alias module:zrender/shape/Circle
         * @constructor
         * @extends module:zrender/shape/Base
         * @param {Object} options
         */
        var Circle = function(options) {
            Base.call(this, options);
            /**
             * 圆形绘制样式
             * @name module:zrender/shape/Circle#style
             * @type {module:zrender/shape/Circle~ICircleStyle}
             */
            /**
             * 圆形高亮绘制样式
             * @name module:zrender/shape/Circle#highlightStyle
             * @type {module:zrender/shape/Circle~ICircleStyle}
             */
        };

        Circle.prototype = {
            type: 'circle',
            /**
             * 创建圆形路径
             * @param {CanvasRenderingContext2D} ctx
             * @param {module:zrender/shape/Circle~ICircleStyle} style
             */
            buildPath : function (ctx, style) {
                // Better stroking in ShapeBundle
                ctx.moveTo(style.x + style.r, style.y);
                ctx.arc(style.x, style.y, style.r, 0, Math.PI * 2, true);
                return;
            },

            /**
             * 计算返回圆形的包围盒矩形
             * @param {module:zrender/shape/Circle~ICircleStyle} style
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

        require('../tool/util').inherits(Circle, Base);
        return Circle;
    }
);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3NoYXBlL0NpcmNsZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIOWchuW9olxuICogQG1vZHVsZSB6cmVuZGVyL3NoYXBlL0NpcmNsZVxuICogQGF1dGhvciBLZW5lciAoQEtlbmVyLeael+WzsCwga2VuZXIubGluZmVuZ0BnbWFpbC5jb20pXG4gKiBAZXhhbXBsZVxuICogICB2YXIgQ2lyY2xlID0gcmVxdWlyZSgnenJlbmRlci9zaGFwZS9DaXJjbGUnKTtcbiAqICAgdmFyIHNoYXBlID0gbmV3IENpcmNsZSh7XG4gKiAgICAgICBzdHlsZToge1xuICogICAgICAgICAgIHg6IDEwMCxcbiAqICAgICAgICAgICB5OiAxMDAsXG4gKiAgICAgICAgICAgcjogNDAsXG4gKiAgICAgICAgICAgYnJ1c2hUeXBlOiAnYm90aCcsXG4gKiAgICAgICAgICAgY29sb3I6ICdibHVlJyxcbiAqICAgICAgICAgICBzdHJva2VDb2xvcjogJ3JlZCcsXG4gKiAgICAgICAgICAgbGluZVdpZHRoOiAzLFxuICogICAgICAgICAgIHRleHQ6ICdDaXJjbGUnXG4gKiAgICAgICB9ICAgIFxuICogICB9KTtcbiAqICAgenIuYWRkU2hhcGUoc2hhcGUpO1xuICovXG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gSUNpcmNsZVN0eWxlXG4gKiBAcHJvcGVydHkge251bWJlcn0geCDlnIblv4N45Z2Q5qCHXG4gKiBAcHJvcGVydHkge251bWJlcn0geSDlnIblv4N55Z2Q5qCHXG4gKiBAcHJvcGVydHkge251bWJlcn0gciDljYrlvoRcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbYnJ1c2hUeXBlPSdmaWxsJ11cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbY29sb3I9JyMwMDAwMDAnXSDloavlhYXpopzoibJcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbc3Ryb2tlQ29sb3I9JyMwMDAwMDAnXSDmj4/ovrnpopzoibJcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbbGluZUNhcGU9J2J1dHQnXSDnur/luL3moLflvI/vvIzlj6/ku6XmmK8gYnV0dCwgcm91bmQsIHNxdWFyZVxuICogQHByb3BlcnR5IHtudW1iZXJ9IFtsaW5lV2lkdGg9MV0g5o+P6L655a695bqmXG4gKiBAcHJvcGVydHkge251bWJlcn0gW29wYWNpdHk9MV0g57uY5Yi26YCP5piO5bqmXG4gKiBAcHJvcGVydHkge251bWJlcn0gW3NoYWRvd0JsdXI9MF0g6Zi05b2x5qih57OK5bqm77yM5aSn5LqOMOacieaViFxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtzaGFkb3dDb2xvcj0nIzAwMDAwMCddIOmYtOW9seminOiJslxuICogQHByb3BlcnR5IHtudW1iZXJ9IFtzaGFkb3dPZmZzZXRYPTBdIOmYtOW9seaoquWQkeWBj+enu1xuICogQHByb3BlcnR5IHtudW1iZXJ9IFtzaGFkb3dPZmZzZXRZPTBdIOmYtOW9see6teWQkeWBj+enu1xuICogQHByb3BlcnR5IHtzdHJpbmd9IFt0ZXh0XSDlm77lvaLkuK3nmoTpmYTliqDmlofmnKxcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbdGV4dENvbG9yPScjMDAwMDAwJ10g5paH5pys6aKc6ImyXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRGb250XSDpmYTliqDmlofmnKzmoLflvI/vvIxlZzonYm9sZCAxOHB4IHZlcmRhbmEnXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRQb3NpdGlvbj0nZW5kJ10g6ZmE5Yqg5paH5pys5L2N572uLCDlj6/ku6XmmK8gaW5zaWRlLCBsZWZ0LCByaWdodCwgdG9wLCBib3R0b21cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbdGV4dEFsaWduXSDpu5jorqTmoLnmja50ZXh0UG9zaXRpb27oh6rliqjorr7nva7vvIzpmYTliqDmlofmnKzmsLTlubPlr7npvZDjgIJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDlj6/ku6XmmK9zdGFydCwgZW5kLCBsZWZ0LCByaWdodCwgY2VudGVyXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRCYXNlbGluZV0g6buY6K6k5qC55o2udGV4dFBvc2l0aW9u6Ieq5Yqo6K6+572u77yM6ZmE5Yqg5paH5pys5Z6C55u05a+56b2Q44CCXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg5Y+v5Lul5pivdG9wLCBib3R0b20sIG1pZGRsZSwgYWxwaGFiZXRpYywgaGFuZ2luZywgaWRlb2dyYXBoaWNcbiAqL1xuZGVmaW5lKFxuICAgIGZ1bmN0aW9uIChyZXF1aXJlKSB7XG4gICAgICAgICd1c2Ugc3RyaWN0JztcblxuICAgICAgICB2YXIgQmFzZSA9IHJlcXVpcmUoJy4vQmFzZScpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAYWxpYXMgbW9kdWxlOnpyZW5kZXIvc2hhcGUvQ2lyY2xlXG4gICAgICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAgICAgKiBAZXh0ZW5kcyBtb2R1bGU6enJlbmRlci9zaGFwZS9CYXNlXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gICAgICAgICAqL1xuICAgICAgICB2YXIgQ2lyY2xlID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICAgICAgQmFzZS5jYWxsKHRoaXMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDlnIblvaLnu5jliLbmoLflvI9cbiAgICAgICAgICAgICAqIEBuYW1lIG1vZHVsZTp6cmVuZGVyL3NoYXBlL0NpcmNsZSNzdHlsZVxuICAgICAgICAgICAgICogQHR5cGUge21vZHVsZTp6cmVuZGVyL3NoYXBlL0NpcmNsZX5JQ2lyY2xlU3R5bGV9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5ZyG5b2i6auY5Lqu57uY5Yi25qC35byPXG4gICAgICAgICAgICAgKiBAbmFtZSBtb2R1bGU6enJlbmRlci9zaGFwZS9DaXJjbGUjaGlnaGxpZ2h0U3R5bGVcbiAgICAgICAgICAgICAqIEB0eXBlIHttb2R1bGU6enJlbmRlci9zaGFwZS9DaXJjbGV+SUNpcmNsZVN0eWxlfVxuICAgICAgICAgICAgICovXG4gICAgICAgIH07XG5cbiAgICAgICAgQ2lyY2xlLnByb3RvdHlwZSA9IHtcbiAgICAgICAgICAgIHR5cGU6ICdjaXJjbGUnLFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDliJvlu7rlnIblvaLot6/lvoRcbiAgICAgICAgICAgICAqIEBwYXJhbSB7Q2FudmFzUmVuZGVyaW5nQ29udGV4dDJEfSBjdHhcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bW9kdWxlOnpyZW5kZXIvc2hhcGUvQ2lyY2xlfklDaXJjbGVTdHlsZX0gc3R5bGVcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgYnVpbGRQYXRoIDogZnVuY3Rpb24gKGN0eCwgc3R5bGUpIHtcbiAgICAgICAgICAgICAgICAvLyBCZXR0ZXIgc3Ryb2tpbmcgaW4gU2hhcGVCdW5kbGVcbiAgICAgICAgICAgICAgICBjdHgubW92ZVRvKHN0eWxlLnggKyBzdHlsZS5yLCBzdHlsZS55KTtcbiAgICAgICAgICAgICAgICBjdHguYXJjKHN0eWxlLngsIHN0eWxlLnksIHN0eWxlLnIsIDAsIE1hdGguUEkgKiAyLCB0cnVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOiuoeeul+i/lOWbnuWchuW9oueahOWMheWbtOebkuefqeW9olxuICAgICAgICAgICAgICogQHBhcmFtIHttb2R1bGU6enJlbmRlci9zaGFwZS9DaXJjbGV+SUNpcmNsZVN0eWxlfSBzdHlsZVxuICAgICAgICAgICAgICogQHJldHVybiB7bW9kdWxlOnpyZW5kZXIvc2hhcGUvQmFzZX5JQm91bmRpbmdSZWN0fVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBnZXRSZWN0IDogZnVuY3Rpb24gKHN0eWxlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0eWxlLl9fcmVjdCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3R5bGUuX19yZWN0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB2YXIgbGluZVdpZHRoO1xuICAgICAgICAgICAgICAgIGlmIChzdHlsZS5icnVzaFR5cGUgPT0gJ3N0cm9rZScgfHwgc3R5bGUuYnJ1c2hUeXBlID09ICdmaWxsJykge1xuICAgICAgICAgICAgICAgICAgICBsaW5lV2lkdGggPSBzdHlsZS5saW5lV2lkdGggfHwgMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGxpbmVXaWR0aCA9IDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHN0eWxlLl9fcmVjdCA9IHtcbiAgICAgICAgICAgICAgICAgICAgeCA6IE1hdGgucm91bmQoc3R5bGUueCAtIHN0eWxlLnIgLSBsaW5lV2lkdGggLyAyKSxcbiAgICAgICAgICAgICAgICAgICAgeSA6IE1hdGgucm91bmQoc3R5bGUueSAtIHN0eWxlLnIgLSBsaW5lV2lkdGggLyAyKSxcbiAgICAgICAgICAgICAgICAgICAgd2lkdGggOiBzdHlsZS5yICogMiArIGxpbmVXaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0IDogc3R5bGUuciAqIDIgKyBsaW5lV2lkdGhcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBzdHlsZS5fX3JlY3Q7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgcmVxdWlyZSgnLi4vdG9vbC91dGlsJykuaW5oZXJpdHMoQ2lyY2xlLCBCYXNlKTtcbiAgICAgICAgcmV0dXJuIENpcmNsZTtcbiAgICB9XG4pO1xuIl0sImZpbGUiOiJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3NoYXBlL0NpcmNsZS5qcyJ9
