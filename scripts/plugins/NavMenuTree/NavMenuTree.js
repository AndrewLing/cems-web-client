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
                    var ptext =  $(dom).text();
                    if (p.openBefore && p.openBefore instanceof Function) {
                        if (!(p.openBefore(name, text,ptext))) {
                            return;
                        }
                    }
                    p.open && p.open instanceof Function && p.open(name, text,ptext);
                    p.openAfter && p.openAfter instanceof Function && p.openAfter(name, text,ptext);
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