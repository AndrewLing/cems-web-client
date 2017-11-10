define(
    function (require) {
        var config = require('../config');

        /**
         * @exports zrender/tool/log
         * @author Kener (@Kener-林峰, kener.linfeng@gmail.com)
         */
        return function() {
            if (config.debugMode === 0) {
                return;
            }
            else if (config.debugMode == 1) {
                for (var k in arguments) {
                    throw new Error(arguments[k]);
                }
            }
            else if (config.debugMode > 1) {
                for (var k in arguments) {
                    console.log(arguments[k]);
                }
            }
        };

        /* for debug
        return function(mes) {
            document.getElementById('wrong-message').innerHTML =
                mes + ' ' + (new Date() - 0)
                + '<br/>' 
                + document.getElementById('wrong-message').innerHTML;
        };
        */
    }
);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3Rvb2wvbG9nLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImRlZmluZShcbiAgICBmdW5jdGlvbiAocmVxdWlyZSkge1xuICAgICAgICB2YXIgY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlnJyk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBleHBvcnRzIHpyZW5kZXIvdG9vbC9sb2dcbiAgICAgICAgICogQGF1dGhvciBLZW5lciAoQEtlbmVyLeael+WzsCwga2VuZXIubGluZmVuZ0BnbWFpbC5jb20pXG4gICAgICAgICAqL1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoY29uZmlnLmRlYnVnTW9kZSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGNvbmZpZy5kZWJ1Z01vZGUgPT0gMSkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGsgaW4gYXJndW1lbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihhcmd1bWVudHNba10pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGNvbmZpZy5kZWJ1Z01vZGUgPiAxKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgayBpbiBhcmd1bWVudHMpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYXJndW1lbnRzW2tdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLyogZm9yIGRlYnVnXG4gICAgICAgIHJldHVybiBmdW5jdGlvbihtZXMpIHtcbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd3cm9uZy1tZXNzYWdlJykuaW5uZXJIVE1MID1cbiAgICAgICAgICAgICAgICBtZXMgKyAnICcgKyAobmV3IERhdGUoKSAtIDApXG4gICAgICAgICAgICAgICAgKyAnPGJyLz4nIFxuICAgICAgICAgICAgICAgICsgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3dyb25nLW1lc3NhZ2UnKS5pbm5lckhUTUw7XG4gICAgICAgIH07XG4gICAgICAgICovXG4gICAgfVxuKTtcbiJdLCJmaWxlIjoicGx1Z2lucy96cmVuZGVyLTIuMS4wL3NyYy90b29sL2xvZy5qcyJ9
