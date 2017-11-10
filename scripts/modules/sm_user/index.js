'use strict';
App.Module.config({
    package: '/main',
    moduleName: 'sm-user',
    description: '模块功能：用户管理',
    importList: ['jquery', 'bootstrap', 'easyTabs', 'ValidateForm', 'datePicker', 'GridTable','plugins/ajaxfileupload']
});
App.Module('sm-user', function () {
    var canCheck = true;
    var canClickSave = true;
    var oldcom = ["", "", ""];
    var sm_user = {
        Render: function (params) {
        	//设置背景色
            main.setBackColor();
            //初始化 搜索框
            sm_user.initSearch();
            //表格初始化
            sm_user.findUsers();
        },
       //初始化 搜索框
		initSearch : function(){
			//初始化 条件操作按钮
			$("#smUserBar").ValidateForm('smUserBar', {
				show : 'horizontal',
				fnSubmit : sm_user.submit,
				model : [ [ {
					input : 'input',
					type : 'text',
					show : Msg.modules.sm_user.table.userName,
					name : 'user_name',
					width : '165',
					extend : {
						id : 'user_name_search'
					}
				} ] ],
				extraButtons : [ {
					input : 'button',
					align : 'right',
					show : Msg.add,
					name : '',
					fnClick : function() {
						sm_user.openUser('add');
					},
					extend : {
						id : 'add_user',
						class : 'btn btn-add'
					// permission: "rm_cn_exportReport"
					}
				}, {
					input : 'button',
					align : 'right',
					show : Msg.update,
					name : '',
					fnClick : function() {
						sm_user.openUser('mdf');
					},
					extend : {
						id : 'mdf_user',
						class : 'btn btn-mdf'
					// permission: "rm_cn_exportReport"
					}
				}, {
					input : 'button',
					align : 'right',
					show :  Msg.del,
					name : '',
					fnClick : function() {
						sm_user.delUser();
					},
					extend : {
						id : 'del_user',
						class : 'btn btn-del'
					// permission: "rm_cn_exportReport"
					}
				} ,
				{
					input : 'button',
					align : 'right',
					show :   Msg.modules.sm_user.active,
					name : '',
					fnClick : function() {
						sm_user.dealStatus('/user/activeUserStatus');
					},
					extend : {
						id : 'active_user',
						class : 'btn btn-active'
					// permission: "rm_cn_exportReport"
					}
				} ,{
					input : 'button',
					align : 'right',
					show :  Msg.modules.sm_user.locked,
					name : '',
					fnClick : function() {
						sm_user.dealStatus('/user/lockedUserStatus');
					},
					extend : {
						id : 'locked_user',
						class : 'btn btn-locked'
					// permission: "rm_cn_exportReport"
					}
				} ]
			});
			$('#smUserBar').find('#add_user').parents('.clsRow').css({
				float : 'right'
			});
		},
		submit:function(){
			 $('#smUserTable').GridTableSearch({
				params : {
					"userName" : $('#user_name_search').val() || ""
				}
			 });
		},
		//添加 或 修改用户
		openUser:function(type){
			var title = Msg.add;
			var data = null;
			if (type == 'mdf') {
				title = Msg.update;
				var datas = $('#smUserTable').GridTableSelectedRecords();
				if(!datas || datas.length != 1 ){
					main.comonErrorFun(Msg.choseOne);
					return;
				}
				data = datas[0];
			}
			var paraDlg = App.dialog({
				id : "add_user_view",
				title : title,
				width : 700,
				height : 550,
				buttons: [{
        			id: "cancel",
        			type:'btn-close',
        			clickToClose:true,
        			text: Msg.cancel
        		},{
        			id: "add_user_save",
        			text: Msg.save
        		}]
			});
			paraDlg.loadPage({
				url : "/modules/sm_user/addUser.html",
				scripts : [ "modules/sm_user/addUser" ]
			}, {
				'type' : type,
				"data" : data,
				'callback' : sm_user.findUsers
			}, function() {
			});
		},
		//批量处理用户状态
		dealStatus:function(url){
			var userids = sm_user.selectChecked();
            if (!userids || userids.length <= 0) {
            	main.comonErrorFun(Msg.atLeastOne);
                return;
            }
            $.http.ajax(url, {
                "userid": userids
            }, function (res) {
                if (res && res.success) {
                	main.comonErrorFun(Msg.modifySucceed);
                    sm_user.findUsers();
                } else {
                	var message = Msg.modifyFailed;
					if(res.data && !$.isPlainObject(res.data)){
						message = res.data;
					}
					main.comonErrorFun(message);
                }
                return;
            }, function () {
                main.comonErrorFun(Msg.modifyFailed);
            });
		},
		//删除用户
		delUser:function(){
			var userids = sm_user.selectChecked(true);
            if (!userids) {
                return;
            }
            if (userids.length <= 0) {
            	main.comonErrorFun(Msg.atLeastOne);
                return;
            }
            App.confirm({type: "confirm", message: Msg.confimeDel}, function () {
                $.http.ajax('/user/deleteUser', {
                    "userids": userids
                }, function (res) {
                    if (res && res.success) {
                    	main.comonErrorFun(Msg.deleteSucceed);
                        sm_user.findUsers();
                    } else {
                    	var message = Msg.deleteFailed;
    					if(res.data && !$.isPlainObject(res.data)){
    						message = res.data;
    					}
    					main.comonErrorFun(message);
                    }
                }, function () {
                    main.comonErrorFun(Msg.deleteFailed);
                });
            });
		},
		/**
        *
        * 用户列表
        * @param userName
        */
       findUsers: function () {
    	   var userName = $('#user_name_search').val() || "";
           //加载表格
           $('#smUserTable').GridTable({
               url: '/user/queryUsers',
               title: false,
               max_height: 540,
               rp: 10,
               params: {"userName": userName || ""},
               clickSelect: true,
               isRecordSelected: true,
               showSelectedName: false,
               idProperty: 'userid',
               colModel: [{
                   display: Msg.modules.sm_user.table.loginName,
                   name: "loginName",
                   width: 0.12
               }, {
                   display: Msg.modules.sm_user.table.userName,
                   name: "userName",
                   width: 0.15
               }, {
                   display: Msg.modules.sm_user.table.sex,
                   name: "sex",
                   fnInit: function (div, data) {
                	   var msg = Msg.modules.sm_user.table.boy;
                       if (data == 2) {
                    	   msg = Msg.modules.sm_user.table.girl;
                       } 
                       div.parent().attr('title',msg);
                       div.html(msg);
                   },
                   order: true,
                   width: 0.1
               }, {
                   display: Msg.modules.sm_user.table.tel,
                   name: "tel",
                   width: 0.14
               }, {
                   display: Msg.modules.sm_user.table.mail,
                   name: "mail",
                   width: 0.2
               }, {
                   display: Msg.modules.sm_user.table.status,
                   name: "status",
                   fnInit: function (div, data) {
                	   var msg = Msg.modules.sm_user.table.locked;
                       if (data == 'ACTIVE') {
                    	   msg = Msg.modules.sm_user.table.active;
                           div.addClass('active');
                       } else {
                    	   div.addClass('locked');
                    	   msg = Msg.modules.sm_user.table.locked;
                       }
                       div.html(msg);
                       div.parent().attr('title', msg);
                   },
                   order: true,
                   width: 0.1
               }, {
                   display: Msg.modules.sm_user.table.description,
                   name: "description",
                   width: 0.1
               }]
           });
       },
       //获取选中的用户的userid
       getSelectUserIds: function () {
            var arr = [];
            var selects = $('#smUserTable').GridTableSelectedRecords();
            if (selects && selects.length > 0) {
                $.each(selects, function (t, e) {
                    arr.push(e.userid);
                });
            }
            return arr;
       },
       //检测选中的userid 是否包括自己 删除用户时  不能删除自己
       selectChecked: function (isdel) {
            var userids = sm_user.getSelectUserIds();
            var mdfUserid = Cookies.getCook("userid");
            if (userids.contains(mdfUserid) && isdel) {
                App.alert({
                    title: Msg.info,
                    message: Msg.modules.sm_user.notDelOwner
                });
                return;
            }
            return userids;
        }
    }
    return sm_user;
});