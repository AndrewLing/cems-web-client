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
                    Cookies.setCookByName('userType', user.userType);
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
                console.log(userRole);
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
                //console.trace(fn);
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJtYWluL3JpZ2h0LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIisoZnVuY3Rpb24gKCkge1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgZGVmaW5lKFsnanF1ZXJ5JywgJ2Nvb2tpZSddLCBmdW5jdGlvbiAoJCkge1xyXG4gICAgICAgIHZhciBzeXN0ZW0gPSB7XHJcbiAgICAgICAgICAgIGxvZ2luOiB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgICAgIHVybDogXCIvbW9kdWxlcy9sb2dpbi5odG1sXCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgbm9Gb3VuZDoge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgICAgICB1cmw6IFwiLzQwNC5odG1sXCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgbWFpbjoge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogXCJHRVRcIixcclxuICAgICAgICAgICAgICAgIHVybDogXCIvbW9kdWxlcy9tYWluLmh0bWxcIlxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIHVzZXJSb2xlID0ge307XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGxvZ2luOiBmdW5jdGlvbiAodG9rZW5JZCwgdXNlcikge1xyXG4gICAgICAgICAgICAgICAgdG9rZW5JZCAmJiBDb29raWVzLnNldENvb2tCeU5hbWUoJ3Rva2VuSWQnLCB0b2tlbklkKTtcclxuICAgICAgICAgICAgICAgIGlmICh1c2VyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgQ29va2llcy5zZXRDb29rQnlOYW1lKCd1c2VyTmFtZScsIHVzZXIudXNlck5hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIENvb2tpZXMuc2V0Q29va0J5TmFtZSgnbG9naW5OYW1lJywgdXNlci5sb2dpbk5hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIENvb2tpZXMuc2V0Q29va0J5TmFtZSgndXNlcmlkJywgdXNlci51c2VyaWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIENvb2tpZXMuc2V0Q29va0J5TmFtZSgndXNlclR5cGUnLCB1c2VyLnVzZXJUeXBlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIOWIpOaWreaYr+WQpueZu+W9leezu+e7n1xyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgaXNMb2dpbjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIENvb2tpZXMuZ2V0Q29vaygndG9rZW5JZCcpO1xyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIOagueaNrlVSTOiOt+WPluadg+mZkFxyXG4gICAgICAgICAgICAgKiBAcGFyYW0gdXJsXHJcbiAgICAgICAgICAgICAqIEByZXR1cm5zIHsqfVxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgZ2V0UmlnaHQ6IGZ1bmN0aW9uICh1cmwpIHtcclxuICAgICAgICAgICAgICAgIHZhciBtZW51ID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAkLmVhY2goJC5leHRlbmQoc3lzdGVtLCB1c2VyUm9sZSksIGZ1bmN0aW9uIChpLCBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGUgJiYgZS51cmwgJiYgZS51cmwucmVwbGFjZSgvXlxcLy8sICcnKSA9PSB1cmwucmVwbGFjZSgvXlxcLy8sICcnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZW51ID0gZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG1lbnU7XHJcbiAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICBzZXRVc2VyUm9sZTogZnVuY3Rpb24gKHJvbGVzKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAocm9sZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJvbGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByb2xlID0gcm9sZXNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJSb2xlW3JvbGUuaWRdID0gcm9sZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjaGlsZCA9IHJvbGUuY2hpbGRzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2hpbGQgJiYgY2hpbGQubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRVc2VyUm9sZShjaGlsZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh1c2VyUm9sZSk7XHJcbiAgICAgICAgICAgICAgICB3aW5kb3cuc3lzdGVtID0gdXNlclJvbGU7XHJcbiAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICBjbGVhclVzZXJSb2xlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB1c2VyUm9sZSA9IHt9O1xyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIOajgOa1i+aYr+WQpueZu+W9lVxyXG4gICAgICAgICAgICAgKiBAcGFyYW0gZm4ge0Z1bmN0aW9ufSDlm57osIPmlrnms5VcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIGNoZWNrTG9naW46IGZ1bmN0aW9uIChmbikge1xyXG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLnRyYWNlKGZuKTtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzTG9naW4oKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGVvZiBmbiA9PSAnZnVuY3Rpb24nICYmIGZuKCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICQoJyNtYWluX3ZpZXcnKS5sb2FkUGFnZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybDogJy9tb2R1bGVzL2xvZ2luLmh0bWwnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzY3JpcHRzOiBbJ21vZHVsZXMvbG9naW4nXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGVzOiBbJ2NzcyEvY3NzL2xvZ2luLmNzcyddXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICog5qOA5rWL6aG16Z2i5YWD57Sg5piv5ZCm5pyJ5p2D6ZmQXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBoYXNFbGVtZW50UmlnaHQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBwZXJtaXNzaW9ucyA9ICQoJ1twZXJtaXNzaW9uXSwgLml0ZW0tbW9kdWxlJyk7XHJcbiAgICAgICAgICAgICAgICBpZiAocGVybWlzc2lvbnMgJiYgcGVybWlzc2lvbnMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICQuZWFjaChwZXJtaXNzaW9ucywgZnVuY3Rpb24gKGksIGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGhhc1JpZ2h0ID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwZXJtaXNzaW9uID0gJChlKS5hdHRyKCdwZXJtaXNzaW9uJykgfHwgZS5wZXJtaXNzaW9uIHx8IGUuaWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaChwZXJtaXNzaW9uLnNwbGl0KC9cXHMrLyksIGZ1bmN0aW9uIChpLCBrZXkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh1c2VyUm9sZVtrZXldKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFzUmlnaHQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYXNSaWdodCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaGFzUmlnaHQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8v5Yig6ZmkaW5wdXTnmoTml7blgJnvvIzlpoLmnpzlnKjooajmoLzph4zpnaLvvIzlsIZUROS5n+WIoOmZpFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHBhcmVudCA9ICQoZSkucGFyZW50KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocGFyZW50ICYmIHBhcmVudFswXS5ub2RlTmFtZSA9PSAnVEQnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChlKS5wYXJlbnQoKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoZSkucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9O1xyXG4gICAgfSk7XHJcbn0pKCk7Il0sImZpbGUiOiJtYWluL3JpZ2h0LmpzIn0=
