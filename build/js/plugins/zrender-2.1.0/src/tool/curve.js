/**
 * 曲线辅助模块
 * @module zrender/tool/curve
 * @author pissang(https://www.github.com/pissang)
 */
define(function(require) {

    var vector = require('./vector');

    'use strict';

    var EPSILON = 1e-4;

    var THREE_SQRT = Math.sqrt(3);
    var ONE_THIRD = 1 / 3;

    // 临时变量
    var _v0 = vector.create();
    var _v1 = vector.create();
    var _v2 = vector.create();
    // var _v3 = vector.create();

    function isAroundZero(val) {
        return val > -EPSILON && val < EPSILON;
    }
    function isNotAroundZero(val) {
        return val > EPSILON || val < -EPSILON;
    }
    /*
    function evalCubicCoeff(a, b, c, d, t) {
        return ((a * t + b) * t + c) * t + d;
    }
    */

    /** 
     * 计算三次贝塞尔值
     * @memberOf module:zrender/tool/curve
     * @param  {number} p0
     * @param  {number} p1
     * @param  {number} p2
     * @param  {number} p3
     * @param  {number} t
     * @return {number}
     */
    function cubicAt(p0, p1, p2, p3, t) {
        var onet = 1 - t;
        return onet * onet * (onet * p0 + 3 * t * p1)
             + t * t * (t * p3 + 3 * onet * p2);
    }

    /** 
     * 计算三次贝塞尔导数值
     * @memberOf module:zrender/tool/curve
     * @param  {number} p0
     * @param  {number} p1
     * @param  {number} p2
     * @param  {number} p3
     * @param  {number} t
     * @return {number}
     */
    function cubicDerivativeAt(p0, p1, p2, p3, t) {
        var onet = 1 - t;
        return 3 * (
            ((p1 - p0) * onet + 2 * (p2 - p1) * t) * onet
            + (p3 - p2) * t * t
        );
    }

    /**
     * 计算三次贝塞尔方程根，使用盛金公式
     * @memberOf module:zrender/tool/curve
     * @param  {number} p0
     * @param  {number} p1
     * @param  {number} p2
     * @param  {number} p3
     * @param  {number} val
     * @param  {Array.<number>} roots
     * @return {number} 有效根数目
     */
    function cubicRootAt(p0, p1, p2, p3, val, roots) {
        // Evaluate roots of cubic functions
        var a = p3 + 3 * (p1 - p2) - p0;
        var b = 3 * (p2 - p1 * 2 + p0);
        var c = 3 * (p1  - p0);
        var d = p0 - val;

        var A = b * b - 3 * a * c;
        var B = b * c - 9 * a * d;
        var C = c * c - 3 * b * d;

        var n = 0;

        if (isAroundZero(A) && isAroundZero(B)) {
            if (isAroundZero(b)) {
                roots[0] = 0;
            }
            else {
                var t1 = -c / b;  //t1, t2, t3, b is not zero
                if (t1 >= 0 && t1 <= 1) {
                    roots[n++] = t1;
                }
            }
        }
        else {
            var disc = B * B - 4 * A * C;

            if (isAroundZero(disc)) {
                var K = B / A;
                var t1 = -b / a + K;  // t1, a is not zero
                var t2 = -K / 2;  // t2, t3
                if (t1 >= 0 && t1 <= 1) {
                    roots[n++] = t1;
                }
                if (t2 >= 0 && t2 <= 1) {
                    roots[n++] = t2;
                }
            }
            else if (disc > 0) {
                var discSqrt = Math.sqrt(disc);
                var Y1 = A * b + 1.5 * a * (-B + discSqrt);
                var Y2 = A * b + 1.5 * a * (-B - discSqrt);
                if (Y1 < 0) {
                    Y1 = -Math.pow(-Y1, ONE_THIRD);
                }
                else {
                    Y1 = Math.pow(Y1, ONE_THIRD);
                }
                if (Y2 < 0) {
                    Y2 = -Math.pow(-Y2, ONE_THIRD);
                }
                else {
                    Y2 = Math.pow(Y2, ONE_THIRD);
                }
                var t1 = (-b - (Y1 + Y2)) / (3 * a);
                if (t1 >= 0 && t1 <= 1) {
                    roots[n++] = t1;
                }
            }
            else {
                var T = (2 * A * b - 3 * a * B) / (2 * Math.sqrt(A * A * A));
                var theta = Math.acos(T) / 3;
                var ASqrt = Math.sqrt(A);
                var tmp = Math.cos(theta);
                
                var t1 = (-b - 2 * ASqrt * tmp) / (3 * a);
                var t2 = (-b + ASqrt * (tmp + THREE_SQRT * Math.sin(theta))) / (3 * a);
                var t3 = (-b + ASqrt * (tmp - THREE_SQRT * Math.sin(theta))) / (3 * a);
                if (t1 >= 0 && t1 <= 1) {
                    roots[n++] = t1;
                }
                if (t2 >= 0 && t2 <= 1) {
                    roots[n++] = t2;
                }
                if (t3 >= 0 && t3 <= 1) {
                    roots[n++] = t3;
                }
            }
        }
        return n;
    }

    /**
     * 计算三次贝塞尔方程极限值的位置
     * @memberOf module:zrender/tool/curve
     * @param  {number} p0
     * @param  {number} p1
     * @param  {number} p2
     * @param  {number} p3
     * @param  {Array.<number>} extrema
     * @return {number} 有效数目
     */
    function cubicExtrema(p0, p1, p2, p3, extrema) {
        var b = 6 * p2 - 12 * p1 + 6 * p0;
        var a = 9 * p1 + 3 * p3 - 3 * p0 - 9 * p2;
        var c = 3 * p1 - 3 * p0;

        var n = 0;
        if (isAroundZero(a)) {
            if (isNotAroundZero(b)) {
                var t1 = -c / b;
                if (t1 >= 0 && t1 <=1) {
                    extrema[n++] = t1;
                }
            }
        }
        else {
            var disc = b * b - 4 * a * c;
            if (isAroundZero(disc)) {
                extrema[0] = -b / (2 * a);
            }
            else if (disc > 0) {
                var discSqrt = Math.sqrt(disc);
                var t1 = (-b + discSqrt) / (2 * a);
                var t2 = (-b - discSqrt) / (2 * a);
                if (t1 >= 0 && t1 <= 1) {
                    extrema[n++] = t1;
                }
                if (t2 >= 0 && t2 <= 1) {
                    extrema[n++] = t2;
                }
            }
        }
        return n;
    }

    /**
     * 细分三次贝塞尔曲线
     * @memberOf module:zrender/tool/curve
     * @param  {number} p0
     * @param  {number} p1
     * @param  {number} p2
     * @param  {number} p3
     * @param  {number} t
     * @param  {Array.<number>} out
     */
    function cubicSubdivide(p0, p1, p2, p3, t, out) {
        var p01 = (p1 - p0) * t + p0;
        var p12 = (p2 - p1) * t + p1;
        var p23 = (p3 - p2) * t + p2;

        var p012 = (p12 - p01) * t + p01;
        var p123 = (p23 - p12) * t + p12;

        var p0123 = (p123 - p012) * t + p012;
        // Seg0
        out[0] = p0;
        out[1] = p01;
        out[2] = p012;
        out[3] = p0123;
        // Seg1
        out[4] = p0123;
        out[5] = p123;
        out[6] = p23;
        out[7] = p3;
    }

    /**
     * 投射点到三次贝塞尔曲线上，返回投射距离。
     * 投射点有可能会有一个或者多个，这里只返回其中距离最短的一个。
     * @param {number} x0
     * @param {number} y0
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     * @param {number} x3
     * @param {number} y3
     * @param {number} x
     * @param {number} y
     * @param {Array.<number>} [out] 投射点
     * @return {number}
     */
    function cubicProjectPoint(
        x0, y0, x1, y1, x2, y2, x3, y3,
        x, y, out
    ) {
        // http://pomax.github.io/bezierinfo/#projections
        var t;
        var interval = 0.005;
        var d = Infinity;

        _v0[0] = x;
        _v0[1] = y;

        // 先粗略估计一下可能的最小距离的 t 值
        // PENDING
        for (var _t = 0; _t < 1; _t += 0.05) {
            _v1[0] = cubicAt(x0, x1, x2, x3, _t);
            _v1[1] = cubicAt(y0, y1, y2, y3, _t);
            var d1 = vector.distSquare(_v0, _v1);
            if (d1 < d) {
                t = _t;
                d = d1;
            }
        }
        d = Infinity;

        // At most 32 iteration
        for (var i = 0; i < 32; i++) {
            if (interval < EPSILON) {
                break;
            }
            var prev = t - interval;
            var next = t + interval;
            // t - interval
            _v1[0] = cubicAt(x0, x1, x2, x3, prev);
            _v1[1] = cubicAt(y0, y1, y2, y3, prev);

            var d1 = vector.distSquare(_v1, _v0);

            if (prev >= 0 && d1 < d) {
                t = prev;
                d = d1;
            }
            else {
                // t + interval
                _v2[0] = cubicAt(x0, x1, x2, x3, next);
                _v2[1] = cubicAt(y0, y1, y2, y3, next);
                var d2 = vector.distSquare(_v2, _v0);

                if (next <= 1 && d2 < d) {
                    t = next;
                    d = d2;
                }
                else {
                    interval *= 0.5;
                }
            }
        }
        // t
        if (out) {
            out[0] = cubicAt(x0, x1, x2, x3, t);
            out[1] = cubicAt(y0, y1, y2, y3, t);   
        }
        // console.log(interval, i);
        return Math.sqrt(d);
    }

    /**
     * 计算二次方贝塞尔值
     * @param  {number} p0
     * @param  {number} p1
     * @param  {number} p2
     * @param  {number} t
     * @return {number}
     */
    function quadraticAt(p0, p1, p2, t) {
        var onet = 1 - t;
        return onet * (onet * p0 + 2 * t * p1) + t * t * p2;
    }

    /**
     * 计算二次方贝塞尔导数值
     * @param  {number} p0
     * @param  {number} p1
     * @param  {number} p2
     * @param  {number} t
     * @return {number}
     */
    function quadraticDerivativeAt(p0, p1, p2, t) {
        return 2 * ((1 - t) * (p1 - p0) + t * (p2 - p1));
    }

    /**
     * 计算二次方贝塞尔方程根
     * @param  {number} p0
     * @param  {number} p1
     * @param  {number} p2
     * @param  {number} t
     * @param  {Array.<number>} roots
     * @return {number} 有效根数目
     */
    function quadraticRootAt(p0, p1, p2, val, roots) {
        var a = p0 - 2 * p1 + p2;
        var b = 2 * (p1 - p0);
        var c = p0 - val;

        var n = 0;
        if (isAroundZero(a)) {
            if (isNotAroundZero(b)) {
                var t1 = -c / b;
                if (t1 >= 0 && t1 <= 1) {
                    roots[n++] = t1;
                }
            }
        }
        else {
            var disc = b * b - 4 * a * c;
            if (isAroundZero(disc)) {
                var t1 = -b / (2 * a);
                if (t1 >= 0 && t1 <= 1) {
                    roots[n++] = t1;
                }
            }
            else if (disc > 0) {
                var discSqrt = Math.sqrt(disc);
                var t1 = (-b + discSqrt) / (2 * a);
                var t2 = (-b - discSqrt) / (2 * a);
                if (t1 >= 0 && t1 <= 1) {
                    roots[n++] = t1;
                }
                if (t2 >= 0 && t2 <= 1) {
                    roots[n++] = t2;
                }
            }
        }
        return n;
    }

    /**
     * 计算二次贝塞尔方程极限值
     * @memberOf module:zrender/tool/curve
     * @param  {number} p0
     * @param  {number} p1
     * @param  {number} p2
     * @return {number}
     */
    function quadraticExtremum(p0, p1, p2) {
        var divider = p0 + p2 - 2 * p1;
        if (divider === 0) {
            // p1 is center of p0 and p2 
            return 0.5;
        }
        else {
            return (p0 - p1) / divider;
        }
    }

    /**
     * 细分二次贝塞尔曲线
     * @memberOf module:zrender/tool/curve
     * @param  {number} p0
     * @param  {number} p1
     * @param  {number} p2
     * @param  {number} t
     * @param  {Array.<number>} out
     */
    function quadraticSubdivide(p0, p1, p2, t, out) {
        var p01 = (p1 - p0) * t + p0;
        var p12 = (p2 - p1) * t + p1;
        var p012 = (p12 - p01) * t + p01;

        // Seg0
        out[0] = p0;
        out[1] = p01;
        out[2] = p012;

        // Seg1
        out[3] = p012;
        out[4] = p12;
        out[5] = p2;
    }

    /**
     * 投射点到二次贝塞尔曲线上，返回投射距离。
     * 投射点有可能会有一个或者多个，这里只返回其中距离最短的一个。
     * @param {number} x0
     * @param {number} y0
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     * @param {number} x
     * @param {number} y
     * @param {Array.<number>} out 投射点
     * @return {number}
     */
    function quadraticProjectPoint(
        x0, y0, x1, y1, x2, y2,
        x, y, out
    ) {
        // http://pomax.github.io/bezierinfo/#projections
        var t;
        var interval = 0.005;
        var d = Infinity;

        _v0[0] = x;
        _v0[1] = y;

        // 先粗略估计一下可能的最小距离的 t 值
        // PENDING
        for (var _t = 0; _t < 1; _t += 0.05) {
            _v1[0] = quadraticAt(x0, x1, x2, _t);
            _v1[1] = quadraticAt(y0, y1, y2, _t);
            var d1 = vector.distSquare(_v0, _v1);
            if (d1 < d) {
                t = _t;
                d = d1;
            }
        }
        d = Infinity;

        // At most 32 iteration
        for (var i = 0; i < 32; i++) {
            if (interval < EPSILON) {
                break;
            }
            var prev = t - interval;
            var next = t + interval;
            // t - interval
            _v1[0] = quadraticAt(x0, x1, x2, prev);
            _v1[1] = quadraticAt(y0, y1, y2, prev);

            var d1 = vector.distSquare(_v1, _v0);

            if (prev >= 0 && d1 < d) {
                t = prev;
                d = d1;
            }
            else {
                // t + interval
                _v2[0] = quadraticAt(x0, x1, x2, next);
                _v2[1] = quadraticAt(y0, y1, y2, next);
                var d2 = vector.distSquare(_v2, _v0);
                if (next <= 1 && d2 < d) {
                    t = next;
                    d = d2;
                }
                else {
                    interval *= 0.5;
                }
            }
        }
        // t
        if (out) {
            out[0] = quadraticAt(x0, x1, x2, t);
            out[1] = quadraticAt(y0, y1, y2, t);   
        }
        // console.log(interval, i);
        return Math.sqrt(d);
    }

    return {

        cubicAt: cubicAt,

        cubicDerivativeAt: cubicDerivativeAt,

        cubicRootAt: cubicRootAt,

        cubicExtrema: cubicExtrema,

        cubicSubdivide: cubicSubdivide,

        cubicProjectPoint: cubicProjectPoint,

        quadraticAt: quadraticAt,

        quadraticDerivativeAt: quadraticDerivativeAt,

        quadraticRootAt: quadraticRootAt,

        quadraticExtremum: quadraticExtremum,

        quadraticSubdivide: quadraticSubdivide,

        quadraticProjectPoint: quadraticProjectPoint
    };
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3Rvb2wvY3VydmUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiDmm7Lnur/ovoXliqnmqKHlnZdcbiAqIEBtb2R1bGUgenJlbmRlci90b29sL2N1cnZlXG4gKiBAYXV0aG9yIHBpc3NhbmcoaHR0cHM6Ly93d3cuZ2l0aHViLmNvbS9waXNzYW5nKVxuICovXG5kZWZpbmUoZnVuY3Rpb24ocmVxdWlyZSkge1xuXG4gICAgdmFyIHZlY3RvciA9IHJlcXVpcmUoJy4vdmVjdG9yJyk7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgRVBTSUxPTiA9IDFlLTQ7XG5cbiAgICB2YXIgVEhSRUVfU1FSVCA9IE1hdGguc3FydCgzKTtcbiAgICB2YXIgT05FX1RISVJEID0gMSAvIDM7XG5cbiAgICAvLyDkuLTml7blj5jph49cbiAgICB2YXIgX3YwID0gdmVjdG9yLmNyZWF0ZSgpO1xuICAgIHZhciBfdjEgPSB2ZWN0b3IuY3JlYXRlKCk7XG4gICAgdmFyIF92MiA9IHZlY3Rvci5jcmVhdGUoKTtcbiAgICAvLyB2YXIgX3YzID0gdmVjdG9yLmNyZWF0ZSgpO1xuXG4gICAgZnVuY3Rpb24gaXNBcm91bmRaZXJvKHZhbCkge1xuICAgICAgICByZXR1cm4gdmFsID4gLUVQU0lMT04gJiYgdmFsIDwgRVBTSUxPTjtcbiAgICB9XG4gICAgZnVuY3Rpb24gaXNOb3RBcm91bmRaZXJvKHZhbCkge1xuICAgICAgICByZXR1cm4gdmFsID4gRVBTSUxPTiB8fCB2YWwgPCAtRVBTSUxPTjtcbiAgICB9XG4gICAgLypcbiAgICBmdW5jdGlvbiBldmFsQ3ViaWNDb2VmZihhLCBiLCBjLCBkLCB0KSB7XG4gICAgICAgIHJldHVybiAoKGEgKiB0ICsgYikgKiB0ICsgYykgKiB0ICsgZDtcbiAgICB9XG4gICAgKi9cblxuICAgIC8qKiBcbiAgICAgKiDorqHnrpfkuInmrKHotJ3loZ7lsJTlgLxcbiAgICAgKiBAbWVtYmVyT2YgbW9kdWxlOnpyZW5kZXIvdG9vbC9jdXJ2ZVxuICAgICAqIEBwYXJhbSAge251bWJlcn0gcDBcbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9IHAxXG4gICAgICogQHBhcmFtICB7bnVtYmVyfSBwMlxuICAgICAqIEBwYXJhbSAge251bWJlcn0gcDNcbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9IHRcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAgICovXG4gICAgZnVuY3Rpb24gY3ViaWNBdChwMCwgcDEsIHAyLCBwMywgdCkge1xuICAgICAgICB2YXIgb25ldCA9IDEgLSB0O1xuICAgICAgICByZXR1cm4gb25ldCAqIG9uZXQgKiAob25ldCAqIHAwICsgMyAqIHQgKiBwMSlcbiAgICAgICAgICAgICArIHQgKiB0ICogKHQgKiBwMyArIDMgKiBvbmV0ICogcDIpO1xuICAgIH1cblxuICAgIC8qKiBcbiAgICAgKiDorqHnrpfkuInmrKHotJ3loZ7lsJTlr7zmlbDlgLxcbiAgICAgKiBAbWVtYmVyT2YgbW9kdWxlOnpyZW5kZXIvdG9vbC9jdXJ2ZVxuICAgICAqIEBwYXJhbSAge251bWJlcn0gcDBcbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9IHAxXG4gICAgICogQHBhcmFtICB7bnVtYmVyfSBwMlxuICAgICAqIEBwYXJhbSAge251bWJlcn0gcDNcbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9IHRcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAgICovXG4gICAgZnVuY3Rpb24gY3ViaWNEZXJpdmF0aXZlQXQocDAsIHAxLCBwMiwgcDMsIHQpIHtcbiAgICAgICAgdmFyIG9uZXQgPSAxIC0gdDtcbiAgICAgICAgcmV0dXJuIDMgKiAoXG4gICAgICAgICAgICAoKHAxIC0gcDApICogb25ldCArIDIgKiAocDIgLSBwMSkgKiB0KSAqIG9uZXRcbiAgICAgICAgICAgICsgKHAzIC0gcDIpICogdCAqIHRcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDorqHnrpfkuInmrKHotJ3loZ7lsJTmlrnnqIvmoLnvvIzkvb/nlKjnm5vph5HlhazlvI9cbiAgICAgKiBAbWVtYmVyT2YgbW9kdWxlOnpyZW5kZXIvdG9vbC9jdXJ2ZVxuICAgICAqIEBwYXJhbSAge251bWJlcn0gcDBcbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9IHAxXG4gICAgICogQHBhcmFtICB7bnVtYmVyfSBwMlxuICAgICAqIEBwYXJhbSAge251bWJlcn0gcDNcbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9IHZhbFxuICAgICAqIEBwYXJhbSAge0FycmF5LjxudW1iZXI+fSByb290c1xuICAgICAqIEByZXR1cm4ge251bWJlcn0g5pyJ5pWI5qC55pWw55uuXG4gICAgICovXG4gICAgZnVuY3Rpb24gY3ViaWNSb290QXQocDAsIHAxLCBwMiwgcDMsIHZhbCwgcm9vdHMpIHtcbiAgICAgICAgLy8gRXZhbHVhdGUgcm9vdHMgb2YgY3ViaWMgZnVuY3Rpb25zXG4gICAgICAgIHZhciBhID0gcDMgKyAzICogKHAxIC0gcDIpIC0gcDA7XG4gICAgICAgIHZhciBiID0gMyAqIChwMiAtIHAxICogMiArIHAwKTtcbiAgICAgICAgdmFyIGMgPSAzICogKHAxICAtIHAwKTtcbiAgICAgICAgdmFyIGQgPSBwMCAtIHZhbDtcblxuICAgICAgICB2YXIgQSA9IGIgKiBiIC0gMyAqIGEgKiBjO1xuICAgICAgICB2YXIgQiA9IGIgKiBjIC0gOSAqIGEgKiBkO1xuICAgICAgICB2YXIgQyA9IGMgKiBjIC0gMyAqIGIgKiBkO1xuXG4gICAgICAgIHZhciBuID0gMDtcblxuICAgICAgICBpZiAoaXNBcm91bmRaZXJvKEEpICYmIGlzQXJvdW5kWmVybyhCKSkge1xuICAgICAgICAgICAgaWYgKGlzQXJvdW5kWmVybyhiKSkge1xuICAgICAgICAgICAgICAgIHJvb3RzWzBdID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciB0MSA9IC1jIC8gYjsgIC8vdDEsIHQyLCB0MywgYiBpcyBub3QgemVyb1xuICAgICAgICAgICAgICAgIGlmICh0MSA+PSAwICYmIHQxIDw9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgcm9vdHNbbisrXSA9IHQxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBkaXNjID0gQiAqIEIgLSA0ICogQSAqIEM7XG5cbiAgICAgICAgICAgIGlmIChpc0Fyb3VuZFplcm8oZGlzYykpIHtcbiAgICAgICAgICAgICAgICB2YXIgSyA9IEIgLyBBO1xuICAgICAgICAgICAgICAgIHZhciB0MSA9IC1iIC8gYSArIEs7ICAvLyB0MSwgYSBpcyBub3QgemVyb1xuICAgICAgICAgICAgICAgIHZhciB0MiA9IC1LIC8gMjsgIC8vIHQyLCB0M1xuICAgICAgICAgICAgICAgIGlmICh0MSA+PSAwICYmIHQxIDw9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgcm9vdHNbbisrXSA9IHQxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodDIgPj0gMCAmJiB0MiA8PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHJvb3RzW24rK10gPSB0MjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChkaXNjID4gMCkge1xuICAgICAgICAgICAgICAgIHZhciBkaXNjU3FydCA9IE1hdGguc3FydChkaXNjKTtcbiAgICAgICAgICAgICAgICB2YXIgWTEgPSBBICogYiArIDEuNSAqIGEgKiAoLUIgKyBkaXNjU3FydCk7XG4gICAgICAgICAgICAgICAgdmFyIFkyID0gQSAqIGIgKyAxLjUgKiBhICogKC1CIC0gZGlzY1NxcnQpO1xuICAgICAgICAgICAgICAgIGlmIChZMSA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgWTEgPSAtTWF0aC5wb3coLVkxLCBPTkVfVEhJUkQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgWTEgPSBNYXRoLnBvdyhZMSwgT05FX1RISVJEKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKFkyIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICBZMiA9IC1NYXRoLnBvdygtWTIsIE9ORV9USElSRCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBZMiA9IE1hdGgucG93KFkyLCBPTkVfVEhJUkQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgdDEgPSAoLWIgLSAoWTEgKyBZMikpIC8gKDMgKiBhKTtcbiAgICAgICAgICAgICAgICBpZiAodDEgPj0gMCAmJiB0MSA8PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHJvb3RzW24rK10gPSB0MTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgVCA9ICgyICogQSAqIGIgLSAzICogYSAqIEIpIC8gKDIgKiBNYXRoLnNxcnQoQSAqIEEgKiBBKSk7XG4gICAgICAgICAgICAgICAgdmFyIHRoZXRhID0gTWF0aC5hY29zKFQpIC8gMztcbiAgICAgICAgICAgICAgICB2YXIgQVNxcnQgPSBNYXRoLnNxcnQoQSk7XG4gICAgICAgICAgICAgICAgdmFyIHRtcCA9IE1hdGguY29zKHRoZXRhKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB2YXIgdDEgPSAoLWIgLSAyICogQVNxcnQgKiB0bXApIC8gKDMgKiBhKTtcbiAgICAgICAgICAgICAgICB2YXIgdDIgPSAoLWIgKyBBU3FydCAqICh0bXAgKyBUSFJFRV9TUVJUICogTWF0aC5zaW4odGhldGEpKSkgLyAoMyAqIGEpO1xuICAgICAgICAgICAgICAgIHZhciB0MyA9ICgtYiArIEFTcXJ0ICogKHRtcCAtIFRIUkVFX1NRUlQgKiBNYXRoLnNpbih0aGV0YSkpKSAvICgzICogYSk7XG4gICAgICAgICAgICAgICAgaWYgKHQxID49IDAgJiYgdDEgPD0gMSkge1xuICAgICAgICAgICAgICAgICAgICByb290c1tuKytdID0gdDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0MiA+PSAwICYmIHQyIDw9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgcm9vdHNbbisrXSA9IHQyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodDMgPj0gMCAmJiB0MyA8PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHJvb3RzW24rK10gPSB0MztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG47XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6K6h566X5LiJ5qyh6LSd5aGe5bCU5pa556iL5p6B6ZmQ5YC855qE5L2N572uXG4gICAgICogQG1lbWJlck9mIG1vZHVsZTp6cmVuZGVyL3Rvb2wvY3VydmVcbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9IHAwXG4gICAgICogQHBhcmFtICB7bnVtYmVyfSBwMVxuICAgICAqIEBwYXJhbSAge251bWJlcn0gcDJcbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9IHAzXG4gICAgICogQHBhcmFtICB7QXJyYXkuPG51bWJlcj59IGV4dHJlbWFcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IOacieaViOaVsOebrlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGN1YmljRXh0cmVtYShwMCwgcDEsIHAyLCBwMywgZXh0cmVtYSkge1xuICAgICAgICB2YXIgYiA9IDYgKiBwMiAtIDEyICogcDEgKyA2ICogcDA7XG4gICAgICAgIHZhciBhID0gOSAqIHAxICsgMyAqIHAzIC0gMyAqIHAwIC0gOSAqIHAyO1xuICAgICAgICB2YXIgYyA9IDMgKiBwMSAtIDMgKiBwMDtcblxuICAgICAgICB2YXIgbiA9IDA7XG4gICAgICAgIGlmIChpc0Fyb3VuZFplcm8oYSkpIHtcbiAgICAgICAgICAgIGlmIChpc05vdEFyb3VuZFplcm8oYikpIHtcbiAgICAgICAgICAgICAgICB2YXIgdDEgPSAtYyAvIGI7XG4gICAgICAgICAgICAgICAgaWYgKHQxID49IDAgJiYgdDEgPD0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGV4dHJlbWFbbisrXSA9IHQxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBkaXNjID0gYiAqIGIgLSA0ICogYSAqIGM7XG4gICAgICAgICAgICBpZiAoaXNBcm91bmRaZXJvKGRpc2MpKSB7XG4gICAgICAgICAgICAgICAgZXh0cmVtYVswXSA9IC1iIC8gKDIgKiBhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGRpc2MgPiAwKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRpc2NTcXJ0ID0gTWF0aC5zcXJ0KGRpc2MpO1xuICAgICAgICAgICAgICAgIHZhciB0MSA9ICgtYiArIGRpc2NTcXJ0KSAvICgyICogYSk7XG4gICAgICAgICAgICAgICAgdmFyIHQyID0gKC1iIC0gZGlzY1NxcnQpIC8gKDIgKiBhKTtcbiAgICAgICAgICAgICAgICBpZiAodDEgPj0gMCAmJiB0MSA8PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGV4dHJlbWFbbisrXSA9IHQxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodDIgPj0gMCAmJiB0MiA8PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGV4dHJlbWFbbisrXSA9IHQyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDnu4bliIbkuInmrKHotJ3loZ7lsJTmm7Lnur9cbiAgICAgKiBAbWVtYmVyT2YgbW9kdWxlOnpyZW5kZXIvdG9vbC9jdXJ2ZVxuICAgICAqIEBwYXJhbSAge251bWJlcn0gcDBcbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9IHAxXG4gICAgICogQHBhcmFtICB7bnVtYmVyfSBwMlxuICAgICAqIEBwYXJhbSAge251bWJlcn0gcDNcbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9IHRcbiAgICAgKiBAcGFyYW0gIHtBcnJheS48bnVtYmVyPn0gb3V0XG4gICAgICovXG4gICAgZnVuY3Rpb24gY3ViaWNTdWJkaXZpZGUocDAsIHAxLCBwMiwgcDMsIHQsIG91dCkge1xuICAgICAgICB2YXIgcDAxID0gKHAxIC0gcDApICogdCArIHAwO1xuICAgICAgICB2YXIgcDEyID0gKHAyIC0gcDEpICogdCArIHAxO1xuICAgICAgICB2YXIgcDIzID0gKHAzIC0gcDIpICogdCArIHAyO1xuXG4gICAgICAgIHZhciBwMDEyID0gKHAxMiAtIHAwMSkgKiB0ICsgcDAxO1xuICAgICAgICB2YXIgcDEyMyA9IChwMjMgLSBwMTIpICogdCArIHAxMjtcblxuICAgICAgICB2YXIgcDAxMjMgPSAocDEyMyAtIHAwMTIpICogdCArIHAwMTI7XG4gICAgICAgIC8vIFNlZzBcbiAgICAgICAgb3V0WzBdID0gcDA7XG4gICAgICAgIG91dFsxXSA9IHAwMTtcbiAgICAgICAgb3V0WzJdID0gcDAxMjtcbiAgICAgICAgb3V0WzNdID0gcDAxMjM7XG4gICAgICAgIC8vIFNlZzFcbiAgICAgICAgb3V0WzRdID0gcDAxMjM7XG4gICAgICAgIG91dFs1XSA9IHAxMjM7XG4gICAgICAgIG91dFs2XSA9IHAyMztcbiAgICAgICAgb3V0WzddID0gcDM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5oqV5bCE54K55Yiw5LiJ5qyh6LSd5aGe5bCU5puy57q/5LiK77yM6L+U5Zue5oqV5bCE6Led56a744CCXG4gICAgICog5oqV5bCE54K55pyJ5Y+v6IO95Lya5pyJ5LiA5Liq5oiW6ICF5aSa5Liq77yM6L+Z6YeM5Y+q6L+U5Zue5YW25Lit6Led56a75pyA55+t55qE5LiA5Liq44CCXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHgwXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHkwXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHgxXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHkxXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHgyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHkyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHgzXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHkzXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHhcbiAgICAgKiBAcGFyYW0ge251bWJlcn0geVxuICAgICAqIEBwYXJhbSB7QXJyYXkuPG51bWJlcj59IFtvdXRdIOaKleWwhOeCuVxuICAgICAqIEByZXR1cm4ge251bWJlcn1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBjdWJpY1Byb2plY3RQb2ludChcbiAgICAgICAgeDAsIHkwLCB4MSwgeTEsIHgyLCB5MiwgeDMsIHkzLFxuICAgICAgICB4LCB5LCBvdXRcbiAgICApIHtcbiAgICAgICAgLy8gaHR0cDovL3BvbWF4LmdpdGh1Yi5pby9iZXppZXJpbmZvLyNwcm9qZWN0aW9uc1xuICAgICAgICB2YXIgdDtcbiAgICAgICAgdmFyIGludGVydmFsID0gMC4wMDU7XG4gICAgICAgIHZhciBkID0gSW5maW5pdHk7XG5cbiAgICAgICAgX3YwWzBdID0geDtcbiAgICAgICAgX3YwWzFdID0geTtcblxuICAgICAgICAvLyDlhYjnspfnlaXkvLDorqHkuIDkuIvlj6/og73nmoTmnIDlsI/ot53nprvnmoQgdCDlgLxcbiAgICAgICAgLy8gUEVORElOR1xuICAgICAgICBmb3IgKHZhciBfdCA9IDA7IF90IDwgMTsgX3QgKz0gMC4wNSkge1xuICAgICAgICAgICAgX3YxWzBdID0gY3ViaWNBdCh4MCwgeDEsIHgyLCB4MywgX3QpO1xuICAgICAgICAgICAgX3YxWzFdID0gY3ViaWNBdCh5MCwgeTEsIHkyLCB5MywgX3QpO1xuICAgICAgICAgICAgdmFyIGQxID0gdmVjdG9yLmRpc3RTcXVhcmUoX3YwLCBfdjEpO1xuICAgICAgICAgICAgaWYgKGQxIDwgZCkge1xuICAgICAgICAgICAgICAgIHQgPSBfdDtcbiAgICAgICAgICAgICAgICBkID0gZDE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZCA9IEluZmluaXR5O1xuXG4gICAgICAgIC8vIEF0IG1vc3QgMzIgaXRlcmF0aW9uXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMzI7IGkrKykge1xuICAgICAgICAgICAgaWYgKGludGVydmFsIDwgRVBTSUxPTikge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHByZXYgPSB0IC0gaW50ZXJ2YWw7XG4gICAgICAgICAgICB2YXIgbmV4dCA9IHQgKyBpbnRlcnZhbDtcbiAgICAgICAgICAgIC8vIHQgLSBpbnRlcnZhbFxuICAgICAgICAgICAgX3YxWzBdID0gY3ViaWNBdCh4MCwgeDEsIHgyLCB4MywgcHJldik7XG4gICAgICAgICAgICBfdjFbMV0gPSBjdWJpY0F0KHkwLCB5MSwgeTIsIHkzLCBwcmV2KTtcblxuICAgICAgICAgICAgdmFyIGQxID0gdmVjdG9yLmRpc3RTcXVhcmUoX3YxLCBfdjApO1xuXG4gICAgICAgICAgICBpZiAocHJldiA+PSAwICYmIGQxIDwgZCkge1xuICAgICAgICAgICAgICAgIHQgPSBwcmV2O1xuICAgICAgICAgICAgICAgIGQgPSBkMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIHQgKyBpbnRlcnZhbFxuICAgICAgICAgICAgICAgIF92MlswXSA9IGN1YmljQXQoeDAsIHgxLCB4MiwgeDMsIG5leHQpO1xuICAgICAgICAgICAgICAgIF92MlsxXSA9IGN1YmljQXQoeTAsIHkxLCB5MiwgeTMsIG5leHQpO1xuICAgICAgICAgICAgICAgIHZhciBkMiA9IHZlY3Rvci5kaXN0U3F1YXJlKF92MiwgX3YwKTtcblxuICAgICAgICAgICAgICAgIGlmIChuZXh0IDw9IDEgJiYgZDIgPCBkKSB7XG4gICAgICAgICAgICAgICAgICAgIHQgPSBuZXh0O1xuICAgICAgICAgICAgICAgICAgICBkID0gZDI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpbnRlcnZhbCAqPSAwLjU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIHRcbiAgICAgICAgaWYgKG91dCkge1xuICAgICAgICAgICAgb3V0WzBdID0gY3ViaWNBdCh4MCwgeDEsIHgyLCB4MywgdCk7XG4gICAgICAgICAgICBvdXRbMV0gPSBjdWJpY0F0KHkwLCB5MSwgeTIsIHkzLCB0KTsgICBcbiAgICAgICAgfVxuICAgICAgICAvLyBjb25zb2xlLmxvZyhpbnRlcnZhbCwgaSk7XG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQoZCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6K6h566X5LqM5qyh5pa56LSd5aGe5bCU5YC8XG4gICAgICogQHBhcmFtICB7bnVtYmVyfSBwMFxuICAgICAqIEBwYXJhbSAge251bWJlcn0gcDFcbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9IHAyXG4gICAgICogQHBhcmFtICB7bnVtYmVyfSB0XG4gICAgICogQHJldHVybiB7bnVtYmVyfVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHF1YWRyYXRpY0F0KHAwLCBwMSwgcDIsIHQpIHtcbiAgICAgICAgdmFyIG9uZXQgPSAxIC0gdDtcbiAgICAgICAgcmV0dXJuIG9uZXQgKiAob25ldCAqIHAwICsgMiAqIHQgKiBwMSkgKyB0ICogdCAqIHAyO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOiuoeeul+S6jOasoeaWuei0neWhnuWwlOWvvOaVsOWAvFxuICAgICAqIEBwYXJhbSAge251bWJlcn0gcDBcbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9IHAxXG4gICAgICogQHBhcmFtICB7bnVtYmVyfSBwMlxuICAgICAqIEBwYXJhbSAge251bWJlcn0gdFxuICAgICAqIEByZXR1cm4ge251bWJlcn1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBxdWFkcmF0aWNEZXJpdmF0aXZlQXQocDAsIHAxLCBwMiwgdCkge1xuICAgICAgICByZXR1cm4gMiAqICgoMSAtIHQpICogKHAxIC0gcDApICsgdCAqIChwMiAtIHAxKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6K6h566X5LqM5qyh5pa56LSd5aGe5bCU5pa556iL5qC5XG4gICAgICogQHBhcmFtICB7bnVtYmVyfSBwMFxuICAgICAqIEBwYXJhbSAge251bWJlcn0gcDFcbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9IHAyXG4gICAgICogQHBhcmFtICB7bnVtYmVyfSB0XG4gICAgICogQHBhcmFtICB7QXJyYXkuPG51bWJlcj59IHJvb3RzXG4gICAgICogQHJldHVybiB7bnVtYmVyfSDmnInmlYjmoLnmlbDnm65cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBxdWFkcmF0aWNSb290QXQocDAsIHAxLCBwMiwgdmFsLCByb290cykge1xuICAgICAgICB2YXIgYSA9IHAwIC0gMiAqIHAxICsgcDI7XG4gICAgICAgIHZhciBiID0gMiAqIChwMSAtIHAwKTtcbiAgICAgICAgdmFyIGMgPSBwMCAtIHZhbDtcblxuICAgICAgICB2YXIgbiA9IDA7XG4gICAgICAgIGlmIChpc0Fyb3VuZFplcm8oYSkpIHtcbiAgICAgICAgICAgIGlmIChpc05vdEFyb3VuZFplcm8oYikpIHtcbiAgICAgICAgICAgICAgICB2YXIgdDEgPSAtYyAvIGI7XG4gICAgICAgICAgICAgICAgaWYgKHQxID49IDAgJiYgdDEgPD0gMSkge1xuICAgICAgICAgICAgICAgICAgICByb290c1tuKytdID0gdDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIGRpc2MgPSBiICogYiAtIDQgKiBhICogYztcbiAgICAgICAgICAgIGlmIChpc0Fyb3VuZFplcm8oZGlzYykpIHtcbiAgICAgICAgICAgICAgICB2YXIgdDEgPSAtYiAvICgyICogYSk7XG4gICAgICAgICAgICAgICAgaWYgKHQxID49IDAgJiYgdDEgPD0gMSkge1xuICAgICAgICAgICAgICAgICAgICByb290c1tuKytdID0gdDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoZGlzYyA+IDApIHtcbiAgICAgICAgICAgICAgICB2YXIgZGlzY1NxcnQgPSBNYXRoLnNxcnQoZGlzYyk7XG4gICAgICAgICAgICAgICAgdmFyIHQxID0gKC1iICsgZGlzY1NxcnQpIC8gKDIgKiBhKTtcbiAgICAgICAgICAgICAgICB2YXIgdDIgPSAoLWIgLSBkaXNjU3FydCkgLyAoMiAqIGEpO1xuICAgICAgICAgICAgICAgIGlmICh0MSA+PSAwICYmIHQxIDw9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgcm9vdHNbbisrXSA9IHQxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodDIgPj0gMCAmJiB0MiA8PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHJvb3RzW24rK10gPSB0MjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG47XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6K6h566X5LqM5qyh6LSd5aGe5bCU5pa556iL5p6B6ZmQ5YC8XG4gICAgICogQG1lbWJlck9mIG1vZHVsZTp6cmVuZGVyL3Rvb2wvY3VydmVcbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9IHAwXG4gICAgICogQHBhcmFtICB7bnVtYmVyfSBwMVxuICAgICAqIEBwYXJhbSAge251bWJlcn0gcDJcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAgICovXG4gICAgZnVuY3Rpb24gcXVhZHJhdGljRXh0cmVtdW0ocDAsIHAxLCBwMikge1xuICAgICAgICB2YXIgZGl2aWRlciA9IHAwICsgcDIgLSAyICogcDE7XG4gICAgICAgIGlmIChkaXZpZGVyID09PSAwKSB7XG4gICAgICAgICAgICAvLyBwMSBpcyBjZW50ZXIgb2YgcDAgYW5kIHAyIFxuICAgICAgICAgICAgcmV0dXJuIDAuNTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiAocDAgLSBwMSkgLyBkaXZpZGVyO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog57uG5YiG5LqM5qyh6LSd5aGe5bCU5puy57q/XG4gICAgICogQG1lbWJlck9mIG1vZHVsZTp6cmVuZGVyL3Rvb2wvY3VydmVcbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9IHAwXG4gICAgICogQHBhcmFtICB7bnVtYmVyfSBwMVxuICAgICAqIEBwYXJhbSAge251bWJlcn0gcDJcbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9IHRcbiAgICAgKiBAcGFyYW0gIHtBcnJheS48bnVtYmVyPn0gb3V0XG4gICAgICovXG4gICAgZnVuY3Rpb24gcXVhZHJhdGljU3ViZGl2aWRlKHAwLCBwMSwgcDIsIHQsIG91dCkge1xuICAgICAgICB2YXIgcDAxID0gKHAxIC0gcDApICogdCArIHAwO1xuICAgICAgICB2YXIgcDEyID0gKHAyIC0gcDEpICogdCArIHAxO1xuICAgICAgICB2YXIgcDAxMiA9IChwMTIgLSBwMDEpICogdCArIHAwMTtcblxuICAgICAgICAvLyBTZWcwXG4gICAgICAgIG91dFswXSA9IHAwO1xuICAgICAgICBvdXRbMV0gPSBwMDE7XG4gICAgICAgIG91dFsyXSA9IHAwMTI7XG5cbiAgICAgICAgLy8gU2VnMVxuICAgICAgICBvdXRbM10gPSBwMDEyO1xuICAgICAgICBvdXRbNF0gPSBwMTI7XG4gICAgICAgIG91dFs1XSA9IHAyO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOaKleWwhOeCueWIsOS6jOasoei0neWhnuWwlOabsue6v+S4iu+8jOi/lOWbnuaKleWwhOi3neemu+OAglxuICAgICAqIOaKleWwhOeCueacieWPr+iDveS8muacieS4gOS4quaIluiAheWkmuS4qu+8jOi/memHjOWPqui/lOWbnuWFtuS4rei3neemu+acgOefreeahOS4gOS4quOAglxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB4MFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB5MFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB4MVxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB5MVxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB4MlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB5MlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB4XG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHlcbiAgICAgKiBAcGFyYW0ge0FycmF5LjxudW1iZXI+fSBvdXQg5oqV5bCE54K5XG4gICAgICogQHJldHVybiB7bnVtYmVyfVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHF1YWRyYXRpY1Byb2plY3RQb2ludChcbiAgICAgICAgeDAsIHkwLCB4MSwgeTEsIHgyLCB5MixcbiAgICAgICAgeCwgeSwgb3V0XG4gICAgKSB7XG4gICAgICAgIC8vIGh0dHA6Ly9wb21heC5naXRodWIuaW8vYmV6aWVyaW5mby8jcHJvamVjdGlvbnNcbiAgICAgICAgdmFyIHQ7XG4gICAgICAgIHZhciBpbnRlcnZhbCA9IDAuMDA1O1xuICAgICAgICB2YXIgZCA9IEluZmluaXR5O1xuXG4gICAgICAgIF92MFswXSA9IHg7XG4gICAgICAgIF92MFsxXSA9IHk7XG5cbiAgICAgICAgLy8g5YWI57KX55Wl5Lyw6K6h5LiA5LiL5Y+v6IO955qE5pyA5bCP6Led56a755qEIHQg5YC8XG4gICAgICAgIC8vIFBFTkRJTkdcbiAgICAgICAgZm9yICh2YXIgX3QgPSAwOyBfdCA8IDE7IF90ICs9IDAuMDUpIHtcbiAgICAgICAgICAgIF92MVswXSA9IHF1YWRyYXRpY0F0KHgwLCB4MSwgeDIsIF90KTtcbiAgICAgICAgICAgIF92MVsxXSA9IHF1YWRyYXRpY0F0KHkwLCB5MSwgeTIsIF90KTtcbiAgICAgICAgICAgIHZhciBkMSA9IHZlY3Rvci5kaXN0U3F1YXJlKF92MCwgX3YxKTtcbiAgICAgICAgICAgIGlmIChkMSA8IGQpIHtcbiAgICAgICAgICAgICAgICB0ID0gX3Q7XG4gICAgICAgICAgICAgICAgZCA9IGQxO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGQgPSBJbmZpbml0eTtcblxuICAgICAgICAvLyBBdCBtb3N0IDMyIGl0ZXJhdGlvblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDMyOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChpbnRlcnZhbCA8IEVQU0lMT04pIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBwcmV2ID0gdCAtIGludGVydmFsO1xuICAgICAgICAgICAgdmFyIG5leHQgPSB0ICsgaW50ZXJ2YWw7XG4gICAgICAgICAgICAvLyB0IC0gaW50ZXJ2YWxcbiAgICAgICAgICAgIF92MVswXSA9IHF1YWRyYXRpY0F0KHgwLCB4MSwgeDIsIHByZXYpO1xuICAgICAgICAgICAgX3YxWzFdID0gcXVhZHJhdGljQXQoeTAsIHkxLCB5MiwgcHJldik7XG5cbiAgICAgICAgICAgIHZhciBkMSA9IHZlY3Rvci5kaXN0U3F1YXJlKF92MSwgX3YwKTtcblxuICAgICAgICAgICAgaWYgKHByZXYgPj0gMCAmJiBkMSA8IGQpIHtcbiAgICAgICAgICAgICAgICB0ID0gcHJldjtcbiAgICAgICAgICAgICAgICBkID0gZDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyB0ICsgaW50ZXJ2YWxcbiAgICAgICAgICAgICAgICBfdjJbMF0gPSBxdWFkcmF0aWNBdCh4MCwgeDEsIHgyLCBuZXh0KTtcbiAgICAgICAgICAgICAgICBfdjJbMV0gPSBxdWFkcmF0aWNBdCh5MCwgeTEsIHkyLCBuZXh0KTtcbiAgICAgICAgICAgICAgICB2YXIgZDIgPSB2ZWN0b3IuZGlzdFNxdWFyZShfdjIsIF92MCk7XG4gICAgICAgICAgICAgICAgaWYgKG5leHQgPD0gMSAmJiBkMiA8IGQpIHtcbiAgICAgICAgICAgICAgICAgICAgdCA9IG5leHQ7XG4gICAgICAgICAgICAgICAgICAgIGQgPSBkMjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGludGVydmFsICo9IDAuNTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gdFxuICAgICAgICBpZiAob3V0KSB7XG4gICAgICAgICAgICBvdXRbMF0gPSBxdWFkcmF0aWNBdCh4MCwgeDEsIHgyLCB0KTtcbiAgICAgICAgICAgIG91dFsxXSA9IHF1YWRyYXRpY0F0KHkwLCB5MSwgeTIsIHQpOyAgIFxuICAgICAgICB9XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGludGVydmFsLCBpKTtcbiAgICAgICAgcmV0dXJuIE1hdGguc3FydChkKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuXG4gICAgICAgIGN1YmljQXQ6IGN1YmljQXQsXG5cbiAgICAgICAgY3ViaWNEZXJpdmF0aXZlQXQ6IGN1YmljRGVyaXZhdGl2ZUF0LFxuXG4gICAgICAgIGN1YmljUm9vdEF0OiBjdWJpY1Jvb3RBdCxcblxuICAgICAgICBjdWJpY0V4dHJlbWE6IGN1YmljRXh0cmVtYSxcblxuICAgICAgICBjdWJpY1N1YmRpdmlkZTogY3ViaWNTdWJkaXZpZGUsXG5cbiAgICAgICAgY3ViaWNQcm9qZWN0UG9pbnQ6IGN1YmljUHJvamVjdFBvaW50LFxuXG4gICAgICAgIHF1YWRyYXRpY0F0OiBxdWFkcmF0aWNBdCxcblxuICAgICAgICBxdWFkcmF0aWNEZXJpdmF0aXZlQXQ6IHF1YWRyYXRpY0Rlcml2YXRpdmVBdCxcblxuICAgICAgICBxdWFkcmF0aWNSb290QXQ6IHF1YWRyYXRpY1Jvb3RBdCxcblxuICAgICAgICBxdWFkcmF0aWNFeHRyZW11bTogcXVhZHJhdGljRXh0cmVtdW0sXG5cbiAgICAgICAgcXVhZHJhdGljU3ViZGl2aWRlOiBxdWFkcmF0aWNTdWJkaXZpZGUsXG5cbiAgICAgICAgcXVhZHJhdGljUHJvamVjdFBvaW50OiBxdWFkcmF0aWNQcm9qZWN0UG9pbnRcbiAgICB9O1xufSk7Il0sImZpbGUiOiJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3Rvb2wvY3VydmUuanMifQ==
