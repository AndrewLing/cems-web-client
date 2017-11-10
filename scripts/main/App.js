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
                    //$!"#&%'()*+,-./:;<>?@[\]^_`{}|~
                    var regZf = /[\$\!\"\#\&\%\'\(\)\*\+\,\-\.\/\:\;\<\>\?\@\[\\\]\^\_\`\{\}\|\~]/g;
//                    var booFlag = false;
//                    for (var j = 0; j < value.length - 2 && flag; j++) {
//                        if ((value.charAt(j) == value.charAt(j + 1)) || (value.charAt(j + 1) == value.charAt(j + 2))) {
//                            booFlag = true;
//                        }
//                    }
                    flagNum = regNum.test(value);
                    flagLow = regLow.test(value);
                    flagUp = regUp.test(value);
                    flagZf = regZf.test(value);
                    flagArr.push(flagNum);
                    flagArr.push(flagLow);
                    flagArr.push(flagUp);
                    flagArr.push(flagZf);
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
                        .attr('aria-hidden', true).append($('<span/>').addClass('closeimage')).on("mousedown", function (e) {
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
         * @param close {Function} 关闭窗口的回调方法
         */
        confirm: function (p, c, r,close) {
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
                        clickToClose: true,
                        click: function (e, d) {
                            if (r) {
                                r();
                            }
                        }
                    }
                ],
                closeEvent: function () {
                    if (close)
                    	close();
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