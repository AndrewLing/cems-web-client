
define(
    function (require) {
        var Base = require(['./Base']);
        var util = require(['../tool/util']);
        var zrColor = require(['../tool/color']);
        var RectangleShape = require(['../shape/Rectangle']);

        function Bar(options) {
            Base.call(this, options);
        }
        util.inherits(Bar, Base);

        
        /**
         * 进度条
         * 
         * @param {Object} addShapeHandle
         * @param {Object} refreshHandle
         */
        Bar.prototype._start = function (addShapeHandle, refreshHandle) {
            // 特效默认配置
            var options = util.merge(
                this.options,
                {
                    textStyle : {
                        color : '#888'
                    },
                    backgroundColor : 'rgba(250, 250, 250, 0.8)',
                    effectOption : {
                        x : 0,
                        y : this.canvasHeight / 2 - 30,
                        width : this.canvasWidth,
                        height : 5,
                        brushType : 'fill',
                        timeInterval : 100
                    }
                }
            );

            var textShape = this.createTextShape(options.textStyle);
            var background = this.createBackgroundShape(options.backgroundColor);

            var effectOption = options.effectOption;

            // 初始化动画元素
            var barShape = new RectangleShape({
                highlightStyle : util.clone(effectOption)
            });

            barShape.highlightStyle.color =
                effectOption.color
                || zrColor.getLinearGradient(
                    effectOption.x,
                    effectOption.y,
                    effectOption.x + effectOption.width,
                    effectOption.y + effectOption.height,
                    [ [ 0, '#ff6400' ], [ 0.5, '#ffe100' ], [ 1, '#b1ff00' ] ]
                );

            if (options.progress != null) {
                // 指定进度
                addShapeHandle(background);

                barShape.highlightStyle.width =
                    this.adjust(options.progress, [ 0, 1 ])
                    * options.effectOption.width;
                    
                addShapeHandle(barShape);
                addShapeHandle(textShape);

                refreshHandle();
                return;
            }
            else {
                // 循环显示
                barShape.highlightStyle.width = 0;
                return setInterval(
                    function () {
                        addShapeHandle(background);

                        if (barShape.highlightStyle.width < effectOption.width) {
                            barShape.highlightStyle.width += 8;
                        }
                        else {
                            barShape.highlightStyle.width = 0;
                        }
                        addShapeHandle(barShape);
                        addShapeHandle(textShape);
                        refreshHandle();
                    },
                    effectOption.timeInterval
                );
            }
        };

        return Bar;
    }
);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL2xvYWRpbmdFZmZlY3QvQmFyLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIlxuZGVmaW5lKFxuICAgIGZ1bmN0aW9uIChyZXF1aXJlKSB7XG4gICAgICAgIHZhciBCYXNlID0gcmVxdWlyZShbJy4vQmFzZSddKTtcbiAgICAgICAgdmFyIHV0aWwgPSByZXF1aXJlKFsnLi4vdG9vbC91dGlsJ10pO1xuICAgICAgICB2YXIgenJDb2xvciA9IHJlcXVpcmUoWycuLi90b29sL2NvbG9yJ10pO1xuICAgICAgICB2YXIgUmVjdGFuZ2xlU2hhcGUgPSByZXF1aXJlKFsnLi4vc2hhcGUvUmVjdGFuZ2xlJ10pO1xuXG4gICAgICAgIGZ1bmN0aW9uIEJhcihvcHRpb25zKSB7XG4gICAgICAgICAgICBCYXNlLmNhbGwodGhpcywgb3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgdXRpbC5pbmhlcml0cyhCYXIsIEJhc2UpO1xuXG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgICog6L+b5bqm5p2hXG4gICAgICAgICAqIFxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYWRkU2hhcGVIYW5kbGVcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IHJlZnJlc2hIYW5kbGVcbiAgICAgICAgICovXG4gICAgICAgIEJhci5wcm90b3R5cGUuX3N0YXJ0ID0gZnVuY3Rpb24gKGFkZFNoYXBlSGFuZGxlLCByZWZyZXNoSGFuZGxlKSB7XG4gICAgICAgICAgICAvLyDnibnmlYjpu5jorqTphY3nva5cbiAgICAgICAgICAgIHZhciBvcHRpb25zID0gdXRpbC5tZXJnZShcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMsXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0ZXh0U3R5bGUgOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvciA6ICcjODg4J1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3IgOiAncmdiYSgyNTAsIDI1MCwgMjUwLCAwLjgpJyxcbiAgICAgICAgICAgICAgICAgICAgZWZmZWN0T3B0aW9uIDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgeCA6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICB5IDogdGhpcy5jYW52YXNIZWlnaHQgLyAyIC0gMzAsXG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCA6IHRoaXMuY2FudmFzV2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQgOiA1LFxuICAgICAgICAgICAgICAgICAgICAgICAgYnJ1c2hUeXBlIDogJ2ZpbGwnLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGltZUludGVydmFsIDogMTAwXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICB2YXIgdGV4dFNoYXBlID0gdGhpcy5jcmVhdGVUZXh0U2hhcGUob3B0aW9ucy50ZXh0U3R5bGUpO1xuICAgICAgICAgICAgdmFyIGJhY2tncm91bmQgPSB0aGlzLmNyZWF0ZUJhY2tncm91bmRTaGFwZShvcHRpb25zLmJhY2tncm91bmRDb2xvcik7XG5cbiAgICAgICAgICAgIHZhciBlZmZlY3RPcHRpb24gPSBvcHRpb25zLmVmZmVjdE9wdGlvbjtcblxuICAgICAgICAgICAgLy8g5Yid5aeL5YyW5Yqo55S75YWD57SgXG4gICAgICAgICAgICB2YXIgYmFyU2hhcGUgPSBuZXcgUmVjdGFuZ2xlU2hhcGUoe1xuICAgICAgICAgICAgICAgIGhpZ2hsaWdodFN0eWxlIDogdXRpbC5jbG9uZShlZmZlY3RPcHRpb24pXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgYmFyU2hhcGUuaGlnaGxpZ2h0U3R5bGUuY29sb3IgPVxuICAgICAgICAgICAgICAgIGVmZmVjdE9wdGlvbi5jb2xvclxuICAgICAgICAgICAgICAgIHx8IHpyQ29sb3IuZ2V0TGluZWFyR3JhZGllbnQoXG4gICAgICAgICAgICAgICAgICAgIGVmZmVjdE9wdGlvbi54LFxuICAgICAgICAgICAgICAgICAgICBlZmZlY3RPcHRpb24ueSxcbiAgICAgICAgICAgICAgICAgICAgZWZmZWN0T3B0aW9uLnggKyBlZmZlY3RPcHRpb24ud2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIGVmZmVjdE9wdGlvbi55ICsgZWZmZWN0T3B0aW9uLmhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgWyBbIDAsICcjZmY2NDAwJyBdLCBbIDAuNSwgJyNmZmUxMDAnIF0sIFsgMSwgJyNiMWZmMDAnIF0gXVxuICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIGlmIChvcHRpb25zLnByb2dyZXNzICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAvLyDmjIflrprov5vluqZcbiAgICAgICAgICAgICAgICBhZGRTaGFwZUhhbmRsZShiYWNrZ3JvdW5kKTtcblxuICAgICAgICAgICAgICAgIGJhclNoYXBlLmhpZ2hsaWdodFN0eWxlLndpZHRoID1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGp1c3Qob3B0aW9ucy5wcm9ncmVzcywgWyAwLCAxIF0pXG4gICAgICAgICAgICAgICAgICAgICogb3B0aW9ucy5lZmZlY3RPcHRpb24ud2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGFkZFNoYXBlSGFuZGxlKGJhclNoYXBlKTtcbiAgICAgICAgICAgICAgICBhZGRTaGFwZUhhbmRsZSh0ZXh0U2hhcGUpO1xuXG4gICAgICAgICAgICAgICAgcmVmcmVzaEhhbmRsZSgpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIOW+queOr+aYvuekulxuICAgICAgICAgICAgICAgIGJhclNoYXBlLmhpZ2hsaWdodFN0eWxlLndpZHRoID0gMDtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2V0SW50ZXJ2YWwoXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFkZFNoYXBlSGFuZGxlKGJhY2tncm91bmQpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYmFyU2hhcGUuaGlnaGxpZ2h0U3R5bGUud2lkdGggPCBlZmZlY3RPcHRpb24ud2lkdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYXJTaGFwZS5oaWdobGlnaHRTdHlsZS53aWR0aCArPSA4O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFyU2hhcGUuaGlnaGxpZ2h0U3R5bGUud2lkdGggPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYWRkU2hhcGVIYW5kbGUoYmFyU2hhcGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYWRkU2hhcGVIYW5kbGUodGV4dFNoYXBlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZnJlc2hIYW5kbGUoKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgZWZmZWN0T3B0aW9uLnRpbWVJbnRlcnZhbFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIEJhcjtcbiAgICB9XG4pO1xuIl0sImZpbGUiOiJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL2xvYWRpbmdFZmZlY3QvQmFyLmpzIn0=
