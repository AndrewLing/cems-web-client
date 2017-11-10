/**
 * Created by JetBrains PhpStorm.
 * User: taoqili
 * Date: 12-2-20
 * Time: 上午11:19
 * To change this template use File | Settings | File Templates.
 */

(function(){

    var video = {},
        uploadVideoList = [],
        isModifyUploadVideo = false,
        uploadFile;

    window.onload = function(){
        $focus($G("videoUrl"));
        initTabs();
        initVideo();
        initUpload();
    };

    /* 初始化tab标签 */
    function initTabs(){
        var tabs = $G('tabHeads').children;
        for (var i = 0; i < tabs.length; i++) {
            domUtils.on(tabs[i], "click", function (e) {
                var j, bodyId, target = e.target || e.srcElement;
                for (j = 0; j < tabs.length; j++) {
                    bodyId = tabs[j].getAttribute('data-content-id');
                    if(tabs[j] == target){
                        domUtils.addClass(tabs[j], 'focus');
                        domUtils.addClass($G(bodyId), 'focus');
                    }else {
                        domUtils.removeClasses(tabs[j], 'focus');
                        domUtils.removeClasses($G(bodyId), 'focus');
                    }
                }
            });
        }
    }

    function initVideo(){
        createAlignButton( ["videoFloat", "upload_alignment"] );
        addUrlChangeListener($G("videoUrl"));
        addOkListener();

        //编辑视频时初始化相关信息
        (function(){
            var img = editor.selection.getRange().getClosedNode(),url;
            if(img && img.className){
                var hasFakedClass = (img.className == "edui-faked-video"),
                    hasUploadClass = img.className.indexOf("edui-upload-video")!=-1;
                if(hasFakedClass || hasUploadClass) {
                    $G("videoUrl").value = url = img.getAttribute("_url");
                    $G("videoWidth").value = img.width;
                    $G("videoHeight").value = img.height;
                    var align = domUtils.getComputedStyle(img,"float"),
                        parentAlign = domUtils.getComputedStyle(img.parentNode,"text-align");
                    updateAlignButton(parentAlign==="center"?"center":align);
                }
                if(hasUploadClass) {
                    isModifyUploadVideo = true;
                }
            }
            createPreviewVideo(url);
        })();
    }

    /**
     * 监听确认和取消两个按钮事件，用户执行插入或者清空正在播放的视频实例操作
     */
    function addOkListener(){
        dialog.onok = function(){
            $G("preview").innerHTML = "";
            var currentTab =  findFocus("tabHeads","tabSrc");
            switch(currentTab){
                case "video":
                    return insertSingle();
                    break;
                case "videoSearch":
                    return insertSearch("searchList");
                    break;
                case "upload":
                    return insertUpload();
                    break;
            }
        };
        dialog.oncancel = function(){
            $G("preview").innerHTML = "";
        };
    }

    /**
     * 依据传入的align值更新按钮信息
     * @param align
     */
    function updateAlignButton( align ) {
        var aligns = $G( "videoFloat" ).children;
        for ( var i = 0, ci; ci = aligns[i++]; ) {
            if ( ci.getAttribute( "name" ) == align ) {
                if ( ci.className !="focus" ) {
                    ci.className = "focus";
                }
            } else {
                if ( ci.className =="focus" ) {
                    ci.className = "";
                }
            }
        }
    }

    /**
     * 将单个视频信息插入编辑器中
     */
    function insertSingle(){
        var width = $G("videoWidth"),
            height = $G("videoHeight"),
            url=$G('videoUrl').value,
            align = findFocus("videoFloat","name");
        if(!url) return false;
        if ( !checkNum( [width, height] ) ) return false;
        editor.execCommand('insertvideo', {
            url: convert_url(url),
            width: width.value,
            height: height.value,
            align: align
        }, isModifyUploadVideo ? 'upload':null);
    }

    /**
     * 将元素id下的所有代表视频的图片插入编辑器中
     * @param id
     */
    function insertSearch(id){
        var imgs = domUtils.getElementsByTagName($G(id),"img"),
            videoObjs=[];
        for(var i=0,img; img=imgs[i++];){
            if(img.getAttribute("selected")){
                videoObjs.push({
                    url:img.getAttribute("ue_video_url"),
                    width:420,
                    height:280,
                    align:"none"
                });
            }
        }
        editor.execCommand('insertvideo',videoObjs);
    }

    /**
     * 找到id下具有focus类的节点并返回该节点下的某个属性
     * @param id
     * @param returnProperty
     */
    function findFocus( id, returnProperty ) {
        var tabs = $G( id ).children,
                property;
        for ( var i = 0, ci; ci = tabs[i++]; ) {
            if ( ci.className=="focus" ) {
                property = ci.getAttribute( returnProperty );
                break;
            }
        }
        return property;
    }
    function convert_url(url){
        if ( !url ) return '';
        url = utils.trim(url)
            .replace(/v\.youku\.com\/v_show\/id_([\w\-=]+)\.html/i, 'player.youku.com/player.php/sid/$1/v.swf')
            .replace(/(www\.)?youtube\.com\/watch\?v=([\w\-]+)/i, "www.youtube.com/v/$2")
            .replace(/youtu.be\/(\w+)$/i, "www.youtube.com/v/$1")
            .replace(/v\.ku6\.com\/.+\/([\w\.]+)\.html.*$/i, "player.ku6.com/refer/$1/v.swf")
            .replace(/www\.56\.com\/u\d+\/v_([\w\-]+)\.html/i, "player.56.com/v_$1.swf")
            .replace(/www.56.com\/w\d+\/play_album\-aid\-\d+_vid\-([^.]+)\.html/i, "player.56.com/v_$1.swf")
            .replace(/v\.pps\.tv\/play_([\w]+)\.html.*$/i, "player.pps.tv/player/sid/$1/v.swf")
            .replace(/www\.letv\.com\/ptv\/vplay\/([\d]+)\.html.*$/i, "i7.imgs.letv.com/player/swfPlayer.swf?id=$1&autoplay=0")
            .replace(/www\.tudou\.com\/programs\/view\/([\w\-]+)\/?/i, "www.tudou.com/v/$1")
            .replace(/v\.qq\.com\/cover\/[\w]+\/[\w]+\/([\w]+)\.html/i, "static.video.qq.com/TPout.swf?vid=$1")
            .replace(/v\.qq\.com\/.+[\?\&]vid=([^&]+).*$/i, "static.video.qq.com/TPout.swf?vid=$1")
            .replace(/my\.tv\.sohu\.com\/[\w]+\/[\d]+\/([\d]+)\.shtml.*$/i, "share.vrs.sohu.com/my/v.swf&id=$1");

        return url;
    }

    /**
      * 检测传入的所有input框中输入的长宽是否是正数
      * @param nodes input框集合，
      */
     function checkNum( nodes ) {
         for ( var i = 0, ci; ci = nodes[i++]; ) {
             var value = ci.value;
             if ( !isNumber( value ) && value) {
                 alert( lang.numError );
                 ci.value = "";
                 ci.focus();
                 return false;
             }
         }
         return true;
     }

    /**
     * 数字判断
     * @param value
     */
    function isNumber( value ) {
        return /(0|^[1-9]\d*$)/.test( value );
    }

    /**
      * 创建图片浮动选择按钮
      * @param ids
      */
     function createAlignButton( ids ) {
         for ( var i = 0, ci; ci = ids[i++]; ) {
             var floatContainer = $G( ci ),
                     nameMaps = {"none":lang['default'], "left":lang.floatLeft, "right":lang.floatRight, "center":lang.block};
             for ( var j in nameMaps ) {
                 var div = document.createElement( "div" );
                 div.setAttribute( "name", j );
                 if ( j == "none" ) div.className="focus";
                 div.style.cssText = "background:url(images/" + j + "_focus.jpg);";
                 div.setAttribute( "title", nameMaps[j] );
                 floatContainer.appendChild( div );
             }
             switchSelect( ci );
         }
     }

    /**
     * 选择切换
     * @param selectParentId
     */
    function switchSelect( selectParentId ) {
        var selects = $G( selectParentId ).children;
        for ( var i = 0, ci; ci = selects[i++]; ) {
            domUtils.on( ci, "click", function () {
                for ( var j = 0, cj; cj = selects[j++]; ) {
                    cj.className = "";
                    cj.removeAttribute && cj.removeAttribute( "class" );
                }
                this.className = "focus";
            } )
        }
    }

    /**
     * 监听url改变事件
     * @param url
     */
    function addUrlChangeListener(url){
        if (browser.ie) {
            url.onpropertychange = function () {
                createPreviewVideo( this.value );
            }
        } else {
            url.addEventListener( "input", function () {
                createPreviewVideo( this.value );
            }, false );
        }
    }

    /**
     * 根据url生成视频预览
     * @param url
     */
    function createPreviewVideo(url){
        if ( !url )return;

        var conUrl = convert_url(url);

        conUrl = utils.unhtmlForUrl(conUrl);

        $G("preview").innerHTML = '<div class="previewMsg"><span>'+lang.urlError+'</span></div>'+
        '<embed class="previewVideo" type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer"' +
            ' src="' + conUrl + '"' +
            ' width="' + 420  + '"' +
            ' height="' + 280  + '"' +
            ' wmode="transparent" play="true" loop="false" menu="false" allowscriptaccess="never" allowfullscreen="true" >' +
        '</embed>';
    }


    /* 插入上传视频 */
    function insertUpload(){
        var videoObjs=[],
            uploadDir = editor.getOpt('videoUrlPrefix'),
            width = parseInt($G('upload_width').value, 10) || 420,
            height = parseInt($G('upload_height').value, 10) || 280,
            align = findFocus("upload_alignment","name") || 'none';
        for(var key in uploadVideoList) {
            var file = uploadVideoList[key];
            videoObjs.push({
                url: uploadDir + file.url,
                width:width,
                height:height,
                align:align
            });
        }

        var count = uploadFile.getQueueCount();
        if (count) {
            $('.info', '#queueList').html('<span style="color:red;">' + '还有2个未上传文件'.replace(/[\d]/, count) + '</span>');
            return false;
        } else {
            editor.execCommand('insertvideo', videoObjs, 'upload');
        }
    }

    /*初始化上传标签*/
    function initUpload(){
        uploadFile = new UploadFile('queueList');
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
                actionUrl = editor.getActionUrl(editor.getOpt('videoActionName')),
                fileMaxSize = editor.getOpt('videoMaxSize'),
                acceptExtensions = (editor.getOpt('videoAllowFiles') || []).join('').replace(/\./g, ',').replace(/^[,]/, '');;

            if (!WebUploader.Uploader.support()) {
                $('#filePickerReady').after($('<div>').html(lang.errorNotSupport)).hide();
                return;
            } else if (!editor.getOpt('videoActionName')) {
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
                fileVal: editor.getOpt('videoFieldName'),
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
                            '<span class="file-title">' + file.name + '</span>');
                    } else {
                        if (browser.ie && browser.version <= 7) {
                            $wrap.text(lang.uploadNoPreview);
                        } else {
                            uploader.makeThumb(file, function (error, src) {
                                if (error || !src || (/^data:/.test(src) && browser.ie && browser.version <= 7)) {
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
                        uploadVideoList.push({
                            'url': json.url,
                            'type': json.type,
                            'original':json.original
                        });
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
        refresh: function(){
            this.uploader.refresh();
        }
    };

})();

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvZGlhbG9ncy92aWRlby92aWRlby5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQ3JlYXRlZCBieSBKZXRCcmFpbnMgUGhwU3Rvcm0uXHJcbiAqIFVzZXI6IHRhb3FpbGlcclxuICogRGF0ZTogMTItMi0yMFxyXG4gKiBUaW1lOiDkuIrljYgxMToxOVxyXG4gKiBUbyBjaGFuZ2UgdGhpcyB0ZW1wbGF0ZSB1c2UgRmlsZSB8IFNldHRpbmdzIHwgRmlsZSBUZW1wbGF0ZXMuXHJcbiAqL1xyXG5cclxuKGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgdmFyIHZpZGVvID0ge30sXHJcbiAgICAgICAgdXBsb2FkVmlkZW9MaXN0ID0gW10sXHJcbiAgICAgICAgaXNNb2RpZnlVcGxvYWRWaWRlbyA9IGZhbHNlLFxyXG4gICAgICAgIHVwbG9hZEZpbGU7XHJcblxyXG4gICAgd2luZG93Lm9ubG9hZCA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgJGZvY3VzKCRHKFwidmlkZW9VcmxcIikpO1xyXG4gICAgICAgIGluaXRUYWJzKCk7XHJcbiAgICAgICAgaW5pdFZpZGVvKCk7XHJcbiAgICAgICAgaW5pdFVwbG9hZCgpO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKiDliJ3lp4vljJZ0YWLmoIfnrb4gKi9cclxuICAgIGZ1bmN0aW9uIGluaXRUYWJzKCl7XHJcbiAgICAgICAgdmFyIHRhYnMgPSAkRygndGFiSGVhZHMnKS5jaGlsZHJlbjtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRhYnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgZG9tVXRpbHMub24odGFic1tpXSwgXCJjbGlja1wiLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGosIGJvZHlJZCwgdGFyZ2V0ID0gZS50YXJnZXQgfHwgZS5zcmNFbGVtZW50O1xyXG4gICAgICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IHRhYnMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBib2R5SWQgPSB0YWJzW2pdLmdldEF0dHJpYnV0ZSgnZGF0YS1jb250ZW50LWlkJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYodGFic1tqXSA9PSB0YXJnZXQpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkb21VdGlscy5hZGRDbGFzcyh0YWJzW2pdLCAnZm9jdXMnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZG9tVXRpbHMuYWRkQ2xhc3MoJEcoYm9keUlkKSwgJ2ZvY3VzJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfWVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkb21VdGlscy5yZW1vdmVDbGFzc2VzKHRhYnNbal0sICdmb2N1cycpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkb21VdGlscy5yZW1vdmVDbGFzc2VzKCRHKGJvZHlJZCksICdmb2N1cycpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGluaXRWaWRlbygpe1xyXG4gICAgICAgIGNyZWF0ZUFsaWduQnV0dG9uKCBbXCJ2aWRlb0Zsb2F0XCIsIFwidXBsb2FkX2FsaWdubWVudFwiXSApO1xyXG4gICAgICAgIGFkZFVybENoYW5nZUxpc3RlbmVyKCRHKFwidmlkZW9VcmxcIikpO1xyXG4gICAgICAgIGFkZE9rTGlzdGVuZXIoKTtcclxuXHJcbiAgICAgICAgLy/nvJbovpHop4bpopHml7bliJ3lp4vljJbnm7jlhbPkv6Hmga9cclxuICAgICAgICAoZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgdmFyIGltZyA9IGVkaXRvci5zZWxlY3Rpb24uZ2V0UmFuZ2UoKS5nZXRDbG9zZWROb2RlKCksdXJsO1xyXG4gICAgICAgICAgICBpZihpbWcgJiYgaW1nLmNsYXNzTmFtZSl7XHJcbiAgICAgICAgICAgICAgICB2YXIgaGFzRmFrZWRDbGFzcyA9IChpbWcuY2xhc3NOYW1lID09IFwiZWR1aS1mYWtlZC12aWRlb1wiKSxcclxuICAgICAgICAgICAgICAgICAgICBoYXNVcGxvYWRDbGFzcyA9IGltZy5jbGFzc05hbWUuaW5kZXhPZihcImVkdWktdXBsb2FkLXZpZGVvXCIpIT0tMTtcclxuICAgICAgICAgICAgICAgIGlmKGhhc0Zha2VkQ2xhc3MgfHwgaGFzVXBsb2FkQ2xhc3MpIHtcclxuICAgICAgICAgICAgICAgICAgICAkRyhcInZpZGVvVXJsXCIpLnZhbHVlID0gdXJsID0gaW1nLmdldEF0dHJpYnV0ZShcIl91cmxcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgJEcoXCJ2aWRlb1dpZHRoXCIpLnZhbHVlID0gaW1nLndpZHRoO1xyXG4gICAgICAgICAgICAgICAgICAgICRHKFwidmlkZW9IZWlnaHRcIikudmFsdWUgPSBpbWcuaGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhbGlnbiA9IGRvbVV0aWxzLmdldENvbXB1dGVkU3R5bGUoaW1nLFwiZmxvYXRcIiksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudEFsaWduID0gZG9tVXRpbHMuZ2V0Q29tcHV0ZWRTdHlsZShpbWcucGFyZW50Tm9kZSxcInRleHQtYWxpZ25cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlQWxpZ25CdXR0b24ocGFyZW50QWxpZ249PT1cImNlbnRlclwiP1wiY2VudGVyXCI6YWxpZ24pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYoaGFzVXBsb2FkQ2xhc3MpIHtcclxuICAgICAgICAgICAgICAgICAgICBpc01vZGlmeVVwbG9hZFZpZGVvID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjcmVhdGVQcmV2aWV3VmlkZW8odXJsKTtcclxuICAgICAgICB9KSgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog55uR5ZCs56Gu6K6k5ZKM5Y+W5raI5Lik5Liq5oyJ6ZKu5LqL5Lu277yM55So5oi35omn6KGM5o+S5YWl5oiW6ICF5riF56m65q2j5Zyo5pKt5pS+55qE6KeG6aKR5a6e5L6L5pON5L2cXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGFkZE9rTGlzdGVuZXIoKXtcclxuICAgICAgICBkaWFsb2cub25vayA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICRHKFwicHJldmlld1wiKS5pbm5lckhUTUwgPSBcIlwiO1xyXG4gICAgICAgICAgICB2YXIgY3VycmVudFRhYiA9ICBmaW5kRm9jdXMoXCJ0YWJIZWFkc1wiLFwidGFiU3JjXCIpO1xyXG4gICAgICAgICAgICBzd2l0Y2goY3VycmVudFRhYil7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwidmlkZW9cIjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaW5zZXJ0U2luZ2xlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwidmlkZW9TZWFyY2hcIjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaW5zZXJ0U2VhcmNoKFwic2VhcmNoTGlzdFwiKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJ1cGxvYWRcIjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaW5zZXJ0VXBsb2FkKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIGRpYWxvZy5vbmNhbmNlbCA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICRHKFwicHJldmlld1wiKS5pbm5lckhUTUwgPSBcIlwiO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDkvp3mja7kvKDlhaXnmoRhbGlnbuWAvOabtOaWsOaMiemSruS/oeaBr1xyXG4gICAgICogQHBhcmFtIGFsaWduXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIHVwZGF0ZUFsaWduQnV0dG9uKCBhbGlnbiApIHtcclxuICAgICAgICB2YXIgYWxpZ25zID0gJEcoIFwidmlkZW9GbG9hdFwiICkuY2hpbGRyZW47XHJcbiAgICAgICAgZm9yICggdmFyIGkgPSAwLCBjaTsgY2kgPSBhbGlnbnNbaSsrXTsgKSB7XHJcbiAgICAgICAgICAgIGlmICggY2kuZ2V0QXR0cmlidXRlKCBcIm5hbWVcIiApID09IGFsaWduICkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCBjaS5jbGFzc05hbWUgIT1cImZvY3VzXCIgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2kuY2xhc3NOYW1lID0gXCJmb2N1c1wiO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaWYgKCBjaS5jbGFzc05hbWUgPT1cImZvY3VzXCIgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2kuY2xhc3NOYW1lID0gXCJcIjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOWwhuWNleS4quinhumikeS/oeaBr+aPkuWFpee8lui+keWZqOS4rVxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBpbnNlcnRTaW5nbGUoKXtcclxuICAgICAgICB2YXIgd2lkdGggPSAkRyhcInZpZGVvV2lkdGhcIiksXHJcbiAgICAgICAgICAgIGhlaWdodCA9ICRHKFwidmlkZW9IZWlnaHRcIiksXHJcbiAgICAgICAgICAgIHVybD0kRygndmlkZW9VcmwnKS52YWx1ZSxcclxuICAgICAgICAgICAgYWxpZ24gPSBmaW5kRm9jdXMoXCJ2aWRlb0Zsb2F0XCIsXCJuYW1lXCIpO1xyXG4gICAgICAgIGlmKCF1cmwpIHJldHVybiBmYWxzZTtcclxuICAgICAgICBpZiAoICFjaGVja051bSggW3dpZHRoLCBoZWlnaHRdICkgKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgZWRpdG9yLmV4ZWNDb21tYW5kKCdpbnNlcnR2aWRlbycsIHtcclxuICAgICAgICAgICAgdXJsOiBjb252ZXJ0X3VybCh1cmwpLFxyXG4gICAgICAgICAgICB3aWR0aDogd2lkdGgudmFsdWUsXHJcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0LnZhbHVlLFxyXG4gICAgICAgICAgICBhbGlnbjogYWxpZ25cclxuICAgICAgICB9LCBpc01vZGlmeVVwbG9hZFZpZGVvID8gJ3VwbG9hZCc6bnVsbCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDlsIblhYPntKBpZOS4i+eahOaJgOacieS7o+ihqOinhumikeeahOWbvueJh+aPkuWFpee8lui+keWZqOS4rVxyXG4gICAgICogQHBhcmFtIGlkXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGluc2VydFNlYXJjaChpZCl7XHJcbiAgICAgICAgdmFyIGltZ3MgPSBkb21VdGlscy5nZXRFbGVtZW50c0J5VGFnTmFtZSgkRyhpZCksXCJpbWdcIiksXHJcbiAgICAgICAgICAgIHZpZGVvT2Jqcz1bXTtcclxuICAgICAgICBmb3IodmFyIGk9MCxpbWc7IGltZz1pbWdzW2krK107KXtcclxuICAgICAgICAgICAgaWYoaW1nLmdldEF0dHJpYnV0ZShcInNlbGVjdGVkXCIpKXtcclxuICAgICAgICAgICAgICAgIHZpZGVvT2Jqcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICB1cmw6aW1nLmdldEF0dHJpYnV0ZShcInVlX3ZpZGVvX3VybFwiKSxcclxuICAgICAgICAgICAgICAgICAgICB3aWR0aDo0MjAsXHJcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OjI4MCxcclxuICAgICAgICAgICAgICAgICAgICBhbGlnbjpcIm5vbmVcIlxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWRpdG9yLmV4ZWNDb21tYW5kKCdpbnNlcnR2aWRlbycsdmlkZW9PYmpzKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOaJvuWIsGlk5LiL5YW35pyJZm9jdXPnsbvnmoToioLngrnlubbov5Tlm57or6XoioLngrnkuIvnmoTmn5DkuKrlsZ7mgKdcclxuICAgICAqIEBwYXJhbSBpZFxyXG4gICAgICogQHBhcmFtIHJldHVyblByb3BlcnR5XHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGZpbmRGb2N1cyggaWQsIHJldHVyblByb3BlcnR5ICkge1xyXG4gICAgICAgIHZhciB0YWJzID0gJEcoIGlkICkuY2hpbGRyZW4sXHJcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eTtcclxuICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGNpOyBjaSA9IHRhYnNbaSsrXTsgKSB7XHJcbiAgICAgICAgICAgIGlmICggY2kuY2xhc3NOYW1lPT1cImZvY3VzXCIgKSB7XHJcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eSA9IGNpLmdldEF0dHJpYnV0ZSggcmV0dXJuUHJvcGVydHkgKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBwcm9wZXJ0eTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIGNvbnZlcnRfdXJsKHVybCl7XHJcbiAgICAgICAgaWYgKCAhdXJsICkgcmV0dXJuICcnO1xyXG4gICAgICAgIHVybCA9IHV0aWxzLnRyaW0odXJsKVxyXG4gICAgICAgICAgICAucmVwbGFjZSgvdlxcLnlvdWt1XFwuY29tXFwvdl9zaG93XFwvaWRfKFtcXHdcXC09XSspXFwuaHRtbC9pLCAncGxheWVyLnlvdWt1LmNvbS9wbGF5ZXIucGhwL3NpZC8kMS92LnN3ZicpXHJcbiAgICAgICAgICAgIC5yZXBsYWNlKC8od3d3XFwuKT95b3V0dWJlXFwuY29tXFwvd2F0Y2hcXD92PShbXFx3XFwtXSspL2ksIFwid3d3LnlvdXR1YmUuY29tL3YvJDJcIilcclxuICAgICAgICAgICAgLnJlcGxhY2UoL3lvdXR1LmJlXFwvKFxcdyspJC9pLCBcInd3dy55b3V0dWJlLmNvbS92LyQxXCIpXHJcbiAgICAgICAgICAgIC5yZXBsYWNlKC92XFwua3U2XFwuY29tXFwvLitcXC8oW1xcd1xcLl0rKVxcLmh0bWwuKiQvaSwgXCJwbGF5ZXIua3U2LmNvbS9yZWZlci8kMS92LnN3ZlwiKVxyXG4gICAgICAgICAgICAucmVwbGFjZSgvd3d3XFwuNTZcXC5jb21cXC91XFxkK1xcL3ZfKFtcXHdcXC1dKylcXC5odG1sL2ksIFwicGxheWVyLjU2LmNvbS92XyQxLnN3ZlwiKVxyXG4gICAgICAgICAgICAucmVwbGFjZSgvd3d3LjU2LmNvbVxcL3dcXGQrXFwvcGxheV9hbGJ1bVxcLWFpZFxcLVxcZCtfdmlkXFwtKFteLl0rKVxcLmh0bWwvaSwgXCJwbGF5ZXIuNTYuY29tL3ZfJDEuc3dmXCIpXHJcbiAgICAgICAgICAgIC5yZXBsYWNlKC92XFwucHBzXFwudHZcXC9wbGF5XyhbXFx3XSspXFwuaHRtbC4qJC9pLCBcInBsYXllci5wcHMudHYvcGxheWVyL3NpZC8kMS92LnN3ZlwiKVxyXG4gICAgICAgICAgICAucmVwbGFjZSgvd3d3XFwubGV0dlxcLmNvbVxcL3B0dlxcL3ZwbGF5XFwvKFtcXGRdKylcXC5odG1sLiokL2ksIFwiaTcuaW1ncy5sZXR2LmNvbS9wbGF5ZXIvc3dmUGxheWVyLnN3Zj9pZD0kMSZhdXRvcGxheT0wXCIpXHJcbiAgICAgICAgICAgIC5yZXBsYWNlKC93d3dcXC50dWRvdVxcLmNvbVxcL3Byb2dyYW1zXFwvdmlld1xcLyhbXFx3XFwtXSspXFwvPy9pLCBcInd3dy50dWRvdS5jb20vdi8kMVwiKVxyXG4gICAgICAgICAgICAucmVwbGFjZSgvdlxcLnFxXFwuY29tXFwvY292ZXJcXC9bXFx3XStcXC9bXFx3XStcXC8oW1xcd10rKVxcLmh0bWwvaSwgXCJzdGF0aWMudmlkZW8ucXEuY29tL1RQb3V0LnN3Zj92aWQ9JDFcIilcclxuICAgICAgICAgICAgLnJlcGxhY2UoL3ZcXC5xcVxcLmNvbVxcLy4rW1xcP1xcJl12aWQ9KFteJl0rKS4qJC9pLCBcInN0YXRpYy52aWRlby5xcS5jb20vVFBvdXQuc3dmP3ZpZD0kMVwiKVxyXG4gICAgICAgICAgICAucmVwbGFjZSgvbXlcXC50dlxcLnNvaHVcXC5jb21cXC9bXFx3XStcXC9bXFxkXStcXC8oW1xcZF0rKVxcLnNodG1sLiokL2ksIFwic2hhcmUudnJzLnNvaHUuY29tL215L3Yuc3dmJmlkPSQxXCIpO1xyXG5cclxuICAgICAgICByZXR1cm4gdXJsO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICAqIOajgOa1i+S8oOWFpeeahOaJgOaciWlucHV05qGG5Lit6L6T5YWl55qE6ZW/5a695piv5ZCm5piv5q2j5pWwXHJcbiAgICAgICogQHBhcmFtIG5vZGVzIGlucHV05qGG6ZuG5ZCI77yMXHJcbiAgICAgICovXHJcbiAgICAgZnVuY3Rpb24gY2hlY2tOdW0oIG5vZGVzICkge1xyXG4gICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGNpOyBjaSA9IG5vZGVzW2krK107ICkge1xyXG4gICAgICAgICAgICAgdmFyIHZhbHVlID0gY2kudmFsdWU7XHJcbiAgICAgICAgICAgICBpZiAoICFpc051bWJlciggdmFsdWUgKSAmJiB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgIGFsZXJ0KCBsYW5nLm51bUVycm9yICk7XHJcbiAgICAgICAgICAgICAgICAgY2kudmFsdWUgPSBcIlwiO1xyXG4gICAgICAgICAgICAgICAgIGNpLmZvY3VzKCk7XHJcbiAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgfVxyXG4gICAgICAgICB9XHJcbiAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOaVsOWtl+WIpOaWrVxyXG4gICAgICogQHBhcmFtIHZhbHVlXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGlzTnVtYmVyKCB2YWx1ZSApIHtcclxuICAgICAgICByZXR1cm4gLygwfF5bMS05XVxcZCokKS8udGVzdCggdmFsdWUgKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAgKiDliJvlu7rlm77niYfmta7liqjpgInmi6nmjInpkq5cclxuICAgICAgKiBAcGFyYW0gaWRzXHJcbiAgICAgICovXHJcbiAgICAgZnVuY3Rpb24gY3JlYXRlQWxpZ25CdXR0b24oIGlkcyApIHtcclxuICAgICAgICAgZm9yICggdmFyIGkgPSAwLCBjaTsgY2kgPSBpZHNbaSsrXTsgKSB7XHJcbiAgICAgICAgICAgICB2YXIgZmxvYXRDb250YWluZXIgPSAkRyggY2kgKSxcclxuICAgICAgICAgICAgICAgICAgICAgbmFtZU1hcHMgPSB7XCJub25lXCI6bGFuZ1snZGVmYXVsdCddLCBcImxlZnRcIjpsYW5nLmZsb2F0TGVmdCwgXCJyaWdodFwiOmxhbmcuZmxvYXRSaWdodCwgXCJjZW50ZXJcIjpsYW5nLmJsb2NrfTtcclxuICAgICAgICAgICAgIGZvciAoIHZhciBqIGluIG5hbWVNYXBzICkge1xyXG4gICAgICAgICAgICAgICAgIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCBcImRpdlwiICk7XHJcbiAgICAgICAgICAgICAgICAgZGl2LnNldEF0dHJpYnV0ZSggXCJuYW1lXCIsIGogKTtcclxuICAgICAgICAgICAgICAgICBpZiAoIGogPT0gXCJub25lXCIgKSBkaXYuY2xhc3NOYW1lPVwiZm9jdXNcIjtcclxuICAgICAgICAgICAgICAgICBkaXYuc3R5bGUuY3NzVGV4dCA9IFwiYmFja2dyb3VuZDp1cmwoaW1hZ2VzL1wiICsgaiArIFwiX2ZvY3VzLmpwZyk7XCI7XHJcbiAgICAgICAgICAgICAgICAgZGl2LnNldEF0dHJpYnV0ZSggXCJ0aXRsZVwiLCBuYW1lTWFwc1tqXSApO1xyXG4gICAgICAgICAgICAgICAgIGZsb2F0Q29udGFpbmVyLmFwcGVuZENoaWxkKCBkaXYgKTtcclxuICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgIHN3aXRjaFNlbGVjdCggY2kgKTtcclxuICAgICAgICAgfVxyXG4gICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOmAieaLqeWIh+aNolxyXG4gICAgICogQHBhcmFtIHNlbGVjdFBhcmVudElkXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIHN3aXRjaFNlbGVjdCggc2VsZWN0UGFyZW50SWQgKSB7XHJcbiAgICAgICAgdmFyIHNlbGVjdHMgPSAkRyggc2VsZWN0UGFyZW50SWQgKS5jaGlsZHJlbjtcclxuICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGNpOyBjaSA9IHNlbGVjdHNbaSsrXTsgKSB7XHJcbiAgICAgICAgICAgIGRvbVV0aWxzLm9uKCBjaSwgXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaiA9IDAsIGNqOyBjaiA9IHNlbGVjdHNbaisrXTsgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2ouY2xhc3NOYW1lID0gXCJcIjtcclxuICAgICAgICAgICAgICAgICAgICBjai5yZW1vdmVBdHRyaWJ1dGUgJiYgY2oucmVtb3ZlQXR0cmlidXRlKCBcImNsYXNzXCIgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NOYW1lID0gXCJmb2N1c1wiO1xyXG4gICAgICAgICAgICB9IClcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDnm5HlkKx1cmzmlLnlj5jkuovku7ZcclxuICAgICAqIEBwYXJhbSB1cmxcclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gYWRkVXJsQ2hhbmdlTGlzdGVuZXIodXJsKXtcclxuICAgICAgICBpZiAoYnJvd3Nlci5pZSkge1xyXG4gICAgICAgICAgICB1cmwub25wcm9wZXJ0eWNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGNyZWF0ZVByZXZpZXdWaWRlbyggdGhpcy52YWx1ZSApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdXJsLmFkZEV2ZW50TGlzdGVuZXIoIFwiaW5wdXRcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY3JlYXRlUHJldmlld1ZpZGVvKCB0aGlzLnZhbHVlICk7XHJcbiAgICAgICAgICAgIH0sIGZhbHNlICk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog5qC55o2udXJs55Sf5oiQ6KeG6aKR6aKE6KeIXHJcbiAgICAgKiBAcGFyYW0gdXJsXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGNyZWF0ZVByZXZpZXdWaWRlbyh1cmwpe1xyXG4gICAgICAgIGlmICggIXVybCApcmV0dXJuO1xyXG5cclxuICAgICAgICB2YXIgY29uVXJsID0gY29udmVydF91cmwodXJsKTtcclxuXHJcbiAgICAgICAgY29uVXJsID0gdXRpbHMudW5odG1sRm9yVXJsKGNvblVybCk7XHJcblxyXG4gICAgICAgICRHKFwicHJldmlld1wiKS5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cInByZXZpZXdNc2dcIj48c3Bhbj4nK2xhbmcudXJsRXJyb3IrJzwvc3Bhbj48L2Rpdj4nK1xyXG4gICAgICAgICc8ZW1iZWQgY2xhc3M9XCJwcmV2aWV3VmlkZW9cIiB0eXBlPVwiYXBwbGljYXRpb24veC1zaG9ja3dhdmUtZmxhc2hcIiBwbHVnaW5zcGFnZT1cImh0dHA6Ly93d3cubWFjcm9tZWRpYS5jb20vZ28vZ2V0Zmxhc2hwbGF5ZXJcIicgK1xyXG4gICAgICAgICAgICAnIHNyYz1cIicgKyBjb25VcmwgKyAnXCInICtcclxuICAgICAgICAgICAgJyB3aWR0aD1cIicgKyA0MjAgICsgJ1wiJyArXHJcbiAgICAgICAgICAgICcgaGVpZ2h0PVwiJyArIDI4MCAgKyAnXCInICtcclxuICAgICAgICAgICAgJyB3bW9kZT1cInRyYW5zcGFyZW50XCIgcGxheT1cInRydWVcIiBsb29wPVwiZmFsc2VcIiBtZW51PVwiZmFsc2VcIiBhbGxvd3NjcmlwdGFjY2Vzcz1cIm5ldmVyXCIgYWxsb3dmdWxsc2NyZWVuPVwidHJ1ZVwiID4nICtcclxuICAgICAgICAnPC9lbWJlZD4nO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvKiDmj5LlhaXkuIrkvKDop4bpopEgKi9cclxuICAgIGZ1bmN0aW9uIGluc2VydFVwbG9hZCgpe1xyXG4gICAgICAgIHZhciB2aWRlb09ianM9W10sXHJcbiAgICAgICAgICAgIHVwbG9hZERpciA9IGVkaXRvci5nZXRPcHQoJ3ZpZGVvVXJsUHJlZml4JyksXHJcbiAgICAgICAgICAgIHdpZHRoID0gcGFyc2VJbnQoJEcoJ3VwbG9hZF93aWR0aCcpLnZhbHVlLCAxMCkgfHwgNDIwLFxyXG4gICAgICAgICAgICBoZWlnaHQgPSBwYXJzZUludCgkRygndXBsb2FkX2hlaWdodCcpLnZhbHVlLCAxMCkgfHwgMjgwLFxyXG4gICAgICAgICAgICBhbGlnbiA9IGZpbmRGb2N1cyhcInVwbG9hZF9hbGlnbm1lbnRcIixcIm5hbWVcIikgfHwgJ25vbmUnO1xyXG4gICAgICAgIGZvcih2YXIga2V5IGluIHVwbG9hZFZpZGVvTGlzdCkge1xyXG4gICAgICAgICAgICB2YXIgZmlsZSA9IHVwbG9hZFZpZGVvTGlzdFtrZXldO1xyXG4gICAgICAgICAgICB2aWRlb09ianMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICB1cmw6IHVwbG9hZERpciArIGZpbGUudXJsLFxyXG4gICAgICAgICAgICAgICAgd2lkdGg6d2lkdGgsXHJcbiAgICAgICAgICAgICAgICBoZWlnaHQ6aGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgYWxpZ246YWxpZ25cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgY291bnQgPSB1cGxvYWRGaWxlLmdldFF1ZXVlQ291bnQoKTtcclxuICAgICAgICBpZiAoY291bnQpIHtcclxuICAgICAgICAgICAgJCgnLmluZm8nLCAnI3F1ZXVlTGlzdCcpLmh0bWwoJzxzcGFuIHN0eWxlPVwiY29sb3I6cmVkO1wiPicgKyAn6L+Y5pyJMuS4quacquS4iuS8oOaWh+S7ticucmVwbGFjZSgvW1xcZF0vLCBjb3VudCkgKyAnPC9zcGFuPicpO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZWRpdG9yLmV4ZWNDb21tYW5kKCdpbnNlcnR2aWRlbycsIHZpZGVvT2JqcywgJ3VwbG9hZCcpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKuWIneWni+WMluS4iuS8oOagh+etviovXHJcbiAgICBmdW5jdGlvbiBpbml0VXBsb2FkKCl7XHJcbiAgICAgICAgdXBsb2FkRmlsZSA9IG5ldyBVcGxvYWRGaWxlKCdxdWV1ZUxpc3QnKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgLyog5LiK5Lyg6ZmE5Lu2ICovXHJcbiAgICBmdW5jdGlvbiBVcGxvYWRGaWxlKHRhcmdldCkge1xyXG4gICAgICAgIHRoaXMuJHdyYXAgPSB0YXJnZXQuY29uc3RydWN0b3IgPT0gU3RyaW5nID8gJCgnIycgKyB0YXJnZXQpIDogJCh0YXJnZXQpO1xyXG4gICAgICAgIHRoaXMuaW5pdCgpO1xyXG4gICAgfVxyXG4gICAgVXBsb2FkRmlsZS5wcm90b3R5cGUgPSB7XHJcbiAgICAgICAgaW5pdDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB0aGlzLmZpbGVMaXN0ID0gW107XHJcbiAgICAgICAgICAgIHRoaXMuaW5pdENvbnRhaW5lcigpO1xyXG4gICAgICAgICAgICB0aGlzLmluaXRVcGxvYWRlcigpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgaW5pdENvbnRhaW5lcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB0aGlzLiRxdWV1ZSA9IHRoaXMuJHdyYXAuZmluZCgnLmZpbGVsaXN0Jyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAvKiDliJ3lp4vljJblrrnlmaggKi9cclxuICAgICAgICBpbml0VXBsb2FkZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcyxcclxuICAgICAgICAgICAgICAgICQgPSBqUXVlcnksICAgIC8vIGp1c3QgaW4gY2FzZS4gTWFrZSBzdXJlIGl0J3Mgbm90IGFuIG90aGVyIGxpYmFyYXkuXHJcbiAgICAgICAgICAgICAgICAkd3JhcCA9IF90aGlzLiR3cmFwLFxyXG4gICAgICAgICAgICAvLyDlm77niYflrrnlmahcclxuICAgICAgICAgICAgICAgICRxdWV1ZSA9ICR3cmFwLmZpbmQoJy5maWxlbGlzdCcpLFxyXG4gICAgICAgICAgICAvLyDnirbmgIHmoI/vvIzljIXmi6zov5vluqblkozmjqfliLbmjInpkq5cclxuICAgICAgICAgICAgICAgICRzdGF0dXNCYXIgPSAkd3JhcC5maW5kKCcuc3RhdHVzQmFyJyksXHJcbiAgICAgICAgICAgIC8vIOaWh+S7tuaAu+S9k+mAieaLqeS/oeaBr+OAglxyXG4gICAgICAgICAgICAgICAgJGluZm8gPSAkc3RhdHVzQmFyLmZpbmQoJy5pbmZvJyksXHJcbiAgICAgICAgICAgIC8vIOS4iuS8oOaMiemSrlxyXG4gICAgICAgICAgICAgICAgJHVwbG9hZCA9ICR3cmFwLmZpbmQoJy51cGxvYWRCdG4nKSxcclxuICAgICAgICAgICAgLy8g5LiK5Lyg5oyJ6ZKuXHJcbiAgICAgICAgICAgICAgICAkZmlsZVBpY2tlckJ0biA9ICR3cmFwLmZpbmQoJy5maWxlUGlja2VyQnRuJyksXHJcbiAgICAgICAgICAgIC8vIOS4iuS8oOaMiemSrlxyXG4gICAgICAgICAgICAgICAgJGZpbGVQaWNrZXJCbG9jayA9ICR3cmFwLmZpbmQoJy5maWxlUGlja2VyQmxvY2snKSxcclxuICAgICAgICAgICAgLy8g5rKh6YCJ5oup5paH5Lu25LmL5YmN55qE5YaF5a6544CCXHJcbiAgICAgICAgICAgICAgICAkcGxhY2VIb2xkZXIgPSAkd3JhcC5maW5kKCcucGxhY2Vob2xkZXInKSxcclxuICAgICAgICAgICAgLy8g5oC75L2T6L+b5bqm5p2hXHJcbiAgICAgICAgICAgICAgICAkcHJvZ3Jlc3MgPSAkc3RhdHVzQmFyLmZpbmQoJy5wcm9ncmVzcycpLmhpZGUoKSxcclxuICAgICAgICAgICAgLy8g5re75Yqg55qE5paH5Lu25pWw6YePXHJcbiAgICAgICAgICAgICAgICBmaWxlQ291bnQgPSAwLFxyXG4gICAgICAgICAgICAvLyDmt7vliqDnmoTmlofku7bmgLvlpKflsI9cclxuICAgICAgICAgICAgICAgIGZpbGVTaXplID0gMCxcclxuICAgICAgICAgICAgLy8g5LyY5YyWcmV0aW5hLCDlnKhyZXRpbmHkuIvov5nkuKrlgLzmmK8yXHJcbiAgICAgICAgICAgICAgICByYXRpbyA9IHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvIHx8IDEsXHJcbiAgICAgICAgICAgIC8vIOe8qeeVpeWbvuWkp+Wwj1xyXG4gICAgICAgICAgICAgICAgdGh1bWJuYWlsV2lkdGggPSAxMTMgKiByYXRpbyxcclxuICAgICAgICAgICAgICAgIHRodW1ibmFpbEhlaWdodCA9IDExMyAqIHJhdGlvLFxyXG4gICAgICAgICAgICAvLyDlj6/og73mnIlwZWRkaW5nLCByZWFkeSwgdXBsb2FkaW5nLCBjb25maXJtLCBkb25lLlxyXG4gICAgICAgICAgICAgICAgc3RhdGUgPSAnJyxcclxuICAgICAgICAgICAgLy8g5omA5pyJ5paH5Lu255qE6L+b5bqm5L+h5oGv77yMa2V55Li6ZmlsZSBpZFxyXG4gICAgICAgICAgICAgICAgcGVyY2VudGFnZXMgPSB7fSxcclxuICAgICAgICAgICAgICAgIHN1cHBvcnRUcmFuc2l0aW9uID0gKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKS5zdHlsZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgciA9ICd0cmFuc2l0aW9uJyBpbiBzIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnV2Via2l0VHJhbnNpdGlvbicgaW4gcyB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ01velRyYW5zaXRpb24nIGluIHMgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdtc1RyYW5zaXRpb24nIGluIHMgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdPVHJhbnNpdGlvbicgaW4gcztcclxuICAgICAgICAgICAgICAgICAgICBzID0gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcjtcclxuICAgICAgICAgICAgICAgIH0pKCksXHJcbiAgICAgICAgICAgIC8vIFdlYlVwbG9hZGVy5a6e5L6LXHJcbiAgICAgICAgICAgICAgICB1cGxvYWRlcixcclxuICAgICAgICAgICAgICAgIGFjdGlvblVybCA9IGVkaXRvci5nZXRBY3Rpb25VcmwoZWRpdG9yLmdldE9wdCgndmlkZW9BY3Rpb25OYW1lJykpLFxyXG4gICAgICAgICAgICAgICAgZmlsZU1heFNpemUgPSBlZGl0b3IuZ2V0T3B0KCd2aWRlb01heFNpemUnKSxcclxuICAgICAgICAgICAgICAgIGFjY2VwdEV4dGVuc2lvbnMgPSAoZWRpdG9yLmdldE9wdCgndmlkZW9BbGxvd0ZpbGVzJykgfHwgW10pLmpvaW4oJycpLnJlcGxhY2UoL1xcLi9nLCAnLCcpLnJlcGxhY2UoL15bLF0vLCAnJyk7O1xyXG5cclxuICAgICAgICAgICAgaWYgKCFXZWJVcGxvYWRlci5VcGxvYWRlci5zdXBwb3J0KCkpIHtcclxuICAgICAgICAgICAgICAgICQoJyNmaWxlUGlja2VyUmVhZHknKS5hZnRlcigkKCc8ZGl2PicpLmh0bWwobGFuZy5lcnJvck5vdFN1cHBvcnQpKS5oaWRlKCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIWVkaXRvci5nZXRPcHQoJ3ZpZGVvQWN0aW9uTmFtZScpKSB7XHJcbiAgICAgICAgICAgICAgICAkKCcjZmlsZVBpY2tlclJlYWR5JykuYWZ0ZXIoJCgnPGRpdj4nKS5odG1sKGxhbmcuZXJyb3JMb2FkQ29uZmlnKSkuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB1cGxvYWRlciA9IF90aGlzLnVwbG9hZGVyID0gV2ViVXBsb2FkZXIuY3JlYXRlKHtcclxuICAgICAgICAgICAgICAgIHBpY2s6IHtcclxuICAgICAgICAgICAgICAgICAgICBpZDogJyNmaWxlUGlja2VyUmVhZHknLFxyXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiBsYW5nLnVwbG9hZFNlbGVjdEZpbGVcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBzd2Y6ICcuLi8uLi90aGlyZC1wYXJ0eS93ZWJ1cGxvYWRlci9VcGxvYWRlci5zd2YnLFxyXG4gICAgICAgICAgICAgICAgc2VydmVyOiBhY3Rpb25VcmwsXHJcbiAgICAgICAgICAgICAgICBmaWxlVmFsOiBlZGl0b3IuZ2V0T3B0KCd2aWRlb0ZpZWxkTmFtZScpLFxyXG4gICAgICAgICAgICAgICAgZHVwbGljYXRlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgZmlsZVNpbmdsZVNpemVMaW1pdDogZmlsZU1heFNpemUsXHJcbiAgICAgICAgICAgICAgICBjb21wcmVzczogZmFsc2VcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHVwbG9hZGVyLmFkZEJ1dHRvbih7XHJcbiAgICAgICAgICAgICAgICBpZDogJyNmaWxlUGlja2VyQmxvY2snXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB1cGxvYWRlci5hZGRCdXR0b24oe1xyXG4gICAgICAgICAgICAgICAgaWQ6ICcjZmlsZVBpY2tlckJ0bicsXHJcbiAgICAgICAgICAgICAgICBsYWJlbDogbGFuZy51cGxvYWRBZGRGaWxlXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgc2V0U3RhdGUoJ3BlZGRpbmcnKTtcclxuXHJcbiAgICAgICAgICAgIC8vIOW9k+acieaWh+S7tua3u+WKoOi/m+adpeaXtuaJp+ihjO+8jOi0n+i0o3ZpZXfnmoTliJvlu7pcclxuICAgICAgICAgICAgZnVuY3Rpb24gYWRkRmlsZShmaWxlKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgJGxpID0gJCgnPGxpIGlkPVwiJyArIGZpbGUuaWQgKyAnXCI+JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICc8cCBjbGFzcz1cInRpdGxlXCI+JyArIGZpbGUubmFtZSArICc8L3A+JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICc8cCBjbGFzcz1cImltZ1dyYXBcIj48L3A+JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICc8cCBjbGFzcz1cInByb2dyZXNzXCI+PHNwYW4+PC9zcGFuPjwvcD4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzwvbGk+JyksXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICRidG5zID0gJCgnPGRpdiBjbGFzcz1cImZpbGUtcGFuZWxcIj4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwiY2FuY2VsXCI+JyArIGxhbmcudXBsb2FkRGVsZXRlICsgJzwvc3Bhbj4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwicm90YXRlUmlnaHRcIj4nICsgbGFuZy51cGxvYWRUdXJuUmlnaHQgKyAnPC9zcGFuPicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJyb3RhdGVMZWZ0XCI+JyArIGxhbmcudXBsb2FkVHVybkxlZnQgKyAnPC9zcGFuPjwvZGl2PicpLmFwcGVuZFRvKCRsaSksXHJcbiAgICAgICAgICAgICAgICAgICAgJHByZ3Jlc3MgPSAkbGkuZmluZCgncC5wcm9ncmVzcyBzcGFuJyksXHJcbiAgICAgICAgICAgICAgICAgICAgJHdyYXAgPSAkbGkuZmluZCgncC5pbWdXcmFwJyksXHJcbiAgICAgICAgICAgICAgICAgICAgJGluZm8gPSAkKCc8cCBjbGFzcz1cImVycm9yXCI+PC9wPicpLmhpZGUoKS5hcHBlbmRUbygkbGkpLFxyXG5cclxuICAgICAgICAgICAgICAgICAgICBzaG93RXJyb3IgPSBmdW5jdGlvbiAoY29kZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGNvZGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2V4Y2VlZF9zaXplJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0ID0gbGFuZy5lcnJvckV4Y2VlZFNpemU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdpbnRlcnJ1cHQnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQgPSBsYW5nLmVycm9ySW50ZXJydXB0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnaHR0cCc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dCA9IGxhbmcuZXJyb3JIdHRwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnbm90X2FsbG93X3R5cGUnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQgPSBsYW5nLmVycm9yRmlsZVR5cGU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQgPSBsYW5nLmVycm9yVXBsb2FkUmV0cnk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgJGluZm8udGV4dCh0ZXh0KS5zaG93KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZmlsZS5nZXRTdGF0dXMoKSA9PT0gJ2ludmFsaWQnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2hvd0Vycm9yKGZpbGUuc3RhdHVzVGV4dCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICR3cmFwLnRleHQobGFuZy51cGxvYWRQcmV2aWV3KTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoJ3xwbmd8anBnfGpwZWd8Ym1wfGdpZnwnLmluZGV4T2YoJ3wnK2ZpbGUuZXh0LnRvTG93ZXJDYXNlKCkrJ3wnKSA9PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkd3JhcC5lbXB0eSgpLmFkZENsYXNzKCdub3RpbWFnZScpLmFwcGVuZCgnPGkgY2xhc3M9XCJmaWxlLXByZXZpZXcgZmlsZS10eXBlLScgKyBmaWxlLmV4dC50b0xvd2VyQ2FzZSgpICsgJ1wiPjwvaT4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cImZpbGUtdGl0bGVcIj4nICsgZmlsZS5uYW1lICsgJzwvc3Bhbj4nKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYnJvd3Nlci5pZSAmJiBicm93c2VyLnZlcnNpb24gPD0gNykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHdyYXAudGV4dChsYW5nLnVwbG9hZE5vUHJldmlldyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cGxvYWRlci5tYWtlVGh1bWIoZmlsZSwgZnVuY3Rpb24gKGVycm9yLCBzcmMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3IgfHwgIXNyYyB8fCAoL15kYXRhOi8udGVzdChzcmMpICYmIGJyb3dzZXIuaWUgJiYgYnJvd3Nlci52ZXJzaW9uIDw9IDcpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR3cmFwLnRleHQobGFuZy51cGxvYWROb1ByZXZpZXcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciAkaW1nID0gJCgnPGltZyBzcmM9XCInICsgc3JjICsgJ1wiPicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkd3JhcC5lbXB0eSgpLmFwcGVuZCgkaW1nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJGltZy5vbignZXJyb3InLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkd3JhcC50ZXh0KGxhbmcudXBsb2FkTm9QcmV2aWV3KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgdGh1bWJuYWlsV2lkdGgsIHRodW1ibmFpbEhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcGVyY2VudGFnZXNbIGZpbGUuaWQgXSA9IFsgZmlsZS5zaXplLCAwIF07XHJcbiAgICAgICAgICAgICAgICAgICAgZmlsZS5yb3RhdGlvbiA9IDA7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8qIOajgOafpeaWh+S7tuagvOW8jyAqL1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghZmlsZS5leHQgfHwgYWNjZXB0RXh0ZW5zaW9ucy5pbmRleE9mKGZpbGUuZXh0LnRvTG93ZXJDYXNlKCkpID09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNob3dFcnJvcignbm90X2FsbG93X3R5cGUnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXBsb2FkZXIucmVtb3ZlRmlsZShmaWxlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZmlsZS5vbignc3RhdHVzY2hhbmdlJywgZnVuY3Rpb24gKGN1ciwgcHJldikge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChwcmV2ID09PSAncHJvZ3Jlc3MnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRwcmdyZXNzLmhpZGUoKS53aWR0aCgwKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHByZXYgPT09ICdxdWV1ZWQnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRsaS5vZmYoJ21vdXNlZW50ZXIgbW91c2VsZWF2ZScpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkYnRucy5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgLy8g5oiQ5YqfXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1ciA9PT0gJ2Vycm9yJyB8fCBjdXIgPT09ICdpbnZhbGlkJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzaG93RXJyb3IoZmlsZS5zdGF0dXNUZXh0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGVyY2VudGFnZXNbIGZpbGUuaWQgXVsgMSBdID0gMTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGN1ciA9PT0gJ2ludGVycnVwdCcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2hvd0Vycm9yKCdpbnRlcnJ1cHQnKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGN1ciA9PT0gJ3F1ZXVlZCcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGVyY2VudGFnZXNbIGZpbGUuaWQgXVsgMSBdID0gMDtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGN1ciA9PT0gJ3Byb2dyZXNzJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkaW5mby5oaWRlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRwcmdyZXNzLmNzcygnZGlzcGxheScsICdibG9jaycpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY3VyID09PSAnY29tcGxldGUnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAkbGkucmVtb3ZlQ2xhc3MoJ3N0YXRlLScgKyBwcmV2KS5hZGRDbGFzcygnc3RhdGUtJyArIGN1cik7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAkbGkub24oJ21vdXNlZW50ZXInLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJGJ0bnMuc3RvcCgpLmFuaW1hdGUoe2hlaWdodDogMzB9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgJGxpLm9uKCdtb3VzZWxlYXZlJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICRidG5zLnN0b3AoKS5hbmltYXRlKHtoZWlnaHQ6IDB9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICRidG5zLm9uKCdjbGljaycsICdzcGFuJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBpbmRleCA9ICQodGhpcykuaW5kZXgoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVnO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGluZGV4KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgMDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwbG9hZGVyLnJlbW92ZUZpbGUoZmlsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgMTpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUucm90YXRpb24gKz0gOTA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAyOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZS5yb3RhdGlvbiAtPSA5MDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN1cHBvcnRUcmFuc2l0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZyA9ICdyb3RhdGUoJyArIGZpbGUucm90YXRpb24gKyAnZGVnKSc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICR3cmFwLmNzcyh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnLXdlYmtpdC10cmFuc2Zvcm0nOiBkZWcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnLW1vcy10cmFuc2Zvcm0nOiBkZWcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnLW8tdHJhbnNmb3JtJzogZGVnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3RyYW5zZm9ybSc6IGRlZ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkd3JhcC5jc3MoJ2ZpbHRlcicsICdwcm9naWQ6RFhJbWFnZVRyYW5zZm9ybS5NaWNyb3NvZnQuQmFzaWNJbWFnZShyb3RhdGlvbj0nICsgKH5+KChmaWxlLnJvdGF0aW9uIC8gOTApICUgNCArIDQpICUgNCkgKyAnKScpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAkbGkuaW5zZXJ0QmVmb3JlKCRmaWxlUGlja2VyQmxvY2spO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyDotJ/otKN2aWV355qE6ZSA5q+BXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIHJlbW92ZUZpbGUoZmlsZSkge1xyXG4gICAgICAgICAgICAgICAgdmFyICRsaSA9ICQoJyMnICsgZmlsZS5pZCk7XHJcbiAgICAgICAgICAgICAgICBkZWxldGUgcGVyY2VudGFnZXNbIGZpbGUuaWQgXTtcclxuICAgICAgICAgICAgICAgIHVwZGF0ZVRvdGFsUHJvZ3Jlc3MoKTtcclxuICAgICAgICAgICAgICAgICRsaS5vZmYoKS5maW5kKCcuZmlsZS1wYW5lbCcpLm9mZigpLmVuZCgpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmdW5jdGlvbiB1cGRhdGVUb3RhbFByb2dyZXNzKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGxvYWRlZCA9IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgdG90YWwgPSAwLFxyXG4gICAgICAgICAgICAgICAgICAgIHNwYW5zID0gJHByb2dyZXNzLmNoaWxkcmVuKCksXHJcbiAgICAgICAgICAgICAgICAgICAgcGVyY2VudDtcclxuXHJcbiAgICAgICAgICAgICAgICAkLmVhY2gocGVyY2VudGFnZXMsIGZ1bmN0aW9uIChrLCB2KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdG90YWwgKz0gdlsgMCBdO1xyXG4gICAgICAgICAgICAgICAgICAgIGxvYWRlZCArPSB2WyAwIF0gKiB2WyAxIF07XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBwZXJjZW50ID0gdG90YWwgPyBsb2FkZWQgLyB0b3RhbCA6IDA7XHJcblxyXG4gICAgICAgICAgICAgICAgc3BhbnMuZXEoMCkudGV4dChNYXRoLnJvdW5kKHBlcmNlbnQgKiAxMDApICsgJyUnKTtcclxuICAgICAgICAgICAgICAgIHNwYW5zLmVxKDEpLmNzcygnd2lkdGgnLCBNYXRoLnJvdW5kKHBlcmNlbnQgKiAxMDApICsgJyUnKTtcclxuICAgICAgICAgICAgICAgIHVwZGF0ZVN0YXR1cygpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmdW5jdGlvbiBzZXRTdGF0ZSh2YWwsIGZpbGVzKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHZhbCAhPSBzdGF0ZSkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgc3RhdHMgPSB1cGxvYWRlci5nZXRTdGF0cygpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAkdXBsb2FkLnJlbW92ZUNsYXNzKCdzdGF0ZS0nICsgc3RhdGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICR1cGxvYWQuYWRkQ2xhc3MoJ3N0YXRlLScgKyB2YWwpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHZhbCkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLyog5pyq6YCJ5oup5paH5Lu2ICovXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3BlZGRpbmcnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHF1ZXVlLmFkZENsYXNzKCdlbGVtZW50LWludmlzaWJsZScpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHN0YXR1c0Jhci5hZGRDbGFzcygnZWxlbWVudC1pbnZpc2libGUnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRwbGFjZUhvbGRlci5yZW1vdmVDbGFzcygnZWxlbWVudC1pbnZpc2libGUnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRwcm9ncmVzcy5oaWRlKCk7ICRpbmZvLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwbG9hZGVyLnJlZnJlc2goKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLyog5Y+v5Lul5byA5aeL5LiK5LygICovXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3JlYWR5JzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRwbGFjZUhvbGRlci5hZGRDbGFzcygnZWxlbWVudC1pbnZpc2libGUnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRxdWV1ZS5yZW1vdmVDbGFzcygnZWxlbWVudC1pbnZpc2libGUnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzdGF0dXNCYXIucmVtb3ZlQ2xhc3MoJ2VsZW1lbnQtaW52aXNpYmxlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkcHJvZ3Jlc3MuaGlkZSgpOyAkaW5mby5zaG93KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdXBsb2FkLnRleHQobGFuZy51cGxvYWRTdGFydCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cGxvYWRlci5yZWZyZXNoKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIOS4iuS8oOS4rSAqL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICd1cGxvYWRpbmcnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHByb2dyZXNzLnNob3coKTsgJGluZm8uaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHVwbG9hZC50ZXh0KGxhbmcudXBsb2FkUGF1c2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiDmmoLlgZzkuIrkvKAgKi9cclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAncGF1c2VkJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRwcm9ncmVzcy5zaG93KCk7ICRpbmZvLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1cGxvYWQudGV4dChsYW5nLnVwbG9hZENvbnRpbnVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnY29uZmlybSc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkcHJvZ3Jlc3Muc2hvdygpOyAkaW5mby5oaWRlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdXBsb2FkLnRleHQobGFuZy51cGxvYWRTdGFydCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHMgPSB1cGxvYWRlci5nZXRTdGF0cygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXRzLnN1Y2Nlc3NOdW0gJiYgIXN0YXRzLnVwbG9hZEZhaWxOdW0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRTdGF0ZSgnZmluaXNoJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdmaW5pc2gnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHByb2dyZXNzLmhpZGUoKTsgJGluZm8uc2hvdygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXRzLnVwbG9hZEZhaWxOdW0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdXBsb2FkLnRleHQobGFuZy51cGxvYWRSZXRyeSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1cGxvYWQudGV4dChsYW5nLnVwbG9hZFN0YXJ0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUgPSB2YWw7XHJcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlU3RhdHVzKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmICghX3RoaXMuZ2V0UXVldWVDb3VudCgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJHVwbG9hZC5hZGRDbGFzcygnZGlzYWJsZWQnKVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAkdXBsb2FkLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmdW5jdGlvbiB1cGRhdGVTdGF0dXMoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGV4dCA9ICcnLCBzdGF0cztcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoc3RhdGUgPT09ICdyZWFkeScpIHtcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0ID0gbGFuZy51cGRhdGVTdGF0dXNSZWFkeS5yZXBsYWNlKCdfJywgZmlsZUNvdW50KS5yZXBsYWNlKCdfS0InLCBXZWJVcGxvYWRlci5mb3JtYXRTaXplKGZpbGVTaXplKSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHN0YXRlID09PSAnY29uZmlybScpIHtcclxuICAgICAgICAgICAgICAgICAgICBzdGF0cyA9IHVwbG9hZGVyLmdldFN0YXRzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXRzLnVwbG9hZEZhaWxOdW0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dCA9IGxhbmcudXBkYXRlU3RhdHVzQ29uZmlybS5yZXBsYWNlKCdfJywgc3RhdHMuc3VjY2Vzc051bSkucmVwbGFjZSgnXycsIHN0YXRzLnN1Y2Nlc3NOdW0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdHMgPSB1cGxvYWRlci5nZXRTdGF0cygpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRleHQgPSBsYW5nLnVwZGF0ZVN0YXR1c0ZpbmlzaC5yZXBsYWNlKCdfJywgZmlsZUNvdW50KS5cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVwbGFjZSgnX0tCJywgV2ViVXBsb2FkZXIuZm9ybWF0U2l6ZShmaWxlU2l6ZSkpLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXBsYWNlKCdfJywgc3RhdHMuc3VjY2Vzc051bSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzdGF0cy51cGxvYWRGYWlsTnVtKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQgKz0gbGFuZy51cGRhdGVTdGF0dXNFcnJvci5yZXBsYWNlKCdfJywgc3RhdHMudXBsb2FkRmFpbE51bSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICRpbmZvLmh0bWwodGV4dCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHVwbG9hZGVyLm9uKCdmaWxlUXVldWVkJywgZnVuY3Rpb24gKGZpbGUpIHtcclxuICAgICAgICAgICAgICAgIGZpbGVDb3VudCsrO1xyXG4gICAgICAgICAgICAgICAgZmlsZVNpemUgKz0gZmlsZS5zaXplO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChmaWxlQ291bnQgPT09IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAkcGxhY2VIb2xkZXIuYWRkQ2xhc3MoJ2VsZW1lbnQtaW52aXNpYmxlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgJHN0YXR1c0Jhci5zaG93KCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgYWRkRmlsZShmaWxlKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICB1cGxvYWRlci5vbignZmlsZURlcXVldWVkJywgZnVuY3Rpb24gKGZpbGUpIHtcclxuICAgICAgICAgICAgICAgIGZpbGVDb3VudC0tO1xyXG4gICAgICAgICAgICAgICAgZmlsZVNpemUgLT0gZmlsZS5zaXplO1xyXG5cclxuICAgICAgICAgICAgICAgIHJlbW92ZUZpbGUoZmlsZSk7XHJcbiAgICAgICAgICAgICAgICB1cGRhdGVUb3RhbFByb2dyZXNzKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgdXBsb2FkZXIub24oJ2ZpbGVzUXVldWVkJywgZnVuY3Rpb24gKGZpbGUpIHtcclxuICAgICAgICAgICAgICAgIGlmICghdXBsb2FkZXIuaXNJblByb2dyZXNzKCkgJiYgKHN0YXRlID09ICdwZWRkaW5nJyB8fCBzdGF0ZSA9PSAnZmluaXNoJyB8fCBzdGF0ZSA9PSAnY29uZmlybScgfHwgc3RhdGUgPT0gJ3JlYWR5JykpIHtcclxuICAgICAgICAgICAgICAgICAgICBzZXRTdGF0ZSgncmVhZHknKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHVwZGF0ZVRvdGFsUHJvZ3Jlc3MoKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICB1cGxvYWRlci5vbignYWxsJywgZnVuY3Rpb24gKHR5cGUsIGZpbGVzKSB7XHJcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICd1cGxvYWRGaW5pc2hlZCc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFN0YXRlKCdjb25maXJtJywgZmlsZXMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdzdGFydFVwbG9hZCc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIOa3u+WKoOmineWklueahEdFVOWPguaVsCAqL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcGFyYW1zID0gdXRpbHMuc2VyaWFsaXplUGFyYW0oZWRpdG9yLnF1ZXJ5Q29tbWFuZFZhbHVlKCdzZXJ2ZXJwYXJhbScpKSB8fCAnJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybCA9IHV0aWxzLmZvcm1hdFVybChhY3Rpb25VcmwgKyAoYWN0aW9uVXJsLmluZGV4T2YoJz8nKSA9PSAtMSA/ICc/JzonJicpICsgJ2VuY29kZT11dGYtOCYnICsgcGFyYW1zKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXBsb2FkZXIub3B0aW9uKCdzZXJ2ZXInLCB1cmwpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRTdGF0ZSgndXBsb2FkaW5nJywgZmlsZXMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdzdG9wVXBsb2FkJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2V0U3RhdGUoJ3BhdXNlZCcsIGZpbGVzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgdXBsb2FkZXIub24oJ3VwbG9hZEJlZm9yZVNlbmQnLCBmdW5jdGlvbiAoZmlsZSwgZGF0YSwgaGVhZGVyKSB7XHJcbiAgICAgICAgICAgICAgICAvL+i/memHjOWPr+S7pemAmui/h2RhdGHlr7nosaHmt7vliqBQT1NU5Y+C5pWwXHJcbiAgICAgICAgICAgICAgICBoZWFkZXJbJ1hfUmVxdWVzdGVkX1dpdGgnXSA9ICdYTUxIdHRwUmVxdWVzdCc7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgdXBsb2FkZXIub24oJ3VwbG9hZFByb2dyZXNzJywgZnVuY3Rpb24gKGZpbGUsIHBlcmNlbnRhZ2UpIHtcclxuICAgICAgICAgICAgICAgIHZhciAkbGkgPSAkKCcjJyArIGZpbGUuaWQpLFxyXG4gICAgICAgICAgICAgICAgICAgICRwZXJjZW50ID0gJGxpLmZpbmQoJy5wcm9ncmVzcyBzcGFuJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgJHBlcmNlbnQuY3NzKCd3aWR0aCcsIHBlcmNlbnRhZ2UgKiAxMDAgKyAnJScpO1xyXG4gICAgICAgICAgICAgICAgcGVyY2VudGFnZXNbIGZpbGUuaWQgXVsgMSBdID0gcGVyY2VudGFnZTtcclxuICAgICAgICAgICAgICAgIHVwZGF0ZVRvdGFsUHJvZ3Jlc3MoKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICB1cGxvYWRlci5vbigndXBsb2FkU3VjY2VzcycsIGZ1bmN0aW9uIChmaWxlLCByZXQpIHtcclxuICAgICAgICAgICAgICAgIHZhciAkZmlsZSA9ICQoJyMnICsgZmlsZS5pZCk7XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciByZXNwb25zZVRleHQgPSAocmV0Ll9yYXcgfHwgcmV0KSxcclxuICAgICAgICAgICAgICAgICAgICAgICAganNvbiA9IHV0aWxzLnN0cjJqc29uKHJlc3BvbnNlVGV4dCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGpzb24uc3RhdGUgPT0gJ1NVQ0NFU1MnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHVwbG9hZFZpZGVvTGlzdC5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICd1cmwnOiBqc29uLnVybCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICd0eXBlJzoganNvbi50eXBlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ29yaWdpbmFsJzpqc29uLm9yaWdpbmFsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkZmlsZS5hcHBlbmQoJzxzcGFuIGNsYXNzPVwic3VjY2Vzc1wiPjwvc3Bhbj4nKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkZmlsZS5maW5kKCcuZXJyb3InKS50ZXh0KGpzb24uc3RhdGUpLnNob3coKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJGZpbGUuZmluZCgnLmVycm9yJykudGV4dChsYW5nLmVycm9yU2VydmVyVXBsb2FkKS5zaG93KCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgdXBsb2FkZXIub24oJ3VwbG9hZEVycm9yJywgZnVuY3Rpb24gKGZpbGUsIGNvZGUpIHtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHVwbG9hZGVyLm9uKCdlcnJvcicsIGZ1bmN0aW9uIChjb2RlLCBmaWxlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoY29kZSA9PSAnUV9UWVBFX0RFTklFRCcgfHwgY29kZSA9PSAnRl9FWENFRURfU0laRScpIHtcclxuICAgICAgICAgICAgICAgICAgICBhZGRGaWxlKGZpbGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdXBsb2FkZXIub24oJ3VwbG9hZENvbXBsZXRlJywgZnVuY3Rpb24gKGZpbGUsIHJldCkge1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICR1cGxvYWQub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCQodGhpcykuaGFzQ2xhc3MoJ2Rpc2FibGVkJykpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHN0YXRlID09PSAncmVhZHknKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdXBsb2FkZXIudXBsb2FkKCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHN0YXRlID09PSAncGF1c2VkJykge1xyXG4gICAgICAgICAgICAgICAgICAgIHVwbG9hZGVyLnVwbG9hZCgpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzdGF0ZSA9PT0gJ3VwbG9hZGluZycpIHtcclxuICAgICAgICAgICAgICAgICAgICB1cGxvYWRlci5zdG9wKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgJHVwbG9hZC5hZGRDbGFzcygnc3RhdGUtJyArIHN0YXRlKTtcclxuICAgICAgICAgICAgdXBkYXRlVG90YWxQcm9ncmVzcygpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZ2V0UXVldWVDb3VudDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgZmlsZSwgaSwgc3RhdHVzLCByZWFkeUZpbGUgPSAwLCBmaWxlcyA9IHRoaXMudXBsb2FkZXIuZ2V0RmlsZXMoKTtcclxuICAgICAgICAgICAgZm9yIChpID0gMDsgZmlsZSA9IGZpbGVzW2krK107ICkge1xyXG4gICAgICAgICAgICAgICAgc3RhdHVzID0gZmlsZS5nZXRTdGF0dXMoKTtcclxuICAgICAgICAgICAgICAgIGlmIChzdGF0dXMgPT0gJ3F1ZXVlZCcgfHwgc3RhdHVzID09ICd1cGxvYWRpbmcnIHx8IHN0YXR1cyA9PSAncHJvZ3Jlc3MnKSByZWFkeUZpbGUrKztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcmVhZHlGaWxlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcmVmcmVzaDogZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgdGhpcy51cGxvYWRlci5yZWZyZXNoKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbn0pKCk7XHJcbiJdLCJmaWxlIjoicGx1Z2lucy91ZWRpdG9yL2RpYWxvZ3MvdmlkZW8vdmlkZW8uanMifQ==
