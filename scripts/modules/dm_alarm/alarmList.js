'use strict';
App.Module.config({
    package: '/dp_alarm',
    moduleName: 'alarmList',
    description: '模块功能：告警管理',
    importList: ['jquery', 'bootstrap', 'GridTable','dynamic','ValidateForm']
});
App.Module('alarmList', function () {
	var type  = 'trouble';
	var sinfo = Msg.modules.dm_alarm.alarmList.table.dfinfo; 
	var title = Msg.modules.dm_alarm.table.fault;
    var alarmList = {
        Render: function (params) {
        	//设置背景色
        	main.setBackColor();
        	alarmList.initSearch();
        	var id = $('.active')[0].id;
        	if("faultButton" === id){
        		type  = 'trouble';//故障
        		title = Msg.modules.dm_alarm.table.fault;
        		sinfo = Msg.modules.dm_alarm.alarmList.table.dfinfo; 
        	}else if('alarmButton' === id){
        		type = 'alarm';//告警
        		title = Msg.modules.dm_alarm.table.alarm;
        		sinfo = Msg.modules.dm_alarm.alarmList.table.dainfo; 
        	}else if('protectButton' === id){
        		type = 'protect';//保护
        		title = Msg.modules.dm_alarm.table.protect;
        		sinfo = Msg.modules.dm_alarm.alarmList.table.dpinfo; 
        	}
        	$('#alarmListTitle').html(title);
        	//查询告警数据
            alarmList.queryAlarms();
        },
        //format 时间格式
        formatDate : function(dom, value, record){
        	if (value) {
				var raiseDate = new Date(value);
				dom.html(raiseDate.format(Msg.dateFormat.yyyymmddhhss));
				dom.parents("td").attr("title", raiseDate.format(Msg.dateFormat.yyyymmddhhss));
			}
        },
        //初始化查询框
        initSearch : function(){
        	$("#alarmListBar").ValidateForm('alarm_list_bar', {
				show : 'horizontal',
				fnSubmit : alarmList.searchAlarms,
				model : [ [ {
					input : 'input',
					type : 'text',
					show : Msg.modules.dm_alarm.alarmList.table.stationList,
					name : 'stations',
					width : '165',
					extend : {
						id : 'alarm_station_select'
					}
				},
				{
					input : 'input',
					type : 'text',
					show : Msg.modules.dm_alarm.alarmList.table.devList,
					name : 'devs',
					width : '165',
					extend : {
						id : 'alarm_dev_select'
					}
				},
				{
                    input: 'select',
                    type: 'select',
                    show: Msg.modules.dm_alarm.alarmList.table.status,
                    options: [
                        {text: Msg.modules.dm_alarm.alarmList.table.active, value: "1"},
                        {text: Msg.modules.dm_alarm.alarmList.table.recover, value: "2"}
                    ],
                    name: 'run_time_dimension',
                    extend: {id: 'alarm_status_select'}
                }] ]
			});
        	$('#alarm_station_select').dynamic({
                url: 'station/list',
                chStyle:'checkbox',
                urlToProtoType:false,
                checkCallBack:function(){
                	$('#alarm_dev_select').dynamic('toCheckedAll',false);
                }
            });
        	$('#alarm_dev_select').dynamic({
                url: 'pile/listPile',
                chStyle:'checkbox',
                isRepeatClickLoad:true,
                urlToProtoType:false,
                beforeQueryParms:function(parm,name){
                	var map = {};
                	map.serialNumber = name;
                	var stationIds = $('#alarm_station_select').dynamicSelected();
                	if(stationIds && stationIds.length>0){
                		map.stationIds = stationIds;
                	}
                	parm.queryParms = map;
                	return parm;
                },
                checkParmIsToLoad:function(oldParm,newParm){
                	var omap = oldParm && oldParm.queryParms || {};
                	var nmap = newParm && newParm.queryParms || {};
                	var oarr = omap.stationIds || [];
                	var narr = nmap.stationIds || [];
                	if(!oldParm || omap.serialNumber!=nmap.serialNumber || 
                		!(JSON.stringify(oarr.sort()) === JSON.stringify(narr.sort()))){
                		return true;
                	}
                	return false;
                },
                formatNode:function(node){
                	node.name = node.serialNumber;
                	node.pid = node.stationId;
                	node.id = node.serialNumber;
                	return node;
                }
            });
        },
        //查询告警
        searchAlarms : function(){
        	$('#alarmListTable').GridTableSearch({params:alarmList.getParms()});
        },
        //获取参数
        getParms : function(){
        	var map = {};
        	//只查活动
        	map.status = $('#alarm_status_select').val();
        	map.defectType = type;
        	var parm = {};
        	var stations = $('#alarm_station_select').dynamicSelected();
        	var devs = $('#alarm_dev_select').dynamicSelected();
        	if(devs && devs.length>0){
        		map.devs = devs;
        	}else if(stations && stations.length>0){
        		map.stations = stations;
        	}
        	parm.queryParms = map;
        	console.info(parm);
        	return parm;
        },
       //查询告警数据
        queryAlarms:function(){
        	var parm = alarmList.getParms();
            $('#alarmListTable').GridTable({
                url: 'alarm/list',
                params: parm,
                title: false,
                clickSelect: true,
                idProperty: 'id',
                isRecordSelected: true,//跨页选择
                isSearchRecordSelected: false,
                max_height: '575',
                colModel: [
					{
					    display:  Msg.modules.dm_alarm.alarmList.table.chargePileNumer,
					    name: 'serialNumber',
					    width: 0.2,
					    sortable: true,
					    align: 'center'
					},
                    {
                        display: Msg.modules.dm_alarm.alarmList.table.cccurrenceTime,
                        name: 'occurTime',
                        width: 0.2,
                        sortable: false,
                        align: 'center',
                        fnInit:alarmList.formatDate
                    },
                    {
                        display: Msg.modules.dm_alarm.alarmList.table.recoverTime,
                        name: 'recoveryTime',
                        width: 0.2,
                        sortable: false,
                        align: 'center',
                        fnInit:alarmList.formatDate
                    },
                    {
                        display:  Msg.modules.dm_alarm.alarmList.table.chargeStatioName,
                        name: 'statioName',
                        width: 0.2,
                        sortable: false,
                        align: 'center'
                    },
                    {
                        display:sinfo,
                        name: 'dinfo',
                        width: 0.2,
                        sortable: false,
                        align: 'center'
                    }
                ]
            }); 
        }
    };
    return alarmList;
});