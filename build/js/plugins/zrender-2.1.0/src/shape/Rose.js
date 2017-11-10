/**
 * 玫瑰线
 * @module zrender/shape/Rose
 * @author Neil (杨骥, 511415343@qq.com)
 * @example
 *     var Rose = require('zrender/shape/Rose');
 *     var shape = new Rose({
 *         style: {
 *             x: 100,
 *             y: 100,
 *             r1: 50,
 *             r2: 30,
 *             d: 50,
 *             strokeColor: '#eee',
 *             lineWidth: 3
 *         }
 *     });
 *     zr.addShape(shape);
 */

/**
 * @typedef {Object} IRoseStyle
 * @property {number} x 中心x坐标
 * @property {number} y 中心y坐标
 * @property {number} r 每个线条的最大长度
 * @property {number} k 花瓣数量，当n为1时，奇数即为花瓣数，偶数时花瓣数量翻倍
 * @property {number} [n=1] 必须为整数，与k共同决定花瓣的数量
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
         * @alias module:zrender/shape/Rose
         * @constructor
         * @extends module:zrender/shape/Base
         * @param {Object} options
         */
        var Rose = function (options) {
            this.brushTypeOnly = 'stroke';  // 线条只能描边，填充后果自负
            Base.call(this, options);
            /**
             * 玫瑰线绘制样式
             * @name module:zrender/shape/Rose#style
             * @type {module:zrender/shape/Rose~IRoseStyle}
             */
            /**
             * 玫瑰线高亮绘制样式
             * @name module:zrender/shape/Rose#highlightStyle
             * @type {module:zrender/shape/Rose~IRoseStyle}
             */
        };

        Rose.prototype =  {
            type: 'rose',

            /**
             * 创建玫瑰线路径
             * @param {CanvasRenderingContext2D} ctx
             * @param {module:zrender/shape/Rose~IRoseStyle} style
             */
            buildPath : function (ctx, style) {
                var _x;
                var _y;
                var _R = style.r;
                var _r;
                var _k = style.k;
                var _n = style.n || 1;

                var _offsetX = style.x;
                var _offsetY = style.y;

                var _math = require('../tool/math');
                ctx.moveTo(_offsetX, _offsetY);

                for (var i = 0, _len = _R.length; i < _len ; i++) {
                    _r = _R[i];

                    for (var j = 0; j <= 360 * _n; j++) {
                        _x = _r
                             * _math.sin(_k / _n * j % 360, true)
                             * _math.cos(j, true)
                             + _offsetX;
                        _y = _r
                             * _math.sin(_k / _n * j % 360, true)
                             * _math.sin(j, true)
                             + _offsetY;
                        ctx.lineTo(_x, _y);
                    }
                }
            },

            /**
             * 返回玫瑰线包围盒矩形
             * @param {module:zrender/shape/Rose~IRoseStyle} style
             * @return {module:zrender/shape/Base~IBoundingRect}
             */
            getRect : function (style) {
                if (style.__rect) {
                    return style.__rect;
                }
                
                var _R = style.r;
                var _offsetX = style.x;
                var _offsetY = style.y;
                var _max = 0;

                for (var i = 0, _len = _R.length; i < _len ; i++) {
                    if (_R[i] > _max) {
                        _max = _R[i];
                    }
                }
                style.maxr = _max;

                var lineWidth;
                if (style.brushType == 'stroke' || style.brushType == 'fill') {
                    lineWidth = style.lineWidth || 1;
                }
                else {
                    lineWidth = 0;
                }
                style.__rect = {
                    x : -_max - lineWidth + _offsetX,
                    y : -_max - lineWidth + _offsetY,
                    width : 2 * _max + 3 * lineWidth,
                    height : 2 * _max + 3 * lineWidth
                };
                return style.__rect;
            }
        };
        
        require('../tool/util').inherits(Rose, Base);
        return Rose;
    }
);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3NoYXBlL1Jvc2UuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiDnjqvnkbDnur9cbiAqIEBtb2R1bGUgenJlbmRlci9zaGFwZS9Sb3NlXG4gKiBAYXV0aG9yIE5laWwgKOadqOmqpSwgNTExNDE1MzQzQHFxLmNvbSlcbiAqIEBleGFtcGxlXG4gKiAgICAgdmFyIFJvc2UgPSByZXF1aXJlKCd6cmVuZGVyL3NoYXBlL1Jvc2UnKTtcbiAqICAgICB2YXIgc2hhcGUgPSBuZXcgUm9zZSh7XG4gKiAgICAgICAgIHN0eWxlOiB7XG4gKiAgICAgICAgICAgICB4OiAxMDAsXG4gKiAgICAgICAgICAgICB5OiAxMDAsXG4gKiAgICAgICAgICAgICByMTogNTAsXG4gKiAgICAgICAgICAgICByMjogMzAsXG4gKiAgICAgICAgICAgICBkOiA1MCxcbiAqICAgICAgICAgICAgIHN0cm9rZUNvbG9yOiAnI2VlZScsXG4gKiAgICAgICAgICAgICBsaW5lV2lkdGg6IDNcbiAqICAgICAgICAgfVxuICogICAgIH0pO1xuICogICAgIHpyLmFkZFNoYXBlKHNoYXBlKTtcbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IElSb3NlU3R5bGVcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB4IOS4reW/g3jlnZDmoIdcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB5IOS4reW/g3nlnZDmoIdcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSByIOavj+S4que6v+adoeeahOacgOWkp+mVv+W6plxuICogQHByb3BlcnR5IHtudW1iZXJ9IGsg6Iqx55Oj5pWw6YeP77yM5b2TbuS4ujHml7bvvIzlpYfmlbDljbPkuLroirHnk6PmlbDvvIzlgbbmlbDml7boirHnk6PmlbDph4/nv7vlgI1cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbbj0xXSDlv4XpobvkuLrmlbTmlbDvvIzkuI5r5YWx5ZCM5Yaz5a6a6Iqx55Oj55qE5pWw6YePXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3N0cm9rZUNvbG9yPScjMDAwMDAwJ10g5o+P6L656aKc6ImyXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW2xpbmVDYXBlPSdidXR0J10g57q/5bi95qC35byP77yM5Y+v5Lul5pivIGJ1dHQsIHJvdW5kLCBzcXVhcmVcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbbGluZVdpZHRoPTFdIOaPj+i+ueWuveW6plxuICogQHByb3BlcnR5IHtudW1iZXJ9IFtvcGFjaXR5PTFdIOe7mOWItumAj+aYjuW6plxuICogQHByb3BlcnR5IHtudW1iZXJ9IFtzaGFkb3dCbHVyPTBdIOmYtOW9seaooeeziuW6pu+8jOWkp+S6jjDmnInmlYhcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbc2hhZG93Q29sb3I9JyMwMDAwMDAnXSDpmLTlvbHpopzoibJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbc2hhZG93T2Zmc2V0WD0wXSDpmLTlvbHmqKrlkJHlgY/np7tcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbc2hhZG93T2Zmc2V0WT0wXSDpmLTlvbHnurXlkJHlgY/np7tcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbdGV4dF0g5Zu+5b2i5Lit55qE6ZmE5Yqg5paH5pysXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRDb2xvcj0nIzAwMDAwMCddIOaWh+acrOminOiJslxuICogQHByb3BlcnR5IHtzdHJpbmd9IFt0ZXh0Rm9udF0g6ZmE5Yqg5paH5pys5qC35byP77yMZWc6J2JvbGQgMThweCB2ZXJkYW5hJ1xuICogQHByb3BlcnR5IHtzdHJpbmd9IFt0ZXh0UG9zaXRpb249J2VuZCddIOmZhOWKoOaWh+acrOS9jee9riwg5Y+v5Lul5pivIGluc2lkZSwgbGVmdCwgcmlnaHQsIHRvcCwgYm90dG9tXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRBbGlnbl0g6buY6K6k5qC55o2udGV4dFBvc2l0aW9u6Ieq5Yqo6K6+572u77yM6ZmE5Yqg5paH5pys5rC05bmz5a+56b2Q44CCXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg5Y+v5Lul5pivc3RhcnQsIGVuZCwgbGVmdCwgcmlnaHQsIGNlbnRlclxuICogQHByb3BlcnR5IHtzdHJpbmd9IFt0ZXh0QmFzZWxpbmVdIOm7mOiupOagueaNrnRleHRQb3NpdGlvbuiHquWKqOiuvue9ru+8jOmZhOWKoOaWh+acrOWeguebtOWvuem9kOOAglxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIOWPr+S7peaYr3RvcCwgYm90dG9tLCBtaWRkbGUsIGFscGhhYmV0aWMsIGhhbmdpbmcsIGlkZW9ncmFwaGljXG4gKi9cblxuZGVmaW5lKFxuICAgIGZ1bmN0aW9uIChyZXF1aXJlKSB7XG4gICAgICAgIHZhciBCYXNlID0gcmVxdWlyZSgnLi9CYXNlJyk7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgICogQGFsaWFzIG1vZHVsZTp6cmVuZGVyL3NoYXBlL1Jvc2VcbiAgICAgICAgICogQGNvbnN0cnVjdG9yXG4gICAgICAgICAqIEBleHRlbmRzIG1vZHVsZTp6cmVuZGVyL3NoYXBlL0Jhc2VcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAgICAgICAgICovXG4gICAgICAgIHZhciBSb3NlID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHRoaXMuYnJ1c2hUeXBlT25seSA9ICdzdHJva2UnOyAgLy8g57q/5p2h5Y+q6IO95o+P6L6577yM5aGr5YWF5ZCO5p6c6Ieq6LSfXG4gICAgICAgICAgICBCYXNlLmNhbGwodGhpcywgb3B0aW9ucyk7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOeOq+eRsOe6v+e7mOWItuagt+W8j1xuICAgICAgICAgICAgICogQG5hbWUgbW9kdWxlOnpyZW5kZXIvc2hhcGUvUm9zZSNzdHlsZVxuICAgICAgICAgICAgICogQHR5cGUge21vZHVsZTp6cmVuZGVyL3NoYXBlL1Jvc2V+SVJvc2VTdHlsZX1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDnjqvnkbDnur/pq5jkuq7nu5jliLbmoLflvI9cbiAgICAgICAgICAgICAqIEBuYW1lIG1vZHVsZTp6cmVuZGVyL3NoYXBlL1Jvc2UjaGlnaGxpZ2h0U3R5bGVcbiAgICAgICAgICAgICAqIEB0eXBlIHttb2R1bGU6enJlbmRlci9zaGFwZS9Sb3NlfklSb3NlU3R5bGV9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgfTtcblxuICAgICAgICBSb3NlLnByb3RvdHlwZSA9ICB7XG4gICAgICAgICAgICB0eXBlOiAncm9zZScsXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5Yib5bu6546r55Gw57q/6Lev5b6EXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRH0gY3R4XG4gICAgICAgICAgICAgKiBAcGFyYW0ge21vZHVsZTp6cmVuZGVyL3NoYXBlL1Jvc2V+SVJvc2VTdHlsZX0gc3R5bGVcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgYnVpbGRQYXRoIDogZnVuY3Rpb24gKGN0eCwgc3R5bGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgX3g7XG4gICAgICAgICAgICAgICAgdmFyIF95O1xuICAgICAgICAgICAgICAgIHZhciBfUiA9IHN0eWxlLnI7XG4gICAgICAgICAgICAgICAgdmFyIF9yO1xuICAgICAgICAgICAgICAgIHZhciBfayA9IHN0eWxlLms7XG4gICAgICAgICAgICAgICAgdmFyIF9uID0gc3R5bGUubiB8fCAxO1xuXG4gICAgICAgICAgICAgICAgdmFyIF9vZmZzZXRYID0gc3R5bGUueDtcbiAgICAgICAgICAgICAgICB2YXIgX29mZnNldFkgPSBzdHlsZS55O1xuXG4gICAgICAgICAgICAgICAgdmFyIF9tYXRoID0gcmVxdWlyZSgnLi4vdG9vbC9tYXRoJyk7XG4gICAgICAgICAgICAgICAgY3R4Lm1vdmVUbyhfb2Zmc2V0WCwgX29mZnNldFkpO1xuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIF9sZW4gPSBfUi5sZW5ndGg7IGkgPCBfbGVuIDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIF9yID0gX1JbaV07XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPD0gMzYwICogX247IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgX3ggPSBfclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIF9tYXRoLnNpbihfayAvIF9uICogaiAlIDM2MCwgdHJ1ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiBfbWF0aC5jb3MoaiwgdHJ1ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyBfb2Zmc2V0WDtcbiAgICAgICAgICAgICAgICAgICAgICAgIF95ID0gX3JcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiBfbWF0aC5zaW4oX2sgLyBfbiAqIGogJSAzNjAsIHRydWUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICogX21hdGguc2luKGosIHRydWUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgX29mZnNldFk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHgubGluZVRvKF94LCBfeSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOi/lOWbnueOq+eRsOe6v+WMheWbtOebkuefqeW9olxuICAgICAgICAgICAgICogQHBhcmFtIHttb2R1bGU6enJlbmRlci9zaGFwZS9Sb3NlfklSb3NlU3R5bGV9IHN0eWxlXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHttb2R1bGU6enJlbmRlci9zaGFwZS9CYXNlfklCb3VuZGluZ1JlY3R9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGdldFJlY3QgOiBmdW5jdGlvbiAoc3R5bGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3R5bGUuX19yZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzdHlsZS5fX3JlY3Q7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHZhciBfUiA9IHN0eWxlLnI7XG4gICAgICAgICAgICAgICAgdmFyIF9vZmZzZXRYID0gc3R5bGUueDtcbiAgICAgICAgICAgICAgICB2YXIgX29mZnNldFkgPSBzdHlsZS55O1xuICAgICAgICAgICAgICAgIHZhciBfbWF4ID0gMDtcblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBfbGVuID0gX1IubGVuZ3RoOyBpIDwgX2xlbiA7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoX1JbaV0gPiBfbWF4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfbWF4ID0gX1JbaV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc3R5bGUubWF4ciA9IF9tYXg7XG5cbiAgICAgICAgICAgICAgICB2YXIgbGluZVdpZHRoO1xuICAgICAgICAgICAgICAgIGlmIChzdHlsZS5icnVzaFR5cGUgPT0gJ3N0cm9rZScgfHwgc3R5bGUuYnJ1c2hUeXBlID09ICdmaWxsJykge1xuICAgICAgICAgICAgICAgICAgICBsaW5lV2lkdGggPSBzdHlsZS5saW5lV2lkdGggfHwgMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGxpbmVXaWR0aCA9IDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHN0eWxlLl9fcmVjdCA9IHtcbiAgICAgICAgICAgICAgICAgICAgeCA6IC1fbWF4IC0gbGluZVdpZHRoICsgX29mZnNldFgsXG4gICAgICAgICAgICAgICAgICAgIHkgOiAtX21heCAtIGxpbmVXaWR0aCArIF9vZmZzZXRZLFxuICAgICAgICAgICAgICAgICAgICB3aWR0aCA6IDIgKiBfbWF4ICsgMyAqIGxpbmVXaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0IDogMiAqIF9tYXggKyAzICogbGluZVdpZHRoXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3R5bGUuX19yZWN0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBcbiAgICAgICAgcmVxdWlyZSgnLi4vdG9vbC91dGlsJykuaW5oZXJpdHMoUm9zZSwgQmFzZSk7XG4gICAgICAgIHJldHVybiBSb3NlO1xuICAgIH1cbik7XG4iXSwiZmlsZSI6InBsdWdpbnMvenJlbmRlci0yLjEuMC9zcmMvc2hhcGUvUm9zZS5qcyJ9
