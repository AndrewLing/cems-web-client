function Music() {
    this.init();
}
(function () {
    var pages = [],
        panels = [],
        selectedItem = null;
    Music.prototype = {
        total:70,
        pageSize:10,
        dataUrl:"http://tingapi.ting.baidu.com/v1/restserver/ting?method=baidu.ting.search.common",
        playerUrl:"http://box.baidu.com/widget/flash/bdspacesong.swf",

        init:function () {
            var me = this;
            domUtils.on($G("J_searchName"), "keyup", function (event) {
                var e = window.event || event;
                if (e.keyCode == 13) {
                    me.dosearch();
                }
            });
            domUtils.on($G("J_searchBtn"), "click", function () {
                me.dosearch();
            });
        },
        callback:function (data) {
            var me = this;
            me.data = data.song_list;
            setTimeout(function () {
                $G('J_resultBar').innerHTML = me._renderTemplate(data.song_list);
            }, 300);
        },
        dosearch:function () {
            var me = this;
            selectedItem = null;
            var key = $G('J_searchName').value;
            if (utils.trim(key) == "")return false;
            key = encodeURIComponent(key);
            me._sent(key);
        },
        doselect:function (i) {
            var me = this;
            if (typeof i == 'object') {
                selectedItem = i;
            } else if (typeof i == 'number') {
                selectedItem = me.data[i];
            }
        },
        onpageclick:function (id) {
            var me = this;
            for (var i = 0; i < pages.length; i++) {
                $G(pages[i]).className = 'pageoff';
                $G(panels[i]).className = 'paneloff';
            }
            $G('page' + id).className = 'pageon';
            $G('panel' + id).className = 'panelon';
        },
        listenTest:function (elem) {
            var me = this,
                view = $G('J_preview'),
                is_play_action = (elem.className == 'm-try'),
                old_trying = me._getTryingElem();

            if (old_trying) {
                old_trying.className = 'm-try';
                view.innerHTML = '';
            }
            if (is_play_action) {
                elem.className = 'm-trying';
                view.innerHTML = me._buildMusicHtml(me._getUrl(true));
            }
        },
        _sent:function (param) {
            var me = this;
            $G('J_resultBar').innerHTML = '<div class="loading"></div>';

            utils.loadFile(document, {
                src:me.dataUrl + '&query=' + param + '&page_size=' + me.total + '&callback=music.callback&.r=' + Math.random(),
                tag:"script",
                type:"text/javascript",
                defer:"defer"
            });
        },
        _removeHtml:function (str) {
            var reg = /<\s*\/?\s*[^>]*\s*>/gi;
            return str.replace(reg, "");
        },
        _getUrl:function (isTryListen) {
            var me = this;
            var param = 'from=tiebasongwidget&url=&name=' + encodeURIComponent(me._removeHtml(selectedItem.title)) + '&artist='
                + encodeURIComponent(me._removeHtml(selectedItem.author)) + '&extra='
                + encodeURIComponent(me._removeHtml(selectedItem.album_title))
                + '&autoPlay='+isTryListen+'' + '&loop=true';
            return  me.playerUrl + "?" + param;
        },
        _getTryingElem:function () {
            var s = $G('J_listPanel').getElementsByTagName('span');

            for (var i = 0; i < s.length; i++) {
                if (s[i].className == 'm-trying')
                    return s[i];
            }
            return null;
        },
        _buildMusicHtml:function (playerUrl) {
            var html = '<embed class="BDE_try_Music" allowfullscreen="false" pluginspage="http://www.macromedia.com/go/getflashplayer"';
            html += ' src="' + playerUrl + '"';
            html += ' width="1" height="1" style="position:absolute;left:-2000px;"';
            html += ' type="application/x-shockwave-flash" wmode="transparent" play="true" loop="false"';
            html += ' menu="false" allowscriptaccess="never" scale="noborder">';
            return html;
        },
        _byteLength:function (str) {
            return str.replace(/[^\u0000-\u007f]/g, "\u0061\u0061").length;
        },
        _getMaxText:function (s) {
            var me = this;
            s = me._removeHtml(s);
            if (me._byteLength(s) > 12)
                return s.substring(0, 5) + '...';
            if (!s) s = "&nbsp;";
            return s;
        },
        _rebuildData:function (data) {
            var me = this,
                newData = [],
                d = me.pageSize,
                itembox;
            for (var i = 0; i < data.length; i++) {
                if ((i + d) % d == 0) {
                    itembox = [];
                    newData.push(itembox)
                }
                itembox.push(data[i]);
            }
            return newData;
        },
        _renderTemplate:function (data) {
            var me = this;
            if (data.length == 0)return '<div class="empty">' + lang.emptyTxt + '</div>';
            data = me._rebuildData(data);
            var s = [], p = [], t = [];
            s.push('<div id="J_listPanel" class="listPanel">');
            p.push('<div class="page">');
            for (var i = 0, tmpList; tmpList = data[i++];) {
                panels.push('panel' + i);
                pages.push('page' + i);
                if (i == 1) {
                    s.push('<div id="panel' + i + '" class="panelon">');
                    if (data.length != 1) {
                        t.push('<div id="page' + i + '" onclick="music.onpageclick(' + i + ')" class="pageon">' + (i ) + '</div>');
                    }
                } else {
                    s.push('<div id="panel' + i + '" class="paneloff">');
                    t.push('<div id="page' + i + '" onclick="music.onpageclick(' + i + ')" class="pageoff">' + (i ) + '</div>');
                }
                s.push('<div class="m-box">');
                s.push('<div class="m-h"><span class="m-t">' + lang.chapter + '</span><span class="m-s">' + lang.singer
                    + '</span><span class="m-z">' + lang.special + '</span><span class="m-try-t">' + lang.listenTest + '</span></div>');
                for (var j = 0, tmpObj; tmpObj = tmpList[j++];) {
                    s.push('<label for="radio-' + i + '-' + j + '" class="m-m">');
                    s.push('<input type="radio" id="radio-' + i + '-' + j + '" name="musicId" class="m-l" onclick="music.doselect(' + (me.pageSize * (i-1) + (j-1)) + ')"/>');
                    s.push('<span class="m-t">' + me._getMaxText(tmpObj.title) + '</span>');
                    s.push('<span class="m-s">' + me._getMaxText(tmpObj.author) + '</span>');
                    s.push('<span class="m-z">' + me._getMaxText(tmpObj.album_title) + '</span>');
                    s.push('<span class="m-try" onclick="music.doselect(' + (me.pageSize * (i-1) + (j-1)) + ');music.listenTest(this)"></span>');
                    s.push('</label>');
                }
                s.push('</div>');
                s.push('</div>');
            }
            t.reverse();
            p.push(t.join(''));
            s.push('</div>');
            p.push('</div>');
            return s.join('') + p.join('');
        },
        exec:function () {
            var me = this;
            if (selectedItem == null)   return;
            $G('J_preview').innerHTML = "";
            editor.execCommand('music', {
                url:me._getUrl(false),
                width:400,
                height:95
            });
        }
    };
})();




