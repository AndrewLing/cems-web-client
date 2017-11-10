
define(
    function (require) {
        var Base = require('./Base');
        var util = require('../tool/util');
        var zrArea = require('../tool/area');
        var RingShape = require('../shape/Ring');
        var DropletShape = require('../shape/Droplet');
        var CircleShape = require('../shape/Circle');

        function Whirling(options) {
            Base.call(this, options);
        }
        util.inherits(Whirling, Base);

        /**
         * 旋转水滴
         * 
         * @param {Object} addShapeHandle
         * @param {Object} refreshHandle
         */
        Whirling.prototype._start = function (addShapeHandle, refreshHandle) {
            var options = util.merge(
                this.options,
                {
                    textStyle : {
                        color : '#888',
                        textAlign : 'start'
                    },
                    backgroundColor : 'rgba(250, 250, 250, 0.8)'
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
            var effectOption = util.merge(
                this.options.effect || {},
                {
                    r : 18,
                    colorIn : '#fff',
                    colorOut : '#555',
                    colorWhirl : '#6cf',
                    timeInterval : 50
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
            // 初始化动画元素
            var droplet = new DropletShape({
                highlightStyle : {
                    a : Math.round(effectOption.r / 2),
                    b : Math.round(effectOption.r - effectOption.r / 6),
                    brushType : 'fill',
                    color : effectOption.colorWhirl
                }
            });
            var circleIn = new CircleShape({
                highlightStyle : {
                    r : Math.round(effectOption.r / 6),
                    brushType : 'fill',
                    color : effectOption.colorIn
                }
            });
            var circleOut = new RingShape({
                highlightStyle : {
                    r0 : Math.round(effectOption.r - effectOption.r / 3),
                    r : effectOption.r,
                    brushType : 'fill',
                    color : effectOption.colorOut
                }
            });

            var pos = [ 0, effectOption.x, effectOption.y ];

            droplet.highlightStyle.x
                = circleIn.highlightStyle.x
                = circleOut.highlightStyle.x
                = pos[1];
            droplet.highlightStyle.y
                = circleIn.highlightStyle.y
                = circleOut.highlightStyle.y
                = pos[2];

            return setInterval(
                function() {
                    addShapeHandle(background);
                    addShapeHandle(circleOut);
                    pos[0] -= 0.3;
                    droplet.rotation = pos;
                    addShapeHandle(droplet);
                    addShapeHandle(circleIn);
                    addShapeHandle(textShape);
                    refreshHandle();
                },
                effectOption.timeInterval
            );
        };

        return Whirling;
    }
);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL2xvYWRpbmdFZmZlY3QvV2hpcmxpbmcuanMiXSwic291cmNlc0NvbnRlbnQiOlsiXG5kZWZpbmUoXG4gICAgZnVuY3Rpb24gKHJlcXVpcmUpIHtcbiAgICAgICAgdmFyIEJhc2UgPSByZXF1aXJlKCcuL0Jhc2UnKTtcbiAgICAgICAgdmFyIHV0aWwgPSByZXF1aXJlKCcuLi90b29sL3V0aWwnKTtcbiAgICAgICAgdmFyIHpyQXJlYSA9IHJlcXVpcmUoJy4uL3Rvb2wvYXJlYScpO1xuICAgICAgICB2YXIgUmluZ1NoYXBlID0gcmVxdWlyZSgnLi4vc2hhcGUvUmluZycpO1xuICAgICAgICB2YXIgRHJvcGxldFNoYXBlID0gcmVxdWlyZSgnLi4vc2hhcGUvRHJvcGxldCcpO1xuICAgICAgICB2YXIgQ2lyY2xlU2hhcGUgPSByZXF1aXJlKCcuLi9zaGFwZS9DaXJjbGUnKTtcblxuICAgICAgICBmdW5jdGlvbiBXaGlybGluZyhvcHRpb25zKSB7XG4gICAgICAgICAgICBCYXNlLmNhbGwodGhpcywgb3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgdXRpbC5pbmhlcml0cyhXaGlybGluZywgQmFzZSk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOaXi+i9rOawtOa7tFxuICAgICAgICAgKiBcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGFkZFNoYXBlSGFuZGxlXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSByZWZyZXNoSGFuZGxlXG4gICAgICAgICAqL1xuICAgICAgICBXaGlybGluZy5wcm90b3R5cGUuX3N0YXJ0ID0gZnVuY3Rpb24gKGFkZFNoYXBlSGFuZGxlLCByZWZyZXNoSGFuZGxlKSB7XG4gICAgICAgICAgICB2YXIgb3B0aW9ucyA9IHV0aWwubWVyZ2UoXG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdGV4dFN0eWxlIDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3IgOiAnIzg4OCcsXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0QWxpZ24gOiAnc3RhcnQnXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmRDb2xvciA6ICdyZ2JhKDI1MCwgMjUwLCAyNTAsIDAuOCknXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHZhciB0ZXh0U2hhcGUgPSB0aGlzLmNyZWF0ZVRleHRTaGFwZShvcHRpb25zLnRleHRTdHlsZSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciB0ZXh0R2FwID0gMTA7XG4gICAgICAgICAgICB2YXIgdGV4dFdpZHRoID0genJBcmVhLmdldFRleHRXaWR0aChcbiAgICAgICAgICAgICAgICB0ZXh0U2hhcGUuaGlnaGxpZ2h0U3R5bGUudGV4dCwgdGV4dFNoYXBlLmhpZ2hsaWdodFN0eWxlLnRleHRGb250XG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgdmFyIHRleHRIZWlnaHQgPSB6ckFyZWEuZ2V0VGV4dEhlaWdodChcbiAgICAgICAgICAgICAgICB0ZXh0U2hhcGUuaGlnaGxpZ2h0U3R5bGUudGV4dCwgdGV4dFNoYXBlLmhpZ2hsaWdodFN0eWxlLnRleHRGb250XG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDnibnmlYjpu5jorqTphY3nva5cbiAgICAgICAgICAgIHZhciBlZmZlY3RPcHRpb24gPSB1dGlsLm1lcmdlKFxuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5lZmZlY3QgfHwge30sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICByIDogMTgsXG4gICAgICAgICAgICAgICAgICAgIGNvbG9ySW4gOiAnI2ZmZicsXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yT3V0IDogJyM1NTUnLFxuICAgICAgICAgICAgICAgICAgICBjb2xvcldoaXJsIDogJyM2Y2YnLFxuICAgICAgICAgICAgICAgICAgICB0aW1lSW50ZXJ2YWwgOiA1MFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBsb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oXG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLnRleHRTdHlsZSxcbiAgICAgICAgICAgICAgICB0ZXh0V2lkdGggKyB0ZXh0R2FwICsgZWZmZWN0T3B0aW9uLnIgKiAyLFxuICAgICAgICAgICAgICAgIE1hdGgubWF4KGVmZmVjdE9wdGlvbi5yICogMiwgdGV4dEhlaWdodClcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBlZmZlY3RPcHRpb24ueCA9IGxvY2F0aW9uLnggKyBlZmZlY3RPcHRpb24ucjtcbiAgICAgICAgICAgIGVmZmVjdE9wdGlvbi55ID0gdGV4dFNoYXBlLmhpZ2hsaWdodFN0eWxlLnkgPSBsb2NhdGlvbi55ICsgbG9jYXRpb24uaGVpZ2h0IC8gMjtcbiAgICAgICAgICAgIHRleHRTaGFwZS5oaWdobGlnaHRTdHlsZS54ID0gZWZmZWN0T3B0aW9uLnggKyBlZmZlY3RPcHRpb24uciArIHRleHRHYXA7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBiYWNrZ3JvdW5kID0gdGhpcy5jcmVhdGVCYWNrZ3JvdW5kU2hhcGUob3B0aW9ucy5iYWNrZ3JvdW5kQ29sb3IpO1xuICAgICAgICAgICAgLy8g5Yid5aeL5YyW5Yqo55S75YWD57SgXG4gICAgICAgICAgICB2YXIgZHJvcGxldCA9IG5ldyBEcm9wbGV0U2hhcGUoe1xuICAgICAgICAgICAgICAgIGhpZ2hsaWdodFN0eWxlIDoge1xuICAgICAgICAgICAgICAgICAgICBhIDogTWF0aC5yb3VuZChlZmZlY3RPcHRpb24uciAvIDIpLFxuICAgICAgICAgICAgICAgICAgICBiIDogTWF0aC5yb3VuZChlZmZlY3RPcHRpb24uciAtIGVmZmVjdE9wdGlvbi5yIC8gNiksXG4gICAgICAgICAgICAgICAgICAgIGJydXNoVHlwZSA6ICdmaWxsJyxcbiAgICAgICAgICAgICAgICAgICAgY29sb3IgOiBlZmZlY3RPcHRpb24uY29sb3JXaGlybFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdmFyIGNpcmNsZUluID0gbmV3IENpcmNsZVNoYXBlKHtcbiAgICAgICAgICAgICAgICBoaWdobGlnaHRTdHlsZSA6IHtcbiAgICAgICAgICAgICAgICAgICAgciA6IE1hdGgucm91bmQoZWZmZWN0T3B0aW9uLnIgLyA2KSxcbiAgICAgICAgICAgICAgICAgICAgYnJ1c2hUeXBlIDogJ2ZpbGwnLFxuICAgICAgICAgICAgICAgICAgICBjb2xvciA6IGVmZmVjdE9wdGlvbi5jb2xvckluXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB2YXIgY2lyY2xlT3V0ID0gbmV3IFJpbmdTaGFwZSh7XG4gICAgICAgICAgICAgICAgaGlnaGxpZ2h0U3R5bGUgOiB7XG4gICAgICAgICAgICAgICAgICAgIHIwIDogTWF0aC5yb3VuZChlZmZlY3RPcHRpb24uciAtIGVmZmVjdE9wdGlvbi5yIC8gMyksXG4gICAgICAgICAgICAgICAgICAgIHIgOiBlZmZlY3RPcHRpb24ucixcbiAgICAgICAgICAgICAgICAgICAgYnJ1c2hUeXBlIDogJ2ZpbGwnLFxuICAgICAgICAgICAgICAgICAgICBjb2xvciA6IGVmZmVjdE9wdGlvbi5jb2xvck91dFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB2YXIgcG9zID0gWyAwLCBlZmZlY3RPcHRpb24ueCwgZWZmZWN0T3B0aW9uLnkgXTtcblxuICAgICAgICAgICAgZHJvcGxldC5oaWdobGlnaHRTdHlsZS54XG4gICAgICAgICAgICAgICAgPSBjaXJjbGVJbi5oaWdobGlnaHRTdHlsZS54XG4gICAgICAgICAgICAgICAgPSBjaXJjbGVPdXQuaGlnaGxpZ2h0U3R5bGUueFxuICAgICAgICAgICAgICAgID0gcG9zWzFdO1xuICAgICAgICAgICAgZHJvcGxldC5oaWdobGlnaHRTdHlsZS55XG4gICAgICAgICAgICAgICAgPSBjaXJjbGVJbi5oaWdobGlnaHRTdHlsZS55XG4gICAgICAgICAgICAgICAgPSBjaXJjbGVPdXQuaGlnaGxpZ2h0U3R5bGUueVxuICAgICAgICAgICAgICAgID0gcG9zWzJdO1xuXG4gICAgICAgICAgICByZXR1cm4gc2V0SW50ZXJ2YWwoXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGFkZFNoYXBlSGFuZGxlKGJhY2tncm91bmQpO1xuICAgICAgICAgICAgICAgICAgICBhZGRTaGFwZUhhbmRsZShjaXJjbGVPdXQpO1xuICAgICAgICAgICAgICAgICAgICBwb3NbMF0gLT0gMC4zO1xuICAgICAgICAgICAgICAgICAgICBkcm9wbGV0LnJvdGF0aW9uID0gcG9zO1xuICAgICAgICAgICAgICAgICAgICBhZGRTaGFwZUhhbmRsZShkcm9wbGV0KTtcbiAgICAgICAgICAgICAgICAgICAgYWRkU2hhcGVIYW5kbGUoY2lyY2xlSW4pO1xuICAgICAgICAgICAgICAgICAgICBhZGRTaGFwZUhhbmRsZSh0ZXh0U2hhcGUpO1xuICAgICAgICAgICAgICAgICAgICByZWZyZXNoSGFuZGxlKCk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlZmZlY3RPcHRpb24udGltZUludGVydmFsXG4gICAgICAgICAgICApO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBXaGlybGluZztcbiAgICB9XG4pO1xuIl0sImZpbGUiOiJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL2xvYWRpbmdFZmZlY3QvV2hpcmxpbmcuanMifQ==
