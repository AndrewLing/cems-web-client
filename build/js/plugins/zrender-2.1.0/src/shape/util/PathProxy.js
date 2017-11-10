/**
 * Path 代理，可以在`buildPath`中用于替代`ctx`, 会保存每个path操作的命令到pathCommands属性中
 * 可以用于 isInsidePath 判断以及获取boundingRect
 * 
 * @module zrender/shape/tool/PathProxy
 * @author pissang (http://www.github.com/pissang)
 * 
 * @example
 *     var SomeShape = function() {
 *         this._pathProxy = new PathProxy();
 *         ...
 *     }
 *     SomeShape.prototype.buildPath = function(ctx, style) {
 *         this._pathProxy.begin(ctx);
 *             .moveTo(style.x, style.y);
 *             .lineTo(style.x1, style.y1);
 *         ...
 *             .closePath();
 *     },
 *     SomeShape.prototype.getRect = function(style) {
 *         if (!style._rect) {
 *             // 这里必须要在 buildPath 之后才能调用
 *             style._rect = this._pathProxy.fastBoundingRect();
 *         }
 *         return this.style._rect;
 *     },
 *     SomeShape.prototype.isCover = function(x, y) {
 *         var rect = this.getRect(this.style);
 *         if (x >= rect.x
 *             && x <= (rect.x + rect.width)
 *             && y >= rect.y
 *             && y <= (rect.y + rect.height)
 *         ) {
 *             return area.isInsidePath(
 *                 this._pathProxy.pathCommands, 0, 'fill', x, y
 *             );
 *         }
 *     }
 */
