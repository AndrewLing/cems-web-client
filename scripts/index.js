/**
 * Created by PL02053 on 2016/3/10.
 */

require.config({
    urlArgs: '_=' + (new Date()).getTime(),
    baseUrl: '/js/',
    paths: {
        'text': 'require.text',
        'jquery': 'vendor/jquery/jquery',
        'bootstrap': 'vendor/bootstrap/bootstrap',
        'jqueryUI': 'plugins/jqueryUI/jquery-ui.min',
        'cookie': 'plugins/Cookies',
        'ECharts': 'plugins/echarts/ECharts',
        'Timer': 'plugins/Timer',
        'i18n': 'language/i18n',
        'zTree': 'plugins/zTree/core',
        'zTree.excheck': 'plugins/zTree/excheck',
        'zTree.exedit': 'plugins/zTree/exedit',
        'zTree.exhide': 'plugins/zTree/exhide',

        'MapUtil': 'plugins/Leaflet/MapUtil',
        'leaflet': 'plugins/Leaflet/leaflet',
        'leaflet.awesomeMarkers': 'plugins/Leaflet/leaflet.awesome-markers',
        'leaflet.MarkerCluster': 'plugins/Leaflet/leaflet.markercluster',
        'leaflet.Provider': 'plugins/Leaflet/leaflet.providers',
        'locationPicker': 'plugins/locationPicker/leaflet-locationpicker',

        'datePicker': 'plugins/DatePicker/DatePicker',
        'ExpandTable': 'plugins/ExpandTable/ExpandTable',
        'GridTable': 'plugins/GridTable/GridTable',
        'easyTabs': 'plugins/easyTabs/easyTabs',
        'ValidateForm': 'plugins/ValidateForm/ValidateForm',
        'ValidataOwner':'plugins/validate/validator.cems.ext',
        'ajaxfileupload': "plugins/ajaxfileupload",
        'SelectDialogAddGroup': "plugins/stationDialog/SelectDialogAddGroup",
        'MultiSelect': "plugins/MultiSelect/MultiSelect",
        'UserDialog': 'plugins/userDialog/UserDialog',
        'cityselect': 'plugins/areaSelect/cityselect',

        'ueditor': 'plugins/ueditor/uemy',
        'ueditor.bdlang': 'plugins/ueditor/lang/zh-cn/zh-cn',
        'ueditor.bdlangs': 'plugins/ueditor/lang/en/en',
        'ueditor.zeroclipboard': 'plugins/ueditor/third-party/zeroclipboard/ZeroClipboard.min',

        'dragon': 'plugins/dragon/dragon',
        
        'jcrop': 'plugins/Jcrop/jquery.Jcrop.min',
        'jcrop.color': 'plugins/Jcrop/jquery.color',
        
        'dynamic':"plugins/dynamicList/dynamic",
        'cemstree':"plugins/cemstree/cemstree",
        'ws':"plugins/webSocket/webchannel",
        'iemsZtree': "plugins/inputTree/iemsZtree",
        'iemsInputTree': "plugins/inputTree/iemsInputTree",
        'iemsComboSelect': "plugins/comboSelect/iemsComboSelect",
        "jquery-base64": "plugins/jquery.base64",
        'deviceDialog': "plugins/deviceDialog/deviceDialog",
        "form": "plugins/form/form",
        "energyFlow": "plugins/energyFlow/energyFlow",

//        "three" :  "plugins/three/three",
        "MockData": "plugins/mockData/MockData"
    },
    shim: {
//    	'three':{
//    		deps:[],
//    		exports:'THREE'
//    	},
        'jquery': {
            exports: '$'
        },
        'bootstrap': {
            deps: ['jquery']
        },
        'jqueryUI': {
            deps: ['jquery', 'css!plugins/jqueryUI/jquery-ui.min.css']
        },
        'dynamic':{
        	deps:['css!plugins/dynamicList/dynamic.css']
        },
        'cemstree':{
        	deps:['css!plugins/cemstree/cemstree.css']
        },
        'ajaxfileupload': {
            deps: ['jquery']
        },
        'zTree': {
            deps: ['css!plugins/zTree/css/zTreeStyle.css']
        },
        'zTree.excheck': {
            deps: ['zTree']
        },
        'zTree.exedit': {
            deps: ['zTree']
        },
        'zTree.exhide': {
            deps: ['zTree']
        },
        'leaflet': {
            deps: ['css!plugins/Leaflet/leaflet.css']
        },
        'leaflet.MarkerCluster': {
            deps: [
                'leaflet',
                'css!plugins/Leaflet/MarkerCluster.css', 'css!plugins/Leaflet/MarkerCluster.Default.css'
            ],
            exports: 'L.MarkerCluster'
        },
        'leaflet.awesomeMarkers': {
            deps: [
                'leaflet',
                'css!plugins/Leaflet/ionicons.css', 'css!plugins/Leaflet/leaflet.awesome-markers.css'
            ],
            exports: 'L.AwesomeMarkers'
        },
        'locationPicker': {
            deps: ['MapUtil', 'plugins/Leaflet/Leaflet.Editable', 'plugins/Leaflet/Leaflet.Editable.Drag', 'css!plugins/locationPicker/leaflet-locationpicker.css']
        },
        'ueditor': {
            deps: ['plugins/ueditor/ueditor.config', 'css!plugins/ueditor/themes/default/css/ueditor.css']
        },
        'ueditor.bdlang': {
            deps: ['ueditor']
        },
        'ueditor.bdlangs': {
            deps: ['ueditor']
        },
        'jcrop':{
        	deps: ['css!plugins/Jcrop/css/jquery.Jcrop.min.css']
        }
    },
    waitSeconds: 0
});

