// Copyright (c) 2009, Baidu Inc. All rights reserved.
// 
// Licensed under the BSD License
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//      http:// tangram.baidu.com/license.html
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
 /**
 * @namespace T Tangram七巧板
 * @name T
 * @version 1.6.0
*/

/**
 * 声明baidu包
 * @author: allstar, erik, meizz, berg
 */
var T,
    baidu = T = baidu || {version: "1.5.0"};
baidu.guid = "$BAIDU$";
baidu.$$ = window[baidu.guid] = window[baidu.guid] || {global:{}};

/**
 * 使用flash资源封装的一些功能
 * @namespace baidu.flash
 */
baidu.flash = baidu.flash || {};

/**
 * 操作dom的方法
 * @namespace baidu.dom 
 */
baidu.dom = baidu.dom || {};


/**
 * 从文档中获取指定的DOM元素
 * @name baidu.dom.g
 * @function
 * @grammar baidu.dom.g(id)
 * @param {string|HTMLElement} id 元素的id或DOM元素.
 * @shortcut g,T.G
 * @meta standard
 * @see baidu.dom.q
 *
 * @return {HTMLElement|null} 获取的元素，查找不到时返回null,如果参数不合法，直接返回参数.
 */
baidu.dom.g = function(id) {
    if (!id) return null;
    if ('string' == typeof id || id instanceof String) {
        return document.getElementById(id);
    } else if (id.nodeName && (id.nodeType == 1 || id.nodeType == 9)) {
        return id;
    }
    return null;
};
baidu.g = baidu.G = baidu.dom.g;


/**
 * 操作数组的方法
 * @namespace baidu.array
 */

baidu.array = baidu.array || {};


/**
 * 遍历数组中所有元素
 * @name baidu.array.each
 * @function
 * @grammar baidu.array.each(source, iterator[, thisObject])
 * @param {Array} source 需要遍历的数组
 * @param {Function} iterator 对每个数组元素进行调用的函数，该函数有两个参数，第一个为数组元素，第二个为数组索引值，function (item, index)。
 * @param {Object} [thisObject] 函数调用时的this指针，如果没有此参数，默认是当前遍历的数组
 * @remark
 * each方法不支持对Object的遍历,对Object的遍历使用baidu.object.each 。
 * @shortcut each
 * @meta standard
 *             
 * @returns {Array} 遍历的数组
 */
 
baidu.each = baidu.array.forEach = baidu.array.each = function (source, iterator, thisObject) {
    var returnValue, item, i, len = source.length;
    
    if ('function' == typeof iterator) {
        for (i = 0; i < len; i++) {
            item = source[i];
            returnValue = iterator.call(thisObject || source, item, i);
    
            if (returnValue === false) {
                break;
            }
        }
    }
    return source;
};

/**
 * 对语言层面的封装，包括类型判断、模块扩展、继承基类以及对象自定义事件的支持。
 * @namespace baidu.lang
 */
baidu.lang = baidu.lang || {};


/**
 * 判断目标参数是否为function或Function实例
 * @name baidu.lang.isFunction
 * @function
 * @grammar baidu.lang.isFunction(source)
 * @param {Any} source 目标参数
 * @version 1.2
 * @see baidu.lang.isString,baidu.lang.isObject,baidu.lang.isNumber,baidu.lang.isArray,baidu.lang.isElement,baidu.lang.isBoolean,baidu.lang.isDate
 * @meta standard
 * @returns {boolean} 类型判断结果
 */
baidu.lang.isFunction = function (source) {
    return '[object Function]' == Object.prototype.toString.call(source);
};

/**
 * 判断目标参数是否string类型或String对象
 * @name baidu.lang.isString
 * @function
 * @grammar baidu.lang.isString(source)
 * @param {Any} source 目标参数
 * @shortcut isString
 * @meta standard
 * @see baidu.lang.isObject,baidu.lang.isNumber,baidu.lang.isArray,baidu.lang.isElement,baidu.lang.isBoolean,baidu.lang.isDate
 *             
 * @returns {boolean} 类型判断结果
 */
baidu.lang.isString = function (source) {
    return '[object String]' == Object.prototype.toString.call(source);
};
baidu.isString = baidu.lang.isString;


/**
 * 判断浏览器类型和特性的属性
 * @namespace baidu.browser
 */
baidu.browser = baidu.browser || {};


/**
 * 判断是否为opera浏览器
 * @property opera opera版本号
 * @grammar baidu.browser.opera
 * @meta standard
 * @see baidu.browser.ie,baidu.browser.firefox,baidu.browser.safari,baidu.browser.chrome
 * @returns {Number} opera版本号
 */

/**
 * opera 从10开始不是用opera后面的字符串进行版本的判断
 * 在Browser identification最后添加Version + 数字进行版本标识
 * opera后面的数字保持在9.80不变
 */
baidu.browser.opera = /opera(\/| )(\d+(\.\d+)?)(.+?(version\/(\d+(\.\d+)?)))?/i.test(navigator.userAgent) ?  + ( RegExp["\x246"] || RegExp["\x242"] ) : undefined;


/**
 * 在目标元素的指定位置插入HTML代码
 * @name baidu.dom.insertHTML
 * @function
 * @grammar baidu.dom.insertHTML(element, position, html)
 * @param {HTMLElement|string} element 目标元素或目标元素的id
 * @param {string} position 插入html的位置信息，取值为beforeBegin,afterBegin,beforeEnd,afterEnd
 * @param {string} html 要插入的html
 * @remark
 * 
 * 对于position参数，大小写不敏感<br>
 * 参数的意思：beforeBegin&lt;span&gt;afterBegin   this is span! beforeEnd&lt;/span&gt; afterEnd <br />
 * 此外，如果使用本函数插入带有script标签的HTML字符串，script标签对应的脚本将不会被执行。
 * 
 * @shortcut insertHTML
 * @meta standard
 *             
 * @returns {HTMLElement} 目标元素
 */
baidu.dom.insertHTML = function (element, position, html) {
    element = baidu.dom.g(element);
    var range,begin;
    if (element.insertAdjacentHTML && !baidu.browser.opera) {
        element.insertAdjacentHTML(position, html);
    } else {
        range = element.ownerDocument.createRange();
        position = position.toUpperCase();
        if (position == 'AFTERBEGIN' || position == 'BEFOREEND') {
            range.selectNodeContents(element);
            range.collapse(position == 'AFTERBEGIN');
        } else {
            begin = position == 'BEFOREBEGIN';
            range[begin ? 'setStartBefore' : 'setEndAfter'](element);
            range.collapse(begin);
        }
        range.insertNode(range.createContextualFragment(html));
    }
    return element;
};

baidu.insertHTML = baidu.dom.insertHTML;

/**
 * 操作flash对象的方法，包括创建flash对象、获取flash对象以及判断flash插件的版本号
 * @namespace baidu.swf
 */
baidu.swf = baidu.swf || {};


/**
 * 浏览器支持的flash插件版本
 * @property version 浏览器支持的flash插件版本
 * @grammar baidu.swf.version
 * @return {String} 版本号
 * @meta standard
 */
baidu.swf.version = (function () {
    var n = navigator;
    if (n.plugins && n.mimeTypes.length) {
        var plugin = n.plugins["Shockwave Flash"];
        if (plugin && plugin.description) {
            return plugin.description
                    .replace(/([a-zA-Z]|\s)+/, "")
                    .replace(/(\s)+r/, ".") + ".0";
        }
    } else if (window.ActiveXObject && !window.opera) {
        for (var i = 12; i >= 2; i--) {
            try {
                var c = new ActiveXObject('ShockwaveFlash.ShockwaveFlash.' + i);
                if (c) {
                    var version = c.GetVariable("$version");
                    return version.replace(/WIN/g,'').replace(/,/g,'.');
                }
            } catch(e) {}
        }
    }
})();

/**
 * 操作字符串的方法
 * @namespace baidu.string
 */
baidu.string = baidu.string || {};


/**
 * 对目标字符串进行html编码
 * @name baidu.string.encodeHTML
 * @function
 * @grammar baidu.string.encodeHTML(source)
 * @param {string} source 目标字符串
 * @remark
 * 编码字符有5个：&<>"'
 * @shortcut encodeHTML
 * @meta standard
 * @see baidu.string.decodeHTML
 *             
 * @returns {string} html编码后的字符串
 */
baidu.string.encodeHTML = function (source) {
    return String(source)
                .replace(/&/g,'&amp;')
                .replace(/</g,'&lt;')
                .replace(/>/g,'&gt;')
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;");
};

baidu.encodeHTML = baidu.string.encodeHTML;

/**
 * 创建flash对象的html字符串
 * @name baidu.swf.createHTML
 * @function
 * @grammar baidu.swf.createHTML(options)
 * 
 * @param {Object} 	options 					创建flash的选项参数
 * @param {string} 	options.id 					要创建的flash的标识
 * @param {string} 	options.url 				flash文件的url
 * @param {String} 	options.errorMessage 		未安装flash player或flash player版本号过低时的提示
 * @param {string} 	options.ver 				最低需要的flash player版本号
 * @param {string} 	options.width 				flash的宽度
 * @param {string} 	options.height 				flash的高度
 * @param {string} 	options.align 				flash的对齐方式，允许值：middle/left/right/top/bottom
 * @param {string} 	options.base 				设置用于解析swf文件中的所有相对路径语句的基本目录或URL
 * @param {string} 	options.bgcolor 			swf文件的背景色
 * @param {string} 	options.salign 				设置缩放的swf文件在由width和height设置定义的区域内的位置。允许值：l/r/t/b/tl/tr/bl/br
 * @param {boolean} options.menu 				是否显示右键菜单，允许值：true/false
 * @param {boolean} options.loop 				播放到最后一帧时是否重新播放，允许值： true/false
 * @param {boolean} options.play 				flash是否在浏览器加载时就开始播放。允许值：true/false
 * @param {string} 	options.quality 			设置flash播放的画质，允许值：low/medium/high/autolow/autohigh/best
 * @param {string} 	options.scale 				设置flash内容如何缩放来适应设置的宽高。允许值：showall/noborder/exactfit
 * @param {string} 	options.wmode 				设置flash的显示模式。允许值：window/opaque/transparent
 * @param {string} 	options.allowscriptaccess 	设置flash与页面的通信权限。允许值：always/never/sameDomain
 * @param {string} 	options.allownetworking 	设置swf文件中允许使用的网络API。允许值：all/internal/none
 * @param {boolean} options.allowfullscreen 	是否允许flash全屏。允许值：true/false
 * @param {boolean} options.seamlesstabbing 	允许设置执行无缝跳格，从而使用户能跳出flash应用程序。该参数只能在安装Flash7及更高版本的Windows中使用。允许值：true/false
 * @param {boolean} options.devicefont 			设置静态文本对象是否以设备字体呈现。允许值：true/false
 * @param {boolean} options.swliveconnect 		第一次加载flash时浏览器是否应启动Java。允许值：true/false
 * @param {Object} 	options.vars 				要传递给flash的参数，支持JSON或string类型。
 * 
 * @see baidu.swf.create
 * @meta standard
 * @returns {string} flash对象的html字符串
 */
baidu.swf.createHTML = function (options) {
    options = options || {};
    var version = baidu.swf.version, 
        needVersion = options['ver'] || '6.0.0', 
        vUnit1, vUnit2, i, k, len, item, tmpOpt = {},
        encodeHTML = baidu.string.encodeHTML;
    for (k in options) {
        tmpOpt[k] = options[k];
    }
    options = tmpOpt;
    if (version) {
        version = version.split('.');
        needVersion = needVersion.split('.');
        for (i = 0; i < 3; i++) {
            vUnit1 = parseInt(version[i], 10);
            vUnit2 = parseInt(needVersion[i], 10);
            if (vUnit2 < vUnit1) {
                break;
            } else if (vUnit2 > vUnit1) {
                return '';
            }
        }
    } else {
        return '';
    }
    
    var vars = options['vars'],
        objProperties = ['classid', 'codebase', 'id', 'width', 'height', 'align'];
    options['align'] = options['align'] || 'middle';
    options['classid'] = 'clsid:d27cdb6e-ae6d-11cf-96b8-444553540000';
    options['codebase'] = 'http://fpdownload.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,0,0';
    options['movie'] = options['url'] || '';
    delete options['vars'];
    delete options['url'];
    if ('string' == typeof vars) {
        options['flashvars'] = vars;
    } else {
        var fvars = [];
        for (k in vars) {
            item = vars[k];
            fvars.push(k + "=" + encodeURIComponent(item));
        }
        options['flashvars'] = fvars.join('&');
    }
    var str = ['<object '];
    for (i = 0, len = objProperties.length; i < len; i++) {
        item = objProperties[i];
        str.push(' ', item, '="', encodeHTML(options[item]), '"');
    }
    str.push('>');
    var params = {
        'wmode'             : 1,
        'scale'             : 1,
        'quality'           : 1,
        'play'              : 1,
        'loop'              : 1,
        'menu'              : 1,
        'salign'            : 1,
        'bgcolor'           : 1,
        'base'              : 1,
        'allowscriptaccess' : 1,
        'allownetworking'   : 1,
        'allowfullscreen'   : 1,
        'seamlesstabbing'   : 1,
        'devicefont'        : 1,
        'swliveconnect'     : 1,
        'flashvars'         : 1,
        'movie'             : 1
    };
    
    for (k in options) {
        item = options[k];
        k = k.toLowerCase();
        if (params[k] && (item || item === false || item === 0)) {
            str.push('<param name="' + k + '" value="' + encodeHTML(item) + '" />');
        }
    }
    options['src']  = options['movie'];
    options['name'] = options['id'];
    delete options['id'];
    delete options['movie'];
    delete options['classid'];
    delete options['codebase'];
    options['type'] = 'application/x-shockwave-flash';
    options['pluginspage'] = 'http://www.macromedia.com/go/getflashplayer';
    str.push('<embed');
    var salign;
    for (k in options) {
        item = options[k];
        if (item || item === false || item === 0) {
            if ((new RegExp("^salign\x24", "i")).test(k)) {
                salign = item;
                continue;
            }
            
            str.push(' ', k, '="', encodeHTML(item), '"');
        }
    }
    
    if (salign) {
        str.push(' salign="', encodeHTML(salign), '"');
    }
    str.push('></embed></object>');
    
    return str.join('');
};


/**
 * 在页面中创建一个flash对象
 * @name baidu.swf.create
 * @function
 * @grammar baidu.swf.create(options[, container])
 * 
 * @param {Object} 	options 					创建flash的选项参数
 * @param {string} 	options.id 					要创建的flash的标识
 * @param {string} 	options.url 				flash文件的url
 * @param {String} 	options.errorMessage 		未安装flash player或flash player版本号过低时的提示
 * @param {string} 	options.ver 				最低需要的flash player版本号
 * @param {string} 	options.width 				flash的宽度
 * @param {string} 	options.height 				flash的高度
 * @param {string} 	options.align 				flash的对齐方式，允许值：middle/left/right/top/bottom
 * @param {string} 	options.base 				设置用于解析swf文件中的所有相对路径语句的基本目录或URL
 * @param {string} 	options.bgcolor 			swf文件的背景色
 * @param {string} 	options.salign 				设置缩放的swf文件在由width和height设置定义的区域内的位置。允许值：l/r/t/b/tl/tr/bl/br
 * @param {boolean} options.menu 				是否显示右键菜单，允许值：true/false
 * @param {boolean} options.loop 				播放到最后一帧时是否重新播放，允许值： true/false
 * @param {boolean} options.play 				flash是否在浏览器加载时就开始播放。允许值：true/false
 * @param {string} 	options.quality 			设置flash播放的画质，允许值：low/medium/high/autolow/autohigh/best
 * @param {string} 	options.scale 				设置flash内容如何缩放来适应设置的宽高。允许值：showall/noborder/exactfit
 * @param {string} 	options.wmode 				设置flash的显示模式。允许值：window/opaque/transparent
 * @param {string} 	options.allowscriptaccess 	设置flash与页面的通信权限。允许值：always/never/sameDomain
 * @param {string} 	options.allownetworking 	设置swf文件中允许使用的网络API。允许值：all/internal/none
 * @param {boolean} options.allowfullscreen 	是否允许flash全屏。允许值：true/false
 * @param {boolean} options.seamlesstabbing 	允许设置执行无缝跳格，从而使用户能跳出flash应用程序。该参数只能在安装Flash7及更高版本的Windows中使用。允许值：true/false
 * @param {boolean} options.devicefont 			设置静态文本对象是否以设备字体呈现。允许值：true/false
 * @param {boolean} options.swliveconnect 		第一次加载flash时浏览器是否应启动Java。允许值：true/false
 * @param {Object} 	options.vars 				要传递给flash的参数，支持JSON或string类型。
 * 
 * @param {HTMLElement|string} [container] 		flash对象的父容器元素，不传递该参数时在当前代码位置创建flash对象。
 * @meta standard
 * @see baidu.swf.createHTML,baidu.swf.getMovie
 */
baidu.swf.create = function (options, target) {
    options = options || {};
    var html = baidu.swf.createHTML(options) 
               || options['errorMessage'] 
               || '';
                
    if (target && 'string' == typeof target) {
        target = document.getElementById(target);
    }
    baidu.dom.insertHTML( target || document.body ,'beforeEnd',html );
};
/**
 * 判断是否为ie浏览器
 * @name baidu.browser.ie
 * @field
 * @grammar baidu.browser.ie
 * @returns {Number} IE版本号
 */
baidu.browser.ie = baidu.ie = /msie (\d+\.\d+)/i.test(navigator.userAgent) ? (document.documentMode || + RegExp['\x241']) : undefined;

/**
 * 移除数组中的项
 * @name baidu.array.remove
 * @function
 * @grammar baidu.array.remove(source, match)
 * @param {Array} source 需要移除项的数组
 * @param {Any} match 要移除的项
 * @meta standard
 * @see baidu.array.removeAt
 *             
 * @returns {Array} 移除后的数组
 */
baidu.array.remove = function (source, match) {
    var len = source.length;
        
    while (len--) {
        if (len in source && source[len] === match) {
            source.splice(len, 1);
        }
    }
    return source;
};

/**
 * 判断目标参数是否Array对象
 * @name baidu.lang.isArray
 * @function
 * @grammar baidu.lang.isArray(source)
 * @param {Any} source 目标参数
 * @meta standard
 * @see baidu.lang.isString,baidu.lang.isObject,baidu.lang.isNumber,baidu.lang.isElement,baidu.lang.isBoolean,baidu.lang.isDate
 *             
 * @returns {boolean} 类型判断结果
 */
baidu.lang.isArray = function (source) {
    return '[object Array]' == Object.prototype.toString.call(source);
};



/**
 * 将一个变量转换成array
 * @name baidu.lang.toArray
 * @function
 * @grammar baidu.lang.toArray(source)
 * @param {mix} source 需要转换成array的变量
 * @version 1.3
 * @meta standard
 * @returns {array} 转换后的array
 */
baidu.lang.toArray = function (source) {
    if (source === null || source === undefined)
        return [];
    if (baidu.lang.isArray(source))
        return source;
    if (typeof source.length !== 'number' || typeof source === 'string' || baidu.lang.isFunction(source)) {
        return [source];
    }
    if (source.item) {
        var l = source.length, array = new Array(l);
        while (l--)
            array[l] = source[l];
        return array;
    }

    return [].slice.call(source);
};

/**
 * 获得flash对象的实例
 * @name baidu.swf.getMovie
 * @function
 * @grammar baidu.swf.getMovie(name)
 * @param {string} name flash对象的名称
 * @see baidu.swf.create
 * @meta standard
 * @returns {HTMLElement} flash对象的实例
 */
baidu.swf.getMovie = function (name) {
	var movie = document[name], ret;
    return baidu.browser.ie == 9 ?
    	movie && movie.length ? 
    		(ret = baidu.array.remove(baidu.lang.toArray(movie),function(item){
    			return item.tagName.toLowerCase() != "embed";
    		})).length == 1 ? ret[0] : ret
    		: movie
    	: movie || window[name];
};


