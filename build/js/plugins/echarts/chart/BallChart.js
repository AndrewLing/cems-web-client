(function ($) {

    $.addBall = function (t, options) {
        /**
         * <p>目前支持主题：
         * default、fresh
         * </p>
         */
        var theme = {
            'default': {
                foregroundColor: '#1BB236',   // 前景色
                backgroundColor: '#BABABA',   // 背景色
                borderColor: 'transparent',   // 边框颜色
                fontColor: '#FFFFFF',         // 显示文字颜色
                expectColor: '#222222'        // 期望值文本颜色
            },
            'fresh': {
                noTop: true,
                foregroundColor: 'url(/images/plants/d_ball_fg.png) center 0px / 120% no-repeat',
                backgroundColor: 'transparent',
                borderColor: '#2FAF6B',
                fontColor: '#FFFFFF',
                expectColor: '#FFFFFF'
            }
        };

        var p = $.extend(theme[options.theme || 'default'], {
            label: false,                 // 标签
            isExpect: false,              // 是否显示期望值
            expect: 0,                    // 期望值（单位 %）
            rate: 0,                      // 百分比（单位 %）
            radius: false,                // 半径（默认为false，表示自动适应父元素大小变化，设置半径为大于0的数字后不能自动适应父元素大小变化）
            smaller: false,               // 大小约束（width:根据宽，height:根据高）
            speed: 1200                   // 动画快慢（单位 ms）
        }, options);
        /**
         * 函数集合
         */
        var b = {
            /**
             * 插件执行函数入口
             */
            work: function () {
                b.init();
                b.getRadius();
                b.createBall();
                b.createBallShadow();
                b.createRateText();
                b.createForeground();
                !p.noTop && b.createBallTop();
                p.isExpect && b.createExpect();
                p.label && b.createLabel();
                b.initData();
            },
            init: function () {
                p.selector = $(t).attr('id');
                p.ballChart = p.selector + 'BallChart';
                p.ballContainer = p.selector + 'Ball';
                p.ballShadowID = p.selector + 'BallChartShadow';
                p.foregroundID = p.selector + 'BallChartForeground';
                p.ballTopID = p.selector + 'BallChartTop';
                p.rateTextID = p.selector + 'BallChartRateText';
                p.expectID = p.selector + 'BallChartExpect';
                p.labelID = p.selector + 'BallChartLabel';
            },
            getRadius: function () {
                var r = 0;
                if (p.radius && !(isNaN(p.radius) && p.radius > 0)) {
                    r = p.radius;
                } else {
                    p.width = $(t).parent().width();
                    p.height = $(t).parent().height();
                    if (p.width && p.height) {
                        if (parseInt(p.width) > parseInt(p.height)) {
                            p.smaller = 'height';
                            r = parseInt(p.height) / 2;
                        } else {
                            p.smaller = 'width';
                            r = parseInt(p.width) / 2;
                        }
                    } else {
                        r = 38;
                    }
                }
                p.diameter = r * 2;
                p.topHeight = r / 4;
            },
            createBall: function () {
                $('div', $(t)).finish();
                $(t).empty();

                var div = $('<div/>').addClass('BallChart').attr('id', p.ballChart)
                    .css({'width': p.diameter, 'height': p.diameter, 'position': 'relative', 'z-index': 10});
                var container = $('<div/>').attr('id', p.ballContainer);
                container.css({
                    'z-index': 10, 'width': p.diameter, 'height': p.diameter, 'position': 'relative',
                    'border': '2px ' + p.borderColor + ' solid', 'overflow': 'hidden',
                    'background': p.backgroundColor, 'border-radius': '50%'
                });
                if (p.smaller) {
                    var left = Math.max(0, $(t).parent().width() - p.diameter) / 2;
                    var top = Math.max(0, $(t).parent().height() - p.diameter) / 2;
                    if (p.smaller == 'width') {
                        container.css({left: 0, 'top': top});
                    } else {
                        container.css({left: left, 'top': 0});
                    }
                }

                $(div).append(container);
                $(t).append(div);
            },
            createBallShadow: function () {
                if ($('#' + p.ballShadowID).length) {
                    $('#' + p.ballShadowID).remove();
                }
                var div = $('<div/>').addClass('BallChartShadow').attr('id', p.ballShadowID);
                div.css({
                    'z-index': 9, 'width': p.diameter + 2, 'height': p.diameter + 2,
                    'position': 'absolute', top: 0, left: 0,
                    'border-radius': '50%', 'box-shadow': 'inset 0 0 ' + (p.diameter / 2) + 'px rgba(0, 0, 0, .3)'
                });
                $('#' + p.ballContainer).append(div);
            },
            createForeground: function () {
                if ($('#' + p.foregroundID).length) {
                    $('#' + p.foregroundID).remove();
                }
                var foreground = $('<div/>').attr('id', p.foregroundID);
                foreground.css({
                    'z-index': 4, 'width': p.diameter, 'height': 0,
                    'position': 'absolute', bottom: 0, left: 0, 'background': p.foregroundColor
                });
                $('#' + p.ballContainer).append(foreground);
            },
            createBallTop: function () {
                if ($('#' + p.ballTopID).length) {
                    $('#' + p.ballTopID).remove();
                }
                var div = $('<div/>').addClass('BallChartTop').attr('id', p.ballTopID);
                div.css({
                    'z-index': 6, 'width': p.diameter, 'height': 0 - p.topHeight, 'background': p.foregroundColor,
                    'position': 'absolute', 'bottom': (p.diameter - p.topHeight / 2), left: 0,
                    'border-radius': '50%', 'box-shadow': 'inset 0 5px ' + p.topHeight + 'px rgba(255, 255, 255, .3)'
                });
                $('#' + p.ballContainer).append(div);
            },
            createRateText: function () {
                if ($('#' + p.rateTextID).length) {
                    $('#' + p.rateTextID).remove();
                }
                var div = $('<div/>').addClass('BallChartRateText').attr('id', p.rateTextID);
                var fontSize = p.fontSize ? p.fontSize : p.diameter / 6;
                div.css({
                    'z-index': 10, 'width': p.diameter, 'height': p.diameter,
                    'position': 'absolute', top: 0, left: 0,
                    'line-height': p.diameter + 'px',
                    'font-size': fontSize / 12 + 'em', 'color': p.fontColor, 'text-align': 'center'
                });
                $('#' + p.ballContainer).append(div);
            },
            createExpect: function () {
                if ($('#' + p.expectID).length) {
                    $('#' + p.expectID).remove();
                }

                var fontSize = p.fontSize ? p.fontSize : p.diameter / 12;

                var div = $('<div/>').addClass('BallChartExpect').attr('id', p.expectID);
                var v = $('<span/>').css({right: '105%', position: 'relative', 'font-weight': 'bolder'});
                div.css({
                    'z-index': 11, 'width': p.diameter, 'height': 0,
                    'position': 'absolute', bottom: 0, left: 0,
                    'line-height': 0, 'border-top': '1px dotted ' + p.expectColor || '#FFFFFF',
                    'font-size': fontSize / 12 + 'em', 'color': p.expectColor, 'text-align': 'right',
                    'opacity': 0.5
                });

                div.append(v);
                $('#' + p.ballChart).append(div);
            },
            createLabel: function () {
                if ($('#' + p.labelID).length) {
                    $('#' + p.labelID).remove();
                }
                var div = $('<div/>').addClass('BallChartLabel').attr('id', p.labelID);
                var fontSize = p.fontSize ? p.fontSize : p.diameter / 12;
                div.css({
                    'z-index': 12, 'width': (p.diameter / 4), 'height': (p.diameter / 4),
                    'position': 'absolute', top: (p.diameter / 20), right: (p.diameter / 20),
                    'line-height': (p.diameter / 4) + 'px', 'background': '#0E95EF',
                    'border-radius': '50%',
                    'font-size': fontSize / 12 + 'em', 'color': p.fontColor, 'text-align': 'center'
                });
                $('#' + p.ballChart).append(div);
            },
            initData: function () {
                $('#' + p.labelID).html(p.label);

                $('#' + p.rateTextID).html(p.rate + '%');
                var rate = parseFloat(p.rate) / 100;
                var height = p.diameter * (rate > 1 ? 1 : rate);
                $('#' + p.foregroundID).finish().css('height', 0).animate({
                    height: height + (p.noTop ? 5 : 0)
                }, p.speed);

                var expect = parseFloat(p.expect) / 100;
                var width = 2 * (Math.sqrt(1 - Math.pow(2 * Math.abs(expect - 0.5), 2)) * (p.diameter / 2)) - 2;
                width = width < p.diameter / 5 ? p.diameter / 5 : width;
                var left = (p.diameter - width) / 2;
                var bottom = p.diameter * expect;
                $('#' + p.expectID + ' span').html(p.expect + '%');
                $('#' + p.expectID).finish().css('width', 0).animate({
                    'width': width,
                    'bottom': bottom,
                    'left': left
                }, p.speed);

                b.initTop();
            },
            initTop: function () {
                var rate = parseFloat(p.rate) / 100;
                var width = 2 * (Math.sqrt(1 - Math.pow(2 * Math.abs(rate - 0.5), 2)) * (p.diameter / 2)) - 2;
                var height = ((0.5 - Math.abs(rate - 0.5)) * 2) * p.topHeight;
                if (height < 1) {
                    height = 0
                }
                var left = (p.diameter - width) / 2;
                var bottom = p.diameter * rate - height / 2;
                $('#' + p.ballTopID).finish().stop()
                    .css({
                        'width': 0,
                        'height': 0,
                        'bottom': bottom + height / 2,
                        'left': (p.diameter / 2)
                    }).delay(p.speed * 4 / 5)
                    .animate({
                        'width': width,
                        'height': height,
                        'bottom': bottom,
                        'left': left
                    }, p.speed);
            },
            resize: function () {
                $('div', $(t)).finish();
                b.getRadius();
                $(t).css({'width': p.diameter, 'height': p.diameter});
                if (p.smaller) {
                    var left = Math.max(0, $(t).parent().width() - p.diameter) / 2;
                    var top = Math.max(0, $(t).parent().height() - p.diameter) / 2;
                    if (p.smaller == 'width') {
                        $(t).css({left: 0, 'top': top});
                    } else {
                        $(t).css({left: left, 'top': 0});
                    }
                }
                $('#' + p.ballChart).css({'width': p.diameter, 'height': p.diameter});
                $('#' + p.ballContainer).css({'width': p.diameter, 'height': p.diameter});
                $('#' + p.ballShadowID).css({
                    'width': p.diameter, 'height': p.diameter,
                    'box-shadow': 'inset 0 0 ' + (p.diameter / 2) + 'px rgba(0, 0, 0, .3)'
                });
                $('#' + p.foregroundID).css({'width': p.diameter, 'height': 0});
                $('#' + p.ballTopID).css({
                    'width': p.diameter, 'height': 0 - p.topHeight,
                    'box-shadow': 'inset 0 5px ' + p.topHeight + 'px rgba(255, 255, 255, .3)'
                });

                var fontSize = p.fontSize ? p.fontSize : p.diameter / 6;
                $('#' + p.rateTextID).css({
                    'width': p.diameter, 'height': p.diameter,
                    'line-height': p.diameter + 'px', 'font-size': fontSize / 12 + 'em'
                });
                $('#' + p.expectID).css({'width': p.diameter, 'height': 0, 'font-size': fontSize / 24 + 'em'});
                $('#' + p.labelID).css({
                    'width': (p.diameter / 4), 'height': (p.diameter / 4),
                    'top': (p.diameter / 20), 'right': (p.diameter / 20),
                    'line-height': (p.diameter / 4) + 'px', 'font-size': fontSize / 24 + 'em'
                });

                b.initData();
            }
        };
        b.work();
        $(t).parent().resize(function () {
            setTimeout(function () {
                b.resize();
            }, 100);
        });
        t.ball = b;
        t.p = p;
        return t;
    };
    var docLoaded = false;
    $(document).ready(function () {
        docLoaded = true;
    });
    $.fn.BallChart = function (p) {
        return this.each(function () {
            if (!docLoaded) {
                $(this).hide();
                var t = this;
                $(document).ready(function () {
                    $.addBall(t, p);
                });
            } else {
                $.addBall(this, p);
            }
        });
    };
    $.fn.BallChartRefresh = function (p) {
        return this.each(function () {
            if (p) {
                $.extend(this.p, p);
            } else {
                this.p.rate = 0;
                this.p.expect = 0;
            }
            if (this.ball) this.ball.initData();
        });
    };
    $.fn.BallChartOptions = function (p) {
        return this.each(function () {
            if (this.ball) $.extend(this.p, p);
        });
    };

})(jQuery);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL2VjaGFydHMvY2hhcnQvQmFsbENoYXJ0LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiAoJCkge1xuXG4gICAgJC5hZGRCYWxsID0gZnVuY3Rpb24gKHQsIG9wdGlvbnMpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIDxwPuebruWJjeaUr+aMgeS4u+mimO+8mlxuICAgICAgICAgKiBkZWZhdWx044CBZnJlc2hcbiAgICAgICAgICogPC9wPlxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIHRoZW1lID0ge1xuICAgICAgICAgICAgJ2RlZmF1bHQnOiB7XG4gICAgICAgICAgICAgICAgZm9yZWdyb3VuZENvbG9yOiAnIzFCQjIzNicsICAgLy8g5YmN5pmv6ImyXG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAnI0JBQkFCQScsICAgLy8g6IOM5pmv6ImyXG4gICAgICAgICAgICAgICAgYm9yZGVyQ29sb3I6ICd0cmFuc3BhcmVudCcsICAgLy8g6L655qGG6aKc6ImyXG4gICAgICAgICAgICAgICAgZm9udENvbG9yOiAnI0ZGRkZGRicsICAgICAgICAgLy8g5pi+56S65paH5a2X6aKc6ImyXG4gICAgICAgICAgICAgICAgZXhwZWN0Q29sb3I6ICcjMjIyMjIyJyAgICAgICAgLy8g5pyf5pyb5YC85paH5pys6aKc6ImyXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgJ2ZyZXNoJzoge1xuICAgICAgICAgICAgICAgIG5vVG9wOiB0cnVlLFxuICAgICAgICAgICAgICAgIGZvcmVncm91bmRDb2xvcjogJ3VybCgvaW1hZ2VzL3BsYW50cy9kX2JhbGxfZmcucG5nKSBjZW50ZXIgMHB4IC8gMTIwJSBuby1yZXBlYXQnLFxuICAgICAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogJ3RyYW5zcGFyZW50JyxcbiAgICAgICAgICAgICAgICBib3JkZXJDb2xvcjogJyMyRkFGNkInLFxuICAgICAgICAgICAgICAgIGZvbnRDb2xvcjogJyNGRkZGRkYnLFxuICAgICAgICAgICAgICAgIGV4cGVjdENvbG9yOiAnI0ZGRkZGRidcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgcCA9ICQuZXh0ZW5kKHRoZW1lW29wdGlvbnMudGhlbWUgfHwgJ2RlZmF1bHQnXSwge1xuICAgICAgICAgICAgbGFiZWw6IGZhbHNlLCAgICAgICAgICAgICAgICAgLy8g5qCH562+XG4gICAgICAgICAgICBpc0V4cGVjdDogZmFsc2UsICAgICAgICAgICAgICAvLyDmmK/lkKbmmL7npLrmnJ/mnJvlgLxcbiAgICAgICAgICAgIGV4cGVjdDogMCwgICAgICAgICAgICAgICAgICAgIC8vIOacn+acm+WAvO+8iOWNleS9jSAl77yJXG4gICAgICAgICAgICByYXRlOiAwLCAgICAgICAgICAgICAgICAgICAgICAvLyDnmb7liIbmr5TvvIjljZXkvY0gJe+8iVxuICAgICAgICAgICAgcmFkaXVzOiBmYWxzZSwgICAgICAgICAgICAgICAgLy8g5Y2K5b6E77yI6buY6K6k5Li6ZmFsc2XvvIzooajnpLroh6rliqjpgILlupTniLblhYPntKDlpKflsI/lj5jljJbvvIzorr7nva7ljYrlvoTkuLrlpKfkuo4w55qE5pWw5a2X5ZCO5LiN6IO96Ieq5Yqo6YCC5bqU54i25YWD57Sg5aSn5bCP5Y+Y5YyW77yJXG4gICAgICAgICAgICBzbWFsbGVyOiBmYWxzZSwgICAgICAgICAgICAgICAvLyDlpKflsI/nuqbmnZ/vvIh3aWR0aDrmoLnmja7lrr3vvIxoZWlnaHQ65qC55o2u6auY77yJXG4gICAgICAgICAgICBzcGVlZDogMTIwMCAgICAgICAgICAgICAgICAgICAvLyDliqjnlLvlv6vmhaLvvIjljZXkvY0gbXPvvIlcbiAgICAgICAgfSwgb3B0aW9ucyk7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiDlh73mlbDpm4blkIhcbiAgICAgICAgICovXG4gICAgICAgIHZhciBiID0ge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDmj5Lku7bmiafooYzlh73mlbDlhaXlj6NcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgd29yazogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGIuaW5pdCgpO1xuICAgICAgICAgICAgICAgIGIuZ2V0UmFkaXVzKCk7XG4gICAgICAgICAgICAgICAgYi5jcmVhdGVCYWxsKCk7XG4gICAgICAgICAgICAgICAgYi5jcmVhdGVCYWxsU2hhZG93KCk7XG4gICAgICAgICAgICAgICAgYi5jcmVhdGVSYXRlVGV4dCgpO1xuICAgICAgICAgICAgICAgIGIuY3JlYXRlRm9yZWdyb3VuZCgpO1xuICAgICAgICAgICAgICAgICFwLm5vVG9wICYmIGIuY3JlYXRlQmFsbFRvcCgpO1xuICAgICAgICAgICAgICAgIHAuaXNFeHBlY3QgJiYgYi5jcmVhdGVFeHBlY3QoKTtcbiAgICAgICAgICAgICAgICBwLmxhYmVsICYmIGIuY3JlYXRlTGFiZWwoKTtcbiAgICAgICAgICAgICAgICBiLmluaXREYXRhKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHAuc2VsZWN0b3IgPSAkKHQpLmF0dHIoJ2lkJyk7XG4gICAgICAgICAgICAgICAgcC5iYWxsQ2hhcnQgPSBwLnNlbGVjdG9yICsgJ0JhbGxDaGFydCc7XG4gICAgICAgICAgICAgICAgcC5iYWxsQ29udGFpbmVyID0gcC5zZWxlY3RvciArICdCYWxsJztcbiAgICAgICAgICAgICAgICBwLmJhbGxTaGFkb3dJRCA9IHAuc2VsZWN0b3IgKyAnQmFsbENoYXJ0U2hhZG93JztcbiAgICAgICAgICAgICAgICBwLmZvcmVncm91bmRJRCA9IHAuc2VsZWN0b3IgKyAnQmFsbENoYXJ0Rm9yZWdyb3VuZCc7XG4gICAgICAgICAgICAgICAgcC5iYWxsVG9wSUQgPSBwLnNlbGVjdG9yICsgJ0JhbGxDaGFydFRvcCc7XG4gICAgICAgICAgICAgICAgcC5yYXRlVGV4dElEID0gcC5zZWxlY3RvciArICdCYWxsQ2hhcnRSYXRlVGV4dCc7XG4gICAgICAgICAgICAgICAgcC5leHBlY3RJRCA9IHAuc2VsZWN0b3IgKyAnQmFsbENoYXJ0RXhwZWN0JztcbiAgICAgICAgICAgICAgICBwLmxhYmVsSUQgPSBwLnNlbGVjdG9yICsgJ0JhbGxDaGFydExhYmVsJztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRSYWRpdXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgciA9IDA7XG4gICAgICAgICAgICAgICAgaWYgKHAucmFkaXVzICYmICEoaXNOYU4ocC5yYWRpdXMpICYmIHAucmFkaXVzID4gMCkpIHtcbiAgICAgICAgICAgICAgICAgICAgciA9IHAucmFkaXVzO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHAud2lkdGggPSAkKHQpLnBhcmVudCgpLndpZHRoKCk7XG4gICAgICAgICAgICAgICAgICAgIHAuaGVpZ2h0ID0gJCh0KS5wYXJlbnQoKS5oZWlnaHQoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHAud2lkdGggJiYgcC5oZWlnaHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXJzZUludChwLndpZHRoKSA+IHBhcnNlSW50KHAuaGVpZ2h0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHAuc21hbGxlciA9ICdoZWlnaHQnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHIgPSBwYXJzZUludChwLmhlaWdodCkgLyAyO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwLnNtYWxsZXIgPSAnd2lkdGgnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHIgPSBwYXJzZUludChwLndpZHRoKSAvIDI7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByID0gMzg7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcC5kaWFtZXRlciA9IHIgKiAyO1xuICAgICAgICAgICAgICAgIHAudG9wSGVpZ2h0ID0gciAvIDQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlQmFsbDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICQoJ2RpdicsICQodCkpLmZpbmlzaCgpO1xuICAgICAgICAgICAgICAgICQodCkuZW1wdHkoKTtcblxuICAgICAgICAgICAgICAgIHZhciBkaXYgPSAkKCc8ZGl2Lz4nKS5hZGRDbGFzcygnQmFsbENoYXJ0JykuYXR0cignaWQnLCBwLmJhbGxDaGFydClcbiAgICAgICAgICAgICAgICAgICAgLmNzcyh7J3dpZHRoJzogcC5kaWFtZXRlciwgJ2hlaWdodCc6IHAuZGlhbWV0ZXIsICdwb3NpdGlvbic6ICdyZWxhdGl2ZScsICd6LWluZGV4JzogMTB9KTtcbiAgICAgICAgICAgICAgICB2YXIgY29udGFpbmVyID0gJCgnPGRpdi8+JykuYXR0cignaWQnLCBwLmJhbGxDb250YWluZXIpO1xuICAgICAgICAgICAgICAgIGNvbnRhaW5lci5jc3Moe1xuICAgICAgICAgICAgICAgICAgICAnei1pbmRleCc6IDEwLCAnd2lkdGgnOiBwLmRpYW1ldGVyLCAnaGVpZ2h0JzogcC5kaWFtZXRlciwgJ3Bvc2l0aW9uJzogJ3JlbGF0aXZlJyxcbiAgICAgICAgICAgICAgICAgICAgJ2JvcmRlcic6ICcycHggJyArIHAuYm9yZGVyQ29sb3IgKyAnIHNvbGlkJywgJ292ZXJmbG93JzogJ2hpZGRlbicsXG4gICAgICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kJzogcC5iYWNrZ3JvdW5kQ29sb3IsICdib3JkZXItcmFkaXVzJzogJzUwJSdcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpZiAocC5zbWFsbGVyKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBsZWZ0ID0gTWF0aC5tYXgoMCwgJCh0KS5wYXJlbnQoKS53aWR0aCgpIC0gcC5kaWFtZXRlcikgLyAyO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdG9wID0gTWF0aC5tYXgoMCwgJCh0KS5wYXJlbnQoKS5oZWlnaHQoKSAtIHAuZGlhbWV0ZXIpIC8gMjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHAuc21hbGxlciA9PSAnd2lkdGgnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250YWluZXIuY3NzKHtsZWZ0OiAwLCAndG9wJzogdG9wfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250YWluZXIuY3NzKHtsZWZ0OiBsZWZ0LCAndG9wJzogMH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgJChkaXYpLmFwcGVuZChjb250YWluZXIpO1xuICAgICAgICAgICAgICAgICQodCkuYXBwZW5kKGRpdik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlQmFsbFNoYWRvdzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICgkKCcjJyArIHAuYmFsbFNoYWRvd0lEKS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgJCgnIycgKyBwLmJhbGxTaGFkb3dJRCkucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBkaXYgPSAkKCc8ZGl2Lz4nKS5hZGRDbGFzcygnQmFsbENoYXJ0U2hhZG93JykuYXR0cignaWQnLCBwLmJhbGxTaGFkb3dJRCk7XG4gICAgICAgICAgICAgICAgZGl2LmNzcyh7XG4gICAgICAgICAgICAgICAgICAgICd6LWluZGV4JzogOSwgJ3dpZHRoJzogcC5kaWFtZXRlciArIDIsICdoZWlnaHQnOiBwLmRpYW1ldGVyICsgMixcbiAgICAgICAgICAgICAgICAgICAgJ3Bvc2l0aW9uJzogJ2Fic29sdXRlJywgdG9wOiAwLCBsZWZ0OiAwLFxuICAgICAgICAgICAgICAgICAgICAnYm9yZGVyLXJhZGl1cyc6ICc1MCUnLCAnYm94LXNoYWRvdyc6ICdpbnNldCAwIDAgJyArIChwLmRpYW1ldGVyIC8gMikgKyAncHggcmdiYSgwLCAwLCAwLCAuMyknXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgJCgnIycgKyBwLmJhbGxDb250YWluZXIpLmFwcGVuZChkaXYpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZUZvcmVncm91bmQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoJCgnIycgKyBwLmZvcmVncm91bmRJRCkubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICQoJyMnICsgcC5mb3JlZ3JvdW5kSUQpLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgZm9yZWdyb3VuZCA9ICQoJzxkaXYvPicpLmF0dHIoJ2lkJywgcC5mb3JlZ3JvdW5kSUQpO1xuICAgICAgICAgICAgICAgIGZvcmVncm91bmQuY3NzKHtcbiAgICAgICAgICAgICAgICAgICAgJ3otaW5kZXgnOiA0LCAnd2lkdGgnOiBwLmRpYW1ldGVyLCAnaGVpZ2h0JzogMCxcbiAgICAgICAgICAgICAgICAgICAgJ3Bvc2l0aW9uJzogJ2Fic29sdXRlJywgYm90dG9tOiAwLCBsZWZ0OiAwLCAnYmFja2dyb3VuZCc6IHAuZm9yZWdyb3VuZENvbG9yXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgJCgnIycgKyBwLmJhbGxDb250YWluZXIpLmFwcGVuZChmb3JlZ3JvdW5kKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVCYWxsVG9wOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCQoJyMnICsgcC5iYWxsVG9wSUQpLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAkKCcjJyArIHAuYmFsbFRvcElEKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGRpdiA9ICQoJzxkaXYvPicpLmFkZENsYXNzKCdCYWxsQ2hhcnRUb3AnKS5hdHRyKCdpZCcsIHAuYmFsbFRvcElEKTtcbiAgICAgICAgICAgICAgICBkaXYuY3NzKHtcbiAgICAgICAgICAgICAgICAgICAgJ3otaW5kZXgnOiA2LCAnd2lkdGgnOiBwLmRpYW1ldGVyLCAnaGVpZ2h0JzogMCAtIHAudG9wSGVpZ2h0LCAnYmFja2dyb3VuZCc6IHAuZm9yZWdyb3VuZENvbG9yLFxuICAgICAgICAgICAgICAgICAgICAncG9zaXRpb24nOiAnYWJzb2x1dGUnLCAnYm90dG9tJzogKHAuZGlhbWV0ZXIgLSBwLnRvcEhlaWdodCAvIDIpLCBsZWZ0OiAwLFxuICAgICAgICAgICAgICAgICAgICAnYm9yZGVyLXJhZGl1cyc6ICc1MCUnLCAnYm94LXNoYWRvdyc6ICdpbnNldCAwIDVweCAnICsgcC50b3BIZWlnaHQgKyAncHggcmdiYSgyNTUsIDI1NSwgMjU1LCAuMyknXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgJCgnIycgKyBwLmJhbGxDb250YWluZXIpLmFwcGVuZChkaXYpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZVJhdGVUZXh0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCQoJyMnICsgcC5yYXRlVGV4dElEKS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgJCgnIycgKyBwLnJhdGVUZXh0SUQpLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgZGl2ID0gJCgnPGRpdi8+JykuYWRkQ2xhc3MoJ0JhbGxDaGFydFJhdGVUZXh0JykuYXR0cignaWQnLCBwLnJhdGVUZXh0SUQpO1xuICAgICAgICAgICAgICAgIHZhciBmb250U2l6ZSA9IHAuZm9udFNpemUgPyBwLmZvbnRTaXplIDogcC5kaWFtZXRlciAvIDY7XG4gICAgICAgICAgICAgICAgZGl2LmNzcyh7XG4gICAgICAgICAgICAgICAgICAgICd6LWluZGV4JzogMTAsICd3aWR0aCc6IHAuZGlhbWV0ZXIsICdoZWlnaHQnOiBwLmRpYW1ldGVyLFxuICAgICAgICAgICAgICAgICAgICAncG9zaXRpb24nOiAnYWJzb2x1dGUnLCB0b3A6IDAsIGxlZnQ6IDAsXG4gICAgICAgICAgICAgICAgICAgICdsaW5lLWhlaWdodCc6IHAuZGlhbWV0ZXIgKyAncHgnLFxuICAgICAgICAgICAgICAgICAgICAnZm9udC1zaXplJzogZm9udFNpemUgLyAxMiArICdlbScsICdjb2xvcic6IHAuZm9udENvbG9yLCAndGV4dC1hbGlnbic6ICdjZW50ZXInXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgJCgnIycgKyBwLmJhbGxDb250YWluZXIpLmFwcGVuZChkaXYpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZUV4cGVjdDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICgkKCcjJyArIHAuZXhwZWN0SUQpLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAkKCcjJyArIHAuZXhwZWN0SUQpLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBmb250U2l6ZSA9IHAuZm9udFNpemUgPyBwLmZvbnRTaXplIDogcC5kaWFtZXRlciAvIDEyO1xuXG4gICAgICAgICAgICAgICAgdmFyIGRpdiA9ICQoJzxkaXYvPicpLmFkZENsYXNzKCdCYWxsQ2hhcnRFeHBlY3QnKS5hdHRyKCdpZCcsIHAuZXhwZWN0SUQpO1xuICAgICAgICAgICAgICAgIHZhciB2ID0gJCgnPHNwYW4vPicpLmNzcyh7cmlnaHQ6ICcxMDUlJywgcG9zaXRpb246ICdyZWxhdGl2ZScsICdmb250LXdlaWdodCc6ICdib2xkZXInfSk7XG4gICAgICAgICAgICAgICAgZGl2LmNzcyh7XG4gICAgICAgICAgICAgICAgICAgICd6LWluZGV4JzogMTEsICd3aWR0aCc6IHAuZGlhbWV0ZXIsICdoZWlnaHQnOiAwLFxuICAgICAgICAgICAgICAgICAgICAncG9zaXRpb24nOiAnYWJzb2x1dGUnLCBib3R0b206IDAsIGxlZnQ6IDAsXG4gICAgICAgICAgICAgICAgICAgICdsaW5lLWhlaWdodCc6IDAsICdib3JkZXItdG9wJzogJzFweCBkb3R0ZWQgJyArIHAuZXhwZWN0Q29sb3IgfHwgJyNGRkZGRkYnLFxuICAgICAgICAgICAgICAgICAgICAnZm9udC1zaXplJzogZm9udFNpemUgLyAxMiArICdlbScsICdjb2xvcic6IHAuZXhwZWN0Q29sb3IsICd0ZXh0LWFsaWduJzogJ3JpZ2h0JyxcbiAgICAgICAgICAgICAgICAgICAgJ29wYWNpdHknOiAwLjVcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGRpdi5hcHBlbmQodik7XG4gICAgICAgICAgICAgICAgJCgnIycgKyBwLmJhbGxDaGFydCkuYXBwZW5kKGRpdik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlTGFiZWw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoJCgnIycgKyBwLmxhYmVsSUQpLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAkKCcjJyArIHAubGFiZWxJRCkucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBkaXYgPSAkKCc8ZGl2Lz4nKS5hZGRDbGFzcygnQmFsbENoYXJ0TGFiZWwnKS5hdHRyKCdpZCcsIHAubGFiZWxJRCk7XG4gICAgICAgICAgICAgICAgdmFyIGZvbnRTaXplID0gcC5mb250U2l6ZSA/IHAuZm9udFNpemUgOiBwLmRpYW1ldGVyIC8gMTI7XG4gICAgICAgICAgICAgICAgZGl2LmNzcyh7XG4gICAgICAgICAgICAgICAgICAgICd6LWluZGV4JzogMTIsICd3aWR0aCc6IChwLmRpYW1ldGVyIC8gNCksICdoZWlnaHQnOiAocC5kaWFtZXRlciAvIDQpLFxuICAgICAgICAgICAgICAgICAgICAncG9zaXRpb24nOiAnYWJzb2x1dGUnLCB0b3A6IChwLmRpYW1ldGVyIC8gMjApLCByaWdodDogKHAuZGlhbWV0ZXIgLyAyMCksXG4gICAgICAgICAgICAgICAgICAgICdsaW5lLWhlaWdodCc6IChwLmRpYW1ldGVyIC8gNCkgKyAncHgnLCAnYmFja2dyb3VuZCc6ICcjMEU5NUVGJyxcbiAgICAgICAgICAgICAgICAgICAgJ2JvcmRlci1yYWRpdXMnOiAnNTAlJyxcbiAgICAgICAgICAgICAgICAgICAgJ2ZvbnQtc2l6ZSc6IGZvbnRTaXplIC8gMTIgKyAnZW0nLCAnY29sb3InOiBwLmZvbnRDb2xvciwgJ3RleHQtYWxpZ24nOiAnY2VudGVyJ1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICQoJyMnICsgcC5iYWxsQ2hhcnQpLmFwcGVuZChkaXYpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGluaXREYXRhOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgJCgnIycgKyBwLmxhYmVsSUQpLmh0bWwocC5sYWJlbCk7XG5cbiAgICAgICAgICAgICAgICAkKCcjJyArIHAucmF0ZVRleHRJRCkuaHRtbChwLnJhdGUgKyAnJScpO1xuICAgICAgICAgICAgICAgIHZhciByYXRlID0gcGFyc2VGbG9hdChwLnJhdGUpIC8gMTAwO1xuICAgICAgICAgICAgICAgIHZhciBoZWlnaHQgPSBwLmRpYW1ldGVyICogKHJhdGUgPiAxID8gMSA6IHJhdGUpO1xuICAgICAgICAgICAgICAgICQoJyMnICsgcC5mb3JlZ3JvdW5kSUQpLmZpbmlzaCgpLmNzcygnaGVpZ2h0JywgMCkuYW5pbWF0ZSh7XG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0ICsgKHAubm9Ub3AgPyA1IDogMClcbiAgICAgICAgICAgICAgICB9LCBwLnNwZWVkKTtcblxuICAgICAgICAgICAgICAgIHZhciBleHBlY3QgPSBwYXJzZUZsb2F0KHAuZXhwZWN0KSAvIDEwMDtcbiAgICAgICAgICAgICAgICB2YXIgd2lkdGggPSAyICogKE1hdGguc3FydCgxIC0gTWF0aC5wb3coMiAqIE1hdGguYWJzKGV4cGVjdCAtIDAuNSksIDIpKSAqIChwLmRpYW1ldGVyIC8gMikpIC0gMjtcbiAgICAgICAgICAgICAgICB3aWR0aCA9IHdpZHRoIDwgcC5kaWFtZXRlciAvIDUgPyBwLmRpYW1ldGVyIC8gNSA6IHdpZHRoO1xuICAgICAgICAgICAgICAgIHZhciBsZWZ0ID0gKHAuZGlhbWV0ZXIgLSB3aWR0aCkgLyAyO1xuICAgICAgICAgICAgICAgIHZhciBib3R0b20gPSBwLmRpYW1ldGVyICogZXhwZWN0O1xuICAgICAgICAgICAgICAgICQoJyMnICsgcC5leHBlY3RJRCArICcgc3BhbicpLmh0bWwocC5leHBlY3QgKyAnJScpO1xuICAgICAgICAgICAgICAgICQoJyMnICsgcC5leHBlY3RJRCkuZmluaXNoKCkuY3NzKCd3aWR0aCcsIDApLmFuaW1hdGUoe1xuICAgICAgICAgICAgICAgICAgICAnd2lkdGgnOiB3aWR0aCxcbiAgICAgICAgICAgICAgICAgICAgJ2JvdHRvbSc6IGJvdHRvbSxcbiAgICAgICAgICAgICAgICAgICAgJ2xlZnQnOiBsZWZ0XG4gICAgICAgICAgICAgICAgfSwgcC5zcGVlZCk7XG5cbiAgICAgICAgICAgICAgICBiLmluaXRUb3AoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbml0VG9wOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJhdGUgPSBwYXJzZUZsb2F0KHAucmF0ZSkgLyAxMDA7XG4gICAgICAgICAgICAgICAgdmFyIHdpZHRoID0gMiAqIChNYXRoLnNxcnQoMSAtIE1hdGgucG93KDIgKiBNYXRoLmFicyhyYXRlIC0gMC41KSwgMikpICogKHAuZGlhbWV0ZXIgLyAyKSkgLSAyO1xuICAgICAgICAgICAgICAgIHZhciBoZWlnaHQgPSAoKDAuNSAtIE1hdGguYWJzKHJhdGUgLSAwLjUpKSAqIDIpICogcC50b3BIZWlnaHQ7XG4gICAgICAgICAgICAgICAgaWYgKGhlaWdodCA8IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ID0gMFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgbGVmdCA9IChwLmRpYW1ldGVyIC0gd2lkdGgpIC8gMjtcbiAgICAgICAgICAgICAgICB2YXIgYm90dG9tID0gcC5kaWFtZXRlciAqIHJhdGUgLSBoZWlnaHQgLyAyO1xuICAgICAgICAgICAgICAgICQoJyMnICsgcC5iYWxsVG9wSUQpLmZpbmlzaCgpLnN0b3AoKVxuICAgICAgICAgICAgICAgICAgICAuY3NzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICd3aWR0aCc6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAnaGVpZ2h0JzogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICdib3R0b20nOiBib3R0b20gKyBoZWlnaHQgLyAyLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ2xlZnQnOiAocC5kaWFtZXRlciAvIDIpXG4gICAgICAgICAgICAgICAgICAgIH0pLmRlbGF5KHAuc3BlZWQgKiA0IC8gNSlcbiAgICAgICAgICAgICAgICAgICAgLmFuaW1hdGUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgJ3dpZHRoJzogd2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAnaGVpZ2h0JzogaGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAgICAgJ2JvdHRvbSc6IGJvdHRvbSxcbiAgICAgICAgICAgICAgICAgICAgICAgICdsZWZ0JzogbGVmdFxuICAgICAgICAgICAgICAgICAgICB9LCBwLnNwZWVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZXNpemU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAkKCdkaXYnLCAkKHQpKS5maW5pc2goKTtcbiAgICAgICAgICAgICAgICBiLmdldFJhZGl1cygpO1xuICAgICAgICAgICAgICAgICQodCkuY3NzKHsnd2lkdGgnOiBwLmRpYW1ldGVyLCAnaGVpZ2h0JzogcC5kaWFtZXRlcn0pO1xuICAgICAgICAgICAgICAgIGlmIChwLnNtYWxsZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxlZnQgPSBNYXRoLm1heCgwLCAkKHQpLnBhcmVudCgpLndpZHRoKCkgLSBwLmRpYW1ldGVyKSAvIDI7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0b3AgPSBNYXRoLm1heCgwLCAkKHQpLnBhcmVudCgpLmhlaWdodCgpIC0gcC5kaWFtZXRlcikgLyAyO1xuICAgICAgICAgICAgICAgICAgICBpZiAocC5zbWFsbGVyID09ICd3aWR0aCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQodCkuY3NzKHtsZWZ0OiAwLCAndG9wJzogdG9wfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKHQpLmNzcyh7bGVmdDogbGVmdCwgJ3RvcCc6IDB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAkKCcjJyArIHAuYmFsbENoYXJ0KS5jc3Moeyd3aWR0aCc6IHAuZGlhbWV0ZXIsICdoZWlnaHQnOiBwLmRpYW1ldGVyfSk7XG4gICAgICAgICAgICAgICAgJCgnIycgKyBwLmJhbGxDb250YWluZXIpLmNzcyh7J3dpZHRoJzogcC5kaWFtZXRlciwgJ2hlaWdodCc6IHAuZGlhbWV0ZXJ9KTtcbiAgICAgICAgICAgICAgICAkKCcjJyArIHAuYmFsbFNoYWRvd0lEKS5jc3Moe1xuICAgICAgICAgICAgICAgICAgICAnd2lkdGgnOiBwLmRpYW1ldGVyLCAnaGVpZ2h0JzogcC5kaWFtZXRlcixcbiAgICAgICAgICAgICAgICAgICAgJ2JveC1zaGFkb3cnOiAnaW5zZXQgMCAwICcgKyAocC5kaWFtZXRlciAvIDIpICsgJ3B4IHJnYmEoMCwgMCwgMCwgLjMpJ1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICQoJyMnICsgcC5mb3JlZ3JvdW5kSUQpLmNzcyh7J3dpZHRoJzogcC5kaWFtZXRlciwgJ2hlaWdodCc6IDB9KTtcbiAgICAgICAgICAgICAgICAkKCcjJyArIHAuYmFsbFRvcElEKS5jc3Moe1xuICAgICAgICAgICAgICAgICAgICAnd2lkdGgnOiBwLmRpYW1ldGVyLCAnaGVpZ2h0JzogMCAtIHAudG9wSGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAnYm94LXNoYWRvdyc6ICdpbnNldCAwIDVweCAnICsgcC50b3BIZWlnaHQgKyAncHggcmdiYSgyNTUsIDI1NSwgMjU1LCAuMyknXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICB2YXIgZm9udFNpemUgPSBwLmZvbnRTaXplID8gcC5mb250U2l6ZSA6IHAuZGlhbWV0ZXIgLyA2O1xuICAgICAgICAgICAgICAgICQoJyMnICsgcC5yYXRlVGV4dElEKS5jc3Moe1xuICAgICAgICAgICAgICAgICAgICAnd2lkdGgnOiBwLmRpYW1ldGVyLCAnaGVpZ2h0JzogcC5kaWFtZXRlcixcbiAgICAgICAgICAgICAgICAgICAgJ2xpbmUtaGVpZ2h0JzogcC5kaWFtZXRlciArICdweCcsICdmb250LXNpemUnOiBmb250U2l6ZSAvIDEyICsgJ2VtJ1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICQoJyMnICsgcC5leHBlY3RJRCkuY3NzKHsnd2lkdGgnOiBwLmRpYW1ldGVyLCAnaGVpZ2h0JzogMCwgJ2ZvbnQtc2l6ZSc6IGZvbnRTaXplIC8gMjQgKyAnZW0nfSk7XG4gICAgICAgICAgICAgICAgJCgnIycgKyBwLmxhYmVsSUQpLmNzcyh7XG4gICAgICAgICAgICAgICAgICAgICd3aWR0aCc6IChwLmRpYW1ldGVyIC8gNCksICdoZWlnaHQnOiAocC5kaWFtZXRlciAvIDQpLFxuICAgICAgICAgICAgICAgICAgICAndG9wJzogKHAuZGlhbWV0ZXIgLyAyMCksICdyaWdodCc6IChwLmRpYW1ldGVyIC8gMjApLFxuICAgICAgICAgICAgICAgICAgICAnbGluZS1oZWlnaHQnOiAocC5kaWFtZXRlciAvIDQpICsgJ3B4JywgJ2ZvbnQtc2l6ZSc6IGZvbnRTaXplIC8gMjQgKyAnZW0nXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBiLmluaXREYXRhKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGIud29yaygpO1xuICAgICAgICAkKHQpLnBhcmVudCgpLnJlc2l6ZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBiLnJlc2l6ZSgpO1xuICAgICAgICAgICAgfSwgMTAwKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHQuYmFsbCA9IGI7XG4gICAgICAgIHQucCA9IHA7XG4gICAgICAgIHJldHVybiB0O1xuICAgIH07XG4gICAgdmFyIGRvY0xvYWRlZCA9IGZhbHNlO1xuICAgICQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZG9jTG9hZGVkID0gdHJ1ZTtcbiAgICB9KTtcbiAgICAkLmZuLkJhbGxDaGFydCA9IGZ1bmN0aW9uIChwKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKCFkb2NMb2FkZWQpIHtcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmhpZGUoKTtcbiAgICAgICAgICAgICAgICB2YXIgdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAkLmFkZEJhbGwodCwgcCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICQuYWRkQmFsbCh0aGlzLCBwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICAkLmZuLkJhbGxDaGFydFJlZnJlc2ggPSBmdW5jdGlvbiAocCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChwKSB7XG4gICAgICAgICAgICAgICAgJC5leHRlbmQodGhpcy5wLCBwKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wLnJhdGUgPSAwO1xuICAgICAgICAgICAgICAgIHRoaXMucC5leHBlY3QgPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuYmFsbCkgdGhpcy5iYWxsLmluaXREYXRhKCk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgJC5mbi5CYWxsQ2hhcnRPcHRpb25zID0gZnVuY3Rpb24gKHApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5iYWxsKSAkLmV4dGVuZCh0aGlzLnAsIHApO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG59KShqUXVlcnkpOyJdLCJmaWxlIjoicGx1Z2lucy9lY2hhcnRzL2NoYXJ0L0JhbGxDaGFydC5qcyJ9
