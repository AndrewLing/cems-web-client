/**
 * 国际化文件 —— module：home
 */
define([], function () {
    return {
        state:{
            normal:'正常运营',
            broken:'故障',
            offline:'离网',
            offlineUpload:'离网数据上传中',
            support:'维护',
            chainBrake:'断连'

        },
        chargeState:{
            expire:'空闲',
            connect:'充电枪已连接，未启动充电',
            starting:'启动中',
            charging:'充电中',
            finish:'充电完成',
            ordered:'已预约',
            waitingcharge:'等待充电中'
        }

    };
});
