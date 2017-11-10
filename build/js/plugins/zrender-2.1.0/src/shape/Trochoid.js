/**
 * 内外旋轮曲线
 * @module zrender/shape/Trochold
 * @author Neil (杨骥, 511415343@qq.com)
 * @example
 *     var Trochold = require('zrender/shape/Trochold');
 *     var shape = new Trochold({
 *         style: {
 *             x: 100,
 *             y: 100,
 *             r: 50,
 *             r0: 30,
 *             d: 50,
 *             strokeColor: '#eee',
 *             text: 'trochold'
 *         }
 *     });
 *     zr.addShape(shape);
 */

/**
 * @typedef {Object} ITrocholdStyle
 * @property {number} x 中心x坐标
 * @property {number} y 中心y坐标
 * @property {number} r 固定圆半径 内旋曲线时必须大于转动圆半径
 * @property {number} r0 转动圆半径
 * @property {number} d 点到内部转动圆的距离，等于r时曲线为摆线
 * @property {string} [location='in'] 内旋 out 外旋
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
         * @alias module:zrender/shape/Trochold
         * @param {Object} options
         * @constructor
         * @extends zrender/shape/Base
         */
        var Trochoid = function (options) {
            this.brushTypeOnly = 'stroke';  // 线条只能描边，填充后果自负
            Base.call(this, options);
            /**
             * 内外旋轮曲线绘制样式
             * @name module:zrender/shape/Trochold#style
             * @type {module:zrender/shape/Trochold~ITrocholdStyle}
             */
            /**
             * 内外旋轮曲线高亮绘制样式
             * @name module:zrender/shape/Trochold#highlightStyle
             * @type {module:zrender/shape/Trochold~ITrocholdStyle}
             */
        };

        Trochoid.prototype =  {
            type: 'trochoid',

            /**
             * 创建内外旋轮曲线路径
             * @param {CanvasRenderingContext2D} ctx
             * @param {module:zrender/shape/Trochold~ITrocholdStyle} style
             */
            buildPath : function (ctx, style) {
                var _x1;
                var _y1;
                var _x2;
                var _y2;
                var _R = style.r;
                var _r = style.r0;
                var _d = style.d;
                var _offsetX = style.x;
                var _offsetY = style.y;
                var _delta = style.location == 'out' ? 1 : -1;

                var _math = require('../tool/math');

                if (style.location && _R <= _r) {
                    alert('参数错误');
                    return;
                }

                var _num = 0;
                var i = 1;
                var _theta;

                _x1 = (_R + _delta * _r) * _math.cos(0)
                    - _delta * _d * _math.cos(0) + _offsetX;
                _y1 = (_R + _delta * _r) * _math.sin(0)
                    - _d * _math.sin(0) + _offsetY;

                ctx.moveTo(_x1, _y1);

                // 计算结束时的i
                do {
                    _num++;
                }
                while ((_r * _num) % (_R + _delta * _r) !== 0);

                do {
                    _theta = Math.PI / 180 * i;
                    _x2 = (_R + _delta * _r) * _math.cos(_theta)
                         - _delta * _d * _math.cos((_R / _r +  _delta) * _theta)
                         + _offsetX;
                    _y2 = (_R + _delta * _r) * _math.sin(_theta)
                         - _d * _math.sin((_R / _r + _delta) * _theta)
                         + _offsetY;
                    ctx.lineTo(_x2, _y2);
                    i++;
                }
                while (i <= (_r * _num) / (_R + _delta * _r) * 360);


            },

            /**
             * 返回内外旋轮曲线包围盒矩形
             * @param {module:zrender/shape/Trochold~ITrocholdStyle} style
             * @return {module:zrender/shape/Base~IBoundingRect}
             */
            getRect : function (style) {
                if (style.__rect) {
                    return style.__rect;
                }
                
                var _R = style.r;
                var _r = style.r0;
                var _d = style.d;
                var _delta = style.location == 'out' ? 1 : -1;
                var _s = _R + _d + _delta * _r;
                var _offsetX = style.x;
                var _offsetY = style.y;

                var lineWidth;
                if (style.brushType == 'stroke' || style.brushType == 'fill') {
                    lineWidth = style.lineWidth || 1;
                }
                else {
                    lineWidth = 0;
                }
                style.__rect = {
                    x : -_s - lineWidth + _offsetX,
                    y : -_s - lineWidth + _offsetY,
                    width : 2 * _s + 2 * lineWidth,
                    height : 2 * _s + 2 * lineWidth
                };
                return style.__rect;
            }
        };

        require('../tool/util').inherits(Trochoid, Base);
        return Trochoid;
    }
);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3NoYXBlL1Ryb2Nob2lkLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICog5YaF5aSW5peL6L2u5puy57q/XG4gKiBAbW9kdWxlIHpyZW5kZXIvc2hhcGUvVHJvY2hvbGRcbiAqIEBhdXRob3IgTmVpbCAo5p2o6aqlLCA1MTE0MTUzNDNAcXEuY29tKVxuICogQGV4YW1wbGVcbiAqICAgICB2YXIgVHJvY2hvbGQgPSByZXF1aXJlKCd6cmVuZGVyL3NoYXBlL1Ryb2Nob2xkJyk7XG4gKiAgICAgdmFyIHNoYXBlID0gbmV3IFRyb2Nob2xkKHtcbiAqICAgICAgICAgc3R5bGU6IHtcbiAqICAgICAgICAgICAgIHg6IDEwMCxcbiAqICAgICAgICAgICAgIHk6IDEwMCxcbiAqICAgICAgICAgICAgIHI6IDUwLFxuICogICAgICAgICAgICAgcjA6IDMwLFxuICogICAgICAgICAgICAgZDogNTAsXG4gKiAgICAgICAgICAgICBzdHJva2VDb2xvcjogJyNlZWUnLFxuICogICAgICAgICAgICAgdGV4dDogJ3Ryb2Nob2xkJ1xuICogICAgICAgICB9XG4gKiAgICAgfSk7XG4gKiAgICAgenIuYWRkU2hhcGUoc2hhcGUpO1xuICovXG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gSVRyb2Nob2xkU3R5bGVcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB4IOS4reW/g3jlnZDmoIdcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB5IOS4reW/g3nlnZDmoIdcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSByIOWbuuWumuWchuWNiuW+hCDlhoXml4vmm7Lnur/ml7blv4XpobvlpKfkuo7ovazliqjlnIbljYrlvoRcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSByMCDovazliqjlnIbljYrlvoRcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBkIOeCueWIsOWGhemDqOi9rOWKqOWchueahOi3neemu++8jOetieS6jnLml7bmm7Lnur/kuLrmkYbnur9cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbbG9jYXRpb249J2luJ10g5YaF5peLIG91dCDlpJbml4tcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbc3Ryb2tlQ29sb3I9JyMwMDAwMDAnXSDmj4/ovrnpopzoibJcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbbGluZUNhcGU9J2J1dHQnXSDnur/luL3moLflvI/vvIzlj6/ku6XmmK8gYnV0dCwgcm91bmQsIHNxdWFyZVxuICogQHByb3BlcnR5IHtudW1iZXJ9IFtsaW5lV2lkdGg9MV0g5o+P6L655a695bqmXG4gKiBAcHJvcGVydHkge251bWJlcn0gW29wYWNpdHk9MV0g57uY5Yi26YCP5piO5bqmXG4gKiBAcHJvcGVydHkge251bWJlcn0gW3NoYWRvd0JsdXI9MF0g6Zi05b2x5qih57OK5bqm77yM5aSn5LqOMOacieaViFxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtzaGFkb3dDb2xvcj0nIzAwMDAwMCddIOmYtOW9seminOiJslxuICogQHByb3BlcnR5IHtudW1iZXJ9IFtzaGFkb3dPZmZzZXRYPTBdIOmYtOW9seaoquWQkeWBj+enu1xuICogQHByb3BlcnR5IHtudW1iZXJ9IFtzaGFkb3dPZmZzZXRZPTBdIOmYtOW9see6teWQkeWBj+enu1xuICogQHByb3BlcnR5IHtzdHJpbmd9IFt0ZXh0XSDlm77lvaLkuK3nmoTpmYTliqDmlofmnKxcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbdGV4dENvbG9yPScjMDAwMDAwJ10g5paH5pys6aKc6ImyXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRGb250XSDpmYTliqDmlofmnKzmoLflvI/vvIxlZzonYm9sZCAxOHB4IHZlcmRhbmEnXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRQb3NpdGlvbj0nZW5kJ10g6ZmE5Yqg5paH5pys5L2N572uLCDlj6/ku6XmmK8gaW5zaWRlLCBsZWZ0LCByaWdodCwgdG9wLCBib3R0b21cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbdGV4dEFsaWduXSDpu5jorqTmoLnmja50ZXh0UG9zaXRpb27oh6rliqjorr7nva7vvIzpmYTliqDmlofmnKzmsLTlubPlr7npvZDjgIJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDlj6/ku6XmmK9zdGFydCwgZW5kLCBsZWZ0LCByaWdodCwgY2VudGVyXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRCYXNlbGluZV0g6buY6K6k5qC55o2udGV4dFBvc2l0aW9u6Ieq5Yqo6K6+572u77yM6ZmE5Yqg5paH5pys5Z6C55u05a+56b2Q44CCXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg5Y+v5Lul5pivdG9wLCBib3R0b20sIG1pZGRsZSwgYWxwaGFiZXRpYywgaGFuZ2luZywgaWRlb2dyYXBoaWNcbiAqL1xuZGVmaW5lKFxuICAgIGZ1bmN0aW9uIChyZXF1aXJlKSB7XG4gICAgICAgIHZhciBCYXNlID0gcmVxdWlyZSgnLi9CYXNlJyk7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgICogQGFsaWFzIG1vZHVsZTp6cmVuZGVyL3NoYXBlL1Ryb2Nob2xkXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gICAgICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAgICAgKiBAZXh0ZW5kcyB6cmVuZGVyL3NoYXBlL0Jhc2VcbiAgICAgICAgICovXG4gICAgICAgIHZhciBUcm9jaG9pZCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgICAgICB0aGlzLmJydXNoVHlwZU9ubHkgPSAnc3Ryb2tlJzsgIC8vIOe6v+adoeWPquiDveaPj+i+ue+8jOWhq+WFheWQjuaenOiHqui0n1xuICAgICAgICAgICAgQmFzZS5jYWxsKHRoaXMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDlhoXlpJbml4vova7mm7Lnur/nu5jliLbmoLflvI9cbiAgICAgICAgICAgICAqIEBuYW1lIG1vZHVsZTp6cmVuZGVyL3NoYXBlL1Ryb2Nob2xkI3N0eWxlXG4gICAgICAgICAgICAgKiBAdHlwZSB7bW9kdWxlOnpyZW5kZXIvc2hhcGUvVHJvY2hvbGR+SVRyb2Nob2xkU3R5bGV9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5YaF5aSW5peL6L2u5puy57q/6auY5Lqu57uY5Yi25qC35byPXG4gICAgICAgICAgICAgKiBAbmFtZSBtb2R1bGU6enJlbmRlci9zaGFwZS9Ucm9jaG9sZCNoaWdobGlnaHRTdHlsZVxuICAgICAgICAgICAgICogQHR5cGUge21vZHVsZTp6cmVuZGVyL3NoYXBlL1Ryb2Nob2xkfklUcm9jaG9sZFN0eWxlfVxuICAgICAgICAgICAgICovXG4gICAgICAgIH07XG5cbiAgICAgICAgVHJvY2hvaWQucHJvdG90eXBlID0gIHtcbiAgICAgICAgICAgIHR5cGU6ICd0cm9jaG9pZCcsXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5Yib5bu65YaF5aSW5peL6L2u5puy57q/6Lev5b6EXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRH0gY3R4XG4gICAgICAgICAgICAgKiBAcGFyYW0ge21vZHVsZTp6cmVuZGVyL3NoYXBlL1Ryb2Nob2xkfklUcm9jaG9sZFN0eWxlfSBzdHlsZVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBidWlsZFBhdGggOiBmdW5jdGlvbiAoY3R4LCBzdHlsZSkge1xuICAgICAgICAgICAgICAgIHZhciBfeDE7XG4gICAgICAgICAgICAgICAgdmFyIF95MTtcbiAgICAgICAgICAgICAgICB2YXIgX3gyO1xuICAgICAgICAgICAgICAgIHZhciBfeTI7XG4gICAgICAgICAgICAgICAgdmFyIF9SID0gc3R5bGUucjtcbiAgICAgICAgICAgICAgICB2YXIgX3IgPSBzdHlsZS5yMDtcbiAgICAgICAgICAgICAgICB2YXIgX2QgPSBzdHlsZS5kO1xuICAgICAgICAgICAgICAgIHZhciBfb2Zmc2V0WCA9IHN0eWxlLng7XG4gICAgICAgICAgICAgICAgdmFyIF9vZmZzZXRZID0gc3R5bGUueTtcbiAgICAgICAgICAgICAgICB2YXIgX2RlbHRhID0gc3R5bGUubG9jYXRpb24gPT0gJ291dCcgPyAxIDogLTE7XG5cbiAgICAgICAgICAgICAgICB2YXIgX21hdGggPSByZXF1aXJlKCcuLi90b29sL21hdGgnKTtcblxuICAgICAgICAgICAgICAgIGlmIChzdHlsZS5sb2NhdGlvbiAmJiBfUiA8PSBfcikge1xuICAgICAgICAgICAgICAgICAgICBhbGVydCgn5Y+C5pWw6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgX251bSA9IDA7XG4gICAgICAgICAgICAgICAgdmFyIGkgPSAxO1xuICAgICAgICAgICAgICAgIHZhciBfdGhldGE7XG5cbiAgICAgICAgICAgICAgICBfeDEgPSAoX1IgKyBfZGVsdGEgKiBfcikgKiBfbWF0aC5jb3MoMClcbiAgICAgICAgICAgICAgICAgICAgLSBfZGVsdGEgKiBfZCAqIF9tYXRoLmNvcygwKSArIF9vZmZzZXRYO1xuICAgICAgICAgICAgICAgIF95MSA9IChfUiArIF9kZWx0YSAqIF9yKSAqIF9tYXRoLnNpbigwKVxuICAgICAgICAgICAgICAgICAgICAtIF9kICogX21hdGguc2luKDApICsgX29mZnNldFk7XG5cbiAgICAgICAgICAgICAgICBjdHgubW92ZVRvKF94MSwgX3kxKTtcblxuICAgICAgICAgICAgICAgIC8vIOiuoeeul+e7k+adn+aXtueahGlcbiAgICAgICAgICAgICAgICBkbyB7XG4gICAgICAgICAgICAgICAgICAgIF9udW0rKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgd2hpbGUgKChfciAqIF9udW0pICUgKF9SICsgX2RlbHRhICogX3IpICE9PSAwKTtcblxuICAgICAgICAgICAgICAgIGRvIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoZXRhID0gTWF0aC5QSSAvIDE4MCAqIGk7XG4gICAgICAgICAgICAgICAgICAgIF94MiA9IChfUiArIF9kZWx0YSAqIF9yKSAqIF9tYXRoLmNvcyhfdGhldGEpXG4gICAgICAgICAgICAgICAgICAgICAgICAgLSBfZGVsdGEgKiBfZCAqIF9tYXRoLmNvcygoX1IgLyBfciArICBfZGVsdGEpICogX3RoZXRhKVxuICAgICAgICAgICAgICAgICAgICAgICAgICsgX29mZnNldFg7XG4gICAgICAgICAgICAgICAgICAgIF95MiA9IChfUiArIF9kZWx0YSAqIF9yKSAqIF9tYXRoLnNpbihfdGhldGEpXG4gICAgICAgICAgICAgICAgICAgICAgICAgLSBfZCAqIF9tYXRoLnNpbigoX1IgLyBfciArIF9kZWx0YSkgKiBfdGhldGEpXG4gICAgICAgICAgICAgICAgICAgICAgICAgKyBfb2Zmc2V0WTtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmxpbmVUbyhfeDIsIF95Mik7XG4gICAgICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgd2hpbGUgKGkgPD0gKF9yICogX251bSkgLyAoX1IgKyBfZGVsdGEgKiBfcikgKiAzNjApO1xuXG5cbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog6L+U5Zue5YaF5aSW5peL6L2u5puy57q/5YyF5Zu055uS55+p5b2iXG4gICAgICAgICAgICAgKiBAcGFyYW0ge21vZHVsZTp6cmVuZGVyL3NoYXBlL1Ryb2Nob2xkfklUcm9jaG9sZFN0eWxlfSBzdHlsZVxuICAgICAgICAgICAgICogQHJldHVybiB7bW9kdWxlOnpyZW5kZXIvc2hhcGUvQmFzZX5JQm91bmRpbmdSZWN0fVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBnZXRSZWN0IDogZnVuY3Rpb24gKHN0eWxlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0eWxlLl9fcmVjdCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3R5bGUuX19yZWN0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB2YXIgX1IgPSBzdHlsZS5yO1xuICAgICAgICAgICAgICAgIHZhciBfciA9IHN0eWxlLnIwO1xuICAgICAgICAgICAgICAgIHZhciBfZCA9IHN0eWxlLmQ7XG4gICAgICAgICAgICAgICAgdmFyIF9kZWx0YSA9IHN0eWxlLmxvY2F0aW9uID09ICdvdXQnID8gMSA6IC0xO1xuICAgICAgICAgICAgICAgIHZhciBfcyA9IF9SICsgX2QgKyBfZGVsdGEgKiBfcjtcbiAgICAgICAgICAgICAgICB2YXIgX29mZnNldFggPSBzdHlsZS54O1xuICAgICAgICAgICAgICAgIHZhciBfb2Zmc2V0WSA9IHN0eWxlLnk7XG5cbiAgICAgICAgICAgICAgICB2YXIgbGluZVdpZHRoO1xuICAgICAgICAgICAgICAgIGlmIChzdHlsZS5icnVzaFR5cGUgPT0gJ3N0cm9rZScgfHwgc3R5bGUuYnJ1c2hUeXBlID09ICdmaWxsJykge1xuICAgICAgICAgICAgICAgICAgICBsaW5lV2lkdGggPSBzdHlsZS5saW5lV2lkdGggfHwgMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGxpbmVXaWR0aCA9IDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHN0eWxlLl9fcmVjdCA9IHtcbiAgICAgICAgICAgICAgICAgICAgeCA6IC1fcyAtIGxpbmVXaWR0aCArIF9vZmZzZXRYLFxuICAgICAgICAgICAgICAgICAgICB5IDogLV9zIC0gbGluZVdpZHRoICsgX29mZnNldFksXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoIDogMiAqIF9zICsgMiAqIGxpbmVXaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0IDogMiAqIF9zICsgMiAqIGxpbmVXaWR0aFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0eWxlLl9fcmVjdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICByZXF1aXJlKCcuLi90b29sL3V0aWwnKS5pbmhlcml0cyhUcm9jaG9pZCwgQmFzZSk7XG4gICAgICAgIHJldHVybiBUcm9jaG9pZDtcbiAgICB9XG4pO1xuIl0sImZpbGUiOiJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3NoYXBlL1Ryb2Nob2lkLmpzIn0=
