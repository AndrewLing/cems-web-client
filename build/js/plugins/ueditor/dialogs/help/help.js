/**
 * Created with JetBrains PhpStorm.
 * User: xuheng
 * Date: 12-9-26
 * Time: 下午1:06
 * To change this template use File | Settings | File Templates.
 */
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
        body.onclick = function(){
            this.style.zoom = 1;
        };
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
switchTab("helptab");

document.getElementById('version').innerHTML = parent.UE.version;
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvZGlhbG9ncy9oZWxwL2hlbHAuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIENyZWF0ZWQgd2l0aCBKZXRCcmFpbnMgUGhwU3Rvcm0uXHJcbiAqIFVzZXI6IHh1aGVuZ1xyXG4gKiBEYXRlOiAxMi05LTI2XHJcbiAqIFRpbWU6IOS4i+WNiDE6MDZcclxuICogVG8gY2hhbmdlIHRoaXMgdGVtcGxhdGUgdXNlIEZpbGUgfCBTZXR0aW5ncyB8IEZpbGUgVGVtcGxhdGVzLlxyXG4gKi9cclxuLyoqXHJcbiAqIHRhYueCueWHu+WkhOeQhuS6i+S7tlxyXG4gKiBAcGFyYW0gdGFiSGVhZHNcclxuICogQHBhcmFtIHRhYkJvZHlzXHJcbiAqIEBwYXJhbSBvYmpcclxuICovXHJcbmZ1bmN0aW9uIGNsaWNrSGFuZGxlciggdGFiSGVhZHMsdGFiQm9keXMsb2JqICkge1xyXG4gICAgLy9oZWFk5qC35byP5pu05pS5XHJcbiAgICBmb3IgKCB2YXIgayA9IDAsIGxlbiA9IHRhYkhlYWRzLmxlbmd0aDsgayA8IGxlbjsgaysrICkge1xyXG4gICAgICAgIHRhYkhlYWRzW2tdLmNsYXNzTmFtZSA9IFwiXCI7XHJcbiAgICB9XHJcbiAgICBvYmouY2xhc3NOYW1lID0gXCJmb2N1c1wiO1xyXG4gICAgLy9ib2R55pi+6ZqQXHJcbiAgICB2YXIgdGFiU3JjID0gb2JqLmdldEF0dHJpYnV0ZSggXCJ0YWJTcmNcIiApO1xyXG4gICAgZm9yICggdmFyIGogPSAwLCBsZW5ndGggPSB0YWJCb2R5cy5sZW5ndGg7IGogPCBsZW5ndGg7IGorKyApIHtcclxuICAgICAgICB2YXIgYm9keSA9IHRhYkJvZHlzW2pdLFxyXG4gICAgICAgICAgICBpZCA9IGJvZHkuZ2V0QXR0cmlidXRlKCBcImlkXCIgKTtcclxuICAgICAgICBib2R5Lm9uY2xpY2sgPSBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICB0aGlzLnN0eWxlLnpvb20gPSAxO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgaWYgKCBpZCAhPSB0YWJTcmMgKSB7XHJcbiAgICAgICAgICAgIGJvZHkuc3R5bGUuekluZGV4ID0gMTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBib2R5LnN0eWxlLnpJbmRleCA9IDIwMDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG4vKipcclxuICogVEFC5YiH5o2iXHJcbiAqIEBwYXJhbSB0YWJQYXJlbnRJZCAgdGFi55qE54i26IqC54K5SUTmiJbogIXlr7nosaHmnKzouqtcclxuICovXHJcbmZ1bmN0aW9uIHN3aXRjaFRhYiggdGFiUGFyZW50SWQgKSB7XHJcbiAgICB2YXIgdGFiRWxlbWVudHMgPSAkRyggdGFiUGFyZW50SWQgKS5jaGlsZHJlbixcclxuICAgICAgICB0YWJIZWFkcyA9IHRhYkVsZW1lbnRzWzBdLmNoaWxkcmVuLFxyXG4gICAgICAgIHRhYkJvZHlzID0gdGFiRWxlbWVudHNbMV0uY2hpbGRyZW47XHJcblxyXG4gICAgZm9yICggdmFyIGkgPSAwLCBsZW5ndGggPSB0YWJIZWFkcy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKyApIHtcclxuICAgICAgICB2YXIgaGVhZCA9IHRhYkhlYWRzW2ldO1xyXG4gICAgICAgIGlmICggaGVhZC5jbGFzc05hbWUgPT09IFwiZm9jdXNcIiApY2xpY2tIYW5kbGVyKHRhYkhlYWRzLHRhYkJvZHlzLCBoZWFkICk7XHJcbiAgICAgICAgaGVhZC5vbmNsaWNrID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBjbGlja0hhbmRsZXIodGFiSGVhZHMsdGFiQm9keXMsdGhpcyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbnN3aXRjaFRhYihcImhlbHB0YWJcIik7XHJcblxyXG5kb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndmVyc2lvbicpLmlubmVySFRNTCA9IHBhcmVudC5VRS52ZXJzaW9uOyJdLCJmaWxlIjoicGx1Z2lucy91ZWRpdG9yL2RpYWxvZ3MvaGVscC9oZWxwLmpzIn0=
