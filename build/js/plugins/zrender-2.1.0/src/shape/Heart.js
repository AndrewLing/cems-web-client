/**
 * @module zrender/shape/Heart
 * @author Kener (@Kener-林峰, kener.linfeng@gmail.com)
 * @example
 *   var Heart = require('zrender/shape/Heart');
 *   var shape = new Heart({
 *       style: {
 *           x: 100,
 *           y: 100,
 *           a: 40,
 *           b: 40,
 *           brushType: 'both',
 *           color: 'blue',
 *           strokeColor: 'red',
 *           lineWidth: 3,
 *           text: 'Heart'
 *       }    
 *   });
 *   zr.addShape(shape);
 */

/**
 * @typedef {Object} IHeartStyle
 * @property {number} x 心形内部尖端横坐标
 * @property {number} y 心形内部尖端纵坐标
 * @property {number} a 心形横宽（中轴线到水平边缘最宽处距离）
 * @property {number} b 心形纵高（内尖到外尖距离）
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
        var PathProxy = require('./util/PathProxy');
        var area = require('../tool/area');
        
        /**
         * @alias module:zrender/shape/Heart
         * @constructor
         * @extends module:zrender/shape/Base
         * @param {Object} options
         */
        var Heart = function (options) {
            Base.call(this, options);

            this._pathProxy = new PathProxy();
            /**
             * 心形绘制样式
             * @name module:zrender/shape/Heart#style
             * @type {module:zrender/shape/Heart~IHeartStyle}
             */
            /**
             * 心形高亮绘制样式
             * @name module:zrender/shape/Heart#highlightStyle
             * @type {module:zrender/shape/Heart~IHeartStyle}
             */
        };

        Heart.prototype = {
            type: 'heart',

            /**
             * 创建扇形路径
             * @param {CanvasRenderingContext2D} ctx
             * @param {module:zrender/shape/Heart~IHeartStyle} style
             */
            buildPath : function (ctx, style) {
                var path = this._pathProxy || new PathProxy();
                path.begin(ctx);

                path.moveTo(style.x, style.y);
                path.bezierCurveTo(
                    style.x + style.a / 2,
                    style.y - style.b * 2 / 3,
                    style.x + style.a * 2,
                    style.y + style.b / 3,
                    style.x,
                    style.y + style.b
                );
                path.bezierCurveTo(
                    style.x - style.a *  2,
                    style.y + style.b / 3,
                    style.x - style.a / 2,
                    style.y - style.b * 2 / 3,
                    style.x,
                    style.y
                );
                path.closePath();
                return;
            },

            /**
             * 计算返回心形的包围盒矩形
             * @param {module:zrender/shape/Heart~IHeartStyle} style
             * @return {module:zrender/shape/Base~IBoundingRect}
             */
            getRect : function (style) {
                if (style.__rect) {
                    return style.__rect;
                }
                if (!this._pathProxy.isEmpty()) {
                    this.buildPath(null, style);
                }
                return this._pathProxy.fastBoundingRect();
            },

            isCover: function (x, y) {
                var originPos = this.transformCoordToLocal(x, y);
                x = originPos[0];
                y = originPos[1];
                
                if (this.isCoverRect(x, y)) {
                    return area.isInsidePath(
                        this._pathProxy.pathCommands, this.style.lineWidth, this.style.brushType, x, y
                    );
                }
            }
        };

        require('../tool/util').inherits(Heart, Base);
        return Heart;
    }
);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3NoYXBlL0hlYXJ0LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQG1vZHVsZSB6cmVuZGVyL3NoYXBlL0hlYXJ0XG4gKiBAYXV0aG9yIEtlbmVyIChAS2VuZXIt5p6X5bOwLCBrZW5lci5saW5mZW5nQGdtYWlsLmNvbSlcbiAqIEBleGFtcGxlXG4gKiAgIHZhciBIZWFydCA9IHJlcXVpcmUoJ3pyZW5kZXIvc2hhcGUvSGVhcnQnKTtcbiAqICAgdmFyIHNoYXBlID0gbmV3IEhlYXJ0KHtcbiAqICAgICAgIHN0eWxlOiB7XG4gKiAgICAgICAgICAgeDogMTAwLFxuICogICAgICAgICAgIHk6IDEwMCxcbiAqICAgICAgICAgICBhOiA0MCxcbiAqICAgICAgICAgICBiOiA0MCxcbiAqICAgICAgICAgICBicnVzaFR5cGU6ICdib3RoJyxcbiAqICAgICAgICAgICBjb2xvcjogJ2JsdWUnLFxuICogICAgICAgICAgIHN0cm9rZUNvbG9yOiAncmVkJyxcbiAqICAgICAgICAgICBsaW5lV2lkdGg6IDMsXG4gKiAgICAgICAgICAgdGV4dDogJ0hlYXJ0J1xuICogICAgICAgfSAgICBcbiAqICAgfSk7XG4gKiAgIHpyLmFkZFNoYXBlKHNoYXBlKTtcbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IElIZWFydFN0eWxlXG4gKiBAcHJvcGVydHkge251bWJlcn0geCDlv4PlvaLlhoXpg6jlsJbnq6/mqKrlnZDmoIdcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB5IOW/g+W9ouWGhemDqOWwluerr+e6teWdkOagh1xuICogQHByb3BlcnR5IHtudW1iZXJ9IGEg5b+D5b2i5qiq5a6977yI5Lit6L2057q/5Yiw5rC05bmz6L6557yY5pyA5a695aSE6Led56a777yJXG4gKiBAcHJvcGVydHkge251bWJlcn0gYiDlv4PlvaLnurXpq5jvvIjlhoXlsJbliLDlpJblsJbot53nprvvvIlcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbYnJ1c2hUeXBlPSdmaWxsJ11cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbY29sb3I9JyMwMDAwMDAnXSDloavlhYXpopzoibJcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbc3Ryb2tlQ29sb3I9JyMwMDAwMDAnXSDmj4/ovrnpopzoibJcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbbGluZUNhcGU9J2J1dHQnXSDnur/luL3moLflvI/vvIzlj6/ku6XmmK8gYnV0dCwgcm91bmQsIHNxdWFyZVxuICogQHByb3BlcnR5IHtudW1iZXJ9IFtsaW5lV2lkdGg9MV0g5o+P6L655a695bqmXG4gKiBAcHJvcGVydHkge251bWJlcn0gW29wYWNpdHk9MV0g57uY5Yi26YCP5piO5bqmXG4gKiBAcHJvcGVydHkge251bWJlcn0gW3NoYWRvd0JsdXI9MF0g6Zi05b2x5qih57OK5bqm77yM5aSn5LqOMOacieaViFxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtzaGFkb3dDb2xvcj0nIzAwMDAwMCddIOmYtOW9seminOiJslxuICogQHByb3BlcnR5IHtudW1iZXJ9IFtzaGFkb3dPZmZzZXRYPTBdIOmYtOW9seaoquWQkeWBj+enu1xuICogQHByb3BlcnR5IHtudW1iZXJ9IFtzaGFkb3dPZmZzZXRZPTBdIOmYtOW9see6teWQkeWBj+enu1xuICogQHByb3BlcnR5IHtzdHJpbmd9IFt0ZXh0XSDlm77lvaLkuK3nmoTpmYTliqDmlofmnKxcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbdGV4dENvbG9yPScjMDAwMDAwJ10g5paH5pys6aKc6ImyXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRGb250XSDpmYTliqDmlofmnKzmoLflvI/vvIxlZzonYm9sZCAxOHB4IHZlcmRhbmEnXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRQb3NpdGlvbj0nZW5kJ10g6ZmE5Yqg5paH5pys5L2N572uLCDlj6/ku6XmmK8gaW5zaWRlLCBsZWZ0LCByaWdodCwgdG9wLCBib3R0b21cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbdGV4dEFsaWduXSDpu5jorqTmoLnmja50ZXh0UG9zaXRpb27oh6rliqjorr7nva7vvIzpmYTliqDmlofmnKzmsLTlubPlr7npvZDjgIJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDlj6/ku6XmmK9zdGFydCwgZW5kLCBsZWZ0LCByaWdodCwgY2VudGVyXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRCYXNlbGluZV0g6buY6K6k5qC55o2udGV4dFBvc2l0aW9u6Ieq5Yqo6K6+572u77yM6ZmE5Yqg5paH5pys5Z6C55u05a+56b2Q44CCXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg5Y+v5Lul5pivdG9wLCBib3R0b20sIG1pZGRsZSwgYWxwaGFiZXRpYywgaGFuZ2luZywgaWRlb2dyYXBoaWNcbiAqL1xuZGVmaW5lKFxuICAgIGZ1bmN0aW9uIChyZXF1aXJlKSB7XG4gICAgICAgICd1c2Ugc3RyaWN0JztcbiAgICAgICAgXG4gICAgICAgIHZhciBCYXNlID0gcmVxdWlyZSgnLi9CYXNlJyk7XG4gICAgICAgIHZhciBQYXRoUHJveHkgPSByZXF1aXJlKCcuL3V0aWwvUGF0aFByb3h5Jyk7XG4gICAgICAgIHZhciBhcmVhID0gcmVxdWlyZSgnLi4vdG9vbC9hcmVhJyk7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgICogQGFsaWFzIG1vZHVsZTp6cmVuZGVyL3NoYXBlL0hlYXJ0XG4gICAgICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAgICAgKiBAZXh0ZW5kcyBtb2R1bGU6enJlbmRlci9zaGFwZS9CYXNlXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gICAgICAgICAqL1xuICAgICAgICB2YXIgSGVhcnQgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICAgICAgQmFzZS5jYWxsKHRoaXMsIG9wdGlvbnMpO1xuXG4gICAgICAgICAgICB0aGlzLl9wYXRoUHJveHkgPSBuZXcgUGF0aFByb3h5KCk7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOW/g+W9oue7mOWItuagt+W8j1xuICAgICAgICAgICAgICogQG5hbWUgbW9kdWxlOnpyZW5kZXIvc2hhcGUvSGVhcnQjc3R5bGVcbiAgICAgICAgICAgICAqIEB0eXBlIHttb2R1bGU6enJlbmRlci9zaGFwZS9IZWFydH5JSGVhcnRTdHlsZX1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDlv4PlvaLpq5jkuq7nu5jliLbmoLflvI9cbiAgICAgICAgICAgICAqIEBuYW1lIG1vZHVsZTp6cmVuZGVyL3NoYXBlL0hlYXJ0I2hpZ2hsaWdodFN0eWxlXG4gICAgICAgICAgICAgKiBAdHlwZSB7bW9kdWxlOnpyZW5kZXIvc2hhcGUvSGVhcnR+SUhlYXJ0U3R5bGV9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgfTtcblxuICAgICAgICBIZWFydC5wcm90b3R5cGUgPSB7XG4gICAgICAgICAgICB0eXBlOiAnaGVhcnQnLFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOWIm+W7uuaJh+W9oui3r+W+hFxuICAgICAgICAgICAgICogQHBhcmFtIHtDYW52YXNSZW5kZXJpbmdDb250ZXh0MkR9IGN0eFxuICAgICAgICAgICAgICogQHBhcmFtIHttb2R1bGU6enJlbmRlci9zaGFwZS9IZWFydH5JSGVhcnRTdHlsZX0gc3R5bGVcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgYnVpbGRQYXRoIDogZnVuY3Rpb24gKGN0eCwgc3R5bGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGF0aCA9IHRoaXMuX3BhdGhQcm94eSB8fCBuZXcgUGF0aFByb3h5KCk7XG4gICAgICAgICAgICAgICAgcGF0aC5iZWdpbihjdHgpO1xuXG4gICAgICAgICAgICAgICAgcGF0aC5tb3ZlVG8oc3R5bGUueCwgc3R5bGUueSk7XG4gICAgICAgICAgICAgICAgcGF0aC5iZXppZXJDdXJ2ZVRvKFxuICAgICAgICAgICAgICAgICAgICBzdHlsZS54ICsgc3R5bGUuYSAvIDIsXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlLnkgLSBzdHlsZS5iICogMiAvIDMsXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlLnggKyBzdHlsZS5hICogMixcbiAgICAgICAgICAgICAgICAgICAgc3R5bGUueSArIHN0eWxlLmIgLyAzLFxuICAgICAgICAgICAgICAgICAgICBzdHlsZS54LFxuICAgICAgICAgICAgICAgICAgICBzdHlsZS55ICsgc3R5bGUuYlxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgcGF0aC5iZXppZXJDdXJ2ZVRvKFxuICAgICAgICAgICAgICAgICAgICBzdHlsZS54IC0gc3R5bGUuYSAqICAyLFxuICAgICAgICAgICAgICAgICAgICBzdHlsZS55ICsgc3R5bGUuYiAvIDMsXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlLnggLSBzdHlsZS5hIC8gMixcbiAgICAgICAgICAgICAgICAgICAgc3R5bGUueSAtIHN0eWxlLmIgKiAyIC8gMyxcbiAgICAgICAgICAgICAgICAgICAgc3R5bGUueCxcbiAgICAgICAgICAgICAgICAgICAgc3R5bGUueVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgcGF0aC5jbG9zZVBhdGgoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOiuoeeul+i/lOWbnuW/g+W9oueahOWMheWbtOebkuefqeW9olxuICAgICAgICAgICAgICogQHBhcmFtIHttb2R1bGU6enJlbmRlci9zaGFwZS9IZWFydH5JSGVhcnRTdHlsZX0gc3R5bGVcbiAgICAgICAgICAgICAqIEByZXR1cm4ge21vZHVsZTp6cmVuZGVyL3NoYXBlL0Jhc2V+SUJvdW5kaW5nUmVjdH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZ2V0UmVjdCA6IGZ1bmN0aW9uIChzdHlsZSkge1xuICAgICAgICAgICAgICAgIGlmIChzdHlsZS5fX3JlY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN0eWxlLl9fcmVjdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9wYXRoUHJveHkuaXNFbXB0eSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYnVpbGRQYXRoKG51bGwsIHN0eWxlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3BhdGhQcm94eS5mYXN0Qm91bmRpbmdSZWN0KCk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBpc0NvdmVyOiBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICAgICAgICAgIHZhciBvcmlnaW5Qb3MgPSB0aGlzLnRyYW5zZm9ybUNvb3JkVG9Mb2NhbCh4LCB5KTtcbiAgICAgICAgICAgICAgICB4ID0gb3JpZ2luUG9zWzBdO1xuICAgICAgICAgICAgICAgIHkgPSBvcmlnaW5Qb3NbMV07XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaXNDb3ZlclJlY3QoeCwgeSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFyZWEuaXNJbnNpZGVQYXRoKFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcGF0aFByb3h5LnBhdGhDb21tYW5kcywgdGhpcy5zdHlsZS5saW5lV2lkdGgsIHRoaXMuc3R5bGUuYnJ1c2hUeXBlLCB4LCB5XG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHJlcXVpcmUoJy4uL3Rvb2wvdXRpbCcpLmluaGVyaXRzKEhlYXJ0LCBCYXNlKTtcbiAgICAgICAgcmV0dXJuIEhlYXJ0O1xuICAgIH1cbik7XG4iXSwiZmlsZSI6InBsdWdpbnMvenJlbmRlci0yLjEuMC9zcmMvc2hhcGUvSGVhcnQuanMifQ==
