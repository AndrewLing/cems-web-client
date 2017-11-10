/*!
 * ZRender, a high performance canvas library.
 *  
 * Copyright (c) 2013, Baidu Inc.
 * All rights reserved.
 * 
 * LICENSE
 * https://github.com/ecomfe/zrender/blob/master/LICENSE.txt
 */
define(
    function(require) {
        /*
         * HTML5 Canvas for Internet Explorer!
         * Modern browsers like Firefox, Safari, Chrome and Opera support
         * the HTML5 canvas tag to allow 2D command-based drawing.
         * ExplorerCanvas brings the same functionality to Internet Explorer.
         * To use, web developers only need to include a single script tag
         * in their existing web pages.
         *
         * https://code.google.com/p/explorercanvas/
         * http://explorercanvas.googlecode.com/svn/trunk/excanvas.js
         */
        // 核心代码会生成一个全局变量 G_vmlCanvasManager，模块改造后借用于快速判断canvas支持
        require('./dep/excanvas');

        var util = require('./tool/util');
        var log = require('./tool/log');
        var guid = require('./tool/guid');

        var Handler = require('./Handler');
        var Painter = require('./Painter');
        var Storage = require('./Storage');
        var Animation = require('./animation/Animation');

        var _instances = {};    // ZRender实例map索引

        /**
         * @exports zrender
         * @author Kener (@Kener-林峰, kener.linfeng@gmail.com)
         *         pissang (https://www.github.com/pissang)
         */
        var zrender = {};
        /**
         * @type {string}
         */
        zrender.version = '2.1.0';

        /**
         * 创建zrender实例
         *
         * @param {HTMLElement} dom 绘图容器
         * @return {module:zrender/ZRender} ZRender实例
         */
        // 不让外部直接new ZRender实例，为啥？
        // 不为啥，提供全局可控同时减少全局污染和降低命名冲突的风险！
        zrender.init = function(dom) {
            var zr = new ZRender(guid(), dom);
            _instances[zr.id] = zr;
            return zr;
        };

        /**
         * zrender实例销毁
         * @param {module:zrender/ZRender} zr ZRender对象，不传则销毁全部
         */
        // 在_instances里的索引也会删除了
        // 管生就得管死，可以通过zrender.dispose(zr)销毁指定ZRender实例
        // 当然也可以直接zr.dispose()自己销毁
        zrender.dispose = function (zr) {
            if (zr) {
                zr.dispose();
            }
            else {
                for (var key in _instances) {
                    _instances[key].dispose();
                }
                _instances = {};
            }

            return zrender;
        };

        /**
         * 获取zrender实例
         * @param {string} id ZRender对象索引
         * @return {module:zrender/ZRender}
         */
        zrender.getInstance = function (id) {
            return _instances[id];
        };

        /**
         * 删除zrender实例，ZRender实例dispose时会调用，
         * 删除后getInstance则返回undefined
         * ps: 仅是删除，删除的实例不代表已经dispose了~~
         *     这是一个摆脱全局zrender.dispose()自动销毁的后门，
         *     take care of yourself~
         *
         * @param {string} id ZRender对象索引
         */
        zrender.delInstance = function (id) {
            delete _instances[id];
            return zrender;
        };

        function getFrameCallback(zrInstance) {
            return function () {
                if (zrInstance._needsRefreshNextFrame) {
                    zrInstance.refresh();
                }
            };
        }

        /**
         * @module zrender/ZRender
         */
        /**
         * ZRender接口类，对外可用的所有接口都在这里
         * 非get接口统一返回支持链式调用
         *
         * @constructor
         * @alias module:zrender/ZRender
         * @param {string} id 唯一标识
         * @param {HTMLElement} dom dom对象，不帮你做document.getElementById
         * @return {ZRender} ZRender实例
         */
        var ZRender = function(id, dom) {
            /**
             * 实例 id
             * @type {string}
             */
            this.id = id;
            this.env = require('./tool/env');

            this.storage = new Storage();
            this.painter = new Painter(dom, this.storage);
            this.handler = new Handler(dom, this.storage, this.painter);

            /**
             * @type {module:zrender/animation/Animation}
             */
            this.animation = new Animation({
                stage: {
                    update: getFrameCallback(this)
                }
            });
            this.animation.start();

            var self = this;
            this.painter.refreshNextFrame = function () {
                self.refreshNextFrame();
            };

            this._needsRefreshNextFrame = false;

            // 修改 storage.delFromMap, 每次删除元素之前删除动画
            // FIXME 有点ugly
            var self = this;
            var storage = this.storage;
            var oldDelFromMap = storage.delFromMap;
            storage.delFromMap = function (elId) {
                var el = storage.get(elId);
                self.stopAnimation(el);
                oldDelFromMap.call(storage, elId);
            };
        };

        /**
         * 获取实例唯一标识
         * @return {string}
         */
        ZRender.prototype.getId = function () {
            return this.id;
        };

        /**
         * 添加图形形状到根节点
         * @deprecated Use {@link module:zrender/ZRender.prototype.addElement} instead
         * @param {module:zrender/shape/Base} shape 形状对象，可用属性全集，详见各shape
         */
        ZRender.prototype.addShape = function (shape) {
            this.addElement(shape);
            return this;
        };

        /**
         * 添加组到根节点
         * @deprecated Use {@link module:zrender/ZRender.prototype.addElement} instead
         * @param {module:zrender/Group} group
         */
        ZRender.prototype.addGroup = function(group) {
            this.addElement(group);
            return this;
        };

        /**
         * 从根节点删除图形形状
         * @deprecated Use {@link module:zrender/ZRender.prototype.delElement} instead
         * @param {string} shapeId 形状对象唯一标识
         */
        ZRender.prototype.delShape = function (shapeId) {
            this.delElement(shapeId);
            return this;
        };

        /**
         * 从根节点删除组
         * @deprecated Use {@link module:zrender/ZRender.prototype.delElement} instead
         * @param {string} groupId
         */
        ZRender.prototype.delGroup = function (groupId) {
            this.delElement(groupId);
            return this;
        };

        /**
         * 修改图形形状
         * @deprecated Use {@link module:zrender/ZRender.prototype.modElement} instead
         * @param {string} shapeId 形状对象唯一标识
         * @param {Object} shape 形状对象
         */
        ZRender.prototype.modShape = function (shapeId, shape) {
            this.modElement(shapeId, shape);
            return this;
        };

        /**
         * 修改组
         * @deprecated Use {@link module:zrender/ZRender.prototype.modElement} instead
         * @param {string} groupId
         * @param {Object} group
         */
        ZRender.prototype.modGroup = function (groupId, group) {
            this.modElement(groupId, group);
            return this;
        };

        /**
         * 添加元素
         * @param  {string|module:zrender/Group|module:zrender/shape/Base} el
         */
        ZRender.prototype.addElement = function (el) {
            this.storage.addRoot(el);
            this._needsRefreshNextFrame = true;
            return this;
        };

        /**
         * 删除元素
         * @param  {string|module:zrender/Group|module:zrender/shape/Base} el
         */
        ZRender.prototype.delElement = function (el) {
            this.storage.delRoot(el);
            this._needsRefreshNextFrame = true;
            return this;
        };

        /**
         * 修改元素, 主要标记图形或者组需要在下一帧刷新。
         * 第二个参数为需要覆盖到元素上的参数，不建议使用。
         *
         * @example
         *     el.style.color = 'red';
         *     el.position = [10, 10];
         *     zr.modElement(el);
         * @param  {string|module:zrender/Group|module:zrender/shape/Base} el
         * @param {Object} [params]
         */
        ZRender.prototype.modElement = function (el, params) {
            this.storage.mod(el, params);
            this._needsRefreshNextFrame = true;
            return this;
        };

        /**
         * 修改指定zlevel的绘制配置项
         * 
         * @param {string} zLevel
         * @param {Object} config 配置对象
         * @param {string} [config.clearColor=0] 每次清空画布的颜色
         * @param {string} [config.motionBlur=false] 是否开启动态模糊
         * @param {number} [config.lastFrameAlpha=0.7]
         *                 在开启动态模糊的时候使用，与上一帧混合的alpha值，值越大尾迹越明显
         * @param {Array.<number>} [config.position] 层的平移
         * @param {Array.<number>} [config.rotation] 层的旋转
         * @param {Array.<number>} [config.scale] 层的缩放
         * @param {boolean} [config.zoomable=false] 层是否支持鼠标缩放操作
         * @param {boolean} [config.panable=false] 层是否支持鼠标平移操作
         */
        ZRender.prototype.modLayer = function (zLevel, config) {
            this.painter.modLayer(zLevel, config);
            this._needsRefreshNextFrame = true;
            return this;
        };

        /**
         * 添加额外高亮层显示，仅提供添加方法，每次刷新后高亮层图形均被清空
         * 
         * @param {Object} shape 形状对象
         */
        ZRender.prototype.addHoverShape = function (shape) {
            this.storage.addHover(shape);
            return this;
        };

        /**
         * 渲染
         * 
         * @param {Function} callback  渲染结束后回调函数
         */
        ZRender.prototype.render = function (callback) {
            this.painter.render(callback);
            this._needsRefreshNextFrame = false;
            return this;
        };

        /**
         * 视图更新
         * 
         * @param {Function} callback  视图更新后回调函数
         */
        ZRender.prototype.refresh = function (callback) {
            this.painter.refresh(callback);
            this._needsRefreshNextFrame = false;
            return this;
        };

        /**
         * 标记视图在浏览器下一帧需要绘制
         */
        ZRender.prototype.refreshNextFrame = function() {
            this._needsRefreshNextFrame = true;
            return this;
        };
        
        /**
         * 绘制高亮层
         * @param {Function} callback  视图更新后回调函数
         */
        ZRender.prototype.refreshHover = function (callback) {
            this.painter.refreshHover(callback);
            return this;
        };

        /**
         * 视图更新
         * 
         * @param {Array.<module:zrender/shape/Base>} shapeList 需要更新的图形列表
         * @param {Function} callback  视图更新后回调函数
         */
        ZRender.prototype.refreshShapes = function (shapeList, callback) {
            this.painter.refreshShapes(shapeList, callback);
            return this;
        };

        /**
         * 调整视图大小
         */
        ZRender.prototype.resize = function() {
            this.painter.resize();
            return this;
        };

        /**
         * 动画
         * 
         * @param {string|module:zrender/Group|module:zrender/shape/Base} el 动画对象
         * @param {string} path 需要添加动画的属性获取路径，可以通过a.b.c来获取深层的属性
         * @param {boolean} [loop] 动画是否循环
         * @return {module:zrender/animation/Animation~Animator}
         * @example:
         *     zr.animate(circle.id, 'style', false)
         *         .when(1000, {x: 10} )
         *         .done(function(){ // Animation done })
         *         .start()
         */
        ZRender.prototype.animate = function (el, path, loop) {
            var self = this;

            if (typeof(el) === 'string') {
                el = this.storage.get(el);
            }
            if (el) {
                var target;
                if (path) {
                    var pathSplitted = path.split('.');
                    var prop = el;
                    for (var i = 0, l = pathSplitted.length; i < l; i++) {
                        if (!prop) {
                            continue;
                        }
                        prop = prop[pathSplitted[i]];
                    }
                    if (prop) {
                        target = prop;
                    }
                }
                else {
                    target = el;
                }

                if (!target) {
                    log(
                        'Property "'
                        + path
                        + '" is not existed in element '
                        + el.id
                    );
                    return;
                }

                if (el.__animators == null) {
                    // 正在进行的动画记数
                    el.__animators = [];
                }
                var animators = el.__animators;

                var animator = this.animation.animate(target, { loop: loop })
                    .during(function () {
                        self.modShape(el);
                    })
                    .done(function () {
                        var idx = util.indexOf(el.__animators, animator);
                        if (idx >= 0) {
                            animators.splice(idx, 1);
                        }
                    });
                animators.push(animator);

                return animator;
            }
            else {
                log('Element not existed');
            }
        };

        /**
         * 停止动画对象的动画
         * @param  {string|module:zrender/Group|module:zrender/shape/Base} el
         */
        ZRender.prototype.stopAnimation = function (el) {
            if (el.__animators) {
                var animators = el.__animators;
                var len = animators.length;
                for (var i = 0; i < len; i++) {
                    animators[i].stop();
                }
                animators.length = 0;
            }
            return this;
        };

        /**
         * 停止所有动画
         */
        ZRender.prototype.clearAnimation = function () {
            this.animation.clear();
            return this;
        };

        /**
         * loading显示
         * 
         * @param {Object=} loadingEffect loading效果对象
         */
        ZRender.prototype.showLoading = function (loadingEffect) {
            this.painter.showLoading(loadingEffect);
            return this;
        };

        /**
         * loading结束
         */
        ZRender.prototype.hideLoading = function () {
            this.painter.hideLoading();
            return this;
        };

        /**
         * 获取视图宽度
         */
        ZRender.prototype.getWidth = function() {
            return this.painter.getWidth();
        };

        /**
         * 获取视图高度
         */
        ZRender.prototype.getHeight = function() {
            return this.painter.getHeight();
        };

        /**
         * 图像导出
         * @param {string} type
         * @param {string} [backgroundColor='#fff'] 背景色
         * @return {string} 图片的Base64 url
         */
        ZRender.prototype.toDataURL = function(type, backgroundColor, args) {
            return this.painter.toDataURL(type, backgroundColor, args);
        };

        /**
         * 将常规shape转成image shape
         * @param {module:zrender/shape/Base} e
         * @param {number} width
         * @param {number} height
         */
        ZRender.prototype.shapeToImage = function(e, width, height) {
            var id = guid();
            return this.painter.shapeToImage(id, e, width, height);
        };

        /**
         * 事件绑定
         * 
         * @param {string} eventName 事件名称
         * @param {Function} eventHandler 响应函数
         * @param {Object} [context] 响应函数
         */
        ZRender.prototype.on = function(eventName, eventHandler, context) {
            this.handler.on(eventName, eventHandler, context);
            return this;
        };

        /**
         * 事件解绑定，参数为空则解绑所有自定义事件
         * 
         * @param {string} eventName 事件名称
         * @param {Function} eventHandler 响应函数
         */
        ZRender.prototype.un = function(eventName, eventHandler) {
            this.handler.un(eventName, eventHandler);
            return this;
        };
        
        /**
         * 事件触发
         * 
         * @param {string} eventName 事件名称，resize，hover，drag，etc
         * @param {event=} event event dom事件对象
         */
        ZRender.prototype.trigger = function (eventName, event) {
            this.handler.trigger(eventName, event);
            return this;
        };
        

        /**
         * 清除当前ZRender下所有类图的数据和显示，clear后MVC和已绑定事件均还存在在，ZRender可用
         */
        ZRender.prototype.clear = function () {
            this.storage.delRoot();
            this.painter.clear();
            return this;
        };

        /**
         * 释放当前ZR实例（删除包括dom，数据、显示和事件绑定），dispose后ZR不可用
         */
        ZRender.prototype.dispose = function () {
            this.animation.stop();
            
            this.clear();
            this.storage.dispose();
            this.painter.dispose();
            this.handler.dispose();

            this.animation = 
            this.storage = 
            this.painter = 
            this.handler = null;

            // 释放后告诉全局删除对自己的索引，没想到啥好方法
            zrender.delInstance(this.id);
        };

        return zrender;
    }
);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3pyZW5kZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyohXG4gKiBaUmVuZGVyLCBhIGhpZ2ggcGVyZm9ybWFuY2UgY2FudmFzIGxpYnJhcnkuXG4gKiAgXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMsIEJhaWR1IEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiBcbiAqIExJQ0VOU0VcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9lY29tZmUvenJlbmRlci9ibG9iL21hc3Rlci9MSUNFTlNFLnR4dFxuICovXG5kZWZpbmUoXG4gICAgZnVuY3Rpb24ocmVxdWlyZSkge1xuICAgICAgICAvKlxuICAgICAgICAgKiBIVE1MNSBDYW52YXMgZm9yIEludGVybmV0IEV4cGxvcmVyIVxuICAgICAgICAgKiBNb2Rlcm4gYnJvd3NlcnMgbGlrZSBGaXJlZm94LCBTYWZhcmksIENocm9tZSBhbmQgT3BlcmEgc3VwcG9ydFxuICAgICAgICAgKiB0aGUgSFRNTDUgY2FudmFzIHRhZyB0byBhbGxvdyAyRCBjb21tYW5kLWJhc2VkIGRyYXdpbmcuXG4gICAgICAgICAqIEV4cGxvcmVyQ2FudmFzIGJyaW5ncyB0aGUgc2FtZSBmdW5jdGlvbmFsaXR5IHRvIEludGVybmV0IEV4cGxvcmVyLlxuICAgICAgICAgKiBUbyB1c2UsIHdlYiBkZXZlbG9wZXJzIG9ubHkgbmVlZCB0byBpbmNsdWRlIGEgc2luZ2xlIHNjcmlwdCB0YWdcbiAgICAgICAgICogaW4gdGhlaXIgZXhpc3Rpbmcgd2ViIHBhZ2VzLlxuICAgICAgICAgKlxuICAgICAgICAgKiBodHRwczovL2NvZGUuZ29vZ2xlLmNvbS9wL2V4cGxvcmVyY2FudmFzL1xuICAgICAgICAgKiBodHRwOi8vZXhwbG9yZXJjYW52YXMuZ29vZ2xlY29kZS5jb20vc3ZuL3RydW5rL2V4Y2FudmFzLmpzXG4gICAgICAgICAqL1xuICAgICAgICAvLyDmoLjlv4Pku6PnoIHkvJrnlJ/miJDkuIDkuKrlhajlsYDlj5jph48gR192bWxDYW52YXNNYW5hZ2Vy77yM5qih5Z2X5pS56YCg5ZCO5YCf55So5LqO5b+r6YCf5Yik5patY2FudmFz5pSv5oyBXG4gICAgICAgIHJlcXVpcmUoJy4vZGVwL2V4Y2FudmFzJyk7XG5cbiAgICAgICAgdmFyIHV0aWwgPSByZXF1aXJlKCcuL3Rvb2wvdXRpbCcpO1xuICAgICAgICB2YXIgbG9nID0gcmVxdWlyZSgnLi90b29sL2xvZycpO1xuICAgICAgICB2YXIgZ3VpZCA9IHJlcXVpcmUoJy4vdG9vbC9ndWlkJyk7XG5cbiAgICAgICAgdmFyIEhhbmRsZXIgPSByZXF1aXJlKCcuL0hhbmRsZXInKTtcbiAgICAgICAgdmFyIFBhaW50ZXIgPSByZXF1aXJlKCcuL1BhaW50ZXInKTtcbiAgICAgICAgdmFyIFN0b3JhZ2UgPSByZXF1aXJlKCcuL1N0b3JhZ2UnKTtcbiAgICAgICAgdmFyIEFuaW1hdGlvbiA9IHJlcXVpcmUoJy4vYW5pbWF0aW9uL0FuaW1hdGlvbicpO1xuXG4gICAgICAgIHZhciBfaW5zdGFuY2VzID0ge307ICAgIC8vIFpSZW5kZXLlrp7kvottYXDntKLlvJVcblxuICAgICAgICAvKipcbiAgICAgICAgICogQGV4cG9ydHMgenJlbmRlclxuICAgICAgICAgKiBAYXV0aG9yIEtlbmVyIChAS2VuZXIt5p6X5bOwLCBrZW5lci5saW5mZW5nQGdtYWlsLmNvbSlcbiAgICAgICAgICogICAgICAgICBwaXNzYW5nIChodHRwczovL3d3dy5naXRodWIuY29tL3Bpc3NhbmcpXG4gICAgICAgICAqL1xuICAgICAgICB2YXIgenJlbmRlciA9IHt9O1xuICAgICAgICAvKipcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHpyZW5kZXIudmVyc2lvbiA9ICcyLjEuMCc7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWIm+W7unpyZW5kZXLlrp7kvotcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZG9tIOe7mOWbvuWuueWZqFxuICAgICAgICAgKiBAcmV0dXJuIHttb2R1bGU6enJlbmRlci9aUmVuZGVyfSBaUmVuZGVy5a6e5L6LXG4gICAgICAgICAqL1xuICAgICAgICAvLyDkuI3orqnlpJbpg6jnm7TmjqVuZXcgWlJlbmRlcuWunuS+i++8jOS4uuWVpe+8n1xuICAgICAgICAvLyDkuI3kuLrllaXvvIzmj5DkvpvlhajlsYDlj6/mjqflkIzml7blh4/lsJHlhajlsYDmsaHmn5PlkozpmY3kvY7lkb3lkI3lhrLnqoHnmoTpo47pmanvvIFcbiAgICAgICAgenJlbmRlci5pbml0ID0gZnVuY3Rpb24oZG9tKSB7XG4gICAgICAgICAgICB2YXIgenIgPSBuZXcgWlJlbmRlcihndWlkKCksIGRvbSk7XG4gICAgICAgICAgICBfaW5zdGFuY2VzW3pyLmlkXSA9IHpyO1xuICAgICAgICAgICAgcmV0dXJuIHpyO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiB6cmVuZGVy5a6e5L6L6ZSA5q+BXG4gICAgICAgICAqIEBwYXJhbSB7bW9kdWxlOnpyZW5kZXIvWlJlbmRlcn0genIgWlJlbmRlcuWvueixoe+8jOS4jeS8oOWImemUgOavgeWFqOmDqFxuICAgICAgICAgKi9cbiAgICAgICAgLy8g5ZyoX2luc3RhbmNlc+mHjOeahOe0ouW8leS5n+S8muWIoOmZpOS6hlxuICAgICAgICAvLyDnrqHnlJ/lsLHlvpfnrqHmrbvvvIzlj6/ku6XpgJrov4d6cmVuZGVyLmRpc3Bvc2UoenIp6ZSA5q+B5oyH5a6aWlJlbmRlcuWunuS+i1xuICAgICAgICAvLyDlvZPnhLbkuZ/lj6/ku6Xnm7TmjqV6ci5kaXNwb3NlKCnoh6rlt7HplIDmr4FcbiAgICAgICAgenJlbmRlci5kaXNwb3NlID0gZnVuY3Rpb24gKHpyKSB7XG4gICAgICAgICAgICBpZiAoenIpIHtcbiAgICAgICAgICAgICAgICB6ci5kaXNwb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gX2luc3RhbmNlcykge1xuICAgICAgICAgICAgICAgICAgICBfaW5zdGFuY2VzW2tleV0uZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBfaW5zdGFuY2VzID0ge307XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB6cmVuZGVyO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDojrflj5Z6cmVuZGVy5a6e5L6LXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCBaUmVuZGVy5a+56LGh57Si5byVXG4gICAgICAgICAqIEByZXR1cm4ge21vZHVsZTp6cmVuZGVyL1pSZW5kZXJ9XG4gICAgICAgICAqL1xuICAgICAgICB6cmVuZGVyLmdldEluc3RhbmNlID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgICByZXR1cm4gX2luc3RhbmNlc1tpZF07XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWIoOmZpHpyZW5kZXLlrp7kvovvvIxaUmVuZGVy5a6e5L6LZGlzcG9zZeaXtuS8muiwg+eUqO+8jFxuICAgICAgICAgKiDliKDpmaTlkI5nZXRJbnN0YW5jZeWImei/lOWbnnVuZGVmaW5lZFxuICAgICAgICAgKiBwczog5LuF5piv5Yig6Zmk77yM5Yig6Zmk55qE5a6e5L6L5LiN5Luj6KGo5bey57uPZGlzcG9zZeS6hn5+XG4gICAgICAgICAqICAgICDov5nmmK/kuIDkuKrmkYbohLHlhajlsYB6cmVuZGVyLmRpc3Bvc2UoKeiHquWKqOmUgOavgeeahOWQjumXqO+8jFxuICAgICAgICAgKiAgICAgdGFrZSBjYXJlIG9mIHlvdXJzZWxmflxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgWlJlbmRlcuWvueixoee0ouW8lVxuICAgICAgICAgKi9cbiAgICAgICAgenJlbmRlci5kZWxJbnN0YW5jZSA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgZGVsZXRlIF9pbnN0YW5jZXNbaWRdO1xuICAgICAgICAgICAgcmV0dXJuIHpyZW5kZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgZnVuY3Rpb24gZ2V0RnJhbWVDYWxsYmFjayh6ckluc3RhbmNlKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICh6ckluc3RhbmNlLl9uZWVkc1JlZnJlc2hOZXh0RnJhbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgenJJbnN0YW5jZS5yZWZyZXNoKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAbW9kdWxlIHpyZW5kZXIvWlJlbmRlclxuICAgICAgICAgKi9cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFpSZW5kZXLmjqXlj6PnsbvvvIzlr7nlpJblj6/nlKjnmoTmiYDmnInmjqXlj6Ppg73lnKjov5nph4xcbiAgICAgICAgICog6Z2eZ2V05o6l5Y+j57uf5LiA6L+U5Zue5pSv5oyB6ZO+5byP6LCD55SoXG4gICAgICAgICAqXG4gICAgICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAgICAgKiBAYWxpYXMgbW9kdWxlOnpyZW5kZXIvWlJlbmRlclxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQg5ZSv5LiA5qCH6K+GXG4gICAgICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGRvbSBkb23lr7nosaHvvIzkuI3luK7kvaDlgZpkb2N1bWVudC5nZXRFbGVtZW50QnlJZFxuICAgICAgICAgKiBAcmV0dXJuIHtaUmVuZGVyfSBaUmVuZGVy5a6e5L6LXG4gICAgICAgICAqL1xuICAgICAgICB2YXIgWlJlbmRlciA9IGZ1bmN0aW9uKGlkLCBkb20pIHtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5a6e5L6LIGlkXG4gICAgICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLmlkID0gaWQ7XG4gICAgICAgICAgICB0aGlzLmVudiA9IHJlcXVpcmUoJy4vdG9vbC9lbnYnKTtcblxuICAgICAgICAgICAgdGhpcy5zdG9yYWdlID0gbmV3IFN0b3JhZ2UoKTtcbiAgICAgICAgICAgIHRoaXMucGFpbnRlciA9IG5ldyBQYWludGVyKGRvbSwgdGhpcy5zdG9yYWdlKTtcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlciA9IG5ldyBIYW5kbGVyKGRvbSwgdGhpcy5zdG9yYWdlLCB0aGlzLnBhaW50ZXIpO1xuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEB0eXBlIHttb2R1bGU6enJlbmRlci9hbmltYXRpb24vQW5pbWF0aW9ufVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLmFuaW1hdGlvbiA9IG5ldyBBbmltYXRpb24oe1xuICAgICAgICAgICAgICAgIHN0YWdlOiB7XG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZTogZ2V0RnJhbWVDYWxsYmFjayh0aGlzKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5hbmltYXRpb24uc3RhcnQoKTtcblxuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgdGhpcy5wYWludGVyLnJlZnJlc2hOZXh0RnJhbWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5yZWZyZXNoTmV4dEZyYW1lKCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLl9uZWVkc1JlZnJlc2hOZXh0RnJhbWUgPSBmYWxzZTtcblxuICAgICAgICAgICAgLy8g5L+u5pS5IHN0b3JhZ2UuZGVsRnJvbU1hcCwg5q+P5qyh5Yig6Zmk5YWD57Sg5LmL5YmN5Yig6Zmk5Yqo55S7XG4gICAgICAgICAgICAvLyBGSVhNRSDmnInngrl1Z2x5XG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICB2YXIgc3RvcmFnZSA9IHRoaXMuc3RvcmFnZTtcbiAgICAgICAgICAgIHZhciBvbGREZWxGcm9tTWFwID0gc3RvcmFnZS5kZWxGcm9tTWFwO1xuICAgICAgICAgICAgc3RvcmFnZS5kZWxGcm9tTWFwID0gZnVuY3Rpb24gKGVsSWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgZWwgPSBzdG9yYWdlLmdldChlbElkKTtcbiAgICAgICAgICAgICAgICBzZWxmLnN0b3BBbmltYXRpb24oZWwpO1xuICAgICAgICAgICAgICAgIG9sZERlbEZyb21NYXAuY2FsbChzdG9yYWdlLCBlbElkKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOiOt+WPluWunuS+i+WUr+S4gOagh+ivhlxuICAgICAgICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBaUmVuZGVyLnByb3RvdHlwZS5nZXRJZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmlkO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDmt7vliqDlm77lvaLlvaLnirbliLDmoLnoioLngrlcbiAgICAgICAgICogQGRlcHJlY2F0ZWQgVXNlIHtAbGluayBtb2R1bGU6enJlbmRlci9aUmVuZGVyLnByb3RvdHlwZS5hZGRFbGVtZW50fSBpbnN0ZWFkXG4gICAgICAgICAqIEBwYXJhbSB7bW9kdWxlOnpyZW5kZXIvc2hhcGUvQmFzZX0gc2hhcGUg5b2i54q25a+56LGh77yM5Y+v55So5bGe5oCn5YWo6ZuG77yM6K+m6KeB5ZCEc2hhcGVcbiAgICAgICAgICovXG4gICAgICAgIFpSZW5kZXIucHJvdG90eXBlLmFkZFNoYXBlID0gZnVuY3Rpb24gKHNoYXBlKSB7XG4gICAgICAgICAgICB0aGlzLmFkZEVsZW1lbnQoc2hhcGUpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOa3u+WKoOe7hOWIsOagueiKgueCuVxuICAgICAgICAgKiBAZGVwcmVjYXRlZCBVc2Uge0BsaW5rIG1vZHVsZTp6cmVuZGVyL1pSZW5kZXIucHJvdG90eXBlLmFkZEVsZW1lbnR9IGluc3RlYWRcbiAgICAgICAgICogQHBhcmFtIHttb2R1bGU6enJlbmRlci9Hcm91cH0gZ3JvdXBcbiAgICAgICAgICovXG4gICAgICAgIFpSZW5kZXIucHJvdG90eXBlLmFkZEdyb3VwID0gZnVuY3Rpb24oZ3JvdXApIHtcbiAgICAgICAgICAgIHRoaXMuYWRkRWxlbWVudChncm91cCk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICog5LuO5qC56IqC54K55Yig6Zmk5Zu+5b2i5b2i54q2XG4gICAgICAgICAqIEBkZXByZWNhdGVkIFVzZSB7QGxpbmsgbW9kdWxlOnpyZW5kZXIvWlJlbmRlci5wcm90b3R5cGUuZGVsRWxlbWVudH0gaW5zdGVhZFxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gc2hhcGVJZCDlvaLnirblr7nosaHllK/kuIDmoIfor4ZcbiAgICAgICAgICovXG4gICAgICAgIFpSZW5kZXIucHJvdG90eXBlLmRlbFNoYXBlID0gZnVuY3Rpb24gKHNoYXBlSWQpIHtcbiAgICAgICAgICAgIHRoaXMuZGVsRWxlbWVudChzaGFwZUlkKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDku47moLnoioLngrnliKDpmaTnu4RcbiAgICAgICAgICogQGRlcHJlY2F0ZWQgVXNlIHtAbGluayBtb2R1bGU6enJlbmRlci9aUmVuZGVyLnByb3RvdHlwZS5kZWxFbGVtZW50fSBpbnN0ZWFkXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBncm91cElkXG4gICAgICAgICAqL1xuICAgICAgICBaUmVuZGVyLnByb3RvdHlwZS5kZWxHcm91cCA9IGZ1bmN0aW9uIChncm91cElkKSB7XG4gICAgICAgICAgICB0aGlzLmRlbEVsZW1lbnQoZ3JvdXBJZCk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICog5L+u5pS55Zu+5b2i5b2i54q2XG4gICAgICAgICAqIEBkZXByZWNhdGVkIFVzZSB7QGxpbmsgbW9kdWxlOnpyZW5kZXIvWlJlbmRlci5wcm90b3R5cGUubW9kRWxlbWVudH0gaW5zdGVhZFxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gc2hhcGVJZCDlvaLnirblr7nosaHllK/kuIDmoIfor4ZcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IHNoYXBlIOW9oueKtuWvueixoVxuICAgICAgICAgKi9cbiAgICAgICAgWlJlbmRlci5wcm90b3R5cGUubW9kU2hhcGUgPSBmdW5jdGlvbiAoc2hhcGVJZCwgc2hhcGUpIHtcbiAgICAgICAgICAgIHRoaXMubW9kRWxlbWVudChzaGFwZUlkLCBzaGFwZSk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICog5L+u5pS557uEXG4gICAgICAgICAqIEBkZXByZWNhdGVkIFVzZSB7QGxpbmsgbW9kdWxlOnpyZW5kZXIvWlJlbmRlci5wcm90b3R5cGUubW9kRWxlbWVudH0gaW5zdGVhZFxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZ3JvdXBJZFxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gZ3JvdXBcbiAgICAgICAgICovXG4gICAgICAgIFpSZW5kZXIucHJvdG90eXBlLm1vZEdyb3VwID0gZnVuY3Rpb24gKGdyb3VwSWQsIGdyb3VwKSB7XG4gICAgICAgICAgICB0aGlzLm1vZEVsZW1lbnQoZ3JvdXBJZCwgZ3JvdXApO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOa3u+WKoOWFg+e0oFxuICAgICAgICAgKiBAcGFyYW0gIHtzdHJpbmd8bW9kdWxlOnpyZW5kZXIvR3JvdXB8bW9kdWxlOnpyZW5kZXIvc2hhcGUvQmFzZX0gZWxcbiAgICAgICAgICovXG4gICAgICAgIFpSZW5kZXIucHJvdG90eXBlLmFkZEVsZW1lbnQgPSBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgIHRoaXMuc3RvcmFnZS5hZGRSb290KGVsKTtcbiAgICAgICAgICAgIHRoaXMuX25lZWRzUmVmcmVzaE5leHRGcmFtZSA9IHRydWU7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICog5Yig6Zmk5YWD57SgXG4gICAgICAgICAqIEBwYXJhbSAge3N0cmluZ3xtb2R1bGU6enJlbmRlci9Hcm91cHxtb2R1bGU6enJlbmRlci9zaGFwZS9CYXNlfSBlbFxuICAgICAgICAgKi9cbiAgICAgICAgWlJlbmRlci5wcm90b3R5cGUuZGVsRWxlbWVudCA9IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgdGhpcy5zdG9yYWdlLmRlbFJvb3QoZWwpO1xuICAgICAgICAgICAgdGhpcy5fbmVlZHNSZWZyZXNoTmV4dEZyYW1lID0gdHJ1ZTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDkv67mlLnlhYPntKAsIOS4u+imgeagh+iusOWbvuW9ouaIluiAhee7hOmcgOimgeWcqOS4i+S4gOW4p+WIt+aWsOOAglxuICAgICAgICAgKiDnrKzkuozkuKrlj4LmlbDkuLrpnIDopoHopobnm5bliLDlhYPntKDkuIrnmoTlj4LmlbDvvIzkuI3lu7rorq7kvb/nlKjjgIJcbiAgICAgICAgICpcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICogICAgIGVsLnN0eWxlLmNvbG9yID0gJ3JlZCc7XG4gICAgICAgICAqICAgICBlbC5wb3NpdGlvbiA9IFsxMCwgMTBdO1xuICAgICAgICAgKiAgICAgenIubW9kRWxlbWVudChlbCk7XG4gICAgICAgICAqIEBwYXJhbSAge3N0cmluZ3xtb2R1bGU6enJlbmRlci9Hcm91cHxtb2R1bGU6enJlbmRlci9zaGFwZS9CYXNlfSBlbFxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gW3BhcmFtc11cbiAgICAgICAgICovXG4gICAgICAgIFpSZW5kZXIucHJvdG90eXBlLm1vZEVsZW1lbnQgPSBmdW5jdGlvbiAoZWwsIHBhcmFtcykge1xuICAgICAgICAgICAgdGhpcy5zdG9yYWdlLm1vZChlbCwgcGFyYW1zKTtcbiAgICAgICAgICAgIHRoaXMuX25lZWRzUmVmcmVzaE5leHRGcmFtZSA9IHRydWU7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICog5L+u5pS55oyH5a6aemxldmVs55qE57uY5Yi26YWN572u6aG5XG4gICAgICAgICAqIFxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gekxldmVsXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjb25maWcg6YWN572u5a+56LGhXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLmNsZWFyQ29sb3I9MF0g5q+P5qyh5riF56m655S75biD55qE6aKc6ImyXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLm1vdGlvbkJsdXI9ZmFsc2VdIOaYr+WQpuW8gOWQr+WKqOaAgeaooeezilxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gW2NvbmZpZy5sYXN0RnJhbWVBbHBoYT0wLjddXG4gICAgICAgICAqICAgICAgICAgICAgICAgICDlnKjlvIDlkK/liqjmgIHmqKHns4rnmoTml7blgJnkvb/nlKjvvIzkuI7kuIrkuIDluKfmt7flkIjnmoRhbHBoYeWAvO+8jOWAvOi2iuWkp+Wwvui/uei2iuaYjuaYvlxuICAgICAgICAgKiBAcGFyYW0ge0FycmF5LjxudW1iZXI+fSBbY29uZmlnLnBvc2l0aW9uXSDlsYLnmoTlubPnp7tcbiAgICAgICAgICogQHBhcmFtIHtBcnJheS48bnVtYmVyPn0gW2NvbmZpZy5yb3RhdGlvbl0g5bGC55qE5peL6L2sXG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXkuPG51bWJlcj59IFtjb25maWcuc2NhbGVdIOWxgueahOe8qeaUvlxuICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtjb25maWcuem9vbWFibGU9ZmFsc2VdIOWxguaYr+WQpuaUr+aMgem8oOagh+e8qeaUvuaTjeS9nFxuICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtjb25maWcucGFuYWJsZT1mYWxzZV0g5bGC5piv5ZCm5pSv5oyB6byg5qCH5bmz56e75pON5L2cXG4gICAgICAgICAqL1xuICAgICAgICBaUmVuZGVyLnByb3RvdHlwZS5tb2RMYXllciA9IGZ1bmN0aW9uICh6TGV2ZWwsIGNvbmZpZykge1xuICAgICAgICAgICAgdGhpcy5wYWludGVyLm1vZExheWVyKHpMZXZlbCwgY29uZmlnKTtcbiAgICAgICAgICAgIHRoaXMuX25lZWRzUmVmcmVzaE5leHRGcmFtZSA9IHRydWU7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICog5re75Yqg6aKd5aSW6auY5Lqu5bGC5pi+56S677yM5LuF5o+Q5L6b5re75Yqg5pa55rOV77yM5q+P5qyh5Yi35paw5ZCO6auY5Lqu5bGC5Zu+5b2i5Z2H6KKr5riF56m6XG4gICAgICAgICAqIFxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gc2hhcGUg5b2i54q25a+56LGhXG4gICAgICAgICAqL1xuICAgICAgICBaUmVuZGVyLnByb3RvdHlwZS5hZGRIb3ZlclNoYXBlID0gZnVuY3Rpb24gKHNoYXBlKSB7XG4gICAgICAgICAgICB0aGlzLnN0b3JhZ2UuYWRkSG92ZXIoc2hhcGUpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOa4suafk1xuICAgICAgICAgKiBcbiAgICAgICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgIOa4suafk+e7k+adn+WQjuWbnuiwg+WHveaVsFxuICAgICAgICAgKi9cbiAgICAgICAgWlJlbmRlci5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICB0aGlzLnBhaW50ZXIucmVuZGVyKGNhbGxiYWNrKTtcbiAgICAgICAgICAgIHRoaXMuX25lZWRzUmVmcmVzaE5leHRGcmFtZSA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOinhuWbvuabtOaWsFxuICAgICAgICAgKiBcbiAgICAgICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgIOinhuWbvuabtOaWsOWQjuWbnuiwg+WHveaVsFxuICAgICAgICAgKi9cbiAgICAgICAgWlJlbmRlci5wcm90b3R5cGUucmVmcmVzaCA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICAgICAgdGhpcy5wYWludGVyLnJlZnJlc2goY2FsbGJhY2spO1xuICAgICAgICAgICAgdGhpcy5fbmVlZHNSZWZyZXNoTmV4dEZyYW1lID0gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICog5qCH6K6w6KeG5Zu+5Zyo5rWP6KeI5Zmo5LiL5LiA5bin6ZyA6KaB57uY5Yi2XG4gICAgICAgICAqL1xuICAgICAgICBaUmVuZGVyLnByb3RvdHlwZS5yZWZyZXNoTmV4dEZyYW1lID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLl9uZWVkc1JlZnJlc2hOZXh0RnJhbWUgPSB0cnVlO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgICog57uY5Yi26auY5Lqu5bGCXG4gICAgICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrICDop4blm77mm7TmlrDlkI7lm57osIPlh73mlbBcbiAgICAgICAgICovXG4gICAgICAgIFpSZW5kZXIucHJvdG90eXBlLnJlZnJlc2hIb3ZlciA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICAgICAgdGhpcy5wYWludGVyLnJlZnJlc2hIb3ZlcihjYWxsYmFjayk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICog6KeG5Zu+5pu05pawXG4gICAgICAgICAqIFxuICAgICAgICAgKiBAcGFyYW0ge0FycmF5Ljxtb2R1bGU6enJlbmRlci9zaGFwZS9CYXNlPn0gc2hhcGVMaXN0IOmcgOimgeabtOaWsOeahOWbvuW9ouWIl+ihqFxuICAgICAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAg6KeG5Zu+5pu05paw5ZCO5Zue6LCD5Ye95pWwXG4gICAgICAgICAqL1xuICAgICAgICBaUmVuZGVyLnByb3RvdHlwZS5yZWZyZXNoU2hhcGVzID0gZnVuY3Rpb24gKHNoYXBlTGlzdCwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHRoaXMucGFpbnRlci5yZWZyZXNoU2hhcGVzKHNoYXBlTGlzdCwgY2FsbGJhY2spO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOiwg+aVtOinhuWbvuWkp+Wwj1xuICAgICAgICAgKi9cbiAgICAgICAgWlJlbmRlci5wcm90b3R5cGUucmVzaXplID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLnBhaW50ZXIucmVzaXplKCk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICog5Yqo55S7XG4gICAgICAgICAqIFxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ3xtb2R1bGU6enJlbmRlci9Hcm91cHxtb2R1bGU6enJlbmRlci9zaGFwZS9CYXNlfSBlbCDliqjnlLvlr7nosaFcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGgg6ZyA6KaB5re75Yqg5Yqo55S755qE5bGe5oCn6I635Y+W6Lev5b6E77yM5Y+v5Lul6YCa6L+HYS5iLmPmnaXojrflj5bmt7HlsYLnmoTlsZ7mgKdcbiAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBbbG9vcF0g5Yqo55S75piv5ZCm5b6q546vXG4gICAgICAgICAqIEByZXR1cm4ge21vZHVsZTp6cmVuZGVyL2FuaW1hdGlvbi9BbmltYXRpb25+QW5pbWF0b3J9XG4gICAgICAgICAqIEBleGFtcGxlOlxuICAgICAgICAgKiAgICAgenIuYW5pbWF0ZShjaXJjbGUuaWQsICdzdHlsZScsIGZhbHNlKVxuICAgICAgICAgKiAgICAgICAgIC53aGVuKDEwMDAsIHt4OiAxMH0gKVxuICAgICAgICAgKiAgICAgICAgIC5kb25lKGZ1bmN0aW9uKCl7IC8vIEFuaW1hdGlvbiBkb25lIH0pXG4gICAgICAgICAqICAgICAgICAgLnN0YXJ0KClcbiAgICAgICAgICovXG4gICAgICAgIFpSZW5kZXIucHJvdG90eXBlLmFuaW1hdGUgPSBmdW5jdGlvbiAoZWwsIHBhdGgsIGxvb3ApIHtcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICAgICAgaWYgKHR5cGVvZihlbCkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgZWwgPSB0aGlzLnN0b3JhZ2UuZ2V0KGVsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbCkge1xuICAgICAgICAgICAgICAgIHZhciB0YXJnZXQ7XG4gICAgICAgICAgICAgICAgaWYgKHBhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhdGhTcGxpdHRlZCA9IHBhdGguc3BsaXQoJy4nKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHByb3AgPSBlbDtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBwYXRoU3BsaXR0ZWQubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXByb3ApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3AgPSBwcm9wW3BhdGhTcGxpdHRlZFtpXV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb3ApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldCA9IHByb3A7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldCA9IGVsO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICghdGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIGxvZyhcbiAgICAgICAgICAgICAgICAgICAgICAgICdQcm9wZXJ0eSBcIidcbiAgICAgICAgICAgICAgICAgICAgICAgICsgcGF0aFxuICAgICAgICAgICAgICAgICAgICAgICAgKyAnXCIgaXMgbm90IGV4aXN0ZWQgaW4gZWxlbWVudCAnXG4gICAgICAgICAgICAgICAgICAgICAgICArIGVsLmlkXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoZWwuX19hbmltYXRvcnMgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAvLyDmraPlnKjov5vooYznmoTliqjnlLvorrDmlbBcbiAgICAgICAgICAgICAgICAgICAgZWwuX19hbmltYXRvcnMgPSBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGFuaW1hdG9ycyA9IGVsLl9fYW5pbWF0b3JzO1xuXG4gICAgICAgICAgICAgICAgdmFyIGFuaW1hdG9yID0gdGhpcy5hbmltYXRpb24uYW5pbWF0ZSh0YXJnZXQsIHsgbG9vcDogbG9vcCB9KVxuICAgICAgICAgICAgICAgICAgICAuZHVyaW5nKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYubW9kU2hhcGUoZWwpO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAuZG9uZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaWR4ID0gdXRpbC5pbmRleE9mKGVsLl9fYW5pbWF0b3JzLCBhbmltYXRvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRvcnMuc3BsaWNlKGlkeCwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGFuaW1hdG9ycy5wdXNoKGFuaW1hdG9yKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBhbmltYXRvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGxvZygnRWxlbWVudCBub3QgZXhpc3RlZCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDlgZzmraLliqjnlLvlr7nosaHnmoTliqjnlLtcbiAgICAgICAgICogQHBhcmFtICB7c3RyaW5nfG1vZHVsZTp6cmVuZGVyL0dyb3VwfG1vZHVsZTp6cmVuZGVyL3NoYXBlL0Jhc2V9IGVsXG4gICAgICAgICAqL1xuICAgICAgICBaUmVuZGVyLnByb3RvdHlwZS5zdG9wQW5pbWF0aW9uID0gZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICBpZiAoZWwuX19hbmltYXRvcnMpIHtcbiAgICAgICAgICAgICAgICB2YXIgYW5pbWF0b3JzID0gZWwuX19hbmltYXRvcnM7XG4gICAgICAgICAgICAgICAgdmFyIGxlbiA9IGFuaW1hdG9ycy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBhbmltYXRvcnNbaV0uc3RvcCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhbmltYXRvcnMubGVuZ3RoID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDlgZzmraLmiYDmnInliqjnlLtcbiAgICAgICAgICovXG4gICAgICAgIFpSZW5kZXIucHJvdG90eXBlLmNsZWFyQW5pbWF0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5hbmltYXRpb24uY2xlYXIoKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBsb2FkaW5n5pi+56S6XG4gICAgICAgICAqIFxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdD19IGxvYWRpbmdFZmZlY3QgbG9hZGluZ+aViOaenOWvueixoVxuICAgICAgICAgKi9cbiAgICAgICAgWlJlbmRlci5wcm90b3R5cGUuc2hvd0xvYWRpbmcgPSBmdW5jdGlvbiAobG9hZGluZ0VmZmVjdCkge1xuICAgICAgICAgICAgdGhpcy5wYWludGVyLnNob3dMb2FkaW5nKGxvYWRpbmdFZmZlY3QpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIGxvYWRpbmfnu5PmnZ9cbiAgICAgICAgICovXG4gICAgICAgIFpSZW5kZXIucHJvdG90eXBlLmhpZGVMb2FkaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5wYWludGVyLmhpZGVMb2FkaW5nKCk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICog6I635Y+W6KeG5Zu+5a695bqmXG4gICAgICAgICAqL1xuICAgICAgICBaUmVuZGVyLnByb3RvdHlwZS5nZXRXaWR0aCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFpbnRlci5nZXRXaWR0aCgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDojrflj5bop4blm77pq5jluqZcbiAgICAgICAgICovXG4gICAgICAgIFpSZW5kZXIucHJvdG90eXBlLmdldEhlaWdodCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFpbnRlci5nZXRIZWlnaHQoKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICog5Zu+5YOP5a+85Ye6XG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbYmFja2dyb3VuZENvbG9yPScjZmZmJ10g6IOM5pmv6ImyXG4gICAgICAgICAqIEByZXR1cm4ge3N0cmluZ30g5Zu+54mH55qEQmFzZTY0IHVybFxuICAgICAgICAgKi9cbiAgICAgICAgWlJlbmRlci5wcm90b3R5cGUudG9EYXRhVVJMID0gZnVuY3Rpb24odHlwZSwgYmFja2dyb3VuZENvbG9yLCBhcmdzKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wYWludGVyLnRvRGF0YVVSTCh0eXBlLCBiYWNrZ3JvdW5kQ29sb3IsIGFyZ3MpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDlsIbluLjop4RzaGFwZei9rOaIkGltYWdlIHNoYXBlXG4gICAgICAgICAqIEBwYXJhbSB7bW9kdWxlOnpyZW5kZXIvc2hhcGUvQmFzZX0gZVxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gd2lkdGhcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IGhlaWdodFxuICAgICAgICAgKi9cbiAgICAgICAgWlJlbmRlci5wcm90b3R5cGUuc2hhcGVUb0ltYWdlID0gZnVuY3Rpb24oZSwgd2lkdGgsIGhlaWdodCkge1xuICAgICAgICAgICAgdmFyIGlkID0gZ3VpZCgpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFpbnRlci5zaGFwZVRvSW1hZ2UoaWQsIGUsIHdpZHRoLCBoZWlnaHQpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDkuovku7bnu5HlrppcbiAgICAgICAgICogXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudE5hbWUg5LqL5Lu25ZCN56ewXG4gICAgICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGV2ZW50SGFuZGxlciDlk43lupTlh73mlbBcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IFtjb250ZXh0XSDlk43lupTlh73mlbBcbiAgICAgICAgICovXG4gICAgICAgIFpSZW5kZXIucHJvdG90eXBlLm9uID0gZnVuY3Rpb24oZXZlbnROYW1lLCBldmVudEhhbmRsZXIsIGNvbnRleHQpIHtcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlci5vbihldmVudE5hbWUsIGV2ZW50SGFuZGxlciwgY29udGV4dCk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICog5LqL5Lu26Kej57uR5a6a77yM5Y+C5pWw5Li656m65YiZ6Kej57uR5omA5pyJ6Ieq5a6a5LmJ5LqL5Lu2XG4gICAgICAgICAqIFxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnROYW1lIOS6i+S7tuWQjeensFxuICAgICAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBldmVudEhhbmRsZXIg5ZON5bqU5Ye95pWwXG4gICAgICAgICAqL1xuICAgICAgICBaUmVuZGVyLnByb3RvdHlwZS51biA9IGZ1bmN0aW9uKGV2ZW50TmFtZSwgZXZlbnRIYW5kbGVyKSB7XG4gICAgICAgICAgICB0aGlzLmhhbmRsZXIudW4oZXZlbnROYW1lLCBldmVudEhhbmRsZXIpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgICog5LqL5Lu26Kem5Y+RXG4gICAgICAgICAqIFxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnROYW1lIOS6i+S7tuWQjeensO+8jHJlc2l6Ze+8jGhvdmVy77yMZHJhZ++8jGV0Y1xuICAgICAgICAgKiBAcGFyYW0ge2V2ZW50PX0gZXZlbnQgZXZlbnQgZG9t5LqL5Lu25a+56LGhXG4gICAgICAgICAqL1xuICAgICAgICBaUmVuZGVyLnByb3RvdHlwZS50cmlnZ2VyID0gZnVuY3Rpb24gKGV2ZW50TmFtZSwgZXZlbnQpIHtcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlci50cmlnZ2VyKGV2ZW50TmFtZSwgZXZlbnQpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH07XG4gICAgICAgIFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDmuIXpmaTlvZPliY1aUmVuZGVy5LiL5omA5pyJ57G75Zu+55qE5pWw5o2u5ZKM5pi+56S677yMY2xlYXLlkI5NVkPlkozlt7Lnu5Hlrprkuovku7blnYfov5jlrZjlnKjlnKjvvIxaUmVuZGVy5Y+v55SoXG4gICAgICAgICAqL1xuICAgICAgICBaUmVuZGVyLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuc3RvcmFnZS5kZWxSb290KCk7XG4gICAgICAgICAgICB0aGlzLnBhaW50ZXIuY2xlYXIoKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDph4rmlL7lvZPliY1aUuWunuS+i++8iOWIoOmZpOWMheaLrGRvbe+8jOaVsOaNruOAgeaYvuekuuWSjOS6i+S7tue7keWumu+8ie+8jGRpc3Bvc2XlkI5aUuS4jeWPr+eUqFxuICAgICAgICAgKi9cbiAgICAgICAgWlJlbmRlci5wcm90b3R5cGUuZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuYW5pbWF0aW9uLnN0b3AoKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5jbGVhcigpO1xuICAgICAgICAgICAgdGhpcy5zdG9yYWdlLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIHRoaXMucGFpbnRlci5kaXNwb3NlKCk7XG4gICAgICAgICAgICB0aGlzLmhhbmRsZXIuZGlzcG9zZSgpO1xuXG4gICAgICAgICAgICB0aGlzLmFuaW1hdGlvbiA9IFxuICAgICAgICAgICAgdGhpcy5zdG9yYWdlID0gXG4gICAgICAgICAgICB0aGlzLnBhaW50ZXIgPSBcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlciA9IG51bGw7XG5cbiAgICAgICAgICAgIC8vIOmHiuaUvuWQjuWRiuivieWFqOWxgOWIoOmZpOWvueiHquW3seeahOe0ouW8le+8jOayoeaDs+WIsOWVpeWlveaWueazlVxuICAgICAgICAgICAgenJlbmRlci5kZWxJbnN0YW5jZSh0aGlzLmlkKTtcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4genJlbmRlcjtcbiAgICB9XG4pO1xuIl0sImZpbGUiOiJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3pyZW5kZXIuanMifQ==
