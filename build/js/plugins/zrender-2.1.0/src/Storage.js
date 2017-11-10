/**
 * Storage内容仓库模块
 * @module zrender/Storage
 * @author Kener (@Kener-林峰, kener.linfeng@gmail.com)
 * @author errorrik (errorrik@gmail.com)
 * @author pissang (https://github.com/pissang/)
 */
define(
    function (require) {

        'use strict';

        var util = require('./tool/util');

        var Group = require('./Group');

        var defaultIterateOption = {
            hover: false,
            normal: 'down',
            update: false
        };

        function shapeCompareFunc(a, b) {
            if (a.zlevel == b.zlevel) {
                if (a.z == b.z) {
                    return a.__renderidx - b.__renderidx;
                }
                return a.z - b.z;
            }
            return a.zlevel - b.zlevel;
        }
        /**
         * 内容仓库 (M)
         * @alias module:zrender/Storage
         * @constructor
         */
        var Storage = function () {
            // 所有常规形状，id索引的map
            this._elements = {};

            // 高亮层形状，不稳定，动态增删，数组位置也是z轴方向，靠前显示在下方
            this._hoverElements = [];

            this._roots = [];

            this._shapeList = [];

            this._shapeListOffset = 0;
        };

        /**
         * 遍历迭代器
         * 
         * @param {Function} fun 迭代回调函数，return true终止迭代
         * @param {Object} [option] 迭代参数，缺省为仅降序遍历普通层图形
         * @param {boolean} [option.hover=true] 是否是高亮层图形
         * @param {string} [option.normal='up'] 是否是普通层图形，迭代时是否指定及z轴顺序
         * @param {boolean} [option.update=false] 是否在迭代前更新形状列表
         * 
         */
        Storage.prototype.iterShape = function (fun, option) {
            if (!option) {
                option = defaultIterateOption;
            }

            if (option.hover) {
                // 高亮层数据遍历
                for (var i = 0, l = this._hoverElements.length; i < l; i++) {
                    var el = this._hoverElements[i];
                    el.updateTransform();
                    if (fun(el)) {
                        return this;
                    }
                }
            }

            if (option.update) {
                this.updateShapeList();
            }

            // 遍历: 'down' | 'up'
            switch (option.normal) {
                case 'down':
                    // 降序遍历，高层优先
                    var l = this._shapeList.length;
                    while (l--) {
                        if (fun(this._shapeList[l])) {
                            return this;
                        }
                    }
                    break;
                // case 'up':
                default:
                    // 升序遍历，底层优先
                    for (var i = 0, l = this._shapeList.length; i < l; i++) {
                        if (fun(this._shapeList[i])) {
                            return this;
                        }
                    }
                    break;
            }

            return this;
        };

        /**
         * 返回hover层的形状数组
         * @param  {boolean} [update=false] 是否在返回前更新图形的变换
         * @return {Array.<module:zrender/shape/Base>}
         */
        Storage.prototype.getHoverShapes = function (update) {
            // hoverConnect
            var hoverElements = [];
            for (var i = 0, l = this._hoverElements.length; i < l; i++) {
                hoverElements.push(this._hoverElements[i]);
                var target = this._hoverElements[i].hoverConnect;
                if (target) {
                    var shape;
                    target = target instanceof Array ? target : [target];
                    for (var j = 0, k = target.length; j < k; j++) {
                        shape = target[j].id ? target[j] : this.get(target[j]);
                        if (shape) {
                            hoverElements.push(shape);
                        }
                    }
                }
            }
            hoverElements.sort(shapeCompareFunc);
            if (update) {
                for (var i = 0, l = hoverElements.length; i < l; i++) {
                    hoverElements[i].updateTransform();
                }
            }
            return hoverElements;
        };

        /**
         * 返回所有图形的绘制队列
         * @param  {boolean} [update=false] 是否在返回前更新该数组
         * 详见{@link module:zrender/shape/Base.prototype.updateShapeList}
         * @return {Array.<module:zrender/shape/Base>}
         */
        Storage.prototype.getShapeList = function (update) {
            if (update) {
                this.updateShapeList();
            }
            return this._shapeList;
        };

        /**
         * 更新图形的绘制队列。
         * 每次绘制前都会调用，该方法会先深度优先遍历整个树，更新所有Group和Shape的变换并且把所有可见的Shape保存到数组中，
         * 最后根据绘制的优先级（zlevel > z > 插入顺序）排序得到绘制队列
         */
        Storage.prototype.updateShapeList = function () {
            this._shapeListOffset = 0;
            for (var i = 0, len = this._roots.length; i < len; i++) {
                var root = this._roots[i];
                this._updateAndAddShape(root);
            }
            this._shapeList.length = this._shapeListOffset;

            for (var i = 0, len = this._shapeList.length; i < len; i++) {
                this._shapeList[i].__renderidx = i;
            }

            this._shapeList.sort(shapeCompareFunc);
        };

        Storage.prototype._updateAndAddShape = function (el, clipShapes) {
            
            if (el.ignore) {
                return;
            }

            el.updateTransform();

            if (el.clipShape) {
                // clipShape 的变换是基于 group 的变换
                el.clipShape.parent = el;
                el.clipShape.updateTransform();

                // PENDING 效率影响
                if (clipShapes) {
                    clipShapes = clipShapes.slice();
                    clipShapes.push(el.clipShape);
                } else {
                    clipShapes = [el.clipShape];
                }
            }

            if (el.type == 'group') {
                
                for (var i = 0; i < el._children.length; i++) {
                    var child = el._children[i];

                    // Force to mark as dirty if group is dirty
                    child.__dirty = el.__dirty || child.__dirty;

                    this._updateAndAddShape(child, clipShapes);
                }

                // Mark group clean here
                el.__dirty = false;
                
            }
            else {
                el.__clipShapes = clipShapes;

                this._shapeList[this._shapeListOffset++] = el;
            }
        };

        /**
         * 修改图形(Shape)或者组(Group)
         * 
         * @param {string|module:zrender/shape/Base|module:zrender/Group} el
         * @param {Object} [params] 参数
         */
        Storage.prototype.mod = function (el, params) {
            if (typeof (el) === 'string') {
                el = this._elements[el];
            }
            if (el) {

                el.modSelf();

                if (params) {
                    // 如果第二个参数直接使用 shape
                    // parent, _storage, __clipShapes 三个属性会有循环引用
                    // 主要为了向 1.x 版本兼容，2.x 版本不建议使用第二个参数
                    if (params.parent || params._storage || params.__clipShapes) {
                        var target = {};
                        for (var name in params) {
                            if (
                                name === 'parent'
                                || name === '_storage'
                                || name === '__clipShapes'
                            ) {
                                continue;
                            }
                            if (params.hasOwnProperty(name)) {
                                target[name] = params[name];
                            }
                        }
                        util.merge(el, target, true);
                    }
                    else {
                        util.merge(el, params, true);
                    }
                }
            }

            return this;
        };

        /**
         * 移动指定的图形(Shape)或者组(Group)的位置
         * @param {string} shapeId 形状唯一标识
         * @param {number} dx
         * @param {number} dy
         */
        Storage.prototype.drift = function (shapeId, dx, dy) {
            var shape = this._elements[shapeId];
            if (shape) {
                shape.needTransform = true;
                if (shape.draggable === 'horizontal') {
                    dy = 0;
                }
                else if (shape.draggable === 'vertical') {
                    dx = 0;
                }
                if (!shape.ondrift // ondrift
                    // 有onbrush并且调用执行返回false或undefined则继续
                    || (shape.ondrift && !shape.ondrift(dx, dy))
                ) {
                    shape.drift(dx, dy);
                }
            }

            return this;
        };

        /**
         * 添加高亮层数据
         * 
         * @param {module:zrender/shape/Base} shape
         */
        Storage.prototype.addHover = function (shape) {
            shape.updateNeedTransform();
            this._hoverElements.push(shape);
            return this;
        };

        /**
         * 清空高亮层数据
         */
        Storage.prototype.delHover = function () {
            this._hoverElements = [];
            return this;
        };

        /**
         * 是否有图形在高亮层里
         * @return {boolean}
         */
        Storage.prototype.hasHoverShape = function () {
            return this._hoverElements.length > 0;
        };

        /**
         * 添加图形(Shape)或者组(Group)到根节点
         * @param {module:zrender/shape/Shape|module:zrender/Group} el
         */
        Storage.prototype.addRoot = function (el) {
            // Element has been added
            if (this._elements[el.id]) {
                return;
            }

            if (el instanceof Group) {
                el.addChildrenToStorage(this);
            }

            this.addToMap(el);
            this._roots.push(el);
        };

        /**
         * 删除指定的图形(Shape)或者组(Group)
         * @param {string|Array.<string>} [elId] 如果为空清空整个Storage
         */
        Storage.prototype.delRoot = function (elId) {
            if (typeof(elId) == 'undefined') {
                // 不指定elId清空
                for (var i = 0; i < this._roots.length; i++) {
                    var root = this._roots[i];
                    if (root instanceof Group) {
                        root.delChildrenFromStorage(this);
                    }
                }

                this._elements = {};
                this._hoverElements = [];
                this._roots = [];
                this._shapeList = [];
                this._shapeListOffset = 0;

                return;
            }

            if (elId instanceof Array) {
                for (var i = 0, l = elId.length; i < l; i++) {
                    this.delRoot(elId[i]);
                }
                return;
            }

            var el;
            if (typeof(elId) == 'string') {
                el = this._elements[elId];
            }
            else {
                el = elId;
            }

            var idx = util.indexOf(this._roots, el);
            if (idx >= 0) {
                this.delFromMap(el.id);
                this._roots.splice(idx, 1);
                if (el instanceof Group) {
                    el.delChildrenFromStorage(this);
                }
            }
        };

        Storage.prototype.addToMap = function (el) {
            if (el instanceof Group) {
                el._storage = this;
            }
            el.modSelf();

            this._elements[el.id] = el;

            return this;
        };

        Storage.prototype.get = function (elId) {
            return this._elements[elId];
        };

        Storage.prototype.delFromMap = function (elId) {
            var el = this._elements[elId];
            if (el) {
                delete this._elements[elId];

                if (el instanceof Group) {
                    el._storage = null;
                }
            }

            return this;
        };

        /**
         * 清空并且释放Storage
         */
        Storage.prototype.dispose = function () {
            this._elements = 
            this._renderList = 
            this._roots =
            this._hoverElements = null;
        };

        return Storage;
    }
);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL1N0b3JhZ2UuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBTdG9yYWdl5YaF5a655LuT5bqT5qih5Z2XXG4gKiBAbW9kdWxlIHpyZW5kZXIvU3RvcmFnZVxuICogQGF1dGhvciBLZW5lciAoQEtlbmVyLeael+WzsCwga2VuZXIubGluZmVuZ0BnbWFpbC5jb20pXG4gKiBAYXV0aG9yIGVycm9ycmlrIChlcnJvcnJpa0BnbWFpbC5jb20pXG4gKiBAYXV0aG9yIHBpc3NhbmcgKGh0dHBzOi8vZ2l0aHViLmNvbS9waXNzYW5nLylcbiAqL1xuZGVmaW5lKFxuICAgIGZ1bmN0aW9uIChyZXF1aXJlKSB7XG5cbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgICAgIHZhciB1dGlsID0gcmVxdWlyZSgnLi90b29sL3V0aWwnKTtcblxuICAgICAgICB2YXIgR3JvdXAgPSByZXF1aXJlKCcuL0dyb3VwJyk7XG5cbiAgICAgICAgdmFyIGRlZmF1bHRJdGVyYXRlT3B0aW9uID0ge1xuICAgICAgICAgICAgaG92ZXI6IGZhbHNlLFxuICAgICAgICAgICAgbm9ybWFsOiAnZG93bicsXG4gICAgICAgICAgICB1cGRhdGU6IGZhbHNlXG4gICAgICAgIH07XG5cbiAgICAgICAgZnVuY3Rpb24gc2hhcGVDb21wYXJlRnVuYyhhLCBiKSB7XG4gICAgICAgICAgICBpZiAoYS56bGV2ZWwgPT0gYi56bGV2ZWwpIHtcbiAgICAgICAgICAgICAgICBpZiAoYS56ID09IGIueikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYS5fX3JlbmRlcmlkeCAtIGIuX19yZW5kZXJpZHg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBhLnogLSBiLno7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYS56bGV2ZWwgLSBiLnpsZXZlbDtcbiAgICAgICAgfVxuICAgICAgICAvKipcbiAgICAgICAgICog5YaF5a655LuT5bqTIChNKVxuICAgICAgICAgKiBAYWxpYXMgbW9kdWxlOnpyZW5kZXIvU3RvcmFnZVxuICAgICAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgICAgICovXG4gICAgICAgIHZhciBTdG9yYWdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8g5omA5pyJ5bi46KeE5b2i54q277yMaWTntKLlvJXnmoRtYXBcbiAgICAgICAgICAgIHRoaXMuX2VsZW1lbnRzID0ge307XG5cbiAgICAgICAgICAgIC8vIOmrmOS6ruWxguW9oueKtu+8jOS4jeeos+Wumu+8jOWKqOaAgeWinuWIoO+8jOaVsOe7hOS9jee9ruS5n+aYr3rovbTmlrnlkJHvvIzpnaDliY3mmL7npLrlnKjkuIvmlrlcbiAgICAgICAgICAgIHRoaXMuX2hvdmVyRWxlbWVudHMgPSBbXTtcblxuICAgICAgICAgICAgdGhpcy5fcm9vdHMgPSBbXTtcblxuICAgICAgICAgICAgdGhpcy5fc2hhcGVMaXN0ID0gW107XG5cbiAgICAgICAgICAgIHRoaXMuX3NoYXBlTGlzdE9mZnNldCA9IDA7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOmBjeWOhui/reS7o+WZqFxuICAgICAgICAgKiBcbiAgICAgICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuIOi/reS7o+Wbnuiwg+WHveaVsO+8jHJldHVybiB0cnVl57uI5q2i6L+t5LujXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uXSDov63ku6Plj4LmlbDvvIznvLrnnIHkuLrku4XpmY3luo/pgY3ljobmma7pgJrlsYLlm77lvaJcbiAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9uLmhvdmVyPXRydWVdIOaYr+WQpuaYr+mrmOS6ruWxguWbvuW9olxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbi5ub3JtYWw9J3VwJ10g5piv5ZCm5piv5pmu6YCa5bGC5Zu+5b2i77yM6L+t5Luj5pe25piv5ZCm5oyH5a6a5Y+Keui9tOmhuuW6j1xuICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb24udXBkYXRlPWZhbHNlXSDmmK/lkKblnKjov63ku6PliY3mm7TmlrDlvaLnirbliJfooahcbiAgICAgICAgICogXG4gICAgICAgICAqL1xuICAgICAgICBTdG9yYWdlLnByb3RvdHlwZS5pdGVyU2hhcGUgPSBmdW5jdGlvbiAoZnVuLCBvcHRpb24pIHtcbiAgICAgICAgICAgIGlmICghb3B0aW9uKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9uID0gZGVmYXVsdEl0ZXJhdGVPcHRpb247XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChvcHRpb24uaG92ZXIpIHtcbiAgICAgICAgICAgICAgICAvLyDpq5jkuq7lsYLmlbDmja7pgY3ljoZcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IHRoaXMuX2hvdmVyRWxlbWVudHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBlbCA9IHRoaXMuX2hvdmVyRWxlbWVudHNbaV07XG4gICAgICAgICAgICAgICAgICAgIGVsLnVwZGF0ZVRyYW5zZm9ybSgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZnVuKGVsKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChvcHRpb24udXBkYXRlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVTaGFwZUxpc3QoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g6YGN5Y6GOiAnZG93bicgfCAndXAnXG4gICAgICAgICAgICBzd2l0Y2ggKG9wdGlvbi5ub3JtYWwpIHtcbiAgICAgICAgICAgICAgICBjYXNlICdkb3duJzpcbiAgICAgICAgICAgICAgICAgICAgLy8g6ZmN5bqP6YGN5Y6G77yM6auY5bGC5LyY5YWIXG4gICAgICAgICAgICAgICAgICAgIHZhciBsID0gdGhpcy5fc2hhcGVMaXN0Lmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGwtLSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZ1bih0aGlzLl9zaGFwZUxpc3RbbF0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgLy8gY2FzZSAndXAnOlxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIC8vIOWNh+W6j+mBjeWOhu+8jOW6leWxguS8mOWFiFxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IHRoaXMuX3NoYXBlTGlzdC5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmdW4odGhpcy5fc2hhcGVMaXN0W2ldKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICog6L+U5ZueaG92ZXLlsYLnmoTlvaLnirbmlbDnu4RcbiAgICAgICAgICogQHBhcmFtICB7Ym9vbGVhbn0gW3VwZGF0ZT1mYWxzZV0g5piv5ZCm5Zyo6L+U5Zue5YmN5pu05paw5Zu+5b2i55qE5Y+Y5o2iXG4gICAgICAgICAqIEByZXR1cm4ge0FycmF5Ljxtb2R1bGU6enJlbmRlci9zaGFwZS9CYXNlPn1cbiAgICAgICAgICovXG4gICAgICAgIFN0b3JhZ2UucHJvdG90eXBlLmdldEhvdmVyU2hhcGVzID0gZnVuY3Rpb24gKHVwZGF0ZSkge1xuICAgICAgICAgICAgLy8gaG92ZXJDb25uZWN0XG4gICAgICAgICAgICB2YXIgaG92ZXJFbGVtZW50cyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLl9ob3ZlckVsZW1lbnRzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgICAgIGhvdmVyRWxlbWVudHMucHVzaCh0aGlzLl9ob3ZlckVsZW1lbnRzW2ldKTtcbiAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0ID0gdGhpcy5faG92ZXJFbGVtZW50c1tpXS5ob3ZlckNvbm5lY3Q7XG4gICAgICAgICAgICAgICAgaWYgKHRhcmdldCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgc2hhcGU7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldCA9IHRhcmdldCBpbnN0YW5jZW9mIEFycmF5ID8gdGFyZ2V0IDogW3RhcmdldF07XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwLCBrID0gdGFyZ2V0Lmxlbmd0aDsgaiA8IGs7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2hhcGUgPSB0YXJnZXRbal0uaWQgPyB0YXJnZXRbal0gOiB0aGlzLmdldCh0YXJnZXRbal0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNoYXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaG92ZXJFbGVtZW50cy5wdXNoKHNoYXBlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGhvdmVyRWxlbWVudHMuc29ydChzaGFwZUNvbXBhcmVGdW5jKTtcbiAgICAgICAgICAgIGlmICh1cGRhdGUpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGhvdmVyRWxlbWVudHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGhvdmVyRWxlbWVudHNbaV0udXBkYXRlVHJhbnNmb3JtKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGhvdmVyRWxlbWVudHM7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOi/lOWbnuaJgOacieWbvuW9oueahOe7mOWItumYn+WIl1xuICAgICAgICAgKiBAcGFyYW0gIHtib29sZWFufSBbdXBkYXRlPWZhbHNlXSDmmK/lkKblnKjov5Tlm57liY3mm7TmlrDor6XmlbDnu4RcbiAgICAgICAgICog6K+m6KeBe0BsaW5rIG1vZHVsZTp6cmVuZGVyL3NoYXBlL0Jhc2UucHJvdG90eXBlLnVwZGF0ZVNoYXBlTGlzdH1cbiAgICAgICAgICogQHJldHVybiB7QXJyYXkuPG1vZHVsZTp6cmVuZGVyL3NoYXBlL0Jhc2U+fVxuICAgICAgICAgKi9cbiAgICAgICAgU3RvcmFnZS5wcm90b3R5cGUuZ2V0U2hhcGVMaXN0ID0gZnVuY3Rpb24gKHVwZGF0ZSkge1xuICAgICAgICAgICAgaWYgKHVwZGF0ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlU2hhcGVMaXN0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fc2hhcGVMaXN0O1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDmm7TmlrDlm77lvaLnmoTnu5jliLbpmJ/liJfjgIJcbiAgICAgICAgICog5q+P5qyh57uY5Yi25YmN6YO95Lya6LCD55So77yM6K+l5pa55rOV5Lya5YWI5rex5bqm5LyY5YWI6YGN5Y6G5pW05Liq5qCR77yM5pu05paw5omA5pyJR3JvdXDlkoxTaGFwZeeahOWPmOaNouW5tuS4lOaKiuaJgOacieWPr+ingeeahFNoYXBl5L+d5a2Y5Yiw5pWw57uE5Lit77yMXG4gICAgICAgICAqIOacgOWQjuagueaNrue7mOWItueahOS8mOWFiOe6p++8iHpsZXZlbCA+IHogPiDmj5LlhaXpobrluo/vvInmjpLluo/lvpfliLDnu5jliLbpmJ/liJdcbiAgICAgICAgICovXG4gICAgICAgIFN0b3JhZ2UucHJvdG90eXBlLnVwZGF0ZVNoYXBlTGlzdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuX3NoYXBlTGlzdE9mZnNldCA9IDA7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdGhpcy5fcm9vdHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgcm9vdCA9IHRoaXMuX3Jvb3RzW2ldO1xuICAgICAgICAgICAgICAgIHRoaXMuX3VwZGF0ZUFuZEFkZFNoYXBlKHJvb3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fc2hhcGVMaXN0Lmxlbmd0aCA9IHRoaXMuX3NoYXBlTGlzdE9mZnNldDtcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMuX3NoYXBlTGlzdC5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIHRoaXMuX3NoYXBlTGlzdFtpXS5fX3JlbmRlcmlkeCA9IGk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuX3NoYXBlTGlzdC5zb3J0KHNoYXBlQ29tcGFyZUZ1bmMpO1xuICAgICAgICB9O1xuXG4gICAgICAgIFN0b3JhZ2UucHJvdG90eXBlLl91cGRhdGVBbmRBZGRTaGFwZSA9IGZ1bmN0aW9uIChlbCwgY2xpcFNoYXBlcykge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoZWwuaWdub3JlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbC51cGRhdGVUcmFuc2Zvcm0oKTtcblxuICAgICAgICAgICAgaWYgKGVsLmNsaXBTaGFwZSkge1xuICAgICAgICAgICAgICAgIC8vIGNsaXBTaGFwZSDnmoTlj5jmjaLmmK/ln7rkuo4gZ3JvdXAg55qE5Y+Y5o2iXG4gICAgICAgICAgICAgICAgZWwuY2xpcFNoYXBlLnBhcmVudCA9IGVsO1xuICAgICAgICAgICAgICAgIGVsLmNsaXBTaGFwZS51cGRhdGVUcmFuc2Zvcm0oKTtcblxuICAgICAgICAgICAgICAgIC8vIFBFTkRJTkcg5pWI546H5b2x5ZONXG4gICAgICAgICAgICAgICAgaWYgKGNsaXBTaGFwZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xpcFNoYXBlcyA9IGNsaXBTaGFwZXMuc2xpY2UoKTtcbiAgICAgICAgICAgICAgICAgICAgY2xpcFNoYXBlcy5wdXNoKGVsLmNsaXBTaGFwZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY2xpcFNoYXBlcyA9IFtlbC5jbGlwU2hhcGVdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGVsLnR5cGUgPT0gJ2dyb3VwJykge1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZWwuX2NoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjaGlsZCA9IGVsLl9jaGlsZHJlbltpXTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBGb3JjZSB0byBtYXJrIGFzIGRpcnR5IGlmIGdyb3VwIGlzIGRpcnR5XG4gICAgICAgICAgICAgICAgICAgIGNoaWxkLl9fZGlydHkgPSBlbC5fX2RpcnR5IHx8IGNoaWxkLl9fZGlydHk7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fdXBkYXRlQW5kQWRkU2hhcGUoY2hpbGQsIGNsaXBTaGFwZXMpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIE1hcmsgZ3JvdXAgY2xlYW4gaGVyZVxuICAgICAgICAgICAgICAgIGVsLl9fZGlydHkgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGVsLl9fY2xpcFNoYXBlcyA9IGNsaXBTaGFwZXM7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9zaGFwZUxpc3RbdGhpcy5fc2hhcGVMaXN0T2Zmc2V0KytdID0gZWw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOS/ruaUueWbvuW9oihTaGFwZSnmiJbogIXnu4QoR3JvdXApXG4gICAgICAgICAqIFxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ3xtb2R1bGU6enJlbmRlci9zaGFwZS9CYXNlfG1vZHVsZTp6cmVuZGVyL0dyb3VwfSBlbFxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gW3BhcmFtc10g5Y+C5pWwXG4gICAgICAgICAqL1xuICAgICAgICBTdG9yYWdlLnByb3RvdHlwZS5tb2QgPSBmdW5jdGlvbiAoZWwsIHBhcmFtcykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiAoZWwpID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIGVsID0gdGhpcy5fZWxlbWVudHNbZWxdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsKSB7XG5cbiAgICAgICAgICAgICAgICBlbC5tb2RTZWxmKCk7XG5cbiAgICAgICAgICAgICAgICBpZiAocGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOWmguaenOesrOS6jOS4quWPguaVsOebtOaOpeS9v+eUqCBzaGFwZVxuICAgICAgICAgICAgICAgICAgICAvLyBwYXJlbnQsIF9zdG9yYWdlLCBfX2NsaXBTaGFwZXMg5LiJ5Liq5bGe5oCn5Lya5pyJ5b6q546v5byV55SoXG4gICAgICAgICAgICAgICAgICAgIC8vIOS4u+imgeS4uuS6huWQkSAxLngg54mI5pys5YW85a6577yMMi54IOeJiOacrOS4jeW7uuiuruS9v+eUqOesrOS6jOS4quWPguaVsFxuICAgICAgICAgICAgICAgICAgICBpZiAocGFyYW1zLnBhcmVudCB8fCBwYXJhbXMuX3N0b3JhZ2UgfHwgcGFyYW1zLl9fY2xpcFNoYXBlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRhcmdldCA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgbmFtZSBpbiBwYXJhbXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWUgPT09ICdwYXJlbnQnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHx8IG5hbWUgPT09ICdfc3RvcmFnZSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfHwgbmFtZSA9PT0gJ19fY2xpcFNoYXBlcydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXJhbXMuaGFzT3duUHJvcGVydHkobmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0W25hbWVdID0gcGFyYW1zW25hbWVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHV0aWwubWVyZ2UoZWwsIHRhcmdldCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1dGlsLm1lcmdlKGVsLCBwYXJhbXMsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICog56e75Yqo5oyH5a6a55qE5Zu+5b2iKFNoYXBlKeaIluiAhee7hChHcm91cCnnmoTkvY3nva5cbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHNoYXBlSWQg5b2i54q25ZSv5LiA5qCH6K+GXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBkeFxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gZHlcbiAgICAgICAgICovXG4gICAgICAgIFN0b3JhZ2UucHJvdG90eXBlLmRyaWZ0ID0gZnVuY3Rpb24gKHNoYXBlSWQsIGR4LCBkeSkge1xuICAgICAgICAgICAgdmFyIHNoYXBlID0gdGhpcy5fZWxlbWVudHNbc2hhcGVJZF07XG4gICAgICAgICAgICBpZiAoc2hhcGUpIHtcbiAgICAgICAgICAgICAgICBzaGFwZS5uZWVkVHJhbnNmb3JtID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBpZiAoc2hhcGUuZHJhZ2dhYmxlID09PSAnaG9yaXpvbnRhbCcpIHtcbiAgICAgICAgICAgICAgICAgICAgZHkgPSAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChzaGFwZS5kcmFnZ2FibGUgPT09ICd2ZXJ0aWNhbCcpIHtcbiAgICAgICAgICAgICAgICAgICAgZHggPSAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIXNoYXBlLm9uZHJpZnQgLy8gb25kcmlmdFxuICAgICAgICAgICAgICAgICAgICAvLyDmnIlvbmJydXNo5bm25LiU6LCD55So5omn6KGM6L+U5ZueZmFsc2XmiJZ1bmRlZmluZWTliJnnu6fnu61cbiAgICAgICAgICAgICAgICAgICAgfHwgKHNoYXBlLm9uZHJpZnQgJiYgIXNoYXBlLm9uZHJpZnQoZHgsIGR5KSlcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgc2hhcGUuZHJpZnQoZHgsIGR5KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDmt7vliqDpq5jkuq7lsYLmlbDmja5cbiAgICAgICAgICogXG4gICAgICAgICAqIEBwYXJhbSB7bW9kdWxlOnpyZW5kZXIvc2hhcGUvQmFzZX0gc2hhcGVcbiAgICAgICAgICovXG4gICAgICAgIFN0b3JhZ2UucHJvdG90eXBlLmFkZEhvdmVyID0gZnVuY3Rpb24gKHNoYXBlKSB7XG4gICAgICAgICAgICBzaGFwZS51cGRhdGVOZWVkVHJhbnNmb3JtKCk7XG4gICAgICAgICAgICB0aGlzLl9ob3ZlckVsZW1lbnRzLnB1c2goc2hhcGUpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOa4heepuumrmOS6ruWxguaVsOaNrlxuICAgICAgICAgKi9cbiAgICAgICAgU3RvcmFnZS5wcm90b3R5cGUuZGVsSG92ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLl9ob3ZlckVsZW1lbnRzID0gW107XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICog5piv5ZCm5pyJ5Zu+5b2i5Zyo6auY5Lqu5bGC6YeMXG4gICAgICAgICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAgICAgICAqL1xuICAgICAgICBTdG9yYWdlLnByb3RvdHlwZS5oYXNIb3ZlclNoYXBlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2hvdmVyRWxlbWVudHMubGVuZ3RoID4gMDtcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICog5re75Yqg5Zu+5b2iKFNoYXBlKeaIluiAhee7hChHcm91cCnliLDmoLnoioLngrlcbiAgICAgICAgICogQHBhcmFtIHttb2R1bGU6enJlbmRlci9zaGFwZS9TaGFwZXxtb2R1bGU6enJlbmRlci9Hcm91cH0gZWxcbiAgICAgICAgICovXG4gICAgICAgIFN0b3JhZ2UucHJvdG90eXBlLmFkZFJvb3QgPSBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgIC8vIEVsZW1lbnQgaGFzIGJlZW4gYWRkZWRcbiAgICAgICAgICAgIGlmICh0aGlzLl9lbGVtZW50c1tlbC5pZF0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChlbCBpbnN0YW5jZW9mIEdyb3VwKSB7XG4gICAgICAgICAgICAgICAgZWwuYWRkQ2hpbGRyZW5Ub1N0b3JhZ2UodGhpcyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuYWRkVG9NYXAoZWwpO1xuICAgICAgICAgICAgdGhpcy5fcm9vdHMucHVzaChlbCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWIoOmZpOaMh+WumueahOWbvuW9oihTaGFwZSnmiJbogIXnu4QoR3JvdXApXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfEFycmF5LjxzdHJpbmc+fSBbZWxJZF0g5aaC5p6c5Li656m65riF56m65pW05LiqU3RvcmFnZVxuICAgICAgICAgKi9cbiAgICAgICAgU3RvcmFnZS5wcm90b3R5cGUuZGVsUm9vdCA9IGZ1bmN0aW9uIChlbElkKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mKGVsSWQpID09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgLy8g5LiN5oyH5a6aZWxJZOa4heepulxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5fcm9vdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJvb3QgPSB0aGlzLl9yb290c1tpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJvb3QgaW5zdGFuY2VvZiBHcm91cCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcm9vdC5kZWxDaGlsZHJlbkZyb21TdG9yYWdlKHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5fZWxlbWVudHMgPSB7fTtcbiAgICAgICAgICAgICAgICB0aGlzLl9ob3ZlckVsZW1lbnRzID0gW107XG4gICAgICAgICAgICAgICAgdGhpcy5fcm9vdHMgPSBbXTtcbiAgICAgICAgICAgICAgICB0aGlzLl9zaGFwZUxpc3QgPSBbXTtcbiAgICAgICAgICAgICAgICB0aGlzLl9zaGFwZUxpc3RPZmZzZXQgPSAwO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZWxJZCBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBlbElkLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRlbFJvb3QoZWxJZFtpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGVsO1xuICAgICAgICAgICAgaWYgKHR5cGVvZihlbElkKSA9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIGVsID0gdGhpcy5fZWxlbWVudHNbZWxJZF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBlbCA9IGVsSWQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBpZHggPSB1dGlsLmluZGV4T2YodGhpcy5fcm9vdHMsIGVsKTtcbiAgICAgICAgICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGVsRnJvbU1hcChlbC5pZCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fcm9vdHMuc3BsaWNlKGlkeCwgMSk7XG4gICAgICAgICAgICAgICAgaWYgKGVsIGluc3RhbmNlb2YgR3JvdXApIHtcbiAgICAgICAgICAgICAgICAgICAgZWwuZGVsQ2hpbGRyZW5Gcm9tU3RvcmFnZSh0aGlzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgU3RvcmFnZS5wcm90b3R5cGUuYWRkVG9NYXAgPSBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgIGlmIChlbCBpbnN0YW5jZW9mIEdyb3VwKSB7XG4gICAgICAgICAgICAgICAgZWwuX3N0b3JhZ2UgPSB0aGlzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWwubW9kU2VsZigpO1xuXG4gICAgICAgICAgICB0aGlzLl9lbGVtZW50c1tlbC5pZF0gPSBlbDtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH07XG5cbiAgICAgICAgU3RvcmFnZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKGVsSWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9lbGVtZW50c1tlbElkXTtcbiAgICAgICAgfTtcblxuICAgICAgICBTdG9yYWdlLnByb3RvdHlwZS5kZWxGcm9tTWFwID0gZnVuY3Rpb24gKGVsSWQpIHtcbiAgICAgICAgICAgIHZhciBlbCA9IHRoaXMuX2VsZW1lbnRzW2VsSWRdO1xuICAgICAgICAgICAgaWYgKGVsKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuX2VsZW1lbnRzW2VsSWRdO1xuXG4gICAgICAgICAgICAgICAgaWYgKGVsIGluc3RhbmNlb2YgR3JvdXApIHtcbiAgICAgICAgICAgICAgICAgICAgZWwuX3N0b3JhZ2UgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOa4heepuuW5tuS4lOmHiuaUvlN0b3JhZ2VcbiAgICAgICAgICovXG4gICAgICAgIFN0b3JhZ2UucHJvdG90eXBlLmRpc3Bvc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLl9lbGVtZW50cyA9IFxuICAgICAgICAgICAgdGhpcy5fcmVuZGVyTGlzdCA9IFxuICAgICAgICAgICAgdGhpcy5fcm9vdHMgPVxuICAgICAgICAgICAgdGhpcy5faG92ZXJFbGVtZW50cyA9IG51bGw7XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIFN0b3JhZ2U7XG4gICAgfVxuKTtcbiJdLCJmaWxlIjoicGx1Z2lucy96cmVuZGVyLTIuMS4wL3NyYy9TdG9yYWdlLmpzIn0=
