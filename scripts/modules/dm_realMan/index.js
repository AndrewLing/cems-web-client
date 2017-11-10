'use strict';
App.Module.config({
    package: '/dm_realMan',
    moduleName: 'dm_realMan',
    description: '模块功能：实时监控',
    importList: ['jquery', 'bootstrap', 'easyTabs', 'ValidateForm', 'GridTable']
});
App.Module('dm_realMan', function () {
    var dmRealMan = {
        Render: function (params) {
            //设置背景色
            main.setBackColor();
            //初始化 搜索框
            dmRealMan.initSearch();
            //查询表格数据
            dmRealMan.queryRealDatas();
        },
        //查询表格数据
        queryRealDatas: function () {
        	
        	var p = {};
            var param = {'serialNumber': $("#pile_search").val()};
            p={'queryParms':param};
            
            $('#dmRealManTable').GridTable({
                url: 'pile/listPile',
                params: p,
                title: false,
                idProperty: 'serialNumber',
                isRecordSelected: true,//跨页选择
                isSearchRecordSelected: false,
                max_height: '575',
                colModel: [
                    {
                        display: '编号',
                        name: 'serialNumber',
                        width: 0.2,
                        sortable: false,
                        align: 'center',
                        fnInit: function (element, value, datas) {
                            var div = $('<div>');
                            var a = $('<a>').css('border-bottom','1px solid');
                            a.html(value);
                            div.append(a);
                            div.off('click').on('click', function () {
                                var paraDlg = App.dialog({
                                    id: "dm_RealMan_gunMon",
                                    title: '枪口监控',
                                    width: 1200,
                                    height: 700,
                                    closeEvent:function(){
                                    	$.fn.stopPush("ChargeGunWs");
                                    }
                                });
                                paraDlg.loadPage({
                                    url: "/modules/dm_realMan/gunMonitor.html",
                                    scripts: ["modules/dm_realMan/gunMonitor"]
                                }, {
                                    "serialNumber": value
                                }, function () {
                                });
                            });
                            element.html(div);
                        }
                    },
                    {
                        display: '所属站点',
                        name: 'statioName',
                        width: 0.2,
                        sortable: false,
                        align: 'center'
                    },
                    {
                        display: '设备类型',
                        name: 'deviceType',
                        width: 0.12,
                        sortable: true,
                        align: 'center',
                        fnInit: function (dom, value, data) {
                        	var val = value;
                            if (value == 1) {
                            	val = Msg.zlkc;
                            } else if (value == 2) {
                            	val =  Msg.zlmc;
                            } else if (value == 3) {
                            	val =  Msg.jlkc;
                            } else if (value == 4) {
                            	val =  Msg.jlmc;
                            } else if (value == 5) {
                            	val =  Msg.jzlhh;
                            }
                            $(dom).text(val);
                            $(dom).attr('title',val);
                            return val;
                        }
                    },
                    {
                        display: '运营类型',
                        name: 'businessType',
                        width: 0.2,
                        sortable: false,
                        align: 'center',
                        fnInit:function(dom,value){
                        	var val = value;
                            if (value == 1) {
                            	val = Msg.privateNotOpen;
                            } else if (value == 2) {
                            	val = Msg.privateOpen;
                            } else if (value == 3) {
                            	val = Msg.publicFree;
                            } else if (value == 4) {
                            	val = Msg.publicMoney;
                            }
                            $(dom).text(val);
                            $(dom).attr('title',val);
                            return val;
                        }
                    },
                    {
                        display: '经纬度',
                        name: 'lonAdnLat',
                        width: 0.14,
                        sortable: false,
                        align: 'center',
                        fnInit: function (dom, value, datas) {
                        	var val = "";
                            if(datas.longitude && datas.latitude){
                            	val = parseFloat(datas.longitude.fixed(3)).toFixed(3)+","+   parseFloat(datas.latitude.fixed(3)).toFixed(3);
                            }
                            $(dom).text(val);
                            $(dom).attr('title',val);
                            return val;
                        }
                    },
                    {
                        display: '设备ip',
                        name: 'ipAddress',
                        width: 0.14,
                        sortable: true,
                        align: 'center'
                    }
                ]
            });
        },

        submit:function(){
            var param = {
                'serialNumber': $("#pile_search").val()
            };
            $('#dmRealManTable').GridTableSearch({
                params: {'queryParms':param}
            })
        },
        //初始化 搜索框
        initSearch: function () {
            //初始化 条件操作按钮
            $("#dmRealManBar").ValidateForm('dm_realMan_bar', {
                show: 'horizontal',
                fnSubmit: dmRealMan.submit,
                model: [[{
                    input: 'input',
                    type: 'text',
                    show: "充电桩编号：",
                    name: 'areas',
                    width: '165',
                    extend: {
                        id: 'pile_search'
                    }
                }]]
            });
        }
    };
    return dmRealMan;
});