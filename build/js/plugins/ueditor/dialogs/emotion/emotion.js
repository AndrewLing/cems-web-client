window.onload = function () {
    editor.setOpt({
        emotionLocalization:false
    });

    emotion.SmileyPath = editor.options.emotionLocalization === true ? 'images/' : "http://img.baidu.com/hi/";
    emotion.SmileyBox = createTabList( emotion.tabNum );
    emotion.tabExist = createArr( emotion.tabNum );

    initImgName();
    initEvtHandler( "tabHeads" );
};

function initImgName() {
    for ( var pro in emotion.SmilmgName ) {
        var tempName = emotion.SmilmgName[pro],
                tempBox = emotion.SmileyBox[pro],
                tempStr = "";

        if ( tempBox.length ) return;
        for ( var i = 1; i <= tempName[1]; i++ ) {
            tempStr = tempName[0];
            if ( i < 10 ) tempStr = tempStr + '0';
            tempStr = tempStr + i + '.gif';
            tempBox.push( tempStr );
        }
    }
}

function initEvtHandler( conId ) {
    var tabHeads = $G( conId );
    for ( var i = 0, j = 0; i < tabHeads.childNodes.length; i++ ) {
        var tabObj = tabHeads.childNodes[i];
        if ( tabObj.nodeType == 1 ) {
            domUtils.on( tabObj, "click", (function ( index ) {
                return function () {
                    switchTab( index );
                };
            })( j ) );
            j++;
        }
    }
    switchTab( 0 );
    $G( "tabIconReview" ).style.display = 'none';
}

function InsertSmiley( url, evt ) {
    var obj = {
        src:editor.options.emotionLocalization ? editor.options.UEDITOR_HOME_URL + "dialogs/emotion/" + url : url
    };
    obj._src = obj.src;
    editor.execCommand( 'insertimage', obj );
    if ( !evt.ctrlKey ) {
        dialog.popup.hide();
    }
}

function switchTab( index ) {

    autoHeight( index );
    if ( emotion.tabExist[index] == 0 ) {
        emotion.tabExist[index] = 1;
        createTab( 'tab' + index );
    }
    //获取呈现元素句柄数组
    var tabHeads = $G( "tabHeads" ).getElementsByTagName( "span" ),
            tabBodys = $G( "tabBodys" ).getElementsByTagName( "div" ),
            i = 0, L = tabHeads.length;
    //隐藏所有呈现元素
    for ( ; i < L; i++ ) {
        tabHeads[i].className = "";
        tabBodys[i].style.display = "none";
    }
    //显示对应呈现元素
    tabHeads[index].className = "focus";
    tabBodys[index].style.display = "block";
}

function autoHeight( index ) {
    var iframe = dialog.getDom( "iframe" ),
            parent = iframe.parentNode.parentNode;
    switch ( index ) {
        case 0:
            iframe.style.height = "380px";
            parent.style.height = "392px";
            break;
        case 1:
            iframe.style.height = "220px";
            parent.style.height = "232px";
            break;
        case 2:
            iframe.style.height = "260px";
            parent.style.height = "272px";
            break;
        case 3:
            iframe.style.height = "300px";
            parent.style.height = "312px";
            break;
        case 4:
            iframe.style.height = "140px";
            parent.style.height = "152px";
            break;
        case 5:
            iframe.style.height = "260px";
            parent.style.height = "272px";
            break;
        case 6:
            iframe.style.height = "230px";
            parent.style.height = "242px";
            break;
        default:

    }
}


