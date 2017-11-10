/**
 * 使用方式实例：
 * // 生成并打开过渡遮罩效果层
 *
 *
 */
define(['jquery'], function ($) {
    $.fn.extend({
        /**
         * 生成并打开过渡遮罩效果层
         * @param options
         * @returns {*}
         */
        toggleLoading: function (options) {
            // 当前操作的元素
            var $this = $(this);
            // 找到遮罩层
            var crust = $(".x-loading", $this);
            // 实现toogle(切换遮罩层出现与消失)效果的判断方法
            if (crust.length > 0) {
                if (crust.is(":visible")) {
                    crust.fadeOut(500);
                } else {
                    crust.fadeIn(500);
                }
                return this;
            }
            // 扩展参数
            var op = $.extend({
                z: 9999,                                    //遮罩层层高
                msg: 'loading...',                          //提示信息
                iconUrl: '/images/loading.gif',             //图片
                width: 18,                                  //图标宽度
                height: 18,                                 //图标高度
                msgColor: '#fff',                          //消息文字颜色
                borderColor: '#ffffff',                     //消息边框颜色
                foregroundColor: "#429aff",                 //消息背景颜色
                backgroundColor: "#333333",                 //背景颜色
                opacity: 0.5,                               //透明度
                agentW: $this.outerWidth(),                 //遮罩层宽度
                agentH: $this.outerHeight()                 //遮罩层高度
            }, options);

            if ($this.css("position") == "static")
                $this.css("position", "relative");

            var w = op.agentW, h = op.agentH;
            // 外壳
            crust = $("<div></div>").css({
                'position': 'absolute',
                'z-index': op.z,
                'display': 'none',
                'width': w + 'px',
                'height': h + 'px',
                'text-align': 'center',
                'top': '0px',
                'border': 'none',
                'left': '0px'
            }).attr("class", "x-loading");
            // 蒙版
            var mask = $("<div></div>").css({
                'position': 'absolute',
                'z-index': op.z + 1,
                'width': '100%',
                'height': '100%',
                'background-color': op.backgroundColor,
                'top': '0px',
                'left': '0px',
                'border': 'none',
                'opacity': op.opacity
            });
            // 消息外壳
            var msgCrust = $("<span></span>").css({
                'position': 'relative',
                'top': (h - 30) / 2 + 'px',
                'z-index': op.z + 2,
                'display': 'inline-block',
                'color': op.msgColor,
                'background-color': op.borderColor,
                'padding': '1px',
                'border': 'none',
                'text-align': 'left',
                'border-radius': '5px',
                'opacity': 0.9
            });
            // 消息主体
            var msg = $("<span>" + op.msg + "</span>").css({
                'position': 'relative',
                'margin': '0px',
                'z-index': op.z + 3,
                'font-size': '20px',
                'display': 'inline-block',
                'background-color': op.foregroundColor,
                'padding': '5px 5px 5px 5px',
                'border': 'none',
                'vertical-align': 'middle',
                'text-align': 'left',
                'text-indent': '0'
            });
            // 图标
            var msgIcon = $("<img src=" + op.iconUrl + " />").css({
                'vertical-align': 'middle',
                'border': 'none',
                'padding': '5px'
            });
            // 拼装进度蒙层
            msg.prepend(msgIcon);
            msgCrust.prepend(msg);
            crust.prepend(mask);
            crust.prepend(msgCrust);
            crust.fadeIn(500); //模态设置
            $this.prepend(crust);
            return $this;
        },

        /**
         * 关闭过渡遮罩效果层
         */
        cancleLoading: function () {
            $(".x-loading", this).remove();
            return this;
        }
    });
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL0xvYWRpbmcuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIOS9v+eUqOaWueW8j+WunuS+i++8mlxyXG4gKiAvLyDnlJ/miJDlubbmiZPlvIDov4fmuKHpga7nvanmlYjmnpzlsYJcclxuICpcclxuICpcclxuICovXHJcbmRlZmluZShbJ2pxdWVyeSddLCBmdW5jdGlvbiAoJCkge1xyXG4gICAgJC5mbi5leHRlbmQoe1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOeUn+aIkOW5tuaJk+W8gOi/h+a4oemBrue9qeaViOaenOWxglxyXG4gICAgICAgICAqIEBwYXJhbSBvcHRpb25zXHJcbiAgICAgICAgICogQHJldHVybnMgeyp9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdG9nZ2xlTG9hZGluZzogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgLy8g5b2T5YmN5pON5L2c55qE5YWD57SgXHJcbiAgICAgICAgICAgIHZhciAkdGhpcyA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgIC8vIOaJvuWIsOmBrue9qeWxglxyXG4gICAgICAgICAgICB2YXIgY3J1c3QgPSAkKFwiLngtbG9hZGluZ1wiLCAkdGhpcyk7XHJcbiAgICAgICAgICAgIC8vIOWunueOsHRvb2dsZSjliIfmjaLpga7nvanlsYLlh7rnjrDkuI7mtojlpLEp5pWI5p6c55qE5Yik5pat5pa55rOVXHJcbiAgICAgICAgICAgIGlmIChjcnVzdC5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoY3J1c3QuaXMoXCI6dmlzaWJsZVwiKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNydXN0LmZhZGVPdXQoNTAwKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY3J1c3QuZmFkZUluKDUwMCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyDmianlsZXlj4LmlbBcclxuICAgICAgICAgICAgdmFyIG9wID0gJC5leHRlbmQoe1xyXG4gICAgICAgICAgICAgICAgejogOTk5OSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL+mBrue9qeWxguWxgumrmFxyXG4gICAgICAgICAgICAgICAgbXNnOiAnbG9hZGluZy4uLicsICAgICAgICAgICAgICAgICAgICAgICAgICAvL+aPkOekuuS/oeaBr1xyXG4gICAgICAgICAgICAgICAgaWNvblVybDogJy9pbWFnZXMvbG9hZGluZy5naWYnLCAgICAgICAgICAgICAvL+WbvueJh1xyXG4gICAgICAgICAgICAgICAgd2lkdGg6IDE4LCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL+Wbvuagh+WuveW6plxyXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAxOCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL+Wbvuagh+mrmOW6plxyXG4gICAgICAgICAgICAgICAgbXNnQ29sb3I6ICcjZmZmJywgICAgICAgICAgICAgICAgICAgICAgICAgIC8v5raI5oGv5paH5a2X6aKc6ImyXHJcbiAgICAgICAgICAgICAgICBib3JkZXJDb2xvcjogJyNmZmZmZmYnLCAgICAgICAgICAgICAgICAgICAgIC8v5raI5oGv6L655qGG6aKc6ImyXHJcbiAgICAgICAgICAgICAgICBmb3JlZ3JvdW5kQ29sb3I6IFwiIzQyOWFmZlwiLCAgICAgICAgICAgICAgICAgLy/mtojmga/og4zmma/popzoibJcclxuICAgICAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogXCIjMzMzMzMzXCIsICAgICAgICAgICAgICAgICAvL+iDjOaZr+minOiJslxyXG4gICAgICAgICAgICAgICAgb3BhY2l0eTogMC41LCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL+mAj+aYjuW6plxyXG4gICAgICAgICAgICAgICAgYWdlbnRXOiAkdGhpcy5vdXRlcldpZHRoKCksICAgICAgICAgICAgICAgICAvL+mBrue9qeWxguWuveW6plxyXG4gICAgICAgICAgICAgICAgYWdlbnRIOiAkdGhpcy5vdXRlckhlaWdodCgpICAgICAgICAgICAgICAgICAvL+mBrue9qeWxgumrmOW6plxyXG4gICAgICAgICAgICB9LCBvcHRpb25zKTtcclxuXHJcbiAgICAgICAgICAgIGlmICgkdGhpcy5jc3MoXCJwb3NpdGlvblwiKSA9PSBcInN0YXRpY1wiKVxyXG4gICAgICAgICAgICAgICAgJHRoaXMuY3NzKFwicG9zaXRpb25cIiwgXCJyZWxhdGl2ZVwiKTtcclxuXHJcbiAgICAgICAgICAgIHZhciB3ID0gb3AuYWdlbnRXLCBoID0gb3AuYWdlbnRIO1xyXG4gICAgICAgICAgICAvLyDlpJblo7NcclxuICAgICAgICAgICAgY3J1c3QgPSAkKFwiPGRpdj48L2Rpdj5cIikuY3NzKHtcclxuICAgICAgICAgICAgICAgICdwb3NpdGlvbic6ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgICAgICAnei1pbmRleCc6IG9wLnosXHJcbiAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6IHcgKyAncHgnLFxyXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6IGggKyAncHgnLFxyXG4gICAgICAgICAgICAgICAgJ3RleHQtYWxpZ24nOiAnY2VudGVyJyxcclxuICAgICAgICAgICAgICAgICd0b3AnOiAnMHB4JyxcclxuICAgICAgICAgICAgICAgICdib3JkZXInOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAnbGVmdCc6ICcwcHgnXHJcbiAgICAgICAgICAgIH0pLmF0dHIoXCJjbGFzc1wiLCBcIngtbG9hZGluZ1wiKTtcclxuICAgICAgICAgICAgLy8g6JKZ54mIXHJcbiAgICAgICAgICAgIHZhciBtYXNrID0gJChcIjxkaXY+PC9kaXY+XCIpLmNzcyh7XHJcbiAgICAgICAgICAgICAgICAncG9zaXRpb24nOiAnYWJzb2x1dGUnLFxyXG4gICAgICAgICAgICAgICAgJ3otaW5kZXgnOiBvcC56ICsgMSxcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6ICcxMDAlJyxcclxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiAnMTAwJScsXHJcbiAgICAgICAgICAgICAgICAnYmFja2dyb3VuZC1jb2xvcic6IG9wLmJhY2tncm91bmRDb2xvcixcclxuICAgICAgICAgICAgICAgICd0b3AnOiAnMHB4JyxcclxuICAgICAgICAgICAgICAgICdsZWZ0JzogJzBweCcsXHJcbiAgICAgICAgICAgICAgICAnYm9yZGVyJzogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgJ29wYWNpdHknOiBvcC5vcGFjaXR5XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAvLyDmtojmga/lpJblo7NcclxuICAgICAgICAgICAgdmFyIG1zZ0NydXN0ID0gJChcIjxzcGFuPjwvc3Bhbj5cIikuY3NzKHtcclxuICAgICAgICAgICAgICAgICdwb3NpdGlvbic6ICdyZWxhdGl2ZScsXHJcbiAgICAgICAgICAgICAgICAndG9wJzogKGggLSAzMCkgLyAyICsgJ3B4JyxcclxuICAgICAgICAgICAgICAgICd6LWluZGV4Jzogb3AueiArIDIsXHJcbiAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdpbmxpbmUtYmxvY2snLFxyXG4gICAgICAgICAgICAgICAgJ2NvbG9yJzogb3AubXNnQ29sb3IsXHJcbiAgICAgICAgICAgICAgICAnYmFja2dyb3VuZC1jb2xvcic6IG9wLmJvcmRlckNvbG9yLFxyXG4gICAgICAgICAgICAgICAgJ3BhZGRpbmcnOiAnMXB4JyxcclxuICAgICAgICAgICAgICAgICdib3JkZXInOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAndGV4dC1hbGlnbic6ICdsZWZ0JyxcclxuICAgICAgICAgICAgICAgICdib3JkZXItcmFkaXVzJzogJzVweCcsXHJcbiAgICAgICAgICAgICAgICAnb3BhY2l0eSc6IDAuOVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgLy8g5raI5oGv5Li75L2TXHJcbiAgICAgICAgICAgIHZhciBtc2cgPSAkKFwiPHNwYW4+XCIgKyBvcC5tc2cgKyBcIjwvc3Bhbj5cIikuY3NzKHtcclxuICAgICAgICAgICAgICAgICdwb3NpdGlvbic6ICdyZWxhdGl2ZScsXHJcbiAgICAgICAgICAgICAgICAnbWFyZ2luJzogJzBweCcsXHJcbiAgICAgICAgICAgICAgICAnei1pbmRleCc6IG9wLnogKyAzLFxyXG4gICAgICAgICAgICAgICAgJ2ZvbnQtc2l6ZSc6ICcyMHB4JyxcclxuICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ2lubGluZS1ibG9jaycsXHJcbiAgICAgICAgICAgICAgICAnYmFja2dyb3VuZC1jb2xvcic6IG9wLmZvcmVncm91bmRDb2xvcixcclxuICAgICAgICAgICAgICAgICdwYWRkaW5nJzogJzVweCA1cHggNXB4IDVweCcsXHJcbiAgICAgICAgICAgICAgICAnYm9yZGVyJzogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgJ3ZlcnRpY2FsLWFsaWduJzogJ21pZGRsZScsXHJcbiAgICAgICAgICAgICAgICAndGV4dC1hbGlnbic6ICdsZWZ0JyxcclxuICAgICAgICAgICAgICAgICd0ZXh0LWluZGVudCc6ICcwJ1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgLy8g5Zu+5qCHXHJcbiAgICAgICAgICAgIHZhciBtc2dJY29uID0gJChcIjxpbWcgc3JjPVwiICsgb3AuaWNvblVybCArIFwiIC8+XCIpLmNzcyh7XHJcbiAgICAgICAgICAgICAgICAndmVydGljYWwtYWxpZ24nOiAnbWlkZGxlJyxcclxuICAgICAgICAgICAgICAgICdib3JkZXInOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAncGFkZGluZyc6ICc1cHgnXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAvLyDmi7zoo4Xov5vluqbokpnlsYJcclxuICAgICAgICAgICAgbXNnLnByZXBlbmQobXNnSWNvbik7XHJcbiAgICAgICAgICAgIG1zZ0NydXN0LnByZXBlbmQobXNnKTtcclxuICAgICAgICAgICAgY3J1c3QucHJlcGVuZChtYXNrKTtcclxuICAgICAgICAgICAgY3J1c3QucHJlcGVuZChtc2dDcnVzdCk7XHJcbiAgICAgICAgICAgIGNydXN0LmZhZGVJbig1MDApOyAvL+aooeaAgeiuvue9rlxyXG4gICAgICAgICAgICAkdGhpcy5wcmVwZW5kKGNydXN0KTtcclxuICAgICAgICAgICAgcmV0dXJuICR0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOWFs+mXrei/h+a4oemBrue9qeaViOaenOWxglxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGNhbmNsZUxvYWRpbmc6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgJChcIi54LWxvYWRpbmdcIiwgdGhpcykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59KTsiXSwiZmlsZSI6InBsdWdpbnMvTG9hZGluZy5qcyJ9
