'use strict';
App.Module.config({
    package: '/',
    moduleName: 'main',
    description: '模块功能：主框架，模块入口',
    importList: ['jquery', 'modules/login', 'plugins/NavMenuTree/NavMenuTree', 'Timer']
});
App.Module('main', function ($, login) {

    main.winResize = $.Callbacks(); // window.onresize 绑定方法列表

    return {
        Render: function () {
            var _this = this;
            $(function () {
                var body = $('.body .inner');
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
                    data: [
                        {
                            "check": "true",
                            "childs": [{
                                "check": "true",
                                "childs": [],
                                "id": "dp_man",
                                "isPoor": 0,
                                "level": "2",
                                "model": "menu",
                                "name": "充电站管理",
                                "pid": "dp",
                                "sort": "1",
                                "supportPoor": "",
                                "text": "Msg.modules.main.menu.dpMan",
                                "unit": ""
                            }],
                            "id": "dp",
                            "isPoor": 0,
                            "level": "1",
                            "model": "menu",
                            "name": "充电站",
                            "pid": 0,
                            "sort": "1",
                            "supportPoor": "",
                            "text": "Msg.modules.main.menu.dp",
                            "unit": ""
                        },
                        {
                            "check": "true",
                            "childs": [{
                                "check": "true",
                                "childs": [],
                                "id": "dz_man",
                                "isPoor": 0,
                                "level": "2",
                                "model": "menu",
                                "name": "充电桩管理",
                                "pid": "dz",
                                "sort": "1",
                                "supportPoor": "",
                                "text": "Msg.modules.main.menu.dzMan",
                                "unit": ""
                            }],
                            "id": "dz",
                            "isPoor": 0,
                            "level": "1",
                            "model": "menu",
                            "name": "充电桩",
                            "pid": 0,
                            "sort": "2",
                            "supportPoor": "",
                            "text": "Msg.modules.main.menu.dz",
                            "unit": ""
                        },
                        {
                            "check": "true",
                            "childs": [{
                                "check": "true",
                                "childs": [],
                                "id": "dm_realMan",
                                "isPoor": 0,
                                "level": "2",
                                "model": "menu",
                                "name": "实时监控",
                                "pid": "dm",
                                "sort": "1",
                                "supportPoor": "",
                                "text": "Msg.modules.main.menu.realMan",
                                "unit": ""
                            },
                                {
                                    "check": "true",
                                    "childs": [],
                                    "id": "dm_alarm",
                                    "isPoor": 0,
                                    "level": "2",
                                    "model": "menu",
                                    "name": "故障与告警",
                                    "pid": "dm",
                                    "sort": "2",
                                    "supportPoor": "",
                                    "text": "Msg.modules.main.menu.dmalarm",
                                    "unit": ""
                                }],
                            "id": "dm",
                            "isPoor": 0,
                            "level": "1",
                            "model": "menu",
                            "name": "设备监控",
                            "pid": 0,
                            "sort": "3",
                            "supportPoor": "",
                            "text": "Msg.modules.main.menu.dm",
                            "unit": ""
                        },
                        {
                            "check": "true",
                            "childs": [{
                                "check": "true",
                                "childs": [],
                                "id": "dr_runReport",
                                "isPoor": 0,
                                "level": "2",
                                "model": "menu",
                                "name": "运行报表",
                                "pid": "dr",
                                "sort": "1",
                                "supportPoor": "",
                                "text": "Msg.modules.main.menu.drRunReport",
                                "unit": ""
                            },
                                {
                                    "check": "true",
                                    "childs": [],
                                    "id": "dr_chargegdata",
                                    "isPoor": 0,
                                    "level": "2",
                                    "model": "menu",
                                    "name": "充电性能数据",
                                    "pid": "dr",
                                    "sort": "2",
                                    "supportPoor": "",
                                    "text": "Msg.modules.main.menu.drChargeData",
                                    "unit": ""
                                },
                                {
                                    "check": "true",
                                    "childs": [],
                                    "id": "dr_hisdata",
                                    "isPoor": 0,
                                    "level": "2",
                                    "model": "menu",
                                    "name": "历史充电数据",
                                    "pid": "dr",
                                    "sort": "3",
                                    "supportPoor": "",
                                    "text": "Msg.modules.main.menu.drhisdata",
                                    "unit": ""
                                }],
                            "id": "dr",
                            "isPoor": 0,
                            "level": "1",
                            "model": "menu",
                            "name": "数据报表",
                            "pid": 0,
                            "sort": "4",
                            "supportPoor": "",
                            "text": "Msg.modules.main.menu.dr",
                            "unit": ""
                        },
                        {
                            "check": "true",
                            "childs": [{
                                "check": "true",
                                "childs": [],
                                "id": "rc_man",
                                "isPoor": 0,
                                "level": "2",
                                "model": "menu",
                                "name": "充值卡管理",
                                "pid": "rc",
                                "sort": "1",
                                "supportPoor": "",
                                "text": "Msg.modules.main.menu.rcman",
                                "unit": ""
                            },
                                {
                                    "check": "true",
                                    "childs": [],
                                    "id": "rc_record",
                                    "isPoor": 0,
                                    "level": "2",
                                    "model": "menu",
                                    "name": "缴费记录",
                                    "pid": "rc",
                                    "sort": "2",
                                    "supportPoor": "",
                                    "text": "Msg.modules.main.menu.rcRecord",
                                    "unit": ""
                                },
                                {
                                    "check": "true",
                                    "childs": [],
                                    "id": "rc_order",
                                    "isPoor": 0,
                                    "level": "2",
                                    "model": "menu",
                                    "name": "订单列表",
                                    "pid": "rc",
                                    "sort": "3",
                                    "supportPoor": "",
                                    "text": "Msg.modules.main.menu.rcOrder",
                                    "unit": ""
                                }],
                            "id": "rc",
                            "isPoor": 0,
                            "level": "1",
                            "model": "menu",
                            "name": "充电卡",
                            "pid": 0,
                            "sort": "5",
                            "supportPoor": "",
                            "text": "Msg.modules.main.menu.rc",
                            "unit": ""
                        },
                        {
                            "check": "true",
                            "childs": [{
                                "check": "true",
                                "childs": [],
                                "id": "sm_domain",
                                "isPoor": 0,
                                "level": "2",
                                "model": "menu",
                                "name": "行政区配置",
                                "pid": "sm",
                                "sort": "1",
                                "supportPoor": "",
                                "text": "Msg.modules.main.menu.smDomain",
                                "unit": ""
                            },
                                {
                                    "check": "true",
                                    "childs": [],
                                    "id": "sm_user",
                                    "isPoor": 0,
                                    "level": "2",
                                    "model": "menu",
                                    "name": "用户管理",
                                    "pid": "sm",
                                    "sort": "2",
                                    "supportPoor": "",
                                    "text": "Msg.modules.main.menu.smUser",
                                    "unit": ""
                                },
                                {
                                    "check": "true",
                                    "childs": [],
                                    "id": "sm_role",
                                    "isPoor": 0,
                                    "level": "2",
                                    "model": "menu",
                                    "name": "角色管理",
                                    "pid": "sm",
                                    "sort": "3",
                                    "supportPoor": "",
                                    "text": "Msg.modules.main.menu.smRole",
                                    "unit": ""
                                },
                                {
                                    "check": "true",
                                    "childs": [],
                                    "id": "sm_log",
                                    "isPoor": 0,
                                    "level": "2",
                                    "model": "menu",
                                    "name": "日志管理",
                                    "pid": "sm",
                                    "sort": "4",
                                    "supportPoor": "",
                                    "text": "Msg.modules.main.menu.smLog",
                                    "unit": ""
                                }],
                            "id": "sm",
                            "isPoor": 0,
                            "level": "1",
                            "model": "menu",
                            "name": "系统管理",
                            "pid": 0,
                            "sort": "6",
                            "supportPoor": "",
                            "text": "Msg.modules.main.menu.sm",
                            "unit": ""
                        }
                    ],
                    open: function (name) {
                        body.loadPage({
                            url: '/modules/' + name + '/index.html',
                            scripts: ['modules/' + name + '/index'],
                            styles: ['css!/css/main/' + name + '.css']
                        });
                    }
                });

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
                $(".top-btn-inlineHelp").off('click').on('click', _this.openOnlineHelp);

                /* 关于 */
                $('.top-btn-aboutMe').off('click').on('click', function () {

                });

                _this.init();
            });
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJtb2R1bGVzL21haW4uanMiXSwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xyXG5BcHAuTW9kdWxlLmNvbmZpZyh7XHJcbiAgICBwYWNrYWdlOiAnLycsXHJcbiAgICBtb2R1bGVOYW1lOiAnbWFpbicsXHJcbiAgICBkZXNjcmlwdGlvbjogJ+aooeWdl+WKn+iDve+8muS4u+ahhuaetu+8jOaooeWdl+WFpeWPoycsXHJcbiAgICBpbXBvcnRMaXN0OiBbJ2pxdWVyeScsICdtb2R1bGVzL2xvZ2luJywgJ3BsdWdpbnMvTmF2TWVudVRyZWUvTmF2TWVudVRyZWUnLCAnVGltZXInXVxyXG59KTtcclxuQXBwLk1vZHVsZSgnbWFpbicsIGZ1bmN0aW9uICgkLCBsb2dpbikge1xyXG5cclxuICAgIG1haW4ud2luUmVzaXplID0gJC5DYWxsYmFja3MoKTsgLy8gd2luZG93Lm9ucmVzaXplIOe7keWumuaWueazleWIl+ihqFxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgUmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcbiAgICAgICAgICAgICQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGJvZHkgPSAkKCcuYm9keSAuaW5uZXInKTtcclxuICAgICAgICAgICAgICAgIG1haW4uYmluZFN0b3JhZ2UoKTtcclxuICAgICAgICAgICAgICAgIG1haW4ud2luUmVzaXplLmFkZChfdGhpcy5hZGp1c3QpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8qIOaTjeS9nOafhOS6i+S7tiAqL1xyXG4gICAgICAgICAgICAgICAgJChcIiNuYXZGb2xkXCIpLm9mZignY2xpY2snKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS50b2dnbGVDbGFzcyhcImZvbGRcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnI2NlbXNfbWFpbicpLnRvZ2dsZUNsYXNzKFwiZm9sZFwiKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoJCh0aGlzKS5oYXNDbGFzcygnZm9sZCcpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykuYXR0cigndGl0bGUnLCBNc2cubW9kdWxlcy5tYWluLmV4cGFuZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5hdHRyKCd0aXRsZScsIE1zZy5tb2R1bGVzLm1haW4uZm9sZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAvKiDnlJ/miJDlt6bkvqfoj5zljZUgKi9cclxuICAgICAgICAgICAgICAgICQoJyNtYWluX25hdicpLk5hdk1lbnVUcmVlKHtcclxuICAgICAgICAgICAgICAgICAgICBob21lOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkczogW10sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiAnaG9tZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlYWY6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldmVsOiAnMScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IG51bGwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHF0aXA6ICcwJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogJ01zZy5tb2R1bGVzLm1haW4ubWVudS5ob21lJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogbnVsbFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImNoZWNrXCI6IFwidHJ1ZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJjaGlsZHNcIjogW3tcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImNoZWNrXCI6IFwidHJ1ZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiY2hpbGRzXCI6IFtdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiaWRcIjogXCJkcF9tYW5cIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImlzUG9vclwiOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwibGV2ZWxcIjogXCIyXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJtb2RlbFwiOiBcIm1lbnVcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm5hbWVcIjogXCLlhYXnlLXnq5nnrqHnkIZcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInBpZFwiOiBcImRwXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJzb3J0XCI6IFwiMVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwic3VwcG9ydFBvb3JcIjogXCJcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInRleHRcIjogXCJNc2cubW9kdWxlcy5tYWluLm1lbnUuZHBNYW5cIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInVuaXRcIjogXCJcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfV0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImlkXCI6IFwiZHBcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiaXNQb29yXCI6IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImxldmVsXCI6IFwiMVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJtb2RlbFwiOiBcIm1lbnVcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwibmFtZVwiOiBcIuWFheeUteermVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJwaWRcIjogMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwic29ydFwiOiBcIjFcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwic3VwcG9ydFBvb3JcIjogXCJcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidGV4dFwiOiBcIk1zZy5tb2R1bGVzLm1haW4ubWVudS5kcFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ1bml0XCI6IFwiXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJjaGVja1wiOiBcInRydWVcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiY2hpbGRzXCI6IFt7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJjaGVja1wiOiBcInRydWVcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImNoaWxkc1wiOiBbXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImlkXCI6IFwiZHpfbWFuXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJpc1Bvb3JcIjogMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImxldmVsXCI6IFwiMlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwibW9kZWxcIjogXCJtZW51XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJuYW1lXCI6IFwi5YWF55S15qGp566h55CGXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJwaWRcIjogXCJkelwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwic29ydFwiOiBcIjFcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInN1cHBvcnRQb29yXCI6IFwiXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ0ZXh0XCI6IFwiTXNnLm1vZHVsZXMubWFpbi5tZW51LmR6TWFuXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ1bml0XCI6IFwiXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1dLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJpZFwiOiBcImR6XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImlzUG9vclwiOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJsZXZlbFwiOiBcIjFcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwibW9kZWxcIjogXCJtZW51XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm5hbWVcIjogXCLlhYXnlLXmoalcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwicGlkXCI6IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInNvcnRcIjogXCIyXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInN1cHBvcnRQb29yXCI6IFwiXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInRleHRcIjogXCJNc2cubW9kdWxlcy5tYWluLm1lbnUuZHpcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidW5pdFwiOiBcIlwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiY2hlY2tcIjogXCJ0cnVlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImNoaWxkc1wiOiBbe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiY2hlY2tcIjogXCJ0cnVlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJjaGlsZHNcIjogW10sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJpZFwiOiBcImRtX3JlYWxNYW5cIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImlzUG9vclwiOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwibGV2ZWxcIjogXCIyXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJtb2RlbFwiOiBcIm1lbnVcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm5hbWVcIjogXCLlrp7ml7bnm5HmjqdcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInBpZFwiOiBcImRtXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJzb3J0XCI6IFwiMVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwic3VwcG9ydFBvb3JcIjogXCJcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInRleHRcIjogXCJNc2cubW9kdWxlcy5tYWluLm1lbnUucmVhbE1hblwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidW5pdFwiOiBcIlwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJjaGVja1wiOiBcInRydWVcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJjaGlsZHNcIjogW10sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiaWRcIjogXCJkbV9hbGFybVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImlzUG9vclwiOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImxldmVsXCI6IFwiMlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm1vZGVsXCI6IFwibWVudVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm5hbWVcIjogXCLmlYXpmpzkuI7lkYroraZcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJwaWRcIjogXCJkbVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInNvcnRcIjogXCIyXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwic3VwcG9ydFBvb3JcIjogXCJcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ0ZXh0XCI6IFwiTXNnLm1vZHVsZXMubWFpbi5tZW51LmRtYWxhcm1cIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ1bml0XCI6IFwiXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiaWRcIjogXCJkbVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJpc1Bvb3JcIjogMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwibGV2ZWxcIjogXCIxXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm1vZGVsXCI6IFwibWVudVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJuYW1lXCI6IFwi6K6+5aSH55uR5o6nXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInBpZFwiOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJzb3J0XCI6IFwiM1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJzdXBwb3J0UG9vclwiOiBcIlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ0ZXh0XCI6IFwiTXNnLm1vZHVsZXMubWFpbi5tZW51LmRtXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInVuaXRcIjogXCJcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImNoZWNrXCI6IFwidHJ1ZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJjaGlsZHNcIjogW3tcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImNoZWNrXCI6IFwidHJ1ZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiY2hpbGRzXCI6IFtdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiaWRcIjogXCJkcl9ydW5SZXBvcnRcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImlzUG9vclwiOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwibGV2ZWxcIjogXCIyXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJtb2RlbFwiOiBcIm1lbnVcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm5hbWVcIjogXCLov5DooYzmiqXooahcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInBpZFwiOiBcImRyXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJzb3J0XCI6IFwiMVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwic3VwcG9ydFBvb3JcIjogXCJcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInRleHRcIjogXCJNc2cubW9kdWxlcy5tYWluLm1lbnUuZHJSdW5SZXBvcnRcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInVuaXRcIjogXCJcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiY2hlY2tcIjogXCJ0cnVlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiY2hpbGRzXCI6IFtdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImlkXCI6IFwiZHJfY2hhcmdlZ2RhdGFcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJpc1Bvb3JcIjogMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJsZXZlbFwiOiBcIjJcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJtb2RlbFwiOiBcIm1lbnVcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJuYW1lXCI6IFwi5YWF55S15oCn6IO95pWw5o2uXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwicGlkXCI6IFwiZHJcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJzb3J0XCI6IFwiMlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInN1cHBvcnRQb29yXCI6IFwiXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidGV4dFwiOiBcIk1zZy5tb2R1bGVzLm1haW4ubWVudS5kckNoYXJnZURhdGFcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ1bml0XCI6IFwiXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJjaGVja1wiOiBcInRydWVcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJjaGlsZHNcIjogW10sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiaWRcIjogXCJkcl9oaXNkYXRhXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiaXNQb29yXCI6IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwibGV2ZWxcIjogXCIyXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwibW9kZWxcIjogXCJtZW51XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwibmFtZVwiOiBcIuWOhuWPsuWFheeUteaVsOaNrlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInBpZFwiOiBcImRyXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwic29ydFwiOiBcIjNcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJzdXBwb3J0UG9vclwiOiBcIlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInRleHRcIjogXCJNc2cubW9kdWxlcy5tYWluLm1lbnUuZHJoaXNkYXRhXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidW5pdFwiOiBcIlwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfV0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImlkXCI6IFwiZHJcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiaXNQb29yXCI6IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImxldmVsXCI6IFwiMVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJtb2RlbFwiOiBcIm1lbnVcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwibmFtZVwiOiBcIuaVsOaNruaKpeihqFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJwaWRcIjogMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwic29ydFwiOiBcIjRcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwic3VwcG9ydFBvb3JcIjogXCJcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidGV4dFwiOiBcIk1zZy5tb2R1bGVzLm1haW4ubWVudS5kclwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ1bml0XCI6IFwiXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJjaGVja1wiOiBcInRydWVcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiY2hpbGRzXCI6IFt7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJjaGVja1wiOiBcInRydWVcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImNoaWxkc1wiOiBbXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImlkXCI6IFwicmNfbWFuXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJpc1Bvb3JcIjogMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImxldmVsXCI6IFwiMlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwibW9kZWxcIjogXCJtZW51XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJuYW1lXCI6IFwi5YWF5YC85Y2h566h55CGXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJwaWRcIjogXCJyY1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwic29ydFwiOiBcIjFcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInN1cHBvcnRQb29yXCI6IFwiXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ0ZXh0XCI6IFwiTXNnLm1vZHVsZXMubWFpbi5tZW51LnJjbWFuXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ1bml0XCI6IFwiXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImNoZWNrXCI6IFwidHJ1ZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImNoaWxkc1wiOiBbXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJpZFwiOiBcInJjX3JlY29yZFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImlzUG9vclwiOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImxldmVsXCI6IFwiMlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm1vZGVsXCI6IFwibWVudVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm5hbWVcIjogXCLnvLTotLnorrDlvZVcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJwaWRcIjogXCJyY1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInNvcnRcIjogXCIyXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwic3VwcG9ydFBvb3JcIjogXCJcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ0ZXh0XCI6IFwiTXNnLm1vZHVsZXMubWFpbi5tZW51LnJjUmVjb3JkXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidW5pdFwiOiBcIlwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiY2hlY2tcIjogXCJ0cnVlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiY2hpbGRzXCI6IFtdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImlkXCI6IFwicmNfb3JkZXJcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJpc1Bvb3JcIjogMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJsZXZlbFwiOiBcIjJcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJtb2RlbFwiOiBcIm1lbnVcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJuYW1lXCI6IFwi6K6i5Y2V5YiX6KGoXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwicGlkXCI6IFwicmNcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJzb3J0XCI6IFwiM1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInN1cHBvcnRQb29yXCI6IFwiXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidGV4dFwiOiBcIk1zZy5tb2R1bGVzLm1haW4ubWVudS5yY09yZGVyXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidW5pdFwiOiBcIlwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfV0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImlkXCI6IFwicmNcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiaXNQb29yXCI6IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImxldmVsXCI6IFwiMVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJtb2RlbFwiOiBcIm1lbnVcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwibmFtZVwiOiBcIuWFheeUteWNoVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJwaWRcIjogMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwic29ydFwiOiBcIjVcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwic3VwcG9ydFBvb3JcIjogXCJcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidGV4dFwiOiBcIk1zZy5tb2R1bGVzLm1haW4ubWVudS5yY1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ1bml0XCI6IFwiXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJjaGVja1wiOiBcInRydWVcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiY2hpbGRzXCI6IFt7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJjaGVja1wiOiBcInRydWVcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImNoaWxkc1wiOiBbXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImlkXCI6IFwic21fZG9tYWluXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJpc1Bvb3JcIjogMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImxldmVsXCI6IFwiMlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwibW9kZWxcIjogXCJtZW51XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJuYW1lXCI6IFwi6KGM5pS/5Yy66YWN572uXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJwaWRcIjogXCJzbVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwic29ydFwiOiBcIjFcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInN1cHBvcnRQb29yXCI6IFwiXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ0ZXh0XCI6IFwiTXNnLm1vZHVsZXMubWFpbi5tZW51LnNtRG9tYWluXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ1bml0XCI6IFwiXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImNoZWNrXCI6IFwidHJ1ZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImNoaWxkc1wiOiBbXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJpZFwiOiBcInNtX3VzZXJcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJpc1Bvb3JcIjogMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJsZXZlbFwiOiBcIjJcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJtb2RlbFwiOiBcIm1lbnVcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJuYW1lXCI6IFwi55So5oi3566h55CGXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwicGlkXCI6IFwic21cIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJzb3J0XCI6IFwiMlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInN1cHBvcnRQb29yXCI6IFwiXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidGV4dFwiOiBcIk1zZy5tb2R1bGVzLm1haW4ubWVudS5zbVVzZXJcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ1bml0XCI6IFwiXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJjaGVja1wiOiBcInRydWVcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJjaGlsZHNcIjogW10sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiaWRcIjogXCJzbV9yb2xlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiaXNQb29yXCI6IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwibGV2ZWxcIjogXCIyXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwibW9kZWxcIjogXCJtZW51XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwibmFtZVwiOiBcIuinkuiJsueuoeeQhlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInBpZFwiOiBcInNtXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwic29ydFwiOiBcIjNcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJzdXBwb3J0UG9vclwiOiBcIlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInRleHRcIjogXCJNc2cubW9kdWxlcy5tYWluLm1lbnUuc21Sb2xlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidW5pdFwiOiBcIlwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiY2hlY2tcIjogXCJ0cnVlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiY2hpbGRzXCI6IFtdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImlkXCI6IFwic21fbG9nXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiaXNQb29yXCI6IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwibGV2ZWxcIjogXCIyXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwibW9kZWxcIjogXCJtZW51XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwibmFtZVwiOiBcIuaXpeW/l+euoeeQhlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInBpZFwiOiBcInNtXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwic29ydFwiOiBcIjRcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJzdXBwb3J0UG9vclwiOiBcIlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInRleHRcIjogXCJNc2cubW9kdWxlcy5tYWluLm1lbnUuc21Mb2dcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ1bml0XCI6IFwiXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiaWRcIjogXCJzbVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJpc1Bvb3JcIjogMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwibGV2ZWxcIjogXCIxXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm1vZGVsXCI6IFwibWVudVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJuYW1lXCI6IFwi57O757uf566h55CGXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInBpZFwiOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJzb3J0XCI6IFwiNlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJzdXBwb3J0UG9vclwiOiBcIlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ0ZXh0XCI6IFwiTXNnLm1vZHVsZXMubWFpbi5tZW51LnNtXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInVuaXRcIjogXCJcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgICAgICBvcGVuOiBmdW5jdGlvbiAobmFtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBib2R5LmxvYWRQYWdlKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybDogJy9tb2R1bGVzLycgKyBuYW1lICsgJy9pbmRleC5odG1sJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjcmlwdHM6IFsnbW9kdWxlcy8nICsgbmFtZSArICcvaW5kZXgnXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlczogWydjc3MhL2Nzcy9tYWluLycgKyBuYW1lICsgJy5jc3MnXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAvKiDnlKjmiLfkv6Hmga8gKi9cclxuICAgICAgICAgICAgICAgICQoJy50b3AtYnRuLXVzZXJJbmZvJykub2ZmKCdtb3VzZW92ZXIgbW91c2VvdXQnKS5vbignbW91c2VvdmVyJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICQoJy51c2VyU2V0Qm94JywgJCh0aGlzKSkuc2hvdygpO1xyXG4gICAgICAgICAgICAgICAgfSkub24oJ21vdXNlb3V0JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICQoJy51c2VyU2V0Qm94JywgJCh0aGlzKSkuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgLyog6YCA5Ye655m75b2VICovXHJcbiAgICAgICAgICAgICAgICAkKFwiI2xvZ2luT3V0XCIpLmNsaWNrKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBsb2dpbi5sb2dvdXQoTXNnLm1vZHVsZXMubWFpbi5pbmZvLmxvZ291dEluZm8pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgLyog5Zyo57q/5biu5YqpICovXHJcbiAgICAgICAgICAgICAgICAkKFwiLnRvcC1idG4taW5saW5lSGVscFwiKS5vZmYoJ2NsaWNrJykub24oJ2NsaWNrJywgX3RoaXMub3Blbk9ubGluZUhlbHApO1xyXG5cclxuICAgICAgICAgICAgICAgIC8qIOWFs+S6jiAqL1xyXG4gICAgICAgICAgICAgICAgJCgnLnRvcC1idG4tYWJvdXRNZScpLm9mZignY2xpY2snKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgX3RoaXMuaW5pdCgpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBpbml0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIG1haW4ud2luUmVzaXplLmZpcmUoKTtcclxuICAgICAgICAgICAgJCh3aW5kb3cpLnJlc2l6ZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBtYWluLndpblJlc2l6ZS5maXJlKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog6Ieq6YCC5bqU56qX5Y+j5aSn5bCP5Y+Y5YyWXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgYWRqdXN0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciBkdyA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aDtcclxuICAgICAgICAgICAgdmFyIGRoID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodDtcclxuICAgICAgICAgICAgdmFyIGggPSBkaCAtICQoJy50b3AnKS5oZWlnaHQoKTtcclxuXHJcbiAgICAgICAgICAgIC8vaWYgKGR3IDw9IDEwMjQpIHtcclxuICAgICAgICAgICAgLy8gICAgJChcIiNuYXZGb2xkXCIpLmFkZENsYXNzKCdmb2xkJyk7XHJcbiAgICAgICAgICAgIC8vICAgICQoJyNjZW1zX21haW4nKS5hZGRDbGFzcyhcImZvbGRcIik7XHJcbiAgICAgICAgICAgIC8vfSBlbHNlIGlmIChkdyA+PSAxNDQwKSB7XHJcbiAgICAgICAgICAgIC8vICAgICQoXCIjbmF2Rm9sZFwiKS5yZW1vdmVDbGFzcygnZm9sZCcpO1xyXG4gICAgICAgICAgICAvLyAgICAkKCcjY2Vtc19tYWluJykucmVtb3ZlQ2xhc3MoXCJmb2xkXCIpO1xyXG4gICAgICAgICAgICAvL31cclxuXHJcbiAgICAgICAgICAgICQoJy5mdWxsQm9keScpLmNzcyh7XHJcbiAgICAgICAgICAgICAgICB3aWR0aDogXCJhdXRvXCIsXHJcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IGhcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog5omT5byA5Zyo57q/5biu5Yqp5L+h5oGv56qX5Y+jXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgb3Blbk9ubGluZUhlbHA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIGxhbmcgPSAobWFpbi5MYW5nIHx8IFwiemhcIik7XHJcbiAgICAgICAgICAgIGlmIChsYW5nID09ICdqYScpIHJldHVybjtcclxuICAgICAgICAgICAgaWYgKGxhbmcgPT0gJ3VrJykgbGFuZyA9ICdlbic7XHJcbiAgICAgICAgICAgIHZhciBoZWxwV2luID0gd2luZG93Lm9wZW4oXHJcbiAgICAgICAgICAgICAgICAnL29ubGluZWhlbHAvJyArIGxhbmcgKyAnL2luZGV4Lmh0bWwnLFxyXG4gICAgICAgICAgICAgICAgJ2llbXNfb25saW5lX2hlbHAnLFxyXG4gICAgICAgICAgICAgICAgJ3Rvb2xiYXI9bm8sbG9jYXRpb249bm8sZGlyZWN0b3JpZXM9bm8sbWVudWJhcj1ubyxzY3JvbGxiYXJzPXllcyxyZXNpemFibGU9eWVzLHN0YXR1cz1ubyxob3RrZXlzPW5vLHotbG9vaz15ZXMnXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIGhlbHBXaW4gJiYgaGVscFdpbi5mb2N1cygpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9O1xyXG59KTsiXSwiZmlsZSI6Im1vZHVsZXMvbWFpbi5qcyJ9