baidu.flash._Base = (function(){
   
    var prefix = 'bd__flash__';

    /**
     * 创建一个随机的字符串
     * @private
     * @return {String}
     */
    function _createString(){
        return  prefix + Math.floor(Math.random() * 2147483648).toString(36);
    };
   
    /**
     * 检查flash状态
     * @private
     * @param {Object} target flash对象
     * @return {Boolean}
     */
    function _checkReady(target){
        if(typeof target !== 'undefined' && typeof target.flashInit !== 'undefined' && target.flashInit()){
            return true;
        }else{
            return false;
        }
    };

    /**
     * 调用之前进行压栈的函数
     * @private
     * @param {Array} callQueue 调用队列
     * @param {Object} target flash对象
     * @return {Null}
     */
    function _callFn(callQueue, target){
        var result = null;
        
        callQueue = callQueue.reverse();
        baidu.each(callQueue, function(item){
            result = target.call(item.fnName, item.params);
            item.callBack(result);
        });
    };

    /**
     * 为传入的匿名函数创建函数名
     * @private
     * @param {String|Function} fun 传入的匿名函数或者函数名
     * @return {String}
     */
    function _createFunName(fun){
        var name = '';

        if(baidu.lang.isFunction(fun)){
            name = _createString();
            window[name] = function(){
                fun.apply(window, arguments);
            };

            return name;
        }else if(baidu.lang.isString){
            return fun;
        }
    };

    /**
     * 绘制flash
     * @private
     * @param {Object} options 创建参数
     * @return {Object} 
     */
    function _render(options){
        if(!options.id){
            options.id = _createString();
        }
        
        var container = options.container || '';
        delete(options.container);
        
        baidu.swf.create(options, container);
        
        return baidu.swf.getMovie(options.id);
    };

    return function(options, callBack){
        var me = this,
            autoRender = (typeof options.autoRender !== 'undefined' ? options.autoRender : true),
            createOptions = options.createOptions || {},
            target = null,
            isReady = false,
            callQueue = [],
            timeHandle = null,
            callBack = callBack || [];

        /**
         * 将flash文件绘制到页面上
         * @public
         * @return {Null}
         */
        me.render = function(){
            target = _render(createOptions);
            
            if(callBack.length > 0){
                baidu.each(callBack, function(funName, index){
                    callBack[index] = _createFunName(options[funName] || new Function());
                });    
            }
            me.call('setJSFuncName', [callBack]);
        };

        /**
         * 返回flash状态
         * @return {Boolean}
         */
        me.isReady = function(){
            return isReady;
        };

        /**
         * 调用flash接口的统一入口
         * @param {String} fnName 调用的函数名
         * @param {Array} params 传入的参数组成的数组,若不许要参数，需传入空数组
         * @param {Function} [callBack] 异步调用后将返回值作为参数的调用回调函数，如无返回值，可以不传入此参数
         * @return {Null}
        */
        me.call = function(fnName, params, callBack){
            if(!fnName) return null;
            callBack = callBack || new Function();

            var result = null;
    
            if(isReady){
                result = target.call(fnName, params);
                callBack(result);
            }else{
                callQueue.push({
                    fnName: fnName,
                    params: params,
                    callBack: callBack
                });
    
                (!timeHandle) && (timeHandle = setInterval(_check, 200));
            }
        };
    
        /**
         * 为传入的匿名函数创建函数名
         * @public
         * @param {String|Function} fun 传入的匿名函数或者函数名
         * @return {String}
         */
        me.createFunName = function(fun){
            return _createFunName(fun);    
        };

        /**
         * 检查flash是否ready， 并进行调用
         * @private
         * @return {Null}
         */
        function _check(){
            if(_checkReady(target)){
                clearInterval(timeHandle);
                timeHandle = null;
                _call();

                isReady = true;
            }               
        };

        /**
         * 调用之前进行压栈的函数
         * @private
         * @return {Null}
         */
        function _call(){
            _callFn(callQueue, target);
            callQueue = [];
        }

        autoRender && me.render(); 
    };
})();



/**
 * 创建flash based imageUploader
 * @class
 * @grammar baidu.flash.imageUploader(options)
 * @param {Object} createOptions 创建flash时需要的参数，请参照baidu.swf.create文档
 * @config {Object} vars 创建imageUploader时所需要的参数
 * @config {Number} vars.gridWidth 每一个预览图片所占的宽度，应该为flash寛的整除
 * @config {Number} vars.gridHeight 每一个预览图片所占的高度，应该为flash高的整除
 * @config {Number} vars.picWidth 单张预览图片的宽度
 * @config {Number} vars.picHeight 单张预览图片的高度
 * @config {String} vars.uploadDataFieldName POST请求中图片数据的key,默认值'picdata'
 * @config {String} vars.picDescFieldName POST请求中图片描述的key,默认值'picDesc'
 * @config {Number} vars.maxSize 文件的最大体积,单位'MB'
 * @config {Number} vars.compressSize 上传前如果图片体积超过该值，会先压缩
 * @config {Number} vars.maxNum:32 最大上传多少个文件
 * @config {Number} vars.compressLength 能接受的最大边长，超过该值会等比压缩
 * @config {String} vars.url 上传的url地址
 * @config {Number} vars.mode mode == 0时，是使用滚动条，mode == 1时，拉伸flash, 默认值为0
 * @see baidu.swf.createHTML
 * @param {String} backgroundUrl 背景图片路径
 * @param {String} listBacgroundkUrl 布局控件背景
 * @param {String} buttonUrl 按钮图片不背景
 * @param {String|Function} selectFileCallback 选择文件的回调
 * @param {String|Function} exceedFileCallback文件超出限制的最大体积时的回调
 * @param {String|Function} deleteFileCallback 删除文件的回调
 * @param {String|Function} startUploadCallback 开始上传某个文件时的回调
 * @param {String|Function} uploadCompleteCallback 某个文件上传完成的回调
 * @param {String|Function} uploadErrorCallback 某个文件上传失败的回调
 * @param {String|Function} allCompleteCallback 全部上传完成时的回调
 * @param {String|Function} changeFlashHeight 改变Flash的高度，mode==1的时候才有用
 */ 
baidu.flash.imageUploader = baidu.flash.imageUploader || function(options){
   
    var me = this,
        options = options || {},
        _flash = new baidu.flash._Base(options, [
            'selectFileCallback', 
            'exceedFileCallback', 
            'deleteFileCallback', 
            'startUploadCallback',
            'uploadCompleteCallback',
            'uploadErrorCallback',
            'allCompleteCallback',
            'changeFlashHeight'
        ]);
    /**
     * 开始或回复上传图片
     * @public
     * @return {Null}
     */
    me.upload = function(){
        _flash.call('upload');
    };

    /**
     * 暂停上传图片
     * @public
     * @return {Null}
     */
    me.pause = function(){
        _flash.call('pause');
    };
    me.addCustomizedParams = function(index,obj){
        _flash.call('addCustomizedParams',[index,obj]);
    }
};

/**
 * 操作原生对象的方法
 * @namespace baidu.object
 */
baidu.object = baidu.object || {};


/**
 * 将源对象的所有属性拷贝到目标对象中
 * @author erik
 * @name baidu.object.extend
 * @function
 * @grammar baidu.object.extend(target, source)
 * @param {Object} target 目标对象
 * @param {Object} source 源对象
 * @see baidu.array.merge
 * @remark
 * 
1.目标对象中，与源对象key相同的成员将会被覆盖。<br>
2.源对象的prototype成员不会拷贝。
		
 * @shortcut extend
 * @meta standard
 *             
 * @returns {Object} 目标对象
 */
baidu.extend =
baidu.object.extend = function (target, source) {
    for (var p in source) {
        if (source.hasOwnProperty(p)) {
            target[p] = source[p];
        }
    }
    
    return target;
};





/**
 * 创建flash based fileUploader
 * @class
 * @grammar baidu.flash.fileUploader(options)
 * @param {Object} options
 * @config {Object} createOptions 创建flash时需要的参数，请参照baidu.swf.create文档
 * @config {String} createOptions.width
 * @config {String} createOptions.height
 * @config {Number} maxNum 最大可选文件数
 * @config {Function|String} selectFile
 * @config {Function|String} exceedMaxSize
 * @config {Function|String} deleteFile
 * @config {Function|String} uploadStart
 * @config {Function|String} uploadComplete
 * @config {Function|String} uploadError
 * @config {Function|String} uploadProgress
 */
baidu.flash.fileUploader = baidu.flash.fileUploader || function(options){
    var me = this,
        options = options || {};
    
    options.createOptions = baidu.extend({
        wmod: 'transparent'
    },options.createOptions || {});
    
    var _flash = new baidu.flash._Base(options, [
        'selectFile',
        'exceedMaxSize',
        'deleteFile',
        'uploadStart',
        'uploadComplete',
        'uploadError', 
        'uploadProgress'
    ]);

    _flash.call('setMaxNum', options.maxNum ? [options.maxNum] : [1]);

    /**
     * 设置当鼠标移动到flash上时，是否变成手型
     * @public
     * @param {Boolean} isCursor
     * @return {Null}
     */
    me.setHandCursor = function(isCursor){
        _flash.call('setHandCursor', [isCursor || false]);
    };

    /**
     * 设置鼠标相应函数名
     * @param {String|Function} fun
     */
    me.setMSFunName = function(fun){
        _flash.call('setMSFunName',[_flash.createFunName(fun)]);
    }; 

    /**
     * 执行上传操作
     * @param {String} url 上传的url
     * @param {String} fieldName 上传的表单字段名
     * @param {Object} postData 键值对，上传的POST数据
     * @param {Number|Array|null|-1} [index]上传的文件序列
     *                            Int值上传该文件
     *                            Array一次串行上传该序列文件
     *                            -1/null上传所有文件
     * @return {Null}
     */
    me.upload = function(url, fieldName, postData, index){

        if(typeof url !== 'string' || typeof fieldName !== 'string') return null;
        if(typeof index === 'undefined') index = -1;

        _flash.call('upload', [url, fieldName, postData, index]);
    };

    /**
     * 取消上传操作
     * @public
     * @param {Number|-1} index
     */
    me.cancel = function(index){
        if(typeof index === 'undefined') index = -1;
        _flash.call('cancel', [index]);
    };

    /**
     * 删除文件
     * @public
     * @param {Number|Array} [index] 要删除的index，不传则全部删除
     * @param {Function} callBack
     * */
    me.deleteFile = function(index, callBack){

        var callBackAll = function(list){
                callBack && callBack(list);
            };

        if(typeof index === 'undefined'){
            _flash.call('deleteFilesAll', [], callBackAll);
            return;
        };
        
        if(typeof index === 'Number') index = [index];
        index.sort(function(a,b){
            return b-a;
        });
        baidu.each(index, function(item){
            _flash.call('deleteFileBy', item, callBackAll);
        });
    };

    /**
     * 添加文件类型，支持macType
     * @public
     * @param {Object|Array[Object]} type {description:String, extention:String}
     * @return {Null};
     */
    me.addFileType = function(type){
        var type = type || [[]];
        
        if(type instanceof Array) type = [type];
        else type = [[type]];
        _flash.call('addFileTypes', type);
    };
    
    /**
     * 设置文件类型，支持macType
     * @public
     * @param {Object|Array[Object]} type {description:String, extention:String}
     * @return {Null};
     */
    me.setFileType = function(type){
        var type = type || [[]];
        
        if(type instanceof Array) type = [type];
        else type = [[type]];
        _flash.call('setFileTypes', type);
    };

    /**
     * 设置可选文件的数量限制
     * @public
     * @param {Number} num
     * @return {Null}
     */
    me.setMaxNum = function(num){
        _flash.call('setMaxNum', [num]);
    };

    /**
     * 设置可选文件大小限制，以兆M为单位
     * @public
     * @param {Number} num,0为无限制
     * @return {Null}
     */
    me.setMaxSize = function(num){
        _flash.call('setMaxSize', [num]);
    };

    /**
     * @public
     */
    me.getFileAll = function(callBack){
        _flash.call('getFileAll', [], callBack);
    };

    /**
     * @public
     * @param {Number} index
     * @param {Function} [callBack]
     */
    me.getFileByIndex = function(index, callBack){
        _flash.call('getFileByIndex', [], callBack);
    };

    /**
     * @public
     * @param {Number} index
     * @param {function} [callBack]
     */
    me.getStatusByIndex = function(index, callBack){
        _flash.call('getStatusByIndex', [], callBack);
    };
};

/**
 * 使用动态script标签请求服务器资源，包括由服务器端的回调和浏览器端的回调
 * @namespace baidu.sio
 */
baidu.sio = baidu.sio || {};

/**
 * 
 * @param {HTMLElement} src script节点
 * @param {String} url script节点的地址
 * @param {String} [charset] 编码
 */
baidu.sio._createScriptTag = function(scr, url, charset){
    scr.setAttribute('type', 'text/javascript');
    charset && scr.setAttribute('charset', charset);
    scr.setAttribute('src', url);
    document.getElementsByTagName('head')[0].appendChild(scr);
};

/**
 * 删除script的属性，再删除script标签，以解决修复内存泄漏的问题
 * 
 * @param {HTMLElement} src script节点
 */
baidu.sio._removeScriptTag = function(scr){
    if (scr.clearAttributes) {
        scr.clearAttributes();
    } else {
        for (var attr in scr) {
            if (scr.hasOwnProperty(attr)) {
                delete scr[attr];
            }
        }
    }
    if(scr && scr.parentNode){
        scr.parentNode.removeChild(scr);
    }
    scr = null;
};


/**
 * 通过script标签加载数据，加载完成由浏览器端触发回调
 * @name baidu.sio.callByBrowser
 * @function
 * @grammar baidu.sio.callByBrowser(url, opt_callback, opt_options)
 * @param {string} url 加载数据的url
 * @param {Function|string} opt_callback 数据加载结束时调用的函数或函数名
 * @param {Object} opt_options 其他可选项
 * @config {String} [charset] script的字符集
 * @config {Integer} [timeOut] 超时时间，超过这个时间将不再响应本请求，并触发onfailure函数
 * @config {Function} [onfailure] timeOut设定后才生效，到达超时时间时触发本函数
 * @remark
 * 1、与callByServer不同，callback参数只支持Function类型，不支持string。
 * 2、如果请求了一个不存在的页面，callback函数在IE/opera下也会被调用，因此使用者需要在onsuccess函数中判断数据是否正确加载。
 * @meta standard
 * @see baidu.sio.callByServer
 */
baidu.sio.callByBrowser = function (url, opt_callback, opt_options) {
    var scr = document.createElement("SCRIPT"),
        scriptLoaded = 0,
        options = opt_options || {},
        charset = options['charset'],
        callback = opt_callback || function(){},
        timeOut = options['timeOut'] || 0,
        timer;
    scr.onload = scr.onreadystatechange = function () {
        if (scriptLoaded) {
            return;
        }
        
        var readyState = scr.readyState;
        if ('undefined' == typeof readyState
            || readyState == "loaded"
            || readyState == "complete") {
            scriptLoaded = 1;
            try {
                callback();
                clearTimeout(timer);
            } finally {
                scr.onload = scr.onreadystatechange = null;
                baidu.sio._removeScriptTag(scr);
            }
        }
    };

    if( timeOut ){
        timer = setTimeout(function(){
            scr.onload = scr.onreadystatechange = null;
            baidu.sio._removeScriptTag(scr);
            options.onfailure && options.onfailure();
        }, timeOut);
    }
    
    baidu.sio._createScriptTag(scr, url, charset);
};

/**
 * 通过script标签加载数据，加载完成由服务器端触发回调
 * @name baidu.sio.callByServer
 * @function
 * @grammar baidu.sio.callByServer(url, callback[, opt_options])
 * @param {string} url 加载数据的url.
 * @param {Function|string} callback 服务器端调用的函数或函数名。如果没有指定本参数，将在URL中寻找options['queryField']做为callback的方法名.
 * @param {Object} opt_options 加载数据时的选项.
 * @config {string} [charset] script的字符集
 * @config {string} [queryField] 服务器端callback请求字段名，默认为callback
 * @config {Integer} [timeOut] 超时时间(单位：ms)，超过这个时间将不再响应本请求，并触发onfailure函数
 * @config {Function} [onfailure] timeOut设定后才生效，到达超时时间时触发本函数
 * @remark
 * 如果url中已经包含key为“options['queryField']”的query项，将会被替换成callback中参数传递或自动生成的函数名。
 * @meta standard
 * @see baidu.sio.callByBrowser
 */
baidu.sio.callByServer = /**@function*/function(url, callback, opt_options) {
    var scr = document.createElement('SCRIPT'),
        prefix = 'bd__cbs__',
        callbackName,
        callbackImpl,
        options = opt_options || {},
        charset = options['charset'],
        queryField = options['queryField'] || 'callback',
        timeOut = options['timeOut'] || 0,
        timer,
        reg = new RegExp('(\\?|&)' + queryField + '=([^&]*)'),
        matches;

    if (baidu.lang.isFunction(callback)) {
        callbackName = prefix + Math.floor(Math.random() * 2147483648).toString(36);
        window[callbackName] = getCallBack(0);
    } else if(baidu.lang.isString(callback)){
        callbackName = callback;
    } else {
        if (matches = reg.exec(url)) {
            callbackName = matches[2];
        }
    }

    if( timeOut ){
        timer = setTimeout(getCallBack(1), timeOut);
    }
    url = url.replace(reg, '\x241' + queryField + '=' + callbackName);
    
    if (url.search(reg) < 0) {
        url += (url.indexOf('?') < 0 ? '?' : '&') + queryField + '=' + callbackName;
    }
    baidu.sio._createScriptTag(scr, url, charset);

    /*
     * 返回一个函数，用于立即（挂在window上）或者超时（挂在setTimeout中）时执行
     */
    function getCallBack(onTimeOut){
        /*global callbackName, callback, scr, options;*/
        return function(){
            try {
                if( onTimeOut ){
                    options.onfailure && options.onfailure();
                }else{
                    callback.apply(window, arguments);
                    clearTimeout(timer);
                }
                window[callbackName] = null;
                delete window[callbackName];
            } catch (exception) {
            } finally {
                baidu.sio._removeScriptTag(scr);
            }
        }
    }
};

/**
 * 通过请求一个图片的方式令服务器存储一条日志
 * @function
 * @grammar baidu.sio.log(url)
 * @param {string} url 要发送的地址.
 * @author: int08h,leeight
 */
baidu.sio.log = function(url) {
  var img = new Image(),
      key = 'tangram_sio_log_' + Math.floor(Math.random() *
            2147483648).toString(36);
  window[key] = img;

  img.onload = img.onerror = img.onabort = function() {
    img.onload = img.onerror = img.onabort = null;

    window[key] = null;
    img = null;
  };
  img.src = url;
};



/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/json.js
 * author: erik
 * version: 1.1.0
 * date: 2009/12/02
 */


/**
 * 操作json对象的方法
 * @namespace baidu.json
 */
baidu.json = baidu.json || {};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/json/parse.js
 * author: erik, berg
 * version: 1.2
 * date: 2009/11/23
 */



/**
 * 将字符串解析成json对象。注：不会自动祛除空格
 * @name baidu.json.parse
 * @function
 * @grammar baidu.json.parse(data)
 * @param {string} source 需要解析的字符串
 * @remark
 * 该方法的实现与ecma-262第五版中规定的JSON.parse不同，暂时只支持传入一个参数。后续会进行功能丰富。
 * @meta standard
 * @see baidu.json.stringify,baidu.json.decode
 *             
 * @returns {JSON} 解析结果json对象
 */
