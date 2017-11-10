/**
 * 系统业务方法 {@code main.XXX}
 */
'use strict';
define(['main/App', 'main/right'], function (App, Menu) {
    window.App = App;
    window.Menu = Menu;
    var unCheckUrl = ['validVerCode'];
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
                    if (!(url.indexOf('validVerCode') != -1 || url.indexOf('validAccount') != -1 ||url.indexOf('login') != -1 || url.indexOf('ssoLogin') != -1 || url.indexOf('validTokenIdFromServer') != -1 || url.indexOf('checkLogin') != -1 || url.indexOf('sendEmail') != -1 || url.indexOf('pwdBack') != -1 || url.indexOf('getLogoAndTitle') != -1)) {
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
                    if (!(url.indexOf('validVerCode') != -1 || url.indexOf('validAccount') != -1 ||  url.indexOf('login') != -1 || url.indexOf('ssoLogin') != -1 || url.indexOf('validTokenIdFromServer') != -1 || url.indexOf('checkLogin') != -1 || url.indexOf('sendEmail') != -1 || url.indexOf('pwdBack') != -1 || url.indexOf('getLogoAndTitle') != -1)) {
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
                    if (!(url.indexOf('validVerCode') != -1 ||url.indexOf('validAccount') != -1 || url.indexOf('ssoLogin') != -1 || url.indexOf('login') != -1 || url.indexOf('validTokenIdFromServer') != -1 || url.indexOf('checkLogin') != -1 || url.indexOf('sendEmail') != -1 || url.indexOf('pwdBack') != -1 || url.indexOf('getLogoAndTitle') != -1)) {
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
                    if (!(url.indexOf('validVerCode') != -1 || url.indexOf('validAccount') != -1 || url.indexOf('login') != -1 || url.indexOf('validTokenIdFromServer') != -1 || url.indexOf('checkLogin') != -1 || url.indexOf('sendEmail') != -1 || url.indexOf('pwdBack') != -1 || url.indexOf('getLogoAndTitle') != -1)) {
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
                    if (!(url.indexOf('validVerCode') != -1 || url.indexOf('validAccount') != -1 || url.indexOf('login') != -1 || url.indexOf('ssoLogin') != -1 || url.indexOf('validTokenIdFromServer') != -1 || url.indexOf('checkLogin') != -1 || url.indexOf('sendEmail') != -1 || url.indexOf('pwdBack') != -1 || url.indexOf('getLogoAndTitle') != -1)) {
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
                if (!(url.indexOf('validVerCode') != -1 || url.indexOf('validAccount') != -1 || url.indexOf('login') != -1 || url.indexOf('findpassword') != -1 || url.indexOf('checkLogin') != -1 || url.indexOf('sendEmail') != -1 || url.indexOf('pwdBack') != -1 || url.indexOf('getLogoAndTitle') != -1)) {
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
                App.dialog('close');
                App.alert({
                    id: 'right',
                    title: Msg.info,
                    message: Msg.ajax.relogin
                }, function () {
                    //sso需放开
                    //window.location = data.data.message;
                	 window.localStorage.removeItem("loginName");
                     window.localStorage.removeItem("password");
                    Cookies.clearById('tokenId');
                    window.location = "/";
                });
                //session过期后, 使用top来获取页面引用, redirect到登录界面
                //否则大屏会出现地图层redirect到登录页面, 而大屏模块仍展示的情况
            } else if (data.data && data.data.failCode && data.data.failCode == "307") {
                App.dialog('close');
                App.alert({
                    id: 'right',
                    title: Msg.info,
                    message: Msg.ajax.forcerelogin
                }, function () {
                	Cookies.clearById('tokenId');
                    window.localStorage.removeItem("loginName");
                    window.localStorage.removeItem("password");
                    window.location = "/";
                });
            } else if (data.data && data.data.failCode && data.data.failCode == "401") {
                App.alert({
                    id: 'right',
                    title: Msg.info,
                    message: Msg.ajax.noRight
                });
            } else if (data.data && data.data.failCode && data.data.failCode == "305") {
                Cookies.clearById('tokenId');
                window.localStorage.removeItem("loginName");
                window.localStorage.removeItem("password");
                window.location = data.data.message;
            } else if (data.data && data.data.failCode && data.data.failCode == "404") {
                App.alert({
                    id: 'right',
                    title: Msg.info,
                    message: Msg.ajax.notExists
                });
            } else if (data.data && data.data.failCode && data.data.failCode == "405") {
                App.dialog('close');
                App.alert({
                    id: 'right',
                    title: Msg.info,
                    message: Msg.ajax.userInfoUpdate + "," + Msg.ajax.relogin
                }, function () {
//                	sso 需放开
                    //window.location = data.data.message;
                    //session过期后, 使用top来获取页面引用, redirect到登录界面
                    //否则大屏会出现地图层redirect到登录页面, 而大屏模块仍展示的情况
                	Cookies.clearById('tokenId');
                    window.localStorage.removeItem("loginName");
                    window.localStorage.removeItem("password");
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
     * 主要用于放回的数据是 域信息列表
     */
    main.getAreaNodes =  function (domains,zNodes) {
    	if(!zNodes){
    		zNodes = [];
    	}
        for (var i = 0; i < domains.length; i++) {
        	if(domains[i].id == 1){
        		continue;
        	}
        	var name = main.getTopDomianName(domains[i].name);
        	var node = {
                    "id": domains[i].id, "pid": domains[i].pid,
                    "name": name,'mlevel':domains[i].level,'mpid': domains[i].pid
                };
            zNodes.push(node);
            if (domains[i].childs && domains[i].childs.length>0) {
            	var tempnode =  main.getAreaNodes(domains[i].childs,domainId,zNodes);
            	zNodes.concat(tempnode);
            }
        }
        return zNodes;
    };
    /**
     * 域树节点 主要用于放回的数据是 Node结构信息列表
     * @param domains {Array} 节点元素集 -- 托管域 改名全部
     */
    main.getTreeNode = function (domains, zNodes) {
        if (!zNodes) {
            zNodes = [];
        }
        for (var i = 0; i < domains.length; i++) {
        	if(domains[i].id == 1){
        		domains[i].name = Msg.all;
        	}
            var node = {
                "id": domains[i].id, "pId": domains[i].pid,"model": domains[i].model,
                "name": domains[i].name, "open": false,"checked":domains[i].check
            };
            node.name = main.getTopDomianName(node.name);
            if (domains[i].model == "STATION") {
                node.icon = "/images/main/sm_domain/nodeStation.png";
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
     * 域树节点 主要用于放回的数据是 Node结构信息列表
     * @param domains {Array} 节点元素集
     */
    main.getZnodes = function (domains, zNodes) {
        if (!zNodes) {
            zNodes = [];
        }
        for (var i = 0; i < domains.length; i++) {
        	if(domains[i].id == 1){
        		continue;
        	}
            var node = {
                "id": domains[i].id, "pId": domains[i].pid,"model": domains[i].model,
                "name": domains[i].name, "open": false,"checked":domains[i].check
            };
            node.name = main.getTopDomianName(node.name);
            if (domains[i].model == "STATION") {
                node.icon = "/images/main/sm_domain/nodeStation.png";
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
     * 电站树节点  主要用于放回的数据是 Node结构信息列表
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
                node.icon = "/images/main/sm_domain/nodeStation.png";
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
    main.base64decode = function(pwd, i){
    	 var newPwd = $.base64.decode(pwd);
         if (!i) {
             return newPwd;
         }
         i--;
         if (i > 0) {
             newPwd = main.base64decode(newPwd, i);
         }
         return newPwd;
    };
    /**
     * 图片大小检测 以及类型检测
     * e input file change事件的event对象
     * element 存放文件名的 jquery对象
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
                main.comonErrorFun(Msg.image.imgTypeError);
                return false;
            }
            if (fileName && fileName.length > 200) {
                element.val('');
                main.comonErrorFun(Msg.image.maxFileName);
                return false;
            }
        }
        if (e && e.target.files) {
            var size = e.target.files[0].size;
            if (size && !isNaN(size) && Number(size) > imagesize * 1000) {
                element && element.val('');
                var message = Msg.image.moreMaxLimit;
                message = message.replace('{0}',imagesize);
                App.alert({
                    id: 'checkImage',
                    title: Msg.info,
                    message: message
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
            window.location = "/";
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
    /**
     * 托管域名称国际化
     */
    main.getTopDomianName = function (name) {
        if (name && "Msg.&topdomain" == name) {
            name = i18n._eval(name);
        }
        return name;
    };
    /**
     * 统一上传图片方法
     * params 参数
     * callBack 上传成功回调方法
     * filedBack 上传失败回调方法
     */
    main.fileUpload = function(params,callBack,filedBack){
        $.ajaxFileUpload({
            url: "/fileManager/uploadImage",
            secureuri : true, // 是否启用安全提交,默认为false
            dataType : 'json', // 服务器返回的格式,可以是json或xml或text等
            data: params,
            fileElementId: params.formId,
            success: function(res){
                if(res && res.success){
                	$.isFunction(callBack) && callBack(res);
                } else{
                	$.isFunction(filedBack) && filedBack(res);
                }
            },
            error: function(){
            	$.isFunction(filedBack) && filedBack();
            }
        });
    };
    /**
     * 设置首页背景色
     */
    main.setHomeBackColor = function(){
    	$('#cems_main .main').css({"background-color":"#232a30"});
    };
    /**
     * 设置除首页其它页面背景色
     */
    main.setBackColor = function(){
    	$('#cems_main .main').css({"background-color": "#EEEEEE"});
    };
    /**
     * 批量处理数据 arr 数组  number保留的小数
     */
    main.FixedKpi = function(arr,number){
    	if(!arr || arr.length<=0){
    		return arr;
    	}
    	var datas = [];
    	$.each(arr,function(t,e){
    		datas.push(main.ToFiexValue(e,number));
    	});
    	return datas;
    };
    /**
     * 批量处理数据 arr 对象  number保留的小数 names 需处理的属性 不支持多级属性
     */
    main.FixedKpiObj = function(arr,names,number){
    	if(!names || names.length<=0){
    		return arr;
    	}
    	$.each(arr,function(t,e){
    		$.each(names,function(t1,e1){
    			e[e1] = main.ToFiexValue(e[e1],number);
    		});
    	});
    	return arr;
    };
    /**
     * 处理数据
     */
    main.ToFiexValue = function(val,number){
    	if(isNaN(val) || !val){
    		return val;
    	}
    	number = number || 3;
    	return parseFloat(val).fixed(number);
    };
    /**
     * 根据参数名称 获取当前url中的参数值
     */
    main.getUrlParms = function(name){
    	var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)","i");
  	    var r = window.location.search.substr(1).match(reg);
  	    //0 位是匹配到的完整字符 1 是第一个字匹配(^|&)   2是第二个字匹配([^&]*) 
  	    if (r!=null) return (r[2]); return null;
    };
    /**
     * 获取当前url中的所有参数
     */
    main.getRequest = function(){
       var url = location.search;
  	   var theRequest = new Object();
  	   if (url.indexOf("?") != -1) {
  	      var str = url.substr(1);
  	      var strs = str.split("&");
  	      for(var i = 0; i < strs.length; i ++) {
  	         theRequest[strs[i].split("=")[0]]=(strs[i].split("=")[1]);
  	      }
  	   }
  	   return theRequest;
    };
   //原型数据搜索方法  data 是原始数据   protoQueryName 需要搜索的字段  seachVal 搜索的关键词
    main.protoQueryFun = function(data,protoQueryName,seachVal){
    	if(!data || data.length<=0){
			return data;
		}
		var reg;
		if(protoQueryName){
			//区分 值前面有无"  区分结尾有无,
			reg = new RegExp("({)([^{]*)\""+protoQueryName+"\"\:(\"([^,{]*)"+seachVal+"(([^{,\"]*\",[^{]*})|([^{,\"]*}))|([^,\"{]*)"+seachVal+"(([^{,\"]*,[^{]*})|([^{,\"]*})))","ig");
		}else{
			//未测试
			reg = new RegExp("({)([^{]*)\"([^{\",]*)\"\:(\"([^,{]*)"+seachVal+"(([^{,\"]*\",[^{]*})|([^{,\"]*}))|([^,\"{]*)"+seachVal+"(([^{,\"]*,[^{]*})|([^{,\"]*})))","ig");
		}
		var datas = [];
		var queryStr = JSON.stringify(data).replace('[','').replace(']','');
		var arr = queryStr.match(reg);
		if(arr){
			$.each(arr,function(t,e){
				datas.push(JSON.parse(e));
			})
		}
		return datas;
    };
    return main;
});