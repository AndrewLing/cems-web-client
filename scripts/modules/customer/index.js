'use strict';
App.Module.config({
    package: '/main',
    moduleName: 'customer',
    description: '模块功能：用户管理',
    importList: ['jquery', 'bootstrap','datePicker', 'GridTable','ValidateForm']
});
App.Module('customer', function () {
    var customer = {
        Render: function (params) {
        	//设置背景色
            main.setBackColor();
            
            customer.initSearch();
            
            customer.findCuctomer();
        },
        submit : function(){
        	 $('#customerTable').GridTableSearch({
 				params : {
 					queryParms:{
 						"name" : $('#customer_name_search').val() || ""
 					}
 				}
 			 });
        },
        initSearch : function(){
        	 $("#customerBar").ValidateForm('customer_bar', {
     			show : 'horizontal',
     			fnSubmit : customer.submit,
     			model : [ [ {
     				input : 'input',
     				type : 'text',
     				show : Msg.modules.customer.table.name,
     				name : 'name',
     				width : '165',
     				extend : {
     					id : 'customer_name_search'
     				}
     			} ] ]
     		});
        },
        findCuctomer : function(){
     	   var name = $('#customer_name_search').val() || "";
            //加载表格
            $('#customerTable').GridTable({
                url: 'sso/app/fdcustomer',
                title: false,
                max_height: 540,
                rp: 10,
                params:{ queryParms:{
						"name" : $('#customer_name_search').val() || ""
					}},
                clickSelect: false,
                isShowSelect:false,
                idProperty: 'id',
                colModel: [{
                    display: Msg.modules.customer.table.name,
                    name: "name",
                    width: 0.2
                }, {
                    display: Msg.modules.customer.table.tel,
                    name: "tel",
                    width: 0.2
                }, {
                    display: Msg.modules.customer.table.sex,
                    name: "sex",
                    fnInit: function (div, data) {
                 	    var msg = Msg.modules.customer.table.boy;
                        if (data == 2) {
                     	   msg = Msg.modules.customer.table.girl;
                        } 
                        div.parent().attr('title',msg);
                        div.html(msg);
                    },
                    width: 0.2
                }, {
                    display: Msg.modules.customer.table.birthday,
                    name: "birthday",
                    width: 0.2,
                    fnInit:function(div, data,record){
                    	if(data){
                    		data = new Date(data).format('yyyy-MM-dd')
                    	}
                    	 div.parent().attr('title',data);
                         div.html(data);
                    }
                }, {
                    display: Msg.modules.customer.table.balance,
                    name: "cbalance",
                    order: true,
                    width: 0.2
                }]
            });
        }
    }
    return customer;
});