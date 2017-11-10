App.Module.config({
    package: '/rc_order',
    moduleName: 'rc_order_view',
    description: '模块功能：查看订单',
    importList: ['jquery', 'bootstrap']
});
App.Module('rc_order_view', function () {
    var data = null;//查看时的data
    var viewOrder = {
        Render: function (data) {
        	 main.setBackColor();
             var items = data.data.orderItems;//订单详情数据
             if(!items || items.length ==0){
                 $('#detailData').hide();
                 $('div .operate_button').hide();
                 $('#rcOrderView').html('无数据。。');
             }

             if(items !=null) {
            	 items.sort (viewOrder.compare('chargeStartTime'));
             }
             if (!items || items.length <= 1) {
                 viewOrder.hideArrow();
             } else {           
                 viewOrder.init(1);
                 viewOrder.PageEvent(items, 1);
             }
              viewOrder.initfirstData(items);
              viewOrder.clickEvent(items);
        },
        /**
         * 隐藏
         */
        hideArrow: function () {
            $('#leftArrow').remove();
            $('#rightArrow').remove();
        },
        /**
         * 初始化第一段数据
         */
        initfirstData: function (data) {
            if (data && data.length>0) {
                var order = data[0];
                $('#detail_orderId').html(order.orderNumber);
                $('#detail_charge_stime').html(Date.parse(order.chargeStartTime).format('yyyy-MM-dd hh:mm:ss').replace(/-/g, '-'));
                $('#detail_charge_etime').html(Date.parse(order.chargeEndTime).format('yyyy-MM-dd hh:mm:ss').replace(/-/g, '-'));
                $('#detail_charge_power').html(order.chargePower + Msg.unit.KW);
                $('#detail_charge_sinPri').html(order.chargePowerUnitMoney + Msg.unit.RMBUnit);
                $('#detail_charge_money').html(order.chargePowerMoney + Msg.unit.RMBUnit);
                $('#detail_service_sinPri').html(order.chargeServiceUnitMoney + Msg.unit.RMBUnit);
                $('#detail_service_money').html(order.chargeServiceMoney + Msg.unit.RMBUnit);
            }
        },
        clickEvent: function (data) {
            if(data)
            {
            	 var total = data.length;//总条数
                 $('#leftArrow').off('click').on('click', function () {
                     var currentIndex = parseInt($('#detailData').attr('page_index'));
                     viewOrder.PageEvent(total, currentIndex, 'left', data);
                 });

                 $('#rightArrow').off('click').on('click', function () {
                     var currentIndex = parseInt($('#detailData').attr('page_index'));
                     viewOrder.PageEvent(total, currentIndex, 'right', data);
                 });	
            }
            $('#view_order_confirm').off('click').on('click', function () {
                $('#order_detail_moudle').modal('hide');
            });
        },

        init: function (currentIndex) {
            if (currentIndex == 1) {
                $('#leftArrow').hide();
            }
        },

        /**
         * 翻页事件
         */

        PageEvent: function (total, currentIndxe, to, data) {
            var index;
            if (to == 'left' && currentIndxe - 1 == 0) {
                $('#leftArrow').hide();
            }
            if (to == 'right' && currentIndxe + 1 == total) {
                $('#rightArrow').hide();
            }
            var order;
            if (to == 'left') {
                order = data[currentIndxe - 1 - 1];
                index = currentIndxe - 1;
            }
            else if (to == 'right') {
                order = data[currentIndxe + 1 - 1];
                index = currentIndxe + 1;
            }
            if (data) {
                $('#detailData').attr('page_index', index);
                viewOrder.render(order)
                if (index != 1) {
                    $('#leftArrow').show();
                }
                else if (index == 1) {
                    $('#leftArrow').hide();
                }
                if (index != total) {
                    $('#rightArrow').show();
                }
            }
        },
        render: function (data) {
            $('#detailData').hide();
            $('#detailData').fadeIn('slow');
            var arr = [];
            arr.push(data);
            viewOrder.initfirstData(arr);
        },
        compare: function (propertyName) {
            return function(object1, object2) {
                var value1 = object1[propertyName];
                var value2 = object2[propertyName];
                if (value2 < value1) {
                    return 1;
                } else if (value2 > value1) {
                    return -1;
                } else {
                    return 0;
                }
            }
        }
        
    };
    return viewOrder;
});