//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvZGlhbG9ncy9tdXNpYy9tdXNpYy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJmdW5jdGlvbiBNdXNpYygpIHtcclxuICAgIHRoaXMuaW5pdCgpO1xyXG59XHJcbihmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgcGFnZXMgPSBbXSxcclxuICAgICAgICBwYW5lbHMgPSBbXSxcclxuICAgICAgICBzZWxlY3RlZEl0ZW0gPSBudWxsO1xyXG4gICAgTXVzaWMucHJvdG90eXBlID0ge1xyXG4gICAgICAgIHRvdGFsOjcwLFxyXG4gICAgICAgIHBhZ2VTaXplOjEwLFxyXG4gICAgICAgIGRhdGFVcmw6XCJodHRwOi8vdGluZ2FwaS50aW5nLmJhaWR1LmNvbS92MS9yZXN0c2VydmVyL3Rpbmc/bWV0aG9kPWJhaWR1LnRpbmcuc2VhcmNoLmNvbW1vblwiLFxyXG4gICAgICAgIHBsYXllclVybDpcImh0dHA6Ly9ib3guYmFpZHUuY29tL3dpZGdldC9mbGFzaC9iZHNwYWNlc29uZy5zd2ZcIixcclxuXHJcbiAgICAgICAgaW5pdDpmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciBtZSA9IHRoaXM7XHJcbiAgICAgICAgICAgIGRvbVV0aWxzLm9uKCRHKFwiSl9zZWFyY2hOYW1lXCIpLCBcImtleXVwXCIsIGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGUgPSB3aW5kb3cuZXZlbnQgfHwgZXZlbnQ7XHJcbiAgICAgICAgICAgICAgICBpZiAoZS5rZXlDb2RlID09IDEzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWUuZG9zZWFyY2goKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGRvbVV0aWxzLm9uKCRHKFwiSl9zZWFyY2hCdG5cIiksIFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgbWUuZG9zZWFyY2goKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBjYWxsYmFjazpmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICB2YXIgbWUgPSB0aGlzO1xyXG4gICAgICAgICAgICBtZS5kYXRhID0gZGF0YS5zb25nX2xpc3Q7XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgJEcoJ0pfcmVzdWx0QmFyJykuaW5uZXJIVE1MID0gbWUuX3JlbmRlclRlbXBsYXRlKGRhdGEuc29uZ19saXN0KTtcclxuICAgICAgICAgICAgfSwgMzAwKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGRvc2VhcmNoOmZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIG1lID0gdGhpcztcclxuICAgICAgICAgICAgc2VsZWN0ZWRJdGVtID0gbnVsbDtcclxuICAgICAgICAgICAgdmFyIGtleSA9ICRHKCdKX3NlYXJjaE5hbWUnKS52YWx1ZTtcclxuICAgICAgICAgICAgaWYgKHV0aWxzLnRyaW0oa2V5KSA9PSBcIlwiKXJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAga2V5ID0gZW5jb2RlVVJJQ29tcG9uZW50KGtleSk7XHJcbiAgICAgICAgICAgIG1lLl9zZW50KGtleSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBkb3NlbGVjdDpmdW5jdGlvbiAoaSkge1xyXG4gICAgICAgICAgICB2YXIgbWUgPSB0aGlzO1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIGkgPT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgICAgIHNlbGVjdGVkSXRlbSA9IGk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGkgPT0gJ251bWJlcicpIHtcclxuICAgICAgICAgICAgICAgIHNlbGVjdGVkSXRlbSA9IG1lLmRhdGFbaV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIG9ucGFnZWNsaWNrOmZ1bmN0aW9uIChpZCkge1xyXG4gICAgICAgICAgICB2YXIgbWUgPSB0aGlzO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhZ2VzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAkRyhwYWdlc1tpXSkuY2xhc3NOYW1lID0gJ3BhZ2VvZmYnO1xyXG4gICAgICAgICAgICAgICAgJEcocGFuZWxzW2ldKS5jbGFzc05hbWUgPSAncGFuZWxvZmYnO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICRHKCdwYWdlJyArIGlkKS5jbGFzc05hbWUgPSAncGFnZW9uJztcclxuICAgICAgICAgICAgJEcoJ3BhbmVsJyArIGlkKS5jbGFzc05hbWUgPSAncGFuZWxvbic7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBsaXN0ZW5UZXN0OmZ1bmN0aW9uIChlbGVtKSB7XHJcbiAgICAgICAgICAgIHZhciBtZSA9IHRoaXMsXHJcbiAgICAgICAgICAgICAgICB2aWV3ID0gJEcoJ0pfcHJldmlldycpLFxyXG4gICAgICAgICAgICAgICAgaXNfcGxheV9hY3Rpb24gPSAoZWxlbS5jbGFzc05hbWUgPT0gJ20tdHJ5JyksXHJcbiAgICAgICAgICAgICAgICBvbGRfdHJ5aW5nID0gbWUuX2dldFRyeWluZ0VsZW0oKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChvbGRfdHJ5aW5nKSB7XHJcbiAgICAgICAgICAgICAgICBvbGRfdHJ5aW5nLmNsYXNzTmFtZSA9ICdtLXRyeSc7XHJcbiAgICAgICAgICAgICAgICB2aWV3LmlubmVySFRNTCA9ICcnO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChpc19wbGF5X2FjdGlvbikge1xyXG4gICAgICAgICAgICAgICAgZWxlbS5jbGFzc05hbWUgPSAnbS10cnlpbmcnO1xyXG4gICAgICAgICAgICAgICAgdmlldy5pbm5lckhUTUwgPSBtZS5fYnVpbGRNdXNpY0h0bWwobWUuX2dldFVybCh0cnVlKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIF9zZW50OmZ1bmN0aW9uIChwYXJhbSkge1xyXG4gICAgICAgICAgICB2YXIgbWUgPSB0aGlzO1xyXG4gICAgICAgICAgICAkRygnSl9yZXN1bHRCYXInKS5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cImxvYWRpbmdcIj48L2Rpdj4nO1xyXG5cclxuICAgICAgICAgICAgdXRpbHMubG9hZEZpbGUoZG9jdW1lbnQsIHtcclxuICAgICAgICAgICAgICAgIHNyYzptZS5kYXRhVXJsICsgJyZxdWVyeT0nICsgcGFyYW0gKyAnJnBhZ2Vfc2l6ZT0nICsgbWUudG90YWwgKyAnJmNhbGxiYWNrPW11c2ljLmNhbGxiYWNrJi5yPScgKyBNYXRoLnJhbmRvbSgpLFxyXG4gICAgICAgICAgICAgICAgdGFnOlwic2NyaXB0XCIsXHJcbiAgICAgICAgICAgICAgICB0eXBlOlwidGV4dC9qYXZhc2NyaXB0XCIsXHJcbiAgICAgICAgICAgICAgICBkZWZlcjpcImRlZmVyXCJcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBfcmVtb3ZlSHRtbDpmdW5jdGlvbiAoc3RyKSB7XHJcbiAgICAgICAgICAgIHZhciByZWcgPSAvPFxccypcXC8/XFxzKltePl0qXFxzKj4vZ2k7XHJcbiAgICAgICAgICAgIHJldHVybiBzdHIucmVwbGFjZShyZWcsIFwiXCIpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgX2dldFVybDpmdW5jdGlvbiAoaXNUcnlMaXN0ZW4pIHtcclxuICAgICAgICAgICAgdmFyIG1lID0gdGhpcztcclxuICAgICAgICAgICAgdmFyIHBhcmFtID0gJ2Zyb209dGllYmFzb25nd2lkZ2V0JnVybD0mbmFtZT0nICsgZW5jb2RlVVJJQ29tcG9uZW50KG1lLl9yZW1vdmVIdG1sKHNlbGVjdGVkSXRlbS50aXRsZSkpICsgJyZhcnRpc3Q9J1xyXG4gICAgICAgICAgICAgICAgKyBlbmNvZGVVUklDb21wb25lbnQobWUuX3JlbW92ZUh0bWwoc2VsZWN0ZWRJdGVtLmF1dGhvcikpICsgJyZleHRyYT0nXHJcbiAgICAgICAgICAgICAgICArIGVuY29kZVVSSUNvbXBvbmVudChtZS5fcmVtb3ZlSHRtbChzZWxlY3RlZEl0ZW0uYWxidW1fdGl0bGUpKVxyXG4gICAgICAgICAgICAgICAgKyAnJmF1dG9QbGF5PScraXNUcnlMaXN0ZW4rJycgKyAnJmxvb3A9dHJ1ZSc7XHJcbiAgICAgICAgICAgIHJldHVybiAgbWUucGxheWVyVXJsICsgXCI/XCIgKyBwYXJhbTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIF9nZXRUcnlpbmdFbGVtOmZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIHMgPSAkRygnSl9saXN0UGFuZWwnKS5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc3BhbicpO1xyXG5cclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc1tpXS5jbGFzc05hbWUgPT0gJ20tdHJ5aW5nJylcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc1tpXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIF9idWlsZE11c2ljSHRtbDpmdW5jdGlvbiAocGxheWVyVXJsKSB7XHJcbiAgICAgICAgICAgIHZhciBodG1sID0gJzxlbWJlZCBjbGFzcz1cIkJERV90cnlfTXVzaWNcIiBhbGxvd2Z1bGxzY3JlZW49XCJmYWxzZVwiIHBsdWdpbnNwYWdlPVwiaHR0cDovL3d3dy5tYWNyb21lZGlhLmNvbS9nby9nZXRmbGFzaHBsYXllclwiJztcclxuICAgICAgICAgICAgaHRtbCArPSAnIHNyYz1cIicgKyBwbGF5ZXJVcmwgKyAnXCInO1xyXG4gICAgICAgICAgICBodG1sICs9ICcgd2lkdGg9XCIxXCIgaGVpZ2h0PVwiMVwiIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7bGVmdDotMjAwMHB4O1wiJztcclxuICAgICAgICAgICAgaHRtbCArPSAnIHR5cGU9XCJhcHBsaWNhdGlvbi94LXNob2Nrd2F2ZS1mbGFzaFwiIHdtb2RlPVwidHJhbnNwYXJlbnRcIiBwbGF5PVwidHJ1ZVwiIGxvb3A9XCJmYWxzZVwiJztcclxuICAgICAgICAgICAgaHRtbCArPSAnIG1lbnU9XCJmYWxzZVwiIGFsbG93c2NyaXB0YWNjZXNzPVwibmV2ZXJcIiBzY2FsZT1cIm5vYm9yZGVyXCI+JztcclxuICAgICAgICAgICAgcmV0dXJuIGh0bWw7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBfYnl0ZUxlbmd0aDpmdW5jdGlvbiAoc3RyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBzdHIucmVwbGFjZSgvW15cXHUwMDAwLVxcdTAwN2ZdL2csIFwiXFx1MDA2MVxcdTAwNjFcIikubGVuZ3RoO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgX2dldE1heFRleHQ6ZnVuY3Rpb24gKHMpIHtcclxuICAgICAgICAgICAgdmFyIG1lID0gdGhpcztcclxuICAgICAgICAgICAgcyA9IG1lLl9yZW1vdmVIdG1sKHMpO1xyXG4gICAgICAgICAgICBpZiAobWUuX2J5dGVMZW5ndGgocykgPiAxMilcclxuICAgICAgICAgICAgICAgIHJldHVybiBzLnN1YnN0cmluZygwLCA1KSArICcuLi4nO1xyXG4gICAgICAgICAgICBpZiAoIXMpIHMgPSBcIiZuYnNwO1wiO1xyXG4gICAgICAgICAgICByZXR1cm4gcztcclxuICAgICAgICB9LFxyXG4gICAgICAgIF9yZWJ1aWxkRGF0YTpmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICB2YXIgbWUgPSB0aGlzLFxyXG4gICAgICAgICAgICAgICAgbmV3RGF0YSA9IFtdLFxyXG4gICAgICAgICAgICAgICAgZCA9IG1lLnBhZ2VTaXplLFxyXG4gICAgICAgICAgICAgICAgaXRlbWJveDtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoKGkgKyBkKSAlIGQgPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGl0ZW1ib3ggPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICBuZXdEYXRhLnB1c2goaXRlbWJveClcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGl0ZW1ib3gucHVzaChkYXRhW2ldKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gbmV3RGF0YTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIF9yZW5kZXJUZW1wbGF0ZTpmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICB2YXIgbWUgPSB0aGlzO1xyXG4gICAgICAgICAgICBpZiAoZGF0YS5sZW5ndGggPT0gMClyZXR1cm4gJzxkaXYgY2xhc3M9XCJlbXB0eVwiPicgKyBsYW5nLmVtcHR5VHh0ICsgJzwvZGl2Pic7XHJcbiAgICAgICAgICAgIGRhdGEgPSBtZS5fcmVidWlsZERhdGEoZGF0YSk7XHJcbiAgICAgICAgICAgIHZhciBzID0gW10sIHAgPSBbXSwgdCA9IFtdO1xyXG4gICAgICAgICAgICBzLnB1c2goJzxkaXYgaWQ9XCJKX2xpc3RQYW5lbFwiIGNsYXNzPVwibGlzdFBhbmVsXCI+Jyk7XHJcbiAgICAgICAgICAgIHAucHVzaCgnPGRpdiBjbGFzcz1cInBhZ2VcIj4nKTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIHRtcExpc3Q7IHRtcExpc3QgPSBkYXRhW2krK107KSB7XHJcbiAgICAgICAgICAgICAgICBwYW5lbHMucHVzaCgncGFuZWwnICsgaSk7XHJcbiAgICAgICAgICAgICAgICBwYWdlcy5wdXNoKCdwYWdlJyArIGkpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGkgPT0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHMucHVzaCgnPGRpdiBpZD1cInBhbmVsJyArIGkgKyAnXCIgY2xhc3M9XCJwYW5lbG9uXCI+Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEubGVuZ3RoICE9IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdC5wdXNoKCc8ZGl2IGlkPVwicGFnZScgKyBpICsgJ1wiIG9uY2xpY2s9XCJtdXNpYy5vbnBhZ2VjbGljaygnICsgaSArICcpXCIgY2xhc3M9XCJwYWdlb25cIj4nICsgKGkgKSArICc8L2Rpdj4nKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHMucHVzaCgnPGRpdiBpZD1cInBhbmVsJyArIGkgKyAnXCIgY2xhc3M9XCJwYW5lbG9mZlwiPicpO1xyXG4gICAgICAgICAgICAgICAgICAgIHQucHVzaCgnPGRpdiBpZD1cInBhZ2UnICsgaSArICdcIiBvbmNsaWNrPVwibXVzaWMub25wYWdlY2xpY2soJyArIGkgKyAnKVwiIGNsYXNzPVwicGFnZW9mZlwiPicgKyAoaSApICsgJzwvZGl2PicpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcy5wdXNoKCc8ZGl2IGNsYXNzPVwibS1ib3hcIj4nKTtcclxuICAgICAgICAgICAgICAgIHMucHVzaCgnPGRpdiBjbGFzcz1cIm0taFwiPjxzcGFuIGNsYXNzPVwibS10XCI+JyArIGxhbmcuY2hhcHRlciArICc8L3NwYW4+PHNwYW4gY2xhc3M9XCJtLXNcIj4nICsgbGFuZy5zaW5nZXJcclxuICAgICAgICAgICAgICAgICAgICArICc8L3NwYW4+PHNwYW4gY2xhc3M9XCJtLXpcIj4nICsgbGFuZy5zcGVjaWFsICsgJzwvc3Bhbj48c3BhbiBjbGFzcz1cIm0tdHJ5LXRcIj4nICsgbGFuZy5saXN0ZW5UZXN0ICsgJzwvc3Bhbj48L2Rpdj4nKTtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwLCB0bXBPYmo7IHRtcE9iaiA9IHRtcExpc3RbaisrXTspIHtcclxuICAgICAgICAgICAgICAgICAgICBzLnB1c2goJzxsYWJlbCBmb3I9XCJyYWRpby0nICsgaSArICctJyArIGogKyAnXCIgY2xhc3M9XCJtLW1cIj4nKTtcclxuICAgICAgICAgICAgICAgICAgICBzLnB1c2goJzxpbnB1dCB0eXBlPVwicmFkaW9cIiBpZD1cInJhZGlvLScgKyBpICsgJy0nICsgaiArICdcIiBuYW1lPVwibXVzaWNJZFwiIGNsYXNzPVwibS1sXCIgb25jbGljaz1cIm11c2ljLmRvc2VsZWN0KCcgKyAobWUucGFnZVNpemUgKiAoaS0xKSArIChqLTEpKSArICcpXCIvPicpO1xyXG4gICAgICAgICAgICAgICAgICAgIHMucHVzaCgnPHNwYW4gY2xhc3M9XCJtLXRcIj4nICsgbWUuX2dldE1heFRleHQodG1wT2JqLnRpdGxlKSArICc8L3NwYW4+Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgcy5wdXNoKCc8c3BhbiBjbGFzcz1cIm0tc1wiPicgKyBtZS5fZ2V0TWF4VGV4dCh0bXBPYmouYXV0aG9yKSArICc8L3NwYW4+Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgcy5wdXNoKCc8c3BhbiBjbGFzcz1cIm0telwiPicgKyBtZS5fZ2V0TWF4VGV4dCh0bXBPYmouYWxidW1fdGl0bGUpICsgJzwvc3Bhbj4nKTtcclxuICAgICAgICAgICAgICAgICAgICBzLnB1c2goJzxzcGFuIGNsYXNzPVwibS10cnlcIiBvbmNsaWNrPVwibXVzaWMuZG9zZWxlY3QoJyArIChtZS5wYWdlU2l6ZSAqIChpLTEpICsgKGotMSkpICsgJyk7bXVzaWMubGlzdGVuVGVzdCh0aGlzKVwiPjwvc3Bhbj4nKTtcclxuICAgICAgICAgICAgICAgICAgICBzLnB1c2goJzwvbGFiZWw+Jyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBzLnB1c2goJzwvZGl2PicpO1xyXG4gICAgICAgICAgICAgICAgcy5wdXNoKCc8L2Rpdj4nKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0LnJldmVyc2UoKTtcclxuICAgICAgICAgICAgcC5wdXNoKHQuam9pbignJykpO1xyXG4gICAgICAgICAgICBzLnB1c2goJzwvZGl2PicpO1xyXG4gICAgICAgICAgICBwLnB1c2goJzwvZGl2PicpO1xyXG4gICAgICAgICAgICByZXR1cm4gcy5qb2luKCcnKSArIHAuam9pbignJyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBleGVjOmZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIG1lID0gdGhpcztcclxuICAgICAgICAgICAgaWYgKHNlbGVjdGVkSXRlbSA9PSBudWxsKSAgIHJldHVybjtcclxuICAgICAgICAgICAgJEcoJ0pfcHJldmlldycpLmlubmVySFRNTCA9IFwiXCI7XHJcbiAgICAgICAgICAgIGVkaXRvci5leGVjQ29tbWFuZCgnbXVzaWMnLCB7XHJcbiAgICAgICAgICAgICAgICB1cmw6bWUuX2dldFVybChmYWxzZSksXHJcbiAgICAgICAgICAgICAgICB3aWR0aDo0MDAsXHJcbiAgICAgICAgICAgICAgICBoZWlnaHQ6OTVcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufSkoKTtcclxuXHJcblxyXG5cclxuIl0sImZpbGUiOiJwbHVnaW5zL3VlZGl0b3IvZGlhbG9ncy9tdXNpYy9tdXNpYy5qcyJ9
