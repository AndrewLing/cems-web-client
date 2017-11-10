'use strict';
App.Module.config({
    package: '/main',
    moduleName: 'sm_log',
    description: '模块功能：日志管理',
    importList: ['jquery', 'bootstrap', 'easyTabs', 'ValidateForm', 'datePicker', 'GridTable']
});
App.Module('sm_log', function() {
    return {
        Render: function(params) {
            main.setBackColor();
            var _this = this;
            $(function() {
                var $switch = $('#logTabDiv');
                _this.loadView($switch);
            });
        },
        /**
         * 加载视图
         * @param context
         */
        loadView: function(context) {
            context.easyTabs({
                tabIds: ['secutityLog', 'systemLog'],
                tabSpace: 0,
                useNavbar: true,
                tabNames: Msg.modules.sm_log.switchViews,
                //              permissions:['station_kpi','station_map'],
                urls: ['/modules/sm_log/secutityLog.html', '/modules/sm_log/systemLog.html', '/modules/sm_log/operateLog.html'],
                scripts: [
                    ['modules/sm_log/secutityLog'],
                    ['modules/sm_log/systemLog'],
                    ['modules/sm_log/operateLog']
                ],
                cb: function() {}
            });
        }
    };
});