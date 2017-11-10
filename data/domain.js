module.exports = {
    getUserDomain:function(params){
        var resultData={};//最终返回结果
        var templateA={"success":true,"data":{"id":1,"domainName":"Msg.&topdomain","description":"","pid":0,"level":1,"type":null,"createuserid":1,"modifyuserid":1,"createTime":null,"modifyTime":null,"longitude":null,"latitude":null,"domainIP":null,"radius":null,"domainFullName":"Msg.&topdomain","domainCenterAddress":null,"domainLogo":null,"safeBeginDate":null,"domianUName":null,"childs":null,"check":null,"currency":"1","supportPoor":"POOR","twoLevelDomain":null,"curlang":null,"domianPath":"_1_","maxUserNum":null,"maxInstallCap":null,"maxDevNum":null},"failCode":0,"params":null,"message":null};
        params && params.body && params.body.userid && defaultFunc(params.body.userid); //有传递参数
        function defaultFunc(param){
            switch (param){
                case 1:
                    resultData = templateA;
                    break;
                default:
                    resultData = errorData;
            }
        }
        return resultData;
    }
};