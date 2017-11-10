/**
 * User: Jinqn
 * Date: 14-04-08
 * Time: 下午16:34
 * 上传图片对话框逻辑代码,包括tab: 远程图片/上传图片/在线图片/搜索图片
 */

(function () {

    var uploadFile,
        onlineFile;

    window.onload = function () {
        initTabs();
        initButtons();
    };

    /* 初始化tab标签 */
    function initTabs() {
        var tabs = $G('tabhead').children;
        for (var i = 0; i < tabs.length; i++) {
            domUtils.on(tabs[i], "click", function (e) {
                var target = e.target || e.srcElement;
                setTabFocus(target.getAttribute('data-content-id'));
            });
        }

        setTabFocus('upload');
    }

    /* 初始化tabbody */
    function setTabFocus(id) {
        if(!id) return;
        var i, bodyId, tabs = $G('tabhead').children;
        for (i = 0; i < tabs.length; i++) {
            bodyId = tabs[i].getAttribute('data-content-id')
            if (bodyId == id) {
                domUtils.addClass(tabs[i], 'focus');
                domUtils.addClass($G(bodyId), 'focus');
            } else {
                domUtils.removeClasses(tabs[i], 'focus');
                domUtils.removeClasses($G(bodyId), 'focus');
            }
        }
        switch (id) {
            case 'upload':
                uploadFile = uploadFile || new UploadFile('queueList');
                break;
            case 'online':
                onlineFile = onlineFile || new OnlineFile('fileList');
                break;
        }
    }

    /* 初始化onok事件 */
    function initButtons() {

        dialog.onok = function () {
            var list = [], id, tabs = $G('tabhead').children;
            for (var i = 0; i < tabs.length; i++) {
                if (domUtils.hasClass(tabs[i], 'focus')) {
                    id = tabs[i].getAttribute('data-content-id');
                    break;
                }
            }

            switch (id) {
                case 'upload':
                    list = uploadFile.getInsertList();
                    var count = uploadFile.getQueueCount();
                    if (count) {
                        $('.info', '#queueList').html('<span style="color:red;">' + '还有2个未上传文件'.replace(/[\d]/, count) + '</span>');
                        return false;
                    }
                    break;
                case 'online':
                    list = onlineFile.getInsertList();
                    break;
            }

            editor.execCommand('insertfile', list);
        };
    }


    /* 上传附件 */
    function UploadFile(target) {
        this.$wrap = target.constructor == String ? $('#' + target) : $(target);
        this.init();
    }
    UploadFile.prototype = {
        init: function () {
            this.fileList = [];
            this.initContainer();
            this.initUploader();
        },
        initContainer: function () {
            this.$queue = this.$wrap.find('.filelist');
        },
        /* 初始化容器 */
        initUploader: function () {
            var _this = this,
                $ = jQuery,    // just in case. Make sure it's not an other libaray.
                $wrap = _this.$wrap,
            // 图片容器
                $queue = $wrap.find('.filelist'),
            // 状态栏，包括进度和控制按钮
                $statusBar = $wrap.find('.statusBar'),
            // 文件总体选择信息。
                $info = $statusBar.find('.info'),
            // 上传按钮
                $upload = $wrap.find('.uploadBtn'),
            // 上传按钮
                $filePickerBtn = $wrap.find('.filePickerBtn'),
            // 上传按钮
                $filePickerBlock = $wrap.find('.filePickerBlock'),
            // 没选择文件之前的内容。
                $placeHolder = $wrap.find('.placeholder'),
            // 总体进度条
                $progress = $statusBar.find('.progress').hide(),
            // 添加的文件数量
                fileCount = 0,
            // 添加的文件总大小
                fileSize = 0,
            // 优化retina, 在retina下这个值是2
                ratio = window.devicePixelRatio || 1,
            // 缩略图大小
                thumbnailWidth = 113 * ratio,
                thumbnailHeight = 113 * ratio,
            // 可能有pedding, ready, uploading, confirm, done.
                state = '',
            // 所有文件的进度信息，key为file id
                percentages = {},
                supportTransition = (function () {
                    var s = document.createElement('p').style,
                        r = 'transition' in s ||
                            'WebkitTransition' in s ||
                            'MozTransition' in s ||
                            'msTransition' in s ||
                            'OTransition' in s;
                    s = null;
                    return r;
                })(),
            // WebUploader实例
                uploader,
                actionUrl = editor.getActionUrl(editor.getOpt('fileActionName')),
                fileMaxSize = editor.getOpt('fileMaxSize'),
                acceptExtensions = (editor.getOpt('fileAllowFiles') || []).join('').replace(/\./g, ',').replace(/^[,]/, '');;

            if (!WebUploader.Uploader.support()) {
                $('#filePickerReady').after($('<div>').html(lang.errorNotSupport)).hide();
                return;
            } else if (!editor.getOpt('fileActionName')) {
                $('#filePickerReady').after($('<div>').html(lang.errorLoadConfig)).hide();
                return;
            }

            uploader = _this.uploader = WebUploader.create({
                pick: {
                    id: '#filePickerReady',
                    label: lang.uploadSelectFile
                },
                swf: '../../third-party/webuploader/Uploader.swf',
                server: actionUrl,
                fileVal: editor.getOpt('fileFieldName'),
                duplicate: true,
                fileSingleSizeLimit: fileMaxSize,
                compress: false
            });
            uploader.addButton({
                id: '#filePickerBlock'
            });
            uploader.addButton({
                id: '#filePickerBtn',
                label: lang.uploadAddFile
            });

            setState('pedding');

            // 当有文件添加进来时执行，负责view的创建
            function addFile(file) {
                var $li = $('<li id="' + file.id + '">' +
                        '<p class="title">' + file.name + '</p>' +
                        '<p class="imgWrap"></p>' +
                        '<p class="progress"><span></span></p>' +
                        '</li>'),

                    $btns = $('<div class="file-panel">' +
                        '<span class="cancel">' + lang.uploadDelete + '</span>' +
                        '<span class="rotateRight">' + lang.uploadTurnRight + '</span>' +
                        '<span class="rotateLeft">' + lang.uploadTurnLeft + '</span></div>').appendTo($li),
                    $prgress = $li.find('p.progress span'),
                    $wrap = $li.find('p.imgWrap'),
                    $info = $('<p class="error"></p>').hide().appendTo($li),

                    showError = function (code) {
                        switch (code) {
                            case 'exceed_size':
                                text = lang.errorExceedSize;
                                break;
                            case 'interrupt':
                                text = lang.errorInterrupt;
                                break;
                            case 'http':
                                text = lang.errorHttp;
                                break;
                            case 'not_allow_type':
                                text = lang.errorFileType;
                                break;
                            default:
                                text = lang.errorUploadRetry;
                                break;
                        }
                        $info.text(text).show();
                    };

                if (file.getStatus() === 'invalid') {
                    showError(file.statusText);
                } else {
                    $wrap.text(lang.uploadPreview);
                    if ('|png|jpg|jpeg|bmp|gif|'.indexOf('|'+file.ext.toLowerCase()+'|') == -1) {
                        $wrap.empty().addClass('notimage').append('<i class="file-preview file-type-' + file.ext.toLowerCase() + '"></i>' +
                        '<span class="file-title" title="' + file.name + '">' + file.name + '</span>');
                    } else {
                        if (browser.ie && browser.version <= 7) {
                            $wrap.text(lang.uploadNoPreview);
                        } else {
                            uploader.makeThumb(file, function (error, src) {
                                if (error || !src) {
                                    $wrap.text(lang.uploadNoPreview);
                                } else {
                                    var $img = $('<img src="' + src + '">');
                                    $wrap.empty().append($img);
                                    $img.on('error', function () {
                                        $wrap.text(lang.uploadNoPreview);
                                    });
                                }
                            }, thumbnailWidth, thumbnailHeight);
                        }
                    }
                    percentages[ file.id ] = [ file.size, 0 ];
                    file.rotation = 0;

                    /* 检查文件格式 */
                    if (!file.ext || acceptExtensions.indexOf(file.ext.toLowerCase()) == -1) {
                        showError('not_allow_type');
                        uploader.removeFile(file);
                    }
                }

                file.on('statuschange', function (cur, prev) {
                    if (prev === 'progress') {
                        $prgress.hide().width(0);
                    } else if (prev === 'queued') {
                        $li.off('mouseenter mouseleave');
                        $btns.remove();
                    }
                    // 成功
                    if (cur === 'error' || cur === 'invalid') {
                        showError(file.statusText);
                        percentages[ file.id ][ 1 ] = 1;
                    } else if (cur === 'interrupt') {
                        showError('interrupt');
                    } else if (cur === 'queued') {
                        percentages[ file.id ][ 1 ] = 0;
                    } else if (cur === 'progress') {
                        $info.hide();
                        $prgress.css('display', 'block');
                    } else if (cur === 'complete') {
                    }

                    $li.removeClass('state-' + prev).addClass('state-' + cur);
                });

                $li.on('mouseenter', function () {
                    $btns.stop().animate({height: 30});
                });
                $li.on('mouseleave', function () {
                    $btns.stop().animate({height: 0});
                });

                $btns.on('click', 'span', function () {
                    var index = $(this).index(),
                        deg;

                    switch (index) {
                        case 0:
                            uploader.removeFile(file);
                            return;
                        case 1:
                            file.rotation += 90;
                            break;
                        case 2:
                            file.rotation -= 90;
                            break;
                    }

                    if (supportTransition) {
                        deg = 'rotate(' + file.rotation + 'deg)';
                        $wrap.css({
                            '-webkit-transform': deg,
                            '-mos-transform': deg,
                            '-o-transform': deg,
                            'transform': deg
                        });
                    } else {
                        $wrap.css('filter', 'progid:DXImageTransform.Microsoft.BasicImage(rotation=' + (~~((file.rotation / 90) % 4 + 4) % 4) + ')');
                    }

                });

                $li.insertBefore($filePickerBlock);
            }

            // 负责view的销毁
            function removeFile(file) {
                var $li = $('#' + file.id);
                delete percentages[ file.id ];
                updateTotalProgress();
                $li.off().find('.file-panel').off().end().remove();
            }

            function updateTotalProgress() {
                var loaded = 0,
                    total = 0,
                    spans = $progress.children(),
                    percent;

                $.each(percentages, function (k, v) {
                    total += v[ 0 ];
                    loaded += v[ 0 ] * v[ 1 ];
                });

                percent = total ? loaded / total : 0;

                spans.eq(0).text(Math.round(percent * 100) + '%');
                spans.eq(1).css('width', Math.round(percent * 100) + '%');
                updateStatus();
            }

            function setState(val, files) {

                if (val != state) {

                    var stats = uploader.getStats();

                    $upload.removeClass('state-' + state);
                    $upload.addClass('state-' + val);

                    switch (val) {

                        /* 未选择文件 */
                        case 'pedding':
                            $queue.addClass('element-invisible');
                            $statusBar.addClass('element-invisible');
                            $placeHolder.removeClass('element-invisible');
                            $progress.hide(); $info.hide();
                            uploader.refresh();
                            break;

                        /* 可以开始上传 */
                        case 'ready':
                            $placeHolder.addClass('element-invisible');
                            $queue.removeClass('element-invisible');
                            $statusBar.removeClass('element-invisible');
                            $progress.hide(); $info.show();
                            $upload.text(lang.uploadStart);
                            uploader.refresh();
                            break;

                        /* 上传中 */
                        case 'uploading':
                            $progress.show(); $info.hide();
                            $upload.text(lang.uploadPause);
                            break;

                        /* 暂停上传 */
                        case 'paused':
                            $progress.show(); $info.hide();
                            $upload.text(lang.uploadContinue);
                            break;

                        case 'confirm':
                            $progress.show(); $info.hide();
                            $upload.text(lang.uploadStart);

                            stats = uploader.getStats();
                            if (stats.successNum && !stats.uploadFailNum) {
                                setState('finish');
                                return;
                            }
                            break;

                        case 'finish':
                            $progress.hide(); $info.show();
                            if (stats.uploadFailNum) {
                                $upload.text(lang.uploadRetry);
                            } else {
                                $upload.text(lang.uploadStart);
                            }
                            break;
                    }

                    state = val;
                    updateStatus();

                }

                if (!_this.getQueueCount()) {
                    $upload.addClass('disabled')
                } else {
                    $upload.removeClass('disabled')
                }

            }

            function updateStatus() {
                var text = '', stats;

                if (state === 'ready') {
                    text = lang.updateStatusReady.replace('_', fileCount).replace('_KB', WebUploader.formatSize(fileSize));
                } else if (state === 'confirm') {
                    stats = uploader.getStats();
                    if (stats.uploadFailNum) {
                        text = lang.updateStatusConfirm.replace('_', stats.successNum).replace('_', stats.successNum);
                    }
                } else {
                    stats = uploader.getStats();
                    text = lang.updateStatusFinish.replace('_', fileCount).
                        replace('_KB', WebUploader.formatSize(fileSize)).
                        replace('_', stats.successNum);

                    if (stats.uploadFailNum) {
                        text += lang.updateStatusError.replace('_', stats.uploadFailNum);
                    }
                }

                $info.html(text);
            }

            uploader.on('fileQueued', function (file) {
                fileCount++;
                fileSize += file.size;

                if (fileCount === 1) {
                    $placeHolder.addClass('element-invisible');
                    $statusBar.show();
                }

                addFile(file);
            });

            uploader.on('fileDequeued', function (file) {
                fileCount--;
                fileSize -= file.size;

                removeFile(file);
                updateTotalProgress();
            });

            uploader.on('filesQueued', function (file) {
                if (!uploader.isInProgress() && (state == 'pedding' || state == 'finish' || state == 'confirm' || state == 'ready')) {
                    setState('ready');
                }
                updateTotalProgress();
            });

            uploader.on('all', function (type, files) {
                switch (type) {
                    case 'uploadFinished':
                        setState('confirm', files);
                        break;
                    case 'startUpload':
                        /* 添加额外的GET参数 */
                        var params = utils.serializeParam(editor.queryCommandValue('serverparam')) || '',
                            url = utils.formatUrl(actionUrl + (actionUrl.indexOf('?') == -1 ? '?':'&') + 'encode=utf-8&' + params);
                        uploader.option('server', url);
                        setState('uploading', files);
                        break;
                    case 'stopUpload':
                        setState('paused', files);
                        break;
                }
            });

            uploader.on('uploadBeforeSend', function (file, data, header) {
                //这里可以通过data对象添加POST参数
                header['X_Requested_With'] = 'XMLHttpRequest';
            });

            uploader.on('uploadProgress', function (file, percentage) {
                var $li = $('#' + file.id),
                    $percent = $li.find('.progress span');

                $percent.css('width', percentage * 100 + '%');
                percentages[ file.id ][ 1 ] = percentage;
                updateTotalProgress();
            });

            uploader.on('uploadSuccess', function (file, ret) {
                var $file = $('#' + file.id);
                try {
                    var responseText = (ret._raw || ret),
                        json = utils.str2json(responseText);
                    if (json.state == 'SUCCESS') {
                        _this.fileList.push(json);
                        $file.append('<span class="success"></span>');
                    } else {
                        $file.find('.error').text(json.state).show();
                    }
                } catch (e) {
                    $file.find('.error').text(lang.errorServerUpload).show();
                }
            });

            uploader.on('uploadError', function (file, code) {
            });
            uploader.on('error', function (code, file) {
                if (code == 'Q_TYPE_DENIED' || code == 'F_EXCEED_SIZE') {
                    addFile(file);
                }
            });
            uploader.on('uploadComplete', function (file, ret) {
            });

            $upload.on('click', function () {
                if ($(this).hasClass('disabled')) {
                    return false;
                }

                if (state === 'ready') {
                    uploader.upload();
                } else if (state === 'paused') {
                    uploader.upload();
                } else if (state === 'uploading') {
                    uploader.stop();
                }
            });

            $upload.addClass('state-' + state);
            updateTotalProgress();
        },
        getQueueCount: function () {
            var file, i, status, readyFile = 0, files = this.uploader.getFiles();
            for (i = 0; file = files[i++]; ) {
                status = file.getStatus();
                if (status == 'queued' || status == 'uploading' || status == 'progress') readyFile++;
            }
            return readyFile;
        },
        getInsertList: function () {
            var i, link, data, list = [],
                prefix = editor.getOpt('fileUrlPrefix');
            for (i = 0; i < this.fileList.length; i++) {
                data = this.fileList[i];
                link = data.url;
                list.push({
                    title: data.original || link.substr(link.lastIndexOf('/') + 1),
                    url: prefix + link
                });
            }
            return list;
        }
    };


    /* 在线附件 */
    function OnlineFile(target) {
        this.container = utils.isString(target) ? document.getElementById(target) : target;
        this.init();
    }
    OnlineFile.prototype = {
        init: function () {
            this.initContainer();
            this.initEvents();
            this.initData();
        },
        /* 初始化容器 */
        initContainer: function () {
            this.container.innerHTML = '';
            this.list = document.createElement('ul');
            this.clearFloat = document.createElement('li');

            domUtils.addClass(this.list, 'list');
            domUtils.addClass(this.clearFloat, 'clearFloat');

            this.list.appendChild(this.clearFloat);
            this.container.appendChild(this.list);
        },
        /* 初始化滚动事件,滚动到地步自动拉取数据 */
        initEvents: function () {
            var _this = this;

            /* 滚动拉取图片 */
            domUtils.on($G('fileList'), 'scroll', function(e){
                var panel = this;
                if (panel.scrollHeight - (panel.offsetHeight + panel.scrollTop) < 10) {
                    _this.getFileData();
                }
            });
            /* 选中图片 */
            domUtils.on(this.list, 'click', function (e) {
                var target = e.target || e.srcElement,
                    li = target.parentNode;

                if (li.tagName.toLowerCase() == 'li') {
                    if (domUtils.hasClass(li, 'selected')) {
                        domUtils.removeClasses(li, 'selected');
                    } else {
                        domUtils.addClass(li, 'selected');
                    }
                }
            });
        },
        /* 初始化第一次的数据 */
        initData: function () {

            /* 拉取数据需要使用的值 */
            this.state = 0;
            this.listSize = editor.getOpt('fileManagerListSize');
            this.listIndex = 0;
            this.listEnd = false;

            /* 第一次拉取数据 */
            this.getFileData();
        },
        /* 向后台拉取图片列表数据 */
        getFileData: function () {
            var _this = this;

            if(!_this.listEnd && !this.isLoadingData) {
                this.isLoadingData = true;
                ajax.request(editor.getActionUrl(editor.getOpt('fileManagerActionName')), {
                    timeout: 100000,
                    data: utils.extend({
                            start: this.listIndex,
                            size: this.listSize
                        }, editor.queryCommandValue('serverparam')),
                    method: 'get',
                    onsuccess: function (r) {
                        try {
                            var json = eval('(' + r.responseText + ')');
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
                    onerror: function () {
                        _this.isLoadingData = false;
                    }
                });
            }
        },
        /* 添加图片到列表界面上 */
        pushData: function (list) {
            var i, item, img, filetype, preview, icon, _this = this,
                urlPrefix = editor.getOpt('fileManagerUrlPrefix');
            for (i = 0; i < list.length; i++) {
                if(list[i] && list[i].url) {
                    item = document.createElement('li');
                    icon = document.createElement('span');
                    filetype = list[i].url.substr(list[i].url.lastIndexOf('.') + 1);

                    if ( "png|jpg|jpeg|gif|bmp".indexOf(filetype) != -1 ) {
                        preview = document.createElement('img');
                        domUtils.on(preview, 'load', (function(image){
                            return function(){
                                _this.scale(image, image.parentNode.offsetWidth, image.parentNode.offsetHeight);
                            };
                        })(preview));
                        preview.width = 113;
                        preview.setAttribute('src', urlPrefix + list[i].url + (list[i].url.indexOf('?') == -1 ? '?noCache=':'&noCache=') + (+new Date()).toString(36) );
                    } else {
                        var ic = document.createElement('i'),
                            textSpan = document.createElement('span');
                        textSpan.innerHTML = list[i].url.substr(list[i].url.lastIndexOf('/') + 1);
                        preview = document.createElement('div');
                        preview.appendChild(ic);
                        preview.appendChild(textSpan);
                        domUtils.addClass(preview, 'file-wrapper');
                        domUtils.addClass(textSpan, 'file-title');
                        domUtils.addClass(ic, 'file-type-' + filetype);
                        domUtils.addClass(ic, 'file-preview');
                    }
                    domUtils.addClass(icon, 'icon');
                    item.setAttribute('data-url', urlPrefix + list[i].url);
                    if (list[i].original) {
                        item.setAttribute('data-title', list[i].original);
                    }

                    item.appendChild(preview);
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
            var i, lis = this.list.children, list = [];
            for (i = 0; i < lis.length; i++) {
                if (domUtils.hasClass(lis[i], 'selected')) {
                    var url = lis[i].getAttribute('data-url');
                    var title = lis[i].getAttribute('data-title') || url.substr(url.lastIndexOf('/') + 1);
                    list.push({
                        title: title,
                        url: url
                    });
                }
            }
            return list;
        }
    };


})();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvZGlhbG9ncy9hdHRhY2htZW50L2F0dGFjaG1lbnQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBVc2VyOiBKaW5xblxuICogRGF0ZTogMTQtMDQtMDhcbiAqIFRpbWU6IOS4i+WNiDE2OjM0XG4gKiDkuIrkvKDlm77niYflr7nor53moYbpgLvovpHku6PnoIEs5YyF5ousdGFiOiDov5znqIvlm77niYcv5LiK5Lyg5Zu+54mHL+WcqOe6v+WbvueJhy/mkJzntKLlm77niYdcbiAqL1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIHVwbG9hZEZpbGUsXG4gICAgICAgIG9ubGluZUZpbGU7XG5cbiAgICB3aW5kb3cub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpbml0VGFicygpO1xuICAgICAgICBpbml0QnV0dG9ucygpO1xuICAgIH07XG5cbiAgICAvKiDliJ3lp4vljJZ0YWLmoIfnrb4gKi9cbiAgICBmdW5jdGlvbiBpbml0VGFicygpIHtcbiAgICAgICAgdmFyIHRhYnMgPSAkRygndGFiaGVhZCcpLmNoaWxkcmVuO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRhYnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGRvbVV0aWxzLm9uKHRhYnNbaV0sIFwiY2xpY2tcIiwgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0ID0gZS50YXJnZXQgfHwgZS5zcmNFbGVtZW50O1xuICAgICAgICAgICAgICAgIHNldFRhYkZvY3VzKHRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtY29udGVudC1pZCcpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgc2V0VGFiRm9jdXMoJ3VwbG9hZCcpO1xuICAgIH1cblxuICAgIC8qIOWIneWni+WMlnRhYmJvZHkgKi9cbiAgICBmdW5jdGlvbiBzZXRUYWJGb2N1cyhpZCkge1xuICAgICAgICBpZighaWQpIHJldHVybjtcbiAgICAgICAgdmFyIGksIGJvZHlJZCwgdGFicyA9ICRHKCd0YWJoZWFkJykuY2hpbGRyZW47XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0YWJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBib2R5SWQgPSB0YWJzW2ldLmdldEF0dHJpYnV0ZSgnZGF0YS1jb250ZW50LWlkJylcbiAgICAgICAgICAgIGlmIChib2R5SWQgPT0gaWQpIHtcbiAgICAgICAgICAgICAgICBkb21VdGlscy5hZGRDbGFzcyh0YWJzW2ldLCAnZm9jdXMnKTtcbiAgICAgICAgICAgICAgICBkb21VdGlscy5hZGRDbGFzcygkRyhib2R5SWQpLCAnZm9jdXMnKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZG9tVXRpbHMucmVtb3ZlQ2xhc3Nlcyh0YWJzW2ldLCAnZm9jdXMnKTtcbiAgICAgICAgICAgICAgICBkb21VdGlscy5yZW1vdmVDbGFzc2VzKCRHKGJvZHlJZCksICdmb2N1cycpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHN3aXRjaCAoaWQpIHtcbiAgICAgICAgICAgIGNhc2UgJ3VwbG9hZCc6XG4gICAgICAgICAgICAgICAgdXBsb2FkRmlsZSA9IHVwbG9hZEZpbGUgfHwgbmV3IFVwbG9hZEZpbGUoJ3F1ZXVlTGlzdCcpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnb25saW5lJzpcbiAgICAgICAgICAgICAgICBvbmxpbmVGaWxlID0gb25saW5lRmlsZSB8fCBuZXcgT25saW5lRmlsZSgnZmlsZUxpc3QnKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qIOWIneWni+WMlm9ub2vkuovku7YgKi9cbiAgICBmdW5jdGlvbiBpbml0QnV0dG9ucygpIHtcblxuICAgICAgICBkaWFsb2cub25vayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBsaXN0ID0gW10sIGlkLCB0YWJzID0gJEcoJ3RhYmhlYWQnKS5jaGlsZHJlbjtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGFicy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChkb21VdGlscy5oYXNDbGFzcyh0YWJzW2ldLCAnZm9jdXMnKSkge1xuICAgICAgICAgICAgICAgICAgICBpZCA9IHRhYnNbaV0uZ2V0QXR0cmlidXRlKCdkYXRhLWNvbnRlbnQtaWQnKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzd2l0Y2ggKGlkKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAndXBsb2FkJzpcbiAgICAgICAgICAgICAgICAgICAgbGlzdCA9IHVwbG9hZEZpbGUuZ2V0SW5zZXJ0TGlzdCgpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgY291bnQgPSB1cGxvYWRGaWxlLmdldFF1ZXVlQ291bnQoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvdW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKCcuaW5mbycsICcjcXVldWVMaXN0JykuaHRtbCgnPHNwYW4gc3R5bGU9XCJjb2xvcjpyZWQ7XCI+JyArICfov5jmnIky5Liq5pyq5LiK5Lyg5paH5Lu2Jy5yZXBsYWNlKC9bXFxkXS8sIGNvdW50KSArICc8L3NwYW4+Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnb25saW5lJzpcbiAgICAgICAgICAgICAgICAgICAgbGlzdCA9IG9ubGluZUZpbGUuZ2V0SW5zZXJ0TGlzdCgpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWRpdG9yLmV4ZWNDb21tYW5kKCdpbnNlcnRmaWxlJywgbGlzdCk7XG4gICAgICAgIH07XG4gICAgfVxuXG5cbiAgICAvKiDkuIrkvKDpmYTku7YgKi9cbiAgICBmdW5jdGlvbiBVcGxvYWRGaWxlKHRhcmdldCkge1xuICAgICAgICB0aGlzLiR3cmFwID0gdGFyZ2V0LmNvbnN0cnVjdG9yID09IFN0cmluZyA/ICQoJyMnICsgdGFyZ2V0KSA6ICQodGFyZ2V0KTtcbiAgICAgICAgdGhpcy5pbml0KCk7XG4gICAgfVxuICAgIFVwbG9hZEZpbGUucHJvdG90eXBlID0ge1xuICAgICAgICBpbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLmZpbGVMaXN0ID0gW107XG4gICAgICAgICAgICB0aGlzLmluaXRDb250YWluZXIoKTtcbiAgICAgICAgICAgIHRoaXMuaW5pdFVwbG9hZGVyKCk7XG4gICAgICAgIH0sXG4gICAgICAgIGluaXRDb250YWluZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuJHF1ZXVlID0gdGhpcy4kd3JhcC5maW5kKCcuZmlsZWxpc3QnKTtcbiAgICAgICAgfSxcbiAgICAgICAgLyog5Yid5aeL5YyW5a655ZmoICovXG4gICAgICAgIGluaXRVcGxvYWRlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcyxcbiAgICAgICAgICAgICAgICAkID0galF1ZXJ5LCAgICAvLyBqdXN0IGluIGNhc2UuIE1ha2Ugc3VyZSBpdCdzIG5vdCBhbiBvdGhlciBsaWJhcmF5LlxuICAgICAgICAgICAgICAgICR3cmFwID0gX3RoaXMuJHdyYXAsXG4gICAgICAgICAgICAvLyDlm77niYflrrnlmahcbiAgICAgICAgICAgICAgICAkcXVldWUgPSAkd3JhcC5maW5kKCcuZmlsZWxpc3QnKSxcbiAgICAgICAgICAgIC8vIOeKtuaAgeagj++8jOWMheaLrOi/m+W6puWSjOaOp+WItuaMiemSrlxuICAgICAgICAgICAgICAgICRzdGF0dXNCYXIgPSAkd3JhcC5maW5kKCcuc3RhdHVzQmFyJyksXG4gICAgICAgICAgICAvLyDmlofku7bmgLvkvZPpgInmi6nkv6Hmga/jgIJcbiAgICAgICAgICAgICAgICAkaW5mbyA9ICRzdGF0dXNCYXIuZmluZCgnLmluZm8nKSxcbiAgICAgICAgICAgIC8vIOS4iuS8oOaMiemSrlxuICAgICAgICAgICAgICAgICR1cGxvYWQgPSAkd3JhcC5maW5kKCcudXBsb2FkQnRuJyksXG4gICAgICAgICAgICAvLyDkuIrkvKDmjInpkq5cbiAgICAgICAgICAgICAgICAkZmlsZVBpY2tlckJ0biA9ICR3cmFwLmZpbmQoJy5maWxlUGlja2VyQnRuJyksXG4gICAgICAgICAgICAvLyDkuIrkvKDmjInpkq5cbiAgICAgICAgICAgICAgICAkZmlsZVBpY2tlckJsb2NrID0gJHdyYXAuZmluZCgnLmZpbGVQaWNrZXJCbG9jaycpLFxuICAgICAgICAgICAgLy8g5rKh6YCJ5oup5paH5Lu25LmL5YmN55qE5YaF5a6544CCXG4gICAgICAgICAgICAgICAgJHBsYWNlSG9sZGVyID0gJHdyYXAuZmluZCgnLnBsYWNlaG9sZGVyJyksXG4gICAgICAgICAgICAvLyDmgLvkvZPov5vluqbmnaFcbiAgICAgICAgICAgICAgICAkcHJvZ3Jlc3MgPSAkc3RhdHVzQmFyLmZpbmQoJy5wcm9ncmVzcycpLmhpZGUoKSxcbiAgICAgICAgICAgIC8vIOa3u+WKoOeahOaWh+S7tuaVsOmHj1xuICAgICAgICAgICAgICAgIGZpbGVDb3VudCA9IDAsXG4gICAgICAgICAgICAvLyDmt7vliqDnmoTmlofku7bmgLvlpKflsI9cbiAgICAgICAgICAgICAgICBmaWxlU2l6ZSA9IDAsXG4gICAgICAgICAgICAvLyDkvJjljJZyZXRpbmEsIOWcqHJldGluYeS4i+i/meS4quWAvOaYrzJcbiAgICAgICAgICAgICAgICByYXRpbyA9IHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvIHx8IDEsXG4gICAgICAgICAgICAvLyDnvKnnlaXlm77lpKflsI9cbiAgICAgICAgICAgICAgICB0aHVtYm5haWxXaWR0aCA9IDExMyAqIHJhdGlvLFxuICAgICAgICAgICAgICAgIHRodW1ibmFpbEhlaWdodCA9IDExMyAqIHJhdGlvLFxuICAgICAgICAgICAgLy8g5Y+v6IO95pyJcGVkZGluZywgcmVhZHksIHVwbG9hZGluZywgY29uZmlybSwgZG9uZS5cbiAgICAgICAgICAgICAgICBzdGF0ZSA9ICcnLFxuICAgICAgICAgICAgLy8g5omA5pyJ5paH5Lu255qE6L+b5bqm5L+h5oGv77yMa2V55Li6ZmlsZSBpZFxuICAgICAgICAgICAgICAgIHBlcmNlbnRhZ2VzID0ge30sXG4gICAgICAgICAgICAgICAgc3VwcG9ydFRyYW5zaXRpb24gPSAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKS5zdHlsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHIgPSAndHJhbnNpdGlvbicgaW4gcyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdXZWJraXRUcmFuc2l0aW9uJyBpbiBzIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ01velRyYW5zaXRpb24nIGluIHMgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbXNUcmFuc2l0aW9uJyBpbiBzIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ09UcmFuc2l0aW9uJyBpbiBzO1xuICAgICAgICAgICAgICAgICAgICBzID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHI7XG4gICAgICAgICAgICAgICAgfSkoKSxcbiAgICAgICAgICAgIC8vIFdlYlVwbG9hZGVy5a6e5L6LXG4gICAgICAgICAgICAgICAgdXBsb2FkZXIsXG4gICAgICAgICAgICAgICAgYWN0aW9uVXJsID0gZWRpdG9yLmdldEFjdGlvblVybChlZGl0b3IuZ2V0T3B0KCdmaWxlQWN0aW9uTmFtZScpKSxcbiAgICAgICAgICAgICAgICBmaWxlTWF4U2l6ZSA9IGVkaXRvci5nZXRPcHQoJ2ZpbGVNYXhTaXplJyksXG4gICAgICAgICAgICAgICAgYWNjZXB0RXh0ZW5zaW9ucyA9IChlZGl0b3IuZ2V0T3B0KCdmaWxlQWxsb3dGaWxlcycpIHx8IFtdKS5qb2luKCcnKS5yZXBsYWNlKC9cXC4vZywgJywnKS5yZXBsYWNlKC9eWyxdLywgJycpOztcblxuICAgICAgICAgICAgaWYgKCFXZWJVcGxvYWRlci5VcGxvYWRlci5zdXBwb3J0KCkpIHtcbiAgICAgICAgICAgICAgICAkKCcjZmlsZVBpY2tlclJlYWR5JykuYWZ0ZXIoJCgnPGRpdj4nKS5odG1sKGxhbmcuZXJyb3JOb3RTdXBwb3J0KSkuaGlkZSgpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIWVkaXRvci5nZXRPcHQoJ2ZpbGVBY3Rpb25OYW1lJykpIHtcbiAgICAgICAgICAgICAgICAkKCcjZmlsZVBpY2tlclJlYWR5JykuYWZ0ZXIoJCgnPGRpdj4nKS5odG1sKGxhbmcuZXJyb3JMb2FkQ29uZmlnKSkuaGlkZSgpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdXBsb2FkZXIgPSBfdGhpcy51cGxvYWRlciA9IFdlYlVwbG9hZGVyLmNyZWF0ZSh7XG4gICAgICAgICAgICAgICAgcGljazoge1xuICAgICAgICAgICAgICAgICAgICBpZDogJyNmaWxlUGlja2VyUmVhZHknLFxuICAgICAgICAgICAgICAgICAgICBsYWJlbDogbGFuZy51cGxvYWRTZWxlY3RGaWxlXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzd2Y6ICcuLi8uLi90aGlyZC1wYXJ0eS93ZWJ1cGxvYWRlci9VcGxvYWRlci5zd2YnLFxuICAgICAgICAgICAgICAgIHNlcnZlcjogYWN0aW9uVXJsLFxuICAgICAgICAgICAgICAgIGZpbGVWYWw6IGVkaXRvci5nZXRPcHQoJ2ZpbGVGaWVsZE5hbWUnKSxcbiAgICAgICAgICAgICAgICBkdXBsaWNhdGU6IHRydWUsXG4gICAgICAgICAgICAgICAgZmlsZVNpbmdsZVNpemVMaW1pdDogZmlsZU1heFNpemUsXG4gICAgICAgICAgICAgICAgY29tcHJlc3M6IGZhbHNlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHVwbG9hZGVyLmFkZEJ1dHRvbih7XG4gICAgICAgICAgICAgICAgaWQ6ICcjZmlsZVBpY2tlckJsb2NrJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB1cGxvYWRlci5hZGRCdXR0b24oe1xuICAgICAgICAgICAgICAgIGlkOiAnI2ZpbGVQaWNrZXJCdG4nLFxuICAgICAgICAgICAgICAgIGxhYmVsOiBsYW5nLnVwbG9hZEFkZEZpbGVcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBzZXRTdGF0ZSgncGVkZGluZycpO1xuXG4gICAgICAgICAgICAvLyDlvZPmnInmlofku7bmt7vliqDov5vmnaXml7bmiafooYzvvIzotJ/otKN2aWV355qE5Yib5bu6XG4gICAgICAgICAgICBmdW5jdGlvbiBhZGRGaWxlKGZpbGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgJGxpID0gJCgnPGxpIGlkPVwiJyArIGZpbGUuaWQgKyAnXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPHAgY2xhc3M9XCJ0aXRsZVwiPicgKyBmaWxlLm5hbWUgKyAnPC9wPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxwIGNsYXNzPVwiaW1nV3JhcFwiPjwvcD4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8cCBjbGFzcz1cInByb2dyZXNzXCI+PHNwYW4+PC9zcGFuPjwvcD4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8L2xpPicpLFxuXG4gICAgICAgICAgICAgICAgICAgICRidG5zID0gJCgnPGRpdiBjbGFzcz1cImZpbGUtcGFuZWxcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cImNhbmNlbFwiPicgKyBsYW5nLnVwbG9hZERlbGV0ZSArICc8L3NwYW4+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJyb3RhdGVSaWdodFwiPicgKyBsYW5nLnVwbG9hZFR1cm5SaWdodCArICc8L3NwYW4+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJyb3RhdGVMZWZ0XCI+JyArIGxhbmcudXBsb2FkVHVybkxlZnQgKyAnPC9zcGFuPjwvZGl2PicpLmFwcGVuZFRvKCRsaSksXG4gICAgICAgICAgICAgICAgICAgICRwcmdyZXNzID0gJGxpLmZpbmQoJ3AucHJvZ3Jlc3Mgc3BhbicpLFxuICAgICAgICAgICAgICAgICAgICAkd3JhcCA9ICRsaS5maW5kKCdwLmltZ1dyYXAnKSxcbiAgICAgICAgICAgICAgICAgICAgJGluZm8gPSAkKCc8cCBjbGFzcz1cImVycm9yXCI+PC9wPicpLmhpZGUoKS5hcHBlbmRUbygkbGkpLFxuXG4gICAgICAgICAgICAgICAgICAgIHNob3dFcnJvciA9IGZ1bmN0aW9uIChjb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGNvZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdleGNlZWRfc2l6ZSc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQgPSBsYW5nLmVycm9yRXhjZWVkU2l6ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnaW50ZXJydXB0JzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dCA9IGxhbmcuZXJyb3JJbnRlcnJ1cHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2h0dHAnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0ID0gbGFuZy5lcnJvckh0dHA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ25vdF9hbGxvd190eXBlJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dCA9IGxhbmcuZXJyb3JGaWxlVHlwZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dCA9IGxhbmcuZXJyb3JVcGxvYWRSZXRyeTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAkaW5mby50ZXh0KHRleHQpLnNob3coKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIGlmIChmaWxlLmdldFN0YXR1cygpID09PSAnaW52YWxpZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgc2hvd0Vycm9yKGZpbGUuc3RhdHVzVGV4dCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgJHdyYXAudGV4dChsYW5nLnVwbG9hZFByZXZpZXcpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoJ3xwbmd8anBnfGpwZWd8Ym1wfGdpZnwnLmluZGV4T2YoJ3wnK2ZpbGUuZXh0LnRvTG93ZXJDYXNlKCkrJ3wnKSA9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHdyYXAuZW1wdHkoKS5hZGRDbGFzcygnbm90aW1hZ2UnKS5hcHBlbmQoJzxpIGNsYXNzPVwiZmlsZS1wcmV2aWV3IGZpbGUtdHlwZS0nICsgZmlsZS5leHQudG9Mb3dlckNhc2UoKSArICdcIj48L2k+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJmaWxlLXRpdGxlXCIgdGl0bGU9XCInICsgZmlsZS5uYW1lICsgJ1wiPicgKyBmaWxlLm5hbWUgKyAnPC9zcGFuPicpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGJyb3dzZXIuaWUgJiYgYnJvd3Nlci52ZXJzaW9uIDw9IDcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkd3JhcC50ZXh0KGxhbmcudXBsb2FkTm9QcmV2aWV3KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXBsb2FkZXIubWFrZVRodW1iKGZpbGUsIGZ1bmN0aW9uIChlcnJvciwgc3JjKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnJvciB8fCAhc3JjKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkd3JhcC50ZXh0KGxhbmcudXBsb2FkTm9QcmV2aWV3KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciAkaW1nID0gJCgnPGltZyBzcmM9XCInICsgc3JjICsgJ1wiPicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHdyYXAuZW1wdHkoKS5hcHBlbmQoJGltZyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkaW1nLm9uKCdlcnJvcicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkd3JhcC50ZXh0KGxhbmcudXBsb2FkTm9QcmV2aWV3KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgdGh1bWJuYWlsV2lkdGgsIHRodW1ibmFpbEhlaWdodCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcGVyY2VudGFnZXNbIGZpbGUuaWQgXSA9IFsgZmlsZS5zaXplLCAwIF07XG4gICAgICAgICAgICAgICAgICAgIGZpbGUucm90YXRpb24gPSAwO1xuXG4gICAgICAgICAgICAgICAgICAgIC8qIOajgOafpeaWh+S7tuagvOW8jyAqL1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWZpbGUuZXh0IHx8IGFjY2VwdEV4dGVuc2lvbnMuaW5kZXhPZihmaWxlLmV4dC50b0xvd2VyQ2FzZSgpKSA9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2hvd0Vycm9yKCdub3RfYWxsb3dfdHlwZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdXBsb2FkZXIucmVtb3ZlRmlsZShmaWxlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGZpbGUub24oJ3N0YXR1c2NoYW5nZScsIGZ1bmN0aW9uIChjdXIsIHByZXYpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByZXYgPT09ICdwcm9ncmVzcycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRwcmdyZXNzLmhpZGUoKS53aWR0aCgwKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwcmV2ID09PSAncXVldWVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgJGxpLm9mZignbW91c2VlbnRlciBtb3VzZWxlYXZlJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkYnRucy5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyDmiJDlip9cbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1ciA9PT0gJ2Vycm9yJyB8fCBjdXIgPT09ICdpbnZhbGlkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2hvd0Vycm9yKGZpbGUuc3RhdHVzVGV4dCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwZXJjZW50YWdlc1sgZmlsZS5pZCBdWyAxIF0gPSAxO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGN1ciA9PT0gJ2ludGVycnVwdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNob3dFcnJvcignaW50ZXJydXB0Jyk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY3VyID09PSAncXVldWVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGVyY2VudGFnZXNbIGZpbGUuaWQgXVsgMSBdID0gMDtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjdXIgPT09ICdwcm9ncmVzcycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRpbmZvLmhpZGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRwcmdyZXNzLmNzcygnZGlzcGxheScsICdibG9jaycpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGN1ciA9PT0gJ2NvbXBsZXRlJykge1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgJGxpLnJlbW92ZUNsYXNzKCdzdGF0ZS0nICsgcHJldikuYWRkQ2xhc3MoJ3N0YXRlLScgKyBjdXIpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgJGxpLm9uKCdtb3VzZWVudGVyJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAkYnRucy5zdG9wKCkuYW5pbWF0ZSh7aGVpZ2h0OiAzMH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICRsaS5vbignbW91c2VsZWF2ZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgJGJ0bnMuc3RvcCgpLmFuaW1hdGUoe2hlaWdodDogMH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgJGJ0bnMub24oJ2NsaWNrJywgJ3NwYW4nLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpbmRleCA9ICQodGhpcykuaW5kZXgoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZztcblxuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXBsb2FkZXIucmVtb3ZlRmlsZShmaWxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZS5yb3RhdGlvbiArPSA5MDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlLnJvdGF0aW9uIC09IDkwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHN1cHBvcnRUcmFuc2l0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWcgPSAncm90YXRlKCcgKyBmaWxlLnJvdGF0aW9uICsgJ2RlZyknO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHdyYXAuY3NzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnLXdlYmtpdC10cmFuc2Zvcm0nOiBkZWcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJy1tb3MtdHJhbnNmb3JtJzogZGVnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICctby10cmFuc2Zvcm0nOiBkZWcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3RyYW5zZm9ybSc6IGRlZ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkd3JhcC5jc3MoJ2ZpbHRlcicsICdwcm9naWQ6RFhJbWFnZVRyYW5zZm9ybS5NaWNyb3NvZnQuQmFzaWNJbWFnZShyb3RhdGlvbj0nICsgKH5+KChmaWxlLnJvdGF0aW9uIC8gOTApICUgNCArIDQpICUgNCkgKyAnKScpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICRsaS5pbnNlcnRCZWZvcmUoJGZpbGVQaWNrZXJCbG9jayk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOi0n+i0o3ZpZXfnmoTplIDmr4FcbiAgICAgICAgICAgIGZ1bmN0aW9uIHJlbW92ZUZpbGUoZmlsZSkge1xuICAgICAgICAgICAgICAgIHZhciAkbGkgPSAkKCcjJyArIGZpbGUuaWQpO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBwZXJjZW50YWdlc1sgZmlsZS5pZCBdO1xuICAgICAgICAgICAgICAgIHVwZGF0ZVRvdGFsUHJvZ3Jlc3MoKTtcbiAgICAgICAgICAgICAgICAkbGkub2ZmKCkuZmluZCgnLmZpbGUtcGFuZWwnKS5vZmYoKS5lbmQoKS5yZW1vdmUoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gdXBkYXRlVG90YWxQcm9ncmVzcygpIHtcbiAgICAgICAgICAgICAgICB2YXIgbG9hZGVkID0gMCxcbiAgICAgICAgICAgICAgICAgICAgdG90YWwgPSAwLFxuICAgICAgICAgICAgICAgICAgICBzcGFucyA9ICRwcm9ncmVzcy5jaGlsZHJlbigpLFxuICAgICAgICAgICAgICAgICAgICBwZXJjZW50O1xuXG4gICAgICAgICAgICAgICAgJC5lYWNoKHBlcmNlbnRhZ2VzLCBmdW5jdGlvbiAoaywgdikge1xuICAgICAgICAgICAgICAgICAgICB0b3RhbCArPSB2WyAwIF07XG4gICAgICAgICAgICAgICAgICAgIGxvYWRlZCArPSB2WyAwIF0gKiB2WyAxIF07XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBwZXJjZW50ID0gdG90YWwgPyBsb2FkZWQgLyB0b3RhbCA6IDA7XG5cbiAgICAgICAgICAgICAgICBzcGFucy5lcSgwKS50ZXh0KE1hdGgucm91bmQocGVyY2VudCAqIDEwMCkgKyAnJScpO1xuICAgICAgICAgICAgICAgIHNwYW5zLmVxKDEpLmNzcygnd2lkdGgnLCBNYXRoLnJvdW5kKHBlcmNlbnQgKiAxMDApICsgJyUnKTtcbiAgICAgICAgICAgICAgICB1cGRhdGVTdGF0dXMoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gc2V0U3RhdGUodmFsLCBmaWxlcykge1xuXG4gICAgICAgICAgICAgICAgaWYgKHZhbCAhPSBzdGF0ZSkge1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBzdGF0cyA9IHVwbG9hZGVyLmdldFN0YXRzKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgJHVwbG9hZC5yZW1vdmVDbGFzcygnc3RhdGUtJyArIHN0YXRlKTtcbiAgICAgICAgICAgICAgICAgICAgJHVwbG9hZC5hZGRDbGFzcygnc3RhdGUtJyArIHZhbCk7XG5cbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoICh2YWwpIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLyog5pyq6YCJ5oup5paH5Lu2ICovXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdwZWRkaW5nJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkcXVldWUuYWRkQ2xhc3MoJ2VsZW1lbnQtaW52aXNpYmxlJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHN0YXR1c0Jhci5hZGRDbGFzcygnZWxlbWVudC1pbnZpc2libGUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkcGxhY2VIb2xkZXIucmVtb3ZlQ2xhc3MoJ2VsZW1lbnQtaW52aXNpYmxlJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHByb2dyZXNzLmhpZGUoKTsgJGluZm8uaGlkZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwbG9hZGVyLnJlZnJlc2goKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgLyog5Y+v5Lul5byA5aeL5LiK5LygICovXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdyZWFkeSc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHBsYWNlSG9sZGVyLmFkZENsYXNzKCdlbGVtZW50LWludmlzaWJsZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRxdWV1ZS5yZW1vdmVDbGFzcygnZWxlbWVudC1pbnZpc2libGUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc3RhdHVzQmFyLnJlbW92ZUNsYXNzKCdlbGVtZW50LWludmlzaWJsZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRwcm9ncmVzcy5oaWRlKCk7ICRpbmZvLnNob3coKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdXBsb2FkLnRleHQobGFuZy51cGxvYWRTdGFydCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXBsb2FkZXIucmVmcmVzaCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiDkuIrkvKDkuK0gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3VwbG9hZGluZyc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHByb2dyZXNzLnNob3coKTsgJGluZm8uaGlkZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1cGxvYWQudGV4dChsYW5nLnVwbG9hZFBhdXNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgLyog5pqC5YGc5LiK5LygICovXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdwYXVzZWQnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRwcm9ncmVzcy5zaG93KCk7ICRpbmZvLmhpZGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdXBsb2FkLnRleHQobGFuZy51cGxvYWRDb250aW51ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2NvbmZpcm0nOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRwcm9ncmVzcy5zaG93KCk7ICRpbmZvLmhpZGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdXBsb2FkLnRleHQobGFuZy51cGxvYWRTdGFydCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0cyA9IHVwbG9hZGVyLmdldFN0YXRzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXRzLnN1Y2Nlc3NOdW0gJiYgIXN0YXRzLnVwbG9hZEZhaWxOdW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0U3RhdGUoJ2ZpbmlzaCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdmaW5pc2gnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRwcm9ncmVzcy5oaWRlKCk7ICRpbmZvLnNob3coKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3RhdHMudXBsb2FkRmFpbE51bSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdXBsb2FkLnRleHQobGFuZy51cGxvYWRSZXRyeSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHVwbG9hZC50ZXh0KGxhbmcudXBsb2FkU3RhcnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlID0gdmFsO1xuICAgICAgICAgICAgICAgICAgICB1cGRhdGVTdGF0dXMoKTtcblxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICghX3RoaXMuZ2V0UXVldWVDb3VudCgpKSB7XG4gICAgICAgICAgICAgICAgICAgICR1cGxvYWQuYWRkQ2xhc3MoJ2Rpc2FibGVkJylcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAkdXBsb2FkLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHVwZGF0ZVN0YXR1cygpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGV4dCA9ICcnLCBzdGF0cztcblxuICAgICAgICAgICAgICAgIGlmIChzdGF0ZSA9PT0gJ3JlYWR5Jykge1xuICAgICAgICAgICAgICAgICAgICB0ZXh0ID0gbGFuZy51cGRhdGVTdGF0dXNSZWFkeS5yZXBsYWNlKCdfJywgZmlsZUNvdW50KS5yZXBsYWNlKCdfS0InLCBXZWJVcGxvYWRlci5mb3JtYXRTaXplKGZpbGVTaXplKSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzdGF0ZSA9PT0gJ2NvbmZpcm0nKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXRzID0gdXBsb2FkZXIuZ2V0U3RhdHMoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXRzLnVwbG9hZEZhaWxOdW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQgPSBsYW5nLnVwZGF0ZVN0YXR1c0NvbmZpcm0ucmVwbGFjZSgnXycsIHN0YXRzLnN1Y2Nlc3NOdW0pLnJlcGxhY2UoJ18nLCBzdGF0cy5zdWNjZXNzTnVtKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXRzID0gdXBsb2FkZXIuZ2V0U3RhdHMoKTtcbiAgICAgICAgICAgICAgICAgICAgdGV4dCA9IGxhbmcudXBkYXRlU3RhdHVzRmluaXNoLnJlcGxhY2UoJ18nLCBmaWxlQ291bnQpLlxuICAgICAgICAgICAgICAgICAgICAgICAgcmVwbGFjZSgnX0tCJywgV2ViVXBsb2FkZXIuZm9ybWF0U2l6ZShmaWxlU2l6ZSkpLlxuICAgICAgICAgICAgICAgICAgICAgICAgcmVwbGFjZSgnXycsIHN0YXRzLnN1Y2Nlc3NOdW0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChzdGF0cy51cGxvYWRGYWlsTnVtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0ICs9IGxhbmcudXBkYXRlU3RhdHVzRXJyb3IucmVwbGFjZSgnXycsIHN0YXRzLnVwbG9hZEZhaWxOdW0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgJGluZm8uaHRtbCh0ZXh0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdXBsb2FkZXIub24oJ2ZpbGVRdWV1ZWQnLCBmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICAgICAgICAgIGZpbGVDb3VudCsrO1xuICAgICAgICAgICAgICAgIGZpbGVTaXplICs9IGZpbGUuc2l6ZTtcblxuICAgICAgICAgICAgICAgIGlmIChmaWxlQ291bnQgPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgJHBsYWNlSG9sZGVyLmFkZENsYXNzKCdlbGVtZW50LWludmlzaWJsZScpO1xuICAgICAgICAgICAgICAgICAgICAkc3RhdHVzQmFyLnNob3coKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBhZGRGaWxlKGZpbGUpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHVwbG9hZGVyLm9uKCdmaWxlRGVxdWV1ZWQnLCBmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICAgICAgICAgIGZpbGVDb3VudC0tO1xuICAgICAgICAgICAgICAgIGZpbGVTaXplIC09IGZpbGUuc2l6ZTtcblxuICAgICAgICAgICAgICAgIHJlbW92ZUZpbGUoZmlsZSk7XG4gICAgICAgICAgICAgICAgdXBkYXRlVG90YWxQcm9ncmVzcygpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHVwbG9hZGVyLm9uKCdmaWxlc1F1ZXVlZCcsIGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF1cGxvYWRlci5pc0luUHJvZ3Jlc3MoKSAmJiAoc3RhdGUgPT0gJ3BlZGRpbmcnIHx8IHN0YXRlID09ICdmaW5pc2gnIHx8IHN0YXRlID09ICdjb25maXJtJyB8fCBzdGF0ZSA9PSAncmVhZHknKSkge1xuICAgICAgICAgICAgICAgICAgICBzZXRTdGF0ZSgncmVhZHknKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdXBkYXRlVG90YWxQcm9ncmVzcygpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHVwbG9hZGVyLm9uKCdhbGwnLCBmdW5jdGlvbiAodHlwZSwgZmlsZXMpIHtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAndXBsb2FkRmluaXNoZWQnOlxuICAgICAgICAgICAgICAgICAgICAgICAgc2V0U3RhdGUoJ2NvbmZpcm0nLCBmaWxlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnc3RhcnRVcGxvYWQnOlxuICAgICAgICAgICAgICAgICAgICAgICAgLyog5re75Yqg6aKd5aSW55qER0VU5Y+C5pWwICovXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcGFyYW1zID0gdXRpbHMuc2VyaWFsaXplUGFyYW0oZWRpdG9yLnF1ZXJ5Q29tbWFuZFZhbHVlKCdzZXJ2ZXJwYXJhbScpKSB8fCAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cmwgPSB1dGlscy5mb3JtYXRVcmwoYWN0aW9uVXJsICsgKGFjdGlvblVybC5pbmRleE9mKCc/JykgPT0gLTEgPyAnPyc6JyYnKSArICdlbmNvZGU9dXRmLTgmJyArIHBhcmFtcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB1cGxvYWRlci5vcHRpb24oJ3NlcnZlcicsIHVybCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRTdGF0ZSgndXBsb2FkaW5nJywgZmlsZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3N0b3BVcGxvYWQnOlxuICAgICAgICAgICAgICAgICAgICAgICAgc2V0U3RhdGUoJ3BhdXNlZCcsIGZpbGVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB1cGxvYWRlci5vbigndXBsb2FkQmVmb3JlU2VuZCcsIGZ1bmN0aW9uIChmaWxlLCBkYXRhLCBoZWFkZXIpIHtcbiAgICAgICAgICAgICAgICAvL+i/memHjOWPr+S7pemAmui/h2RhdGHlr7nosaHmt7vliqBQT1NU5Y+C5pWwXG4gICAgICAgICAgICAgICAgaGVhZGVyWydYX1JlcXVlc3RlZF9XaXRoJ10gPSAnWE1MSHR0cFJlcXVlc3QnO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHVwbG9hZGVyLm9uKCd1cGxvYWRQcm9ncmVzcycsIGZ1bmN0aW9uIChmaWxlLCBwZXJjZW50YWdlKSB7XG4gICAgICAgICAgICAgICAgdmFyICRsaSA9ICQoJyMnICsgZmlsZS5pZCksXG4gICAgICAgICAgICAgICAgICAgICRwZXJjZW50ID0gJGxpLmZpbmQoJy5wcm9ncmVzcyBzcGFuJyk7XG5cbiAgICAgICAgICAgICAgICAkcGVyY2VudC5jc3MoJ3dpZHRoJywgcGVyY2VudGFnZSAqIDEwMCArICclJyk7XG4gICAgICAgICAgICAgICAgcGVyY2VudGFnZXNbIGZpbGUuaWQgXVsgMSBdID0gcGVyY2VudGFnZTtcbiAgICAgICAgICAgICAgICB1cGRhdGVUb3RhbFByb2dyZXNzKCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgdXBsb2FkZXIub24oJ3VwbG9hZFN1Y2Nlc3MnLCBmdW5jdGlvbiAoZmlsZSwgcmV0KSB7XG4gICAgICAgICAgICAgICAgdmFyICRmaWxlID0gJCgnIycgKyBmaWxlLmlkKTtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcmVzcG9uc2VUZXh0ID0gKHJldC5fcmF3IHx8IHJldCksXG4gICAgICAgICAgICAgICAgICAgICAgICBqc29uID0gdXRpbHMuc3RyMmpzb24ocmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGpzb24uc3RhdGUgPT0gJ1NVQ0NFU1MnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5maWxlTGlzdC5wdXNoKGpzb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgJGZpbGUuYXBwZW5kKCc8c3BhbiBjbGFzcz1cInN1Y2Nlc3NcIj48L3NwYW4+Jyk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkZmlsZS5maW5kKCcuZXJyb3InKS50ZXh0KGpzb24uc3RhdGUpLnNob3coKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgJGZpbGUuZmluZCgnLmVycm9yJykudGV4dChsYW5nLmVycm9yU2VydmVyVXBsb2FkKS5zaG93KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHVwbG9hZGVyLm9uKCd1cGxvYWRFcnJvcicsIGZ1bmN0aW9uIChmaWxlLCBjb2RlKSB7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHVwbG9hZGVyLm9uKCdlcnJvcicsIGZ1bmN0aW9uIChjb2RlLCBmaWxlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNvZGUgPT0gJ1FfVFlQRV9ERU5JRUQnIHx8IGNvZGUgPT0gJ0ZfRVhDRUVEX1NJWkUnKSB7XG4gICAgICAgICAgICAgICAgICAgIGFkZEZpbGUoZmlsZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB1cGxvYWRlci5vbigndXBsb2FkQ29tcGxldGUnLCBmdW5jdGlvbiAoZmlsZSwgcmV0KSB7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgJHVwbG9hZC5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCQodGhpcykuaGFzQ2xhc3MoJ2Rpc2FibGVkJykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChzdGF0ZSA9PT0gJ3JlYWR5Jykge1xuICAgICAgICAgICAgICAgICAgICB1cGxvYWRlci51cGxvYWQoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHN0YXRlID09PSAncGF1c2VkJykge1xuICAgICAgICAgICAgICAgICAgICB1cGxvYWRlci51cGxvYWQoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHN0YXRlID09PSAndXBsb2FkaW5nJykge1xuICAgICAgICAgICAgICAgICAgICB1cGxvYWRlci5zdG9wKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICR1cGxvYWQuYWRkQ2xhc3MoJ3N0YXRlLScgKyBzdGF0ZSk7XG4gICAgICAgICAgICB1cGRhdGVUb3RhbFByb2dyZXNzKCk7XG4gICAgICAgIH0sXG4gICAgICAgIGdldFF1ZXVlQ291bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBmaWxlLCBpLCBzdGF0dXMsIHJlYWR5RmlsZSA9IDAsIGZpbGVzID0gdGhpcy51cGxvYWRlci5nZXRGaWxlcygpO1xuICAgICAgICAgICAgZm9yIChpID0gMDsgZmlsZSA9IGZpbGVzW2krK107ICkge1xuICAgICAgICAgICAgICAgIHN0YXR1cyA9IGZpbGUuZ2V0U3RhdHVzKCk7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXR1cyA9PSAncXVldWVkJyB8fCBzdGF0dXMgPT0gJ3VwbG9hZGluZycgfHwgc3RhdHVzID09ICdwcm9ncmVzcycpIHJlYWR5RmlsZSsrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlYWR5RmlsZTtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0SW5zZXJ0TGlzdDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGksIGxpbmssIGRhdGEsIGxpc3QgPSBbXSxcbiAgICAgICAgICAgICAgICBwcmVmaXggPSBlZGl0b3IuZ2V0T3B0KCdmaWxlVXJsUHJlZml4Jyk7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5maWxlTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGRhdGEgPSB0aGlzLmZpbGVMaXN0W2ldO1xuICAgICAgICAgICAgICAgIGxpbmsgPSBkYXRhLnVybDtcbiAgICAgICAgICAgICAgICBsaXN0LnB1c2goe1xuICAgICAgICAgICAgICAgICAgICB0aXRsZTogZGF0YS5vcmlnaW5hbCB8fCBsaW5rLnN1YnN0cihsaW5rLmxhc3RJbmRleE9mKCcvJykgKyAxKSxcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBwcmVmaXggKyBsaW5rXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbGlzdDtcbiAgICAgICAgfVxuICAgIH07XG5cblxuICAgIC8qIOWcqOe6v+mZhOS7tiAqL1xuICAgIGZ1bmN0aW9uIE9ubGluZUZpbGUodGFyZ2V0KSB7XG4gICAgICAgIHRoaXMuY29udGFpbmVyID0gdXRpbHMuaXNTdHJpbmcodGFyZ2V0KSA/IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRhcmdldCkgOiB0YXJnZXQ7XG4gICAgICAgIHRoaXMuaW5pdCgpO1xuICAgIH1cbiAgICBPbmxpbmVGaWxlLnByb3RvdHlwZSA9IHtcbiAgICAgICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5pbml0Q29udGFpbmVyKCk7XG4gICAgICAgICAgICB0aGlzLmluaXRFdmVudHMoKTtcbiAgICAgICAgICAgIHRoaXMuaW5pdERhdGEoKTtcbiAgICAgICAgfSxcbiAgICAgICAgLyog5Yid5aeL5YyW5a655ZmoICovXG4gICAgICAgIGluaXRDb250YWluZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmlubmVySFRNTCA9ICcnO1xuICAgICAgICAgICAgdGhpcy5saXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndWwnKTtcbiAgICAgICAgICAgIHRoaXMuY2xlYXJGbG9hdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG5cbiAgICAgICAgICAgIGRvbVV0aWxzLmFkZENsYXNzKHRoaXMubGlzdCwgJ2xpc3QnKTtcbiAgICAgICAgICAgIGRvbVV0aWxzLmFkZENsYXNzKHRoaXMuY2xlYXJGbG9hdCwgJ2NsZWFyRmxvYXQnKTtcblxuICAgICAgICAgICAgdGhpcy5saXN0LmFwcGVuZENoaWxkKHRoaXMuY2xlYXJGbG9hdCk7XG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLmxpc3QpO1xuICAgICAgICB9LFxuICAgICAgICAvKiDliJ3lp4vljJbmu5rliqjkuovku7Ys5rua5Yqo5Yiw5Zyw5q2l6Ieq5Yqo5ouJ5Y+W5pWw5o2uICovXG4gICAgICAgIGluaXRFdmVudHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgICAgICAgIC8qIOa7muWKqOaLieWPluWbvueJhyAqL1xuICAgICAgICAgICAgZG9tVXRpbHMub24oJEcoJ2ZpbGVMaXN0JyksICdzY3JvbGwnLCBmdW5jdGlvbihlKXtcbiAgICAgICAgICAgICAgICB2YXIgcGFuZWwgPSB0aGlzO1xuICAgICAgICAgICAgICAgIGlmIChwYW5lbC5zY3JvbGxIZWlnaHQgLSAocGFuZWwub2Zmc2V0SGVpZ2h0ICsgcGFuZWwuc2Nyb2xsVG9wKSA8IDEwKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmdldEZpbGVEYXRhKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvKiDpgInkuK3lm77niYcgKi9cbiAgICAgICAgICAgIGRvbVV0aWxzLm9uKHRoaXMubGlzdCwgJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0ID0gZS50YXJnZXQgfHwgZS5zcmNFbGVtZW50LFxuICAgICAgICAgICAgICAgICAgICBsaSA9IHRhcmdldC5wYXJlbnROb2RlO1xuXG4gICAgICAgICAgICAgICAgaWYgKGxpLnRhZ05hbWUudG9Mb3dlckNhc2UoKSA9PSAnbGknKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkb21VdGlscy5oYXNDbGFzcyhsaSwgJ3NlbGVjdGVkJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvbVV0aWxzLnJlbW92ZUNsYXNzZXMobGksICdzZWxlY3RlZCcpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZG9tVXRpbHMuYWRkQ2xhc3MobGksICdzZWxlY3RlZCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIC8qIOWIneWni+WMluesrOS4gOasoeeahOaVsOaNriAqL1xuICAgICAgICBpbml0RGF0YTogZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICAvKiDmi4nlj5bmlbDmja7pnIDopoHkvb/nlKjnmoTlgLwgKi9cbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSAwO1xuICAgICAgICAgICAgdGhpcy5saXN0U2l6ZSA9IGVkaXRvci5nZXRPcHQoJ2ZpbGVNYW5hZ2VyTGlzdFNpemUnKTtcbiAgICAgICAgICAgIHRoaXMubGlzdEluZGV4ID0gMDtcbiAgICAgICAgICAgIHRoaXMubGlzdEVuZCA9IGZhbHNlO1xuXG4gICAgICAgICAgICAvKiDnrKzkuIDmrKHmi4nlj5bmlbDmja4gKi9cbiAgICAgICAgICAgIHRoaXMuZ2V0RmlsZURhdGEoKTtcbiAgICAgICAgfSxcbiAgICAgICAgLyog5ZCR5ZCO5Y+w5ouJ5Y+W5Zu+54mH5YiX6KGo5pWw5o2uICovXG4gICAgICAgIGdldEZpbGVEYXRhOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgICAgICAgICBpZighX3RoaXMubGlzdEVuZCAmJiAhdGhpcy5pc0xvYWRpbmdEYXRhKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pc0xvYWRpbmdEYXRhID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBhamF4LnJlcXVlc3QoZWRpdG9yLmdldEFjdGlvblVybChlZGl0b3IuZ2V0T3B0KCdmaWxlTWFuYWdlckFjdGlvbk5hbWUnKSksIHtcbiAgICAgICAgICAgICAgICAgICAgdGltZW91dDogMTAwMDAwLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB1dGlscy5leHRlbmQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0OiB0aGlzLmxpc3RJbmRleCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaXplOiB0aGlzLmxpc3RTaXplXG4gICAgICAgICAgICAgICAgICAgICAgICB9LCBlZGl0b3IucXVlcnlDb21tYW5kVmFsdWUoJ3NlcnZlcnBhcmFtJykpLFxuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdnZXQnLFxuICAgICAgICAgICAgICAgICAgICBvbnN1Y2Nlc3M6IGZ1bmN0aW9uIChyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBqc29uID0gZXZhbCgnKCcgKyByLnJlc3BvbnNlVGV4dCArICcpJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGpzb24uc3RhdGUgPT0gJ1NVQ0NFU1MnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLnB1c2hEYXRhKGpzb24ubGlzdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLmxpc3RJbmRleCA9IHBhcnNlSW50KGpzb24uc3RhcnQpICsgcGFyc2VJbnQoanNvbi5saXN0Lmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKF90aGlzLmxpc3RJbmRleCA+PSBqc29uLnRvdGFsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5saXN0RW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5pc0xvYWRpbmdEYXRhID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKHIucmVzcG9uc2VUZXh0LmluZGV4T2YoJ3VlX3NlcGFyYXRlX3VlJykgIT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxpc3QgPSByLnJlc3BvbnNlVGV4dC5zcGxpdChyLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLnB1c2hEYXRhKGxpc3QpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5saXN0SW5kZXggPSBwYXJzZUludChsaXN0Lmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLmxpc3RFbmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5pc0xvYWRpbmdEYXRhID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBvbmVycm9yOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5pc0xvYWRpbmdEYXRhID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgLyog5re75Yqg5Zu+54mH5Yiw5YiX6KGo55WM6Z2i5LiKICovXG4gICAgICAgIHB1c2hEYXRhOiBmdW5jdGlvbiAobGlzdCkge1xuICAgICAgICAgICAgdmFyIGksIGl0ZW0sIGltZywgZmlsZXR5cGUsIHByZXZpZXcsIGljb24sIF90aGlzID0gdGhpcyxcbiAgICAgICAgICAgICAgICB1cmxQcmVmaXggPSBlZGl0b3IuZ2V0T3B0KCdmaWxlTWFuYWdlclVybFByZWZpeCcpO1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZihsaXN0W2ldICYmIGxpc3RbaV0udXJsKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICAgICAgICAgICAgICAgICAgICBpY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICAgICAgICAgICAgICBmaWxldHlwZSA9IGxpc3RbaV0udXJsLnN1YnN0cihsaXN0W2ldLnVybC5sYXN0SW5kZXhPZignLicpICsgMSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCBcInBuZ3xqcGd8anBlZ3xnaWZ8Ym1wXCIuaW5kZXhPZihmaWxldHlwZSkgIT0gLTEgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2aWV3ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkb21VdGlscy5vbihwcmV2aWV3LCAnbG9hZCcsIChmdW5jdGlvbihpbWFnZSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLnNjYWxlKGltYWdlLCBpbWFnZS5wYXJlbnROb2RlLm9mZnNldFdpZHRoLCBpbWFnZS5wYXJlbnROb2RlLm9mZnNldEhlaWdodCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pKHByZXZpZXcpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXZpZXcud2lkdGggPSAxMTM7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2aWV3LnNldEF0dHJpYnV0ZSgnc3JjJywgdXJsUHJlZml4ICsgbGlzdFtpXS51cmwgKyAobGlzdFtpXS51cmwuaW5kZXhPZignPycpID09IC0xID8gJz9ub0NhY2hlPSc6JyZub0NhY2hlPScpICsgKCtuZXcgRGF0ZSgpKS50b1N0cmluZygzNikgKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpYyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2knKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0U3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHRTcGFuLmlubmVySFRNTCA9IGxpc3RbaV0udXJsLnN1YnN0cihsaXN0W2ldLnVybC5sYXN0SW5kZXhPZignLycpICsgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2aWV3ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2aWV3LmFwcGVuZENoaWxkKGljKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXZpZXcuYXBwZW5kQ2hpbGQodGV4dFNwYW4pO1xuICAgICAgICAgICAgICAgICAgICAgICAgZG9tVXRpbHMuYWRkQ2xhc3MocHJldmlldywgJ2ZpbGUtd3JhcHBlcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZG9tVXRpbHMuYWRkQ2xhc3ModGV4dFNwYW4sICdmaWxlLXRpdGxlJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkb21VdGlscy5hZGRDbGFzcyhpYywgJ2ZpbGUtdHlwZS0nICsgZmlsZXR5cGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZG9tVXRpbHMuYWRkQ2xhc3MoaWMsICdmaWxlLXByZXZpZXcnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBkb21VdGlscy5hZGRDbGFzcyhpY29uLCAnaWNvbicpO1xuICAgICAgICAgICAgICAgICAgICBpdGVtLnNldEF0dHJpYnV0ZSgnZGF0YS11cmwnLCB1cmxQcmVmaXggKyBsaXN0W2ldLnVybCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsaXN0W2ldLm9yaWdpbmFsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtLnNldEF0dHJpYnV0ZSgnZGF0YS10aXRsZScsIGxpc3RbaV0ub3JpZ2luYWwpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaXRlbS5hcHBlbmRDaGlsZChwcmV2aWV3KTtcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5hcHBlbmRDaGlsZChpY29uKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5saXN0Lmluc2VydEJlZm9yZShpdGVtLCB0aGlzLmNsZWFyRmxvYXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgLyog5pS55Y+Y5Zu+54mH5aSn5bCPICovXG4gICAgICAgIHNjYWxlOiBmdW5jdGlvbiAoaW1nLCB3LCBoLCB0eXBlKSB7XG4gICAgICAgICAgICB2YXIgb3cgPSBpbWcud2lkdGgsXG4gICAgICAgICAgICAgICAgb2ggPSBpbWcuaGVpZ2h0O1xuXG4gICAgICAgICAgICBpZiAodHlwZSA9PSAnanVzdGlmeScpIHtcbiAgICAgICAgICAgICAgICBpZiAob3cgPj0gb2gpIHtcbiAgICAgICAgICAgICAgICAgICAgaW1nLndpZHRoID0gdztcbiAgICAgICAgICAgICAgICAgICAgaW1nLmhlaWdodCA9IGggKiBvaCAvIG93O1xuICAgICAgICAgICAgICAgICAgICBpbWcuc3R5bGUubWFyZ2luTGVmdCA9ICctJyArIHBhcnNlSW50KChpbWcud2lkdGggLSB3KSAvIDIpICsgJ3B4JztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpbWcud2lkdGggPSB3ICogb3cgLyBvaDtcbiAgICAgICAgICAgICAgICAgICAgaW1nLmhlaWdodCA9IGg7XG4gICAgICAgICAgICAgICAgICAgIGltZy5zdHlsZS5tYXJnaW5Ub3AgPSAnLScgKyBwYXJzZUludCgoaW1nLmhlaWdodCAtIGgpIC8gMikgKyAncHgnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKG93ID49IG9oKSB7XG4gICAgICAgICAgICAgICAgICAgIGltZy53aWR0aCA9IHcgKiBvdyAvIG9oO1xuICAgICAgICAgICAgICAgICAgICBpbWcuaGVpZ2h0ID0gaDtcbiAgICAgICAgICAgICAgICAgICAgaW1nLnN0eWxlLm1hcmdpbkxlZnQgPSAnLScgKyBwYXJzZUludCgoaW1nLndpZHRoIC0gdykgLyAyKSArICdweCc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaW1nLndpZHRoID0gdztcbiAgICAgICAgICAgICAgICAgICAgaW1nLmhlaWdodCA9IGggKiBvaCAvIG93O1xuICAgICAgICAgICAgICAgICAgICBpbWcuc3R5bGUubWFyZ2luVG9wID0gJy0nICsgcGFyc2VJbnQoKGltZy5oZWlnaHQgLSBoKSAvIDIpICsgJ3B4JztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGdldEluc2VydExpc3Q6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBpLCBsaXMgPSB0aGlzLmxpc3QuY2hpbGRyZW4sIGxpc3QgPSBbXTtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBsaXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoZG9tVXRpbHMuaGFzQ2xhc3MobGlzW2ldLCAnc2VsZWN0ZWQnKSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdXJsID0gbGlzW2ldLmdldEF0dHJpYnV0ZSgnZGF0YS11cmwnKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRpdGxlID0gbGlzW2ldLmdldEF0dHJpYnV0ZSgnZGF0YS10aXRsZScpIHx8IHVybC5zdWJzdHIodXJsLmxhc3RJbmRleE9mKCcvJykgKyAxKTtcbiAgICAgICAgICAgICAgICAgICAgbGlzdC5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiB0aXRsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybDogdXJsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBsaXN0O1xuICAgICAgICB9XG4gICAgfTtcblxuXG59KSgpOyJdLCJmaWxlIjoicGx1Z2lucy91ZWRpdG9yL2RpYWxvZ3MvYXR0YWNobWVudC9hdHRhY2htZW50LmpzIn0=
