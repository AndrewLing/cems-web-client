App.Module.config({
    package: '/rc_order',
    moduleName: 'rc_order',
    description: '模块功能：订单管理',
    importList: ['jquery', 'bootstrap', 'easyTabs', 'ValidateForm', 'GridTable', 'datePicker','dynamic']
});
App.Module('rc_order', function () {
    var isSerach = false;
    var orderDevSelect;
    var rcOrder = {
        Render: function (params) {
            //设置背景色
            main.setBackColor();
            //初始化 搜索框
            rcOrder.initSearch();
            //初始化 搜索框
            rcOrder.queryOrders();

        },
        //订单查询
        queryOrders: function () {
            var parma= rcOrder.getParms();
            var table = $('#OrderTable').GridTable({
                url: 'order/pageList',
                params: parma,
                idProperty: 'id',
                isRecordSelected: true,//跨页选择
                isSearchRecordSelected: false,
                max_height: '575',
                colModel: [{
                    display: Msg.modules.rc_order.orderSerialNumber,
                    name: 'orderNumber',
                    width: 0.15,
                    sortable: false,
                    align: 'center'
                },{
                    display: Msg.modules.rc_order.chargeSerialNumber,
                    name: 'pileSerialNumber',
                    width: 0.15,
                    sortable: false,
                    align: 'center'
                }, {
                    display: Msg.modules.rc_order.orderCreateTime,
                    name: 'createTime',
                    width: 0.1,
                    sortable: false,
                    align: 'center',
                    fnInit:rcOrder.initDateTime
                }, {
                    display: Msg.modules.rc_order.chargeCard,
                    name: 'cardNumber',
                    width: 0.1,
                    sortable: true,
                    align: 'center'
                }, {
                    display: Msg.modules.rc_order.serialNumber,
                    name: 'serialNumber',
                    width: 0.1,
                    sortable: false,
                    align: 'center'

                }, {
                    display: Msg.modules.rc_order.createStation,
                    name: 'stationName',
                    width: 0.1,
                    sortable: false,
                    align: 'center'

                }, {
                    display: Msg.modules.rc_order.chargePower,
                    name: 'chargePower',
                    width: 0.1,
                    sortable: false,
                    align: 'center'

                }, {
                    display: Msg.modules.rc_order.chargePowerMoney,
                    name: 'chargePowerMoney',
                    width: 0.05,
                    sortable: false,
                    align: 'center'

                }, {
                    display:  Msg.modules.rc_order.chargeServiceMoney,
                    name: 'chargeServiceMoney',
                    width: 0.1,
                    sortable: false,
                    align: 'center'

                }, {
                    display: Msg.operate,
                    name: 'id',
                    width: 0.05,
                    sortable: false,
                    align: 'center',
                    fnInit: function (element, value, data) {
                        var div = $('<div>');
						var msg = Msg.modules.rc_order.detail;
						div.append('<a>'+msg+'</a>');
						div.attr('title',msg);
						div.off('click').on('click',function(){
							rcOrder.loadDetail(data);
						});
						element.html(div);
                    }

                }]
            });
        },
        /**
         * 打开订单详情页面
         * @param data
         */
        loadDetail:function(data){
            var detailDialog = App.dialog({
                id: "order_detail_moudle",
                title: Msg.modules.rc_order.orderDetail,
                width: 500,
                height: 440
            });
            detailDialog.loadPage({
                    url: "/modules/rc_order/viewOrder.html",
                    scripts: ["modules/rc_order/viewOrder"]
                }, {'data': data},
                function () {

                });
        },
        dsubmit: function () {
            isSerach = true;
            $('#OrderTable').GridTableSearch({
                params:rcOrder.getParms()
            })
        },
        getParms : function(){
        	var parma = {};
        	var sTimsStr = $('#order_start').val();
        	var eTimsStr = $('#order_end').val();
        	if(sTimsStr){
        		parma.orderStart = Date.parse(sTimsStr,Msg.dateFormat.yyyymmddhhss).getTime();
        	}
        	if(eTimsStr){
        		parma.orderEnd = Date.parse(eTimsStr,Msg.dateFormat.yyyymmddhhss).getTime();
        	}
            var stations = $('#order_station_select').dynamic('dynamicSelected');
        	var devs = $('#order_dev_select').dynamic('dynamicSelected');
        	if(devs && devs.length>0){
        		parma.devs = devs;
        	}else if(stations && stations.length>0){
        		parma.stations = stations;
        	}
        	var parm = {};
        	parm.queryParms = parma;
        	return parm;
        },
        //初始化 搜索框
        initSearch: function () {
            //初始化 条件操作按钮
            $("#rcOrderBar").ValidateForm('rc_order_bar', {
                show: 'horizontal',
                fnSubmit: rcOrder.dsubmit,
                model: [[
					{
						input : 'input',
						type : 'text',
						show : Msg.modules.rc_order.stationList,
						name : 'stations',
						width : '165',
						extend : {
							id : 'order_station_select'
						}
					},
					{
						input : 'input',
						type : 'text',
						show : Msg.modules.rc_order.devList,
						name : 'devs',
						width : '165',
						extend : {
							id : 'order_dev_select'
						}
					},
                    {
                        input: 'input',
                        type: 'text',
                        show: Msg.timeField,
                        name: 'order_start',
                        width: 185,
                        extend: {class: 'Wdate', readonly: 'readonly', id: 'order_start'},

                        fnClick: rcOrder.orderDateStart
                    },
                    {
                        input: 'input',
                        type: 'text',
                        show: Msg.to,
                        name: 'order_end',
                        width: 185,
                        extend: {class: 'Wdate', readonly: 'readonly', id: 'order_end'},
                        fnClick: rcOrder.orderDateEnd
                    }
                ]],
                extraButtons: [{
                    input: 'button',
                    align: 'right',
                    show: Msg.exportPo,
                    name: '',
                    fnClick: function () {
                        rcOrder.export();
                    },
                    extend: {
                        id: 'export_order',
                        class: 'btn btn-export'
                        // permission: "rm_cn_exportReport"
                    }
                }]
            });

            $('#rcOrderBar').find('#export_order').parents('.clsRow').css({
                float: 'right'
            });
//            //初始化站点列表
            $('#order_station_select').dynamic({
                url: 'station/list',
                chStyle:'checkbox',
                urlToProtoType:false,
                checkCallBack:function(){
                	$('#order_dev_select').dynamic("toCheckedAll",false);
                }
            });
            $('#order_dev_select').dynamic({
                url: 'pile/listPile',
                chStyle:'checkbox',
                isRepeatClickLoad:true,
                urlToProtoType:false,
                beforeQueryParms:function(parm,name){
                	var map = {};
                	map.serialNumber = name;
                	var stationIds = $('#order_station_select').dynamic('dynamicSelected');
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
                	var r = false;
                	if(!oldParm || $.isEmptyObject(oldParm)){
                		r = true;
                	}
                	if(!$.isEmptyObject(oldParm) && (omap.serialNumber!=nmap.serialNumber
                			 || !(JSON.stringify(oarr.sort()) === JSON.stringify(narr.sort())))){
                		newParm.page = 1;
                		r = true;
                	}
                	if(!$.isEmptyObject(oldParm) && oldParm.page!=newParm.page){
                		r = true;
                	}
                	return r;
                },
                formatNode:function(node){
                	node.name = node.serialNumber;
                	node.pid = node.stationId;
                	node.id = node.serialNumber;
                	return node;
                }
            });
        },
        orderDateStart: function () {
            DatePicker({
                dateFmt: Msg.dateFormat.yyyymmddhhss,
                maxDate: $("#order_end").val(),
                isShowClear: true
            });
        },
        orderDateEnd: function () {
            DatePicker({
                dateFmt: Msg.dateFormat.yyyymmddhhss,
                minDate: $("#order_start").val(),
                isShowClear: true
            });
        },

        initDateTime:function(dom){
            var longTime = $.trim($(dom).text());
            var time = longTime && Date.parse(longTime).format('yyyy-MM-dd hh:mm:ss').replace(/-/g, '-');
            $(dom).parent().attr("title",time);
            $(dom).html(time);

        },
        /**
         * 导出
         */
        export: function () {
            var parm = rcOrder.getParms();
            $('#rc_order').find('#order_param').val(JSON.stringify(parm));
			$('#rc_order').find('#order_exort_form').submit();

        }
    };
    return rcOrder;
});