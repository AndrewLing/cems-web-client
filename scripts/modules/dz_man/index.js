'use strict';
App.Module.config({
    package: '/main',
    moduleName: 'dz_man',
    description: '模块功能：充电桩管理',
    importList: ['jquery', 'bootstrap', 'easyTabs', 'ValidateForm', 'datePicker', 'GridTable','dynamic']
});
App.Module('dz_man', function () {
	var toParms;
    var dz_man = {
        Render: function (params) {
        	main.setBackColor();
        	toParms = params;
            $(function () {
                var param = {};
                $("#pileSerachBar").ValidateForm('pileSerachBar', {
                    show: 'horizontal',
                    fnSubmit: submit,
                    model: [
                        [
                            {
                                input: 'input',
                                type: 'text',
                                show: Msg.modules.dz_man.stationList,
                                width : '165',
                                name: 'dz_station_list',
                                extend: {id: 'dz_station_list'}
                            },
                            {
                                input: 'select',
                                type: 'select',
                                show: Msg.modules.dz_man.status,
                                options: [
                                    {text: Msg.all, value: ""},
                                    {text: Msg.modules.dz_man.online, value: "1"},
                                    {text: Msg.modules.dz_man.offline, value: "0"}
                                ],
                                name: 'dz_online_status',
                                extend: {id: 'dz_online_status', readonly: 'readonly'}
                            },
                            {
                                input: 'input',
                                type: 'text',
                                show: Msg.modules.dz_man.deviceType,
                                width : '165',
                                name: 'dz_dev_type',
                                extend: {id: 'dz_dev_type'}
                            }
                        ]
                    ],
                    extraButtons: [
                        {
                            input: 'button',
                            align: 'right',
                            show: Msg.add,
                            name: '',
                            fnClick: function (data) {
                                createPile(data, 1);
                            },
                            extend: {
                                id: 'dz_man_add',
                                class: 'btn btn-add'
                                // permission: "rm_cn_exportReport"
                            }
                        },
                        {
                            input: 'button',
                            align: 'right',
                            show: Msg.update,
                            name: '',
                            fnClick: function (data) {
                                modifyPile();
                            },
                            extend: {
                                id: 'dz_man_update',
                                class: 'btn btn-mdf'
                                // permission: "rm_cn_exportReport"
                            }
                        },
                        {
                            input: 'button',
                            align: 'right',
                            show: Msg.del,
                            name: '',
                            fnClick: function () {
                                deletePile();
                            },
                            extend: {
                                id: 'dz_man_delete',
                                class: 'btn btn-del'
                                // permission: "rm_cn_exportReport"
                            }
                        }
                    ]
                });

                
                $("#pileSerachBar").find("#dz_man_add").parents('.clsRow').css({float: 'right'});

                /**
                 * 获取站点列表
                 */
                $('#dz_station_list').dynamic({
                    url: 'station/list',
                    chStyle:'checkbox',
                    urlToProtoType:false
                });
                
                $("#dz_dev_type").dynamic({
                	prototypeData:[{
                		name:Msg.modules.dz_man.zlkc,
                		id:1
                	},{
                		name:Msg.modules.dz_man.zlmc,
                		id:2
                	},{
                		name:Msg.modules.dz_man.jlkc,
                		id:3
                	},{
                		name:Msg.modules.dz_man.jlmc,
                		id:4
                	}],
                	selectNode:toParms.deviceTypes || [],
                	seach:false
                });
                function getParms(){
                	 var stationId = $('#dz_station_list').dynamicSelected();
                     var onlineStatus = $("#dz_online_status").val();
                     var ondevType =  $("#dz_dev_type").dynamic('dynamicSelected');
                     var parm = {};
                     var map = {};
                     if(stationId && stationId.length>0){
                    	 map.stationIds = stationId;
                     }
                     if(onlineStatus){
                    	 map.onlineStatus = onlineStatus;
                     }
                     if(ondevType.length>0){
                    	 map.deviceTypes = ondevType;
                     }
                     parm.queryParms = map;
                     return parm;
                }
                
                function submit() {
                    $('#ChargepileTable').GridTableSearch({params:getParms()});
                }

                var iparm = getParms();
                if(!$.isEmptyObject(toParms) && $.isEmptyObject(iparm.queryParms)){
                	iparm.queryParms = toParms;
                }
                //表格
                var table = $("#ChargepileTable").GridTable({
                    url: 'pile/listPile',
                    clickSelect: true,
                    idProperty: 'id',
                    isRecordSelected: true,//跨页选择
                    isSearchRecordSelected: false,
                    params: iparm,
                    title: false,
                    max_height: '575',
                    colModel: [
                        {
                            display: Msg.modules.dz_man.serialNumber,
                            name: 'serialNumber',
                            width: 0.15,
                            sortable: false,
                            align: 'center'
                        },
                        {
                            display: Msg.modules.dz_man.station,
                            name: 'statioName',
                            width: 0.2,
                            sortable: false,
                            align: 'center'
                        },
                        {
                            display: Msg.modules.dz_man.deviceType,
                            name: 'deviceType',
                            width: 0.15,
                            sortable: true,
                            align: 'center',
                            fnInit: foramtType
                        },
                        {
                            display: Msg.modules.dz_man.businessType,
                            name: 'businessType',
                            width: 0.2,
                            sortable: false,
                            align: 'center',
                            fnInit:formatBusinType
                        },
                        {
                            display: Msg.modules.dz_man.onlineStatus,
                            name: 'onlineStatus',
                            width: 0.1,
                            sortable: false,
                            align: 'center',
                            fnInit: foramtOnlineStatus
                        },
                        {
                            display: Msg.operate,
                            name: 'operate',
                            width: 0.2,
                            sortable: false,
                            align: 'center',
                            fnInit: operate
                        }
                    ]
                });

                function foramtOnlineStatus(dom, value, data) {
                    if (value == 1) {
                        dom.parent().html(Msg.modules.dz_man.online).attr("title", Msg.modules.dz_man.online);
                    } else if (value == 0) {
                        dom.parent().html(Msg.modules.dz_man.offline).attr("title", Msg.modules.dz_man.offline);
                    }
                }

                function foramtType(dom, value, data) {
                    if (value == 1) {
                        dom.parent().html(Msg.modules.dz_man.zlkc).attr("title", Msg.modules.dz_man.zlkc);
                    }
                    else if (value == 2) {
                        dom.parent().html(Msg.modules.dz_man.zlmc).attr("title", Msg.modules.dz_man.zlmc);
                    }
                    else if (value == 3) {
                        dom.parent().html(Msg.modules.dz_man.jlkc).attr("title", Msg.modules.dz_man.jlkc);
                    }
                    else if (value == 4) {
                        dom.parent().html(Msg.modules.dz_man.jlmc).attr("title", Msg.modules.dz_man.jlmc);
                    }
                    else if (value == 5) {
                        dom.parent().html(Msg.modules.dz_man.jzlhh).attr("title", Msg.modules.dz_man.jzlhh);
                    }
                }
                function formatBusinType(dom, value){
                    if (value == 1) {
                        dom.parent().html(Msg.modules.dz_man.privateNotOpen).attr("title", Msg.modules.dz_man.privateNotOpen);
                    }
                    else if (value == 2) {
                        dom.parent().html(Msg.modules.dz_man.privateOpen).attr("title", Msg.modules.dz_man.privateOpen);
                    }
                    else if (value == 3) {
                        dom.parent().html(Msg.modules.dz_man.publicFree).attr("title", Msg.modules.dz_man.publicFree);
                    }
                    else if (value == 4) {
                        dom.parent().html(Msg.modules.dz_man.publicMoney).attr("title", Msg.modules.dz_man.publicMoney);
                    }
                }

                /**
                 * 操作
                 * @param dom
                 * @param value
                 * @param datas
                 */
                function operate(dom, value, datas) {
                    dom.html("");
                    var tag = $('<a class="i18n">' + Msg.detail + '</a>');
                    // tag.attr('permission', "hp_editPoverty");
                    tag.attr('title', Msg.detail);
                    tag.click(function () {
                        $.http.ajax("/pile/getPileDetail", {
                            "serialNumber": datas.serialNumber
                        }, function (data) {
                            if (data.success) {
                            	// 显示桩的基本信息 + 桩的费率设置
                                createPile(data.data, 3);
                            } else {
                                App.alert({
                                    message: data.data ? data.data : ''
                                });
                            }
                        })
                    });
                    var line = $("<spna>/</span>");
                    // line.attr('permission', "hp_editPoverty hp_delPoverty");
                    var pa = datas.onlineStatus > 0 ? Msg.modules.dz_man.offline : Msg.modules.dz_man.online;
                    var message = datas.onlineStatus > 0 ? Msg.modules.dz_man.confirmOffPile : Msg.modules.dz_man.confirmOnPile;
                    var tagD = $('<a class="i18n">' + pa + '</a>');
                    //  tagD.attr('permission', "hp_delPoverty");
                    tagD.attr('title', pa);
                    tagD.click(function () {
                        App.confirm({
                            message: message
                        }, function () {
                            $.http.ajax("/pile/updateOnlineStatus", {
                                id: datas.id
                            }, function (data) {
                                if (data.success) {
                                    App.alert({
                                        message: Msg.operateSuccess
                                    }, function () {
                                        $("#ChargepileTable").GridTableReload();
                                    });
                                } else {
                                    App.alert({
                                        message: Msg.operateFail
                                    });
                                }
                            })
                        })
                    });
                    dom.parent().attr('title', '');
                    dom.append(tag).append(line).append(tagD);
                }

                /**
                 * 添加充电桩
                 *
                 */
                function createPile(data, type) {
                    var title;
                    if (type == 3) {
                        title = Msg.modules.dz_man.pileDetail;
                    }
                    else if (type == 1) {
                        title = Msg.modules.dz_man.add;
                    }
                    else if (type == 2) {
                        title = Msg.modules.dz_man.update;
                    }
                    var paraDlg = App.dialog({
                        id: "pile_moudle",
                        title: title,
                        width: 765,
                        height: 400,
                        buttons: [{
                			id: "dzman_cancel_btn",
                			type:'btn-close',
                			clickToClose:true,
                			text: Msg.cancel
                		},{
                			id: "dzman_pre_step_btn",
                			text: Msg.modules.dz_man.preStep,
                			click: function () {
                				preStep();
                            }
                		},{
                			id: "dzman_next_step_btn",
                			text: Msg.modules.dz_man.nextStep,
                			click: function () {
                				nextStep();
                            }
                		},{
                			id: "dzman_submit_btn",
                			text: Msg.save
                		},{
                			id: "dzman_save_online_btn",
                			text: Msg.modules.dz_man.saveAndOnline
                		}]
                    });
                    paraDlg.loadPage({
                            url: "/modules/dz_man/addPile.html",
                            scripts: ["modules/dz_man/addPile"]
                        }, {'type': type, 'data': data},
                        function () {
                            $("#dzman_pre_step_btn").hide();
                        	$("#dzman_submit_btn").hide();
                        	$("#dzman_save_online_btn").hide();
                        	navigationBarEvent(type);
                        });
                }
                
                /**
                 * 上一步
                 */

                function preStep(type) {
                	type = type || 2;
                	if(type == 2){
                    	$("#dzman_pre_step_btn").hide();
                    	$("#dzman_next_step_btn").show();
                    	$("#dzman_submit_btn").hide();
                    	$("#dzman_save_online_btn").hide();
                	}
                	$("#dzManRateSet").hide();
            		$("#dzManCreatePile").show();
                	$('#navigationBar').find('span[name="dzManCreatePile"]').addClass('checked');
                	$('#navigationBar').find('span[name="dzManRateSet"]').removeClass('checked');
                }
                
                /**
                 * 下一步
                 */

                function nextStep(type) {
                	 var dF = $('#dzMan_form');
                     if (!dF.valid()) {
                         return;
                     }
                	type = type || 2;
                	if(type == 2 || type == 3){
                    	if(type == 2){
                    		$("#dzman_pre_step_btn").show();
                        	$("#dzman_next_step_btn").hide();
                        	$("#dzman_submit_btn").show();
                        	$("#dzman_save_online_btn").show();
                    	}else{
                    		$("#dzman_pre_step_btn").hide();
                        	$("#dzman_next_step_btn").hide();
                        	$("#dzman_submit_btn").hide();
                        	$("#dzman_save_online_btn").hide();
                        	$("#addBtn").hide();
                        	$("#close").hide();
                    	}
                	}
                	$("#dzManCreatePile").hide();
                	$("#dzManRateSet").show();
                	$('#navigationBar').find('span[name="dzManRateSet"]').addClass('checked');
                	$('#navigationBar').find('span[name="dzManCreatePile"]').removeClass('checked');
                }

                /**
                 * 删除充电桩
                 */
                function deletePile() {
                    var ids = [];
                    var selectedRecords = table.GridTableSelectedRecords();
                    if (selectedRecords.length == 0) {
                        App.alert(Msg.atLeastOne);
                        return;
                    }
                    $.each(selectedRecords, function (t, e) {
                        ids.push(e.serialNumber);
                    })
                    App.confirm(Msg.confimeDel, function () {
                        $.http.ajax("/pile/deletePile", {
                            "ids": ids
                        }, function (res) {
                            if (res && res.success) {
                                main.comonErrorFun(Msg.deleteSucceed, function () {
                                	submit();
                                });
                            } else {
                                var message = res.data || Msg.deleteFailed;
                                main.comonErrorFun(message);
                            }
                        }, function () {
                            main.comonErrorFun(Msg.deleteFailed);
                        });
                    })
                }

                /**
                 * 修改充电桩
                 */
                function modifyPile() {
                    var record = table.GridTableSelectedRecords();
                    if (record.length == 0) {
                        App.alert(Msg.choseOne);
                        return;
                    }
                    if (record.length > 1) {
                        App.alert(Msg.choseOne);
                        return;
                    }
                    $.http.ajax("/pile/getPileDetail", {
                        "serialNumber": record[0].serialNumber
                    }, function (res) {
                        if (res && res.success) {
                            createPile(res.data, 2);
                        } else {
                            var message = res.data
                            main.comonErrorFun(message);
                        }
                    }, function () {

                    });
                }
                function navigationBarEvent(type){
                	if(type == 3 || type == 2){
                		$('#navigationBar').find('span').addClass('toMdf');
                    	// 基本信息
                        $('#pileInfo').off('click').on('click',function(){
                        	preStep(type);
                        });
                        //费率设置
                        $('#rateSet').off('click').on('click',function(){
                        	nextStep(type);
                        });
                	}else{
                		$('#navigationBar').find('span').removeClass('toMdf');
                    	$('#navigationBar').find('span').off('click');
                	}
                }
            });
        }
    };
    return dz_man;
});