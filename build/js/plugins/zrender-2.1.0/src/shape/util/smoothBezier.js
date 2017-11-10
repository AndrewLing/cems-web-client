/**
 * 贝塞尔平滑曲线 
 * @module zrender/shape/util/smoothBezier
 * @author pissang (https://www.github.com/pissang) 
 *         Kener (@Kener-林峰, kener.linfeng@gmail.com)
 *         errorrik (errorrik@gmail.com)
 */
define(
    function (require) {
        var vector = require('../../tool/vector');

        /**
         * 贝塞尔平滑曲线
         * @alias module:zrender/shape/util/smoothBezier
         * @param {Array} points 线段顶点数组
         * @param {number} smooth 平滑等级, 0-1
         * @param {boolean} isLoop
         * @param {Array} constraint 将计算出来的控制点约束在一个包围盒内
         *                           比如 [[0, 0], [100, 100]], 这个包围盒会与
         *                           整个折线的包围盒做一个并集用来约束控制点。
         * @param {Array} 计算出来的控制点数组
         */
        return function (points, smooth, isLoop, constraint) {
            var cps = [];

            var v = [];
            var v1 = [];
            var v2 = [];
            var prevPoint;
            var nextPoint;

            var hasConstraint = !!constraint;
            var min, max;
            if (hasConstraint) {
                min = [Infinity, Infinity];
                max = [-Infinity, -Infinity];
                for (var i = 0, len = points.length; i < len; i++) {
                    vector.min(min, min, points[i]);
                    vector.max(max, max, points[i]);
                }
                // 与指定的包围盒做并集
                vector.min(min, min, constraint[0]);
                vector.max(max, max, constraint[1]);
            }

            for (var i = 0, len = points.length; i < len; i++) {
                var point = points[i];
                var prevPoint;
                var nextPoint;

                if (isLoop) {
                    prevPoint = points[i ? i - 1 : len - 1];
                    nextPoint = points[(i + 1) % len];
                } 
                else {
                    if (i === 0 || i === len - 1) {
                        cps.push(vector.clone(points[i]));
                        continue;
                    } 
                    else {
                        prevPoint = points[i - 1];
                        nextPoint = points[i + 1];
                    }
                }

                vector.sub(v, nextPoint, prevPoint);

                // use degree to scale the handle length
                vector.scale(v, v, smooth);

                var d0 = vector.distance(point, prevPoint);
                var d1 = vector.distance(point, nextPoint);
                var sum = d0 + d1;
                if (sum !== 0) {
                    d0 /= sum;
                    d1 /= sum;
                }

                vector.scale(v1, v, -d0);
                vector.scale(v2, v, d1);
                var cp0 = vector.add([], point, v1);
                var cp1 = vector.add([], point, v2);
                if (hasConstraint) {
                    vector.max(cp0, cp0, min);
                    vector.min(cp0, cp0, max);
                    vector.max(cp1, cp1, min);
                    vector.min(cp1, cp1, max);
                }
                cps.push(cp0);
                cps.push(cp1);
            }
            
            if (isLoop) {
                cps.push(vector.clone(cps.shift()));
            }

            return cps;
        };
    }
);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3NoYXBlL3V0aWwvc21vb3RoQmV6aWVyLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICog6LSd5aGe5bCU5bmz5ruR5puy57q/IFxuICogQG1vZHVsZSB6cmVuZGVyL3NoYXBlL3V0aWwvc21vb3RoQmV6aWVyXG4gKiBAYXV0aG9yIHBpc3NhbmcgKGh0dHBzOi8vd3d3LmdpdGh1Yi5jb20vcGlzc2FuZykgXG4gKiAgICAgICAgIEtlbmVyIChAS2VuZXIt5p6X5bOwLCBrZW5lci5saW5mZW5nQGdtYWlsLmNvbSlcbiAqICAgICAgICAgZXJyb3JyaWsgKGVycm9ycmlrQGdtYWlsLmNvbSlcbiAqL1xuZGVmaW5lKFxuICAgIGZ1bmN0aW9uIChyZXF1aXJlKSB7XG4gICAgICAgIHZhciB2ZWN0b3IgPSByZXF1aXJlKCcuLi8uLi90b29sL3ZlY3RvcicpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDotJ3loZ7lsJTlubPmu5Hmm7Lnur9cbiAgICAgICAgICogQGFsaWFzIG1vZHVsZTp6cmVuZGVyL3NoYXBlL3V0aWwvc21vb3RoQmV6aWVyXG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXl9IHBvaW50cyDnur/mrrXpobbngrnmlbDnu4RcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHNtb290aCDlubPmu5HnrYnnuqcsIDAtMVxuICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzTG9vcFxuICAgICAgICAgKiBAcGFyYW0ge0FycmF5fSBjb25zdHJhaW50IOWwhuiuoeeul+WHuuadpeeahOaOp+WItueCuee6puadn+WcqOS4gOS4quWMheWbtOebkuWGhVxuICAgICAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgIOavlOWmgiBbWzAsIDBdLCBbMTAwLCAxMDBdXSwg6L+Z5Liq5YyF5Zu055uS5Lya5LiOXG4gICAgICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAg5pW05Liq5oqY57q/55qE5YyF5Zu055uS5YGa5LiA5Liq5bm26ZuG55So5p2l57qm5p2f5o6n5Yi254K544CCXG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXl9IOiuoeeul+WHuuadpeeahOaOp+WItueCueaVsOe7hFxuICAgICAgICAgKi9cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChwb2ludHMsIHNtb290aCwgaXNMb29wLCBjb25zdHJhaW50KSB7XG4gICAgICAgICAgICB2YXIgY3BzID0gW107XG5cbiAgICAgICAgICAgIHZhciB2ID0gW107XG4gICAgICAgICAgICB2YXIgdjEgPSBbXTtcbiAgICAgICAgICAgIHZhciB2MiA9IFtdO1xuICAgICAgICAgICAgdmFyIHByZXZQb2ludDtcbiAgICAgICAgICAgIHZhciBuZXh0UG9pbnQ7XG5cbiAgICAgICAgICAgIHZhciBoYXNDb25zdHJhaW50ID0gISFjb25zdHJhaW50O1xuICAgICAgICAgICAgdmFyIG1pbiwgbWF4O1xuICAgICAgICAgICAgaWYgKGhhc0NvbnN0cmFpbnQpIHtcbiAgICAgICAgICAgICAgICBtaW4gPSBbSW5maW5pdHksIEluZmluaXR5XTtcbiAgICAgICAgICAgICAgICBtYXggPSBbLUluZmluaXR5LCAtSW5maW5pdHldO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBwb2ludHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmVjdG9yLm1pbihtaW4sIG1pbiwgcG9pbnRzW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgdmVjdG9yLm1heChtYXgsIG1heCwgcG9pbnRzW2ldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8g5LiO5oyH5a6a55qE5YyF5Zu055uS5YGa5bm26ZuGXG4gICAgICAgICAgICAgICAgdmVjdG9yLm1pbihtaW4sIG1pbiwgY29uc3RyYWludFswXSk7XG4gICAgICAgICAgICAgICAgdmVjdG9yLm1heChtYXgsIG1heCwgY29uc3RyYWludFsxXSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBwb2ludHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgcG9pbnQgPSBwb2ludHNbaV07XG4gICAgICAgICAgICAgICAgdmFyIHByZXZQb2ludDtcbiAgICAgICAgICAgICAgICB2YXIgbmV4dFBvaW50O1xuXG4gICAgICAgICAgICAgICAgaWYgKGlzTG9vcCkge1xuICAgICAgICAgICAgICAgICAgICBwcmV2UG9pbnQgPSBwb2ludHNbaSA/IGkgLSAxIDogbGVuIC0gMV07XG4gICAgICAgICAgICAgICAgICAgIG5leHRQb2ludCA9IHBvaW50c1soaSArIDEpICUgbGVuXTtcbiAgICAgICAgICAgICAgICB9IFxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaSA9PT0gMCB8fCBpID09PSBsZW4gLSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjcHMucHVzaCh2ZWN0b3IuY2xvbmUocG9pbnRzW2ldKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfSBcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2UG9pbnQgPSBwb2ludHNbaSAtIDFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dFBvaW50ID0gcG9pbnRzW2kgKyAxXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZlY3Rvci5zdWIodiwgbmV4dFBvaW50LCBwcmV2UG9pbnQpO1xuXG4gICAgICAgICAgICAgICAgLy8gdXNlIGRlZ3JlZSB0byBzY2FsZSB0aGUgaGFuZGxlIGxlbmd0aFxuICAgICAgICAgICAgICAgIHZlY3Rvci5zY2FsZSh2LCB2LCBzbW9vdGgpO1xuXG4gICAgICAgICAgICAgICAgdmFyIGQwID0gdmVjdG9yLmRpc3RhbmNlKHBvaW50LCBwcmV2UG9pbnQpO1xuICAgICAgICAgICAgICAgIHZhciBkMSA9IHZlY3Rvci5kaXN0YW5jZShwb2ludCwgbmV4dFBvaW50KTtcbiAgICAgICAgICAgICAgICB2YXIgc3VtID0gZDAgKyBkMTtcbiAgICAgICAgICAgICAgICBpZiAoc3VtICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGQwIC89IHN1bTtcbiAgICAgICAgICAgICAgICAgICAgZDEgLz0gc3VtO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZlY3Rvci5zY2FsZSh2MSwgdiwgLWQwKTtcbiAgICAgICAgICAgICAgICB2ZWN0b3Iuc2NhbGUodjIsIHYsIGQxKTtcbiAgICAgICAgICAgICAgICB2YXIgY3AwID0gdmVjdG9yLmFkZChbXSwgcG9pbnQsIHYxKTtcbiAgICAgICAgICAgICAgICB2YXIgY3AxID0gdmVjdG9yLmFkZChbXSwgcG9pbnQsIHYyKTtcbiAgICAgICAgICAgICAgICBpZiAoaGFzQ29uc3RyYWludCkge1xuICAgICAgICAgICAgICAgICAgICB2ZWN0b3IubWF4KGNwMCwgY3AwLCBtaW4pO1xuICAgICAgICAgICAgICAgICAgICB2ZWN0b3IubWluKGNwMCwgY3AwLCBtYXgpO1xuICAgICAgICAgICAgICAgICAgICB2ZWN0b3IubWF4KGNwMSwgY3AxLCBtaW4pO1xuICAgICAgICAgICAgICAgICAgICB2ZWN0b3IubWluKGNwMSwgY3AxLCBtYXgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjcHMucHVzaChjcDApO1xuICAgICAgICAgICAgICAgIGNwcy5wdXNoKGNwMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChpc0xvb3ApIHtcbiAgICAgICAgICAgICAgICBjcHMucHVzaCh2ZWN0b3IuY2xvbmUoY3BzLnNoaWZ0KCkpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGNwcztcbiAgICAgICAgfTtcbiAgICB9XG4pO1xuIl0sImZpbGUiOiJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3NoYXBlL3V0aWwvc21vb3RoQmV6aWVyLmpzIn0=
