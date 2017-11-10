'use strict';
App.Module.config({
    package: '/main',
    moduleName: 'rc_record',
    description: '模块功能：缴费详情',
    importList: ['jquery', 'bootstrap', 'easyTabs', 'ValidateForm', 'datePicker', 'GridTable']
});
App.Module('rc_record', function() {
    return {
        Render: function(params) {
            main.setBackColor();
            var _this = this;
            $(function() {
                var $switch = $('#rc_record_table_div');
                _this.loadView($switch);
            });
        },
        /**
         * 加载视图
         * @param context
         */
        loadView: function(context) {
            context.easyTabs({
                tabIds: ['paymentdetails', 'paymentbill'],
                tabSpace: 0,
                useNavbar: true,
                tabNames: Msg.modules.rc_record.switchViews,
                urls: ['/modules/rc_record/paymentdetails.html', '/modules/rc_record/paymentbill.html'],
                scripts: [
                    ['modules/rc_record/paymentdetails'],
                    ['modules/rc_record/paymentbill']
                ],
                cb: function() {}
            });
        }
    };
});