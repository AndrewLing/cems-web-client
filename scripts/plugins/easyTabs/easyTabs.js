/**
 * 功能：tab页
 * 日期：2017.01.20
 */
define(['jquery', 'css!plugins/easyTabs/css/easyTabs.css'], function ($) {

    $.addEasyTabs = function (t, options) {
        var $this = $(t);
        var p = $.extend({
            title: "",                                                  // 标签标题内容
            show: 'horizontal',		       //tab显示方式：竖直的'vertical'，水平的'horizontal'
            keepPage: false,			   //tab切换时是否保留原page页面，只做隐藏
            tabIds: ['easyTabs_one', 'easyTabs_two', 'easyTabs_three'], // 点击标签按钮ID列表
            hideIds: [],                                                // 不显示的标签ID列表
            permissions: false, // tab标签权限控制key，与srcid对应: ['srcid1', 'srcid2', ...]
            tabNames: ["地图模式", "巡检管理", "消缺管理"],               // 标签按钮显示内容
            tabSpace: 50,											// 标签间隔
            useNavbar: false,                                       // 是否使用navbar样式
            urls: ['', '', ''],                                          // 标签内容加载页面URL列表
            scrips: [[''], [''], ['']],                                // 标签内容页面依赖的js脚本列表
            styles: [[''], [''], ['']],                                // 标签内容页面依赖的样式列表
            params: {},													 // loadPage传递参数
            cb: false                                                    // 点击标签回调方法
        }, options);

        var u = {
            eval: function (str) {
                try {
                    return eval('(' + str + ')');
                } catch (e) {}
                return str;
            },
            getValue: function (_a, k) {
            	return $.isArray(_a) && _a.length > k ? _a[k] : "";
            },
            inArray: function (_a, v) {
                return $.isArray(_a) && $.inArray(v, _a) > -1;
            },
            select: function (i) {
            	$this.find('.easy-tabs-title,.easy-tabs-title-v,.easy-tabs-title-nav').eq(i).click();
            },
            activeTitle: function ($title) {
                var _tClass = 'active';
                if (!p.useNavbar) {
                    _tClass = (p.show == 'vertical') ? 'easy-tabs-selected-v' : 'easy-tabs-selected';
                }
                $this.find('.'+_tClass).removeClass(_tClass);
                $title.addClass(_tClass);
            },
            createTitle: function (k, v) {
                var _msg = typeof p.tabNames === 'string' ? 
                    p.tabNames+'['+k+']' : u.getValue(p.tabNames, k);
                var _rMsg = u.eval(_msg);

                var tTitle = $('<li/>').attr('id', v);
                if (p.useNavbar) {
                    var _link = $('<a/>')
                            .attr('href', 'javascript:void(0)')
                            .attr('data-i18n-type', 'text')
                            .attr('data-i18n-message-text', _msg)
                            .html(_rMsg)
                            .addClass('easy-tabs-title-nav i18n');
                    tTitle.append(_link).css('margin-right', p.tabSpace);
                } else {
                    tTitle.attr('data-i18n-type', 'text title')
                        .attr('data-i18n-message-text', _msg)
                        .attr('data-i18n-message-title', _msg)
                        .attr('title', _rMsg)
                        .css('margin-right', p.tabSpace)
                        .html(_rMsg)
                        .addClass('easy-tabs-title i18n');
                }
                return tTitle;
            }
        };

        $this.empty();
        p.title && $this.append($('<div/>').addClass('easy-tabs-name').html(p.title));

        var area = $('<div/>').addClass('easy-tabs-area');
        var tabTitles = $('<ul/>');
        if (p.useNavbar) {
            area.append($('<div/>').addClass('navbar').append(tabTitles.addClass('nav navbar-nav')));
        } else {
            area.append(tabTitles.addClass('easy-tabs-titles'));
        }

        $.each(p.tabIds, function (k, v) {
            if(u.inArray(p.hideIds, v)) return;
            
            var tTitle = u.createTitle(k, v);
        	//权限配置
            var _permission = p.permissions && u.getValue(p.permissions, k);
            _permission && tTitle.attr('permission', _permission);

            tTitle.click(function () {
                u.activeTitle($(this));
                
                var _bodys = $this.find('.easy-tabs-bodys');
                p.keepPage ? _bodys.addClass('hidden') : _bodys.remove();

                if(p.keepPage && $this.find('#eb-'+v).length>0){
                	$this.find('#eb-'+v).removeClass('hidden');
                }else{
                	var tabBody = $('<div/>').addClass('easy-tabs-bodys').attr('id', 'eb-' + v);
                	p.show == 'vertical' && tabBody.addClass('easy-tabs-bodys-v');
                	tabBody.loadPage({
                		url: u.getValue(p.urls, k),
                		scripts: u.getValue(p.scripts, k),
                        styles: u.getValue(p.styles, k)
                	}, p.params || {}, function (data, module) {
                		p.cb && typeof p.cb == 'function' && p.cb(data, module);
                	});
                	area.append(tabBody);
                }
            });

            tabTitles.append(tTitle);
        });

        $this.append(area);
        //纵向tab调整样式
        if(p.show == 'vertical'){
        	tabTitles.removeClass('easy-tabs-titles').addClass('easy-tabs-titles-v');
        	var _lis = tabTitles.find('li');
        	_lis.each(function(k, v){
        		$(v).removeClass('easy-tabs-title').addClass('easy-tabs-title-v').css('margin-right', 0);
        		$(v).html($(v).html().split('').join('<br/>'));
        	});
        }
        
        //TODO 触发权限校验，暂时无统一动态校验
        Menu.hasElementRight();
        //默认选中第一个tab
        u.select(0);
    };

    var docLoaded = false;
    $(document).ready(function () {
        docLoaded = true;
    });

    $.fn.easyTabs = function (p) {
        return this.each(function () {
            if (!docLoaded) {
                $(this).hide();
                var t = this;
                $(document).ready(function () {
                    $.addEasyTabs(t, p);
                });
            } else {
                $.addEasyTabs(this, p);
            }
        });
    };
});