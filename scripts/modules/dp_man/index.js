'use strict';
App.Module.config({
    package: '/dp_man',
    moduleName: 'dp_man',
    description: '模块功能：站点管理',
    importList: ['jquery', 'bootstrap', 'easyTabs','ValidateForm', 'GridTable','iemsInputTree','dynamic']
});
App.Module('dp_man', function () {
    var dpMan = {
        Render: function (params) {
        	//设置背景色
            main.setBackColor();
            var _this = this;
            //初始化 条件操作按钮
            dpMan.initSearch(dpMan.queryStations);
            //初始化 表格数据
        },
       //查询站点数据数据
        queryStations:function(){
        	var parm = {};
        	var areaid = $("#station_area").dynamic('dynamicSelected');
        	if(areaid && !$.isEmptyObject(areaid)){
        		parm.queryParms = {"administrativeAreaId":areaid[0]};
        	}
            $('#dp_man_table').GridTable({
                url: 'station/list',
                params: parm,
                title: false,
                clickSelect: true,
                idProperty: 'id',
                isRecordSelected: true,//跨页选择
                isSearchRecordSelected: false,
                max_height: '575',
                colModel: [
                    {
                        display: Msg.modules.dp_man.table.stationName,
                        name: 'name',
                        width: 0.2,
                        sortable: false,
                        align: 'center'
                    },
                    {
                        display: Msg.modules.dp_man.table.stationPic,
                        name: 'picUrl',
                        width: 0.1,
                        sortable: false,
                        align: 'center',
                        fnInit:dpMan.picFormatter
                    },
                    {
                        display: Msg.modules.dp_man.table.stationArea,
                        name: 'domainName',
                        width: 0.1,
                        sortable: true,
                        align: 'center'
                    },
                    {
                        display: Msg.modules.dp_man.table.stationAddr,
                        name: 'address',
                        width: 0.1,
                        sortable: false,
                        align: 'center'
                    },
                    {
                        display: Msg.modules.dp_man.table.powerRate,
                        name: 'powerRate',
                        width: 0.1,
                        sortable: false,
                        align: 'center'
                    },
                    {
                        display: Msg.modules.dp_man.table.parkMoney,
                        name: 'parkMoney',
                        width: 0.1,
                        sortable: false,
                        align: 'center'
                    },
                    {
                        display: Msg.modules.dp_man.table.serveMoney,
                        name: 'serveMoney',
                        width: 0.1,
                        sortable: true,
                        align: 'center'
                    },
                    {
                        display: Msg.modules.dp_man.table.stationOwner,
                        name: 'stationOwner',
                        width: 0.1,
                        sortable: true,
                        align: 'center'
                    },
                    {
                        display: Msg.modules.dp_man.table.onlineTime,
                        name: 'id',
                        width: 0.1,
                        sortable: true,
                        align: 'center',
                        fnInit:function(element, value, datas){
                        	var b = datas.businesStartHours;
                        	var e = datas.businesEndHours;
                        	if(b){
                        		b = (Date.parse(b)).format(Msg.dateFormat.HHmmss);
                        	}
                        	if(e){
                        		e = (Date.parse(e)).format(Msg.dateFormat.HHmmss);
                        	}
                        	var val = b+"-"+e;
                        	element.html(val);
                        	element.attr('title',val);
                        }
                    }
                ]
            }); 
        },
        fsubmit:function(){
            var serachParam = {};
            
            var areaid = $("#station_area").dynamic('dynamicSelected');
        	if(areaid && !$.isEmptyObject(areaid)){
        		serachParam.queryParms = {"administrativeAreaId":areaid[0]};
        	}
//            var id = $("#station_area").attr("treeSelId");
//            if (id) {
//
//                serachParam.queryParms = {"administrativeAreaId": id};
//            }
            $('#dp_man_table').GridTableSearch({
                params: serachParam
            })
        },
        //图片显示
        picFormatter: function(element, value, datas){
            var dom = $("<img/>");
            if(value){
                var url = "/fileManager/downloadThumbnail?fileId="+value+"&serviceId=1&time=" + new Date().getTime();
                dom.attr('src',url).attr("height","60px").attr("width","95%").attr("border","0 none");
            }else{
                dom = '';
            }
            element.html(dom);
            if(dom != '' && dom){
                dom.error(function(){
                    element.html('');
                });
            }
            element.removeAttr("title");
            element.parent().removeAttr("title");
        },
        //打开新加或修改站点信息列表
        openStation:function(isMdf){
        	var title = Msg.add;
        	var data = null;
        	if(isMdf){
        		title = Msg.update;
        		data =  $('#dp_man_table').GridTableSelectedRecords();
        		if(!data || data.length>1 || data.length<=0){
        			main.comonErrorFun(Msg.choseOne);
        			return;
        		}
        	}
        	var paraDlg = App.dialog({
            id : "add_station_view",
				title: title,
				width: 700,
				height: 550,
				buttons: [{
        			id: "cancel",
        			type:'btn-close',
        			clickToClose:true,
        			text: Msg.cancel
        		},{
        			id: "add_station_save",
        			text: Msg.save
        		}]
			});
			paraDlg.loadPage({
				url: "/modules/dp_man/addStation.html",
				scripts: ["modules/dp_man/addStation"]
			}, {'isMdf':isMdf,"data":data,'callback':dpMan.queryStations}, 
			function () {
			});	
        },
        //删除站点
        delStation : function(){
        	var arr = [];
        	var selects = $('#dp_man_table').GridTableSelectedRecords();
        	if(selects && selects.length>0){
        		$.each(selects,function(t,e){
        			arr.push(e.id);
        		});
        	}
        	if(!arr || arr.length<=0){
        		main.comonErrorFun(Msg.atLeastOne);
                return;
    		}
        	App.confirm({
                message: Msg.confimeDel
            }, function () {
            	$.http.ajax("/station/del", {
            		"ids": arr
            	}, function (res) {
            		if(res && res.success){
            			main.comonErrorFun(Msg.deleteSucceed,function(){
            				dpMan.queryStations();
            			});
            		}else{
            			var message = res.data || Msg.deleteFailed;
            			main.comonErrorFun(message);
            		}
                },function(){
                	main.comonErrorFun(Msg.deleteFailed);
                });
            });
        },
        initSearch: function(callBack){
        	$("#dp_man_bar").ValidateForm('dp_man_bar', {
                show: 'horizontal',
                fnSubmit: dpMan.fsubmit,
                model: [
                    [
                        {
	                        input : 'input',
	                        type : 'text',
	                        show :  Msg.modules.dp_man.search.selectArea,//'电站选择',
	                        name : 'station_area',
	                        width: '165',
	                        extend : {
	                            id : 'station_area',
	                            readonly: true
	                        },
	                        fnInit: function(dom){
	                        	$(dom).dynamic({
	                                chStyle:'radio',
	                                url:'domain/queryUserDomains',
	                                formatNode:function(node){
	                                	if(node.id == 1){
	                                		return null;
	                                	}
	                                	return node;
	                                },
	                                protoSeachParent:true,
	                                onePageloadAfter:callBack
	                            });
	                        }
	                     }
                    ]
                ],
                extraButtons: [
                   {
                       input: 'button',
                       align: 'right',
                       show: Msg.add,
                       name: '',
                       fnClick: function(){
                    	   dpMan.openStation();
                       },
                       extend: {
                           id : 'add_station',
                           class: 'btn btn-add'
                          // permission: "rm_cn_exportReport"
                       }
                   },
                   {
                       input: 'button',
                       align: 'right',
                       show: Msg.update,
                       name: '',
                       fnClick: function(){
                    	   dpMan.openStation(true);
                       },
                       extend: {
                           id : 'mdf_station',
                           class: 'btn btn-mdf'
                          // permission: "rm_cn_exportReport"
                       }
                   },
                   {
                       input: 'button',
                       align: 'right',
                       show: Msg.del,
                       name: '',
                       fnClick: function(){
                    	   dpMan.delStation();
                       },
                       extend: {
                           id : 'del_station',
                           class: 'btn btn-del'
                          // permission: "rm_cn_exportReport"
                       }
                   }
               ]
           });
            $('#dp_man_bar').find('#add_station').parents('.clsRow').css({float: 'right'});
        }
    };
    return dpMan;
});