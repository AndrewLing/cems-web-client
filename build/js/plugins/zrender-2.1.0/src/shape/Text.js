/**
 * @module zrender/shape/Text
 * @author Kener (@Kener-林峰, kener.linfeng@gmail.com)
 * @example
 *     var Text = require('zrender/shape/Text');
 *     var shape = new Text({
 *         style: {
 *             text: 'Label',
 *             x: 100,
 *             y: 100,
 *             textFont: '14px Arial'
 *         }
 *     });
 *     zr.addShape(shape);
 */

/**
 * @typedef {Object} ITextStyle
 * @property {number} x 横坐标
 * @property {number} y 纵坐标
 * @property {string} text 文本内容
 * @property {number} [maxWidth=null] 最大宽度限制
 * @property {string} [textFont] 附加文本样式，eg:'bold 18px verdana'
 * @property {string} [textAlign] 可以是start, end, left, right, center
 * @property {string} [textBaseline] 默认根据textPosition自动设置，附加文本垂直对齐。
 *                                可以是top, bottom, middle, alphabetic, hanging, ideographic
 * @property {string} [brushType='fill']
 * @property {string} [color='#000000'] 填充颜色
 * @property {string} [strokeColor='#000000'] 描边颜色
 * @property {number} [lineWidth=1] 描边宽度
 * @property {number} [opacity=1] 绘制透明度
 * @property {number} [shadowBlur=0] 阴影模糊度，大于0有效
 * @property {string} [shadowColor='#000000'] 阴影颜色
 * @property {number} [shadowOffsetX=0] 阴影横向偏移
 * @property {number} [shadowOffsetY=0] 阴影纵向偏移
 */

