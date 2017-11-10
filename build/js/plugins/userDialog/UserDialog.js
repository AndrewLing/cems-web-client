/**
 * 功能：用户选择框，显示内容和样式可通过属性配置
 * 日期：2015.4.9
 */
define(['jquery', 'ValidateForm', 'GridTable','css!plugins/userDialog/css/UserDialog.css','zTree', 'zTree.excheck', 'zTree.exedit', 'zTree.exhide'], function ($) {

    $.addSelectUser = function (t, options) {
        var isGroupId = false;
        var userId = Cookies.getCook("userid");
        var p = $.extend({
        	id:"initUserDialogId",
            width: 1000,					                    // 选择框宽度
            height: 'auto',				                    // 选择框高度
            url: '/user/queryUsers',	                        // 选择框电站列表后台请求地址
            param: {"userid": userId},	 // 向后台请求的参数
            domainUrl: '/domain/queryDomainByUserId',       // 区域树后台请求地址
            submit: false,				                    // 点击确定后的回调函数
            refresh: false,				                    // 点击筛选控件是否执行刷新表格操作
            dialog: null,					                // 选择框结点
            singleSelect: false,			                // 信息列表中的单击回调函数
            initUserId: null,			                // 初始化userId
            onDoubleClick: false,
            selector: true,
            // 电站信息列表中的双击回调函数
            loaded: false,				                    // 信息列表加载完成的变量标示
            noButtons: false,				                // 不显示查询按钮
            // queryReset: true,                               // 查询重置选择项
            title: Msg.userDialog.choose,		                         // 选择对话框的标题
            columns:						                // 对话框里列表的行
                ['loginName', 'userName','userType', 'tel', 'occupLevel','status'],
            buttons:              		                    // 表单按钮
                [
                    [
                        {
                            input: 'button',
                            type: 'button',
                            show: Msg.sure,
                            name: '',
                            align: 'right',
                            width: '50%',
                            unit: '&nbsp;&nbsp;&nbsp;&nbsp;',
                            extend: {'class': 'btn blueBtn btnThemeA noIcon'},
                            fnClick: submit
                        },
                        {
                            input: 'button',
                            type: 'button',
                            show: Msg.cancel,
                            name: '',
                            align: 'left',
                            width: '49%',
                            extend: {'class': 'btn grayBtn btnThemeB noIcon'},
                            fnClick: cancel
                        }
                    ]
                ]
        }, options);
        p.id = p.id + '_selectStationDialog';
        
        var s = {
            /**
             * 插件执行函数入口
             */
            work: function () {
                s.init();
                s.createDialog();
                s.createDialogContent();
            },
            /**
             * 初始化插件所需要的变量
             */
            init: function () {
                t.p = p;
                p.toolbarID = $(t).attr('id') + 'SelectToolbar';
                p.tableID = $(t).attr('id') + 'SelectTable';
                p.buttonsID = $(t).attr('id') + 'SelectButtons';
                p.selector = $(t).attr('id');
            },
            /**
             * 插件对话框
             */
            createDialog: function () {
                p.dialog = App.dialog({
                	id: p.id,
                    title: p.title,
                    resizable: false,
                    width: p.width,
                    height: p.height
                });
            },
            /**
             * 向对话框添加内容
             */
            createDialogContent: function () {
            	s.creatFrame();
            	s.createField();
                s.createToolbar();
                s.createTable();
                s.createButtons();
            },
            /**
             * 创建整体框架
             */
            creatFrame: function () {
            	var mainDiv = $("<div/>").addClass('mainFrame').attr('id','user_main_frame');
            	p.dialog.append(mainDiv);
            	var leftDiv = $("<div/>").addClass('leftFrame').attr('id','user_left_frame').appendTo(mainDiv);
            	var right = $("<div/>").addClass('rightFrame').attr('id','user_right_frame').appendTo(mainDiv);
            },
            /**
             * 创建域结构
             */
            createField: function () {
            	
            	var userTree = $("<ul/>").addClass("ztree flow").attr('id','user_dialog_tree')
            	var TreeDiv = $("<div/>").addClass("i18n sp").html(Msg.userDialog.domainChoice);
            	TreeDiv.append(userTree);
            	$('#user_left_frame').append(TreeDiv);
            	s.initTree(userTree);
            	
            },
            initTree : function(userTree) {
            	var userid = Cookies.getCook("userid");
            	$.http.ajax(p.domainUrl, {
            		"userid":userid
            	}, function(data){
                    if(data && data.success){
                    	var zTreeObj;
                        var zNodes = main.getZnodes(data.data);
                        var zTreeSetting = {
	                        treeId: "Locations",
	                        callback:{
	                              onClick: zTreeOnClick
	                        },
	                        view: {
	            				dblClickExpand: false,
	            				showLine: false,
	            				selectedMulti: false
	            			},
	            			data: {
	            				simpleData: {
	            					enable:true
	            				}
	            			}
                        };
                        $.fn.zTree.init($("#user_dialog_tree"), zTreeSetting, zNodes);
                        zTreeObj = $.fn.zTree.getZTreeObj("user_dialog_tree");
                       
                        function zTreeOnClick(event, treeId, treeNode) {
                        	 p.param.domainid = zTreeObj.getSelectedNodes()[0].id;
                             s.search();
                        };
                  }else{
                  }
              });
            },
            
            /**
             * 添加工具条
             */
            createToolbar: function () {
                var div = $("<div/>").addClass('SelectToolbar').attr('id', p.toolbarID);
                var model = [[
                    {
                        input: 'input',
                        type: 'text',
                        show: Msg.partials.main.hp.poverty.name,
                        name: 'userName',
                        width: 185,
                        rule: {space: true, maxlength: 100},
                        extend: {id: p.toolbarID + '_selectUser_username'}
                    },
                    {
                        input: 'input',
                        type: 'text',
                        show: Msg.all,
                        name: 'selectTextDialog',
                        extend: {id: 'selectTextDialog'},
                        placeholder: Msg.all,
                        hide: true
                    }

                ]];
                $('#user_right_frame').append(div);
                //调用表单插件，横向表单，有查询按钮
                div.ValidateForm(p.toolbarID, {
                    show: 'horizontal',
                    noButtons: p.noButtons,
                    fnModifyData: s.fnGetData,
                    fnSubmit: s.search,
                    fnListSuccess: s.fnGetData,
                    model: model
                });
                
                
            },
            /**
             * 点击查询按钮，响应函数
             */
            search: function () {
                p.param.sortname = "orderNo";
                p.param.sortorder = "asc";
                var id = p.toolbarID + '_selectUser_username';
                p.param.userName = $('#'+id).val();
                $('#' + p.tableID).GridTableSearch({params: p.param});
                $('#selectTextDialog').val('');
            },
            /**
             * 获取ValidateForm工具条的初始化内容
             */
            fnGetData: function (data) {
                if ($("#" + p.selector).attr("sname")) {
                    var sNameValue = $("#" + p.selector).attr("sname");
                    $('#selectSNameDialog').val(sNameValue);
                }
                var page = $("#" + p.selector).attr("page") ? $("#" + p.selector).attr("page") : 1;
                var pageSize = $("#" + p.selector).attr("pageSize") ? $("#" + p.selector).attr("pageSize") : 6;

                p.page = parseInt(page) ? parseInt(page) : 1;
                p.pageSize = parseInt(pageSize) ? parseInt(pageSize) : 6;
                p.param.sortname = "orderNo";
                p.param.sortorder = "asc";
                p.param.query = $('#selectSNameDialog').val();

                return data;
            },
            /**
             * 为选择框创建表格内容
             */
            createTable: function () {
                var div = $("<div/>").addClass('SelectTable');
               // p.dialog.append(div);
                $('#user_right_frame').append(div);
                var table = $("<div/>").attr('id', p.tableID);
                div.append(table);
                var colModel = [
                    {display: 'ID', name: 'userid', hide: true},
                    {display: Msg.userDialog.userName, name: 'loginName', width: 0.2, align: 'center'},
                    {display: Msg.partials.main.hp.poverty.name, name: 'userName', width: 0.2, align: 'center'},
                    {
                        display:  Msg.systemSetting.tTel,
                        name: 'tel',
                        width: 0.2,
                        align: 'center'
                    },
                    {
                    	display:  Msg.intelAlarm.alarmLev.name,
                    	name: 'occupLevel',
                    	width: 0.13,
                    	align: 'center',
                    	fnInit: s.operateUserLevel
                    },
                    {
                        display:  Msg.userDialog.type,
                        name: 'userType',
                        width: 0.15,
                        align: 'center',
                        fnInit: s.operateUserType
                    },
                    {
                        display:  Msg.userDialog.status,
                        name: 'status',
                        width: 0.12,
                        align: 'center',
                        fnInit: s.operateUserStatus
                    }
                ];
                if (p.columns && p.columns instanceof Array) {
                    for (var i = 0; i < colModel.length; i++) {
                        if (!p.columns.contains(colModel[i].name)) {
                            colModel.splice(i--, 1);
                        }
                    }
                }
                var length = 0;
                for (var i = 0; i < colModel.length; i++) {
                    length += colModel[i].width;
                }
                for (var i = 0; i < colModel.length; i++) {
                    colModel[i].width = colModel[i].width / (length || 1);
                }
                $("#" + p.tableID).GridTable({
                    url: p.url,
                    title: false,
                    max_height: 247,
                    params: p.param,
                    currentPage: p.page,
                    rp: p.pageSize,
                    onLoadReady: s.onLoadReady,
                    onDoubleClick: s.onDoubleClick,
                    singleSelect: p.singleSelect,
                    clickSelect: true,
                    isRecordSelected: true,
                    isSearchRecordSelected: true,
                    colModel: colModel,
                    idProperty: 'userid'
                });
            },
            /**
             * 用户类型
             */
            operateUserType: function (dom, value, record) {
                if (record.type == 'NORMAL') {
                    $(dom).parent().attr("title", Msg.gridParam.normalCount);
                    $(dom).html(Msg.gridParam.normalCount);
                } else {
                    $(dom).parent().attr("title", Msg.gridParam.systemCount);
                    $(dom).html(Msg.gridParam.systemCount);
                }
            },
            /**
             * 用户类型
             */
            operateUserLevel: function (dom, value, record) {
            	if (value == 1) {
            		$(dom).parent().attr("title", Msg.systemSetting.ulevels[2]);
            		$(dom).html(Msg.systemSetting.ulevels[2]);
            	} else if(value == 2){
            		$(dom).parent().attr("title", Msg.systemSetting.ulevels[1]);
            		$(dom).html(Msg.systemSetting.ulevels[1]);
            	}else if(value == 3){
            		$(dom).parent().attr("title", Msg.systemSetting.ulevels[0]);
            		$(dom).html(Msg.systemSetting.ulevels[0]);
            	}
            },
            /**
             * 用户状态
             */
            operateUserStatus: function (dom, value, record) {
                if (value == 'ACTIVE') {
                    $(dom).parent().attr("title", Msg.systemSetting.tactive);
                    $(dom).html(
                        "<font color='green'>" + Msg.systemSetting.tactive
                        + "</font>");
                } else {
                    $(dom).parent().attr("title", Msg.systemSetting.tlocked);
                    $(dom).html(
                        "<font color ='red'>" + Msg.systemSetting.tlocked
                        + "</font>")
                }

            },
            /**
             * Gridtable加载完成后的执行函数
             */
            onLoadReady: function (data, btrs, htrs) {
                if (!p.loaded) {
                    p.loaded = true;
                    var selectedRecords = $(t).data('selectedRecords');
                    if (!selectedRecords || selectedRecords.length == 0) {
                    	var arr = [];
                        var values = ($(t).attr('value') && $(t).attr('value').split(','));
                        var names = ($(t).val() && $(t).val().split(','));
                        $(values).each(function (i) {
                            var o = {};
                            o.userid = values[i];
                            o.userName = names[i];
                            arr.push(o);
                        });
                        $('#' + p.tableID).GridTableInitSelectedRecords(arr);
                    }
                    else {
                    	$('#' + p.tableID).GridTableInitSelectedRecords(selectedRecords);
                    }
                    
                }
                //有初始化的 userId 时
                if(p.initUserId){
                    $(btrs).find("div[name='userid'][value='" + p.initUserId + "']").parentsUntil("tr").click();
                //单选时，如果未选中电站，默认选中第一个
                }else if (!$(t).data('selectedRecords') && p.singleSelect) {
                    $(btrs[0]).click();
                }
            },
            /**
             * 双击表格行事件
             */
            onDoubleClick: function (row, data, checked) {
                if (p.onDoubleClick) {
                    s.submit(data);
                }
            },

            /**
             * 作用:添加addButtonsTable
             * @validate:Form表单框架
             * @data:所要添加的一列内容的配置数据
             */
            createButtons: function () {
                var tableContent = $("<table/>")
                    .attr('width', '100%')
                    .attr('align', 'center')
                    .attr('id', p.buttonsID)
                    .addClass('SelectButtons')
                    .addClass("ui-dialog-buttonpane");

                p.dialog.append(tableContent);
                $.each(p.buttons, function () {
                    var trContent = $("<tr/>");
                    tableContent.append(trContent);
                    s.addButton(trContent, this);
                });
            },
            /**
             * 添加选择框按钮
             * @trContent：按钮行
             * @data：按钮数据
             */
            addButton: function (trContent, data) {
                $.each(data, function () {
                    var tdContent = $("<td/>");
                    tdContent.attr('align', this.align).attr('width', this.width);
                    trContent.append(tdContent);
                    var input = $("<" + this.input + "/>").attr("type", this.type).addClass(this.name);
                    var span = $("<span/>").addClass("ui-button-text");
                    this.show ? span.html(this.show) : 0;
                    tdContent.append(input);
                    input.append(span);
                    this.unit ? tdContent.append($("<span/>").html(this.unit)) : 0;
                    this.fnClick ? input.click(this.fnClick) : 0;
                    if (this.extend) {
                        for (var key in this.extend) {
                            if (this.extend.hasOwnProperty(key)) {
                                input.attr(key, this.extend[key]);
                            }
                        }
                    }

                    var replaceWith = $("<button type='" + input.attr("type") + "' class='" + input.attr("class") + "' >"
                    + "  <span class='btnL btnS'></span>"
                    + "  <span class='btnC btnS'>" + this.show + "</span>"
                    + "  <span class='btnR btnS'></span>"
                    + "</button>");
                    input.replaceWith(replaceWith);
                    this.fnClick && replaceWith.click(this.fnClick);
                });
            },
            /**
             * 关闭选择框
             */
            cancel: function () {
            	$("#"+p.id).modal("hide");
            },
            /**
             * 确定按钮执行函数
             */
            submit: function () {
                var selectedRecords = $('#' + p.tableID).GridTableSelectedRecords();
                var values = [];
                var names = [];
                $.each(selectedRecords, function () {
                    if (!values.contains(this.userid)) {
                        values.push(this.userid);
                        names.push(this.userName);
                    }
                });
                $('#selectTextDialog').val(names.toString()).attr('value', values.toString());
                $(t).attr('value', $('#selectTextDialog').attr('value'))
                    .attr('page', $('#' + p.tableID + 'GridTablePageBarplabel_currentPage1').html())
                    .attr('pageSize', $('#' + p.tableID + 'GridTablePageBarpselect_rps').val())
                    .attr('sname', $('#selectTextDialog').attr('sname'))
                    .attr('stationType', $('#selectTextDialog').attr('stationType'))
                    .attr('inverterType', $('#selectTextDialog').attr('inverterType'));
                $(t).val($('#selectTextDialog').val());
                if (p.submit) {
                    $(t).data('selectedRecords', selectedRecords);
                    p.submit($('#selectTextDialog').attr('value'), $('#selectTextDialog').val());
                }
                $("#"+p.id).modal("hide");
                $(t).focusout();
            }
        };

        function submit() {
            s.submit();
        }

        function cancel() {
            s.cancel();
        }

        s.work();
        return true;
    };

    var docLoaded = false;
    $(document).ready(function () {
        docLoaded = true;
    });

    $.fn.UserDialog = function (p) {
        return this.each(function () {
            if (!docLoaded) {
                $(this).hide();
                var t = this;
                $(document).ready(function () {
                    $.addSelectUser(t, p);
                });
            } else {
                $.addSelectUser(this, p);
            }
        });
    };

});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VzZXJEaWFsb2cvVXNlckRpYWxvZy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICog5Yqf6IO977ya55So5oi36YCJ5oup5qGG77yM5pi+56S65YaF5a655ZKM5qC35byP5Y+v6YCa6L+H5bGe5oCn6YWN572uXHJcbiAqIOaXpeacn++8mjIwMTUuNC45XHJcbiAqL1xyXG5kZWZpbmUoWydqcXVlcnknLCAnVmFsaWRhdGVGb3JtJywgJ0dyaWRUYWJsZScsJ2NzcyFwbHVnaW5zL3VzZXJEaWFsb2cvY3NzL1VzZXJEaWFsb2cuY3NzJywnelRyZWUnLCAnelRyZWUuZXhjaGVjaycsICd6VHJlZS5leGVkaXQnLCAnelRyZWUuZXhoaWRlJ10sIGZ1bmN0aW9uICgkKSB7XHJcblxyXG4gICAgJC5hZGRTZWxlY3RVc2VyID0gZnVuY3Rpb24gKHQsIG9wdGlvbnMpIHtcclxuICAgICAgICB2YXIgaXNHcm91cElkID0gZmFsc2U7XHJcbiAgICAgICAgdmFyIHVzZXJJZCA9IENvb2tpZXMuZ2V0Q29vayhcInVzZXJpZFwiKTtcclxuICAgICAgICB2YXIgcCA9ICQuZXh0ZW5kKHtcclxuICAgICAgICBcdGlkOlwiaW5pdFVzZXJEaWFsb2dJZFwiLFxyXG4gICAgICAgICAgICB3aWR0aDogMTAwMCxcdFx0XHRcdFx0ICAgICAgICAgICAgICAgICAgICAvLyDpgInmi6nmoYblrr3luqZcclxuICAgICAgICAgICAgaGVpZ2h0OiAnYXV0bycsXHRcdFx0XHQgICAgICAgICAgICAgICAgICAgIC8vIOmAieaLqeahhumrmOW6plxyXG4gICAgICAgICAgICB1cmw6ICcvdXNlci9xdWVyeVVzZXJzJyxcdCAgICAgICAgICAgICAgICAgICAgICAgIC8vIOmAieaLqeahhueUteermeWIl+ihqOWQjuWPsOivt+axguWcsOWdgFxyXG4gICAgICAgICAgICBwYXJhbToge1widXNlcmlkXCI6IHVzZXJJZH0sXHQgLy8g5ZCR5ZCO5Y+w6K+35rGC55qE5Y+C5pWwXHJcbiAgICAgICAgICAgIGRvbWFpblVybDogJy9kb21haW4vcXVlcnlEb21haW5CeVVzZXJJZCcsICAgICAgIC8vIOWMuuWfn+agkeWQjuWPsOivt+axguWcsOWdgFxyXG4gICAgICAgICAgICBzdWJtaXQ6IGZhbHNlLFx0XHRcdFx0ICAgICAgICAgICAgICAgICAgICAvLyDngrnlh7vnoa7lrprlkI7nmoTlm57osIPlh73mlbBcclxuICAgICAgICAgICAgcmVmcmVzaDogZmFsc2UsXHRcdFx0XHQgICAgICAgICAgICAgICAgICAgIC8vIOeCueWHu+etm+mAieaOp+S7tuaYr+WQpuaJp+ihjOWIt+aWsOihqOagvOaTjeS9nFxyXG4gICAgICAgICAgICBkaWFsb2c6IG51bGwsXHRcdFx0XHRcdCAgICAgICAgICAgICAgICAvLyDpgInmi6nmoYbnu5PngrlcclxuICAgICAgICAgICAgc2luZ2xlU2VsZWN0OiBmYWxzZSxcdFx0XHQgICAgICAgICAgICAgICAgLy8g5L+h5oGv5YiX6KGo5Lit55qE5Y2V5Ye75Zue6LCD5Ye95pWwXHJcbiAgICAgICAgICAgIGluaXRVc2VySWQ6IG51bGwsXHRcdFx0ICAgICAgICAgICAgICAgIC8vIOWIneWni+WMlnVzZXJJZFxyXG4gICAgICAgICAgICBvbkRvdWJsZUNsaWNrOiBmYWxzZSxcclxuICAgICAgICAgICAgc2VsZWN0b3I6IHRydWUsXHJcbiAgICAgICAgICAgIC8vIOeUteermeS/oeaBr+WIl+ihqOS4reeahOWPjOWHu+Wbnuiwg+WHveaVsFxyXG4gICAgICAgICAgICBsb2FkZWQ6IGZhbHNlLFx0XHRcdFx0ICAgICAgICAgICAgICAgICAgICAvLyDkv6Hmga/liJfooajliqDovb3lrozmiJDnmoTlj5jph4/moIfnpLpcclxuICAgICAgICAgICAgbm9CdXR0b25zOiBmYWxzZSxcdFx0XHRcdCAgICAgICAgICAgICAgICAvLyDkuI3mmL7npLrmn6Xor6LmjInpkq5cclxuICAgICAgICAgICAgLy8gcXVlcnlSZXNldDogdHJ1ZSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5p+l6K+i6YeN572u6YCJ5oup6aG5XHJcbiAgICAgICAgICAgIHRpdGxlOiBNc2cudXNlckRpYWxvZy5jaG9vc2UsXHRcdCAgICAgICAgICAgICAgICAgICAgICAgICAvLyDpgInmi6nlr7nor53moYbnmoTmoIfpophcclxuICAgICAgICAgICAgY29sdW1uczpcdFx0XHRcdFx0XHQgICAgICAgICAgICAgICAgLy8g5a+56K+d5qGG6YeM5YiX6KGo55qE6KGMXHJcbiAgICAgICAgICAgICAgICBbJ2xvZ2luTmFtZScsICd1c2VyTmFtZScsJ3VzZXJUeXBlJywgJ3RlbCcsICdvY2N1cExldmVsJywnc3RhdHVzJ10sXHJcbiAgICAgICAgICAgIGJ1dHRvbnM6ICAgICAgICAgICAgICBcdFx0ICAgICAgICAgICAgICAgICAgICAvLyDooajljZXmjInpkq5cclxuICAgICAgICAgICAgICAgIFtcclxuICAgICAgICAgICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0OiAnYnV0dG9uJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdidXR0b24nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvdzogTXNnLnN1cmUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAnJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsaWduOiAncmlnaHQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICc1MCUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5pdDogJyZuYnNwOyZuYnNwOyZuYnNwOyZuYnNwOycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHRlbmQ6IHsnY2xhc3MnOiAnYnRuIGJsdWVCdG4gYnRuVGhlbWVBIG5vSWNvbid9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm5DbGljazogc3VibWl0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0OiAnYnV0dG9uJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdidXR0b24nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvdzogTXNnLmNhbmNlbCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6ICcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxpZ246ICdsZWZ0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAnNDklJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dGVuZDogeydjbGFzcyc6ICdidG4gZ3JheUJ0biBidG5UaGVtZUIgbm9JY29uJ30sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbkNsaWNrOiBjYW5jZWxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICAgIF1cclxuICAgICAgICB9LCBvcHRpb25zKTtcclxuICAgICAgICBwLmlkID0gcC5pZCArICdfc2VsZWN0U3RhdGlvbkRpYWxvZyc7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIHMgPSB7XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiDmj5Lku7bmiafooYzlh73mlbDlhaXlj6NcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIHdvcms6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHMuaW5pdCgpO1xyXG4gICAgICAgICAgICAgICAgcy5jcmVhdGVEaWFsb2coKTtcclxuICAgICAgICAgICAgICAgIHMuY3JlYXRlRGlhbG9nQ29udGVudCgpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICog5Yid5aeL5YyW5o+S5Lu25omA6ZyA6KaB55qE5Y+Y6YePXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBpbml0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB0LnAgPSBwO1xyXG4gICAgICAgICAgICAgICAgcC50b29sYmFySUQgPSAkKHQpLmF0dHIoJ2lkJykgKyAnU2VsZWN0VG9vbGJhcic7XHJcbiAgICAgICAgICAgICAgICBwLnRhYmxlSUQgPSAkKHQpLmF0dHIoJ2lkJykgKyAnU2VsZWN0VGFibGUnO1xyXG4gICAgICAgICAgICAgICAgcC5idXR0b25zSUQgPSAkKHQpLmF0dHIoJ2lkJykgKyAnU2VsZWN0QnV0dG9ucyc7XHJcbiAgICAgICAgICAgICAgICBwLnNlbGVjdG9yID0gJCh0KS5hdHRyKCdpZCcpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICog5o+S5Lu25a+56K+d5qGGXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBjcmVhdGVEaWFsb2c6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHAuZGlhbG9nID0gQXBwLmRpYWxvZyh7XHJcbiAgICAgICAgICAgICAgICBcdGlkOiBwLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiBwLnRpdGxlLFxyXG4gICAgICAgICAgICAgICAgICAgIHJlc2l6YWJsZTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IHAud2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBwLmhlaWdodFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiDlkJHlr7nor53moYbmt7vliqDlhoXlrrlcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIGNyZWF0ZURpYWxvZ0NvbnRlbnQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgXHRzLmNyZWF0RnJhbWUoKTtcclxuICAgICAgICAgICAgXHRzLmNyZWF0ZUZpZWxkKCk7XHJcbiAgICAgICAgICAgICAgICBzLmNyZWF0ZVRvb2xiYXIoKTtcclxuICAgICAgICAgICAgICAgIHMuY3JlYXRlVGFibGUoKTtcclxuICAgICAgICAgICAgICAgIHMuY3JlYXRlQnV0dG9ucygpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICog5Yib5bu65pW05L2T5qGG5p62XHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBjcmVhdEZyYW1lOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIFx0dmFyIG1haW5EaXYgPSAkKFwiPGRpdi8+XCIpLmFkZENsYXNzKCdtYWluRnJhbWUnKS5hdHRyKCdpZCcsJ3VzZXJfbWFpbl9mcmFtZScpO1xyXG4gICAgICAgICAgICBcdHAuZGlhbG9nLmFwcGVuZChtYWluRGl2KTtcclxuICAgICAgICAgICAgXHR2YXIgbGVmdERpdiA9ICQoXCI8ZGl2Lz5cIikuYWRkQ2xhc3MoJ2xlZnRGcmFtZScpLmF0dHIoJ2lkJywndXNlcl9sZWZ0X2ZyYW1lJykuYXBwZW5kVG8obWFpbkRpdik7XHJcbiAgICAgICAgICAgIFx0dmFyIHJpZ2h0ID0gJChcIjxkaXYvPlwiKS5hZGRDbGFzcygncmlnaHRGcmFtZScpLmF0dHIoJ2lkJywndXNlcl9yaWdodF9mcmFtZScpLmFwcGVuZFRvKG1haW5EaXYpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICog5Yib5bu65Z+f57uT5p6EXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBjcmVhdGVGaWVsZDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBcdFxyXG4gICAgICAgICAgICBcdHZhciB1c2VyVHJlZSA9ICQoXCI8dWwvPlwiKS5hZGRDbGFzcyhcInp0cmVlIGZsb3dcIikuYXR0cignaWQnLCd1c2VyX2RpYWxvZ190cmVlJylcclxuICAgICAgICAgICAgXHR2YXIgVHJlZURpdiA9ICQoXCI8ZGl2Lz5cIikuYWRkQ2xhc3MoXCJpMThuIHNwXCIpLmh0bWwoTXNnLnVzZXJEaWFsb2cuZG9tYWluQ2hvaWNlKTtcclxuICAgICAgICAgICAgXHRUcmVlRGl2LmFwcGVuZCh1c2VyVHJlZSk7XHJcbiAgICAgICAgICAgIFx0JCgnI3VzZXJfbGVmdF9mcmFtZScpLmFwcGVuZChUcmVlRGl2KTtcclxuICAgICAgICAgICAgXHRzLmluaXRUcmVlKHVzZXJUcmVlKTtcclxuICAgICAgICAgICAgXHRcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgaW5pdFRyZWUgOiBmdW5jdGlvbih1c2VyVHJlZSkge1xyXG4gICAgICAgICAgICBcdHZhciB1c2VyaWQgPSBDb29raWVzLmdldENvb2soXCJ1c2VyaWRcIik7XHJcbiAgICAgICAgICAgIFx0JC5odHRwLmFqYXgocC5kb21haW5VcmwsIHtcclxuICAgICAgICAgICAgXHRcdFwidXNlcmlkXCI6dXNlcmlkXHJcbiAgICAgICAgICAgIFx0fSwgZnVuY3Rpb24oZGF0YSl7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoZGF0YSAmJiBkYXRhLnN1Y2Nlc3Mpe1xyXG4gICAgICAgICAgICAgICAgICAgIFx0dmFyIHpUcmVlT2JqO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgek5vZGVzID0gbWFpbi5nZXRabm9kZXMoZGF0YS5kYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHpUcmVlU2V0dGluZyA9IHtcclxuXHQgICAgICAgICAgICAgICAgICAgICAgICB0cmVlSWQ6IFwiTG9jYXRpb25zXCIsXHJcblx0ICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6e1xyXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s6IHpUcmVlT25DbGlja1xyXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcblx0ICAgICAgICAgICAgICAgICAgICAgICAgdmlldzoge1xyXG5cdCAgICAgICAgICAgIFx0XHRcdFx0ZGJsQ2xpY2tFeHBhbmQ6IGZhbHNlLFxyXG5cdCAgICAgICAgICAgIFx0XHRcdFx0c2hvd0xpbmU6IGZhbHNlLFxyXG5cdCAgICAgICAgICAgIFx0XHRcdFx0c2VsZWN0ZWRNdWx0aTogZmFsc2VcclxuXHQgICAgICAgICAgICBcdFx0XHR9LFxyXG5cdCAgICAgICAgICAgIFx0XHRcdGRhdGE6IHtcclxuXHQgICAgICAgICAgICBcdFx0XHRcdHNpbXBsZURhdGE6IHtcclxuXHQgICAgICAgICAgICBcdFx0XHRcdFx0ZW5hYmxlOnRydWVcclxuXHQgICAgICAgICAgICBcdFx0XHRcdH1cclxuXHQgICAgICAgICAgICBcdFx0XHR9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQuZm4uelRyZWUuaW5pdCgkKFwiI3VzZXJfZGlhbG9nX3RyZWVcIiksIHpUcmVlU2V0dGluZywgek5vZGVzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgelRyZWVPYmogPSAkLmZuLnpUcmVlLmdldFpUcmVlT2JqKFwidXNlcl9kaWFsb2dfdHJlZVwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gelRyZWVPbkNsaWNrKGV2ZW50LCB0cmVlSWQsIHRyZWVOb2RlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFx0IHAucGFyYW0uZG9tYWluaWQgPSB6VHJlZU9iai5nZXRTZWxlY3RlZE5vZGVzKClbMF0uaWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcy5zZWFyY2goKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiDmt7vliqDlt6XlhbfmnaFcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIGNyZWF0ZVRvb2xiYXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBkaXYgPSAkKFwiPGRpdi8+XCIpLmFkZENsYXNzKCdTZWxlY3RUb29sYmFyJykuYXR0cignaWQnLCBwLnRvb2xiYXJJRCk7XHJcbiAgICAgICAgICAgICAgICB2YXIgbW9kZWwgPSBbW1xyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXQ6ICdpbnB1dCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICd0ZXh0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2hvdzogTXNnLnBhcnRpYWxzLm1haW4uaHAucG92ZXJ0eS5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAndXNlck5hbWUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogMTg1LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBydWxlOiB7c3BhY2U6IHRydWUsIG1heGxlbmd0aDogMTAwfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXh0ZW5kOiB7aWQ6IHAudG9vbGJhcklEICsgJ19zZWxlY3RVc2VyX3VzZXJuYW1lJ31cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXQ6ICdpbnB1dCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICd0ZXh0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2hvdzogTXNnLmFsbCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ3NlbGVjdFRleHREaWFsb2cnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBleHRlbmQ6IHtpZDogJ3NlbGVjdFRleHREaWFsb2cnfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI6IE1zZy5hbGwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGhpZGU6IHRydWVcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgXV07XHJcbiAgICAgICAgICAgICAgICAkKCcjdXNlcl9yaWdodF9mcmFtZScpLmFwcGVuZChkaXYpO1xyXG4gICAgICAgICAgICAgICAgLy/osIPnlKjooajljZXmj5Lku7bvvIzmqKrlkJHooajljZXvvIzmnInmn6Xor6LmjInpkq5cclxuICAgICAgICAgICAgICAgIGRpdi5WYWxpZGF0ZUZvcm0ocC50b29sYmFySUQsIHtcclxuICAgICAgICAgICAgICAgICAgICBzaG93OiAnaG9yaXpvbnRhbCcsXHJcbiAgICAgICAgICAgICAgICAgICAgbm9CdXR0b25zOiBwLm5vQnV0dG9ucyxcclxuICAgICAgICAgICAgICAgICAgICBmbk1vZGlmeURhdGE6IHMuZm5HZXREYXRhLFxyXG4gICAgICAgICAgICAgICAgICAgIGZuU3VibWl0OiBzLnNlYXJjaCxcclxuICAgICAgICAgICAgICAgICAgICBmbkxpc3RTdWNjZXNzOiBzLmZuR2V0RGF0YSxcclxuICAgICAgICAgICAgICAgICAgICBtb2RlbDogbW9kZWxcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIOeCueWHu+afpeivouaMiemSru+8jOWTjeW6lOWHveaVsFxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgc2VhcmNoOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBwLnBhcmFtLnNvcnRuYW1lID0gXCJvcmRlck5vXCI7XHJcbiAgICAgICAgICAgICAgICBwLnBhcmFtLnNvcnRvcmRlciA9IFwiYXNjXCI7XHJcbiAgICAgICAgICAgICAgICB2YXIgaWQgPSBwLnRvb2xiYXJJRCArICdfc2VsZWN0VXNlcl91c2VybmFtZSc7XHJcbiAgICAgICAgICAgICAgICBwLnBhcmFtLnVzZXJOYW1lID0gJCgnIycraWQpLnZhbCgpO1xyXG4gICAgICAgICAgICAgICAgJCgnIycgKyBwLnRhYmxlSUQpLkdyaWRUYWJsZVNlYXJjaCh7cGFyYW1zOiBwLnBhcmFtfSk7XHJcbiAgICAgICAgICAgICAgICAkKCcjc2VsZWN0VGV4dERpYWxvZycpLnZhbCgnJyk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiDojrflj5ZWYWxpZGF0ZUZvcm3lt6XlhbfmnaHnmoTliJ3lp4vljJblhoXlrrlcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIGZuR2V0RGF0YTogZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgIGlmICgkKFwiI1wiICsgcC5zZWxlY3RvcikuYXR0cihcInNuYW1lXCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNOYW1lVmFsdWUgPSAkKFwiI1wiICsgcC5zZWxlY3RvcikuYXR0cihcInNuYW1lXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICQoJyNzZWxlY3RTTmFtZURpYWxvZycpLnZhbChzTmFtZVZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHZhciBwYWdlID0gJChcIiNcIiArIHAuc2VsZWN0b3IpLmF0dHIoXCJwYWdlXCIpID8gJChcIiNcIiArIHAuc2VsZWN0b3IpLmF0dHIoXCJwYWdlXCIpIDogMTtcclxuICAgICAgICAgICAgICAgIHZhciBwYWdlU2l6ZSA9ICQoXCIjXCIgKyBwLnNlbGVjdG9yKS5hdHRyKFwicGFnZVNpemVcIikgPyAkKFwiI1wiICsgcC5zZWxlY3RvcikuYXR0cihcInBhZ2VTaXplXCIpIDogNjtcclxuXHJcbiAgICAgICAgICAgICAgICBwLnBhZ2UgPSBwYXJzZUludChwYWdlKSA/IHBhcnNlSW50KHBhZ2UpIDogMTtcclxuICAgICAgICAgICAgICAgIHAucGFnZVNpemUgPSBwYXJzZUludChwYWdlU2l6ZSkgPyBwYXJzZUludChwYWdlU2l6ZSkgOiA2O1xyXG4gICAgICAgICAgICAgICAgcC5wYXJhbS5zb3J0bmFtZSA9IFwib3JkZXJOb1wiO1xyXG4gICAgICAgICAgICAgICAgcC5wYXJhbS5zb3J0b3JkZXIgPSBcImFzY1wiO1xyXG4gICAgICAgICAgICAgICAgcC5wYXJhbS5xdWVyeSA9ICQoJyNzZWxlY3RTTmFtZURpYWxvZycpLnZhbCgpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBkYXRhO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICog5Li66YCJ5oup5qGG5Yib5bu66KGo5qC85YaF5a65XHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBjcmVhdGVUYWJsZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGRpdiA9ICQoXCI8ZGl2Lz5cIikuYWRkQ2xhc3MoJ1NlbGVjdFRhYmxlJyk7XHJcbiAgICAgICAgICAgICAgIC8vIHAuZGlhbG9nLmFwcGVuZChkaXYpO1xyXG4gICAgICAgICAgICAgICAgJCgnI3VzZXJfcmlnaHRfZnJhbWUnKS5hcHBlbmQoZGl2KTtcclxuICAgICAgICAgICAgICAgIHZhciB0YWJsZSA9ICQoXCI8ZGl2Lz5cIikuYXR0cignaWQnLCBwLnRhYmxlSUQpO1xyXG4gICAgICAgICAgICAgICAgZGl2LmFwcGVuZCh0YWJsZSk7XHJcbiAgICAgICAgICAgICAgICB2YXIgY29sTW9kZWwgPSBbXHJcbiAgICAgICAgICAgICAgICAgICAge2Rpc3BsYXk6ICdJRCcsIG5hbWU6ICd1c2VyaWQnLCBoaWRlOiB0cnVlfSxcclxuICAgICAgICAgICAgICAgICAgICB7ZGlzcGxheTogTXNnLnVzZXJEaWFsb2cudXNlck5hbWUsIG5hbWU6ICdsb2dpbk5hbWUnLCB3aWR0aDogMC4yLCBhbGlnbjogJ2NlbnRlcid9LFxyXG4gICAgICAgICAgICAgICAgICAgIHtkaXNwbGF5OiBNc2cucGFydGlhbHMubWFpbi5ocC5wb3ZlcnR5Lm5hbWUsIG5hbWU6ICd1c2VyTmFtZScsIHdpZHRoOiAwLjIsIGFsaWduOiAnY2VudGVyJ30sXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiAgTXNnLnN5c3RlbVNldHRpbmcudFRlbCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ3RlbCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAwLjIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsaWduOiAnY2VudGVyJ1xyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIFx0ZGlzcGxheTogIE1zZy5pbnRlbEFsYXJtLmFsYXJtTGV2Lm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgXHRuYW1lOiAnb2NjdXBMZXZlbCcsXHJcbiAgICAgICAgICAgICAgICAgICAgXHR3aWR0aDogMC4xMyxcclxuICAgICAgICAgICAgICAgICAgICBcdGFsaWduOiAnY2VudGVyJyxcclxuICAgICAgICAgICAgICAgICAgICBcdGZuSW5pdDogcy5vcGVyYXRlVXNlckxldmVsXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICBNc2cudXNlckRpYWxvZy50eXBlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAndXNlclR5cGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogMC4xNSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWxpZ246ICdjZW50ZXInLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmbkluaXQ6IHMub3BlcmF0ZVVzZXJUeXBlXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICBNc2cudXNlckRpYWxvZy5zdGF0dXMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6ICdzdGF0dXMnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogMC4xMixcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWxpZ246ICdjZW50ZXInLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmbkluaXQ6IHMub3BlcmF0ZVVzZXJTdGF0dXNcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBdO1xyXG4gICAgICAgICAgICAgICAgaWYgKHAuY29sdW1ucyAmJiBwLmNvbHVtbnMgaW5zdGFuY2VvZiBBcnJheSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29sTW9kZWwubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFwLmNvbHVtbnMuY29udGFpbnMoY29sTW9kZWxbaV0ubmFtZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbE1vZGVsLnNwbGljZShpLS0sIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdmFyIGxlbmd0aCA9IDA7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbE1vZGVsLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGVuZ3RoICs9IGNvbE1vZGVsW2ldLndpZHRoO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb2xNb2RlbC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbE1vZGVsW2ldLndpZHRoID0gY29sTW9kZWxbaV0ud2lkdGggLyAobGVuZ3RoIHx8IDEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgJChcIiNcIiArIHAudGFibGVJRCkuR3JpZFRhYmxlKHtcclxuICAgICAgICAgICAgICAgICAgICB1cmw6IHAudXJsLFxyXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICBtYXhfaGVpZ2h0OiAyNDcsXHJcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1zOiBwLnBhcmFtLFxyXG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRQYWdlOiBwLnBhZ2UsXHJcbiAgICAgICAgICAgICAgICAgICAgcnA6IHAucGFnZVNpemUsXHJcbiAgICAgICAgICAgICAgICAgICAgb25Mb2FkUmVhZHk6IHMub25Mb2FkUmVhZHksXHJcbiAgICAgICAgICAgICAgICAgICAgb25Eb3VibGVDbGljazogcy5vbkRvdWJsZUNsaWNrLFxyXG4gICAgICAgICAgICAgICAgICAgIHNpbmdsZVNlbGVjdDogcC5zaW5nbGVTZWxlY3QsXHJcbiAgICAgICAgICAgICAgICAgICAgY2xpY2tTZWxlY3Q6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgaXNSZWNvcmRTZWxlY3RlZDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICBpc1NlYXJjaFJlY29yZFNlbGVjdGVkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbE1vZGVsOiBjb2xNb2RlbCxcclxuICAgICAgICAgICAgICAgICAgICBpZFByb3BlcnR5OiAndXNlcmlkJ1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiDnlKjmiLfnsbvlnotcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIG9wZXJhdGVVc2VyVHlwZTogZnVuY3Rpb24gKGRvbSwgdmFsdWUsIHJlY29yZCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlY29yZC50eXBlID09ICdOT1JNQUwnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJChkb20pLnBhcmVudCgpLmF0dHIoXCJ0aXRsZVwiLCBNc2cuZ3JpZFBhcmFtLm5vcm1hbENvdW50KTtcclxuICAgICAgICAgICAgICAgICAgICAkKGRvbSkuaHRtbChNc2cuZ3JpZFBhcmFtLm5vcm1hbENvdW50KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJChkb20pLnBhcmVudCgpLmF0dHIoXCJ0aXRsZVwiLCBNc2cuZ3JpZFBhcmFtLnN5c3RlbUNvdW50KTtcclxuICAgICAgICAgICAgICAgICAgICAkKGRvbSkuaHRtbChNc2cuZ3JpZFBhcmFtLnN5c3RlbUNvdW50KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIOeUqOaIt+exu+Wei1xyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgb3BlcmF0ZVVzZXJMZXZlbDogZnVuY3Rpb24gKGRvbSwgdmFsdWUsIHJlY29yZCkge1xyXG4gICAgICAgICAgICBcdGlmICh2YWx1ZSA9PSAxKSB7XHJcbiAgICAgICAgICAgIFx0XHQkKGRvbSkucGFyZW50KCkuYXR0cihcInRpdGxlXCIsIE1zZy5zeXN0ZW1TZXR0aW5nLnVsZXZlbHNbMl0pO1xyXG4gICAgICAgICAgICBcdFx0JChkb20pLmh0bWwoTXNnLnN5c3RlbVNldHRpbmcudWxldmVsc1syXSk7XHJcbiAgICAgICAgICAgIFx0fSBlbHNlIGlmKHZhbHVlID09IDIpe1xyXG4gICAgICAgICAgICBcdFx0JChkb20pLnBhcmVudCgpLmF0dHIoXCJ0aXRsZVwiLCBNc2cuc3lzdGVtU2V0dGluZy51bGV2ZWxzWzFdKTtcclxuICAgICAgICAgICAgXHRcdCQoZG9tKS5odG1sKE1zZy5zeXN0ZW1TZXR0aW5nLnVsZXZlbHNbMV0pO1xyXG4gICAgICAgICAgICBcdH1lbHNlIGlmKHZhbHVlID09IDMpe1xyXG4gICAgICAgICAgICBcdFx0JChkb20pLnBhcmVudCgpLmF0dHIoXCJ0aXRsZVwiLCBNc2cuc3lzdGVtU2V0dGluZy51bGV2ZWxzWzBdKTtcclxuICAgICAgICAgICAgXHRcdCQoZG9tKS5odG1sKE1zZy5zeXN0ZW1TZXR0aW5nLnVsZXZlbHNbMF0pO1xyXG4gICAgICAgICAgICBcdH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIOeUqOaIt+eKtuaAgVxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgb3BlcmF0ZVVzZXJTdGF0dXM6IGZ1bmN0aW9uIChkb20sIHZhbHVlLCByZWNvcmQpIHtcclxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PSAnQUNUSVZFJykge1xyXG4gICAgICAgICAgICAgICAgICAgICQoZG9tKS5wYXJlbnQoKS5hdHRyKFwidGl0bGVcIiwgTXNnLnN5c3RlbVNldHRpbmcudGFjdGl2ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgJChkb20pLmh0bWwoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiPGZvbnQgY29sb3I9J2dyZWVuJz5cIiArIE1zZy5zeXN0ZW1TZXR0aW5nLnRhY3RpdmVcclxuICAgICAgICAgICAgICAgICAgICAgICAgKyBcIjwvZm9udD5cIik7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICQoZG9tKS5wYXJlbnQoKS5hdHRyKFwidGl0bGVcIiwgTXNnLnN5c3RlbVNldHRpbmcudGxvY2tlZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgJChkb20pLmh0bWwoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiPGZvbnQgY29sb3IgPSdyZWQnPlwiICsgTXNnLnN5c3RlbVNldHRpbmcudGxvY2tlZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICArIFwiPC9mb250PlwiKVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIEdyaWR0YWJsZeWKoOi9veWujOaIkOWQjueahOaJp+ihjOWHveaVsFxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgb25Mb2FkUmVhZHk6IGZ1bmN0aW9uIChkYXRhLCBidHJzLCBodHJzKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXAubG9hZGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcC5sb2FkZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBzZWxlY3RlZFJlY29yZHMgPSAkKHQpLmRhdGEoJ3NlbGVjdGVkUmVjb3JkcycpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghc2VsZWN0ZWRSZWNvcmRzIHx8IHNlbGVjdGVkUmVjb3Jkcy5sZW5ndGggPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIFx0dmFyIGFyciA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWVzID0gKCQodCkuYXR0cigndmFsdWUnKSAmJiAkKHQpLmF0dHIoJ3ZhbHVlJykuc3BsaXQoJywnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuYW1lcyA9ICgkKHQpLnZhbCgpICYmICQodCkudmFsKCkuc3BsaXQoJywnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQodmFsdWVzKS5lYWNoKGZ1bmN0aW9uIChpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbyA9IHt9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgby51c2VyaWQgPSB2YWx1ZXNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvLnVzZXJOYW1lID0gbmFtZXNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcnIucHVzaChvKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQoJyMnICsgcC50YWJsZUlEKS5HcmlkVGFibGVJbml0U2VsZWN0ZWRSZWNvcmRzKGFycik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIFx0JCgnIycgKyBwLnRhYmxlSUQpLkdyaWRUYWJsZUluaXRTZWxlY3RlZFJlY29yZHMoc2VsZWN0ZWRSZWNvcmRzKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvL+acieWIneWni+WMlueahCB1c2VySWQg5pe2XHJcbiAgICAgICAgICAgICAgICBpZihwLmluaXRVc2VySWQpe1xyXG4gICAgICAgICAgICAgICAgICAgICQoYnRycykuZmluZChcImRpdltuYW1lPSd1c2VyaWQnXVt2YWx1ZT0nXCIgKyBwLmluaXRVc2VySWQgKyBcIiddXCIpLnBhcmVudHNVbnRpbChcInRyXCIpLmNsaWNrKCk7XHJcbiAgICAgICAgICAgICAgICAvL+WNlemAieaXtu+8jOWmguaenOacqumAieS4reeUteerme+8jOm7mOiupOmAieS4reesrOS4gOS4qlxyXG4gICAgICAgICAgICAgICAgfWVsc2UgaWYgKCEkKHQpLmRhdGEoJ3NlbGVjdGVkUmVjb3JkcycpICYmIHAuc2luZ2xlU2VsZWN0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJChidHJzWzBdKS5jbGljaygpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICog5Y+M5Ye76KGo5qC86KGM5LqL5Lu2XHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBvbkRvdWJsZUNsaWNrOiBmdW5jdGlvbiAocm93LCBkYXRhLCBjaGVja2VkKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAocC5vbkRvdWJsZUNsaWNrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcy5zdWJtaXQoZGF0YSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICog5L2c55SoOua3u+WKoGFkZEJ1dHRvbnNUYWJsZVxyXG4gICAgICAgICAgICAgKiBAdmFsaWRhdGU6Rm9ybeihqOWNleahhuaetlxyXG4gICAgICAgICAgICAgKiBAZGF0YTrmiYDopoHmt7vliqDnmoTkuIDliJflhoXlrrnnmoTphY3nva7mlbDmja5cclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIGNyZWF0ZUJ1dHRvbnM6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHZhciB0YWJsZUNvbnRlbnQgPSAkKFwiPHRhYmxlLz5cIilcclxuICAgICAgICAgICAgICAgICAgICAuYXR0cignd2lkdGgnLCAnMTAwJScpXHJcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2FsaWduJywgJ2NlbnRlcicpXHJcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2lkJywgcC5idXR0b25zSUQpXHJcbiAgICAgICAgICAgICAgICAgICAgLmFkZENsYXNzKCdTZWxlY3RCdXR0b25zJylcclxuICAgICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoXCJ1aS1kaWFsb2ctYnV0dG9ucGFuZVwiKTtcclxuXHJcbiAgICAgICAgICAgICAgICBwLmRpYWxvZy5hcHBlbmQodGFibGVDb250ZW50KTtcclxuICAgICAgICAgICAgICAgICQuZWFjaChwLmJ1dHRvbnMsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdHJDb250ZW50ID0gJChcIjx0ci8+XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRhYmxlQ29udGVudC5hcHBlbmQodHJDb250ZW50KTtcclxuICAgICAgICAgICAgICAgICAgICBzLmFkZEJ1dHRvbih0ckNvbnRlbnQsIHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiDmt7vliqDpgInmi6nmoYbmjInpkq5cclxuICAgICAgICAgICAgICogQHRyQ29udGVudO+8muaMiemSruihjFxyXG4gICAgICAgICAgICAgKiBAZGF0Ye+8muaMiemSruaVsOaNrlxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgYWRkQnV0dG9uOiBmdW5jdGlvbiAodHJDb250ZW50LCBkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAkLmVhY2goZGF0YSwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0ZENvbnRlbnQgPSAkKFwiPHRkLz5cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgdGRDb250ZW50LmF0dHIoJ2FsaWduJywgdGhpcy5hbGlnbikuYXR0cignd2lkdGgnLCB0aGlzLndpZHRoKTtcclxuICAgICAgICAgICAgICAgICAgICB0ckNvbnRlbnQuYXBwZW5kKHRkQ29udGVudCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlucHV0ID0gJChcIjxcIiArIHRoaXMuaW5wdXQgKyBcIi8+XCIpLmF0dHIoXCJ0eXBlXCIsIHRoaXMudHlwZSkuYWRkQ2xhc3ModGhpcy5uYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgc3BhbiA9ICQoXCI8c3Bhbi8+XCIpLmFkZENsYXNzKFwidWktYnV0dG9uLXRleHRcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zaG93ID8gc3Bhbi5odG1sKHRoaXMuc2hvdykgOiAwO1xyXG4gICAgICAgICAgICAgICAgICAgIHRkQ29udGVudC5hcHBlbmQoaW5wdXQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlucHV0LmFwcGVuZChzcGFuKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnVuaXQgPyB0ZENvbnRlbnQuYXBwZW5kKCQoXCI8c3Bhbi8+XCIpLmh0bWwodGhpcy51bml0KSkgOiAwO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZm5DbGljayA/IGlucHV0LmNsaWNrKHRoaXMuZm5DbGljaykgOiAwO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmV4dGVuZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5leHRlbmQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmV4dGVuZC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXQuYXR0cihrZXksIHRoaXMuZXh0ZW5kW2tleV0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVwbGFjZVdpdGggPSAkKFwiPGJ1dHRvbiB0eXBlPSdcIiArIGlucHV0LmF0dHIoXCJ0eXBlXCIpICsgXCInIGNsYXNzPSdcIiArIGlucHV0LmF0dHIoXCJjbGFzc1wiKSArIFwiJyA+XCJcclxuICAgICAgICAgICAgICAgICAgICArIFwiICA8c3BhbiBjbGFzcz0nYnRuTCBidG5TJz48L3NwYW4+XCJcclxuICAgICAgICAgICAgICAgICAgICArIFwiICA8c3BhbiBjbGFzcz0nYnRuQyBidG5TJz5cIiArIHRoaXMuc2hvdyArIFwiPC9zcGFuPlwiXHJcbiAgICAgICAgICAgICAgICAgICAgKyBcIiAgPHNwYW4gY2xhc3M9J2J0blIgYnRuUyc+PC9zcGFuPlwiXHJcbiAgICAgICAgICAgICAgICAgICAgKyBcIjwvYnV0dG9uPlwiKTtcclxuICAgICAgICAgICAgICAgICAgICBpbnB1dC5yZXBsYWNlV2l0aChyZXBsYWNlV2l0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mbkNsaWNrICYmIHJlcGxhY2VXaXRoLmNsaWNrKHRoaXMuZm5DbGljayk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIOWFs+mXremAieaLqeahhlxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgY2FuY2VsOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIFx0JChcIiNcIitwLmlkKS5tb2RhbChcImhpZGVcIik7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiDnoa7lrprmjInpkq7miafooYzlh73mlbBcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIHN1Ym1pdDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHNlbGVjdGVkUmVjb3JkcyA9ICQoJyMnICsgcC50YWJsZUlEKS5HcmlkVGFibGVTZWxlY3RlZFJlY29yZHMoKTtcclxuICAgICAgICAgICAgICAgIHZhciB2YWx1ZXMgPSBbXTtcclxuICAgICAgICAgICAgICAgIHZhciBuYW1lcyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgJC5lYWNoKHNlbGVjdGVkUmVjb3JkcywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghdmFsdWVzLmNvbnRhaW5zKHRoaXMudXNlcmlkKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZXMucHVzaCh0aGlzLnVzZXJpZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWVzLnB1c2godGhpcy51c2VyTmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAkKCcjc2VsZWN0VGV4dERpYWxvZycpLnZhbChuYW1lcy50b1N0cmluZygpKS5hdHRyKCd2YWx1ZScsIHZhbHVlcy50b1N0cmluZygpKTtcclxuICAgICAgICAgICAgICAgICQodCkuYXR0cigndmFsdWUnLCAkKCcjc2VsZWN0VGV4dERpYWxvZycpLmF0dHIoJ3ZhbHVlJykpXHJcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ3BhZ2UnLCAkKCcjJyArIHAudGFibGVJRCArICdHcmlkVGFibGVQYWdlQmFycGxhYmVsX2N1cnJlbnRQYWdlMScpLmh0bWwoKSlcclxuICAgICAgICAgICAgICAgICAgICAuYXR0cigncGFnZVNpemUnLCAkKCcjJyArIHAudGFibGVJRCArICdHcmlkVGFibGVQYWdlQmFycHNlbGVjdF9ycHMnKS52YWwoKSlcclxuICAgICAgICAgICAgICAgICAgICAuYXR0cignc25hbWUnLCAkKCcjc2VsZWN0VGV4dERpYWxvZycpLmF0dHIoJ3NuYW1lJykpXHJcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ3N0YXRpb25UeXBlJywgJCgnI3NlbGVjdFRleHREaWFsb2cnKS5hdHRyKCdzdGF0aW9uVHlwZScpKVxyXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKCdpbnZlcnRlclR5cGUnLCAkKCcjc2VsZWN0VGV4dERpYWxvZycpLmF0dHIoJ2ludmVydGVyVHlwZScpKTtcclxuICAgICAgICAgICAgICAgICQodCkudmFsKCQoJyNzZWxlY3RUZXh0RGlhbG9nJykudmFsKCkpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHAuc3VibWl0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJCh0KS5kYXRhKCdzZWxlY3RlZFJlY29yZHMnLCBzZWxlY3RlZFJlY29yZHMpO1xyXG4gICAgICAgICAgICAgICAgICAgIHAuc3VibWl0KCQoJyNzZWxlY3RUZXh0RGlhbG9nJykuYXR0cigndmFsdWUnKSwgJCgnI3NlbGVjdFRleHREaWFsb2cnKS52YWwoKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAkKFwiI1wiK3AuaWQpLm1vZGFsKFwiaGlkZVwiKTtcclxuICAgICAgICAgICAgICAgICQodCkuZm9jdXNvdXQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHN1Ym1pdCgpIHtcclxuICAgICAgICAgICAgcy5zdWJtaXQoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGNhbmNlbCgpIHtcclxuICAgICAgICAgICAgcy5jYW5jZWwoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHMud29yaygpO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgZG9jTG9hZGVkID0gZmFsc2U7XHJcbiAgICAkKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgZG9jTG9hZGVkID0gdHJ1ZTtcclxuICAgIH0pO1xyXG5cclxuICAgICQuZm4uVXNlckRpYWxvZyA9IGZ1bmN0aW9uIChwKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmICghZG9jTG9hZGVkKSB7XHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgIHZhciB0ID0gdGhpcztcclxuICAgICAgICAgICAgICAgICQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAkLmFkZFNlbGVjdFVzZXIodCwgcCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICQuYWRkU2VsZWN0VXNlcih0aGlzLCBwKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbn0pOyJdLCJmaWxlIjoicGx1Z2lucy91c2VyRGlhbG9nL1VzZXJEaWFsb2cuanMifQ==