require([
    'main/console',
    'jquery', 'jqueryUI'
], function () {
    (function ($) {
        require([
            'i18n',
            'bootstrap',
            'plugins/json2',
            'cookie',
            'plugins/contextMenu',
            'plugins/md5',
            'plugins/resize',
            'plugins/validate/validate',
            'plugins/Loading'
        ], function (i18n) {
            if (location.search) {
                location.href = "/";
            }

            window.i18n = i18n;
            window.main = {};
            window.Msg = {};

            var MockSys = function () {
                require(['main/main'], function (main) {
                    var disableKey = function (e) {
                        e = e || window.event;
                        var keyCode = e.keyCode || e.which;
                        if ((e.altKey && (keyCode === 37)) // 屏蔽 Alt+方向键 ←
                            || (e.altKey && (keyCode === 39)) // 屏蔽 Alt+方向键 →
                            || (keyCode === 8) // 屏蔽退格删除键
                                //|| (keyCode === 116) //屏蔽F5刷新键
                            || (e.ctrlKey && keyCode === 82) // Ctrl + R
                        ) {
                            if (e.target.type || e.target.contentEditable === 'true') {
                                if (!e.target.readOnly)
                                    return true;
                            }
                            e.preventDefault();
                            return false;
                        }
                    };

                    /**
                     * 禁用浏览器“回退”
                     */
                    var ref = window.top.location.href;
                    if ('pushState' in history) {
                        // window.top.history.back(ref);
                        window.top.history.pushState('init', '', ref);
                    }
                    $(window).bind('popstate', function () {
                        if (history.state !== 'init')
                            window.top.history.forward();
                    }).bind('keydown', function (e) {
                        return disableKey(e);
                    });

                    $(document).delegate('iframe', 'mouseover', function () {
                        try {
                            $(this).contents().unbind('keydown').keydown(function (e) {
                                return disableKey(e);
                            });
                        } catch (e) {
                        }
                    });

                    main.loadSystem();
                });
            };

            // 是否启用模拟数据
            var isMock = false;
            if (isMock) {
                require(['MockData'], function (Mock) {
                    window.MockSys = Mock;
                    MockSys()
                });
            } else {
                MockSys();
            }
        });
    })(jQuery);
});
