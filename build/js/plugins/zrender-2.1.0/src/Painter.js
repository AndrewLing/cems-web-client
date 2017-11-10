/**
 * Painter绘图模块
 * @module zrender/Painter
 * @author Kener (@Kener-林峰, kener.linfeng@gmail.com)
 *         errorrik (errorrik@gmail.com)
 *         pissang (https://www.github.com/pissang)
 */
 define(
    function (require) {
        'use strict';

        var config = require('./config');
        var util = require('./tool/util');
        // var vec2 = require('./tool/vector');
        var log = require('./tool/log');
        // var matrix = require('./tool/matrix');
        var BaseLoadingEffect = require('./loadingEffect/Base');

        var Layer = require('./Layer');

        // 返回false的方法，用于避免页面被选中
        function returnFalse() {
            return false;
        }

        // 什么都不干的空方法
        function doNothing() {}

        function isLayerValid(layer) {
            if (!layer) {
                return false;
            }
            
            if (layer.isBuildin) {
                return true;
            }

            if (typeof(layer.resize) !== 'function'
                || typeof(layer.refresh) !== 'function'
            ) {
                return false;
            }

            return true;
        }

        /**
         * @alias module:zrender/Painter
         * @constructor
         * @param {HTMLElement} root 绘图容器
         * @param {module:zrender/Storage} storage
         */
        var Painter = function (root, storage) {
            /**
             * 绘图容器
             * @type {HTMLElement}
             */
            this.root = root;
            root.style['-webkit-tap-highlight-color'] = 'transparent';
            root.style['-webkit-user-select'] = 'none';
            root.style['user-select'] = 'none';
            root.style['-webkit-touch-callout'] = 'none';

            /**
             * @type {module:zrender/Storage}
             */
            this.storage = storage;

            root.innerHTML = '';
            this._width = this._getWidth(); // 宽，缓存记录
            this._height = this._getHeight(); // 高，缓存记录

            var domRoot = document.createElement('div');
            this._domRoot = domRoot;

            // domRoot.onselectstart = returnFalse; // 避免页面选中的尴尬
            domRoot.style.position = 'relative';
            domRoot.style.overflow = 'hidden';
            domRoot.style.width = this._width + 'px';
            domRoot.style.height = this._height + 'px';
            root.appendChild(domRoot);

            this._layers = {};

            this._zlevelList = [];

            this._layerConfig = {};

            this._loadingEffect = new BaseLoadingEffect({});
            this.shapeToImage = this._createShapeToImageProcessor();

            // 创建各层canvas
            // 背景
            this._bgDom = document.createElement('div');
            this._bgDom.style.cssText = [
                'position:absolute;left:0px;top:0px;width:',
                this._width, 'px;height:', this._height + 'px;', 
                '-webkit-user-select:none;user-select;none;',
                '-webkit-touch-callout:none;'
            ].join('');
            this._bgDom.setAttribute('data-zr-dom-id', 'bg');
            this._bgDom.className = config.elementClassName;

            domRoot.appendChild(this._bgDom);
            this._bgDom.onselectstart = returnFalse;

            // 高亮
            var hoverLayer = new Layer('_zrender_hover_', this);
            this._layers['hover'] = hoverLayer;
            domRoot.appendChild(hoverLayer.dom);
            hoverLayer.initContext();

            hoverLayer.dom.onselectstart = returnFalse;
            hoverLayer.dom.style['-webkit-user-select'] = 'none';
            hoverLayer.dom.style['user-select'] = 'none';
            hoverLayer.dom.style['-webkit-touch-callout'] = 'none';

            // Will be injected by zrender instance
            this.refreshNextFrame = null;
        };

        /**
         * 首次绘图，创建各种dom和context
         * 
         * @param {Function} callback 绘画结束后的回调函数
         */
        Painter.prototype.render = function (callback) {
            if (this.isLoading()) {
                this.hideLoading();
            }
            // TODO
            this.refresh(callback, true);

            return this;
        };

        /**
         * 刷新
         * @param {Function} callback 刷新结束后的回调函数
         * @param {boolean} paintAll 强制绘制所有shape
         */
        Painter.prototype.refresh = function (callback, paintAll) {
            var list = this.storage.getShapeList(true);
            this._paintList(list, paintAll);

            // Paint custum layers
            for (var i = 0; i < this._zlevelList.length; i++) {
                var z = this._zlevelList[i];
                var layer = this._layers[z];
                if (! layer.isBuildin && layer.refresh) {
                    layer.refresh();
                }
            }

            if (typeof callback == 'function') {
                callback();
            }

            return this;
        };

        Painter.prototype._preProcessLayer = function (layer) {
            layer.unusedCount++;
            layer.updateTransform();
        };

        Painter.prototype._postProcessLayer = function (layer) {
            layer.dirty = false;
            // 删除过期的层
            // PENDING
            // if (layer.unusedCount >= 500) {
            //     this.delLayer(z);
            // }
            if (layer.unusedCount == 1) {
                layer.clear();
            }
        };
 
        Painter.prototype._paintList = function (list, paintAll) {

            if (typeof(paintAll) == 'undefined') {
                paintAll = false;
            }

            this._updateLayerStatus(list);

            var currentLayer;
            var currentZLevel;
            var ctx;

            this.eachBuildinLayer(this._preProcessLayer);

            // var invTransform = [];

            for (var i = 0, l = list.length; i < l; i++) {
                var shape = list[i];

                // Change draw layer
                if (currentZLevel !== shape.zlevel) {
                    if (currentLayer) {
                        if (currentLayer.needTransform) {
                            ctx.restore();
                        }
                        ctx.flush && ctx.flush();
                    }

                    currentZLevel = shape.zlevel;
                    currentLayer = this.getLayer(currentZLevel);

                    if (!currentLayer.isBuildin) {
                        log(
                            'ZLevel ' + currentZLevel
                            + ' has been used by unkown layer ' + currentLayer.id
                        );
                    }

                    ctx = currentLayer.ctx;

                    // Reset the count
                    currentLayer.unusedCount = 0;

                    if (currentLayer.dirty || paintAll) {
                        currentLayer.clear();
                    }

                    if (currentLayer.needTransform) {
                        ctx.save();
                        currentLayer.setTransform(ctx);
                    }
                }

                if ((currentLayer.dirty || paintAll) && !shape.invisible) {
                    if (
                        !shape.onbrush
                        || (shape.onbrush && !shape.onbrush(ctx, false))
                    ) {
                        if (config.catchBrushException) {
                            try {
                                shape.brush(ctx, false, this.refreshNextFrame);
                            }
                            catch (error) {
                                log(
                                    error,
                                    'brush error of ' + shape.type,
                                    shape
                                );
                            }
                        }
                        else {
                            shape.brush(ctx, false, this.refreshNextFrame);
                        }
                    }
                }

                shape.__dirty = false;
            }

            if (currentLayer) {
                if (currentLayer.needTransform) {
                    ctx.restore();
                }
                ctx.flush && ctx.flush();
            }

            this.eachBuildinLayer(this._postProcessLayer);
        };

        /**
         * 获取 zlevel 所在层，如果不存在则会创建一个新的层
         * @param {number} zlevel
         * @return {module:zrender/Layer}
         */
        Painter.prototype.getLayer = function (zlevel) {
            var layer = this._layers[zlevel];
            if (!layer) {
                // Create a new layer
                layer = new Layer(zlevel, this);
                layer.isBuildin = true;

                if (this._layerConfig[zlevel]) {
                    util.merge(layer, this._layerConfig[zlevel], true);
                }

                layer.updateTransform();

                this.insertLayer(zlevel, layer);

                // Context is created after dom inserted to document
                // Or excanvas will get 0px clientWidth and clientHeight
                layer.initContext();
            }

            return layer;
        };

        Painter.prototype.insertLayer = function (zlevel, layer) {
            if (this._layers[zlevel]) {
                log('ZLevel ' + zlevel + ' has been used already');
                return;
            }
            // Check if is a valid layer
            if (!isLayerValid(layer)) {
                log('Layer of zlevel ' + zlevel + ' is not valid');
                return;
            }

            var len = this._zlevelList.length;
            var prevLayer = null;
            var i = -1;
            if (len > 0 && zlevel > this._zlevelList[0]) {
                for (i = 0; i < len - 1; i++) {
                    if (
                        this._zlevelList[i] < zlevel
                        && this._zlevelList[i + 1] > zlevel
                    ) {
                        break;
                    }
                }
                prevLayer = this._layers[this._zlevelList[i]];
            }
            this._zlevelList.splice(i + 1, 0, zlevel);

            var prevDom = prevLayer ? prevLayer.dom : this._bgDom;
            if (prevDom.nextSibling) {
                prevDom.parentNode.insertBefore(
                    layer.dom,
                    prevDom.nextSibling
                );
            }
            else {
                prevDom.parentNode.appendChild(layer.dom);
            }

            this._layers[zlevel] = layer;
        };

        // Iterate each layer
        Painter.prototype.eachLayer = function (cb, context) {
            for (var i = 0; i < this._zlevelList.length; i++) {
                var z = this._zlevelList[i];
                cb.call(context, this._layers[z], z);
            }
        };

        // Iterate each buildin layer
        Painter.prototype.eachBuildinLayer = function (cb, context) {
            for (var i = 0; i < this._zlevelList.length; i++) {
                var z = this._zlevelList[i];
                var layer = this._layers[z];
                if (layer.isBuildin) {
                    cb.call(context, layer, z);
                }
            }
        };

        // Iterate each other layer except buildin layer
        Painter.prototype.eachOtherLayer = function (cb, context) {
            for (var i = 0; i < this._zlevelList.length; i++) {
                var z = this._zlevelList[i];
                var layer = this._layers[z];
                if (! layer.isBuildin) {
                    cb.call(context, layer, z);
                }
            }
        };

        /**
         * 获取所有已创建的层
         * @param {Array.<module:zrender/Layer>} [prevLayer]
         */
        Painter.prototype.getLayers = function () {
            return this._layers;
        };

        Painter.prototype._updateLayerStatus = function (list) {
            
            var layers = this._layers;

            var elCounts = {};

            this.eachBuildinLayer(function (layer, z) {
                elCounts[z] = layer.elCount;
                layer.elCount = 0;
            });

            for (var i = 0, l = list.length; i < l; i++) {
                var shape = list[i];
                var zlevel = shape.zlevel;
                var layer = layers[zlevel];
                if (layer) {
                    layer.elCount++;
                    // 已经被标记为需要刷新
                    if (layer.dirty) {
                        continue;
                    }
                    layer.dirty = shape.__dirty;
                }
            }

            // 层中的元素数量有发生变化
            this.eachBuildinLayer(function (layer, z) {
                if (elCounts[z] !== layer.elCount) {
                    layer.dirty = true;
                }
            });
        };

        /**
         * 指定的图形列表
         * @param {Array.<module:zrender/shape/Base>} shapeList 需要更新的图形元素列表
         * @param {Function} [callback] 视图更新后回调函数
         */
        Painter.prototype.refreshShapes = function (shapeList, callback) {
            for (var i = 0, l = shapeList.length; i < l; i++) {
                var shape = shapeList[i];
                shape.modSelf();
            }

            this.refresh(callback);
            return this;
        };

        /**
         * 设置loading特效
         * 
         * @param {Object} loadingEffect loading特效
         * @return {Painter}
         */
        Painter.prototype.setLoadingEffect = function (loadingEffect) {
            this._loadingEffect = loadingEffect;
            return this;
        };

        /**
         * 清除hover层外所有内容
         */
        Painter.prototype.clear = function () {
            this.eachBuildinLayer(this._clearLayer);
            return this;
        };

        Painter.prototype._clearLayer = function (layer) {
            layer.clear();
        };

        /**
         * 修改指定zlevel的绘制参数
         * 
         * @param {string} zlevel
         * @param {Object} config 配置对象
         * @param {string} [config.clearColor=0] 每次清空画布的颜色
         * @param {string} [config.motionBlur=false] 是否开启动态模糊
         * @param {number} [config.lastFrameAlpha=0.7]
         *                 在开启动态模糊的时候使用，与上一帧混合的alpha值，值越大尾迹越明显
         * @param {Array.<number>} [position] 层的平移
         * @param {Array.<number>} [rotation] 层的旋转
         * @param {Array.<number>} [scale] 层的缩放
         * @param {boolean} [zoomable=false] 层是否支持鼠标缩放操作
         * @param {boolean} [panable=false] 层是否支持鼠标平移操作
         */
        Painter.prototype.modLayer = function (zlevel, config) {
            if (config) {
                if (!this._layerConfig[zlevel]) {
                    this._layerConfig[zlevel] = config;
                }
                else {
                    util.merge(this._layerConfig[zlevel], config, true);
                }

                var layer = this._layers[zlevel];

                if (layer) {
                    util.merge(layer, this._layerConfig[zlevel], true);
                }
            }
        };

        /**
         * 删除指定层
         * @param {number} zlevel 层所在的zlevel
         */
        Painter.prototype.delLayer = function (zlevel) {
            var layer = this._layers[zlevel];
            if (!layer) {
                return;
            }
            // Save config
            this.modLayer(zlevel, {
                position: layer.position,
                rotation: layer.rotation,
                scale: layer.scale
            });
            layer.dom.parentNode.removeChild(layer.dom);
            delete this._layers[zlevel];

            this._zlevelList.splice(util.indexOf(this._zlevelList, zlevel), 1);
        };

        /**
         * 刷新hover层
         */
        Painter.prototype.refreshHover = function () {
            this.clearHover();
            var list = this.storage.getHoverShapes(true);
            for (var i = 0, l = list.length; i < l; i++) {
                this._brushHover(list[i]);
            }
            var ctx = this._layers.hover.ctx;
            ctx.flush && ctx.flush();

            this.storage.delHover();

            return this;
        };

        /**
         * 清除hover层所有内容
         */
        Painter.prototype.clearHover = function () {
            var hover = this._layers.hover;
            hover && hover.clear();

            return this;
        };

        /**
         * 显示loading
         * 
         * @param {Object=} loadingEffect loading效果对象
         */
        Painter.prototype.showLoading = function (loadingEffect) {
            this._loadingEffect && this._loadingEffect.stop();
            loadingEffect && this.setLoadingEffect(loadingEffect);
            this._loadingEffect.start(this);
            this.loading = true;

            return this;
        };

        /**
         * loading结束
         */
        Painter.prototype.hideLoading = function () {
            this._loadingEffect.stop();

            this.clearHover();
            this.loading = false;
            return this;
        };

        /**
         * loading结束判断
         */
        Painter.prototype.isLoading = function () {
            return this.loading;
        };

        /**
         * 区域大小变化后重绘
         */
        Painter.prototype.resize = function () {
            var domRoot = this._domRoot;
            domRoot.style.display = 'none';

            var width = this._getWidth();
            var height = this._getHeight();

            domRoot.style.display = '';

            // 优化没有实际改变的resize
            if (this._width != width || height != this._height) {
                this._width = width;
                this._height = height;

                domRoot.style.width = width + 'px';
                domRoot.style.height = height + 'px';

                for (var id in this._layers) {

                    this._layers[id].resize(width, height);
                }

                this.refresh(null, true);
            }

            return this;
        };

        /**
         * 清除单独的一个层
         * @param {number} zLevel
         */
        Painter.prototype.clearLayer = function (zLevel) {
            var layer = this._layers[zLevel];
            if (layer) {
                layer.clear();
            }
        };

        /**
         * 释放
         */
        Painter.prototype.dispose = function () {
            if (this.isLoading()) {
                this.hideLoading();
            }

            this.root.innerHTML = '';

            this.root =
            this.storage =

            this._domRoot = 
            this._layers = null;
        };

        Painter.prototype.getDomHover = function () {
            return this._layers.hover.dom;
        };

        /**
         * 图像导出
         * @param {string} type
         * @param {string} [backgroundColor='#fff'] 背景色
         * @return {string} 图片的Base64 url
         */
        Painter.prototype.toDataURL = function (type, backgroundColor, args) {
            if (window['G_vmlCanvasManager']) {
                return null;
            }

            var imageLayer = new Layer('image', this);
            this._bgDom.appendChild(imageLayer.dom);
            imageLayer.initContext();
            
            var ctx = imageLayer.ctx;
            imageLayer.clearColor = backgroundColor || '#fff';
            imageLayer.clear();
            
            var self = this;
            // 升序遍历，shape上的zlevel指定绘画图层的z轴层叠

            this.storage.iterShape(
                function (shape) {
                    if (!shape.invisible) {
                        if (!shape.onbrush // 没有onbrush
                            // 有onbrush并且调用执行返回false或undefined则继续粉刷
                            || (shape.onbrush && !shape.onbrush(ctx, false))
                        ) {
                            if (config.catchBrushException) {
                                try {
                                    shape.brush(ctx, false, self.refreshNextFrame);
                                }
                                catch (error) {
                                    log(
                                        error,
                                        'brush error of ' + shape.type,
                                        shape
                                    );
                                }
                            }
                            else {
                                shape.brush(ctx, false, self.refreshNextFrame);
                            }
                        }
                    }
                },
                { normal: 'up', update: true }
            );
            var image = imageLayer.dom.toDataURL(type, args); 
            ctx = null;
            this._bgDom.removeChild(imageLayer.dom);
            return image;
        };

        /**
         * 获取绘图区域宽度
         */
        Painter.prototype.getWidth = function () {
            return this._width;
        };

        /**
         * 获取绘图区域高度
         */
        Painter.prototype.getHeight = function () {
            return this._height;
        };

        Painter.prototype._getWidth = function () {
            var root = this.root;
            var stl = root.currentStyle
                      || document.defaultView.getComputedStyle(root);

            return ((root.clientWidth || parseInt(stl.width, 10))
                    - parseInt(stl.paddingLeft, 10) // 请原谅我这比较粗暴
                    - parseInt(stl.paddingRight, 10)).toFixed(0) - 0;
        };

        Painter.prototype._getHeight = function () {
            var root = this.root;
            var stl = root.currentStyle
                      || document.defaultView.getComputedStyle(root);

            return ((root.clientHeight || parseInt(stl.height, 10))
                    - parseInt(stl.paddingTop, 10) // 请原谅我这比较粗暴
                    - parseInt(stl.paddingBottom, 10)).toFixed(0) - 0;
        };

        Painter.prototype._brushHover = function (shape) {
            var ctx = this._layers.hover.ctx;

            if (!shape.onbrush // 没有onbrush
                // 有onbrush并且调用执行返回false或undefined则继续粉刷
                || (shape.onbrush && !shape.onbrush(ctx, true))
            ) {
                var layer = this.getLayer(shape.zlevel);
                if (layer.needTransform) {
                    ctx.save();
                    layer.setTransform(ctx);
                }
                // Retina 优化
                if (config.catchBrushException) {
                    try {
                        shape.brush(ctx, true, this.refreshNextFrame);
                    }
                    catch (error) {
                        log(
                            error, 'hoverBrush error of ' + shape.type, shape
                        );
                    }
                }
                else {
                    shape.brush(ctx, true, this.refreshNextFrame);
                }
                if (layer.needTransform) {
                    ctx.restore();
                }
            }
        };

        Painter.prototype._shapeToImage = function (
            id, shape, width, height, devicePixelRatio
        ) {
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';
            canvas.setAttribute('width', width * devicePixelRatio);
            canvas.setAttribute('height', height * devicePixelRatio);

            ctx.clearRect(0, 0, width * devicePixelRatio, height * devicePixelRatio);

            var shapeTransform = {
                position : shape.position,
                rotation : shape.rotation,
                scale : shape.scale
            };
            shape.position = [ 0, 0, 0 ];
            shape.rotation = 0;
            shape.scale = [ 1, 1 ];
            if (shape) {
                shape.brush(ctx, false);
            }

            var ImageShape = require('./shape/Image');
            var imgShape = new ImageShape({
                id : id,
                style : {
                    x : 0,
                    y : 0,
                    image : canvas
                }
            });

            if (shapeTransform.position != null) {
                imgShape.position = shape.position = shapeTransform.position;
            }

            if (shapeTransform.rotation != null) {
                imgShape.rotation = shape.rotation = shapeTransform.rotation;
            }

            if (shapeTransform.scale != null) {
                imgShape.scale = shape.scale = shapeTransform.scale;
            }

            return imgShape;
        };

        Painter.prototype._createShapeToImageProcessor = function () {
            if (window['G_vmlCanvasManager']) {
                return doNothing;
            }

            var me = this;

            return function (id, e, width, height) {
                return me._shapeToImage(
                    id, e, width, height, config.devicePixelRatio
                );
            };
        };

        return Painter;
    }
);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL1BhaW50ZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBQYWludGVy57uY5Zu+5qih5Z2XXG4gKiBAbW9kdWxlIHpyZW5kZXIvUGFpbnRlclxuICogQGF1dGhvciBLZW5lciAoQEtlbmVyLeael+WzsCwga2VuZXIubGluZmVuZ0BnbWFpbC5jb20pXG4gKiAgICAgICAgIGVycm9ycmlrIChlcnJvcnJpa0BnbWFpbC5jb20pXG4gKiAgICAgICAgIHBpc3NhbmcgKGh0dHBzOi8vd3d3LmdpdGh1Yi5jb20vcGlzc2FuZylcbiAqL1xuIGRlZmluZShcbiAgICBmdW5jdGlvbiAocmVxdWlyZSkge1xuICAgICAgICAndXNlIHN0cmljdCc7XG5cbiAgICAgICAgdmFyIGNvbmZpZyA9IHJlcXVpcmUoJy4vY29uZmlnJyk7XG4gICAgICAgIHZhciB1dGlsID0gcmVxdWlyZSgnLi90b29sL3V0aWwnKTtcbiAgICAgICAgLy8gdmFyIHZlYzIgPSByZXF1aXJlKCcuL3Rvb2wvdmVjdG9yJyk7XG4gICAgICAgIHZhciBsb2cgPSByZXF1aXJlKCcuL3Rvb2wvbG9nJyk7XG4gICAgICAgIC8vIHZhciBtYXRyaXggPSByZXF1aXJlKCcuL3Rvb2wvbWF0cml4Jyk7XG4gICAgICAgIHZhciBCYXNlTG9hZGluZ0VmZmVjdCA9IHJlcXVpcmUoJy4vbG9hZGluZ0VmZmVjdC9CYXNlJyk7XG5cbiAgICAgICAgdmFyIExheWVyID0gcmVxdWlyZSgnLi9MYXllcicpO1xuXG4gICAgICAgIC8vIOi/lOWbnmZhbHNl55qE5pa55rOV77yM55So5LqO6YG/5YWN6aG16Z2i6KKr6YCJ5LitXG4gICAgICAgIGZ1bmN0aW9uIHJldHVybkZhbHNlKCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5LuA5LmI6YO95LiN5bmy55qE56m65pa55rOVXG4gICAgICAgIGZ1bmN0aW9uIGRvTm90aGluZygpIHt9XG5cbiAgICAgICAgZnVuY3Rpb24gaXNMYXllclZhbGlkKGxheWVyKSB7XG4gICAgICAgICAgICBpZiAoIWxheWVyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAobGF5ZXIuaXNCdWlsZGluKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YobGF5ZXIucmVzaXplKSAhPT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgICAgICAgIHx8IHR5cGVvZihsYXllci5yZWZyZXNoKSAhPT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAYWxpYXMgbW9kdWxlOnpyZW5kZXIvUGFpbnRlclxuICAgICAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gcm9vdCDnu5jlm77lrrnlmahcbiAgICAgICAgICogQHBhcmFtIHttb2R1bGU6enJlbmRlci9TdG9yYWdlfSBzdG9yYWdlXG4gICAgICAgICAqL1xuICAgICAgICB2YXIgUGFpbnRlciA9IGZ1bmN0aW9uIChyb290LCBzdG9yYWdlKSB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOe7mOWbvuWuueWZqFxuICAgICAgICAgICAgICogQHR5cGUge0hUTUxFbGVtZW50fVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLnJvb3QgPSByb290O1xuICAgICAgICAgICAgcm9vdC5zdHlsZVsnLXdlYmtpdC10YXAtaGlnaGxpZ2h0LWNvbG9yJ10gPSAndHJhbnNwYXJlbnQnO1xuICAgICAgICAgICAgcm9vdC5zdHlsZVsnLXdlYmtpdC11c2VyLXNlbGVjdCddID0gJ25vbmUnO1xuICAgICAgICAgICAgcm9vdC5zdHlsZVsndXNlci1zZWxlY3QnXSA9ICdub25lJztcbiAgICAgICAgICAgIHJvb3Quc3R5bGVbJy13ZWJraXQtdG91Y2gtY2FsbG91dCddID0gJ25vbmUnO1xuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEB0eXBlIHttb2R1bGU6enJlbmRlci9TdG9yYWdlfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLnN0b3JhZ2UgPSBzdG9yYWdlO1xuXG4gICAgICAgICAgICByb290LmlubmVySFRNTCA9ICcnO1xuICAgICAgICAgICAgdGhpcy5fd2lkdGggPSB0aGlzLl9nZXRXaWR0aCgpOyAvLyDlrr3vvIznvJPlrZjorrDlvZVcbiAgICAgICAgICAgIHRoaXMuX2hlaWdodCA9IHRoaXMuX2dldEhlaWdodCgpOyAvLyDpq5jvvIznvJPlrZjorrDlvZVcblxuICAgICAgICAgICAgdmFyIGRvbVJvb3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICAgIHRoaXMuX2RvbVJvb3QgPSBkb21Sb290O1xuXG4gICAgICAgICAgICAvLyBkb21Sb290Lm9uc2VsZWN0c3RhcnQgPSByZXR1cm5GYWxzZTsgLy8g6YG/5YWN6aG16Z2i6YCJ5Lit55qE5bC05bCsXG4gICAgICAgICAgICBkb21Sb290LnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcbiAgICAgICAgICAgIGRvbVJvb3Quc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcbiAgICAgICAgICAgIGRvbVJvb3Quc3R5bGUud2lkdGggPSB0aGlzLl93aWR0aCArICdweCc7XG4gICAgICAgICAgICBkb21Sb290LnN0eWxlLmhlaWdodCA9IHRoaXMuX2hlaWdodCArICdweCc7XG4gICAgICAgICAgICByb290LmFwcGVuZENoaWxkKGRvbVJvb3QpO1xuXG4gICAgICAgICAgICB0aGlzLl9sYXllcnMgPSB7fTtcblxuICAgICAgICAgICAgdGhpcy5femxldmVsTGlzdCA9IFtdO1xuXG4gICAgICAgICAgICB0aGlzLl9sYXllckNvbmZpZyA9IHt9O1xuXG4gICAgICAgICAgICB0aGlzLl9sb2FkaW5nRWZmZWN0ID0gbmV3IEJhc2VMb2FkaW5nRWZmZWN0KHt9KTtcbiAgICAgICAgICAgIHRoaXMuc2hhcGVUb0ltYWdlID0gdGhpcy5fY3JlYXRlU2hhcGVUb0ltYWdlUHJvY2Vzc29yKCk7XG5cbiAgICAgICAgICAgIC8vIOWIm+W7uuWQhOWxgmNhbnZhc1xuICAgICAgICAgICAgLy8g6IOM5pmvXG4gICAgICAgICAgICB0aGlzLl9iZ0RvbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgdGhpcy5fYmdEb20uc3R5bGUuY3NzVGV4dCA9IFtcbiAgICAgICAgICAgICAgICAncG9zaXRpb246YWJzb2x1dGU7bGVmdDowcHg7dG9wOjBweDt3aWR0aDonLFxuICAgICAgICAgICAgICAgIHRoaXMuX3dpZHRoLCAncHg7aGVpZ2h0OicsIHRoaXMuX2hlaWdodCArICdweDsnLCBcbiAgICAgICAgICAgICAgICAnLXdlYmtpdC11c2VyLXNlbGVjdDpub25lO3VzZXItc2VsZWN0O25vbmU7JyxcbiAgICAgICAgICAgICAgICAnLXdlYmtpdC10b3VjaC1jYWxsb3V0Om5vbmU7J1xuICAgICAgICAgICAgXS5qb2luKCcnKTtcbiAgICAgICAgICAgIHRoaXMuX2JnRG9tLnNldEF0dHJpYnV0ZSgnZGF0YS16ci1kb20taWQnLCAnYmcnKTtcbiAgICAgICAgICAgIHRoaXMuX2JnRG9tLmNsYXNzTmFtZSA9IGNvbmZpZy5lbGVtZW50Q2xhc3NOYW1lO1xuXG4gICAgICAgICAgICBkb21Sb290LmFwcGVuZENoaWxkKHRoaXMuX2JnRG9tKTtcbiAgICAgICAgICAgIHRoaXMuX2JnRG9tLm9uc2VsZWN0c3RhcnQgPSByZXR1cm5GYWxzZTtcblxuICAgICAgICAgICAgLy8g6auY5LquXG4gICAgICAgICAgICB2YXIgaG92ZXJMYXllciA9IG5ldyBMYXllcignX3pyZW5kZXJfaG92ZXJfJywgdGhpcyk7XG4gICAgICAgICAgICB0aGlzLl9sYXllcnNbJ2hvdmVyJ10gPSBob3ZlckxheWVyO1xuICAgICAgICAgICAgZG9tUm9vdC5hcHBlbmRDaGlsZChob3ZlckxheWVyLmRvbSk7XG4gICAgICAgICAgICBob3ZlckxheWVyLmluaXRDb250ZXh0KCk7XG5cbiAgICAgICAgICAgIGhvdmVyTGF5ZXIuZG9tLm9uc2VsZWN0c3RhcnQgPSByZXR1cm5GYWxzZTtcbiAgICAgICAgICAgIGhvdmVyTGF5ZXIuZG9tLnN0eWxlWyctd2Via2l0LXVzZXItc2VsZWN0J10gPSAnbm9uZSc7XG4gICAgICAgICAgICBob3ZlckxheWVyLmRvbS5zdHlsZVsndXNlci1zZWxlY3QnXSA9ICdub25lJztcbiAgICAgICAgICAgIGhvdmVyTGF5ZXIuZG9tLnN0eWxlWyctd2Via2l0LXRvdWNoLWNhbGxvdXQnXSA9ICdub25lJztcblxuICAgICAgICAgICAgLy8gV2lsbCBiZSBpbmplY3RlZCBieSB6cmVuZGVyIGluc3RhbmNlXG4gICAgICAgICAgICB0aGlzLnJlZnJlc2hOZXh0RnJhbWUgPSBudWxsO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDpppbmrKHnu5jlm77vvIzliJvlu7rlkITnp41kb23lkoxjb250ZXh0XG4gICAgICAgICAqIFxuICAgICAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayDnu5jnlLvnu5PmnZ/lkI7nmoTlm57osIPlh73mlbBcbiAgICAgICAgICovXG4gICAgICAgIFBhaW50ZXIucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNMb2FkaW5nKCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmhpZGVMb2FkaW5nKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBUT0RPXG4gICAgICAgICAgICB0aGlzLnJlZnJlc2goY2FsbGJhY2ssIHRydWUpO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICog5Yi35pawXG4gICAgICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIOWIt+aWsOe7k+adn+WQjueahOWbnuiwg+WHveaVsFxuICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IHBhaW50QWxsIOW8uuWItue7mOWItuaJgOaciXNoYXBlXG4gICAgICAgICAqL1xuICAgICAgICBQYWludGVyLnByb3RvdHlwZS5yZWZyZXNoID0gZnVuY3Rpb24gKGNhbGxiYWNrLCBwYWludEFsbCkge1xuICAgICAgICAgICAgdmFyIGxpc3QgPSB0aGlzLnN0b3JhZ2UuZ2V0U2hhcGVMaXN0KHRydWUpO1xuICAgICAgICAgICAgdGhpcy5fcGFpbnRMaXN0KGxpc3QsIHBhaW50QWxsKTtcblxuICAgICAgICAgICAgLy8gUGFpbnQgY3VzdHVtIGxheWVyc1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl96bGV2ZWxMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHogPSB0aGlzLl96bGV2ZWxMaXN0W2ldO1xuICAgICAgICAgICAgICAgIHZhciBsYXllciA9IHRoaXMuX2xheWVyc1t6XTtcbiAgICAgICAgICAgICAgICBpZiAoISBsYXllci5pc0J1aWxkaW4gJiYgbGF5ZXIucmVmcmVzaCkge1xuICAgICAgICAgICAgICAgICAgICBsYXllci5yZWZyZXNoKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfTtcblxuICAgICAgICBQYWludGVyLnByb3RvdHlwZS5fcHJlUHJvY2Vzc0xheWVyID0gZnVuY3Rpb24gKGxheWVyKSB7XG4gICAgICAgICAgICBsYXllci51bnVzZWRDb3VudCsrO1xuICAgICAgICAgICAgbGF5ZXIudXBkYXRlVHJhbnNmb3JtKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgUGFpbnRlci5wcm90b3R5cGUuX3Bvc3RQcm9jZXNzTGF5ZXIgPSBmdW5jdGlvbiAobGF5ZXIpIHtcbiAgICAgICAgICAgIGxheWVyLmRpcnR5ID0gZmFsc2U7XG4gICAgICAgICAgICAvLyDliKDpmaTov4fmnJ/nmoTlsYJcbiAgICAgICAgICAgIC8vIFBFTkRJTkdcbiAgICAgICAgICAgIC8vIGlmIChsYXllci51bnVzZWRDb3VudCA+PSA1MDApIHtcbiAgICAgICAgICAgIC8vICAgICB0aGlzLmRlbExheWVyKHopO1xuICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgaWYgKGxheWVyLnVudXNlZENvdW50ID09IDEpIHtcbiAgICAgICAgICAgICAgICBsYXllci5jbGVhcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuIFxuICAgICAgICBQYWludGVyLnByb3RvdHlwZS5fcGFpbnRMaXN0ID0gZnVuY3Rpb24gKGxpc3QsIHBhaW50QWxsKSB7XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YocGFpbnRBbGwpID09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgcGFpbnRBbGwgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5fdXBkYXRlTGF5ZXJTdGF0dXMobGlzdCk7XG5cbiAgICAgICAgICAgIHZhciBjdXJyZW50TGF5ZXI7XG4gICAgICAgICAgICB2YXIgY3VycmVudFpMZXZlbDtcbiAgICAgICAgICAgIHZhciBjdHg7XG5cbiAgICAgICAgICAgIHRoaXMuZWFjaEJ1aWxkaW5MYXllcih0aGlzLl9wcmVQcm9jZXNzTGF5ZXIpO1xuXG4gICAgICAgICAgICAvLyB2YXIgaW52VHJhbnNmb3JtID0gW107XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gbGlzdC5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgc2hhcGUgPSBsaXN0W2ldO1xuXG4gICAgICAgICAgICAgICAgLy8gQ2hhbmdlIGRyYXcgbGF5ZXJcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudFpMZXZlbCAhPT0gc2hhcGUuemxldmVsKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjdXJyZW50TGF5ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdXJyZW50TGF5ZXIubmVlZFRyYW5zZm9ybSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5yZXN0b3JlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHguZmx1c2ggJiYgY3R4LmZsdXNoKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBjdXJyZW50WkxldmVsID0gc2hhcGUuemxldmVsO1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50TGF5ZXIgPSB0aGlzLmdldExheWVyKGN1cnJlbnRaTGV2ZWwpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICghY3VycmVudExheWVyLmlzQnVpbGRpbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9nKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdaTGV2ZWwgJyArIGN1cnJlbnRaTGV2ZWxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArICcgaGFzIGJlZW4gdXNlZCBieSB1bmtvd24gbGF5ZXIgJyArIGN1cnJlbnRMYXllci5pZFxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGN0eCA9IGN1cnJlbnRMYXllci5jdHg7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gUmVzZXQgdGhlIGNvdW50XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRMYXllci51bnVzZWRDb3VudCA9IDA7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRMYXllci5kaXJ0eSB8fCBwYWludEFsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudExheWVyLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudExheWVyLm5lZWRUcmFuc2Zvcm0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5zYXZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50TGF5ZXIuc2V0VHJhbnNmb3JtKGN0eCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoKGN1cnJlbnRMYXllci5kaXJ0eSB8fCBwYWludEFsbCkgJiYgIXNoYXBlLmludmlzaWJsZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAhc2hhcGUub25icnVzaFxuICAgICAgICAgICAgICAgICAgICAgICAgfHwgKHNoYXBlLm9uYnJ1c2ggJiYgIXNoYXBlLm9uYnJ1c2goY3R4LCBmYWxzZSkpXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbmZpZy5jYXRjaEJydXNoRXhjZXB0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hhcGUuYnJ1c2goY3R4LCBmYWxzZSwgdGhpcy5yZWZyZXNoTmV4dEZyYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2JydXNoIGVycm9yIG9mICcgKyBzaGFwZS50eXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hhcGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaGFwZS5icnVzaChjdHgsIGZhbHNlLCB0aGlzLnJlZnJlc2hOZXh0RnJhbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgc2hhcGUuX19kaXJ0eSA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoY3VycmVudExheWVyKSB7XG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRMYXllci5uZWVkVHJhbnNmb3JtKSB7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5yZXN0b3JlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGN0eC5mbHVzaCAmJiBjdHguZmx1c2goKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5lYWNoQnVpbGRpbkxheWVyKHRoaXMuX3Bvc3RQcm9jZXNzTGF5ZXIpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDojrflj5YgemxldmVsIOaJgOWcqOWxgu+8jOWmguaenOS4jeWtmOWcqOWImeS8muWIm+W7uuS4gOS4quaWsOeahOWxglxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gemxldmVsXG4gICAgICAgICAqIEByZXR1cm4ge21vZHVsZTp6cmVuZGVyL0xheWVyfVxuICAgICAgICAgKi9cbiAgICAgICAgUGFpbnRlci5wcm90b3R5cGUuZ2V0TGF5ZXIgPSBmdW5jdGlvbiAoemxldmVsKSB7XG4gICAgICAgICAgICB2YXIgbGF5ZXIgPSB0aGlzLl9sYXllcnNbemxldmVsXTtcbiAgICAgICAgICAgIGlmICghbGF5ZXIpIHtcbiAgICAgICAgICAgICAgICAvLyBDcmVhdGUgYSBuZXcgbGF5ZXJcbiAgICAgICAgICAgICAgICBsYXllciA9IG5ldyBMYXllcih6bGV2ZWwsIHRoaXMpO1xuICAgICAgICAgICAgICAgIGxheWVyLmlzQnVpbGRpbiA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fbGF5ZXJDb25maWdbemxldmVsXSkge1xuICAgICAgICAgICAgICAgICAgICB1dGlsLm1lcmdlKGxheWVyLCB0aGlzLl9sYXllckNvbmZpZ1t6bGV2ZWxdLCB0cnVlKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBsYXllci51cGRhdGVUcmFuc2Zvcm0oKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuaW5zZXJ0TGF5ZXIoemxldmVsLCBsYXllcik7XG5cbiAgICAgICAgICAgICAgICAvLyBDb250ZXh0IGlzIGNyZWF0ZWQgYWZ0ZXIgZG9tIGluc2VydGVkIHRvIGRvY3VtZW50XG4gICAgICAgICAgICAgICAgLy8gT3IgZXhjYW52YXMgd2lsbCBnZXQgMHB4IGNsaWVudFdpZHRoIGFuZCBjbGllbnRIZWlnaHRcbiAgICAgICAgICAgICAgICBsYXllci5pbml0Q29udGV4dCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gbGF5ZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgUGFpbnRlci5wcm90b3R5cGUuaW5zZXJ0TGF5ZXIgPSBmdW5jdGlvbiAoemxldmVsLCBsYXllcikge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2xheWVyc1t6bGV2ZWxdKSB7XG4gICAgICAgICAgICAgICAgbG9nKCdaTGV2ZWwgJyArIHpsZXZlbCArICcgaGFzIGJlZW4gdXNlZCBhbHJlYWR5Jyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgaXMgYSB2YWxpZCBsYXllclxuICAgICAgICAgICAgaWYgKCFpc0xheWVyVmFsaWQobGF5ZXIpKSB7XG4gICAgICAgICAgICAgICAgbG9nKCdMYXllciBvZiB6bGV2ZWwgJyArIHpsZXZlbCArICcgaXMgbm90IHZhbGlkJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgbGVuID0gdGhpcy5femxldmVsTGlzdC5sZW5ndGg7XG4gICAgICAgICAgICB2YXIgcHJldkxheWVyID0gbnVsbDtcbiAgICAgICAgICAgIHZhciBpID0gLTE7XG4gICAgICAgICAgICBpZiAobGVuID4gMCAmJiB6bGV2ZWwgPiB0aGlzLl96bGV2ZWxMaXN0WzBdKSB7XG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlbiAtIDE7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl96bGV2ZWxMaXN0W2ldIDwgemxldmVsXG4gICAgICAgICAgICAgICAgICAgICAgICAmJiB0aGlzLl96bGV2ZWxMaXN0W2kgKyAxXSA+IHpsZXZlbFxuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHByZXZMYXllciA9IHRoaXMuX2xheWVyc1t0aGlzLl96bGV2ZWxMaXN0W2ldXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3psZXZlbExpc3Quc3BsaWNlKGkgKyAxLCAwLCB6bGV2ZWwpO1xuXG4gICAgICAgICAgICB2YXIgcHJldkRvbSA9IHByZXZMYXllciA/IHByZXZMYXllci5kb20gOiB0aGlzLl9iZ0RvbTtcbiAgICAgICAgICAgIGlmIChwcmV2RG9tLm5leHRTaWJsaW5nKSB7XG4gICAgICAgICAgICAgICAgcHJldkRvbS5wYXJlbnROb2RlLmluc2VydEJlZm9yZShcbiAgICAgICAgICAgICAgICAgICAgbGF5ZXIuZG9tLFxuICAgICAgICAgICAgICAgICAgICBwcmV2RG9tLm5leHRTaWJsaW5nXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHByZXZEb20ucGFyZW50Tm9kZS5hcHBlbmRDaGlsZChsYXllci5kb20pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLl9sYXllcnNbemxldmVsXSA9IGxheWVyO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIEl0ZXJhdGUgZWFjaCBsYXllclxuICAgICAgICBQYWludGVyLnByb3RvdHlwZS5lYWNoTGF5ZXIgPSBmdW5jdGlvbiAoY2IsIGNvbnRleHQpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5femxldmVsTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciB6ID0gdGhpcy5femxldmVsTGlzdFtpXTtcbiAgICAgICAgICAgICAgICBjYi5jYWxsKGNvbnRleHQsIHRoaXMuX2xheWVyc1t6XSwgeik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gSXRlcmF0ZSBlYWNoIGJ1aWxkaW4gbGF5ZXJcbiAgICAgICAgUGFpbnRlci5wcm90b3R5cGUuZWFjaEJ1aWxkaW5MYXllciA9IGZ1bmN0aW9uIChjYiwgY29udGV4dCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl96bGV2ZWxMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHogPSB0aGlzLl96bGV2ZWxMaXN0W2ldO1xuICAgICAgICAgICAgICAgIHZhciBsYXllciA9IHRoaXMuX2xheWVyc1t6XTtcbiAgICAgICAgICAgICAgICBpZiAobGF5ZXIuaXNCdWlsZGluKSB7XG4gICAgICAgICAgICAgICAgICAgIGNiLmNhbGwoY29udGV4dCwgbGF5ZXIsIHopO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvLyBJdGVyYXRlIGVhY2ggb3RoZXIgbGF5ZXIgZXhjZXB0IGJ1aWxkaW4gbGF5ZXJcbiAgICAgICAgUGFpbnRlci5wcm90b3R5cGUuZWFjaE90aGVyTGF5ZXIgPSBmdW5jdGlvbiAoY2IsIGNvbnRleHQpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5femxldmVsTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciB6ID0gdGhpcy5femxldmVsTGlzdFtpXTtcbiAgICAgICAgICAgICAgICB2YXIgbGF5ZXIgPSB0aGlzLl9sYXllcnNbel07XG4gICAgICAgICAgICAgICAgaWYgKCEgbGF5ZXIuaXNCdWlsZGluKSB7XG4gICAgICAgICAgICAgICAgICAgIGNiLmNhbGwoY29udGV4dCwgbGF5ZXIsIHopO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICog6I635Y+W5omA5pyJ5bey5Yib5bu655qE5bGCXG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXkuPG1vZHVsZTp6cmVuZGVyL0xheWVyPn0gW3ByZXZMYXllcl1cbiAgICAgICAgICovXG4gICAgICAgIFBhaW50ZXIucHJvdG90eXBlLmdldExheWVycyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9sYXllcnM7XG4gICAgICAgIH07XG5cbiAgICAgICAgUGFpbnRlci5wcm90b3R5cGUuX3VwZGF0ZUxheWVyU3RhdHVzID0gZnVuY3Rpb24gKGxpc3QpIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIGxheWVycyA9IHRoaXMuX2xheWVycztcblxuICAgICAgICAgICAgdmFyIGVsQ291bnRzID0ge307XG5cbiAgICAgICAgICAgIHRoaXMuZWFjaEJ1aWxkaW5MYXllcihmdW5jdGlvbiAobGF5ZXIsIHopIHtcbiAgICAgICAgICAgICAgICBlbENvdW50c1t6XSA9IGxheWVyLmVsQ291bnQ7XG4gICAgICAgICAgICAgICAgbGF5ZXIuZWxDb3VudCA9IDA7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBsaXN0Lmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBzaGFwZSA9IGxpc3RbaV07XG4gICAgICAgICAgICAgICAgdmFyIHpsZXZlbCA9IHNoYXBlLnpsZXZlbDtcbiAgICAgICAgICAgICAgICB2YXIgbGF5ZXIgPSBsYXllcnNbemxldmVsXTtcbiAgICAgICAgICAgICAgICBpZiAobGF5ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgbGF5ZXIuZWxDb3VudCsrO1xuICAgICAgICAgICAgICAgICAgICAvLyDlt7Lnu4/ooqvmoIforrDkuLrpnIDopoHliLfmlrBcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxheWVyLmRpcnR5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBsYXllci5kaXJ0eSA9IHNoYXBlLl9fZGlydHk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDlsYLkuK3nmoTlhYPntKDmlbDph4/mnInlj5HnlJ/lj5jljJZcbiAgICAgICAgICAgIHRoaXMuZWFjaEJ1aWxkaW5MYXllcihmdW5jdGlvbiAobGF5ZXIsIHopIHtcbiAgICAgICAgICAgICAgICBpZiAoZWxDb3VudHNbel0gIT09IGxheWVyLmVsQ291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgbGF5ZXIuZGlydHkgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDmjIflrprnmoTlm77lvaLliJfooahcbiAgICAgICAgICogQHBhcmFtIHtBcnJheS48bW9kdWxlOnpyZW5kZXIvc2hhcGUvQmFzZT59IHNoYXBlTGlzdCDpnIDopoHmm7TmlrDnmoTlm77lvaLlhYPntKDliJfooahcbiAgICAgICAgICogQHBhcmFtIHtGdW5jdGlvbn0gW2NhbGxiYWNrXSDop4blm77mm7TmlrDlkI7lm57osIPlh73mlbBcbiAgICAgICAgICovXG4gICAgICAgIFBhaW50ZXIucHJvdG90eXBlLnJlZnJlc2hTaGFwZXMgPSBmdW5jdGlvbiAoc2hhcGVMaXN0LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBzaGFwZUxpc3QubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNoYXBlID0gc2hhcGVMaXN0W2ldO1xuICAgICAgICAgICAgICAgIHNoYXBlLm1vZFNlbGYoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5yZWZyZXNoKGNhbGxiYWNrKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDorr7nva5sb2FkaW5n54m55pWIXG4gICAgICAgICAqIFxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gbG9hZGluZ0VmZmVjdCBsb2FkaW5n54m55pWIXG4gICAgICAgICAqIEByZXR1cm4ge1BhaW50ZXJ9XG4gICAgICAgICAqL1xuICAgICAgICBQYWludGVyLnByb3RvdHlwZS5zZXRMb2FkaW5nRWZmZWN0ID0gZnVuY3Rpb24gKGxvYWRpbmdFZmZlY3QpIHtcbiAgICAgICAgICAgIHRoaXMuX2xvYWRpbmdFZmZlY3QgPSBsb2FkaW5nRWZmZWN0O1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOa4hemZpGhvdmVy5bGC5aSW5omA5pyJ5YaF5a65XG4gICAgICAgICAqL1xuICAgICAgICBQYWludGVyLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuZWFjaEJ1aWxkaW5MYXllcih0aGlzLl9jbGVhckxheWVyKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9O1xuXG4gICAgICAgIFBhaW50ZXIucHJvdG90eXBlLl9jbGVhckxheWVyID0gZnVuY3Rpb24gKGxheWVyKSB7XG4gICAgICAgICAgICBsYXllci5jbGVhcigpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDkv67mlLnmjIflrpp6bGV2ZWznmoTnu5jliLblj4LmlbBcbiAgICAgICAgICogXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSB6bGV2ZWxcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGNvbmZpZyDphY3nva7lr7nosaFcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuY2xlYXJDb2xvcj0wXSDmr4/mrKHmuIXnqbrnlLvluIPnmoTpopzoibJcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcubW90aW9uQmx1cj1mYWxzZV0g5piv5ZCm5byA5ZCv5Yqo5oCB5qih57OKXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbY29uZmlnLmxhc3RGcmFtZUFscGhhPTAuN11cbiAgICAgICAgICogICAgICAgICAgICAgICAgIOWcqOW8gOWQr+WKqOaAgeaooeeziueahOaXtuWAmeS9v+eUqO+8jOS4juS4iuS4gOW4p+a3t+WQiOeahGFscGhh5YC877yM5YC86LaK5aSn5bC+6L+56LaK5piO5pi+XG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXkuPG51bWJlcj59IFtwb3NpdGlvbl0g5bGC55qE5bmz56e7XG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXkuPG51bWJlcj59IFtyb3RhdGlvbl0g5bGC55qE5peL6L2sXG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXkuPG51bWJlcj59IFtzY2FsZV0g5bGC55qE57yp5pS+XG4gICAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3pvb21hYmxlPWZhbHNlXSDlsYLmmK/lkKbmlK/mjIHpvKDmoIfnvKnmlL7mk43kvZxcbiAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBbcGFuYWJsZT1mYWxzZV0g5bGC5piv5ZCm5pSv5oyB6byg5qCH5bmz56e75pON5L2cXG4gICAgICAgICAqL1xuICAgICAgICBQYWludGVyLnByb3RvdHlwZS5tb2RMYXllciA9IGZ1bmN0aW9uICh6bGV2ZWwsIGNvbmZpZykge1xuICAgICAgICAgICAgaWYgKGNvbmZpZykge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5fbGF5ZXJDb25maWdbemxldmVsXSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9sYXllckNvbmZpZ1t6bGV2ZWxdID0gY29uZmlnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdXRpbC5tZXJnZSh0aGlzLl9sYXllckNvbmZpZ1t6bGV2ZWxdLCBjb25maWcsIHRydWUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBsYXllciA9IHRoaXMuX2xheWVyc1t6bGV2ZWxdO1xuXG4gICAgICAgICAgICAgICAgaWYgKGxheWVyKSB7XG4gICAgICAgICAgICAgICAgICAgIHV0aWwubWVyZ2UobGF5ZXIsIHRoaXMuX2xheWVyQ29uZmlnW3psZXZlbF0sIHRydWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICog5Yig6Zmk5oyH5a6a5bGCXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB6bGV2ZWwg5bGC5omA5Zyo55qEemxldmVsXG4gICAgICAgICAqL1xuICAgICAgICBQYWludGVyLnByb3RvdHlwZS5kZWxMYXllciA9IGZ1bmN0aW9uICh6bGV2ZWwpIHtcbiAgICAgICAgICAgIHZhciBsYXllciA9IHRoaXMuX2xheWVyc1t6bGV2ZWxdO1xuICAgICAgICAgICAgaWYgKCFsYXllcikge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFNhdmUgY29uZmlnXG4gICAgICAgICAgICB0aGlzLm1vZExheWVyKHpsZXZlbCwge1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBsYXllci5wb3NpdGlvbixcbiAgICAgICAgICAgICAgICByb3RhdGlvbjogbGF5ZXIucm90YXRpb24sXG4gICAgICAgICAgICAgICAgc2NhbGU6IGxheWVyLnNjYWxlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGxheWVyLmRvbS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGxheWVyLmRvbSk7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fbGF5ZXJzW3psZXZlbF07XG5cbiAgICAgICAgICAgIHRoaXMuX3psZXZlbExpc3Quc3BsaWNlKHV0aWwuaW5kZXhPZih0aGlzLl96bGV2ZWxMaXN0LCB6bGV2ZWwpLCAxKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICog5Yi35pawaG92ZXLlsYJcbiAgICAgICAgICovXG4gICAgICAgIFBhaW50ZXIucHJvdG90eXBlLnJlZnJlc2hIb3ZlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuY2xlYXJIb3ZlcigpO1xuICAgICAgICAgICAgdmFyIGxpc3QgPSB0aGlzLnN0b3JhZ2UuZ2V0SG92ZXJTaGFwZXModHJ1ZSk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGxpc3QubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fYnJ1c2hIb3ZlcihsaXN0W2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBjdHggPSB0aGlzLl9sYXllcnMuaG92ZXIuY3R4O1xuICAgICAgICAgICAgY3R4LmZsdXNoICYmIGN0eC5mbHVzaCgpO1xuXG4gICAgICAgICAgICB0aGlzLnN0b3JhZ2UuZGVsSG92ZXIoKTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOa4hemZpGhvdmVy5bGC5omA5pyJ5YaF5a65XG4gICAgICAgICAqL1xuICAgICAgICBQYWludGVyLnByb3RvdHlwZS5jbGVhckhvdmVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGhvdmVyID0gdGhpcy5fbGF5ZXJzLmhvdmVyO1xuICAgICAgICAgICAgaG92ZXIgJiYgaG92ZXIuY2xlYXIoKTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOaYvuekumxvYWRpbmdcbiAgICAgICAgICogXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0PX0gbG9hZGluZ0VmZmVjdCBsb2FkaW5n5pWI5p6c5a+56LGhXG4gICAgICAgICAqL1xuICAgICAgICBQYWludGVyLnByb3RvdHlwZS5zaG93TG9hZGluZyA9IGZ1bmN0aW9uIChsb2FkaW5nRWZmZWN0KSB7XG4gICAgICAgICAgICB0aGlzLl9sb2FkaW5nRWZmZWN0ICYmIHRoaXMuX2xvYWRpbmdFZmZlY3Quc3RvcCgpO1xuICAgICAgICAgICAgbG9hZGluZ0VmZmVjdCAmJiB0aGlzLnNldExvYWRpbmdFZmZlY3QobG9hZGluZ0VmZmVjdCk7XG4gICAgICAgICAgICB0aGlzLl9sb2FkaW5nRWZmZWN0LnN0YXJ0KHRoaXMpO1xuICAgICAgICAgICAgdGhpcy5sb2FkaW5nID0gdHJ1ZTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIGxvYWRpbmfnu5PmnZ9cbiAgICAgICAgICovXG4gICAgICAgIFBhaW50ZXIucHJvdG90eXBlLmhpZGVMb2FkaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5fbG9hZGluZ0VmZmVjdC5zdG9wKCk7XG5cbiAgICAgICAgICAgIHRoaXMuY2xlYXJIb3ZlcigpO1xuICAgICAgICAgICAgdGhpcy5sb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogbG9hZGluZ+e7k+adn+WIpOaWrVxuICAgICAgICAgKi9cbiAgICAgICAgUGFpbnRlci5wcm90b3R5cGUuaXNMb2FkaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubG9hZGluZztcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICog5Yy65Z+f5aSn5bCP5Y+Y5YyW5ZCO6YeN57uYXG4gICAgICAgICAqL1xuICAgICAgICBQYWludGVyLnByb3RvdHlwZS5yZXNpemUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgZG9tUm9vdCA9IHRoaXMuX2RvbVJvb3Q7XG4gICAgICAgICAgICBkb21Sb290LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG5cbiAgICAgICAgICAgIHZhciB3aWR0aCA9IHRoaXMuX2dldFdpZHRoKCk7XG4gICAgICAgICAgICB2YXIgaGVpZ2h0ID0gdGhpcy5fZ2V0SGVpZ2h0KCk7XG5cbiAgICAgICAgICAgIGRvbVJvb3Quc3R5bGUuZGlzcGxheSA9ICcnO1xuXG4gICAgICAgICAgICAvLyDkvJjljJbmsqHmnInlrp7pmYXmlLnlj5jnmoRyZXNpemVcbiAgICAgICAgICAgIGlmICh0aGlzLl93aWR0aCAhPSB3aWR0aCB8fCBoZWlnaHQgIT0gdGhpcy5faGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fd2lkdGggPSB3aWR0aDtcbiAgICAgICAgICAgICAgICB0aGlzLl9oZWlnaHQgPSBoZWlnaHQ7XG5cbiAgICAgICAgICAgICAgICBkb21Sb290LnN0eWxlLndpZHRoID0gd2lkdGggKyAncHgnO1xuICAgICAgICAgICAgICAgIGRvbVJvb3Quc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0ICsgJ3B4JztcblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGlkIGluIHRoaXMuX2xheWVycykge1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2xheWVyc1tpZF0ucmVzaXplKHdpZHRoLCBoZWlnaHQpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMucmVmcmVzaChudWxsLCB0cnVlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOa4hemZpOWNleeLrOeahOS4gOS4quWxglxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gekxldmVsXG4gICAgICAgICAqL1xuICAgICAgICBQYWludGVyLnByb3RvdHlwZS5jbGVhckxheWVyID0gZnVuY3Rpb24gKHpMZXZlbCkge1xuICAgICAgICAgICAgdmFyIGxheWVyID0gdGhpcy5fbGF5ZXJzW3pMZXZlbF07XG4gICAgICAgICAgICBpZiAobGF5ZXIpIHtcbiAgICAgICAgICAgICAgICBsYXllci5jbGVhcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDph4rmlL5cbiAgICAgICAgICovXG4gICAgICAgIFBhaW50ZXIucHJvdG90eXBlLmRpc3Bvc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5pc0xvYWRpbmcoKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuaGlkZUxvYWRpbmcoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5yb290LmlubmVySFRNTCA9ICcnO1xuXG4gICAgICAgICAgICB0aGlzLnJvb3QgPVxuICAgICAgICAgICAgdGhpcy5zdG9yYWdlID1cblxuICAgICAgICAgICAgdGhpcy5fZG9tUm9vdCA9IFxuICAgICAgICAgICAgdGhpcy5fbGF5ZXJzID0gbnVsbDtcbiAgICAgICAgfTtcblxuICAgICAgICBQYWludGVyLnByb3RvdHlwZS5nZXREb21Ib3ZlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9sYXllcnMuaG92ZXIuZG9tO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDlm77lg4/lr7zlh7pcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHR5cGVcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IFtiYWNrZ3JvdW5kQ29sb3I9JyNmZmYnXSDog4zmma/oibJcbiAgICAgICAgICogQHJldHVybiB7c3RyaW5nfSDlm77niYfnmoRCYXNlNjQgdXJsXG4gICAgICAgICAqL1xuICAgICAgICBQYWludGVyLnByb3RvdHlwZS50b0RhdGFVUkwgPSBmdW5jdGlvbiAodHlwZSwgYmFja2dyb3VuZENvbG9yLCBhcmdzKSB7XG4gICAgICAgICAgICBpZiAod2luZG93WydHX3ZtbENhbnZhc01hbmFnZXInXSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgaW1hZ2VMYXllciA9IG5ldyBMYXllcignaW1hZ2UnLCB0aGlzKTtcbiAgICAgICAgICAgIHRoaXMuX2JnRG9tLmFwcGVuZENoaWxkKGltYWdlTGF5ZXIuZG9tKTtcbiAgICAgICAgICAgIGltYWdlTGF5ZXIuaW5pdENvbnRleHQoKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIGN0eCA9IGltYWdlTGF5ZXIuY3R4O1xuICAgICAgICAgICAgaW1hZ2VMYXllci5jbGVhckNvbG9yID0gYmFja2dyb3VuZENvbG9yIHx8ICcjZmZmJztcbiAgICAgICAgICAgIGltYWdlTGF5ZXIuY2xlYXIoKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgLy8g5Y2H5bqP6YGN5Y6G77yMc2hhcGXkuIrnmoR6bGV2ZWzmjIflrprnu5jnlLvlm77lsYLnmoR66L205bGC5Y+gXG5cbiAgICAgICAgICAgIHRoaXMuc3RvcmFnZS5pdGVyU2hhcGUoXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKHNoYXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghc2hhcGUuaW52aXNpYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXNoYXBlLm9uYnJ1c2ggLy8g5rKh5pyJb25icnVzaFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOaciW9uYnJ1c2jlubbkuJTosIPnlKjmiafooYzov5Tlm55mYWxzZeaIlnVuZGVmaW5lZOWImee7p+e7reeyieWIt1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHx8IChzaGFwZS5vbmJydXNoICYmICFzaGFwZS5vbmJydXNoKGN0eCwgZmFsc2UpKVxuICAgICAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbmZpZy5jYXRjaEJydXNoRXhjZXB0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaGFwZS5icnVzaChjdHgsIGZhbHNlLCBzZWxmLnJlZnJlc2hOZXh0RnJhbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdicnVzaCBlcnJvciBvZiAnICsgc2hhcGUudHlwZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaGFwZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hhcGUuYnJ1c2goY3R4LCBmYWxzZSwgc2VsZi5yZWZyZXNoTmV4dEZyYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHsgbm9ybWFsOiAndXAnLCB1cGRhdGU6IHRydWUgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHZhciBpbWFnZSA9IGltYWdlTGF5ZXIuZG9tLnRvRGF0YVVSTCh0eXBlLCBhcmdzKTsgXG4gICAgICAgICAgICBjdHggPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5fYmdEb20ucmVtb3ZlQ2hpbGQoaW1hZ2VMYXllci5kb20pO1xuICAgICAgICAgICAgcmV0dXJuIGltYWdlO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDojrflj5bnu5jlm77ljLrln5/lrr3luqZcbiAgICAgICAgICovXG4gICAgICAgIFBhaW50ZXIucHJvdG90eXBlLmdldFdpZHRoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dpZHRoO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDojrflj5bnu5jlm77ljLrln5/pq5jluqZcbiAgICAgICAgICovXG4gICAgICAgIFBhaW50ZXIucHJvdG90eXBlLmdldEhlaWdodCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9oZWlnaHQ7XG4gICAgICAgIH07XG5cbiAgICAgICAgUGFpbnRlci5wcm90b3R5cGUuX2dldFdpZHRoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHJvb3QgPSB0aGlzLnJvb3Q7XG4gICAgICAgICAgICB2YXIgc3RsID0gcm9vdC5jdXJyZW50U3R5bGVcbiAgICAgICAgICAgICAgICAgICAgICB8fCBkb2N1bWVudC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKHJvb3QpO1xuXG4gICAgICAgICAgICByZXR1cm4gKChyb290LmNsaWVudFdpZHRoIHx8IHBhcnNlSW50KHN0bC53aWR0aCwgMTApKVxuICAgICAgICAgICAgICAgICAgICAtIHBhcnNlSW50KHN0bC5wYWRkaW5nTGVmdCwgMTApIC8vIOivt+WOn+iwheaIkei/meavlOi+g+eyl+aatFxuICAgICAgICAgICAgICAgICAgICAtIHBhcnNlSW50KHN0bC5wYWRkaW5nUmlnaHQsIDEwKSkudG9GaXhlZCgwKSAtIDA7XG4gICAgICAgIH07XG5cbiAgICAgICAgUGFpbnRlci5wcm90b3R5cGUuX2dldEhlaWdodCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciByb290ID0gdGhpcy5yb290O1xuICAgICAgICAgICAgdmFyIHN0bCA9IHJvb3QuY3VycmVudFN0eWxlXG4gICAgICAgICAgICAgICAgICAgICAgfHwgZG9jdW1lbnQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZShyb290KTtcblxuICAgICAgICAgICAgcmV0dXJuICgocm9vdC5jbGllbnRIZWlnaHQgfHwgcGFyc2VJbnQoc3RsLmhlaWdodCwgMTApKVxuICAgICAgICAgICAgICAgICAgICAtIHBhcnNlSW50KHN0bC5wYWRkaW5nVG9wLCAxMCkgLy8g6K+35Y6f6LCF5oiR6L+Z5q+U6L6D57KX5pq0XG4gICAgICAgICAgICAgICAgICAgIC0gcGFyc2VJbnQoc3RsLnBhZGRpbmdCb3R0b20sIDEwKSkudG9GaXhlZCgwKSAtIDA7XG4gICAgICAgIH07XG5cbiAgICAgICAgUGFpbnRlci5wcm90b3R5cGUuX2JydXNoSG92ZXIgPSBmdW5jdGlvbiAoc2hhcGUpIHtcbiAgICAgICAgICAgIHZhciBjdHggPSB0aGlzLl9sYXllcnMuaG92ZXIuY3R4O1xuXG4gICAgICAgICAgICBpZiAoIXNoYXBlLm9uYnJ1c2ggLy8g5rKh5pyJb25icnVzaFxuICAgICAgICAgICAgICAgIC8vIOaciW9uYnJ1c2jlubbkuJTosIPnlKjmiafooYzov5Tlm55mYWxzZeaIlnVuZGVmaW5lZOWImee7p+e7reeyieWIt1xuICAgICAgICAgICAgICAgIHx8IChzaGFwZS5vbmJydXNoICYmICFzaGFwZS5vbmJydXNoKGN0eCwgdHJ1ZSkpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICB2YXIgbGF5ZXIgPSB0aGlzLmdldExheWVyKHNoYXBlLnpsZXZlbCk7XG4gICAgICAgICAgICAgICAgaWYgKGxheWVyLm5lZWRUcmFuc2Zvcm0pIHtcbiAgICAgICAgICAgICAgICAgICAgY3R4LnNhdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgbGF5ZXIuc2V0VHJhbnNmb3JtKGN0eCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIFJldGluYSDkvJjljJZcbiAgICAgICAgICAgICAgICBpZiAoY29uZmlnLmNhdGNoQnJ1c2hFeGNlcHRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNoYXBlLmJydXNoKGN0eCwgdHJ1ZSwgdGhpcy5yZWZyZXNoTmV4dEZyYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvciwgJ2hvdmVyQnJ1c2ggZXJyb3Igb2YgJyArIHNoYXBlLnR5cGUsIHNoYXBlXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzaGFwZS5icnVzaChjdHgsIHRydWUsIHRoaXMucmVmcmVzaE5leHRGcmFtZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChsYXllci5uZWVkVHJhbnNmb3JtKSB7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5yZXN0b3JlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIFBhaW50ZXIucHJvdG90eXBlLl9zaGFwZVRvSW1hZ2UgPSBmdW5jdGlvbiAoXG4gICAgICAgICAgICBpZCwgc2hhcGUsIHdpZHRoLCBoZWlnaHQsIGRldmljZVBpeGVsUmF0aW9cbiAgICAgICAgKSB7XG4gICAgICAgICAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgICAgICB2YXIgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNhbnZhcy5zdHlsZS53aWR0aCA9IHdpZHRoICsgJ3B4JztcbiAgICAgICAgICAgIGNhbnZhcy5zdHlsZS5oZWlnaHQgPSBoZWlnaHQgKyAncHgnO1xuICAgICAgICAgICAgY2FudmFzLnNldEF0dHJpYnV0ZSgnd2lkdGgnLCB3aWR0aCAqIGRldmljZVBpeGVsUmF0aW8pO1xuICAgICAgICAgICAgY2FudmFzLnNldEF0dHJpYnV0ZSgnaGVpZ2h0JywgaGVpZ2h0ICogZGV2aWNlUGl4ZWxSYXRpbyk7XG5cbiAgICAgICAgICAgIGN0eC5jbGVhclJlY3QoMCwgMCwgd2lkdGggKiBkZXZpY2VQaXhlbFJhdGlvLCBoZWlnaHQgKiBkZXZpY2VQaXhlbFJhdGlvKTtcblxuICAgICAgICAgICAgdmFyIHNoYXBlVHJhbnNmb3JtID0ge1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uIDogc2hhcGUucG9zaXRpb24sXG4gICAgICAgICAgICAgICAgcm90YXRpb24gOiBzaGFwZS5yb3RhdGlvbixcbiAgICAgICAgICAgICAgICBzY2FsZSA6IHNoYXBlLnNjYWxlXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgc2hhcGUucG9zaXRpb24gPSBbIDAsIDAsIDAgXTtcbiAgICAgICAgICAgIHNoYXBlLnJvdGF0aW9uID0gMDtcbiAgICAgICAgICAgIHNoYXBlLnNjYWxlID0gWyAxLCAxIF07XG4gICAgICAgICAgICBpZiAoc2hhcGUpIHtcbiAgICAgICAgICAgICAgICBzaGFwZS5icnVzaChjdHgsIGZhbHNlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIEltYWdlU2hhcGUgPSByZXF1aXJlKCcuL3NoYXBlL0ltYWdlJyk7XG4gICAgICAgICAgICB2YXIgaW1nU2hhcGUgPSBuZXcgSW1hZ2VTaGFwZSh7XG4gICAgICAgICAgICAgICAgaWQgOiBpZCxcbiAgICAgICAgICAgICAgICBzdHlsZSA6IHtcbiAgICAgICAgICAgICAgICAgICAgeCA6IDAsXG4gICAgICAgICAgICAgICAgICAgIHkgOiAwLFxuICAgICAgICAgICAgICAgICAgICBpbWFnZSA6IGNhbnZhc1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZiAoc2hhcGVUcmFuc2Zvcm0ucG9zaXRpb24gIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGltZ1NoYXBlLnBvc2l0aW9uID0gc2hhcGUucG9zaXRpb24gPSBzaGFwZVRyYW5zZm9ybS5wb3NpdGlvbjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHNoYXBlVHJhbnNmb3JtLnJvdGF0aW9uICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBpbWdTaGFwZS5yb3RhdGlvbiA9IHNoYXBlLnJvdGF0aW9uID0gc2hhcGVUcmFuc2Zvcm0ucm90YXRpb247XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzaGFwZVRyYW5zZm9ybS5zY2FsZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgaW1nU2hhcGUuc2NhbGUgPSBzaGFwZS5zY2FsZSA9IHNoYXBlVHJhbnNmb3JtLnNjYWxlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gaW1nU2hhcGU7XG4gICAgICAgIH07XG5cbiAgICAgICAgUGFpbnRlci5wcm90b3R5cGUuX2NyZWF0ZVNoYXBlVG9JbWFnZVByb2Nlc3NvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh3aW5kb3dbJ0dfdm1sQ2FudmFzTWFuYWdlciddKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRvTm90aGluZztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIG1lID0gdGhpcztcblxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChpZCwgZSwgd2lkdGgsIGhlaWdodCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBtZS5fc2hhcGVUb0ltYWdlKFxuICAgICAgICAgICAgICAgICAgICBpZCwgZSwgd2lkdGgsIGhlaWdodCwgY29uZmlnLmRldmljZVBpeGVsUmF0aW9cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gUGFpbnRlcjtcbiAgICB9XG4pO1xuIl0sImZpbGUiOiJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL1BhaW50ZXIuanMifQ==
