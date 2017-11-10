/**
 * 树的扩展 - 搜索框点击之后出现的树
 * @author PY02039
 */
define(['jquery', 'plugins/inputTree/iemsZtree'], function ($) {
    if ($.fn.iemsInputTree) {
        return $;
    }

    $.fn.iemsInputTree = function (_p) {
        var $this = $(this);

        var $cfg = $.extend({
            url: '',
            param: {},
            $id: false, //传递反填id的jquery实例对象，不传递默认绑定到this元素的treeSelId属性上
            checkStyle: "checkbox", //zTree树格式："checkbox"、"radio"
            nodeEvents: false, // 树节点操作事件回调定义，可定义 onCheck（节点选中）和 onClick（节点点击）事件
            dataLevel: false, //数据层次， 默认是最底层， 但是可能层次不同的也会被统计
            treeSearch: true, //树的搜索
            treeNodeCreate: false, //树节点构建时调用， 默认为替换为电站各种图标
            treeNodeFormat: false, //树节点格式化
            ajaxBefore: false,
            clickPIsChecked: false, // 父节点是否可选
            textFiled: "name", //自定义展示字段
            selectNodes: [], //默认选中的值 id
            isPromptlyInit: false, //是否立即初始化
            click2hidden: true, //点击是否隐藏
            isBind: false, //是否绑定change事件
            rootCheckable: false, //root节点是否可选择,
            success: null //成功后的回调函数
        }, _p);

        var r = {
            //数据
            _data: {
                _treeId: $this.attr('id') + "_inputTree",
                _searchDiv: $this.attr('id') + "_searchDiv",
                _inputId: $this.attr('id')
            },

            init: function () {
                if ($cfg.isPromptlyInit) {
                    r.createView();
                }

                $this.unbind("click").bind('click', function (event) {
                    r.createView(event);
                });

                //绑定输入框内容变化事件
                if ($cfg.isBind) {
                    $this.unbind("input propertychange").bind("input propertychange", function (event) {
                        r.createView(event);
                    });
                }

                return $this;
            },

            /**
             * 创建视图结构
             */
            createView: function () {
                var _selfData = r._data;
                r._dialogs = $('.modal[role=dialog]').length || 0;

                if ($('#' + _selfData._searchDiv).length > 0 && $('#' + _selfData._searchDiv).is(':visible')) {
                    return;
                }

                $this.removeAttr('readonly').removeAttr('title').focusin().val('');

                //创建必要div
                $("#" + _selfData._searchDiv).remove();

                //添加到input后
                var seaDiv = $("<div id='" + _selfData._searchDiv + "' class='_ztreeInputDiv' style='overflow-y: auto; display: none;'><div>");
                var treeDiv = $("<ul id='" + _selfData._treeId + "' class='ztree'></ul>");
                seaDiv.append(treeDiv);
                $('body').append(seaDiv);

                var inputPosition = $this.offset();
                seaDiv.css({
                    top: inputPosition.top + $this.height() + 5 + "px",
                    left: inputPosition.left + "px",
                    width: $this.width() + 5
                });

                //显示树
                r.show(seaDiv);

                //树的加载
                r.initTree(treeDiv);
            },

            /**
             * 树的搜索： 如果没有指定就搜索最后一层
             */
            selectedTreeDataLevel: function (node) {
                if ($cfg.dataLevel && $.isNumeric($cfg.dataLevel)) {
                    return !node.isParent && node.level == $cfg.dataLevel && node.checked;
                } else {
                    return ($cfg.clickPIsChecked || !node.isParent) && node.checked;
                }
            },

            /**
             * 树的初始化
             */
            initTree: function ($tree) {
                if ($cfg.ajaxBefore && $.isFunction($cfg.ajaxBefore)) {
                    $cfg.ajaxBefore($cfg);
                }

                var $zOption = {
                    view: {
                        dblClickExpand: false,
                        showLine: false,
                        selectedMulti: false
                    },
                    data: {
                        simpleData: {
                            enable: true,
                            idKey: "id",
                            pIdKey: "pid",
                            rootPId: ""
                        },
                        key: {
                            name: $cfg.textFiled
                        }
                    },
                    check: {
                        enable: true,
                        chkStyle: $cfg.checkStyle,
                        radioType: "all"
                    },
                    callback: {
                        onClick: function (e, treeId, treeNode, clickFlag) {
                            var _tree = $.fn.zTree.getZTreeObj(treeId);
                            if (!$cfg.clickPIsChecked && treeNode.isParent) {
                                _tree.expandNode(treeNode, !treeNode.open, false, true);
                            } else {
                                var checked = treeNode.checked;
                                if ('radio' == _tree.setting.check.chkStyle) {
                                    //_tree.expandNode(treeNode, !treeNode.open, false, true);
                                } else {
                                    _tree.checkNode(treeNode, !checked, true, true);
                                }
                            }

                            if ($cfg.nodeEvents && $cfg.nodeEvents.onClick && $.isFunction($cfg.nodeEvents.onClick)) {
                                $cfg.nodeEvents.onClick(e, treeId, treeNode, clickFlag);
                            }

                            return false;
                        },
                        onCheck: function (e, treeId, treeNode) {
                            var _tree = $.fn.zTree.getZTreeObj(treeId);

                            if ($cfg.nodeEvents && $cfg.nodeEvents.onCheck && $.isFunction($cfg.nodeEvents.onCheck)) {
                                if ($cfg.nodeEvents.onCheck(e, treeId, treeNode)) {
                                    return;
                                }
                            }

                            //if (!$cfg.clickPIsChecked && treeNode.isParent) {
                            //    _tree.checkNode(treeNode, false, true);
                            //}

                            if ('radio' == _tree.setting.check.chkStyle) {
                                if ($cfg.click2hidden) {
                                    r.onDestroy();
                                }
                            }
                        }
                    }
                };

                //构建树
                $tree.iemsZtree($zOption, {
                    url: $cfg.url,
                    param: $cfg.param,
                    treeSearch: $cfg.treeSearch,
                    treeSearchInput: $this,
                    searchDataLevel: $cfg.dataLevel,
                    treeNodeCreate: $cfg.treeNodeCreate,
                    treeNodeFormat: $cfg.treeNodeFormat,
                    treeLoadAfter: function (tree) {
                        if ($cfg.rootCheckable) {
                            var rootNode = tree.getNodesByFilter(function (node) {
                                return node.level == 0
                            }, true);
                            if (rootNode && rootNode.id == 1) {
                                tree.setChkDisabled(rootNode, true);
                            }
                        }
                        var checkNodeId = $this.attr('treeSelId');//获取之前选中节点
                        if (checkNodeId) {
                            checkNodeId = checkNodeId.split(',');
                            $cfg.selectNodes = null;
                            var tCheckNodes = tree.getNodesByFilter(function (node) {
                                return -1 != $.inArray(node.id.toString(), checkNodeId);
                            });
                            $.each(tCheckNodes, function (i, tnode) {
                                tree.expandNode(tnode.getParentNode(), true, false);   //展开区域
                                if (tnode.getParentNode()) {
                                    tree.expandNode(tnode.getParentNode().getParentNode(), true, false);   //展开顶层节点
                                }
                                tree.checkNode(tnode, true, true, false);  //第一个参数是：要勾选的节点，第二个参数是否勾选，  第三个参数是否勾选关联父节点
                            });
                        } else if ($cfg.selectNodes && $cfg.selectNodes.length > 0) {
                            var tCheckNodes = tree.getNodesByFilter(function (node) {
                                return -1 != $.inArray(node.id.toString(), $cfg.selectNodes);
                            });
                            var datas = [];
                            if (tCheckNodes && tCheckNodes.length > 0) {
                                var seletedIds = [];
                                var seletedNames = [];
                                $.each(tCheckNodes, function (i, tnode) {
                                    datas.push(tnode);
                                    seletedIds.push(tnode.id);
                                    seletedNames.push(tnode[$cfg.textFiled]);
                                    tree.expandNode(tnode.getParentNode(), true, false);   //展开区域
                                    if (tnode.getParentNode()) {
                                        tree.expandNode(tnode.getParentNode().getParentNode(), true, false);   //展开顶层节点
                                    }
                                    tree.checkNode(tnode, true, true, false);  //第一个参数是：要勾选的节点，第二个参数是否勾选，  第三个参数是否勾选关联父节点
                                });
                                $this.attr('treeSelId', seletedIds.join(',')).attr('title', seletedNames.join(','));
                                $cfg.$id && $cfg.$id.val && $cfg.$id.val(seletedIds.join(','));
                                $this.val(seletedNames.join(',')).focusout();
                            }
                            $cfg.success && $cfg.success(datas);
                        }
                    },
                    treeDataLoadFiled: function () {
                        App.alert({
                            title: Msg.info,
                            message: Msg.loadDataFaild
                        });
                        $tree.parent(r._data._searchDiv).html("<span color='red'>" + Msg.loadDataFaild + "</span>");
                    }
                });
            },

            /**
             * 显示
             */
            show: function (dom) {
                $(dom).css({
                    'z-index': +(App.dialogZIndex || 940)
                }).show();
                $("body").bind('mousedown', function (event) {
                    if (!(event.target.id == r._data._searchDiv
                        || event.target.id == r._data._treeId
                        || event.target.id == r._data._inputId
                        || $(event.target).parents("._ztreeInputDiv").length > 0
                        || $('.modal-overlay[role=dialog]').length > (r._dialogs || 0))) {
                        r.onDestroy();
                    }
                });
            },

            /**
             * 树消失，并且输入框变成只读，回写数据
             */
            onDestroy: function () {
                var _selfData = r._data;
                var _tree = $.fn.zTree.getZTreeObj(_selfData._treeId);

                var seletedIds = [];
                var seletedNames = [];
                var poorsupport = [];
                var seletedUnits = [];    //勾选节点单位

                //输入框失去焦点， 并且变为只读
                $this.focusout().attr('readonly', 'readonly');

                //取得树勾选的id, 并将id填入影藏域， name填入输入框
                if (_tree) {
                    var selectedNodes = _tree.getNodesByFilter(r.selectedTreeDataLevel);
                    $.each(selectedNodes, function (i, node) {
                        seletedIds.push(node.id);
                        seletedNames.push(node[$cfg.textFiled]);
                        seletedUnits.push(node.unit);
                        if (node.supportPoor) {
                            poorsupport.push(node.supportPoor);
                        }
                    });

                    $this.attr('treeSelId', seletedIds.join(',')).attr('title', seletedNames.join(','));
                    $this.attr('unit', seletedUnits.join(',')); //勾选节点单位
                    if (poorsupport.length > 0) {
                        $this.attr('poorsupport', poorsupport.join(','));
                    } else {
                        $this.attr('poorsupport', "");
                    }
                    $cfg.$id && $cfg.$id.val && $cfg.$id.val(seletedIds.join(','));
                    $this.val(seletedNames.join(',')).focusout();

                    //销毁树
                    _tree.destroy();
                }

                //清空树，隐藏div
                var seaDiv = $('#' + _selfData._searchDiv);
                if (seaDiv.is(':visible')) {
                    seaDiv.fadeIn().remove();
                    $("body").unbind('mousedown');
                }
                $this.trigger('change');
            }
        };

        return r.init();
    };
});


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL2lucHV0VHJlZS9pZW1zSW5wdXRUcmVlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiDmoJHnmoTmianlsZUgLSDmkJzntKLmoYbngrnlh7vkuYvlkI7lh7rnjrDnmoTmoJFcclxuICogQGF1dGhvciBQWTAyMDM5XHJcbiAqL1xyXG5kZWZpbmUoWydqcXVlcnknLCAncGx1Z2lucy9pbnB1dFRyZWUvaWVtc1p0cmVlJ10sIGZ1bmN0aW9uICgkKSB7XHJcbiAgICBpZiAoJC5mbi5pZW1zSW5wdXRUcmVlKSB7XHJcbiAgICAgICAgcmV0dXJuICQ7XHJcbiAgICB9XHJcblxyXG4gICAgJC5mbi5pZW1zSW5wdXRUcmVlID0gZnVuY3Rpb24gKF9wKSB7XHJcbiAgICAgICAgdmFyICR0aGlzID0gJCh0aGlzKTtcclxuXHJcbiAgICAgICAgdmFyICRjZmcgPSAkLmV4dGVuZCh7XHJcbiAgICAgICAgICAgIHVybDogJycsXHJcbiAgICAgICAgICAgIHBhcmFtOiB7fSxcclxuICAgICAgICAgICAgJGlkOiBmYWxzZSwgLy/kvKDpgJLlj43loatpZOeahGpxdWVyeeWunuS+i+Wvueixoe+8jOS4jeS8oOmAkum7mOiupOe7keWumuWIsHRoaXPlhYPntKDnmoR0cmVlU2VsSWTlsZ7mgKfkuIpcclxuICAgICAgICAgICAgY2hlY2tTdHlsZTogXCJjaGVja2JveFwiLCAvL3pUcmVl5qCR5qC85byP77yaXCJjaGVja2JveFwi44CBXCJyYWRpb1wiXHJcbiAgICAgICAgICAgIG5vZGVFdmVudHM6IGZhbHNlLCAvLyDmoJHoioLngrnmk43kvZzkuovku7blm57osIPlrprkuYnvvIzlj6/lrprkuYkgb25DaGVja++8iOiKgueCuemAieS4re+8ieWSjCBvbkNsaWNr77yI6IqC54K554K55Ye777yJ5LqL5Lu2XHJcbiAgICAgICAgICAgIGRhdGFMZXZlbDogZmFsc2UsIC8v5pWw5o2u5bGC5qyh77yMIOm7mOiupOaYr+acgOW6leWxgu+8jCDkvYbmmK/lj6/og73lsYLmrKHkuI3lkIznmoTkuZ/kvJrooqvnu5/orqFcclxuICAgICAgICAgICAgdHJlZVNlYXJjaDogdHJ1ZSwgLy/moJHnmoTmkJzntKJcclxuICAgICAgICAgICAgdHJlZU5vZGVDcmVhdGU6IGZhbHNlLCAvL+agkeiKgueCueaehOW7uuaXtuiwg+eUqO+8jCDpu5jorqTkuLrmm7/mjaLkuLrnlLXnq5nlkITnp43lm77moIdcclxuICAgICAgICAgICAgdHJlZU5vZGVGb3JtYXQ6IGZhbHNlLCAvL+agkeiKgueCueagvOW8j+WMllxyXG4gICAgICAgICAgICBhamF4QmVmb3JlOiBmYWxzZSxcclxuICAgICAgICAgICAgY2xpY2tQSXNDaGVja2VkOiBmYWxzZSwgLy8g54i26IqC54K55piv5ZCm5Y+v6YCJXHJcbiAgICAgICAgICAgIHRleHRGaWxlZDogXCJuYW1lXCIsIC8v6Ieq5a6a5LmJ5bGV56S65a2X5q61XHJcbiAgICAgICAgICAgIHNlbGVjdE5vZGVzOiBbXSwgLy/pu5jorqTpgInkuK3nmoTlgLwgaWRcclxuICAgICAgICAgICAgaXNQcm9tcHRseUluaXQ6IGZhbHNlLCAvL+aYr+WQpueri+WNs+WIneWni+WMllxyXG4gICAgICAgICAgICBjbGljazJoaWRkZW46IHRydWUsIC8v54K55Ye75piv5ZCm6ZqQ6JePXHJcbiAgICAgICAgICAgIGlzQmluZDogZmFsc2UsIC8v5piv5ZCm57uR5a6aY2hhbmdl5LqL5Lu2XHJcbiAgICAgICAgICAgIHJvb3RDaGVja2FibGU6IGZhbHNlLCAvL3Jvb3ToioLngrnmmK/lkKblj6/pgInmi6ksXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IG51bGwgLy/miJDlip/lkI7nmoTlm57osIPlh73mlbBcclxuICAgICAgICB9LCBfcCk7XHJcblxyXG4gICAgICAgIHZhciByID0ge1xyXG4gICAgICAgICAgICAvL+aVsOaNrlxyXG4gICAgICAgICAgICBfZGF0YToge1xyXG4gICAgICAgICAgICAgICAgX3RyZWVJZDogJHRoaXMuYXR0cignaWQnKSArIFwiX2lucHV0VHJlZVwiLFxyXG4gICAgICAgICAgICAgICAgX3NlYXJjaERpdjogJHRoaXMuYXR0cignaWQnKSArIFwiX3NlYXJjaERpdlwiLFxyXG4gICAgICAgICAgICAgICAgX2lucHV0SWQ6ICR0aGlzLmF0dHIoJ2lkJylcclxuICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGlmICgkY2ZnLmlzUHJvbXB0bHlJbml0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgci5jcmVhdGVWaWV3KCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgJHRoaXMudW5iaW5kKFwiY2xpY2tcIikuYmluZCgnY2xpY2snLCBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICByLmNyZWF0ZVZpZXcoZXZlbnQpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy/nu5HlrprovpPlhaXmoYblhoXlrrnlj5jljJbkuovku7ZcclxuICAgICAgICAgICAgICAgIGlmICgkY2ZnLmlzQmluZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICR0aGlzLnVuYmluZChcImlucHV0IHByb3BlcnR5Y2hhbmdlXCIpLmJpbmQoXCJpbnB1dCBwcm9wZXJ0eWNoYW5nZVwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgci5jcmVhdGVWaWV3KGV2ZW50KTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gJHRoaXM7XHJcbiAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICog5Yib5bu66KeG5Zu+57uT5p6EXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBjcmVhdGVWaWV3OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgX3NlbGZEYXRhID0gci5fZGF0YTtcclxuICAgICAgICAgICAgICAgIHIuX2RpYWxvZ3MgPSAkKCcubW9kYWxbcm9sZT1kaWFsb2ddJykubGVuZ3RoIHx8IDA7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCQoJyMnICsgX3NlbGZEYXRhLl9zZWFyY2hEaXYpLmxlbmd0aCA+IDAgJiYgJCgnIycgKyBfc2VsZkRhdGEuX3NlYXJjaERpdikuaXMoJzp2aXNpYmxlJykpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgJHRoaXMucmVtb3ZlQXR0cigncmVhZG9ubHknKS5yZW1vdmVBdHRyKCd0aXRsZScpLmZvY3VzaW4oKS52YWwoJycpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8v5Yib5bu65b+F6KaBZGl2XHJcbiAgICAgICAgICAgICAgICAkKFwiI1wiICsgX3NlbGZEYXRhLl9zZWFyY2hEaXYpLnJlbW92ZSgpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8v5re75Yqg5YiwaW5wdXTlkI5cclxuICAgICAgICAgICAgICAgIHZhciBzZWFEaXYgPSAkKFwiPGRpdiBpZD0nXCIgKyBfc2VsZkRhdGEuX3NlYXJjaERpdiArIFwiJyBjbGFzcz0nX3p0cmVlSW5wdXREaXYnIHN0eWxlPSdvdmVyZmxvdy15OiBhdXRvOyBkaXNwbGF5OiBub25lOyc+PGRpdj5cIik7XHJcbiAgICAgICAgICAgICAgICB2YXIgdHJlZURpdiA9ICQoXCI8dWwgaWQ9J1wiICsgX3NlbGZEYXRhLl90cmVlSWQgKyBcIicgY2xhc3M9J3p0cmVlJz48L3VsPlwiKTtcclxuICAgICAgICAgICAgICAgIHNlYURpdi5hcHBlbmQodHJlZURpdik7XHJcbiAgICAgICAgICAgICAgICAkKCdib2R5JykuYXBwZW5kKHNlYURpdik7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGlucHV0UG9zaXRpb24gPSAkdGhpcy5vZmZzZXQoKTtcclxuICAgICAgICAgICAgICAgIHNlYURpdi5jc3Moe1xyXG4gICAgICAgICAgICAgICAgICAgIHRvcDogaW5wdXRQb3NpdGlvbi50b3AgKyAkdGhpcy5oZWlnaHQoKSArIDUgKyBcInB4XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgbGVmdDogaW5wdXRQb3NpdGlvbi5sZWZ0ICsgXCJweFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiAkdGhpcy53aWR0aCgpICsgNVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy/mmL7npLrmoJFcclxuICAgICAgICAgICAgICAgIHIuc2hvdyhzZWFEaXYpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8v5qCR55qE5Yqg6L29XHJcbiAgICAgICAgICAgICAgICByLmluaXRUcmVlKHRyZWVEaXYpO1xyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIOagkeeahOaQnOe0ou+8miDlpoLmnpzmsqHmnInmjIflrprlsLHmkJzntKLmnIDlkI7kuIDlsYJcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIHNlbGVjdGVkVHJlZURhdGFMZXZlbDogZnVuY3Rpb24gKG5vZGUpIHtcclxuICAgICAgICAgICAgICAgIGlmICgkY2ZnLmRhdGFMZXZlbCAmJiAkLmlzTnVtZXJpYygkY2ZnLmRhdGFMZXZlbCkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gIW5vZGUuaXNQYXJlbnQgJiYgbm9kZS5sZXZlbCA9PSAkY2ZnLmRhdGFMZXZlbCAmJiBub2RlLmNoZWNrZWQ7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoJGNmZy5jbGlja1BJc0NoZWNrZWQgfHwgIW5vZGUuaXNQYXJlbnQpICYmIG5vZGUuY2hlY2tlZDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiDmoJHnmoTliJ3lp4vljJZcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIGluaXRUcmVlOiBmdW5jdGlvbiAoJHRyZWUpIHtcclxuICAgICAgICAgICAgICAgIGlmICgkY2ZnLmFqYXhCZWZvcmUgJiYgJC5pc0Z1bmN0aW9uKCRjZmcuYWpheEJlZm9yZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAkY2ZnLmFqYXhCZWZvcmUoJGNmZyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyICR6T3B0aW9uID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHZpZXc6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGJsQ2xpY2tFeHBhbmQ6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzaG93TGluZTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkTXVsdGk6IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpbXBsZURhdGE6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkS2V5OiBcImlkXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwSWRLZXk6IFwicGlkXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByb290UElkOiBcIlwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJGNmZy50ZXh0RmlsZWRcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgY2hlY2s6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGtTdHlsZTogJGNmZy5jaGVja1N0eWxlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByYWRpb1R5cGU6IFwiYWxsXCJcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s6IGZ1bmN0aW9uIChlLCB0cmVlSWQsIHRyZWVOb2RlLCBjbGlja0ZsYWcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBfdHJlZSA9ICQuZm4uelRyZWUuZ2V0WlRyZWVPYmoodHJlZUlkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghJGNmZy5jbGlja1BJc0NoZWNrZWQgJiYgdHJlZU5vZGUuaXNQYXJlbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdHJlZS5leHBhbmROb2RlKHRyZWVOb2RlLCAhdHJlZU5vZGUub3BlbiwgZmFsc2UsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2hlY2tlZCA9IHRyZWVOb2RlLmNoZWNrZWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCdyYWRpbycgPT0gX3RyZWUuc2V0dGluZy5jaGVjay5jaGtTdHlsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL190cmVlLmV4cGFuZE5vZGUodHJlZU5vZGUsICF0cmVlTm9kZS5vcGVuLCBmYWxzZSwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RyZWUuY2hlY2tOb2RlKHRyZWVOb2RlLCAhY2hlY2tlZCwgdHJ1ZSwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkY2ZnLm5vZGVFdmVudHMgJiYgJGNmZy5ub2RlRXZlbnRzLm9uQ2xpY2sgJiYgJC5pc0Z1bmN0aW9uKCRjZmcubm9kZUV2ZW50cy5vbkNsaWNrKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRjZmcubm9kZUV2ZW50cy5vbkNsaWNrKGUsIHRyZWVJZCwgdHJlZU5vZGUsIGNsaWNrRmxhZyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNoZWNrOiBmdW5jdGlvbiAoZSwgdHJlZUlkLCB0cmVlTm9kZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIF90cmVlID0gJC5mbi56VHJlZS5nZXRaVHJlZU9iaih0cmVlSWQpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkY2ZnLm5vZGVFdmVudHMgJiYgJGNmZy5ub2RlRXZlbnRzLm9uQ2hlY2sgJiYgJC5pc0Z1bmN0aW9uKCRjZmcubm9kZUV2ZW50cy5vbkNoZWNrKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkY2ZnLm5vZGVFdmVudHMub25DaGVjayhlLCB0cmVlSWQsIHRyZWVOb2RlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vaWYgKCEkY2ZnLmNsaWNrUElzQ2hlY2tlZCAmJiB0cmVlTm9kZS5pc1BhcmVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgX3RyZWUuY2hlY2tOb2RlKHRyZWVOb2RlLCBmYWxzZSwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL31cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoJ3JhZGlvJyA9PSBfdHJlZS5zZXR0aW5nLmNoZWNrLmNoa1N0eWxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCRjZmcuY2xpY2syaGlkZGVuKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHIub25EZXN0cm95KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICAvL+aehOW7uuagkVxyXG4gICAgICAgICAgICAgICAgJHRyZWUuaWVtc1p0cmVlKCR6T3B0aW9uLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgdXJsOiAkY2ZnLnVybCxcclxuICAgICAgICAgICAgICAgICAgICBwYXJhbTogJGNmZy5wYXJhbSxcclxuICAgICAgICAgICAgICAgICAgICB0cmVlU2VhcmNoOiAkY2ZnLnRyZWVTZWFyY2gsXHJcbiAgICAgICAgICAgICAgICAgICAgdHJlZVNlYXJjaElucHV0OiAkdGhpcyxcclxuICAgICAgICAgICAgICAgICAgICBzZWFyY2hEYXRhTGV2ZWw6ICRjZmcuZGF0YUxldmVsLFxyXG4gICAgICAgICAgICAgICAgICAgIHRyZWVOb2RlQ3JlYXRlOiAkY2ZnLnRyZWVOb2RlQ3JlYXRlLFxyXG4gICAgICAgICAgICAgICAgICAgIHRyZWVOb2RlRm9ybWF0OiAkY2ZnLnRyZWVOb2RlRm9ybWF0LFxyXG4gICAgICAgICAgICAgICAgICAgIHRyZWVMb2FkQWZ0ZXI6IGZ1bmN0aW9uICh0cmVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkY2ZnLnJvb3RDaGVja2FibGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByb290Tm9kZSA9IHRyZWUuZ2V0Tm9kZXNCeUZpbHRlcihmdW5jdGlvbiAobm9kZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBub2RlLmxldmVsID09IDBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJvb3ROb2RlICYmIHJvb3ROb2RlLmlkID09IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmVlLnNldENoa0Rpc2FibGVkKHJvb3ROb2RlLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2hlY2tOb2RlSWQgPSAkdGhpcy5hdHRyKCd0cmVlU2VsSWQnKTsvL+iOt+WPluS5i+WJjemAieS4reiKgueCuVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2hlY2tOb2RlSWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrTm9kZUlkID0gY2hlY2tOb2RlSWQuc3BsaXQoJywnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRjZmcuc2VsZWN0Tm9kZXMgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRDaGVja05vZGVzID0gdHJlZS5nZXROb2Rlc0J5RmlsdGVyKGZ1bmN0aW9uIChub2RlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC0xICE9ICQuaW5BcnJheShub2RlLmlkLnRvU3RyaW5nKCksIGNoZWNrTm9kZUlkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKHRDaGVja05vZGVzLCBmdW5jdGlvbiAoaSwgdG5vZGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmVlLmV4cGFuZE5vZGUodG5vZGUuZ2V0UGFyZW50Tm9kZSgpLCB0cnVlLCBmYWxzZSk7ICAgLy/lsZXlvIDljLrln59cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodG5vZGUuZ2V0UGFyZW50Tm9kZSgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyZWUuZXhwYW5kTm9kZSh0bm9kZS5nZXRQYXJlbnROb2RlKCkuZ2V0UGFyZW50Tm9kZSgpLCB0cnVlLCBmYWxzZSk7ICAgLy/lsZXlvIDpobblsYLoioLngrlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJlZS5jaGVja05vZGUodG5vZGUsIHRydWUsIHRydWUsIGZhbHNlKTsgIC8v56ys5LiA5Liq5Y+C5pWw5piv77ya6KaB5Yu+6YCJ55qE6IqC54K577yM56ys5LqM5Liq5Y+C5pWw5piv5ZCm5Yu+6YCJ77yMICDnrKzkuInkuKrlj4LmlbDmmK/lkKbli77pgInlhbPogZTniLboioLngrlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCRjZmcuc2VsZWN0Tm9kZXMgJiYgJGNmZy5zZWxlY3ROb2Rlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdENoZWNrTm9kZXMgPSB0cmVlLmdldE5vZGVzQnlGaWx0ZXIoZnVuY3Rpb24gKG5vZGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gLTEgIT0gJC5pbkFycmF5KG5vZGUuaWQudG9TdHJpbmcoKSwgJGNmZy5zZWxlY3ROb2Rlcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkYXRhcyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRDaGVja05vZGVzICYmIHRDaGVja05vZGVzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2VsZXRlZElkcyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzZWxldGVkTmFtZXMgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmVhY2godENoZWNrTm9kZXMsIGZ1bmN0aW9uIChpLCB0bm9kZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhcy5wdXNoKHRub2RlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZXRlZElkcy5wdXNoKHRub2RlLmlkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZXRlZE5hbWVzLnB1c2godG5vZGVbJGNmZy50ZXh0RmlsZWRdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJlZS5leHBhbmROb2RlKHRub2RlLmdldFBhcmVudE5vZGUoKSwgdHJ1ZSwgZmFsc2UpOyAgIC8v5bGV5byA5Yy65Z+fXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0bm9kZS5nZXRQYXJlbnROb2RlKCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyZWUuZXhwYW5kTm9kZSh0bm9kZS5nZXRQYXJlbnROb2RlKCkuZ2V0UGFyZW50Tm9kZSgpLCB0cnVlLCBmYWxzZSk7ICAgLy/lsZXlvIDpobblsYLoioLngrlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmVlLmNoZWNrTm9kZSh0bm9kZSwgdHJ1ZSwgdHJ1ZSwgZmFsc2UpOyAgLy/nrKzkuIDkuKrlj4LmlbDmmK/vvJropoHli77pgInnmoToioLngrnvvIznrKzkuozkuKrlj4LmlbDmmK/lkKbli77pgInvvIwgIOesrOS4ieS4quWPguaVsOaYr+WQpuWLvumAieWFs+iBlOeItuiKgueCuVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0aGlzLmF0dHIoJ3RyZWVTZWxJZCcsIHNlbGV0ZWRJZHMuam9pbignLCcpKS5hdHRyKCd0aXRsZScsIHNlbGV0ZWROYW1lcy5qb2luKCcsJykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRjZmcuJGlkICYmICRjZmcuJGlkLnZhbCAmJiAkY2ZnLiRpZC52YWwoc2VsZXRlZElkcy5qb2luKCcsJykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0aGlzLnZhbChzZWxldGVkTmFtZXMuam9pbignLCcpKS5mb2N1c291dCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJGNmZy5zdWNjZXNzICYmICRjZmcuc3VjY2VzcyhkYXRhcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHRyZWVEYXRhTG9hZEZpbGVkOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIEFwcC5hbGVydCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogTXNnLmluZm8sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBNc2cubG9hZERhdGFGYWlsZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHRyZWUucGFyZW50KHIuX2RhdGEuX3NlYXJjaERpdikuaHRtbChcIjxzcGFuIGNvbG9yPSdyZWQnPlwiICsgTXNnLmxvYWREYXRhRmFpbGQgKyBcIjwvc3Bhbj5cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICog5pi+56S6XHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBzaG93OiBmdW5jdGlvbiAoZG9tKSB7XHJcbiAgICAgICAgICAgICAgICAkKGRvbSkuY3NzKHtcclxuICAgICAgICAgICAgICAgICAgICAnei1pbmRleCc6ICsoQXBwLmRpYWxvZ1pJbmRleCB8fCA5NDApXHJcbiAgICAgICAgICAgICAgICB9KS5zaG93KCk7XHJcbiAgICAgICAgICAgICAgICAkKFwiYm9keVwiKS5iaW5kKCdtb3VzZWRvd24nLCBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIShldmVudC50YXJnZXQuaWQgPT0gci5fZGF0YS5fc2VhcmNoRGl2XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHx8IGV2ZW50LnRhcmdldC5pZCA9PSByLl9kYXRhLl90cmVlSWRcclxuICAgICAgICAgICAgICAgICAgICAgICAgfHwgZXZlbnQudGFyZ2V0LmlkID09IHIuX2RhdGEuX2lucHV0SWRcclxuICAgICAgICAgICAgICAgICAgICAgICAgfHwgJChldmVudC50YXJnZXQpLnBhcmVudHMoXCIuX3p0cmVlSW5wdXREaXZcIikubGVuZ3RoID4gMFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB8fCAkKCcubW9kYWwtb3ZlcmxheVtyb2xlPWRpYWxvZ10nKS5sZW5ndGggPiAoci5fZGlhbG9ncyB8fCAwKSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgci5vbkRlc3Ryb3koKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiDmoJHmtojlpLHvvIzlubbkuJTovpPlhaXmoYblj5jmiJDlj6ror7vvvIzlm57lhpnmlbDmja5cclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIG9uRGVzdHJveTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIF9zZWxmRGF0YSA9IHIuX2RhdGE7XHJcbiAgICAgICAgICAgICAgICB2YXIgX3RyZWUgPSAkLmZuLnpUcmVlLmdldFpUcmVlT2JqKF9zZWxmRGF0YS5fdHJlZUlkKTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgc2VsZXRlZElkcyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgdmFyIHNlbGV0ZWROYW1lcyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgdmFyIHBvb3JzdXBwb3J0ID0gW107XHJcbiAgICAgICAgICAgICAgICB2YXIgc2VsZXRlZFVuaXRzID0gW107ICAgIC8v5Yu+6YCJ6IqC54K55Y2V5L2NXHJcblxyXG4gICAgICAgICAgICAgICAgLy/ovpPlhaXmoYblpLHljrvnhKbngrnvvIwg5bm25LiU5Y+Y5Li65Y+q6K+7XHJcbiAgICAgICAgICAgICAgICAkdGhpcy5mb2N1c291dCgpLmF0dHIoJ3JlYWRvbmx5JywgJ3JlYWRvbmx5Jyk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy/lj5blvpfmoJHli77pgInnmoRpZCwg5bm25bCGaWTloavlhaXlvbHol4/ln5/vvIwgbmFtZeWhq+WFpei+k+WFpeahhlxyXG4gICAgICAgICAgICAgICAgaWYgKF90cmVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlbGVjdGVkTm9kZXMgPSBfdHJlZS5nZXROb2Rlc0J5RmlsdGVyKHIuc2VsZWN0ZWRUcmVlRGF0YUxldmVsKTtcclxuICAgICAgICAgICAgICAgICAgICAkLmVhY2goc2VsZWN0ZWROb2RlcywgZnVuY3Rpb24gKGksIG5vZGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZXRlZElkcy5wdXNoKG5vZGUuaWQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxldGVkTmFtZXMucHVzaChub2RlWyRjZmcudGV4dEZpbGVkXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGV0ZWRVbml0cy5wdXNoKG5vZGUudW5pdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChub2RlLnN1cHBvcnRQb29yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb29yc3VwcG9ydC5wdXNoKG5vZGUuc3VwcG9ydFBvb3IpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICR0aGlzLmF0dHIoJ3RyZWVTZWxJZCcsIHNlbGV0ZWRJZHMuam9pbignLCcpKS5hdHRyKCd0aXRsZScsIHNlbGV0ZWROYW1lcy5qb2luKCcsJykpO1xyXG4gICAgICAgICAgICAgICAgICAgICR0aGlzLmF0dHIoJ3VuaXQnLCBzZWxldGVkVW5pdHMuam9pbignLCcpKTsgLy/li77pgInoioLngrnljZXkvY1cclxuICAgICAgICAgICAgICAgICAgICBpZiAocG9vcnN1cHBvcnQubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkdGhpcy5hdHRyKCdwb29yc3VwcG9ydCcsIHBvb3JzdXBwb3J0LmpvaW4oJywnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHRoaXMuYXR0cigncG9vcnN1cHBvcnQnLCBcIlwiKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgJGNmZy4kaWQgJiYgJGNmZy4kaWQudmFsICYmICRjZmcuJGlkLnZhbChzZWxldGVkSWRzLmpvaW4oJywnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgJHRoaXMudmFsKHNlbGV0ZWROYW1lcy5qb2luKCcsJykpLmZvY3Vzb3V0KCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8v6ZSA5q+B5qCRXHJcbiAgICAgICAgICAgICAgICAgICAgX3RyZWUuZGVzdHJveSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8v5riF56m65qCR77yM6ZqQ6JePZGl2XHJcbiAgICAgICAgICAgICAgICB2YXIgc2VhRGl2ID0gJCgnIycgKyBfc2VsZkRhdGEuX3NlYXJjaERpdik7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2VhRGl2LmlzKCc6dmlzaWJsZScpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VhRGl2LmZhZGVJbigpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICQoXCJib2R5XCIpLnVuYmluZCgnbW91c2Vkb3duJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAkdGhpcy50cmlnZ2VyKCdjaGFuZ2UnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHJldHVybiByLmluaXQoKTtcclxuICAgIH07XHJcbn0pO1xyXG5cclxuIl0sImZpbGUiOiJwbHVnaW5zL2lucHV0VHJlZS9pZW1zSW5wdXRUcmVlLmpzIn0=
