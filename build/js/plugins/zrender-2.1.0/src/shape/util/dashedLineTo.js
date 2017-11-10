/**
 * 虚线lineTo 
 *
 * author:  Kener (@Kener-林峰, kener.linfeng@gmail.com)
 *          errorrik (errorrik@gmail.com)
 */
define(
    function (/* require */) {

        var dashPattern = [ 5, 5 ];
        /**
         * 虚线lineTo 
         */
        return function (ctx, x1, y1, x2, y2, dashLength) {
            // http://msdn.microsoft.com/en-us/library/ie/dn265063(v=vs.85).aspx
            if (ctx.setLineDash) {
                dashPattern[0] = dashPattern[1] = dashLength;
                ctx.setLineDash(dashPattern);
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                return;
            }

            dashLength = typeof dashLength != 'number'
                            ? 5 
                            : dashLength;

            var dx = x2 - x1;
            var dy = y2 - y1;
            var numDashes = Math.floor(
                Math.sqrt(dx * dx + dy * dy) / dashLength
            );
            dx = dx / numDashes;
            dy = dy / numDashes;
            var flag = true;
            for (var i = 0; i < numDashes; ++i) {
                if (flag) {
                    ctx.moveTo(x1, y1);
                }
                else {
                    ctx.lineTo(x1, y1);
                }
                flag = !flag;
                x1 += dx;
                y1 += dy;
            }
            ctx.lineTo(x2, y2);
        };
    }
);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3NoYXBlL3V0aWwvZGFzaGVkTGluZVRvLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICog6Jma57q/bGluZVRvIFxuICpcbiAqIGF1dGhvcjogIEtlbmVyIChAS2VuZXIt5p6X5bOwLCBrZW5lci5saW5mZW5nQGdtYWlsLmNvbSlcbiAqICAgICAgICAgIGVycm9ycmlrIChlcnJvcnJpa0BnbWFpbC5jb20pXG4gKi9cbmRlZmluZShcbiAgICBmdW5jdGlvbiAoLyogcmVxdWlyZSAqLykge1xuXG4gICAgICAgIHZhciBkYXNoUGF0dGVybiA9IFsgNSwgNSBdO1xuICAgICAgICAvKipcbiAgICAgICAgICog6Jma57q/bGluZVRvIFxuICAgICAgICAgKi9cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChjdHgsIHgxLCB5MSwgeDIsIHkyLCBkYXNoTGVuZ3RoKSB7XG4gICAgICAgICAgICAvLyBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvaWUvZG4yNjUwNjModj12cy44NSkuYXNweFxuICAgICAgICAgICAgaWYgKGN0eC5zZXRMaW5lRGFzaCkge1xuICAgICAgICAgICAgICAgIGRhc2hQYXR0ZXJuWzBdID0gZGFzaFBhdHRlcm5bMV0gPSBkYXNoTGVuZ3RoO1xuICAgICAgICAgICAgICAgIGN0eC5zZXRMaW5lRGFzaChkYXNoUGF0dGVybik7XG4gICAgICAgICAgICAgICAgY3R4Lm1vdmVUbyh4MSwgeTEpO1xuICAgICAgICAgICAgICAgIGN0eC5saW5lVG8oeDIsIHkyKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGRhc2hMZW5ndGggPSB0eXBlb2YgZGFzaExlbmd0aCAhPSAnbnVtYmVyJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gNSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IGRhc2hMZW5ndGg7XG5cbiAgICAgICAgICAgIHZhciBkeCA9IHgyIC0geDE7XG4gICAgICAgICAgICB2YXIgZHkgPSB5MiAtIHkxO1xuICAgICAgICAgICAgdmFyIG51bURhc2hlcyA9IE1hdGguZmxvb3IoXG4gICAgICAgICAgICAgICAgTWF0aC5zcXJ0KGR4ICogZHggKyBkeSAqIGR5KSAvIGRhc2hMZW5ndGhcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBkeCA9IGR4IC8gbnVtRGFzaGVzO1xuICAgICAgICAgICAgZHkgPSBkeSAvIG51bURhc2hlcztcbiAgICAgICAgICAgIHZhciBmbGFnID0gdHJ1ZTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtRGFzaGVzOyArK2kpIHtcbiAgICAgICAgICAgICAgICBpZiAoZmxhZykge1xuICAgICAgICAgICAgICAgICAgICBjdHgubW92ZVRvKHgxLCB5MSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjdHgubGluZVRvKHgxLCB5MSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZsYWcgPSAhZmxhZztcbiAgICAgICAgICAgICAgICB4MSArPSBkeDtcbiAgICAgICAgICAgICAgICB5MSArPSBkeTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGN0eC5saW5lVG8oeDIsIHkyKTtcbiAgICAgICAgfTtcbiAgICB9XG4pO1xuIl0sImZpbGUiOiJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3NoYXBlL3V0aWwvZGFzaGVkTGluZVRvLmpzIn0=
