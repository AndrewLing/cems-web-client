App.Module.config({
    package: '/sm_role',
    moduleName: 'sm_role_addRole',
    description: '模块功能：添加角色',
    importList: ['jquery', 'bootstrap','datePicker','iemsInputTree']
});
App.Module('sm_role_addRole', function () {
	var type = null;//是否是修改数据
	var data = null;//修改时的data
	var callback = null;//创建或成功后回调的方法
    var addRole = {
        Render: function (params) {
        	main.setBackColor();
        	type = params.type;
        	callback= params.callback;
        	data = params.data && params.data;
        	 //初始化校验
        	addRole.initValid();
        	//初始化事件
        	addRole.initEvent();
        	//修改时 回显数据
        	addRole.initData();
        },
       //初始化校验
        initValid:function(){
        	//表单验证
        	$('#addRoleForm').validate({
				rules: {
					roleName: {
						required: true,
						maxlength: 64,
						vacSepecialString:true
					},
					discription:{
						maxlength: 255,
						vacSepecialString:true
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
        //修改时 回显数据
        initData : function(){
        	if('mdf' == type){
        		$.http.ajax('/role/queryRoleById', {roleid:data.id}, function (res) {
                    if (res.success) {
                    	data = res.data.role;
                    	var inputArr = $('.inputVal');
                    	$.each(inputArr,function(t,e){
                    		var name = $(e).attr('name');
                    		var val = data[name];
                    		if('domainid'==name){
                    		}else if('status'==name){
                    			var status = null == data.status ? 'ACTIVE' : data.status;
                    			 $("input[name='"+name+"'][value='" + status + "']")[0].checked = true;
                    			 $("input[name='"+name+"']").removeClass('radio-on');
                                 $("input[name='"+name+"'][value='" + status + "']").addClass('radio-on');
                    		}else{
                    			$(e).val(val);
                    		}
                    	});
                    	$.fn.zTree.init($("#srcTree"), addRole.getSrcSetting(), addRole.getSrcNodes(res.data.srcs));
                    }else{
                    	var msg =  Msg.modules.sm_role.addRole.getrInfoFail;
                    	if( !$.isPlainObject(res.data)){
                    		msg = res.data;
                    	}
                    	main.comonErrorFun(msg,function(){
                    		App.dialog('close');
                    	});
                    }
                },function(){
                	var msg = Msg.modules.sm_role.addRole.getrInfoFail;
                	main.comonErrorFun(msg,function(){
                		App.dialog('close');
                	});
                });
        	}else{
        		$.http.ajax('/user/queryUserSrc', {
                }, function (res) {
                    if (res.success) {
                        $.fn.zTree.init($("#srcTree"), addRole.getSrcSetting(), addRole.getSrcNodes(res.data));
                    }
                });
        	}
        },
        
        //初始化事件
        initEvent:function(){
        	//域选择框
        	$('#domain_role').iemsInputTree({
                url: 'domain/queryUserDomains',
                checkStyle: "radio",
                textFiled:"name",
                ajaxBefore:true,
                isPromptlyInit:true,
                clickPIsChecked: true,
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
        	$("#domain_role_searchDiv").hide();
        	
        	//保存按钮
        	$('#add_role_save').off('click').on('click',function(){
        		var form = $('#addRoleForm');
				if (!form.valid()) {
					return;
				}
        		if('view' == type) return;
        		addRole.saveOrMdfRole();
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
        //保存或者修改站点信息
        saveOrMdfRole:function(params){
        	var url = "/role/saveRole";
        	if(type == "mdf") {
        		url = "/role/updateRole";
        	}
        	var info = addRole.getRoleInfo();
        	var parm = {};
        	parm.role = info;
        	parm.srcids = addRole.getSelectSrcids();
        	$.http.ajax(url, parm, function (res) {
                if (res.success) {
                	main.comonErrorFun(type == "mdf" ? Msg.modifySucceed : Msg.saveSucceed,function(){
                		$.isFunction(callback) && callback(res);
                		App.dialog('close')
                	});
                } else {
                	var msg = type == "mdf" ? Msg.modifyFailed : Msg.saveFailed;
                	if( !$.isPlainObject(res.data)){
                		msg = res.data;
                	}
                	main.comonErrorFun(msg);
                }
            },function(){
            	main.comonErrorFun(type == "mdf" ? Msg.modifyFailed : Msg.saveFailed);
            });
        },
        //获取页面输入的域信息
        getRoleInfo:function(){
        	var info = {};
        	var inputArr = $('.inputVal');
        	$.each(inputArr,function(t,e){
        		var name = $(e).attr('name');
        		var val = $(e).val();
        		if(name == 'domainid'){
        			val = $(e).attr("treeSelId");
        			val = !val ? 1 : val;
        		}else if(name == 'status'){
        			val = $("input[name='status']:checked").val();
        		}
        		info[name]= val;
        	});
        	info.id = data && data.id ? data.id :null;
        	return info;
        },
     // 权限树 数结构 setting 配置
        getSrcSetting: function () {
            var setsrc = {
                check: {
                    enable: true,
                    autoCheckTrigger: true,
                    chkboxType: {"Y": "ps", "N": "s"}
                },
                view: {
                    dblClickExpand: false,
                    showLine: false,
                    selectedMulti: false
                },
                data: {
                    simpleData: {
                        enable: true,
                        idKey: "srcid",
                        pIdKey: "pid"
                    }
                },
                callback: {
                    onClick: function (e, treeId, treeNode) {
                        var treeObj = $.fn.zTree.getZTreeObj(treeId);
                        treeObj.expandNode(treeNode, !treeNode.open, false, true);
                    }
                }
            };
            return setsrc;
        },
        // 权限list 转成node
        getSrcNodes: function (srcs,node) {
        	if(!node){
        		node = [];
        	}
            $.each(srcs, function (t, e) {
            	e.name = e.srcname;
            	if(e.code){
            		e.name = main.eval(e.code)
            	}
                e.checked = e.check;
                node.push(e);
                if(e.childs && e.childs.length>0){
                	var tempnode = addRole.getSrcNodes(e.childs,node);
                	node.concat(tempnode);
                }
            });
            return node;
        },
        //获取选中的src 
        getSelectSrcids: function () {
            var treeObj = $.fn.zTree.getZTreeObj("srcTree");
            var nodes = treeObj.getNodesByFilter(function (node) {
                return (node.checked || (node.chkDisabled && node.checked));
            });
            var srcids = [];
            if (nodes && nodes.length > 0) {
                var srcids = [];
                $.each(nodes, function (t, e) {
                    srcids.push(e.srcid);
                });

            }
            return srcids;
        }
    };
    return addRole;
});