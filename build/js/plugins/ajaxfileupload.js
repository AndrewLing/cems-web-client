define(['jquery', 'main/main'], function ($, main) {
    jQuery.extend({
        // id为当前系统时间字符串，uri是外部传入的json对象的一个参数
        createUploadIframe: function (id, uri) {
            // create frame
            var frameId = 'jUploadFrame' + id; // 给iframe添加一个独一无二的id
            var iframeHtml = '<iframe id="' + frameId + '" name="' + frameId + '" style="position:absolute; top:-9999px; left:-9999px"'; // 创建iframe元素
            if (window.ActiveXObject) {// 判断浏览器是否支持ActiveX控件
                if (typeof uri == 'boolean') {
                    iframeHtml += ' src="' + 'javascript:false' + '"';
                } else if (typeof uri == 'string') {
                    iframeHtml += ' src="' + uri + '"';
                }
            }
            iframeHtml += ' />';
            jQuery(iframeHtml).appendTo(document.body); // 将动态iframe追加到body中
            return jQuery('#' + frameId).get(0); // 返回iframe对象
        },
        // id为当前系统时间字符串，fileElementId为页面<input type='file'/>的id，data的值需要根据传入json的键来决定
        createUploadForm: function (id, fileElementId, data) {
            // create form
            var formId = 'jUploadForm' + id; // 给form添加一个独一无二的id
            var fileId = 'jUploadFile' + id; // 给<input type='file' />添加一个独一无二的id
            var form = jQuery('<form  action="" method="POST" name="' + formId + '" id="' + formId + '" enctype="multipart/form-data" ></form>'); // 创建form元素
            if (data) {// 通常为false
                for (var i in data) {
                    jQuery('<input type="hidden" name="' + i + '" value="' + data[i] + '" />').appendTo(form); // 根据data的内容，创建隐藏域，这部分我还不知道是什么时候用到。估计是传入json的时候，如果默认传一些参数的话要用到。
                }
            }
            var oldElement = jQuery('#' + fileElementId); // 得到页面中的<input type='file' />对象
            var newElement = jQuery(oldElement).clone(); // 克隆页面中的<input type='file' />对象
            jQuery(oldElement).attr('id', fileId); // 修改原对象的id
            jQuery(oldElement).before(newElement); // 在原对象前插入克隆对象
            jQuery(oldElement).appendTo(form); // 把原对象插入到动态form的结尾处
            // set attributes
            jQuery(form).css('position', 'absolute'); // 给动态form添加样式，使其浮动起来，
            jQuery(form).css('top', '-1200px');
            jQuery(form).css('left', '-1200px');
            jQuery(form).appendTo('body'); // 把动态form插入到body中
            return form;
        },
        // 这里s是个json对象，传入一些ajax的参数
        ajaxFileUpload: function (s) {
            // TODO introduce global settings, allowing the client to modify them
            // for all requests, not only timeout
            s = jQuery.extend({}, jQuery.ajaxSettings, s); // 此时的s对象是由jQuery.ajaxSettings和原s对象扩展后的对象
            var id = new Date().getTime(); // 取当前系统时间，目的是得到一个独一无二的数字
            var form = jQuery.createUploadForm(id, s.fileElementId, (typeof (s.data) == 'undefined' ? false : s.data)); // 创建动态form
            var io = jQuery.createUploadIframe(id, s.secureuri); // 创建动态iframe
            var frameId = 'jUploadFrame' + id; // 动态iframe的id
            var formId = 'jUploadForm' + id; // 动态form的id
            // Watch for a new set of requests
            if (s.global && !jQuery.active++) {// 当jQuery开始一个ajax请求时发生
                jQuery.event.trigger("ajaxStart"); // 触发ajaxStart方法
            }
            var requestDone = false; // 请求完成标志
            // Create the request object
            var xml = {};
            if (s.global)
                jQuery.event.trigger("ajaxSend", [xml, s]); // 触发ajaxSend方法
            // Wait for a response to come back
            var uploadCallback = function (isTimeout) {
                // 回调函数
                var io = document.getElementById(frameId); // 得到iframe对象
                try {
                    if (io.contentWindow) {// 动态iframe所在窗口对象是否存在
                        xml.responseText = io.contentWindow.document.body ? io.contentWindow.document.body.innerText : null;
                        xml.responseXML = io.contentWindow.document.XMLDocument ? io.contentWindow.document.XMLDocument : io.contentWindow.document;
                    } else if (io.contentDocument) {// 动态iframe的文档对象是否存在
                        xml.responseText = io.contentDocument.document.body ? io.contentDocument.document.body.innerHTML : null;
                        xml.responseXML = io.contentDocument.document.XMLDocument ? io.contentDocument.document.XMLDocument : io.contentDocument.document;
                    }
                } catch (e) {
                    jQuery.handleError(s, xml, null, e);
                }
                if (xml || isTimeout == "timeout") {// xml变量被赋值或者isTimeout == "timeout"都表示请求发出，并且有响应
                    requestDone = true; // 请求完成
                    var status;
                    try {
                        status = isTimeout != "timeout" ? "success" : "error"; // 如果不是“超时”，表示请求成功
                        // Make sure that the request was successful or notmodified
                        if (status != "error") {
                            // process the data (runs the xml through httpData regardless of callback)
                            var data = jQuery.uploadHttpData(xml, s.dataType); // 根据传送的type类型，返回json对象，此时返回的data就是后台操作后的返回结果
                            // If a local callback was specified, fire it and pass it the data
                            if (s.success && main.checkData(data)) {
                                s.success(data, status); // 执行上传成功的操作
                            }
                            // Fire the global callback
                            if (s.global)
                                jQuery.event.trigger("ajaxSuccess", [xml, s]);
                        } else
                            jQuery.handleError(s, xml, status);
                    } catch (e) {
                        status = "error";
                        jQuery.handleError(s, xml, status, e);
                    } // The request was completed
                    if (s.global)
                        jQuery.event.trigger("ajaxComplete", [xml, s]); // Handle the global AJAX counter
                    if (s.global && !--jQuery.active)
                        jQuery.event.trigger("ajaxStop"); // Process result
                    if (s.complete)
                        s.complete(xml, status);
                    jQuery(io).unbind();// 移除iframe的事件处理程序
                    setTimeout(function () {
                        try {
                            jQuery(io).remove();// 移除动态iframe
                            jQuery(form).remove();// 移除动态form
                        } catch (e) {
                            jQuery.handleError(s, xml, null, e);
                        }
                    }, 100);
                    xml = null
                }
            }; // Timeout checker
            if (s.timeout > 0) {// 超时检测
                setTimeout(function () { // Check to see if the request is still happening
                    if (!requestDone)
                        uploadCallback("timeout");// 如果请求仍未完成，就发送超时信号
                }, s.timeout);
            }
            try {
                var form = jQuery('#' + formId);
                jQuery(form).attr('action', s.url);// 传入的ajax页面导向url
                jQuery(form).attr('method', 'POST');// 设置提交表单方式
                jQuery(form).attr('target', frameId);// 返回的目标iframe，就是创建的动态iframe
                if (form.encoding) {// 选择编码方式
                    jQuery(form).attr('encoding', 'multipart/form-data');
                } else {
                    jQuery(form).attr('enctype', 'multipart/form-data');
                }
                jQuery(form).submit();// 提交form表单
            } catch (e) {
                jQuery.handleError(s, xml, null, e);
            }
            jQuery('#' + frameId).load(uploadCallback); // ajax 请求从服务器加载数据，同时传入回调函数
            return {
                abort: function () {
                }
            };
        },
        /**
         * 处理返回数据
         * @param r 返回结果
         * @param type 数据类型（dataType）
         * @returns {*} 返回数据
         */
        uploadHttpData: function (r, type) {
            var data = !type;
            data = type == "xml" || data ? r.responseXML : r.responseText; // If the type is "script", eval it in global context
            if (type == "script")
                jQuery.globalEval(data); // Get the JavaScript object, if JSON is used.
            if (type == "json")
                eval("data = " + data); // evaluate scripts within html

            if (type == "html")
                jQuery("<div>").html(data).evalScripts();
            return data;
        },
        handleError: function (s, xhr, status, e) {
            // If a local callback was specified, fire it
            if (s.error) {
                s.error.call(s.context || s, xhr, status, e);
            }

            // Fire the global callback
            if (s.global) {
                (s.context ? jQuery(s.context) : jQuery.event).trigger("ajaxError", [xhr, s, e]);
            }
        },

        uploadFile: {
            /**
             * 获取文件大小
             * @param fileId <String> input[type=file]元素id
             * @returns <Number> 单位为 KB
             */
            getFileSize: function (fileId) {
                var fileInput = $("#" + fileId)[0];
                var fileSize = 0;
                var isIE = /msie/i.test(navigator.userAgent) && !window.opera;
                console.log(isIE, fileInput.files);
                if (isIE && !fileInput.files) {
                    var filePath = fileInput.value;
                    var fileSystem = new ActiveXObject("Scripting.FileSystemObject");
                    var file = fileSystem.GetFile(filePath);
                    fileSize = file.Size;
                } else {
                    fileSize = fileInput.files[0].size;
                }
                fileSize = Math.round(fileSize / 1024 * 100) / 100;

                return fileSize;
            },
            /**
             * 获取文件后缀（小写），如：'.jpg'
             * @param fileId <String> input[type=file]元素id
             */
            getFileSuffix: function (fileId) {
                var fileInput = $("#" + fileId)[0];
                if (fileInput) {
                    return fileInput.value.substr(fileInput.value.lastIndexOf(".")).toLowerCase();
                }
                return '';
            }
        }
    });

    return jQuery;
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL2FqYXhmaWxldXBsb2FkLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImRlZmluZShbJ2pxdWVyeScsICdtYWluL21haW4nXSwgZnVuY3Rpb24gKCQsIG1haW4pIHtcbiAgICBqUXVlcnkuZXh0ZW5kKHtcbiAgICAgICAgLy8gaWTkuLrlvZPliY3ns7vnu5/ml7bpl7TlrZfnrKbkuLLvvIx1cmnmmK/lpJbpg6jkvKDlhaXnmoRqc29u5a+56LGh55qE5LiA5Liq5Y+C5pWwXG4gICAgICAgIGNyZWF0ZVVwbG9hZElmcmFtZTogZnVuY3Rpb24gKGlkLCB1cmkpIHtcbiAgICAgICAgICAgIC8vIGNyZWF0ZSBmcmFtZVxuICAgICAgICAgICAgdmFyIGZyYW1lSWQgPSAnalVwbG9hZEZyYW1lJyArIGlkOyAvLyDnu5lpZnJhbWXmt7vliqDkuIDkuKrni6zkuIDml6DkuoznmoRpZFxuICAgICAgICAgICAgdmFyIGlmcmFtZUh0bWwgPSAnPGlmcmFtZSBpZD1cIicgKyBmcmFtZUlkICsgJ1wiIG5hbWU9XCInICsgZnJhbWVJZCArICdcIiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlOyB0b3A6LTk5OTlweDsgbGVmdDotOTk5OXB4XCInOyAvLyDliJvlu7ppZnJhbWXlhYPntKBcbiAgICAgICAgICAgIGlmICh3aW5kb3cuQWN0aXZlWE9iamVjdCkgey8vIOWIpOaWrea1j+iniOWZqOaYr+WQpuaUr+aMgUFjdGl2ZVjmjqfku7ZcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHVyaSA9PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICAgICAgICAgICAgaWZyYW1lSHRtbCArPSAnIHNyYz1cIicgKyAnamF2YXNjcmlwdDpmYWxzZScgKyAnXCInO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHVyaSA9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICBpZnJhbWVIdG1sICs9ICcgc3JjPVwiJyArIHVyaSArICdcIic7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWZyYW1lSHRtbCArPSAnIC8+JztcbiAgICAgICAgICAgIGpRdWVyeShpZnJhbWVIdG1sKS5hcHBlbmRUbyhkb2N1bWVudC5ib2R5KTsgLy8g5bCG5Yqo5oCBaWZyYW1l6L+95Yqg5YiwYm9keeS4rVxuICAgICAgICAgICAgcmV0dXJuIGpRdWVyeSgnIycgKyBmcmFtZUlkKS5nZXQoMCk7IC8vIOi/lOWbnmlmcmFtZeWvueixoVxuICAgICAgICB9LFxuICAgICAgICAvLyBpZOS4uuW9k+WJjeezu+e7n+aXtumXtOWtl+espuS4su+8jGZpbGVFbGVtZW50SWTkuLrpobXpnaI8aW5wdXQgdHlwZT0nZmlsZScvPueahGlk77yMZGF0YeeahOWAvOmcgOimgeagueaNruS8oOWFpWpzb27nmoTplK7mnaXlhrPlrppcbiAgICAgICAgY3JlYXRlVXBsb2FkRm9ybTogZnVuY3Rpb24gKGlkLCBmaWxlRWxlbWVudElkLCBkYXRhKSB7XG4gICAgICAgICAgICAvLyBjcmVhdGUgZm9ybVxuICAgICAgICAgICAgdmFyIGZvcm1JZCA9ICdqVXBsb2FkRm9ybScgKyBpZDsgLy8g57uZZm9ybea3u+WKoOS4gOS4queLrOS4gOaXoOS6jOeahGlkXG4gICAgICAgICAgICB2YXIgZmlsZUlkID0gJ2pVcGxvYWRGaWxlJyArIGlkOyAvLyDnu5k8aW5wdXQgdHlwZT0nZmlsZScgLz7mt7vliqDkuIDkuKrni6zkuIDml6DkuoznmoRpZFxuICAgICAgICAgICAgdmFyIGZvcm0gPSBqUXVlcnkoJzxmb3JtICBhY3Rpb249XCJcIiBtZXRob2Q9XCJQT1NUXCIgbmFtZT1cIicgKyBmb3JtSWQgKyAnXCIgaWQ9XCInICsgZm9ybUlkICsgJ1wiIGVuY3R5cGU9XCJtdWx0aXBhcnQvZm9ybS1kYXRhXCIgPjwvZm9ybT4nKTsgLy8g5Yib5bu6Zm9ybeWFg+e0oFxuICAgICAgICAgICAgaWYgKGRhdGEpIHsvLyDpgJrluLjkuLpmYWxzZVxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgaW4gZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBqUXVlcnkoJzxpbnB1dCB0eXBlPVwiaGlkZGVuXCIgbmFtZT1cIicgKyBpICsgJ1wiIHZhbHVlPVwiJyArIGRhdGFbaV0gKyAnXCIgLz4nKS5hcHBlbmRUbyhmb3JtKTsgLy8g5qC55o2uZGF0YeeahOWGheWuue+8jOWIm+W7uumakOiXj+Wfn++8jOi/memDqOWIhuaIkei/mOS4jeefpemBk+aYr+S7gOS5iOaXtuWAmeeUqOWIsOOAguS8sOiuoeaYr+S8oOWFpWpzb27nmoTml7blgJnvvIzlpoLmnpzpu5jorqTkvKDkuIDkupvlj4LmlbDnmoTor53opoHnlKjliLDjgIJcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgb2xkRWxlbWVudCA9IGpRdWVyeSgnIycgKyBmaWxlRWxlbWVudElkKTsgLy8g5b6X5Yiw6aG16Z2i5Lit55qEPGlucHV0IHR5cGU9J2ZpbGUnIC8+5a+56LGhXG4gICAgICAgICAgICB2YXIgbmV3RWxlbWVudCA9IGpRdWVyeShvbGRFbGVtZW50KS5jbG9uZSgpOyAvLyDlhYvpmobpobXpnaLkuK3nmoQ8aW5wdXQgdHlwZT0nZmlsZScgLz7lr7nosaFcbiAgICAgICAgICAgIGpRdWVyeShvbGRFbGVtZW50KS5hdHRyKCdpZCcsIGZpbGVJZCk7IC8vIOS/ruaUueWOn+WvueixoeeahGlkXG4gICAgICAgICAgICBqUXVlcnkob2xkRWxlbWVudCkuYmVmb3JlKG5ld0VsZW1lbnQpOyAvLyDlnKjljp/lr7nosaHliY3mj5LlhaXlhYvpmoblr7nosaFcbiAgICAgICAgICAgIGpRdWVyeShvbGRFbGVtZW50KS5hcHBlbmRUbyhmb3JtKTsgLy8g5oqK5Y6f5a+56LGh5o+S5YWl5Yiw5Yqo5oCBZm9ybeeahOe7k+WwvuWkhFxuICAgICAgICAgICAgLy8gc2V0IGF0dHJpYnV0ZXNcbiAgICAgICAgICAgIGpRdWVyeShmb3JtKS5jc3MoJ3Bvc2l0aW9uJywgJ2Fic29sdXRlJyk7IC8vIOe7meWKqOaAgWZvcm3mt7vliqDmoLflvI/vvIzkvb/lhbbmta7liqjotbfmnaXvvIxcbiAgICAgICAgICAgIGpRdWVyeShmb3JtKS5jc3MoJ3RvcCcsICctMTIwMHB4Jyk7XG4gICAgICAgICAgICBqUXVlcnkoZm9ybSkuY3NzKCdsZWZ0JywgJy0xMjAwcHgnKTtcbiAgICAgICAgICAgIGpRdWVyeShmb3JtKS5hcHBlbmRUbygnYm9keScpOyAvLyDmiorliqjmgIFmb3Jt5o+S5YWl5YiwYm9keeS4rVxuICAgICAgICAgICAgcmV0dXJuIGZvcm07XG4gICAgICAgIH0sXG4gICAgICAgIC8vIOi/memHjHPmmK/kuKpqc29u5a+56LGh77yM5Lyg5YWl5LiA5LqbYWpheOeahOWPguaVsFxuICAgICAgICBhamF4RmlsZVVwbG9hZDogZnVuY3Rpb24gKHMpIHtcbiAgICAgICAgICAgIC8vIFRPRE8gaW50cm9kdWNlIGdsb2JhbCBzZXR0aW5ncywgYWxsb3dpbmcgdGhlIGNsaWVudCB0byBtb2RpZnkgdGhlbVxuICAgICAgICAgICAgLy8gZm9yIGFsbCByZXF1ZXN0cywgbm90IG9ubHkgdGltZW91dFxuICAgICAgICAgICAgcyA9IGpRdWVyeS5leHRlbmQoe30sIGpRdWVyeS5hamF4U2V0dGluZ3MsIHMpOyAvLyDmraTml7bnmoRz5a+56LGh5piv55SxalF1ZXJ5LmFqYXhTZXR0aW5nc+WSjOWOn3Plr7nosaHmianlsZXlkI7nmoTlr7nosaFcbiAgICAgICAgICAgIHZhciBpZCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpOyAvLyDlj5blvZPliY3ns7vnu5/ml7bpl7TvvIznm67nmoTmmK/lvpfliLDkuIDkuKrni6zkuIDml6DkuoznmoTmlbDlrZdcbiAgICAgICAgICAgIHZhciBmb3JtID0galF1ZXJ5LmNyZWF0ZVVwbG9hZEZvcm0oaWQsIHMuZmlsZUVsZW1lbnRJZCwgKHR5cGVvZiAocy5kYXRhKSA9PSAndW5kZWZpbmVkJyA/IGZhbHNlIDogcy5kYXRhKSk7IC8vIOWIm+W7uuWKqOaAgWZvcm1cbiAgICAgICAgICAgIHZhciBpbyA9IGpRdWVyeS5jcmVhdGVVcGxvYWRJZnJhbWUoaWQsIHMuc2VjdXJldXJpKTsgLy8g5Yib5bu65Yqo5oCBaWZyYW1lXG4gICAgICAgICAgICB2YXIgZnJhbWVJZCA9ICdqVXBsb2FkRnJhbWUnICsgaWQ7IC8vIOWKqOaAgWlmcmFtZeeahGlkXG4gICAgICAgICAgICB2YXIgZm9ybUlkID0gJ2pVcGxvYWRGb3JtJyArIGlkOyAvLyDliqjmgIFmb3Jt55qEaWRcbiAgICAgICAgICAgIC8vIFdhdGNoIGZvciBhIG5ldyBzZXQgb2YgcmVxdWVzdHNcbiAgICAgICAgICAgIGlmIChzLmdsb2JhbCAmJiAhalF1ZXJ5LmFjdGl2ZSsrKSB7Ly8g5b2TalF1ZXJ55byA5aeL5LiA5LiqYWpheOivt+axguaXtuWPkeeUn1xuICAgICAgICAgICAgICAgIGpRdWVyeS5ldmVudC50cmlnZ2VyKFwiYWpheFN0YXJ0XCIpOyAvLyDop6blj5FhamF4U3RhcnTmlrnms5VcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciByZXF1ZXN0RG9uZSA9IGZhbHNlOyAvLyDor7fmsYLlrozmiJDmoIflv5dcbiAgICAgICAgICAgIC8vIENyZWF0ZSB0aGUgcmVxdWVzdCBvYmplY3RcbiAgICAgICAgICAgIHZhciB4bWwgPSB7fTtcbiAgICAgICAgICAgIGlmIChzLmdsb2JhbClcbiAgICAgICAgICAgICAgICBqUXVlcnkuZXZlbnQudHJpZ2dlcihcImFqYXhTZW5kXCIsIFt4bWwsIHNdKTsgLy8g6Kem5Y+RYWpheFNlbmTmlrnms5VcbiAgICAgICAgICAgIC8vIFdhaXQgZm9yIGEgcmVzcG9uc2UgdG8gY29tZSBiYWNrXG4gICAgICAgICAgICB2YXIgdXBsb2FkQ2FsbGJhY2sgPSBmdW5jdGlvbiAoaXNUaW1lb3V0KSB7XG4gICAgICAgICAgICAgICAgLy8g5Zue6LCD5Ye95pWwXG4gICAgICAgICAgICAgICAgdmFyIGlvID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZnJhbWVJZCk7IC8vIOW+l+WIsGlmcmFtZeWvueixoVxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpby5jb250ZW50V2luZG93KSB7Ly8g5Yqo5oCBaWZyYW1l5omA5Zyo56qX5Y+j5a+56LGh5piv5ZCm5a2Y5ZyoXG4gICAgICAgICAgICAgICAgICAgICAgICB4bWwucmVzcG9uc2VUZXh0ID0gaW8uY29udGVudFdpbmRvdy5kb2N1bWVudC5ib2R5ID8gaW8uY29udGVudFdpbmRvdy5kb2N1bWVudC5ib2R5LmlubmVyVGV4dCA6IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICB4bWwucmVzcG9uc2VYTUwgPSBpby5jb250ZW50V2luZG93LmRvY3VtZW50LlhNTERvY3VtZW50ID8gaW8uY29udGVudFdpbmRvdy5kb2N1bWVudC5YTUxEb2N1bWVudCA6IGlvLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQ7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaW8uY29udGVudERvY3VtZW50KSB7Ly8g5Yqo5oCBaWZyYW1l55qE5paH5qGj5a+56LGh5piv5ZCm5a2Y5ZyoXG4gICAgICAgICAgICAgICAgICAgICAgICB4bWwucmVzcG9uc2VUZXh0ID0gaW8uY29udGVudERvY3VtZW50LmRvY3VtZW50LmJvZHkgPyBpby5jb250ZW50RG9jdW1lbnQuZG9jdW1lbnQuYm9keS5pbm5lckhUTUwgOiBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgeG1sLnJlc3BvbnNlWE1MID0gaW8uY29udGVudERvY3VtZW50LmRvY3VtZW50LlhNTERvY3VtZW50ID8gaW8uY29udGVudERvY3VtZW50LmRvY3VtZW50LlhNTERvY3VtZW50IDogaW8uY29udGVudERvY3VtZW50LmRvY3VtZW50O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBqUXVlcnkuaGFuZGxlRXJyb3IocywgeG1sLCBudWxsLCBlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHhtbCB8fCBpc1RpbWVvdXQgPT0gXCJ0aW1lb3V0XCIpIHsvLyB4bWzlj5jph4/ooqvotYvlgLzmiJbogIVpc1RpbWVvdXQgPT0gXCJ0aW1lb3V0XCLpg73ooajnpLror7fmsYLlj5Hlh7rvvIzlubbkuJTmnInlk43lupRcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdERvbmUgPSB0cnVlOyAvLyDor7fmsYLlrozmiJBcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN0YXR1cztcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1cyA9IGlzVGltZW91dCAhPSBcInRpbWVvdXRcIiA/IFwic3VjY2Vzc1wiIDogXCJlcnJvclwiOyAvLyDlpoLmnpzkuI3mmK/igJzotoXml7bigJ3vvIzooajnpLror7fmsYLmiJDlip9cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1ha2Ugc3VyZSB0aGF0IHRoZSByZXF1ZXN0IHdhcyBzdWNjZXNzZnVsIG9yIG5vdG1vZGlmaWVkXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3RhdHVzICE9IFwiZXJyb3JcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHByb2Nlc3MgdGhlIGRhdGEgKHJ1bnMgdGhlIHhtbCB0aHJvdWdoIGh0dHBEYXRhIHJlZ2FyZGxlc3Mgb2YgY2FsbGJhY2spXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRhdGEgPSBqUXVlcnkudXBsb2FkSHR0cERhdGEoeG1sLCBzLmRhdGFUeXBlKTsgLy8g5qC55o2u5Lyg6YCB55qEdHlwZeexu+Wei++8jOi/lOWbnmpzb27lr7nosaHvvIzmraTml7bov5Tlm57nmoRkYXRh5bCx5piv5ZCO5Y+w5pON5L2c5ZCO55qE6L+U5Zue57uT5p6cXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgYSBsb2NhbCBjYWxsYmFjayB3YXMgc3BlY2lmaWVkLCBmaXJlIGl0IGFuZCBwYXNzIGl0IHRoZSBkYXRhXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHMuc3VjY2VzcyAmJiBtYWluLmNoZWNrRGF0YShkYXRhKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzLnN1Y2Nlc3MoZGF0YSwgc3RhdHVzKTsgLy8g5omn6KGM5LiK5Lyg5oiQ5Yqf55qE5pON5L2cXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZpcmUgdGhlIGdsb2JhbCBjYWxsYmFja1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzLmdsb2JhbClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgalF1ZXJ5LmV2ZW50LnRyaWdnZXIoXCJhamF4U3VjY2Vzc1wiLCBbeG1sLCBzXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBqUXVlcnkuaGFuZGxlRXJyb3IocywgeG1sLCBzdGF0dXMpO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXMgPSBcImVycm9yXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICBqUXVlcnkuaGFuZGxlRXJyb3IocywgeG1sLCBzdGF0dXMsIGUpO1xuICAgICAgICAgICAgICAgICAgICB9IC8vIFRoZSByZXF1ZXN0IHdhcyBjb21wbGV0ZWRcbiAgICAgICAgICAgICAgICAgICAgaWYgKHMuZ2xvYmFsKVxuICAgICAgICAgICAgICAgICAgICAgICAgalF1ZXJ5LmV2ZW50LnRyaWdnZXIoXCJhamF4Q29tcGxldGVcIiwgW3htbCwgc10pOyAvLyBIYW5kbGUgdGhlIGdsb2JhbCBBSkFYIGNvdW50ZXJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHMuZ2xvYmFsICYmICEtLWpRdWVyeS5hY3RpdmUpXG4gICAgICAgICAgICAgICAgICAgICAgICBqUXVlcnkuZXZlbnQudHJpZ2dlcihcImFqYXhTdG9wXCIpOyAvLyBQcm9jZXNzIHJlc3VsdFxuICAgICAgICAgICAgICAgICAgICBpZiAocy5jb21wbGV0ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHMuY29tcGxldGUoeG1sLCBzdGF0dXMpO1xuICAgICAgICAgICAgICAgICAgICBqUXVlcnkoaW8pLnVuYmluZCgpOy8vIOenu+mZpGlmcmFtZeeahOS6i+S7tuWkhOeQhueoi+W6j1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgalF1ZXJ5KGlvKS5yZW1vdmUoKTsvLyDnp7vpmaTliqjmgIFpZnJhbWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBqUXVlcnkoZm9ybSkucmVtb3ZlKCk7Ly8g56e76Zmk5Yqo5oCBZm9ybVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpRdWVyeS5oYW5kbGVFcnJvcihzLCB4bWwsIG51bGwsIGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LCAxMDApO1xuICAgICAgICAgICAgICAgICAgICB4bWwgPSBudWxsXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTsgLy8gVGltZW91dCBjaGVja2VyXG4gICAgICAgICAgICBpZiAocy50aW1lb3V0ID4gMCkgey8vIOi2heaXtuajgOa1i1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkgeyAvLyBDaGVjayB0byBzZWUgaWYgdGhlIHJlcXVlc3QgaXMgc3RpbGwgaGFwcGVuaW5nXG4gICAgICAgICAgICAgICAgICAgIGlmICghcmVxdWVzdERvbmUpXG4gICAgICAgICAgICAgICAgICAgICAgICB1cGxvYWRDYWxsYmFjayhcInRpbWVvdXRcIik7Ly8g5aaC5p6c6K+35rGC5LuN5pyq5a6M5oiQ77yM5bCx5Y+R6YCB6LaF5pe25L+h5Y+3XG4gICAgICAgICAgICAgICAgfSwgcy50aW1lb3V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdmFyIGZvcm0gPSBqUXVlcnkoJyMnICsgZm9ybUlkKTtcbiAgICAgICAgICAgICAgICBqUXVlcnkoZm9ybSkuYXR0cignYWN0aW9uJywgcy51cmwpOy8vIOS8oOWFpeeahGFqYXjpobXpnaLlr7zlkJF1cmxcbiAgICAgICAgICAgICAgICBqUXVlcnkoZm9ybSkuYXR0cignbWV0aG9kJywgJ1BPU1QnKTsvLyDorr7nva7mj5DkuqTooajljZXmlrnlvI9cbiAgICAgICAgICAgICAgICBqUXVlcnkoZm9ybSkuYXR0cigndGFyZ2V0JywgZnJhbWVJZCk7Ly8g6L+U5Zue55qE55uu5qCHaWZyYW1l77yM5bCx5piv5Yib5bu655qE5Yqo5oCBaWZyYW1lXG4gICAgICAgICAgICAgICAgaWYgKGZvcm0uZW5jb2RpbmcpIHsvLyDpgInmi6nnvJbnoIHmlrnlvI9cbiAgICAgICAgICAgICAgICAgICAgalF1ZXJ5KGZvcm0pLmF0dHIoJ2VuY29kaW5nJywgJ211bHRpcGFydC9mb3JtLWRhdGEnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBqUXVlcnkoZm9ybSkuYXR0cignZW5jdHlwZScsICdtdWx0aXBhcnQvZm9ybS1kYXRhJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGpRdWVyeShmb3JtKS5zdWJtaXQoKTsvLyDmj5DkuqRmb3Jt6KGo5Y2VXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgalF1ZXJ5LmhhbmRsZUVycm9yKHMsIHhtbCwgbnVsbCwgZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBqUXVlcnkoJyMnICsgZnJhbWVJZCkubG9hZCh1cGxvYWRDYWxsYmFjayk7IC8vIGFqYXgg6K+35rGC5LuO5pyN5Yqh5Zmo5Yqg6L295pWw5o2u77yM5ZCM5pe25Lyg5YWl5Zue6LCD5Ye95pWwXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGFib3J0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWkhOeQhui/lOWbnuaVsOaNrlxuICAgICAgICAgKiBAcGFyYW0gciDov5Tlm57nu5PmnpxcbiAgICAgICAgICogQHBhcmFtIHR5cGUg5pWw5o2u57G75Z6L77yIZGF0YVR5cGXvvIlcbiAgICAgICAgICogQHJldHVybnMgeyp9IOi/lOWbnuaVsOaNrlxuICAgICAgICAgKi9cbiAgICAgICAgdXBsb2FkSHR0cERhdGE6IGZ1bmN0aW9uIChyLCB0eXBlKSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9ICF0eXBlO1xuICAgICAgICAgICAgZGF0YSA9IHR5cGUgPT0gXCJ4bWxcIiB8fCBkYXRhID8gci5yZXNwb25zZVhNTCA6IHIucmVzcG9uc2VUZXh0OyAvLyBJZiB0aGUgdHlwZSBpcyBcInNjcmlwdFwiLCBldmFsIGl0IGluIGdsb2JhbCBjb250ZXh0XG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcInNjcmlwdFwiKVxuICAgICAgICAgICAgICAgIGpRdWVyeS5nbG9iYWxFdmFsKGRhdGEpOyAvLyBHZXQgdGhlIEphdmFTY3JpcHQgb2JqZWN0LCBpZiBKU09OIGlzIHVzZWQuXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcImpzb25cIilcbiAgICAgICAgICAgICAgICBldmFsKFwiZGF0YSA9IFwiICsgZGF0YSk7IC8vIGV2YWx1YXRlIHNjcmlwdHMgd2l0aGluIGh0bWxcblxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJodG1sXCIpXG4gICAgICAgICAgICAgICAgalF1ZXJ5KFwiPGRpdj5cIikuaHRtbChkYXRhKS5ldmFsU2NyaXB0cygpO1xuICAgICAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgICAgIH0sXG4gICAgICAgIGhhbmRsZUVycm9yOiBmdW5jdGlvbiAocywgeGhyLCBzdGF0dXMsIGUpIHtcbiAgICAgICAgICAgIC8vIElmIGEgbG9jYWwgY2FsbGJhY2sgd2FzIHNwZWNpZmllZCwgZmlyZSBpdFxuICAgICAgICAgICAgaWYgKHMuZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBzLmVycm9yLmNhbGwocy5jb250ZXh0IHx8IHMsIHhociwgc3RhdHVzLCBlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gRmlyZSB0aGUgZ2xvYmFsIGNhbGxiYWNrXG4gICAgICAgICAgICBpZiAocy5nbG9iYWwpIHtcbiAgICAgICAgICAgICAgICAocy5jb250ZXh0ID8galF1ZXJ5KHMuY29udGV4dCkgOiBqUXVlcnkuZXZlbnQpLnRyaWdnZXIoXCJhamF4RXJyb3JcIiwgW3hociwgcywgZV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIHVwbG9hZEZpbGU6IHtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog6I635Y+W5paH5Lu25aSn5bCPXG4gICAgICAgICAgICAgKiBAcGFyYW0gZmlsZUlkIDxTdHJpbmc+IGlucHV0W3R5cGU9ZmlsZV3lhYPntKBpZFxuICAgICAgICAgICAgICogQHJldHVybnMgPE51bWJlcj4g5Y2V5L2N5Li6IEtCXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGdldEZpbGVTaXplOiBmdW5jdGlvbiAoZmlsZUlkKSB7XG4gICAgICAgICAgICAgICAgdmFyIGZpbGVJbnB1dCA9ICQoXCIjXCIgKyBmaWxlSWQpWzBdO1xuICAgICAgICAgICAgICAgIHZhciBmaWxlU2l6ZSA9IDA7XG4gICAgICAgICAgICAgICAgdmFyIGlzSUUgPSAvbXNpZS9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkgJiYgIXdpbmRvdy5vcGVyYTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhpc0lFLCBmaWxlSW5wdXQuZmlsZXMpO1xuICAgICAgICAgICAgICAgIGlmIChpc0lFICYmICFmaWxlSW5wdXQuZmlsZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZpbGVQYXRoID0gZmlsZUlucHV0LnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZmlsZVN5c3RlbSA9IG5ldyBBY3RpdmVYT2JqZWN0KFwiU2NyaXB0aW5nLkZpbGVTeXN0ZW1PYmplY3RcIik7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmaWxlID0gZmlsZVN5c3RlbS5HZXRGaWxlKGZpbGVQYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgZmlsZVNpemUgPSBmaWxlLlNpemU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsZVNpemUgPSBmaWxlSW5wdXQuZmlsZXNbMF0uc2l6ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZmlsZVNpemUgPSBNYXRoLnJvdW5kKGZpbGVTaXplIC8gMTAyNCAqIDEwMCkgLyAxMDA7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZmlsZVNpemU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDojrflj5bmlofku7blkI7nvIDvvIjlsI/lhpnvvInvvIzlpoLvvJonLmpwZydcbiAgICAgICAgICAgICAqIEBwYXJhbSBmaWxlSWQgPFN0cmluZz4gaW5wdXRbdHlwZT1maWxlXeWFg+e0oGlkXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGdldEZpbGVTdWZmaXg6IGZ1bmN0aW9uIChmaWxlSWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgZmlsZUlucHV0ID0gJChcIiNcIiArIGZpbGVJZClbMF07XG4gICAgICAgICAgICAgICAgaWYgKGZpbGVJbnB1dCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmlsZUlucHV0LnZhbHVlLnN1YnN0cihmaWxlSW5wdXQudmFsdWUubGFzdEluZGV4T2YoXCIuXCIpKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBqUXVlcnk7XG59KTsiXSwiZmlsZSI6InBsdWdpbnMvYWpheGZpbGV1cGxvYWQuanMifQ==
