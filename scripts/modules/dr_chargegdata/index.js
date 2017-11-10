App.Module.config({
    package: '/dr_chargegdata',
    moduleName: 'dr_chargegdata',
    description: '模块功能：充电数据',
    importList: ['jquery', 'bootstrap', 'easyTabs','ValidateForm', 'GridTable','dynamic']
});
App.Module('dr_chargegdata', function () {
	var format = Msg.dateFormat.yyyymmdd;
    var drChargegdata = {
        Render: function (params) {
        	//设置背景色
       	   main.setBackColor();
       	   
       	   //初始化查询按钮  //初始化数据查询
       	   drChargegdata.initSearch(drChargegdata.queryData);
       	   
        },
       //初始化 搜索框
		initSearch : function(callBack){
			//初始化 条件操作按钮
			$("#drChargegdataBar").ValidateForm('dr_chargegdata_bar', {
				show : 'horizontal',
				fnSubmit : drChargegdata.clickToSearch,
				model : [ [ {
					input : 'input',
					type : 'text',
					show : Msg.modules.dr_chargegdata.selectPile,
					name : 'areas',
					width : '165',
					extend : {
						id : 'pile_search'
					}
				},
					{
						input : 'input',
						type : 'text',
						show : Msg.modules.dr_chargegdata.selectTime,
						name : 'time',
						width : '165',
						extend : {
							id : 'times_search',class: 'wdateIcon', readonly: 'readonly'
						},
						fnClick:drChargegdata.bindTimeSeachClick
				} ] ]
			});
			$('#times_search').val((Date.parse(new Date().getTime())).format(format));
			$('#pile_search').dynamic({
                url: 'pile/simpleList',
                chStyle:'radio',
                urlToProtoType:false,
                onePageloadAfter:callBack
            });
		},
		clickToSearch : function(){
			var serNumbers = $('#pile_search').dynamicSelectsGetFirst();
			if(!serNumbers || serNumbers.length<=0){
        		main.comonErrorFun(Msg.modules.dr_chargegdata.psonepile);
        		return;
        	}
			drChargegdata.queryData(serNumbers);
		},
		/**
		 * 数据查询
		 */
		queryData :function(serNumbers){
			var parm = {};
			var map = {};
			var time = $('#times_search').val();
        	if(!time){
        		time  = (Date.parse(new Date().getTime())).format(format);
        	}
        	map.bTime = Date.parse(time,format).getTime();
        	map.serNumbers = serNumbers || $('#pile_search').dynamicSelectsGetFirst();
        	parm.queryParms = map;
        	$.http.ajax('/pile/chargeData', parm, function (res) {
               if(res && res.success){
            	   var data = res.data.data;
            	   if(data)
            	   drChargegdata.viewCharts(drChargegdata.dataForm(data,res.data.times));
               }
            });
		},
		dataForm:function(data,times){
			var vseries = {
                type: 'line',
                smooth:true,
                symbolSize:13,
                itemStyle: {
                    normal: {
                        barBorderRadius: 7,
                        z: 1
                    }
                },
                markPoint:{
                	data:[
                	      {type : 'max', name : Msg.modules.dr_chargegdata.maxv},
                	      {type : 'min', name : Msg.modules.dr_chargegdata.minv}
                	]
                },
                markLine : {
                    data : [
                        {type : 'average', name :Msg.modules.dr_chargegdata.averv}
                    ]
                }
			};
			var aseries = {
                type: 'line',
                smooth:true,
                symbolSize:13,
                itemStyle: {
                    normal: {
                        barBorderRadius: 7,
                        z: 1
                    }
                },
                yAxisIndex: 1,
                markPoint:{
                	data:[
                	      {type : 'max', name : Msg.modules.dr_chargegdata.maxv},
                	      {type : 'min', name : Msg.modules.dr_chargegdata.minv}
                	]
                },
                markLine : {
                    data : [
                        {type : 'average', name :Msg.modules.dr_chargegdata.averv}
                    ]
                }
			}
			var map = {};
			var names = [];//桩
			var legendv = [];
			var legenda = [];
			var datav = [];
			var dataa = [];
			for(var k in data){
				names.push(k);
				var obj = data[k];
				if(!$.isEmptyObject(obj)){
					for(var n in obj){
						var vname = k+"-"+n+Msg.modules.dr_chargegdata.vol;
						legendv.push(vname);
						var vt = $.extend({},vseries);
						vt.name = vname;
						vt.data = obj[n]['V'];
						datav.push(vt);
						var aname = k+"-"+n+Msg.modules.dr_chargegdata.ele;
						legenda.push(aname);
						var at = $.extend({},aseries);
						at.name = aname;
						at.data = obj[n]['A'];
						dataa.push(at);
					}
				}
			}
			map.legend = legendv.concat(legenda);
			map.names = names;
			map.series = datav.concat(dataa);
			var defaultArr = [];
			$.each(times,function(t,e){
				times[t] = (Date.parse(e)).format(Msg.dateFormat.HHmm);
				defaultArr.push('');
			});
			map.times = times;
			if(map.legend.length<=0){
				map.legend.push(Msg.modules.dr_chargegdata.vol);
				map.legend.push(Msg.modules.dr_chargegdata.ele);
			}
			if(map.series.length<=0){
				var vt = $.extend({},vseries);
				vt.name = Msg.modules.dr_chargegdata.vol;
				vt.data = defaultArr;
				map.series.push(vt);
				var at = $.extend({},vseries);
				at.name = Msg.modules.dr_chargegdata.ele;
				at.data = defaultArr;
				map.series.push(at);
			}
			return map;
		},
		
		dealData:function(map){
			//1分钟
			timeInterval = timeInterval || 1000*60;
			var interval = (24*60*60*1000) / timeInterval;
			var xarr = [];
			var y1arr = [];
			var y2arr = [];
			var n = 0;
			var maxn = data.x.length;
			for(var i = bTime ;i < bTime+ (24*60*60*1000);i=i+timeInterval){
				var tempY1 = "";
				var tempY2 = "";
				var iend = i + timeInterval;
				if(n<maxn && data.x[n] >=i && data.x[n]<iend){
					tempY1 = main.ToFiexValue(data.y1[n]);
					tempY2 = main.ToFiexValue(data.y2[n]);
					n++;
				}
				xarr.push((Date.parse(i)).format(Msg.dateFormat.HHmm));
				y1arr.push(tempY1);
				y2arr.push(tempY2);
			}
			data.x  = xarr;
			data.y1 = y1arr;
			data.y2 = y2arr;
			return data;
		},
		//时间选择框点击事件
		bindTimeSeachClick : function(selector){
			window.DatePicker({
                dateFmt: format,
                isShowClear: true,
                maxDate:new Date()
            });
		},
		formatChartX :function(data){
			var arr = [];
			if(data && data.length>0){
				$.each(data,function(t,e){
					if(e && !isNaN(e)){
						e = (Date.parse(e)).format(Msg.dateFormat.HHmm);
					}
					arr.push(e);
				});
			}
			return arr;
		},
		//初始化 图
		viewCharts: function (data) {
            var id = document.getElementById("drChargegdataChart");
            var tooltips=[Msg.modules.dr_chargegdata.voltage,Msg.modules.dr_chargegdata.elecurrent];
            var kpi_option = {
                title : {
                    subtext: Msg.modules.dr_chargegdata.curpile+ data.names.toString()
                },
                color: ['#00D2FF', '#F8B117','#05f88b','#f83505','#e5117a','##282e8b',"#f805c0","#0500a2"],
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
                	data:data.legend,
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
                    y2: '50px',
                    y:  '20%',
                    containLabel: true,
                    borderColor: '#CCCCCC'
                },
                dataZoom:[{
                		type:'slider',
                        show: true,
                        backgroundColor:'#F9F9F9',
                        dataBackground:{
                        	lineStyle:{
                        		color:'transparent'
                        	},
                        	areaStyle:{
                        		color:'transparent'
                        	}
                        },
                        handleSize:'100%',
                        borderColor:"#FFC47F",	
                        fillerColor:'#FFF3E5',
                        handleColor:'#FBC17E'
                 }] ,
                xAxis: [
                    {
                        type: 'category',
                        data:data.times,
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
                        name: Msg.modules.dr_chargegdata.voltage,
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
                        name: Msg.modules.dr_chargegdata.elecurrent,
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
                ]
//                series: [
//                     {
//                        name: Msg.modules.dr_chargegdata.vol,
//                        type: 'line',
//                        smooth:true,
//                        symbolSize:13,
//                        data:data.y1,
//                        itemStyle: {
//                            normal: {
//                                barBorderRadius: 7,
//                                z: 1
//                            }
//                        },
//                        markPoint:{
//                        	data:[
//                        	      {type : 'max', name : Msg.modules.dr_chargegdata.maxv},
//                        	      {type : 'min', name : Msg.modules.dr_chargegdata.minv}
//                        	]
//                        },
//                        markLine : {
//                            data : [
//                                {type : 'average', name :Msg.modules.dr_chargegdata.averv}
//                            ]
//                        }
//                    },
//                    {
//                        name: Msg.modules.dr_chargegdata.ele,
//                        type: 'line',
//                        smooth:true,
//                        symbolSize:13,
//                        data:data.y2,
//                        itemStyle: {
//                            normal: {
//                                barBorderRadius: 7,
//                                z: 1
//                            }
//                        },
//                        yAxisIndex: 1,
//                        markPoint:{
//                        	data:[
//                        	      {type : 'max', name : Msg.modules.dr_chargegdata.maxv},
//                        	      {type : 'min', name : Msg.modules.dr_chargegdata.minv}
//                        	]
//                        },
//                        markLine : {
//                            data : [
//                                {type : 'average', name :Msg.modules.dr_chargegdata.averv}
//                            ]
//                        }
//                    }
//                ]
            };
            if(data.series.length>0){
            	kpi_option.series = data.series;
            }
            
            ECharts.Render(id, kpi_option, true);
        }
    };
    return drChargegdata;
});