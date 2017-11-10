/**
 * Created with JetBrains PhpStorm.
 * User: xuheng
 * Date: 12-8-8
 * Time: 下午2:09
 * To change this template use File | Settings | File Templates.
 */
(function () {
    var me = editor,
            preview = $G( "preview" ),
            preitem = $G( "preitem" ),
            tmps = templates,
            currentTmp;
    var initPre = function () {
        var str = "";
        for ( var i = 0, tmp; tmp = tmps[i++]; ) {
            str += '<div class="preitem" onclick="pre(' + i + ')"><img src="' + "images/" + tmp.pre + '" ' + (tmp.title ? "alt=" + tmp.title + " title=" + tmp.title + "" : "") + '></div>';
        }
        preitem.innerHTML = str;
    };
    var pre = function ( n ) {
        var tmp = tmps[n - 1];
        currentTmp = tmp;
        clearItem();
        domUtils.setStyles( preitem.childNodes[n - 1], {
            "background-color":"lemonChiffon",
            "border":"#ccc 1px solid"
        } );
        preview.innerHTML = tmp.preHtml ? tmp.preHtml : "";
    };
    var clearItem = function () {
        var items = preitem.children;
        for ( var i = 0, item; item = items[i++]; ) {
            domUtils.setStyles( item, {
                "background-color":"",
                "border":"white 1px solid"
            } );
        }
    };
    dialog.onok = function () {
        if ( !$G( "issave" ).checked ){
            me.execCommand( "cleardoc" );
        }
        var obj = {
            html:currentTmp && currentTmp.html
        };
        me.execCommand( "template", obj );
    };
    initPre();
    window.pre = pre;
    pre(2)

})();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvZGlhbG9ncy90ZW1wbGF0ZS90ZW1wbGF0ZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQ3JlYXRlZCB3aXRoIEpldEJyYWlucyBQaHBTdG9ybS5cclxuICogVXNlcjogeHVoZW5nXHJcbiAqIERhdGU6IDEyLTgtOFxyXG4gKiBUaW1lOiDkuIvljYgyOjA5XHJcbiAqIFRvIGNoYW5nZSB0aGlzIHRlbXBsYXRlIHVzZSBGaWxlIHwgU2V0dGluZ3MgfCBGaWxlIFRlbXBsYXRlcy5cclxuICovXHJcbihmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgbWUgPSBlZGl0b3IsXHJcbiAgICAgICAgICAgIHByZXZpZXcgPSAkRyggXCJwcmV2aWV3XCIgKSxcclxuICAgICAgICAgICAgcHJlaXRlbSA9ICRHKCBcInByZWl0ZW1cIiApLFxyXG4gICAgICAgICAgICB0bXBzID0gdGVtcGxhdGVzLFxyXG4gICAgICAgICAgICBjdXJyZW50VG1wO1xyXG4gICAgdmFyIGluaXRQcmUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHN0ciA9IFwiXCI7XHJcbiAgICAgICAgZm9yICggdmFyIGkgPSAwLCB0bXA7IHRtcCA9IHRtcHNbaSsrXTsgKSB7XHJcbiAgICAgICAgICAgIHN0ciArPSAnPGRpdiBjbGFzcz1cInByZWl0ZW1cIiBvbmNsaWNrPVwicHJlKCcgKyBpICsgJylcIj48aW1nIHNyYz1cIicgKyBcImltYWdlcy9cIiArIHRtcC5wcmUgKyAnXCIgJyArICh0bXAudGl0bGUgPyBcImFsdD1cIiArIHRtcC50aXRsZSArIFwiIHRpdGxlPVwiICsgdG1wLnRpdGxlICsgXCJcIiA6IFwiXCIpICsgJz48L2Rpdj4nO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwcmVpdGVtLmlubmVySFRNTCA9IHN0cjtcclxuICAgIH07XHJcbiAgICB2YXIgcHJlID0gZnVuY3Rpb24gKCBuICkge1xyXG4gICAgICAgIHZhciB0bXAgPSB0bXBzW24gLSAxXTtcclxuICAgICAgICBjdXJyZW50VG1wID0gdG1wO1xyXG4gICAgICAgIGNsZWFySXRlbSgpO1xyXG4gICAgICAgIGRvbVV0aWxzLnNldFN0eWxlcyggcHJlaXRlbS5jaGlsZE5vZGVzW24gLSAxXSwge1xyXG4gICAgICAgICAgICBcImJhY2tncm91bmQtY29sb3JcIjpcImxlbW9uQ2hpZmZvblwiLFxyXG4gICAgICAgICAgICBcImJvcmRlclwiOlwiI2NjYyAxcHggc29saWRcIlxyXG4gICAgICAgIH0gKTtcclxuICAgICAgICBwcmV2aWV3LmlubmVySFRNTCA9IHRtcC5wcmVIdG1sID8gdG1wLnByZUh0bWwgOiBcIlwiO1xyXG4gICAgfTtcclxuICAgIHZhciBjbGVhckl0ZW0gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGl0ZW1zID0gcHJlaXRlbS5jaGlsZHJlbjtcclxuICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGl0ZW07IGl0ZW0gPSBpdGVtc1tpKytdOyApIHtcclxuICAgICAgICAgICAgZG9tVXRpbHMuc2V0U3R5bGVzKCBpdGVtLCB7XHJcbiAgICAgICAgICAgICAgICBcImJhY2tncm91bmQtY29sb3JcIjpcIlwiLFxyXG4gICAgICAgICAgICAgICAgXCJib3JkZXJcIjpcIndoaXRlIDFweCBzb2xpZFwiXHJcbiAgICAgICAgICAgIH0gKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgZGlhbG9nLm9ub2sgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKCAhJEcoIFwiaXNzYXZlXCIgKS5jaGVja2VkICl7XHJcbiAgICAgICAgICAgIG1lLmV4ZWNDb21tYW5kKCBcImNsZWFyZG9jXCIgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIG9iaiA9IHtcclxuICAgICAgICAgICAgaHRtbDpjdXJyZW50VG1wICYmIGN1cnJlbnRUbXAuaHRtbFxyXG4gICAgICAgIH07XHJcbiAgICAgICAgbWUuZXhlY0NvbW1hbmQoIFwidGVtcGxhdGVcIiwgb2JqICk7XHJcbiAgICB9O1xyXG4gICAgaW5pdFByZSgpO1xyXG4gICAgd2luZG93LnByZSA9IHByZTtcclxuICAgIHByZSgyKVxyXG5cclxufSkoKTsiXSwiZmlsZSI6InBsdWdpbnMvdWVkaXRvci9kaWFsb2dzL3RlbXBsYXRlL3RlbXBsYXRlLmpzIn0=
