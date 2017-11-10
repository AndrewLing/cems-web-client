/**
 * @module zrender/tool/util
 * @author Kener (@Kener-林峰, kener.linfeng@gmail.com)
 *         Yi Shen(https://github.com/pissang)
 */
define(
    function(require) {

        var ArrayProto = Array.prototype;
        var nativeForEach = ArrayProto.forEach;
        var nativeMap = ArrayProto.map;
        var nativeFilter = ArrayProto.filter;

        // 用于处理merge时无法遍历Date等对象的问题
        var BUILTIN_OBJECT = {
            '[object Function]': 1,
            '[object RegExp]': 1,
            '[object Date]': 1,
            '[object Error]': 1,
            '[object CanvasGradient]': 1
        };

        var objToString = Object.prototype.toString;

        function isDom(obj) {
            return obj && obj.nodeType === 1
                   && typeof(obj.nodeName) == 'string';
        }

        /**
         * 对一个object进行深度拷贝
         * @memberOf module:zrender/tool/util
         * @param {*} source 需要进行拷贝的对象
         * @return {*} 拷贝后的新对象
         */
        function clone(source) {
            if (typeof source == 'object' && source !== null) {
                var result = source;
                if (source instanceof Array) {
                    result = [];
                    for (var i = 0, len = source.length; i < len; i++) {
                        result[i] = clone(source[i]);
                    }
                }
                else if (
                    !BUILTIN_OBJECT[objToString.call(source)]
                    // 是否为 dom 对象
                    && !isDom(source)
                ) {
                    result = {};
                    for (var key in source) {
                        if (source.hasOwnProperty(key)) {
                            result[key] = clone(source[key]);
                        }
                    }
                }

                return result;
            }

            return source;
        }

        function mergeItem(target, source, key, overwrite) {
            if (source.hasOwnProperty(key)) {
                var targetProp = target[key];
                if (typeof targetProp == 'object'
                    && !BUILTIN_OBJECT[objToString.call(targetProp)]
                    // 是否为 dom 对象
                    && !isDom(targetProp)
                ) {
                    // 如果需要递归覆盖，就递归调用merge
                    merge(
                        target[key],
                        source[key],
                        overwrite
                    );
                }
                else if (overwrite || !(key in target)) {
                    // 否则只处理overwrite为true，或者在目标对象中没有此属性的情况
                    target[key] = source[key];
                }
            }
        }

        /**
         * 合并源对象的属性到目标对象
         * @memberOf module:zrender/tool/util
         * @param {*} target 目标对象
         * @param {*} source 源对象
         * @param {boolean} overwrite 是否覆盖
         */
        function merge(target, source, overwrite) {
            for (var i in source) {
                mergeItem(target, source, i, overwrite);
            }
            
            return target;
        }

        var _ctx;

        function getContext() {
            if (!_ctx) {
                require('../dep/excanvas');
                /* jshint ignore:start */
                if (window['G_vmlCanvasManager']) {
                    var _div = document.createElement('div');
                    _div.style.position = 'absolute';
                    _div.style.top = '-1000px';
                    document.body.appendChild(_div);

                    _ctx = G_vmlCanvasManager.initElement(_div)
                               .getContext('2d');
                }
                else {
                    _ctx = document.createElement('canvas').getContext('2d');
                }
                /* jshint ignore:end */
            }
            return _ctx;
        }

        /**
         * @memberOf module:zrender/tool/util
         * @param {Array} array
         * @param {*} value
         */
        function indexOf(array, value) {
            if (array.indexOf) {
                return array.indexOf(value);
            }
            for (var i = 0, len = array.length; i < len; i++) {
                if (array[i] === value) {
                    return i;
                }
            }
            return -1;
        }

        /**
         * 构造类继承关系
         * @memberOf module:zrender/tool/util
         * @param {Function} clazz 源类
         * @param {Function} baseClazz 基类
         */
        function inherits(clazz, baseClazz) {
            var clazzPrototype = clazz.prototype;
            function F() {}
            F.prototype = baseClazz.prototype;
            clazz.prototype = new F();

            for (var prop in clazzPrototype) {
                clazz.prototype[prop] = clazzPrototype[prop];
            }
            clazz.constructor = clazz;
        }

        /**
         * 数组或对象遍历
         * @memberOf module:zrender/tool/util
         * @param {Object|Array} obj
         * @param {Function} cb
         * @param {*} [context]
         */
        function each(obj, cb, context) {
            if (!(obj && cb)) {
                return;
            }
            if (obj.forEach && obj.forEach === nativeForEach) {
                obj.forEach(cb, context);
            }
            else if (obj.length === +obj.length) {
                for (var i = 0, len = obj.length; i < len; i++) {
                    cb.call(context, obj[i], i, obj);
                }
            }
            else {
                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        cb.call(context, obj[key], key, obj);
                    }
                }
            }
        }

        /**
         * 数组映射
         * @memberOf module:zrender/tool/util
         * @param {Array} obj
         * @param {Function} cb
         * @param {*} [context]
         * @return {Array}
         */
        function map(obj, cb, context) {
            if (!(obj && cb)) {
                return;
            }
            if (obj.map && obj.map === nativeMap) {
                return obj.map(cb, context);
            }
            else {
                var result = [];
                for (var i = 0, len = obj.length; i < len; i++) {
                    result.push(cb.call(context, obj[i], i, obj));
                }
                return result;
            }
        }

        /**
         * 数组过滤
         * @memberOf module:zrender/tool/util
         * @param {Array} obj
         * @param {Function} cb
         * @param {*} [context]
         * @return {Array}
         */
        function filter(obj, cb, context) {
            if (!(obj && cb)) {
                return;
            }
            if (obj.filter && obj.filter === nativeFilter) {
                return obj.filter(cb, context);
            }
            else {
                var result = [];
                for (var i = 0, len = obj.length; i < len; i++) {
                    if (cb.call(context, obj[i], i, obj)) {
                        result.push(obj[i]);
                    }
                }
                return result;
            }
        }

        function bind(func, context) {
            
            return function () {
                func.apply(context, arguments);
            }
        }

        return {
            inherits: inherits,
            clone: clone,
            merge: merge,
            getContext: getContext,
            indexOf: indexOf,
            each: each,
            map: map,
            filter: filter,
            bind: bind
        };
    }
);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3Rvb2wvdXRpbC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBtb2R1bGUgenJlbmRlci90b29sL3V0aWxcbiAqIEBhdXRob3IgS2VuZXIgKEBLZW5lci3mnpfls7AsIGtlbmVyLmxpbmZlbmdAZ21haWwuY29tKVxuICogICAgICAgICBZaSBTaGVuKGh0dHBzOi8vZ2l0aHViLmNvbS9waXNzYW5nKVxuICovXG5kZWZpbmUoXG4gICAgZnVuY3Rpb24ocmVxdWlyZSkge1xuXG4gICAgICAgIHZhciBBcnJheVByb3RvID0gQXJyYXkucHJvdG90eXBlO1xuICAgICAgICB2YXIgbmF0aXZlRm9yRWFjaCA9IEFycmF5UHJvdG8uZm9yRWFjaDtcbiAgICAgICAgdmFyIG5hdGl2ZU1hcCA9IEFycmF5UHJvdG8ubWFwO1xuICAgICAgICB2YXIgbmF0aXZlRmlsdGVyID0gQXJyYXlQcm90by5maWx0ZXI7XG5cbiAgICAgICAgLy8g55So5LqO5aSE55CGbWVyZ2Xml7bml6Dms5XpgY3ljoZEYXRl562J5a+56LGh55qE6Zeu6aKYXG4gICAgICAgIHZhciBCVUlMVElOX09CSkVDVCA9IHtcbiAgICAgICAgICAgICdbb2JqZWN0IEZ1bmN0aW9uXSc6IDEsXG4gICAgICAgICAgICAnW29iamVjdCBSZWdFeHBdJzogMSxcbiAgICAgICAgICAgICdbb2JqZWN0IERhdGVdJzogMSxcbiAgICAgICAgICAgICdbb2JqZWN0IEVycm9yXSc6IDEsXG4gICAgICAgICAgICAnW29iamVjdCBDYW52YXNHcmFkaWVudF0nOiAxXG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIG9ialRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcblxuICAgICAgICBmdW5jdGlvbiBpc0RvbShvYmopIHtcbiAgICAgICAgICAgIHJldHVybiBvYmogJiYgb2JqLm5vZGVUeXBlID09PSAxXG4gICAgICAgICAgICAgICAgICAgJiYgdHlwZW9mKG9iai5ub2RlTmFtZSkgPT0gJ3N0cmluZyc7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICog5a+55LiA5Liqb2JqZWN06L+b6KGM5rex5bqm5ou36LSdXG4gICAgICAgICAqIEBtZW1iZXJPZiBtb2R1bGU6enJlbmRlci90b29sL3V0aWxcbiAgICAgICAgICogQHBhcmFtIHsqfSBzb3VyY2Ug6ZyA6KaB6L+b6KGM5ou36LSd55qE5a+56LGhXG4gICAgICAgICAqIEByZXR1cm4geyp9IOaLt+i0neWQjueahOaWsOWvueixoVxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gY2xvbmUoc291cmNlKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHNvdXJjZSA9PSAnb2JqZWN0JyAmJiBzb3VyY2UgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gc291cmNlO1xuICAgICAgICAgICAgICAgIGlmIChzb3VyY2UgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHNvdXJjZS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2ldID0gY2xvbmUoc291cmNlW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChcbiAgICAgICAgICAgICAgICAgICAgIUJVSUxUSU5fT0JKRUNUW29ialRvU3RyaW5nLmNhbGwoc291cmNlKV1cbiAgICAgICAgICAgICAgICAgICAgLy8g5piv5ZCm5Li6IGRvbSDlr7nosaFcbiAgICAgICAgICAgICAgICAgICAgJiYgIWlzRG9tKHNvdXJjZSlcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0ge307XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzb3VyY2UuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtrZXldID0gY2xvbmUoc291cmNlW2tleV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHNvdXJjZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIG1lcmdlSXRlbSh0YXJnZXQsIHNvdXJjZSwga2V5LCBvdmVyd3JpdGUpIHtcbiAgICAgICAgICAgIGlmIChzb3VyY2UuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgIHZhciB0YXJnZXRQcm9wID0gdGFyZ2V0W2tleV07XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0YXJnZXRQcm9wID09ICdvYmplY3QnXG4gICAgICAgICAgICAgICAgICAgICYmICFCVUlMVElOX09CSkVDVFtvYmpUb1N0cmluZy5jYWxsKHRhcmdldFByb3ApXVxuICAgICAgICAgICAgICAgICAgICAvLyDmmK/lkKbkuLogZG9tIOWvueixoVxuICAgICAgICAgICAgICAgICAgICAmJiAhaXNEb20odGFyZ2V0UHJvcClcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5aaC5p6c6ZyA6KaB6YCS5b2S6KaG55uW77yM5bCx6YCS5b2S6LCD55SobWVyZ2VcbiAgICAgICAgICAgICAgICAgICAgbWVyZ2UoXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRba2V5XSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZVtrZXldLFxuICAgICAgICAgICAgICAgICAgICAgICAgb3ZlcndyaXRlXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKG92ZXJ3cml0ZSB8fCAhKGtleSBpbiB0YXJnZXQpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOWQpuWImeWPquWkhOeQhm92ZXJ3cml0ZeS4unRydWXvvIzmiJbogIXlnKjnm67moIflr7nosaHkuK3msqHmnInmraTlsZ7mgKfnmoTmg4XlhrVcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICog5ZCI5bm25rqQ5a+56LGh55qE5bGe5oCn5Yiw55uu5qCH5a+56LGhXG4gICAgICAgICAqIEBtZW1iZXJPZiBtb2R1bGU6enJlbmRlci90b29sL3V0aWxcbiAgICAgICAgICogQHBhcmFtIHsqfSB0YXJnZXQg55uu5qCH5a+56LGhXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gc291cmNlIOa6kOWvueixoVxuICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IG92ZXJ3cml0ZSDmmK/lkKbopobnm5ZcbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIG1lcmdlKHRhcmdldCwgc291cmNlLCBvdmVyd3JpdGUpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgaW4gc291cmNlKSB7XG4gICAgICAgICAgICAgICAgbWVyZ2VJdGVtKHRhcmdldCwgc291cmNlLCBpLCBvdmVyd3JpdGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIF9jdHg7XG5cbiAgICAgICAgZnVuY3Rpb24gZ2V0Q29udGV4dCgpIHtcbiAgICAgICAgICAgIGlmICghX2N0eCkge1xuICAgICAgICAgICAgICAgIHJlcXVpcmUoJy4uL2RlcC9leGNhbnZhcycpO1xuICAgICAgICAgICAgICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cbiAgICAgICAgICAgICAgICBpZiAod2luZG93WydHX3ZtbENhbnZhc01hbmFnZXInXSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgX2RpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgICAgICAgICBfZGl2LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICAgICAgICAgICAgICAgICAgX2Rpdi5zdHlsZS50b3AgPSAnLTEwMDBweCc7XG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoX2Rpdik7XG5cbiAgICAgICAgICAgICAgICAgICAgX2N0eCA9IEdfdm1sQ2FudmFzTWFuYWdlci5pbml0RWxlbWVudChfZGl2KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgX2N0eCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gX2N0eDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAbWVtYmVyT2YgbW9kdWxlOnpyZW5kZXIvdG9vbC91dGlsXG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXl9IGFycmF5XG4gICAgICAgICAqIEBwYXJhbSB7Kn0gdmFsdWVcbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIGluZGV4T2YoYXJyYXksIHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAoYXJyYXkuaW5kZXhPZikge1xuICAgICAgICAgICAgICAgIHJldHVybiBhcnJheS5pbmRleE9mKHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBhcnJheS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChhcnJheVtpXSA9PT0gdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOaehOmAoOexu+e7p+aJv+WFs+ezu1xuICAgICAgICAgKiBAbWVtYmVyT2YgbW9kdWxlOnpyZW5kZXIvdG9vbC91dGlsXG4gICAgICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNsYXp6IOa6kOexu1xuICAgICAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBiYXNlQ2xhenog5Z+657G7XG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBpbmhlcml0cyhjbGF6eiwgYmFzZUNsYXp6KSB7XG4gICAgICAgICAgICB2YXIgY2xhenpQcm90b3R5cGUgPSBjbGF6ei5wcm90b3R5cGU7XG4gICAgICAgICAgICBmdW5jdGlvbiBGKCkge31cbiAgICAgICAgICAgIEYucHJvdG90eXBlID0gYmFzZUNsYXp6LnByb3RvdHlwZTtcbiAgICAgICAgICAgIGNsYXp6LnByb3RvdHlwZSA9IG5ldyBGKCk7XG5cbiAgICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gY2xhenpQcm90b3R5cGUpIHtcbiAgICAgICAgICAgICAgICBjbGF6ei5wcm90b3R5cGVbcHJvcF0gPSBjbGF6elByb3RvdHlwZVtwcm9wXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNsYXp6LmNvbnN0cnVjdG9yID0gY2xheno7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICog5pWw57uE5oiW5a+56LGh6YGN5Y6GXG4gICAgICAgICAqIEBtZW1iZXJPZiBtb2R1bGU6enJlbmRlci90b29sL3V0aWxcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R8QXJyYXl9IG9ialxuICAgICAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYlxuICAgICAgICAgKiBAcGFyYW0geyp9IFtjb250ZXh0XVxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gZWFjaChvYmosIGNiLCBjb250ZXh0KSB7XG4gICAgICAgICAgICBpZiAoIShvYmogJiYgY2IpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG9iai5mb3JFYWNoICYmIG9iai5mb3JFYWNoID09PSBuYXRpdmVGb3JFYWNoKSB7XG4gICAgICAgICAgICAgICAgb2JqLmZvckVhY2goY2IsIGNvbnRleHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAob2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gb2JqLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNiLmNhbGwoY29udGV4dCwgb2JqW2ldLCBpLCBvYmopO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYi5jYWxsKGNvbnRleHQsIG9ialtrZXldLCBrZXksIG9iaik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICog5pWw57uE5pig5bCEXG4gICAgICAgICAqIEBtZW1iZXJPZiBtb2R1bGU6enJlbmRlci90b29sL3V0aWxcbiAgICAgICAgICogQHBhcmFtIHtBcnJheX0gb2JqXG4gICAgICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNiXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW2NvbnRleHRdXG4gICAgICAgICAqIEByZXR1cm4ge0FycmF5fVxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gbWFwKG9iaiwgY2IsIGNvbnRleHQpIHtcbiAgICAgICAgICAgIGlmICghKG9iaiAmJiBjYikpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAob2JqLm1hcCAmJiBvYmoubWFwID09PSBuYXRpdmVNYXApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb2JqLm1hcChjYiwgY29udGV4dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IG9iai5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChjYi5jYWxsKGNvbnRleHQsIG9ialtpXSwgaSwgb2JqKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICog5pWw57uE6L+H5rukXG4gICAgICAgICAqIEBtZW1iZXJPZiBtb2R1bGU6enJlbmRlci90b29sL3V0aWxcbiAgICAgICAgICogQHBhcmFtIHtBcnJheX0gb2JqXG4gICAgICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNiXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW2NvbnRleHRdXG4gICAgICAgICAqIEByZXR1cm4ge0FycmF5fVxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gZmlsdGVyKG9iaiwgY2IsIGNvbnRleHQpIHtcbiAgICAgICAgICAgIGlmICghKG9iaiAmJiBjYikpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAob2JqLmZpbHRlciAmJiBvYmouZmlsdGVyID09PSBuYXRpdmVGaWx0ZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb2JqLmZpbHRlcihjYiwgY29udGV4dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IG9iai5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2IuY2FsbChjb250ZXh0LCBvYmpbaV0sIGksIG9iaikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKG9ialtpXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGJpbmQoZnVuYywgY29udGV4dCkge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBpbmhlcml0czogaW5oZXJpdHMsXG4gICAgICAgICAgICBjbG9uZTogY2xvbmUsXG4gICAgICAgICAgICBtZXJnZTogbWVyZ2UsXG4gICAgICAgICAgICBnZXRDb250ZXh0OiBnZXRDb250ZXh0LFxuICAgICAgICAgICAgaW5kZXhPZjogaW5kZXhPZixcbiAgICAgICAgICAgIGVhY2g6IGVhY2gsXG4gICAgICAgICAgICBtYXA6IG1hcCxcbiAgICAgICAgICAgIGZpbHRlcjogZmlsdGVyLFxuICAgICAgICAgICAgYmluZDogYmluZFxuICAgICAgICB9O1xuICAgIH1cbik7XG4iXSwiZmlsZSI6InBsdWdpbnMvenJlbmRlci0yLjEuMC9zcmMvdG9vbC91dGlsLmpzIn0=
