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

        'iemsZtree': "plugins/inputTree/iemsZtree",
        'iemsInputTree': "plugins/inputTree/iemsInputTree",
        'iemsComboSelect': "plugins/comboSelect/iemsComboSelect",
        "jquery-base64": "plugins/jquery.base64",
        'deviceDialog': "plugins/deviceDialog/deviceDialog",
        "form": "plugins/form/form",
        "energyFlow": "plugins/energyFlow/energyFlow",

        "MockData": "plugins/mockData/MockData"
    },
    shim: {
        'jquery': {
            exports: '$'
        },
        'bootstrap': {
            deps: ['jquery']
        },
        'jqueryUI': {
            deps: ['jquery', 'css!plugins/jqueryUI/jquery-ui.min.css']
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJpbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQ3JlYXRlZCBieSBQTDAyMDUzIG9uIDIwMTYvMy8xMC5cclxuICovXHJcblxyXG5yZXF1aXJlLmNvbmZpZyh7XHJcbiAgICB1cmxBcmdzOiAnXz0nICsgKG5ldyBEYXRlKCkpLmdldFRpbWUoKSxcclxuICAgIGJhc2VVcmw6ICcvanMvJyxcclxuICAgIHBhdGhzOiB7XHJcbiAgICAgICAgJ3RleHQnOiAncmVxdWlyZS50ZXh0JyxcclxuICAgICAgICAnanF1ZXJ5JzogJ3ZlbmRvci9qcXVlcnkvanF1ZXJ5JyxcclxuICAgICAgICAnYm9vdHN0cmFwJzogJ3ZlbmRvci9ib290c3RyYXAvYm9vdHN0cmFwJyxcclxuICAgICAgICAnanF1ZXJ5VUknOiAncGx1Z2lucy9qcXVlcnlVSS9qcXVlcnktdWkubWluJyxcclxuICAgICAgICAnY29va2llJzogJ3BsdWdpbnMvQ29va2llcycsXHJcbiAgICAgICAgJ0VDaGFydHMnOiAncGx1Z2lucy9lY2hhcnRzL0VDaGFydHMnLFxyXG4gICAgICAgICdUaW1lcic6ICdwbHVnaW5zL1RpbWVyJyxcclxuICAgICAgICAnaTE4bic6ICdsYW5ndWFnZS9pMThuJyxcclxuICAgICAgICAnelRyZWUnOiAncGx1Z2lucy96VHJlZS9jb3JlJyxcclxuICAgICAgICAnelRyZWUuZXhjaGVjayc6ICdwbHVnaW5zL3pUcmVlL2V4Y2hlY2snLFxyXG4gICAgICAgICd6VHJlZS5leGVkaXQnOiAncGx1Z2lucy96VHJlZS9leGVkaXQnLFxyXG4gICAgICAgICd6VHJlZS5leGhpZGUnOiAncGx1Z2lucy96VHJlZS9leGhpZGUnLFxyXG5cclxuICAgICAgICAnTWFwVXRpbCc6ICdwbHVnaW5zL0xlYWZsZXQvTWFwVXRpbCcsXHJcbiAgICAgICAgJ2xlYWZsZXQnOiAncGx1Z2lucy9MZWFmbGV0L2xlYWZsZXQnLFxyXG4gICAgICAgICdsZWFmbGV0LmF3ZXNvbWVNYXJrZXJzJzogJ3BsdWdpbnMvTGVhZmxldC9sZWFmbGV0LmF3ZXNvbWUtbWFya2VycycsXHJcbiAgICAgICAgJ2xlYWZsZXQuTWFya2VyQ2x1c3Rlcic6ICdwbHVnaW5zL0xlYWZsZXQvbGVhZmxldC5tYXJrZXJjbHVzdGVyJyxcclxuICAgICAgICAnbGVhZmxldC5Qcm92aWRlcic6ICdwbHVnaW5zL0xlYWZsZXQvbGVhZmxldC5wcm92aWRlcnMnLFxyXG4gICAgICAgICdsb2NhdGlvblBpY2tlcic6ICdwbHVnaW5zL2xvY2F0aW9uUGlja2VyL2xlYWZsZXQtbG9jYXRpb25waWNrZXInLFxyXG5cclxuICAgICAgICAnZGF0ZVBpY2tlcic6ICdwbHVnaW5zL0RhdGVQaWNrZXIvRGF0ZVBpY2tlcicsXHJcbiAgICAgICAgJ0V4cGFuZFRhYmxlJzogJ3BsdWdpbnMvRXhwYW5kVGFibGUvRXhwYW5kVGFibGUnLFxyXG4gICAgICAgICdHcmlkVGFibGUnOiAncGx1Z2lucy9HcmlkVGFibGUvR3JpZFRhYmxlJyxcclxuICAgICAgICAnZWFzeVRhYnMnOiAncGx1Z2lucy9lYXN5VGFicy9lYXN5VGFicycsXHJcbiAgICAgICAgJ1ZhbGlkYXRlRm9ybSc6ICdwbHVnaW5zL1ZhbGlkYXRlRm9ybS9WYWxpZGF0ZUZvcm0nLFxyXG4gICAgICAgICdhamF4ZmlsZXVwbG9hZCc6IFwicGx1Z2lucy9hamF4ZmlsZXVwbG9hZFwiLFxyXG4gICAgICAgICdTZWxlY3REaWFsb2dBZGRHcm91cCc6IFwicGx1Z2lucy9zdGF0aW9uRGlhbG9nL1NlbGVjdERpYWxvZ0FkZEdyb3VwXCIsXHJcbiAgICAgICAgJ011bHRpU2VsZWN0JzogXCJwbHVnaW5zL011bHRpU2VsZWN0L011bHRpU2VsZWN0XCIsXHJcbiAgICAgICAgJ1VzZXJEaWFsb2cnOiAncGx1Z2lucy91c2VyRGlhbG9nL1VzZXJEaWFsb2cnLFxyXG4gICAgICAgICdjaXR5c2VsZWN0JzogJ3BsdWdpbnMvYXJlYVNlbGVjdC9jaXR5c2VsZWN0JyxcclxuXHJcbiAgICAgICAgJ3VlZGl0b3InOiAncGx1Z2lucy91ZWRpdG9yL3VlbXknLFxyXG4gICAgICAgICd1ZWRpdG9yLmJkbGFuZyc6ICdwbHVnaW5zL3VlZGl0b3IvbGFuZy96aC1jbi96aC1jbicsXHJcbiAgICAgICAgJ3VlZGl0b3IuYmRsYW5ncyc6ICdwbHVnaW5zL3VlZGl0b3IvbGFuZy9lbi9lbicsXHJcbiAgICAgICAgJ3VlZGl0b3IuemVyb2NsaXBib2FyZCc6ICdwbHVnaW5zL3VlZGl0b3IvdGhpcmQtcGFydHkvemVyb2NsaXBib2FyZC9aZXJvQ2xpcGJvYXJkLm1pbicsXHJcblxyXG4gICAgICAgICdkcmFnb24nOiAncGx1Z2lucy9kcmFnb24vZHJhZ29uJyxcclxuXHJcbiAgICAgICAgJ2llbXNadHJlZSc6IFwicGx1Z2lucy9pbnB1dFRyZWUvaWVtc1p0cmVlXCIsXHJcbiAgICAgICAgJ2llbXNJbnB1dFRyZWUnOiBcInBsdWdpbnMvaW5wdXRUcmVlL2llbXNJbnB1dFRyZWVcIixcclxuICAgICAgICAnaWVtc0NvbWJvU2VsZWN0JzogXCJwbHVnaW5zL2NvbWJvU2VsZWN0L2llbXNDb21ib1NlbGVjdFwiLFxyXG4gICAgICAgIFwianF1ZXJ5LWJhc2U2NFwiOiBcInBsdWdpbnMvanF1ZXJ5LmJhc2U2NFwiLFxyXG4gICAgICAgICdkZXZpY2VEaWFsb2cnOiBcInBsdWdpbnMvZGV2aWNlRGlhbG9nL2RldmljZURpYWxvZ1wiLFxyXG4gICAgICAgIFwiZm9ybVwiOiBcInBsdWdpbnMvZm9ybS9mb3JtXCIsXHJcbiAgICAgICAgXCJlbmVyZ3lGbG93XCI6IFwicGx1Z2lucy9lbmVyZ3lGbG93L2VuZXJneUZsb3dcIixcclxuXHJcbiAgICAgICAgXCJNb2NrRGF0YVwiOiBcInBsdWdpbnMvbW9ja0RhdGEvTW9ja0RhdGFcIlxyXG4gICAgfSxcclxuICAgIHNoaW06IHtcclxuICAgICAgICAnanF1ZXJ5Jzoge1xyXG4gICAgICAgICAgICBleHBvcnRzOiAnJCdcclxuICAgICAgICB9LFxyXG4gICAgICAgICdib290c3RyYXAnOiB7XHJcbiAgICAgICAgICAgIGRlcHM6IFsnanF1ZXJ5J11cclxuICAgICAgICB9LFxyXG4gICAgICAgICdqcXVlcnlVSSc6IHtcclxuICAgICAgICAgICAgZGVwczogWydqcXVlcnknLCAnY3NzIXBsdWdpbnMvanF1ZXJ5VUkvanF1ZXJ5LXVpLm1pbi5jc3MnXVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgJ2FqYXhmaWxldXBsb2FkJzoge1xyXG4gICAgICAgICAgICBkZXBzOiBbJ2pxdWVyeSddXHJcbiAgICAgICAgfSxcclxuICAgICAgICAnelRyZWUnOiB7XHJcbiAgICAgICAgICAgIGRlcHM6IFsnY3NzIXBsdWdpbnMvelRyZWUvY3NzL3pUcmVlU3R5bGUuY3NzJ11cclxuICAgICAgICB9LFxyXG4gICAgICAgICd6VHJlZS5leGNoZWNrJzoge1xyXG4gICAgICAgICAgICBkZXBzOiBbJ3pUcmVlJ11cclxuICAgICAgICB9LFxyXG4gICAgICAgICd6VHJlZS5leGVkaXQnOiB7XHJcbiAgICAgICAgICAgIGRlcHM6IFsnelRyZWUnXVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgJ3pUcmVlLmV4aGlkZSc6IHtcclxuICAgICAgICAgICAgZGVwczogWyd6VHJlZSddXHJcbiAgICAgICAgfSxcclxuICAgICAgICAnbGVhZmxldCc6IHtcclxuICAgICAgICAgICAgZGVwczogWydjc3MhcGx1Z2lucy9MZWFmbGV0L2xlYWZsZXQuY3NzJ11cclxuICAgICAgICB9LFxyXG4gICAgICAgICdsZWFmbGV0Lk1hcmtlckNsdXN0ZXInOiB7XHJcbiAgICAgICAgICAgIGRlcHM6IFtcclxuICAgICAgICAgICAgICAgICdsZWFmbGV0JyxcclxuICAgICAgICAgICAgICAgICdjc3MhcGx1Z2lucy9MZWFmbGV0L01hcmtlckNsdXN0ZXIuY3NzJywgJ2NzcyFwbHVnaW5zL0xlYWZsZXQvTWFya2VyQ2x1c3Rlci5EZWZhdWx0LmNzcydcclxuICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgZXhwb3J0czogJ0wuTWFya2VyQ2x1c3RlcidcclxuICAgICAgICB9LFxyXG4gICAgICAgICdsZWFmbGV0LmF3ZXNvbWVNYXJrZXJzJzoge1xyXG4gICAgICAgICAgICBkZXBzOiBbXHJcbiAgICAgICAgICAgICAgICAnbGVhZmxldCcsXHJcbiAgICAgICAgICAgICAgICAnY3NzIXBsdWdpbnMvTGVhZmxldC9pb25pY29ucy5jc3MnLCAnY3NzIXBsdWdpbnMvTGVhZmxldC9sZWFmbGV0LmF3ZXNvbWUtbWFya2Vycy5jc3MnXHJcbiAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgIGV4cG9ydHM6ICdMLkF3ZXNvbWVNYXJrZXJzJ1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgJ2xvY2F0aW9uUGlja2VyJzoge1xyXG4gICAgICAgICAgICBkZXBzOiBbJ01hcFV0aWwnLCAncGx1Z2lucy9MZWFmbGV0L0xlYWZsZXQuRWRpdGFibGUnLCAncGx1Z2lucy9MZWFmbGV0L0xlYWZsZXQuRWRpdGFibGUuRHJhZycsICdjc3MhcGx1Z2lucy9sb2NhdGlvblBpY2tlci9sZWFmbGV0LWxvY2F0aW9ucGlja2VyLmNzcyddXHJcbiAgICAgICAgfSxcclxuICAgICAgICAndWVkaXRvcic6IHtcclxuICAgICAgICAgICAgZGVwczogWydwbHVnaW5zL3VlZGl0b3IvdWVkaXRvci5jb25maWcnLCAnY3NzIXBsdWdpbnMvdWVkaXRvci90aGVtZXMvZGVmYXVsdC9jc3MvdWVkaXRvci5jc3MnXVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgJ3VlZGl0b3IuYmRsYW5nJzoge1xyXG4gICAgICAgICAgICBkZXBzOiBbJ3VlZGl0b3InXVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgJ3VlZGl0b3IuYmRsYW5ncyc6IHtcclxuICAgICAgICAgICAgZGVwczogWyd1ZWRpdG9yJ11cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgd2FpdFNlY29uZHM6IDBcclxufSk7XHJcblxyXG5yZXF1aXJlKFtcclxuICAgICdtYWluL2NvbnNvbGUnLFxyXG4gICAgJ2pxdWVyeScsICdqcXVlcnlVSSdcclxuXSwgZnVuY3Rpb24gKCkge1xyXG4gICAgKGZ1bmN0aW9uICgkKSB7XHJcbiAgICAgICAgcmVxdWlyZShbXHJcbiAgICAgICAgICAgICdpMThuJyxcclxuICAgICAgICAgICAgJ2Jvb3RzdHJhcCcsXHJcbiAgICAgICAgICAgICdwbHVnaW5zL2pzb24yJyxcclxuICAgICAgICAgICAgJ2Nvb2tpZScsXHJcbiAgICAgICAgICAgICdwbHVnaW5zL2NvbnRleHRNZW51JyxcclxuICAgICAgICAgICAgJ3BsdWdpbnMvbWQ1JyxcclxuICAgICAgICAgICAgJ3BsdWdpbnMvcmVzaXplJyxcclxuICAgICAgICAgICAgJ3BsdWdpbnMvdmFsaWRhdGUvdmFsaWRhdGUnLFxyXG4gICAgICAgICAgICAncGx1Z2lucy9Mb2FkaW5nJ1xyXG4gICAgICAgIF0sIGZ1bmN0aW9uIChpMThuKSB7XHJcbiAgICAgICAgICAgIGlmIChsb2NhdGlvbi5zZWFyY2gpIHtcclxuICAgICAgICAgICAgICAgIGxvY2F0aW9uLmhyZWYgPSBcIi9cIjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgd2luZG93LmkxOG4gPSBpMThuO1xyXG4gICAgICAgICAgICB3aW5kb3cubWFpbiA9IHt9O1xyXG4gICAgICAgICAgICB3aW5kb3cuTXNnID0ge307XHJcblxyXG4gICAgICAgICAgICB2YXIgTW9ja1N5cyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJlcXVpcmUoWydtYWluL21haW4nXSwgZnVuY3Rpb24gKG1haW4pIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZGlzYWJsZUtleSA9IGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGUgPSBlIHx8IHdpbmRvdy5ldmVudDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGtleUNvZGUgPSBlLmtleUNvZGUgfHwgZS53aGljaDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKChlLmFsdEtleSAmJiAoa2V5Q29kZSA9PT0gMzcpKSAvLyDlsY/olL0gQWx0K+aWueWQkemUriDihpBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHx8IChlLmFsdEtleSAmJiAoa2V5Q29kZSA9PT0gMzkpKSAvLyDlsY/olL0gQWx0K+aWueWQkemUriDihpJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHx8IChrZXlDb2RlID09PSA4KSAvLyDlsY/olL3pgIDmoLzliKDpmaTplK5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL3x8IChrZXlDb2RlID09PSAxMTYpIC8v5bGP6JS9RjXliLfmlrDplK5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHx8IChlLmN0cmxLZXkgJiYga2V5Q29kZSA9PT0gODIpIC8vIEN0cmwgKyBSXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUudGFyZ2V0LnR5cGUgfHwgZS50YXJnZXQuY29udGVudEVkaXRhYmxlID09PSAndHJ1ZScpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWUudGFyZ2V0LnJlYWRPbmx5KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgICAgICAgICAqIOemgeeUqOa1j+iniOWZqOKAnOWbnumAgOKAnVxyXG4gICAgICAgICAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciByZWYgPSB3aW5kb3cudG9wLmxvY2F0aW9uLmhyZWY7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCdwdXNoU3RhdGUnIGluIGhpc3RvcnkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2luZG93LnRvcC5oaXN0b3J5LmJhY2socmVmKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LnRvcC5oaXN0b3J5LnB1c2hTdGF0ZSgnaW5pdCcsICcnLCByZWYpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAkKHdpbmRvdykuYmluZCgncG9wc3RhdGUnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChoaXN0b3J5LnN0YXRlICE9PSAnaW5pdCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cudG9wLmhpc3RvcnkuZm9yd2FyZCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pLmJpbmQoJ2tleWRvd24nLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGlzYWJsZUtleShlKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgJChkb2N1bWVudCkuZGVsZWdhdGUoJ2lmcmFtZScsICdtb3VzZW92ZXInLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLmNvbnRlbnRzKCkudW5iaW5kKCdrZXlkb3duJykua2V5ZG93bihmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkaXNhYmxlS2V5KGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBtYWluLmxvYWRTeXN0ZW0oKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgLy8g5piv5ZCm5ZCv55So5qih5ouf5pWw5o2uXHJcbiAgICAgICAgICAgIHZhciBpc01vY2sgPSBmYWxzZTtcclxuICAgICAgICAgICAgaWYgKGlzTW9jaykge1xyXG4gICAgICAgICAgICAgICAgcmVxdWlyZShbJ01vY2tEYXRhJ10sIGZ1bmN0aW9uIChNb2NrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgd2luZG93Lk1vY2tTeXMgPSBNb2NrO1xyXG4gICAgICAgICAgICAgICAgICAgIE1vY2tTeXMoKVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBNb2NrU3lzKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH0pKGpRdWVyeSk7XHJcbn0pO1xyXG4iXSwiZmlsZSI6ImluZGV4LmpzIn0=
