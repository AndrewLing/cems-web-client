'use strict';
App.Module.config({
    package: '/card',
    moduleName: 'add_card',
    description: '模块功能：充值卡入库',
    importList: ['jquery', 'bootstrap', 'easyTabs', 'ValidateForm', 'GridTable']
});
App.Module('add_card', function () {
    var url = '/card/saveCard';
    var addCard = {
        Render: function (params) {
            //设置背景色
            main.setBackColor();
            var _this = this;
            $(function () {
                _this.initBtn();
            });

        },

        /**
         * 初始化按钮行为
         * @param params
         * @param dmUtil
         */
        initBtn: function () {
            var $P = this.getPage;
            //表单验证
            $P('#add_card_form').validate({
                rules: {
                    cardNumber: {required: true, maxlength: 64, space: true}

                },
                errorPlacement: function (error, element) {
                    var msg = $(error).html();
                    if ($(element)[0].className.indexOf('error') >= 0) {
                        main.tip($(element), null, false);
                    }
                    main.tip($(element), msg.replaceHTMLChar(), true, 'bottom');
                },
                unhighlight: function (e, errorClass) {
                    $(e).removeClass(errorClass);
                    main.tip($(e), null, false);
                }
            });

            //提交页面
            $('#add_card_confirm_btn').click(function () {
                var dF = $P('#add_card_form');
                if (!dF.valid()) {
                    return;
                }

                $.http.ajax(url, {
                    'cardNumber': $('#add_card_cardNumber').val(),
                    'cardStatus': parseInt($('#add_card_cardStatus').val())
                }, function (data) {
                    if (data.success) {
                        App.alert(data.data == null ? Msg.saveSucceed : data.data);
                        $("#rcManTable").GridTableReload();
                        addCard.closeDialog();
                    }
                    else {
                        App.alert(Msg.saveFailed);
                    }
                });
            });
        },
        /**
         * 获取页面元素
         * @param expr
         * @returns {*}
         */
        getPage: function (expr) {
            var page = $("#addCrad");
            return expr ? page.find(expr) : page;
        },
        closeDialog: function () {
            $('#addCard_moudle').modal('hide');
        }

    };
    return addCard;
});