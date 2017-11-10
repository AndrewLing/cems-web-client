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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL2Vhc3lUYWJzL2Vhc3lUYWJzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiDlip/og73vvJp0YWLpobVcclxuICog5pel5pyf77yaMjAxNy4wMS4yMFxyXG4gKi9cclxuZGVmaW5lKFsnanF1ZXJ5JywgJ2NzcyFwbHVnaW5zL2Vhc3lUYWJzL2Nzcy9lYXN5VGFicy5jc3MnXSwgZnVuY3Rpb24gKCQpIHtcclxuXHJcbiAgICAkLmFkZEVhc3lUYWJzID0gZnVuY3Rpb24gKHQsIG9wdGlvbnMpIHtcclxuICAgICAgICB2YXIgJHRoaXMgPSAkKHQpO1xyXG4gICAgICAgIHZhciBwID0gJC5leHRlbmQoe1xyXG4gICAgICAgICAgICB0aXRsZTogXCJcIiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOagh+etvuagh+mimOWGheWuuVxyXG4gICAgICAgICAgICBzaG93OiAnaG9yaXpvbnRhbCcsXHRcdCAgICAgICAvL3RhYuaYvuekuuaWueW8j++8muerluebtOeahCd2ZXJ0aWNhbCfvvIzmsLTlubPnmoQnaG9yaXpvbnRhbCdcclxuICAgICAgICAgICAga2VlcFBhZ2U6IGZhbHNlLFx0XHRcdCAgIC8vdGFi5YiH5o2i5pe25piv5ZCm5L+d55WZ5Y6fcGFnZemhtemdou+8jOWPquWBmumakOiXj1xyXG4gICAgICAgICAgICB0YWJJZHM6IFsnZWFzeVRhYnNfb25lJywgJ2Vhc3lUYWJzX3R3bycsICdlYXN5VGFic190aHJlZSddLCAvLyDngrnlh7vmoIfnrb7mjInpkq5JROWIl+ihqFxyXG4gICAgICAgICAgICBoaWRlSWRzOiBbXSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDkuI3mmL7npLrnmoTmoIfnrb5JROWIl+ihqFxyXG4gICAgICAgICAgICBwZXJtaXNzaW9uczogZmFsc2UsIC8vIHRhYuagh+etvuadg+mZkOaOp+WItmtlee+8jOS4jnNyY2lk5a+55bqUOiBbJ3NyY2lkMScsICdzcmNpZDInLCAuLi5dXHJcbiAgICAgICAgICAgIHRhYk5hbWVzOiBbXCLlnLDlm77mqKHlvI9cIiwgXCLlt6Hmo4DnrqHnkIZcIiwgXCLmtojnvLrnrqHnkIZcIl0sICAgICAgICAgICAgICAgLy8g5qCH562+5oyJ6ZKu5pi+56S65YaF5a65XHJcbiAgICAgICAgICAgIHRhYlNwYWNlOiA1MCxcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Ly8g5qCH562+6Ze06ZqUXHJcbiAgICAgICAgICAgIHVzZU5hdmJhcjogZmFsc2UsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5piv5ZCm5L2/55SobmF2YmFy5qC35byPXHJcbiAgICAgICAgICAgIHVybHM6IFsnJywgJycsICcnXSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDmoIfnrb7lhoXlrrnliqDovb3pobXpnaJVUkzliJfooahcclxuICAgICAgICAgICAgc2NyaXBzOiBbWycnXSwgWycnXSwgWycnXV0sICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDmoIfnrb7lhoXlrrnpobXpnaLkvp3otZbnmoRqc+iEmuacrOWIl+ihqFxyXG4gICAgICAgICAgICBzdHlsZXM6IFtbJyddLCBbJyddLCBbJyddXSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOagh+etvuWGheWuuemhtemdouS+nei1lueahOagt+W8j+WIl+ihqFxyXG4gICAgICAgICAgICBwYXJhbXM6IHt9LFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0IC8vIGxvYWRQYWdl5Lyg6YCS5Y+C5pWwXHJcbiAgICAgICAgICAgIGNiOiBmYWxzZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDngrnlh7vmoIfnrb7lm57osIPmlrnms5VcclxuICAgICAgICB9LCBvcHRpb25zKTtcclxuXHJcbiAgICAgICAgdmFyIHUgPSB7XHJcbiAgICAgICAgICAgIGV2YWw6IGZ1bmN0aW9uIChzdHIpIHtcclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGV2YWwoJygnICsgc3RyICsgJyknKTtcclxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHt9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RyO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBnZXRWYWx1ZTogZnVuY3Rpb24gKF9hLCBrKSB7XHJcbiAgICAgICAgICAgIFx0cmV0dXJuICQuaXNBcnJheShfYSkgJiYgX2EubGVuZ3RoID4gayA/IF9hW2tdIDogXCJcIjtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgaW5BcnJheTogZnVuY3Rpb24gKF9hLCB2KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gJC5pc0FycmF5KF9hKSAmJiAkLmluQXJyYXkodiwgX2EpID4gLTE7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHNlbGVjdDogZnVuY3Rpb24gKGkpIHtcclxuICAgICAgICAgICAgXHQkdGhpcy5maW5kKCcuZWFzeS10YWJzLXRpdGxlLC5lYXN5LXRhYnMtdGl0bGUtdiwuZWFzeS10YWJzLXRpdGxlLW5hdicpLmVxKGkpLmNsaWNrKCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGFjdGl2ZVRpdGxlOiBmdW5jdGlvbiAoJHRpdGxlKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgX3RDbGFzcyA9ICdhY3RpdmUnO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFwLnVzZU5hdmJhcikge1xyXG4gICAgICAgICAgICAgICAgICAgIF90Q2xhc3MgPSAocC5zaG93ID09ICd2ZXJ0aWNhbCcpID8gJ2Vhc3ktdGFicy1zZWxlY3RlZC12JyA6ICdlYXN5LXRhYnMtc2VsZWN0ZWQnO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgJHRoaXMuZmluZCgnLicrX3RDbGFzcykucmVtb3ZlQ2xhc3MoX3RDbGFzcyk7XHJcbiAgICAgICAgICAgICAgICAkdGl0bGUuYWRkQ2xhc3MoX3RDbGFzcyk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGNyZWF0ZVRpdGxlOiBmdW5jdGlvbiAoaywgdikge1xyXG4gICAgICAgICAgICAgICAgdmFyIF9tc2cgPSB0eXBlb2YgcC50YWJOYW1lcyA9PT0gJ3N0cmluZycgPyBcclxuICAgICAgICAgICAgICAgICAgICBwLnRhYk5hbWVzKydbJytrKyddJyA6IHUuZ2V0VmFsdWUocC50YWJOYW1lcywgayk7XHJcbiAgICAgICAgICAgICAgICB2YXIgX3JNc2cgPSB1LmV2YWwoX21zZyk7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHRUaXRsZSA9ICQoJzxsaS8+JykuYXR0cignaWQnLCB2KTtcclxuICAgICAgICAgICAgICAgIGlmIChwLnVzZU5hdmJhcikge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBfbGluayA9ICQoJzxhLz4nKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2hyZWYnLCAnamF2YXNjcmlwdDp2b2lkKDApJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKCdkYXRhLWkxOG4tdHlwZScsICd0ZXh0JylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKCdkYXRhLWkxOG4tbWVzc2FnZS10ZXh0JywgX21zZylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5odG1sKF9yTXNnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmFkZENsYXNzKCdlYXN5LXRhYnMtdGl0bGUtbmF2IGkxOG4nKTtcclxuICAgICAgICAgICAgICAgICAgICB0VGl0bGUuYXBwZW5kKF9saW5rKS5jc3MoJ21hcmdpbi1yaWdodCcsIHAudGFiU3BhY2UpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0VGl0bGUuYXR0cignZGF0YS1pMThuLXR5cGUnLCAndGV4dCB0aXRsZScpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKCdkYXRhLWkxOG4tbWVzc2FnZS10ZXh0JywgX21zZylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2RhdGEtaTE4bi1tZXNzYWdlLXRpdGxlJywgX21zZylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ3RpdGxlJywgX3JNc2cpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5jc3MoJ21hcmdpbi1yaWdodCcsIHAudGFiU3BhY2UpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5odG1sKF9yTXNnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ2Vhc3ktdGFicy10aXRsZSBpMThuJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdFRpdGxlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgJHRoaXMuZW1wdHkoKTtcclxuICAgICAgICBwLnRpdGxlICYmICR0aGlzLmFwcGVuZCgkKCc8ZGl2Lz4nKS5hZGRDbGFzcygnZWFzeS10YWJzLW5hbWUnKS5odG1sKHAudGl0bGUpKTtcclxuXHJcbiAgICAgICAgdmFyIGFyZWEgPSAkKCc8ZGl2Lz4nKS5hZGRDbGFzcygnZWFzeS10YWJzLWFyZWEnKTtcclxuICAgICAgICB2YXIgdGFiVGl0bGVzID0gJCgnPHVsLz4nKTtcclxuICAgICAgICBpZiAocC51c2VOYXZiYXIpIHtcclxuICAgICAgICAgICAgYXJlYS5hcHBlbmQoJCgnPGRpdi8+JykuYWRkQ2xhc3MoJ25hdmJhcicpLmFwcGVuZCh0YWJUaXRsZXMuYWRkQ2xhc3MoJ25hdiBuYXZiYXItbmF2JykpKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBhcmVhLmFwcGVuZCh0YWJUaXRsZXMuYWRkQ2xhc3MoJ2Vhc3ktdGFicy10aXRsZXMnKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAkLmVhY2gocC50YWJJZHMsIGZ1bmN0aW9uIChrLCB2KSB7XHJcbiAgICAgICAgICAgIGlmKHUuaW5BcnJheShwLmhpZGVJZHMsIHYpKSByZXR1cm47XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgdFRpdGxlID0gdS5jcmVhdGVUaXRsZShrLCB2KTtcclxuICAgICAgICBcdC8v5p2D6ZmQ6YWN572uXHJcbiAgICAgICAgICAgIHZhciBfcGVybWlzc2lvbiA9IHAucGVybWlzc2lvbnMgJiYgdS5nZXRWYWx1ZShwLnBlcm1pc3Npb25zLCBrKTtcclxuICAgICAgICAgICAgX3Blcm1pc3Npb24gJiYgdFRpdGxlLmF0dHIoJ3Blcm1pc3Npb24nLCBfcGVybWlzc2lvbik7XHJcblxyXG4gICAgICAgICAgICB0VGl0bGUuY2xpY2soZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdS5hY3RpdmVUaXRsZSgkKHRoaXMpKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgdmFyIF9ib2R5cyA9ICR0aGlzLmZpbmQoJy5lYXN5LXRhYnMtYm9keXMnKTtcclxuICAgICAgICAgICAgICAgIHAua2VlcFBhZ2UgPyBfYm9keXMuYWRkQ2xhc3MoJ2hpZGRlbicpIDogX2JvZHlzLnJlbW92ZSgpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmKHAua2VlcFBhZ2UgJiYgJHRoaXMuZmluZCgnI2ViLScrdikubGVuZ3RoPjApe1xyXG4gICAgICAgICAgICAgICAgXHQkdGhpcy5maW5kKCcjZWItJyt2KS5yZW1vdmVDbGFzcygnaGlkZGVuJyk7XHJcbiAgICAgICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgIFx0dmFyIHRhYkJvZHkgPSAkKCc8ZGl2Lz4nKS5hZGRDbGFzcygnZWFzeS10YWJzLWJvZHlzJykuYXR0cignaWQnLCAnZWItJyArIHYpO1xyXG4gICAgICAgICAgICAgICAgXHRwLnNob3cgPT0gJ3ZlcnRpY2FsJyAmJiB0YWJCb2R5LmFkZENsYXNzKCdlYXN5LXRhYnMtYm9keXMtdicpO1xyXG4gICAgICAgICAgICAgICAgXHR0YWJCb2R5LmxvYWRQYWdlKHtcclxuICAgICAgICAgICAgICAgIFx0XHR1cmw6IHUuZ2V0VmFsdWUocC51cmxzLCBrKSxcclxuICAgICAgICAgICAgICAgIFx0XHRzY3JpcHRzOiB1LmdldFZhbHVlKHAuc2NyaXB0cywgayksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlczogdS5nZXRWYWx1ZShwLnN0eWxlcywgaylcclxuICAgICAgICAgICAgICAgIFx0fSwgcC5wYXJhbXMgfHwge30sIGZ1bmN0aW9uIChkYXRhLCBtb2R1bGUpIHtcclxuICAgICAgICAgICAgICAgIFx0XHRwLmNiICYmIHR5cGVvZiBwLmNiID09ICdmdW5jdGlvbicgJiYgcC5jYihkYXRhLCBtb2R1bGUpO1xyXG4gICAgICAgICAgICAgICAgXHR9KTtcclxuICAgICAgICAgICAgICAgIFx0YXJlYS5hcHBlbmQodGFiQm9keSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgdGFiVGl0bGVzLmFwcGVuZCh0VGl0bGUpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAkdGhpcy5hcHBlbmQoYXJlYSk7XHJcbiAgICAgICAgLy/nurXlkJF0YWLosIPmlbTmoLflvI9cclxuICAgICAgICBpZihwLnNob3cgPT0gJ3ZlcnRpY2FsJyl7XHJcbiAgICAgICAgXHR0YWJUaXRsZXMucmVtb3ZlQ2xhc3MoJ2Vhc3ktdGFicy10aXRsZXMnKS5hZGRDbGFzcygnZWFzeS10YWJzLXRpdGxlcy12Jyk7XHJcbiAgICAgICAgXHR2YXIgX2xpcyA9IHRhYlRpdGxlcy5maW5kKCdsaScpO1xyXG4gICAgICAgIFx0X2xpcy5lYWNoKGZ1bmN0aW9uKGssIHYpe1xyXG4gICAgICAgIFx0XHQkKHYpLnJlbW92ZUNsYXNzKCdlYXN5LXRhYnMtdGl0bGUnKS5hZGRDbGFzcygnZWFzeS10YWJzLXRpdGxlLXYnKS5jc3MoJ21hcmdpbi1yaWdodCcsIDApO1xyXG4gICAgICAgIFx0XHQkKHYpLmh0bWwoJCh2KS5odG1sKCkuc3BsaXQoJycpLmpvaW4oJzxici8+JykpO1xyXG4gICAgICAgIFx0fSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vVE9ETyDop6blj5HmnYPpmZDmoKHpqozvvIzmmoLml7bml6Dnu5/kuIDliqjmgIHmoKHpqoxcclxuICAgICAgICBNZW51Lmhhc0VsZW1lbnRSaWdodCgpO1xyXG4gICAgICAgIC8v6buY6K6k6YCJ5Lit56ys5LiA5LiqdGFiXHJcbiAgICAgICAgdS5zZWxlY3QoMCk7XHJcbiAgICB9O1xyXG5cclxuICAgIHZhciBkb2NMb2FkZWQgPSBmYWxzZTtcclxuICAgICQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBkb2NMb2FkZWQgPSB0cnVlO1xyXG4gICAgfSk7XHJcblxyXG4gICAgJC5mbi5lYXN5VGFicyA9IGZ1bmN0aW9uIChwKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmICghZG9jTG9hZGVkKSB7XHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgIHZhciB0ID0gdGhpcztcclxuICAgICAgICAgICAgICAgICQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAkLmFkZEVhc3lUYWJzKHQsIHApO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAkLmFkZEVhc3lUYWJzKHRoaXMsIHApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG59KTsiXSwiZmlsZSI6InBsdWdpbnMvZWFzeVRhYnMvZWFzeVRhYnMuanMifQ==
