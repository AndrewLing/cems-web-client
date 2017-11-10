/**
 * Created with JetBrains PhpStorm.
 * User: xuheng
 * Date: 12-9-26
 * Time: 下午12:29
 * To change this template use File | Settings | File Templates.
 */

//清空上次查选的痕迹
editor.firstForSR = 0;
editor.currentRangeForSR = null;
//给tab注册切换事件
/**
 * tab点击处理事件
 * @param tabHeads
 * @param tabBodys
 * @param obj
 */
function clickHandler( tabHeads,tabBodys,obj ) {
    //head样式更改
    for ( var k = 0, len = tabHeads.length; k < len; k++ ) {
        tabHeads[k].className = "";
    }
    obj.className = "focus";
    //body显隐
    var tabSrc = obj.getAttribute( "tabSrc" );
    for ( var j = 0, length = tabBodys.length; j < length; j++ ) {
        var body = tabBodys[j],
            id = body.getAttribute( "id" );
        if ( id != tabSrc ) {
            body.style.zIndex = 1;
        } else {
            body.style.zIndex = 200;
        }
    }

}

/**
 * TAB切换
 * @param tabParentId  tab的父节点ID或者对象本身
 */
function switchTab( tabParentId ) {
    var tabElements = $G( tabParentId ).children,
        tabHeads = tabElements[0].children,
        tabBodys = tabElements[1].children;

    for ( var i = 0, length = tabHeads.length; i < length; i++ ) {
        var head = tabHeads[i];
        if ( head.className === "focus" )clickHandler(tabHeads,tabBodys, head );
        head.onclick = function () {
            clickHandler(tabHeads,tabBodys,this);
        }
    }
}
$G('searchtab').onmousedown = function(){
    $G('search-msg').innerHTML = '';
    $G('replace-msg').innerHTML = ''
}
//是否区分大小写
function getMatchCase(id) {
    return $G(id).checked ? true : false;
}
//查找
$G("nextFindBtn").onclick = function (txt, dir, mcase) {
    var findtxt = $G("findtxt").value, obj;
    if (!findtxt) {
        return false;
    }
    obj = {
        searchStr:findtxt,
        dir:1,
        casesensitive:getMatchCase("matchCase")
    };
    if (!frCommond(obj)) {
        var bk = editor.selection.getRange().createBookmark();
        $G('search-msg').innerHTML = lang.getEnd;
        editor.selection.getRange().moveToBookmark(bk).select();


    }
};
$G("nextReplaceBtn").onclick = function (txt, dir, mcase) {
    var findtxt = $G("findtxt1").value, obj;
    if (!findtxt) {
        return false;
    }
    obj = {
        searchStr:findtxt,
        dir:1,
        casesensitive:getMatchCase("matchCase1")
    };
    frCommond(obj);
};
$G("preFindBtn").onclick = function (txt, dir, mcase) {
    var findtxt = $G("findtxt").value, obj;
    if (!findtxt) {
        return false;
    }
    obj = {
        searchStr:findtxt,
        dir:-1,
        casesensitive:getMatchCase("matchCase")
    };
    if (!frCommond(obj)) {
        $G('search-msg').innerHTML = lang.getStart;
    }
};
$G("preReplaceBtn").onclick = function (txt, dir, mcase) {
    var findtxt = $G("findtxt1").value, obj;
    if (!findtxt) {
        return false;
    }
    obj = {
        searchStr:findtxt,
        dir:-1,
        casesensitive:getMatchCase("matchCase1")
    };
    frCommond(obj);
};
//替换
$G("repalceBtn").onclick = function () {
    var findtxt = $G("findtxt1").value.replace(/^\s|\s$/g, ""), obj,
        replacetxt = $G("replacetxt").value.replace(/^\s|\s$/g, "");
    if (!findtxt) {
        return false;
    }
    if (findtxt == replacetxt || (!getMatchCase("matchCase1") && findtxt.toLowerCase() == replacetxt.toLowerCase())) {
        return false;
    }
    obj = {
        searchStr:findtxt,
        dir:1,
        casesensitive:getMatchCase("matchCase1"),
        replaceStr:replacetxt
    };
    frCommond(obj);
};
//全部替换
$G("repalceAllBtn").onclick = function () {
    var findtxt = $G("findtxt1").value.replace(/^\s|\s$/g, ""), obj,
        replacetxt = $G("replacetxt").value.replace(/^\s|\s$/g, "");
    if (!findtxt) {
        return false;
    }
    if (findtxt == replacetxt || (!getMatchCase("matchCase1") && findtxt.toLowerCase() == replacetxt.toLowerCase())) {
        return false;
    }
    obj = {
        searchStr:findtxt,
        casesensitive:getMatchCase("matchCase1"),
        replaceStr:replacetxt,
        all:true
    };
    var num = frCommond(obj);
    if (num) {
        $G('replace-msg').innerHTML = lang.countMsg.replace("{#count}", num);
    }
};
//执行
var frCommond = function (obj) {
    return editor.execCommand("searchreplace", obj);
};
switchTab("searchtab");
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvZGlhbG9ncy9zZWFyY2hyZXBsYWNlL3NlYXJjaHJlcGxhY2UuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIENyZWF0ZWQgd2l0aCBKZXRCcmFpbnMgUGhwU3Rvcm0uXHJcbiAqIFVzZXI6IHh1aGVuZ1xyXG4gKiBEYXRlOiAxMi05LTI2XHJcbiAqIFRpbWU6IOS4i+WNiDEyOjI5XHJcbiAqIFRvIGNoYW5nZSB0aGlzIHRlbXBsYXRlIHVzZSBGaWxlIHwgU2V0dGluZ3MgfCBGaWxlIFRlbXBsYXRlcy5cclxuICovXHJcblxyXG4vL+a4heepuuS4iuasoeafpemAieeahOeXlei/uVxyXG5lZGl0b3IuZmlyc3RGb3JTUiA9IDA7XHJcbmVkaXRvci5jdXJyZW50UmFuZ2VGb3JTUiA9IG51bGw7XHJcbi8v57uZdGFi5rOo5YaM5YiH5o2i5LqL5Lu2XHJcbi8qKlxyXG4gKiB0YWLngrnlh7vlpITnkIbkuovku7ZcclxuICogQHBhcmFtIHRhYkhlYWRzXHJcbiAqIEBwYXJhbSB0YWJCb2R5c1xyXG4gKiBAcGFyYW0gb2JqXHJcbiAqL1xyXG5mdW5jdGlvbiBjbGlja0hhbmRsZXIoIHRhYkhlYWRzLHRhYkJvZHlzLG9iaiApIHtcclxuICAgIC8vaGVhZOagt+W8j+abtOaUuVxyXG4gICAgZm9yICggdmFyIGsgPSAwLCBsZW4gPSB0YWJIZWFkcy5sZW5ndGg7IGsgPCBsZW47IGsrKyApIHtcclxuICAgICAgICB0YWJIZWFkc1trXS5jbGFzc05hbWUgPSBcIlwiO1xyXG4gICAgfVxyXG4gICAgb2JqLmNsYXNzTmFtZSA9IFwiZm9jdXNcIjtcclxuICAgIC8vYm9keeaYvumakFxyXG4gICAgdmFyIHRhYlNyYyA9IG9iai5nZXRBdHRyaWJ1dGUoIFwidGFiU3JjXCIgKTtcclxuICAgIGZvciAoIHZhciBqID0gMCwgbGVuZ3RoID0gdGFiQm9keXMubGVuZ3RoOyBqIDwgbGVuZ3RoOyBqKysgKSB7XHJcbiAgICAgICAgdmFyIGJvZHkgPSB0YWJCb2R5c1tqXSxcclxuICAgICAgICAgICAgaWQgPSBib2R5LmdldEF0dHJpYnV0ZSggXCJpZFwiICk7XHJcbiAgICAgICAgaWYgKCBpZCAhPSB0YWJTcmMgKSB7XHJcbiAgICAgICAgICAgIGJvZHkuc3R5bGUuekluZGV4ID0gMTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBib2R5LnN0eWxlLnpJbmRleCA9IDIwMDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG4vKipcclxuICogVEFC5YiH5o2iXHJcbiAqIEBwYXJhbSB0YWJQYXJlbnRJZCAgdGFi55qE54i26IqC54K5SUTmiJbogIXlr7nosaHmnKzouqtcclxuICovXHJcbmZ1bmN0aW9uIHN3aXRjaFRhYiggdGFiUGFyZW50SWQgKSB7XHJcbiAgICB2YXIgdGFiRWxlbWVudHMgPSAkRyggdGFiUGFyZW50SWQgKS5jaGlsZHJlbixcclxuICAgICAgICB0YWJIZWFkcyA9IHRhYkVsZW1lbnRzWzBdLmNoaWxkcmVuLFxyXG4gICAgICAgIHRhYkJvZHlzID0gdGFiRWxlbWVudHNbMV0uY2hpbGRyZW47XHJcblxyXG4gICAgZm9yICggdmFyIGkgPSAwLCBsZW5ndGggPSB0YWJIZWFkcy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKyApIHtcclxuICAgICAgICB2YXIgaGVhZCA9IHRhYkhlYWRzW2ldO1xyXG4gICAgICAgIGlmICggaGVhZC5jbGFzc05hbWUgPT09IFwiZm9jdXNcIiApY2xpY2tIYW5kbGVyKHRhYkhlYWRzLHRhYkJvZHlzLCBoZWFkICk7XHJcbiAgICAgICAgaGVhZC5vbmNsaWNrID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBjbGlja0hhbmRsZXIodGFiSGVhZHMsdGFiQm9keXMsdGhpcyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbiRHKCdzZWFyY2h0YWInKS5vbm1vdXNlZG93biA9IGZ1bmN0aW9uKCl7XHJcbiAgICAkRygnc2VhcmNoLW1zZycpLmlubmVySFRNTCA9ICcnO1xyXG4gICAgJEcoJ3JlcGxhY2UtbXNnJykuaW5uZXJIVE1MID0gJydcclxufVxyXG4vL+aYr+WQpuWMuuWIhuWkp+Wwj+WGmVxyXG5mdW5jdGlvbiBnZXRNYXRjaENhc2UoaWQpIHtcclxuICAgIHJldHVybiAkRyhpZCkuY2hlY2tlZCA/IHRydWUgOiBmYWxzZTtcclxufVxyXG4vL+afpeaJvlxyXG4kRyhcIm5leHRGaW5kQnRuXCIpLm9uY2xpY2sgPSBmdW5jdGlvbiAodHh0LCBkaXIsIG1jYXNlKSB7XHJcbiAgICB2YXIgZmluZHR4dCA9ICRHKFwiZmluZHR4dFwiKS52YWx1ZSwgb2JqO1xyXG4gICAgaWYgKCFmaW5kdHh0KSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgb2JqID0ge1xyXG4gICAgICAgIHNlYXJjaFN0cjpmaW5kdHh0LFxyXG4gICAgICAgIGRpcjoxLFxyXG4gICAgICAgIGNhc2VzZW5zaXRpdmU6Z2V0TWF0Y2hDYXNlKFwibWF0Y2hDYXNlXCIpXHJcbiAgICB9O1xyXG4gICAgaWYgKCFmckNvbW1vbmQob2JqKSkge1xyXG4gICAgICAgIHZhciBiayA9IGVkaXRvci5zZWxlY3Rpb24uZ2V0UmFuZ2UoKS5jcmVhdGVCb29rbWFyaygpO1xyXG4gICAgICAgICRHKCdzZWFyY2gtbXNnJykuaW5uZXJIVE1MID0gbGFuZy5nZXRFbmQ7XHJcbiAgICAgICAgZWRpdG9yLnNlbGVjdGlvbi5nZXRSYW5nZSgpLm1vdmVUb0Jvb2ttYXJrKGJrKS5zZWxlY3QoKTtcclxuXHJcblxyXG4gICAgfVxyXG59O1xyXG4kRyhcIm5leHRSZXBsYWNlQnRuXCIpLm9uY2xpY2sgPSBmdW5jdGlvbiAodHh0LCBkaXIsIG1jYXNlKSB7XHJcbiAgICB2YXIgZmluZHR4dCA9ICRHKFwiZmluZHR4dDFcIikudmFsdWUsIG9iajtcclxuICAgIGlmICghZmluZHR4dCkge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIG9iaiA9IHtcclxuICAgICAgICBzZWFyY2hTdHI6ZmluZHR4dCxcclxuICAgICAgICBkaXI6MSxcclxuICAgICAgICBjYXNlc2Vuc2l0aXZlOmdldE1hdGNoQ2FzZShcIm1hdGNoQ2FzZTFcIilcclxuICAgIH07XHJcbiAgICBmckNvbW1vbmQob2JqKTtcclxufTtcclxuJEcoXCJwcmVGaW5kQnRuXCIpLm9uY2xpY2sgPSBmdW5jdGlvbiAodHh0LCBkaXIsIG1jYXNlKSB7XHJcbiAgICB2YXIgZmluZHR4dCA9ICRHKFwiZmluZHR4dFwiKS52YWx1ZSwgb2JqO1xyXG4gICAgaWYgKCFmaW5kdHh0KSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgb2JqID0ge1xyXG4gICAgICAgIHNlYXJjaFN0cjpmaW5kdHh0LFxyXG4gICAgICAgIGRpcjotMSxcclxuICAgICAgICBjYXNlc2Vuc2l0aXZlOmdldE1hdGNoQ2FzZShcIm1hdGNoQ2FzZVwiKVxyXG4gICAgfTtcclxuICAgIGlmICghZnJDb21tb25kKG9iaikpIHtcclxuICAgICAgICAkRygnc2VhcmNoLW1zZycpLmlubmVySFRNTCA9IGxhbmcuZ2V0U3RhcnQ7XHJcbiAgICB9XHJcbn07XHJcbiRHKFwicHJlUmVwbGFjZUJ0blwiKS5vbmNsaWNrID0gZnVuY3Rpb24gKHR4dCwgZGlyLCBtY2FzZSkge1xyXG4gICAgdmFyIGZpbmR0eHQgPSAkRyhcImZpbmR0eHQxXCIpLnZhbHVlLCBvYmo7XHJcbiAgICBpZiAoIWZpbmR0eHQpIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICBvYmogPSB7XHJcbiAgICAgICAgc2VhcmNoU3RyOmZpbmR0eHQsXHJcbiAgICAgICAgZGlyOi0xLFxyXG4gICAgICAgIGNhc2VzZW5zaXRpdmU6Z2V0TWF0Y2hDYXNlKFwibWF0Y2hDYXNlMVwiKVxyXG4gICAgfTtcclxuICAgIGZyQ29tbW9uZChvYmopO1xyXG59O1xyXG4vL+abv+aNolxyXG4kRyhcInJlcGFsY2VCdG5cIikub25jbGljayA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBmaW5kdHh0ID0gJEcoXCJmaW5kdHh0MVwiKS52YWx1ZS5yZXBsYWNlKC9eXFxzfFxccyQvZywgXCJcIiksIG9iaixcclxuICAgICAgICByZXBsYWNldHh0ID0gJEcoXCJyZXBsYWNldHh0XCIpLnZhbHVlLnJlcGxhY2UoL15cXHN8XFxzJC9nLCBcIlwiKTtcclxuICAgIGlmICghZmluZHR4dCkge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIGlmIChmaW5kdHh0ID09IHJlcGxhY2V0eHQgfHwgKCFnZXRNYXRjaENhc2UoXCJtYXRjaENhc2UxXCIpICYmIGZpbmR0eHQudG9Mb3dlckNhc2UoKSA9PSByZXBsYWNldHh0LnRvTG93ZXJDYXNlKCkpKSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgb2JqID0ge1xyXG4gICAgICAgIHNlYXJjaFN0cjpmaW5kdHh0LFxyXG4gICAgICAgIGRpcjoxLFxyXG4gICAgICAgIGNhc2VzZW5zaXRpdmU6Z2V0TWF0Y2hDYXNlKFwibWF0Y2hDYXNlMVwiKSxcclxuICAgICAgICByZXBsYWNlU3RyOnJlcGxhY2V0eHRcclxuICAgIH07XHJcbiAgICBmckNvbW1vbmQob2JqKTtcclxufTtcclxuLy/lhajpg6jmm7/mjaJcclxuJEcoXCJyZXBhbGNlQWxsQnRuXCIpLm9uY2xpY2sgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgZmluZHR4dCA9ICRHKFwiZmluZHR4dDFcIikudmFsdWUucmVwbGFjZSgvXlxcc3xcXHMkL2csIFwiXCIpLCBvYmosXHJcbiAgICAgICAgcmVwbGFjZXR4dCA9ICRHKFwicmVwbGFjZXR4dFwiKS52YWx1ZS5yZXBsYWNlKC9eXFxzfFxccyQvZywgXCJcIik7XHJcbiAgICBpZiAoIWZpbmR0eHQpIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICBpZiAoZmluZHR4dCA9PSByZXBsYWNldHh0IHx8ICghZ2V0TWF0Y2hDYXNlKFwibWF0Y2hDYXNlMVwiKSAmJiBmaW5kdHh0LnRvTG93ZXJDYXNlKCkgPT0gcmVwbGFjZXR4dC50b0xvd2VyQ2FzZSgpKSkge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIG9iaiA9IHtcclxuICAgICAgICBzZWFyY2hTdHI6ZmluZHR4dCxcclxuICAgICAgICBjYXNlc2Vuc2l0aXZlOmdldE1hdGNoQ2FzZShcIm1hdGNoQ2FzZTFcIiksXHJcbiAgICAgICAgcmVwbGFjZVN0cjpyZXBsYWNldHh0LFxyXG4gICAgICAgIGFsbDp0cnVlXHJcbiAgICB9O1xyXG4gICAgdmFyIG51bSA9IGZyQ29tbW9uZChvYmopO1xyXG4gICAgaWYgKG51bSkge1xyXG4gICAgICAgICRHKCdyZXBsYWNlLW1zZycpLmlubmVySFRNTCA9IGxhbmcuY291bnRNc2cucmVwbGFjZShcInsjY291bnR9XCIsIG51bSk7XHJcbiAgICB9XHJcbn07XHJcbi8v5omn6KGMXHJcbnZhciBmckNvbW1vbmQgPSBmdW5jdGlvbiAob2JqKSB7XHJcbiAgICByZXR1cm4gZWRpdG9yLmV4ZWNDb21tYW5kKFwic2VhcmNocmVwbGFjZVwiLCBvYmopO1xyXG59O1xyXG5zd2l0Y2hUYWIoXCJzZWFyY2h0YWJcIik7Il0sImZpbGUiOiJwbHVnaW5zL3VlZGl0b3IvZGlhbG9ncy9zZWFyY2hyZXBsYWNlL3NlYXJjaHJlcGxhY2UuanMifQ==
