/**
 * 功能：生成选择电站对话框，显示内容和样式可通过属性配置 日期：2017.01.19
 */
define(['jquery', 'ValidateForm', 'ExpandTable', 'MultiSelect'], function ($) {
    (function ($) {
        $.fn.stationDialog = function (options) {
            var $this = this;
            var p = $.extend({
                pageSize: 20,
                id: "initialStationDialog",
                width: 1000,					                    // 选择框宽度
                height: 560,				                    // 选择框高度
                url: '/station/page',	// 选择框电站列表后台请求地址
                param: {},					                    // 想后台请求的参数
                selector: true,				                    // 选择输入控件id
                toolbarID: '',				                    // 选择框中筛选控件的id
                tableID: '',					                // 选择框中电站表格的id
                submit: false,				                    // 点击确定后的回调函数
                refresh: false,				                    // 点击筛选控件是否执行刷新表格操作
                dialog: null,					                // 选择框结点
                status: [0],					                // 电站状态0：并网,1：在建，2：未建，3：并购中
                combineType: [1, 2],			                // 并网类型筛选条件，1：地面式电站，2：分布式电站
                inverterType: [1, 2, 3, 4],		                // 逆变器类型筛选条件，1：组串式电站，2：集中式电站，3：混合式电站
                singleSelect: false,			                // 是否只选择一个电站  false:多选 true:单选
                onDoubleClick: false,			                // 电站信息列表中的双击回调函数
                loaded: false,				                    // 电站信息列表加载完成的变量标示
                noButtons: false,				                // 不显示查询按钮
                // queryReset: true, // 查询重置选择项
                title: Msg.selectStation,		                // 选择对话框的标题
                groupId: [],                                  // 集团Id
                userId: [],                                   // 用户Id
                isAll: false,                                 // 是否获取全部电站false:
                // 集团下全部电站；true：集团下用户自己所属的电站
                columns:						               // 对话框里电站列表的行
                    ['icon', 'stationName', 'installCapacity', 'combineType', 'inverterType'],
                input: $this
            }, options);

            p.param.combineType = p.combineType.toString();
            p.param.inverterType = p.inverterType.toString();
            p.param.buildState = p.status.toString();

            App.dialog({
                id: p.id,
                title: p.title,
                width: p.width,
                height: p.height
            }).loadPage({url: "js/plugins/stationDialog/selectDialogAddGroup.html"}, {}, function () {
                var param = p;
                var $this = p.input[0];
                var sIds = ($this && $this.defaultValue && $this.defaultValue.split(",")) || [];
                var selectHhStations = $("#selectHhStations").expandTable({
                    maxHeight: 350,
//        			param: param.param,
                    url: param.url,
                    showTitle: true,
                    ellipsis: true,
                    pageSize: param.pageSize,
                    autoHeight: false,
                    noSelectPageSize: true,
                    autoText: true,
                    contentHei: 30,
                    // sortColumn: "stationName",
                    // sortType: "asc",
                    // sortIndexs:[0,1,2,3], //排序列index集合
                    // sortNames:["stationName","combineType","inverterType","installCapacity"],
                    // sortTypes:["asc","asc","asc","asc"],
                    thWidsIndex: [0, 4],
                    thWids: [170, 60],
                    noClickColor: true,
                    // columnName:
                    // ["sid","stationName","combineType","inverterType","installCapacity","no"],
                    columnName: ["stationCode", "stationName", "combineType", "inverterType", "capacity", "no"],
                    headers: [Msg.sm.psm.sname, Msg.sm.psm.combineType, Msg.sm.psm.inverterType, Msg.sm.psm.installCapacity, Msg.main.hhsrc.select],
                    hiddenIndexs: [0],
                    theme: {
                        extend: "a",
                        eDivL: "#C8D0DE",
                        eDivR: "#C8D0DE",
                        eHeaderBg: "#D7E9EF"
                    },
                    renderCell: function (row, col, value, record, nativeRecord) {
                        if (!record) return;
                        if (col == 4) {
                            var sId;
                            var dom = $("<a sid='" + record[0] + "'  class='choose' title='" + Msg.main.hhsrc.select + "'></a>");
                            dom.click(function () {
                                sId = $("#selectDialogAddGroup ul.selectedStations li").attr("sid");
                                if (param.singleSelect) {
                                    $("#selectDialogAddGroup ul.selectedStations li").remove();
                                    showStation(sId);
                                    addSelectNum();
                                }
                                addStation(record, nativeRecord, row, param.singleSelect);
                                var i = $("#selectDialogAddGroup ul.selectedStations li").length;
                                sId = $("#selectDialogAddGroup ul.selectedStations li:nth-child(" + i + ")").attr("sid");
                                sIds[i - 1] = sId;
                            });
                            if (sIds) {
                                for (var j = 0; j < sIds.length; j++) {
                                    if (sIds[j] == record[0]) {
                                        dom.css({'visibility': 'hidden'});
                                        return {dom: dom};
                                    }
                                }
                            }
                            dom.css({'visibility': 'visible'});
                            return {dom: dom};
                        } else if (col == 1) {
                            return Msg.sm.psm.station_type[value - 1];
                        } else if (col == 2) {
                            return Msg.sm.psm.inverter_type[value - 1];
                        } else if (col == 3 || col == 0) {
                            return {dom: $("<span/>").html(value)};
                        }
                    }
                });

                $("#selectDialogAddGroup span.selectedNum").attr("title", Msg.main.hhsrc.selectedStation);

                // 创建子公司树形结构
                var createTree = function () {
                    /*	$.http.ajax("/domain/queryDomainByUserId",{userid:"1"},function(d){
                     if(d.success && d.data && d.data.length>0){
                     initTree(d.data, getPidByUserGroupId(d.data), 0, $("#selectDialogAddGroup .hhTree"));
                     treeAddClick();
                     }
                     })*/
                    var userid = Cookies.getCook("userid");
                    $.http.ajax('/domain/queryDomainByUserId', {
                        "userid": userid
                    }, function (data) {
                        if (data && data.success) {
                            var zTreeObj;
                            var zNodes = main.getZnodes(data.data);
                            var zTreeSetting = {
                                treeId: "Locations",
                                callback: {
                                    onClick: zTreeOnClick
                                },
                                view: {
                                    dblClickExpand: false,
                                    showLine: false,
                                    selectedMulti: false
                                },
                                data: {
                                    simpleData: {
                                        enable: true
                                    }
                                }
                            };
                            $.fn.zTree.init($("#station_ztree"), zTreeSetting, zNodes);
                            zTreeObj = $.fn.zTree.getZTreeObj("station_ztree");
                            //点击域结构查询设备
                            function zTreeOnClick(event, treeId, treeNode) {
                                /* p.param.domainid = zTreeObj.getSelectedNodes()[0].id;
                                 s.search();*/
                            }
                        } else {
                            // App.alert(Msg.partials.main.hp.poverty.getFail || "获取数据失败!");
                        }
                    });

                };

                // 获取根节点的pid
                var getPidByUserGroupId = function (list) {
                    /*  	if(App.stationIds.groupType==1){
                     if(list.length==1){
                     return list[0].pid;
                     }
                     }
                     for(var i=0;i<list.length;i++){
                     if(list[i].orgNo == App.stationIds.groupId){
                     return list[i].pid;
                     }
                     }
                     return 0;*/

                    if (list && list.length > 0) {
                        return list[0].pid;
                    }
                }

                // 初始化树
                var initTree = function (list, pid, level, node) {
                    var ul = $("<div class='items'></div>");
                    var isHas = false;
                    for (var i = 0; i < list.length; i++) {
                        var item = list[i];
                        if (item.pid == pid) {
                            isHas = true;
                            var itemNode = getItemNode(item, level, isLeaf(list, item.id));
                            ul.append(itemNode);
                            initTree(list, item.id, level + 1, itemNode);
                        }
                    }
                    //level!=0 && ul.hide();
                    isHas && node.append(ul);
                }

                // 检查是否叶子节点
                var isLeaf = function (list, id) {
                    var result = true;
                    for (var i = 0; i < list.length; i++) {
                        if (list[i].pid == id) {
                            result = false;
                            break;
                        }

                    }
                    return result;
                }

                // 将数据拼装成html
                var getItemNode = function (item, level, isLeaf) {
                    var paddingLeft = level == 0 ? 0 : 13;
                    var group = level == 0 ? "root" : "leaf";
                    var hide = "";
                    if (isLeaf && level > 0) {
                        hide = "display:none";
                        paddingLeft += 18;
                    }
                    paddingLeft = paddingLeft + "px";
                    var html = "<li class='item' style='padding-left:" + paddingLeft + "'>"
                        + "<div class='detail'>"
                        + "<span class='icon close' style='" + hide + "'></span>"
                        + "<p class='line' style='margin-left:0px'>"
                        + "<span class='son " + group + "'></span>"
                        + "<span class='name' orgNo='" + item.id + "' level='" + level + "' title='" + item.domainName + "' >" + item.domainName + "</span>"
                        + "</p>"
                        + "</div>"
                        + "</li>";
                    var node = $(html);
                    return node;
                };

                // 添加点击事件
                var treeAddClick = function () {
                    $("#selectDialogAddGroup .hhTree").delegate("span.icon", "click", function () {
                        var $this = $(this);
                        if ($this.hasClass("close")) {
                            $this.addClass("open");
                            $this.removeClass("close");
                        } else {
                            $this.addClass("close");
                            $this.removeClass("open");
                        }
                        $(this).parent().next().toggle("fast");
                    }).delegate("p.line", "click", function () {
                        $("#selectDialogAddGroup ul.hhTree").find("p.line").removeClass("selected");
                        $(this).addClass("selected");
                        var orgNo = $(this).find(".name").attr("orgNo");
                        var level = $(this).find(".name").attr("level");
                        var param = {};
                        if (level == 0) {
                            param.orgNo = "";
                        } else {
                            param.orgNo = orgNo;
                        }
                        selectHhStations.search({param: param});
                    })
                }

                var initSelect = function (input) {
                    var names = input.val();
                    var sids = input.attr("value");
                    if (names && names.length > 0) {
                        names = names.split(",");
                    }
                    if (sids && sids.length > 0) {
                        sids = sids.split(",");
                    }
                    if ($.isArray(names) && $.isArray(sids) && names.length == sids.length) {
                        for (var i = 0; i < sids.length; i++) {
                            var item = [];
                            item.push(sids[i]);
                            item.push(names[i]);
                            addStation(item);
                        }
                    }
                }

                var addStation = function (item, nativeRecord, row) {
                    if ($("#selectDialogAddGroup li[sId='" + item[0] + "']").length) {
                        return;
                    }
                    var li = "<li sId='" + item[0] + "' class='stationItem' >"
                        + "	<span class='station' title='" + item[1] + "' >" + item[1] + "</span>"
                            // +" <a class='del'
                            // title='"+Msg.main.hhsrc.delete+"'>"+Msg.main.hhsrc.delete+"</a>"
                        + "	<table style='height:100%'><tr><td><a class='del' title='" + Msg.main.hhsrc.delete + "'></a></td></tr></table>"

                        + "</li>";
                    li = $(li).data("nativeRecord", nativeRecord);
                    $("#selectDialogAddGroup .selectedStations").append(li);
                    if (isScroll()) {
                        li.prev().css("border-bottom", "")
                            .end().css("border-bottom", "none");
                    }
                    addSelectNum();
                    if (param.singleSelect) {
                        selectHhStations.find(".choose").css("visibility", "visible");
                    }
                    hiddenStation(row);
                }
                // 隐藏已经选择后的电站
                var hiddenStation = function (row) {
                    $("#selectHhStations .contentTable tbody tr:eq(" + row + ") td:last div").children().css("visibility", "hidden");
                }

                var delStation = function () {
                    $("#selectDialogAddGroup").delegate("a.del", "click", function () {
                        var sid = $(this).parent().parent().parent().parent().parent().attr("sid");
                        $(this).parent().parent().parent().parent().parent().remove();
                        var li = $("#selectDialogAddGroup .selectedStations").find("li.stationItem:last");
                        if (isScroll()) {
                            li.css("border-bottom", "none");
                        } else {
                            li.css("border-bottom", "");
                        }
                        addSelectNum();
                        showStation(sid);
                    })
                };
                // 显示不再选择的电站
                var showStation = function (sid) {
                    $("#selectHhStations .contentTable tbody tr").each(function () {
                        var sId = $(this).find("td:last").children().children().attr("sid");
                        if (sId == sid) {
                            $(this).find("td:last").children().children().css("visibility", "visible");
                        }
                    });
                    sIds.remove(sid);
                };

                var getSids = function () {
                    var sids = [];
                    var nativeRecords = [];
                    $("#selectDialogAddGroup .selectedStations .stationItem").each(function (i, e) {
                        var sid = $(e).attr("sId") || "";
                        sids.push(sid);
                        nativeRecords.push($(e).data("nativeRecord"));
                    });
                    return {
                        sids: sids.toString(),
                        selectedRecords: nativeRecords
                    };
                };

                var getNames = function () {
                    var names = [];
                    $("#selectDialogAddGroup .selectedStations .stationItem").each(function (i, e) {
                        var name = $.trim($(e).find(".station").text()) || "";
                        names.push(name);
                    });
                    return names.toString();
                };

                var addClick = function () {
                    $("#selectDialogAddGroup").find("#selectHhCancel").click(function () {
                        $("#" + p.id).modal("hide");
                    }).end().find("#selectHhOk").click(function () {
                        var selectedValues = getSids();
                        param.input.val(getNames()).attr("value", selectedValues.sids);
                        if ($.isFunction(param.submit)) {
                            if (param.submit(selectedValues.selectedRecords) != "notClose") {
                                $("#" + p.id).modal("hide");
                            }
                        } else {
                            $("#" + p.id).modal("hide");
                        }

                    });
                };

                // 全选事件
                var selectAll = function () {
                    if (param.singleSelect) {
                        $("#selectDialogAddGroup").find(".selectAll").remove();
                        return;
                    }
                    $("#selectDialogAddGroup").find(".selectAll").attr("title", Msg.household.selectAll).click(function () {
                        selectHhStations.find(".choose").click();
                    });
                };

                var delAll = function () {
                    $("#selectDialogAddGroup").find(".delAll").attr("title", Msg.household.deleteAll).click(function () {
                        $("#selectDialogAddGroup ul.selectedStations li").remove();
                        addSelectNum();
                        selectHhStations.find(".choose").parent().show();
                        selectHhStations.find(".choose").css("visibility", "visible");
                        sIds = [];
                    });
                };

                // 计算选中的电站数量
                var addSelectNum = function () {
                    var size = $("#selectDialogAddGroup").find("a.del").size();
                    $("#selectDialogAddGroup span.selectedNum").html(size);
                };

                // 检查已选中的电站区是否出现竖向滚动条
                var isScroll = function () {
                    var scrollFlag = false;
                    if ($("#selectDialogAddGroup .selectedStations").find("li:first").length) {
                        var top = $("#selectDialogAddGroup .selectedStations").find("li:first").position().top;
                        var scrollTop = $("#selectDialogAddGroup .selectedStations").scrollTop();

                        $("#selectDialogAddGroup .selectedStations").scrollTop(scrollTop + 1);
                        var topAdd = $("#selectDialogAddGroup .selectedStations").find("li:first").position().top;

                        $("#selectDialogAddGroup .selectedStations").scrollTop(scrollTop - 1);
                        var topReduce = $("#selectDialogAddGroup .selectedStations").find("li:first").position().top;

                        if (top != topAdd || top != topReduce) {
                            scrollFlag = true;
                        }
                        $("#selectDialogAddGroup .selectedStations").scrollTop(scrollTop);
                    }
                    return scrollFlag;
                };

                // 电站类型选择框的添加
                var addStationTypeEvent = function () {
                    var zNodes = [];
                    for (var i = 0; i < param.combineType.length; i++) {
                        zNodes.push({
                            id: param.combineType[i],
                            pId: 0,
                            name: Msg.sm.psm.station_type[param.combineType[i] - 1]
                        });
                    }
                    // 使用多选下拉框插件
                    $("#selectDialogAddGroup_combineType").click(function () {
                        $(this).MultiSelect({
                            zNodes: zNodes.concat()
                        });
                    });
                };

                // 添加电站的逆变器类型方法
                var addInverterTypeEvent = function () {
                    var zNodes = [];
                    for (var i = 0; i < param.inverterType.length; i++) {
                        zNodes.push({
                            id: param.inverterType[i],
                            pId: 0,
                            name: Msg.sm.psm.inverter_type[param.inverterType[i] - 1],
                        });
                    }

                    $("#selectDialogAddGroup_inverterType").click(function () {
                        $(this).MultiSelect({
                            zNodes: zNodes.concat()
                        });
                    });
                };

                // 添加查询事件
                var addSearchEvent = function () {
                    $("#selectDialogAddGroup_sbtn").click(function () {
                        var p = getSearchParam();
                        selectHhStations.search({param: p});
                    });
                    $("#selectDialogAddGroup_sname").keyup(function () {
                        if (event.keyCode == 13) {
                            $("#selectDialogAddGroup_sbtn").click();
                        }
                    });
                };

                // 获取查询参数
                var getSearchParam = function () {
                    var combineType = $("#selectDialogAddGroup_combineType").attr("value") || "";
                    var inverterType = $("#selectDialogAddGroup_inverterType").attr("value") || "";
                    var sname = $("#selectDialogAddGroup_sname").val() || "";
                    if (combineType == "ALL" || combineType == "") {
                        combineType = param.combineType.toString();
                    }
                    if (inverterType == "ALL" || inverterType == "") {
                        inverterType = param.inverterType.toString();
                    }
                    return {
                        combineType: combineType,
                        inverterType: inverterType,
                        stationName: sname
                    }
                };

                selectAll();
                delAll();
                createTree();
                delStation();
                addClick();
                addStationTypeEvent();
                addInverterTypeEvent();
                addSearchEvent();
                initSelect(param.input);
            });
        }
    })(jQuery);
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3N0YXRpb25EaWFsb2cvU2VsZWN0RGlhbG9nQWRkR3JvdXAuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIOWKn+iDve+8mueUn+aIkOmAieaLqeeUteermeWvueivneahhu+8jOaYvuekuuWGheWuueWSjOagt+W8j+WPr+mAmui/h+WxnuaAp+mFjee9riDml6XmnJ/vvJoyMDE3LjAxLjE5XHJcbiAqL1xyXG5kZWZpbmUoWydqcXVlcnknLCAnVmFsaWRhdGVGb3JtJywgJ0V4cGFuZFRhYmxlJywgJ011bHRpU2VsZWN0J10sIGZ1bmN0aW9uICgkKSB7XHJcbiAgICAoZnVuY3Rpb24gKCQpIHtcclxuICAgICAgICAkLmZuLnN0YXRpb25EaWFsb2cgPSBmdW5jdGlvbiAob3B0aW9ucykge1xyXG4gICAgICAgICAgICB2YXIgJHRoaXMgPSB0aGlzO1xyXG4gICAgICAgICAgICB2YXIgcCA9ICQuZXh0ZW5kKHtcclxuICAgICAgICAgICAgICAgIHBhZ2VTaXplOiAyMCxcclxuICAgICAgICAgICAgICAgIGlkOiBcImluaXRpYWxTdGF0aW9uRGlhbG9nXCIsXHJcbiAgICAgICAgICAgICAgICB3aWR0aDogMTAwMCxcdFx0XHRcdFx0ICAgICAgICAgICAgICAgICAgICAvLyDpgInmi6nmoYblrr3luqZcclxuICAgICAgICAgICAgICAgIGhlaWdodDogNTYwLFx0XHRcdFx0ICAgICAgICAgICAgICAgICAgICAvLyDpgInmi6nmoYbpq5jluqZcclxuICAgICAgICAgICAgICAgIHVybDogJy9zdGF0aW9uL3BhZ2UnLFx0Ly8g6YCJ5oup5qGG55S156uZ5YiX6KGo5ZCO5Y+w6K+35rGC5Zyw5Z2AXHJcbiAgICAgICAgICAgICAgICBwYXJhbToge30sXHRcdFx0XHRcdCAgICAgICAgICAgICAgICAgICAgLy8g5oOz5ZCO5Y+w6K+35rGC55qE5Y+C5pWwXHJcbiAgICAgICAgICAgICAgICBzZWxlY3RvcjogdHJ1ZSxcdFx0XHRcdCAgICAgICAgICAgICAgICAgICAgLy8g6YCJ5oup6L6T5YWl5o6n5Lu2aWRcclxuICAgICAgICAgICAgICAgIHRvb2xiYXJJRDogJycsXHRcdFx0XHQgICAgICAgICAgICAgICAgICAgIC8vIOmAieaLqeahhuS4reetm+mAieaOp+S7tueahGlkXHJcbiAgICAgICAgICAgICAgICB0YWJsZUlEOiAnJyxcdFx0XHRcdFx0ICAgICAgICAgICAgICAgIC8vIOmAieaLqeahhuS4reeUteermeihqOagvOeahGlkXHJcbiAgICAgICAgICAgICAgICBzdWJtaXQ6IGZhbHNlLFx0XHRcdFx0ICAgICAgICAgICAgICAgICAgICAvLyDngrnlh7vnoa7lrprlkI7nmoTlm57osIPlh73mlbBcclxuICAgICAgICAgICAgICAgIHJlZnJlc2g6IGZhbHNlLFx0XHRcdFx0ICAgICAgICAgICAgICAgICAgICAvLyDngrnlh7vnrZvpgInmjqfku7bmmK/lkKbmiafooYzliLfmlrDooajmoLzmk43kvZxcclxuICAgICAgICAgICAgICAgIGRpYWxvZzogbnVsbCxcdFx0XHRcdFx0ICAgICAgICAgICAgICAgIC8vIOmAieaLqeahhue7k+eCuVxyXG4gICAgICAgICAgICAgICAgc3RhdHVzOiBbMF0sXHRcdFx0XHRcdCAgICAgICAgICAgICAgICAvLyDnlLXnq5nnirbmgIEw77ya5bm2572RLDHvvJrlnKjlu7rvvIwy77ya5pyq5bu677yMM++8muW5tui0reS4rVxyXG4gICAgICAgICAgICAgICAgY29tYmluZVR5cGU6IFsxLCAyXSxcdFx0XHQgICAgICAgICAgICAgICAgLy8g5bm2572R57G75Z6L562b6YCJ5p2h5Lu277yMMe+8muWcsOmdouW8j+eUteerme+8jDLvvJrliIbluIPlvI/nlLXnq5lcclxuICAgICAgICAgICAgICAgIGludmVydGVyVHlwZTogWzEsIDIsIDMsIDRdLFx0XHQgICAgICAgICAgICAgICAgLy8g6YCG5Y+Y5Zmo57G75Z6L562b6YCJ5p2h5Lu277yMMe+8mue7hOS4suW8j+eUteerme+8jDLvvJrpm4bkuK3lvI/nlLXnq5nvvIwz77ya5re35ZCI5byP55S156uZXHJcbiAgICAgICAgICAgICAgICBzaW5nbGVTZWxlY3Q6IGZhbHNlLFx0XHRcdCAgICAgICAgICAgICAgICAvLyDmmK/lkKblj6rpgInmi6nkuIDkuKrnlLXnq5kgIGZhbHNlOuWkmumAiSB0cnVlOuWNlemAiVxyXG4gICAgICAgICAgICAgICAgb25Eb3VibGVDbGljazogZmFsc2UsXHRcdFx0ICAgICAgICAgICAgICAgIC8vIOeUteermeS/oeaBr+WIl+ihqOS4reeahOWPjOWHu+Wbnuiwg+WHveaVsFxyXG4gICAgICAgICAgICAgICAgbG9hZGVkOiBmYWxzZSxcdFx0XHRcdCAgICAgICAgICAgICAgICAgICAgLy8g55S156uZ5L+h5oGv5YiX6KGo5Yqg6L295a6M5oiQ55qE5Y+Y6YeP5qCH56S6XHJcbiAgICAgICAgICAgICAgICBub0J1dHRvbnM6IGZhbHNlLFx0XHRcdFx0ICAgICAgICAgICAgICAgIC8vIOS4jeaYvuekuuafpeivouaMiemSrlxyXG4gICAgICAgICAgICAgICAgLy8gcXVlcnlSZXNldDogdHJ1ZSwgLy8g5p+l6K+i6YeN572u6YCJ5oup6aG5XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogTXNnLnNlbGVjdFN0YXRpb24sXHRcdCAgICAgICAgICAgICAgICAvLyDpgInmi6nlr7nor53moYbnmoTmoIfpophcclxuICAgICAgICAgICAgICAgIGdyb3VwSWQ6IFtdLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDpm4blm6JJZFxyXG4gICAgICAgICAgICAgICAgdXNlcklkOiBbXSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOeUqOaIt0lkXHJcbiAgICAgICAgICAgICAgICBpc0FsbDogZmFsc2UsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5piv5ZCm6I635Y+W5YWo6YOo55S156uZZmFsc2U6XHJcbiAgICAgICAgICAgICAgICAvLyDpm4blm6LkuIvlhajpg6jnlLXnq5nvvJt0cnVl77ya6ZuG5Zui5LiL55So5oi36Ieq5bex5omA5bGe55qE55S156uZXHJcbiAgICAgICAgICAgICAgICBjb2x1bW5zOlx0XHRcdFx0XHRcdCAgICAgICAgICAgICAgIC8vIOWvueivneahhumHjOeUteermeWIl+ihqOeahOihjFxyXG4gICAgICAgICAgICAgICAgICAgIFsnaWNvbicsICdzdGF0aW9uTmFtZScsICdpbnN0YWxsQ2FwYWNpdHknLCAnY29tYmluZVR5cGUnLCAnaW52ZXJ0ZXJUeXBlJ10sXHJcbiAgICAgICAgICAgICAgICBpbnB1dDogJHRoaXNcclxuICAgICAgICAgICAgfSwgb3B0aW9ucyk7XHJcblxyXG4gICAgICAgICAgICBwLnBhcmFtLmNvbWJpbmVUeXBlID0gcC5jb21iaW5lVHlwZS50b1N0cmluZygpO1xyXG4gICAgICAgICAgICBwLnBhcmFtLmludmVydGVyVHlwZSA9IHAuaW52ZXJ0ZXJUeXBlLnRvU3RyaW5nKCk7XHJcbiAgICAgICAgICAgIHAucGFyYW0uYnVpbGRTdGF0ZSA9IHAuc3RhdHVzLnRvU3RyaW5nKCk7XHJcblxyXG4gICAgICAgICAgICBBcHAuZGlhbG9nKHtcclxuICAgICAgICAgICAgICAgIGlkOiBwLmlkLFxyXG4gICAgICAgICAgICAgICAgdGl0bGU6IHAudGl0bGUsXHJcbiAgICAgICAgICAgICAgICB3aWR0aDogcC53aWR0aCxcclxuICAgICAgICAgICAgICAgIGhlaWdodDogcC5oZWlnaHRcclxuICAgICAgICAgICAgfSkubG9hZFBhZ2Uoe3VybDogXCJqcy9wbHVnaW5zL3N0YXRpb25EaWFsb2cvc2VsZWN0RGlhbG9nQWRkR3JvdXAuaHRtbFwifSwge30sIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBwYXJhbSA9IHA7XHJcbiAgICAgICAgICAgICAgICB2YXIgJHRoaXMgPSBwLmlucHV0WzBdO1xyXG4gICAgICAgICAgICAgICAgdmFyIHNJZHMgPSAoJHRoaXMgJiYgJHRoaXMuZGVmYXVsdFZhbHVlICYmICR0aGlzLmRlZmF1bHRWYWx1ZS5zcGxpdChcIixcIikpIHx8IFtdO1xyXG4gICAgICAgICAgICAgICAgdmFyIHNlbGVjdEhoU3RhdGlvbnMgPSAkKFwiI3NlbGVjdEhoU3RhdGlvbnNcIikuZXhwYW5kVGFibGUoe1xyXG4gICAgICAgICAgICAgICAgICAgIG1heEhlaWdodDogMzUwLFxyXG4vLyAgICAgICAgXHRcdFx0cGFyYW06IHBhcmFtLnBhcmFtLFxyXG4gICAgICAgICAgICAgICAgICAgIHVybDogcGFyYW0udXJsLFxyXG4gICAgICAgICAgICAgICAgICAgIHNob3dUaXRsZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICBlbGxpcHNpczogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICBwYWdlU2l6ZTogcGFyYW0ucGFnZVNpemUsXHJcbiAgICAgICAgICAgICAgICAgICAgYXV0b0hlaWdodDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgbm9TZWxlY3RQYWdlU2l6ZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICBhdXRvVGV4dDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICBjb250ZW50SGVpOiAzMCxcclxuICAgICAgICAgICAgICAgICAgICAvLyBzb3J0Q29sdW1uOiBcInN0YXRpb25OYW1lXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gc29ydFR5cGU6IFwiYXNjXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gc29ydEluZGV4czpbMCwxLDIsM10sIC8v5o6S5bqP5YiXaW5kZXjpm4blkIhcclxuICAgICAgICAgICAgICAgICAgICAvLyBzb3J0TmFtZXM6W1wic3RhdGlvbk5hbWVcIixcImNvbWJpbmVUeXBlXCIsXCJpbnZlcnRlclR5cGVcIixcImluc3RhbGxDYXBhY2l0eVwiXSxcclxuICAgICAgICAgICAgICAgICAgICAvLyBzb3J0VHlwZXM6W1wiYXNjXCIsXCJhc2NcIixcImFzY1wiLFwiYXNjXCJdLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoV2lkc0luZGV4OiBbMCwgNF0sXHJcbiAgICAgICAgICAgICAgICAgICAgdGhXaWRzOiBbMTcwLCA2MF0sXHJcbiAgICAgICAgICAgICAgICAgICAgbm9DbGlja0NvbG9yOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbHVtbk5hbWU6XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gW1wic2lkXCIsXCJzdGF0aW9uTmFtZVwiLFwiY29tYmluZVR5cGVcIixcImludmVydGVyVHlwZVwiLFwiaW5zdGFsbENhcGFjaXR5XCIsXCJub1wiXSxcclxuICAgICAgICAgICAgICAgICAgICBjb2x1bW5OYW1lOiBbXCJzdGF0aW9uQ29kZVwiLCBcInN0YXRpb25OYW1lXCIsIFwiY29tYmluZVR5cGVcIiwgXCJpbnZlcnRlclR5cGVcIiwgXCJjYXBhY2l0eVwiLCBcIm5vXCJdLFxyXG4gICAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IFtNc2cuc20ucHNtLnNuYW1lLCBNc2cuc20ucHNtLmNvbWJpbmVUeXBlLCBNc2cuc20ucHNtLmludmVydGVyVHlwZSwgTXNnLnNtLnBzbS5pbnN0YWxsQ2FwYWNpdHksIE1zZy5tYWluLmhoc3JjLnNlbGVjdF0sXHJcbiAgICAgICAgICAgICAgICAgICAgaGlkZGVuSW5kZXhzOiBbMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgdGhlbWU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXh0ZW5kOiBcImFcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgZURpdkw6IFwiI0M4RDBERVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlRGl2UjogXCIjQzhEMERFXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVIZWFkZXJCZzogXCIjRDdFOUVGXCJcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlbmRlckNlbGw6IGZ1bmN0aW9uIChyb3csIGNvbCwgdmFsdWUsIHJlY29yZCwgbmF0aXZlUmVjb3JkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcmVjb3JkKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb2wgPT0gNCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNJZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkb20gPSAkKFwiPGEgc2lkPSdcIiArIHJlY29yZFswXSArIFwiJyAgY2xhc3M9J2Nob29zZScgdGl0bGU9J1wiICsgTXNnLm1haW4uaGhzcmMuc2VsZWN0ICsgXCInPjwvYT5cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb20uY2xpY2soZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNJZCA9ICQoXCIjc2VsZWN0RGlhbG9nQWRkR3JvdXAgdWwuc2VsZWN0ZWRTdGF0aW9ucyBsaVwiKS5hdHRyKFwic2lkXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXJhbS5zaW5nbGVTZWxlY3QpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChcIiNzZWxlY3REaWFsb2dBZGRHcm91cCB1bC5zZWxlY3RlZFN0YXRpb25zIGxpXCIpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaG93U3RhdGlvbihzSWQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRTZWxlY3ROdW0oKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkU3RhdGlvbihyZWNvcmQsIG5hdGl2ZVJlY29yZCwgcm93LCBwYXJhbS5zaW5nbGVTZWxlY3QpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpID0gJChcIiNzZWxlY3REaWFsb2dBZGRHcm91cCB1bC5zZWxlY3RlZFN0YXRpb25zIGxpXCIpLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzSWQgPSAkKFwiI3NlbGVjdERpYWxvZ0FkZEdyb3VwIHVsLnNlbGVjdGVkU3RhdGlvbnMgbGk6bnRoLWNoaWxkKFwiICsgaSArIFwiKVwiKS5hdHRyKFwic2lkXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNJZHNbaSAtIDFdID0gc0lkO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc0lkcykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgc0lkcy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc0lkc1tqXSA9PSByZWNvcmRbMF0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvbS5jc3Moeyd2aXNpYmlsaXR5JzogJ2hpZGRlbid9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7ZG9tOiBkb219O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9tLmNzcyh7J3Zpc2liaWxpdHknOiAndmlzaWJsZSd9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7ZG9tOiBkb219O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNvbCA9PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gTXNnLnNtLnBzbS5zdGF0aW9uX3R5cGVbdmFsdWUgLSAxXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjb2wgPT0gMikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE1zZy5zbS5wc20uaW52ZXJ0ZXJfdHlwZVt2YWx1ZSAtIDFdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNvbCA9PSAzIHx8IGNvbCA9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge2RvbTogJChcIjxzcGFuLz5cIikuaHRtbCh2YWx1ZSl9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgJChcIiNzZWxlY3REaWFsb2dBZGRHcm91cCBzcGFuLnNlbGVjdGVkTnVtXCIpLmF0dHIoXCJ0aXRsZVwiLCBNc2cubWFpbi5oaHNyYy5zZWxlY3RlZFN0YXRpb24pO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIOWIm+W7uuWtkOWFrOWPuOagkeW9oue7k+aehFxyXG4gICAgICAgICAgICAgICAgdmFyIGNyZWF0ZVRyZWUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLypcdCQuaHR0cC5hamF4KFwiL2RvbWFpbi9xdWVyeURvbWFpbkJ5VXNlcklkXCIse3VzZXJpZDpcIjFcIn0sZnVuY3Rpb24oZCl7XHJcbiAgICAgICAgICAgICAgICAgICAgIGlmKGQuc3VjY2VzcyAmJiBkLmRhdGEgJiYgZC5kYXRhLmxlbmd0aD4wKXtcclxuICAgICAgICAgICAgICAgICAgICAgaW5pdFRyZWUoZC5kYXRhLCBnZXRQaWRCeVVzZXJHcm91cElkKGQuZGF0YSksIDAsICQoXCIjc2VsZWN0RGlhbG9nQWRkR3JvdXAgLmhoVHJlZVwiKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgIHRyZWVBZGRDbGljaygpO1xyXG4gICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgIH0pKi9cclxuICAgICAgICAgICAgICAgICAgICB2YXIgdXNlcmlkID0gQ29va2llcy5nZXRDb29rKFwidXNlcmlkXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICQuaHR0cC5hamF4KCcvZG9tYWluL3F1ZXJ5RG9tYWluQnlVc2VySWQnLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidXNlcmlkXCI6IHVzZXJpZFxyXG4gICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkYXRhICYmIGRhdGEuc3VjY2Vzcykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHpUcmVlT2JqO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHpOb2RlcyA9IG1haW4uZ2V0Wm5vZGVzKGRhdGEuZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgelRyZWVTZXR0aW5nID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyZWVJZDogXCJMb2NhdGlvbnNcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrOiB6VHJlZU9uQ2xpY2tcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpZXc6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGJsQ2xpY2tFeHBhbmQ6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaG93TGluZTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkTXVsdGk6IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpbXBsZURhdGE6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZTogdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuZm4uelRyZWUuaW5pdCgkKFwiI3N0YXRpb25fenRyZWVcIiksIHpUcmVlU2V0dGluZywgek5vZGVzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHpUcmVlT2JqID0gJC5mbi56VHJlZS5nZXRaVHJlZU9iaihcInN0YXRpb25fenRyZWVcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL+eCueWHu+Wfn+e7k+aehOafpeivouiuvuWkh1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gelRyZWVPbkNsaWNrKGV2ZW50LCB0cmVlSWQsIHRyZWVOb2RlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogcC5wYXJhbS5kb21haW5pZCA9IHpUcmVlT2JqLmdldFNlbGVjdGVkTm9kZXMoKVswXS5pZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcy5zZWFyY2goKTsqL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQXBwLmFsZXJ0KE1zZy5wYXJ0aWFscy5tYWluLmhwLnBvdmVydHkuZ2V0RmFpbCB8fCBcIuiOt+WPluaVsOaNruWksei0pSFcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIOiOt+WPluagueiKgueCueeahHBpZFxyXG4gICAgICAgICAgICAgICAgdmFyIGdldFBpZEJ5VXNlckdyb3VwSWQgPSBmdW5jdGlvbiAobGlzdCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8qICBcdGlmKEFwcC5zdGF0aW9uSWRzLmdyb3VwVHlwZT09MSl7XHJcbiAgICAgICAgICAgICAgICAgICAgIGlmKGxpc3QubGVuZ3RoPT0xKXtcclxuICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGxpc3RbMF0ucGlkO1xyXG4gICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgZm9yKHZhciBpPTA7aTxsaXN0Lmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICAgICAgICAgICBpZihsaXN0W2ldLm9yZ05vID09IEFwcC5zdGF0aW9uSWRzLmdyb3VwSWQpe1xyXG4gICAgICAgICAgICAgICAgICAgICByZXR1cm4gbGlzdFtpXS5waWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICByZXR1cm4gMDsqL1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAobGlzdCAmJiBsaXN0Lmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGxpc3RbMF0ucGlkO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyDliJ3lp4vljJbmoJFcclxuICAgICAgICAgICAgICAgIHZhciBpbml0VHJlZSA9IGZ1bmN0aW9uIChsaXN0LCBwaWQsIGxldmVsLCBub2RlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHVsID0gJChcIjxkaXYgY2xhc3M9J2l0ZW1zJz48L2Rpdj5cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlzSGFzID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpdGVtID0gbGlzdFtpXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0ucGlkID09IHBpZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNIYXMgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGl0ZW1Ob2RlID0gZ2V0SXRlbU5vZGUoaXRlbSwgbGV2ZWwsIGlzTGVhZihsaXN0LCBpdGVtLmlkKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bC5hcHBlbmQoaXRlbU5vZGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5pdFRyZWUobGlzdCwgaXRlbS5pZCwgbGV2ZWwgKyAxLCBpdGVtTm9kZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgLy9sZXZlbCE9MCAmJiB1bC5oaWRlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaXNIYXMgJiYgbm9kZS5hcHBlbmQodWwpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIOajgOafpeaYr+WQpuWPtuWtkOiKgueCuVxyXG4gICAgICAgICAgICAgICAgdmFyIGlzTGVhZiA9IGZ1bmN0aW9uIChsaXN0LCBpZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobGlzdFtpXS5waWQgPT0gaWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8g5bCG5pWw5o2u5ou86KOF5oiQaHRtbFxyXG4gICAgICAgICAgICAgICAgdmFyIGdldEl0ZW1Ob2RlID0gZnVuY3Rpb24gKGl0ZW0sIGxldmVsLCBpc0xlYWYpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcGFkZGluZ0xlZnQgPSBsZXZlbCA9PSAwID8gMCA6IDEzO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBncm91cCA9IGxldmVsID09IDAgPyBcInJvb3RcIiA6IFwibGVhZlwiO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBoaWRlID0gXCJcIjtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaXNMZWFmICYmIGxldmVsID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBoaWRlID0gXCJkaXNwbGF5Om5vbmVcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZ0xlZnQgKz0gMTg7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHBhZGRpbmdMZWZ0ID0gcGFkZGluZ0xlZnQgKyBcInB4XCI7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGh0bWwgPSBcIjxsaSBjbGFzcz0naXRlbScgc3R5bGU9J3BhZGRpbmctbGVmdDpcIiArIHBhZGRpbmdMZWZ0ICsgXCInPlwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICsgXCI8ZGl2IGNsYXNzPSdkZXRhaWwnPlwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICsgXCI8c3BhbiBjbGFzcz0naWNvbiBjbG9zZScgc3R5bGU9J1wiICsgaGlkZSArIFwiJz48L3NwYW4+XCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgKyBcIjxwIGNsYXNzPSdsaW5lJyBzdHlsZT0nbWFyZ2luLWxlZnQ6MHB4Jz5cIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICArIFwiPHNwYW4gY2xhc3M9J3NvbiBcIiArIGdyb3VwICsgXCInPjwvc3Bhbj5cIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICArIFwiPHNwYW4gY2xhc3M9J25hbWUnIG9yZ05vPSdcIiArIGl0ZW0uaWQgKyBcIicgbGV2ZWw9J1wiICsgbGV2ZWwgKyBcIicgdGl0bGU9J1wiICsgaXRlbS5kb21haW5OYW1lICsgXCInID5cIiArIGl0ZW0uZG9tYWluTmFtZSArIFwiPC9zcGFuPlwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICsgXCI8L3A+XCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgKyBcIjwvZGl2PlwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICsgXCI8L2xpPlwiO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBub2RlID0gJChodG1sKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbm9kZTtcclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgLy8g5re75Yqg54K55Ye75LqL5Lu2XHJcbiAgICAgICAgICAgICAgICB2YXIgdHJlZUFkZENsaWNrID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICQoXCIjc2VsZWN0RGlhbG9nQWRkR3JvdXAgLmhoVHJlZVwiKS5kZWxlZ2F0ZShcInNwYW4uaWNvblwiLCBcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyICR0aGlzID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCR0aGlzLmhhc0NsYXNzKFwiY2xvc2VcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0aGlzLmFkZENsYXNzKFwib3BlblwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0aGlzLnJlbW92ZUNsYXNzKFwiY2xvc2VcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdGhpcy5hZGRDbGFzcyhcImNsb3NlXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHRoaXMucmVtb3ZlQ2xhc3MoXCJvcGVuXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykucGFyZW50KCkubmV4dCgpLnRvZ2dsZShcImZhc3RcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgfSkuZGVsZWdhdGUoXCJwLmxpbmVcIiwgXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQoXCIjc2VsZWN0RGlhbG9nQWRkR3JvdXAgdWwuaGhUcmVlXCIpLmZpbmQoXCJwLmxpbmVcIikucmVtb3ZlQ2xhc3MoXCJzZWxlY3RlZFwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5hZGRDbGFzcyhcInNlbGVjdGVkXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgb3JnTm8gPSAkKHRoaXMpLmZpbmQoXCIubmFtZVwiKS5hdHRyKFwib3JnTm9cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsZXZlbCA9ICQodGhpcykuZmluZChcIi5uYW1lXCIpLmF0dHIoXCJsZXZlbFwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHBhcmFtID0ge307XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsZXZlbCA9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJhbS5vcmdObyA9IFwiXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJhbS5vcmdObyA9IG9yZ05vO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdEhoU3RhdGlvbnMuc2VhcmNoKHtwYXJhbTogcGFyYW19KTtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhciBpbml0U2VsZWN0ID0gZnVuY3Rpb24gKGlucHV0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5hbWVzID0gaW5wdXQudmFsKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNpZHMgPSBpbnB1dC5hdHRyKFwidmFsdWVcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5hbWVzICYmIG5hbWVzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZXMgPSBuYW1lcy5zcGxpdChcIixcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzaWRzICYmIHNpZHMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzaWRzID0gc2lkcy5zcGxpdChcIixcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICgkLmlzQXJyYXkobmFtZXMpICYmICQuaXNBcnJheShzaWRzKSAmJiBuYW1lcy5sZW5ndGggPT0gc2lkcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzaWRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaXRlbSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5wdXNoKHNpZHNbaV0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5wdXNoKG5hbWVzW2ldKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkZFN0YXRpb24oaXRlbSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGFkZFN0YXRpb24gPSBmdW5jdGlvbiAoaXRlbSwgbmF0aXZlUmVjb3JkLCByb3cpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoJChcIiNzZWxlY3REaWFsb2dBZGRHcm91cCBsaVtzSWQ9J1wiICsgaXRlbVswXSArIFwiJ11cIikubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxpID0gXCI8bGkgc0lkPSdcIiArIGl0ZW1bMF0gKyBcIicgY2xhc3M9J3N0YXRpb25JdGVtJyA+XCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgKyBcIlx0PHNwYW4gY2xhc3M9J3N0YXRpb24nIHRpdGxlPSdcIiArIGl0ZW1bMV0gKyBcIicgPlwiICsgaXRlbVsxXSArIFwiPC9zcGFuPlwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyArXCIgPGEgY2xhc3M9J2RlbCdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRpdGxlPSdcIitNc2cubWFpbi5oaHNyYy5kZWxldGUrXCInPlwiK01zZy5tYWluLmhoc3JjLmRlbGV0ZStcIjwvYT5cIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICArIFwiXHQ8dGFibGUgc3R5bGU9J2hlaWdodDoxMDAlJz48dHI+PHRkPjxhIGNsYXNzPSdkZWwnIHRpdGxlPSdcIiArIE1zZy5tYWluLmhoc3JjLmRlbGV0ZSArIFwiJz48L2E+PC90ZD48L3RyPjwvdGFibGU+XCJcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICsgXCI8L2xpPlwiO1xyXG4gICAgICAgICAgICAgICAgICAgIGxpID0gJChsaSkuZGF0YShcIm5hdGl2ZVJlY29yZFwiLCBuYXRpdmVSZWNvcmQpO1xyXG4gICAgICAgICAgICAgICAgICAgICQoXCIjc2VsZWN0RGlhbG9nQWRkR3JvdXAgLnNlbGVjdGVkU3RhdGlvbnNcIikuYXBwZW5kKGxpKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaXNTY3JvbGwoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsaS5wcmV2KCkuY3NzKFwiYm9yZGVyLWJvdHRvbVwiLCBcIlwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmVuZCgpLmNzcyhcImJvcmRlci1ib3R0b21cIiwgXCJub25lXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBhZGRTZWxlY3ROdW0oKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocGFyYW0uc2luZ2xlU2VsZWN0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdEhoU3RhdGlvbnMuZmluZChcIi5jaG9vc2VcIikuY3NzKFwidmlzaWJpbGl0eVwiLCBcInZpc2libGVcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGhpZGRlblN0YXRpb24ocm93KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIOmakOiXj+W3sue7j+mAieaLqeWQjueahOeUteermVxyXG4gICAgICAgICAgICAgICAgdmFyIGhpZGRlblN0YXRpb24gPSBmdW5jdGlvbiAocm93KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJChcIiNzZWxlY3RIaFN0YXRpb25zIC5jb250ZW50VGFibGUgdGJvZHkgdHI6ZXEoXCIgKyByb3cgKyBcIikgdGQ6bGFzdCBkaXZcIikuY2hpbGRyZW4oKS5jc3MoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhciBkZWxTdGF0aW9uID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICQoXCIjc2VsZWN0RGlhbG9nQWRkR3JvdXBcIikuZGVsZWdhdGUoXCJhLmRlbFwiLCBcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNpZCA9ICQodGhpcykucGFyZW50KCkucGFyZW50KCkucGFyZW50KCkucGFyZW50KCkucGFyZW50KCkuYXR0cihcInNpZFwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5wYXJlbnQoKS5wYXJlbnQoKS5wYXJlbnQoKS5wYXJlbnQoKS5wYXJlbnQoKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxpID0gJChcIiNzZWxlY3REaWFsb2dBZGRHcm91cCAuc2VsZWN0ZWRTdGF0aW9uc1wiKS5maW5kKFwibGkuc3RhdGlvbkl0ZW06bGFzdFwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzU2Nyb2xsKCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpLmNzcyhcImJvcmRlci1ib3R0b21cIiwgXCJub25lXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGkuY3NzKFwiYm9yZGVyLWJvdHRvbVwiLCBcIlwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhZGRTZWxlY3ROdW0oKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2hvd1N0YXRpb24oc2lkKTtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIC8vIOaYvuekuuS4jeWGjemAieaLqeeahOeUteermVxyXG4gICAgICAgICAgICAgICAgdmFyIHNob3dTdGF0aW9uID0gZnVuY3Rpb24gKHNpZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICQoXCIjc2VsZWN0SGhTdGF0aW9ucyAuY29udGVudFRhYmxlIHRib2R5IHRyXCIpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc0lkID0gJCh0aGlzKS5maW5kKFwidGQ6bGFzdFwiKS5jaGlsZHJlbigpLmNoaWxkcmVuKCkuYXR0cihcInNpZFwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNJZCA9PSBzaWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykuZmluZChcInRkOmxhc3RcIikuY2hpbGRyZW4oKS5jaGlsZHJlbigpLmNzcyhcInZpc2liaWxpdHlcIiwgXCJ2aXNpYmxlXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgc0lkcy5yZW1vdmUoc2lkKTtcclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGdldFNpZHMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNpZHMgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbmF0aXZlUmVjb3JkcyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgICQoXCIjc2VsZWN0RGlhbG9nQWRkR3JvdXAgLnNlbGVjdGVkU3RhdGlvbnMgLnN0YXRpb25JdGVtXCIpLmVhY2goZnVuY3Rpb24gKGksIGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNpZCA9ICQoZSkuYXR0cihcInNJZFwiKSB8fCBcIlwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzaWRzLnB1c2goc2lkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmF0aXZlUmVjb3Jkcy5wdXNoKCQoZSkuZGF0YShcIm5hdGl2ZVJlY29yZFwiKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2lkczogc2lkcy50b1N0cmluZygpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZFJlY29yZHM6IG5hdGl2ZVJlY29yZHNcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgZ2V0TmFtZXMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5hbWVzID0gW107XHJcbiAgICAgICAgICAgICAgICAgICAgJChcIiNzZWxlY3REaWFsb2dBZGRHcm91cCAuc2VsZWN0ZWRTdGF0aW9ucyAuc3RhdGlvbkl0ZW1cIikuZWFjaChmdW5jdGlvbiAoaSwgZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbmFtZSA9ICQudHJpbSgkKGUpLmZpbmQoXCIuc3RhdGlvblwiKS50ZXh0KCkpIHx8IFwiXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWVzLnB1c2gobmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5hbWVzLnRvU3RyaW5nKCk7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBhZGRDbGljayA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAkKFwiI3NlbGVjdERpYWxvZ0FkZEdyb3VwXCIpLmZpbmQoXCIjc2VsZWN0SGhDYW5jZWxcIikuY2xpY2soZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKFwiI1wiICsgcC5pZCkubW9kYWwoXCJoaWRlXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pLmVuZCgpLmZpbmQoXCIjc2VsZWN0SGhPa1wiKS5jbGljayhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzZWxlY3RlZFZhbHVlcyA9IGdldFNpZHMoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyYW0uaW5wdXQudmFsKGdldE5hbWVzKCkpLmF0dHIoXCJ2YWx1ZVwiLCBzZWxlY3RlZFZhbHVlcy5zaWRzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCQuaXNGdW5jdGlvbihwYXJhbS5zdWJtaXQpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocGFyYW0uc3VibWl0KHNlbGVjdGVkVmFsdWVzLnNlbGVjdGVkUmVjb3JkcykgIT0gXCJub3RDbG9zZVwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChcIiNcIiArIHAuaWQpLm1vZGFsKFwiaGlkZVwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoXCIjXCIgKyBwLmlkKS5tb2RhbChcImhpZGVcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIOWFqOmAieS6i+S7tlxyXG4gICAgICAgICAgICAgICAgdmFyIHNlbGVjdEFsbCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocGFyYW0uc2luZ2xlU2VsZWN0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQoXCIjc2VsZWN0RGlhbG9nQWRkR3JvdXBcIikuZmluZChcIi5zZWxlY3RBbGxcIikucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgJChcIiNzZWxlY3REaWFsb2dBZGRHcm91cFwiKS5maW5kKFwiLnNlbGVjdEFsbFwiKS5hdHRyKFwidGl0bGVcIiwgTXNnLmhvdXNlaG9sZC5zZWxlY3RBbGwpLmNsaWNrKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0SGhTdGF0aW9ucy5maW5kKFwiLmNob29zZVwiKS5jbGljaygpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgZGVsQWxsID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICQoXCIjc2VsZWN0RGlhbG9nQWRkR3JvdXBcIikuZmluZChcIi5kZWxBbGxcIikuYXR0cihcInRpdGxlXCIsIE1zZy5ob3VzZWhvbGQuZGVsZXRlQWxsKS5jbGljayhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQoXCIjc2VsZWN0RGlhbG9nQWRkR3JvdXAgdWwuc2VsZWN0ZWRTdGF0aW9ucyBsaVwiKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWRkU2VsZWN0TnVtKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdEhoU3RhdGlvbnMuZmluZChcIi5jaG9vc2VcIikucGFyZW50KCkuc2hvdygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxlY3RIaFN0YXRpb25zLmZpbmQoXCIuY2hvb3NlXCIpLmNzcyhcInZpc2liaWxpdHlcIiwgXCJ2aXNpYmxlXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzSWRzID0gW107XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIOiuoeeul+mAieS4reeahOeUteermeaVsOmHj1xyXG4gICAgICAgICAgICAgICAgdmFyIGFkZFNlbGVjdE51bSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgc2l6ZSA9ICQoXCIjc2VsZWN0RGlhbG9nQWRkR3JvdXBcIikuZmluZChcImEuZGVsXCIpLnNpemUoKTtcclxuICAgICAgICAgICAgICAgICAgICAkKFwiI3NlbGVjdERpYWxvZ0FkZEdyb3VwIHNwYW4uc2VsZWN0ZWROdW1cIikuaHRtbChzaXplKTtcclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgLy8g5qOA5p+l5bey6YCJ5Lit55qE55S156uZ5Yy65piv5ZCm5Ye6546w56uW5ZCR5rua5Yqo5p2hXHJcbiAgICAgICAgICAgICAgICB2YXIgaXNTY3JvbGwgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNjcm9sbEZsYWcgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoJChcIiNzZWxlY3REaWFsb2dBZGRHcm91cCAuc2VsZWN0ZWRTdGF0aW9uc1wiKS5maW5kKFwibGk6Zmlyc3RcIikubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0b3AgPSAkKFwiI3NlbGVjdERpYWxvZ0FkZEdyb3VwIC5zZWxlY3RlZFN0YXRpb25zXCIpLmZpbmQoXCJsaTpmaXJzdFwiKS5wb3NpdGlvbigpLnRvcDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNjcm9sbFRvcCA9ICQoXCIjc2VsZWN0RGlhbG9nQWRkR3JvdXAgLnNlbGVjdGVkU3RhdGlvbnNcIikuc2Nyb2xsVG9wKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKFwiI3NlbGVjdERpYWxvZ0FkZEdyb3VwIC5zZWxlY3RlZFN0YXRpb25zXCIpLnNjcm9sbFRvcChzY3JvbGxUb3AgKyAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRvcEFkZCA9ICQoXCIjc2VsZWN0RGlhbG9nQWRkR3JvdXAgLnNlbGVjdGVkU3RhdGlvbnNcIikuZmluZChcImxpOmZpcnN0XCIpLnBvc2l0aW9uKCkudG9wO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgJChcIiNzZWxlY3REaWFsb2dBZGRHcm91cCAuc2VsZWN0ZWRTdGF0aW9uc1wiKS5zY3JvbGxUb3Aoc2Nyb2xsVG9wIC0gMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0b3BSZWR1Y2UgPSAkKFwiI3NlbGVjdERpYWxvZ0FkZEdyb3VwIC5zZWxlY3RlZFN0YXRpb25zXCIpLmZpbmQoXCJsaTpmaXJzdFwiKS5wb3NpdGlvbigpLnRvcDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0b3AgIT0gdG9wQWRkIHx8IHRvcCAhPSB0b3BSZWR1Y2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjcm9sbEZsYWcgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQoXCIjc2VsZWN0RGlhbG9nQWRkR3JvdXAgLnNlbGVjdGVkU3RhdGlvbnNcIikuc2Nyb2xsVG9wKHNjcm9sbFRvcCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzY3JvbGxGbGFnO1xyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyDnlLXnq5nnsbvlnovpgInmi6nmoYbnmoTmt7vliqBcclxuICAgICAgICAgICAgICAgIHZhciBhZGRTdGF0aW9uVHlwZUV2ZW50ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB6Tm9kZXMgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhcmFtLmNvbWJpbmVUeXBlLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHpOb2Rlcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBwYXJhbS5jb21iaW5lVHlwZVtpXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBJZDogMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IE1zZy5zbS5wc20uc3RhdGlvbl90eXBlW3BhcmFtLmNvbWJpbmVUeXBlW2ldIC0gMV1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIOS9v+eUqOWkmumAieS4i+aLieahhuaPkuS7tlxyXG4gICAgICAgICAgICAgICAgICAgICQoXCIjc2VsZWN0RGlhbG9nQWRkR3JvdXBfY29tYmluZVR5cGVcIikuY2xpY2soZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLk11bHRpU2VsZWN0KHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHpOb2Rlczogek5vZGVzLmNvbmNhdCgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyDmt7vliqDnlLXnq5nnmoTpgIblj5jlmajnsbvlnovmlrnms5VcclxuICAgICAgICAgICAgICAgIHZhciBhZGRJbnZlcnRlclR5cGVFdmVudCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgek5vZGVzID0gW107XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXJhbS5pbnZlcnRlclR5cGUubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgek5vZGVzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHBhcmFtLmludmVydGVyVHlwZVtpXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBJZDogMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IE1zZy5zbS5wc20uaW52ZXJ0ZXJfdHlwZVtwYXJhbS5pbnZlcnRlclR5cGVbaV0gLSAxXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAkKFwiI3NlbGVjdERpYWxvZ0FkZEdyb3VwX2ludmVydGVyVHlwZVwiKS5jbGljayhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykuTXVsdGlTZWxlY3Qoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgek5vZGVzOiB6Tm9kZXMuY29uY2F0KClcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIOa3u+WKoOafpeivouS6i+S7tlxyXG4gICAgICAgICAgICAgICAgdmFyIGFkZFNlYXJjaEV2ZW50ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICQoXCIjc2VsZWN0RGlhbG9nQWRkR3JvdXBfc2J0blwiKS5jbGljayhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwID0gZ2V0U2VhcmNoUGFyYW0oKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0SGhTdGF0aW9ucy5zZWFyY2goe3BhcmFtOiBwfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgJChcIiNzZWxlY3REaWFsb2dBZGRHcm91cF9zbmFtZVwiKS5rZXl1cChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChldmVudC5rZXlDb2RlID09IDEzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKFwiI3NlbGVjdERpYWxvZ0FkZEdyb3VwX3NidG5cIikuY2xpY2soKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyDojrflj5bmn6Xor6Llj4LmlbBcclxuICAgICAgICAgICAgICAgIHZhciBnZXRTZWFyY2hQYXJhbSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgY29tYmluZVR5cGUgPSAkKFwiI3NlbGVjdERpYWxvZ0FkZEdyb3VwX2NvbWJpbmVUeXBlXCIpLmF0dHIoXCJ2YWx1ZVwiKSB8fCBcIlwiO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBpbnZlcnRlclR5cGUgPSAkKFwiI3NlbGVjdERpYWxvZ0FkZEdyb3VwX2ludmVydGVyVHlwZVwiKS5hdHRyKFwidmFsdWVcIikgfHwgXCJcIjtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgc25hbWUgPSAkKFwiI3NlbGVjdERpYWxvZ0FkZEdyb3VwX3NuYW1lXCIpLnZhbCgpIHx8IFwiXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbWJpbmVUeXBlID09IFwiQUxMXCIgfHwgY29tYmluZVR5cGUgPT0gXCJcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21iaW5lVHlwZSA9IHBhcmFtLmNvbWJpbmVUeXBlLnRvU3RyaW5nKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpbnZlcnRlclR5cGUgPT0gXCJBTExcIiB8fCBpbnZlcnRlclR5cGUgPT0gXCJcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnZlcnRlclR5cGUgPSBwYXJhbS5pbnZlcnRlclR5cGUudG9TdHJpbmcoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29tYmluZVR5cGU6IGNvbWJpbmVUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnZlcnRlclR5cGU6IGludmVydGVyVHlwZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGlvbk5hbWU6IHNuYW1lXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICBzZWxlY3RBbGwoKTtcclxuICAgICAgICAgICAgICAgIGRlbEFsbCgpO1xyXG4gICAgICAgICAgICAgICAgY3JlYXRlVHJlZSgpO1xyXG4gICAgICAgICAgICAgICAgZGVsU3RhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgYWRkQ2xpY2soKTtcclxuICAgICAgICAgICAgICAgIGFkZFN0YXRpb25UeXBlRXZlbnQoKTtcclxuICAgICAgICAgICAgICAgIGFkZEludmVydGVyVHlwZUV2ZW50KCk7XHJcbiAgICAgICAgICAgICAgICBhZGRTZWFyY2hFdmVudCgpO1xyXG4gICAgICAgICAgICAgICAgaW5pdFNlbGVjdChwYXJhbS5pbnB1dCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pKGpRdWVyeSk7XHJcbn0pOyJdLCJmaWxlIjoicGx1Z2lucy9zdGF0aW9uRGlhbG9nL1NlbGVjdERpYWxvZ0FkZEdyb3VwLmpzIn0=
