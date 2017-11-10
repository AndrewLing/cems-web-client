App.Module.config({
    package: "/home",
    moduleName: 'kpiView',
    description: '模块功能：首页-KPI视图',
    importList: [
        'jquery', 'main/main', 'ECharts', 'bootstrap', 'datePicker', 'plugins/unit-converter/converter', 'plugins/unit-converter/lodash.core', 'energyFlow'
    ]
});
App.Module('kpiView', function () {
    var kpi_Type = 1;//默认查询年
    var home_kpiView = {
        Render: function () {
            initData();//请求数据
            function initData() {
                //实时数据
                $.http.ajax("/index/getRealKpi", {}, function (data) {
                    if (data.success) {
                        var items = data.data;
                        $("#dayIncome").html(data.data.dayIncome);
                        $("#totalIncome").html(data.data.totalIncome);
                        $("#dayChargePower").html(data.data.dayChargePower);
                        $("#expireChargePile").html(data.data.expireChargePile);
                        $("#borkenDevs").html(data.data.borkenDevs);

                    }
                });

                //充电桩充电站概况
                $.http.ajax("/index/getPileAndStationSummary", {}, function (data) {
                    if (data.success) {
                        var summaryData = data.data;
                        home_kpiView.echartsSummary(summaryData);
                        $.each(summaryData, function (index, e) {
                            $('#' + index).text(e);
                        });
                    }


                });
                getKpiData(kpi_Type+1, returndata(kpi_Type + 1).time);
            };

            /**
             * 获取时间
             * @param type
             */
            function returndata(type) {
                var returndata = {};
                switch (type) {
                    case kpi_Type:
                        $(".calendarDiv #dateBox").val(new Date().format("yyyy"));
                        var time = Date.parseTime($(".calendarDiv #dateBox").val(), 'yyyy-MM-dd hh:mm:ss');
                        break;

                    case kpi_Type + 1:
                        $(".calendarDiv #dateBox").val(new Date().format("yyyy-MM"));
                        var time = Date.parseTime($(".calendarDiv #dateBox").val(), 'yyyy-MM-dd hh:mm:ss');
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

                $.http.ajax("/index/getIncomeSummaryChart", {statDim: type, statTime: time}, function (data) {

                    if (data.success) {
                        home_kpiView.echartsKpi(data.data);
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

                $("#dateBox").unbind("click").bind("click", function () {
                        DatePicker({
                                dateFmt: home_kpiView.formatTimeByDime(_fmt.val()),
                                isShowClear: true,
                                onpicked: function () {
                                    getKpiData(home_kpiView.getType(_fmt.val()), Date.parseTime($(this).val(), 'yyyy-MM-dd hh:mm:ss'));
                                },
                                maxDate: new Date()
                            }
                        );
                    }
                );

                getKpiData(home_kpiView.getType(_fmt.val()), returndata(home_kpiView.getType(_fmt.val())).time);

            });
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
            var brokenRate = data.alterCureenBrokenRate || 20;
            var jlchartArea = document.getElementById("jlgz");//交流充电桩
            var zlchartArea = document.getElementById("zlgz");//直流充电桩
            var dzchartArea = document.getElementById("dzgz");//充电站点
            var summary_option = {
                color: ['#ffa500'],
                tooltip: {
                    formatter: "{a} <br/>{b} : {c}%"
                },
                toolbox: {
                    show: true,
                    feature: {}
                },
                series: [
                    {
                        type: 'gauge',
                        detail: {formatter: '{value}%'},
                        data: [{value: brokenRate, name: '故障率'}],
                        color:'#ffa500'
                    }
                ]
            };

            ECharts.Render(jlchartArea, summary_option, true);
            ECharts.Render(zlchartArea, summary_option, true);
            ECharts.Render(dzchartArea, summary_option, true);

        },
        /**
         * KPI年月图形
         * @param data
         */
        echartsKpi: function (data) {
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
                    x: '10%',
                    x2: '10%',
                    y2: '10%',
                    y:  '25%',
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
                        name: Msg.unit.WRMBUnit,
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
        }

    };
    return home_kpiView;
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJtb2R1bGVzL2hvbWUva3BpVmlldy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJBcHAuTW9kdWxlLmNvbmZpZyh7XHJcbiAgICBwYWNrYWdlOiBcIi9ob21lXCIsXHJcbiAgICBtb2R1bGVOYW1lOiAna3BpVmlldycsXHJcbiAgICBkZXNjcmlwdGlvbjogJ+aooeWdl+WKn+iDve+8mummlumhtS1LUEnop4blm74nLFxyXG4gICAgaW1wb3J0TGlzdDogW1xyXG4gICAgICAgICdqcXVlcnknLCAnbWFpbi9tYWluJywgJ0VDaGFydHMnLCAnYm9vdHN0cmFwJywgJ2RhdGVQaWNrZXInLCAncGx1Z2lucy91bml0LWNvbnZlcnRlci9jb252ZXJ0ZXInLCAncGx1Z2lucy91bml0LWNvbnZlcnRlci9sb2Rhc2guY29yZScsICdlbmVyZ3lGbG93J1xyXG4gICAgXVxyXG59KTtcclxuQXBwLk1vZHVsZSgna3BpVmlldycsIGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBrcGlfVHlwZSA9IDE7Ly/pu5jorqTmn6Xor6LlubRcclxuICAgIHZhciBob21lX2twaVZpZXcgPSB7XHJcbiAgICAgICAgUmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGluaXREYXRhKCk7Ly/or7fmsYLmlbDmja5cclxuICAgICAgICAgICAgZnVuY3Rpb24gaW5pdERhdGEoKSB7XHJcbiAgICAgICAgICAgICAgICAvL+WunuaXtuaVsOaNrlxyXG4gICAgICAgICAgICAgICAgJC5odHRwLmFqYXgoXCIvaW5kZXgvZ2V0UmVhbEtwaVwiLCB7fSwgZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YS5zdWNjZXNzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpdGVtcyA9IGRhdGEuZGF0YTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJChcIiNkYXlJbmNvbWVcIikuaHRtbChkYXRhLmRhdGEuZGF5SW5jb21lKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJChcIiN0b3RhbEluY29tZVwiKS5odG1sKGRhdGEuZGF0YS50b3RhbEluY29tZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQoXCIjZGF5Q2hhcmdlUG93ZXJcIikuaHRtbChkYXRhLmRhdGEuZGF5Q2hhcmdlUG93ZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKFwiI2V4cGlyZUNoYXJnZVBpbGVcIikuaHRtbChkYXRhLmRhdGEuZXhwaXJlQ2hhcmdlUGlsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQoXCIjYm9ya2VuRGV2c1wiKS5odG1sKGRhdGEuZGF0YS5ib3JrZW5EZXZzKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy/lhYXnlLXmoanlhYXnlLXnq5nmpoLlhrVcclxuICAgICAgICAgICAgICAgICQuaHR0cC5hamF4KFwiL2luZGV4L2dldFBpbGVBbmRTdGF0aW9uU3VtbWFyeVwiLCB7fSwgZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YS5zdWNjZXNzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzdW1tYXJ5RGF0YSA9IGRhdGEuZGF0YTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaG9tZV9rcGlWaWV3LmVjaGFydHNTdW1tYXJ5KHN1bW1hcnlEYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKHN1bW1hcnlEYXRhLCBmdW5jdGlvbiAoaW5kZXgsIGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoJyMnICsgaW5kZXgpLnRleHQoZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBnZXRLcGlEYXRhKGtwaV9UeXBlKzEsIHJldHVybmRhdGEoa3BpX1R5cGUgKyAxKS50aW1lKTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiDojrflj5bml7bpl7RcclxuICAgICAgICAgICAgICogQHBhcmFtIHR5cGVcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIHJldHVybmRhdGEodHlwZSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHJldHVybmRhdGEgPSB7fTtcclxuICAgICAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2Uga3BpX1R5cGU6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQoXCIuY2FsZW5kYXJEaXYgI2RhdGVCb3hcIikudmFsKG5ldyBEYXRlKCkuZm9ybWF0KFwieXl5eVwiKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0aW1lID0gRGF0ZS5wYXJzZVRpbWUoJChcIi5jYWxlbmRhckRpdiAjZGF0ZUJveFwiKS52YWwoKSwgJ3l5eXktTU0tZGQgaGg6bW06c3MnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2Uga3BpX1R5cGUgKyAxOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKFwiLmNhbGVuZGFyRGl2ICNkYXRlQm94XCIpLnZhbChuZXcgRGF0ZSgpLmZvcm1hdChcInl5eXktTU1cIikpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGltZSA9IERhdGUucGFyc2VUaW1lKCQoXCIuY2FsZW5kYXJEaXYgI2RhdGVCb3hcIikudmFsKCksICd5eXl5LU1NLWRkIGhoOm1tOnNzJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuZGF0YS50aW1lID0gdGltZTtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZXR1cm5kYXRhO1xyXG5cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAq6I635Y+WS1BJXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB0eXBlIOaXtumXtOexu+Wei1xyXG4gICAgICAgICAgICAgKiBAcGFyYW0gdGltZSDml7bpl7RcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIGdldEtwaURhdGEodHlwZSwgdGltZSkge1xyXG5cclxuICAgICAgICAgICAgICAgICQuaHR0cC5hamF4KFwiL2luZGV4L2dldEluY29tZVN1bW1hcnlDaGFydFwiLCB7c3RhdERpbTogdHlwZSwgc3RhdFRpbWU6IHRpbWV9LCBmdW5jdGlvbiAoZGF0YSkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YS5zdWNjZXNzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGhvbWVfa3BpVmlldy5lY2hhcnRzS3BpKGRhdGEuZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICog5YiH5o2i5LqL5Lu2XHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICAkKCcjc2VsZWN0U2hvd1BTIGxpJykub2ZmKCdjbGljaycpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICQoJyNzZWxlY3RTaG93UFMgbGknKS5yZW1vdmVDbGFzcygnY3VyT24nKTtcclxuICAgICAgICAgICAgICAgICQodGhpcykuYWRkQ2xhc3MoJ2N1ck9uJyk7XHJcbiAgICAgICAgICAgICAgICB2YXIgX2ZtdCA9ICQodGhpcyk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuZGF0YShob21lX2twaVZpZXcuZ2V0VHlwZShfZm10LnZhbCgpKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgJChcIiNkYXRlQm94XCIpLnVuYmluZChcImNsaWNrXCIpLmJpbmQoXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIERhdGVQaWNrZXIoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGVGbXQ6IGhvbWVfa3BpVmlldy5mb3JtYXRUaW1lQnlEaW1lKF9mbXQudmFsKCkpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzU2hvd0NsZWFyOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9ucGlja2VkOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldEtwaURhdGEoaG9tZV9rcGlWaWV3LmdldFR5cGUoX2ZtdC52YWwoKSksIERhdGUucGFyc2VUaW1lKCQodGhpcykudmFsKCksICd5eXl5LU1NLWRkIGhoOm1tOnNzJykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF4RGF0ZTogbmV3IERhdGUoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgICAgZ2V0S3BpRGF0YShob21lX2twaVZpZXcuZ2V0VHlwZShfZm10LnZhbCgpKSwgcmV0dXJuZGF0YShob21lX2twaVZpZXcuZ2V0VHlwZShfZm10LnZhbCgpKSkudGltZSk7XHJcblxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGdldFR5cGU6IGZ1bmN0aW9uIChkaW0pIHtcclxuICAgICAgICAgICAgdmFyIHI7XHJcbiAgICAgICAgICAgIHN3aXRjaCAocGFyc2VJbnQoZGltKSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSA0OlxyXG4gICAgICAgICAgICAgICAgICAgIHIgPSAyO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSA1OlxyXG4gICAgICAgICAgICAgICAgICAgIHIgPSAxO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByO1xyXG5cclxuICAgICAgICB9LFxyXG4gICAgICAgIGZvcm1hdFRpbWVCeURpbWU6IGZ1bmN0aW9uIChkaW0pIHtcclxuICAgICAgICAgICAgdmFyIHIgPSBcIlwiO1xyXG4gICAgICAgICAgICBzd2l0Y2ggKHBhcnNlSW50KGRpbSkpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgMjpcclxuICAgICAgICAgICAgICAgICAgICByID0gTXNnLmRhdGVGb3JtYXQueXl5eW1tZGQ7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDQ6XHJcbiAgICAgICAgICAgICAgICAgICAgciA9ICd5eXl5LU1NJztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgNTpcclxuICAgICAgICAgICAgICAgIGNhc2UgNjpcclxuICAgICAgICAgICAgICAgICAgICByID0gTXNnLmRhdGVGb3JtYXQueXl5eTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcjtcclxuICAgICAgICB9LFxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOS7quihqOebmOWbvuW9olxyXG4gICAgICAgICAqIEBwYXJhbSBkYXRhXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgZWNoYXJ0c1N1bW1hcnk6IGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgIHZhciBicm9rZW5SYXRlID0gZGF0YS5hbHRlckN1cmVlbkJyb2tlblJhdGUgfHwgMjA7XHJcbiAgICAgICAgICAgIHZhciBqbGNoYXJ0QXJlYSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiamxnelwiKTsvL+S6pOa1geWFheeUteahqVxyXG4gICAgICAgICAgICB2YXIgemxjaGFydEFyZWEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInpsZ3pcIik7Ly/nm7TmtYHlhYXnlLXmoalcclxuICAgICAgICAgICAgdmFyIGR6Y2hhcnRBcmVhID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJkemd6XCIpOy8v5YWF55S156uZ54K5XHJcbiAgICAgICAgICAgIHZhciBzdW1tYXJ5X29wdGlvbiA9IHtcclxuICAgICAgICAgICAgICAgIGNvbG9yOiBbJyNmZmE1MDAnXSxcclxuICAgICAgICAgICAgICAgIHRvb2x0aXA6IHtcclxuICAgICAgICAgICAgICAgICAgICBmb3JtYXR0ZXI6IFwie2F9IDxici8+e2J9IDoge2N9JVwiXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgdG9vbGJveDoge1xyXG4gICAgICAgICAgICAgICAgICAgIHNob3c6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgZmVhdHVyZToge31cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBzZXJpZXM6IFtcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdnYXVnZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRldGFpbDoge2Zvcm1hdHRlcjogJ3t2YWx1ZX0lJ30sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IFt7dmFsdWU6IGJyb2tlblJhdGUsIG5hbWU6ICfmlYXpmpznjocnfV0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOicjZmZhNTAwJ1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIEVDaGFydHMuUmVuZGVyKGpsY2hhcnRBcmVhLCBzdW1tYXJ5X29wdGlvbiwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIEVDaGFydHMuUmVuZGVyKHpsY2hhcnRBcmVhLCBzdW1tYXJ5X29wdGlvbiwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIEVDaGFydHMuUmVuZGVyKGR6Y2hhcnRBcmVhLCBzdW1tYXJ5X29wdGlvbiwgdHJ1ZSk7XHJcblxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogS1BJ5bm05pyI5Zu+5b2iXHJcbiAgICAgICAgICogQHBhcmFtIGRhdGFcclxuICAgICAgICAgKi9cclxuICAgICAgICBlY2hhcnRzS3BpOiBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICB2YXIgaWQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZkbHRqX2NoYXJcIik7XHJcbiAgICAgICAgICAgIHZhciB0b29sdGlwcz1bTXNnLm1vZHVsZXMuaG9tZS5rcGlWaWV3LktQSS5jaGFyZ2VQb3dlckluY29tZSwgTXNnLm1vZHVsZXMuaG9tZS5rcGlWaWV3LktQSS5jaGFyZ2VTZXJ2ZUluY29tZV07XHJcbiAgICAgICAgICAgIHZhciBrcGlfb3B0aW9uID0ge1xyXG4gICAgICAgICAgICAgICAgbm9EYXRhTG9hZGluZ09wdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6IE1zZy5ub0RhdGEsXHJcbiAgICAgICAgICAgICAgICAgICAgZWZmZWN0OiAnYnViYmxlJyxcclxuICAgICAgICAgICAgICAgICAgICBlZmZlY3RPcHRpb246IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWZmZWN0OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuOiAwIC8v5rCU5rOh5Liq5pWw5Li6MFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGNvbG9yOiBbJyNmZmMyNDAnLCAnI2ZmYzI0MCddLFxyXG4gICAgICAgICAgICAgICAgdG9vbHRpcDoge1xyXG4gICAgICAgICAgICAgICAgICAgIHRyaWdnZXI6ICdheGlzJyxcclxuICAgICAgICAgICAgICAgICAgICBheGlzUG9pbnRlcjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsaW5lU3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAnI2I0YTY5MSdcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgZm9ybWF0dGVyOiB0b29sdGlwc1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGxlZ2VuZDoge1xyXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IFtNc2cubW9kdWxlcy5ob21lLmtwaVZpZXcuS1BJLmNoYXJnZVBvd2VySW5jb21lLCBNc2cubW9kdWxlcy5ob21lLmtwaVZpZXcuS1BJLmNoYXJnZVNlcnZlSW5jb21lXSxcclxuICAgICAgICAgICAgICAgICAgLyogIGZvcm1hdHRlcjogZnVuY3Rpb24gKHZhbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvISogIGlmICh2YWwudHJpbSgpID09IE1zZy5wYXJ0aWFscy5tYWluLnJtLmRheUNhcFBycGZpdC5kYXRhLmRheUNhcCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbCtcIihcIisgeVVuaXQrXCIpXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsLnRyaW0oKSA9PSBNc2cucGFydGlhbHMubWFpbi5ybS5kYXlDYXBQcnBmaXQuZGF0YS5wcm9maXRzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmFsICtcIihcIisgeTJVbml0K1wiKVwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbC50cmltKCkgPT0gTXNnLnBhcnRpYWxzLm1haW4ucm0uZGF5Q2FwUHJwZml0LmRhdGEudXNlUG93ZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWwgK1wiKFwiKyB5VW5pdCtcIilcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbDsqIS9cclxuICAgICAgICAgICAgICAgICAgICB9LCovXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRleHRTdHlsZTp7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOicjYjRhNjkxJ1xyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgYm9yZGVyQ29sb3I6JyNiNGE2OTEnLFxyXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkTW9kZTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgeTonMTVweCdcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBncmlkOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgeDogJzEwJScsXHJcbiAgICAgICAgICAgICAgICAgICAgeDI6ICcxMCUnLFxyXG4gICAgICAgICAgICAgICAgICAgIHkyOiAnMTAlJyxcclxuICAgICAgICAgICAgICAgICAgICB5OiAgJzI1JScsXHJcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbkxhYmVsOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIGJvcmRlckNvbG9yOiAnI0VFRUVFRSdcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB4QXhpczogW1xyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2NhdGVnb3J5JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogZGF0YS54QXhpcyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXhpc1RpY2s6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsaWduV2l0aExhYmVsOiB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF4aXNMaW5lOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lU3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogJyNiNGE2OTEnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNwbGl0TGluZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvdzogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmVTdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAnI2I0YTY5MScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2Rhc2hlZCdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICB5QXhpczogW1xyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogTXNnLnVuaXQuV1JNQlVuaXQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICd2YWx1ZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgbmFtZVRleHRTdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IFwiI2I0YTY5MVwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF4aXNMaW5lOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lU3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogJyNiNGE2OTEnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNwbGl0TGluZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvdzogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmVTdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAnI2I0YTY5MScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2Rhc2hlZCdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3BsaXROdW1iZXI6NFxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICBzZXJpZXM6IFtcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IE1zZy5tb2R1bGVzLmhvbWUua3BpVmlldy5LUEkuY2hhcmdlUG93ZXJJbmNvbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdiYXInLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBiYXJHYXA6ICcxMCUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBiYXJDYXRlZ29yeUdhcDogJzUwJScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhcldpZHRoOiAnMTAnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiBkYXRhLnkxQXhpcyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbVN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3JtYWw6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYXJCb3JkZXJSYWRpdXM6IDcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgejogMFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IE1zZy5tb2R1bGVzLmhvbWUua3BpVmlldy5LUEkuY2hhcmdlU2VydmVJbmNvbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdsaW5lJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYmFyV2lkdGg6ICcxMycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IGRhdGEueTJBeGlzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtU3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vcm1hbDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhckJvcmRlclJhZGl1czogNyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB6OiAxXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIEVDaGFydHMuUmVuZGVyKGlkLCBrcGlfb3B0aW9uLCB0cnVlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfTtcclxuICAgIHJldHVybiBob21lX2twaVZpZXc7XHJcbn0pOyJdLCJmaWxlIjoibW9kdWxlcy9ob21lL2twaVZpZXcuanMifQ==
