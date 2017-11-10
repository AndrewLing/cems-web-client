'use strict';
App.Module.config({
    package: '/dm_alarm',
    moduleName: 'dm_alarm',
    description: '模块功能：故障和告警',
    importList: ['jquery', 'bootstrap', 'easyTabs']
});
App.Module('dm_alarm', function () {
    var dmAlarm = {
        Render: function (params) {
        	//设置背景色
       	   main.setBackColor();
	       	$(function () {
	            var $switch = $('#dm_alarm');
	            dmAlarm.loadView($switch);
	        });
        },
        loadView:function(context){
        	context.easyTabs({
                tabIds: ['faultButton', 'alarmButton','protectButton'],
                tabSpace: 0,
                useNavbar:true,
                tabNames: [Msg.modules.dm_alarm.table.fault,Msg.modules.dm_alarm.table.alarm,Msg.modules.dm_alarm.table.protect],
//                permissions:['station_kpi','station_map'],
                urls: ['/modules/dm_alarm/alarmList.html', '/modules/dm_alarm/alarmList.html','/modules/dm_alarm/alarmList.html'],
                scripts: [['modules/dm_alarm/alarmList'], ['modules/dm_alarm/alarmList'],['modules/dm_alarm/alarmList']],
                cb: function () {
                }
            });
        }
    };
    return dmAlarm;
});