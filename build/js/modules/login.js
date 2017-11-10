App.Module.config({
    package: '/',
    moduleName: 'login',
    description: '模块功能：登录页面渲染和登录操作',
    importList: ['jquery', 'main/main']
});
App.Module('login', function ($, main) {
    var login = {
        Render: function () {
            $(function () {
            	main.unbindStorage();
            	var storage = window.localStorage; 
            	storage.clear('userid');

                Cookies.clearById('tokenId');
                Cookies.clearById('JSESSIONID');
                Cookies.clearById('userid');

                var loginName = Cookies.getCook("saveloginName");

                if (loginName) {
                    $("#userName").val(loginName);
                } else {
                    $("#userName").val('');
                }
                $("#checkboxSel")[0] && ($("#checkboxSel")[0].checked = true);

                $('.login-btn').off('click').on('click',function(){
                	login.login();
                });
                
                $('#userName').off('keydown').on('keydown',function(event){
                	 if (event && event.keyCode == 13) {
                         event.stopPropagation();
                         $('#password').focus();
                     }
                });
                $('#password').off('keydown').on('keydown',function(event){
                	if (event && event.keyCode == 13) {
                        event.stopPropagation();
                        login.login();
                    }
                });

            });
        },

        /**
         * 登录
         */
        login: function () {
            $('#password')[0].blur();
            var loginName = $("#userName").val();
            var pwd = $("#password").val();
            if (null == loginName || loginName == "") {
                $('#password')[0].blur();
                App.alert({
                    id: 'noUnserName',
                    title: Msg.info,
                    message: Msg.modules.login.info.nameNotNull
                });
                return;
            }
            if (null == pwd || pwd == "") {
                App.alert({
                    id: 'noPassword',
                    title: Msg.info,
                    message: Msg.modules.login.info.pwdNotNull
                });
                return;
            }
            login.exeLogin(loginName, $.md5(pwd), $("#checkboxSel")[0].checked);
        },

        /**
         * 执行登录操作
         * @param username 用户名
         * @param password 密码
         * @param ifSaveName 是否记住用户名
         */
        exeLogin: function (username, password, ifSaveName) {
            var obj = {};
            obj.loginName = username;
            obj.password = password;
            obj.ifSaveName = ifSaveName;
            if (ifSaveName) {
                Cookies.setCookByName('saveloginName', username);
            } else {
                Cookies.clearById('saveloginName');
            }
            $.http.ajax('/user/ssoLogin', obj, function (res, status, xhr) {
                if (res.success) {
                    Menu.login(xhr.getResponseHeader('tokenId'), res.data);
                    $(document).unbind('keydown');
                    var user = res.data;

                    if (Cookies.get("defaultLoading") == "iCleanScreen") {
                        window.location.reload();
                    } else {
                        main.loadSystem();
                    }
                } else {
                    if ("10001" == res.failCode) {
                        App.alert({
                            title: Msg.info,
                            message: Msg.modules.login.info.loginError
                        });
                    } else if ("10004" == res.failCode) {
                        App.alert({
                            title: Msg.info,
                            message: Msg.modules.login.info.user_locked
                        });
                    } else {
                        App.alert({
                            title: Msg.info,
                            message: Msg.modules.login.info.loginFaild
                        });
                    }
                }
            });
        },

        /**
         * 注销客户
         */
        logout: function (info) {
            App.confirm({
                title: Msg.info,
                message: info || Msg.modules.login.info.logoutInfo
            }, function () {
                login.exeLogout();
            });
        },

        /**
         * 执行退出操作
         */
        exeLogout: function () {
            $.http.ajax("/user/loginOut", {}, function (data) {
                if (data.success) {
                    //单电站页面logOut需要清除sessionStorage变量
                    sessionStorage.removeItem("sId");
                    sessionStorage.removeItem("sName");
                    Cookies.clearById('tokenId');
                    Cookies.clearById('JSESSIONID');
                    var url = "/";
                    window.location = url;
                }
            });
        }
    };

    return login;
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJtb2R1bGVzL2xvZ2luLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIkFwcC5Nb2R1bGUuY29uZmlnKHtcclxuICAgIHBhY2thZ2U6ICcvJyxcclxuICAgIG1vZHVsZU5hbWU6ICdsb2dpbicsXHJcbiAgICBkZXNjcmlwdGlvbjogJ+aooeWdl+WKn+iDve+8mueZu+W9lemhtemdoua4suafk+WSjOeZu+W9leaTjeS9nCcsXHJcbiAgICBpbXBvcnRMaXN0OiBbJ2pxdWVyeScsICdtYWluL21haW4nXVxyXG59KTtcclxuQXBwLk1vZHVsZSgnbG9naW4nLCBmdW5jdGlvbiAoJCwgbWFpbikge1xyXG4gICAgdmFyIGxvZ2luID0ge1xyXG4gICAgICAgIFJlbmRlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAkKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgXHRtYWluLnVuYmluZFN0b3JhZ2UoKTtcclxuICAgICAgICAgICAgXHR2YXIgc3RvcmFnZSA9IHdpbmRvdy5sb2NhbFN0b3JhZ2U7IFxyXG4gICAgICAgICAgICBcdHN0b3JhZ2UuY2xlYXIoJ3VzZXJpZCcpO1xyXG5cclxuICAgICAgICAgICAgICAgIENvb2tpZXMuY2xlYXJCeUlkKCd0b2tlbklkJyk7XHJcbiAgICAgICAgICAgICAgICBDb29raWVzLmNsZWFyQnlJZCgnSlNFU1NJT05JRCcpO1xyXG4gICAgICAgICAgICAgICAgQ29va2llcy5jbGVhckJ5SWQoJ3VzZXJpZCcpO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBsb2dpbk5hbWUgPSBDb29raWVzLmdldENvb2soXCJzYXZlbG9naW5OYW1lXCIpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChsb2dpbk5hbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAkKFwiI3VzZXJOYW1lXCIpLnZhbChsb2dpbk5hbWUpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAkKFwiI3VzZXJOYW1lXCIpLnZhbCgnJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAkKFwiI2NoZWNrYm94U2VsXCIpWzBdICYmICgkKFwiI2NoZWNrYm94U2VsXCIpWzBdLmNoZWNrZWQgPSB0cnVlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAkKCcubG9naW4tYnRuJykub2ZmKCdjbGljaycpLm9uKCdjbGljaycsZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgICAgIFx0bG9naW4ubG9naW4oKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAkKCcjdXNlck5hbWUnKS5vZmYoJ2tleWRvd24nKS5vbigna2V5ZG93bicsZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgICAgICAgICAgICAgXHQgaWYgKGV2ZW50ICYmIGV2ZW50LmtleUNvZGUgPT0gMTMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgJCgnI3Bhc3N3b3JkJykuZm9jdXMoKTtcclxuICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAkKCcjcGFzc3dvcmQnKS5vZmYoJ2tleWRvd24nKS5vbigna2V5ZG93bicsZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgICAgICAgICAgICAgXHRpZiAoZXZlbnQgJiYgZXZlbnQua2V5Q29kZSA9PSAxMykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbG9naW4ubG9naW4oKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOeZu+W9lVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGxvZ2luOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICQoJyNwYXNzd29yZCcpWzBdLmJsdXIoKTtcclxuICAgICAgICAgICAgdmFyIGxvZ2luTmFtZSA9ICQoXCIjdXNlck5hbWVcIikudmFsKCk7XHJcbiAgICAgICAgICAgIHZhciBwd2QgPSAkKFwiI3Bhc3N3b3JkXCIpLnZhbCgpO1xyXG4gICAgICAgICAgICBpZiAobnVsbCA9PSBsb2dpbk5hbWUgfHwgbG9naW5OYW1lID09IFwiXCIpIHtcclxuICAgICAgICAgICAgICAgICQoJyNwYXNzd29yZCcpWzBdLmJsdXIoKTtcclxuICAgICAgICAgICAgICAgIEFwcC5hbGVydCh7XHJcbiAgICAgICAgICAgICAgICAgICAgaWQ6ICdub1Vuc2VyTmFtZScsXHJcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IE1zZy5pbmZvLFxyXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IE1zZy5tb2R1bGVzLmxvZ2luLmluZm8ubmFtZU5vdE51bGxcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChudWxsID09IHB3ZCB8fCBwd2QgPT0gXCJcIikge1xyXG4gICAgICAgICAgICAgICAgQXBwLmFsZXJ0KHtcclxuICAgICAgICAgICAgICAgICAgICBpZDogJ25vUGFzc3dvcmQnLFxyXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiBNc2cuaW5mbyxcclxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBNc2cubW9kdWxlcy5sb2dpbi5pbmZvLnB3ZE5vdE51bGxcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGxvZ2luLmV4ZUxvZ2luKGxvZ2luTmFtZSwgJC5tZDUocHdkKSwgJChcIiNjaGVja2JveFNlbFwiKVswXS5jaGVja2VkKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiDmiafooYznmbvlvZXmk43kvZxcclxuICAgICAgICAgKiBAcGFyYW0gdXNlcm5hbWUg55So5oi35ZCNXHJcbiAgICAgICAgICogQHBhcmFtIHBhc3N3b3JkIOWvhueggVxyXG4gICAgICAgICAqIEBwYXJhbSBpZlNhdmVOYW1lIOaYr+WQpuiusOS9j+eUqOaIt+WQjVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGV4ZUxvZ2luOiBmdW5jdGlvbiAodXNlcm5hbWUsIHBhc3N3b3JkLCBpZlNhdmVOYW1lKSB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSB7fTtcclxuICAgICAgICAgICAgb2JqLmxvZ2luTmFtZSA9IHVzZXJuYW1lO1xyXG4gICAgICAgICAgICBvYmoucGFzc3dvcmQgPSBwYXNzd29yZDtcclxuICAgICAgICAgICAgb2JqLmlmU2F2ZU5hbWUgPSBpZlNhdmVOYW1lO1xyXG4gICAgICAgICAgICBpZiAoaWZTYXZlTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgQ29va2llcy5zZXRDb29rQnlOYW1lKCdzYXZlbG9naW5OYW1lJywgdXNlcm5hbWUpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgQ29va2llcy5jbGVhckJ5SWQoJ3NhdmVsb2dpbk5hbWUnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAkLmh0dHAuYWpheCgnL3VzZXIvc3NvTG9naW4nLCBvYmosIGZ1bmN0aW9uIChyZXMsIHN0YXR1cywgeGhyKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVzLnN1Y2Nlc3MpIHtcclxuICAgICAgICAgICAgICAgICAgICBNZW51LmxvZ2luKHhoci5nZXRSZXNwb25zZUhlYWRlcigndG9rZW5JZCcpLCByZXMuZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgJChkb2N1bWVudCkudW5iaW5kKCdrZXlkb3duJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHVzZXIgPSByZXMuZGF0YTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKENvb2tpZXMuZ2V0KFwiZGVmYXVsdExvYWRpbmdcIikgPT0gXCJpQ2xlYW5TY3JlZW5cIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWFpbi5sb2FkU3lzdGVtKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoXCIxMDAwMVwiID09IHJlcy5mYWlsQ29kZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBBcHAuYWxlcnQoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IE1zZy5pbmZvLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogTXNnLm1vZHVsZXMubG9naW4uaW5mby5sb2dpbkVycm9yXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoXCIxMDAwNFwiID09IHJlcy5mYWlsQ29kZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBBcHAuYWxlcnQoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IE1zZy5pbmZvLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogTXNnLm1vZHVsZXMubG9naW4uaW5mby51c2VyX2xvY2tlZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBBcHAuYWxlcnQoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IE1zZy5pbmZvLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogTXNnLm1vZHVsZXMubG9naW4uaW5mby5sb2dpbkZhaWxkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog5rOo6ZSA5a6i5oi3XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgbG9nb3V0OiBmdW5jdGlvbiAoaW5mbykge1xyXG4gICAgICAgICAgICBBcHAuY29uZmlybSh7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogTXNnLmluZm8sXHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBpbmZvIHx8IE1zZy5tb2R1bGVzLmxvZ2luLmluZm8ubG9nb3V0SW5mb1xyXG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBsb2dpbi5leGVMb2dvdXQoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog5omn6KGM6YCA5Ye65pON5L2cXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgZXhlTG9nb3V0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICQuaHR0cC5hamF4KFwiL3VzZXIvbG9naW5PdXRcIiwge30sIGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGF0YS5zdWNjZXNzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy/ljZXnlLXnq5npobXpnaJsb2dPdXTpnIDopoHmuIXpmaRzZXNzaW9uU3RvcmFnZeWPmOmHj1xyXG4gICAgICAgICAgICAgICAgICAgIHNlc3Npb25TdG9yYWdlLnJlbW92ZUl0ZW0oXCJzSWRcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgc2Vzc2lvblN0b3JhZ2UucmVtb3ZlSXRlbShcInNOYW1lXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIENvb2tpZXMuY2xlYXJCeUlkKCd0b2tlbklkJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgQ29va2llcy5jbGVhckJ5SWQoJ0pTRVNTSU9OSUQnKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdXJsID0gXCIvXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uID0gdXJsO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBsb2dpbjtcclxufSk7Il0sImZpbGUiOiJtb2R1bGVzL2xvZ2luLmpzIn0=
