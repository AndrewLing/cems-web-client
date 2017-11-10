/**
 * Catmull-Rom spline 插值折线
 * @module zrender/shape/util/smoothSpline
 * @author pissang (https://www.github.com/pissang) 
 *         Kener (@Kener-林峰, kener.linfeng@gmail.com)
 *         errorrik (errorrik@gmail.com)
 */
define(
    function (require) {
        var vector = require('../../tool/vector');

        /**
         * @inner
         */
        function interpolate(p0, p1, p2, p3, t, t2, t3) {
            var v0 = (p2 - p0) * 0.5;
            var v1 = (p3 - p1) * 0.5;
            return (2 * (p1 - p2) + v0 + v1) * t3 
                    + (-3 * (p1 - p2) - 2 * v0 - v1) * t2
                    + v0 * t + p1;
        }

        /**
         * @alias module:zrender/shape/util/smoothSpline
         * @param {Array} points 线段顶点数组
         * @param {boolean} isLoop
         * @param {Array} constraint 
         * @return {Array}
         */
        return function (points, isLoop, constraint) {
            var len = points.length;
            var ret = [];

            var distance = 0;
            for (var i = 1; i < len; i++) {
                distance += vector.distance(points[i - 1], points[i]);
            }
            
            var segs = distance / 5;
            segs = segs < len ? len : segs;
            for (var i = 0; i < segs; i++) {
                var pos = i / (segs - 1) * (isLoop ? len : len - 1);
                var idx = Math.floor(pos);

                var w = pos - idx;

                var p0;
                var p1 = points[idx % len];
                var p2;
                var p3;
                if (!isLoop) {
                    p0 = points[idx === 0 ? idx : idx - 1];
                    p2 = points[idx > len - 2 ? len - 1 : idx + 1];
                    p3 = points[idx > len - 3 ? len - 1 : idx + 2];
                }
                else {
                    p0 = points[(idx - 1 + len) % len];
                    p2 = points[(idx + 1) % len];
                    p3 = points[(idx + 2) % len];
                }

                var w2 = w * w;
                var w3 = w * w2;

                ret.push([
                    interpolate(p0[0], p1[0], p2[0], p3[0], w, w2, w3),
                    interpolate(p0[1], p1[1], p2[1], p3[1], w, w2, w3)
                ]);
            }
            return ret;
        };
    }
);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3NoYXBlL3V0aWwvc21vb3RoU3BsaW5lLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ2F0bXVsbC1Sb20gc3BsaW5lIOaPkuWAvOaKmOe6v1xuICogQG1vZHVsZSB6cmVuZGVyL3NoYXBlL3V0aWwvc21vb3RoU3BsaW5lXG4gKiBAYXV0aG9yIHBpc3NhbmcgKGh0dHBzOi8vd3d3LmdpdGh1Yi5jb20vcGlzc2FuZykgXG4gKiAgICAgICAgIEtlbmVyIChAS2VuZXIt5p6X5bOwLCBrZW5lci5saW5mZW5nQGdtYWlsLmNvbSlcbiAqICAgICAgICAgZXJyb3JyaWsgKGVycm9ycmlrQGdtYWlsLmNvbSlcbiAqL1xuZGVmaW5lKFxuICAgIGZ1bmN0aW9uIChyZXF1aXJlKSB7XG4gICAgICAgIHZhciB2ZWN0b3IgPSByZXF1aXJlKCcuLi8uLi90b29sL3ZlY3RvcicpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAaW5uZXJcbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIGludGVycG9sYXRlKHAwLCBwMSwgcDIsIHAzLCB0LCB0MiwgdDMpIHtcbiAgICAgICAgICAgIHZhciB2MCA9IChwMiAtIHAwKSAqIDAuNTtcbiAgICAgICAgICAgIHZhciB2MSA9IChwMyAtIHAxKSAqIDAuNTtcbiAgICAgICAgICAgIHJldHVybiAoMiAqIChwMSAtIHAyKSArIHYwICsgdjEpICogdDMgXG4gICAgICAgICAgICAgICAgICAgICsgKC0zICogKHAxIC0gcDIpIC0gMiAqIHYwIC0gdjEpICogdDJcbiAgICAgICAgICAgICAgICAgICAgKyB2MCAqIHQgKyBwMTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAYWxpYXMgbW9kdWxlOnpyZW5kZXIvc2hhcGUvdXRpbC9zbW9vdGhTcGxpbmVcbiAgICAgICAgICogQHBhcmFtIHtBcnJheX0gcG9pbnRzIOe6v+autemhtueCueaVsOe7hFxuICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzTG9vcFxuICAgICAgICAgKiBAcGFyYW0ge0FycmF5fSBjb25zdHJhaW50IFxuICAgICAgICAgKiBAcmV0dXJuIHtBcnJheX1cbiAgICAgICAgICovXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAocG9pbnRzLCBpc0xvb3AsIGNvbnN0cmFpbnQpIHtcbiAgICAgICAgICAgIHZhciBsZW4gPSBwb2ludHMubGVuZ3RoO1xuICAgICAgICAgICAgdmFyIHJldCA9IFtdO1xuXG4gICAgICAgICAgICB2YXIgZGlzdGFuY2UgPSAwO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIGRpc3RhbmNlICs9IHZlY3Rvci5kaXN0YW5jZShwb2ludHNbaSAtIDFdLCBwb2ludHNbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIgc2VncyA9IGRpc3RhbmNlIC8gNTtcbiAgICAgICAgICAgIHNlZ3MgPSBzZWdzIDwgbGVuID8gbGVuIDogc2VncztcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2VnczsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBvcyA9IGkgLyAoc2VncyAtIDEpICogKGlzTG9vcCA/IGxlbiA6IGxlbiAtIDEpO1xuICAgICAgICAgICAgICAgIHZhciBpZHggPSBNYXRoLmZsb29yKHBvcyk7XG5cbiAgICAgICAgICAgICAgICB2YXIgdyA9IHBvcyAtIGlkeDtcblxuICAgICAgICAgICAgICAgIHZhciBwMDtcbiAgICAgICAgICAgICAgICB2YXIgcDEgPSBwb2ludHNbaWR4ICUgbGVuXTtcbiAgICAgICAgICAgICAgICB2YXIgcDI7XG4gICAgICAgICAgICAgICAgdmFyIHAzO1xuICAgICAgICAgICAgICAgIGlmICghaXNMb29wKSB7XG4gICAgICAgICAgICAgICAgICAgIHAwID0gcG9pbnRzW2lkeCA9PT0gMCA/IGlkeCA6IGlkeCAtIDFdO1xuICAgICAgICAgICAgICAgICAgICBwMiA9IHBvaW50c1tpZHggPiBsZW4gLSAyID8gbGVuIC0gMSA6IGlkeCArIDFdO1xuICAgICAgICAgICAgICAgICAgICBwMyA9IHBvaW50c1tpZHggPiBsZW4gLSAzID8gbGVuIC0gMSA6IGlkeCArIDJdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcDAgPSBwb2ludHNbKGlkeCAtIDEgKyBsZW4pICUgbGVuXTtcbiAgICAgICAgICAgICAgICAgICAgcDIgPSBwb2ludHNbKGlkeCArIDEpICUgbGVuXTtcbiAgICAgICAgICAgICAgICAgICAgcDMgPSBwb2ludHNbKGlkeCArIDIpICUgbGVuXTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgdzIgPSB3ICogdztcbiAgICAgICAgICAgICAgICB2YXIgdzMgPSB3ICogdzI7XG5cbiAgICAgICAgICAgICAgICByZXQucHVzaChbXG4gICAgICAgICAgICAgICAgICAgIGludGVycG9sYXRlKHAwWzBdLCBwMVswXSwgcDJbMF0sIHAzWzBdLCB3LCB3MiwgdzMpLFxuICAgICAgICAgICAgICAgICAgICBpbnRlcnBvbGF0ZShwMFsxXSwgcDFbMV0sIHAyWzFdLCBwM1sxXSwgdywgdzIsIHczKVxuICAgICAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfTtcbiAgICB9XG4pO1xuIl0sImZpbGUiOiJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3NoYXBlL3V0aWwvc21vb3RoU3BsaW5lLmpzIn0=
