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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJtb2R1bGVzL2hvbWUvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xyXG5BcHAuTW9kdWxlLmNvbmZpZyh7XHJcbiAgICBwYWNrYWdlOiAnL21haW4nLFxyXG4gICAgbW9kdWxlTmFtZTogJ2hvbWUnLFxyXG4gICAgZGVzY3JpcHRpb246ICfmqKHlnZflip/og73vvJrpppbpobUnLFxyXG4gICAgaW1wb3J0TGlzdDogWydqcXVlcnknLCAnYm9vdHN0cmFwJywgJ2Vhc3lUYWJzJ11cclxufSk7XHJcbkFwcC5Nb2R1bGUoJ2hvbWUnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIFJlbmRlcjogZnVuY3Rpb24gKHBhcmFtcykge1xyXG4gICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgICAgICAgICAkKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHZhciAkc3dpdGNoID0gJCgnI2hvbWUnKTtcclxuICAgICAgICAgICAgICAgIF90aGlzLmxvYWRWaWV3KCRzd2l0Y2gpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOWKoOi9veinhuWbvlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGxvYWRWaWV3OiBmdW5jdGlvbiAoY29udGV4dCkge1xyXG4gICAgICAgICAgICBjb250ZXh0LmVhc3lUYWJzKHtcclxuICAgICAgICAgICAgICAgIHRhYklkczogWydtYXBCdXR0b24nLCAna3BpQnV0dG9uJ10sXHJcbiAgICAgICAgICAgICAgICB0YWJTcGFjZTogNixcclxuICAgICAgICAgICAgICAgIHRhYk5hbWVzOiBNc2cubW9kdWxlcy5ob21lLnN3aXRjaFZpZXdzLFxyXG4vLyAgICAgICAgICAgICAgICBwZXJtaXNzaW9uczpbJ3N0YXRpb25fa3BpJywnc3RhdGlvbl9tYXAnXSxcclxuICAgICAgICAgICAgICAgIHVybHM6IFsnL21vZHVsZXMvaG9tZS9rcGlWaWV3Lmh0bWwnLCAnL21vZHVsZXMvaG9tZS9tYXBWaWV3Lmh0bWwnXSxcclxuICAgICAgICAgICAgICAgIHNjcmlwdHM6IFtbJ21vZHVsZXMvaG9tZS9rcGlWaWV3J10sIFsnbW9kdWxlcy9ob21lL21hcFZpZXcnXV0sXHJcbiAgICAgICAgICAgICAgICBjYjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59KTsiXSwiZmlsZSI6Im1vZHVsZXMvaG9tZS9pbmRleC5qcyJ9
