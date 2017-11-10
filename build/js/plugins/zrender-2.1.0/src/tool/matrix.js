define(
    function () {

        var ArrayCtor = typeof Float32Array === 'undefined'
            ? Array
            : Float32Array;
        /**
         * 3x2矩阵操作类
         * @exports zrender/tool/matrix
         */
        var matrix = {
            /**
             * 创建一个单位矩阵
             * @return {Float32Array|Array.<number>}
             */
            create : function() {
                var out = new ArrayCtor(6);
                matrix.identity(out);
                
                return out;
            },
            /**
             * 设置矩阵为单位矩阵
             * @param {Float32Array|Array.<number>} out
             */
            identity : function(out) {
                out[0] = 1;
                out[1] = 0;
                out[2] = 0;
                out[3] = 1;
                out[4] = 0;
                out[5] = 0;
                return out;
            },
            /**
             * 复制矩阵
             * @param {Float32Array|Array.<number>} out
             * @param {Float32Array|Array.<number>} m
             */
            copy: function(out, m) {
                out[0] = m[0];
                out[1] = m[1];
                out[2] = m[2];
                out[3] = m[3];
                out[4] = m[4];
                out[5] = m[5];
                return out;
            },
            /**
             * 矩阵相乘
             * @param {Float32Array|Array.<number>} out
             * @param {Float32Array|Array.<number>} m1
             * @param {Float32Array|Array.<number>} m2
             */
            mul : function (out, m1, m2) {
                out[0] = m1[0] * m2[0] + m1[2] * m2[1];
                out[1] = m1[1] * m2[0] + m1[3] * m2[1];
                out[2] = m1[0] * m2[2] + m1[2] * m2[3];
                out[3] = m1[1] * m2[2] + m1[3] * m2[3];
                out[4] = m1[0] * m2[4] + m1[2] * m2[5] + m1[4];
                out[5] = m1[1] * m2[4] + m1[3] * m2[5] + m1[5];
                return out;
            },
            /**
             * 平移变换
             * @param {Float32Array|Array.<number>} out
             * @param {Float32Array|Array.<number>} a
             * @param {Float32Array|Array.<number>} v
             */
            translate : function(out, a, v) {
                out[0] = a[0];
                out[1] = a[1];
                out[2] = a[2];
                out[3] = a[3];
                out[4] = a[4] + v[0];
                out[5] = a[5] + v[1];
                return out;
            },
            /**
             * 旋转变换
             * @param {Float32Array|Array.<number>} out
             * @param {Float32Array|Array.<number>} a
             * @param {number} rad
             */
            rotate : function(out, a, rad) {
                var aa = a[0];
                var ac = a[2];
                var atx = a[4];
                var ab = a[1];
                var ad = a[3];
                var aty = a[5];
                var st = Math.sin(rad);
                var ct = Math.cos(rad);

                out[0] = aa * ct + ab * st;
                out[1] = -aa * st + ab * ct;
                out[2] = ac * ct + ad * st;
                out[3] = -ac * st + ct * ad;
                out[4] = ct * atx + st * aty;
                out[5] = ct * aty - st * atx;
                return out;
            },
            /**
             * 缩放变换
             * @param {Float32Array|Array.<number>} out
             * @param {Float32Array|Array.<number>} a
             * @param {Float32Array|Array.<number>} v
             */
            scale : function(out, a, v) {
                var vx = v[0];
                var vy = v[1];
                out[0] = a[0] * vx;
                out[1] = a[1] * vy;
                out[2] = a[2] * vx;
                out[3] = a[3] * vy;
                out[4] = a[4] * vx;
                out[5] = a[5] * vy;
                return out;
            },
            /**
             * 求逆矩阵
             * @param {Float32Array|Array.<number>} out
             * @param {Float32Array|Array.<number>} a
             */
            invert : function(out, a) {
            
                var aa = a[0];
                var ac = a[2];
                var atx = a[4];
                var ab = a[1];
                var ad = a[3];
                var aty = a[5];

                var det = aa * ad - ab * ac;
                if (!det) {
                    return null;
                }
                det = 1.0 / det;

                out[0] = ad * det;
                out[1] = -ab * det;
                out[2] = -ac * det;
                out[3] = aa * det;
                out[4] = (ac * aty - ad * atx) * det;
                out[5] = (ab * atx - aa * aty) * det;
                return out;
            }
        };

        return matrix;
    }
);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3Rvb2wvbWF0cml4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImRlZmluZShcbiAgICBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgdmFyIEFycmF5Q3RvciA9IHR5cGVvZiBGbG9hdDMyQXJyYXkgPT09ICd1bmRlZmluZWQnXG4gICAgICAgICAgICA/IEFycmF5XG4gICAgICAgICAgICA6IEZsb2F0MzJBcnJheTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIDN4MuefqemYteaTjeS9nOexu1xuICAgICAgICAgKiBAZXhwb3J0cyB6cmVuZGVyL3Rvb2wvbWF0cml4XG4gICAgICAgICAqL1xuICAgICAgICB2YXIgbWF0cml4ID0ge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDliJvlu7rkuIDkuKrljZXkvY3nn6npmLVcbiAgICAgICAgICAgICAqIEByZXR1cm4ge0Zsb2F0MzJBcnJheXxBcnJheS48bnVtYmVyPn1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgY3JlYXRlIDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIG91dCA9IG5ldyBBcnJheUN0b3IoNik7XG4gICAgICAgICAgICAgICAgbWF0cml4LmlkZW50aXR5KG91dCk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOiuvue9ruefqemYteS4uuWNleS9jeefqemYtVxuICAgICAgICAgICAgICogQHBhcmFtIHtGbG9hdDMyQXJyYXl8QXJyYXkuPG51bWJlcj59IG91dFxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBpZGVudGl0eSA6IGZ1bmN0aW9uKG91dCkge1xuICAgICAgICAgICAgICAgIG91dFswXSA9IDE7XG4gICAgICAgICAgICAgICAgb3V0WzFdID0gMDtcbiAgICAgICAgICAgICAgICBvdXRbMl0gPSAwO1xuICAgICAgICAgICAgICAgIG91dFszXSA9IDE7XG4gICAgICAgICAgICAgICAgb3V0WzRdID0gMDtcbiAgICAgICAgICAgICAgICBvdXRbNV0gPSAwO1xuICAgICAgICAgICAgICAgIHJldHVybiBvdXQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDlpI3liLbnn6npmLVcbiAgICAgICAgICAgICAqIEBwYXJhbSB7RmxvYXQzMkFycmF5fEFycmF5LjxudW1iZXI+fSBvdXRcbiAgICAgICAgICAgICAqIEBwYXJhbSB7RmxvYXQzMkFycmF5fEFycmF5LjxudW1iZXI+fSBtXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGNvcHk6IGZ1bmN0aW9uKG91dCwgbSkge1xuICAgICAgICAgICAgICAgIG91dFswXSA9IG1bMF07XG4gICAgICAgICAgICAgICAgb3V0WzFdID0gbVsxXTtcbiAgICAgICAgICAgICAgICBvdXRbMl0gPSBtWzJdO1xuICAgICAgICAgICAgICAgIG91dFszXSA9IG1bM107XG4gICAgICAgICAgICAgICAgb3V0WzRdID0gbVs0XTtcbiAgICAgICAgICAgICAgICBvdXRbNV0gPSBtWzVdO1xuICAgICAgICAgICAgICAgIHJldHVybiBvdXQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDnn6npmLXnm7jkuZhcbiAgICAgICAgICAgICAqIEBwYXJhbSB7RmxvYXQzMkFycmF5fEFycmF5LjxudW1iZXI+fSBvdXRcbiAgICAgICAgICAgICAqIEBwYXJhbSB7RmxvYXQzMkFycmF5fEFycmF5LjxudW1iZXI+fSBtMVxuICAgICAgICAgICAgICogQHBhcmFtIHtGbG9hdDMyQXJyYXl8QXJyYXkuPG51bWJlcj59IG0yXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIG11bCA6IGZ1bmN0aW9uIChvdXQsIG0xLCBtMikge1xuICAgICAgICAgICAgICAgIG91dFswXSA9IG0xWzBdICogbTJbMF0gKyBtMVsyXSAqIG0yWzFdO1xuICAgICAgICAgICAgICAgIG91dFsxXSA9IG0xWzFdICogbTJbMF0gKyBtMVszXSAqIG0yWzFdO1xuICAgICAgICAgICAgICAgIG91dFsyXSA9IG0xWzBdICogbTJbMl0gKyBtMVsyXSAqIG0yWzNdO1xuICAgICAgICAgICAgICAgIG91dFszXSA9IG0xWzFdICogbTJbMl0gKyBtMVszXSAqIG0yWzNdO1xuICAgICAgICAgICAgICAgIG91dFs0XSA9IG0xWzBdICogbTJbNF0gKyBtMVsyXSAqIG0yWzVdICsgbTFbNF07XG4gICAgICAgICAgICAgICAgb3V0WzVdID0gbTFbMV0gKiBtMls0XSArIG0xWzNdICogbTJbNV0gKyBtMVs1XTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3V0O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5bmz56e75Y+Y5o2iXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0Zsb2F0MzJBcnJheXxBcnJheS48bnVtYmVyPn0gb3V0XG4gICAgICAgICAgICAgKiBAcGFyYW0ge0Zsb2F0MzJBcnJheXxBcnJheS48bnVtYmVyPn0gYVxuICAgICAgICAgICAgICogQHBhcmFtIHtGbG9hdDMyQXJyYXl8QXJyYXkuPG51bWJlcj59IHZcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdHJhbnNsYXRlIDogZnVuY3Rpb24ob3V0LCBhLCB2KSB7XG4gICAgICAgICAgICAgICAgb3V0WzBdID0gYVswXTtcbiAgICAgICAgICAgICAgICBvdXRbMV0gPSBhWzFdO1xuICAgICAgICAgICAgICAgIG91dFsyXSA9IGFbMl07XG4gICAgICAgICAgICAgICAgb3V0WzNdID0gYVszXTtcbiAgICAgICAgICAgICAgICBvdXRbNF0gPSBhWzRdICsgdlswXTtcbiAgICAgICAgICAgICAgICBvdXRbNV0gPSBhWzVdICsgdlsxXTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3V0O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5peL6L2s5Y+Y5o2iXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0Zsb2F0MzJBcnJheXxBcnJheS48bnVtYmVyPn0gb3V0XG4gICAgICAgICAgICAgKiBAcGFyYW0ge0Zsb2F0MzJBcnJheXxBcnJheS48bnVtYmVyPn0gYVxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHJhZFxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICByb3RhdGUgOiBmdW5jdGlvbihvdXQsIGEsIHJhZCkge1xuICAgICAgICAgICAgICAgIHZhciBhYSA9IGFbMF07XG4gICAgICAgICAgICAgICAgdmFyIGFjID0gYVsyXTtcbiAgICAgICAgICAgICAgICB2YXIgYXR4ID0gYVs0XTtcbiAgICAgICAgICAgICAgICB2YXIgYWIgPSBhWzFdO1xuICAgICAgICAgICAgICAgIHZhciBhZCA9IGFbM107XG4gICAgICAgICAgICAgICAgdmFyIGF0eSA9IGFbNV07XG4gICAgICAgICAgICAgICAgdmFyIHN0ID0gTWF0aC5zaW4ocmFkKTtcbiAgICAgICAgICAgICAgICB2YXIgY3QgPSBNYXRoLmNvcyhyYWQpO1xuXG4gICAgICAgICAgICAgICAgb3V0WzBdID0gYWEgKiBjdCArIGFiICogc3Q7XG4gICAgICAgICAgICAgICAgb3V0WzFdID0gLWFhICogc3QgKyBhYiAqIGN0O1xuICAgICAgICAgICAgICAgIG91dFsyXSA9IGFjICogY3QgKyBhZCAqIHN0O1xuICAgICAgICAgICAgICAgIG91dFszXSA9IC1hYyAqIHN0ICsgY3QgKiBhZDtcbiAgICAgICAgICAgICAgICBvdXRbNF0gPSBjdCAqIGF0eCArIHN0ICogYXR5O1xuICAgICAgICAgICAgICAgIG91dFs1XSA9IGN0ICogYXR5IC0gc3QgKiBhdHg7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOe8qeaUvuWPmOaNolxuICAgICAgICAgICAgICogQHBhcmFtIHtGbG9hdDMyQXJyYXl8QXJyYXkuPG51bWJlcj59IG91dFxuICAgICAgICAgICAgICogQHBhcmFtIHtGbG9hdDMyQXJyYXl8QXJyYXkuPG51bWJlcj59IGFcbiAgICAgICAgICAgICAqIEBwYXJhbSB7RmxvYXQzMkFycmF5fEFycmF5LjxudW1iZXI+fSB2XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHNjYWxlIDogZnVuY3Rpb24ob3V0LCBhLCB2KSB7XG4gICAgICAgICAgICAgICAgdmFyIHZ4ID0gdlswXTtcbiAgICAgICAgICAgICAgICB2YXIgdnkgPSB2WzFdO1xuICAgICAgICAgICAgICAgIG91dFswXSA9IGFbMF0gKiB2eDtcbiAgICAgICAgICAgICAgICBvdXRbMV0gPSBhWzFdICogdnk7XG4gICAgICAgICAgICAgICAgb3V0WzJdID0gYVsyXSAqIHZ4O1xuICAgICAgICAgICAgICAgIG91dFszXSA9IGFbM10gKiB2eTtcbiAgICAgICAgICAgICAgICBvdXRbNF0gPSBhWzRdICogdng7XG4gICAgICAgICAgICAgICAgb3V0WzVdID0gYVs1XSAqIHZ5O1xuICAgICAgICAgICAgICAgIHJldHVybiBvdXQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDmsYLpgIbnn6npmLVcbiAgICAgICAgICAgICAqIEBwYXJhbSB7RmxvYXQzMkFycmF5fEFycmF5LjxudW1iZXI+fSBvdXRcbiAgICAgICAgICAgICAqIEBwYXJhbSB7RmxvYXQzMkFycmF5fEFycmF5LjxudW1iZXI+fSBhXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGludmVydCA6IGZ1bmN0aW9uKG91dCwgYSkge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIGFhID0gYVswXTtcbiAgICAgICAgICAgICAgICB2YXIgYWMgPSBhWzJdO1xuICAgICAgICAgICAgICAgIHZhciBhdHggPSBhWzRdO1xuICAgICAgICAgICAgICAgIHZhciBhYiA9IGFbMV07XG4gICAgICAgICAgICAgICAgdmFyIGFkID0gYVszXTtcbiAgICAgICAgICAgICAgICB2YXIgYXR5ID0gYVs1XTtcblxuICAgICAgICAgICAgICAgIHZhciBkZXQgPSBhYSAqIGFkIC0gYWIgKiBhYztcbiAgICAgICAgICAgICAgICBpZiAoIWRldCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZGV0ID0gMS4wIC8gZGV0O1xuXG4gICAgICAgICAgICAgICAgb3V0WzBdID0gYWQgKiBkZXQ7XG4gICAgICAgICAgICAgICAgb3V0WzFdID0gLWFiICogZGV0O1xuICAgICAgICAgICAgICAgIG91dFsyXSA9IC1hYyAqIGRldDtcbiAgICAgICAgICAgICAgICBvdXRbM10gPSBhYSAqIGRldDtcbiAgICAgICAgICAgICAgICBvdXRbNF0gPSAoYWMgKiBhdHkgLSBhZCAqIGF0eCkgKiBkZXQ7XG4gICAgICAgICAgICAgICAgb3V0WzVdID0gKGFiICogYXR4IC0gYWEgKiBhdHkpICogZGV0O1xuICAgICAgICAgICAgICAgIHJldHVybiBvdXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIG1hdHJpeDtcbiAgICB9XG4pO1xuIl0sImZpbGUiOiJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3Rvb2wvbWF0cml4LmpzIn0=
