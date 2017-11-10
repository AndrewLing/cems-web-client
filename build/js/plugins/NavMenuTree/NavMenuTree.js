(function (factory) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        define(['jquery', 'main/main', 'css!plugins/NavMenuTree/NavMenuTree.css'], factory);
    } else {
        factory(jQuery, window.main);
    }
}(function ($, main) {

    $.addNavMenu = function (t, op) {
        var p = $.extend({
            basePath: "/js/plugins/NavMenuTree",
            context: '#main_view',
            home: {
            	childs: [],
                id: 'home',
                leaf: true,
                level: '1',
                name: null,
                qtip: '0',
                text: 'Msg.modules.main.menu.home',
                type: null
            },//首页数据内容
            lineHeight: 60,	        // 单行高度
            isFirstShow: true,      // 是否默认选中第一个菜单项
            data: [],				// menu数据
            openBefore: null,
            open: null,
            openAfter: null
        }, op);

        var g = {

            /**
             * 入口方法
             */
            work: function () {
                g.init();
                g.createBody();
                g.createSubBody();
                g.addData();
                g.initEvent();
            },

            init: function () {
                p.selector = $(t).attr('id');
                p.bodyID = p.selector + 'NavMenuBody';
                p.subID = p.selector + 'SubNavMenuBody';

                if (p.data[0] && p.data[0].id != "home") {
                    p.home && p.data.unshift(p.home);
                }
                if (!p.data.length) {
                    p.home && p.data.unshift(p.home);
                }
            },

            createBody: function () {
                var whole = $('<div/>').attr('id', p.selector).addClass("nav-tree");
                $(t).before(whole);
                $(t).remove();
                t = whole;
                $('#' + p.selector).append('<ul/>');
            },

            createSubBody: function () {
                var subNav = $('<div/>').attr('id', p.subID).addClass('SubNav-Menu');
                $('#' + p.subID).remove();
                $(p.context).append(subNav);
            },

            addData: function () {
                if (!p.data || !(p.data instanceof Array)) {
                    return;
                }
                $('ul', $(t)).empty();

                g.addBodyData(p.data);
            },

            /**
             * 添加一级菜单内容数据
             */
            addBodyData: function (data) {
                var menuIconsPath = p.basePath + "/icons/";
                $.each(data, function (i) {
                    var name = this.id;

                    var item = $('<li/>').attr('index', i).addClass('nav-tree-item')
                        .attr('name', name).attr('parent', this.qtip);
                    name == 'home' && item.addClass('selected');

                    var content = $('<div/>').addClass('nav-content').attr('title', main.eval(this.text));

                    var icon = $('<div/>').addClass('nav-icon');
                    icon.css({'background-image': 'url(' + menuIconsPath + name + '.png)'});

                    var font = $('<div class="font nav-font ellipsis"></div>').text(main.eval(this.text));

                    content.append(icon);
                    content.append(font);
                    item.append(content);
                    $('ul', $(t)).append(item);
                   // (this.leaf || this.leaf == 'true') && 
                    if ((this.childs && this.childs.length)) {
                        content.append($('<div/>').addClass('nav-rcbg-sco'));
                        g.addSubBodyData(item, name, this.childs);
                    }
                });
            },

            /**
             * 创建二级菜单
             */
            addSubBodyData: function (dom, name, data) {
                var div = $('<div class="con-rcbg-nav" id="' + p.subID + '-' + name + '"/>')
                    //.css({width: p.subWidth})
                    .attr('parent', $(dom).attr('parent') + ',' + name);
                $('#' + p.subID).append(div);

                var offset = $(dom).offset();
                var left = offset.left + $(dom).width();
                var top = offset.top;
                div.css({left: left, top: top, position: 'absolute', 'z-index': '999', display: 'none'});

                var subUl = $('<ul/>').appendTo(div).end();
                $.each(data, function (i) {
                    var item = $('<li/>').attr('index', i).attr('name', this.id).attr('parent', div.attr('parent'))
                        .css({"padding-right": "15px"});
                    var text = $('<div/>').html(main.eval(this.text)).css({'margin-left': '15px'});
                    item.append(text);
                    subUl.append(item);
                });
            },

            /**
             * 初始化事件响应函数
             */
            initEvent: function () {
                // 一级菜单事件
                $('.nav-tree-item', $(t)).unbind('mouseover, mouseout, click')
                    .mouseover(function (ev) {
                        g.navMenuOver(ev, this);
                    }).mouseout(function (ev) {
                        g.navMenuOut(ev, this);
                    }).click(function (ev) {
                        g.navMenuClick(ev, this);
                    });

                // 二级菜单事件
                $(p.context).undelegate('.rcbg').delegate('.con-rcbg-nav', 'mouseover.rcbg', function (ev) {
                    var parents = $(this).attr('parent').split(',');
                    var parent = parents[parents.length - 1];
                    var dom = $('.nav-tree-item[name=' + parent + ']', $(t));
                    g.navMenuOver(ev, dom);

                }).delegate('.con-rcbg-nav', 'mouseout.rcbg', function (ev) {
                    var parents = $(this).attr('parent').split(',');
                    var parent = parents[parents.length - 1];
                    var dom = $('.nav-tree-item[name=' + parent + ']', $(t)).get();
                    g.navMenuOut(ev, dom);

                }).delegate('.con-rcbg-nav li', 'click.rcbg', function (ev) {
                    var parents = $(this).attr('parent').split(',');
                    var parent = parents[parents.length - 1];
                    var name = $(this).attr('name');
                    var text = $(this).text();
                    var dom = $('.nav-tree-item[name=' + parent + ']', $(t)).get();
                    g.navMenuClick(ev, dom);
                    p.openBefore && p.openBefore instanceof Function && p.openBefore(name, text);
//                    if (!(p.openBefore && p.openBefore instanceof Function && p.openBefore(name, text))) {
//                        return;
//                    }
                    p.open && p.open instanceof Function && p.open(name, text);
                    p.openAfter && p.openAfter instanceof Function && p.openAfter(name, text);
                });

                if (p.isFirstShow) {
                    $('.nav-tree-item', $(t)).eq(0).click();
                }
            },

            /**
             * 显示子菜单
             * @param ev
             * @param dom
             */
            navMenuOver: function (ev, dom) {
                // 移除右侧主要区域焦点
                $('.right-con :focus').blur();
                var name = $(dom).attr('name');
                var offset = $(dom).offset();
                //padding margin也算在宽度内
                var left = offset.left + $(dom).outerWidth();
                var top = offset.top;
                top = top + $('#main_view').scrollTop();
                if ($('#' + p.subID + '-' + name).height() + top > (document.documentElement.clientHeight)) {
                    top = document.documentElement.clientHeight - $('#' + p.subID + '-' + name).height();
                }
                $('#' + p.subID + '-' + name).css({left: left, 'top': top < 0 ? 0 : top}).show();
                $(dom).siblings().removeClass('hover').end().addClass('hover');
            },

            /**
             * 隐藏子菜单
             * @param ev
             * @param dom
             */
            navMenuOut: function (ev, dom) {
                var name = $(dom).attr('name');
                if ($(p.context).find('#' + p.subID + '-' + name).length) {
                    $('#' + p.subID + '-' + name).hide();
                }
                $(dom).removeClass('hover');
            },

            /**
             * 点击一级菜单
             * @param ev
             * @param dom
             */
            navMenuClick: function (ev, dom) {
                var name = $(dom).attr('name');
                var text = $(dom).text();
                var index = $(dom).attr('index');
                if ($('.nav-rcbg-sco', $(dom)).length == 0) {
                    if (p.openBefore && p.openBefore instanceof Function) {
                        if (!(p.openBefore(name, text))) {
                            return;
                        }
                    }
                    p.open && p.open instanceof Function && p.open(name, text);
                    p.openAfter && p.openAfter instanceof Function && p.openAfter(name, text);
                }
                $(dom).siblings().removeClass('selected').end().addClass('selected');
            }
        };

        g.work();
    };

    var docLoaded = false;
    $(document).ready(function () {
        docLoaded = true;
    });

    $.fn.NavMenuTree = function (p) {
        return this.each(function () {
            if (!docLoaded) {
                $(this).hide();
                var t = this;
                $(document).ready(function () {
                    $.addNavMenu(t, p);
                });
            } else {
                $.addNavMenu(this, p);
            }
        });
    };

    /**
     * 使指定菜单项处于选中状态
     * @param name
     * @returns {*}
     * @constructor
     */
    $.fn.NavMenuTreeSelected = function (name) {
        return this.each(function () {
            var item = $('li[name=' + name + ']', $(this));
            if (!(item && item.length)) {
                var subItem = $('.con-rcbg-nav').find('[name=' + name + ']');
                if (subItem && subItem.length) {
                    var parents = subItem.attr('parent').split(',');
                    var parent = parents[parents.length - 1];
                    item = $('li[name=' + parent + ']', $(this));
                } else return false;
            }
            if (item && item.length) {
                item.siblings().removeClass('selected').end().addClass('selected');
                $('.container-main').animate({
                    scrollTop: (item.position().top - 70)
                }, 250);
            }
        });
    };

}));
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL05hdk1lbnVUcmVlL05hdk1lbnVUcmVlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiAoZmFjdG9yeSkge1xyXG4gICAgXCJ1c2Ugc3RyaWN0XCI7XHJcbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XHJcbiAgICAgICAgZGVmaW5lKFsnanF1ZXJ5JywgJ21haW4vbWFpbicsICdjc3MhcGx1Z2lucy9OYXZNZW51VHJlZS9OYXZNZW51VHJlZS5jc3MnXSwgZmFjdG9yeSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGZhY3RvcnkoalF1ZXJ5LCB3aW5kb3cubWFpbik7XHJcbiAgICB9XHJcbn0oZnVuY3Rpb24gKCQsIG1haW4pIHtcclxuXHJcbiAgICAkLmFkZE5hdk1lbnUgPSBmdW5jdGlvbiAodCwgb3ApIHtcclxuICAgICAgICB2YXIgcCA9ICQuZXh0ZW5kKHtcclxuICAgICAgICAgICAgYmFzZVBhdGg6IFwiL2pzL3BsdWdpbnMvTmF2TWVudVRyZWVcIixcclxuICAgICAgICAgICAgY29udGV4dDogJyNtYWluX3ZpZXcnLFxyXG4gICAgICAgICAgICBob21lOiB7XHJcbiAgICAgICAgICAgIFx0Y2hpbGRzOiBbXSxcclxuICAgICAgICAgICAgICAgIGlkOiAnaG9tZScsXHJcbiAgICAgICAgICAgICAgICBsZWFmOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgbGV2ZWw6ICcxJyxcclxuICAgICAgICAgICAgICAgIG5hbWU6IG51bGwsXHJcbiAgICAgICAgICAgICAgICBxdGlwOiAnMCcsXHJcbiAgICAgICAgICAgICAgICB0ZXh0OiAnTXNnLm1vZHVsZXMubWFpbi5tZW51LmhvbWUnLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogbnVsbFxyXG4gICAgICAgICAgICB9LC8v6aaW6aG15pWw5o2u5YaF5a65XHJcbiAgICAgICAgICAgIGxpbmVIZWlnaHQ6IDYwLFx0ICAgICAgICAvLyDljZXooYzpq5jluqZcclxuICAgICAgICAgICAgaXNGaXJzdFNob3c6IHRydWUsICAgICAgLy8g5piv5ZCm6buY6K6k6YCJ5Lit56ys5LiA5Liq6I+c5Y2V6aG5XHJcbiAgICAgICAgICAgIGRhdGE6IFtdLFx0XHRcdFx0Ly8gbWVudeaVsOaNrlxyXG4gICAgICAgICAgICBvcGVuQmVmb3JlOiBudWxsLFxyXG4gICAgICAgICAgICBvcGVuOiBudWxsLFxyXG4gICAgICAgICAgICBvcGVuQWZ0ZXI6IG51bGxcclxuICAgICAgICB9LCBvcCk7XHJcblxyXG4gICAgICAgIHZhciBnID0ge1xyXG5cclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIOWFpeWPo+aWueazlVxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgd29yazogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgZy5pbml0KCk7XHJcbiAgICAgICAgICAgICAgICBnLmNyZWF0ZUJvZHkoKTtcclxuICAgICAgICAgICAgICAgIGcuY3JlYXRlU3ViQm9keSgpO1xyXG4gICAgICAgICAgICAgICAgZy5hZGREYXRhKCk7XHJcbiAgICAgICAgICAgICAgICBnLmluaXRFdmVudCgpO1xyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgaW5pdDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcC5zZWxlY3RvciA9ICQodCkuYXR0cignaWQnKTtcclxuICAgICAgICAgICAgICAgIHAuYm9keUlEID0gcC5zZWxlY3RvciArICdOYXZNZW51Qm9keSc7XHJcbiAgICAgICAgICAgICAgICBwLnN1YklEID0gcC5zZWxlY3RvciArICdTdWJOYXZNZW51Qm9keSc7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHAuZGF0YVswXSAmJiBwLmRhdGFbMF0uaWQgIT0gXCJob21lXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBwLmhvbWUgJiYgcC5kYXRhLnVuc2hpZnQocC5ob21lKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICghcC5kYXRhLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHAuaG9tZSAmJiBwLmRhdGEudW5zaGlmdChwLmhvbWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgY3JlYXRlQm9keTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHdob2xlID0gJCgnPGRpdi8+JykuYXR0cignaWQnLCBwLnNlbGVjdG9yKS5hZGRDbGFzcyhcIm5hdi10cmVlXCIpO1xyXG4gICAgICAgICAgICAgICAgJCh0KS5iZWZvcmUod2hvbGUpO1xyXG4gICAgICAgICAgICAgICAgJCh0KS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgIHQgPSB3aG9sZTtcclxuICAgICAgICAgICAgICAgICQoJyMnICsgcC5zZWxlY3RvcikuYXBwZW5kKCc8dWwvPicpO1xyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgY3JlYXRlU3ViQm9keTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHN1Yk5hdiA9ICQoJzxkaXYvPicpLmF0dHIoJ2lkJywgcC5zdWJJRCkuYWRkQ2xhc3MoJ1N1Yk5hdi1NZW51Jyk7XHJcbiAgICAgICAgICAgICAgICAkKCcjJyArIHAuc3ViSUQpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgJChwLmNvbnRleHQpLmFwcGVuZChzdWJOYXYpO1xyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgYWRkRGF0YTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFwLmRhdGEgfHwgIShwLmRhdGEgaW5zdGFuY2VvZiBBcnJheSkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAkKCd1bCcsICQodCkpLmVtcHR5KCk7XHJcblxyXG4gICAgICAgICAgICAgICAgZy5hZGRCb2R5RGF0YShwLmRhdGEpO1xyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIOa3u+WKoOS4gOe6p+iPnOWNleWGheWuueaVsOaNrlxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgYWRkQm9keURhdGE6IGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbWVudUljb25zUGF0aCA9IHAuYmFzZVBhdGggKyBcIi9pY29ucy9cIjtcclxuICAgICAgICAgICAgICAgICQuZWFjaChkYXRhLCBmdW5jdGlvbiAoaSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBuYW1lID0gdGhpcy5pZDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGl0ZW0gPSAkKCc8bGkvPicpLmF0dHIoJ2luZGV4JywgaSkuYWRkQ2xhc3MoJ25hdi10cmVlLWl0ZW0nKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuYXR0cignbmFtZScsIG5hbWUpLmF0dHIoJ3BhcmVudCcsIHRoaXMucXRpcCk7XHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZSA9PSAnaG9tZScgJiYgaXRlbS5hZGRDbGFzcygnc2VsZWN0ZWQnKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvbnRlbnQgPSAkKCc8ZGl2Lz4nKS5hZGRDbGFzcygnbmF2LWNvbnRlbnQnKS5hdHRyKCd0aXRsZScsIG1haW4uZXZhbCh0aGlzLnRleHQpKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGljb24gPSAkKCc8ZGl2Lz4nKS5hZGRDbGFzcygnbmF2LWljb24nKTtcclxuICAgICAgICAgICAgICAgICAgICBpY29uLmNzcyh7J2JhY2tncm91bmQtaW1hZ2UnOiAndXJsKCcgKyBtZW51SWNvbnNQYXRoICsgbmFtZSArICcucG5nKSd9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZvbnQgPSAkKCc8ZGl2IGNsYXNzPVwiZm9udCBuYXYtZm9udCBlbGxpcHNpc1wiPjwvZGl2PicpLnRleHQobWFpbi5ldmFsKHRoaXMudGV4dCkpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjb250ZW50LmFwcGVuZChpY29uKTtcclxuICAgICAgICAgICAgICAgICAgICBjb250ZW50LmFwcGVuZChmb250KTtcclxuICAgICAgICAgICAgICAgICAgICBpdGVtLmFwcGVuZChjb250ZW50KTtcclxuICAgICAgICAgICAgICAgICAgICAkKCd1bCcsICQodCkpLmFwcGVuZChpdGVtKTtcclxuICAgICAgICAgICAgICAgICAgIC8vICh0aGlzLmxlYWYgfHwgdGhpcy5sZWFmID09ICd0cnVlJykgJiYgXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCh0aGlzLmNoaWxkcyAmJiB0aGlzLmNoaWxkcy5sZW5ndGgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQuYXBwZW5kKCQoJzxkaXYvPicpLmFkZENsYXNzKCduYXYtcmNiZy1zY28nKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGcuYWRkU3ViQm9keURhdGEoaXRlbSwgbmFtZSwgdGhpcy5jaGlsZHMpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIOWIm+W7uuS6jOe6p+iPnOWNlVxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgYWRkU3ViQm9keURhdGE6IGZ1bmN0aW9uIChkb20sIG5hbWUsIGRhdGEpIHtcclxuICAgICAgICAgICAgICAgIHZhciBkaXYgPSAkKCc8ZGl2IGNsYXNzPVwiY29uLXJjYmctbmF2XCIgaWQ9XCInICsgcC5zdWJJRCArICctJyArIG5hbWUgKyAnXCIvPicpXHJcbiAgICAgICAgICAgICAgICAgICAgLy8uY3NzKHt3aWR0aDogcC5zdWJXaWR0aH0pXHJcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ3BhcmVudCcsICQoZG9tKS5hdHRyKCdwYXJlbnQnKSArICcsJyArIG5hbWUpO1xyXG4gICAgICAgICAgICAgICAgJCgnIycgKyBwLnN1YklEKS5hcHBlbmQoZGl2KTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgb2Zmc2V0ID0gJChkb20pLm9mZnNldCgpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGxlZnQgPSBvZmZzZXQubGVmdCArICQoZG9tKS53aWR0aCgpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHRvcCA9IG9mZnNldC50b3A7XHJcbiAgICAgICAgICAgICAgICBkaXYuY3NzKHtsZWZ0OiBsZWZ0LCB0b3A6IHRvcCwgcG9zaXRpb246ICdhYnNvbHV0ZScsICd6LWluZGV4JzogJzk5OScsIGRpc3BsYXk6ICdub25lJ30pO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBzdWJVbCA9ICQoJzx1bC8+JykuYXBwZW5kVG8oZGl2KS5lbmQoKTtcclxuICAgICAgICAgICAgICAgICQuZWFjaChkYXRhLCBmdW5jdGlvbiAoaSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBpdGVtID0gJCgnPGxpLz4nKS5hdHRyKCdpbmRleCcsIGkpLmF0dHIoJ25hbWUnLCB0aGlzLmlkKS5hdHRyKCdwYXJlbnQnLCBkaXYuYXR0cigncGFyZW50JykpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5jc3Moe1wicGFkZGluZy1yaWdodFwiOiBcIjE1cHhcIn0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0ZXh0ID0gJCgnPGRpdi8+JykuaHRtbChtYWluLmV2YWwodGhpcy50ZXh0KSkuY3NzKHsnbWFyZ2luLWxlZnQnOiAnMTVweCd9KTtcclxuICAgICAgICAgICAgICAgICAgICBpdGVtLmFwcGVuZCh0ZXh0KTtcclxuICAgICAgICAgICAgICAgICAgICBzdWJVbC5hcHBlbmQoaXRlbSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiDliJ3lp4vljJbkuovku7blk43lupTlh73mlbBcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIGluaXRFdmVudDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgLy8g5LiA57qn6I+c5Y2V5LqL5Lu2XHJcbiAgICAgICAgICAgICAgICAkKCcubmF2LXRyZWUtaXRlbScsICQodCkpLnVuYmluZCgnbW91c2VvdmVyLCBtb3VzZW91dCwgY2xpY2snKVxyXG4gICAgICAgICAgICAgICAgICAgIC5tb3VzZW92ZXIoZnVuY3Rpb24gKGV2KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGcubmF2TWVudU92ZXIoZXYsIHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pLm1vdXNlb3V0KGZ1bmN0aW9uIChldikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBnLm5hdk1lbnVPdXQoZXYsIHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pLmNsaWNrKGZ1bmN0aW9uIChldikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBnLm5hdk1lbnVDbGljayhldiwgdGhpcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8g5LqM57qn6I+c5Y2V5LqL5Lu2XHJcbiAgICAgICAgICAgICAgICAkKHAuY29udGV4dCkudW5kZWxlZ2F0ZSgnLnJjYmcnKS5kZWxlZ2F0ZSgnLmNvbi1yY2JnLW5hdicsICdtb3VzZW92ZXIucmNiZycsIGZ1bmN0aW9uIChldikge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwYXJlbnRzID0gJCh0aGlzKS5hdHRyKCdwYXJlbnQnKS5zcGxpdCgnLCcpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwYXJlbnQgPSBwYXJlbnRzW3BhcmVudHMubGVuZ3RoIC0gMV07XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRvbSA9ICQoJy5uYXYtdHJlZS1pdGVtW25hbWU9JyArIHBhcmVudCArICddJywgJCh0KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZy5uYXZNZW51T3ZlcihldiwgZG9tKTtcclxuXHJcbiAgICAgICAgICAgICAgICB9KS5kZWxlZ2F0ZSgnLmNvbi1yY2JnLW5hdicsICdtb3VzZW91dC5yY2JnJywgZnVuY3Rpb24gKGV2KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhcmVudHMgPSAkKHRoaXMpLmF0dHIoJ3BhcmVudCcpLnNwbGl0KCcsJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhcmVudCA9IHBhcmVudHNbcGFyZW50cy5sZW5ndGggLSAxXTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZG9tID0gJCgnLm5hdi10cmVlLWl0ZW1bbmFtZT0nICsgcGFyZW50ICsgJ10nLCAkKHQpKS5nZXQoKTtcclxuICAgICAgICAgICAgICAgICAgICBnLm5hdk1lbnVPdXQoZXYsIGRvbSk7XHJcblxyXG4gICAgICAgICAgICAgICAgfSkuZGVsZWdhdGUoJy5jb24tcmNiZy1uYXYgbGknLCAnY2xpY2sucmNiZycsIGZ1bmN0aW9uIChldikge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwYXJlbnRzID0gJCh0aGlzKS5hdHRyKCdwYXJlbnQnKS5zcGxpdCgnLCcpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwYXJlbnQgPSBwYXJlbnRzW3BhcmVudHMubGVuZ3RoIC0gMV07XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5hbWUgPSAkKHRoaXMpLmF0dHIoJ25hbWUnKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdGV4dCA9ICQodGhpcykudGV4dCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBkb20gPSAkKCcubmF2LXRyZWUtaXRlbVtuYW1lPScgKyBwYXJlbnQgKyAnXScsICQodCkpLmdldCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGcubmF2TWVudUNsaWNrKGV2LCBkb20pO1xyXG4gICAgICAgICAgICAgICAgICAgIHAub3BlbkJlZm9yZSAmJiBwLm9wZW5CZWZvcmUgaW5zdGFuY2VvZiBGdW5jdGlvbiAmJiBwLm9wZW5CZWZvcmUobmFtZSwgdGV4dCk7XHJcbi8vICAgICAgICAgICAgICAgICAgICBpZiAoIShwLm9wZW5CZWZvcmUgJiYgcC5vcGVuQmVmb3JlIGluc3RhbmNlb2YgRnVuY3Rpb24gJiYgcC5vcGVuQmVmb3JlKG5hbWUsIHRleHQpKSkge1xyXG4vLyAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuLy8gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBwLm9wZW4gJiYgcC5vcGVuIGluc3RhbmNlb2YgRnVuY3Rpb24gJiYgcC5vcGVuKG5hbWUsIHRleHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHAub3BlbkFmdGVyICYmIHAub3BlbkFmdGVyIGluc3RhbmNlb2YgRnVuY3Rpb24gJiYgcC5vcGVuQWZ0ZXIobmFtZSwgdGV4dCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAocC5pc0ZpcnN0U2hvdykge1xyXG4gICAgICAgICAgICAgICAgICAgICQoJy5uYXYtdHJlZS1pdGVtJywgJCh0KSkuZXEoMCkuY2xpY2soKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiDmmL7npLrlrZDoj5zljZVcclxuICAgICAgICAgICAgICogQHBhcmFtIGV2XHJcbiAgICAgICAgICAgICAqIEBwYXJhbSBkb21cclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIG5hdk1lbnVPdmVyOiBmdW5jdGlvbiAoZXYsIGRvbSkge1xyXG4gICAgICAgICAgICAgICAgLy8g56e76Zmk5Y+z5L6n5Li76KaB5Yy65Z+f54Sm54K5XHJcbiAgICAgICAgICAgICAgICAkKCcucmlnaHQtY29uIDpmb2N1cycpLmJsdXIoKTtcclxuICAgICAgICAgICAgICAgIHZhciBuYW1lID0gJChkb20pLmF0dHIoJ25hbWUnKTtcclxuICAgICAgICAgICAgICAgIHZhciBvZmZzZXQgPSAkKGRvbSkub2Zmc2V0KCk7XHJcbiAgICAgICAgICAgICAgICAvL3BhZGRpbmcgbWFyZ2lu5Lmf566X5Zyo5a695bqm5YaFXHJcbiAgICAgICAgICAgICAgICB2YXIgbGVmdCA9IG9mZnNldC5sZWZ0ICsgJChkb20pLm91dGVyV2lkdGgoKTtcclxuICAgICAgICAgICAgICAgIHZhciB0b3AgPSBvZmZzZXQudG9wO1xyXG4gICAgICAgICAgICAgICAgdG9wID0gdG9wICsgJCgnI21haW5fdmlldycpLnNjcm9sbFRvcCgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCQoJyMnICsgcC5zdWJJRCArICctJyArIG5hbWUpLmhlaWdodCgpICsgdG9wID4gKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdG9wID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodCAtICQoJyMnICsgcC5zdWJJRCArICctJyArIG5hbWUpLmhlaWdodCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgJCgnIycgKyBwLnN1YklEICsgJy0nICsgbmFtZSkuY3NzKHtsZWZ0OiBsZWZ0LCAndG9wJzogdG9wIDwgMCA/IDAgOiB0b3B9KS5zaG93KCk7XHJcbiAgICAgICAgICAgICAgICAkKGRvbSkuc2libGluZ3MoKS5yZW1vdmVDbGFzcygnaG92ZXInKS5lbmQoKS5hZGRDbGFzcygnaG92ZXInKTtcclxuICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiDpmpDol4/lrZDoj5zljZVcclxuICAgICAgICAgICAgICogQHBhcmFtIGV2XHJcbiAgICAgICAgICAgICAqIEBwYXJhbSBkb21cclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIG5hdk1lbnVPdXQ6IGZ1bmN0aW9uIChldiwgZG9tKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmFtZSA9ICQoZG9tKS5hdHRyKCduYW1lJyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoJChwLmNvbnRleHQpLmZpbmQoJyMnICsgcC5zdWJJRCArICctJyArIG5hbWUpLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgICQoJyMnICsgcC5zdWJJRCArICctJyArIG5hbWUpLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICQoZG9tKS5yZW1vdmVDbGFzcygnaG92ZXInKTtcclxuICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiDngrnlh7vkuIDnuqfoj5zljZVcclxuICAgICAgICAgICAgICogQHBhcmFtIGV2XHJcbiAgICAgICAgICAgICAqIEBwYXJhbSBkb21cclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIG5hdk1lbnVDbGljazogZnVuY3Rpb24gKGV2LCBkb20pIHtcclxuICAgICAgICAgICAgICAgIHZhciBuYW1lID0gJChkb20pLmF0dHIoJ25hbWUnKTtcclxuICAgICAgICAgICAgICAgIHZhciB0ZXh0ID0gJChkb20pLnRleHQoKTtcclxuICAgICAgICAgICAgICAgIHZhciBpbmRleCA9ICQoZG9tKS5hdHRyKCdpbmRleCcpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCQoJy5uYXYtcmNiZy1zY28nLCAkKGRvbSkpLmxlbmd0aCA9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHAub3BlbkJlZm9yZSAmJiBwLm9wZW5CZWZvcmUgaW5zdGFuY2VvZiBGdW5jdGlvbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIShwLm9wZW5CZWZvcmUobmFtZSwgdGV4dCkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcC5vcGVuICYmIHAub3BlbiBpbnN0YW5jZW9mIEZ1bmN0aW9uICYmIHAub3BlbihuYW1lLCB0ZXh0KTtcclxuICAgICAgICAgICAgICAgICAgICBwLm9wZW5BZnRlciAmJiBwLm9wZW5BZnRlciBpbnN0YW5jZW9mIEZ1bmN0aW9uICYmIHAub3BlbkFmdGVyKG5hbWUsIHRleHQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgJChkb20pLnNpYmxpbmdzKCkucmVtb3ZlQ2xhc3MoJ3NlbGVjdGVkJykuZW5kKCkuYWRkQ2xhc3MoJ3NlbGVjdGVkJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBnLndvcmsoKTtcclxuICAgIH07XHJcblxyXG4gICAgdmFyIGRvY0xvYWRlZCA9IGZhbHNlO1xyXG4gICAgJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGRvY0xvYWRlZCA9IHRydWU7XHJcbiAgICB9KTtcclxuXHJcbiAgICAkLmZuLk5hdk1lbnVUcmVlID0gZnVuY3Rpb24gKHApIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKCFkb2NMb2FkZWQpIHtcclxuICAgICAgICAgICAgICAgICQodGhpcykuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHQgPSB0aGlzO1xyXG4gICAgICAgICAgICAgICAgJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICQuYWRkTmF2TWVudSh0LCBwKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgJC5hZGROYXZNZW51KHRoaXMsIHApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICog5L2/5oyH5a6a6I+c5Y2V6aG55aSE5LqO6YCJ5Lit54q25oCBXHJcbiAgICAgKiBAcGFyYW0gbmFtZVxyXG4gICAgICogQHJldHVybnMgeyp9XHJcbiAgICAgKiBAY29uc3RydWN0b3JcclxuICAgICAqL1xyXG4gICAgJC5mbi5OYXZNZW51VHJlZVNlbGVjdGVkID0gZnVuY3Rpb24gKG5hbWUpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIGl0ZW0gPSAkKCdsaVtuYW1lPScgKyBuYW1lICsgJ10nLCAkKHRoaXMpKTtcclxuICAgICAgICAgICAgaWYgKCEoaXRlbSAmJiBpdGVtLmxlbmd0aCkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBzdWJJdGVtID0gJCgnLmNvbi1yY2JnLW5hdicpLmZpbmQoJ1tuYW1lPScgKyBuYW1lICsgJ10nKTtcclxuICAgICAgICAgICAgICAgIGlmIChzdWJJdGVtICYmIHN1Ykl0ZW0ubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhcmVudHMgPSBzdWJJdGVtLmF0dHIoJ3BhcmVudCcpLnNwbGl0KCcsJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhcmVudCA9IHBhcmVudHNbcGFyZW50cy5sZW5ndGggLSAxXTtcclxuICAgICAgICAgICAgICAgICAgICBpdGVtID0gJCgnbGlbbmFtZT0nICsgcGFyZW50ICsgJ10nLCAkKHRoaXMpKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGl0ZW0gJiYgaXRlbS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIGl0ZW0uc2libGluZ3MoKS5yZW1vdmVDbGFzcygnc2VsZWN0ZWQnKS5lbmQoKS5hZGRDbGFzcygnc2VsZWN0ZWQnKTtcclxuICAgICAgICAgICAgICAgICQoJy5jb250YWluZXItbWFpbicpLmFuaW1hdGUoe1xyXG4gICAgICAgICAgICAgICAgICAgIHNjcm9sbFRvcDogKGl0ZW0ucG9zaXRpb24oKS50b3AgLSA3MClcclxuICAgICAgICAgICAgICAgIH0sIDI1MCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG59KSk7Il0sImZpbGUiOiJwbHVnaW5zL05hdk1lbnVUcmVlL05hdk1lbnVUcmVlLmpzIn0=
