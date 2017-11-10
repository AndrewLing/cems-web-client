App.Module.config({
    package: '/sm_log',
    moduleName: 'sm_log_systemLog',
    description: '模块功能：日志管理:系统日志',
    importList: ['jquery', 'bootstrap', 'easyTabs', 'ValidateForm', 'datePicker', 'GridTable']
});
App.Module('sm_log_systemLog', function () {
    return {
        Render: function (params) {
        	 main.setBackColor();
            $(function () {
                var systemGetQueryData = null;
                $("#systemLogSearchBar").ValidateForm('systemLogSearchBar', {
                    show: 'horizontal',
                    fnSubmit: submit,
                    fnGetData: fnGetData,
                    model: [
                        [
                            {
                                input: 'select',
                                type: 'select',
                                show:  Msg.modules.sm_log.systemLog.level,
                                options: [{text: Msg.all, value: ""}, {text: Msg.modules.sm_log.systemLog.note, 
                                	value: "INFO"}
                                , {text: Msg.modules.sm_log.systemLog.normal, 
                                	value: "WARN"}
                                , {text: Msg.modules.sm_log.systemLog.error, 
                                	value: "ERROR"}
                                ],
                                name: 'systemLog_result',
                                extend: {id: 'systemLog_result', readonly: 'readonly'}
                            },
                            {
                                input: 'input',
                                type: 'text',
                                show: Msg.timeField,
                                name: 'systemLog_start',
                                width: 185,
                                extend: {class: 'Wdate', readonly: 'readonly', id: 'systemLog_start'},
                                fnClick: systemLogDateStart
                            },
                            {
                                input: 'input',
                                type: 'text',
                                show: Msg.to,
                                name: 'systemLog_end',
                                width: 185,
                                extend: {class: 'Wdate', readonly: 'readonly', id: 'systemLog_end'},
                                fnClick: systemLogDateEnd
                            }
                        ]
                    ],
                    extraButtons : [ {
						input : 'button',
						align : 'right',
						show : Msg.exportF,
						name : '',
						fnClick : function() {
			            fnGetData();
						window.open("log/exportSystemLog?logType=system&sortOrder=desc&stime="
																					+ systemGetQueryData.stime
																					+ "&etime="
																					+ systemGetQueryData.etime
																					+ "&level="
																					+ systemGetQueryData.result,
																			"_parent");
						},
						extend : {
							id : 'system_log_export',
							class : 'btn btn-export'
						// permission: "rm_cn_exportReport"
						}
					}]
                });

                $('#systemLogSearchBar').find('#system_log_export').parents('.clsRow').css({
					float : 'right'
				});
                //时间控件(起始时间)
                function systemLogDateStart(selector) {
                    DatePicker({
                        dateFmt: 'yyyy-MM-dd HH:mm:ss',
                        maxDate: $("#systemLog_end").val(),
                        isShowClear: true
                    });
                }

                //时间控件(结束时间)
                function systemLogDateEnd(selector) {
                    DatePicker({
                        dateFmt: 'yyyy-MM-dd HH:mm:ss',
                        minDate: $("#systemLog_start").val(),
                        isShowClear: true
                    });
                }

                //表格
                $('#system_logTable').GridTable({
                    url: 'log/querySystemLog',
                    params: {
                        logType: "system",
                        sortOrder: "desc",
                        stime: $("#systemLog_start").val(),
                        etime: $("#systemLog_end").val(),
                        result: $("#systemLog_result").val()
                    },
                    title: false,
                    max_height: '575',
                    colModel: [
                        {
                            display: Msg.modules.sm_log.systemLog.level,
                            name: 'level',
                            width: 0.1,
                            sortable: false,
                            align: 'center',
                            fnInit: formatResult
                        },
                        {
                            display: Msg.modules.sm_log.systemLog.modulName,
                            name: 'moduleName',
                            width: 0.2,
                            sortable: false,
                            align: 'center',
                            fnInit: formatModulName
                        },
                        {
                            display: Msg.modules.sm_log.systemLog.details,
                            name: 'details',
                            width: 0.5,
                            sortable: true,
                            align: 'center'
                        },
                        {
                            display: Msg.modules.sm_log.systemLog.occureDate,
                            name: 'occureDate',
                            width: 0.2,
                            sortable: false,
                            align: 'center',
                            fnInit: formatDate
                        }
                    ]
                });
                function formatDate(dom, pid) {
                    var longTime = $.trim($(dom).text());
                    var time = longTime && Date.parse(longTime).format('yyyy-MM-dd hh:mm:ss').replace(/-/g, '-');
                    $(dom).parent().attr("title",time);
                    $(dom).html(time);
                }

                function formatResult(dom, pid) {
                    var result = $(dom).text();
                    if (result.indexOf("INFO") >= 0 || result.indexOf("info") >= 0) {
                        $(dom).parent().attr("title", Msg.modules.sm_log.systemLog.note);
                        $(dom).html("<font color='green'>" + Msg.modules.sm_log.systemLog.note + "</font>");
                    } else if (result.indexOf("WARN") >= 0 || result.indexOf("warn") >= 0) {
                        $(dom).parent().attr("title", Msg.modules.sm_log.systemLog.normal);
                        $(dom).html(Msg.modules.sm_log.systemLog.normal);
                    } else if (result.indexOf("ERROR") >= 0 || result.indexOf("error") >= 0) {
                        $(dom).parent().attr("title", Msg.modules.sm_log.systemLog.error);
                        $(dom).html("<font color='red'>" + Msg.modules.sm_log.systemLog.error + "</font>");
                    }
                }
                
                function formatModulName(dom, pid) {
                    var result = $(dom).text();
                    if (result.indexOf("collection") >= 0) {
                        $(dom).parent().attr("title", Msg.modules.sm_log.systemLog.collection);
                        $(dom).html(Msg.modules.sm_log.systemLog.collection);
                    }
                }
                //相应查询按钮
                function submit() {
                    fnGetData();
                    $('#system_logTable').GridTableSearch({
                        params: systemGetQueryData
                    });
                }
                function fnGetData() {
                    var result = $("#systemLog_result").val();
                    var stime = $("#systemLog_start").val();
                    var etime = $("#systemLog_end").val();
                    systemGetQueryData = {
                        stime: stime,
                        etime: etime,
                        logType: "system",
                        sortOrder: "desc",
                        result: result
                    };
                }
            });
        }
    };
});