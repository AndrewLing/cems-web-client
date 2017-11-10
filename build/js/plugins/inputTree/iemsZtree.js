/**
 * 树的扩展
 * @author PY02039
 */
define(['jquery', 'zTree', 'zTree.excheck', 'zTree.exedit', 'zTree.exhide'], function ($) {

    if ($.fn.iemsZtree) {
        return $;
    }

    var scrollTop = -1; // 记录当前滚动条的高度
    $('#main_view').mousemove(function () {
        if (!$('._ztreeInputDiv').get(0) || $('._ztreeInputDiv').is(':hidden')) {
            scrollTop = $(this).scrollTop();
        }
    });
    $('#main_view').scroll(function () {
        if (scrollTop != -1 && $('._ztreeInputDiv').is(':visible')) {
            $(this).scrollTop(scrollTop);
        }
    });
    $(window).resize(function () {
        $('._ztreeInputDiv').hide();
    });

    $.fn.iemsZtree = function (zOption, _p) {
        var $this = $(this);

        //参数配置
        var $cfg = $.extend({
            url: '',
            param: {},
            treeSearch: true, //树的搜索
            treeSearchInput: false, //可配置的树的搜索框
            searchDataLevel: false, //可搜索的的层数
            treeSearchClass: '_epmsTreeSearch', //搜索tree的class
            treeNodeCreate: false, //渲染每个树节点时的回调
            treeDataLoadFiled: false, //ztree 数据加载失败调用
            //treeLoadBefore : false, //ztree 加载前执行的回调, 暂无扩展
            treeNodeFormat: false, //调整node格式回调函数
            treeLoadAfter: false //ztree 加载之后执行的回调
        }, _p);

        //树的参数
        var $zOption = $.extend({
            view: {
                selectedMulti: true
            }
        }, zOption);

        //内部操作对象
        var r = {

            //树的初始化
            createView: function () {
                $this.empty();
                $this.append("<div class='_iemsZtreeLoading'>" + Msg.loading + "</div>"); //数据加载中
                var zTreeObj = null;

                var _param = $.extend(true, {}, $cfg.param); //深拷贝参数对象，避免原对象被污染

                $.http.ajax($cfg.url, _param, function (data) {
                    var ro = data;
                    if (ro.success) {
                        var zNodes = ro.data;
                        if (zNodes && zNodes.length > 0) {
                            if ($.isFunction($cfg.treeNodeFormat)) {
                                zNodes = $cfg.treeNodeFormat(zNodes);
                            }
                            if ($.isFunction($cfg.treeNodeCreate)) {
                                for (var i = 0; i < zNodes.length; i++) {
                                    $cfg.treeNodeCreate(zNodes[i]);
                                }
                            }
                            //初始化ztree
                            zTreeObj = $.fn.zTree.init($this, $zOption, zNodes);
                        }
                        $('._iemsZtreeLoading', $this).remove();

                        //加入搜索
                        if ($cfg.treeSearch) {
                            r.addSearchText(zTreeObj);
                        }

                        //如果配置了后处理函数
                        if (zTreeObj && $.isFunction($cfg.treeLoadAfter)) {
                            $cfg.treeLoadAfter(zTreeObj);
                        }

                    } else {
                        if ($.isFunction($cfg.treeDataLoadFiled)) {
                            $cfg.treeDataLoadFiled();
                        } else {
                            $('._iemsZtreeLoading', $this).remove();
                            $this.html("<div style='color:red;'>" + Msg.loadDataFaild + "</div>"); //数据加载失败
                        }
                    }
                });

                return zTreeObj;
            },

            //树的搜索 - 回调函数： 筛选最后一层的ztree节点
            filterLastSecond: function (node) {
                if ($cfg.searchDataLevel && $.isNumeric($cfg.searchDataLevel)) {
                    return node.level == $cfg.searchDataLevel;
                } else {
                    return !node.isParent;
                }
            },

            /**
             */
            SearchResult: function (node) {
                if ($cfg.searchDataLevel && $.isNumeric($cfg.searchDataLevel)) {
                    return node.level == $cfg.searchDataLevel && node.checked;
                } else {
                    return !node.isParent && node.checked;
                }
            },

            addSearchText: function (zTreeObj) {
                //显示搜索
                var searchInput;
                if ($cfg.treeSearchInput) {
                    searchInput = $($cfg.treeSearchInput);
                } else {
                    $('.' + $cfg.treeSearchClass, $this.parent()).remove();//先干掉已经存在的
                    searchInput = $('<input type="text" class="' + $cfg.treeSearchClass + '" />');
                    searchInput.attr('placeholder', Msg.inputTheKey); //请输入关键字
                    searchInput.placeholderSupport();
                    $this.before(searchInput);
                }

                //添加回调
                searchInput.unbind('input propertychange').bind('input propertychange', function () {
                //searchInput.unbind('input keydown').bind('input keydown', function () {
                    var self = $(this);

                    var updateNodes = function (nodeList) {
                        var dfd = $.Deferred();

                        var process = function (nodes) {
                            var l = nodes.length;
                            for (var i = 0; i < l; i++) {
                                var node = nodes[i];
                                var f = false;
                                for (var j = 0, t = nodeList.length; j < t; j++) {
                                    if (node.isParent || node.tId == nodeList[j].tId) {
                                        f = true;
                                        break;
                                    }
                                }
                                if (f) {
                                    zTreeObj.expandNode(node.getParentNode(), true, false);
                                    zTreeObj.showNode(node);
                                } else {
                                    zTreeObj.hideNode(node);
                                }
                            }
                            zTreeObj.refresh();
                        };

                        var nodes = zTreeObj.getNodesByFilter(r.filterLastSecond);
                        var l = nodes.length;
                        if (l > 2000) {
                            setTimeout(function () {
                                process(nodes);
                                dfd.resolve();
                            }, 2000);
                        }
                        else {
                            process(nodes);
                            dfd.resolve();
                        }

                        return dfd.promise();
                    };

                    var nodeList = [];
                    var value = self.val().trim();
                    if (value != "" && value != " ") {
                        nodeList = zTreeObj.getNodesByParamFuzzy($zOption.data.key.name || "name", value, false);
                    } else {
                        nodeList = zTreeObj.getNodesByFilter(function (node) {
                            return !node.isParent;
                        });
                    }

                    $.when(updateNodes(nodeList || []))
                        .always(function () {
                            //重新勾选勾中节点的父节点
                            var SearchResultNode = zTreeObj.getNodesByFilter(r.SearchResult);
                            SearchResultNode &&
                            $.each(SearchResultNode, function (i, node) {
                                zTreeObj.checkNode(node, true, true);  //第一个参数是：要勾选的节点，第二个参数是否勾选，  第三个参数是否勾选关联父节点
                            });
                        });
                });
            }
        };

        return r.createView();
    };
    return $;
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL2lucHV0VHJlZS9pZW1zWnRyZWUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIOagkeeahOaJqeWxlVxyXG4gKiBAYXV0aG9yIFBZMDIwMzlcclxuICovXHJcbmRlZmluZShbJ2pxdWVyeScsICd6VHJlZScsICd6VHJlZS5leGNoZWNrJywgJ3pUcmVlLmV4ZWRpdCcsICd6VHJlZS5leGhpZGUnXSwgZnVuY3Rpb24gKCQpIHtcclxuXHJcbiAgICBpZiAoJC5mbi5pZW1zWnRyZWUpIHtcclxuICAgICAgICByZXR1cm4gJDtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgc2Nyb2xsVG9wID0gLTE7IC8vIOiusOW9leW9k+WJjea7muWKqOadoeeahOmrmOW6plxyXG4gICAgJCgnI21haW5fdmlldycpLm1vdXNlbW92ZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKCEkKCcuX3p0cmVlSW5wdXREaXYnKS5nZXQoMCkgfHwgJCgnLl96dHJlZUlucHV0RGl2JykuaXMoJzpoaWRkZW4nKSkge1xyXG4gICAgICAgICAgICBzY3JvbGxUb3AgPSAkKHRoaXMpLnNjcm9sbFRvcCgpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgJCgnI21haW5fdmlldycpLnNjcm9sbChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKHNjcm9sbFRvcCAhPSAtMSAmJiAkKCcuX3p0cmVlSW5wdXREaXYnKS5pcygnOnZpc2libGUnKSkge1xyXG4gICAgICAgICAgICAkKHRoaXMpLnNjcm9sbFRvcChzY3JvbGxUb3ApO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgJCh3aW5kb3cpLnJlc2l6ZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJCgnLl96dHJlZUlucHV0RGl2JykuaGlkZSgpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgJC5mbi5pZW1zWnRyZWUgPSBmdW5jdGlvbiAoek9wdGlvbiwgX3ApIHtcclxuICAgICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpO1xyXG5cclxuICAgICAgICAvL+WPguaVsOmFjee9rlxyXG4gICAgICAgIHZhciAkY2ZnID0gJC5leHRlbmQoe1xyXG4gICAgICAgICAgICB1cmw6ICcnLFxyXG4gICAgICAgICAgICBwYXJhbToge30sXHJcbiAgICAgICAgICAgIHRyZWVTZWFyY2g6IHRydWUsIC8v5qCR55qE5pCc57SiXHJcbiAgICAgICAgICAgIHRyZWVTZWFyY2hJbnB1dDogZmFsc2UsIC8v5Y+v6YWN572u55qE5qCR55qE5pCc57Si5qGGXHJcbiAgICAgICAgICAgIHNlYXJjaERhdGFMZXZlbDogZmFsc2UsIC8v5Y+v5pCc57Si55qE55qE5bGC5pWwXHJcbiAgICAgICAgICAgIHRyZWVTZWFyY2hDbGFzczogJ19lcG1zVHJlZVNlYXJjaCcsIC8v5pCc57SidHJlZeeahGNsYXNzXHJcbiAgICAgICAgICAgIHRyZWVOb2RlQ3JlYXRlOiBmYWxzZSwgLy/muLLmn5Pmr4/kuKrmoJHoioLngrnml7bnmoTlm57osINcclxuICAgICAgICAgICAgdHJlZURhdGFMb2FkRmlsZWQ6IGZhbHNlLCAvL3p0cmVlIOaVsOaNruWKoOi9veWksei0peiwg+eUqFxyXG4gICAgICAgICAgICAvL3RyZWVMb2FkQmVmb3JlIDogZmFsc2UsIC8venRyZWUg5Yqg6L295YmN5omn6KGM55qE5Zue6LCDLCDmmoLml6DmianlsZVcclxuICAgICAgICAgICAgdHJlZU5vZGVGb3JtYXQ6IGZhbHNlLCAvL+iwg+aVtG5vZGXmoLzlvI/lm57osIPlh73mlbBcclxuICAgICAgICAgICAgdHJlZUxvYWRBZnRlcjogZmFsc2UgLy96dHJlZSDliqDovb3kuYvlkI7miafooYznmoTlm57osINcclxuICAgICAgICB9LCBfcCk7XHJcblxyXG4gICAgICAgIC8v5qCR55qE5Y+C5pWwXHJcbiAgICAgICAgdmFyICR6T3B0aW9uID0gJC5leHRlbmQoe1xyXG4gICAgICAgICAgICB2aWV3OiB7XHJcbiAgICAgICAgICAgICAgICBzZWxlY3RlZE11bHRpOiB0cnVlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LCB6T3B0aW9uKTtcclxuXHJcbiAgICAgICAgLy/lhoXpg6jmk43kvZzlr7nosaFcclxuICAgICAgICB2YXIgciA9IHtcclxuXHJcbiAgICAgICAgICAgIC8v5qCR55qE5Yid5aeL5YyWXHJcbiAgICAgICAgICAgIGNyZWF0ZVZpZXc6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICR0aGlzLmVtcHR5KCk7XHJcbiAgICAgICAgICAgICAgICAkdGhpcy5hcHBlbmQoXCI8ZGl2IGNsYXNzPSdfaWVtc1p0cmVlTG9hZGluZyc+XCIgKyBNc2cubG9hZGluZyArIFwiPC9kaXY+XCIpOyAvL+aVsOaNruWKoOi9veS4rVxyXG4gICAgICAgICAgICAgICAgdmFyIHpUcmVlT2JqID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgX3BhcmFtID0gJC5leHRlbmQodHJ1ZSwge30sICRjZmcucGFyYW0pOyAvL+a3seaLt+i0neWPguaVsOWvueixoe+8jOmBv+WFjeWOn+Wvueixoeiiq+axoeafk1xyXG5cclxuICAgICAgICAgICAgICAgICQuaHR0cC5hamF4KCRjZmcudXJsLCBfcGFyYW0sIGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJvID0gZGF0YTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocm8uc3VjY2Vzcykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgek5vZGVzID0gcm8uZGF0YTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHpOb2RlcyAmJiB6Tm9kZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCQuaXNGdW5jdGlvbigkY2ZnLnRyZWVOb2RlRm9ybWF0KSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHpOb2RlcyA9ICRjZmcudHJlZU5vZGVGb3JtYXQoek5vZGVzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkLmlzRnVuY3Rpb24oJGNmZy50cmVlTm9kZUNyZWF0ZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHpOb2Rlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkY2ZnLnRyZWVOb2RlQ3JlYXRlKHpOb2Rlc1tpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy/liJ3lp4vljJZ6dHJlZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgelRyZWVPYmogPSAkLmZuLnpUcmVlLmluaXQoJHRoaXMsICR6T3B0aW9uLCB6Tm9kZXMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQoJy5faWVtc1p0cmVlTG9hZGluZycsICR0aGlzKS5yZW1vdmUoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8v5Yqg5YWl5pCc57SiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkY2ZnLnRyZWVTZWFyY2gpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHIuYWRkU2VhcmNoVGV4dCh6VHJlZU9iaik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8v5aaC5p6c6YWN572u5LqG5ZCO5aSE55CG5Ye95pWwXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh6VHJlZU9iaiAmJiAkLmlzRnVuY3Rpb24oJGNmZy50cmVlTG9hZEFmdGVyKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJGNmZy50cmVlTG9hZEFmdGVyKHpUcmVlT2JqKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJC5pc0Z1bmN0aW9uKCRjZmcudHJlZURhdGFMb2FkRmlsZWQpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkY2ZnLnRyZWVEYXRhTG9hZEZpbGVkKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKCcuX2llbXNadHJlZUxvYWRpbmcnLCAkdGhpcykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdGhpcy5odG1sKFwiPGRpdiBzdHlsZT0nY29sb3I6cmVkOyc+XCIgKyBNc2cubG9hZERhdGFGYWlsZCArIFwiPC9kaXY+XCIpOyAvL+aVsOaNruWKoOi9veWksei0pVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHpUcmVlT2JqO1xyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgLy/moJHnmoTmkJzntKIgLSDlm57osIPlh73mlbDvvJog562b6YCJ5pyA5ZCO5LiA5bGC55qEenRyZWXoioLngrlcclxuICAgICAgICAgICAgZmlsdGVyTGFzdFNlY29uZDogZnVuY3Rpb24gKG5vZGUpIHtcclxuICAgICAgICAgICAgICAgIGlmICgkY2ZnLnNlYXJjaERhdGFMZXZlbCAmJiAkLmlzTnVtZXJpYygkY2ZnLnNlYXJjaERhdGFMZXZlbCkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbm9kZS5sZXZlbCA9PSAkY2ZnLnNlYXJjaERhdGFMZXZlbDtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICFub2RlLmlzUGFyZW50O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBTZWFyY2hSZXN1bHQ6IGZ1bmN0aW9uIChub2RlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoJGNmZy5zZWFyY2hEYXRhTGV2ZWwgJiYgJC5pc051bWVyaWMoJGNmZy5zZWFyY2hEYXRhTGV2ZWwpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5vZGUubGV2ZWwgPT0gJGNmZy5zZWFyY2hEYXRhTGV2ZWwgJiYgbm9kZS5jaGVja2VkO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gIW5vZGUuaXNQYXJlbnQgJiYgbm9kZS5jaGVja2VkO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgYWRkU2VhcmNoVGV4dDogZnVuY3Rpb24gKHpUcmVlT2JqKSB7XHJcbiAgICAgICAgICAgICAgICAvL+aYvuekuuaQnOe0olxyXG4gICAgICAgICAgICAgICAgdmFyIHNlYXJjaElucHV0O1xyXG4gICAgICAgICAgICAgICAgaWYgKCRjZmcudHJlZVNlYXJjaElucHV0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VhcmNoSW5wdXQgPSAkKCRjZmcudHJlZVNlYXJjaElucHV0KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnLicgKyAkY2ZnLnRyZWVTZWFyY2hDbGFzcywgJHRoaXMucGFyZW50KCkpLnJlbW92ZSgpOy8v5YWI5bmy5o6J5bey57uP5a2Y5Zyo55qEXHJcbiAgICAgICAgICAgICAgICAgICAgc2VhcmNoSW5wdXQgPSAkKCc8aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cIicgKyAkY2ZnLnRyZWVTZWFyY2hDbGFzcyArICdcIiAvPicpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNlYXJjaElucHV0LmF0dHIoJ3BsYWNlaG9sZGVyJywgTXNnLmlucHV0VGhlS2V5KTsgLy/or7fovpPlhaXlhbPplK7lrZdcclxuICAgICAgICAgICAgICAgICAgICBzZWFyY2hJbnB1dC5wbGFjZWhvbGRlclN1cHBvcnQoKTtcclxuICAgICAgICAgICAgICAgICAgICAkdGhpcy5iZWZvcmUoc2VhcmNoSW5wdXQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8v5re75Yqg5Zue6LCDXHJcbiAgICAgICAgICAgICAgICBzZWFyY2hJbnB1dC51bmJpbmQoJ2lucHV0IHByb3BlcnR5Y2hhbmdlJykuYmluZCgnaW5wdXQgcHJvcGVydHljaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAvL3NlYXJjaElucHV0LnVuYmluZCgnaW5wdXQga2V5ZG93bicpLmJpbmQoJ2lucHV0IGtleWRvd24nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlbGYgPSAkKHRoaXMpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgdXBkYXRlTm9kZXMgPSBmdW5jdGlvbiAobm9kZUxpc3QpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRmZCA9ICQuRGVmZXJyZWQoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcm9jZXNzID0gZnVuY3Rpb24gKG5vZGVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbCA9IG5vZGVzLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5vZGUgPSBub2Rlc1tpXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZiA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwLCB0ID0gbm9kZUxpc3QubGVuZ3RoOyBqIDwgdDsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChub2RlLmlzUGFyZW50IHx8IG5vZGUudElkID09IG5vZGVMaXN0W2pdLnRJZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZiA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB6VHJlZU9iai5leHBhbmROb2RlKG5vZGUuZ2V0UGFyZW50Tm9kZSgpLCB0cnVlLCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHpUcmVlT2JqLnNob3dOb2RlKG5vZGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHpUcmVlT2JqLmhpZGVOb2RlKG5vZGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHpUcmVlT2JqLnJlZnJlc2goKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBub2RlcyA9IHpUcmVlT2JqLmdldE5vZGVzQnlGaWx0ZXIoci5maWx0ZXJMYXN0U2Vjb25kKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGwgPSBub2Rlcy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsID4gMjAwMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcyhub2Rlcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGZkLnJlc29sdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIDIwMDApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcyhub2Rlcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZmQucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGZkLnByb21pc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgbm9kZUxpc3QgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBzZWxmLnZhbCgpLnRyaW0oKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgIT0gXCJcIiAmJiB2YWx1ZSAhPSBcIiBcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlTGlzdCA9IHpUcmVlT2JqLmdldE5vZGVzQnlQYXJhbUZ1enp5KCR6T3B0aW9uLmRhdGEua2V5Lm5hbWUgfHwgXCJuYW1lXCIsIHZhbHVlLCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUxpc3QgPSB6VHJlZU9iai5nZXROb2Rlc0J5RmlsdGVyKGZ1bmN0aW9uIChub2RlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gIW5vZGUuaXNQYXJlbnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgJC53aGVuKHVwZGF0ZU5vZGVzKG5vZGVMaXN0IHx8IFtdKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmFsd2F5cyhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL+mHjeaWsOWLvumAieWLvuS4reiKgueCueeahOeItuiKgueCuVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIFNlYXJjaFJlc3VsdE5vZGUgPSB6VHJlZU9iai5nZXROb2Rlc0J5RmlsdGVyKHIuU2VhcmNoUmVzdWx0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFNlYXJjaFJlc3VsdE5vZGUgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaChTZWFyY2hSZXN1bHROb2RlLCBmdW5jdGlvbiAoaSwgbm9kZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHpUcmVlT2JqLmNoZWNrTm9kZShub2RlLCB0cnVlLCB0cnVlKTsgIC8v56ys5LiA5Liq5Y+C5pWw5piv77ya6KaB5Yu+6YCJ55qE6IqC54K577yM56ys5LqM5Liq5Y+C5pWw5piv5ZCm5Yu+6YCJ77yMICDnrKzkuInkuKrlj4LmlbDmmK/lkKbli77pgInlhbPogZTniLboioLngrlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHIuY3JlYXRlVmlldygpO1xyXG4gICAgfTtcclxuICAgIHJldHVybiAkO1xyXG59KTtcclxuIl0sImZpbGUiOiJwbHVnaW5zL2lucHV0VHJlZS9pZW1zWnRyZWUuanMifQ==
