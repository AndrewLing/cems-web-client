
define(
    function (require) {
        var Base = require('./Base');
        var util = require('../tool/util');
        var zrColor = require('../tool/color');
        var zrArea = require('../tool/area');
        var SectorShape = require('../shape/Sector');

        function Spin(options) {
            Base.call(this, options);
        }
        util.inherits(Spin, Base);

        /**
         * 旋转
         * 
         * @param {Object} addShapeHandle
         * @param {Object} refreshHandle
         */
        Spin.prototype._start = function (addShapeHandle, refreshHandle) {
            var options = util.merge(
                this.options,
                {
                    textStyle : {
                        color : '#fff',
                        textAlign : 'start'
                    },
                    backgroundColor : 'rgba(0, 0, 0, 0.8)'
                }
            );
            var textShape = this.createTextShape(options.textStyle);
            
            var textGap = 10;
            var textWidth = zrArea.getTextWidth(
                textShape.highlightStyle.text, textShape.highlightStyle.textFont
            );
            var textHeight = zrArea.getTextHeight(
                textShape.highlightStyle.text, textShape.highlightStyle.textFont
            );
            
            // 特效默认配置
            var effectOption =  util.merge(
                this.options.effect || {},
                {
                    r0 : 9,
                    r : 15,
                    n : 18,
                    color : '#fff',
                    timeInterval : 100
                }
            );
            
            var location = this.getLocation(
                this.options.textStyle,
                textWidth + textGap + effectOption.r * 2,
                Math.max(effectOption.r * 2, textHeight)
            );
            effectOption.x = location.x + effectOption.r;
            effectOption.y = textShape.highlightStyle.y = location.y + location.height / 2;
            textShape.highlightStyle.x = effectOption.x + effectOption.r + textGap;
            
            var background = this.createBackgroundShape(options.backgroundColor);
            var n = effectOption.n;
            var x = effectOption.x;
            var y = effectOption.y;
            var r0 = effectOption.r0;
            var r = effectOption.r;
            var color = effectOption.color;

            // 初始化动画元素
            var shapeList = [];
            var preAngle = Math.round(180 / n);
            for (var i = 0; i < n; i++) {
                shapeList[i] = new SectorShape({
                    highlightStyle  : {
                        x : x,
                        y : y,
                        r0 : r0,
                        r : r,
                        startAngle : preAngle * i * 2,
                        endAngle : preAngle * i * 2 + preAngle,
                        color : zrColor.alpha(color, (i + 1) / n),
                        brushType: 'fill'
                    }
                });
            }

            var pos = [ 0, x, y ];

            return setInterval(
                function() {
                    addShapeHandle(background);
                    pos[0] -= 0.3;
                    for (var i = 0; i < n; i++) {
                        shapeList[i].rotation = pos;
                        addShapeHandle(shapeList[i]);
                    }

                    addShapeHandle(textShape);
                    refreshHandle();
                },
                effectOption.timeInterval
            );
        };

        return Spin;
    }
);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL2xvYWRpbmdFZmZlY3QvU3Bpbi5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJcbmRlZmluZShcbiAgICBmdW5jdGlvbiAocmVxdWlyZSkge1xuICAgICAgICB2YXIgQmFzZSA9IHJlcXVpcmUoJy4vQmFzZScpO1xuICAgICAgICB2YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3Rvb2wvdXRpbCcpO1xuICAgICAgICB2YXIgenJDb2xvciA9IHJlcXVpcmUoJy4uL3Rvb2wvY29sb3InKTtcbiAgICAgICAgdmFyIHpyQXJlYSA9IHJlcXVpcmUoJy4uL3Rvb2wvYXJlYScpO1xuICAgICAgICB2YXIgU2VjdG9yU2hhcGUgPSByZXF1aXJlKCcuLi9zaGFwZS9TZWN0b3InKTtcblxuICAgICAgICBmdW5jdGlvbiBTcGluKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIEJhc2UuY2FsbCh0aGlzLCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgICB1dGlsLmluaGVyaXRzKFNwaW4sIEJhc2UpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDml4vovaxcbiAgICAgICAgICogXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBhZGRTaGFwZUhhbmRsZVxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gcmVmcmVzaEhhbmRsZVxuICAgICAgICAgKi9cbiAgICAgICAgU3Bpbi5wcm90b3R5cGUuX3N0YXJ0ID0gZnVuY3Rpb24gKGFkZFNoYXBlSGFuZGxlLCByZWZyZXNoSGFuZGxlKSB7XG4gICAgICAgICAgICB2YXIgb3B0aW9ucyA9IHV0aWwubWVyZ2UoXG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdGV4dFN0eWxlIDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3IgOiAnI2ZmZicsXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0QWxpZ24gOiAnc3RhcnQnXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmRDb2xvciA6ICdyZ2JhKDAsIDAsIDAsIDAuOCknXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHZhciB0ZXh0U2hhcGUgPSB0aGlzLmNyZWF0ZVRleHRTaGFwZShvcHRpb25zLnRleHRTdHlsZSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciB0ZXh0R2FwID0gMTA7XG4gICAgICAgICAgICB2YXIgdGV4dFdpZHRoID0genJBcmVhLmdldFRleHRXaWR0aChcbiAgICAgICAgICAgICAgICB0ZXh0U2hhcGUuaGlnaGxpZ2h0U3R5bGUudGV4dCwgdGV4dFNoYXBlLmhpZ2hsaWdodFN0eWxlLnRleHRGb250XG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgdmFyIHRleHRIZWlnaHQgPSB6ckFyZWEuZ2V0VGV4dEhlaWdodChcbiAgICAgICAgICAgICAgICB0ZXh0U2hhcGUuaGlnaGxpZ2h0U3R5bGUudGV4dCwgdGV4dFNoYXBlLmhpZ2hsaWdodFN0eWxlLnRleHRGb250XG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDnibnmlYjpu5jorqTphY3nva5cbiAgICAgICAgICAgIHZhciBlZmZlY3RPcHRpb24gPSAgdXRpbC5tZXJnZShcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuZWZmZWN0IHx8IHt9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcjAgOiA5LFxuICAgICAgICAgICAgICAgICAgICByIDogMTUsXG4gICAgICAgICAgICAgICAgICAgIG4gOiAxOCxcbiAgICAgICAgICAgICAgICAgICAgY29sb3IgOiAnI2ZmZicsXG4gICAgICAgICAgICAgICAgICAgIHRpbWVJbnRlcnZhbCA6IDEwMFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBsb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oXG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLnRleHRTdHlsZSxcbiAgICAgICAgICAgICAgICB0ZXh0V2lkdGggKyB0ZXh0R2FwICsgZWZmZWN0T3B0aW9uLnIgKiAyLFxuICAgICAgICAgICAgICAgIE1hdGgubWF4KGVmZmVjdE9wdGlvbi5yICogMiwgdGV4dEhlaWdodClcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBlZmZlY3RPcHRpb24ueCA9IGxvY2F0aW9uLnggKyBlZmZlY3RPcHRpb24ucjtcbiAgICAgICAgICAgIGVmZmVjdE9wdGlvbi55ID0gdGV4dFNoYXBlLmhpZ2hsaWdodFN0eWxlLnkgPSBsb2NhdGlvbi55ICsgbG9jYXRpb24uaGVpZ2h0IC8gMjtcbiAgICAgICAgICAgIHRleHRTaGFwZS5oaWdobGlnaHRTdHlsZS54ID0gZWZmZWN0T3B0aW9uLnggKyBlZmZlY3RPcHRpb24uciArIHRleHRHYXA7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBiYWNrZ3JvdW5kID0gdGhpcy5jcmVhdGVCYWNrZ3JvdW5kU2hhcGUob3B0aW9ucy5iYWNrZ3JvdW5kQ29sb3IpO1xuICAgICAgICAgICAgdmFyIG4gPSBlZmZlY3RPcHRpb24ubjtcbiAgICAgICAgICAgIHZhciB4ID0gZWZmZWN0T3B0aW9uLng7XG4gICAgICAgICAgICB2YXIgeSA9IGVmZmVjdE9wdGlvbi55O1xuICAgICAgICAgICAgdmFyIHIwID0gZWZmZWN0T3B0aW9uLnIwO1xuICAgICAgICAgICAgdmFyIHIgPSBlZmZlY3RPcHRpb24ucjtcbiAgICAgICAgICAgIHZhciBjb2xvciA9IGVmZmVjdE9wdGlvbi5jb2xvcjtcblxuICAgICAgICAgICAgLy8g5Yid5aeL5YyW5Yqo55S75YWD57SgXG4gICAgICAgICAgICB2YXIgc2hhcGVMaXN0ID0gW107XG4gICAgICAgICAgICB2YXIgcHJlQW5nbGUgPSBNYXRoLnJvdW5kKDE4MCAvIG4pO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgICAgICBzaGFwZUxpc3RbaV0gPSBuZXcgU2VjdG9yU2hhcGUoe1xuICAgICAgICAgICAgICAgICAgICBoaWdobGlnaHRTdHlsZSAgOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB4IDogeCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHkgOiB5LFxuICAgICAgICAgICAgICAgICAgICAgICAgcjAgOiByMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHIgOiByLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRBbmdsZSA6IHByZUFuZ2xlICogaSAqIDIsXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmRBbmdsZSA6IHByZUFuZ2xlICogaSAqIDIgKyBwcmVBbmdsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yIDogenJDb2xvci5hbHBoYShjb2xvciwgKGkgKyAxKSAvIG4pLFxuICAgICAgICAgICAgICAgICAgICAgICAgYnJ1c2hUeXBlOiAnZmlsbCdcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgcG9zID0gWyAwLCB4LCB5IF07XG5cbiAgICAgICAgICAgIHJldHVybiBzZXRJbnRlcnZhbChcbiAgICAgICAgICAgICAgICBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgYWRkU2hhcGVIYW5kbGUoYmFja2dyb3VuZCk7XG4gICAgICAgICAgICAgICAgICAgIHBvc1swXSAtPSAwLjM7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzaGFwZUxpc3RbaV0ucm90YXRpb24gPSBwb3M7XG4gICAgICAgICAgICAgICAgICAgICAgICBhZGRTaGFwZUhhbmRsZShzaGFwZUxpc3RbaV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgYWRkU2hhcGVIYW5kbGUodGV4dFNoYXBlKTtcbiAgICAgICAgICAgICAgICAgICAgcmVmcmVzaEhhbmRsZSgpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZWZmZWN0T3B0aW9uLnRpbWVJbnRlcnZhbFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gU3BpbjtcbiAgICB9XG4pO1xuIl0sImZpbGUiOiJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL2xvYWRpbmdFZmZlY3QvU3Bpbi5qcyJ9
