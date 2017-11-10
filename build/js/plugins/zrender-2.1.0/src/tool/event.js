/**
 * 事件辅助类
 * @module zrender/tool/event
 * @author Kener (@Kener-林峰, kener.linfeng@gmail.com)
 */
define(
    function(require) {

        'use strict';

        var Eventful = require('../mixin/Eventful');

        /**
        * 提取鼠标（手指）x坐标
        * @memberOf module:zrender/tool/event
        * @param  {Event} e 事件.
        * @return {number} 鼠标（手指）x坐标.
        */
        function getX(e) {
            return typeof e.zrenderX != 'undefined' && e.zrenderX
                   || typeof e.offsetX != 'undefined' && e.offsetX
                   || typeof e.layerX != 'undefined' && e.layerX
                   || typeof e.clientX != 'undefined' && e.clientX;
        }

        /**
        * 提取鼠标y坐标
        * @memberOf module:zrender/tool/event
        * @param  {Event} e 事件.
        * @return {number} 鼠标（手指）y坐标.
        */
        function getY(e) {
            return typeof e.zrenderY != 'undefined' && e.zrenderY
                   || typeof e.offsetY != 'undefined' && e.offsetY
                   || typeof e.layerY != 'undefined' && e.layerY
                   || typeof e.clientY != 'undefined' && e.clientY;
        }

        /**
        * 提取鼠标滚轮变化
        * @memberOf module:zrender/tool/event
        * @param  {Event} e 事件.
        * @return {number} 滚轮变化，正值说明滚轮是向上滚动，如果是负值说明滚轮是向下滚动
        */
        function getDelta(e) {
            return typeof e.zrenderDelta != 'undefined' && e.zrenderDelta
                   || typeof e.wheelDelta != 'undefined' && e.wheelDelta
                   || typeof e.detail != 'undefined' && -e.detail;
        }

        /**
         * 停止冒泡和阻止默认行为
         * @memberOf module:zrender/tool/event
         * @method
         * @param {Event} e : event对象
         */
        var stop = typeof window.addEventListener === 'function'
            ? function (e) {
                e.preventDefault();
                e.stopPropagation();
                e.cancelBubble = true;
            }
            : function (e) {
                e.returnValue = false;
                e.cancelBubble = true;
            };
        
        return {
            getX : getX,
            getY : getY,
            getDelta : getDelta,
            stop : stop,
            // 做向上兼容
            Dispatcher : Eventful
        };
    }
);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3Rvb2wvZXZlbnQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiDkuovku7bovoXliqnnsbtcbiAqIEBtb2R1bGUgenJlbmRlci90b29sL2V2ZW50XG4gKiBAYXV0aG9yIEtlbmVyIChAS2VuZXIt5p6X5bOwLCBrZW5lci5saW5mZW5nQGdtYWlsLmNvbSlcbiAqL1xuZGVmaW5lKFxuICAgIGZ1bmN0aW9uKHJlcXVpcmUpIHtcblxuICAgICAgICAndXNlIHN0cmljdCc7XG5cbiAgICAgICAgdmFyIEV2ZW50ZnVsID0gcmVxdWlyZSgnLi4vbWl4aW4vRXZlbnRmdWwnKTtcblxuICAgICAgICAvKipcbiAgICAgICAgKiDmj5Dlj5bpvKDmoIfvvIjmiYvmjIfvvIl45Z2Q5qCHXG4gICAgICAgICogQG1lbWJlck9mIG1vZHVsZTp6cmVuZGVyL3Rvb2wvZXZlbnRcbiAgICAgICAgKiBAcGFyYW0gIHtFdmVudH0gZSDkuovku7YuXG4gICAgICAgICogQHJldHVybiB7bnVtYmVyfSDpvKDmoIfvvIjmiYvmjIfvvIl45Z2Q5qCHLlxuICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBnZXRYKGUpIHtcbiAgICAgICAgICAgIHJldHVybiB0eXBlb2YgZS56cmVuZGVyWCAhPSAndW5kZWZpbmVkJyAmJiBlLnpyZW5kZXJYXG4gICAgICAgICAgICAgICAgICAgfHwgdHlwZW9mIGUub2Zmc2V0WCAhPSAndW5kZWZpbmVkJyAmJiBlLm9mZnNldFhcbiAgICAgICAgICAgICAgICAgICB8fCB0eXBlb2YgZS5sYXllclggIT0gJ3VuZGVmaW5lZCcgJiYgZS5sYXllclhcbiAgICAgICAgICAgICAgICAgICB8fCB0eXBlb2YgZS5jbGllbnRYICE9ICd1bmRlZmluZWQnICYmIGUuY2xpZW50WDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIOaPkOWPlum8oOagh3nlnZDmoIdcbiAgICAgICAgKiBAbWVtYmVyT2YgbW9kdWxlOnpyZW5kZXIvdG9vbC9ldmVudFxuICAgICAgICAqIEBwYXJhbSAge0V2ZW50fSBlIOS6i+S7ti5cbiAgICAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IOm8oOagh++8iOaJi+aMh++8iXnlnZDmoIcuXG4gICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIGdldFkoZSkge1xuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiBlLnpyZW5kZXJZICE9ICd1bmRlZmluZWQnICYmIGUuenJlbmRlcllcbiAgICAgICAgICAgICAgICAgICB8fCB0eXBlb2YgZS5vZmZzZXRZICE9ICd1bmRlZmluZWQnICYmIGUub2Zmc2V0WVxuICAgICAgICAgICAgICAgICAgIHx8IHR5cGVvZiBlLmxheWVyWSAhPSAndW5kZWZpbmVkJyAmJiBlLmxheWVyWVxuICAgICAgICAgICAgICAgICAgIHx8IHR5cGVvZiBlLmNsaWVudFkgIT0gJ3VuZGVmaW5lZCcgJiYgZS5jbGllbnRZO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICog5o+Q5Y+W6byg5qCH5rua6L2u5Y+Y5YyWXG4gICAgICAgICogQG1lbWJlck9mIG1vZHVsZTp6cmVuZGVyL3Rvb2wvZXZlbnRcbiAgICAgICAgKiBAcGFyYW0gIHtFdmVudH0gZSDkuovku7YuXG4gICAgICAgICogQHJldHVybiB7bnVtYmVyfSDmu5rova7lj5jljJbvvIzmraPlgLzor7TmmI7mu5rova7mmK/lkJHkuIrmu5rliqjvvIzlpoLmnpzmmK/otJ/lgLzor7TmmI7mu5rova7mmK/lkJHkuIvmu5rliqhcbiAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gZ2V0RGVsdGEoZSkge1xuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiBlLnpyZW5kZXJEZWx0YSAhPSAndW5kZWZpbmVkJyAmJiBlLnpyZW5kZXJEZWx0YVxuICAgICAgICAgICAgICAgICAgIHx8IHR5cGVvZiBlLndoZWVsRGVsdGEgIT0gJ3VuZGVmaW5lZCcgJiYgZS53aGVlbERlbHRhXG4gICAgICAgICAgICAgICAgICAgfHwgdHlwZW9mIGUuZGV0YWlsICE9ICd1bmRlZmluZWQnICYmIC1lLmRldGFpbDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDlgZzmraLlhpLms6HlkozpmLvmraLpu5jorqTooYzkuLpcbiAgICAgICAgICogQG1lbWJlck9mIG1vZHVsZTp6cmVuZGVyL3Rvb2wvZXZlbnRcbiAgICAgICAgICogQG1ldGhvZFxuICAgICAgICAgKiBAcGFyYW0ge0V2ZW50fSBlIDogZXZlbnTlr7nosaFcbiAgICAgICAgICovXG4gICAgICAgIHZhciBzdG9wID0gdHlwZW9mIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyID09PSAnZnVuY3Rpb24nXG4gICAgICAgICAgICA/IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgZS5jYW5jZWxCdWJibGUgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIGUucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBlLmNhbmNlbEJ1YmJsZSA9IHRydWU7XG4gICAgICAgICAgICB9O1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGdldFggOiBnZXRYLFxuICAgICAgICAgICAgZ2V0WSA6IGdldFksXG4gICAgICAgICAgICBnZXREZWx0YSA6IGdldERlbHRhLFxuICAgICAgICAgICAgc3RvcCA6IHN0b3AsXG4gICAgICAgICAgICAvLyDlgZrlkJHkuIrlhbzlrrlcbiAgICAgICAgICAgIERpc3BhdGNoZXIgOiBFdmVudGZ1bFxuICAgICAgICB9O1xuICAgIH1cbik7XG4iXSwiZmlsZSI6InBsdWdpbnMvenJlbmRlci0yLjEuMC9zcmMvdG9vbC9ldmVudC5qcyJ9
