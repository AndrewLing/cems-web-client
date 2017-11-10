var Cookies = {};
var sessionId;
var max_size = 3500;

Cookies.set = function (name, value) {
    if (!sessionId) {
        return;
    }
    if (sessionId) {
        name = sessionId + name;
    }
    var argv = arguments;
    var argc = arguments.length;
    var expires = (argc > 2) ? argv[2] : null;
    var path = (argc > 3) ? argv[3] : '/';
    var domain = (argc > 4) ? argv[4] : null;
    var secure = (argc > 5) ? argv[5] : false;
    document.cookie = name + "=" + escape(value)
        + ((expires == null) ? "" : ("; expires=" + expires.toGMTString()))
        + ((path == null) ? "" : ("; path=" + path))
        + ((domain == null) ? "" : ("; domain=" + domain)) + ((secure == true) ? "; secure" : "");
};
Cookies.get = function (name) {
    var value;
    if (sessionId) {
        value = Cookies.getCook(sessionId + name);
    }
    return value || Cookies.getCook(name);
};
Cookies.getCook = function (name) {
    var arg = name + "=";
    var alen = arg.length;
    var clen = document.cookie.length;
    var i = 0;
    var j = 0;
    var value;
    while (i < clen) {
        j = i + alen;
        if (document.cookie.substring(i, j) == arg)
            return Cookies.getCookieVal(j);
        i = document.cookie.indexOf(" ", i) + 1;
        if (i == 0)
            break;
    }
    return null;
};
Cookies.clear = function (name) {
    if (Cookies.get(name)) {
        var expdate = new Date();
        expdate.setTime(expdate.getTime() - (86400 * 1000 * 1));
        Cookies.set(name, "", expdate);
    }
};
Cookies.getCookieVal = function (offset) {
    var endstr = document.cookie.indexOf(";", offset);
    if (endstr == -1) {
        endstr = document.cookie.length;
    }
    return unescape(document.cookie.substring(offset, endstr));
};
/**
 * 设置sessionid
 */
Cookies.setSessionId = function (value) {
    sessionId = value;
};
/**
 * 获取sessionid
 */
Cookies.getSessionId = function () {
    return sessionId;
};
/**
 * 获取Cookie大小
 */
Cookies.getSize = function () {
    return document.cookie.length;
};
/**
 * 是否达到最大
 */
Cookies.isGeMaxSize = function () {
    return Cookies.getSize() > Cookies.getMaxSize();
};
/**
 * 清除一个服务器的Cookie
 */
Cookies.clearOne = function () {
    var matchs = "token";
    var onesessionid;
    var cookiesArr = document.cookie.split('; ');
    for (var i = 0; i < cookiesArr.length; i++) {
        var cookieArr = cookiesArr[i].split('=');
        if (cookieArr && cookieArr.length > 0 && ( (cookieArr[0]).indexOf(matchs) >= 0 || (cookieArr[0]).indexOf("loginType720") >= 0)) {
            if ((cookieArr[0]).indexOf("token710") >= 0) {
                onesessionid = (cookieArr[0]).replace("token710", "");
            } else if ((cookieArr[0]).indexOf("loginType720") >= 0) {
                onesessionid = (cookieArr[0]).replace("loginType720", "");
            } else {
                onesessionid = (cookieArr[0]).replace("token", "");
            }
            if (Cookies.getSessionid() != onesessionid) {
                console.info("clear sessionId:" + onesessionid);
                Cookies.clearByid(onesessionid);
                return;
            }
        }
    }
};
/**
 * 清除Cookie通过 sessionId
 */
Cookies.clearById = function (sessionid) {
    if (!sessionid) {
        return;
    }
    var cookiesArr = document.cookie.split('; ');
    for (var i = 0; i < cookiesArr.length; i++) {
        var cookieArr = cookiesArr[i].split('=');
        if (cookieArr && cookieArr.length > 0 && (cookieArr[0]).indexOf(sessionid) >= 0) {
            var expdate = new Date();
            expdate.setTime(expdate.getTime() - (86400 * 1000 * 1));
            Cookies.setCookByName(cookieArr[0], "", expdate);
        }
    }
};
/**
 * 向Cookie中放入值
 */
Cookies.setCookByName = function (name, value) {
    var argv = arguments;
    var argc = arguments.length;
    var expires = (argc > 2) ? argv[2] : null;
    var path = (argc > 3) ? argv[3] : '/';
    var domain = (argc > 4) ? argv[4] : null;
    var secure = (argc > 5) ? argv[5] : false;
    document.cookie = name + "=" + escape(value)
        + ((expires == null) ? "" : ("; expires=" + expires.toGMTString()))
        + ((path == null) ? "" : ("; path=" + path))
        + ((domain == null) ? "" : ("; domain=" + domain))
        + ((secure == true) ? "; secure" : "");
};
/**
 * 设置sessionid
 */