define(
    function (require) {
        var area = require('../tool/area');
        var Base = require('./Base');
        
        /**
         * @alias module:zrender/shape/Text
         * @constructor
         * @extends module:zrender/shape/Base
         * @param {Object} options
         */
        var Text = function (options) {
            Base.call(this, options);
            /**
             * 文字绘制样式
             * @name module:zrender/shape/Text#style
             * @type {module:zrender/shape/Text~ITextStyle}
             */
            /**
             * 文字高亮绘制样式
             * @name module:zrender/shape/Text#highlightStyle
             * @type {module:zrender/shape/Text~ITextStyle}
             */
        };

        Text.prototype =  {
            type: 'text',

            brush : function (ctx, isHighlight) {
                var style = this.style;
                if (isHighlight) {
                    // 根据style扩展默认高亮样式
                    style = this.getHighlightStyle(
                        style, this.highlightStyle || {}
                    );
                }
                
                if (typeof(style.text) == 'undefined' || style.text === false) {
                    return;
                }

                ctx.save();
                this.doClip(ctx);

                this.setContext(ctx, style);

                // 设置transform
                this.setTransform(ctx);

                if (style.textFont) {
                    ctx.font = style.textFont;
                }
                ctx.textAlign = style.textAlign || 'start';
                ctx.textBaseline = style.textBaseline || 'middle';

                var text = (style.text + '').split('\n');
                var lineHeight = area.getTextHeight('国', style.textFont);
                var rect = this.getRect(style);
                var x = style.x;
                var y;
                if (style.textBaseline == 'top') {
                    y = rect.y;
                }
                else if (style.textBaseline == 'bottom') {
                    y = rect.y + lineHeight;
                }
                else {
                    y = rect.y + lineHeight / 2;
                }
                
                for (var i = 0, l = text.length; i < l; i++) {
                    if (style.maxWidth) {
                        switch (style.brushType) {
                            case 'fill':
                                ctx.fillText(
                                    text[i],
                                    x, y, style.maxWidth
                                );
                                break;
                            case 'stroke':
                                ctx.strokeText(
                                    text[i],
                                    x, y, style.maxWidth
                                );
                                break;
                            case 'both':
                                ctx.fillText(
                                    text[i],
                                    x, y, style.maxWidth
                                );
                                ctx.strokeText(
                                    text[i],
                                    x, y, style.maxWidth
                                );
                                break;
                            default:
                                ctx.fillText(
                                    text[i],
                                    x, y, style.maxWidth
                                );
                        }
                    }
                    else {
                        switch (style.brushType) {
                            case 'fill':
                                ctx.fillText(text[i], x, y);
                                break;
                            case 'stroke':
                                ctx.strokeText(text[i], x, y);
                                break;
                            case 'both':
                                ctx.fillText(text[i], x, y);
                                ctx.strokeText(text[i], x, y);
                                break;
                            default:
                                ctx.fillText(text[i], x, y);
                        }
                    }
                    y += lineHeight;
                }

                ctx.restore();
                return;
            },

            /**
             * 返回文字包围盒矩形
             * @param {module:zrender/shape/Text~ITextStyle} style
             * @return {module:zrender/shape/Base~IBoundingRect}
             */
            getRect : function (style) {
                if (style.__rect) {
                    return style.__rect;
                }
                
                var width = area.getTextWidth(style.text, style.textFont);
                var height = area.getTextHeight(style.text, style.textFont);
                
                var textX = style.x;                 // 默认start == left
                if (style.textAlign == 'end' || style.textAlign == 'right') {
                    textX -= width;
                }
                else if (style.textAlign == 'center') {
                    textX -= (width / 2);
                }

                var textY;
                if (style.textBaseline == 'top') {
                    textY = style.y;
                }
                else if (style.textBaseline == 'bottom') {
                    textY = style.y - height;
                }
                else {
                    // middle
                    textY = style.y - height / 2;
                }

                style.__rect = {
                    x : textX,
                    y : textY,
                    width : width,
                    height : height
                };
                
                return style.__rect;
            }
        };

        require('../tool/util').inherits(Text, Base);
        return Text;
    }
);


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3NoYXBlL1RleHQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbW9kdWxlIHpyZW5kZXIvc2hhcGUvVGV4dFxuICogQGF1dGhvciBLZW5lciAoQEtlbmVyLeael+WzsCwga2VuZXIubGluZmVuZ0BnbWFpbC5jb20pXG4gKiBAZXhhbXBsZVxuICogICAgIHZhciBUZXh0ID0gcmVxdWlyZSgnenJlbmRlci9zaGFwZS9UZXh0Jyk7XG4gKiAgICAgdmFyIHNoYXBlID0gbmV3IFRleHQoe1xuICogICAgICAgICBzdHlsZToge1xuICogICAgICAgICAgICAgdGV4dDogJ0xhYmVsJyxcbiAqICAgICAgICAgICAgIHg6IDEwMCxcbiAqICAgICAgICAgICAgIHk6IDEwMCxcbiAqICAgICAgICAgICAgIHRleHRGb250OiAnMTRweCBBcmlhbCdcbiAqICAgICAgICAgfVxuICogICAgIH0pO1xuICogICAgIHpyLmFkZFNoYXBlKHNoYXBlKTtcbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IElUZXh0U3R5bGVcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB4IOaoquWdkOagh1xuICogQHByb3BlcnR5IHtudW1iZXJ9IHkg57q15Z2Q5qCHXG4gKiBAcHJvcGVydHkge3N0cmluZ30gdGV4dCDmlofmnKzlhoXlrrlcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbbWF4V2lkdGg9bnVsbF0g5pyA5aSn5a695bqm6ZmQ5Yi2XG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRGb250XSDpmYTliqDmlofmnKzmoLflvI/vvIxlZzonYm9sZCAxOHB4IHZlcmRhbmEnXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRBbGlnbl0g5Y+v5Lul5pivc3RhcnQsIGVuZCwgbGVmdCwgcmlnaHQsIGNlbnRlclxuICogQHByb3BlcnR5IHtzdHJpbmd9IFt0ZXh0QmFzZWxpbmVdIOm7mOiupOagueaNrnRleHRQb3NpdGlvbuiHquWKqOiuvue9ru+8jOmZhOWKoOaWh+acrOWeguebtOWvuem9kOOAglxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIOWPr+S7peaYr3RvcCwgYm90dG9tLCBtaWRkbGUsIGFscGhhYmV0aWMsIGhhbmdpbmcsIGlkZW9ncmFwaGljXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW2JydXNoVHlwZT0nZmlsbCddXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW2NvbG9yPScjMDAwMDAwJ10g5aGr5YWF6aKc6ImyXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3N0cm9rZUNvbG9yPScjMDAwMDAwJ10g5o+P6L656aKc6ImyXG4gKiBAcHJvcGVydHkge251bWJlcn0gW2xpbmVXaWR0aD0xXSDmj4/ovrnlrr3luqZcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbb3BhY2l0eT0xXSDnu5jliLbpgI/mmI7luqZcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbc2hhZG93Qmx1cj0wXSDpmLTlvbHmqKHns4rluqbvvIzlpKfkuo4w5pyJ5pWIXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3NoYWRvd0NvbG9yPScjMDAwMDAwJ10g6Zi05b2x6aKc6ImyXG4gKiBAcHJvcGVydHkge251bWJlcn0gW3NoYWRvd09mZnNldFg9MF0g6Zi05b2x5qiq5ZCR5YGP56e7XG4gKiBAcHJvcGVydHkge251bWJlcn0gW3NoYWRvd09mZnNldFk9MF0g6Zi05b2x57q15ZCR5YGP56e7XG4gKi9cblxuZGVmaW5lKFxuICAgIGZ1bmN0aW9uIChyZXF1aXJlKSB7XG4gICAgICAgIHZhciBhcmVhID0gcmVxdWlyZSgnLi4vdG9vbC9hcmVhJyk7XG4gICAgICAgIHZhciBCYXNlID0gcmVxdWlyZSgnLi9CYXNlJyk7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgICogQGFsaWFzIG1vZHVsZTp6cmVuZGVyL3NoYXBlL1RleHRcbiAgICAgICAgICogQGNvbnN0cnVjdG9yXG4gICAgICAgICAqIEBleHRlbmRzIG1vZHVsZTp6cmVuZGVyL3NoYXBlL0Jhc2VcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAgICAgICAgICovXG4gICAgICAgIHZhciBUZXh0ID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIEJhc2UuY2FsbCh0aGlzLCBvcHRpb25zKTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5paH5a2X57uY5Yi25qC35byPXG4gICAgICAgICAgICAgKiBAbmFtZSBtb2R1bGU6enJlbmRlci9zaGFwZS9UZXh0I3N0eWxlXG4gICAgICAgICAgICAgKiBAdHlwZSB7bW9kdWxlOnpyZW5kZXIvc2hhcGUvVGV4dH5JVGV4dFN0eWxlfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOaWh+Wtl+mrmOS6rue7mOWItuagt+W8j1xuICAgICAgICAgICAgICogQG5hbWUgbW9kdWxlOnpyZW5kZXIvc2hhcGUvVGV4dCNoaWdobGlnaHRTdHlsZVxuICAgICAgICAgICAgICogQHR5cGUge21vZHVsZTp6cmVuZGVyL3NoYXBlL1RleHR+SVRleHRTdHlsZX1cbiAgICAgICAgICAgICAqL1xuICAgICAgICB9O1xuXG4gICAgICAgIFRleHQucHJvdG90eXBlID0gIHtcbiAgICAgICAgICAgIHR5cGU6ICd0ZXh0JyxcblxuICAgICAgICAgICAgYnJ1c2ggOiBmdW5jdGlvbiAoY3R4LCBpc0hpZ2hsaWdodCkge1xuICAgICAgICAgICAgICAgIHZhciBzdHlsZSA9IHRoaXMuc3R5bGU7XG4gICAgICAgICAgICAgICAgaWYgKGlzSGlnaGxpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOagueaNrnN0eWxl5omp5bGV6buY6K6k6auY5Lqu5qC35byPXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlID0gdGhpcy5nZXRIaWdobGlnaHRTdHlsZShcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlLCB0aGlzLmhpZ2hsaWdodFN0eWxlIHx8IHt9XG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Yoc3R5bGUudGV4dCkgPT0gJ3VuZGVmaW5lZCcgfHwgc3R5bGUudGV4dCA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGN0eC5zYXZlKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5kb0NsaXAoY3R4KTtcblxuICAgICAgICAgICAgICAgIHRoaXMuc2V0Q29udGV4dChjdHgsIHN0eWxlKTtcblxuICAgICAgICAgICAgICAgIC8vIOiuvue9rnRyYW5zZm9ybVxuICAgICAgICAgICAgICAgIHRoaXMuc2V0VHJhbnNmb3JtKGN0eCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoc3R5bGUudGV4dEZvbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmZvbnQgPSBzdHlsZS50ZXh0Rm9udDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY3R4LnRleHRBbGlnbiA9IHN0eWxlLnRleHRBbGlnbiB8fCAnc3RhcnQnO1xuICAgICAgICAgICAgICAgIGN0eC50ZXh0QmFzZWxpbmUgPSBzdHlsZS50ZXh0QmFzZWxpbmUgfHwgJ21pZGRsZSc7XG5cbiAgICAgICAgICAgICAgICB2YXIgdGV4dCA9IChzdHlsZS50ZXh0ICsgJycpLnNwbGl0KCdcXG4nKTtcbiAgICAgICAgICAgICAgICB2YXIgbGluZUhlaWdodCA9IGFyZWEuZ2V0VGV4dEhlaWdodCgn5Zu9Jywgc3R5bGUudGV4dEZvbnQpO1xuICAgICAgICAgICAgICAgIHZhciByZWN0ID0gdGhpcy5nZXRSZWN0KHN0eWxlKTtcbiAgICAgICAgICAgICAgICB2YXIgeCA9IHN0eWxlLng7XG4gICAgICAgICAgICAgICAgdmFyIHk7XG4gICAgICAgICAgICAgICAgaWYgKHN0eWxlLnRleHRCYXNlbGluZSA9PSAndG9wJykge1xuICAgICAgICAgICAgICAgICAgICB5ID0gcmVjdC55O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChzdHlsZS50ZXh0QmFzZWxpbmUgPT0gJ2JvdHRvbScpIHtcbiAgICAgICAgICAgICAgICAgICAgeSA9IHJlY3QueSArIGxpbmVIZWlnaHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB5ID0gcmVjdC55ICsgbGluZUhlaWdodCAvIDI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gdGV4dC5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0eWxlLm1heFdpZHRoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHN0eWxlLmJydXNoVHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2ZpbGwnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFRleHQoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0W2ldLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeCwgeSwgc3R5bGUubWF4V2lkdGhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnc3Ryb2tlJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3R4LnN0cm9rZVRleHQoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0W2ldLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeCwgeSwgc3R5bGUubWF4V2lkdGhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnYm90aCc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5maWxsVGV4dChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHRbaV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4LCB5LCBzdHlsZS5tYXhXaWR0aFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHguc3Ryb2tlVGV4dChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHRbaV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4LCB5LCBzdHlsZS5tYXhXaWR0aFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFRleHQoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0W2ldLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeCwgeSwgc3R5bGUubWF4V2lkdGhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoc3R5bGUuYnJ1c2hUeXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnZmlsbCc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5maWxsVGV4dCh0ZXh0W2ldLCB4LCB5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnc3Ryb2tlJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3R4LnN0cm9rZVRleHQodGV4dFtpXSwgeCwgeSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2JvdGgnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFRleHQodGV4dFtpXSwgeCwgeSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5zdHJva2VUZXh0KHRleHRbaV0sIHgsIHkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFRleHQodGV4dFtpXSwgeCwgeSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgeSArPSBsaW5lSGVpZ2h0O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGN0eC5yZXN0b3JlKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDov5Tlm57mloflrZfljIXlm7Tnm5Lnn6nlvaJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bW9kdWxlOnpyZW5kZXIvc2hhcGUvVGV4dH5JVGV4dFN0eWxlfSBzdHlsZVxuICAgICAgICAgICAgICogQHJldHVybiB7bW9kdWxlOnpyZW5kZXIvc2hhcGUvQmFzZX5JQm91bmRpbmdSZWN0fVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBnZXRSZWN0IDogZnVuY3Rpb24gKHN0eWxlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0eWxlLl9fcmVjdCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3R5bGUuX19yZWN0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB2YXIgd2lkdGggPSBhcmVhLmdldFRleHRXaWR0aChzdHlsZS50ZXh0LCBzdHlsZS50ZXh0Rm9udCk7XG4gICAgICAgICAgICAgICAgdmFyIGhlaWdodCA9IGFyZWEuZ2V0VGV4dEhlaWdodChzdHlsZS50ZXh0LCBzdHlsZS50ZXh0Rm9udCk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIHRleHRYID0gc3R5bGUueDsgICAgICAgICAgICAgICAgIC8vIOm7mOiupHN0YXJ0ID09IGxlZnRcbiAgICAgICAgICAgICAgICBpZiAoc3R5bGUudGV4dEFsaWduID09ICdlbmQnIHx8IHN0eWxlLnRleHRBbGlnbiA9PSAncmlnaHQnKSB7XG4gICAgICAgICAgICAgICAgICAgIHRleHRYIC09IHdpZHRoO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChzdHlsZS50ZXh0QWxpZ24gPT0gJ2NlbnRlcicpIHtcbiAgICAgICAgICAgICAgICAgICAgdGV4dFggLT0gKHdpZHRoIC8gMik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIHRleHRZO1xuICAgICAgICAgICAgICAgIGlmIChzdHlsZS50ZXh0QmFzZWxpbmUgPT0gJ3RvcCcpIHtcbiAgICAgICAgICAgICAgICAgICAgdGV4dFkgPSBzdHlsZS55O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChzdHlsZS50ZXh0QmFzZWxpbmUgPT0gJ2JvdHRvbScpIHtcbiAgICAgICAgICAgICAgICAgICAgdGV4dFkgPSBzdHlsZS55IC0gaGVpZ2h0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gbWlkZGxlXG4gICAgICAgICAgICAgICAgICAgIHRleHRZID0gc3R5bGUueSAtIGhlaWdodCAvIDI7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgc3R5bGUuX19yZWN0ID0ge1xuICAgICAgICAgICAgICAgICAgICB4IDogdGV4dFgsXG4gICAgICAgICAgICAgICAgICAgIHkgOiB0ZXh0WSxcbiAgICAgICAgICAgICAgICAgICAgd2lkdGggOiB3aWR0aCxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0IDogaGVpZ2h0XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gc3R5bGUuX19yZWN0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHJlcXVpcmUoJy4uL3Rvb2wvdXRpbCcpLmluaGVyaXRzKFRleHQsIEJhc2UpO1xuICAgICAgICByZXR1cm4gVGV4dDtcbiAgICB9XG4pO1xuXG4iXSwiZmlsZSI6InBsdWdpbnMvenJlbmRlci0yLjEuMC9zcmMvc2hhcGUvVGV4dC5qcyJ9
