/**
 * ShapeBundle 捆绑多个 shape 的 buildPath 方法，但是共用同一个样式
 * @author pissang (https://github.com/pissang)
 * @module zrender/shape/ShapeBundle
 * @example
 *     var poly1 = new PolygonShape();
 *     var poly2 = new PolygonShape();
 *     var poly3 = new PolygonShape();
 *     var shapeBundle = new ShapeBundle({
 *         style: {
 *             shapeList: [poly1, poly2, poly3],
 *             color: 'red'
 *         }
 *     });
 *     zr.addShape(shapeBundle);
 */

/**
 * @typedef {Object} IShapeBundleStyle
 * @property {string} shapeList shape列表
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
define(function (require) {

    var Base = require('./Base');

    var ShapeBundle = function (options) {
        Base.call(this, options);
        /**
         * ShapeBundle绘制样式
         * @name module:zrender/shape/ShapeBundle#style
         * @type {module:zrender/shape/ShapeBundle~IShapeBundleStyle}
         */
        /**
         * ShapeBundle高亮绘制样式
         * @name module:zrender/shape/ShapeBundle#highlightStyle
         * @type {module:zrender/shape/ShapeBundle~IShapeBundleStyle}
         */
    };

    ShapeBundle.prototype = {

        constructor: ShapeBundle,

        type: 'shape-bundle',

        brush: function (ctx, isHighlight) {
            var style = this.beforeBrush(ctx, isHighlight);

            ctx.beginPath();
            for (var i = 0; i < style.shapeList.length; i++) {
                var subShape = style.shapeList[i];
                var subShapeStyle = subShape.style;
                if (isHighlight) {
                    subShapeStyle = subShape.getHighlightStyle(
                        subShapeStyle,
                        subShape.highlightStyle || {},
                        subShape.brushTypeOnly
                    );
                }
                subShape.buildPath(ctx, subShapeStyle);
            }
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
        },

        /**
         * 计算返回多边形包围盒矩阵
         * @param {module:zrender/shape/Polygon~IShapeBundleStyle} style
         * @return {module:zrender/shape/Base~IBoundingRect}
         */
        getRect: function (style) {
            if (style.__rect) {
                return style.__rect;
            }
            var minX = Infinity;
            var maxX = -Infinity;
            var minY = Infinity;
            var maxY = -Infinity;
            for (var i = 0; i < style.shapeList.length; i++) {
                var subShape = style.shapeList[i];
                // TODO Highlight style ?
                var subRect = subShape.getRect(subShape.style);

                var minX = Math.min(subRect.x, minX);
                var minY = Math.min(subRect.y, minY);
                var maxX = Math.max(subRect.x + subRect.width, maxX);
                var maxY = Math.max(subRect.y + subRect.height, maxY);
            }

            style.__rect = {
                x: minX,
                y: minY,
                width: maxX - minX,
                height: maxY - minY
            };

            return style.__rect;
        },

        isCover: function (x, y) {
            var originPos = this.transformCoordToLocal(x, y);
            x = originPos[0];
            y = originPos[1];
            
            if (this.isCoverRect(x, y)) {
                for (var i = 0; i < this.style.shapeList.length; i++) {
                    var subShape = this.style.shapeList[i];
                    if (subShape.isCover(x, y)) {
                        return true;
                    }
                }
            }

            return false;
        }
    };

    require('../tool/util').inherits(ShapeBundle, Base);
    return ShapeBundle;
}); 
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3NoYXBlL1NoYXBlQnVuZGxlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogU2hhcGVCdW5kbGUg5o2G57uR5aSa5LiqIHNoYXBlIOeahCBidWlsZFBhdGgg5pa55rOV77yM5L2G5piv5YWx55So5ZCM5LiA5Liq5qC35byPXG4gKiBAYXV0aG9yIHBpc3NhbmcgKGh0dHBzOi8vZ2l0aHViLmNvbS9waXNzYW5nKVxuICogQG1vZHVsZSB6cmVuZGVyL3NoYXBlL1NoYXBlQnVuZGxlXG4gKiBAZXhhbXBsZVxuICogICAgIHZhciBwb2x5MSA9IG5ldyBQb2x5Z29uU2hhcGUoKTtcbiAqICAgICB2YXIgcG9seTIgPSBuZXcgUG9seWdvblNoYXBlKCk7XG4gKiAgICAgdmFyIHBvbHkzID0gbmV3IFBvbHlnb25TaGFwZSgpO1xuICogICAgIHZhciBzaGFwZUJ1bmRsZSA9IG5ldyBTaGFwZUJ1bmRsZSh7XG4gKiAgICAgICAgIHN0eWxlOiB7XG4gKiAgICAgICAgICAgICBzaGFwZUxpc3Q6IFtwb2x5MSwgcG9seTIsIHBvbHkzXSxcbiAqICAgICAgICAgICAgIGNvbG9yOiAncmVkJ1xuICogICAgICAgICB9XG4gKiAgICAgfSk7XG4gKiAgICAgenIuYWRkU2hhcGUoc2hhcGVCdW5kbGUpO1xuICovXG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gSVNoYXBlQnVuZGxlU3R5bGVcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBzaGFwZUxpc3Qgc2hhcGXliJfooahcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbYnJ1c2hUeXBlPSdmaWxsJ11cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbY29sb3I9JyMwMDAwMDAnXSDloavlhYXpopzoibJcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbc3Ryb2tlQ29sb3I9JyMwMDAwMDAnXSDmj4/ovrnpopzoibJcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbbGluZUNhcGU9J2J1dHQnXSDnur/luL3moLflvI/vvIzlj6/ku6XmmK8gYnV0dCwgcm91bmQsIHNxdWFyZVxuICogQHByb3BlcnR5IHtudW1iZXJ9IFtsaW5lV2lkdGg9MV0g5o+P6L655a695bqmXG4gKiBAcHJvcGVydHkge251bWJlcn0gW29wYWNpdHk9MV0g57uY5Yi26YCP5piO5bqmXG4gKiBAcHJvcGVydHkge251bWJlcn0gW3NoYWRvd0JsdXI9MF0g6Zi05b2x5qih57OK5bqm77yM5aSn5LqOMOacieaViFxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtzaGFkb3dDb2xvcj0nIzAwMDAwMCddIOmYtOW9seminOiJslxuICogQHByb3BlcnR5IHtudW1iZXJ9IFtzaGFkb3dPZmZzZXRYPTBdIOmYtOW9seaoquWQkeWBj+enu1xuICogQHByb3BlcnR5IHtudW1iZXJ9IFtzaGFkb3dPZmZzZXRZPTBdIOmYtOW9see6teWQkeWBj+enu1xuICogQHByb3BlcnR5IHtzdHJpbmd9IFt0ZXh0XSDlm77lvaLkuK3nmoTpmYTliqDmlofmnKxcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbdGV4dENvbG9yPScjMDAwMDAwJ10g5paH5pys6aKc6ImyXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRGb250XSDpmYTliqDmlofmnKzmoLflvI/vvIxlZzonYm9sZCAxOHB4IHZlcmRhbmEnXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRQb3NpdGlvbj0nZW5kJ10g6ZmE5Yqg5paH5pys5L2N572uLCDlj6/ku6XmmK8gaW5zaWRlLCBsZWZ0LCByaWdodCwgdG9wLCBib3R0b21cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbdGV4dEFsaWduXSDpu5jorqTmoLnmja50ZXh0UG9zaXRpb27oh6rliqjorr7nva7vvIzpmYTliqDmlofmnKzmsLTlubPlr7npvZDjgIJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDlj6/ku6XmmK9zdGFydCwgZW5kLCBsZWZ0LCByaWdodCwgY2VudGVyXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRCYXNlbGluZV0g6buY6K6k5qC55o2udGV4dFBvc2l0aW9u6Ieq5Yqo6K6+572u77yM6ZmE5Yqg5paH5pys5Z6C55u05a+56b2Q44CCXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg5Y+v5Lul5pivdG9wLCBib3R0b20sIG1pZGRsZSwgYWxwaGFiZXRpYywgaGFuZ2luZywgaWRlb2dyYXBoaWNcbiAqL1xuZGVmaW5lKGZ1bmN0aW9uIChyZXF1aXJlKSB7XG5cbiAgICB2YXIgQmFzZSA9IHJlcXVpcmUoJy4vQmFzZScpO1xuXG4gICAgdmFyIFNoYXBlQnVuZGxlID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgQmFzZS5jYWxsKHRoaXMsIG9wdGlvbnMpO1xuICAgICAgICAvKipcbiAgICAgICAgICogU2hhcGVCdW5kbGXnu5jliLbmoLflvI9cbiAgICAgICAgICogQG5hbWUgbW9kdWxlOnpyZW5kZXIvc2hhcGUvU2hhcGVCdW5kbGUjc3R5bGVcbiAgICAgICAgICogQHR5cGUge21vZHVsZTp6cmVuZGVyL3NoYXBlL1NoYXBlQnVuZGxlfklTaGFwZUJ1bmRsZVN0eWxlfVxuICAgICAgICAgKi9cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNoYXBlQnVuZGxl6auY5Lqu57uY5Yi25qC35byPXG4gICAgICAgICAqIEBuYW1lIG1vZHVsZTp6cmVuZGVyL3NoYXBlL1NoYXBlQnVuZGxlI2hpZ2hsaWdodFN0eWxlXG4gICAgICAgICAqIEB0eXBlIHttb2R1bGU6enJlbmRlci9zaGFwZS9TaGFwZUJ1bmRsZX5JU2hhcGVCdW5kbGVTdHlsZX1cbiAgICAgICAgICovXG4gICAgfTtcblxuICAgIFNoYXBlQnVuZGxlLnByb3RvdHlwZSA9IHtcblxuICAgICAgICBjb25zdHJ1Y3RvcjogU2hhcGVCdW5kbGUsXG5cbiAgICAgICAgdHlwZTogJ3NoYXBlLWJ1bmRsZScsXG5cbiAgICAgICAgYnJ1c2g6IGZ1bmN0aW9uIChjdHgsIGlzSGlnaGxpZ2h0KSB7XG4gICAgICAgICAgICB2YXIgc3R5bGUgPSB0aGlzLmJlZm9yZUJydXNoKGN0eCwgaXNIaWdobGlnaHQpO1xuXG4gICAgICAgICAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0eWxlLnNoYXBlTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBzdWJTaGFwZSA9IHN0eWxlLnNoYXBlTGlzdFtpXTtcbiAgICAgICAgICAgICAgICB2YXIgc3ViU2hhcGVTdHlsZSA9IHN1YlNoYXBlLnN0eWxlO1xuICAgICAgICAgICAgICAgIGlmIChpc0hpZ2hsaWdodCkge1xuICAgICAgICAgICAgICAgICAgICBzdWJTaGFwZVN0eWxlID0gc3ViU2hhcGUuZ2V0SGlnaGxpZ2h0U3R5bGUoXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJTaGFwZVN0eWxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3ViU2hhcGUuaGlnaGxpZ2h0U3R5bGUgfHwge30sXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJTaGFwZS5icnVzaFR5cGVPbmx5XG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHN1YlNoYXBlLmJ1aWxkUGF0aChjdHgsIHN1YlNoYXBlU3R5bGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3dpdGNoIChzdHlsZS5icnVzaFR5cGUpIHtcbiAgICAgICAgICAgICAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXG4gICAgICAgICAgICAgICAgY2FzZSAnYm90aCc6XG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsKCk7XG4gICAgICAgICAgICAgICAgY2FzZSAnc3Ryb2tlJzpcbiAgICAgICAgICAgICAgICAgICAgc3R5bGUubGluZVdpZHRoID4gMCAmJiBjdHguc3Ryb2tlKCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGwoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5kcmF3VGV4dChjdHgsIHN0eWxlLCB0aGlzLnN0eWxlKTtcblxuICAgICAgICAgICAgdGhpcy5hZnRlckJydXNoKGN0eCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOiuoeeul+i/lOWbnuWkmui+ueW9ouWMheWbtOebkuefqemYtVxuICAgICAgICAgKiBAcGFyYW0ge21vZHVsZTp6cmVuZGVyL3NoYXBlL1BvbHlnb25+SVNoYXBlQnVuZGxlU3R5bGV9IHN0eWxlXG4gICAgICAgICAqIEByZXR1cm4ge21vZHVsZTp6cmVuZGVyL3NoYXBlL0Jhc2V+SUJvdW5kaW5nUmVjdH1cbiAgICAgICAgICovXG4gICAgICAgIGdldFJlY3Q6IGZ1bmN0aW9uIChzdHlsZSkge1xuICAgICAgICAgICAgaWYgKHN0eWxlLl9fcmVjdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzdHlsZS5fX3JlY3Q7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgbWluWCA9IEluZmluaXR5O1xuICAgICAgICAgICAgdmFyIG1heFggPSAtSW5maW5pdHk7XG4gICAgICAgICAgICB2YXIgbWluWSA9IEluZmluaXR5O1xuICAgICAgICAgICAgdmFyIG1heFkgPSAtSW5maW5pdHk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0eWxlLnNoYXBlTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBzdWJTaGFwZSA9IHN0eWxlLnNoYXBlTGlzdFtpXTtcbiAgICAgICAgICAgICAgICAvLyBUT0RPIEhpZ2hsaWdodCBzdHlsZSA/XG4gICAgICAgICAgICAgICAgdmFyIHN1YlJlY3QgPSBzdWJTaGFwZS5nZXRSZWN0KHN1YlNoYXBlLnN0eWxlKTtcblxuICAgICAgICAgICAgICAgIHZhciBtaW5YID0gTWF0aC5taW4oc3ViUmVjdC54LCBtaW5YKTtcbiAgICAgICAgICAgICAgICB2YXIgbWluWSA9IE1hdGgubWluKHN1YlJlY3QueSwgbWluWSk7XG4gICAgICAgICAgICAgICAgdmFyIG1heFggPSBNYXRoLm1heChzdWJSZWN0LnggKyBzdWJSZWN0LndpZHRoLCBtYXhYKTtcbiAgICAgICAgICAgICAgICB2YXIgbWF4WSA9IE1hdGgubWF4KHN1YlJlY3QueSArIHN1YlJlY3QuaGVpZ2h0LCBtYXhZKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc3R5bGUuX19yZWN0ID0ge1xuICAgICAgICAgICAgICAgIHg6IG1pblgsXG4gICAgICAgICAgICAgICAgeTogbWluWSxcbiAgICAgICAgICAgICAgICB3aWR0aDogbWF4WCAtIG1pblgsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBtYXhZIC0gbWluWVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgcmV0dXJuIHN0eWxlLl9fcmVjdDtcbiAgICAgICAgfSxcblxuICAgICAgICBpc0NvdmVyOiBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICAgICAgdmFyIG9yaWdpblBvcyA9IHRoaXMudHJhbnNmb3JtQ29vcmRUb0xvY2FsKHgsIHkpO1xuICAgICAgICAgICAgeCA9IG9yaWdpblBvc1swXTtcbiAgICAgICAgICAgIHkgPSBvcmlnaW5Qb3NbMV07XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmICh0aGlzLmlzQ292ZXJSZWN0KHgsIHkpKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnN0eWxlLnNoYXBlTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgc3ViU2hhcGUgPSB0aGlzLnN0eWxlLnNoYXBlTGlzdFtpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN1YlNoYXBlLmlzQ292ZXIoeCwgeSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgcmVxdWlyZSgnLi4vdG9vbC91dGlsJykuaW5oZXJpdHMoU2hhcGVCdW5kbGUsIEJhc2UpO1xuICAgIHJldHVybiBTaGFwZUJ1bmRsZTtcbn0pOyAiXSwiZmlsZSI6InBsdWdpbnMvenJlbmRlci0yLjEuMC9zcmMvc2hhcGUvU2hhcGVCdW5kbGUuanMifQ==
