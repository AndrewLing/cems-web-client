/**
 * zrender: 数学辅助类
 *
 * @author Kener (@Kener-林峰, kener.linfeng@gmail.com)
 *
 * sin：正弦函数
 * cos：余弦函数
 * degreeToRadian：角度转弧度
 * radianToDegree：弧度转角度
 */
define(
    function () {

        var _radians = Math.PI / 180;

        /**
         * @param {number} angle 弧度（角度）参数
         * @param {boolean} isDegrees angle参数是否为角度计算，默认为false，angle为以弧度计量的角度
         */
        function sin(angle, isDegrees) {
            return Math.sin(isDegrees ? angle * _radians : angle);
        }

        /**
         * @param {number} angle 弧度（角度）参数
         * @param {boolean} isDegrees angle参数是否为角度计算，默认为false，angle为以弧度计量的角度
         */
        function cos(angle, isDegrees) {
            return Math.cos(isDegrees ? angle * _radians : angle);
        }

        /**
         * 角度转弧度
         * @param {Object} angle
         */
        function degreeToRadian(angle) {
            return angle * _radians;
        }

        /**
         * 弧度转角度
         * @param {Object} angle
         */
        function radianToDegree(angle) {
            return angle / _radians;
        }

        return {
            sin : sin,
            cos : cos,
            degreeToRadian : degreeToRadian,
            radianToDegree : radianToDegree
        };
    }
);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3Rvb2wvbWF0aC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIHpyZW5kZXI6IOaVsOWtpui+heWKqeexu1xuICpcbiAqIEBhdXRob3IgS2VuZXIgKEBLZW5lci3mnpfls7AsIGtlbmVyLmxpbmZlbmdAZ21haWwuY29tKVxuICpcbiAqIHNpbu+8muato+W8puWHveaVsFxuICogY29z77ya5L2Z5bym5Ye95pWwXG4gKiBkZWdyZWVUb1JhZGlhbu+8muinkuW6pui9rOW8p+W6plxuICogcmFkaWFuVG9EZWdyZWXvvJrlvKfluqbovazop5LluqZcbiAqL1xuZGVmaW5lKFxuICAgIGZ1bmN0aW9uICgpIHtcblxuICAgICAgICB2YXIgX3JhZGlhbnMgPSBNYXRoLlBJIC8gMTgwO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gYW5nbGUg5byn5bqm77yI6KeS5bqm77yJ5Y+C5pWwXG4gICAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNEZWdyZWVzIGFuZ2xl5Y+C5pWw5piv5ZCm5Li66KeS5bqm6K6h566X77yM6buY6K6k5Li6ZmFsc2XvvIxhbmdsZeS4uuS7peW8p+W6puiuoemHj+eahOinkuW6plxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gc2luKGFuZ2xlLCBpc0RlZ3JlZXMpIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLnNpbihpc0RlZ3JlZXMgPyBhbmdsZSAqIF9yYWRpYW5zIDogYW5nbGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBhbmdsZSDlvKfluqbvvIjop5LluqbvvInlj4LmlbBcbiAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBpc0RlZ3JlZXMgYW5nbGXlj4LmlbDmmK/lkKbkuLrop5LluqborqHnrpfvvIzpu5jorqTkuLpmYWxzZe+8jGFuZ2xl5Li65Lul5byn5bqm6K6h6YeP55qE6KeS5bqmXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBjb3MoYW5nbGUsIGlzRGVncmVlcykge1xuICAgICAgICAgICAgcmV0dXJuIE1hdGguY29zKGlzRGVncmVlcyA/IGFuZ2xlICogX3JhZGlhbnMgOiBhbmdsZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICog6KeS5bqm6L2s5byn5bqmXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBhbmdsZVxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gZGVncmVlVG9SYWRpYW4oYW5nbGUpIHtcbiAgICAgICAgICAgIHJldHVybiBhbmdsZSAqIF9yYWRpYW5zO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOW8p+W6pui9rOinkuW6plxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYW5nbGVcbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIHJhZGlhblRvRGVncmVlKGFuZ2xlKSB7XG4gICAgICAgICAgICByZXR1cm4gYW5nbGUgLyBfcmFkaWFucztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzaW4gOiBzaW4sXG4gICAgICAgICAgICBjb3MgOiBjb3MsXG4gICAgICAgICAgICBkZWdyZWVUb1JhZGlhbiA6IGRlZ3JlZVRvUmFkaWFuLFxuICAgICAgICAgICAgcmFkaWFuVG9EZWdyZWUgOiByYWRpYW5Ub0RlZ3JlZVxuICAgICAgICB9O1xuICAgIH1cbik7XG4iXSwiZmlsZSI6InBsdWdpbnMvenJlbmRlci0yLjEuMC9zcmMvdG9vbC9tYXRoLmpzIn0=