define(function (require) {
    
    var vector = require('../../tool/vector');
    // var computeBoundingBox = require('../../tool/computeBoundingBox');

    var PathSegment = function(command, points) {
        this.command = command;
        this.points = points || null;
    };

    /**
     * @alias module:zrender/shape/tool/PathProxy
     * @constructor
     */
    var PathProxy = function () {

        /**
         * Path描述的数组，用于`isInsidePath`的判断
         * @type {Array.<Object>}
         */
        this.pathCommands = [];

        this._ctx = null;

        this._min = [];
        this._max = [];
    };

    /**
     * 快速计算Path包围盒（并不是最小包围盒）
     * @return {Object}
     */
    PathProxy.prototype.fastBoundingRect = function () {
        var min = this._min;
        var max = this._max;
        min[0] = min[1] = Infinity;
        max[0] = max[1] = -Infinity;
        for (var i = 0; i < this.pathCommands.length; i++) {
            var seg = this.pathCommands[i];
            var p = seg.points;
            switch (seg.command) {
                case 'M':
                    vector.min(min, min, p);
                    vector.max(max, max, p);
                    break;
                case 'L':
                    vector.min(min, min, p);
                    vector.max(max, max, p);
                    break;
                case 'C':
                    for (var j = 0; j < 6; j += 2) {
                        min[0] = Math.min(min[0], min[0], p[j]);
                        min[1] = Math.min(min[1], min[1], p[j + 1]);
                        max[0] = Math.max(max[0], max[0], p[j]);
                        max[1] = Math.max(max[1], max[1], p[j + 1]);
                    }
                    break;
                case 'Q':
                    for (var j = 0; j < 4; j += 2) {
                        min[0] = Math.min(min[0], min[0], p[j]);
                        min[1] = Math.min(min[1], min[1], p[j + 1]);
                        max[0] = Math.max(max[0], max[0], p[j]);
                        max[1] = Math.max(max[1], max[1], p[j + 1]);
                    }
                    break;
                case 'A':
                    var cx = p[0];
                    var cy = p[1];
                    var rx = p[2];
                    var ry = p[3];
                    min[0] = Math.min(min[0], min[0], cx - rx);
                    min[1] = Math.min(min[1], min[1], cy - ry);
                    max[0] = Math.max(max[0], max[0], cx + rx);
                    max[1] = Math.max(max[1], max[1], cy + ry);
                    break;
            }
        }

        return {
            x: min[0],
            y: min[1],
            width: max[0] - min[0],
            height: max[1] - min[1]
        };
    };

    /**
     * @param  {CanvasRenderingContext2D} ctx
     * @return {module:zrender/shape/util/PathProxy}
     */
    PathProxy.prototype.begin = function (ctx) {
        this._ctx = ctx || null;
        // 清空pathCommands
        this.pathCommands.length = 0;

        return this;
    };

    /**
     * @param  {number} x
     * @param  {number} y
     * @return {module:zrender/shape/util/PathProxy}
     */
    PathProxy.prototype.moveTo = function (x, y) {
        this.pathCommands.push(new PathSegment('M', [x, y]));
        if (this._ctx) {
            this._ctx.moveTo(x, y);
        }
        return this;
    };

    /**
     * @param  {number} x
     * @param  {number} y
     * @return {module:zrender/shape/util/PathProxy}
     */
    PathProxy.prototype.lineTo = function (x, y) {
        this.pathCommands.push(new PathSegment('L', [x, y]));
        if (this._ctx) {
            this._ctx.lineTo(x, y);
        }
        return this;
    };

    /**
     * @param  {number} x1
     * @param  {number} y1
     * @param  {number} x2
     * @param  {number} y2
     * @param  {number} x3
     * @param  {number} y3
     * @return {module:zrender/shape/util/PathProxy}
     */
    PathProxy.prototype.bezierCurveTo = function (x1, y1, x2, y2, x3, y3) {
        this.pathCommands.push(new PathSegment('C', [x1, y1, x2, y2, x3, y3]));
        if (this._ctx) {
            this._ctx.bezierCurveTo(x1, y1, x2, y2, x3, y3);
        }
        return this;
    };

    /**
     * @param  {number} x1
     * @param  {number} y1
     * @param  {number} x2
     * @param  {number} y2
     * @return {module:zrender/shape/util/PathProxy}
     */
    PathProxy.prototype.quadraticCurveTo = function (x1, y1, x2, y2) {
        this.pathCommands.push(new PathSegment('Q', [x1, y1, x2, y2]));
        if (this._ctx) {
            this._ctx.quadraticCurveTo(x1, y1, x2, y2);
        }
        return this;
    };

    /**
     * @param  {number} cx
     * @param  {number} cy
     * @param  {number} r
     * @param  {number} startAngle
     * @param  {number} endAngle
     * @param  {boolean} anticlockwise
     * @return {module:zrender/shape/util/PathProxy}
     */
    PathProxy.prototype.arc = function (cx, cy, r, startAngle, endAngle, anticlockwise) {
        this.pathCommands.push(new PathSegment(
            'A', [cx, cy, r, r, startAngle, endAngle - startAngle, 0, anticlockwise ? 0 : 1]
        ));
        if (this._ctx) {
            this._ctx.arc(cx, cy, r, startAngle, endAngle, anticlockwise);
        }
        return this;
    };

    // TODO
    PathProxy.prototype.arcTo = function (x1, y1, x2, y2, radius) {
        if (this._ctx) {
            this._ctx.arcTo(x1, y1, x2, y2, radius);
        }
        return this;
    };

    // TODO
    PathProxy.prototype.rect = function (x, y, w, h) {
        if (this._ctx) {
            this._ctx.rect(x, y, w, h);
        }
        return this;
    };

    /**
     * @return {module:zrender/shape/util/PathProxy}
     */
    PathProxy.prototype.closePath = function () {
        this.pathCommands.push(new PathSegment('z'));
        if (this._ctx) {
            this._ctx.closePath();
        }
        return this;
    };

    /**
     * 是否没有Path命令
     * @return {boolean}
     */
    PathProxy.prototype.isEmpty = function() {
        return this.pathCommands.length === 0;
    };

    PathProxy.PathSegment = PathSegment;

    return PathProxy;
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3NoYXBlL3V0aWwvUGF0aFByb3h5LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogUGF0aCDku6PnkIbvvIzlj6/ku6XlnKhgYnVpbGRQYXRoYOS4reeUqOS6juabv+S7o2BjdHhgLCDkvJrkv53lrZjmr4/kuKpwYXRo5pON5L2c55qE5ZG95Luk5YiwcGF0aENvbW1hbmRz5bGe5oCn5LitXG4gKiDlj6/ku6XnlKjkuo4gaXNJbnNpZGVQYXRoIOWIpOaWreS7peWPiuiOt+WPlmJvdW5kaW5nUmVjdFxuICogXG4gKiBAbW9kdWxlIHpyZW5kZXIvc2hhcGUvdG9vbC9QYXRoUHJveHlcbiAqIEBhdXRob3IgcGlzc2FuZyAoaHR0cDovL3d3dy5naXRodWIuY29tL3Bpc3NhbmcpXG4gKiBcbiAqIEBleGFtcGxlXG4gKiAgICAgdmFyIFNvbWVTaGFwZSA9IGZ1bmN0aW9uKCkge1xuICogICAgICAgICB0aGlzLl9wYXRoUHJveHkgPSBuZXcgUGF0aFByb3h5KCk7XG4gKiAgICAgICAgIC4uLlxuICogICAgIH1cbiAqICAgICBTb21lU2hhcGUucHJvdG90eXBlLmJ1aWxkUGF0aCA9IGZ1bmN0aW9uKGN0eCwgc3R5bGUpIHtcbiAqICAgICAgICAgdGhpcy5fcGF0aFByb3h5LmJlZ2luKGN0eCk7XG4gKiAgICAgICAgICAgICAubW92ZVRvKHN0eWxlLngsIHN0eWxlLnkpO1xuICogICAgICAgICAgICAgLmxpbmVUbyhzdHlsZS54MSwgc3R5bGUueTEpO1xuICogICAgICAgICAuLi5cbiAqICAgICAgICAgICAgIC5jbG9zZVBhdGgoKTtcbiAqICAgICB9LFxuICogICAgIFNvbWVTaGFwZS5wcm90b3R5cGUuZ2V0UmVjdCA9IGZ1bmN0aW9uKHN0eWxlKSB7XG4gKiAgICAgICAgIGlmICghc3R5bGUuX3JlY3QpIHtcbiAqICAgICAgICAgICAgIC8vIOi/memHjOW/hemhu+imgeWcqCBidWlsZFBhdGgg5LmL5ZCO5omN6IO96LCD55SoXG4gKiAgICAgICAgICAgICBzdHlsZS5fcmVjdCA9IHRoaXMuX3BhdGhQcm94eS5mYXN0Qm91bmRpbmdSZWN0KCk7XG4gKiAgICAgICAgIH1cbiAqICAgICAgICAgcmV0dXJuIHRoaXMuc3R5bGUuX3JlY3Q7XG4gKiAgICAgfSxcbiAqICAgICBTb21lU2hhcGUucHJvdG90eXBlLmlzQ292ZXIgPSBmdW5jdGlvbih4LCB5KSB7XG4gKiAgICAgICAgIHZhciByZWN0ID0gdGhpcy5nZXRSZWN0KHRoaXMuc3R5bGUpO1xuICogICAgICAgICBpZiAoeCA+PSByZWN0LnhcbiAqICAgICAgICAgICAgICYmIHggPD0gKHJlY3QueCArIHJlY3Qud2lkdGgpXG4gKiAgICAgICAgICAgICAmJiB5ID49IHJlY3QueVxuICogICAgICAgICAgICAgJiYgeSA8PSAocmVjdC55ICsgcmVjdC5oZWlnaHQpXG4gKiAgICAgICAgICkge1xuICogICAgICAgICAgICAgcmV0dXJuIGFyZWEuaXNJbnNpZGVQYXRoKFxuICogICAgICAgICAgICAgICAgIHRoaXMuX3BhdGhQcm94eS5wYXRoQ29tbWFuZHMsIDAsICdmaWxsJywgeCwgeVxuICogICAgICAgICAgICAgKTtcbiAqICAgICAgICAgfVxuICogICAgIH1cbiAqL1xuZGVmaW5lKGZ1bmN0aW9uIChyZXF1aXJlKSB7XG4gICAgXG4gICAgdmFyIHZlY3RvciA9IHJlcXVpcmUoJy4uLy4uL3Rvb2wvdmVjdG9yJyk7XG4gICAgLy8gdmFyIGNvbXB1dGVCb3VuZGluZ0JveCA9IHJlcXVpcmUoJy4uLy4uL3Rvb2wvY29tcHV0ZUJvdW5kaW5nQm94Jyk7XG5cbiAgICB2YXIgUGF0aFNlZ21lbnQgPSBmdW5jdGlvbihjb21tYW5kLCBwb2ludHMpIHtcbiAgICAgICAgdGhpcy5jb21tYW5kID0gY29tbWFuZDtcbiAgICAgICAgdGhpcy5wb2ludHMgPSBwb2ludHMgfHwgbnVsbDtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQGFsaWFzIG1vZHVsZTp6cmVuZGVyL3NoYXBlL3Rvb2wvUGF0aFByb3h5XG4gICAgICogQGNvbnN0cnVjdG9yXG4gICAgICovXG4gICAgdmFyIFBhdGhQcm94eSA9IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAvKipcbiAgICAgICAgICogUGF0aOaPj+i/sOeahOaVsOe7hO+8jOeUqOS6jmBpc0luc2lkZVBhdGhg55qE5Yik5patXG4gICAgICAgICAqIEB0eXBlIHtBcnJheS48T2JqZWN0Pn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMucGF0aENvbW1hbmRzID0gW107XG5cbiAgICAgICAgdGhpcy5fY3R4ID0gbnVsbDtcblxuICAgICAgICB0aGlzLl9taW4gPSBbXTtcbiAgICAgICAgdGhpcy5fbWF4ID0gW107XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIOW/q+mAn+iuoeeul1BhdGjljIXlm7Tnm5LvvIjlubbkuI3mmK/mnIDlsI/ljIXlm7Tnm5LvvIlcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9XG4gICAgICovXG4gICAgUGF0aFByb3h5LnByb3RvdHlwZS5mYXN0Qm91bmRpbmdSZWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbWluID0gdGhpcy5fbWluO1xuICAgICAgICB2YXIgbWF4ID0gdGhpcy5fbWF4O1xuICAgICAgICBtaW5bMF0gPSBtaW5bMV0gPSBJbmZpbml0eTtcbiAgICAgICAgbWF4WzBdID0gbWF4WzFdID0gLUluZmluaXR5O1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucGF0aENvbW1hbmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgc2VnID0gdGhpcy5wYXRoQ29tbWFuZHNbaV07XG4gICAgICAgICAgICB2YXIgcCA9IHNlZy5wb2ludHM7XG4gICAgICAgICAgICBzd2l0Y2ggKHNlZy5jb21tYW5kKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnTSc6XG4gICAgICAgICAgICAgICAgICAgIHZlY3Rvci5taW4obWluLCBtaW4sIHApO1xuICAgICAgICAgICAgICAgICAgICB2ZWN0b3IubWF4KG1heCwgbWF4LCBwKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnTCc6XG4gICAgICAgICAgICAgICAgICAgIHZlY3Rvci5taW4obWluLCBtaW4sIHApO1xuICAgICAgICAgICAgICAgICAgICB2ZWN0b3IubWF4KG1heCwgbWF4LCBwKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnQyc6XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgNjsgaiArPSAyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtaW5bMF0gPSBNYXRoLm1pbihtaW5bMF0sIG1pblswXSwgcFtqXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtaW5bMV0gPSBNYXRoLm1pbihtaW5bMV0sIG1pblsxXSwgcFtqICsgMV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWF4WzBdID0gTWF0aC5tYXgobWF4WzBdLCBtYXhbMF0sIHBbal0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWF4WzFdID0gTWF0aC5tYXgobWF4WzFdLCBtYXhbMV0sIHBbaiArIDFdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdRJzpcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCA0OyBqICs9IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pblswXSA9IE1hdGgubWluKG1pblswXSwgbWluWzBdLCBwW2pdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pblsxXSA9IE1hdGgubWluKG1pblsxXSwgbWluWzFdLCBwW2ogKyAxXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXhbMF0gPSBNYXRoLm1heChtYXhbMF0sIG1heFswXSwgcFtqXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXhbMV0gPSBNYXRoLm1heChtYXhbMV0sIG1heFsxXSwgcFtqICsgMV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ0EnOlxuICAgICAgICAgICAgICAgICAgICB2YXIgY3ggPSBwWzBdO1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3kgPSBwWzFdO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcnggPSBwWzJdO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcnkgPSBwWzNdO1xuICAgICAgICAgICAgICAgICAgICBtaW5bMF0gPSBNYXRoLm1pbihtaW5bMF0sIG1pblswXSwgY3ggLSByeCk7XG4gICAgICAgICAgICAgICAgICAgIG1pblsxXSA9IE1hdGgubWluKG1pblsxXSwgbWluWzFdLCBjeSAtIHJ5KTtcbiAgICAgICAgICAgICAgICAgICAgbWF4WzBdID0gTWF0aC5tYXgobWF4WzBdLCBtYXhbMF0sIGN4ICsgcngpO1xuICAgICAgICAgICAgICAgICAgICBtYXhbMV0gPSBNYXRoLm1heChtYXhbMV0sIG1heFsxXSwgY3kgKyByeSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHg6IG1pblswXSxcbiAgICAgICAgICAgIHk6IG1pblsxXSxcbiAgICAgICAgICAgIHdpZHRoOiBtYXhbMF0gLSBtaW5bMF0sXG4gICAgICAgICAgICBoZWlnaHQ6IG1heFsxXSAtIG1pblsxXVxuICAgICAgICB9O1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0gIHtDYW52YXNSZW5kZXJpbmdDb250ZXh0MkR9IGN0eFxuICAgICAqIEByZXR1cm4ge21vZHVsZTp6cmVuZGVyL3NoYXBlL3V0aWwvUGF0aFByb3h5fVxuICAgICAqL1xuICAgIFBhdGhQcm94eS5wcm90b3R5cGUuYmVnaW4gPSBmdW5jdGlvbiAoY3R4KSB7XG4gICAgICAgIHRoaXMuX2N0eCA9IGN0eCB8fCBudWxsO1xuICAgICAgICAvLyDmuIXnqbpwYXRoQ29tbWFuZHNcbiAgICAgICAgdGhpcy5wYXRoQ29tbWFuZHMubGVuZ3RoID0gMDtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtICB7bnVtYmVyfSB4XG4gICAgICogQHBhcmFtICB7bnVtYmVyfSB5XG4gICAgICogQHJldHVybiB7bW9kdWxlOnpyZW5kZXIvc2hhcGUvdXRpbC9QYXRoUHJveHl9XG4gICAgICovXG4gICAgUGF0aFByb3h5LnByb3RvdHlwZS5tb3ZlVG8gPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICB0aGlzLnBhdGhDb21tYW5kcy5wdXNoKG5ldyBQYXRoU2VnbWVudCgnTScsIFt4LCB5XSkpO1xuICAgICAgICBpZiAodGhpcy5fY3R4KSB7XG4gICAgICAgICAgICB0aGlzLl9jdHgubW92ZVRvKHgsIHkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9IHhcbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9IHlcbiAgICAgKiBAcmV0dXJuIHttb2R1bGU6enJlbmRlci9zaGFwZS91dGlsL1BhdGhQcm94eX1cbiAgICAgKi9cbiAgICBQYXRoUHJveHkucHJvdG90eXBlLmxpbmVUbyA9IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgIHRoaXMucGF0aENvbW1hbmRzLnB1c2gobmV3IFBhdGhTZWdtZW50KCdMJywgW3gsIHldKSk7XG4gICAgICAgIGlmICh0aGlzLl9jdHgpIHtcbiAgICAgICAgICAgIHRoaXMuX2N0eC5saW5lVG8oeCwgeSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSAge251bWJlcn0geDFcbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9IHkxXG4gICAgICogQHBhcmFtICB7bnVtYmVyfSB4MlxuICAgICAqIEBwYXJhbSAge251bWJlcn0geTJcbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9IHgzXG4gICAgICogQHBhcmFtICB7bnVtYmVyfSB5M1xuICAgICAqIEByZXR1cm4ge21vZHVsZTp6cmVuZGVyL3NoYXBlL3V0aWwvUGF0aFByb3h5fVxuICAgICAqL1xuICAgIFBhdGhQcm94eS5wcm90b3R5cGUuYmV6aWVyQ3VydmVUbyA9IGZ1bmN0aW9uICh4MSwgeTEsIHgyLCB5MiwgeDMsIHkzKSB7XG4gICAgICAgIHRoaXMucGF0aENvbW1hbmRzLnB1c2gobmV3IFBhdGhTZWdtZW50KCdDJywgW3gxLCB5MSwgeDIsIHkyLCB4MywgeTNdKSk7XG4gICAgICAgIGlmICh0aGlzLl9jdHgpIHtcbiAgICAgICAgICAgIHRoaXMuX2N0eC5iZXppZXJDdXJ2ZVRvKHgxLCB5MSwgeDIsIHkyLCB4MywgeTMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9IHgxXG4gICAgICogQHBhcmFtICB7bnVtYmVyfSB5MVxuICAgICAqIEBwYXJhbSAge251bWJlcn0geDJcbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9IHkyXG4gICAgICogQHJldHVybiB7bW9kdWxlOnpyZW5kZXIvc2hhcGUvdXRpbC9QYXRoUHJveHl9XG4gICAgICovXG4gICAgUGF0aFByb3h5LnByb3RvdHlwZS5xdWFkcmF0aWNDdXJ2ZVRvID0gZnVuY3Rpb24gKHgxLCB5MSwgeDIsIHkyKSB7XG4gICAgICAgIHRoaXMucGF0aENvbW1hbmRzLnB1c2gobmV3IFBhdGhTZWdtZW50KCdRJywgW3gxLCB5MSwgeDIsIHkyXSkpO1xuICAgICAgICBpZiAodGhpcy5fY3R4KSB7XG4gICAgICAgICAgICB0aGlzLl9jdHgucXVhZHJhdGljQ3VydmVUbyh4MSwgeTEsIHgyLCB5Mik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSAge251bWJlcn0gY3hcbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9IGN5XG4gICAgICogQHBhcmFtICB7bnVtYmVyfSByXG4gICAgICogQHBhcmFtICB7bnVtYmVyfSBzdGFydEFuZ2xlXG4gICAgICogQHBhcmFtICB7bnVtYmVyfSBlbmRBbmdsZVxuICAgICAqIEBwYXJhbSAge2Jvb2xlYW59IGFudGljbG9ja3dpc2VcbiAgICAgKiBAcmV0dXJuIHttb2R1bGU6enJlbmRlci9zaGFwZS91dGlsL1BhdGhQcm94eX1cbiAgICAgKi9cbiAgICBQYXRoUHJveHkucHJvdG90eXBlLmFyYyA9IGZ1bmN0aW9uIChjeCwgY3ksIHIsIHN0YXJ0QW5nbGUsIGVuZEFuZ2xlLCBhbnRpY2xvY2t3aXNlKSB7XG4gICAgICAgIHRoaXMucGF0aENvbW1hbmRzLnB1c2gobmV3IFBhdGhTZWdtZW50KFxuICAgICAgICAgICAgJ0EnLCBbY3gsIGN5LCByLCByLCBzdGFydEFuZ2xlLCBlbmRBbmdsZSAtIHN0YXJ0QW5nbGUsIDAsIGFudGljbG9ja3dpc2UgPyAwIDogMV1cbiAgICAgICAgKSk7XG4gICAgICAgIGlmICh0aGlzLl9jdHgpIHtcbiAgICAgICAgICAgIHRoaXMuX2N0eC5hcmMoY3gsIGN5LCByLCBzdGFydEFuZ2xlLCBlbmRBbmdsZSwgYW50aWNsb2Nrd2lzZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIC8vIFRPRE9cbiAgICBQYXRoUHJveHkucHJvdG90eXBlLmFyY1RvID0gZnVuY3Rpb24gKHgxLCB5MSwgeDIsIHkyLCByYWRpdXMpIHtcbiAgICAgICAgaWYgKHRoaXMuX2N0eCkge1xuICAgICAgICAgICAgdGhpcy5fY3R4LmFyY1RvKHgxLCB5MSwgeDIsIHkyLCByYWRpdXMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAvLyBUT0RPXG4gICAgUGF0aFByb3h5LnByb3RvdHlwZS5yZWN0ID0gZnVuY3Rpb24gKHgsIHksIHcsIGgpIHtcbiAgICAgICAgaWYgKHRoaXMuX2N0eCkge1xuICAgICAgICAgICAgdGhpcy5fY3R4LnJlY3QoeCwgeSwgdywgaCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEByZXR1cm4ge21vZHVsZTp6cmVuZGVyL3NoYXBlL3V0aWwvUGF0aFByb3h5fVxuICAgICAqL1xuICAgIFBhdGhQcm94eS5wcm90b3R5cGUuY2xvc2VQYXRoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnBhdGhDb21tYW5kcy5wdXNoKG5ldyBQYXRoU2VnbWVudCgneicpKTtcbiAgICAgICAgaWYgKHRoaXMuX2N0eCkge1xuICAgICAgICAgICAgdGhpcy5fY3R4LmNsb3NlUGF0aCgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiDmmK/lkKbmsqHmnIlQYXRo5ZG95LukXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBQYXRoUHJveHkucHJvdG90eXBlLmlzRW1wdHkgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucGF0aENvbW1hbmRzLmxlbmd0aCA9PT0gMDtcbiAgICB9O1xuXG4gICAgUGF0aFByb3h5LlBhdGhTZWdtZW50ID0gUGF0aFNlZ21lbnQ7XG5cbiAgICByZXR1cm4gUGF0aFByb3h5O1xufSk7Il0sImZpbGUiOiJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3NoYXBlL3V0aWwvUGF0aFByb3h5LmpzIn0=
