App.Module.config({
	package : '/sm_log',
	moduleName : 'sm_log_secutityLog',
	description : '模块功能：日志管理:安全日志',
	importList : [ 'jquery', 'bootstrap', 'easyTabs', 'ValidateForm',
			'datePicker', 'GridTable' ]
});
App.Module('sm_log_secutityLog', function() {
	return {
		Render : function(params) {
			main.setBackColor();
			$(function() {
				var securityGetQueryData = null;
				$("#secutityLogSearchBar").ValidateForm('secutityLogSearchBar',
						{
							show : 'horizontal',
							fnSubmit : submit,
							fnGetData : fnGetData,
							model : [ [ {
								input : 'select',
								type : 'select',
								show : Msg.modules.sm_log.secutityLog.effect,
								options : [ {
									text : Msg.all,
									value : ""
								}, {
									text : Msg.success,
									value : "SUCCESSFUL"
								}, {
									text : Msg.fail,
									value : "FAIL"
								} ],
								name : 'securityLog_result',
								extend : {
									id : 'securityLog_result',
									readonly : 'readonly'
								}
							}, {
								input : 'input',
								type : 'text',
								show : Msg.timeField,
								name : 'securityLog_start',
								width : 185,
								extend : {
									class : 'Wdate',
									readonly : 'readonly',
									id : 'securityLog_start'
								},
								fnClick : securityLogDateStart
							}, {
								input : 'input',
								type : 'text',
								show : Msg.to,
								name : 'securityLog_end',
								width : 185,
								extend : {
									class : 'Wdate',
									readonly : 'readonly',
									id : 'securityLog_end'
								},
								fnClick : securityLogDateEnd
							} ] ],
							extraButtons : [ {
								input : 'button',
								align : 'right',
								show : Msg.exportF,
								name : '',
								fnClick : function() {
									fnGetData();
									window.open(
											"log/exportSecutityLog?logType=security&sortOrder=desc&stime="
													+ securityGetQueryData.stime
													+ "&etime="
													+ securityGetQueryData.etime
													+ "&level="
													+ securityGetQueryData.result,
											"_parent")
								},
								extend : {
									id : 'sm_log_export',
									class : 'btn btn-export'
								// permission: "rm_cn_exportReport"
								}
							}]
						});
				
				$('#secutityLogSearchBar').find('#sm_log_export').parents('.clsRow').css({
					float : 'right'
				});

				//时间控件(起始时间)
				function securityLogDateStart(selector) {
					DatePicker({
						dateFmt : 'yyyy-MM-dd HH:mm:ss',
						maxDate : $("#securityLog_end").val(),
						isShowClear : true
					});
				}

				//时间控件(结束时间)
				function securityLogDateEnd(selector) {
					DatePicker({
						dateFmt : 'yyyy-MM-dd HH:mm:ss',
						minDate : $("#securityLog_start").val(),
						isShowClear : true
					});
				}

				//表格
				$('#secutity_logTable').GridTable({
					url : 'log/querySecutityLog',
					params : {
						logType : "security",
						sortOrder : "desc",
						stime : $("#securityLog_start").val(),
						etime : $("#securityLog_end").val(),
						result : $("#securityLog_result").val()
					},
					title : false,
					max_height : '575',
					colModel : [ {
						display : Msg.modules.sm_log.secutityLog.userName,
						name : 'userName',
						width : 0.1,
						sortable : false,
						align : 'center'
					}, {
						display : Msg.modules.sm_log.secutityLog.userAction,
						name : 'userAction',
						width : 0.15,
						sortable : false,
						align : 'center'
					}, {
						display : Msg.modules.sm_log.secutityLog.sercurityCase,
						name : 'sercurityCase',
						width : 0.1,
						sortable : true,
						align : 'center',
						fnInit : formatResult
					}, {
						display : Msg.modules.sm_log.secutityLog.affectedUser,
						name : 'affectedUser',
						width : 0.1,
						sortable : false,
						align : 'center'
					}, {
						display : Msg.modules.sm_log.secutityLog.details,
						name : 'details',
						width : 0.2,
						sortable : false,
						align : 'center'
					}, {
						display : Msg.modules.sm_log.secutityLog.loginIp,
						name : 'loginIp',
						width : 0.15,
						sortable : false,
						align : 'center'
					}, {
						display : Msg.modules.sm_log.secutityLog.time,
						name : 'occureDate',
						width : 0.2,
						sortable : true,
						align : 'center',
						fnInit : formatDate
					} ]
				});
				function formatDate(dom, pid) {
					var longTime = $.trim($(dom).text());
					var time = longTime
							&& Date.parse(longTime).format(
									'yyyy-MM-dd hh:mm:ss').replace(/-/g, '-');
					$(dom).parent().attr("title", time);
					$(dom).html(time);
				}

				function formatResult(dom, pid) {
					var result = $(dom).text();
					if (result.indexOf("SUCCESS") >= 0
							|| result.indexOf("success") >= 0) {
						$(dom).parent().attr("title", Msg.success);
						$(dom).html(
								"<font color='green'>" + Msg.success
										+ "</font>");
					} else {
						$(dom).parent().attr("title", Msg.fail);
						$(dom)
								.html(
										"<font color='red'>" + Msg.fail
												+ "</font>");
					}
				}

				//相应查询按钮
				function submit() {
					fnGetData();
					$('#secutity_logTable').GridTableSearch({
						params : securityGetQueryData
					});
				}

				function fnGetData() {
					var result = $("#securityLog_result").val();
					var stime = $("#securityLog_start").val();
					var etime = $("#securityLog_end").val();
					securityGetQueryData = {
						stime : stime,
						etime : etime,
						logType : "security",
						sortOrder : "desc",
						result : result
					};
				}
			/*	//导出安全日志
				$("#sm_log_export").click(
						function() {
							fnGetData();
							window.open(
									"log/exportSecutityLog?logType=security&sortOrder=desc&stime="
											+ securityGetQueryData.stime
											+ "&etime="
											+ securityGetQueryData.etime
											+ "&level="
											+ securityGetQueryData.result,
									"_parent")
						});*/
			});
		}
	};
});