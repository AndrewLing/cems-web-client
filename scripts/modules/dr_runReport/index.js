App.Module.config({
    package: '/dr_runReport',
    moduleName: 'dr_runReport',
    description: '模块功能：运行报表',
    importList: ['jquery', 'bootstrap', 'easyTabs','ValidateForm', 'GridTable','ECharts','zTree', 'zTree.excheck', 'zTree.exedit', 'zTree.exhide','datePicker']
});
App.Module('dr_runReport', function () {
	var curTableData = null;
	var arrTabele = [Msg.modules.dr_runReport.domainName,Msg.modules.dr_runReport.stationCounts,
	                    Msg.modules.dr_runReport.pileCounts,Msg.modules.dr_runReport.chargPower,
	                    Msg.modules.dr_runReport.chargeServeMoney,Msg.modules.dr_runReport.chargePowerMoney,
	                    Msg.modules.dr_runReport.onePileMoney];
    var curNode = new Map();
	var drRunReport = {
        Render: function (params) {
        	//设置背景色
       	   main.setBackColor();
       	   $(function () {
       		 curNode = new Map();
       		 //初始化 搜索框   //表格生成  图形生成
         	 drRunReport.initSearch(drRunReport.queryRunReports);

       	  });
        },
        getTimeFomat : function(type){
        	var format = Msg.dateFormat.yyyymmdd;
        	switch (type) {
	    		case "day":
	    			format = Msg.dateFormat.yyyymmdd;
	    			break;
	    		case "month":
	    			format = Msg.dateFormat.yyyymm;
	    			break;
	    		case "year":
	    			format = Msg.dateFormat.yyyy;
	    			break;
	    		default:
	    			format = Msg.dateFormat.yyyymmdd;
	    			break;
    		}
        	return format;
        },
        //查询表格数据
        queryRunReports:function(){
        	var parm  = {};
        	parm.queryParms = drRunReport.getParam();
        	$('#drRunReportTable').GridTable({
                url: 'home/runReport',
                params: parm,
                title: false,
                idProperty: 'id',
                isRecordSelected: true,//跨页选择
                isSearchRecordSelected: false,
                loadReady:function(data){
                	//图形生成
                	if(!data){
                		data = {};
                		data.x1 = [""];
                		data.y1 = [""];
                		data.y2 = [""];
                		data.y3 = [""];
                  	    data.pageRs = {};
                  	    data.pageRs.list = [];
                	}else{
                		data.y1 = main.FixedKpi(data.y1);
                    	data.y2 = main.FixedKpi(data.y2);
                    	data.y3 = main.FixedKpi(data.y3);
                  	    data.pageRs.list = main.FixedKpiObj( data.pageRs.list,['chargPower','chargePowerMoney','chargeServeMoney','onePileMoney']);
                	}
                	drRunReport.viweCharts(data);
              	    curTableData = data.pageRs;
                	return curTableData;
                },
                max_height: '575',
                colModel: [
                    {
                        display: arrTabele[0],
                        name: 'domainName',
                        width: 0.2,
                        sortable: false,
                        align: 'center'
                    },
                    {
                        display: arrTabele[1],
                        name: 'stationCounts',
                        width: 0.1,
                        sortable: false,
                        align: 'center'
                    },
                    {
                        display: arrTabele[2],
                        name: 'pileCounts',
                        width: 0.1,
                        sortable: true,
                        align: 'center'
                    },
                    /*{
                        display: '故障个数',
                        name: 'failCount',
                        width: 0.1,
                        sortable: false,
                        align: 'center'
                    },
                    {
                        display: '故障比（%）',
                        name: 'powerRate',
                        width: 0.1,
                        sortable: false,
                        align: 'center'
                    },*/
                    {
                        display: arrTabele[3],
                        name: 'chargPower',
                        width: 0.15,
                        sortable: false,
                        align: 'center'
                    },
                    {
                        display: arrTabele[4],
                        name: 'chargeServeMoney',
                        width: 0.15,
                        sortable: true,
                        align: 'center'
                    },
                    {
                        display: arrTabele[5],
                        name: 'chargePowerMoney',
                        width: 0.15,
                        sortable: true,
                        align: 'center'
                    },
                    {
                        display: arrTabele[6],
                        name: 'onePileMoney',
                        width: 0.15,
                        sortable: true,
                        align: 'center'
                    }
                ]
            }); 
        },
        
        /**
         * 获取参数
         */
        getParam:function(){
        	var map = {};
        	var nodes = drRunReport.getSelectNodes();
        	if(nodes){
        		map.nodes = nodes;
        	}
        	var time = $('#time_search').val();
        	var opt = $("#run_time_dimension option:selected");
        	var format = drRunReport.getTimeFomat(opt.val());
        	if(!time){
        		time  = (Date.parse(new Date().getTime())).format(format);
        	}
        	map.bTime = Date.parse(time,format).getTime();
        	map.type = opt.val();
        	return map;
        },
        
        submit:function(){
        	var pa  = {};
        	pa.queryParms = drRunReport.getParam();
        	$('#drRunReportTable').GridTableSearch({
        		params: pa
        	});
        },
       //初始化 搜索框
		initSearch : function(callBack){
			//初始化 条件操作按钮
			$("#drRunReportBar").ValidateForm('dr_runReport_bar', {
				show : 'horizontal',
				fnSubmit : drRunReport.submit,
				model : [ [ {
					input : 'input',
					type : 'text',
					show : Msg.modules.dr_runReport.areas,
					name : 'areas',
					width : '165',
					extend : {
						id : 'areas_search'
					},
					fnClick:drRunReport.bindAreasSeachClick
				},
				{
                    input: 'select',
                    type: 'select',
                    show: Msg.modules.dr_runReport.dimension,
                    options: [
                        {text: Msg.unit.timeDem[2], value: "day"},
                        {text: Msg.unit.timeDem[1], value: "month"},
                        {text: Msg.unit.timeDem[0], value: "year"}
                    ],
                    name: 'run_time_dimension',
                    extend: {id: 'run_time_dimension'}
                },
				{
						input : 'input',
						type : 'text',
						show : Msg.modules.dr_runReport.selectTime,
						name : 'time',
						width : '165',
						extend : {
							id : 'time_search',class: 'wdateIcon', readonly: 'readonly'
						}
				} ] ],
				extraButtons : [ {
					input : 'button',
					align : 'right',
					show : Msg.exportF,
					name : '',
					fnClick : function() {
						drRunReport.exportData();
					},
					extend : {
						id : 'runReport_export',
						class : 'btn btn-export'
					// permission: "rm_cn_exportReport"
					}
				}]
			});
			//绑定时间点击事件
			drRunReport.bindTimeSeachClick();
			$('#time_search').val((Date.parse(new Date().getTime())).format(drRunReport.getTimeFomat($('#run_time_dimension').val())));
			
			$('#run_time_dimension').off('change').on('change',function(){
				$('#time_search').val((Date.parse(new Date().getTime())).format(drRunReport.getTimeFomat($('#run_time_dimension').val())));
				drRunReport.bindTimeSeachClick();
			});
			
			$('#drRunReportBar').find('#runReport_export').parents('.clsRow').css({
				float : 'right'
			});
			$.http.ajax('/domain/queryUserDomains', {
            }, function (res) {
            	if(res.success){
            		var domains = res.data;
                    var t = $("#domainTrees");
                    var setting = drRunReport.getDomainSetting();
                    var zNodes = main.getAreaNodes(domains);
                    t = $.fn.zTree.init(t, setting, zNodes);
                    $.isFunction(callBack) && callBack();
            	}
            });
			$('#areas_search').attr('readOnly',true);
			$(document).off('click').on('click', function (e) {
                if (($(e.target).closest("#domainTrees").length == 0 && $(e.target).closest("#areas_search").length == 0)) {
                    $('.domainTrees').hide();
                }
            });
		},
		/**
		 * 导出数据
		 */
		exportData: function(){
			if(!curTableData || !curTableData.list || curTableData.list.length<0){
				main.comonErrorFun(Msg.modules.dr_runReport.noDataExport);
				return;
			}
			var data = curTableData.list;
			var parm = {};
			parm.data = data;
			parm.TableName = arrTabele;
			parm.image =  window.ECharts.Cache['drRunReportChart'].getDataURL();
			parm.fileName = Msg.modules.dr_runReport.runPort;
			$('#dr_runReport').find('#run_param').val(JSON.stringify(parm));
			$('#dr_runReport').find('#runkpi_exort_form').submit();
		},
		//域树结构点击事件
		bindAreasSeachClick:function(selector){
			var top =  $('#dr_runReport').offset().top;
        	var left= $('#dr_runReport').offset().left;
        	var off = $('#areas_search').offset();
        	var rtop = off.top - top + $('#areas_search').outerHeight() + 2;
        	var rleft = off.left - left;
        	$('.domainTrees').css({'left':rleft,'top':rtop,widht:$('#areas_search').outerWidth()});
        	$('.domainTrees').show();
		},
		//时间选择框点击事件
		bindTimeSeachClick : function(){
			$('#time_search').off('click').on('click',function(){
				window.DatePicker({
	                dateFmt: drRunReport.getTimeFomat($('#run_time_dimension').val()),
	                isShowClear: true,
	                maxDate:new Date()
	            });
			});
		},
		//初始化 图
		viweCharts: function (data) {
            var id = document.getElementById("drRunReportChart");
            var tooltips=[Msg.modules.dr_runReport.chart.chargePowerMoneyu,
                          Msg.modules.dr_runReport.chart.onePileMoneyu,Msg.modules.dr_runReport.chart.chargPoweru];
            var kpi_option = {
                noDataLoadingOption: {
                    text: Msg.noData,
                    effect: 'bubble',
                    effectOption: {
                        effect: {
                            n: 0 //气泡个数为0
                        }
                    }
                },
                color: ['#FF8400', '#F8B117','#14D6FF'],
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        lineStyle: {
                            color: '#b4a691'
                        }
                    },
                    formatter: tooltips
                },
                legend: {
                    data: [Msg.modules.dr_runReport.chart.chargePowerMoneyu,
                           Msg.modules.dr_runReport.chart.onePileMoneyu,Msg.modules.dr_runReport.chart.chargPoweru],
                    textStyle:{
                        color:'#666666'
                    },
                    borderColor:'#b4a691',
                    selectedMode: true,
                    y:'15px'
                },
                grid: {
                    x: '50px',
                    x2: '50px',
                    y2: '0%',
                    y:  '20%',
                    containLabel: true,
                    borderColor: '#CCCCCC'
                },
                xAxis: [
                    {
                        type: 'category',
                        data: data.x1,
                        //data: [1,2,3,4,5,6,7],
                        axisTick: {
                        	show: false,
                            alignWithLabel: true
                        },
                        axisLabel:{
                        	textStyle:{
                        		color:'#666'
                        	}
                        },
                        nameTextStyle:{
                        	color:'#666',
                        	fontWeight:'blod'
                        },
                        axisLine: {
                            lineStyle: {
                                color: '#CCCCCC'
                            }
                        },
                        splitLine: {
                            show: false
                        }
                    }
                ],
                yAxis: [
                    {
                    	name:Msg.modules.dr_runReport.chart.mon,
                        type: 'value',
                        nameTextStyle: {
                            color: "#666"
                        },
                        axisLabel:{
                        	textStyle:{
                        		color:'#666'
                        	}
                        },
                        axisLine: {
                            lineStyle: {
                                color: '#CCCCCC'
                            }
                        },
                        splitLine: {
                            show: true,
                            lineStyle: {
                                color: '#CCCCCC',
                                type: 'dashed'
                            }
                        }
                    },
                    {
                    	name:Msg.modules.dr_runReport.chart.chargPoweru,
                        type: 'value',
                        nameTextStyle: {
                            color: "#666"
                        },
                        axisLabel:{
                        	textStyle:{
                        		color:'#666'
                        	}
                        },
                        axisLine: {
                            lineStyle: {
                                color: '#CCCCCC'
                            }
                        },
                        splitLine: {
                            show: true,
                            lineStyle: {
                                color: '#CCCCCC',
                                type: 'dashed'
                            }
                        }
                    }
                ],
                series: [
                    {
                        name: Msg.modules.dr_runReport.chart.chargePowerMoneyu,
                        type: 'bar',
                        barGap: '10%',
                        barCategoryGap: '50%',
                        data: data.y2,
                        itemStyle: {
                            normal: {
                                barBorderRadius: 7,
                                z: 0
                            }
                        }
                    },
                    {
                        name: Msg.modules.dr_runReport.chart.onePileMoneyu,
                        type: 'line',
                        smooth:true,
                        symbolSize:13,
                        data: data.y3,
                        itemStyle: {
                            normal: {
                                barBorderRadius: 7,
                                z: 1
                            }
                        }
                    },
                    {
                        name: Msg.modules.dr_runReport.chart.chargPoweru,
                        type: 'bar',
                        barGap: '10%',
                        barCategoryGap: '50%',
                        yAxisIndex: 1,
                        data: data.y1,
                        itemStyle: {
                            normal: {
                                barBorderRadius: 7,
                                z: 0
                            }
                        }
                    }
                ]
            };
            ECharts.Render(id, kpi_option, true);
        },
        //获取 ztree setting
        getDomainSetting: function () {
            var setsrc = {
                check: {
                    enable: true,
                    autoCheckTrigger: true,
                    chkboxType: {"Y": "s", "N": "s"}
                },
                view: {
                    dblClickExpand: false,
                    showLine: false,
                    showIcon: false,
                    selectedMulti: false
                },
                data: {
                    simpleData: {
                        enable: true,
                        idKey: "id",
                        pIdKey: "pid"
                    }
                },
                callback: {
                	onCheck:function(e,treeId,treeNode){
                		drRunReport.checkNodes(treeNode,treeId,treeNode.checked);
                	},
                    onClick: function (e, treeId, treeNode) {
                        var treeObj = $.fn.zTree.getZTreeObj(treeId);
                        treeObj.expandNode(treeNode, !treeNode.open, false, true);
                    }
                }
            };
            return setsrc;
        },
        //选择域 名称显示
        checkNodes : function(treeNode,treeId,isChecked){
        	var node = {id:treeNode.id,level:treeNode.mlevel,pid:treeNode.mpid,name:treeNode.name};
        	if(isChecked){
        		curNode.set(node.id,node);
        	}else{
        		curNode.delete(node.id);
        	}
        	var treeObj = $.fn.zTree.getZTreeObj(treeId);
        	var nodeIds = $.extend(true,[],curNode.values());
        	nodeIds = treeObj.transformTozTreeNodes(nodeIds);
        	var showName = "";
        	var arr = [];
        	$.each(nodeIds, function (t, e) {
        		arr.push(e.name);
            });
        	if(arr && arr.length>0){
        		showName = arr.toString();
        	}
        	$('#areas_search').val(showName);
		},
		//选择域显示
		setSelectName : function(treeNode,isChecked){
			var val = $('#areas_search').val();
			var arr = [];
			if(val){
				arr = val.split(',');
			}
			var nodeName = treeNode.name;
			if(isChecked){
				if(!arr.contains(nodeName)){
					$('#areas_search').val(arr.concat(nodeName).toString());
				}
			}else{
				var index = arr.indexOf(nodeName);
				if( index >= 0 ){
					arr.splice(index);
					$('#areas_search').val(arr.toString());
				}
			}
		},
        /**
         * 获取选中的域
         */
        getSelectNodes : function(){
        	 var treeObj = $.fn.zTree.getZTreeObj("domainTrees");
        	 if(!treeObj){
        		return null;
        	 }
			 var nodeIds = $.extend(true,[],curNode.values());
        	 var nodes = [];
        	 if(curNode.size == 0){
        		//默认全部
        		 nodes  = treeObj.getNodesByFilter(function (node) {
                     return true;
                 });
        		 $.each(nodes, function (t, e) {
                	 nodeIds.push({id:e.id,level:e.mlevel,pid:e.mpid,name:e.name});
                 });
        	 }
        	 if(!nodeIds || nodeIds.length<=0){
        		 return null;
        	 }
             var tNodes = [];
             nodeIds = treeObj.transformTozTreeNodes(nodeIds);
             $.each(nodeIds, function (t, e) {
            	 var obj = {id:e.id,level:e.level,name:e.name};
            	 var cld = [];
            	 if(e.children && e.children.length>0){
        			 cld = drRunReport.recursionTree(e.children);
        		 }
            	 cld.push(e.id);
            	 obj.cld = cld;
            	 tNodes.push(obj);
            	
             });
             return tNodes;
        },
        /**
         * 获取子节点
         */
        recursionTree: function(nodes,arr){
        	 if(!arr){
        		arr = [];
        	 }
        	 $.each(nodes, function (t, e) {
            	 arr.push(e.id);
            	 if(e.children && e.children.length>0){
            		drRunReport.recursionTree(e.children,arr);
            	 }
             });
        	 return arr;
        }
    };
    return drRunReport;
});