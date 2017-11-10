/**
 * 直线
 * @module zrender/shape/Line
 * @author Kener (@Kener-林峰, kener.linfeng@gmail.com)
 * @example
 *   var Line = require('zrender/shape/Line');
 *   var shape = new Line({
 *       style: {
 *           xStart: 0,
 *           yStart: 0,
 *           xEnd: 100,
 *           yEnd: 100,
 *           strokeColor: '#000',
 *           lineWidth: 10
 *       }
 *   });
 *   zr.addShape(line);
 */
/**
 * @typedef {Object} ILineStyle
 * @property {number} xStart 起点x坐标
 * @property {number} yStart 起点y坐标
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
        var Base = require('./Base');
        var dashedLineTo = require('./util/dashedLineTo');
        
        /**
         * @alias module:zrender/shape/Line
         * @param {Object} options
         * @constructor
         * @extends module:zrender/shape/Base
         */
        var Line = function (options) {
            this.brushTypeOnly = 'stroke';  // 线条只能描边，填充后果自负
            this.textPosition = 'end';
            Base.call(this, options);

            /**
             * 直线绘制样式
             * @name module:zrender/shape/Line#style
             * @type {module:zrender/shape/Line~ILineStyle}
             */
            /**
             * 直线高亮绘制样式
             * @name module:zrender/shape/Line#highlightStyle
             * @type {module:zrender/shape/Line~ILineStyle}
             */
        };

        Line.prototype =  {
            type: 'line',

            /**
             * 创建线条路径
             * @param {CanvasRenderingContext2D} ctx
             * @param {module:zrender/shape/Line~ILineStyle} style
             */
            buildPath : function (ctx, style) {
                if (!style.lineType || style.lineType == 'solid') {
                    // 默认为实线
                    ctx.moveTo(style.xStart, style.yStart);
                    ctx.lineTo(style.xEnd, style.yEnd);
                }
                else if (style.lineType == 'dashed'
                        || style.lineType == 'dotted'
                ) {
                    var dashLength = (style.lineWidth || 1)  
                                     * (style.lineType == 'dashed' ? 5 : 1);
                    dashedLineTo(
                        ctx,
                        style.xStart, style.yStart,
                        style.xEnd, style.yEnd,
                        dashLength
                    );
                }
            },

            /**
             * 计算返回线条的包围盒矩形
             * @param {module:zrender/shape/Line~ILineStyle} style
             * @return {module:zrender/shape/Base~IBoundingRect}
             */
            getRect : function (style) {
                if (style.__rect) {
                    return style.__rect;
                }
                
                var lineWidth = style.lineWidth || 1;
                style.__rect = {
                    x : Math.min(style.xStart, style.xEnd) - lineWidth,
                    y : Math.min(style.yStart, style.yEnd) - lineWidth,
                    width : Math.abs(style.xStart - style.xEnd)
                            + lineWidth,
                    height : Math.abs(style.yStart - style.yEnd)
                             + lineWidth
                };
                
                return style.__rect;
            }
        };

        require('../tool/util').inherits(Line, Base);
        return Line;
    }
);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3NoYXBlL0xpbmUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiDnm7Tnur9cbiAqIEBtb2R1bGUgenJlbmRlci9zaGFwZS9MaW5lXG4gKiBAYXV0aG9yIEtlbmVyIChAS2VuZXIt5p6X5bOwLCBrZW5lci5saW5mZW5nQGdtYWlsLmNvbSlcbiAqIEBleGFtcGxlXG4gKiAgIHZhciBMaW5lID0gcmVxdWlyZSgnenJlbmRlci9zaGFwZS9MaW5lJyk7XG4gKiAgIHZhciBzaGFwZSA9IG5ldyBMaW5lKHtcbiAqICAgICAgIHN0eWxlOiB7XG4gKiAgICAgICAgICAgeFN0YXJ0OiAwLFxuICogICAgICAgICAgIHlTdGFydDogMCxcbiAqICAgICAgICAgICB4RW5kOiAxMDAsXG4gKiAgICAgICAgICAgeUVuZDogMTAwLFxuICogICAgICAgICAgIHN0cm9rZUNvbG9yOiAnIzAwMCcsXG4gKiAgICAgICAgICAgbGluZVdpZHRoOiAxMFxuICogICAgICAgfVxuICogICB9KTtcbiAqICAgenIuYWRkU2hhcGUobGluZSk7XG4gKi9cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gSUxpbmVTdHlsZVxuICogQHByb3BlcnR5IHtudW1iZXJ9IHhTdGFydCDotbfngrl45Z2Q5qCHXG4gKiBAcHJvcGVydHkge251bWJlcn0geVN0YXJ0IOi1t+eCuXnlnZDmoIdcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB4RW5kIOe7iOatoueCuXjlnZDmoIdcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB5RW5kIOe7iOatoueCuXnlnZDmoIdcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbc3Ryb2tlQ29sb3I9JyMwMDAwMDAnXSDmj4/ovrnpopzoibJcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbbGluZUNhcGU9J2J1dHQnXSDnur/luL3moLflvI/vvIzlj6/ku6XmmK8gYnV0dCwgcm91bmQsIHNxdWFyZVxuICogQHByb3BlcnR5IHtudW1iZXJ9IFtsaW5lV2lkdGg9MV0g5o+P6L655a695bqmXG4gKiBAcHJvcGVydHkge251bWJlcn0gW29wYWNpdHk9MV0g57uY5Yi26YCP5piO5bqmXG4gKiBAcHJvcGVydHkge251bWJlcn0gW3NoYWRvd0JsdXI9MF0g6Zi05b2x5qih57OK5bqm77yM5aSn5LqOMOacieaViFxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtzaGFkb3dDb2xvcj0nIzAwMDAwMCddIOmYtOW9seminOiJslxuICogQHByb3BlcnR5IHtudW1iZXJ9IFtzaGFkb3dPZmZzZXRYPTBdIOmYtOW9seaoquWQkeWBj+enu1xuICogQHByb3BlcnR5IHtudW1iZXJ9IFtzaGFkb3dPZmZzZXRZPTBdIOmYtOW9see6teWQkeWBj+enu1xuICogQHByb3BlcnR5IHtzdHJpbmd9IFt0ZXh0XSDlm77lvaLkuK3nmoTpmYTliqDmlofmnKxcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbdGV4dENvbG9yPScjMDAwMDAwJ10g5paH5pys6aKc6ImyXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRGb250XSDpmYTliqDmlofmnKzmoLflvI/vvIxlZzonYm9sZCAxOHB4IHZlcmRhbmEnXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRQb3NpdGlvbj0nZW5kJ10g6ZmE5Yqg5paH5pys5L2N572uLCDlj6/ku6XmmK8gaW5zaWRlLCBsZWZ0LCByaWdodCwgdG9wLCBib3R0b21cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbdGV4dEFsaWduXSDpu5jorqTmoLnmja50ZXh0UG9zaXRpb27oh6rliqjorr7nva7vvIzpmYTliqDmlofmnKzmsLTlubPlr7npvZDjgIJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDlj6/ku6XmmK9zdGFydCwgZW5kLCBsZWZ0LCByaWdodCwgY2VudGVyXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRCYXNlbGluZV0g6buY6K6k5qC55o2udGV4dFBvc2l0aW9u6Ieq5Yqo6K6+572u77yM6ZmE5Yqg5paH5pys5Z6C55u05a+56b2Q44CCXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg5Y+v5Lul5pivdG9wLCBib3R0b20sIG1pZGRsZSwgYWxwaGFiZXRpYywgaGFuZ2luZywgaWRlb2dyYXBoaWNcbiAqL1xuZGVmaW5lKFxuICAgIGZ1bmN0aW9uIChyZXF1aXJlKSB7XG4gICAgICAgIHZhciBCYXNlID0gcmVxdWlyZSgnLi9CYXNlJyk7XG4gICAgICAgIHZhciBkYXNoZWRMaW5lVG8gPSByZXF1aXJlKCcuL3V0aWwvZGFzaGVkTGluZVRvJyk7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgICogQGFsaWFzIG1vZHVsZTp6cmVuZGVyL3NoYXBlL0xpbmVcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAgICAgICAgICogQGNvbnN0cnVjdG9yXG4gICAgICAgICAqIEBleHRlbmRzIG1vZHVsZTp6cmVuZGVyL3NoYXBlL0Jhc2VcbiAgICAgICAgICovXG4gICAgICAgIHZhciBMaW5lID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHRoaXMuYnJ1c2hUeXBlT25seSA9ICdzdHJva2UnOyAgLy8g57q/5p2h5Y+q6IO95o+P6L6577yM5aGr5YWF5ZCO5p6c6Ieq6LSfXG4gICAgICAgICAgICB0aGlzLnRleHRQb3NpdGlvbiA9ICdlbmQnO1xuICAgICAgICAgICAgQmFzZS5jYWxsKHRoaXMsIG9wdGlvbnMpO1xuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOebtOe6v+e7mOWItuagt+W8j1xuICAgICAgICAgICAgICogQG5hbWUgbW9kdWxlOnpyZW5kZXIvc2hhcGUvTGluZSNzdHlsZVxuICAgICAgICAgICAgICogQHR5cGUge21vZHVsZTp6cmVuZGVyL3NoYXBlL0xpbmV+SUxpbmVTdHlsZX1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDnm7Tnur/pq5jkuq7nu5jliLbmoLflvI9cbiAgICAgICAgICAgICAqIEBuYW1lIG1vZHVsZTp6cmVuZGVyL3NoYXBlL0xpbmUjaGlnaGxpZ2h0U3R5bGVcbiAgICAgICAgICAgICAqIEB0eXBlIHttb2R1bGU6enJlbmRlci9zaGFwZS9MaW5lfklMaW5lU3R5bGV9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgfTtcblxuICAgICAgICBMaW5lLnByb3RvdHlwZSA9ICB7XG4gICAgICAgICAgICB0eXBlOiAnbGluZScsXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5Yib5bu657q/5p2h6Lev5b6EXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRH0gY3R4XG4gICAgICAgICAgICAgKiBAcGFyYW0ge21vZHVsZTp6cmVuZGVyL3NoYXBlL0xpbmV+SUxpbmVTdHlsZX0gc3R5bGVcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgYnVpbGRQYXRoIDogZnVuY3Rpb24gKGN0eCwgc3R5bGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXN0eWxlLmxpbmVUeXBlIHx8IHN0eWxlLmxpbmVUeXBlID09ICdzb2xpZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g6buY6K6k5Li65a6e57q/XG4gICAgICAgICAgICAgICAgICAgIGN0eC5tb3ZlVG8oc3R5bGUueFN0YXJ0LCBzdHlsZS55U3RhcnQpO1xuICAgICAgICAgICAgICAgICAgICBjdHgubGluZVRvKHN0eWxlLnhFbmQsIHN0eWxlLnlFbmQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChzdHlsZS5saW5lVHlwZSA9PSAnZGFzaGVkJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfHwgc3R5bGUubGluZVR5cGUgPT0gJ2RvdHRlZCdcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRhc2hMZW5ndGggPSAoc3R5bGUubGluZVdpZHRoIHx8IDEpICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIChzdHlsZS5saW5lVHlwZSA9PSAnZGFzaGVkJyA/IDUgOiAxKTtcbiAgICAgICAgICAgICAgICAgICAgZGFzaGVkTGluZVRvKFxuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LFxuICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGUueFN0YXJ0LCBzdHlsZS55U3RhcnQsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdHlsZS54RW5kLCBzdHlsZS55RW5kLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGFzaExlbmd0aFxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog6K6h566X6L+U5Zue57q/5p2h55qE5YyF5Zu055uS55+p5b2iXG4gICAgICAgICAgICAgKiBAcGFyYW0ge21vZHVsZTp6cmVuZGVyL3NoYXBlL0xpbmV+SUxpbmVTdHlsZX0gc3R5bGVcbiAgICAgICAgICAgICAqIEByZXR1cm4ge21vZHVsZTp6cmVuZGVyL3NoYXBlL0Jhc2V+SUJvdW5kaW5nUmVjdH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZ2V0UmVjdCA6IGZ1bmN0aW9uIChzdHlsZSkge1xuICAgICAgICAgICAgICAgIGlmIChzdHlsZS5fX3JlY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN0eWxlLl9fcmVjdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIGxpbmVXaWR0aCA9IHN0eWxlLmxpbmVXaWR0aCB8fCAxO1xuICAgICAgICAgICAgICAgIHN0eWxlLl9fcmVjdCA9IHtcbiAgICAgICAgICAgICAgICAgICAgeCA6IE1hdGgubWluKHN0eWxlLnhTdGFydCwgc3R5bGUueEVuZCkgLSBsaW5lV2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIHkgOiBNYXRoLm1pbihzdHlsZS55U3RhcnQsIHN0eWxlLnlFbmQpIC0gbGluZVdpZHRoLFxuICAgICAgICAgICAgICAgICAgICB3aWR0aCA6IE1hdGguYWJzKHN0eWxlLnhTdGFydCAtIHN0eWxlLnhFbmQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKyBsaW5lV2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodCA6IE1hdGguYWJzKHN0eWxlLnlTdGFydCAtIHN0eWxlLnlFbmQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgbGluZVdpZHRoXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gc3R5bGUuX19yZWN0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHJlcXVpcmUoJy4uL3Rvb2wvdXRpbCcpLmluaGVyaXRzKExpbmUsIEJhc2UpO1xuICAgICAgICByZXR1cm4gTGluZTtcbiAgICB9XG4pO1xuIl0sImZpbGUiOiJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3NoYXBlL0xpbmUuanMifQ==