function createTab( tabName ) {
    var faceVersion = "?v=1.1", //版本号
            tab = $G( tabName ), //获取将要生成的Div句柄
            imagePath = emotion.SmileyPath + emotion.imageFolders[tabName], //获取显示表情和预览表情的路径
            positionLine = 11 / 2, //中间数
            iWidth = iHeight = 35, //图片长宽
            iColWidth = 3, //表格剩余空间的显示比例
            tableCss = emotion.imageCss[tabName],
            cssOffset = emotion.imageCssOffset[tabName],
            textHTML = ['<table class="smileytable">'],
            i = 0, imgNum = emotion.SmileyBox[tabName].length, imgColNum = 11, faceImage,
            sUrl, realUrl, posflag, offset, infor;

    for ( ; i < imgNum; ) {
        textHTML.push( '<tr>' );
        for ( var j = 0; j < imgColNum; j++, i++ ) {
            faceImage = emotion.SmileyBox[tabName][i];
            if ( faceImage ) {
                sUrl = imagePath + faceImage + faceVersion;
                realUrl = imagePath + faceImage;
                posflag = j < positionLine ? 0 : 1;
                offset = cssOffset * i * (-1) - 1;
                infor = emotion.SmileyInfor[tabName][i];

                textHTML.push( '<td  class="' + tableCss + '"   border="1" width="' + iColWidth + '%" style="border-collapse:collapse;" align="center"  bgcolor="transparent" onclick="InsertSmiley(\'' + realUrl.replace( /'/g, "\\'" ) + '\',event)" onmouseover="over(this,\'' + sUrl + '\',\'' + posflag + '\')" onmouseout="out(this)">' );
                textHTML.push( '<span>' );
                textHTML.push( '<img  style="background-position:left ' + offset + 'px;" title="' + infor + '" src="' + emotion.SmileyPath + (editor.options.emotionLocalization ? '0.gif" width="' : 'default/0.gif" width="') + iWidth + '" height="' + iHeight + '"></img>' );
                textHTML.push( '</span>' );
            } else {
                textHTML.push( '<td width="' + iColWidth + '%"   bgcolor="#FFFFFF">' );
            }
            textHTML.push( '</td>' );
        }
        textHTML.push( '</tr>' );
    }
    textHTML.push( '</table>' );
    textHTML = textHTML.join( "" );
    tab.innerHTML = textHTML;
}

function over( td, srcPath, posFlag ) {
    td.style.backgroundColor = "#ACCD3C";
    $G( 'faceReview' ).style.backgroundImage = "url(" + srcPath + ")";
    if ( posFlag == 1 ) $G( "tabIconReview" ).className = "show";
    $G( "tabIconReview" ).style.display = 'block';
}

function out( td ) {
    td.style.backgroundColor = "transparent";
    var tabIconRevew = $G( "tabIconReview" );
    tabIconRevew.className = "";
    tabIconRevew.style.display = 'none';
}

function createTabList( tabNum ) {
    var obj = {};
    for ( var i = 0; i < tabNum; i++ ) {
        obj["tab" + i] = [];
    }
    return obj;
}

function createArr( tabNum ) {
    var arr = [];
    for ( var i = 0; i < tabNum; i++ ) {
        arr[i] = 0;
    }
    return arr;
}


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvZGlhbG9ncy9lbW90aW9uL2Vtb3Rpb24uanMiXSwic291cmNlc0NvbnRlbnQiOlsid2luZG93Lm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGVkaXRvci5zZXRPcHQoe1xyXG4gICAgICAgIGVtb3Rpb25Mb2NhbGl6YXRpb246ZmFsc2VcclxuICAgIH0pO1xyXG5cclxuICAgIGVtb3Rpb24uU21pbGV5UGF0aCA9IGVkaXRvci5vcHRpb25zLmVtb3Rpb25Mb2NhbGl6YXRpb24gPT09IHRydWUgPyAnaW1hZ2VzLycgOiBcImh0dHA6Ly9pbWcuYmFpZHUuY29tL2hpL1wiO1xyXG4gICAgZW1vdGlvbi5TbWlsZXlCb3ggPSBjcmVhdGVUYWJMaXN0KCBlbW90aW9uLnRhYk51bSApO1xyXG4gICAgZW1vdGlvbi50YWJFeGlzdCA9IGNyZWF0ZUFyciggZW1vdGlvbi50YWJOdW0gKTtcclxuXHJcbiAgICBpbml0SW1nTmFtZSgpO1xyXG4gICAgaW5pdEV2dEhhbmRsZXIoIFwidGFiSGVhZHNcIiApO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gaW5pdEltZ05hbWUoKSB7XHJcbiAgICBmb3IgKCB2YXIgcHJvIGluIGVtb3Rpb24uU21pbG1nTmFtZSApIHtcclxuICAgICAgICB2YXIgdGVtcE5hbWUgPSBlbW90aW9uLlNtaWxtZ05hbWVbcHJvXSxcclxuICAgICAgICAgICAgICAgIHRlbXBCb3ggPSBlbW90aW9uLlNtaWxleUJveFtwcm9dLFxyXG4gICAgICAgICAgICAgICAgdGVtcFN0ciA9IFwiXCI7XHJcblxyXG4gICAgICAgIGlmICggdGVtcEJveC5sZW5ndGggKSByZXR1cm47XHJcbiAgICAgICAgZm9yICggdmFyIGkgPSAxOyBpIDw9IHRlbXBOYW1lWzFdOyBpKysgKSB7XHJcbiAgICAgICAgICAgIHRlbXBTdHIgPSB0ZW1wTmFtZVswXTtcclxuICAgICAgICAgICAgaWYgKCBpIDwgMTAgKSB0ZW1wU3RyID0gdGVtcFN0ciArICcwJztcclxuICAgICAgICAgICAgdGVtcFN0ciA9IHRlbXBTdHIgKyBpICsgJy5naWYnO1xyXG4gICAgICAgICAgICB0ZW1wQm94LnB1c2goIHRlbXBTdHIgKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluaXRFdnRIYW5kbGVyKCBjb25JZCApIHtcclxuICAgIHZhciB0YWJIZWFkcyA9ICRHKCBjb25JZCApO1xyXG4gICAgZm9yICggdmFyIGkgPSAwLCBqID0gMDsgaSA8IHRhYkhlYWRzLmNoaWxkTm9kZXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgdmFyIHRhYk9iaiA9IHRhYkhlYWRzLmNoaWxkTm9kZXNbaV07XHJcbiAgICAgICAgaWYgKCB0YWJPYmoubm9kZVR5cGUgPT0gMSApIHtcclxuICAgICAgICAgICAgZG9tVXRpbHMub24oIHRhYk9iaiwgXCJjbGlja1wiLCAoZnVuY3Rpb24gKCBpbmRleCApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoVGFiKCBpbmRleCApO1xyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfSkoIGogKSApO1xyXG4gICAgICAgICAgICBqKys7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgc3dpdGNoVGFiKCAwICk7XHJcbiAgICAkRyggXCJ0YWJJY29uUmV2aWV3XCIgKS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG59XHJcblxyXG5mdW5jdGlvbiBJbnNlcnRTbWlsZXkoIHVybCwgZXZ0ICkge1xyXG4gICAgdmFyIG9iaiA9IHtcclxuICAgICAgICBzcmM6ZWRpdG9yLm9wdGlvbnMuZW1vdGlvbkxvY2FsaXphdGlvbiA/IGVkaXRvci5vcHRpb25zLlVFRElUT1JfSE9NRV9VUkwgKyBcImRpYWxvZ3MvZW1vdGlvbi9cIiArIHVybCA6IHVybFxyXG4gICAgfTtcclxuICAgIG9iai5fc3JjID0gb2JqLnNyYztcclxuICAgIGVkaXRvci5leGVjQ29tbWFuZCggJ2luc2VydGltYWdlJywgb2JqICk7XHJcbiAgICBpZiAoICFldnQuY3RybEtleSApIHtcclxuICAgICAgICBkaWFsb2cucG9wdXAuaGlkZSgpO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBzd2l0Y2hUYWIoIGluZGV4ICkge1xyXG5cclxuICAgIGF1dG9IZWlnaHQoIGluZGV4ICk7XHJcbiAgICBpZiAoIGVtb3Rpb24udGFiRXhpc3RbaW5kZXhdID09IDAgKSB7XHJcbiAgICAgICAgZW1vdGlvbi50YWJFeGlzdFtpbmRleF0gPSAxO1xyXG4gICAgICAgIGNyZWF0ZVRhYiggJ3RhYicgKyBpbmRleCApO1xyXG4gICAgfVxyXG4gICAgLy/ojrflj5blkYjnjrDlhYPntKDlj6Xmn4TmlbDnu4RcclxuICAgIHZhciB0YWJIZWFkcyA9ICRHKCBcInRhYkhlYWRzXCIgKS5nZXRFbGVtZW50c0J5VGFnTmFtZSggXCJzcGFuXCIgKSxcclxuICAgICAgICAgICAgdGFiQm9keXMgPSAkRyggXCJ0YWJCb2R5c1wiICkuZ2V0RWxlbWVudHNCeVRhZ05hbWUoIFwiZGl2XCIgKSxcclxuICAgICAgICAgICAgaSA9IDAsIEwgPSB0YWJIZWFkcy5sZW5ndGg7XHJcbiAgICAvL+makOiXj+aJgOacieWRiOeOsOWFg+e0oFxyXG4gICAgZm9yICggOyBpIDwgTDsgaSsrICkge1xyXG4gICAgICAgIHRhYkhlYWRzW2ldLmNsYXNzTmFtZSA9IFwiXCI7XHJcbiAgICAgICAgdGFiQm9keXNbaV0uc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG4gICAgfVxyXG4gICAgLy/mmL7npLrlr7nlupTlkYjnjrDlhYPntKBcclxuICAgIHRhYkhlYWRzW2luZGV4XS5jbGFzc05hbWUgPSBcImZvY3VzXCI7XHJcbiAgICB0YWJCb2R5c1tpbmRleF0uc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcclxufVxyXG5cclxuZnVuY3Rpb24gYXV0b0hlaWdodCggaW5kZXggKSB7XHJcbiAgICB2YXIgaWZyYW1lID0gZGlhbG9nLmdldERvbSggXCJpZnJhbWVcIiApLFxyXG4gICAgICAgICAgICBwYXJlbnQgPSBpZnJhbWUucGFyZW50Tm9kZS5wYXJlbnROb2RlO1xyXG4gICAgc3dpdGNoICggaW5kZXggKSB7XHJcbiAgICAgICAgY2FzZSAwOlxyXG4gICAgICAgICAgICBpZnJhbWUuc3R5bGUuaGVpZ2h0ID0gXCIzODBweFwiO1xyXG4gICAgICAgICAgICBwYXJlbnQuc3R5bGUuaGVpZ2h0ID0gXCIzOTJweFwiO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDE6XHJcbiAgICAgICAgICAgIGlmcmFtZS5zdHlsZS5oZWlnaHQgPSBcIjIyMHB4XCI7XHJcbiAgICAgICAgICAgIHBhcmVudC5zdHlsZS5oZWlnaHQgPSBcIjIzMnB4XCI7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgMjpcclxuICAgICAgICAgICAgaWZyYW1lLnN0eWxlLmhlaWdodCA9IFwiMjYwcHhcIjtcclxuICAgICAgICAgICAgcGFyZW50LnN0eWxlLmhlaWdodCA9IFwiMjcycHhcIjtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAzOlxyXG4gICAgICAgICAgICBpZnJhbWUuc3R5bGUuaGVpZ2h0ID0gXCIzMDBweFwiO1xyXG4gICAgICAgICAgICBwYXJlbnQuc3R5bGUuaGVpZ2h0ID0gXCIzMTJweFwiO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDQ6XHJcbiAgICAgICAgICAgIGlmcmFtZS5zdHlsZS5oZWlnaHQgPSBcIjE0MHB4XCI7XHJcbiAgICAgICAgICAgIHBhcmVudC5zdHlsZS5oZWlnaHQgPSBcIjE1MnB4XCI7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgNTpcclxuICAgICAgICAgICAgaWZyYW1lLnN0eWxlLmhlaWdodCA9IFwiMjYwcHhcIjtcclxuICAgICAgICAgICAgcGFyZW50LnN0eWxlLmhlaWdodCA9IFwiMjcycHhcIjtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSA2OlxyXG4gICAgICAgICAgICBpZnJhbWUuc3R5bGUuaGVpZ2h0ID0gXCIyMzBweFwiO1xyXG4gICAgICAgICAgICBwYXJlbnQuc3R5bGUuaGVpZ2h0ID0gXCIyNDJweFwiO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBkZWZhdWx0OlxyXG5cclxuICAgIH1cclxufVxyXG5cclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZVRhYiggdGFiTmFtZSApIHtcclxuICAgIHZhciBmYWNlVmVyc2lvbiA9IFwiP3Y9MS4xXCIsIC8v54mI5pys5Y+3XHJcbiAgICAgICAgICAgIHRhYiA9ICRHKCB0YWJOYW1lICksIC8v6I635Y+W5bCG6KaB55Sf5oiQ55qERGl25Y+l5p+EXHJcbiAgICAgICAgICAgIGltYWdlUGF0aCA9IGVtb3Rpb24uU21pbGV5UGF0aCArIGVtb3Rpb24uaW1hZ2VGb2xkZXJzW3RhYk5hbWVdLCAvL+iOt+WPluaYvuekuuihqOaDheWSjOmihOiniOihqOaDheeahOi3r+W+hFxyXG4gICAgICAgICAgICBwb3NpdGlvbkxpbmUgPSAxMSAvIDIsIC8v5Lit6Ze05pWwXHJcbiAgICAgICAgICAgIGlXaWR0aCA9IGlIZWlnaHQgPSAzNSwgLy/lm77niYfplb/lrr1cclxuICAgICAgICAgICAgaUNvbFdpZHRoID0gMywgLy/ooajmoLzliankvZnnqbrpl7TnmoTmmL7npLrmr5TkvotcclxuICAgICAgICAgICAgdGFibGVDc3MgPSBlbW90aW9uLmltYWdlQ3NzW3RhYk5hbWVdLFxyXG4gICAgICAgICAgICBjc3NPZmZzZXQgPSBlbW90aW9uLmltYWdlQ3NzT2Zmc2V0W3RhYk5hbWVdLFxyXG4gICAgICAgICAgICB0ZXh0SFRNTCA9IFsnPHRhYmxlIGNsYXNzPVwic21pbGV5dGFibGVcIj4nXSxcclxuICAgICAgICAgICAgaSA9IDAsIGltZ051bSA9IGVtb3Rpb24uU21pbGV5Qm94W3RhYk5hbWVdLmxlbmd0aCwgaW1nQ29sTnVtID0gMTEsIGZhY2VJbWFnZSxcclxuICAgICAgICAgICAgc1VybCwgcmVhbFVybCwgcG9zZmxhZywgb2Zmc2V0LCBpbmZvcjtcclxuXHJcbiAgICBmb3IgKCA7IGkgPCBpbWdOdW07ICkge1xyXG4gICAgICAgIHRleHRIVE1MLnB1c2goICc8dHI+JyApO1xyXG4gICAgICAgIGZvciAoIHZhciBqID0gMDsgaiA8IGltZ0NvbE51bTsgaisrLCBpKysgKSB7XHJcbiAgICAgICAgICAgIGZhY2VJbWFnZSA9IGVtb3Rpb24uU21pbGV5Qm94W3RhYk5hbWVdW2ldO1xyXG4gICAgICAgICAgICBpZiAoIGZhY2VJbWFnZSApIHtcclxuICAgICAgICAgICAgICAgIHNVcmwgPSBpbWFnZVBhdGggKyBmYWNlSW1hZ2UgKyBmYWNlVmVyc2lvbjtcclxuICAgICAgICAgICAgICAgIHJlYWxVcmwgPSBpbWFnZVBhdGggKyBmYWNlSW1hZ2U7XHJcbiAgICAgICAgICAgICAgICBwb3NmbGFnID0gaiA8IHBvc2l0aW9uTGluZSA/IDAgOiAxO1xyXG4gICAgICAgICAgICAgICAgb2Zmc2V0ID0gY3NzT2Zmc2V0ICogaSAqICgtMSkgLSAxO1xyXG4gICAgICAgICAgICAgICAgaW5mb3IgPSBlbW90aW9uLlNtaWxleUluZm9yW3RhYk5hbWVdW2ldO1xyXG5cclxuICAgICAgICAgICAgICAgIHRleHRIVE1MLnB1c2goICc8dGQgIGNsYXNzPVwiJyArIHRhYmxlQ3NzICsgJ1wiICAgYm9yZGVyPVwiMVwiIHdpZHRoPVwiJyArIGlDb2xXaWR0aCArICclXCIgc3R5bGU9XCJib3JkZXItY29sbGFwc2U6Y29sbGFwc2U7XCIgYWxpZ249XCJjZW50ZXJcIiAgYmdjb2xvcj1cInRyYW5zcGFyZW50XCIgb25jbGljaz1cIkluc2VydFNtaWxleShcXCcnICsgcmVhbFVybC5yZXBsYWNlKCAvJy9nLCBcIlxcXFwnXCIgKSArICdcXCcsZXZlbnQpXCIgb25tb3VzZW92ZXI9XCJvdmVyKHRoaXMsXFwnJyArIHNVcmwgKyAnXFwnLFxcJycgKyBwb3NmbGFnICsgJ1xcJylcIiBvbm1vdXNlb3V0PVwib3V0KHRoaXMpXCI+JyApO1xyXG4gICAgICAgICAgICAgICAgdGV4dEhUTUwucHVzaCggJzxzcGFuPicgKTtcclxuICAgICAgICAgICAgICAgIHRleHRIVE1MLnB1c2goICc8aW1nICBzdHlsZT1cImJhY2tncm91bmQtcG9zaXRpb246bGVmdCAnICsgb2Zmc2V0ICsgJ3B4O1wiIHRpdGxlPVwiJyArIGluZm9yICsgJ1wiIHNyYz1cIicgKyBlbW90aW9uLlNtaWxleVBhdGggKyAoZWRpdG9yLm9wdGlvbnMuZW1vdGlvbkxvY2FsaXphdGlvbiA/ICcwLmdpZlwiIHdpZHRoPVwiJyA6ICdkZWZhdWx0LzAuZ2lmXCIgd2lkdGg9XCInKSArIGlXaWR0aCArICdcIiBoZWlnaHQ9XCInICsgaUhlaWdodCArICdcIj48L2ltZz4nICk7XHJcbiAgICAgICAgICAgICAgICB0ZXh0SFRNTC5wdXNoKCAnPC9zcGFuPicgKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRleHRIVE1MLnB1c2goICc8dGQgd2lkdGg9XCInICsgaUNvbFdpZHRoICsgJyVcIiAgIGJnY29sb3I9XCIjRkZGRkZGXCI+JyApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRleHRIVE1MLnB1c2goICc8L3RkPicgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGV4dEhUTUwucHVzaCggJzwvdHI+JyApO1xyXG4gICAgfVxyXG4gICAgdGV4dEhUTUwucHVzaCggJzwvdGFibGU+JyApO1xyXG4gICAgdGV4dEhUTUwgPSB0ZXh0SFRNTC5qb2luKCBcIlwiICk7XHJcbiAgICB0YWIuaW5uZXJIVE1MID0gdGV4dEhUTUw7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG92ZXIoIHRkLCBzcmNQYXRoLCBwb3NGbGFnICkge1xyXG4gICAgdGQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCIjQUNDRDNDXCI7XHJcbiAgICAkRyggJ2ZhY2VSZXZpZXcnICkuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gXCJ1cmwoXCIgKyBzcmNQYXRoICsgXCIpXCI7XHJcbiAgICBpZiAoIHBvc0ZsYWcgPT0gMSApICRHKCBcInRhYkljb25SZXZpZXdcIiApLmNsYXNzTmFtZSA9IFwic2hvd1wiO1xyXG4gICAgJEcoIFwidGFiSWNvblJldmlld1wiICkuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG91dCggdGQgKSB7XHJcbiAgICB0ZC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBcInRyYW5zcGFyZW50XCI7XHJcbiAgICB2YXIgdGFiSWNvblJldmV3ID0gJEcoIFwidGFiSWNvblJldmlld1wiICk7XHJcbiAgICB0YWJJY29uUmV2ZXcuY2xhc3NOYW1lID0gXCJcIjtcclxuICAgIHRhYkljb25SZXZldy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVUYWJMaXN0KCB0YWJOdW0gKSB7XHJcbiAgICB2YXIgb2JqID0ge307XHJcbiAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCB0YWJOdW07IGkrKyApIHtcclxuICAgICAgICBvYmpbXCJ0YWJcIiArIGldID0gW107XHJcbiAgICB9XHJcbiAgICByZXR1cm4gb2JqO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVBcnIoIHRhYk51bSApIHtcclxuICAgIHZhciBhcnIgPSBbXTtcclxuICAgIGZvciAoIHZhciBpID0gMDsgaSA8IHRhYk51bTsgaSsrICkge1xyXG4gICAgICAgIGFycltpXSA9IDA7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYXJyO1xyXG59XHJcblxyXG4iXSwiZmlsZSI6InBsdWdpbnMvdWVkaXRvci9kaWFsb2dzL2Vtb3Rpb24vZW1vdGlvbi5qcyJ9
