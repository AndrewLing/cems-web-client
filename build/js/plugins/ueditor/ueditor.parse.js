/*!
 * UEditor
 * version: ueditor
 * build: Wed Aug 10 2016 11:06:16 GMT+0800 (CST)
 */

(function(){

(function(){
    UE = window.UE || {};
    var isIE = !!window.ActiveXObject;
    //定义utils工具
    var utils = {
            removeLastbs : function(url){
                return url.replace(/\/$/,'')
            },
            extend : function(t,s){
                var a = arguments,
                    notCover = this.isBoolean(a[a.length - 1]) ? a[a.length - 1] : false,
                    len = this.isBoolean(a[a.length - 1]) ? a.length - 1 : a.length;
                for (var i = 1; i < len; i++) {
                    var x = a[i];
                    for (var k in x) {
                        if (!notCover || !t.hasOwnProperty(k)) {
                            t[k] = x[k];
                        }
                    }
                }
                return t;
            },
            isIE : isIE,
            cssRule : isIE ? function(key,style,doc){
                var indexList,index;
                doc = doc || document;
                if(doc.indexList){
                    indexList = doc.indexList;
                }else{
                    indexList = doc.indexList =  {};
                }
                var sheetStyle;
                if(!indexList[key]){
                    if(style === undefined){
                        return ''
                    }
                    sheetStyle = doc.createStyleSheet('',index = doc.styleSheets.length);
                    indexList[key] = index;
                }else{
                    sheetStyle = doc.styleSheets[indexList[key]];
                }
                if(style === undefined){
                    return sheetStyle.cssText
                }
                sheetStyle.cssText = sheetStyle.cssText + '\n' + (style || '')
            } : function(key,style,doc){
                doc = doc || document;
                var head = doc.getElementsByTagName('head')[0],node;
                if(!(node = doc.getElementById(key))){
                    if(style === undefined){
                        return ''
                    }
                    node = doc.createElement('style');
                    node.id = key;
                    head.appendChild(node)
                }
                if(style === undefined){
                    return node.innerHTML
                }
                if(style !== ''){
                    node.innerHTML = node.innerHTML + '\n' + style;
                }else{
                    head.removeChild(node)
                }
            },
            domReady : function (onready) {
                var doc = window.document;
                if (doc.readyState === "complete") {
                    onready();
                }else{
                    if (isIE) {
                        (function () {
                            if (doc.isReady) return;
                            try {
                                doc.documentElement.doScroll("left");
                            } catch (error) {
                                setTimeout(arguments.callee, 0);
                                return;
                            }
                            onready();
                        })();
                        window.attachEvent('onload', function(){
                            onready()
                        });
                    } else {
                        doc.addEventListener("DOMContentLoaded", function () {
                            doc.removeEventListener("DOMContentLoaded", arguments.callee, false);
                            onready();
                        }, false);
                        window.addEventListener('load', function(){onready()}, false);
                    }
                }

            },
            each : function(obj, iterator, context) {
                if (obj == null) return;
                if (obj.length === +obj.length) {
                    for (var i = 0, l = obj.length; i < l; i++) {
                        if(iterator.call(context, obj[i], i, obj) === false)
                            return false;
                    }
                } else {
                    for (var key in obj) {
                        if (obj.hasOwnProperty(key)) {
                            if(iterator.call(context, obj[key], key, obj) === false)
                                return false;
                        }
                    }
                }
            },
            inArray : function(arr,item){
                var index = -1;
                this.each(arr,function(v,i){
                    if(v === item){
                        index = i;
                        return false;
                    }
                });
                return index;
            },
            pushItem : function(arr,item){
                if(this.inArray(arr,item)==-1){
                    arr.push(item)
                }
            },
            trim: function (str) {
                return str.replace(/(^[ \t\n\r]+)|([ \t\n\r]+$)/g, '');
            },
            indexOf: function (array, item, start) {
                var index = -1;
                start = this.isNumber(start) ? start : 0;
                this.each(array, function (v, i) {
                    if (i >= start && v === item) {
                        index = i;
                        return false;
                    }
                });
                return index;
            },
            hasClass: function (element, className) {
                className = className.replace(/(^[ ]+)|([ ]+$)/g, '').replace(/[ ]{2,}/g, ' ').split(' ');
                for (var i = 0, ci, cls = element.className; ci = className[i++];) {
                    if (!new RegExp('\\b' + ci + '\\b', 'i').test(cls)) {
                        return false;
                    }
                }
                return i - 1 == className.length;
            },
            addClass:function (elm, classNames) {
                if(!elm)return;
                classNames = this.trim(classNames).replace(/[ ]{2,}/g,' ').split(' ');
                for(var i = 0,ci,cls = elm.className;ci=classNames[i++];){
                    if(!new RegExp('\\b' + ci + '\\b').test(cls)){
                        cls += ' ' + ci;
                    }
                }
                elm.className = utils.trim(cls);
            },
            removeClass:function (elm, classNames) {
                classNames = this.isArray(classNames) ? classNames :
                    this.trim(classNames).replace(/[ ]{2,}/g,' ').split(' ');
                for(var i = 0,ci,cls = elm.className;ci=classNames[i++];){
                    cls = cls.replace(new RegExp('\\b' + ci + '\\b'),'')
                }
                cls = this.trim(cls).replace(/[ ]{2,}/g,' ');
                elm.className = cls;
                !cls && elm.removeAttribute('className');
            },
            on: function (element, type, handler) {
                var types = this.isArray(type) ? type : type.split(/\s+/),
                    k = types.length;
                if (k) while (k--) {
                    type = types[k];
                    if (element.addEventListener) {
                        element.addEventListener(type, handler, false);
                    } else {
                        if (!handler._d) {
                            handler._d = {
                                els : []
                            };
                        }
                        var key = type + handler.toString(),index = utils.indexOf(handler._d.els,element);
                        if (!handler._d[key] || index == -1) {
                            if(index == -1){
                                handler._d.els.push(element);
                            }
                            if(!handler._d[key]){
                                handler._d[key] = function (evt) {
                                    return handler.call(evt.srcElement, evt || window.event);
                                };
                            }


                            element.attachEvent('on' + type, handler._d[key]);
                        }
                    }
                }
                element = null;
            },
            off: function (element, type, handler) {
                var types = this.isArray(type) ? type : type.split(/\s+/),
                    k = types.length;
                if (k) while (k--) {
                    type = types[k];
                    if (element.removeEventListener) {
                        element.removeEventListener(type, handler, false);
                    } else {
                        var key = type + handler.toString();
                        try{
                            element.detachEvent('on' + type, handler._d ? handler._d[key] : handler);
                        }catch(e){}
                        if (handler._d && handler._d[key]) {
                            var index = utils.indexOf(handler._d.els,element);
                            if(index!=-1){
                                handler._d.els.splice(index,1);
                            }
                            handler._d.els.length == 0 && delete handler._d[key];
                        }
                    }
                }
            },
            loadFile : function () {
                var tmpList = [];
                function getItem(doc,obj){
                    try{
                        for(var i= 0,ci;ci=tmpList[i++];){
                            if(ci.doc === doc && ci.url == (obj.src || obj.href)){
                                return ci;
                            }
                        }
                    }catch(e){
                        return null;
                    }

                }
                return function (doc, obj, fn) {
                    var item = getItem(doc,obj);
                    if (item) {
                        if(item.ready){
                            fn && fn();
                        }else{
                            item.funs.push(fn)
                        }
                        return;
                    }
                    tmpList.push({
                        doc:doc,
                        url:obj.src||obj.href,
                        funs:[fn]
                    });
                    if (!doc.body) {
                        var html = [];
                        for(var p in obj){
                            if(p == 'tag')continue;
                            html.push(p + '="' + obj[p] + '"')
                        }
                        doc.write('<' + obj.tag + ' ' + html.join(' ') + ' ></'+obj.tag+'>');
                        return;
                    }
                    if (obj.id && doc.getElementById(obj.id)) {
                        return;
                    }
                    var element = doc.createElement(obj.tag);
                    delete obj.tag;
                    for (var p in obj) {
                        element.setAttribute(p, obj[p]);
                    }
                    element.onload = element.onreadystatechange = function () {
                        if (!this.readyState || /loaded|complete/.test(this.readyState)) {
                            item = getItem(doc,obj);
                            if (item.funs.length > 0) {
                                item.ready = 1;
                                for (var fi; fi = item.funs.pop();) {
                                    fi();
                                }
                            }
                            element.onload = element.onreadystatechange = null;
                        }
                    };
                    element.onerror = function(){
                        throw Error('The load '+(obj.href||obj.src)+' fails,check the url')
                    };
                    doc.getElementsByTagName("head")[0].appendChild(element);
                }
            }()
    };
    utils.each(['String', 'Function', 'Array', 'Number', 'RegExp', 'Object','Boolean'], function (v) {
        utils['is' + v] = function (obj) {
            return Object.prototype.toString.apply(obj) == '[object ' + v + ']';
        }
    });
    var parselist = {};
    UE.parse = {
        register : function(parseName,fn){
            parselist[parseName] = fn;
        },
        load : function(opt){
            utils.each(parselist,function(v){
                v.call(opt,utils);
            })
        }
    };
    uParse = function(selector,opt){
        utils.domReady(function(){
            var contents;
            if(document.querySelectorAll){
                contents = document.querySelectorAll(selector)
            }else{
                if(/^#/.test(selector)){
                    contents = [document.getElementById(selector.replace(/^#/,''))]
                }else if(/^\./.test(selector)){
                    var contents = [];
                    utils.each(document.getElementsByTagName('*'),function(node){
                        if(node.className && new RegExp('\\b' + selector.replace(/^\./,'') + '\\b','i').test(node.className)){
                            contents.push(node)
                        }
                    })
                }else{
                    contents = document.getElementsByTagName(selector)
                }
            }
            utils.each(contents,function(v){
                UE.parse.load(utils.extend({root:v,selector:selector},opt))
            })
        })
    }
})();

UE.parse.register('insertcode',function(utils){
    var pres = this.root.getElementsByTagName('pre');
    if(pres.length){
        if(typeof XRegExp == "undefined"){
            var jsurl,cssurl;
            if(this.rootPath !== undefined){
                jsurl = utils.removeLastbs(this.rootPath)  + '/third-party/SyntaxHighlighter/shCore.js';
                cssurl = utils.removeLastbs(this.rootPath) + '/third-party/SyntaxHighlighter/shCoreDefault.css';
            }else{
                jsurl = this.highlightJsUrl;
                cssurl = this.highlightCssUrl;
            }
            utils.loadFile(document,{
                id : "syntaxhighlighter_css",
                tag : "link",
                rel : "stylesheet",
                type : "text/css",
                href : cssurl
            });
            utils.loadFile(document,{
                id : "syntaxhighlighter_js",
                src : jsurl,
                tag : "script",
                type : "text/javascript",
                defer : "defer"
            },function(){
                utils.each(pres,function(pi){
                    if(pi && /brush/i.test(pi.className)){
                        SyntaxHighlighter.highlight(pi);
                    }
                });
            });
        }else{
            utils.each(pres,function(pi){
                if(pi && /brush/i.test(pi.className)){
                    SyntaxHighlighter.highlight(pi);
                }
            });
        }
    }

});
UE.parse.register('table', function (utils) {
    var me = this,
        root = this.root,
        tables = root.getElementsByTagName('table');
    if (tables.length) {
        var selector = this.selector;
        //追加默认的表格样式
        utils.cssRule('table',
            selector + ' table.noBorderTable td,' +
                selector + ' table.noBorderTable th,' +
                selector + ' table.noBorderTable caption{border:1px dashed #ddd !important}' +
                selector + ' table.sortEnabled tr.firstRow th,' + selector + ' table.sortEnabled tr.firstRow td{padding-right:20px; background-repeat: no-repeat;' +
                    'background-position: center right; background-image:url(' + this.rootPath + 'themes/default/images/sortable.png);}' +
                selector + ' table.sortEnabled tr.firstRow th:hover,' + selector + ' table.sortEnabled tr.firstRow td:hover{background-color: #EEE;}' +
                selector + ' table{margin-bottom:10px;border-collapse:collapse;display:table;}' +
                selector + ' td,' + selector + ' th{ background:white; padding: 5px 10px;border: 1px solid #DDD;}' +
                selector + ' caption{border:1px dashed #DDD;border-bottom:0;padding:3px;text-align:center;}' +
                selector + ' th{border-top:1px solid #BBB;background:#F7F7F7;}' +
                selector + ' table tr.firstRow th{border-top:2px solid #BBB;background:#F7F7F7;}' +
                selector + ' tr.ue-table-interlace-color-single td{ background: #fcfcfc; }' +
                selector + ' tr.ue-table-interlace-color-double td{ background: #f7faff; }' +
                selector + ' td p{margin:0;padding:0;}',
            document);
        //填充空的单元格

        utils.each('td th caption'.split(' '), function (tag) {
            var cells = root.getElementsByTagName(tag);
            cells.length && utils.each(cells, function (node) {
                if (!node.firstChild) {
                    node.innerHTML = '&nbsp;';

                }
            })
        });

        //表格可排序
        var tables = root.getElementsByTagName('table');
        utils.each(tables, function (table) {
            if (/\bsortEnabled\b/.test(table.className)) {
                utils.on(table, 'click', function(e){
                    var target = e.target || e.srcElement,
                        cell = findParentByTagName(target, ['td', 'th']);
                    var table = findParentByTagName(target, 'table'),
                        colIndex = utils.indexOf(table.rows[0].cells, cell),
                        sortType = table.getAttribute('data-sort-type');
                    if(colIndex != -1) {
                        sortTable(table, colIndex, me.tableSortCompareFn || sortType);
                        updateTable(table);
                    }
                });
            }
        });

        //按照标签名查找父节点
        function findParentByTagName(target, tagNames) {
            var i, current = target;
            tagNames = utils.isArray(tagNames) ? tagNames:[tagNames];
            while(current){
                for(i = 0;i < tagNames.length; i++) {
                    if(current.tagName == tagNames[i].toUpperCase()) return current;
                }
                current = current.parentNode;
            }
            return null;
        }
        //表格排序
        function sortTable(table, sortByCellIndex, compareFn) {
            var rows = table.rows,
                trArray = [],
                flag = rows[0].cells[0].tagName === "TH",
                lastRowIndex = 0;

            for (var i = 0,len = rows.length; i < len; i++) {
                trArray[i] = rows[i];
            }

            var Fn = {
                'reversecurrent': function(td1,td2){
                    return 1;
                },
                'orderbyasc': function(td1,td2){
                    var value1 = td1.innerText||td1.textContent,
                        value2 = td2.innerText||td2.textContent;
                    return value1.localeCompare(value2);
                },
                'reversebyasc': function(td1,td2){
                    var value1 = td1.innerHTML,
                        value2 = td2.innerHTML;
                    return value2.localeCompare(value1);
                },
                'orderbynum': function(td1,td2){
                    var value1 = td1[utils.isIE ? 'innerText':'textContent'].match(/\d+/),
                        value2 = td2[utils.isIE ? 'innerText':'textContent'].match(/\d+/);
                    if(value1) value1 = +value1[0];
                    if(value2) value2 = +value2[0];
                    return (value1||0) - (value2||0);
                },
                'reversebynum': function(td1,td2){
                    var value1 = td1[utils.isIE ? 'innerText':'textContent'].match(/\d+/),
                        value2 = td2[utils.isIE ? 'innerText':'textContent'].match(/\d+/);
                    if(value1) value1 = +value1[0];
                    if(value2) value2 = +value2[0];
                    return (value2||0) - (value1||0);
                }
            };

            //对表格设置排序的标记data-sort-type
            table.setAttribute('data-sort-type', compareFn && typeof compareFn === "string" && Fn[compareFn] ? compareFn:'');

            //th不参与排序
            flag && trArray.splice(0, 1);
            trArray = sort(trArray,function (tr1, tr2) {
                var result;
                if (compareFn && typeof compareFn === "function") {
                    result = compareFn.call(this, tr1.cells[sortByCellIndex], tr2.cells[sortByCellIndex]);
                } else if (compareFn && typeof compareFn === "number") {
                    result = 1;
                } else if (compareFn && typeof compareFn === "string" && Fn[compareFn]) {
                    result = Fn[compareFn].call(this, tr1.cells[sortByCellIndex], tr2.cells[sortByCellIndex]);
                } else {
                    result = Fn['orderbyasc'].call(this, tr1.cells[sortByCellIndex], tr2.cells[sortByCellIndex]);
                }
                return result;
            });
            var fragment = table.ownerDocument.createDocumentFragment();
            for (var j = 0, len = trArray.length; j < len; j++) {
                fragment.appendChild(trArray[j]);
            }
            var tbody = table.getElementsByTagName("tbody")[0];
            if(!lastRowIndex){
                tbody.appendChild(fragment);
            }else{
                tbody.insertBefore(fragment,rows[lastRowIndex- range.endRowIndex + range.beginRowIndex - 1])
            }
        }
        //冒泡排序
        function sort(array, compareFn){
            compareFn = compareFn || function(item1, item2){ return item1.localeCompare(item2);};
            for(var i= 0,len = array.length; i<len; i++){
                for(var j = i,length = array.length; j<length; j++){
                    if(compareFn(array[i], array[j]) > 0){
                        var t = array[i];
                        array[i] = array[j];
                        array[j] = t;
                    }
                }
            }
            return array;
        }
        //更新表格
        function updateTable(table) {
            //给第一行设置firstRow的样式名称,在排序图标的样式上使用到
            if(!utils.hasClass(table.rows[0], "firstRow")) {
                for(var i = 1; i< table.rows.length; i++) {
                    utils.removeClass(table.rows[i], "firstRow");
                }
                utils.addClass(table.rows[0], "firstRow");
            }
        }
    }
});
UE.parse.register('charts',function( utils ){

    utils.cssRule('chartsContainerHeight','.edui-chart-container { height:'+(this.chartContainerHeight||300)+'px}');
    var resourceRoot = this.rootPath,
        containers = this.root,
        sources = null;

    //不存在指定的根路径， 则直接退出
    if ( !resourceRoot ) {
        return;
    }

    if ( sources = parseSources() ) {

        loadResources();

    }


    function parseSources () {

        if ( !containers ) {
            return null;
        }

        return extractChartData( containers );

    }

    /**
     * 提取数据
     */
    function extractChartData ( rootNode ) {

        var data = [],
            tables = rootNode.getElementsByTagName( "table" );

        for ( var i = 0, tableNode; tableNode = tables[ i ]; i++ ) {

            if ( tableNode.getAttribute( "data-chart" ) !== null ) {

                data.push( formatData( tableNode ) );

            }

        }

        return data.length ? data : null;

    }

    function formatData ( tableNode ) {

        var meta = tableNode.getAttribute( "data-chart" ),
            metaConfig = {},
            data = [];

        //提取table数据
        for ( var i = 0, row; row = tableNode.rows[ i ]; i++ ) {

            var rowData = [];

            for ( var j = 0, cell; cell = row.cells[ j ]; j++ ) {

                var value = ( cell.innerText || cell.textContent || '' );
                rowData.push( cell.tagName == 'TH' ? value:(value | 0) );

            }

            data.push( rowData );

        }

        //解析元信息
        meta = meta.split( ";" );
        for ( var i = 0, metaData; metaData = meta[ i ]; i++ ) {

            metaData = metaData.split( ":" );
            metaConfig[ metaData[ 0 ] ] = metaData[ 1 ];

        }


        return {
            table: tableNode,
            meta: metaConfig,
            data: data
        };

    }

    //加载资源
    function loadResources () {

        loadJQuery();

    }

    function loadJQuery () {

        //不存在jquery， 则加载jquery
        if ( !window.jQuery ) {

            utils.loadFile(document,{
                src : resourceRoot + "/third-party/jquery-1.10.2.min.js",
                tag : "script",
                type : "text/javascript",
                defer : "defer"
            },function(){

                loadHighcharts();

            });

        } else {

            loadHighcharts();

        }

    }

    function loadHighcharts () {

        //不存在Highcharts， 则加载Highcharts
        if ( !window.Highcharts ) {

            utils.loadFile(document,{
                src : resourceRoot + "/third-party/highcharts/highcharts.js",
                tag : "script",
                type : "text/javascript",
                defer : "defer"
            },function(){

                loadTypeConfig();

            });

        } else {

            loadTypeConfig();

        }

    }

    //加载图表差异化配置文件
    function loadTypeConfig () {

        utils.loadFile(document,{
            src : resourceRoot + "/dialogs/charts/chart.config.js",
            tag : "script",
            type : "text/javascript",
            defer : "defer"
        },function(){

            render();

        });

    }

    //渲染图表
    function render () {

        var config = null,
            chartConfig = null,
            container = null;

        for ( var i = 0, len = sources.length; i < len; i++ ) {

            config = sources[ i ];

            chartConfig = analysisConfig( config );

            container = createContainer( config.table );

            renderChart( container, typeConfig[ config.meta.chartType ], chartConfig );

        }


    }

    /**
     * 渲染图表
     * @param container 图表容器节点对象
     * @param typeConfig 图表类型配置
     * @param config 图表通用配置
     * */
    function renderChart ( container, typeConfig, config ) {


        $( container ).highcharts( $.extend( {}, typeConfig, {

            credits: {
                enabled: false
            },
            exporting: {
                enabled: false
            },
            title: {
                text: config.title,
                x: -20 //center
            },
            subtitle: {
                text: config.subTitle,
                x: -20
            },
            xAxis: {
                title: {
                    text: config.xTitle
                },
                categories: config.categories
            },
            yAxis: {
                title: {
                    text: config.yTitle
                },
                plotLines: [{
                    value: 0,
                    width: 1,
                    color: '#808080'
                }]
            },
            tooltip: {
                enabled: true,
                valueSuffix: config.suffix
            },
            legend: {
                layout: 'vertical',
                align: 'right',
                verticalAlign: 'middle',
                borderWidth: 1
            },
            series: config.series

        } ));

    }

    /**
     * 创建图表的容器
     * 新创建的容器会替换掉对应的table对象
     * */
    function createContainer ( tableNode ) {

        var container = document.createElement( "div" );
        container.className = "edui-chart-container";

        tableNode.parentNode.replaceChild( container, tableNode );

        return container;

    }

    //根据config解析出正确的类别和图表数据信息
    function analysisConfig ( config ) {

        var series = [],
        //数据类别
            categories = [],
            result = [],
            data = config.data,
            meta = config.meta;

        //数据对齐方式为相反的方式， 需要反转数据
        if ( meta.dataFormat != "1" ) {

            for ( var i = 0, len = data.length; i < len ; i++ ) {

                for ( var j = 0, jlen = data[ i ].length; j < jlen; j++ ) {

                    if ( !result[ j ] ) {
                        result[ j ] = [];
                    }

                    result[ j ][ i ] = data[ i ][ j ];

                }

            }

            data = result;

        }

        result = {};

        //普通图表
        if ( meta.chartType != typeConfig.length - 1 ) {

            categories = data[ 0 ].slice( 1 );

            for ( var i = 1, curData; curData = data[ i ]; i++ ) {
                series.push( {
                    name: curData[ 0 ],
                    data: curData.slice( 1 )
                } );
            }

            result.series = series;
            result.categories = categories;
            result.title = meta.title;
            result.subTitle = meta.subTitle;
            result.xTitle = meta.xTitle;
            result.yTitle = meta.yTitle;
            result.suffix = meta.suffix;

        } else {

            var curData = [];

            for ( var i = 1, len = data[ 0 ].length; i < len; i++ ) {

                curData.push( [ data[ 0 ][ i ], data[ 1 ][ i ] | 0 ] );

            }

            //饼图
            series[ 0 ] = {
                type: 'pie',
                name: meta.tip,
                data: curData
            };

            result.series = series;
            result.title = meta.title;
            result.suffix = meta.suffix;

        }

        return result;

    }

});
UE.parse.register('background', function (utils) {
    var me = this,
        root = me.root,
        p = root.getElementsByTagName('p'),
        styles;

    for (var i = 0,ci; ci = p[i++];) {
        styles = ci.getAttribute('data-background');
        if (styles){
            ci.parentNode.removeChild(ci);
        }
    }

    //追加默认的表格样式
    styles && utils.cssRule('ueditor_background', me.selector + '{' + styles + '}', document);
});
UE.parse.register('list',function(utils){
    var customCss = [],
        customStyle = {
            'cn'    :   'cn-1-',
            'cn1'   :   'cn-2-',
            'cn2'   :   'cn-3-',
            'num'   :   'num-1-',
            'num1'  :   'num-2-',
            'num2'  :   'num-3-',
            'dash'  :   'dash',
            'dot'   :   'dot'
        };


    utils.extend(this,{
        liiconpath : 'http://bs.baidu.com/listicon/',
        listDefaultPaddingLeft : '20'
    });

    var root = this.root,
        ols = root.getElementsByTagName('ol'),
        uls = root.getElementsByTagName('ul'),
        selector = this.selector;

    if(ols.length){
        applyStyle.call(this,ols);
    }

    if(uls.length){
        applyStyle.call(this,uls);
    }

    if(ols.length || uls.length){
        customCss.push(selector +' .list-paddingleft-1{padding-left:0}');
        customCss.push(selector +' .list-paddingleft-2{padding-left:'+ this.listDefaultPaddingLeft+'px}');
        customCss.push(selector +' .list-paddingleft-3{padding-left:'+ this.listDefaultPaddingLeft*2+'px}');

        utils.cssRule('list', selector +' ol,'+selector +' ul{margin:0;padding:0;}li{clear:both;}'+customCss.join('\n'), document);
    }
    function applyStyle(nodes){
        var T = this;
        utils.each(nodes,function(list){
            if(list.className && /custom_/i.test(list.className)){
                var listStyle = list.className.match(/custom_(\w+)/)[1];
                if(listStyle == 'dash' || listStyle == 'dot'){
                    utils.pushItem(customCss,selector +' li.list-' + customStyle[listStyle] + '{background-image:url(' + T.liiconpath +customStyle[listStyle]+'.gif)}');
                    utils.pushItem(customCss,selector +' ul.custom_'+listStyle+'{list-style:none;} '+ selector +' ul.custom_'+listStyle+' li{background-position:0 3px;background-repeat:no-repeat}');

                }else{
                    var index = 1;
                    utils.each(list.childNodes,function(li){
                        if(li.tagName == 'LI'){
                            utils.pushItem(customCss,selector + ' li.list-' + customStyle[listStyle] + index + '{background-image:url(' + T.liiconpath  + 'list-'+customStyle[listStyle] +index + '.gif)}');
                            index++;
                        }
                    });
                    utils.pushItem(customCss,selector + ' ol.custom_'+listStyle+'{list-style:none;}'+selector+' ol.custom_'+listStyle+' li{background-position:0 3px;background-repeat:no-repeat}');
                }
                switch(listStyle){
                    case 'cn':
                        utils.pushItem(customCss,selector + ' li.list-'+listStyle+'-paddingleft-1{padding-left:25px}');
                        utils.pushItem(customCss,selector + ' li.list-'+listStyle+'-paddingleft-2{padding-left:40px}');
                        utils.pushItem(customCss,selector + ' li.list-'+listStyle+'-paddingleft-3{padding-left:55px}');
                        break;
                    case 'cn1':
                        utils.pushItem(customCss,selector + ' li.list-'+listStyle+'-paddingleft-1{padding-left:30px}');
                        utils.pushItem(customCss,selector + ' li.list-'+listStyle+'-paddingleft-2{padding-left:40px}');
                        utils.pushItem(customCss,selector + ' li.list-'+listStyle+'-paddingleft-3{padding-left:55px}');
                        break;
                    case 'cn2':
                        utils.pushItem(customCss,selector + ' li.list-'+listStyle+'-paddingleft-1{padding-left:40px}');
                        utils.pushItem(customCss,selector + ' li.list-'+listStyle+'-paddingleft-2{padding-left:55px}');
                        utils.pushItem(customCss,selector + ' li.list-'+listStyle+'-paddingleft-3{padding-left:68px}');
                        break;
                    case 'num':
                    case 'num1':
                        utils.pushItem(customCss,selector + ' li.list-'+listStyle+'-paddingleft-1{padding-left:25px}');
                        break;
                    case 'num2':
                        utils.pushItem(customCss,selector + ' li.list-'+listStyle+'-paddingleft-1{padding-left:35px}');
                        utils.pushItem(customCss,selector + ' li.list-'+listStyle+'-paddingleft-2{padding-left:40px}');
                        break;
                    case 'dash':
                        utils.pushItem(customCss,selector + ' li.list-'+listStyle+'-paddingleft{padding-left:35px}');
                        break;
                    case 'dot':
                        utils.pushItem(customCss,selector + ' li.list-'+listStyle+'-paddingleft{padding-left:20px}');
                }
            }
        });
    }


});
UE.parse.register('vedio',function(utils){
    var video = this.root.getElementsByTagName('video'),
        audio = this.root.getElementsByTagName('audio');

    document.createElement('video');document.createElement('audio');
    if(video.length || audio.length){
        var sourcePath = utils.removeLastbs(this.rootPath),
            jsurl = sourcePath + '/third-party/video-js/video.js',
            cssurl = sourcePath + '/third-party/video-js/video-js.min.css',
            swfUrl = sourcePath + '/third-party/video-js/video-js.swf';

        if(window.videojs) {
            videojs.autoSetup();
        } else {
            utils.loadFile(document,{
                id : "video_css",
                tag : "link",
                rel : "stylesheet",
                type : "text/css",
                href : cssurl
            });
            utils.loadFile(document,{
                id : "video_js",
                src : jsurl,
                tag : "script",
                type : "text/javascript"
            },function(){
                videojs.options.flash.swf = swfUrl;
                videojs.autoSetup();
            });
        }

    }
});

})();

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvdWVkaXRvci5wYXJzZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiFcbiAqIFVFZGl0b3JcbiAqIHZlcnNpb246IHVlZGl0b3JcbiAqIGJ1aWxkOiBXZWQgQXVnIDEwIDIwMTYgMTE6MDY6MTYgR01UKzA4MDAgKENTVClcbiAqL1xuXG4oZnVuY3Rpb24oKXtcblxuKGZ1bmN0aW9uKCl7XG4gICAgVUUgPSB3aW5kb3cuVUUgfHwge307XG4gICAgdmFyIGlzSUUgPSAhIXdpbmRvdy5BY3RpdmVYT2JqZWN0O1xuICAgIC8v5a6a5LmJdXRpbHPlt6XlhbdcbiAgICB2YXIgdXRpbHMgPSB7XG4gICAgICAgICAgICByZW1vdmVMYXN0YnMgOiBmdW5jdGlvbih1cmwpe1xuICAgICAgICAgICAgICAgIHJldHVybiB1cmwucmVwbGFjZSgvXFwvJC8sJycpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXh0ZW5kIDogZnVuY3Rpb24odCxzKXtcbiAgICAgICAgICAgICAgICB2YXIgYSA9IGFyZ3VtZW50cyxcbiAgICAgICAgICAgICAgICAgICAgbm90Q292ZXIgPSB0aGlzLmlzQm9vbGVhbihhW2EubGVuZ3RoIC0gMV0pID8gYVthLmxlbmd0aCAtIDFdIDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGxlbiA9IHRoaXMuaXNCb29sZWFuKGFbYS5sZW5ndGggLSAxXSkgPyBhLmxlbmd0aCAtIDEgOiBhLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB4ID0gYVtpXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgayBpbiB4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIW5vdENvdmVyIHx8ICF0Lmhhc093blByb3BlcnR5KGspKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdFtrXSA9IHhba107XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaXNJRSA6IGlzSUUsXG4gICAgICAgICAgICBjc3NSdWxlIDogaXNJRSA/IGZ1bmN0aW9uKGtleSxzdHlsZSxkb2Mpe1xuICAgICAgICAgICAgICAgIHZhciBpbmRleExpc3QsaW5kZXg7XG4gICAgICAgICAgICAgICAgZG9jID0gZG9jIHx8IGRvY3VtZW50O1xuICAgICAgICAgICAgICAgIGlmKGRvYy5pbmRleExpc3Qpe1xuICAgICAgICAgICAgICAgICAgICBpbmRleExpc3QgPSBkb2MuaW5kZXhMaXN0O1xuICAgICAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgICAgICBpbmRleExpc3QgPSBkb2MuaW5kZXhMaXN0ID0gIHt9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgc2hlZXRTdHlsZTtcbiAgICAgICAgICAgICAgICBpZighaW5kZXhMaXN0W2tleV0pe1xuICAgICAgICAgICAgICAgICAgICBpZihzdHlsZSA9PT0gdW5kZWZpbmVkKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnJ1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHNoZWV0U3R5bGUgPSBkb2MuY3JlYXRlU3R5bGVTaGVldCgnJyxpbmRleCA9IGRvYy5zdHlsZVNoZWV0cy5sZW5ndGgpO1xuICAgICAgICAgICAgICAgICAgICBpbmRleExpc3Rba2V5XSA9IGluZGV4O1xuICAgICAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgICAgICBzaGVldFN0eWxlID0gZG9jLnN0eWxlU2hlZXRzW2luZGV4TGlzdFtrZXldXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYoc3R5bGUgPT09IHVuZGVmaW5lZCl7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzaGVldFN0eWxlLmNzc1RleHRcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2hlZXRTdHlsZS5jc3NUZXh0ID0gc2hlZXRTdHlsZS5jc3NUZXh0ICsgJ1xcbicgKyAoc3R5bGUgfHwgJycpXG4gICAgICAgICAgICB9IDogZnVuY3Rpb24oa2V5LHN0eWxlLGRvYyl7XG4gICAgICAgICAgICAgICAgZG9jID0gZG9jIHx8IGRvY3VtZW50O1xuICAgICAgICAgICAgICAgIHZhciBoZWFkID0gZG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0sbm9kZTtcbiAgICAgICAgICAgICAgICBpZighKG5vZGUgPSBkb2MuZ2V0RWxlbWVudEJ5SWQoa2V5KSkpe1xuICAgICAgICAgICAgICAgICAgICBpZihzdHlsZSA9PT0gdW5kZWZpbmVkKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnJ1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG5vZGUgPSBkb2MuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5pZCA9IGtleTtcbiAgICAgICAgICAgICAgICAgICAgaGVhZC5hcHBlbmRDaGlsZChub2RlKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZihzdHlsZSA9PT0gdW5kZWZpbmVkKXtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5vZGUuaW5uZXJIVE1MXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmKHN0eWxlICE9PSAnJyl7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUuaW5uZXJIVE1MID0gbm9kZS5pbm5lckhUTUwgKyAnXFxuJyArIHN0eWxlO1xuICAgICAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgICAgICBoZWFkLnJlbW92ZUNoaWxkKG5vZGUpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRvbVJlYWR5IDogZnVuY3Rpb24gKG9ucmVhZHkpIHtcbiAgICAgICAgICAgICAgICB2YXIgZG9jID0gd2luZG93LmRvY3VtZW50O1xuICAgICAgICAgICAgICAgIGlmIChkb2MucmVhZHlTdGF0ZSA9PT0gXCJjb21wbGV0ZVwiKSB7XG4gICAgICAgICAgICAgICAgICAgIG9ucmVhZHkoKTtcbiAgICAgICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzSUUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRvYy5pc1JlYWR5KSByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9jLmRvY3VtZW50RWxlbWVudC5kb1Njcm9sbChcImxlZnRcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChhcmd1bWVudHMuY2FsbGVlLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbnJlYWR5KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LmF0dGFjaEV2ZW50KCdvbmxvYWQnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9ucmVhZHkoKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkb2MuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTUNvbnRlbnRMb2FkZWRcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvYy5yZW1vdmVFdmVudExpc3RlbmVyKFwiRE9NQ29udGVudExvYWRlZFwiLCBhcmd1bWVudHMuY2FsbGVlLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25yZWFkeSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbigpe29ucmVhZHkoKX0sIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVhY2ggOiBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm47XG4gICAgICAgICAgICAgICAgaWYgKG9iai5sZW5ndGggPT09ICtvYmoubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gb2JqLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYoaXRlcmF0b3IuY2FsbChjb250ZXh0LCBvYmpbaV0sIGksIG9iaikgPT09IGZhbHNlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgb2JqW2tleV0sIGtleSwgb2JqKSA9PT0gZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbkFycmF5IDogZnVuY3Rpb24oYXJyLGl0ZW0pe1xuICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IC0xO1xuICAgICAgICAgICAgICAgIHRoaXMuZWFjaChhcnIsZnVuY3Rpb24odixpKXtcbiAgICAgICAgICAgICAgICAgICAgaWYodiA9PT0gaXRlbSl7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleCA9IGk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gaW5kZXg7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHVzaEl0ZW0gOiBmdW5jdGlvbihhcnIsaXRlbSl7XG4gICAgICAgICAgICAgICAgaWYodGhpcy5pbkFycmF5KGFycixpdGVtKT09LTEpe1xuICAgICAgICAgICAgICAgICAgICBhcnIucHVzaChpdGVtKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cmltOiBmdW5jdGlvbiAoc3RyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0ci5yZXBsYWNlKC8oXlsgXFx0XFxuXFxyXSspfChbIFxcdFxcblxccl0rJCkvZywgJycpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGluZGV4T2Y6IGZ1bmN0aW9uIChhcnJheSwgaXRlbSwgc3RhcnQpIHtcbiAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSAtMTtcbiAgICAgICAgICAgICAgICBzdGFydCA9IHRoaXMuaXNOdW1iZXIoc3RhcnQpID8gc3RhcnQgOiAwO1xuICAgICAgICAgICAgICAgIHRoaXMuZWFjaChhcnJheSwgZnVuY3Rpb24gKHYsIGkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkgPj0gc3RhcnQgJiYgdiA9PT0gaXRlbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXggPSBpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGluZGV4O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGhhc0NsYXNzOiBmdW5jdGlvbiAoZWxlbWVudCwgY2xhc3NOYW1lKSB7XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lID0gY2xhc3NOYW1lLnJlcGxhY2UoLyheWyBdKyl8KFsgXSskKS9nLCAnJykucmVwbGFjZSgvWyBdezIsfS9nLCAnICcpLnNwbGl0KCcgJyk7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGNpLCBjbHMgPSBlbGVtZW50LmNsYXNzTmFtZTsgY2kgPSBjbGFzc05hbWVbaSsrXTspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFuZXcgUmVnRXhwKCdcXFxcYicgKyBjaSArICdcXFxcYicsICdpJykudGVzdChjbHMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGkgLSAxID09IGNsYXNzTmFtZS5sZW5ndGg7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYWRkQ2xhc3M6ZnVuY3Rpb24gKGVsbSwgY2xhc3NOYW1lcykge1xuICAgICAgICAgICAgICAgIGlmKCFlbG0pcmV0dXJuO1xuICAgICAgICAgICAgICAgIGNsYXNzTmFtZXMgPSB0aGlzLnRyaW0oY2xhc3NOYW1lcykucmVwbGFjZSgvWyBdezIsfS9nLCcgJykuc3BsaXQoJyAnKTtcbiAgICAgICAgICAgICAgICBmb3IodmFyIGkgPSAwLGNpLGNscyA9IGVsbS5jbGFzc05hbWU7Y2k9Y2xhc3NOYW1lc1tpKytdOyl7XG4gICAgICAgICAgICAgICAgICAgIGlmKCFuZXcgUmVnRXhwKCdcXFxcYicgKyBjaSArICdcXFxcYicpLnRlc3QoY2xzKSl7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbHMgKz0gJyAnICsgY2k7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxtLmNsYXNzTmFtZSA9IHV0aWxzLnRyaW0oY2xzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZW1vdmVDbGFzczpmdW5jdGlvbiAoZWxtLCBjbGFzc05hbWVzKSB7XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lcyA9IHRoaXMuaXNBcnJheShjbGFzc05hbWVzKSA/IGNsYXNzTmFtZXMgOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaW0oY2xhc3NOYW1lcykucmVwbGFjZSgvWyBdezIsfS9nLCcgJykuc3BsaXQoJyAnKTtcbiAgICAgICAgICAgICAgICBmb3IodmFyIGkgPSAwLGNpLGNscyA9IGVsbS5jbGFzc05hbWU7Y2k9Y2xhc3NOYW1lc1tpKytdOyl7XG4gICAgICAgICAgICAgICAgICAgIGNscyA9IGNscy5yZXBsYWNlKG5ldyBSZWdFeHAoJ1xcXFxiJyArIGNpICsgJ1xcXFxiJyksJycpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNscyA9IHRoaXMudHJpbShjbHMpLnJlcGxhY2UoL1sgXXsyLH0vZywnICcpO1xuICAgICAgICAgICAgICAgIGVsbS5jbGFzc05hbWUgPSBjbHM7XG4gICAgICAgICAgICAgICAgIWNscyAmJiBlbG0ucmVtb3ZlQXR0cmlidXRlKCdjbGFzc05hbWUnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbjogZnVuY3Rpb24gKGVsZW1lbnQsIHR5cGUsIGhhbmRsZXIpIHtcbiAgICAgICAgICAgICAgICB2YXIgdHlwZXMgPSB0aGlzLmlzQXJyYXkodHlwZSkgPyB0eXBlIDogdHlwZS5zcGxpdCgvXFxzKy8pLFxuICAgICAgICAgICAgICAgICAgICBrID0gdHlwZXMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGlmIChrKSB3aGlsZSAoay0tKSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGUgPSB0eXBlc1trXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGhhbmRsZXIsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaGFuZGxlci5fZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZXIuX2QgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVscyA6IFtdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBrZXkgPSB0eXBlICsgaGFuZGxlci50b1N0cmluZygpLGluZGV4ID0gdXRpbHMuaW5kZXhPZihoYW5kbGVyLl9kLmVscyxlbGVtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaGFuZGxlci5fZFtrZXldIHx8IGluZGV4ID09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoaW5kZXggPT0gLTEpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVyLl9kLmVscy5wdXNoKGVsZW1lbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZighaGFuZGxlci5fZFtrZXldKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlci5fZFtrZXldID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGhhbmRsZXIuY2FsbChldnQuc3JjRWxlbWVudCwgZXZ0IHx8IHdpbmRvdy5ldmVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmF0dGFjaEV2ZW50KCdvbicgKyB0eXBlLCBoYW5kbGVyLl9kW2tleV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsZW1lbnQgPSBudWxsO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9mZjogZnVuY3Rpb24gKGVsZW1lbnQsIHR5cGUsIGhhbmRsZXIpIHtcbiAgICAgICAgICAgICAgICB2YXIgdHlwZXMgPSB0aGlzLmlzQXJyYXkodHlwZSkgPyB0eXBlIDogdHlwZS5zcGxpdCgvXFxzKy8pLFxuICAgICAgICAgICAgICAgICAgICBrID0gdHlwZXMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGlmIChrKSB3aGlsZSAoay0tKSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGUgPSB0eXBlc1trXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGhhbmRsZXIsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBrZXkgPSB0eXBlICsgaGFuZGxlci50b1N0cmluZygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5e1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuZGV0YWNoRXZlbnQoJ29uJyArIHR5cGUsIGhhbmRsZXIuX2QgPyBoYW5kbGVyLl9kW2tleV0gOiBoYW5kbGVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1jYXRjaChlKXt9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGFuZGxlci5fZCAmJiBoYW5kbGVyLl9kW2tleV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSB1dGlscy5pbmRleE9mKGhhbmRsZXIuX2QuZWxzLGVsZW1lbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKGluZGV4IT0tMSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZXIuX2QuZWxzLnNwbGljZShpbmRleCwxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlci5fZC5lbHMubGVuZ3RoID09IDAgJiYgZGVsZXRlIGhhbmRsZXIuX2Rba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsb2FkRmlsZSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgdG1wTGlzdCA9IFtdO1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGdldEl0ZW0oZG9jLG9iail7XG4gICAgICAgICAgICAgICAgICAgIHRyeXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcih2YXIgaT0gMCxjaTtjaT10bXBMaXN0W2krK107KXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihjaS5kb2MgPT09IGRvYyAmJiBjaS51cmwgPT0gKG9iai5zcmMgfHwgb2JqLmhyZWYpKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfWNhdGNoKGUpe1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGRvYywgb2JqLCBmbikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaXRlbSA9IGdldEl0ZW0oZG9jLG9iaik7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpdGVtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZihpdGVtLnJlYWR5KXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbiAmJiBmbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5mdW5zLnB1c2goZm4pXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdG1wTGlzdC5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvYzpkb2MsXG4gICAgICAgICAgICAgICAgICAgICAgICB1cmw6b2JqLnNyY3x8b2JqLmhyZWYsXG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5zOltmbl1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghZG9jLmJvZHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBodG1sID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IodmFyIHAgaW4gb2JqKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihwID09ICd0YWcnKWNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGh0bWwucHVzaChwICsgJz1cIicgKyBvYmpbcF0gKyAnXCInKVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZG9jLndyaXRlKCc8JyArIG9iai50YWcgKyAnICcgKyBodG1sLmpvaW4oJyAnKSArICcgPjwvJytvYmoudGFnKyc+Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKG9iai5pZCAmJiBkb2MuZ2V0RWxlbWVudEJ5SWQob2JqLmlkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciBlbGVtZW50ID0gZG9jLmNyZWF0ZUVsZW1lbnQob2JqLnRhZyk7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBvYmoudGFnO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBwIGluIG9iaikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUocCwgb2JqW3BdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50Lm9ubG9hZCA9IGVsZW1lbnQub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLnJlYWR5U3RhdGUgfHwgL2xvYWRlZHxjb21wbGV0ZS8udGVzdCh0aGlzLnJlYWR5U3RhdGUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbSA9IGdldEl0ZW0oZG9jLG9iaik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0uZnVucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0ucmVhZHkgPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBmaTsgZmkgPSBpdGVtLmZ1bnMucG9wKCk7KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQub25sb2FkID0gZWxlbWVudC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50Lm9uZXJyb3IgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ1RoZSBsb2FkICcrKG9iai5ocmVmfHxvYmouc3JjKSsnIGZhaWxzLGNoZWNrIHRoZSB1cmwnKVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBkb2MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJoZWFkXCIpWzBdLmFwcGVuZENoaWxkKGVsZW1lbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0oKVxuICAgIH07XG4gICAgdXRpbHMuZWFjaChbJ1N0cmluZycsICdGdW5jdGlvbicsICdBcnJheScsICdOdW1iZXInLCAnUmVnRXhwJywgJ09iamVjdCcsJ0Jvb2xlYW4nXSwgZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgdXRpbHNbJ2lzJyArIHZdID0gZnVuY3Rpb24gKG9iaikge1xuICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuYXBwbHkob2JqKSA9PSAnW29iamVjdCAnICsgdiArICddJztcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHZhciBwYXJzZWxpc3QgPSB7fTtcbiAgICBVRS5wYXJzZSA9IHtcbiAgICAgICAgcmVnaXN0ZXIgOiBmdW5jdGlvbihwYXJzZU5hbWUsZm4pe1xuICAgICAgICAgICAgcGFyc2VsaXN0W3BhcnNlTmFtZV0gPSBmbjtcbiAgICAgICAgfSxcbiAgICAgICAgbG9hZCA6IGZ1bmN0aW9uKG9wdCl7XG4gICAgICAgICAgICB1dGlscy5lYWNoKHBhcnNlbGlzdCxmdW5jdGlvbih2KXtcbiAgICAgICAgICAgICAgICB2LmNhbGwob3B0LHV0aWxzKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9O1xuICAgIHVQYXJzZSA9IGZ1bmN0aW9uKHNlbGVjdG9yLG9wdCl7XG4gICAgICAgIHV0aWxzLmRvbVJlYWR5KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgY29udGVudHM7XG4gICAgICAgICAgICBpZihkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKXtcbiAgICAgICAgICAgICAgICBjb250ZW50cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpXG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICBpZigvXiMvLnRlc3Qoc2VsZWN0b3IpKXtcbiAgICAgICAgICAgICAgICAgICAgY29udGVudHMgPSBbZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoc2VsZWN0b3IucmVwbGFjZSgvXiMvLCcnKSldXG4gICAgICAgICAgICAgICAgfWVsc2UgaWYoL15cXC4vLnRlc3Qoc2VsZWN0b3IpKXtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvbnRlbnRzID0gW107XG4gICAgICAgICAgICAgICAgICAgIHV0aWxzLmVhY2goZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJyonKSxmdW5jdGlvbihub2RlKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKG5vZGUuY2xhc3NOYW1lICYmIG5ldyBSZWdFeHAoJ1xcXFxiJyArIHNlbGVjdG9yLnJlcGxhY2UoL15cXC4vLCcnKSArICdcXFxcYicsJ2knKS50ZXN0KG5vZGUuY2xhc3NOYW1lKSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudHMucHVzaChub2RlKVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgICAgICBjb250ZW50cyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKHNlbGVjdG9yKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHV0aWxzLmVhY2goY29udGVudHMsZnVuY3Rpb24odil7XG4gICAgICAgICAgICAgICAgVUUucGFyc2UubG9hZCh1dGlscy5leHRlbmQoe3Jvb3Q6dixzZWxlY3RvcjpzZWxlY3Rvcn0sb3B0KSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgfVxufSkoKTtcblxuVUUucGFyc2UucmVnaXN0ZXIoJ2luc2VydGNvZGUnLGZ1bmN0aW9uKHV0aWxzKXtcbiAgICB2YXIgcHJlcyA9IHRoaXMucm9vdC5nZXRFbGVtZW50c0J5VGFnTmFtZSgncHJlJyk7XG4gICAgaWYocHJlcy5sZW5ndGgpe1xuICAgICAgICBpZih0eXBlb2YgWFJlZ0V4cCA9PSBcInVuZGVmaW5lZFwiKXtcbiAgICAgICAgICAgIHZhciBqc3VybCxjc3N1cmw7XG4gICAgICAgICAgICBpZih0aGlzLnJvb3RQYXRoICE9PSB1bmRlZmluZWQpe1xuICAgICAgICAgICAgICAgIGpzdXJsID0gdXRpbHMucmVtb3ZlTGFzdGJzKHRoaXMucm9vdFBhdGgpICArICcvdGhpcmQtcGFydHkvU3ludGF4SGlnaGxpZ2h0ZXIvc2hDb3JlLmpzJztcbiAgICAgICAgICAgICAgICBjc3N1cmwgPSB1dGlscy5yZW1vdmVMYXN0YnModGhpcy5yb290UGF0aCkgKyAnL3RoaXJkLXBhcnR5L1N5bnRheEhpZ2hsaWdodGVyL3NoQ29yZURlZmF1bHQuY3NzJztcbiAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgIGpzdXJsID0gdGhpcy5oaWdobGlnaHRKc1VybDtcbiAgICAgICAgICAgICAgICBjc3N1cmwgPSB0aGlzLmhpZ2hsaWdodENzc1VybDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHV0aWxzLmxvYWRGaWxlKGRvY3VtZW50LHtcbiAgICAgICAgICAgICAgICBpZCA6IFwic3ludGF4aGlnaGxpZ2h0ZXJfY3NzXCIsXG4gICAgICAgICAgICAgICAgdGFnIDogXCJsaW5rXCIsXG4gICAgICAgICAgICAgICAgcmVsIDogXCJzdHlsZXNoZWV0XCIsXG4gICAgICAgICAgICAgICAgdHlwZSA6IFwidGV4dC9jc3NcIixcbiAgICAgICAgICAgICAgICBocmVmIDogY3NzdXJsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHV0aWxzLmxvYWRGaWxlKGRvY3VtZW50LHtcbiAgICAgICAgICAgICAgICBpZCA6IFwic3ludGF4aGlnaGxpZ2h0ZXJfanNcIixcbiAgICAgICAgICAgICAgICBzcmMgOiBqc3VybCxcbiAgICAgICAgICAgICAgICB0YWcgOiBcInNjcmlwdFwiLFxuICAgICAgICAgICAgICAgIHR5cGUgOiBcInRleHQvamF2YXNjcmlwdFwiLFxuICAgICAgICAgICAgICAgIGRlZmVyIDogXCJkZWZlclwiXG4gICAgICAgICAgICB9LGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgdXRpbHMuZWFjaChwcmVzLGZ1bmN0aW9uKHBpKXtcbiAgICAgICAgICAgICAgICAgICAgaWYocGkgJiYgL2JydXNoL2kudGVzdChwaS5jbGFzc05hbWUpKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIFN5bnRheEhpZ2hsaWdodGVyLmhpZ2hsaWdodChwaSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIHV0aWxzLmVhY2gocHJlcyxmdW5jdGlvbihwaSl7XG4gICAgICAgICAgICAgICAgaWYocGkgJiYgL2JydXNoL2kudGVzdChwaS5jbGFzc05hbWUpKXtcbiAgICAgICAgICAgICAgICAgICAgU3ludGF4SGlnaGxpZ2h0ZXIuaGlnaGxpZ2h0KHBpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxufSk7XG5VRS5wYXJzZS5yZWdpc3RlcigndGFibGUnLCBmdW5jdGlvbiAodXRpbHMpIHtcbiAgICB2YXIgbWUgPSB0aGlzLFxuICAgICAgICByb290ID0gdGhpcy5yb290LFxuICAgICAgICB0YWJsZXMgPSByb290LmdldEVsZW1lbnRzQnlUYWdOYW1lKCd0YWJsZScpO1xuICAgIGlmICh0YWJsZXMubGVuZ3RoKSB7XG4gICAgICAgIHZhciBzZWxlY3RvciA9IHRoaXMuc2VsZWN0b3I7XG4gICAgICAgIC8v6L+95Yqg6buY6K6k55qE6KGo5qC85qC35byPXG4gICAgICAgIHV0aWxzLmNzc1J1bGUoJ3RhYmxlJyxcbiAgICAgICAgICAgIHNlbGVjdG9yICsgJyB0YWJsZS5ub0JvcmRlclRhYmxlIHRkLCcgK1xuICAgICAgICAgICAgICAgIHNlbGVjdG9yICsgJyB0YWJsZS5ub0JvcmRlclRhYmxlIHRoLCcgK1xuICAgICAgICAgICAgICAgIHNlbGVjdG9yICsgJyB0YWJsZS5ub0JvcmRlclRhYmxlIGNhcHRpb257Ym9yZGVyOjFweCBkYXNoZWQgI2RkZCAhaW1wb3J0YW50fScgK1xuICAgICAgICAgICAgICAgIHNlbGVjdG9yICsgJyB0YWJsZS5zb3J0RW5hYmxlZCB0ci5maXJzdFJvdyB0aCwnICsgc2VsZWN0b3IgKyAnIHRhYmxlLnNvcnRFbmFibGVkIHRyLmZpcnN0Um93IHRke3BhZGRpbmctcmlnaHQ6MjBweDsgYmFja2dyb3VuZC1yZXBlYXQ6IG5vLXJlcGVhdDsnICtcbiAgICAgICAgICAgICAgICAgICAgJ2JhY2tncm91bmQtcG9zaXRpb246IGNlbnRlciByaWdodDsgYmFja2dyb3VuZC1pbWFnZTp1cmwoJyArIHRoaXMucm9vdFBhdGggKyAndGhlbWVzL2RlZmF1bHQvaW1hZ2VzL3NvcnRhYmxlLnBuZyk7fScgK1xuICAgICAgICAgICAgICAgIHNlbGVjdG9yICsgJyB0YWJsZS5zb3J0RW5hYmxlZCB0ci5maXJzdFJvdyB0aDpob3ZlciwnICsgc2VsZWN0b3IgKyAnIHRhYmxlLnNvcnRFbmFibGVkIHRyLmZpcnN0Um93IHRkOmhvdmVye2JhY2tncm91bmQtY29sb3I6ICNFRUU7fScgK1xuICAgICAgICAgICAgICAgIHNlbGVjdG9yICsgJyB0YWJsZXttYXJnaW4tYm90dG9tOjEwcHg7Ym9yZGVyLWNvbGxhcHNlOmNvbGxhcHNlO2Rpc3BsYXk6dGFibGU7fScgK1xuICAgICAgICAgICAgICAgIHNlbGVjdG9yICsgJyB0ZCwnICsgc2VsZWN0b3IgKyAnIHRoeyBiYWNrZ3JvdW5kOndoaXRlOyBwYWRkaW5nOiA1cHggMTBweDtib3JkZXI6IDFweCBzb2xpZCAjREREO30nICtcbiAgICAgICAgICAgICAgICBzZWxlY3RvciArICcgY2FwdGlvbntib3JkZXI6MXB4IGRhc2hlZCAjREREO2JvcmRlci1ib3R0b206MDtwYWRkaW5nOjNweDt0ZXh0LWFsaWduOmNlbnRlcjt9JyArXG4gICAgICAgICAgICAgICAgc2VsZWN0b3IgKyAnIHRoe2JvcmRlci10b3A6MXB4IHNvbGlkICNCQkI7YmFja2dyb3VuZDojRjdGN0Y3O30nICtcbiAgICAgICAgICAgICAgICBzZWxlY3RvciArICcgdGFibGUgdHIuZmlyc3RSb3cgdGh7Ym9yZGVyLXRvcDoycHggc29saWQgI0JCQjtiYWNrZ3JvdW5kOiNGN0Y3Rjc7fScgK1xuICAgICAgICAgICAgICAgIHNlbGVjdG9yICsgJyB0ci51ZS10YWJsZS1pbnRlcmxhY2UtY29sb3Itc2luZ2xlIHRkeyBiYWNrZ3JvdW5kOiAjZmNmY2ZjOyB9JyArXG4gICAgICAgICAgICAgICAgc2VsZWN0b3IgKyAnIHRyLnVlLXRhYmxlLWludGVybGFjZS1jb2xvci1kb3VibGUgdGR7IGJhY2tncm91bmQ6ICNmN2ZhZmY7IH0nICtcbiAgICAgICAgICAgICAgICBzZWxlY3RvciArICcgdGQgcHttYXJnaW46MDtwYWRkaW5nOjA7fScsXG4gICAgICAgICAgICBkb2N1bWVudCk7XG4gICAgICAgIC8v5aGr5YWF56m655qE5Y2V5YWD5qC8XG5cbiAgICAgICAgdXRpbHMuZWFjaCgndGQgdGggY2FwdGlvbicuc3BsaXQoJyAnKSwgZnVuY3Rpb24gKHRhZykge1xuICAgICAgICAgICAgdmFyIGNlbGxzID0gcm9vdC5nZXRFbGVtZW50c0J5VGFnTmFtZSh0YWcpO1xuICAgICAgICAgICAgY2VsbHMubGVuZ3RoICYmIHV0aWxzLmVhY2goY2VsbHMsIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFub2RlLmZpcnN0Q2hpbGQpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5pbm5lckhUTUwgPSAnJm5ic3A7JztcblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8v6KGo5qC85Y+v5o6S5bqPXG4gICAgICAgIHZhciB0YWJsZXMgPSByb290LmdldEVsZW1lbnRzQnlUYWdOYW1lKCd0YWJsZScpO1xuICAgICAgICB1dGlscy5lYWNoKHRhYmxlcywgZnVuY3Rpb24gKHRhYmxlKSB7XG4gICAgICAgICAgICBpZiAoL1xcYnNvcnRFbmFibGVkXFxiLy50ZXN0KHRhYmxlLmNsYXNzTmFtZSkpIHtcbiAgICAgICAgICAgICAgICB1dGlscy5vbih0YWJsZSwgJ2NsaWNrJywgZnVuY3Rpb24oZSl7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0YXJnZXQgPSBlLnRhcmdldCB8fCBlLnNyY0VsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICBjZWxsID0gZmluZFBhcmVudEJ5VGFnTmFtZSh0YXJnZXQsIFsndGQnLCAndGgnXSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0YWJsZSA9IGZpbmRQYXJlbnRCeVRhZ05hbWUodGFyZ2V0LCAndGFibGUnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbEluZGV4ID0gdXRpbHMuaW5kZXhPZih0YWJsZS5yb3dzWzBdLmNlbGxzLCBjZWxsKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvcnRUeXBlID0gdGFibGUuZ2V0QXR0cmlidXRlKCdkYXRhLXNvcnQtdHlwZScpO1xuICAgICAgICAgICAgICAgICAgICBpZihjb2xJbmRleCAhPSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc29ydFRhYmxlKHRhYmxlLCBjb2xJbmRleCwgbWUudGFibGVTb3J0Q29tcGFyZUZuIHx8IHNvcnRUeXBlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZVRhYmxlKHRhYmxlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvL+aMieeFp+agh+etvuWQjeafpeaJvueItuiKgueCuVxuICAgICAgICBmdW5jdGlvbiBmaW5kUGFyZW50QnlUYWdOYW1lKHRhcmdldCwgdGFnTmFtZXMpIHtcbiAgICAgICAgICAgIHZhciBpLCBjdXJyZW50ID0gdGFyZ2V0O1xuICAgICAgICAgICAgdGFnTmFtZXMgPSB1dGlscy5pc0FycmF5KHRhZ05hbWVzKSA/IHRhZ05hbWVzOlt0YWdOYW1lc107XG4gICAgICAgICAgICB3aGlsZShjdXJyZW50KXtcbiAgICAgICAgICAgICAgICBmb3IoaSA9IDA7aSA8IHRhZ05hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmKGN1cnJlbnQudGFnTmFtZSA9PSB0YWdOYW1lc1tpXS50b1VwcGVyQ2FzZSgpKSByZXR1cm4gY3VycmVudDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY3VycmVudCA9IGN1cnJlbnQucGFyZW50Tm9kZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIC8v6KGo5qC85o6S5bqPXG4gICAgICAgIGZ1bmN0aW9uIHNvcnRUYWJsZSh0YWJsZSwgc29ydEJ5Q2VsbEluZGV4LCBjb21wYXJlRm4pIHtcbiAgICAgICAgICAgIHZhciByb3dzID0gdGFibGUucm93cyxcbiAgICAgICAgICAgICAgICB0ckFycmF5ID0gW10sXG4gICAgICAgICAgICAgICAgZmxhZyA9IHJvd3NbMF0uY2VsbHNbMF0udGFnTmFtZSA9PT0gXCJUSFwiLFxuICAgICAgICAgICAgICAgIGxhc3RSb3dJbmRleCA9IDA7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLGxlbiA9IHJvd3MubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0ckFycmF5W2ldID0gcm93c1tpXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIEZuID0ge1xuICAgICAgICAgICAgICAgICdyZXZlcnNlY3VycmVudCc6IGZ1bmN0aW9uKHRkMSx0ZDIpe1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICdvcmRlcmJ5YXNjJzogZnVuY3Rpb24odGQxLHRkMil7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZTEgPSB0ZDEuaW5uZXJUZXh0fHx0ZDEudGV4dENvbnRlbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTIgPSB0ZDIuaW5uZXJUZXh0fHx0ZDIudGV4dENvbnRlbnQ7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTEubG9jYWxlQ29tcGFyZSh2YWx1ZTIpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgJ3JldmVyc2VieWFzYyc6IGZ1bmN0aW9uKHRkMSx0ZDIpe1xuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWUxID0gdGQxLmlubmVySFRNTCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlMiA9IHRkMi5pbm5lckhUTUw7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTIubG9jYWxlQ29tcGFyZSh2YWx1ZTEpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgJ29yZGVyYnludW0nOiBmdW5jdGlvbih0ZDEsdGQyKXtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlMSA9IHRkMVt1dGlscy5pc0lFID8gJ2lubmVyVGV4dCc6J3RleHRDb250ZW50J10ubWF0Y2goL1xcZCsvKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlMiA9IHRkMlt1dGlscy5pc0lFID8gJ2lubmVyVGV4dCc6J3RleHRDb250ZW50J10ubWF0Y2goL1xcZCsvKTtcbiAgICAgICAgICAgICAgICAgICAgaWYodmFsdWUxKSB2YWx1ZTEgPSArdmFsdWUxWzBdO1xuICAgICAgICAgICAgICAgICAgICBpZih2YWx1ZTIpIHZhbHVlMiA9ICt2YWx1ZTJbMF07XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAodmFsdWUxfHwwKSAtICh2YWx1ZTJ8fDApO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgJ3JldmVyc2VieW51bSc6IGZ1bmN0aW9uKHRkMSx0ZDIpe1xuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWUxID0gdGQxW3V0aWxzLmlzSUUgPyAnaW5uZXJUZXh0JzondGV4dENvbnRlbnQnXS5tYXRjaCgvXFxkKy8pLFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUyID0gdGQyW3V0aWxzLmlzSUUgPyAnaW5uZXJUZXh0JzondGV4dENvbnRlbnQnXS5tYXRjaCgvXFxkKy8pO1xuICAgICAgICAgICAgICAgICAgICBpZih2YWx1ZTEpIHZhbHVlMSA9ICt2YWx1ZTFbMF07XG4gICAgICAgICAgICAgICAgICAgIGlmKHZhbHVlMikgdmFsdWUyID0gK3ZhbHVlMlswXTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICh2YWx1ZTJ8fDApIC0gKHZhbHVlMXx8MCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy/lr7nooajmoLzorr7nva7mjpLluo/nmoTmoIforrBkYXRhLXNvcnQtdHlwZVxuICAgICAgICAgICAgdGFibGUuc2V0QXR0cmlidXRlKCdkYXRhLXNvcnQtdHlwZScsIGNvbXBhcmVGbiAmJiB0eXBlb2YgY29tcGFyZUZuID09PSBcInN0cmluZ1wiICYmIEZuW2NvbXBhcmVGbl0gPyBjb21wYXJlRm46JycpO1xuXG4gICAgICAgICAgICAvL3Ro5LiN5Y+C5LiO5o6S5bqPXG4gICAgICAgICAgICBmbGFnICYmIHRyQXJyYXkuc3BsaWNlKDAsIDEpO1xuICAgICAgICAgICAgdHJBcnJheSA9IHNvcnQodHJBcnJheSxmdW5jdGlvbiAodHIxLCB0cjIpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0O1xuICAgICAgICAgICAgICAgIGlmIChjb21wYXJlRm4gJiYgdHlwZW9mIGNvbXBhcmVGbiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGNvbXBhcmVGbi5jYWxsKHRoaXMsIHRyMS5jZWxsc1tzb3J0QnlDZWxsSW5kZXhdLCB0cjIuY2VsbHNbc29ydEJ5Q2VsbEluZGV4XSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjb21wYXJlRm4gJiYgdHlwZW9mIGNvbXBhcmVGbiA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSAxO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY29tcGFyZUZuICYmIHR5cGVvZiBjb21wYXJlRm4gPT09IFwic3RyaW5nXCIgJiYgRm5bY29tcGFyZUZuXSkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBGbltjb21wYXJlRm5dLmNhbGwodGhpcywgdHIxLmNlbGxzW3NvcnRCeUNlbGxJbmRleF0sIHRyMi5jZWxsc1tzb3J0QnlDZWxsSW5kZXhdKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBGblsnb3JkZXJieWFzYyddLmNhbGwodGhpcywgdHIxLmNlbGxzW3NvcnRCeUNlbGxJbmRleF0sIHRyMi5jZWxsc1tzb3J0QnlDZWxsSW5kZXhdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdmFyIGZyYWdtZW50ID0gdGFibGUub3duZXJEb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMCwgbGVuID0gdHJBcnJheS5sZW5ndGg7IGogPCBsZW47IGorKykge1xuICAgICAgICAgICAgICAgIGZyYWdtZW50LmFwcGVuZENoaWxkKHRyQXJyYXlbal0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHRib2R5ID0gdGFibGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJ0Ym9keVwiKVswXTtcbiAgICAgICAgICAgIGlmKCFsYXN0Um93SW5kZXgpe1xuICAgICAgICAgICAgICAgIHRib2R5LmFwcGVuZENoaWxkKGZyYWdtZW50KTtcbiAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgIHRib2R5Lmluc2VydEJlZm9yZShmcmFnbWVudCxyb3dzW2xhc3RSb3dJbmRleC0gcmFuZ2UuZW5kUm93SW5kZXggKyByYW5nZS5iZWdpblJvd0luZGV4IC0gMV0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy/lhpLms6HmjpLluo9cbiAgICAgICAgZnVuY3Rpb24gc29ydChhcnJheSwgY29tcGFyZUZuKXtcbiAgICAgICAgICAgIGNvbXBhcmVGbiA9IGNvbXBhcmVGbiB8fCBmdW5jdGlvbihpdGVtMSwgaXRlbTIpeyByZXR1cm4gaXRlbTEubG9jYWxlQ29tcGFyZShpdGVtMik7fTtcbiAgICAgICAgICAgIGZvcih2YXIgaT0gMCxsZW4gPSBhcnJheS5sZW5ndGg7IGk8bGVuOyBpKyspe1xuICAgICAgICAgICAgICAgIGZvcih2YXIgaiA9IGksbGVuZ3RoID0gYXJyYXkubGVuZ3RoOyBqPGxlbmd0aDsgaisrKXtcbiAgICAgICAgICAgICAgICAgICAgaWYoY29tcGFyZUZuKGFycmF5W2ldLCBhcnJheVtqXSkgPiAwKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0ID0gYXJyYXlbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICBhcnJheVtpXSA9IGFycmF5W2pdO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXJyYXlbal0gPSB0O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGFycmF5O1xuICAgICAgICB9XG4gICAgICAgIC8v5pu05paw6KGo5qC8XG4gICAgICAgIGZ1bmN0aW9uIHVwZGF0ZVRhYmxlKHRhYmxlKSB7XG4gICAgICAgICAgICAvL+e7meesrOS4gOihjOiuvue9rmZpcnN0Um9355qE5qC35byP5ZCN56ewLOWcqOaOkuW6j+Wbvuagh+eahOagt+W8j+S4iuS9v+eUqOWIsFxuICAgICAgICAgICAgaWYoIXV0aWxzLmhhc0NsYXNzKHRhYmxlLnJvd3NbMF0sIFwiZmlyc3RSb3dcIikpIHtcbiAgICAgICAgICAgICAgICBmb3IodmFyIGkgPSAxOyBpPCB0YWJsZS5yb3dzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHV0aWxzLnJlbW92ZUNsYXNzKHRhYmxlLnJvd3NbaV0sIFwiZmlyc3RSb3dcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHV0aWxzLmFkZENsYXNzKHRhYmxlLnJvd3NbMF0sIFwiZmlyc3RSb3dcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59KTtcblVFLnBhcnNlLnJlZ2lzdGVyKCdjaGFydHMnLGZ1bmN0aW9uKCB1dGlscyApe1xuXG4gICAgdXRpbHMuY3NzUnVsZSgnY2hhcnRzQ29udGFpbmVySGVpZ2h0JywnLmVkdWktY2hhcnQtY29udGFpbmVyIHsgaGVpZ2h0OicrKHRoaXMuY2hhcnRDb250YWluZXJIZWlnaHR8fDMwMCkrJ3B4fScpO1xuICAgIHZhciByZXNvdXJjZVJvb3QgPSB0aGlzLnJvb3RQYXRoLFxuICAgICAgICBjb250YWluZXJzID0gdGhpcy5yb290LFxuICAgICAgICBzb3VyY2VzID0gbnVsbDtcblxuICAgIC8v5LiN5a2Y5Zyo5oyH5a6a55qE5qC56Lev5b6E77yMIOWImeebtOaOpemAgOWHulxuICAgIGlmICggIXJlc291cmNlUm9vdCApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICggc291cmNlcyA9IHBhcnNlU291cmNlcygpICkge1xuXG4gICAgICAgIGxvYWRSZXNvdXJjZXMoKTtcblxuICAgIH1cblxuXG4gICAgZnVuY3Rpb24gcGFyc2VTb3VyY2VzICgpIHtcblxuICAgICAgICBpZiAoICFjb250YWluZXJzICkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZXh0cmFjdENoYXJ0RGF0YSggY29udGFpbmVycyApO1xuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5o+Q5Y+W5pWw5o2uXG4gICAgICovXG4gICAgZnVuY3Rpb24gZXh0cmFjdENoYXJ0RGF0YSAoIHJvb3ROb2RlICkge1xuXG4gICAgICAgIHZhciBkYXRhID0gW10sXG4gICAgICAgICAgICB0YWJsZXMgPSByb290Tm9kZS5nZXRFbGVtZW50c0J5VGFnTmFtZSggXCJ0YWJsZVwiICk7XG5cbiAgICAgICAgZm9yICggdmFyIGkgPSAwLCB0YWJsZU5vZGU7IHRhYmxlTm9kZSA9IHRhYmxlc1sgaSBdOyBpKysgKSB7XG5cbiAgICAgICAgICAgIGlmICggdGFibGVOb2RlLmdldEF0dHJpYnV0ZSggXCJkYXRhLWNoYXJ0XCIgKSAhPT0gbnVsbCApIHtcblxuICAgICAgICAgICAgICAgIGRhdGEucHVzaCggZm9ybWF0RGF0YSggdGFibGVOb2RlICkgKTtcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZGF0YS5sZW5ndGggPyBkYXRhIDogbnVsbDtcblxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZvcm1hdERhdGEgKCB0YWJsZU5vZGUgKSB7XG5cbiAgICAgICAgdmFyIG1ldGEgPSB0YWJsZU5vZGUuZ2V0QXR0cmlidXRlKCBcImRhdGEtY2hhcnRcIiApLFxuICAgICAgICAgICAgbWV0YUNvbmZpZyA9IHt9LFxuICAgICAgICAgICAgZGF0YSA9IFtdO1xuXG4gICAgICAgIC8v5o+Q5Y+WdGFibGXmlbDmja5cbiAgICAgICAgZm9yICggdmFyIGkgPSAwLCByb3c7IHJvdyA9IHRhYmxlTm9kZS5yb3dzWyBpIF07IGkrKyApIHtcblxuICAgICAgICAgICAgdmFyIHJvd0RhdGEgPSBbXTtcblxuICAgICAgICAgICAgZm9yICggdmFyIGogPSAwLCBjZWxsOyBjZWxsID0gcm93LmNlbGxzWyBqIF07IGorKyApIHtcblxuICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9ICggY2VsbC5pbm5lclRleHQgfHwgY2VsbC50ZXh0Q29udGVudCB8fCAnJyApO1xuICAgICAgICAgICAgICAgIHJvd0RhdGEucHVzaCggY2VsbC50YWdOYW1lID09ICdUSCcgPyB2YWx1ZToodmFsdWUgfCAwKSApO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGRhdGEucHVzaCggcm93RGF0YSApO1xuXG4gICAgICAgIH1cblxuICAgICAgICAvL+ino+aekOWFg+S/oeaBr1xuICAgICAgICBtZXRhID0gbWV0YS5zcGxpdCggXCI7XCIgKTtcbiAgICAgICAgZm9yICggdmFyIGkgPSAwLCBtZXRhRGF0YTsgbWV0YURhdGEgPSBtZXRhWyBpIF07IGkrKyApIHtcblxuICAgICAgICAgICAgbWV0YURhdGEgPSBtZXRhRGF0YS5zcGxpdCggXCI6XCIgKTtcbiAgICAgICAgICAgIG1ldGFDb25maWdbIG1ldGFEYXRhWyAwIF0gXSA9IG1ldGFEYXRhWyAxIF07XG5cbiAgICAgICAgfVxuXG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRhYmxlOiB0YWJsZU5vZGUsXG4gICAgICAgICAgICBtZXRhOiBtZXRhQ29uZmlnLFxuICAgICAgICAgICAgZGF0YTogZGF0YVxuICAgICAgICB9O1xuXG4gICAgfVxuXG4gICAgLy/liqDovb3otYTmupBcbiAgICBmdW5jdGlvbiBsb2FkUmVzb3VyY2VzICgpIHtcblxuICAgICAgICBsb2FkSlF1ZXJ5KCk7XG5cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsb2FkSlF1ZXJ5ICgpIHtcblxuICAgICAgICAvL+S4jeWtmOWcqGpxdWVyee+8jCDliJnliqDovb1qcXVlcnlcbiAgICAgICAgaWYgKCAhd2luZG93LmpRdWVyeSApIHtcblxuICAgICAgICAgICAgdXRpbHMubG9hZEZpbGUoZG9jdW1lbnQse1xuICAgICAgICAgICAgICAgIHNyYyA6IHJlc291cmNlUm9vdCArIFwiL3RoaXJkLXBhcnR5L2pxdWVyeS0xLjEwLjIubWluLmpzXCIsXG4gICAgICAgICAgICAgICAgdGFnIDogXCJzY3JpcHRcIixcbiAgICAgICAgICAgICAgICB0eXBlIDogXCJ0ZXh0L2phdmFzY3JpcHRcIixcbiAgICAgICAgICAgICAgICBkZWZlciA6IFwiZGVmZXJcIlxuICAgICAgICAgICAgfSxmdW5jdGlvbigpe1xuXG4gICAgICAgICAgICAgICAgbG9hZEhpZ2hjaGFydHMoKTtcblxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgbG9hZEhpZ2hjaGFydHMoKTtcblxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsb2FkSGlnaGNoYXJ0cyAoKSB7XG5cbiAgICAgICAgLy/kuI3lrZjlnKhIaWdoY2hhcnRz77yMIOWImeWKoOi9vUhpZ2hjaGFydHNcbiAgICAgICAgaWYgKCAhd2luZG93LkhpZ2hjaGFydHMgKSB7XG5cbiAgICAgICAgICAgIHV0aWxzLmxvYWRGaWxlKGRvY3VtZW50LHtcbiAgICAgICAgICAgICAgICBzcmMgOiByZXNvdXJjZVJvb3QgKyBcIi90aGlyZC1wYXJ0eS9oaWdoY2hhcnRzL2hpZ2hjaGFydHMuanNcIixcbiAgICAgICAgICAgICAgICB0YWcgOiBcInNjcmlwdFwiLFxuICAgICAgICAgICAgICAgIHR5cGUgOiBcInRleHQvamF2YXNjcmlwdFwiLFxuICAgICAgICAgICAgICAgIGRlZmVyIDogXCJkZWZlclwiXG4gICAgICAgICAgICB9LGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgICAgICAgICBsb2FkVHlwZUNvbmZpZygpO1xuXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICBsb2FkVHlwZUNvbmZpZygpO1xuXG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIC8v5Yqg6L295Zu+6KGo5beu5byC5YyW6YWN572u5paH5Lu2XG4gICAgZnVuY3Rpb24gbG9hZFR5cGVDb25maWcgKCkge1xuXG4gICAgICAgIHV0aWxzLmxvYWRGaWxlKGRvY3VtZW50LHtcbiAgICAgICAgICAgIHNyYyA6IHJlc291cmNlUm9vdCArIFwiL2RpYWxvZ3MvY2hhcnRzL2NoYXJ0LmNvbmZpZy5qc1wiLFxuICAgICAgICAgICAgdGFnIDogXCJzY3JpcHRcIixcbiAgICAgICAgICAgIHR5cGUgOiBcInRleHQvamF2YXNjcmlwdFwiLFxuICAgICAgICAgICAgZGVmZXIgOiBcImRlZmVyXCJcbiAgICAgICAgfSxmdW5jdGlvbigpe1xuXG4gICAgICAgICAgICByZW5kZXIoKTtcblxuICAgICAgICB9KTtcblxuICAgIH1cblxuICAgIC8v5riy5p+T5Zu+6KGoXG4gICAgZnVuY3Rpb24gcmVuZGVyICgpIHtcblxuICAgICAgICB2YXIgY29uZmlnID0gbnVsbCxcbiAgICAgICAgICAgIGNoYXJ0Q29uZmlnID0gbnVsbCxcbiAgICAgICAgICAgIGNvbnRhaW5lciA9IG51bGw7XG5cbiAgICAgICAgZm9yICggdmFyIGkgPSAwLCBsZW4gPSBzb3VyY2VzLmxlbmd0aDsgaSA8IGxlbjsgaSsrICkge1xuXG4gICAgICAgICAgICBjb25maWcgPSBzb3VyY2VzWyBpIF07XG5cbiAgICAgICAgICAgIGNoYXJ0Q29uZmlnID0gYW5hbHlzaXNDb25maWcoIGNvbmZpZyApO1xuXG4gICAgICAgICAgICBjb250YWluZXIgPSBjcmVhdGVDb250YWluZXIoIGNvbmZpZy50YWJsZSApO1xuXG4gICAgICAgICAgICByZW5kZXJDaGFydCggY29udGFpbmVyLCB0eXBlQ29uZmlnWyBjb25maWcubWV0YS5jaGFydFR5cGUgXSwgY2hhcnRDb25maWcgKTtcblxuICAgICAgICB9XG5cblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOa4suafk+WbvuihqFxuICAgICAqIEBwYXJhbSBjb250YWluZXIg5Zu+6KGo5a655Zmo6IqC54K55a+56LGhXG4gICAgICogQHBhcmFtIHR5cGVDb25maWcg5Zu+6KGo57G75Z6L6YWN572uXG4gICAgICogQHBhcmFtIGNvbmZpZyDlm77ooajpgJrnlKjphY3nva5cbiAgICAgKiAqL1xuICAgIGZ1bmN0aW9uIHJlbmRlckNoYXJ0ICggY29udGFpbmVyLCB0eXBlQ29uZmlnLCBjb25maWcgKSB7XG5cblxuICAgICAgICAkKCBjb250YWluZXIgKS5oaWdoY2hhcnRzKCAkLmV4dGVuZCgge30sIHR5cGVDb25maWcsIHtcblxuICAgICAgICAgICAgY3JlZGl0czoge1xuICAgICAgICAgICAgICAgIGVuYWJsZWQ6IGZhbHNlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXhwb3J0aW5nOiB7XG4gICAgICAgICAgICAgICAgZW5hYmxlZDogZmFsc2VcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0aXRsZToge1xuICAgICAgICAgICAgICAgIHRleHQ6IGNvbmZpZy50aXRsZSxcbiAgICAgICAgICAgICAgICB4OiAtMjAgLy9jZW50ZXJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdWJ0aXRsZToge1xuICAgICAgICAgICAgICAgIHRleHQ6IGNvbmZpZy5zdWJUaXRsZSxcbiAgICAgICAgICAgICAgICB4OiAtMjBcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB4QXhpczoge1xuICAgICAgICAgICAgICAgIHRpdGxlOiB7XG4gICAgICAgICAgICAgICAgICAgIHRleHQ6IGNvbmZpZy54VGl0bGVcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGNhdGVnb3JpZXM6IGNvbmZpZy5jYXRlZ29yaWVzXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgeUF4aXM6IHtcbiAgICAgICAgICAgICAgICB0aXRsZToge1xuICAgICAgICAgICAgICAgICAgICB0ZXh0OiBjb25maWcueVRpdGxlXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBwbG90TGluZXM6IFt7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiAwLFxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogMSxcbiAgICAgICAgICAgICAgICAgICAgY29sb3I6ICcjODA4MDgwJ1xuICAgICAgICAgICAgICAgIH1dXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdG9vbHRpcDoge1xuICAgICAgICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgdmFsdWVTdWZmaXg6IGNvbmZpZy5zdWZmaXhcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsZWdlbmQ6IHtcbiAgICAgICAgICAgICAgICBsYXlvdXQ6ICd2ZXJ0aWNhbCcsXG4gICAgICAgICAgICAgICAgYWxpZ246ICdyaWdodCcsXG4gICAgICAgICAgICAgICAgdmVydGljYWxBbGlnbjogJ21pZGRsZScsXG4gICAgICAgICAgICAgICAgYm9yZGVyV2lkdGg6IDFcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXJpZXM6IGNvbmZpZy5zZXJpZXNcblxuICAgICAgICB9ICkpO1xuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5Yib5bu65Zu+6KGo55qE5a655ZmoXG4gICAgICog5paw5Yib5bu655qE5a655Zmo5Lya5pu/5o2i5o6J5a+55bqU55qEdGFibGXlr7nosaFcbiAgICAgKiAqL1xuICAgIGZ1bmN0aW9uIGNyZWF0ZUNvbnRhaW5lciAoIHRhYmxlTm9kZSApIHtcblxuICAgICAgICB2YXIgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggXCJkaXZcIiApO1xuICAgICAgICBjb250YWluZXIuY2xhc3NOYW1lID0gXCJlZHVpLWNoYXJ0LWNvbnRhaW5lclwiO1xuXG4gICAgICAgIHRhYmxlTm9kZS5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZCggY29udGFpbmVyLCB0YWJsZU5vZGUgKTtcblxuICAgICAgICByZXR1cm4gY29udGFpbmVyO1xuXG4gICAgfVxuXG4gICAgLy/moLnmja5jb25maWfop6PmnpDlh7rmraPnoa7nmoTnsbvliKvlkozlm77ooajmlbDmja7kv6Hmga9cbiAgICBmdW5jdGlvbiBhbmFseXNpc0NvbmZpZyAoIGNvbmZpZyApIHtcblxuICAgICAgICB2YXIgc2VyaWVzID0gW10sXG4gICAgICAgIC8v5pWw5o2u57G75YirXG4gICAgICAgICAgICBjYXRlZ29yaWVzID0gW10sXG4gICAgICAgICAgICByZXN1bHQgPSBbXSxcbiAgICAgICAgICAgIGRhdGEgPSBjb25maWcuZGF0YSxcbiAgICAgICAgICAgIG1ldGEgPSBjb25maWcubWV0YTtcblxuICAgICAgICAvL+aVsOaNruWvuem9kOaWueW8j+S4uuebuOWPjeeahOaWueW8j++8jCDpnIDopoHlj43ovazmlbDmja5cbiAgICAgICAgaWYgKCBtZXRhLmRhdGFGb3JtYXQgIT0gXCIxXCIgKSB7XG5cbiAgICAgICAgICAgIGZvciAoIHZhciBpID0gMCwgbGVuID0gZGF0YS5sZW5ndGg7IGkgPCBsZW4gOyBpKysgKSB7XG5cbiAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaiA9IDAsIGpsZW4gPSBkYXRhWyBpIF0ubGVuZ3RoOyBqIDwgamxlbjsgaisrICkge1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICggIXJlc3VsdFsgaiBdICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0WyBqIF0gPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdFsgaiBdWyBpIF0gPSBkYXRhWyBpIF1bIGogXTtcblxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkYXRhID0gcmVzdWx0O1xuXG4gICAgICAgIH1cblxuICAgICAgICByZXN1bHQgPSB7fTtcblxuICAgICAgICAvL+aZrumAmuWbvuihqFxuICAgICAgICBpZiAoIG1ldGEuY2hhcnRUeXBlICE9IHR5cGVDb25maWcubGVuZ3RoIC0gMSApIHtcblxuICAgICAgICAgICAgY2F0ZWdvcmllcyA9IGRhdGFbIDAgXS5zbGljZSggMSApO1xuXG4gICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDEsIGN1ckRhdGE7IGN1ckRhdGEgPSBkYXRhWyBpIF07IGkrKyApIHtcbiAgICAgICAgICAgICAgICBzZXJpZXMucHVzaCgge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBjdXJEYXRhWyAwIF0sXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGN1ckRhdGEuc2xpY2UoIDEgKVxuICAgICAgICAgICAgICAgIH0gKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVzdWx0LnNlcmllcyA9IHNlcmllcztcbiAgICAgICAgICAgIHJlc3VsdC5jYXRlZ29yaWVzID0gY2F0ZWdvcmllcztcbiAgICAgICAgICAgIHJlc3VsdC50aXRsZSA9IG1ldGEudGl0bGU7XG4gICAgICAgICAgICByZXN1bHQuc3ViVGl0bGUgPSBtZXRhLnN1YlRpdGxlO1xuICAgICAgICAgICAgcmVzdWx0LnhUaXRsZSA9IG1ldGEueFRpdGxlO1xuICAgICAgICAgICAgcmVzdWx0LnlUaXRsZSA9IG1ldGEueVRpdGxlO1xuICAgICAgICAgICAgcmVzdWx0LnN1ZmZpeCA9IG1ldGEuc3VmZml4O1xuXG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgIHZhciBjdXJEYXRhID0gW107XG5cbiAgICAgICAgICAgIGZvciAoIHZhciBpID0gMSwgbGVuID0gZGF0YVsgMCBdLmxlbmd0aDsgaSA8IGxlbjsgaSsrICkge1xuXG4gICAgICAgICAgICAgICAgY3VyRGF0YS5wdXNoKCBbIGRhdGFbIDAgXVsgaSBdLCBkYXRhWyAxIF1bIGkgXSB8IDAgXSApO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8v6aW85Zu+XG4gICAgICAgICAgICBzZXJpZXNbIDAgXSA9IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAncGllJyxcbiAgICAgICAgICAgICAgICBuYW1lOiBtZXRhLnRpcCxcbiAgICAgICAgICAgICAgICBkYXRhOiBjdXJEYXRhXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICByZXN1bHQuc2VyaWVzID0gc2VyaWVzO1xuICAgICAgICAgICAgcmVzdWx0LnRpdGxlID0gbWV0YS50aXRsZTtcbiAgICAgICAgICAgIHJlc3VsdC5zdWZmaXggPSBtZXRhLnN1ZmZpeDtcblxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcblxuICAgIH1cblxufSk7XG5VRS5wYXJzZS5yZWdpc3RlcignYmFja2dyb3VuZCcsIGZ1bmN0aW9uICh1dGlscykge1xuICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgIHJvb3QgPSBtZS5yb290LFxuICAgICAgICBwID0gcm9vdC5nZXRFbGVtZW50c0J5VGFnTmFtZSgncCcpLFxuICAgICAgICBzdHlsZXM7XG5cbiAgICBmb3IgKHZhciBpID0gMCxjaTsgY2kgPSBwW2krK107KSB7XG4gICAgICAgIHN0eWxlcyA9IGNpLmdldEF0dHJpYnV0ZSgnZGF0YS1iYWNrZ3JvdW5kJyk7XG4gICAgICAgIGlmIChzdHlsZXMpe1xuICAgICAgICAgICAgY2kucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChjaSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvL+i/veWKoOm7mOiupOeahOihqOagvOagt+W8j1xuICAgIHN0eWxlcyAmJiB1dGlscy5jc3NSdWxlKCd1ZWRpdG9yX2JhY2tncm91bmQnLCBtZS5zZWxlY3RvciArICd7JyArIHN0eWxlcyArICd9JywgZG9jdW1lbnQpO1xufSk7XG5VRS5wYXJzZS5yZWdpc3RlcignbGlzdCcsZnVuY3Rpb24odXRpbHMpe1xuICAgIHZhciBjdXN0b21Dc3MgPSBbXSxcbiAgICAgICAgY3VzdG9tU3R5bGUgPSB7XG4gICAgICAgICAgICAnY24nICAgIDogICAnY24tMS0nLFxuICAgICAgICAgICAgJ2NuMScgICA6ICAgJ2NuLTItJyxcbiAgICAgICAgICAgICdjbjInICAgOiAgICdjbi0zLScsXG4gICAgICAgICAgICAnbnVtJyAgIDogICAnbnVtLTEtJyxcbiAgICAgICAgICAgICdudW0xJyAgOiAgICdudW0tMi0nLFxuICAgICAgICAgICAgJ251bTInICA6ICAgJ251bS0zLScsXG4gICAgICAgICAgICAnZGFzaCcgIDogICAnZGFzaCcsXG4gICAgICAgICAgICAnZG90JyAgIDogICAnZG90J1xuICAgICAgICB9O1xuXG5cbiAgICB1dGlscy5leHRlbmQodGhpcyx7XG4gICAgICAgIGxpaWNvbnBhdGggOiAnaHR0cDovL2JzLmJhaWR1LmNvbS9saXN0aWNvbi8nLFxuICAgICAgICBsaXN0RGVmYXVsdFBhZGRpbmdMZWZ0IDogJzIwJ1xuICAgIH0pO1xuXG4gICAgdmFyIHJvb3QgPSB0aGlzLnJvb3QsXG4gICAgICAgIG9scyA9IHJvb3QuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ29sJyksXG4gICAgICAgIHVscyA9IHJvb3QuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3VsJyksXG4gICAgICAgIHNlbGVjdG9yID0gdGhpcy5zZWxlY3RvcjtcblxuICAgIGlmKG9scy5sZW5ndGgpe1xuICAgICAgICBhcHBseVN0eWxlLmNhbGwodGhpcyxvbHMpO1xuICAgIH1cblxuICAgIGlmKHVscy5sZW5ndGgpe1xuICAgICAgICBhcHBseVN0eWxlLmNhbGwodGhpcyx1bHMpO1xuICAgIH1cblxuICAgIGlmKG9scy5sZW5ndGggfHwgdWxzLmxlbmd0aCl7XG4gICAgICAgIGN1c3RvbUNzcy5wdXNoKHNlbGVjdG9yICsnIC5saXN0LXBhZGRpbmdsZWZ0LTF7cGFkZGluZy1sZWZ0OjB9Jyk7XG4gICAgICAgIGN1c3RvbUNzcy5wdXNoKHNlbGVjdG9yICsnIC5saXN0LXBhZGRpbmdsZWZ0LTJ7cGFkZGluZy1sZWZ0OicrIHRoaXMubGlzdERlZmF1bHRQYWRkaW5nTGVmdCsncHh9Jyk7XG4gICAgICAgIGN1c3RvbUNzcy5wdXNoKHNlbGVjdG9yICsnIC5saXN0LXBhZGRpbmdsZWZ0LTN7cGFkZGluZy1sZWZ0OicrIHRoaXMubGlzdERlZmF1bHRQYWRkaW5nTGVmdCoyKydweH0nKTtcblxuICAgICAgICB1dGlscy5jc3NSdWxlKCdsaXN0Jywgc2VsZWN0b3IgKycgb2wsJytzZWxlY3RvciArJyB1bHttYXJnaW46MDtwYWRkaW5nOjA7fWxpe2NsZWFyOmJvdGg7fScrY3VzdG9tQ3NzLmpvaW4oJ1xcbicpLCBkb2N1bWVudCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGFwcGx5U3R5bGUobm9kZXMpe1xuICAgICAgICB2YXIgVCA9IHRoaXM7XG4gICAgICAgIHV0aWxzLmVhY2gobm9kZXMsZnVuY3Rpb24obGlzdCl7XG4gICAgICAgICAgICBpZihsaXN0LmNsYXNzTmFtZSAmJiAvY3VzdG9tXy9pLnRlc3QobGlzdC5jbGFzc05hbWUpKXtcbiAgICAgICAgICAgICAgICB2YXIgbGlzdFN0eWxlID0gbGlzdC5jbGFzc05hbWUubWF0Y2goL2N1c3RvbV8oXFx3KykvKVsxXTtcbiAgICAgICAgICAgICAgICBpZihsaXN0U3R5bGUgPT0gJ2Rhc2gnIHx8IGxpc3RTdHlsZSA9PSAnZG90Jyl7XG4gICAgICAgICAgICAgICAgICAgIHV0aWxzLnB1c2hJdGVtKGN1c3RvbUNzcyxzZWxlY3RvciArJyBsaS5saXN0LScgKyBjdXN0b21TdHlsZVtsaXN0U3R5bGVdICsgJ3tiYWNrZ3JvdW5kLWltYWdlOnVybCgnICsgVC5saWljb25wYXRoICtjdXN0b21TdHlsZVtsaXN0U3R5bGVdKycuZ2lmKX0nKTtcbiAgICAgICAgICAgICAgICAgICAgdXRpbHMucHVzaEl0ZW0oY3VzdG9tQ3NzLHNlbGVjdG9yICsnIHVsLmN1c3RvbV8nK2xpc3RTdHlsZSsne2xpc3Qtc3R5bGU6bm9uZTt9ICcrIHNlbGVjdG9yICsnIHVsLmN1c3RvbV8nK2xpc3RTdHlsZSsnIGxpe2JhY2tncm91bmQtcG9zaXRpb246MCAzcHg7YmFja2dyb3VuZC1yZXBlYXQ6bm8tcmVwZWF0fScpO1xuXG4gICAgICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IDE7XG4gICAgICAgICAgICAgICAgICAgIHV0aWxzLmVhY2gobGlzdC5jaGlsZE5vZGVzLGZ1bmN0aW9uKGxpKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKGxpLnRhZ05hbWUgPT0gJ0xJJyl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXRpbHMucHVzaEl0ZW0oY3VzdG9tQ3NzLHNlbGVjdG9yICsgJyBsaS5saXN0LScgKyBjdXN0b21TdHlsZVtsaXN0U3R5bGVdICsgaW5kZXggKyAne2JhY2tncm91bmQtaW1hZ2U6dXJsKCcgKyBULmxpaWNvbnBhdGggICsgJ2xpc3QtJytjdXN0b21TdHlsZVtsaXN0U3R5bGVdICtpbmRleCArICcuZ2lmKX0nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgdXRpbHMucHVzaEl0ZW0oY3VzdG9tQ3NzLHNlbGVjdG9yICsgJyBvbC5jdXN0b21fJytsaXN0U3R5bGUrJ3tsaXN0LXN0eWxlOm5vbmU7fScrc2VsZWN0b3IrJyBvbC5jdXN0b21fJytsaXN0U3R5bGUrJyBsaXtiYWNrZ3JvdW5kLXBvc2l0aW9uOjAgM3B4O2JhY2tncm91bmQtcmVwZWF0Om5vLXJlcGVhdH0nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc3dpdGNoKGxpc3RTdHlsZSl7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2NuJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHV0aWxzLnB1c2hJdGVtKGN1c3RvbUNzcyxzZWxlY3RvciArICcgbGkubGlzdC0nK2xpc3RTdHlsZSsnLXBhZGRpbmdsZWZ0LTF7cGFkZGluZy1sZWZ0OjI1cHh9Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB1dGlscy5wdXNoSXRlbShjdXN0b21Dc3Msc2VsZWN0b3IgKyAnIGxpLmxpc3QtJytsaXN0U3R5bGUrJy1wYWRkaW5nbGVmdC0ye3BhZGRpbmctbGVmdDo0MHB4fScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdXRpbHMucHVzaEl0ZW0oY3VzdG9tQ3NzLHNlbGVjdG9yICsgJyBsaS5saXN0LScrbGlzdFN0eWxlKyctcGFkZGluZ2xlZnQtM3twYWRkaW5nLWxlZnQ6NTVweH0nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdjbjEnOlxuICAgICAgICAgICAgICAgICAgICAgICAgdXRpbHMucHVzaEl0ZW0oY3VzdG9tQ3NzLHNlbGVjdG9yICsgJyBsaS5saXN0LScrbGlzdFN0eWxlKyctcGFkZGluZ2xlZnQtMXtwYWRkaW5nLWxlZnQ6MzBweH0nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHV0aWxzLnB1c2hJdGVtKGN1c3RvbUNzcyxzZWxlY3RvciArICcgbGkubGlzdC0nK2xpc3RTdHlsZSsnLXBhZGRpbmdsZWZ0LTJ7cGFkZGluZy1sZWZ0OjQwcHh9Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB1dGlscy5wdXNoSXRlbShjdXN0b21Dc3Msc2VsZWN0b3IgKyAnIGxpLmxpc3QtJytsaXN0U3R5bGUrJy1wYWRkaW5nbGVmdC0ze3BhZGRpbmctbGVmdDo1NXB4fScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2NuMic6XG4gICAgICAgICAgICAgICAgICAgICAgICB1dGlscy5wdXNoSXRlbShjdXN0b21Dc3Msc2VsZWN0b3IgKyAnIGxpLmxpc3QtJytsaXN0U3R5bGUrJy1wYWRkaW5nbGVmdC0xe3BhZGRpbmctbGVmdDo0MHB4fScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdXRpbHMucHVzaEl0ZW0oY3VzdG9tQ3NzLHNlbGVjdG9yICsgJyBsaS5saXN0LScrbGlzdFN0eWxlKyctcGFkZGluZ2xlZnQtMntwYWRkaW5nLWxlZnQ6NTVweH0nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHV0aWxzLnB1c2hJdGVtKGN1c3RvbUNzcyxzZWxlY3RvciArICcgbGkubGlzdC0nK2xpc3RTdHlsZSsnLXBhZGRpbmdsZWZ0LTN7cGFkZGluZy1sZWZ0OjY4cHh9Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnbnVtJzpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnbnVtMSc6XG4gICAgICAgICAgICAgICAgICAgICAgICB1dGlscy5wdXNoSXRlbShjdXN0b21Dc3Msc2VsZWN0b3IgKyAnIGxpLmxpc3QtJytsaXN0U3R5bGUrJy1wYWRkaW5nbGVmdC0xe3BhZGRpbmctbGVmdDoyNXB4fScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ251bTInOlxuICAgICAgICAgICAgICAgICAgICAgICAgdXRpbHMucHVzaEl0ZW0oY3VzdG9tQ3NzLHNlbGVjdG9yICsgJyBsaS5saXN0LScrbGlzdFN0eWxlKyctcGFkZGluZ2xlZnQtMXtwYWRkaW5nLWxlZnQ6MzVweH0nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHV0aWxzLnB1c2hJdGVtKGN1c3RvbUNzcyxzZWxlY3RvciArICcgbGkubGlzdC0nK2xpc3RTdHlsZSsnLXBhZGRpbmdsZWZ0LTJ7cGFkZGluZy1sZWZ0OjQwcHh9Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnZGFzaCc6XG4gICAgICAgICAgICAgICAgICAgICAgICB1dGlscy5wdXNoSXRlbShjdXN0b21Dc3Msc2VsZWN0b3IgKyAnIGxpLmxpc3QtJytsaXN0U3R5bGUrJy1wYWRkaW5nbGVmdHtwYWRkaW5nLWxlZnQ6MzVweH0nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdkb3QnOlxuICAgICAgICAgICAgICAgICAgICAgICAgdXRpbHMucHVzaEl0ZW0oY3VzdG9tQ3NzLHNlbGVjdG9yICsgJyBsaS5saXN0LScrbGlzdFN0eWxlKyctcGFkZGluZ2xlZnR7cGFkZGluZy1sZWZ0OjIwcHh9Jyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cblxufSk7XG5VRS5wYXJzZS5yZWdpc3RlcigndmVkaW8nLGZ1bmN0aW9uKHV0aWxzKXtcbiAgICB2YXIgdmlkZW8gPSB0aGlzLnJvb3QuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3ZpZGVvJyksXG4gICAgICAgIGF1ZGlvID0gdGhpcy5yb290LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdhdWRpbycpO1xuXG4gICAgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndmlkZW8nKTtkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhdWRpbycpO1xuICAgIGlmKHZpZGVvLmxlbmd0aCB8fCBhdWRpby5sZW5ndGgpe1xuICAgICAgICB2YXIgc291cmNlUGF0aCA9IHV0aWxzLnJlbW92ZUxhc3Ricyh0aGlzLnJvb3RQYXRoKSxcbiAgICAgICAgICAgIGpzdXJsID0gc291cmNlUGF0aCArICcvdGhpcmQtcGFydHkvdmlkZW8tanMvdmlkZW8uanMnLFxuICAgICAgICAgICAgY3NzdXJsID0gc291cmNlUGF0aCArICcvdGhpcmQtcGFydHkvdmlkZW8tanMvdmlkZW8tanMubWluLmNzcycsXG4gICAgICAgICAgICBzd2ZVcmwgPSBzb3VyY2VQYXRoICsgJy90aGlyZC1wYXJ0eS92aWRlby1qcy92aWRlby1qcy5zd2YnO1xuXG4gICAgICAgIGlmKHdpbmRvdy52aWRlb2pzKSB7XG4gICAgICAgICAgICB2aWRlb2pzLmF1dG9TZXR1cCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdXRpbHMubG9hZEZpbGUoZG9jdW1lbnQse1xuICAgICAgICAgICAgICAgIGlkIDogXCJ2aWRlb19jc3NcIixcbiAgICAgICAgICAgICAgICB0YWcgOiBcImxpbmtcIixcbiAgICAgICAgICAgICAgICByZWwgOiBcInN0eWxlc2hlZXRcIixcbiAgICAgICAgICAgICAgICB0eXBlIDogXCJ0ZXh0L2Nzc1wiLFxuICAgICAgICAgICAgICAgIGhyZWYgOiBjc3N1cmxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdXRpbHMubG9hZEZpbGUoZG9jdW1lbnQse1xuICAgICAgICAgICAgICAgIGlkIDogXCJ2aWRlb19qc1wiLFxuICAgICAgICAgICAgICAgIHNyYyA6IGpzdXJsLFxuICAgICAgICAgICAgICAgIHRhZyA6IFwic2NyaXB0XCIsXG4gICAgICAgICAgICAgICAgdHlwZSA6IFwidGV4dC9qYXZhc2NyaXB0XCJcbiAgICAgICAgICAgIH0sZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICB2aWRlb2pzLm9wdGlvbnMuZmxhc2guc3dmID0gc3dmVXJsO1xuICAgICAgICAgICAgICAgIHZpZGVvanMuYXV0b1NldHVwKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgfVxufSk7XG5cbn0pKCk7XG4iXSwiZmlsZSI6InBsdWdpbnMvdWVkaXRvci91ZWRpdG9yLnBhcnNlLmpzIn0=
