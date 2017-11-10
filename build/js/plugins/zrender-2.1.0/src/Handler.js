/**
 * Handler控制模块
 * @module zrender/Handler
 * @author Kener (@Kener-林峰, kener.linfeng@gmail.com)
 *         errorrik (errorrik@gmail.com)
 *
 */
// TODO mouseover 只触发一次
// 目前的高亮因为每次都需要 addHover 所以不能只是开始的时候触发一次
define(
    function (require) {

        'use strict';

        var config = require('./config');
        var env = require('./tool/env');
        var eventTool = require('./tool/event');
        var util = require('./tool/util');
        var vec2 = require('./tool/vector');
        var mat2d = require('./tool/matrix');
        var EVENT = config.EVENT;

        var Eventful = require('./mixin/Eventful');

        var domHandlerNames = [
            'resize', 'click', 'dblclick',
            'mousewheel', 'mousemove', 'mouseout', 'mouseup', 'mousedown',
            'touchstart', 'touchend', 'touchmove'
        ];

        var isZRenderElement = function (event) {
            // 暂时忽略 IE8-
            if (window.G_vmlCanvasManager) {
                return true;
            }

            event = event || window.event;
            // 进入对象优先~
            var target = event.toElement
                          || event.relatedTarget
                          || event.srcElement
                          || event.target;

            return target && target.className.match(config.elementClassName)
        };

        var domHandlers = {
            /**
             * 窗口大小改变响应函数
             * @inner
             * @param {Event} event
             */
            resize: function (event) {
                event = event || window.event;
                this._lastHover = null;
                this._isMouseDown = 0;
                
                // 分发config.EVENT.RESIZE事件，global
                this.dispatch(EVENT.RESIZE, event);
            },

            /**
             * 点击响应函数
             * @inner
             * @param {Event} event
             */
            click: function (event) {
                if (! isZRenderElement(event)) {
                    return;
                }

                event = this._zrenderEventFixed(event);

                // 分发config.EVENT.CLICK事件
                var _lastHover = this._lastHover;
                if ((_lastHover && _lastHover.clickable)
                    || !_lastHover
                ) {

                    // 判断没有发生拖拽才触发click事件
                    if (this._clickThreshold < 5) {
                        this._dispatchAgency(_lastHover, EVENT.CLICK, event);
                    }
                }

                this._mousemoveHandler(event);
            },
            
            /**
             * 双击响应函数
             * @inner
             * @param {Event} event
             */
            dblclick: function (event) {
                if (! isZRenderElement(event)) {
                    return;
                }

                event = event || window.event;
                event = this._zrenderEventFixed(event);

                // 分发config.EVENT.DBLCLICK事件
                var _lastHover = this._lastHover;
                if ((_lastHover && _lastHover.clickable)
                    || !_lastHover
                ) {

                    // 判断没有发生拖拽才触发dblclick事件
                    if (this._clickThreshold < 5) {
                        this._dispatchAgency(_lastHover, EVENT.DBLCLICK, event);
                    }
                }

                this._mousemoveHandler(event);
            },
            

            /**
             * 鼠标滚轮响应函数
             * @inner
             * @param {Event} event
             */
            mousewheel: function (event) {
                if (! isZRenderElement(event)) {
                    return;
                }

                event = this._zrenderEventFixed(event);

                // http://www.sitepoint.com/html5-javascript-mouse-wheel/
                // https://developer.mozilla.org/en-US/docs/DOM/DOM_event_reference/mousewheel
                var delta = event.wheelDelta // Webkit
                            || -event.detail; // Firefox
                var scale = delta > 0 ? 1.1 : 1 / 1.1;

                var needsRefresh = false;

                var mouseX = this._mouseX;
                var mouseY = this._mouseY;
                this.painter.eachBuildinLayer(function (layer) {
                    var pos = layer.position;
                    if (layer.zoomable) {
                        layer.__zoom = layer.__zoom || 1;
                        var newZoom = layer.__zoom;
                        newZoom *= scale;
                        newZoom = Math.max(
                            Math.min(layer.maxZoom, newZoom),
                            layer.minZoom
                        );
                        scale = newZoom / layer.__zoom;
                        layer.__zoom = newZoom;
                        // Keep the mouse center when scaling
                        pos[0] -= (mouseX - pos[0]) * (scale - 1);
                        pos[1] -= (mouseY - pos[1]) * (scale - 1);
                        layer.scale[0] *= scale;
                        layer.scale[1] *= scale;
                        layer.dirty = true;
                        needsRefresh = true;

                        // Prevent browser default scroll action 
                        eventTool.stop(event);
                    }
                });
                if (needsRefresh) {
                    this.painter.refresh();
                }

                // 分发config.EVENT.MOUSEWHEEL事件
                this._dispatchAgency(this._lastHover, EVENT.MOUSEWHEEL, event);
                this._mousemoveHandler(event);
            },

            /**
             * 鼠标（手指）移动响应函数
             * @inner
             * @param {Event} event
             */
            mousemove: function (event) {
                if (! isZRenderElement(event)) {
                    return;
                }

                if (this.painter.isLoading()) {
                    return;
                }

                event = this._zrenderEventFixed(event);
                this._lastX = this._mouseX;
                this._lastY = this._mouseY;
                this._mouseX = eventTool.getX(event);
                this._mouseY = eventTool.getY(event);
                var dx = this._mouseX - this._lastX;
                var dy = this._mouseY - this._lastY;

                // 可能出现config.EVENT.DRAGSTART事件
                // 避免手抖点击误认为拖拽
                // if (this._mouseX - this._lastX > 1 || this._mouseY - this._lastY > 1) {
                this._processDragStart(event);
                // }
                this._hasfound = 0;
                this._event = event;

                this._iterateAndFindHover();

                // 找到的在迭代函数里做了处理，没找到得在迭代完后处理
                if (!this._hasfound) {
                    // 过滤首次拖拽产生的mouseout和dragLeave
                    if (!this._draggingTarget
                        || (this._lastHover && this._lastHover != this._draggingTarget)
                    ) {
                        // 可能出现config.EVENT.MOUSEOUT事件
                        this._processOutShape(event);

                        // 可能出现config.EVENT.DRAGLEAVE事件
                        this._processDragLeave(event);
                    }

                    this._lastHover = null;
                    this.storage.delHover();
                    this.painter.clearHover();
                }

                // set cursor for root element
                var cursor = 'default';

                // 如果存在拖拽中元素，被拖拽的图形元素最后addHover
                if (this._draggingTarget) {
                    this.storage.drift(this._draggingTarget.id, dx, dy);
                    this._draggingTarget.modSelf();
                    this.storage.addHover(this._draggingTarget);

                    // 拖拽不触发click事件
                    this._clickThreshold++;
                }
                else if (this._isMouseDown) {
                    var needsRefresh = false;
                    // Layer dragging
                    this.painter.eachBuildinLayer(function (layer) {
                        if (layer.panable) {
                            // PENDING
                            cursor = 'move';
                            // Keep the mouse center when scaling
                            layer.position[0] += dx;
                            layer.position[1] += dy;
                            needsRefresh = true;
                            layer.dirty = true;
                        }
                    });
                    if (needsRefresh) {
                        this.painter.refresh();
                    }
                }

                if (this._draggingTarget || (this._hasfound && this._lastHover.draggable)) {
                    cursor = 'move';
                }
                else if (this._hasfound && this._lastHover.clickable) {
                    cursor = 'pointer';
                }
                this.root.style.cursor = cursor;

                // 分发config.EVENT.MOUSEMOVE事件
                this._dispatchAgency(this._lastHover, EVENT.MOUSEMOVE, event);

                if (this._draggingTarget || this._hasfound || this.storage.hasHoverShape()) {
                    this.painter.refreshHover();
                }
            },

            /**
             * 鼠标（手指）离开响应函数
             * @inner
             * @param {Event} event
             */
            mouseout: function (event) {
                if (! isZRenderElement(event)) {
                    return;
                }

                event = this._zrenderEventFixed(event);

                var element = event.toElement || event.relatedTarget;
                if (element != this.root) {
                    while (element && element.nodeType != 9) {
                        // 忽略包含在root中的dom引起的mouseOut
                        if (element == this.root) {
                            this._mousemoveHandler(event);
                            return;
                        }

                        element = element.parentNode;
                    }
                }

                event.zrenderX = this._lastX;
                event.zrenderY = this._lastY;
                this.root.style.cursor = 'default';
                this._isMouseDown = 0;

                this._processOutShape(event);
                this._processDrop(event);
                this._processDragEnd(event);
                if (!this.painter.isLoading()) {
                    this.painter.refreshHover();
                }
                
                this.dispatch(EVENT.GLOBALOUT, event);
            },

            /**
             * 鼠标（手指）按下响应函数
             * @inner
             * @param {Event} event
             */
            mousedown: function (event) {
                if (! isZRenderElement(event)) {
                    return;
                }

                // 重置 clickThreshold
                this._clickThreshold = 0;

                if (this._lastDownButton == 2) {
                    this._lastDownButton = event.button;
                    this._mouseDownTarget = null;
                    // 仅作为关闭右键菜单使用
                    return;
                }

                this._lastMouseDownMoment = new Date();
                event = this._zrenderEventFixed(event);
                this._isMouseDown = 1;

                // 分发config.EVENT.MOUSEDOWN事件
                this._mouseDownTarget = this._lastHover;
                this._dispatchAgency(this._lastHover, EVENT.MOUSEDOWN, event);
                this._lastDownButton = event.button;
            },

            /**
             * 鼠标（手指）抬起响应函数
             * @inner
             * @param {Event} event
             */
            mouseup: function (event) {
                if (! isZRenderElement(event)) {
                    return;
                }

                event = this._zrenderEventFixed(event);
                this.root.style.cursor = 'default';
                this._isMouseDown = 0;
                this._mouseDownTarget = null;

                // 分发config.EVENT.MOUSEUP事件
                this._dispatchAgency(this._lastHover, EVENT.MOUSEUP, event);
                this._processDrop(event);
                this._processDragEnd(event);
            },

            /**
             * Touch开始响应函数
             * @inner
             * @param {Event} event
             */
            touchstart: function (event) {
                if (! isZRenderElement(event)) {
                    return;
                }

                // eventTool.stop(event);// 阻止浏览器默认事件，重要
                event = this._zrenderEventFixed(event, true);
                this._lastTouchMoment = new Date();

                // 平板补充一次findHover
                this._mobileFindFixed(event);
                this._mousedownHandler(event);
            },

            /**
             * Touch移动响应函数
             * @inner
             * @param {Event} event
             */
            touchmove: function (event) {
                if (! isZRenderElement(event)) {
                    return;
                }

                event = this._zrenderEventFixed(event, true);
                this._mousemoveHandler(event);
                if (this._isDragging) {
                    eventTool.stop(event);// 阻止浏览器默认事件，重要
                }
            },

            /**
             * Touch结束响应函数
             * @inner
             * @param {Event} event
             */
            touchend: function (event) {
                if (! isZRenderElement(event)) {
                    return;
                }

                // eventTool.stop(event);// 阻止浏览器默认事件，重要
                event = this._zrenderEventFixed(event, true);
                this._mouseupHandler(event);
                
                var now = new Date();
                if (now - this._lastTouchMoment < EVENT.touchClickDelay) {
                    this._mobileFindFixed(event);
                    this._clickHandler(event);
                    if (now - this._lastClickMoment < EVENT.touchClickDelay / 2) {
                        this._dblclickHandler(event);
                        if (this._lastHover && this._lastHover.clickable) {
                            eventTool.stop(event);// 阻止浏览器默认事件，重要
                        }
                    }
                    this._lastClickMoment = now;
                }
                this.painter.clearHover();
            }
        };

        /**
         * bind一个参数的function
         * 
         * @inner
         * @param {Function} handler 要bind的function
         * @param {Object} context 运行时this环境
         * @return {Function}
         */
        function bind1Arg(handler, context) {
            return function (e) {
                return handler.call(context, e);
            };
        }
        /**function bind2Arg(handler, context) {
            return function (arg1, arg2) {
                return handler.call(context, arg1, arg2);
            };
        }*/

        function bind3Arg(handler, context) {
            return function (arg1, arg2, arg3) {
                return handler.call(context, arg1, arg2, arg3);
            };
        }
        /**
         * 为控制类实例初始化dom 事件处理函数
         * 
         * @inner
         * @param {module:zrender/Handler} instance 控制类实例
         */
        function initDomHandler(instance) {
            var len = domHandlerNames.length;
            while (len--) {
                var name = domHandlerNames[len];
                instance['_' + name + 'Handler'] = bind1Arg(domHandlers[name], instance);
            }
        }

        /**
         * @alias module:zrender/Handler
         * @constructor
         * @extends module:zrender/mixin/Eventful
         * @param {HTMLElement} root 绘图区域
         * @param {module:zrender/Storage} storage Storage实例
         * @param {module:zrender/Painter} painter Painter实例
         */
        var Handler = function(root, storage, painter) {
            // 添加事件分发器特性
            Eventful.call(this);

            this.root = root;
            this.storage = storage;
            this.painter = painter;

            // 各种事件标识的私有变量
            // this._hasfound = false;              //是否找到hover图形元素
            // this._lastHover = null;              //最后一个hover图形元素
            // this._mouseDownTarget = null;
            // this._draggingTarget = null;         //当前被拖拽的图形元素
            // this._isMouseDown = false;
            // this._isDragging = false;
            // this._lastMouseDownMoment;
            // this._lastTouchMoment;
            // this._lastDownButton;

            this._lastX = 
            this._lastY = 
            this._mouseX = 
            this._mouseY = 0;

            this._findHover = bind3Arg(findHover, this);
            this._domHover = painter.getDomHover();
            initDomHandler(this);

            // 初始化，事件绑定，支持的所有事件都由如下原生事件计算得来
            if (window.addEventListener) {
                window.addEventListener('resize', this._resizeHandler);
                
                if (env.os.tablet || env.os.phone) {
                    // mobile支持
                    root.addEventListener('touchstart', this._touchstartHandler);
                    root.addEventListener('touchmove', this._touchmoveHandler);
                    root.addEventListener('touchend', this._touchendHandler);
                }
                else {
                    // mobile的click/move/up/down自己模拟
                    root.addEventListener('click', this._clickHandler);
                    root.addEventListener('dblclick', this._dblclickHandler);
                    root.addEventListener('mousewheel', this._mousewheelHandler);
                    root.addEventListener('mousemove', this._mousemoveHandler);
                    root.addEventListener('mousedown', this._mousedownHandler);
                    root.addEventListener('mouseup', this._mouseupHandler);
                } 
                root.addEventListener('DOMMouseScroll', this._mousewheelHandler);
                root.addEventListener('mouseout', this._mouseoutHandler);
            }
            else {
                window.attachEvent('onresize', this._resizeHandler);

                root.attachEvent('onclick', this._clickHandler);
                //root.attachEvent('ondblclick ', this._dblclickHandler);
                root.ondblclick = this._dblclickHandler;
                root.attachEvent('onmousewheel', this._mousewheelHandler);
                root.attachEvent('onmousemove', this._mousemoveHandler);
                root.attachEvent('onmouseout', this._mouseoutHandler);
                root.attachEvent('onmousedown', this._mousedownHandler);
                root.attachEvent('onmouseup', this._mouseupHandler);
            }
        };

        /**
         * 自定义事件绑定
         * @param {string} eventName 事件名称，resize，hover，drag，etc~
         * @param {Function} handler 响应函数
         * @param {Object} [context] 响应函数
         */
        Handler.prototype.on = function (eventName, handler, context) {
            this.bind(eventName, handler, context);
            return this;
        };

        /**
         * 自定义事件解绑
         * @param {string} eventName 事件名称，resize，hover，drag，etc~
         * @param {Function} handler 响应函数
         */
        Handler.prototype.un = function (eventName, handler) {
            this.unbind(eventName, handler);
            return this;
        };

        /**
         * 事件触发
         * @param {string} eventName 事件名称，resize，hover，drag，etc~
         * @param {event=} eventArgs event dom事件对象
         */
        Handler.prototype.trigger = function (eventName, eventArgs) {
            switch (eventName) {
                case EVENT.RESIZE:
                case EVENT.CLICK:
                case EVENT.DBLCLICK:
                case EVENT.MOUSEWHEEL:
                case EVENT.MOUSEMOVE:
                case EVENT.MOUSEDOWN:
                case EVENT.MOUSEUP:
                case EVENT.MOUSEOUT:
                    this['_' + eventName + 'Handler'](eventArgs);
                    break;
            }
        };

        /**
         * 释放，解绑所有事件
         */
        Handler.prototype.dispose = function () {
            var root = this.root;

            if (window.removeEventListener) {
                window.removeEventListener('resize', this._resizeHandler);

                if (env.os.tablet || env.os.phone) {
                    // mobile支持
                    root.removeEventListener('touchstart', this._touchstartHandler);
                    root.removeEventListener('touchmove', this._touchmoveHandler);
                    root.removeEventListener('touchend', this._touchendHandler);
                }
                else {
                    // mobile的click自己模拟
                    root.removeEventListener('click', this._clickHandler);
                    root.removeEventListener('dblclick', this._dblclickHandler);
                    root.removeEventListener('mousewheel', this._mousewheelHandler);
                    root.removeEventListener('mousemove', this._mousemoveHandler);
                    root.removeEventListener('mousedown', this._mousedownHandler);
                    root.removeEventListener('mouseup', this._mouseupHandler);
                }
                root.removeEventListener('DOMMouseScroll', this._mousewheelHandler);
                root.removeEventListener('mouseout', this._mouseoutHandler);
            }
            else {
                window.detachEvent('onresize', this._resizeHandler);

                root.detachEvent('onclick', this._clickHandler);
                root.detachEvent('dblclick', this._dblclickHandler);
                root.detachEvent('onmousewheel', this._mousewheelHandler);
                root.detachEvent('onmousemove', this._mousemoveHandler);
                root.detachEvent('onmouseout', this._mouseoutHandler);
                root.detachEvent('onmousedown', this._mousedownHandler);
                root.detachEvent('onmouseup', this._mouseupHandler);
            }

            this.root =
            this._domHover =
            this.storage =
            this.painter = null;
            
            this.un();
        };

        /**
         * 拖拽开始
         * 
         * @private
         * @param {Object} event 事件对象
         */
        Handler.prototype._processDragStart = function (event) {
            var _lastHover = this._lastHover;

            if (this._isMouseDown
                && _lastHover
                && _lastHover.draggable
                && !this._draggingTarget
                && this._mouseDownTarget == _lastHover
            ) {
                // 拖拽点击生效时长阀门，某些场景需要降低拖拽敏感度
                if (_lastHover.dragEnableTime && 
                    new Date() - this._lastMouseDownMoment < _lastHover.dragEnableTime
                ) {
                    return;
                }

                var _draggingTarget = _lastHover;
                this._draggingTarget = _draggingTarget;
                this._isDragging = 1;

                _draggingTarget.invisible = true;
                this.storage.mod(_draggingTarget.id);

                // 分发config.EVENT.DRAGSTART事件
                this._dispatchAgency(
                    _draggingTarget,
                    EVENT.DRAGSTART,
                    event
                );
                this.painter.refresh();
            }
        };

        /**
         * 拖拽进入目标元素
         * 
         * @private
         * @param {Object} event 事件对象
         */
        Handler.prototype._processDragEnter = function (event) {
            if (this._draggingTarget) {
                // 分发config.EVENT.DRAGENTER事件
                this._dispatchAgency(
                    this._lastHover,
                    EVENT.DRAGENTER,
                    event,
                    this._draggingTarget
                );
            }
        };

        /**
         * 拖拽在目标元素上移动
         * 
         * @private
         * @param {Object} event 事件对象
         */
        Handler.prototype._processDragOver = function (event) {
            if (this._draggingTarget) {
                // 分发config.EVENT.DRAGOVER事件
                this._dispatchAgency(
                    this._lastHover,
                    EVENT.DRAGOVER,
                    event,
                    this._draggingTarget
                );
            }
        };

        /**
         * 拖拽离开目标元素
         * 
         * @private
         * @param {Object} event 事件对象
         */
        Handler.prototype._processDragLeave = function (event) {
            if (this._draggingTarget) {
                // 分发config.EVENT.DRAGLEAVE事件
                this._dispatchAgency(
                    this._lastHover,
                    EVENT.DRAGLEAVE,
                    event,
                    this._draggingTarget
                );
            }
        };

        /**
         * 拖拽在目标元素上完成
         * 
         * @private
         * @param {Object} event 事件对象
         */
        Handler.prototype._processDrop = function (event) {
            if (this._draggingTarget) {
                this._draggingTarget.invisible = false;
                this.storage.mod(this._draggingTarget.id);
                this.painter.refresh();

                // 分发config.EVENT.DROP事件
                this._dispatchAgency(
                    this._lastHover,
                    EVENT.DROP,
                    event,
                    this._draggingTarget
                );
            }
        };

        /**
         * 拖拽结束
         * 
         * @private
         * @param {Object} event 事件对象
         */
        Handler.prototype._processDragEnd = function (event) {
            if (this._draggingTarget) {
                // 分发config.EVENT.DRAGEND事件
                this._dispatchAgency(
                    this._draggingTarget,
                    EVENT.DRAGEND,
                    event
                );

                this._lastHover = null;
            }

            this._isDragging = 0;
            this._draggingTarget = null;
        };

        /**
         * 鼠标在某个图形元素上移动
         * 
         * @private
         * @param {Object} event 事件对象
         */
        Handler.prototype._processOverShape = function (event) {
            // 分发config.EVENT.MOUSEOVER事件
            this._dispatchAgency(this._lastHover, EVENT.MOUSEOVER, event);
        };

        /**
         * 鼠标离开某个图形元素
         * 
         * @private
         * @param {Object} event 事件对象
         */
        Handler.prototype._processOutShape = function (event) {
            // 分发config.EVENT.MOUSEOUT事件
            this._dispatchAgency(this._lastHover, EVENT.MOUSEOUT, event);
        };

        /**
         * 事件分发代理
         * 
         * @private
         * @param {Object} targetShape 目标图形元素
         * @param {string} eventName 事件名称
         * @param {Object} event 事件对象
         * @param {Object=} draggedShape 拖拽事件特有，当前被拖拽图形元素
         */
        Handler.prototype._dispatchAgency = function (targetShape, eventName, event, draggedShape) {
            var eventHandler = 'on' + eventName;
            var eventPacket = {
                type : eventName,
                event : event,
                target : targetShape,
                cancelBubble: false
            };

            var el = targetShape;

            if (draggedShape) {
                eventPacket.dragged = draggedShape;
            }

            while (el) {
                el[eventHandler] 
                && (eventPacket.cancelBubble = el[eventHandler](eventPacket));
                el.dispatch(eventName, eventPacket);

                el = el.parent;
                
                if (eventPacket.cancelBubble) {
                    break;
                }
            }

            if (targetShape) {
                // 冒泡到顶级 zrender 对象
                if (!eventPacket.cancelBubble) {
                    this.dispatch(eventName, eventPacket);
                }
            }
            else if (!draggedShape) {
                // 无hover目标，无拖拽对象，原生事件分发
                var eveObj = {
                    type: eventName,
                    event: event
                };
                this.dispatch(eventName, eveObj);
                // 分发事件到用户自定义层
                this.painter.eachOtherLayer(function (layer) {
                    if (typeof(layer[eventHandler]) == 'function') {
                        layer[eventHandler](eveObj);
                    }
                    if (layer.dispatch) {
                        layer.dispatch(eventName, eveObj);
                    }
                });
            }
        };

        /**
         * 迭代寻找hover shape
         * @private
         * @method
         */
        Handler.prototype._iterateAndFindHover = (function() {
            var invTransform = mat2d.create();
            return function() {
                var list = this.storage.getShapeList();
                var currentZLevel;
                var currentLayer;
                var tmp = [ 0, 0 ];
                for (var i = list.length - 1; i >= 0 ; i--) {
                    var shape = list[i];

                    if (currentZLevel !== shape.zlevel) {
                        currentLayer = this.painter.getLayer(shape.zlevel, currentLayer);
                        tmp[0] = this._mouseX;
                        tmp[1] = this._mouseY;

                        if (currentLayer.needTransform) {
                            mat2d.invert(invTransform, currentLayer.transform);
                            vec2.applyTransform(tmp, tmp, invTransform);
                        }
                    }

                    if (this._findHover(shape, tmp[0], tmp[1])) {
                        break;
                    }
                }
            };
        })();
        
        // touch指尖错觉的尝试偏移量配置
        var MOBILE_TOUCH_OFFSETS = [
            { x: 10 },
            { x: -20 },
            { x: 10, y: 10 },
            { y: -20 }
        ];

        // touch有指尖错觉，四向尝试，让touch上的点击更好触发事件
        Handler.prototype._mobileFindFixed = function (event) {
            this._lastHover = null;
            this._mouseX = event.zrenderX;
            this._mouseY = event.zrenderY;

            this._event = event;

            this._iterateAndFindHover();
            for (var i = 0; !this._lastHover && i < MOBILE_TOUCH_OFFSETS.length ; i++) {
                var offset = MOBILE_TOUCH_OFFSETS[ i ];
                offset.x && (this._mouseX += offset.x);
                offset.y && (this._mouseY += offset.y);

                this._iterateAndFindHover();
            }

            if (this._lastHover) {
                event.zrenderX = this._mouseX;
                event.zrenderY = this._mouseY;
            }
        };

        /**
         * 迭代函数，查找hover到的图形元素并即时做些事件分发
         * 
         * @inner
         * @param {Object} shape 图形元素
         * @param {number} x
         * @param {number} y
         */
        function findHover(shape, x, y) {
            if (
                (this._draggingTarget && this._draggingTarget.id == shape.id) // 迭代到当前拖拽的图形上
                || shape.isSilent() // 打酱油的路过，啥都不响应的shape~
            ) {
                return false;
            }

            var event = this._event;
            if (shape.isCover(x, y)) {
                if (shape.hoverable) {
                    this.storage.addHover(shape);
                }
                // 查找是否在 clipShape 中
                var p = shape.parent;
                while (p) {
                    if (p.clipShape && !p.clipShape.isCover(this._mouseX, this._mouseY))  {
                        // 已经被祖先 clip 掉了
                        return false;
                    }
                    p = p.parent;
                }

                if (this._lastHover != shape) {
                    this._processOutShape(event);

                    // 可能出现config.EVENT.DRAGLEAVE事件
                    this._processDragLeave(event);

                    this._lastHover = shape;

                    // 可能出现config.EVENT.DRAGENTER事件
                    this._processDragEnter(event);
                }

                this._processOverShape(event);

                // 可能出现config.EVENT.DRAGOVER
                this._processDragOver(event);

                this._hasfound = 1;

                return true;    // 找到则中断迭代查找
            }

            return false;
        }

        /**
         * 如果存在第三方嵌入的一些dom触发的事件，或touch事件，需要转换一下事件坐标
         * 
         * @private
         */
        Handler.prototype._zrenderEventFixed = function (event, isTouch) {
            if (event.zrenderFixed) {
                return event;
            }

            if (!isTouch) {
                event = event || window.event;
                // 进入对象优先~
                var target = event.toElement
                              || event.relatedTarget
                              || event.srcElement
                              || event.target;

                if (target && target != this._domHover) {
                    event.zrenderX = (typeof event.offsetX != 'undefined'
                                        ? event.offsetX
                                        : event.layerX)
                                      + target.offsetLeft;
                    event.zrenderY = (typeof event.offsetY != 'undefined'
                                        ? event.offsetY
                                        : event.layerY)
                                      + target.offsetTop;
                }
            }
            else {
                var touch = event.type != 'touchend'
                                ? event.targetTouches[0]
                                : event.changedTouches[0];
                if (touch) {
                    var rBounding = this.painter._domRoot.getBoundingClientRect();
                    // touch事件坐标是全屏的~
                    event.zrenderX = touch.clientX - rBounding.left;
                    event.zrenderY = touch.clientY - rBounding.top;
                }
            }

            event.zrenderFixed = 1;
            return event;
        };

        util.merge(Handler.prototype, Eventful.prototype, true);

        return Handler;
    }
);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL0hhbmRsZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBIYW5kbGVy5o6n5Yi25qih5Z2XXG4gKiBAbW9kdWxlIHpyZW5kZXIvSGFuZGxlclxuICogQGF1dGhvciBLZW5lciAoQEtlbmVyLeael+WzsCwga2VuZXIubGluZmVuZ0BnbWFpbC5jb20pXG4gKiAgICAgICAgIGVycm9ycmlrIChlcnJvcnJpa0BnbWFpbC5jb20pXG4gKlxuICovXG4vLyBUT0RPIG1vdXNlb3ZlciDlj6rop6blj5HkuIDmrKFcbi8vIOebruWJjeeahOmrmOS6ruWboOS4uuavj+asoemDvemcgOimgSBhZGRIb3ZlciDmiYDku6XkuI3og73lj6rmmK/lvIDlp4vnmoTml7blgJnop6blj5HkuIDmrKFcbmRlZmluZShcbiAgICBmdW5jdGlvbiAocmVxdWlyZSkge1xuXG4gICAgICAgICd1c2Ugc3RyaWN0JztcblxuICAgICAgICB2YXIgY29uZmlnID0gcmVxdWlyZSgnLi9jb25maWcnKTtcbiAgICAgICAgdmFyIGVudiA9IHJlcXVpcmUoJy4vdG9vbC9lbnYnKTtcbiAgICAgICAgdmFyIGV2ZW50VG9vbCA9IHJlcXVpcmUoJy4vdG9vbC9ldmVudCcpO1xuICAgICAgICB2YXIgdXRpbCA9IHJlcXVpcmUoJy4vdG9vbC91dGlsJyk7XG4gICAgICAgIHZhciB2ZWMyID0gcmVxdWlyZSgnLi90b29sL3ZlY3RvcicpO1xuICAgICAgICB2YXIgbWF0MmQgPSByZXF1aXJlKCcuL3Rvb2wvbWF0cml4Jyk7XG4gICAgICAgIHZhciBFVkVOVCA9IGNvbmZpZy5FVkVOVDtcblxuICAgICAgICB2YXIgRXZlbnRmdWwgPSByZXF1aXJlKCcuL21peGluL0V2ZW50ZnVsJyk7XG5cbiAgICAgICAgdmFyIGRvbUhhbmRsZXJOYW1lcyA9IFtcbiAgICAgICAgICAgICdyZXNpemUnLCAnY2xpY2snLCAnZGJsY2xpY2snLFxuICAgICAgICAgICAgJ21vdXNld2hlZWwnLCAnbW91c2Vtb3ZlJywgJ21vdXNlb3V0JywgJ21vdXNldXAnLCAnbW91c2Vkb3duJyxcbiAgICAgICAgICAgICd0b3VjaHN0YXJ0JywgJ3RvdWNoZW5kJywgJ3RvdWNobW92ZSdcbiAgICAgICAgXTtcblxuICAgICAgICB2YXIgaXNaUmVuZGVyRWxlbWVudCA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgLy8g5pqC5pe25b+955WlIElFOC1cbiAgICAgICAgICAgIGlmICh3aW5kb3cuR192bWxDYW52YXNNYW5hZ2VyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGV2ZW50ID0gZXZlbnQgfHwgd2luZG93LmV2ZW50O1xuICAgICAgICAgICAgLy8g6L+b5YWl5a+56LGh5LyY5YWIflxuICAgICAgICAgICAgdmFyIHRhcmdldCA9IGV2ZW50LnRvRWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgICB8fCBldmVudC5yZWxhdGVkVGFyZ2V0XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHx8IGV2ZW50LnNyY0VsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfHwgZXZlbnQudGFyZ2V0O1xuXG4gICAgICAgICAgICByZXR1cm4gdGFyZ2V0ICYmIHRhcmdldC5jbGFzc05hbWUubWF0Y2goY29uZmlnLmVsZW1lbnRDbGFzc05hbWUpXG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGRvbUhhbmRsZXJzID0ge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDnqpflj6PlpKflsI/mlLnlj5jlk43lupTlh73mlbBcbiAgICAgICAgICAgICAqIEBpbm5lclxuICAgICAgICAgICAgICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgcmVzaXplOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICBldmVudCA9IGV2ZW50IHx8IHdpbmRvdy5ldmVudDtcbiAgICAgICAgICAgICAgICB0aGlzLl9sYXN0SG92ZXIgPSBudWxsO1xuICAgICAgICAgICAgICAgIHRoaXMuX2lzTW91c2VEb3duID0gMDtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDliIblj5Fjb25maWcuRVZFTlQuUkVTSVpF5LqL5Lu277yMZ2xvYmFsXG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwYXRjaChFVkVOVC5SRVNJWkUsIGV2ZW50KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog54K55Ye75ZON5bqU5Ye95pWwXG4gICAgICAgICAgICAgKiBAaW5uZXJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGNsaWNrOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICBpZiAoISBpc1pSZW5kZXJFbGVtZW50KGV2ZW50KSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZXZlbnQgPSB0aGlzLl96cmVuZGVyRXZlbnRGaXhlZChldmVudCk7XG5cbiAgICAgICAgICAgICAgICAvLyDliIblj5Fjb25maWcuRVZFTlQuQ0xJQ0vkuovku7ZcbiAgICAgICAgICAgICAgICB2YXIgX2xhc3RIb3ZlciA9IHRoaXMuX2xhc3RIb3ZlcjtcbiAgICAgICAgICAgICAgICBpZiAoKF9sYXN0SG92ZXIgJiYgX2xhc3RIb3Zlci5jbGlja2FibGUpXG4gICAgICAgICAgICAgICAgICAgIHx8ICFfbGFzdEhvdmVyXG4gICAgICAgICAgICAgICAgKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8g5Yik5pat5rKh5pyJ5Y+R55Sf5ouW5ou95omN6Kem5Y+RY2xpY2vkuovku7ZcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX2NsaWNrVGhyZXNob2xkIDwgNSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZGlzcGF0Y2hBZ2VuY3koX2xhc3RIb3ZlciwgRVZFTlQuQ0xJQ0ssIGV2ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMuX21vdXNlbW92ZUhhbmRsZXIoZXZlbnQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDlj4zlh7vlk43lupTlh73mlbBcbiAgICAgICAgICAgICAqIEBpbm5lclxuICAgICAgICAgICAgICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZGJsY2xpY2s6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgICAgIGlmICghIGlzWlJlbmRlckVsZW1lbnQoZXZlbnQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBldmVudCA9IGV2ZW50IHx8IHdpbmRvdy5ldmVudDtcbiAgICAgICAgICAgICAgICBldmVudCA9IHRoaXMuX3pyZW5kZXJFdmVudEZpeGVkKGV2ZW50KTtcblxuICAgICAgICAgICAgICAgIC8vIOWIhuWPkWNvbmZpZy5FVkVOVC5EQkxDTElDS+S6i+S7tlxuICAgICAgICAgICAgICAgIHZhciBfbGFzdEhvdmVyID0gdGhpcy5fbGFzdEhvdmVyO1xuICAgICAgICAgICAgICAgIGlmICgoX2xhc3RIb3ZlciAmJiBfbGFzdEhvdmVyLmNsaWNrYWJsZSlcbiAgICAgICAgICAgICAgICAgICAgfHwgIV9sYXN0SG92ZXJcbiAgICAgICAgICAgICAgICApIHtcblxuICAgICAgICAgICAgICAgICAgICAvLyDliKTmlq3msqHmnInlj5HnlJ/mi5bmi73miY3op6blj5FkYmxjbGlja+S6i+S7tlxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fY2xpY2tUaHJlc2hvbGQgPCA1KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9kaXNwYXRjaEFnZW5jeShfbGFzdEhvdmVyLCBFVkVOVC5EQkxDTElDSywgZXZlbnQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5fbW91c2Vtb3ZlSGFuZGxlcihldmVudCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog6byg5qCH5rua6L2u5ZON5bqU5Ye95pWwXG4gICAgICAgICAgICAgKiBAaW5uZXJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIG1vdXNld2hlZWw6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgICAgIGlmICghIGlzWlJlbmRlckVsZW1lbnQoZXZlbnQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBldmVudCA9IHRoaXMuX3pyZW5kZXJFdmVudEZpeGVkKGV2ZW50KTtcblxuICAgICAgICAgICAgICAgIC8vIGh0dHA6Ly93d3cuc2l0ZXBvaW50LmNvbS9odG1sNS1qYXZhc2NyaXB0LW1vdXNlLXdoZWVsL1xuICAgICAgICAgICAgICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvRE9NL0RPTV9ldmVudF9yZWZlcmVuY2UvbW91c2V3aGVlbFxuICAgICAgICAgICAgICAgIHZhciBkZWx0YSA9IGV2ZW50LndoZWVsRGVsdGEgLy8gV2Via2l0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfHwgLWV2ZW50LmRldGFpbDsgLy8gRmlyZWZveFxuICAgICAgICAgICAgICAgIHZhciBzY2FsZSA9IGRlbHRhID4gMCA/IDEuMSA6IDEgLyAxLjE7XG5cbiAgICAgICAgICAgICAgICB2YXIgbmVlZHNSZWZyZXNoID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICB2YXIgbW91c2VYID0gdGhpcy5fbW91c2VYO1xuICAgICAgICAgICAgICAgIHZhciBtb3VzZVkgPSB0aGlzLl9tb3VzZVk7XG4gICAgICAgICAgICAgICAgdGhpcy5wYWludGVyLmVhY2hCdWlsZGluTGF5ZXIoZnVuY3Rpb24gKGxheWVyKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwb3MgPSBsYXllci5wb3NpdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxheWVyLnpvb21hYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYXllci5fX3pvb20gPSBsYXllci5fX3pvb20gfHwgMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuZXdab29tID0gbGF5ZXIuX196b29tO1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3Wm9vbSAqPSBzY2FsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld1pvb20gPSBNYXRoLm1heChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLm1pbihsYXllci5tYXhab29tLCBuZXdab29tKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXllci5taW5ab29tXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2NhbGUgPSBuZXdab29tIC8gbGF5ZXIuX196b29tO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGF5ZXIuX196b29tID0gbmV3Wm9vbTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEtlZXAgdGhlIG1vdXNlIGNlbnRlciB3aGVuIHNjYWxpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc1swXSAtPSAobW91c2VYIC0gcG9zWzBdKSAqIChzY2FsZSAtIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9zWzFdIC09IChtb3VzZVkgLSBwb3NbMV0pICogKHNjYWxlIC0gMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYXllci5zY2FsZVswXSAqPSBzY2FsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxheWVyLnNjYWxlWzFdICo9IHNjYWxlO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGF5ZXIuZGlydHkgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgbmVlZHNSZWZyZXNoID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gUHJldmVudCBicm93c2VyIGRlZmF1bHQgc2Nyb2xsIGFjdGlvbiBcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50VG9vbC5zdG9wKGV2ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGlmIChuZWVkc1JlZnJlc2gpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wYWludGVyLnJlZnJlc2goKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDliIblj5Fjb25maWcuRVZFTlQuTU9VU0VXSEVFTOS6i+S7tlxuICAgICAgICAgICAgICAgIHRoaXMuX2Rpc3BhdGNoQWdlbmN5KHRoaXMuX2xhc3RIb3ZlciwgRVZFTlQuTU9VU0VXSEVFTCwgZXZlbnQpO1xuICAgICAgICAgICAgICAgIHRoaXMuX21vdXNlbW92ZUhhbmRsZXIoZXZlbnQpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDpvKDmoIfvvIjmiYvmjIfvvInnp7vliqjlk43lupTlh73mlbBcbiAgICAgICAgICAgICAqIEBpbm5lclxuICAgICAgICAgICAgICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgbW91c2Vtb3ZlOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICBpZiAoISBpc1pSZW5kZXJFbGVtZW50KGV2ZW50KSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucGFpbnRlci5pc0xvYWRpbmcoKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZXZlbnQgPSB0aGlzLl96cmVuZGVyRXZlbnRGaXhlZChldmVudCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fbGFzdFggPSB0aGlzLl9tb3VzZVg7XG4gICAgICAgICAgICAgICAgdGhpcy5fbGFzdFkgPSB0aGlzLl9tb3VzZVk7XG4gICAgICAgICAgICAgICAgdGhpcy5fbW91c2VYID0gZXZlbnRUb29sLmdldFgoZXZlbnQpO1xuICAgICAgICAgICAgICAgIHRoaXMuX21vdXNlWSA9IGV2ZW50VG9vbC5nZXRZKGV2ZW50KTtcbiAgICAgICAgICAgICAgICB2YXIgZHggPSB0aGlzLl9tb3VzZVggLSB0aGlzLl9sYXN0WDtcbiAgICAgICAgICAgICAgICB2YXIgZHkgPSB0aGlzLl9tb3VzZVkgLSB0aGlzLl9sYXN0WTtcblxuICAgICAgICAgICAgICAgIC8vIOWPr+iDveWHuueOsGNvbmZpZy5FVkVOVC5EUkFHU1RBUlTkuovku7ZcbiAgICAgICAgICAgICAgICAvLyDpgb/lhY3miYvmipbngrnlh7vor6/orqTkuLrmi5bmi71cbiAgICAgICAgICAgICAgICAvLyBpZiAodGhpcy5fbW91c2VYIC0gdGhpcy5fbGFzdFggPiAxIHx8IHRoaXMuX21vdXNlWSAtIHRoaXMuX2xhc3RZID4gMSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3Byb2Nlc3NEcmFnU3RhcnQoZXZlbnQpO1xuICAgICAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgICAgICB0aGlzLl9oYXNmb3VuZCA9IDA7XG4gICAgICAgICAgICAgICAgdGhpcy5fZXZlbnQgPSBldmVudDtcblxuICAgICAgICAgICAgICAgIHRoaXMuX2l0ZXJhdGVBbmRGaW5kSG92ZXIoKTtcblxuICAgICAgICAgICAgICAgIC8vIOaJvuWIsOeahOWcqOi/reS7o+WHveaVsOmHjOWBmuS6huWkhOeQhu+8jOayoeaJvuWIsOW+l+WcqOi/reS7o+WujOWQjuWkhOeQhlxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5faGFzZm91bmQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g6L+H5ruk6aaW5qyh5ouW5ou95Lqn55Sf55qEbW91c2VvdXTlkoxkcmFnTGVhdmVcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9kcmFnZ2luZ1RhcmdldFxuICAgICAgICAgICAgICAgICAgICAgICAgfHwgKHRoaXMuX2xhc3RIb3ZlciAmJiB0aGlzLl9sYXN0SG92ZXIgIT0gdGhpcy5fZHJhZ2dpbmdUYXJnZXQpXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5Y+v6IO95Ye6546wY29uZmlnLkVWRU5ULk1PVVNFT1VU5LqL5Lu2XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9jZXNzT3V0U2hhcGUoZXZlbnQpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDlj6/og73lh7rnjrBjb25maWcuRVZFTlQuRFJBR0xFQVZF5LqL5Lu2XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9jZXNzRHJhZ0xlYXZlKGV2ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2xhc3RIb3ZlciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RvcmFnZS5kZWxIb3ZlcigpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBhaW50ZXIuY2xlYXJIb3ZlcigpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIHNldCBjdXJzb3IgZm9yIHJvb3QgZWxlbWVudFxuICAgICAgICAgICAgICAgIHZhciBjdXJzb3IgPSAnZGVmYXVsdCc7XG5cbiAgICAgICAgICAgICAgICAvLyDlpoLmnpzlrZjlnKjmi5bmi73kuK3lhYPntKDvvIzooqvmi5bmi73nmoTlm77lvaLlhYPntKDmnIDlkI5hZGRIb3ZlclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9kcmFnZ2luZ1RhcmdldCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0b3JhZ2UuZHJpZnQodGhpcy5fZHJhZ2dpbmdUYXJnZXQuaWQsIGR4LCBkeSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2RyYWdnaW5nVGFyZ2V0Lm1vZFNlbGYoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdG9yYWdlLmFkZEhvdmVyKHRoaXMuX2RyYWdnaW5nVGFyZ2V0KTtcblxuICAgICAgICAgICAgICAgICAgICAvLyDmi5bmi73kuI3op6blj5FjbGlja+S6i+S7tlxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jbGlja1RocmVzaG9sZCsrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0aGlzLl9pc01vdXNlRG93bikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmVlZHNSZWZyZXNoID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIC8vIExheWVyIGRyYWdnaW5nXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGFpbnRlci5lYWNoQnVpbGRpbkxheWVyKGZ1bmN0aW9uIChsYXllcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxheWVyLnBhbmFibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQRU5ESU5HXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yID0gJ21vdmUnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEtlZXAgdGhlIG1vdXNlIGNlbnRlciB3aGVuIHNjYWxpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXllci5wb3NpdGlvblswXSArPSBkeDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXllci5wb3NpdGlvblsxXSArPSBkeTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZWVkc1JlZnJlc2ggPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxheWVyLmRpcnR5ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChuZWVkc1JlZnJlc2gpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGFpbnRlci5yZWZyZXNoKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fZHJhZ2dpbmdUYXJnZXQgfHwgKHRoaXMuX2hhc2ZvdW5kICYmIHRoaXMuX2xhc3RIb3Zlci5kcmFnZ2FibGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnNvciA9ICdtb3ZlJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodGhpcy5faGFzZm91bmQgJiYgdGhpcy5fbGFzdEhvdmVyLmNsaWNrYWJsZSkge1xuICAgICAgICAgICAgICAgICAgICBjdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMucm9vdC5zdHlsZS5jdXJzb3IgPSBjdXJzb3I7XG5cbiAgICAgICAgICAgICAgICAvLyDliIblj5Fjb25maWcuRVZFTlQuTU9VU0VNT1ZF5LqL5Lu2XG4gICAgICAgICAgICAgICAgdGhpcy5fZGlzcGF0Y2hBZ2VuY3kodGhpcy5fbGFzdEhvdmVyLCBFVkVOVC5NT1VTRU1PVkUsIGV2ZW50KTtcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9kcmFnZ2luZ1RhcmdldCB8fCB0aGlzLl9oYXNmb3VuZCB8fCB0aGlzLnN0b3JhZ2UuaGFzSG92ZXJTaGFwZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGFpbnRlci5yZWZyZXNoSG92ZXIoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOm8oOagh++8iOaJi+aMh++8ieemu+W8gOWTjeW6lOWHveaVsFxuICAgICAgICAgICAgICogQGlubmVyXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBtb3VzZW91dDogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgaWYgKCEgaXNaUmVuZGVyRWxlbWVudChldmVudCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGV2ZW50ID0gdGhpcy5fenJlbmRlckV2ZW50Rml4ZWQoZXZlbnQpO1xuXG4gICAgICAgICAgICAgICAgdmFyIGVsZW1lbnQgPSBldmVudC50b0VsZW1lbnQgfHwgZXZlbnQucmVsYXRlZFRhcmdldDtcbiAgICAgICAgICAgICAgICBpZiAoZWxlbWVudCAhPSB0aGlzLnJvb3QpIHtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGVsZW1lbnQgJiYgZWxlbWVudC5ub2RlVHlwZSAhPSA5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDlv73nlaXljIXlkKvlnKhyb2905Lit55qEZG9t5byV6LW355qEbW91c2VPdXRcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbGVtZW50ID09IHRoaXMucm9vdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX21vdXNlbW92ZUhhbmRsZXIoZXZlbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudCA9IGVsZW1lbnQucGFyZW50Tm9kZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGV2ZW50LnpyZW5kZXJYID0gdGhpcy5fbGFzdFg7XG4gICAgICAgICAgICAgICAgZXZlbnQuenJlbmRlclkgPSB0aGlzLl9sYXN0WTtcbiAgICAgICAgICAgICAgICB0aGlzLnJvb3Quc3R5bGUuY3Vyc29yID0gJ2RlZmF1bHQnO1xuICAgICAgICAgICAgICAgIHRoaXMuX2lzTW91c2VEb3duID0gMDtcblxuICAgICAgICAgICAgICAgIHRoaXMuX3Byb2Nlc3NPdXRTaGFwZShldmVudCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fcHJvY2Vzc0Ryb3AoZXZlbnQpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3Byb2Nlc3NEcmFnRW5kKGV2ZW50KTtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMucGFpbnRlci5pc0xvYWRpbmcoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBhaW50ZXIucmVmcmVzaEhvdmVyKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2goRVZFTlQuR0xPQkFMT1VULCBldmVudCk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOm8oOagh++8iOaJi+aMh++8ieaMieS4i+WTjeW6lOWHveaVsFxuICAgICAgICAgICAgICogQGlubmVyXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBtb3VzZWRvd246IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgICAgIGlmICghIGlzWlJlbmRlckVsZW1lbnQoZXZlbnQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDph43nva4gY2xpY2tUaHJlc2hvbGRcbiAgICAgICAgICAgICAgICB0aGlzLl9jbGlja1RocmVzaG9sZCA9IDA7XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fbGFzdERvd25CdXR0b24gPT0gMikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9sYXN0RG93bkJ1dHRvbiA9IGV2ZW50LmJ1dHRvbjtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbW91c2VEb3duVGFyZ2V0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgLy8g5LuF5L2c5Li65YWz6Zet5Y+z6ZSu6I+c5Y2V5L2/55SoXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9sYXN0TW91c2VEb3duTW9tZW50ID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgICAgICBldmVudCA9IHRoaXMuX3pyZW5kZXJFdmVudEZpeGVkKGV2ZW50KTtcbiAgICAgICAgICAgICAgICB0aGlzLl9pc01vdXNlRG93biA9IDE7XG5cbiAgICAgICAgICAgICAgICAvLyDliIblj5Fjb25maWcuRVZFTlQuTU9VU0VET1dO5LqL5Lu2XG4gICAgICAgICAgICAgICAgdGhpcy5fbW91c2VEb3duVGFyZ2V0ID0gdGhpcy5fbGFzdEhvdmVyO1xuICAgICAgICAgICAgICAgIHRoaXMuX2Rpc3BhdGNoQWdlbmN5KHRoaXMuX2xhc3RIb3ZlciwgRVZFTlQuTU9VU0VET1dOLCBldmVudCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fbGFzdERvd25CdXR0b24gPSBldmVudC5idXR0b247XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOm8oOagh++8iOaJi+aMh++8ieaKrOi1t+WTjeW6lOWHveaVsFxuICAgICAgICAgICAgICogQGlubmVyXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBtb3VzZXVwOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICBpZiAoISBpc1pSZW5kZXJFbGVtZW50KGV2ZW50KSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZXZlbnQgPSB0aGlzLl96cmVuZGVyRXZlbnRGaXhlZChldmVudCk7XG4gICAgICAgICAgICAgICAgdGhpcy5yb290LnN0eWxlLmN1cnNvciA9ICdkZWZhdWx0JztcbiAgICAgICAgICAgICAgICB0aGlzLl9pc01vdXNlRG93biA9IDA7XG4gICAgICAgICAgICAgICAgdGhpcy5fbW91c2VEb3duVGFyZ2V0ID0gbnVsbDtcblxuICAgICAgICAgICAgICAgIC8vIOWIhuWPkWNvbmZpZy5FVkVOVC5NT1VTRVVQ5LqL5Lu2XG4gICAgICAgICAgICAgICAgdGhpcy5fZGlzcGF0Y2hBZ2VuY3kodGhpcy5fbGFzdEhvdmVyLCBFVkVOVC5NT1VTRVVQLCBldmVudCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fcHJvY2Vzc0Ryb3AoZXZlbnQpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3Byb2Nlc3NEcmFnRW5kKGV2ZW50KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogVG91Y2jlvIDlp4vlk43lupTlh73mlbBcbiAgICAgICAgICAgICAqIEBpbm5lclxuICAgICAgICAgICAgICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdG91Y2hzdGFydDogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgaWYgKCEgaXNaUmVuZGVyRWxlbWVudChldmVudCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGV2ZW50VG9vbC5zdG9wKGV2ZW50KTsvLyDpmLvmraLmtY/op4jlmajpu5jorqTkuovku7bvvIzph43opoFcbiAgICAgICAgICAgICAgICBldmVudCA9IHRoaXMuX3pyZW5kZXJFdmVudEZpeGVkKGV2ZW50LCB0cnVlKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9sYXN0VG91Y2hNb21lbnQgPSBuZXcgRGF0ZSgpO1xuXG4gICAgICAgICAgICAgICAgLy8g5bmz5p2/6KGl5YWF5LiA5qyhZmluZEhvdmVyXG4gICAgICAgICAgICAgICAgdGhpcy5fbW9iaWxlRmluZEZpeGVkKGV2ZW50KTtcbiAgICAgICAgICAgICAgICB0aGlzLl9tb3VzZWRvd25IYW5kbGVyKGV2ZW50KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogVG91Y2jnp7vliqjlk43lupTlh73mlbBcbiAgICAgICAgICAgICAqIEBpbm5lclxuICAgICAgICAgICAgICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdG91Y2htb3ZlOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICBpZiAoISBpc1pSZW5kZXJFbGVtZW50KGV2ZW50KSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZXZlbnQgPSB0aGlzLl96cmVuZGVyRXZlbnRGaXhlZChldmVudCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fbW91c2Vtb3ZlSGFuZGxlcihldmVudCk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2lzRHJhZ2dpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRUb29sLnN0b3AoZXZlbnQpOy8vIOmYu+atoua1j+iniOWZqOm7mOiupOS6i+S7tu+8jOmHjeimgVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogVG91Y2jnu5PmnZ/lk43lupTlh73mlbBcbiAgICAgICAgICAgICAqIEBpbm5lclxuICAgICAgICAgICAgICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdG91Y2hlbmQ6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgICAgIGlmICghIGlzWlJlbmRlckVsZW1lbnQoZXZlbnQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBldmVudFRvb2wuc3RvcChldmVudCk7Ly8g6Zi75q2i5rWP6KeI5Zmo6buY6K6k5LqL5Lu277yM6YeN6KaBXG4gICAgICAgICAgICAgICAgZXZlbnQgPSB0aGlzLl96cmVuZGVyRXZlbnRGaXhlZChldmVudCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fbW91c2V1cEhhbmRsZXIoZXZlbnQpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHZhciBub3cgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgICAgIGlmIChub3cgLSB0aGlzLl9sYXN0VG91Y2hNb21lbnQgPCBFVkVOVC50b3VjaENsaWNrRGVsYXkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbW9iaWxlRmluZEZpeGVkKGV2ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fY2xpY2tIYW5kbGVyKGV2ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vdyAtIHRoaXMuX2xhc3RDbGlja01vbWVudCA8IEVWRU5ULnRvdWNoQ2xpY2tEZWxheSAvIDIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2RibGNsaWNrSGFuZGxlcihldmVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fbGFzdEhvdmVyICYmIHRoaXMuX2xhc3RIb3Zlci5jbGlja2FibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudFRvb2wuc3RvcChldmVudCk7Ly8g6Zi75q2i5rWP6KeI5Zmo6buY6K6k5LqL5Lu277yM6YeN6KaBXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbGFzdENsaWNrTW9tZW50ID0gbm93O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnBhaW50ZXIuY2xlYXJIb3ZlcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBiaW5k5LiA5Liq5Y+C5pWw55qEZnVuY3Rpb25cbiAgICAgICAgICogXG4gICAgICAgICAqIEBpbm5lclxuICAgICAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBoYW5kbGVyIOimgWJpbmTnmoRmdW5jdGlvblxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gY29udGV4dCDov5DooYzml7Z0aGlz546v5aKDXG4gICAgICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gYmluZDFBcmcoaGFuZGxlciwgY29udGV4dCkge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGhhbmRsZXIuY2FsbChjb250ZXh0LCBlKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgLyoqZnVuY3Rpb24gYmluZDJBcmcoaGFuZGxlciwgY29udGV4dCkge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChhcmcxLCBhcmcyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGhhbmRsZXIuY2FsbChjb250ZXh0LCBhcmcxLCBhcmcyKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0qL1xuXG4gICAgICAgIGZ1bmN0aW9uIGJpbmQzQXJnKGhhbmRsZXIsIGNvbnRleHQpIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoYXJnMSwgYXJnMiwgYXJnMykge1xuICAgICAgICAgICAgICAgIHJldHVybiBoYW5kbGVyLmNhbGwoY29udGV4dCwgYXJnMSwgYXJnMiwgYXJnMyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIC8qKlxuICAgICAgICAgKiDkuLrmjqfliLbnsbvlrp7kvovliJ3lp4vljJZkb20g5LqL5Lu25aSE55CG5Ye95pWwXG4gICAgICAgICAqIFxuICAgICAgICAgKiBAaW5uZXJcbiAgICAgICAgICogQHBhcmFtIHttb2R1bGU6enJlbmRlci9IYW5kbGVyfSBpbnN0YW5jZSDmjqfliLbnsbvlrp7kvotcbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIGluaXREb21IYW5kbGVyKGluc3RhbmNlKSB7XG4gICAgICAgICAgICB2YXIgbGVuID0gZG9tSGFuZGxlck5hbWVzLmxlbmd0aDtcbiAgICAgICAgICAgIHdoaWxlIChsZW4tLSkge1xuICAgICAgICAgICAgICAgIHZhciBuYW1lID0gZG9tSGFuZGxlck5hbWVzW2xlbl07XG4gICAgICAgICAgICAgICAgaW5zdGFuY2VbJ18nICsgbmFtZSArICdIYW5kbGVyJ10gPSBiaW5kMUFyZyhkb21IYW5kbGVyc1tuYW1lXSwgaW5zdGFuY2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBhbGlhcyBtb2R1bGU6enJlbmRlci9IYW5kbGVyXG4gICAgICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAgICAgKiBAZXh0ZW5kcyBtb2R1bGU6enJlbmRlci9taXhpbi9FdmVudGZ1bFxuICAgICAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSByb290IOe7mOWbvuWMuuWfn1xuICAgICAgICAgKiBAcGFyYW0ge21vZHVsZTp6cmVuZGVyL1N0b3JhZ2V9IHN0b3JhZ2UgU3RvcmFnZeWunuS+i1xuICAgICAgICAgKiBAcGFyYW0ge21vZHVsZTp6cmVuZGVyL1BhaW50ZXJ9IHBhaW50ZXIgUGFpbnRlcuWunuS+i1xuICAgICAgICAgKi9cbiAgICAgICAgdmFyIEhhbmRsZXIgPSBmdW5jdGlvbihyb290LCBzdG9yYWdlLCBwYWludGVyKSB7XG4gICAgICAgICAgICAvLyDmt7vliqDkuovku7bliIblj5HlmajnibnmgKdcbiAgICAgICAgICAgIEV2ZW50ZnVsLmNhbGwodGhpcyk7XG5cbiAgICAgICAgICAgIHRoaXMucm9vdCA9IHJvb3Q7XG4gICAgICAgICAgICB0aGlzLnN0b3JhZ2UgPSBzdG9yYWdlO1xuICAgICAgICAgICAgdGhpcy5wYWludGVyID0gcGFpbnRlcjtcblxuICAgICAgICAgICAgLy8g5ZCE56eN5LqL5Lu25qCH6K+G55qE56eB5pyJ5Y+Y6YePXG4gICAgICAgICAgICAvLyB0aGlzLl9oYXNmb3VuZCA9IGZhbHNlOyAgICAgICAgICAgICAgLy/mmK/lkKbmib7liLBob3ZlcuWbvuW9ouWFg+e0oFxuICAgICAgICAgICAgLy8gdGhpcy5fbGFzdEhvdmVyID0gbnVsbDsgICAgICAgICAgICAgIC8v5pyA5ZCO5LiA5LiqaG92ZXLlm77lvaLlhYPntKBcbiAgICAgICAgICAgIC8vIHRoaXMuX21vdXNlRG93blRhcmdldCA9IG51bGw7XG4gICAgICAgICAgICAvLyB0aGlzLl9kcmFnZ2luZ1RhcmdldCA9IG51bGw7ICAgICAgICAgLy/lvZPliY3ooqvmi5bmi73nmoTlm77lvaLlhYPntKBcbiAgICAgICAgICAgIC8vIHRoaXMuX2lzTW91c2VEb3duID0gZmFsc2U7XG4gICAgICAgICAgICAvLyB0aGlzLl9pc0RyYWdnaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAvLyB0aGlzLl9sYXN0TW91c2VEb3duTW9tZW50O1xuICAgICAgICAgICAgLy8gdGhpcy5fbGFzdFRvdWNoTW9tZW50O1xuICAgICAgICAgICAgLy8gdGhpcy5fbGFzdERvd25CdXR0b247XG5cbiAgICAgICAgICAgIHRoaXMuX2xhc3RYID0gXG4gICAgICAgICAgICB0aGlzLl9sYXN0WSA9IFxuICAgICAgICAgICAgdGhpcy5fbW91c2VYID0gXG4gICAgICAgICAgICB0aGlzLl9tb3VzZVkgPSAwO1xuXG4gICAgICAgICAgICB0aGlzLl9maW5kSG92ZXIgPSBiaW5kM0FyZyhmaW5kSG92ZXIsIHRoaXMpO1xuICAgICAgICAgICAgdGhpcy5fZG9tSG92ZXIgPSBwYWludGVyLmdldERvbUhvdmVyKCk7XG4gICAgICAgICAgICBpbml0RG9tSGFuZGxlcih0aGlzKTtcblxuICAgICAgICAgICAgLy8g5Yid5aeL5YyW77yM5LqL5Lu257uR5a6a77yM5pSv5oyB55qE5omA5pyJ5LqL5Lu26YO955Sx5aaC5LiL5Y6f55Sf5LqL5Lu26K6h566X5b6X5p2lXG4gICAgICAgICAgICBpZiAod2luZG93LmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdGhpcy5fcmVzaXplSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKGVudi5vcy50YWJsZXQgfHwgZW52Lm9zLnBob25lKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIG1vYmlsZeaUr+aMgVxuICAgICAgICAgICAgICAgICAgICByb290LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLl90b3VjaHN0YXJ0SGFuZGxlcik7XG4gICAgICAgICAgICAgICAgICAgIHJvb3QuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdGhpcy5fdG91Y2htb3ZlSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgICAgIHJvb3QuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0aGlzLl90b3VjaGVuZEhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gbW9iaWxl55qEY2xpY2svbW92ZS91cC9kb3du6Ieq5bex5qih5oufXG4gICAgICAgICAgICAgICAgICAgIHJvb3QuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLl9jbGlja0hhbmRsZXIpO1xuICAgICAgICAgICAgICAgICAgICByb290LmFkZEV2ZW50TGlzdGVuZXIoJ2RibGNsaWNrJywgdGhpcy5fZGJsY2xpY2tIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICAgICAgcm9vdC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXdoZWVsJywgdGhpcy5fbW91c2V3aGVlbEhhbmRsZXIpO1xuICAgICAgICAgICAgICAgICAgICByb290LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMuX21vdXNlbW92ZUhhbmRsZXIpO1xuICAgICAgICAgICAgICAgICAgICByb290LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuX21vdXNlZG93bkhhbmRsZXIpO1xuICAgICAgICAgICAgICAgICAgICByb290LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLl9tb3VzZXVwSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgfSBcbiAgICAgICAgICAgICAgICByb290LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTU1vdXNlU2Nyb2xsJywgdGhpcy5fbW91c2V3aGVlbEhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIHJvb3QuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VvdXQnLCB0aGlzLl9tb3VzZW91dEhhbmRsZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgd2luZG93LmF0dGFjaEV2ZW50KCdvbnJlc2l6ZScsIHRoaXMuX3Jlc2l6ZUhhbmRsZXIpO1xuXG4gICAgICAgICAgICAgICAgcm9vdC5hdHRhY2hFdmVudCgnb25jbGljaycsIHRoaXMuX2NsaWNrSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgLy9yb290LmF0dGFjaEV2ZW50KCdvbmRibGNsaWNrICcsIHRoaXMuX2RibGNsaWNrSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgcm9vdC5vbmRibGNsaWNrID0gdGhpcy5fZGJsY2xpY2tIYW5kbGVyO1xuICAgICAgICAgICAgICAgIHJvb3QuYXR0YWNoRXZlbnQoJ29ubW91c2V3aGVlbCcsIHRoaXMuX21vdXNld2hlZWxIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICByb290LmF0dGFjaEV2ZW50KCdvbm1vdXNlbW92ZScsIHRoaXMuX21vdXNlbW92ZUhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIHJvb3QuYXR0YWNoRXZlbnQoJ29ubW91c2VvdXQnLCB0aGlzLl9tb3VzZW91dEhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIHJvb3QuYXR0YWNoRXZlbnQoJ29ubW91c2Vkb3duJywgdGhpcy5fbW91c2Vkb3duSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgcm9vdC5hdHRhY2hFdmVudCgnb25tb3VzZXVwJywgdGhpcy5fbW91c2V1cEhhbmRsZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDoh6rlrprkuYnkuovku7bnu5HlrppcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50TmFtZSDkuovku7blkI3np7DvvIxyZXNpemXvvIxob3Zlcu+8jGRyYWfvvIxldGN+XG4gICAgICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGhhbmRsZXIg5ZON5bqU5Ye95pWwXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbY29udGV4dF0g5ZON5bqU5Ye95pWwXG4gICAgICAgICAqL1xuICAgICAgICBIYW5kbGVyLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uIChldmVudE5hbWUsIGhhbmRsZXIsIGNvbnRleHQpIHtcbiAgICAgICAgICAgIHRoaXMuYmluZChldmVudE5hbWUsIGhhbmRsZXIsIGNvbnRleHQpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOiHquWumuS5ieS6i+S7tuino+e7kVxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnROYW1lIOS6i+S7tuWQjeensO+8jHJlc2l6Ze+8jGhvdmVy77yMZHJhZ++8jGV0Y35cbiAgICAgICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaGFuZGxlciDlk43lupTlh73mlbBcbiAgICAgICAgICovXG4gICAgICAgIEhhbmRsZXIucHJvdG90eXBlLnVuID0gZnVuY3Rpb24gKGV2ZW50TmFtZSwgaGFuZGxlcikge1xuICAgICAgICAgICAgdGhpcy51bmJpbmQoZXZlbnROYW1lLCBoYW5kbGVyKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDkuovku7bop6blj5FcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50TmFtZSDkuovku7blkI3np7DvvIxyZXNpemXvvIxob3Zlcu+8jGRyYWfvvIxldGN+XG4gICAgICAgICAqIEBwYXJhbSB7ZXZlbnQ9fSBldmVudEFyZ3MgZXZlbnQgZG9t5LqL5Lu25a+56LGhXG4gICAgICAgICAqL1xuICAgICAgICBIYW5kbGVyLnByb3RvdHlwZS50cmlnZ2VyID0gZnVuY3Rpb24gKGV2ZW50TmFtZSwgZXZlbnRBcmdzKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKGV2ZW50TmFtZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgRVZFTlQuUkVTSVpFOlxuICAgICAgICAgICAgICAgIGNhc2UgRVZFTlQuQ0xJQ0s6XG4gICAgICAgICAgICAgICAgY2FzZSBFVkVOVC5EQkxDTElDSzpcbiAgICAgICAgICAgICAgICBjYXNlIEVWRU5ULk1PVVNFV0hFRUw6XG4gICAgICAgICAgICAgICAgY2FzZSBFVkVOVC5NT1VTRU1PVkU6XG4gICAgICAgICAgICAgICAgY2FzZSBFVkVOVC5NT1VTRURPV046XG4gICAgICAgICAgICAgICAgY2FzZSBFVkVOVC5NT1VTRVVQOlxuICAgICAgICAgICAgICAgIGNhc2UgRVZFTlQuTU9VU0VPVVQ6XG4gICAgICAgICAgICAgICAgICAgIHRoaXNbJ18nICsgZXZlbnROYW1lICsgJ0hhbmRsZXInXShldmVudEFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICog6YeK5pS+77yM6Kej57uR5omA5pyJ5LqL5Lu2XG4gICAgICAgICAqL1xuICAgICAgICBIYW5kbGVyLnByb3RvdHlwZS5kaXNwb3NlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHJvb3QgPSB0aGlzLnJvb3Q7XG5cbiAgICAgICAgICAgIGlmICh3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdyZXNpemUnLCB0aGlzLl9yZXNpemVIYW5kbGVyKTtcblxuICAgICAgICAgICAgICAgIGlmIChlbnYub3MudGFibGV0IHx8IGVudi5vcy5waG9uZSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBtb2JpbGXmlK/mjIFcbiAgICAgICAgICAgICAgICAgICAgcm9vdC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5fdG91Y2hzdGFydEhhbmRsZXIpO1xuICAgICAgICAgICAgICAgICAgICByb290LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIHRoaXMuX3RvdWNobW92ZUhhbmRsZXIpO1xuICAgICAgICAgICAgICAgICAgICByb290LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgdGhpcy5fdG91Y2hlbmRIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIG1vYmlsZeeahGNsaWNr6Ieq5bex5qih5oufXG4gICAgICAgICAgICAgICAgICAgIHJvb3QucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLl9jbGlja0hhbmRsZXIpO1xuICAgICAgICAgICAgICAgICAgICByb290LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2RibGNsaWNrJywgdGhpcy5fZGJsY2xpY2tIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICAgICAgcm9vdC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZXdoZWVsJywgdGhpcy5fbW91c2V3aGVlbEhhbmRsZXIpO1xuICAgICAgICAgICAgICAgICAgICByb290LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMuX21vdXNlbW92ZUhhbmRsZXIpO1xuICAgICAgICAgICAgICAgICAgICByb290LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuX21vdXNlZG93bkhhbmRsZXIpO1xuICAgICAgICAgICAgICAgICAgICByb290LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLl9tb3VzZXVwSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJvb3QucmVtb3ZlRXZlbnRMaXN0ZW5lcignRE9NTW91c2VTY3JvbGwnLCB0aGlzLl9tb3VzZXdoZWVsSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgcm9vdC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW91dCcsIHRoaXMuX21vdXNlb3V0SGFuZGxlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cuZGV0YWNoRXZlbnQoJ29ucmVzaXplJywgdGhpcy5fcmVzaXplSGFuZGxlcik7XG5cbiAgICAgICAgICAgICAgICByb290LmRldGFjaEV2ZW50KCdvbmNsaWNrJywgdGhpcy5fY2xpY2tIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICByb290LmRldGFjaEV2ZW50KCdkYmxjbGljaycsIHRoaXMuX2RibGNsaWNrSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgcm9vdC5kZXRhY2hFdmVudCgnb25tb3VzZXdoZWVsJywgdGhpcy5fbW91c2V3aGVlbEhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIHJvb3QuZGV0YWNoRXZlbnQoJ29ubW91c2Vtb3ZlJywgdGhpcy5fbW91c2Vtb3ZlSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgcm9vdC5kZXRhY2hFdmVudCgnb25tb3VzZW91dCcsIHRoaXMuX21vdXNlb3V0SGFuZGxlcik7XG4gICAgICAgICAgICAgICAgcm9vdC5kZXRhY2hFdmVudCgnb25tb3VzZWRvd24nLCB0aGlzLl9tb3VzZWRvd25IYW5kbGVyKTtcbiAgICAgICAgICAgICAgICByb290LmRldGFjaEV2ZW50KCdvbm1vdXNldXAnLCB0aGlzLl9tb3VzZXVwSGFuZGxlcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMucm9vdCA9XG4gICAgICAgICAgICB0aGlzLl9kb21Ib3ZlciA9XG4gICAgICAgICAgICB0aGlzLnN0b3JhZ2UgPVxuICAgICAgICAgICAgdGhpcy5wYWludGVyID0gbnVsbDtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy51bigpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDmi5bmi73lvIDlp4tcbiAgICAgICAgICogXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCDkuovku7blr7nosaFcbiAgICAgICAgICovXG4gICAgICAgIEhhbmRsZXIucHJvdG90eXBlLl9wcm9jZXNzRHJhZ1N0YXJ0ID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICB2YXIgX2xhc3RIb3ZlciA9IHRoaXMuX2xhc3RIb3ZlcjtcblxuICAgICAgICAgICAgaWYgKHRoaXMuX2lzTW91c2VEb3duXG4gICAgICAgICAgICAgICAgJiYgX2xhc3RIb3ZlclxuICAgICAgICAgICAgICAgICYmIF9sYXN0SG92ZXIuZHJhZ2dhYmxlXG4gICAgICAgICAgICAgICAgJiYgIXRoaXMuX2RyYWdnaW5nVGFyZ2V0XG4gICAgICAgICAgICAgICAgJiYgdGhpcy5fbW91c2VEb3duVGFyZ2V0ID09IF9sYXN0SG92ZXJcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIC8vIOaLluaLveeCueWHu+eUn+aViOaXtumVv+mYgOmXqO+8jOafkOS6m+WcuuaZr+mcgOimgemZjeS9juaLluaLveaVj+aEn+W6plxuICAgICAgICAgICAgICAgIGlmIChfbGFzdEhvdmVyLmRyYWdFbmFibGVUaW1lICYmIFxuICAgICAgICAgICAgICAgICAgICBuZXcgRGF0ZSgpIC0gdGhpcy5fbGFzdE1vdXNlRG93bk1vbWVudCA8IF9sYXN0SG92ZXIuZHJhZ0VuYWJsZVRpbWVcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBfZHJhZ2dpbmdUYXJnZXQgPSBfbGFzdEhvdmVyO1xuICAgICAgICAgICAgICAgIHRoaXMuX2RyYWdnaW5nVGFyZ2V0ID0gX2RyYWdnaW5nVGFyZ2V0O1xuICAgICAgICAgICAgICAgIHRoaXMuX2lzRHJhZ2dpbmcgPSAxO1xuXG4gICAgICAgICAgICAgICAgX2RyYWdnaW5nVGFyZ2V0LmludmlzaWJsZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhpcy5zdG9yYWdlLm1vZChfZHJhZ2dpbmdUYXJnZXQuaWQpO1xuXG4gICAgICAgICAgICAgICAgLy8g5YiG5Y+RY29uZmlnLkVWRU5ULkRSQUdTVEFSVOS6i+S7tlxuICAgICAgICAgICAgICAgIHRoaXMuX2Rpc3BhdGNoQWdlbmN5KFxuICAgICAgICAgICAgICAgICAgICBfZHJhZ2dpbmdUYXJnZXQsXG4gICAgICAgICAgICAgICAgICAgIEVWRU5ULkRSQUdTVEFSVCxcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHRoaXMucGFpbnRlci5yZWZyZXNoKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOaLluaLvei/m+WFpeebruagh+WFg+e0oFxuICAgICAgICAgKiBcbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IOS6i+S7tuWvueixoVxuICAgICAgICAgKi9cbiAgICAgICAgSGFuZGxlci5wcm90b3R5cGUuX3Byb2Nlc3NEcmFnRW50ZXIgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9kcmFnZ2luZ1RhcmdldCkge1xuICAgICAgICAgICAgICAgIC8vIOWIhuWPkWNvbmZpZy5FVkVOVC5EUkFHRU5URVLkuovku7ZcbiAgICAgICAgICAgICAgICB0aGlzLl9kaXNwYXRjaEFnZW5jeShcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbGFzdEhvdmVyLFxuICAgICAgICAgICAgICAgICAgICBFVkVOVC5EUkFHRU5URVIsXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9kcmFnZ2luZ1RhcmdldFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOaLluaLveWcqOebruagh+WFg+e0oOS4iuenu+WKqFxuICAgICAgICAgKiBcbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IOS6i+S7tuWvueixoVxuICAgICAgICAgKi9cbiAgICAgICAgSGFuZGxlci5wcm90b3R5cGUuX3Byb2Nlc3NEcmFnT3ZlciA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2RyYWdnaW5nVGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgLy8g5YiG5Y+RY29uZmlnLkVWRU5ULkRSQUdPVkVS5LqL5Lu2XG4gICAgICAgICAgICAgICAgdGhpcy5fZGlzcGF0Y2hBZ2VuY3koXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2xhc3RIb3ZlcixcbiAgICAgICAgICAgICAgICAgICAgRVZFTlQuRFJBR09WRVIsXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9kcmFnZ2luZ1RhcmdldFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOaLluaLveemu+W8gOebruagh+WFg+e0oFxuICAgICAgICAgKiBcbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IOS6i+S7tuWvueixoVxuICAgICAgICAgKi9cbiAgICAgICAgSGFuZGxlci5wcm90b3R5cGUuX3Byb2Nlc3NEcmFnTGVhdmUgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9kcmFnZ2luZ1RhcmdldCkge1xuICAgICAgICAgICAgICAgIC8vIOWIhuWPkWNvbmZpZy5FVkVOVC5EUkFHTEVBVkXkuovku7ZcbiAgICAgICAgICAgICAgICB0aGlzLl9kaXNwYXRjaEFnZW5jeShcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbGFzdEhvdmVyLFxuICAgICAgICAgICAgICAgICAgICBFVkVOVC5EUkFHTEVBVkUsXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9kcmFnZ2luZ1RhcmdldFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOaLluaLveWcqOebruagh+WFg+e0oOS4iuWujOaIkFxuICAgICAgICAgKiBcbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IOS6i+S7tuWvueixoVxuICAgICAgICAgKi9cbiAgICAgICAgSGFuZGxlci5wcm90b3R5cGUuX3Byb2Nlc3NEcm9wID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fZHJhZ2dpbmdUYXJnZXQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9kcmFnZ2luZ1RhcmdldC5pbnZpc2libGUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB0aGlzLnN0b3JhZ2UubW9kKHRoaXMuX2RyYWdnaW5nVGFyZ2V0LmlkKTtcbiAgICAgICAgICAgICAgICB0aGlzLnBhaW50ZXIucmVmcmVzaCgpO1xuXG4gICAgICAgICAgICAgICAgLy8g5YiG5Y+RY29uZmlnLkVWRU5ULkRST1Dkuovku7ZcbiAgICAgICAgICAgICAgICB0aGlzLl9kaXNwYXRjaEFnZW5jeShcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbGFzdEhvdmVyLFxuICAgICAgICAgICAgICAgICAgICBFVkVOVC5EUk9QLFxuICAgICAgICAgICAgICAgICAgICBldmVudCxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZHJhZ2dpbmdUYXJnZXRcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDmi5bmi73nu5PmnZ9cbiAgICAgICAgICogXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCDkuovku7blr7nosaFcbiAgICAgICAgICovXG4gICAgICAgIEhhbmRsZXIucHJvdG90eXBlLl9wcm9jZXNzRHJhZ0VuZCA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2RyYWdnaW5nVGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgLy8g5YiG5Y+RY29uZmlnLkVWRU5ULkRSQUdFTkTkuovku7ZcbiAgICAgICAgICAgICAgICB0aGlzLl9kaXNwYXRjaEFnZW5jeShcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZHJhZ2dpbmdUYXJnZXQsXG4gICAgICAgICAgICAgICAgICAgIEVWRU5ULkRSQUdFTkQsXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50XG4gICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuX2xhc3RIb3ZlciA9IG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuX2lzRHJhZ2dpbmcgPSAwO1xuICAgICAgICAgICAgdGhpcy5fZHJhZ2dpbmdUYXJnZXQgPSBudWxsO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDpvKDmoIflnKjmn5DkuKrlm77lvaLlhYPntKDkuIrnp7vliqhcbiAgICAgICAgICogXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCDkuovku7blr7nosaFcbiAgICAgICAgICovXG4gICAgICAgIEhhbmRsZXIucHJvdG90eXBlLl9wcm9jZXNzT3ZlclNoYXBlID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICAvLyDliIblj5Fjb25maWcuRVZFTlQuTU9VU0VPVkVS5LqL5Lu2XG4gICAgICAgICAgICB0aGlzLl9kaXNwYXRjaEFnZW5jeSh0aGlzLl9sYXN0SG92ZXIsIEVWRU5ULk1PVVNFT1ZFUiwgZXZlbnQpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDpvKDmoIfnprvlvIDmn5DkuKrlm77lvaLlhYPntKBcbiAgICAgICAgICogXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCDkuovku7blr7nosaFcbiAgICAgICAgICovXG4gICAgICAgIEhhbmRsZXIucHJvdG90eXBlLl9wcm9jZXNzT3V0U2hhcGUgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIC8vIOWIhuWPkWNvbmZpZy5FVkVOVC5NT1VTRU9VVOS6i+S7tlxuICAgICAgICAgICAgdGhpcy5fZGlzcGF0Y2hBZ2VuY3kodGhpcy5fbGFzdEhvdmVyLCBFVkVOVC5NT1VTRU9VVCwgZXZlbnQpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDkuovku7bliIblj5Hku6PnkIZcbiAgICAgICAgICogXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSB0YXJnZXRTaGFwZSDnm67moIflm77lvaLlhYPntKBcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50TmFtZSDkuovku7blkI3np7BcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IOS6i+S7tuWvueixoVxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdD19IGRyYWdnZWRTaGFwZSDmi5bmi73kuovku7bnibnmnInvvIzlvZPliY3ooqvmi5bmi73lm77lvaLlhYPntKBcbiAgICAgICAgICovXG4gICAgICAgIEhhbmRsZXIucHJvdG90eXBlLl9kaXNwYXRjaEFnZW5jeSA9IGZ1bmN0aW9uICh0YXJnZXRTaGFwZSwgZXZlbnROYW1lLCBldmVudCwgZHJhZ2dlZFNoYXBlKSB7XG4gICAgICAgICAgICB2YXIgZXZlbnRIYW5kbGVyID0gJ29uJyArIGV2ZW50TmFtZTtcbiAgICAgICAgICAgIHZhciBldmVudFBhY2tldCA9IHtcbiAgICAgICAgICAgICAgICB0eXBlIDogZXZlbnROYW1lLFxuICAgICAgICAgICAgICAgIGV2ZW50IDogZXZlbnQsXG4gICAgICAgICAgICAgICAgdGFyZ2V0IDogdGFyZ2V0U2hhcGUsXG4gICAgICAgICAgICAgICAgY2FuY2VsQnViYmxlOiBmYWxzZVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIGVsID0gdGFyZ2V0U2hhcGU7XG5cbiAgICAgICAgICAgIGlmIChkcmFnZ2VkU2hhcGUpIHtcbiAgICAgICAgICAgICAgICBldmVudFBhY2tldC5kcmFnZ2VkID0gZHJhZ2dlZFNoYXBlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB3aGlsZSAoZWwpIHtcbiAgICAgICAgICAgICAgICBlbFtldmVudEhhbmRsZXJdIFxuICAgICAgICAgICAgICAgICYmIChldmVudFBhY2tldC5jYW5jZWxCdWJibGUgPSBlbFtldmVudEhhbmRsZXJdKGV2ZW50UGFja2V0KSk7XG4gICAgICAgICAgICAgICAgZWwuZGlzcGF0Y2goZXZlbnROYW1lLCBldmVudFBhY2tldCk7XG5cbiAgICAgICAgICAgICAgICBlbCA9IGVsLnBhcmVudDtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnRQYWNrZXQuY2FuY2VsQnViYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRhcmdldFNoYXBlKSB7XG4gICAgICAgICAgICAgICAgLy8g5YaS5rOh5Yiw6aG257qnIHpyZW5kZXIg5a+56LGhXG4gICAgICAgICAgICAgICAgaWYgKCFldmVudFBhY2tldC5jYW5jZWxCdWJibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwYXRjaChldmVudE5hbWUsIGV2ZW50UGFja2V0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICghZHJhZ2dlZFNoYXBlKSB7XG4gICAgICAgICAgICAgICAgLy8g5pegaG92ZXLnm67moIfvvIzml6Dmi5bmi73lr7nosaHvvIzljp/nlJ/kuovku7bliIblj5FcbiAgICAgICAgICAgICAgICB2YXIgZXZlT2JqID0ge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBldmVudE5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50OiBldmVudFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwYXRjaChldmVudE5hbWUsIGV2ZU9iaik7XG4gICAgICAgICAgICAgICAgLy8g5YiG5Y+R5LqL5Lu25Yiw55So5oi36Ieq5a6a5LmJ5bGCXG4gICAgICAgICAgICAgICAgdGhpcy5wYWludGVyLmVhY2hPdGhlckxheWVyKGZ1bmN0aW9uIChsYXllcikge1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mKGxheWVyW2V2ZW50SGFuZGxlcl0pID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxheWVyW2V2ZW50SGFuZGxlcl0oZXZlT2JqKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAobGF5ZXIuZGlzcGF0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxheWVyLmRpc3BhdGNoKGV2ZW50TmFtZSwgZXZlT2JqKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDov63ku6Plr7vmib5ob3ZlciBzaGFwZVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKiBAbWV0aG9kXG4gICAgICAgICAqL1xuICAgICAgICBIYW5kbGVyLnByb3RvdHlwZS5faXRlcmF0ZUFuZEZpbmRIb3ZlciA9IChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBpbnZUcmFuc2Zvcm0gPSBtYXQyZC5jcmVhdGUoKTtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgbGlzdCA9IHRoaXMuc3RvcmFnZS5nZXRTaGFwZUxpc3QoKTtcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudFpMZXZlbDtcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudExheWVyO1xuICAgICAgICAgICAgICAgIHZhciB0bXAgPSBbIDAsIDAgXTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gbGlzdC5sZW5ndGggLSAxOyBpID49IDAgOyBpLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNoYXBlID0gbGlzdFtpXTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudFpMZXZlbCAhPT0gc2hhcGUuemxldmVsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50TGF5ZXIgPSB0aGlzLnBhaW50ZXIuZ2V0TGF5ZXIoc2hhcGUuemxldmVsLCBjdXJyZW50TGF5ZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdG1wWzBdID0gdGhpcy5fbW91c2VYO1xuICAgICAgICAgICAgICAgICAgICAgICAgdG1wWzFdID0gdGhpcy5fbW91c2VZO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudExheWVyLm5lZWRUcmFuc2Zvcm0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXQyZC5pbnZlcnQoaW52VHJhbnNmb3JtLCBjdXJyZW50TGF5ZXIudHJhbnNmb3JtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2ZWMyLmFwcGx5VHJhbnNmb3JtKHRtcCwgdG1wLCBpbnZUcmFuc2Zvcm0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX2ZpbmRIb3ZlcihzaGFwZSwgdG1wWzBdLCB0bXBbMV0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pKCk7XG4gICAgICAgIFxuICAgICAgICAvLyB0b3VjaOaMh+WwlumUmeinieeahOWwneivleWBj+enu+mHj+mFjee9rlxuICAgICAgICB2YXIgTU9CSUxFX1RPVUNIX09GRlNFVFMgPSBbXG4gICAgICAgICAgICB7IHg6IDEwIH0sXG4gICAgICAgICAgICB7IHg6IC0yMCB9LFxuICAgICAgICAgICAgeyB4OiAxMCwgeTogMTAgfSxcbiAgICAgICAgICAgIHsgeTogLTIwIH1cbiAgICAgICAgXTtcblxuICAgICAgICAvLyB0b3VjaOacieaMh+WwlumUmeinie+8jOWbm+WQkeWwneivle+8jOiuqXRvdWNo5LiK55qE54K55Ye75pu05aW96Kem5Y+R5LqL5Lu2XG4gICAgICAgIEhhbmRsZXIucHJvdG90eXBlLl9tb2JpbGVGaW5kRml4ZWQgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIHRoaXMuX2xhc3RIb3ZlciA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLl9tb3VzZVggPSBldmVudC56cmVuZGVyWDtcbiAgICAgICAgICAgIHRoaXMuX21vdXNlWSA9IGV2ZW50LnpyZW5kZXJZO1xuXG4gICAgICAgICAgICB0aGlzLl9ldmVudCA9IGV2ZW50O1xuXG4gICAgICAgICAgICB0aGlzLl9pdGVyYXRlQW5kRmluZEhvdmVyKCk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgIXRoaXMuX2xhc3RIb3ZlciAmJiBpIDwgTU9CSUxFX1RPVUNIX09GRlNFVFMubGVuZ3RoIDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIG9mZnNldCA9IE1PQklMRV9UT1VDSF9PRkZTRVRTWyBpIF07XG4gICAgICAgICAgICAgICAgb2Zmc2V0LnggJiYgKHRoaXMuX21vdXNlWCArPSBvZmZzZXQueCk7XG4gICAgICAgICAgICAgICAgb2Zmc2V0LnkgJiYgKHRoaXMuX21vdXNlWSArPSBvZmZzZXQueSk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9pdGVyYXRlQW5kRmluZEhvdmVyKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLl9sYXN0SG92ZXIpIHtcbiAgICAgICAgICAgICAgICBldmVudC56cmVuZGVyWCA9IHRoaXMuX21vdXNlWDtcbiAgICAgICAgICAgICAgICBldmVudC56cmVuZGVyWSA9IHRoaXMuX21vdXNlWTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICog6L+t5Luj5Ye95pWw77yM5p+l5om+aG92ZXLliLDnmoTlm77lvaLlhYPntKDlubbljbPml7blgZrkupvkuovku7bliIblj5FcbiAgICAgICAgICogXG4gICAgICAgICAqIEBpbm5lclxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gc2hhcGUg5Zu+5b2i5YWD57SgXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB4XG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB5XG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBmaW5kSG92ZXIoc2hhcGUsIHgsIHkpIHtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAodGhpcy5fZHJhZ2dpbmdUYXJnZXQgJiYgdGhpcy5fZHJhZ2dpbmdUYXJnZXQuaWQgPT0gc2hhcGUuaWQpIC8vIOi/reS7o+WIsOW9k+WJjeaLluaLveeahOWbvuW9ouS4ilxuICAgICAgICAgICAgICAgIHx8IHNoYXBlLmlzU2lsZW50KCkgLy8g5omT6YWx5rK555qE6Lev6L+H77yM5ZWl6YO95LiN5ZON5bqU55qEc2hhcGV+XG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBldmVudCA9IHRoaXMuX2V2ZW50O1xuICAgICAgICAgICAgaWYgKHNoYXBlLmlzQ292ZXIoeCwgeSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2hhcGUuaG92ZXJhYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RvcmFnZS5hZGRIb3ZlcihzaGFwZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIOafpeaJvuaYr+WQpuWcqCBjbGlwU2hhcGUg5LitXG4gICAgICAgICAgICAgICAgdmFyIHAgPSBzaGFwZS5wYXJlbnQ7XG4gICAgICAgICAgICAgICAgd2hpbGUgKHApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHAuY2xpcFNoYXBlICYmICFwLmNsaXBTaGFwZS5pc0NvdmVyKHRoaXMuX21vdXNlWCwgdGhpcy5fbW91c2VZKSkgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOW3sue7j+iiq+elluWFiCBjbGlwIOaOieS6hlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHAgPSBwLnBhcmVudDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fbGFzdEhvdmVyICE9IHNoYXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2Nlc3NPdXRTaGFwZShldmVudCk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8g5Y+v6IO95Ye6546wY29uZmlnLkVWRU5ULkRSQUdMRUFWReS6i+S7tlxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9jZXNzRHJhZ0xlYXZlKGV2ZW50KTtcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9sYXN0SG92ZXIgPSBzaGFwZTtcblxuICAgICAgICAgICAgICAgICAgICAvLyDlj6/og73lh7rnjrBjb25maWcuRVZFTlQuRFJBR0VOVEVS5LqL5Lu2XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2Nlc3NEcmFnRW50ZXIoZXZlbnQpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMuX3Byb2Nlc3NPdmVyU2hhcGUoZXZlbnQpO1xuXG4gICAgICAgICAgICAgICAgLy8g5Y+v6IO95Ye6546wY29uZmlnLkVWRU5ULkRSQUdPVkVSXG4gICAgICAgICAgICAgICAgdGhpcy5fcHJvY2Vzc0RyYWdPdmVyKGV2ZW50KTtcblxuICAgICAgICAgICAgICAgIHRoaXMuX2hhc2ZvdW5kID0gMTtcblxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlOyAgICAvLyDmib7liLDliJnkuK3mlq3ov63ku6Pmn6Xmib5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWmguaenOWtmOWcqOesrOS4ieaWueW1jOWFpeeahOS4gOS6m2RvbeinpuWPkeeahOS6i+S7tu+8jOaIlnRvdWNo5LqL5Lu277yM6ZyA6KaB6L2s5o2i5LiA5LiL5LqL5Lu25Z2Q5qCHXG4gICAgICAgICAqIFxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgSGFuZGxlci5wcm90b3R5cGUuX3pyZW5kZXJFdmVudEZpeGVkID0gZnVuY3Rpb24gKGV2ZW50LCBpc1RvdWNoKSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQuenJlbmRlckZpeGVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGV2ZW50O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIWlzVG91Y2gpIHtcbiAgICAgICAgICAgICAgICBldmVudCA9IGV2ZW50IHx8IHdpbmRvdy5ldmVudDtcbiAgICAgICAgICAgICAgICAvLyDov5vlhaXlr7nosaHkvJjlhYh+XG4gICAgICAgICAgICAgICAgdmFyIHRhcmdldCA9IGV2ZW50LnRvRWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfHwgZXZlbnQucmVsYXRlZFRhcmdldFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfHwgZXZlbnQuc3JjRWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfHwgZXZlbnQudGFyZ2V0O1xuXG4gICAgICAgICAgICAgICAgaWYgKHRhcmdldCAmJiB0YXJnZXQgIT0gdGhpcy5fZG9tSG92ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQuenJlbmRlclggPSAodHlwZW9mIGV2ZW50Lm9mZnNldFggIT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IGV2ZW50Lm9mZnNldFhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IGV2ZW50LmxheWVyWClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyB0YXJnZXQub2Zmc2V0TGVmdDtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQuenJlbmRlclkgPSAodHlwZW9mIGV2ZW50Lm9mZnNldFkgIT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IGV2ZW50Lm9mZnNldFlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IGV2ZW50LmxheWVyWSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyB0YXJnZXQub2Zmc2V0VG9wO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciB0b3VjaCA9IGV2ZW50LnR5cGUgIT0gJ3RvdWNoZW5kJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IGV2ZW50LnRhcmdldFRvdWNoZXNbMF1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBldmVudC5jaGFuZ2VkVG91Y2hlc1swXTtcbiAgICAgICAgICAgICAgICBpZiAodG91Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJCb3VuZGluZyA9IHRoaXMucGFpbnRlci5fZG9tUm9vdC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gdG91Y2jkuovku7blnZDmoIfmmK/lhajlsY/nmoR+XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnpyZW5kZXJYID0gdG91Y2guY2xpZW50WCAtIHJCb3VuZGluZy5sZWZ0O1xuICAgICAgICAgICAgICAgICAgICBldmVudC56cmVuZGVyWSA9IHRvdWNoLmNsaWVudFkgLSByQm91bmRpbmcudG9wO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZXZlbnQuenJlbmRlckZpeGVkID0gMTtcbiAgICAgICAgICAgIHJldHVybiBldmVudDtcbiAgICAgICAgfTtcblxuICAgICAgICB1dGlsLm1lcmdlKEhhbmRsZXIucHJvdG90eXBlLCBFdmVudGZ1bC5wcm90b3R5cGUsIHRydWUpO1xuXG4gICAgICAgIHJldHVybiBIYW5kbGVyO1xuICAgIH1cbik7XG4iXSwiZmlsZSI6InBsdWdpbnMvenJlbmRlci0yLjEuMC9zcmMvSGFuZGxlci5qcyJ9
