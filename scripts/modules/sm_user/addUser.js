App.Module.config({
    package: '/sm_user',
    moduleName: 'addUser',
    description: '模块功能：添加用户',
    importList: ['jquery', 'bootstrap','ValidateForm', 'GridTable','iemsInputTree','jquery-base64']
});
App.Module('addUser', function () {
	var type = null;//是否是修改数据
	var data = null;//修改时的data
	var callback = null;//创建或成功后回调的方法
	var curRoleDomain = null;
	var curResDomain = null;
    var addUser = {
        Render: function (params) {
        	//设置背景色
        	main.setBackColor();
        	//修改上传头像框的提示信息
        	$('#userPicFile').attr("title",Msg.scan);
        	type = params.type;
        	callback= params.callback;
        	data = params.data && params.data;
        	curRoleDomain = null;
        	curResDomain = null;
        	//初始化验证规则
        	addUser.initVlid();
        	//初始化数据
        	addUser.initData();
        	//初始化事件监听
        	addUser.initEvent();
        	
        },
        //初始化数据  修改时的数据回显 已经 创建时的 角色初始化
        initData : function(){
        	if('mdf' == type){
        		$.http.ajax('/user/queryUserByid', {userid:data.userid}, function (res) {
                	if (res.success) {
                		var _thisp = addUser.getPage;
                		data = res.data;
                		var inputArr = $('.inputVal');
                    	$.each(inputArr,function(t,e){
                    		var name = $(e).attr('name');
                    		var val = data[name];
                    		if(name == 'sex' || name=='status'){
                    			  var temp = null == val ?  (name == 'sex' ? '1' :'ACTIVE') : val;
                    			  var _this = $("input[name='"+name+"'][value='" + temp + "']");
                    			  _this[0].checked = true;
                                  $("input[name='"+name+"']").removeClass('radio-on');
                                  _this.addClass('radio-on');
                    		}else{
                    			$(e).val(val);
                    		}
                    	});
                    	$('#loginNameTd').removeClass('tdMust');
                		$('#loginName').attr('disabled',true);
                		_thisp('#password').val('');
                		var userAvatar = data['userAvatar'];
                    	if(userAvatar){
                    		$('#userPicFile').attr('fileId',userAvatar);
                    		$("#userPicImg").attr("src", "/fileManager/downloadFile?serviceId=2&fileId="+userAvatar+"&t="+new Date().getTime()).error(function(){
        	        			 $(this).removeAttr('src');
        	        		});	
                    	}
        				$.http.ajax('/role/queryUserRoles', {userid:data.userid}, function (res) {
                        	if (res.success) {
                        		var roles = res.data;
                        		addUser.queryUserRoles(data.domainid);
                         		$('#chooseRoleTable').GridTableInitSelectedRecords(roles);
                         		//初始化资源树
                                addUser.initDataTree(data.domainid);
                            } 
                        });
                    }else{
                    	var msg =  Msg.modules.sm_user.addUser.getUinfoFail;
                    	if( !$.isPlainObject(res.data)){
                    		msg = res.data;
                    	}
                    	main.comonErrorFun(msg,function(){
                    		App.dialog('close');
                    	});
                    }
                },function(){
                	var msg =  Msg.modules.sm_user.addUser.getUinfoFail;
                	main.comonErrorFun(msg,function(){
                		App.dialog('close');
                	});
                });
        	}else{
        		//初始化资源树
                addUser.initDataTree(Cookies.getCook("userDomianId"));
        		addUser.queryUserRoles(Cookies.getCook("userDomianId"));
        	}
        },
        //更加某个节点获取所有父节点
        getAllParNode:function(treeNode){
        	var nodes = [];
        	var node = treeNode.getParentNode();
        	while(node){
        		nodes.push(node);
        		node = node.getParentNode();
        	}
        	return nodes;
        },
        //初始化资源树
        initDataTree:function(cdomianid){
        	if(!cdomianid || (curResDomain && curResDomain==cdomianid)){
        		return;
        	}
        	curResDomain = cdomianid;
        	var setting = {
        			view: {
        				dblClickExpand: false,
        				showLine: false,
        				selectedMulti: false,
        				showIcon:true
        			},
        			check: {
        				enable: true,
        				chkboxType: { "Y": "s", "N": "ps" }
        			},
        			data: {
        				simpleData: {
        					enable:true
        				}
        			},
        			callback:{
        				onCheck:function(e,treeId,treeNode){
        					if(!treeNode.checked){
        						var nodes = addUser.getAllParNode(treeNode);
        						var treeObj = $.fn.zTree.getZTreeObj(treeId);
        						if(nodes && nodes.length >0 && treeObj){
        							$.each(nodes,function(t,e){
        								treeObj.checkNode(e, false, false);
        							});
        						}
        					}
        				},
        				onClick: function(e,treeId,treeNode){
        					var treeObj = $.fn.zTree.getZTreeObj(treeId);
       					 	treeObj.expandNode(treeNode, !treeNode.open, false, true);
        				}
        			}
            };
        	var userid = type == 'mdf' ? data.userid : null;
			$.http.ajax('/domain/queryUserDomainAndStaRes', {userid: userid, domianId: cdomianid}, function(res) {
				var domains = res.data;
				var t = $("#chooseTree");
				var zNodes = main.getTreeNode(domains);
				t = $.fn.zTree.init(t, setting, zNodes);
			});
        },
        //获取选中的资源 树id 和是否需要子 默认不需要
        getSelectDomainStation : function(treeId,IsneedSon){
        	var treeObj = $.fn.zTree.getZTreeObj(treeId);
        	var nodes = [];
        	if(treeObj){
        		nodes = treeObj.getNodesByFilter(function(node){
        			var pnode = node.getParentNode();
        			if(IsneedSon || !pnode){
        				return (node.checked || (node.chkDisabled && node.checked));
        			}else{
        				return ((node.checked || (node.chkDisabled && node.checked)) && !pnode.checked);
        			}
        		});
        	}
        	if(nodes && nodes.length>0){
        		var nodetemps = [];
        		$.each(nodes,function(t,e){
        			var tmp = {};
        			tmp.id = e.id;
        			tmp.model = e.model;
        			nodetemps.push(tmp);
        		});
        		return nodetemps;
        	}
        	return nodes;
        },
        //查询可选择角色
        queryUserRoles : function(domainid){
        	if(!domainid || (curRoleDomain && curRoleDomain==domainid)){
        		return;
        	}
        	var parm = {domainid:domainid};
        	curRoleDomain = domainid;
			$('#chooseRoleTable').GridTable({
				url : '/role/queryRoles',
				params : parm,
				title : false,
				singleSelect:true,
				clickSelect : true,
				idProperty : 'id',
				isRecordSelected : true,//跨页选择
				isSearchRecordSelected : false,
				max_height: 280,
	            rp: 5,
				colModel : [ {
					display : Msg.modules.sm_user.addUser.role.roleName,
					name : 'roleName',
					width : 0.4,
					sortable : false,
					align : 'center'
				}, {
					display : Msg.modules.sm_user.addUser.role.discription,
					name : 'discription',
					width : 0.4,
					sortable : false,
					align : 'center',
					fninit: function(element, value, datas) {
						element.html(value);
					}
				}, {
					display : Msg.modules.sm_user.addUser.role.status,
					name : 'status',
					width : 0.2,
					sortable : true,
					align : 'center',
					fnInit : function(element, value, datas) {
						var msg = Msg.modules.sm_user.addUser.role.active;
						if('LOCKED' === value){
							element.addClass('locked');
							msg = Msg.modules.sm_user.addUser.role.locked;
						}else{
							element.addClass('active');
							msg = Msg.modules.sm_user.addUser.role.active;
						}
						element.html(msg);
						element.parent().attr('title',msg);
					}
				}]
			});
        },
        //保存或者 修改用户
        saveOrMdfUser:function(userAvatar){
        	var roleIds = addUser.getRoleIds();
        	 if (roleIds.length < 1) {
        		 main.comonErrorFun(Msg.modules.sm_user.selectRole);
                 return;
             }
        	var info = addUser.getUserInfo();
        	info.userAvatar = userAvatar || $("#userAvatar").attr('fileId');
        	info.userType = "OTHER";
        	
        	var domainStas = addUser.getSelectDomainStation("chooseTree"); 
            var parm = {"user": info, "roleid": roleIds, "areaid": domainStas};
            var url = 'mdf' == type ? '/user/updateUser' : '/user/saveUser';
            $.http.ajax(url, parm, function (res) {
            	if (res.success) {
                	main.comonErrorFun(type == "mdf" ? Msg.modifySucceed : Msg.saveSucceed,function(){
                		$.isFunction(callback) && callback();
                		App.dialog('close')
                	});
                } else {
                	var msg = type == "mdf" ? Msg.modifyFailed : Msg.saveFailed;
                	if( !$.isPlainObject(res.data)){
                		msg = res.data;
                	}
                	main.comonErrorFun(msg);
                }
            }, function () {
                main.comonErrorFun(  type ==  "mdf" ? Msg.modifyFailed : Msg.saveFailed);
            });
            
        },
        getRoleIds: function () {
            var roleId = [];
            var selects = $('#chooseRoleTable').GridTableSelectedRecords();
            if (selects && selects.length > 0) {
                $.each(selects, function (t, e) {
                    roleId.push(e.id);
                });
            }
            return roleId;
        },
        //初始化事件
        initEvent: function(){
        	// 主要是针对保存
        	$('#add_user_save').off('click').on('click',function(){
        		var form = $('#addUserForm');
    			if (!form.valid()) {
    				return;
    			}
    			if($('#userPicText').val()){
                	var params={};
                    params.formId="userPicFile";
                    params.serviceId= "2";
                    fileId = data && data.userAvatar ? data.userAvatar : "";
                    if(fileId && fileId !="" && fileId != undefined){
                        params.fileId = fileId;
                    }
                    main.fileUpload(params,function(res){
                    	addUser.saveOrMdfUser(res.data);
                    },function(){
                    	main.comonErrorFun(Msg.image.uploadFailed);
                    });
                }else{
                	addUser.saveOrMdfUser();
                }
        	});
        	
        	//图片上传
        	if(main.getBrowser() && !main.getBrowser().msie){
        		$('.btn-scan').off('click').on('click',function(){
        			$('#userPicFile').click();
        		});
        	}
        	$('#userPicFile').off('change').on('change',function(e){
        		var $this = $(this);
    			var fileURL = $this.val();
    	        var fileName = '';
    	        if(fileURL && fileURL != ''){
	        		 var all = fileURL.split('\\');
	                 fileName = all[all.length-1];
    	        }
    	        $("#userPicText").val(fileName);
    	        if(fileName == ''){
    	        	var fileId = $("#userPicFile").attr('fileId');
    	        	if(fileId){
    	        		$("#userPicImg").attr("src", "/fileManager/downloadFile?serviceId=2&fileId="+fileId+"&t="+new Date().getTime()).error(function(){
     	        			 $(this).removeAttr('src');
     	        		});	
    	        	}else{
    	        		$("#userPicImg").removeAttr('src');
    	        	}
    	        	return;
    	        }
    			if(!main.checkImage(e,$("#userPicText"))){
            		return;
            	}
    			var prevDiv = $('#userPicImg');
    	        if (this.files && this.files[0]){
    	        	 if(!(typeof FileReader == "undefined")){
    	        		 var reader = new FileReader();
        	        	 reader.onload = function(evt){
        	        		 prevDiv.attr('src',evt.target.result );
        	        	 }
        	        	 reader.readAsDataURL(this.files[0]);
    	        	 }
    	        }
    		});
        	
        	//域选择框初始化
        	$('#domianid').iemsInputTree({
                url: 'domain/queryUserDomains',
                checkStyle: "radio",
                textFiled:"name",
                ajaxBefore:type == 'mdf' ? true : false,
                clickPIsChecked:true,
                isPromptlyInit:true,
                isBind:true,
                treeNodeFormat:function(nodes){
                	var n = nodes.length;
                	while(n--){
                		var e = nodes[n];
                		if(e.id == 1 || e.id == '1'){
                			nodes.splice(e,1);
                		}
                	}
                	return nodes;
                },
                selectNodes: data && data.domainid ? [data.domainid] : false
                		
            });
        	$("#domianid_searchDiv").hide();
        	
        	//域变化 切换角色列表和资源列表
        	$('#domianid').off("change").on("change", function (event) {
        		var domianid = $('#domianid').attr("treeSelId");
        		domianid = domianid ? domianid : Cookies.getCook("userDomianId");
        		addUser.queryUserRoles(domianid);
        		addUser.initDataTree(domianid);
            });
        	
        	//角色和资源切换展示
        	$('.choose').off('click').on('click',function(){
        		var _this = $(this);
        		var id = _this[0].id;
        		$('.choose').removeClass('actived');
        		_this.addClass('actived');
        		$('.chooseTd').hide();
        		$('#'+id+'Td').show();
        	});
        	
        	//radio 点击事件
        	$('.check-label').off('click').on('click',function(){
        		var radio = $(this).find('input[type="radio"]');
        		var val = $(radio).attr('value');
        		var name = $(radio).attr('name');
        		$("input[name='"+name+"'][value='" + val + "']")[0].checked = true;
        		$("input[name='"+name+"']").removeClass('radio-on');
        		$(radio).addClass('radio-on');
        	});
        },
        
        //获取用户信息
        getUserInfo : function(){
        	var info = {};
        	var inputArr = $('.inputVal');
        	$.each(inputArr,function(t,e){
        		var name = $(e).attr('name');
        		var val = $(e).val();
        		if(name == 'sex' || name=='status'){
        			val = $("input[name='"+name+"']:checked").val();
        		}
        		info[name]= val;
        	});
        	var curdomianid = $('#domianid').attr("treeSelId");
        	info.domainid = curdomianid ? curdomianid: Cookies.getCook("userDomianId");
        	info.userid = data && data.userid ? data.userid :null;
        	if(info.password){
        		var pwd = info.password;
        		info.password = main.base64(pwd,3);
        	}
        	if(type == 'mdf'){
        		info.loginName = data.loginName;
        	}
        	return info;
        },
        //初始化验证规则
        initVlid : function(){
        	//表单验证
        	$('#addUserForm').validate({
				rules: {
					loginName: {
						required: true,
						maxlength: 64,
						vacSepecialString:true
					},
					userName:{
						required: true,
						maxlength: 64,
						vacSepecialString:true
					},
					password:{
						required: 'mdf'==type ? false: true,
						maxlength: 64,
						passwordCheck:true
					},
					tel:{
						tel: true
					},
					mail:{
						email:true
					}
				},
				errorPlacement: function (error, element) {
					var msg = $(error).html();
					if($(element)[0].className.indexOf('error') >=0){
						main.tip($(element),null,false);
					}
					main.tip($(element),msg.replaceHTMLChar(),true,'bottom');
		        },
		        unhighlight:function(e, errorClass){
		        	$(e).removeClass(errorClass);
		        	main.tip($(e),null,false);
		        }
			});
        },
        getPage: function (expr) {
			var page = $("#addUser");
			return expr ? page.find(expr) : page;
		}
    };
    return addUser;
});