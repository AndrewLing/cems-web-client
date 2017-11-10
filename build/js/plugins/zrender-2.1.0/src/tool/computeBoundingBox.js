/**
 * @author Kener (@Kener-林峰, kener.linfeng@gmail.com)
 *         pissang(https://github.com/pissang)
 *         errorrik (errorrik@gmail.com)
 */
define(
    function (require) {
        var vec2 = require('./vector');
        var curve = require('./curve');

        /**
         * 从顶点数组中计算出最小包围盒，写入`min`和`max`中
         * @module zrender/tool/computeBoundingBox
         * @param {Array<Object>} points 顶点数组
         * @param {number} min
         * @param {number} max
         */
        function computeBoundingBox(points, min, max) {
            if (points.length === 0) {
                return;
            }
            var left = points[0][0];
            var right = points[0][0];
            var top = points[0][1];
            var bottom = points[0][1];
            
            for (var i = 1; i < points.length; i++) {
                var p = points[i];
                if (p[0] < left) {
                    left = p[0];
                }
                if (p[0] > right) {
                    right = p[0];
                }
                if (p[1] < top) {
                    top = p[1];
                }
                if (p[1] > bottom) {
                    bottom = p[1];
                }
            }

            min[0] = left;
            min[1] = top;
            max[0] = right;
            max[1] = bottom;
        }

        /**
         * 从三阶贝塞尔曲线(p0, p1, p2, p3)中计算出最小包围盒，写入`min`和`max`中
         * @memberOf module:zrender/tool/computeBoundingBox
         * @param {Array.<number>} p0
         * @param {Array.<number>} p1
         * @param {Array.<number>} p2
         * @param {Array.<number>} p3
         * @param {Array.<number>} min
         * @param {Array.<number>} max
         */
        function computeCubeBezierBoundingBox(p0, p1, p2, p3, min, max) {
            var xDim = [];
            curve.cubicExtrema(p0[0], p1[0], p2[0], p3[0], xDim);
            for (var i = 0; i < xDim.length; i++) {
                xDim[i] = curve.cubicAt(p0[0], p1[0], p2[0], p3[0], xDim[i]);
            }
            var yDim = [];
            curve.cubicExtrema(p0[1], p1[1], p2[1], p3[1], yDim);
            for (var i = 0; i < yDim.length; i++) {
                yDim[i] = curve.cubicAt(p0[1], p1[1], p2[1], p3[1], yDim[i]);
            }

            xDim.push(p0[0], p3[0]);
            yDim.push(p0[1], p3[1]);

            var left = Math.min.apply(null, xDim);
            var right = Math.max.apply(null, xDim);
            var top = Math.min.apply(null, yDim);
            var bottom = Math.max.apply(null, yDim);

            min[0] = left;
            min[1] = top;
            max[0] = right;
            max[1] = bottom;
        }

        /**
         * 从二阶贝塞尔曲线(p0, p1, p2)中计算出最小包围盒，写入`min`和`max`中
         * @memberOf module:zrender/tool/computeBoundingBox
         * @param {Array.<number>} p0
         * @param {Array.<number>} p1
         * @param {Array.<number>} p2
         * @param {Array.<number>} min
         * @param {Array.<number>} max
         */
        function computeQuadraticBezierBoundingBox(p0, p1, p2, min, max) {
            // Find extremities, where derivative in x dim or y dim is zero
            var t1 = curve.quadraticExtremum(p0[0], p1[0], p2[0]);
            var t2 = curve.quadraticExtremum(p0[1], p1[1], p2[1]);

            t1 = Math.max(Math.min(t1, 1), 0);
            t2 = Math.max(Math.min(t2, 1), 0);

            var ct1 = 1 - t1;
            var ct2 = 1 - t2;

            var x1 = ct1 * ct1 * p0[0] 
                     + 2 * ct1 * t1 * p1[0] 
                     + t1 * t1 * p2[0];
            var y1 = ct1 * ct1 * p0[1] 
                     + 2 * ct1 * t1 * p1[1] 
                     + t1 * t1 * p2[1];

            var x2 = ct2 * ct2 * p0[0] 
                     + 2 * ct2 * t2 * p1[0] 
                     + t2 * t2 * p2[0];
            var y2 = ct2 * ct2 * p0[1] 
                     + 2 * ct2 * t2 * p1[1] 
                     + t2 * t2 * p2[1];
            min[0] = Math.min(p0[0], p2[0], x1, x2);
            min[1] = Math.min(p0[1], p2[1], y1, y2);
            max[0] = Math.max(p0[0], p2[0], x1, x2);
            max[1] = Math.max(p0[1], p2[1], y1, y2);
        }

        var start = vec2.create();
        var end = vec2.create();
        var extremity = vec2.create();
        /**
         * 从圆弧中计算出最小包围盒，写入`min`和`max`中
         * @method
         * @memberOf module:zrender/tool/computeBoundingBox
         * @param {Array.<number>} center 圆弧中心点
         * @param {number} radius 圆弧半径
         * @param {number} startAngle 圆弧开始角度
         * @param {number} endAngle 圆弧结束角度
         * @param {number} anticlockwise 是否是顺时针
         * @param {Array.<number>} min
         * @param {Array.<number>} max
         */
        var computeArcBoundingBox = function (
            x, y, r, startAngle, endAngle, anticlockwise, min, max
        ) { 
            if (Math.abs(startAngle - endAngle) >= Math.PI * 2) {
                // Is a circle
                min[0] = x - r;
                min[1] = y - r;
                max[0] = x + r;
                max[1] = y + r;
                return;
            }

            start[0] = Math.cos(startAngle) * r + x;
            start[1] = Math.sin(startAngle) * r + y;

            end[0] = Math.cos(endAngle) * r + x;
            end[1] = Math.sin(endAngle) * r + y;

            vec2.min(min, start, end);
            vec2.max(max, start, end);
            
            // Thresh to [0, Math.PI * 2]
            startAngle = startAngle % (Math.PI * 2);
            if (startAngle < 0) {
                startAngle = startAngle + Math.PI * 2;
            }
            endAngle = endAngle % (Math.PI * 2);
            if (endAngle < 0) {
                endAngle = endAngle + Math.PI * 2;
            }

            if (startAngle > endAngle && !anticlockwise) {
                endAngle += Math.PI * 2;
            } else if (startAngle < endAngle && anticlockwise) {
                startAngle += Math.PI * 2;
            }
            if (anticlockwise) {
                var tmp = endAngle;
                endAngle = startAngle;
                startAngle = tmp;
            }

            // var number = 0;
            // var step = (anticlockwise ? -Math.PI : Math.PI) / 2;
            for (var angle = 0; angle < endAngle; angle += Math.PI / 2) {
                if (angle > startAngle) {
                    extremity[0] = Math.cos(angle) * r + x;
                    extremity[1] = Math.sin(angle) * r + y;

                    vec2.min(min, extremity, min);
                    vec2.max(max, extremity, max);
                }
            }
        };

        computeBoundingBox.cubeBezier = computeCubeBezierBoundingBox;
        computeBoundingBox.quadraticBezier = computeQuadraticBezierBoundingBox;
        computeBoundingBox.arc = computeArcBoundingBox;

        return computeBoundingBox;
    }
);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3Rvb2wvY29tcHV0ZUJvdW5kaW5nQm94LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGF1dGhvciBLZW5lciAoQEtlbmVyLeael+WzsCwga2VuZXIubGluZmVuZ0BnbWFpbC5jb20pXG4gKiAgICAgICAgIHBpc3NhbmcoaHR0cHM6Ly9naXRodWIuY29tL3Bpc3NhbmcpXG4gKiAgICAgICAgIGVycm9ycmlrIChlcnJvcnJpa0BnbWFpbC5jb20pXG4gKi9cbmRlZmluZShcbiAgICBmdW5jdGlvbiAocmVxdWlyZSkge1xuICAgICAgICB2YXIgdmVjMiA9IHJlcXVpcmUoJy4vdmVjdG9yJyk7XG4gICAgICAgIHZhciBjdXJ2ZSA9IHJlcXVpcmUoJy4vY3VydmUnKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICog5LuO6aG254K55pWw57uE5Lit6K6h566X5Ye65pyA5bCP5YyF5Zu055uS77yM5YaZ5YWlYG1pbmDlkoxgbWF4YOS4rVxuICAgICAgICAgKiBAbW9kdWxlIHpyZW5kZXIvdG9vbC9jb21wdXRlQm91bmRpbmdCb3hcbiAgICAgICAgICogQHBhcmFtIHtBcnJheTxPYmplY3Q+fSBwb2ludHMg6aG254K55pWw57uEXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBtaW5cbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IG1heFxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gY29tcHV0ZUJvdW5kaW5nQm94KHBvaW50cywgbWluLCBtYXgpIHtcbiAgICAgICAgICAgIGlmIChwb2ludHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGxlZnQgPSBwb2ludHNbMF1bMF07XG4gICAgICAgICAgICB2YXIgcmlnaHQgPSBwb2ludHNbMF1bMF07XG4gICAgICAgICAgICB2YXIgdG9wID0gcG9pbnRzWzBdWzFdO1xuICAgICAgICAgICAgdmFyIGJvdHRvbSA9IHBvaW50c1swXVsxXTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBwb2ludHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgcCA9IHBvaW50c1tpXTtcbiAgICAgICAgICAgICAgICBpZiAocFswXSA8IGxlZnQpIHtcbiAgICAgICAgICAgICAgICAgICAgbGVmdCA9IHBbMF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChwWzBdID4gcmlnaHQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmlnaHQgPSBwWzBdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocFsxXSA8IHRvcCkge1xuICAgICAgICAgICAgICAgICAgICB0b3AgPSBwWzFdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocFsxXSA+IGJvdHRvbSkge1xuICAgICAgICAgICAgICAgICAgICBib3R0b20gPSBwWzFdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbWluWzBdID0gbGVmdDtcbiAgICAgICAgICAgIG1pblsxXSA9IHRvcDtcbiAgICAgICAgICAgIG1heFswXSA9IHJpZ2h0O1xuICAgICAgICAgICAgbWF4WzFdID0gYm90dG9tO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOS7juS4iemYtui0neWhnuWwlOabsue6vyhwMCwgcDEsIHAyLCBwMynkuK3orqHnrpflh7rmnIDlsI/ljIXlm7Tnm5LvvIzlhpnlhaVgbWluYOWSjGBtYXhg5LitXG4gICAgICAgICAqIEBtZW1iZXJPZiBtb2R1bGU6enJlbmRlci90b29sL2NvbXB1dGVCb3VuZGluZ0JveFxuICAgICAgICAgKiBAcGFyYW0ge0FycmF5LjxudW1iZXI+fSBwMFxuICAgICAgICAgKiBAcGFyYW0ge0FycmF5LjxudW1iZXI+fSBwMVxuICAgICAgICAgKiBAcGFyYW0ge0FycmF5LjxudW1iZXI+fSBwMlxuICAgICAgICAgKiBAcGFyYW0ge0FycmF5LjxudW1iZXI+fSBwM1xuICAgICAgICAgKiBAcGFyYW0ge0FycmF5LjxudW1iZXI+fSBtaW5cbiAgICAgICAgICogQHBhcmFtIHtBcnJheS48bnVtYmVyPn0gbWF4XG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBjb21wdXRlQ3ViZUJlemllckJvdW5kaW5nQm94KHAwLCBwMSwgcDIsIHAzLCBtaW4sIG1heCkge1xuICAgICAgICAgICAgdmFyIHhEaW0gPSBbXTtcbiAgICAgICAgICAgIGN1cnZlLmN1YmljRXh0cmVtYShwMFswXSwgcDFbMF0sIHAyWzBdLCBwM1swXSwgeERpbSk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHhEaW0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB4RGltW2ldID0gY3VydmUuY3ViaWNBdChwMFswXSwgcDFbMF0sIHAyWzBdLCBwM1swXSwgeERpbVtpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgeURpbSA9IFtdO1xuICAgICAgICAgICAgY3VydmUuY3ViaWNFeHRyZW1hKHAwWzFdLCBwMVsxXSwgcDJbMV0sIHAzWzFdLCB5RGltKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgeURpbS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHlEaW1baV0gPSBjdXJ2ZS5jdWJpY0F0KHAwWzFdLCBwMVsxXSwgcDJbMV0sIHAzWzFdLCB5RGltW2ldKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgeERpbS5wdXNoKHAwWzBdLCBwM1swXSk7XG4gICAgICAgICAgICB5RGltLnB1c2gocDBbMV0sIHAzWzFdKTtcblxuICAgICAgICAgICAgdmFyIGxlZnQgPSBNYXRoLm1pbi5hcHBseShudWxsLCB4RGltKTtcbiAgICAgICAgICAgIHZhciByaWdodCA9IE1hdGgubWF4LmFwcGx5KG51bGwsIHhEaW0pO1xuICAgICAgICAgICAgdmFyIHRvcCA9IE1hdGgubWluLmFwcGx5KG51bGwsIHlEaW0pO1xuICAgICAgICAgICAgdmFyIGJvdHRvbSA9IE1hdGgubWF4LmFwcGx5KG51bGwsIHlEaW0pO1xuXG4gICAgICAgICAgICBtaW5bMF0gPSBsZWZ0O1xuICAgICAgICAgICAgbWluWzFdID0gdG9wO1xuICAgICAgICAgICAgbWF4WzBdID0gcmlnaHQ7XG4gICAgICAgICAgICBtYXhbMV0gPSBib3R0b207XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICog5LuO5LqM6Zi26LSd5aGe5bCU5puy57q/KHAwLCBwMSwgcDIp5Lit6K6h566X5Ye65pyA5bCP5YyF5Zu055uS77yM5YaZ5YWlYG1pbmDlkoxgbWF4YOS4rVxuICAgICAgICAgKiBAbWVtYmVyT2YgbW9kdWxlOnpyZW5kZXIvdG9vbC9jb21wdXRlQm91bmRpbmdCb3hcbiAgICAgICAgICogQHBhcmFtIHtBcnJheS48bnVtYmVyPn0gcDBcbiAgICAgICAgICogQHBhcmFtIHtBcnJheS48bnVtYmVyPn0gcDFcbiAgICAgICAgICogQHBhcmFtIHtBcnJheS48bnVtYmVyPn0gcDJcbiAgICAgICAgICogQHBhcmFtIHtBcnJheS48bnVtYmVyPn0gbWluXG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXkuPG51bWJlcj59IG1heFxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gY29tcHV0ZVF1YWRyYXRpY0JlemllckJvdW5kaW5nQm94KHAwLCBwMSwgcDIsIG1pbiwgbWF4KSB7XG4gICAgICAgICAgICAvLyBGaW5kIGV4dHJlbWl0aWVzLCB3aGVyZSBkZXJpdmF0aXZlIGluIHggZGltIG9yIHkgZGltIGlzIHplcm9cbiAgICAgICAgICAgIHZhciB0MSA9IGN1cnZlLnF1YWRyYXRpY0V4dHJlbXVtKHAwWzBdLCBwMVswXSwgcDJbMF0pO1xuICAgICAgICAgICAgdmFyIHQyID0gY3VydmUucXVhZHJhdGljRXh0cmVtdW0ocDBbMV0sIHAxWzFdLCBwMlsxXSk7XG5cbiAgICAgICAgICAgIHQxID0gTWF0aC5tYXgoTWF0aC5taW4odDEsIDEpLCAwKTtcbiAgICAgICAgICAgIHQyID0gTWF0aC5tYXgoTWF0aC5taW4odDIsIDEpLCAwKTtcblxuICAgICAgICAgICAgdmFyIGN0MSA9IDEgLSB0MTtcbiAgICAgICAgICAgIHZhciBjdDIgPSAxIC0gdDI7XG5cbiAgICAgICAgICAgIHZhciB4MSA9IGN0MSAqIGN0MSAqIHAwWzBdIFxuICAgICAgICAgICAgICAgICAgICAgKyAyICogY3QxICogdDEgKiBwMVswXSBcbiAgICAgICAgICAgICAgICAgICAgICsgdDEgKiB0MSAqIHAyWzBdO1xuICAgICAgICAgICAgdmFyIHkxID0gY3QxICogY3QxICogcDBbMV0gXG4gICAgICAgICAgICAgICAgICAgICArIDIgKiBjdDEgKiB0MSAqIHAxWzFdIFxuICAgICAgICAgICAgICAgICAgICAgKyB0MSAqIHQxICogcDJbMV07XG5cbiAgICAgICAgICAgIHZhciB4MiA9IGN0MiAqIGN0MiAqIHAwWzBdIFxuICAgICAgICAgICAgICAgICAgICAgKyAyICogY3QyICogdDIgKiBwMVswXSBcbiAgICAgICAgICAgICAgICAgICAgICsgdDIgKiB0MiAqIHAyWzBdO1xuICAgICAgICAgICAgdmFyIHkyID0gY3QyICogY3QyICogcDBbMV0gXG4gICAgICAgICAgICAgICAgICAgICArIDIgKiBjdDIgKiB0MiAqIHAxWzFdIFxuICAgICAgICAgICAgICAgICAgICAgKyB0MiAqIHQyICogcDJbMV07XG4gICAgICAgICAgICBtaW5bMF0gPSBNYXRoLm1pbihwMFswXSwgcDJbMF0sIHgxLCB4Mik7XG4gICAgICAgICAgICBtaW5bMV0gPSBNYXRoLm1pbihwMFsxXSwgcDJbMV0sIHkxLCB5Mik7XG4gICAgICAgICAgICBtYXhbMF0gPSBNYXRoLm1heChwMFswXSwgcDJbMF0sIHgxLCB4Mik7XG4gICAgICAgICAgICBtYXhbMV0gPSBNYXRoLm1heChwMFsxXSwgcDJbMV0sIHkxLCB5Mik7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgc3RhcnQgPSB2ZWMyLmNyZWF0ZSgpO1xuICAgICAgICB2YXIgZW5kID0gdmVjMi5jcmVhdGUoKTtcbiAgICAgICAgdmFyIGV4dHJlbWl0eSA9IHZlYzIuY3JlYXRlKCk7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiDku47lnIblvKfkuK3orqHnrpflh7rmnIDlsI/ljIXlm7Tnm5LvvIzlhpnlhaVgbWluYOWSjGBtYXhg5LitXG4gICAgICAgICAqIEBtZXRob2RcbiAgICAgICAgICogQG1lbWJlck9mIG1vZHVsZTp6cmVuZGVyL3Rvb2wvY29tcHV0ZUJvdW5kaW5nQm94XG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXkuPG51bWJlcj59IGNlbnRlciDlnIblvKfkuK3lv4PngrlcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHJhZGl1cyDlnIblvKfljYrlvoRcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHN0YXJ0QW5nbGUg5ZyG5byn5byA5aeL6KeS5bqmXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBlbmRBbmdsZSDlnIblvKfnu5PmnZ/op5LluqZcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IGFudGljbG9ja3dpc2Ug5piv5ZCm5piv6aG65pe26ZKIXG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXkuPG51bWJlcj59IG1pblxuICAgICAgICAgKiBAcGFyYW0ge0FycmF5LjxudW1iZXI+fSBtYXhcbiAgICAgICAgICovXG4gICAgICAgIHZhciBjb21wdXRlQXJjQm91bmRpbmdCb3ggPSBmdW5jdGlvbiAoXG4gICAgICAgICAgICB4LCB5LCByLCBzdGFydEFuZ2xlLCBlbmRBbmdsZSwgYW50aWNsb2Nrd2lzZSwgbWluLCBtYXhcbiAgICAgICAgKSB7IFxuICAgICAgICAgICAgaWYgKE1hdGguYWJzKHN0YXJ0QW5nbGUgLSBlbmRBbmdsZSkgPj0gTWF0aC5QSSAqIDIpIHtcbiAgICAgICAgICAgICAgICAvLyBJcyBhIGNpcmNsZVxuICAgICAgICAgICAgICAgIG1pblswXSA9IHggLSByO1xuICAgICAgICAgICAgICAgIG1pblsxXSA9IHkgLSByO1xuICAgICAgICAgICAgICAgIG1heFswXSA9IHggKyByO1xuICAgICAgICAgICAgICAgIG1heFsxXSA9IHkgKyByO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc3RhcnRbMF0gPSBNYXRoLmNvcyhzdGFydEFuZ2xlKSAqIHIgKyB4O1xuICAgICAgICAgICAgc3RhcnRbMV0gPSBNYXRoLnNpbihzdGFydEFuZ2xlKSAqIHIgKyB5O1xuXG4gICAgICAgICAgICBlbmRbMF0gPSBNYXRoLmNvcyhlbmRBbmdsZSkgKiByICsgeDtcbiAgICAgICAgICAgIGVuZFsxXSA9IE1hdGguc2luKGVuZEFuZ2xlKSAqIHIgKyB5O1xuXG4gICAgICAgICAgICB2ZWMyLm1pbihtaW4sIHN0YXJ0LCBlbmQpO1xuICAgICAgICAgICAgdmVjMi5tYXgobWF4LCBzdGFydCwgZW5kKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gVGhyZXNoIHRvIFswLCBNYXRoLlBJICogMl1cbiAgICAgICAgICAgIHN0YXJ0QW5nbGUgPSBzdGFydEFuZ2xlICUgKE1hdGguUEkgKiAyKTtcbiAgICAgICAgICAgIGlmIChzdGFydEFuZ2xlIDwgMCkge1xuICAgICAgICAgICAgICAgIHN0YXJ0QW5nbGUgPSBzdGFydEFuZ2xlICsgTWF0aC5QSSAqIDI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbmRBbmdsZSA9IGVuZEFuZ2xlICUgKE1hdGguUEkgKiAyKTtcbiAgICAgICAgICAgIGlmIChlbmRBbmdsZSA8IDApIHtcbiAgICAgICAgICAgICAgICBlbmRBbmdsZSA9IGVuZEFuZ2xlICsgTWF0aC5QSSAqIDI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzdGFydEFuZ2xlID4gZW5kQW5nbGUgJiYgIWFudGljbG9ja3dpc2UpIHtcbiAgICAgICAgICAgICAgICBlbmRBbmdsZSArPSBNYXRoLlBJICogMjtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc3RhcnRBbmdsZSA8IGVuZEFuZ2xlICYmIGFudGljbG9ja3dpc2UpIHtcbiAgICAgICAgICAgICAgICBzdGFydEFuZ2xlICs9IE1hdGguUEkgKiAyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGFudGljbG9ja3dpc2UpIHtcbiAgICAgICAgICAgICAgICB2YXIgdG1wID0gZW5kQW5nbGU7XG4gICAgICAgICAgICAgICAgZW5kQW5nbGUgPSBzdGFydEFuZ2xlO1xuICAgICAgICAgICAgICAgIHN0YXJ0QW5nbGUgPSB0bXA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHZhciBudW1iZXIgPSAwO1xuICAgICAgICAgICAgLy8gdmFyIHN0ZXAgPSAoYW50aWNsb2Nrd2lzZSA/IC1NYXRoLlBJIDogTWF0aC5QSSkgLyAyO1xuICAgICAgICAgICAgZm9yICh2YXIgYW5nbGUgPSAwOyBhbmdsZSA8IGVuZEFuZ2xlOyBhbmdsZSArPSBNYXRoLlBJIC8gMikge1xuICAgICAgICAgICAgICAgIGlmIChhbmdsZSA+IHN0YXJ0QW5nbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZXh0cmVtaXR5WzBdID0gTWF0aC5jb3MoYW5nbGUpICogciArIHg7XG4gICAgICAgICAgICAgICAgICAgIGV4dHJlbWl0eVsxXSA9IE1hdGguc2luKGFuZ2xlKSAqIHIgKyB5O1xuXG4gICAgICAgICAgICAgICAgICAgIHZlYzIubWluKG1pbiwgZXh0cmVtaXR5LCBtaW4pO1xuICAgICAgICAgICAgICAgICAgICB2ZWMyLm1heChtYXgsIGV4dHJlbWl0eSwgbWF4KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgY29tcHV0ZUJvdW5kaW5nQm94LmN1YmVCZXppZXIgPSBjb21wdXRlQ3ViZUJlemllckJvdW5kaW5nQm94O1xuICAgICAgICBjb21wdXRlQm91bmRpbmdCb3gucXVhZHJhdGljQmV6aWVyID0gY29tcHV0ZVF1YWRyYXRpY0JlemllckJvdW5kaW5nQm94O1xuICAgICAgICBjb21wdXRlQm91bmRpbmdCb3guYXJjID0gY29tcHV0ZUFyY0JvdW5kaW5nQm94O1xuXG4gICAgICAgIHJldHVybiBjb21wdXRlQm91bmRpbmdCb3g7XG4gICAgfVxuKTtcbiJdLCJmaWxlIjoicGx1Z2lucy96cmVuZGVyLTIuMS4wL3NyYy90b29sL2NvbXB1dGVCb3VuZGluZ0JveC5qcyJ9
