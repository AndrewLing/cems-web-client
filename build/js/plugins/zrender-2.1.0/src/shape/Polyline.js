/**
 * 折线
 * @author Kener (@Kener-林峰, kener.linfeng@gmail.com)
 * @module zrender/shape/Polyline
 * @example
 *     var Polyline = require('zrender/shape/Polyline');
 *     var shape = new Polyline({
 *         style: {
 *             pointList: [[0, 0], [100, 100], [100, 0]],
 *             smooth: 'bezier',
 *             strokeColor: 'purple'
 *         }
 *     });
 *     zr.addShape(shape);
 */

/**
 * @typedef {Object} IPolylineStyle
 * @property {Array.<number>} pointList 顶点坐标数组
 * @property {string|number} [smooth=''] 是否做平滑插值, 平滑算法可以选择 bezier, spline
 * @property {number} [smoothConstraint] 平滑约束
 * @property {string} [strokeColor='#000000'] 描边颜色
 * @property {string} [lineCape='butt'] 线帽样式，可以是 butt, round, square
 * @property {string} [lineJoin='miter'] 线段连接样式，可以是 miter, round, bevel
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
         * @alias module:zrender/shape/Polyline
         * @constructor
         * @extends module:zrender/shape/Base
         * @param {Object} options
         */
        var Polyline = function(options) {
            this.brushTypeOnly = 'stroke';  // 线条只能描边，填充后果自负
            this.textPosition = 'end';
            Base.call(this, options);
            /**
             * 贝赛尔曲线绘制样式
             * @name module:zrender/shape/Polyline#style
             * @type {module:zrender/shape/Polyline~IPolylineStyle}
             */
            /**
             * 贝赛尔曲线高亮绘制样式
             * @name module:zrender/shape/Polyline#highlightStyle
             * @type {module:zrender/shape/Polyline~IPolylineStyle}
             */
        };

        Polyline.prototype =  {
            type: 'polyline',

            /**
             * 创建多边形路径
             * @param {CanvasRenderingContext2D} ctx
             * @param {module:zrender/shape/Polyline~IPolylineStyle} style
             */
            buildPath : function(ctx, style) {
                var pointList = style.pointList;
                if (pointList.length < 2) {
                    // 少于2个点就不画了~
                    return;
                }
                
                var len = Math.min(
                    style.pointList.length, 
                    Math.round(style.pointListLength || style.pointList.length)
                );
                
                if (style.smooth && style.smooth !== 'spline') {
                    if (! style.controlPointList) {
                        this.updateControlPoints(style);
                    }
                    var controlPointList = style.controlPointList;

                    ctx.moveTo(pointList[0][0], pointList[0][1]);
                    var cp1;
                    var cp2;
                    var p;
                    for (var i = 0; i < len - 1; i++) {
                        cp1 = controlPointList[i * 2];
                        cp2 = controlPointList[i * 2 + 1];
                        p = pointList[i + 1];
                        ctx.bezierCurveTo(
                            cp1[0], cp1[1], cp2[0], cp2[1], p[0], p[1]
                        );
                    }
                }
                else {
                    if (style.smooth === 'spline') {
                        pointList = smoothSpline(pointList);
                        len = pointList.length;
                    }
                    if (!style.lineType || style.lineType == 'solid') {
                        // 默认为实线
                        ctx.moveTo(pointList[0][0], pointList[0][1]);
                        for (var i = 1; i < len; i++) {
                            ctx.lineTo(pointList[i][0], pointList[i][1]);
                        }
                    }
                    else if (style.lineType == 'dashed'
                            || style.lineType == 'dotted'
                    ) {
                        var dashLength = (style.lineWidth || 1) 
                                         * (style.lineType == 'dashed' ? 5 : 1);
                        ctx.moveTo(pointList[0][0], pointList[0][1]);
                        for (var i = 1; i < len; i++) {
                            dashedLineTo(
                                ctx,
                                pointList[i - 1][0], pointList[i - 1][1],
                                pointList[i][0], pointList[i][1],
                                dashLength
                            );
                        }
                    }
                }
                return;
            },

            updateControlPoints: function (style) {
                style.controlPointList = smoothBezier(
                    style.pointList, style.smooth, false, style.smoothConstraint
                );
            },

            /**
             * 计算返回折线包围盒矩形。
             * @param {IZRenderBezierCurveStyle} style
             * @return {module:zrender/shape/Base~IBoundingRect}
             */
            getRect : function(style) {
                return require('./Polygon').prototype.getRect(style);
            }
        };

        require('../tool/util').inherits(Polyline, Base);
        return Polyline;
    }
);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3NoYXBlL1BvbHlsaW5lLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICog5oqY57q/XG4gKiBAYXV0aG9yIEtlbmVyIChAS2VuZXIt5p6X5bOwLCBrZW5lci5saW5mZW5nQGdtYWlsLmNvbSlcbiAqIEBtb2R1bGUgenJlbmRlci9zaGFwZS9Qb2x5bGluZVxuICogQGV4YW1wbGVcbiAqICAgICB2YXIgUG9seWxpbmUgPSByZXF1aXJlKCd6cmVuZGVyL3NoYXBlL1BvbHlsaW5lJyk7XG4gKiAgICAgdmFyIHNoYXBlID0gbmV3IFBvbHlsaW5lKHtcbiAqICAgICAgICAgc3R5bGU6IHtcbiAqICAgICAgICAgICAgIHBvaW50TGlzdDogW1swLCAwXSwgWzEwMCwgMTAwXSwgWzEwMCwgMF1dLFxuICogICAgICAgICAgICAgc21vb3RoOiAnYmV6aWVyJyxcbiAqICAgICAgICAgICAgIHN0cm9rZUNvbG9yOiAncHVycGxlJ1xuICogICAgICAgICB9XG4gKiAgICAgfSk7XG4gKiAgICAgenIuYWRkU2hhcGUoc2hhcGUpO1xuICovXG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gSVBvbHlsaW5lU3R5bGVcbiAqIEBwcm9wZXJ0eSB7QXJyYXkuPG51bWJlcj59IHBvaW50TGlzdCDpobbngrnlnZDmoIfmlbDnu4RcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfG51bWJlcn0gW3Ntb290aD0nJ10g5piv5ZCm5YGa5bmz5ruR5o+S5YC8LCDlubPmu5Hnrpfms5Xlj6/ku6XpgInmi6kgYmV6aWVyLCBzcGxpbmVcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbc21vb3RoQ29uc3RyYWludF0g5bmz5ruR57qm5p2fXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3N0cm9rZUNvbG9yPScjMDAwMDAwJ10g5o+P6L656aKc6ImyXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW2xpbmVDYXBlPSdidXR0J10g57q/5bi95qC35byP77yM5Y+v5Lul5pivIGJ1dHQsIHJvdW5kLCBzcXVhcmVcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbbGluZUpvaW49J21pdGVyJ10g57q/5q616L+e5o6l5qC35byP77yM5Y+v5Lul5pivIG1pdGVyLCByb3VuZCwgYmV2ZWxcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbbGluZVdpZHRoPTFdIOaPj+i+ueWuveW6plxuICogQHByb3BlcnR5IHtudW1iZXJ9IFtvcGFjaXR5PTFdIOe7mOWItumAj+aYjuW6plxuICogQHByb3BlcnR5IHtudW1iZXJ9IFtzaGFkb3dCbHVyPTBdIOmYtOW9seaooeeziuW6pu+8jOWkp+S6jjDmnInmlYhcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbc2hhZG93Q29sb3I9JyMwMDAwMDAnXSDpmLTlvbHpopzoibJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbc2hhZG93T2Zmc2V0WD0wXSDpmLTlvbHmqKrlkJHlgY/np7tcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbc2hhZG93T2Zmc2V0WT0wXSDpmLTlvbHnurXlkJHlgY/np7tcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbdGV4dF0g5Zu+5b2i5Lit55qE6ZmE5Yqg5paH5pysXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRDb2xvcj0nIzAwMDAwMCddIOaWh+acrOminOiJslxuICogQHByb3BlcnR5IHtzdHJpbmd9IFt0ZXh0Rm9udF0g6ZmE5Yqg5paH5pys5qC35byP77yMZWc6J2JvbGQgMThweCB2ZXJkYW5hJ1xuICogQHByb3BlcnR5IHtzdHJpbmd9IFt0ZXh0UG9zaXRpb249J2VuZCddIOmZhOWKoOaWh+acrOS9jee9riwg5Y+v5Lul5pivIGluc2lkZSwgbGVmdCwgcmlnaHQsIHRvcCwgYm90dG9tXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRBbGlnbl0g6buY6K6k5qC55o2udGV4dFBvc2l0aW9u6Ieq5Yqo6K6+572u77yM6ZmE5Yqg5paH5pys5rC05bmz5a+56b2Q44CCXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg5Y+v5Lul5pivc3RhcnQsIGVuZCwgbGVmdCwgcmlnaHQsIGNlbnRlclxuICogQHByb3BlcnR5IHtzdHJpbmd9IFt0ZXh0QmFzZWxpbmVdIOm7mOiupOagueaNrnRleHRQb3NpdGlvbuiHquWKqOiuvue9ru+8jOmZhOWKoOaWh+acrOWeguebtOWvuem9kOOAglxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIOWPr+S7peaYr3RvcCwgYm90dG9tLCBtaWRkbGUsIGFscGhhYmV0aWMsIGhhbmdpbmcsIGlkZW9ncmFwaGljXG4gKi9cbmRlZmluZShcbiAgICBmdW5jdGlvbiAocmVxdWlyZSkge1xuICAgICAgICB2YXIgQmFzZSA9IHJlcXVpcmUoJy4vQmFzZScpO1xuICAgICAgICB2YXIgc21vb3RoU3BsaW5lID0gcmVxdWlyZSgnLi91dGlsL3Ntb290aFNwbGluZScpO1xuICAgICAgICB2YXIgc21vb3RoQmV6aWVyID0gcmVxdWlyZSgnLi91dGlsL3Ntb290aEJlemllcicpO1xuICAgICAgICB2YXIgZGFzaGVkTGluZVRvID0gcmVxdWlyZSgnLi91dGlsL2Rhc2hlZExpbmVUbycpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAYWxpYXMgbW9kdWxlOnpyZW5kZXIvc2hhcGUvUG9seWxpbmVcbiAgICAgICAgICogQGNvbnN0cnVjdG9yXG4gICAgICAgICAqIEBleHRlbmRzIG1vZHVsZTp6cmVuZGVyL3NoYXBlL0Jhc2VcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAgICAgICAgICovXG4gICAgICAgIHZhciBQb2x5bGluZSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHRoaXMuYnJ1c2hUeXBlT25seSA9ICdzdHJva2UnOyAgLy8g57q/5p2h5Y+q6IO95o+P6L6577yM5aGr5YWF5ZCO5p6c6Ieq6LSfXG4gICAgICAgICAgICB0aGlzLnRleHRQb3NpdGlvbiA9ICdlbmQnO1xuICAgICAgICAgICAgQmFzZS5jYWxsKHRoaXMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDotJ3otZvlsJTmm7Lnur/nu5jliLbmoLflvI9cbiAgICAgICAgICAgICAqIEBuYW1lIG1vZHVsZTp6cmVuZGVyL3NoYXBlL1BvbHlsaW5lI3N0eWxlXG4gICAgICAgICAgICAgKiBAdHlwZSB7bW9kdWxlOnpyZW5kZXIvc2hhcGUvUG9seWxpbmV+SVBvbHlsaW5lU3R5bGV9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog6LSd6LWb5bCU5puy57q/6auY5Lqu57uY5Yi25qC35byPXG4gICAgICAgICAgICAgKiBAbmFtZSBtb2R1bGU6enJlbmRlci9zaGFwZS9Qb2x5bGluZSNoaWdobGlnaHRTdHlsZVxuICAgICAgICAgICAgICogQHR5cGUge21vZHVsZTp6cmVuZGVyL3NoYXBlL1BvbHlsaW5lfklQb2x5bGluZVN0eWxlfVxuICAgICAgICAgICAgICovXG4gICAgICAgIH07XG5cbiAgICAgICAgUG9seWxpbmUucHJvdG90eXBlID0gIHtcbiAgICAgICAgICAgIHR5cGU6ICdwb2x5bGluZScsXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5Yib5bu65aSa6L655b2i6Lev5b6EXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRH0gY3R4XG4gICAgICAgICAgICAgKiBAcGFyYW0ge21vZHVsZTp6cmVuZGVyL3NoYXBlL1BvbHlsaW5lfklQb2x5bGluZVN0eWxlfSBzdHlsZVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBidWlsZFBhdGggOiBmdW5jdGlvbihjdHgsIHN0eWxlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBvaW50TGlzdCA9IHN0eWxlLnBvaW50TGlzdDtcbiAgICAgICAgICAgICAgICBpZiAocG9pbnRMaXN0Lmxlbmd0aCA8IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5bCR5LqOMuS4queCueWwseS4jeeUu+S6hn5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB2YXIgbGVuID0gTWF0aC5taW4oXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlLnBvaW50TGlzdC5sZW5ndGgsIFxuICAgICAgICAgICAgICAgICAgICBNYXRoLnJvdW5kKHN0eWxlLnBvaW50TGlzdExlbmd0aCB8fCBzdHlsZS5wb2ludExpc3QubGVuZ3RoKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKHN0eWxlLnNtb290aCAmJiBzdHlsZS5zbW9vdGggIT09ICdzcGxpbmUnKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghIHN0eWxlLmNvbnRyb2xQb2ludExpc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udHJvbFBvaW50cyhzdHlsZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvbnRyb2xQb2ludExpc3QgPSBzdHlsZS5jb250cm9sUG9pbnRMaXN0O1xuXG4gICAgICAgICAgICAgICAgICAgIGN0eC5tb3ZlVG8ocG9pbnRMaXN0WzBdWzBdLCBwb2ludExpc3RbMF1bMV0pO1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3AxO1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3AyO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcDtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW4gLSAxOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNwMSA9IGNvbnRyb2xQb2ludExpc3RbaSAqIDJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3AyID0gY29udHJvbFBvaW50TGlzdFtpICogMiArIDFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgcCA9IHBvaW50TGlzdFtpICsgMV07XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjcDFbMF0sIGNwMVsxXSwgY3AyWzBdLCBjcDJbMV0sIHBbMF0sIHBbMV1cbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdHlsZS5zbW9vdGggPT09ICdzcGxpbmUnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwb2ludExpc3QgPSBzbW9vdGhTcGxpbmUocG9pbnRMaXN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlbiA9IHBvaW50TGlzdC5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFzdHlsZS5saW5lVHlwZSB8fCBzdHlsZS5saW5lVHlwZSA9PSAnc29saWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDpu5jorqTkuLrlrp7nur9cbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5tb3ZlVG8ocG9pbnRMaXN0WzBdWzBdLCBwb2ludExpc3RbMF1bMV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5saW5lVG8ocG9pbnRMaXN0W2ldWzBdLCBwb2ludExpc3RbaV1bMV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHN0eWxlLmxpbmVUeXBlID09ICdkYXNoZWQnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfHwgc3R5bGUubGluZVR5cGUgPT0gJ2RvdHRlZCdcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZGFzaExlbmd0aCA9IChzdHlsZS5saW5lV2lkdGggfHwgMSkgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICogKHN0eWxlLmxpbmVUeXBlID09ICdkYXNoZWQnID8gNSA6IDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3R4Lm1vdmVUbyhwb2ludExpc3RbMF1bMF0sIHBvaW50TGlzdFswXVsxXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGFzaGVkTGluZVRvKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvaW50TGlzdFtpIC0gMV1bMF0sIHBvaW50TGlzdFtpIC0gMV1bMV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvaW50TGlzdFtpXVswXSwgcG9pbnRMaXN0W2ldWzFdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXNoTGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICB1cGRhdGVDb250cm9sUG9pbnRzOiBmdW5jdGlvbiAoc3R5bGUpIHtcbiAgICAgICAgICAgICAgICBzdHlsZS5jb250cm9sUG9pbnRMaXN0ID0gc21vb3RoQmV6aWVyKFxuICAgICAgICAgICAgICAgICAgICBzdHlsZS5wb2ludExpc3QsIHN0eWxlLnNtb290aCwgZmFsc2UsIHN0eWxlLnNtb290aENvbnN0cmFpbnRcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDorqHnrpfov5Tlm57mipjnur/ljIXlm7Tnm5Lnn6nlvaLjgIJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7SVpSZW5kZXJCZXppZXJDdXJ2ZVN0eWxlfSBzdHlsZVxuICAgICAgICAgICAgICogQHJldHVybiB7bW9kdWxlOnpyZW5kZXIvc2hhcGUvQmFzZX5JQm91bmRpbmdSZWN0fVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBnZXRSZWN0IDogZnVuY3Rpb24oc3R5bGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVxdWlyZSgnLi9Qb2x5Z29uJykucHJvdG90eXBlLmdldFJlY3Qoc3R5bGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHJlcXVpcmUoJy4uL3Rvb2wvdXRpbCcpLmluaGVyaXRzKFBvbHlsaW5lLCBCYXNlKTtcbiAgICAgICAgcmV0dXJuIFBvbHlsaW5lO1xuICAgIH1cbik7XG4iXSwiZmlsZSI6InBsdWdpbnMvenJlbmRlci0yLjEuMC9zcmMvc2hhcGUvUG9seWxpbmUuanMifQ==
