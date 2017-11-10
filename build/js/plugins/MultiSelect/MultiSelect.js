define([
    'jquery',
    'zTree', 'zTree.excheck', 'zTree.exedit', 'zTree.exhide'
], function ($) {
    $.addMultiSelect = function (t, options) {
        var p = $.extend({
            popupID: '',
            zTreeID: '',
            width: 150,
            height: 150,
            selector: '',
            parent: $(t).parent(),
            refresh: false,
            param: {},
            wholeStation: 'ALL',
            setting: {
                check: {
                    enable: true,
                    chkboxType: {
                        "Y": "ps",
                        "N": "ps"
                    }
                },
                view: {
                    dblClickExpand: false,
                    showLine: false,
                    showIcon: false,
                    txtSelectedEnable: true
                },
                data: {
                    simpleData: {
                        enable: true
                    }
                },
                callback: {
                    beforeClick: beforeClick,
                    onCheck: onCheck
                }
            },
            wholeNode: {
                id: 'ALL',
                pId: 0,
                name: Msg.all
            },
            zNodes: [{
                id: 1,
                pId: 0,
                name: "地面式"
            }, {
                id: 2,
                pId: 0,
                name: "分布式"
            }]
        }, options);

        var r = {
            work: function () {
                r.init();
                if ($('body').find('#' + p.popupID).length > 0) {
                    return;
                }
                r.searchData();
                r.createPopup();
                p.zNodes.unshift(p.wholeNode);
                $.fn.zTree.init($("#" + p.zTreeID), p.setting, p.zNodes);
                $("#" + p.zTreeID).find(".switch").remove();
                r.initZTree();
            },
            init: function () {
                t.p = p;
                p.popupID = $(t).attr('id') + "Popup";
                p.zTreeID = $(t).attr('id') + "ZTree";
                p.selector = $(t).attr('id');
                p.width = parseInt($("#" + p.selector).css('width')) + 2;
            },
            searchData: function () {
            },
            createPopup: function () {
                var div = $("<div/>").attr('id', p.popupID).css({
                    'position': 'absolute',
                    'z-index': 1,
                    'background': '#ffffff'
                });
                var ul = $("<div/>").attr('id', p.zTreeID).addClass('ztree MultiSelect').css({
                    'overflow': 'auto',
                    'margin-top': '0',
                    'width': p.width,
                    'max-height': p.height,
                    'border': '1px solid #999'
                });
                $(p.parent).append(div);
                div.append(ul);
                r.showPopupMenu();
            },
            initZTree: function () {
                var sids = $("#" + p.selector).attr('value');
                if (sids) {
                    var treeObj = $.fn.zTree.getZTreeObj(p.zTreeID);
                    var nodes = treeObj.getNodes();
                    if (sids == 'ALL') {
                        for (var i = 1, l = nodes.length; i < l; i++) {
                            treeObj.checkNode(nodes[i], true, true, true);
                        }
                    } else {
                        var aSids = sids.split(',');
                        for (var i = 0, l = aSids.length; i < l; i++) {
                            var node = treeObj.getNodeByParam("id", aSids[i], null);
                            if (node)
                                treeObj.checkNode(node, true, true, true);
                        }
                    }
                }
            },
            beforeClick: function (treeId, treeNode) {
                var zTree = $.fn.zTree.getZTreeObj(p.zTreeID);

                zTree.checkNode(treeNode, !treeNode.checked, null, true);
                return false;
            },

            onCheck: function (e, treeId, treeNode) {
                var treeObj = $.fn.zTree.getZTreeObj(p.zTreeID);
                var nodes = treeObj.getNodes();
                var wholeLength = nodes.length;
                var textObj = $("#" + p.selector);
                if (treeNode.id == p.wholeStation) {
                    if (treeNode.checked) {
                        for (var i = 1, l = nodes.length; i < l; i++) {
                            treeObj.checkNode(nodes[i], true, true, false);
                        }
                        textObj.attr('value', 'ALL');
                    } else {
                        for (var i = 1, l = nodes.length; i < l; i++) {
                            treeObj.checkNode(nodes[i], false, true, false);
                        }
                        textObj.attr('value', '');
                    }
                    textObj.val('');

                } else {
                    if (!treeNode.checked) {
                        treeObj.checkNode(nodes[0], false, false, false);
                    }
                    nodes = treeObj.getCheckedNodes(true), v = "", sids = "";

                    for (var i = 0, l = nodes.length; i < l; i++) {
                        v += nodes[i].name + ",";
                        sids += nodes[i].id + ",";
                    }
                    if (nodes.length && wholeLength - 1 == nodes.length && sids.indexOf(p.wholeStation) < 0) {
                        treeObj.checkNode(treeObj.getNodes()[0], true, true, true);
                        return;
                    }
                    if (v.length > 0)
                        v = v.substring(0, v.length - 1);
                    if (sids.length > 0)
                        sids = sids.substring(0, sids.length - 1);
                    var textObj = $("#" + p.selector);
                    if (sids.indexOf(p.wholeStation) > -1) {
                        textObj.val(Msg.all);
                        // sids=sids.substring(p.wholeStation.length+1,sids.length);
                        sids = "";
                    } else {
                        textObj.val(v);
                    }
                    textObj.attr('value', sids);
                }
                if (p.refresh) {
                    p.refresh();
                }
            },

            showPopupMenu: function () {
                var textOffset = null;

                if (p.parent == 'body') {
                    textOffset = $("#" + p.selector).offset();
                } else {
                    textOffset = $("#" + p.selector).position();
                }
                var textObj = $("#" + p.selector);
                $("#" + p.popupID).css({
                    left: textOffset.left + "px",
                    top: textOffset.top + textObj.outerHeight() + "px"
                }).slideDown("fast");
                $("body").bind("mousedown", r.onDestroy);
            },
            hidePopupMenu: function () {
                $("#" + p.popupID).fadeOut("fast");
                $("#" + p.popupID).remove();
                $("body").unbind("mousedown", r.onDestroy);
            },
            onDestroy: function (event) {
                if (!(event.target.id == p.selector || event.target.id == p.zTreeID || event.target.id == p.popupID || $(event.target).parents(
                        '#' + p.zTreeID).length > 0)) {
                    r.hidePopupMenu();
                }
            }
        };

        function beforeClick(treeId, treeNode) {
            r.beforeClick(treeId, treeNode);
        }

        function onCheck(e, treeId, treeNode) {
            r.onCheck(e, treeId, treeNode);
        }

        $(document).ready(function () {
            r.work();
        });
        return true;
    };

    var docLoaded = false;
    $(document).ready(function () {
        docLoaded = true;
    });

    $.fn.MultiSelect = function (p) {
        return this.each(function () {
            if (!docLoaded) {
                $(this).hide();
                var t = this;
                $(document).ready(function () {
                    $.addMultiSelect(t, p);
                });
            } else {
                $.addMultiSelect(this, p);
            }
        });
    };

    return $;
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL011bHRpU2VsZWN0L011bHRpU2VsZWN0LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImRlZmluZShbXHJcbiAgICAnanF1ZXJ5JyxcclxuICAgICd6VHJlZScsICd6VHJlZS5leGNoZWNrJywgJ3pUcmVlLmV4ZWRpdCcsICd6VHJlZS5leGhpZGUnXHJcbl0sIGZ1bmN0aW9uICgkKSB7XHJcbiAgICAkLmFkZE11bHRpU2VsZWN0ID0gZnVuY3Rpb24gKHQsIG9wdGlvbnMpIHtcclxuICAgICAgICB2YXIgcCA9ICQuZXh0ZW5kKHtcclxuICAgICAgICAgICAgcG9wdXBJRDogJycsXHJcbiAgICAgICAgICAgIHpUcmVlSUQ6ICcnLFxyXG4gICAgICAgICAgICB3aWR0aDogMTUwLFxyXG4gICAgICAgICAgICBoZWlnaHQ6IDE1MCxcclxuICAgICAgICAgICAgc2VsZWN0b3I6ICcnLFxyXG4gICAgICAgICAgICBwYXJlbnQ6ICQodCkucGFyZW50KCksXHJcbiAgICAgICAgICAgIHJlZnJlc2g6IGZhbHNlLFxyXG4gICAgICAgICAgICBwYXJhbToge30sXHJcbiAgICAgICAgICAgIHdob2xlU3RhdGlvbjogJ0FMTCcsXHJcbiAgICAgICAgICAgIHNldHRpbmc6IHtcclxuICAgICAgICAgICAgICAgIGNoZWNrOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZW5hYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIGNoa2JveFR5cGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJZXCI6IFwicHNcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJOXCI6IFwicHNcIlxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB2aWV3OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGJsQ2xpY2tFeHBhbmQ6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIHNob3dMaW5lOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICBzaG93SWNvbjogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgdHh0U2VsZWN0ZWRFbmFibGU6IHRydWVcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2ltcGxlRGF0YToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmFibGU6IHRydWVcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2s6IHtcclxuICAgICAgICAgICAgICAgICAgICBiZWZvcmVDbGljazogYmVmb3JlQ2xpY2ssXHJcbiAgICAgICAgICAgICAgICAgICAgb25DaGVjazogb25DaGVja1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB3aG9sZU5vZGU6IHtcclxuICAgICAgICAgICAgICAgIGlkOiAnQUxMJyxcclxuICAgICAgICAgICAgICAgIHBJZDogMCxcclxuICAgICAgICAgICAgICAgIG5hbWU6IE1zZy5hbGxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgek5vZGVzOiBbe1xyXG4gICAgICAgICAgICAgICAgaWQ6IDEsXHJcbiAgICAgICAgICAgICAgICBwSWQ6IDAsXHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcIuWcsOmdouW8j1wiXHJcbiAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgIGlkOiAyLFxyXG4gICAgICAgICAgICAgICAgcElkOiAwLFxyXG4gICAgICAgICAgICAgICAgbmFtZTogXCLliIbluIPlvI9cIlxyXG4gICAgICAgICAgICB9XVxyXG4gICAgICAgIH0sIG9wdGlvbnMpO1xyXG5cclxuICAgICAgICB2YXIgciA9IHtcclxuICAgICAgICAgICAgd29yazogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgci5pbml0KCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoJCgnYm9keScpLmZpbmQoJyMnICsgcC5wb3B1cElEKS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgci5zZWFyY2hEYXRhKCk7XHJcbiAgICAgICAgICAgICAgICByLmNyZWF0ZVBvcHVwKCk7XHJcbiAgICAgICAgICAgICAgICBwLnpOb2Rlcy51bnNoaWZ0KHAud2hvbGVOb2RlKTtcclxuICAgICAgICAgICAgICAgICQuZm4uelRyZWUuaW5pdCgkKFwiI1wiICsgcC56VHJlZUlEKSwgcC5zZXR0aW5nLCBwLnpOb2Rlcyk7XHJcbiAgICAgICAgICAgICAgICAkKFwiI1wiICsgcC56VHJlZUlEKS5maW5kKFwiLnN3aXRjaFwiKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgIHIuaW5pdFpUcmVlKCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHQucCA9IHA7XHJcbiAgICAgICAgICAgICAgICBwLnBvcHVwSUQgPSAkKHQpLmF0dHIoJ2lkJykgKyBcIlBvcHVwXCI7XHJcbiAgICAgICAgICAgICAgICBwLnpUcmVlSUQgPSAkKHQpLmF0dHIoJ2lkJykgKyBcIlpUcmVlXCI7XHJcbiAgICAgICAgICAgICAgICBwLnNlbGVjdG9yID0gJCh0KS5hdHRyKCdpZCcpO1xyXG4gICAgICAgICAgICAgICAgcC53aWR0aCA9IHBhcnNlSW50KCQoXCIjXCIgKyBwLnNlbGVjdG9yKS5jc3MoJ3dpZHRoJykpICsgMjtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc2VhcmNoRGF0YTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBjcmVhdGVQb3B1cDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGRpdiA9ICQoXCI8ZGl2Lz5cIikuYXR0cignaWQnLCBwLnBvcHVwSUQpLmNzcyh7XHJcbiAgICAgICAgICAgICAgICAgICAgJ3Bvc2l0aW9uJzogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgICAgICAgICAnei1pbmRleCc6IDEsXHJcbiAgICAgICAgICAgICAgICAgICAgJ2JhY2tncm91bmQnOiAnI2ZmZmZmZidcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgdmFyIHVsID0gJChcIjxkaXYvPlwiKS5hdHRyKCdpZCcsIHAuelRyZWVJRCkuYWRkQ2xhc3MoJ3p0cmVlIE11bHRpU2VsZWN0JykuY3NzKHtcclxuICAgICAgICAgICAgICAgICAgICAnb3ZlcmZsb3cnOiAnYXV0bycsXHJcbiAgICAgICAgICAgICAgICAgICAgJ21hcmdpbi10b3AnOiAnMCcsXHJcbiAgICAgICAgICAgICAgICAgICAgJ3dpZHRoJzogcC53aWR0aCxcclxuICAgICAgICAgICAgICAgICAgICAnbWF4LWhlaWdodCc6IHAuaGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgICAgICdib3JkZXInOiAnMXB4IHNvbGlkICM5OTknXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICQocC5wYXJlbnQpLmFwcGVuZChkaXYpO1xyXG4gICAgICAgICAgICAgICAgZGl2LmFwcGVuZCh1bCk7XHJcbiAgICAgICAgICAgICAgICByLnNob3dQb3B1cE1lbnUoKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgaW5pdFpUcmVlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc2lkcyA9ICQoXCIjXCIgKyBwLnNlbGVjdG9yKS5hdHRyKCd2YWx1ZScpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHNpZHMpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdHJlZU9iaiA9ICQuZm4uelRyZWUuZ2V0WlRyZWVPYmoocC56VHJlZUlEKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbm9kZXMgPSB0cmVlT2JqLmdldE5vZGVzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNpZHMgPT0gJ0FMTCcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDEsIGwgPSBub2Rlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyZWVPYmouY2hlY2tOb2RlKG5vZGVzW2ldLCB0cnVlLCB0cnVlLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhU2lkcyA9IHNpZHMuc3BsaXQoJywnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBhU2lkcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBub2RlID0gdHJlZU9iai5nZXROb2RlQnlQYXJhbShcImlkXCIsIGFTaWRzW2ldLCBudWxsKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChub2RlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyZWVPYmouY2hlY2tOb2RlKG5vZGUsIHRydWUsIHRydWUsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBiZWZvcmVDbGljazogZnVuY3Rpb24gKHRyZWVJZCwgdHJlZU5vZGUpIHtcclxuICAgICAgICAgICAgICAgIHZhciB6VHJlZSA9ICQuZm4uelRyZWUuZ2V0WlRyZWVPYmoocC56VHJlZUlEKTtcclxuXHJcbiAgICAgICAgICAgICAgICB6VHJlZS5jaGVja05vZGUodHJlZU5vZGUsICF0cmVlTm9kZS5jaGVja2VkLCBudWxsLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIG9uQ2hlY2s6IGZ1bmN0aW9uIChlLCB0cmVlSWQsIHRyZWVOb2RlKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdHJlZU9iaiA9ICQuZm4uelRyZWUuZ2V0WlRyZWVPYmoocC56VHJlZUlEKTtcclxuICAgICAgICAgICAgICAgIHZhciBub2RlcyA9IHRyZWVPYmouZ2V0Tm9kZXMoKTtcclxuICAgICAgICAgICAgICAgIHZhciB3aG9sZUxlbmd0aCA9IG5vZGVzLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIHZhciB0ZXh0T2JqID0gJChcIiNcIiArIHAuc2VsZWN0b3IpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRyZWVOb2RlLmlkID09IHAud2hvbGVTdGF0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRyZWVOb2RlLmNoZWNrZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDEsIGwgPSBub2Rlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyZWVPYmouY2hlY2tOb2RlKG5vZGVzW2ldLCB0cnVlLCB0cnVlLCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dE9iai5hdHRyKCd2YWx1ZScsICdBTEwnKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMSwgbCA9IG5vZGVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJlZU9iai5jaGVja05vZGUobm9kZXNbaV0sIGZhbHNlLCB0cnVlLCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dE9iai5hdHRyKCd2YWx1ZScsICcnKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dE9iai52YWwoJycpO1xyXG5cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0cmVlTm9kZS5jaGVja2VkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyZWVPYmouY2hlY2tOb2RlKG5vZGVzWzBdLCBmYWxzZSwgZmFsc2UsIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgbm9kZXMgPSB0cmVlT2JqLmdldENoZWNrZWROb2Rlcyh0cnVlKSwgdiA9IFwiXCIsIHNpZHMgPSBcIlwiO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IG5vZGVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2ICs9IG5vZGVzW2ldLm5hbWUgKyBcIixcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2lkcyArPSBub2Rlc1tpXS5pZCArIFwiLFwiO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAobm9kZXMubGVuZ3RoICYmIHdob2xlTGVuZ3RoIC0gMSA9PSBub2Rlcy5sZW5ndGggJiYgc2lkcy5pbmRleE9mKHAud2hvbGVTdGF0aW9uKSA8IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHJlZU9iai5jaGVja05vZGUodHJlZU9iai5nZXROb2RlcygpWzBdLCB0cnVlLCB0cnVlLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodi5sZW5ndGggPiAwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2ID0gdi5zdWJzdHJpbmcoMCwgdi5sZW5ndGggLSAxKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2lkcy5sZW5ndGggPiAwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzaWRzID0gc2lkcy5zdWJzdHJpbmcoMCwgc2lkcy5sZW5ndGggLSAxKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdGV4dE9iaiA9ICQoXCIjXCIgKyBwLnNlbGVjdG9yKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2lkcy5pbmRleE9mKHAud2hvbGVTdGF0aW9uKSA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHRPYmoudmFsKE1zZy5hbGwpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzaWRzPXNpZHMuc3Vic3RyaW5nKHAud2hvbGVTdGF0aW9uLmxlbmd0aCsxLHNpZHMubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2lkcyA9IFwiXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dE9iai52YWwodik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRleHRPYmouYXR0cigndmFsdWUnLCBzaWRzKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChwLnJlZnJlc2gpIHtcclxuICAgICAgICAgICAgICAgICAgICBwLnJlZnJlc2goKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIHNob3dQb3B1cE1lbnU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHZhciB0ZXh0T2Zmc2V0ID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAocC5wYXJlbnQgPT0gJ2JvZHknKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dE9mZnNldCA9ICQoXCIjXCIgKyBwLnNlbGVjdG9yKS5vZmZzZXQoKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dE9mZnNldCA9ICQoXCIjXCIgKyBwLnNlbGVjdG9yKS5wb3NpdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdmFyIHRleHRPYmogPSAkKFwiI1wiICsgcC5zZWxlY3Rvcik7XHJcbiAgICAgICAgICAgICAgICAkKFwiI1wiICsgcC5wb3B1cElEKS5jc3Moe1xyXG4gICAgICAgICAgICAgICAgICAgIGxlZnQ6IHRleHRPZmZzZXQubGVmdCArIFwicHhcIixcclxuICAgICAgICAgICAgICAgICAgICB0b3A6IHRleHRPZmZzZXQudG9wICsgdGV4dE9iai5vdXRlckhlaWdodCgpICsgXCJweFwiXHJcbiAgICAgICAgICAgICAgICB9KS5zbGlkZURvd24oXCJmYXN0XCIpO1xyXG4gICAgICAgICAgICAgICAgJChcImJvZHlcIikuYmluZChcIm1vdXNlZG93blwiLCByLm9uRGVzdHJveSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGhpZGVQb3B1cE1lbnU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICQoXCIjXCIgKyBwLnBvcHVwSUQpLmZhZGVPdXQoXCJmYXN0XCIpO1xyXG4gICAgICAgICAgICAgICAgJChcIiNcIiArIHAucG9wdXBJRCkucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAkKFwiYm9keVwiKS51bmJpbmQoXCJtb3VzZWRvd25cIiwgci5vbkRlc3Ryb3kpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBvbkRlc3Ryb3k6IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCEoZXZlbnQudGFyZ2V0LmlkID09IHAuc2VsZWN0b3IgfHwgZXZlbnQudGFyZ2V0LmlkID09IHAuelRyZWVJRCB8fCBldmVudC50YXJnZXQuaWQgPT0gcC5wb3B1cElEIHx8ICQoZXZlbnQudGFyZ2V0KS5wYXJlbnRzKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAnIycgKyBwLnpUcmVlSUQpLmxlbmd0aCA+IDApKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgci5oaWRlUG9wdXBNZW51KCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBiZWZvcmVDbGljayh0cmVlSWQsIHRyZWVOb2RlKSB7XHJcbiAgICAgICAgICAgIHIuYmVmb3JlQ2xpY2sodHJlZUlkLCB0cmVlTm9kZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBvbkNoZWNrKGUsIHRyZWVJZCwgdHJlZU5vZGUpIHtcclxuICAgICAgICAgICAgci5vbkNoZWNrKGUsIHRyZWVJZCwgdHJlZU5vZGUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByLndvcmsoKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH07XHJcblxyXG4gICAgdmFyIGRvY0xvYWRlZCA9IGZhbHNlO1xyXG4gICAgJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGRvY0xvYWRlZCA9IHRydWU7XHJcbiAgICB9KTtcclxuXHJcbiAgICAkLmZuLk11bHRpU2VsZWN0ID0gZnVuY3Rpb24gKHApIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKCFkb2NMb2FkZWQpIHtcclxuICAgICAgICAgICAgICAgICQodGhpcykuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHQgPSB0aGlzO1xyXG4gICAgICAgICAgICAgICAgJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICQuYWRkTXVsdGlTZWxlY3QodCwgcCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICQuYWRkTXVsdGlTZWxlY3QodGhpcywgcCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuICQ7XHJcbn0pO1xyXG4iXSwiZmlsZSI6InBsdWdpbnMvTXVsdGlTZWxlY3QvTXVsdGlTZWxlY3QuanMifQ==
