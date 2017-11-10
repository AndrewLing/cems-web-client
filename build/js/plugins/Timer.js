(function ($) {
    /**
     * 创建和管理前端定时器
     *
     * 提供了三个调用方法：
     *     1. everyTimer(时间间隔, [定时器名称], 定时回调方法, [次数限制], [是否等待定时回调方法执行完成])
     *     2. oneTimer(时间间隔, [定时器名称], 定时回调方法)
     *     3. stopTimer([定时器名称])
     **/
    'use strict';
    $.fn.extend({
        /**
         * 定时循环执行
         * $(selector).everyTimer(时间间隔, [定时器名称], 定时回调方法, [次数限制], [是否等待定时回调方法执行完成])
         *
         * @param interval <String> 时间间隔：如 '1s'，单位可定制
         * @param label <String> 定时器名称：可选
         * @param fn <Function> 回调方法
         *       参数：counter 当前执行次数
         * @param times <Number> 次数限制：可选，默认 0 （不限次数，即无限循环）
         * @param belay <Boolean> 是否等待定时回调方法执行完成：可选，默认 false（不等待定时回调方法执行完成即可开始下次计时）
         */
        everyTimer: function (interval, label, fn, times, belay) {
            return this.each(function () {
                $.timer.add(this, interval, label, fn, times, belay);
            });
        },
        /**
         * 定时执行一次
         * $(selector).oneTimer(时间间隔, [定时器名称], 定时回调方法)
         *
         * @param interval <String> 时间间隔：如 '1s'，单位可定制
         * @param label <String> 定时器名称：可选
         * @param fn <Function> 回调方法
         */
        oneTimer: function (interval, label, fn) {
            return this.each(function () {
                $.timer.add(this, interval, label, fn, 1);
            });
        },
        /**
         * 停止定时器
         * $(selector).stopTimer([定时器名称])
         *
         * @param label <String> 定时器名称：可选，默认停止该元素上所有的定时任务
         */
        stopTimer: function (label) {
            return this.each(function () {
                $.timer.remove(this, label);
            });
        }
    });

    $.extend({
        timer: {
            global: [],
            guid: 1,
            dataKey: "iems.timer",
            regex: /^([0-9]+(?:\.[0-9]*)?)\s*(.*)?$/,
            powers: {  // 定义时间单位映射
                'ms': 1,
                's': 1000,
                'min': 60000,
                'h': 3600000
            },
            timeParse: function (value) {
                if (value == undefined || value == null)
                    return null;
                var result = this.regex.exec($.trim(value.toString()));
                if (result[2]) {
                    var num = parseFloat(result[1]);
                    var mult = this.powers[result[2]] || 1;
                    return num * mult;
                } else {
                    return value;
                }
            },
            add: function (element, interval, label, fn, times, belay) {
                var counter = 0;

                if ($.isFunction(label)) {
                    if (!times)
                        times = fn;
                    fn = label;
                    label = interval;
                }

                interval = $.timer.timeParse(interval);

                if (typeof interval != 'number' || isNaN(interval) || interval <= 0)
                    return;

                if (times && times.constructor != Number) {
                    belay = !!times;
                    times = 0;
                }

                times = times || 0;
                belay = belay || false;

                var timers = $.data(element, this.dataKey) || $.data(element, this.dataKey, {});

                if (!timers[label])
                    timers[label] = {};

                fn.timerID = fn.timerID || this.guid++;

                var _self = this;
                var handler = function () {
                    if (!timers[label])
                        return;

                    if (timers[label][fn.timerID]) {
                        window.clearTimeout(timers[label][fn.timerID]);
                        delete timers[label][fn.timerID];
                    }

                    if (belay && _self.inProgress)
                        return;

                    _self.inProgress = true;

                    if ($.isEmptyObject($.data(element, _self.dataKey))
                        || (++counter > times && times !== 0)
                        || fn.call(element, counter) === false) {
                        $.timer.remove(element, label, fn);
                    } else {
                        timers[label] && (timers[label][fn.timerID] = window.setTimeout(handler, interval));
                    }

                    _self.inProgress = false;
                };

                handler.timerID = fn.timerID;

                if (!timers[label][fn.timerID])
                    timers[label][fn.timerID] = window.setTimeout(handler, interval);

                this.global.push(element);
            },
            remove: function (element, label, fn) {
                if ($.isFunction(label)) {
                    fn = label;
                    label = null;
                }

                var timers = $.data(element, this.dataKey), ret;

                if (timers) {

                    if (!label) {
                        for (label in timers)
                            this.remove(element, label, fn);
                    } else if (timers[label]) {
                        if (fn) {
                            if (fn.timerID) {
                                window.clearTimeout(timers[label][fn.timerID]);
                                delete timers[label][fn.timerID];
                            } else {
                                for (var timerID in timers[label]) {
                                    window.clearTimeout(timers[label][timerID]);
                                    delete timers[label][timerID];
                                }
                            }
                        } else {
                            for (var timerID in timers[label]) {
                                window.clearTimeout(timers[label][timerID]);
                                delete timers[label][timerID];
                            }
                        }

                        for (ret in timers[label]) break;
                        if (!ret) {
                            delete timers[label];
                        }
                        //$.isFunction(fn) && fn.call(element, label, timers);
                    }

                    for (ret in timers) break;
                    if (!ret) {
                        $.removeData(element, this.dataKey);
                        var temp = this.global.slice(0);
                        var i = temp.length;
                        while (i--) {
                            if (temp[i] === element) {
                                temp.splice(i, 1);
                            }
                        }
                        this.global = temp;
                    }
                }
            }
        }
    });

    $(window).bind("unload", function () {
        $.each($.timer.global, function (index, item) {
            $.timer.remove(item);
        });
    });
})(jQuery);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL1RpbWVyLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiAoJCkge1xyXG4gICAgLyoqXHJcbiAgICAgKiDliJvlu7rlkoznrqHnkIbliY3nq6/lrprml7blmahcclxuICAgICAqXHJcbiAgICAgKiDmj5DkvpvkuobkuInkuKrosIPnlKjmlrnms5XvvJpcclxuICAgICAqICAgICAxLiBldmVyeVRpbWVyKOaXtumXtOmXtOmalCwgW+WumuaXtuWZqOWQjeensF0sIOWumuaXtuWbnuiwg+aWueazlSwgW+asoeaVsOmZkOWItl0sIFvmmK/lkKbnrYnlvoXlrprml7blm57osIPmlrnms5XmiafooYzlrozmiJBdKVxyXG4gICAgICogICAgIDIuIG9uZVRpbWVyKOaXtumXtOmXtOmalCwgW+WumuaXtuWZqOWQjeensF0sIOWumuaXtuWbnuiwg+aWueazlSlcclxuICAgICAqICAgICAzLiBzdG9wVGltZXIoW+WumuaXtuWZqOWQjeensF0pXHJcbiAgICAgKiovXHJcbiAgICAndXNlIHN0cmljdCc7XHJcbiAgICAkLmZuLmV4dGVuZCh7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog5a6a5pe25b6q546v5omn6KGMXHJcbiAgICAgICAgICogJChzZWxlY3RvcikuZXZlcnlUaW1lcijml7bpl7Tpl7TpmpQsIFvlrprml7blmajlkI3np7BdLCDlrprml7blm57osIPmlrnms5UsIFvmrKHmlbDpmZDliLZdLCBb5piv5ZCm562J5b6F5a6a5pe25Zue6LCD5pa55rOV5omn6KGM5a6M5oiQXSlcclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIEBwYXJhbSBpbnRlcnZhbCA8U3RyaW5nPiDml7bpl7Tpl7TpmpTvvJrlpoIgJzFzJ++8jOWNleS9jeWPr+WumuWItlxyXG4gICAgICAgICAqIEBwYXJhbSBsYWJlbCA8U3RyaW5nPiDlrprml7blmajlkI3np7DvvJrlj6/pgIlcclxuICAgICAgICAgKiBAcGFyYW0gZm4gPEZ1bmN0aW9uPiDlm57osIPmlrnms5VcclxuICAgICAgICAgKiAgICAgICDlj4LmlbDvvJpjb3VudGVyIOW9k+WJjeaJp+ihjOasoeaVsFxyXG4gICAgICAgICAqIEBwYXJhbSB0aW1lcyA8TnVtYmVyPiDmrKHmlbDpmZDliLbvvJrlj6/pgInvvIzpu5jorqQgMCDvvIjkuI3pmZDmrKHmlbDvvIzljbPml6DpmZDlvqrnjq/vvIlcclxuICAgICAgICAgKiBAcGFyYW0gYmVsYXkgPEJvb2xlYW4+IOaYr+WQpuetieW+heWumuaXtuWbnuiwg+aWueazleaJp+ihjOWujOaIkO+8muWPr+mAie+8jOm7mOiupCBmYWxzZe+8iOS4jeetieW+heWumuaXtuWbnuiwg+aWueazleaJp+ihjOWujOaIkOWNs+WPr+W8gOWni+S4i+asoeiuoeaXtu+8iVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGV2ZXJ5VGltZXI6IGZ1bmN0aW9uIChpbnRlcnZhbCwgbGFiZWwsIGZuLCB0aW1lcywgYmVsYXkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAkLnRpbWVyLmFkZCh0aGlzLCBpbnRlcnZhbCwgbGFiZWwsIGZuLCB0aW1lcywgYmVsYXkpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOWumuaXtuaJp+ihjOS4gOasoVxyXG4gICAgICAgICAqICQoc2VsZWN0b3IpLm9uZVRpbWVyKOaXtumXtOmXtOmalCwgW+WumuaXtuWZqOWQjeensF0sIOWumuaXtuWbnuiwg+aWueazlSlcclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIEBwYXJhbSBpbnRlcnZhbCA8U3RyaW5nPiDml7bpl7Tpl7TpmpTvvJrlpoIgJzFzJ++8jOWNleS9jeWPr+WumuWItlxyXG4gICAgICAgICAqIEBwYXJhbSBsYWJlbCA8U3RyaW5nPiDlrprml7blmajlkI3np7DvvJrlj6/pgIlcclxuICAgICAgICAgKiBAcGFyYW0gZm4gPEZ1bmN0aW9uPiDlm57osIPmlrnms5VcclxuICAgICAgICAgKi9cclxuICAgICAgICBvbmVUaW1lcjogZnVuY3Rpb24gKGludGVydmFsLCBsYWJlbCwgZm4pIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAkLnRpbWVyLmFkZCh0aGlzLCBpbnRlcnZhbCwgbGFiZWwsIGZuLCAxKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiDlgZzmraLlrprml7blmahcclxuICAgICAgICAgKiAkKHNlbGVjdG9yKS5zdG9wVGltZXIoW+WumuaXtuWZqOWQjeensF0pXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBAcGFyYW0gbGFiZWwgPFN0cmluZz4g5a6a5pe25Zmo5ZCN56ew77ya5Y+v6YCJ77yM6buY6K6k5YGc5q2i6K+l5YWD57Sg5LiK5omA5pyJ55qE5a6a5pe25Lu75YqhXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgc3RvcFRpbWVyOiBmdW5jdGlvbiAobGFiZWwpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAkLnRpbWVyLnJlbW92ZSh0aGlzLCBsYWJlbCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgICQuZXh0ZW5kKHtcclxuICAgICAgICB0aW1lcjoge1xyXG4gICAgICAgICAgICBnbG9iYWw6IFtdLFxyXG4gICAgICAgICAgICBndWlkOiAxLFxyXG4gICAgICAgICAgICBkYXRhS2V5OiBcImllbXMudGltZXJcIixcclxuICAgICAgICAgICAgcmVnZXg6IC9eKFswLTldKyg/OlxcLlswLTldKik/KVxccyooLiopPyQvLFxyXG4gICAgICAgICAgICBwb3dlcnM6IHsgIC8vIOWumuS5ieaXtumXtOWNleS9jeaYoOWwhFxyXG4gICAgICAgICAgICAgICAgJ21zJzogMSxcclxuICAgICAgICAgICAgICAgICdzJzogMTAwMCxcclxuICAgICAgICAgICAgICAgICdtaW4nOiA2MDAwMCxcclxuICAgICAgICAgICAgICAgICdoJzogMzYwMDAwMFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB0aW1lUGFyc2U6IGZ1bmN0aW9uICh2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PSBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHRoaXMucmVnZXguZXhlYygkLnRyaW0odmFsdWUudG9TdHJpbmcoKSkpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdFsyXSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBudW0gPSBwYXJzZUZsb2F0KHJlc3VsdFsxXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG11bHQgPSB0aGlzLnBvd2Vyc1tyZXN1bHRbMl1dIHx8IDE7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bSAqIG11bHQ7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgYWRkOiBmdW5jdGlvbiAoZWxlbWVudCwgaW50ZXJ2YWwsIGxhYmVsLCBmbiwgdGltZXMsIGJlbGF5KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY291bnRlciA9IDA7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCQuaXNGdW5jdGlvbihsYWJlbCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXRpbWVzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aW1lcyA9IGZuO1xyXG4gICAgICAgICAgICAgICAgICAgIGZuID0gbGFiZWw7XHJcbiAgICAgICAgICAgICAgICAgICAgbGFiZWwgPSBpbnRlcnZhbDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpbnRlcnZhbCA9ICQudGltZXIudGltZVBhcnNlKGludGVydmFsKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGludGVydmFsICE9ICdudW1iZXInIHx8IGlzTmFOKGludGVydmFsKSB8fCBpbnRlcnZhbCA8PSAwKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodGltZXMgJiYgdGltZXMuY29uc3RydWN0b3IgIT0gTnVtYmVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYmVsYXkgPSAhIXRpbWVzO1xyXG4gICAgICAgICAgICAgICAgICAgIHRpbWVzID0gMDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB0aW1lcyA9IHRpbWVzIHx8IDA7XHJcbiAgICAgICAgICAgICAgICBiZWxheSA9IGJlbGF5IHx8IGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciB0aW1lcnMgPSAkLmRhdGEoZWxlbWVudCwgdGhpcy5kYXRhS2V5KSB8fCAkLmRhdGEoZWxlbWVudCwgdGhpcy5kYXRhS2V5LCB7fSk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCF0aW1lcnNbbGFiZWxdKVxyXG4gICAgICAgICAgICAgICAgICAgIHRpbWVyc1tsYWJlbF0gPSB7fTtcclxuXHJcbiAgICAgICAgICAgICAgICBmbi50aW1lcklEID0gZm4udGltZXJJRCB8fCB0aGlzLmd1aWQrKztcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgX3NlbGYgPSB0aGlzO1xyXG4gICAgICAgICAgICAgICAgdmFyIGhhbmRsZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aW1lcnNbbGFiZWxdKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aW1lcnNbbGFiZWxdW2ZuLnRpbWVySURdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQodGltZXJzW2xhYmVsXVtmbi50aW1lcklEXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB0aW1lcnNbbGFiZWxdW2ZuLnRpbWVySURdO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGJlbGF5ICYmIF9zZWxmLmluUHJvZ3Jlc3MpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgX3NlbGYuaW5Qcm9ncmVzcyA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICgkLmlzRW1wdHlPYmplY3QoJC5kYXRhKGVsZW1lbnQsIF9zZWxmLmRhdGFLZXkpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB8fCAoKytjb3VudGVyID4gdGltZXMgJiYgdGltZXMgIT09IDApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHx8IGZuLmNhbGwoZWxlbWVudCwgY291bnRlcikgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQudGltZXIucmVtb3ZlKGVsZW1lbnQsIGxhYmVsLCBmbik7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGltZXJzW2xhYmVsXSAmJiAodGltZXJzW2xhYmVsXVtmbi50aW1lcklEXSA9IHdpbmRvdy5zZXRUaW1lb3V0KGhhbmRsZXIsIGludGVydmFsKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBfc2VsZi5pblByb2dyZXNzID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIGhhbmRsZXIudGltZXJJRCA9IGZuLnRpbWVySUQ7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCF0aW1lcnNbbGFiZWxdW2ZuLnRpbWVySURdKVxyXG4gICAgICAgICAgICAgICAgICAgIHRpbWVyc1tsYWJlbF1bZm4udGltZXJJRF0gPSB3aW5kb3cuc2V0VGltZW91dChoYW5kbGVyLCBpbnRlcnZhbCk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5nbG9iYWwucHVzaChlbGVtZW50KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcmVtb3ZlOiBmdW5jdGlvbiAoZWxlbWVudCwgbGFiZWwsIGZuKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoJC5pc0Z1bmN0aW9uKGxhYmVsKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGZuID0gbGFiZWw7XHJcbiAgICAgICAgICAgICAgICAgICAgbGFiZWwgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhciB0aW1lcnMgPSAkLmRhdGEoZWxlbWVudCwgdGhpcy5kYXRhS2V5KSwgcmV0O1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0aW1lcnMpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFsYWJlbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxhYmVsIGluIHRpbWVycylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlKGVsZW1lbnQsIGxhYmVsLCBmbik7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aW1lcnNbbGFiZWxdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZuLnRpbWVySUQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHRpbWVyc1tsYWJlbF1bZm4udGltZXJJRF0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB0aW1lcnNbbGFiZWxdW2ZuLnRpbWVySURdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciB0aW1lcklEIGluIHRpbWVyc1tsYWJlbF0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LmNsZWFyVGltZW91dCh0aW1lcnNbbGFiZWxdW3RpbWVySURdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHRpbWVyc1tsYWJlbF1bdGltZXJJRF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgdGltZXJJRCBpbiB0aW1lcnNbbGFiZWxdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LmNsZWFyVGltZW91dCh0aW1lcnNbbGFiZWxdW3RpbWVySURdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgdGltZXJzW2xhYmVsXVt0aW1lcklEXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChyZXQgaW4gdGltZXJzW2xhYmVsXSkgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcmV0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgdGltZXJzW2xhYmVsXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyQuaXNGdW5jdGlvbihmbikgJiYgZm4uY2FsbChlbGVtZW50LCBsYWJlbCwgdGltZXJzKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGZvciAocmV0IGluIHRpbWVycykgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJC5yZW1vdmVEYXRhKGVsZW1lbnQsIHRoaXMuZGF0YUtleSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0ZW1wID0gdGhpcy5nbG9iYWwuc2xpY2UoMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpID0gdGVtcC5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0ZW1wW2ldID09PSBlbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcC5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5nbG9iYWwgPSB0ZW1wO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgICQod2luZG93KS5iaW5kKFwidW5sb2FkXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAkLmVhY2goJC50aW1lci5nbG9iYWwsIGZ1bmN0aW9uIChpbmRleCwgaXRlbSkge1xyXG4gICAgICAgICAgICAkLnRpbWVyLnJlbW92ZShpdGVtKTtcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG59KShqUXVlcnkpOyJdLCJmaWxlIjoicGx1Z2lucy9UaW1lci5qcyJ9
