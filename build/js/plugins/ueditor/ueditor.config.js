/**
 * ueditor完整配置项
 * 可以在这里配置整个编辑器的特性
 */
/**************************提示********************************
 * 所有被注释的配置项均为UEditor默认值。
 * 修改默认配置请首先确保已经完全明确该参数的真实用途。
 * 主要有两种修改方案，一种是取消此处注释，然后修改成对应参数；另一种是在实例化编辑器时传入对应参数。
 * 当升级编辑器时，可直接使用旧版配置文件替换新版配置文件,不用担心旧版配置文件中因缺少新功能所需的参数而导致脚本报错。
 **************************提示********************************/
define(function(require){
(function () {

    /**
     * 编辑器资源文件根路径。它所表示的含义是：以编辑器实例化页面为当前路径，指向编辑器资源文件（即dialog等文件夹）的路径。
     * 鉴于很多同学在使用编辑器的时候出现的种种路径问题，此处强烈建议大家使用"相对于网站根目录的相对路径"进行配置。
     * "相对于网站根目录的相对路径"也就是以斜杠开头的形如"/myProject/ueditor/"这样的路径。
     * 如果站点中有多个不在同一层级的页面需要实例化编辑器，且引用了同一UEditor的时候，此处的URL可能不适用于每个页面的编辑器。
     * 因此，UEditor提供了针对不同页面的编辑器可单独配置的根路径，具体来说，在需要实例化编辑器的页面最顶部写上如下代码即可。当然，需要令此处的URL等于对应的配置。
     * window.UEDITOR_HOME_URL = "/xxxx/xxxx/";
     */
    var URL = window.UEDITOR_HOME_URL || getUEBasePath();
    var URL = "/js/plugins/ueditor/";
    var langPath=URL +"lang/"  
    window.UEDITOR_HOME_URL=URL;
    /**
     * 配置项主体。注意，此处所有涉及到路径的配置别遗漏URL变量。
     */
    window.UEDITOR_CONFIG = {

        //为编辑器实例添加一个路径，这个不能被注释
        UEDITOR_HOME_URL: URL

        // 服务器统一请求接口路径
        , serverUrl: ""

        //工具栏上的所有的功能按钮和下拉框，可以在new编辑器的实例时选择自己需要的重新定义
        , toolbars: [[
            'fullscreen', 'source', '|', 'undo', 'redo', '|',
            'bold', 'italic', 'underline', 'fontborder', 'strikethrough', 'superscript', 'subscript', 'removeformat', 'formatmatch', 'autotypeset', 'blockquote', 'pasteplain', '|', 'forecolor', 'backcolor', 'insertorderedlist', 'insertunorderedlist', 'selectall', 'cleardoc', '|',
            'rowspacingtop', 'rowspacingbottom', 'lineheight', '|',
            'customstyle', 'paragraph', 'fontfamily', 'fontsize', '|',
            'directionalityltr', 'directionalityrtl', 'indent', '|',
            'justifyleft', 'justifycenter', 'justifyright', 'justifyjustify', '|', 'touppercase', 'tolowercase', '|',
            'link', 'unlink', 'anchor', '|', 'imagenone', 'imageleft', 'imageright', 'imagecenter', '|',
            'simpleupload', 'insertimage', 'emotion', 'scrawl', 'insertvideo', 'music', 'attachment', 'map', 'gmap', 'insertframe', 'insertcode', 'webapp', 'pagebreak', 'template', 'background', '|',
            'horizontal', 'date', 'time', 'spechars', 'snapscreen', 'wordimage', '|',
            'inserttable', 'deletetable', 'insertparagraphbeforetable', 'insertrow', 'deleterow', 'insertcol', 'deletecol', 'mergecells', 'mergeright', 'mergedown', 'splittocells', 'splittorows', 'splittocols', 'charts', '|',
            'print', 'preview', 'searchreplace', 'drafts', 'help'
        ]]
        //当鼠标放在工具栏上时显示的tooltip提示,留空支持自动多语言配置，否则以配置值为准
        //,labelMap:{
        //    'anchor':'', 'undo':''
        //}

        //语言配置项,默认是zh-cn。有需要的话也可以使用如下这样的方式来自动多语言切换，当然，前提条件是lang文件夹下存在对应的语言文件：
        //lang值也可以通过自动获取 (navigator.language||navigator.browserLanguage ||navigator.userLanguage).toLowerCase()
        ,lang:"zh-cn"
        ,langPath:URL +"lang/"

        //主题配置项,默认是default。有需要的话也可以使用如下这样的方式来自动多主题切换，当然，前提条件是themes文件夹下存在对应的主题文件：
        //现有如下皮肤:default
        //,theme:'default'
        //,themePath:URL +"themes/"

        //,zIndex : 900     //编辑器层级的基数,默认是900

        //针对getAllHtml方法，会在对应的head标签中增加该编码设置。
        //,charset:"utf-8"

        //若实例化编辑器的页面手动修改的domain，此处需要设置为true
        //,customDomain:false

        //常用配置项目
        //,isShow : true    //默认显示编辑器

        //,textarea:'editorValue' // 提交表单时，服务器获取编辑器提交内容的所用的参数，多实例时可以给容器name属性，会将name给定的值最为每个实例的键值，不用每次实例化的时候都设置这个值

        //,initialContent:'欢迎使用ueditor!'    //初始化编辑器的内容,也可以通过textarea/script给值，看官网例子

        //,autoClearinitialContent:true //是否自动清除编辑器初始内容，注意：如果focus属性设置为true,这个也为真，那么编辑器一上来就会触发导致初始化的内容看不到了

        //,focus:false //初始化时，是否让编辑器获得焦点true或false

        //如果自定义，最好给p标签如下的行高，要不输入中文时，会有跳动感
        //,initialStyle:'p{line-height:1em}'//编辑器层级的基数,可以用来改变字体等

        //,iframeCssUrl: URL + '/themes/iframe.css' //给编辑区域的iframe引入一个css文件

        //indentValue
        //首行缩进距离,默认是2em
        //,indentValue:'2em'

        //,initialFrameWidth:1000  //初始化编辑器宽度,默认1000
        //,initialFrameHeight:320  //初始化编辑器高度,默认320

        //,readonly : false //编辑器初始化结束后,编辑区域是否是只读的，默认是false

        //,autoClearEmptyNode : true //getContent时，是否删除空的inlineElement节点（包括嵌套的情况）

        //启用自动保存
        //,enableAutoSave: true
        //自动保存间隔时间， 单位ms
        //,saveInterval: 500

        //,fullscreen : false //是否开启初始化时即全屏，默认关闭

        //,imagePopup:true      //图片操作的浮层开关，默认打开

        //,autoSyncData:true //自动同步编辑器要提交的数据
        //,emotionLocalization:false //是否开启表情本地化，默认关闭。若要开启请确保emotion文件夹下包含官网提供的images表情文件夹

        //粘贴只保留标签，去除标签所有属性
        //,retainOnlyLabelPasted: false

        //,pasteplain:false  //是否默认为纯文本粘贴。false为不使用纯文本粘贴，true为使用纯文本粘贴
        //纯文本粘贴模式下的过滤规则
        //'filterTxtRules' : function(){
        //    function transP(node){
        //        node.tagName = 'p';
        //        node.setStyle();
        //    }
        //    return {
        //        //直接删除及其字节点内容
        //        '-' : 'script style object iframe embed input select',
        //        'p': {$:{}},
        //        'br':{$:{}},
        //        'div':{'$':{}},
        //        'li':{'$':{}},
        //        'caption':transP,
        //        'th':transP,
        //        'tr':transP,
        //        'h1':transP,'h2':transP,'h3':transP,'h4':transP,'h5':transP,'h6':transP,
        //        'td':function(node){
        //            //没有内容的td直接删掉
        //            var txt = !!node.innerText();
        //            if(txt){
        //                node.parentNode.insertAfter(UE.uNode.createText(' &nbsp; &nbsp;'),node);
        //            }
        //            node.parentNode.removeChild(node,node.innerText())
        //        }
        //    }
        //}()

        //,allHtmlEnabled:false //提交到后台的数据是否包含整个html字符串

        //insertorderedlist
        //有序列表的下拉配置,值留空时支持多语言自动识别，若配置值，则以此值为准
        //,'insertorderedlist':{
        //      //自定的样式
        //        'num':'1,2,3...',
        //        'num1':'1),2),3)...',
        //        'num2':'(1),(2),(3)...',
        //        'cn':'一,二,三....',
        //        'cn1':'一),二),三)....',
        //        'cn2':'(一),(二),(三)....',
        //     //系统自带
        //     'decimal' : '' ,         //'1,2,3...'
        //     'lower-alpha' : '' ,    // 'a,b,c...'
        //     'lower-roman' : '' ,    //'i,ii,iii...'
        //     'upper-alpha' : '' , lang   //'A,B,C'
        //     'upper-roman' : ''      //'I,II,III...'
        //}

        //insertunorderedlist
        //无序列表的下拉配置，值留空时支持多语言自动识别，若配置值，则以此值为准
        //,insertunorderedlist : { //自定的样式
        //    'dash' :'— 破折号', //-破折号
        //    'dot':' 。 小圆圈', //系统自带
        //    'circle' : '',  // '○ 小圆圈'
        //    'disc' : '',    // '● 小圆点'
        //    'square' : ''   //'■ 小方块'
        //}
        //,listDefaultPaddingLeft : '30'//默认的左边缩进的基数倍
        //,listiconpath : 'http://bs.baidu.com/listicon/'//自定义标号的路径
        //,maxListLevel : 3 //限制可以tab的级数, 设置-1为不限制

        //,autoTransWordToList:false  //禁止word中粘贴进来的列表自动变成列表标签

        //fontfamily
        //字体设置 label留空支持多语言自动切换，若配置，则以配置值为准
        //,'fontfamily':[
        //    { label:'',name:'songti',val:'宋体,SimSun'},
        //    { label:'',name:'kaiti',val:'楷体,楷体_GB2312, SimKai'},
        //    { label:'',name:'yahei',val:'微软雅黑,Microsoft YaHei'},
        //    { label:'',name:'heiti',val:'黑体, SimHei'},
        //    { label:'',name:'lishu',val:'隶书, SimLi'},
        //    { label:'',name:'andaleMono',val:'andale mono'},
        //    { label:'',name:'arial',val:'arial, helvetica,sans-serif'},
        //    { label:'',name:'arialBlack',val:'arial black,avant garde'},
        //    { label:'',name:'comicSansMs',val:'comic sans ms'},
        //    { label:'',name:'impact',val:'impact,chicago'},
        //    { label:'',name:'timesNewRoman',val:'times new roman'}
        //]

        //fontsize
        //字号
        //,'fontsize':[10, 11, 12, 14, 16, 18, 20, 24, 36]

        //paragraph
        //段落格式 值留空时支持多语言自动识别，若配置，则以配置值为准
        //,'paragraph':{'p':'', 'h1':'', 'h2':'', 'h3':'', 'h4':'', 'h5':'', 'h6':''}

        //rowspacingtop
        //段间距 值和显示的名字相同
        //,'rowspacingtop':['5', '10', '15', '20', '25']

        //rowspacingBottom
        //段间距 值和显示的名字相同
        //,'rowspacingbottom':['5', '10', '15', '20', '25']

        //lineheight
        //行内间距 值和显示的名字相同
        //,'lineheight':['1', '1.5','1.75','2', '3', '4', '5']

        //customstyle
        //自定义样式，不支持国际化，此处配置值即可最后显示值
        //block的元素是依据设置段落的逻辑设置的，inline的元素依据BIU的逻辑设置
        //尽量使用一些常用的标签
        //参数说明
        //tag 使用的标签名字
        //label 显示的名字也是用来标识不同类型的标识符，注意这个值每个要不同，
        //style 添加的样式
        //每一个对象就是一个自定义的样式
        //,'customstyle':[
        //    {tag:'h1', name:'tc', label:'', style:'border-bottom:#ccc 2px solid;padding:0 4px 0 0;text-align:center;margin:0 0 20px 0;'},
        //    {tag:'h1', name:'tl',label:'', style:'border-bottom:#ccc 2px solid;padding:0 4px 0 0;margin:0 0 10px 0;'},
        //    {tag:'span',name:'im', label:'', style:'font-style:italic;font-weight:bold'},
        //    {tag:'span',name:'hi', label:'', style:'font-style:italic;font-weight:bold;color:rgb(51, 153, 204)'}
        //]

        //打开右键菜单功能
        //,enableContextMenu: true
        //右键菜单的内容，可以参考plugins/contextmenu.js里边的默认菜单的例子，label留空支持国际化，否则以此配置为准
        //,contextMenu:[
        //    {
        //        label:'',       //显示的名称
        //        cmdName:'selectall',//执行的command命令，当点击这个右键菜单时
        //        //exec可选，有了exec就会在点击时执行这个function，优先级高于cmdName
        //        exec:function () {
        //            //this是当前编辑器的实例
        //            //this.ui._dialogs['inserttableDialog'].open();
        //        }
        //    }
        //]

        //快捷菜单
        //,shortcutMenu:["fontfamily", "fontsize", "bold", "italic", "underline", "forecolor", "backcolor", "insertorderedlist", "insertunorderedlist"]

        //elementPathEnabled
        //是否启用元素路径，默认是显示
        //,elementPathEnabled : true

        //wordCount
        //,wordCount:true          //是否开启字数统计
        //,maximumWords:10000       //允许的最大字符数
        //字数统计提示，{#count}代表当前字数，{#leave}代表还可以输入多少字符数,留空支持多语言自动切换，否则按此配置显示
        //,wordCountMsg:''   //当前已输入 {#count} 个字符，您还可以输入{#leave} 个字符
        //超出字数限制提示  留空支持多语言自动切换，否则按此配置显示
        //,wordOverFlowMsg:''    //<span style="color:red;">你输入的字符个数已经超出最大允许值，服务器可能会拒绝保存！</span>

        //tab
        //点击tab键时移动的距离,tabSize倍数，tabNode什么字符做为单位
        //,tabSize:4
        //,tabNode:'&nbsp;'

        //removeFormat
        //清除格式时可以删除的标签和属性
        //removeForamtTags标签
        //,removeFormatTags:'b,big,code,del,dfn,em,font,i,ins,kbd,q,samp,small,span,strike,strong,sub,sup,tt,u,var'
        //removeFormatAttributes属性
        //,removeFormatAttributes:'class,style,lang,width,height,align,hspace,valign'

        //undo
        //可以最多回退的次数,默认20
        //,maxUndoCount:20
        //当输入的字符数超过该值时，保存一次现场
        //,maxInputCount:1

        //autoHeightEnabled
        // 是否自动长高,默认true
        //,autoHeightEnabled:true

        //scaleEnabled
        //是否可以拉伸长高,默认true(当开启时，自动长高失效)
        //,scaleEnabled:false
        //,minFrameWidth:800    //编辑器拖动时最小宽度,默认800
        //,minFrameHeight:220  //编辑器拖动时最小高度,默认220

        //autoFloatEnabled
        //是否保持toolbar的位置不动,默认true
        //,autoFloatEnabled:true
        //浮动时工具栏距离浏览器顶部的高度，用于某些具有固定头部的页面
        //,topOffset:30
        //编辑器底部距离工具栏高度(如果参数大于等于编辑器高度，则设置无效)
        //,toolbarTopOffset:400

        //设置远程图片是否抓取到本地保存
        //,catchRemoteImageEnable: true //设置是否抓取远程图片

        //pageBreakTag
        //分页标识符,默认是_ueditor_page_break_tag_
        //,pageBreakTag:'_ueditor_page_break_tag_'

        //autotypeset
        //自动排版参数
        //,autotypeset: {
        //    mergeEmptyline: true,           //合并空行
        //    removeClass: true,              //去掉冗余的class
        //    removeEmptyline: false,         //去掉空行
        //    textAlign:"left",               //段落的排版方式，可以是 left,right,center,justify 去掉这个属性表示不执行排版
        //    imageBlockLine: 'center',       //图片的浮动方式，独占一行剧中,左右浮动，默认: center,left,right,none 去掉这个属性表示不执行排版
        //    pasteFilter: false,             //根据规则过滤没事粘贴进来的内容
        //    clearFontSize: false,           //去掉所有的内嵌字号，使用编辑器默认的字号
        //    clearFontFamily: false,         //去掉所有的内嵌字体，使用编辑器默认的字体
        //    removeEmptyNode: false,         // 去掉空节点
        //    //可以去掉的标签
        //    removeTagNames: {标签名字:1},
        //    indent: false,                  // 行首缩进
        //    indentValue : '2em',            //行首缩进的大小
        //    bdc2sb: false,
        //    tobdc: false
        //}

        //tableDragable
        //表格是否可以拖拽
        //,tableDragable: true



        //sourceEditor
        //源码的查看方式,codemirror 是代码高亮，textarea是文本框,默认是codemirror
        //注意默认codemirror只能在ie8+和非ie中使用
        //,sourceEditor:"codemirror"
        //如果sourceEditor是codemirror，还用配置一下两个参数
        //codeMirrorJsUrl js加载的路径，默认是 URL + "third-party/codemirror/codemirror.js"
        //,codeMirrorJsUrl:URL + "third-party/codemirror/codemirror.js"
        //codeMirrorCssUrl css加载的路径，默认是 URL + "third-party/codemirror/codemirror.css"
        //,codeMirrorCssUrl:URL + "third-party/codemirror/codemirror.css"
        //编辑器初始化完成后是否进入源码模式，默认为否。
        //,sourceEditorFirst:false

        //iframeUrlMap
        //dialog内容的路径 ～会被替换成URL,垓属性一旦打开，将覆盖所有的dialog的默认路径
        //,iframeUrlMap:{
        //    'anchor':'~/dialogs/anchor/anchor.html',
        //}

        //allowLinkProtocol 允许的链接地址，有这些前缀的链接地址不会自动添加http
        //, allowLinkProtocols: ['http:', 'https:', '#', '/', 'ftp:', 'mailto:', 'tel:', 'git:', 'svn:']

        //webAppKey 百度应用的APIkey，每个站长必须首先去百度官网注册一个key后方能正常使用app功能，注册介绍，http://app.baidu.com/static/cms/getapikey.html
        //, webAppKey: ""

        //默认过滤规则相关配置项目
        //,disabledTableInTable:true  //禁止表格嵌套
        //,allowDivTransToP:true      //允许进入编辑器的div标签自动变成p标签
        //,rgb2Hex:true               //默认产出的数据中的color自动从rgb格式变成16进制格式

		// xss 过滤是否开启,inserthtml等操作
		,xssFilterRules: true
		//input xss过滤
		,inputXssFilter: true
		//output xss过滤
		,outputXssFilter: true
		// xss过滤白名单 名单来源: https://raw.githubusercontent.com/leizongmin/js-xss/master/lib/default.js
		,whitList: {
			a:      ['target', 'href', 'title', 'class', 'style'],
			abbr:   ['title', 'class', 'style'],
			address: ['class', 'style'],
			area:   ['shape', 'coords', 'href', 'alt'],
			article: [],
			aside:  [],
			audio:  ['autoplay', 'controls', 'loop', 'preload', 'src', 'class', 'style'],
			b:      ['class', 'style'],
			bdi:    ['dir'],
			bdo:    ['dir'],
			big:    [],
			blockquote: ['cite', 'class', 'style'],
			br:     [],
			caption: ['class', 'style'],
			center: [],
			cite:   [],
			code:   ['class', 'style'],
			col:    ['align', 'valign', 'span', 'width', 'class', 'style'],
			colgroup: ['align', 'valign', 'span', 'width', 'class', 'style'],
			dd:     ['class', 'style'],
			del:    ['datetime'],
			details: ['open'],
			div:    ['class', 'style'],
			dl:     ['class', 'style'],
			dt:     ['class', 'style'],
			em:     ['class', 'style'],
			font:   ['color', 'size', 'face'],
			footer: [],
			h1:     ['class', 'style'],
			h2:     ['class', 'style'],
			h3:     ['class', 'style'],
			h4:     ['class', 'style'],
			h5:     ['class', 'style'],
			h6:     ['class', 'style'],
			header: [],
			hr:     [],
			i:      ['class', 'style'],
			img:    ['src', 'alt', 'title', 'width', 'height', 'id', '_src', 'loadingclass', 'class', 'data-latex'],
			ins:    ['datetime'],
			li:     ['class', 'style'],
			mark:   [],
			nav:    [],
			ol:     ['class', 'style'],
			p:      ['class', 'style'],
			pre:    ['class', 'style'],
			s:      [],
			section:[],
			small:  [],
			span:   ['class', 'style'],
			sub:    ['class', 'style'],
			sup:    ['class', 'style'],
			strong: ['class', 'style'],
			table:  ['width', 'border', 'align', 'valign', 'class', 'style'],
			tbody:  ['align', 'valign', 'class', 'style'],
			td:     ['width', 'rowspan', 'colspan', 'align', 'valign', 'class', 'style'],
			tfoot:  ['align', 'valign', 'class', 'style'],
			th:     ['width', 'rowspan', 'colspan', 'align', 'valign', 'class', 'style'],
			thead:  ['align', 'valign', 'class', 'style'],
			tr:     ['rowspan', 'align', 'valign', 'class', 'style'],
			tt:     [],
			u:      [],
			ul:     ['class', 'style'],
			video:  ['autoplay', 'controls', 'loop', 'preload', 'src', 'height', 'width', 'class', 'style']
		}
    };

    function getUEBasePath(docUrl, confUrl) {

        return getBasePath(docUrl || self.document.URL || self.location.href, confUrl || getConfigFilePath());

    }

    function getConfigFilePath() {

        var configPath = document.getElementsByTagName('script');

        return configPath[ configPath.length - 1 ].src;

    }

    function getBasePath(docUrl, confUrl) {

        var basePath = confUrl;


        if (/^(\/|\\\\)/.test(confUrl)) {

            basePath = /^.+?\w(\/|\\\\)/.exec(docUrl)[0] + confUrl.replace(/^(\/|\\\\)/, '');

        } else if (!/^[a-z]+:/i.test(confUrl)) {

            docUrl = docUrl.split("#")[0].split("?")[0].replace(/[^\\\/]+$/, '');

            basePath = docUrl + "" + confUrl;

        }

        return optimizationPath(basePath);

    }

    function optimizationPath(path) {

        var protocol = /^[a-z]+:\/\//.exec(path)[ 0 ],
            tmp = null,
            res = [];

        path = path.replace(protocol, "").split("?")[0].split("#")[0];

        path = path.replace(/\\/g, '/').split(/\//);

        path[ path.length - 1 ] = "";

        while (path.length) {

            if (( tmp = path.shift() ) === "..") {
                res.pop();
            } else if (tmp !== ".") {
                res.push(tmp);
            }

        }

        return protocol + res.join("/");

    }

    window.UE = {
        getUEBasePath: getUEBasePath
    };

})();
})
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvdWVkaXRvci5jb25maWcuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiB1ZWRpdG9y5a6M5pW06YWN572u6aG5XG4gKiDlj6/ku6XlnKjov5nph4zphY3nva7mlbTkuKrnvJbovpHlmajnmoTnibnmgKdcbiAqL1xuLyoqKioqKioqKioqKioqKioqKioqKioqKioq5o+Q56S6KioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqIOaJgOacieiiq+azqOmHiueahOmFjee9rumhueWdh+S4ulVFZGl0b3Lpu5jorqTlgLzjgIJcbiAqIOS/ruaUuem7mOiupOmFjee9ruivt+mmluWFiOehruS/neW3sue7j+WujOWFqOaYjuehruivpeWPguaVsOeahOecn+WunueUqOmAlOOAglxuICog5Li76KaB5pyJ5Lik56eN5L+u5pS55pa55qGI77yM5LiA56eN5piv5Y+W5raI5q2k5aSE5rOo6YeK77yM54S25ZCO5L+u5pS55oiQ5a+55bqU5Y+C5pWw77yb5Y+m5LiA56eN5piv5Zyo5a6e5L6L5YyW57yW6L6R5Zmo5pe25Lyg5YWl5a+55bqU5Y+C5pWw44CCXG4gKiDlvZPljYfnuqfnvJbovpHlmajml7bvvIzlj6/nm7TmjqXkvb/nlKjml6fniYjphY3nva7mlofku7bmm7/mjaLmlrDniYjphY3nva7mlofku7Ys5LiN55So5ouF5b+D5pen54mI6YWN572u5paH5Lu25Lit5Zug57y65bCR5paw5Yqf6IO95omA6ZyA55qE5Y+C5pWw6ICM5a+86Ie06ISa5pys5oql6ZSZ44CCXG4gKioqKioqKioqKioqKioqKioqKioqKioqKirmj5DnpLoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbmRlZmluZShmdW5jdGlvbihyZXF1aXJlKXtcbihmdW5jdGlvbiAoKSB7XG5cbiAgICAvKipcbiAgICAgKiDnvJbovpHlmajotYTmupDmlofku7bmoLnot6/lvoTjgILlroPmiYDooajnpLrnmoTlkKvkuYnmmK/vvJrku6XnvJbovpHlmajlrp7kvovljJbpobXpnaLkuLrlvZPliY3ot6/lvoTvvIzmjIflkJHnvJbovpHlmajotYTmupDmlofku7bvvIjljbNkaWFsb2fnrYnmlofku7blpLnvvInnmoTot6/lvoTjgIJcbiAgICAgKiDpibTkuo7lvojlpJrlkIzlrablnKjkvb/nlKjnvJbovpHlmajnmoTml7blgJnlh7rnjrDnmoTnp43np43ot6/lvoTpl67popjvvIzmraTlpITlvLrng4jlu7rorq7lpKflrrbkvb/nlKhcIuebuOWvueS6jue9keermeagueebruW9leeahOebuOWvuei3r+W+hFwi6L+b6KGM6YWN572u44CCXG4gICAgICogXCLnm7jlr7nkuo7nvZHnq5nmoLnnm67lvZXnmoTnm7jlr7not6/lvoRcIuS5n+WwseaYr+S7peaWnOadoOW8gOWktOeahOW9ouWmglwiL215UHJvamVjdC91ZWRpdG9yL1wi6L+Z5qC355qE6Lev5b6E44CCXG4gICAgICog5aaC5p6c56uZ54K55Lit5pyJ5aSa5Liq5LiN5Zyo5ZCM5LiA5bGC57qn55qE6aG16Z2i6ZyA6KaB5a6e5L6L5YyW57yW6L6R5Zmo77yM5LiU5byV55So5LqG5ZCM5LiAVUVkaXRvcueahOaXtuWAme+8jOatpOWkhOeahFVSTOWPr+iDveS4jemAgueUqOS6juavj+S4qumhtemdoueahOe8lui+keWZqOOAglxuICAgICAqIOWboOatpO+8jFVFZGl0b3Lmj5Dkvpvkuobpkojlr7nkuI3lkIzpobXpnaLnmoTnvJbovpHlmajlj6/ljZXni6zphY3nva7nmoTmoLnot6/lvoTvvIzlhbfkvZPmnaXor7TvvIzlnKjpnIDopoHlrp7kvovljJbnvJbovpHlmajnmoTpobXpnaLmnIDpobbpg6jlhpnkuIrlpoLkuIvku6PnoIHljbPlj6/jgILlvZPnhLbvvIzpnIDopoHku6TmraTlpITnmoRVUkznrYnkuo7lr7nlupTnmoTphY3nva7jgIJcbiAgICAgKiB3aW5kb3cuVUVESVRPUl9IT01FX1VSTCA9IFwiL3h4eHgveHh4eC9cIjtcbiAgICAgKi9cbiAgICB2YXIgVVJMID0gd2luZG93LlVFRElUT1JfSE9NRV9VUkwgfHwgZ2V0VUVCYXNlUGF0aCgpO1xuICAgIHZhciBVUkwgPSBcIi9qcy9wbHVnaW5zL3VlZGl0b3IvXCI7XG4gICAgdmFyIGxhbmdQYXRoPVVSTCArXCJsYW5nL1wiICBcbiAgICB3aW5kb3cuVUVESVRPUl9IT01FX1VSTD1VUkw7XG4gICAgLyoqXG4gICAgICog6YWN572u6aG55Li75L2T44CC5rOo5oSP77yM5q2k5aSE5omA5pyJ5raJ5Y+K5Yiw6Lev5b6E55qE6YWN572u5Yir6YGX5ryPVVJM5Y+Y6YeP44CCXG4gICAgICovXG4gICAgd2luZG93LlVFRElUT1JfQ09ORklHID0ge1xuXG4gICAgICAgIC8v5Li657yW6L6R5Zmo5a6e5L6L5re75Yqg5LiA5Liq6Lev5b6E77yM6L+Z5Liq5LiN6IO96KKr5rOo6YeKXG4gICAgICAgIFVFRElUT1JfSE9NRV9VUkw6IFVSTFxuXG4gICAgICAgIC8vIOacjeWKoeWZqOe7n+S4gOivt+axguaOpeWPo+i3r+W+hFxuICAgICAgICAsIHNlcnZlclVybDogXCJcIlxuXG4gICAgICAgIC8v5bel5YW35qCP5LiK55qE5omA5pyJ55qE5Yqf6IO95oyJ6ZKu5ZKM5LiL5ouJ5qGG77yM5Y+v5Lul5ZyobmV357yW6L6R5Zmo55qE5a6e5L6L5pe26YCJ5oup6Ieq5bex6ZyA6KaB55qE6YeN5paw5a6a5LmJXG4gICAgICAgICwgdG9vbGJhcnM6IFtbXG4gICAgICAgICAgICAnZnVsbHNjcmVlbicsICdzb3VyY2UnLCAnfCcsICd1bmRvJywgJ3JlZG8nLCAnfCcsXG4gICAgICAgICAgICAnYm9sZCcsICdpdGFsaWMnLCAndW5kZXJsaW5lJywgJ2ZvbnRib3JkZXInLCAnc3RyaWtldGhyb3VnaCcsICdzdXBlcnNjcmlwdCcsICdzdWJzY3JpcHQnLCAncmVtb3ZlZm9ybWF0JywgJ2Zvcm1hdG1hdGNoJywgJ2F1dG90eXBlc2V0JywgJ2Jsb2NrcXVvdGUnLCAncGFzdGVwbGFpbicsICd8JywgJ2ZvcmVjb2xvcicsICdiYWNrY29sb3InLCAnaW5zZXJ0b3JkZXJlZGxpc3QnLCAnaW5zZXJ0dW5vcmRlcmVkbGlzdCcsICdzZWxlY3RhbGwnLCAnY2xlYXJkb2MnLCAnfCcsXG4gICAgICAgICAgICAncm93c3BhY2luZ3RvcCcsICdyb3dzcGFjaW5nYm90dG9tJywgJ2xpbmVoZWlnaHQnLCAnfCcsXG4gICAgICAgICAgICAnY3VzdG9tc3R5bGUnLCAncGFyYWdyYXBoJywgJ2ZvbnRmYW1pbHknLCAnZm9udHNpemUnLCAnfCcsXG4gICAgICAgICAgICAnZGlyZWN0aW9uYWxpdHlsdHInLCAnZGlyZWN0aW9uYWxpdHlydGwnLCAnaW5kZW50JywgJ3wnLFxuICAgICAgICAgICAgJ2p1c3RpZnlsZWZ0JywgJ2p1c3RpZnljZW50ZXInLCAnanVzdGlmeXJpZ2h0JywgJ2p1c3RpZnlqdXN0aWZ5JywgJ3wnLCAndG91cHBlcmNhc2UnLCAndG9sb3dlcmNhc2UnLCAnfCcsXG4gICAgICAgICAgICAnbGluaycsICd1bmxpbmsnLCAnYW5jaG9yJywgJ3wnLCAnaW1hZ2Vub25lJywgJ2ltYWdlbGVmdCcsICdpbWFnZXJpZ2h0JywgJ2ltYWdlY2VudGVyJywgJ3wnLFxuICAgICAgICAgICAgJ3NpbXBsZXVwbG9hZCcsICdpbnNlcnRpbWFnZScsICdlbW90aW9uJywgJ3NjcmF3bCcsICdpbnNlcnR2aWRlbycsICdtdXNpYycsICdhdHRhY2htZW50JywgJ21hcCcsICdnbWFwJywgJ2luc2VydGZyYW1lJywgJ2luc2VydGNvZGUnLCAnd2ViYXBwJywgJ3BhZ2VicmVhaycsICd0ZW1wbGF0ZScsICdiYWNrZ3JvdW5kJywgJ3wnLFxuICAgICAgICAgICAgJ2hvcml6b250YWwnLCAnZGF0ZScsICd0aW1lJywgJ3NwZWNoYXJzJywgJ3NuYXBzY3JlZW4nLCAnd29yZGltYWdlJywgJ3wnLFxuICAgICAgICAgICAgJ2luc2VydHRhYmxlJywgJ2RlbGV0ZXRhYmxlJywgJ2luc2VydHBhcmFncmFwaGJlZm9yZXRhYmxlJywgJ2luc2VydHJvdycsICdkZWxldGVyb3cnLCAnaW5zZXJ0Y29sJywgJ2RlbGV0ZWNvbCcsICdtZXJnZWNlbGxzJywgJ21lcmdlcmlnaHQnLCAnbWVyZ2Vkb3duJywgJ3NwbGl0dG9jZWxscycsICdzcGxpdHRvcm93cycsICdzcGxpdHRvY29scycsICdjaGFydHMnLCAnfCcsXG4gICAgICAgICAgICAncHJpbnQnLCAncHJldmlldycsICdzZWFyY2hyZXBsYWNlJywgJ2RyYWZ0cycsICdoZWxwJ1xuICAgICAgICBdXVxuICAgICAgICAvL+W9k+m8oOagh+aUvuWcqOW3peWFt+agj+S4iuaXtuaYvuekuueahHRvb2x0aXDmj5DnpLos55WZ56m65pSv5oyB6Ieq5Yqo5aSa6K+t6KiA6YWN572u77yM5ZCm5YiZ5Lul6YWN572u5YC85Li65YeGXG4gICAgICAgIC8vLGxhYmVsTWFwOntcbiAgICAgICAgLy8gICAgJ2FuY2hvcic6JycsICd1bmRvJzonJ1xuICAgICAgICAvL31cblxuICAgICAgICAvL+ivreiogOmFjee9rumhuSzpu5jorqTmmK96aC1jbuOAguaciemcgOimgeeahOivneS5n+WPr+S7peS9v+eUqOWmguS4i+i/meagt+eahOaWueW8j+adpeiHquWKqOWkmuivreiogOWIh+aNou+8jOW9k+eEtu+8jOWJjeaPkOadoeS7tuaYr2xhbmfmlofku7blpLnkuIvlrZjlnKjlr7nlupTnmoTor63oqIDmlofku7bvvJpcbiAgICAgICAgLy9sYW5n5YC85Lmf5Y+v5Lul6YCa6L+H6Ieq5Yqo6I635Y+WIChuYXZpZ2F0b3IubGFuZ3VhZ2V8fG5hdmlnYXRvci5icm93c2VyTGFuZ3VhZ2UgfHxuYXZpZ2F0b3IudXNlckxhbmd1YWdlKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgICxsYW5nOlwiemgtY25cIlxuICAgICAgICAsbGFuZ1BhdGg6VVJMICtcImxhbmcvXCJcblxuICAgICAgICAvL+S4u+mimOmFjee9rumhuSzpu5jorqTmmK9kZWZhdWx044CC5pyJ6ZyA6KaB55qE6K+d5Lmf5Y+v5Lul5L2/55So5aaC5LiL6L+Z5qC355qE5pa55byP5p2l6Ieq5Yqo5aSa5Li76aKY5YiH5o2i77yM5b2T54S277yM5YmN5o+Q5p2h5Lu25pivdGhlbWVz5paH5Lu25aS55LiL5a2Y5Zyo5a+55bqU55qE5Li76aKY5paH5Lu277yaXG4gICAgICAgIC8v546w5pyJ5aaC5LiL55qu6IKkOmRlZmF1bHRcbiAgICAgICAgLy8sdGhlbWU6J2RlZmF1bHQnXG4gICAgICAgIC8vLHRoZW1lUGF0aDpVUkwgK1widGhlbWVzL1wiXG5cbiAgICAgICAgLy8sekluZGV4IDogOTAwICAgICAvL+e8lui+keWZqOWxgue6p+eahOWfuuaVsCzpu5jorqTmmK85MDBcblxuICAgICAgICAvL+mSiOWvuWdldEFsbEh0bWzmlrnms5XvvIzkvJrlnKjlr7nlupTnmoRoZWFk5qCH562+5Lit5aKe5Yqg6K+l57yW56CB6K6+572u44CCXG4gICAgICAgIC8vLGNoYXJzZXQ6XCJ1dGYtOFwiXG5cbiAgICAgICAgLy/oi6Xlrp7kvovljJbnvJbovpHlmajnmoTpobXpnaLmiYvliqjkv67mlLnnmoRkb21haW7vvIzmraTlpITpnIDopoHorr7nva7kuLp0cnVlXG4gICAgICAgIC8vLGN1c3RvbURvbWFpbjpmYWxzZVxuXG4gICAgICAgIC8v5bi455So6YWN572u6aG555uuXG4gICAgICAgIC8vLGlzU2hvdyA6IHRydWUgICAgLy/pu5jorqTmmL7npLrnvJbovpHlmahcblxuICAgICAgICAvLyx0ZXh0YXJlYTonZWRpdG9yVmFsdWUnIC8vIOaPkOS6pOihqOWNleaXtu+8jOacjeWKoeWZqOiOt+WPlue8lui+keWZqOaPkOS6pOWGheWuueeahOaJgOeUqOeahOWPguaVsO+8jOWkmuWunuS+i+aXtuWPr+S7pee7meWuueWZqG5hbWXlsZ7mgKfvvIzkvJrlsIZuYW1l57uZ5a6a55qE5YC85pyA5Li65q+P5Liq5a6e5L6L55qE6ZSu5YC877yM5LiN55So5q+P5qyh5a6e5L6L5YyW55qE5pe25YCZ6YO96K6+572u6L+Z5Liq5YC8XG5cbiAgICAgICAgLy8saW5pdGlhbENvbnRlbnQ6J+asoui/juS9v+eUqHVlZGl0b3IhJyAgICAvL+WIneWni+WMlue8lui+keWZqOeahOWGheWuuSzkuZ/lj6/ku6XpgJrov4d0ZXh0YXJlYS9zY3JpcHTnu5nlgLzvvIznnIvlrpjnvZHkvovlrZBcblxuICAgICAgICAvLyxhdXRvQ2xlYXJpbml0aWFsQ29udGVudDp0cnVlIC8v5piv5ZCm6Ieq5Yqo5riF6Zmk57yW6L6R5Zmo5Yid5aeL5YaF5a6577yM5rOo5oSP77ya5aaC5p6cZm9jdXPlsZ7mgKforr7nva7kuLp0cnVlLOi/meS4quS5n+S4uuecn++8jOmCo+S5iOe8lui+keWZqOS4gOS4iuadpeWwseS8muinpuWPkeWvvOiHtOWIneWni+WMlueahOWGheWuueeci+S4jeWIsOS6hlxuXG4gICAgICAgIC8vLGZvY3VzOmZhbHNlIC8v5Yid5aeL5YyW5pe277yM5piv5ZCm6K6p57yW6L6R5Zmo6I635b6X54Sm54K5dHJ1ZeaIlmZhbHNlXG5cbiAgICAgICAgLy/lpoLmnpzoh6rlrprkuYnvvIzmnIDlpb3nu5lw5qCH562+5aaC5LiL55qE6KGM6auY77yM6KaB5LiN6L6T5YWl5Lit5paH5pe277yM5Lya5pyJ6Lez5Yqo5oSfXG4gICAgICAgIC8vLGluaXRpYWxTdHlsZToncHtsaW5lLWhlaWdodDoxZW19Jy8v57yW6L6R5Zmo5bGC57qn55qE5Z+65pWwLOWPr+S7peeUqOadpeaUueWPmOWtl+S9k+etiVxuXG4gICAgICAgIC8vLGlmcmFtZUNzc1VybDogVVJMICsgJy90aGVtZXMvaWZyYW1lLmNzcycgLy/nu5nnvJbovpHljLrln5/nmoRpZnJhbWXlvJXlhaXkuIDkuKpjc3Pmlofku7ZcblxuICAgICAgICAvL2luZGVudFZhbHVlXG4gICAgICAgIC8v6aaW6KGM57yp6L+b6Led56a7LOm7mOiupOaYrzJlbVxuICAgICAgICAvLyxpbmRlbnRWYWx1ZTonMmVtJ1xuXG4gICAgICAgIC8vLGluaXRpYWxGcmFtZVdpZHRoOjEwMDAgIC8v5Yid5aeL5YyW57yW6L6R5Zmo5a695bqmLOm7mOiupDEwMDBcbiAgICAgICAgLy8saW5pdGlhbEZyYW1lSGVpZ2h0OjMyMCAgLy/liJ3lp4vljJbnvJbovpHlmajpq5jluqYs6buY6K6kMzIwXG5cbiAgICAgICAgLy8scmVhZG9ubHkgOiBmYWxzZSAvL+e8lui+keWZqOWIneWni+WMlue7k+adn+WQjiznvJbovpHljLrln5/mmK/lkKbmmK/lj6ror7vnmoTvvIzpu5jorqTmmK9mYWxzZVxuXG4gICAgICAgIC8vLGF1dG9DbGVhckVtcHR5Tm9kZSA6IHRydWUgLy9nZXRDb250ZW505pe277yM5piv5ZCm5Yig6Zmk56m655qEaW5saW5lRWxlbWVudOiKgueCue+8iOWMheaLrOW1jOWll+eahOaDheWGte+8iVxuXG4gICAgICAgIC8v5ZCv55So6Ieq5Yqo5L+d5a2YXG4gICAgICAgIC8vLGVuYWJsZUF1dG9TYXZlOiB0cnVlXG4gICAgICAgIC8v6Ieq5Yqo5L+d5a2Y6Ze06ZqU5pe26Ze077yMIOWNleS9jW1zXG4gICAgICAgIC8vLHNhdmVJbnRlcnZhbDogNTAwXG5cbiAgICAgICAgLy8sZnVsbHNjcmVlbiA6IGZhbHNlIC8v5piv5ZCm5byA5ZCv5Yid5aeL5YyW5pe25Y2z5YWo5bGP77yM6buY6K6k5YWz6ZetXG5cbiAgICAgICAgLy8saW1hZ2VQb3B1cDp0cnVlICAgICAgLy/lm77niYfmk43kvZznmoTmta7lsYLlvIDlhbPvvIzpu5jorqTmiZPlvIBcblxuICAgICAgICAvLyxhdXRvU3luY0RhdGE6dHJ1ZSAvL+iHquWKqOWQjOatpee8lui+keWZqOimgeaPkOS6pOeahOaVsOaNrlxuICAgICAgICAvLyxlbW90aW9uTG9jYWxpemF0aW9uOmZhbHNlIC8v5piv5ZCm5byA5ZCv6KGo5oOF5pys5Zyw5YyW77yM6buY6K6k5YWz6Zet44CC6Iul6KaB5byA5ZCv6K+356Gu5L+dZW1vdGlvbuaWh+S7tuWkueS4i+WMheWQq+WumOe9keaPkOS+m+eahGltYWdlc+ihqOaDheaWh+S7tuWkuVxuXG4gICAgICAgIC8v57KY6LS05Y+q5L+d55WZ5qCH562+77yM5Y676Zmk5qCH562+5omA5pyJ5bGe5oCnXG4gICAgICAgIC8vLHJldGFpbk9ubHlMYWJlbFBhc3RlZDogZmFsc2VcblxuICAgICAgICAvLyxwYXN0ZXBsYWluOmZhbHNlICAvL+aYr+WQpum7mOiupOS4uue6r+aWh+acrOeymOi0tOOAgmZhbHNl5Li65LiN5L2/55So57qv5paH5pys57KY6LS077yMdHJ1ZeS4uuS9v+eUqOe6r+aWh+acrOeymOi0tFxuICAgICAgICAvL+e6r+aWh+acrOeymOi0tOaooeW8j+S4i+eahOi/h+a7pOinhOWImVxuICAgICAgICAvLydmaWx0ZXJUeHRSdWxlcycgOiBmdW5jdGlvbigpe1xuICAgICAgICAvLyAgICBmdW5jdGlvbiB0cmFuc1Aobm9kZSl7XG4gICAgICAgIC8vICAgICAgICBub2RlLnRhZ05hbWUgPSAncCc7XG4gICAgICAgIC8vICAgICAgICBub2RlLnNldFN0eWxlKCk7XG4gICAgICAgIC8vICAgIH1cbiAgICAgICAgLy8gICAgcmV0dXJuIHtcbiAgICAgICAgLy8gICAgICAgIC8v55u05o6l5Yig6Zmk5Y+K5YW25a2X6IqC54K55YaF5a65XG4gICAgICAgIC8vICAgICAgICAnLScgOiAnc2NyaXB0IHN0eWxlIG9iamVjdCBpZnJhbWUgZW1iZWQgaW5wdXQgc2VsZWN0JyxcbiAgICAgICAgLy8gICAgICAgICdwJzogeyQ6e319LFxuICAgICAgICAvLyAgICAgICAgJ2JyJzp7JDp7fX0sXG4gICAgICAgIC8vICAgICAgICAnZGl2Jzp7JyQnOnt9fSxcbiAgICAgICAgLy8gICAgICAgICdsaSc6eyckJzp7fX0sXG4gICAgICAgIC8vICAgICAgICAnY2FwdGlvbic6dHJhbnNQLFxuICAgICAgICAvLyAgICAgICAgJ3RoJzp0cmFuc1AsXG4gICAgICAgIC8vICAgICAgICAndHInOnRyYW5zUCxcbiAgICAgICAgLy8gICAgICAgICdoMSc6dHJhbnNQLCdoMic6dHJhbnNQLCdoMyc6dHJhbnNQLCdoNCc6dHJhbnNQLCdoNSc6dHJhbnNQLCdoNic6dHJhbnNQLFxuICAgICAgICAvLyAgICAgICAgJ3RkJzpmdW5jdGlvbihub2RlKXtcbiAgICAgICAgLy8gICAgICAgICAgICAvL+ayoeacieWGheWuueeahHRk55u05o6l5Yig5o6JXG4gICAgICAgIC8vICAgICAgICAgICAgdmFyIHR4dCA9ICEhbm9kZS5pbm5lclRleHQoKTtcbiAgICAgICAgLy8gICAgICAgICAgICBpZih0eHQpe1xuICAgICAgICAvLyAgICAgICAgICAgICAgICBub2RlLnBhcmVudE5vZGUuaW5zZXJ0QWZ0ZXIoVUUudU5vZGUuY3JlYXRlVGV4dCgnICZuYnNwOyAmbmJzcDsnKSxub2RlKTtcbiAgICAgICAgLy8gICAgICAgICAgICB9XG4gICAgICAgIC8vICAgICAgICAgICAgbm9kZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKG5vZGUsbm9kZS5pbm5lclRleHQoKSlcbiAgICAgICAgLy8gICAgICAgIH1cbiAgICAgICAgLy8gICAgfVxuICAgICAgICAvL30oKVxuXG4gICAgICAgIC8vLGFsbEh0bWxFbmFibGVkOmZhbHNlIC8v5o+Q5Lqk5Yiw5ZCO5Y+w55qE5pWw5o2u5piv5ZCm5YyF5ZCr5pW05LiqaHRtbOWtl+espuS4slxuXG4gICAgICAgIC8vaW5zZXJ0b3JkZXJlZGxpc3RcbiAgICAgICAgLy/mnInluo/liJfooajnmoTkuIvmi4nphY3nva4s5YC855WZ56m65pe25pSv5oyB5aSa6K+t6KiA6Ieq5Yqo6K+G5Yir77yM6Iul6YWN572u5YC877yM5YiZ5Lul5q2k5YC85Li65YeGXG4gICAgICAgIC8vLCdpbnNlcnRvcmRlcmVkbGlzdCc6e1xuICAgICAgICAvLyAgICAgIC8v6Ieq5a6a55qE5qC35byPXG4gICAgICAgIC8vICAgICAgICAnbnVtJzonMSwyLDMuLi4nLFxuICAgICAgICAvLyAgICAgICAgJ251bTEnOicxKSwyKSwzKS4uLicsXG4gICAgICAgIC8vICAgICAgICAnbnVtMic6JygxKSwoMiksKDMpLi4uJyxcbiAgICAgICAgLy8gICAgICAgICdjbic6J+S4gCzkuows5LiJLi4uLicsXG4gICAgICAgIC8vICAgICAgICAnY24xJzon5LiAKSzkuowpLOS4iSkuLi4uJyxcbiAgICAgICAgLy8gICAgICAgICdjbjInOico5LiAKSwo5LqMKSwo5LiJKS4uLi4nLFxuICAgICAgICAvLyAgICAgLy/ns7vnu5/oh6rluKZcbiAgICAgICAgLy8gICAgICdkZWNpbWFsJyA6ICcnICwgICAgICAgICAvLycxLDIsMy4uLidcbiAgICAgICAgLy8gICAgICdsb3dlci1hbHBoYScgOiAnJyAsICAgIC8vICdhLGIsYy4uLidcbiAgICAgICAgLy8gICAgICdsb3dlci1yb21hbicgOiAnJyAsICAgIC8vJ2ksaWksaWlpLi4uJ1xuICAgICAgICAvLyAgICAgJ3VwcGVyLWFscGhhJyA6ICcnICwgbGFuZyAgIC8vJ0EsQixDJ1xuICAgICAgICAvLyAgICAgJ3VwcGVyLXJvbWFuJyA6ICcnICAgICAgLy8nSSxJSSxJSUkuLi4nXG4gICAgICAgIC8vfVxuXG4gICAgICAgIC8vaW5zZXJ0dW5vcmRlcmVkbGlzdFxuICAgICAgICAvL+aXoOW6j+WIl+ihqOeahOS4i+aLiemFjee9ru+8jOWAvOeVmeepuuaXtuaUr+aMgeWkmuivreiogOiHquWKqOivhuWIq++8jOiLpemFjee9ruWAvO+8jOWImeS7peatpOWAvOS4uuWHhlxuICAgICAgICAvLyxpbnNlcnR1bm9yZGVyZWRsaXN0IDogeyAvL+iHquWumueahOagt+W8j1xuICAgICAgICAvLyAgICAnZGFzaCcgOifigJQg56C05oqY5Y+3JywgLy8t56C05oqY5Y+3XG4gICAgICAgIC8vICAgICdkb3QnOicg44CCIOWwj+WchuWciCcsIC8v57O757uf6Ieq5bimXG4gICAgICAgIC8vICAgICdjaXJjbGUnIDogJycsICAvLyAn4peLIOWwj+WchuWciCdcbiAgICAgICAgLy8gICAgJ2Rpc2MnIDogJycsICAgIC8vICfil48g5bCP5ZyG54K5J1xuICAgICAgICAvLyAgICAnc3F1YXJlJyA6ICcnICAgLy8n4pagIOWwj+aWueWdlydcbiAgICAgICAgLy99XG4gICAgICAgIC8vLGxpc3REZWZhdWx0UGFkZGluZ0xlZnQgOiAnMzAnLy/pu5jorqTnmoTlt6bovrnnvKnov5vnmoTln7rmlbDlgI1cbiAgICAgICAgLy8sbGlzdGljb25wYXRoIDogJ2h0dHA6Ly9icy5iYWlkdS5jb20vbGlzdGljb24vJy8v6Ieq5a6a5LmJ5qCH5Y+355qE6Lev5b6EXG4gICAgICAgIC8vLG1heExpc3RMZXZlbCA6IDMgLy/pmZDliLblj6/ku6V0YWLnmoTnuqfmlbAsIOiuvue9ri0x5Li65LiN6ZmQ5Yi2XG5cbiAgICAgICAgLy8sYXV0b1RyYW5zV29yZFRvTGlzdDpmYWxzZSAgLy/npoHmraJ3b3Jk5Lit57KY6LS06L+b5p2l55qE5YiX6KGo6Ieq5Yqo5Y+Y5oiQ5YiX6KGo5qCH562+XG5cbiAgICAgICAgLy9mb250ZmFtaWx5XG4gICAgICAgIC8v5a2X5L2T6K6+572uIGxhYmVs55WZ56m65pSv5oyB5aSa6K+t6KiA6Ieq5Yqo5YiH5o2i77yM6Iul6YWN572u77yM5YiZ5Lul6YWN572u5YC85Li65YeGXG4gICAgICAgIC8vLCdmb250ZmFtaWx5JzpbXG4gICAgICAgIC8vICAgIHsgbGFiZWw6JycsbmFtZTonc29uZ3RpJyx2YWw6J+Wui+S9kyxTaW1TdW4nfSxcbiAgICAgICAgLy8gICAgeyBsYWJlbDonJyxuYW1lOidrYWl0aScsdmFsOifmpbfkvZMs5qW35L2TX0dCMjMxMiwgU2ltS2FpJ30sXG4gICAgICAgIC8vICAgIHsgbGFiZWw6JycsbmFtZToneWFoZWknLHZhbDon5b6u6L2v6ZuF6buRLE1pY3Jvc29mdCBZYUhlaSd9LFxuICAgICAgICAvLyAgICB7IGxhYmVsOicnLG5hbWU6J2hlaXRpJyx2YWw6J+m7keS9kywgU2ltSGVpJ30sXG4gICAgICAgIC8vICAgIHsgbGFiZWw6JycsbmFtZTonbGlzaHUnLHZhbDon6Zq25LmmLCBTaW1MaSd9LFxuICAgICAgICAvLyAgICB7IGxhYmVsOicnLG5hbWU6J2FuZGFsZU1vbm8nLHZhbDonYW5kYWxlIG1vbm8nfSxcbiAgICAgICAgLy8gICAgeyBsYWJlbDonJyxuYW1lOidhcmlhbCcsdmFsOidhcmlhbCwgaGVsdmV0aWNhLHNhbnMtc2VyaWYnfSxcbiAgICAgICAgLy8gICAgeyBsYWJlbDonJyxuYW1lOidhcmlhbEJsYWNrJyx2YWw6J2FyaWFsIGJsYWNrLGF2YW50IGdhcmRlJ30sXG4gICAgICAgIC8vICAgIHsgbGFiZWw6JycsbmFtZTonY29taWNTYW5zTXMnLHZhbDonY29taWMgc2FucyBtcyd9LFxuICAgICAgICAvLyAgICB7IGxhYmVsOicnLG5hbWU6J2ltcGFjdCcsdmFsOidpbXBhY3QsY2hpY2Fnbyd9LFxuICAgICAgICAvLyAgICB7IGxhYmVsOicnLG5hbWU6J3RpbWVzTmV3Um9tYW4nLHZhbDondGltZXMgbmV3IHJvbWFuJ31cbiAgICAgICAgLy9dXG5cbiAgICAgICAgLy9mb250c2l6ZVxuICAgICAgICAvL+Wtl+WPt1xuICAgICAgICAvLywnZm9udHNpemUnOlsxMCwgMTEsIDEyLCAxNCwgMTYsIDE4LCAyMCwgMjQsIDM2XVxuXG4gICAgICAgIC8vcGFyYWdyYXBoXG4gICAgICAgIC8v5q616JC95qC85byPIOWAvOeVmeepuuaXtuaUr+aMgeWkmuivreiogOiHquWKqOivhuWIq++8jOiLpemFjee9ru+8jOWImeS7pemFjee9ruWAvOS4uuWHhlxuICAgICAgICAvLywncGFyYWdyYXBoJzp7J3AnOicnLCAnaDEnOicnLCAnaDInOicnLCAnaDMnOicnLCAnaDQnOicnLCAnaDUnOicnLCAnaDYnOicnfVxuXG4gICAgICAgIC8vcm93c3BhY2luZ3RvcFxuICAgICAgICAvL+autemXtOi3nSDlgLzlkozmmL7npLrnmoTlkI3lrZfnm7jlkIxcbiAgICAgICAgLy8sJ3Jvd3NwYWNpbmd0b3AnOlsnNScsICcxMCcsICcxNScsICcyMCcsICcyNSddXG5cbiAgICAgICAgLy9yb3dzcGFjaW5nQm90dG9tXG4gICAgICAgIC8v5q616Ze06LedIOWAvOWSjOaYvuekuueahOWQjeWtl+ebuOWQjFxuICAgICAgICAvLywncm93c3BhY2luZ2JvdHRvbSc6Wyc1JywgJzEwJywgJzE1JywgJzIwJywgJzI1J11cblxuICAgICAgICAvL2xpbmVoZWlnaHRcbiAgICAgICAgLy/ooYzlhoXpl7Tot50g5YC85ZKM5pi+56S655qE5ZCN5a2X55u45ZCMXG4gICAgICAgIC8vLCdsaW5laGVpZ2h0JzpbJzEnLCAnMS41JywnMS43NScsJzInLCAnMycsICc0JywgJzUnXVxuXG4gICAgICAgIC8vY3VzdG9tc3R5bGVcbiAgICAgICAgLy/oh6rlrprkuYnmoLflvI/vvIzkuI3mlK/mjIHlm73pmYXljJbvvIzmraTlpITphY3nva7lgLzljbPlj6/mnIDlkI7mmL7npLrlgLxcbiAgICAgICAgLy9ibG9ja+eahOWFg+e0oOaYr+S+neaNruiuvue9ruauteiQveeahOmAu+i+keiuvue9rueahO+8jGlubGluZeeahOWFg+e0oOS+neaNrkJJVeeahOmAu+i+keiuvue9rlxuICAgICAgICAvL+WwvemHj+S9v+eUqOS4gOS6m+W4uOeUqOeahOagh+etvlxuICAgICAgICAvL+WPguaVsOivtOaYjlxuICAgICAgICAvL3RhZyDkvb/nlKjnmoTmoIfnrb7lkI3lrZdcbiAgICAgICAgLy9sYWJlbCDmmL7npLrnmoTlkI3lrZfkuZ/mmK/nlKjmnaXmoIfor4bkuI3lkIznsbvlnovnmoTmoIfor4bnrKbvvIzms6jmhI/ov5nkuKrlgLzmr4/kuKropoHkuI3lkIzvvIxcbiAgICAgICAgLy9zdHlsZSDmt7vliqDnmoTmoLflvI9cbiAgICAgICAgLy/mr4/kuIDkuKrlr7nosaHlsLHmmK/kuIDkuKroh6rlrprkuYnnmoTmoLflvI9cbiAgICAgICAgLy8sJ2N1c3RvbXN0eWxlJzpbXG4gICAgICAgIC8vICAgIHt0YWc6J2gxJywgbmFtZTondGMnLCBsYWJlbDonJywgc3R5bGU6J2JvcmRlci1ib3R0b206I2NjYyAycHggc29saWQ7cGFkZGluZzowIDRweCAwIDA7dGV4dC1hbGlnbjpjZW50ZXI7bWFyZ2luOjAgMCAyMHB4IDA7J30sXG4gICAgICAgIC8vICAgIHt0YWc6J2gxJywgbmFtZTondGwnLGxhYmVsOicnLCBzdHlsZTonYm9yZGVyLWJvdHRvbTojY2NjIDJweCBzb2xpZDtwYWRkaW5nOjAgNHB4IDAgMDttYXJnaW46MCAwIDEwcHggMDsnfSxcbiAgICAgICAgLy8gICAge3RhZzonc3BhbicsbmFtZTonaW0nLCBsYWJlbDonJywgc3R5bGU6J2ZvbnQtc3R5bGU6aXRhbGljO2ZvbnQtd2VpZ2h0OmJvbGQnfSxcbiAgICAgICAgLy8gICAge3RhZzonc3BhbicsbmFtZTonaGknLCBsYWJlbDonJywgc3R5bGU6J2ZvbnQtc3R5bGU6aXRhbGljO2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6cmdiKDUxLCAxNTMsIDIwNCknfVxuICAgICAgICAvL11cblxuICAgICAgICAvL+aJk+W8gOWPs+mUruiPnOWNleWKn+iDvVxuICAgICAgICAvLyxlbmFibGVDb250ZXh0TWVudTogdHJ1ZVxuICAgICAgICAvL+WPs+mUruiPnOWNleeahOWGheWuue+8jOWPr+S7peWPguiAg3BsdWdpbnMvY29udGV4dG1lbnUuanPph4zovrnnmoTpu5jorqToj5zljZXnmoTkvovlrZDvvIxsYWJlbOeVmeepuuaUr+aMgeWbvemZheWMlu+8jOWQpuWImeS7peatpOmFjee9ruS4uuWHhlxuICAgICAgICAvLyxjb250ZXh0TWVudTpbXG4gICAgICAgIC8vICAgIHtcbiAgICAgICAgLy8gICAgICAgIGxhYmVsOicnLCAgICAgICAvL+aYvuekuueahOWQjeensFxuICAgICAgICAvLyAgICAgICAgY21kTmFtZTonc2VsZWN0YWxsJywvL+aJp+ihjOeahGNvbW1hbmTlkb3ku6TvvIzlvZPngrnlh7vov5nkuKrlj7PplK7oj5zljZXml7ZcbiAgICAgICAgLy8gICAgICAgIC8vZXhlY+WPr+mAie+8jOacieS6hmV4ZWPlsLHkvJrlnKjngrnlh7vml7bmiafooYzov5nkuKpmdW5jdGlvbu+8jOS8mOWFiOe6p+mrmOS6jmNtZE5hbWVcbiAgICAgICAgLy8gICAgICAgIGV4ZWM6ZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyAgICAgICAgICAgIC8vdGhpc+aYr+W9k+WJjee8lui+keWZqOeahOWunuS+i1xuICAgICAgICAvLyAgICAgICAgICAgIC8vdGhpcy51aS5fZGlhbG9nc1snaW5zZXJ0dGFibGVEaWFsb2cnXS5vcGVuKCk7XG4gICAgICAgIC8vICAgICAgICB9XG4gICAgICAgIC8vICAgIH1cbiAgICAgICAgLy9dXG5cbiAgICAgICAgLy/lv6vmjbfoj5zljZVcbiAgICAgICAgLy8sc2hvcnRjdXRNZW51OltcImZvbnRmYW1pbHlcIiwgXCJmb250c2l6ZVwiLCBcImJvbGRcIiwgXCJpdGFsaWNcIiwgXCJ1bmRlcmxpbmVcIiwgXCJmb3JlY29sb3JcIiwgXCJiYWNrY29sb3JcIiwgXCJpbnNlcnRvcmRlcmVkbGlzdFwiLCBcImluc2VydHVub3JkZXJlZGxpc3RcIl1cblxuICAgICAgICAvL2VsZW1lbnRQYXRoRW5hYmxlZFxuICAgICAgICAvL+aYr+WQpuWQr+eUqOWFg+e0oOi3r+W+hO+8jOm7mOiupOaYr+aYvuekulxuICAgICAgICAvLyxlbGVtZW50UGF0aEVuYWJsZWQgOiB0cnVlXG5cbiAgICAgICAgLy93b3JkQ291bnRcbiAgICAgICAgLy8sd29yZENvdW50OnRydWUgICAgICAgICAgLy/mmK/lkKblvIDlkK/lrZfmlbDnu5/orqFcbiAgICAgICAgLy8sbWF4aW11bVdvcmRzOjEwMDAwICAgICAgIC8v5YWB6K6455qE5pyA5aSn5a2X56ym5pWwXG4gICAgICAgIC8v5a2X5pWw57uf6K6h5o+Q56S677yMeyNjb3VudH3ku6PooajlvZPliY3lrZfmlbDvvIx7I2xlYXZlfeS7o+ihqOi/mOWPr+S7pei+k+WFpeWkmuWwkeWtl+espuaVsCznlZnnqbrmlK/mjIHlpJror63oqIDoh6rliqjliIfmjaLvvIzlkKbliJnmjInmraTphY3nva7mmL7npLpcbiAgICAgICAgLy8sd29yZENvdW50TXNnOicnICAgLy/lvZPliY3lt7LovpPlhaUgeyNjb3VudH0g5Liq5a2X56ym77yM5oKo6L+Y5Y+v5Lul6L6T5YWleyNsZWF2ZX0g5Liq5a2X56ymXG4gICAgICAgIC8v6LaF5Ye65a2X5pWw6ZmQ5Yi25o+Q56S6ICDnlZnnqbrmlK/mjIHlpJror63oqIDoh6rliqjliIfmjaLvvIzlkKbliJnmjInmraTphY3nva7mmL7npLpcbiAgICAgICAgLy8sd29yZE92ZXJGbG93TXNnOicnICAgIC8vPHNwYW4gc3R5bGU9XCJjb2xvcjpyZWQ7XCI+5L2g6L6T5YWl55qE5a2X56ym5Liq5pWw5bey57uP6LaF5Ye65pyA5aSn5YWB6K645YC877yM5pyN5Yqh5Zmo5Y+v6IO95Lya5ouS57ud5L+d5a2Y77yBPC9zcGFuPlxuXG4gICAgICAgIC8vdGFiXG4gICAgICAgIC8v54K55Ye7dGFi6ZSu5pe256e75Yqo55qE6Led56a7LHRhYlNpemXlgI3mlbDvvIx0YWJOb2Rl5LuA5LmI5a2X56ym5YGa5Li65Y2V5L2NXG4gICAgICAgIC8vLHRhYlNpemU6NFxuICAgICAgICAvLyx0YWJOb2RlOicmbmJzcDsnXG5cbiAgICAgICAgLy9yZW1vdmVGb3JtYXRcbiAgICAgICAgLy/muIXpmaTmoLzlvI/ml7blj6/ku6XliKDpmaTnmoTmoIfnrb7lkozlsZ7mgKdcbiAgICAgICAgLy9yZW1vdmVGb3JhbXRUYWdz5qCH562+XG4gICAgICAgIC8vLHJlbW92ZUZvcm1hdFRhZ3M6J2IsYmlnLGNvZGUsZGVsLGRmbixlbSxmb250LGksaW5zLGtiZCxxLHNhbXAsc21hbGwsc3BhbixzdHJpa2Usc3Ryb25nLHN1YixzdXAsdHQsdSx2YXInXG4gICAgICAgIC8vcmVtb3ZlRm9ybWF0QXR0cmlidXRlc+WxnuaAp1xuICAgICAgICAvLyxyZW1vdmVGb3JtYXRBdHRyaWJ1dGVzOidjbGFzcyxzdHlsZSxsYW5nLHdpZHRoLGhlaWdodCxhbGlnbixoc3BhY2UsdmFsaWduJ1xuXG4gICAgICAgIC8vdW5kb1xuICAgICAgICAvL+WPr+S7peacgOWkmuWbnumAgOeahOasoeaVsCzpu5jorqQyMFxuICAgICAgICAvLyxtYXhVbmRvQ291bnQ6MjBcbiAgICAgICAgLy/lvZPovpPlhaXnmoTlrZfnrKbmlbDotoXov4for6XlgLzml7bvvIzkv53lrZjkuIDmrKHnjrDlnLpcbiAgICAgICAgLy8sbWF4SW5wdXRDb3VudDoxXG5cbiAgICAgICAgLy9hdXRvSGVpZ2h0RW5hYmxlZFxuICAgICAgICAvLyDmmK/lkKboh6rliqjplb/pq5gs6buY6K6kdHJ1ZVxuICAgICAgICAvLyxhdXRvSGVpZ2h0RW5hYmxlZDp0cnVlXG5cbiAgICAgICAgLy9zY2FsZUVuYWJsZWRcbiAgICAgICAgLy/mmK/lkKblj6/ku6Xmi4nkvLjplb/pq5gs6buY6K6kdHJ1ZSjlvZPlvIDlkK/ml7bvvIzoh6rliqjplb/pq5jlpLHmlYgpXG4gICAgICAgIC8vLHNjYWxlRW5hYmxlZDpmYWxzZVxuICAgICAgICAvLyxtaW5GcmFtZVdpZHRoOjgwMCAgICAvL+e8lui+keWZqOaLluWKqOaXtuacgOWwj+WuveW6pizpu5jorqQ4MDBcbiAgICAgICAgLy8sbWluRnJhbWVIZWlnaHQ6MjIwICAvL+e8lui+keWZqOaLluWKqOaXtuacgOWwj+mrmOW6pizpu5jorqQyMjBcblxuICAgICAgICAvL2F1dG9GbG9hdEVuYWJsZWRcbiAgICAgICAgLy/mmK/lkKbkv53mjIF0b29sYmFy55qE5L2N572u5LiN5YqoLOm7mOiupHRydWVcbiAgICAgICAgLy8sYXV0b0Zsb2F0RW5hYmxlZDp0cnVlXG4gICAgICAgIC8v5rWu5Yqo5pe25bel5YW35qCP6Led56a75rWP6KeI5Zmo6aG26YOo55qE6auY5bqm77yM55So5LqO5p+Q5Lqb5YW35pyJ5Zu65a6a5aS06YOo55qE6aG16Z2iXG4gICAgICAgIC8vLHRvcE9mZnNldDozMFxuICAgICAgICAvL+e8lui+keWZqOW6lemDqOi3neemu+W3peWFt+agj+mrmOW6pijlpoLmnpzlj4LmlbDlpKfkuo7nrYnkuo7nvJbovpHlmajpq5jluqbvvIzliJnorr7nva7ml6DmlYgpXG4gICAgICAgIC8vLHRvb2xiYXJUb3BPZmZzZXQ6NDAwXG5cbiAgICAgICAgLy/orr7nva7ov5znqIvlm77niYfmmK/lkKbmipPlj5bliLDmnKzlnLDkv53lrZhcbiAgICAgICAgLy8sY2F0Y2hSZW1vdGVJbWFnZUVuYWJsZTogdHJ1ZSAvL+iuvue9ruaYr+WQpuaKk+WPlui/nOeoi+WbvueJh1xuXG4gICAgICAgIC8vcGFnZUJyZWFrVGFnXG4gICAgICAgIC8v5YiG6aG15qCH6K+G56ymLOm7mOiupOaYr191ZWRpdG9yX3BhZ2VfYnJlYWtfdGFnX1xuICAgICAgICAvLyxwYWdlQnJlYWtUYWc6J191ZWRpdG9yX3BhZ2VfYnJlYWtfdGFnXydcblxuICAgICAgICAvL2F1dG90eXBlc2V0XG4gICAgICAgIC8v6Ieq5Yqo5o6S54mI5Y+C5pWwXG4gICAgICAgIC8vLGF1dG90eXBlc2V0OiB7XG4gICAgICAgIC8vICAgIG1lcmdlRW1wdHlsaW5lOiB0cnVlLCAgICAgICAgICAgLy/lkIjlubbnqbrooYxcbiAgICAgICAgLy8gICAgcmVtb3ZlQ2xhc3M6IHRydWUsICAgICAgICAgICAgICAvL+WOu+aOieWGl+S9meeahGNsYXNzXG4gICAgICAgIC8vICAgIHJlbW92ZUVtcHR5bGluZTogZmFsc2UsICAgICAgICAgLy/ljrvmjonnqbrooYxcbiAgICAgICAgLy8gICAgdGV4dEFsaWduOlwibGVmdFwiLCAgICAgICAgICAgICAgIC8v5q616JC955qE5o6S54mI5pa55byP77yM5Y+v5Lul5pivIGxlZnQscmlnaHQsY2VudGVyLGp1c3RpZnkg5Y675o6J6L+Z5Liq5bGe5oCn6KGo56S65LiN5omn6KGM5o6S54mIXG4gICAgICAgIC8vICAgIGltYWdlQmxvY2tMaW5lOiAnY2VudGVyJywgICAgICAgLy/lm77niYfnmoTmta7liqjmlrnlvI/vvIzni6zljaDkuIDooYzliafkuK0s5bem5Y+z5rWu5Yqo77yM6buY6K6kOiBjZW50ZXIsbGVmdCxyaWdodCxub25lIOWOu+aOiei/meS4quWxnuaAp+ihqOekuuS4jeaJp+ihjOaOkueJiFxuICAgICAgICAvLyAgICBwYXN0ZUZpbHRlcjogZmFsc2UsICAgICAgICAgICAgIC8v5qC55o2u6KeE5YiZ6L+H5ruk5rKh5LqL57KY6LS06L+b5p2l55qE5YaF5a65XG4gICAgICAgIC8vICAgIGNsZWFyRm9udFNpemU6IGZhbHNlLCAgICAgICAgICAgLy/ljrvmjonmiYDmnInnmoTlhoXltYzlrZflj7fvvIzkvb/nlKjnvJbovpHlmajpu5jorqTnmoTlrZflj7dcbiAgICAgICAgLy8gICAgY2xlYXJGb250RmFtaWx5OiBmYWxzZSwgICAgICAgICAvL+WOu+aOieaJgOacieeahOWGheW1jOWtl+S9k++8jOS9v+eUqOe8lui+keWZqOm7mOiupOeahOWtl+S9k1xuICAgICAgICAvLyAgICByZW1vdmVFbXB0eU5vZGU6IGZhbHNlLCAgICAgICAgIC8vIOWOu+aOieepuuiKgueCuVxuICAgICAgICAvLyAgICAvL+WPr+S7peWOu+aOieeahOagh+etvlxuICAgICAgICAvLyAgICByZW1vdmVUYWdOYW1lczoge+agh+etvuWQjeWtlzoxfSxcbiAgICAgICAgLy8gICAgaW5kZW50OiBmYWxzZSwgICAgICAgICAgICAgICAgICAvLyDooYzpppbnvKnov5tcbiAgICAgICAgLy8gICAgaW5kZW50VmFsdWUgOiAnMmVtJywgICAgICAgICAgICAvL+ihjOmmlue8qei/m+eahOWkp+Wwj1xuICAgICAgICAvLyAgICBiZGMyc2I6IGZhbHNlLFxuICAgICAgICAvLyAgICB0b2JkYzogZmFsc2VcbiAgICAgICAgLy99XG5cbiAgICAgICAgLy90YWJsZURyYWdhYmxlXG4gICAgICAgIC8v6KGo5qC85piv5ZCm5Y+v5Lul5ouW5ou9XG4gICAgICAgIC8vLHRhYmxlRHJhZ2FibGU6IHRydWVcblxuXG5cbiAgICAgICAgLy9zb3VyY2VFZGl0b3JcbiAgICAgICAgLy/mupDnoIHnmoTmn6XnnIvmlrnlvI8sY29kZW1pcnJvciDmmK/ku6PnoIHpq5jkuq7vvIx0ZXh0YXJlYeaYr+aWh+acrOahhizpu5jorqTmmK9jb2RlbWlycm9yXG4gICAgICAgIC8v5rOo5oSP6buY6K6kY29kZW1pcnJvcuWPquiDveWcqGllOCvlkozpnZ5pZeS4reS9v+eUqFxuICAgICAgICAvLyxzb3VyY2VFZGl0b3I6XCJjb2RlbWlycm9yXCJcbiAgICAgICAgLy/lpoLmnpxzb3VyY2VFZGl0b3LmmK9jb2RlbWlycm9y77yM6L+Y55So6YWN572u5LiA5LiL5Lik5Liq5Y+C5pWwXG4gICAgICAgIC8vY29kZU1pcnJvckpzVXJsIGpz5Yqg6L2955qE6Lev5b6E77yM6buY6K6k5pivIFVSTCArIFwidGhpcmQtcGFydHkvY29kZW1pcnJvci9jb2RlbWlycm9yLmpzXCJcbiAgICAgICAgLy8sY29kZU1pcnJvckpzVXJsOlVSTCArIFwidGhpcmQtcGFydHkvY29kZW1pcnJvci9jb2RlbWlycm9yLmpzXCJcbiAgICAgICAgLy9jb2RlTWlycm9yQ3NzVXJsIGNzc+WKoOi9veeahOi3r+W+hO+8jOm7mOiupOaYryBVUkwgKyBcInRoaXJkLXBhcnR5L2NvZGVtaXJyb3IvY29kZW1pcnJvci5jc3NcIlxuICAgICAgICAvLyxjb2RlTWlycm9yQ3NzVXJsOlVSTCArIFwidGhpcmQtcGFydHkvY29kZW1pcnJvci9jb2RlbWlycm9yLmNzc1wiXG4gICAgICAgIC8v57yW6L6R5Zmo5Yid5aeL5YyW5a6M5oiQ5ZCO5piv5ZCm6L+b5YWl5rqQ56CB5qih5byP77yM6buY6K6k5Li65ZCm44CCXG4gICAgICAgIC8vLHNvdXJjZUVkaXRvckZpcnN0OmZhbHNlXG5cbiAgICAgICAgLy9pZnJhbWVVcmxNYXBcbiAgICAgICAgLy9kaWFsb2flhoXlrrnnmoTot6/lvoQg772e5Lya6KKr5pu/5o2i5oiQVVJMLOWek+WxnuaAp+S4gOaXpuaJk+W8gO+8jOWwhuimhuebluaJgOacieeahGRpYWxvZ+eahOm7mOiupOi3r+W+hFxuICAgICAgICAvLyxpZnJhbWVVcmxNYXA6e1xuICAgICAgICAvLyAgICAnYW5jaG9yJzonfi9kaWFsb2dzL2FuY2hvci9hbmNob3IuaHRtbCcsXG4gICAgICAgIC8vfVxuXG4gICAgICAgIC8vYWxsb3dMaW5rUHJvdG9jb2wg5YWB6K6455qE6ZO+5o6l5Zyw5Z2A77yM5pyJ6L+Z5Lqb5YmN57yA55qE6ZO+5o6l5Zyw5Z2A5LiN5Lya6Ieq5Yqo5re75YqgaHR0cFxuICAgICAgICAvLywgYWxsb3dMaW5rUHJvdG9jb2xzOiBbJ2h0dHA6JywgJ2h0dHBzOicsICcjJywgJy8nLCAnZnRwOicsICdtYWlsdG86JywgJ3RlbDonLCAnZ2l0OicsICdzdm46J11cblxuICAgICAgICAvL3dlYkFwcEtleSDnmb7luqblupTnlKjnmoRBUElrZXnvvIzmr4/kuKrnq5nplb/lv4XpobvpppblhYjljrvnmb7luqblrpjnvZHms6jlhozkuIDkuKprZXnlkI7mlrnog73mraPluLjkvb/nlKhhcHDlip/og73vvIzms6jlhozku4vnu43vvIxodHRwOi8vYXBwLmJhaWR1LmNvbS9zdGF0aWMvY21zL2dldGFwaWtleS5odG1sXG4gICAgICAgIC8vLCB3ZWJBcHBLZXk6IFwiXCJcblxuICAgICAgICAvL+m7mOiupOi/h+a7pOinhOWImeebuOWFs+mFjee9rumhueebrlxuICAgICAgICAvLyxkaXNhYmxlZFRhYmxlSW5UYWJsZTp0cnVlICAvL+emgeatouihqOagvOW1jOWll1xuICAgICAgICAvLyxhbGxvd0RpdlRyYW5zVG9QOnRydWUgICAgICAvL+WFgeiuuOi/m+WFpee8lui+keWZqOeahGRpduagh+etvuiHquWKqOWPmOaIkHDmoIfnrb5cbiAgICAgICAgLy8scmdiMkhleDp0cnVlICAgICAgICAgICAgICAgLy/pu5jorqTkuqflh7rnmoTmlbDmja7kuK3nmoRjb2xvcuiHquWKqOS7jnJnYuagvOW8j+WPmOaIkDE26L+b5Yi25qC85byPXG5cblx0XHQvLyB4c3Mg6L+H5ruk5piv5ZCm5byA5ZCvLGluc2VydGh0bWznrYnmk43kvZxcblx0XHQseHNzRmlsdGVyUnVsZXM6IHRydWVcblx0XHQvL2lucHV0IHhzc+i/h+a7pFxuXHRcdCxpbnB1dFhzc0ZpbHRlcjogdHJ1ZVxuXHRcdC8vb3V0cHV0IHhzc+i/h+a7pFxuXHRcdCxvdXRwdXRYc3NGaWx0ZXI6IHRydWVcblx0XHQvLyB4c3Pov4fmu6Tnmb3lkI3ljZUg5ZCN5Y2V5p2l5rqQOiBodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vbGVpem9uZ21pbi9qcy14c3MvbWFzdGVyL2xpYi9kZWZhdWx0LmpzXG5cdFx0LHdoaXRMaXN0OiB7XG5cdFx0XHRhOiAgICAgIFsndGFyZ2V0JywgJ2hyZWYnLCAndGl0bGUnLCAnY2xhc3MnLCAnc3R5bGUnXSxcblx0XHRcdGFiYnI6ICAgWyd0aXRsZScsICdjbGFzcycsICdzdHlsZSddLFxuXHRcdFx0YWRkcmVzczogWydjbGFzcycsICdzdHlsZSddLFxuXHRcdFx0YXJlYTogICBbJ3NoYXBlJywgJ2Nvb3JkcycsICdocmVmJywgJ2FsdCddLFxuXHRcdFx0YXJ0aWNsZTogW10sXG5cdFx0XHRhc2lkZTogIFtdLFxuXHRcdFx0YXVkaW86ICBbJ2F1dG9wbGF5JywgJ2NvbnRyb2xzJywgJ2xvb3AnLCAncHJlbG9hZCcsICdzcmMnLCAnY2xhc3MnLCAnc3R5bGUnXSxcblx0XHRcdGI6ICAgICAgWydjbGFzcycsICdzdHlsZSddLFxuXHRcdFx0YmRpOiAgICBbJ2RpciddLFxuXHRcdFx0YmRvOiAgICBbJ2RpciddLFxuXHRcdFx0YmlnOiAgICBbXSxcblx0XHRcdGJsb2NrcXVvdGU6IFsnY2l0ZScsICdjbGFzcycsICdzdHlsZSddLFxuXHRcdFx0YnI6ICAgICBbXSxcblx0XHRcdGNhcHRpb246IFsnY2xhc3MnLCAnc3R5bGUnXSxcblx0XHRcdGNlbnRlcjogW10sXG5cdFx0XHRjaXRlOiAgIFtdLFxuXHRcdFx0Y29kZTogICBbJ2NsYXNzJywgJ3N0eWxlJ10sXG5cdFx0XHRjb2w6ICAgIFsnYWxpZ24nLCAndmFsaWduJywgJ3NwYW4nLCAnd2lkdGgnLCAnY2xhc3MnLCAnc3R5bGUnXSxcblx0XHRcdGNvbGdyb3VwOiBbJ2FsaWduJywgJ3ZhbGlnbicsICdzcGFuJywgJ3dpZHRoJywgJ2NsYXNzJywgJ3N0eWxlJ10sXG5cdFx0XHRkZDogICAgIFsnY2xhc3MnLCAnc3R5bGUnXSxcblx0XHRcdGRlbDogICAgWydkYXRldGltZSddLFxuXHRcdFx0ZGV0YWlsczogWydvcGVuJ10sXG5cdFx0XHRkaXY6ICAgIFsnY2xhc3MnLCAnc3R5bGUnXSxcblx0XHRcdGRsOiAgICAgWydjbGFzcycsICdzdHlsZSddLFxuXHRcdFx0ZHQ6ICAgICBbJ2NsYXNzJywgJ3N0eWxlJ10sXG5cdFx0XHRlbTogICAgIFsnY2xhc3MnLCAnc3R5bGUnXSxcblx0XHRcdGZvbnQ6ICAgWydjb2xvcicsICdzaXplJywgJ2ZhY2UnXSxcblx0XHRcdGZvb3RlcjogW10sXG5cdFx0XHRoMTogICAgIFsnY2xhc3MnLCAnc3R5bGUnXSxcblx0XHRcdGgyOiAgICAgWydjbGFzcycsICdzdHlsZSddLFxuXHRcdFx0aDM6ICAgICBbJ2NsYXNzJywgJ3N0eWxlJ10sXG5cdFx0XHRoNDogICAgIFsnY2xhc3MnLCAnc3R5bGUnXSxcblx0XHRcdGg1OiAgICAgWydjbGFzcycsICdzdHlsZSddLFxuXHRcdFx0aDY6ICAgICBbJ2NsYXNzJywgJ3N0eWxlJ10sXG5cdFx0XHRoZWFkZXI6IFtdLFxuXHRcdFx0aHI6ICAgICBbXSxcblx0XHRcdGk6ICAgICAgWydjbGFzcycsICdzdHlsZSddLFxuXHRcdFx0aW1nOiAgICBbJ3NyYycsICdhbHQnLCAndGl0bGUnLCAnd2lkdGgnLCAnaGVpZ2h0JywgJ2lkJywgJ19zcmMnLCAnbG9hZGluZ2NsYXNzJywgJ2NsYXNzJywgJ2RhdGEtbGF0ZXgnXSxcblx0XHRcdGluczogICAgWydkYXRldGltZSddLFxuXHRcdFx0bGk6ICAgICBbJ2NsYXNzJywgJ3N0eWxlJ10sXG5cdFx0XHRtYXJrOiAgIFtdLFxuXHRcdFx0bmF2OiAgICBbXSxcblx0XHRcdG9sOiAgICAgWydjbGFzcycsICdzdHlsZSddLFxuXHRcdFx0cDogICAgICBbJ2NsYXNzJywgJ3N0eWxlJ10sXG5cdFx0XHRwcmU6ICAgIFsnY2xhc3MnLCAnc3R5bGUnXSxcblx0XHRcdHM6ICAgICAgW10sXG5cdFx0XHRzZWN0aW9uOltdLFxuXHRcdFx0c21hbGw6ICBbXSxcblx0XHRcdHNwYW46ICAgWydjbGFzcycsICdzdHlsZSddLFxuXHRcdFx0c3ViOiAgICBbJ2NsYXNzJywgJ3N0eWxlJ10sXG5cdFx0XHRzdXA6ICAgIFsnY2xhc3MnLCAnc3R5bGUnXSxcblx0XHRcdHN0cm9uZzogWydjbGFzcycsICdzdHlsZSddLFxuXHRcdFx0dGFibGU6ICBbJ3dpZHRoJywgJ2JvcmRlcicsICdhbGlnbicsICd2YWxpZ24nLCAnY2xhc3MnLCAnc3R5bGUnXSxcblx0XHRcdHRib2R5OiAgWydhbGlnbicsICd2YWxpZ24nLCAnY2xhc3MnLCAnc3R5bGUnXSxcblx0XHRcdHRkOiAgICAgWyd3aWR0aCcsICdyb3dzcGFuJywgJ2NvbHNwYW4nLCAnYWxpZ24nLCAndmFsaWduJywgJ2NsYXNzJywgJ3N0eWxlJ10sXG5cdFx0XHR0Zm9vdDogIFsnYWxpZ24nLCAndmFsaWduJywgJ2NsYXNzJywgJ3N0eWxlJ10sXG5cdFx0XHR0aDogICAgIFsnd2lkdGgnLCAncm93c3BhbicsICdjb2xzcGFuJywgJ2FsaWduJywgJ3ZhbGlnbicsICdjbGFzcycsICdzdHlsZSddLFxuXHRcdFx0dGhlYWQ6ICBbJ2FsaWduJywgJ3ZhbGlnbicsICdjbGFzcycsICdzdHlsZSddLFxuXHRcdFx0dHI6ICAgICBbJ3Jvd3NwYW4nLCAnYWxpZ24nLCAndmFsaWduJywgJ2NsYXNzJywgJ3N0eWxlJ10sXG5cdFx0XHR0dDogICAgIFtdLFxuXHRcdFx0dTogICAgICBbXSxcblx0XHRcdHVsOiAgICAgWydjbGFzcycsICdzdHlsZSddLFxuXHRcdFx0dmlkZW86ICBbJ2F1dG9wbGF5JywgJ2NvbnRyb2xzJywgJ2xvb3AnLCAncHJlbG9hZCcsICdzcmMnLCAnaGVpZ2h0JywgJ3dpZHRoJywgJ2NsYXNzJywgJ3N0eWxlJ11cblx0XHR9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGdldFVFQmFzZVBhdGgoZG9jVXJsLCBjb25mVXJsKSB7XG5cbiAgICAgICAgcmV0dXJuIGdldEJhc2VQYXRoKGRvY1VybCB8fCBzZWxmLmRvY3VtZW50LlVSTCB8fCBzZWxmLmxvY2F0aW9uLmhyZWYsIGNvbmZVcmwgfHwgZ2V0Q29uZmlnRmlsZVBhdGgoKSk7XG5cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRDb25maWdGaWxlUGF0aCgpIHtcblxuICAgICAgICB2YXIgY29uZmlnUGF0aCA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdzY3JpcHQnKTtcblxuICAgICAgICByZXR1cm4gY29uZmlnUGF0aFsgY29uZmlnUGF0aC5sZW5ndGggLSAxIF0uc3JjO1xuXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0QmFzZVBhdGgoZG9jVXJsLCBjb25mVXJsKSB7XG5cbiAgICAgICAgdmFyIGJhc2VQYXRoID0gY29uZlVybDtcblxuXG4gICAgICAgIGlmICgvXihcXC98XFxcXFxcXFwpLy50ZXN0KGNvbmZVcmwpKSB7XG5cbiAgICAgICAgICAgIGJhc2VQYXRoID0gL14uKz9cXHcoXFwvfFxcXFxcXFxcKS8uZXhlYyhkb2NVcmwpWzBdICsgY29uZlVybC5yZXBsYWNlKC9eKFxcL3xcXFxcXFxcXCkvLCAnJyk7XG5cbiAgICAgICAgfSBlbHNlIGlmICghL15bYS16XSs6L2kudGVzdChjb25mVXJsKSkge1xuXG4gICAgICAgICAgICBkb2NVcmwgPSBkb2NVcmwuc3BsaXQoXCIjXCIpWzBdLnNwbGl0KFwiP1wiKVswXS5yZXBsYWNlKC9bXlxcXFxcXC9dKyQvLCAnJyk7XG5cbiAgICAgICAgICAgIGJhc2VQYXRoID0gZG9jVXJsICsgXCJcIiArIGNvbmZVcmw7XG5cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBvcHRpbWl6YXRpb25QYXRoKGJhc2VQYXRoKTtcblxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG9wdGltaXphdGlvblBhdGgocGF0aCkge1xuXG4gICAgICAgIHZhciBwcm90b2NvbCA9IC9eW2Etel0rOlxcL1xcLy8uZXhlYyhwYXRoKVsgMCBdLFxuICAgICAgICAgICAgdG1wID0gbnVsbCxcbiAgICAgICAgICAgIHJlcyA9IFtdO1xuXG4gICAgICAgIHBhdGggPSBwYXRoLnJlcGxhY2UocHJvdG9jb2wsIFwiXCIpLnNwbGl0KFwiP1wiKVswXS5zcGxpdChcIiNcIilbMF07XG5cbiAgICAgICAgcGF0aCA9IHBhdGgucmVwbGFjZSgvXFxcXC9nLCAnLycpLnNwbGl0KC9cXC8vKTtcblxuICAgICAgICBwYXRoWyBwYXRoLmxlbmd0aCAtIDEgXSA9IFwiXCI7XG5cbiAgICAgICAgd2hpbGUgKHBhdGgubGVuZ3RoKSB7XG5cbiAgICAgICAgICAgIGlmICgoIHRtcCA9IHBhdGguc2hpZnQoKSApID09PSBcIi4uXCIpIHtcbiAgICAgICAgICAgICAgICByZXMucG9wKCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRtcCAhPT0gXCIuXCIpIHtcbiAgICAgICAgICAgICAgICByZXMucHVzaCh0bXApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcHJvdG9jb2wgKyByZXMuam9pbihcIi9cIik7XG5cbiAgICB9XG5cbiAgICB3aW5kb3cuVUUgPSB7XG4gICAgICAgIGdldFVFQmFzZVBhdGg6IGdldFVFQmFzZVBhdGhcbiAgICB9O1xuXG59KSgpO1xufSkiXSwiZmlsZSI6InBsdWdpbnMvdWVkaXRvci91ZWRpdG9yLmNvbmZpZy5qcyJ9
