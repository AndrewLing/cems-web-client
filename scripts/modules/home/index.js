'use strict';
App.Module.config({
    package: '/main',
    moduleName: 'home',
    description: '模块功能：首页',
    importList: ['jquery', 'bootstrap', 'easyTabs']
});
App.Module('home', function () {
    return {
        Render: function (params) {
        	main.setHomeBackColor();
            var _this = this;
            $(function () {
                var $switch = $('#home');
                _this.loadView($switch);
            });
            
        },
        /**
         * 加载视图
         */
        loadView: function (context) {
            context.easyTabs({
                tabIds: ['mapButton', 'kpiButton'],
                tabSpace: 6,
                tabNames: Msg.modules.home.switchViews,
//                permissions:['station_kpi','station_map'],
                urls: ['/modules/home/kpiView.html', '/modules/home/mapView.html'],
                scripts: [['modules/home/kpiView'], ['modules/home/mapView']],
                cb: function () {
                }
            });
        }
    };
});