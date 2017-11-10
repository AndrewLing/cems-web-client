module.exports = {
    login: {"success":true,"data":{"areaid":0,"cerurl":"","createDate":0,"createTime":0,"createUser":"system","createUserid":0,"depid":"","description":"admin","distributor":"","domainid":1,"expireTime":0,"fixTime":0,"invterSerialnum":"","latitude":0.0,"loginName":"admin","longitude":0.0,"mail":"","modifyuserid":0,"password":"","pwdExpireTime":0,"qq":"","salt":"","sex":"1","status":"ACTIVE","tel":"44444444444","type":"SYSTEM","updateDate":0,"updateUser":"","userAddr":"","userAvatar":"","userCountry":"","userName":"admin","userType":"","usercomment":"","userid":1,"userregistesite":"LOCAL"},"failCode":0,"params":null,"message":null},
    ssoLogin: function(params){
        var resultData={};//最终返回结果
        var defaultData={
            "success": true,
            "data": {
                "list": [
                    {
                        "createDate": 0,
                        "createUser": "system",
                        "updateDate": 0,
                        "updateUser": null,
                        "id": 1180,
                        "domainId": 2000,
                        "modelVersionCode": "40",
                        "alarmId": 65534,
                        "causeId": 1,
                        "severityId": 3,
                        "alarmName": "AGC/AVC通信中断",
                        "alarmSubName": "sub_name",
                        "metroUnit": "V",
                        "sigAddress": 65534,
                        "bitIndex": 1,
                        "alarmCause": "1、AGC/AVC网络通信中断",
                        "repairSuggestion": "1、请检查AGC/AVC通信线路是否断开",
                        "alarmType": 1,
                        "isSubscribed": false,
                        "mailAddr": "lihui@pinnettech.cn",
                        "updateUserId": null,
                        "devTypeId": 1
                    },
                    {
                        "createDate": 0,
                        "createUser": "system",
                        "updateDate": 0,
                        "updateUser": null,
                        "id": 1181,
                        "domainId": 2000,
                        "modelVersionCode": "40",
                        "alarmId": 65533,
                        "causeId": 1,
                        "severityId": 1,
                        "alarmName": "AGC/AVC调节失败",
                        "alarmSubName": "sub_name",
                        "metroUnit": "V",
                        "sigAddress": 65533,
                        "bitIndex": 1,
                        "alarmCause": "1、设备未准备完成",
                        "repairSuggestion": "1、请检查设备是否准备完成",
                        "alarmType": 1,
                        "isSubscribed": false,
                        "mailAddr": "lihui@pinnettech.cn",
                        "updateUserId": null,
                        "devTypeId": 2
                    },
                    {
                        "createDate": 0,
                        "createUser": "system",
                        "updateDate": 0,
                        "updateUser": null,
                        "id": 1182,
                        "domainId": 2000,
                        "modelVersionCode": "40",
                        "alarmId": 65533,
                        "causeId": 2,
                        "severityId": 1,
                        "alarmName": "AGC/AVC调节失败",
                        "alarmSubName": "sub_name",
                        "metroUnit": "V",
                        "sigAddress": 65533,
                        "bitIndex": 1,
                        "alarmCause": "1、AGC功能未投入",
                        "repairSuggestion": "1、请检查AGC功能是否投入",
                        "alarmType": 1,
                        "isSubscribed": false,
                        "mailAddr": "lihui@pinnettech.cn",
                        "updateUserId": null,
                        "devTypeId": 3
                    },
                    {
                        "createDate": 0,
                        "createUser": "system",
                        "updateDate": 0,
                        "updateUser": null,
                        "id": 1183,
                        "domainId": 2000,
                        "modelVersionCode": "40",
                        "alarmId": 65533,
                        "causeId": 3,
                        "severityId": 1,
                        "alarmName": "AGC/AVC调节失败",
                        "alarmSubName": "sub_name",
                        "metroUnit": "V",
                        "sigAddress": 65533,
                        "bitIndex": 1,
                        "alarmCause": "1、AVC功能未投入",
                        "repairSuggestion": "1、请检查AVC功能是否投入",
                        "alarmType": 1,
                        "isSubscribed": false,
                        "mailAddr": "lihui@pinnettech.cn",
                        "updateUserId": null,
                        "devTypeId": 4
                    },
                    {
                        "createDate": 0,
                        "createUser": "system",
                        "updateDate": 0,
                        "updateUser": null,
                        "id": 1184,
                        "domainId": 2000,
                        "modelVersionCode": "40",
                        "alarmId": 65533,
                        "causeId": 4,
                        "severityId": 1,
                        "alarmName": "AGC/AVC调节失败",
                        "alarmSubName": "sub_name",
                        "metroUnit": "V",
                        "sigAddress": 65533,
                        "bitIndex": 1,
                        "alarmCause": "1、AGC本端调节功能未打开",
                        "repairSuggestion": "1、请检查AGC本端调节功能是否打开",
                        "alarmType": 1,
                        "isSubscribed": false,
                        "mailAddr": "lihui@pinnettech.cn",
                        "updateUserId": null,
                        "devTypeId": 5
                    },
                    {
                        "createDate": 0,
                        "createUser": "system",
                        "updateDate": 0,
                        "updateUser": null,
                        "id": 1185,
                        "domainId": 2000,
                        "modelVersionCode": "40",
                        "alarmId": 65533,
                        "causeId": 5,
                        "severityId": 1,
                        "alarmName": "AGC/AVC调节失败",
                        "alarmSubName": "sub_name",
                        "metroUnit": "V",
                        "sigAddress": 65533,
                        "bitIndex": 1,
                        "alarmCause": "1、AVC本端调节功能未打开",
                        "repairSuggestion": "1、请检查AVC本端调节功能是否打开",
                        "alarmType": 1,
                        "isSubscribed": false,
                        "mailAddr": "lihui@pinnettech.cn",
                        "updateUserId": null,
                        "devTypeId": 6
                    },
                    {
                        "createDate": 0,
                        "createUser": "system",
                        "updateDate": 0,
                        "updateUser": null,
                        "id": 1186,
                        "domainId": 2000,
                        "modelVersionCode": "40",
                        "alarmId": 65533,
                        "causeId": 6,
                        "severityId": 1,
                        "alarmName": "AGC/AVC调节失败",
                        "alarmSubName": "sub_name",
                        "metroUnit": "V",
                        "sigAddress": 65533,
                        "bitIndex": 1,
                        "alarmCause": "1、AGC远端调节功能未打开",
                        "repairSuggestion": "1、请检查AGC远端调节功能是否打开",
                        "alarmType": 1,
                        "isSubscribed": false,
                        "mailAddr": "lihui@pinnettech.cn",
                        "updateUserId": null,
                        "devTypeId": 7
                    },
                    {
                        "createDate": 0,
                        "createUser": "system",
                        "updateDate": 0,
                        "updateUser": null,
                        "id": 1187,
                        "domainId": 2000,
                        "modelVersionCode": "40",
                        "alarmId": 65533,
                        "causeId": 7,
                        "severityId": 1,
                        "alarmName": "AGC/AVC调节失败",
                        "alarmSubName": "sub_name",
                        "metroUnit": "V",
                        "sigAddress": 65533,
                        "bitIndex": 1,
                        "alarmCause": "1、AVC远端调节功能未打开",
                        "repairSuggestion": "1、请检查AVC远端调节功能是否打开",
                        "alarmType": 1,
                        "isSubscribed": false,
                        "mailAddr": "lihui@pinnettech.cn",
                        "updateUserId": null,
                        "devTypeId": 8
                    },
                    {
                        "createDate": 0,
                        "createUser": "system",
                        "updateDate": 0,
                        "updateUser": null,
                        "id": 1188,
                        "domainId": 2000,
                        "modelVersionCode": "40",
                        "alarmId": 65533,
                        "causeId": 8,
                        "severityId": 1,
                        "alarmName": "AGC/AVC调节失败",
                        "alarmSubName": "sub_name",
                        "metroUnit": "V",
                        "sigAddress": 65533,
                        "bitIndex": 1,
                        "alarmCause": "1、AGC调节无可调节子阵",
                        "repairSuggestion": "1、请检查是否存在可调节的子阵",
                        "alarmType": 1,
                        "isSubscribed": false,
                        "mailAddr": "lihui@pinnettech.cn",
                        "updateUserId": null,
                        "devTypeId": 9
                    },
                    {
                        "createDate": 0,
                        "createUser": "system",
                        "updateDate": 0,
                        "updateUser": null,
                        "id": 1189,
                        "domainId": 2000,
                        "modelVersionCode": "40",
                        "alarmId": 65533,
                        "causeId": 9,
                        "severityId": 1,
                        "alarmName": "AGC/AVC调节失败",
                        "alarmSubName": "sub_name",
                        "metroUnit": "V",
                        "sigAddress": 65533,
                        "bitIndex": 1,
                        "alarmCause": "1、AVC调节无可调节子阵",
                        "repairSuggestion": "1、请检查是否存在可调节的子阵",
                        "alarmType": 1,
                        "isSubscribed": false,
                        "mailAddr": "lihui@pinnettech.cn",
                        "updateUserId": null,
                        "devTypeId": 10
                    }
                ],
                "total": 2247,
                "pageNo": 1,
                "pageSize": 10,
                "pageCount": 0
            },
            "failCode": 0,
            "params": null
        };
        if(!params.body){
            return defaultData
        }
        var mockBody = JSON.parse(params.body);
        mockBody.loginName && mockBody.password; //有传递参数
        if(mockBody.loginName == "admin" && mockBody.password == "21232f297a57a5a743894a0e4a801fc3") defaultFunc("admin");
        function defaultFunc(param){
            switch (param){
                case "admin":
                    resultData = defaultData;
                    break;
                default:
                    resultData = errorData;
            }
        }
        return resultData;
    },
    queryUsers: {"success":true,"data":{"list":[
        {"createDate":0,"createUser":"system","updateDate":0,"updateUser":null,"userid":12357,"domainid":1,"areaid":null,"type":"NORMAL","status":"ACTIVE","description":"","loginName":"aaa2016","password":"c7e8912ee8db5e4d","qq":"1916248796","mail":"1916248796@qq.com","tel":"13758862146","sex":null,"userName":"aaa","userAddr":null,"userCountry":null,"userAvatar":null,"invterSerialnum":null,"distributor":null,"depid":null,"createTime":1487295607333,"fixTime":null,"expireTime":null,"pwdExpireTime":null,"userregistesite":"LOCAL","createUserid":1,"modifyuserid":null,"salt":"0d15fb31b0e9e30b7ae340571c6862b5bada54432af46e45","usercomment":null,"cerurl":null,"userType":null,"longitude":null,"latitude":null,"loginStatus":null},
        {"createDate":0,"createUser":"system","updateDate":0,"updateUser":null,"userid":12356,"domainid":1,"areaid":null,"type":"NORMAL","status":"ACTIVE","description":"","loginName":"fei","password":"21232f297a57a5a743894a0e4a801fc3","qq":"","mail":"fei@qq.com","tel":"13556562212","sex":"1","userName":"feitingbo","userAddr":null,"userCountry":null,"userAvatar":null,"invterSerialnum":null,"distributor":null,"depid":null,"createTime":1487212221392,"fixTime":null,"expireTime":null,"pwdExpireTime":null,"userregistesite":"LOCAL","createUserid":1,"modifyuserid":null,"salt":null,"usercomment":null,"cerurl":null,"userType":null,"longitude":null,"latitude":null,"loginStatus":null},
        {"createDate":0,"createUser":"system","updateDate":0,"updateUser":null,"userid":12347,"domainid":1,"areaid":null,"type":"NORMAL","status":"ACTIVE","description":"","loginName":"hebiao","password":"96d4407292a40f2cae3418ecb60278db","qq":"","mail":"","tel":"13678170364","sex":"1","userName":"hebiao","userAddr":null,"userCountry":null,"userAvatar":null,"invterSerialnum":null,"distributor":null,"depid":null,"createTime":1487040670677,"fixTime":null,"expireTime":null,"pwdExpireTime":null,"userregistesite":"LOCAL","createUserid":1,"modifyuserid":null,"salt":"6d70383ed61acef29808cd9e1cd50291b310641f3efbc20d","usercomment":null,"cerurl":null,"userType":null,"longitude":null,"latitude":null,"loginStatus":null},
        {"createDate":0,"createUser":"system","updateDate":0,"updateUser":null,"userid":12346,"domainid":1,"areaid":null,"type":"NORMAL","status":"ACTIVE","description":"","loginName":"yangjie","password":"208e6637151b81bc","qq":"","mail":"","tel":"11111111111","sex":"1","userName":"a","userAddr":null,"userCountry":null,"userAvatar":null,"invterSerialnum":null,"distributor":null,"depid":null,"createTime":1487038129086,"fixTime":null,"expireTime":null,"pwdExpireTime":null,"userregistesite":"LOCAL","createUserid":1,"modifyuserid":null,"salt":"895d73d39e98ec25bc5deafec1ab2ae3bc9879e901670b8c","usercomment":null,"cerurl":null,"userType":null,"longitude":null,"latitude":null,"loginStatus":null},
        {"createDate":0,"createUser":"system","updateDate":0,"updateUser":null,"userid":12345,"domainid":1,"areaid":null,"type":"NORMAL","status":"ACTIVE","description":"james","loginName":"jdj","password":"098f6bcd4621d373cade4e832627b4f6","qq":"","mail":"","tel":"","sex":"1","userName":"james","userAddr":"","userCountry":"","userAvatar":"","invterSerialnum":"","distributor":null,"depid":"","createTime":null,"fixTime":null,"expireTime":null,"pwdExpireTime":null,"userregistesite":"LOCAL","createUserid":null,"modifyuserid":null,"salt":"","usercomment":"","cerurl":"","userType":"","longitude":null,"latitude":null,"loginStatus":null}
    ],"total":5,"pageNo":1,"pageSize":20,"pageCount":0},"failCode":0,"params":null},
    loginOut: {
        "success": true,
        "data": null,
        "failCode": 0,
        "params": null,
        "message": null
    },
    getStationAndfiveUser: {
        "success":true,"data":{
            "stationInfo":{"createDate":0,"createUser":"system","updateDate":0,"updateUser":null,"stationCode":"7D1150363C2A44FD8203CD5C93B36227","id":2,"stationName":"成都大电站","capacity":1234455.0,"angulation":null,"assemblyLayout":null,"area":null,"meanAltitude":null,"devoteDate":1493740800000,"expectRunningPeriod":null,"inverterType":null,"combineType":"3","stationType":null,"longitude":104.1,"latitude":30.45,"safeBeginDate":null,"stationPic":"false","stationAddr":"","aidType":1,"areaCode":null,"domainId":3,"operationType":null,"buildState":"3","timeZone":8,"kksCode":null,"namePhonetic":"cheng>dou>da>dian>zhan","stationBriefing":"","stationLinkman":"","linkmanPho":"","dbShardingId":0,"tableShardingId":"0_0","secDomainId":2,"shareDevName":null,"shareStatioName":null,"useDefaultPrice":1,"shareName":""},
            "fiveUsers":[
                {"userid":2,"domainid":2,"loginName":"fei","userAvatar":null,"userName":"fei","longitude":116.397262,"latitude":39.906743,"tel":"12345678977","instance":8161497.9,"userLevel":1,"todoTaskNum":3}
            ],
            "domainLine":[
                {"id":1,"domainName":"托管域"},
                {"id":2,"domainName":"四川"}
            ],
            "stationHealthState": {"7D1150363C2A44FD8203CD5C93B36227": 1}
        },"failCode":0,"params":null,"message":null
    },
    getOnlineAppUsersByDomain: {
        "success":true,"data":{"list":[
            {"userid":2,"domainid":2,"loginName":"fei","userAvatar":null,"userName":"fei","longitude":116.397262,"latitude":39.906743,"tel":"12345678977","instance":8161497.9,"userLevel":1,"todoTaskNum":0},
            {"userid":3,"domainid":2,"loginName":"asdfas","userAvatar":null,"userName":"asdf","longitude":116.397262,"latitude":38.906743,"tel":"12345678977","instance":816100.43,"userLevel":2,"todoTaskNum":0}
        ],"total":1,"pageNo":1,"pageSize":10,"pageCount":1},"failCode":0,"params":null
    },
    getOnlineUserIncludeInstance: {"success":true,"data":{"userid":2,"domainid":2,"loginName":"fei","userAvatar":"9f3e76d8-b267-43fa-8ce1-996fa8b72e32","userName":"fei","longitude":null,"latitude":null,"tel":"12345678977","instance":"68258.236","userLevel":"3","todoTaskNum":1},"failCode":0,"params":null,"message":null},
    isDefectFlowNodeUser: {"success":true,"data":null,"failCode":0,"params":null,"message":null},
    queryUserByid: function (params) {
        var defaultData = {"success":true,"data":{"createDate":0,"createUser":"system","updateDate":0,"updateUser":null,"userid":1,"domainid":1,"areaid":null,"type":"SYSTEM","status":"ACTIVE","description":"admin","loginName":"admin","password":"21232f297a57a5a743894a0e4a801fc3","qq":null,"mail":null,"tel":null,"sex":"1","userName":"admin","userAddr":null,"userCountry":null,"userAvatar":"3e259bed-27c5-4f23-bb48-aac24c506bd8","invterSerialnum":null,"distributor":null,"depid":null,"createTime":null,"fixTime":null,"expireTime":null,"pwdExpireTime":null,"userregistesite":"LOCAL","createUserid":null,"modifyuserid":null,"salt":null,"usercomment":null,"cerurl":null,"userType":null,"longitude":null,"latitude":null,"loginStatus":null},"failCode":0,"params":null,"message":null};
        return defaultData
    }
};