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