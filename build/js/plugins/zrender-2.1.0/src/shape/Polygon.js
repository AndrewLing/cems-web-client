/**
 * 多边形
 * @module zrender/shape/Polygon
 * @author Kener (@Kener-林峰, kener.linfeng@gmail.com)
 * @example
 *     var Polygon = require('zrender/shape/Polygon');
 *     var shape = new Polygon({
 *         style: {
 *             // 100x100的正方形
 *             pointList: [[0, 0], [100, 0], [100, 100], [0, 100]],
 *             color: 'blue'
 *         }
 *     });
 *     zr.addShape(shape);
 */

/**
 * @typedef {Object} IPolygonStyle
 * @property {string} pointList 多边形顶点数组
 * @property {string} [smooth=''] 是否做平滑插值, 平滑算法可以选择 bezier, spline
 * @property {number} [smoothConstraint] 平滑约束
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
        var smoothSpline = require('./util/smoothSpline');
        var smoothBezier = require('./util/smoothBezier');
        var dashedLineTo = require('./util/dashedLineTo');

        /**
         * @alias module:zrender/shape/Polygon
         * @param {Object} options
         * @constructor
         * @extends module:zrender/shape/Base
         */
        var Polygon = function (options) {
            Base.call(this, options);
            /**
             * 多边形绘制样式
             * @name module:zrender/shape/Polygon#style
             * @type {module:zrender/shape/Polygon~IPolygonStyle}
             */
            /**
             * 多边形高亮绘制样式
             * @name module:zrender/shape/Polygon#highlightStyle
             * @type {module:zrender/shape/Polygon~IPolygonStyle}
             */
        };

        Polygon.prototype = {
            type: 'polygon',

            /**
             * 创建多边形路径
             * @param {CanvasRenderingContext2D} ctx
             * @param {module:zrender/shape/Polygon~IPolygonStyle} style
             */
            buildPath : function (ctx, style) {
                // 虽然能重用brokenLine，但底层图形基于性能考虑，重复代码减少调用吧
                var pointList = style.pointList;
                // 开始点和结束点重复
                /*
                var start = pointList[0];
                var end = pointList[pointList.length-1];

                if (start && end) {
                    if (start[0] == end[0] &&
                        start[1] == end[1]) {
                        // 移除最后一个点
                        pointList.pop();
                    }
                }
                */

                if (pointList.length < 2) {
                    // 少于2个点就不画了~
                    return;
                }

                if (style.smooth && style.smooth !== 'spline') {
                    var controlPoints = smoothBezier(
                        pointList, style.smooth, true, style.smoothConstraint
                    );

                    ctx.moveTo(pointList[0][0], pointList[0][1]);
                    var cp1;
                    var cp2;
                    var p;
                    var len = pointList.length;
                    for (var i = 0; i < len; i++) {
                        cp1 = controlPoints[i * 2];
                        cp2 = controlPoints[i * 2 + 1];
                        p = pointList[(i + 1) % len];
                        ctx.bezierCurveTo(
                            cp1[0], cp1[1], cp2[0], cp2[1], p[0], p[1]
                        );
                    }
                } 
                else {
                    if (style.smooth === 'spline') {
                        pointList = smoothSpline(pointList, true);
                    }

                    if (!style.lineType || style.lineType == 'solid') {
                        // 默认为实线
                        ctx.moveTo(pointList[0][0], pointList[0][1]);
                        for (var i = 1, l = pointList.length; i < l; i++) {
                            ctx.lineTo(pointList[i][0], pointList[i][1]);
                        }
                        ctx.lineTo(pointList[0][0], pointList[0][1]);
                    }
                    else if (style.lineType == 'dashed'
                            || style.lineType == 'dotted'
                    ) {
                        var dashLength = 
                            style._dashLength
                            || (style.lineWidth || 1) 
                               * (style.lineType == 'dashed' ? 5 : 1);
                        style._dashLength = dashLength;
                        ctx.moveTo(pointList[0][0], pointList[0][1]);
                        for (var i = 1, l = pointList.length; i < l; i++) {
                            dashedLineTo(
                                ctx,
                                pointList[i - 1][0], pointList[i - 1][1],
                                pointList[i][0], pointList[i][1],
                                dashLength
                            );
                        }
                        dashedLineTo(
                            ctx,
                            pointList[pointList.length - 1][0], 
                            pointList[pointList.length - 1][1],
                            pointList[0][0],
                            pointList[0][1],
                            dashLength
                        );
                    }
                }

                ctx.closePath();
                return;
            },

            /**
             * 计算返回多边形包围盒矩阵
             * @param {module:zrender/shape/Polygon~IPolygonStyle} style
             * @return {module:zrender/shape/Base~IBoundingRect}
             */
            getRect : function (style) {
                if (style.__rect) {
                    return style.__rect;
                }
                
                var minX =  Number.MAX_VALUE;
                var maxX =  Number.MIN_VALUE;
                var minY = Number.MAX_VALUE;
                var maxY = Number.MIN_VALUE;

                var pointList = style.pointList;
                for (var i = 0, l = pointList.length; i < l; i++) {
                    if (pointList[i][0] < minX) {
                        minX = pointList[i][0];
                    }
                    if (pointList[i][0] > maxX) {
                        maxX = pointList[i][0];
                    }
                    if (pointList[i][1] < minY) {
                        minY = pointList[i][1];
                    }
                    if (pointList[i][1] > maxY) {
                        maxY = pointList[i][1];
                    }
                }

                var lineWidth;
                if (style.brushType == 'stroke' || style.brushType == 'fill') {
                    lineWidth = style.lineWidth || 1;
                }
                else {
                    lineWidth = 0;
                }
                
                style.__rect = {
                    x : Math.round(minX - lineWidth / 2),
                    y : Math.round(minY - lineWidth / 2),
                    width : maxX - minX + lineWidth,
                    height : maxY - minY + lineWidth
                };
                return style.__rect;
            }
        };

        require('../tool/util').inherits(Polygon, Base);
        return Polygon;
    }
);


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3NoYXBlL1BvbHlnb24uanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiDlpJrovrnlvaJcbiAqIEBtb2R1bGUgenJlbmRlci9zaGFwZS9Qb2x5Z29uXG4gKiBAYXV0aG9yIEtlbmVyIChAS2VuZXIt5p6X5bOwLCBrZW5lci5saW5mZW5nQGdtYWlsLmNvbSlcbiAqIEBleGFtcGxlXG4gKiAgICAgdmFyIFBvbHlnb24gPSByZXF1aXJlKCd6cmVuZGVyL3NoYXBlL1BvbHlnb24nKTtcbiAqICAgICB2YXIgc2hhcGUgPSBuZXcgUG9seWdvbih7XG4gKiAgICAgICAgIHN0eWxlOiB7XG4gKiAgICAgICAgICAgICAvLyAxMDB4MTAw55qE5q2j5pa55b2iXG4gKiAgICAgICAgICAgICBwb2ludExpc3Q6IFtbMCwgMF0sIFsxMDAsIDBdLCBbMTAwLCAxMDBdLCBbMCwgMTAwXV0sXG4gKiAgICAgICAgICAgICBjb2xvcjogJ2JsdWUnXG4gKiAgICAgICAgIH1cbiAqICAgICB9KTtcbiAqICAgICB6ci5hZGRTaGFwZShzaGFwZSk7XG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBJUG9seWdvblN0eWxlXG4gKiBAcHJvcGVydHkge3N0cmluZ30gcG9pbnRMaXN0IOWkmui+ueW9oumhtueCueaVsOe7hFxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtzbW9vdGg9JyddIOaYr+WQpuWBmuW5s+a7keaPkuWAvCwg5bmz5ruR566X5rOV5Y+v5Lul6YCJ5oupIGJlemllciwgc3BsaW5lXG4gKiBAcHJvcGVydHkge251bWJlcn0gW3Ntb290aENvbnN0cmFpbnRdIOW5s+a7kee6puadn1xuICogQHByb3BlcnR5IHtzdHJpbmd9IFticnVzaFR5cGU9J2ZpbGwnXVxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtjb2xvcj0nIzAwMDAwMCddIOWhq+WFheminOiJslxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtzdHJva2VDb2xvcj0nIzAwMDAwMCddIOaPj+i+ueminOiJslxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtsaW5lQ2FwZT0nYnV0dCddIOe6v+W4veagt+W8j++8jOWPr+S7peaYryBidXR0LCByb3VuZCwgc3F1YXJlXG4gKiBAcHJvcGVydHkge251bWJlcn0gW2xpbmVXaWR0aD0xXSDmj4/ovrnlrr3luqZcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbb3BhY2l0eT0xXSDnu5jliLbpgI/mmI7luqZcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbc2hhZG93Qmx1cj0wXSDpmLTlvbHmqKHns4rluqbvvIzlpKfkuo4w5pyJ5pWIXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3NoYWRvd0NvbG9yPScjMDAwMDAwJ10g6Zi05b2x6aKc6ImyXG4gKiBAcHJvcGVydHkge251bWJlcn0gW3NoYWRvd09mZnNldFg9MF0g6Zi05b2x5qiq5ZCR5YGP56e7XG4gKiBAcHJvcGVydHkge251bWJlcn0gW3NoYWRvd09mZnNldFk9MF0g6Zi05b2x57q15ZCR5YGP56e7XG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRdIOWbvuW9ouS4reeahOmZhOWKoOaWh+acrFxuICogQHByb3BlcnR5IHtzdHJpbmd9IFt0ZXh0Q29sb3I9JyMwMDAwMDAnXSDmlofmnKzpopzoibJcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbdGV4dEZvbnRdIOmZhOWKoOaWh+acrOagt+W8j++8jGVnOidib2xkIDE4cHggdmVyZGFuYSdcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbdGV4dFBvc2l0aW9uPSdlbmQnXSDpmYTliqDmlofmnKzkvY3nva4sIOWPr+S7peaYryBpbnNpZGUsIGxlZnQsIHJpZ2h0LCB0b3AsIGJvdHRvbVxuICogQHByb3BlcnR5IHtzdHJpbmd9IFt0ZXh0QWxpZ25dIOm7mOiupOagueaNrnRleHRQb3NpdGlvbuiHquWKqOiuvue9ru+8jOmZhOWKoOaWh+acrOawtOW5s+Wvuem9kOOAglxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIOWPr+S7peaYr3N0YXJ0LCBlbmQsIGxlZnQsIHJpZ2h0LCBjZW50ZXJcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbdGV4dEJhc2VsaW5lXSDpu5jorqTmoLnmja50ZXh0UG9zaXRpb27oh6rliqjorr7nva7vvIzpmYTliqDmlofmnKzlnoLnm7Tlr7npvZDjgIJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDlj6/ku6XmmK90b3AsIGJvdHRvbSwgbWlkZGxlLCBhbHBoYWJldGljLCBoYW5naW5nLCBpZGVvZ3JhcGhpY1xuICovXG5kZWZpbmUoXG4gICAgZnVuY3Rpb24gKHJlcXVpcmUpIHtcbiAgICAgICAgdmFyIEJhc2UgPSByZXF1aXJlKCcuL0Jhc2UnKTtcbiAgICAgICAgdmFyIHNtb290aFNwbGluZSA9IHJlcXVpcmUoJy4vdXRpbC9zbW9vdGhTcGxpbmUnKTtcbiAgICAgICAgdmFyIHNtb290aEJlemllciA9IHJlcXVpcmUoJy4vdXRpbC9zbW9vdGhCZXppZXInKTtcbiAgICAgICAgdmFyIGRhc2hlZExpbmVUbyA9IHJlcXVpcmUoJy4vdXRpbC9kYXNoZWRMaW5lVG8nKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQGFsaWFzIG1vZHVsZTp6cmVuZGVyL3NoYXBlL1BvbHlnb25cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAgICAgICAgICogQGNvbnN0cnVjdG9yXG4gICAgICAgICAqIEBleHRlbmRzIG1vZHVsZTp6cmVuZGVyL3NoYXBlL0Jhc2VcbiAgICAgICAgICovXG4gICAgICAgIHZhciBQb2x5Z29uID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIEJhc2UuY2FsbCh0aGlzLCBvcHRpb25zKTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5aSa6L655b2i57uY5Yi25qC35byPXG4gICAgICAgICAgICAgKiBAbmFtZSBtb2R1bGU6enJlbmRlci9zaGFwZS9Qb2x5Z29uI3N0eWxlXG4gICAgICAgICAgICAgKiBAdHlwZSB7bW9kdWxlOnpyZW5kZXIvc2hhcGUvUG9seWdvbn5JUG9seWdvblN0eWxlfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOWkmui+ueW9oumrmOS6rue7mOWItuagt+W8j1xuICAgICAgICAgICAgICogQG5hbWUgbW9kdWxlOnpyZW5kZXIvc2hhcGUvUG9seWdvbiNoaWdobGlnaHRTdHlsZVxuICAgICAgICAgICAgICogQHR5cGUge21vZHVsZTp6cmVuZGVyL3NoYXBlL1BvbHlnb25+SVBvbHlnb25TdHlsZX1cbiAgICAgICAgICAgICAqL1xuICAgICAgICB9O1xuXG4gICAgICAgIFBvbHlnb24ucHJvdG90eXBlID0ge1xuICAgICAgICAgICAgdHlwZTogJ3BvbHlnb24nLFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOWIm+W7uuWkmui+ueW9oui3r+W+hFxuICAgICAgICAgICAgICogQHBhcmFtIHtDYW52YXNSZW5kZXJpbmdDb250ZXh0MkR9IGN0eFxuICAgICAgICAgICAgICogQHBhcmFtIHttb2R1bGU6enJlbmRlci9zaGFwZS9Qb2x5Z29ufklQb2x5Z29uU3R5bGV9IHN0eWxlXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGJ1aWxkUGF0aCA6IGZ1bmN0aW9uIChjdHgsIHN0eWxlKSB7XG4gICAgICAgICAgICAgICAgLy8g6Jm954S26IO96YeN55SoYnJva2VuTGluZe+8jOS9huW6leWxguWbvuW9ouWfuuS6juaAp+iDveiAg+iZke+8jOmHjeWkjeS7o+eggeWHj+Wwkeiwg+eUqOWQp1xuICAgICAgICAgICAgICAgIHZhciBwb2ludExpc3QgPSBzdHlsZS5wb2ludExpc3Q7XG4gICAgICAgICAgICAgICAgLy8g5byA5aeL54K55ZKM57uT5p2f54K56YeN5aSNXG4gICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICB2YXIgc3RhcnQgPSBwb2ludExpc3RbMF07XG4gICAgICAgICAgICAgICAgdmFyIGVuZCA9IHBvaW50TGlzdFtwb2ludExpc3QubGVuZ3RoLTFdO1xuXG4gICAgICAgICAgICAgICAgaWYgKHN0YXJ0ICYmIGVuZCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3RhcnRbMF0gPT0gZW5kWzBdICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydFsxXSA9PSBlbmRbMV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOenu+mZpOacgOWQjuS4gOS4queCuVxuICAgICAgICAgICAgICAgICAgICAgICAgcG9pbnRMaXN0LnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICovXG5cbiAgICAgICAgICAgICAgICBpZiAocG9pbnRMaXN0Lmxlbmd0aCA8IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5bCR5LqOMuS4queCueWwseS4jeeUu+S6hn5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChzdHlsZS5zbW9vdGggJiYgc3R5bGUuc21vb3RoICE9PSAnc3BsaW5lJykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY29udHJvbFBvaW50cyA9IHNtb290aEJlemllcihcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvaW50TGlzdCwgc3R5bGUuc21vb3RoLCB0cnVlLCBzdHlsZS5zbW9vdGhDb25zdHJhaW50XG4gICAgICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICAgICAgY3R4Lm1vdmVUbyhwb2ludExpc3RbMF1bMF0sIHBvaW50TGlzdFswXVsxXSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjcDE7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjcDI7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbGVuID0gcG9pbnRMaXN0Lmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3AxID0gY29udHJvbFBvaW50c1tpICogMl07XG4gICAgICAgICAgICAgICAgICAgICAgICBjcDIgPSBjb250cm9sUG9pbnRzW2kgKiAyICsgMV07XG4gICAgICAgICAgICAgICAgICAgICAgICBwID0gcG9pbnRMaXN0WyhpICsgMSkgJSBsZW5dO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8oXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3AxWzBdLCBjcDFbMV0sIGNwMlswXSwgY3AyWzFdLCBwWzBdLCBwWzFdXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBcbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0eWxlLnNtb290aCA9PT0gJ3NwbGluZScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvaW50TGlzdCA9IHNtb290aFNwbGluZShwb2ludExpc3QsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFzdHlsZS5saW5lVHlwZSB8fCBzdHlsZS5saW5lVHlwZSA9PSAnc29saWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDpu5jorqTkuLrlrp7nur9cbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5tb3ZlVG8ocG9pbnRMaXN0WzBdWzBdLCBwb2ludExpc3RbMF1bMV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDEsIGwgPSBwb2ludExpc3QubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3R4LmxpbmVUbyhwb2ludExpc3RbaV1bMF0sIHBvaW50TGlzdFtpXVsxXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHgubGluZVRvKHBvaW50TGlzdFswXVswXSwgcG9pbnRMaXN0WzBdWzFdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChzdHlsZS5saW5lVHlwZSA9PSAnZGFzaGVkJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHx8IHN0eWxlLmxpbmVUeXBlID09ICdkb3R0ZWQnXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRhc2hMZW5ndGggPSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZS5fZGFzaExlbmd0aFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHx8IChzdHlsZS5saW5lV2lkdGggfHwgMSkgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiAoc3R5bGUubGluZVR5cGUgPT0gJ2Rhc2hlZCcgPyA1IDogMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdHlsZS5fZGFzaExlbmd0aCA9IGRhc2hMZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHgubW92ZVRvKHBvaW50TGlzdFswXVswXSwgcG9pbnRMaXN0WzBdWzFdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAxLCBsID0gcG9pbnRMaXN0Lmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhc2hlZExpbmVUbyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3R4LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb2ludExpc3RbaSAtIDFdWzBdLCBwb2ludExpc3RbaSAtIDFdWzFdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb2ludExpc3RbaV1bMF0sIHBvaW50TGlzdFtpXVsxXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGFzaExlbmd0aFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBkYXNoZWRMaW5lVG8oXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3R4LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvaW50TGlzdFtwb2ludExpc3QubGVuZ3RoIC0gMV1bMF0sIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvaW50TGlzdFtwb2ludExpc3QubGVuZ3RoIC0gMV1bMV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9pbnRMaXN0WzBdWzBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvaW50TGlzdFswXVsxXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXNoTGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY3R4LmNsb3NlUGF0aCgpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog6K6h566X6L+U5Zue5aSa6L655b2i5YyF5Zu055uS55+p6Zi1XG4gICAgICAgICAgICAgKiBAcGFyYW0ge21vZHVsZTp6cmVuZGVyL3NoYXBlL1BvbHlnb25+SVBvbHlnb25TdHlsZX0gc3R5bGVcbiAgICAgICAgICAgICAqIEByZXR1cm4ge21vZHVsZTp6cmVuZGVyL3NoYXBlL0Jhc2V+SUJvdW5kaW5nUmVjdH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZ2V0UmVjdCA6IGZ1bmN0aW9uIChzdHlsZSkge1xuICAgICAgICAgICAgICAgIGlmIChzdHlsZS5fX3JlY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN0eWxlLl9fcmVjdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIG1pblggPSAgTnVtYmVyLk1BWF9WQUxVRTtcbiAgICAgICAgICAgICAgICB2YXIgbWF4WCA9ICBOdW1iZXIuTUlOX1ZBTFVFO1xuICAgICAgICAgICAgICAgIHZhciBtaW5ZID0gTnVtYmVyLk1BWF9WQUxVRTtcbiAgICAgICAgICAgICAgICB2YXIgbWF4WSA9IE51bWJlci5NSU5fVkFMVUU7XG5cbiAgICAgICAgICAgICAgICB2YXIgcG9pbnRMaXN0ID0gc3R5bGUucG9pbnRMaXN0O1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gcG9pbnRMaXN0Lmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAocG9pbnRMaXN0W2ldWzBdIDwgbWluWCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWluWCA9IHBvaW50TGlzdFtpXVswXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAocG9pbnRMaXN0W2ldWzBdID4gbWF4WCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWF4WCA9IHBvaW50TGlzdFtpXVswXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAocG9pbnRMaXN0W2ldWzFdIDwgbWluWSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWluWSA9IHBvaW50TGlzdFtpXVsxXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAocG9pbnRMaXN0W2ldWzFdID4gbWF4WSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWF4WSA9IHBvaW50TGlzdFtpXVsxXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBsaW5lV2lkdGg7XG4gICAgICAgICAgICAgICAgaWYgKHN0eWxlLmJydXNoVHlwZSA9PSAnc3Ryb2tlJyB8fCBzdHlsZS5icnVzaFR5cGUgPT0gJ2ZpbGwnKSB7XG4gICAgICAgICAgICAgICAgICAgIGxpbmVXaWR0aCA9IHN0eWxlLmxpbmVXaWR0aCB8fCAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbGluZVdpZHRoID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgc3R5bGUuX19yZWN0ID0ge1xuICAgICAgICAgICAgICAgICAgICB4IDogTWF0aC5yb3VuZChtaW5YIC0gbGluZVdpZHRoIC8gMiksXG4gICAgICAgICAgICAgICAgICAgIHkgOiBNYXRoLnJvdW5kKG1pblkgLSBsaW5lV2lkdGggLyAyKSxcbiAgICAgICAgICAgICAgICAgICAgd2lkdGggOiBtYXhYIC0gbWluWCArIGxpbmVXaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0IDogbWF4WSAtIG1pblkgKyBsaW5lV2lkdGhcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJldHVybiBzdHlsZS5fX3JlY3Q7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgcmVxdWlyZSgnLi4vdG9vbC91dGlsJykuaW5oZXJpdHMoUG9seWdvbiwgQmFzZSk7XG4gICAgICAgIHJldHVybiBQb2x5Z29uO1xuICAgIH1cbik7XG5cbiJdLCJmaWxlIjoicGx1Z2lucy96cmVuZGVyLTIuMS4wL3NyYy9zaGFwZS9Qb2x5Z29uLmpzIn0=
