/**
 * 1，系统基础方法 {@code App.XXX}
 * 2，原型扩展 {@code Object.extend(...)}
 * 3，jquery扩展方法及对验证规则的扩展 {@code $Object.XXX}
 * 4，数据访问方法 {@code App.http.XXX}
 *
 * @author P00034
 */
'use strict';
define(['jquery', 'main/right'], function ($, Menu) {

    /*****************************************************原型扩展******************************************************
     * @param {Object} target 目标对象。
     * @param {Object} source 源对象。
     * @param {Object} deep 是否复制(继承)对象中的对象。
     * @returns {Object} 返回继承了source对象属性的新对象。
     */
    Object.extend = function (target, source, deep) {
        target = target || {};
        var sType = typeof source, i = 1, options;
        if (sType === 'undefined' || sType === 'boolean') {
            deep = sType === 'boolean' ? source : false;
            source = target;
            target = this;
        }
        if (sType !== 'object' && Object.prototype.toString.call(source) !== '[object Function]')
            source = {};
        while (i <= 2) {
            options = i === 1 ? target : source;
            if (options != null) {
                for (var name in options) {
                    var src = target[name], copy = options[name];
                    if (target === copy)
                        continue;
                    if (deep && copy && typeof copy === 'object' && !copy.nodeType)
                        target[name] = this.extend(src ||
                        (copy.length != null ? [] : {}), copy, deep);
                    else if (copy !== undefined)
                        target[name] = copy;
                }
            }
            i++;
        }
        return target;
    };

    /**
     * 字符串（String）原型对象扩展
     */
    Object.extend(String, {

        /**
         * 字符串格式化
         * 例子:
         * String.format("{0}{1}", "hello", "world");
         */
        format: function () {
            if (arguments.length == 0) {
                return null;
            }
            var formatStr = arguments[0];
            for (var i = 1; i < arguments.length; i++) {
                formatStr = formatStr.replace(new RegExp('\\{' + (i - 1) + '\\}', 'gm'), arguments[i]);
            }
            return formatStr;
        }
    });
    Object.extend(String.prototype, {
        /**
         * 从字符串中左、右或两端删除空格、Tab、回车符或换行符等空白字符
         */
        trim: function () {
            return this.replace(/(^\s*)|(\s*$)/g, "");
        },
        ltrim: function () {
            return this.replace(/(^\s*)/g, "");
        },
        rtrim: function () {
            return this.replace(/(\s*$)/g, "");
        },
        /**
         * HTML转义字符
         */
        replaceHTMLChar: function () {
            return this.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '\"').replace(/&#39;/g, '\'');
        },
        /**
         * 转义特殊字符
         */
        replaceIllegalChar: function () {
            return this.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/ /g, '&nbsp;').replace(/\\"/g, '&quot;').replace(/\\'/g, '&#39;');
        },
        /**
         * 以指定字符串匹配字符串头部或尾部，相同时返回true
         * @author cWX235881
         */
        endWith: function (str) {
            if (str == null || str == "" || this.length == 0
                || str.length > this.length)
                return false;
            return (this.substring(this.length - str.length) == str);
        },
        startWith: function (str) {
            if (str == null || str == "" || this.length == 0
                || str.length > this.length)
                return false;
            return (this.substr(0, str.length) == str);
        },
        /**
         * 获取URL传递参数中指定参数名称的值
         * @param name {String} 参数名称
         * @returns {Object} 返回值
         */
        getValue: function (name) {
            var regex = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
            var b = this.substr(this.indexOf("\?") + 1).match(regex);
            if (b && b != null) return unescape(b[2]);
            return null;
        },
        /**
         * 对数字字符串格式进行小数截断
         * @param length {Int} 小数截断位数
         */
        fixed: function (length) {
            if (isNaN(this))
                return this;
            return parseFloat(Number(this).fixed(length));
        },
        /**
         * 对数字格式进行单位转换
         * @param length {Int} 转换的比率，默认为4，如4：相当于处以10000
         */
        unit: function (length) {
            if (isNaN(this))
                return 0;
            return parseFloat(Number(this).unit(length));
        },
        /**
         * 对数字格式进行
         */
        format: function () {
            var value = this;
            var source = value.replace(/,/g, '').split('.');
            source[0] = source[0].replace(/(\d)(?=(\d{3})+$)/ig, '$1,');
            return source.join('.');
        },
        /**
         * 判断字符串中是否包含指定字符串
         */
        contains: function (str) {
            var value = this;
            return value.indexOf(str) > -1;

        },
        encrypt: function () {
            if (this == undefined || this == null || this == "") {
                return undefined;
            }

            var length = this.length;
            var charArray = [];
            for (var i = 0; i < length; i++) {
                charArray[i] = this.charCodeAt(i);
                charArray[i] = charArray[i] * 2;
            }

            return charArray.toString().replace(/,/g, "@");
        }
    });

    /**
     * 日期时间（Date）原型对象扩展
     */
    Object.extend(Date, {
        /**
         * 将日期格式字符串转换为Date对象
         * @param strDate {String} 指定格式的时间字符串，必填
         * @param fmt {String} 格式，默认'yyyy-MM-dd HH:mm:ss S'
         * @param timeZone {Number} 时区 ，如 -8 表示 西8区，默认为 操作系统时区
         */
        parse: function (strDate, fmt, timeZone) {
            var da = [];
            if (!isNaN(fmt)) {
                timeZone = fmt;
                fmt = null;
            }
            var sd = String(strDate).match(/\d+/g);
            var r = fmt && fmt.match(/[yYMmdHhsS]+/gm);
            var o = {
                "[yY]+": (new Date()).getFullYear(), //年
                "M+": 1, //月份
                "d+": 1, //日
                "[Hh]+": 0, //小时
                "m+": 0, //分
                "s+": 0, //秒
                "S": 0 //毫秒
            };
            if (r) {
                var j = 0;
                for (var k in o) {
                    da[j] = o[k];
                    for (var i = 0; i < r.length; i++)
                        if (new RegExp("(" + k + ")").test(r[i])) {
                            da[j] = sd[i];
                            break;
                        }
                    j++;
                }
            } else {
                da = sd;
            }
            var d = main.eval('new Date(' + (da ? da.map(function (a, i) {
                var t = parseInt(a, 10);
                if (i == 1) {
                    t = t - 1;
                }
                return t;
            }) : '') + ')');
            if (!isNaN(timeZone)) {
                var localTime = d.getTime(),
                    localOffset = d.getTimezoneOffset() * 60000,
                    utc = localTime + localOffset,
                    offset = timeZone,
                    localSecondTime = utc + (3600000 * offset);
                d = new Date(localSecondTime);
            }
            return d;
        },

        /**
         * 将日期格式字符串转换为毫秒值
         * @param strDate {String} 指定格式的时间字符串，必填
         * @param fmt {String} 格式，默认'yyyy-MM-dd HH:mm:ss S'
         * @param timeZone {Number} 时区 ，如 -8 表示 西8区，默认为 操作系统时区
         */
        parseTime: function (strDate, fmt, timeZone) {
            if (arguments.length === 0) {
                return new Date().getTime();
            }
            if (!strDate) {
                return strDate;
            }

            var _date = Date.parse(strDate, fmt, timeZone);
            if (!_date.getTime()) {
                _date = new Date(strDate);
            }

            return _date.getTime();
        },

        /**
         * 获取操作系统时区
         * @returns {number}
         */
        getTimezone: function () {
            return -1 * (new Date()).getTimezoneOffset() / 60;
        }
    });
    Object.extend(Date.prototype, {

        /**
         * 时间格式化
         * @param fmt {String} 格式字符串，如：'yyyy-MM-dd HH:mm:ss S'
         * @param isForce {Boolean} 是否强制使用格式，而不国际化时间格式，默认 false，即不强制使用格式，而格式自动化
         * @param lang {String} 语言标识，如：'zh'，默认为当前语言
         * @param region {String} 区域标识，如：'CN'，默认为当前区域
         *
         * @return {String} 指定日期格式字符串（如：2014-12-12 22:22:22:234）
         */
        format: function (fmt, isForce, lang, region) {
            if (!isForce) {
                lang = lang || main.Lang || 'zh';
                region = region || main.region || 'CN';

                if (lang == 'zh') {
                } else if (lang == 'ja') {
                    fmt = fmt.replace(/-/ig, '\/');
                } else if (lang == 'en') {
                    var fullTimes = fmt.split(/\s/);
                    var year = (fullTimes[0].match("[yY]+") && fullTimes[0].match("[yY]+")[0]) || "";
                    var month = (fullTimes[0].match("M+") && fullTimes[0].match("M+")[0]) || "";
                    var day = (fullTimes[0].match("d+") && fullTimes[0].match("d+")[0]) || "";
                    if (month && day && year) {
                        fullTimes[0] = (region == 'US') ? month + "\/" + day + "\/" + year : day + "\/" + month + "\/" + year;
                    } else if (month && year) {
                        fullTimes[0] = month + "\/" + year;
                    } else if (year) {
                        fullTimes[0] = year;
                    }
                    fmt = (region == 'US') ? fullTimes.reverse().join(' ') : fullTimes.join(' ');
                }
            }

            var o = {
                "[yY]+": this.getFullYear(), //年
                "M+": this.getMonth() + 1, //月份
                "d+": this.getDate(), //日
                "[Hh]+": this.getHours(), //小时
                "m+": this.getMinutes(), //分
                "s+": this.getSeconds(), //秒
                "q+": Math.floor((this.getMonth() + 3) / 3), //季度
                "S": this.getMilliseconds() //毫秒
            };
            if (/([yY]+)/.test(fmt))
                fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
            for (var k in o)
                if (new RegExp("(" + k + ")").test(fmt))
                    fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
            return fmt;
        }
    });

    /**
     * 数组（Array）原型对象扩展
     */
    Object.extend(Array, {});
    Object.extend(Array.prototype, {
        /**
         * 获取数组中的最大值
         * @returns {number}
         */
        max: function () {
            return Math.max.apply(Math, this);
        },

        /**
         * 获取数组中的最小值
         * @returns {number}
         */
        min: function () {
            return Math.min.apply(Math, this);
        },

        /**
         * 判断数组中是否包含某个元素
         * @param obj {*}
         */
        contains: function (obj) {
            var i = this.length;
            while (i--) {
                if (this[i] == obj) {
                    return true;
                }
            }
            return false;
        },

        /**
         * 删除数组中是某个值得所有元素
         * @param val {*}
         */
        removeAll: function (val) {
            var temp = this.slice(0);
            var i = temp.length;
            while (i--) {
                if (temp[i] === val) {
                    temp.splice(i, 1);
                }
            }
            return temp;
        },

        /**
         * 获取数组中是某个值的元素序列号
         * @param val {*}
         */
        indexOf: function (val) {
            for (var i = 0; i < this.length; i++) {
                if (this[i] == val) {
                    return i;
                }
            }
            return -1;
        },

        /**
         * 删除数组中是某个值的元素
         * @param val {*}
         */
        remove: function (val) {
            var index = this.indexOf(val);
            if (index > -1) {
                this.splice(index, 1);
            }
        }
    });

    /**
     * Map 原型扩展
     */
    Object.extend(Map, {});
    Object.extend(Map.prototype, {
        set: function (key, value) {
            if (!this.map.hasOwnProperty(key)) {
                this.size++;
            }
            this.map[key] = value;
        },
        get: function (key) {
            if (this.map.hasOwnProperty(key)) {
                return this.map[key];
            }
            return null;
        },
        delete: function (key) {
            if (this.map.hasOwnProperty(key)) {
                this.size--;
                return delete this.map[key];
            }
            return false;
        },
        keys: function () {
            var resultArr = [];
            for (var key in this.map) {
                if (this.map.hasOwnProperty(key)) {
                    resultArr.push(key);
                }
            }
            return resultArr;
        },
        values: function () {
            var resultArr = [];
            for (var key in this.map) {
                if (this.map.hasOwnProperty(key)) {
                    resultArr.push(this.map[key]);
                }
            }
            return resultArr;
        },
        has: function (key) {
            return this.map.hasOwnProperty(key);
        },
        clear: function () {
            this.map = {};
            this.size = 0;
        }
    });

    /**
     * 数值（Number）原型对象扩展
     */
    Object.extend(Number, {});
    Object.extend(Number.prototype, {
        /**
         * 对数字格式进行千分位分隔
         * @returns {string}
         */
        format: function () {
            var value = this + '';
            var source = value.replace(/,/g, '').split('.');
            source[0] = source[0].replace(/(\d)(?=(\d{3})+$)/ig, '$1,');
            return source.join('.');
        },

        /**
         * 对数字格式进行四舍五入
         * @param length {int} 小数截断位数，默认为0
         */
        fixed: function (length) {
            if (isNaN(this))
                return 0;
            var s = Math.pow(10, Math.abs(parseInt(length || 0)));
            return parseFloat(Math.round(this * s) / s);
        },

        /**
         * 对数字格式进行单位转换
         * @param length {int} 转换的比率，默认为4，如4：相当于处以10000
         */
        unit: function (length) {
            if (isNaN(this))
                return 0;
            var len = 4;
            if (length) {
                len = length;
            }
            var num = 1;
            for (var i = 0; i < Math.abs(len); i++) {
                num *= 10;
            }
            if (len > 0) {
                return parseFloat(this / num);
            } else {
                return parseFloat(this * num);
            }
        }
    });

    /************************************************ 工具方法封装 *****************************************************/
    var App;
    App = {
        token: '',
        user: {},
        maps: [],

        /********************************************** 公共规则和组件 *************************************************/

        /**
         * 初始化 Ajax
         */
        initAjax: function () {
            $.ajaxSetup({
                global: true,
                cache: false,
                dataType: "json",
                contentEncoding: "gzip",
                contentType: 'application/json',
                headers: {
                    "Access-Token": Cookies.getCook('tokenId'),
                    "Prefer_Lang": Cookies.getCook('Prefer_Lang'),
                    "Timezone": Date.getTimezone() || 0
                }
            });
        },

        /******************************************* jquery validate的扩展 ********************************************/
        initValidate: function () {
            /**
             * extend validate language setting
             */
            $.extend($.validator.messages, {
                required: Msg.validator.required,
                remote: Msg.validator.remote,
                email: Msg.validator.email,
                url: Msg.validator.url,
                date: Msg.validator.date,
                dateISO: Msg.validator.dateISO,
                number: Msg.validator.number,
                digits: Msg.validator.digits,
                creditcard: Msg.validator.creditcard,
                equalTo: Msg.validator.equalTo,
                signsCheck: Msg.validator.signsCheck,
                maxlength: $.validator.format(Msg.validator.maxlength),
                minlength: $.validator.format(Msg.validator.minlength),
                rangelength: $.validator.format(Msg.validator.rangelength),
                range: $.validator.format(Msg.validator.range),
                max: $.validator.format(Msg.validator.max),
                min: $.validator.format(Msg.validator.min),
                /**扩展自定义message*/
                space: Msg.validator.space,
                mobile: Msg.validator.mobile,
                phone: Msg.validator.phone,
                tel: Msg.validator.tel,
                zip: Msg.validator.zip,
                currency: Msg.validator.currency,
                qq: Msg.validator.qq,
                age: Msg.validator.age,
                idcard: Msg.validator.idcard,
                ip: Msg.validator.ip,
                ipPort: Msg.validator.ipPort,
                chrnum: Msg.validator.chrnum,
                chinese: Msg.validator.chinese,
                english: Msg.validator.english,
                selectNone: Msg.validator.selectNone,
                byteRangeLength: $.validator.format(Msg.validator.byteRangeLength),
                stringCheck: Msg.validator.stringCheck,
                same: Msg.validator.same,
                semiangle: Msg.validator.semiangle,
                passwordCheck: Msg.validator.userPasswordCheck,
                PSIDCheck: Msg.validator.PSIDCheck,
                PSNameCheck: Msg.validator.PSNameCheck,
                nullCheck: Msg.validator.nullCheck,
                dateCheck: Msg.validator.dateCheck,
                percentCheck: Msg.validator.percentCheck,
                spaceString: Msg.validator.spaceString,
                onlySpace: Msg.validator.onlySpace,
                decimalLength: $.validator.format(Msg.validator.decimalLength),
                charnumber: Msg.validator.charnumber,
                specialcharnumber: Msg.validator.specialcharnumber,
                specialspaceString: Msg.validator.specialspaceString,
                textSpecialString: Msg.validator.textSpecialString,
                specialchinese: Msg.validator.specialchinese,
                minTo: Msg.validator.minTo,
                maxTo: Msg.validator.maxTo,
                numCheck: "请输入0~480000的正整数",
                port: Msg.validator.port,
                notEqualToWriteBack: Msg.validator.notEqualToWriteBack,
                perNumCheck: Msg.validator.perNumCheck,
                devNameCheck: Msg.validator.devNameCheck,
                positiveInt: Msg.validator.positiveInt,
                validateSpecicalChars: Msg.validator.specialChars,
                vacSepecialString: Msg.validator.vacSepecialString,
                lt: Msg.validator.lt,
                le: Msg.validator.le,
                gt: Msg.validator.gt,
                ge: Msg.validator.ge,
                numberCheck: Msg.validator.valNumberCheck
            });
            /**
             * extend validate methods
             */
            $.extend($.validator.methods, {
                //required: function (value, element) {
                //    return value.length > 0;
                //},
                semiangle: function (value, element) {
                    var flag = true;
                    for (var i = 0; i < value.length; i++) {
                        var strCode = value.charCodeAt(i);
                        if ((strCode > 65248) || (strCode == 12288)) {
                            flag = false;
                        }
                    }
                    return this.optional(element) || flag;
                },
                space: function (value, element) {
                    var flag = true;
                    if (value.startWith(' ') || value.endWith(' ')) {
                        flag = false;
                    }
                    return this.optional(element) || flag;
                },
                mobile: function (value, element) {
                    //var mobile = /^1\d{10}$/;
                    var mobile = /^[1][34578]\d{9}$/;
                    return this.optional(element) || (mobile.test(value));
                },
                passwordCheck: function (value, element) {//用户密码校验
                    var length = value.length;
                    var flagArr = [];
                    var flagNum, flagLow, flagUp, flagLetter, flagZf, flagCon;
                    var flag = true;
                    //	var especialChar =/^(([a-z]+[A-Z]+[0-9]+[!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~]+[!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~a-zA-Z0-9]*)|([a-z]+[A-Z]+[!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~]+[0-9]+[!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~a-zA-Z0-9]*)|([a-z]+[!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~]+[A-Z]+[0-9]+[!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~a-zA-Z0-9]*)|([a-z]+[!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~]+[0-9]+[A-Z]+[!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~a-zA-Z0-9]*)|([a-z]+[0-9]+[A-Z]+[!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~]+[!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~a-zA-Z0-9]*)|([a-z]+[0-9]+[!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~]+[A-Z]+[!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~a-zA-Z0-9]*)|([A-Z]+[a-z]+[0-9]+[!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~]+[!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~a-zA-Z0-9]*)|([A-Z]+[a-z]+[!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~]+[0-9]+[!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~a-zA-Z0-9]*)|([A-Z]+[!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~]+[a-z]+[0-9]+[!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~a-zA-Z0-9]*)|([A-Z]+[!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~]+[0-9]+[a-z]+[!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~a-zA-Z0-9]*)|([A-Z]+[0-9]+[a-z]+[!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~]+[!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~a-zA-Z0-9]*)|([A-Z]+[0-9]+[!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~]+[a-z]+[!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~a-zA-Z0-9]*)|([0-9]+[A-Z]+[a-z]+[!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~]+[!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~a-zA-Z0-9]*)|([0-9]+[A-Z]+[!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~]+[a-z]+[!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~a-zA-Z0-9]*)|([0-9]+[!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~]+[A-Z]+[a-z]+[!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~a-zA-Z0-9]*)|([0-9]+[!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~]+[a-z]+[A-Z]+[!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~a-zA-Z0-9]*)|([0-9]+[a-z]+[A-Z]+[!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~]+[!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~a-zA-Z0-9]*)|([0-9]+[a-z]+[!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~]+[A-Z]+[!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~a-zA-Z0-9]*)|([!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~]+[A-Z]+[0-9]+[a-z]+[!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~a-zA-Z0-9]*)|([!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~]+[A-Z]+[a-z]+[0-9]+[!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~a-zA-Z0-9]*)|([!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~]+[a-z]+[A-Z]+[0-9]+[!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~a-zA-Z0-9]*)|([!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~]+[a-z]+[0-9]+[A-Z]+[!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~a-zA-Z0-9]*)|([!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~]+[0-9]+[A-Z]+[a-z]+[!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~a-zA-Z0-9]*)|([!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~]+[0-9]+[a-z]+[A-Z]+[!\"#\$%&\'()*+,-./:;<=>?@[\]^_`{|}~a-zA-Z0-9]*))$/;
                    //数字
                    var regNum = /[0-9]/g;
                    //小写
                    var regLow = /[a-z]/g;
                    //大写
                    var regUp = /[A-Z]/g;
                    var regZf = /[\$\!\"\#\&\%\&\'\(\)\*\+\,\-\.\/\:\;\<\=\>\?\@\[\\\]\^\_\`\{\}\|\~\ ]/g;
                    var booFlag = false;
                    for (var j = 0; j < value.length - 2 && flag; j++) {
                        //for(var i = j+1; i < value.length; i++) {
                        //	if(value.charAt(j) == value.charAt(i)) {
                        //	flag = false;
                        //	alert(value.charAt(j) + value.charAt(i));
                        //}
                        //}
                        if ((value.charAt(j) == value.charAt(j + 1)) || (value.charAt(j + 1) == value.charAt(j + 2))) {
                            //flag = false;
                            booFlag = true;
                        }
                    }
                    //如果有连续相同的两个字符，直接返回false
                    //                if (booFlag) {
                    //                    flagCon = false;
                    //                    return this.optional(element) || flagCon;
                    //                } else {
                    //                    flagCon = true;
                    //                }
                    flagNum = regNum.test(value);
                    flagLow = regLow.test(value);
                    flagUp = regUp.test(value);
                    flagZf = regZf.test(value);
                    flagArr.push(flagNum);
                    flagArr.push(flagLow);
                    flagArr.push(flagUp);
                    flagArr.push(flagZf);
                    //flagArr.push(flagCon);
                    //数字，大写字母，小写字母，特殊字符四种情况可以任选三种
                    for (var i = 0; i < flagArr.length; i++) {
                        if (!flagArr[i]) {
                            for (var j = i + 1; j < flagArr.length; j++) {
                                if (!flagArr[j]) {
                                    flag = false;
                                    return this.optional(element) || flag;
                                }
                            }
                        }
                    }
                    return this.optional(element) || flag;
                    //return this.optional(element) || (regNum.test(value) && regLow.test(value) && regUp.test(value) && regZf.test(value) && flag);
                },
                notEqualToWriteBack: function (value, element, notEqualToWriteBackId) {
                    var val = $(notEqualToWriteBackId).val();
                    if (val) {
                        var wb = val.split("").reverse().join("");
                        if (value == wb || value == val) {
                            return this.optional(element) || false;
                        }
                    }
                    return this.optional(element) || true;
                },
                signsCheck: function (value, element) {
                    return this.optional(element) || (!value.contains(',') && !value.contains('，'));
                },
                phone: function (value, element) {
                    var tel = /^(0[0-9]{2,3}\-)?([2-9][0-9]{6,7})+(\-[0-9]{1,4})?$/;
                    return this.optional(element) || (tel.test(value));
                },
                tel: function (value, element) {
                    var tel = /(^[0-9]{3,4}[\-]{0,1}[0-9]{3,8}$)|(^[0-9]{3,8}$)|(^\([0-9]{3,4}\)[0-9]{3,8}$)|(^1\d{10}$)/;
                    return this.optional(element) || (tel.test(value));
                },
                zip: function (value, element) {
                    var tel = /^[0-9]{6}$/;
                    return this.optional(element) || (tel.test(value));
                },
                currency: function (value) {
                    return /^\d+(\.\d+)?$/i.test(value);
                },
                qq: function (value, element) {
                    var tel = /^[1-9]\d{4,9}$/;
                    return this.optional(element) || (tel.test(value));
                },
                age: function (value) {
                    return /^(?:[1-9][0-9]?|1[01][0-9]|120)$/i.test(value);
                },
                idcard: function (value) {
                    return /^\d{15}(\d{2}[A-Za-z0-9])?$/i.test(value);
                },
                ip: function (value, element) {
                    var ip = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
                    var flag1 = this.optional(element) || (ip.test(value) && (RegExp.$1 < 256 && RegExp.$2 < 256 && RegExp.$3 < 256 && RegExp.$4 < 256));
                    var ip_port = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?):)(?:[1-9]([0-9]?){4})$/;
                    var flag2 = this.optional(element) || (ip_port.test(value) && (RegExp.$1 < 256 && RegExp.$2 < 256 && RegExp.$3 < 256 && RegExp.$4 < 256 && RegExp.$5 < 65536));
                    var realm = /([a-zA-Z]+\.){2,3}[a-zA-Z]+$/;
                    var flag3 = this.optional(element) || realm.test(value);
                    return flag1 || flag2 || flag3;
                },
                ipPort: function (value, element) {
                    var ip_port = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?):)(?:[1-9]([0-9]?){4})$/;
                    var flag2 = this.optional(element) || (ip_port.test(value) && (RegExp.$1 < 256 && RegExp.$2 < 256 && RegExp.$3 < 256 && RegExp.$4 < 256 && RegExp.$5 < 65536));
                    var realm = /([a-zA-Z]+\.){2,3}[a-zA-Z]+$/;
                    var flag3 = this.optional(element) || realm.test(value);
                    return flag2 || flag3;
                },
                chrnum: function (value, element) {
                    var chrnum = /^([a-zA-Z0-9]+)$/;
                    return this.optional(element) || (chrnum.test(value));
                },
                charnumber: function (value, element) {
                    var chrnum = /^([a-zA-Z0-9\s_]+)$/;
                    return this.optional(element) || (chrnum.test(value));
                },
                specialcharnumber: function (value, element) {
                    var chrnum = /^([a-zA-Z0-9\s_\!\"\#\&\%\&\'\(\)\*\+\,\-\.\/\:\;\<\=\>\?\@\[\\\]\^\_\`\{\}\|\~\$\ ]+)$/;
                    return this.optional(element) || (chrnum.test(value));
                },
                chinese: function (value, element) {
                    var chinese = /^[\u4e00-\u9fa5]+$/;
                    return this.optional(element) || (chinese.test(value));
                },
                specialchinese: function (value, element) {
                    var chinese = /^[\u4e00-\u9fa5\u0800-\u4e00\!\"\#\&\%\&\'\(\)\*\+\,\-\.\/\:\;\<\=\>\?\@\[\\\]\^\_\`\{\}\|\~\$\ ]+$/;
                    return this.optional(element) || (chinese.test(value));
                },
                english: function (value) {
                    return /^[A-Za-z]+$/i.test(value);
                },
                selectNone: function (value, element) {
                    return value == Msg.sel;
                },
                byteRangeLength: function (value, element, param) {
                    var length = value.length;
                    for (var i = 0; i < value.length; i++) {
                        if (value.charCodeAt(i) > 127) {
                            length++;
                        }
                    }
                    return this.optional(element) || (length >= param[0] && length <= param[1]);
                },
                stringCheck: function (value, element) {
                    return this.optional(element) || (value != "null" && /^[\u0800-\u4e00\u4e00-\u9fa5\w]+$/.test(value));
                },
                same: function (value, param) {
                    if ($("#" + param[0]).val() != "" && value != "") {
                        return $("#" + param[0]).val() == value;
                    } else {
                        return true;
                    }
                },
                filterIllegal: function (value, element) {
                    var str = value;
                    str = str.replace(/</g, '&lt;');
                    str = str.replace(/>/g, '&gt;');
                    // str = str.replace(/ /g, '&nbsp;');
                    // str = str.replace(/x22/g, '&quot;');
                    // str = str.replace(/x27/g, '&#39;');
                    value = str;
                    $(element).val(value);
                    return true;
                },
                //电站ID验证，只能包含数字、字母和下划线
                PSIDCheck: function (value, element) {
                    var regPSID = /^[A-Za-z0-9_]*$/;
                    return this.optional(element) || regPSID.test(value);
                },
                //电站名称验证，首尾的引号不能相同
                PSNameCheck: function (value, element) {
                    var reg = /^(['"])(.)*\1$/;
                    return this.optional(element) || !reg.test(value);
                },
                //用户名限制不能是null
                nullCheck: function (value, element) {
                    return this.optional(element) || value.toLowerCase() != "null";
                },
                //验证日期 格式为yyyyMMdd
                dateCheck: function (value, element) {
                    value = $.trim(value);
                    var regDate = /^(?:(?!0000)[0-9]{4}(?:(?:0[1-9]|1[0-2])(?:0[1-9]|1[0-9]|2[0-8])|(?:0[13-9]|1[0-2])(?:29|30)|(?:0[13578]|1[02])31)|(?:[0-9]{2}(?:0[48]|[2468][048]|[13579][26])|(?:0[48]|[2468][048]|[13579][26])00)0229)$/;
                    return this.optional(element) || regDate.test(value);
                },
                //验证为数字(正整数、负数和零)
                numCheck: function (value, element) {
                    var regNum = /^-?\d+$/;
                    return this.optional(element) || regNum.test(value);
                },
                //限制百分比 0 ~ 100
                percentCheck: function (value, element) {
                    var num = Number(value);
                    var flag = false;
                    if (num || num == 0) {
                        if (num >= 0 && num <= 100) {
                            flag = true;
                        }
                    }
                    return this.optional(element) || flag;
                },
                //检测只有中文、英文、空格、数字和下划线，不包含中文的特殊字符
                spaceString: function (value, element) {
                    var reg = /^[\u0391-\uFFE5\w\&\s]+$/;
                    var regChar = /[！…￥（）—，。“”：；、？【】《》]/;
                    var flag = reg.test(value) && !regChar.test(value);
                    return this.optional(element) || flag;
                },
                //spaceString的包含特殊字符版本
                specialspaceString: function (value, element) {
                    var reg = /^[\u0391-\uFFE5\w\s\!\"\#\&\%\&\'\(\)\*\+\,\-\.\/\:\;\<\=\>\?\@\[\\\]\^\_\`\{\}\|\~\$\ ]+$/;
                    var regChar = /[！…￥（）—，。“”：；、？【】《》]/;
                    var flag = reg.test(value) && !regChar.test(value);
                    return this.optional(element) || flag;
                },
                //文本特殊字符排除(文本中不能包含&(排除html实体字符),<>(排除html标签符))
                textSpecialString: function (value, element) {
                    var regChar = /[&<>]/;
                    var flag = !regChar.test(value);
                    return this.optional(element) || flag;
                },
                //限制不能输入空格(半角和全角下的空格)
                onlySpace: function (value, element) {
                    value = $.trim(value);
                    if (value == '') {
                        return this.optional(element) || false;
                    }
                    return this.optional(element) || true;
                },
                //限制小数点后位数
                decimalLength: function (value, element, param) {
                    if (!isNaN(value)) {
                        var dot = value.indexOf(".");
                        if (dot != -1) {
                            var len = value.substring(dot + 1).length;
                            if (len > param) {
                                return this.optional(element) || false;
                            }
                        }
                    }
                    return this.optional(element) || true;
                },
                // 是否比指定元素值小
                minTo: function (value, element, param) {
                    var m = $(param).val();
                    return this.optional(element) || +value < +m
                },
                // 是否比指定元素值大
                maxTo: function (value, element, param) {
                    var m = $(param).val();
                    return this.optional(element) || +value > +m
                },
                lt: function (value, element, param) {
                    return this.optional(element) || value < param;
                },
                le: function (value, element, param) {
                    return this.optional(element) || value <= param;
                },
                gt: function (value, element, param) {
                    return this.optional(element) || value > param;
                },
                ge: function (value, element, param) {
                    return this.optional(element) || value >= param;
                },
                numberCheck: function(value, element, param) {
                    return this.optional(element) || $.isNumeric(value);
                },
                port: function (value) {
                    var regex = /^([0-9]|[1-9]\d|[1-9]\d{2}|[1-9]\d{3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])$/;
                    return regex.test(value);
                },
                /**
                 * 电话验证
                 * 可输入11位手机或座机（010-XXXXXXXX，0731-XXXXXXX）
                 */
                vacTel: function (tel) {
                    var machPhone = tel.match(/(?:\(?[0\+]?\d{1,3}\)?)[\s-]?(?:0|\d{1,4})[\s-]?(?:(?:13\d{9})|(?:\d{7,8}))/g);
                    if (machPhone && machPhone.length == 1 && tel == machPhone[0]) {
                        return true;
                    }
                    var machTel = tel.match(/(?:\(?[0\+]\d{2,3}\)?)[\s-]?(?:(?:\(0{1,3}\))?[0\d]{1,4})[\s-](?:[\d]{7,8}|[\d]{3,4}[\s-][\d]{3,4})/g);
                    if (machTel && machTel.length == 1 && tel == machTel[0]) {
                        return true;
                    }
                    return false;
                },

                /**
                 * 用户名验证
                 * 不可输入['<', '>', '$']
                 * @param userName 用户名
                 * @param maxLength 输入长度最大值 默认64位
                 * @param minLength 输入长度最小值 默认1位
                 */
                vacUserName: function (userName, maxLength, minLength) {
                    if (!maxLength) {
                        maxLength = 64;
                    }
                    if (!minLength) {
                        minLength = 1;
                    }
                    var nameLength = userName.length;
                    if (nameLength > maxLength || nameLength < minLength || userName.trim() == 'null') {
                        return false;
                    }
                    var speChara = ['<', '>', '|','’','?','&',','];
                    for (var i = 0; i < speChara.length; i++) {
                        if (userName.indexOf(speChara[i]) != -1) {
                            return false;
                        }
                    }
                    return true;
                },

                /**
                 * 密码验证
                 * @param password 密码
                 * @param maxLength 输入长度最大值 默认64位
                 * @param minLength 输入长度最小值 默认6位
                 */
                vacPassword: function (password, maxLength, minLength) {
                    if (!maxLength) {
                        maxLength = 64;
                    }
                    if (!minLength) {
                        minLength = 6;
                    }
                    var pwdLength = password.length;
                    if (pwdLength < minLength || pwdLength > maxLength) {
                        return false;
                    }
                    var pwd = password;
                    var regpwd = /[0-9a-zA-Z]/g;
                    if(regpwd.test(pwd)){
        				pwd = pwd.replace(regpwd,'');
        			}
                    var regZf = /[\!\"\#\$\%\&\'\(\)\*\+\,\-\.\/\:\;\<\=\>\?\@\[\\\]\^\_\`\{\}\|\~]/g;
                    if(regZf.test(pwd)){
        				pwd = pwd.replace(regZf,'');
        			}
                    if(pwd.length>0){
        				return false;
        			}
                    return true;
                },

                /**
                 * 登录名验证
                 * 不可输入['<', '>', '$']
                 * @param loginName 登录名
                 * @param maxLength 输入长度最大值 默认64位
                 * @param minLength 输入长度最小值 默认1位
                 */
                vacLoginName: function (loginName, maxLength, minLength) {
                    if (!maxLength) {
                        maxLength = 64;
                    }
                    if (!minLength) {
                        minLength = 1;
                    }
                    var nameLength = loginName.length;
                    if (nameLength > maxLength || nameLength < minLength || loginName.trim()=='null') {
                        return false;
                    }
                    var speChara = ['<', '>', '|','’','?','&',',',' '];
                    for (var i = 0; i < speChara.length; i++) {
                        if (loginName.indexOf(speChara[i]) != -1) {
                            return false;
                        }
                    }
                    return true;
                },

                /**
                 * QQ验证 只能输入数字
                 */
                vacQQ: function (qq) {
                    var vac = /^[0-9]*$/;
                    if (!vac.test(qq)) {
                        return false;
                    }
                    return true;
                },

                vacMail: function (mail) {
                	var vac = /\w[-\w.+]*@([A-Za-z0-9][-A-Za-z0-9]+\.)+[A-Za-z]{2,14}$/;
                    if (!vac.test(mail)) {
                        return false;
                    }
                    return true;
                },
                /*
                 * 1-365校验
                 */
                dayOfyear: function (value, element) {
                    var reg = /^(0|[1-9][0-9]*|-[1-9][0-9]*)$/;
                    var flag = reg.test(value);//整数
                    if (flag && value >= 1 && value <= 365) {
                        flag = true;
                    } else {
                        flag = false;
                    }
                    return this.optional(element) || flag;
                },

                /**
                 * 校验(0,100]的数据，小数点不超过param位
                 */
                perNumCheck: function (value, elemet, param) {
                    var reg = "/^\\d{1,3}(.\\d{1," + param + "}){0,1}$/";
                    if (!main.eval(reg).test(value))
                        return false;
                    var num = Number(value);
                    if (num > 0 && num <= 100)
                        return true;
                    return false;
                },

                /**
                 * 名称验证，不包括< ' > & "
                 */
                devNameCheck: function (value, element, type) {
                    var reg = /^[^\'\<\>,\/\&\"'|]*$/;
                    return this.optional(element) || (reg.test(value) && !value.contains("null"));
                },

                /**
                 * 端口校验
                 */
                vacPort: function (value) {
                    var regex = /^([0-9]|[1-9]\d|[1-9]\d{2}|[1-9]\d{3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])$/;
                    return regex.test(value);
                },


                /**
                 * 名称类特殊字符校验：
                 * 不包含| < > ' , & /
                 */
                vacSepecialString: function (value) {
                    var regChar = /[\|, <, >, ', \,, &, \/]/;
                    var flag = regChar.test(value) || value.contains("null");
                    return !flag;
                },

                /**
                 * 特殊字符校验：
                 * 不包含| < > ' ", & \ / { } null
                 * 不包含上述特殊字符，返回 true, 否则返回false
                 */
                validateSpecicalChars: function (value) {

                    var regChar = /[\|, <, >, ',\", \,, &, \\,\/,{,}]/;
                    var flag = regChar.test(value) || value.contains("null");
                    return !flag;
                },


                /**
                 * 正整数
                 */
                positiveInt: function (value) {
                    var regChar = /^[0-9]*[1-9][0-9]*$/;
                    return regChar.test(value);
                },
                
                vacCombinerDCVolt: function(value, element, type) {
                	var reg = /^[1-9]\d{2,3}$/;
                	if (!reg.test(value))
                		return false;
                    var num = Number(value);
                    if (num >= 300 && num <= 1000)
                        return true;
                    return false;
                },
                /**
                 * 校验2级域设备数和用户数
                 */
                vacMaxDevAndUserNum: function(value, element, type) {
                	var reg = /^[1-9]\d{0,8}$/;
                	if (reg.test(value))
                		return true;
                	return false;
                },
                /**
                 * 校验2级域装机容量
                 */
                vacMaxInstallCap: function(value, element, type) {
                	var reg = /^(?:[1-9]\d{0,9}|0)(?:\.\d{1,3})?$/;
                	if (reg.test(value) && value > 0)
                		return true;
                	return false;
                }
                

            });
        },

        /***************************************** Dialog 弹出框扩展封装 *************************************/
        /**
         * 模态弹出框
         * @param options {Object}
         * <pre>
         * { <br>
         *       id: "modal",//弹窗id <br>
         *       title: "dialog",//弹窗标题 <br>
         *       width: 600,//弹窗内容宽度，不支持% <br>
         *       height: 500,//弹窗内容高度,不支持%  <br>
         *       maxHeight: null,//弹窗内容最大高度, 不支持% <br>
         *       appendTo: '#main_view',//弹出框父元素选择器  <br>
         *       modal: true,//是否为模态弹出框<br>
         *       keyboard: true,//是否开启esc键退出，和原生bootstrap 模态框一样 <br>
         *       buttons: [], //按钮分配, 参数：id: 按钮id; text: 按钮文本; click: 按钮点击回调函数; clickToClose: true 点击按钮是否关闭弹出框 <br>
         *       content: "",//加载静态内容 <br>
         *       openEvent: null,//弹窗打开后回调函数 <br>
         *       closeEvent: null,//弹窗关闭后回调函数 <br>
         *       isdrag: true //点击header是否能够拖动,默认可拖动 <br>
         * } <br>
         * </pre>
         * @returns {jQuery}
         */
        dialog: function (options) {
            var defaults = {
                id: "modal" + (new Date().getTime()),
                title: "",
                width: 270,
                height: 60,
                maxHeight: document.documentElement.clientHeight - 42,
                appendTo: 'body',
                backdrop: false,
                modal: true,
                keyboard: true,
                content: "",
                openEvent: null,
                closeEvent: null,
                isdrag: true
            };

            //动态创建窗口
            var dialog = {
                init: function (opts) {
                    var _self = this;

                    //动态插入窗口
                    var d = _self.dHtml(opts);
                    if ($("#" + opts.id).length > 0) {
                        $("#" + opts.id).remove();
                        App.dialogZIndex--;
                        App.dialogZIndex > 940
                            ? $(opts.appendTo || "body").addClass('modal-open')
                            : $(opts.appendTo || "body").removeClass('modal-open');
                    }
                    $(':focus').blur();
                    $(opts.appendTo || "body").append(d);

                    var modal = $("#" + opts.id);
                    //初始化窗口
                    modal.modal(opts);
                    //窗口位置
                    $('.modal-dialog', modal).resize(function () {
                        _self.resize($(this));
                    });
                    modal.resize(function () {
                        _self.resize($('.modal-dialog', modal));
                    });
                    _self.resize($('.modal-dialog', modal));
                    //窗口层级
                    $(modal).css('z-index', App.dialogZIndex++);
                    //设置为模态窗口
                    opts.modal && modal.addClass('modal-overlay');
                    modal
                        //隐藏窗口后删除窗口对话框
                        //.on('hide.bs.modal', function () {
                        //    //$(':focus').blur();
                        //    $('#iemsDatePicker').hide();
                        //    $('._ztreeInputDiv').remove();
                        //    //$('body').mousedown();
                        //})
                        .on('hidden.bs.modal', function () {
                            modal.remove();
                            if (opts.closeEvent) {
                                opts.closeEvent();
                            }
                            App.dialogZIndex--;
                            App.dialogZIndex > 940
                                ? $(opts.appendTo || "body").addClass('modal-open')
                                : $(opts.appendTo || "body").removeClass('modal-open');
                        })
                        //窗口显示后
                        .on('shown.bs.modal', function () {
                            if (opts.openEvent) {
                                opts.openEvent();
                            }
                        })
                        //显示窗口
                        .modal('show');
                    return $('.modal-body', modal);
                },
                dHtml: function (o) {
                    var context = $('<div/>').attr('id', o.id).addClass('modal fade show')
                        .attr('role', 'dialog').attr('aria-labelledby', o.id + '_modalLabel').attr('aria-hidden', true);
                    var content = $('<div/>').addClass('modal-content');
                    var header = $('<div/>').addClass('modal-header');
                    var body = $('<div/>').addClass('modal-body').css({
                        'height': o.height,
                        'max-height': o.maxHeight || (window.screen.height - 120)
                    });

                    var closeBtn = $('<button/>').addClass('close').attr('data-dismiss', 'modal')
                        .attr('aria-hidden', true).text('×').on("mousedown", function (e) {
                            e.stopPropagation();
                        });
                    var title = $('<p/>').addClass('modal-title').html(o.title);
                    title.css("cursor", "default");
                    header.append(closeBtn).append(title);
                    if (o.isdrag) { // 拖曳
                        var _mousex, _mousey, headx, heady;
                        title.css("cursor", "move");
                        header.css("cursor", "move").on("mousedown", function (e) {
                            if (!e) {
                                e = window.event; // for IE
                            }
                            var offset = $(this).offset();    // header位置
                            headx = parseInt(offset.left, 10), heady = parseInt(offset.top, 10);
                            // 拖拽时鼠标位置
                            _mousex = e.pageX, _mousey = e.pageY;
                            // mousedown后添加拖动事件
                            // 绑定到document保证不因为卡顿窗口跟不上鼠标使光标脱离事件停顿
                            $(document).off("mousemove").on("mousemove", function (e) {
                                //move后窗口左上角位置
                                var x = headx + (e.pageX - _mousex),
                                    y = heady + (e.pageY - _mousey);

                                if (x + header.parents(".modal-dialog").width() <= 40) {   // 左右越界判断
                                    x = 40 - header.parents(".modal-dialog").width();
                                } else if (x >= $(window).width() - 40) {
                                    x = $(window).width() - 40;
                                }
                                if (y <= 0) {   // 上下越界判断
                                    y = 0;
                                } else if (y >= $(window).height() - 40) {
                                    y = $(window).height() - 40;
                                }
                                header.parents(".modal-dialog").css({
                                    "left": x + "px",
                                    "top": y + "px",
                                    "position": "absolute"
                                }); //设置新位置
                                return false;
                            });
                        });
                        $(document).on("mouseup", function () {
                            $(document).off("mousemove");   // 鼠标弹起后取消拖动事件
                        });
                    }

                    var $con = $('<div/>').addClass('iems-modal-content').append(o.content || "");
                    body.append($con);

                    var footer = $('<div/>').addClass('modal-footer');
                    //btn配置
                    if (o.buttons && o.buttons.length > 0) {
                        $.each(o.buttons, function (i, t) {
                            var btn = $('<button/>').addClass('btn modal-btn').addClass(this.type || '')
                                .attr("id", this.id).text(this.text || 'Submit').attr('aria-hidden', true);
                            t.clickToClose && btn.attr('data-dismiss', 'modal');
                            t.click && btn.click(function (e) {
                                t.click(e, context, this);
                            });

                            footer.append(btn);
                        });
                    }

                    context.append(
                        $('<div/>').addClass('modal-dialog').css({
                            'width': o.width,
                            'padding': 0
                        }).append(content.append(header).append(body).append(footer))
                    );

                    var scrollBarWidth = body.get(0).offsetWidth - body.get(0).scrollWidth;
                    scrollBarWidth > 0 && body.css({'padding-right': scrollBarWidth + 15});

                    return context;
                },
                close: function () {
                    $(".modal").modal("hide");
                },
                resize: function (modal) {
                    var mw = $(window).width() - $(modal).width();
                    var mh = $(window).height() - $(modal).height() - 5;
                    $(modal).css({
                        'top': mh > 0 ? (mh / 2.5) : 0,
                        'left': mw > 0 ? (mw / 2) : 0
                    });
                }
            };
            if (options == "close") {
                return dialog.close();
            }
            var opts = $.extend({}, defaults, options);

            return dialog.init(opts);
        },
        dialogZIndex: 940,

        /**
         * 消息提示框
         * @param p {Object} 参数设置
         * @param c {Function} 点击“OK”按钮或者关闭弹出框回调方法
         *     <pre>
         *     例如： App.alert({id: id, title: "title", message: "Content", ……}, function () { …… });
         *     </pre>
         * @returns {*}
         */
        alert: function (p, c) {
            if (!p) return;

            var content = App.getClassOf(p) == 'String' ? p : p.message;
            var setting = {
                title: Msg.info,
                width: 320,
                height: 'auto',
                content: content || '',
                buttons: p.buttons || [
                    {
                        id: 'okId',
                        type: 'submit',
                        text: Msg.sure || 'OK',
                        clickToClose: true
                    }
                ],
                closeEvent: function () {
                    if (c)
                        c();
                }
            };
            if (App.getClassOf(p) == "String") {
                setting.message = p;
            }
            $.extend(setting, p);

            return App.dialog(setting);
        },

        /**
         * 确认询问框
         * @param p {Object} 参数设置
         * @param c {Function} 点击OK回调方法
         * @param r {Function} 点击Cancel回调方法
         *      例如:
         *      App.confirm({type: "confirm", title: "TITLE", message: "Message"}, funtion(){...(okEvent)}, funtion(){...(closeEvent)});
         */
        confirm: function (p, c, r) {
            if (!p) return;

            var content = App.getClassOf(p) == 'String' ? p : p.message;
            var setting = {
                title: Msg.info,
                width: 320,
                height: 'auto',
                content: content || '',
                buttons: p.btns || [
                    {
                        id: 'okId',
                        type: 'submit',
                        text: Msg.sure || 'OK',
                        clickToClose: true,
                        click: function (e, d) {
                            if (c) {
                                c();
                            }
                        }
                    },
                    {
                        id: 'cancelId',
                        type: 'cancel',
                        text: Msg.cancel || 'Cancel',
                        clickToClose: true
                    }
                ],
                closeEvent: function () {
                    if (r)
                        r();
                }
            };
            $.extend(setting, p);
            return App.dialog(setting);
        },

        /**
         * 用户输入响应框
         * @param id     input输入框的id
         * @param p      参数设置{(Object/String)}
         *              {id: "(modal弹窗id)",
                         title:"标题",
                         content:"静态html内容(默认为input标签)",
                         okEvent: "(Function)",
                         closeEvent: "(Function)"}
         * @param c      okEvent 确认回调方法{Function}
         * @param r      closeEvent 窗口关闭回调方法{Function}
         * @returns {*}
         */
        prompt: function (id, p, c, r) {
            var proInput = $('<input type="text" id=' + id + ' name="' + id + '" style="width: 90%;">');
            var setting = {
                title: Msg.info,
                content: (p && p.content) || proInput,
                width: 320,
                height: 'auto',
                buttons: (p && p.btns) || [
                    {
                        id: 'okId',
                        text: Msg.sure || 'OK',
                        click: function (e, d) {
                            var val = $('#' + id).val();
                            if (c) {
                                c(val, d);
                            }
                        }
                    },
                    {
                        id: 'cancelId',
                        type: 'cancel',
                        text: Msg.cancel || 'Cancel',
                        clickToClose: true
                    }
                ],
                closeEvent: function () {
                    if (r) {
                        r();
                    }
                }
            };
            $.extend(setting, p);
            return App.dialog(setting);
        },

        /**
         * 获取对象的类名，自定义的任何类返回'Object'
         * @param o 任意类型
         * @returns {String} 返回ECMAScript中预定义的六种类型之一，首写字母为大写
         */
        getClassOf: function (o) {
            if (o === null)return 'Null';
            if (o === undefined)return 'Undefined';
            return Object.prototype.toString.call(o).slice(8, -1);
        },

        /**
         * 业务公共前端方法,统一拦截特殊字符
         */
        dealSpecialSign: function (obj) {
            var signArray = ["%", "\\", "_", "-", "/", "."]; //需要做转义请在此添加
            var temp = obj + "";
            var tempArray = [];
            var flag = false;
            if (temp.indexOf("[") > -1) {
                flag = true;
            }
            if (!flag) {
                //针对邪恶‘\’特殊处理
                for (var k = 0; k < temp.length; k++) {
                    tempArray.push(temp.charAt(k));
                }
                for (var h = 0; h < tempArray.length; h++) {
                    if (signArray.contains(tempArray[h] + "")) {
                        if (tempArray[h] == "\\") {
                            tempArray[h] = "\\\\";
                        } else {
                            tempArray[h] = "\\" + tempArray[h];
                        }
                    }
                }
                //组装返回字符
                var tempStr = "";
                for (var y = 0; y < tempArray.length; y++) {
                    tempStr += tempArray[y];
                }
                obj = tempStr;
            }
            return obj;
        },

        /**
         * 货币转换
         * @param value
         */
        unitTransform:function(value){
            var result = {};
            var unit = App.getCurrencyUnit();
            result.value = parseFloat(value).fixed(2).toFixed(2);
            result.unit = unit;
            return result;
        },
        getCurrencyUnit:function(){
            var currency = Cookies.getCook('currency');
            var unit;
            switch (currency){
                case '1':
                    unit = '¥';
                    break;
                case '2':
                    unit = '$';
                    break;
                case '3':
                    unit = '¥';
                    break;
                case '4':
                    unit = '€';
                    break;
                case '5':
                    unit = '£';
                    break;
                default:
                    unit = '¥';
                    break;
            }
            return unit;
        }
    };

    /**
     * 定义一个模块
     * @param moduleName {String} 模块名称
     * @param fn {Function} 模块体
     */
    App.Module = function (moduleName, fn) {
        (function ($) {
            var config = App.Module[moduleName];
            if (typeof define === "function" && define.amd) {
                var deps = config.importList || ['jquery'];
                define(deps, function () {
                    var module = $.extend({
                        Render: fn.apply(this, arguments).Render || fn.apply(this, arguments)
                    }, fn.apply(this, arguments));
                    module.config = config;
                    return module;
                });
            } else {
                App.Module[moduleName] = $.extend({
                    Render: fn().Render || fn()
                }, fn());
                App.Module[moduleName].config = config;
            }
        })(jQuery);
    };

    /**
     *
     * @param { Object } moduleConfig 配置，结构如下：
     * <pre>
     * {<br>
     *     package: {String} 模块所在的包路径,<br>
     *     moduleName: {String} 模块名称,<br>
     *     moduleDescription: {String} 模块描述,<br>
     *     importList: {Array} 依赖模块列表<br>
     * }
     * </pre>
     * @returns {*} 配置结果
     */
    App.Module.config = function (moduleConfig) {
        var config = $.extend({
            package: '',
            moduleName: '',
            description: '',
            importList: []
        }, moduleConfig);

        App.Module[config.moduleName] = config;

        return config;
    };

    return App;
});

/**
 * Map 类型定义
 * @param obj
 * @constructor
 */
function Map(obj) {
    this.map = {};
    this.size = 0;
}
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJtYWluL0FwcC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogMe+8jOezu+e7n+WfuuehgOaWueazlSB7QGNvZGUgQXBwLlhYWH1cclxuICogMu+8jOWOn+Wei+aJqeWxlSB7QGNvZGUgT2JqZWN0LmV4dGVuZCguLi4pfVxyXG4gKiAz77yManF1ZXJ55omp5bGV5pa55rOV5Y+K5a+56aqM6K+B6KeE5YiZ55qE5omp5bGVIHtAY29kZSAkT2JqZWN0LlhYWH1cclxuICogNO+8jOaVsOaNruiuv+mXruaWueazlSB7QGNvZGUgQXBwLmh0dHAuWFhYfVxyXG4gKlxyXG4gKiBAYXV0aG9yIFAwMDAzNFxyXG4gKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5kZWZpbmUoWydqcXVlcnknLCAnbWFpbi9yaWdodCddLCBmdW5jdGlvbiAoJCwgTWVudSkge1xyXG5cclxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKuWOn+Wei+aJqeWxlSoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHRhcmdldCDnm67moIflr7nosaHjgIJcclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBzb3VyY2Ug5rqQ5a+56LGh44CCXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGVlcCDmmK/lkKblpI3liLYo57un5om/KeWvueixoeS4reeahOWvueixoeOAglxyXG4gICAgICogQHJldHVybnMge09iamVjdH0g6L+U5Zue57un5om/5LqGc291cmNl5a+56LGh5bGe5oCn55qE5paw5a+56LGh44CCXHJcbiAgICAgKi9cclxuICAgIE9iamVjdC5leHRlbmQgPSBmdW5jdGlvbiAodGFyZ2V0LCBzb3VyY2UsIGRlZXApIHtcclxuICAgICAgICB0YXJnZXQgPSB0YXJnZXQgfHwge307XHJcbiAgICAgICAgdmFyIHNUeXBlID0gdHlwZW9mIHNvdXJjZSwgaSA9IDEsIG9wdGlvbnM7XHJcbiAgICAgICAgaWYgKHNUeXBlID09PSAndW5kZWZpbmVkJyB8fCBzVHlwZSA9PT0gJ2Jvb2xlYW4nKSB7XHJcbiAgICAgICAgICAgIGRlZXAgPSBzVHlwZSA9PT0gJ2Jvb2xlYW4nID8gc291cmNlIDogZmFsc2U7XHJcbiAgICAgICAgICAgIHNvdXJjZSA9IHRhcmdldDtcclxuICAgICAgICAgICAgdGFyZ2V0ID0gdGhpcztcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHNUeXBlICE9PSAnb2JqZWN0JyAmJiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoc291cmNlKSAhPT0gJ1tvYmplY3QgRnVuY3Rpb25dJylcclxuICAgICAgICAgICAgc291cmNlID0ge307XHJcbiAgICAgICAgd2hpbGUgKGkgPD0gMikge1xyXG4gICAgICAgICAgICBvcHRpb25zID0gaSA9PT0gMSA/IHRhcmdldCA6IHNvdXJjZTtcclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgbmFtZSBpbiBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNyYyA9IHRhcmdldFtuYW1lXSwgY29weSA9IG9wdGlvbnNbbmFtZV07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRhcmdldCA9PT0gY29weSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRlZXAgJiYgY29weSAmJiB0eXBlb2YgY29weSA9PT0gJ29iamVjdCcgJiYgIWNvcHkubm9kZVR5cGUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldFtuYW1lXSA9IHRoaXMuZXh0ZW5kKHNyYyB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAoY29weS5sZW5ndGggIT0gbnVsbCA/IFtdIDoge30pLCBjb3B5LCBkZWVwKTtcclxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChjb3B5ICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldFtuYW1lXSA9IGNvcHk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaSsrO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGFyZ2V0O1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIOWtl+espuS4su+8iFN0cmluZ++8ieWOn+Wei+WvueixoeaJqeWxlVxyXG4gICAgICovXHJcbiAgICBPYmplY3QuZXh0ZW5kKFN0cmluZywge1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiDlrZfnrKbkuLLmoLzlvI/ljJZcclxuICAgICAgICAgKiDkvovlrZA6XHJcbiAgICAgICAgICogU3RyaW5nLmZvcm1hdChcInswfXsxfVwiLCBcImhlbGxvXCIsIFwid29ybGRcIik7XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgZm9ybWF0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09IDApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciBmb3JtYXRTdHIgPSBhcmd1bWVudHNbMF07XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBmb3JtYXRTdHIgPSBmb3JtYXRTdHIucmVwbGFjZShuZXcgUmVnRXhwKCdcXFxceycgKyAoaSAtIDEpICsgJ1xcXFx9JywgJ2dtJyksIGFyZ3VtZW50c1tpXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGZvcm1hdFN0cjtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIE9iamVjdC5leHRlbmQoU3RyaW5nLnByb3RvdHlwZSwge1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOS7juWtl+espuS4suS4reW3puOAgeWPs+aIluS4pOerr+WIoOmZpOepuuagvOOAgVRhYuOAgeWbnui9puespuaIluaNouihjOespuetieepuueZveWtl+esplxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRyaW06IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVwbGFjZSgvKF5cXHMqKXwoXFxzKiQpL2csIFwiXCIpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgbHRyaW06IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVwbGFjZSgvKF5cXHMqKS9nLCBcIlwiKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHJ0cmltOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlcGxhY2UoLyhcXHMqJCkvZywgXCJcIik7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBIVE1M6L2s5LmJ5a2X56ymXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgcmVwbGFjZUhUTUxDaGFyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlcGxhY2UoLyZhbXA7L2csICcmJykucmVwbGFjZSgvJmx0Oy9nLCAnPCcpLnJlcGxhY2UoLyZndDsvZywgJz4nKS5yZXBsYWNlKC8mbmJzcDsvZywgJyAnKS5yZXBsYWNlKC8mcXVvdDsvZywgJ1xcXCInKS5yZXBsYWNlKC8mIzM5Oy9nLCAnXFwnJyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiDovazkuYnnibnmrorlrZfnrKZcclxuICAgICAgICAgKi9cclxuICAgICAgICByZXBsYWNlSWxsZWdhbENoYXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVwbGFjZSgvJi9nLCAnJmFtcDsnKS5yZXBsYWNlKC88L2csICcmbHQ7JykucmVwbGFjZSgvPi9nLCAnJmd0OycpLnJlcGxhY2UoLyAvZywgJyZuYnNwOycpLnJlcGxhY2UoL1xcXFxcIi9nLCAnJnF1b3Q7JykucmVwbGFjZSgvXFxcXCcvZywgJyYjMzk7Jyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiDku6XmjIflrprlrZfnrKbkuLLljLnphY3lrZfnrKbkuLLlpLTpg6jmiJblsL7pg6jvvIznm7jlkIzml7bov5Tlm550cnVlXHJcbiAgICAgICAgICogQGF1dGhvciBjV1gyMzU4ODFcclxuICAgICAgICAgKi9cclxuICAgICAgICBlbmRXaXRoOiBmdW5jdGlvbiAoc3RyKSB7XHJcbiAgICAgICAgICAgIGlmIChzdHIgPT0gbnVsbCB8fCBzdHIgPT0gXCJcIiB8fCB0aGlzLmxlbmd0aCA9PSAwXHJcbiAgICAgICAgICAgICAgICB8fCBzdHIubGVuZ3RoID4gdGhpcy5sZW5ndGgpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIHJldHVybiAodGhpcy5zdWJzdHJpbmcodGhpcy5sZW5ndGggLSBzdHIubGVuZ3RoKSA9PSBzdHIpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc3RhcnRXaXRoOiBmdW5jdGlvbiAoc3RyKSB7XHJcbiAgICAgICAgICAgIGlmIChzdHIgPT0gbnVsbCB8fCBzdHIgPT0gXCJcIiB8fCB0aGlzLmxlbmd0aCA9PSAwXHJcbiAgICAgICAgICAgICAgICB8fCBzdHIubGVuZ3RoID4gdGhpcy5sZW5ndGgpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIHJldHVybiAodGhpcy5zdWJzdHIoMCwgc3RyLmxlbmd0aCkgPT0gc3RyKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOiOt+WPllVSTOS8oOmAkuWPguaVsOS4reaMh+WumuWPguaVsOWQjeensOeahOWAvFxyXG4gICAgICAgICAqIEBwYXJhbSBuYW1lIHtTdHJpbmd9IOWPguaVsOWQjeensFxyXG4gICAgICAgICAqIEByZXR1cm5zIHtPYmplY3R9IOi/lOWbnuWAvFxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGdldFZhbHVlOiBmdW5jdGlvbiAobmFtZSkge1xyXG4gICAgICAgICAgICB2YXIgcmVnZXggPSBuZXcgUmVnRXhwKFwiKF58JilcIiArIG5hbWUgKyBcIj0oW14mXSopKCZ8JClcIik7XHJcbiAgICAgICAgICAgIHZhciBiID0gdGhpcy5zdWJzdHIodGhpcy5pbmRleE9mKFwiXFw/XCIpICsgMSkubWF0Y2gocmVnZXgpO1xyXG4gICAgICAgICAgICBpZiAoYiAmJiBiICE9IG51bGwpIHJldHVybiB1bmVzY2FwZShiWzJdKTtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiDlr7nmlbDlrZflrZfnrKbkuLLmoLzlvI/ov5vooYzlsI/mlbDmiKrmlq1cclxuICAgICAgICAgKiBAcGFyYW0gbGVuZ3RoIHtJbnR9IOWwj+aVsOaIquaWreS9jeaVsFxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGZpeGVkOiBmdW5jdGlvbiAobGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGlmIChpc05hTih0aGlzKSlcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICByZXR1cm4gcGFyc2VGbG9hdChOdW1iZXIodGhpcykuZml4ZWQobGVuZ3RoKSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiDlr7nmlbDlrZfmoLzlvI/ov5vooYzljZXkvY3ovazmjaJcclxuICAgICAgICAgKiBAcGFyYW0gbGVuZ3RoIHtJbnR9IOi9rOaNoueahOavlOeOh++8jOm7mOiupOS4ujTvvIzlpoI077ya55u45b2T5LqO5aSE5LulMTAwMDBcclxuICAgICAgICAgKi9cclxuICAgICAgICB1bml0OiBmdW5jdGlvbiAobGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGlmIChpc05hTih0aGlzKSlcclxuICAgICAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgICAgICByZXR1cm4gcGFyc2VGbG9hdChOdW1iZXIodGhpcykudW5pdChsZW5ndGgpKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOWvueaVsOWtl+agvOW8j+i/m+ihjFxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGZvcm1hdDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSB0aGlzO1xyXG4gICAgICAgICAgICB2YXIgc291cmNlID0gdmFsdWUucmVwbGFjZSgvLC9nLCAnJykuc3BsaXQoJy4nKTtcclxuICAgICAgICAgICAgc291cmNlWzBdID0gc291cmNlWzBdLnJlcGxhY2UoLyhcXGQpKD89KFxcZHszfSkrJCkvaWcsICckMSwnKTtcclxuICAgICAgICAgICAgcmV0dXJuIHNvdXJjZS5qb2luKCcuJyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiDliKTmlq3lrZfnrKbkuLLkuK3mmK/lkKbljIXlkKvmjIflrprlrZfnrKbkuLJcclxuICAgICAgICAgKi9cclxuICAgICAgICBjb250YWluczogZnVuY3Rpb24gKHN0cikge1xyXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSB0aGlzO1xyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWUuaW5kZXhPZihzdHIpID4gLTE7XHJcblxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZW5jcnlwdDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcyA9PSB1bmRlZmluZWQgfHwgdGhpcyA9PSBudWxsIHx8IHRoaXMgPT0gXCJcIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIGxlbmd0aCA9IHRoaXMubGVuZ3RoO1xyXG4gICAgICAgICAgICB2YXIgY2hhckFycmF5ID0gW107XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGNoYXJBcnJheVtpXSA9IHRoaXMuY2hhckNvZGVBdChpKTtcclxuICAgICAgICAgICAgICAgIGNoYXJBcnJheVtpXSA9IGNoYXJBcnJheVtpXSAqIDI7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBjaGFyQXJyYXkudG9TdHJpbmcoKS5yZXBsYWNlKC8sL2csIFwiQFwiKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIOaXpeacn+aXtumXtO+8iERhdGXvvInljp/lnovlr7nosaHmianlsZVcclxuICAgICAqL1xyXG4gICAgT2JqZWN0LmV4dGVuZChEYXRlLCB7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog5bCG5pel5pyf5qC85byP5a2X56ym5Liy6L2s5o2i5Li6RGF0ZeWvueixoVxyXG4gICAgICAgICAqIEBwYXJhbSBzdHJEYXRlIHtTdHJpbmd9IOaMh+WumuagvOW8j+eahOaXtumXtOWtl+espuS4su+8jOW/heWhq1xyXG4gICAgICAgICAqIEBwYXJhbSBmbXQge1N0cmluZ30g5qC85byP77yM6buY6K6kJ3l5eXktTU0tZGQgSEg6bW06c3MgUydcclxuICAgICAgICAgKiBAcGFyYW0gdGltZVpvbmUge051bWJlcn0g5pe25Yy6IO+8jOWmgiAtOCDooajnpLog6KW/OOWMuu+8jOm7mOiupOS4uiDmk43kvZzns7vnu5/ml7bljLpcclxuICAgICAgICAgKi9cclxuICAgICAgICBwYXJzZTogZnVuY3Rpb24gKHN0ckRhdGUsIGZtdCwgdGltZVpvbmUpIHtcclxuICAgICAgICAgICAgdmFyIGRhID0gW107XHJcbiAgICAgICAgICAgIGlmICghaXNOYU4oZm10KSkge1xyXG4gICAgICAgICAgICAgICAgdGltZVpvbmUgPSBmbXQ7XHJcbiAgICAgICAgICAgICAgICBmbXQgPSBudWxsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciBzZCA9IFN0cmluZyhzdHJEYXRlKS5tYXRjaCgvXFxkKy9nKTtcclxuICAgICAgICAgICAgdmFyIHIgPSBmbXQgJiYgZm10Lm1hdGNoKC9beVlNbWRIaHNTXSsvZ20pO1xyXG4gICAgICAgICAgICB2YXIgbyA9IHtcclxuICAgICAgICAgICAgICAgIFwiW3lZXStcIjogKG5ldyBEYXRlKCkpLmdldEZ1bGxZZWFyKCksIC8v5bm0XHJcbiAgICAgICAgICAgICAgICBcIk0rXCI6IDEsIC8v5pyI5Lu9XHJcbiAgICAgICAgICAgICAgICBcImQrXCI6IDEsIC8v5pelXHJcbiAgICAgICAgICAgICAgICBcIltIaF0rXCI6IDAsIC8v5bCP5pe2XHJcbiAgICAgICAgICAgICAgICBcIm0rXCI6IDAsIC8v5YiGXHJcbiAgICAgICAgICAgICAgICBcInMrXCI6IDAsIC8v56eSXHJcbiAgICAgICAgICAgICAgICBcIlNcIjogMCAvL+avq+enklxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBpZiAocikge1xyXG4gICAgICAgICAgICAgICAgdmFyIGogPSAwO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgayBpbiBvKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGFbal0gPSBvW2tdO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgci5sZW5ndGg7IGkrKylcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5ldyBSZWdFeHAoXCIoXCIgKyBrICsgXCIpXCIpLnRlc3QocltpXSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhW2pdID0gc2RbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGorKztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGRhID0gc2Q7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIGQgPSBtYWluLmV2YWwoJ25ldyBEYXRlKCcgKyAoZGEgPyBkYS5tYXAoZnVuY3Rpb24gKGEsIGkpIHtcclxuICAgICAgICAgICAgICAgIHZhciB0ID0gcGFyc2VJbnQoYSwgMTApO1xyXG4gICAgICAgICAgICAgICAgaWYgKGkgPT0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHQgPSB0IC0gMTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0O1xyXG4gICAgICAgICAgICB9KSA6ICcnKSArICcpJyk7XHJcbiAgICAgICAgICAgIGlmICghaXNOYU4odGltZVpvbmUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbG9jYWxUaW1lID0gZC5nZXRUaW1lKCksXHJcbiAgICAgICAgICAgICAgICAgICAgbG9jYWxPZmZzZXQgPSBkLmdldFRpbWV6b25lT2Zmc2V0KCkgKiA2MDAwMCxcclxuICAgICAgICAgICAgICAgICAgICB1dGMgPSBsb2NhbFRpbWUgKyBsb2NhbE9mZnNldCxcclxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQgPSB0aW1lWm9uZSxcclxuICAgICAgICAgICAgICAgICAgICBsb2NhbFNlY29uZFRpbWUgPSB1dGMgKyAoMzYwMDAwMCAqIG9mZnNldCk7XHJcbiAgICAgICAgICAgICAgICBkID0gbmV3IERhdGUobG9jYWxTZWNvbmRUaW1lKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZDtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiDlsIbml6XmnJ/moLzlvI/lrZfnrKbkuLLovazmjaLkuLrmr6vnp5LlgLxcclxuICAgICAgICAgKiBAcGFyYW0gc3RyRGF0ZSB7U3RyaW5nfSDmjIflrprmoLzlvI/nmoTml7bpl7TlrZfnrKbkuLLvvIzlv4XloatcclxuICAgICAgICAgKiBAcGFyYW0gZm10IHtTdHJpbmd9IOagvOW8j++8jOm7mOiupCd5eXl5LU1NLWRkIEhIOm1tOnNzIFMnXHJcbiAgICAgICAgICogQHBhcmFtIHRpbWVab25lIHtOdW1iZXJ9IOaXtuWMuiDvvIzlpoIgLTgg6KGo56S6IOilvzjljLrvvIzpu5jorqTkuLog5pON5L2c57O757uf5pe25Yy6XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgcGFyc2VUaW1lOiBmdW5jdGlvbiAoc3RyRGF0ZSwgZm10LCB0aW1lWm9uZSkge1xyXG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICghc3RyRGF0ZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0ckRhdGU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBfZGF0ZSA9IERhdGUucGFyc2Uoc3RyRGF0ZSwgZm10LCB0aW1lWm9uZSk7XHJcbiAgICAgICAgICAgIGlmICghX2RhdGUuZ2V0VGltZSgpKSB7XHJcbiAgICAgICAgICAgICAgICBfZGF0ZSA9IG5ldyBEYXRlKHN0ckRhdGUpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gX2RhdGUuZ2V0VGltZSgpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOiOt+WPluaTjeS9nOezu+e7n+aXtuWMulxyXG4gICAgICAgICAqIEByZXR1cm5zIHtudW1iZXJ9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgZ2V0VGltZXpvbmU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIC0xICogKG5ldyBEYXRlKCkpLmdldFRpbWV6b25lT2Zmc2V0KCkgLyA2MDtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIE9iamVjdC5leHRlbmQoRGF0ZS5wcm90b3R5cGUsIHtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog5pe26Ze05qC85byP5YyWXHJcbiAgICAgICAgICogQHBhcmFtIGZtdCB7U3RyaW5nfSDmoLzlvI/lrZfnrKbkuLLvvIzlpoLvvJoneXl5eS1NTS1kZCBISDptbTpzcyBTJ1xyXG4gICAgICAgICAqIEBwYXJhbSBpc0ZvcmNlIHtCb29sZWFufSDmmK/lkKblvLrliLbkvb/nlKjmoLzlvI/vvIzogIzkuI3lm73pmYXljJbml7bpl7TmoLzlvI/vvIzpu5jorqQgZmFsc2XvvIzljbPkuI3lvLrliLbkvb/nlKjmoLzlvI/vvIzogIzmoLzlvI/oh6rliqjljJZcclxuICAgICAgICAgKiBAcGFyYW0gbGFuZyB7U3RyaW5nfSDor63oqIDmoIfor4bvvIzlpoLvvJonemgn77yM6buY6K6k5Li65b2T5YmN6K+t6KiAXHJcbiAgICAgICAgICogQHBhcmFtIHJlZ2lvbiB7U3RyaW5nfSDljLrln5/moIfor4bvvIzlpoLvvJonQ04n77yM6buY6K6k5Li65b2T5YmN5Yy65Z+fXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBAcmV0dXJuIHtTdHJpbmd9IOaMh+WumuaXpeacn+agvOW8j+Wtl+espuS4su+8iOWmgu+8mjIwMTQtMTItMTIgMjI6MjI6MjI6MjM077yJXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgZm9ybWF0OiBmdW5jdGlvbiAoZm10LCBpc0ZvcmNlLCBsYW5nLCByZWdpb24pIHtcclxuICAgICAgICAgICAgaWYgKCFpc0ZvcmNlKSB7XHJcbiAgICAgICAgICAgICAgICBsYW5nID0gbGFuZyB8fCBtYWluLkxhbmcgfHwgJ3poJztcclxuICAgICAgICAgICAgICAgIHJlZ2lvbiA9IHJlZ2lvbiB8fCBtYWluLnJlZ2lvbiB8fCAnQ04nO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChsYW5nID09ICd6aCcpIHtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobGFuZyA9PSAnamEnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm10ID0gZm10LnJlcGxhY2UoLy0vaWcsICdcXC8nKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobGFuZyA9PSAnZW4nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZ1bGxUaW1lcyA9IGZtdC5zcGxpdCgvXFxzLyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHllYXIgPSAoZnVsbFRpbWVzWzBdLm1hdGNoKFwiW3lZXStcIikgJiYgZnVsbFRpbWVzWzBdLm1hdGNoKFwiW3lZXStcIilbMF0pIHx8IFwiXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1vbnRoID0gKGZ1bGxUaW1lc1swXS5tYXRjaChcIk0rXCIpICYmIGZ1bGxUaW1lc1swXS5tYXRjaChcIk0rXCIpWzBdKSB8fCBcIlwiO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBkYXkgPSAoZnVsbFRpbWVzWzBdLm1hdGNoKFwiZCtcIikgJiYgZnVsbFRpbWVzWzBdLm1hdGNoKFwiZCtcIilbMF0pIHx8IFwiXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1vbnRoICYmIGRheSAmJiB5ZWFyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bGxUaW1lc1swXSA9IChyZWdpb24gPT0gJ1VTJykgPyBtb250aCArIFwiXFwvXCIgKyBkYXkgKyBcIlxcL1wiICsgeWVhciA6IGRheSArIFwiXFwvXCIgKyBtb250aCArIFwiXFwvXCIgKyB5ZWFyO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobW9udGggJiYgeWVhcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmdWxsVGltZXNbMF0gPSBtb250aCArIFwiXFwvXCIgKyB5ZWFyO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoeWVhcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmdWxsVGltZXNbMF0gPSB5ZWFyO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBmbXQgPSAocmVnaW9uID09ICdVUycpID8gZnVsbFRpbWVzLnJldmVyc2UoKS5qb2luKCcgJykgOiBmdWxsVGltZXMuam9pbignICcpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgbyA9IHtcclxuICAgICAgICAgICAgICAgIFwiW3lZXStcIjogdGhpcy5nZXRGdWxsWWVhcigpLCAvL+W5tFxyXG4gICAgICAgICAgICAgICAgXCJNK1wiOiB0aGlzLmdldE1vbnRoKCkgKyAxLCAvL+aciOS7vVxyXG4gICAgICAgICAgICAgICAgXCJkK1wiOiB0aGlzLmdldERhdGUoKSwgLy/ml6VcclxuICAgICAgICAgICAgICAgIFwiW0hoXStcIjogdGhpcy5nZXRIb3VycygpLCAvL+Wwj+aXtlxyXG4gICAgICAgICAgICAgICAgXCJtK1wiOiB0aGlzLmdldE1pbnV0ZXMoKSwgLy/liIZcclxuICAgICAgICAgICAgICAgIFwicytcIjogdGhpcy5nZXRTZWNvbmRzKCksIC8v56eSXHJcbiAgICAgICAgICAgICAgICBcInErXCI6IE1hdGguZmxvb3IoKHRoaXMuZ2V0TW9udGgoKSArIDMpIC8gMyksIC8v5a2j5bqmXHJcbiAgICAgICAgICAgICAgICBcIlNcIjogdGhpcy5nZXRNaWxsaXNlY29uZHMoKSAvL+avq+enklxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBpZiAoLyhbeVldKykvLnRlc3QoZm10KSlcclxuICAgICAgICAgICAgICAgIGZtdCA9IGZtdC5yZXBsYWNlKFJlZ0V4cC4kMSwgKHRoaXMuZ2V0RnVsbFllYXIoKSArIFwiXCIpLnN1YnN0cig0IC0gUmVnRXhwLiQxLmxlbmd0aCkpO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBrIGluIG8pXHJcbiAgICAgICAgICAgICAgICBpZiAobmV3IFJlZ0V4cChcIihcIiArIGsgKyBcIilcIikudGVzdChmbXQpKVxyXG4gICAgICAgICAgICAgICAgICAgIGZtdCA9IGZtdC5yZXBsYWNlKFJlZ0V4cC4kMSwgKFJlZ0V4cC4kMS5sZW5ndGggPT0gMSkgPyAob1trXSkgOiAoKFwiMDBcIiArIG9ba10pLnN1YnN0cigoXCJcIiArIG9ba10pLmxlbmd0aCkpKTtcclxuICAgICAgICAgICAgcmV0dXJuIGZtdDtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIOaVsOe7hO+8iEFycmF577yJ5Y6f5Z6L5a+56LGh5omp5bGVXHJcbiAgICAgKi9cclxuICAgIE9iamVjdC5leHRlbmQoQXJyYXksIHt9KTtcclxuICAgIE9iamVjdC5leHRlbmQoQXJyYXkucHJvdG90eXBlLCB7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog6I635Y+W5pWw57uE5Lit55qE5pyA5aSn5YC8XHJcbiAgICAgICAgICogQHJldHVybnMge251bWJlcn1cclxuICAgICAgICAgKi9cclxuICAgICAgICBtYXg6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIE1hdGgubWF4LmFwcGx5KE1hdGgsIHRoaXMpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOiOt+WPluaVsOe7hOS4reeahOacgOWwj+WAvFxyXG4gICAgICAgICAqIEByZXR1cm5zIHtudW1iZXJ9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgbWluOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBNYXRoLm1pbi5hcHBseShNYXRoLCB0aGlzKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiDliKTmlq3mlbDnu4TkuK3mmK/lkKbljIXlkKvmn5DkuKrlhYPntKBcclxuICAgICAgICAgKiBAcGFyYW0gb2JqIHsqfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGNvbnRhaW5zOiBmdW5jdGlvbiAob2JqKSB7XHJcbiAgICAgICAgICAgIHZhciBpID0gdGhpcy5sZW5ndGg7XHJcbiAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzW2ldID09IG9iaikge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiDliKDpmaTmlbDnu4TkuK3mmK/mn5DkuKrlgLzlvpfmiYDmnInlhYPntKBcclxuICAgICAgICAgKiBAcGFyYW0gdmFsIHsqfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHJlbW92ZUFsbDogZnVuY3Rpb24gKHZhbCkge1xyXG4gICAgICAgICAgICB2YXIgdGVtcCA9IHRoaXMuc2xpY2UoMCk7XHJcbiAgICAgICAgICAgIHZhciBpID0gdGVtcC5sZW5ndGg7XHJcbiAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICAgICAgICAgIGlmICh0ZW1wW2ldID09PSB2YWwpIHtcclxuICAgICAgICAgICAgICAgICAgICB0ZW1wLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdGVtcDtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiDojrflj5bmlbDnu4TkuK3mmK/mn5DkuKrlgLznmoTlhYPntKDluo/liJflj7dcclxuICAgICAgICAgKiBAcGFyYW0gdmFsIHsqfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGluZGV4T2Y6IGZ1bmN0aW9uICh2YWwpIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpc1tpXSA9PSB2YWwpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gLTE7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog5Yig6Zmk5pWw57uE5Lit5piv5p+Q5Liq5YC855qE5YWD57SgXHJcbiAgICAgICAgICogQHBhcmFtIHZhbCB7Kn1cclxuICAgICAgICAgKi9cclxuICAgICAgICByZW1vdmU6IGZ1bmN0aW9uICh2YWwpIHtcclxuICAgICAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5pbmRleE9mKHZhbCk7XHJcbiAgICAgICAgICAgIGlmIChpbmRleCA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIE1hcCDljp/lnovmianlsZVcclxuICAgICAqL1xyXG4gICAgT2JqZWN0LmV4dGVuZChNYXAsIHt9KTtcclxuICAgIE9iamVjdC5leHRlbmQoTWFwLnByb3RvdHlwZSwge1xyXG4gICAgICAgIHNldDogZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLm1hcC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNpemUrKztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLm1hcFtrZXldID0gdmFsdWU7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uIChrZXkpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMubWFwLmhhc093blByb3BlcnR5KGtleSkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm1hcFtrZXldO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZGVsZXRlOiBmdW5jdGlvbiAoa2V5KSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm1hcC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNpemUtLTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBkZWxldGUgdGhpcy5tYXBba2V5XTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBrZXlzOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciByZXN1bHRBcnIgPSBbXTtcclxuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHRoaXMubWFwKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5tYXAuaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdEFyci5wdXNoKGtleSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdEFycjtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHZhbHVlczogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0QXJyID0gW107XHJcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiB0aGlzLm1hcCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubWFwLmhhc093blByb3BlcnR5KGtleSkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHRBcnIucHVzaCh0aGlzLm1hcFtrZXldKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0QXJyO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgaGFzOiBmdW5jdGlvbiAoa2V5KSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm1hcC5oYXNPd25Qcm9wZXJ0eShrZXkpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY2xlYXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdGhpcy5tYXAgPSB7fTtcclxuICAgICAgICAgICAgdGhpcy5zaXplID0gMDtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIOaVsOWAvO+8iE51bWJlcu+8ieWOn+Wei+WvueixoeaJqeWxlVxyXG4gICAgICovXHJcbiAgICBPYmplY3QuZXh0ZW5kKE51bWJlciwge30pO1xyXG4gICAgT2JqZWN0LmV4dGVuZChOdW1iZXIucHJvdG90eXBlLCB7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog5a+55pWw5a2X5qC85byP6L+b6KGM5Y2D5YiG5L2N5YiG6ZqUXHJcbiAgICAgICAgICogQHJldHVybnMge3N0cmluZ31cclxuICAgICAgICAgKi9cclxuICAgICAgICBmb3JtYXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIHZhbHVlID0gdGhpcyArICcnO1xyXG4gICAgICAgICAgICB2YXIgc291cmNlID0gdmFsdWUucmVwbGFjZSgvLC9nLCAnJykuc3BsaXQoJy4nKTtcclxuICAgICAgICAgICAgc291cmNlWzBdID0gc291cmNlWzBdLnJlcGxhY2UoLyhcXGQpKD89KFxcZHszfSkrJCkvaWcsICckMSwnKTtcclxuICAgICAgICAgICAgcmV0dXJuIHNvdXJjZS5qb2luKCcuJyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog5a+55pWw5a2X5qC85byP6L+b6KGM5Zub6IiN5LqU5YWlXHJcbiAgICAgICAgICogQHBhcmFtIGxlbmd0aCB7aW50fSDlsI/mlbDmiKrmlq3kvY3mlbDvvIzpu5jorqTkuLowXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgZml4ZWQ6IGZ1bmN0aW9uIChsZW5ndGgpIHtcclxuICAgICAgICAgICAgaWYgKGlzTmFOKHRoaXMpKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgICAgIHZhciBzID0gTWF0aC5wb3coMTAsIE1hdGguYWJzKHBhcnNlSW50KGxlbmd0aCB8fCAwKSkpO1xyXG4gICAgICAgICAgICByZXR1cm4gcGFyc2VGbG9hdChNYXRoLnJvdW5kKHRoaXMgKiBzKSAvIHMpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOWvueaVsOWtl+agvOW8j+i/m+ihjOWNleS9jei9rOaNolxyXG4gICAgICAgICAqIEBwYXJhbSBsZW5ndGgge2ludH0g6L2s5o2i55qE5q+U546H77yM6buY6K6k5Li6NO+8jOWmgjTvvJrnm7jlvZPkuo7lpITku6UxMDAwMFxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHVuaXQ6IGZ1bmN0aW9uIChsZW5ndGgpIHtcclxuICAgICAgICAgICAgaWYgKGlzTmFOKHRoaXMpKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgICAgIHZhciBsZW4gPSA0O1xyXG4gICAgICAgICAgICBpZiAobGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICBsZW4gPSBsZW5ndGg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIG51bSA9IDE7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgTWF0aC5hYnMobGVuKTsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBudW0gKj0gMTA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGxlbiA+IDApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZUZsb2F0KHRoaXMgLyBudW0pO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlRmxvYXQodGhpcyAqIG51bSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqIOW3peWFt+aWueazleWwgeijhSAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cclxuICAgIHZhciBBcHA7XHJcbiAgICBBcHAgPSB7XHJcbiAgICAgICAgdG9rZW46ICcnLFxyXG4gICAgICAgIHVzZXI6IHt9LFxyXG4gICAgICAgIG1hcHM6IFtdLFxyXG5cclxuICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiDlhazlhbHop4TliJnlkoznu4Tku7YgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog5Yid5aeL5YyWIEFqYXhcclxuICAgICAgICAgKi9cclxuICAgICAgICBpbml0QWpheDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAkLmFqYXhTZXR1cCh7XHJcbiAgICAgICAgICAgICAgICBnbG9iYWw6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBjYWNoZTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBkYXRhVHlwZTogXCJqc29uXCIsXHJcbiAgICAgICAgICAgICAgICBjb250ZW50RW5jb2Rpbmc6IFwiZ3ppcFwiLFxyXG4gICAgICAgICAgICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcclxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgICAgICAgICBcIkFjY2Vzcy1Ub2tlblwiOiBDb29raWVzLmdldENvb2soJ3Rva2VuSWQnKSxcclxuICAgICAgICAgICAgICAgICAgICBcIlByZWZlcl9MYW5nXCI6IENvb2tpZXMuZ2V0Q29vaygnUHJlZmVyX0xhbmcnKSxcclxuICAgICAgICAgICAgICAgICAgICBcIlRpbWV6b25lXCI6IERhdGUuZ2V0VGltZXpvbmUoKSB8fCAwXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqIGpxdWVyeSB2YWxpZGF0ZeeahOaJqeWxlSAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cclxuICAgICAgICBpbml0VmFsaWRhdGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIGV4dGVuZCB2YWxpZGF0ZSBsYW5ndWFnZSBzZXR0aW5nXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICAkLmV4dGVuZCgkLnZhbGlkYXRvci5tZXNzYWdlcywge1xyXG4gICAgICAgICAgICAgICAgcmVxdWlyZWQ6IE1zZy52YWxpZGF0b3IucmVxdWlyZWQsXHJcbiAgICAgICAgICAgICAgICByZW1vdGU6IE1zZy52YWxpZGF0b3IucmVtb3RlLFxyXG4gICAgICAgICAgICAgICAgZW1haWw6IE1zZy52YWxpZGF0b3IuZW1haWwsXHJcbiAgICAgICAgICAgICAgICB1cmw6IE1zZy52YWxpZGF0b3IudXJsLFxyXG4gICAgICAgICAgICAgICAgZGF0ZTogTXNnLnZhbGlkYXRvci5kYXRlLFxyXG4gICAgICAgICAgICAgICAgZGF0ZUlTTzogTXNnLnZhbGlkYXRvci5kYXRlSVNPLFxyXG4gICAgICAgICAgICAgICAgbnVtYmVyOiBNc2cudmFsaWRhdG9yLm51bWJlcixcclxuICAgICAgICAgICAgICAgIGRpZ2l0czogTXNnLnZhbGlkYXRvci5kaWdpdHMsXHJcbiAgICAgICAgICAgICAgICBjcmVkaXRjYXJkOiBNc2cudmFsaWRhdG9yLmNyZWRpdGNhcmQsXHJcbiAgICAgICAgICAgICAgICBlcXVhbFRvOiBNc2cudmFsaWRhdG9yLmVxdWFsVG8sXHJcbiAgICAgICAgICAgICAgICBzaWduc0NoZWNrOiBNc2cudmFsaWRhdG9yLnNpZ25zQ2hlY2ssXHJcbiAgICAgICAgICAgICAgICBtYXhsZW5ndGg6ICQudmFsaWRhdG9yLmZvcm1hdChNc2cudmFsaWRhdG9yLm1heGxlbmd0aCksXHJcbiAgICAgICAgICAgICAgICBtaW5sZW5ndGg6ICQudmFsaWRhdG9yLmZvcm1hdChNc2cudmFsaWRhdG9yLm1pbmxlbmd0aCksXHJcbiAgICAgICAgICAgICAgICByYW5nZWxlbmd0aDogJC52YWxpZGF0b3IuZm9ybWF0KE1zZy52YWxpZGF0b3IucmFuZ2VsZW5ndGgpLFxyXG4gICAgICAgICAgICAgICAgcmFuZ2U6ICQudmFsaWRhdG9yLmZvcm1hdChNc2cudmFsaWRhdG9yLnJhbmdlKSxcclxuICAgICAgICAgICAgICAgIG1heDogJC52YWxpZGF0b3IuZm9ybWF0KE1zZy52YWxpZGF0b3IubWF4KSxcclxuICAgICAgICAgICAgICAgIG1pbjogJC52YWxpZGF0b3IuZm9ybWF0KE1zZy52YWxpZGF0b3IubWluKSxcclxuICAgICAgICAgICAgICAgIC8qKuaJqeWxleiHquWumuS5iW1lc3NhZ2UqL1xyXG4gICAgICAgICAgICAgICAgc3BhY2U6IE1zZy52YWxpZGF0b3Iuc3BhY2UsXHJcbiAgICAgICAgICAgICAgICBtb2JpbGU6IE1zZy52YWxpZGF0b3IubW9iaWxlLFxyXG4gICAgICAgICAgICAgICAgcGhvbmU6IE1zZy52YWxpZGF0b3IucGhvbmUsXHJcbiAgICAgICAgICAgICAgICB0ZWw6IE1zZy52YWxpZGF0b3IudGVsLFxyXG4gICAgICAgICAgICAgICAgemlwOiBNc2cudmFsaWRhdG9yLnppcCxcclxuICAgICAgICAgICAgICAgIGN1cnJlbmN5OiBNc2cudmFsaWRhdG9yLmN1cnJlbmN5LFxyXG4gICAgICAgICAgICAgICAgcXE6IE1zZy52YWxpZGF0b3IucXEsXHJcbiAgICAgICAgICAgICAgICBhZ2U6IE1zZy52YWxpZGF0b3IuYWdlLFxyXG4gICAgICAgICAgICAgICAgaWRjYXJkOiBNc2cudmFsaWRhdG9yLmlkY2FyZCxcclxuICAgICAgICAgICAgICAgIGlwOiBNc2cudmFsaWRhdG9yLmlwLFxyXG4gICAgICAgICAgICAgICAgaXBQb3J0OiBNc2cudmFsaWRhdG9yLmlwUG9ydCxcclxuICAgICAgICAgICAgICAgIGNocm51bTogTXNnLnZhbGlkYXRvci5jaHJudW0sXHJcbiAgICAgICAgICAgICAgICBjaGluZXNlOiBNc2cudmFsaWRhdG9yLmNoaW5lc2UsXHJcbiAgICAgICAgICAgICAgICBlbmdsaXNoOiBNc2cudmFsaWRhdG9yLmVuZ2xpc2gsXHJcbiAgICAgICAgICAgICAgICBzZWxlY3ROb25lOiBNc2cudmFsaWRhdG9yLnNlbGVjdE5vbmUsXHJcbiAgICAgICAgICAgICAgICBieXRlUmFuZ2VMZW5ndGg6ICQudmFsaWRhdG9yLmZvcm1hdChNc2cudmFsaWRhdG9yLmJ5dGVSYW5nZUxlbmd0aCksXHJcbiAgICAgICAgICAgICAgICBzdHJpbmdDaGVjazogTXNnLnZhbGlkYXRvci5zdHJpbmdDaGVjayxcclxuICAgICAgICAgICAgICAgIHNhbWU6IE1zZy52YWxpZGF0b3Iuc2FtZSxcclxuICAgICAgICAgICAgICAgIHNlbWlhbmdsZTogTXNnLnZhbGlkYXRvci5zZW1pYW5nbGUsXHJcbiAgICAgICAgICAgICAgICBwYXNzd29yZENoZWNrOiBNc2cudmFsaWRhdG9yLnVzZXJQYXNzd29yZENoZWNrLFxyXG4gICAgICAgICAgICAgICAgUFNJRENoZWNrOiBNc2cudmFsaWRhdG9yLlBTSURDaGVjayxcclxuICAgICAgICAgICAgICAgIFBTTmFtZUNoZWNrOiBNc2cudmFsaWRhdG9yLlBTTmFtZUNoZWNrLFxyXG4gICAgICAgICAgICAgICAgbnVsbENoZWNrOiBNc2cudmFsaWRhdG9yLm51bGxDaGVjayxcclxuICAgICAgICAgICAgICAgIGRhdGVDaGVjazogTXNnLnZhbGlkYXRvci5kYXRlQ2hlY2ssXHJcbiAgICAgICAgICAgICAgICBwZXJjZW50Q2hlY2s6IE1zZy52YWxpZGF0b3IucGVyY2VudENoZWNrLFxyXG4gICAgICAgICAgICAgICAgc3BhY2VTdHJpbmc6IE1zZy52YWxpZGF0b3Iuc3BhY2VTdHJpbmcsXHJcbiAgICAgICAgICAgICAgICBvbmx5U3BhY2U6IE1zZy52YWxpZGF0b3Iub25seVNwYWNlLFxyXG4gICAgICAgICAgICAgICAgZGVjaW1hbExlbmd0aDogJC52YWxpZGF0b3IuZm9ybWF0KE1zZy52YWxpZGF0b3IuZGVjaW1hbExlbmd0aCksXHJcbiAgICAgICAgICAgICAgICBjaGFybnVtYmVyOiBNc2cudmFsaWRhdG9yLmNoYXJudW1iZXIsXHJcbiAgICAgICAgICAgICAgICBzcGVjaWFsY2hhcm51bWJlcjogTXNnLnZhbGlkYXRvci5zcGVjaWFsY2hhcm51bWJlcixcclxuICAgICAgICAgICAgICAgIHNwZWNpYWxzcGFjZVN0cmluZzogTXNnLnZhbGlkYXRvci5zcGVjaWFsc3BhY2VTdHJpbmcsXHJcbiAgICAgICAgICAgICAgICB0ZXh0U3BlY2lhbFN0cmluZzogTXNnLnZhbGlkYXRvci50ZXh0U3BlY2lhbFN0cmluZyxcclxuICAgICAgICAgICAgICAgIHNwZWNpYWxjaGluZXNlOiBNc2cudmFsaWRhdG9yLnNwZWNpYWxjaGluZXNlLFxyXG4gICAgICAgICAgICAgICAgbWluVG86IE1zZy52YWxpZGF0b3IubWluVG8sXHJcbiAgICAgICAgICAgICAgICBtYXhUbzogTXNnLnZhbGlkYXRvci5tYXhUbyxcclxuICAgICAgICAgICAgICAgIG51bUNoZWNrOiBcIuivt+i+k+WFpTB+NDgwMDAw55qE5q2j5pW05pWwXCIsXHJcbiAgICAgICAgICAgICAgICBwb3J0OiBNc2cudmFsaWRhdG9yLnBvcnQsXHJcbiAgICAgICAgICAgICAgICBub3RFcXVhbFRvV3JpdGVCYWNrOiBNc2cudmFsaWRhdG9yLm5vdEVxdWFsVG9Xcml0ZUJhY2ssXHJcbiAgICAgICAgICAgICAgICBwZXJOdW1DaGVjazogTXNnLnZhbGlkYXRvci5wZXJOdW1DaGVjayxcclxuICAgICAgICAgICAgICAgIGRldk5hbWVDaGVjazogTXNnLnZhbGlkYXRvci5kZXZOYW1lQ2hlY2ssXHJcbiAgICAgICAgICAgICAgICBwb3NpdGl2ZUludDogTXNnLnZhbGlkYXRvci5wb3NpdGl2ZUludCxcclxuICAgICAgICAgICAgICAgIHZhbGlkYXRlU3BlY2ljYWxDaGFyczogTXNnLnZhbGlkYXRvci5zcGVjaWFsQ2hhcnMsXHJcbiAgICAgICAgICAgICAgICB2YWNTZXBlY2lhbFN0cmluZzogTXNnLnZhbGlkYXRvci52YWNTZXBlY2lhbFN0cmluZyxcclxuICAgICAgICAgICAgICAgIGx0OiBNc2cudmFsaWRhdG9yLmx0LFxyXG4gICAgICAgICAgICAgICAgbGU6IE1zZy52YWxpZGF0b3IubGUsXHJcbiAgICAgICAgICAgICAgICBndDogTXNnLnZhbGlkYXRvci5ndCxcclxuICAgICAgICAgICAgICAgIGdlOiBNc2cudmFsaWRhdG9yLmdlLFxyXG4gICAgICAgICAgICAgICAgbnVtYmVyQ2hlY2s6IE1zZy52YWxpZGF0b3IudmFsTnVtYmVyQ2hlY2tcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBleHRlbmQgdmFsaWRhdGUgbWV0aG9kc1xyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgJC5leHRlbmQoJC52YWxpZGF0b3IubWV0aG9kcywge1xyXG4gICAgICAgICAgICAgICAgLy9yZXF1aXJlZDogZnVuY3Rpb24gKHZhbHVlLCBlbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICAvLyAgICByZXR1cm4gdmFsdWUubGVuZ3RoID4gMDtcclxuICAgICAgICAgICAgICAgIC8vfSxcclxuICAgICAgICAgICAgICAgIHNlbWlhbmdsZTogZnVuY3Rpb24gKHZhbHVlLCBlbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZsYWcgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdmFsdWUubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHN0ckNvZGUgPSB2YWx1ZS5jaGFyQ29kZUF0KGkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoKHN0ckNvZGUgPiA2NTI0OCkgfHwgKHN0ckNvZGUgPT0gMTIyODgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbGFnID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9uYWwoZWxlbWVudCkgfHwgZmxhZztcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBzcGFjZTogZnVuY3Rpb24gKHZhbHVlLCBlbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZsYWcgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZS5zdGFydFdpdGgoJyAnKSB8fCB2YWx1ZS5lbmRXaXRoKCcgJykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmxhZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25hbChlbGVtZW50KSB8fCBmbGFnO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIG1vYmlsZTogZnVuY3Rpb24gKHZhbHVlLCBlbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy92YXIgbW9iaWxlID0gL14xXFxkezEwfSQvO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBtb2JpbGUgPSAvXlsxXVszNDU3OF1cXGR7OX0kLztcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25hbChlbGVtZW50KSB8fCAobW9iaWxlLnRlc3QodmFsdWUpKTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBwYXNzd29yZENoZWNrOiBmdW5jdGlvbiAodmFsdWUsIGVsZW1lbnQpIHsvL+eUqOaIt+WvhueggeagoemqjFxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBsZW5ndGggPSB2YWx1ZS5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZsYWdBcnIgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZmxhZ051bSwgZmxhZ0xvdywgZmxhZ1VwLCBmbGFnTGV0dGVyLCBmbGFnWmYsIGZsYWdDb247XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZsYWcgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vXHR2YXIgZXNwZWNpYWxDaGFyID0vXigoW2Etel0rW0EtWl0rWzAtOV0rWyFcXFwiI1xcJCUmXFwnKCkqKywtLi86Ozw9Pj9AW1xcXV5fYHt8fX5dK1shXFxcIiNcXCQlJlxcJygpKissLS4vOjs8PT4/QFtcXF1eX2B7fH1+YS16QS1aMC05XSopfChbYS16XStbQS1aXStbIVxcXCIjXFwkJSZcXCcoKSorLC0uLzo7PD0+P0BbXFxdXl9ge3x9fl0rWzAtOV0rWyFcXFwiI1xcJCUmXFwnKCkqKywtLi86Ozw9Pj9AW1xcXV5fYHt8fX5hLXpBLVowLTldKil8KFthLXpdK1shXFxcIiNcXCQlJlxcJygpKissLS4vOjs8PT4/QFtcXF1eX2B7fH1+XStbQS1aXStbMC05XStbIVxcXCIjXFwkJSZcXCcoKSorLC0uLzo7PD0+P0BbXFxdXl9ge3x9fmEtekEtWjAtOV0qKXwoW2Etel0rWyFcXFwiI1xcJCUmXFwnKCkqKywtLi86Ozw9Pj9AW1xcXV5fYHt8fX5dK1swLTldK1tBLVpdK1shXFxcIiNcXCQlJlxcJygpKissLS4vOjs8PT4/QFtcXF1eX2B7fH1+YS16QS1aMC05XSopfChbYS16XStbMC05XStbQS1aXStbIVxcXCIjXFwkJSZcXCcoKSorLC0uLzo7PD0+P0BbXFxdXl9ge3x9fl0rWyFcXFwiI1xcJCUmXFwnKCkqKywtLi86Ozw9Pj9AW1xcXV5fYHt8fX5hLXpBLVowLTldKil8KFthLXpdK1swLTldK1shXFxcIiNcXCQlJlxcJygpKissLS4vOjs8PT4/QFtcXF1eX2B7fH1+XStbQS1aXStbIVxcXCIjXFwkJSZcXCcoKSorLC0uLzo7PD0+P0BbXFxdXl9ge3x9fmEtekEtWjAtOV0qKXwoW0EtWl0rW2Etel0rWzAtOV0rWyFcXFwiI1xcJCUmXFwnKCkqKywtLi86Ozw9Pj9AW1xcXV5fYHt8fX5dK1shXFxcIiNcXCQlJlxcJygpKissLS4vOjs8PT4/QFtcXF1eX2B7fH1+YS16QS1aMC05XSopfChbQS1aXStbYS16XStbIVxcXCIjXFwkJSZcXCcoKSorLC0uLzo7PD0+P0BbXFxdXl9ge3x9fl0rWzAtOV0rWyFcXFwiI1xcJCUmXFwnKCkqKywtLi86Ozw9Pj9AW1xcXV5fYHt8fX5hLXpBLVowLTldKil8KFtBLVpdK1shXFxcIiNcXCQlJlxcJygpKissLS4vOjs8PT4/QFtcXF1eX2B7fH1+XStbYS16XStbMC05XStbIVxcXCIjXFwkJSZcXCcoKSorLC0uLzo7PD0+P0BbXFxdXl9ge3x9fmEtekEtWjAtOV0qKXwoW0EtWl0rWyFcXFwiI1xcJCUmXFwnKCkqKywtLi86Ozw9Pj9AW1xcXV5fYHt8fX5dK1swLTldK1thLXpdK1shXFxcIiNcXCQlJlxcJygpKissLS4vOjs8PT4/QFtcXF1eX2B7fH1+YS16QS1aMC05XSopfChbQS1aXStbMC05XStbYS16XStbIVxcXCIjXFwkJSZcXCcoKSorLC0uLzo7PD0+P0BbXFxdXl9ge3x9fl0rWyFcXFwiI1xcJCUmXFwnKCkqKywtLi86Ozw9Pj9AW1xcXV5fYHt8fX5hLXpBLVowLTldKil8KFtBLVpdK1swLTldK1shXFxcIiNcXCQlJlxcJygpKissLS4vOjs8PT4/QFtcXF1eX2B7fH1+XStbYS16XStbIVxcXCIjXFwkJSZcXCcoKSorLC0uLzo7PD0+P0BbXFxdXl9ge3x9fmEtekEtWjAtOV0qKXwoWzAtOV0rW0EtWl0rW2Etel0rWyFcXFwiI1xcJCUmXFwnKCkqKywtLi86Ozw9Pj9AW1xcXV5fYHt8fX5dK1shXFxcIiNcXCQlJlxcJygpKissLS4vOjs8PT4/QFtcXF1eX2B7fH1+YS16QS1aMC05XSopfChbMC05XStbQS1aXStbIVxcXCIjXFwkJSZcXCcoKSorLC0uLzo7PD0+P0BbXFxdXl9ge3x9fl0rW2Etel0rWyFcXFwiI1xcJCUmXFwnKCkqKywtLi86Ozw9Pj9AW1xcXV5fYHt8fX5hLXpBLVowLTldKil8KFswLTldK1shXFxcIiNcXCQlJlxcJygpKissLS4vOjs8PT4/QFtcXF1eX2B7fH1+XStbQS1aXStbYS16XStbIVxcXCIjXFwkJSZcXCcoKSorLC0uLzo7PD0+P0BbXFxdXl9ge3x9fmEtekEtWjAtOV0qKXwoWzAtOV0rWyFcXFwiI1xcJCUmXFwnKCkqKywtLi86Ozw9Pj9AW1xcXV5fYHt8fX5dK1thLXpdK1tBLVpdK1shXFxcIiNcXCQlJlxcJygpKissLS4vOjs8PT4/QFtcXF1eX2B7fH1+YS16QS1aMC05XSopfChbMC05XStbYS16XStbQS1aXStbIVxcXCIjXFwkJSZcXCcoKSorLC0uLzo7PD0+P0BbXFxdXl9ge3x9fl0rWyFcXFwiI1xcJCUmXFwnKCkqKywtLi86Ozw9Pj9AW1xcXV5fYHt8fX5hLXpBLVowLTldKil8KFswLTldK1thLXpdK1shXFxcIiNcXCQlJlxcJygpKissLS4vOjs8PT4/QFtcXF1eX2B7fH1+XStbQS1aXStbIVxcXCIjXFwkJSZcXCcoKSorLC0uLzo7PD0+P0BbXFxdXl9ge3x9fmEtekEtWjAtOV0qKXwoWyFcXFwiI1xcJCUmXFwnKCkqKywtLi86Ozw9Pj9AW1xcXV5fYHt8fX5dK1tBLVpdK1swLTldK1thLXpdK1shXFxcIiNcXCQlJlxcJygpKissLS4vOjs8PT4/QFtcXF1eX2B7fH1+YS16QS1aMC05XSopfChbIVxcXCIjXFwkJSZcXCcoKSorLC0uLzo7PD0+P0BbXFxdXl9ge3x9fl0rW0EtWl0rW2Etel0rWzAtOV0rWyFcXFwiI1xcJCUmXFwnKCkqKywtLi86Ozw9Pj9AW1xcXV5fYHt8fX5hLXpBLVowLTldKil8KFshXFxcIiNcXCQlJlxcJygpKissLS4vOjs8PT4/QFtcXF1eX2B7fH1+XStbYS16XStbQS1aXStbMC05XStbIVxcXCIjXFwkJSZcXCcoKSorLC0uLzo7PD0+P0BbXFxdXl9ge3x9fmEtekEtWjAtOV0qKXwoWyFcXFwiI1xcJCUmXFwnKCkqKywtLi86Ozw9Pj9AW1xcXV5fYHt8fX5dK1thLXpdK1swLTldK1tBLVpdK1shXFxcIiNcXCQlJlxcJygpKissLS4vOjs8PT4/QFtcXF1eX2B7fH1+YS16QS1aMC05XSopfChbIVxcXCIjXFwkJSZcXCcoKSorLC0uLzo7PD0+P0BbXFxdXl9ge3x9fl0rWzAtOV0rW0EtWl0rW2Etel0rWyFcXFwiI1xcJCUmXFwnKCkqKywtLi86Ozw9Pj9AW1xcXV5fYHt8fX5hLXpBLVowLTldKil8KFshXFxcIiNcXCQlJlxcJygpKissLS4vOjs8PT4/QFtcXF1eX2B7fH1+XStbMC05XStbYS16XStbQS1aXStbIVxcXCIjXFwkJSZcXCcoKSorLC0uLzo7PD0+P0BbXFxdXl9ge3x9fmEtekEtWjAtOV0qKSkkLztcclxuICAgICAgICAgICAgICAgICAgICAvL+aVsOWtl1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciByZWdOdW0gPSAvWzAtOV0vZztcclxuICAgICAgICAgICAgICAgICAgICAvL+Wwj+WGmVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciByZWdMb3cgPSAvW2Etel0vZztcclxuICAgICAgICAgICAgICAgICAgICAvL+Wkp+WGmVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciByZWdVcCA9IC9bQS1aXS9nO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciByZWdaZiA9IC9bXFwkXFwhXFxcIlxcI1xcJlxcJVxcJlxcJ1xcKFxcKVxcKlxcK1xcLFxcLVxcLlxcL1xcOlxcO1xcPFxcPVxcPlxcP1xcQFxcW1xcXFxcXF1cXF5cXF9cXGBcXHtcXH1cXHxcXH5cXCBdL2c7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJvb0ZsYWcgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHZhbHVlLmxlbmd0aCAtIDIgJiYgZmxhZzsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vZm9yKHZhciBpID0gaisxOyBpIDwgdmFsdWUubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9cdGlmKHZhbHVlLmNoYXJBdChqKSA9PSB2YWx1ZS5jaGFyQXQoaSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9cdGZsYWcgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9cdGFsZXJ0KHZhbHVlLmNoYXJBdChqKSArIHZhbHVlLmNoYXJBdChpKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL31cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCh2YWx1ZS5jaGFyQXQoaikgPT0gdmFsdWUuY2hhckF0KGogKyAxKSkgfHwgKHZhbHVlLmNoYXJBdChqICsgMSkgPT0gdmFsdWUuY2hhckF0KGogKyAyKSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vZmxhZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9vRmxhZyA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgLy/lpoLmnpzmnInov57nu63nm7jlkIznmoTkuKTkuKrlrZfnrKbvvIznm7TmjqXov5Tlm55mYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgICAgICAgIGlmIChib29GbGFnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICAgICAgICAgICAgIGZsYWdDb24gPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9uYWwoZWxlbWVudCkgfHwgZmxhZ0NvbjtcclxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgICAgICAgICAgICBmbGFnQ29uID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZmxhZ051bSA9IHJlZ051bS50ZXN0KHZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICBmbGFnTG93ID0gcmVnTG93LnRlc3QodmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZsYWdVcCA9IHJlZ1VwLnRlc3QodmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZsYWdaZiA9IHJlZ1pmLnRlc3QodmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZsYWdBcnIucHVzaChmbGFnTnVtKTtcclxuICAgICAgICAgICAgICAgICAgICBmbGFnQXJyLnB1c2goZmxhZ0xvdyk7XHJcbiAgICAgICAgICAgICAgICAgICAgZmxhZ0Fyci5wdXNoKGZsYWdVcCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZmxhZ0Fyci5wdXNoKGZsYWdaZik7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9mbGFnQXJyLnB1c2goZmxhZ0Nvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgLy/mlbDlrZfvvIzlpKflhpnlrZfmr43vvIzlsI/lhpnlrZfmr43vvIznibnmrorlrZfnrKblm5vnp43mg4XlhrXlj6/ku6Xku7vpgInkuInnp41cclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZsYWdBcnIubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFmbGFnQXJyW2ldKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gaSArIDE7IGogPCBmbGFnQXJyLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFmbGFnQXJyW2pdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZsYWcgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9uYWwoZWxlbWVudCkgfHwgZmxhZztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9uYWwoZWxlbWVudCkgfHwgZmxhZztcclxuICAgICAgICAgICAgICAgICAgICAvL3JldHVybiB0aGlzLm9wdGlvbmFsKGVsZW1lbnQpIHx8IChyZWdOdW0udGVzdCh2YWx1ZSkgJiYgcmVnTG93LnRlc3QodmFsdWUpICYmIHJlZ1VwLnRlc3QodmFsdWUpICYmIHJlZ1pmLnRlc3QodmFsdWUpICYmIGZsYWcpO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIG5vdEVxdWFsVG9Xcml0ZUJhY2s6IGZ1bmN0aW9uICh2YWx1ZSwgZWxlbWVudCwgbm90RXF1YWxUb1dyaXRlQmFja0lkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbCA9ICQobm90RXF1YWxUb1dyaXRlQmFja0lkKS52YWwoKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodmFsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB3YiA9IHZhbC5zcGxpdChcIlwiKS5yZXZlcnNlKCkuam9pbihcIlwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IHdiIHx8IHZhbHVlID09IHZhbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9uYWwoZWxlbWVudCkgfHwgZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9uYWwoZWxlbWVudCkgfHwgdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBzaWduc0NoZWNrOiBmdW5jdGlvbiAodmFsdWUsIGVsZW1lbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25hbChlbGVtZW50KSB8fCAoIXZhbHVlLmNvbnRhaW5zKCcsJykgJiYgIXZhbHVlLmNvbnRhaW5zKCfvvIwnKSk7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgcGhvbmU6IGZ1bmN0aW9uICh2YWx1ZSwgZWxlbWVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0ZWwgPSAvXigwWzAtOV17MiwzfVxcLSk/KFsyLTldWzAtOV17Niw3fSkrKFxcLVswLTldezEsNH0pPyQvO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm9wdGlvbmFsKGVsZW1lbnQpIHx8ICh0ZWwudGVzdCh2YWx1ZSkpO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHRlbDogZnVuY3Rpb24gKHZhbHVlLCBlbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRlbCA9IC8oXlswLTldezMsNH1bXFwtXXswLDF9WzAtOV17Myw4fSQpfCheWzAtOV17Myw4fSQpfCheXFwoWzAtOV17Myw0fVxcKVswLTldezMsOH0kKXwoXjFcXGR7MTB9JCkvO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm9wdGlvbmFsKGVsZW1lbnQpIHx8ICh0ZWwudGVzdCh2YWx1ZSkpO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHppcDogZnVuY3Rpb24gKHZhbHVlLCBlbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRlbCA9IC9eWzAtOV17Nn0kLztcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25hbChlbGVtZW50KSB8fCAodGVsLnRlc3QodmFsdWUpKTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBjdXJyZW5jeTogZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC9eXFxkKyhcXC5cXGQrKT8kL2kudGVzdCh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgcXE6IGZ1bmN0aW9uICh2YWx1ZSwgZWxlbWVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0ZWwgPSAvXlsxLTldXFxkezQsOX0kLztcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25hbChlbGVtZW50KSB8fCAodGVsLnRlc3QodmFsdWUpKTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBhZ2U6IGZ1bmN0aW9uICh2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAvXig/OlsxLTldWzAtOV0/fDFbMDFdWzAtOV18MTIwKSQvaS50ZXN0KHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBpZGNhcmQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAvXlxcZHsxNX0oXFxkezJ9W0EtWmEtejAtOV0pPyQvaS50ZXN0KHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBpcDogZnVuY3Rpb24gKHZhbHVlLCBlbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlwID0gL14oPzooPzoyNVswLTVdfDJbMC00XVswLTldfFswMV0/WzAtOV1bMC05XT8pXFwuKXszfSg/OjI1WzAtNV18MlswLTRdWzAtOV18WzAxXT9bMC05XVswLTldPykkLztcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZmxhZzEgPSB0aGlzLm9wdGlvbmFsKGVsZW1lbnQpIHx8IChpcC50ZXN0KHZhbHVlKSAmJiAoUmVnRXhwLiQxIDwgMjU2ICYmIFJlZ0V4cC4kMiA8IDI1NiAmJiBSZWdFeHAuJDMgPCAyNTYgJiYgUmVnRXhwLiQ0IDwgMjU2KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlwX3BvcnQgPSAvXig/Oig/OjI1WzAtNV18MlswLTRdWzAtOV18WzAxXT9bMC05XVswLTldPylcXC4pezN9KD86KD86MjVbMC01XXwyWzAtNF1bMC05XXxbMDFdP1swLTldWzAtOV0/KTopKD86WzEtOV0oWzAtOV0/KXs0fSkkLztcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZmxhZzIgPSB0aGlzLm9wdGlvbmFsKGVsZW1lbnQpIHx8IChpcF9wb3J0LnRlc3QodmFsdWUpICYmIChSZWdFeHAuJDEgPCAyNTYgJiYgUmVnRXhwLiQyIDwgMjU2ICYmIFJlZ0V4cC4kMyA8IDI1NiAmJiBSZWdFeHAuJDQgPCAyNTYgJiYgUmVnRXhwLiQ1IDwgNjU1MzYpKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVhbG0gPSAvKFthLXpBLVpdK1xcLil7MiwzfVthLXpBLVpdKyQvO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBmbGFnMyA9IHRoaXMub3B0aW9uYWwoZWxlbWVudCkgfHwgcmVhbG0udGVzdCh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZsYWcxIHx8IGZsYWcyIHx8IGZsYWczO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGlwUG9ydDogZnVuY3Rpb24gKHZhbHVlLCBlbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlwX3BvcnQgPSAvXig/Oig/OjI1WzAtNV18MlswLTRdWzAtOV18WzAxXT9bMC05XVswLTldPylcXC4pezN9KD86KD86MjVbMC01XXwyWzAtNF1bMC05XXxbMDFdP1swLTldWzAtOV0/KTopKD86WzEtOV0oWzAtOV0/KXs0fSkkLztcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZmxhZzIgPSB0aGlzLm9wdGlvbmFsKGVsZW1lbnQpIHx8IChpcF9wb3J0LnRlc3QodmFsdWUpICYmIChSZWdFeHAuJDEgPCAyNTYgJiYgUmVnRXhwLiQyIDwgMjU2ICYmIFJlZ0V4cC4kMyA8IDI1NiAmJiBSZWdFeHAuJDQgPCAyNTYgJiYgUmVnRXhwLiQ1IDwgNjU1MzYpKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVhbG0gPSAvKFthLXpBLVpdK1xcLil7MiwzfVthLXpBLVpdKyQvO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBmbGFnMyA9IHRoaXMub3B0aW9uYWwoZWxlbWVudCkgfHwgcmVhbG0udGVzdCh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZsYWcyIHx8IGZsYWczO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGNocm51bTogZnVuY3Rpb24gKHZhbHVlLCBlbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNocm51bSA9IC9eKFthLXpBLVowLTldKykkLztcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25hbChlbGVtZW50KSB8fCAoY2hybnVtLnRlc3QodmFsdWUpKTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBjaGFybnVtYmVyOiBmdW5jdGlvbiAodmFsdWUsIGVsZW1lbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgY2hybnVtID0gL14oW2EtekEtWjAtOVxcc19dKykkLztcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25hbChlbGVtZW50KSB8fCAoY2hybnVtLnRlc3QodmFsdWUpKTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBzcGVjaWFsY2hhcm51bWJlcjogZnVuY3Rpb24gKHZhbHVlLCBlbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNocm51bSA9IC9eKFthLXpBLVowLTlcXHNfXFwhXFxcIlxcI1xcJlxcJVxcJlxcJ1xcKFxcKVxcKlxcK1xcLFxcLVxcLlxcL1xcOlxcO1xcPFxcPVxcPlxcP1xcQFxcW1xcXFxcXF1cXF5cXF9cXGBcXHtcXH1cXHxcXH5cXCRcXCBdKykkLztcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25hbChlbGVtZW50KSB8fCAoY2hybnVtLnRlc3QodmFsdWUpKTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBjaGluZXNlOiBmdW5jdGlvbiAodmFsdWUsIGVsZW1lbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgY2hpbmVzZSA9IC9eW1xcdTRlMDAtXFx1OWZhNV0rJC87XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9uYWwoZWxlbWVudCkgfHwgKGNoaW5lc2UudGVzdCh2YWx1ZSkpO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHNwZWNpYWxjaGluZXNlOiBmdW5jdGlvbiAodmFsdWUsIGVsZW1lbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgY2hpbmVzZSA9IC9eW1xcdTRlMDAtXFx1OWZhNVxcdTA4MDAtXFx1NGUwMFxcIVxcXCJcXCNcXCZcXCVcXCZcXCdcXChcXClcXCpcXCtcXCxcXC1cXC5cXC9cXDpcXDtcXDxcXD1cXD5cXD9cXEBcXFtcXFxcXFxdXFxeXFxfXFxgXFx7XFx9XFx8XFx+XFwkXFwgXSskLztcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25hbChlbGVtZW50KSB8fCAoY2hpbmVzZS50ZXN0KHZhbHVlKSk7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgZW5nbGlzaDogZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC9eW0EtWmEtel0rJC9pLnRlc3QodmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHNlbGVjdE5vbmU6IGZ1bmN0aW9uICh2YWx1ZSwgZWxlbWVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZSA9PSBNc2cuc2VsO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGJ5dGVSYW5nZUxlbmd0aDogZnVuY3Rpb24gKHZhbHVlLCBlbGVtZW50LCBwYXJhbSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBsZW5ndGggPSB2YWx1ZS5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2YWx1ZS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUuY2hhckNvZGVBdChpKSA+IDEyNykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVuZ3RoKys7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9uYWwoZWxlbWVudCkgfHwgKGxlbmd0aCA+PSBwYXJhbVswXSAmJiBsZW5ndGggPD0gcGFyYW1bMV0pO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHN0cmluZ0NoZWNrOiBmdW5jdGlvbiAodmFsdWUsIGVsZW1lbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25hbChlbGVtZW50KSB8fCAodmFsdWUgIT0gXCJudWxsXCIgJiYgL15bXFx1MDgwMC1cXHU0ZTAwXFx1NGUwMC1cXHU5ZmE1XFx3XSskLy50ZXN0KHZhbHVlKSk7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgc2FtZTogZnVuY3Rpb24gKHZhbHVlLCBwYXJhbSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICgkKFwiI1wiICsgcGFyYW1bMF0pLnZhbCgpICE9IFwiXCIgJiYgdmFsdWUgIT0gXCJcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJChcIiNcIiArIHBhcmFtWzBdKS52YWwoKSA9PSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgZmlsdGVySWxsZWdhbDogZnVuY3Rpb24gKHZhbHVlLCBlbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN0ciA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC88L2csICcmbHQ7Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoLz4vZywgJyZndDsnKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBzdHIgPSBzdHIucmVwbGFjZSgvIC9nLCAnJm5ic3A7Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gc3RyID0gc3RyLnJlcGxhY2UoL3gyMi9nLCAnJnF1b3Q7Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gc3RyID0gc3RyLnJlcGxhY2UoL3gyNy9nLCAnJiMzOTsnKTtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHN0cjtcclxuICAgICAgICAgICAgICAgICAgICAkKGVsZW1lbnQpLnZhbCh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgLy/nlLXnq5lJROmqjOivge+8jOWPquiDveWMheWQq+aVsOWtl+OAgeWtl+avjeWSjOS4i+WIkue6v1xyXG4gICAgICAgICAgICAgICAgUFNJRENoZWNrOiBmdW5jdGlvbiAodmFsdWUsIGVsZW1lbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVnUFNJRCA9IC9eW0EtWmEtejAtOV9dKiQvO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm9wdGlvbmFsKGVsZW1lbnQpIHx8IHJlZ1BTSUQudGVzdCh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgLy/nlLXnq5nlkI3np7Dpqozor4HvvIzpppblsL7nmoTlvJXlj7fkuI3og73nm7jlkIxcclxuICAgICAgICAgICAgICAgIFBTTmFtZUNoZWNrOiBmdW5jdGlvbiAodmFsdWUsIGVsZW1lbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVnID0gL14oWydcIl0pKC4pKlxcMSQvO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm9wdGlvbmFsKGVsZW1lbnQpIHx8ICFyZWcudGVzdCh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgLy/nlKjmiLflkI3pmZDliLbkuI3og73mmK9udWxsXHJcbiAgICAgICAgICAgICAgICBudWxsQ2hlY2s6IGZ1bmN0aW9uICh2YWx1ZSwgZWxlbWVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm9wdGlvbmFsKGVsZW1lbnQpIHx8IHZhbHVlLnRvTG93ZXJDYXNlKCkgIT0gXCJudWxsXCI7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgLy/pqozor4Hml6XmnJ8g5qC85byP5Li6eXl5eU1NZGRcclxuICAgICAgICAgICAgICAgIGRhdGVDaGVjazogZnVuY3Rpb24gKHZhbHVlLCBlbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSAkLnRyaW0odmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciByZWdEYXRlID0gL14oPzooPyEwMDAwKVswLTldezR9KD86KD86MFsxLTldfDFbMC0yXSkoPzowWzEtOV18MVswLTldfDJbMC04XSl8KD86MFsxMy05XXwxWzAtMl0pKD86Mjl8MzApfCg/OjBbMTM1NzhdfDFbMDJdKTMxKXwoPzpbMC05XXsyfSg/OjBbNDhdfFsyNDY4XVswNDhdfFsxMzU3OV1bMjZdKXwoPzowWzQ4XXxbMjQ2OF1bMDQ4XXxbMTM1NzldWzI2XSkwMCkwMjI5KSQvO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm9wdGlvbmFsKGVsZW1lbnQpIHx8IHJlZ0RhdGUudGVzdCh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgLy/pqozor4HkuLrmlbDlrZco5q2j5pW05pWw44CB6LSf5pWw5ZKM6Zu2KVxyXG4gICAgICAgICAgICAgICAgbnVtQ2hlY2s6IGZ1bmN0aW9uICh2YWx1ZSwgZWxlbWVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciByZWdOdW0gPSAvXi0/XFxkKyQvO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm9wdGlvbmFsKGVsZW1lbnQpIHx8IHJlZ051bS50ZXN0KHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAvL+mZkOWItueZvuWIhuavlCAwIH4gMTAwXHJcbiAgICAgICAgICAgICAgICBwZXJjZW50Q2hlY2s6IGZ1bmN0aW9uICh2YWx1ZSwgZWxlbWVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBudW0gPSBOdW1iZXIodmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBmbGFnID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG51bSB8fCBudW0gPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobnVtID49IDAgJiYgbnVtIDw9IDEwMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmxhZyA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9uYWwoZWxlbWVudCkgfHwgZmxhZztcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAvL+ajgOa1i+WPquacieS4reaWh+OAgeiLseaWh+OAgeepuuagvOOAgeaVsOWtl+WSjOS4i+WIkue6v++8jOS4jeWMheWQq+S4reaWh+eahOeJueauiuWtl+esplxyXG4gICAgICAgICAgICAgICAgc3BhY2VTdHJpbmc6IGZ1bmN0aW9uICh2YWx1ZSwgZWxlbWVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciByZWcgPSAvXltcXHUwMzkxLVxcdUZGRTVcXHdcXCZcXHNdKyQvO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciByZWdDaGFyID0gL1vvvIHigKbvv6XvvIjvvInigJTvvIzjgILigJzigJ3vvJrvvJvjgIHvvJ/jgJDjgJHjgIrjgItdLztcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZmxhZyA9IHJlZy50ZXN0KHZhbHVlKSAmJiAhcmVnQ2hhci50ZXN0KHZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25hbChlbGVtZW50KSB8fCBmbGFnO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIC8vc3BhY2VTdHJpbmfnmoTljIXlkKvnibnmrorlrZfnrKbniYjmnKxcclxuICAgICAgICAgICAgICAgIHNwZWNpYWxzcGFjZVN0cmluZzogZnVuY3Rpb24gKHZhbHVlLCBlbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlZyA9IC9eW1xcdTAzOTEtXFx1RkZFNVxcd1xcc1xcIVxcXCJcXCNcXCZcXCVcXCZcXCdcXChcXClcXCpcXCtcXCxcXC1cXC5cXC9cXDpcXDtcXDxcXD1cXD5cXD9cXEBcXFtcXFxcXFxdXFxeXFxfXFxgXFx7XFx9XFx8XFx+XFwkXFwgXSskLztcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVnQ2hhciA9IC9b77yB4oCm77+l77yI77yJ4oCU77yM44CC4oCc4oCd77ya77yb44CB77yf44CQ44CR44CK44CLXS87XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZsYWcgPSByZWcudGVzdCh2YWx1ZSkgJiYgIXJlZ0NoYXIudGVzdCh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9uYWwoZWxlbWVudCkgfHwgZmxhZztcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAvL+aWh+acrOeJueauiuWtl+espuaOkumZpCjmlofmnKzkuK3kuI3og73ljIXlkKsmKOaOkumZpGh0bWzlrp7kvZPlrZfnrKYpLDw+KOaOkumZpGh0bWzmoIfnrb7nrKYpKVxyXG4gICAgICAgICAgICAgICAgdGV4dFNwZWNpYWxTdHJpbmc6IGZ1bmN0aW9uICh2YWx1ZSwgZWxlbWVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciByZWdDaGFyID0gL1smPD5dLztcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZmxhZyA9ICFyZWdDaGFyLnRlc3QodmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm9wdGlvbmFsKGVsZW1lbnQpIHx8IGZsYWc7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgLy/pmZDliLbkuI3og73ovpPlhaXnqbrmoLwo5Y2K6KeS5ZKM5YWo6KeS5LiL55qE56m65qC8KVxyXG4gICAgICAgICAgICAgICAgb25seVNwYWNlOiBmdW5jdGlvbiAodmFsdWUsIGVsZW1lbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9ICQudHJpbSh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09ICcnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm9wdGlvbmFsKGVsZW1lbnQpIHx8IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25hbChlbGVtZW50KSB8fCB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIC8v6ZmQ5Yi25bCP5pWw54K55ZCO5L2N5pWwXHJcbiAgICAgICAgICAgICAgICBkZWNpbWFsTGVuZ3RoOiBmdW5jdGlvbiAodmFsdWUsIGVsZW1lbnQsIHBhcmFtKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpc05hTih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRvdCA9IHZhbHVlLmluZGV4T2YoXCIuXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZG90ICE9IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGVuID0gdmFsdWUuc3Vic3RyaW5nKGRvdCArIDEpLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsZW4gPiBwYXJhbSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm9wdGlvbmFsKGVsZW1lbnQpIHx8IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm9wdGlvbmFsKGVsZW1lbnQpIHx8IHRydWU7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgLy8g5piv5ZCm5q+U5oyH5a6a5YWD57Sg5YC85bCPXHJcbiAgICAgICAgICAgICAgICBtaW5UbzogZnVuY3Rpb24gKHZhbHVlLCBlbGVtZW50LCBwYXJhbSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBtID0gJChwYXJhbSkudmFsKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9uYWwoZWxlbWVudCkgfHwgK3ZhbHVlIDwgK21cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAvLyDmmK/lkKbmr5TmjIflrprlhYPntKDlgLzlpKdcclxuICAgICAgICAgICAgICAgIG1heFRvOiBmdW5jdGlvbiAodmFsdWUsIGVsZW1lbnQsIHBhcmFtKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG0gPSAkKHBhcmFtKS52YWwoKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25hbChlbGVtZW50KSB8fCArdmFsdWUgPiArbVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGx0OiBmdW5jdGlvbiAodmFsdWUsIGVsZW1lbnQsIHBhcmFtKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9uYWwoZWxlbWVudCkgfHwgdmFsdWUgPCBwYXJhbTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBsZTogZnVuY3Rpb24gKHZhbHVlLCBlbGVtZW50LCBwYXJhbSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm9wdGlvbmFsKGVsZW1lbnQpIHx8IHZhbHVlIDw9IHBhcmFtO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGd0OiBmdW5jdGlvbiAodmFsdWUsIGVsZW1lbnQsIHBhcmFtKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9uYWwoZWxlbWVudCkgfHwgdmFsdWUgPiBwYXJhbTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBnZTogZnVuY3Rpb24gKHZhbHVlLCBlbGVtZW50LCBwYXJhbSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm9wdGlvbmFsKGVsZW1lbnQpIHx8IHZhbHVlID49IHBhcmFtO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIG51bWJlckNoZWNrOiBmdW5jdGlvbih2YWx1ZSwgZWxlbWVudCwgcGFyYW0pIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25hbChlbGVtZW50KSB8fCAkLmlzTnVtZXJpYyh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgcG9ydDogZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlZ2V4ID0gL14oWzAtOV18WzEtOV1cXGR8WzEtOV1cXGR7Mn18WzEtOV1cXGR7M318WzEtNV1cXGR7NH18NlswLTRdXFxkezN9fDY1WzAtNF1cXGR7Mn18NjU1WzAtMl1cXGR8NjU1M1swLTVdKSQvO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZWdleC50ZXN0KHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICAgICAqIOeUteivnemqjOivgVxyXG4gICAgICAgICAgICAgICAgICog5Y+v6L6T5YWlMTHkvY3miYvmnLrmiJbluqfmnLrvvIgwMTAtWFhYWFhYWFjvvIwwNzMxLVhYWFhYWFjvvIlcclxuICAgICAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICAgICAgdmFjVGVsOiBmdW5jdGlvbiAodGVsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1hY2hQaG9uZSA9IHRlbC5tYXRjaCgvKD86XFwoP1swXFwrXT9cXGR7MSwzfVxcKT8pW1xccy1dPyg/OjB8XFxkezEsNH0pW1xccy1dPyg/Oig/OjEzXFxkezl9KXwoPzpcXGR7Nyw4fSkpL2cpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChtYWNoUGhvbmUgJiYgbWFjaFBob25lLmxlbmd0aCA9PSAxICYmIHRlbCA9PSBtYWNoUGhvbmVbMF0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBtYWNoVGVsID0gdGVsLm1hdGNoKC8oPzpcXCg/WzBcXCtdXFxkezIsM31cXCk/KVtcXHMtXT8oPzooPzpcXCgwezEsM31cXCkpP1swXFxkXXsxLDR9KVtcXHMtXSg/OltcXGRdezcsOH18W1xcZF17Myw0fVtcXHMtXVtcXGRdezMsNH0pL2cpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChtYWNoVGVsICYmIG1hY2hUZWwubGVuZ3RoID09IDEgJiYgdGVsID09IG1hY2hUZWxbMF0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAgICAgKiDnlKjmiLflkI3pqozor4FcclxuICAgICAgICAgICAgICAgICAqIOS4jeWPr+i+k+WFpVsnPCcsICc+JywgJyQnXVxyXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHVzZXJOYW1lIOeUqOaIt+WQjVxyXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIG1heExlbmd0aCDovpPlhaXplb/luqbmnIDlpKflgLwg6buY6K6kNjTkvY1cclxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBtaW5MZW5ndGgg6L6T5YWl6ZW/5bqm5pyA5bCP5YC8IOm7mOiupDHkvY1cclxuICAgICAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICAgICAgdmFjVXNlck5hbWU6IGZ1bmN0aW9uICh1c2VyTmFtZSwgbWF4TGVuZ3RoLCBtaW5MZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIW1heExlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXhMZW5ndGggPSA2NDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFtaW5MZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWluTGVuZ3RoID0gMTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5hbWVMZW5ndGggPSB1c2VyTmFtZS5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5hbWVMZW5ndGggPiBtYXhMZW5ndGggfHwgbmFtZUxlbmd0aCA8IG1pbkxlbmd0aCB8fCB1c2VyTmFtZS50cmltKCkgPT0gJ251bGwnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNwZUNoYXJhID0gWyc8JywgJz4nLCAnfCcsJ+KAmScsJz8nLCcmJywnLCddO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3BlQ2hhcmEubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHVzZXJOYW1lLmluZGV4T2Yoc3BlQ2hhcmFbaV0pICE9IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgICAgICog5a+G56CB6aqM6K+BXHJcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gcGFzc3dvcmQg5a+G56CBXHJcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gbWF4TGVuZ3RoIOi+k+WFpemVv+W6puacgOWkp+WAvCDpu5jorqQ2NOS9jVxyXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIG1pbkxlbmd0aCDovpPlhaXplb/luqbmnIDlsI/lgLwg6buY6K6kNuS9jVxyXG4gICAgICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgICAgICB2YWNQYXNzd29yZDogZnVuY3Rpb24gKHBhc3N3b3JkLCBtYXhMZW5ndGgsIG1pbkxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghbWF4TGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heExlbmd0aCA9IDY0O1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIW1pbkxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtaW5MZW5ndGggPSA2O1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB2YXIgcHdkTGVuZ3RoID0gcGFzc3dvcmQubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChwd2RMZW5ndGggPCBtaW5MZW5ndGggfHwgcHdkTGVuZ3RoID4gbWF4TGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHB3ZCA9IHBhc3N3b3JkO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciByZWdwd2QgPSAvWzAtOWEtekEtWl0vZztcclxuICAgICAgICAgICAgICAgICAgICBpZihyZWdwd2QudGVzdChwd2QpKXtcclxuICAgICAgICBcdFx0XHRcdHB3ZCA9IHB3ZC5yZXBsYWNlKHJlZ3B3ZCwnJyk7XHJcbiAgICAgICAgXHRcdFx0fVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciByZWdaZiA9IC9bXFwhXFxcIlxcI1xcJFxcJVxcJlxcJ1xcKFxcKVxcKlxcK1xcLFxcLVxcLlxcL1xcOlxcO1xcPFxcPVxcPlxcP1xcQFxcW1xcXFxcXF1cXF5cXF9cXGBcXHtcXH1cXHxcXH5dL2c7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYocmVnWmYudGVzdChwd2QpKXtcclxuICAgICAgICBcdFx0XHRcdHB3ZCA9IHB3ZC5yZXBsYWNlKHJlZ1pmLCcnKTtcclxuICAgICAgICBcdFx0XHR9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYocHdkLmxlbmd0aD4wKXtcclxuICAgICAgICBcdFx0XHRcdHJldHVybiBmYWxzZTtcclxuICAgICAgICBcdFx0XHR9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgICAgICog55m75b2V5ZCN6aqM6K+BXHJcbiAgICAgICAgICAgICAgICAgKiDkuI3lj6/ovpPlhaVbJzwnLCAnPicsICckJ11cclxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBsb2dpbk5hbWUg55m75b2V5ZCNXHJcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gbWF4TGVuZ3RoIOi+k+WFpemVv+W6puacgOWkp+WAvCDpu5jorqQ2NOS9jVxyXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIG1pbkxlbmd0aCDovpPlhaXplb/luqbmnIDlsI/lgLwg6buY6K6kMeS9jVxyXG4gICAgICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgICAgICB2YWNMb2dpbk5hbWU6IGZ1bmN0aW9uIChsb2dpbk5hbWUsIG1heExlbmd0aCwgbWluTGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFtYXhMZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWF4TGVuZ3RoID0gNjQ7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghbWluTGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pbkxlbmd0aCA9IDE7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBuYW1lTGVuZ3RoID0gbG9naW5OYW1lLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobmFtZUxlbmd0aCA+IG1heExlbmd0aCB8fCBuYW1lTGVuZ3RoIDwgbWluTGVuZ3RoIHx8IGxvZ2luTmFtZS50cmltKCk9PSdudWxsJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBzcGVDaGFyYSA9IFsnPCcsICc+JywgJ3wnLCfigJknLCc/JywnJicsJywnLCcgJ107XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzcGVDaGFyYS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobG9naW5OYW1lLmluZGV4T2Yoc3BlQ2hhcmFbaV0pICE9IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgICAgICogUVHpqozor4Eg5Y+q6IO96L6T5YWl5pWw5a2XXHJcbiAgICAgICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgICAgIHZhY1FROiBmdW5jdGlvbiAocXEpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdmFjID0gL15bMC05XSokLztcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXZhYy50ZXN0KHFxKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgICAgICB2YWNNYWlsOiBmdW5jdGlvbiAobWFpbCkge1xyXG4gICAgICAgICAgICAgICAgXHR2YXIgdmFjID0gL1xcd1stXFx3LitdKkAoW0EtWmEtejAtOV1bLUEtWmEtejAtOV0rXFwuKStbQS1aYS16XXsyLDE0fSQvO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghdmFjLnRlc3QobWFpbCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAvKlxyXG4gICAgICAgICAgICAgICAgICogMS0zNjXmoKHpqoxcclxuICAgICAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICAgICAgZGF5T2Z5ZWFyOiBmdW5jdGlvbiAodmFsdWUsIGVsZW1lbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVnID0gL14oMHxbMS05XVswLTldKnwtWzEtOV1bMC05XSopJC87XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZsYWcgPSByZWcudGVzdCh2YWx1ZSk7Ly/mlbTmlbBcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZmxhZyAmJiB2YWx1ZSA+PSAxICYmIHZhbHVlIDw9IDM2NSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmbGFnID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmbGFnID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm9wdGlvbmFsKGVsZW1lbnQpIHx8IGZsYWc7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgICAgICog5qCh6aqMKDAsMTAwXeeahOaVsOaNru+8jOWwj+aVsOeCueS4jei2hei/h3BhcmFt5L2NXHJcbiAgICAgICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgICAgIHBlck51bUNoZWNrOiBmdW5jdGlvbiAodmFsdWUsIGVsZW1ldCwgcGFyYW0pIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVnID0gXCIvXlxcXFxkezEsM30oLlxcXFxkezEsXCIgKyBwYXJhbSArIFwifSl7MCwxfSQvXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFtYWluLmV2YWwocmVnKS50ZXN0KHZhbHVlKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBudW0gPSBOdW1iZXIodmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChudW0gPiAwICYmIG51bSA8PSAxMDApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAgICAgKiDlkI3np7Dpqozor4HvvIzkuI3ljIXmi6w8ICcgPiAmIFwiXHJcbiAgICAgICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgICAgIGRldk5hbWVDaGVjazogZnVuY3Rpb24gKHZhbHVlLCBlbGVtZW50LCB0eXBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlZyA9IC9eW15cXCdcXDxcXD4sXFwvXFwmXFxcIid8XSokLztcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25hbChlbGVtZW50KSB8fCAocmVnLnRlc3QodmFsdWUpICYmICF2YWx1ZS5jb250YWlucyhcIm51bGxcIikpO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICAgICAqIOerr+WPo+agoemqjFxyXG4gICAgICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgICAgICB2YWNQb3J0OiBmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVnZXggPSAvXihbMC05XXxbMS05XVxcZHxbMS05XVxcZHsyfXxbMS05XVxcZHszfXxbMS01XVxcZHs0fXw2WzAtNF1cXGR7M318NjVbMC00XVxcZHsyfXw2NTVbMC0yXVxcZHw2NTUzWzAtNV0pJC87XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlZ2V4LnRlc3QodmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuXHJcblxyXG4gICAgICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAgICAgKiDlkI3np7DnsbvnibnmrorlrZfnrKbmoKHpqozvvJpcclxuICAgICAgICAgICAgICAgICAqIOS4jeWMheWQq3wgPCA+ICcgLCAmIC9cclxuICAgICAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICAgICAgdmFjU2VwZWNpYWxTdHJpbmc6IGZ1bmN0aW9uICh2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciByZWdDaGFyID0gL1tcXHwsIDwsID4sICcsIFxcLCwgJiwgXFwvXS87XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZsYWcgPSByZWdDaGFyLnRlc3QodmFsdWUpIHx8IHZhbHVlLmNvbnRhaW5zKFwibnVsbFwiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gIWZsYWc7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgICAgICog54m55q6K5a2X56ym5qCh6aqM77yaXHJcbiAgICAgICAgICAgICAgICAgKiDkuI3ljIXlkKt8IDwgPiAnIFwiLCAmIFxcIC8geyB9IG51bGxcclxuICAgICAgICAgICAgICAgICAqIOS4jeWMheWQq+S4iui/sOeJueauiuWtl+espu+8jOi/lOWbniB0cnVlLCDlkKbliJnov5Tlm55mYWxzZVxyXG4gICAgICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgICAgICB2YWxpZGF0ZVNwZWNpY2FsQ2hhcnM6IGZ1bmN0aW9uICh2YWx1ZSkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVnQ2hhciA9IC9bXFx8LCA8LCA+LCAnLFxcXCIsIFxcLCwgJiwgXFxcXCxcXC8seyx9XS87XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZsYWcgPSByZWdDaGFyLnRlc3QodmFsdWUpIHx8IHZhbHVlLmNvbnRhaW5zKFwibnVsbFwiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gIWZsYWc7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG5cclxuXHJcbiAgICAgICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICAgICAqIOato+aVtOaVsFxyXG4gICAgICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgICAgICBwb3NpdGl2ZUludDogZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlZ0NoYXIgPSAvXlswLTldKlsxLTldWzAtOV0qJC87XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlZ0NoYXIudGVzdCh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICB2YWNDb21iaW5lckRDVm9sdDogZnVuY3Rpb24odmFsdWUsIGVsZW1lbnQsIHR5cGUpIHtcclxuICAgICAgICAgICAgICAgIFx0dmFyIHJlZyA9IC9eWzEtOV1cXGR7MiwzfSQvO1xyXG4gICAgICAgICAgICAgICAgXHRpZiAoIXJlZy50ZXN0KHZhbHVlKSlcclxuICAgICAgICAgICAgICAgIFx0XHRyZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG51bSA9IE51bWJlcih2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG51bSA+PSAzMDAgJiYgbnVtIDw9IDEwMDApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICAgICAqIOagoemqjDLnuqfln5/orr7lpIfmlbDlkoznlKjmiLfmlbBcclxuICAgICAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICAgICAgdmFjTWF4RGV2QW5kVXNlck51bTogZnVuY3Rpb24odmFsdWUsIGVsZW1lbnQsIHR5cGUpIHtcclxuICAgICAgICAgICAgICAgIFx0dmFyIHJlZyA9IC9eWzEtOV1cXGR7MCw4fSQvO1xyXG4gICAgICAgICAgICAgICAgXHRpZiAocmVnLnRlc3QodmFsdWUpKVxyXG4gICAgICAgICAgICAgICAgXHRcdHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgXHRyZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAgICAgKiDmoKHpqowy57qn5Z+f6KOF5py65a656YePXHJcbiAgICAgICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgICAgIHZhY01heEluc3RhbGxDYXA6IGZ1bmN0aW9uKHZhbHVlLCBlbGVtZW50LCB0eXBlKSB7XHJcbiAgICAgICAgICAgICAgICBcdHZhciByZWcgPSAvXig/OlsxLTldXFxkezAsOX18MCkoPzpcXC5cXGR7MSwzfSk/JC87XHJcbiAgICAgICAgICAgICAgICBcdGlmIChyZWcudGVzdCh2YWx1ZSkgJiYgdmFsdWUgPiAwKVxyXG4gICAgICAgICAgICAgICAgXHRcdHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgXHRyZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiBEaWFsb2cg5by55Ye65qGG5omp5bGV5bCB6KOFICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog5qih5oCB5by55Ye65qGGXHJcbiAgICAgICAgICogQHBhcmFtIG9wdGlvbnMge09iamVjdH1cclxuICAgICAgICAgKiA8cHJlPlxyXG4gICAgICAgICAqIHsgPGJyPlxyXG4gICAgICAgICAqICAgICAgIGlkOiBcIm1vZGFsXCIsLy/lvLnnqpdpZCA8YnI+XHJcbiAgICAgICAgICogICAgICAgdGl0bGU6IFwiZGlhbG9nXCIsLy/lvLnnqpfmoIfpopggPGJyPlxyXG4gICAgICAgICAqICAgICAgIHdpZHRoOiA2MDAsLy/lvLnnqpflhoXlrrnlrr3luqbvvIzkuI3mlK/mjIElIDxicj5cclxuICAgICAgICAgKiAgICAgICBoZWlnaHQ6IDUwMCwvL+W8ueeql+WGheWuuemrmOW6pizkuI3mlK/mjIElICA8YnI+XHJcbiAgICAgICAgICogICAgICAgbWF4SGVpZ2h0OiBudWxsLC8v5by556qX5YaF5a655pyA5aSn6auY5bqmLCDkuI3mlK/mjIElIDxicj5cclxuICAgICAgICAgKiAgICAgICBhcHBlbmRUbzogJyNtYWluX3ZpZXcnLC8v5by55Ye65qGG54i25YWD57Sg6YCJ5oup5ZmoICA8YnI+XHJcbiAgICAgICAgICogICAgICAgbW9kYWw6IHRydWUsLy/mmK/lkKbkuLrmqKHmgIHlvLnlh7rmoYY8YnI+XHJcbiAgICAgICAgICogICAgICAga2V5Ym9hcmQ6IHRydWUsLy/mmK/lkKblvIDlkK9lc2PplK7pgIDlh7rvvIzlkozljp/nlJ9ib290c3RyYXAg5qih5oCB5qGG5LiA5qC3IDxicj5cclxuICAgICAgICAgKiAgICAgICBidXR0b25zOiBbXSwgLy/mjInpkq7liIbphY0sIOWPguaVsO+8mmlkOiDmjInpkq5pZDsgdGV4dDog5oyJ6ZKu5paH5pysOyBjbGljazog5oyJ6ZKu54K55Ye75Zue6LCD5Ye95pWwOyBjbGlja1RvQ2xvc2U6IHRydWUg54K55Ye75oyJ6ZKu5piv5ZCm5YWz6Zet5by55Ye65qGGIDxicj5cclxuICAgICAgICAgKiAgICAgICBjb250ZW50OiBcIlwiLC8v5Yqg6L296Z2Z5oCB5YaF5a65IDxicj5cclxuICAgICAgICAgKiAgICAgICBvcGVuRXZlbnQ6IG51bGwsLy/lvLnnqpfmiZPlvIDlkI7lm57osIPlh73mlbAgPGJyPlxyXG4gICAgICAgICAqICAgICAgIGNsb3NlRXZlbnQ6IG51bGwsLy/lvLnnqpflhbPpl63lkI7lm57osIPlh73mlbAgPGJyPlxyXG4gICAgICAgICAqICAgICAgIGlzZHJhZzogdHJ1ZSAvL+eCueWHu2hlYWRlcuaYr+WQpuiDveWkn+aLluWKqCzpu5jorqTlj6/mi5bliqggPGJyPlxyXG4gICAgICAgICAqIH0gPGJyPlxyXG4gICAgICAgICAqIDwvcHJlPlxyXG4gICAgICAgICAqIEByZXR1cm5zIHtqUXVlcnl9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgZGlhbG9nOiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG4gICAgICAgICAgICB2YXIgZGVmYXVsdHMgPSB7XHJcbiAgICAgICAgICAgICAgICBpZDogXCJtb2RhbFwiICsgKG5ldyBEYXRlKCkuZ2V0VGltZSgpKSxcclxuICAgICAgICAgICAgICAgIHRpdGxlOiBcIlwiLFxyXG4gICAgICAgICAgICAgICAgd2lkdGg6IDI3MCxcclxuICAgICAgICAgICAgICAgIGhlaWdodDogNjAsXHJcbiAgICAgICAgICAgICAgICBtYXhIZWlnaHQ6IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQgLSA0MixcclxuICAgICAgICAgICAgICAgIGFwcGVuZFRvOiAnYm9keScsXHJcbiAgICAgICAgICAgICAgICBiYWNrZHJvcDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBtb2RhbDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIGtleWJvYXJkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgY29udGVudDogXCJcIixcclxuICAgICAgICAgICAgICAgIG9wZW5FdmVudDogbnVsbCxcclxuICAgICAgICAgICAgICAgIGNsb3NlRXZlbnQ6IG51bGwsXHJcbiAgICAgICAgICAgICAgICBpc2RyYWc6IHRydWVcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIC8v5Yqo5oCB5Yib5bu656qX5Y+jXHJcbiAgICAgICAgICAgIHZhciBkaWFsb2cgPSB7XHJcbiAgICAgICAgICAgICAgICBpbml0OiBmdW5jdGlvbiAob3B0cykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBfc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8v5Yqo5oCB5o+S5YWl56qX5Y+jXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGQgPSBfc2VsZi5kSHRtbChvcHRzKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoJChcIiNcIiArIG9wdHMuaWQpLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJChcIiNcIiArIG9wdHMuaWQpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBBcHAuZGlhbG9nWkluZGV4LS07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIEFwcC5kaWFsb2daSW5kZXggPiA5NDBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gJChvcHRzLmFwcGVuZFRvIHx8IFwiYm9keVwiKS5hZGRDbGFzcygnbW9kYWwtb3BlbicpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6ICQob3B0cy5hcHBlbmRUbyB8fCBcImJvZHlcIikucmVtb3ZlQ2xhc3MoJ21vZGFsLW9wZW4nKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnOmZvY3VzJykuYmx1cigpO1xyXG4gICAgICAgICAgICAgICAgICAgICQob3B0cy5hcHBlbmRUbyB8fCBcImJvZHlcIikuYXBwZW5kKGQpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgbW9kYWwgPSAkKFwiI1wiICsgb3B0cy5pZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy/liJ3lp4vljJbnqpflj6NcclxuICAgICAgICAgICAgICAgICAgICBtb2RhbC5tb2RhbChvcHRzKTtcclxuICAgICAgICAgICAgICAgICAgICAvL+eql+WPo+S9jee9rlxyXG4gICAgICAgICAgICAgICAgICAgICQoJy5tb2RhbC1kaWFsb2cnLCBtb2RhbCkucmVzaXplKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgX3NlbGYucmVzaXplKCQodGhpcykpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIG1vZGFsLnJlc2l6ZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF9zZWxmLnJlc2l6ZSgkKCcubW9kYWwtZGlhbG9nJywgbW9kYWwpKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICBfc2VsZi5yZXNpemUoJCgnLm1vZGFsLWRpYWxvZycsIG1vZGFsKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy/nqpflj6PlsYLnuqdcclxuICAgICAgICAgICAgICAgICAgICAkKG1vZGFsKS5jc3MoJ3otaW5kZXgnLCBBcHAuZGlhbG9nWkluZGV4KyspO1xyXG4gICAgICAgICAgICAgICAgICAgIC8v6K6+572u5Li65qih5oCB56qX5Y+jXHJcbiAgICAgICAgICAgICAgICAgICAgb3B0cy5tb2RhbCAmJiBtb2RhbC5hZGRDbGFzcygnbW9kYWwtb3ZlcmxheScpO1xyXG4gICAgICAgICAgICAgICAgICAgIG1vZGFsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8v6ZqQ6JeP56qX5Y+j5ZCO5Yig6Zmk56qX5Y+j5a+56K+d5qGGXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vLm9uKCdoaWRlLmJzLm1vZGFsJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAvLyQoJzpmb2N1cycpLmJsdXIoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgJCgnI2llbXNEYXRlUGlja2VyJykuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAkKCcuX3p0cmVlSW5wdXREaXYnKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgLy8kKCdib2R5JykubW91c2Vkb3duKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLm9uKCdoaWRkZW4uYnMubW9kYWwnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RhbC5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcHRzLmNsb3NlRXZlbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRzLmNsb3NlRXZlbnQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFwcC5kaWFsb2daSW5kZXgtLTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFwcC5kaWFsb2daSW5kZXggPiA5NDBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/ICQob3B0cy5hcHBlbmRUbyB8fCBcImJvZHlcIikuYWRkQ2xhc3MoJ21vZGFsLW9wZW4nKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogJChvcHRzLmFwcGVuZFRvIHx8IFwiYm9keVwiKS5yZW1vdmVDbGFzcygnbW9kYWwtb3BlbicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL+eql+WPo+aYvuekuuWQjlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAub24oJ3Nob3duLmJzLm1vZGFsJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wdHMub3BlbkV2ZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0cy5vcGVuRXZlbnQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy/mmL7npLrnqpflj6NcclxuICAgICAgICAgICAgICAgICAgICAgICAgLm1vZGFsKCdzaG93Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICQoJy5tb2RhbC1ib2R5JywgbW9kYWwpO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGRIdG1sOiBmdW5jdGlvbiAobykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjb250ZXh0ID0gJCgnPGRpdi8+JykuYXR0cignaWQnLCBvLmlkKS5hZGRDbGFzcygnbW9kYWwgZmFkZSBzaG93JylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ3JvbGUnLCAnZGlhbG9nJykuYXR0cignYXJpYS1sYWJlbGxlZGJ5Jywgby5pZCArICdfbW9kYWxMYWJlbCcpLmF0dHIoJ2FyaWEtaGlkZGVuJywgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvbnRlbnQgPSAkKCc8ZGl2Lz4nKS5hZGRDbGFzcygnbW9kYWwtY29udGVudCcpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBoZWFkZXIgPSAkKCc8ZGl2Lz4nKS5hZGRDbGFzcygnbW9kYWwtaGVhZGVyJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJvZHkgPSAkKCc8ZGl2Lz4nKS5hZGRDbGFzcygnbW9kYWwtYm9keScpLmNzcyh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdoZWlnaHQnOiBvLmhlaWdodCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ21heC1oZWlnaHQnOiBvLm1heEhlaWdodCB8fCAod2luZG93LnNjcmVlbi5oZWlnaHQgLSAxMjApXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjbG9zZUJ0biA9ICQoJzxidXR0b24vPicpLmFkZENsYXNzKCdjbG9zZScpLmF0dHIoJ2RhdGEtZGlzbWlzcycsICdtb2RhbCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKCdhcmlhLWhpZGRlbicsIHRydWUpLnRleHQoJ8OXJykub24oXCJtb3VzZWRvd25cIiwgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0aXRsZSA9ICQoJzxwLz4nKS5hZGRDbGFzcygnbW9kYWwtdGl0bGUnKS5odG1sKG8udGl0bGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlLmNzcyhcImN1cnNvclwiLCBcImRlZmF1bHRcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgaGVhZGVyLmFwcGVuZChjbG9zZUJ0bikuYXBwZW5kKHRpdGxlKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoby5pc2RyYWcpIHsgLy8g5ouW5puzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBfbW91c2V4LCBfbW91c2V5LCBoZWFkeCwgaGVhZHk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlLmNzcyhcImN1cnNvclwiLCBcIm1vdmVcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlYWRlci5jc3MoXCJjdXJzb3JcIiwgXCJtb3ZlXCIpLm9uKFwibW91c2Vkb3duXCIsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlID0gd2luZG93LmV2ZW50OyAvLyBmb3IgSUVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBvZmZzZXQgPSAkKHRoaXMpLm9mZnNldCgpOyAgICAvLyBoZWFkZXLkvY3nva5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlYWR4ID0gcGFyc2VJbnQob2Zmc2V0LmxlZnQsIDEwKSwgaGVhZHkgPSBwYXJzZUludChvZmZzZXQudG9wLCAxMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDmi5bmi73ml7bpvKDmoIfkvY3nva5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9tb3VzZXggPSBlLnBhZ2VYLCBfbW91c2V5ID0gZS5wYWdlWTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG1vdXNlZG93buWQjua3u+WKoOaLluWKqOS6i+S7tlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g57uR5a6a5YiwZG9jdW1lbnTkv53or4HkuI3lm6DkuLrljaHpob/nqpflj6Pot5/kuI3kuIrpvKDmoIfkvb/lhYnmoIfohLHnprvkuovku7blgZzpob9cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoZG9jdW1lbnQpLm9mZihcIm1vdXNlbW92ZVwiKS5vbihcIm1vdXNlbW92ZVwiLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vbW92ZeWQjueql+WPo+W3puS4iuinkuS9jee9rlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB4ID0gaGVhZHggKyAoZS5wYWdlWCAtIF9tb3VzZXgpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5ID0gaGVhZHkgKyAoZS5wYWdlWSAtIF9tb3VzZXkpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoeCArIGhlYWRlci5wYXJlbnRzKFwiLm1vZGFsLWRpYWxvZ1wiKS53aWR0aCgpIDw9IDQwKSB7ICAgLy8g5bem5Y+z6LaK55WM5Yik5patXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHggPSA0MCAtIGhlYWRlci5wYXJlbnRzKFwiLm1vZGFsLWRpYWxvZ1wiKS53aWR0aCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoeCA+PSAkKHdpbmRvdykud2lkdGgoKSAtIDQwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHggPSAkKHdpbmRvdykud2lkdGgoKSAtIDQwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoeSA8PSAwKSB7ICAgLy8g5LiK5LiL6LaK55WM5Yik5patXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHkgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoeSA+PSAkKHdpbmRvdykuaGVpZ2h0KCkgLSA0MCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5ID0gJCh3aW5kb3cpLmhlaWdodCgpIC0gNDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlYWRlci5wYXJlbnRzKFwiLm1vZGFsLWRpYWxvZ1wiKS5jc3Moe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImxlZnRcIjogeCArIFwicHhcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ0b3BcIjogeSArIFwicHhcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJwb3NpdGlvblwiOiBcImFic29sdXRlXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTsgLy/orr7nva7mlrDkvY3nva5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQoZG9jdW1lbnQpLm9uKFwibW91c2V1cFwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGRvY3VtZW50KS5vZmYoXCJtb3VzZW1vdmVcIik7ICAgLy8g6byg5qCH5by56LW35ZCO5Y+W5raI5ouW5Yqo5LqL5Lu2XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyICRjb24gPSAkKCc8ZGl2Lz4nKS5hZGRDbGFzcygnaWVtcy1tb2RhbC1jb250ZW50JykuYXBwZW5kKG8uY29udGVudCB8fCBcIlwiKTtcclxuICAgICAgICAgICAgICAgICAgICBib2R5LmFwcGVuZCgkY29uKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZvb3RlciA9ICQoJzxkaXYvPicpLmFkZENsYXNzKCdtb2RhbC1mb290ZXInKTtcclxuICAgICAgICAgICAgICAgICAgICAvL2J0bumFjee9rlxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvLmJ1dHRvbnMgJiYgby5idXR0b25zLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKG8uYnV0dG9ucywgZnVuY3Rpb24gKGksIHQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBidG4gPSAkKCc8YnV0dG9uLz4nKS5hZGRDbGFzcygnYnRuIG1vZGFsLWJ0bicpLmFkZENsYXNzKHRoaXMudHlwZSB8fCAnJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYXR0cihcImlkXCIsIHRoaXMuaWQpLnRleHQodGhpcy50ZXh0IHx8ICdTdWJtaXQnKS5hdHRyKCdhcmlhLWhpZGRlbicsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdC5jbGlja1RvQ2xvc2UgJiYgYnRuLmF0dHIoJ2RhdGEtZGlzbWlzcycsICdtb2RhbCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdC5jbGljayAmJiBidG4uY2xpY2soZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0LmNsaWNrKGUsIGNvbnRleHQsIHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9vdGVyLmFwcGVuZChidG4pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQuYXBwZW5kKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKCc8ZGl2Lz4nKS5hZGRDbGFzcygnbW9kYWwtZGlhbG9nJykuY3NzKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICd3aWR0aCc6IG8ud2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAncGFkZGluZyc6IDBcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSkuYXBwZW5kKGNvbnRlbnQuYXBwZW5kKGhlYWRlcikuYXBwZW5kKGJvZHkpLmFwcGVuZChmb290ZXIpKVxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBzY3JvbGxCYXJXaWR0aCA9IGJvZHkuZ2V0KDApLm9mZnNldFdpZHRoIC0gYm9keS5nZXQoMCkuc2Nyb2xsV2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgc2Nyb2xsQmFyV2lkdGggPiAwICYmIGJvZHkuY3NzKHsncGFkZGluZy1yaWdodCc6IHNjcm9sbEJhcldpZHRoICsgMTV9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQ7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgY2xvc2U6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAkKFwiLm1vZGFsXCIpLm1vZGFsKFwiaGlkZVwiKTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICByZXNpemU6IGZ1bmN0aW9uIChtb2RhbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBtdyA9ICQod2luZG93KS53aWR0aCgpIC0gJChtb2RhbCkud2lkdGgoKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbWggPSAkKHdpbmRvdykuaGVpZ2h0KCkgLSAkKG1vZGFsKS5oZWlnaHQoKSAtIDU7XHJcbiAgICAgICAgICAgICAgICAgICAgJChtb2RhbCkuY3NzKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ3RvcCc6IG1oID4gMCA/IChtaCAvIDIuNSkgOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAnbGVmdCc6IG13ID4gMCA/IChtdyAvIDIpIDogMFxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBpZiAob3B0aW9ucyA9PSBcImNsb3NlXCIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBkaWFsb2cuY2xvc2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgb3B0cyA9ICQuZXh0ZW5kKHt9LCBkZWZhdWx0cywgb3B0aW9ucyk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZGlhbG9nLmluaXQob3B0cyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBkaWFsb2daSW5kZXg6IDk0MCxcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog5raI5oGv5o+Q56S65qGGXHJcbiAgICAgICAgICogQHBhcmFtIHAge09iamVjdH0g5Y+C5pWw6K6+572uXHJcbiAgICAgICAgICogQHBhcmFtIGMge0Z1bmN0aW9ufSDngrnlh7vigJxPS+KAneaMiemSruaIluiAheWFs+mXreW8ueWHuuahhuWbnuiwg+aWueazlVxyXG4gICAgICAgICAqICAgICA8cHJlPlxyXG4gICAgICAgICAqICAgICDkvovlpoLvvJogQXBwLmFsZXJ0KHtpZDogaWQsIHRpdGxlOiBcInRpdGxlXCIsIG1lc3NhZ2U6IFwiQ29udGVudFwiLCDigKbigKZ9LCBmdW5jdGlvbiAoKSB7IOKApuKApiB9KTtcclxuICAgICAgICAgKiAgICAgPC9wcmU+XHJcbiAgICAgICAgICogQHJldHVybnMgeyp9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgYWxlcnQ6IGZ1bmN0aW9uIChwLCBjKSB7XHJcbiAgICAgICAgICAgIGlmICghcCkgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgdmFyIGNvbnRlbnQgPSBBcHAuZ2V0Q2xhc3NPZihwKSA9PSAnU3RyaW5nJyA/IHAgOiBwLm1lc3NhZ2U7XHJcbiAgICAgICAgICAgIHZhciBzZXR0aW5nID0ge1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6IE1zZy5pbmZvLFxyXG4gICAgICAgICAgICAgICAgd2lkdGg6IDMyMCxcclxuICAgICAgICAgICAgICAgIGhlaWdodDogJ2F1dG8nLFxyXG4gICAgICAgICAgICAgICAgY29udGVudDogY29udGVudCB8fCAnJyxcclxuICAgICAgICAgICAgICAgIGJ1dHRvbnM6IHAuYnV0dG9ucyB8fCBbXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogJ29rSWQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3VibWl0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogTXNnLnN1cmUgfHwgJ09LJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2xpY2tUb0Nsb3NlOiB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgIGNsb3NlRXZlbnQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYylcclxuICAgICAgICAgICAgICAgICAgICAgICAgYygpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBpZiAoQXBwLmdldENsYXNzT2YocCkgPT0gXCJTdHJpbmdcIikge1xyXG4gICAgICAgICAgICAgICAgc2V0dGluZy5tZXNzYWdlID0gcDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAkLmV4dGVuZChzZXR0aW5nLCBwKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBBcHAuZGlhbG9nKHNldHRpbmcpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOehruiupOivoumXruahhlxyXG4gICAgICAgICAqIEBwYXJhbSBwIHtPYmplY3R9IOWPguaVsOiuvue9rlxyXG4gICAgICAgICAqIEBwYXJhbSBjIHtGdW5jdGlvbn0g54K55Ye7T0vlm57osIPmlrnms5VcclxuICAgICAgICAgKiBAcGFyYW0gciB7RnVuY3Rpb259IOeCueWHu0NhbmNlbOWbnuiwg+aWueazlVxyXG4gICAgICAgICAqICAgICAg5L6L5aaCOlxyXG4gICAgICAgICAqICAgICAgQXBwLmNvbmZpcm0oe3R5cGU6IFwiY29uZmlybVwiLCB0aXRsZTogXCJUSVRMRVwiLCBtZXNzYWdlOiBcIk1lc3NhZ2VcIn0sIGZ1bnRpb24oKXsuLi4ob2tFdmVudCl9LCBmdW50aW9uKCl7Li4uKGNsb3NlRXZlbnQpfSk7XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgY29uZmlybTogZnVuY3Rpb24gKHAsIGMsIHIpIHtcclxuICAgICAgICAgICAgaWYgKCFwKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICB2YXIgY29udGVudCA9IEFwcC5nZXRDbGFzc09mKHApID09ICdTdHJpbmcnID8gcCA6IHAubWVzc2FnZTtcclxuICAgICAgICAgICAgdmFyIHNldHRpbmcgPSB7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogTXNnLmluZm8sXHJcbiAgICAgICAgICAgICAgICB3aWR0aDogMzIwLFxyXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAnYXV0bycsXHJcbiAgICAgICAgICAgICAgICBjb250ZW50OiBjb250ZW50IHx8ICcnLFxyXG4gICAgICAgICAgICAgICAgYnV0dG9uczogcC5idG5zIHx8IFtcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiAnb2tJZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdWJtaXQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBNc2cuc3VyZSB8fCAnT0snLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGlja1RvQ2xvc2U6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsaWNrOiBmdW5jdGlvbiAoZSwgZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6ICdjYW5jZWxJZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdjYW5jZWwnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBNc2cuY2FuY2VsIHx8ICdDYW5jZWwnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGlja1RvQ2xvc2U6IHRydWVcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgY2xvc2VFdmVudDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChyKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICQuZXh0ZW5kKHNldHRpbmcsIHApO1xyXG4gICAgICAgICAgICByZXR1cm4gQXBwLmRpYWxvZyhzZXR0aW5nKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiDnlKjmiLfovpPlhaXlk43lupTmoYZcclxuICAgICAgICAgKiBAcGFyYW0gaWQgICAgIGlucHV06L6T5YWl5qGG55qEaWRcclxuICAgICAgICAgKiBAcGFyYW0gcCAgICAgIOWPguaVsOiuvue9rnsoT2JqZWN0L1N0cmluZyl9XHJcbiAgICAgICAgICogICAgICAgICAgICAgIHtpZDogXCIobW9kYWzlvLnnqpdpZClcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOlwi5qCH6aKYXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50Olwi6Z2Z5oCBaHRtbOWGheWuuSjpu5jorqTkuLppbnB1dOagh+etvilcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgIG9rRXZlbnQ6IFwiKEZ1bmN0aW9uKVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgY2xvc2VFdmVudDogXCIoRnVuY3Rpb24pXCJ9XHJcbiAgICAgICAgICogQHBhcmFtIGMgICAgICBva0V2ZW50IOehruiupOWbnuiwg+aWueazlXtGdW5jdGlvbn1cclxuICAgICAgICAgKiBAcGFyYW0gciAgICAgIGNsb3NlRXZlbnQg56qX5Y+j5YWz6Zet5Zue6LCD5pa55rOVe0Z1bmN0aW9ufVxyXG4gICAgICAgICAqIEByZXR1cm5zIHsqfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHByb21wdDogZnVuY3Rpb24gKGlkLCBwLCBjLCByKSB7XHJcbiAgICAgICAgICAgIHZhciBwcm9JbnB1dCA9ICQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIGlkPScgKyBpZCArICcgbmFtZT1cIicgKyBpZCArICdcIiBzdHlsZT1cIndpZHRoOiA5MCU7XCI+Jyk7XHJcbiAgICAgICAgICAgIHZhciBzZXR0aW5nID0ge1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6IE1zZy5pbmZvLFxyXG4gICAgICAgICAgICAgICAgY29udGVudDogKHAgJiYgcC5jb250ZW50KSB8fCBwcm9JbnB1dCxcclxuICAgICAgICAgICAgICAgIHdpZHRoOiAzMjAsXHJcbiAgICAgICAgICAgICAgICBoZWlnaHQ6ICdhdXRvJyxcclxuICAgICAgICAgICAgICAgIGJ1dHRvbnM6IChwICYmIHAuYnRucykgfHwgW1xyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6ICdva0lkJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogTXNnLnN1cmUgfHwgJ09LJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2xpY2s6IGZ1bmN0aW9uIChlLCBkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdmFsID0gJCgnIycgKyBpZCkudmFsKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGModmFsLCBkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogJ2NhbmNlbElkJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2NhbmNlbCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IE1zZy5jYW5jZWwgfHwgJ0NhbmNlbCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsaWNrVG9DbG9zZTogdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICBjbG9zZUV2ZW50OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcigpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgJC5leHRlbmQoc2V0dGluZywgcCk7XHJcbiAgICAgICAgICAgIHJldHVybiBBcHAuZGlhbG9nKHNldHRpbmcpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOiOt+WPluWvueixoeeahOexu+WQje+8jOiHquWumuS5ieeahOS7u+S9leexu+i/lOWbnidPYmplY3QnXHJcbiAgICAgICAgICogQHBhcmFtIG8g5Lu75oSP57G75Z6LXHJcbiAgICAgICAgICogQHJldHVybnMge1N0cmluZ30g6L+U5ZueRUNNQVNjcmlwdOS4remihOWumuS5ieeahOWFreenjeexu+Wei+S5i+S4gO+8jOmmluWGmeWtl+avjeS4uuWkp+WGmVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGdldENsYXNzT2Y6IGZ1bmN0aW9uIChvKSB7XHJcbiAgICAgICAgICAgIGlmIChvID09PSBudWxsKXJldHVybiAnTnVsbCc7XHJcbiAgICAgICAgICAgIGlmIChvID09PSB1bmRlZmluZWQpcmV0dXJuICdVbmRlZmluZWQnO1xyXG4gICAgICAgICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pLnNsaWNlKDgsIC0xKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiDkuJrliqHlhazlhbHliY3nq6/mlrnms5Us57uf5LiA5oum5oiq54m55q6K5a2X56ymXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgZGVhbFNwZWNpYWxTaWduOiBmdW5jdGlvbiAob2JqKSB7XHJcbiAgICAgICAgICAgIHZhciBzaWduQXJyYXkgPSBbXCIlXCIsIFwiXFxcXFwiLCBcIl9cIiwgXCItXCIsIFwiL1wiLCBcIi5cIl07IC8v6ZyA6KaB5YGa6L2s5LmJ6K+35Zyo5q2k5re75YqgXHJcbiAgICAgICAgICAgIHZhciB0ZW1wID0gb2JqICsgXCJcIjtcclxuICAgICAgICAgICAgdmFyIHRlbXBBcnJheSA9IFtdO1xyXG4gICAgICAgICAgICB2YXIgZmxhZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICBpZiAodGVtcC5pbmRleE9mKFwiW1wiKSA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgICBmbGFnID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIWZsYWcpIHtcclxuICAgICAgICAgICAgICAgIC8v6ZKI5a+56YKq5oG24oCYXFzigJnnibnmrorlpITnkIZcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwgdGVtcC5sZW5ndGg7IGsrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHRlbXBBcnJheS5wdXNoKHRlbXAuY2hhckF0KGspKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGggPSAwOyBoIDwgdGVtcEFycmF5Lmxlbmd0aDsgaCsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNpZ25BcnJheS5jb250YWlucyh0ZW1wQXJyYXlbaF0gKyBcIlwiKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGVtcEFycmF5W2hdID09IFwiXFxcXFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wQXJyYXlbaF0gPSBcIlxcXFxcXFxcXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wQXJyYXlbaF0gPSBcIlxcXFxcIiArIHRlbXBBcnJheVtoXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8v57uE6KOF6L+U5Zue5a2X56ymXHJcbiAgICAgICAgICAgICAgICB2YXIgdGVtcFN0ciA9IFwiXCI7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciB5ID0gMDsgeSA8IHRlbXBBcnJheS5sZW5ndGg7IHkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHRlbXBTdHIgKz0gdGVtcEFycmF5W3ldO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgb2JqID0gdGVtcFN0cjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gb2JqO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOi0p+W4gei9rOaNolxyXG4gICAgICAgICAqIEBwYXJhbSB2YWx1ZVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHVuaXRUcmFuc2Zvcm06ZnVuY3Rpb24odmFsdWUpe1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0ge307XHJcbiAgICAgICAgICAgIHZhciB1bml0ID0gQXBwLmdldEN1cnJlbmN5VW5pdCgpO1xyXG4gICAgICAgICAgICByZXN1bHQudmFsdWUgPSBwYXJzZUZsb2F0KHZhbHVlKS5maXhlZCgyKS50b0ZpeGVkKDIpO1xyXG4gICAgICAgICAgICByZXN1bHQudW5pdCA9IHVuaXQ7XHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBnZXRDdXJyZW5jeVVuaXQ6ZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgdmFyIGN1cnJlbmN5ID0gQ29va2llcy5nZXRDb29rKCdjdXJyZW5jeScpO1xyXG4gICAgICAgICAgICB2YXIgdW5pdDtcclxuICAgICAgICAgICAgc3dpdGNoIChjdXJyZW5jeSl7XHJcbiAgICAgICAgICAgICAgICBjYXNlICcxJzpcclxuICAgICAgICAgICAgICAgICAgICB1bml0ID0gJ8KlJztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJzInOlxyXG4gICAgICAgICAgICAgICAgICAgIHVuaXQgPSAnJCc7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICczJzpcclxuICAgICAgICAgICAgICAgICAgICB1bml0ID0gJ8KlJztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJzQnOlxyXG4gICAgICAgICAgICAgICAgICAgIHVuaXQgPSAn4oKsJztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJzUnOlxyXG4gICAgICAgICAgICAgICAgICAgIHVuaXQgPSAnwqMnO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICB1bml0ID0gJ8KlJztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdW5pdDtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICog5a6a5LmJ5LiA5Liq5qih5Z2XXHJcbiAgICAgKiBAcGFyYW0gbW9kdWxlTmFtZSB7U3RyaW5nfSDmqKHlnZflkI3np7BcclxuICAgICAqIEBwYXJhbSBmbiB7RnVuY3Rpb259IOaooeWdl+S9k1xyXG4gICAgICovXHJcbiAgICBBcHAuTW9kdWxlID0gZnVuY3Rpb24gKG1vZHVsZU5hbWUsIGZuKSB7XHJcbiAgICAgICAgKGZ1bmN0aW9uICgkKSB7XHJcbiAgICAgICAgICAgIHZhciBjb25maWcgPSBBcHAuTW9kdWxlW21vZHVsZU5hbWVdO1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIHtcclxuICAgICAgICAgICAgICAgIHZhciBkZXBzID0gY29uZmlnLmltcG9ydExpc3QgfHwgWydqcXVlcnknXTtcclxuICAgICAgICAgICAgICAgIGRlZmluZShkZXBzLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1vZHVsZSA9ICQuZXh0ZW5kKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgUmVuZGVyOiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpLlJlbmRlciB8fCBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpXHJcbiAgICAgICAgICAgICAgICAgICAgfSwgZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlLmNvbmZpZyA9IGNvbmZpZztcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbW9kdWxlO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBBcHAuTW9kdWxlW21vZHVsZU5hbWVdID0gJC5leHRlbmQoe1xyXG4gICAgICAgICAgICAgICAgICAgIFJlbmRlcjogZm4oKS5SZW5kZXIgfHwgZm4oKVxyXG4gICAgICAgICAgICAgICAgfSwgZm4oKSk7XHJcbiAgICAgICAgICAgICAgICBBcHAuTW9kdWxlW21vZHVsZU5hbWVdLmNvbmZpZyA9IGNvbmZpZztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pKGpRdWVyeSk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7IE9iamVjdCB9IG1vZHVsZUNvbmZpZyDphY3nva7vvIznu5PmnoTlpoLkuIvvvJpcclxuICAgICAqIDxwcmU+XHJcbiAgICAgKiB7PGJyPlxyXG4gICAgICogICAgIHBhY2thZ2U6IHtTdHJpbmd9IOaooeWdl+aJgOWcqOeahOWMhei3r+W+hCw8YnI+XHJcbiAgICAgKiAgICAgbW9kdWxlTmFtZToge1N0cmluZ30g5qih5Z2X5ZCN56ewLDxicj5cclxuICAgICAqICAgICBtb2R1bGVEZXNjcmlwdGlvbjoge1N0cmluZ30g5qih5Z2X5o+P6L+wLDxicj5cclxuICAgICAqICAgICBpbXBvcnRMaXN0OiB7QXJyYXl9IOS+nei1luaooeWdl+WIl+ihqDxicj5cclxuICAgICAqIH1cclxuICAgICAqIDwvcHJlPlxyXG4gICAgICogQHJldHVybnMgeyp9IOmFjee9rue7k+aenFxyXG4gICAgICovXHJcbiAgICBBcHAuTW9kdWxlLmNvbmZpZyA9IGZ1bmN0aW9uIChtb2R1bGVDb25maWcpIHtcclxuICAgICAgICB2YXIgY29uZmlnID0gJC5leHRlbmQoe1xyXG4gICAgICAgICAgICBwYWNrYWdlOiAnJyxcclxuICAgICAgICAgICAgbW9kdWxlTmFtZTogJycsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnJyxcclxuICAgICAgICAgICAgaW1wb3J0TGlzdDogW11cclxuICAgICAgICB9LCBtb2R1bGVDb25maWcpO1xyXG5cclxuICAgICAgICBBcHAuTW9kdWxlW2NvbmZpZy5tb2R1bGVOYW1lXSA9IGNvbmZpZztcclxuXHJcbiAgICAgICAgcmV0dXJuIGNvbmZpZztcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIEFwcDtcclxufSk7XHJcblxyXG4vKipcclxuICogTWFwIOexu+Wei+WumuS5iVxyXG4gKiBAcGFyYW0gb2JqXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKi9cclxuZnVuY3Rpb24gTWFwKG9iaikge1xyXG4gICAgdGhpcy5tYXAgPSB7fTtcclxuICAgIHRoaXMuc2l6ZSA9IDA7XHJcbn0iXSwiZmlsZSI6Im1haW4vQXBwLmpzIn0=
