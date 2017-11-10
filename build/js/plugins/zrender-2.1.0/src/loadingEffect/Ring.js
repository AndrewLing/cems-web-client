
define(
    function (require) {
        var Base = require('./Base');
        var util = require('../tool/util');
        var zrColor = require('../tool/color');
        var RingShape = require('../shape/Ring');
        var SectorShape = require('../shape/Sector');

        function Ring(options) {
            Base.call(this, options);
        }
        util.inherits(Ring, Base);


        /**
         * 圆环
         * 
         * @param {Object} addShapeHandle
         * @param {Object} refreshHandle
         */
        Ring.prototype._start = function (addShapeHandle, refreshHandle) {
            
            // 特效默认配置
            var options = util.merge(
                this.options,
                {
                    textStyle : {
                        color : '#07a'
                    },
                    backgroundColor : 'rgba(250, 250, 250, 0.8)',
                    effect : {
                        x : this.canvasWidth / 2,
                        y : this.canvasHeight / 2,
                        r0 : 60,
                        r : 100,
                        color : '#bbdcff',
                        brushType: 'fill',
                        textPosition : 'inside',
                        textFont : 'normal 30px verdana',
                        textColor : 'rgba(30, 144, 255, 0.6)',
                        timeInterval : 100
                    }
                }
            );

            var effectOption = options.effect;

            var textStyle = options.textStyle;
            if (textStyle.x == null) {
                textStyle.x = effectOption.x;
            }
            if (textStyle.y == null) {
                textStyle.y = (effectOption.y + (effectOption.r0 + effectOption.r) / 2 - 5);
            }
            
            var textShape = this.createTextShape(options.textStyle);
            var background = this.createBackgroundShape(options.backgroundColor);

            var x = effectOption.x;
            var y = effectOption.y;
            var r0 = effectOption.r0 + 6;
            var r = effectOption.r - 6;
            var color = effectOption.color;
            var darkColor = zrColor.lift(color, 0.1);

            var shapeRing = new RingShape({
                highlightStyle : util.clone(effectOption)
            });

            // 初始化动画元素
            var shapeList = [];
            var clolrList = zrColor.getGradientColors(
                [ '#ff6400', '#ffe100', '#97ff00' ], 25
            );
            var preAngle = 15;
            var endAngle = 240;

            for (var i = 0; i < 16; i++) {
                shapeList.push(new SectorShape({
                    highlightStyle  : {
                        x : x,
                        y : y,
                        r0 : r0,
                        r : r,
                        startAngle : endAngle - preAngle,
                        endAngle : endAngle,
                        brushType: 'fill',
                        color : darkColor
                    },
                    _color : zrColor.getLinearGradient(
                        x + r0 * Math.cos(endAngle, true),
                        y - r0 * Math.sin(endAngle, true),
                        x + r0 * Math.cos(endAngle - preAngle, true),
                        y - r0 * Math.sin(endAngle - preAngle, true),
                        [
                            [ 0, clolrList[i * 2] ],
                            [ 1, clolrList[i * 2 + 1] ]
                        ]
                    )
                }));
                endAngle -= preAngle;
            }
            endAngle = 360;
            for (var i = 0; i < 4; i++) {
                shapeList.push(new SectorShape({
                    highlightStyle  : {
                        x : x,
                        y : y,
                        r0 : r0,
                        r : r,
                        startAngle : endAngle - preAngle,
                        endAngle : endAngle,
                        brushType: 'fill',
                        color : darkColor
                    },
                    _color : zrColor.getLinearGradient(
                        x + r0 * Math.cos(endAngle, true),
                        y - r0 * Math.sin(endAngle, true),
                        x + r0 * Math.cos(endAngle - preAngle, true),
                        y - r0 * Math.sin(endAngle - preAngle, true),
                        [
                            [ 0, clolrList[i * 2 + 32] ],
                            [ 1, clolrList[i * 2 + 33] ]
                        ]
                    )
                }));
                endAngle -= preAngle;
            }

            var n = 0;
            if (options.progress != null) {
                // 指定进度
                addShapeHandle(background);

                n = this.adjust(options.progress, [ 0, 1 ]).toFixed(2) * 100 / 5;
                shapeRing.highlightStyle.text = n * 5 + '%';
                addShapeHandle(shapeRing);

                for (var i = 0; i < 20; i++) {
                    shapeList[i].highlightStyle.color = i < n
                        ? shapeList[i]._color : darkColor;
                    addShapeHandle(shapeList[i]);
                }

                addShapeHandle(textShape);
                refreshHandle();
                return;
            }

            // 循环显示
            return setInterval(
                function() {
                    addShapeHandle(background);

                    n += n >= 20 ? -20 : 1;

                    // shapeRing.highlightStyle.text = n * 5 + '%';
                    addShapeHandle(shapeRing);

                    for (var i = 0; i < 20; i++) {
                        shapeList[i].highlightStyle.color = i < n
                            ? shapeList[i]._color : darkColor;
                        addShapeHandle(shapeList[i]);
                    }

                    addShapeHandle(textShape);
                    refreshHandle();
                },
                effectOption.timeInterval
            );
        };

        return Ring;
    }
);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL2xvYWRpbmdFZmZlY3QvUmluZy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJcbmRlZmluZShcbiAgICBmdW5jdGlvbiAocmVxdWlyZSkge1xuICAgICAgICB2YXIgQmFzZSA9IHJlcXVpcmUoJy4vQmFzZScpO1xuICAgICAgICB2YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3Rvb2wvdXRpbCcpO1xuICAgICAgICB2YXIgenJDb2xvciA9IHJlcXVpcmUoJy4uL3Rvb2wvY29sb3InKTtcbiAgICAgICAgdmFyIFJpbmdTaGFwZSA9IHJlcXVpcmUoJy4uL3NoYXBlL1JpbmcnKTtcbiAgICAgICAgdmFyIFNlY3RvclNoYXBlID0gcmVxdWlyZSgnLi4vc2hhcGUvU2VjdG9yJyk7XG5cbiAgICAgICAgZnVuY3Rpb24gUmluZyhvcHRpb25zKSB7XG4gICAgICAgICAgICBCYXNlLmNhbGwodGhpcywgb3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgdXRpbC5pbmhlcml0cyhSaW5nLCBCYXNlKTtcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDlnIbnjq9cbiAgICAgICAgICogXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBhZGRTaGFwZUhhbmRsZVxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gcmVmcmVzaEhhbmRsZVxuICAgICAgICAgKi9cbiAgICAgICAgUmluZy5wcm90b3R5cGUuX3N0YXJ0ID0gZnVuY3Rpb24gKGFkZFNoYXBlSGFuZGxlLCByZWZyZXNoSGFuZGxlKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOeJueaViOm7mOiupOmFjee9rlxuICAgICAgICAgICAgdmFyIG9wdGlvbnMgPSB1dGlsLm1lcmdlKFxuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucyxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHRleHRTdHlsZSA6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yIDogJyMwN2EnXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmRDb2xvciA6ICdyZ2JhKDI1MCwgMjUwLCAyNTAsIDAuOCknLFxuICAgICAgICAgICAgICAgICAgICBlZmZlY3QgOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB4IDogdGhpcy5jYW52YXNXaWR0aCAvIDIsXG4gICAgICAgICAgICAgICAgICAgICAgICB5IDogdGhpcy5jYW52YXNIZWlnaHQgLyAyLFxuICAgICAgICAgICAgICAgICAgICAgICAgcjAgOiA2MCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHIgOiAxMDAsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvciA6ICcjYmJkY2ZmJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJydXNoVHlwZTogJ2ZpbGwnLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dFBvc2l0aW9uIDogJ2luc2lkZScsXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0Rm9udCA6ICdub3JtYWwgMzBweCB2ZXJkYW5hJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHRDb2xvciA6ICdyZ2JhKDMwLCAxNDQsIDI1NSwgMC42KScsXG4gICAgICAgICAgICAgICAgICAgICAgICB0aW1lSW50ZXJ2YWwgOiAxMDBcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHZhciBlZmZlY3RPcHRpb24gPSBvcHRpb25zLmVmZmVjdDtcblxuICAgICAgICAgICAgdmFyIHRleHRTdHlsZSA9IG9wdGlvbnMudGV4dFN0eWxlO1xuICAgICAgICAgICAgaWYgKHRleHRTdHlsZS54ID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0ZXh0U3R5bGUueCA9IGVmZmVjdE9wdGlvbi54O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRleHRTdHlsZS55ID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0ZXh0U3R5bGUueSA9IChlZmZlY3RPcHRpb24ueSArIChlZmZlY3RPcHRpb24ucjAgKyBlZmZlY3RPcHRpb24ucikgLyAyIC0gNSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciB0ZXh0U2hhcGUgPSB0aGlzLmNyZWF0ZVRleHRTaGFwZShvcHRpb25zLnRleHRTdHlsZSk7XG4gICAgICAgICAgICB2YXIgYmFja2dyb3VuZCA9IHRoaXMuY3JlYXRlQmFja2dyb3VuZFNoYXBlKG9wdGlvbnMuYmFja2dyb3VuZENvbG9yKTtcblxuICAgICAgICAgICAgdmFyIHggPSBlZmZlY3RPcHRpb24ueDtcbiAgICAgICAgICAgIHZhciB5ID0gZWZmZWN0T3B0aW9uLnk7XG4gICAgICAgICAgICB2YXIgcjAgPSBlZmZlY3RPcHRpb24ucjAgKyA2O1xuICAgICAgICAgICAgdmFyIHIgPSBlZmZlY3RPcHRpb24uciAtIDY7XG4gICAgICAgICAgICB2YXIgY29sb3IgPSBlZmZlY3RPcHRpb24uY29sb3I7XG4gICAgICAgICAgICB2YXIgZGFya0NvbG9yID0genJDb2xvci5saWZ0KGNvbG9yLCAwLjEpO1xuXG4gICAgICAgICAgICB2YXIgc2hhcGVSaW5nID0gbmV3IFJpbmdTaGFwZSh7XG4gICAgICAgICAgICAgICAgaGlnaGxpZ2h0U3R5bGUgOiB1dGlsLmNsb25lKGVmZmVjdE9wdGlvbilcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyDliJ3lp4vljJbliqjnlLvlhYPntKBcbiAgICAgICAgICAgIHZhciBzaGFwZUxpc3QgPSBbXTtcbiAgICAgICAgICAgIHZhciBjbG9sckxpc3QgPSB6ckNvbG9yLmdldEdyYWRpZW50Q29sb3JzKFxuICAgICAgICAgICAgICAgIFsgJyNmZjY0MDAnLCAnI2ZmZTEwMCcsICcjOTdmZjAwJyBdLCAyNVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHZhciBwcmVBbmdsZSA9IDE1O1xuICAgICAgICAgICAgdmFyIGVuZEFuZ2xlID0gMjQwO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDE2OyBpKyspIHtcbiAgICAgICAgICAgICAgICBzaGFwZUxpc3QucHVzaChuZXcgU2VjdG9yU2hhcGUoe1xuICAgICAgICAgICAgICAgICAgICBoaWdobGlnaHRTdHlsZSAgOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB4IDogeCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHkgOiB5LFxuICAgICAgICAgICAgICAgICAgICAgICAgcjAgOiByMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHIgOiByLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRBbmdsZSA6IGVuZEFuZ2xlIC0gcHJlQW5nbGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmRBbmdsZSA6IGVuZEFuZ2xlLFxuICAgICAgICAgICAgICAgICAgICAgICAgYnJ1c2hUeXBlOiAnZmlsbCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvciA6IGRhcmtDb2xvclxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBfY29sb3IgOiB6ckNvbG9yLmdldExpbmVhckdyYWRpZW50KFxuICAgICAgICAgICAgICAgICAgICAgICAgeCArIHIwICogTWF0aC5jb3MoZW5kQW5nbGUsIHRydWUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgeSAtIHIwICogTWF0aC5zaW4oZW5kQW5nbGUsIHRydWUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgeCArIHIwICogTWF0aC5jb3MoZW5kQW5nbGUgLSBwcmVBbmdsZSwgdHJ1ZSksXG4gICAgICAgICAgICAgICAgICAgICAgICB5IC0gcjAgKiBNYXRoLnNpbihlbmRBbmdsZSAtIHByZUFuZ2xlLCB0cnVlKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBbIDAsIGNsb2xyTGlzdFtpICogMl0gXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBbIDEsIGNsb2xyTGlzdFtpICogMiArIDFdIF1cbiAgICAgICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICBlbmRBbmdsZSAtPSBwcmVBbmdsZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVuZEFuZ2xlID0gMzYwO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgICAgICBzaGFwZUxpc3QucHVzaChuZXcgU2VjdG9yU2hhcGUoe1xuICAgICAgICAgICAgICAgICAgICBoaWdobGlnaHRTdHlsZSAgOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB4IDogeCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHkgOiB5LFxuICAgICAgICAgICAgICAgICAgICAgICAgcjAgOiByMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHIgOiByLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRBbmdsZSA6IGVuZEFuZ2xlIC0gcHJlQW5nbGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmRBbmdsZSA6IGVuZEFuZ2xlLFxuICAgICAgICAgICAgICAgICAgICAgICAgYnJ1c2hUeXBlOiAnZmlsbCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvciA6IGRhcmtDb2xvclxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBfY29sb3IgOiB6ckNvbG9yLmdldExpbmVhckdyYWRpZW50KFxuICAgICAgICAgICAgICAgICAgICAgICAgeCArIHIwICogTWF0aC5jb3MoZW5kQW5nbGUsIHRydWUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgeSAtIHIwICogTWF0aC5zaW4oZW5kQW5nbGUsIHRydWUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgeCArIHIwICogTWF0aC5jb3MoZW5kQW5nbGUgLSBwcmVBbmdsZSwgdHJ1ZSksXG4gICAgICAgICAgICAgICAgICAgICAgICB5IC0gcjAgKiBNYXRoLnNpbihlbmRBbmdsZSAtIHByZUFuZ2xlLCB0cnVlKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBbIDAsIGNsb2xyTGlzdFtpICogMiArIDMyXSBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFsgMSwgY2xvbHJMaXN0W2kgKiAyICsgMzNdIF1cbiAgICAgICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICBlbmRBbmdsZSAtPSBwcmVBbmdsZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIG4gPSAwO1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMucHJvZ3Jlc3MgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIC8vIOaMh+Wumui/m+W6plxuICAgICAgICAgICAgICAgIGFkZFNoYXBlSGFuZGxlKGJhY2tncm91bmQpO1xuXG4gICAgICAgICAgICAgICAgbiA9IHRoaXMuYWRqdXN0KG9wdGlvbnMucHJvZ3Jlc3MsIFsgMCwgMSBdKS50b0ZpeGVkKDIpICogMTAwIC8gNTtcbiAgICAgICAgICAgICAgICBzaGFwZVJpbmcuaGlnaGxpZ2h0U3R5bGUudGV4dCA9IG4gKiA1ICsgJyUnO1xuICAgICAgICAgICAgICAgIGFkZFNoYXBlSGFuZGxlKHNoYXBlUmluZyk7XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDIwOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgc2hhcGVMaXN0W2ldLmhpZ2hsaWdodFN0eWxlLmNvbG9yID0gaSA8IG5cbiAgICAgICAgICAgICAgICAgICAgICAgID8gc2hhcGVMaXN0W2ldLl9jb2xvciA6IGRhcmtDb2xvcjtcbiAgICAgICAgICAgICAgICAgICAgYWRkU2hhcGVIYW5kbGUoc2hhcGVMaXN0W2ldKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBhZGRTaGFwZUhhbmRsZSh0ZXh0U2hhcGUpO1xuICAgICAgICAgICAgICAgIHJlZnJlc2hIYW5kbGUoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOW+queOr+aYvuekulxuICAgICAgICAgICAgcmV0dXJuIHNldEludGVydmFsKFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBhZGRTaGFwZUhhbmRsZShiYWNrZ3JvdW5kKTtcblxuICAgICAgICAgICAgICAgICAgICBuICs9IG4gPj0gMjAgPyAtMjAgOiAxO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIHNoYXBlUmluZy5oaWdobGlnaHRTdHlsZS50ZXh0ID0gbiAqIDUgKyAnJSc7XG4gICAgICAgICAgICAgICAgICAgIGFkZFNoYXBlSGFuZGxlKHNoYXBlUmluZyk7XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAyMDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzaGFwZUxpc3RbaV0uaGlnaGxpZ2h0U3R5bGUuY29sb3IgPSBpIDwgblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gc2hhcGVMaXN0W2ldLl9jb2xvciA6IGRhcmtDb2xvcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFkZFNoYXBlSGFuZGxlKHNoYXBlTGlzdFtpXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBhZGRTaGFwZUhhbmRsZSh0ZXh0U2hhcGUpO1xuICAgICAgICAgICAgICAgICAgICByZWZyZXNoSGFuZGxlKCk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlZmZlY3RPcHRpb24udGltZUludGVydmFsXG4gICAgICAgICAgICApO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBSaW5nO1xuICAgIH1cbik7XG4iXSwiZmlsZSI6InBsdWdpbnMvenJlbmRlci0yLjEuMC9zcmMvbG9hZGluZ0VmZmVjdC9SaW5nLmpzIn0=
