/**
 * 功能：设备选择对话框，显示内容和样式可通过属性配置 日期：2017.02.10
 * P00102
 */
define(['jquery', 'ValidateForm', 'GridTable', 'zTree', 'zTree.excheck', 'zTree.exedit', 'zTree.exhide'], function ($) {
    (function ($) {
        $.fn.deviceDialog = function (options) {
            var $this = this;
            var p = $.extend({
                pageSize: 20,
                id: "initialDeviceDialog",
                width: 1000,					                // 选择框宽度
                height: 635,				                        // 选择框高度
                url: '/devManager/listDev',	                    // 选择设备后台请求地址
                param: {},					                    // 想后台请求的参数
                selector: true,				                    // 选择输入控件id
                toolbarID: '',				                    // 选择框中筛选控件的id
                tableID: '',					                // 选择框中设备表格的id
                submit: false,				                    // 点击确定后的回调函数
                refresh: false,				                    // 点击筛选控件是否执行刷新表格操作
                dialog: null,					                // 选择框结点
                singleSelect: false,			                // 是否只选择一个设备  false:多选 true:单选
                onDoubleClick: false,			                // 设备信息列表中的双击回调函数
                loaded: false,				                    // 设备信息列表加载完成的变量标示
                noButtons: false,				                // 不显示查询按钮
                title: Msg.chooseDevice,		                // 选择对话框的标题
                fnSelected: false,								// 选择设备后回调函数
                columns:						                //
                    ['icon', 'stationName', 'installCapacity', 'combineType', 'inverterType'],
                input: $this
            }, options);
            var serachParam = {};
            var hasChecked = false;
            /**
             * Gridtable加载完成后的执行函数
             */
            var onLoadReady = function (data, btrs, htrs) {
                if (!p.loaded) {
                    /* p.loaded = true;
                     $('#device_dialog_devTable').GridTableInitSelectedRecords(p.input.data('selectedRecords'));*/
                    p.loaded = true;
                    var selectedRecords = p.input.data('selectedRecords');
                    var arr = [];
                    if (!selectedRecords || selectedRecords.length == 0) {
                        var values = (p.input.attr('value') && p.input.attr('value').split(','));
                        var names = (p.input.val() && p.input.val().split(','));
                        $(values).each(function (i) {
                            var o = {};
                            o.devId = values[i];
                            o.devName = names[i];
                            arr.push(o);
                        });
                        $('#device_dialog_devTable').GridTableInitSelectedRecords(arr);
                    }
                    else {
                        $('#device_dialog_devTable').GridTableInitSelectedRecords(selectedRecords);

                    }
                    if (!p.input.data('selectedRecords') && arr.length == 0 && p.singleSelect) {
                        $(btrs[0]).click();
                    }
                }
                //单选时，如果未选中电站，默认选中第一个

            }
            App.dialog({
                id: p.id,
                title: p.title,
                width: p.width,
                height: p.height
            }).loadPage({url: "js/plugins/deviceDialog/deviceDialog.html"}, {}, function () {
                var param = p;

                /**
                 * 查询条件栏配置
                 */
                var initSearch = function () {
                    $("#device_dialog_index_search").ValidateForm('device_dialog_index_search', {
                        show: 'horizontal',
                        fnSubmit: serach,
                        model: [[
                            {
                                input: 'input',
                                type: 'text',
                                show: Msg.devSupplement.devName,
                                name: 'devName',
                                extend: {id: 'device_dialog_search_devName'}
                            },
                            {
                                input: 'select',
                                type: 'select',
                                show: Msg.dataLimit.devType,
                                name: 'devType',
                                options: [{value: '0', text: Msg.all}],
                                extend: {id: 'device_dialog_search_devType'},
                                fnInit: searchTypeInit
                            }
                        ]]
                    });
                };
                initSearch();

                var initTable = function (stationCodes) {
                    serachParam = {stationIds: stationCodes};
                    //设备表格
                    var devTable = $("#device_dialog_devTable").GridTable({
                        url: param.url,
                        title: false,
                        max_height: 410,
                        params: serachParam,
                        rp: 10,
                        clickSelect: true,
                        isRecordSelected: true,
                        showSelectedName: false,
                        singleSelect: param.singleSelect,
                        isSearchRecordSelected: true,
                        onLoadReady: onLoadReady,
                        idProperty: 'devId',
                        colModel: [{
                            display: Msg.deviceDialog.stationName,
                            name: "stationName",
                            width: 0.15,
                            align: 'center'
                        },
                            {display: Msg.devSupplement.devName, name: 'devName', width: 0.25, align: 'center'},
                            {
                                display: Msg.dataLimit.devType,
                                name: 'devTypeId',
                                width: 0.15,
                                align: 'center',
                                fnInit: showDevType
                            },
                            {display: Msg.deviceDialog.deviceBb, name: 'devVersion', width: 0.15, align: 'center'},
                            {display: Msg.deviceDialog.deviceEsn, name: 'devEsn', width: 0.15, align: 'center'},
                            /*{display: Msg.deviceDialog.runstatus,name: 'devRuningState',width: 0.12,align: 'center',fnInit:showRunStatus},*/
                            {
                                display: Msg.deviceDialog.latidu,
                                name: 'Latlong',
                                width: 0.15,
                                align: 'center',
                                fnInit: showLatlong
                            }
                        ]
                    });
                };

                //显示经纬度 
                function showLatlong(dom, value, datas) {
                    var longitude = LatlongFormart(datas.longitude); //经度
                    var latitude = LatlongFormart(datas.latitude);  //纬度
                    dom.html(longitude + "    " + latitude);
                    dom.parent()[0].title = longitude + "    " + latitude;
                }

                //将经纬度转换成为度分秒
                function LatlongFormart(value) {
                    if (value == null || value === "") {
                        return "";
                    }
                    value = Math.abs(value);
                    var v1 = Math.floor(value);//度  
                    var v2 = Math.floor((value - v1) * 60);//分  
                    var v3 = Math.round((value - v1) * 3600 % 60);//秒  
                    return v1 + '°' + v2 + '\'' + v3 + '"';
                }

                //显示运行状态
                function showRunStatus(dom, value, datas) {
                    var stationCode = datas.stationCode;
                    if (!stationCode) {
                        dom.html(Msg.deviceDialog.hasNotConnected);
                        dom.parent()[0].title = Msg.deviceDialog.hasNotConnected;
                    } else {
                        dom.html(Msg.deviceDialog.hasConnected);
                        dom.parent()[0].title = Msg.deviceDialog.hasConnected;
                    }
                }

                //显示设备类型
                function showDevType(dom, value, datas) {
                    dom.html(devTypeIfoCache[datas.devTypeId]);
                    dom.parent()[0].title = devTypeIfoCache[datas.devTypeId];
                }

                var devTypeIfoCache = {};//设备类型前端临时缓存，用来匹配设备列表中的设备类型id
                function searchTypeInit(dom) {
                    $.http.ajax('/signalconf/getDevTypeInfo', {}, function (data) {
                        if (data && data.success) {
                            $.each(data.data.list, function (i, t) {
                                // 查询到的每一个设备类型的选项添加
                                t.name = main.eval(t.languageKey);
                                var opt = $("<option value=" + t.id + ">" + t.name + "</option>");
                                devTypeIfoCache[t.id] = t.name;
                                dom.append(opt);
                            })

                        } else {
                            App.alert(Msg.partials.main.hp.poverty.getFail);
                        }
                    });
                }

                /**
                 * 查询按钮
                 */
                function serach() {
                    serachParam.devName = $("#device_dialog_search_devName").val();
                    serachParam.devTypeId = $("#device_dialog_search_devType").val();
                    $('#device_dialog_devTable').GridTableSearch({
                        param: serachParam
                    })
                }

                /**
                 * 确定和取消按钮
                 */
                var addClick = function () {
                    $("#device_dialog_index").find("#deviceselectHhCancel").click(function () {
                        $("#" + p.id).modal("hide");
                    }).end().find("#deviceselectHhOk").click(function () {
                        var selectedValues = getdevIds();
                        param.input.val(selectedValues.names).attr("value", selectedValues.devIds).focusout();
                        param.input.data('selectedRecords', selectedValues.selectedRecords);

                        if (param.singleSelect) {
                            var sData = selectedValues.selectedRecords[0];
                            sData = $.extend({
                                deviceType: devTypeIfoCache[sData.devTypeId]
                            }, sData);
                            param.fnSelected && param.fnSelected(sData);
                        }
                        $("#" + p.id).modal("hide");

                    })
                };
                /**
                 * 获取已经选择的设备Id和名称
                 */
                var getdevIds = function () {
                    var selectedRecords = $('#device_dialog_devTable').GridTableSelectedRecords();
                    var values = [];
                    var names = [];
                    $.each(selectedRecords, function (i, e) {
                        values.push(e.devId);
                        names.push(e.devName);
                    });
                    return {
                        devIds: values.toString(),
                        names: names,
                        selectedRecords: selectedRecords
                    };
                };

                /**
                 * 左侧域结构
                 */
                var initTree = function () {
                    var userId = (param.param && param.param.userId) || Cookies.getCook("userid");
                    $.http.ajax('/domain/queryUserDomainStaRes', {
                        "mdfUserId": userId
                    }, function (data) {
                        if (data && data.success) {
                            var zTreeObj;
                            var zNodes = main.getZnodes2(data.data);
                            var zTreeSetting = {
                                treeId: "devLocations",
                                callback: {
                                    onCheck: zTreeOnCheck,
                                    onClick: zTreeOnClick
                                },
                                check: {
                                    chkStyle: "checkbox",
                                    enable: true,
                                    autoCheckTrigger: false,
                                    chkboxType: {"Y": "ps", "N": "ps"}
                                },
                                view: {
                                    dblClickExpand: false,
                                    showLine: false,
                                    selectedMulti: false,
                                    showIcon: function (treeid, treeNode) {
                                        return treeNode.model == 'STATION';
                                    }
                                },
                                data: {
                                    simpleData: {
                                        enable: true
                                    }
                                }
                            };

                            $.fn.zTree.init($("#device_dialog_domainsTree"), zTreeSetting, zNodes);
                            zTreeObj = $.fn.zTree.getZTreeObj("device_dialog_domainsTree");

                            var stationIds = [];
                            for (var i = 0; i < zNodes.length; i++) {
                                if (zNodes[i].model == 'STATION') {
                                    stationIds.push(zNodes[i].id);
                                }
                            }
                            if (zNodes.length > 0 && stationIds.length === 0) {
                                stationIds = "NOSTATION";
                            } else {
                                stationIds = stationIds.join();
                            }
                            initTable(stationIds);

                            //点击域结构查询设备
                            function zTreeOnClick(event, treeId, treeNode) {
                                // serachParam.domainId = zTreeObj.getSelectedNodes()[0].id;
                                if (treeNode.isParent) {
                                    zTreeObj.expandNode(treeNode);
                                } else {
                                    zTreeObj.checkNode(treeNode, !treeNode.checked, true, true);
                                }
                            }

                            function zTreeOnCheck() {
                                var checkedNodes = zTreeObj.getCheckedNodes();
                                var stationIds = [];
                                hasChecked = checkedNodes.length > 0;
                                checkedNodes = hasChecked ? checkedNodes : zTreeObj.transformToArray(zTreeObj.getNodes());
                                for (var i = 0; i < checkedNodes.length; i++) {
                                    if (checkedNodes[i].model == 'STATION') {
                                        stationIds.push(checkedNodes[i].id);
                                    }
                                }
                                if (hasChecked && stationIds.length === 0) {
                                    serachParam.stationIds = "NOSTATION";
                                } else {
                                    serachParam.stationIds = stationIds.toString();
                                }
                                serach();
                            }
                        } else {
                            App.alert(Msg.partials.main.hp.poverty.getFail);
                        }
                    });
                };
                initTree();
                addClick();
            });
        }
    })(jQuery);
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL2RldmljZURpYWxvZy9kZXZpY2VEaWFsb2cuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIOWKn+iDve+8muiuvuWkh+mAieaLqeWvueivneahhu+8jOaYvuekuuWGheWuueWSjOagt+W8j+WPr+mAmui/h+WxnuaAp+mFjee9riDml6XmnJ/vvJoyMDE3LjAyLjEwXHJcbiAqIFAwMDEwMlxyXG4gKi9cclxuZGVmaW5lKFsnanF1ZXJ5JywgJ1ZhbGlkYXRlRm9ybScsICdHcmlkVGFibGUnLCAnelRyZWUnLCAnelRyZWUuZXhjaGVjaycsICd6VHJlZS5leGVkaXQnLCAnelRyZWUuZXhoaWRlJ10sIGZ1bmN0aW9uICgkKSB7XHJcbiAgICAoZnVuY3Rpb24gKCQpIHtcclxuICAgICAgICAkLmZuLmRldmljZURpYWxvZyA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIHZhciAkdGhpcyA9IHRoaXM7XHJcbiAgICAgICAgICAgIHZhciBwID0gJC5leHRlbmQoe1xyXG4gICAgICAgICAgICAgICAgcGFnZVNpemU6IDIwLFxyXG4gICAgICAgICAgICAgICAgaWQ6IFwiaW5pdGlhbERldmljZURpYWxvZ1wiLFxyXG4gICAgICAgICAgICAgICAgd2lkdGg6IDEwMDAsXHRcdFx0XHRcdCAgICAgICAgICAgICAgICAvLyDpgInmi6nmoYblrr3luqZcclxuICAgICAgICAgICAgICAgIGhlaWdodDogNjM1LFx0XHRcdFx0ICAgICAgICAgICAgICAgICAgICAgICAgLy8g6YCJ5oup5qGG6auY5bqmXHJcbiAgICAgICAgICAgICAgICB1cmw6ICcvZGV2TWFuYWdlci9saXN0RGV2JyxcdCAgICAgICAgICAgICAgICAgICAgLy8g6YCJ5oup6K6+5aSH5ZCO5Y+w6K+35rGC5Zyw5Z2AXHJcbiAgICAgICAgICAgICAgICBwYXJhbToge30sXHRcdFx0XHRcdCAgICAgICAgICAgICAgICAgICAgLy8g5oOz5ZCO5Y+w6K+35rGC55qE5Y+C5pWwXHJcbiAgICAgICAgICAgICAgICBzZWxlY3RvcjogdHJ1ZSxcdFx0XHRcdCAgICAgICAgICAgICAgICAgICAgLy8g6YCJ5oup6L6T5YWl5o6n5Lu2aWRcclxuICAgICAgICAgICAgICAgIHRvb2xiYXJJRDogJycsXHRcdFx0XHQgICAgICAgICAgICAgICAgICAgIC8vIOmAieaLqeahhuS4reetm+mAieaOp+S7tueahGlkXHJcbiAgICAgICAgICAgICAgICB0YWJsZUlEOiAnJyxcdFx0XHRcdFx0ICAgICAgICAgICAgICAgIC8vIOmAieaLqeahhuS4reiuvuWkh+ihqOagvOeahGlkXHJcbiAgICAgICAgICAgICAgICBzdWJtaXQ6IGZhbHNlLFx0XHRcdFx0ICAgICAgICAgICAgICAgICAgICAvLyDngrnlh7vnoa7lrprlkI7nmoTlm57osIPlh73mlbBcclxuICAgICAgICAgICAgICAgIHJlZnJlc2g6IGZhbHNlLFx0XHRcdFx0ICAgICAgICAgICAgICAgICAgICAvLyDngrnlh7vnrZvpgInmjqfku7bmmK/lkKbmiafooYzliLfmlrDooajmoLzmk43kvZxcclxuICAgICAgICAgICAgICAgIGRpYWxvZzogbnVsbCxcdFx0XHRcdFx0ICAgICAgICAgICAgICAgIC8vIOmAieaLqeahhue7k+eCuVxyXG4gICAgICAgICAgICAgICAgc2luZ2xlU2VsZWN0OiBmYWxzZSxcdFx0XHQgICAgICAgICAgICAgICAgLy8g5piv5ZCm5Y+q6YCJ5oup5LiA5Liq6K6+5aSHICBmYWxzZTrlpJrpgIkgdHJ1ZTrljZXpgIlcclxuICAgICAgICAgICAgICAgIG9uRG91YmxlQ2xpY2s6IGZhbHNlLFx0XHRcdCAgICAgICAgICAgICAgICAvLyDorr7lpIfkv6Hmga/liJfooajkuK3nmoTlj4zlh7vlm57osIPlh73mlbBcclxuICAgICAgICAgICAgICAgIGxvYWRlZDogZmFsc2UsXHRcdFx0XHQgICAgICAgICAgICAgICAgICAgIC8vIOiuvuWkh+S/oeaBr+WIl+ihqOWKoOi9veWujOaIkOeahOWPmOmHj+agh+ekulxyXG4gICAgICAgICAgICAgICAgbm9CdXR0b25zOiBmYWxzZSxcdFx0XHRcdCAgICAgICAgICAgICAgICAvLyDkuI3mmL7npLrmn6Xor6LmjInpkq5cclxuICAgICAgICAgICAgICAgIHRpdGxlOiBNc2cuY2hvb3NlRGV2aWNlLFx0XHQgICAgICAgICAgICAgICAgLy8g6YCJ5oup5a+56K+d5qGG55qE5qCH6aKYXHJcbiAgICAgICAgICAgICAgICBmblNlbGVjdGVkOiBmYWxzZSxcdFx0XHRcdFx0XHRcdFx0Ly8g6YCJ5oup6K6+5aSH5ZCO5Zue6LCD5Ye95pWwXHJcbiAgICAgICAgICAgICAgICBjb2x1bW5zOlx0XHRcdFx0XHRcdCAgICAgICAgICAgICAgICAvL1xyXG4gICAgICAgICAgICAgICAgICAgIFsnaWNvbicsICdzdGF0aW9uTmFtZScsICdpbnN0YWxsQ2FwYWNpdHknLCAnY29tYmluZVR5cGUnLCAnaW52ZXJ0ZXJUeXBlJ10sXHJcbiAgICAgICAgICAgICAgICBpbnB1dDogJHRoaXNcclxuICAgICAgICAgICAgfSwgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgIHZhciBzZXJhY2hQYXJhbSA9IHt9O1xyXG4gICAgICAgICAgICB2YXIgaGFzQ2hlY2tlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogR3JpZHRhYmxl5Yqg6L295a6M5oiQ5ZCO55qE5omn6KGM5Ye95pWwXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICB2YXIgb25Mb2FkUmVhZHkgPSBmdW5jdGlvbiAoZGF0YSwgYnRycywgaHRycykge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFwLmxvYWRlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8qIHAubG9hZGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgJCgnI2RldmljZV9kaWFsb2dfZGV2VGFibGUnKS5HcmlkVGFibGVJbml0U2VsZWN0ZWRSZWNvcmRzKHAuaW5wdXQuZGF0YSgnc2VsZWN0ZWRSZWNvcmRzJykpOyovXHJcbiAgICAgICAgICAgICAgICAgICAgcC5sb2FkZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBzZWxlY3RlZFJlY29yZHMgPSBwLmlucHV0LmRhdGEoJ3NlbGVjdGVkUmVjb3JkcycpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhcnIgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXNlbGVjdGVkUmVjb3JkcyB8fCBzZWxlY3RlZFJlY29yZHMubGVuZ3RoID09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlcyA9IChwLmlucHV0LmF0dHIoJ3ZhbHVlJykgJiYgcC5pbnB1dC5hdHRyKCd2YWx1ZScpLnNwbGl0KCcsJykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbmFtZXMgPSAocC5pbnB1dC52YWwoKSAmJiBwLmlucHV0LnZhbCgpLnNwbGl0KCcsJykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKHZhbHVlcykuZWFjaChmdW5jdGlvbiAoaSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG8gPSB7fTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG8uZGV2SWQgPSB2YWx1ZXNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvLmRldk5hbWUgPSBuYW1lc1tpXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyci5wdXNoKG8pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJCgnI2RldmljZV9kaWFsb2dfZGV2VGFibGUnKS5HcmlkVGFibGVJbml0U2VsZWN0ZWRSZWNvcmRzKGFycik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKCcjZGV2aWNlX2RpYWxvZ19kZXZUYWJsZScpLkdyaWRUYWJsZUluaXRTZWxlY3RlZFJlY29yZHMoc2VsZWN0ZWRSZWNvcmRzKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghcC5pbnB1dC5kYXRhKCdzZWxlY3RlZFJlY29yZHMnKSAmJiBhcnIubGVuZ3RoID09IDAgJiYgcC5zaW5nbGVTZWxlY3QpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJChidHJzWzBdKS5jbGljaygpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8v5Y2V6YCJ5pe277yM5aaC5p6c5pyq6YCJ5Lit55S156uZ77yM6buY6K6k6YCJ5Lit56ys5LiA5LiqXHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIEFwcC5kaWFsb2coe1xyXG4gICAgICAgICAgICAgICAgaWQ6IHAuaWQsXHJcbiAgICAgICAgICAgICAgICB0aXRsZTogcC50aXRsZSxcclxuICAgICAgICAgICAgICAgIHdpZHRoOiBwLndpZHRoLFxyXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBwLmhlaWdodFxyXG4gICAgICAgICAgICB9KS5sb2FkUGFnZSh7dXJsOiBcImpzL3BsdWdpbnMvZGV2aWNlRGlhbG9nL2RldmljZURpYWxvZy5odG1sXCJ9LCB7fSwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHBhcmFtID0gcDtcclxuXHJcbiAgICAgICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICAgICAqIOafpeivouadoeS7tuagj+mFjee9rlxyXG4gICAgICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgICAgICB2YXIgaW5pdFNlYXJjaCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAkKFwiI2RldmljZV9kaWFsb2dfaW5kZXhfc2VhcmNoXCIpLlZhbGlkYXRlRm9ybSgnZGV2aWNlX2RpYWxvZ19pbmRleF9zZWFyY2gnLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNob3c6ICdob3Jpem9udGFsJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm5TdWJtaXQ6IHNlcmFjaCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW9kZWw6IFtbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXQ6ICdpbnB1dCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3RleHQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNob3c6IE1zZy5kZXZTdXBwbGVtZW50LmRldk5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ2Rldk5hbWUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dGVuZDoge2lkOiAnZGV2aWNlX2RpYWxvZ19zZWFyY2hfZGV2TmFtZSd9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0OiAnc2VsZWN0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc2VsZWN0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaG93OiBNc2cuZGF0YUxpbWl0LmRldlR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ2RldlR5cGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnM6IFt7dmFsdWU6ICcwJywgdGV4dDogTXNnLmFsbH1dLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dGVuZDoge2lkOiAnZGV2aWNlX2RpYWxvZ19zZWFyY2hfZGV2VHlwZSd9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZuSW5pdDogc2VhcmNoVHlwZUluaXRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgXV1cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICBpbml0U2VhcmNoKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGluaXRUYWJsZSA9IGZ1bmN0aW9uIChzdGF0aW9uQ29kZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICBzZXJhY2hQYXJhbSA9IHtzdGF0aW9uSWRzOiBzdGF0aW9uQ29kZXN9O1xyXG4gICAgICAgICAgICAgICAgICAgIC8v6K6+5aSH6KGo5qC8XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRldlRhYmxlID0gJChcIiNkZXZpY2VfZGlhbG9nX2RldlRhYmxlXCIpLkdyaWRUYWJsZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybDogcGFyYW0udXJsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heF9oZWlnaHQ6IDQxMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyYW1zOiBzZXJhY2hQYXJhbSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcnA6IDEwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGlja1NlbGVjdDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXNSZWNvcmRTZWxlY3RlZDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2hvd1NlbGVjdGVkTmFtZTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpbmdsZVNlbGVjdDogcGFyYW0uc2luZ2xlU2VsZWN0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpc1NlYXJjaFJlY29yZFNlbGVjdGVkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkxvYWRSZWFkeTogb25Mb2FkUmVhZHksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkUHJvcGVydHk6ICdkZXZJZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbE1vZGVsOiBbe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogTXNnLmRldmljZURpYWxvZy5zdGF0aW9uTmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IFwic3RhdGlvbk5hbWVcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAwLjE1LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxpZ246ICdjZW50ZXInXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7ZGlzcGxheTogTXNnLmRldlN1cHBsZW1lbnQuZGV2TmFtZSwgbmFtZTogJ2Rldk5hbWUnLCB3aWR0aDogMC4yNSwgYWxpZ246ICdjZW50ZXInfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiBNc2cuZGF0YUxpbWl0LmRldlR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ2RldlR5cGVJZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDAuMTUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxpZ246ICdjZW50ZXInLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZuSW5pdDogc2hvd0RldlR5cGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7ZGlzcGxheTogTXNnLmRldmljZURpYWxvZy5kZXZpY2VCYiwgbmFtZTogJ2RldlZlcnNpb24nLCB3aWR0aDogMC4xNSwgYWxpZ246ICdjZW50ZXInfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtkaXNwbGF5OiBNc2cuZGV2aWNlRGlhbG9nLmRldmljZUVzbiwgbmFtZTogJ2RldkVzbicsIHdpZHRoOiAwLjE1LCBhbGlnbjogJ2NlbnRlcid9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyp7ZGlzcGxheTogTXNnLmRldmljZURpYWxvZy5ydW5zdGF0dXMsbmFtZTogJ2RldlJ1bmluZ1N0YXRlJyx3aWR0aDogMC4xMixhbGlnbjogJ2NlbnRlcicsZm5Jbml0OnNob3dSdW5TdGF0dXN9LCovXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogTXNnLmRldmljZURpYWxvZy5sYXRpZHUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ0xhdGxvbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAwLjE1LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsaWduOiAnY2VudGVyJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbkluaXQ6IHNob3dMYXRsb25nXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgLy/mmL7npLrnu4/nuqzluqYgXHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBzaG93TGF0bG9uZyhkb20sIHZhbHVlLCBkYXRhcykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBsb25naXR1ZGUgPSBMYXRsb25nRm9ybWFydChkYXRhcy5sb25naXR1ZGUpOyAvL+e7j+W6plxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBsYXRpdHVkZSA9IExhdGxvbmdGb3JtYXJ0KGRhdGFzLmxhdGl0dWRlKTsgIC8v57qs5bqmXHJcbiAgICAgICAgICAgICAgICAgICAgZG9tLmh0bWwobG9uZ2l0dWRlICsgXCIgICAgXCIgKyBsYXRpdHVkZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZG9tLnBhcmVudCgpWzBdLnRpdGxlID0gbG9uZ2l0dWRlICsgXCIgICAgXCIgKyBsYXRpdHVkZTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvL+Wwhue7j+e6rOW6pui9rOaNouaIkOS4uuW6puWIhuenklxyXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gTGF0bG9uZ0Zvcm1hcnQodmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gbnVsbCB8fCB2YWx1ZSA9PT0gXCJcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJcIjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBNYXRoLmFicyh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHYxID0gTWF0aC5mbG9vcih2YWx1ZSk7Ly/luqYgIFxyXG4gICAgICAgICAgICAgICAgICAgIHZhciB2MiA9IE1hdGguZmxvb3IoKHZhbHVlIC0gdjEpICogNjApOy8v5YiGICBcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdjMgPSBNYXRoLnJvdW5kKCh2YWx1ZSAtIHYxKSAqIDM2MDAgJSA2MCk7Ly/np5IgIFxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2MSArICfCsCcgKyB2MiArICdcXCcnICsgdjMgKyAnXCInO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8v5pi+56S66L+Q6KGM54q25oCBXHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBzaG93UnVuU3RhdHVzKGRvbSwgdmFsdWUsIGRhdGFzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN0YXRpb25Db2RlID0gZGF0YXMuc3RhdGlvbkNvZGU7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFzdGF0aW9uQ29kZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkb20uaHRtbChNc2cuZGV2aWNlRGlhbG9nLmhhc05vdENvbm5lY3RlZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvbS5wYXJlbnQoKVswXS50aXRsZSA9IE1zZy5kZXZpY2VEaWFsb2cuaGFzTm90Q29ubmVjdGVkO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvbS5odG1sKE1zZy5kZXZpY2VEaWFsb2cuaGFzQ29ubmVjdGVkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZG9tLnBhcmVudCgpWzBdLnRpdGxlID0gTXNnLmRldmljZURpYWxvZy5oYXNDb25uZWN0ZWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8v5pi+56S66K6+5aSH57G75Z6LXHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBzaG93RGV2VHlwZShkb20sIHZhbHVlLCBkYXRhcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGRvbS5odG1sKGRldlR5cGVJZm9DYWNoZVtkYXRhcy5kZXZUeXBlSWRdKTtcclxuICAgICAgICAgICAgICAgICAgICBkb20ucGFyZW50KClbMF0udGl0bGUgPSBkZXZUeXBlSWZvQ2FjaGVbZGF0YXMuZGV2VHlwZUlkXTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgZGV2VHlwZUlmb0NhY2hlID0ge307Ly/orr7lpIfnsbvlnovliY3nq6/kuLTml7bnvJPlrZjvvIznlKjmnaXljLnphY3orr7lpIfliJfooajkuK3nmoTorr7lpIfnsbvlnotpZFxyXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gc2VhcmNoVHlwZUluaXQoZG9tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJC5odHRwLmFqYXgoJy9zaWduYWxjb25mL2dldERldlR5cGVJbmZvJywge30sIGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkYXRhICYmIGRhdGEuc3VjY2Vzcykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKGRhdGEuZGF0YS5saXN0LCBmdW5jdGlvbiAoaSwgdCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOafpeivouWIsOeahOavj+S4gOS4quiuvuWkh+exu+Wei+eahOmAiemhuea3u+WKoFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHQubmFtZSA9IG1haW4uZXZhbCh0Lmxhbmd1YWdlS2V5KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgb3B0ID0gJChcIjxvcHRpb24gdmFsdWU9XCIgKyB0LmlkICsgXCI+XCIgKyB0Lm5hbWUgKyBcIjwvb3B0aW9uPlwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXZUeXBlSWZvQ2FjaGVbdC5pZF0gPSB0Lm5hbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9tLmFwcGVuZChvcHQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBBcHAuYWxlcnQoTXNnLnBhcnRpYWxzLm1haW4uaHAucG92ZXJ0eS5nZXRGYWlsKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgICAgICog5p+l6K+i5oyJ6ZKuXHJcbiAgICAgICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHNlcmFjaCgpIHtcclxuICAgICAgICAgICAgICAgICAgICBzZXJhY2hQYXJhbS5kZXZOYW1lID0gJChcIiNkZXZpY2VfZGlhbG9nX3NlYXJjaF9kZXZOYW1lXCIpLnZhbCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNlcmFjaFBhcmFtLmRldlR5cGVJZCA9ICQoXCIjZGV2aWNlX2RpYWxvZ19zZWFyY2hfZGV2VHlwZVwiKS52YWwoKTtcclxuICAgICAgICAgICAgICAgICAgICAkKCcjZGV2aWNlX2RpYWxvZ19kZXZUYWJsZScpLkdyaWRUYWJsZVNlYXJjaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmFtOiBzZXJhY2hQYXJhbVxyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAgICAgKiDnoa7lrprlkozlj5bmtojmjInpkq5cclxuICAgICAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICAgICAgdmFyIGFkZENsaWNrID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICQoXCIjZGV2aWNlX2RpYWxvZ19pbmRleFwiKS5maW5kKFwiI2RldmljZXNlbGVjdEhoQ2FuY2VsXCIpLmNsaWNrKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJChcIiNcIiArIHAuaWQpLm1vZGFsKFwiaGlkZVwiKTtcclxuICAgICAgICAgICAgICAgICAgICB9KS5lbmQoKS5maW5kKFwiI2RldmljZXNlbGVjdEhoT2tcIikuY2xpY2soZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2VsZWN0ZWRWYWx1ZXMgPSBnZXRkZXZJZHMoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyYW0uaW5wdXQudmFsKHNlbGVjdGVkVmFsdWVzLm5hbWVzKS5hdHRyKFwidmFsdWVcIiwgc2VsZWN0ZWRWYWx1ZXMuZGV2SWRzKS5mb2N1c291dCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJhbS5pbnB1dC5kYXRhKCdzZWxlY3RlZFJlY29yZHMnLCBzZWxlY3RlZFZhbHVlcy5zZWxlY3RlZFJlY29yZHMpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhcmFtLnNpbmdsZVNlbGVjdCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNEYXRhID0gc2VsZWN0ZWRWYWx1ZXMuc2VsZWN0ZWRSZWNvcmRzWzBdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc0RhdGEgPSAkLmV4dGVuZCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGV2aWNlVHlwZTogZGV2VHlwZUlmb0NhY2hlW3NEYXRhLmRldlR5cGVJZF1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIHNEYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmFtLmZuU2VsZWN0ZWQgJiYgcGFyYW0uZm5TZWxlY3RlZChzRGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgJChcIiNcIiArIHAuaWQpLm1vZGFsKFwiaGlkZVwiKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICAgICAqIOiOt+WPluW3sue7j+mAieaLqeeahOiuvuWkh0lk5ZKM5ZCN56ewXHJcbiAgICAgICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgICAgIHZhciBnZXRkZXZJZHMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlbGVjdGVkUmVjb3JkcyA9ICQoJyNkZXZpY2VfZGlhbG9nX2RldlRhYmxlJykuR3JpZFRhYmxlU2VsZWN0ZWRSZWNvcmRzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlcyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBuYW1lcyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgICQuZWFjaChzZWxlY3RlZFJlY29yZHMsIGZ1bmN0aW9uIChpLCBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlcy5wdXNoKGUuZGV2SWQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lcy5wdXNoKGUuZGV2TmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGV2SWRzOiB2YWx1ZXMudG9TdHJpbmcoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZXM6IG5hbWVzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZFJlY29yZHM6IHNlbGVjdGVkUmVjb3Jkc1xyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgICAgICog5bem5L6n5Z+f57uT5p6EXHJcbiAgICAgICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgICAgIHZhciBpbml0VHJlZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdXNlcklkID0gKHBhcmFtLnBhcmFtICYmIHBhcmFtLnBhcmFtLnVzZXJJZCkgfHwgQ29va2llcy5nZXRDb29rKFwidXNlcmlkXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICQuaHR0cC5hamF4KCcvZG9tYWluL3F1ZXJ5VXNlckRvbWFpblN0YVJlcycsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJtZGZVc2VySWRcIjogdXNlcklkXHJcbiAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEgJiYgZGF0YS5zdWNjZXNzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgelRyZWVPYmo7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgek5vZGVzID0gbWFpbi5nZXRabm9kZXMyKGRhdGEuZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgelRyZWVTZXR0aW5nID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyZWVJZDogXCJkZXZMb2NhdGlvbnNcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNoZWNrOiB6VHJlZU9uQ2hlY2ssXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s6IHpUcmVlT25DbGlja1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2s6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hrU3R5bGU6IFwiY2hlY2tib3hcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdXRvQ2hlY2tUcmlnZ2VyOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hrYm94VHlwZToge1wiWVwiOiBcInBzXCIsIFwiTlwiOiBcInBzXCJ9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aWV3OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRibENsaWNrRXhwYW5kOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvd0xpbmU6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZE11bHRpOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvd0ljb246IGZ1bmN0aW9uICh0cmVlaWQsIHRyZWVOb2RlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJlZU5vZGUubW9kZWwgPT0gJ1NUQVRJT04nO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpbXBsZURhdGE6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZTogdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmZuLnpUcmVlLmluaXQoJChcIiNkZXZpY2VfZGlhbG9nX2RvbWFpbnNUcmVlXCIpLCB6VHJlZVNldHRpbmcsIHpOb2Rlcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB6VHJlZU9iaiA9ICQuZm4uelRyZWUuZ2V0WlRyZWVPYmooXCJkZXZpY2VfZGlhbG9nX2RvbWFpbnNUcmVlXCIpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzdGF0aW9uSWRzID0gW107XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHpOb2Rlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh6Tm9kZXNbaV0ubW9kZWwgPT0gJ1NUQVRJT04nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRpb25JZHMucHVzaCh6Tm9kZXNbaV0uaWQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh6Tm9kZXMubGVuZ3RoID4gMCAmJiBzdGF0aW9uSWRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRpb25JZHMgPSBcIk5PU1RBVElPTlwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0aW9uSWRzID0gc3RhdGlvbklkcy5qb2luKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbml0VGFibGUoc3RhdGlvbklkcyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy/ngrnlh7vln5/nu5PmnoTmn6Xor6Lorr7lpIdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHpUcmVlT25DbGljayhldmVudCwgdHJlZUlkLCB0cmVlTm9kZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNlcmFjaFBhcmFtLmRvbWFpbklkID0gelRyZWVPYmouZ2V0U2VsZWN0ZWROb2RlcygpWzBdLmlkO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0cmVlTm9kZS5pc1BhcmVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB6VHJlZU9iai5leHBhbmROb2RlKHRyZWVOb2RlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB6VHJlZU9iai5jaGVja05vZGUodHJlZU5vZGUsICF0cmVlTm9kZS5jaGVja2VkLCB0cnVlLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gelRyZWVPbkNoZWNrKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjaGVja2VkTm9kZXMgPSB6VHJlZU9iai5nZXRDaGVja2VkTm9kZXMoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgc3RhdGlvbklkcyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhc0NoZWNrZWQgPSBjaGVja2VkTm9kZXMubGVuZ3RoID4gMDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja2VkTm9kZXMgPSBoYXNDaGVja2VkID8gY2hlY2tlZE5vZGVzIDogelRyZWVPYmoudHJhbnNmb3JtVG9BcnJheSh6VHJlZU9iai5nZXROb2RlcygpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoZWNrZWROb2Rlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2hlY2tlZE5vZGVzW2ldLm1vZGVsID09ICdTVEFUSU9OJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGlvbklkcy5wdXNoKGNoZWNrZWROb2Rlc1tpXS5pZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGhhc0NoZWNrZWQgJiYgc3RhdGlvbklkcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VyYWNoUGFyYW0uc3RhdGlvbklkcyA9IFwiTk9TVEFUSU9OXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VyYWNoUGFyYW0uc3RhdGlvbklkcyA9IHN0YXRpb25JZHMudG9TdHJpbmcoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VyYWNoKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBBcHAuYWxlcnQoTXNnLnBhcnRpYWxzLm1haW4uaHAucG92ZXJ0eS5nZXRGYWlsKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIGluaXRUcmVlKCk7XHJcbiAgICAgICAgICAgICAgICBhZGRDbGljaygpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9KShqUXVlcnkpO1xyXG59KTsiXSwiZmlsZSI6InBsdWdpbnMvZGV2aWNlRGlhbG9nL2RldmljZURpYWxvZy5qcyJ9