Cookies.setMaxSize = function (value) {
    max_size = value;
};
/**
 * 获取sessionid
 */
Cookies.getMaxSize = function () {
    return max_size;
};
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL0Nvb2tpZXMuanMiXSwic291cmNlc0NvbnRlbnQiOlsidmFyIENvb2tpZXMgPSB7fTtcclxudmFyIHNlc3Npb25JZDtcclxudmFyIG1heF9zaXplID0gMzUwMDtcclxuXHJcbkNvb2tpZXMuc2V0ID0gZnVuY3Rpb24gKG5hbWUsIHZhbHVlKSB7XHJcbiAgICBpZiAoIXNlc3Npb25JZCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGlmIChzZXNzaW9uSWQpIHtcclxuICAgICAgICBuYW1lID0gc2Vzc2lvbklkICsgbmFtZTtcclxuICAgIH1cclxuICAgIHZhciBhcmd2ID0gYXJndW1lbnRzO1xyXG4gICAgdmFyIGFyZ2MgPSBhcmd1bWVudHMubGVuZ3RoO1xyXG4gICAgdmFyIGV4cGlyZXMgPSAoYXJnYyA+IDIpID8gYXJndlsyXSA6IG51bGw7XHJcbiAgICB2YXIgcGF0aCA9IChhcmdjID4gMykgPyBhcmd2WzNdIDogJy8nO1xyXG4gICAgdmFyIGRvbWFpbiA9IChhcmdjID4gNCkgPyBhcmd2WzRdIDogbnVsbDtcclxuICAgIHZhciBzZWN1cmUgPSAoYXJnYyA+IDUpID8gYXJndls1XSA6IGZhbHNlO1xyXG4gICAgZG9jdW1lbnQuY29va2llID0gbmFtZSArIFwiPVwiICsgZXNjYXBlKHZhbHVlKVxyXG4gICAgICAgICsgKChleHBpcmVzID09IG51bGwpID8gXCJcIiA6IChcIjsgZXhwaXJlcz1cIiArIGV4cGlyZXMudG9HTVRTdHJpbmcoKSkpXHJcbiAgICAgICAgKyAoKHBhdGggPT0gbnVsbCkgPyBcIlwiIDogKFwiOyBwYXRoPVwiICsgcGF0aCkpXHJcbiAgICAgICAgKyAoKGRvbWFpbiA9PSBudWxsKSA/IFwiXCIgOiAoXCI7IGRvbWFpbj1cIiArIGRvbWFpbikpICsgKChzZWN1cmUgPT0gdHJ1ZSkgPyBcIjsgc2VjdXJlXCIgOiBcIlwiKTtcclxufTtcclxuQ29va2llcy5nZXQgPSBmdW5jdGlvbiAobmFtZSkge1xyXG4gICAgdmFyIHZhbHVlO1xyXG4gICAgaWYgKHNlc3Npb25JZCkge1xyXG4gICAgICAgIHZhbHVlID0gQ29va2llcy5nZXRDb29rKHNlc3Npb25JZCArIG5hbWUpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHZhbHVlIHx8IENvb2tpZXMuZ2V0Q29vayhuYW1lKTtcclxufTtcclxuQ29va2llcy5nZXRDb29rID0gZnVuY3Rpb24gKG5hbWUpIHtcclxuICAgIHZhciBhcmcgPSBuYW1lICsgXCI9XCI7XHJcbiAgICB2YXIgYWxlbiA9IGFyZy5sZW5ndGg7XHJcbiAgICB2YXIgY2xlbiA9IGRvY3VtZW50LmNvb2tpZS5sZW5ndGg7XHJcbiAgICB2YXIgaSA9IDA7XHJcbiAgICB2YXIgaiA9IDA7XHJcbiAgICB2YXIgdmFsdWU7XHJcbiAgICB3aGlsZSAoaSA8IGNsZW4pIHtcclxuICAgICAgICBqID0gaSArIGFsZW47XHJcbiAgICAgICAgaWYgKGRvY3VtZW50LmNvb2tpZS5zdWJzdHJpbmcoaSwgaikgPT0gYXJnKVxyXG4gICAgICAgICAgICByZXR1cm4gQ29va2llcy5nZXRDb29raWVWYWwoaik7XHJcbiAgICAgICAgaSA9IGRvY3VtZW50LmNvb2tpZS5pbmRleE9mKFwiIFwiLCBpKSArIDE7XHJcbiAgICAgICAgaWYgKGkgPT0gMClcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbnVsbDtcclxufTtcclxuQ29va2llcy5jbGVhciA9IGZ1bmN0aW9uIChuYW1lKSB7XHJcbiAgICBpZiAoQ29va2llcy5nZXQobmFtZSkpIHtcclxuICAgICAgICB2YXIgZXhwZGF0ZSA9IG5ldyBEYXRlKCk7XHJcbiAgICAgICAgZXhwZGF0ZS5zZXRUaW1lKGV4cGRhdGUuZ2V0VGltZSgpIC0gKDg2NDAwICogMTAwMCAqIDEpKTtcclxuICAgICAgICBDb29raWVzLnNldChuYW1lLCBcIlwiLCBleHBkYXRlKTtcclxuICAgIH1cclxufTtcclxuQ29va2llcy5nZXRDb29raWVWYWwgPSBmdW5jdGlvbiAob2Zmc2V0KSB7XHJcbiAgICB2YXIgZW5kc3RyID0gZG9jdW1lbnQuY29va2llLmluZGV4T2YoXCI7XCIsIG9mZnNldCk7XHJcbiAgICBpZiAoZW5kc3RyID09IC0xKSB7XHJcbiAgICAgICAgZW5kc3RyID0gZG9jdW1lbnQuY29va2llLmxlbmd0aDtcclxuICAgIH1cclxuICAgIHJldHVybiB1bmVzY2FwZShkb2N1bWVudC5jb29raWUuc3Vic3RyaW5nKG9mZnNldCwgZW5kc3RyKSk7XHJcbn07XHJcbi8qKlxyXG4gKiDorr7nva5zZXNzaW9uaWRcclxuICovXHJcbkNvb2tpZXMuc2V0U2Vzc2lvbklkID0gZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICBzZXNzaW9uSWQgPSB2YWx1ZTtcclxufTtcclxuLyoqXHJcbiAqIOiOt+WPlnNlc3Npb25pZFxyXG4gKi9cclxuQ29va2llcy5nZXRTZXNzaW9uSWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gc2Vzc2lvbklkO1xyXG59O1xyXG4vKipcclxuICog6I635Y+WQ29va2ll5aSn5bCPXHJcbiAqL1xyXG5Db29raWVzLmdldFNpemUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gZG9jdW1lbnQuY29va2llLmxlbmd0aDtcclxufTtcclxuLyoqXHJcbiAqIOaYr+WQpui+vuWIsOacgOWkp1xyXG4gKi9cclxuQ29va2llcy5pc0dlTWF4U2l6ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiBDb29raWVzLmdldFNpemUoKSA+IENvb2tpZXMuZ2V0TWF4U2l6ZSgpO1xyXG59O1xyXG4vKipcclxuICog5riF6Zmk5LiA5Liq5pyN5Yqh5Zmo55qEQ29va2llXHJcbiAqL1xyXG5Db29raWVzLmNsZWFyT25lID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIG1hdGNocyA9IFwidG9rZW5cIjtcclxuICAgIHZhciBvbmVzZXNzaW9uaWQ7XHJcbiAgICB2YXIgY29va2llc0FyciA9IGRvY3VtZW50LmNvb2tpZS5zcGxpdCgnOyAnKTtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29va2llc0Fyci5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHZhciBjb29raWVBcnIgPSBjb29raWVzQXJyW2ldLnNwbGl0KCc9Jyk7XHJcbiAgICAgICAgaWYgKGNvb2tpZUFyciAmJiBjb29raWVBcnIubGVuZ3RoID4gMCAmJiAoIChjb29raWVBcnJbMF0pLmluZGV4T2YobWF0Y2hzKSA+PSAwIHx8IChjb29raWVBcnJbMF0pLmluZGV4T2YoXCJsb2dpblR5cGU3MjBcIikgPj0gMCkpIHtcclxuICAgICAgICAgICAgaWYgKChjb29raWVBcnJbMF0pLmluZGV4T2YoXCJ0b2tlbjcxMFwiKSA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBvbmVzZXNzaW9uaWQgPSAoY29va2llQXJyWzBdKS5yZXBsYWNlKFwidG9rZW43MTBcIiwgXCJcIik7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoKGNvb2tpZUFyclswXSkuaW5kZXhPZihcImxvZ2luVHlwZTcyMFwiKSA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBvbmVzZXNzaW9uaWQgPSAoY29va2llQXJyWzBdKS5yZXBsYWNlKFwibG9naW5UeXBlNzIwXCIsIFwiXCIpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgb25lc2Vzc2lvbmlkID0gKGNvb2tpZUFyclswXSkucmVwbGFjZShcInRva2VuXCIsIFwiXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChDb29raWVzLmdldFNlc3Npb25pZCgpICE9IG9uZXNlc3Npb25pZCkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKFwiY2xlYXIgc2Vzc2lvbklkOlwiICsgb25lc2Vzc2lvbmlkKTtcclxuICAgICAgICAgICAgICAgIENvb2tpZXMuY2xlYXJCeWlkKG9uZXNlc3Npb25pZCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcbi8qKlxyXG4gKiDmuIXpmaRDb29raWXpgJrov4cgc2Vzc2lvbklkXHJcbiAqL1xyXG5Db29raWVzLmNsZWFyQnlJZCA9IGZ1bmN0aW9uIChzZXNzaW9uaWQpIHtcclxuICAgIGlmICghc2Vzc2lvbmlkKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgdmFyIGNvb2tpZXNBcnIgPSBkb2N1bWVudC5jb29raWUuc3BsaXQoJzsgJyk7XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvb2tpZXNBcnIubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICB2YXIgY29va2llQXJyID0gY29va2llc0FycltpXS5zcGxpdCgnPScpO1xyXG4gICAgICAgIGlmIChjb29raWVBcnIgJiYgY29va2llQXJyLmxlbmd0aCA+IDAgJiYgKGNvb2tpZUFyclswXSkuaW5kZXhPZihzZXNzaW9uaWQpID49IDApIHtcclxuICAgICAgICAgICAgdmFyIGV4cGRhdGUgPSBuZXcgRGF0ZSgpO1xyXG4gICAgICAgICAgICBleHBkYXRlLnNldFRpbWUoZXhwZGF0ZS5nZXRUaW1lKCkgLSAoODY0MDAgKiAxMDAwICogMSkpO1xyXG4gICAgICAgICAgICBDb29raWVzLnNldENvb2tCeU5hbWUoY29va2llQXJyWzBdLCBcIlwiLCBleHBkYXRlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcbi8qKlxyXG4gKiDlkJFDb29raWXkuK3mlL7lhaXlgLxcclxuICovXHJcbkNvb2tpZXMuc2V0Q29va0J5TmFtZSA9IGZ1bmN0aW9uIChuYW1lLCB2YWx1ZSkge1xyXG4gICAgdmFyIGFyZ3YgPSBhcmd1bWVudHM7XHJcbiAgICB2YXIgYXJnYyA9IGFyZ3VtZW50cy5sZW5ndGg7XHJcbiAgICB2YXIgZXhwaXJlcyA9IChhcmdjID4gMikgPyBhcmd2WzJdIDogbnVsbDtcclxuICAgIHZhciBwYXRoID0gKGFyZ2MgPiAzKSA/IGFyZ3ZbM10gOiAnLyc7XHJcbiAgICB2YXIgZG9tYWluID0gKGFyZ2MgPiA0KSA/IGFyZ3ZbNF0gOiBudWxsO1xyXG4gICAgdmFyIHNlY3VyZSA9IChhcmdjID4gNSkgPyBhcmd2WzVdIDogZmFsc2U7XHJcbiAgICBkb2N1bWVudC5jb29raWUgPSBuYW1lICsgXCI9XCIgKyBlc2NhcGUodmFsdWUpXHJcbiAgICAgICAgKyAoKGV4cGlyZXMgPT0gbnVsbCkgPyBcIlwiIDogKFwiOyBleHBpcmVzPVwiICsgZXhwaXJlcy50b0dNVFN0cmluZygpKSlcclxuICAgICAgICArICgocGF0aCA9PSBudWxsKSA/IFwiXCIgOiAoXCI7IHBhdGg9XCIgKyBwYXRoKSlcclxuICAgICAgICArICgoZG9tYWluID09IG51bGwpID8gXCJcIiA6IChcIjsgZG9tYWluPVwiICsgZG9tYWluKSlcclxuICAgICAgICArICgoc2VjdXJlID09IHRydWUpID8gXCI7IHNlY3VyZVwiIDogXCJcIik7XHJcbn07XHJcbi8qKlxyXG4gKiDorr7nva5zZXNzaW9uaWRcclxuICovXHJcbkNvb2tpZXMuc2V0TWF4U2l6ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xyXG4gICAgbWF4X3NpemUgPSB2YWx1ZTtcclxufTtcclxuLyoqXHJcbiAqIOiOt+WPlnNlc3Npb25pZFxyXG4gKi9cclxuQ29va2llcy5nZXRNYXhTaXplID0gZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIG1heF9zaXplO1xyXG59OyJdLCJmaWxlIjoicGx1Z2lucy9Db29raWVzLmpzIn0=
