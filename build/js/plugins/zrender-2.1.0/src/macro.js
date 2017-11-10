/**
 * @file 宏函数
 * @author hushicai(bluthcy@gmail.com)
 */

(function (global) {
    /**
     * 默认的环境配置
     *
     * @type {Object}
     */
    var DefaultEnv = {};

    /**
     * 环境配置
     *
     * @type {Object}
     */
    var env = DefaultEnv;


    /**
     * 多级属性访问
     *
     * @inner
     * @param {Object} obj 对象
     * @param {string} key 键
     * @return {Object|number} 值
     */
    function accessByDot(obj, key) {
        key = (key || '').split('.');
        while (obj && key.length) {
            obj = obj[key.shift()];
        }
        return obj;
    }

    var macro = {
        /**
         * 更新环境配置
         *
         * @public
         * @param {Object} cfg 环境配置
         */
        setEnv: function (cfg) {
            if (cfg) {
                env = cfg;
            }
        },
        //  ------------------ 宏函数 ---------------------
        isDefined: function (key) {
            return !!accessByDot(env, key);
        },
        isNotDefined: function (key) {
            return !accessByDot(env, key);
        },
        isEqual: function (key, value) {
            return accessByDot(env, key) === value;
        },
        isNotEqual: function (key, value) {
            return accessByDot(env, key) !== value;
        }
    };

    if (typeof exports === 'object' && typeof module === 'object') {
        exports = module.exports = macro;
    }
    else if (typeof define === 'function' && define.amd) {
        define(macro);
    }
})(this);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL21hY3JvLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGZpbGUg5a6P5Ye95pWwXG4gKiBAYXV0aG9yIGh1c2hpY2FpKGJsdXRoY3lAZ21haWwuY29tKVxuICovXG5cbihmdW5jdGlvbiAoZ2xvYmFsKSB7XG4gICAgLyoqXG4gICAgICog6buY6K6k55qE546v5aKD6YWN572uXG4gICAgICpcbiAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAqL1xuICAgIHZhciBEZWZhdWx0RW52ID0ge307XG5cbiAgICAvKipcbiAgICAgKiDnjq/looPphY3nva5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICovXG4gICAgdmFyIGVudiA9IERlZmF1bHRFbnY7XG5cblxuICAgIC8qKlxuICAgICAqIOWkmue6p+WxnuaAp+iuv+mXrlxuICAgICAqXG4gICAgICogQGlubmVyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iaiDlr7nosaFcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IOmUrlxuICAgICAqIEByZXR1cm4ge09iamVjdHxudW1iZXJ9IOWAvFxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGFjY2Vzc0J5RG90KG9iaiwga2V5KSB7XG4gICAgICAgIGtleSA9IChrZXkgfHwgJycpLnNwbGl0KCcuJyk7XG4gICAgICAgIHdoaWxlIChvYmogJiYga2V5Lmxlbmd0aCkge1xuICAgICAgICAgICAgb2JqID0gb2JqW2tleS5zaGlmdCgpXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb2JqO1xuICAgIH1cblxuICAgIHZhciBtYWNybyA9IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIOabtOaWsOeOr+Wig+mFjee9rlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcHVibGljXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjZmcg546v5aKD6YWN572uXG4gICAgICAgICAqL1xuICAgICAgICBzZXRFbnY6IGZ1bmN0aW9uIChjZmcpIHtcbiAgICAgICAgICAgIGlmIChjZmcpIHtcbiAgICAgICAgICAgICAgICBlbnYgPSBjZmc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIC8vICAtLS0tLS0tLS0tLS0tLS0tLS0g5a6P5Ye95pWwIC0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICBpc0RlZmluZWQ6IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiAhIWFjY2Vzc0J5RG90KGVudiwga2V5KTtcbiAgICAgICAgfSxcbiAgICAgICAgaXNOb3REZWZpbmVkOiBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gIWFjY2Vzc0J5RG90KGVudiwga2V5KTtcbiAgICAgICAgfSxcbiAgICAgICAgaXNFcXVhbDogZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiBhY2Nlc3NCeURvdChlbnYsIGtleSkgPT09IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBpc05vdEVxdWFsOiBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIGFjY2Vzc0J5RG90KGVudiwga2V5KSAhPT0gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0Jykge1xuICAgICAgICBleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBtYWNybztcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZShtYWNybyk7XG4gICAgfVxufSkodGhpcyk7XG4iXSwiZmlsZSI6InBsdWdpbnMvenJlbmRlci0yLjEuMC9zcmMvbWFjcm8uanMifQ==
