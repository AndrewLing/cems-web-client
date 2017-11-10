'use strict';
App.Module.config({
    package: '/main',
    moduleName: 'sm_log',
    description: '模块功能：日志管理',
    importList: ['jquery', 'bootstrap', 'easyTabs','ValidateForm', 'datePicker', 'GridTable']
});
App.Module('sm_log', function () {
    return {
        Render: function (params) {
            var _this = this;
            $(function () {
               var $switch = $('#logTabDiv');
                _this.loadView($switch);

            });
        },

        /**
         * 加载视图
         * @param context
         */
        loadView:function(context){
            context.easyTabs({
//
                tabIds: ['secutityLog','systemLog','operateLog'],
                tabSpace: 50,
                tabNames: ['安全日志','系统日志','操作日志'],
//                permissions:['station_kpi','station_map'],
                urls: ['/modules/sm_log/secutityLog.html', '/modules/sm_log/systemLog.html','/modules/sm_log/operateLog.html'],
                scripts: [['modules/sm_log/secutityLog'], ['modules/sm_log/systemLog'],['modules/sm_log/operateLog']],
                cb: function () { }
            });
        }

    };
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJtb2R1bGVzL3NtX2xvZy9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XHJcbkFwcC5Nb2R1bGUuY29uZmlnKHtcclxuICAgIHBhY2thZ2U6ICcvbWFpbicsXHJcbiAgICBtb2R1bGVOYW1lOiAnc21fbG9nJyxcclxuICAgIGRlc2NyaXB0aW9uOiAn5qih5Z2X5Yqf6IO977ya5pel5b+X566h55CGJyxcclxuICAgIGltcG9ydExpc3Q6IFsnanF1ZXJ5JywgJ2Jvb3RzdHJhcCcsICdlYXN5VGFicycsJ1ZhbGlkYXRlRm9ybScsICdkYXRlUGlja2VyJywgJ0dyaWRUYWJsZSddXHJcbn0pO1xyXG5BcHAuTW9kdWxlKCdzbV9sb2cnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIFJlbmRlcjogZnVuY3Rpb24gKHBhcmFtcykge1xyXG4gICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgICAgICAgICAkKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgdmFyICRzd2l0Y2ggPSAkKCcjbG9nVGFiRGl2Jyk7XHJcbiAgICAgICAgICAgICAgICBfdGhpcy5sb2FkVmlldygkc3dpdGNoKTtcclxuXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOWKoOi9veinhuWbvlxyXG4gICAgICAgICAqIEBwYXJhbSBjb250ZXh0XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgbG9hZFZpZXc6ZnVuY3Rpb24oY29udGV4dCl7XHJcbiAgICAgICAgICAgIGNvbnRleHQuZWFzeVRhYnMoe1xyXG4vL1xyXG4gICAgICAgICAgICAgICAgdGFiSWRzOiBbJ3NlY3V0aXR5TG9nJywnc3lzdGVtTG9nJywnb3BlcmF0ZUxvZyddLFxyXG4gICAgICAgICAgICAgICAgdGFiU3BhY2U6IDUwLFxyXG4gICAgICAgICAgICAgICAgdGFiTmFtZXM6IFsn5a6J5YWo5pel5b+XJywn57O757uf5pel5b+XJywn5pON5L2c5pel5b+XJ10sXHJcbi8vICAgICAgICAgICAgICAgIHBlcm1pc3Npb25zOlsnc3RhdGlvbl9rcGknLCdzdGF0aW9uX21hcCddLFxyXG4gICAgICAgICAgICAgICAgdXJsczogWycvbW9kdWxlcy9zbV9sb2cvc2VjdXRpdHlMb2cuaHRtbCcsICcvbW9kdWxlcy9zbV9sb2cvc3lzdGVtTG9nLmh0bWwnLCcvbW9kdWxlcy9zbV9sb2cvb3BlcmF0ZUxvZy5odG1sJ10sXHJcbiAgICAgICAgICAgICAgICBzY3JpcHRzOiBbWydtb2R1bGVzL3NtX2xvZy9zZWN1dGl0eUxvZyddLCBbJ21vZHVsZXMvc21fbG9nL3N5c3RlbUxvZyddLFsnbW9kdWxlcy9zbV9sb2cvb3BlcmF0ZUxvZyddXSxcclxuICAgICAgICAgICAgICAgIGNiOiBmdW5jdGlvbiAoKSB7IH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH07XHJcbn0pOyJdLCJmaWxlIjoibW9kdWxlcy9zbV9sb2cvaW5kZXguanMifQ==
