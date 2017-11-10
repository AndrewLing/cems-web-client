/**
 * 使用方式：
 * 设置语言优先级：
 *      设置语言 > Cookie 中 Prefer_Lang 的值 > 'zh_CN'
 * <pre>
 * 例如：
 *      <span class="i18n" data-i18n-type="text title" data-i18n-message-text="Msg.systemName" data-i18n-message-title="Msg.systemName">Msg.systemName</span>
 * </pre>
 * Created by PL02053 on 2016/3/10.
 */
define('i18n', ['jquery', 'cookie'], function () {
    var defaultLanguage = 'zh_CN';

    if (typeof Msg != 'undefined' && !Msg) {
        window.Msg = {};
    }

    return {
        /**
         * 加载国际化文件
         * @param module { App.Module | {package: "包名", moduleName: "模块名"} | String } 模块，默认“common”模块
         * @param language {String} 加载指定语言，默认当前语言
         * @param callback {Function} 加载完成回调方法
         */
        loadLanguageFile: function (module, language, callback) {
            var self = this;

            if ($.isFunction(module)) {
                callback = module;
                language = Cookies.getCook('Prefer_Lang') || defaultLanguage;
                module = "common";
            }
            if ($.isFunction(language)) {
                callback = language;
                language = Cookies.getCook('Prefer_Lang') || defaultLanguage;
                module = "common";
            }

            language = language || Cookies.getCook('Prefer_Lang') || defaultLanguage;

            var pkg, moduleName;

            if (module && !$.isEmptyObject(module)) {
                if (module instanceof String || typeof module == "string") {
                    var index = module.lastIndexOf('/');
                    pkg = module.substr(0, index + 1);
                    moduleName = module.substr(index + 1);
                } else {
                    pkg = module.package;
                    moduleName = module.moduleName;
                }
            } else {
                pkg = "/";
                moduleName = "common";
            }

            var file = 'language/' + language + '/' + moduleName;
            pkg = pkg.replace(/^\//, '').replace(/\/$/, '');
            if (pkg) {
                file = 'language/' + language + '/' + pkg + '/' + moduleName;
            }
            require([file], (function (language, pkg, moduleName) {
                return (function (moduleMessage) {
                    Cookies.setCookByName("Prefer_Lang", language);

                    self.initData(language, pkg, moduleName, moduleMessage);
                    window.Msg = self[language];

                    callback instanceof Function && callback();
                });
            })(language, pkg, moduleName));
        },

        /**
         * 数据初始化
         * @param language 语言
         * @param pkg 包路径，如: "/modules/home"
         * @param moduleName 包路径，如: "kpiView"
         * @param messages 指定包路径下，指定语言的国际化信息
         */
        initData: function (language, pkg, moduleName, messages) {
            if (!(language instanceof String || typeof language == "string")) {
                messages = language;
                pkg = "";
                moduleName = "";
                language = Cookies.getCook('Prefer_Lang') || defaultLanguage;
            }
            if (!(pkg instanceof String || typeof pkg == "string")) {
                messages = pkg;
                pkg = "";
            }
            if (!(moduleName instanceof String || typeof moduleName == "string")) {
                messages = moduleName;
                moduleName = "";
            }
            pkg = pkg.replace(/^\//, '').replace(/\/$/, '').replace(/\//g, '.');

            var command = '';
            var exec = /modules(\.)?(.*)/.exec(pkg);
            if (exec && exec[2]) {
                if (!moduleName || moduleName == exec[2] || moduleName == 'index') {
                    command = 'this.' + (language || defaultLanguage) + (pkg && '.' + pkg || '') + '=messages';
                } else {
                    command = 'this.' + (language || defaultLanguage) + '.' + pkg + '.' + moduleName + '=messages';
                }
            } else {
                command = 'this.' + (language || defaultLanguage) + (pkg && '.' + pkg || '') + '=messages';
            }
            eval(command);
        },

        /**
         * 国际化处理
         */
        setLanguage: function () {
            var self = this;
            var language = Cookies.getCook('Prefer_Lang') || defaultLanguage;
            $('.i18n').each(function (i, e) {
                var type = e.dataset ? e.dataset.i18nType : $(e).attr('data-i18n-type');
                var typeList = [];
                if (type) {
                    typeList = type.split(/\s\s*/g);
                }
                else {
                    typeList = ['text'];
                }
                e.dataset && (e.dataset.i18nType = typeList.join(' ')) || $(e).attr('data-i18n-type', typeList.join(' '));

                var __evalMsg = function (msg) {
                    var evalMsg = '';
                    var msgs = msg.split(/\s*\+\s*/);
                    $.each(msgs, function (i, m) {
                        evalMsg += self._evalMessage(self[language], m || '');
                    });
                    return evalMsg;
                };

                $.each(typeList, function (s, type) {
                    var evalMsg = '';
                    switch (type) {
                        case 'text':
                            var msgText = e.dataset && e.dataset.i18nMessageText || $(e).attr('data-i18n-message-text');
                            msgText = msgText || (e.innerText && e.innerText.replace(/[\s\r\n]/g, ''));
                            e.dataset && (e.dataset.i18nMessageText = msgText) || $(e).attr('data-i18n-message-text', msgText);
                            evalMsg = __evalMsg(msgText);
                            break;
                        case 'title':
                            var msgTitle = e.dataset && e.dataset.i18nMessageTitle || $(e).attr('data-i18n-message-title');
                            msgTitle = msgTitle || e.title || $(e).attr('title') || (e.innerText && e.innerText.replace(/[\s\r\n]/g, ''));
                            e.dataset && (e.dataset.i18nMessageTitle = msgTitle) || $(e).attr('data-i18n-message-title', msgTitle);
                            evalMsg = __evalMsg(msgTitle);
                            break;
                        case 'value':
                            var msgValue = e.dataset && e.dataset.i18nMessageValue || $(e).attr('data-i18n-message-value');
                            msgValue = msgValue || e.value || $(e).val() || (e.innerText && e.innerText.replace(/[\s\r\n]/g, ''));
                            e.dataset && (e.dataset.i18nMessageValue = msgValue) || $(e).attr('data-i18n-message-value', msgValue);
                            evalMsg = __evalMsg(msgValue);
                            break;
                        case 'placeholder':
                            var msgPlaceholder = e.dataset && e.dataset.i18nMessagePlaceholder || $(e).attr('data-i18n-message-placeholder');
                            msgPlaceholder = msgPlaceholder || e.placeholder || $(e).attr('placeholder') || (e.innerText && e.innerText.replace(/[\s\r\n]/g, ''));
                            e.dataset && (e.dataset.i18nMessagePlaceholder = msgPlaceholder) || $(e).attr('data-i18n-message-placeholder', msgPlaceholder);
                            evalMsg = __evalMsg(msgPlaceholder);
                            break;
                        case 'alt':
                            var msgAlt = e.dataset && e.dataset.i18nMessageAlt || $(e).attr('data-i18n-message-alt');
                            msgAlt = msgAlt || e.alt || $(e).attr('alt') || (e.innerText && e.innerText.replace(/[\s\r\n]/g, ''));
                            e.dataset && (e.dataset.i18nMessageAlt = msgAlt) || $(e).attr('data-i18n-message-alt', msgAlt);
                            evalMsg = __evalMsg(msgAlt);
                            break;
                        default:
                            break;
                    }
                    self._setMessage($(e), type, evalMsg);
                });
            });
        },

        /**
         * 消息国际化解析
         * @param msg
         * @returns {*|string}
         */
        eval: function (msg) {
            var language = Cookies.getCook('Prefer_Lang') || defaultLanguage;
            var self = this;
            return self._evalMessage(self[language], msg || '');
        },

        /**
         * 消息国际化解析
         * @param context
         * @param msg
         * @returns {*|string}
         * @private
         */
        _evalMessage: function (context, msg) {
            var ptns = msg.substring(msg.indexOf('.') + 1).split('.');
            var evalMsg = context || '';
            for (var i = 0; i < ptns.length; i++) {
                var ptn = ptns[i];
                if (ptn.indexOf('[') >= 0) {
                    var h = ptn.substring(0, ptn.indexOf('['));
                    evalMsg = evalMsg[h];
                    var pps = ptn.match(/\[[^\[\]]+]/g);
                    for (var j = 0; j < pps.length; j++) {
                        var pp = pps[j];
                        evalMsg = evalMsg[pp.substring(pp.indexOf('[') + 1, pp.indexOf(']'))];
                    }
                }
                else {
                    evalMsg = evalMsg[ptns[i]] || ptns[i] || '';
                    context = evalMsg;
                }
            }
            if (typeof evalMsg == "string") {
                return evalMsg.replace(/['"]/g, '');
            }
            return msg.replace(/['"]/g, '');
        },
        /**
         * 写入国际化处理后的消息
         * @param $e
         * @param type
         * @param message
         * @private
         */
        _setMessage: function ($e, type, message) {
            if ($e && $e.length) {
                switch (type) {
                    case 'text':
                        $e.text(message);
                        break;
                    case 'title':
                        $e.attr('title', message);
                        break;
                    case 'value':
                        $e.val(message);
                        break;
                    case 'placeholder':
                        $e.attr('placeholder', message);
                        break;
                    case 'alt':
                        $e.attr('alt', message);
                        break;
                    default:
                }
            }
        }

    };
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJsYW5ndWFnZS9pMThuLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiDkvb/nlKjmlrnlvI/vvJpcclxuICog6K6+572u6K+t6KiA5LyY5YWI57qn77yaXHJcbiAqICAgICAg6K6+572u6K+t6KiAID4gQ29va2llIOS4rSBQcmVmZXJfTGFuZyDnmoTlgLwgPiAnemhfQ04nXHJcbiAqIDxwcmU+XHJcbiAqIOS+i+Wmgu+8mlxyXG4gKiAgICAgIDxzcGFuIGNsYXNzPVwiaTE4blwiIGRhdGEtaTE4bi10eXBlPVwidGV4dCB0aXRsZVwiIGRhdGEtaTE4bi1tZXNzYWdlLXRleHQ9XCJNc2cuc3lzdGVtTmFtZVwiIGRhdGEtaTE4bi1tZXNzYWdlLXRpdGxlPVwiTXNnLnN5c3RlbU5hbWVcIj5Nc2cuc3lzdGVtTmFtZTwvc3Bhbj5cclxuICogPC9wcmU+XHJcbiAqIENyZWF0ZWQgYnkgUEwwMjA1MyBvbiAyMDE2LzMvMTAuXHJcbiAqL1xyXG5kZWZpbmUoJ2kxOG4nLCBbJ2pxdWVyeScsICdjb29raWUnXSwgZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGRlZmF1bHRMYW5ndWFnZSA9ICd6aF9DTic7XHJcblxyXG4gICAgaWYgKHR5cGVvZiBNc2cgIT0gJ3VuZGVmaW5lZCcgJiYgIU1zZykge1xyXG4gICAgICAgIHdpbmRvdy5Nc2cgPSB7fTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOWKoOi9veWbvemZheWMluaWh+S7tlxyXG4gICAgICAgICAqIEBwYXJhbSBtb2R1bGUgeyBBcHAuTW9kdWxlIHwge3BhY2thZ2U6IFwi5YyF5ZCNXCIsIG1vZHVsZU5hbWU6IFwi5qih5Z2X5ZCNXCJ9IHwgU3RyaW5nIH0g5qih5Z2X77yM6buY6K6k4oCcY29tbW9u4oCd5qih5Z2XXHJcbiAgICAgICAgICogQHBhcmFtIGxhbmd1YWdlIHtTdHJpbmd9IOWKoOi9veaMh+WumuivreiogO+8jOm7mOiupOW9k+WJjeivreiogFxyXG4gICAgICAgICAqIEBwYXJhbSBjYWxsYmFjayB7RnVuY3Rpb259IOWKoOi9veWujOaIkOWbnuiwg+aWueazlVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGxvYWRMYW5ndWFnZUZpbGU6IGZ1bmN0aW9uIChtb2R1bGUsIGxhbmd1YWdlLCBjYWxsYmFjaykge1xyXG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgICAgICBpZiAoJC5pc0Z1bmN0aW9uKG1vZHVsZSkpIHtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrID0gbW9kdWxlO1xyXG4gICAgICAgICAgICAgICAgbGFuZ3VhZ2UgPSBDb29raWVzLmdldENvb2soJ1ByZWZlcl9MYW5nJykgfHwgZGVmYXVsdExhbmd1YWdlO1xyXG4gICAgICAgICAgICAgICAgbW9kdWxlID0gXCJjb21tb25cIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoJC5pc0Z1bmN0aW9uKGxhbmd1YWdlKSkge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2sgPSBsYW5ndWFnZTtcclxuICAgICAgICAgICAgICAgIGxhbmd1YWdlID0gQ29va2llcy5nZXRDb29rKCdQcmVmZXJfTGFuZycpIHx8IGRlZmF1bHRMYW5ndWFnZTtcclxuICAgICAgICAgICAgICAgIG1vZHVsZSA9IFwiY29tbW9uXCI7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxhbmd1YWdlID0gbGFuZ3VhZ2UgfHwgQ29va2llcy5nZXRDb29rKCdQcmVmZXJfTGFuZycpIHx8IGRlZmF1bHRMYW5ndWFnZTtcclxuXHJcbiAgICAgICAgICAgIHZhciBwa2csIG1vZHVsZU5hbWU7XHJcblxyXG4gICAgICAgICAgICBpZiAobW9kdWxlICYmICEkLmlzRW1wdHlPYmplY3QobW9kdWxlKSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKG1vZHVsZSBpbnN0YW5jZW9mIFN0cmluZyB8fCB0eXBlb2YgbW9kdWxlID09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSBtb2R1bGUubGFzdEluZGV4T2YoJy8nKTtcclxuICAgICAgICAgICAgICAgICAgICBwa2cgPSBtb2R1bGUuc3Vic3RyKDAsIGluZGV4ICsgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlTmFtZSA9IG1vZHVsZS5zdWJzdHIoaW5kZXggKyAxKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcGtnID0gbW9kdWxlLnBhY2thZ2U7XHJcbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlTmFtZSA9IG1vZHVsZS5tb2R1bGVOYW1lO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcGtnID0gXCIvXCI7XHJcbiAgICAgICAgICAgICAgICBtb2R1bGVOYW1lID0gXCJjb21tb25cIjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIGZpbGUgPSAnbGFuZ3VhZ2UvJyArIGxhbmd1YWdlICsgJy8nICsgbW9kdWxlTmFtZTtcclxuICAgICAgICAgICAgcGtnID0gcGtnLnJlcGxhY2UoL15cXC8vLCAnJykucmVwbGFjZSgvXFwvJC8sICcnKTtcclxuICAgICAgICAgICAgaWYgKHBrZykge1xyXG4gICAgICAgICAgICAgICAgZmlsZSA9ICdsYW5ndWFnZS8nICsgbGFuZ3VhZ2UgKyAnLycgKyBwa2cgKyAnLycgKyBtb2R1bGVOYW1lO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJlcXVpcmUoW2ZpbGVdLCAoZnVuY3Rpb24gKGxhbmd1YWdlLCBwa2csIG1vZHVsZU5hbWUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAoZnVuY3Rpb24gKG1vZHVsZU1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgICAgICAgICBDb29raWVzLnNldENvb2tCeU5hbWUoXCJQcmVmZXJfTGFuZ1wiLCBsYW5ndWFnZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuaW5pdERhdGEobGFuZ3VhZ2UsIHBrZywgbW9kdWxlTmFtZSwgbW9kdWxlTWVzc2FnZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgd2luZG93Lk1zZyA9IHNlbGZbbGFuZ3VhZ2VdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayBpbnN0YW5jZW9mIEZ1bmN0aW9uICYmIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSkobGFuZ3VhZ2UsIHBrZywgbW9kdWxlTmFtZSkpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOaVsOaNruWIneWni+WMllxyXG4gICAgICAgICAqIEBwYXJhbSBsYW5ndWFnZSDor63oqIBcclxuICAgICAgICAgKiBAcGFyYW0gcGtnIOWMhei3r+W+hO+8jOWmgjogXCIvbW9kdWxlcy9ob21lXCJcclxuICAgICAgICAgKiBAcGFyYW0gbW9kdWxlTmFtZSDljIXot6/lvoTvvIzlpoI6IFwia3BpVmlld1wiXHJcbiAgICAgICAgICogQHBhcmFtIG1lc3NhZ2VzIOaMh+WumuWMhei3r+W+hOS4i++8jOaMh+WumuivreiogOeahOWbvemZheWMluS/oeaBr1xyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGluaXREYXRhOiBmdW5jdGlvbiAobGFuZ3VhZ2UsIHBrZywgbW9kdWxlTmFtZSwgbWVzc2FnZXMpIHtcclxuICAgICAgICAgICAgaWYgKCEobGFuZ3VhZ2UgaW5zdGFuY2VvZiBTdHJpbmcgfHwgdHlwZW9mIGxhbmd1YWdlID09IFwic3RyaW5nXCIpKSB7XHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlcyA9IGxhbmd1YWdlO1xyXG4gICAgICAgICAgICAgICAgcGtnID0gXCJcIjtcclxuICAgICAgICAgICAgICAgIG1vZHVsZU5hbWUgPSBcIlwiO1xyXG4gICAgICAgICAgICAgICAgbGFuZ3VhZ2UgPSBDb29raWVzLmdldENvb2soJ1ByZWZlcl9MYW5nJykgfHwgZGVmYXVsdExhbmd1YWdlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICghKHBrZyBpbnN0YW5jZW9mIFN0cmluZyB8fCB0eXBlb2YgcGtnID09IFwic3RyaW5nXCIpKSB7XHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlcyA9IHBrZztcclxuICAgICAgICAgICAgICAgIHBrZyA9IFwiXCI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCEobW9kdWxlTmFtZSBpbnN0YW5jZW9mIFN0cmluZyB8fCB0eXBlb2YgbW9kdWxlTmFtZSA9PSBcInN0cmluZ1wiKSkge1xyXG4gICAgICAgICAgICAgICAgbWVzc2FnZXMgPSBtb2R1bGVOYW1lO1xyXG4gICAgICAgICAgICAgICAgbW9kdWxlTmFtZSA9IFwiXCI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcGtnID0gcGtnLnJlcGxhY2UoL15cXC8vLCAnJykucmVwbGFjZSgvXFwvJC8sICcnKS5yZXBsYWNlKC9cXC8vZywgJy4nKTtcclxuXHJcbiAgICAgICAgICAgIHZhciBjb21tYW5kID0gJyc7XHJcbiAgICAgICAgICAgIHZhciBleGVjID0gL21vZHVsZXMoXFwuKT8oLiopLy5leGVjKHBrZyk7XHJcbiAgICAgICAgICAgIGlmIChleGVjICYmIGV4ZWNbMl0pIHtcclxuICAgICAgICAgICAgICAgIGlmICghbW9kdWxlTmFtZSB8fCBtb2R1bGVOYW1lID09IGV4ZWNbMl0gfHwgbW9kdWxlTmFtZSA9PSAnaW5kZXgnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZCA9ICd0aGlzLicgKyAobGFuZ3VhZ2UgfHwgZGVmYXVsdExhbmd1YWdlKSArIChwa2cgJiYgJy4nICsgcGtnIHx8ICcnKSArICc9bWVzc2FnZXMnO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kID0gJ3RoaXMuJyArIChsYW5ndWFnZSB8fCBkZWZhdWx0TGFuZ3VhZ2UpICsgJy4nICsgcGtnICsgJy4nICsgbW9kdWxlTmFtZSArICc9bWVzc2FnZXMnO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29tbWFuZCA9ICd0aGlzLicgKyAobGFuZ3VhZ2UgfHwgZGVmYXVsdExhbmd1YWdlKSArIChwa2cgJiYgJy4nICsgcGtnIHx8ICcnKSArICc9bWVzc2FnZXMnO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGV2YWwoY29tbWFuZCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog5Zu96ZmF5YyW5aSE55CGXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgc2V0TGFuZ3VhZ2U6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgICAgICB2YXIgbGFuZ3VhZ2UgPSBDb29raWVzLmdldENvb2soJ1ByZWZlcl9MYW5nJykgfHwgZGVmYXVsdExhbmd1YWdlO1xyXG4gICAgICAgICAgICAkKCcuaTE4bicpLmVhY2goZnVuY3Rpb24gKGksIGUpIHtcclxuICAgICAgICAgICAgICAgIHZhciB0eXBlID0gZS5kYXRhc2V0ID8gZS5kYXRhc2V0LmkxOG5UeXBlIDogJChlKS5hdHRyKCdkYXRhLWkxOG4tdHlwZScpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHR5cGVMaXN0ID0gW107XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGVMaXN0ID0gdHlwZS5zcGxpdCgvXFxzXFxzKi9nKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGVMaXN0ID0gWyd0ZXh0J107XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlLmRhdGFzZXQgJiYgKGUuZGF0YXNldC5pMThuVHlwZSA9IHR5cGVMaXN0LmpvaW4oJyAnKSkgfHwgJChlKS5hdHRyKCdkYXRhLWkxOG4tdHlwZScsIHR5cGVMaXN0LmpvaW4oJyAnKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIF9fZXZhbE1zZyA9IGZ1bmN0aW9uIChtc2cpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZXZhbE1zZyA9ICcnO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBtc2dzID0gbXNnLnNwbGl0KC9cXHMqXFwrXFxzKi8pO1xyXG4gICAgICAgICAgICAgICAgICAgICQuZWFjaChtc2dzLCBmdW5jdGlvbiAoaSwgbSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBldmFsTXNnICs9IHNlbGYuX2V2YWxNZXNzYWdlKHNlbGZbbGFuZ3VhZ2VdLCBtIHx8ICcnKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXZhbE1zZztcclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgJC5lYWNoKHR5cGVMaXN0LCBmdW5jdGlvbiAocywgdHlwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBldmFsTXNnID0gJyc7XHJcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoICh0eXBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3RleHQnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1zZ1RleHQgPSBlLmRhdGFzZXQgJiYgZS5kYXRhc2V0LmkxOG5NZXNzYWdlVGV4dCB8fCAkKGUpLmF0dHIoJ2RhdGEtaTE4bi1tZXNzYWdlLXRleHQnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1zZ1RleHQgPSBtc2dUZXh0IHx8IChlLmlubmVyVGV4dCAmJiBlLmlubmVyVGV4dC5yZXBsYWNlKC9bXFxzXFxyXFxuXS9nLCAnJykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5kYXRhc2V0ICYmIChlLmRhdGFzZXQuaTE4bk1lc3NhZ2VUZXh0ID0gbXNnVGV4dCkgfHwgJChlKS5hdHRyKCdkYXRhLWkxOG4tbWVzc2FnZS10ZXh0JywgbXNnVGV4dCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmFsTXNnID0gX19ldmFsTXNnKG1zZ1RleHQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3RpdGxlJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtc2dUaXRsZSA9IGUuZGF0YXNldCAmJiBlLmRhdGFzZXQuaTE4bk1lc3NhZ2VUaXRsZSB8fCAkKGUpLmF0dHIoJ2RhdGEtaTE4bi1tZXNzYWdlLXRpdGxlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtc2dUaXRsZSA9IG1zZ1RpdGxlIHx8IGUudGl0bGUgfHwgJChlKS5hdHRyKCd0aXRsZScpIHx8IChlLmlubmVyVGV4dCAmJiBlLmlubmVyVGV4dC5yZXBsYWNlKC9bXFxzXFxyXFxuXS9nLCAnJykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5kYXRhc2V0ICYmIChlLmRhdGFzZXQuaTE4bk1lc3NhZ2VUaXRsZSA9IG1zZ1RpdGxlKSB8fCAkKGUpLmF0dHIoJ2RhdGEtaTE4bi1tZXNzYWdlLXRpdGxlJywgbXNnVGl0bGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZhbE1zZyA9IF9fZXZhbE1zZyhtc2dUaXRsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAndmFsdWUnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1zZ1ZhbHVlID0gZS5kYXRhc2V0ICYmIGUuZGF0YXNldC5pMThuTWVzc2FnZVZhbHVlIHx8ICQoZSkuYXR0cignZGF0YS1pMThuLW1lc3NhZ2UtdmFsdWUnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1zZ1ZhbHVlID0gbXNnVmFsdWUgfHwgZS52YWx1ZSB8fCAkKGUpLnZhbCgpIHx8IChlLmlubmVyVGV4dCAmJiBlLmlubmVyVGV4dC5yZXBsYWNlKC9bXFxzXFxyXFxuXS9nLCAnJykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5kYXRhc2V0ICYmIChlLmRhdGFzZXQuaTE4bk1lc3NhZ2VWYWx1ZSA9IG1zZ1ZhbHVlKSB8fCAkKGUpLmF0dHIoJ2RhdGEtaTE4bi1tZXNzYWdlLXZhbHVlJywgbXNnVmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZhbE1zZyA9IF9fZXZhbE1zZyhtc2dWYWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAncGxhY2Vob2xkZXInOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1zZ1BsYWNlaG9sZGVyID0gZS5kYXRhc2V0ICYmIGUuZGF0YXNldC5pMThuTWVzc2FnZVBsYWNlaG9sZGVyIHx8ICQoZSkuYXR0cignZGF0YS1pMThuLW1lc3NhZ2UtcGxhY2Vob2xkZXInKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1zZ1BsYWNlaG9sZGVyID0gbXNnUGxhY2Vob2xkZXIgfHwgZS5wbGFjZWhvbGRlciB8fCAkKGUpLmF0dHIoJ3BsYWNlaG9sZGVyJykgfHwgKGUuaW5uZXJUZXh0ICYmIGUuaW5uZXJUZXh0LnJlcGxhY2UoL1tcXHNcXHJcXG5dL2csICcnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLmRhdGFzZXQgJiYgKGUuZGF0YXNldC5pMThuTWVzc2FnZVBsYWNlaG9sZGVyID0gbXNnUGxhY2Vob2xkZXIpIHx8ICQoZSkuYXR0cignZGF0YS1pMThuLW1lc3NhZ2UtcGxhY2Vob2xkZXInLCBtc2dQbGFjZWhvbGRlcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmFsTXNnID0gX19ldmFsTXNnKG1zZ1BsYWNlaG9sZGVyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdhbHQnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1zZ0FsdCA9IGUuZGF0YXNldCAmJiBlLmRhdGFzZXQuaTE4bk1lc3NhZ2VBbHQgfHwgJChlKS5hdHRyKCdkYXRhLWkxOG4tbWVzc2FnZS1hbHQnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1zZ0FsdCA9IG1zZ0FsdCB8fCBlLmFsdCB8fCAkKGUpLmF0dHIoJ2FsdCcpIHx8IChlLmlubmVyVGV4dCAmJiBlLmlubmVyVGV4dC5yZXBsYWNlKC9bXFxzXFxyXFxuXS9nLCAnJykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5kYXRhc2V0ICYmIChlLmRhdGFzZXQuaTE4bk1lc3NhZ2VBbHQgPSBtc2dBbHQpIHx8ICQoZSkuYXR0cignZGF0YS1pMThuLW1lc3NhZ2UtYWx0JywgbXNnQWx0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2YWxNc2cgPSBfX2V2YWxNc2cobXNnQWx0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX3NldE1lc3NhZ2UoJChlKSwgdHlwZSwgZXZhbE1zZyk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog5raI5oGv5Zu96ZmF5YyW6Kej5p6QXHJcbiAgICAgICAgICogQHBhcmFtIG1zZ1xyXG4gICAgICAgICAqIEByZXR1cm5zIHsqfHN0cmluZ31cclxuICAgICAgICAgKi9cclxuICAgICAgICBldmFsOiBmdW5jdGlvbiAobXNnKSB7XHJcbiAgICAgICAgICAgIHZhciBsYW5ndWFnZSA9IENvb2tpZXMuZ2V0Q29vaygnUHJlZmVyX0xhbmcnKSB8fCBkZWZhdWx0TGFuZ3VhZ2U7XHJcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICAgICAgcmV0dXJuIHNlbGYuX2V2YWxNZXNzYWdlKHNlbGZbbGFuZ3VhZ2VdLCBtc2cgfHwgJycpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOa2iOaBr+WbvemZheWMluino+aekFxyXG4gICAgICAgICAqIEBwYXJhbSBjb250ZXh0XHJcbiAgICAgICAgICogQHBhcmFtIG1zZ1xyXG4gICAgICAgICAqIEByZXR1cm5zIHsqfHN0cmluZ31cclxuICAgICAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIF9ldmFsTWVzc2FnZTogZnVuY3Rpb24gKGNvbnRleHQsIG1zZykge1xyXG4gICAgICAgICAgICB2YXIgcHRucyA9IG1zZy5zdWJzdHJpbmcobXNnLmluZGV4T2YoJy4nKSArIDEpLnNwbGl0KCcuJyk7XHJcbiAgICAgICAgICAgIHZhciBldmFsTXNnID0gY29udGV4dCB8fCAnJztcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwdG5zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcHRuID0gcHRuc1tpXTtcclxuICAgICAgICAgICAgICAgIGlmIChwdG4uaW5kZXhPZignWycpID49IDApIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaCA9IHB0bi5zdWJzdHJpbmcoMCwgcHRuLmluZGV4T2YoJ1snKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZhbE1zZyA9IGV2YWxNc2dbaF07XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBwcyA9IHB0bi5tYXRjaCgvXFxbW15cXFtcXF1dK10vZyk7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBwcHMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHBwID0gcHBzW2pdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBldmFsTXNnID0gZXZhbE1zZ1twcC5zdWJzdHJpbmcocHAuaW5kZXhPZignWycpICsgMSwgcHAuaW5kZXhPZignXScpKV07XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZhbE1zZyA9IGV2YWxNc2dbcHRuc1tpXV0gfHwgcHRuc1tpXSB8fCAnJztcclxuICAgICAgICAgICAgICAgICAgICBjb250ZXh0ID0gZXZhbE1zZztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIGV2YWxNc2cgPT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGV2YWxNc2cucmVwbGFjZSgvWydcIl0vZywgJycpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBtc2cucmVwbGFjZSgvWydcIl0vZywgJycpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog5YaZ5YWl5Zu96ZmF5YyW5aSE55CG5ZCO55qE5raI5oGvXHJcbiAgICAgICAgICogQHBhcmFtICRlXHJcbiAgICAgICAgICogQHBhcmFtIHR5cGVcclxuICAgICAgICAgKiBAcGFyYW0gbWVzc2FnZVxyXG4gICAgICAgICAqIEBwcml2YXRlXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgX3NldE1lc3NhZ2U6IGZ1bmN0aW9uICgkZSwgdHlwZSwgbWVzc2FnZSkge1xyXG4gICAgICAgICAgICBpZiAoJGUgJiYgJGUubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICd0ZXh0JzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgJGUudGV4dChtZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAndGl0bGUnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAkZS5hdHRyKCd0aXRsZScsIG1lc3NhZ2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICd2YWx1ZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRlLnZhbChtZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAncGxhY2Vob2xkZXInOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAkZS5hdHRyKCdwbGFjZWhvbGRlcicsIG1lc3NhZ2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdhbHQnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAkZS5hdHRyKCdhbHQnLCBtZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9O1xyXG59KTsiXSwiZmlsZSI6Imxhbmd1YWdlL2kxOG4uanMifQ==
