(function () {

    var onlineImage,
        backupStyle = editor.queryCommandValue('background');

    window.onload = function () {
        initTabs();
        initColorSelector();
    };

    /* 初始化tab标签 */
    function initTabs(){
        var tabs = $G('tabHeads').children;
        for (var i = 0; i < tabs.length; i++) {
            domUtils.on(tabs[i], "click", function (e) {
                var target = e.target || e.srcElement;
                for (var j = 0; j < tabs.length; j++) {
                    if(tabs[j] == target){
                        tabs[j].className = "focus";
                        var contentId = tabs[j].getAttribute('data-content-id');
                        $G(contentId).style.display = "block";
                        if(contentId == 'imgManager') {
                            initImagePanel();
                        }
                    }else {
                        tabs[j].className = "";
                        $G(tabs[j].getAttribute('data-content-id')).style.display = "none";
                    }
                }
            });
        }
    }

    /* 初始化颜色设置 */
    function initColorSelector () {
        var obj = editor.queryCommandValue('background');
        if (obj) {
            var color = obj['background-color'],
                repeat = obj['background-repeat'] || 'repeat',
                image = obj['background-image'] || '',
                position = obj['background-position'] || 'center center',
                pos = position.split(' '),
                x = parseInt(pos[0]) || 0,
                y = parseInt(pos[1]) || 0;

            if(repeat == 'no-repeat' && (x || y)) repeat = 'self';

            image = image.match(/url[\s]*\(([^\)]*)\)/);
            image = image ? image[1]:'';
            updateFormState('colored', color, image, repeat, x, y);
        } else {
            updateFormState();
        }

        var updateHandler = function () {
            updateFormState();
            updateBackground();
        }
        domUtils.on($G('nocolorRadio'), 'click', updateBackground);
        domUtils.on($G('coloredRadio'), 'click', updateHandler);
        domUtils.on($G('url'), 'keyup', function(){
            if($G('url').value && $G('alignment').style.display == "none") {
                utils.each($G('repeatType').children, function(item){
                    item.selected = ('repeat' == item.getAttribute('value') ? 'selected':false);
                });
            }
            updateHandler();
        });
        domUtils.on($G('repeatType'), 'change', updateHandler);
        domUtils.on($G('x'), 'keyup', updateBackground);
        domUtils.on($G('y'), 'keyup', updateBackground);

        initColorPicker();
    }

    /* 初始化颜色选择器 */
    function initColorPicker() {
        var me = editor,
            cp = $G("colorPicker");

        /* 生成颜色选择器ui对象 */
        var popup = new UE.ui.Popup({
            content: new UE.ui.ColorPicker({
                noColorText: me.getLang("clearColor"),
                editor: me,
                onpickcolor: function (t, color) {
                    updateFormState('colored', color);
                    updateBackground();
                    UE.ui.Popup.postHide();
                },
                onpicknocolor: function (t, color) {
                    updateFormState('colored', 'transparent');
                    updateBackground();
                    UE.ui.Popup.postHide();
                }
            }),
            editor: me,
            onhide: function () {
            }
        });

        /* 设置颜色选择器 */
        domUtils.on(cp, "click", function () {
            popup.showAnchor(this);
        });
        domUtils.on(document, 'mousedown', function (evt) {
            var el = evt.target || evt.srcElement;
            UE.ui.Popup.postHide(el);
        });
        domUtils.on(window, 'scroll', function () {
            UE.ui.Popup.postHide();
        });
    }

    /* 初始化在线图片列表 */
    function initImagePanel() {
        onlineImage = onlineImage || new OnlineImage('imageList');
    }

    /* 更新背景色设置面板 */
    function updateFormState (radio, color, url, align, x, y) {
        var nocolorRadio = $G('nocolorRadio'),
            coloredRadio = $G('coloredRadio');

        if(radio) {
            nocolorRadio.checked = (radio == 'colored' ? false:'checked');
            coloredRadio.checked = (radio == 'colored' ? 'checked':false);
        }
        if(color) {
            domUtils.setStyle($G("colorPicker"), "background-color", color);
        }

        if(url && /^\//.test(url)) {
            var a = document.createElement('a');
            a.href = url;
            browser.ie && (a.href = a.href);
            url = browser.ie ? a.href:(a.protocol + '//' + a.host + a.pathname + a.search + a.hash);
        }

        if(url || url === '') {
            $G('url').value = url;
        }
        if(align) {
            utils.each($G('repeatType').children, function(item){
                item.selected = (align == item.getAttribute('value') ? 'selected':false);
            });
        }
        if(x || y) {
            $G('x').value = parseInt(x) || 0;
            $G('y').value = parseInt(y) || 0;
        }

        $G('alignment').style.display = coloredRadio.checked && $G('url').value ? '':'none';
        $G('custom').style.display = coloredRadio.checked && $G('url').value && $G('repeatType').value == 'self' ? '':'none';
    }

    /* 更新背景颜色 */
    function updateBackground () {
        if ($G('coloredRadio').checked) {
            var color = domUtils.getStyle($G("colorPicker"), "background-color"),
                bgimg = $G("url").value,
                align = $G("repeatType").value,
                backgroundObj = {
                    "background-repeat": "no-repeat",
                    "background-position": "center center"
                };

            if (color) backgroundObj["background-color"] = color;
            if (bgimg) backgroundObj["background-image"] = 'url(' + bgimg + ')';
            if (align == 'self') {
                backgroundObj["background-position"] = $G("x").value + "px " + $G("y").value + "px";
            } else if (align == 'repeat-x' || align == 'repeat-y' || align == 'repeat') {
                backgroundObj["background-repeat"] = align;
            }

            editor.execCommand('background', backgroundObj);
        } else {
            editor.execCommand('background', null);
        }
    }


    /* 在线图片 */
    function OnlineImage(target) {
        this.container = utils.isString(target) ? document.getElementById(target) : target;
        this.init();
    }
    OnlineImage.prototype = {
        init: function () {
            this.reset();
            this.initEvents();
        },
        /* 初始化容器 */
        initContainer: function () {
            this.container.innerHTML = '';
            this.list = document.createElement('ul');
            this.clearFloat = document.createElement('li');

            domUtils.addClass(this.list, 'list');
            domUtils.addClass(this.clearFloat, 'clearFloat');

            this.list.id = 'imageListUl';
            this.list.appendChild(this.clearFloat);
            this.container.appendChild(this.list);
        },
        /* 初始化滚动事件,滚动到地步自动拉取数据 */
        initEvents: function () {
            var _this = this;

            /* 滚动拉取图片 */
            domUtils.on($G('imageList'), 'scroll', function(e){
                var panel = this;
                if (panel.scrollHeight - (panel.offsetHeight + panel.scrollTop) < 10) {
                    _this.getImageData();
                }
            });
            /* 选中图片 */
            domUtils.on(this.container, 'click', function (e) {
                var target = e.target || e.srcElement,
                    li = target.parentNode,
                    nodes = $G('imageListUl').childNodes;

                if (li.tagName.toLowerCase() == 'li') {
                    updateFormState('nocolor', null, '');
                    for (var i = 0, node; node = nodes[i++];) {
                        if (node == li && !domUtils.hasClass(node, 'selected')) {
                            domUtils.addClass(node, 'selected');
                            updateFormState('colored', null, li.firstChild.getAttribute("_src"), 'repeat');
                        } else {
                            domUtils.removeClasses(node, 'selected');
                        }
                    }
                    updateBackground();
                }
            });
        },
        /* 初始化第一次的数据 */
        initData: function () {

            /* 拉取数据需要使用的值 */
            this.state = 0;
            this.listSize = editor.getOpt('imageManagerListSize');
            this.listIndex = 0;
            this.listEnd = false;

            /* 第一次拉取数据 */
            this.getImageData();
        },
        /* 重置界面 */
        reset: function() {
            this.initContainer();
            this.initData();
        },
        /* 向后台拉取图片列表数据 */
        getImageData: function () {
            var _this = this;

            if(!_this.listEnd && !this.isLoadingData) {
                this.isLoadingData = true;
                var url = editor.getActionUrl(editor.getOpt('imageManagerActionName')),
                    isJsonp = utils.isCrossDomainUrl(url);
                ajax.request(url, {
                    'timeout': 100000,
                    'dataType': isJsonp ? 'jsonp':'',
                    'data': utils.extend({
                            start: this.listIndex,
                            size: this.listSize
                        }, editor.queryCommandValue('serverparam')),
                    'method': 'get',
                    'onsuccess': function (r) {
                        try {
                            var json = isJsonp ? r:eval('(' + r.responseText + ')');
                            if (json.state == 'SUCCESS') {
                                _this.pushData(json.list);
                                _this.listIndex = parseInt(json.start) + parseInt(json.list.length);
                                if(_this.listIndex >= json.total) {
                                    _this.listEnd = true;
                                }
                                _this.isLoadingData = false;
                            }
                        } catch (e) {
                            if(r.responseText.indexOf('ue_separate_ue') != -1) {
                                var list = r.responseText.split(r.responseText);
                                _this.pushData(list);
                                _this.listIndex = parseInt(list.length);
                                _this.listEnd = true;
                                _this.isLoadingData = false;
                            }
                        }
                    },
                    'onerror': function () {
                        _this.isLoadingData = false;
                    }
                });
            }
        },
        /* 添加图片到列表界面上 */
        pushData: function (list) {
            var i, item, img, icon, _this = this,
                urlPrefix = editor.getOpt('imageManagerUrlPrefix');
            for (i = 0; i < list.length; i++) {
                if(list[i] && list[i].url) {
                    item = document.createElement('li');
                    img = document.createElement('img');
                    icon = document.createElement('span');

                    domUtils.on(img, 'load', (function(image){
                        return function(){
                            _this.scale(image, image.parentNode.offsetWidth, image.parentNode.offsetHeight);
                        }
                    })(img));
                    img.width = 113;
                    img.setAttribute('src', urlPrefix + list[i].url + (list[i].url.indexOf('?') == -1 ? '?noCache=':'&noCache=') + (+new Date()).toString(36) );
                    img.setAttribute('_src', urlPrefix + list[i].url);
                    domUtils.addClass(icon, 'icon');

                    item.appendChild(img);
                    item.appendChild(icon);
                    this.list.insertBefore(item, this.clearFloat);
                }
            }
        },
        /* 改变图片大小 */
        scale: function (img, w, h, type) {
            var ow = img.width,
                oh = img.height;

            if (type == 'justify') {
                if (ow >= oh) {
                    img.width = w;
                    img.height = h * oh / ow;
                    img.style.marginLeft = '-' + parseInt((img.width - w) / 2) + 'px';
                } else {
                    img.width = w * ow / oh;
                    img.height = h;
                    img.style.marginTop = '-' + parseInt((img.height - h) / 2) + 'px';
                }
            } else {
                if (ow >= oh) {
                    img.width = w * ow / oh;
                    img.height = h;
                    img.style.marginLeft = '-' + parseInt((img.width - w) / 2) + 'px';
                } else {
                    img.width = w;
                    img.height = h * oh / ow;
                    img.style.marginTop = '-' + parseInt((img.height - h) / 2) + 'px';
                }
            }
        },
        getInsertList: function () {
            var i, lis = this.list.children, list = [], align = getAlign();
            for (i = 0; i < lis.length; i++) {
                if (domUtils.hasClass(lis[i], 'selected')) {
                    var img = lis[i].firstChild,
                        src = img.getAttribute('_src');
                    list.push({
                        src: src,
                        _src: src,
                        floatStyle: align
                    });
                }

            }
            return list;
        }
    };

    dialog.onok = function () {
        updateBackground();
        editor.fireEvent('saveScene');
    };
    dialog.oncancel = function () {
        editor.execCommand('background', backupStyle);
    };

})();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvZGlhbG9ncy9iYWNrZ3JvdW5kL2JhY2tncm91bmQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICB2YXIgb25saW5lSW1hZ2UsXHJcbiAgICAgICAgYmFja3VwU3R5bGUgPSBlZGl0b3IucXVlcnlDb21tYW5kVmFsdWUoJ2JhY2tncm91bmQnKTtcclxuXHJcbiAgICB3aW5kb3cub25sb2FkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGluaXRUYWJzKCk7XHJcbiAgICAgICAgaW5pdENvbG9yU2VsZWN0b3IoKTtcclxuICAgIH07XHJcblxyXG4gICAgLyog5Yid5aeL5YyWdGFi5qCH562+ICovXHJcbiAgICBmdW5jdGlvbiBpbml0VGFicygpe1xyXG4gICAgICAgIHZhciB0YWJzID0gJEcoJ3RhYkhlYWRzJykuY2hpbGRyZW47XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0YWJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGRvbVV0aWxzLm9uKHRhYnNbaV0sIFwiY2xpY2tcIiwgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgICAgIHZhciB0YXJnZXQgPSBlLnRhcmdldCB8fCBlLnNyY0VsZW1lbnQ7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRhYnMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBpZih0YWJzW2pdID09IHRhcmdldCl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhYnNbal0uY2xhc3NOYW1lID0gXCJmb2N1c1wiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY29udGVudElkID0gdGFic1tqXS5nZXRBdHRyaWJ1dGUoJ2RhdGEtY29udGVudC1pZCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkRyhjb250ZW50SWQpLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKGNvbnRlbnRJZCA9PSAnaW1nTWFuYWdlcicpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluaXRJbWFnZVBhbmVsKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9ZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhYnNbal0uY2xhc3NOYW1lID0gXCJcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJEcodGFic1tqXS5nZXRBdHRyaWJ1dGUoJ2RhdGEtY29udGVudC1pZCcpKS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyog5Yid5aeL5YyW6aKc6Imy6K6+572uICovXHJcbiAgICBmdW5jdGlvbiBpbml0Q29sb3JTZWxlY3RvciAoKSB7XHJcbiAgICAgICAgdmFyIG9iaiA9IGVkaXRvci5xdWVyeUNvbW1hbmRWYWx1ZSgnYmFja2dyb3VuZCcpO1xyXG4gICAgICAgIGlmIChvYmopIHtcclxuICAgICAgICAgICAgdmFyIGNvbG9yID0gb2JqWydiYWNrZ3JvdW5kLWNvbG9yJ10sXHJcbiAgICAgICAgICAgICAgICByZXBlYXQgPSBvYmpbJ2JhY2tncm91bmQtcmVwZWF0J10gfHwgJ3JlcGVhdCcsXHJcbiAgICAgICAgICAgICAgICBpbWFnZSA9IG9ialsnYmFja2dyb3VuZC1pbWFnZSddIHx8ICcnLFxyXG4gICAgICAgICAgICAgICAgcG9zaXRpb24gPSBvYmpbJ2JhY2tncm91bmQtcG9zaXRpb24nXSB8fCAnY2VudGVyIGNlbnRlcicsXHJcbiAgICAgICAgICAgICAgICBwb3MgPSBwb3NpdGlvbi5zcGxpdCgnICcpLFxyXG4gICAgICAgICAgICAgICAgeCA9IHBhcnNlSW50KHBvc1swXSkgfHwgMCxcclxuICAgICAgICAgICAgICAgIHkgPSBwYXJzZUludChwb3NbMV0pIHx8IDA7XHJcblxyXG4gICAgICAgICAgICBpZihyZXBlYXQgPT0gJ25vLXJlcGVhdCcgJiYgKHggfHwgeSkpIHJlcGVhdCA9ICdzZWxmJztcclxuXHJcbiAgICAgICAgICAgIGltYWdlID0gaW1hZ2UubWF0Y2goL3VybFtcXHNdKlxcKChbXlxcKV0qKVxcKS8pO1xyXG4gICAgICAgICAgICBpbWFnZSA9IGltYWdlID8gaW1hZ2VbMV06Jyc7XHJcbiAgICAgICAgICAgIHVwZGF0ZUZvcm1TdGF0ZSgnY29sb3JlZCcsIGNvbG9yLCBpbWFnZSwgcmVwZWF0LCB4LCB5KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB1cGRhdGVGb3JtU3RhdGUoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciB1cGRhdGVIYW5kbGVyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB1cGRhdGVGb3JtU3RhdGUoKTtcclxuICAgICAgICAgICAgdXBkYXRlQmFja2dyb3VuZCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBkb21VdGlscy5vbigkRygnbm9jb2xvclJhZGlvJyksICdjbGljaycsIHVwZGF0ZUJhY2tncm91bmQpO1xyXG4gICAgICAgIGRvbVV0aWxzLm9uKCRHKCdjb2xvcmVkUmFkaW8nKSwgJ2NsaWNrJywgdXBkYXRlSGFuZGxlcik7XHJcbiAgICAgICAgZG9tVXRpbHMub24oJEcoJ3VybCcpLCAna2V5dXAnLCBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICBpZigkRygndXJsJykudmFsdWUgJiYgJEcoJ2FsaWdubWVudCcpLnN0eWxlLmRpc3BsYXkgPT0gXCJub25lXCIpIHtcclxuICAgICAgICAgICAgICAgIHV0aWxzLmVhY2goJEcoJ3JlcGVhdFR5cGUnKS5jaGlsZHJlbiwgZnVuY3Rpb24oaXRlbSl7XHJcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5zZWxlY3RlZCA9ICgncmVwZWF0JyA9PSBpdGVtLmdldEF0dHJpYnV0ZSgndmFsdWUnKSA/ICdzZWxlY3RlZCc6ZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdXBkYXRlSGFuZGxlcigpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGRvbVV0aWxzLm9uKCRHKCdyZXBlYXRUeXBlJyksICdjaGFuZ2UnLCB1cGRhdGVIYW5kbGVyKTtcclxuICAgICAgICBkb21VdGlscy5vbigkRygneCcpLCAna2V5dXAnLCB1cGRhdGVCYWNrZ3JvdW5kKTtcclxuICAgICAgICBkb21VdGlscy5vbigkRygneScpLCAna2V5dXAnLCB1cGRhdGVCYWNrZ3JvdW5kKTtcclxuXHJcbiAgICAgICAgaW5pdENvbG9yUGlja2VyKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyog5Yid5aeL5YyW6aKc6Imy6YCJ5oup5ZmoICovXHJcbiAgICBmdW5jdGlvbiBpbml0Q29sb3JQaWNrZXIoKSB7XHJcbiAgICAgICAgdmFyIG1lID0gZWRpdG9yLFxyXG4gICAgICAgICAgICBjcCA9ICRHKFwiY29sb3JQaWNrZXJcIik7XHJcblxyXG4gICAgICAgIC8qIOeUn+aIkOminOiJsumAieaLqeWZqHVp5a+56LGhICovXHJcbiAgICAgICAgdmFyIHBvcHVwID0gbmV3IFVFLnVpLlBvcHVwKHtcclxuICAgICAgICAgICAgY29udGVudDogbmV3IFVFLnVpLkNvbG9yUGlja2VyKHtcclxuICAgICAgICAgICAgICAgIG5vQ29sb3JUZXh0OiBtZS5nZXRMYW5nKFwiY2xlYXJDb2xvclwiKSxcclxuICAgICAgICAgICAgICAgIGVkaXRvcjogbWUsXHJcbiAgICAgICAgICAgICAgICBvbnBpY2tjb2xvcjogZnVuY3Rpb24gKHQsIGNvbG9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlRm9ybVN0YXRlKCdjb2xvcmVkJywgY29sb3IpO1xyXG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZUJhY2tncm91bmQoKTtcclxuICAgICAgICAgICAgICAgICAgICBVRS51aS5Qb3B1cC5wb3N0SGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIG9ucGlja25vY29sb3I6IGZ1bmN0aW9uICh0LCBjb2xvcikge1xyXG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZUZvcm1TdGF0ZSgnY29sb3JlZCcsICd0cmFuc3BhcmVudCcpO1xyXG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZUJhY2tncm91bmQoKTtcclxuICAgICAgICAgICAgICAgICAgICBVRS51aS5Qb3B1cC5wb3N0SGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KSxcclxuICAgICAgICAgICAgZWRpdG9yOiBtZSxcclxuICAgICAgICAgICAgb25oaWRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLyog6K6+572u6aKc6Imy6YCJ5oup5ZmoICovXHJcbiAgICAgICAgZG9tVXRpbHMub24oY3AsIFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBwb3B1cC5zaG93QW5jaG9yKHRoaXMpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGRvbVV0aWxzLm9uKGRvY3VtZW50LCAnbW91c2Vkb3duJywgZnVuY3Rpb24gKGV2dCkge1xyXG4gICAgICAgICAgICB2YXIgZWwgPSBldnQudGFyZ2V0IHx8IGV2dC5zcmNFbGVtZW50O1xyXG4gICAgICAgICAgICBVRS51aS5Qb3B1cC5wb3N0SGlkZShlbCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgZG9tVXRpbHMub24od2luZG93LCAnc2Nyb2xsJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBVRS51aS5Qb3B1cC5wb3N0SGlkZSgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qIOWIneWni+WMluWcqOe6v+WbvueJh+WIl+ihqCAqL1xyXG4gICAgZnVuY3Rpb24gaW5pdEltYWdlUGFuZWwoKSB7XHJcbiAgICAgICAgb25saW5lSW1hZ2UgPSBvbmxpbmVJbWFnZSB8fCBuZXcgT25saW5lSW1hZ2UoJ2ltYWdlTGlzdCcpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qIOabtOaWsOiDjOaZr+iJsuiuvue9rumdouadvyAqL1xyXG4gICAgZnVuY3Rpb24gdXBkYXRlRm9ybVN0YXRlIChyYWRpbywgY29sb3IsIHVybCwgYWxpZ24sIHgsIHkpIHtcclxuICAgICAgICB2YXIgbm9jb2xvclJhZGlvID0gJEcoJ25vY29sb3JSYWRpbycpLFxyXG4gICAgICAgICAgICBjb2xvcmVkUmFkaW8gPSAkRygnY29sb3JlZFJhZGlvJyk7XHJcblxyXG4gICAgICAgIGlmKHJhZGlvKSB7XHJcbiAgICAgICAgICAgIG5vY29sb3JSYWRpby5jaGVja2VkID0gKHJhZGlvID09ICdjb2xvcmVkJyA/IGZhbHNlOidjaGVja2VkJyk7XHJcbiAgICAgICAgICAgIGNvbG9yZWRSYWRpby5jaGVja2VkID0gKHJhZGlvID09ICdjb2xvcmVkJyA/ICdjaGVja2VkJzpmYWxzZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKGNvbG9yKSB7XHJcbiAgICAgICAgICAgIGRvbVV0aWxzLnNldFN0eWxlKCRHKFwiY29sb3JQaWNrZXJcIiksIFwiYmFja2dyb3VuZC1jb2xvclwiLCBjb2xvcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZih1cmwgJiYgL15cXC8vLnRlc3QodXJsKSkge1xyXG4gICAgICAgICAgICB2YXIgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcclxuICAgICAgICAgICAgYS5ocmVmID0gdXJsO1xyXG4gICAgICAgICAgICBicm93c2VyLmllICYmIChhLmhyZWYgPSBhLmhyZWYpO1xyXG4gICAgICAgICAgICB1cmwgPSBicm93c2VyLmllID8gYS5ocmVmOihhLnByb3RvY29sICsgJy8vJyArIGEuaG9zdCArIGEucGF0aG5hbWUgKyBhLnNlYXJjaCArIGEuaGFzaCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZih1cmwgfHwgdXJsID09PSAnJykge1xyXG4gICAgICAgICAgICAkRygndXJsJykudmFsdWUgPSB1cmw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKGFsaWduKSB7XHJcbiAgICAgICAgICAgIHV0aWxzLmVhY2goJEcoJ3JlcGVhdFR5cGUnKS5jaGlsZHJlbiwgZnVuY3Rpb24oaXRlbSl7XHJcbiAgICAgICAgICAgICAgICBpdGVtLnNlbGVjdGVkID0gKGFsaWduID09IGl0ZW0uZ2V0QXR0cmlidXRlKCd2YWx1ZScpID8gJ3NlbGVjdGVkJzpmYWxzZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZih4IHx8IHkpIHtcclxuICAgICAgICAgICAgJEcoJ3gnKS52YWx1ZSA9IHBhcnNlSW50KHgpIHx8IDA7XHJcbiAgICAgICAgICAgICRHKCd5JykudmFsdWUgPSBwYXJzZUludCh5KSB8fCAwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgJEcoJ2FsaWdubWVudCcpLnN0eWxlLmRpc3BsYXkgPSBjb2xvcmVkUmFkaW8uY2hlY2tlZCAmJiAkRygndXJsJykudmFsdWUgPyAnJzonbm9uZSc7XHJcbiAgICAgICAgJEcoJ2N1c3RvbScpLnN0eWxlLmRpc3BsYXkgPSBjb2xvcmVkUmFkaW8uY2hlY2tlZCAmJiAkRygndXJsJykudmFsdWUgJiYgJEcoJ3JlcGVhdFR5cGUnKS52YWx1ZSA9PSAnc2VsZicgPyAnJzonbm9uZSc7XHJcbiAgICB9XHJcblxyXG4gICAgLyog5pu05paw6IOM5pmv6aKc6ImyICovXHJcbiAgICBmdW5jdGlvbiB1cGRhdGVCYWNrZ3JvdW5kICgpIHtcclxuICAgICAgICBpZiAoJEcoJ2NvbG9yZWRSYWRpbycpLmNoZWNrZWQpIHtcclxuICAgICAgICAgICAgdmFyIGNvbG9yID0gZG9tVXRpbHMuZ2V0U3R5bGUoJEcoXCJjb2xvclBpY2tlclwiKSwgXCJiYWNrZ3JvdW5kLWNvbG9yXCIpLFxyXG4gICAgICAgICAgICAgICAgYmdpbWcgPSAkRyhcInVybFwiKS52YWx1ZSxcclxuICAgICAgICAgICAgICAgIGFsaWduID0gJEcoXCJyZXBlYXRUeXBlXCIpLnZhbHVlLFxyXG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZE9iaiA9IHtcclxuICAgICAgICAgICAgICAgICAgICBcImJhY2tncm91bmQtcmVwZWF0XCI6IFwibm8tcmVwZWF0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJiYWNrZ3JvdW5kLXBvc2l0aW9uXCI6IFwiY2VudGVyIGNlbnRlclwiXHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgaWYgKGNvbG9yKSBiYWNrZ3JvdW5kT2JqW1wiYmFja2dyb3VuZC1jb2xvclwiXSA9IGNvbG9yO1xyXG4gICAgICAgICAgICBpZiAoYmdpbWcpIGJhY2tncm91bmRPYmpbXCJiYWNrZ3JvdW5kLWltYWdlXCJdID0gJ3VybCgnICsgYmdpbWcgKyAnKSc7XHJcbiAgICAgICAgICAgIGlmIChhbGlnbiA9PSAnc2VsZicpIHtcclxuICAgICAgICAgICAgICAgIGJhY2tncm91bmRPYmpbXCJiYWNrZ3JvdW5kLXBvc2l0aW9uXCJdID0gJEcoXCJ4XCIpLnZhbHVlICsgXCJweCBcIiArICRHKFwieVwiKS52YWx1ZSArIFwicHhcIjtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChhbGlnbiA9PSAncmVwZWF0LXgnIHx8IGFsaWduID09ICdyZXBlYXQteScgfHwgYWxpZ24gPT0gJ3JlcGVhdCcpIHtcclxuICAgICAgICAgICAgICAgIGJhY2tncm91bmRPYmpbXCJiYWNrZ3JvdW5kLXJlcGVhdFwiXSA9IGFsaWduO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlZGl0b3IuZXhlY0NvbW1hbmQoJ2JhY2tncm91bmQnLCBiYWNrZ3JvdW5kT2JqKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBlZGl0b3IuZXhlY0NvbW1hbmQoJ2JhY2tncm91bmQnLCBudWxsKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8qIOWcqOe6v+WbvueJhyAqL1xyXG4gICAgZnVuY3Rpb24gT25saW5lSW1hZ2UodGFyZ2V0KSB7XHJcbiAgICAgICAgdGhpcy5jb250YWluZXIgPSB1dGlscy5pc1N0cmluZyh0YXJnZXQpID8gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGFyZ2V0KSA6IHRhcmdldDtcclxuICAgICAgICB0aGlzLmluaXQoKTtcclxuICAgIH1cclxuICAgIE9ubGluZUltYWdlLnByb3RvdHlwZSA9IHtcclxuICAgICAgICBpbml0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVzZXQoKTtcclxuICAgICAgICAgICAgdGhpcy5pbml0RXZlbnRzKCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAvKiDliJ3lp4vljJblrrnlmaggKi9cclxuICAgICAgICBpbml0Q29udGFpbmVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmlubmVySFRNTCA9ICcnO1xyXG4gICAgICAgICAgICB0aGlzLmxpc3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd1bCcpO1xyXG4gICAgICAgICAgICB0aGlzLmNsZWFyRmxvYXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xyXG5cclxuICAgICAgICAgICAgZG9tVXRpbHMuYWRkQ2xhc3ModGhpcy5saXN0LCAnbGlzdCcpO1xyXG4gICAgICAgICAgICBkb21VdGlscy5hZGRDbGFzcyh0aGlzLmNsZWFyRmxvYXQsICdjbGVhckZsb2F0Jyk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmxpc3QuaWQgPSAnaW1hZ2VMaXN0VWwnO1xyXG4gICAgICAgICAgICB0aGlzLmxpc3QuYXBwZW5kQ2hpbGQodGhpcy5jbGVhckZsb2F0KTtcclxuICAgICAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5saXN0KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIC8qIOWIneWni+WMlua7muWKqOS6i+S7tizmu5rliqjliLDlnLDmraXoh6rliqjmi4nlj5bmlbDmja4gKi9cclxuICAgICAgICBpbml0RXZlbnRzOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcblxyXG4gICAgICAgICAgICAvKiDmu5rliqjmi4nlj5blm77niYcgKi9cclxuICAgICAgICAgICAgZG9tVXRpbHMub24oJEcoJ2ltYWdlTGlzdCcpLCAnc2Nyb2xsJywgZnVuY3Rpb24oZSl7XHJcbiAgICAgICAgICAgICAgICB2YXIgcGFuZWwgPSB0aGlzO1xyXG4gICAgICAgICAgICAgICAgaWYgKHBhbmVsLnNjcm9sbEhlaWdodCAtIChwYW5lbC5vZmZzZXRIZWlnaHQgKyBwYW5lbC5zY3JvbGxUb3ApIDwgMTApIHtcclxuICAgICAgICAgICAgICAgICAgICBfdGhpcy5nZXRJbWFnZURhdGEoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIC8qIOmAieS4reWbvueJhyAqL1xyXG4gICAgICAgICAgICBkb21VdGlscy5vbih0aGlzLmNvbnRhaW5lciwgJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgICAgIHZhciB0YXJnZXQgPSBlLnRhcmdldCB8fCBlLnNyY0VsZW1lbnQsXHJcbiAgICAgICAgICAgICAgICAgICAgbGkgPSB0YXJnZXQucGFyZW50Tm9kZSxcclxuICAgICAgICAgICAgICAgICAgICBub2RlcyA9ICRHKCdpbWFnZUxpc3RVbCcpLmNoaWxkTm9kZXM7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGxpLnRhZ05hbWUudG9Mb3dlckNhc2UoKSA9PSAnbGknKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlRm9ybVN0YXRlKCdub2NvbG9yJywgbnVsbCwgJycpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBub2RlOyBub2RlID0gbm9kZXNbaSsrXTspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGUgPT0gbGkgJiYgIWRvbVV0aWxzLmhhc0NsYXNzKG5vZGUsICdzZWxlY3RlZCcpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb21VdGlscy5hZGRDbGFzcyhub2RlLCAnc2VsZWN0ZWQnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZUZvcm1TdGF0ZSgnY29sb3JlZCcsIG51bGwsIGxpLmZpcnN0Q2hpbGQuZ2V0QXR0cmlidXRlKFwiX3NyY1wiKSwgJ3JlcGVhdCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9tVXRpbHMucmVtb3ZlQ2xhc3Nlcyhub2RlLCAnc2VsZWN0ZWQnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB1cGRhdGVCYWNrZ3JvdW5kKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgLyog5Yid5aeL5YyW56ys5LiA5qyh55qE5pWw5o2uICovXHJcbiAgICAgICAgaW5pdERhdGE6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIC8qIOaLieWPluaVsOaNrumcgOimgeS9v+eUqOeahOWAvCAqL1xyXG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gMDtcclxuICAgICAgICAgICAgdGhpcy5saXN0U2l6ZSA9IGVkaXRvci5nZXRPcHQoJ2ltYWdlTWFuYWdlckxpc3RTaXplJyk7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdEluZGV4ID0gMDtcclxuICAgICAgICAgICAgdGhpcy5saXN0RW5kID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICAvKiDnrKzkuIDmrKHmi4nlj5bmlbDmja4gKi9cclxuICAgICAgICAgICAgdGhpcy5nZXRJbWFnZURhdGEoKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIC8qIOmHjee9rueVjOmdoiAqL1xyXG4gICAgICAgIHJlc2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgdGhpcy5pbml0Q29udGFpbmVyKCk7XHJcbiAgICAgICAgICAgIHRoaXMuaW5pdERhdGEoKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIC8qIOWQkeWQjuWPsOaLieWPluWbvueJh+WIl+ihqOaVsOaNriAqL1xyXG4gICAgICAgIGdldEltYWdlRGF0YTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG5cclxuICAgICAgICAgICAgaWYoIV90aGlzLmxpc3RFbmQgJiYgIXRoaXMuaXNMb2FkaW5nRGF0YSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pc0xvYWRpbmdEYXRhID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHZhciB1cmwgPSBlZGl0b3IuZ2V0QWN0aW9uVXJsKGVkaXRvci5nZXRPcHQoJ2ltYWdlTWFuYWdlckFjdGlvbk5hbWUnKSksXHJcbiAgICAgICAgICAgICAgICAgICAgaXNKc29ucCA9IHV0aWxzLmlzQ3Jvc3NEb21haW5VcmwodXJsKTtcclxuICAgICAgICAgICAgICAgIGFqYXgucmVxdWVzdCh1cmwsIHtcclxuICAgICAgICAgICAgICAgICAgICAndGltZW91dCc6IDEwMDAwMCxcclxuICAgICAgICAgICAgICAgICAgICAnZGF0YVR5cGUnOiBpc0pzb25wID8gJ2pzb25wJzonJyxcclxuICAgICAgICAgICAgICAgICAgICAnZGF0YSc6IHV0aWxzLmV4dGVuZCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydDogdGhpcy5saXN0SW5kZXgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaXplOiB0aGlzLmxpc3RTaXplXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIGVkaXRvci5xdWVyeUNvbW1hbmRWYWx1ZSgnc2VydmVycGFyYW0nKSksXHJcbiAgICAgICAgICAgICAgICAgICAgJ21ldGhvZCc6ICdnZXQnLFxyXG4gICAgICAgICAgICAgICAgICAgICdvbnN1Y2Nlc3MnOiBmdW5jdGlvbiAocikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGpzb24gPSBpc0pzb25wID8gcjpldmFsKCcoJyArIHIucmVzcG9uc2VUZXh0ICsgJyknKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChqc29uLnN0YXRlID09ICdTVUNDRVNTJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLnB1c2hEYXRhKGpzb24ubGlzdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMubGlzdEluZGV4ID0gcGFyc2VJbnQoanNvbi5zdGFydCkgKyBwYXJzZUludChqc29uLmxpc3QubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihfdGhpcy5saXN0SW5kZXggPj0ganNvbi50b3RhbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5saXN0RW5kID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuaXNMb2FkaW5nRGF0YSA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihyLnJlc3BvbnNlVGV4dC5pbmRleE9mKCd1ZV9zZXBhcmF0ZV91ZScpICE9IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxpc3QgPSByLnJlc3BvbnNlVGV4dC5zcGxpdChyLnJlc3BvbnNlVGV4dCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMucHVzaERhdGEobGlzdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMubGlzdEluZGV4ID0gcGFyc2VJbnQobGlzdC5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLmxpc3RFbmQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLmlzTG9hZGluZ0RhdGEgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgJ29uZXJyb3InOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLmlzTG9hZGluZ0RhdGEgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgLyog5re75Yqg5Zu+54mH5Yiw5YiX6KGo55WM6Z2i5LiKICovXHJcbiAgICAgICAgcHVzaERhdGE6IGZ1bmN0aW9uIChsaXN0KSB7XHJcbiAgICAgICAgICAgIHZhciBpLCBpdGVtLCBpbWcsIGljb24sIF90aGlzID0gdGhpcyxcclxuICAgICAgICAgICAgICAgIHVybFByZWZpeCA9IGVkaXRvci5nZXRPcHQoJ2ltYWdlTWFuYWdlclVybFByZWZpeCcpO1xyXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYobGlzdFtpXSAmJiBsaXN0W2ldLnVybCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xyXG4gICAgICAgICAgICAgICAgICAgIGltZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xyXG4gICAgICAgICAgICAgICAgICAgIGljb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGRvbVV0aWxzLm9uKGltZywgJ2xvYWQnLCAoZnVuY3Rpb24oaW1hZ2Upe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLnNjYWxlKGltYWdlLCBpbWFnZS5wYXJlbnROb2RlLm9mZnNldFdpZHRoLCBpbWFnZS5wYXJlbnROb2RlLm9mZnNldEhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KShpbWcpKTtcclxuICAgICAgICAgICAgICAgICAgICBpbWcud2lkdGggPSAxMTM7XHJcbiAgICAgICAgICAgICAgICAgICAgaW1nLnNldEF0dHJpYnV0ZSgnc3JjJywgdXJsUHJlZml4ICsgbGlzdFtpXS51cmwgKyAobGlzdFtpXS51cmwuaW5kZXhPZignPycpID09IC0xID8gJz9ub0NhY2hlPSc6JyZub0NhY2hlPScpICsgKCtuZXcgRGF0ZSgpKS50b1N0cmluZygzNikgKTtcclxuICAgICAgICAgICAgICAgICAgICBpbWcuc2V0QXR0cmlidXRlKCdfc3JjJywgdXJsUHJlZml4ICsgbGlzdFtpXS51cmwpO1xyXG4gICAgICAgICAgICAgICAgICAgIGRvbVV0aWxzLmFkZENsYXNzKGljb24sICdpY29uJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uYXBwZW5kQ2hpbGQoaW1nKTtcclxuICAgICAgICAgICAgICAgICAgICBpdGVtLmFwcGVuZENoaWxkKGljb24pO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGlzdC5pbnNlcnRCZWZvcmUoaXRlbSwgdGhpcy5jbGVhckZsb2F0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgLyog5pS55Y+Y5Zu+54mH5aSn5bCPICovXHJcbiAgICAgICAgc2NhbGU6IGZ1bmN0aW9uIChpbWcsIHcsIGgsIHR5cGUpIHtcclxuICAgICAgICAgICAgdmFyIG93ID0gaW1nLndpZHRoLFxyXG4gICAgICAgICAgICAgICAgb2ggPSBpbWcuaGVpZ2h0O1xyXG5cclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gJ2p1c3RpZnknKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAob3cgPj0gb2gpIHtcclxuICAgICAgICAgICAgICAgICAgICBpbWcud2lkdGggPSB3O1xyXG4gICAgICAgICAgICAgICAgICAgIGltZy5oZWlnaHQgPSBoICogb2ggLyBvdztcclxuICAgICAgICAgICAgICAgICAgICBpbWcuc3R5bGUubWFyZ2luTGVmdCA9ICctJyArIHBhcnNlSW50KChpbWcud2lkdGggLSB3KSAvIDIpICsgJ3B4JztcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaW1nLndpZHRoID0gdyAqIG93IC8gb2g7XHJcbiAgICAgICAgICAgICAgICAgICAgaW1nLmhlaWdodCA9IGg7XHJcbiAgICAgICAgICAgICAgICAgICAgaW1nLnN0eWxlLm1hcmdpblRvcCA9ICctJyArIHBhcnNlSW50KChpbWcuaGVpZ2h0IC0gaCkgLyAyKSArICdweCc7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpZiAob3cgPj0gb2gpIHtcclxuICAgICAgICAgICAgICAgICAgICBpbWcud2lkdGggPSB3ICogb3cgLyBvaDtcclxuICAgICAgICAgICAgICAgICAgICBpbWcuaGVpZ2h0ID0gaDtcclxuICAgICAgICAgICAgICAgICAgICBpbWcuc3R5bGUubWFyZ2luTGVmdCA9ICctJyArIHBhcnNlSW50KChpbWcud2lkdGggLSB3KSAvIDIpICsgJ3B4JztcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaW1nLndpZHRoID0gdztcclxuICAgICAgICAgICAgICAgICAgICBpbWcuaGVpZ2h0ID0gaCAqIG9oIC8gb3c7XHJcbiAgICAgICAgICAgICAgICAgICAgaW1nLnN0eWxlLm1hcmdpblRvcCA9ICctJyArIHBhcnNlSW50KChpbWcuaGVpZ2h0IC0gaCkgLyAyKSArICdweCc7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIGdldEluc2VydExpc3Q6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIGksIGxpcyA9IHRoaXMubGlzdC5jaGlsZHJlbiwgbGlzdCA9IFtdLCBhbGlnbiA9IGdldEFsaWduKCk7XHJcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBsaXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmIChkb21VdGlscy5oYXNDbGFzcyhsaXNbaV0sICdzZWxlY3RlZCcpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGltZyA9IGxpc1tpXS5maXJzdENoaWxkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzcmMgPSBpbWcuZ2V0QXR0cmlidXRlKCdfc3JjJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgbGlzdC5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3JjOiBzcmMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF9zcmM6IHNyYyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmxvYXRTdHlsZTogYWxpZ25cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGxpc3Q7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBkaWFsb2cub25vayA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB1cGRhdGVCYWNrZ3JvdW5kKCk7XHJcbiAgICAgICAgZWRpdG9yLmZpcmVFdmVudCgnc2F2ZVNjZW5lJyk7XHJcbiAgICB9O1xyXG4gICAgZGlhbG9nLm9uY2FuY2VsID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGVkaXRvci5leGVjQ29tbWFuZCgnYmFja2dyb3VuZCcsIGJhY2t1cFN0eWxlKTtcclxuICAgIH07XHJcblxyXG59KSgpOyJdLCJmaWxlIjoicGx1Z2lucy91ZWRpdG9yL2RpYWxvZ3MvYmFja2dyb3VuZC9iYWNrZ3JvdW5kLmpzIn0=
