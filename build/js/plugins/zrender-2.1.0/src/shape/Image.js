/**
 * 图片绘制
 * @module zrender/shape/Image
 * @author pissang(https://www.github.com/pissang)
 * @example
 *     var ImageShape = require('zrender/shape/Image');
 *     var image = new ImageShape({
 *         style: {
 *             image: 'test.jpg',
 *             x: 100,
 *             y: 100
 *         }
 *     });
 *     zr.addShape(image);
 */

/**
 * @typedef {Object} IImageStyle
 * @property {string|HTMLImageElement|HTMLCanvasElement} image 图片url或者图片对象
 * @property {number} x 左上角横坐标
 * @property {number} y 左上角纵坐标
 * @property {number} [width] 绘制到画布上的宽度，默认为图片宽度
 * @property {number} [height] 绘制到画布上的高度，默认为图片高度
 * @property {number} [sx=0] 从图片中裁剪的左上角横坐标
 * @property {number} [sy=0] 从图片中裁剪的左上角纵坐标
 * @property {number} [sWidth] 从图片中裁剪的宽度，默认为图片高度
 * @property {number} [sHeight] 从图片中裁剪的高度，默认为图片高度
 * @property {number} [opacity=1] 绘制透明度
 * @property {number} [shadowBlur=0] 阴影模糊度，大于0有效
 * @property {string} [shadowColor='#000000'] 阴影颜色
 * @property {number} [shadowOffsetX=0] 阴影横向偏移
 * @property {number} [shadowOffsetY=0] 阴影纵向偏移
 * @property {string} [text] 图形中的附加文本
 * @property {string} [textColor='#000000'] 文本颜色
 * @property {string} [textFont] 附加文本样式，eg:'bold 18px verdana'
 * @property {string} [textPosition='end'] 附加文本位置, 可以是 inside, left, right, top, bottom
 * @property {string} [textAlign] 默认根据textPosition自动设置，附加文本水平对齐。
 *                                可以是start, end, left, right, center
 * @property {string} [textBaseline] 默认根据textPosition自动设置，附加文本垂直对齐。
 *                                可以是top, bottom, middle, alphabetic, hanging, ideographic
 */
