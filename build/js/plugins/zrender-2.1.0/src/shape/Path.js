/**
 * SVG Path
 * @module zrender/shape/Path
 * @see http://www.w3.org/TR/2011/REC-SVG11-20110816/paths.html#PathData
 * @author: Pissang (shenyi.914@gmail.com)
 */

/**
 * @typedef {Object} IPathStyle
 * @property {string} path path描述数据, 详见 {@link http://www.w3.org/TR/2011/REC-SVG11-20110816/paths.html#PathData}
 * @property {number} x x轴位移
 * @property {number} y y轴位移
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
    var PathProxy = require('./util/PathProxy');
    var PathSegment = PathProxy.PathSegment;

    var vMag = function(v) {
        return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
    };
    var vRatio = function(u, v) {
        return (u[0] * v[0] + u[1] * v[1]) / (vMag(u) * vMag(v));
    };
    var vAngle = function(u, v) {
        return (u[0] * v[1] < u[1] * v[0] ? -1 : 1)
                * Math.acos(vRatio(u, v));
    };
    /**
     * @alias module:zrender/shape/Path
     * @constructor
     * @extends module:zrender/shape/Base
     * @param {Object} options
     */
    var Path = function (options) {
        Base.call(this, options);
        /**
         * Path绘制样式
         * @name module:zrender/shape/Path#style
         * @type {module:zrender/shape/Path~IPathStyle}
         */
        /**
         * Path高亮绘制样式
         * @name module:zrender/shape/Path#highlightStyle
         * @type {module:zrender/shape/Path~IPathStyle}
         */
    };

    Path.prototype = {
        type: 'path',

        buildPathArray : function (data, x, y) {
            if (!data) {
                return [];
            }

            // 平移
            x = x || 0;
            y = y || 0;
            // command string
            var cs = data;

            // command chars
            var cc = [
                'm', 'M', 'l', 'L', 'v', 'V', 'h', 'H', 'z', 'Z',
                'c', 'C', 'q', 'Q', 't', 'T', 's', 'S', 'a', 'A'
            ];
            
            cs = cs.replace(/-/g, ' -');
            cs = cs.replace(/  /g, ' ');
            cs = cs.replace(/ /g, ',');
            cs = cs.replace(/,,/g, ',');
            
            var n;
            // create pipes so that we can split the data
            for (n = 0; n < cc.length; n++) {
                cs = cs.replace(new RegExp(cc[n], 'g'), '|' + cc[n]);
            }

            // create array
            var arr = cs.split('|');
            var ca = [];
            // init context point
            var cpx = 0;
            var cpy = 0;
            for (n = 1; n < arr.length; n++) {
                var str = arr[n];
                var c = str.charAt(0);
                str = str.slice(1);
                str = str.replace(new RegExp('e,-', 'g'), 'e-');

                var p = str.split(',');
                if (p.length > 0 && p[0] === '') {
                    p.shift();
                }

                for (var i = 0; i < p.length; i++) {
                    p[i] = parseFloat(p[i]);
                }
                while (p.length > 0) {
                    if (isNaN(p[0])) {
                        break;
                    }
                    var cmd = null;
                    var points = [];

                    var ctlPtx;
                    var ctlPty;
                    var prevCmd;

                    var rx;
                    var ry;
                    var psi;
                    var fa;
                    var fs;

                    var x1 = cpx;
                    var y1 = cpy;

                    // convert l, H, h, V, and v to L
                    switch (c) {
                        case 'l':
                            cpx += p.shift();
                            cpy += p.shift();
                            cmd = 'L';
                            points.push(cpx, cpy);
                            break;
                        case 'L':
                            cpx = p.shift();
                            cpy = p.shift();
                            points.push(cpx, cpy);
                            break;
                        case 'm':
                            cpx += p.shift();
                            cpy += p.shift();
                            cmd = 'M';
                            points.push(cpx, cpy);
                            c = 'l';
                            break;
                        case 'M':
                            cpx = p.shift();
                            cpy = p.shift();
                            cmd = 'M';
                            points.push(cpx, cpy);
                            c = 'L';
                            break;

                        case 'h':
                            cpx += p.shift();
                            cmd = 'L';
                            points.push(cpx, cpy);
                            break;
                        case 'H':
                            cpx = p.shift();
                            cmd = 'L';
                            points.push(cpx, cpy);
                            break;
                        case 'v':
                            cpy += p.shift();
                            cmd = 'L';
                            points.push(cpx, cpy);
                            break;
                        case 'V':
                            cpy = p.shift();
                            cmd = 'L';
                            points.push(cpx, cpy);
                            break;
                        case 'C':
                            points.push(p.shift(), p.shift(), p.shift(), p.shift());
                            cpx = p.shift();
                            cpy = p.shift();
                            points.push(cpx, cpy);
                            break;
                        case 'c':
                            points.push(
                                cpx + p.shift(), cpy + p.shift(),
                                cpx + p.shift(), cpy + p.shift()
                            );
                            cpx += p.shift();
                            cpy += p.shift();
                            cmd = 'C';
                            points.push(cpx, cpy);
                            break;
                        case 'S':
                            ctlPtx = cpx;
                            ctlPty = cpy;
                            prevCmd = ca[ca.length - 1];
                            if (prevCmd.command === 'C') {
                                ctlPtx = cpx + (cpx - prevCmd.points[2]);
                                ctlPty = cpy + (cpy - prevCmd.points[3]);
                            }
                            points.push(ctlPtx, ctlPty, p.shift(), p.shift());
                            cpx = p.shift();
                            cpy = p.shift();
                            cmd = 'C';
                            points.push(cpx, cpy);
                            break;
                        case 's':
                            ctlPtx = cpx, ctlPty = cpy;
                            prevCmd = ca[ca.length - 1];
                            if (prevCmd.command === 'C') {
                                ctlPtx = cpx + (cpx - prevCmd.points[2]);
                                ctlPty = cpy + (cpy - prevCmd.points[3]);
                            }
                            points.push(
                                ctlPtx, ctlPty,
                                cpx + p.shift(), cpy + p.shift()
                            );
                            cpx += p.shift();
                            cpy += p.shift();
                            cmd = 'C';
                            points.push(cpx, cpy);
                            break;
                        case 'Q':
                            points.push(p.shift(), p.shift());
                            cpx = p.shift();
                            cpy = p.shift();
                            points.push(cpx, cpy);
                            break;
                        case 'q':
                            points.push(cpx + p.shift(), cpy + p.shift());
                            cpx += p.shift();
                            cpy += p.shift();
                            cmd = 'Q';
                            points.push(cpx, cpy);
                            break;
                        case 'T':
                            ctlPtx = cpx, ctlPty = cpy;
                            prevCmd = ca[ca.length - 1];
                            if (prevCmd.command === 'Q') {
                                ctlPtx = cpx + (cpx - prevCmd.points[0]);
                                ctlPty = cpy + (cpy - prevCmd.points[1]);
                            }
                            cpx = p.shift();
                            cpy = p.shift();
                            cmd = 'Q';
                            points.push(ctlPtx, ctlPty, cpx, cpy);
                            break;
                        case 't':
                            ctlPtx = cpx, ctlPty = cpy;
                            prevCmd = ca[ca.length - 1];
                            if (prevCmd.command === 'Q') {
                                ctlPtx = cpx + (cpx - prevCmd.points[0]);
                                ctlPty = cpy + (cpy - prevCmd.points[1]);
                            }
                            cpx += p.shift();
                            cpy += p.shift();
                            cmd = 'Q';
                            points.push(ctlPtx, ctlPty, cpx, cpy);
                            break;
                        case 'A':
                            rx = p.shift();
                            ry = p.shift();
                            psi = p.shift();
                            fa = p.shift();
                            fs = p.shift();

                            x1 = cpx, y1 = cpy;
                            cpx = p.shift(), cpy = p.shift();
                            cmd = 'A';
                            points = this._convertPoint(
                                x1, y1, cpx, cpy, fa, fs, rx, ry, psi
                            );
                            break;
                        case 'a':
                            rx = p.shift();
                            ry = p.shift();
                            psi = p.shift();
                            fa = p.shift();
                            fs = p.shift();

                            x1 = cpx, y1 = cpy;
                            cpx += p.shift();
                            cpy += p.shift();
                            cmd = 'A';
                            points = this._convertPoint(
                                x1, y1, cpx, cpy, fa, fs, rx, ry, psi
                            );
                            break;
                    }

                    // 平移变换
                    for (var j = 0, l = points.length; j < l; j += 2) {
                        points[j] += x;
                        points[j + 1] += y;
                    }
                    ca.push(new PathSegment(
                        cmd || c, points
                    ));
                }

                if (c === 'z' || c === 'Z') {
                    ca.push(new PathSegment('z', []));
                }
            }

            return ca;
        },

        _convertPoint : function (x1, y1, x2, y2, fa, fs, rx, ry, psiDeg) {
            var psi = psiDeg * (Math.PI / 180.0);
            var xp = Math.cos(psi) * (x1 - x2) / 2.0
                     + Math.sin(psi) * (y1 - y2) / 2.0;
            var yp = -1 * Math.sin(psi) * (x1 - x2) / 2.0
                     + Math.cos(psi) * (y1 - y2) / 2.0;

            var lambda = (xp * xp) / (rx * rx) + (yp * yp) / (ry * ry);

            if (lambda > 1) {
                rx *= Math.sqrt(lambda);
                ry *= Math.sqrt(lambda);
            }

            var f = Math.sqrt((((rx * rx) * (ry * ry))
                    - ((rx * rx) * (yp * yp))
                    - ((ry * ry) * (xp * xp))) / ((rx * rx) * (yp * yp)
                    + (ry * ry) * (xp * xp))
                );

            if (fa === fs) {
                f *= -1;
            }
            if (isNaN(f)) {
                f = 0;
            }

            var cxp = f * rx * yp / ry;
            var cyp = f * -ry * xp / rx;

            var cx = (x1 + x2) / 2.0
                     + Math.cos(psi) * cxp
                     - Math.sin(psi) * cyp;
            var cy = (y1 + y2) / 2.0
                    + Math.sin(psi) * cxp
                    + Math.cos(psi) * cyp;

            var theta = vAngle([ 1, 0 ], [ (xp - cxp) / rx, (yp - cyp) / ry ]);
            var u = [ (xp - cxp) / rx, (yp - cyp) / ry ];
            var v = [ (-1 * xp - cxp) / rx, (-1 * yp - cyp) / ry ];
            var dTheta = vAngle(u, v);

            if (vRatio(u, v) <= -1) {
                dTheta = Math.PI;
            }
            if (vRatio(u, v) >= 1) {
                dTheta = 0;
            }
            if (fs === 0 && dTheta > 0) {
                dTheta = dTheta - 2 * Math.PI;
            }
            if (fs === 1 && dTheta < 0) {
                dTheta = dTheta + 2 * Math.PI;
            }
            return [ cx, cy, rx, ry, theta, dTheta, psi, fs ];
        },

        /**
         * 创建路径
         * @param {CanvasRenderingContext2D} ctx
         * @param {module:zrender/shape/Path~IPathStyle} style
         */
        buildPath : function (ctx, style) {
            var path = style.path;

            // 平移坐标
            var x = style.x || 0;
            var y = style.y || 0;

            style.pathArray = style.pathArray || this.buildPathArray(path, x, y);
            var pathArray = style.pathArray;

            // 记录边界点，用于判断inside
            var pointList = style.pointList = [];
            var singlePointList = [];
            for (var i = 0, l = pathArray.length; i < l; i++) {
                if (pathArray[i].command.toUpperCase() == 'M') {
                    singlePointList.length > 0 
                    && pointList.push(singlePointList);
                    singlePointList = [];
                }
                var p = pathArray[i].points;
                for (var j = 0, k = p.length; j < k; j += 2) {
                    singlePointList.push([p[j], p[j + 1]]);
                }
            }
            singlePointList.length > 0 && pointList.push(singlePointList);
            
            for (var i = 0, l = pathArray.length; i < l; i++) {
                var c = pathArray[i].command;
                var p = pathArray[i].points;
                switch (c) {
                    case 'L':
                        ctx.lineTo(p[0], p[1]);
                        break;
                    case 'M':
                        ctx.moveTo(p[0], p[1]);
                        break;
                    case 'C':
                        ctx.bezierCurveTo(p[0], p[1], p[2], p[3], p[4], p[5]);
                        break;
                    case 'Q':
                        ctx.quadraticCurveTo(p[0], p[1], p[2], p[3]);
                        break;
                    case 'A':
                        var cx = p[0];
                        var cy = p[1];
                        var rx = p[2];
                        var ry = p[3];
                        var theta = p[4];
                        var dTheta = p[5];
                        var psi = p[6];
                        var fs = p[7];
                        var r = (rx > ry) ? rx : ry;
                        var scaleX = (rx > ry) ? 1 : rx / ry;
                        var scaleY = (rx > ry) ? ry / rx : 1;

                        ctx.translate(cx, cy);
                        ctx.rotate(psi);
                        ctx.scale(scaleX, scaleY);
                        ctx.arc(0, 0, r, theta, theta + dTheta, 1 - fs);
                        ctx.scale(1 / scaleX, 1 / scaleY);
                        ctx.rotate(-psi);
                        ctx.translate(-cx, -cy);
                        break;
                    case 'z':
                        ctx.closePath();
                        break;
                }
            }

            return;
        },

        /**
         * 计算返回Path包围盒矩形。
         * @param {module:zrender/shape/Path~IPathStyle} style
         * @return {module:zrender/shape/Base~IBoundingRect}
         */
        getRect : function (style) {
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

            var minX = Number.MAX_VALUE;
            var maxX = Number.MIN_VALUE;

            var minY = Number.MAX_VALUE;
            var maxY = Number.MIN_VALUE;

            // 平移坐标
            var x = style.x || 0;
            var y = style.y || 0;

            var pathArray = style.pathArray || this.buildPathArray(style.path);
            for (var i = 0; i < pathArray.length; i++) {
                var p = pathArray[i].points;

                for (var j = 0; j < p.length; j++) {
                    if (j % 2 === 0) {
                        if (p[j] + x < minX) {
                            minX = p[j];
                        }
                        if (p[j] + x > maxX) {
                            maxX = p[j];
                        }
                    } 
                    else {
                        if (p[j] + y < minY) {
                            minY = p[j];
                        }
                        if (p[j] + y > maxY) {
                            maxY = p[j];
                        }
                    }
                }
            }

            var rect;
            if (minX === Number.MAX_VALUE
                || maxX === Number.MIN_VALUE
                || minY === Number.MAX_VALUE
                || maxY === Number.MIN_VALUE
            ) {
                rect = {
                    x : 0,
                    y : 0,
                    width : 0,
                    height : 0
                };
            }
            else {
                rect = {
                    x : Math.round(minX - lineWidth / 2),
                    y : Math.round(minY - lineWidth / 2),
                    width : maxX - minX + lineWidth,
                    height : maxY - minY + lineWidth
                };
            }
            style.__rect = rect;
            return rect;
        }
    };

    require('../tool/util').inherits(Path, Base);
    return Path;
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3NoYXBlL1BhdGguanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBTVkcgUGF0aFxuICogQG1vZHVsZSB6cmVuZGVyL3NoYXBlL1BhdGhcbiAqIEBzZWUgaHR0cDovL3d3dy53My5vcmcvVFIvMjAxMS9SRUMtU1ZHMTEtMjAxMTA4MTYvcGF0aHMuaHRtbCNQYXRoRGF0YVxuICogQGF1dGhvcjogUGlzc2FuZyAoc2hlbnlpLjkxNEBnbWFpbC5jb20pXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBJUGF0aFN0eWxlXG4gKiBAcHJvcGVydHkge3N0cmluZ30gcGF0aCBwYXRo5o+P6L+w5pWw5o2uLCDor6bop4Ege0BsaW5rIGh0dHA6Ly93d3cudzMub3JnL1RSLzIwMTEvUkVDLVNWRzExLTIwMTEwODE2L3BhdGhzLmh0bWwjUGF0aERhdGF9XG4gKiBAcHJvcGVydHkge251bWJlcn0geCB46L205L2N56e7XG4gKiBAcHJvcGVydHkge251bWJlcn0geSB56L205L2N56e7XG4gKiBAcHJvcGVydHkge3N0cmluZ30gW2JydXNoVHlwZT0nZmlsbCddXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW2NvbG9yPScjMDAwMDAwJ10g5aGr5YWF6aKc6ImyXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3N0cm9rZUNvbG9yPScjMDAwMDAwJ10g5o+P6L656aKc6ImyXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW2xpbmVDYXBlPSdidXR0J10g57q/5bi95qC35byP77yM5Y+v5Lul5pivIGJ1dHQsIHJvdW5kLCBzcXVhcmVcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbbGluZVdpZHRoPTFdIOaPj+i+ueWuveW6plxuICogQHByb3BlcnR5IHtudW1iZXJ9IFtvcGFjaXR5PTFdIOe7mOWItumAj+aYjuW6plxuICogQHByb3BlcnR5IHtudW1iZXJ9IFtzaGFkb3dCbHVyPTBdIOmYtOW9seaooeeziuW6pu+8jOWkp+S6jjDmnInmlYhcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbc2hhZG93Q29sb3I9JyMwMDAwMDAnXSDpmLTlvbHpopzoibJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbc2hhZG93T2Zmc2V0WD0wXSDpmLTlvbHmqKrlkJHlgY/np7tcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbc2hhZG93T2Zmc2V0WT0wXSDpmLTlvbHnurXlkJHlgY/np7tcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbdGV4dF0g5Zu+5b2i5Lit55qE6ZmE5Yqg5paH5pysXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRDb2xvcj0nIzAwMDAwMCddIOaWh+acrOminOiJslxuICogQHByb3BlcnR5IHtzdHJpbmd9IFt0ZXh0Rm9udF0g6ZmE5Yqg5paH5pys5qC35byP77yMZWc6J2JvbGQgMThweCB2ZXJkYW5hJ1xuICogQHByb3BlcnR5IHtzdHJpbmd9IFt0ZXh0UG9zaXRpb249J2VuZCddIOmZhOWKoOaWh+acrOS9jee9riwg5Y+v5Lul5pivIGluc2lkZSwgbGVmdCwgcmlnaHQsIHRvcCwgYm90dG9tXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRBbGlnbl0g6buY6K6k5qC55o2udGV4dFBvc2l0aW9u6Ieq5Yqo6K6+572u77yM6ZmE5Yqg5paH5pys5rC05bmz5a+56b2Q44CCXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg5Y+v5Lul5pivc3RhcnQsIGVuZCwgbGVmdCwgcmlnaHQsIGNlbnRlclxuICogQHByb3BlcnR5IHtzdHJpbmd9IFt0ZXh0QmFzZWxpbmVdIOm7mOiupOagueaNrnRleHRQb3NpdGlvbuiHquWKqOiuvue9ru+8jOmZhOWKoOaWh+acrOWeguebtOWvuem9kOOAglxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIOWPr+S7peaYr3RvcCwgYm90dG9tLCBtaWRkbGUsIGFscGhhYmV0aWMsIGhhbmdpbmcsIGlkZW9ncmFwaGljXG4gKi9cbmRlZmluZShmdW5jdGlvbiAocmVxdWlyZSkge1xuXG4gICAgdmFyIEJhc2UgPSByZXF1aXJlKCcuL0Jhc2UnKTtcbiAgICB2YXIgUGF0aFByb3h5ID0gcmVxdWlyZSgnLi91dGlsL1BhdGhQcm94eScpO1xuICAgIHZhciBQYXRoU2VnbWVudCA9IFBhdGhQcm94eS5QYXRoU2VnbWVudDtcblxuICAgIHZhciB2TWFnID0gZnVuY3Rpb24odikge1xuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KHZbMF0gKiB2WzBdICsgdlsxXSAqIHZbMV0pO1xuICAgIH07XG4gICAgdmFyIHZSYXRpbyA9IGZ1bmN0aW9uKHUsIHYpIHtcbiAgICAgICAgcmV0dXJuICh1WzBdICogdlswXSArIHVbMV0gKiB2WzFdKSAvICh2TWFnKHUpICogdk1hZyh2KSk7XG4gICAgfTtcbiAgICB2YXIgdkFuZ2xlID0gZnVuY3Rpb24odSwgdikge1xuICAgICAgICByZXR1cm4gKHVbMF0gKiB2WzFdIDwgdVsxXSAqIHZbMF0gPyAtMSA6IDEpXG4gICAgICAgICAgICAgICAgKiBNYXRoLmFjb3ModlJhdGlvKHUsIHYpKTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIEBhbGlhcyBtb2R1bGU6enJlbmRlci9zaGFwZS9QYXRoXG4gICAgICogQGNvbnN0cnVjdG9yXG4gICAgICogQGV4dGVuZHMgbW9kdWxlOnpyZW5kZXIvc2hhcGUvQmFzZVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gICAgICovXG4gICAgdmFyIFBhdGggPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICBCYXNlLmNhbGwodGhpcywgb3B0aW9ucyk7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBQYXRo57uY5Yi25qC35byPXG4gICAgICAgICAqIEBuYW1lIG1vZHVsZTp6cmVuZGVyL3NoYXBlL1BhdGgjc3R5bGVcbiAgICAgICAgICogQHR5cGUge21vZHVsZTp6cmVuZGVyL3NoYXBlL1BhdGh+SVBhdGhTdHlsZX1cbiAgICAgICAgICovXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBQYXRo6auY5Lqu57uY5Yi25qC35byPXG4gICAgICAgICAqIEBuYW1lIG1vZHVsZTp6cmVuZGVyL3NoYXBlL1BhdGgjaGlnaGxpZ2h0U3R5bGVcbiAgICAgICAgICogQHR5cGUge21vZHVsZTp6cmVuZGVyL3NoYXBlL1BhdGh+SVBhdGhTdHlsZX1cbiAgICAgICAgICovXG4gICAgfTtcblxuICAgIFBhdGgucHJvdG90eXBlID0ge1xuICAgICAgICB0eXBlOiAncGF0aCcsXG5cbiAgICAgICAgYnVpbGRQYXRoQXJyYXkgOiBmdW5jdGlvbiAoZGF0YSwgeCwgeSkge1xuICAgICAgICAgICAgaWYgKCFkYXRhKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDlubPnp7tcbiAgICAgICAgICAgIHggPSB4IHx8IDA7XG4gICAgICAgICAgICB5ID0geSB8fCAwO1xuICAgICAgICAgICAgLy8gY29tbWFuZCBzdHJpbmdcbiAgICAgICAgICAgIHZhciBjcyA9IGRhdGE7XG5cbiAgICAgICAgICAgIC8vIGNvbW1hbmQgY2hhcnNcbiAgICAgICAgICAgIHZhciBjYyA9IFtcbiAgICAgICAgICAgICAgICAnbScsICdNJywgJ2wnLCAnTCcsICd2JywgJ1YnLCAnaCcsICdIJywgJ3onLCAnWicsXG4gICAgICAgICAgICAgICAgJ2MnLCAnQycsICdxJywgJ1EnLCAndCcsICdUJywgJ3MnLCAnUycsICdhJywgJ0EnXG4gICAgICAgICAgICBdO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjcyA9IGNzLnJlcGxhY2UoLy0vZywgJyAtJyk7XG4gICAgICAgICAgICBjcyA9IGNzLnJlcGxhY2UoLyAgL2csICcgJyk7XG4gICAgICAgICAgICBjcyA9IGNzLnJlcGxhY2UoLyAvZywgJywnKTtcbiAgICAgICAgICAgIGNzID0gY3MucmVwbGFjZSgvLCwvZywgJywnKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIG47XG4gICAgICAgICAgICAvLyBjcmVhdGUgcGlwZXMgc28gdGhhdCB3ZSBjYW4gc3BsaXQgdGhlIGRhdGFcbiAgICAgICAgICAgIGZvciAobiA9IDA7IG4gPCBjYy5sZW5ndGg7IG4rKykge1xuICAgICAgICAgICAgICAgIGNzID0gY3MucmVwbGFjZShuZXcgUmVnRXhwKGNjW25dLCAnZycpLCAnfCcgKyBjY1tuXSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGNyZWF0ZSBhcnJheVxuICAgICAgICAgICAgdmFyIGFyciA9IGNzLnNwbGl0KCd8Jyk7XG4gICAgICAgICAgICB2YXIgY2EgPSBbXTtcbiAgICAgICAgICAgIC8vIGluaXQgY29udGV4dCBwb2ludFxuICAgICAgICAgICAgdmFyIGNweCA9IDA7XG4gICAgICAgICAgICB2YXIgY3B5ID0gMDtcbiAgICAgICAgICAgIGZvciAobiA9IDE7IG4gPCBhcnIubGVuZ3RoOyBuKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RyID0gYXJyW25dO1xuICAgICAgICAgICAgICAgIHZhciBjID0gc3RyLmNoYXJBdCgwKTtcbiAgICAgICAgICAgICAgICBzdHIgPSBzdHIuc2xpY2UoMSk7XG4gICAgICAgICAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UobmV3IFJlZ0V4cCgnZSwtJywgJ2cnKSwgJ2UtJyk7XG5cbiAgICAgICAgICAgICAgICB2YXIgcCA9IHN0ci5zcGxpdCgnLCcpO1xuICAgICAgICAgICAgICAgIGlmIChwLmxlbmd0aCA+IDAgJiYgcFswXSA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgcC5zaGlmdCgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBwW2ldID0gcGFyc2VGbG9hdChwW2ldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgd2hpbGUgKHAubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNOYU4ocFswXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciBjbWQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcG9pbnRzID0gW107XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0bFB0eDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0bFB0eTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHByZXZDbWQ7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHJ4O1xuICAgICAgICAgICAgICAgICAgICB2YXIgcnk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwc2k7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmYTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZzO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciB4MSA9IGNweDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHkxID0gY3B5O1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnZlcnQgbCwgSCwgaCwgViwgYW5kIHYgdG8gTFxuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2wnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNweCArPSBwLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3B5ICs9IHAuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbWQgPSAnTCc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9pbnRzLnB1c2goY3B4LCBjcHkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnTCc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3B4ID0gcC5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNweSA9IHAuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb2ludHMucHVzaChjcHgsIGNweSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdtJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjcHggKz0gcC5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNweSArPSBwLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY21kID0gJ00nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvaW50cy5wdXNoKGNweCwgY3B5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjID0gJ2wnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnTSc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3B4ID0gcC5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNweSA9IHAuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbWQgPSAnTSc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9pbnRzLnB1c2goY3B4LCBjcHkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGMgPSAnTCc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2gnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNweCArPSBwLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY21kID0gJ0wnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvaW50cy5wdXNoKGNweCwgY3B5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ0gnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNweCA9IHAuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbWQgPSAnTCc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9pbnRzLnB1c2goY3B4LCBjcHkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAndic6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3B5ICs9IHAuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbWQgPSAnTCc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9pbnRzLnB1c2goY3B4LCBjcHkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnVic6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3B5ID0gcC5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNtZCA9ICdMJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb2ludHMucHVzaChjcHgsIGNweSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdDJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb2ludHMucHVzaChwLnNoaWZ0KCksIHAuc2hpZnQoKSwgcC5zaGlmdCgpLCBwLnNoaWZ0KCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNweCA9IHAuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjcHkgPSBwLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9pbnRzLnB1c2goY3B4LCBjcHkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnYyc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9pbnRzLnB1c2goXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNweCArIHAuc2hpZnQoKSwgY3B5ICsgcC5zaGlmdCgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjcHggKyBwLnNoaWZ0KCksIGNweSArIHAuc2hpZnQoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3B4ICs9IHAuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjcHkgKz0gcC5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNtZCA9ICdDJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb2ludHMucHVzaChjcHgsIGNweSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdTJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdGxQdHggPSBjcHg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RsUHR5ID0gY3B5O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByZXZDbWQgPSBjYVtjYS5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJldkNtZC5jb21tYW5kID09PSAnQycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RsUHR4ID0gY3B4ICsgKGNweCAtIHByZXZDbWQucG9pbnRzWzJdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RsUHR5ID0gY3B5ICsgKGNweSAtIHByZXZDbWQucG9pbnRzWzNdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9pbnRzLnB1c2goY3RsUHR4LCBjdGxQdHksIHAuc2hpZnQoKSwgcC5zaGlmdCgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjcHggPSBwLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3B5ID0gcC5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNtZCA9ICdDJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb2ludHMucHVzaChjcHgsIGNweSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdzJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdGxQdHggPSBjcHgsIGN0bFB0eSA9IGNweTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmV2Q21kID0gY2FbY2EubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByZXZDbWQuY29tbWFuZCA9PT0gJ0MnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0bFB0eCA9IGNweCArIChjcHggLSBwcmV2Q21kLnBvaW50c1syXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0bFB0eSA9IGNweSArIChjcHkgLSBwcmV2Q21kLnBvaW50c1szXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvaW50cy5wdXNoKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdGxQdHgsIGN0bFB0eSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3B4ICsgcC5zaGlmdCgpLCBjcHkgKyBwLnNoaWZ0KClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNweCArPSBwLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3B5ICs9IHAuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbWQgPSAnQyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9pbnRzLnB1c2goY3B4LCBjcHkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnUSc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9pbnRzLnB1c2gocC5zaGlmdCgpLCBwLnNoaWZ0KCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNweCA9IHAuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjcHkgPSBwLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9pbnRzLnB1c2goY3B4LCBjcHkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAncSc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9pbnRzLnB1c2goY3B4ICsgcC5zaGlmdCgpLCBjcHkgKyBwLnNoaWZ0KCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNweCArPSBwLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3B5ICs9IHAuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbWQgPSAnUSc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9pbnRzLnB1c2goY3B4LCBjcHkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnVCc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RsUHR4ID0gY3B4LCBjdGxQdHkgPSBjcHk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJldkNtZCA9IGNhW2NhLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcmV2Q21kLmNvbW1hbmQgPT09ICdRJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdGxQdHggPSBjcHggKyAoY3B4IC0gcHJldkNtZC5wb2ludHNbMF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdGxQdHkgPSBjcHkgKyAoY3B5IC0gcHJldkNtZC5wb2ludHNbMV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjcHggPSBwLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3B5ID0gcC5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNtZCA9ICdRJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb2ludHMucHVzaChjdGxQdHgsIGN0bFB0eSwgY3B4LCBjcHkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAndCc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RsUHR4ID0gY3B4LCBjdGxQdHkgPSBjcHk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJldkNtZCA9IGNhW2NhLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcmV2Q21kLmNvbW1hbmQgPT09ICdRJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdGxQdHggPSBjcHggKyAoY3B4IC0gcHJldkNtZC5wb2ludHNbMF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdGxQdHkgPSBjcHkgKyAoY3B5IC0gcHJldkNtZC5wb2ludHNbMV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjcHggKz0gcC5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNweSArPSBwLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY21kID0gJ1EnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvaW50cy5wdXNoKGN0bFB0eCwgY3RsUHR5LCBjcHgsIGNweSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdBJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByeCA9IHAuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByeSA9IHAuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwc2kgPSBwLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmEgPSBwLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZnMgPSBwLnNoaWZ0KCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4MSA9IGNweCwgeTEgPSBjcHk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3B4ID0gcC5zaGlmdCgpLCBjcHkgPSBwLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY21kID0gJ0EnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvaW50cyA9IHRoaXMuX2NvbnZlcnRQb2ludChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeDEsIHkxLCBjcHgsIGNweSwgZmEsIGZzLCByeCwgcnksIHBzaVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdhJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByeCA9IHAuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByeSA9IHAuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwc2kgPSBwLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmEgPSBwLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZnMgPSBwLnNoaWZ0KCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4MSA9IGNweCwgeTEgPSBjcHk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3B4ICs9IHAuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjcHkgKz0gcC5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNtZCA9ICdBJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb2ludHMgPSB0aGlzLl9jb252ZXJ0UG9pbnQoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHgxLCB5MSwgY3B4LCBjcHksIGZhLCBmcywgcngsIHJ5LCBwc2lcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8g5bmz56e75Y+Y5o2iXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwLCBsID0gcG9pbnRzLmxlbmd0aDsgaiA8IGw7IGogKz0gMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9pbnRzW2pdICs9IHg7XG4gICAgICAgICAgICAgICAgICAgICAgICBwb2ludHNbaiArIDFdICs9IHk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2EucHVzaChuZXcgUGF0aFNlZ21lbnQoXG4gICAgICAgICAgICAgICAgICAgICAgICBjbWQgfHwgYywgcG9pbnRzXG4gICAgICAgICAgICAgICAgICAgICkpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChjID09PSAneicgfHwgYyA9PT0gJ1onKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhLnB1c2gobmV3IFBhdGhTZWdtZW50KCd6JywgW10pKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBjYTtcbiAgICAgICAgfSxcblxuICAgICAgICBfY29udmVydFBvaW50IDogZnVuY3Rpb24gKHgxLCB5MSwgeDIsIHkyLCBmYSwgZnMsIHJ4LCByeSwgcHNpRGVnKSB7XG4gICAgICAgICAgICB2YXIgcHNpID0gcHNpRGVnICogKE1hdGguUEkgLyAxODAuMCk7XG4gICAgICAgICAgICB2YXIgeHAgPSBNYXRoLmNvcyhwc2kpICogKHgxIC0geDIpIC8gMi4wXG4gICAgICAgICAgICAgICAgICAgICArIE1hdGguc2luKHBzaSkgKiAoeTEgLSB5MikgLyAyLjA7XG4gICAgICAgICAgICB2YXIgeXAgPSAtMSAqIE1hdGguc2luKHBzaSkgKiAoeDEgLSB4MikgLyAyLjBcbiAgICAgICAgICAgICAgICAgICAgICsgTWF0aC5jb3MocHNpKSAqICh5MSAtIHkyKSAvIDIuMDtcblxuICAgICAgICAgICAgdmFyIGxhbWJkYSA9ICh4cCAqIHhwKSAvIChyeCAqIHJ4KSArICh5cCAqIHlwKSAvIChyeSAqIHJ5KTtcblxuICAgICAgICAgICAgaWYgKGxhbWJkYSA+IDEpIHtcbiAgICAgICAgICAgICAgICByeCAqPSBNYXRoLnNxcnQobGFtYmRhKTtcbiAgICAgICAgICAgICAgICByeSAqPSBNYXRoLnNxcnQobGFtYmRhKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGYgPSBNYXRoLnNxcnQoKCgocnggKiByeCkgKiAocnkgKiByeSkpXG4gICAgICAgICAgICAgICAgICAgIC0gKChyeCAqIHJ4KSAqICh5cCAqIHlwKSlcbiAgICAgICAgICAgICAgICAgICAgLSAoKHJ5ICogcnkpICogKHhwICogeHApKSkgLyAoKHJ4ICogcngpICogKHlwICogeXApXG4gICAgICAgICAgICAgICAgICAgICsgKHJ5ICogcnkpICogKHhwICogeHApKVxuICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIGlmIChmYSA9PT0gZnMpIHtcbiAgICAgICAgICAgICAgICBmICo9IC0xO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlzTmFOKGYpKSB7XG4gICAgICAgICAgICAgICAgZiA9IDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBjeHAgPSBmICogcnggKiB5cCAvIHJ5O1xuICAgICAgICAgICAgdmFyIGN5cCA9IGYgKiAtcnkgKiB4cCAvIHJ4O1xuXG4gICAgICAgICAgICB2YXIgY3ggPSAoeDEgKyB4MikgLyAyLjBcbiAgICAgICAgICAgICAgICAgICAgICsgTWF0aC5jb3MocHNpKSAqIGN4cFxuICAgICAgICAgICAgICAgICAgICAgLSBNYXRoLnNpbihwc2kpICogY3lwO1xuICAgICAgICAgICAgdmFyIGN5ID0gKHkxICsgeTIpIC8gMi4wXG4gICAgICAgICAgICAgICAgICAgICsgTWF0aC5zaW4ocHNpKSAqIGN4cFxuICAgICAgICAgICAgICAgICAgICArIE1hdGguY29zKHBzaSkgKiBjeXA7XG5cbiAgICAgICAgICAgIHZhciB0aGV0YSA9IHZBbmdsZShbIDEsIDAgXSwgWyAoeHAgLSBjeHApIC8gcngsICh5cCAtIGN5cCkgLyByeSBdKTtcbiAgICAgICAgICAgIHZhciB1ID0gWyAoeHAgLSBjeHApIC8gcngsICh5cCAtIGN5cCkgLyByeSBdO1xuICAgICAgICAgICAgdmFyIHYgPSBbICgtMSAqIHhwIC0gY3hwKSAvIHJ4LCAoLTEgKiB5cCAtIGN5cCkgLyByeSBdO1xuICAgICAgICAgICAgdmFyIGRUaGV0YSA9IHZBbmdsZSh1LCB2KTtcblxuICAgICAgICAgICAgaWYgKHZSYXRpbyh1LCB2KSA8PSAtMSkge1xuICAgICAgICAgICAgICAgIGRUaGV0YSA9IE1hdGguUEk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodlJhdGlvKHUsIHYpID49IDEpIHtcbiAgICAgICAgICAgICAgICBkVGhldGEgPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGZzID09PSAwICYmIGRUaGV0YSA+IDApIHtcbiAgICAgICAgICAgICAgICBkVGhldGEgPSBkVGhldGEgLSAyICogTWF0aC5QSTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChmcyA9PT0gMSAmJiBkVGhldGEgPCAwKSB7XG4gICAgICAgICAgICAgICAgZFRoZXRhID0gZFRoZXRhICsgMiAqIE1hdGguUEk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gWyBjeCwgY3ksIHJ4LCByeSwgdGhldGEsIGRUaGV0YSwgcHNpLCBmcyBdO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDliJvlu7rot6/lvoRcbiAgICAgICAgICogQHBhcmFtIHtDYW52YXNSZW5kZXJpbmdDb250ZXh0MkR9IGN0eFxuICAgICAgICAgKiBAcGFyYW0ge21vZHVsZTp6cmVuZGVyL3NoYXBlL1BhdGh+SVBhdGhTdHlsZX0gc3R5bGVcbiAgICAgICAgICovXG4gICAgICAgIGJ1aWxkUGF0aCA6IGZ1bmN0aW9uIChjdHgsIHN0eWxlKSB7XG4gICAgICAgICAgICB2YXIgcGF0aCA9IHN0eWxlLnBhdGg7XG5cbiAgICAgICAgICAgIC8vIOW5s+enu+WdkOagh1xuICAgICAgICAgICAgdmFyIHggPSBzdHlsZS54IHx8IDA7XG4gICAgICAgICAgICB2YXIgeSA9IHN0eWxlLnkgfHwgMDtcblxuICAgICAgICAgICAgc3R5bGUucGF0aEFycmF5ID0gc3R5bGUucGF0aEFycmF5IHx8IHRoaXMuYnVpbGRQYXRoQXJyYXkocGF0aCwgeCwgeSk7XG4gICAgICAgICAgICB2YXIgcGF0aEFycmF5ID0gc3R5bGUucGF0aEFycmF5O1xuXG4gICAgICAgICAgICAvLyDorrDlvZXovrnnlYzngrnvvIznlKjkuo7liKTmlq1pbnNpZGVcbiAgICAgICAgICAgIHZhciBwb2ludExpc3QgPSBzdHlsZS5wb2ludExpc3QgPSBbXTtcbiAgICAgICAgICAgIHZhciBzaW5nbGVQb2ludExpc3QgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gcGF0aEFycmF5Lmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChwYXRoQXJyYXlbaV0uY29tbWFuZC50b1VwcGVyQ2FzZSgpID09ICdNJykge1xuICAgICAgICAgICAgICAgICAgICBzaW5nbGVQb2ludExpc3QubGVuZ3RoID4gMCBcbiAgICAgICAgICAgICAgICAgICAgJiYgcG9pbnRMaXN0LnB1c2goc2luZ2xlUG9pbnRMaXN0KTtcbiAgICAgICAgICAgICAgICAgICAgc2luZ2xlUG9pbnRMaXN0ID0gW107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBwID0gcGF0aEFycmF5W2ldLnBvaW50cztcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMCwgayA9IHAubGVuZ3RoOyBqIDwgazsgaiArPSAyKSB7XG4gICAgICAgICAgICAgICAgICAgIHNpbmdsZVBvaW50TGlzdC5wdXNoKFtwW2pdLCBwW2ogKyAxXV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNpbmdsZVBvaW50TGlzdC5sZW5ndGggPiAwICYmIHBvaW50TGlzdC5wdXNoKHNpbmdsZVBvaW50TGlzdCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gcGF0aEFycmF5Lmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBjID0gcGF0aEFycmF5W2ldLmNvbW1hbmQ7XG4gICAgICAgICAgICAgICAgdmFyIHAgPSBwYXRoQXJyYXlbaV0ucG9pbnRzO1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoYykge1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdMJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5saW5lVG8ocFswXSwgcFsxXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnTSc6XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHgubW92ZVRvKHBbMF0sIHBbMV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ0MnOlxuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8ocFswXSwgcFsxXSwgcFsyXSwgcFszXSwgcFs0XSwgcFs1XSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnUSc6XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHgucXVhZHJhdGljQ3VydmVUbyhwWzBdLCBwWzFdLCBwWzJdLCBwWzNdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdBJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjeCA9IHBbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY3kgPSBwWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJ4ID0gcFsyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByeSA9IHBbM107XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGhldGEgPSBwWzRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRUaGV0YSA9IHBbNV07XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHNpID0gcFs2XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmcyA9IHBbN107XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgciA9IChyeCA+IHJ5KSA/IHJ4IDogcnk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2NhbGVYID0gKHJ4ID4gcnkpID8gMSA6IHJ4IC8gcnk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2NhbGVZID0gKHJ4ID4gcnkpID8gcnkgLyByeCA6IDE7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC50cmFuc2xhdGUoY3gsIGN5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5yb3RhdGUocHNpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5zY2FsZShzY2FsZVgsIHNjYWxlWSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHguYXJjKDAsIDAsIHIsIHRoZXRhLCB0aGV0YSArIGRUaGV0YSwgMSAtIGZzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5zY2FsZSgxIC8gc2NhbGVYLCAxIC8gc2NhbGVZKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5yb3RhdGUoLXBzaSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHgudHJhbnNsYXRlKC1jeCwgLWN5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICd6JzpcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5jbG9zZVBhdGgoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDorqHnrpfov5Tlm55QYXRo5YyF5Zu055uS55+p5b2i44CCXG4gICAgICAgICAqIEBwYXJhbSB7bW9kdWxlOnpyZW5kZXIvc2hhcGUvUGF0aH5JUGF0aFN0eWxlfSBzdHlsZVxuICAgICAgICAgKiBAcmV0dXJuIHttb2R1bGU6enJlbmRlci9zaGFwZS9CYXNlfklCb3VuZGluZ1JlY3R9XG4gICAgICAgICAqL1xuICAgICAgICBnZXRSZWN0IDogZnVuY3Rpb24gKHN0eWxlKSB7XG4gICAgICAgICAgICBpZiAoc3R5bGUuX19yZWN0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0eWxlLl9fcmVjdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIGxpbmVXaWR0aDtcbiAgICAgICAgICAgIGlmIChzdHlsZS5icnVzaFR5cGUgPT0gJ3N0cm9rZScgfHwgc3R5bGUuYnJ1c2hUeXBlID09ICdmaWxsJykge1xuICAgICAgICAgICAgICAgIGxpbmVXaWR0aCA9IHN0eWxlLmxpbmVXaWR0aCB8fCAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbGluZVdpZHRoID0gMDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIG1pblggPSBOdW1iZXIuTUFYX1ZBTFVFO1xuICAgICAgICAgICAgdmFyIG1heFggPSBOdW1iZXIuTUlOX1ZBTFVFO1xuXG4gICAgICAgICAgICB2YXIgbWluWSA9IE51bWJlci5NQVhfVkFMVUU7XG4gICAgICAgICAgICB2YXIgbWF4WSA9IE51bWJlci5NSU5fVkFMVUU7XG5cbiAgICAgICAgICAgIC8vIOW5s+enu+WdkOagh1xuICAgICAgICAgICAgdmFyIHggPSBzdHlsZS54IHx8IDA7XG4gICAgICAgICAgICB2YXIgeSA9IHN0eWxlLnkgfHwgMDtcblxuICAgICAgICAgICAgdmFyIHBhdGhBcnJheSA9IHN0eWxlLnBhdGhBcnJheSB8fCB0aGlzLmJ1aWxkUGF0aEFycmF5KHN0eWxlLnBhdGgpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXRoQXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgcCA9IHBhdGhBcnJheVtpXS5wb2ludHM7XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHAubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGogJSAyID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocFtqXSArIHggPCBtaW5YKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWluWCA9IHBbal07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocFtqXSArIHggPiBtYXhYKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF4WCA9IHBbal07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBbal0gKyB5IDwgbWluWSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pblkgPSBwW2pdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBbal0gKyB5ID4gbWF4WSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heFkgPSBwW2pdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgcmVjdDtcbiAgICAgICAgICAgIGlmIChtaW5YID09PSBOdW1iZXIuTUFYX1ZBTFVFXG4gICAgICAgICAgICAgICAgfHwgbWF4WCA9PT0gTnVtYmVyLk1JTl9WQUxVRVxuICAgICAgICAgICAgICAgIHx8IG1pblkgPT09IE51bWJlci5NQVhfVkFMVUVcbiAgICAgICAgICAgICAgICB8fCBtYXhZID09PSBOdW1iZXIuTUlOX1ZBTFVFXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICByZWN0ID0ge1xuICAgICAgICAgICAgICAgICAgICB4IDogMCxcbiAgICAgICAgICAgICAgICAgICAgeSA6IDAsXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoIDogMCxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0IDogMFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZWN0ID0ge1xuICAgICAgICAgICAgICAgICAgICB4IDogTWF0aC5yb3VuZChtaW5YIC0gbGluZVdpZHRoIC8gMiksXG4gICAgICAgICAgICAgICAgICAgIHkgOiBNYXRoLnJvdW5kKG1pblkgLSBsaW5lV2lkdGggLyAyKSxcbiAgICAgICAgICAgICAgICAgICAgd2lkdGggOiBtYXhYIC0gbWluWCArIGxpbmVXaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0IDogbWF4WSAtIG1pblkgKyBsaW5lV2lkdGhcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3R5bGUuX19yZWN0ID0gcmVjdDtcbiAgICAgICAgICAgIHJldHVybiByZWN0O1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHJlcXVpcmUoJy4uL3Rvb2wvdXRpbCcpLmluaGVyaXRzKFBhdGgsIEJhc2UpO1xuICAgIHJldHVybiBQYXRoO1xufSk7XG4iXSwiZmlsZSI6InBsdWdpbnMvenJlbmRlci0yLjEuMC9zcmMvc2hhcGUvUGF0aC5qcyJ9
