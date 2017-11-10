'use strict';
App.Module.config({
    package: '/rc_man',
    moduleName: 'rc_man',
    description: '模块功能：充值卡管理',
    importList: ['jquery', 'bootstrap', 'ValidateForm', 'GridTable']
});
App.Module('rc_man', function () {
    var table;
    var parm;
    var rcMan = {
        Render: function (params) {
            //设置背景色
            main.setBackColor();
            //初始化 搜索框
            rcMan.initSearch();
            //查询卡数据
            rcMan.queryCards();

        },
        //查询卡数据
        queryCards: function () {
            parm = {cardNumber: $('#card_number_search').val()};
            table = $('#rcManTable').GridTable({
                url: 'card/list',
                params: parm,
                fnSubmit: rcMan.fSubmit,
                title: false,
                clickSelect: true,
                idProperty: 'id',
                isRecordSelected: true,//跨页选择
                isSearchRecordSelected: false,
                max_height: '575',
                colModel: [{
                    display: Msg.modules.rc_man.cardNumber,
                    name: 'cardNumber',
                    width: 0.2,
                    sortable: false,
                    align: 'center'
                },
                {
                    display: '充电卡类型',
                    name: 'cardType',
                    width: 0.2,
                    sortable: false,
                    align: 'center'
                },
                {
                    display: '发卡方',
                    name: 'cardOwner',
                    width: 0.2,
                    sortable: false,
                    align: 'center'
                },
                {
                    display: '所属方编码',
                    name: 'cardOwnerNo',
                    width: 0.2,
                    sortable: false,
                    align: 'center'
                },
                {
                    display: Msg.modules.rc_man.status,
                    name: 'cardStatus',
                    width: 0.2,
                    sortable: false,
                    align: 'center',
                    fnInit: rcMan.initStatus

                }]
            });
        },
        //初始化 搜索框
        initSearch: function () {
            //初始化 条件操作按钮
            $("#rcManBar").ValidateForm('rc_man_bar', {
                show: 'horizontal',

                fnSubmit: rcMan.submit,
                model: [[{
                    input: 'input',
                    type: 'text',
                    show: Msg.modules.rc_man.cardNumber,
                    name: 'card_number',
                    width: '165',
                    extend: {
                        id: 'card_number_search'
                    }
                }]]
            });
            $('#rcManBar').find('#add_card').parents('.clsRow').css({
                float: 'right'
            });
        },

        submit:function(){
            parm = {cardNumber: $('#card_number_search').val()};
            table.GridTableSearch({
                params:parm
            })
        },

        /**
         * 添加充电卡
         */
        addCard: function () {
            var paraDlg = App.dialog({
                id: "addCard_moudle",
                title:  Msg.modules.rc_man.importCard,
                width: 400,
                height: 180,
                buttons: [{
        			id: "add_card_cancel_btn",
        			type:'btn-close',
        			clickToClose:true,
        			text: Msg.cancel
        		},{
        			id: "add_card_confirm_btn",
        			text: Msg.sure
        		}]
            });
            paraDlg.loadPage({
                    url: "/modules/rc_man/addCard.html",
                    scripts: ["modules/rc_man/addCard"]
                }, {},
                function () {

                });

        },
        /**
         * 更改卡状态
         */
        modifyStatus: function () {
            var selects = table.GridTableSelectedRecords();
            if (selects.length != 1) {
                App.alert(Msg.choseOne);
                return;
            }
            var sData = selects[0];
            App.confirm(Msg.modules.rc_man.confirmUpdate, function () {
                $.http.ajax("/card/updateCardStatus", {
                    "id": sData.id, "cardStatus": parseInt(sData.cardStatus)
                }, function (res) {
                    if (res && res.success) {
                        main.comonErrorFun(Msg.modules.rc_man.modifySuccess, function () {
                            rcMan.queryCards();
                        });
                    } else {
                        var message = res.data || Msg.deleteFailed;
                        main.comonErrorFun(message);
                    }
                }, function () {
                    main.comonErrorFun(Msg.deleteFailed);
                });
            })

        },
        fSubmit: function () {
            rcMan.queryCards();
        },

        fInit: function (dom, value) {
            var time = Date.parse(value).format('yyyy-MM-dd hh:mm:ss').replace(/-/g, '-');
            $(dom).parent().attr("title", time);
            $(dom).html(time);
        },

        initStatus: function (dom, value) {
            if (value == 0) {
                $(dom).attr("title", Msg.modules.rc_man.normal).html(Msg.modules.rc_man.normal);
            }
            else if (value == 1) {
                $(dom).attr("title", Msg.modules.rc_man.blacklist).html(Msg.modules.rc_man.blacklist);
            }
        }
    };
    return rcMan;
});