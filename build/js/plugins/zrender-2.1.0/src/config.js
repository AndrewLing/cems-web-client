define(function () {
    /**
     * config默认配置项
     * @exports zrender/config
     * @author Kener (@Kener-林峰, kener.linfeng@gmail.com)
     */
    var config = {
        /**
         * @namespace module:zrender/config.EVENT
         */
        EVENT : {
            /**
             * 窗口大小变化
             * @type {string}
             */
            RESIZE : 'resize',
            /**
             * 鼠标按钮被（手指）按下，事件对象是：目标图形元素或空
             * @type {string}
             */
            CLICK : 'click',
            /**
             * 双击事件
             * @type {string}
             */
            DBLCLICK : 'dblclick',
            /**
             * 鼠标滚轮变化，事件对象是：目标图形元素或空
             * @type {string}
             */
            MOUSEWHEEL : 'mousewheel',
            /**
             * 鼠标（手指）被移动，事件对象是：目标图形元素或空
             * @type {string}
             */
            MOUSEMOVE : 'mousemove',
            /**
             * 鼠标移到某图形元素之上，事件对象是：目标图形元素
             * @type {string}
             */
            MOUSEOVER : 'mouseover',
            /**
             * 鼠标从某图形元素移开，事件对象是：目标图形元素
             * @type {string}
             */
            MOUSEOUT : 'mouseout',
            /**
             * 鼠标按钮（手指）被按下，事件对象是：目标图形元素或空
             * @type {string}
             */
            MOUSEDOWN : 'mousedown',
            /**
             * 鼠标按键（手指）被松开，事件对象是：目标图形元素或空
             * @type {string}
             */
            MOUSEUP : 'mouseup',
            /**
             * 全局离开，MOUSEOUT触发比较频繁，一次离开优化绑定
             * @type {string}
             */
            GLOBALOUT : 'globalout',    // 

            // 一次成功元素拖拽的行为事件过程是：
            // dragstart > dragenter > dragover [> dragleave] > drop > dragend
            /**
             * 开始拖拽时触发，事件对象是：被拖拽图形元素
             * @type {string}
             */
            DRAGSTART : 'dragstart',
            /**
             * 拖拽完毕时触发（在drop之后触发），事件对象是：被拖拽图形元素
             * @type {string}
             */
            DRAGEND : 'dragend',
            /**
             * 拖拽图形元素进入目标图形元素时触发，事件对象是：目标图形元素
             * @type {string}
             */
            DRAGENTER : 'dragenter',
            /**
             * 拖拽图形元素在目标图形元素上移动时触发，事件对象是：目标图形元素
             * @type {string}
             */
            DRAGOVER : 'dragover',
            /**
             * 拖拽图形元素离开目标图形元素时触发，事件对象是：目标图形元素
             * @type {string}
             */
            DRAGLEAVE : 'dragleave',
            /**
             * 拖拽图形元素放在目标图形元素内时触发，事件对象是：目标图形元素
             * @type {string}
             */
            DROP : 'drop',
            /**
             * touch end - start < delay is click
             * @type {number}
             */
            touchClickDelay : 300
        },

        elementClassName: 'zr-element',

        // 是否异常捕获
        catchBrushException: false,

        /**
         * debug日志选项：catchBrushException为true下有效
         * 0 : 不生成debug数据，发布用
         * 1 : 异常抛出，调试用
         * 2 : 控制台输出，调试用
         */
        debugMode: 0,

        // retina 屏幕优化
        devicePixelRatio: Math.max(window.devicePixelRatio || 1, 1)
    };
    return config;
});


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL2NvbmZpZy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJkZWZpbmUoZnVuY3Rpb24gKCkge1xuICAgIC8qKlxuICAgICAqIGNvbmZpZ+m7mOiupOmFjee9rumhuVxuICAgICAqIEBleHBvcnRzIHpyZW5kZXIvY29uZmlnXG4gICAgICogQGF1dGhvciBLZW5lciAoQEtlbmVyLeael+WzsCwga2VuZXIubGluZmVuZ0BnbWFpbC5jb20pXG4gICAgICovXG4gICAgdmFyIGNvbmZpZyA9IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBuYW1lc3BhY2UgbW9kdWxlOnpyZW5kZXIvY29uZmlnLkVWRU5UXG4gICAgICAgICAqL1xuICAgICAgICBFVkVOVCA6IHtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog56qX5Y+j5aSn5bCP5Y+Y5YyWXG4gICAgICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBSRVNJWkUgOiAncmVzaXplJyxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog6byg5qCH5oyJ6ZKu6KKr77yI5omL5oyH77yJ5oyJ5LiL77yM5LqL5Lu25a+56LGh5piv77ya55uu5qCH5Zu+5b2i5YWD57Sg5oiW56m6XG4gICAgICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBDTElDSyA6ICdjbGljaycsXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOWPjOWHu+S6i+S7tlxuICAgICAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgREJMQ0xJQ0sgOiAnZGJsY2xpY2snLFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDpvKDmoIfmu5rova7lj5jljJbvvIzkuovku7blr7nosaHmmK/vvJrnm67moIflm77lvaLlhYPntKDmiJbnqbpcbiAgICAgICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIE1PVVNFV0hFRUwgOiAnbW91c2V3aGVlbCcsXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOm8oOagh++8iOaJi+aMh++8ieiiq+enu+WKqO+8jOS6i+S7tuWvueixoeaYr++8muebruagh+WbvuW9ouWFg+e0oOaIluepulxuICAgICAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgTU9VU0VNT1ZFIDogJ21vdXNlbW92ZScsXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOm8oOagh+enu+WIsOafkOWbvuW9ouWFg+e0oOS5i+S4iu+8jOS6i+S7tuWvueixoeaYr++8muebruagh+WbvuW9ouWFg+e0oFxuICAgICAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgTU9VU0VPVkVSIDogJ21vdXNlb3ZlcicsXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOm8oOagh+S7juafkOWbvuW9ouWFg+e0oOenu+W8gO+8jOS6i+S7tuWvueixoeaYr++8muebruagh+WbvuW9ouWFg+e0oFxuICAgICAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgTU9VU0VPVVQgOiAnbW91c2VvdXQnLFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDpvKDmoIfmjInpkq7vvIjmiYvmjIfvvInooqvmjInkuIvvvIzkuovku7blr7nosaHmmK/vvJrnm67moIflm77lvaLlhYPntKDmiJbnqbpcbiAgICAgICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIE1PVVNFRE9XTiA6ICdtb3VzZWRvd24nLFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDpvKDmoIfmjInplK7vvIjmiYvmjIfvvInooqvmnb7lvIDvvIzkuovku7blr7nosaHmmK/vvJrnm67moIflm77lvaLlhYPntKDmiJbnqbpcbiAgICAgICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIE1PVVNFVVAgOiAnbW91c2V1cCcsXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOWFqOWxgOemu+W8gO+8jE1PVVNFT1VU6Kem5Y+R5q+U6L6D6aKR57mB77yM5LiA5qyh56a75byA5LyY5YyW57uR5a6aXG4gICAgICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBHTE9CQUxPVVQgOiAnZ2xvYmFsb3V0JywgICAgLy8gXG5cbiAgICAgICAgICAgIC8vIOS4gOasoeaIkOWKn+WFg+e0oOaLluaLveeahOihjOS4uuS6i+S7tui/h+eoi+aYr++8mlxuICAgICAgICAgICAgLy8gZHJhZ3N0YXJ0ID4gZHJhZ2VudGVyID4gZHJhZ292ZXIgWz4gZHJhZ2xlYXZlXSA+IGRyb3AgPiBkcmFnZW5kXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOW8gOWni+aLluaLveaXtuinpuWPke+8jOS6i+S7tuWvueixoeaYr++8muiiq+aLluaLveWbvuW9ouWFg+e0oFxuICAgICAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgRFJBR1NUQVJUIDogJ2RyYWdzdGFydCcsXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOaLluaLveWujOavleaXtuinpuWPke+8iOWcqGRyb3DkuYvlkI7op6blj5HvvInvvIzkuovku7blr7nosaHmmK/vvJrooqvmi5bmi73lm77lvaLlhYPntKBcbiAgICAgICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIERSQUdFTkQgOiAnZHJhZ2VuZCcsXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOaLluaLveWbvuW9ouWFg+e0oOi/m+WFpeebruagh+WbvuW9ouWFg+e0oOaXtuinpuWPke+8jOS6i+S7tuWvueixoeaYr++8muebruagh+WbvuW9ouWFg+e0oFxuICAgICAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgRFJBR0VOVEVSIDogJ2RyYWdlbnRlcicsXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOaLluaLveWbvuW9ouWFg+e0oOWcqOebruagh+WbvuW9ouWFg+e0oOS4iuenu+WKqOaXtuinpuWPke+8jOS6i+S7tuWvueixoeaYr++8muebruagh+WbvuW9ouWFg+e0oFxuICAgICAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgRFJBR09WRVIgOiAnZHJhZ292ZXInLFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDmi5bmi73lm77lvaLlhYPntKDnprvlvIDnm67moIflm77lvaLlhYPntKDml7bop6blj5HvvIzkuovku7blr7nosaHmmK/vvJrnm67moIflm77lvaLlhYPntKBcbiAgICAgICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIERSQUdMRUFWRSA6ICdkcmFnbGVhdmUnLFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDmi5bmi73lm77lvaLlhYPntKDmlL7lnKjnm67moIflm77lvaLlhYPntKDlhoXml7bop6blj5HvvIzkuovku7blr7nosaHmmK/vvJrnm67moIflm77lvaLlhYPntKBcbiAgICAgICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIERST1AgOiAnZHJvcCcsXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIHRvdWNoIGVuZCAtIHN0YXJ0IDwgZGVsYXkgaXMgY2xpY2tcbiAgICAgICAgICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRvdWNoQ2xpY2tEZWxheSA6IDMwMFxuICAgICAgICB9LFxuXG4gICAgICAgIGVsZW1lbnRDbGFzc05hbWU6ICd6ci1lbGVtZW50JyxcblxuICAgICAgICAvLyDmmK/lkKblvILluLjmjZXojrdcbiAgICAgICAgY2F0Y2hCcnVzaEV4Y2VwdGlvbjogZmFsc2UsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIGRlYnVn5pel5b+X6YCJ6aG577yaY2F0Y2hCcnVzaEV4Y2VwdGlvbuS4unRydWXkuIvmnInmlYhcbiAgICAgICAgICogMCA6IOS4jeeUn+aIkGRlYnVn5pWw5o2u77yM5Y+R5biD55SoXG4gICAgICAgICAqIDEgOiDlvILluLjmipvlh7rvvIzosIPor5XnlKhcbiAgICAgICAgICogMiA6IOaOp+WItuWPsOi+k+WHuu+8jOiwg+ivleeUqFxuICAgICAgICAgKi9cbiAgICAgICAgZGVidWdNb2RlOiAwLFxuXG4gICAgICAgIC8vIHJldGluYSDlsY/luZXkvJjljJZcbiAgICAgICAgZGV2aWNlUGl4ZWxSYXRpbzogTWF0aC5tYXgod2luZG93LmRldmljZVBpeGVsUmF0aW8gfHwgMSwgMSlcbiAgICB9O1xuICAgIHJldHVybiBjb25maWc7XG59KTtcblxuIl0sImZpbGUiOiJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL2NvbmZpZy5qcyJ9
