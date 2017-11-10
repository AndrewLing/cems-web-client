App.Module.config({
    package: '/dr_hisdata',
    moduleName: 'dr_hisdata',
    description: '模块功能：历史数据',
    importList: ['jquery', 'bootstrap', 'easyTabs','ValidateForm', 'GridTable','datePicker','iemsInputTree','ValidataOwner']
});
App.Module('dr_hisdata', function () {
    var isSerach = false;
    var drHisdata = {
        Render: function (params) {
        	//设置背景色
       	   main.setBackColor();
       	 //初始化 搜索框
       	   drHisdata.initSearch();
       	 //初始化 表格数据
       	   drHisdata.queryHisDatas();
        },
        queryHisDatas : function(){
            var parma = drHisdata.fGetdata();
        	$('#drHisdataTable').GridTable({
                url: 'chargeHistory/list',
                params: parma,
                title: false,
                fnSubmit:drHisdata.fSubmit,
                //clickSelect: true,
                //idProperty: 'id',
                //isRecordSelected: true,//跨页选择
                //isSearchRecordSelected: false,

                max_height: '575',
                colModel: [
                    {
                        display: Msg.modules.dr_hisdata.station,
                        name: 'stationName',
                        width: 0.1,
                        sortable: false,
                        align: 'center'
                    },
                    {
                        display: Msg.modules.dr_hisdata.serialNumber,
                        name: 'serialNumber',
                        width: 0.15,
                        sortable: false,
                        align: 'center'
                    },
                    {
                        display: Msg.modules.dr_hisdata.gunNumber,
                        name: 'gunNumber',
                        width: 0.1,
                        sortable: true,
                        align: 'center'
                    },
                    {
                        display: Msg.modules.dr_hisdata.cardNumber,
                        name: 'cardNumber',
                        width: 0.15,
                        sortable: false,
                        align: 'center'
                    },
                    {
                        display: Msg.modules.dr_hisdata.chargeStime,
                        name: 'chargeStime',
                        width: 0.1,
                        sortable: false,
                        align: 'center',
                        fnInit:function(dom,value){
                            if (value && value != null) {
                                var time = Date.parse($.trim($(dom).text())).format('yyyy-MM-dd hh:mm:ss').replace(/-/g, '-');
                                $(dom).html(time);
                                $(dom).parent().attr('title', time);
                            }
                        }
                    },
                    {
                        display: Msg.modules.dr_hisdata.chargeEtime,
                        name: 'chargeEtime',
                        width: 0.1,
                        sortable: false,
                        align: 'center',
                        fnInit:function(dom,value){
                            if (value && value != null) {
                                var time = Date.parse($.trim($(dom).text())).format('yyyy-MM-dd hh:mm:ss').replace(/-/g, '-');
                                $(dom).html(time);
                                $(dom).parent().attr('title', time);
                            }
                        }
                    },
                    {
                        display:  Msg.modules.dr_hisdata.chargePower,
                        name: 'chargePower',
                        width: 0.1,
                        sortable: true,
                        align: 'center'
                    },
                    {
                        display:  Msg.modules.dr_hisdata.chargeServeMoney,
                        name: 'chargeServeMoney',
                        width: 0.1,
                        sortable: true,
                        align: 'center'
                    },
                    {
                        display: Msg.modules.dr_hisdata.chargeMoney,
                        name: 'chargeMoney',
                        width: 0.1,
                        sortable: true,
                        align: 'center',
                        fnInit:function(element, value, datas){

                        }
                    }
                ]
            }); 
        },
      //初始化 搜索框
		initSearch : function(){
			//初始化 条件操作按钮
			$("#drHisdataBar").ValidateForm('dr_hisdata_bar', {
				show : 'horizontal',
				fnSubmit : drHisdata.fSubmit,
				model : [ [ {
					input : 'input',
					type : 'text',
					show :  Msg.modules.dr_hisdata.chargeStation,
					name : 'areas',
					width : '165',
					extend : {
						id : 'stations_search'
					},
                    fnClick:drHisdata.chooseStation
				},
				{
					input : 'input',
					type : 'text',
					show : Msg.modules.dr_hisdata.serialNumber,
					name : 'devs',
					width : '165',
					extend : {
						id : 'hisdata_dev_select'
					}
				},
				{
					input : 'input',
					type : 'text',
					show : Msg.modules.dr_hisdata.cardNumber,
					name : 'areas',
					width : '165',
					extend : {
						id : 'carNumber_search'
					}
				},
				{
					input : 'input',
					type : 'text',
					show : Msg.modules.dr_hisdata.chargeStime,
					name : 'time',
					width : '185',
					extend : {
						id : 'start_time',class: 'wdateIcon hisData', readonly: 'readonly'
                        
					},
					fnClick:drHisdata.bindTimeSeachClick
				},
				{
					input : 'input',
					type : 'text',
					show : Msg.modules.dr_hisdata.chargeEtime,
					name : 'time',
					width : '185',
					extend : {
						id : 'end_time',class: 'wdateIcon hisData', readonly: 'readonly'
					},
					fnClick:drHisdata.bindTimeSeachClick
				}] ],
				extraButtons : [ {
					input : 'button',
					align : 'right',
					show : Msg.exportF,
					name : '',
					fnClick : function() {
                        var param={};
                        if (isSerach) {
                             param = drHisdata.fGetdata();
                        }
                        else{
                            param = {
                                'sIds': '',
                                'cardNumber': '',
                                'chargeStartTime': '',
                                'chargeEndTime': '',
                                'pileNumber':''
                            };
                        }
					 window.open("chargeHistory/export?sIds=" + param.sIds + "&cardNumber=" +param.cardNumber +"&chargeStartTime="+param.chargeStartTime+"&chargeEndTime="+param.chargeEndTime+"&pileNumber="+ param.pileNumber  , "_parent")
					},
					extend : {
						id : 'hisData_export',
						class : 'btn btn-export'
					// permission: "rm_cn_exportReport"
					}
				}]
			});

			$('#drHisdataBar').find('#hisData_export').parents('.clsRow').css({
				float : 'right'
			});
		},
        fGetdata:function(){
            var parma = {
                'sIds':$('#stations_search').attr('treeselid')?$('#stations_search').attr('treeselid'):null,
                'cardNumber': $('#carNumber_search').val(),
                'chargeStartTime': $('#start_time').val(),
                'chargeEndTime': $('#end_time').val(),
                'pileNumber':$('#hisdata_dev_select').val()
            };
            return parma;
        },

        fSubmit:function(){
            isSerach = true;
            $('#drHisdataTable').GridTableSearch({
                params: drHisdata.fGetdata()
            });
        },

		bindTimeSeachClick : function(selector){
			window.DatePicker({
                dateFmt: "yyyy-MM-dd HH:mm:ss",
                isShowClear: true,
                maxDate:new Date()
            });
		},
        /**
         * 选择站点
         */
        chooseStation:function(){
                $(this).iemsInputTree({
                    url: 'domain/queryUserDomainStaRes',
                    checkStyle: "checkbox",
                    textFiled: "name",
                    ajaxBefore: true,
                    isPromptlyInit: true,
                    treeNodeFormat: function (nodes) {
                        var n = nodes.length;
                        while(n--){
                            var e = nodes[n];
                            if(e.id == 1 || e.id == '1'){
                                nodes.splice(e,1);
                            }
                            if (e.model == "STATION") {
                                e.icon = "/images/main/sm_domain/nodeStation.png";
                            }
                            else if((e.model).indexOf("DOMAIN")>=0) {
                                e.chkDisabled = true;
                            }
                            e.name = main.getTopDomianName(e.name);
                        }
                        return nodes;
                    },
                    treeNodeCreate: function (node) {
                        node.name = main.getTopDomianName(node.name);
                        if (node.model != "STATION") {
                            node.isParent = true;
                        }
                    }
            });
        }
    };
    return drHisdata;
});