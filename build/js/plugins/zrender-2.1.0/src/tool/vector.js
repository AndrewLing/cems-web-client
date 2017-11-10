define(
    function () {
        var ArrayCtor = typeof Float32Array === 'undefined'
            ? Array
            : Float32Array;

        /**
         * @typedef {Float32Array|Array.<number>} Vector2
         */
        /**
         * 二维向量类
         * @exports zrender/tool/vector
         */
        var vector = {
            /**
             * 创建一个向量
             * @param {number} [x=0]
             * @param {number} [y=0]
             * @return {Vector2}
             */
            create: function (x, y) {
                var out = new ArrayCtor(2);
                out[0] = x || 0;
                out[1] = y || 0;
                return out;
            },

            /**
             * 复制向量数据
             * @param {Vector2} out
             * @param {Vector2} v
             * @return {Vector2}
             */
            copy: function (out, v) {
                out[0] = v[0];
                out[1] = v[1];
                return out;
            },

            /**
             * 克隆一个向量
             * @param {Vector2} v
             * @return {Vector2}
             */
            clone: function (v) {
                var out = new ArrayCtor(2);
                out[0] = v[0];
                out[1] = v[1];
                return out;
            },

            /**
             * 设置向量的两个项
             * @param {Vector2} out
             * @param {number} a
             * @param {number} b
             * @return {Vector2} 结果
             */
            set: function (out, a, b) {
                out[0] = a;
                out[1] = b;
                return out;
            },

            /**
             * 向量相加
             * @param {Vector2} out
             * @param {Vector2} v1
             * @param {Vector2} v2
             */
            add: function (out, v1, v2) {
                out[0] = v1[0] + v2[0];
                out[1] = v1[1] + v2[1];
                return out;
            },

            /**
             * 向量缩放后相加
             * @param {Vector2} out
             * @param {Vector2} v1
             * @param {Vector2} v2
             * @param {number} a
             */
            scaleAndAdd: function (out, v1, v2, a) {
                out[0] = v1[0] + v2[0] * a;
                out[1] = v1[1] + v2[1] * a;
                return out;
            },

            /**
             * 向量相减
             * @param {Vector2} out
             * @param {Vector2} v1
             * @param {Vector2} v2
             */
            sub: function (out, v1, v2) {
                out[0] = v1[0] - v2[0];
                out[1] = v1[1] - v2[1];
                return out;
            },

            /**
             * 向量长度
             * @param {Vector2} v
             * @return {number}
             */
            len: function (v) {
                return Math.sqrt(this.lenSquare(v));
            },

            /**
             * 向量长度平方
             * @param {Vector2} v
             * @return {number}
             */
            lenSquare: function (v) {
                return v[0] * v[0] + v[1] * v[1];
            },

            /**
             * 向量乘法
             * @param {Vector2} out
             * @param {Vector2} v1
             * @param {Vector2} v2
             */
            mul: function (out, v1, v2) {
                out[0] = v1[0] * v2[0];
                out[1] = v1[1] * v2[1];
                return out;
            },

            /**
             * 向量除法
             * @param {Vector2} out
             * @param {Vector2} v1
             * @param {Vector2} v2
             */
            div: function (out, v1, v2) {
                out[0] = v1[0] / v2[0];
                out[1] = v1[1] / v2[1];
                return out;
            },

            /**
             * 向量点乘
             * @param {Vector2} v1
             * @param {Vector2} v2
             * @return {number}
             */
            dot: function (v1, v2) {
                return v1[0] * v2[0] + v1[1] * v2[1];
            },

            /**
             * 向量缩放
             * @param {Vector2} out
             * @param {Vector2} v
             * @param {number} s
             */
            scale: function (out, v, s) {
                out[0] = v[0] * s;
                out[1] = v[1] * s;
                return out;
            },

            /**
             * 向量归一化
             * @param {Vector2} out
             * @param {Vector2} v
             */
            normalize: function (out, v) {
                var d = vector.len(v);
                if (d === 0) {
                    out[0] = 0;
                    out[1] = 0;
                }
                else {
                    out[0] = v[0] / d;
                    out[1] = v[1] / d;
                }
                return out;
            },

            /**
             * 计算向量间距离
             * @param {Vector2} v1
             * @param {Vector2} v2
             * @return {number}
             */
            distance: function (v1, v2) {
                return Math.sqrt(
                    (v1[0] - v2[0]) * (v1[0] - v2[0])
                    + (v1[1] - v2[1]) * (v1[1] - v2[1])
                );
            },

            /**
             * 向量距离平方
             * @param {Vector2} v1
             * @param {Vector2} v2
             * @return {number}
             */
            distanceSquare: function (v1, v2) {
                return (v1[0] - v2[0]) * (v1[0] - v2[0])
                    + (v1[1] - v2[1]) * (v1[1] - v2[1]);
            },

            /**
             * 求负向量
             * @param {Vector2} out
             * @param {Vector2} v
             */
            negate: function (out, v) {
                out[0] = -v[0];
                out[1] = -v[1];
                return out;
            },

            /**
             * 插值两个点
             * @param {Vector2} out
             * @param {Vector2} v1
             * @param {Vector2} v2
             * @param {number} t
             */
            lerp: function (out, v1, v2, t) {
                // var ax = v1[0];
                // var ay = v1[1];
                out[0] = v1[0] + t * (v2[0] - v1[0]);
                out[1] = v1[1] + t * (v2[1] - v1[1]);
                return out;
            },
            
            /**
             * 矩阵左乘向量
             * @param {Vector2} out
             * @param {Vector2} v
             * @param {Vector2} m
             */
            applyTransform: function (out, v, m) {
                var x = v[0];
                var y = v[1];
                out[0] = m[0] * x + m[2] * y + m[4];
                out[1] = m[1] * x + m[3] * y + m[5];
                return out;
            },
            /**
             * 求两个向量最小值
             * @param  {Vector2} out
             * @param  {Vector2} v1
             * @param  {Vector2} v2
             */
            min: function (out, v1, v2) {
                out[0] = Math.min(v1[0], v2[0]);
                out[1] = Math.min(v1[1], v2[1]);
                return out;
            },
            /**
             * 求两个向量最大值
             * @param  {Vector2} out
             * @param  {Vector2} v1
             * @param  {Vector2} v2
             */
            max: function (out, v1, v2) {
                out[0] = Math.max(v1[0], v2[0]);
                out[1] = Math.max(v1[1], v2[1]);
                return out;
            }
        };

        vector.length = vector.len;
        vector.lengthSquare = vector.lenSquare;
        vector.dist = vector.distance;
        vector.distSquare = vector.distanceSquare;
        
        return vector;
    }
);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3Rvb2wvdmVjdG9yLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImRlZmluZShcbiAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBBcnJheUN0b3IgPSB0eXBlb2YgRmxvYXQzMkFycmF5ID09PSAndW5kZWZpbmVkJ1xuICAgICAgICAgICAgPyBBcnJheVxuICAgICAgICAgICAgOiBGbG9hdDMyQXJyYXk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEB0eXBlZGVmIHtGbG9hdDMyQXJyYXl8QXJyYXkuPG51bWJlcj59IFZlY3RvcjJcbiAgICAgICAgICovXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDkuoznu7TlkJHph4/nsbtcbiAgICAgICAgICogQGV4cG9ydHMgenJlbmRlci90b29sL3ZlY3RvclxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIHZlY3RvciA9IHtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5Yib5bu65LiA5Liq5ZCR6YePXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gW3g9MF1cbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbeT0wXVxuICAgICAgICAgICAgICogQHJldHVybiB7VmVjdG9yMn1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgY3JlYXRlOiBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICAgICAgICAgIHZhciBvdXQgPSBuZXcgQXJyYXlDdG9yKDIpO1xuICAgICAgICAgICAgICAgIG91dFswXSA9IHggfHwgMDtcbiAgICAgICAgICAgICAgICBvdXRbMV0gPSB5IHx8IDA7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5aSN5Yi25ZCR6YeP5pWw5o2uXG4gICAgICAgICAgICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IG91dFxuICAgICAgICAgICAgICogQHBhcmFtIHtWZWN0b3IyfSB2XG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtWZWN0b3IyfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBjb3B5OiBmdW5jdGlvbiAob3V0LCB2KSB7XG4gICAgICAgICAgICAgICAgb3V0WzBdID0gdlswXTtcbiAgICAgICAgICAgICAgICBvdXRbMV0gPSB2WzFdO1xuICAgICAgICAgICAgICAgIHJldHVybiBvdXQ7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOWFi+mahuS4gOS4quWQkemHj1xuICAgICAgICAgICAgICogQHBhcmFtIHtWZWN0b3IyfSB2XG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtWZWN0b3IyfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBjbG9uZTogZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgICAgICB2YXIgb3V0ID0gbmV3IEFycmF5Q3RvcigyKTtcbiAgICAgICAgICAgICAgICBvdXRbMF0gPSB2WzBdO1xuICAgICAgICAgICAgICAgIG91dFsxXSA9IHZbMV07XG4gICAgICAgICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog6K6+572u5ZCR6YeP55qE5Lik5Liq6aG5XG4gICAgICAgICAgICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IG91dFxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IGFcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBiXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtWZWN0b3IyfSDnu5PmnpxcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgc2V0OiBmdW5jdGlvbiAob3V0LCBhLCBiKSB7XG4gICAgICAgICAgICAgICAgb3V0WzBdID0gYTtcbiAgICAgICAgICAgICAgICBvdXRbMV0gPSBiO1xuICAgICAgICAgICAgICAgIHJldHVybiBvdXQ7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOWQkemHj+ebuOWKoFxuICAgICAgICAgICAgICogQHBhcmFtIHtWZWN0b3IyfSBvdXRcbiAgICAgICAgICAgICAqIEBwYXJhbSB7VmVjdG9yMn0gdjFcbiAgICAgICAgICAgICAqIEBwYXJhbSB7VmVjdG9yMn0gdjJcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgYWRkOiBmdW5jdGlvbiAob3V0LCB2MSwgdjIpIHtcbiAgICAgICAgICAgICAgICBvdXRbMF0gPSB2MVswXSArIHYyWzBdO1xuICAgICAgICAgICAgICAgIG91dFsxXSA9IHYxWzFdICsgdjJbMV07XG4gICAgICAgICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5ZCR6YeP57yp5pS+5ZCO55u45YqgXG4gICAgICAgICAgICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IG91dFxuICAgICAgICAgICAgICogQHBhcmFtIHtWZWN0b3IyfSB2MVxuICAgICAgICAgICAgICogQHBhcmFtIHtWZWN0b3IyfSB2MlxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IGFcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgc2NhbGVBbmRBZGQ6IGZ1bmN0aW9uIChvdXQsIHYxLCB2MiwgYSkge1xuICAgICAgICAgICAgICAgIG91dFswXSA9IHYxWzBdICsgdjJbMF0gKiBhO1xuICAgICAgICAgICAgICAgIG91dFsxXSA9IHYxWzFdICsgdjJbMV0gKiBhO1xuICAgICAgICAgICAgICAgIHJldHVybiBvdXQ7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOWQkemHj+ebuOWHj1xuICAgICAgICAgICAgICogQHBhcmFtIHtWZWN0b3IyfSBvdXRcbiAgICAgICAgICAgICAqIEBwYXJhbSB7VmVjdG9yMn0gdjFcbiAgICAgICAgICAgICAqIEBwYXJhbSB7VmVjdG9yMn0gdjJcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgc3ViOiBmdW5jdGlvbiAob3V0LCB2MSwgdjIpIHtcbiAgICAgICAgICAgICAgICBvdXRbMF0gPSB2MVswXSAtIHYyWzBdO1xuICAgICAgICAgICAgICAgIG91dFsxXSA9IHYxWzFdIC0gdjJbMV07XG4gICAgICAgICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5ZCR6YeP6ZW/5bqmXG4gICAgICAgICAgICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHZcbiAgICAgICAgICAgICAqIEByZXR1cm4ge251bWJlcn1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgbGVuOiBmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgICAgIHJldHVybiBNYXRoLnNxcnQodGhpcy5sZW5TcXVhcmUodikpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDlkJHph4/plb/luqblubPmlrlcbiAgICAgICAgICAgICAqIEBwYXJhbSB7VmVjdG9yMn0gdlxuICAgICAgICAgICAgICogQHJldHVybiB7bnVtYmVyfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBsZW5TcXVhcmU6IGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZbMF0gKiB2WzBdICsgdlsxXSAqIHZbMV07XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOWQkemHj+S5mOazlVxuICAgICAgICAgICAgICogQHBhcmFtIHtWZWN0b3IyfSBvdXRcbiAgICAgICAgICAgICAqIEBwYXJhbSB7VmVjdG9yMn0gdjFcbiAgICAgICAgICAgICAqIEBwYXJhbSB7VmVjdG9yMn0gdjJcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgbXVsOiBmdW5jdGlvbiAob3V0LCB2MSwgdjIpIHtcbiAgICAgICAgICAgICAgICBvdXRbMF0gPSB2MVswXSAqIHYyWzBdO1xuICAgICAgICAgICAgICAgIG91dFsxXSA9IHYxWzFdICogdjJbMV07XG4gICAgICAgICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5ZCR6YeP6Zmk5rOVXG4gICAgICAgICAgICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IG91dFxuICAgICAgICAgICAgICogQHBhcmFtIHtWZWN0b3IyfSB2MVxuICAgICAgICAgICAgICogQHBhcmFtIHtWZWN0b3IyfSB2MlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBkaXY6IGZ1bmN0aW9uIChvdXQsIHYxLCB2Mikge1xuICAgICAgICAgICAgICAgIG91dFswXSA9IHYxWzBdIC8gdjJbMF07XG4gICAgICAgICAgICAgICAgb3V0WzFdID0gdjFbMV0gLyB2MlsxXTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3V0O1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDlkJHph4/ngrnkuZhcbiAgICAgICAgICAgICAqIEBwYXJhbSB7VmVjdG9yMn0gdjFcbiAgICAgICAgICAgICAqIEBwYXJhbSB7VmVjdG9yMn0gdjJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge251bWJlcn1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZG90OiBmdW5jdGlvbiAodjEsIHYyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHYxWzBdICogdjJbMF0gKyB2MVsxXSAqIHYyWzFdO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDlkJHph4/nvKnmlL5cbiAgICAgICAgICAgICAqIEBwYXJhbSB7VmVjdG9yMn0gb3V0XG4gICAgICAgICAgICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHZcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBzXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHNjYWxlOiBmdW5jdGlvbiAob3V0LCB2LCBzKSB7XG4gICAgICAgICAgICAgICAgb3V0WzBdID0gdlswXSAqIHM7XG4gICAgICAgICAgICAgICAgb3V0WzFdID0gdlsxXSAqIHM7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5ZCR6YeP5b2S5LiA5YyWXG4gICAgICAgICAgICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IG91dFxuICAgICAgICAgICAgICogQHBhcmFtIHtWZWN0b3IyfSB2XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIG5vcm1hbGl6ZTogZnVuY3Rpb24gKG91dCwgdikge1xuICAgICAgICAgICAgICAgIHZhciBkID0gdmVjdG9yLmxlbih2KTtcbiAgICAgICAgICAgICAgICBpZiAoZCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBvdXRbMF0gPSAwO1xuICAgICAgICAgICAgICAgICAgICBvdXRbMV0gPSAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0WzBdID0gdlswXSAvIGQ7XG4gICAgICAgICAgICAgICAgICAgIG91dFsxXSA9IHZbMV0gLyBkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gb3V0O1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDorqHnrpflkJHph4/pl7Tot53nprtcbiAgICAgICAgICAgICAqIEBwYXJhbSB7VmVjdG9yMn0gdjFcbiAgICAgICAgICAgICAqIEBwYXJhbSB7VmVjdG9yMn0gdjJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge251bWJlcn1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZGlzdGFuY2U6IGZ1bmN0aW9uICh2MSwgdjIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KFxuICAgICAgICAgICAgICAgICAgICAodjFbMF0gLSB2MlswXSkgKiAodjFbMF0gLSB2MlswXSlcbiAgICAgICAgICAgICAgICAgICAgKyAodjFbMV0gLSB2MlsxXSkgKiAodjFbMV0gLSB2MlsxXSlcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDlkJHph4/ot53nprvlubPmlrlcbiAgICAgICAgICAgICAqIEBwYXJhbSB7VmVjdG9yMn0gdjFcbiAgICAgICAgICAgICAqIEBwYXJhbSB7VmVjdG9yMn0gdjJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge251bWJlcn1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZGlzdGFuY2VTcXVhcmU6IGZ1bmN0aW9uICh2MSwgdjIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHYxWzBdIC0gdjJbMF0pICogKHYxWzBdIC0gdjJbMF0pXG4gICAgICAgICAgICAgICAgICAgICsgKHYxWzFdIC0gdjJbMV0pICogKHYxWzFdIC0gdjJbMV0pO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDmsYLotJ/lkJHph49cbiAgICAgICAgICAgICAqIEBwYXJhbSB7VmVjdG9yMn0gb3V0XG4gICAgICAgICAgICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHZcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgbmVnYXRlOiBmdW5jdGlvbiAob3V0LCB2KSB7XG4gICAgICAgICAgICAgICAgb3V0WzBdID0gLXZbMF07XG4gICAgICAgICAgICAgICAgb3V0WzFdID0gLXZbMV07XG4gICAgICAgICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5o+S5YC85Lik5Liq54K5XG4gICAgICAgICAgICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IG91dFxuICAgICAgICAgICAgICogQHBhcmFtIHtWZWN0b3IyfSB2MVxuICAgICAgICAgICAgICogQHBhcmFtIHtWZWN0b3IyfSB2MlxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHRcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgbGVycDogZnVuY3Rpb24gKG91dCwgdjEsIHYyLCB0KSB7XG4gICAgICAgICAgICAgICAgLy8gdmFyIGF4ID0gdjFbMF07XG4gICAgICAgICAgICAgICAgLy8gdmFyIGF5ID0gdjFbMV07XG4gICAgICAgICAgICAgICAgb3V0WzBdID0gdjFbMF0gKyB0ICogKHYyWzBdIC0gdjFbMF0pO1xuICAgICAgICAgICAgICAgIG91dFsxXSA9IHYxWzFdICsgdCAqICh2MlsxXSAtIHYxWzFdKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3V0O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDnn6npmLXlt6bkuZjlkJHph49cbiAgICAgICAgICAgICAqIEBwYXJhbSB7VmVjdG9yMn0gb3V0XG4gICAgICAgICAgICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHZcbiAgICAgICAgICAgICAqIEBwYXJhbSB7VmVjdG9yMn0gbVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBhcHBseVRyYW5zZm9ybTogZnVuY3Rpb24gKG91dCwgdiwgbSkge1xuICAgICAgICAgICAgICAgIHZhciB4ID0gdlswXTtcbiAgICAgICAgICAgICAgICB2YXIgeSA9IHZbMV07XG4gICAgICAgICAgICAgICAgb3V0WzBdID0gbVswXSAqIHggKyBtWzJdICogeSArIG1bNF07XG4gICAgICAgICAgICAgICAgb3V0WzFdID0gbVsxXSAqIHggKyBtWzNdICogeSArIG1bNV07XG4gICAgICAgICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOaxguS4pOS4quWQkemHj+acgOWwj+WAvFxuICAgICAgICAgICAgICogQHBhcmFtICB7VmVjdG9yMn0gb3V0XG4gICAgICAgICAgICAgKiBAcGFyYW0gIHtWZWN0b3IyfSB2MVxuICAgICAgICAgICAgICogQHBhcmFtICB7VmVjdG9yMn0gdjJcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgbWluOiBmdW5jdGlvbiAob3V0LCB2MSwgdjIpIHtcbiAgICAgICAgICAgICAgICBvdXRbMF0gPSBNYXRoLm1pbih2MVswXSwgdjJbMF0pO1xuICAgICAgICAgICAgICAgIG91dFsxXSA9IE1hdGgubWluKHYxWzFdLCB2MlsxXSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOaxguS4pOS4quWQkemHj+acgOWkp+WAvFxuICAgICAgICAgICAgICogQHBhcmFtICB7VmVjdG9yMn0gb3V0XG4gICAgICAgICAgICAgKiBAcGFyYW0gIHtWZWN0b3IyfSB2MVxuICAgICAgICAgICAgICogQHBhcmFtICB7VmVjdG9yMn0gdjJcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgbWF4OiBmdW5jdGlvbiAob3V0LCB2MSwgdjIpIHtcbiAgICAgICAgICAgICAgICBvdXRbMF0gPSBNYXRoLm1heCh2MVswXSwgdjJbMF0pO1xuICAgICAgICAgICAgICAgIG91dFsxXSA9IE1hdGgubWF4KHYxWzFdLCB2MlsxXSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB2ZWN0b3IubGVuZ3RoID0gdmVjdG9yLmxlbjtcbiAgICAgICAgdmVjdG9yLmxlbmd0aFNxdWFyZSA9IHZlY3Rvci5sZW5TcXVhcmU7XG4gICAgICAgIHZlY3Rvci5kaXN0ID0gdmVjdG9yLmRpc3RhbmNlO1xuICAgICAgICB2ZWN0b3IuZGlzdFNxdWFyZSA9IHZlY3Rvci5kaXN0YW5jZVNxdWFyZTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB2ZWN0b3I7XG4gICAgfVxuKTtcbiJdLCJmaWxlIjoicGx1Z2lucy96cmVuZGVyLTIuMS4wL3NyYy90b29sL3ZlY3Rvci5qcyJ9
