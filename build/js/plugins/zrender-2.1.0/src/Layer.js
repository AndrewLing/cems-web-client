/**
 * @module zrender/Layer
 * @author pissang(https://www.github.com/pissang)
 */
define(function (require) {

    var Transformable = require('./mixin/Transformable');
    var util = require('./tool/util');
    var vmlCanvasManager = window['G_vmlCanvasManager'];
    var config = require('./config');

    function returnFalse() {
        return false;
    }

    /**
     * 创建dom
     * 
     * @inner
     * @param {string} id dom id 待用
     * @param {string} type dom type，such as canvas, div etc.
     * @param {Painter} painter painter instance
     */
    function createDom(id, type, painter) {
        var newDom = document.createElement(type);
        var width = painter.getWidth();
        var height = painter.getHeight();

        // 没append呢，请原谅我这样写，清晰~
        newDom.style.position = 'absolute';
        newDom.style.left = 0;
        newDom.style.top = 0;
        newDom.style.width = width + 'px';
        newDom.style.height = height + 'px';
        newDom.width = width * config.devicePixelRatio;
        newDom.height = height * config.devicePixelRatio;

        // id不作为索引用，避免可能造成的重名，定义为私有属性
        newDom.setAttribute('data-zr-dom-id', id);
        return newDom;
    }

    /**
     * @alias module:zrender/Layer
     * @constructor
     * @extends module:zrender/mixin/Transformable
     * @param {string} id
     * @param {module:zrender/Painter} painter
     */
    var Layer = function(id, painter) {

        this.id = id;

        this.dom = createDom(id, 'canvas', painter);
        this.dom.onselectstart = returnFalse; // 避免页面选中的尴尬
        this.dom.style['-webkit-user-select'] = 'none';
        this.dom.style['user-select'] = 'none';
        this.dom.style['-webkit-touch-callout'] = 'none';
        this.dom.style['-webkit-tap-highlight-color'] = 'rgba(0,0,0,0)';

        this.dom.className = config.elementClassName;

        vmlCanvasManager && vmlCanvasManager.initElement(this.dom);

        this.domBack = null;
        this.ctxBack = null;

        this.painter = painter;

        this.unusedCount = 0;

        this.config = null;

        this.dirty = true;

        this.elCount = 0;

        // Configs
        /**
         * 每次清空画布的颜色
         * @type {string}
         * @default 0
         */
        this.clearColor = 0;
        /**
         * 是否开启动态模糊
         * @type {boolean}
         * @default false
         */
        this.motionBlur = false;
        /**
         * 在开启动态模糊的时候使用，与上一帧混合的alpha值，值越大尾迹越明显
         * @type {number}
         * @default 0.7
         */
        this.lastFrameAlpha = 0.7;
        /**
         * 层是否支持鼠标平移操作
         * @type {boolean}
         * @default false
         */
        this.zoomable = false;
        /**
         * 层是否支持鼠标缩放操作
         * @type {boolean}
         * @default false
         */
        this.panable = false;

        this.maxZoom = Infinity;
        this.minZoom = 0;

        Transformable.call(this);
    };

    Layer.prototype.initContext = function () {
        this.ctx = this.dom.getContext('2d');

        var dpr = config.devicePixelRatio;
        if (dpr != 1) { 
            this.ctx.scale(dpr, dpr);
        }
    };

    Layer.prototype.createBackBuffer = function () {
        if (vmlCanvasManager) { // IE 8- should not support back buffer
            return;
        }
        this.domBack = createDom('back-' + this.id, 'canvas', this.painter);
        this.ctxBack = this.domBack.getContext('2d');

        var dpr = config.devicePixelRatio;

        if (dpr != 1) { 
            this.ctxBack.scale(dpr, dpr);
        }
    };

    /**
     * @param  {number} width
     * @param  {number} height
     */
    Layer.prototype.resize = function (width, height) {
        var dpr = config.devicePixelRatio;

        this.dom.style.width = width + 'px';
        this.dom.style.height = height + 'px';

        this.dom.setAttribute('width', width * dpr);
        this.dom.setAttribute('height', height * dpr);

        if (dpr != 1) { 
            this.ctx.scale(dpr, dpr);
        }

        if (this.domBack) {
            this.domBack.setAttribute('width', width * dpr);
            this.domBack.setAttribute('height', height * dpr);

            if (dpr != 1) { 
                this.ctxBack.scale(dpr, dpr);
            }
        }
    };

    /**
     * 清空该层画布
     */
    Layer.prototype.clear = function () {
        var dom = this.dom;
        var ctx = this.ctx;
        var width = dom.width;
        var height = dom.height;

        var haveClearColor = this.clearColor && !vmlCanvasManager;
        var haveMotionBLur = this.motionBlur && !vmlCanvasManager;
        var lastFrameAlpha = this.lastFrameAlpha;
        
        var dpr = config.devicePixelRatio;

        if (haveMotionBLur) {
            if (!this.domBack) {
                this.createBackBuffer();
            } 

            this.ctxBack.globalCompositeOperation = 'copy';
            this.ctxBack.drawImage(
                dom, 0, 0,
                width / dpr,
                height / dpr
            );
        }

        ctx.clearRect(0, 0, width / dpr, height / dpr);
        if (haveClearColor) {
            ctx.save();
            ctx.fillStyle = this.clearColor;
            ctx.fillRect(0, 0, width / dpr, height / dpr);
            ctx.restore();
        }

        if (haveMotionBLur) {
            var domBack = this.domBack;
            ctx.save();
            ctx.globalAlpha = lastFrameAlpha;
            ctx.drawImage(domBack, 0, 0, width / dpr, height / dpr);
            ctx.restore();
        }
    };

    util.merge(Layer.prototype, Transformable.prototype);

    return Layer;
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL0xheWVyLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQG1vZHVsZSB6cmVuZGVyL0xheWVyXG4gKiBAYXV0aG9yIHBpc3NhbmcoaHR0cHM6Ly93d3cuZ2l0aHViLmNvbS9waXNzYW5nKVxuICovXG5kZWZpbmUoZnVuY3Rpb24gKHJlcXVpcmUpIHtcblxuICAgIHZhciBUcmFuc2Zvcm1hYmxlID0gcmVxdWlyZSgnLi9taXhpbi9UcmFuc2Zvcm1hYmxlJyk7XG4gICAgdmFyIHV0aWwgPSByZXF1aXJlKCcuL3Rvb2wvdXRpbCcpO1xuICAgIHZhciB2bWxDYW52YXNNYW5hZ2VyID0gd2luZG93WydHX3ZtbENhbnZhc01hbmFnZXInXTtcbiAgICB2YXIgY29uZmlnID0gcmVxdWlyZSgnLi9jb25maWcnKTtcblxuICAgIGZ1bmN0aW9uIHJldHVybkZhbHNlKCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5Yib5bu6ZG9tXG4gICAgICogXG4gICAgICogQGlubmVyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIGRvbSBpZCDlvoXnlKhcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdHlwZSBkb20gdHlwZe+8jHN1Y2ggYXMgY2FudmFzLCBkaXYgZXRjLlxuICAgICAqIEBwYXJhbSB7UGFpbnRlcn0gcGFpbnRlciBwYWludGVyIGluc3RhbmNlXG4gICAgICovXG4gICAgZnVuY3Rpb24gY3JlYXRlRG9tKGlkLCB0eXBlLCBwYWludGVyKSB7XG4gICAgICAgIHZhciBuZXdEb20gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHR5cGUpO1xuICAgICAgICB2YXIgd2lkdGggPSBwYWludGVyLmdldFdpZHRoKCk7XG4gICAgICAgIHZhciBoZWlnaHQgPSBwYWludGVyLmdldEhlaWdodCgpO1xuXG4gICAgICAgIC8vIOayoWFwcGVuZOWRou+8jOivt+WOn+iwheaIkei/meagt+WGme+8jOa4heaZsH5cbiAgICAgICAgbmV3RG9tLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICAgICAgbmV3RG9tLnN0eWxlLmxlZnQgPSAwO1xuICAgICAgICBuZXdEb20uc3R5bGUudG9wID0gMDtcbiAgICAgICAgbmV3RG9tLnN0eWxlLndpZHRoID0gd2lkdGggKyAncHgnO1xuICAgICAgICBuZXdEb20uc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0ICsgJ3B4JztcbiAgICAgICAgbmV3RG9tLndpZHRoID0gd2lkdGggKiBjb25maWcuZGV2aWNlUGl4ZWxSYXRpbztcbiAgICAgICAgbmV3RG9tLmhlaWdodCA9IGhlaWdodCAqIGNvbmZpZy5kZXZpY2VQaXhlbFJhdGlvO1xuXG4gICAgICAgIC8vIGlk5LiN5L2c5Li657Si5byV55So77yM6YG/5YWN5Y+v6IO96YCg5oiQ55qE6YeN5ZCN77yM5a6a5LmJ5Li656eB5pyJ5bGe5oCnXG4gICAgICAgIG5ld0RvbS5zZXRBdHRyaWJ1dGUoJ2RhdGEtenItZG9tLWlkJywgaWQpO1xuICAgICAgICByZXR1cm4gbmV3RG9tO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBhbGlhcyBtb2R1bGU6enJlbmRlci9MYXllclxuICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAqIEBleHRlbmRzIG1vZHVsZTp6cmVuZGVyL21peGluL1RyYW5zZm9ybWFibGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWRcbiAgICAgKiBAcGFyYW0ge21vZHVsZTp6cmVuZGVyL1BhaW50ZXJ9IHBhaW50ZXJcbiAgICAgKi9cbiAgICB2YXIgTGF5ZXIgPSBmdW5jdGlvbihpZCwgcGFpbnRlcikge1xuXG4gICAgICAgIHRoaXMuaWQgPSBpZDtcblxuICAgICAgICB0aGlzLmRvbSA9IGNyZWF0ZURvbShpZCwgJ2NhbnZhcycsIHBhaW50ZXIpO1xuICAgICAgICB0aGlzLmRvbS5vbnNlbGVjdHN0YXJ0ID0gcmV0dXJuRmFsc2U7IC8vIOmBv+WFjemhtemdoumAieS4reeahOWwtOWwrFxuICAgICAgICB0aGlzLmRvbS5zdHlsZVsnLXdlYmtpdC11c2VyLXNlbGVjdCddID0gJ25vbmUnO1xuICAgICAgICB0aGlzLmRvbS5zdHlsZVsndXNlci1zZWxlY3QnXSA9ICdub25lJztcbiAgICAgICAgdGhpcy5kb20uc3R5bGVbJy13ZWJraXQtdG91Y2gtY2FsbG91dCddID0gJ25vbmUnO1xuICAgICAgICB0aGlzLmRvbS5zdHlsZVsnLXdlYmtpdC10YXAtaGlnaGxpZ2h0LWNvbG9yJ10gPSAncmdiYSgwLDAsMCwwKSc7XG5cbiAgICAgICAgdGhpcy5kb20uY2xhc3NOYW1lID0gY29uZmlnLmVsZW1lbnRDbGFzc05hbWU7XG5cbiAgICAgICAgdm1sQ2FudmFzTWFuYWdlciAmJiB2bWxDYW52YXNNYW5hZ2VyLmluaXRFbGVtZW50KHRoaXMuZG9tKTtcblxuICAgICAgICB0aGlzLmRvbUJhY2sgPSBudWxsO1xuICAgICAgICB0aGlzLmN0eEJhY2sgPSBudWxsO1xuXG4gICAgICAgIHRoaXMucGFpbnRlciA9IHBhaW50ZXI7XG5cbiAgICAgICAgdGhpcy51bnVzZWRDb3VudCA9IDA7XG5cbiAgICAgICAgdGhpcy5jb25maWcgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuZGlydHkgPSB0cnVlO1xuXG4gICAgICAgIHRoaXMuZWxDb3VudCA9IDA7XG5cbiAgICAgICAgLy8gQ29uZmlnc1xuICAgICAgICAvKipcbiAgICAgICAgICog5q+P5qyh5riF56m655S75biD55qE6aKc6ImyXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqIEBkZWZhdWx0IDBcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuY2xlYXJDb2xvciA9IDA7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiDmmK/lkKblvIDlkK/liqjmgIHmqKHns4pcbiAgICAgICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICAgICAqIEBkZWZhdWx0IGZhbHNlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLm1vdGlvbkJsdXIgPSBmYWxzZTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWcqOW8gOWQr+WKqOaAgeaooeeziueahOaXtuWAmeS9v+eUqO+8jOS4juS4iuS4gOW4p+a3t+WQiOeahGFscGhh5YC877yM5YC86LaK5aSn5bC+6L+56LaK5piO5pi+XG4gICAgICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICAgICAqIEBkZWZhdWx0IDAuN1xuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5sYXN0RnJhbWVBbHBoYSA9IDAuNztcbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWxguaYr+WQpuaUr+aMgem8oOagh+W5s+enu+aTjeS9nFxuICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgICAgICogQGRlZmF1bHQgZmFsc2VcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuem9vbWFibGUgPSBmYWxzZTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWxguaYr+WQpuaUr+aMgem8oOagh+e8qeaUvuaTjeS9nFxuICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgICAgICogQGRlZmF1bHQgZmFsc2VcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMucGFuYWJsZSA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMubWF4Wm9vbSA9IEluZmluaXR5O1xuICAgICAgICB0aGlzLm1pblpvb20gPSAwO1xuXG4gICAgICAgIFRyYW5zZm9ybWFibGUuY2FsbCh0aGlzKTtcbiAgICB9O1xuXG4gICAgTGF5ZXIucHJvdG90eXBlLmluaXRDb250ZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmN0eCA9IHRoaXMuZG9tLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICAgICAgdmFyIGRwciA9IGNvbmZpZy5kZXZpY2VQaXhlbFJhdGlvO1xuICAgICAgICBpZiAoZHByICE9IDEpIHsgXG4gICAgICAgICAgICB0aGlzLmN0eC5zY2FsZShkcHIsIGRwcik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgTGF5ZXIucHJvdG90eXBlLmNyZWF0ZUJhY2tCdWZmZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh2bWxDYW52YXNNYW5hZ2VyKSB7IC8vIElFIDgtIHNob3VsZCBub3Qgc3VwcG9ydCBiYWNrIGJ1ZmZlclxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZG9tQmFjayA9IGNyZWF0ZURvbSgnYmFjay0nICsgdGhpcy5pZCwgJ2NhbnZhcycsIHRoaXMucGFpbnRlcik7XG4gICAgICAgIHRoaXMuY3R4QmFjayA9IHRoaXMuZG9tQmFjay5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgICAgIHZhciBkcHIgPSBjb25maWcuZGV2aWNlUGl4ZWxSYXRpbztcblxuICAgICAgICBpZiAoZHByICE9IDEpIHsgXG4gICAgICAgICAgICB0aGlzLmN0eEJhY2suc2NhbGUoZHByLCBkcHIpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSAge251bWJlcn0gd2lkdGhcbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9IGhlaWdodFxuICAgICAqL1xuICAgIExheWVyLnByb3RvdHlwZS5yZXNpemUgPSBmdW5jdGlvbiAod2lkdGgsIGhlaWdodCkge1xuICAgICAgICB2YXIgZHByID0gY29uZmlnLmRldmljZVBpeGVsUmF0aW87XG5cbiAgICAgICAgdGhpcy5kb20uc3R5bGUud2lkdGggPSB3aWR0aCArICdweCc7XG4gICAgICAgIHRoaXMuZG9tLnN0eWxlLmhlaWdodCA9IGhlaWdodCArICdweCc7XG5cbiAgICAgICAgdGhpcy5kb20uc2V0QXR0cmlidXRlKCd3aWR0aCcsIHdpZHRoICogZHByKTtcbiAgICAgICAgdGhpcy5kb20uc2V0QXR0cmlidXRlKCdoZWlnaHQnLCBoZWlnaHQgKiBkcHIpO1xuXG4gICAgICAgIGlmIChkcHIgIT0gMSkgeyBcbiAgICAgICAgICAgIHRoaXMuY3R4LnNjYWxlKGRwciwgZHByKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmRvbUJhY2spIHtcbiAgICAgICAgICAgIHRoaXMuZG9tQmFjay5zZXRBdHRyaWJ1dGUoJ3dpZHRoJywgd2lkdGggKiBkcHIpO1xuICAgICAgICAgICAgdGhpcy5kb21CYWNrLnNldEF0dHJpYnV0ZSgnaGVpZ2h0JywgaGVpZ2h0ICogZHByKTtcblxuICAgICAgICAgICAgaWYgKGRwciAhPSAxKSB7IFxuICAgICAgICAgICAgICAgIHRoaXMuY3R4QmFjay5zY2FsZShkcHIsIGRwcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICog5riF56m66K+l5bGC55S75biDXG4gICAgICovXG4gICAgTGF5ZXIucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZG9tID0gdGhpcy5kb207XG4gICAgICAgIHZhciBjdHggPSB0aGlzLmN0eDtcbiAgICAgICAgdmFyIHdpZHRoID0gZG9tLndpZHRoO1xuICAgICAgICB2YXIgaGVpZ2h0ID0gZG9tLmhlaWdodDtcblxuICAgICAgICB2YXIgaGF2ZUNsZWFyQ29sb3IgPSB0aGlzLmNsZWFyQ29sb3IgJiYgIXZtbENhbnZhc01hbmFnZXI7XG4gICAgICAgIHZhciBoYXZlTW90aW9uQkx1ciA9IHRoaXMubW90aW9uQmx1ciAmJiAhdm1sQ2FudmFzTWFuYWdlcjtcbiAgICAgICAgdmFyIGxhc3RGcmFtZUFscGhhID0gdGhpcy5sYXN0RnJhbWVBbHBoYTtcbiAgICAgICAgXG4gICAgICAgIHZhciBkcHIgPSBjb25maWcuZGV2aWNlUGl4ZWxSYXRpbztcblxuICAgICAgICBpZiAoaGF2ZU1vdGlvbkJMdXIpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5kb21CYWNrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jcmVhdGVCYWNrQnVmZmVyKCk7XG4gICAgICAgICAgICB9IFxuXG4gICAgICAgICAgICB0aGlzLmN0eEJhY2suZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gJ2NvcHknO1xuICAgICAgICAgICAgdGhpcy5jdHhCYWNrLmRyYXdJbWFnZShcbiAgICAgICAgICAgICAgICBkb20sIDAsIDAsXG4gICAgICAgICAgICAgICAgd2lkdGggLyBkcHIsXG4gICAgICAgICAgICAgICAgaGVpZ2h0IC8gZHByXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgY3R4LmNsZWFyUmVjdCgwLCAwLCB3aWR0aCAvIGRwciwgaGVpZ2h0IC8gZHByKTtcbiAgICAgICAgaWYgKGhhdmVDbGVhckNvbG9yKSB7XG4gICAgICAgICAgICBjdHguc2F2ZSgpO1xuICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IHRoaXMuY2xlYXJDb2xvcjtcbiAgICAgICAgICAgIGN0eC5maWxsUmVjdCgwLCAwLCB3aWR0aCAvIGRwciwgaGVpZ2h0IC8gZHByKTtcbiAgICAgICAgICAgIGN0eC5yZXN0b3JlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaGF2ZU1vdGlvbkJMdXIpIHtcbiAgICAgICAgICAgIHZhciBkb21CYWNrID0gdGhpcy5kb21CYWNrO1xuICAgICAgICAgICAgY3R4LnNhdmUoKTtcbiAgICAgICAgICAgIGN0eC5nbG9iYWxBbHBoYSA9IGxhc3RGcmFtZUFscGhhO1xuICAgICAgICAgICAgY3R4LmRyYXdJbWFnZShkb21CYWNrLCAwLCAwLCB3aWR0aCAvIGRwciwgaGVpZ2h0IC8gZHByKTtcbiAgICAgICAgICAgIGN0eC5yZXN0b3JlKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdXRpbC5tZXJnZShMYXllci5wcm90b3R5cGUsIFRyYW5zZm9ybWFibGUucHJvdG90eXBlKTtcblxuICAgIHJldHVybiBMYXllcjtcbn0pOyJdLCJmaWxlIjoicGx1Z2lucy96cmVuZGVyLTIuMS4wL3NyYy9MYXllci5qcyJ9
