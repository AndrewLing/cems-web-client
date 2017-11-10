/**
 * 系统业务方法 {@code main.XXX}
 */
'use strict';
define(['main/App', 'main/right'], function (App, Menu) {
    window.App = App;
    window.Menu = Menu;

    App.initAjax();

    if (typeof window.main != 'undefined' && !window.main) {
        window.main = {};
    }

    (function () {
        var language = navigator.browserLanguage || navigator.language;
        var langRegion = language.split('-');
        window.main = {
            Lang: langRegion[0] && langRegion[0].toLowerCase(),
            region: langRegion[1] && langRegion[1].toUpperCase()
        };
    })();

    /******************************************** jquery 公共方法扩展 **************************************************/
    if (jQuery)(function ($) {
        $.extend({
            /**
             * AJAX 请求
             */
            http: {
                /**
                 * Ajax调用扩展
                 *
                 * @param url {string} 链接地址
                 * @param params {Object} 参数
                 * @param callback {Function} 成功回调方法
                 * @param error {Function} 失败回调方法
                 * @param async {Boolean} 是否异步，true:异步（默认） | false:同步
                 */
                ajax: function (url, params, callback, error, async) {
                    var send = function () {
                        var sendDone = function () {
                            var defer = $.Deferred();
                            $.ajax({
                                type: "POST",
                                url: url,
                                data: JSON.stringify(params),
                                //timeout : 120000,
                                async: async,
                                success: function (data, status, xhr) {
                                    defer.resolve(true, data, status, xhr);
                                },
                                error: function (data, status, errorThrown) {
                                    defer.resolve(false, data, status, errorThrown);
                                }
                            });
                            return defer.promise();
                        };
                        $.when(sendDone()).done(function (success, data, status, xhr) {
                            if (success) {
                                if (callback && main.checkData(data)) {
                                    try {
                                        callback(data, status, xhr);
                                    } catch (e) {
                                        console.error(e);
                                    }
                                }
                                Menu.hasElementRight();
                            }
                            else {
                                if (data.status == 0) {
                                    window.location.reload();
                                } else if (data.status != 200) {
                                    var msg = Msg.ajax.error || (data.statusText + ":" + data.status);
                                    msg = data.status == 502 ? Msg.ajax.badgateway : msg;
                                    msg = data.status == 504 ? Msg.ajax.gatewayTimeout : msg;
                                    App.alert({
                                        id: data.status,
                                        title: Msg.info,
                                        message: msg
                                    }, function () {
                                        // TODO 错误提示后操作，如刷新页面
                                    });
                                    if (error) {
                                        try {
                                            error(data, status);
                                        } catch (e) {
                                            console.error(e);
                                        }
                                    }
                                }
                                Menu.hasElementRight();
                            }
                        });
                    };
                    // TODO 验证是否登录
                    if (!(url.indexOf('login') != -1 || url.indexOf('ssoLogin') != -1 || url.indexOf('validTokenIdFromServer') != -1 || url.indexOf('checkLogin') != -1 || url.indexOf('sendEmail') != -1 || url.indexOf('pwdBack') != -1 || url.indexOf('getLogoAndTitle') != -1)) {
                        Menu.checkLogin(send);
                    }
                    else {
                        send();
                    }
                },
                /**
                 * 跨域 Ajax 访问
                 * @param url {string} 链接地址
                 * @param params {Object} 参数
                 * @param callback {Function} 成功回调方法
                 * @param error {Function} 失败回调方法
                 * @param async 是否异步，true:异步（默认） | false:同步
                 */
                crossAjax: function (url, params, callback, error, async) {
                    var send = function () {
                        var sendDone = function () {
                            var defer = $.Deferred();
                            $.ajax({
                                type: "GET",
                                url: url,
                                data: JSON.stringify(params),
                                dataType: 'jsonp',
                                jsonp: "jsonCallback",
                                async: async,
                                success: function (data, status, xhr) {
                                    defer.resolve(true, data, status, xhr);
                                },
                                error: function (data, status, errorThrown) {
                                    defer.resolve(false, data, status, errorThrown);
                                }
                            });
                            return defer.promise();
                        };

                        $.when(sendDone()).done(function (success, data, status, xhr) {
                            if (success) {
                                if (callback && main.checkData(data)) {
                                    try {
                                        callback(data, status, xhr);
                                    } catch (e) {
                                        console.error(e);
                                    }
                                }
                                Menu.hasElementRight();
                            }
                            else {
                                if (data.status == 0) {
                                    window.location.reload();
                                } else if (data.status != 200) {
                                    var msg = data.status == 502 ? Msg.ajax.badgateway : (data.statusText + ":" + data.status);
                                    msg = data.status == 504 ? Msg.ajax.gatewayTimeout : (data.statusText + ":" + data.status);
                                    App.alert({
                                        id: data.status,
                                        title: Msg.info,
                                        message: msg
                                    });
                                    if (error) {
                                        try {
                                            error(data, status, errorThrown);
                                        } catch (e) {
                                            console.error(e);
                                        }
                                    }
                                }
                                Menu.hasElementRight();
                            }
                        });
                    };
                    // TODO 验证是否登录
                    if (!(url.indexOf('login') != -1 || url.indexOf('ssoLogin') != -1 || url.indexOf('validTokenIdFromServer') != -1 || url.indexOf('checkLogin') != -1 || url.indexOf('sendEmail') != -1 || url.indexOf('pwdBack') != -1 || url.indexOf('getLogoAndTitle') != -1)) {
                        Menu.checkLogin(send);
                    }
                    else {
                        send();
                    }
                },
                GET: function (url, successCallBack, async) {
                    var send = function () {
                        var sendDone = function () {
                            var defer = $.Deferred();
                            $.ajax({
                                type: "GET",
                                url: url,
                                async: async,
                                success: function (data, status, xhr) {
                                    defer.resolve(true, data, status, xhr);
                                }
                            });
                            return defer.promise();
                        };
                        $.when(sendDone()).done(function (success, data, status, xhr) {
                            if (successCallBack && App.getClassOf(successCallBack) == "Function" && main.checkData(data)) {
                                try {
                                    successCallBack(data, status, xhr);
                                } catch (e) {
                                    console.error(e);
                                }
                            }
                            Menu.hasElementRight();
                        });
                    };
                    // TODO 验证是否登录
                    if (!(url.indexOf('indexhtml') != -1 || url.indexOf('ssoLogin') != -1 || url.indexOf('login') != -1 || url.indexOf('validTokenIdFromServer') != -1 || url.indexOf('checkLogin') != -1 || url.indexOf('sendEmail') != -1 || url.indexOf('pwdBack') != -1 || url.indexOf('getLogoAndTitle') != -1)) {
                        Menu.checkLogin(send);
                    }
                    else {
                        send();
                    }
                },
                POST: function (url, params, successCallBack, async) {
                    var send = function () {
                        var sendDone = function () {
                            var defer = $.Deferred();
                            $.ajax({
                                type: "POST",
                                url: url,
                                async: async,
                                dataType: "json",
                                contentType: 'application/json',
                                data: JSON.stringify(params),
                                success: function (data, status, xhr) {
                                    defer.resolve(true, data, status, xhr);
                                }
                            });
                            return defer.promise();
                        };
                        $.when(sendDone()).done(function (success, data, status, xhr) {
                            if (successCallBack && App.getClassOf(successCallBack) == "Function" && main.checkData(data)) {
                                try {
                                    successCallBack(data, status, xhr);
                                } catch (e) {
                                    console.error(e);
                                }
                            }
                            Menu.hasElementRight();
                        });
                    }
                    // TODO 验证是否登录
                    if (!(url.indexOf('login') != -1 || url.indexOf('validTokenIdFromServer') != -1 || url.indexOf('checkLogin') != -1 || url.indexOf('sendEmail') != -1 || url.indexOf('pwdBack') != -1 || url.indexOf('getLogoAndTitle') != -1)) {
                        Menu.checkLogin(send);
                    }
                    else {
                        send();
                    }
                },
                PUT: function (url, params, successCallBack, async) {
                    var send = function () {
                        var sendDone = function () {
                            var defer = $.Deferred();
                            $.ajax({
                                type: "PUT",
                                url: url,
                                async: async,
                                data: JSON.stringify(params),
                                success: function (data, status, xhr) {
                                    defer.resolve(true, data, status, xhr);
                                }
                            });
                            return defer.promise();
                        };
                        $.when(sendDone()).done(function (success, data, status, xhr) {
                            if (successCallBack && App.getClassOf(successCallBack) == "Function" && main.checkData(data)) {
                                try {
                                    successCallBack(data, status, xhr);
                                } catch (e) {
                                    console.error(e);
                                }
                            }
                            Menu.hasElementRight();
                        });
                    }
                    // TODO 验证是否登录
                    if (!(url.indexOf('login') != -1 || url.indexOf('ssoLogin') != -1 || url.indexOf('validTokenIdFromServer') != -1 || url.indexOf('checkLogin') != -1 || url.indexOf('sendEmail') != -1 || url.indexOf('pwdBack') != -1 || url.indexOf('getLogoAndTitle') != -1)) {
                        Menu.checkLogin(send);
                    }
                    else {
                        send();
                    }
                },
                DELETE: function (url, successCallBack, async) {
                    var send = function () {
                        var sendDone = function () {
                            var defer = $.Deferred();
                            $.ajax({
                                type: "DELETE",
                                url: url,
                                async: async,
                                success: function (data, status, xhr) {
                                    defer.resolve(true, data, status, xhr);
                                }
                            });
                            return defer.promise();
                        };
                        $.when(sendDone()).done(function (success, data, status, xhr) {
                            if (successCallBack && App.getClassOf(successCallBack) == "Function" && main.checkData(data)) {
                                try {
                                    successCallBack(data, status, xhr);
                                } catch (e) {
                                    console.error(e);
                                }
                            }
                            Menu.hasElementRight();
                        });
                    }
                    // TODO 验证是否登录
                    if (!(url.indexOf('login') != -1 || url.indexOf('ssoLogin') != -1 || url.indexOf('validTokenIdFromServer') != -1 || url.indexOf('checkLogin') != -1 || url.indexOf('sendEmail') != -1 || url.indexOf('pwdBack') != -1 || url.indexOf('getLogoAndTitle') != -1)) {
                        Menu.checkLogin(send);
                    }
                    else {
                        send();
                    }
                }
            }
        });

        /**
         * jQuery对象方法扩展
         */
        $.fn.extend({
            seek: function (name) {
                return $(this).find('[name=' + name + ']');
            },

            /**
             * 填充元素文本值
             * @param  {[string]} text
             */
            fillText: function (text) {
                return $(this).each(function () {
                    var _dom = $(this)[0];
                    if (_dom.tagName.toUpperCase() === 'INPUT') {
                        $(this).val(text);
                    } else {
                        $(this).html(text);
                    }
                });
            },

            /**
             * 填充jquery对象指定区域数据
             * 若data为string则填充当前元素
             * @param  {[object | string]} data 填充数据对象{k: v, ...}
             */
            fill: function (data) {
                return $(this).each(function () {
                    if (typeof data === 'string') {
                        $(this).fillText(data);
                    } else {
                        for (var k in data) {
                            $(this).seek(k).fillText(data[k]);
                        }
                    }
                });
            },

            /**
             * 为jquery对象添加src属性值
             * @param  {[string]} url    请求url
             * @param  {[object]} params 请求参数
             */
            attrSrc: function (url, params) {
                return $(this).each(function () {
                    url += '?';
                    for (var k in params) {
                        url += k + '=' + params[k] + '&';
                    }
                    url += '_t=' + new Date().getTime();
                    $(this).attr('src', url);
                });
            },

            /**
             * placeholder支持
             */
            placeholderSupport: function () {
                var $this = $(this);
                var pm = $this.prop('placeholder') || $this.attr('placeholder');
                var message = main.eval(pm);
                if ('placeholder' in document.createElement('input')) {
                    $this.attr("placeholder", message);
                } else {
                    var spanMessage = $("<span>" + message + "</span>");
                    var tw = Number(this.width());
                    var left = 0 - (this.width() + 5);
                    spanMessage.css({'position': 'relative', 'top': 5}).css('left', left)
                        .css({"color": '#b0b0b0', "font-size": '10pt', 'cursor': 'text'})
                        .css({'width': this.width(), 'height': $this.height(), 'overflow': 'hidden'})
                        .css({'display': 'inline-block', 'word-break': 'keep-all'})
                        .css('margin-right', left).attr('title', message);
                    spanMessage.click(function () {
                        $this.focus();
                    });
                    $this.parent().append(spanMessage);

                    $this.on('keyup blur', function () {
                        var v = $this.val();
                        if (v && v.length > 0) {
                            spanMessage.hide();
                        } else {
                            spanMessage.show();
                        }
                    });
                }
            },

            /**
             * 载入远程 HTML 文件代码并插入至 DOM 中
             * @param action 链接对象，形如 {url: '链接地址', styles: [加载的样式文件], scripts: [js脚本文件], loadModule: [{App.Moudle} 系统模块]}
             * @param params {Object} 参数 key/value 数据
             * @param callback 载入成功时回调函数
             */
            loadPage: function (action, params, callback) {
                if (App.getClassOf(action) == 'String') {
                    action = {
                        url: action
                    };
                }
                var $this = $(this);
                var url = action.url;
                if (App.getClassOf(params) == 'Function') {
                    callback = params;
                    params = {};
                }
                !params && (params = {});
                var right = Menu.getRight(url);
                right && (right.params = params);

                var loadMainPage = function () {
                    require(action.styles || [], function () {
                        $this.empty();
                        var scripts = [];
                        action.scripts && (scripts = scripts.concat(action.scripts));

                        var execLoad = function () {
                            $this.load(url, function (data, status, xhr) {
                                Menu.hasElementRight();
                                i18n.setLanguage();

                                require(scripts, function () {
                                    $.each(arguments, function (i, arg) {
                                        if (arg) {
                                            App.getClassOf(arg.Render) == 'Function' &&
                                            $(function () {
                                                try {
                                                    arg.Render(params);
                                                } catch (e) {
                                                    console.error(e);
                                                }
                                            });
                                        }
                                    });
                                    App.getClassOf(callback) == 'Function' && callback(data, arguments);
                                    Menu.hasElementRight();
                                });
                            });
                        };

                        if (action.loadModule || scripts[0]) {
                            i18n.loadLanguageFile(
                                action.loadModule || scripts[0],
                                Cookies.getCook("Prefer_Lang") || (main.Lang + "_" + (main.region == 'GB' ? 'UK' : main.region)) || 'zh_CN',
                                function () {
                                    i18n.setLanguage();
                                    execLoad();
                                }
                            );
                        } else {
                            execLoad();
                        }
                    });
                };
                // 验证是否登录
                if (!(url.indexOf('login') != -1 || url.indexOf('getpass') != -1 || url.indexOf('checkLogin') != -1 || url.indexOf('sendEmail') != -1 || url.indexOf('pwdBack') != -1 || url.indexOf('getLogoAndTitle') != -1)) {
                    Menu.checkLogin(loadMainPage);
                }
                else {
                    loadMainPage();
                }
            }

        });
    })(jQuery);

    /**
     * 加载系统页面（系统模块入口）
     */
    main.loadSystem = function () {
        console.time('系统界面加载');

        main.initLanguage(function () {
            App.initValidate();
            Menu.clearUserRole();
            if (Menu.isLogin()) {
                $(document).unbind('keydown');
                $.http.ajax('/role/queryUserRolSrc', {}, function (res) {
                    if (res.success) {
                        Menu.setUserRole(res.data.datas);
                    }
                }, null, false);
            }

            var bdy = $('#main_view');

            var defaultLoading = 'main';
            var enterPath = '/modules/main.html';
            var scriptList = ['modules/main'];
            var styleList = ['css!/css/main/main.css'];
            var prevLoad = function () {
                document.title = Msg.systemName;
                console.timeEnd('系统界面加载');
            };
            Cookies.setCookByName('defaultLoading', defaultLoading);
            bdy.loadPage({url: enterPath, scripts: scriptList, styles: styleList}, {}, prevLoad);
        });
    };

    /**
     * 语言设置
     * @param language 语言
     * @param callback 国际化数据加载完成回调方法
     */
    main.initLanguage = function (language, callback) {
        if (typeof language == 'function') {
            callback = language;
            language = false;
        }

        var preferLang = language || Cookies.getCook("Prefer_Lang") || (main.Lang + "_" + (main.region == 'GB' ? 'UK' : main.region)) || 'zh_CN';
        console.log('language=', preferLang);

        main.Lang = preferLang.split('_')[0], preferLang.split('_').length > 1 && (main.region = preferLang.split('_')[1]);

        i18n.loadLanguageFile(preferLang, function () {
            i18n.setLanguage();

            App.getClassOf(callback) == 'Function' && callback();
        });
    };
    /**
     * 获取鼠标当前位置（x, y）
     * @param e
     * @returns {{x: (Number|number), y: (Number|number)}}
     */
    main.getMousePos = function (e) {
        var d = document, de = d.documentElement, db = d.body;
        e = e || window.event;
        return {
            x: e.pageX || (e.clientX + (de.scrollLeft || db.scrollLeft)),
            y: e.pageY || (e.clientY + (de.scrollTop || db.scrollTop))
        };
    };
    main.eval = function (str) {
        var r;
        try {
            r = eval('(' + str + ')');
        } catch (e) {
        }
        return r ? r : str;
    };
    main.getMsg = function (msg, params) {
        if (params && params.length)
            for (var i = 0; i < params.length; i++)
                msg = msg.replace('{' + i + '}', params[i]);
        return msg;
    };

    /**
     * 获取系统根网络路径
     * @returns {String}
     */
    main.rootPath = function () {
        var html = window.location.href;
        var host = window.location.host;
        return html.substring(0, html.lastIndexOf(host) + host.length + 1);
    };

    /**
     * 获取浏览器类型
     * @returns {Object}
     */
    main.getBrowser = function () {
        var browser = $.browser;
        if (!browser) {
            var uaMatch = function (ua) {
                ua = ua.toLowerCase();

                var match = /(chrome)[ \/]([\w.]+)/.exec(ua) ||
                    /(webkit)[ \/]([\w.]+)/.exec(ua) ||
                    /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua) ||
                    /(msie) ([\w.]+)/.exec(ua) ||
                    ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua) ||
                    [];

                return {
                    browser: match[1] || "",
                    version: match[2] || "0"
                };
            }

            var matched = uaMatch(navigator.userAgent);
            browser = {};

            if (matched.browser) {
                browser[matched.browser] = true;
                browser.version = matched.version;
            }

            // 区分 Chrome 和 Safari
            if (browser.chrome) {
                browser.webkit = true;
            } else if (browser.webkit) {
                browser.safari = true;
            }
        }
        return browser;
    };

    main.openSinglePlant = function (sId, sName) {
        var singleWin = window.open("", '_blank');
        singleWin.sessionStorage.setItem("sId", sId);
        singleWin.sessionStorage.setItem("sName", sName);
        singleWin.location.href = "singlePlant.html"
    };

    /**
     * 添加获取url参数的方法
     * @param name
     * @returns {*}
     */
    main.getUrlParam = function (name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        var r = window.location.search.substr(1).match(reg);
        if (r != null)
            return unescape(r[2]);
        return null;
    };

    /**
     * 检查ajax响应数据状态
     * @param data
     */
    main.checkData = function (data) {
        data = typeof data == "string" ? JSON.parse(data) : data;
        if (data && !data.success) {
            if (data.data && data.data.failCode && data.data.failCode == "306") {
                Cookies.clearById('tokenId');
                App.dialog('close');
                App.alert({
                    id: 'right',
                    title: Msg.info,
                    message: Msg.systemSetting.relogin
                }, function () {
                    //sso需放开
                    //window.location = data.data.message;
                    Cookies.clearById('tokenId');
                    window.location = "/";
                });
                //session过期后, 使用top来获取页面引用, redirect到登录界面
                //否则大屏会出现地图层redirect到登录页面, 而大屏模块仍展示的情况
            } else if (data.data && data.data.failCode && data.data.failCode == "307") {
                Cookies.clearById('tokenId');
                App.dialog('close');
                App.alert({
                    id: 'right',
                    title: Msg.info,
                    message: Msg.systemSetting.forcerelogin
                }, function () {
                    Cookies.clearById('tokenId');
                    window.location = "/";
                });
            } else if (data.data && data.data.failCode && data.data.failCode == "401") {
                App.alert({
                    id: 'right',
                    title: Msg.info,
                    message: Msg.systemSetting.notRight
                });
            } else if (data.data && data.data.failCode && data.data.failCode == "305") {
                Cookies.clearById('tokenId');
                window.location = data.data.message;
            } else if (data.data && data.data.failCode && data.data.failCode == "404") {
                App.alert({
                    id: 'right',
                    title: Msg.info,
                    message: Msg.systemSetting.notExists
                });
            } else if (data.data && data.data.failCode && data.data.failCode == "405") {
                App.dialog('close');
                Cookies.clearById('tokenId');
                App.alert({
                    id: 'right',
                    title: Msg.info,
                    message: Msg.systemSetting.userInfoUpdate + "," + Msg.systemSetting.relogin
                }, function () {
//                	sso 需放开
                    //window.location = data.data.message;
                    //session过期后, 使用top来获取页面引用, redirect到登录界面
                    //否则大屏会出现地图层redirect到登录页面, 而大屏模块仍展示的情况
                    Cookies.clearById('tokenId');
                    window.location = "/";
                });
            } else {
                return true;
            }
        } else {
            return true;
        }

    };

    /**
     * 域树节点
     * @param domains {Array} 节点元素集
     */
    main.getZnodes = function (domains, zNodes) {
        if (!zNodes) {
            zNodes = [];
        }
        for (var i = 0; i < domains.length; i++) {
            var node = {
                "id": domains[i].id, "pId": domains[i].pid,
                "name": domains[i].name, "open": false
            };
            node.name = main.getTopDomianName(node.name);
            if (domains[i].model == "STATION") {
                node.icon = "/images/sm/nodeStation.png";
            }
            zNodes.push(node);
            if (domains[i].childs && domains[i].childs.length > 0) {
                var temp = main.getZnodes(domains[i].childs, zNodes);
                zNodes.concat(temp);
            }
        }
        return zNodes;
    };

    /**
     * 电站树节点
     * @param domains {Array} 节点元素集
     */
    main.getZnodes2 = function (data, zNodes) {
        if (!zNodes) {
            zNodes = [];
        }
        for (var i = 0; i < data.length; i++) {
            var node = {
                "id": data[i].id, "pId": data[i].pid,
                "name": data[i].name, "model": data[i].model, "open": false
            };
            node.name = main.getTopDomianName(node.name);
            if (data[i].model == "STATION") {
                node.icon = "/images/sm/nodeStation.png";
            }
            zNodes.push(node);
            if (data[i].childs && data[i].childs.length > 0) {
                var temp = main.getZnodes2(data[i].childs, zNodes);
                zNodes.concat(temp);
            }
        }
        return zNodes;
    };

    /**
     * 密码加密
     * @param pwd {String} 明文
     * @param i {Integer} 加密层级
     * @returns {String} 密文
     */
    main.base64 = function (pwd, i) {
        var newPwd = $.base64.encode(pwd);
        if (!i) {
            return newPwd;
        }
        i--;
        if (i > 0) {
            newPwd = main.base64(newPwd, i);
        }
        return newPwd;
    };
    /**
     * 图片大小检测 以及类型检测
     * size 默认 512
     * typeArr 默认["png", "jpg", "bmp", "jpeg"]
     */
    main.checkImage = function (e, element, imagesize, typeArr) {
        imagesize = (!isNaN(imagesize) && Number(imagesize)) || 512;
        typeArr = typeArr || ["png", "jpg", "bmp", "jpeg"];
        if (element) {
            var fileName = element.val();
            var fileArray = fileName.split(".");
            var filetype = fileArray[fileArray.length - 1].toLowerCase();
            if (!filetype || !typeArr.contains(filetype)) {
                element.val('');
                main.comonErrorFun(Msg.systemSetting.imgTypeError);
                return false;
            }
            if (fileName && fileName.length > 200) {
                element.val('');
                main.comonErrorFun(Msg.systemSetting.maxFileName);
                return false;
            }
        }
        if (e && e.target.files) {
            var size = e.target.files[0].size;
            if (size && !isNaN(size) && Number(size) > imagesize * 1000) {
                element && element.val('');
                App.alert({
                    id: 'checkImage',
                    title: Msg.info,
                    message: Msg.systemSetting.moreMaxLimit
                });
                return false;
            }
        }
        return true;
    };
    /**
     * 弹出 提示方法
     */
    main.comonErrorFun = function (message, fun) {
        App.alert({
            title: Msg.info,
            message: message
        }, function () {
            typeof fun == "function" && fun();
        });
    };
    main.loginget = function () {
        $.http.GET('/indexhtml', function (data) {
        });
    };
    /**
     * 绑定回车
     */
    main.bindEnter = function (domEnter, domClick) {
        $(domEnter).off('keyup').on('keyup', function (event) {
            if ((event.keyCode || event.which) == 13) {
                $(domClick).trigger("click");
            }
        });
    };
    /**
     * 解绑storage 事件
     */
    main.unbindStorage = function () {
        if (window.addEventListener) {
            window.removeEventListener("storage", function () {
            }, false);
        }
        else if (window.attachEvent) {
            window.detachEvent("onstorage", function () {
            });
        }
    };
    /**
     * 绑定storage 改变事件
     */
    main.bindStorage = function () {
        main.unbindStorage();
        if (window.addEventListener) {
            window.addEventListener("storage", main.storageChange, false);
        }
        else if (window.attachEvent) {
            window.attachEvent("onstorage", main.storageChange);
        }
    };
    /**
     * storage 变化处理方法
     */
    main.storageChange = function (e) {
        if ((e.key == "userid" && e.newValue != e.oldValue && e.oldValue) || (!e.key && !Cookies.getCook('tokenId'))) {
            if ($.trim(sessionStorage.getItem("sId")) != "") {
                window.location = "/";
            } else {
                window.location.reload();
            }
        } else if (e.key == "userName" && e.newValue != e.oldValue) {
            $("#userName").html(e.newValue);
        } else if (e.key == "userAvatar" && e.newValue != e.oldValue) {
            $("#userImage").attr("src", "/user/getImage?t=" + e.newValue).error(function () {
                $(this).attr('src', '/images/main/userHead.png');
            });
        }
    };
    /**
     * 校验提示工具
     * @param  sel 选择表达式
     * @param  msg 错误信息
     * @param  flg 标记（true: 显示；false: 取消）
     * @param  pos 提示信息显示位置，不传默认为top
     */
    main.tip = function (sel, msg, flg, pos) {
        var position = 'top';
        if (pos) {
            position = pos;
        }
        if (!flg) {
            $(sel).css("border-color", "").tooltip("destroy");
        } else {
            $(sel).css("border-color", "red").tooltip({title: msg, placement: position});
        }
    };
    main.getTopDomianName = function (name) {
        if (name && "Msg.&topdomain" == name) {
            name = i18n._eval(name);
        }
        return name;
    };
    return main;
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJtYWluL21haW4uanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIOezu+e7n+S4muWKoeaWueazlSB7QGNvZGUgbWFpbi5YWFh9XHJcbiAqL1xyXG4ndXNlIHN0cmljdCc7XHJcbmRlZmluZShbJ21haW4vQXBwJywgJ21haW4vcmlnaHQnXSwgZnVuY3Rpb24gKEFwcCwgTWVudSkge1xyXG4gICAgd2luZG93LkFwcCA9IEFwcDtcclxuICAgIHdpbmRvdy5NZW51ID0gTWVudTtcclxuXHJcbiAgICBBcHAuaW5pdEFqYXgoKTtcclxuXHJcbiAgICBpZiAodHlwZW9mIHdpbmRvdy5tYWluICE9ICd1bmRlZmluZWQnICYmICF3aW5kb3cubWFpbikge1xyXG4gICAgICAgIHdpbmRvdy5tYWluID0ge307XHJcbiAgICB9XHJcblxyXG4gICAgKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgbGFuZ3VhZ2UgPSBuYXZpZ2F0b3IuYnJvd3Nlckxhbmd1YWdlIHx8IG5hdmlnYXRvci5sYW5ndWFnZTtcclxuICAgICAgICB2YXIgbGFuZ1JlZ2lvbiA9IGxhbmd1YWdlLnNwbGl0KCctJyk7XHJcbiAgICAgICAgd2luZG93Lm1haW4gPSB7XHJcbiAgICAgICAgICAgIExhbmc6IGxhbmdSZWdpb25bMF0gJiYgbGFuZ1JlZ2lvblswXS50b0xvd2VyQ2FzZSgpLFxyXG4gICAgICAgICAgICByZWdpb246IGxhbmdSZWdpb25bMV0gJiYgbGFuZ1JlZ2lvblsxXS50b1VwcGVyQ2FzZSgpXHJcbiAgICAgICAgfTtcclxuICAgIH0pKCk7XHJcblxyXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqIGpxdWVyeSDlhazlhbHmlrnms5XmianlsZUgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXHJcbiAgICBpZiAoalF1ZXJ5KShmdW5jdGlvbiAoJCkge1xyXG4gICAgICAgICQuZXh0ZW5kKHtcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIEFKQVgg6K+35rGCXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBodHRwOiB7XHJcbiAgICAgICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICAgICAqIEFqYXjosIPnlKjmianlsZVcclxuICAgICAgICAgICAgICAgICAqXHJcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gdXJsIHtzdHJpbmd9IOmTvuaOpeWcsOWdgFxyXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHBhcmFtcyB7T2JqZWN0fSDlj4LmlbBcclxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBjYWxsYmFjayB7RnVuY3Rpb259IOaIkOWKn+Wbnuiwg+aWueazlVxyXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGVycm9yIHtGdW5jdGlvbn0g5aSx6LSl5Zue6LCD5pa55rOVXHJcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gYXN5bmMge0Jvb2xlYW59IOaYr+WQpuW8guatpe+8jHRydWU65byC5q2l77yI6buY6K6k77yJIHwgZmFsc2U65ZCM5q2lXHJcbiAgICAgICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgICAgIGFqYXg6IGZ1bmN0aW9uICh1cmwsIHBhcmFtcywgY2FsbGJhY2ssIGVycm9yLCBhc3luYykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBzZW5kID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2VuZERvbmUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZGVmZXIgPSAkLkRlZmVycmVkKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiUE9TVFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybDogdXJsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHBhcmFtcyksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy90aW1lb3V0IDogMTIwMDAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzeW5jOiBhc3luYyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCB4aHIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXIucmVzb2x2ZSh0cnVlLCBkYXRhLCBzdGF0dXMsIHhocik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKGRhdGEsIHN0YXR1cywgZXJyb3JUaHJvd24pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXIucmVzb2x2ZShmYWxzZSwgZGF0YSwgc3RhdHVzLCBlcnJvclRocm93bik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGVmZXIucHJvbWlzZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkLndoZW4oc2VuZERvbmUoKSkuZG9uZShmdW5jdGlvbiAoc3VjY2VzcywgZGF0YSwgc3RhdHVzLCB4aHIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrICYmIG1haW4uY2hlY2tEYXRhKGRhdGEpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhkYXRhLCBzdGF0dXMsIHhocik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTWVudS5oYXNFbGVtZW50UmlnaHQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkYXRhLnN0YXR1cyA9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGRhdGEuc3RhdHVzICE9IDIwMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbXNnID0gTXNnLmFqYXguZXJyb3IgfHwgKGRhdGEuc3RhdHVzVGV4dCArIFwiOlwiICsgZGF0YS5zdGF0dXMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtc2cgPSBkYXRhLnN0YXR1cyA9PSA1MDIgPyBNc2cuYWpheC5iYWRnYXRld2F5IDogbXNnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtc2cgPSBkYXRhLnN0YXR1cyA9PSA1MDQgPyBNc2cuYWpheC5nYXRld2F5VGltZW91dCA6IG1zZztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQXBwLmFsZXJ0KHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBkYXRhLnN0YXR1cyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBNc2cuaW5mbyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IG1zZ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPIOmUmeivr+aPkOekuuWQjuaTjeS9nO+8jOWmguWIt+aWsOmhtemdolxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yKGRhdGEsIHN0YXR1cyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNZW51Lmhhc0VsZW1lbnRSaWdodCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE8g6aqM6K+B5piv5ZCm55m75b2VXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEodXJsLmluZGV4T2YoJ2xvZ2luJykgIT0gLTEgfHwgdXJsLmluZGV4T2YoJ3Nzb0xvZ2luJykgIT0gLTEgfHwgdXJsLmluZGV4T2YoJ3ZhbGlkVG9rZW5JZEZyb21TZXJ2ZXInKSAhPSAtMSB8fCB1cmwuaW5kZXhPZignY2hlY2tMb2dpbicpICE9IC0xIHx8IHVybC5pbmRleE9mKCdzZW5kRW1haWwnKSAhPSAtMSB8fCB1cmwuaW5kZXhPZigncHdkQmFjaycpICE9IC0xIHx8IHVybC5pbmRleE9mKCdnZXRMb2dvQW5kVGl0bGUnKSAhPSAtMSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgTWVudS5jaGVja0xvZ2luKHNlbmQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VuZCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICAgICAqIOi3qOWfnyBBamF4IOiuv+mXrlxyXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHVybCB7c3RyaW5nfSDpk77mjqXlnLDlnYBcclxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBwYXJhbXMge09iamVjdH0g5Y+C5pWwXHJcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gY2FsbGJhY2sge0Z1bmN0aW9ufSDmiJDlip/lm57osIPmlrnms5VcclxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBlcnJvciB7RnVuY3Rpb259IOWksei0peWbnuiwg+aWueazlVxyXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGFzeW5jIOaYr+WQpuW8guatpe+8jHRydWU65byC5q2l77yI6buY6K6k77yJIHwgZmFsc2U65ZCM5q2lXHJcbiAgICAgICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgICAgIGNyb3NzQWpheDogZnVuY3Rpb24gKHVybCwgcGFyYW1zLCBjYWxsYmFjaywgZXJyb3IsIGFzeW5jKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlbmQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzZW5kRG9uZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkZWZlciA9ICQuRGVmZXJyZWQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJHRVRcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cmw6IHVybCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShwYXJhbXMpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbnAnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzb25wOiBcImpzb25DYWxsYmFja1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzeW5jOiBhc3luYyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCB4aHIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXIucmVzb2x2ZSh0cnVlLCBkYXRhLCBzdGF0dXMsIHhocik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKGRhdGEsIHN0YXR1cywgZXJyb3JUaHJvd24pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXIucmVzb2x2ZShmYWxzZSwgZGF0YSwgc3RhdHVzLCBlcnJvclRocm93bik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGVmZXIucHJvbWlzZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgJC53aGVuKHNlbmREb25lKCkpLmRvbmUoZnVuY3Rpb24gKHN1Y2Nlc3MsIGRhdGEsIHN0YXR1cywgeGhyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzcykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjYWxsYmFjayAmJiBtYWluLmNoZWNrRGF0YShkYXRhKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZGF0YSwgc3RhdHVzLCB4aHIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1lbnUuaGFzRWxlbWVudFJpZ2h0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YS5zdGF0dXMgPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChkYXRhLnN0YXR1cyAhPSAyMDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1zZyA9IGRhdGEuc3RhdHVzID09IDUwMiA/IE1zZy5hamF4LmJhZGdhdGV3YXkgOiAoZGF0YS5zdGF0dXNUZXh0ICsgXCI6XCIgKyBkYXRhLnN0YXR1cyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1zZyA9IGRhdGEuc3RhdHVzID09IDUwNCA/IE1zZy5hamF4LmdhdGV3YXlUaW1lb3V0IDogKGRhdGEuc3RhdHVzVGV4dCArIFwiOlwiICsgZGF0YS5zdGF0dXMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBBcHAuYWxlcnQoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IGRhdGEuc3RhdHVzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IE1zZy5pbmZvLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogbXNnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3IoZGF0YSwgc3RhdHVzLCBlcnJvclRocm93bik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNZW51Lmhhc0VsZW1lbnRSaWdodCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE8g6aqM6K+B5piv5ZCm55m75b2VXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEodXJsLmluZGV4T2YoJ2xvZ2luJykgIT0gLTEgfHwgdXJsLmluZGV4T2YoJ3Nzb0xvZ2luJykgIT0gLTEgfHwgdXJsLmluZGV4T2YoJ3ZhbGlkVG9rZW5JZEZyb21TZXJ2ZXInKSAhPSAtMSB8fCB1cmwuaW5kZXhPZignY2hlY2tMb2dpbicpICE9IC0xIHx8IHVybC5pbmRleE9mKCdzZW5kRW1haWwnKSAhPSAtMSB8fCB1cmwuaW5kZXhPZigncHdkQmFjaycpICE9IC0xIHx8IHVybC5pbmRleE9mKCdnZXRMb2dvQW5kVGl0bGUnKSAhPSAtMSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgTWVudS5jaGVja0xvZ2luKHNlbmQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VuZCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBHRVQ6IGZ1bmN0aW9uICh1cmwsIHN1Y2Nlc3NDYWxsQmFjaywgYXN5bmMpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgc2VuZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNlbmREb25lID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRlZmVyID0gJC5EZWZlcnJlZCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIkdFVFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybDogdXJsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzeW5jOiBhc3luYyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCB4aHIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXIucmVzb2x2ZSh0cnVlLCBkYXRhLCBzdGF0dXMsIHhocik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGVmZXIucHJvbWlzZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkLndoZW4oc2VuZERvbmUoKSkuZG9uZShmdW5jdGlvbiAoc3VjY2VzcywgZGF0YSwgc3RhdHVzLCB4aHIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzQ2FsbEJhY2sgJiYgQXBwLmdldENsYXNzT2Yoc3VjY2Vzc0NhbGxCYWNrKSA9PSBcIkZ1bmN0aW9uXCIgJiYgbWFpbi5jaGVja0RhdGEoZGF0YSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzQ2FsbEJhY2soZGF0YSwgc3RhdHVzLCB4aHIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBNZW51Lmhhc0VsZW1lbnRSaWdodCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE8g6aqM6K+B5piv5ZCm55m75b2VXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEodXJsLmluZGV4T2YoJ2luZGV4aHRtbCcpICE9IC0xIHx8IHVybC5pbmRleE9mKCdzc29Mb2dpbicpICE9IC0xIHx8IHVybC5pbmRleE9mKCdsb2dpbicpICE9IC0xIHx8IHVybC5pbmRleE9mKCd2YWxpZFRva2VuSWRGcm9tU2VydmVyJykgIT0gLTEgfHwgdXJsLmluZGV4T2YoJ2NoZWNrTG9naW4nKSAhPSAtMSB8fCB1cmwuaW5kZXhPZignc2VuZEVtYWlsJykgIT0gLTEgfHwgdXJsLmluZGV4T2YoJ3B3ZEJhY2snKSAhPSAtMSB8fCB1cmwuaW5kZXhPZignZ2V0TG9nb0FuZFRpdGxlJykgIT0gLTEpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIE1lbnUuY2hlY2tMb2dpbihzZW5kKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbmQoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgUE9TVDogZnVuY3Rpb24gKHVybCwgcGFyYW1zLCBzdWNjZXNzQ2FsbEJhY2ssIGFzeW5jKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlbmQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzZW5kRG9uZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkZWZlciA9ICQuRGVmZXJyZWQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJQT1NUXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiB1cmwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXN5bmM6IGFzeW5jLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25cIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHBhcmFtcyksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKGRhdGEsIHN0YXR1cywgeGhyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVyLnJlc29sdmUodHJ1ZSwgZGF0YSwgc3RhdHVzLCB4aHIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRlZmVyLnByb21pc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJC53aGVuKHNlbmREb25lKCkpLmRvbmUoZnVuY3Rpb24gKHN1Y2Nlc3MsIGRhdGEsIHN0YXR1cywgeGhyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzc0NhbGxCYWNrICYmIEFwcC5nZXRDbGFzc09mKHN1Y2Nlc3NDYWxsQmFjaykgPT0gXCJGdW5jdGlvblwiICYmIG1haW4uY2hlY2tEYXRhKGRhdGEpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc0NhbGxCYWNrKGRhdGEsIHN0YXR1cywgeGhyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgTWVudS5oYXNFbGVtZW50UmlnaHQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE8g6aqM6K+B5piv5ZCm55m75b2VXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEodXJsLmluZGV4T2YoJ2xvZ2luJykgIT0gLTEgfHwgdXJsLmluZGV4T2YoJ3ZhbGlkVG9rZW5JZEZyb21TZXJ2ZXInKSAhPSAtMSB8fCB1cmwuaW5kZXhPZignY2hlY2tMb2dpbicpICE9IC0xIHx8IHVybC5pbmRleE9mKCdzZW5kRW1haWwnKSAhPSAtMSB8fCB1cmwuaW5kZXhPZigncHdkQmFjaycpICE9IC0xIHx8IHVybC5pbmRleE9mKCdnZXRMb2dvQW5kVGl0bGUnKSAhPSAtMSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgTWVudS5jaGVja0xvZ2luKHNlbmQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VuZCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBQVVQ6IGZ1bmN0aW9uICh1cmwsIHBhcmFtcywgc3VjY2Vzc0NhbGxCYWNrLCBhc3luYykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBzZW5kID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2VuZERvbmUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZGVmZXIgPSAkLkRlZmVycmVkKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiUFVUXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiB1cmwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXN5bmM6IGFzeW5jLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHBhcmFtcyksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKGRhdGEsIHN0YXR1cywgeGhyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVyLnJlc29sdmUodHJ1ZSwgZGF0YSwgc3RhdHVzLCB4aHIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRlZmVyLnByb21pc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJC53aGVuKHNlbmREb25lKCkpLmRvbmUoZnVuY3Rpb24gKHN1Y2Nlc3MsIGRhdGEsIHN0YXR1cywgeGhyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzc0NhbGxCYWNrICYmIEFwcC5nZXRDbGFzc09mKHN1Y2Nlc3NDYWxsQmFjaykgPT0gXCJGdW5jdGlvblwiICYmIG1haW4uY2hlY2tEYXRhKGRhdGEpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc0NhbGxCYWNrKGRhdGEsIHN0YXR1cywgeGhyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgTWVudS5oYXNFbGVtZW50UmlnaHQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE8g6aqM6K+B5piv5ZCm55m75b2VXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEodXJsLmluZGV4T2YoJ2xvZ2luJykgIT0gLTEgfHwgdXJsLmluZGV4T2YoJ3Nzb0xvZ2luJykgIT0gLTEgfHwgdXJsLmluZGV4T2YoJ3ZhbGlkVG9rZW5JZEZyb21TZXJ2ZXInKSAhPSAtMSB8fCB1cmwuaW5kZXhPZignY2hlY2tMb2dpbicpICE9IC0xIHx8IHVybC5pbmRleE9mKCdzZW5kRW1haWwnKSAhPSAtMSB8fCB1cmwuaW5kZXhPZigncHdkQmFjaycpICE9IC0xIHx8IHVybC5pbmRleE9mKCdnZXRMb2dvQW5kVGl0bGUnKSAhPSAtMSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgTWVudS5jaGVja0xvZ2luKHNlbmQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VuZCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBERUxFVEU6IGZ1bmN0aW9uICh1cmwsIHN1Y2Nlc3NDYWxsQmFjaywgYXN5bmMpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgc2VuZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNlbmREb25lID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRlZmVyID0gJC5EZWZlcnJlZCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIkRFTEVURVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybDogdXJsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzeW5jOiBhc3luYyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCB4aHIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXIucmVzb2x2ZSh0cnVlLCBkYXRhLCBzdGF0dXMsIHhocik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGVmZXIucHJvbWlzZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkLndoZW4oc2VuZERvbmUoKSkuZG9uZShmdW5jdGlvbiAoc3VjY2VzcywgZGF0YSwgc3RhdHVzLCB4aHIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzQ2FsbEJhY2sgJiYgQXBwLmdldENsYXNzT2Yoc3VjY2Vzc0NhbGxCYWNrKSA9PSBcIkZ1bmN0aW9uXCIgJiYgbWFpbi5jaGVja0RhdGEoZGF0YSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzQ2FsbEJhY2soZGF0YSwgc3RhdHVzLCB4aHIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBNZW51Lmhhc0VsZW1lbnRSaWdodCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETyDpqozor4HmmK/lkKbnmbvlvZVcclxuICAgICAgICAgICAgICAgICAgICBpZiAoISh1cmwuaW5kZXhPZignbG9naW4nKSAhPSAtMSB8fCB1cmwuaW5kZXhPZignc3NvTG9naW4nKSAhPSAtMSB8fCB1cmwuaW5kZXhPZigndmFsaWRUb2tlbklkRnJvbVNlcnZlcicpICE9IC0xIHx8IHVybC5pbmRleE9mKCdjaGVja0xvZ2luJykgIT0gLTEgfHwgdXJsLmluZGV4T2YoJ3NlbmRFbWFpbCcpICE9IC0xIHx8IHVybC5pbmRleE9mKCdwd2RCYWNrJykgIT0gLTEgfHwgdXJsLmluZGV4T2YoJ2dldExvZ29BbmRUaXRsZScpICE9IC0xKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBNZW51LmNoZWNrTG9naW4oc2VuZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZW5kKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIGpRdWVyeeWvueixoeaWueazleaJqeWxlVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgICQuZm4uZXh0ZW5kKHtcclxuICAgICAgICAgICAgc2VlazogZnVuY3Rpb24gKG5hbWUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAkKHRoaXMpLmZpbmQoJ1tuYW1lPScgKyBuYW1lICsgJ10nKTtcclxuICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiDloavlhYXlhYPntKDmlofmnKzlgLxcclxuICAgICAgICAgICAgICogQHBhcmFtICB7W3N0cmluZ119IHRleHRcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIGZpbGxUZXh0OiBmdW5jdGlvbiAodGV4dCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuICQodGhpcykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIF9kb20gPSAkKHRoaXMpWzBdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChfZG9tLnRhZ05hbWUudG9VcHBlckNhc2UoKSA9PT0gJ0lOUFVUJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnZhbCh0ZXh0KTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLmh0bWwodGV4dCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICog5aGr5YWFanF1ZXJ55a+56LGh5oyH5a6a5Yy65Z+f5pWw5o2uXHJcbiAgICAgICAgICAgICAqIOiLpWRhdGHkuLpzdHJpbmfliJnloavlhYXlvZPliY3lhYPntKBcclxuICAgICAgICAgICAgICogQHBhcmFtICB7W29iamVjdCB8IHN0cmluZ119IGRhdGEg5aGr5YWF5pWw5o2u5a+56LGhe2s6IHYsIC4uLn1cclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIGZpbGw6IGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gJCh0aGlzKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykuZmlsbFRleHQoZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgayBpbiBkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnNlZWsoaykuZmlsbFRleHQoZGF0YVtrXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiDkuLpqcXVlcnnlr7nosaHmt7vliqBzcmPlsZ7mgKflgLxcclxuICAgICAgICAgICAgICogQHBhcmFtICB7W3N0cmluZ119IHVybCAgICDor7fmsYJ1cmxcclxuICAgICAgICAgICAgICogQHBhcmFtICB7W29iamVjdF19IHBhcmFtcyDor7fmsYLlj4LmlbBcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIGF0dHJTcmM6IGZ1bmN0aW9uICh1cmwsIHBhcmFtcykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuICQodGhpcykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdXJsICs9ICc/JztcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBrIGluIHBhcmFtcykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1cmwgKz0gayArICc9JyArIHBhcmFtc1trXSArICcmJztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgdXJsICs9ICdfdD0nICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5hdHRyKCdzcmMnLCB1cmwpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogcGxhY2Vob2xkZXLmlK/mjIFcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIHBsYWNlaG9sZGVyU3VwcG9ydDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyICR0aGlzID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgICAgIHZhciBwbSA9ICR0aGlzLnByb3AoJ3BsYWNlaG9sZGVyJykgfHwgJHRoaXMuYXR0cigncGxhY2Vob2xkZXInKTtcclxuICAgICAgICAgICAgICAgIHZhciBtZXNzYWdlID0gbWFpbi5ldmFsKHBtKTtcclxuICAgICAgICAgICAgICAgIGlmICgncGxhY2Vob2xkZXInIGluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0JykpIHtcclxuICAgICAgICAgICAgICAgICAgICAkdGhpcy5hdHRyKFwicGxhY2Vob2xkZXJcIiwgbWVzc2FnZSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBzcGFuTWVzc2FnZSA9ICQoXCI8c3Bhbj5cIiArIG1lc3NhZ2UgKyBcIjwvc3Bhbj5cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHR3ID0gTnVtYmVyKHRoaXMud2lkdGgoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxlZnQgPSAwIC0gKHRoaXMud2lkdGgoKSArIDUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNwYW5NZXNzYWdlLmNzcyh7J3Bvc2l0aW9uJzogJ3JlbGF0aXZlJywgJ3RvcCc6IDV9KS5jc3MoJ2xlZnQnLCBsZWZ0KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuY3NzKHtcImNvbG9yXCI6ICcjYjBiMGIwJywgXCJmb250LXNpemVcIjogJzEwcHQnLCAnY3Vyc29yJzogJ3RleHQnfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmNzcyh7J3dpZHRoJzogdGhpcy53aWR0aCgpLCAnaGVpZ2h0JzogJHRoaXMuaGVpZ2h0KCksICdvdmVyZmxvdyc6ICdoaWRkZW4nfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmNzcyh7J2Rpc3BsYXknOiAnaW5saW5lLWJsb2NrJywgJ3dvcmQtYnJlYWsnOiAna2VlcC1hbGwnfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmNzcygnbWFyZ2luLXJpZ2h0JywgbGVmdCkuYXR0cigndGl0bGUnLCBtZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgICAgICBzcGFuTWVzc2FnZS5jbGljayhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICR0aGlzLmZvY3VzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgJHRoaXMucGFyZW50KCkuYXBwZW5kKHNwYW5NZXNzYWdlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgJHRoaXMub24oJ2tleXVwIGJsdXInLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB2ID0gJHRoaXMudmFsKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2ICYmIHYubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3Bhbk1lc3NhZ2UuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3Bhbk1lc3NhZ2Uuc2hvdygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICog6L295YWl6L+c56iLIEhUTUwg5paH5Lu25Luj56CB5bm25o+S5YWl6IezIERPTSDkuK1cclxuICAgICAgICAgICAgICogQHBhcmFtIGFjdGlvbiDpk77mjqXlr7nosaHvvIzlvaLlpoIge3VybDogJ+mTvuaOpeWcsOWdgCcsIHN0eWxlczogW+WKoOi9veeahOagt+W8j+aWh+S7tl0sIHNjcmlwdHM6IFtqc+iEmuacrOaWh+S7tl0sIGxvYWRNb2R1bGU6IFt7QXBwLk1vdWRsZX0g57O757uf5qih5Z2XXX1cclxuICAgICAgICAgICAgICogQHBhcmFtIHBhcmFtcyB7T2JqZWN0fSDlj4LmlbAga2V5L3ZhbHVlIOaVsOaNrlxyXG4gICAgICAgICAgICAgKiBAcGFyYW0gY2FsbGJhY2sg6L295YWl5oiQ5Yqf5pe25Zue6LCD5Ye95pWwXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBsb2FkUGFnZTogZnVuY3Rpb24gKGFjdGlvbiwgcGFyYW1zLCBjYWxsYmFjaykge1xyXG4gICAgICAgICAgICAgICAgaWYgKEFwcC5nZXRDbGFzc09mKGFjdGlvbikgPT0gJ1N0cmluZycpIHtcclxuICAgICAgICAgICAgICAgICAgICBhY3Rpb24gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybDogYWN0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHZhciAkdGhpcyA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgICAgICB2YXIgdXJsID0gYWN0aW9uLnVybDtcclxuICAgICAgICAgICAgICAgIGlmIChBcHAuZ2V0Q2xhc3NPZihwYXJhbXMpID09ICdGdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayA9IHBhcmFtcztcclxuICAgICAgICAgICAgICAgICAgICBwYXJhbXMgPSB7fTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICFwYXJhbXMgJiYgKHBhcmFtcyA9IHt9KTtcclxuICAgICAgICAgICAgICAgIHZhciByaWdodCA9IE1lbnUuZ2V0UmlnaHQodXJsKTtcclxuICAgICAgICAgICAgICAgIHJpZ2h0ICYmIChyaWdodC5wYXJhbXMgPSBwYXJhbXMpO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBsb2FkTWFpblBhZ2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZShhY3Rpb24uc3R5bGVzIHx8IFtdLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICR0aGlzLmVtcHR5KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzY3JpcHRzID0gW107XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbi5zY3JpcHRzICYmIChzY3JpcHRzID0gc2NyaXB0cy5jb25jYXQoYWN0aW9uLnNjcmlwdHMpKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBleGVjTG9hZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0aGlzLmxvYWQodXJsLCBmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCB4aHIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNZW51Lmhhc0VsZW1lbnRSaWdodCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGkxOG4uc2V0TGFuZ3VhZ2UoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWlyZShzY3JpcHRzLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaChhcmd1bWVudHMsIGZ1bmN0aW9uIChpLCBhcmcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhcmcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBBcHAuZ2V0Q2xhc3NPZihhcmcuUmVuZGVyKSA9PSAnRnVuY3Rpb24nICYmXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmcuUmVuZGVyKHBhcmFtcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFwcC5nZXRDbGFzc09mKGNhbGxiYWNrKSA9PSAnRnVuY3Rpb24nICYmIGNhbGxiYWNrKGRhdGEsIGFyZ3VtZW50cyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1lbnUuaGFzRWxlbWVudFJpZ2h0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhY3Rpb24ubG9hZE1vZHVsZSB8fCBzY3JpcHRzWzBdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpMThuLmxvYWRMYW5ndWFnZUZpbGUoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uLmxvYWRNb2R1bGUgfHwgc2NyaXB0c1swXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBDb29raWVzLmdldENvb2soXCJQcmVmZXJfTGFuZ1wiKSB8fCAobWFpbi5MYW5nICsgXCJfXCIgKyAobWFpbi5yZWdpb24gPT0gJ0dCJyA/ICdVSycgOiBtYWluLnJlZ2lvbikpIHx8ICd6aF9DTicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpMThuLnNldExhbmd1YWdlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4ZWNMb2FkKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4ZWNMb2FkKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAvLyDpqozor4HmmK/lkKbnmbvlvZVcclxuICAgICAgICAgICAgICAgIGlmICghKHVybC5pbmRleE9mKCdsb2dpbicpICE9IC0xIHx8IHVybC5pbmRleE9mKCdnZXRwYXNzJykgIT0gLTEgfHwgdXJsLmluZGV4T2YoJ2NoZWNrTG9naW4nKSAhPSAtMSB8fCB1cmwuaW5kZXhPZignc2VuZEVtYWlsJykgIT0gLTEgfHwgdXJsLmluZGV4T2YoJ3B3ZEJhY2snKSAhPSAtMSB8fCB1cmwuaW5kZXhPZignZ2V0TG9nb0FuZFRpdGxlJykgIT0gLTEpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgTWVudS5jaGVja0xvZ2luKGxvYWRNYWluUGFnZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBsb2FkTWFpblBhZ2UoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9KTtcclxuICAgIH0pKGpRdWVyeSk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDliqDovb3ns7vnu5/pobXpnaLvvIjns7vnu5/mqKHlnZflhaXlj6PvvIlcclxuICAgICAqL1xyXG4gICAgbWFpbi5sb2FkU3lzdGVtID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGNvbnNvbGUudGltZSgn57O757uf55WM6Z2i5Yqg6L29Jyk7XHJcblxyXG4gICAgICAgIG1haW4uaW5pdExhbmd1YWdlKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgQXBwLmluaXRWYWxpZGF0ZSgpO1xyXG4gICAgICAgICAgICBNZW51LmNsZWFyVXNlclJvbGUoKTtcclxuICAgICAgICAgICAgaWYgKE1lbnUuaXNMb2dpbigpKSB7XHJcbiAgICAgICAgICAgICAgICAkKGRvY3VtZW50KS51bmJpbmQoJ2tleWRvd24nKTtcclxuICAgICAgICAgICAgICAgICQuaHR0cC5hamF4KCcvcm9sZS9xdWVyeVVzZXJSb2xTcmMnLCB7fSwgZnVuY3Rpb24gKHJlcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXMuc3VjY2Vzcykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBNZW51LnNldFVzZXJSb2xlKHJlcy5kYXRhLmRhdGFzKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LCBudWxsLCBmYWxzZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBiZHkgPSAkKCcjbWFpbl92aWV3Jyk7XHJcblxyXG4gICAgICAgICAgICB2YXIgZGVmYXVsdExvYWRpbmcgPSAnbWFpbic7XHJcbiAgICAgICAgICAgIHZhciBlbnRlclBhdGggPSAnL21vZHVsZXMvbWFpbi5odG1sJztcclxuICAgICAgICAgICAgdmFyIHNjcmlwdExpc3QgPSBbJ21vZHVsZXMvbWFpbiddO1xyXG4gICAgICAgICAgICB2YXIgc3R5bGVMaXN0ID0gWydjc3MhL2Nzcy9tYWluL21haW4uY3NzJ107XHJcbiAgICAgICAgICAgIHZhciBwcmV2TG9hZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGRvY3VtZW50LnRpdGxlID0gTXNnLnN5c3RlbU5hbWU7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLnRpbWVFbmQoJ+ezu+e7n+eVjOmdouWKoOi9vScpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBDb29raWVzLnNldENvb2tCeU5hbWUoJ2RlZmF1bHRMb2FkaW5nJywgZGVmYXVsdExvYWRpbmcpO1xyXG4gICAgICAgICAgICBiZHkubG9hZFBhZ2Uoe3VybDogZW50ZXJQYXRoLCBzY3JpcHRzOiBzY3JpcHRMaXN0LCBzdHlsZXM6IHN0eWxlTGlzdH0sIHt9LCBwcmV2TG9hZCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICog6K+t6KiA6K6+572uXHJcbiAgICAgKiBAcGFyYW0gbGFuZ3VhZ2Ug6K+t6KiAXHJcbiAgICAgKiBAcGFyYW0gY2FsbGJhY2sg5Zu96ZmF5YyW5pWw5o2u5Yqg6L295a6M5oiQ5Zue6LCD5pa55rOVXHJcbiAgICAgKi9cclxuICAgIG1haW4uaW5pdExhbmd1YWdlID0gZnVuY3Rpb24gKGxhbmd1YWdlLCBjYWxsYmFjaykge1xyXG4gICAgICAgIGlmICh0eXBlb2YgbGFuZ3VhZ2UgPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICBjYWxsYmFjayA9IGxhbmd1YWdlO1xyXG4gICAgICAgICAgICBsYW5ndWFnZSA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHByZWZlckxhbmcgPSBsYW5ndWFnZSB8fCBDb29raWVzLmdldENvb2soXCJQcmVmZXJfTGFuZ1wiKSB8fCAobWFpbi5MYW5nICsgXCJfXCIgKyAobWFpbi5yZWdpb24gPT0gJ0dCJyA/ICdVSycgOiBtYWluLnJlZ2lvbikpIHx8ICd6aF9DTic7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ2xhbmd1YWdlPScsIHByZWZlckxhbmcpO1xyXG5cclxuICAgICAgICBtYWluLkxhbmcgPSBwcmVmZXJMYW5nLnNwbGl0KCdfJylbMF0sIHByZWZlckxhbmcuc3BsaXQoJ18nKS5sZW5ndGggPiAxICYmIChtYWluLnJlZ2lvbiA9IHByZWZlckxhbmcuc3BsaXQoJ18nKVsxXSk7XHJcblxyXG4gICAgICAgIGkxOG4ubG9hZExhbmd1YWdlRmlsZShwcmVmZXJMYW5nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGkxOG4uc2V0TGFuZ3VhZ2UoKTtcclxuXHJcbiAgICAgICAgICAgIEFwcC5nZXRDbGFzc09mKGNhbGxiYWNrKSA9PSAnRnVuY3Rpb24nICYmIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG4gICAgLyoqXHJcbiAgICAgKiDojrflj5bpvKDmoIflvZPliY3kvY3nva7vvIh4LCB577yJXHJcbiAgICAgKiBAcGFyYW0gZVxyXG4gICAgICogQHJldHVybnMge3t4OiAoTnVtYmVyfG51bWJlciksIHk6IChOdW1iZXJ8bnVtYmVyKX19XHJcbiAgICAgKi9cclxuICAgIG1haW4uZ2V0TW91c2VQb3MgPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgIHZhciBkID0gZG9jdW1lbnQsIGRlID0gZC5kb2N1bWVudEVsZW1lbnQsIGRiID0gZC5ib2R5O1xyXG4gICAgICAgIGUgPSBlIHx8IHdpbmRvdy5ldmVudDtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB4OiBlLnBhZ2VYIHx8IChlLmNsaWVudFggKyAoZGUuc2Nyb2xsTGVmdCB8fCBkYi5zY3JvbGxMZWZ0KSksXHJcbiAgICAgICAgICAgIHk6IGUucGFnZVkgfHwgKGUuY2xpZW50WSArIChkZS5zY3JvbGxUb3AgfHwgZGIuc2Nyb2xsVG9wKSlcclxuICAgICAgICB9O1xyXG4gICAgfTtcclxuICAgIG1haW4uZXZhbCA9IGZ1bmN0aW9uIChzdHIpIHtcclxuICAgICAgICB2YXIgcjtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICByID0gZXZhbCgnKCcgKyBzdHIgKyAnKScpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHIgPyByIDogc3RyO1xyXG4gICAgfTtcclxuICAgIG1haW4uZ2V0TXNnID0gZnVuY3Rpb24gKG1zZywgcGFyYW1zKSB7XHJcbiAgICAgICAgaWYgKHBhcmFtcyAmJiBwYXJhbXMubGVuZ3RoKVxyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhcmFtcy5sZW5ndGg7IGkrKylcclxuICAgICAgICAgICAgICAgIG1zZyA9IG1zZy5yZXBsYWNlKCd7JyArIGkgKyAnfScsIHBhcmFtc1tpXSk7XHJcbiAgICAgICAgcmV0dXJuIG1zZztcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDojrflj5bns7vnu5/moLnnvZHnu5zot6/lvoRcclxuICAgICAqIEByZXR1cm5zIHtTdHJpbmd9XHJcbiAgICAgKi9cclxuICAgIG1haW4ucm9vdFBhdGggPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGh0bWwgPSB3aW5kb3cubG9jYXRpb24uaHJlZjtcclxuICAgICAgICB2YXIgaG9zdCA9IHdpbmRvdy5sb2NhdGlvbi5ob3N0O1xyXG4gICAgICAgIHJldHVybiBodG1sLnN1YnN0cmluZygwLCBodG1sLmxhc3RJbmRleE9mKGhvc3QpICsgaG9zdC5sZW5ndGggKyAxKTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDojrflj5bmtY/op4jlmajnsbvlnotcclxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9XHJcbiAgICAgKi9cclxuICAgIG1haW4uZ2V0QnJvd3NlciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgYnJvd3NlciA9ICQuYnJvd3NlcjtcclxuICAgICAgICBpZiAoIWJyb3dzZXIpIHtcclxuICAgICAgICAgICAgdmFyIHVhTWF0Y2ggPSBmdW5jdGlvbiAodWEpIHtcclxuICAgICAgICAgICAgICAgIHVhID0gdWEudG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgbWF0Y2ggPSAvKGNocm9tZSlbIFxcL10oW1xcdy5dKykvLmV4ZWModWEpIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgLyh3ZWJraXQpWyBcXC9dKFtcXHcuXSspLy5leGVjKHVhKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgIC8ob3BlcmEpKD86Lip2ZXJzaW9ufClbIFxcL10oW1xcdy5dKykvLmV4ZWModWEpIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgLyhtc2llKSAoW1xcdy5dKykvLmV4ZWModWEpIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgdWEuaW5kZXhPZihcImNvbXBhdGlibGVcIikgPCAwICYmIC8obW96aWxsYSkoPzouKj8gcnY6KFtcXHcuXSspfCkvLmV4ZWModWEpIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgW107XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICBicm93c2VyOiBtYXRjaFsxXSB8fCBcIlwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHZlcnNpb246IG1hdGNoWzJdIHx8IFwiMFwiXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgbWF0Y2hlZCA9IHVhTWF0Y2gobmF2aWdhdG9yLnVzZXJBZ2VudCk7XHJcbiAgICAgICAgICAgIGJyb3dzZXIgPSB7fTtcclxuXHJcbiAgICAgICAgICAgIGlmIChtYXRjaGVkLmJyb3dzZXIpIHtcclxuICAgICAgICAgICAgICAgIGJyb3dzZXJbbWF0Y2hlZC5icm93c2VyXSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBicm93c2VyLnZlcnNpb24gPSBtYXRjaGVkLnZlcnNpb247XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIOWMuuWIhiBDaHJvbWUg5ZKMIFNhZmFyaVxyXG4gICAgICAgICAgICBpZiAoYnJvd3Nlci5jaHJvbWUpIHtcclxuICAgICAgICAgICAgICAgIGJyb3dzZXIud2Via2l0ID0gdHJ1ZTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChicm93c2VyLndlYmtpdCkge1xyXG4gICAgICAgICAgICAgICAgYnJvd3Nlci5zYWZhcmkgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBicm93c2VyO1xyXG4gICAgfTtcclxuXHJcbiAgICBtYWluLm9wZW5TaW5nbGVQbGFudCA9IGZ1bmN0aW9uIChzSWQsIHNOYW1lKSB7XHJcbiAgICAgICAgdmFyIHNpbmdsZVdpbiA9IHdpbmRvdy5vcGVuKFwiXCIsICdfYmxhbmsnKTtcclxuICAgICAgICBzaW5nbGVXaW4uc2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbShcInNJZFwiLCBzSWQpO1xyXG4gICAgICAgIHNpbmdsZVdpbi5zZXNzaW9uU3RvcmFnZS5zZXRJdGVtKFwic05hbWVcIiwgc05hbWUpO1xyXG4gICAgICAgIHNpbmdsZVdpbi5sb2NhdGlvbi5ocmVmID0gXCJzaW5nbGVQbGFudC5odG1sXCJcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDmt7vliqDojrflj5Z1cmzlj4LmlbDnmoTmlrnms5VcclxuICAgICAqIEBwYXJhbSBuYW1lXHJcbiAgICAgKiBAcmV0dXJucyB7Kn1cclxuICAgICAqL1xyXG4gICAgbWFpbi5nZXRVcmxQYXJhbSA9IGZ1bmN0aW9uIChuYW1lKSB7XHJcbiAgICAgICAgdmFyIHJlZyA9IG5ldyBSZWdFeHAoXCIoXnwmKVwiICsgbmFtZSArIFwiPShbXiZdKikoJnwkKVwiKTtcclxuICAgICAgICB2YXIgciA9IHdpbmRvdy5sb2NhdGlvbi5zZWFyY2guc3Vic3RyKDEpLm1hdGNoKHJlZyk7XHJcbiAgICAgICAgaWYgKHIgIT0gbnVsbClcclxuICAgICAgICAgICAgcmV0dXJuIHVuZXNjYXBlKHJbMl0pO1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIOajgOafpWFqYXjlk43lupTmlbDmja7nirbmgIFcclxuICAgICAqIEBwYXJhbSBkYXRhXHJcbiAgICAgKi9cclxuICAgIG1haW4uY2hlY2tEYXRhID0gZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICBkYXRhID0gdHlwZW9mIGRhdGEgPT0gXCJzdHJpbmdcIiA/IEpTT04ucGFyc2UoZGF0YSkgOiBkYXRhO1xyXG4gICAgICAgIGlmIChkYXRhICYmICFkYXRhLnN1Y2Nlc3MpIHtcclxuICAgICAgICAgICAgaWYgKGRhdGEuZGF0YSAmJiBkYXRhLmRhdGEuZmFpbENvZGUgJiYgZGF0YS5kYXRhLmZhaWxDb2RlID09IFwiMzA2XCIpIHtcclxuICAgICAgICAgICAgICAgIENvb2tpZXMuY2xlYXJCeUlkKCd0b2tlbklkJyk7XHJcbiAgICAgICAgICAgICAgICBBcHAuZGlhbG9nKCdjbG9zZScpO1xyXG4gICAgICAgICAgICAgICAgQXBwLmFsZXJ0KHtcclxuICAgICAgICAgICAgICAgICAgICBpZDogJ3JpZ2h0JyxcclxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogTXNnLmluZm8sXHJcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogTXNnLnN5c3RlbVNldHRpbmcucmVsb2dpblxyXG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vc3Nv6ZyA5pS+5byAXHJcbiAgICAgICAgICAgICAgICAgICAgLy93aW5kb3cubG9jYXRpb24gPSBkYXRhLmRhdGEubWVzc2FnZTtcclxuICAgICAgICAgICAgICAgICAgICBDb29raWVzLmNsZWFyQnlJZCgndG9rZW5JZCcpO1xyXG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbiA9IFwiL1wiO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAvL3Nlc3Npb27ov4fmnJ/lkI4sIOS9v+eUqHRvcOadpeiOt+WPlumhtemdouW8leeUqCwgcmVkaXJlY3TliLDnmbvlvZXnlYzpnaJcclxuICAgICAgICAgICAgICAgIC8v5ZCm5YiZ5aSn5bGP5Lya5Ye6546w5Zyw5Zu+5bGCcmVkaXJlY3TliLDnmbvlvZXpobXpnaIsIOiAjOWkp+Wxj+aooeWdl+S7jeWxleekuueahOaDheWGtVxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGRhdGEuZGF0YSAmJiBkYXRhLmRhdGEuZmFpbENvZGUgJiYgZGF0YS5kYXRhLmZhaWxDb2RlID09IFwiMzA3XCIpIHtcclxuICAgICAgICAgICAgICAgIENvb2tpZXMuY2xlYXJCeUlkKCd0b2tlbklkJyk7XHJcbiAgICAgICAgICAgICAgICBBcHAuZGlhbG9nKCdjbG9zZScpO1xyXG4gICAgICAgICAgICAgICAgQXBwLmFsZXJ0KHtcclxuICAgICAgICAgICAgICAgICAgICBpZDogJ3JpZ2h0JyxcclxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogTXNnLmluZm8sXHJcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogTXNnLnN5c3RlbVNldHRpbmcuZm9yY2VyZWxvZ2luXHJcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgQ29va2llcy5jbGVhckJ5SWQoJ3Rva2VuSWQnKTtcclxuICAgICAgICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24gPSBcIi9cIjtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGRhdGEuZGF0YSAmJiBkYXRhLmRhdGEuZmFpbENvZGUgJiYgZGF0YS5kYXRhLmZhaWxDb2RlID09IFwiNDAxXCIpIHtcclxuICAgICAgICAgICAgICAgIEFwcC5hbGVydCh7XHJcbiAgICAgICAgICAgICAgICAgICAgaWQ6ICdyaWdodCcsXHJcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IE1zZy5pbmZvLFxyXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IE1zZy5zeXN0ZW1TZXR0aW5nLm5vdFJpZ2h0XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChkYXRhLmRhdGEgJiYgZGF0YS5kYXRhLmZhaWxDb2RlICYmIGRhdGEuZGF0YS5mYWlsQ29kZSA9PSBcIjMwNVwiKSB7XHJcbiAgICAgICAgICAgICAgICBDb29raWVzLmNsZWFyQnlJZCgndG9rZW5JZCcpO1xyXG4gICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uID0gZGF0YS5kYXRhLm1lc3NhZ2U7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZGF0YS5kYXRhICYmIGRhdGEuZGF0YS5mYWlsQ29kZSAmJiBkYXRhLmRhdGEuZmFpbENvZGUgPT0gXCI0MDRcIikge1xyXG4gICAgICAgICAgICAgICAgQXBwLmFsZXJ0KHtcclxuICAgICAgICAgICAgICAgICAgICBpZDogJ3JpZ2h0JyxcclxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogTXNnLmluZm8sXHJcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogTXNnLnN5c3RlbVNldHRpbmcubm90RXhpc3RzXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChkYXRhLmRhdGEgJiYgZGF0YS5kYXRhLmZhaWxDb2RlICYmIGRhdGEuZGF0YS5mYWlsQ29kZSA9PSBcIjQwNVwiKSB7XHJcbiAgICAgICAgICAgICAgICBBcHAuZGlhbG9nKCdjbG9zZScpO1xyXG4gICAgICAgICAgICAgICAgQ29va2llcy5jbGVhckJ5SWQoJ3Rva2VuSWQnKTtcclxuICAgICAgICAgICAgICAgIEFwcC5hbGVydCh7XHJcbiAgICAgICAgICAgICAgICAgICAgaWQ6ICdyaWdodCcsXHJcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IE1zZy5pbmZvLFxyXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IE1zZy5zeXN0ZW1TZXR0aW5nLnVzZXJJbmZvVXBkYXRlICsgXCIsXCIgKyBNc2cuc3lzdGVtU2V0dGluZy5yZWxvZ2luXHJcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XHJcbi8vICAgICAgICAgICAgICAgIFx0c3NvIOmcgOaUvuW8gFxyXG4gICAgICAgICAgICAgICAgICAgIC8vd2luZG93LmxvY2F0aW9uID0gZGF0YS5kYXRhLm1lc3NhZ2U7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9zZXNzaW9u6L+H5pyf5ZCOLCDkvb/nlKh0b3DmnaXojrflj5bpobXpnaLlvJXnlKgsIHJlZGlyZWN05Yiw55m75b2V55WM6Z2iXHJcbiAgICAgICAgICAgICAgICAgICAgLy/lkKbliJnlpKflsY/kvJrlh7rnjrDlnLDlm77lsYJyZWRpcmVjdOWIsOeZu+W9lemhtemdoiwg6ICM5aSn5bGP5qih5Z2X5LuN5bGV56S655qE5oOF5Ya1XHJcbiAgICAgICAgICAgICAgICAgICAgQ29va2llcy5jbGVhckJ5SWQoJ3Rva2VuSWQnKTtcclxuICAgICAgICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24gPSBcIi9cIjtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIOWfn+agkeiKgueCuVxyXG4gICAgICogQHBhcmFtIGRvbWFpbnMge0FycmF5fSDoioLngrnlhYPntKDpm4ZcclxuICAgICAqL1xyXG4gICAgbWFpbi5nZXRabm9kZXMgPSBmdW5jdGlvbiAoZG9tYWlucywgek5vZGVzKSB7XHJcbiAgICAgICAgaWYgKCF6Tm9kZXMpIHtcclxuICAgICAgICAgICAgek5vZGVzID0gW107XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZG9tYWlucy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgbm9kZSA9IHtcclxuICAgICAgICAgICAgICAgIFwiaWRcIjogZG9tYWluc1tpXS5pZCwgXCJwSWRcIjogZG9tYWluc1tpXS5waWQsXHJcbiAgICAgICAgICAgICAgICBcIm5hbWVcIjogZG9tYWluc1tpXS5uYW1lLCBcIm9wZW5cIjogZmFsc2VcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgbm9kZS5uYW1lID0gbWFpbi5nZXRUb3BEb21pYW5OYW1lKG5vZGUubmFtZSk7XHJcbiAgICAgICAgICAgIGlmIChkb21haW5zW2ldLm1vZGVsID09IFwiU1RBVElPTlwiKSB7XHJcbiAgICAgICAgICAgICAgICBub2RlLmljb24gPSBcIi9pbWFnZXMvc20vbm9kZVN0YXRpb24ucG5nXCI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgek5vZGVzLnB1c2gobm9kZSk7XHJcbiAgICAgICAgICAgIGlmIChkb21haW5zW2ldLmNoaWxkcyAmJiBkb21haW5zW2ldLmNoaWxkcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGVtcCA9IG1haW4uZ2V0Wm5vZGVzKGRvbWFpbnNbaV0uY2hpbGRzLCB6Tm9kZXMpO1xyXG4gICAgICAgICAgICAgICAgek5vZGVzLmNvbmNhdCh0ZW1wKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gek5vZGVzO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIOeUteermeagkeiKgueCuVxyXG4gICAgICogQHBhcmFtIGRvbWFpbnMge0FycmF5fSDoioLngrnlhYPntKDpm4ZcclxuICAgICAqL1xyXG4gICAgbWFpbi5nZXRabm9kZXMyID0gZnVuY3Rpb24gKGRhdGEsIHpOb2Rlcykge1xyXG4gICAgICAgIGlmICghek5vZGVzKSB7XHJcbiAgICAgICAgICAgIHpOb2RlcyA9IFtdO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIG5vZGUgPSB7XHJcbiAgICAgICAgICAgICAgICBcImlkXCI6IGRhdGFbaV0uaWQsIFwicElkXCI6IGRhdGFbaV0ucGlkLFxyXG4gICAgICAgICAgICAgICAgXCJuYW1lXCI6IGRhdGFbaV0ubmFtZSwgXCJtb2RlbFwiOiBkYXRhW2ldLm1vZGVsLCBcIm9wZW5cIjogZmFsc2VcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgbm9kZS5uYW1lID0gbWFpbi5nZXRUb3BEb21pYW5OYW1lKG5vZGUubmFtZSk7XHJcbiAgICAgICAgICAgIGlmIChkYXRhW2ldLm1vZGVsID09IFwiU1RBVElPTlwiKSB7XHJcbiAgICAgICAgICAgICAgICBub2RlLmljb24gPSBcIi9pbWFnZXMvc20vbm9kZVN0YXRpb24ucG5nXCI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgek5vZGVzLnB1c2gobm9kZSk7XHJcbiAgICAgICAgICAgIGlmIChkYXRhW2ldLmNoaWxkcyAmJiBkYXRhW2ldLmNoaWxkcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGVtcCA9IG1haW4uZ2V0Wm5vZGVzMihkYXRhW2ldLmNoaWxkcywgek5vZGVzKTtcclxuICAgICAgICAgICAgICAgIHpOb2Rlcy5jb25jYXQodGVtcCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHpOb2RlcztcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDlr4bnoIHliqDlr4ZcclxuICAgICAqIEBwYXJhbSBwd2Qge1N0cmluZ30g5piO5paHXHJcbiAgICAgKiBAcGFyYW0gaSB7SW50ZWdlcn0g5Yqg5a+G5bGC57qnXHJcbiAgICAgKiBAcmV0dXJucyB7U3RyaW5nfSDlr4bmlodcclxuICAgICAqL1xyXG4gICAgbWFpbi5iYXNlNjQgPSBmdW5jdGlvbiAocHdkLCBpKSB7XHJcbiAgICAgICAgdmFyIG5ld1B3ZCA9ICQuYmFzZTY0LmVuY29kZShwd2QpO1xyXG4gICAgICAgIGlmICghaSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3UHdkO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpLS07XHJcbiAgICAgICAgaWYgKGkgPiAwKSB7XHJcbiAgICAgICAgICAgIG5ld1B3ZCA9IG1haW4uYmFzZTY0KG5ld1B3ZCwgaSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBuZXdQd2Q7XHJcbiAgICB9O1xyXG4gICAgLyoqXHJcbiAgICAgKiDlm77niYflpKflsI/mo4DmtYsg5Lul5Y+K57G75Z6L5qOA5rWLXHJcbiAgICAgKiBzaXplIOm7mOiupCA1MTJcclxuICAgICAqIHR5cGVBcnIg6buY6K6kW1wicG5nXCIsIFwianBnXCIsIFwiYm1wXCIsIFwianBlZ1wiXVxyXG4gICAgICovXHJcbiAgICBtYWluLmNoZWNrSW1hZ2UgPSBmdW5jdGlvbiAoZSwgZWxlbWVudCwgaW1hZ2VzaXplLCB0eXBlQXJyKSB7XHJcbiAgICAgICAgaW1hZ2VzaXplID0gKCFpc05hTihpbWFnZXNpemUpICYmIE51bWJlcihpbWFnZXNpemUpKSB8fCA1MTI7XHJcbiAgICAgICAgdHlwZUFyciA9IHR5cGVBcnIgfHwgW1wicG5nXCIsIFwianBnXCIsIFwiYm1wXCIsIFwianBlZ1wiXTtcclxuICAgICAgICBpZiAoZWxlbWVudCkge1xyXG4gICAgICAgICAgICB2YXIgZmlsZU5hbWUgPSBlbGVtZW50LnZhbCgpO1xyXG4gICAgICAgICAgICB2YXIgZmlsZUFycmF5ID0gZmlsZU5hbWUuc3BsaXQoXCIuXCIpO1xyXG4gICAgICAgICAgICB2YXIgZmlsZXR5cGUgPSBmaWxlQXJyYXlbZmlsZUFycmF5Lmxlbmd0aCAtIDFdLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgICAgIGlmICghZmlsZXR5cGUgfHwgIXR5cGVBcnIuY29udGFpbnMoZmlsZXR5cGUpKSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtZW50LnZhbCgnJyk7XHJcbiAgICAgICAgICAgICAgICBtYWluLmNvbW9uRXJyb3JGdW4oTXNnLnN5c3RlbVNldHRpbmcuaW1nVHlwZUVycm9yKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoZmlsZU5hbWUgJiYgZmlsZU5hbWUubGVuZ3RoID4gMjAwKSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtZW50LnZhbCgnJyk7XHJcbiAgICAgICAgICAgICAgICBtYWluLmNvbW9uRXJyb3JGdW4oTXNnLnN5c3RlbVNldHRpbmcubWF4RmlsZU5hbWUpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChlICYmIGUudGFyZ2V0LmZpbGVzKSB7XHJcbiAgICAgICAgICAgIHZhciBzaXplID0gZS50YXJnZXQuZmlsZXNbMF0uc2l6ZTtcclxuICAgICAgICAgICAgaWYgKHNpemUgJiYgIWlzTmFOKHNpemUpICYmIE51bWJlcihzaXplKSA+IGltYWdlc2l6ZSAqIDEwMDApIHtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQgJiYgZWxlbWVudC52YWwoJycpO1xyXG4gICAgICAgICAgICAgICAgQXBwLmFsZXJ0KHtcclxuICAgICAgICAgICAgICAgICAgICBpZDogJ2NoZWNrSW1hZ2UnLFxyXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiBNc2cuaW5mbyxcclxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBNc2cuc3lzdGVtU2V0dGluZy5tb3JlTWF4TGltaXRcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfTtcclxuICAgIC8qKlxyXG4gICAgICog5by55Ye6IOaPkOekuuaWueazlVxyXG4gICAgICovXHJcbiAgICBtYWluLmNvbW9uRXJyb3JGdW4gPSBmdW5jdGlvbiAobWVzc2FnZSwgZnVuKSB7XHJcbiAgICAgICAgQXBwLmFsZXJ0KHtcclxuICAgICAgICAgICAgdGl0bGU6IE1zZy5pbmZvLFxyXG4gICAgICAgICAgICBtZXNzYWdlOiBtZXNzYWdlXHJcbiAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB0eXBlb2YgZnVuID09IFwiZnVuY3Rpb25cIiAmJiBmdW4oKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbiAgICBtYWluLmxvZ2luZ2V0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICQuaHR0cC5HRVQoJy9pbmRleGh0bWwnLCBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuICAgIC8qKlxyXG4gICAgICog57uR5a6a5Zue6L2mXHJcbiAgICAgKi9cclxuICAgIG1haW4uYmluZEVudGVyID0gZnVuY3Rpb24gKGRvbUVudGVyLCBkb21DbGljaykge1xyXG4gICAgICAgICQoZG9tRW50ZXIpLm9mZigna2V5dXAnKS5vbigna2V5dXAnLCBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgICAgaWYgKChldmVudC5rZXlDb2RlIHx8IGV2ZW50LndoaWNoKSA9PSAxMykge1xyXG4gICAgICAgICAgICAgICAgJChkb21DbGljaykudHJpZ2dlcihcImNsaWNrXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG4gICAgLyoqXHJcbiAgICAgKiDop6Pnu5FzdG9yYWdlIOS6i+S7tlxyXG4gICAgICovXHJcbiAgICBtYWluLnVuYmluZFN0b3JhZ2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKSB7XHJcbiAgICAgICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwic3RvcmFnZVwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIH0sIGZhbHNlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAod2luZG93LmF0dGFjaEV2ZW50KSB7XHJcbiAgICAgICAgICAgIHdpbmRvdy5kZXRhY2hFdmVudChcIm9uc3RvcmFnZVwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICAvKipcclxuICAgICAqIOe7keWumnN0b3JhZ2Ug5pS55Y+Y5LqL5Lu2XHJcbiAgICAgKi9cclxuICAgIG1haW4uYmluZFN0b3JhZ2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgbWFpbi51bmJpbmRTdG9yYWdlKCk7XHJcbiAgICAgICAgaWYgKHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKSB7XHJcbiAgICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwic3RvcmFnZVwiLCBtYWluLnN0b3JhZ2VDaGFuZ2UsIGZhbHNlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAod2luZG93LmF0dGFjaEV2ZW50KSB7XHJcbiAgICAgICAgICAgIHdpbmRvdy5hdHRhY2hFdmVudChcIm9uc3RvcmFnZVwiLCBtYWluLnN0b3JhZ2VDaGFuZ2UpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICAvKipcclxuICAgICAqIHN0b3JhZ2Ug5Y+Y5YyW5aSE55CG5pa55rOVXHJcbiAgICAgKi9cclxuICAgIG1haW4uc3RvcmFnZUNoYW5nZSA9IGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgaWYgKChlLmtleSA9PSBcInVzZXJpZFwiICYmIGUubmV3VmFsdWUgIT0gZS5vbGRWYWx1ZSAmJiBlLm9sZFZhbHVlKSB8fCAoIWUua2V5ICYmICFDb29raWVzLmdldENvb2soJ3Rva2VuSWQnKSkpIHtcclxuICAgICAgICAgICAgaWYgKCQudHJpbShzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKFwic0lkXCIpKSAhPSBcIlwiKSB7XHJcbiAgICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24gPSBcIi9cIjtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAoZS5rZXkgPT0gXCJ1c2VyTmFtZVwiICYmIGUubmV3VmFsdWUgIT0gZS5vbGRWYWx1ZSkge1xyXG4gICAgICAgICAgICAkKFwiI3VzZXJOYW1lXCIpLmh0bWwoZS5uZXdWYWx1ZSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChlLmtleSA9PSBcInVzZXJBdmF0YXJcIiAmJiBlLm5ld1ZhbHVlICE9IGUub2xkVmFsdWUpIHtcclxuICAgICAgICAgICAgJChcIiN1c2VySW1hZ2VcIikuYXR0cihcInNyY1wiLCBcIi91c2VyL2dldEltYWdlP3Q9XCIgKyBlLm5ld1ZhbHVlKS5lcnJvcihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmF0dHIoJ3NyYycsICcvaW1hZ2VzL21haW4vdXNlckhlYWQucG5nJyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICAvKipcclxuICAgICAqIOagoemqjOaPkOekuuW3peWFt1xyXG4gICAgICogQHBhcmFtICBzZWwg6YCJ5oup6KGo6L6+5byPXHJcbiAgICAgKiBAcGFyYW0gIG1zZyDplJnor6/kv6Hmga9cclxuICAgICAqIEBwYXJhbSAgZmxnIOagh+iusO+8iHRydWU6IOaYvuekuu+8m2ZhbHNlOiDlj5bmtojvvIlcclxuICAgICAqIEBwYXJhbSAgcG9zIOaPkOekuuS/oeaBr+aYvuekuuS9jee9ru+8jOS4jeS8oOm7mOiupOS4unRvcFxyXG4gICAgICovXHJcbiAgICBtYWluLnRpcCA9IGZ1bmN0aW9uIChzZWwsIG1zZywgZmxnLCBwb3MpIHtcclxuICAgICAgICB2YXIgcG9zaXRpb24gPSAndG9wJztcclxuICAgICAgICBpZiAocG9zKSB7XHJcbiAgICAgICAgICAgIHBvc2l0aW9uID0gcG9zO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIWZsZykge1xyXG4gICAgICAgICAgICAkKHNlbCkuY3NzKFwiYm9yZGVyLWNvbG9yXCIsIFwiXCIpLnRvb2x0aXAoXCJkZXN0cm95XCIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICQoc2VsKS5jc3MoXCJib3JkZXItY29sb3JcIiwgXCJyZWRcIikudG9vbHRpcCh7dGl0bGU6IG1zZywgcGxhY2VtZW50OiBwb3NpdGlvbn0pO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICBtYWluLmdldFRvcERvbWlhbk5hbWUgPSBmdW5jdGlvbiAobmFtZSkge1xyXG4gICAgICAgIGlmIChuYW1lICYmIFwiTXNnLiZ0b3Bkb21haW5cIiA9PSBuYW1lKSB7XHJcbiAgICAgICAgICAgIG5hbWUgPSBpMThuLl9ldmFsKG5hbWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbmFtZTtcclxuICAgIH07XHJcbiAgICByZXR1cm4gbWFpbjtcclxufSk7Il0sImZpbGUiOiJtYWluL21haW4uanMifQ==
