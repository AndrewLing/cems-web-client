/**
 * zrender: loading特效类
 *
 * @author Kener (@Kener-林峰, kener.linfeng@gmail.com)
 *         errorrik (errorrik@gmail.com)
 */

define(
    function(require) {
        var util = require('../tool/util');
        var TextShape = require('../shape/Text');
        var RectangleShape = require('../shape/Rectangle');


        var DEFAULT_TEXT = 'Loading...';
        var DEFAULT_TEXT_FONT = 'normal 16px Arial';

        /**
         * @constructor
         * 
         * @param {Object} options 选项
         * @param {color} options.backgroundColor 背景颜色
         * @param {Object} options.textStyle 文字样式，同shape/text.style
         * @param {number=} options.progress 进度参数，部分特效有用
         * @param {Object=} options.effect 特效参数，部分特效有用
         * 
         * {
         *     effect,
         *     //loading话术
         *     text:'',
         *     // 水平安放位置，默认为 'center'，可指定x坐标
         *     x:'center' || 'left' || 'right' || {number},
         *     // 垂直安放位置，默认为'top'，可指定y坐标
         *     y:'top' || 'bottom' || {number},
         *
         *     textStyle:{
         *         textFont: 'normal 20px Arial' || {textFont}, //文本字体
         *         color: {color}
         *     }
         * }
         */
        function Base(options) {
            this.setOptions(options);
        }

        /**
         * 创建loading文字图形
         * 
         * @param {Object} textStyle 文字style，同shape/text.style
         */
        Base.prototype.createTextShape = function (textStyle) {
            return new TextShape({
                highlightStyle : util.merge(
                    {
                        x : this.canvasWidth / 2,
                        y : this.canvasHeight / 2,
                        text : DEFAULT_TEXT,
                        textAlign : 'center',
                        textBaseline : 'middle',
                        textFont : DEFAULT_TEXT_FONT,
                        color: '#333',
                        brushType : 'fill'
                    },
                    textStyle,
                    true
                )
            });
        };
        
        /**
         * 获取loading背景图形
         * 
         * @param {color} color 背景颜色
         */
        Base.prototype.createBackgroundShape = function (color) {
            return new RectangleShape({
                highlightStyle : {
                    x : 0,
                    y : 0,
                    width : this.canvasWidth,
                    height : this.canvasHeight,
                    brushType : 'fill',
                    color : color
                }
            });
        };

        Base.prototype.start = function (painter) {
            this.canvasWidth = painter._width;
            this.canvasHeight = painter._height;

            function addShapeHandle(param) {
                painter.storage.addHover(param);
            }
            function refreshHandle() {
                painter.refreshHover();
            }
            this.loadingTimer = this._start(addShapeHandle, refreshHandle);
        };

        Base.prototype._start = function (/*addShapeHandle, refreshHandle*/) {
            return setInterval(function () {
            }, 10000);
        };

        Base.prototype.stop = function () {
            clearInterval(this.loadingTimer);
        };

        Base.prototype.setOptions = function (options) {
            this.options = options || {};
        };
        
        Base.prototype.adjust = function (value, region) {
            if (value <= region[0]) {
                value = region[0];
            }
            else if (value >= region[1]) {
                value = region[1];
            }
            return value;
        };
        
        Base.prototype.getLocation = function(loc, totalWidth, totalHeight) {
            var x = loc.x != null ? loc.x : 'center';
            switch (x) {
                case 'center' :
                    x = Math.floor((this.canvasWidth - totalWidth) / 2);
                    break;
                case 'left' :
                    x = 0;
                    break;
                case 'right' :
                    x = this.canvasWidth - totalWidth;
                    break;
            }
            var y = loc.y != null ? loc.y : 'center';
            switch (y) {
                case 'center' :
                    y = Math.floor((this.canvasHeight - totalHeight) / 2);
                    break;
                case 'top' :
                    y = 0;
                    break;
                case 'bottom' :
                    y = this.canvasHeight - totalHeight;
                    break;
            }
            return {
                x : x,
                y : y,
                width : totalWidth,
                height : totalHeight
            };
        };

        return Base;
    }
);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL2xvYWRpbmdFZmZlY3QvQmFzZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIHpyZW5kZXI6IGxvYWRpbmfnibnmlYjnsbtcbiAqXG4gKiBAYXV0aG9yIEtlbmVyIChAS2VuZXIt5p6X5bOwLCBrZW5lci5saW5mZW5nQGdtYWlsLmNvbSlcbiAqICAgICAgICAgZXJyb3JyaWsgKGVycm9ycmlrQGdtYWlsLmNvbSlcbiAqL1xuXG5kZWZpbmUoXG4gICAgZnVuY3Rpb24ocmVxdWlyZSkge1xuICAgICAgICB2YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3Rvb2wvdXRpbCcpO1xuICAgICAgICB2YXIgVGV4dFNoYXBlID0gcmVxdWlyZSgnLi4vc2hhcGUvVGV4dCcpO1xuICAgICAgICB2YXIgUmVjdGFuZ2xlU2hhcGUgPSByZXF1aXJlKCcuLi9zaGFwZS9SZWN0YW5nbGUnKTtcblxuXG4gICAgICAgIHZhciBERUZBVUxUX1RFWFQgPSAnTG9hZGluZy4uLic7XG4gICAgICAgIHZhciBERUZBVUxUX1RFWFRfRk9OVCA9ICdub3JtYWwgMTZweCBBcmlhbCc7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAgICAgKiBcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMg6YCJ6aG5XG4gICAgICAgICAqIEBwYXJhbSB7Y29sb3J9IG9wdGlvbnMuYmFja2dyb3VuZENvbG9yIOiDjOaZr+minOiJslxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucy50ZXh0U3R5bGUg5paH5a2X5qC35byP77yM5ZCMc2hhcGUvdGV4dC5zdHlsZVxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcj19IG9wdGlvbnMucHJvZ3Jlc3Mg6L+b5bqm5Y+C5pWw77yM6YOo5YiG54m55pWI5pyJ55SoXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0PX0gb3B0aW9ucy5lZmZlY3Qg54m55pWI5Y+C5pWw77yM6YOo5YiG54m55pWI5pyJ55SoXG4gICAgICAgICAqIFxuICAgICAgICAgKiB7XG4gICAgICAgICAqICAgICBlZmZlY3QsXG4gICAgICAgICAqICAgICAvL2xvYWRpbmfor53mnK9cbiAgICAgICAgICogICAgIHRleHQ6JycsXG4gICAgICAgICAqICAgICAvLyDmsLTlubPlronmlL7kvY3nva7vvIzpu5jorqTkuLogJ2NlbnRlcifvvIzlj6/mjIflrpp45Z2Q5qCHXG4gICAgICAgICAqICAgICB4OidjZW50ZXInIHx8ICdsZWZ0JyB8fCAncmlnaHQnIHx8IHtudW1iZXJ9LFxuICAgICAgICAgKiAgICAgLy8g5Z6C55u05a6J5pS+5L2N572u77yM6buY6K6k5Li6J3RvcCfvvIzlj6/mjIflrpp55Z2Q5qCHXG4gICAgICAgICAqICAgICB5Oid0b3AnIHx8ICdib3R0b20nIHx8IHtudW1iZXJ9LFxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgdGV4dFN0eWxlOntcbiAgICAgICAgICogICAgICAgICB0ZXh0Rm9udDogJ25vcm1hbCAyMHB4IEFyaWFsJyB8fCB7dGV4dEZvbnR9LCAvL+aWh+acrOWtl+S9k1xuICAgICAgICAgKiAgICAgICAgIGNvbG9yOiB7Y29sb3J9XG4gICAgICAgICAqICAgICB9XG4gICAgICAgICAqIH1cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIEJhc2Uob3B0aW9ucykge1xuICAgICAgICAgICAgdGhpcy5zZXRPcHRpb25zKG9wdGlvbnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWIm+W7umxvYWRpbmfmloflrZflm77lvaJcbiAgICAgICAgICogXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSB0ZXh0U3R5bGUg5paH5a2Xc3R5bGXvvIzlkIxzaGFwZS90ZXh0LnN0eWxlXG4gICAgICAgICAqL1xuICAgICAgICBCYXNlLnByb3RvdHlwZS5jcmVhdGVUZXh0U2hhcGUgPSBmdW5jdGlvbiAodGV4dFN0eWxlKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFRleHRTaGFwZSh7XG4gICAgICAgICAgICAgICAgaGlnaGxpZ2h0U3R5bGUgOiB1dGlsLm1lcmdlKFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICB4IDogdGhpcy5jYW52YXNXaWR0aCAvIDIsXG4gICAgICAgICAgICAgICAgICAgICAgICB5IDogdGhpcy5jYW52YXNIZWlnaHQgLyAyLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dCA6IERFRkFVTFRfVEVYVCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHRBbGlnbiA6ICdjZW50ZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dEJhc2VsaW5lIDogJ21pZGRsZScsXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0Rm9udCA6IERFRkFVTFRfVEVYVF9GT05ULFxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICcjMzMzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJydXNoVHlwZSA6ICdmaWxsJ1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB0ZXh0U3R5bGUsXG4gICAgICAgICAgICAgICAgICAgIHRydWVcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDojrflj5Zsb2FkaW5n6IOM5pmv5Zu+5b2iXG4gICAgICAgICAqIFxuICAgICAgICAgKiBAcGFyYW0ge2NvbG9yfSBjb2xvciDog4zmma/popzoibJcbiAgICAgICAgICovXG4gICAgICAgIEJhc2UucHJvdG90eXBlLmNyZWF0ZUJhY2tncm91bmRTaGFwZSA9IGZ1bmN0aW9uIChjb2xvcikge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBSZWN0YW5nbGVTaGFwZSh7XG4gICAgICAgICAgICAgICAgaGlnaGxpZ2h0U3R5bGUgOiB7XG4gICAgICAgICAgICAgICAgICAgIHggOiAwLFxuICAgICAgICAgICAgICAgICAgICB5IDogMCxcbiAgICAgICAgICAgICAgICAgICAgd2lkdGggOiB0aGlzLmNhbnZhc1dpZHRoLFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQgOiB0aGlzLmNhbnZhc0hlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgYnJ1c2hUeXBlIDogJ2ZpbGwnLFxuICAgICAgICAgICAgICAgICAgICBjb2xvciA6IGNvbG9yXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgQmFzZS5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbiAocGFpbnRlcikge1xuICAgICAgICAgICAgdGhpcy5jYW52YXNXaWR0aCA9IHBhaW50ZXIuX3dpZHRoO1xuICAgICAgICAgICAgdGhpcy5jYW52YXNIZWlnaHQgPSBwYWludGVyLl9oZWlnaHQ7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGFkZFNoYXBlSGFuZGxlKHBhcmFtKSB7XG4gICAgICAgICAgICAgICAgcGFpbnRlci5zdG9yYWdlLmFkZEhvdmVyKHBhcmFtKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZ1bmN0aW9uIHJlZnJlc2hIYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgcGFpbnRlci5yZWZyZXNoSG92ZXIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMubG9hZGluZ1RpbWVyID0gdGhpcy5fc3RhcnQoYWRkU2hhcGVIYW5kbGUsIHJlZnJlc2hIYW5kbGUpO1xuICAgICAgICB9O1xuXG4gICAgICAgIEJhc2UucHJvdG90eXBlLl9zdGFydCA9IGZ1bmN0aW9uICgvKmFkZFNoYXBlSGFuZGxlLCByZWZyZXNoSGFuZGxlKi8pIHtcbiAgICAgICAgICAgIHJldHVybiBzZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB9LCAxMDAwMCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgQmFzZS5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5sb2FkaW5nVGltZXIpO1xuICAgICAgICB9O1xuXG4gICAgICAgIEJhc2UucHJvdG90eXBlLnNldE9wdGlvbnMgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIEJhc2UucHJvdG90eXBlLmFkanVzdCA9IGZ1bmN0aW9uICh2YWx1ZSwgcmVnaW9uKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgPD0gcmVnaW9uWzBdKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSByZWdpb25bMF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh2YWx1ZSA+PSByZWdpb25bMV0pIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHJlZ2lvblsxXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIEJhc2UucHJvdG90eXBlLmdldExvY2F0aW9uID0gZnVuY3Rpb24obG9jLCB0b3RhbFdpZHRoLCB0b3RhbEhlaWdodCkge1xuICAgICAgICAgICAgdmFyIHggPSBsb2MueCAhPSBudWxsID8gbG9jLnggOiAnY2VudGVyJztcbiAgICAgICAgICAgIHN3aXRjaCAoeCkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ2NlbnRlcicgOlxuICAgICAgICAgICAgICAgICAgICB4ID0gTWF0aC5mbG9vcigodGhpcy5jYW52YXNXaWR0aCAtIHRvdGFsV2lkdGgpIC8gMik7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2xlZnQnIDpcbiAgICAgICAgICAgICAgICAgICAgeCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ3JpZ2h0JyA6XG4gICAgICAgICAgICAgICAgICAgIHggPSB0aGlzLmNhbnZhc1dpZHRoIC0gdG90YWxXaWR0aDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgeSA9IGxvYy55ICE9IG51bGwgPyBsb2MueSA6ICdjZW50ZXInO1xuICAgICAgICAgICAgc3dpdGNoICh5KSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnY2VudGVyJyA6XG4gICAgICAgICAgICAgICAgICAgIHkgPSBNYXRoLmZsb29yKCh0aGlzLmNhbnZhc0hlaWdodCAtIHRvdGFsSGVpZ2h0KSAvIDIpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICd0b3AnIDpcbiAgICAgICAgICAgICAgICAgICAgeSA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2JvdHRvbScgOlxuICAgICAgICAgICAgICAgICAgICB5ID0gdGhpcy5jYW52YXNIZWlnaHQgLSB0b3RhbEhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHggOiB4LFxuICAgICAgICAgICAgICAgIHkgOiB5LFxuICAgICAgICAgICAgICAgIHdpZHRoIDogdG90YWxXaWR0aCxcbiAgICAgICAgICAgICAgICBoZWlnaHQgOiB0b3RhbEhlaWdodFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gQmFzZTtcbiAgICB9XG4pO1xuIl0sImZpbGUiOiJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL2xvYWRpbmdFZmZlY3QvQmFzZS5qcyJ9