define(
    function (require) {

        var Base = require('./Base');

        /**
         * @alias zrender/shape/Image
         * @constructor
         * @extends module:zrender/shape/Base
         * @param {Object} options
         */
        var ZImage = function(options) {
            Base.call(this, options);
            /**
             * 图片绘制样式
             * @name module:zrender/shape/Image#style
             * @type {module:zrender/shape/Image~IImageStyle}
             */
            /**
             * 图片高亮绘制样式
             * @name module:zrender/shape/Image#highlightStyle
             * @type {module:zrender/shape/Image~IImageStyle}
             */
        };

        ZImage.prototype = {
            
            type: 'image',

            brush : function(ctx, isHighlight, refreshNextFrame) {
                var style = this.style || {};

                if (isHighlight) {
                    // 根据style扩展默认高亮样式
                    style = this.getHighlightStyle(
                        style, this.highlightStyle || {}
                    );
                }

                var image = style.image;
                var self = this;

                if (!this._imageCache) {
                    this._imageCache = {};
                }
                if (typeof(image) === 'string') {
                    var src = image;
                    if (this._imageCache[src]) {
                        image = this._imageCache[src];
                    } else {
                        image = new Image();
                        image.onload = function () {
                            image.onload = null;
                            self.modSelf();
                            refreshNextFrame();
                        };

                        image.src = src;
                        this._imageCache[src] = image;
                    }
                }
                if (image) {
                    // 图片已经加载完成
                    if (image.nodeName.toUpperCase() == 'IMG') {
                        if (window.ActiveXObject) {
                            if (image.readyState != 'complete') {
                                return;
                            }
                        }
                        else {
                            if (!image.complete) {
                                return;
                            }
                        }
                    }
                    // Else is canvas
                    var width = style.width || image.width;
                    var height = style.height || image.height;
                    var x = style.x;
                    var y = style.y;
                    // 图片加载失败
                    if (!image.width || !image.height) {
                        return;
                    }

                    ctx.save();

                    this.doClip(ctx);

                    this.setContext(ctx, style);

                    // 设置transform
                    this.setTransform(ctx);

                    if (style.sWidth && style.sHeight) {
                        var sx = style.sx || 0;
                        var sy = style.sy || 0;
                        ctx.drawImage(
                            image,
                            sx, sy, style.sWidth, style.sHeight,
                            x, y, width, height
                        );
                    }
                    else if (style.sx && style.sy) {
                        var sx = style.sx;
                        var sy = style.sy;
                        var sWidth = width - sx;
                        var sHeight = height - sy;
                        ctx.drawImage(
                            image,
                            sx, sy, sWidth, sHeight,
                            x, y, width, height
                        );
                    }
                    else {
                        ctx.drawImage(image, x, y, width, height);
                    }
                    // 如果没设置宽和高的话自动根据图片宽高设置
                    if (!style.width) {
                        style.width = width;
                    }
                    if (!style.height) {
                        style.height = height;
                    }
                    if (!this.style.width) {
                        this.style.width = width;
                    }
                    if (!this.style.height) {
                        this.style.height = height;
                    }

                    this.drawText(ctx, style, this.style);

                    ctx.restore();
                }
            },

            /**
             * 计算返回图片的包围盒矩形
             * @param {module:zrender/shape/Image~IImageStyle} style
             * @return {module:zrender/shape/Base~IBoundingRect}
             */
            getRect: function(style) {
                return {
                    x : style.x,
                    y : style.y,
                    width : style.width,
                    height : style.height
                };
            },

            clearCache: function() {
                this._imageCache = {};
            }
        };

        require('../tool/util').inherits(ZImage, Base);
        return ZImage;
    }
);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3NoYXBlL0ltYWdlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICog5Zu+54mH57uY5Yi2XG4gKiBAbW9kdWxlIHpyZW5kZXIvc2hhcGUvSW1hZ2VcbiAqIEBhdXRob3IgcGlzc2FuZyhodHRwczovL3d3dy5naXRodWIuY29tL3Bpc3NhbmcpXG4gKiBAZXhhbXBsZVxuICogICAgIHZhciBJbWFnZVNoYXBlID0gcmVxdWlyZSgnenJlbmRlci9zaGFwZS9JbWFnZScpO1xuICogICAgIHZhciBpbWFnZSA9IG5ldyBJbWFnZVNoYXBlKHtcbiAqICAgICAgICAgc3R5bGU6IHtcbiAqICAgICAgICAgICAgIGltYWdlOiAndGVzdC5qcGcnLFxuICogICAgICAgICAgICAgeDogMTAwLFxuICogICAgICAgICAgICAgeTogMTAwXG4gKiAgICAgICAgIH1cbiAqICAgICB9KTtcbiAqICAgICB6ci5hZGRTaGFwZShpbWFnZSk7XG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBJSW1hZ2VTdHlsZVxuICogQHByb3BlcnR5IHtzdHJpbmd8SFRNTEltYWdlRWxlbWVudHxIVE1MQ2FudmFzRWxlbWVudH0gaW1hZ2Ug5Zu+54mHdXJs5oiW6ICF5Zu+54mH5a+56LGhXG4gKiBAcHJvcGVydHkge251bWJlcn0geCDlt6bkuIrop5LmqKrlnZDmoIdcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB5IOW3puS4iuinkue6teWdkOagh1xuICogQHByb3BlcnR5IHtudW1iZXJ9IFt3aWR0aF0g57uY5Yi25Yiw55S75biD5LiK55qE5a695bqm77yM6buY6K6k5Li65Zu+54mH5a695bqmXG4gKiBAcHJvcGVydHkge251bWJlcn0gW2hlaWdodF0g57uY5Yi25Yiw55S75biD5LiK55qE6auY5bqm77yM6buY6K6k5Li65Zu+54mH6auY5bqmXG4gKiBAcHJvcGVydHkge251bWJlcn0gW3N4PTBdIOS7juWbvueJh+S4reijgeWJqueahOW3puS4iuinkuaoquWdkOagh1xuICogQHByb3BlcnR5IHtudW1iZXJ9IFtzeT0wXSDku47lm77niYfkuK3oo4HliarnmoTlt6bkuIrop5LnurXlnZDmoIdcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbc1dpZHRoXSDku47lm77niYfkuK3oo4HliarnmoTlrr3luqbvvIzpu5jorqTkuLrlm77niYfpq5jluqZcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbc0hlaWdodF0g5LuO5Zu+54mH5Lit6KOB5Ymq55qE6auY5bqm77yM6buY6K6k5Li65Zu+54mH6auY5bqmXG4gKiBAcHJvcGVydHkge251bWJlcn0gW29wYWNpdHk9MV0g57uY5Yi26YCP5piO5bqmXG4gKiBAcHJvcGVydHkge251bWJlcn0gW3NoYWRvd0JsdXI9MF0g6Zi05b2x5qih57OK5bqm77yM5aSn5LqOMOacieaViFxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtzaGFkb3dDb2xvcj0nIzAwMDAwMCddIOmYtOW9seminOiJslxuICogQHByb3BlcnR5IHtudW1iZXJ9IFtzaGFkb3dPZmZzZXRYPTBdIOmYtOW9seaoquWQkeWBj+enu1xuICogQHByb3BlcnR5IHtudW1iZXJ9IFtzaGFkb3dPZmZzZXRZPTBdIOmYtOW9see6teWQkeWBj+enu1xuICogQHByb3BlcnR5IHtzdHJpbmd9IFt0ZXh0XSDlm77lvaLkuK3nmoTpmYTliqDmlofmnKxcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbdGV4dENvbG9yPScjMDAwMDAwJ10g5paH5pys6aKc6ImyXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRGb250XSDpmYTliqDmlofmnKzmoLflvI/vvIxlZzonYm9sZCAxOHB4IHZlcmRhbmEnXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRQb3NpdGlvbj0nZW5kJ10g6ZmE5Yqg5paH5pys5L2N572uLCDlj6/ku6XmmK8gaW5zaWRlLCBsZWZ0LCByaWdodCwgdG9wLCBib3R0b21cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbdGV4dEFsaWduXSDpu5jorqTmoLnmja50ZXh0UG9zaXRpb27oh6rliqjorr7nva7vvIzpmYTliqDmlofmnKzmsLTlubPlr7npvZDjgIJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDlj6/ku6XmmK9zdGFydCwgZW5kLCBsZWZ0LCByaWdodCwgY2VudGVyXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRCYXNlbGluZV0g6buY6K6k5qC55o2udGV4dFBvc2l0aW9u6Ieq5Yqo6K6+572u77yM6ZmE5Yqg5paH5pys5Z6C55u05a+56b2Q44CCXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg5Y+v5Lul5pivdG9wLCBib3R0b20sIG1pZGRsZSwgYWxwaGFiZXRpYywgaGFuZ2luZywgaWRlb2dyYXBoaWNcbiAqL1xuZGVmaW5lKFxuICAgIGZ1bmN0aW9uIChyZXF1aXJlKSB7XG5cbiAgICAgICAgdmFyIEJhc2UgPSByZXF1aXJlKCcuL0Jhc2UnKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQGFsaWFzIHpyZW5kZXIvc2hhcGUvSW1hZ2VcbiAgICAgICAgICogQGNvbnN0cnVjdG9yXG4gICAgICAgICAqIEBleHRlbmRzIG1vZHVsZTp6cmVuZGVyL3NoYXBlL0Jhc2VcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAgICAgICAgICovXG4gICAgICAgIHZhciBaSW1hZ2UgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgICAgICBCYXNlLmNhbGwodGhpcywgb3B0aW9ucyk7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOWbvueJh+e7mOWItuagt+W8j1xuICAgICAgICAgICAgICogQG5hbWUgbW9kdWxlOnpyZW5kZXIvc2hhcGUvSW1hZ2Ujc3R5bGVcbiAgICAgICAgICAgICAqIEB0eXBlIHttb2R1bGU6enJlbmRlci9zaGFwZS9JbWFnZX5JSW1hZ2VTdHlsZX1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDlm77niYfpq5jkuq7nu5jliLbmoLflvI9cbiAgICAgICAgICAgICAqIEBuYW1lIG1vZHVsZTp6cmVuZGVyL3NoYXBlL0ltYWdlI2hpZ2hsaWdodFN0eWxlXG4gICAgICAgICAgICAgKiBAdHlwZSB7bW9kdWxlOnpyZW5kZXIvc2hhcGUvSW1hZ2V+SUltYWdlU3R5bGV9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgfTtcblxuICAgICAgICBaSW1hZ2UucHJvdG90eXBlID0ge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB0eXBlOiAnaW1hZ2UnLFxuXG4gICAgICAgICAgICBicnVzaCA6IGZ1bmN0aW9uKGN0eCwgaXNIaWdobGlnaHQsIHJlZnJlc2hOZXh0RnJhbWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3R5bGUgPSB0aGlzLnN0eWxlIHx8IHt9O1xuXG4gICAgICAgICAgICAgICAgaWYgKGlzSGlnaGxpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOagueaNrnN0eWxl5omp5bGV6buY6K6k6auY5Lqu5qC35byPXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlID0gdGhpcy5nZXRIaWdobGlnaHRTdHlsZShcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlLCB0aGlzLmhpZ2hsaWdodFN0eWxlIHx8IHt9XG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIGltYWdlID0gc3R5bGUuaW1hZ2U7XG4gICAgICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9pbWFnZUNhY2hlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2ltYWdlQ2FjaGUgPSB7fTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZihpbWFnZSkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzcmMgPSBpbWFnZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX2ltYWdlQ2FjaGVbc3JjXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW1hZ2UgPSB0aGlzLl9pbWFnZUNhY2hlW3NyY107XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbWFnZSA9IG5ldyBJbWFnZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW1hZ2Uub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltYWdlLm9ubG9hZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5tb2RTZWxmKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVmcmVzaE5leHRGcmFtZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaW1hZ2Uuc3JjID0gc3JjO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5faW1hZ2VDYWNoZVtzcmNdID0gaW1hZ2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGltYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOWbvueJh+W3sue7j+WKoOi9veWujOaIkFxuICAgICAgICAgICAgICAgICAgICBpZiAoaW1hZ2Uubm9kZU5hbWUudG9VcHBlckNhc2UoKSA9PSAnSU1HJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHdpbmRvdy5BY3RpdmVYT2JqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGltYWdlLnJlYWR5U3RhdGUgIT0gJ2NvbXBsZXRlJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpbWFnZS5jb21wbGV0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIEVsc2UgaXMgY2FudmFzXG4gICAgICAgICAgICAgICAgICAgIHZhciB3aWR0aCA9IHN0eWxlLndpZHRoIHx8IGltYWdlLndpZHRoO1xuICAgICAgICAgICAgICAgICAgICB2YXIgaGVpZ2h0ID0gc3R5bGUuaGVpZ2h0IHx8IGltYWdlLmhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHggPSBzdHlsZS54O1xuICAgICAgICAgICAgICAgICAgICB2YXIgeSA9IHN0eWxlLnk7XG4gICAgICAgICAgICAgICAgICAgIC8vIOWbvueJh+WKoOi9veWksei0pVxuICAgICAgICAgICAgICAgICAgICBpZiAoIWltYWdlLndpZHRoIHx8ICFpbWFnZS5oZWlnaHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGN0eC5zYXZlKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kb0NsaXAoY3R4KTtcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldENvbnRleHQoY3R4LCBzdHlsZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8g6K6+572udHJhbnNmb3JtXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0VHJhbnNmb3JtKGN0eCk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0eWxlLnNXaWR0aCAmJiBzdHlsZS5zSGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc3ggPSBzdHlsZS5zeCB8fCAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHN5ID0gc3R5bGUuc3kgfHwgMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5kcmF3SW1hZ2UoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW1hZ2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3gsIHN5LCBzdHlsZS5zV2lkdGgsIHN0eWxlLnNIZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeCwgeSwgd2lkdGgsIGhlaWdodFxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChzdHlsZS5zeCAmJiBzdHlsZS5zeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHN4ID0gc3R5bGUuc3g7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc3kgPSBzdHlsZS5zeTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzV2lkdGggPSB3aWR0aCAtIHN4O1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNIZWlnaHQgPSBoZWlnaHQgLSBzeTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5kcmF3SW1hZ2UoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW1hZ2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3gsIHN5LCBzV2lkdGgsIHNIZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeCwgeSwgd2lkdGgsIGhlaWdodFxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5kcmF3SW1hZ2UoaW1hZ2UsIHgsIHksIHdpZHRoLCBoZWlnaHQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIOWmguaenOayoeiuvue9ruWuveWSjOmrmOeahOivneiHquWKqOagueaNruWbvueJh+WuvemrmOiuvue9rlxuICAgICAgICAgICAgICAgICAgICBpZiAoIXN0eWxlLndpZHRoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdHlsZS53aWR0aCA9IHdpZHRoO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICghc3R5bGUuaGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdHlsZS5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLnN0eWxlLndpZHRoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0eWxlLndpZHRoID0gd2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLnN0eWxlLmhlaWdodCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdHlsZS5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYXdUZXh0KGN0eCwgc3R5bGUsIHRoaXMuc3R5bGUpO1xuXG4gICAgICAgICAgICAgICAgICAgIGN0eC5yZXN0b3JlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDorqHnrpfov5Tlm57lm77niYfnmoTljIXlm7Tnm5Lnn6nlvaJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bW9kdWxlOnpyZW5kZXIvc2hhcGUvSW1hZ2V+SUltYWdlU3R5bGV9IHN0eWxlXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHttb2R1bGU6enJlbmRlci9zaGFwZS9CYXNlfklCb3VuZGluZ1JlY3R9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGdldFJlY3Q6IGZ1bmN0aW9uKHN0eWxlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgeCA6IHN0eWxlLngsXG4gICAgICAgICAgICAgICAgICAgIHkgOiBzdHlsZS55LFxuICAgICAgICAgICAgICAgICAgICB3aWR0aCA6IHN0eWxlLndpZHRoLFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQgOiBzdHlsZS5oZWlnaHRcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgY2xlYXJDYWNoZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5faW1hZ2VDYWNoZSA9IHt9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHJlcXVpcmUoJy4uL3Rvb2wvdXRpbCcpLmluaGVyaXRzKFpJbWFnZSwgQmFzZSk7XG4gICAgICAgIHJldHVybiBaSW1hZ2U7XG4gICAgfVxuKTtcbiJdLCJmaWxlIjoicGx1Z2lucy96cmVuZGVyLTIuMS4wL3NyYy9zaGFwZS9JbWFnZS5qcyJ9
