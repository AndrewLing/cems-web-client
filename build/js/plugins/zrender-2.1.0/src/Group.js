/**
 * Group是一个容器，可以插入子节点，Group的变换也会被应用到子节点上
 * @module zrender/Group
 * @example
 *     var Group = require('zrender/Group');
 *     var Circle = require('zrender/shape/Circle');
 *     var g = new Group();
 *     g.position[0] = 100;
 *     g.position[1] = 100;
 *     g.addChild(new Circle({
 *         style: {
 *             x: 100,
 *             y: 100,
 *             r: 20,
 *             brushType: 'fill'
 *         }
 *     }));
 *     zr.addGroup(g);
 */
define(function(require) {

    var guid = require('./tool/guid');
    var util = require('./tool/util');

    var Transformable = require('./mixin/Transformable');
    var Eventful = require('./mixin/Eventful');

    /**
     * @alias module:zrender/Group
     * @constructor
     * @extends module:zrender/mixin/Transformable
     * @extends module:zrender/mixin/Eventful
     */
    var Group = function(options) {

        options = options || {};

        /**
         * Group id
         * @type {string}
         */
        this.id = options.id || guid();

        for (var key in options) {
            this[key] = options[key];
        }

        /**
         * @type {string}
         */
        this.type = 'group';

        /**
         * 用于裁剪的图形(shape)，所有 Group 内的图形在绘制时都会被这个图形裁剪
         * 该图形会继承Group的变换
         * @type {module:zrender/shape/Base}
         * @see http://www.w3.org/TR/2dcontext/#clipping-region
         */
        this.clipShape = null;

        this._children = [];

        this._storage = null;

        this.__dirty = true;

        // Mixin
        Transformable.call(this);
        Eventful.call(this);
    };

    /**
     * 是否忽略该 Group 及其所有子节点
     * @type {boolean}
     * @default false
     */
    Group.prototype.ignore = false;

    /**
     * 复制并返回一份新的包含所有儿子节点的数组
     * @return {Array.<module:zrender/Group|module:zrender/shape/Base>}
     */
    Group.prototype.children = function() {
        return this._children.slice();
    };

    /**
     * 获取指定 index 的儿子节点
     * @param  {number} idx
     * @return {module:zrender/Group|module:zrender/shape/Base}
     */
    Group.prototype.childAt = function(idx) {
        return this._children[idx];
    };

    /**
     * 添加子节点，可以是Shape或者Group
     * @param {module:zrender/Group|module:zrender/shape/Base} child
     */
    // TODO Type Check
    Group.prototype.addChild = function(child) {
        if (child == this) {
            return;
        }
        
        if (child.parent == this) {
            return;
        }
        if (child.parent) {
            child.parent.removeChild(child);
        }

        this._children.push(child);
        child.parent = this;

        if (this._storage && this._storage !== child._storage) {
            
            this._storage.addToMap(child);

            if (child instanceof Group) {
                child.addChildrenToStorage(this._storage);
            }
        }
    };

    /**
     * 移除子节点
     * @param {module:zrender/Group|module:zrender/shape/Base} child
     */
    // TODO Type Check
    Group.prototype.removeChild = function(child) {
        var idx = util.indexOf(this._children, child);

        if (idx >= 0) {
            this._children.splice(idx, 1);
        }
        child.parent = null;

        if (this._storage) {
            
            this._storage.delFromMap(child.id);

            if (child instanceof Group) {
                child.delChildrenFromStorage(this._storage);
            }
        }
    };

    /**
     * 移除所有子节点
     */
    Group.prototype.clearChildren = function () {
        for (var i = 0; i < this._children.length; i++) {
            var child = this._children[i];
            if (this._storage) {
                this._storage.delFromMap(child.id);
                if (child instanceof Group) {
                    child.delChildrenFromStorage(this._storage);
                }
            }
        }
        this._children.length = 0;
    };

    /**
     * 遍历所有子节点
     * @param  {Function} cb
     * @param  {}   context
     */
    Group.prototype.eachChild = function(cb, context) {
        var haveContext = !!context;
        for (var i = 0; i < this._children.length; i++) {
            var child = this._children[i];
            if (haveContext) {
                cb.call(context, child);
            } else {
                cb(child);
            }
        }
    };

    /**
     * 深度优先遍历所有子孙节点
     * @param  {Function} cb
     * @param  {}   context
     */
    Group.prototype.traverse = function(cb, context) {
        var haveContext = !!context;
        for (var i = 0; i < this._children.length; i++) {
            var child = this._children[i];
            if (haveContext) {
                cb.call(context, child);
            } else {
                cb(child);
            }

            if (child.type === 'group') {
                child.traverse(cb, context);
            }
        }
    };

    Group.prototype.addChildrenToStorage = function(storage) {
        for (var i = 0; i < this._children.length; i++) {
            var child = this._children[i];
            storage.addToMap(child);
            if (child instanceof Group) {
                child.addChildrenToStorage(storage);
            }
        }
    };

    Group.prototype.delChildrenFromStorage = function(storage) {
        for (var i = 0; i < this._children.length; i++) {
            var child = this._children[i];
            storage.delFromMap(child.id);
            if (child instanceof Group) {
                child.delChildrenFromStorage(storage);
            }
        }
    };

    Group.prototype.modSelf = function() {
        this.__dirty = true;
    };

    util.merge(Group.prototype, Transformable.prototype, true);
    util.merge(Group.prototype, Eventful.prototype, true);

    return Group;
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL0dyb3VwLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogR3JvdXDmmK/kuIDkuKrlrrnlmajvvIzlj6/ku6Xmj5LlhaXlrZDoioLngrnvvIxHcm91cOeahOWPmOaNouS5n+S8muiiq+W6lOeUqOWIsOWtkOiKgueCueS4ilxuICogQG1vZHVsZSB6cmVuZGVyL0dyb3VwXG4gKiBAZXhhbXBsZVxuICogICAgIHZhciBHcm91cCA9IHJlcXVpcmUoJ3pyZW5kZXIvR3JvdXAnKTtcbiAqICAgICB2YXIgQ2lyY2xlID0gcmVxdWlyZSgnenJlbmRlci9zaGFwZS9DaXJjbGUnKTtcbiAqICAgICB2YXIgZyA9IG5ldyBHcm91cCgpO1xuICogICAgIGcucG9zaXRpb25bMF0gPSAxMDA7XG4gKiAgICAgZy5wb3NpdGlvblsxXSA9IDEwMDtcbiAqICAgICBnLmFkZENoaWxkKG5ldyBDaXJjbGUoe1xuICogICAgICAgICBzdHlsZToge1xuICogICAgICAgICAgICAgeDogMTAwLFxuICogICAgICAgICAgICAgeTogMTAwLFxuICogICAgICAgICAgICAgcjogMjAsXG4gKiAgICAgICAgICAgICBicnVzaFR5cGU6ICdmaWxsJ1xuICogICAgICAgICB9XG4gKiAgICAgfSkpO1xuICogICAgIHpyLmFkZEdyb3VwKGcpO1xuICovXG5kZWZpbmUoZnVuY3Rpb24ocmVxdWlyZSkge1xuXG4gICAgdmFyIGd1aWQgPSByZXF1aXJlKCcuL3Rvb2wvZ3VpZCcpO1xuICAgIHZhciB1dGlsID0gcmVxdWlyZSgnLi90b29sL3V0aWwnKTtcblxuICAgIHZhciBUcmFuc2Zvcm1hYmxlID0gcmVxdWlyZSgnLi9taXhpbi9UcmFuc2Zvcm1hYmxlJyk7XG4gICAgdmFyIEV2ZW50ZnVsID0gcmVxdWlyZSgnLi9taXhpbi9FdmVudGZ1bCcpO1xuXG4gICAgLyoqXG4gICAgICogQGFsaWFzIG1vZHVsZTp6cmVuZGVyL0dyb3VwXG4gICAgICogQGNvbnN0cnVjdG9yXG4gICAgICogQGV4dGVuZHMgbW9kdWxlOnpyZW5kZXIvbWl4aW4vVHJhbnNmb3JtYWJsZVxuICAgICAqIEBleHRlbmRzIG1vZHVsZTp6cmVuZGVyL21peGluL0V2ZW50ZnVsXG4gICAgICovXG4gICAgdmFyIEdyb3VwID0gZnVuY3Rpb24ob3B0aW9ucykge1xuXG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHcm91cCBpZFxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5pZCA9IG9wdGlvbnMuaWQgfHwgZ3VpZCgpO1xuXG4gICAgICAgIGZvciAodmFyIGtleSBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgICB0aGlzW2tleV0gPSBvcHRpb25zW2tleV07XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudHlwZSA9ICdncm91cCc7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOeUqOS6juijgeWJqueahOWbvuW9oihzaGFwZSnvvIzmiYDmnIkgR3JvdXAg5YaF55qE5Zu+5b2i5Zyo57uY5Yi25pe26YO95Lya6KKr6L+Z5Liq5Zu+5b2i6KOB5YmqXG4gICAgICAgICAqIOivpeWbvuW9ouS8mue7p+aJv0dyb3Vw55qE5Y+Y5o2iXG4gICAgICAgICAqIEB0eXBlIHttb2R1bGU6enJlbmRlci9zaGFwZS9CYXNlfVxuICAgICAgICAgKiBAc2VlIGh0dHA6Ly93d3cudzMub3JnL1RSLzJkY29udGV4dC8jY2xpcHBpbmctcmVnaW9uXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmNsaXBTaGFwZSA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5fY2hpbGRyZW4gPSBbXTtcblxuICAgICAgICB0aGlzLl9zdG9yYWdlID0gbnVsbDtcblxuICAgICAgICB0aGlzLl9fZGlydHkgPSB0cnVlO1xuXG4gICAgICAgIC8vIE1peGluXG4gICAgICAgIFRyYW5zZm9ybWFibGUuY2FsbCh0aGlzKTtcbiAgICAgICAgRXZlbnRmdWwuY2FsbCh0aGlzKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICog5piv5ZCm5b+955Wl6K+lIEdyb3VwIOWPiuWFtuaJgOacieWtkOiKgueCuVxuICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAqIEBkZWZhdWx0IGZhbHNlXG4gICAgICovXG4gICAgR3JvdXAucHJvdG90eXBlLmlnbm9yZSA9IGZhbHNlO1xuXG4gICAgLyoqXG4gICAgICog5aSN5Yi25bm26L+U5Zue5LiA5Lu95paw55qE5YyF5ZCr5omA5pyJ5YS/5a2Q6IqC54K555qE5pWw57uEXG4gICAgICogQHJldHVybiB7QXJyYXkuPG1vZHVsZTp6cmVuZGVyL0dyb3VwfG1vZHVsZTp6cmVuZGVyL3NoYXBlL0Jhc2U+fVxuICAgICAqL1xuICAgIEdyb3VwLnByb3RvdHlwZS5jaGlsZHJlbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY2hpbGRyZW4uc2xpY2UoKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICog6I635Y+W5oyH5a6aIGluZGV4IOeahOWEv+WtkOiKgueCuVxuICAgICAqIEBwYXJhbSAge251bWJlcn0gaWR4XG4gICAgICogQHJldHVybiB7bW9kdWxlOnpyZW5kZXIvR3JvdXB8bW9kdWxlOnpyZW5kZXIvc2hhcGUvQmFzZX1cbiAgICAgKi9cbiAgICBHcm91cC5wcm90b3R5cGUuY2hpbGRBdCA9IGZ1bmN0aW9uKGlkeCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY2hpbGRyZW5baWR4XTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICog5re75Yqg5a2Q6IqC54K577yM5Y+v5Lul5pivU2hhcGXmiJbogIVHcm91cFxuICAgICAqIEBwYXJhbSB7bW9kdWxlOnpyZW5kZXIvR3JvdXB8bW9kdWxlOnpyZW5kZXIvc2hhcGUvQmFzZX0gY2hpbGRcbiAgICAgKi9cbiAgICAvLyBUT0RPIFR5cGUgQ2hlY2tcbiAgICBHcm91cC5wcm90b3R5cGUuYWRkQ2hpbGQgPSBmdW5jdGlvbihjaGlsZCkge1xuICAgICAgICBpZiAoY2hpbGQgPT0gdGhpcykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoY2hpbGQucGFyZW50ID09IHRoaXMpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2hpbGQucGFyZW50KSB7XG4gICAgICAgICAgICBjaGlsZC5wYXJlbnQucmVtb3ZlQ2hpbGQoY2hpbGQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fY2hpbGRyZW4ucHVzaChjaGlsZCk7XG4gICAgICAgIGNoaWxkLnBhcmVudCA9IHRoaXM7XG5cbiAgICAgICAgaWYgKHRoaXMuX3N0b3JhZ2UgJiYgdGhpcy5fc3RvcmFnZSAhPT0gY2hpbGQuX3N0b3JhZ2UpIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5fc3RvcmFnZS5hZGRUb01hcChjaGlsZCk7XG5cbiAgICAgICAgICAgIGlmIChjaGlsZCBpbnN0YW5jZW9mIEdyb3VwKSB7XG4gICAgICAgICAgICAgICAgY2hpbGQuYWRkQ2hpbGRyZW5Ub1N0b3JhZ2UodGhpcy5fc3RvcmFnZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICog56e76Zmk5a2Q6IqC54K5XG4gICAgICogQHBhcmFtIHttb2R1bGU6enJlbmRlci9Hcm91cHxtb2R1bGU6enJlbmRlci9zaGFwZS9CYXNlfSBjaGlsZFxuICAgICAqL1xuICAgIC8vIFRPRE8gVHlwZSBDaGVja1xuICAgIEdyb3VwLnByb3RvdHlwZS5yZW1vdmVDaGlsZCA9IGZ1bmN0aW9uKGNoaWxkKSB7XG4gICAgICAgIHZhciBpZHggPSB1dGlsLmluZGV4T2YodGhpcy5fY2hpbGRyZW4sIGNoaWxkKTtcblxuICAgICAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgICAgICAgIHRoaXMuX2NoaWxkcmVuLnNwbGljZShpZHgsIDEpO1xuICAgICAgICB9XG4gICAgICAgIGNoaWxkLnBhcmVudCA9IG51bGw7XG5cbiAgICAgICAgaWYgKHRoaXMuX3N0b3JhZ2UpIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5fc3RvcmFnZS5kZWxGcm9tTWFwKGNoaWxkLmlkKTtcblxuICAgICAgICAgICAgaWYgKGNoaWxkIGluc3RhbmNlb2YgR3JvdXApIHtcbiAgICAgICAgICAgICAgICBjaGlsZC5kZWxDaGlsZHJlbkZyb21TdG9yYWdlKHRoaXMuX3N0b3JhZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIOenu+mZpOaJgOacieWtkOiKgueCuVxuICAgICAqL1xuICAgIEdyb3VwLnByb3RvdHlwZS5jbGVhckNoaWxkcmVuID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX2NoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgY2hpbGQgPSB0aGlzLl9jaGlsZHJlbltpXTtcbiAgICAgICAgICAgIGlmICh0aGlzLl9zdG9yYWdlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc3RvcmFnZS5kZWxGcm9tTWFwKGNoaWxkLmlkKTtcbiAgICAgICAgICAgICAgICBpZiAoY2hpbGQgaW5zdGFuY2VvZiBHcm91cCkge1xuICAgICAgICAgICAgICAgICAgICBjaGlsZC5kZWxDaGlsZHJlbkZyb21TdG9yYWdlKHRoaXMuX3N0b3JhZ2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9jaGlsZHJlbi5sZW5ndGggPSAwO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiDpgY3ljobmiYDmnInlrZDoioLngrlcbiAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY2JcbiAgICAgKiBAcGFyYW0gIHt9ICAgY29udGV4dFxuICAgICAqL1xuICAgIEdyb3VwLnByb3RvdHlwZS5lYWNoQ2hpbGQgPSBmdW5jdGlvbihjYiwgY29udGV4dCkge1xuICAgICAgICB2YXIgaGF2ZUNvbnRleHQgPSAhIWNvbnRleHQ7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5fY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBjaGlsZCA9IHRoaXMuX2NoaWxkcmVuW2ldO1xuICAgICAgICAgICAgaWYgKGhhdmVDb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgY2IuY2FsbChjb250ZXh0LCBjaGlsZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNiKGNoaWxkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiDmt7HluqbkvJjlhYjpgY3ljobmiYDmnInlrZDlrZnoioLngrlcbiAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY2JcbiAgICAgKiBAcGFyYW0gIHt9ICAgY29udGV4dFxuICAgICAqL1xuICAgIEdyb3VwLnByb3RvdHlwZS50cmF2ZXJzZSA9IGZ1bmN0aW9uKGNiLCBjb250ZXh0KSB7XG4gICAgICAgIHZhciBoYXZlQ29udGV4dCA9ICEhY29udGV4dDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl9jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGNoaWxkID0gdGhpcy5fY2hpbGRyZW5baV07XG4gICAgICAgICAgICBpZiAoaGF2ZUNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICBjYi5jYWxsKGNvbnRleHQsIGNoaWxkKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY2IoY2hpbGQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoY2hpbGQudHlwZSA9PT0gJ2dyb3VwJykge1xuICAgICAgICAgICAgICAgIGNoaWxkLnRyYXZlcnNlKGNiLCBjb250ZXh0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBHcm91cC5wcm90b3R5cGUuYWRkQ2hpbGRyZW5Ub1N0b3JhZ2UgPSBmdW5jdGlvbihzdG9yYWdlKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5fY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBjaGlsZCA9IHRoaXMuX2NoaWxkcmVuW2ldO1xuICAgICAgICAgICAgc3RvcmFnZS5hZGRUb01hcChjaGlsZCk7XG4gICAgICAgICAgICBpZiAoY2hpbGQgaW5zdGFuY2VvZiBHcm91cCkge1xuICAgICAgICAgICAgICAgIGNoaWxkLmFkZENoaWxkcmVuVG9TdG9yYWdlKHN0b3JhZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIEdyb3VwLnByb3RvdHlwZS5kZWxDaGlsZHJlbkZyb21TdG9yYWdlID0gZnVuY3Rpb24oc3RvcmFnZSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX2NoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgY2hpbGQgPSB0aGlzLl9jaGlsZHJlbltpXTtcbiAgICAgICAgICAgIHN0b3JhZ2UuZGVsRnJvbU1hcChjaGlsZC5pZCk7XG4gICAgICAgICAgICBpZiAoY2hpbGQgaW5zdGFuY2VvZiBHcm91cCkge1xuICAgICAgICAgICAgICAgIGNoaWxkLmRlbENoaWxkcmVuRnJvbVN0b3JhZ2Uoc3RvcmFnZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgR3JvdXAucHJvdG90eXBlLm1vZFNlbGYgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fX2RpcnR5ID0gdHJ1ZTtcbiAgICB9O1xuXG4gICAgdXRpbC5tZXJnZShHcm91cC5wcm90b3R5cGUsIFRyYW5zZm9ybWFibGUucHJvdG90eXBlLCB0cnVlKTtcbiAgICB1dGlsLm1lcmdlKEdyb3VwLnByb3RvdHlwZSwgRXZlbnRmdWwucHJvdG90eXBlLCB0cnVlKTtcblxuICAgIHJldHVybiBHcm91cDtcbn0pOyJdLCJmaWxlIjoicGx1Z2lucy96cmVuZGVyLTIuMS4wL3NyYy9Hcm91cC5qcyJ9
