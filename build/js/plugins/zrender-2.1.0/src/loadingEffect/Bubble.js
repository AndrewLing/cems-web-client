
define(
    function (require) {
        var Base = require('./Base');
        var util = require('../tool/util');
        var zrColor = require('../tool/color');
        var CircleShape = require('../shape/Circle');

        function Bubble(options) {
            Base.call(this, options);
        }
        util.inherits(Bubble, Base);

        /**
         * 泡泡
         *
         * @param {Object} addShapeHandle
         * @param {Object} refreshHandle
         */
        Bubble.prototype._start = function (addShapeHandle, refreshHandle) {
            
            // 特效默认配置
            var options = util.merge(
                this.options,
                {
                    textStyle : {
                        color : '#888'
                    },
                    backgroundColor : 'rgba(250, 250, 250, 0.8)',
                    effect : {
                        n : 50,
                        lineWidth : 2,
                        brushType : 'stroke',
                        color : 'random',
                        timeInterval : 100
                    }
                }
            );

            var textShape = this.createTextShape(options.textStyle);
            var background = this.createBackgroundShape(options.backgroundColor);

            var effectOption = options.effect;
            var n = effectOption.n;
            var brushType = effectOption.brushType;
            var lineWidth = effectOption.lineWidth;

            var shapeList = [];
            var canvasWidth = this.canvasWidth;
            var canvasHeight = this.canvasHeight;
            
            // 初始化动画元素
            for (var i = 0; i < n; i++) {
                var color = effectOption.color == 'random'
                    ? zrColor.alpha(zrColor.random(), 0.3)
                    : effectOption.color;

                shapeList[i] = new CircleShape({
                    highlightStyle : {
                        x : Math.ceil(Math.random() * canvasWidth),
                        y : Math.ceil(Math.random() * canvasHeight),
                        r : Math.ceil(Math.random() * 40),
                        brushType : brushType,
                        color : color,
                        strokeColor : color,
                        lineWidth : lineWidth
                    },
                    animationY : Math.ceil(Math.random() * 20)
                });
            }
            
            return setInterval(
                function () {
                    addShapeHandle(background);
                    
                    for (var i = 0; i < n; i++) {
                        var style = shapeList[i].highlightStyle;

                        if (style.y - shapeList[i].animationY + style.r <= 0) {
                            shapeList[i].highlightStyle.y = canvasHeight + style.r;
                            shapeList[i].highlightStyle.x = Math.ceil(
                                Math.random() * canvasWidth
                            );
                        }
                        shapeList[i].highlightStyle.y -=
                            shapeList[i].animationY;

                        addShapeHandle(shapeList[i]);
                    }

                    addShapeHandle(textShape);
                    refreshHandle();
                },
                effectOption.timeInterval
            );
        };

        return Bubble;
    }
);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL2xvYWRpbmdFZmZlY3QvQnViYmxlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIlxuZGVmaW5lKFxuICAgIGZ1bmN0aW9uIChyZXF1aXJlKSB7XG4gICAgICAgIHZhciBCYXNlID0gcmVxdWlyZSgnLi9CYXNlJyk7XG4gICAgICAgIHZhciB1dGlsID0gcmVxdWlyZSgnLi4vdG9vbC91dGlsJyk7XG4gICAgICAgIHZhciB6ckNvbG9yID0gcmVxdWlyZSgnLi4vdG9vbC9jb2xvcicpO1xuICAgICAgICB2YXIgQ2lyY2xlU2hhcGUgPSByZXF1aXJlKCcuLi9zaGFwZS9DaXJjbGUnKTtcblxuICAgICAgICBmdW5jdGlvbiBCdWJibGUob3B0aW9ucykge1xuICAgICAgICAgICAgQmFzZS5jYWxsKHRoaXMsIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIHV0aWwuaW5oZXJpdHMoQnViYmxlLCBCYXNlKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICog5rOh5rOhXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBhZGRTaGFwZUhhbmRsZVxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gcmVmcmVzaEhhbmRsZVxuICAgICAgICAgKi9cbiAgICAgICAgQnViYmxlLnByb3RvdHlwZS5fc3RhcnQgPSBmdW5jdGlvbiAoYWRkU2hhcGVIYW5kbGUsIHJlZnJlc2hIYW5kbGUpIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g54m55pWI6buY6K6k6YWN572uXG4gICAgICAgICAgICB2YXIgb3B0aW9ucyA9IHV0aWwubWVyZ2UoXG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdGV4dFN0eWxlIDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3IgOiAnIzg4OCdcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yIDogJ3JnYmEoMjUwLCAyNTAsIDI1MCwgMC44KScsXG4gICAgICAgICAgICAgICAgICAgIGVmZmVjdCA6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG4gOiA1MCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmVXaWR0aCA6IDIsXG4gICAgICAgICAgICAgICAgICAgICAgICBicnVzaFR5cGUgOiAnc3Ryb2tlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yIDogJ3JhbmRvbScsXG4gICAgICAgICAgICAgICAgICAgICAgICB0aW1lSW50ZXJ2YWwgOiAxMDBcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHZhciB0ZXh0U2hhcGUgPSB0aGlzLmNyZWF0ZVRleHRTaGFwZShvcHRpb25zLnRleHRTdHlsZSk7XG4gICAgICAgICAgICB2YXIgYmFja2dyb3VuZCA9IHRoaXMuY3JlYXRlQmFja2dyb3VuZFNoYXBlKG9wdGlvbnMuYmFja2dyb3VuZENvbG9yKTtcblxuICAgICAgICAgICAgdmFyIGVmZmVjdE9wdGlvbiA9IG9wdGlvbnMuZWZmZWN0O1xuICAgICAgICAgICAgdmFyIG4gPSBlZmZlY3RPcHRpb24ubjtcbiAgICAgICAgICAgIHZhciBicnVzaFR5cGUgPSBlZmZlY3RPcHRpb24uYnJ1c2hUeXBlO1xuICAgICAgICAgICAgdmFyIGxpbmVXaWR0aCA9IGVmZmVjdE9wdGlvbi5saW5lV2lkdGg7XG5cbiAgICAgICAgICAgIHZhciBzaGFwZUxpc3QgPSBbXTtcbiAgICAgICAgICAgIHZhciBjYW52YXNXaWR0aCA9IHRoaXMuY2FudmFzV2lkdGg7XG4gICAgICAgICAgICB2YXIgY2FudmFzSGVpZ2h0ID0gdGhpcy5jYW52YXNIZWlnaHQ7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOWIneWni+WMluWKqOeUu+WFg+e0oFxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgY29sb3IgPSBlZmZlY3RPcHRpb24uY29sb3IgPT0gJ3JhbmRvbSdcbiAgICAgICAgICAgICAgICAgICAgPyB6ckNvbG9yLmFscGhhKHpyQ29sb3IucmFuZG9tKCksIDAuMylcbiAgICAgICAgICAgICAgICAgICAgOiBlZmZlY3RPcHRpb24uY29sb3I7XG5cbiAgICAgICAgICAgICAgICBzaGFwZUxpc3RbaV0gPSBuZXcgQ2lyY2xlU2hhcGUoe1xuICAgICAgICAgICAgICAgICAgICBoaWdobGlnaHRTdHlsZSA6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHggOiBNYXRoLmNlaWwoTWF0aC5yYW5kb20oKSAqIGNhbnZhc1dpZHRoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHkgOiBNYXRoLmNlaWwoTWF0aC5yYW5kb20oKSAqIGNhbnZhc0hlaWdodCksXG4gICAgICAgICAgICAgICAgICAgICAgICByIDogTWF0aC5jZWlsKE1hdGgucmFuZG9tKCkgKiA0MCksXG4gICAgICAgICAgICAgICAgICAgICAgICBicnVzaFR5cGUgOiBicnVzaFR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvciA6IGNvbG9yLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3Ryb2tlQ29sb3IgOiBjb2xvcixcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmVXaWR0aCA6IGxpbmVXaWR0aFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25ZIDogTWF0aC5jZWlsKE1hdGgucmFuZG9tKCkgKiAyMClcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIHNldEludGVydmFsKFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgYWRkU2hhcGVIYW5kbGUoYmFja2dyb3VuZCk7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHN0eWxlID0gc2hhcGVMaXN0W2ldLmhpZ2hsaWdodFN0eWxlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3R5bGUueSAtIHNoYXBlTGlzdFtpXS5hbmltYXRpb25ZICsgc3R5bGUuciA8PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hhcGVMaXN0W2ldLmhpZ2hsaWdodFN0eWxlLnkgPSBjYW52YXNIZWlnaHQgKyBzdHlsZS5yO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNoYXBlTGlzdFtpXS5oaWdobGlnaHRTdHlsZS54ID0gTWF0aC5jZWlsKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLnJhbmRvbSgpICogY2FudmFzV2lkdGhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgc2hhcGVMaXN0W2ldLmhpZ2hsaWdodFN0eWxlLnkgLT1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaGFwZUxpc3RbaV0uYW5pbWF0aW9uWTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgYWRkU2hhcGVIYW5kbGUoc2hhcGVMaXN0W2ldKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGFkZFNoYXBlSGFuZGxlKHRleHRTaGFwZSk7XG4gICAgICAgICAgICAgICAgICAgIHJlZnJlc2hIYW5kbGUoKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGVmZmVjdE9wdGlvbi50aW1lSW50ZXJ2YWxcbiAgICAgICAgICAgICk7XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIEJ1YmJsZTtcbiAgICB9XG4pO1xuIl0sImZpbGUiOiJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL2xvYWRpbmdFZmZlY3QvQnViYmxlLmpzIn0=
