/**
 * zrender: 图形空间辅助类
 *
 * @author Kener (@Kener-林峰, kener.linfeng@gmail.com)
 *         pissang (https://www.github.com/pissang)
 *
 * isInside：是否在区域内部
 * isOutside：是否在区域外部
 * getTextWidth：测算单行文本宽度
 */
define(
    function (require) {

        'use strict';

        var util = require('./util');
        var curve = require('./curve');

        var _ctx;
        
        var _textWidthCache = {};
        var _textHeightCache = {};
        var _textWidthCacheCounter = 0;
        var _textHeightCacheCounter = 0;
        var TEXT_CACHE_MAX = 5000;
            
        var PI2 = Math.PI * 2;

        function normalizeRadian(angle) {
            angle %= PI2;
            if (angle < 0) {
                angle += PI2;
            }
            return angle;
        }
        /**
         * 包含判断
         *
         * @param {Object} shape : 图形
         * @param {Object} area ： 目标区域
         * @param {number} x ： 横坐标
         * @param {number} y ： 纵坐标
         */
        function isInside(shape, area, x, y) {
            if (!area || !shape) {
                // 无参数或不支持类型
                return false;
            }
            var zoneType = shape.type;

            _ctx = _ctx || util.getContext();

            // 未实现或不可用时(excanvas不支持)则数学运算，主要是line，polyline，ring
            var _mathReturn = _mathMethod(shape, area, x, y);
            if (typeof _mathReturn != 'undefined') {
                return _mathReturn;
            }

            if (shape.buildPath && _ctx.isPointInPath) {
                return _buildPathMethod(shape, _ctx, area, x, y);
            }

            // 上面的方法都行不通时
            switch (zoneType) {
                case 'ellipse': // Todo，不精确
                    return true;
                // 旋轮曲线  不准确
                case 'trochoid':
                    var _r = area.location == 'out'
                            ? area.r1 + area.r2 + area.d
                            : area.r1 - area.r2 + area.d;
                    return isInsideCircle(area, x, y, _r);
                // 玫瑰线 不准确
                case 'rose' :
                    return isInsideCircle(area, x, y, area.maxr);
                // 路径，椭圆，曲线等-----------------13
                default:
                    return false;   // Todo，暂不支持
            }
        }

        /**
         * @param {Object} shape : 图形
         * @param {Object} area ：目标区域
         * @param {number} x ： 横坐标
         * @param {number} y ： 纵坐标
         * @return {boolean=} true表示坐标处在图形中
         */
        function _mathMethod(shape, area, x, y) {
            var zoneType = shape.type;
            // 在矩形内则部分图形需要进一步判断
            switch (zoneType) {
                // 贝塞尔曲线
                case 'bezier-curve':
                    if (typeof(area.cpX2) === 'undefined') {
                        return isInsideQuadraticStroke(
                            area.xStart, area.yStart,
                            area.cpX1, area.cpY1, 
                            area.xEnd, area.yEnd,
                            area.lineWidth, x, y
                        );
                    }
                    return isInsideCubicStroke(
                        area.xStart, area.yStart,
                        area.cpX1, area.cpY1, 
                        area.cpX2, area.cpY2, 
                        area.xEnd, area.yEnd,
                        area.lineWidth, x, y
                    );
                // 线
                case 'line':
                    return isInsideLine(
                        area.xStart, area.yStart,
                        area.xEnd, area.yEnd,
                        area.lineWidth, x, y
                    );
                // 折线
                case 'polyline':
                    return isInsidePolyline(
                        area.pointList, area.lineWidth, x, y
                    );
                // 圆环
                case 'ring':
                    return isInsideRing(
                        area.x, area.y, area.r0, area.r, x, y
                    );
                // 圆形
                case 'circle':
                    return isInsideCircle(
                        area.x, area.y, area.r, x, y
                    );
                // 扇形
                case 'sector':
                    var startAngle = area.startAngle * Math.PI / 180;
                    var endAngle = area.endAngle * Math.PI / 180;
                    if (!area.clockWise) {
                        startAngle = -startAngle;
                        endAngle = -endAngle;
                    }
                    return isInsideSector(
                        area.x, area.y, area.r0, area.r,
                        startAngle, endAngle,
                        !area.clockWise,
                        x, y
                    );
                // 多边形
                case 'path':
                    return area.pathArray && isInsidePath(
                        area.pathArray, Math.max(area.lineWidth, 5),
                        area.brushType, x, y
                    );
                case 'polygon':
                case 'star':
                case 'isogon':
                    return isInsidePolygon(area.pointList, x, y);
                // 文本
                case 'text':
                    var rect =  area.__rect || shape.getRect(area);
                    return isInsideRect(
                        rect.x, rect.y, rect.width, rect.height, x, y
                    );
                // 矩形
                case 'rectangle':
                // 图片
                case 'image':
                    return isInsideRect(
                        area.x, area.y, area.width, area.height, x, y
                    );
            }
        }

        /**
         * 通过buildPath方法来判断，三个方法中较快，但是不支持线条类型的shape，
         * 而且excanvas不支持isPointInPath方法
         *
         * @param {Object} shape ： shape
         * @param {Object} context : 上下文
         * @param {Object} area ：目标区域
         * @param {number} x ： 横坐标
         * @param {number} y ： 纵坐标
         * @return {boolean} true表示坐标处在图形中
         */
        function _buildPathMethod(shape, context, area, x, y) {
            // 图形类实现路径创建了则用类的path
            context.beginPath();
            shape.buildPath(context, area);
            context.closePath();
            return context.isPointInPath(x, y);
        }

        /**
         * !isInside
         */
        function isOutside(shape, area, x, y) {
            return !isInside(shape, area, x, y);
        }

        /**
         * 线段包含判断
         * @param  {number}  x0
         * @param  {number}  y0
         * @param  {number}  x1
         * @param  {number}  y1
         * @param  {number}  lineWidth
         * @param  {number}  x
         * @param  {number}  y
         * @return {boolean}
         */
        function isInsideLine(x0, y0, x1, y1, lineWidth, x, y) {
            if (lineWidth === 0) {
                return false;
            }
            var _l = Math.max(lineWidth, 5);
            var _a = 0;
            var _b = x0;
            // Quick reject
            if (
                (y > y0 + _l && y > y1 + _l)
                || (y < y0 - _l && y < y1 - _l)
                || (x > x0 + _l && x > x1 + _l)
                || (x < x0 - _l && x < x1 - _l)
            ) {
                return false;
            }

            if (x0 !== x1) {
                _a = (y0 - y1) / (x0 - x1);
                _b = (x0 * y1 - x1 * y0) / (x0 - x1) ;
            }
            else {
                return Math.abs(x - x0) <= _l / 2;
            }
            var tmp = _a * x - y + _b;
            var _s = tmp * tmp / (_a * _a + 1);
            return _s <= _l / 2 * _l / 2;
        }

        /**
         * 三次贝塞尔曲线描边包含判断
         * @param  {number}  x0
         * @param  {number}  y0
         * @param  {number}  x1
         * @param  {number}  y1
         * @param  {number}  x2
         * @param  {number}  y2
         * @param  {number}  x3
         * @param  {number}  y3
         * @param  {number}  lineWidth
         * @param  {number}  x
         * @param  {number}  y
         * @return {boolean}
         */
        function isInsideCubicStroke(
            x0, y0, x1, y1, x2, y2, x3, y3,
            lineWidth, x, y
        ) {
            if (lineWidth === 0) {
                return false;
            }
            var _l = Math.max(lineWidth, 5);
            // Quick reject
            if (
                (y > y0 + _l && y > y1 + _l && y > y2 + _l && y > y3 + _l)
                || (y < y0 - _l && y < y1 - _l && y < y2 - _l && y < y3 - _l)
                || (x > x0 + _l && x > x1 + _l && x > x2 + _l && x > x3 + _l)
                || (x < x0 - _l && x < x1 - _l && x < x2 - _l && x < x3 - _l)
            ) {
                return false;
            }
            var d =  curve.cubicProjectPoint(
                x0, y0, x1, y1, x2, y2, x3, y3,
                x, y, null
            );
            return d <= _l / 2;
        }

        /**
         * 二次贝塞尔曲线描边包含判断
         * @param  {number}  x0
         * @param  {number}  y0
         * @param  {number}  x1
         * @param  {number}  y1
         * @param  {number}  x2
         * @param  {number}  y2
         * @param  {number}  lineWidth
         * @param  {number}  x
         * @param  {number}  y
         * @return {boolean}
         */
        function isInsideQuadraticStroke(
            x0, y0, x1, y1, x2, y2,
            lineWidth, x, y
        ) {
            if (lineWidth === 0) {
                return false;
            }
            var _l = Math.max(lineWidth, 5);
            // Quick reject
            if (
                (y > y0 + _l && y > y1 + _l && y > y2 + _l)
                || (y < y0 - _l && y < y1 - _l && y < y2 - _l)
                || (x > x0 + _l && x > x1 + _l && x > x2 + _l)
                || (x < x0 - _l && x < x1 - _l && x < x2 - _l)
            ) {
                return false;
            }
            var d =  curve.quadraticProjectPoint(
                x0, y0, x1, y1, x2, y2,
                x, y, null
            );
            return d <= _l / 2;
        }

        /**
         * 圆弧描边包含判断
         * @param  {number}  cx
         * @param  {number}  cy
         * @param  {number}  r
         * @param  {number}  startAngle
         * @param  {number}  endAngle
         * @param  {boolean}  anticlockwise
         * @param  {number} lineWidth
         * @param  {number}  x
         * @param  {number}  y
         * @return {Boolean}
         */
        function isInsideArcStroke(
            cx, cy, r, startAngle, endAngle, anticlockwise,
            lineWidth, x, y
        ) {
            if (lineWidth === 0) {
                return false;
            }
            var _l = Math.max(lineWidth, 5);

            x -= cx;
            y -= cy;
            var d = Math.sqrt(x * x + y * y);
            if ((d - _l > r) || (d + _l < r)) {
                return false;
            }
            if (Math.abs(startAngle - endAngle) >= PI2) {
                // Is a circle
                return true;
            }
            if (anticlockwise) {
                var tmp = startAngle;
                startAngle = normalizeRadian(endAngle);
                endAngle = normalizeRadian(tmp);
            } else {
                startAngle = normalizeRadian(startAngle);
                endAngle = normalizeRadian(endAngle);
            }
            if (startAngle > endAngle) {
                endAngle += PI2;
            }
            
            var angle = Math.atan2(y, x);
            if (angle < 0) {
                angle += PI2;
            }
            return (angle >= startAngle && angle <= endAngle)
                || (angle + PI2 >= startAngle && angle + PI2 <= endAngle);
        }

        function isInsidePolyline(points, lineWidth, x, y) {
            var lineWidth = Math.max(lineWidth, 10);
            for (var i = 0, l = points.length - 1; i < l; i++) {
                var x0 = points[i][0];
                var y0 = points[i][1];
                var x1 = points[i + 1][0];
                var y1 = points[i + 1][1];

                if (isInsideLine(x0, y0, x1, y1, lineWidth, x, y)) {
                    return true;
                }
            }

            return false;
        }

        function isInsideRing(cx, cy, r0, r, x, y) {
            var d = (x - cx) * (x - cx) + (y - cy) * (y - cy);
            return (d < r * r) && (d > r0 * r0);
        }

        /**
         * 矩形包含判断
         */
        function isInsideRect(x0, y0, width, height, x, y) {
            return x >= x0 && x <= (x0 + width)
                && y >= y0 && y <= (y0 + height);
        }

        /**
         * 圆形包含判断
         */
        function isInsideCircle(x0, y0, r, x, y) {
            return (x - x0) * (x - x0) + (y - y0) * (y - y0)
                   < r * r;
        }

        /**
         * 扇形包含判断
         */
        function isInsideSector(
            cx, cy, r0, r, startAngle, endAngle, anticlockwise, x, y
        ) {
            return isInsideArcStroke(
                cx, cy, (r0 + r) / 2, startAngle, endAngle, anticlockwise,
                r - r0, x, y
            );
        }

        /**
         * 多边形包含判断
         * 与 canvas 一样采用 non-zero winding rule
         */
        function isInsidePolygon(points, x, y) {
            var N = points.length;
            var w = 0;

            for (var i = 0, j = N - 1; i < N; i++) {
                var x0 = points[j][0];
                var y0 = points[j][1];
                var x1 = points[i][0];
                var y1 = points[i][1];
                w += windingLine(x0, y0, x1, y1, x, y);
                j = i;
            }
            return w !== 0;
        }

        function windingLine(x0, y0, x1, y1, x, y) {
            if ((y > y0 && y > y1) || (y < y0 && y < y1)) {
                return 0;
            }
            if (y1 == y0) {
                return 0;
            }
            var dir = y1 < y0 ? 1 : -1;
            var t = (y - y0) / (y1 - y0);
            var x_ = t * (x1 - x0) + x0;

            return x_ > x ? dir : 0;
        }

        // 临时数组
        var roots = [-1, -1, -1];
        var extrema = [-1, -1];

        function swapExtrema() {
            var tmp = extrema[0];
            extrema[0] = extrema[1];
            extrema[1] = tmp;
        }
        function windingCubic(x0, y0, x1, y1, x2, y2, x3, y3, x, y) {
            // Quick reject
            if (
                (y > y0 && y > y1 && y > y2 && y > y3)
                || (y < y0 && y < y1 && y < y2 && y < y3)
            ) {
                return 0;
            }
            var nRoots = curve.cubicRootAt(y0, y1, y2, y3, y, roots);
            if (nRoots === 0) {
                return 0;
            }
            else {
                var w = 0;
                var nExtrema = -1;
                var y0_, y1_;
                for (var i = 0; i < nRoots; i++) {
                    var t = roots[i];
                    var x_ = curve.cubicAt(x0, x1, x2, x3, t);
                    if (x_ < x) { // Quick reject
                        continue;
                    }
                    if (nExtrema < 0) {
                        nExtrema = curve.cubicExtrema(y0, y1, y2, y3, extrema);
                        if (extrema[1] < extrema[0] && nExtrema > 1) {
                            swapExtrema();
                        }
                        y0_ = curve.cubicAt(y0, y1, y2, y3, extrema[0]);
                        if (nExtrema > 1) {
                            y1_ = curve.cubicAt(y0, y1, y2, y3, extrema[1]);
                        }
                    }
                    if (nExtrema == 2) {
                        // 分成三段单调函数
                        if (t < extrema[0]) {
                            w += y0_ < y0 ? 1 : -1;
                        } 
                        else if (t < extrema[1]) {
                            w += y1_ < y0_ ? 1 : -1;
                        } 
                        else {
                            w += y3 < y1_ ? 1 : -1;
                        }
                    } 
                    else {
                        // 分成两段单调函数
                        if (t < extrema[0]) {
                            w += y0_ < y0 ? 1 : -1;
                        } 
                        else {
                            w += y3 < y0_ ? 1 : -1;
                        }
                    }
                }
                return w;
            }
        }

        function windingQuadratic(x0, y0, x1, y1, x2, y2, x, y) {
            // Quick reject
            if (
                (y > y0 && y > y1 && y > y2)
                || (y < y0 && y < y1 && y < y2)
            ) {
                return 0;
            }
            var nRoots = curve.quadraticRootAt(y0, y1, y2, y, roots);
            if (nRoots === 0) {
                return 0;
            } 
            else {
                var t = curve.quadraticExtremum(y0, y1, y2);
                if (t >=0 && t <= 1) {
                    var w = 0;
                    var y_ = curve.quadraticAt(y0, y1, y2, t);
                    for (var i = 0; i < nRoots; i++) {
                        var x_ = curve.quadraticAt(x0, x1, x2, roots[i]);
                        if (x_ < x) {
                            continue;
                        }
                        if (roots[i] < t) {
                            w += y_ < y0 ? 1 : -1;
                        } 
                        else {
                            w += y2 < y_ ? 1 : -1;
                        }
                    }
                    return w;
                } 
                else {
                    var x_ = curve.quadraticAt(x0, x1, x2, roots[0]);
                    if (x_ < x) {
                        return 0;
                    }
                    return y2 < y0 ? 1 : -1;
                }
            }
        }
        
        // TODO
        // Arc 旋转
        function windingArc(
            cx, cy, r, startAngle, endAngle, anticlockwise, x, y
        ) {
            y -= cy;
            if (y > r || y < -r) {
                return 0;
            }
            var tmp = Math.sqrt(r * r - y * y);
            roots[0] = -tmp;
            roots[1] = tmp;

            if (Math.abs(startAngle - endAngle) >= PI2) {
                // Is a circle
                startAngle = 0;
                endAngle = PI2;
                var dir = anticlockwise ? 1 : -1;
                if (x >= roots[0] + cx && x <= roots[1] + cx) {
                    return dir;
                } else {
                    return 0;
                }
            }

            if (anticlockwise) {
                var tmp = startAngle;
                startAngle = normalizeRadian(endAngle);
                endAngle = normalizeRadian(tmp);   
            } else {
                startAngle = normalizeRadian(startAngle);
                endAngle = normalizeRadian(endAngle);   
            }
            if (startAngle > endAngle) {
                endAngle += PI2;
            }

            var w = 0;
            for (var i = 0; i < 2; i++) {
                var x_ = roots[i];
                if (x_ + cx > x) {
                    var angle = Math.atan2(y, x_);
                    var dir = anticlockwise ? 1 : -1;
                    if (angle < 0) {
                        angle = PI2 + angle;
                    }
                    if (
                        (angle >= startAngle && angle <= endAngle)
                        || (angle + PI2 >= startAngle && angle + PI2 <= endAngle)
                    ) {
                        if (angle > Math.PI / 2 && angle < Math.PI * 1.5) {
                            dir = -dir;
                        }
                        w += dir;
                    }
                }
            }
            return w;
        }

        /**
         * 路径包含判断
         * 与 canvas 一样采用 non-zero winding rule
         */
        function isInsidePath(pathArray, lineWidth, brushType, x, y) {
            var w = 0;
            var xi = 0;
            var yi = 0;
            var x0 = 0;
            var y0 = 0;
            var beginSubpath = true;
            var firstCmd = true;

            brushType = brushType || 'fill';

            var hasStroke = brushType === 'stroke' || brushType === 'both';
            var hasFill = brushType === 'fill' || brushType === 'both';

            // var roots = [-1, -1, -1];
            for (var i = 0; i < pathArray.length; i++) {
                var seg = pathArray[i];
                var p = seg.points;
                // Begin a new subpath
                if (beginSubpath || seg.command === 'M') {
                    if (i > 0) {
                        // Close previous subpath
                        if (hasFill) {
                            w += windingLine(xi, yi, x0, y0, x, y);
                        }
                        if (w !== 0) {
                            return true;
                        }
                    }
                    x0 = p[p.length - 2];
                    y0 = p[p.length - 1];
                    beginSubpath = false;
                    if (firstCmd && seg.command !== 'A') {
                        // 如果第一个命令不是M, 是lineTo, bezierCurveTo
                        // 等绘制命令的话，是会从该绘制的起点开始算的
                        // Arc 会在之后做单独处理所以这里忽略
                        firstCmd = false;
                        xi = x0;
                        yi = y0;
                    }
                }
                switch (seg.command) {
                    case 'M':
                        xi = p[0];
                        yi = p[1];
                        break;
                    case 'L':
                        if (hasStroke) {
                            if (isInsideLine(
                                xi, yi, p[0], p[1], lineWidth, x, y
                            )) {
                                return true;
                            }
                        }
                        if (hasFill) {
                            w += windingLine(xi, yi, p[0], p[1], x, y);
                        }
                        xi = p[0];
                        yi = p[1];
                        break;
                    case 'C':
                        if (hasStroke) {
                            if (isInsideCubicStroke(
                                xi, yi, p[0], p[1], p[2], p[3], p[4], p[5],
                                lineWidth, x, y
                            )) {
                                return true;
                            }
                        }
                        if (hasFill) {
                            w += windingCubic(
                                xi, yi, p[0], p[1], p[2], p[3], p[4], p[5], x, y
                            );
                        }
                        xi = p[4];
                        yi = p[5];
                        break;
                    case 'Q':
                        if (hasStroke) {
                            if (isInsideQuadraticStroke(
                                xi, yi, p[0], p[1], p[2], p[3],
                                lineWidth, x, y
                            )) {
                                return true;
                            }
                        }
                        if (hasFill) {
                            w += windingQuadratic(
                                xi, yi, p[0], p[1], p[2], p[3], x, y
                            );
                        }
                        xi = p[2];
                        yi = p[3];
                        break;
                    case 'A':
                        // TODO Arc 旋转
                        // TODO Arc 判断的开销比较大
                        var cx = p[0];
                        var cy = p[1];
                        var rx = p[2];
                        var ry = p[3];
                        var theta = p[4];
                        var dTheta = p[5];
                        var x1 = Math.cos(theta) * rx + cx;
                        var y1 = Math.sin(theta) * ry + cy;
                        // 不是直接使用 arc 命令
                        if (!firstCmd) {
                            w += windingLine(xi, yi, x1, y1);
                        } else {
                            firstCmd = false;
                            // 第一个命令起点还未定义
                            x0 = x1;
                            y0 = y1;
                        }
                        // zr 使用scale来模拟椭圆, 这里也对x做一定的缩放
                        var _x = (x - cx) * ry / rx + cx;
                        if (hasStroke) {
                            if (isInsideArcStroke(
                                cx, cy, ry, theta, theta + dTheta, 1 - p[7],
                                lineWidth, _x, y
                            )) {
                                return true;
                            }
                        }
                        if (hasFill) {
                            w += windingArc(
                                cx, cy, ry, theta, theta + dTheta, 1 - p[7],
                                _x, y
                            );
                        }
                        xi = Math.cos(theta + dTheta) * rx + cx;
                        yi = Math.sin(theta + dTheta) * ry + cy;
                        break;
                    case 'z':
                        if (hasStroke) {
                            if (isInsideLine(
                                xi, yi, x0, y0, lineWidth, x, y
                            )) {
                                return true;
                            }
                        }
                        beginSubpath = true;
                        break;
                }
            }
            if (hasFill) {
                w += windingLine(xi, yi, x0, y0, x, y);
            }
            return w !== 0;
        }

        /**
         * 测算多行文本宽度
         * @param {Object} text
         * @param {Object} textFont
         */
        function getTextWidth(text, textFont) {
            var key = text + ':' + textFont;
            if (_textWidthCache[key]) {
                return _textWidthCache[key];
            }
            _ctx = _ctx || util.getContext();
            _ctx.save();

            if (textFont) {
                _ctx.font = textFont;
            }
            
            text = (text + '').split('\n');
            var width = 0;
            for (var i = 0, l = text.length; i < l; i++) {
                width =  Math.max(
                    _ctx.measureText(text[i]).width,
                    width
                );
            }
            _ctx.restore();

            _textWidthCache[key] = width;
            if (++_textWidthCacheCounter > TEXT_CACHE_MAX) {
                // 内存释放
                _textWidthCacheCounter = 0;
                _textWidthCache = {};
            }
            
            return width;
        }
        
        /**
         * 测算多行文本高度
         * @param {Object} text
         * @param {Object} textFont
         */
        function getTextHeight(text, textFont) {
            var key = text + ':' + textFont;
            if (_textHeightCache[key]) {
                return _textHeightCache[key];
            }
            
            _ctx = _ctx || util.getContext();

            _ctx.save();
            if (textFont) {
                _ctx.font = textFont;
            }
            
            text = (text + '').split('\n');
            // 比较粗暴
            var height = (_ctx.measureText('国').width + 2) * text.length;

            _ctx.restore();

            _textHeightCache[key] = height;
            if (++_textHeightCacheCounter > TEXT_CACHE_MAX) {
                // 内存释放
                _textHeightCacheCounter = 0;
                _textHeightCache = {};
            }
            return height;
        }

        return {
            isInside : isInside,
            isOutside : isOutside,
            getTextWidth : getTextWidth,
            getTextHeight : getTextHeight,

            isInsidePath: isInsidePath,
            isInsidePolygon: isInsidePolygon,
            isInsideSector: isInsideSector,
            isInsideCircle: isInsideCircle,
            isInsideLine: isInsideLine,
            isInsideRect: isInsideRect,
            isInsidePolyline: isInsidePolyline,

            isInsideCubicStroke: isInsideCubicStroke,
            isInsideQuadraticStroke: isInsideQuadraticStroke
        };
    }
);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3Rvb2wvYXJlYS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIHpyZW5kZXI6IOWbvuW9ouepuumXtOi+heWKqeexu1xuICpcbiAqIEBhdXRob3IgS2VuZXIgKEBLZW5lci3mnpfls7AsIGtlbmVyLmxpbmZlbmdAZ21haWwuY29tKVxuICogICAgICAgICBwaXNzYW5nIChodHRwczovL3d3dy5naXRodWIuY29tL3Bpc3NhbmcpXG4gKlxuICogaXNJbnNpZGXvvJrmmK/lkKblnKjljLrln5/lhoXpg6hcbiAqIGlzT3V0c2lkZe+8muaYr+WQpuWcqOWMuuWfn+WklumDqFxuICogZ2V0VGV4dFdpZHRo77ya5rWL566X5Y2V6KGM5paH5pys5a695bqmXG4gKi9cbmRlZmluZShcbiAgICBmdW5jdGlvbiAocmVxdWlyZSkge1xuXG4gICAgICAgICd1c2Ugc3RyaWN0JztcblxuICAgICAgICB2YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuICAgICAgICB2YXIgY3VydmUgPSByZXF1aXJlKCcuL2N1cnZlJyk7XG5cbiAgICAgICAgdmFyIF9jdHg7XG4gICAgICAgIFxuICAgICAgICB2YXIgX3RleHRXaWR0aENhY2hlID0ge307XG4gICAgICAgIHZhciBfdGV4dEhlaWdodENhY2hlID0ge307XG4gICAgICAgIHZhciBfdGV4dFdpZHRoQ2FjaGVDb3VudGVyID0gMDtcbiAgICAgICAgdmFyIF90ZXh0SGVpZ2h0Q2FjaGVDb3VudGVyID0gMDtcbiAgICAgICAgdmFyIFRFWFRfQ0FDSEVfTUFYID0gNTAwMDtcbiAgICAgICAgICAgIFxuICAgICAgICB2YXIgUEkyID0gTWF0aC5QSSAqIDI7XG5cbiAgICAgICAgZnVuY3Rpb24gbm9ybWFsaXplUmFkaWFuKGFuZ2xlKSB7XG4gICAgICAgICAgICBhbmdsZSAlPSBQSTI7XG4gICAgICAgICAgICBpZiAoYW5nbGUgPCAwKSB7XG4gICAgICAgICAgICAgICAgYW5nbGUgKz0gUEkyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGFuZ2xlO1xuICAgICAgICB9XG4gICAgICAgIC8qKlxuICAgICAgICAgKiDljIXlkKvliKTmlq1cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IHNoYXBlIDog5Zu+5b2iXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBhcmVhIO+8miDnm67moIfljLrln59cbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHgg77yaIOaoquWdkOagh1xuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0geSDvvJog57q15Z2Q5qCHXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBpc0luc2lkZShzaGFwZSwgYXJlYSwgeCwgeSkge1xuICAgICAgICAgICAgaWYgKCFhcmVhIHx8ICFzaGFwZSkge1xuICAgICAgICAgICAgICAgIC8vIOaXoOWPguaVsOaIluS4jeaUr+aMgeexu+Wei1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB6b25lVHlwZSA9IHNoYXBlLnR5cGU7XG5cbiAgICAgICAgICAgIF9jdHggPSBfY3R4IHx8IHV0aWwuZ2V0Q29udGV4dCgpO1xuXG4gICAgICAgICAgICAvLyDmnKrlrp7njrDmiJbkuI3lj6/nlKjml7YoZXhjYW52YXPkuI3mlK/mjIEp5YiZ5pWw5a2m6L+Q566X77yM5Li76KaB5pivbGluZe+8jHBvbHlsaW5l77yMcmluZ1xuICAgICAgICAgICAgdmFyIF9tYXRoUmV0dXJuID0gX21hdGhNZXRob2Qoc2hhcGUsIGFyZWEsIHgsIHkpO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBfbWF0aFJldHVybiAhPSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBfbWF0aFJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHNoYXBlLmJ1aWxkUGF0aCAmJiBfY3R4LmlzUG9pbnRJblBhdGgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX2J1aWxkUGF0aE1ldGhvZChzaGFwZSwgX2N0eCwgYXJlYSwgeCwgeSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOS4iumdoueahOaWueazlemDveihjOS4jemAmuaXtlxuICAgICAgICAgICAgc3dpdGNoICh6b25lVHlwZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ2VsbGlwc2UnOiAvLyBUb2Rv77yM5LiN57K+56GuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIC8vIOaXi+i9ruabsue6vyAg5LiN5YeG56GuXG4gICAgICAgICAgICAgICAgY2FzZSAndHJvY2hvaWQnOlxuICAgICAgICAgICAgICAgICAgICB2YXIgX3IgPSBhcmVhLmxvY2F0aW9uID09ICdvdXQnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBhcmVhLnIxICsgYXJlYS5yMiArIGFyZWEuZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogYXJlYS5yMSAtIGFyZWEucjIgKyBhcmVhLmQ7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpc0luc2lkZUNpcmNsZShhcmVhLCB4LCB5LCBfcik7XG4gICAgICAgICAgICAgICAgLy8g546r55Gw57q/IOS4jeWHhuehrlxuICAgICAgICAgICAgICAgIGNhc2UgJ3Jvc2UnIDpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGlzSW5zaWRlQ2lyY2xlKGFyZWEsIHgsIHksIGFyZWEubWF4cik7XG4gICAgICAgICAgICAgICAgLy8g6Lev5b6E77yM5qSt5ZyG77yM5puy57q/562JLS0tLS0tLS0tLS0tLS0tLS0xM1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTsgICAvLyBUb2Rv77yM5pqC5LiN5pSv5oyBXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IHNoYXBlIDog5Zu+5b2iXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBhcmVhIO+8muebruagh+WMuuWfn1xuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0geCDvvJog5qiq5Z2Q5qCHXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB5IO+8miDnurXlnZDmoIdcbiAgICAgICAgICogQHJldHVybiB7Ym9vbGVhbj19IHRydWXooajnpLrlnZDmoIflpITlnKjlm77lvaLkuK1cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIF9tYXRoTWV0aG9kKHNoYXBlLCBhcmVhLCB4LCB5KSB7XG4gICAgICAgICAgICB2YXIgem9uZVR5cGUgPSBzaGFwZS50eXBlO1xuICAgICAgICAgICAgLy8g5Zyo55+p5b2i5YaF5YiZ6YOo5YiG5Zu+5b2i6ZyA6KaB6L+b5LiA5q2l5Yik5patXG4gICAgICAgICAgICBzd2l0Y2ggKHpvbmVUeXBlKSB7XG4gICAgICAgICAgICAgICAgLy8g6LSd5aGe5bCU5puy57q/XG4gICAgICAgICAgICAgICAgY2FzZSAnYmV6aWVyLWN1cnZlJzpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZihhcmVhLmNwWDIpID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGlzSW5zaWRlUXVhZHJhdGljU3Ryb2tlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZWEueFN0YXJ0LCBhcmVhLnlTdGFydCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmVhLmNwWDEsIGFyZWEuY3BZMSwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJlYS54RW5kLCBhcmVhLnlFbmQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJlYS5saW5lV2lkdGgsIHgsIHlcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGlzSW5zaWRlQ3ViaWNTdHJva2UoXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmVhLnhTdGFydCwgYXJlYS55U3RhcnQsXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmVhLmNwWDEsIGFyZWEuY3BZMSwgXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmVhLmNwWDIsIGFyZWEuY3BZMiwgXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmVhLnhFbmQsIGFyZWEueUVuZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZWEubGluZVdpZHRoLCB4LCB5XG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgLy8g57q/XG4gICAgICAgICAgICAgICAgY2FzZSAnbGluZSc6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpc0luc2lkZUxpbmUoXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmVhLnhTdGFydCwgYXJlYS55U3RhcnQsXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmVhLnhFbmQsIGFyZWEueUVuZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZWEubGluZVdpZHRoLCB4LCB5XG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgLy8g5oqY57q/XG4gICAgICAgICAgICAgICAgY2FzZSAncG9seWxpbmUnOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXNJbnNpZGVQb2x5bGluZShcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZWEucG9pbnRMaXN0LCBhcmVhLmxpbmVXaWR0aCwgeCwgeVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIC8vIOWchueOr1xuICAgICAgICAgICAgICAgIGNhc2UgJ3JpbmcnOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXNJbnNpZGVSaW5nKFxuICAgICAgICAgICAgICAgICAgICAgICAgYXJlYS54LCBhcmVhLnksIGFyZWEucjAsIGFyZWEuciwgeCwgeVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIC8vIOWchuW9olxuICAgICAgICAgICAgICAgIGNhc2UgJ2NpcmNsZSc6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpc0luc2lkZUNpcmNsZShcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZWEueCwgYXJlYS55LCBhcmVhLnIsIHgsIHlcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAvLyDmiYflvaJcbiAgICAgICAgICAgICAgICBjYXNlICdzZWN0b3InOlxuICAgICAgICAgICAgICAgICAgICB2YXIgc3RhcnRBbmdsZSA9IGFyZWEuc3RhcnRBbmdsZSAqIE1hdGguUEkgLyAxODA7XG4gICAgICAgICAgICAgICAgICAgIHZhciBlbmRBbmdsZSA9IGFyZWEuZW5kQW5nbGUgKiBNYXRoLlBJIC8gMTgwO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWFyZWEuY2xvY2tXaXNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydEFuZ2xlID0gLXN0YXJ0QW5nbGU7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbmRBbmdsZSA9IC1lbmRBbmdsZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXNJbnNpZGVTZWN0b3IoXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmVhLngsIGFyZWEueSwgYXJlYS5yMCwgYXJlYS5yLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRBbmdsZSwgZW5kQW5nbGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAhYXJlYS5jbG9ja1dpc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICB4LCB5XG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgLy8g5aSa6L655b2iXG4gICAgICAgICAgICAgICAgY2FzZSAncGF0aCc6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhcmVhLnBhdGhBcnJheSAmJiBpc0luc2lkZVBhdGgoXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmVhLnBhdGhBcnJheSwgTWF0aC5tYXgoYXJlYS5saW5lV2lkdGgsIDUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgYXJlYS5icnVzaFR5cGUsIHgsIHlcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBjYXNlICdwb2x5Z29uJzpcbiAgICAgICAgICAgICAgICBjYXNlICdzdGFyJzpcbiAgICAgICAgICAgICAgICBjYXNlICdpc29nb24nOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXNJbnNpZGVQb2x5Z29uKGFyZWEucG9pbnRMaXN0LCB4LCB5KTtcbiAgICAgICAgICAgICAgICAvLyDmlofmnKxcbiAgICAgICAgICAgICAgICBjYXNlICd0ZXh0JzpcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlY3QgPSAgYXJlYS5fX3JlY3QgfHwgc2hhcGUuZ2V0UmVjdChhcmVhKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGlzSW5zaWRlUmVjdChcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlY3QueCwgcmVjdC55LCByZWN0LndpZHRoLCByZWN0LmhlaWdodCwgeCwgeVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIC8vIOefqeW9olxuICAgICAgICAgICAgICAgIGNhc2UgJ3JlY3RhbmdsZSc6XG4gICAgICAgICAgICAgICAgLy8g5Zu+54mHXG4gICAgICAgICAgICAgICAgY2FzZSAnaW1hZ2UnOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXNJbnNpZGVSZWN0KFxuICAgICAgICAgICAgICAgICAgICAgICAgYXJlYS54LCBhcmVhLnksIGFyZWEud2lkdGgsIGFyZWEuaGVpZ2h0LCB4LCB5XG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICog6YCa6L+HYnVpbGRQYXRo5pa55rOV5p2l5Yik5pat77yM5LiJ5Liq5pa55rOV5Lit6L6D5b+r77yM5L2G5piv5LiN5pSv5oyB57q/5p2h57G75Z6L55qEc2hhcGXvvIxcbiAgICAgICAgICog6ICM5LiUZXhjYW52YXPkuI3mlK/mjIFpc1BvaW50SW5QYXRo5pa55rOVXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBzaGFwZSDvvJogc2hhcGVcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGNvbnRleHQgOiDkuIrkuIvmlodcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGFyZWEg77ya55uu5qCH5Yy65Z+fXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB4IO+8miDmqKrlnZDmoIdcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHkg77yaIOe6teWdkOagh1xuICAgICAgICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVl6KGo56S65Z2Q5qCH5aSE5Zyo5Zu+5b2i5LitXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBfYnVpbGRQYXRoTWV0aG9kKHNoYXBlLCBjb250ZXh0LCBhcmVhLCB4LCB5KSB7XG4gICAgICAgICAgICAvLyDlm77lvaLnsbvlrp7njrDot6/lvoTliJvlu7rkuobliJnnlKjnsbvnmoRwYXRoXG4gICAgICAgICAgICBjb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgc2hhcGUuYnVpbGRQYXRoKGNvbnRleHQsIGFyZWEpO1xuICAgICAgICAgICAgY29udGV4dC5jbG9zZVBhdGgoKTtcbiAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmlzUG9pbnRJblBhdGgoeCwgeSk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogIWlzSW5zaWRlXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBpc091dHNpZGUoc2hhcGUsIGFyZWEsIHgsIHkpIHtcbiAgICAgICAgICAgIHJldHVybiAhaXNJbnNpZGUoc2hhcGUsIGFyZWEsIHgsIHkpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOe6v+auteWMheWQq+WIpOaWrVxuICAgICAgICAgKiBAcGFyYW0gIHtudW1iZXJ9ICB4MFxuICAgICAgICAgKiBAcGFyYW0gIHtudW1iZXJ9ICB5MFxuICAgICAgICAgKiBAcGFyYW0gIHtudW1iZXJ9ICB4MVxuICAgICAgICAgKiBAcGFyYW0gIHtudW1iZXJ9ICB5MVxuICAgICAgICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBsaW5lV2lkdGhcbiAgICAgICAgICogQHBhcmFtICB7bnVtYmVyfSAgeFxuICAgICAgICAgKiBAcGFyYW0gIHtudW1iZXJ9ICB5XG4gICAgICAgICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBpc0luc2lkZUxpbmUoeDAsIHkwLCB4MSwgeTEsIGxpbmVXaWR0aCwgeCwgeSkge1xuICAgICAgICAgICAgaWYgKGxpbmVXaWR0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBfbCA9IE1hdGgubWF4KGxpbmVXaWR0aCwgNSk7XG4gICAgICAgICAgICB2YXIgX2EgPSAwO1xuICAgICAgICAgICAgdmFyIF9iID0geDA7XG4gICAgICAgICAgICAvLyBRdWljayByZWplY3RcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAoeSA+IHkwICsgX2wgJiYgeSA+IHkxICsgX2wpXG4gICAgICAgICAgICAgICAgfHwgKHkgPCB5MCAtIF9sICYmIHkgPCB5MSAtIF9sKVxuICAgICAgICAgICAgICAgIHx8ICh4ID4geDAgKyBfbCAmJiB4ID4geDEgKyBfbClcbiAgICAgICAgICAgICAgICB8fCAoeCA8IHgwIC0gX2wgJiYgeCA8IHgxIC0gX2wpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh4MCAhPT0geDEpIHtcbiAgICAgICAgICAgICAgICBfYSA9ICh5MCAtIHkxKSAvICh4MCAtIHgxKTtcbiAgICAgICAgICAgICAgICBfYiA9ICh4MCAqIHkxIC0geDEgKiB5MCkgLyAoeDAgLSB4MSkgO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE1hdGguYWJzKHggLSB4MCkgPD0gX2wgLyAyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHRtcCA9IF9hICogeCAtIHkgKyBfYjtcbiAgICAgICAgICAgIHZhciBfcyA9IHRtcCAqIHRtcCAvIChfYSAqIF9hICsgMSk7XG4gICAgICAgICAgICByZXR1cm4gX3MgPD0gX2wgLyAyICogX2wgLyAyO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOS4ieasoei0neWhnuWwlOabsue6v+aPj+i+ueWMheWQq+WIpOaWrVxuICAgICAgICAgKiBAcGFyYW0gIHtudW1iZXJ9ICB4MFxuICAgICAgICAgKiBAcGFyYW0gIHtudW1iZXJ9ICB5MFxuICAgICAgICAgKiBAcGFyYW0gIHtudW1iZXJ9ICB4MVxuICAgICAgICAgKiBAcGFyYW0gIHtudW1iZXJ9ICB5MVxuICAgICAgICAgKiBAcGFyYW0gIHtudW1iZXJ9ICB4MlxuICAgICAgICAgKiBAcGFyYW0gIHtudW1iZXJ9ICB5MlxuICAgICAgICAgKiBAcGFyYW0gIHtudW1iZXJ9ICB4M1xuICAgICAgICAgKiBAcGFyYW0gIHtudW1iZXJ9ICB5M1xuICAgICAgICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBsaW5lV2lkdGhcbiAgICAgICAgICogQHBhcmFtICB7bnVtYmVyfSAgeFxuICAgICAgICAgKiBAcGFyYW0gIHtudW1iZXJ9ICB5XG4gICAgICAgICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBpc0luc2lkZUN1YmljU3Ryb2tlKFxuICAgICAgICAgICAgeDAsIHkwLCB4MSwgeTEsIHgyLCB5MiwgeDMsIHkzLFxuICAgICAgICAgICAgbGluZVdpZHRoLCB4LCB5XG4gICAgICAgICkge1xuICAgICAgICAgICAgaWYgKGxpbmVXaWR0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBfbCA9IE1hdGgubWF4KGxpbmVXaWR0aCwgNSk7XG4gICAgICAgICAgICAvLyBRdWljayByZWplY3RcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAoeSA+IHkwICsgX2wgJiYgeSA+IHkxICsgX2wgJiYgeSA+IHkyICsgX2wgJiYgeSA+IHkzICsgX2wpXG4gICAgICAgICAgICAgICAgfHwgKHkgPCB5MCAtIF9sICYmIHkgPCB5MSAtIF9sICYmIHkgPCB5MiAtIF9sICYmIHkgPCB5MyAtIF9sKVxuICAgICAgICAgICAgICAgIHx8ICh4ID4geDAgKyBfbCAmJiB4ID4geDEgKyBfbCAmJiB4ID4geDIgKyBfbCAmJiB4ID4geDMgKyBfbClcbiAgICAgICAgICAgICAgICB8fCAoeCA8IHgwIC0gX2wgJiYgeCA8IHgxIC0gX2wgJiYgeCA8IHgyIC0gX2wgJiYgeCA8IHgzIC0gX2wpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgZCA9ICBjdXJ2ZS5jdWJpY1Byb2plY3RQb2ludChcbiAgICAgICAgICAgICAgICB4MCwgeTAsIHgxLCB5MSwgeDIsIHkyLCB4MywgeTMsXG4gICAgICAgICAgICAgICAgeCwgeSwgbnVsbFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJldHVybiBkIDw9IF9sIC8gMjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDkuozmrKHotJ3loZ7lsJTmm7Lnur/mj4/ovrnljIXlkKvliKTmlq1cbiAgICAgICAgICogQHBhcmFtICB7bnVtYmVyfSAgeDBcbiAgICAgICAgICogQHBhcmFtICB7bnVtYmVyfSAgeTBcbiAgICAgICAgICogQHBhcmFtICB7bnVtYmVyfSAgeDFcbiAgICAgICAgICogQHBhcmFtICB7bnVtYmVyfSAgeTFcbiAgICAgICAgICogQHBhcmFtICB7bnVtYmVyfSAgeDJcbiAgICAgICAgICogQHBhcmFtICB7bnVtYmVyfSAgeTJcbiAgICAgICAgICogQHBhcmFtICB7bnVtYmVyfSAgbGluZVdpZHRoXG4gICAgICAgICAqIEBwYXJhbSAge251bWJlcn0gIHhcbiAgICAgICAgICogQHBhcmFtICB7bnVtYmVyfSAgeVxuICAgICAgICAgKiBAcmV0dXJuIHtib29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gaXNJbnNpZGVRdWFkcmF0aWNTdHJva2UoXG4gICAgICAgICAgICB4MCwgeTAsIHgxLCB5MSwgeDIsIHkyLFxuICAgICAgICAgICAgbGluZVdpZHRoLCB4LCB5XG4gICAgICAgICkge1xuICAgICAgICAgICAgaWYgKGxpbmVXaWR0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBfbCA9IE1hdGgubWF4KGxpbmVXaWR0aCwgNSk7XG4gICAgICAgICAgICAvLyBRdWljayByZWplY3RcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAoeSA+IHkwICsgX2wgJiYgeSA+IHkxICsgX2wgJiYgeSA+IHkyICsgX2wpXG4gICAgICAgICAgICAgICAgfHwgKHkgPCB5MCAtIF9sICYmIHkgPCB5MSAtIF9sICYmIHkgPCB5MiAtIF9sKVxuICAgICAgICAgICAgICAgIHx8ICh4ID4geDAgKyBfbCAmJiB4ID4geDEgKyBfbCAmJiB4ID4geDIgKyBfbClcbiAgICAgICAgICAgICAgICB8fCAoeCA8IHgwIC0gX2wgJiYgeCA8IHgxIC0gX2wgJiYgeCA8IHgyIC0gX2wpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgZCA9ICBjdXJ2ZS5xdWFkcmF0aWNQcm9qZWN0UG9pbnQoXG4gICAgICAgICAgICAgICAgeDAsIHkwLCB4MSwgeTEsIHgyLCB5MixcbiAgICAgICAgICAgICAgICB4LCB5LCBudWxsXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgcmV0dXJuIGQgPD0gX2wgLyAyO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWchuW8p+aPj+i+ueWMheWQq+WIpOaWrVxuICAgICAgICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBjeFxuICAgICAgICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBjeVxuICAgICAgICAgKiBAcGFyYW0gIHtudW1iZXJ9ICByXG4gICAgICAgICAqIEBwYXJhbSAge251bWJlcn0gIHN0YXJ0QW5nbGVcbiAgICAgICAgICogQHBhcmFtICB7bnVtYmVyfSAgZW5kQW5nbGVcbiAgICAgICAgICogQHBhcmFtICB7Ym9vbGVhbn0gIGFudGljbG9ja3dpc2VcbiAgICAgICAgICogQHBhcmFtICB7bnVtYmVyfSBsaW5lV2lkdGhcbiAgICAgICAgICogQHBhcmFtICB7bnVtYmVyfSAgeFxuICAgICAgICAgKiBAcGFyYW0gIHtudW1iZXJ9ICB5XG4gICAgICAgICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBpc0luc2lkZUFyY1N0cm9rZShcbiAgICAgICAgICAgIGN4LCBjeSwgciwgc3RhcnRBbmdsZSwgZW5kQW5nbGUsIGFudGljbG9ja3dpc2UsXG4gICAgICAgICAgICBsaW5lV2lkdGgsIHgsIHlcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBpZiAobGluZVdpZHRoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIF9sID0gTWF0aC5tYXgobGluZVdpZHRoLCA1KTtcblxuICAgICAgICAgICAgeCAtPSBjeDtcbiAgICAgICAgICAgIHkgLT0gY3k7XG4gICAgICAgICAgICB2YXIgZCA9IE1hdGguc3FydCh4ICogeCArIHkgKiB5KTtcbiAgICAgICAgICAgIGlmICgoZCAtIF9sID4gcikgfHwgKGQgKyBfbCA8IHIpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKE1hdGguYWJzKHN0YXJ0QW5nbGUgLSBlbmRBbmdsZSkgPj0gUEkyKSB7XG4gICAgICAgICAgICAgICAgLy8gSXMgYSBjaXJjbGVcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhbnRpY2xvY2t3aXNlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRtcCA9IHN0YXJ0QW5nbGU7XG4gICAgICAgICAgICAgICAgc3RhcnRBbmdsZSA9IG5vcm1hbGl6ZVJhZGlhbihlbmRBbmdsZSk7XG4gICAgICAgICAgICAgICAgZW5kQW5nbGUgPSBub3JtYWxpemVSYWRpYW4odG1wKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc3RhcnRBbmdsZSA9IG5vcm1hbGl6ZVJhZGlhbihzdGFydEFuZ2xlKTtcbiAgICAgICAgICAgICAgICBlbmRBbmdsZSA9IG5vcm1hbGl6ZVJhZGlhbihlbmRBbmdsZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoc3RhcnRBbmdsZSA+IGVuZEFuZ2xlKSB7XG4gICAgICAgICAgICAgICAgZW5kQW5nbGUgKz0gUEkyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIgYW5nbGUgPSBNYXRoLmF0YW4yKHksIHgpO1xuICAgICAgICAgICAgaWYgKGFuZ2xlIDwgMCkge1xuICAgICAgICAgICAgICAgIGFuZ2xlICs9IFBJMjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAoYW5nbGUgPj0gc3RhcnRBbmdsZSAmJiBhbmdsZSA8PSBlbmRBbmdsZSlcbiAgICAgICAgICAgICAgICB8fCAoYW5nbGUgKyBQSTIgPj0gc3RhcnRBbmdsZSAmJiBhbmdsZSArIFBJMiA8PSBlbmRBbmdsZSk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBpc0luc2lkZVBvbHlsaW5lKHBvaW50cywgbGluZVdpZHRoLCB4LCB5KSB7XG4gICAgICAgICAgICB2YXIgbGluZVdpZHRoID0gTWF0aC5tYXgobGluZVdpZHRoLCAxMCk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IHBvaW50cy5sZW5ndGggLSAxOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHgwID0gcG9pbnRzW2ldWzBdO1xuICAgICAgICAgICAgICAgIHZhciB5MCA9IHBvaW50c1tpXVsxXTtcbiAgICAgICAgICAgICAgICB2YXIgeDEgPSBwb2ludHNbaSArIDFdWzBdO1xuICAgICAgICAgICAgICAgIHZhciB5MSA9IHBvaW50c1tpICsgMV1bMV07XG5cbiAgICAgICAgICAgICAgICBpZiAoaXNJbnNpZGVMaW5lKHgwLCB5MCwgeDEsIHkxLCBsaW5lV2lkdGgsIHgsIHkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gaXNJbnNpZGVSaW5nKGN4LCBjeSwgcjAsIHIsIHgsIHkpIHtcbiAgICAgICAgICAgIHZhciBkID0gKHggLSBjeCkgKiAoeCAtIGN4KSArICh5IC0gY3kpICogKHkgLSBjeSk7XG4gICAgICAgICAgICByZXR1cm4gKGQgPCByICogcikgJiYgKGQgPiByMCAqIHIwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDnn6nlvaLljIXlkKvliKTmlq1cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIGlzSW5zaWRlUmVjdCh4MCwgeTAsIHdpZHRoLCBoZWlnaHQsIHgsIHkpIHtcbiAgICAgICAgICAgIHJldHVybiB4ID49IHgwICYmIHggPD0gKHgwICsgd2lkdGgpXG4gICAgICAgICAgICAgICAgJiYgeSA+PSB5MCAmJiB5IDw9ICh5MCArIGhlaWdodCk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICog5ZyG5b2i5YyF5ZCr5Yik5patXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBpc0luc2lkZUNpcmNsZSh4MCwgeTAsIHIsIHgsIHkpIHtcbiAgICAgICAgICAgIHJldHVybiAoeCAtIHgwKSAqICh4IC0geDApICsgKHkgLSB5MCkgKiAoeSAtIHkwKVxuICAgICAgICAgICAgICAgICAgIDwgciAqIHI7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICog5omH5b2i5YyF5ZCr5Yik5patXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBpc0luc2lkZVNlY3RvcihcbiAgICAgICAgICAgIGN4LCBjeSwgcjAsIHIsIHN0YXJ0QW5nbGUsIGVuZEFuZ2xlLCBhbnRpY2xvY2t3aXNlLCB4LCB5XG4gICAgICAgICkge1xuICAgICAgICAgICAgcmV0dXJuIGlzSW5zaWRlQXJjU3Ryb2tlKFxuICAgICAgICAgICAgICAgIGN4LCBjeSwgKHIwICsgcikgLyAyLCBzdGFydEFuZ2xlLCBlbmRBbmdsZSwgYW50aWNsb2Nrd2lzZSxcbiAgICAgICAgICAgICAgICByIC0gcjAsIHgsIHlcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICog5aSa6L655b2i5YyF5ZCr5Yik5patXG4gICAgICAgICAqIOS4jiBjYW52YXMg5LiA5qC36YeH55SoIG5vbi16ZXJvIHdpbmRpbmcgcnVsZVxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gaXNJbnNpZGVQb2x5Z29uKHBvaW50cywgeCwgeSkge1xuICAgICAgICAgICAgdmFyIE4gPSBwb2ludHMubGVuZ3RoO1xuICAgICAgICAgICAgdmFyIHcgPSAwO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaiA9IE4gLSAxOyBpIDwgTjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHgwID0gcG9pbnRzW2pdWzBdO1xuICAgICAgICAgICAgICAgIHZhciB5MCA9IHBvaW50c1tqXVsxXTtcbiAgICAgICAgICAgICAgICB2YXIgeDEgPSBwb2ludHNbaV1bMF07XG4gICAgICAgICAgICAgICAgdmFyIHkxID0gcG9pbnRzW2ldWzFdO1xuICAgICAgICAgICAgICAgIHcgKz0gd2luZGluZ0xpbmUoeDAsIHkwLCB4MSwgeTEsIHgsIHkpO1xuICAgICAgICAgICAgICAgIGogPSBpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHcgIT09IDA7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiB3aW5kaW5nTGluZSh4MCwgeTAsIHgxLCB5MSwgeCwgeSkge1xuICAgICAgICAgICAgaWYgKCh5ID4geTAgJiYgeSA+IHkxKSB8fCAoeSA8IHkwICYmIHkgPCB5MSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh5MSA9PSB5MCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGRpciA9IHkxIDwgeTAgPyAxIDogLTE7XG4gICAgICAgICAgICB2YXIgdCA9ICh5IC0geTApIC8gKHkxIC0geTApO1xuICAgICAgICAgICAgdmFyIHhfID0gdCAqICh4MSAtIHgwKSArIHgwO1xuXG4gICAgICAgICAgICByZXR1cm4geF8gPiB4ID8gZGlyIDogMDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOS4tOaXtuaVsOe7hFxuICAgICAgICB2YXIgcm9vdHMgPSBbLTEsIC0xLCAtMV07XG4gICAgICAgIHZhciBleHRyZW1hID0gWy0xLCAtMV07XG5cbiAgICAgICAgZnVuY3Rpb24gc3dhcEV4dHJlbWEoKSB7XG4gICAgICAgICAgICB2YXIgdG1wID0gZXh0cmVtYVswXTtcbiAgICAgICAgICAgIGV4dHJlbWFbMF0gPSBleHRyZW1hWzFdO1xuICAgICAgICAgICAgZXh0cmVtYVsxXSA9IHRtcDtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiB3aW5kaW5nQ3ViaWMoeDAsIHkwLCB4MSwgeTEsIHgyLCB5MiwgeDMsIHkzLCB4LCB5KSB7XG4gICAgICAgICAgICAvLyBRdWljayByZWplY3RcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAoeSA+IHkwICYmIHkgPiB5MSAmJiB5ID4geTIgJiYgeSA+IHkzKVxuICAgICAgICAgICAgICAgIHx8ICh5IDwgeTAgJiYgeSA8IHkxICYmIHkgPCB5MiAmJiB5IDwgeTMpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBuUm9vdHMgPSBjdXJ2ZS5jdWJpY1Jvb3RBdCh5MCwgeTEsIHkyLCB5MywgeSwgcm9vdHMpO1xuICAgICAgICAgICAgaWYgKG5Sb290cyA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIHcgPSAwO1xuICAgICAgICAgICAgICAgIHZhciBuRXh0cmVtYSA9IC0xO1xuICAgICAgICAgICAgICAgIHZhciB5MF8sIHkxXztcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5Sb290czsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0ID0gcm9vdHNbaV07XG4gICAgICAgICAgICAgICAgICAgIHZhciB4XyA9IGN1cnZlLmN1YmljQXQoeDAsIHgxLCB4MiwgeDMsIHQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoeF8gPCB4KSB7IC8vIFF1aWNrIHJlamVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKG5FeHRyZW1hIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbkV4dHJlbWEgPSBjdXJ2ZS5jdWJpY0V4dHJlbWEoeTAsIHkxLCB5MiwgeTMsIGV4dHJlbWEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV4dHJlbWFbMV0gPCBleHRyZW1hWzBdICYmIG5FeHRyZW1hID4gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN3YXBFeHRyZW1hKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB5MF8gPSBjdXJ2ZS5jdWJpY0F0KHkwLCB5MSwgeTIsIHkzLCBleHRyZW1hWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuRXh0cmVtYSA+IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB5MV8gPSBjdXJ2ZS5jdWJpY0F0KHkwLCB5MSwgeTIsIHkzLCBleHRyZW1hWzFdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAobkV4dHJlbWEgPT0gMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5YiG5oiQ5LiJ5q615Y2V6LCD5Ye95pWwXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodCA8IGV4dHJlbWFbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3ICs9IHkwXyA8IHkwID8gMSA6IC0xO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHQgPCBleHRyZW1hWzFdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdyArPSB5MV8gPCB5MF8gPyAxIDogLTE7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdyArPSB5MyA8IHkxXyA/IDEgOiAtMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDliIbmiJDkuKTmrrXljZXosIPlh73mlbBcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0IDwgZXh0cmVtYVswXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHcgKz0geTBfIDwgeTAgPyAxIDogLTE7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdyArPSB5MyA8IHkwXyA/IDEgOiAtMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHdpbmRpbmdRdWFkcmF0aWMoeDAsIHkwLCB4MSwgeTEsIHgyLCB5MiwgeCwgeSkge1xuICAgICAgICAgICAgLy8gUXVpY2sgcmVqZWN0XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgKHkgPiB5MCAmJiB5ID4geTEgJiYgeSA+IHkyKVxuICAgICAgICAgICAgICAgIHx8ICh5IDwgeTAgJiYgeSA8IHkxICYmIHkgPCB5MilcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIG5Sb290cyA9IGN1cnZlLnF1YWRyYXRpY1Jvb3RBdCh5MCwgeTEsIHkyLCB5LCByb290cyk7XG4gICAgICAgICAgICBpZiAoblJvb3RzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICB9IFxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIHQgPSBjdXJ2ZS5xdWFkcmF0aWNFeHRyZW11bSh5MCwgeTEsIHkyKTtcbiAgICAgICAgICAgICAgICBpZiAodCA+PTAgJiYgdCA8PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB3ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHlfID0gY3VydmUucXVhZHJhdGljQXQoeTAsIHkxLCB5MiwgdCk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgblJvb3RzOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB4XyA9IGN1cnZlLnF1YWRyYXRpY0F0KHgwLCB4MSwgeDIsIHJvb3RzW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh4XyA8IHgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyb290c1tpXSA8IHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3ICs9IHlfIDwgeTAgPyAxIDogLTE7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdyArPSB5MiA8IHlfID8gMSA6IC0xO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB3O1xuICAgICAgICAgICAgICAgIH0gXG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB4XyA9IGN1cnZlLnF1YWRyYXRpY0F0KHgwLCB4MSwgeDIsIHJvb3RzWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHhfIDwgeCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHkyIDwgeTAgPyAxIDogLTE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBUT0RPXG4gICAgICAgIC8vIEFyYyDml4vovaxcbiAgICAgICAgZnVuY3Rpb24gd2luZGluZ0FyYyhcbiAgICAgICAgICAgIGN4LCBjeSwgciwgc3RhcnRBbmdsZSwgZW5kQW5nbGUsIGFudGljbG9ja3dpc2UsIHgsIHlcbiAgICAgICAgKSB7XG4gICAgICAgICAgICB5IC09IGN5O1xuICAgICAgICAgICAgaWYgKHkgPiByIHx8IHkgPCAtcikge1xuICAgICAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHRtcCA9IE1hdGguc3FydChyICogciAtIHkgKiB5KTtcbiAgICAgICAgICAgIHJvb3RzWzBdID0gLXRtcDtcbiAgICAgICAgICAgIHJvb3RzWzFdID0gdG1wO1xuXG4gICAgICAgICAgICBpZiAoTWF0aC5hYnMoc3RhcnRBbmdsZSAtIGVuZEFuZ2xlKSA+PSBQSTIpIHtcbiAgICAgICAgICAgICAgICAvLyBJcyBhIGNpcmNsZVxuICAgICAgICAgICAgICAgIHN0YXJ0QW5nbGUgPSAwO1xuICAgICAgICAgICAgICAgIGVuZEFuZ2xlID0gUEkyO1xuICAgICAgICAgICAgICAgIHZhciBkaXIgPSBhbnRpY2xvY2t3aXNlID8gMSA6IC0xO1xuICAgICAgICAgICAgICAgIGlmICh4ID49IHJvb3RzWzBdICsgY3ggJiYgeCA8PSByb290c1sxXSArIGN4KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkaXI7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoYW50aWNsb2Nrd2lzZSkge1xuICAgICAgICAgICAgICAgIHZhciB0bXAgPSBzdGFydEFuZ2xlO1xuICAgICAgICAgICAgICAgIHN0YXJ0QW5nbGUgPSBub3JtYWxpemVSYWRpYW4oZW5kQW5nbGUpO1xuICAgICAgICAgICAgICAgIGVuZEFuZ2xlID0gbm9ybWFsaXplUmFkaWFuKHRtcCk7ICAgXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHN0YXJ0QW5nbGUgPSBub3JtYWxpemVSYWRpYW4oc3RhcnRBbmdsZSk7XG4gICAgICAgICAgICAgICAgZW5kQW5nbGUgPSBub3JtYWxpemVSYWRpYW4oZW5kQW5nbGUpOyAgIFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHN0YXJ0QW5nbGUgPiBlbmRBbmdsZSkge1xuICAgICAgICAgICAgICAgIGVuZEFuZ2xlICs9IFBJMjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHcgPSAwO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAyOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgeF8gPSByb290c1tpXTtcbiAgICAgICAgICAgICAgICBpZiAoeF8gKyBjeCA+IHgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFuZ2xlID0gTWF0aC5hdGFuMih5LCB4Xyk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkaXIgPSBhbnRpY2xvY2t3aXNlID8gMSA6IC0xO1xuICAgICAgICAgICAgICAgICAgICBpZiAoYW5nbGUgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhbmdsZSA9IFBJMiArIGFuZ2xlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIChhbmdsZSA+PSBzdGFydEFuZ2xlICYmIGFuZ2xlIDw9IGVuZEFuZ2xlKVxuICAgICAgICAgICAgICAgICAgICAgICAgfHwgKGFuZ2xlICsgUEkyID49IHN0YXJ0QW5nbGUgJiYgYW5nbGUgKyBQSTIgPD0gZW5kQW5nbGUpXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFuZ2xlID4gTWF0aC5QSSAvIDIgJiYgYW5nbGUgPCBNYXRoLlBJICogMS41KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlyID0gLWRpcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHcgKz0gZGlyO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHc7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICog6Lev5b6E5YyF5ZCr5Yik5patXG4gICAgICAgICAqIOS4jiBjYW52YXMg5LiA5qC36YeH55SoIG5vbi16ZXJvIHdpbmRpbmcgcnVsZVxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gaXNJbnNpZGVQYXRoKHBhdGhBcnJheSwgbGluZVdpZHRoLCBicnVzaFR5cGUsIHgsIHkpIHtcbiAgICAgICAgICAgIHZhciB3ID0gMDtcbiAgICAgICAgICAgIHZhciB4aSA9IDA7XG4gICAgICAgICAgICB2YXIgeWkgPSAwO1xuICAgICAgICAgICAgdmFyIHgwID0gMDtcbiAgICAgICAgICAgIHZhciB5MCA9IDA7XG4gICAgICAgICAgICB2YXIgYmVnaW5TdWJwYXRoID0gdHJ1ZTtcbiAgICAgICAgICAgIHZhciBmaXJzdENtZCA9IHRydWU7XG5cbiAgICAgICAgICAgIGJydXNoVHlwZSA9IGJydXNoVHlwZSB8fCAnZmlsbCc7XG5cbiAgICAgICAgICAgIHZhciBoYXNTdHJva2UgPSBicnVzaFR5cGUgPT09ICdzdHJva2UnIHx8IGJydXNoVHlwZSA9PT0gJ2JvdGgnO1xuICAgICAgICAgICAgdmFyIGhhc0ZpbGwgPSBicnVzaFR5cGUgPT09ICdmaWxsJyB8fCBicnVzaFR5cGUgPT09ICdib3RoJztcblxuICAgICAgICAgICAgLy8gdmFyIHJvb3RzID0gWy0xLCAtMSwgLTFdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXRoQXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgc2VnID0gcGF0aEFycmF5W2ldO1xuICAgICAgICAgICAgICAgIHZhciBwID0gc2VnLnBvaW50cztcbiAgICAgICAgICAgICAgICAvLyBCZWdpbiBhIG5ldyBzdWJwYXRoXG4gICAgICAgICAgICAgICAgaWYgKGJlZ2luU3VicGF0aCB8fCBzZWcuY29tbWFuZCA9PT0gJ00nKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2xvc2UgcHJldmlvdXMgc3VicGF0aFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGhhc0ZpbGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3ICs9IHdpbmRpbmdMaW5lKHhpLCB5aSwgeDAsIHkwLCB4LCB5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3ICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgeDAgPSBwW3AubGVuZ3RoIC0gMl07XG4gICAgICAgICAgICAgICAgICAgIHkwID0gcFtwLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgICAgICAgICBiZWdpblN1YnBhdGggPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZpcnN0Q21kICYmIHNlZy5jb21tYW5kICE9PSAnQScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOWmguaenOesrOS4gOS4quWRveS7pOS4jeaYr00sIOaYr2xpbmVUbywgYmV6aWVyQ3VydmVUb1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8g562J57uY5Yi25ZG95Luk55qE6K+d77yM5piv5Lya5LuO6K+l57uY5Yi255qE6LW354K55byA5aeL566X55qEXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBBcmMg5Lya5Zyo5LmL5ZCO5YGa5Y2V54us5aSE55CG5omA5Lul6L+Z6YeM5b+955WlXG4gICAgICAgICAgICAgICAgICAgICAgICBmaXJzdENtZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgeGkgPSB4MDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHlpID0geTA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc3dpdGNoIChzZWcuY29tbWFuZCkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdNJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHhpID0gcFswXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHlpID0gcFsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdMJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChoYXNTdHJva2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNJbnNpZGVMaW5lKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4aSwgeWksIHBbMF0sIHBbMV0sIGxpbmVXaWR0aCwgeCwgeVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGhhc0ZpbGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3ICs9IHdpbmRpbmdMaW5lKHhpLCB5aSwgcFswXSwgcFsxXSwgeCwgeSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB4aSA9IHBbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICB5aSA9IHBbMV07XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnQyc6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGFzU3Ryb2tlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzSW5zaWRlQ3ViaWNTdHJva2UoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHhpLCB5aSwgcFswXSwgcFsxXSwgcFsyXSwgcFszXSwgcFs0XSwgcFs1XSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZVdpZHRoLCB4LCB5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGFzRmlsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHcgKz0gd2luZGluZ0N1YmljKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4aSwgeWksIHBbMF0sIHBbMV0sIHBbMl0sIHBbM10sIHBbNF0sIHBbNV0sIHgsIHlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgeGkgPSBwWzRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgeWkgPSBwWzVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ1EnOlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGhhc1N0cm9rZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc0luc2lkZVF1YWRyYXRpY1N0cm9rZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeGksIHlpLCBwWzBdLCBwWzFdLCBwWzJdLCBwWzNdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lV2lkdGgsIHgsIHlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChoYXNGaWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdyArPSB3aW5kaW5nUXVhZHJhdGljKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4aSwgeWksIHBbMF0sIHBbMV0sIHBbMl0sIHBbM10sIHgsIHlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgeGkgPSBwWzJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgeWkgPSBwWzNdO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ0EnOlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETyBBcmMg5peL6L2sXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPIEFyYyDliKTmlq3nmoTlvIDplIDmr5TovoPlpKdcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjeCA9IHBbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY3kgPSBwWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJ4ID0gcFsyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByeSA9IHBbM107XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGhldGEgPSBwWzRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRUaGV0YSA9IHBbNV07XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgeDEgPSBNYXRoLmNvcyh0aGV0YSkgKiByeCArIGN4O1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHkxID0gTWF0aC5zaW4odGhldGEpICogcnkgKyBjeTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOS4jeaYr+ebtOaOpeS9v+eUqCBhcmMg5ZG95LukXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWZpcnN0Q21kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdyArPSB3aW5kaW5nTGluZSh4aSwgeWksIHgxLCB5MSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpcnN0Q21kID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g56ys5LiA5Liq5ZG95Luk6LW354K56L+Y5pyq5a6a5LmJXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeDAgPSB4MTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB5MCA9IHkxO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8genIg5L2/55Soc2NhbGXmnaXmqKHmi5/mpK3lnIYsIOi/memHjOS5n+WvuXjlgZrkuIDlrprnmoTnvKnmlL5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBfeCA9ICh4IC0gY3gpICogcnkgLyByeCArIGN4O1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGhhc1N0cm9rZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc0luc2lkZUFyY1N0cm9rZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3gsIGN5LCByeSwgdGhldGEsIHRoZXRhICsgZFRoZXRhLCAxIC0gcFs3XSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZVdpZHRoLCBfeCwgeVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGhhc0ZpbGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3ICs9IHdpbmRpbmdBcmMoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN4LCBjeSwgcnksIHRoZXRhLCB0aGV0YSArIGRUaGV0YSwgMSAtIHBbN10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF94LCB5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHhpID0gTWF0aC5jb3ModGhldGEgKyBkVGhldGEpICogcnggKyBjeDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHlpID0gTWF0aC5zaW4odGhldGEgKyBkVGhldGEpICogcnkgKyBjeTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICd6JzpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChoYXNTdHJva2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNJbnNpZGVMaW5lKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4aSwgeWksIHgwLCB5MCwgbGluZVdpZHRoLCB4LCB5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBiZWdpblN1YnBhdGggPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGhhc0ZpbGwpIHtcbiAgICAgICAgICAgICAgICB3ICs9IHdpbmRpbmdMaW5lKHhpLCB5aSwgeDAsIHkwLCB4LCB5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB3ICE9PSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOa1i+eul+WkmuihjOaWh+acrOWuveW6plxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gdGV4dFxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gdGV4dEZvbnRcbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIGdldFRleHRXaWR0aCh0ZXh0LCB0ZXh0Rm9udCkge1xuICAgICAgICAgICAgdmFyIGtleSA9IHRleHQgKyAnOicgKyB0ZXh0Rm9udDtcbiAgICAgICAgICAgIGlmIChfdGV4dFdpZHRoQ2FjaGVba2V5XSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfdGV4dFdpZHRoQ2FjaGVba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF9jdHggPSBfY3R4IHx8IHV0aWwuZ2V0Q29udGV4dCgpO1xuICAgICAgICAgICAgX2N0eC5zYXZlKCk7XG5cbiAgICAgICAgICAgIGlmICh0ZXh0Rm9udCkge1xuICAgICAgICAgICAgICAgIF9jdHguZm9udCA9IHRleHRGb250O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICB0ZXh0ID0gKHRleHQgKyAnJykuc3BsaXQoJ1xcbicpO1xuICAgICAgICAgICAgdmFyIHdpZHRoID0gMDtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gdGV4dC5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgICAgICB3aWR0aCA9ICBNYXRoLm1heChcbiAgICAgICAgICAgICAgICAgICAgX2N0eC5tZWFzdXJlVGV4dCh0ZXh0W2ldKS53aWR0aCxcbiAgICAgICAgICAgICAgICAgICAgd2lkdGhcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgX2N0eC5yZXN0b3JlKCk7XG5cbiAgICAgICAgICAgIF90ZXh0V2lkdGhDYWNoZVtrZXldID0gd2lkdGg7XG4gICAgICAgICAgICBpZiAoKytfdGV4dFdpZHRoQ2FjaGVDb3VudGVyID4gVEVYVF9DQUNIRV9NQVgpIHtcbiAgICAgICAgICAgICAgICAvLyDlhoXlrZjph4rmlL5cbiAgICAgICAgICAgICAgICBfdGV4dFdpZHRoQ2FjaGVDb3VudGVyID0gMDtcbiAgICAgICAgICAgICAgICBfdGV4dFdpZHRoQ2FjaGUgPSB7fTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIHdpZHRoO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgICog5rWL566X5aSa6KGM5paH5pys6auY5bqmXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSB0ZXh0XG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSB0ZXh0Rm9udFxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gZ2V0VGV4dEhlaWdodCh0ZXh0LCB0ZXh0Rm9udCkge1xuICAgICAgICAgICAgdmFyIGtleSA9IHRleHQgKyAnOicgKyB0ZXh0Rm9udDtcbiAgICAgICAgICAgIGlmIChfdGV4dEhlaWdodENhY2hlW2tleV0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX3RleHRIZWlnaHRDYWNoZVtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBfY3R4ID0gX2N0eCB8fCB1dGlsLmdldENvbnRleHQoKTtcblxuICAgICAgICAgICAgX2N0eC5zYXZlKCk7XG4gICAgICAgICAgICBpZiAodGV4dEZvbnQpIHtcbiAgICAgICAgICAgICAgICBfY3R4LmZvbnQgPSB0ZXh0Rm9udDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGV4dCA9ICh0ZXh0ICsgJycpLnNwbGl0KCdcXG4nKTtcbiAgICAgICAgICAgIC8vIOavlOi+g+eyl+aatFxuICAgICAgICAgICAgdmFyIGhlaWdodCA9IChfY3R4Lm1lYXN1cmVUZXh0KCflm70nKS53aWR0aCArIDIpICogdGV4dC5sZW5ndGg7XG5cbiAgICAgICAgICAgIF9jdHgucmVzdG9yZSgpO1xuXG4gICAgICAgICAgICBfdGV4dEhlaWdodENhY2hlW2tleV0gPSBoZWlnaHQ7XG4gICAgICAgICAgICBpZiAoKytfdGV4dEhlaWdodENhY2hlQ291bnRlciA+IFRFWFRfQ0FDSEVfTUFYKSB7XG4gICAgICAgICAgICAgICAgLy8g5YaF5a2Y6YeK5pS+XG4gICAgICAgICAgICAgICAgX3RleHRIZWlnaHRDYWNoZUNvdW50ZXIgPSAwO1xuICAgICAgICAgICAgICAgIF90ZXh0SGVpZ2h0Q2FjaGUgPSB7fTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBoZWlnaHQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgaXNJbnNpZGUgOiBpc0luc2lkZSxcbiAgICAgICAgICAgIGlzT3V0c2lkZSA6IGlzT3V0c2lkZSxcbiAgICAgICAgICAgIGdldFRleHRXaWR0aCA6IGdldFRleHRXaWR0aCxcbiAgICAgICAgICAgIGdldFRleHRIZWlnaHQgOiBnZXRUZXh0SGVpZ2h0LFxuXG4gICAgICAgICAgICBpc0luc2lkZVBhdGg6IGlzSW5zaWRlUGF0aCxcbiAgICAgICAgICAgIGlzSW5zaWRlUG9seWdvbjogaXNJbnNpZGVQb2x5Z29uLFxuICAgICAgICAgICAgaXNJbnNpZGVTZWN0b3I6IGlzSW5zaWRlU2VjdG9yLFxuICAgICAgICAgICAgaXNJbnNpZGVDaXJjbGU6IGlzSW5zaWRlQ2lyY2xlLFxuICAgICAgICAgICAgaXNJbnNpZGVMaW5lOiBpc0luc2lkZUxpbmUsXG4gICAgICAgICAgICBpc0luc2lkZVJlY3Q6IGlzSW5zaWRlUmVjdCxcbiAgICAgICAgICAgIGlzSW5zaWRlUG9seWxpbmU6IGlzSW5zaWRlUG9seWxpbmUsXG5cbiAgICAgICAgICAgIGlzSW5zaWRlQ3ViaWNTdHJva2U6IGlzSW5zaWRlQ3ViaWNTdHJva2UsXG4gICAgICAgICAgICBpc0luc2lkZVF1YWRyYXRpY1N0cm9rZTogaXNJbnNpZGVRdWFkcmF0aWNTdHJva2VcbiAgICAgICAgfTtcbiAgICB9XG4pO1xuIl0sImZpbGUiOiJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3Rvb2wvYXJlYS5qcyJ9