baidu.json.parse = function (data) {
    //2010/12/09：更新至不使用原生parse，不检测用户输入是否正确
    return (new Function("return (" + data + ")"))();
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/json/decode.js
 * author: erik, cat
 * version: 1.3.4
 * date: 2010/12/23
 */



/**
 * 将字符串解析成json对象，为过时接口，今后会被baidu.json.parse代替
 * @name baidu.json.decode
 * @function
 * @grammar baidu.json.decode(source)
 * @param {string} source 需要解析的字符串
 * @meta out
 * @see baidu.json.encode,baidu.json.parse
 *             
 * @returns {JSON} 解析结果json对象
 */
baidu.json.decode = baidu.json.parse;
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/json/stringify.js
 * author: erik
 * version: 1.1.0
 * date: 2010/01/11
 */



/**
 * 将json对象序列化
 * @name baidu.json.stringify
 * @function
 * @grammar baidu.json.stringify(value)
 * @param {JSON} value 需要序列化的json对象
 * @remark
 * 该方法的实现与ecma-262第五版中规定的JSON.stringify不同，暂时只支持传入一个参数。后续会进行功能丰富。
 * @meta standard
 * @see baidu.json.parse,baidu.json.encode
 *             
 * @returns {string} 序列化后的字符串
 */
baidu.json.stringify = (function () {
    /**
     * 字符串处理时需要转义的字符表
     * @private
     */
    var escapeMap = {
        "\b": '\\b',
        "\t": '\\t',
        "\n": '\\n',
        "\f": '\\f',
        "\r": '\\r',
        '"' : '\\"',
        "\\": '\\\\'
    };
    
    /**
     * 字符串序列化
     * @private
     */
    function encodeString(source) {
        if (/["\\\x00-\x1f]/.test(source)) {
            source = source.replace(
                /["\\\x00-\x1f]/g, 
                function (match) {
                    var c = escapeMap[match];
                    if (c) {
                        return c;
                    }
                    c = match.charCodeAt();
                    return "\\u00" 
                            + Math.floor(c / 16).toString(16) 
                            + (c % 16).toString(16);
                });
        }
        return '"' + source + '"';
    }
    
    /**
     * 数组序列化
     * @private
     */
    function encodeArray(source) {
        var result = ["["], 
            l = source.length,
            preComma, i, item;
            
        for (i = 0; i < l; i++) {
            item = source[i];
            
            switch (typeof item) {
            case "undefined":
            case "function":
            case "unknown":
                break;
            default:
                if(preComma) {
                    result.push(',');
                }
                result.push(baidu.json.stringify(item));
                preComma = 1;
            }
        }
        result.push("]");
        return result.join("");
    }
    
    /**
     * 处理日期序列化时的补零
     * @private
     */
    function pad(source) {
        return source < 10 ? '0' + source : source;
    }
    
    /**
     * 日期序列化
     * @private
     */
    function encodeDate(source){
        return '"' + source.getFullYear() + "-" 
                + pad(source.getMonth() + 1) + "-" 
                + pad(source.getDate()) + "T" 
                + pad(source.getHours()) + ":" 
                + pad(source.getMinutes()) + ":" 
                + pad(source.getSeconds()) + '"';
    }
    
    return function (value) {
        switch (typeof value) {
        case 'undefined':
            return 'undefined';
            
        case 'number':
            return isFinite(value) ? String(value) : "null";
            
        case 'string':
            return encodeString(value);
            
        case 'boolean':
            return String(value);
            
        default:
            if (value === null) {
                return 'null';
            } else if (value instanceof Array) {
                return encodeArray(value);
            } else if (value instanceof Date) {
                return encodeDate(value);
            } else {
                var result = ['{'],
                    encode = baidu.json.stringify,
                    preComma,
                    item;
                    
                for (var key in value) {
                    if (Object.prototype.hasOwnProperty.call(value, key)) {
                        item = value[key];
                        switch (typeof item) {
                        case 'undefined':
                        case 'unknown':
                        case 'function':
                            break;
                        default:
                            if (preComma) {
                                result.push(',');
                            }
                            preComma = 1;
                            result.push(encode(key) + ':' + encode(item));
                        }
                    }
                }
                result.push('}');
                return result.join('');
            }
        }
    };
})();
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/json/encode.js
 * author: erik, cat
 * version: 1.3.4
 * date: 2010/12/23
 */



/**
 * 将json对象序列化，为过时接口，今后会被baidu.json.stringify代替
 * @name baidu.json.encode
 * @function
 * @grammar baidu.json.encode(value)
 * @param {JSON} value 需要序列化的json对象
 * @meta out
 * @see baidu.json.decode,baidu.json.stringify
 *             
 * @returns {string} 序列化后的字符串
 */
baidu.json.encode = baidu.json.stringify;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvZGlhbG9ncy93b3JkaW1hZ2UvdGFuZ3JhbS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgKGMpIDIwMDksIEJhaWR1IEluYy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vIFxuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEJTRCBMaWNlbnNlXG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vIFxuLy8gICAgICBodHRwOi8vIHRhbmdyYW0uYmFpZHUuY29tL2xpY2Vuc2UuaHRtbFxuLy8gXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuIC8qKlxuICogQG5hbWVzcGFjZSBUIFRhbmdyYW3kuIPlt6fmnb9cbiAqIEBuYW1lIFRcbiAqIEB2ZXJzaW9uIDEuNi4wXG4qL1xuXG4vKipcbiAqIOWjsOaYjmJhaWR15YyFXG4gKiBAYXV0aG9yOiBhbGxzdGFyLCBlcmlrLCBtZWl6eiwgYmVyZ1xuICovXG52YXIgVCxcbiAgICBiYWlkdSA9IFQgPSBiYWlkdSB8fCB7dmVyc2lvbjogXCIxLjUuMFwifTtcbmJhaWR1Lmd1aWQgPSBcIiRCQUlEVSRcIjtcbmJhaWR1LiQkID0gd2luZG93W2JhaWR1Lmd1aWRdID0gd2luZG93W2JhaWR1Lmd1aWRdIHx8IHtnbG9iYWw6e319O1xuXG4vKipcbiAqIOS9v+eUqGZsYXNo6LWE5rqQ5bCB6KOF55qE5LiA5Lqb5Yqf6IO9XG4gKiBAbmFtZXNwYWNlIGJhaWR1LmZsYXNoXG4gKi9cbmJhaWR1LmZsYXNoID0gYmFpZHUuZmxhc2ggfHwge307XG5cbi8qKlxuICog5pON5L2cZG9t55qE5pa55rOVXG4gKiBAbmFtZXNwYWNlIGJhaWR1LmRvbSBcbiAqL1xuYmFpZHUuZG9tID0gYmFpZHUuZG9tIHx8IHt9O1xuXG5cbi8qKlxuICog5LuO5paH5qGj5Lit6I635Y+W5oyH5a6a55qERE9N5YWD57SgXG4gKiBAbmFtZSBiYWlkdS5kb20uZ1xuICogQGZ1bmN0aW9uXG4gKiBAZ3JhbW1hciBiYWlkdS5kb20uZyhpZClcbiAqIEBwYXJhbSB7c3RyaW5nfEhUTUxFbGVtZW50fSBpZCDlhYPntKDnmoRpZOaIlkRPTeWFg+e0oC5cbiAqIEBzaG9ydGN1dCBnLFQuR1xuICogQG1ldGEgc3RhbmRhcmRcbiAqIEBzZWUgYmFpZHUuZG9tLnFcbiAqXG4gKiBAcmV0dXJuIHtIVE1MRWxlbWVudHxudWxsfSDojrflj5bnmoTlhYPntKDvvIzmn6Xmib7kuI3liLDml7bov5Tlm55udWxsLOWmguaenOWPguaVsOS4jeWQiOazle+8jOebtOaOpei/lOWbnuWPguaVsC5cbiAqL1xuYmFpZHUuZG9tLmcgPSBmdW5jdGlvbihpZCkge1xuICAgIGlmICghaWQpIHJldHVybiBudWxsO1xuICAgIGlmICgnc3RyaW5nJyA9PSB0eXBlb2YgaWQgfHwgaWQgaW5zdGFuY2VvZiBTdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcbiAgICB9IGVsc2UgaWYgKGlkLm5vZGVOYW1lICYmIChpZC5ub2RlVHlwZSA9PSAxIHx8IGlkLm5vZGVUeXBlID09IDkpKSB7XG4gICAgICAgIHJldHVybiBpZDtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59O1xuYmFpZHUuZyA9IGJhaWR1LkcgPSBiYWlkdS5kb20uZztcblxuXG4vKipcbiAqIOaTjeS9nOaVsOe7hOeahOaWueazlVxuICogQG5hbWVzcGFjZSBiYWlkdS5hcnJheVxuICovXG5cbmJhaWR1LmFycmF5ID0gYmFpZHUuYXJyYXkgfHwge307XG5cblxuLyoqXG4gKiDpgY3ljobmlbDnu4TkuK3miYDmnInlhYPntKBcbiAqIEBuYW1lIGJhaWR1LmFycmF5LmVhY2hcbiAqIEBmdW5jdGlvblxuICogQGdyYW1tYXIgYmFpZHUuYXJyYXkuZWFjaChzb3VyY2UsIGl0ZXJhdG9yWywgdGhpc09iamVjdF0pXG4gKiBAcGFyYW0ge0FycmF5fSBzb3VyY2Ug6ZyA6KaB6YGN5Y6G55qE5pWw57uEXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRvciDlr7nmr4/kuKrmlbDnu4TlhYPntKDov5vooYzosIPnlKjnmoTlh73mlbDvvIzor6Xlh73mlbDmnInkuKTkuKrlj4LmlbDvvIznrKzkuIDkuKrkuLrmlbDnu4TlhYPntKDvvIznrKzkuozkuKrkuLrmlbDnu4TntKLlvJXlgLzvvIxmdW5jdGlvbiAoaXRlbSwgaW5kZXgp44CCXG4gKiBAcGFyYW0ge09iamVjdH0gW3RoaXNPYmplY3RdIOWHveaVsOiwg+eUqOaXtueahHRoaXPmjIfpkojvvIzlpoLmnpzmsqHmnInmraTlj4LmlbDvvIzpu5jorqTmmK/lvZPliY3pgY3ljobnmoTmlbDnu4RcbiAqIEByZW1hcmtcbiAqIGVhY2jmlrnms5XkuI3mlK/mjIHlr7lPYmplY3TnmoTpgY3ljoYs5a+5T2JqZWN055qE6YGN5Y6G5L2/55SoYmFpZHUub2JqZWN0LmVhY2gg44CCXG4gKiBAc2hvcnRjdXQgZWFjaFxuICogQG1ldGEgc3RhbmRhcmRcbiAqICAgICAgICAgICAgIFxuICogQHJldHVybnMge0FycmF5fSDpgY3ljobnmoTmlbDnu4RcbiAqL1xuIFxuYmFpZHUuZWFjaCA9IGJhaWR1LmFycmF5LmZvckVhY2ggPSBiYWlkdS5hcnJheS5lYWNoID0gZnVuY3Rpb24gKHNvdXJjZSwgaXRlcmF0b3IsIHRoaXNPYmplY3QpIHtcbiAgICB2YXIgcmV0dXJuVmFsdWUsIGl0ZW0sIGksIGxlbiA9IHNvdXJjZS5sZW5ndGg7XG4gICAgXG4gICAgaWYgKCdmdW5jdGlvbicgPT0gdHlwZW9mIGl0ZXJhdG9yKSB7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgaXRlbSA9IHNvdXJjZVtpXTtcbiAgICAgICAgICAgIHJldHVyblZhbHVlID0gaXRlcmF0b3IuY2FsbCh0aGlzT2JqZWN0IHx8IHNvdXJjZSwgaXRlbSwgaSk7XG4gICAgXG4gICAgICAgICAgICBpZiAocmV0dXJuVmFsdWUgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHNvdXJjZTtcbn07XG5cbi8qKlxuICog5a+56K+t6KiA5bGC6Z2i55qE5bCB6KOF77yM5YyF5ous57G75Z6L5Yik5pat44CB5qih5Z2X5omp5bGV44CB57un5om/5Z+657G75Lul5Y+K5a+56LGh6Ieq5a6a5LmJ5LqL5Lu255qE5pSv5oyB44CCXG4gKiBAbmFtZXNwYWNlIGJhaWR1LmxhbmdcbiAqL1xuYmFpZHUubGFuZyA9IGJhaWR1LmxhbmcgfHwge307XG5cblxuLyoqXG4gKiDliKTmlq3nm67moIflj4LmlbDmmK/lkKbkuLpmdW5jdGlvbuaIlkZ1bmN0aW9u5a6e5L6LXG4gKiBAbmFtZSBiYWlkdS5sYW5nLmlzRnVuY3Rpb25cbiAqIEBmdW5jdGlvblxuICogQGdyYW1tYXIgYmFpZHUubGFuZy5pc0Z1bmN0aW9uKHNvdXJjZSlcbiAqIEBwYXJhbSB7QW55fSBzb3VyY2Ug55uu5qCH5Y+C5pWwXG4gKiBAdmVyc2lvbiAxLjJcbiAqIEBzZWUgYmFpZHUubGFuZy5pc1N0cmluZyxiYWlkdS5sYW5nLmlzT2JqZWN0LGJhaWR1LmxhbmcuaXNOdW1iZXIsYmFpZHUubGFuZy5pc0FycmF5LGJhaWR1LmxhbmcuaXNFbGVtZW50LGJhaWR1LmxhbmcuaXNCb29sZWFuLGJhaWR1LmxhbmcuaXNEYXRlXG4gKiBAbWV0YSBzdGFuZGFyZFxuICogQHJldHVybnMge2Jvb2xlYW59IOexu+Wei+WIpOaWree7k+aenFxuICovXG5iYWlkdS5sYW5nLmlzRnVuY3Rpb24gPSBmdW5jdGlvbiAoc291cmNlKSB7XG4gICAgcmV0dXJuICdbb2JqZWN0IEZ1bmN0aW9uXScgPT0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHNvdXJjZSk7XG59O1xuXG4vKipcbiAqIOWIpOaWreebruagh+WPguaVsOaYr+WQpnN0cmluZ+exu+Wei+aIllN0cmluZ+WvueixoVxuICogQG5hbWUgYmFpZHUubGFuZy5pc1N0cmluZ1xuICogQGZ1bmN0aW9uXG4gKiBAZ3JhbW1hciBiYWlkdS5sYW5nLmlzU3RyaW5nKHNvdXJjZSlcbiAqIEBwYXJhbSB7QW55fSBzb3VyY2Ug55uu5qCH5Y+C5pWwXG4gKiBAc2hvcnRjdXQgaXNTdHJpbmdcbiAqIEBtZXRhIHN0YW5kYXJkXG4gKiBAc2VlIGJhaWR1LmxhbmcuaXNPYmplY3QsYmFpZHUubGFuZy5pc051bWJlcixiYWlkdS5sYW5nLmlzQXJyYXksYmFpZHUubGFuZy5pc0VsZW1lbnQsYmFpZHUubGFuZy5pc0Jvb2xlYW4sYmFpZHUubGFuZy5pc0RhdGVcbiAqICAgICAgICAgICAgIFxuICogQHJldHVybnMge2Jvb2xlYW59IOexu+Wei+WIpOaWree7k+aenFxuICovXG5iYWlkdS5sYW5nLmlzU3RyaW5nID0gZnVuY3Rpb24gKHNvdXJjZSkge1xuICAgIHJldHVybiAnW29iamVjdCBTdHJpbmddJyA9PSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoc291cmNlKTtcbn07XG5iYWlkdS5pc1N0cmluZyA9IGJhaWR1LmxhbmcuaXNTdHJpbmc7XG5cblxuLyoqXG4gKiDliKTmlq3mtY/op4jlmajnsbvlnovlkoznibnmgKfnmoTlsZ7mgKdcbiAqIEBuYW1lc3BhY2UgYmFpZHUuYnJvd3NlclxuICovXG5iYWlkdS5icm93c2VyID0gYmFpZHUuYnJvd3NlciB8fCB7fTtcblxuXG4vKipcbiAqIOWIpOaWreaYr+WQpuS4um9wZXJh5rWP6KeI5ZmoXG4gKiBAcHJvcGVydHkgb3BlcmEgb3BlcmHniYjmnKzlj7dcbiAqIEBncmFtbWFyIGJhaWR1LmJyb3dzZXIub3BlcmFcbiAqIEBtZXRhIHN0YW5kYXJkXG4gKiBAc2VlIGJhaWR1LmJyb3dzZXIuaWUsYmFpZHUuYnJvd3Nlci5maXJlZm94LGJhaWR1LmJyb3dzZXIuc2FmYXJpLGJhaWR1LmJyb3dzZXIuY2hyb21lXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBvcGVyYeeJiOacrOWPt1xuICovXG5cbi8qKlxuICogb3BlcmEg5LuOMTDlvIDlp4vkuI3mmK/nlKhvcGVyYeWQjumdoueahOWtl+espuS4sui/m+ihjOeJiOacrOeahOWIpOaWrVxuICog5ZyoQnJvd3NlciBpZGVudGlmaWNhdGlvbuacgOWQjua3u+WKoFZlcnNpb24gKyDmlbDlrZfov5vooYzniYjmnKzmoIfor4ZcbiAqIG9wZXJh5ZCO6Z2i55qE5pWw5a2X5L+d5oyB5ZyoOS44MOS4jeWPmFxuICovXG5iYWlkdS5icm93c2VyLm9wZXJhID0gL29wZXJhKFxcL3wgKShcXGQrKFxcLlxcZCspPykoLis/KHZlcnNpb25cXC8oXFxkKyhcXC5cXGQrKT8pKSk/L2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSA/ICArICggUmVnRXhwW1wiXFx4MjQ2XCJdIHx8IFJlZ0V4cFtcIlxceDI0MlwiXSApIDogdW5kZWZpbmVkO1xuXG5cbi8qKlxuICog5Zyo55uu5qCH5YWD57Sg55qE5oyH5a6a5L2N572u5o+S5YWlSFRNTOS7o+eggVxuICogQG5hbWUgYmFpZHUuZG9tLmluc2VydEhUTUxcbiAqIEBmdW5jdGlvblxuICogQGdyYW1tYXIgYmFpZHUuZG9tLmluc2VydEhUTUwoZWxlbWVudCwgcG9zaXRpb24sIGh0bWwpXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fHN0cmluZ30gZWxlbWVudCDnm67moIflhYPntKDmiJbnm67moIflhYPntKDnmoRpZFxuICogQHBhcmFtIHtzdHJpbmd9IHBvc2l0aW9uIOaPkuWFpWh0bWznmoTkvY3nva7kv6Hmga/vvIzlj5blgLzkuLpiZWZvcmVCZWdpbixhZnRlckJlZ2luLGJlZm9yZUVuZCxhZnRlckVuZFxuICogQHBhcmFtIHtzdHJpbmd9IGh0bWwg6KaB5o+S5YWl55qEaHRtbFxuICogQHJlbWFya1xuICogXG4gKiDlr7nkuo5wb3NpdGlvbuWPguaVsO+8jOWkp+Wwj+WGmeS4jeaVj+aEnzxicj5cbiAqIOWPguaVsOeahOaEj+aAne+8mmJlZm9yZUJlZ2luJmx0O3NwYW4mZ3Q7YWZ0ZXJCZWdpbiAgIHRoaXMgaXMgc3BhbiEgYmVmb3JlRW5kJmx0Oy9zcGFuJmd0OyBhZnRlckVuZCA8YnIgLz5cbiAqIOatpOWklu+8jOWmguaenOS9v+eUqOacrOWHveaVsOaPkuWFpeW4puaciXNjcmlwdOagh+etvueahEhUTUzlrZfnrKbkuLLvvIxzY3JpcHTmoIfnrb7lr7nlupTnmoTohJrmnKzlsIbkuI3kvJrooqvmiafooYzjgIJcbiAqIFxuICogQHNob3J0Y3V0IGluc2VydEhUTUxcbiAqIEBtZXRhIHN0YW5kYXJkXG4gKiAgICAgICAgICAgICBcbiAqIEByZXR1cm5zIHtIVE1MRWxlbWVudH0g55uu5qCH5YWD57SgXG4gKi9cbmJhaWR1LmRvbS5pbnNlcnRIVE1MID0gZnVuY3Rpb24gKGVsZW1lbnQsIHBvc2l0aW9uLCBodG1sKSB7XG4gICAgZWxlbWVudCA9IGJhaWR1LmRvbS5nKGVsZW1lbnQpO1xuICAgIHZhciByYW5nZSxiZWdpbjtcbiAgICBpZiAoZWxlbWVudC5pbnNlcnRBZGphY2VudEhUTUwgJiYgIWJhaWR1LmJyb3dzZXIub3BlcmEpIHtcbiAgICAgICAgZWxlbWVudC5pbnNlcnRBZGphY2VudEhUTUwocG9zaXRpb24sIGh0bWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJhbmdlID0gZWxlbWVudC5vd25lckRvY3VtZW50LmNyZWF0ZVJhbmdlKCk7XG4gICAgICAgIHBvc2l0aW9uID0gcG9zaXRpb24udG9VcHBlckNhc2UoKTtcbiAgICAgICAgaWYgKHBvc2l0aW9uID09ICdBRlRFUkJFR0lOJyB8fCBwb3NpdGlvbiA9PSAnQkVGT1JFRU5EJykge1xuICAgICAgICAgICAgcmFuZ2Uuc2VsZWN0Tm9kZUNvbnRlbnRzKGVsZW1lbnQpO1xuICAgICAgICAgICAgcmFuZ2UuY29sbGFwc2UocG9zaXRpb24gPT0gJ0FGVEVSQkVHSU4nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGJlZ2luID0gcG9zaXRpb24gPT0gJ0JFRk9SRUJFR0lOJztcbiAgICAgICAgICAgIHJhbmdlW2JlZ2luID8gJ3NldFN0YXJ0QmVmb3JlJyA6ICdzZXRFbmRBZnRlciddKGVsZW1lbnQpO1xuICAgICAgICAgICAgcmFuZ2UuY29sbGFwc2UoYmVnaW4pO1xuICAgICAgICB9XG4gICAgICAgIHJhbmdlLmluc2VydE5vZGUocmFuZ2UuY3JlYXRlQ29udGV4dHVhbEZyYWdtZW50KGh0bWwpKTtcbiAgICB9XG4gICAgcmV0dXJuIGVsZW1lbnQ7XG59O1xuXG5iYWlkdS5pbnNlcnRIVE1MID0gYmFpZHUuZG9tLmluc2VydEhUTUw7XG5cbi8qKlxuICog5pON5L2cZmxhc2jlr7nosaHnmoTmlrnms5XvvIzljIXmi6zliJvlu7pmbGFzaOWvueixoeOAgeiOt+WPlmZsYXNo5a+56LGh5Lul5Y+K5Yik5patZmxhc2jmj5Lku7bnmoTniYjmnKzlj7dcbiAqIEBuYW1lc3BhY2UgYmFpZHUuc3dmXG4gKi9cbmJhaWR1LnN3ZiA9IGJhaWR1LnN3ZiB8fCB7fTtcblxuXG4vKipcbiAqIOa1j+iniOWZqOaUr+aMgeeahGZsYXNo5o+S5Lu254mI5pysXG4gKiBAcHJvcGVydHkgdmVyc2lvbiDmtY/op4jlmajmlK/mjIHnmoRmbGFzaOaPkuS7tueJiOacrFxuICogQGdyYW1tYXIgYmFpZHUuc3dmLnZlcnNpb25cbiAqIEByZXR1cm4ge1N0cmluZ30g54mI5pys5Y+3XG4gKiBAbWV0YSBzdGFuZGFyZFxuICovXG5iYWlkdS5zd2YudmVyc2lvbiA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG4gPSBuYXZpZ2F0b3I7XG4gICAgaWYgKG4ucGx1Z2lucyAmJiBuLm1pbWVUeXBlcy5sZW5ndGgpIHtcbiAgICAgICAgdmFyIHBsdWdpbiA9IG4ucGx1Z2luc1tcIlNob2Nrd2F2ZSBGbGFzaFwiXTtcbiAgICAgICAgaWYgKHBsdWdpbiAmJiBwbHVnaW4uZGVzY3JpcHRpb24pIHtcbiAgICAgICAgICAgIHJldHVybiBwbHVnaW4uZGVzY3JpcHRpb25cbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyhbYS16QS1aXXxcXHMpKy8sIFwiXCIpXG4gICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXFxzKStyLywgXCIuXCIpICsgXCIuMFwiO1xuICAgICAgICB9XG4gICAgfSBlbHNlIGlmICh3aW5kb3cuQWN0aXZlWE9iamVjdCAmJiAhd2luZG93Lm9wZXJhKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxMjsgaSA+PSAyOyBpLS0pIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdmFyIGMgPSBuZXcgQWN0aXZlWE9iamVjdCgnU2hvY2t3YXZlRmxhc2guU2hvY2t3YXZlRmxhc2guJyArIGkpO1xuICAgICAgICAgICAgICAgIGlmIChjKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2ZXJzaW9uID0gYy5HZXRWYXJpYWJsZShcIiR2ZXJzaW9uXCIpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmVyc2lvbi5yZXBsYWNlKC9XSU4vZywnJykucmVwbGFjZSgvLC9nLCcuJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaChlKSB7fVxuICAgICAgICB9XG4gICAgfVxufSkoKTtcblxuLyoqXG4gKiDmk43kvZzlrZfnrKbkuLLnmoTmlrnms5VcbiAqIEBuYW1lc3BhY2UgYmFpZHUuc3RyaW5nXG4gKi9cbmJhaWR1LnN0cmluZyA9IGJhaWR1LnN0cmluZyB8fCB7fTtcblxuXG4vKipcbiAqIOWvueebruagh+Wtl+espuS4sui/m+ihjGh0bWznvJbnoIFcbiAqIEBuYW1lIGJhaWR1LnN0cmluZy5lbmNvZGVIVE1MXG4gKiBAZnVuY3Rpb25cbiAqIEBncmFtbWFyIGJhaWR1LnN0cmluZy5lbmNvZGVIVE1MKHNvdXJjZSlcbiAqIEBwYXJhbSB7c3RyaW5nfSBzb3VyY2Ug55uu5qCH5a2X56ym5LiyXG4gKiBAcmVtYXJrXG4gKiDnvJbnoIHlrZfnrKbmnIk15Liq77yaJjw+XCInXG4gKiBAc2hvcnRjdXQgZW5jb2RlSFRNTFxuICogQG1ldGEgc3RhbmRhcmRcbiAqIEBzZWUgYmFpZHUuc3RyaW5nLmRlY29kZUhUTUxcbiAqICAgICAgICAgICAgIFxuICogQHJldHVybnMge3N0cmluZ30gaHRtbOe8lueggeWQjueahOWtl+espuS4slxuICovXG5iYWlkdS5zdHJpbmcuZW5jb2RlSFRNTCA9IGZ1bmN0aW9uIChzb3VyY2UpIHtcbiAgICByZXR1cm4gU3RyaW5nKHNvdXJjZSlcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvJi9nLCcmYW1wOycpXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoLzwvZywnJmx0OycpXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoLz4vZywnJmd0OycpXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoL1wiL2csIFwiJnF1b3Q7XCIpXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCImIzM5O1wiKTtcbn07XG5cbmJhaWR1LmVuY29kZUhUTUwgPSBiYWlkdS5zdHJpbmcuZW5jb2RlSFRNTDtcblxuLyoqXG4gKiDliJvlu7pmbGFzaOWvueixoeeahGh0bWzlrZfnrKbkuLJcbiAqIEBuYW1lIGJhaWR1LnN3Zi5jcmVhdGVIVE1MXG4gKiBAZnVuY3Rpb25cbiAqIEBncmFtbWFyIGJhaWR1LnN3Zi5jcmVhdGVIVE1MKG9wdGlvbnMpXG4gKiBcbiAqIEBwYXJhbSB7T2JqZWN0fSBcdG9wdGlvbnMgXHRcdFx0XHRcdOWIm+W7umZsYXNo55qE6YCJ6aG55Y+C5pWwXG4gKiBAcGFyYW0ge3N0cmluZ30gXHRvcHRpb25zLmlkIFx0XHRcdFx0XHTopoHliJvlu7rnmoRmbGFzaOeahOagh+ivhlxuICogQHBhcmFtIHtzdHJpbmd9IFx0b3B0aW9ucy51cmwgXHRcdFx0XHRmbGFzaOaWh+S7tueahHVybFxuICogQHBhcmFtIHtTdHJpbmd9IFx0b3B0aW9ucy5lcnJvck1lc3NhZ2UgXHRcdOacquWuieijhWZsYXNoIHBsYXllcuaIlmZsYXNoIHBsYXllcueJiOacrOWPt+i/h+S9juaXtueahOaPkOekulxuICogQHBhcmFtIHtzdHJpbmd9IFx0b3B0aW9ucy52ZXIgXHRcdFx0XHTmnIDkvY7pnIDopoHnmoRmbGFzaCBwbGF5ZXLniYjmnKzlj7dcbiAqIEBwYXJhbSB7c3RyaW5nfSBcdG9wdGlvbnMud2lkdGggXHRcdFx0XHRmbGFzaOeahOWuveW6plxuICogQHBhcmFtIHtzdHJpbmd9IFx0b3B0aW9ucy5oZWlnaHQgXHRcdFx0XHRmbGFzaOeahOmrmOW6plxuICogQHBhcmFtIHtzdHJpbmd9IFx0b3B0aW9ucy5hbGlnbiBcdFx0XHRcdGZsYXNo55qE5a+56b2Q5pa55byP77yM5YWB6K645YC877yabWlkZGxlL2xlZnQvcmlnaHQvdG9wL2JvdHRvbVxuICogQHBhcmFtIHtzdHJpbmd9IFx0b3B0aW9ucy5iYXNlIFx0XHRcdFx06K6+572u55So5LqO6Kej5p6Qc3dm5paH5Lu25Lit55qE5omA5pyJ55u45a+56Lev5b6E6K+t5Y+l55qE5Z+65pys55uu5b2V5oiWVVJMXG4gKiBAcGFyYW0ge3N0cmluZ30gXHRvcHRpb25zLmJnY29sb3IgXHRcdFx0c3dm5paH5Lu255qE6IOM5pmv6ImyXG4gKiBAcGFyYW0ge3N0cmluZ30gXHRvcHRpb25zLnNhbGlnbiBcdFx0XHRcdOiuvue9rue8qeaUvueahHN3ZuaWh+S7tuWcqOeUsXdpZHRo5ZKMaGVpZ2h06K6+572u5a6a5LmJ55qE5Yy65Z+f5YaF55qE5L2N572u44CC5YWB6K645YC877yabC9yL3QvYi90bC90ci9ibC9iclxuICogQHBhcmFtIHtib29sZWFufSBvcHRpb25zLm1lbnUgXHRcdFx0XHTmmK/lkKbmmL7npLrlj7PplK7oj5zljZXvvIzlhYHorrjlgLzvvJp0cnVlL2ZhbHNlXG4gKiBAcGFyYW0ge2Jvb2xlYW59IG9wdGlvbnMubG9vcCBcdFx0XHRcdOaSreaUvuWIsOacgOWQjuS4gOW4p+aXtuaYr+WQpumHjeaWsOaSreaUvu+8jOWFgeiuuOWAvO+8miB0cnVlL2ZhbHNlXG4gKiBAcGFyYW0ge2Jvb2xlYW59IG9wdGlvbnMucGxheSBcdFx0XHRcdGZsYXNo5piv5ZCm5Zyo5rWP6KeI5Zmo5Yqg6L295pe25bCx5byA5aeL5pKt5pS+44CC5YWB6K645YC877yadHJ1ZS9mYWxzZVxuICogQHBhcmFtIHtzdHJpbmd9IFx0b3B0aW9ucy5xdWFsaXR5IFx0XHRcdOiuvue9rmZsYXNo5pKt5pS+55qE55S76LSo77yM5YWB6K645YC877yabG93L21lZGl1bS9oaWdoL2F1dG9sb3cvYXV0b2hpZ2gvYmVzdFxuICogQHBhcmFtIHtzdHJpbmd9IFx0b3B0aW9ucy5zY2FsZSBcdFx0XHRcdOiuvue9rmZsYXNo5YaF5a655aaC5L2V57yp5pS+5p2l6YCC5bqU6K6+572u55qE5a696auY44CC5YWB6K645YC877yac2hvd2FsbC9ub2JvcmRlci9leGFjdGZpdFxuICogQHBhcmFtIHtzdHJpbmd9IFx0b3B0aW9ucy53bW9kZSBcdFx0XHRcdOiuvue9rmZsYXNo55qE5pi+56S65qih5byP44CC5YWB6K645YC877yad2luZG93L29wYXF1ZS90cmFuc3BhcmVudFxuICogQHBhcmFtIHtzdHJpbmd9IFx0b3B0aW9ucy5hbGxvd3NjcmlwdGFjY2VzcyBcdOiuvue9rmZsYXNo5LiO6aG16Z2i55qE6YCa5L+h5p2D6ZmQ44CC5YWB6K645YC877yaYWx3YXlzL25ldmVyL3NhbWVEb21haW5cbiAqIEBwYXJhbSB7c3RyaW5nfSBcdG9wdGlvbnMuYWxsb3duZXR3b3JraW5nIFx06K6+572uc3dm5paH5Lu25Lit5YWB6K645L2/55So55qE572R57ucQVBJ44CC5YWB6K645YC877yaYWxsL2ludGVybmFsL25vbmVcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gb3B0aW9ucy5hbGxvd2Z1bGxzY3JlZW4gXHTmmK/lkKblhYHorrhmbGFzaOWFqOWxj+OAguWFgeiuuOWAvO+8mnRydWUvZmFsc2VcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gb3B0aW9ucy5zZWFtbGVzc3RhYmJpbmcgXHTlhYHorrjorr7nva7miafooYzml6DnvJ3ot7PmoLzvvIzku47ogIzkvb/nlKjmiLfog73ot7Plh7pmbGFzaOW6lOeUqOeoi+W6j+OAguivpeWPguaVsOWPquiDveWcqOWuieijhUZsYXNoN+WPiuabtOmrmOeJiOacrOeahFdpbmRvd3PkuK3kvb/nlKjjgILlhYHorrjlgLzvvJp0cnVlL2ZhbHNlXG4gKiBAcGFyYW0ge2Jvb2xlYW59IG9wdGlvbnMuZGV2aWNlZm9udCBcdFx0XHTorr7nva7pnZnmgIHmlofmnKzlr7nosaHmmK/lkKbku6Xorr7lpIflrZfkvZPlkYjnjrDjgILlhYHorrjlgLzvvJp0cnVlL2ZhbHNlXG4gKiBAcGFyYW0ge2Jvb2xlYW59IG9wdGlvbnMuc3dsaXZlY29ubmVjdCBcdFx056ys5LiA5qyh5Yqg6L29Zmxhc2jml7bmtY/op4jlmajmmK/lkKblupTlkK/liqhKYXZh44CC5YWB6K645YC877yadHJ1ZS9mYWxzZVxuICogQHBhcmFtIHtPYmplY3R9IFx0b3B0aW9ucy52YXJzIFx0XHRcdFx06KaB5Lyg6YCS57uZZmxhc2jnmoTlj4LmlbDvvIzmlK/mjIFKU09O5oiWc3RyaW5n57G75Z6L44CCXG4gKiBcbiAqIEBzZWUgYmFpZHUuc3dmLmNyZWF0ZVxuICogQG1ldGEgc3RhbmRhcmRcbiAqIEByZXR1cm5zIHtzdHJpbmd9IGZsYXNo5a+56LGh55qEaHRtbOWtl+espuS4slxuICovXG5iYWlkdS5zd2YuY3JlYXRlSFRNTCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgdmFyIHZlcnNpb24gPSBiYWlkdS5zd2YudmVyc2lvbiwgXG4gICAgICAgIG5lZWRWZXJzaW9uID0gb3B0aW9uc1sndmVyJ10gfHwgJzYuMC4wJywgXG4gICAgICAgIHZVbml0MSwgdlVuaXQyLCBpLCBrLCBsZW4sIGl0ZW0sIHRtcE9wdCA9IHt9LFxuICAgICAgICBlbmNvZGVIVE1MID0gYmFpZHUuc3RyaW5nLmVuY29kZUhUTUw7XG4gICAgZm9yIChrIGluIG9wdGlvbnMpIHtcbiAgICAgICAgdG1wT3B0W2tdID0gb3B0aW9uc1trXTtcbiAgICB9XG4gICAgb3B0aW9ucyA9IHRtcE9wdDtcbiAgICBpZiAodmVyc2lvbikge1xuICAgICAgICB2ZXJzaW9uID0gdmVyc2lvbi5zcGxpdCgnLicpO1xuICAgICAgICBuZWVkVmVyc2lvbiA9IG5lZWRWZXJzaW9uLnNwbGl0KCcuJyk7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCAzOyBpKyspIHtcbiAgICAgICAgICAgIHZVbml0MSA9IHBhcnNlSW50KHZlcnNpb25baV0sIDEwKTtcbiAgICAgICAgICAgIHZVbml0MiA9IHBhcnNlSW50KG5lZWRWZXJzaW9uW2ldLCAxMCk7XG4gICAgICAgICAgICBpZiAodlVuaXQyIDwgdlVuaXQxKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHZVbml0MiA+IHZVbml0MSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiAnJztcbiAgICB9XG4gICAgXG4gICAgdmFyIHZhcnMgPSBvcHRpb25zWyd2YXJzJ10sXG4gICAgICAgIG9ialByb3BlcnRpZXMgPSBbJ2NsYXNzaWQnLCAnY29kZWJhc2UnLCAnaWQnLCAnd2lkdGgnLCAnaGVpZ2h0JywgJ2FsaWduJ107XG4gICAgb3B0aW9uc1snYWxpZ24nXSA9IG9wdGlvbnNbJ2FsaWduJ10gfHwgJ21pZGRsZSc7XG4gICAgb3B0aW9uc1snY2xhc3NpZCddID0gJ2Nsc2lkOmQyN2NkYjZlLWFlNmQtMTFjZi05NmI4LTQ0NDU1MzU0MDAwMCc7XG4gICAgb3B0aW9uc1snY29kZWJhc2UnXSA9ICdodHRwOi8vZnBkb3dubG9hZC5tYWNyb21lZGlhLmNvbS9wdWIvc2hvY2t3YXZlL2NhYnMvZmxhc2gvc3dmbGFzaC5jYWIjdmVyc2lvbj02LDAsMCwwJztcbiAgICBvcHRpb25zWydtb3ZpZSddID0gb3B0aW9uc1sndXJsJ10gfHwgJyc7XG4gICAgZGVsZXRlIG9wdGlvbnNbJ3ZhcnMnXTtcbiAgICBkZWxldGUgb3B0aW9uc1sndXJsJ107XG4gICAgaWYgKCdzdHJpbmcnID09IHR5cGVvZiB2YXJzKSB7XG4gICAgICAgIG9wdGlvbnNbJ2ZsYXNodmFycyddID0gdmFycztcbiAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgZnZhcnMgPSBbXTtcbiAgICAgICAgZm9yIChrIGluIHZhcnMpIHtcbiAgICAgICAgICAgIGl0ZW0gPSB2YXJzW2tdO1xuICAgICAgICAgICAgZnZhcnMucHVzaChrICsgXCI9XCIgKyBlbmNvZGVVUklDb21wb25lbnQoaXRlbSkpO1xuICAgICAgICB9XG4gICAgICAgIG9wdGlvbnNbJ2ZsYXNodmFycyddID0gZnZhcnMuam9pbignJicpO1xuICAgIH1cbiAgICB2YXIgc3RyID0gWyc8b2JqZWN0ICddO1xuICAgIGZvciAoaSA9IDAsIGxlbiA9IG9ialByb3BlcnRpZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgaXRlbSA9IG9ialByb3BlcnRpZXNbaV07XG4gICAgICAgIHN0ci5wdXNoKCcgJywgaXRlbSwgJz1cIicsIGVuY29kZUhUTUwob3B0aW9uc1tpdGVtXSksICdcIicpO1xuICAgIH1cbiAgICBzdHIucHVzaCgnPicpO1xuICAgIHZhciBwYXJhbXMgPSB7XG4gICAgICAgICd3bW9kZScgICAgICAgICAgICAgOiAxLFxuICAgICAgICAnc2NhbGUnICAgICAgICAgICAgIDogMSxcbiAgICAgICAgJ3F1YWxpdHknICAgICAgICAgICA6IDEsXG4gICAgICAgICdwbGF5JyAgICAgICAgICAgICAgOiAxLFxuICAgICAgICAnbG9vcCcgICAgICAgICAgICAgIDogMSxcbiAgICAgICAgJ21lbnUnICAgICAgICAgICAgICA6IDEsXG4gICAgICAgICdzYWxpZ24nICAgICAgICAgICAgOiAxLFxuICAgICAgICAnYmdjb2xvcicgICAgICAgICAgIDogMSxcbiAgICAgICAgJ2Jhc2UnICAgICAgICAgICAgICA6IDEsXG4gICAgICAgICdhbGxvd3NjcmlwdGFjY2VzcycgOiAxLFxuICAgICAgICAnYWxsb3duZXR3b3JraW5nJyAgIDogMSxcbiAgICAgICAgJ2FsbG93ZnVsbHNjcmVlbicgICA6IDEsXG4gICAgICAgICdzZWFtbGVzc3RhYmJpbmcnICAgOiAxLFxuICAgICAgICAnZGV2aWNlZm9udCcgICAgICAgIDogMSxcbiAgICAgICAgJ3N3bGl2ZWNvbm5lY3QnICAgICA6IDEsXG4gICAgICAgICdmbGFzaHZhcnMnICAgICAgICAgOiAxLFxuICAgICAgICAnbW92aWUnICAgICAgICAgICAgIDogMVxuICAgIH07XG4gICAgXG4gICAgZm9yIChrIGluIG9wdGlvbnMpIHtcbiAgICAgICAgaXRlbSA9IG9wdGlvbnNba107XG4gICAgICAgIGsgPSBrLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGlmIChwYXJhbXNba10gJiYgKGl0ZW0gfHwgaXRlbSA9PT0gZmFsc2UgfHwgaXRlbSA9PT0gMCkpIHtcbiAgICAgICAgICAgIHN0ci5wdXNoKCc8cGFyYW0gbmFtZT1cIicgKyBrICsgJ1wiIHZhbHVlPVwiJyArIGVuY29kZUhUTUwoaXRlbSkgKyAnXCIgLz4nKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBvcHRpb25zWydzcmMnXSAgPSBvcHRpb25zWydtb3ZpZSddO1xuICAgIG9wdGlvbnNbJ25hbWUnXSA9IG9wdGlvbnNbJ2lkJ107XG4gICAgZGVsZXRlIG9wdGlvbnNbJ2lkJ107XG4gICAgZGVsZXRlIG9wdGlvbnNbJ21vdmllJ107XG4gICAgZGVsZXRlIG9wdGlvbnNbJ2NsYXNzaWQnXTtcbiAgICBkZWxldGUgb3B0aW9uc1snY29kZWJhc2UnXTtcbiAgICBvcHRpb25zWyd0eXBlJ10gPSAnYXBwbGljYXRpb24veC1zaG9ja3dhdmUtZmxhc2gnO1xuICAgIG9wdGlvbnNbJ3BsdWdpbnNwYWdlJ10gPSAnaHR0cDovL3d3dy5tYWNyb21lZGlhLmNvbS9nby9nZXRmbGFzaHBsYXllcic7XG4gICAgc3RyLnB1c2goJzxlbWJlZCcpO1xuICAgIHZhciBzYWxpZ247XG4gICAgZm9yIChrIGluIG9wdGlvbnMpIHtcbiAgICAgICAgaXRlbSA9IG9wdGlvbnNba107XG4gICAgICAgIGlmIChpdGVtIHx8IGl0ZW0gPT09IGZhbHNlIHx8IGl0ZW0gPT09IDApIHtcbiAgICAgICAgICAgIGlmICgobmV3IFJlZ0V4cChcIl5zYWxpZ25cXHgyNFwiLCBcImlcIikpLnRlc3QoaykpIHtcbiAgICAgICAgICAgICAgICBzYWxpZ24gPSBpdGVtO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBzdHIucHVzaCgnICcsIGssICc9XCInLCBlbmNvZGVIVE1MKGl0ZW0pLCAnXCInKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBpZiAoc2FsaWduKSB7XG4gICAgICAgIHN0ci5wdXNoKCcgc2FsaWduPVwiJywgZW5jb2RlSFRNTChzYWxpZ24pLCAnXCInKTtcbiAgICB9XG4gICAgc3RyLnB1c2goJz48L2VtYmVkPjwvb2JqZWN0PicpO1xuICAgIFxuICAgIHJldHVybiBzdHIuam9pbignJyk7XG59O1xuXG5cbi8qKlxuICog5Zyo6aG16Z2i5Lit5Yib5bu65LiA5LiqZmxhc2jlr7nosaFcbiAqIEBuYW1lIGJhaWR1LnN3Zi5jcmVhdGVcbiAqIEBmdW5jdGlvblxuICogQGdyYW1tYXIgYmFpZHUuc3dmLmNyZWF0ZShvcHRpb25zWywgY29udGFpbmVyXSlcbiAqIFxuICogQHBhcmFtIHtPYmplY3R9IFx0b3B0aW9ucyBcdFx0XHRcdFx05Yib5bu6Zmxhc2jnmoTpgInpobnlj4LmlbBcbiAqIEBwYXJhbSB7c3RyaW5nfSBcdG9wdGlvbnMuaWQgXHRcdFx0XHRcdOimgeWIm+W7uueahGZsYXNo55qE5qCH6K+GXG4gKiBAcGFyYW0ge3N0cmluZ30gXHRvcHRpb25zLnVybCBcdFx0XHRcdGZsYXNo5paH5Lu255qEdXJsXG4gKiBAcGFyYW0ge1N0cmluZ30gXHRvcHRpb25zLmVycm9yTWVzc2FnZSBcdFx05pyq5a6J6KOFZmxhc2ggcGxheWVy5oiWZmxhc2ggcGxheWVy54mI5pys5Y+36L+H5L2O5pe255qE5o+Q56S6XG4gKiBAcGFyYW0ge3N0cmluZ30gXHRvcHRpb25zLnZlciBcdFx0XHRcdOacgOS9jumcgOimgeeahGZsYXNoIHBsYXllcueJiOacrOWPt1xuICogQHBhcmFtIHtzdHJpbmd9IFx0b3B0aW9ucy53aWR0aCBcdFx0XHRcdGZsYXNo55qE5a695bqmXG4gKiBAcGFyYW0ge3N0cmluZ30gXHRvcHRpb25zLmhlaWdodCBcdFx0XHRcdGZsYXNo55qE6auY5bqmXG4gKiBAcGFyYW0ge3N0cmluZ30gXHRvcHRpb25zLmFsaWduIFx0XHRcdFx0Zmxhc2jnmoTlr7npvZDmlrnlvI/vvIzlhYHorrjlgLzvvJptaWRkbGUvbGVmdC9yaWdodC90b3AvYm90dG9tXG4gKiBAcGFyYW0ge3N0cmluZ30gXHRvcHRpb25zLmJhc2UgXHRcdFx0XHTorr7nva7nlKjkuo7op6PmnpBzd2bmlofku7bkuK3nmoTmiYDmnInnm7jlr7not6/lvoTor63lj6XnmoTln7rmnKznm67lvZXmiJZVUkxcbiAqIEBwYXJhbSB7c3RyaW5nfSBcdG9wdGlvbnMuYmdjb2xvciBcdFx0XHRzd2bmlofku7bnmoTog4zmma/oibJcbiAqIEBwYXJhbSB7c3RyaW5nfSBcdG9wdGlvbnMuc2FsaWduIFx0XHRcdFx06K6+572u57yp5pS+55qEc3dm5paH5Lu25Zyo55Sxd2lkdGjlkoxoZWlnaHTorr7nva7lrprkuYnnmoTljLrln5/lhoXnmoTkvY3nva7jgILlhYHorrjlgLzvvJpsL3IvdC9iL3RsL3RyL2JsL2JyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IG9wdGlvbnMubWVudSBcdFx0XHRcdOaYr+WQpuaYvuekuuWPs+mUruiPnOWNle+8jOWFgeiuuOWAvO+8mnRydWUvZmFsc2VcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gb3B0aW9ucy5sb29wIFx0XHRcdFx05pKt5pS+5Yiw5pyA5ZCO5LiA5bin5pe25piv5ZCm6YeN5paw5pKt5pS+77yM5YWB6K645YC877yaIHRydWUvZmFsc2VcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gb3B0aW9ucy5wbGF5IFx0XHRcdFx0Zmxhc2jmmK/lkKblnKjmtY/op4jlmajliqDovb3ml7blsLHlvIDlp4vmkq3mlL7jgILlhYHorrjlgLzvvJp0cnVlL2ZhbHNlXG4gKiBAcGFyYW0ge3N0cmluZ30gXHRvcHRpb25zLnF1YWxpdHkgXHRcdFx06K6+572uZmxhc2jmkq3mlL7nmoTnlLvotKjvvIzlhYHorrjlgLzvvJpsb3cvbWVkaXVtL2hpZ2gvYXV0b2xvdy9hdXRvaGlnaC9iZXN0XG4gKiBAcGFyYW0ge3N0cmluZ30gXHRvcHRpb25zLnNjYWxlIFx0XHRcdFx06K6+572uZmxhc2jlhoXlrrnlpoLkvZXnvKnmlL7mnaXpgILlupTorr7nva7nmoTlrr3pq5jjgILlhYHorrjlgLzvvJpzaG93YWxsL25vYm9yZGVyL2V4YWN0Zml0XG4gKiBAcGFyYW0ge3N0cmluZ30gXHRvcHRpb25zLndtb2RlIFx0XHRcdFx06K6+572uZmxhc2jnmoTmmL7npLrmqKHlvI/jgILlhYHorrjlgLzvvJp3aW5kb3cvb3BhcXVlL3RyYW5zcGFyZW50XG4gKiBAcGFyYW0ge3N0cmluZ30gXHRvcHRpb25zLmFsbG93c2NyaXB0YWNjZXNzIFx06K6+572uZmxhc2jkuI7pobXpnaLnmoTpgJrkv6HmnYPpmZDjgILlhYHorrjlgLzvvJphbHdheXMvbmV2ZXIvc2FtZURvbWFpblxuICogQHBhcmFtIHtzdHJpbmd9IFx0b3B0aW9ucy5hbGxvd25ldHdvcmtpbmcgXHTorr7nva5zd2bmlofku7bkuK3lhYHorrjkvb/nlKjnmoTnvZHnu5xBUEnjgILlhYHorrjlgLzvvJphbGwvaW50ZXJuYWwvbm9uZVxuICogQHBhcmFtIHtib29sZWFufSBvcHRpb25zLmFsbG93ZnVsbHNjcmVlbiBcdOaYr+WQpuWFgeiuuGZsYXNo5YWo5bGP44CC5YWB6K645YC877yadHJ1ZS9mYWxzZVxuICogQHBhcmFtIHtib29sZWFufSBvcHRpb25zLnNlYW1sZXNzdGFiYmluZyBcdOWFgeiuuOiuvue9ruaJp+ihjOaXoOe8nei3s+agvO+8jOS7juiAjOS9v+eUqOaIt+iDvei3s+WHumZsYXNo5bqU55So56iL5bqP44CC6K+l5Y+C5pWw5Y+q6IO95Zyo5a6J6KOFRmxhc2g35Y+K5pu06auY54mI5pys55qEV2luZG93c+S4reS9v+eUqOOAguWFgeiuuOWAvO+8mnRydWUvZmFsc2VcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gb3B0aW9ucy5kZXZpY2Vmb250IFx0XHRcdOiuvue9rumdmeaAgeaWh+acrOWvueixoeaYr+WQpuS7peiuvuWkh+Wtl+S9k+WRiOeOsOOAguWFgeiuuOWAvO+8mnRydWUvZmFsc2VcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gb3B0aW9ucy5zd2xpdmVjb25uZWN0IFx0XHTnrKzkuIDmrKHliqDovb1mbGFzaOaXtua1j+iniOWZqOaYr+WQpuW6lOWQr+WKqEphdmHjgILlhYHorrjlgLzvvJp0cnVlL2ZhbHNlXG4gKiBAcGFyYW0ge09iamVjdH0gXHRvcHRpb25zLnZhcnMgXHRcdFx0XHTopoHkvKDpgJLnu5lmbGFzaOeahOWPguaVsO+8jOaUr+aMgUpTT07miJZzdHJpbmfnsbvlnovjgIJcbiAqIFxuICogQHBhcmFtIHtIVE1MRWxlbWVudHxzdHJpbmd9IFtjb250YWluZXJdIFx0XHRmbGFzaOWvueixoeeahOeItuWuueWZqOWFg+e0oO+8jOS4jeS8oOmAkuivpeWPguaVsOaXtuWcqOW9k+WJjeS7o+eggeS9jee9ruWIm+W7umZsYXNo5a+56LGh44CCXG4gKiBAbWV0YSBzdGFuZGFyZFxuICogQHNlZSBiYWlkdS5zd2YuY3JlYXRlSFRNTCxiYWlkdS5zd2YuZ2V0TW92aWVcbiAqL1xuYmFpZHUuc3dmLmNyZWF0ZSA9IGZ1bmN0aW9uIChvcHRpb25zLCB0YXJnZXQpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICB2YXIgaHRtbCA9IGJhaWR1LnN3Zi5jcmVhdGVIVE1MKG9wdGlvbnMpIFxuICAgICAgICAgICAgICAgfHwgb3B0aW9uc1snZXJyb3JNZXNzYWdlJ10gXG4gICAgICAgICAgICAgICB8fCAnJztcbiAgICAgICAgICAgICAgICBcbiAgICBpZiAodGFyZ2V0ICYmICdzdHJpbmcnID09IHR5cGVvZiB0YXJnZXQpIHtcbiAgICAgICAgdGFyZ2V0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGFyZ2V0KTtcbiAgICB9XG4gICAgYmFpZHUuZG9tLmluc2VydEhUTUwoIHRhcmdldCB8fCBkb2N1bWVudC5ib2R5ICwnYmVmb3JlRW5kJyxodG1sICk7XG59O1xuLyoqXG4gKiDliKTmlq3mmK/lkKbkuLppZea1j+iniOWZqFxuICogQG5hbWUgYmFpZHUuYnJvd3Nlci5pZVxuICogQGZpZWxkXG4gKiBAZ3JhbW1hciBiYWlkdS5icm93c2VyLmllXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBJReeJiOacrOWPt1xuICovXG5iYWlkdS5icm93c2VyLmllID0gYmFpZHUuaWUgPSAvbXNpZSAoXFxkK1xcLlxcZCspL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSA/IChkb2N1bWVudC5kb2N1bWVudE1vZGUgfHwgKyBSZWdFeHBbJ1xceDI0MSddKSA6IHVuZGVmaW5lZDtcblxuLyoqXG4gKiDnp7vpmaTmlbDnu4TkuK3nmoTpoblcbiAqIEBuYW1lIGJhaWR1LmFycmF5LnJlbW92ZVxuICogQGZ1bmN0aW9uXG4gKiBAZ3JhbW1hciBiYWlkdS5hcnJheS5yZW1vdmUoc291cmNlLCBtYXRjaClcbiAqIEBwYXJhbSB7QXJyYXl9IHNvdXJjZSDpnIDopoHnp7vpmaTpobnnmoTmlbDnu4RcbiAqIEBwYXJhbSB7QW55fSBtYXRjaCDopoHnp7vpmaTnmoTpoblcbiAqIEBtZXRhIHN0YW5kYXJkXG4gKiBAc2VlIGJhaWR1LmFycmF5LnJlbW92ZUF0XG4gKiAgICAgICAgICAgICBcbiAqIEByZXR1cm5zIHtBcnJheX0g56e76Zmk5ZCO55qE5pWw57uEXG4gKi9cbmJhaWR1LmFycmF5LnJlbW92ZSA9IGZ1bmN0aW9uIChzb3VyY2UsIG1hdGNoKSB7XG4gICAgdmFyIGxlbiA9IHNvdXJjZS5sZW5ndGg7XG4gICAgICAgIFxuICAgIHdoaWxlIChsZW4tLSkge1xuICAgICAgICBpZiAobGVuIGluIHNvdXJjZSAmJiBzb3VyY2VbbGVuXSA9PT0gbWF0Y2gpIHtcbiAgICAgICAgICAgIHNvdXJjZS5zcGxpY2UobGVuLCAxKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc291cmNlO1xufTtcblxuLyoqXG4gKiDliKTmlq3nm67moIflj4LmlbDmmK/lkKZBcnJheeWvueixoVxuICogQG5hbWUgYmFpZHUubGFuZy5pc0FycmF5XG4gKiBAZnVuY3Rpb25cbiAqIEBncmFtbWFyIGJhaWR1LmxhbmcuaXNBcnJheShzb3VyY2UpXG4gKiBAcGFyYW0ge0FueX0gc291cmNlIOebruagh+WPguaVsFxuICogQG1ldGEgc3RhbmRhcmRcbiAqIEBzZWUgYmFpZHUubGFuZy5pc1N0cmluZyxiYWlkdS5sYW5nLmlzT2JqZWN0LGJhaWR1LmxhbmcuaXNOdW1iZXIsYmFpZHUubGFuZy5pc0VsZW1lbnQsYmFpZHUubGFuZy5pc0Jvb2xlYW4sYmFpZHUubGFuZy5pc0RhdGVcbiAqICAgICAgICAgICAgIFxuICogQHJldHVybnMge2Jvb2xlYW59IOexu+Wei+WIpOaWree7k+aenFxuICovXG5iYWlkdS5sYW5nLmlzQXJyYXkgPSBmdW5jdGlvbiAoc291cmNlKSB7XG4gICAgcmV0dXJuICdbb2JqZWN0IEFycmF5XScgPT0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHNvdXJjZSk7XG59O1xuXG5cblxuLyoqXG4gKiDlsIbkuIDkuKrlj5jph4/ovazmjaLmiJBhcnJheVxuICogQG5hbWUgYmFpZHUubGFuZy50b0FycmF5XG4gKiBAZnVuY3Rpb25cbiAqIEBncmFtbWFyIGJhaWR1LmxhbmcudG9BcnJheShzb3VyY2UpXG4gKiBAcGFyYW0ge21peH0gc291cmNlIOmcgOimgei9rOaNouaIkGFycmF555qE5Y+Y6YePXG4gKiBAdmVyc2lvbiAxLjNcbiAqIEBtZXRhIHN0YW5kYXJkXG4gKiBAcmV0dXJucyB7YXJyYXl9IOi9rOaNouWQjueahGFycmF5XG4gKi9cbmJhaWR1LmxhbmcudG9BcnJheSA9IGZ1bmN0aW9uIChzb3VyY2UpIHtcbiAgICBpZiAoc291cmNlID09PSBudWxsIHx8IHNvdXJjZSA9PT0gdW5kZWZpbmVkKVxuICAgICAgICByZXR1cm4gW107XG4gICAgaWYgKGJhaWR1LmxhbmcuaXNBcnJheShzb3VyY2UpKVxuICAgICAgICByZXR1cm4gc291cmNlO1xuICAgIGlmICh0eXBlb2Ygc291cmNlLmxlbmd0aCAhPT0gJ251bWJlcicgfHwgdHlwZW9mIHNvdXJjZSA9PT0gJ3N0cmluZycgfHwgYmFpZHUubGFuZy5pc0Z1bmN0aW9uKHNvdXJjZSkpIHtcbiAgICAgICAgcmV0dXJuIFtzb3VyY2VdO1xuICAgIH1cbiAgICBpZiAoc291cmNlLml0ZW0pIHtcbiAgICAgICAgdmFyIGwgPSBzb3VyY2UubGVuZ3RoLCBhcnJheSA9IG5ldyBBcnJheShsKTtcbiAgICAgICAgd2hpbGUgKGwtLSlcbiAgICAgICAgICAgIGFycmF5W2xdID0gc291cmNlW2xdO1xuICAgICAgICByZXR1cm4gYXJyYXk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFtdLnNsaWNlLmNhbGwoc291cmNlKTtcbn07XG5cbi8qKlxuICog6I635b6XZmxhc2jlr7nosaHnmoTlrp7kvotcbiAqIEBuYW1lIGJhaWR1LnN3Zi5nZXRNb3ZpZVxuICogQGZ1bmN0aW9uXG4gKiBAZ3JhbW1hciBiYWlkdS5zd2YuZ2V0TW92aWUobmFtZSlcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIGZsYXNo5a+56LGh55qE5ZCN56ewXG4gKiBAc2VlIGJhaWR1LnN3Zi5jcmVhdGVcbiAqIEBtZXRhIHN0YW5kYXJkXG4gKiBAcmV0dXJucyB7SFRNTEVsZW1lbnR9IGZsYXNo5a+56LGh55qE5a6e5L6LXG4gKi9cbmJhaWR1LnN3Zi5nZXRNb3ZpZSA9IGZ1bmN0aW9uIChuYW1lKSB7XG5cdHZhciBtb3ZpZSA9IGRvY3VtZW50W25hbWVdLCByZXQ7XG4gICAgcmV0dXJuIGJhaWR1LmJyb3dzZXIuaWUgPT0gOSA/XG4gICAgXHRtb3ZpZSAmJiBtb3ZpZS5sZW5ndGggPyBcbiAgICBcdFx0KHJldCA9IGJhaWR1LmFycmF5LnJlbW92ZShiYWlkdS5sYW5nLnRvQXJyYXkobW92aWUpLGZ1bmN0aW9uKGl0ZW0pe1xuICAgIFx0XHRcdHJldHVybiBpdGVtLnRhZ05hbWUudG9Mb3dlckNhc2UoKSAhPSBcImVtYmVkXCI7XG4gICAgXHRcdH0pKS5sZW5ndGggPT0gMSA/IHJldFswXSA6IHJldFxuICAgIFx0XHQ6IG1vdmllXG4gICAgXHQ6IG1vdmllIHx8IHdpbmRvd1tuYW1lXTtcbn07XG5cblxuYmFpZHUuZmxhc2guX0Jhc2UgPSAoZnVuY3Rpb24oKXtcbiAgIFxuICAgIHZhciBwcmVmaXggPSAnYmRfX2ZsYXNoX18nO1xuXG4gICAgLyoqXG4gICAgICog5Yib5bu65LiA5Liq6ZqP5py655qE5a2X56ym5LiyXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcmV0dXJuIHtTdHJpbmd9XG4gICAgICovXG4gICAgZnVuY3Rpb24gX2NyZWF0ZVN0cmluZygpe1xuICAgICAgICByZXR1cm4gIHByZWZpeCArIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDIxNDc0ODM2NDgpLnRvU3RyaW5nKDM2KTtcbiAgICB9O1xuICAgXG4gICAgLyoqXG4gICAgICog5qOA5p+lZmxhc2jnirbmgIFcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSB0YXJnZXQgZmxhc2jlr7nosaFcbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIF9jaGVja1JlYWR5KHRhcmdldCl7XG4gICAgICAgIGlmKHR5cGVvZiB0YXJnZXQgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiB0YXJnZXQuZmxhc2hJbml0ICE9PSAndW5kZWZpbmVkJyAmJiB0YXJnZXQuZmxhc2hJbml0KCkpe1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIOiwg+eUqOS5i+WJjei/m+ihjOWOi+agiOeahOWHveaVsFxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtBcnJheX0gY2FsbFF1ZXVlIOiwg+eUqOmYn+WIl1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fSB0YXJnZXQgZmxhc2jlr7nosaFcbiAgICAgKiBAcmV0dXJuIHtOdWxsfVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIF9jYWxsRm4oY2FsbFF1ZXVlLCB0YXJnZXQpe1xuICAgICAgICB2YXIgcmVzdWx0ID0gbnVsbDtcbiAgICAgICAgXG4gICAgICAgIGNhbGxRdWV1ZSA9IGNhbGxRdWV1ZS5yZXZlcnNlKCk7XG4gICAgICAgIGJhaWR1LmVhY2goY2FsbFF1ZXVlLCBmdW5jdGlvbihpdGVtKXtcbiAgICAgICAgICAgIHJlc3VsdCA9IHRhcmdldC5jYWxsKGl0ZW0uZm5OYW1lLCBpdGVtLnBhcmFtcyk7XG4gICAgICAgICAgICBpdGVtLmNhbGxCYWNrKHJlc3VsdCk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiDkuLrkvKDlhaXnmoTljL/lkI3lh73mlbDliJvlu7rlh73mlbDlkI1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfEZ1bmN0aW9ufSBmdW4g5Lyg5YWl55qE5Yy/5ZCN5Ye95pWw5oiW6ICF5Ye95pWw5ZCNXG4gICAgICogQHJldHVybiB7U3RyaW5nfVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIF9jcmVhdGVGdW5OYW1lKGZ1bil7XG4gICAgICAgIHZhciBuYW1lID0gJyc7XG5cbiAgICAgICAgaWYoYmFpZHUubGFuZy5pc0Z1bmN0aW9uKGZ1bikpe1xuICAgICAgICAgICAgbmFtZSA9IF9jcmVhdGVTdHJpbmcoKTtcbiAgICAgICAgICAgIHdpbmRvd1tuYW1lXSA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgZnVuLmFwcGx5KHdpbmRvdywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHJldHVybiBuYW1lO1xuICAgICAgICB9ZWxzZSBpZihiYWlkdS5sYW5nLmlzU3RyaW5nKXtcbiAgICAgICAgICAgIHJldHVybiBmdW47XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICog57uY5Yi2Zmxhc2hcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIOWIm+W7uuWPguaVsFxuICAgICAqIEByZXR1cm4ge09iamVjdH0gXG4gICAgICovXG4gICAgZnVuY3Rpb24gX3JlbmRlcihvcHRpb25zKXtcbiAgICAgICAgaWYoIW9wdGlvbnMuaWQpe1xuICAgICAgICAgICAgb3B0aW9ucy5pZCA9IF9jcmVhdGVTdHJpbmcoKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdmFyIGNvbnRhaW5lciA9IG9wdGlvbnMuY29udGFpbmVyIHx8ICcnO1xuICAgICAgICBkZWxldGUob3B0aW9ucy5jb250YWluZXIpO1xuICAgICAgICBcbiAgICAgICAgYmFpZHUuc3dmLmNyZWF0ZShvcHRpb25zLCBjb250YWluZXIpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGJhaWR1LnN3Zi5nZXRNb3ZpZShvcHRpb25zLmlkKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uKG9wdGlvbnMsIGNhbGxCYWNrKXtcbiAgICAgICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgICAgIGF1dG9SZW5kZXIgPSAodHlwZW9mIG9wdGlvbnMuYXV0b1JlbmRlciAhPT0gJ3VuZGVmaW5lZCcgPyBvcHRpb25zLmF1dG9SZW5kZXIgOiB0cnVlKSxcbiAgICAgICAgICAgIGNyZWF0ZU9wdGlvbnMgPSBvcHRpb25zLmNyZWF0ZU9wdGlvbnMgfHwge30sXG4gICAgICAgICAgICB0YXJnZXQgPSBudWxsLFxuICAgICAgICAgICAgaXNSZWFkeSA9IGZhbHNlLFxuICAgICAgICAgICAgY2FsbFF1ZXVlID0gW10sXG4gICAgICAgICAgICB0aW1lSGFuZGxlID0gbnVsbCxcbiAgICAgICAgICAgIGNhbGxCYWNrID0gY2FsbEJhY2sgfHwgW107XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWwhmZsYXNo5paH5Lu257uY5Yi25Yiw6aG16Z2i5LiKXG4gICAgICAgICAqIEBwdWJsaWNcbiAgICAgICAgICogQHJldHVybiB7TnVsbH1cbiAgICAgICAgICovXG4gICAgICAgIG1lLnJlbmRlciA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB0YXJnZXQgPSBfcmVuZGVyKGNyZWF0ZU9wdGlvbnMpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZihjYWxsQmFjay5sZW5ndGggPiAwKXtcbiAgICAgICAgICAgICAgICBiYWlkdS5lYWNoKGNhbGxCYWNrLCBmdW5jdGlvbihmdW5OYW1lLCBpbmRleCl7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxCYWNrW2luZGV4XSA9IF9jcmVhdGVGdW5OYW1lKG9wdGlvbnNbZnVuTmFtZV0gfHwgbmV3IEZ1bmN0aW9uKCkpO1xuICAgICAgICAgICAgICAgIH0pOyAgICBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG1lLmNhbGwoJ3NldEpTRnVuY05hbWUnLCBbY2FsbEJhY2tdKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICog6L+U5ZueZmxhc2jnirbmgIFcbiAgICAgICAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICAgICAgICovXG4gICAgICAgIG1lLmlzUmVhZHkgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgcmV0dXJuIGlzUmVhZHk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOiwg+eUqGZsYXNo5o6l5Y+j55qE57uf5LiA5YWl5Y+jXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBmbk5hbWUg6LCD55So55qE5Ye95pWw5ZCNXG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXl9IHBhcmFtcyDkvKDlhaXnmoTlj4LmlbDnu4TmiJDnmoTmlbDnu4Qs6Iul5LiN6K646KaB5Y+C5pWw77yM6ZyA5Lyg5YWl56m65pWw57uEXG4gICAgICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IFtjYWxsQmFja10g5byC5q2l6LCD55So5ZCO5bCG6L+U5Zue5YC85L2c5Li65Y+C5pWw55qE6LCD55So5Zue6LCD5Ye95pWw77yM5aaC5peg6L+U5Zue5YC877yM5Y+v5Lul5LiN5Lyg5YWl5q2k5Y+C5pWwXG4gICAgICAgICAqIEByZXR1cm4ge051bGx9XG4gICAgICAgICovXG4gICAgICAgIG1lLmNhbGwgPSBmdW5jdGlvbihmbk5hbWUsIHBhcmFtcywgY2FsbEJhY2spe1xuICAgICAgICAgICAgaWYoIWZuTmFtZSkgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICBjYWxsQmFjayA9IGNhbGxCYWNrIHx8IG5ldyBGdW5jdGlvbigpO1xuXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gbnVsbDtcbiAgICBcbiAgICAgICAgICAgIGlmKGlzUmVhZHkpe1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHRhcmdldC5jYWxsKGZuTmFtZSwgcGFyYW1zKTtcbiAgICAgICAgICAgICAgICBjYWxsQmFjayhyZXN1bHQpO1xuICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgY2FsbFF1ZXVlLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBmbk5hbWU6IGZuTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMsXG4gICAgICAgICAgICAgICAgICAgIGNhbGxCYWNrOiBjYWxsQmFja1xuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgICghdGltZUhhbmRsZSkgJiYgKHRpbWVIYW5kbGUgPSBzZXRJbnRlcnZhbChfY2hlY2ssIDIwMCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIFxuICAgICAgICAvKipcbiAgICAgICAgICog5Li65Lyg5YWl55qE5Yy/5ZCN5Ye95pWw5Yib5bu65Ye95pWw5ZCNXG4gICAgICAgICAqIEBwdWJsaWNcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd8RnVuY3Rpb259IGZ1biDkvKDlhaXnmoTljL/lkI3lh73mlbDmiJbogIXlh73mlbDlkI1cbiAgICAgICAgICogQHJldHVybiB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgbWUuY3JlYXRlRnVuTmFtZSA9IGZ1bmN0aW9uKGZ1bil7XG4gICAgICAgICAgICByZXR1cm4gX2NyZWF0ZUZ1bk5hbWUoZnVuKTsgICAgXG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOajgOafpWZsYXNo5piv5ZCmcmVhZHnvvIwg5bm26L+b6KGM6LCD55SoXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqIEByZXR1cm4ge051bGx9XG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBfY2hlY2soKXtcbiAgICAgICAgICAgIGlmKF9jaGVja1JlYWR5KHRhcmdldCkpe1xuICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodGltZUhhbmRsZSk7XG4gICAgICAgICAgICAgICAgdGltZUhhbmRsZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgX2NhbGwoKTtcblxuICAgICAgICAgICAgICAgIGlzUmVhZHkgPSB0cnVlO1xuICAgICAgICAgICAgfSAgICAgICAgICAgICAgIFxuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDosIPnlKjkuYvliY3ov5vooYzljovmoIjnmoTlh73mlbBcbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICogQHJldHVybiB7TnVsbH1cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIF9jYWxsKCl7XG4gICAgICAgICAgICBfY2FsbEZuKGNhbGxRdWV1ZSwgdGFyZ2V0KTtcbiAgICAgICAgICAgIGNhbGxRdWV1ZSA9IFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgYXV0b1JlbmRlciAmJiBtZS5yZW5kZXIoKTsgXG4gICAgfTtcbn0pKCk7XG5cblxuXG4vKipcbiAqIOWIm+W7umZsYXNoIGJhc2VkIGltYWdlVXBsb2FkZXJcbiAqIEBjbGFzc1xuICogQGdyYW1tYXIgYmFpZHUuZmxhc2guaW1hZ2VVcGxvYWRlcihvcHRpb25zKVxuICogQHBhcmFtIHtPYmplY3R9IGNyZWF0ZU9wdGlvbnMg5Yib5bu6Zmxhc2jml7bpnIDopoHnmoTlj4LmlbDvvIzor7flj4LnhadiYWlkdS5zd2YuY3JlYXRl5paH5qGjXG4gKiBAY29uZmlnIHtPYmplY3R9IHZhcnMg5Yib5bu6aW1hZ2VVcGxvYWRlcuaXtuaJgOmcgOimgeeahOWPguaVsFxuICogQGNvbmZpZyB7TnVtYmVyfSB2YXJzLmdyaWRXaWR0aCDmr4/kuIDkuKrpooTop4jlm77niYfmiYDljaDnmoTlrr3luqbvvIzlupTor6XkuLpmbGFzaOWvm+eahOaVtOmZpFxuICogQGNvbmZpZyB7TnVtYmVyfSB2YXJzLmdyaWRIZWlnaHQg5q+P5LiA5Liq6aKE6KeI5Zu+54mH5omA5Y2g55qE6auY5bqm77yM5bqU6K+l5Li6Zmxhc2jpq5jnmoTmlbTpmaRcbiAqIEBjb25maWcge051bWJlcn0gdmFycy5waWNXaWR0aCDljZXlvKDpooTop4jlm77niYfnmoTlrr3luqZcbiAqIEBjb25maWcge051bWJlcn0gdmFycy5waWNIZWlnaHQg5Y2V5byg6aKE6KeI5Zu+54mH55qE6auY5bqmXG4gKiBAY29uZmlnIHtTdHJpbmd9IHZhcnMudXBsb2FkRGF0YUZpZWxkTmFtZSBQT1NU6K+35rGC5Lit5Zu+54mH5pWw5o2u55qEa2V5LOm7mOiupOWAvCdwaWNkYXRhJ1xuICogQGNvbmZpZyB7U3RyaW5nfSB2YXJzLnBpY0Rlc2NGaWVsZE5hbWUgUE9TVOivt+axguS4reWbvueJh+aPj+i/sOeahGtleSzpu5jorqTlgLwncGljRGVzYydcbiAqIEBjb25maWcge051bWJlcn0gdmFycy5tYXhTaXplIOaWh+S7tueahOacgOWkp+S9k+enryzljZXkvY0nTUInXG4gKiBAY29uZmlnIHtOdW1iZXJ9IHZhcnMuY29tcHJlc3NTaXplIOS4iuS8oOWJjeWmguaenOWbvueJh+S9k+enr+i2hei/h+ivpeWAvO+8jOS8muWFiOWOi+e8qVxuICogQGNvbmZpZyB7TnVtYmVyfSB2YXJzLm1heE51bTozMiDmnIDlpKfkuIrkvKDlpJrlsJHkuKrmlofku7ZcbiAqIEBjb25maWcge051bWJlcn0gdmFycy5jb21wcmVzc0xlbmd0aCDog73mjqXlj5fnmoTmnIDlpKfovrnplb/vvIzotoXov4for6XlgLzkvJrnrYnmr5TljovnvKlcbiAqIEBjb25maWcge1N0cmluZ30gdmFycy51cmwg5LiK5Lyg55qEdXJs5Zyw5Z2AXG4gKiBAY29uZmlnIHtOdW1iZXJ9IHZhcnMubW9kZSBtb2RlID09IDDml7bvvIzmmK/kvb/nlKjmu5rliqjmnaHvvIxtb2RlID09IDHml7bvvIzmi4nkvLhmbGFzaCwg6buY6K6k5YC85Li6MFxuICogQHNlZSBiYWlkdS5zd2YuY3JlYXRlSFRNTFxuICogQHBhcmFtIHtTdHJpbmd9IGJhY2tncm91bmRVcmwg6IOM5pmv5Zu+54mH6Lev5b6EXG4gKiBAcGFyYW0ge1N0cmluZ30gbGlzdEJhY2dyb3VuZGtVcmwg5biD5bGA5o6n5Lu26IOM5pmvXG4gKiBAcGFyYW0ge1N0cmluZ30gYnV0dG9uVXJsIOaMiemSruWbvueJh+S4jeiDjOaZr1xuICogQHBhcmFtIHtTdHJpbmd8RnVuY3Rpb259IHNlbGVjdEZpbGVDYWxsYmFjayDpgInmi6nmlofku7bnmoTlm57osINcbiAqIEBwYXJhbSB7U3RyaW5nfEZ1bmN0aW9ufSBleGNlZWRGaWxlQ2FsbGJhY2vmlofku7botoXlh7rpmZDliLbnmoTmnIDlpKfkvZPnp6/ml7bnmoTlm57osINcbiAqIEBwYXJhbSB7U3RyaW5nfEZ1bmN0aW9ufSBkZWxldGVGaWxlQ2FsbGJhY2sg5Yig6Zmk5paH5Lu255qE5Zue6LCDXG4gKiBAcGFyYW0ge1N0cmluZ3xGdW5jdGlvbn0gc3RhcnRVcGxvYWRDYWxsYmFjayDlvIDlp4vkuIrkvKDmn5DkuKrmlofku7bml7bnmoTlm57osINcbiAqIEBwYXJhbSB7U3RyaW5nfEZ1bmN0aW9ufSB1cGxvYWRDb21wbGV0ZUNhbGxiYWNrIOafkOS4quaWh+S7tuS4iuS8oOWujOaIkOeahOWbnuiwg1xuICogQHBhcmFtIHtTdHJpbmd8RnVuY3Rpb259IHVwbG9hZEVycm9yQ2FsbGJhY2sg5p+Q5Liq5paH5Lu25LiK5Lyg5aSx6LSl55qE5Zue6LCDXG4gKiBAcGFyYW0ge1N0cmluZ3xGdW5jdGlvbn0gYWxsQ29tcGxldGVDYWxsYmFjayDlhajpg6jkuIrkvKDlrozmiJDml7bnmoTlm57osINcbiAqIEBwYXJhbSB7U3RyaW5nfEZ1bmN0aW9ufSBjaGFuZ2VGbGFzaEhlaWdodCDmlLnlj5hGbGFzaOeahOmrmOW6pu+8jG1vZGU9PTHnmoTml7blgJnmiY3mnInnlKhcbiAqLyBcbmJhaWR1LmZsYXNoLmltYWdlVXBsb2FkZXIgPSBiYWlkdS5mbGFzaC5pbWFnZVVwbG9hZGVyIHx8IGZ1bmN0aW9uKG9wdGlvbnMpe1xuICAgXG4gICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge30sXG4gICAgICAgIF9mbGFzaCA9IG5ldyBiYWlkdS5mbGFzaC5fQmFzZShvcHRpb25zLCBbXG4gICAgICAgICAgICAnc2VsZWN0RmlsZUNhbGxiYWNrJywgXG4gICAgICAgICAgICAnZXhjZWVkRmlsZUNhbGxiYWNrJywgXG4gICAgICAgICAgICAnZGVsZXRlRmlsZUNhbGxiYWNrJywgXG4gICAgICAgICAgICAnc3RhcnRVcGxvYWRDYWxsYmFjaycsXG4gICAgICAgICAgICAndXBsb2FkQ29tcGxldGVDYWxsYmFjaycsXG4gICAgICAgICAgICAndXBsb2FkRXJyb3JDYWxsYmFjaycsXG4gICAgICAgICAgICAnYWxsQ29tcGxldGVDYWxsYmFjaycsXG4gICAgICAgICAgICAnY2hhbmdlRmxhc2hIZWlnaHQnXG4gICAgICAgIF0pO1xuICAgIC8qKlxuICAgICAqIOW8gOWni+aIluWbnuWkjeS4iuS8oOWbvueJh1xuICAgICAqIEBwdWJsaWNcbiAgICAgKiBAcmV0dXJuIHtOdWxsfVxuICAgICAqL1xuICAgIG1lLnVwbG9hZCA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIF9mbGFzaC5jYWxsKCd1cGxvYWQnKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICog5pqC5YGc5LiK5Lyg5Zu+54mHXG4gICAgICogQHB1YmxpY1xuICAgICAqIEByZXR1cm4ge051bGx9XG4gICAgICovXG4gICAgbWUucGF1c2UgPSBmdW5jdGlvbigpe1xuICAgICAgICBfZmxhc2guY2FsbCgncGF1c2UnKTtcbiAgICB9O1xuICAgIG1lLmFkZEN1c3RvbWl6ZWRQYXJhbXMgPSBmdW5jdGlvbihpbmRleCxvYmope1xuICAgICAgICBfZmxhc2guY2FsbCgnYWRkQ3VzdG9taXplZFBhcmFtcycsW2luZGV4LG9ial0pO1xuICAgIH1cbn07XG5cbi8qKlxuICog5pON5L2c5Y6f55Sf5a+56LGh55qE5pa55rOVXG4gKiBAbmFtZXNwYWNlIGJhaWR1Lm9iamVjdFxuICovXG5iYWlkdS5vYmplY3QgPSBiYWlkdS5vYmplY3QgfHwge307XG5cblxuLyoqXG4gKiDlsIbmupDlr7nosaHnmoTmiYDmnInlsZ7mgKfmi7fotJ3liLDnm67moIflr7nosaHkuK1cbiAqIEBhdXRob3IgZXJpa1xuICogQG5hbWUgYmFpZHUub2JqZWN0LmV4dGVuZFxuICogQGZ1bmN0aW9uXG4gKiBAZ3JhbW1hciBiYWlkdS5vYmplY3QuZXh0ZW5kKHRhcmdldCwgc291cmNlKVxuICogQHBhcmFtIHtPYmplY3R9IHRhcmdldCDnm67moIflr7nosaFcbiAqIEBwYXJhbSB7T2JqZWN0fSBzb3VyY2Ug5rqQ5a+56LGhXG4gKiBAc2VlIGJhaWR1LmFycmF5Lm1lcmdlXG4gKiBAcmVtYXJrXG4gKiBcbjEu55uu5qCH5a+56LGh5Lit77yM5LiO5rqQ5a+56LGha2V555u45ZCM55qE5oiQ5ZGY5bCG5Lya6KKr6KaG55uW44CCPGJyPlxuMi7mupDlr7nosaHnmoRwcm90b3R5cGXmiJDlkZjkuI3kvJrmi7fotJ3jgIJcblx0XHRcbiAqIEBzaG9ydGN1dCBleHRlbmRcbiAqIEBtZXRhIHN0YW5kYXJkXG4gKiAgICAgICAgICAgICBcbiAqIEByZXR1cm5zIHtPYmplY3R9IOebruagh+WvueixoVxuICovXG5iYWlkdS5leHRlbmQgPVxuYmFpZHUub2JqZWN0LmV4dGVuZCA9IGZ1bmN0aW9uICh0YXJnZXQsIHNvdXJjZSkge1xuICAgIGZvciAodmFyIHAgaW4gc291cmNlKSB7XG4gICAgICAgIGlmIChzb3VyY2UuaGFzT3duUHJvcGVydHkocCkpIHtcbiAgICAgICAgICAgIHRhcmdldFtwXSA9IHNvdXJjZVtwXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdGFyZ2V0O1xufTtcblxuXG5cblxuXG4vKipcbiAqIOWIm+W7umZsYXNoIGJhc2VkIGZpbGVVcGxvYWRlclxuICogQGNsYXNzXG4gKiBAZ3JhbW1hciBiYWlkdS5mbGFzaC5maWxlVXBsb2FkZXIob3B0aW9ucylcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAY29uZmlnIHtPYmplY3R9IGNyZWF0ZU9wdGlvbnMg5Yib5bu6Zmxhc2jml7bpnIDopoHnmoTlj4LmlbDvvIzor7flj4LnhadiYWlkdS5zd2YuY3JlYXRl5paH5qGjXG4gKiBAY29uZmlnIHtTdHJpbmd9IGNyZWF0ZU9wdGlvbnMud2lkdGhcbiAqIEBjb25maWcge1N0cmluZ30gY3JlYXRlT3B0aW9ucy5oZWlnaHRcbiAqIEBjb25maWcge051bWJlcn0gbWF4TnVtIOacgOWkp+WPr+mAieaWh+S7tuaVsFxuICogQGNvbmZpZyB7RnVuY3Rpb258U3RyaW5nfSBzZWxlY3RGaWxlXG4gKiBAY29uZmlnIHtGdW5jdGlvbnxTdHJpbmd9IGV4Y2VlZE1heFNpemVcbiAqIEBjb25maWcge0Z1bmN0aW9ufFN0cmluZ30gZGVsZXRlRmlsZVxuICogQGNvbmZpZyB7RnVuY3Rpb258U3RyaW5nfSB1cGxvYWRTdGFydFxuICogQGNvbmZpZyB7RnVuY3Rpb258U3RyaW5nfSB1cGxvYWRDb21wbGV0ZVxuICogQGNvbmZpZyB7RnVuY3Rpb258U3RyaW5nfSB1cGxvYWRFcnJvclxuICogQGNvbmZpZyB7RnVuY3Rpb258U3RyaW5nfSB1cGxvYWRQcm9ncmVzc1xuICovXG5iYWlkdS5mbGFzaC5maWxlVXBsb2FkZXIgPSBiYWlkdS5mbGFzaC5maWxlVXBsb2FkZXIgfHwgZnVuY3Rpb24ob3B0aW9ucyl7XG4gICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgXG4gICAgb3B0aW9ucy5jcmVhdGVPcHRpb25zID0gYmFpZHUuZXh0ZW5kKHtcbiAgICAgICAgd21vZDogJ3RyYW5zcGFyZW50J1xuICAgIH0sb3B0aW9ucy5jcmVhdGVPcHRpb25zIHx8IHt9KTtcbiAgICBcbiAgICB2YXIgX2ZsYXNoID0gbmV3IGJhaWR1LmZsYXNoLl9CYXNlKG9wdGlvbnMsIFtcbiAgICAgICAgJ3NlbGVjdEZpbGUnLFxuICAgICAgICAnZXhjZWVkTWF4U2l6ZScsXG4gICAgICAgICdkZWxldGVGaWxlJyxcbiAgICAgICAgJ3VwbG9hZFN0YXJ0JyxcbiAgICAgICAgJ3VwbG9hZENvbXBsZXRlJyxcbiAgICAgICAgJ3VwbG9hZEVycm9yJywgXG4gICAgICAgICd1cGxvYWRQcm9ncmVzcydcbiAgICBdKTtcblxuICAgIF9mbGFzaC5jYWxsKCdzZXRNYXhOdW0nLCBvcHRpb25zLm1heE51bSA/IFtvcHRpb25zLm1heE51bV0gOiBbMV0pO1xuXG4gICAgLyoqXG4gICAgICog6K6+572u5b2T6byg5qCH56e75Yqo5YiwZmxhc2jkuIrml7bvvIzmmK/lkKblj5jmiJDmiYvlnotcbiAgICAgKiBAcHVibGljXG4gICAgICogQHBhcmFtIHtCb29sZWFufSBpc0N1cnNvclxuICAgICAqIEByZXR1cm4ge051bGx9XG4gICAgICovXG4gICAgbWUuc2V0SGFuZEN1cnNvciA9IGZ1bmN0aW9uKGlzQ3Vyc29yKXtcbiAgICAgICAgX2ZsYXNoLmNhbGwoJ3NldEhhbmRDdXJzb3InLCBbaXNDdXJzb3IgfHwgZmFsc2VdKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICog6K6+572u6byg5qCH55u45bqU5Ye95pWw5ZCNXG4gICAgICogQHBhcmFtIHtTdHJpbmd8RnVuY3Rpb259IGZ1blxuICAgICAqL1xuICAgIG1lLnNldE1TRnVuTmFtZSA9IGZ1bmN0aW9uKGZ1bil7XG4gICAgICAgIF9mbGFzaC5jYWxsKCdzZXRNU0Z1bk5hbWUnLFtfZmxhc2guY3JlYXRlRnVuTmFtZShmdW4pXSk7XG4gICAgfTsgXG5cbiAgICAvKipcbiAgICAgKiDmiafooYzkuIrkvKDmk43kvZxcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdXJsIOS4iuS8oOeahHVybFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBmaWVsZE5hbWUg5LiK5Lyg55qE6KGo5Y2V5a2X5q615ZCNXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHBvc3REYXRhIOmUruWAvOWvue+8jOS4iuS8oOeahFBPU1TmlbDmja5cbiAgICAgKiBAcGFyYW0ge051bWJlcnxBcnJheXxudWxsfC0xfSBbaW5kZXhd5LiK5Lyg55qE5paH5Lu25bqP5YiXXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgSW505YC85LiK5Lyg6K+l5paH5Lu2XG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgQXJyYXnkuIDmrKHkuLLooYzkuIrkvKDor6Xluo/liJfmlofku7ZcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAtMS9udWxs5LiK5Lyg5omA5pyJ5paH5Lu2XG4gICAgICogQHJldHVybiB7TnVsbH1cbiAgICAgKi9cbiAgICBtZS51cGxvYWQgPSBmdW5jdGlvbih1cmwsIGZpZWxkTmFtZSwgcG9zdERhdGEsIGluZGV4KXtcblxuICAgICAgICBpZih0eXBlb2YgdXJsICE9PSAnc3RyaW5nJyB8fCB0eXBlb2YgZmllbGROYW1lICE9PSAnc3RyaW5nJykgcmV0dXJuIG51bGw7XG4gICAgICAgIGlmKHR5cGVvZiBpbmRleCA9PT0gJ3VuZGVmaW5lZCcpIGluZGV4ID0gLTE7XG5cbiAgICAgICAgX2ZsYXNoLmNhbGwoJ3VwbG9hZCcsIFt1cmwsIGZpZWxkTmFtZSwgcG9zdERhdGEsIGluZGV4XSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIOWPlua2iOS4iuS8oOaTjeS9nFxuICAgICAqIEBwdWJsaWNcbiAgICAgKiBAcGFyYW0ge051bWJlcnwtMX0gaW5kZXhcbiAgICAgKi9cbiAgICBtZS5jYW5jZWwgPSBmdW5jdGlvbihpbmRleCl7XG4gICAgICAgIGlmKHR5cGVvZiBpbmRleCA9PT0gJ3VuZGVmaW5lZCcpIGluZGV4ID0gLTE7XG4gICAgICAgIF9mbGFzaC5jYWxsKCdjYW5jZWwnLCBbaW5kZXhdKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICog5Yig6Zmk5paH5Lu2XG4gICAgICogQHB1YmxpY1xuICAgICAqIEBwYXJhbSB7TnVtYmVyfEFycmF5fSBbaW5kZXhdIOimgeWIoOmZpOeahGluZGV477yM5LiN5Lyg5YiZ5YWo6YOo5Yig6ZmkXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbEJhY2tcbiAgICAgKiAqL1xuICAgIG1lLmRlbGV0ZUZpbGUgPSBmdW5jdGlvbihpbmRleCwgY2FsbEJhY2spe1xuXG4gICAgICAgIHZhciBjYWxsQmFja0FsbCA9IGZ1bmN0aW9uKGxpc3Qpe1xuICAgICAgICAgICAgICAgIGNhbGxCYWNrICYmIGNhbGxCYWNrKGxpc3QpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICBpZih0eXBlb2YgaW5kZXggPT09ICd1bmRlZmluZWQnKXtcbiAgICAgICAgICAgIF9mbGFzaC5jYWxsKCdkZWxldGVGaWxlc0FsbCcsIFtdLCBjYWxsQmFja0FsbCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICBpZih0eXBlb2YgaW5kZXggPT09ICdOdW1iZXInKSBpbmRleCA9IFtpbmRleF07XG4gICAgICAgIGluZGV4LnNvcnQoZnVuY3Rpb24oYSxiKXtcbiAgICAgICAgICAgIHJldHVybiBiLWE7XG4gICAgICAgIH0pO1xuICAgICAgICBiYWlkdS5lYWNoKGluZGV4LCBmdW5jdGlvbihpdGVtKXtcbiAgICAgICAgICAgIF9mbGFzaC5jYWxsKCdkZWxldGVGaWxlQnknLCBpdGVtLCBjYWxsQmFja0FsbCk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiDmt7vliqDmlofku7bnsbvlnovvvIzmlK/mjIFtYWNUeXBlXG4gICAgICogQHB1YmxpY1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fEFycmF5W09iamVjdF19IHR5cGUge2Rlc2NyaXB0aW9uOlN0cmluZywgZXh0ZW50aW9uOlN0cmluZ31cbiAgICAgKiBAcmV0dXJuIHtOdWxsfTtcbiAgICAgKi9cbiAgICBtZS5hZGRGaWxlVHlwZSA9IGZ1bmN0aW9uKHR5cGUpe1xuICAgICAgICB2YXIgdHlwZSA9IHR5cGUgfHwgW1tdXTtcbiAgICAgICAgXG4gICAgICAgIGlmKHR5cGUgaW5zdGFuY2VvZiBBcnJheSkgdHlwZSA9IFt0eXBlXTtcbiAgICAgICAgZWxzZSB0eXBlID0gW1t0eXBlXV07XG4gICAgICAgIF9mbGFzaC5jYWxsKCdhZGRGaWxlVHlwZXMnLCB0eXBlKTtcbiAgICB9O1xuICAgIFxuICAgIC8qKlxuICAgICAqIOiuvue9ruaWh+S7tuexu+Wei++8jOaUr+aMgW1hY1R5cGVcbiAgICAgKiBAcHVibGljXG4gICAgICogQHBhcmFtIHtPYmplY3R8QXJyYXlbT2JqZWN0XX0gdHlwZSB7ZGVzY3JpcHRpb246U3RyaW5nLCBleHRlbnRpb246U3RyaW5nfVxuICAgICAqIEByZXR1cm4ge051bGx9O1xuICAgICAqL1xuICAgIG1lLnNldEZpbGVUeXBlID0gZnVuY3Rpb24odHlwZSl7XG4gICAgICAgIHZhciB0eXBlID0gdHlwZSB8fCBbW11dO1xuICAgICAgICBcbiAgICAgICAgaWYodHlwZSBpbnN0YW5jZW9mIEFycmF5KSB0eXBlID0gW3R5cGVdO1xuICAgICAgICBlbHNlIHR5cGUgPSBbW3R5cGVdXTtcbiAgICAgICAgX2ZsYXNoLmNhbGwoJ3NldEZpbGVUeXBlcycsIHR5cGUpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiDorr7nva7lj6/pgInmlofku7bnmoTmlbDph4/pmZDliLZcbiAgICAgKiBAcHVibGljXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IG51bVxuICAgICAqIEByZXR1cm4ge051bGx9XG4gICAgICovXG4gICAgbWUuc2V0TWF4TnVtID0gZnVuY3Rpb24obnVtKXtcbiAgICAgICAgX2ZsYXNoLmNhbGwoJ3NldE1heE51bScsIFtudW1dKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICog6K6+572u5Y+v6YCJ5paH5Lu25aSn5bCP6ZmQ5Yi277yM5Lul5YWGTeS4uuWNleS9jVxuICAgICAqIEBwdWJsaWNcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gbnVtLDDkuLrml6DpmZDliLZcbiAgICAgKiBAcmV0dXJuIHtOdWxsfVxuICAgICAqL1xuICAgIG1lLnNldE1heFNpemUgPSBmdW5jdGlvbihudW0pe1xuICAgICAgICBfZmxhc2guY2FsbCgnc2V0TWF4U2l6ZScsIFtudW1dKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQHB1YmxpY1xuICAgICAqL1xuICAgIG1lLmdldEZpbGVBbGwgPSBmdW5jdGlvbihjYWxsQmFjayl7XG4gICAgICAgIF9mbGFzaC5jYWxsKCdnZXRGaWxlQWxsJywgW10sIGNhbGxCYWNrKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQHB1YmxpY1xuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBpbmRleFxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IFtjYWxsQmFja11cbiAgICAgKi9cbiAgICBtZS5nZXRGaWxlQnlJbmRleCA9IGZ1bmN0aW9uKGluZGV4LCBjYWxsQmFjayl7XG4gICAgICAgIF9mbGFzaC5jYWxsKCdnZXRGaWxlQnlJbmRleCcsIFtdLCBjYWxsQmFjayk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gaW5kZXhcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBbY2FsbEJhY2tdXG4gICAgICovXG4gICAgbWUuZ2V0U3RhdHVzQnlJbmRleCA9IGZ1bmN0aW9uKGluZGV4LCBjYWxsQmFjayl7XG4gICAgICAgIF9mbGFzaC5jYWxsKCdnZXRTdGF0dXNCeUluZGV4JywgW10sIGNhbGxCYWNrKTtcbiAgICB9O1xufTtcblxuLyoqXG4gKiDkvb/nlKjliqjmgIFzY3JpcHTmoIfnrb7or7fmsYLmnI3liqHlmajotYTmupDvvIzljIXmi6znlLHmnI3liqHlmajnq6/nmoTlm57osIPlkozmtY/op4jlmajnq6/nmoTlm57osINcbiAqIEBuYW1lc3BhY2UgYmFpZHUuc2lvXG4gKi9cbmJhaWR1LnNpbyA9IGJhaWR1LnNpbyB8fCB7fTtcblxuLyoqXG4gKiBcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IHNyYyBzY3JpcHToioLngrlcbiAqIEBwYXJhbSB7U3RyaW5nfSB1cmwgc2NyaXB06IqC54K555qE5Zyw5Z2AXG4gKiBAcGFyYW0ge1N0cmluZ30gW2NoYXJzZXRdIOe8lueggVxuICovXG5iYWlkdS5zaW8uX2NyZWF0ZVNjcmlwdFRhZyA9IGZ1bmN0aW9uKHNjciwgdXJsLCBjaGFyc2V0KXtcbiAgICBzY3Iuc2V0QXR0cmlidXRlKCd0eXBlJywgJ3RleHQvamF2YXNjcmlwdCcpO1xuICAgIGNoYXJzZXQgJiYgc2NyLnNldEF0dHJpYnV0ZSgnY2hhcnNldCcsIGNoYXJzZXQpO1xuICAgIHNjci5zZXRBdHRyaWJ1dGUoJ3NyYycsIHVybCk7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXS5hcHBlbmRDaGlsZChzY3IpO1xufTtcblxuLyoqXG4gKiDliKDpmaRzY3JpcHTnmoTlsZ7mgKfvvIzlho3liKDpmaRzY3JpcHTmoIfnrb7vvIzku6Xop6PlhrPkv67lpI3lhoXlrZjms4TmvI/nmoTpl67pophcbiAqIFxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gc3JjIHNjcmlwdOiKgueCuVxuICovXG5iYWlkdS5zaW8uX3JlbW92ZVNjcmlwdFRhZyA9IGZ1bmN0aW9uKHNjcil7XG4gICAgaWYgKHNjci5jbGVhckF0dHJpYnV0ZXMpIHtcbiAgICAgICAgc2NyLmNsZWFyQXR0cmlidXRlcygpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAodmFyIGF0dHIgaW4gc2NyKSB7XG4gICAgICAgICAgICBpZiAoc2NyLmhhc093blByb3BlcnR5KGF0dHIpKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHNjclthdHRyXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBpZihzY3IgJiYgc2NyLnBhcmVudE5vZGUpe1xuICAgICAgICBzY3IucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChzY3IpO1xuICAgIH1cbiAgICBzY3IgPSBudWxsO1xufTtcblxuXG4vKipcbiAqIOmAmui/h3NjcmlwdOagh+etvuWKoOi9veaVsOaNru+8jOWKoOi9veWujOaIkOeUsea1j+iniOWZqOerr+inpuWPkeWbnuiwg1xuICogQG5hbWUgYmFpZHUuc2lvLmNhbGxCeUJyb3dzZXJcbiAqIEBmdW5jdGlvblxuICogQGdyYW1tYXIgYmFpZHUuc2lvLmNhbGxCeUJyb3dzZXIodXJsLCBvcHRfY2FsbGJhY2ssIG9wdF9vcHRpb25zKVxuICogQHBhcmFtIHtzdHJpbmd9IHVybCDliqDovb3mlbDmja7nmoR1cmxcbiAqIEBwYXJhbSB7RnVuY3Rpb258c3RyaW5nfSBvcHRfY2FsbGJhY2sg5pWw5o2u5Yqg6L2957uT5p2f5pe26LCD55So55qE5Ye95pWw5oiW5Ye95pWw5ZCNXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0X29wdGlvbnMg5YW25LuW5Y+v6YCJ6aG5XG4gKiBAY29uZmlnIHtTdHJpbmd9IFtjaGFyc2V0XSBzY3JpcHTnmoTlrZfnrKbpm4ZcbiAqIEBjb25maWcge0ludGVnZXJ9IFt0aW1lT3V0XSDotoXml7bml7bpl7TvvIzotoXov4fov5nkuKrml7bpl7TlsIbkuI3lho3lk43lupTmnKzor7fmsYLvvIzlubbop6blj5FvbmZhaWx1cmXlh73mlbBcbiAqIEBjb25maWcge0Z1bmN0aW9ufSBbb25mYWlsdXJlXSB0aW1lT3V06K6+5a6a5ZCO5omN55Sf5pWI77yM5Yiw6L6+6LaF5pe25pe26Ze05pe26Kem5Y+R5pys5Ye95pWwXG4gKiBAcmVtYXJrXG4gKiAx44CB5LiOY2FsbEJ5U2VydmVy5LiN5ZCM77yMY2FsbGJhY2vlj4LmlbDlj6rmlK/mjIFGdW5jdGlvbuexu+Wei++8jOS4jeaUr+aMgXN0cmluZ+OAglxuICogMuOAgeWmguaenOivt+axguS6huS4gOS4quS4jeWtmOWcqOeahOmhtemdou+8jGNhbGxiYWNr5Ye95pWw5ZyoSUUvb3BlcmHkuIvkuZ/kvJrooqvosIPnlKjvvIzlm6DmraTkvb/nlKjogIXpnIDopoHlnKhvbnN1Y2Nlc3Plh73mlbDkuK3liKTmlq3mlbDmja7mmK/lkKbmraPnoa7liqDovb3jgIJcbiAqIEBtZXRhIHN0YW5kYXJkXG4gKiBAc2VlIGJhaWR1LnNpby5jYWxsQnlTZXJ2ZXJcbiAqL1xuYmFpZHUuc2lvLmNhbGxCeUJyb3dzZXIgPSBmdW5jdGlvbiAodXJsLCBvcHRfY2FsbGJhY2ssIG9wdF9vcHRpb25zKSB7XG4gICAgdmFyIHNjciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJTQ1JJUFRcIiksXG4gICAgICAgIHNjcmlwdExvYWRlZCA9IDAsXG4gICAgICAgIG9wdGlvbnMgPSBvcHRfb3B0aW9ucyB8fCB7fSxcbiAgICAgICAgY2hhcnNldCA9IG9wdGlvbnNbJ2NoYXJzZXQnXSxcbiAgICAgICAgY2FsbGJhY2sgPSBvcHRfY2FsbGJhY2sgfHwgZnVuY3Rpb24oKXt9LFxuICAgICAgICB0aW1lT3V0ID0gb3B0aW9uc1sndGltZU91dCddIHx8IDAsXG4gICAgICAgIHRpbWVyO1xuICAgIHNjci5vbmxvYWQgPSBzY3Iub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoc2NyaXB0TG9hZGVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHZhciByZWFkeVN0YXRlID0gc2NyLnJlYWR5U3RhdGU7XG4gICAgICAgIGlmICgndW5kZWZpbmVkJyA9PSB0eXBlb2YgcmVhZHlTdGF0ZVxuICAgICAgICAgICAgfHwgcmVhZHlTdGF0ZSA9PSBcImxvYWRlZFwiXG4gICAgICAgICAgICB8fCByZWFkeVN0YXRlID09IFwiY29tcGxldGVcIikge1xuICAgICAgICAgICAgc2NyaXB0TG9hZGVkID0gMTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICBzY3Iub25sb2FkID0gc2NyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgYmFpZHUuc2lvLl9yZW1vdmVTY3JpcHRUYWcoc2NyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBpZiggdGltZU91dCApe1xuICAgICAgICB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHNjci5vbmxvYWQgPSBzY3Iub25yZWFkeXN0YXRlY2hhbmdlID0gbnVsbDtcbiAgICAgICAgICAgIGJhaWR1LnNpby5fcmVtb3ZlU2NyaXB0VGFnKHNjcik7XG4gICAgICAgICAgICBvcHRpb25zLm9uZmFpbHVyZSAmJiBvcHRpb25zLm9uZmFpbHVyZSgpO1xuICAgICAgICB9LCB0aW1lT3V0KTtcbiAgICB9XG4gICAgXG4gICAgYmFpZHUuc2lvLl9jcmVhdGVTY3JpcHRUYWcoc2NyLCB1cmwsIGNoYXJzZXQpO1xufTtcblxuLyoqXG4gKiDpgJrov4dzY3JpcHTmoIfnrb7liqDovb3mlbDmja7vvIzliqDovb3lrozmiJDnlLHmnI3liqHlmajnq6/op6blj5Hlm57osINcbiAqIEBuYW1lIGJhaWR1LnNpby5jYWxsQnlTZXJ2ZXJcbiAqIEBmdW5jdGlvblxuICogQGdyYW1tYXIgYmFpZHUuc2lvLmNhbGxCeVNlcnZlcih1cmwsIGNhbGxiYWNrWywgb3B0X29wdGlvbnNdKVxuICogQHBhcmFtIHtzdHJpbmd9IHVybCDliqDovb3mlbDmja7nmoR1cmwuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufHN0cmluZ30gY2FsbGJhY2sg5pyN5Yqh5Zmo56uv6LCD55So55qE5Ye95pWw5oiW5Ye95pWw5ZCN44CC5aaC5p6c5rKh5pyJ5oyH5a6a5pys5Y+C5pWw77yM5bCG5ZyoVVJM5Lit5a+75om+b3B0aW9uc1sncXVlcnlGaWVsZCdd5YGa5Li6Y2FsbGJhY2vnmoTmlrnms5XlkI0uXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0X29wdGlvbnMg5Yqg6L295pWw5o2u5pe255qE6YCJ6aG5LlxuICogQGNvbmZpZyB7c3RyaW5nfSBbY2hhcnNldF0gc2NyaXB055qE5a2X56ym6ZuGXG4gKiBAY29uZmlnIHtzdHJpbmd9IFtxdWVyeUZpZWxkXSDmnI3liqHlmajnq69jYWxsYmFja+ivt+axguWtl+auteWQje+8jOm7mOiupOS4umNhbGxiYWNrXG4gKiBAY29uZmlnIHtJbnRlZ2VyfSBbdGltZU91dF0g6LaF5pe25pe26Ze0KOWNleS9je+8mm1zKe+8jOi2hei/h+i/meS4quaXtumXtOWwhuS4jeWGjeWTjeW6lOacrOivt+axgu+8jOW5tuinpuWPkW9uZmFpbHVyZeWHveaVsFxuICogQGNvbmZpZyB7RnVuY3Rpb259IFtvbmZhaWx1cmVdIHRpbWVPdXTorr7lrprlkI7miY3nlJ/mlYjvvIzliLDovr7otoXml7bml7bpl7Tml7bop6blj5HmnKzlh73mlbBcbiAqIEByZW1hcmtcbiAqIOWmguaenHVybOS4reW3sue7j+WMheWQq2tleeS4uuKAnG9wdGlvbnNbJ3F1ZXJ5RmllbGQnXeKAneeahHF1ZXJ56aG577yM5bCG5Lya6KKr5pu/5o2i5oiQY2FsbGJhY2vkuK3lj4LmlbDkvKDpgJLmiJboh6rliqjnlJ/miJDnmoTlh73mlbDlkI3jgIJcbiAqIEBtZXRhIHN0YW5kYXJkXG4gKiBAc2VlIGJhaWR1LnNpby5jYWxsQnlCcm93c2VyXG4gKi9cbmJhaWR1LnNpby5jYWxsQnlTZXJ2ZXIgPSAvKipAZnVuY3Rpb24qL2Z1bmN0aW9uKHVybCwgY2FsbGJhY2ssIG9wdF9vcHRpb25zKSB7XG4gICAgdmFyIHNjciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ1NDUklQVCcpLFxuICAgICAgICBwcmVmaXggPSAnYmRfX2Nic19fJyxcbiAgICAgICAgY2FsbGJhY2tOYW1lLFxuICAgICAgICBjYWxsYmFja0ltcGwsXG4gICAgICAgIG9wdGlvbnMgPSBvcHRfb3B0aW9ucyB8fCB7fSxcbiAgICAgICAgY2hhcnNldCA9IG9wdGlvbnNbJ2NoYXJzZXQnXSxcbiAgICAgICAgcXVlcnlGaWVsZCA9IG9wdGlvbnNbJ3F1ZXJ5RmllbGQnXSB8fCAnY2FsbGJhY2snLFxuICAgICAgICB0aW1lT3V0ID0gb3B0aW9uc1sndGltZU91dCddIHx8IDAsXG4gICAgICAgIHRpbWVyLFxuICAgICAgICByZWcgPSBuZXcgUmVnRXhwKCcoXFxcXD98JiknICsgcXVlcnlGaWVsZCArICc9KFteJl0qKScpLFxuICAgICAgICBtYXRjaGVzO1xuXG4gICAgaWYgKGJhaWR1LmxhbmcuaXNGdW5jdGlvbihjYWxsYmFjaykpIHtcbiAgICAgICAgY2FsbGJhY2tOYW1lID0gcHJlZml4ICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMjE0NzQ4MzY0OCkudG9TdHJpbmcoMzYpO1xuICAgICAgICB3aW5kb3dbY2FsbGJhY2tOYW1lXSA9IGdldENhbGxCYWNrKDApO1xuICAgIH0gZWxzZSBpZihiYWlkdS5sYW5nLmlzU3RyaW5nKGNhbGxiYWNrKSl7XG4gICAgICAgIGNhbGxiYWNrTmFtZSA9IGNhbGxiYWNrO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChtYXRjaGVzID0gcmVnLmV4ZWModXJsKSkge1xuICAgICAgICAgICAgY2FsbGJhY2tOYW1lID0gbWF0Y2hlc1syXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmKCB0aW1lT3V0ICl7XG4gICAgICAgIHRpbWVyID0gc2V0VGltZW91dChnZXRDYWxsQmFjaygxKSwgdGltZU91dCk7XG4gICAgfVxuICAgIHVybCA9IHVybC5yZXBsYWNlKHJlZywgJ1xceDI0MScgKyBxdWVyeUZpZWxkICsgJz0nICsgY2FsbGJhY2tOYW1lKTtcbiAgICBcbiAgICBpZiAodXJsLnNlYXJjaChyZWcpIDwgMCkge1xuICAgICAgICB1cmwgKz0gKHVybC5pbmRleE9mKCc/JykgPCAwID8gJz8nIDogJyYnKSArIHF1ZXJ5RmllbGQgKyAnPScgKyBjYWxsYmFja05hbWU7XG4gICAgfVxuICAgIGJhaWR1LnNpby5fY3JlYXRlU2NyaXB0VGFnKHNjciwgdXJsLCBjaGFyc2V0KTtcblxuICAgIC8qXG4gICAgICog6L+U5Zue5LiA5Liq5Ye95pWw77yM55So5LqO56uL5Y2z77yI5oyC5Zyod2luZG935LiK77yJ5oiW6ICF6LaF5pe277yI5oyC5Zyoc2V0VGltZW91dOS4re+8ieaXtuaJp+ihjFxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGdldENhbGxCYWNrKG9uVGltZU91dCl7XG4gICAgICAgIC8qZ2xvYmFsIGNhbGxiYWNrTmFtZSwgY2FsbGJhY2ssIHNjciwgb3B0aW9uczsqL1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYoIG9uVGltZU91dCApe1xuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLm9uZmFpbHVyZSAmJiBvcHRpb25zLm9uZmFpbHVyZSgpO1xuICAgICAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjay5hcHBseSh3aW5kb3csIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHdpbmRvd1tjYWxsYmFja05hbWVdID0gbnVsbDtcbiAgICAgICAgICAgICAgICBkZWxldGUgd2luZG93W2NhbGxiYWNrTmFtZV07XG4gICAgICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgYmFpZHUuc2lvLl9yZW1vdmVTY3JpcHRUYWcoc2NyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn07XG5cbi8qKlxuICog6YCa6L+H6K+35rGC5LiA5Liq5Zu+54mH55qE5pa55byP5Luk5pyN5Yqh5Zmo5a2Y5YKo5LiA5p2h5pel5b+XXG4gKiBAZnVuY3Rpb25cbiAqIEBncmFtbWFyIGJhaWR1LnNpby5sb2codXJsKVxuICogQHBhcmFtIHtzdHJpbmd9IHVybCDopoHlj5HpgIHnmoTlnLDlnYAuXG4gKiBAYXV0aG9yOiBpbnQwOGgsbGVlaWdodFxuICovXG5iYWlkdS5zaW8ubG9nID0gZnVuY3Rpb24odXJsKSB7XG4gIHZhciBpbWcgPSBuZXcgSW1hZ2UoKSxcbiAgICAgIGtleSA9ICd0YW5ncmFtX3Npb19sb2dfJyArIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqXG4gICAgICAgICAgICAyMTQ3NDgzNjQ4KS50b1N0cmluZygzNik7XG4gIHdpbmRvd1trZXldID0gaW1nO1xuXG4gIGltZy5vbmxvYWQgPSBpbWcub25lcnJvciA9IGltZy5vbmFib3J0ID0gZnVuY3Rpb24oKSB7XG4gICAgaW1nLm9ubG9hZCA9IGltZy5vbmVycm9yID0gaW1nLm9uYWJvcnQgPSBudWxsO1xuXG4gICAgd2luZG93W2tleV0gPSBudWxsO1xuICAgIGltZyA9IG51bGw7XG4gIH07XG4gIGltZy5zcmMgPSB1cmw7XG59O1xuXG5cblxuLypcbiAqIFRhbmdyYW1cbiAqIENvcHlyaWdodCAyMDA5IEJhaWR1IEluYy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqIFxuICogcGF0aDogYmFpZHUvanNvbi5qc1xuICogYXV0aG9yOiBlcmlrXG4gKiB2ZXJzaW9uOiAxLjEuMFxuICogZGF0ZTogMjAwOS8xMi8wMlxuICovXG5cblxuLyoqXG4gKiDmk43kvZxqc29u5a+56LGh55qE5pa55rOVXG4gKiBAbmFtZXNwYWNlIGJhaWR1Lmpzb25cbiAqL1xuYmFpZHUuanNvbiA9IGJhaWR1Lmpzb24gfHwge307XG4vKlxuICogVGFuZ3JhbVxuICogQ29weXJpZ2h0IDIwMDkgQmFpZHUgSW5jLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogXG4gKiBwYXRoOiBiYWlkdS9qc29uL3BhcnNlLmpzXG4gKiBhdXRob3I6IGVyaWssIGJlcmdcbiAqIHZlcnNpb246IDEuMlxuICogZGF0ZTogMjAwOS8xMS8yM1xuICovXG5cblxuXG4vKipcbiAqIOWwhuWtl+espuS4suino+aekOaIkGpzb27lr7nosaHjgILms6jvvJrkuI3kvJroh6rliqjnpZvpmaTnqbrmoLxcbiAqIEBuYW1lIGJhaWR1Lmpzb24ucGFyc2VcbiAqIEBmdW5jdGlvblxuICogQGdyYW1tYXIgYmFpZHUuanNvbi5wYXJzZShkYXRhKVxuICogQHBhcmFtIHtzdHJpbmd9IHNvdXJjZSDpnIDopoHop6PmnpDnmoTlrZfnrKbkuLJcbiAqIEByZW1hcmtcbiAqIOivpeaWueazleeahOWunueOsOS4jmVjbWEtMjYy56ys5LqU54mI5Lit6KeE5a6a55qESlNPTi5wYXJzZeS4jeWQjO+8jOaaguaXtuWPquaUr+aMgeS8oOWFpeS4gOS4quWPguaVsOOAguWQjue7reS8mui/m+ihjOWKn+iDveS4sOWvjOOAglxuICogQG1ldGEgc3RhbmRhcmRcbiAqIEBzZWUgYmFpZHUuanNvbi5zdHJpbmdpZnksYmFpZHUuanNvbi5kZWNvZGVcbiAqICAgICAgICAgICAgIFxuICogQHJldHVybnMge0pTT059IOino+aekOe7k+aenGpzb27lr7nosaFcbiAqL1xuYmFpZHUuanNvbi5wYXJzZSA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgLy8yMDEwLzEyLzA577ya5pu05paw6Iez5LiN5L2/55So5Y6f55SfcGFyc2XvvIzkuI3mo4DmtYvnlKjmiLfovpPlhaXmmK/lkKbmraPnoa5cbiAgICByZXR1cm4gKG5ldyBGdW5jdGlvbihcInJldHVybiAoXCIgKyBkYXRhICsgXCIpXCIpKSgpO1xufTtcbi8qXG4gKiBUYW5ncmFtXG4gKiBDb3B5cmlnaHQgMjAwOSBCYWlkdSBJbmMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiBcbiAqIHBhdGg6IGJhaWR1L2pzb24vZGVjb2RlLmpzXG4gKiBhdXRob3I6IGVyaWssIGNhdFxuICogdmVyc2lvbjogMS4zLjRcbiAqIGRhdGU6IDIwMTAvMTIvMjNcbiAqL1xuXG5cblxuLyoqXG4gKiDlsIblrZfnrKbkuLLop6PmnpDmiJBqc29u5a+56LGh77yM5Li66L+H5pe25o6l5Y+j77yM5LuK5ZCO5Lya6KKrYmFpZHUuanNvbi5wYXJzZeS7o+abv1xuICogQG5hbWUgYmFpZHUuanNvbi5kZWNvZGVcbiAqIEBmdW5jdGlvblxuICogQGdyYW1tYXIgYmFpZHUuanNvbi5kZWNvZGUoc291cmNlKVxuICogQHBhcmFtIHtzdHJpbmd9IHNvdXJjZSDpnIDopoHop6PmnpDnmoTlrZfnrKbkuLJcbiAqIEBtZXRhIG91dFxuICogQHNlZSBiYWlkdS5qc29uLmVuY29kZSxiYWlkdS5qc29uLnBhcnNlXG4gKiAgICAgICAgICAgICBcbiAqIEByZXR1cm5zIHtKU09OfSDop6PmnpDnu5Pmnpxqc29u5a+56LGhXG4gKi9cbmJhaWR1Lmpzb24uZGVjb2RlID0gYmFpZHUuanNvbi5wYXJzZTtcbi8qXG4gKiBUYW5ncmFtXG4gKiBDb3B5cmlnaHQgMjAwOSBCYWlkdSBJbmMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiBcbiAqIHBhdGg6IGJhaWR1L2pzb24vc3RyaW5naWZ5LmpzXG4gKiBhdXRob3I6IGVyaWtcbiAqIHZlcnNpb246IDEuMS4wXG4gKiBkYXRlOiAyMDEwLzAxLzExXG4gKi9cblxuXG5cbi8qKlxuICog5bCGanNvbuWvueixoeW6j+WIl+WMllxuICogQG5hbWUgYmFpZHUuanNvbi5zdHJpbmdpZnlcbiAqIEBmdW5jdGlvblxuICogQGdyYW1tYXIgYmFpZHUuanNvbi5zdHJpbmdpZnkodmFsdWUpXG4gKiBAcGFyYW0ge0pTT059IHZhbHVlIOmcgOimgeW6j+WIl+WMlueahGpzb27lr7nosaFcbiAqIEByZW1hcmtcbiAqIOivpeaWueazleeahOWunueOsOS4jmVjbWEtMjYy56ys5LqU54mI5Lit6KeE5a6a55qESlNPTi5zdHJpbmdpZnnkuI3lkIzvvIzmmoLml7blj6rmlK/mjIHkvKDlhaXkuIDkuKrlj4LmlbDjgILlkI7nu63kvJrov5vooYzlip/og73kuLDlr4zjgIJcbiAqIEBtZXRhIHN0YW5kYXJkXG4gKiBAc2VlIGJhaWR1Lmpzb24ucGFyc2UsYmFpZHUuanNvbi5lbmNvZGVcbiAqICAgICAgICAgICAgIFxuICogQHJldHVybnMge3N0cmluZ30g5bqP5YiX5YyW5ZCO55qE5a2X56ym5LiyXG4gKi9cbmJhaWR1Lmpzb24uc3RyaW5naWZ5ID0gKGZ1bmN0aW9uICgpIHtcbiAgICAvKipcbiAgICAgKiDlrZfnrKbkuLLlpITnkIbml7bpnIDopoHovazkuYnnmoTlrZfnrKbooahcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHZhciBlc2NhcGVNYXAgPSB7XG4gICAgICAgIFwiXFxiXCI6ICdcXFxcYicsXG4gICAgICAgIFwiXFx0XCI6ICdcXFxcdCcsXG4gICAgICAgIFwiXFxuXCI6ICdcXFxcbicsXG4gICAgICAgIFwiXFxmXCI6ICdcXFxcZicsXG4gICAgICAgIFwiXFxyXCI6ICdcXFxccicsXG4gICAgICAgICdcIicgOiAnXFxcXFwiJyxcbiAgICAgICAgXCJcXFxcXCI6ICdcXFxcXFxcXCdcbiAgICB9O1xuICAgIFxuICAgIC8qKlxuICAgICAqIOWtl+espuS4suW6j+WIl+WMllxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgZnVuY3Rpb24gZW5jb2RlU3RyaW5nKHNvdXJjZSkge1xuICAgICAgICBpZiAoL1tcIlxcXFxcXHgwMC1cXHgxZl0vLnRlc3Qoc291cmNlKSkge1xuICAgICAgICAgICAgc291cmNlID0gc291cmNlLnJlcGxhY2UoXG4gICAgICAgICAgICAgICAgL1tcIlxcXFxcXHgwMC1cXHgxZl0vZywgXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKG1hdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjID0gZXNjYXBlTWFwW21hdGNoXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGMgPSBtYXRjaC5jaGFyQ29kZUF0KCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBcIlxcXFx1MDBcIiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArIE1hdGguZmxvb3IoYyAvIDE2KS50b1N0cmluZygxNikgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAoYyAlIDE2KS50b1N0cmluZygxNik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICdcIicgKyBzb3VyY2UgKyAnXCInO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAgKiDmlbDnu4Tluo/liJfljJZcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGVuY29kZUFycmF5KHNvdXJjZSkge1xuICAgICAgICB2YXIgcmVzdWx0ID0gW1wiW1wiXSwgXG4gICAgICAgICAgICBsID0gc291cmNlLmxlbmd0aCxcbiAgICAgICAgICAgIHByZUNvbW1hLCBpLCBpdGVtO1xuICAgICAgICAgICAgXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIGl0ZW0gPSBzb3VyY2VbaV07XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHN3aXRjaCAodHlwZW9mIGl0ZW0pIHtcbiAgICAgICAgICAgIGNhc2UgXCJ1bmRlZmluZWRcIjpcbiAgICAgICAgICAgIGNhc2UgXCJmdW5jdGlvblwiOlxuICAgICAgICAgICAgY2FzZSBcInVua25vd25cIjpcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgaWYocHJlQ29tbWEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goJywnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goYmFpZHUuanNvbi5zdHJpbmdpZnkoaXRlbSkpO1xuICAgICAgICAgICAgICAgIHByZUNvbW1hID0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXN1bHQucHVzaChcIl1cIik7XG4gICAgICAgIHJldHVybiByZXN1bHQuam9pbihcIlwiKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgICog5aSE55CG5pel5pyf5bqP5YiX5YyW5pe255qE6KGl6Zu2XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBwYWQoc291cmNlKSB7XG4gICAgICAgIHJldHVybiBzb3VyY2UgPCAxMCA/ICcwJyArIHNvdXJjZSA6IHNvdXJjZTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgICog5pel5pyf5bqP5YiX5YyWXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBlbmNvZGVEYXRlKHNvdXJjZSl7XG4gICAgICAgIHJldHVybiAnXCInICsgc291cmNlLmdldEZ1bGxZZWFyKCkgKyBcIi1cIiBcbiAgICAgICAgICAgICAgICArIHBhZChzb3VyY2UuZ2V0TW9udGgoKSArIDEpICsgXCItXCIgXG4gICAgICAgICAgICAgICAgKyBwYWQoc291cmNlLmdldERhdGUoKSkgKyBcIlRcIiBcbiAgICAgICAgICAgICAgICArIHBhZChzb3VyY2UuZ2V0SG91cnMoKSkgKyBcIjpcIiBcbiAgICAgICAgICAgICAgICArIHBhZChzb3VyY2UuZ2V0TWludXRlcygpKSArIFwiOlwiIFxuICAgICAgICAgICAgICAgICsgcGFkKHNvdXJjZS5nZXRTZWNvbmRzKCkpICsgJ1wiJztcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBzd2l0Y2ggKHR5cGVvZiB2YWx1ZSkge1xuICAgICAgICBjYXNlICd1bmRlZmluZWQnOlxuICAgICAgICAgICAgcmV0dXJuICd1bmRlZmluZWQnO1xuICAgICAgICAgICAgXG4gICAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgICAgICByZXR1cm4gaXNGaW5pdGUodmFsdWUpID8gU3RyaW5nKHZhbHVlKSA6IFwibnVsbFwiO1xuICAgICAgICAgICAgXG4gICAgICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICAgICAgICByZXR1cm4gZW5jb2RlU3RyaW5nKHZhbHVlKTtcbiAgICAgICAgICAgIFxuICAgICAgICBjYXNlICdib29sZWFuJzpcbiAgICAgICAgICAgIHJldHVybiBTdHJpbmcodmFsdWUpO1xuICAgICAgICAgICAgXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ251bGwnO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVuY29kZUFycmF5KHZhbHVlKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWUgaW5zdGFuY2VvZiBEYXRlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVuY29kZURhdGUodmFsdWUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gWyd7J10sXG4gICAgICAgICAgICAgICAgICAgIGVuY29kZSA9IGJhaWR1Lmpzb24uc3RyaW5naWZ5LFxuICAgICAgICAgICAgICAgICAgICBwcmVDb21tYSxcbiAgICAgICAgICAgICAgICAgICAgaXRlbTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwodmFsdWUsIGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0gPSB2YWx1ZVtrZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoICh0eXBlb2YgaXRlbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAndW5kZWZpbmVkJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3Vua25vd24nOlxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnZnVuY3Rpb24nOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJlQ29tbWEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goJywnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJlQ29tbWEgPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGVuY29kZShrZXkpICsgJzonICsgZW5jb2RlKGl0ZW0pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaCgnfScpO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQuam9pbignJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xufSkoKTtcbi8qXG4gKiBUYW5ncmFtXG4gKiBDb3B5cmlnaHQgMjAwOSBCYWlkdSBJbmMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiBcbiAqIHBhdGg6IGJhaWR1L2pzb24vZW5jb2RlLmpzXG4gKiBhdXRob3I6IGVyaWssIGNhdFxuICogdmVyc2lvbjogMS4zLjRcbiAqIGRhdGU6IDIwMTAvMTIvMjNcbiAqL1xuXG5cblxuLyoqXG4gKiDlsIZqc29u5a+56LGh5bqP5YiX5YyW77yM5Li66L+H5pe25o6l5Y+j77yM5LuK5ZCO5Lya6KKrYmFpZHUuanNvbi5zdHJpbmdpZnnku6Pmm79cbiAqIEBuYW1lIGJhaWR1Lmpzb24uZW5jb2RlXG4gKiBAZnVuY3Rpb25cbiAqIEBncmFtbWFyIGJhaWR1Lmpzb24uZW5jb2RlKHZhbHVlKVxuICogQHBhcmFtIHtKU09OfSB2YWx1ZSDpnIDopoHluo/liJfljJbnmoRqc29u5a+56LGhXG4gKiBAbWV0YSBvdXRcbiAqIEBzZWUgYmFpZHUuanNvbi5kZWNvZGUsYmFpZHUuanNvbi5zdHJpbmdpZnlcbiAqICAgICAgICAgICAgIFxuICogQHJldHVybnMge3N0cmluZ30g5bqP5YiX5YyW5ZCO55qE5a2X56ym5LiyXG4gKi9cbmJhaWR1Lmpzb24uZW5jb2RlID0gYmFpZHUuanNvbi5zdHJpbmdpZnk7XG4iXSwiZmlsZSI6InBsdWdpbnMvdWVkaXRvci9kaWFsb2dzL3dvcmRpbWFnZS90YW5ncmFtLmpzIn0=
