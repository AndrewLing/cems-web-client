/**
 * 图表工具，基于 echarts 3.4.0
 */
(function () {
    "use strict";
    define(['jquery', 'plugins/echarts/echarts-3.min','plugins/zrender-2.1.0/src/zrender'], function ($, echarts,zrender) {
        window.ECharts = {
        	echarts: echarts,
            // 图表对象缓存
            Cache: {},
            // 图表主题
            Theme: "macarons",
            // 图表配置参数
            _option: {},
            // 是否显示Loading
            IsShowLoading: false,
            //右键保存图片
            saveImage: function (id, option, isMerge, chart) {
                option = $.extend({}, ECharts.OptionTemplate.CommonOption, option);
                $('#' + id).bind("contextmenu", function (event) {
                    if ($('#imgSave') && $('#imgSave').length) {
                        $('#imgSave').remove();
                    }
                    if (option.imageSave) {
                        var imgSrc;
                        try {
                            imgSrc = chart.getDataURL("png");
                        } catch (e) {
                        }
                        if (imgSrc) {
                            var downloadLink = document.createElement('a');
                            //downloadLink.onclick = _saveImageForIE;
                            downloadLink.href = imgSrc;
                            downloadLink.setAttribute(
                                'download', option.imageName + '.png'
                            );
                            downloadLink.innerHTML = Msg.op.exportPNG;
                            var $ul = $('<ul id="imgSave"/>');
                            var $li = $('<li/>');

                            var left = event.pageX + "px";
                            var top = event.pageY + "px";

                            $ul.css({
                                'top': top,
                                'left': left
                            });
                            $ul.append($li);
                            $('body').append($ul);
                            $li.append($(downloadLink));
                        }
                    }
                    return false;
                });
                $("body").click(function (event) {
                    if ($("#imgSave") && $("#imgSave").length) {
                        $("#imgSave").remove();
                    }
                });
            },

            /**
             * 渲染图表
             * @param id 容器ID
             * @param option 图表配置
             * @param isMerge 是否合并
             */
            Render: function (id, option, isMerge) {
                this._option = option;
                var self = this;
                var chart, container;
                if (id instanceof HTMLElement) {
                    container = id;
                    id = id.id;
                } else {
                    container = document.getElementById(id);
                }
                this._option.domId = container;
                if (!isMerge) {
                    self.Dispose(id);
                }

                if (!container) return;

                chart = echarts.init(container, self.Theme);
                if (self.IsShowLoading) {
                    //图表显示提示信息
                    chart.showLoading({
                        text: Msg.ajax.loading
                    });
                }
                self.Cache[id] = chart;

                try {
                    $(container).resize(function () {
                        setTimeout(function () {
                            ECharts.Resize(id);
                        }, 200);
                    });

                    option = $.extend({}, ECharts.OptionTemplate.CommonOption, option);

                    //数据检查
                    if (this._noDataCheck.check(option)) {
                        ECharts.saveImage(id, option, isMerge, chart);
                        return;
                    }

                    //无数据时的默认样式，当前实现的是饼图样式，其他图可继续扩展
                    var qualifyOpt = option;
                    var checkSeries = qualifyOpt.series;
                    $.each(checkSeries,function(index,item){
                        switch(item.type){
                            case "pie":
                                var itamdatas = [];
                                var colorDataFlag = true;
                                item.data && $.each(item.data,function(index,item){
                                    if(isNaN(item)){
                                        if(Number(item.value)===0){
                                            colorDataFlag = colorDataFlag&&true;
                                            itamdatas.push(item);
                                        }else {
                                            colorDataFlag = false;
                                        }
                                    }else{
                                        colorDataFlag = false
                                    }

                                })
                                if(colorDataFlag){ //数据全为0
                                    var roseType = item.roseType;
                                    qualifyOpt.tooltip.show = false;
                                    qualifyOpt.tooltip.showContent = false;
                                    item.data && $.each(item.data,function(index,item){
                                        item.value = ''; //数据全置空
                                        if(!!roseType) return true; //如果是展示成南丁格尔图，则不用下面的样式
                                        item.itemStyle.normal.color = ECharts.Graphic.LinearGradient({
                                            offsetColors: [{
                                                offset: 0, color: '#fff' // 0% 处的颜色
                                            }, {
                                                offset: 0.5, color: '#eee' // 50% 处的颜色
                                            }, {
                                                offset: 1, color: '#fff' // 100% 处的颜色
                                            }]
                                        })
                                    })
                                }
                                break;
                        }
                    })
                    $.extend(option,qualifyOpt);


                    if (option.yAxis && option.yAxis[0].type == 'value') {
                        var max = 0, min = 0;
                        for (var i = 0; i < option.series.length; i++) {
                            if (option.series[i].type == 'line' || option.series[i].type == 'bar') {
                                //var index = option.series[i].yAxisIndex || 0;
                                var data = option.series[i].data;
                                max = Math.max(
                                    data.removeAll('-').removeAll('').removeAll('_').max(),
                                    (max || 0)
                                );
                                min = Math.min(
                                    data.removeAll('-').removeAll('').removeAll('_').min(),
                                    (min || 0)
                                );
                                //option.yAxis[index].boundaryGap = [0, 0];
                                //option.yAxis[index].precision = 3; // TODO 小数位限制
                                //if ( (max == 1 && min == 1) || (max == -1 && min == -1)
                                //    //|| data.removeAll('-').removeAll('').removeAll('_').min() == max
                                //    //|| data.removeAll('-').removeAll('').removeAll('_').max() == min
                                //    ) {
                                //    option.yAxis[index].splitNumber = 2;
                                //}
                                //if (max == 1 && min != -1) {
                                //    option.yAxis[index].max = max;
                                //}
                                //else if (max > 0 && max < 1) {
                                //    option.yAxis[index].max = max;
                                //    option.yAxis[index].boundaryGap = [0, 0];
                                //}
                                //if (min == -1 && max != 1) {
                                //    option.yAxis[index].min = min;
                                //    //option.yAxis[index].boundaryGap = [-0.01, 0.01];
                                //}
                                //else if (min < 0 && min > -1) {
                                //    option.yAxis[index].min = min;
                                //    //option.yAxis[index].boundaryGap = [-0.0001, 0];
                                //}
                            }
                        }
                        if (max == 1 && min >= 0) {
                            for (i = 0; i < option.yAxis.length; i++) {
                                option.yAxis[i].boundaryGap = [0, 0.00001];
                                option.yAxis[i].splitNumber = 2;
                            }
                        }
                        if (min == -1 && max <= 0) {
                            for (i = 0; i < option.yAxis.length; i++) {
                                option.yAxis[i].boundaryGap = [-0.0001, 0];
                                option.yAxis[i].splitNumber = 2;
                            }
                        }
                    }
                    chart.setOption(option, isMerge);

                    ECharts.saveImage(id, option, isMerge, chart);
                    $(container).bind('mouseup mouseout', function () {
                        self.Resize(id);
                    });
                } catch (e) {
                    console.error(e);
                } finally {
                    if (self.IsShowLoading) {
                        chart.hideLoading();
                    }
                }

                return chart;
            },

            Refresh: function (id, newOption) {
                var self = this;
                self.Cache[id] && self.Cache[id].setOption(newOption, true);
                return self.Cache[id];
            },

            /**
             * 视图区域大小变化更新，默认绑定节点的resize事件
             */
            Resize: function (id) {
                var self = this;
                return (function (id) {
                    try {
                        if (id) {
                            self.Cache[id] && self.Cache[id].resize && self.Cache[id].resize();
                        } else {
                            for (var key in self.Cache) {
                                var c = self.Cache[key];
                                c && c.dom && $(c.dom).is(':visible') && c.resize && c.resize();
                            }
                        }
                    } catch (e) {
                    }

                    return self;
                })(id);
            },

            /**
             * 释放，释放后echarts实例不可用
             */
            Dispose: function (id) {
                var self = this;
                return (function (id) {
                    try {
                        if (id) {
                            self.Cache[id] && self.Cache[id].dispose && self.Cache[id].dispose();
                        } else {
                            for (var key in self.Cache) {
                                var c = self.Cache[key];
                                c && c.dispose && c.dispose();
                            }
                        }
                    } catch (e) {
                    }

                    return self;
                })(id);
            },

            /**
             * 事件处理
             */
            EVENT: {
                // -----------------------基础事件-----------------------
                REFRESH: 'refresh', // 刷新
                RESTORE: 'restore', // 还原
                RESIZE: 'resize', // 显示容器大小变化
                CLICK: 'click', // 点击
                DBLCLICK: 'dblclick', // 双击
                HOVER: 'hover', // 悬浮
                MOUSEOUT: 'mouseout', // 鼠标离开图表

                // ---------------------交互逻辑事件--------------------
                DATA_CHANGED: 'dataChanged',  // 数据修改，如拖拽重计算
                DATA_ZOOM: 'dataZoom', // 数据区域缩放
                DATA_RANGE: 'dataRange', // 值域漫游
                DATA_RANGE_SELECTED: 'dataRangeSelected', //值域开关选择
                DATA_RANGE_HOVERLINK: 'dataRangeHoverLink', // 值域漫游hover
                LEGEND_SELECTED: 'legendSelected', // 图例开关选择
                LEGEND_HOVERLINK: 'legendHoverLink', // 图例hover
                MAP_SELECTED: 'mapSelected', // 地图选择
                PIE_SELECTED: 'pieSelected', // 饼图选择
                MAGIC_TYPE_CHANGED: 'magicTypeChanged', // 动态类型切换
                DATA_VIEW_CHANGED: 'dataViewChanged', // 数据视图修改
                TIMELINE_CHANGED: 'timelineChanged', //时间轴变化
                MAP_ROAM: 'mapRoam' //地图漫游
            },

            /**
             * 数据格式化
             */
            DataFormate: {

                /**
                 * 无分组数据初始化，这种数据格式多用于饼图、单一的柱形图的数据源
                 * @param data {Object} 格式如：[{name:XXX,value:XXX},{name:XXX,value:XXX},……]
                 * @return {Object} {category:Array, data:Array}
                 */
                NoGroupData: function (data) {
                    var categories = [];
                    var datas = [];
                    for (var i = 0; i < data.length; i++) {
                        categories.push(data[i].name || "");
                        datas.push({name: data[i].name, value: data[i].value || 0});
                    }
                    return {category: categories, data: datas};
                },

                /**
                 * 有分组数据初始化，这种格式的数据多用于展示多条折线图、分组的柱形图等
                 * @param data {Object} 格式如：[{name:XXX,group:XXX,value:XXX},{name:XXX,group:XXX,value:XXX},……]
                 * @param type {string} 渲染的图表类型：可以是‘line’,‘bar’
                 * @param isStack {boolean} 是否为堆积图
                 * @return {Object} {category:Array, xAxis:Array, series:Array}
                 */
                GroupData: function (data, type, isStack) {
                    var chartType = "line";
                    if (type) {
                        chartType = type || "line";
                        var xAxis = [];
                        var group = [];
                        var series = [];
                        for (var i = 0; i < data.length; i++) {
                            for (var j = 0; j < xAxis.length && xAxis[j] != data[i].name; j++);

                            if (j == xAxis.length) {
                                xAxis.push(data[i].name);
                            }

                            for (var k = 0; k < group.length && group[k] != data[i].group; k++);

                            if (k == group.length) {
                                group.push(data[i].group);
                            }
                        }

                        for (var i = 0; i < group.length; i++) {
                            var temp = [];
                            for (var j = 0; j < data.length; j++) {
                                if (group[i] == data[j].group) {
                                    if (type == "map") {
                                        temp.push({name: data[j].name, value: data[i].value});
                                    } else {
                                        temp.push(data[j].value);
                                    }
                                }
                            }
                            var seriesTemp;
                            switch (type) {
                                case 'line':
                                    seriesTemp = {name: group[i], data: temp, type: chartType};
                                    if (isStack)
                                        seriesTemp = $.extend({}, {stack: 'stack'}, seriesTemp);
                                    break;
                                case 'bar' :
                                    seriesTemp = {name: group[i], data: temp, type: chartType};
                                    if (isStack)
                                        seriesTemp = $.extend({}, {stack: 'stack'}, seriesTemp);
                                    break;
                                case 'map':
                                    seriesTemp = {
                                        name: group[i],
                                        type: chartType,
                                        mapType: 'china',
                                        selectedMode: 'single',
                                        itemStyle: {
                                            normal: {
                                                label: {show: true}
                                            },
                                            emphasis: {
                                                label: {show: true}
                                            }
                                        },
                                        data: temp
                                    };
                                    break;
                                default :
                                    seriesTemp = {name: group[i], data: temp, type: chartType};
                            }
                            series.push(seriesTemp);
                        }
                    }
                    return {category: group, xAxis: xAxis, series: series};
                }
            },

            /**
             * 无数据时，显示默认样式，目前只实现了气泡显示
             *
             */
            _noDataCheck: {
                _option: {},
                /*
                 * 检查数据
                 * @param magicOption:获取到的echarts的参数配置
                 * */
                check: function (magicOption) {
                    this._option = magicOption;
                    this._option.flag = true; //有data值
                    var series = magicOption.series;
                    for (var i = 0, l = series.length; i < l; i++) {
                        if (series[i].data && series[i].data.length > 0
                            || series[i].markPoint && series[i].markPoint.data && series[i].markPoint.data.length > 0
                            || series[i].markLine && series[i].markLine.data && series[i].markLine.data.length > 0
                            || series[i].nodes && series[i].nodes.length > 0
                            || series[i].links && series[i].links.length > 0
                            || series[i].matrix && series[i].matrix.length > 0
                            || series[i].eventList && series[i].eventList.length > 0) {
                            this._option.flag = false;
                        }
                    }
                    if(!this._option.flag){
                        return;
                    }
                    var loadOption = this._option && this._option.noDataLoadingOption || {
                            text: this._option && this._option.noDataText,
                            effect: this._option && this._option.noDataEffect
                        };
                    this.showLoading(loadOption);
                    return true;

                },
                /*
                 * 检查数据
                 * @param loadingOption:参数封装，后面可扩展
                 * */
                showLoading: function (loadingOption) {
                    loadingOption = loadingOption || {};
                    var textStyle = loadingOption.textStyle || {};
                    loadingOption.textStyle = textStyle;
                    textStyle.text = loadingOption.text || this._option && this._option.loadingText;
                    if (loadingOption.x != null) {
                        textStyle.x = loadingOption.x;
                    }
                    if (loadingOption.y != null) {
                        textStyle.y = loadingOption.y;
                    }
                    loadingOption.effectOption = loadingOption.effectOption || {};
                    loadingOption.effectOption.textStyle = textStyle;

                    this.zrShowLoading(loadingOption, this._option.domId);
                    return this;
                },
                /*
                 * 绘制显示动画
                 * @param loadingOption：参数集合（主要有：显示文字，效果，气泡个数）
                 * @param id：需要绘制的容器id <br><br>
                 * example：
                 * <pre>
                 *  noDataLoadingOption: {<br>
                 *      text: '暂无数据',<br>
                 *      effect: 'bubble',<br>
                 *      effectOption: {<br>
                 *          effect: {<br>
                 *              n: 0<br>
                 *          }<br>
                 *      }<br>
                 *  }<br>
                 * </pre>
                 * */
                zrShowLoading: function (loadingOption, id) {
                    var n = 0; //默认0个气泡
                    if (loadingOption.effect === 'bubble') {
                        n = loadingOption.effectOption.effect || 0;
                    }
                    var zr = zrender.init(id);
                    var animationTicket;
                    clearInterval(animationTicket);
                    zr.clear();
                    var color = require(['plugins/zrender-2.1.0/src/tool/color']);
                    var colorIdx = 0;
                    var width = Math.ceil(zr.getWidth());
                    var height = Math.ceil(zr.getHeight());

                    var i;
                    var shapeList = [];
                    require(['plugins/zrender-2.1.0/src/shape/Circle'], function (CircleShape) {
                        // 动画元素
                        for (i = 0; i < n; i++) {
                            shapeList[i] = new CircleShape({
                                style: {
                                    x: Math.ceil(Math.random() * width),
                                    y: Math.ceil(Math.random() * height),
                                    r: Math.ceil(Math.random() * 40),
                                    brushType: Math.ceil(Math.random() * 100) % 3 >= 1 ? 'both' : 'stroke',
                                    color: 'rgba('
                                    + Math.round(Math.random() * 256) + ','
                                    + Math.round(Math.random() * 256) + ','
                                    + Math.round(Math.random() * 256) + ', 0.3)',
                                    strokeColor: 'rgba('
                                    + Math.round(Math.random() * 256) + ','
                                    + Math.round(Math.random() * 256) + ','
                                    + Math.round(Math.random() * 256) + ', 0.3)',
                                    lineWidth: 3
                                },
                                _animationX: Math.ceil(Math.random() * 20),
                                _animationY: Math.ceil(Math.random() * 20),
                                hoverable: false
                            });
                            if (shapeList[i].style.x < 100 || shapeList[i].style.x > (width - 100)) {
                                shapeList[i].style.x = width / 2;
                            }
                            if (shapeList[i].style.y < 100 || shapeList[i].style.y > (height - 100)) {
                                shapeList[i].style.y = height / 2;
                            }
                            zr.addShape(shapeList[i]);
                        }
                        zr.addShape(new CircleShape({
                            position: [100, 100],
                            rotation: [0, 0, 0],
                            scale: [1, 1],
                            style: {
                                x: (width / 2 - 50),
                                y: (height / 2 - 100),
                                r: 50,
                                color: 'transparent',
                                textColor: '#666',
                                strokeColor: "transparent",
                                lineWidth: 0,
                                text: loadingOption.effectOption.textStyle.text,
                                textPosition: 'inside'
                            },
                            hoverable: false
                        }));
                        // 绘画，利用render的callback可以在绘画完成后马上开始动画
                        zr.render(function () {
                            animationTicket = setInterval(function () {
                                var style;
                                for (i = 0; i < n; i++) {
                                    // 可以跳过
                                    style = shapeList[i].style;
                                    if (style.brushType == 'both') {
                                        if (style.x + style.r + shapeList[i]._animationX >= width
                                            || style.x - style.r + shapeList[i]._animationX <= 0
                                        ) {
                                            shapeList[i]._animationX = -shapeList[i]._animationX;
                                        }
                                        shapeList[i].style.x += shapeList[i]._animationX;
                                    }

                                    if (style.brushType == 'both') {
                                        if (style.y + style.r + shapeList[i]._animationY >= height ||
                                            style.y - style.r + shapeList[i]._animationY <= 0) {
                                            shapeList[i]._animationY = -shapeList[i]._animationY;
                                        }
                                        shapeList[i].style.y += shapeList[i]._animationY;
                                    }
                                    else {
                                        if (style.y - shapeList[i]._animationY + style.r <= 0) {
                                            shapeList[i].style.y = height + style.r;
                                            shapeList[i].style.x = Math.ceil(Math.random() * width);
                                        }
                                        shapeList[i].style.y -= shapeList[i]._animationY;
                                    }


                                    // 就看这句就行
                                    zr.modShape(shapeList[i].id, shapeList[i]);
                                }
                                zr.refresh();
                            }, 150);
                        });

                    });
                }
            },

            /**
             * 初始化常用的图表类型
             */
            OptionTemplate: {
                /**
                 * 通用的图表基本配置
                 */
                CommonOption: {
                    grid: {
                        borderWidth: 0
                    },
                    tooltip: {
                        trigger: 'axis', // tooltip触发方式：axis以X轴线触发，item以每一个数据项触发
                        axisPointer: {
                            type: 'shadow'
                        }
                    },
                    toolbox: {
                        show: false
                    },
                    //yAxis: [{
                    //    boundaryGap: [0, 0]
                    //}],
                    legend: {
                        show: false, // 默认不显示图例
                        selectedMode: false, // 选择模式，默认开启图例开关，可选single，multiple
                        data: []
                    },
                    //calculable: false, // 是否拖拽重计算
                    //animation: false,  // 是否启用动画
                    imageSave: false, // 是否可以右键保存图片
                    imageName: 'image' // 默认保存的图片名称
                },

                /**
                 * 饼图 配置
                 * @param data 数据 格式：[{name:XXX,value:XXX},……]
                 * @param name 显示标题
                 * @return option
                 */
                Pie: function (data, name) {
                    var pieDatas = ECharts.DataFormate.NoGroupData(data);
                    var option = {
                        title: {
                            text: name || ''
                        },
                        tooltip: {
                            tigger: 'item'
                        },
                        legend: {
                            selectedMode: 'multiple',
//                    orient: 'vertical',
                            data: pieDatas.category
                        },
                        series: [
                            {
                                name: name || "",
                                type: 'pie',
                                radius: '65%',
                                center: ['50%', '50%'],
                                data: pieDatas.data
                            }
                        ]
                    };
                    return $.extend({}, ECharts.OptionTemplate.CommonOption, option);
                },

                /**
                 * 折线图 配置
                 * @param data 数据 格式：[{name:XXX,value:XXX,group:XXX},……]
                 * @param name 显示标题
                 * @param xName x轴显示名称
                 * @param yName y轴显示名称
                 * @param isStack 是否为堆积图
                 * @return option
                 */
                Lines: function (data, name, xName, yName, isStack) {
                    var stackLineDatas = ECharts.DataFormate.GroupData(data, 'line', isStack);
                    var option = {
                        title: {
                            text: name || ''
                        },
                        legend: {
                            data: stackLineDatas.category
                        },
                        xAxis: [
                            {
                                name: xName || '',
                                type: 'category',
                                boundaryGap: false,
                                data: stackLineDatas.xAxis
                            }
                        ],
                        yAxis: [
                            {
                                name: yName || '',
                                type: 'value',
                                splitArea: {show: true}
                            }
                        ],
                        series: stackLineDatas.series
                    };
                    return $.extend({}, ECharts.OptionTemplate.CommonOption, option);
                },

                /**
                 * 柱状图 配置
                 * @param data 数据 格式：[{name:XXX,group:XXX,value:XXX},……]
                 * @param name 显示标题
                 * @param xName x轴显示名称
                 * @param yName y轴显示名称
                 * @param isStack 是否为堆积图
                 * @return option
                 */
                Bars: function (data, name, xName, yName, isStack) {
                    var stackBarDatas = ECharts.DataFormate.GroupData(data, 'bar', isStack);
                    var option = {
                        title: {
                            text: name || ''
                        },
                        legend: {
                            data: stackBarDatas.category
                        },
                        xAxis: [
                            {
                                name: xName || '',
                                type: 'category',
                                axisLabel: {
                                    show: true,
                                    interval: 'auto',
                                    rotate: 0,
                                    margin: 8
                                },
                                data: stackBarDatas.xAxis
                            }
                        ],
                        yAxis: [
                            {
                                name: yName || '',
                                type: 'value',
                                splitArea: {show: true}
                            }
                        ],
                        series: stackBarDatas.series
                    };
                    return $.extend({}, ECharts.OptionTemplate.CommonOption, option);
                }

            },

            /**
            *配置渐变和纹理
            */
            Graphic:{
                /** 线性渐变，前四个参数分别是 x0, y0, x2, y2, 范围从 0 - 1
                *   相当于在图形包围盒中的百分比，如果最后一个参数传 true，则该四个值是绝对的像素位置
                * eg： ECharts.Graphic.LinearGradient({
                    x0:0,
                    y0:0,
                    x2:0,
                    y2:1,
                    isAbsoluteOffset:false,
                    offsetColors: [{
                        offset: 0, color: '#fff' // 0% 处的颜色
                    }, {
                        offset: 0.5, color: '#eee' // 50% 处的颜色
                    }, {
                        offset: 1, color: '#fff' // 100% 处的颜色
                    }]
                */
                LinearGradient:function(params){
                    var params = params||{};
                    //配置默认样式
                    var _params={
                        x0:params.x0||0,
                        y0:params.y0||0,
                        x2:params.x2||0,
                        y2:params.y2||1,
                        offsetColors:params.offsetColors || [{
                            offset: 0, color: '#8fe5fa' // 0% 处的颜色
                        },  {
                            offset: 0.5, color: '#fff' // 100% 处的颜色
                        },{
                            offset: 1, color: '#8fe5fa' // 0% 处的颜色
                        }],
                        isAbsoluteOffset:params.isAbsoluteOffset||false
                    };
                    return new echarts.graphic.LinearGradient(_params.x0||0, _params.y0||0, _params.x2||0, _params.y2||1, _params.offsetColors, _params.isAbsoluteOffset||false)

                }
            }
        };

        return ECharts
    });

})();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL2VjaGFydHMvRUNoYXJ0cy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICog5Zu+6KGo5bel5YW377yM5Z+65LqOIGVjaGFydHMgMy40LjBcclxuICovXHJcbihmdW5jdGlvbiAoKSB7XHJcbiAgICBcInVzZSBzdHJpY3RcIjtcclxuICAgIGRlZmluZShbJ2pxdWVyeScsICdwbHVnaW5zL2VjaGFydHMvZWNoYXJ0cy0zLm1pbicsJ3BsdWdpbnMvenJlbmRlci0yLjEuMC9zcmMvenJlbmRlciddLCBmdW5jdGlvbiAoJCwgZWNoYXJ0cyx6cmVuZGVyKSB7XHJcbiAgICAgICAgd2luZG93LkVDaGFydHMgPSB7XHJcbiAgICAgICAgXHRlY2hhcnRzOiBlY2hhcnRzLFxyXG4gICAgICAgICAgICAvLyDlm77ooajlr7nosaHnvJPlrZhcclxuICAgICAgICAgICAgQ2FjaGU6IHt9LFxyXG4gICAgICAgICAgICAvLyDlm77ooajkuLvpophcclxuICAgICAgICAgICAgVGhlbWU6IFwibWFjYXJvbnNcIixcclxuICAgICAgICAgICAgLy8g5Zu+6KGo6YWN572u5Y+C5pWwXHJcbiAgICAgICAgICAgIF9vcHRpb246IHt9LFxyXG4gICAgICAgICAgICAvLyDmmK/lkKbmmL7npLpMb2FkaW5nXHJcbiAgICAgICAgICAgIElzU2hvd0xvYWRpbmc6IGZhbHNlLFxyXG4gICAgICAgICAgICAvL+WPs+mUruS/neWtmOWbvueJh1xyXG4gICAgICAgICAgICBzYXZlSW1hZ2U6IGZ1bmN0aW9uIChpZCwgb3B0aW9uLCBpc01lcmdlLCBjaGFydCkge1xyXG4gICAgICAgICAgICAgICAgb3B0aW9uID0gJC5leHRlbmQoe30sIEVDaGFydHMuT3B0aW9uVGVtcGxhdGUuQ29tbW9uT3B0aW9uLCBvcHRpb24pO1xyXG4gICAgICAgICAgICAgICAgJCgnIycgKyBpZCkuYmluZChcImNvbnRleHRtZW51XCIsIGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICgkKCcjaW1nU2F2ZScpICYmICQoJyNpbWdTYXZlJykubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQoJyNpbWdTYXZlJykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb24uaW1hZ2VTYXZlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpbWdTcmM7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbWdTcmMgPSBjaGFydC5nZXREYXRhVVJMKFwicG5nXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGltZ1NyYykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRvd25sb2FkTGluayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vZG93bmxvYWRMaW5rLm9uY2xpY2sgPSBfc2F2ZUltYWdlRm9ySUU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb3dubG9hZExpbmsuaHJlZiA9IGltZ1NyYztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvd25sb2FkTGluay5zZXRBdHRyaWJ1dGUoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2Rvd25sb2FkJywgb3B0aW9uLmltYWdlTmFtZSArICcucG5nJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvd25sb2FkTGluay5pbm5lckhUTUwgPSBNc2cub3AuZXhwb3J0UE5HO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyICR1bCA9ICQoJzx1bCBpZD1cImltZ1NhdmVcIi8+Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgJGxpID0gJCgnPGxpLz4nKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGVmdCA9IGV2ZW50LnBhZ2VYICsgXCJweFwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRvcCA9IGV2ZW50LnBhZ2VZICsgXCJweFwiO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1bC5jc3Moe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICd0b3AnOiB0b3AsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2xlZnQnOiBsZWZ0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1bC5hcHBlbmQoJGxpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoJ2JvZHknKS5hcHBlbmQoJHVsKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRsaS5hcHBlbmQoJChkb3dubG9hZExpbmspKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICQoXCJib2R5XCIpLmNsaWNrKGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICgkKFwiI2ltZ1NhdmVcIikgJiYgJChcIiNpbWdTYXZlXCIpLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKFwiI2ltZ1NhdmVcIikucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICog5riy5p+T5Zu+6KGoXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSBpZCDlrrnlmahJRFxyXG4gICAgICAgICAgICAgKiBAcGFyYW0gb3B0aW9uIOWbvuihqOmFjee9rlxyXG4gICAgICAgICAgICAgKiBAcGFyYW0gaXNNZXJnZSDmmK/lkKblkIjlubZcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIFJlbmRlcjogZnVuY3Rpb24gKGlkLCBvcHRpb24sIGlzTWVyZ2UpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX29wdGlvbiA9IG9wdGlvbjtcclxuICAgICAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICAgICAgICAgIHZhciBjaGFydCwgY29udGFpbmVyO1xyXG4gICAgICAgICAgICAgICAgaWYgKGlkIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb250YWluZXIgPSBpZDtcclxuICAgICAgICAgICAgICAgICAgICBpZCA9IGlkLmlkO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9vcHRpb24uZG9tSWQgPSBjb250YWluZXI7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWlzTWVyZ2UpIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLkRpc3Bvc2UoaWQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmICghY29udGFpbmVyKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgY2hhcnQgPSBlY2hhcnRzLmluaXQoY29udGFpbmVyLCBzZWxmLlRoZW1lKTtcclxuICAgICAgICAgICAgICAgIGlmIChzZWxmLklzU2hvd0xvYWRpbmcpIHtcclxuICAgICAgICAgICAgICAgICAgICAvL+WbvuihqOaYvuekuuaPkOekuuS/oeaBr1xyXG4gICAgICAgICAgICAgICAgICAgIGNoYXJ0LnNob3dMb2FkaW5nKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogTXNnLmFqYXgubG9hZGluZ1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgc2VsZi5DYWNoZVtpZF0gPSBjaGFydDtcclxuXHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICQoY29udGFpbmVyKS5yZXNpemUoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEVDaGFydHMuUmVzaXplKGlkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgMjAwKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uID0gJC5leHRlbmQoe30sIEVDaGFydHMuT3B0aW9uVGVtcGxhdGUuQ29tbW9uT3B0aW9uLCBvcHRpb24pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvL+aVsOaNruajgOafpVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9ub0RhdGFDaGVjay5jaGVjayhvcHRpb24pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIEVDaGFydHMuc2F2ZUltYWdlKGlkLCBvcHRpb24sIGlzTWVyZ2UsIGNoYXJ0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy/ml6DmlbDmja7ml7bnmoTpu5jorqTmoLflvI/vvIzlvZPliY3lrp7njrDnmoTmmK/ppbzlm77moLflvI/vvIzlhbbku5blm77lj6/nu6fnu63mianlsZVcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcXVhbGlmeU9wdCA9IG9wdGlvbjtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgY2hlY2tTZXJpZXMgPSBxdWFsaWZ5T3B0LnNlcmllcztcclxuICAgICAgICAgICAgICAgICAgICAkLmVhY2goY2hlY2tTZXJpZXMsZnVuY3Rpb24oaW5kZXgsaXRlbSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaChpdGVtLnR5cGUpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcInBpZVwiOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpdGFtZGF0YXMgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY29sb3JEYXRhRmxhZyA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5kYXRhICYmICQuZWFjaChpdGVtLmRhdGEsZnVuY3Rpb24oaW5kZXgsaXRlbSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKGlzTmFOKGl0ZW0pKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKE51bWJlcihpdGVtLnZhbHVlKT09PTApe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yRGF0YUZsYWcgPSBjb2xvckRhdGFGbGFnJiZ0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0YW1kYXRhcy5wdXNoKGl0ZW0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfWVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yRGF0YUZsYWcgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvckRhdGFGbGFnID0gZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKGNvbG9yRGF0YUZsYWcpeyAvL+aVsOaNruWFqOS4ujBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJvc2VUeXBlID0gaXRlbS5yb3NlVHlwZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVhbGlmeU9wdC50b29sdGlwLnNob3cgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVhbGlmeU9wdC50b29sdGlwLnNob3dDb250ZW50ID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uZGF0YSAmJiAkLmVhY2goaXRlbS5kYXRhLGZ1bmN0aW9uKGluZGV4LGl0ZW0pe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS52YWx1ZSA9ICcnOyAvL+aVsOaNruWFqOe9ruepulxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoISFyb3NlVHlwZSkgcmV0dXJuIHRydWU7IC8v5aaC5p6c5piv5bGV56S65oiQ5Y2X5LiB5qC85bCU5Zu+77yM5YiZ5LiN55So5LiL6Z2i55qE5qC35byPXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLml0ZW1TdHlsZS5ub3JtYWwuY29sb3IgPSBFQ2hhcnRzLkdyYXBoaWMuTGluZWFyR3JhZGllbnQoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldENvbG9yczogW3tcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0OiAwLCBjb2xvcjogJyNmZmYnIC8vIDAlIOWkhOeahOminOiJslxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0OiAwLjUsIGNvbG9yOiAnI2VlZScgLy8gNTAlIOWkhOeahOminOiJslxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0OiAxLCBjb2xvcjogJyNmZmYnIC8vIDEwMCUg5aSE55qE6aKc6ImyXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfV1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICAkLmV4dGVuZChvcHRpb24scXVhbGlmeU9wdCk7XHJcblxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9uLnlBeGlzICYmIG9wdGlvbi55QXhpc1swXS50eXBlID09ICd2YWx1ZScpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1heCA9IDAsIG1pbiA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3B0aW9uLnNlcmllcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbi5zZXJpZXNbaV0udHlwZSA9PSAnbGluZScgfHwgb3B0aW9uLnNlcmllc1tpXS50eXBlID09ICdiYXInKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy92YXIgaW5kZXggPSBvcHRpb24uc2VyaWVzW2ldLnlBeGlzSW5kZXggfHwgMDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IG9wdGlvbi5zZXJpZXNbaV0uZGF0YTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXggPSBNYXRoLm1heChcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS5yZW1vdmVBbGwoJy0nKS5yZW1vdmVBbGwoJycpLnJlbW92ZUFsbCgnXycpLm1heCgpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAobWF4IHx8IDApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaW4gPSBNYXRoLm1pbihcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS5yZW1vdmVBbGwoJy0nKS5yZW1vdmVBbGwoJycpLnJlbW92ZUFsbCgnXycpLm1pbigpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAobWluIHx8IDApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL29wdGlvbi55QXhpc1tpbmRleF0uYm91bmRhcnlHYXAgPSBbMCwgMF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9vcHRpb24ueUF4aXNbaW5kZXhdLnByZWNpc2lvbiA9IDM7IC8vIFRPRE8g5bCP5pWw5L2N6ZmQ5Yi2XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9pZiAoIChtYXggPT0gMSAmJiBtaW4gPT0gMSkgfHwgKG1heCA9PSAtMSAmJiBtaW4gPT0gLTEpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgLy98fCBkYXRhLnJlbW92ZUFsbCgnLScpLnJlbW92ZUFsbCgnJykucmVtb3ZlQWxsKCdfJykubWluKCkgPT0gbWF4XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgLy98fCBkYXRhLnJlbW92ZUFsbCgnLScpLnJlbW92ZUFsbCgnJykucmVtb3ZlQWxsKCdfJykubWF4KCkgPT0gbWluXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgb3B0aW9uLnlBeGlzW2luZGV4XS5zcGxpdE51bWJlciA9IDI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy99XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9pZiAobWF4ID09IDEgJiYgbWluICE9IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgb3B0aW9uLnlBeGlzW2luZGV4XS5tYXggPSBtYXg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy99XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9lbHNlIGlmIChtYXggPiAwICYmIG1heCA8IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICBvcHRpb24ueUF4aXNbaW5kZXhdLm1heCA9IG1heDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICBvcHRpb24ueUF4aXNbaW5kZXhdLmJvdW5kYXJ5R2FwID0gWzAsIDBdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vaWYgKG1pbiA9PSAtMSAmJiBtYXggIT0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgIG9wdGlvbi55QXhpc1tpbmRleF0ubWluID0gbWluO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgIC8vb3B0aW9uLnlBeGlzW2luZGV4XS5ib3VuZGFyeUdhcCA9IFstMC4wMSwgMC4wMV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy99XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9lbHNlIGlmIChtaW4gPCAwICYmIG1pbiA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgb3B0aW9uLnlBeGlzW2luZGV4XS5taW4gPSBtaW47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgLy9vcHRpb24ueUF4aXNbaW5kZXhdLmJvdW5kYXJ5R2FwID0gWy0wLjAwMDEsIDBdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtYXggPT0gMSAmJiBtaW4gPj0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IG9wdGlvbi55QXhpcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbi55QXhpc1tpXS5ib3VuZGFyeUdhcCA9IFswLCAwLjAwMDAxXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb24ueUF4aXNbaV0uc3BsaXROdW1iZXIgPSAyO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtaW4gPT0gLTEgJiYgbWF4IDw9IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBvcHRpb24ueUF4aXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb24ueUF4aXNbaV0uYm91bmRhcnlHYXAgPSBbLTAuMDAwMSwgMF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9uLnlBeGlzW2ldLnNwbGl0TnVtYmVyID0gMjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBjaGFydC5zZXRPcHRpb24ob3B0aW9uLCBpc01lcmdlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgRUNoYXJ0cy5zYXZlSW1hZ2UoaWQsIG9wdGlvbiwgaXNNZXJnZSwgY2hhcnQpO1xyXG4gICAgICAgICAgICAgICAgICAgICQoY29udGFpbmVyKS5iaW5kKCdtb3VzZXVwIG1vdXNlb3V0JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLlJlc2l6ZShpZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcclxuICAgICAgICAgICAgICAgIH0gZmluYWxseSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYuSXNTaG93TG9hZGluZykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGFydC5oaWRlTG9hZGluZygpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY2hhcnQ7XHJcbiAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICBSZWZyZXNoOiBmdW5jdGlvbiAoaWQsIG5ld09wdGlvbikge1xyXG4gICAgICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5DYWNoZVtpZF0gJiYgc2VsZi5DYWNoZVtpZF0uc2V0T3B0aW9uKG5ld09wdGlvbiwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5DYWNoZVtpZF07XHJcbiAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICog6KeG5Zu+5Yy65Z+f5aSn5bCP5Y+Y5YyW5pu05paw77yM6buY6K6k57uR5a6a6IqC54K555qEcmVzaXpl5LqL5Lu2XHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBSZXNpemU6IGZ1bmN0aW9uIChpZCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIChmdW5jdGlvbiAoaWQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuQ2FjaGVbaWRdICYmIHNlbGYuQ2FjaGVbaWRdLnJlc2l6ZSAmJiBzZWxmLkNhY2hlW2lkXS5yZXNpemUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBzZWxmLkNhY2hlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGMgPSBzZWxmLkNhY2hlW2tleV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYyAmJiBjLmRvbSAmJiAkKGMuZG9tKS5pcygnOnZpc2libGUnKSAmJiBjLnJlc2l6ZSAmJiBjLnJlc2l6ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlbGY7XHJcbiAgICAgICAgICAgICAgICB9KShpZCk7XHJcbiAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICog6YeK5pS+77yM6YeK5pS+5ZCOZWNoYXJ0c+WunuS+i+S4jeWPr+eUqFxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgRGlzcG9zZTogZnVuY3Rpb24gKGlkKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gKGZ1bmN0aW9uIChpZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5DYWNoZVtpZF0gJiYgc2VsZi5DYWNoZVtpZF0uZGlzcG9zZSAmJiBzZWxmLkNhY2hlW2lkXS5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gc2VsZi5DYWNoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjID0gc2VsZi5DYWNoZVtrZXldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGMgJiYgYy5kaXNwb3NlICYmIGMuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlbGY7XHJcbiAgICAgICAgICAgICAgICB9KShpZCk7XHJcbiAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICog5LqL5Lu25aSE55CGXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBFVkVOVDoge1xyXG4gICAgICAgICAgICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS3ln7rnoYDkuovku7YtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgICAgICAgICAgUkVGUkVTSDogJ3JlZnJlc2gnLCAvLyDliLfmlrBcclxuICAgICAgICAgICAgICAgIFJFU1RPUkU6ICdyZXN0b3JlJywgLy8g6L+Y5Y6fXHJcbiAgICAgICAgICAgICAgICBSRVNJWkU6ICdyZXNpemUnLCAvLyDmmL7npLrlrrnlmajlpKflsI/lj5jljJZcclxuICAgICAgICAgICAgICAgIENMSUNLOiAnY2xpY2snLCAvLyDngrnlh7tcclxuICAgICAgICAgICAgICAgIERCTENMSUNLOiAnZGJsY2xpY2snLCAvLyDlj4zlh7tcclxuICAgICAgICAgICAgICAgIEhPVkVSOiAnaG92ZXInLCAvLyDmgqzmta5cclxuICAgICAgICAgICAgICAgIE1PVVNFT1VUOiAnbW91c2VvdXQnLCAvLyDpvKDmoIfnprvlvIDlm77ooahcclxuXHJcbiAgICAgICAgICAgICAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS3kuqTkupLpgLvovpHkuovku7YtLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgICAgICAgICAgREFUQV9DSEFOR0VEOiAnZGF0YUNoYW5nZWQnLCAgLy8g5pWw5o2u5L+u5pS577yM5aaC5ouW5ou96YeN6K6h566XXHJcbiAgICAgICAgICAgICAgICBEQVRBX1pPT006ICdkYXRhWm9vbScsIC8vIOaVsOaNruWMuuWfn+e8qeaUvlxyXG4gICAgICAgICAgICAgICAgREFUQV9SQU5HRTogJ2RhdGFSYW5nZScsIC8vIOWAvOWfn+a8q+a4uFxyXG4gICAgICAgICAgICAgICAgREFUQV9SQU5HRV9TRUxFQ1RFRDogJ2RhdGFSYW5nZVNlbGVjdGVkJywgLy/lgLzln5/lvIDlhbPpgInmi6lcclxuICAgICAgICAgICAgICAgIERBVEFfUkFOR0VfSE9WRVJMSU5LOiAnZGF0YVJhbmdlSG92ZXJMaW5rJywgLy8g5YC85Z+f5ryr5ri4aG92ZXJcclxuICAgICAgICAgICAgICAgIExFR0VORF9TRUxFQ1RFRDogJ2xlZ2VuZFNlbGVjdGVkJywgLy8g5Zu+5L6L5byA5YWz6YCJ5oupXHJcbiAgICAgICAgICAgICAgICBMRUdFTkRfSE9WRVJMSU5LOiAnbGVnZW5kSG92ZXJMaW5rJywgLy8g5Zu+5L6LaG92ZXJcclxuICAgICAgICAgICAgICAgIE1BUF9TRUxFQ1RFRDogJ21hcFNlbGVjdGVkJywgLy8g5Zyw5Zu+6YCJ5oupXHJcbiAgICAgICAgICAgICAgICBQSUVfU0VMRUNURUQ6ICdwaWVTZWxlY3RlZCcsIC8vIOmlvOWbvumAieaLqVxyXG4gICAgICAgICAgICAgICAgTUFHSUNfVFlQRV9DSEFOR0VEOiAnbWFnaWNUeXBlQ2hhbmdlZCcsIC8vIOWKqOaAgeexu+Wei+WIh+aNolxyXG4gICAgICAgICAgICAgICAgREFUQV9WSUVXX0NIQU5HRUQ6ICdkYXRhVmlld0NoYW5nZWQnLCAvLyDmlbDmja7op4blm77kv67mlLlcclxuICAgICAgICAgICAgICAgIFRJTUVMSU5FX0NIQU5HRUQ6ICd0aW1lbGluZUNoYW5nZWQnLCAvL+aXtumXtOi9tOWPmOWMllxyXG4gICAgICAgICAgICAgICAgTUFQX1JPQU06ICdtYXBSb2FtJyAvL+WcsOWbvua8q+a4uFxyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIOaVsOaNruagvOW8j+WMllxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgRGF0YUZvcm1hdGU6IHtcclxuXHJcbiAgICAgICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICAgICAqIOaXoOWIhue7hOaVsOaNruWIneWni+WMlu+8jOi/meenjeaVsOaNruagvOW8j+WkmueUqOS6jumlvOWbvuOAgeWNleS4gOeahOafseW9ouWbvueahOaVsOaNrua6kFxyXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGRhdGEge09iamVjdH0g5qC85byP5aaC77yaW3tuYW1lOlhYWCx2YWx1ZTpYWFh9LHtuYW1lOlhYWCx2YWx1ZTpYWFh9LOKApuKApl1cclxuICAgICAgICAgICAgICAgICAqIEByZXR1cm4ge09iamVjdH0ge2NhdGVnb3J5OkFycmF5LCBkYXRhOkFycmF5fVxyXG4gICAgICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgICAgICBOb0dyb3VwRGF0YTogZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgY2F0ZWdvcmllcyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBkYXRhcyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXRlZ29yaWVzLnB1c2goZGF0YVtpXS5uYW1lIHx8IFwiXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhcy5wdXNoKHtuYW1lOiBkYXRhW2ldLm5hbWUsIHZhbHVlOiBkYXRhW2ldLnZhbHVlIHx8IDB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtjYXRlZ29yeTogY2F0ZWdvcmllcywgZGF0YTogZGF0YXN9O1xyXG4gICAgICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICAgICAqIOacieWIhue7hOaVsOaNruWIneWni+WMlu+8jOi/meenjeagvOW8j+eahOaVsOaNruWkmueUqOS6juWxleekuuWkmuadoeaKmOe6v+WbvuOAgeWIhue7hOeahOafseW9ouWbvuetiVxyXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGRhdGEge09iamVjdH0g5qC85byP5aaC77yaW3tuYW1lOlhYWCxncm91cDpYWFgsdmFsdWU6WFhYfSx7bmFtZTpYWFgsZ3JvdXA6WFhYLHZhbHVlOlhYWH0s4oCm4oCmXVxyXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHR5cGUge3N0cmluZ30g5riy5p+T55qE5Zu+6KGo57G75Z6L77ya5Y+v5Lul5piv4oCYbGluZeKAmSzigJhiYXLigJlcclxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBpc1N0YWNrIHtib29sZWFufSDmmK/lkKbkuLrloIbnp6/lm75cclxuICAgICAgICAgICAgICAgICAqIEByZXR1cm4ge09iamVjdH0ge2NhdGVnb3J5OkFycmF5LCB4QXhpczpBcnJheSwgc2VyaWVzOkFycmF5fVxyXG4gICAgICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgICAgICBHcm91cERhdGE6IGZ1bmN0aW9uIChkYXRhLCB0eXBlLCBpc1N0YWNrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNoYXJ0VHlwZSA9IFwibGluZVwiO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoYXJ0VHlwZSA9IHR5cGUgfHwgXCJsaW5lXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB4QXhpcyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZ3JvdXAgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNlcmllcyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgeEF4aXMubGVuZ3RoICYmIHhBeGlzW2pdICE9IGRhdGFbaV0ubmFtZTsgaisrKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaiA9PSB4QXhpcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4QXhpcy5wdXNoKGRhdGFbaV0ubmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgayA9IDA7IGsgPCBncm91cC5sZW5ndGggJiYgZ3JvdXBba10gIT0gZGF0YVtpXS5ncm91cDsgaysrKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoayA9PSBncm91cC5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBncm91cC5wdXNoKGRhdGFbaV0uZ3JvdXApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdyb3VwLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGVtcCA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBkYXRhLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGdyb3VwW2ldID09IGRhdGFbal0uZ3JvdXApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJtYXBcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcC5wdXNoKHtuYW1lOiBkYXRhW2pdLm5hbWUsIHZhbHVlOiBkYXRhW2ldLnZhbHVlfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wLnB1c2goZGF0YVtqXS52YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2VyaWVzVGVtcDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2xpbmUnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXJpZXNUZW1wID0ge25hbWU6IGdyb3VwW2ldLCBkYXRhOiB0ZW1wLCB0eXBlOiBjaGFydFR5cGV9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNTdGFjaylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlcmllc1RlbXAgPSAkLmV4dGVuZCh7fSwge3N0YWNrOiAnc3RhY2snfSwgc2VyaWVzVGVtcCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2JhcicgOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXJpZXNUZW1wID0ge25hbWU6IGdyb3VwW2ldLCBkYXRhOiB0ZW1wLCB0eXBlOiBjaGFydFR5cGV9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNTdGFjaylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlcmllc1RlbXAgPSAkLmV4dGVuZCh7fSwge3N0YWNrOiAnc3RhY2snfSwgc2VyaWVzVGVtcCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ21hcCc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlcmllc1RlbXAgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBncm91cFtpXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IGNoYXJ0VHlwZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcFR5cGU6ICdjaGluYScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZE1vZGU6ICdzaW5nbGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbVN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9ybWFsOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiB7c2hvdzogdHJ1ZX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVtcGhhc2lzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiB7c2hvdzogdHJ1ZX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogdGVtcFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0IDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VyaWVzVGVtcCA9IHtuYW1lOiBncm91cFtpXSwgZGF0YTogdGVtcCwgdHlwZTogY2hhcnRUeXBlfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlcmllcy5wdXNoKHNlcmllc1RlbXApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7Y2F0ZWdvcnk6IGdyb3VwLCB4QXhpczogeEF4aXMsIHNlcmllczogc2VyaWVzfTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiDml6DmlbDmja7ml7bvvIzmmL7npLrpu5jorqTmoLflvI/vvIznm67liY3lj6rlrp7njrDkuobmsJTms6HmmL7npLpcclxuICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIF9ub0RhdGFDaGVjazoge1xyXG4gICAgICAgICAgICAgICAgX29wdGlvbjoge30sXHJcbiAgICAgICAgICAgICAgICAvKlxyXG4gICAgICAgICAgICAgICAgICog5qOA5p+l5pWw5o2uXHJcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gbWFnaWNPcHRpb2466I635Y+W5Yiw55qEZWNoYXJ0c+eahOWPguaVsOmFjee9rlxyXG4gICAgICAgICAgICAgICAgICogKi9cclxuICAgICAgICAgICAgICAgIGNoZWNrOiBmdW5jdGlvbiAobWFnaWNPcHRpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9vcHRpb24gPSBtYWdpY09wdGlvbjtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9vcHRpb24uZmxhZyA9IHRydWU7IC8v5pyJZGF0YeWAvFxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBzZXJpZXMgPSBtYWdpY09wdGlvbi5zZXJpZXM7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBzZXJpZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZXJpZXNbaV0uZGF0YSAmJiBzZXJpZXNbaV0uZGF0YS5sZW5ndGggPiAwXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB8fCBzZXJpZXNbaV0ubWFya1BvaW50ICYmIHNlcmllc1tpXS5tYXJrUG9pbnQuZGF0YSAmJiBzZXJpZXNbaV0ubWFya1BvaW50LmRhdGEubGVuZ3RoID4gMFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfHwgc2VyaWVzW2ldLm1hcmtMaW5lICYmIHNlcmllc1tpXS5tYXJrTGluZS5kYXRhICYmIHNlcmllc1tpXS5tYXJrTGluZS5kYXRhLmxlbmd0aCA+IDBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHx8IHNlcmllc1tpXS5ub2RlcyAmJiBzZXJpZXNbaV0ubm9kZXMubGVuZ3RoID4gMFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfHwgc2VyaWVzW2ldLmxpbmtzICYmIHNlcmllc1tpXS5saW5rcy5sZW5ndGggPiAwXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB8fCBzZXJpZXNbaV0ubWF0cml4ICYmIHNlcmllc1tpXS5tYXRyaXgubGVuZ3RoID4gMFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfHwgc2VyaWVzW2ldLmV2ZW50TGlzdCAmJiBzZXJpZXNbaV0uZXZlbnRMaXN0Lmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX29wdGlvbi5mbGFnID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoIXRoaXMuX29wdGlvbi5mbGFnKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB2YXIgbG9hZE9wdGlvbiA9IHRoaXMuX29wdGlvbiAmJiB0aGlzLl9vcHRpb24ubm9EYXRhTG9hZGluZ09wdGlvbiB8fCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiB0aGlzLl9vcHRpb24gJiYgdGhpcy5fb3B0aW9uLm5vRGF0YVRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZmZlY3Q6IHRoaXMuX29wdGlvbiAmJiB0aGlzLl9vcHRpb24ubm9EYXRhRWZmZWN0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zaG93TG9hZGluZyhsb2FkT3B0aW9uKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgLypcclxuICAgICAgICAgICAgICAgICAqIOajgOafpeaVsOaNrlxyXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGxvYWRpbmdPcHRpb2465Y+C5pWw5bCB6KOF77yM5ZCO6Z2i5Y+v5omp5bGVXHJcbiAgICAgICAgICAgICAgICAgKiAqL1xyXG4gICAgICAgICAgICAgICAgc2hvd0xvYWRpbmc6IGZ1bmN0aW9uIChsb2FkaW5nT3B0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9hZGluZ09wdGlvbiA9IGxvYWRpbmdPcHRpb24gfHwge307XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRleHRTdHlsZSA9IGxvYWRpbmdPcHRpb24udGV4dFN0eWxlIHx8IHt9O1xyXG4gICAgICAgICAgICAgICAgICAgIGxvYWRpbmdPcHRpb24udGV4dFN0eWxlID0gdGV4dFN0eWxlO1xyXG4gICAgICAgICAgICAgICAgICAgIHRleHRTdHlsZS50ZXh0ID0gbG9hZGluZ09wdGlvbi50ZXh0IHx8IHRoaXMuX29wdGlvbiAmJiB0aGlzLl9vcHRpb24ubG9hZGluZ1RleHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxvYWRpbmdPcHRpb24ueCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHRTdHlsZS54ID0gbG9hZGluZ09wdGlvbi54O1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAobG9hZGluZ09wdGlvbi55ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dFN0eWxlLnkgPSBsb2FkaW5nT3B0aW9uLnk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGxvYWRpbmdPcHRpb24uZWZmZWN0T3B0aW9uID0gbG9hZGluZ09wdGlvbi5lZmZlY3RPcHRpb24gfHwge307XHJcbiAgICAgICAgICAgICAgICAgICAgbG9hZGluZ09wdGlvbi5lZmZlY3RPcHRpb24udGV4dFN0eWxlID0gdGV4dFN0eWxlO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnpyU2hvd0xvYWRpbmcobG9hZGluZ09wdGlvbiwgdGhpcy5fb3B0aW9uLmRvbUlkKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAvKlxyXG4gICAgICAgICAgICAgICAgICog57uY5Yi25pi+56S65Yqo55S7XHJcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gbG9hZGluZ09wdGlvbu+8muWPguaVsOmbhuWQiO+8iOS4u+imgeacie+8muaYvuekuuaWh+Wtl++8jOaViOaenO+8jOawlOazoeS4quaVsO+8iVxyXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGlk77ya6ZyA6KaB57uY5Yi255qE5a655ZmoaWQgPGJyPjxicj5cclxuICAgICAgICAgICAgICAgICAqIGV4YW1wbGXvvJpcclxuICAgICAgICAgICAgICAgICAqIDxwcmU+XHJcbiAgICAgICAgICAgICAgICAgKiAgbm9EYXRhTG9hZGluZ09wdGlvbjogezxicj5cclxuICAgICAgICAgICAgICAgICAqICAgICAgdGV4dDogJ+aaguaXoOaVsOaNricsPGJyPlxyXG4gICAgICAgICAgICAgICAgICogICAgICBlZmZlY3Q6ICdidWJibGUnLDxicj5cclxuICAgICAgICAgICAgICAgICAqICAgICAgZWZmZWN0T3B0aW9uOiB7PGJyPlxyXG4gICAgICAgICAgICAgICAgICogICAgICAgICAgZWZmZWN0OiB7PGJyPlxyXG4gICAgICAgICAgICAgICAgICogICAgICAgICAgICAgIG46IDA8YnI+XHJcbiAgICAgICAgICAgICAgICAgKiAgICAgICAgICB9PGJyPlxyXG4gICAgICAgICAgICAgICAgICogICAgICB9PGJyPlxyXG4gICAgICAgICAgICAgICAgICogIH08YnI+XHJcbiAgICAgICAgICAgICAgICAgKiA8L3ByZT5cclxuICAgICAgICAgICAgICAgICAqICovXHJcbiAgICAgICAgICAgICAgICB6clNob3dMb2FkaW5nOiBmdW5jdGlvbiAobG9hZGluZ09wdGlvbiwgaWQpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbiA9IDA7IC8v6buY6K6kMOS4quawlOazoVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChsb2FkaW5nT3B0aW9uLmVmZmVjdCA9PT0gJ2J1YmJsZScpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbiA9IGxvYWRpbmdPcHRpb24uZWZmZWN0T3B0aW9uLmVmZmVjdCB8fCAwO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB2YXIgenIgPSB6cmVuZGVyLmluaXQoaWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhbmltYXRpb25UaWNrZXQ7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChhbmltYXRpb25UaWNrZXQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHpyLmNsZWFyKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvbG9yID0gcmVxdWlyZShbJ3BsdWdpbnMvenJlbmRlci0yLjEuMC9zcmMvdG9vbC9jb2xvciddKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgY29sb3JJZHggPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB3aWR0aCA9IE1hdGguY2VpbCh6ci5nZXRXaWR0aCgpKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaGVpZ2h0ID0gTWF0aC5jZWlsKHpyLmdldEhlaWdodCgpKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNoYXBlTGlzdCA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmUoWydwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3NoYXBlL0NpcmNsZSddLCBmdW5jdGlvbiAoQ2lyY2xlU2hhcGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5Yqo55S75YWD57SgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBuOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNoYXBlTGlzdFtpXSA9IG5ldyBDaXJjbGVTaGFwZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogTWF0aC5jZWlsKE1hdGgucmFuZG9tKCkgKiB3aWR0aCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHk6IE1hdGguY2VpbChNYXRoLnJhbmRvbSgpICogaGVpZ2h0KSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcjogTWF0aC5jZWlsKE1hdGgucmFuZG9tKCkgKiA0MCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJydXNoVHlwZTogTWF0aC5jZWlsKE1hdGgucmFuZG9tKCkgKiAxMDApICUgMyA+PSAxID8gJ2JvdGgnIDogJ3N0cm9rZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAncmdiYSgnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogMjU2KSArICcsJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIDI1NikgKyAnLCdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiAyNTYpICsgJywgMC4zKScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cm9rZUNvbG9yOiAncmdiYSgnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogMjU2KSArICcsJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIDI1NikgKyAnLCdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiAyNTYpICsgJywgMC4zKScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmVXaWR0aDogM1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX2FuaW1hdGlvblg6IE1hdGguY2VpbChNYXRoLnJhbmRvbSgpICogMjApLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9hbmltYXRpb25ZOiBNYXRoLmNlaWwoTWF0aC5yYW5kb20oKSAqIDIwKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBob3ZlcmFibGU6IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzaGFwZUxpc3RbaV0uc3R5bGUueCA8IDEwMCB8fCBzaGFwZUxpc3RbaV0uc3R5bGUueCA+ICh3aWR0aCAtIDEwMCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaGFwZUxpc3RbaV0uc3R5bGUueCA9IHdpZHRoIC8gMjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzaGFwZUxpc3RbaV0uc3R5bGUueSA8IDEwMCB8fCBzaGFwZUxpc3RbaV0uc3R5bGUueSA+IChoZWlnaHQgLSAxMDApKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hhcGVMaXN0W2ldLnN0eWxlLnkgPSBoZWlnaHQgLyAyO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgenIuYWRkU2hhcGUoc2hhcGVMaXN0W2ldKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB6ci5hZGRTaGFwZShuZXcgQ2lyY2xlU2hhcGUoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IFsxMDAsIDEwMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByb3RhdGlvbjogWzAsIDAsIDBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NhbGU6IFsxLCAxXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogKHdpZHRoIC8gMiAtIDUwKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5OiAoaGVpZ2h0IC8gMiAtIDEwMCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcjogNTAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICd0cmFuc3BhcmVudCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dENvbG9yOiAnIzY2NicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3Ryb2tlQ29sb3I6IFwidHJhbnNwYXJlbnRcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lV2lkdGg6IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogbG9hZGluZ09wdGlvbi5lZmZlY3RPcHRpb24udGV4dFN0eWxlLnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dFBvc2l0aW9uOiAnaW5zaWRlJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhvdmVyYWJsZTogZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDnu5jnlLvvvIzliKnnlKhyZW5kZXLnmoRjYWxsYmFja+WPr+S7peWcqOe7mOeUu+WujOaIkOWQjumprOS4iuW8gOWni+WKqOeUu1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB6ci5yZW5kZXIoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uVGlja2V0ID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzdHlsZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbjsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOWPr+S7pei3s+i/h1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZSA9IHNoYXBlTGlzdFtpXS5zdHlsZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0eWxlLmJydXNoVHlwZSA9PSAnYm90aCcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdHlsZS54ICsgc3R5bGUuciArIHNoYXBlTGlzdFtpXS5fYW5pbWF0aW9uWCA+PSB3aWR0aFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHx8IHN0eWxlLnggLSBzdHlsZS5yICsgc2hhcGVMaXN0W2ldLl9hbmltYXRpb25YIDw9IDBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNoYXBlTGlzdFtpXS5fYW5pbWF0aW9uWCA9IC1zaGFwZUxpc3RbaV0uX2FuaW1hdGlvblg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaGFwZUxpc3RbaV0uc3R5bGUueCArPSBzaGFwZUxpc3RbaV0uX2FuaW1hdGlvblg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdHlsZS5icnVzaFR5cGUgPT0gJ2JvdGgnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3R5bGUueSArIHN0eWxlLnIgKyBzaGFwZUxpc3RbaV0uX2FuaW1hdGlvblkgPj0gaGVpZ2h0IHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGUueSAtIHN0eWxlLnIgKyBzaGFwZUxpc3RbaV0uX2FuaW1hdGlvblkgPD0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNoYXBlTGlzdFtpXS5fYW5pbWF0aW9uWSA9IC1zaGFwZUxpc3RbaV0uX2FuaW1hdGlvblk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaGFwZUxpc3RbaV0uc3R5bGUueSArPSBzaGFwZUxpc3RbaV0uX2FuaW1hdGlvblk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3R5bGUueSAtIHNoYXBlTGlzdFtpXS5fYW5pbWF0aW9uWSArIHN0eWxlLnIgPD0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNoYXBlTGlzdFtpXS5zdHlsZS55ID0gaGVpZ2h0ICsgc3R5bGUucjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaGFwZUxpc3RbaV0uc3R5bGUueCA9IE1hdGguY2VpbChNYXRoLnJhbmRvbSgpICogd2lkdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hhcGVMaXN0W2ldLnN0eWxlLnkgLT0gc2hhcGVMaXN0W2ldLl9hbmltYXRpb25ZO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5bCx55yL6L+Z5Y+l5bCx6KGMXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHpyLm1vZFNoYXBlKHNoYXBlTGlzdFtpXS5pZCwgc2hhcGVMaXN0W2ldKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgenIucmVmcmVzaCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgMTUwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIOWIneWni+WMluW4uOeUqOeahOWbvuihqOexu+Wei1xyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgT3B0aW9uVGVtcGxhdGU6IHtcclxuICAgICAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgICAgICog6YCa55So55qE5Zu+6KGo5Z+65pys6YWN572uXHJcbiAgICAgICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgICAgIENvbW1vbk9wdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGdyaWQ6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyV2lkdGg6IDBcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHRvb2x0aXA6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHJpZ2dlcjogJ2F4aXMnLCAvLyB0b29sdGlw6Kem5Y+R5pa55byP77yaYXhpc+S7pVjovbTnur/op6blj5HvvIxpdGVt5Lul5q+P5LiA5Liq5pWw5o2u6aG56Kem5Y+RXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF4aXNQb2ludGVyOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc2hhZG93J1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB0b29sYm94OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNob3c6IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAvL3lBeGlzOiBbe1xyXG4gICAgICAgICAgICAgICAgICAgIC8vICAgIGJvdW5kYXJ5R2FwOiBbMCwgMF1cclxuICAgICAgICAgICAgICAgICAgICAvL31dLFxyXG4gICAgICAgICAgICAgICAgICAgIGxlZ2VuZDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzaG93OiBmYWxzZSwgLy8g6buY6K6k5LiN5pi+56S65Zu+5L6LXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkTW9kZTogZmFsc2UsIC8vIOmAieaLqeaooeW8j++8jOm7mOiupOW8gOWQr+WbvuS+i+W8gOWFs++8jOWPr+mAiXNpbmdsZe+8jG11bHRpcGxlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IFtdXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAvL2NhbGN1bGFibGU6IGZhbHNlLCAvLyDmmK/lkKbmi5bmi73ph43orqHnrpdcclxuICAgICAgICAgICAgICAgICAgICAvL2FuaW1hdGlvbjogZmFsc2UsICAvLyDmmK/lkKblkK/nlKjliqjnlLtcclxuICAgICAgICAgICAgICAgICAgICBpbWFnZVNhdmU6IGZhbHNlLCAvLyDmmK/lkKblj6/ku6Xlj7PplK7kv53lrZjlm77niYdcclxuICAgICAgICAgICAgICAgICAgICBpbWFnZU5hbWU6ICdpbWFnZScgLy8g6buY6K6k5L+d5a2Y55qE5Zu+54mH5ZCN56ewXHJcbiAgICAgICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgICAgICog6aW85Zu+IOmFjee9rlxyXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGRhdGEg5pWw5o2uIOagvOW8j++8mlt7bmFtZTpYWFgsdmFsdWU6WFhYfSzigKbigKZdXHJcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gbmFtZSDmmL7npLrmoIfpophcclxuICAgICAgICAgICAgICAgICAqIEByZXR1cm4gb3B0aW9uXHJcbiAgICAgICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgICAgIFBpZTogZnVuY3Rpb24gKGRhdGEsIG5hbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcGllRGF0YXMgPSBFQ2hhcnRzLkRhdGFGb3JtYXRlLk5vR3JvdXBEYXRhKGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBvcHRpb24gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBuYW1lIHx8ICcnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvb2x0aXA6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpZ2dlcjogJ2l0ZW0nXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlZ2VuZDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRNb2RlOiAnbXVsdGlwbGUnLFxyXG4vLyAgICAgICAgICAgICAgICAgICAgb3JpZW50OiAndmVydGljYWwnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogcGllRGF0YXMuY2F0ZWdvcnlcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VyaWVzOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogbmFtZSB8fCBcIlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdwaWUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhZGl1czogJzY1JScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2VudGVyOiBbJzUwJScsICc1MCUnXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiBwaWVEYXRhcy5kYXRhXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAkLmV4dGVuZCh7fSwgRUNoYXJ0cy5PcHRpb25UZW1wbGF0ZS5Db21tb25PcHRpb24sIG9wdGlvbik7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgICAgICog5oqY57q/5Zu+IOmFjee9rlxyXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGRhdGEg5pWw5o2uIOagvOW8j++8mlt7bmFtZTpYWFgsdmFsdWU6WFhYLGdyb3VwOlhYWH0s4oCm4oCmXVxyXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIG5hbWUg5pi+56S65qCH6aKYXHJcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0geE5hbWUgeOi9tOaYvuekuuWQjeensFxyXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHlOYW1lIHnovbTmmL7npLrlkI3np7BcclxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBpc1N0YWNrIOaYr+WQpuS4uuWghuenr+WbvlxyXG4gICAgICAgICAgICAgICAgICogQHJldHVybiBvcHRpb25cclxuICAgICAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICAgICAgTGluZXM6IGZ1bmN0aW9uIChkYXRhLCBuYW1lLCB4TmFtZSwgeU5hbWUsIGlzU3RhY2spIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgc3RhY2tMaW5lRGF0YXMgPSBFQ2hhcnRzLkRhdGFGb3JtYXRlLkdyb3VwRGF0YShkYXRhLCAnbGluZScsIGlzU3RhY2spO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBvcHRpb24gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBuYW1lIHx8ICcnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlZ2VuZDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogc3RhY2tMaW5lRGF0YXMuY2F0ZWdvcnlcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgeEF4aXM6IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB4TmFtZSB8fCAnJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnY2F0ZWdvcnknLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvdW5kYXJ5R2FwOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiBzdGFja0xpbmVEYXRhcy54QXhpc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB5QXhpczogW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHlOYW1lIHx8ICcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICd2YWx1ZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3BsaXRBcmVhOiB7c2hvdzogdHJ1ZX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VyaWVzOiBzdGFja0xpbmVEYXRhcy5zZXJpZXNcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAkLmV4dGVuZCh7fSwgRUNoYXJ0cy5PcHRpb25UZW1wbGF0ZS5Db21tb25PcHRpb24sIG9wdGlvbik7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgICAgICog5p+x54q25Zu+IOmFjee9rlxyXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIGRhdGEg5pWw5o2uIOagvOW8j++8mlt7bmFtZTpYWFgsZ3JvdXA6WFhYLHZhbHVlOlhYWH0s4oCm4oCmXVxyXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIG5hbWUg5pi+56S65qCH6aKYXHJcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0geE5hbWUgeOi9tOaYvuekuuWQjeensFxyXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHlOYW1lIHnovbTmmL7npLrlkI3np7BcclxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSBpc1N0YWNrIOaYr+WQpuS4uuWghuenr+WbvlxyXG4gICAgICAgICAgICAgICAgICogQHJldHVybiBvcHRpb25cclxuICAgICAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICAgICAgQmFyczogZnVuY3Rpb24gKGRhdGEsIG5hbWUsIHhOYW1lLCB5TmFtZSwgaXNTdGFjaykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBzdGFja0JhckRhdGFzID0gRUNoYXJ0cy5EYXRhRm9ybWF0ZS5Hcm91cERhdGEoZGF0YSwgJ2JhcicsIGlzU3RhY2spO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBvcHRpb24gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBuYW1lIHx8ICcnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlZ2VuZDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogc3RhY2tCYXJEYXRhcy5jYXRlZ29yeVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB4QXhpczogW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHhOYW1lIHx8ICcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdjYXRlZ29yeScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXhpc0xhYmVsOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNob3c6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludGVydmFsOiAnYXV0bycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvdGF0ZTogMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFyZ2luOiA4XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiBzdGFja0JhckRhdGFzLnhBeGlzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHlBeGlzOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogeU5hbWUgfHwgJycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3ZhbHVlJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcGxpdEFyZWE6IHtzaG93OiB0cnVlfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXJpZXM6IHN0YWNrQmFyRGF0YXMuc2VyaWVzXHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJC5leHRlbmQoe30sIEVDaGFydHMuT3B0aW9uVGVtcGxhdGUuQ29tbW9uT3B0aW9uLCBvcHRpb24pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAq6YWN572u5riQ5Y+Y5ZKM57q555CGXHJcbiAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIEdyYXBoaWM6e1xyXG4gICAgICAgICAgICAgICAgLyoqIOe6v+aAp+a4kOWPmO+8jOWJjeWbm+S4quWPguaVsOWIhuWIq+aYryB4MCwgeTAsIHgyLCB5Miwg6IyD5Zu05LuOIDAgLSAxXHJcbiAgICAgICAgICAgICAgICAqICAg55u45b2T5LqO5Zyo5Zu+5b2i5YyF5Zu055uS5Lit55qE55m+5YiG5q+U77yM5aaC5p6c5pyA5ZCO5LiA5Liq5Y+C5pWw5LygIHRydWXvvIzliJnor6Xlm5vkuKrlgLzmmK/nu53lr7nnmoTlg4/ntKDkvY3nva5cclxuICAgICAgICAgICAgICAgICogZWfvvJogRUNoYXJ0cy5HcmFwaGljLkxpbmVhckdyYWRpZW50KHtcclxuICAgICAgICAgICAgICAgICAgICB4MDowLFxyXG4gICAgICAgICAgICAgICAgICAgIHkwOjAsXHJcbiAgICAgICAgICAgICAgICAgICAgeDI6MCxcclxuICAgICAgICAgICAgICAgICAgICB5MjoxLFxyXG4gICAgICAgICAgICAgICAgICAgIGlzQWJzb2x1dGVPZmZzZXQ6ZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0Q29sb3JzOiBbe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IDAsIGNvbG9yOiAnI2ZmZicgLy8gMCUg5aSE55qE6aKc6ImyXHJcbiAgICAgICAgICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IDAuNSwgY29sb3I6ICcjZWVlJyAvLyA1MCUg5aSE55qE6aKc6ImyXHJcbiAgICAgICAgICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IDEsIGNvbG9yOiAnI2ZmZicgLy8gMTAwJSDlpITnmoTpopzoibJcclxuICAgICAgICAgICAgICAgICAgICB9XVxyXG4gICAgICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgICAgIExpbmVhckdyYWRpZW50OmZ1bmN0aW9uKHBhcmFtcyl7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhcmFtcyA9IHBhcmFtc3x8e307XHJcbiAgICAgICAgICAgICAgICAgICAgLy/phY3nva7pu5jorqTmoLflvI9cclxuICAgICAgICAgICAgICAgICAgICB2YXIgX3BhcmFtcz17XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHgwOnBhcmFtcy54MHx8MCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgeTA6cGFyYW1zLnkwfHwwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB4MjpwYXJhbXMueDJ8fDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHkyOnBhcmFtcy55Mnx8MSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0Q29sb3JzOnBhcmFtcy5vZmZzZXRDb2xvcnMgfHwgW3tcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldDogMCwgY29sb3I6ICcjOGZlNWZhJyAvLyAwJSDlpITnmoTpopzoibJcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldDogMC41LCBjb2xvcjogJyNmZmYnIC8vIDEwMCUg5aSE55qE6aKc6ImyXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0se1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0OiAxLCBjb2xvcjogJyM4ZmU1ZmEnIC8vIDAlIOWkhOeahOminOiJslxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXNBYnNvbHV0ZU9mZnNldDpwYXJhbXMuaXNBYnNvbHV0ZU9mZnNldHx8ZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgZWNoYXJ0cy5ncmFwaGljLkxpbmVhckdyYWRpZW50KF9wYXJhbXMueDB8fDAsIF9wYXJhbXMueTB8fDAsIF9wYXJhbXMueDJ8fDAsIF9wYXJhbXMueTJ8fDEsIF9wYXJhbXMub2Zmc2V0Q29sb3JzLCBfcGFyYW1zLmlzQWJzb2x1dGVPZmZzZXR8fGZhbHNlKVxyXG5cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHJldHVybiBFQ2hhcnRzXHJcbiAgICB9KTtcclxuXHJcbn0pKCk7Il0sImZpbGUiOiJwbHVnaW5zL2VjaGFydHMvRUNoYXJ0cy5qcyJ9
