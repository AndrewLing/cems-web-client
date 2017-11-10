'use strict';
App.Module.config({
    package: '/sm_role',
    moduleName: 'sm_role',
    description: '模块功能：角色管理',
    importList: ['jquery', 'bootstrap', 'easyTabs','ValidateForm', 'GridTable']
});
App.Module('sm_role', function () {
    var smRole = {
        Render: function (params) {
           //设置背景色
       	   main.setBackColor();
       	   //初始化 搜索框
       	   smRole.initSearch();
       	   //初始表格数据
       	   smRole.queryRoles();
       	   
        },
        //查询角色数据
        queryRoles : function() {
			var parm = {roleName:$('#role_name_search').val()};
			$('#smRoleTable').GridTable({
				url : 'role/queryRoles',
				params : parm,
				title : false,
				clickSelect : true,
				idProperty : 'id',
				isRecordSelected : true,//跨页选择
				isSearchRecordSelected : false,
				max_height : '575',
				colModel : [ {
					display : Msg.modules.sm_role.table.roleName,
					name : 'roleName',
					width : 0.3,
					sortable : false,
					align : 'center'
				}, {
					display : Msg.modules.sm_role.table.domainName,
					name : 'domainName',
					width : 0.2,
					sortable : false,
					align : 'center',
					fnInit: function(element, value, datas) {
						if(datas.domainid == 1 || datas.domainid == '1'){
							element.html('');
							element.parent().attr('title','');
						}else{
							element.html(value);
						}
					}
				}, {
					display : Msg.modules.sm_role.table.status,
					name : 'status',
					width : 0.3,
					sortable : true,
					align : 'center',
					fnInit : function(element, value, datas) {
						var msg = Msg.modules.sm_role.table.locked;
						if('LOCKED' === value){
							element.addClass('locked');
							msg = Msg.modules.sm_role.table.locked;
						}else{
							element.addClass('active');
							msg = Msg.modules.sm_role.table.active;
						}
						element.html(msg);
						element.parent().attr('title',msg);
					}
				}, {
					display : Msg.modules.sm_role.table.discription,
					name : 'discription',
					width : 0.2,
					sortable : false,
					align : 'center'
				} ]
			});
		},
		openRole :function(type){
			var title = Msg.add;
			var data = null;
			if (type == 'mdf') {
				title = Msg.update;
				var datas = $('#smRoleTable').GridTableSelectedRecords();
				if(!datas || datas.length != 1 ){
					main.comonErrorFun(Msg.choseOne);
					return;
				}
				data = datas[0];
			}
			var paraDlg = App.dialog({
				id : "add_Role_view",
				title : title,
				width : 700,
				height : 480,
				buttons: [{
        			id: "cancel",
        			type:'btn-close',
        			clickToClose:true,
        			text: Msg.cancel
        		},{
        			id: "add_role_save",
        			text: Msg.save
        		}]
			});
			paraDlg.loadPage({
				url : "/modules/sm_role/addRole.html",
				scripts : [ "modules/sm_role/addRole" ]
			}, {
				'type' : type,
				"data" : data,
				'callback' : smRole.queryRoles
			}, function() {
			});
		},
		delRole:function(){
			var arr = [];
			var selects = $('#smRoleTable').GridTableSelectedRecords();
			if (selects && selects.length > 0) {
				$.each(selects, function(t, e) {
					arr.push(e.id);
				});
			}
			if (!arr || arr.length <= 0) {
				main.comonErrorFun(Msg.atLeastOne);
				return;
			}
			App.confirm({
                message: Msg.confimeDel
            }, function () {
            	$.http.ajax("/role/deleteRole", {
    				"roleids" : arr
    			}, function(res) {
    				if (res && res.success) {
    					main.comonErrorFun(Msg.deleteSucceed, function() {
    						smRole.queryRoles();
    					});
    				} else {
    					var message = Msg.deleteFailed;
    					if(res.data && !$.isPlainObject(res.data)){
    						message = res.data;
    					}
    					main.comonErrorFun(message);
    				}
    			}, function() {
    				main.comonErrorFun(Msg.deleteFailed);
    			});
            });
		},
		
		submit:function(){
			 $('#smRoleTable').GridTableSearch({
				params : {
					"roleName" : $('#role_name_search').val() || ""
				}
			 });
		},
        //初始化 搜索框
		initSearch : function(){
			//初始化 条件操作按钮
			$("#smRoleBar").ValidateForm('smRoleBar', {
				show : 'horizontal',
				fnSubmit : smRole.submit,
				model : [ [ {
					input : 'input',
					type : 'text',
					show : Msg.modules.sm_role.table.roleName,
					name : 'role_name',
					width : '165',
					extend : {
						id : 'role_name_search'
					}
				} ] ],
				extraButtons : [ {
					input : 'button',
					align : 'right',
					show : Msg.add,
					name : '',
					fnClick : function() {
						smRole.openRole('add');
					},
					extend : {
						id : 'add_Role',
						class : 'btn btn-add'
					// permission: "rm_cn_exportReport"
					}
				}, {
					input : 'button',
					align : 'right',
					show : Msg.update,
					name : '',
					fnClick : function() {
						smRole.openRole('mdf');
					},
					extend : {
						id : 'mdf_role',
						class : 'btn btn-mdf'
					// permission: "rm_cn_exportReport"
					}
				}, {
					input : 'button',
					align : 'right',
					show :  Msg.del,
					name : '',
					fnClick : function() {
						smRole.delRole();
					},
					extend : {
						id : 'del_role',
						class : 'btn btn-del'
					// permission: "rm_cn_exportReport"
					}
				} ]
			});
			$('#smRoleBar').find('#add_Role').parents('.clsRow').css({
				float : 'right'
			});
		}
    };
    return smRole;
});