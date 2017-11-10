define(
    function() {
        /**
         * 缓动代码来自 https://github.com/sole/tween.js/blob/master/src/Tween.js
         * @see http://sole.github.io/tween.js/examples/03_graphs.html
         * @exports zrender/animation/easing
         */
        var easing = {
            // 线性
            /**
             * @param {number} k
             * @return {number}
             */
            Linear: function (k) {
                return k;
            },

            // 二次方的缓动（t^2）
            /**
             * @param {number} k
             * @return {number}
             */
            QuadraticIn: function (k) {
                return k * k;
            },
            /**
             * @param {number} k
             * @return {number}
             */
            QuadraticOut: function (k) {
                return k * (2 - k);
            },
            /**
             * @param {number} k
             * @return {number}
             */
            QuadraticInOut: function (k) {
                if ((k *= 2) < 1) {
                    return 0.5 * k * k;
                }
                return -0.5 * (--k * (k - 2) - 1);
            },

            // 三次方的缓动（t^3）
            /**
             * @param {number} k
             * @return {number}
             */
            CubicIn: function (k) {
                return k * k * k;
            },
            /**
             * @param {number} k
             * @return {number}
             */
            CubicOut: function (k) {
                return --k * k * k + 1;
            },
            /**
             * @param {number} k
             * @return {number}
             */
            CubicInOut: function (k) {
                if ((k *= 2) < 1) {
                    return 0.5 * k * k * k;
                }
                return 0.5 * ((k -= 2) * k * k + 2);
            },

            // 四次方的缓动（t^4）
            /**
             * @param {number} k
             * @return {number}
             */
            QuarticIn: function (k) {
                return k * k * k * k;
            },
            /**
             * @param {number} k
             * @return {number}
             */
            QuarticOut: function (k) {
                return 1 - (--k * k * k * k);
            },
            /**
             * @param {number} k
             * @return {number}
             */
            QuarticInOut: function (k) {
                if ((k *= 2) < 1) {
                    return 0.5 * k * k * k * k;
                }
                return -0.5 * ((k -= 2) * k * k * k - 2);
            },

            // 五次方的缓动（t^5）
            /**
             * @param {number} k
             * @return {number}
             */
            QuinticIn: function (k) {
                return k * k * k * k * k;
            },
            /**
             * @param {number} k
             * @return {number}
             */
            QuinticOut: function (k) {
                return --k * k * k * k * k + 1;
            },
            /**
             * @param {number} k
             * @return {number}
             */
            QuinticInOut: function (k) {
                if ((k *= 2) < 1) {
                    return 0.5 * k * k * k * k * k;
                }
                return 0.5 * ((k -= 2) * k * k * k * k + 2);
            },

            // 正弦曲线的缓动（sin(t)）
            /**
             * @param {number} k
             * @return {number}
             */
            SinusoidalIn: function (k) {
                return 1 - Math.cos(k * Math.PI / 2);
            },
            /**
             * @param {number} k
             * @return {number}
             */
            SinusoidalOut: function (k) {
                return Math.sin(k * Math.PI / 2);
            },
            /**
             * @param {number} k
             * @return {number}
             */
            SinusoidalInOut: function (k) {
                return 0.5 * (1 - Math.cos(Math.PI * k));
            },

            // 指数曲线的缓动（2^t）
            /**
             * @param {number} k
             * @return {number}
             */
            ExponentialIn: function (k) {
                return k === 0 ? 0 : Math.pow(1024, k - 1);
            },
            /**
             * @param {number} k
             * @return {number}
             */
            ExponentialOut: function (k) {
                return k === 1 ? 1 : 1 - Math.pow(2, -10 * k);
            },
            /**
             * @param {number} k
             * @return {number}
             */
            ExponentialInOut: function (k) {
                if (k === 0) {
                    return 0;
                }
                if (k === 1) {
                    return 1;
                }
                if ((k *= 2) < 1) {
                    return 0.5 * Math.pow(1024, k - 1);
                }
                return 0.5 * (-Math.pow(2, -10 * (k - 1)) + 2);
            },

            // 圆形曲线的缓动（sqrt(1-t^2)）
            /**
             * @param {number} k
             * @return {number}
             */
            CircularIn: function (k) {
                return 1 - Math.sqrt(1 - k * k);
            },
            /**
             * @param {number} k
             * @return {number}
             */
            CircularOut: function (k) {
                return Math.sqrt(1 - (--k * k));
            },
            /**
             * @param {number} k
             * @return {number}
             */
            CircularInOut: function (k) {
                if ((k *= 2) < 1) {
                    return -0.5 * (Math.sqrt(1 - k * k) - 1);
                }
                return 0.5 * (Math.sqrt(1 - (k -= 2) * k) + 1);
            },

            // 创建类似于弹簧在停止前来回振荡的动画
            /**
             * @param {number} k
             * @return {number}
             */
            ElasticIn: function (k) {
                var s; 
                var a = 0.1;
                var p = 0.4;
                if (k === 0) {
                    return 0;
                }
                if (k === 1) {
                    return 1;
                }
                if (!a || a < 1) {
                    a = 1; s = p / 4;
                }
                else {
                    s = p * Math.asin(1 / a) / (2 * Math.PI);
                }
                return -(a * Math.pow(2, 10 * (k -= 1)) *
                            Math.sin((k - s) * (2 * Math.PI) / p));
            },
            /**
             * @param {number} k
             * @return {number}
             */
            ElasticOut: function (k) {
                var s;
                var a = 0.1;
                var p = 0.4;
                if (k === 0) {
                    return 0;
                }
                if (k === 1) {
                    return 1;
                }
                if (!a || a < 1) {
                    a = 1; s = p / 4;
                }
                else {
                    s = p * Math.asin(1 / a) / (2 * Math.PI);
                }
                return (a * Math.pow(2, -10 * k) *
                        Math.sin((k - s) * (2 * Math.PI) / p) + 1);
            },
            /**
             * @param {number} k
             * @return {number}
             */
            ElasticInOut: function (k) {
                var s;
                var a = 0.1;
                var p = 0.4;
                if (k === 0) {
                    return 0;
                }
                if (k === 1) {
                    return 1;
                }
                if (!a || a < 1) {
                    a = 1; s = p / 4;
                }
                else {
                    s = p * Math.asin(1 / a) / (2 * Math.PI);
                }
                if ((k *= 2) < 1) {
                    return -0.5 * (a * Math.pow(2, 10 * (k -= 1))
                        * Math.sin((k - s) * (2 * Math.PI) / p));
                }
                return a * Math.pow(2, -10 * (k -= 1))
                        * Math.sin((k - s) * (2 * Math.PI) / p) * 0.5 + 1;

            },

            // 在某一动画开始沿指示的路径进行动画处理前稍稍收回该动画的移动
            /**
             * @param {number} k
             * @return {number}
             */
            BackIn: function (k) {
                var s = 1.70158;
                return k * k * ((s + 1) * k - s);
            },
            /**
             * @param {number} k
             * @return {number}
             */
            BackOut: function (k) {
                var s = 1.70158;
                return --k * k * ((s + 1) * k + s) + 1;
            },
            /**
             * @param {number} k
             * @return {number}
             */
            BackInOut: function (k) {
                var s = 1.70158 * 1.525;
                if ((k *= 2) < 1) {
                    return 0.5 * (k * k * ((s + 1) * k - s));
                }
                return 0.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);
            },

            // 创建弹跳效果
            /**
             * @param {number} k
             * @return {number}
             */
            BounceIn: function (k) {
                return 1 - easing.BounceOut(1 - k);
            },
            /**
             * @param {number} k
             * @return {number}
             */
            BounceOut: function (k) {
                if (k < (1 / 2.75)) {
                    return 7.5625 * k * k;
                }
                else if (k < (2 / 2.75)) {
                    return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75;
                }
                else if (k < (2.5 / 2.75)) {
                    return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375;
                }
                else {
                    return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375;
                }
            },
            /**
             * @param {number} k
             * @return {number}
             */
            BounceInOut: function (k) {
                if (k < 0.5) {
                    return easing.BounceIn(k * 2) * 0.5;
                }
                return easing.BounceOut(k * 2 - 1) * 0.5 + 0.5;
            }
        };

        return easing;
    }
);


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL2FuaW1hdGlvbi9lYXNpbmcuanMiXSwic291cmNlc0NvbnRlbnQiOlsiZGVmaW5lKFxuICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICAvKipcbiAgICAgICAgICog57yT5Yqo5Luj56CB5p2l6IeqIGh0dHBzOi8vZ2l0aHViLmNvbS9zb2xlL3R3ZWVuLmpzL2Jsb2IvbWFzdGVyL3NyYy9Ud2Vlbi5qc1xuICAgICAgICAgKiBAc2VlIGh0dHA6Ly9zb2xlLmdpdGh1Yi5pby90d2Vlbi5qcy9leGFtcGxlcy8wM19ncmFwaHMuaHRtbFxuICAgICAgICAgKiBAZXhwb3J0cyB6cmVuZGVyL2FuaW1hdGlvbi9lYXNpbmdcbiAgICAgICAgICovXG4gICAgICAgIHZhciBlYXNpbmcgPSB7XG4gICAgICAgICAgICAvLyDnur/mgKdcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IGtcbiAgICAgICAgICAgICAqIEByZXR1cm4ge251bWJlcn1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgTGluZWFyOiBmdW5jdGlvbiAoaykge1xuICAgICAgICAgICAgICAgIHJldHVybiBrO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLy8g5LqM5qyh5pa555qE57yT5Yqo77yIdF4y77yJXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBrXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFF1YWRyYXRpY0luOiBmdW5jdGlvbiAoaykge1xuICAgICAgICAgICAgICAgIHJldHVybiBrICogaztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBrXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFF1YWRyYXRpY091dDogZnVuY3Rpb24gKGspIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gayAqICgyIC0gayk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0ga1xuICAgICAgICAgICAgICogQHJldHVybiB7bnVtYmVyfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBRdWFkcmF0aWNJbk91dDogZnVuY3Rpb24gKGspIHtcbiAgICAgICAgICAgICAgICBpZiAoKGsgKj0gMikgPCAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAwLjUgKiBrICogaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIC0wLjUgKiAoLS1rICogKGsgLSAyKSAtIDEpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLy8g5LiJ5qyh5pa555qE57yT5Yqo77yIdF4z77yJXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBrXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIEN1YmljSW46IGZ1bmN0aW9uIChrKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGsgKiBrICogaztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBrXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIEN1YmljT3V0OiBmdW5jdGlvbiAoaykge1xuICAgICAgICAgICAgICAgIHJldHVybiAtLWsgKiBrICogayArIDE7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0ga1xuICAgICAgICAgICAgICogQHJldHVybiB7bnVtYmVyfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBDdWJpY0luT3V0OiBmdW5jdGlvbiAoaykge1xuICAgICAgICAgICAgICAgIGlmICgoayAqPSAyKSA8IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDAuNSAqIGsgKiBrICogaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIDAuNSAqICgoayAtPSAyKSAqIGsgKiBrICsgMik7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvLyDlm5vmrKHmlrnnmoTnvJPliqjvvIh0XjTvvIlcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IGtcbiAgICAgICAgICAgICAqIEByZXR1cm4ge251bWJlcn1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgUXVhcnRpY0luOiBmdW5jdGlvbiAoaykge1xuICAgICAgICAgICAgICAgIHJldHVybiBrICogayAqIGsgKiBrO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IGtcbiAgICAgICAgICAgICAqIEByZXR1cm4ge251bWJlcn1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgUXVhcnRpY091dDogZnVuY3Rpb24gKGspIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gMSAtICgtLWsgKiBrICogayAqIGspO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IGtcbiAgICAgICAgICAgICAqIEByZXR1cm4ge251bWJlcn1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgUXVhcnRpY0luT3V0OiBmdW5jdGlvbiAoaykge1xuICAgICAgICAgICAgICAgIGlmICgoayAqPSAyKSA8IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDAuNSAqIGsgKiBrICogayAqIGs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiAtMC41ICogKChrIC09IDIpICogayAqIGsgKiBrIC0gMik7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvLyDkupTmrKHmlrnnmoTnvJPliqjvvIh0XjXvvIlcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IGtcbiAgICAgICAgICAgICAqIEByZXR1cm4ge251bWJlcn1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgUXVpbnRpY0luOiBmdW5jdGlvbiAoaykge1xuICAgICAgICAgICAgICAgIHJldHVybiBrICogayAqIGsgKiBrICogaztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBrXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFF1aW50aWNPdXQ6IGZ1bmN0aW9uIChrKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIC0tayAqIGsgKiBrICogayAqIGsgKyAxO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IGtcbiAgICAgICAgICAgICAqIEByZXR1cm4ge251bWJlcn1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgUXVpbnRpY0luT3V0OiBmdW5jdGlvbiAoaykge1xuICAgICAgICAgICAgICAgIGlmICgoayAqPSAyKSA8IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDAuNSAqIGsgKiBrICogayAqIGsgKiBrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gMC41ICogKChrIC09IDIpICogayAqIGsgKiBrICogayArIDIpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLy8g5q2j5bym5puy57q/55qE57yT5Yqo77yIc2luKHQp77yJXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBrXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFNpbnVzb2lkYWxJbjogZnVuY3Rpb24gKGspIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gMSAtIE1hdGguY29zKGsgKiBNYXRoLlBJIC8gMik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0ga1xuICAgICAgICAgICAgICogQHJldHVybiB7bnVtYmVyfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBTaW51c29pZGFsT3V0OiBmdW5jdGlvbiAoaykge1xuICAgICAgICAgICAgICAgIHJldHVybiBNYXRoLnNpbihrICogTWF0aC5QSSAvIDIpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IGtcbiAgICAgICAgICAgICAqIEByZXR1cm4ge251bWJlcn1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgU2ludXNvaWRhbEluT3V0OiBmdW5jdGlvbiAoaykge1xuICAgICAgICAgICAgICAgIHJldHVybiAwLjUgKiAoMSAtIE1hdGguY29zKE1hdGguUEkgKiBrKSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvLyDmjIfmlbDmm7Lnur/nmoTnvJPliqjvvIgyXnTvvIlcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IGtcbiAgICAgICAgICAgICAqIEByZXR1cm4ge251bWJlcn1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgRXhwb25lbnRpYWxJbjogZnVuY3Rpb24gKGspIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gayA9PT0gMCA/IDAgOiBNYXRoLnBvdygxMDI0LCBrIC0gMSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0ga1xuICAgICAgICAgICAgICogQHJldHVybiB7bnVtYmVyfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBFeHBvbmVudGlhbE91dDogZnVuY3Rpb24gKGspIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gayA9PT0gMSA/IDEgOiAxIC0gTWF0aC5wb3coMiwgLTEwICogayk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0ga1xuICAgICAgICAgICAgICogQHJldHVybiB7bnVtYmVyfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBFeHBvbmVudGlhbEluT3V0OiBmdW5jdGlvbiAoaykge1xuICAgICAgICAgICAgICAgIGlmIChrID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoayA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKChrICo9IDIpIDwgMSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMC41ICogTWF0aC5wb3coMTAyNCwgayAtIDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gMC41ICogKC1NYXRoLnBvdygyLCAtMTAgKiAoayAtIDEpKSArIDIpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLy8g5ZyG5b2i5puy57q/55qE57yT5Yqo77yIc3FydCgxLXReMinvvIlcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IGtcbiAgICAgICAgICAgICAqIEByZXR1cm4ge251bWJlcn1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgQ2lyY3VsYXJJbjogZnVuY3Rpb24gKGspIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gMSAtIE1hdGguc3FydCgxIC0gayAqIGspO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IGtcbiAgICAgICAgICAgICAqIEByZXR1cm4ge251bWJlcn1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgQ2lyY3VsYXJPdXQ6IGZ1bmN0aW9uIChrKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE1hdGguc3FydCgxIC0gKC0tayAqIGspKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBrXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIENpcmN1bGFySW5PdXQ6IGZ1bmN0aW9uIChrKSB7XG4gICAgICAgICAgICAgICAgaWYgKChrICo9IDIpIDwgMSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gLTAuNSAqIChNYXRoLnNxcnQoMSAtIGsgKiBrKSAtIDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gMC41ICogKE1hdGguc3FydCgxIC0gKGsgLT0gMikgKiBrKSArIDEpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLy8g5Yib5bu657G75Ly85LqO5by557Cn5Zyo5YGc5q2i5YmN5p2l5Zue5oyv6I2h55qE5Yqo55S7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBrXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIEVsYXN0aWNJbjogZnVuY3Rpb24gKGspIHtcbiAgICAgICAgICAgICAgICB2YXIgczsgXG4gICAgICAgICAgICAgICAgdmFyIGEgPSAwLjE7XG4gICAgICAgICAgICAgICAgdmFyIHAgPSAwLjQ7XG4gICAgICAgICAgICAgICAgaWYgKGsgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChrID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIWEgfHwgYSA8IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgYSA9IDE7IHMgPSBwIC8gNDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHMgPSBwICogTWF0aC5hc2luKDEgLyBhKSAvICgyICogTWF0aC5QSSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiAtKGEgKiBNYXRoLnBvdygyLCAxMCAqIChrIC09IDEpKSAqXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5zaW4oKGsgLSBzKSAqICgyICogTWF0aC5QSSkgLyBwKSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0ga1xuICAgICAgICAgICAgICogQHJldHVybiB7bnVtYmVyfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBFbGFzdGljT3V0OiBmdW5jdGlvbiAoaykge1xuICAgICAgICAgICAgICAgIHZhciBzO1xuICAgICAgICAgICAgICAgIHZhciBhID0gMC4xO1xuICAgICAgICAgICAgICAgIHZhciBwID0gMC40O1xuICAgICAgICAgICAgICAgIGlmIChrID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoayA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFhIHx8IGEgPCAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGEgPSAxOyBzID0gcCAvIDQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzID0gcCAqIE1hdGguYXNpbigxIC8gYSkgLyAoMiAqIE1hdGguUEkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gKGEgKiBNYXRoLnBvdygyLCAtMTAgKiBrKSAqXG4gICAgICAgICAgICAgICAgICAgICAgICBNYXRoLnNpbigoayAtIHMpICogKDIgKiBNYXRoLlBJKSAvIHApICsgMSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0ga1xuICAgICAgICAgICAgICogQHJldHVybiB7bnVtYmVyfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBFbGFzdGljSW5PdXQ6IGZ1bmN0aW9uIChrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHM7XG4gICAgICAgICAgICAgICAgdmFyIGEgPSAwLjE7XG4gICAgICAgICAgICAgICAgdmFyIHAgPSAwLjQ7XG4gICAgICAgICAgICAgICAgaWYgKGsgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChrID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIWEgfHwgYSA8IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgYSA9IDE7IHMgPSBwIC8gNDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHMgPSBwICogTWF0aC5hc2luKDEgLyBhKSAvICgyICogTWF0aC5QSSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICgoayAqPSAyKSA8IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC0wLjUgKiAoYSAqIE1hdGgucG93KDIsIDEwICogKGsgLT0gMSkpXG4gICAgICAgICAgICAgICAgICAgICAgICAqIE1hdGguc2luKChrIC0gcykgKiAoMiAqIE1hdGguUEkpIC8gcCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYSAqIE1hdGgucG93KDIsIC0xMCAqIChrIC09IDEpKVxuICAgICAgICAgICAgICAgICAgICAgICAgKiBNYXRoLnNpbigoayAtIHMpICogKDIgKiBNYXRoLlBJKSAvIHApICogMC41ICsgMTtcblxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLy8g5Zyo5p+Q5LiA5Yqo55S75byA5aeL5rK/5oyH56S655qE6Lev5b6E6L+b6KGM5Yqo55S75aSE55CG5YmN56iN56iN5pS25Zue6K+l5Yqo55S755qE56e75YqoXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBrXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIEJhY2tJbjogZnVuY3Rpb24gKGspIHtcbiAgICAgICAgICAgICAgICB2YXIgcyA9IDEuNzAxNTg7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGsgKiBrICogKChzICsgMSkgKiBrIC0gcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0ga1xuICAgICAgICAgICAgICogQHJldHVybiB7bnVtYmVyfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBCYWNrT3V0OiBmdW5jdGlvbiAoaykge1xuICAgICAgICAgICAgICAgIHZhciBzID0gMS43MDE1ODtcbiAgICAgICAgICAgICAgICByZXR1cm4gLS1rICogayAqICgocyArIDEpICogayArIHMpICsgMTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBrXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIEJhY2tJbk91dDogZnVuY3Rpb24gKGspIHtcbiAgICAgICAgICAgICAgICB2YXIgcyA9IDEuNzAxNTggKiAxLjUyNTtcbiAgICAgICAgICAgICAgICBpZiAoKGsgKj0gMikgPCAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAwLjUgKiAoayAqIGsgKiAoKHMgKyAxKSAqIGsgLSBzKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiAwLjUgKiAoKGsgLT0gMikgKiBrICogKChzICsgMSkgKiBrICsgcykgKyAyKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8vIOWIm+W7uuW8uei3s+aViOaenFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0ga1xuICAgICAgICAgICAgICogQHJldHVybiB7bnVtYmVyfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBCb3VuY2VJbjogZnVuY3Rpb24gKGspIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gMSAtIGVhc2luZy5Cb3VuY2VPdXQoMSAtIGspO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IGtcbiAgICAgICAgICAgICAqIEByZXR1cm4ge251bWJlcn1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgQm91bmNlT3V0OiBmdW5jdGlvbiAoaykge1xuICAgICAgICAgICAgICAgIGlmIChrIDwgKDEgLyAyLjc1KSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gNy41NjI1ICogayAqIGs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGsgPCAoMiAvIDIuNzUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiA3LjU2MjUgKiAoayAtPSAoMS41IC8gMi43NSkpICogayArIDAuNzU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGsgPCAoMi41IC8gMi43NSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDcuNTYyNSAqIChrIC09ICgyLjI1IC8gMi43NSkpICogayArIDAuOTM3NTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiA3LjU2MjUgKiAoayAtPSAoMi42MjUgLyAyLjc1KSkgKiBrICsgMC45ODQzNzU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IGtcbiAgICAgICAgICAgICAqIEByZXR1cm4ge251bWJlcn1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgQm91bmNlSW5PdXQ6IGZ1bmN0aW9uIChrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGsgPCAwLjUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVhc2luZy5Cb3VuY2VJbihrICogMikgKiAwLjU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBlYXNpbmcuQm91bmNlT3V0KGsgKiAyIC0gMSkgKiAwLjUgKyAwLjU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIGVhc2luZztcbiAgICB9XG4pO1xuXG4iXSwiZmlsZSI6InBsdWdpbnMvenJlbmRlci0yLjEuMC9zcmMvYW5pbWF0aW9uL2Vhc2luZy5qcyJ9
