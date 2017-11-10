'use strict';
App.Module.config({
	package: '/sm_domain',
	moduleName: 'sm_domain',
	description: '模块功能：行政区域配置',
	importList: ['jquery', 'bootstrap', 'easyTabs', 'ValidateForm',
		'GridTable', 'iemsInputTree','cemstree'
	]
});
App.Module('sm_domain', function() {
	var smd = {
		Render: function(params) {
			//设置背景色
			main.setBackColor();
			//左侧树
			smd.initZtree();
			//右侧操作按钮
			smd.initSearch();
			//右侧表格
			smd.queryDomains();
			//初始化事件
			smd.initEvent();
		},
		//查询域数据
		queryDomains: function(isAll) {
			var parm = {
				queryParms: smd.getParam(isAll)
			};
			$('#smDomianTable').GridTable({
				url: 'domain/pageDomains',
				params: parm,
				title: false,
				clickSelect: true,
				idProperty: 'id',
				isRecordSelected: true, //跨页选择
				isSearchRecordSelected: false,
				max_height: '575',
				colModel: [{
					display: Msg.modules.sm_domain.table.domainName,
					name: 'domainName',
					width: 0.3,
					sortable: false,
					align: 'center'
				}, {
					display: Msg.modules.sm_domain.table.level,
					name: 'level',
					width: 0.2,
					sortable: false,
					align: 'center',
					fnInit: function(element, value, datas) {
						var level = Number(value) - 1;
						element.html(level);
					}
				}, {
					display: Msg.modules.sm_domain.table.description,
					name: 'description',
					width: 0.3,
					sortable: true,
					align: 'center'
				}, {
					display: Msg.modules.sm_domain.table.operation,
					name: 'id',
					width: 0.2,
					sortable: false,
					align: 'center',
					fnInit: function(element, value, datas) {
						var div = $('<div>');
						var msg = Msg.modules.sm_domain.table.dinfo;
						div.append('<a>' + msg + '</a>');
						div.attr('title', msg);
						div.off('click').on('click', function() {
							datas.pid = datas.pid + "";
							smd.openDomain('view', datas);
						});
						element.html(div);
					}
				}]
			});
		},
		saveOrMdfCallBack: function(type, obj) {
			smd.queryDomains();
			var treeObj = $.fn.zTree.getZTreeObj("domainsTree");
			if (type == 'add' && obj.data) {
				smd.addNodeToTree(treeObj, obj.data);
			} else if ('mdf' == type && obj.data) {
				var node = treeObj.getNodesByParam("id", obj.data.id, null);
				if(node && node.length>0){
					var nnode = node[0];
					if (nnode.pid != obj.data.pid) {
						treeObj.removeNode(nnode);
						smd.addNodeToTree(treeObj, obj.data,true);
					} else {
						nnode.name = obj.data.domainName;
						nnode.description = obj.data.description;
						treeObj.updateNode(nnode);
					}
				}
				var zarr = [];
				zarr.push(obj.data);
				zarr = smd.getZnodes(zarr);
				$('#domainsTree').cemstree('cemstreeProtoDataChange',zarr,0);
			} else if ('del' == type && $.isArray(obj)) {
				var ids = [];
				$.each(obj, function(t, id) {
					var node = treeObj.getNodesByParam("id", id, null)
					node && node.length>0 && treeObj.removeNode(node[0]);
					ids.push({'id':id+""});
				});
				$('#domainsTree').cemstree('cemstreeProtoDataChange',ids,-1);
			}
		},
		//添加node 到树
		addNodeToTree: function(treeObj, data,isNotCall) {
			var zarr = [];
			zarr.push(data);
			zarr = smd.getZnodes(zarr);
			var pNodes;
			if(data.pid!=1){
				var pNodes = treeObj.getNodesByParam("id", data.pid, null);
			}else{
				var pNodes = treeObj.getNodesByParam("id", "-1", null);
			}
			var pNode = null;
			if (pNodes && pNodes.length > 0) {
				pNode = pNodes[0];
				if(pNode && ((pNode.children && pNode.children.length<25) || !pNode.children)){
					treeObj.addNodes(pNode, zarr[0]);
				}
			}else{
				treeObj.addNodes(null, zarr[0]);
			}
			if(!isNotCall){
				$('#domainsTree').cemstree('cemstreeProtoDataChange',zarr,1);
			}
		},
		getZnodes: function(domains, zNodes) {
			if (!zNodes) {
				zNodes = [];
			}
			for (var i = 0; i < domains.length; i++) {
				var node = {
					"id": domains[i].id+"",
					"pid": domains[i].pid+"",
					"name": domains[i].name || domains[i].domainName+"",
					"supportPoor": domains[i].supportPoor,
					"levels": domains[i].level
				};
				node.name = main.getTopDomianName(node.name);
				zNodes.push(node);
				if (domains[i].childs && domains[i].childs.length > 0) {
					var temp = userSet.getZnodes(domains[i].childs, zNodes);
					zNodes.concat(temp);
				}
			}
			return zNodes;
		},
		//打开新加或修改域信息列表
		openDomain: function(type, olddata) {
			var title = Msg.add;
			var data = null;
			if (type == 'mdf') {
				title = Msg.update;
				var datas = $('#smDomianTable').GridTableSelectedRecords();
				if (!datas || datas.length != 1) {
					main.comonErrorFun(Msg.choseOne);
					return;
				}
				data = datas[0];
			} else if (type == 'view') {
				title = Msg.modules.sm_domain.table.dinfo;
				data = olddata;
			}
			var paraDlg = App.dialog({
				id: "add_domain_view",
				title: title,
				width: 700,
				height: 200,
				buttons: [{
					id: "cancel",
					type: 'btn-close',
					clickToClose: true,
					text: Msg.cancel
				}, {
					id: "add_domain_save",
					text: Msg.save
				}, {
					id: "close",
					clickToClose: true,
					text: Msg.close
				}]
			});
			paraDlg.loadPage({
				url: "/modules/sm_domain/addDomain.html",
				scripts: ["modules/sm_domain/addDomain"]
			}, {
				'type': type,
				"data": data,
				'callback': smd.saveOrMdfCallBack
			}, function() {});
		},
		//删除域
		delDomain: function() {
			var arr = [];
			var selects = $('#smDomianTable').GridTableSelectedRecords();
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
			}, function() {
				$.http.ajax("/domain/deleteDomain", {
					"ids": arr
				}, function(res) {
					if (res && res.success) {
						main.comonErrorFun(Msg.deleteSucceed, function() {
							smd.saveOrMdfCallBack('del', arr);
						});
					} else {
						var message = Msg.deleteFailed;
						if (res.data && !$.isPlainObject(res.data)) {
							message = res.data;
						}
						main.comonErrorFun(message);
					}
				}, function() {
					main.comonErrorFun(Msg.deleteFailed);
				});
			});
		},
		//初始化左侧树
		initZtree: function() {
			var setting = {
				view: {
					dblClickExpand: false,
					showLine: false,
					selectedMulti: false,
					showIcon: false
				},
				data: {
					simpleData: {
						enable: true,
						pIdKey:'pid'
					}
				},
				callback: {
					onClick: function(event, treeid, treeNode) {
						var treeObj = $.fn.zTree.getZTreeObj(treeid);
						treeObj.expandNode(treeNode, !treeNode.open, false, true,true);
						smd.queryDomains(false);
					}
				}
			};

			$('#domainsTree').cemstree({
				url:"/domain/queryUserDomains",
				rp:25,
				formatNode:function(node){
                	if(node.id == 1){
                		return null;
                	}
                	return node;
	            },
	            isExpandOne:false,
	            nameOfAllNode:Msg.modules.sm_domain.allArea,
	            seachInput:$('#seach_input'),
	            protoMaxAutoExpand:0,
				_setting:setting
			});
		},
		getParam: function(isAll) {
			var map = {};
			if (!isAll) {
				var treeObj = $.fn.zTree.getZTreeObj("domainsTree");
				if (treeObj && treeObj.getSelectedNodes().length > 0) {
					var  id =  treeObj.getSelectedNodes()[0].id;
					if(id !="-1" ){
						map.domainId = id;
					}
				}
			}
			map.domainName = $('#domain_name_search').val();
			return map;
		},

		submit: function(isAll) {
			var isAll = $.isPlainObject(isAll) ? false : isAll;
			var serachParam = {
				queryParms: smd.getParam(isAll)
			};
			$('#smDomianTable').GridTableSearch({
				params: serachParam
			});
		},
		//初始化 搜索框
		initSearch: function() {
			//初始化 条件操作按钮
			$("#smDomainBar").ValidateForm('dp_man_bar', {
				show: 'horizontal',
				fnSubmit: smd.submit,
				model: [
					[{
						input: 'input',
						type: 'text',
						show: Msg.modules.sm_domain.table.domainName,
						name: 'domain_name',
						width: '165',
						extend: {
							id: 'domain_name_search'
						}
					}]
				],
				extraButtons: [{
					input: 'button',
					align: 'right',
					show: Msg.add,
					name: '',
					fnClick: function() {
						smd.openDomain('add');
					},
					extend: {
						id: 'add_domain',
						class: 'btn btn-add'
							// permission: "rm_cn_exportReport"
					}
				}, {
					input: 'button',
					align: 'right',
					show: Msg.update,
					name: '',
					fnClick: function() {
						smd.openDomain('mdf');
					},
					extend: {
						id: 'mdf_domain',
						class: 'btn btn-mdf'
							// permission: "rm_cn_exportReport"
					}
				}, {
					input: 'button',
					align: 'right',
					show: Msg.del,
					name: '',
					fnClick: function() {
						smd.delDomain();
					},
					extend: {
						id: 'del_domain',
						class: 'btn btn-del'
							// permission: "rm_cn_exportReport"
					}
				}]
			});
			$('#smDomainBar').find('#add_domain').parents('.clsRow').css({
				float: 'right'
			});
		},
		initEvent: function() {
			$('.all-domian-icon').off('click').on('click', function() {
				var treeObj = $.fn.zTree.getZTreeObj("domainsTree");
				treeObj && treeObj.cancelSelectedNode();
				smd.submit(true);
			});
		}
	};
	return smd;
});