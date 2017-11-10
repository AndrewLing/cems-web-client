App.Module.config({
	package: '/rc_record',
	moduleName: 'paymentdetails',
	description: '模块功能：缴费记录',
	importList: ['jquery', 'bootstrap', 'easyTabs', 'ValidateForm',
		'GridTable', 'iemsInputTree'
	]
});
App.Module('paymentdetails', function() {
	var curParm;
	var tableName = [Msg.modules.rc_record.paymentdetails.table.cardNumber,Msg.modules.rc_record.paymentdetails.table.rechargeDate
	                 ,Msg.modules.rc_record.paymentdetails.table.rechargeMoney,Msg.modules.rc_record.paymentdetails.table.remainningSum
	                 ,Msg.modules.rc_record.paymentdetails.table.operateUser];
	var paymentdetails = {
		Render: function(params) {
			//设置背景色
			main.setBackColor();
			paymentdetails.initSearch();
			paymentdetails.queryDatas();
		},
		getParms : function(){
			var parm = {};
			var queryParms = {};
			queryParms.cardNumber = $('#card_number_search').val();
			var btimeStr = $('#btime').val();
			var etimeStr = $('#etime').val();
			if(btimeStr){
				queryParms.rechargeBDate = Date.parse(btimeStr,Msg.dateFormat.yyyymmddhhss).getTime();
			}
			if(etimeStr){
				queryParms.rechargeEDate = Date.parse(etimeStr,Msg.dateFormat.yyyymmddhhss).getTime();
			}
			parm.queryParms = queryParms;
			curParm = parm;
			return parm;
		},
		//查询卡数据
        queryDatas: function () {
            parm = {cardNumber: $('#card_number_search').val()};
            var table = $('#paymentdetailsTable').GridTable({
                url: 'card/rechargelist',
                params: paymentdetails.getParms(),
                title: false,
                clickSelect: true,
                idProperty: 'id',
                isRecordSelected: true,//跨页选择
                isSearchRecordSelected: false,
                max_height: '575',
                colModel: [{
                    display: Msg.modules.rc_record.paymentdetails.table.cardNumber,
                    name: 'cardNumber',
                    width: 0.2,
                    order: false,
                    align: 'center'
                }, {
                    display: Msg.modules.rc_record.paymentdetails.table.rechargeDate,
                    name: 'rechargeDate',
                    width: 0.2,
                    order: true,
                    align: 'center',
                    fnInit:function(element, value, datas){
                    	var val = "";
                    	if(value){
                    		val = (Date.parse(value)).format(Msg.dateFormat.yyyymmddhhss);
                    	}
                    	element.html(val);
                    	element.attr('title',val);
                    }
                }, {
                    display: Msg.modules.rc_record.paymentdetails.table.rechargeMoney,
                    name: 'rechargeMoney',
                    width: 0.2,
                    order: true,
                    align: 'center'
                }, {
                    display: Msg.modules.rc_record.paymentdetails.table.remainningSum,
                    name: 'remainningSum',
                    width: 0.2,
                    order: false,
                    align: 'center'

                }, {
                    display: Msg.modules.rc_record.paymentdetails.table.operateUser,
                    name: 'operateUser',
                    width: 0.2,
                    order: true,
                    align: 'center'
                }]
            });
        },
        submit : function(){
        	$('#paymentdetailsTable').GridTableSearch({
                params:paymentdetails.getParms()
            })
        },
		 //初始化 搜索框
        initSearch: function () {
            //初始化 条件操作按钮
            $("#paymentdetailsBar").ValidateForm('paymentdetails_bar', {
                show: 'horizontal',
                fnSubmit: paymentdetails.submit,
                model: [[{
                    input: 'input',
                    type: 'text',
                    show: Msg.modules.rc_record.paymentdetails.cardNumber,
                    name: 'card_number',
                    width: '165',
                    extend: {
                        id: 'card_number_search'
                    }
                },{
					input : 'input',
					type : 'text',
					show :Msg.modules.rc_record.paymentdetails.btime,
					name : 'time',
					width : '185',
					extend : {
						id : 'btime',class: 'wdateIcon', readonly: 'readonly'
                        
					},
					fnClick:paymentdetails.bindbtimeClick
				},
				{
					input : 'input',
					type : 'text',
					show : Msg.modules.rc_record.paymentdetails.etime,
					name : 'time',
					width : '185',
					extend : {
						id : 'etime',class: 'wdateIcon', readonly: 'readonly'
					},
					fnClick:paymentdetails.bindetimeClick
				}]],
                extraButtons: [{
                    input: 'button',
                    align: 'right',
                    show: Msg.exportF,
                    name: '',
                    fnClick: paymentdetails.exportData,
                    extend: {
                        id: 'export_pay_details',
                        class: 'btn btn-export'
                    }
                }]
            });
            $('#paymentdetailsBar').find('#export_pay_details').parents('.clsRow').css({
                float: 'right'
            });
        },
        exportData : function(){
        	var ids = paymentdetails.getSelectIds();
        	var parm = curParm || {};
        	var p = {};
        	p.tableNames = tableName;
        	p.fileName = Msg.modules.rc_record.paymentdetails.exportFileName;
        	p.qp = parm;
        	p.timeFormat = Msg.dateFormat.yyyymmddhhss;
        	if(ids && ids.length>0){
        		App.confirm({type: "confirm", message: Msg.modules.rc_record.paymentdetails.exportTs}, function () {
        			!parm.queryParms && (parm.queryParms = {});
        			parm.queryParms.ids = ids;
        			paymentdetails.exportOp(p);
                },function(){
                	paymentdetails.exportOp(p);
                });
        	}else{
        		main.comonErrorFun(Msg.modules.rc_record.paymentdetails.exportAll,function(){
        			paymentdetails.exportOp(p);
        		});
        	}
        },
        exportOp : function(p){
        	$('#paymentdetails_div').find('#paymentdetails_param').val(JSON.stringify(p));
			$('#paymentdetails_div').find('#paymentdetails_exort_form').submit();
        },
        getSelectIds: function () {
             var arr = [];
             var selects = $('#paymentdetailsTable').GridTableSelectedRecords();
             if (selects && selects.length > 0) {
                 $.each(selects, function (t, e) {
                     arr.push(e.id);
                 });
             }
             return arr;
        },
        bindbtimeClick : function(){
        	window.DatePicker({
                dateFmt: Msg.dateFormat.yyyymmddhhss,
                isShowClear: true,
                maxDate:$('#etime').val()
            });
        },
        bindetimeClick : function(){
        	window.DatePicker({
                dateFmt: Msg.dateFormat.yyyymmddhhss,
                isShowClear: true,
                maxDate:new Date()
            });
        },
	};
	return paymentdetails;
});