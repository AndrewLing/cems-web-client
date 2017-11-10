/**
 * 提供变换扩展
 * @module zrender/mixin/Transformable
 * @author pissang (https://www.github.com/pissang)
 */
define(function (require) {

    'use strict';

    var matrix = require('../tool/matrix');
    var vector = require('../tool/vector');
    var origin = [0, 0];

    var mTranslate = matrix.translate;

    var EPSILON = 5e-5;

    function isAroundZero(val) {
        return val > -EPSILON && val < EPSILON;
    }
    function isNotAroundZero(val) {
        return val > EPSILON || val < -EPSILON;
    }

    /**
     * @alias module:zrender/mixin/Transformable
     * @constructor
     */
    var Transformable = function () {

        if (!this.position) {
            /**
             * 平移
             * @type {Array.<number>}
             * @default [0, 0]
             */
            this.position = [ 0, 0 ];
        }
        if (typeof(this.rotation) == 'undefined') {
            /**
             * 旋转，可以通过数组二三项指定旋转的原点
             * @type {Array.<number>}
             * @default [0, 0, 0]
             */
            this.rotation = [ 0, 0, 0 ];
        }
        if (!this.scale) {
            /**
             * 缩放，可以通过数组三四项指定缩放的原点
             * @type {Array.<number>}
             * @default [1, 1, 0, 0]
             */
            this.scale = [ 1, 1, 0, 0 ];
        }

        this.needLocalTransform = false;

        /**
         * 是否有坐标变换
         * @type {boolean}
         * @readOnly
         */
        this.needTransform = false;
    };

    Transformable.prototype = {
        
        constructor: Transformable,

        updateNeedTransform: function () {
            this.needLocalTransform = isNotAroundZero(this.rotation[0])
                || isNotAroundZero(this.position[0])
                || isNotAroundZero(this.position[1])
                || isNotAroundZero(this.scale[0] - 1)
                || isNotAroundZero(this.scale[1] - 1);
        },

        /**
         * 判断是否需要有坐标变换，更新needTransform属性。
         * 如果有坐标变换, 则从position, rotation, scale以及父节点的transform计算出自身的transform矩阵
         */
        updateTransform: function () {
            
            this.updateNeedTransform();

            var parentHasTransform = this.parent && this.parent.needTransform;
            this.needTransform = this.needLocalTransform || parentHasTransform;
            
            if (!this.needTransform) {
                return;
            }

            var m = this.transform || matrix.create();
            matrix.identity(m);

            if (this.needLocalTransform) {
                var scale = this.scale;
                if (
                    isNotAroundZero(scale[0])
                 || isNotAroundZero(scale[1])
                ) {
                    origin[0] = -scale[2] || 0;
                    origin[1] = -scale[3] || 0;
                    var haveOrigin = isNotAroundZero(origin[0])
                                  || isNotAroundZero(origin[1]);
                    if (haveOrigin) {
                        mTranslate(m, m, origin);
                    }
                    matrix.scale(m, m, scale);
                    if (haveOrigin) {
                        origin[0] = -origin[0];
                        origin[1] = -origin[1];
                        mTranslate(m, m, origin);
                    }
                }

                if (this.rotation instanceof Array) {
                    if (this.rotation[0] !== 0) {
                        origin[0] = -this.rotation[1] || 0;
                        origin[1] = -this.rotation[2] || 0;
                        var haveOrigin = isNotAroundZero(origin[0])
                                      || isNotAroundZero(origin[1]);
                        if (haveOrigin) {
                            mTranslate(m, m, origin);
                        }
                        matrix.rotate(m, m, this.rotation[0]);
                        if (haveOrigin) {
                            origin[0] = -origin[0];
                            origin[1] = -origin[1];
                            mTranslate(m, m, origin);
                        }
                    }
                }
                else {
                    if (this.rotation !== 0) {
                        matrix.rotate(m, m, this.rotation);
                    }
                }

                if (
                    isNotAroundZero(this.position[0]) || isNotAroundZero(this.position[1])
                ) {
                    mTranslate(m, m, this.position);
                }
            }

            // 应用父节点变换
            if (parentHasTransform) {
                if (this.needLocalTransform) {
                    matrix.mul(m, this.parent.transform, m);
                }
                else {
                    matrix.copy(m, this.parent.transform);
                }
            }
            // 保存这个变换矩阵
            this.transform = m;

            this.invTransform = this.invTransform || matrix.create();
            matrix.invert(this.invTransform, m);
        },
        /**
         * 将自己的transform应用到context上
         * @param {Context2D} ctx
         */
        setTransform: function (ctx) {
            if (this.needTransform) {
                var m = this.transform;
                ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
            }
        },
        /**
         * 设置图形的朝向
         * @param  {Array.<number>|Float32Array} target
         * @method
         */
        lookAt: (function () {
            var v = vector.create();
            return function(target) {
                if (!this.transform) {
                    this.transform = matrix.create();
                }
                var m = this.transform;
                vector.sub(v, target, this.position);
                if (isAroundZero(v[0]) && isAroundZero(v[1])) {
                    return;
                }
                vector.normalize(v, v);
                var scale = this.scale;
                // Y Axis
                // TODO Scale origin ?
                m[2] = v[0] * scale[1];
                m[3] = v[1] * scale[1];
                // X Axis
                m[0] = v[1] * scale[0];
                m[1] = -v[0] * scale[0];
                // Position
                m[4] = this.position[0];
                m[5] = this.position[1];

                this.decomposeTransform();
            };
        })(),
        /**
         * 分解`transform`矩阵到`position`, `rotation`, `scale`
         */
        decomposeTransform: function () {
            if (!this.transform) {
                return;
            }
            var m = this.transform;
            var sx = m[0] * m[0] + m[1] * m[1];
            var position = this.position;
            var scale = this.scale;
            var rotation = this.rotation;
            if (isNotAroundZero(sx - 1)) {
                sx = Math.sqrt(sx);
            }
            var sy = m[2] * m[2] + m[3] * m[3];
            if (isNotAroundZero(sy - 1)) {
                sy = Math.sqrt(sy);
            }
            position[0] = m[4];
            position[1] = m[5];
            scale[0] = sx;
            scale[1] = sy;
            scale[2] = scale[3] = 0;
            rotation[0] = Math.atan2(-m[1] / sy, m[0] / sx);
            rotation[1] = rotation[2] = 0;
        },

        /**
         * 变换坐标位置到 shape 的局部坐标空间
         * @method
         * @param {number} x
         * @param {number} y
         * @return {Array.<number>}
         */
        transformCoordToLocal: function (x, y) {
            var v2 = [x, y];
            if (this.needTransform && this.invTransform) {
                vector.applyTransform(v2, v2, this.invTransform);
            }
            return v2;
        }
    };

    return Transformable;
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL21peGluL1RyYW5zZm9ybWFibGUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiDmj5Dkvpvlj5jmjaLmianlsZVcbiAqIEBtb2R1bGUgenJlbmRlci9taXhpbi9UcmFuc2Zvcm1hYmxlXG4gKiBAYXV0aG9yIHBpc3NhbmcgKGh0dHBzOi8vd3d3LmdpdGh1Yi5jb20vcGlzc2FuZylcbiAqL1xuZGVmaW5lKGZ1bmN0aW9uIChyZXF1aXJlKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgbWF0cml4ID0gcmVxdWlyZSgnLi4vdG9vbC9tYXRyaXgnKTtcbiAgICB2YXIgdmVjdG9yID0gcmVxdWlyZSgnLi4vdG9vbC92ZWN0b3InKTtcbiAgICB2YXIgb3JpZ2luID0gWzAsIDBdO1xuXG4gICAgdmFyIG1UcmFuc2xhdGUgPSBtYXRyaXgudHJhbnNsYXRlO1xuXG4gICAgdmFyIEVQU0lMT04gPSA1ZS01O1xuXG4gICAgZnVuY3Rpb24gaXNBcm91bmRaZXJvKHZhbCkge1xuICAgICAgICByZXR1cm4gdmFsID4gLUVQU0lMT04gJiYgdmFsIDwgRVBTSUxPTjtcbiAgICB9XG4gICAgZnVuY3Rpb24gaXNOb3RBcm91bmRaZXJvKHZhbCkge1xuICAgICAgICByZXR1cm4gdmFsID4gRVBTSUxPTiB8fCB2YWwgPCAtRVBTSUxPTjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAYWxpYXMgbW9kdWxlOnpyZW5kZXIvbWl4aW4vVHJhbnNmb3JtYWJsZVxuICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAqL1xuICAgIHZhciBUcmFuc2Zvcm1hYmxlID0gZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIGlmICghdGhpcy5wb3NpdGlvbikge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDlubPnp7tcbiAgICAgICAgICAgICAqIEB0eXBlIHtBcnJheS48bnVtYmVyPn1cbiAgICAgICAgICAgICAqIEBkZWZhdWx0IFswLCAwXVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLnBvc2l0aW9uID0gWyAwLCAwIF07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZih0aGlzLnJvdGF0aW9uKSA9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDml4vovazvvIzlj6/ku6XpgJrov4fmlbDnu4TkuozkuInpobnmjIflrprml4vovaznmoTljp/ngrlcbiAgICAgICAgICAgICAqIEB0eXBlIHtBcnJheS48bnVtYmVyPn1cbiAgICAgICAgICAgICAqIEBkZWZhdWx0IFswLCAwLCAwXVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLnJvdGF0aW9uID0gWyAwLCAwLCAwIF07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLnNjYWxlKSB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOe8qeaUvu+8jOWPr+S7pemAmui/h+aVsOe7hOS4ieWbm+mhueaMh+Wumue8qeaUvueahOWOn+eCuVxuICAgICAgICAgICAgICogQHR5cGUge0FycmF5LjxudW1iZXI+fVxuICAgICAgICAgICAgICogQGRlZmF1bHQgWzEsIDEsIDAsIDBdXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRoaXMuc2NhbGUgPSBbIDEsIDEsIDAsIDAgXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMubmVlZExvY2FsVHJhbnNmb3JtID0gZmFsc2U7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOaYr+WQpuacieWdkOagh+WPmOaNolxuICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgICAgICogQHJlYWRPbmx5XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLm5lZWRUcmFuc2Zvcm0gPSBmYWxzZTtcbiAgICB9O1xuXG4gICAgVHJhbnNmb3JtYWJsZS5wcm90b3R5cGUgPSB7XG4gICAgICAgIFxuICAgICAgICBjb25zdHJ1Y3RvcjogVHJhbnNmb3JtYWJsZSxcblxuICAgICAgICB1cGRhdGVOZWVkVHJhbnNmb3JtOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLm5lZWRMb2NhbFRyYW5zZm9ybSA9IGlzTm90QXJvdW5kWmVybyh0aGlzLnJvdGF0aW9uWzBdKVxuICAgICAgICAgICAgICAgIHx8IGlzTm90QXJvdW5kWmVybyh0aGlzLnBvc2l0aW9uWzBdKVxuICAgICAgICAgICAgICAgIHx8IGlzTm90QXJvdW5kWmVybyh0aGlzLnBvc2l0aW9uWzFdKVxuICAgICAgICAgICAgICAgIHx8IGlzTm90QXJvdW5kWmVybyh0aGlzLnNjYWxlWzBdIC0gMSlcbiAgICAgICAgICAgICAgICB8fCBpc05vdEFyb3VuZFplcm8odGhpcy5zY2FsZVsxXSAtIDEpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDliKTmlq3mmK/lkKbpnIDopoHmnInlnZDmoIflj5jmjaLvvIzmm7TmlrBuZWVkVHJhbnNmb3Jt5bGe5oCn44CCXG4gICAgICAgICAqIOWmguaenOacieWdkOagh+WPmOaNoiwg5YiZ5LuOcG9zaXRpb24sIHJvdGF0aW9uLCBzY2FsZeS7peWPiueItuiKgueCueeahHRyYW5zZm9ybeiuoeeul+WHuuiHqui6q+eahHRyYW5zZm9ybeefqemYtVxuICAgICAgICAgKi9cbiAgICAgICAgdXBkYXRlVHJhbnNmb3JtOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRoaXMudXBkYXRlTmVlZFRyYW5zZm9ybSgpO1xuXG4gICAgICAgICAgICB2YXIgcGFyZW50SGFzVHJhbnNmb3JtID0gdGhpcy5wYXJlbnQgJiYgdGhpcy5wYXJlbnQubmVlZFRyYW5zZm9ybTtcbiAgICAgICAgICAgIHRoaXMubmVlZFRyYW5zZm9ybSA9IHRoaXMubmVlZExvY2FsVHJhbnNmb3JtIHx8IHBhcmVudEhhc1RyYW5zZm9ybTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKCF0aGlzLm5lZWRUcmFuc2Zvcm0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBtID0gdGhpcy50cmFuc2Zvcm0gfHwgbWF0cml4LmNyZWF0ZSgpO1xuICAgICAgICAgICAgbWF0cml4LmlkZW50aXR5KG0pO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5uZWVkTG9jYWxUcmFuc2Zvcm0pIHtcbiAgICAgICAgICAgICAgICB2YXIgc2NhbGUgPSB0aGlzLnNjYWxlO1xuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgaXNOb3RBcm91bmRaZXJvKHNjYWxlWzBdKVxuICAgICAgICAgICAgICAgICB8fCBpc05vdEFyb3VuZFplcm8oc2NhbGVbMV0pXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgIG9yaWdpblswXSA9IC1zY2FsZVsyXSB8fCAwO1xuICAgICAgICAgICAgICAgICAgICBvcmlnaW5bMV0gPSAtc2NhbGVbM10gfHwgMDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGhhdmVPcmlnaW4gPSBpc05vdEFyb3VuZFplcm8ob3JpZ2luWzBdKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHx8IGlzTm90QXJvdW5kWmVybyhvcmlnaW5bMV0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaGF2ZU9yaWdpbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgbVRyYW5zbGF0ZShtLCBtLCBvcmlnaW4pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG1hdHJpeC5zY2FsZShtLCBtLCBzY2FsZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChoYXZlT3JpZ2luKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvcmlnaW5bMF0gPSAtb3JpZ2luWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgb3JpZ2luWzFdID0gLW9yaWdpblsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1UcmFuc2xhdGUobSwgbSwgb3JpZ2luKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnJvdGF0aW9uIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMucm90YXRpb25bMF0gIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9yaWdpblswXSA9IC10aGlzLnJvdGF0aW9uWzFdIHx8IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICBvcmlnaW5bMV0gPSAtdGhpcy5yb3RhdGlvblsyXSB8fCAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGhhdmVPcmlnaW4gPSBpc05vdEFyb3VuZFplcm8ob3JpZ2luWzBdKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8fCBpc05vdEFyb3VuZFplcm8ob3JpZ2luWzFdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChoYXZlT3JpZ2luKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbVRyYW5zbGF0ZShtLCBtLCBvcmlnaW4pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgbWF0cml4LnJvdGF0ZShtLCBtLCB0aGlzLnJvdGF0aW9uWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChoYXZlT3JpZ2luKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3JpZ2luWzBdID0gLW9yaWdpblswXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcmlnaW5bMV0gPSAtb3JpZ2luWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1UcmFuc2xhdGUobSwgbSwgb3JpZ2luKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMucm90YXRpb24gIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hdHJpeC5yb3RhdGUobSwgbSwgdGhpcy5yb3RhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgIGlzTm90QXJvdW5kWmVybyh0aGlzLnBvc2l0aW9uWzBdKSB8fCBpc05vdEFyb3VuZFplcm8odGhpcy5wb3NpdGlvblsxXSlcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgbVRyYW5zbGF0ZShtLCBtLCB0aGlzLnBvc2l0aW9uKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOW6lOeUqOeItuiKgueCueWPmOaNolxuICAgICAgICAgICAgaWYgKHBhcmVudEhhc1RyYW5zZm9ybSkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm5lZWRMb2NhbFRyYW5zZm9ybSkge1xuICAgICAgICAgICAgICAgICAgICBtYXRyaXgubXVsKG0sIHRoaXMucGFyZW50LnRyYW5zZm9ybSwgbSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBtYXRyaXguY29weShtLCB0aGlzLnBhcmVudC50cmFuc2Zvcm0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIOS/neWtmOi/meS4quWPmOaNouefqemYtVxuICAgICAgICAgICAgdGhpcy50cmFuc2Zvcm0gPSBtO1xuXG4gICAgICAgICAgICB0aGlzLmludlRyYW5zZm9ybSA9IHRoaXMuaW52VHJhbnNmb3JtIHx8IG1hdHJpeC5jcmVhdGUoKTtcbiAgICAgICAgICAgIG1hdHJpeC5pbnZlcnQodGhpcy5pbnZUcmFuc2Zvcm0sIG0pO1xuICAgICAgICB9LFxuICAgICAgICAvKipcbiAgICAgICAgICog5bCG6Ieq5bex55qEdHJhbnNmb3Jt5bqU55So5YiwY29udGV4dOS4ilxuICAgICAgICAgKiBAcGFyYW0ge0NvbnRleHQyRH0gY3R4XG4gICAgICAgICAqL1xuICAgICAgICBzZXRUcmFuc2Zvcm06IGZ1bmN0aW9uIChjdHgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLm5lZWRUcmFuc2Zvcm0pIHtcbiAgICAgICAgICAgICAgICB2YXIgbSA9IHRoaXMudHJhbnNmb3JtO1xuICAgICAgICAgICAgICAgIGN0eC50cmFuc2Zvcm0obVswXSwgbVsxXSwgbVsyXSwgbVszXSwgbVs0XSwgbVs1XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDorr7nva7lm77lvaLnmoTmnJ3lkJFcbiAgICAgICAgICogQHBhcmFtICB7QXJyYXkuPG51bWJlcj58RmxvYXQzMkFycmF5fSB0YXJnZXRcbiAgICAgICAgICogQG1ldGhvZFxuICAgICAgICAgKi9cbiAgICAgICAgbG9va0F0OiAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHYgPSB2ZWN0b3IuY3JlYXRlKCk7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24odGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLnRyYW5zZm9ybSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zZm9ybSA9IG1hdHJpeC5jcmVhdGUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIG0gPSB0aGlzLnRyYW5zZm9ybTtcbiAgICAgICAgICAgICAgICB2ZWN0b3Iuc3ViKHYsIHRhcmdldCwgdGhpcy5wb3NpdGlvbik7XG4gICAgICAgICAgICAgICAgaWYgKGlzQXJvdW5kWmVybyh2WzBdKSAmJiBpc0Fyb3VuZFplcm8odlsxXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2ZWN0b3Iubm9ybWFsaXplKHYsIHYpO1xuICAgICAgICAgICAgICAgIHZhciBzY2FsZSA9IHRoaXMuc2NhbGU7XG4gICAgICAgICAgICAgICAgLy8gWSBBeGlzXG4gICAgICAgICAgICAgICAgLy8gVE9ETyBTY2FsZSBvcmlnaW4gP1xuICAgICAgICAgICAgICAgIG1bMl0gPSB2WzBdICogc2NhbGVbMV07XG4gICAgICAgICAgICAgICAgbVszXSA9IHZbMV0gKiBzY2FsZVsxXTtcbiAgICAgICAgICAgICAgICAvLyBYIEF4aXNcbiAgICAgICAgICAgICAgICBtWzBdID0gdlsxXSAqIHNjYWxlWzBdO1xuICAgICAgICAgICAgICAgIG1bMV0gPSAtdlswXSAqIHNjYWxlWzBdO1xuICAgICAgICAgICAgICAgIC8vIFBvc2l0aW9uXG4gICAgICAgICAgICAgICAgbVs0XSA9IHRoaXMucG9zaXRpb25bMF07XG4gICAgICAgICAgICAgICAgbVs1XSA9IHRoaXMucG9zaXRpb25bMV07XG5cbiAgICAgICAgICAgICAgICB0aGlzLmRlY29tcG9zZVRyYW5zZm9ybSgpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSkoKSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWIhuino2B0cmFuc2Zvcm1g55+p6Zi15YiwYHBvc2l0aW9uYCwgYHJvdGF0aW9uYCwgYHNjYWxlYFxuICAgICAgICAgKi9cbiAgICAgICAgZGVjb21wb3NlVHJhbnNmb3JtOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMudHJhbnNmb3JtKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIG0gPSB0aGlzLnRyYW5zZm9ybTtcbiAgICAgICAgICAgIHZhciBzeCA9IG1bMF0gKiBtWzBdICsgbVsxXSAqIG1bMV07XG4gICAgICAgICAgICB2YXIgcG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uO1xuICAgICAgICAgICAgdmFyIHNjYWxlID0gdGhpcy5zY2FsZTtcbiAgICAgICAgICAgIHZhciByb3RhdGlvbiA9IHRoaXMucm90YXRpb247XG4gICAgICAgICAgICBpZiAoaXNOb3RBcm91bmRaZXJvKHN4IC0gMSkpIHtcbiAgICAgICAgICAgICAgICBzeCA9IE1hdGguc3FydChzeCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgc3kgPSBtWzJdICogbVsyXSArIG1bM10gKiBtWzNdO1xuICAgICAgICAgICAgaWYgKGlzTm90QXJvdW5kWmVybyhzeSAtIDEpKSB7XG4gICAgICAgICAgICAgICAgc3kgPSBNYXRoLnNxcnQoc3kpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcG9zaXRpb25bMF0gPSBtWzRdO1xuICAgICAgICAgICAgcG9zaXRpb25bMV0gPSBtWzVdO1xuICAgICAgICAgICAgc2NhbGVbMF0gPSBzeDtcbiAgICAgICAgICAgIHNjYWxlWzFdID0gc3k7XG4gICAgICAgICAgICBzY2FsZVsyXSA9IHNjYWxlWzNdID0gMDtcbiAgICAgICAgICAgIHJvdGF0aW9uWzBdID0gTWF0aC5hdGFuMigtbVsxXSAvIHN5LCBtWzBdIC8gc3gpO1xuICAgICAgICAgICAgcm90YXRpb25bMV0gPSByb3RhdGlvblsyXSA9IDA7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWPmOaNouWdkOagh+S9jee9ruWIsCBzaGFwZSDnmoTlsYDpg6jlnZDmoIfnqbrpl7RcbiAgICAgICAgICogQG1ldGhvZFxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0geFxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0geVxuICAgICAgICAgKiBAcmV0dXJuIHtBcnJheS48bnVtYmVyPn1cbiAgICAgICAgICovXG4gICAgICAgIHRyYW5zZm9ybUNvb3JkVG9Mb2NhbDogZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgICAgIHZhciB2MiA9IFt4LCB5XTtcbiAgICAgICAgICAgIGlmICh0aGlzLm5lZWRUcmFuc2Zvcm0gJiYgdGhpcy5pbnZUcmFuc2Zvcm0pIHtcbiAgICAgICAgICAgICAgICB2ZWN0b3IuYXBwbHlUcmFuc2Zvcm0odjIsIHYyLCB0aGlzLmludlRyYW5zZm9ybSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdjI7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIFRyYW5zZm9ybWFibGU7XG59KTtcbiJdLCJmaWxlIjoicGx1Z2lucy96cmVuZGVyLTIuMS4wL3NyYy9taXhpbi9UcmFuc2Zvcm1hYmxlLmpzIn0=
