'use strict';
App.Module.config({
    package: '/',
    moduleName: 'main',
    description: '模块功能：主框架，模块入口',
    importList: ['jquery', 'modules/login', 'plugins/NavMenuTree/NavMenuTree', 'Timer','ws']
});
App.Module('main', function ($, login) {

    main.winResize = $.Callbacks(); // window.onresize 绑定方法列表

    return {
        Render: function () {
            var _this = this;
            $(function () {
                var body = $('.body .inner .body-content');
                main.bindStorage();
                main.winResize.add(_this.adjust);

                /* 操作柄事件 */
                $("#navFold").off('click').on('click', function () {
                    $(this).toggleClass("fold");
                    $('#cems_main').toggleClass("fold");
                    if ($(this).hasClass('fold')) {
                        $(this).attr('title', Msg.modules.main.expand);
                    } else {
                        $(this).attr('title', Msg.modules.main.fold);
                    }
                });
                Menu.clearUserRole();
                if (Menu.isLogin()) {
                    $(document).unbind('keydown');
                    $.http.ajax('/role/queryUserRolSrc', {}, function (res) {
                        if (res.success) {
                        	   /* 生成左侧菜单 */
                            $('#main_nav').NavMenuTree({
                                home: {
                                    childs: [],
                                    id: 'home',
                                    leaf: true,
                                    level: '1',
                                    name: null,
                                    qtip: '0',
                                    text: 'Msg.modules.main.menu.home',
                                    type: null
                                },
                                data: res.data.datas,
                                open: function (name,text,ptext) {
                                	var parm = $('body').find('li[name="'+name+'"]').data("parms");
                                    body.loadPage({
                                        url: '/modules/' + name + '/index.html',
                                        scripts: ['modules/' + name + '/index'],
                                        styles: ['css!/css/main/' + name + '.css']
                                    },parm,function(d,p){
                                    	_this.openAddInfo(name,text,ptext,d,p);
                                    	$('body').find('li[name="'+name+'"]').removeData("parms");
                                    });
                                },
                                openBefore:function(){
                                	$.fn.stopAllPush();
                                	return true;
                                }
                            });
                            Menu.setUserRole(res.data.datas);
                        }
                    }, null, false);
                }
                $('#top-logo').off('click').on('click',function(){
                	var name = "home";
                	$('#main_nav').find('li[name="'+name+'"]').click();
                });
                $('.top-btn-userInfo').find('#userName').html(Cookies.getCook('loginName'));
                
                /* 用户信息 */
                $('.top-btn-userInfo').off('mouseover mouseout').on('mouseover', function () {
                    $('.userSetBox', $(this)).show();
                }).on('mouseout', function () {
                    $('.userSetBox', $(this)).hide();
                });

                /* 退出登录 */
                $("#loginOut").click(function () {
                    login.logout(Msg.modules.main.info.logoutInfo);
                });

                /* 在线帮助 */
               // $(".top-btn-inlineHelp").off('click').on('click', _this.openOnlineHelp);

                /* 关于 */
                $('.top-btn-aboutMe').off('click').on('click', function () {

                });
                /**
                 * 个人信息
                 */
                $('#updateUserMenu').off('click').on('click',function(){
                    var UpdateUserInfoDialog = App.dialog({
                        id: "update_user_moudle",
                        title: Msg.modules.main.updateUserInfo,
                        width: 400,
                        height: 410,
                        buttons: [{
                			id: "update_user_cancel",
                			type:'btn-close',
                			text: Msg.cancel
                		},{
                			id: "update_user_sure",
                			text: Msg.sure
                		}]
                    });
                    UpdateUserInfoDialog.loadPage({
                        url: "/modules/updateUserInfo/index.html",
                        scripts: ["modules/updateUserInfo/index"],
                        styles: ['css!/css/main/updateUserInfo']
                    },{}, function () {
                    });
                });

                /**
                 * 修改密码
                 */
                $('#updatePwdMenu').off('click').on('click', function () {
                    var UpdatePassDialog = App.dialog({
                        id: "pass_modify_moudle",
                        title: Msg.modules.main.updatePassword,
                        width: 450,
                        height: 250,
                        buttons: [{
                			id: "update_pwd_cancel",
                			type:'btn-close',
                			clickToClose:true,
                			text: Msg.cancel
                		},{
                			id: "update_pwd_sure",
                			text: Msg.sure
                		}]
                    });
                    UpdatePassDialog.loadPage({
                            url: "/modules/updatePassWord/index.html",
                            scripts: ["modules/updatePassWord/index"],
                            styles: ['css!/css/main/updatePassWord']
                        },{}, function () {
                        });
                });
                _this.init();
                $('.jump').off('click').on('click',function(){
                	 $('.body').scrollTop() > 0 &&  $('.body').animate({  
                         scrollTop: 0
                     }, 1000); 
                });
                
            });
        },
        openAddInfo : function(name,text,ptext,d,p){
        	var bodyT= $('.body .inner .body-title');
        	var mt = bodyT.find('.cems-menu-title');
        	if(name == 'home'){
        		mt && mt.length>0 && bodyT.hide();
        		return;
        	}
        	if(mt && mt.length>0){
        		bodyT.show();
        		var parents = $('#main_navSubNavMenuBody').find('li[name="'+name+'"]').attr('parent').split(',');
                var parent = parents[parents.length - 1];
        		mt.find('.cems-menu-ptext').text(ptext);
//                mt.find('.cems-menu-ptext').off('click').on('click',function(){
//                	$('.nav-tree-item[name="'+parent+'"]').click();
//                });
        		mt.find('.to-jump').text(text);
        		mt.find('.cems-menu-separ').text('>');
        		mt.find('.to-jump').off('click').on('click',function(){
           		 	$('#main_navSubNavMenuBody').find('li[name="'+name+'"]').click();
        		});
        	}
        },
        init: function () {
            main.winResize.fire();
            $(window).resize(function () {
                main.winResize.fire();
            });
        },
        /**
         * 自适应窗口大小变化
         */
        adjust: function () {
            var dw = document.documentElement.clientWidth;
            var dh = document.documentElement.clientHeight;
            var h = dh - $('.top').height();

            //if (dw <= 1024) {
            //    $("#navFold").addClass('fold');
            //    $('#cems_main').addClass("fold");
            //} else if (dw >= 1440) {
            //    $("#navFold").removeClass('fold');
            //    $('#cems_main').removeClass("fold");
            //}

            $('.fullBody').css({
                width: "auto",
                height: h
            });
        },

        /**
         * 打开在线帮助信息窗口
         */
        openOnlineHelp: function () {
            var lang = (main.Lang || "zh");
            if (lang == 'ja') return;
            if (lang == 'uk') lang = 'en';
            var helpWin = window.open(
                '/onlinehelp/' + lang + '/index.html',
                'iems_online_help',
                'toolbar=no,location=no,directories=no,menubar=no,scrollbars=yes,resizable=yes,status=no,hotkeys=no,z-look=yes'
            );
            helpWin && helpWin.focus();
        }

    };
});