App.Module.config({
    package: "/home",
    moduleName: 'kpiView',
    description: '模块功能：首页-KPI视图',
    importList: [
        'jquery', 'main/main', 'ECharts', 'bootstrap', 'datePicker', 'plugins/unit-converter/converter', 'plugins/unit-converter/lodash.core', 'energyFlow'
    ]
});
App.Module('kpiView', function () {
    var kpi_Type = 1;//默认查询月
    var home_kpiView = {
        Render: function () {
        	main.setHomeBackColor();
            initData();//请求数据
            home_kpiView.initEvent();
            function initData() {
                var element = $('#home_kpiView');
                if (element.length>0) {
                    element.stopTimer();
                    element.everyTimer('60s', 'RealKpiTimmer', function () {
                        home_kpiView.realKpiRender();
                        getPileAndStationSummary();
                        var elements = $('li.curOn');
                        if(elements){
                        	elements[0].click();
                        }
                    });
                }
                home_kpiView.realKpiRender();
                getPileAndStationSummary();
                getKpiData(kpi_Type+1, returndata(kpi_Type + 1).time);
            };
            getDatePicker();
            function getDatePicker(type){
            	type = type?type:4;
                $("#dateBox").unbind("click").bind("click", function () {
                    DatePicker({
                            dateFmt: home_kpiView.formatTimeByDime(type),
                            isShowClear: true,
                            onpicked: function () {
                                getKpiData(home_kpiView.getType(type), Date.parseTime($(this).val(), 'yyyy-MM-dd hh:mm:ss'));
                            },
                            maxDate: new Date()
                        }
                    );
                });
            }

            /**
             * 获取时间
             * @param type
             */
            function returndata(type) {
                var returndata = {};
                var time;
                switch (type) {
                    case kpi_Type:
                        $(".calendarDiv #dateBox").val(new Date().format("yyyy"));
                         time = Date.parseTime($(".calendarDiv #dateBox").val(), 'yyyy-MM-dd hh:mm:ss');
                        break;

                    case kpi_Type + 1:
                        $(".calendarDiv #dateBox").val(new Date().format("yyyy-MM"));
                         time = Date.parseTime($(".calendarDiv #dateBox").val(), 'yyyy-MM-dd hh:mm:ss');
                }
                returndata.time = time;
                return returndata;

            }
            /**
             *获取KPI
             * @param type 时间类型
             * @param time 时间
             */
            function getKpiData(type, time) {
                $.http.ajax("/home/getIncomeSummaryChart", {statDim: type, statTime: time}, function (data) {
                    if (data.success && data.data) {
                        home_kpiView.echartsKpi(data.data);
                    }
                });
            }
            /**
             * 充电桩充电站概况
             */
            function getPileAndStationSummary(){
            	   $.http.ajax("/home/getPileAndStationSummary", {}, function (data) {
                       if (data.success) {
                           var summaryData = data.data;
                           home_kpiView.echartsSummary(summaryData);
                           $.each(summaryData, function (index, e) {
                               $('#' + index).text(e);
                           });
                       }
                   });
            }
            /**
             * 切换事件
             */
            $('#selectShowPS li').off('click').on('click', function () {
                $('#selectShowPS li').removeClass('curOn');
                $(this).addClass('curOn');
                var _fmt = $(this);
                returndata(home_kpiView.getType(_fmt.val()));
                getDatePicker(_fmt.val());
                getKpiData(home_kpiView.getType(_fmt.val()), returndata(home_kpiView.getType(_fmt.val())).time);

            });
        },
        initEvent : function(){
        	var dz_man = window.system['dz_man'];
        	if(dz_man){
        		$('#acPileJump').off('click').on('click',function(){
        			var ldzman = $('body').find('li[name="dz_man"]');
        			ldzman.data('parms',{deviceTypes:[1,2]});
        			ldzman.click();
            	});
            	$('#dcPileJump').off('click').on('click',function(){
            		var ldzman = $('body').find('li[name="dz_man"]');
            		ldzman.data('parms',{deviceTypes:[3,4]});
            		ldzman.click();
            	});
        	}else{
        		$('#acPileJump').hide();
        		$('#dcPileJump').hide();
        	}
        	var dp_man = window.system['dp_man'];
        	if(dp_man){
        		$('#stationJump').off('click').on('click',function(){
        			var ldpman = $('body').find('li[name="dp_man"]');
        			ldpman.click();
            	});
        	}else{
        		$('#stationJump').hide();
        	}
        },
        getType: function (dim) {
            var r;
            switch (parseInt(dim)) {
                case 4:
                    r = 2;
                    break;
                case 5:
                    r = 1;
                    break;
            }
            return r;

        },
        formatTimeByDime: function (dim) {
            var r = "";
            switch (parseInt(dim)) {
                case 2:
                    r = Msg.dateFormat.yyyymmdd;
                    break;
                case 4:
                    r = 'yyyy-MM';
                    break;
                case 5:
                case 6:
                    r = Msg.dateFormat.yyyy;
                    break;
            }
            return r;
        },
        /**
         * 仪表盘图形
         * @param data
         */
        echartsSummary: function (data) {
            var rateMap ={
                'alterCureenBrokenRate':data.alterCureenBrokenRate,
                'directCureenBrokenRate':data.directCureenBrokenRate,
                'chargeStationRate':data.chargeStationRate
            };
            $.each(rateMap,function(k,v){
                home_kpiView.paint(k,v);

            });
        },
        /**
         * 绘图
         * @param karea 绘图元素
         * @param rate 故障率
         */
        paint:function(karea,rate){
            var agle = 225 - (270 * (rate/100));
            var summary_option = {
                color: ['#ffa500'],
                tooltip: {
                    formatter: "{a} : {c}%"
                },
                toolbox: {
                    show: true,
                    feature: {}
                },
                series: [
                    {
                        type: 'gauge',
                        name: Msg.modules.home.kpiView.KPI.brokenRate,
                        radius:'60%',
                        startAngle:225,
                        endAngle:-45,
                        splitNumber:10,
                        axisLine: {            // 坐标轴线
                            lineStyle: {       // 属性lineStyle控制线条样式
                                width: 5,
                                color:[[0, '#B4A691'], [1, '#B4A691']]
                            }
                        },
                        axisTick: {            // 坐标轴小标记
                            length :10,        // 属性length控制线长
                            lineStyle: {       // 属性lineStyle控制线条样式
                                color: 'auto'
                            }
                        },
                        axisLabel:{
                            show:false
                        },
                        pointer: {
                            width:3,
                            color : '#FFC240'
                        },
                        itemStyle:{
                            normal:{
                                color:"#FFC240"
                            }
                        },
                        splitLine: {           // 分隔线
                            length: 10,         // 属性length控制线长
                            lineStyle: {       // 属性lineStyle（详见lineStyle）控制线条样式
                                color: 'auto'
                            }
                        },
                        title: {
                            offsetCenter: [0, '90%'],       // x, y，单位px
                            textStyle: {
                                color: '#FFC240'
                            }
                        },
                        detail: {
                            formatter: '{value}%',
                            textStyle: {
                                color: '#FFC240'
                            }
                        },
                        data: [{value: rate, name: Msg.modules.home.kpiView.KPI.brokenRate}],
                        legendHoverLink:true,
                        color:'#ffa500'
                    },
                    {
                        type: 'gauge',
                        radius:'75%',
                        startAngle:225,
                        endAngle:agle,
                        splitNumber:1,
                        axisLine: {            // 坐标轴线
                            lineStyle: {       // 属性lineStyle控制线条样式
                                width: 20,
                                color:[[0, '#FFC240'], [1, '#FFC240']]
                            }
                        },
                        axisTick: {            // 坐标轴小标记
                            lineStyle: {       // 属性lineStyle控制线条样式
                                color: 'transparent'
                            }
                        },
                        splitLine: {           // 分隔线
                            show:false
                        },
                        axisLabel:{
                            show:false
                        },
                        pointer: {
                            show:false
                        },
                        detail: {
                            formatter: ''
                        }
                    }
                ]
            };
            var area;
            switch (karea) {
                case 'alterCureenBrokenRate':
                    area = document.getElementById("jlgz");
                    break;
                case 'directCureenBrokenRate':
                    area = document.getElementById("zlgz");
                    break;
                case 'chargeStationRate':
                    area =document.getElementById("dzgz");
                    break;
            }
            ECharts.Render(area, summary_option, true);
        },

        /**
         * 实时Kpi
         */
        realKpiRender: function () {
            var param = {};
            function formatKPI(item, value) {
                var kpiFormat = {};
                if(item == "dayChargePower"){
                    var  temp = convert(value, main.Lang+"_"+main.region).from('KWh').toBest();
                    kpiFormat.value = temp.val;
                    kpiFormat.unit = temp.unit;

                } else if (item == "dayIncome" || item == "totalIncome") {
                    if(!isNaN(value)){
                        kpiFormat = App.unitTransform(value);
                    }

                } else{
                    kpiFormat.unit = Msg.unit.stringUnit;
                    kpiFormat.value = value;
                }
                return kpiFormat;
            }
            $.http.ajax("/home/getRealKpi", param, function (res) {
                var data = res.data;
                var plantMsg = data;
                for (var item in plantMsg) {
                    var kpi = formatKPI(item, parseFloat(plantMsg[item]));
                    var context = $('#' + item);
                    if(context){
                        if( 'dayIncome' == item || item == "totalIncome"){
                            context.text(parseFloat((kpi.value).fixed(2)).toFixed(2)).parents("li").find("span.unit").text(kpi.unit);
                        } else if('dayChargePower' == item){
                            context.text(parseFloat((kpi.value).fixed(3)).toFixed(3)).parents("li").find("span.unit").text(kpi.unit);
                        }
                        else{
                            context.text(kpi.value).parents("li").find("span.unit").text(kpi.unit);
                        }
                    }

                }
            });
        },

        /**
         * KPI年月图形
         * @param data
         */
        echartsKpi: function (data) {

            if(!data || data.length ==0){
                return;
            }
            home_kpiView.formatData(data);
            var id = document.getElementById("fdltj_char");
            var tooltips=[Msg.modules.home.kpiView.KPI.chargePowerIncome, Msg.modules.home.kpiView.KPI.chargeServeIncome];
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
                color: ['#ffc240', '#ffc240'],
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
                    data: [Msg.modules.home.kpiView.KPI.chargePowerIncome, Msg.modules.home.kpiView.KPI.chargeServeIncome],
                  /*  formatter: function (val) {
                        /!*  if (val.trim() == Msg.partials.main.rm.dayCapPrpfit.data.dayCap) {
                         return val+"("+ yUnit+")";
                         }
                         if (val.trim() == Msg.partials.main.rm.dayCapPrpfit.data.profits) {
                         return val +"("+ y2Unit+")";
                         }
                         if (val.trim() == Msg.partials.main.rm.dayCapPrpfit.data.usePower) {
                         return val +"("+ yUnit+")";
                         }


                         return val;*!/
                    },*/

                    textStyle:{
                        color:'#b4a691'
                    },
                    borderColor:'#b4a691',
                    selectedMode: false,
                    y:'15px'
                },
                grid: {
                    x: '2%',
                    x2: '2%',
                    y2: '0%',
                    y:  '20%',
                    containLabel: true,
                    borderColor: '#EEEEEE'
                },
                xAxis: [
                    {
                        type: 'category',
                        data: data.xAxis,
                        axisTick: {
                            alignWithLabel: true
                        },
                        axisLine: {
                            lineStyle: {
                                color: '#b4a691'
                            }
                        },
                        splitLine: {
                            show: true,
                            lineStyle: {
                                color: '#b4a691',
                                type: 'dashed'
                            }
                        }
                    }
                ],
                yAxis: [
                    {
                        name: data.unit,
                        type: 'value',
                       nameTextStyle: {
                            color: "#b4a691"
                        },
                        axisLine: {
                            lineStyle: {
                                color: '#b4a691'
                            }
                        },
                        splitLine: {
                            show: true,
                            lineStyle: {
                                color: '#b4a691',
                                type: 'dashed'
                            }
                        },
                        splitNumber:4
                    }
                ],
                series: [
                    {
                        name: Msg.modules.home.kpiView.KPI.chargePowerIncome,
                        type: 'bar',
                        barGap: '10%',
                        barCategoryGap: '50%',
                        barWidth: '10',
                        data: data.y1Axis,
                        itemStyle: {
                            normal: {
                                barBorderRadius: 7,
                                z: 0
                            }
                        }
                    },
                    {
                        name: Msg.modules.home.kpiView.KPI.chargeServeIncome,
                        type: 'line',
                        barWidth: '13',
                        data: data.y2Axis,
                        itemStyle: {
                            normal: {
                                barBorderRadius: 7,
                                z: 1
                            }
                        }
                    }
                ]
            };
            ECharts.Render(id, kpi_option, true);
        },
        /**
         * 元转万元
         */
        formatData: function (data) {
            data.unit = Msg.unit.RMBUnit;
            var isChange = false;
            y1Axis = data.y1Axis;
            y2Axis = data.y2Axis;
            if (y1Axis && y2Axis) {
                for (var index = 0; index < y1Axis.length; index++) {
                    if (parseFloat(y1Axis[index]) >= 10000) {
                        isChange = true;
                        // y1Axis[index] = (y1Axis[index] /10000).fixed(3).toFixed(3);
                    }
                }
                for (var index = 0; index < y2Axis.length; index++) {
                    if (parseFloat(y2Axis[index]) >= 10000) {
                        isChange = true;
                        // y2Axis[index] = (y2Axis[index] /10000).fixed(3).toFixed(3);
                    }
                }
                if (isChange) {
                    for (var index = 0; index < y1Axis.length; index++) {
                        if (parseFloat(y1Axis[index]) >= 0) {
                            y1Axis[index] = (y1Axis[index] / 10000).fixed(3).toFixed(3);
                        }
                    }
                    for (var index = 0; index < y2Axis.length; index++) {
                        if (parseFloat(y2Axis[index]) >= 0) {
                            y2Axis[index] = (y2Axis[index] / 10000).fixed(3).toFixed(3);
                        }
                    }
                    data.unit = Msg.unit.WRMBUnit;
                }
            }
        }

    };
    return home_kpiView;
});