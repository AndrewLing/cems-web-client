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
            	//若不调用此方法 则开两个登录页面 其中一个登录成功后 另一个自动刷新
            	main.unbindStorage();
            	var storage = window.localStorage; 
            	storage.removeItem('userid');
            	main.bindStorage();
                Cookies.clearById('tokenId');
                Cookies.clearById('JSESSIONID');
                Cookies.clearById('userid');

                $('.checkboxSel').off('click').on('click',function(){
                	var _this = $("#checkboxSel");
                	!_this[0].checked ? _this[0].className = 'checkboxStyCheck' :_this[0].className = 'checkboxStyChecked'; 
                });
                
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
                $('#forgetPwd').off('click').on('click',function(){
                	var paraDlg = App.dialog({
                        id : "login_to_findpassword",
            				title: Msg.modules.login.findpassword,
            				width: 800,
            				height: 400,
            				buttons: [{
                    			id: "cancel",
                    			type:'btn-cancel',
                    			clickToClose:true,
                    			text: Msg.close
                    		}]
            		});
        			paraDlg.loadPage({
        				url: "/modules/findpassword/index.html",
        				scripts: ["modules/findpassword/index"],
        				styles: ['css!/css/main/findpassword.css']
        			}, {}, 
        			function () {
        			});	
                });
                var loginName = storage.getItem("loginName");
                var password = storage.getItem("password");
                if(loginName && password){
                    login.exeLogin(loginName, password, true);
                    return;
                }
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
            if (!ifSaveName) {
            	window.localStorage.removeItem("loginName");
            	window.localStorage.removeItem("password");
            } 
            $.http.ajax('/sso/sm/login', obj, function (res, status, xhr) {
                if (res.success) {
                    if (ifSaveName) {
                    	window.localStorage.setItem("loginName",username);
                    	window.localStorage.setItem("password",password);
                    }
                    Menu.login(xhr.getResponseHeader('tokenId'), res.data);
                    $(document).unbind('keydown');
                    var user = res.data;
                    window.localStorage.setItem("userid",user.userid);
                    Cookies.setCookByName('userDomianId', user.domainid);
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
            	window.localStorage.removeItem("loginName");
            	window.localStorage.removeItem("password");
                login.exeLogout();
            });
        },

        /**
         * 执行退出操作
         */
        exeLogout: function () {
            $.http.ajax("sso/sm/loginOut", {}, function (data) {
                if (data.success) {
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