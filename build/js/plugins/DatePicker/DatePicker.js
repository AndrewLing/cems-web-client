/**
 * Created by PL02053 on 2016/3/7.
 */
require(['jquery', 'plugins/DatePicker/WdatePicker'], function ($) {
    +(function ($) {

        var scrollTop = -1; // 记录当前滚动条的高度
        $('#main_view').mousemove(function () {
            if (!$('#iemsDatePicker').get(0) || $('#iemsDatePicker').is(':hidden')) {
                scrollTop = $(this).scrollTop();
            }
        });
        $('#main_view').scroll(function () {
            //console.log(scrollTop, $('#iemsDatePicker').is(':visible'));
            if (scrollTop != -1 && $('#iemsDatePicker').is(':visible')) {
                $(this).scrollTop(scrollTop);
            }
        });
        $(window).resize(function () {
            $('#iemsDatePicker').hide();
        });

        window.DatePicker = function (option) {
            var $lang = main.Lang || 'zh';
            option = $.extend({}, {
                skin: 'black',
                dateFmt: 'yyyy-MM-dd',
                lang: $lang
            }, option);

            if ($lang.indexOf('zh') >= 0) {
                option.lang = 'zh-cn';
            } else if ($lang.indexOf('ja') >= 0) {
                option.lang = 'ja';
                option.dateFmt = option.dateFmt.replace(/-/ig, '\/');
            } else if ($lang.indexOf('en') >= 0) {
                if (main.region == "UK") {
                    option.lang = 'uk';
                } else {
                    option.lang = 'en';
                }
                var fullTimes = option.dateFmt.split(/\s/);
                var year = (fullTimes[0].match("y+") && fullTimes[0].match("y+")[0]) || "";
                var month = (fullTimes[0].match("M+") && fullTimes[0].match("M+")[0]) || "";
                var day = (fullTimes[0].match("d+") && fullTimes[0].match("d+")[0]) || "";
                if (month && day && year) {
                    fullTimes[0] = (option.lang == 'en') ? month + "\/" + day + "\/" + year : day + "\/" + month + "\/" + year;
                } else if (month && year) {
                    fullTimes[0] = month + "\/" + year;
                } else if (year) {
                    fullTimes[0] = year;
                }
                // fullTimes[0] = (fullTimes[0] &&
                // fullTimes[0].split('').reverse().join('').replace(/[年月\-]/ig,
                // '\/').replace('日', '')) || fullTimes[0];
                option.dateFmt = (option.lang == 'en') ? fullTimes.reverse().join(' ') : fullTimes.join(' ');
            }

            WdatePicker(option);
        };

        /**
         * 获取时间控件实际时间（返回JS Date对象）
         *
         * @param did
         *        时间控件元素ID
         * @returns {Date}
         */
        window.DatePicker.getRealDate = function (did) {
            var dpDate = $dp.$DV($dp.$D(did));
            return new Date(dpDate.y, dpDate.M, dpDate.d, dpDate.H, dpDate.m, dpDate.s);
        };
        /**
         * 获取时间控件实际时间（返回WdatePicker DpDate对象）
         *
         * @param did
         * @returns {*}
         */
        window.DatePicker.getRealDPDate = function (did) {
            return $dp.$DV($dp.$D(did));
        };

        var fnval = $.fn.val;
        $.fn.val = function () {
            var $this = this;
            var result = arguments[0];
            var d = '';
            if ($this.hasClass("Wdate") && arguments.length == 1 && (typeof arguments[0] == "string")) {
                if (+arguments[0]) {
                    d = new Date(+arguments[0]);
                } else {
                    var temp_arg = arguments[0];
                    if ((main.Lang == 'en' && main.region == "UK") && (arguments[0].substring(2, 3) == "/")) {
                        if (arguments[0].length == 10) {
                            temp_arg = arguments[0].substring(3, 5) + "/" + arguments[0].substring(0, 2) + "/" + arguments[0].substring(6, 10);
                        } else if (arguments[0].length == 19) {
                            temp_arg = arguments[0].substring(3, 5) + "/" + arguments[0].substring(0, 2) + "/" + arguments[0].substring(6, 19);
                        }
                    }
                    d = new Date(temp_arg);
                }
                if (main.Lang && main.Lang == "en") {
                    if (main.region == "US") {
                        if (arguments[0].length == 7) {
                            result = d.format("MM/yyyy", true);
                        } else if (arguments[0].length == 10) {
                            result = d.format("MM/dd/yyyy", true);
                        } else if (arguments[0].length == 19) {
                            result = d.format("hh:mm:ss MM/dd/yyyy", true);
                        }
                        arguments[0] = result;
                    }
                    else if (main.region == "UK") {
                        if (arguments[0].length == 7) {
                            result = d.format("MM/yyyy", true);
                        } else if (arguments[0].length == 10) {
                            result = d.format("dd/MM/yyyy", true);
                        } else if (arguments[0].length == 19) {
                            result = d.format("dd/MM/yyyy hh:mm:ss", true);
                        }
                        arguments[0] = result;
                    }
                }
                else if (main.Lang && main.Lang == "ja") {
                    if (arguments[0].length == 7) {
                        result = d.format("yyyy/MM", true);
                    } else if (arguments[0].length == 10) {
                        result = d.format("yyyy/MM/dd", true);
                    } else if (arguments[0].length == 19) {
                        result = d.format("yyyy/MM/dd hh:mm:ss", true);
                    }
                    arguments[0] = result;

                }
            }

            if ($this.hasClass("Wdate") && !arguments.length) {
                d = fnval.apply($this, arguments);
                result = d;

                if (d && main.Lang && (main.Lang == "en" || main.Lang == "ja")) {
                    if (d.length == 7) {
                        if (main.Lang == "ja") {
                            result = d.substring(0, 4) + "-" + d.substring(5, 7);
                        } else {
                            result = d.substring(3, 7) + "-" + d.substring(0, 2);
                        }
                    } else if (d.length == 10) {
                        if (main.Lang == "en" && main.region == "UK") {
                            if (d.substring(2, 3) == "/") {
                                var temp_d = d.substring(3, 5) + "/" + d.substring(0, 2) + "/" + d.substring(6, 10);
                                result = new Date(temp_d).format("yyyy-MM-dd", true);
                            } else {
                                var temp = new Date(d).format("yyyy-MM-dd", true);
                                result = temp.substring(0, 4) + "-" + temp.substring(8, 10) + "-" + temp.substring(5, 7);
                            }
                        } else {
                            result = new Date(d).format("yyyy-MM-dd", true);
                        }
                    } else if (d.length == 19) {
                        if (main.Lang == "en" && main.region == "UK") {
                            if (d.substring(2, 3) == "/") {
                                var temp_d = d.substring(3, 5) + "/" + d.substring(0, 2) + "/" + d.substring(6, 19);
                                result = new Date(temp_d).format("yyyy-MM-dd hh:mm:ss", true);
                            } else {
                                var temp = new Date(d).format("yyyy-MM-dd hh:mm:ss", true);
                                result = temp.substring(0, 4) + "-" + temp.substring(8, 10) + "-" + temp.substring(5, 7) + " " + temp.substring(11, 19);
                            }
                        } else {
                            result = new Date(d).format("yyyy-MM-dd hh:mm:ss", true);
                        }
                    }
                }

                return result;
            } else {
                return fnval.apply($this, arguments);
            }
        }

    })(jQuery);
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL0RhdGVQaWNrZXIvRGF0ZVBpY2tlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENyZWF0ZWQgYnkgUEwwMjA1MyBvbiAyMDE2LzMvNy5cbiAqL1xucmVxdWlyZShbJ2pxdWVyeScsICdwbHVnaW5zL0RhdGVQaWNrZXIvV2RhdGVQaWNrZXInXSwgZnVuY3Rpb24gKCQpIHtcbiAgICArKGZ1bmN0aW9uICgkKSB7XG5cbiAgICAgICAgdmFyIHNjcm9sbFRvcCA9IC0xOyAvLyDorrDlvZXlvZPliY3mu5rliqjmnaHnmoTpq5jluqZcbiAgICAgICAgJCgnI21haW5fdmlldycpLm1vdXNlbW92ZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoISQoJyNpZW1zRGF0ZVBpY2tlcicpLmdldCgwKSB8fCAkKCcjaWVtc0RhdGVQaWNrZXInKS5pcygnOmhpZGRlbicpKSB7XG4gICAgICAgICAgICAgICAgc2Nyb2xsVG9wID0gJCh0aGlzKS5zY3JvbGxUb3AoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgICQoJyNtYWluX3ZpZXcnKS5zY3JvbGwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhzY3JvbGxUb3AsICQoJyNpZW1zRGF0ZVBpY2tlcicpLmlzKCc6dmlzaWJsZScpKTtcbiAgICAgICAgICAgIGlmIChzY3JvbGxUb3AgIT0gLTEgJiYgJCgnI2llbXNEYXRlUGlja2VyJykuaXMoJzp2aXNpYmxlJykpIHtcbiAgICAgICAgICAgICAgICAkKHRoaXMpLnNjcm9sbFRvcChzY3JvbGxUb3ApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgJCh3aW5kb3cpLnJlc2l6ZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkKCcjaWVtc0RhdGVQaWNrZXInKS5oaWRlKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdpbmRvdy5EYXRlUGlja2VyID0gZnVuY3Rpb24gKG9wdGlvbikge1xuICAgICAgICAgICAgdmFyICRsYW5nID0gbWFpbi5MYW5nIHx8ICd6aCc7XG4gICAgICAgICAgICBvcHRpb24gPSAkLmV4dGVuZCh7fSwge1xuICAgICAgICAgICAgICAgIHNraW46ICdibGFjaycsXG4gICAgICAgICAgICAgICAgZGF0ZUZtdDogJ3l5eXktTU0tZGQnLFxuICAgICAgICAgICAgICAgIGxhbmc6ICRsYW5nXG4gICAgICAgICAgICB9LCBvcHRpb24pO1xuXG4gICAgICAgICAgICBpZiAoJGxhbmcuaW5kZXhPZignemgnKSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9uLmxhbmcgPSAnemgtY24nO1xuICAgICAgICAgICAgfSBlbHNlIGlmICgkbGFuZy5pbmRleE9mKCdqYScpID49IDApIHtcbiAgICAgICAgICAgICAgICBvcHRpb24ubGFuZyA9ICdqYSc7XG4gICAgICAgICAgICAgICAgb3B0aW9uLmRhdGVGbXQgPSBvcHRpb24uZGF0ZUZtdC5yZXBsYWNlKC8tL2lnLCAnXFwvJyk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCRsYW5nLmluZGV4T2YoJ2VuJykgPj0gMCkge1xuICAgICAgICAgICAgICAgIGlmIChtYWluLnJlZ2lvbiA9PSBcIlVLXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uLmxhbmcgPSAndWsnO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbi5sYW5nID0gJ2VuJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGZ1bGxUaW1lcyA9IG9wdGlvbi5kYXRlRm10LnNwbGl0KC9cXHMvKTtcbiAgICAgICAgICAgICAgICB2YXIgeWVhciA9IChmdWxsVGltZXNbMF0ubWF0Y2goXCJ5K1wiKSAmJiBmdWxsVGltZXNbMF0ubWF0Y2goXCJ5K1wiKVswXSkgfHwgXCJcIjtcbiAgICAgICAgICAgICAgICB2YXIgbW9udGggPSAoZnVsbFRpbWVzWzBdLm1hdGNoKFwiTStcIikgJiYgZnVsbFRpbWVzWzBdLm1hdGNoKFwiTStcIilbMF0pIHx8IFwiXCI7XG4gICAgICAgICAgICAgICAgdmFyIGRheSA9IChmdWxsVGltZXNbMF0ubWF0Y2goXCJkK1wiKSAmJiBmdWxsVGltZXNbMF0ubWF0Y2goXCJkK1wiKVswXSkgfHwgXCJcIjtcbiAgICAgICAgICAgICAgICBpZiAobW9udGggJiYgZGF5ICYmIHllYXIpIHtcbiAgICAgICAgICAgICAgICAgICAgZnVsbFRpbWVzWzBdID0gKG9wdGlvbi5sYW5nID09ICdlbicpID8gbW9udGggKyBcIlxcL1wiICsgZGF5ICsgXCJcXC9cIiArIHllYXIgOiBkYXkgKyBcIlxcL1wiICsgbW9udGggKyBcIlxcL1wiICsgeWVhcjtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG1vbnRoICYmIHllYXIpIHtcbiAgICAgICAgICAgICAgICAgICAgZnVsbFRpbWVzWzBdID0gbW9udGggKyBcIlxcL1wiICsgeWVhcjtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHllYXIpIHtcbiAgICAgICAgICAgICAgICAgICAgZnVsbFRpbWVzWzBdID0geWVhcjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gZnVsbFRpbWVzWzBdID0gKGZ1bGxUaW1lc1swXSAmJlxuICAgICAgICAgICAgICAgIC8vIGZ1bGxUaW1lc1swXS5zcGxpdCgnJykucmV2ZXJzZSgpLmpvaW4oJycpLnJlcGxhY2UoL1vlubTmnIhcXC1dL2lnLFxuICAgICAgICAgICAgICAgIC8vICdcXC8nKS5yZXBsYWNlKCfml6UnLCAnJykpIHx8IGZ1bGxUaW1lc1swXTtcbiAgICAgICAgICAgICAgICBvcHRpb24uZGF0ZUZtdCA9IChvcHRpb24ubGFuZyA9PSAnZW4nKSA/IGZ1bGxUaW1lcy5yZXZlcnNlKCkuam9pbignICcpIDogZnVsbFRpbWVzLmpvaW4oJyAnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgV2RhdGVQaWNrZXIob3B0aW9uKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICog6I635Y+W5pe26Ze05o6n5Lu25a6e6ZmF5pe26Ze077yI6L+U5ZueSlMgRGF0ZeWvueixoe+8iVxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0gZGlkXG4gICAgICAgICAqICAgICAgICDml7bpl7Tmjqfku7blhYPntKBJRFxuICAgICAgICAgKiBAcmV0dXJucyB7RGF0ZX1cbiAgICAgICAgICovXG4gICAgICAgIHdpbmRvdy5EYXRlUGlja2VyLmdldFJlYWxEYXRlID0gZnVuY3Rpb24gKGRpZCkge1xuICAgICAgICAgICAgdmFyIGRwRGF0ZSA9ICRkcC4kRFYoJGRwLiREKGRpZCkpO1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBEYXRlKGRwRGF0ZS55LCBkcERhdGUuTSwgZHBEYXRlLmQsIGRwRGF0ZS5ILCBkcERhdGUubSwgZHBEYXRlLnMpO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICog6I635Y+W5pe26Ze05o6n5Lu25a6e6ZmF5pe26Ze077yI6L+U5ZueV2RhdGVQaWNrZXIgRHBEYXRl5a+56LGh77yJXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSBkaWRcbiAgICAgICAgICogQHJldHVybnMgeyp9XG4gICAgICAgICAqL1xuICAgICAgICB3aW5kb3cuRGF0ZVBpY2tlci5nZXRSZWFsRFBEYXRlID0gZnVuY3Rpb24gKGRpZCkge1xuICAgICAgICAgICAgcmV0dXJuICRkcC4kRFYoJGRwLiREKGRpZCkpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBmbnZhbCA9ICQuZm4udmFsO1xuICAgICAgICAkLmZuLnZhbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciAkdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gYXJndW1lbnRzWzBdO1xuICAgICAgICAgICAgdmFyIGQgPSAnJztcbiAgICAgICAgICAgIGlmICgkdGhpcy5oYXNDbGFzcyhcIldkYXRlXCIpICYmIGFyZ3VtZW50cy5sZW5ndGggPT0gMSAmJiAodHlwZW9mIGFyZ3VtZW50c1swXSA9PSBcInN0cmluZ1wiKSkge1xuICAgICAgICAgICAgICAgIGlmICgrYXJndW1lbnRzWzBdKSB7XG4gICAgICAgICAgICAgICAgICAgIGQgPSBuZXcgRGF0ZSgrYXJndW1lbnRzWzBdKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdGVtcF9hcmcgPSBhcmd1bWVudHNbMF07XG4gICAgICAgICAgICAgICAgICAgIGlmICgobWFpbi5MYW5nID09ICdlbicgJiYgbWFpbi5yZWdpb24gPT0gXCJVS1wiKSAmJiAoYXJndW1lbnRzWzBdLnN1YnN0cmluZygyLCAzKSA9PSBcIi9cIikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhcmd1bWVudHNbMF0ubGVuZ3RoID09IDEwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcF9hcmcgPSBhcmd1bWVudHNbMF0uc3Vic3RyaW5nKDMsIDUpICsgXCIvXCIgKyBhcmd1bWVudHNbMF0uc3Vic3RyaW5nKDAsIDIpICsgXCIvXCIgKyBhcmd1bWVudHNbMF0uc3Vic3RyaW5nKDYsIDEwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzWzBdLmxlbmd0aCA9PSAxOSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBfYXJnID0gYXJndW1lbnRzWzBdLnN1YnN0cmluZygzLCA1KSArIFwiL1wiICsgYXJndW1lbnRzWzBdLnN1YnN0cmluZygwLCAyKSArIFwiL1wiICsgYXJndW1lbnRzWzBdLnN1YnN0cmluZyg2LCAxOSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZCA9IG5ldyBEYXRlKHRlbXBfYXJnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG1haW4uTGFuZyAmJiBtYWluLkxhbmcgPT0gXCJlblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtYWluLnJlZ2lvbiA9PSBcIlVTXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhcmd1bWVudHNbMF0ubGVuZ3RoID09IDcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBkLmZvcm1hdChcIk1NL3l5eXlcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFyZ3VtZW50c1swXS5sZW5ndGggPT0gMTApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBkLmZvcm1hdChcIk1NL2RkL3l5eXlcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFyZ3VtZW50c1swXS5sZW5ndGggPT0gMTkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBkLmZvcm1hdChcImhoOm1tOnNzIE1NL2RkL3l5eXlcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmd1bWVudHNbMF0gPSByZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAobWFpbi5yZWdpb24gPT0gXCJVS1wiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXJndW1lbnRzWzBdLmxlbmd0aCA9PSA3KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gZC5mb3JtYXQoXCJNTS95eXl5XCIsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChhcmd1bWVudHNbMF0ubGVuZ3RoID09IDEwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gZC5mb3JtYXQoXCJkZC9NTS95eXl5XCIsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChhcmd1bWVudHNbMF0ubGVuZ3RoID09IDE5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gZC5mb3JtYXQoXCJkZC9NTS95eXl5IGhoOm1tOnNzXCIsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYXJndW1lbnRzWzBdID0gcmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKG1haW4uTGFuZyAmJiBtYWluLkxhbmcgPT0gXCJqYVwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhcmd1bWVudHNbMF0ubGVuZ3RoID09IDcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGQuZm9ybWF0KFwieXl5eS9NTVwiLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChhcmd1bWVudHNbMF0ubGVuZ3RoID09IDEwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBkLmZvcm1hdChcInl5eXkvTU0vZGRcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzWzBdLmxlbmd0aCA9PSAxOSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gZC5mb3JtYXQoXCJ5eXl5L01NL2RkIGhoOm1tOnNzXCIsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGFyZ3VtZW50c1swXSA9IHJlc3VsdDtcblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCR0aGlzLmhhc0NsYXNzKFwiV2RhdGVcIikgJiYgIWFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBkID0gZm52YWwuYXBwbHkoJHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gZDtcblxuICAgICAgICAgICAgICAgIGlmIChkICYmIG1haW4uTGFuZyAmJiAobWFpbi5MYW5nID09IFwiZW5cIiB8fCBtYWluLkxhbmcgPT0gXCJqYVwiKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZC5sZW5ndGggPT0gNykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1haW4uTGFuZyA9PSBcImphXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBkLnN1YnN0cmluZygwLCA0KSArIFwiLVwiICsgZC5zdWJzdHJpbmcoNSwgNyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGQuc3Vic3RyaW5nKDMsIDcpICsgXCItXCIgKyBkLnN1YnN0cmluZygwLCAyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChkLmxlbmd0aCA9PSAxMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1haW4uTGFuZyA9PSBcImVuXCIgJiYgbWFpbi5yZWdpb24gPT0gXCJVS1wiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGQuc3Vic3RyaW5nKDIsIDMpID09IFwiL1wiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0ZW1wX2QgPSBkLnN1YnN0cmluZygzLCA1KSArIFwiL1wiICsgZC5zdWJzdHJpbmcoMCwgMikgKyBcIi9cIiArIGQuc3Vic3RyaW5nKDYsIDEwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gbmV3IERhdGUodGVtcF9kKS5mb3JtYXQoXCJ5eXl5LU1NLWRkXCIsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0ZW1wID0gbmV3IERhdGUoZCkuZm9ybWF0KFwieXl5eS1NTS1kZFwiLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gdGVtcC5zdWJzdHJpbmcoMCwgNCkgKyBcIi1cIiArIHRlbXAuc3Vic3RyaW5nKDgsIDEwKSArIFwiLVwiICsgdGVtcC5zdWJzdHJpbmcoNSwgNyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBuZXcgRGF0ZShkKS5mb3JtYXQoXCJ5eXl5LU1NLWRkXCIsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGQubGVuZ3RoID09IDE5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobWFpbi5MYW5nID09IFwiZW5cIiAmJiBtYWluLnJlZ2lvbiA9PSBcIlVLXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZC5zdWJzdHJpbmcoMiwgMykgPT0gXCIvXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRlbXBfZCA9IGQuc3Vic3RyaW5nKDMsIDUpICsgXCIvXCIgKyBkLnN1YnN0cmluZygwLCAyKSArIFwiL1wiICsgZC5zdWJzdHJpbmcoNiwgMTkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBuZXcgRGF0ZSh0ZW1wX2QpLmZvcm1hdChcInl5eXktTU0tZGQgaGg6bW06c3NcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRlbXAgPSBuZXcgRGF0ZShkKS5mb3JtYXQoXCJ5eXl5LU1NLWRkIGhoOm1tOnNzXCIsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSB0ZW1wLnN1YnN0cmluZygwLCA0KSArIFwiLVwiICsgdGVtcC5zdWJzdHJpbmcoOCwgMTApICsgXCItXCIgKyB0ZW1wLnN1YnN0cmluZyg1LCA3KSArIFwiIFwiICsgdGVtcC5zdWJzdHJpbmcoMTEsIDE5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IG5ldyBEYXRlKGQpLmZvcm1hdChcInl5eXktTU0tZGQgaGg6bW06c3NcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZm52YWwuYXBwbHkoJHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgIH0pKGpRdWVyeSk7XG59KTsiXSwiZmlsZSI6InBsdWdpbnMvRGF0ZVBpY2tlci9EYXRlUGlja2VyLmpzIn0=
