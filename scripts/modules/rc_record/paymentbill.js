App.Module.config({
	package: '/rc_record',
	moduleName: 'paymentbill',
	description: '模块功能：缴费账单',
	importList: ['jquery', 'bootstrap', 'easyTabs', 'ValidateForm',
		'GridTable', 'ECharts', 'dynamic','datePicker'
	]
});
App.Module('paymentbill', function() {
	var curTableData = null;
	var arrTabele = Msg.modules.rc_record.paymentbill.table;
	var paymentbill = {
		Render: function(params) {
			//设置背景色
			main.setBackColor();
			//初始化 搜索框   //表格生成  图形生成
			paymentbill.initSearch();
			
			paymentbill.queryDatas();
		},
		getTimeFomat: function(type) {
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
		getValFormat : function(type){
			var format = Msg.dateFormat.yyyymmdd;
			switch (type) {
				case "month":
					format = Msg.dateFormat.yyyymmdd;
					break;
				case "year":
					format = Msg.dateFormat.yyyymm;
					break;
				default:
					format = Msg.dateFormat.yyyymmdd;
					break;
			}
			return format;
		},
		getChartFormat: function(type){
			var format = Msg.dateFormat.MM;
			switch (type) {
				case "month":
					format = Msg.dateFormat.dd;
					break;
				case "year":
					format = Msg.dateFormat.MM;
					break;
				default:
					format = Msg.dateFormat.MM;
					break;
			}
			return format;
		},
		//查询表格数据
		queryDatas: function() {
			var parm = {};
			parm.queryParms = paymentbill.getParam();
			$.http.ajax('card/rechargeBilllist', parm, function (res) {
				var data = [];
                if (res.success) {
                	data = res.data;
                }
                paymentbill.toCreateTable(data);
            });
		},
		/**
		 * 获取表格配置
		 */
		getP : function(data,isRefresh){
			var p = {
				prototypeData:data,
				loadReady: function(data) {
					var vdata = {};
					var cData = {};
					cData.list = [];
					cData.total = 0;
					if (data && data.list) {
						vdata.x = [];
						vdata.y = [];
						var cdata = [];
						var opt = $("#run_time_dimension option:selected");
						var format = paymentbill.getValFormat(opt.val());
						var chartFormat = paymentbill.getChartFormat(opt.val());
						$.each(data.list,function(t,e){
							var time = e.rechargeDate;
							e.rechargeDate = (Date.parse(time)).format(format);
							vdata.x.push((Date.parse(time)).format(chartFormat));
							e.rechargeMoney = main.ToFiexValue(e.rechargeMoney) || "";
							vdata.y.push(e.rechargeMoney || "");
							e.rechargeNumber = main.ToFiexValue(e.rechargeNumber) || "";
							e.averageRechargeRate = main.ToFiexValue(e.averageRechargeRate) || "";
							cdata.push(e);
						});
						cData.list = cdata;
						cData.total = cdata.length;
					}else{
						vdata.x = [""];
						vdata.y = [""];
					}
					paymentbill.viweCharts(vdata);
					curTableData = cData;
					return cData;
				}	
			};
			if(isRefresh){
				var tdata = p.loadReady({list:data,total:data.length});
				p.data = tdata.list;
				p.prototypeData = tdata.list;
			}
			return p;
		},
		toCreateTable : function(data){
			var p = {
				title: false,
				idProperty: 'id',
				isRecordSelected: true, //跨页选择
				isSearchRecordSelected: false,
				pageBar:false,
				rp:data.length ,
				max_height: '575',
				colModel: [{
						display: arrTabele[0],
						name: 'rechargeDate',
						width: 0.25,
						sortable: true,
						order:true,
						align: 'center'
					}, {
						display: arrTabele[1],
						name: 'rechargeMoney',
						width: 0.25,
						sortable: true,
						order:true,
						align: 'center'
					}, {
						display: arrTabele[2],
						name: 'rechargeNumber',
						width: 0.25,
						sortable: true,
						order:true,
						align: 'center'
					},
					{
						display: arrTabele[3],
						name: 'averageRechargeRate',
						width: 0.25,
						sortable: true,
						order:true,
						align: 'center'
					}
				]
			};
			p = $.extend(p, paymentbill.getP(data));
			$('#paymentbillTable').GridTable(p);
		},
		/**
		 * 获取参数
		 */
		getParam: function() {
			var map = {};
			map.cardNumber = $('#cardNumber_search').val();
			var time = $('#time_search').val();
			var opt = $("#run_time_dimension option:selected");
			var format = paymentbill.getTimeFomat(opt.val());
			if (!time) {
				time = (Date.parse(new Date().getTime())).format(format);
			}
			map.bTime = Date.parse(time, format).getTime();
			map.type = opt.val();
			return map;
		},
		submit: function() {
			var parm = {};
			parm.queryParms = paymentbill.getParam();
			$.http.ajax('card/rechargeBilllist', parm, function (res) {
				var data = [];
                if (res.success) {
                	data = res.data;
                }
                var p = paymentbill.getP(data,true);
                $('#paymentbillTable').GridTableSearchpData(p);
            });
		},
		//初始化 搜索框
		initSearch: function() {
			//初始化 条件操作按钮
			$("#paymentbillBar").ValidateForm('paymentbillBar_bar', {
				show: 'horizontal',
				fnSubmit: paymentbill.submit,
				model: [
					[{
						input: 'input',
						type: 'text',
						show: Msg.modules.rc_record.paymentbill.cardNumber,
						name: 'cardNumber',
						width: '165',
						extend: {
							id: 'cardNumber_search'
						}
					}, {
						input: 'select',
						type: 'select',
						show: Msg.modules.rc_record.paymentbill.dimension,
						options: [{
							text: Msg.unit.timeDem[1],
							value: "month"
						}, {
							text: Msg.unit.timeDem[0],
							value: "year"
						}],
						name: 'run_time_dimension',
						extend: {
							id: 'run_time_dimension'
						}
					}, {
						input: 'input',
						type: 'text',
						show: Msg.modules.rc_record.paymentbill.selectTime,
						name: 'time',
						width: '165',
						extend: {
							id: 'time_search',
							class: 'wdateIcon',
							readonly: 'readonly'
						}
					}]
				],
				extraButtons: [{
					input: 'button',
					align: 'right',
					show: Msg.exportF,
					name: '',
					fnClick: function() {
						paymentbill.exportData();
					},
					extend: {
						id: 'paymentbill_export',
						class: 'btn btn-export'
					}
				}]
			});
			//绑定时间点击事件
			paymentbill.bindTimeSeachClick();
			$('#time_search').val((Date.parse(new Date().getTime())).format(paymentbill.getTimeFomat($('#run_time_dimension').val())));

			$('#run_time_dimension').off('change').on('change', function() {
				$('#time_search').val((Date.parse(new Date().getTime())).format(paymentbill.getTimeFomat($('#run_time_dimension').val())));
				paymentbill.bindTimeSeachClick();
			});

			$('#paymentbillBar').find('#paymentbill_export').parents('.clsRow').css({
				float: 'right'
			});
//			$('#cardNumber_search').dynamic({
//                url: 'card/list',
//                chStyle:'checkbox',
//                queryName:"cardNumber",
//                formatNode:function(node){
//                	node.name = node.cardNumber;
//                	return node;
//                }
//            });
		},
		/**
		 * 导出数据
		 */
		exportData: function() {
			if(!curTableData || !curTableData.list || curTableData.list.length<0){
				main.comonErrorFun(Msg.modules.rc_record.paymentbill.noDataExport);
				return;
			}
			var data = curTableData.list;
			var parm = {};
			parm.data = data;
			parm.TableName = arrTabele;
			parm.image =  window.ECharts.Cache['paymentbillChart'].getDataURL();
			parm.fileName = Msg.modules.rc_record.paymentbill.exportFileName;
			$('#paymentbill_div').find('#paymentbill_param').val(JSON.stringify(parm));
			$('#paymentbill_div').find('#paymentbill_form').submit();
		},
		//时间选择框点击事件
		bindTimeSeachClick: function() {
			$('#time_search').off('click').on('click', function() {
				window.DatePicker({
					dateFmt: paymentbill.getTimeFomat($('#run_time_dimension').val()),
					isShowClear: true,
					maxDate: new Date()
				});
			});
		},
		//初始化 图
		viweCharts: function(data) {
			var id = document.getElementById("paymentbillChart");
			var tooltips = [Msg.modules.rc_record.paymentbill.totalRMB
			];
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
				color: ['#FF8400'],
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
					data: [ Msg.modules.rc_record.paymentbill.totalRMB],
					textStyle: {
						color: '#666666'
					},
					borderColor: '#b4a691',
					selectedMode: true,
					y: '15px'
				},
				grid: {
					x: '50px',
					x2: '50px',
					y2: '0%',
					y: '20%',
					containLabel: true,
					borderColor: '#CCCCCC'
				},
				xAxis: [{
					type: 'category',
					data: data.x,
					//data: [1,2,3,4,5,6,7],
					axisTick: {
						show: false,
						alignWithLabel: true
					},
					axisLabel: {
						textStyle: {
							color: '#666'
						}
					},
					nameTextStyle: {
						color: '#666',
						fontWeight: 'blod'
					},
					axisLine: {
						lineStyle: {
							color: '#CCCCCC'
						}
					},
					splitLine: {
						show: false
					}
				}],
				yAxis: [{
					name: Msg.unit.RMBUnit,
					type: 'value',
					nameTextStyle: {
						color: "#666"
					},
					axisLabel: {
						textStyle: {
							color: '#666'
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
				}],
				series: [{
					name: Msg.modules.rc_record.paymentbill.totalRMB,
					type: 'line',
					smooth: true,
					symbolSize: 13,
					data: data.y,
					itemStyle: {
						normal: {
							barBorderRadius: 7,
							z: 1
						}
					}
				}]
			};
			ECharts.Render(id, kpi_option, true);
		}
	};
	return paymentbill;
});