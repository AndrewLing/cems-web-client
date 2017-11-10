+(function () {
    'use strict';
    define(['jquery', 'cookie'], function ($) {
        var system = {
            login: {
                type: 'GET',
                url: "/modules/login.html"
            },
            noFound: {
                type: 'GET',
                url: "/404.html"
            },
            main: {
                type: "GET",
                url: "/modules/main.html"
            }
        };

        var userRole = {};

        return {
            login: function (tokenId, user) {
                tokenId && Cookies.setCookByName('tokenId', tokenId);
                if (user) {
                    Cookies.setCookByName('userName', user.userName);
                    Cookies.setCookByName('loginName', user.loginName);
                    Cookies.setCookByName('userid', user.userid);
                }
            },
            /**
             * 判断是否登录系统
             */
            isLogin: function () {
                return Cookies.getCook('tokenId');
            },

            /**
             * 根据URL获取权限
             * @param url
             * @returns {*}
             */
            getRight: function (url) {
                var menu = false;
                $.each($.extend(system, userRole), function (i, e) {
                    if (e && e.url && e.url.replace(/^\//, '') == url.replace(/^\//, '')) {
                        menu = e;
                        return false;
                    }
                });
                return menu;
            },

            setUserRole: function (roles) {
                if (roles) {
                    for (var i = 0; i < roles.length; i++) {
                        var role = roles[i];
                        userRole[role.id] = role;
                        var child = role.childs;
                        if (child && child.length > 0) {
                            this.setUserRole(child);
                        }
                    }
                }
                window.system = userRole;
            },

            clearUserRole: function () {
                userRole = {};
            },

            /**
             * 检测是否登录
             * @param fn {Function} 回调方法
             */
            checkLogin: function (fn) {
                if (this.isLogin()) {
                    typeof fn == 'function' && fn();
                } else {
                    $('#main_view').loadPage({
                        url: '/modules/login.html',
                        scripts: ['modules/login'],
                        styles: ['css!/css/login.css']
                    });
                }
            },

            /**
             * 检测页面元素是否有权限
             */
            hasElementRight: function () {
                var permissions = $('[permission], .item-module');
                if (permissions && permissions.length > 0) {
                    $.each(permissions, function (i, e) {
                        var hasRight = false;
                        var permission = $(e).attr('permission') || e.permission || e.id;
                        $.each(permission.split(/\s+/), function (i, key) {
                            if (userRole[key]) {
                                hasRight = true;
                            } else {
                                hasRight = false;
                                return false;
                            }
                        });
                        if (!hasRight) {
                            //删除input的时候，如果在表格里面，将TD也删除
                            var parent = $(e).parent();
                            if (parent && parent[0].nodeName == 'TD') {
                                $(e).parent().remove();
                            }
                            else {
                                $(e).remove();
                            }
                        }
                    });
                }
            }

        };
    });
})();