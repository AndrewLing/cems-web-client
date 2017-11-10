App.Module.config({
    package: '/dm_realMan',
    moduleName: 'gunInfo',
    description: '模块功能：枪口监控详细数据',
    importList: ['jquery', 'bootstrap']
});
App.Module('gunInfo', function () {
	var initFun;
    var gunInfo = {
        Render: function (params) {
            var gunNumber = params.gunNumber;
            var serialNumber = params.serialNumber;
            initFun = params.initFun;
            if(!$.fn.canUseWebSocket()){
            	var element = $('#gunInfo');
                if (element.length>0) {
                    element.stopTimer();
                    element.everyTimer('30s', 'getChargeDataTimmer', function () {
                        gunInfo.putData(gunNumber,serialNumber);
                    });
                }
        	}
            gunInfo.putData(gunNumber,serialNumber);
        },
        putData: function (gunNumber,serialNumber) {
            var url = '/gunMonitor/getGunStatusData';
            $.http.ajax(url, {
                "gunNumber": gunNumber,
                "serialNumber":serialNumber
            }, function (res) {
                if (res && res.success) {
                    var data = res.data;
                    initFun && $.isFunction(initFun) && initFun(data);
                }
                return;
            }, function () {

            });
        }

    };
    return gunInfo;
});