/**
 * 矩形
 * @module zrender/shape/Rectangle
 * @author Kener (@Kener-林峰, kener.linfeng@gmail.com) , 
 *         strwind (@劲风FEI)
 * @example
 *     var Rectangle = require('zrender/shape/Rectangle');
 *     var shape = new Rectangle({
 *         style: {
 *             x: 0,
 *             y: 0,
 *             width: 100,
 *             height: 100,
 *             radius: 20
 *         }
 *     });
 *     zr.addShape(shape);
 */

/**
 * @typedef {Object} IRectangleStyle
 * @property {number} x 左上角x坐标
 * @property {number} y 左上角y坐标
 * @property {number} width 宽度
 * @property {number} height 高度
 * @property {number|Array.<number>} radius 矩形圆角，可以用数组分别指定四个角的圆角
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
        var Base = require('./Base');
        
        /**
         * @alias module:zrender/shape/Rectangle
         * @constructor
         * @extends module:zrender/shape/Base
         * @param {Object} options
         */
        var Rectangle = function (options) {
            Base.call(this, options);
            /**
             * 矩形绘制样式
             * @name module:zrender/shape/Rectangle#style
             * @type {module:zrender/shape/Rectangle~IRectangleStyle}
             */
            /**
             * 矩形高亮绘制样式
             * @name module:zrender/shape/Rectangle#highlightStyle
             * @type {module:zrender/shape/Rectangle~IRectangleStyle}
             */
        };

        Rectangle.prototype =  {
            type: 'rectangle',

            _buildRadiusPath: function (ctx, style) {
                // 左上、右上、右下、左下角的半径依次为r1、r2、r3、r4
                // r缩写为1         相当于 [1, 1, 1, 1]
                // r缩写为[1]       相当于 [1, 1, 1, 1]
                // r缩写为[1, 2]    相当于 [1, 2, 1, 2]
                // r缩写为[1, 2, 3] 相当于 [1, 2, 3, 2]
                var x = style.x;
                var y = style.y;
                var width = style.width;
                var height = style.height;
                var r = style.radius;
                var r1; 
                var r2; 
                var r3; 
                var r4;
                  
                if (typeof r === 'number') {
                    r1 = r2 = r3 = r4 = r;
                }
                else if (r instanceof Array) {
                    if (r.length === 1) {
                        r1 = r2 = r3 = r4 = r[0];
                    }
                    else if (r.length === 2) {
                        r1 = r3 = r[0];
                        r2 = r4 = r[1];
                    }
                    else if (r.length === 3) {
                        r1 = r[0];
                        r2 = r4 = r[1];
                        r3 = r[2];
                    }
                    else {
                        r1 = r[0];
                        r2 = r[1];
                        r3 = r[2];
                        r4 = r[3];
                    }
                }
                else {
                    r1 = r2 = r3 = r4 = 0;
                }
                
                var total;
                if (r1 + r2 > width) {
                    total = r1 + r2;
                    r1 *= width / total;
                    r2 *= width / total;
                }
                if (r3 + r4 > width) {
                    total = r3 + r4;
                    r3 *= width / total;
                    r4 *= width / total;
                }
                if (r2 + r3 > height) {
                    total = r2 + r3;
                    r2 *= height / total;
                    r3 *= height / total;
                }
                if (r1 + r4 > height) {
                    total = r1 + r4;
                    r1 *= height / total;
                    r4 *= height / total;
                }
                ctx.moveTo(x + r1, y);
                ctx.lineTo(x + width - r2, y);
                r2 !== 0 && ctx.quadraticCurveTo(
                    x + width, y, x + width, y + r2
                );
                ctx.lineTo(x + width, y + height - r3);
                r3 !== 0 && ctx.quadraticCurveTo(
                    x + width, y + height, x + width - r3, y + height
                );
                ctx.lineTo(x + r4, y + height);
                r4 !== 0 && ctx.quadraticCurveTo(
                    x, y + height, x, y + height - r4
                );
                ctx.lineTo(x, y + r1);
                r1 !== 0 && ctx.quadraticCurveTo(x, y, x + r1, y);
            },
            
            /**
             * 创建矩形路径
             * @param {CanvasRenderingContext2D} ctx
             * @param {Object} style
             */
            buildPath : function (ctx, style) {
                if (!style.radius) {
                    ctx.moveTo(style.x, style.y);
                    ctx.lineTo(style.x + style.width, style.y);
                    ctx.lineTo(style.x + style.width, style.y + style.height);
                    ctx.lineTo(style.x, style.y + style.height);
                    ctx.lineTo(style.x, style.y);
                    // ctx.rect(style.x, style.y, style.width, style.height);
                }
                else {
                    this._buildRadiusPath(ctx, style);
                }
                ctx.closePath();
                return;
            },

            /**
             * 计算返回矩形包围盒矩阵
             * @param {module:zrender/shape/Rectangle~IRectangleStyle} style
             * @return {module:zrender/shape/Base~IBoundingRect}
             */
            getRect : function(style) {
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
                    x : Math.round(style.x - lineWidth / 2),
                    y : Math.round(style.y - lineWidth / 2),
                    width : style.width + lineWidth,
                    height : style.height + lineWidth
                };
                
                return style.__rect;
            }
        };

        require('../tool/util').inherits(Rectangle, Base);
        return Rectangle;
    }
);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3NoYXBlL1JlY3RhbmdsZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIOefqeW9olxuICogQG1vZHVsZSB6cmVuZGVyL3NoYXBlL1JlY3RhbmdsZVxuICogQGF1dGhvciBLZW5lciAoQEtlbmVyLeael+WzsCwga2VuZXIubGluZmVuZ0BnbWFpbC5jb20pICwgXG4gKiAgICAgICAgIHN0cndpbmQgKEDlirLpo45GRUkpXG4gKiBAZXhhbXBsZVxuICogICAgIHZhciBSZWN0YW5nbGUgPSByZXF1aXJlKCd6cmVuZGVyL3NoYXBlL1JlY3RhbmdsZScpO1xuICogICAgIHZhciBzaGFwZSA9IG5ldyBSZWN0YW5nbGUoe1xuICogICAgICAgICBzdHlsZToge1xuICogICAgICAgICAgICAgeDogMCxcbiAqICAgICAgICAgICAgIHk6IDAsXG4gKiAgICAgICAgICAgICB3aWR0aDogMTAwLFxuICogICAgICAgICAgICAgaGVpZ2h0OiAxMDAsXG4gKiAgICAgICAgICAgICByYWRpdXM6IDIwXG4gKiAgICAgICAgIH1cbiAqICAgICB9KTtcbiAqICAgICB6ci5hZGRTaGFwZShzaGFwZSk7XG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBJUmVjdGFuZ2xlU3R5bGVcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB4IOW3puS4iuinknjlnZDmoIdcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB5IOW3puS4iuinknnlnZDmoIdcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB3aWR0aCDlrr3luqZcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBoZWlnaHQg6auY5bqmXG4gKiBAcHJvcGVydHkge251bWJlcnxBcnJheS48bnVtYmVyPn0gcmFkaXVzIOefqeW9ouWchuinku+8jOWPr+S7peeUqOaVsOe7hOWIhuWIq+aMh+WumuWbm+S4quinkueahOWchuinklxuICogQHByb3BlcnR5IHtzdHJpbmd9IFticnVzaFR5cGU9J2ZpbGwnXVxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtjb2xvcj0nIzAwMDAwMCddIOWhq+WFheminOiJslxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtzdHJva2VDb2xvcj0nIzAwMDAwMCddIOaPj+i+ueminOiJslxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtsaW5lQ2FwZT0nYnV0dCddIOe6v+W4veagt+W8j++8jOWPr+S7peaYryBidXR0LCByb3VuZCwgc3F1YXJlXG4gKiBAcHJvcGVydHkge251bWJlcn0gW2xpbmVXaWR0aD0xXSDmj4/ovrnlrr3luqZcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbb3BhY2l0eT0xXSDnu5jliLbpgI/mmI7luqZcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbc2hhZG93Qmx1cj0wXSDpmLTlvbHmqKHns4rluqbvvIzlpKfkuo4w5pyJ5pWIXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3NoYWRvd0NvbG9yPScjMDAwMDAwJ10g6Zi05b2x6aKc6ImyXG4gKiBAcHJvcGVydHkge251bWJlcn0gW3NoYWRvd09mZnNldFg9MF0g6Zi05b2x5qiq5ZCR5YGP56e7XG4gKiBAcHJvcGVydHkge251bWJlcn0gW3NoYWRvd09mZnNldFk9MF0g6Zi05b2x57q15ZCR5YGP56e7XG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRdIOWbvuW9ouS4reeahOmZhOWKoOaWh+acrFxuICogQHByb3BlcnR5IHtzdHJpbmd9IFt0ZXh0Q29sb3I9JyMwMDAwMDAnXSDmlofmnKzpopzoibJcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbdGV4dEZvbnRdIOmZhOWKoOaWh+acrOagt+W8j++8jGVnOidib2xkIDE4cHggdmVyZGFuYSdcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbdGV4dFBvc2l0aW9uPSdlbmQnXSDpmYTliqDmlofmnKzkvY3nva4sIOWPr+S7peaYryBpbnNpZGUsIGxlZnQsIHJpZ2h0LCB0b3AsIGJvdHRvbVxuICogQHByb3BlcnR5IHtzdHJpbmd9IFt0ZXh0QWxpZ25dIOm7mOiupOagueaNrnRleHRQb3NpdGlvbuiHquWKqOiuvue9ru+8jOmZhOWKoOaWh+acrOawtOW5s+Wvuem9kOOAglxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIOWPr+S7peaYr3N0YXJ0LCBlbmQsIGxlZnQsIHJpZ2h0LCBjZW50ZXJcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbdGV4dEJhc2VsaW5lXSDpu5jorqTmoLnmja50ZXh0UG9zaXRpb27oh6rliqjorr7nva7vvIzpmYTliqDmlofmnKzlnoLnm7Tlr7npvZDjgIJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDlj6/ku6XmmK90b3AsIGJvdHRvbSwgbWlkZGxlLCBhbHBoYWJldGljLCBoYW5naW5nLCBpZGVvZ3JhcGhpY1xuICovXG5kZWZpbmUoXG4gICAgZnVuY3Rpb24gKHJlcXVpcmUpIHtcbiAgICAgICAgdmFyIEJhc2UgPSByZXF1aXJlKCcuL0Jhc2UnKTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAYWxpYXMgbW9kdWxlOnpyZW5kZXIvc2hhcGUvUmVjdGFuZ2xlXG4gICAgICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAgICAgKiBAZXh0ZW5kcyBtb2R1bGU6enJlbmRlci9zaGFwZS9CYXNlXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gICAgICAgICAqL1xuICAgICAgICB2YXIgUmVjdGFuZ2xlID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIEJhc2UuY2FsbCh0aGlzLCBvcHRpb25zKTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog55+p5b2i57uY5Yi25qC35byPXG4gICAgICAgICAgICAgKiBAbmFtZSBtb2R1bGU6enJlbmRlci9zaGFwZS9SZWN0YW5nbGUjc3R5bGVcbiAgICAgICAgICAgICAqIEB0eXBlIHttb2R1bGU6enJlbmRlci9zaGFwZS9SZWN0YW5nbGV+SVJlY3RhbmdsZVN0eWxlfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOefqeW9oumrmOS6rue7mOWItuagt+W8j1xuICAgICAgICAgICAgICogQG5hbWUgbW9kdWxlOnpyZW5kZXIvc2hhcGUvUmVjdGFuZ2xlI2hpZ2hsaWdodFN0eWxlXG4gICAgICAgICAgICAgKiBAdHlwZSB7bW9kdWxlOnpyZW5kZXIvc2hhcGUvUmVjdGFuZ2xlfklSZWN0YW5nbGVTdHlsZX1cbiAgICAgICAgICAgICAqL1xuICAgICAgICB9O1xuXG4gICAgICAgIFJlY3RhbmdsZS5wcm90b3R5cGUgPSAge1xuICAgICAgICAgICAgdHlwZTogJ3JlY3RhbmdsZScsXG5cbiAgICAgICAgICAgIF9idWlsZFJhZGl1c1BhdGg6IGZ1bmN0aW9uIChjdHgsIHN0eWxlKSB7XG4gICAgICAgICAgICAgICAgLy8g5bem5LiK44CB5Y+z5LiK44CB5Y+z5LiL44CB5bem5LiL6KeS55qE5Y2K5b6E5L6d5qyh5Li6cjHjgIFyMuOAgXIz44CBcjRcbiAgICAgICAgICAgICAgICAvLyBy57yp5YaZ5Li6MSAgICAgICAgIOebuOW9k+S6jiBbMSwgMSwgMSwgMV1cbiAgICAgICAgICAgICAgICAvLyBy57yp5YaZ5Li6WzFdICAgICAgIOebuOW9k+S6jiBbMSwgMSwgMSwgMV1cbiAgICAgICAgICAgICAgICAvLyBy57yp5YaZ5Li6WzEsIDJdICAgIOebuOW9k+S6jiBbMSwgMiwgMSwgMl1cbiAgICAgICAgICAgICAgICAvLyBy57yp5YaZ5Li6WzEsIDIsIDNdIOebuOW9k+S6jiBbMSwgMiwgMywgMl1cbiAgICAgICAgICAgICAgICB2YXIgeCA9IHN0eWxlLng7XG4gICAgICAgICAgICAgICAgdmFyIHkgPSBzdHlsZS55O1xuICAgICAgICAgICAgICAgIHZhciB3aWR0aCA9IHN0eWxlLndpZHRoO1xuICAgICAgICAgICAgICAgIHZhciBoZWlnaHQgPSBzdHlsZS5oZWlnaHQ7XG4gICAgICAgICAgICAgICAgdmFyIHIgPSBzdHlsZS5yYWRpdXM7XG4gICAgICAgICAgICAgICAgdmFyIHIxOyBcbiAgICAgICAgICAgICAgICB2YXIgcjI7IFxuICAgICAgICAgICAgICAgIHZhciByMzsgXG4gICAgICAgICAgICAgICAgdmFyIHI0O1xuICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiByID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgICAgICAgICByMSA9IHIyID0gcjMgPSByNCA9IHI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHIgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoci5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHIxID0gcjIgPSByMyA9IHI0ID0gclswXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChyLmxlbmd0aCA9PT0gMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcjEgPSByMyA9IHJbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICByMiA9IHI0ID0gclsxXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChyLmxlbmd0aCA9PT0gMykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcjEgPSByWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgcjIgPSByNCA9IHJbMV07XG4gICAgICAgICAgICAgICAgICAgICAgICByMyA9IHJbMl07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByMSA9IHJbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICByMiA9IHJbMV07XG4gICAgICAgICAgICAgICAgICAgICAgICByMyA9IHJbMl07XG4gICAgICAgICAgICAgICAgICAgICAgICByNCA9IHJbM107XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHIxID0gcjIgPSByMyA9IHI0ID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIHRvdGFsO1xuICAgICAgICAgICAgICAgIGlmIChyMSArIHIyID4gd2lkdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgdG90YWwgPSByMSArIHIyO1xuICAgICAgICAgICAgICAgICAgICByMSAqPSB3aWR0aCAvIHRvdGFsO1xuICAgICAgICAgICAgICAgICAgICByMiAqPSB3aWR0aCAvIHRvdGFsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocjMgKyByNCA+IHdpZHRoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRvdGFsID0gcjMgKyByNDtcbiAgICAgICAgICAgICAgICAgICAgcjMgKj0gd2lkdGggLyB0b3RhbDtcbiAgICAgICAgICAgICAgICAgICAgcjQgKj0gd2lkdGggLyB0b3RhbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHIyICsgcjMgPiBoZWlnaHQpIHtcbiAgICAgICAgICAgICAgICAgICAgdG90YWwgPSByMiArIHIzO1xuICAgICAgICAgICAgICAgICAgICByMiAqPSBoZWlnaHQgLyB0b3RhbDtcbiAgICAgICAgICAgICAgICAgICAgcjMgKj0gaGVpZ2h0IC8gdG90YWw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChyMSArIHI0ID4gaGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRvdGFsID0gcjEgKyByNDtcbiAgICAgICAgICAgICAgICAgICAgcjEgKj0gaGVpZ2h0IC8gdG90YWw7XG4gICAgICAgICAgICAgICAgICAgIHI0ICo9IGhlaWdodCAvIHRvdGFsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjdHgubW92ZVRvKHggKyByMSwgeSk7XG4gICAgICAgICAgICAgICAgY3R4LmxpbmVUbyh4ICsgd2lkdGggLSByMiwgeSk7XG4gICAgICAgICAgICAgICAgcjIgIT09IDAgJiYgY3R4LnF1YWRyYXRpY0N1cnZlVG8oXG4gICAgICAgICAgICAgICAgICAgIHggKyB3aWR0aCwgeSwgeCArIHdpZHRoLCB5ICsgcjJcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGN0eC5saW5lVG8oeCArIHdpZHRoLCB5ICsgaGVpZ2h0IC0gcjMpO1xuICAgICAgICAgICAgICAgIHIzICE9PSAwICYmIGN0eC5xdWFkcmF0aWNDdXJ2ZVRvKFxuICAgICAgICAgICAgICAgICAgICB4ICsgd2lkdGgsIHkgKyBoZWlnaHQsIHggKyB3aWR0aCAtIHIzLCB5ICsgaGVpZ2h0XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBjdHgubGluZVRvKHggKyByNCwgeSArIGhlaWdodCk7XG4gICAgICAgICAgICAgICAgcjQgIT09IDAgJiYgY3R4LnF1YWRyYXRpY0N1cnZlVG8oXG4gICAgICAgICAgICAgICAgICAgIHgsIHkgKyBoZWlnaHQsIHgsIHkgKyBoZWlnaHQgLSByNFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgY3R4LmxpbmVUbyh4LCB5ICsgcjEpO1xuICAgICAgICAgICAgICAgIHIxICE9PSAwICYmIGN0eC5xdWFkcmF0aWNDdXJ2ZVRvKHgsIHksIHggKyByMSwgeSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOWIm+W7uuefqeW9oui3r+W+hFxuICAgICAgICAgICAgICogQHBhcmFtIHtDYW52YXNSZW5kZXJpbmdDb250ZXh0MkR9IGN0eFxuICAgICAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IHN0eWxlXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGJ1aWxkUGF0aCA6IGZ1bmN0aW9uIChjdHgsIHN0eWxlKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFzdHlsZS5yYWRpdXMpIHtcbiAgICAgICAgICAgICAgICAgICAgY3R4Lm1vdmVUbyhzdHlsZS54LCBzdHlsZS55KTtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmxpbmVUbyhzdHlsZS54ICsgc3R5bGUud2lkdGgsIHN0eWxlLnkpO1xuICAgICAgICAgICAgICAgICAgICBjdHgubGluZVRvKHN0eWxlLnggKyBzdHlsZS53aWR0aCwgc3R5bGUueSArIHN0eWxlLmhlaWdodCk7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5saW5lVG8oc3R5bGUueCwgc3R5bGUueSArIHN0eWxlLmhlaWdodCk7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5saW5lVG8oc3R5bGUueCwgc3R5bGUueSk7XG4gICAgICAgICAgICAgICAgICAgIC8vIGN0eC5yZWN0KHN0eWxlLngsIHN0eWxlLnksIHN0eWxlLndpZHRoLCBzdHlsZS5oZWlnaHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYnVpbGRSYWRpdXNQYXRoKGN0eCwgc3R5bGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjdHguY2xvc2VQYXRoKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDorqHnrpfov5Tlm57nn6nlvaLljIXlm7Tnm5Lnn6npmLVcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bW9kdWxlOnpyZW5kZXIvc2hhcGUvUmVjdGFuZ2xlfklSZWN0YW5nbGVTdHlsZX0gc3R5bGVcbiAgICAgICAgICAgICAqIEByZXR1cm4ge21vZHVsZTp6cmVuZGVyL3NoYXBlL0Jhc2V+SUJvdW5kaW5nUmVjdH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZ2V0UmVjdCA6IGZ1bmN0aW9uKHN0eWxlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0eWxlLl9fcmVjdCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3R5bGUuX19yZWN0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB2YXIgbGluZVdpZHRoO1xuICAgICAgICAgICAgICAgIGlmIChzdHlsZS5icnVzaFR5cGUgPT0gJ3N0cm9rZScgfHwgc3R5bGUuYnJ1c2hUeXBlID09ICdmaWxsJykge1xuICAgICAgICAgICAgICAgICAgICBsaW5lV2lkdGggPSBzdHlsZS5saW5lV2lkdGggfHwgMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGxpbmVXaWR0aCA9IDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHN0eWxlLl9fcmVjdCA9IHtcbiAgICAgICAgICAgICAgICAgICAgeCA6IE1hdGgucm91bmQoc3R5bGUueCAtIGxpbmVXaWR0aCAvIDIpLFxuICAgICAgICAgICAgICAgICAgICB5IDogTWF0aC5yb3VuZChzdHlsZS55IC0gbGluZVdpZHRoIC8gMiksXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoIDogc3R5bGUud2lkdGggKyBsaW5lV2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodCA6IHN0eWxlLmhlaWdodCArIGxpbmVXaWR0aFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0eWxlLl9fcmVjdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICByZXF1aXJlKCcuLi90b29sL3V0aWwnKS5pbmhlcml0cyhSZWN0YW5nbGUsIEJhc2UpO1xuICAgICAgICByZXR1cm4gUmVjdGFuZ2xlO1xuICAgIH1cbik7XG4iXSwiZmlsZSI6InBsdWdpbnMvenJlbmRlci0yLjEuMC9zcmMvc2hhcGUvUmVjdGFuZ2xlLmpzIn0=
