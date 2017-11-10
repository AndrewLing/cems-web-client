/**
 * 扇形
 * @author Kener (@Kener-林峰, kener.linfeng@gmail.com)
 * @module zrender/shape/Sector
 * @example
 *     var Sector = require('zrender/shape/Sector');
 *     var shape = new Sector({
 *         style: {
 *             x: 100,
 *             y: 100,
 *             r: 60,
 *             r0: 30,
 *             startAngle: 0,
 *             endEngle: 180
 *         } 
 *     });
 *     zr.addShape(shape);
 */

/**
 * @typedef {Object} ISectorStyle
 * @property {number} x 圆心x坐标
 * @property {number} y 圆心y坐标
 * @property {number} r 外圆半径
 * @property {number} [r0=0] 内圆半径，指定后将出现内弧，同时扇边长度为`r - r0`
 * @property {number} startAngle 起始角度，`[0, 360)`
 * @property {number} endAngle 结束角度，`(0, 360]`
 * @property {boolean} [clockWise=false] 是否是顺时针
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
        var computeBoundingBox = require('../tool/computeBoundingBox');
        var vec2 = require('../tool/vector');
        var Base = require('./Base');
        
        var min0 = vec2.create();
        var min1 = vec2.create();
        var max0 = vec2.create();
        var max1 = vec2.create();
        /**
         * @alias module:zrender/shape/Sector
         * @constructor
         * @extends module:zrender/shape/Base
         * @param {Object} options
         */
        var Sector = function (options) {
            Base.call(this, options);
            /**
             * 扇形绘制样式
             * @name module:zrender/shape/Sector#style
             * @type {module:zrender/shape/Sector~ISectorStyle}
             */
            /**
             * 扇形高亮绘制样式
             * @name module:zrender/shape/Sector#highlightStyle
             * @type {module:zrender/shape/Sector~ISectorStyle}
             */
        };

        Sector.prototype = {
            type: 'sector',

            /**
             * 创建扇形路径
             * @param {CanvasRenderingContext2D} ctx
             * @param {module:zrender/shape/Sector~ISectorStyle} style
             */
            buildPath : function (ctx, style) {
                var x = style.x;   // 圆心x
                var y = style.y;   // 圆心y
                var r0 = style.r0 || 0;     // 形内半径[0,r)
                var r = style.r;            // 扇形外半径(0,r]
                var startAngle = style.startAngle;          // 起始角度[0,360)
                var endAngle = style.endAngle;              // 结束角度(0,360]
                var clockWise = style.clockWise || false;

                startAngle = math.degreeToRadian(startAngle);
                endAngle = math.degreeToRadian(endAngle);

                if (!clockWise) {
                    // 扇形默认是逆时针方向，Y轴向上
                    // 这个跟arc的标准不一样，为了兼容echarts
                    startAngle = -startAngle;
                    endAngle = -endAngle;
                }

                var unitX = math.cos(startAngle);
                var unitY = math.sin(startAngle);
                ctx.moveTo(
                    unitX * r0 + x,
                    unitY * r0 + y
                );

                ctx.lineTo(
                    unitX * r + x,
                    unitY * r + y
                );

                ctx.arc(x, y, r, startAngle, endAngle, !clockWise);

                ctx.lineTo(
                    math.cos(endAngle) * r0 + x,
                    math.sin(endAngle) * r0 + y
                );

                if (r0 !== 0) {
                    ctx.arc(x, y, r0, endAngle, startAngle, clockWise);
                }

                ctx.closePath();

                return;
            },

            /**
             * 返回扇形包围盒矩形
             * @param {module:zrender/shape/Sector~ISectorStyle} style
             * @return {module:zrender/shape/Base~IBoundingRect}
             */
            getRect : function (style) {
                if (style.__rect) {
                    return style.__rect;
                }
                
                var x = style.x;   // 圆心x
                var y = style.y;   // 圆心y
                var r0 = style.r0 || 0;     // 形内半径[0,r)
                var r = style.r;            // 扇形外半径(0,r]
                var startAngle = math.degreeToRadian(style.startAngle);
                var endAngle = math.degreeToRadian(style.endAngle);
                var clockWise = style.clockWise;

                if (!clockWise) {
                    startAngle = -startAngle;
                    endAngle = -endAngle;
                }

                if (r0 > 1) {
                    computeBoundingBox.arc(
                        x, y, r0, startAngle, endAngle, !clockWise, min0, max0
                    );   
                } else {
                    min0[0] = max0[0] = x;
                    min0[1] = max0[1] = y;
                }
                computeBoundingBox.arc(
                    x, y, r, startAngle, endAngle, !clockWise, min1, max1
                );

                vec2.min(min0, min0, min1);
                vec2.max(max0, max0, max1);
                style.__rect = {
                    x: min0[0],
                    y: min0[1],
                    width: max0[0] - min0[0],
                    height: max0[1] - min0[1]
                };
                return style.__rect;
            }
        };


        require('../tool/util').inherits(Sector, Base);
        return Sector;
    }
);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3NoYXBlL1NlY3Rvci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIOaJh+W9olxuICogQGF1dGhvciBLZW5lciAoQEtlbmVyLeael+WzsCwga2VuZXIubGluZmVuZ0BnbWFpbC5jb20pXG4gKiBAbW9kdWxlIHpyZW5kZXIvc2hhcGUvU2VjdG9yXG4gKiBAZXhhbXBsZVxuICogICAgIHZhciBTZWN0b3IgPSByZXF1aXJlKCd6cmVuZGVyL3NoYXBlL1NlY3RvcicpO1xuICogICAgIHZhciBzaGFwZSA9IG5ldyBTZWN0b3Ioe1xuICogICAgICAgICBzdHlsZToge1xuICogICAgICAgICAgICAgeDogMTAwLFxuICogICAgICAgICAgICAgeTogMTAwLFxuICogICAgICAgICAgICAgcjogNjAsXG4gKiAgICAgICAgICAgICByMDogMzAsXG4gKiAgICAgICAgICAgICBzdGFydEFuZ2xlOiAwLFxuICogICAgICAgICAgICAgZW5kRW5nbGU6IDE4MFxuICogICAgICAgICB9IFxuICogICAgIH0pO1xuICogICAgIHpyLmFkZFNoYXBlKHNoYXBlKTtcbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IElTZWN0b3JTdHlsZVxuICogQHByb3BlcnR5IHtudW1iZXJ9IHgg5ZyG5b+DeOWdkOagh1xuICogQHByb3BlcnR5IHtudW1iZXJ9IHkg5ZyG5b+DeeWdkOagh1xuICogQHByb3BlcnR5IHtudW1iZXJ9IHIg5aSW5ZyG5Y2K5b6EXG4gKiBAcHJvcGVydHkge251bWJlcn0gW3IwPTBdIOWGheWchuWNiuW+hO+8jOaMh+WumuWQjuWwhuWHuueOsOWGheW8p++8jOWQjOaXtuaJh+i+uemVv+W6puS4umByIC0gcjBgXG4gKiBAcHJvcGVydHkge251bWJlcn0gc3RhcnRBbmdsZSDotbflp4vop5LluqbvvIxgWzAsIDM2MClgXG4gKiBAcHJvcGVydHkge251bWJlcn0gZW5kQW5nbGUg57uT5p2f6KeS5bqm77yMYCgwLCAzNjBdYFxuICogQHByb3BlcnR5IHtib29sZWFufSBbY2xvY2tXaXNlPWZhbHNlXSDmmK/lkKbmmK/pobrml7bpkohcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbYnJ1c2hUeXBlPSdmaWxsJ11cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbY29sb3I9JyMwMDAwMDAnXSDloavlhYXpopzoibJcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbc3Ryb2tlQ29sb3I9JyMwMDAwMDAnXSDmj4/ovrnpopzoibJcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbbGluZUNhcGU9J2J1dHQnXSDnur/luL3moLflvI/vvIzlj6/ku6XmmK8gYnV0dCwgcm91bmQsIHNxdWFyZVxuICogQHByb3BlcnR5IHtudW1iZXJ9IFtsaW5lV2lkdGg9MV0g5o+P6L655a695bqmXG4gKiBAcHJvcGVydHkge251bWJlcn0gW29wYWNpdHk9MV0g57uY5Yi26YCP5piO5bqmXG4gKiBAcHJvcGVydHkge251bWJlcn0gW3NoYWRvd0JsdXI9MF0g6Zi05b2x5qih57OK5bqm77yM5aSn5LqOMOacieaViFxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtzaGFkb3dDb2xvcj0nIzAwMDAwMCddIOmYtOW9seminOiJslxuICogQHByb3BlcnR5IHtudW1iZXJ9IFtzaGFkb3dPZmZzZXRYPTBdIOmYtOW9seaoquWQkeWBj+enu1xuICogQHByb3BlcnR5IHtudW1iZXJ9IFtzaGFkb3dPZmZzZXRZPTBdIOmYtOW9see6teWQkeWBj+enu1xuICogQHByb3BlcnR5IHtzdHJpbmd9IFt0ZXh0XSDlm77lvaLkuK3nmoTpmYTliqDmlofmnKxcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbdGV4dENvbG9yPScjMDAwMDAwJ10g5paH5pys6aKc6ImyXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRGb250XSDpmYTliqDmlofmnKzmoLflvI/vvIxlZzonYm9sZCAxOHB4IHZlcmRhbmEnXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRQb3NpdGlvbj0nZW5kJ10g6ZmE5Yqg5paH5pys5L2N572uLCDlj6/ku6XmmK8gaW5zaWRlLCBsZWZ0LCByaWdodCwgdG9wLCBib3R0b21cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbdGV4dEFsaWduXSDpu5jorqTmoLnmja50ZXh0UG9zaXRpb27oh6rliqjorr7nva7vvIzpmYTliqDmlofmnKzmsLTlubPlr7npvZDjgIJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDlj6/ku6XmmK9zdGFydCwgZW5kLCBsZWZ0LCByaWdodCwgY2VudGVyXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRCYXNlbGluZV0g6buY6K6k5qC55o2udGV4dFBvc2l0aW9u6Ieq5Yqo6K6+572u77yM6ZmE5Yqg5paH5pys5Z6C55u05a+56b2Q44CCXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg5Y+v5Lul5pivdG9wLCBib3R0b20sIG1pZGRsZSwgYWxwaGFiZXRpYywgaGFuZ2luZywgaWRlb2dyYXBoaWNcbiAqL1xuXG5kZWZpbmUoXG4gICAgZnVuY3Rpb24gKHJlcXVpcmUpIHtcblxuICAgICAgICB2YXIgbWF0aCA9IHJlcXVpcmUoJy4uL3Rvb2wvbWF0aCcpO1xuICAgICAgICB2YXIgY29tcHV0ZUJvdW5kaW5nQm94ID0gcmVxdWlyZSgnLi4vdG9vbC9jb21wdXRlQm91bmRpbmdCb3gnKTtcbiAgICAgICAgdmFyIHZlYzIgPSByZXF1aXJlKCcuLi90b29sL3ZlY3RvcicpO1xuICAgICAgICB2YXIgQmFzZSA9IHJlcXVpcmUoJy4vQmFzZScpO1xuICAgICAgICBcbiAgICAgICAgdmFyIG1pbjAgPSB2ZWMyLmNyZWF0ZSgpO1xuICAgICAgICB2YXIgbWluMSA9IHZlYzIuY3JlYXRlKCk7XG4gICAgICAgIHZhciBtYXgwID0gdmVjMi5jcmVhdGUoKTtcbiAgICAgICAgdmFyIG1heDEgPSB2ZWMyLmNyZWF0ZSgpO1xuICAgICAgICAvKipcbiAgICAgICAgICogQGFsaWFzIG1vZHVsZTp6cmVuZGVyL3NoYXBlL1NlY3RvclxuICAgICAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgICAgICogQGV4dGVuZHMgbW9kdWxlOnpyZW5kZXIvc2hhcGUvQmFzZVxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICAgICAgICAgKi9cbiAgICAgICAgdmFyIFNlY3RvciA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgICAgICBCYXNlLmNhbGwodGhpcywgb3B0aW9ucyk7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOaJh+W9oue7mOWItuagt+W8j1xuICAgICAgICAgICAgICogQG5hbWUgbW9kdWxlOnpyZW5kZXIvc2hhcGUvU2VjdG9yI3N0eWxlXG4gICAgICAgICAgICAgKiBAdHlwZSB7bW9kdWxlOnpyZW5kZXIvc2hhcGUvU2VjdG9yfklTZWN0b3JTdHlsZX1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDmiYflvaLpq5jkuq7nu5jliLbmoLflvI9cbiAgICAgICAgICAgICAqIEBuYW1lIG1vZHVsZTp6cmVuZGVyL3NoYXBlL1NlY3RvciNoaWdobGlnaHRTdHlsZVxuICAgICAgICAgICAgICogQHR5cGUge21vZHVsZTp6cmVuZGVyL3NoYXBlL1NlY3Rvcn5JU2VjdG9yU3R5bGV9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgfTtcblxuICAgICAgICBTZWN0b3IucHJvdG90eXBlID0ge1xuICAgICAgICAgICAgdHlwZTogJ3NlY3RvcicsXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5Yib5bu65omH5b2i6Lev5b6EXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRH0gY3R4XG4gICAgICAgICAgICAgKiBAcGFyYW0ge21vZHVsZTp6cmVuZGVyL3NoYXBlL1NlY3Rvcn5JU2VjdG9yU3R5bGV9IHN0eWxlXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGJ1aWxkUGF0aCA6IGZ1bmN0aW9uIChjdHgsIHN0eWxlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHggPSBzdHlsZS54OyAgIC8vIOWchuW/g3hcbiAgICAgICAgICAgICAgICB2YXIgeSA9IHN0eWxlLnk7ICAgLy8g5ZyG5b+DeVxuICAgICAgICAgICAgICAgIHZhciByMCA9IHN0eWxlLnIwIHx8IDA7ICAgICAvLyDlvaLlhoXljYrlvoRbMCxyKVxuICAgICAgICAgICAgICAgIHZhciByID0gc3R5bGUucjsgICAgICAgICAgICAvLyDmiYflvaLlpJbljYrlvoQoMCxyXVxuICAgICAgICAgICAgICAgIHZhciBzdGFydEFuZ2xlID0gc3R5bGUuc3RhcnRBbmdsZTsgICAgICAgICAgLy8g6LW35aeL6KeS5bqmWzAsMzYwKVxuICAgICAgICAgICAgICAgIHZhciBlbmRBbmdsZSA9IHN0eWxlLmVuZEFuZ2xlOyAgICAgICAgICAgICAgLy8g57uT5p2f6KeS5bqmKDAsMzYwXVxuICAgICAgICAgICAgICAgIHZhciBjbG9ja1dpc2UgPSBzdHlsZS5jbG9ja1dpc2UgfHwgZmFsc2U7XG5cbiAgICAgICAgICAgICAgICBzdGFydEFuZ2xlID0gbWF0aC5kZWdyZWVUb1JhZGlhbihzdGFydEFuZ2xlKTtcbiAgICAgICAgICAgICAgICBlbmRBbmdsZSA9IG1hdGguZGVncmVlVG9SYWRpYW4oZW5kQW5nbGUpO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFjbG9ja1dpc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5omH5b2i6buY6K6k5piv6YCG5pe26ZKI5pa55ZCR77yMWei9tOWQkeS4ilxuICAgICAgICAgICAgICAgICAgICAvLyDov5nkuKrot59hcmPnmoTmoIflh4bkuI3kuIDmoLfvvIzkuLrkuoblhbzlrrllY2hhcnRzXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0QW5nbGUgPSAtc3RhcnRBbmdsZTtcbiAgICAgICAgICAgICAgICAgICAgZW5kQW5nbGUgPSAtZW5kQW5nbGU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIHVuaXRYID0gbWF0aC5jb3Moc3RhcnRBbmdsZSk7XG4gICAgICAgICAgICAgICAgdmFyIHVuaXRZID0gbWF0aC5zaW4oc3RhcnRBbmdsZSk7XG4gICAgICAgICAgICAgICAgY3R4Lm1vdmVUbyhcbiAgICAgICAgICAgICAgICAgICAgdW5pdFggKiByMCArIHgsXG4gICAgICAgICAgICAgICAgICAgIHVuaXRZICogcjAgKyB5XG4gICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgIGN0eC5saW5lVG8oXG4gICAgICAgICAgICAgICAgICAgIHVuaXRYICogciArIHgsXG4gICAgICAgICAgICAgICAgICAgIHVuaXRZICogciArIHlcbiAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgY3R4LmFyYyh4LCB5LCByLCBzdGFydEFuZ2xlLCBlbmRBbmdsZSwgIWNsb2NrV2lzZSk7XG5cbiAgICAgICAgICAgICAgICBjdHgubGluZVRvKFxuICAgICAgICAgICAgICAgICAgICBtYXRoLmNvcyhlbmRBbmdsZSkgKiByMCArIHgsXG4gICAgICAgICAgICAgICAgICAgIG1hdGguc2luKGVuZEFuZ2xlKSAqIHIwICsgeVxuICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICBpZiAocjAgIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmFyYyh4LCB5LCByMCwgZW5kQW5nbGUsIHN0YXJ0QW5nbGUsIGNsb2NrV2lzZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY3R4LmNsb3NlUGF0aCgpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDov5Tlm57miYflvaLljIXlm7Tnm5Lnn6nlvaJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bW9kdWxlOnpyZW5kZXIvc2hhcGUvU2VjdG9yfklTZWN0b3JTdHlsZX0gc3R5bGVcbiAgICAgICAgICAgICAqIEByZXR1cm4ge21vZHVsZTp6cmVuZGVyL3NoYXBlL0Jhc2V+SUJvdW5kaW5nUmVjdH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZ2V0UmVjdCA6IGZ1bmN0aW9uIChzdHlsZSkge1xuICAgICAgICAgICAgICAgIGlmIChzdHlsZS5fX3JlY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN0eWxlLl9fcmVjdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIHggPSBzdHlsZS54OyAgIC8vIOWchuW/g3hcbiAgICAgICAgICAgICAgICB2YXIgeSA9IHN0eWxlLnk7ICAgLy8g5ZyG5b+DeVxuICAgICAgICAgICAgICAgIHZhciByMCA9IHN0eWxlLnIwIHx8IDA7ICAgICAvLyDlvaLlhoXljYrlvoRbMCxyKVxuICAgICAgICAgICAgICAgIHZhciByID0gc3R5bGUucjsgICAgICAgICAgICAvLyDmiYflvaLlpJbljYrlvoQoMCxyXVxuICAgICAgICAgICAgICAgIHZhciBzdGFydEFuZ2xlID0gbWF0aC5kZWdyZWVUb1JhZGlhbihzdHlsZS5zdGFydEFuZ2xlKTtcbiAgICAgICAgICAgICAgICB2YXIgZW5kQW5nbGUgPSBtYXRoLmRlZ3JlZVRvUmFkaWFuKHN0eWxlLmVuZEFuZ2xlKTtcbiAgICAgICAgICAgICAgICB2YXIgY2xvY2tXaXNlID0gc3R5bGUuY2xvY2tXaXNlO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFjbG9ja1dpc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRBbmdsZSA9IC1zdGFydEFuZ2xlO1xuICAgICAgICAgICAgICAgICAgICBlbmRBbmdsZSA9IC1lbmRBbmdsZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAocjAgPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbXB1dGVCb3VuZGluZ0JveC5hcmMoXG4gICAgICAgICAgICAgICAgICAgICAgICB4LCB5LCByMCwgc3RhcnRBbmdsZSwgZW5kQW5nbGUsICFjbG9ja1dpc2UsIG1pbjAsIG1heDBcbiAgICAgICAgICAgICAgICAgICAgKTsgICBcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBtaW4wWzBdID0gbWF4MFswXSA9IHg7XG4gICAgICAgICAgICAgICAgICAgIG1pbjBbMV0gPSBtYXgwWzFdID0geTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29tcHV0ZUJvdW5kaW5nQm94LmFyYyhcbiAgICAgICAgICAgICAgICAgICAgeCwgeSwgciwgc3RhcnRBbmdsZSwgZW5kQW5nbGUsICFjbG9ja1dpc2UsIG1pbjEsIG1heDFcbiAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgdmVjMi5taW4obWluMCwgbWluMCwgbWluMSk7XG4gICAgICAgICAgICAgICAgdmVjMi5tYXgobWF4MCwgbWF4MCwgbWF4MSk7XG4gICAgICAgICAgICAgICAgc3R5bGUuX19yZWN0ID0ge1xuICAgICAgICAgICAgICAgICAgICB4OiBtaW4wWzBdLFxuICAgICAgICAgICAgICAgICAgICB5OiBtaW4wWzFdLFxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogbWF4MFswXSAtIG1pbjBbMF0sXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogbWF4MFsxXSAtIG1pbjBbMV1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJldHVybiBzdHlsZS5fX3JlY3Q7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cblxuICAgICAgICByZXF1aXJlKCcuLi90b29sL3V0aWwnKS5pbmhlcml0cyhTZWN0b3IsIEJhc2UpO1xuICAgICAgICByZXR1cm4gU2VjdG9yO1xuICAgIH1cbik7XG4iXSwiZmlsZSI6InBsdWdpbnMvenJlbmRlci0yLjEuMC9zcmMvc2hhcGUvU2VjdG9yLmpzIn0=
