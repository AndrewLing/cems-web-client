/**
 * 水滴形状
 * @module zrender/shape/Droplet
 * @author Kener (@Kener-林峰, kener.linfeng@gmail.com)
 * @example
 *   var Droplet = require('zrender/shape/Droplet');
 *   var shape = new Droplet({
 *       style: {
 *           x: 100,
 *           y: 100,
 *           a: 40,
 *           b: 40,
 *           brushType: 'both',
 *           color: 'blue',
 *           strokeColor: 'red',
 *           lineWidth: 3,
 *           text: 'Droplet'
 *       }    
 *   });
 *   zr.addShape(shape);
 */

/**
 * @typedef {Object} IDropletStyle
 * @property {number} x 水滴中心x坐标
 * @property {number} y 水滴中心y坐标
 * @property {number} a 水滴横宽（中心到水平边缘最宽处距离）
 * @property {number} b 水滴纵高（中心到尖端距离）
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
         * @alias module:zrender/shape/Droplet
         * @constructor
         * @extends module:zrender/shape/Base
         * @param {Object} options
         */
        var Droplet = function(options) {
            Base.call(this, options);
            this._pathProxy = new PathProxy();
            /**
             * 水滴绘制样式
             * @name module:zrender/shape/Droplet#style
             * @type {module:zrender/shape/Droplet~IDropletStyle}
             */
            /**
             * 水滴高亮绘制样式
             * @name module:zrender/shape/Droplet#highlightStyle
             * @type {module:zrender/shape/Droplet~IDropletStyle}
             */
        };

        Droplet.prototype = {
            type: 'droplet',

            /**
             * 创建水滴路径
             * @param {CanvasRenderingContext2D} ctx
             * @param {module:zrender/shape/Droplet~IDropletStyle} style
             */
            buildPath : function(ctx, style) {
                var path = this._pathProxy || new PathProxy();
                path.begin(ctx);

                path.moveTo(style.x, style.y + style.a);
                path.bezierCurveTo(
                    style.x + style.a,
                    style.y + style.a,
                    style.x + style.a * 3 / 2,
                    style.y - style.a / 3,
                    style.x,
                    style.y - style.b
                );
                path.bezierCurveTo(
                    style.x - style.a * 3 / 2,
                    style.y - style.a / 3,
                    style.x - style.a,
                    style.y + style.a,
                    style.x,
                    style.y + style.a
                );
                path.closePath();
            },

            /**
             * 计算返回水滴的包围盒矩形
             * @param {module:zrender/shape/Droplet~IDropletStyle} style
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

        require('../tool/util').inherits(Droplet, Base);
        return Droplet;
    }
);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3NoYXBlL0Ryb3BsZXQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiDmsLTmu7TlvaLnirZcbiAqIEBtb2R1bGUgenJlbmRlci9zaGFwZS9Ecm9wbGV0XG4gKiBAYXV0aG9yIEtlbmVyIChAS2VuZXIt5p6X5bOwLCBrZW5lci5saW5mZW5nQGdtYWlsLmNvbSlcbiAqIEBleGFtcGxlXG4gKiAgIHZhciBEcm9wbGV0ID0gcmVxdWlyZSgnenJlbmRlci9zaGFwZS9Ecm9wbGV0Jyk7XG4gKiAgIHZhciBzaGFwZSA9IG5ldyBEcm9wbGV0KHtcbiAqICAgICAgIHN0eWxlOiB7XG4gKiAgICAgICAgICAgeDogMTAwLFxuICogICAgICAgICAgIHk6IDEwMCxcbiAqICAgICAgICAgICBhOiA0MCxcbiAqICAgICAgICAgICBiOiA0MCxcbiAqICAgICAgICAgICBicnVzaFR5cGU6ICdib3RoJyxcbiAqICAgICAgICAgICBjb2xvcjogJ2JsdWUnLFxuICogICAgICAgICAgIHN0cm9rZUNvbG9yOiAncmVkJyxcbiAqICAgICAgICAgICBsaW5lV2lkdGg6IDMsXG4gKiAgICAgICAgICAgdGV4dDogJ0Ryb3BsZXQnXG4gKiAgICAgICB9ICAgIFxuICogICB9KTtcbiAqICAgenIuYWRkU2hhcGUoc2hhcGUpO1xuICovXG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gSURyb3BsZXRTdHlsZVxuICogQHByb3BlcnR5IHtudW1iZXJ9IHgg5rC05ru05Lit5b+DeOWdkOagh1xuICogQHByb3BlcnR5IHtudW1iZXJ9IHkg5rC05ru05Lit5b+DeeWdkOagh1xuICogQHByb3BlcnR5IHtudW1iZXJ9IGEg5rC05ru05qiq5a6977yI5Lit5b+D5Yiw5rC05bmz6L6557yY5pyA5a695aSE6Led56a777yJXG4gKiBAcHJvcGVydHkge251bWJlcn0gYiDmsLTmu7TnurXpq5jvvIjkuK3lv4PliLDlsJbnq6/ot53nprvvvIlcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbYnJ1c2hUeXBlPSdmaWxsJ11cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbY29sb3I9JyMwMDAwMDAnXSDloavlhYXpopzoibJcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbc3Ryb2tlQ29sb3I9JyMwMDAwMDAnXSDmj4/ovrnpopzoibJcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbbGluZUNhcGU9J2J1dHQnXSDnur/luL3moLflvI/vvIzlj6/ku6XmmK8gYnV0dCwgcm91bmQsIHNxdWFyZVxuICogQHByb3BlcnR5IHtudW1iZXJ9IFtsaW5lV2lkdGg9MV0g5o+P6L655a695bqmXG4gKiBAcHJvcGVydHkge251bWJlcn0gW29wYWNpdHk9MV0g57uY5Yi26YCP5piO5bqmXG4gKiBAcHJvcGVydHkge251bWJlcn0gW3NoYWRvd0JsdXI9MF0g6Zi05b2x5qih57OK5bqm77yM5aSn5LqOMOacieaViFxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtzaGFkb3dDb2xvcj0nIzAwMDAwMCddIOmYtOW9seminOiJslxuICogQHByb3BlcnR5IHtudW1iZXJ9IFtzaGFkb3dPZmZzZXRYPTBdIOmYtOW9seaoquWQkeWBj+enu1xuICogQHByb3BlcnR5IHtudW1iZXJ9IFtzaGFkb3dPZmZzZXRZPTBdIOmYtOW9see6teWQkeWBj+enu1xuICogQHByb3BlcnR5IHtzdHJpbmd9IFt0ZXh0XSDlm77lvaLkuK3nmoTpmYTliqDmlofmnKxcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbdGV4dENvbG9yPScjMDAwMDAwJ10g5paH5pys6aKc6ImyXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRGb250XSDpmYTliqDmlofmnKzmoLflvI/vvIxlZzonYm9sZCAxOHB4IHZlcmRhbmEnXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRQb3NpdGlvbj0nZW5kJ10g6ZmE5Yqg5paH5pys5L2N572uLCDlj6/ku6XmmK8gaW5zaWRlLCBsZWZ0LCByaWdodCwgdG9wLCBib3R0b21cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbdGV4dEFsaWduXSDpu5jorqTmoLnmja50ZXh0UG9zaXRpb27oh6rliqjorr7nva7vvIzpmYTliqDmlofmnKzmsLTlubPlr7npvZDjgIJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDlj6/ku6XmmK9zdGFydCwgZW5kLCBsZWZ0LCByaWdodCwgY2VudGVyXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRCYXNlbGluZV0g6buY6K6k5qC55o2udGV4dFBvc2l0aW9u6Ieq5Yqo6K6+572u77yM6ZmE5Yqg5paH5pys5Z6C55u05a+56b2Q44CCXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg5Y+v5Lul5pivdG9wLCBib3R0b20sIG1pZGRsZSwgYWxwaGFiZXRpYywgaGFuZ2luZywgaWRlb2dyYXBoaWNcbiAqL1xuZGVmaW5lKFxuICAgIGZ1bmN0aW9uIChyZXF1aXJlKSB7XG4gICAgICAgICd1c2Ugc3RyaWN0JztcblxuICAgICAgICB2YXIgQmFzZSA9IHJlcXVpcmUoJy4vQmFzZScpO1xuICAgICAgICB2YXIgUGF0aFByb3h5ID0gcmVxdWlyZSgnLi91dGlsL1BhdGhQcm94eScpO1xuICAgICAgICB2YXIgYXJlYSA9IHJlcXVpcmUoJy4uL3Rvb2wvYXJlYScpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAYWxpYXMgbW9kdWxlOnpyZW5kZXIvc2hhcGUvRHJvcGxldFxuICAgICAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgICAgICogQGV4dGVuZHMgbW9kdWxlOnpyZW5kZXIvc2hhcGUvQmFzZVxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICAgICAgICAgKi9cbiAgICAgICAgdmFyIERyb3BsZXQgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgICAgICBCYXNlLmNhbGwodGhpcywgb3B0aW9ucyk7XG4gICAgICAgICAgICB0aGlzLl9wYXRoUHJveHkgPSBuZXcgUGF0aFByb3h5KCk7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOawtOa7tOe7mOWItuagt+W8j1xuICAgICAgICAgICAgICogQG5hbWUgbW9kdWxlOnpyZW5kZXIvc2hhcGUvRHJvcGxldCNzdHlsZVxuICAgICAgICAgICAgICogQHR5cGUge21vZHVsZTp6cmVuZGVyL3NoYXBlL0Ryb3BsZXR+SURyb3BsZXRTdHlsZX1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDmsLTmu7Tpq5jkuq7nu5jliLbmoLflvI9cbiAgICAgICAgICAgICAqIEBuYW1lIG1vZHVsZTp6cmVuZGVyL3NoYXBlL0Ryb3BsZXQjaGlnaGxpZ2h0U3R5bGVcbiAgICAgICAgICAgICAqIEB0eXBlIHttb2R1bGU6enJlbmRlci9zaGFwZS9Ecm9wbGV0fklEcm9wbGV0U3R5bGV9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgfTtcblxuICAgICAgICBEcm9wbGV0LnByb3RvdHlwZSA9IHtcbiAgICAgICAgICAgIHR5cGU6ICdkcm9wbGV0JyxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDliJvlu7rmsLTmu7Tot6/lvoRcbiAgICAgICAgICAgICAqIEBwYXJhbSB7Q2FudmFzUmVuZGVyaW5nQ29udGV4dDJEfSBjdHhcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bW9kdWxlOnpyZW5kZXIvc2hhcGUvRHJvcGxldH5JRHJvcGxldFN0eWxlfSBzdHlsZVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBidWlsZFBhdGggOiBmdW5jdGlvbihjdHgsIHN0eWxlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhdGggPSB0aGlzLl9wYXRoUHJveHkgfHwgbmV3IFBhdGhQcm94eSgpO1xuICAgICAgICAgICAgICAgIHBhdGguYmVnaW4oY3R4KTtcblxuICAgICAgICAgICAgICAgIHBhdGgubW92ZVRvKHN0eWxlLngsIHN0eWxlLnkgKyBzdHlsZS5hKTtcbiAgICAgICAgICAgICAgICBwYXRoLmJlemllckN1cnZlVG8oXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlLnggKyBzdHlsZS5hLFxuICAgICAgICAgICAgICAgICAgICBzdHlsZS55ICsgc3R5bGUuYSxcbiAgICAgICAgICAgICAgICAgICAgc3R5bGUueCArIHN0eWxlLmEgKiAzIC8gMixcbiAgICAgICAgICAgICAgICAgICAgc3R5bGUueSAtIHN0eWxlLmEgLyAzLFxuICAgICAgICAgICAgICAgICAgICBzdHlsZS54LFxuICAgICAgICAgICAgICAgICAgICBzdHlsZS55IC0gc3R5bGUuYlxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgcGF0aC5iZXppZXJDdXJ2ZVRvKFxuICAgICAgICAgICAgICAgICAgICBzdHlsZS54IC0gc3R5bGUuYSAqIDMgLyAyLFxuICAgICAgICAgICAgICAgICAgICBzdHlsZS55IC0gc3R5bGUuYSAvIDMsXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlLnggLSBzdHlsZS5hLFxuICAgICAgICAgICAgICAgICAgICBzdHlsZS55ICsgc3R5bGUuYSxcbiAgICAgICAgICAgICAgICAgICAgc3R5bGUueCxcbiAgICAgICAgICAgICAgICAgICAgc3R5bGUueSArIHN0eWxlLmFcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHBhdGguY2xvc2VQYXRoKCk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOiuoeeul+i/lOWbnuawtOa7tOeahOWMheWbtOebkuefqeW9olxuICAgICAgICAgICAgICogQHBhcmFtIHttb2R1bGU6enJlbmRlci9zaGFwZS9Ecm9wbGV0fklEcm9wbGV0U3R5bGV9IHN0eWxlXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHttb2R1bGU6enJlbmRlci9zaGFwZS9CYXNlfklCb3VuZGluZ1JlY3R9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGdldFJlY3QgOiBmdW5jdGlvbiAoc3R5bGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3R5bGUuX19yZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzdHlsZS5fX3JlY3Q7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5fcGF0aFByb3h5LmlzRW1wdHkoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmJ1aWxkUGF0aChudWxsLCBzdHlsZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9wYXRoUHJveHkuZmFzdEJvdW5kaW5nUmVjdCgpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgaXNDb3ZlcjogZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgICAgICAgICB2YXIgb3JpZ2luUG9zID0gdGhpcy50cmFuc2Zvcm1Db29yZFRvTG9jYWwoeCwgeSk7XG4gICAgICAgICAgICAgICAgeCA9IG9yaWdpblBvc1swXTtcbiAgICAgICAgICAgICAgICB5ID0gb3JpZ2luUG9zWzFdO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzQ292ZXJSZWN0KHgsIHkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhcmVhLmlzSW5zaWRlUGF0aChcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3BhdGhQcm94eS5wYXRoQ29tbWFuZHMsIHRoaXMuc3R5bGUubGluZVdpZHRoLCB0aGlzLnN0eWxlLmJydXNoVHlwZSwgeCwgeVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICByZXF1aXJlKCcuLi90b29sL3V0aWwnKS5pbmhlcml0cyhEcm9wbGV0LCBCYXNlKTtcbiAgICAgICAgcmV0dXJuIERyb3BsZXQ7XG4gICAgfVxuKTtcbiJdLCJmaWxlIjoicGx1Z2lucy96cmVuZGVyLTIuMS4wL3NyYy9zaGFwZS9Ecm9wbGV0LmpzIn0=
