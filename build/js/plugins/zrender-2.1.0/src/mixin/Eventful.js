/**
 * 事件扩展
 * @module zrender/mixin/Eventful
 * @author Kener (@Kener-林峰, kener.linfeng@gmail.com)
 *         pissang (https://www.github.com/pissang)
 */
define(function (require) {

    /**
     * 事件分发器
     * @alias module:zrender/mixin/Eventful
     * @constructor
     */
    var Eventful = function () {
        this._handlers = {};
    };
    /**
     * 单次触发绑定，dispatch后销毁
     * 
     * @param {string} event 事件名
     * @param {Function} handler 响应函数
     * @param {Object} context
     */
    Eventful.prototype.one = function (event, handler, context) {
        var _h = this._handlers;

        if (!handler || !event) {
            return this;
        }

        if (!_h[event]) {
            _h[event] = [];
        }

        _h[event].push({
            h : handler,
            one : true,
            ctx: context || this
        });

        return this;
    };

    /**
     * 绑定事件
     * @param {string} event 事件名
     * @param {Function} handler 事件处理函数
     * @param {Object} [context]
     */
    Eventful.prototype.bind = function (event, handler, context) {
        var _h = this._handlers;

        if (!handler || !event) {
            return this;
        }

        if (!_h[event]) {
            _h[event] = [];
        }

        _h[event].push({
            h : handler,
            one : false,
            ctx: context || this
        });

        return this;
    };

    /**
     * 解绑事件
     * @param {string} event 事件名
     * @param {Function} [handler] 事件处理函数
     */
    Eventful.prototype.unbind = function (event, handler) {
        var _h = this._handlers;

        if (!event) {
            this._handlers = {};
            return this;
        }

        if (handler) {
            if (_h[event]) {
                var newList = [];
                for (var i = 0, l = _h[event].length; i < l; i++) {
                    if (_h[event][i]['h'] != handler) {
                        newList.push(_h[event][i]);
                    }
                }
                _h[event] = newList;
            }

            if (_h[event] && _h[event].length === 0) {
                delete _h[event];
            }
        }
        else {
            delete _h[event];
        }

        return this;
    };

    /**
     * 事件分发
     * 
     * @param {string} type 事件类型
     */
    Eventful.prototype.dispatch = function (type) {
        if (this._handlers[type]) {
            var args = arguments;
            var argLen = args.length;

            if (argLen > 3) {
                args = Array.prototype.slice.call(args, 1);
            }
            
            var _h = this._handlers[type];
            var len = _h.length;
            for (var i = 0; i < len;) {
                // Optimize advise from backbone
                switch (argLen) {
                    case 1:
                        _h[i]['h'].call(_h[i]['ctx']);
                        break;
                    case 2:
                        _h[i]['h'].call(_h[i]['ctx'], args[1]);
                        break;
                    case 3:
                        _h[i]['h'].call(_h[i]['ctx'], args[1], args[2]);
                        break;
                    default:
                        // have more than 2 given arguments
                        _h[i]['h'].apply(_h[i]['ctx'], args);
                        break;
                }
                
                if (_h[i]['one']) {
                    _h.splice(i, 1);
                    len--;
                }
                else {
                    i++;
                }
            }
        }

        return this;
    };

    /**
     * 带有context的事件分发, 最后一个参数是事件回调的context
     * @param {string} type 事件类型
     */
    Eventful.prototype.dispatchWithContext = function (type) {
        if (this._handlers[type]) {
            var args = arguments;
            var argLen = args.length;

            if (argLen > 4) {
                args = Array.prototype.slice.call(args, 1, args.length - 1);
            }
            var ctx = args[args.length - 1];

            var _h = this._handlers[type];
            var len = _h.length;
            for (var i = 0; i < len;) {
                // Optimize advise from backbone
                switch (argLen) {
                    case 1:
                        _h[i]['h'].call(ctx);
                        break;
                    case 2:
                        _h[i]['h'].call(ctx, args[1]);
                        break;
                    case 3:
                        _h[i]['h'].call(ctx, args[1], args[2]);
                        break;
                    default:
                        // have more than 2 given arguments
                        _h[i]['h'].apply(ctx, args);
                        break;
                }
                
                if (_h[i]['one']) {
                    _h.splice(i, 1);
                    len--;
                }
                else {
                    i++;
                }
            }
        }

        return this;
    };

    // 对象可以通过 onxxxx 绑定事件
    /**
     * @event module:zrender/mixin/Eventful#onclick
     * @type {Function}
     * @default null
     */
    /**
     * @event module:zrender/mixin/Eventful#onmouseover
     * @type {Function}
     * @default null
     */
    /**
     * @event module:zrender/mixin/Eventful#onmouseout
     * @type {Function}
     * @default null
     */
    /**
     * @event module:zrender/mixin/Eventful#onmousemove
     * @type {Function}
     * @default null
     */
    /**
     * @event module:zrender/mixin/Eventful#onmousewheel
     * @type {Function}
     * @default null
     */
    /**
     * @event module:zrender/mixin/Eventful#onmousedown
     * @type {Function}
     * @default null
     */
    /**
     * @event module:zrender/mixin/Eventful#onmouseup
     * @type {Function}
     * @default null
     */
    /**
     * @event module:zrender/mixin/Eventful#ondragstart
     * @type {Function}
     * @default null
     */
    /**
     * @event module:zrender/mixin/Eventful#ondragend
     * @type {Function}
     * @default null
     */
    /**
     * @event module:zrender/mixin/Eventful#ondragenter
     * @type {Function}
     * @default null
     */
    /**
     * @event module:zrender/mixin/Eventful#ondragleave
     * @type {Function}
     * @default null
     */
    /**
     * @event module:zrender/mixin/Eventful#ondragover
     * @type {Function}
     * @default null
     */
    /**
     * @event module:zrender/mixin/Eventful#ondrop
     * @type {Function}
     * @default null
     */
    
    return Eventful;
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL21peGluL0V2ZW50ZnVsLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICog5LqL5Lu25omp5bGVXG4gKiBAbW9kdWxlIHpyZW5kZXIvbWl4aW4vRXZlbnRmdWxcbiAqIEBhdXRob3IgS2VuZXIgKEBLZW5lci3mnpfls7AsIGtlbmVyLmxpbmZlbmdAZ21haWwuY29tKVxuICogICAgICAgICBwaXNzYW5nIChodHRwczovL3d3dy5naXRodWIuY29tL3Bpc3NhbmcpXG4gKi9cbmRlZmluZShmdW5jdGlvbiAocmVxdWlyZSkge1xuXG4gICAgLyoqXG4gICAgICog5LqL5Lu25YiG5Y+R5ZmoXG4gICAgICogQGFsaWFzIG1vZHVsZTp6cmVuZGVyL21peGluL0V2ZW50ZnVsXG4gICAgICogQGNvbnN0cnVjdG9yXG4gICAgICovXG4gICAgdmFyIEV2ZW50ZnVsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLl9oYW5kbGVycyA9IHt9O1xuICAgIH07XG4gICAgLyoqXG4gICAgICog5Y2V5qyh6Kem5Y+R57uR5a6a77yMZGlzcGF0Y2jlkI7plIDmr4FcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQg5LqL5Lu25ZCNXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaGFuZGxlciDlk43lupTlh73mlbBcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY29udGV4dFxuICAgICAqL1xuICAgIEV2ZW50ZnVsLnByb3RvdHlwZS5vbmUgPSBmdW5jdGlvbiAoZXZlbnQsIGhhbmRsZXIsIGNvbnRleHQpIHtcbiAgICAgICAgdmFyIF9oID0gdGhpcy5faGFuZGxlcnM7XG5cbiAgICAgICAgaWYgKCFoYW5kbGVyIHx8ICFldmVudCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIV9oW2V2ZW50XSkge1xuICAgICAgICAgICAgX2hbZXZlbnRdID0gW107XG4gICAgICAgIH1cblxuICAgICAgICBfaFtldmVudF0ucHVzaCh7XG4gICAgICAgICAgICBoIDogaGFuZGxlcixcbiAgICAgICAgICAgIG9uZSA6IHRydWUsXG4gICAgICAgICAgICBjdHg6IGNvbnRleHQgfHwgdGhpc1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICog57uR5a6a5LqL5Lu2XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50IOS6i+S7tuWQjVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGhhbmRsZXIg5LqL5Lu25aSE55CG5Ye95pWwXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtjb250ZXh0XVxuICAgICAqL1xuICAgIEV2ZW50ZnVsLnByb3RvdHlwZS5iaW5kID0gZnVuY3Rpb24gKGV2ZW50LCBoYW5kbGVyLCBjb250ZXh0KSB7XG4gICAgICAgIHZhciBfaCA9IHRoaXMuX2hhbmRsZXJzO1xuXG4gICAgICAgIGlmICghaGFuZGxlciB8fCAhZXZlbnQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFfaFtldmVudF0pIHtcbiAgICAgICAgICAgIF9oW2V2ZW50XSA9IFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgX2hbZXZlbnRdLnB1c2goe1xuICAgICAgICAgICAgaCA6IGhhbmRsZXIsXG4gICAgICAgICAgICBvbmUgOiBmYWxzZSxcbiAgICAgICAgICAgIGN0eDogY29udGV4dCB8fCB0aGlzXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiDop6Pnu5Hkuovku7ZcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQg5LqL5Lu25ZCNXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gW2hhbmRsZXJdIOS6i+S7tuWkhOeQhuWHveaVsFxuICAgICAqL1xuICAgIEV2ZW50ZnVsLnByb3RvdHlwZS51bmJpbmQgPSBmdW5jdGlvbiAoZXZlbnQsIGhhbmRsZXIpIHtcbiAgICAgICAgdmFyIF9oID0gdGhpcy5faGFuZGxlcnM7XG5cbiAgICAgICAgaWYgKCFldmVudCkge1xuICAgICAgICAgICAgdGhpcy5faGFuZGxlcnMgPSB7fTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGhhbmRsZXIpIHtcbiAgICAgICAgICAgIGlmIChfaFtldmVudF0pIHtcbiAgICAgICAgICAgICAgICB2YXIgbmV3TGlzdCA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gX2hbZXZlbnRdLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoX2hbZXZlbnRdW2ldWydoJ10gIT0gaGFuZGxlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3TGlzdC5wdXNoKF9oW2V2ZW50XVtpXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgX2hbZXZlbnRdID0gbmV3TGlzdDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKF9oW2V2ZW50XSAmJiBfaFtldmVudF0ubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIF9oW2V2ZW50XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGRlbGV0ZSBfaFtldmVudF07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICog5LqL5Lu25YiG5Y+RXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHR5cGUg5LqL5Lu257G75Z6LXG4gICAgICovXG4gICAgRXZlbnRmdWwucHJvdG90eXBlLmRpc3BhdGNoID0gZnVuY3Rpb24gKHR5cGUpIHtcbiAgICAgICAgaWYgKHRoaXMuX2hhbmRsZXJzW3R5cGVdKSB7XG4gICAgICAgICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgICAgICAgIHZhciBhcmdMZW4gPSBhcmdzLmxlbmd0aDtcblxuICAgICAgICAgICAgaWYgKGFyZ0xlbiA+IDMpIHtcbiAgICAgICAgICAgICAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJncywgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBfaCA9IHRoaXMuX2hhbmRsZXJzW3R5cGVdO1xuICAgICAgICAgICAgdmFyIGxlbiA9IF9oLmxlbmd0aDtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOykge1xuICAgICAgICAgICAgICAgIC8vIE9wdGltaXplIGFkdmlzZSBmcm9tIGJhY2tib25lXG4gICAgICAgICAgICAgICAgc3dpdGNoIChhcmdMZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgICAgICAgICAgICAgX2hbaV1bJ2gnXS5jYWxsKF9oW2ldWydjdHgnXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICAgICAgICAgICAgX2hbaV1bJ2gnXS5jYWxsKF9oW2ldWydjdHgnXSwgYXJnc1sxXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgICAgICAgICAgICAgX2hbaV1bJ2gnXS5jYWxsKF9oW2ldWydjdHgnXSwgYXJnc1sxXSwgYXJnc1syXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGhhdmUgbW9yZSB0aGFuIDIgZ2l2ZW4gYXJndW1lbnRzXG4gICAgICAgICAgICAgICAgICAgICAgICBfaFtpXVsnaCddLmFwcGx5KF9oW2ldWydjdHgnXSwgYXJncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKF9oW2ldWydvbmUnXSkge1xuICAgICAgICAgICAgICAgICAgICBfaC5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgICAgIGxlbi0tO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiDluKbmnIljb250ZXh055qE5LqL5Lu25YiG5Y+RLCDmnIDlkI7kuIDkuKrlj4LmlbDmmK/kuovku7blm57osIPnmoRjb250ZXh0XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHR5cGUg5LqL5Lu257G75Z6LXG4gICAgICovXG4gICAgRXZlbnRmdWwucHJvdG90eXBlLmRpc3BhdGNoV2l0aENvbnRleHQgPSBmdW5jdGlvbiAodHlwZSkge1xuICAgICAgICBpZiAodGhpcy5faGFuZGxlcnNbdHlwZV0pIHtcbiAgICAgICAgICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgICAgICAgdmFyIGFyZ0xlbiA9IGFyZ3MubGVuZ3RoO1xuXG4gICAgICAgICAgICBpZiAoYXJnTGVuID4gNCkge1xuICAgICAgICAgICAgICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmdzLCAxLCBhcmdzLmxlbmd0aCAtIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGN0eCA9IGFyZ3NbYXJncy5sZW5ndGggLSAxXTtcblxuICAgICAgICAgICAgdmFyIF9oID0gdGhpcy5faGFuZGxlcnNbdHlwZV07XG4gICAgICAgICAgICB2YXIgbGVuID0gX2gubGVuZ3RoO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47KSB7XG4gICAgICAgICAgICAgICAgLy8gT3B0aW1pemUgYWR2aXNlIGZyb20gYmFja2JvbmVcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGFyZ0xlbikge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgICAgICAgICBfaFtpXVsnaCddLmNhbGwoY3R4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICAgICAgICAgICAgICBfaFtpXVsnaCddLmNhbGwoY3R4LCBhcmdzWzFdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICAgICAgICAgICAgICBfaFtpXVsnaCddLmNhbGwoY3R4LCBhcmdzWzFdLCBhcmdzWzJdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaGF2ZSBtb3JlIHRoYW4gMiBnaXZlbiBhcmd1bWVudHNcbiAgICAgICAgICAgICAgICAgICAgICAgIF9oW2ldWydoJ10uYXBwbHkoY3R4LCBhcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAoX2hbaV1bJ29uZSddKSB7XG4gICAgICAgICAgICAgICAgICAgIF9oLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgbGVuLS07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIC8vIOWvueixoeWPr+S7pemAmui/hyBvbnh4eHgg57uR5a6a5LqL5Lu2XG4gICAgLyoqXG4gICAgICogQGV2ZW50IG1vZHVsZTp6cmVuZGVyL21peGluL0V2ZW50ZnVsI29uY2xpY2tcbiAgICAgKiBAdHlwZSB7RnVuY3Rpb259XG4gICAgICogQGRlZmF1bHQgbnVsbFxuICAgICAqL1xuICAgIC8qKlxuICAgICAqIEBldmVudCBtb2R1bGU6enJlbmRlci9taXhpbi9FdmVudGZ1bCNvbm1vdXNlb3ZlclxuICAgICAqIEB0eXBlIHtGdW5jdGlvbn1cbiAgICAgKiBAZGVmYXVsdCBudWxsXG4gICAgICovXG4gICAgLyoqXG4gICAgICogQGV2ZW50IG1vZHVsZTp6cmVuZGVyL21peGluL0V2ZW50ZnVsI29ubW91c2VvdXRcbiAgICAgKiBAdHlwZSB7RnVuY3Rpb259XG4gICAgICogQGRlZmF1bHQgbnVsbFxuICAgICAqL1xuICAgIC8qKlxuICAgICAqIEBldmVudCBtb2R1bGU6enJlbmRlci9taXhpbi9FdmVudGZ1bCNvbm1vdXNlbW92ZVxuICAgICAqIEB0eXBlIHtGdW5jdGlvbn1cbiAgICAgKiBAZGVmYXVsdCBudWxsXG4gICAgICovXG4gICAgLyoqXG4gICAgICogQGV2ZW50IG1vZHVsZTp6cmVuZGVyL21peGluL0V2ZW50ZnVsI29ubW91c2V3aGVlbFxuICAgICAqIEB0eXBlIHtGdW5jdGlvbn1cbiAgICAgKiBAZGVmYXVsdCBudWxsXG4gICAgICovXG4gICAgLyoqXG4gICAgICogQGV2ZW50IG1vZHVsZTp6cmVuZGVyL21peGluL0V2ZW50ZnVsI29ubW91c2Vkb3duXG4gICAgICogQHR5cGUge0Z1bmN0aW9ufVxuICAgICAqIEBkZWZhdWx0IG51bGxcbiAgICAgKi9cbiAgICAvKipcbiAgICAgKiBAZXZlbnQgbW9kdWxlOnpyZW5kZXIvbWl4aW4vRXZlbnRmdWwjb25tb3VzZXVwXG4gICAgICogQHR5cGUge0Z1bmN0aW9ufVxuICAgICAqIEBkZWZhdWx0IG51bGxcbiAgICAgKi9cbiAgICAvKipcbiAgICAgKiBAZXZlbnQgbW9kdWxlOnpyZW5kZXIvbWl4aW4vRXZlbnRmdWwjb25kcmFnc3RhcnRcbiAgICAgKiBAdHlwZSB7RnVuY3Rpb259XG4gICAgICogQGRlZmF1bHQgbnVsbFxuICAgICAqL1xuICAgIC8qKlxuICAgICAqIEBldmVudCBtb2R1bGU6enJlbmRlci9taXhpbi9FdmVudGZ1bCNvbmRyYWdlbmRcbiAgICAgKiBAdHlwZSB7RnVuY3Rpb259XG4gICAgICogQGRlZmF1bHQgbnVsbFxuICAgICAqL1xuICAgIC8qKlxuICAgICAqIEBldmVudCBtb2R1bGU6enJlbmRlci9taXhpbi9FdmVudGZ1bCNvbmRyYWdlbnRlclxuICAgICAqIEB0eXBlIHtGdW5jdGlvbn1cbiAgICAgKiBAZGVmYXVsdCBudWxsXG4gICAgICovXG4gICAgLyoqXG4gICAgICogQGV2ZW50IG1vZHVsZTp6cmVuZGVyL21peGluL0V2ZW50ZnVsI29uZHJhZ2xlYXZlXG4gICAgICogQHR5cGUge0Z1bmN0aW9ufVxuICAgICAqIEBkZWZhdWx0IG51bGxcbiAgICAgKi9cbiAgICAvKipcbiAgICAgKiBAZXZlbnQgbW9kdWxlOnpyZW5kZXIvbWl4aW4vRXZlbnRmdWwjb25kcmFnb3ZlclxuICAgICAqIEB0eXBlIHtGdW5jdGlvbn1cbiAgICAgKiBAZGVmYXVsdCBudWxsXG4gICAgICovXG4gICAgLyoqXG4gICAgICogQGV2ZW50IG1vZHVsZTp6cmVuZGVyL21peGluL0V2ZW50ZnVsI29uZHJvcFxuICAgICAqIEB0eXBlIHtGdW5jdGlvbn1cbiAgICAgKiBAZGVmYXVsdCBudWxsXG4gICAgICovXG4gICAgXG4gICAgcmV0dXJuIEV2ZW50ZnVsO1xufSk7XG4iXSwiZmlsZSI6InBsdWdpbnMvenJlbmRlci0yLjEuMC9zcmMvbWl4aW4vRXZlbnRmdWwuanMifQ==
