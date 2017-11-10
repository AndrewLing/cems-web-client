
define(
    function (require) {
        var Base = require('./Base');
        var util = require('../tool/util');
        var zrColor = require('../tool/color');
        var LineShape = require('../shape/Line');

        function DynamicLine(options) {
            Base.call(this, options);
        }
        util.inherits(DynamicLine, Base);


        /**
         * 动态线
         * 
         * @param {Object} addShapeHandle
         * @param {Object} refreshHandle
         */
        DynamicLine.prototype._start = function (addShapeHandle, refreshHandle) {
            // 特效默认配置
            var options = util.merge(
                this.options,
                {
                    textStyle : {
                        color : '#fff'
                    },
                    backgroundColor : 'rgba(0, 0, 0, 0.8)',
                    effectOption : {
                        n : 30,
                        lineWidth : 1,
                        color : 'random',
                        timeInterval : 100
                    }
                }
            );

            var textShape = this.createTextShape(options.textStyle);
            var background = this.createBackgroundShape(options.backgroundColor);

            var effectOption = options.effectOption;
            var n = effectOption.n;
            var lineWidth = effectOption.lineWidth;

            var shapeList = [];
            var canvasWidth = this.canvasWidth;
            var canvasHeight = this.canvasHeight;
            
            // 初始化动画元素
            for (var i = 0; i < n; i++) {
                var xStart = -Math.ceil(Math.random() * 1000);
                var len = Math.ceil(Math.random() * 400);
                var pos = Math.ceil(Math.random() * canvasHeight);

                var color = effectOption.color == 'random'
                    ? zrColor.random()
                    : effectOption.color;
                
                shapeList[i] = new LineShape({
                    highlightStyle : {
                        xStart : xStart,
                        yStart : pos,
                        xEnd : xStart + len,
                        yEnd : pos,
                        strokeColor : color,
                        lineWidth : lineWidth
                    },
                    animationX : Math.ceil(Math.random() * 100),
                    len : len
                });
            }
            
            return setInterval(
                function() {
                    addShapeHandle(background);
                    
                    for (var i = 0; i < n; i++) {
                        var style = shapeList[i].highlightStyle;

                        if (style.xStart >= canvasWidth) {
                            
                            shapeList[i].len = Math.ceil(Math.random() * 400);
                            style.xStart = -400;
                            style.xEnd = -400 + shapeList[i].len;
                            style.yStart = Math.ceil(Math.random() * canvasHeight);
                            style.yEnd = style.yStart;
                        }

                        style.xStart += shapeList[i].animationX;
                        style.xEnd += shapeList[i].animationX;

                        addShapeHandle(shapeList[i]);
                    }

                    addShapeHandle(textShape);
                    refreshHandle();
                },
                effectOption.timeInterval
            );
        };

        return DynamicLine;
    }
);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL2xvYWRpbmdFZmZlY3QvRHluYW1pY0xpbmUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiXG5kZWZpbmUoXG4gICAgZnVuY3Rpb24gKHJlcXVpcmUpIHtcbiAgICAgICAgdmFyIEJhc2UgPSByZXF1aXJlKCcuL0Jhc2UnKTtcbiAgICAgICAgdmFyIHV0aWwgPSByZXF1aXJlKCcuLi90b29sL3V0aWwnKTtcbiAgICAgICAgdmFyIHpyQ29sb3IgPSByZXF1aXJlKCcuLi90b29sL2NvbG9yJyk7XG4gICAgICAgIHZhciBMaW5lU2hhcGUgPSByZXF1aXJlKCcuLi9zaGFwZS9MaW5lJyk7XG5cbiAgICAgICAgZnVuY3Rpb24gRHluYW1pY0xpbmUob3B0aW9ucykge1xuICAgICAgICAgICAgQmFzZS5jYWxsKHRoaXMsIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIHV0aWwuaW5oZXJpdHMoRHluYW1pY0xpbmUsIEJhc2UpO1xuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWKqOaAgee6v1xuICAgICAgICAgKiBcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGFkZFNoYXBlSGFuZGxlXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSByZWZyZXNoSGFuZGxlXG4gICAgICAgICAqL1xuICAgICAgICBEeW5hbWljTGluZS5wcm90b3R5cGUuX3N0YXJ0ID0gZnVuY3Rpb24gKGFkZFNoYXBlSGFuZGxlLCByZWZyZXNoSGFuZGxlKSB7XG4gICAgICAgICAgICAvLyDnibnmlYjpu5jorqTphY3nva5cbiAgICAgICAgICAgIHZhciBvcHRpb25zID0gdXRpbC5tZXJnZShcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMsXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0ZXh0U3R5bGUgOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvciA6ICcjZmZmJ1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3IgOiAncmdiYSgwLCAwLCAwLCAwLjgpJyxcbiAgICAgICAgICAgICAgICAgICAgZWZmZWN0T3B0aW9uIDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgbiA6IDMwLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGluZVdpZHRoIDogMSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yIDogJ3JhbmRvbScsXG4gICAgICAgICAgICAgICAgICAgICAgICB0aW1lSW50ZXJ2YWwgOiAxMDBcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHZhciB0ZXh0U2hhcGUgPSB0aGlzLmNyZWF0ZVRleHRTaGFwZShvcHRpb25zLnRleHRTdHlsZSk7XG4gICAgICAgICAgICB2YXIgYmFja2dyb3VuZCA9IHRoaXMuY3JlYXRlQmFja2dyb3VuZFNoYXBlKG9wdGlvbnMuYmFja2dyb3VuZENvbG9yKTtcblxuICAgICAgICAgICAgdmFyIGVmZmVjdE9wdGlvbiA9IG9wdGlvbnMuZWZmZWN0T3B0aW9uO1xuICAgICAgICAgICAgdmFyIG4gPSBlZmZlY3RPcHRpb24ubjtcbiAgICAgICAgICAgIHZhciBsaW5lV2lkdGggPSBlZmZlY3RPcHRpb24ubGluZVdpZHRoO1xuXG4gICAgICAgICAgICB2YXIgc2hhcGVMaXN0ID0gW107XG4gICAgICAgICAgICB2YXIgY2FudmFzV2lkdGggPSB0aGlzLmNhbnZhc1dpZHRoO1xuICAgICAgICAgICAgdmFyIGNhbnZhc0hlaWdodCA9IHRoaXMuY2FudmFzSGVpZ2h0O1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDliJ3lp4vljJbliqjnlLvlhYPntKBcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHhTdGFydCA9IC1NYXRoLmNlaWwoTWF0aC5yYW5kb20oKSAqIDEwMDApO1xuICAgICAgICAgICAgICAgIHZhciBsZW4gPSBNYXRoLmNlaWwoTWF0aC5yYW5kb20oKSAqIDQwMCk7XG4gICAgICAgICAgICAgICAgdmFyIHBvcyA9IE1hdGguY2VpbChNYXRoLnJhbmRvbSgpICogY2FudmFzSGVpZ2h0KTtcblxuICAgICAgICAgICAgICAgIHZhciBjb2xvciA9IGVmZmVjdE9wdGlvbi5jb2xvciA9PSAncmFuZG9tJ1xuICAgICAgICAgICAgICAgICAgICA/IHpyQ29sb3IucmFuZG9tKClcbiAgICAgICAgICAgICAgICAgICAgOiBlZmZlY3RPcHRpb24uY29sb3I7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgc2hhcGVMaXN0W2ldID0gbmV3IExpbmVTaGFwZSh7XG4gICAgICAgICAgICAgICAgICAgIGhpZ2hsaWdodFN0eWxlIDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgeFN0YXJ0IDogeFN0YXJ0LFxuICAgICAgICAgICAgICAgICAgICAgICAgeVN0YXJ0IDogcG9zLFxuICAgICAgICAgICAgICAgICAgICAgICAgeEVuZCA6IHhTdGFydCArIGxlbixcbiAgICAgICAgICAgICAgICAgICAgICAgIHlFbmQgOiBwb3MsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdHJva2VDb2xvciA6IGNvbG9yLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGluZVdpZHRoIDogbGluZVdpZHRoXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvblggOiBNYXRoLmNlaWwoTWF0aC5yYW5kb20oKSAqIDEwMCksXG4gICAgICAgICAgICAgICAgICAgIGxlbiA6IGxlblxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gc2V0SW50ZXJ2YWwoXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGFkZFNoYXBlSGFuZGxlKGJhY2tncm91bmQpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzdHlsZSA9IHNoYXBlTGlzdFtpXS5oaWdobGlnaHRTdHlsZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0eWxlLnhTdGFydCA+PSBjYW52YXNXaWR0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNoYXBlTGlzdFtpXS5sZW4gPSBNYXRoLmNlaWwoTWF0aC5yYW5kb20oKSAqIDQwMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGUueFN0YXJ0ID0gLTQwMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZS54RW5kID0gLTQwMCArIHNoYXBlTGlzdFtpXS5sZW47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGUueVN0YXJ0ID0gTWF0aC5jZWlsKE1hdGgucmFuZG9tKCkgKiBjYW52YXNIZWlnaHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlLnlFbmQgPSBzdHlsZS55U3RhcnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlLnhTdGFydCArPSBzaGFwZUxpc3RbaV0uYW5pbWF0aW9uWDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlLnhFbmQgKz0gc2hhcGVMaXN0W2ldLmFuaW1hdGlvblg7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGFkZFNoYXBlSGFuZGxlKHNoYXBlTGlzdFtpXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBhZGRTaGFwZUhhbmRsZSh0ZXh0U2hhcGUpO1xuICAgICAgICAgICAgICAgICAgICByZWZyZXNoSGFuZGxlKCk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlZmZlY3RPcHRpb24udGltZUludGVydmFsXG4gICAgICAgICAgICApO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBEeW5hbWljTGluZTtcbiAgICB9XG4pO1xuIl0sImZpbGUiOiJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL2xvYWRpbmdFZmZlY3QvRHluYW1pY0xpbmUuanMifQ==
