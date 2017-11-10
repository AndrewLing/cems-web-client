/**
 * jQuery
 */
define(['jquery', 'main/right', 'css!plugins/GridTable/css/GridTable.css'], function ($, Menu) {

    var addGrid = function (t, options) {
        var p = $.extend({}, {
            expandFlag: '',
            expandDisableFlag: '',         //列表展开是否显示为禁用图标判断函数
            width: 'auto',                 //选择框宽度
            height: 'auto',                //选择框高度

            url: '',                       //表格数据后台请求地址
            list: 'list',                  //后台请求的数据列表名
            total: 'total',                //后台请求的数据总记录名
            params: {},                    //请求的参数

            header: true,                  //表格是否有表头，false不显示，true显示
            title: false,                  //表格是否有标题，false不显示，true显示
            pageBar: true,                 //表格是否有工具条，false不显示，true显示
            body: true,				       //表格是否有表格主体内容，false不显示，true显示
            toolBar: false,			       //表格是否有表格工具条，false不显示，true显示

            titleText: false,		       //表格的标题内容，string型
            title_cellspacing: '0',	       //title间隔
            header_cellspacing: '0',       //header间隔
            body_cellspacing: '0',	       //body间隔
            toolBar_cellspacing: '0',      //toolBar间隔
            overflow: true,                //是否启用滚动条
            titleModel:				       //表格的复杂标题内容模型
                [
                    [
                        {display: '电站名称', extend: {'id': '11'}, align: "center"},
                        {display: '电站名称', align: "center"},
                        {display: '电站名称', width: '0.1', align: "right"}
                    ]
                ],


            loadError: false,		       //数据请求失败的回调函数
            loadReady: false,		       //数据请求成功的回调函数

            data: false,				   //表格内所要填充的数据
            prototypeData: false, 			//原型数据 list:[] 数组
            prototypeSort: function (prop, sort) { // 默认排序方法
                return function (obj1, obj2) {
                    if (!prop || !sort) {
                        return 0;
                    }
                    var val1 = obj1[prop];
                    var val2 = obj2[prop];
                    if (!isNaN(Number(val1)) && !isNaN(Number(val2))) {
                        val1 = Number(val1);
                        val2 = Number(val2);
                    }
                    if (val1 < val2) {
                        return "desc" == sort.toLowerCase() ? 1 : -1;
                    } else if (val1 > val2) {
                        return "desc" == sort.toLowerCase() ? -1 : 1;
                    } else {
                        return 0;
                    }
                }
            },

            onSingleClick: false,	       //表格行点击事件
            onDoubleClick: false,	       //表格行双击事件
            onLoadReady: false,		       //表格主体内容加载完成的回调函数

            isShowSelect: true,            //是否显示选择操作列
            singleSelect: false, 	       //可多选还是单选，true单选，false多选
            isAllSelect: true,             //是否可全选（当singleSelect=false生效）
            clickSelect: false,		       //行是否可以点击

            max_height: 'auto',		       //最大高度
            line_height: 40,		       //单行行高
            col_width: 100,			       //默认列宽度

            rp: 10,					       //表格当前页最多装载的记录条数
            rps: [10, 15, 30, 50],	       //表格装载的记录条数
            totalRecords: 0,		       //表格总记录数
            currentPage: 1,			       //表格当前页数
            totalPage: 1,			       //表格总页数
            toPage: 1,				       //表格要跳转的页数

            align: 'center',		       //默认排版类型

            colModel: null,			       //单行表头模型设置，使用方式与colModels类似
            colModelCopy: null,		       //单行表头模型复制

            resizable: true,		       //是否自适应变化

            parent: false,			       //父窗

            isShowNoData: false,           //是否在无数据时在表格中显示提示信息
            isRecordSelected: false,       //跨页选择
            isSearchRecordSelected: false, //是否在查询时记录选中项, isRecordSelected=true时生效
            showSelectedName: false,       //显示选中项展示板
            idProperty: false,             //主键（默认配置模型中的第一列）

            expand: false,                 //{Boolean | Function (record, box, index)} 是否可展开，如果这里是一个方法，那么展开时会执行该方法
            fold: false,                   //{Boolean | Function (box, index)} 配套expand参数使用，如果expand为true或者方法，在展开层收起来时会执行该方法
            expandIndex: null,             //初始展开行号，基数为 0，默认 初始时都不展开
            expandBoxHeight: 'auto',       //展开容器的高度，默认为: 行高（line-height)

            colModels:				       //多行表头模型设置
                [					       //实例
                    [
                        {display: '电站名称', name: '0', rowspan: '2', width: '0.2', align: "center"},
                        {display: '并网类型', name: '7', rowspan: '2', width: '0.1', align: "center"},
                        {display: '逆变器类型', name: '8', rowspan: '2', width: '0.1', align: "center"},
                        {
                            display: '工作票',
                            name: '',
                            colspan: '2',
                            width: '0.2',
                            align: "center",
                            before: false,
                            after: false,
                            order: true  // 是否支持该列排序
                        },
                        {display: '操作票', name: '', colspan: '2', width: '0.2', align: "center"},
                        {display: '缺陷', name: '', colspan: '2', width: '0.2', align: "center"}
                    ],
                    [
                        {display: '总数(个)', name: '1', width: '0.1', align: "center"},
                        {display: '平均处理时长(h)', name: '2', width: '0.1', align: "center"},
                        {display: '总数(个)', name: '3', width: '0.1', align: "center"},
                        {display: '平均处理时长(h)', name: '4', width: '0.1', align: "center"},
                        {
                            display: '总数(个)',
                            name: '5',
                            width: '0.1',
                            align: "center",
                            unit: '%',
                            css: {'color': 'blue', 'font-size': '15px'}
                        },
                        {display: '平均处理时长(h)', name: '6', width: '0.1', align: "center"}
                    ]
                ],
            leftContent:		           //表格左边分页工具条内容
                [
                    {
                        input: 'label',
                        type: 'label',
                        show: Msg.gridParam.pageShowCount,
                        fix: true,
                        name: 'plabel',
                        ids: 'plabel_0'
                    },
                    {
                        input: 'select',
                        type: 'select',
                        show: 'rps',
                        fix: false,
                        name: 'pselect',
                        ids: 'pselect_rps',
                        right: 6
                    },
                    {
                        input: 'label',
                        type: 'label',
                        show: Msg.gridParam.emptyMsg,
                        fix: true,
                        name: 'plabel',
                        ids: 'plabel_totalRecords'
                    }
                ],
            rightContent:		           //表格左边分页工具条内容
                [
                    {
                        input: 'span',
                        type: 'button',
                        show: '',
                        fix: true,
                        name: 'pbutton',
                        ids: 'pbutton_first',
                        width: 24,
                        height: 24,
                        left: 3,
                        right: 3
                    },
                    {
                        input: 'span',
                        type: 'button',
                        show: '',
                        fix: true,
                        name: 'pbutton',
                        ids: 'pbutton_previous',
                        width: 24,
                        height: 24,
                        left: 3,
                        right: 3
                    },
                    {
                        input: 'label',
                        type: 'label',
                        show: 'currentPage',
                        fix: false,
                        name: 'plabel_curPage',
                        ids: 'plabel_currentPage1',
                        width: 'auto'
                    },
                    {
                        input: 'span',
                        type: 'button',
                        show: '',
                        fix: true,
                        name: 'pbutton',
                        ids: 'pbutton_next',
                        width: 24,
                        height: 24,
                        left: 3,
                        right: 3
                    },
                    {
                        input: 'span',
                        type: 'button',
                        show: '',
                        fix: true,
                        name: 'pbutton',
                        ids: 'pbutton_last',
                        width: 24,
                        height: 24,
                        left: 3,
                        right: 10
                    },
                    {
                        input: 'label',
                        type: 'label',
                        show: Msg.gridParam.beforePageText,
                        fix: true,
                        name: 'plabel',
                        ids: 'plabel_3',
                        width: 15
                    },
                    {
                        input: 'label',
                        type: 'label',
                        show: 'currentPage',
                        fix: false,
                        name: 'plabel',
                        ids: 'plabel_currentPage2',
                        width: 'auto'
                    },
                    {
                        input: 'label',
                        type: 'label',
                        show: Msg.gridParam.afterPageText,
                        fix: true,
                        name: 'plabel',
                        ids: 'plabel_4',
                        width: 10
                    },
                    {
                        input: 'label',
                        type: 'label',
                        show: 'totalPage',
                        fix: false,
                        name: 'plabel',
                        ids: 'plabel_totalPage',
                        width: 'auto'
                    },
                    {
                        input: 'label',
                        type: 'label',
                        show: Msg.gridParam.mPageText,
                        fix: true,
                        name: 'plabel',
                        ids: 'plabel_5',
                        width: '20'
                    },
                    {
                        input: 'label',
                        type: 'label',
                        show: Msg.gridParam.jumpTo,
                        fix: true,
                        name: 'plabel',
                        ids: 'plabel_6',
                        width: 26,
                        left: 10
                    },
                    {
                        input: 'input',
                        type: 'text',
                        show: 'toPage',
                        fix: false,
                        name: 'ptext',
                        ids: 'ptext_toPage',
                        width: 26,
                        height: 26,
                        right: 3
                    },
                    {
                        input: 'label',
                        type: 'label',
                        show: Msg.gridParam.mPageText,
                        fix: true,
                        name: 'plabel',
                        ids: 'plabel_7',
                        width: 15
                    },
                    {
                        input: 'span',
                        type: 'button',
                        show: 'GO',
                        fix: true,
                        name: 'pbutton_jumpTo',
                        ids: 'pbutton_jumpTo',
                        width: 26,
                        height: 26
                    }
                ]
        }, options);

        /**
         * 函数集合
         */
        var g = {
            /**
             * 初始化ID变量信息
             */
            init: function () {
                g.p = p;
                p.selectedRecords = [];
                p.selector = $(t).attr('id');
                p.wholeID = p.selector + 'GridTable';
                p.titleID = p.selector + 'GridTableTitle';
                p.headerID = p.selector + 'GridTableHeader';
                p.bodyID = p.selector + 'GridTableBody';
                p.pageBarID = p.selector + 'GridTablePageBar';
                $(t).empty();
            },
            /**
             * 数组复制函数
             */
            _arrayCopy: function (array) {
                var copy = null;
                if (array && array instanceof Array) {
                    copy = [];
                    if (array[0][0]) {
                        $.each(array, function () {
                            copy.push(this.concat());
                        });
                    } else {
                        copy = array.concat();
                    }
                }
                return copy;
            },
            /**
             * 父窗大小变化的回调函数
             */
            resize: function () {
                if (!p.resizable) return;
                g.getSize();
                $('#' + p.wholeID).css({'width': p.width});
                if (p.title) {
                    $('#' + p.titleID).css({'width': p.width});
                }
                if (p.header) {
                    $('#' + p.headerID).css({'width': p.width});
                }
                if (p.body) {
                    $('#' + p.bodyID).css({'width': p.width});
                }
                if (p.pageBar) {
                    $('#' + p.pageBarID).css({'width': p.width});
                }
                //p.body && g.addData();
                p.body && g.resizeBox();
            },
            resizeBox: function () {
                setTimeout(function () {
                    $(t).find('table').filter(function (index, val) {
                        if (index < 2) {
                            var resizeDomList = $('>tbody>tr>.GridItem', $(val)).not('.lastItem, .noResize');
                            $.each(resizeDomList, function (i, t) {
                                var w = $(t).attr('data-width');
                                var rw = g.calWidth(w, p.col_num);
                                p.singalLineHeaderTable && $('>div', $(t)).width(rw);
                                $(t).width(rw);
                                $(t).attr('width', rw);
                            });
                        }
                    });
                    if (p.pageBar) {
                        if (p.width < 678) {
                            $('.GridTableToolBarBodyLeft', $('#' + p.pageBarID)).hide();
                            if (p.width < 478) {
                                $('.GridTableToolBarBodyRight .plabel, .GridTableToolBarBodyRight .ptext, .GridTableToolBarBodyRight .pbutton_jumpTo', $('#' + p.pageBarID)).hide();
                            } else {
                                $('.GridTableToolBarBodyRight .plabel, .GridTableToolBarBodyRight .ptext, .GridTableToolBarBodyRight .pbutton_jumpTo', $('#' + p.pageBarID)).show();
                            }
                        } else {
                            $('.GridTableToolBarBodyLeft', $('#' + p.pageBarID)).show();
                            $('.GridTableToolBarBodyRight .plabel, .GridTableToolBarBodyRight .ptext, .GridTableToolBarBodyRight .pbutton_jumpTo', $('#' + p.pageBarID)).show();
                        }
                    }
                    if (!$('#' + p.selector + 'GridTableBody').hasClass('autoHeightBody')) {
                        $('#' + p.selector + 'GridTableBody').height(p.height - $('#' + p.selector + 'GridTableHeader').height());
                    }
                }, 0);
            },
            /**
             * 获取父窗的宽度，当作改表格插件宽度
             */
            getSize: function () {
                if (p.parent) {
                    p.width = $('#' + p.parent).width();
                    p.bodyWidth = p.width;
                    (p.clickSelect && p.isShowSelect) && (p.bodyWidth -= p.line_height);
                    p.expand && (p.bodyWidth -= p.line_height);
                    return;
                }
                var node = $(t);
                while (!node.width()) {
                    node = node.parent();
                }
                p.width = node.width();
                p.bodyWidth = p.width;
                (p.clickSelect && p.isShowSelect) && (p.bodyWidth -= p.line_height);
                p.expand && (p.bodyWidth -= p.line_height);

                return p.width;
            },
            /**
             * 计算元素宽度
             * @param width 宽度表示值
             * @param cols 总列数
             * @returns {Number | *} 实际宽度值
             */
            calWidth: function (width, cols) {
                if (width) {
                    if (width <= 1) {
                        if (cols) {
                            return Math.round(width * ((p.bodyWidth - p.col_num * 2) + cols / 2));
                        }
                        return Math.round(width * (p.bodyWidth - p.col_num * 2));
                    }
                    else if ((width + "").indexOf('%') != -1) {
                        var index = (width + "").indexOf('%');
                        var w = width.substring(0, index - 1);
                        return Math.round((w * p.bodyWidth) / 100);
                    }
                }
                else if (cols) {
                    return Math.round((p.width - p.col_num * 2) / cols - cols);
                }
                else {
                    return p.width;
                }
            },
            /**
             * 创建表格整体的DIV
             */
            createwhole: function () {
                var div = $("<div class='GridTableDiv' id='" + p.wholeID + "'/>");
                //div.css({'width': g.calWidth()});
                $(t).append(div);
            },
            /**
             * 创建表格选中项展示板
             */
            createSelectedShowBox: function () {
                var div = $('<ul></ul>').addClass('selectedShowBox');
                $('#' + p.wholeID).append(div);
            },
            /**
             * 创建表格标题
             */
            createTitle: function () {
                var div = $("<div class='GridTableTitleDiv' id='" + p.titleID + "'/>");
                div.css({'height': p.line_height});
                $('#' + p.wholeID).append(div);
                if (p.titleText) {
                    div.addClass('SingleTitle').html(p.titleText);
                    return;
                }
                var tableContent = $('<table width="100%" class="GridTableTitle" cellpadding="0" border="0"/>')
                    .attr('cellspacing', p.title_cellspacing);
                div.append(tableContent);
                if (p.titleModel) {
                    var trContent = $("<tr/>").css({'height': p.line_height});

                    tableContent.append(trContent);
                    if (p.titleModel[0]) {
                        g.createTitleLeft(trContent, p.titleModel[0]);
                    }
                    if (p.titleModel[1]) {
                        g.createTitleRight(trContent, p.titleModel[1]);
                    }
                }
            },
            /**
             * 创建表格标题左边内容
             */
            createTitleLeft: function (trContent, data) {
                var tdContent = $("<td style='text-align:left'; width='50%' class='GridTableTitleLeftTD'/>");
                trContent.append(tdContent);
                var tableContent = $('<table class="GridTableTitle" cellpadding="0" border="0"/>')
                    .attr('cellspacing', p.title_cellspacing);
                tdContent.append(tableContent);
                g.createTitleTR(tableContent, data);
            },
            /**
             * 创建表格标题右边内容
             */
            createTitleRight: function (trContent, data) {
                var tdContent = $("<td style='text-align:right' width='50%' class='GridTableTitleRightTD'/>");
                trContent.append(tdContent);
                var tableContent = $('<table class="GridTableTitle" cellpadding="0" border="0"/>')
                    .attr('cellspacing', p.title_cellspacing);
                tdContent.append(tableContent);
                g.createTitleTR(tableContent, data);
            },
            /**
             * 创建表格标题tr内容
             */
            createTitleTR: function (tableContent, data) {
                var trContent = $("<tr class='GridTableTitleTR'/>");
                $.each(data, function (i) {
                    var td = $('<td/>');
                    this.width && td.attr('width', g.calWidth(this.width));
                    var content = $("<div/>");
                    if (this.before) {
                        content.append(this.before.css({
                            'display': 'inline-block',
                            'vertical-align': 'middle',
                            'margin-right': '10px'
                        }));
                    }
                    content.append(this.display);
                    if (this.after) {
                        content.append(this.after.css({
                            'display': 'inline-block',
                            'vertical-align': 'middle',
                            'margin-left': '10px'
                        }));
                    }
                    td.append(content);
                    if (this.extend) {
                        for (var key in this.extend) {
                            if (this.extend.hasOwnProperty(key)) {
                                content.attr(key, this.extend[key]);
                            }
                        }
                    }
                    this.rowspan ? td.attr('rowspan', this.rowspan) : 0;
                    this.colspan ? td.attr('colspan', this.colspan) : 0;
                    this.css ? content.css(this.css) : 0;
                    this.fnClick ? content.click(this.fnClick) : 0;
                    this.hide ? content.hide() : 0;
                    this.content == '' ? content.html('') : 0;
                    this.align ? td.css('text-align', this.align) : td.css('text-align', p.align);
                    trContent.append(td);
                });
                tableContent.append(trContent);
            },
            /**
             * 创建表格表头div
             */
            createHeader: function () {
                var div = $("<div class='GridTableHeaderDiv' id='" + p.headerID + "'/>");
                //div.css({'width': g.calWidth()});
                $('#' + p.wholeID).append(div);
                g.createHeaderTable(div);
            },
            /**
             * 创建表格表头table
             */
            createHeaderTable: function (div) {
                div.empty();
                var tableContent = $('<table class="GridTableHeader" width="100%" cellpadding="0" border="0"/>')
                    .attr('cellspacing', p.header_cellspacing);
                div.append(tableContent);

                if (p.colModel) {
                    p.col_num = g.createHeaderTR(tableContent, p.colModel);
                    p.colModelCopy = g._arrayCopy(p.colModel);
                    div.attr('singalLineHeaderTable', true);
                    p.singalLineHeaderTable = true;
                } else {
                    g.resetColModel();
                    var rcols = 0;
                    p.col_num = p.colModelCopy.length;
                    div.attr('singalLineHeaderTable', false);
                    p.singalLineHeaderTable = false;
                    g.createMitlHeadeLayoutTR(tableContent, p.colModelCopy);
                    $.each(p.colModels, function () {
                        rcols = g.createHeaderTR(tableContent, this, rcols);
                    });
                }
            },

            /**
             * 绘制多行表头布局行
             * @param tableContent
             * @param data
             * @returns {number}
             */
            createMitlHeadeLayoutTR: function (tableContent, data) {
                var trContent = $("<tr/>").addClass('tableLayoutLine');
                var rcols = 0;
                $.each(data, function (i) {
                    if (!this.hide) {
                        rcols += (+this.colspan || 1);
                    }
                });
                if (p.clickSelect && p.isShowSelect) {
                    trContent.append(
                        $('<th/>').addClass('noResize').attr('width', p.line_height / 2).attr('height', 1)
                    );
                }
                if (p.expand) {
                    trContent.append(
                        $('<th/>').addClass('noResize').attr('width', p.line_height / 2).attr('height', 1)
                    );
                }

                $.each(data, function (i, t) {
                    var th = $('<th/>').addClass('GridItem').attr('data-width', t.width)
                        .attr('height', 1).attr('name', t.name);
                    th.attr('width', g.calWidth(t.width, rcols));

                    t.colspan ? th.attr('colspan', t.colspan) : 0;
                    t.hide ? th.hide() : 0;
                    trContent.append(th);
                });
                tableContent.append(trContent);
                return rcols;
            },

            /**
             * 创建表格表头行
             */
            createHeaderTR: function (tableContent, data, totalCols) {
                var trContent = $("<tr class='GridTableHeaderTH'/>");
                //if (p.clickSelect && !p.singleSelect && p.isAllSelect) trContent.attr('title', Msg.GridTable);
                if (p.isAllSelect) {
                    trContent.click(function () {
                        g.singleClickHeaderLine(trContent, false);
                    });
                    trContent.dblclick(function () {
                        g.doubleClickHeaderLine(trContent);
                    });
                }

                var shifting = 0;
                var rcols = 0, rrows = 0;
                $.each(data, function (i) {
                    if (!this.hide) {
                        shifting++;
                        rcols += (+this.colspan || 1);
                        rrows < +this.rowspan && (rrows = this.rowspan);
                    }
                });

                if (!totalCols && (p.clickSelect && p.isShowSelect)) {
                    var th = $('<th/>').addClass('noResize').attr('rowspan', rrows)
                        .attr('width', p.line_height).attr('height', p.line_height).css('text-align', 'center');
                    var div = $('<div/>').css({'width': p.line_height, 'height': p.line_height});
                    var cthch;
                    if (p.singleSelect) {
                        cthch = $('<input type="radio" />')
                            .attr('name', p.selector + '_single_' + (p.idProperty || p.colModelCopy[0].name)).hide();
                    } else {
                        cthch = $('<input type="checkbox"/>');
                        !p.isAllSelect && cthch.hide();
                    }
                    var m = (p.line_height - 13) / 2;
                    cthch.css({'margin': m}).addClass('HeaderCheckBox')
                        .click(function () {
                            cthch[0].checked = !cthch[0].checked;
                        });
                    div.append(cthch);
                    th.append(div);
                    trContent.append(th);
                }
                if (!totalCols && p.expand) {
                    var th = $('<th/>').addClass('ExpandBox').addClass('noResize').attr('rowspan', rrows)
                        .attr('width', p.line_height).attr('height', p.line_height).css('text-align', 'center');
                    var div = $('<div/>').css({'width': p.line_height, 'height': p.line_height});
                    div.addClass('HeaderExpand');
                    th.append(div);
                    trContent.append(th);
                }

                $.each(data, function (i, t) {
                    var th = $('<th/>').addClass('GridItem').attr('data-width', t.width)
                        .attr('height', p.line_height).attr('name', t.name);
                    var content = $("<div/>");
                    totalCols -= (t.colspan || 1);
                    //if (this.colspan && t.colspan > 1) {
                    //    th.attr('width', g.calWidth(t.width, rcols));
                    //    //content.css({'width': g.calWidth(t.width, rcols)});
                    //    content.css({'width': '100%'});
                    //} else {
                    if (i != data.length - 1) { // TODO
                        th.attr('width', g.calWidth(t.width, rcols));
                        //th.css('width', g.calWidth(t.width, rcols));
                        //content.css({'width': g.calWidth(t.width, rcols)});
                    } else {
                        th.addClass('lastItem');
                        if (totalCols >= 0) {
                            th.attr('width', g.calWidth(t.width, rcols));
                            th.css('width', g.calWidth(t.width, rcols));
                        }
                        //content.css({'width': g.calWidth(t.width, rcols)});
                        content.css({'width': '100%'});
                    }
                    //}

                    if (t.before) {
                        content.append(t.before.css({
                            'display': 'inline-block',
                            'vertical-align': 'middle',
                            'margin-right': '10px'
                        }));
                    }
                    content.append(t.display);

                    if (t.after) {
                        content.append(t.after.css({
                            'display': 'inline-block',
                            'vertical-align': 'middle',
                            'margin-left': '10px'
                        }));
                    }

                    if (t.order) {
                        var sortBy = $('<i/>').addClass('sortBy');
                        sortBy.click(function (e) {
                            p.params['orderBy'] = t.name;
                            if ($(this).hasClass('asc')) {
                                $('.sortBy', tableContent).removeClass('asc desc');
                                $(this).removeClass('asc').addClass('desc');
                                p.params['sort'] = 'desc';
                            } else {
                                $('.sortBy', tableContent).removeClass('asc desc');
                                $(this).addClass('asc').removeClass('desc');
                                p.params['sort'] = 'asc';
                            }
                            g.refreshPage();
                            e.stopPropagation();
                        });
                        if (p.params && p.params['orderBy'] == t.name) {
                            sortBy.addClass(p.params['sort'] || 'asc');
                        }
                        content.append(sortBy);
                    }

                    th.append(content);
                    if (t.extend) {
                        for (var key in this.extend) {
                            if (t.extend.hasOwnProperty(key)) {
                                th.attr(key, t.extend[key]);
                            }
                        }
                    }
                    t.rowspan ? th.attr('rowspan', t.rowspan) : 0;
                    t.colspan ? th.attr('colspan', t.colspan) : 0;
                    t.hide ? th.hide() : 0;
                    t.content == '' ? th.html('') : 0;
                    th.css('text-align', p.align);
                    trContent.append(th);
                });
                tableContent.append(trContent);
                return rcols;
            },
            /**
             * 复制json数据
             */
            clone: function (data) {
                var copy = {};
                for (var key in data) {
                    copy[key] = data[key];
                }
                return copy;
            },
            /**
             * 重新整理表头模型数据，去除合并单元格的影响
             */
            resetColModel: function () {
                var colModels = g._arrayCopy(p.colModels);
                $.each(colModels, function (i) {
                    for (var j = 0; ; j++) {
                        if (!colModels[i][j]) {
                            break;
                        }
                        if (colModels[i][j].colspan && !colModels[i][j].colCopy) {
                            var colspan = parseInt(colModels[i][j].colspan);
                            for (var k = j + 1; k < j + colspan; k++) {
                                var that = g.clone(colModels[i][j]);
                                that.colCopy = true;
                                colModels[i].splice(k, 0, that);
                            }
                            j += colspan - 1;
                        }
                    }
                });
                $.each(colModels, function (i) {
                    $.each(this, function (j) {
                        if (this.rowspan && !this.rowCopy) {
                            var rowspan = parseInt(this.rowspan);
                            for (var k = i + 1; k < colModels.length && k < i + rowspan; k++) {
                                var that = g.clone(this);
                                that.rowCopy = true;
                                colModels[k].splice(j, 0, that);
                            }
                        }
                    });
                });
                $.each(colModels, function (i) {
                    $.each(this, function (j) {
                        if (this.colspan && this.colCopy) {
                            colModels[i].splice(j, 1)
                        }
                    });
                });
                var max = 0;
                for (var i = 1; i < colModels.length; i++) {
                    if (colModels[i].length >= colModels[i - 1].length) {
                        max = i;
                    }
                }
                p.colModelCopy = colModels[max].concat();
            },
            /**
             * 创建表格主体
             */
            createBody: function () {
                var div = $('<div class="GridTableBodyDiv" id="' + p.bodyID + '" />');
                //div.css({'width': g.calWidth()});
                var tableContent = $('<table class="GridTableBody" cellpadding="0" border="0"/>')
                    .attr('cellspacing', p.body_cellspacing);
                var overflowY = 'auto';
                if (!p.overflow) {
                    overflowY = 'hidden';
                }
                p.max_height && div.css({
                    'max-height': p.max_height + 'px',
                    'overflow-y': overflowY,
                    'overflow-x': 'hidden'
                });
                if (!p.height || p.height == 'auto') {
                    div.addClass('autoHeightBody');
                } else {
                    div.height(p.height - $('#' + p.selector + 'GridTableHeader').height());
                }
                div.append(tableContent);
                $('#' + p.wholeID).append(div);
            },
            /**
             * 拓展列内容，实际上不显示，只是为了可以取到数据
             */
            expandColModel: function () {
                if (p.data.length > 0) {
                    if (!p.colModelCopy) {
                        p.colModelCopy = g._arrayCopy(p.colModel);
                    }
                    var d = p.data[0];
                    for (var key in d) {
                        if (d.hasOwnProperty(key)) {
                            var found = false;
                            for (var i = 0; i < p.colModelCopy.length; i++) {
                                if (p.colModelCopy[i].name == key) {
                                    found = true;
                                    break;
                                }
                            }
                            if (!found) {
                                var line = {};
                                line.display = key;
                                line.name = key;
                                line.hide = true;
                                line.width = 0.1;
                                p.colModelCopy.unshift(line);
                            }
                        }
                    }
                }
            },

            /**
             * 自定义展开方式,
             */
            appendRow: function (index, dataList) {
                g.clearAppendRow();
                if (dataList.length <= 0) {
                    return;
                }
                $.each(dataList, function (i) {
                    var trContent = g.createRow(this, i);
                    $(trContent).attr("index", "subset");
                    $(trContent).removeClass('SingleBodyLine');
                    $(trContent).removeClass('DoubleBodyLine');
                    $(trContent).addClass(index % 2 == 0 ? 'SingleBodyLine' : 'DoubleBodyLine');
                    /*动态判断是否需要显示checkbox
                     $.isFunction(p.checkboxFlag) && !p.checkboxFlag(this) && $(trContent).find(".noResize input[type='checkbox']").css("visibility","hidden");*/
                    $(t).find("tr[index='" + index + "']").after(trContent);
                });
            },

            clearAppendRow: function () {
                $('#' + p.bodyID + '.GridTableBodyDiv tr[index="subset"]').each(function (i, row) {
                	var record = g.getData($(row));
                	g.map.remove(record[p.idProperty || p.colModelCopy[0].name]);
                    $(row).remove();
                });
                return true;
            },

            createRow: function (that, i) {
                var trContent = $("<tr/>").css({'height': p.line_height}).attr('index', i);
                trContent.click(function () {
                    g.singleClickBodyLine(trContent, false);
                });
                trContent.dblclick(function () {
                    g.doubleClickBodyLine(trContent, true);
                });
                if (i % 2 == 0)
                    trContent.addClass('SingleBodyLine');
                else
                    trContent.addClass('DoubleBodyLine');
                var index = i;
                if (p.linePic) {
                    trContent.append($("<td/>").css('text-align', 'center'));
                }

                var shifting = 0;
                var rcols = 0;
                var colModel = p.colModelCopy;
                $.each(colModel, function (i) {
                    if (this.hide != false) {
                        shifting++;
                    }
                    rcols += (+this.colspan || 1);
                });
                if (p.clickSelect && p.isShowSelect) {
                    var td = $('<td/>').addClass('noResize')
                        .attr('width', p.line_height).attr('height', p.line_height).css('text-align', 'center');
                    var div = $('<div/>').css({
                        'width': p.line_height,
                        'height': p.line_height,
                        "position": "relative"
                    });
                    var cthch;
                    if (p.singleSelect) {
                        cthch = $('<input type="radio" />')
                            .attr('name', p.selector + '_single_' + (p.idProperty || p.colModelCopy[0].name));
                    } else {
                        cthch = $('<input type="checkbox"/>');
                    }
                    var m = (p.line_height - 13) / 2;
                    cthch.css({'margin': m}).addClass('BodyCheckBox')
                        .click(function () {
                            cthch[0].checked = !cthch[0].checked;
                        });
                    var radioDiv = $("<div/>").css({
                        "position": "absolute",
                        "top": "0",
                        "left": "0",
                        "right": "0",
                        "bottom": "0"
                    });
                    div.append(radioDiv).append(cthch);
                    td.append(div);
                    trContent.append(td);
                }
                if (p.expand) {
                    var td = $('<td/>').addClass('noResize')
                        .attr('width', p.line_height).addClass('ExpandBox')
                        .attr('height', p.line_height).css('text-align', 'center');
                    var div = $('<div/>').css({
                        'width': p.line_height,
                        'height': p.line_height,
                        "position": "relative"
                    });
                    var key = that[p.idProperty || p.colModelCopy[0].name];
                    if (key === undefined && (p.idProperty || p.colModelCopy[0].name))
                        key = eval('that.' + (p.idProperty || p.colModelCopy[0].name));
                    // TODO 1、当前行高亮， 2、刷新表格的响应和容器大小变化关系
                    div.addClass('BodyExpand').click(function (e) {
                        if ($(this).hasClass('Disabled')) {
                            return;
                        }

                        if (p.expandIndex != null && p.expandIndex != undefined) {
                            var box = $(t).find("tr.child_" + p.expandIndex);
                            box.hasClass('expanded') && $.isFunction(p.fold) && p.fold(box, p.expandIndex);
                        }

                        $(this).parentsUntil('tr').parent().siblings('.child').removeClass('expanded');
                        $(this).parentsUntil('tr').parent().siblings('[index]').removeClass('intoExpand');
                        $(this).parentsUntil('tr').parent().siblings('[index]').find('.BodyExpand').removeClass('expanded');
                        if ($(this).hasClass('expanded')) {
                            p.expandIndex = null;
                            $(this).removeClass("expanded");
                            trContent.removeClass('intoExpand');
                            $(t).find("tr[index='child']").remove();
                            g.clearAppendRow();
                        } else {
                            p.expandIndex = key || i;
                            $(this).parentsUntil('tr').parent().siblings('.child_' + (key || i)).addClass('expanded');
                            $(this).addClass("expanded");
                            trContent.addClass('intoExpand');

                            var expandBox = $('div.expand-box', $(this).parentsUntil('tr').parent().siblings('.child_' + (key || i)));
                            $('div.expand-box', $(this).parentsUntil('tr').parent().siblings('.child')).empty();
                            g.clearAppendRow() && $.isFunction(p.expand) && p.expand(that, expandBox, i);
                        }
                        e.stopPropagation();
                    });
                    if (p.expandIndex == (key || i)) {
                        div.addClass('expanded');
                        trContent.addClass('intoExpand');
                    }
                    //如果没有expand按钮标记函数,或者函数判断当前行需要展开
                    if (!$.isFunction(p.expandFlag) || p.expandFlag(that)) {
                        td.append(div);
                    }
                    //如果有expand按钮禁用标记函数,并且函数判断当前行需要禁用
                    if ($.isFunction(p.expandDisableFlag) && p.expandDisableFlag(that)) {
                        div.addClass('Disabled');
                    }

                    trContent.append(td);
                }

                $.each(p.colModelCopy, function (i, t) {
                    var v = that[t.name];
                    if (v === undefined && t.name) v = eval('that.' + t.name);
                    var td = $("<td/>").addClass('GridItem').attr('data-width', t.width)
                        .attr('title', (
                            v === null || v === undefined ? undefined
                                : ('' + v).replaceHTMLChar().replace(/「/g, '[').replace(/」/g, ']')
                        ));

                    var div = $("<div/>").html((g.handleData(v) + g.handleData(this.unit))
                        .replaceHTMLChar().replaceIllegalChar().replace(/「/g, '[').replace(/」/g, ']'))
                        .attr('value', v)
                        .attr('name', this.name).addClass('BodyTdContent')
                        .css({
                            'text-overflow': 'ellipsis',
                            'overflow': 'hidden',
                            'white-space': 'nowrap'
                        });
                    if (i != p.colModelCopy.length - 1) { // TODO
                        td.attr('width', g.calWidth(t.width, rcols));
                        td.css('width', g.calWidth(t.width, rcols));
                    } else {
                        //td.attr('width', g.calWidth(t.width, rcols));
                        //div.css('width', g.calWidth(t.width, rcols));
                        td.addClass('lastItem');
                        div.css('width', '100%');
                    }
//                    div.css('width', '100%');
                    td.append(div);
                    t.css && div.css(t.css);
                    t.fnInit && this.fnInit(div, v, that, index, trContent);
                    t.hide && td.hide();
                    t.align ? td.css('text-align', t.align) : td.css('text-align', p.align);
                    if (this.type == 'image') {
                        td.html($("<div class='trPicture'></div>"));
                    }
                    trContent.append(td);
                });
                return trContent;
            },

            /**
             * 添加表格主体内容单元格数据
             */
            addData: function () {
                g.expandColModel();
                var tableContent = $('table', '#' + p.bodyID).eq(0);
                tableContent.empty();
                if (!p.data || !(p.data instanceof Array)) {
                    return;
                }
                if (p.data.length <= 0) {
                    if (p.isShowNoData) {
                        var trContent = $("<tr/>").css({'height': p.line_height});
                        trContent.append($("<td/>").attr('colspan', (p.clickSelect && p.isShowSelect) ? p.col_num + 1 : p.col_num)
                            .css('text-align', 'center').html(Msg.reportTool.table[8]));
                        tableContent.append(trContent);
                    }
                    $('#' + p.bodyID).css('margin-top', '-1px');
                } else {
                    !p.singalLineHeaderTable && g.createMitlHeadeLayoutTR(tableContent, p.colModelCopy);
                    $.each(p.data, function (i) {
                        var trContent = g.createRow(this, i);
                        tableContent.append(trContent);
                        p.expand && tableContent.append(g.createExpandBox(this, i));
                    });
                }
                g.resizeBox();
                g.loadSuccess();

                var htrs = $('#' + p.headerID).find('tr:not(.child)');
                var btrs = $('#' + p.bodyID).find('tr:not(.child)');

                if (p.onLoadReady) {
                    p.onLoadReady(p.data, btrs, htrs, p.totalRecords);
                }

                if (p.isSearchRecordSelected || p.isRecordSelected) {
                    var num = 0;
                    var values = g.map.getKeys() || [];
                    for (var i = 0; i < p.data.length; i++) {
                        var v = p.data[i][p.idProperty || p.colModelCopy[0].name];
                        if (v === undefined && (p.idProperty || p.colModelCopy[0].name))
                            v = eval('p.data[i].' + (p.idProperty || p.colModelCopy[0].name));
                        if (values.contains(v)) {
                            $(btrs[i]).addClass('SelectedBodyLine');
                            p.isShowSelect && ($(btrs[i]).find('.BodyCheckBox')[0].checked = true);
                            num++;
                        }
                    }
                    if (num && num == p.data.length && !p.singleSelect) {
                        $(htrs).addClass('SelectedHeaderLine');
                        p.isShowSelect && ($(htrs).find('.HeaderCheckBox')[0].checked = true);
                    }
                }

                Menu.hasElementRight();
            },
            createExpandBox: function (that, i) {
                var index = that[p.idProperty || p.colModelCopy[0].name];
                if (index === undefined && (p.idProperty || p.colModelCopy[0].name))
                    index = eval('that.' + (p.idProperty || p.colModelCopy[0].name));
                var trContent = $("<tr/>").addClass('child child_' + (index || i));
                var colspan = p.col_num + 1;
                (p.clickSelect && p.isShowSelect) && colspan++;
                var tdContent = $("<td/>").attr('colspan', colspan);
                var content = $("<div/>").addClass('expand-box').css({
                    'height': p.expandBoxHeight,
                    'min-height': p.line_height
                });

                tdContent.append(content);
                trContent.append(tdContent);

                if (p.expandIndex == (index || i)) {
                    trContent.addClass('expanded');
                    $.isFunction(p.expand) && p.expand(that, content, i);
                }

                return trContent;
            },
            /**
             * 对单元格数据进行特殊处理
             */
            handleData: function (data) {
                if (data == null) return '';
                return data;
            },
            /**
             * 单击表格头行的处理函数
             */
            singleClickHeaderLine: function (trContent, doubleClick) {
                if (!p.clickSelect || p.singleSelect) return;
                var checkbox = trContent.find('.HeaderCheckBox')[0];
                if (doubleClick) {
                    trContent.addClass('SelectedHeaderLine');
                    checkbox.checked = true;
                } else {
                    trContent.toggleClass('SelectedHeaderLine');
                    checkbox.checked = checkbox.checked ? false : true;
                }

                if (trContent.hasClass('SelectedHeaderLine')) {
                    $('#' + p.bodyID + '.GridTableBodyDiv tr:not(.child)').each(function (i, row) {
                        g.singleClickBodyLine($(row), true);
                    });
                } else {
                    $('#' + p.bodyID + '.GridTableBodyDiv tr:not(.child)').each(function (i, row) {
                        g.singleClickBodyLine($(row), false);
                    });
                }
            },
            /**
             * 双击表格头行的处理函数
             */
            doubleClickHeaderLine: function (trContent) {
                g.singleClickHeaderLine(trContent, true);
            },
            /**
             * 单击表格主体行的处理函数
             *
             * @param trContent 操作行
             * @param doubleClick 是否是双击操作
             */
            singleClickBodyLine: function (trContent, doubleClick) {
                if (!p.clickSelect) return;
                if (p.singleSelect) {
                    g.map.clear();
                    trContent.siblings().each(function (i, row) {
                        $(row).removeClass('SelectedBodyLine');
                    });
                }
                var checkbox = trContent.find('.BodyCheckBox')[0];
                if (checkbox) {
                    if (doubleClick) {
                        trContent.addClass('SelectedBodyLine');
                        checkbox.checked = true;
                    } else {
                        if (p.singleSelect) {
                            checkbox.checked = trContent.hasClass('SelectedBodyLine');
                        }
                        trContent.toggleClass('SelectedBodyLine', !checkbox.checked);
                        checkbox.checked = !checkbox.checked;
                    }
                } else {
                    trContent.toggleClass('SelectedBodyLine', !trContent.hasClass('SelectedBodyLine'));
                }
                if (p.onSingleClick) {
                    p.onSingleClick(trContent, g.getData(trContent), trContent.hasClass('SelectedBodyLine'));
                }
                g.storageSelected(trContent);
                if (!p.singleSelect) {
                    var htrs = $('#' + p.headerID).find('tr:not(.child)');
                    var btrs = $('#' + p.bodyID).find('tr td.noResize input.BodyCheckBox');
//                    	$('#' + p.bodyID).find('tr:not(.child)');
                    var bstrs = $('.SelectedBodyLine', $('#' + p.bodyID));
                    if (bstrs.length && bstrs.length == btrs.length) {
                        htrs.addClass('SelectedHeaderLine');
                        htrs.find('.HeaderCheckBox')[0].checked = true;
                    } else {
                        htrs.removeClass('SelectedHeaderLine');
                        htrs.find('.HeaderCheckBox')[0].checked = false;
                    }
                }
            },
            /**
             * 双击表格主体行的处理函数
             */
            doubleClickBodyLine: function (trContent) {
                g.singleClickBodyLine(trContent, true);
                if (p.onDoubleClick) {
                    p.onDoubleClick(trContent, g.getData(trContent), trContent.hasClass('SelectedBodyLine'));
                }
            },
            /**
             * 记录选中项
             * @param trContent 操作行
             */
            storageSelected: function (trContent) {
                var record = g.getData(trContent);
                if (trContent.hasClass('SelectedBodyLine')) {
                    g.map.put(record[p.idProperty || p.colModelCopy[0].name], record);
                }
                else {
                    g.map.remove(record[p.idProperty || p.colModelCopy[0].name]);
                }
                g.refreshSelectedShowBox();
            },
            /**
             * 刷新选中项展示框
             */
            refreshSelectedShowBox: function () {
                $('.selectedShowBox', $(t)).empty();
                var values = g.map.getValues() || [];
                for (var i = 0; i < values.length; i++) {
                    var name = p.idProperty || p.colModelCopy[0].name;
                    var text = values[i][p.showSelectedName || name];
                    var key = values[i][name];

                    if (text === undefined && (p.showSelectedName || name))
                        text = eval('that.' + (p.showSelectedName || name));
                    if (key === undefined && name)
                        key = eval('that.' + name);

                    if (text) {
                        var item = $('<li>').attr('title', text);
                        item.append($('<div>').addClass('t').text(text));
                        item.append($('<div>x</div>').addClass('close').click((function (item, key) {
                            return (function () {
                                g.map.remove(key);
                                item.remove();
                                g.addData();
                            });
                        })(item, key)));
                        $('.selectedShowBox', $(t)).append(item);
                    }
                    if (i == values.length - 1) {
                        $('.selectedShowBox', $(t)).append('<div class="clear"></div>')
                    }
                }
            },
            /**
             * 选中项记录 JSON 数据 —— 类Map操作
             */
            map: {
                put: function (key, value) {
                    for (var i = 0; i < p.selectedRecords.length; i++) {
                        if (p.selectedRecords[i].key === key) {
                            p.selectedRecords[i].value = value;
                            return;
                        }
                    }
                    p.selectedRecords.push({'key': key, 'value': value});
                },
                remove: function (key) {
                    for (var i = 0; i < p.selectedRecords.length; i++) {
                        var v = p.selectedRecords.pop();
                        if (v.key === key) {
                            continue;
                        }
                        p.selectedRecords.unshift(v);
                    }
                },
                getKeys: function () {
                    var resultArr = [];
                    for (var i = 0; i < p.selectedRecords.length; i++) {
                        var v = p.selectedRecords[i];
                        resultArr.push(v.key);
                    }
                    return resultArr;
                },
                getValues: function () {
                    var resultArr = [];
                    for (var i = 0; i < p.selectedRecords.length; i++) {
                        var v = p.selectedRecords[i];
                        resultArr.push(v.value);
                    }
                    return resultArr;
                },
                clear: function () {
                    p.selectedRecords = [];
                }
            },
            /**
             * 获取表格行的一行数据，返回json格式
             */
            getData: function (trContent) {
                var record = {};
                trContent.find('.BodyTdContent').each(function () {
                    record[$(this).attr('name')] = $(this).attr('value');
                });
                return record;
            },
            /**
             * 创建分页工具条
             */
            pageBar: function () {
                g.addToolBar();
            },
            /**
             * 添加表格分页工具条
             */
            addToolBar: function () {
                var barDiv = $("<div />");
                barDiv.attr("id", p.pageBarID);
                barDiv.attr("class", "PageToolBar");
                barDiv.css({'width': g.calWidth(), 'height': p.toolBarHeight});

                $('#' + p.wholeID).append(barDiv);
                p.toolBar == 'hide' ? barDiv.hide() : 0;
                g.addBarTable(barDiv);
            },
            /**
             * 添加表格分页工具条框架
             */
            addBarTable: function (barDiv) {
                var tableContent = $("<div/>").addClass('GridTableBarBody');
                barDiv.append(tableContent);
                g.addToolBarContent(tableContent, 'Left');
                g.addToolBarContent(tableContent, 'Right');
            },
            /**
             * 添加表格分页工具条中的具体内容
             */
            addToolBarContent: function (trBarContent, type) {
                var content = [];
                var align = '';
                if (type == 'Left') {
                    content = p.leftContent;
                    align = "left";
                } else if (type == 'Right') {
                    content = p.rightContent;
                    align = "right";
                }
                var pan = $('<p/>').css('float', align).addClass('GridTableToolBarBody' + type);
                $.each(content, function (index, d) {
                    var input = $("<" + d.input + " />");
                    d.name && input.attr('class', d.name);
                    pan.append(input);
                    d.ids && input.attr('id', p.pageBarID + d.ids);
                    if (d.type == 'label') {
                        if (d.fix) {
                            input.css({'white-space': 'nowrap', 'text-overflow': 'ellipsis'});
                            d.show && input.html(d.show);
                        } else {
                            d.show && input.html(p[this.show]);
                            input.attr('size', '4');
                        }
                    } else if (d.type == 'select') {
                        d.width && input.css({"width": d.width});
                        d.height && input.css({"height": d.height});
                        var data = p[d.show];
                        for (var i = 0; i < data.length; i++) {
                            var option = $("<option />");
                            input.append(option);
                            option.val(data[i]);
                            option.html(data[i])
                        }
                    } else if (d.type == 'text') {
                        d.width && input.css({"width": d.width});
                        d.height && input.css({
                            "height": d.height, "text-align": "center"
                        });
                        d.show && input.val(p[d.show]);
                    } else if (d.type == 'button') {
                        input.css({
                            'vertical-align': 'middle',
                            'display': 'inline-block'
                        }).addClass("pbutton_on");
                        d.show && input.val(p[d.show]);
                        d.width && input.css({"width": d.width});
                        d.height && input.css({"height": d.height});
                        var div = $("<div/>");
                        d.ids && div.attr("class", d.ids);
                        d.width && div.css({"width": '100%'});
                        d.height && div.css({"height": '100%'});
                        input.append(div.text(d.show));
                    }
                    d.left && input.before($("<label/>").css("width", d.left));
                    d.right && input.after($("<label/>").css("width", d.right));
                });
                trBarContent.append(pan);
            },
            /**
             * 添加表格分页工具条中的事件响应
             */
            initEvents: function () {
                $('#' + p.pageBarID + "pselect_rps").change(function (data) {
                    p.currentPage = 1;
                    p.rp = p.rps[data.delegateTarget.selectedIndex];
                    g.refreshPage();
                });
                $('#' + p.pageBarID + "pbutton_first").click(function () {
                    if (p.currentPage != 1) {
                        p.currentPage = 1;
                        g.refreshPage();
                    }
                });
                $('#' + p.pageBarID + "pbutton_previous").click(function () {
                    if (p.currentPage > 1) {
                        p.currentPage -= 1;
                        g.refreshPage();
                    }
                });
                $('#' + p.pageBarID + "pbutton_next").click(function () {
                    if (p.currentPage < p.totalPage) {
                        p.currentPage = parseInt(p.currentPage) + 1;
                        g.refreshPage();
                    }
                });
                $('#' + p.pageBarID + "pbutton_last").click(function () {
                    if (p.currentPage != p.totalPage) {
                        p.currentPage = p.totalPage;
                        g.refreshPage();
                    }
                });
                $('#' + p.pageBarID + "ptext_toPage").keydown(function (event) {
                    if (event.keyCode == 13) {
                        g.jumpToPage();
                    }
                });
                $('#' + p.pageBarID + "pbutton_jumpTo").click(function () {
                    g.jumpToPage();
                });
                g.initToolBarSelect();
            },
            /**
             * go按钮跳转函数
             */
            jumpToPage: function () {
                var reg = /^[0-9]*[1-9][0-9]*$/;
                var pageS = $('#' + p.pageBarID + "ptext_toPage").val();
                if (reg.test(pageS)) {
                    pageS = parseInt(pageS);
                    if (pageS < 1) {
                        pageS = 1;
                    } else if (pageS > p.totalPage) {
                        pageS = p.totalPage;
                    } else if (pageS == p.currentPage) {
                        return;
                    }
                } else {
                    $('#' + p.pageBarID + "ptext_toPage").val(p.currentPage);
                    return;
                }
                p.currentPage = pageS;
                g.refreshPage();
            },
            /**
             * 初始化表格分页工具条中的select数据
             */
            initToolBarSelect: function () {
                var index = p.rps.indexOf(p.rp);
                if (index > -1) {
                    $('#' + p.pageBarID + "pselect_rps" + ' option:eq(' + index + ')').attr('selected', 'true');
                } else {
                    p.rp = p.rps[0];
                }

            },
            /**
             * 刷新表格整体内容
             */
            refreshPage: function (f) {
                if (f || !p.isRecordSelected) {
                    g.map.clear();
                }
                g.changeToolBarButtonStstus();
                g.changeParams();
                $.each($('#' + p.headerID + ' .GridTableHeaderTH'), function (i) {
                    var input = $(this).find('input[type=checkbox]');
                    if (input.length > 0) {
                        input[0].checked = false;
                        $(this).removeClass('SelectedHeaderLine');
                    }
                });
                $('#' + p.pageBarID + "plabel_totalRecords").html(Msg.gridParam.procMsg);
                if (p.url) {
                    $.http.ajax(p.url, p.params, function (data) {
                        if (data.success) {
                            if (data.data && data.data[p.list]) {
                                if (p.loadReady) {
                                    data.data = p.loadReady(data.data) || data.data;
                                }
                                p.totalRecords = data.data[p.total] ? data.data[p.total] : 0;
                                p.data = data.data[p.list] ? data.data[p.list] : 0;
                            } else {
                                $('#' + p.pageBarID + "plabel_totalRecords").html(Msg.gridParam.emptyMsg);
                                p.totalRecords = 0;
                                p.data = 0;
                            }
                        } else {
                            $('#' + p.pageBarID + "plabel_totalRecords").html(Msg.gridParam.emptyMsg);
                            if (p.loadError) {
                                p.loadError(data.data);
                            }
                            p.totalRecords = 0;
                            p.data = 0;
                        }
                        g.addData();
                    }, function (data) {
                        $('#' + p.pageBarID + "plabel_totalRecords").html(Msg.gridParam.emptyMsg);
                        if (p.loadError) {
                            p.loadError(data.data || data);
                        }
                        p.totalRecords = 0;
                        p.data = 0;
                        g.addData();
                    });
                } else if (p.prototypeData) {
                    var temp = {};
                    temp.list = p.prototypeData.slice();
                    temp.total = temp.list.length;
                    var data = {};
                    data.data = temp;
                    if (data.data && data.data[p.list]) {
                        if (p.loadReady) {
                            data.data = p.loadReady(data.data) || data.data;
                        }
                        p.totalRecords = data.data[p.total] ? data.data[p.total] : 0;
                        p.data = data.data[p.list] ? data.data[p.list] : 0;
                    } else {
                        $('#' + p.pageBarID + "plabel_totalRecords").html(Msg.gridParam.emptyMsg);
                        p.totalRecords = 0;
                        p.data = 0;
                    }
                    if (p.prototypeSort && $.isFunction(p.prototypeSort)) {
                        p.data.sort(p.prototypeSort(p.params['orderBy'], p.params['sort']))
                    }
                    p.data = p.data.slice((p.currentPage - 1) * p.rp, p.rp * p.currentPage);
                    g.addData();
                } else {
                    setTimeout(function () {
                        if (p.totalRecords == 0) {
                            $('#' + p.pageBarID + "plabel_totalRecords").html(Msg.gridParam.emptyMsg);
                        } else {
                            $('#' + p.pageBarID + "plabel_totalRecords")
                                .html(String.format(Msg.gridParam.displayMsg, p.totalRecords));
                        }
                    }, 100);
                }
            },
            /**
             * 后台数据获取成功，的回调函数
             */
            loadSuccess: function () {
                p.totalPage = Math.ceil(p.totalRecords / p.rp);
                p.totalPage = p.totalPage ? p.totalPage : 1;
                g.changeToolBarButtonStstus();
                $('#' + p.pageBarID + "plabel_currentPage1").html(p.currentPage);
                $('#' + p.pageBarID + "plabel_currentPage2").html(p.currentPage);
                $('#' + p.pageBarID + "plabel_totalPage").html(p.totalPage);
                $('#' + p.pageBarID + "ptext_toPage").val(p.currentPage);
                if (p.totalRecords == 0) {
                    $('#' + p.pageBarID + "plabel_totalRecords").html(Msg.gridParam.emptyMsg);
                } else {
                    $('#' + p.pageBarID + "plabel_totalRecords")
                        .html(String.format(Msg.gridParam.displayMsg, p.totalRecords));
                }
            },
            /**
             * 根据当前页和总页数改变工具条按钮状态
             */
            changeToolBarButtonStstus: function () {
                $(".pbutton", "#" + p.pageBarID).addClass("pbutton_on");
                $(".pbutton", "#" + p.pageBarID).removeClass("pbutton_dis");
                if (p.currentPage == 1) {
                    $('#' + p.pageBarID + "pbutton_first").removeClass("pbutton_on").addClass("pbutton_dis");
                    $('#' + p.pageBarID + "pbutton_previous").removeClass("pbutton_on").addClass("pbutton_dis");
                }
                if (p.currentPage == p.totalPage) {
                    $('#' + p.pageBarID + "pbutton_next").removeClass("pbutton_on").addClass("pbutton_dis");
                    $('#' + p.pageBarID + "pbutton_last").removeClass("pbutton_on").addClass("pbutton_dis");
                }
            },
            /**
             * 每次刷新前修改参数内容
             */
            changeParams: function () {
                p.params.page = p.currentPage;
                p.params.pageSize = p.rp;
            }
        };

        g.init();
        g.getSize();
        g.createwhole();
        p.isRecordSelected && p.showSelectedName && g.createSelectedShowBox();
        p.title && g.createTitle();
        p.header && g.createHeader();
        p.body && g.createBody();
        if (p.pageBar) {
            g.pageBar();
            g.initEvents();
        }
        p.body && (p.data ? g.addData() : g.refreshPage());

        $(t).resize(function () {
            g.resize();
        });
        g.resize();
        t.grid = g;
        t.p = p;
        return true;
    };

    var docLoaded = false;
    $(document).ready(function () {
        docLoaded = true;
    });

    /**
     * 绘制/初始化 表格
     */
    $.fn.GridTable = function (p) {
        return this.each(function () {
            if (!docLoaded) {
                $(this).hide();
                var t = this;
                $(document).ready(function () {
                    addGrid(t, p);
                });
            } else {
                addGrid(this, p);
            }
        });
    };

    /**
     * 扩展结点查询事件
     */
    $.fn.GridTableSearch = function (p) {
        return this.each(function () {
            if (this.grid) {
                this.p = $.extend(this.p, p);
                this.p.currentPage = 1;
                p && p.data ? this.grid.addData() : this.grid.refreshPage(!this.p.isSearchRecordSelected);
            }
        });
    };

    /**
     * 获取选中记录的JSON原型格式
     */
    $.fn.GridTableSelectedRecords = function () {
        var records = [];
        if (this[0] && this[0].grid)
            records = this[0].grid.map.getValues();
        return records;
    };

    /**
     * 初始化选中记录
     */
    $.fn.GridTableInitSelectedRecords = function (records) {
        return this.each(function (i, g) {
            if (g && g.grid && records) {
                $.each(records, function (n, t) {
                    g.grid.map.put(t[g.p.idProperty || g.p.colModel[0].name], t);
                });
                g.grid.refreshSelectedShowBox();
                //g.grid.addData();
            }
        });
    };

    /**
     * 刷新表格
     */
    $.fn.GridTableReload = function (p) {
        return this.each(function () {
            if (this.grid && p) $.extend(this.p, p);
            this.p.totalRecords = 0,
                this.p.currentPage = 1,
                this.p.totalPage = 1,
                this.p.toPage = 1,
                this.grid.refreshPage(true, true);
        });
    };

    /**
     * 刷新表格在当前页不做页面变更.但是查询是不能掉该方法的
     */
    $.fn.GridTableRefreshPage = function (p) {
        return this.each(function () {
            if (this.grid && p) $.extend(this.p, p);
            this.grid.refreshPage(true);
        });
    };

    /**
     * 获取当前页页码
     */
    $.fn.GridTableCurPage = function () {
        var curPage = 1;
        if (this[0] && this[0].grid)
            curPage = this[0].grid.p.currentPage;
        return curPage;
    };


    /**
     * 新增结构相同的行, expand的另一种方式
     */
    $.fn.GridTableAppendRow = function (index, dataList) {
        this[0].grid.appendRow(index, dataList);
    };

    return $;
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL0dyaWRUYWJsZS9HcmlkVGFibGUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIGpRdWVyeVxyXG4gKi9cclxuZGVmaW5lKFsnanF1ZXJ5JywgJ21haW4vcmlnaHQnLCAnY3NzIXBsdWdpbnMvR3JpZFRhYmxlL2Nzcy9HcmlkVGFibGUuY3NzJ10sIGZ1bmN0aW9uICgkLCBNZW51KSB7XHJcblxyXG4gICAgdmFyIGFkZEdyaWQgPSBmdW5jdGlvbiAodCwgb3B0aW9ucykge1xyXG4gICAgICAgIHZhciBwID0gJC5leHRlbmQoe30sIHtcclxuICAgICAgICAgICAgZXhwYW5kRmxhZzogJycsXHJcbiAgICAgICAgICAgIGV4cGFuZERpc2FibGVGbGFnOiAnJywgICAgICAgICAvL+WIl+ihqOWxleW8gOaYr+WQpuaYvuekuuS4uuemgeeUqOWbvuagh+WIpOaWreWHveaVsFxyXG4gICAgICAgICAgICB3aWR0aDogJ2F1dG8nLCAgICAgICAgICAgICAgICAgLy/pgInmi6nmoYblrr3luqZcclxuICAgICAgICAgICAgaGVpZ2h0OiAnYXV0bycsICAgICAgICAgICAgICAgIC8v6YCJ5oup5qGG6auY5bqmXHJcblxyXG4gICAgICAgICAgICB1cmw6ICcnLCAgICAgICAgICAgICAgICAgICAgICAgLy/ooajmoLzmlbDmja7lkI7lj7Dor7fmsYLlnLDlnYBcclxuICAgICAgICAgICAgbGlzdDogJ2xpc3QnLCAgICAgICAgICAgICAgICAgIC8v5ZCO5Y+w6K+35rGC55qE5pWw5o2u5YiX6KGo5ZCNXHJcbiAgICAgICAgICAgIHRvdGFsOiAndG90YWwnLCAgICAgICAgICAgICAgICAvL+WQjuWPsOivt+axgueahOaVsOaNruaAu+iusOW9leWQjVxyXG4gICAgICAgICAgICBwYXJhbXM6IHt9LCAgICAgICAgICAgICAgICAgICAgLy/or7fmsYLnmoTlj4LmlbBcclxuXHJcbiAgICAgICAgICAgIGhlYWRlcjogdHJ1ZSwgICAgICAgICAgICAgICAgICAvL+ihqOagvOaYr+WQpuacieihqOWktO+8jGZhbHNl5LiN5pi+56S677yMdHJ1ZeaYvuekulxyXG4gICAgICAgICAgICB0aXRsZTogZmFsc2UsICAgICAgICAgICAgICAgICAgLy/ooajmoLzmmK/lkKbmnInmoIfpopjvvIxmYWxzZeS4jeaYvuekuu+8jHRydWXmmL7npLpcclxuICAgICAgICAgICAgcGFnZUJhcjogdHJ1ZSwgICAgICAgICAgICAgICAgIC8v6KGo5qC85piv5ZCm5pyJ5bel5YW35p2h77yMZmFsc2XkuI3mmL7npLrvvIx0cnVl5pi+56S6XHJcbiAgICAgICAgICAgIGJvZHk6IHRydWUsXHRcdFx0XHQgICAgICAgLy/ooajmoLzmmK/lkKbmnInooajmoLzkuLvkvZPlhoXlrrnvvIxmYWxzZeS4jeaYvuekuu+8jHRydWXmmL7npLpcclxuICAgICAgICAgICAgdG9vbEJhcjogZmFsc2UsXHRcdFx0ICAgICAgIC8v6KGo5qC85piv5ZCm5pyJ6KGo5qC85bel5YW35p2h77yMZmFsc2XkuI3mmL7npLrvvIx0cnVl5pi+56S6XHJcblxyXG4gICAgICAgICAgICB0aXRsZVRleHQ6IGZhbHNlLFx0XHQgICAgICAgLy/ooajmoLznmoTmoIfpopjlhoXlrrnvvIxzdHJpbmflnotcclxuICAgICAgICAgICAgdGl0bGVfY2VsbHNwYWNpbmc6ICcwJyxcdCAgICAgICAvL3RpdGxl6Ze06ZqUXHJcbiAgICAgICAgICAgIGhlYWRlcl9jZWxsc3BhY2luZzogJzAnLCAgICAgICAvL2hlYWRlcumXtOmalFxyXG4gICAgICAgICAgICBib2R5X2NlbGxzcGFjaW5nOiAnMCcsXHQgICAgICAgLy9ib2R56Ze06ZqUXHJcbiAgICAgICAgICAgIHRvb2xCYXJfY2VsbHNwYWNpbmc6ICcwJywgICAgICAvL3Rvb2xCYXLpl7TpmpRcclxuICAgICAgICAgICAgb3ZlcmZsb3c6IHRydWUsICAgICAgICAgICAgICAgIC8v5piv5ZCm5ZCv55So5rua5Yqo5p2hXHJcbiAgICAgICAgICAgIHRpdGxlTW9kZWw6XHRcdFx0XHQgICAgICAgLy/ooajmoLznmoTlpI3mnYLmoIfpopjlhoXlrrnmqKHlnotcclxuICAgICAgICAgICAgICAgIFtcclxuICAgICAgICAgICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtkaXNwbGF5OiAn55S156uZ5ZCN56ewJywgZXh0ZW5kOiB7J2lkJzogJzExJ30sIGFsaWduOiBcImNlbnRlclwifSxcclxuICAgICAgICAgICAgICAgICAgICAgICAge2Rpc3BsYXk6ICfnlLXnq5nlkI3np7AnLCBhbGlnbjogXCJjZW50ZXJcIn0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtkaXNwbGF5OiAn55S156uZ5ZCN56ewJywgd2lkdGg6ICcwLjEnLCBhbGlnbjogXCJyaWdodFwifVxyXG4gICAgICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICAgIF0sXHJcblxyXG5cclxuICAgICAgICAgICAgbG9hZEVycm9yOiBmYWxzZSxcdFx0ICAgICAgIC8v5pWw5o2u6K+35rGC5aSx6LSl55qE5Zue6LCD5Ye95pWwXHJcbiAgICAgICAgICAgIGxvYWRSZWFkeTogZmFsc2UsXHRcdCAgICAgICAvL+aVsOaNruivt+axguaIkOWKn+eahOWbnuiwg+WHveaVsFxyXG5cclxuICAgICAgICAgICAgZGF0YTogZmFsc2UsXHRcdFx0XHQgICAvL+ihqOagvOWGheaJgOimgeWhq+WFheeahOaVsOaNrlxyXG4gICAgICAgICAgICBwcm90b3R5cGVEYXRhOiBmYWxzZSwgXHRcdFx0Ly/ljp/lnovmlbDmja4gbGlzdDpbXSDmlbDnu4RcclxuICAgICAgICAgICAgcHJvdG90eXBlU29ydDogZnVuY3Rpb24gKHByb3AsIHNvcnQpIHsgLy8g6buY6K6k5o6S5bqP5pa55rOVXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKG9iajEsIG9iajIpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXByb3AgfHwgIXNvcnQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciB2YWwxID0gb2JqMVtwcm9wXTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsMiA9IG9iajJbcHJvcF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpc05hTihOdW1iZXIodmFsMSkpICYmICFpc05hTihOdW1iZXIodmFsMikpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbDEgPSBOdW1iZXIodmFsMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbDIgPSBOdW1iZXIodmFsMik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWwxIDwgdmFsMikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJkZXNjXCIgPT0gc29ydC50b0xvd2VyQ2FzZSgpID8gMSA6IC0xO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsMSA+IHZhbDIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiZGVzY1wiID09IHNvcnQudG9Mb3dlckNhc2UoKSA/IC0xIDogMTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICBvblNpbmdsZUNsaWNrOiBmYWxzZSxcdCAgICAgICAvL+ihqOagvOihjOeCueWHu+S6i+S7tlxyXG4gICAgICAgICAgICBvbkRvdWJsZUNsaWNrOiBmYWxzZSxcdCAgICAgICAvL+ihqOagvOihjOWPjOWHu+S6i+S7tlxyXG4gICAgICAgICAgICBvbkxvYWRSZWFkeTogZmFsc2UsXHRcdCAgICAgICAvL+ihqOagvOS4u+S9k+WGheWuueWKoOi9veWujOaIkOeahOWbnuiwg+WHveaVsFxyXG5cclxuICAgICAgICAgICAgaXNTaG93U2VsZWN0OiB0cnVlLCAgICAgICAgICAgIC8v5piv5ZCm5pi+56S66YCJ5oup5pON5L2c5YiXXHJcbiAgICAgICAgICAgIHNpbmdsZVNlbGVjdDogZmFsc2UsIFx0ICAgICAgIC8v5Y+v5aSa6YCJ6L+Y5piv5Y2V6YCJ77yMdHJ1ZeWNlemAie+8jGZhbHNl5aSa6YCJXHJcbiAgICAgICAgICAgIGlzQWxsU2VsZWN0OiB0cnVlLCAgICAgICAgICAgICAvL+aYr+WQpuWPr+WFqOmAie+8iOW9k3NpbmdsZVNlbGVjdD1mYWxzZeeUn+aViO+8iVxyXG4gICAgICAgICAgICBjbGlja1NlbGVjdDogZmFsc2UsXHRcdCAgICAgICAvL+ihjOaYr+WQpuWPr+S7peeCueWHu1xyXG5cclxuICAgICAgICAgICAgbWF4X2hlaWdodDogJ2F1dG8nLFx0XHQgICAgICAgLy/mnIDlpKfpq5jluqZcclxuICAgICAgICAgICAgbGluZV9oZWlnaHQ6IDQwLFx0XHQgICAgICAgLy/ljZXooYzooYzpq5hcclxuICAgICAgICAgICAgY29sX3dpZHRoOiAxMDAsXHRcdFx0ICAgICAgIC8v6buY6K6k5YiX5a695bqmXHJcblxyXG4gICAgICAgICAgICBycDogMTAsXHRcdFx0XHRcdCAgICAgICAvL+ihqOagvOW9k+WJjemhteacgOWkmuijhei9veeahOiusOW9leadoeaVsFxyXG4gICAgICAgICAgICBycHM6IFsxMCwgMTUsIDMwLCA1MF0sXHQgICAgICAgLy/ooajmoLzoo4Xovb3nmoTorrDlvZXmnaHmlbBcclxuICAgICAgICAgICAgdG90YWxSZWNvcmRzOiAwLFx0XHQgICAgICAgLy/ooajmoLzmgLvorrDlvZXmlbBcclxuICAgICAgICAgICAgY3VycmVudFBhZ2U6IDEsXHRcdFx0ICAgICAgIC8v6KGo5qC85b2T5YmN6aG15pWwXHJcbiAgICAgICAgICAgIHRvdGFsUGFnZTogMSxcdFx0XHQgICAgICAgLy/ooajmoLzmgLvpobXmlbBcclxuICAgICAgICAgICAgdG9QYWdlOiAxLFx0XHRcdFx0ICAgICAgIC8v6KGo5qC86KaB6Lez6L2s55qE6aG15pWwXHJcblxyXG4gICAgICAgICAgICBhbGlnbjogJ2NlbnRlcicsXHRcdCAgICAgICAvL+m7mOiupOaOkueJiOexu+Wei1xyXG5cclxuICAgICAgICAgICAgY29sTW9kZWw6IG51bGwsXHRcdFx0ICAgICAgIC8v5Y2V6KGM6KGo5aS05qih5Z6L6K6+572u77yM5L2/55So5pa55byP5LiOY29sTW9kZWxz57G75Ly8XHJcbiAgICAgICAgICAgIGNvbE1vZGVsQ29weTogbnVsbCxcdFx0ICAgICAgIC8v5Y2V6KGM6KGo5aS05qih5Z6L5aSN5Yi2XHJcblxyXG4gICAgICAgICAgICByZXNpemFibGU6IHRydWUsXHRcdCAgICAgICAvL+aYr+WQpuiHqumAguW6lOWPmOWMllxyXG5cclxuICAgICAgICAgICAgcGFyZW50OiBmYWxzZSxcdFx0XHQgICAgICAgLy/niLbnqpdcclxuXHJcbiAgICAgICAgICAgIGlzU2hvd05vRGF0YTogZmFsc2UsICAgICAgICAgICAvL+aYr+WQpuWcqOaXoOaVsOaNruaXtuWcqOihqOagvOS4reaYvuekuuaPkOekuuS/oeaBr1xyXG4gICAgICAgICAgICBpc1JlY29yZFNlbGVjdGVkOiBmYWxzZSwgICAgICAgLy/ot6jpobXpgInmi6lcclxuICAgICAgICAgICAgaXNTZWFyY2hSZWNvcmRTZWxlY3RlZDogZmFsc2UsIC8v5piv5ZCm5Zyo5p+l6K+i5pe26K6w5b2V6YCJ5Lit6aG5LCBpc1JlY29yZFNlbGVjdGVkPXRydWXml7bnlJ/mlYhcclxuICAgICAgICAgICAgc2hvd1NlbGVjdGVkTmFtZTogZmFsc2UsICAgICAgIC8v5pi+56S66YCJ5Lit6aG55bGV56S65p2/XHJcbiAgICAgICAgICAgIGlkUHJvcGVydHk6IGZhbHNlLCAgICAgICAgICAgICAvL+S4u+mUru+8iOm7mOiupOmFjee9ruaooeWei+S4reeahOesrOS4gOWIl++8iVxyXG5cclxuICAgICAgICAgICAgZXhwYW5kOiBmYWxzZSwgICAgICAgICAgICAgICAgIC8ve0Jvb2xlYW4gfCBGdW5jdGlvbiAocmVjb3JkLCBib3gsIGluZGV4KX0g5piv5ZCm5Y+v5bGV5byA77yM5aaC5p6c6L+Z6YeM5piv5LiA5Liq5pa55rOV77yM6YKj5LmI5bGV5byA5pe25Lya5omn6KGM6K+l5pa55rOVXHJcbiAgICAgICAgICAgIGZvbGQ6IGZhbHNlLCAgICAgICAgICAgICAgICAgICAvL3tCb29sZWFuIHwgRnVuY3Rpb24gKGJveCwgaW5kZXgpfSDphY3lpZdleHBhbmTlj4LmlbDkvb/nlKjvvIzlpoLmnpxleHBhbmTkuLp0cnVl5oiW6ICF5pa55rOV77yM5Zyo5bGV5byA5bGC5pS26LW35p2l5pe25Lya5omn6KGM6K+l5pa55rOVXHJcbiAgICAgICAgICAgIGV4cGFuZEluZGV4OiBudWxsLCAgICAgICAgICAgICAvL+WIneWni+WxleW8gOihjOWPt++8jOWfuuaVsOS4uiAw77yM6buY6K6kIOWIneWni+aXtumDveS4jeWxleW8gFxyXG4gICAgICAgICAgICBleHBhbmRCb3hIZWlnaHQ6ICdhdXRvJywgICAgICAgLy/lsZXlvIDlrrnlmajnmoTpq5jluqbvvIzpu5jorqTkuLo6IOihjOmrmO+8iGxpbmUtaGVpZ2h0KVxyXG5cclxuICAgICAgICAgICAgY29sTW9kZWxzOlx0XHRcdFx0ICAgICAgIC8v5aSa6KGM6KGo5aS05qih5Z6L6K6+572uXHJcbiAgICAgICAgICAgICAgICBbXHRcdFx0XHRcdCAgICAgICAvL+WunuS+i1xyXG4gICAgICAgICAgICAgICAgICAgIFtcclxuICAgICAgICAgICAgICAgICAgICAgICAge2Rpc3BsYXk6ICfnlLXnq5nlkI3np7AnLCBuYW1lOiAnMCcsIHJvd3NwYW46ICcyJywgd2lkdGg6ICcwLjInLCBhbGlnbjogXCJjZW50ZXJcIn0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtkaXNwbGF5OiAn5bm2572R57G75Z6LJywgbmFtZTogJzcnLCByb3dzcGFuOiAnMicsIHdpZHRoOiAnMC4xJywgYWxpZ246IFwiY2VudGVyXCJ9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7ZGlzcGxheTogJ+mAhuWPmOWZqOexu+WeiycsIG5hbWU6ICc4Jywgcm93c3BhbjogJzInLCB3aWR0aDogJzAuMScsIGFsaWduOiBcImNlbnRlclwifSxcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogJ+W3peS9nOelqCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAnJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbHNwYW46ICcyJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAnMC4yJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsaWduOiBcImNlbnRlclwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmVmb3JlOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFmdGVyOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9yZGVyOiB0cnVlICAvLyDmmK/lkKbmlK/mjIHor6XliJfmjpLluo9cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAge2Rpc3BsYXk6ICfmk43kvZznpagnLCBuYW1lOiAnJywgY29sc3BhbjogJzInLCB3aWR0aDogJzAuMicsIGFsaWduOiBcImNlbnRlclwifSxcclxuICAgICAgICAgICAgICAgICAgICAgICAge2Rpc3BsYXk6ICfnvLrpmbcnLCBuYW1lOiAnJywgY29sc3BhbjogJzInLCB3aWR0aDogJzAuMicsIGFsaWduOiBcImNlbnRlclwifVxyXG4gICAgICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICAgICAgW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB7ZGlzcGxheTogJ+aAu+aVsCjkuKopJywgbmFtZTogJzEnLCB3aWR0aDogJzAuMScsIGFsaWduOiBcImNlbnRlclwifSxcclxuICAgICAgICAgICAgICAgICAgICAgICAge2Rpc3BsYXk6ICflubPlnYflpITnkIbml7bplb8oaCknLCBuYW1lOiAnMicsIHdpZHRoOiAnMC4xJywgYWxpZ246IFwiY2VudGVyXCJ9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7ZGlzcGxheTogJ+aAu+aVsCjkuKopJywgbmFtZTogJzMnLCB3aWR0aDogJzAuMScsIGFsaWduOiBcImNlbnRlclwifSxcclxuICAgICAgICAgICAgICAgICAgICAgICAge2Rpc3BsYXk6ICflubPlnYflpITnkIbml7bplb8oaCknLCBuYW1lOiAnNCcsIHdpZHRoOiAnMC4xJywgYWxpZ246IFwiY2VudGVyXCJ9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiAn5oC75pWwKOS4qiknLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJzUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICcwLjEnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxpZ246IFwiY2VudGVyXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bml0OiAnJScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjc3M6IHsnY29sb3InOiAnYmx1ZScsICdmb250LXNpemUnOiAnMTVweCd9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtkaXNwbGF5OiAn5bmz5Z2H5aSE55CG5pe26ZW/KGgpJywgbmFtZTogJzYnLCB3aWR0aDogJzAuMScsIGFsaWduOiBcImNlbnRlclwifVxyXG4gICAgICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgIGxlZnRDb250ZW50Olx0XHQgICAgICAgICAgIC8v6KGo5qC85bem6L655YiG6aG15bel5YW35p2h5YaF5a65XHJcbiAgICAgICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnB1dDogJ2xhYmVsJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2xhYmVsJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2hvdzogTXNnLmdyaWRQYXJhbS5wYWdlU2hvd0NvdW50LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmaXg6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6ICdwbGFiZWwnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZHM6ICdwbGFiZWxfMCdcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXQ6ICdzZWxlY3QnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc2VsZWN0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2hvdzogJ3JwcycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpeDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6ICdwc2VsZWN0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWRzOiAncHNlbGVjdF9ycHMnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByaWdodDogNlxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnB1dDogJ2xhYmVsJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2xhYmVsJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2hvdzogTXNnLmdyaWRQYXJhbS5lbXB0eU1zZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZml4OiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAncGxhYmVsJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWRzOiAncGxhYmVsX3RvdGFsUmVjb3JkcydcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICByaWdodENvbnRlbnQ6XHRcdCAgICAgICAgICAgLy/ooajmoLzlt6bovrnliIbpobXlt6XlhbfmnaHlhoXlrrlcclxuICAgICAgICAgICAgICAgIFtcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0OiAnc3BhbicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdidXR0b24nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzaG93OiAnJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZml4OiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAncGJ1dHRvbicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkczogJ3BidXR0b25fZmlyc3QnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogMjQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogMjQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlZnQ6IDMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJpZ2h0OiAzXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0OiAnc3BhbicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdidXR0b24nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzaG93OiAnJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZml4OiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAncGJ1dHRvbicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkczogJ3BidXR0b25fcHJldmlvdXMnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogMjQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogMjQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlZnQ6IDMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJpZ2h0OiAzXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0OiAnbGFiZWwnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnbGFiZWwnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzaG93OiAnY3VycmVudFBhZ2UnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmaXg6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAncGxhYmVsX2N1clBhZ2UnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZHM6ICdwbGFiZWxfY3VycmVudFBhZ2UxJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICdhdXRvJ1xyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnB1dDogJ3NwYW4nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnYnV0dG9uJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2hvdzogJycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpeDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ3BidXR0b24nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZHM6ICdwYnV0dG9uX25leHQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogMjQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogMjQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlZnQ6IDMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJpZ2h0OiAzXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0OiAnc3BhbicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdidXR0b24nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzaG93OiAnJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZml4OiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAncGJ1dHRvbicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkczogJ3BidXR0b25fbGFzdCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAyNCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAyNCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGVmdDogMyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmlnaHQ6IDEwXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0OiAnbGFiZWwnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnbGFiZWwnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzaG93OiBNc2cuZ3JpZFBhcmFtLmJlZm9yZVBhZ2VUZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmaXg6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6ICdwbGFiZWwnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZHM6ICdwbGFiZWxfMycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAxNVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnB1dDogJ2xhYmVsJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2xhYmVsJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2hvdzogJ2N1cnJlbnRQYWdlJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZml4OiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ3BsYWJlbCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkczogJ3BsYWJlbF9jdXJyZW50UGFnZTInLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogJ2F1dG8nXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0OiAnbGFiZWwnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnbGFiZWwnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzaG93OiBNc2cuZ3JpZFBhcmFtLmFmdGVyUGFnZVRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpeDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ3BsYWJlbCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkczogJ3BsYWJlbF80JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDEwXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0OiAnbGFiZWwnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnbGFiZWwnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzaG93OiAndG90YWxQYWdlJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZml4OiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ3BsYWJlbCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkczogJ3BsYWJlbF90b3RhbFBhZ2UnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogJ2F1dG8nXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0OiAnbGFiZWwnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnbGFiZWwnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzaG93OiBNc2cuZ3JpZFBhcmFtLm1QYWdlVGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZml4OiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAncGxhYmVsJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWRzOiAncGxhYmVsXzUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogJzIwJ1xyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnB1dDogJ2xhYmVsJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2xhYmVsJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2hvdzogTXNnLmdyaWRQYXJhbS5qdW1wVG8sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpeDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ3BsYWJlbCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkczogJ3BsYWJlbF82JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDI2LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZWZ0OiAxMFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnB1dDogJ2lucHV0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3RleHQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzaG93OiAndG9QYWdlJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZml4OiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ3B0ZXh0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWRzOiAncHRleHRfdG9QYWdlJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDI2LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IDI2LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByaWdodDogM1xyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnB1dDogJ2xhYmVsJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2xhYmVsJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2hvdzogTXNnLmdyaWRQYXJhbS5tUGFnZVRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpeDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ3BsYWJlbCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkczogJ3BsYWJlbF83JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDE1XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0OiAnc3BhbicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdidXR0b24nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzaG93OiAnR08nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmaXg6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6ICdwYnV0dG9uX2p1bXBUbycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkczogJ3BidXR0b25fanVtcFRvJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDI2LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IDI2XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgIH0sIG9wdGlvbnMpO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiDlh73mlbDpm4blkIhcclxuICAgICAgICAgKi9cclxuICAgICAgICB2YXIgZyA9IHtcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIOWIneWni+WMlklE5Y+Y6YeP5L+h5oGvXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBpbml0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBnLnAgPSBwO1xyXG4gICAgICAgICAgICAgICAgcC5zZWxlY3RlZFJlY29yZHMgPSBbXTtcclxuICAgICAgICAgICAgICAgIHAuc2VsZWN0b3IgPSAkKHQpLmF0dHIoJ2lkJyk7XHJcbiAgICAgICAgICAgICAgICBwLndob2xlSUQgPSBwLnNlbGVjdG9yICsgJ0dyaWRUYWJsZSc7XHJcbiAgICAgICAgICAgICAgICBwLnRpdGxlSUQgPSBwLnNlbGVjdG9yICsgJ0dyaWRUYWJsZVRpdGxlJztcclxuICAgICAgICAgICAgICAgIHAuaGVhZGVySUQgPSBwLnNlbGVjdG9yICsgJ0dyaWRUYWJsZUhlYWRlcic7XHJcbiAgICAgICAgICAgICAgICBwLmJvZHlJRCA9IHAuc2VsZWN0b3IgKyAnR3JpZFRhYmxlQm9keSc7XHJcbiAgICAgICAgICAgICAgICBwLnBhZ2VCYXJJRCA9IHAuc2VsZWN0b3IgKyAnR3JpZFRhYmxlUGFnZUJhcic7XHJcbiAgICAgICAgICAgICAgICAkKHQpLmVtcHR5KCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiDmlbDnu4TlpI3liLblh73mlbBcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIF9hcnJheUNvcHk6IGZ1bmN0aW9uIChhcnJheSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNvcHkgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgaWYgKGFycmF5ICYmIGFycmF5IGluc3RhbmNlb2YgQXJyYXkpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb3B5ID0gW107XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFycmF5WzBdWzBdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaChhcnJheSwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29weS5wdXNoKHRoaXMuY29uY2F0KCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb3B5ID0gYXJyYXkuY29uY2F0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvcHk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiDniLbnqpflpKflsI/lj5jljJbnmoTlm57osIPlh73mlbBcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIHJlc2l6ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFwLnJlc2l6YWJsZSkgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgZy5nZXRTaXplKCk7XHJcbiAgICAgICAgICAgICAgICAkKCcjJyArIHAud2hvbGVJRCkuY3NzKHsnd2lkdGgnOiBwLndpZHRofSk7XHJcbiAgICAgICAgICAgICAgICBpZiAocC50aXRsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICQoJyMnICsgcC50aXRsZUlEKS5jc3Moeyd3aWR0aCc6IHAud2lkdGh9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChwLmhlYWRlcikge1xyXG4gICAgICAgICAgICAgICAgICAgICQoJyMnICsgcC5oZWFkZXJJRCkuY3NzKHsnd2lkdGgnOiBwLndpZHRofSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAocC5ib2R5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnIycgKyBwLmJvZHlJRCkuY3NzKHsnd2lkdGgnOiBwLndpZHRofSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAocC5wYWdlQmFyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnIycgKyBwLnBhZ2VCYXJJRCkuY3NzKHsnd2lkdGgnOiBwLndpZHRofSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvL3AuYm9keSAmJiBnLmFkZERhdGEoKTtcclxuICAgICAgICAgICAgICAgIHAuYm9keSAmJiBnLnJlc2l6ZUJveCgpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICByZXNpemVCb3g6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICQodCkuZmluZCgndGFibGUnKS5maWx0ZXIoZnVuY3Rpb24gKGluZGV4LCB2YWwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4IDwgMikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc2l6ZURvbUxpc3QgPSAkKCc+dGJvZHk+dHI+LkdyaWRJdGVtJywgJCh2YWwpKS5ub3QoJy5sYXN0SXRlbSwgLm5vUmVzaXplJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmVhY2gocmVzaXplRG9tTGlzdCwgZnVuY3Rpb24gKGksIHQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdyA9ICQodCkuYXR0cignZGF0YS13aWR0aCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBydyA9IGcuY2FsV2lkdGgodywgcC5jb2xfbnVtKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwLnNpbmdhbExpbmVIZWFkZXJUYWJsZSAmJiAkKCc+ZGl2JywgJCh0KSkud2lkdGgocncpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQodCkud2lkdGgocncpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQodCkuYXR0cignd2lkdGgnLCBydyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChwLnBhZ2VCYXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHAud2lkdGggPCA2NzgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoJy5HcmlkVGFibGVUb29sQmFyQm9keUxlZnQnLCAkKCcjJyArIHAucGFnZUJhcklEKSkuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHAud2lkdGggPCA0NzgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKCcuR3JpZFRhYmxlVG9vbEJhckJvZHlSaWdodCAucGxhYmVsLCAuR3JpZFRhYmxlVG9vbEJhckJvZHlSaWdodCAucHRleHQsIC5HcmlkVGFibGVUb29sQmFyQm9keVJpZ2h0IC5wYnV0dG9uX2p1bXBUbycsICQoJyMnICsgcC5wYWdlQmFySUQpKS5oaWRlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoJy5HcmlkVGFibGVUb29sQmFyQm9keVJpZ2h0IC5wbGFiZWwsIC5HcmlkVGFibGVUb29sQmFyQm9keVJpZ2h0IC5wdGV4dCwgLkdyaWRUYWJsZVRvb2xCYXJCb2R5UmlnaHQgLnBidXR0b25fanVtcFRvJywgJCgnIycgKyBwLnBhZ2VCYXJJRCkpLnNob3coKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoJy5HcmlkVGFibGVUb29sQmFyQm9keUxlZnQnLCAkKCcjJyArIHAucGFnZUJhcklEKSkuc2hvdygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJCgnLkdyaWRUYWJsZVRvb2xCYXJCb2R5UmlnaHQgLnBsYWJlbCwgLkdyaWRUYWJsZVRvb2xCYXJCb2R5UmlnaHQgLnB0ZXh0LCAuR3JpZFRhYmxlVG9vbEJhckJvZHlSaWdodCAucGJ1dHRvbl9qdW1wVG8nLCAkKCcjJyArIHAucGFnZUJhcklEKSkuc2hvdygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghJCgnIycgKyBwLnNlbGVjdG9yICsgJ0dyaWRUYWJsZUJvZHknKS5oYXNDbGFzcygnYXV0b0hlaWdodEJvZHknKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKCcjJyArIHAuc2VsZWN0b3IgKyAnR3JpZFRhYmxlQm9keScpLmhlaWdodChwLmhlaWdodCAtICQoJyMnICsgcC5zZWxlY3RvciArICdHcmlkVGFibGVIZWFkZXInKS5oZWlnaHQoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSwgMCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiDojrflj5bniLbnqpfnmoTlrr3luqbvvIzlvZPkvZzmlLnooajmoLzmj5Lku7blrr3luqZcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIGdldFNpemU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGlmIChwLnBhcmVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHAud2lkdGggPSAkKCcjJyArIHAucGFyZW50KS53aWR0aCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHAuYm9keVdpZHRoID0gcC53aWR0aDtcclxuICAgICAgICAgICAgICAgICAgICAocC5jbGlja1NlbGVjdCAmJiBwLmlzU2hvd1NlbGVjdCkgJiYgKHAuYm9keVdpZHRoIC09IHAubGluZV9oZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHAuZXhwYW5kICYmIChwLmJvZHlXaWR0aCAtPSBwLmxpbmVfaGVpZ2h0KTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB2YXIgbm9kZSA9ICQodCk7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoIW5vZGUud2lkdGgoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIG5vZGUgPSBub2RlLnBhcmVudCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcC53aWR0aCA9IG5vZGUud2lkdGgoKTtcclxuICAgICAgICAgICAgICAgIHAuYm9keVdpZHRoID0gcC53aWR0aDtcclxuICAgICAgICAgICAgICAgIChwLmNsaWNrU2VsZWN0ICYmIHAuaXNTaG93U2VsZWN0KSAmJiAocC5ib2R5V2lkdGggLT0gcC5saW5lX2hlaWdodCk7XHJcbiAgICAgICAgICAgICAgICBwLmV4cGFuZCAmJiAocC5ib2R5V2lkdGggLT0gcC5saW5lX2hlaWdodCk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHAud2lkdGg7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiDorqHnrpflhYPntKDlrr3luqZcclxuICAgICAgICAgICAgICogQHBhcmFtIHdpZHRoIOWuveW6puihqOekuuWAvFxyXG4gICAgICAgICAgICAgKiBAcGFyYW0gY29scyDmgLvliJfmlbBcclxuICAgICAgICAgICAgICogQHJldHVybnMge051bWJlciB8ICp9IOWunumZheWuveW6puWAvFxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgY2FsV2lkdGg6IGZ1bmN0aW9uICh3aWR0aCwgY29scykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHdpZHRoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHdpZHRoIDw9IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbHMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBNYXRoLnJvdW5kKHdpZHRoICogKChwLmJvZHlXaWR0aCAtIHAuY29sX251bSAqIDIpICsgY29scyAvIDIpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gTWF0aC5yb3VuZCh3aWR0aCAqIChwLmJvZHlXaWR0aCAtIHAuY29sX251bSAqIDIpKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoKHdpZHRoICsgXCJcIikuaW5kZXhPZignJScpICE9IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpbmRleCA9ICh3aWR0aCArIFwiXCIpLmluZGV4T2YoJyUnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHcgPSB3aWR0aC5zdWJzdHJpbmcoMCwgaW5kZXggLSAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE1hdGgucm91bmQoKHcgKiBwLmJvZHlXaWR0aCkgLyAxMDApO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGNvbHMpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gTWF0aC5yb3VuZCgocC53aWR0aCAtIHAuY29sX251bSAqIDIpIC8gY29scyAtIGNvbHMpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHAud2lkdGg7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiDliJvlu7rooajmoLzmlbTkvZPnmoRESVZcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIGNyZWF0ZXdob2xlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZGl2ID0gJChcIjxkaXYgY2xhc3M9J0dyaWRUYWJsZURpdicgaWQ9J1wiICsgcC53aG9sZUlEICsgXCInLz5cIik7XHJcbiAgICAgICAgICAgICAgICAvL2Rpdi5jc3Moeyd3aWR0aCc6IGcuY2FsV2lkdGgoKX0pO1xyXG4gICAgICAgICAgICAgICAgJCh0KS5hcHBlbmQoZGl2KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIOWIm+W7uuihqOagvOmAieS4remhueWxleekuuadv1xyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgY3JlYXRlU2VsZWN0ZWRTaG93Qm94OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZGl2ID0gJCgnPHVsPjwvdWw+JykuYWRkQ2xhc3MoJ3NlbGVjdGVkU2hvd0JveCcpO1xyXG4gICAgICAgICAgICAgICAgJCgnIycgKyBwLndob2xlSUQpLmFwcGVuZChkaXYpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICog5Yib5bu66KGo5qC85qCH6aKYXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBjcmVhdGVUaXRsZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGRpdiA9ICQoXCI8ZGl2IGNsYXNzPSdHcmlkVGFibGVUaXRsZURpdicgaWQ9J1wiICsgcC50aXRsZUlEICsgXCInLz5cIik7XHJcbiAgICAgICAgICAgICAgICBkaXYuY3NzKHsnaGVpZ2h0JzogcC5saW5lX2hlaWdodH0pO1xyXG4gICAgICAgICAgICAgICAgJCgnIycgKyBwLndob2xlSUQpLmFwcGVuZChkaXYpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHAudGl0bGVUZXh0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGl2LmFkZENsYXNzKCdTaW5nbGVUaXRsZScpLmh0bWwocC50aXRsZVRleHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHZhciB0YWJsZUNvbnRlbnQgPSAkKCc8dGFibGUgd2lkdGg9XCIxMDAlXCIgY2xhc3M9XCJHcmlkVGFibGVUaXRsZVwiIGNlbGxwYWRkaW5nPVwiMFwiIGJvcmRlcj1cIjBcIi8+JylcclxuICAgICAgICAgICAgICAgICAgICAuYXR0cignY2VsbHNwYWNpbmcnLCBwLnRpdGxlX2NlbGxzcGFjaW5nKTtcclxuICAgICAgICAgICAgICAgIGRpdi5hcHBlbmQodGFibGVDb250ZW50KTtcclxuICAgICAgICAgICAgICAgIGlmIChwLnRpdGxlTW9kZWwpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdHJDb250ZW50ID0gJChcIjx0ci8+XCIpLmNzcyh7J2hlaWdodCc6IHAubGluZV9oZWlnaHR9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdGFibGVDb250ZW50LmFwcGVuZCh0ckNvbnRlbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChwLnRpdGxlTW9kZWxbMF0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZy5jcmVhdGVUaXRsZUxlZnQodHJDb250ZW50LCBwLnRpdGxlTW9kZWxbMF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAocC50aXRsZU1vZGVsWzFdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGcuY3JlYXRlVGl0bGVSaWdodCh0ckNvbnRlbnQsIHAudGl0bGVNb2RlbFsxXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICog5Yib5bu66KGo5qC85qCH6aKY5bem6L655YaF5a65XHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBjcmVhdGVUaXRsZUxlZnQ6IGZ1bmN0aW9uICh0ckNvbnRlbnQsIGRhdGEpIHtcclxuICAgICAgICAgICAgICAgIHZhciB0ZENvbnRlbnQgPSAkKFwiPHRkIHN0eWxlPSd0ZXh0LWFsaWduOmxlZnQnOyB3aWR0aD0nNTAlJyBjbGFzcz0nR3JpZFRhYmxlVGl0bGVMZWZ0VEQnLz5cIik7XHJcbiAgICAgICAgICAgICAgICB0ckNvbnRlbnQuYXBwZW5kKHRkQ29udGVudCk7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGFibGVDb250ZW50ID0gJCgnPHRhYmxlIGNsYXNzPVwiR3JpZFRhYmxlVGl0bGVcIiBjZWxscGFkZGluZz1cIjBcIiBib3JkZXI9XCIwXCIvPicpXHJcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2NlbGxzcGFjaW5nJywgcC50aXRsZV9jZWxsc3BhY2luZyk7XHJcbiAgICAgICAgICAgICAgICB0ZENvbnRlbnQuYXBwZW5kKHRhYmxlQ29udGVudCk7XHJcbiAgICAgICAgICAgICAgICBnLmNyZWF0ZVRpdGxlVFIodGFibGVDb250ZW50LCBkYXRhKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIOWIm+W7uuihqOagvOagh+mimOWPs+i+ueWGheWuuVxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgY3JlYXRlVGl0bGVSaWdodDogZnVuY3Rpb24gKHRyQ29udGVudCwgZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHRkQ29udGVudCA9ICQoXCI8dGQgc3R5bGU9J3RleHQtYWxpZ246cmlnaHQnIHdpZHRoPSc1MCUnIGNsYXNzPSdHcmlkVGFibGVUaXRsZVJpZ2h0VEQnLz5cIik7XHJcbiAgICAgICAgICAgICAgICB0ckNvbnRlbnQuYXBwZW5kKHRkQ29udGVudCk7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGFibGVDb250ZW50ID0gJCgnPHRhYmxlIGNsYXNzPVwiR3JpZFRhYmxlVGl0bGVcIiBjZWxscGFkZGluZz1cIjBcIiBib3JkZXI9XCIwXCIvPicpXHJcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2NlbGxzcGFjaW5nJywgcC50aXRsZV9jZWxsc3BhY2luZyk7XHJcbiAgICAgICAgICAgICAgICB0ZENvbnRlbnQuYXBwZW5kKHRhYmxlQ29udGVudCk7XHJcbiAgICAgICAgICAgICAgICBnLmNyZWF0ZVRpdGxlVFIodGFibGVDb250ZW50LCBkYXRhKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIOWIm+W7uuihqOagvOagh+mimHRy5YaF5a65XHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBjcmVhdGVUaXRsZVRSOiBmdW5jdGlvbiAodGFibGVDb250ZW50LCBkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdHJDb250ZW50ID0gJChcIjx0ciBjbGFzcz0nR3JpZFRhYmxlVGl0bGVUUicvPlwiKTtcclxuICAgICAgICAgICAgICAgICQuZWFjaChkYXRhLCBmdW5jdGlvbiAoaSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0ZCA9ICQoJzx0ZC8+Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53aWR0aCAmJiB0ZC5hdHRyKCd3aWR0aCcsIGcuY2FsV2lkdGgodGhpcy53aWR0aCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjb250ZW50ID0gJChcIjxkaXYvPlwiKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5iZWZvcmUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudC5hcHBlbmQodGhpcy5iZWZvcmUuY3NzKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ2lubGluZS1ibG9jaycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAndmVydGljYWwtYWxpZ24nOiAnbWlkZGxlJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdtYXJnaW4tcmlnaHQnOiAnMTBweCdcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBjb250ZW50LmFwcGVuZCh0aGlzLmRpc3BsYXkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmFmdGVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQuYXBwZW5kKHRoaXMuYWZ0ZXIuY3NzKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ2lubGluZS1ibG9jaycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAndmVydGljYWwtYWxpZ24nOiAnbWlkZGxlJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdtYXJnaW4tbGVmdCc6ICcxMHB4J1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRkLmFwcGVuZChjb250ZW50KTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5leHRlbmQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHRoaXMuZXh0ZW5kKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5leHRlbmQuaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQuYXR0cihrZXksIHRoaXMuZXh0ZW5kW2tleV0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucm93c3BhbiA/IHRkLmF0dHIoJ3Jvd3NwYW4nLCB0aGlzLnJvd3NwYW4pIDogMDtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbHNwYW4gPyB0ZC5hdHRyKCdjb2xzcGFuJywgdGhpcy5jb2xzcGFuKSA6IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jc3MgPyBjb250ZW50LmNzcyh0aGlzLmNzcykgOiAwO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZm5DbGljayA/IGNvbnRlbnQuY2xpY2sodGhpcy5mbkNsaWNrKSA6IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oaWRlID8gY29udGVudC5oaWRlKCkgOiAwO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29udGVudCA9PSAnJyA/IGNvbnRlbnQuaHRtbCgnJykgOiAwO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWxpZ24gPyB0ZC5jc3MoJ3RleHQtYWxpZ24nLCB0aGlzLmFsaWduKSA6IHRkLmNzcygndGV4dC1hbGlnbicsIHAuYWxpZ24pO1xyXG4gICAgICAgICAgICAgICAgICAgIHRyQ29udGVudC5hcHBlbmQodGQpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB0YWJsZUNvbnRlbnQuYXBwZW5kKHRyQ29udGVudCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiDliJvlu7rooajmoLzooajlpLRkaXZcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIGNyZWF0ZUhlYWRlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGRpdiA9ICQoXCI8ZGl2IGNsYXNzPSdHcmlkVGFibGVIZWFkZXJEaXYnIGlkPSdcIiArIHAuaGVhZGVySUQgKyBcIicvPlwiKTtcclxuICAgICAgICAgICAgICAgIC8vZGl2LmNzcyh7J3dpZHRoJzogZy5jYWxXaWR0aCgpfSk7XHJcbiAgICAgICAgICAgICAgICAkKCcjJyArIHAud2hvbGVJRCkuYXBwZW5kKGRpdik7XHJcbiAgICAgICAgICAgICAgICBnLmNyZWF0ZUhlYWRlclRhYmxlKGRpdik7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiDliJvlu7rooajmoLzooajlpLR0YWJsZVxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgY3JlYXRlSGVhZGVyVGFibGU6IGZ1bmN0aW9uIChkaXYpIHtcclxuICAgICAgICAgICAgICAgIGRpdi5lbXB0eSgpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHRhYmxlQ29udGVudCA9ICQoJzx0YWJsZSBjbGFzcz1cIkdyaWRUYWJsZUhlYWRlclwiIHdpZHRoPVwiMTAwJVwiIGNlbGxwYWRkaW5nPVwiMFwiIGJvcmRlcj1cIjBcIi8+JylcclxuICAgICAgICAgICAgICAgICAgICAuYXR0cignY2VsbHNwYWNpbmcnLCBwLmhlYWRlcl9jZWxsc3BhY2luZyk7XHJcbiAgICAgICAgICAgICAgICBkaXYuYXBwZW5kKHRhYmxlQ29udGVudCk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHAuY29sTW9kZWwpIHtcclxuICAgICAgICAgICAgICAgICAgICBwLmNvbF9udW0gPSBnLmNyZWF0ZUhlYWRlclRSKHRhYmxlQ29udGVudCwgcC5jb2xNb2RlbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcC5jb2xNb2RlbENvcHkgPSBnLl9hcnJheUNvcHkocC5jb2xNb2RlbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZGl2LmF0dHIoJ3NpbmdhbExpbmVIZWFkZXJUYWJsZScsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHAuc2luZ2FsTGluZUhlYWRlclRhYmxlID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZy5yZXNldENvbE1vZGVsKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJjb2xzID0gMDtcclxuICAgICAgICAgICAgICAgICAgICBwLmNvbF9udW0gPSBwLmNvbE1vZGVsQ29weS5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgZGl2LmF0dHIoJ3NpbmdhbExpbmVIZWFkZXJUYWJsZScsIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgICAgICBwLnNpbmdhbExpbmVIZWFkZXJUYWJsZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIGcuY3JlYXRlTWl0bEhlYWRlTGF5b3V0VFIodGFibGVDb250ZW50LCBwLmNvbE1vZGVsQ29weSk7XHJcbiAgICAgICAgICAgICAgICAgICAgJC5lYWNoKHAuY29sTW9kZWxzLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJjb2xzID0gZy5jcmVhdGVIZWFkZXJUUih0YWJsZUNvbnRlbnQsIHRoaXMsIHJjb2xzKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiDnu5jliLblpJrooYzooajlpLTluIPlsYDooYxcclxuICAgICAgICAgICAgICogQHBhcmFtIHRhYmxlQ29udGVudFxyXG4gICAgICAgICAgICAgKiBAcGFyYW0gZGF0YVxyXG4gICAgICAgICAgICAgKiBAcmV0dXJucyB7bnVtYmVyfVxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgY3JlYXRlTWl0bEhlYWRlTGF5b3V0VFI6IGZ1bmN0aW9uICh0YWJsZUNvbnRlbnQsIGRhdGEpIHtcclxuICAgICAgICAgICAgICAgIHZhciB0ckNvbnRlbnQgPSAkKFwiPHRyLz5cIikuYWRkQ2xhc3MoJ3RhYmxlTGF5b3V0TGluZScpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHJjb2xzID0gMDtcclxuICAgICAgICAgICAgICAgICQuZWFjaChkYXRhLCBmdW5jdGlvbiAoaSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5oaWRlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJjb2xzICs9ICgrdGhpcy5jb2xzcGFuIHx8IDEpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKHAuY2xpY2tTZWxlY3QgJiYgcC5pc1Nob3dTZWxlY3QpIHtcclxuICAgICAgICAgICAgICAgICAgICB0ckNvbnRlbnQuYXBwZW5kKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKCc8dGgvPicpLmFkZENsYXNzKCdub1Jlc2l6ZScpLmF0dHIoJ3dpZHRoJywgcC5saW5lX2hlaWdodCAvIDIpLmF0dHIoJ2hlaWdodCcsIDEpXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChwLmV4cGFuZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRyQ29udGVudC5hcHBlbmQoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQoJzx0aC8+JykuYWRkQ2xhc3MoJ25vUmVzaXplJykuYXR0cignd2lkdGgnLCBwLmxpbmVfaGVpZ2h0IC8gMikuYXR0cignaGVpZ2h0JywgMSlcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICQuZWFjaChkYXRhLCBmdW5jdGlvbiAoaSwgdCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0aCA9ICQoJzx0aC8+JykuYWRkQ2xhc3MoJ0dyaWRJdGVtJykuYXR0cignZGF0YS13aWR0aCcsIHQud2lkdGgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKCdoZWlnaHQnLCAxKS5hdHRyKCduYW1lJywgdC5uYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICB0aC5hdHRyKCd3aWR0aCcsIGcuY2FsV2lkdGgodC53aWR0aCwgcmNvbHMpKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdC5jb2xzcGFuID8gdGguYXR0cignY29sc3BhbicsIHQuY29sc3BhbikgOiAwO1xyXG4gICAgICAgICAgICAgICAgICAgIHQuaGlkZSA/IHRoLmhpZGUoKSA6IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJDb250ZW50LmFwcGVuZCh0aCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHRhYmxlQ29udGVudC5hcHBlbmQodHJDb250ZW50KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiByY29scztcclxuICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiDliJvlu7rooajmoLzooajlpLTooYxcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIGNyZWF0ZUhlYWRlclRSOiBmdW5jdGlvbiAodGFibGVDb250ZW50LCBkYXRhLCB0b3RhbENvbHMpIHtcclxuICAgICAgICAgICAgICAgIHZhciB0ckNvbnRlbnQgPSAkKFwiPHRyIGNsYXNzPSdHcmlkVGFibGVIZWFkZXJUSCcvPlwiKTtcclxuICAgICAgICAgICAgICAgIC8vaWYgKHAuY2xpY2tTZWxlY3QgJiYgIXAuc2luZ2xlU2VsZWN0ICYmIHAuaXNBbGxTZWxlY3QpIHRyQ29udGVudC5hdHRyKCd0aXRsZScsIE1zZy5HcmlkVGFibGUpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHAuaXNBbGxTZWxlY3QpIHtcclxuICAgICAgICAgICAgICAgICAgICB0ckNvbnRlbnQuY2xpY2soZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBnLnNpbmdsZUNsaWNrSGVhZGVyTGluZSh0ckNvbnRlbnQsIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB0ckNvbnRlbnQuZGJsY2xpY2soZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBnLmRvdWJsZUNsaWNrSGVhZGVyTGluZSh0ckNvbnRlbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhciBzaGlmdGluZyA9IDA7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmNvbHMgPSAwLCBycm93cyA9IDA7XHJcbiAgICAgICAgICAgICAgICAkLmVhY2goZGF0YSwgZnVuY3Rpb24gKGkpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMuaGlkZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzaGlmdGluZysrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByY29scyArPSAoK3RoaXMuY29sc3BhbiB8fCAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcnJvd3MgPCArdGhpcy5yb3dzcGFuICYmIChycm93cyA9IHRoaXMucm93c3Bhbik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCF0b3RhbENvbHMgJiYgKHAuY2xpY2tTZWxlY3QgJiYgcC5pc1Nob3dTZWxlY3QpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRoID0gJCgnPHRoLz4nKS5hZGRDbGFzcygnbm9SZXNpemUnKS5hdHRyKCdyb3dzcGFuJywgcnJvd3MpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKCd3aWR0aCcsIHAubGluZV9oZWlnaHQpLmF0dHIoJ2hlaWdodCcsIHAubGluZV9oZWlnaHQpLmNzcygndGV4dC1hbGlnbicsICdjZW50ZXInKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZGl2ID0gJCgnPGRpdi8+JykuY3NzKHsnd2lkdGgnOiBwLmxpbmVfaGVpZ2h0LCAnaGVpZ2h0JzogcC5saW5lX2hlaWdodH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjdGhjaDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocC5zaW5nbGVTZWxlY3QpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3RoY2ggPSAkKCc8aW5wdXQgdHlwZT1cInJhZGlvXCIgLz4nKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ25hbWUnLCBwLnNlbGVjdG9yICsgJ19zaW5nbGVfJyArIChwLmlkUHJvcGVydHkgfHwgcC5jb2xNb2RlbENvcHlbMF0ubmFtZSkpLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjdGhjaCA9ICQoJzxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIi8+Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICFwLmlzQWxsU2VsZWN0ICYmIGN0aGNoLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG0gPSAocC5saW5lX2hlaWdodCAtIDEzKSAvIDI7XHJcbiAgICAgICAgICAgICAgICAgICAgY3RoY2guY3NzKHsnbWFyZ2luJzogbX0pLmFkZENsYXNzKCdIZWFkZXJDaGVja0JveCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5jbGljayhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdGhjaFswXS5jaGVja2VkID0gIWN0aGNoWzBdLmNoZWNrZWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGRpdi5hcHBlbmQoY3RoY2gpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoLmFwcGVuZChkaXYpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRyQ29udGVudC5hcHBlbmQodGgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKCF0b3RhbENvbHMgJiYgcC5leHBhbmQpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdGggPSAkKCc8dGgvPicpLmFkZENsYXNzKCdFeHBhbmRCb3gnKS5hZGRDbGFzcygnbm9SZXNpemUnKS5hdHRyKCdyb3dzcGFuJywgcnJvd3MpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKCd3aWR0aCcsIHAubGluZV9oZWlnaHQpLmF0dHIoJ2hlaWdodCcsIHAubGluZV9oZWlnaHQpLmNzcygndGV4dC1hbGlnbicsICdjZW50ZXInKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZGl2ID0gJCgnPGRpdi8+JykuY3NzKHsnd2lkdGgnOiBwLmxpbmVfaGVpZ2h0LCAnaGVpZ2h0JzogcC5saW5lX2hlaWdodH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGRpdi5hZGRDbGFzcygnSGVhZGVyRXhwYW5kJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGguYXBwZW5kKGRpdik7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJDb250ZW50LmFwcGVuZCh0aCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgJC5lYWNoKGRhdGEsIGZ1bmN0aW9uIChpLCB0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRoID0gJCgnPHRoLz4nKS5hZGRDbGFzcygnR3JpZEl0ZW0nKS5hdHRyKCdkYXRhLXdpZHRoJywgdC53aWR0aClcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2hlaWdodCcsIHAubGluZV9oZWlnaHQpLmF0dHIoJ25hbWUnLCB0Lm5hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjb250ZW50ID0gJChcIjxkaXYvPlwiKTtcclxuICAgICAgICAgICAgICAgICAgICB0b3RhbENvbHMgLT0gKHQuY29sc3BhbiB8fCAxKTtcclxuICAgICAgICAgICAgICAgICAgICAvL2lmICh0aGlzLmNvbHNwYW4gJiYgdC5jb2xzcGFuID4gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vICAgIHRoLmF0dHIoJ3dpZHRoJywgZy5jYWxXaWR0aCh0LndpZHRoLCByY29scykpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vICAgIC8vY29udGVudC5jc3Moeyd3aWR0aCc6IGcuY2FsV2lkdGgodC53aWR0aCwgcmNvbHMpfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgY29udGVudC5jc3Moeyd3aWR0aCc6ICcxMDAlJ30pO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaSAhPSBkYXRhLmxlbmd0aCAtIDEpIHsgLy8gVE9ET1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aC5hdHRyKCd3aWR0aCcsIGcuY2FsV2lkdGgodC53aWR0aCwgcmNvbHMpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy90aC5jc3MoJ3dpZHRoJywgZy5jYWxXaWR0aCh0LndpZHRoLCByY29scykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL2NvbnRlbnQuY3NzKHsnd2lkdGgnOiBnLmNhbFdpZHRoKHQud2lkdGgsIHJjb2xzKX0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoLmFkZENsYXNzKCdsYXN0SXRlbScpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodG90YWxDb2xzID49IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoLmF0dHIoJ3dpZHRoJywgZy5jYWxXaWR0aCh0LndpZHRoLCByY29scykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGguY3NzKCd3aWR0aCcsIGcuY2FsV2lkdGgodC53aWR0aCwgcmNvbHMpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL2NvbnRlbnQuY3NzKHsnd2lkdGgnOiBnLmNhbFdpZHRoKHQud2lkdGgsIHJjb2xzKX0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50LmNzcyh7J3dpZHRoJzogJzEwMCUnfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIC8vfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAodC5iZWZvcmUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudC5hcHBlbmQodC5iZWZvcmUuY3NzKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ2lubGluZS1ibG9jaycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAndmVydGljYWwtYWxpZ24nOiAnbWlkZGxlJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdtYXJnaW4tcmlnaHQnOiAnMTBweCdcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBjb250ZW50LmFwcGVuZCh0LmRpc3BsYXkpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAodC5hZnRlcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50LmFwcGVuZCh0LmFmdGVyLmNzcyh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdpbmxpbmUtYmxvY2snLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3ZlcnRpY2FsLWFsaWduJzogJ21pZGRsZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbWFyZ2luLWxlZnQnOiAnMTBweCdcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHQub3JkZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNvcnRCeSA9ICQoJzxpLz4nKS5hZGRDbGFzcygnc29ydEJ5Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvcnRCeS5jbGljayhmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcC5wYXJhbXNbJ29yZGVyQnknXSA9IHQubmFtZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkKHRoaXMpLmhhc0NsYXNzKCdhc2MnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoJy5zb3J0QnknLCB0YWJsZUNvbnRlbnQpLnJlbW92ZUNsYXNzKCdhc2MgZGVzYycpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykucmVtb3ZlQ2xhc3MoJ2FzYycpLmFkZENsYXNzKCdkZXNjJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcC5wYXJhbXNbJ3NvcnQnXSA9ICdkZXNjJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJCgnLnNvcnRCeScsIHRhYmxlQ29udGVudCkucmVtb3ZlQ2xhc3MoJ2FzYyBkZXNjJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5hZGRDbGFzcygnYXNjJykucmVtb3ZlQ2xhc3MoJ2Rlc2MnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwLnBhcmFtc1snc29ydCddID0gJ2FzYyc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnLnJlZnJlc2hQYWdlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHAucGFyYW1zICYmIHAucGFyYW1zWydvcmRlckJ5J10gPT0gdC5uYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3J0QnkuYWRkQ2xhc3MocC5wYXJhbXNbJ3NvcnQnXSB8fCAnYXNjJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudC5hcHBlbmQoc29ydEJ5KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRoLmFwcGVuZChjb250ZW50KTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodC5leHRlbmQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHRoaXMuZXh0ZW5kKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodC5leHRlbmQuaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoLmF0dHIoa2V5LCB0LmV4dGVuZFtrZXldKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB0LnJvd3NwYW4gPyB0aC5hdHRyKCdyb3dzcGFuJywgdC5yb3dzcGFuKSA6IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgdC5jb2xzcGFuID8gdGguYXR0cignY29sc3BhbicsIHQuY29sc3BhbikgOiAwO1xyXG4gICAgICAgICAgICAgICAgICAgIHQuaGlkZSA/IHRoLmhpZGUoKSA6IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgdC5jb250ZW50ID09ICcnID8gdGguaHRtbCgnJykgOiAwO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoLmNzcygndGV4dC1hbGlnbicsIHAuYWxpZ24pO1xyXG4gICAgICAgICAgICAgICAgICAgIHRyQ29udGVudC5hcHBlbmQodGgpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB0YWJsZUNvbnRlbnQuYXBwZW5kKHRyQ29udGVudCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmNvbHM7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiDlpI3liLZqc29u5pWw5o2uXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBjbG9uZTogZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjb3B5ID0ge307XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvcHlba2V5XSA9IGRhdGFba2V5XTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBjb3B5O1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICog6YeN5paw5pW055CG6KGo5aS05qih5Z6L5pWw5o2u77yM5Y676Zmk5ZCI5bm25Y2V5YWD5qC855qE5b2x5ZONXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICByZXNldENvbE1vZGVsOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY29sTW9kZWxzID0gZy5fYXJyYXlDb3B5KHAuY29sTW9kZWxzKTtcclxuICAgICAgICAgICAgICAgICQuZWFjaChjb2xNb2RlbHMsIGZ1bmN0aW9uIChpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IDsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghY29sTW9kZWxzW2ldW2pdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29sTW9kZWxzW2ldW2pdLmNvbHNwYW4gJiYgIWNvbE1vZGVsc1tpXVtqXS5jb2xDb3B5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY29sc3BhbiA9IHBhcnNlSW50KGNvbE1vZGVsc1tpXVtqXS5jb2xzcGFuKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGsgPSBqICsgMTsgayA8IGogKyBjb2xzcGFuOyBrKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IGcuY2xvbmUoY29sTW9kZWxzW2ldW2pdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LmNvbENvcHkgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbE1vZGVsc1tpXS5zcGxpY2UoaywgMCwgdGhhdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBqICs9IGNvbHNwYW4gLSAxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAkLmVhY2goY29sTW9kZWxzLCBmdW5jdGlvbiAoaSkge1xyXG4gICAgICAgICAgICAgICAgICAgICQuZWFjaCh0aGlzLCBmdW5jdGlvbiAoaikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5yb3dzcGFuICYmICF0aGlzLnJvd0NvcHkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByb3dzcGFuID0gcGFyc2VJbnQodGhpcy5yb3dzcGFuKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGsgPSBpICsgMTsgayA8IGNvbE1vZGVscy5sZW5ndGggJiYgayA8IGkgKyByb3dzcGFuOyBrKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IGcuY2xvbmUodGhpcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5yb3dDb3B5ID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xNb2RlbHNba10uc3BsaWNlKGosIDAsIHRoYXQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICQuZWFjaChjb2xNb2RlbHMsIGZ1bmN0aW9uIChpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJC5lYWNoKHRoaXMsIGZ1bmN0aW9uIChqKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmNvbHNwYW4gJiYgdGhpcy5jb2xDb3B5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xNb2RlbHNbaV0uc3BsaWNlKGosIDEpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgdmFyIG1heCA9IDA7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGNvbE1vZGVscy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjb2xNb2RlbHNbaV0ubGVuZ3RoID49IGNvbE1vZGVsc1tpIC0gMV0ubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heCA9IGk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcC5jb2xNb2RlbENvcHkgPSBjb2xNb2RlbHNbbWF4XS5jb25jYXQoKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIOWIm+W7uuihqOagvOS4u+S9k1xyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgY3JlYXRlQm9keTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGRpdiA9ICQoJzxkaXYgY2xhc3M9XCJHcmlkVGFibGVCb2R5RGl2XCIgaWQ9XCInICsgcC5ib2R5SUQgKyAnXCIgLz4nKTtcclxuICAgICAgICAgICAgICAgIC8vZGl2LmNzcyh7J3dpZHRoJzogZy5jYWxXaWR0aCgpfSk7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGFibGVDb250ZW50ID0gJCgnPHRhYmxlIGNsYXNzPVwiR3JpZFRhYmxlQm9keVwiIGNlbGxwYWRkaW5nPVwiMFwiIGJvcmRlcj1cIjBcIi8+JylcclxuICAgICAgICAgICAgICAgICAgICAuYXR0cignY2VsbHNwYWNpbmcnLCBwLmJvZHlfY2VsbHNwYWNpbmcpO1xyXG4gICAgICAgICAgICAgICAgdmFyIG92ZXJmbG93WSA9ICdhdXRvJztcclxuICAgICAgICAgICAgICAgIGlmICghcC5vdmVyZmxvdykge1xyXG4gICAgICAgICAgICAgICAgICAgIG92ZXJmbG93WSA9ICdoaWRkZW4nO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcC5tYXhfaGVpZ2h0ICYmIGRpdi5jc3Moe1xyXG4gICAgICAgICAgICAgICAgICAgICdtYXgtaGVpZ2h0JzogcC5tYXhfaGVpZ2h0ICsgJ3B4JyxcclxuICAgICAgICAgICAgICAgICAgICAnb3ZlcmZsb3cteSc6IG92ZXJmbG93WSxcclxuICAgICAgICAgICAgICAgICAgICAnb3ZlcmZsb3cteCc6ICdoaWRkZW4nXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGlmICghcC5oZWlnaHQgfHwgcC5oZWlnaHQgPT0gJ2F1dG8nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGl2LmFkZENsYXNzKCdhdXRvSGVpZ2h0Qm9keScpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBkaXYuaGVpZ2h0KHAuaGVpZ2h0IC0gJCgnIycgKyBwLnNlbGVjdG9yICsgJ0dyaWRUYWJsZUhlYWRlcicpLmhlaWdodCgpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGRpdi5hcHBlbmQodGFibGVDb250ZW50KTtcclxuICAgICAgICAgICAgICAgICQoJyMnICsgcC53aG9sZUlEKS5hcHBlbmQoZGl2KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIOaLk+WxleWIl+WGheWuue+8jOWunumZheS4iuS4jeaYvuekuu+8jOWPquaYr+S4uuS6huWPr+S7peWPluWIsOaVsOaNrlxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgZXhwYW5kQ29sTW9kZWw6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGlmIChwLmRhdGEubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghcC5jb2xNb2RlbENvcHkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcC5jb2xNb2RlbENvcHkgPSBnLl9hcnJheUNvcHkocC5jb2xNb2RlbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBkID0gcC5kYXRhWzBdO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkLmhhc093blByb3BlcnR5KGtleSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmb3VuZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwLmNvbE1vZGVsQ29weS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwLmNvbE1vZGVsQ29weVtpXS5uYW1lID09IGtleSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3VuZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZm91bmQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGluZSA9IHt9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmUuZGlzcGxheSA9IGtleTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lLm5hbWUgPSBrZXk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZS5oaWRlID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lLndpZHRoID0gMC4xO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHAuY29sTW9kZWxDb3B5LnVuc2hpZnQobGluZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICog6Ieq5a6a5LmJ5bGV5byA5pa55byPLFxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgYXBwZW5kUm93OiBmdW5jdGlvbiAoaW5kZXgsIGRhdGFMaXN0KSB7XHJcbiAgICAgICAgICAgICAgICBnLmNsZWFyQXBwZW5kUm93KCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGF0YUxpc3QubGVuZ3RoIDw9IDApIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAkLmVhY2goZGF0YUxpc3QsIGZ1bmN0aW9uIChpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRyQ29udGVudCA9IGcuY3JlYXRlUm93KHRoaXMsIGkpO1xyXG4gICAgICAgICAgICAgICAgICAgICQodHJDb250ZW50KS5hdHRyKFwiaW5kZXhcIiwgXCJzdWJzZXRcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgJCh0ckNvbnRlbnQpLnJlbW92ZUNsYXNzKCdTaW5nbGVCb2R5TGluZScpO1xyXG4gICAgICAgICAgICAgICAgICAgICQodHJDb250ZW50KS5yZW1vdmVDbGFzcygnRG91YmxlQm9keUxpbmUnKTtcclxuICAgICAgICAgICAgICAgICAgICAkKHRyQ29udGVudCkuYWRkQ2xhc3MoaW5kZXggJSAyID09IDAgPyAnU2luZ2xlQm9keUxpbmUnIDogJ0RvdWJsZUJvZHlMaW5lJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgLyrliqjmgIHliKTmlq3mmK/lkKbpnIDopoHmmL7npLpjaGVja2JveFxyXG4gICAgICAgICAgICAgICAgICAgICAkLmlzRnVuY3Rpb24ocC5jaGVja2JveEZsYWcpICYmICFwLmNoZWNrYm94RmxhZyh0aGlzKSAmJiAkKHRyQ29udGVudCkuZmluZChcIi5ub1Jlc2l6ZSBpbnB1dFt0eXBlPSdjaGVja2JveCddXCIpLmNzcyhcInZpc2liaWxpdHlcIixcImhpZGRlblwiKTsqL1xyXG4gICAgICAgICAgICAgICAgICAgICQodCkuZmluZChcInRyW2luZGV4PSdcIiArIGluZGV4ICsgXCInXVwiKS5hZnRlcih0ckNvbnRlbnQpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICBjbGVhckFwcGVuZFJvdzogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgJCgnIycgKyBwLmJvZHlJRCArICcuR3JpZFRhYmxlQm9keURpdiB0cltpbmRleD1cInN1YnNldFwiXScpLmVhY2goZnVuY3Rpb24gKGksIHJvdykge1xyXG4gICAgICAgICAgICAgICAgXHR2YXIgcmVjb3JkID0gZy5nZXREYXRhKCQocm93KSk7XHJcbiAgICAgICAgICAgICAgICBcdGcubWFwLnJlbW92ZShyZWNvcmRbcC5pZFByb3BlcnR5IHx8IHAuY29sTW9kZWxDb3B5WzBdLm5hbWVdKTtcclxuICAgICAgICAgICAgICAgICAgICAkKHJvdykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgY3JlYXRlUm93OiBmdW5jdGlvbiAodGhhdCwgaSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHRyQ29udGVudCA9ICQoXCI8dHIvPlwiKS5jc3MoeydoZWlnaHQnOiBwLmxpbmVfaGVpZ2h0fSkuYXR0cignaW5kZXgnLCBpKTtcclxuICAgICAgICAgICAgICAgIHRyQ29udGVudC5jbGljayhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZy5zaW5nbGVDbGlja0JvZHlMaW5lKHRyQ29udGVudCwgZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB0ckNvbnRlbnQuZGJsY2xpY2soZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGcuZG91YmxlQ2xpY2tCb2R5TGluZSh0ckNvbnRlbnQsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoaSAlIDIgPT0gMClcclxuICAgICAgICAgICAgICAgICAgICB0ckNvbnRlbnQuYWRkQ2xhc3MoJ1NpbmdsZUJvZHlMaW5lJyk7XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgdHJDb250ZW50LmFkZENsYXNzKCdEb3VibGVCb2R5TGluZScpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gaTtcclxuICAgICAgICAgICAgICAgIGlmIChwLmxpbmVQaWMpIHtcclxuICAgICAgICAgICAgICAgICAgICB0ckNvbnRlbnQuYXBwZW5kKCQoXCI8dGQvPlwiKS5jc3MoJ3RleHQtYWxpZ24nLCAnY2VudGVyJykpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhciBzaGlmdGluZyA9IDA7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmNvbHMgPSAwO1xyXG4gICAgICAgICAgICAgICAgdmFyIGNvbE1vZGVsID0gcC5jb2xNb2RlbENvcHk7XHJcbiAgICAgICAgICAgICAgICAkLmVhY2goY29sTW9kZWwsIGZ1bmN0aW9uIChpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuaGlkZSAhPSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzaGlmdGluZysrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICByY29scyArPSAoK3RoaXMuY29sc3BhbiB8fCAxKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKHAuY2xpY2tTZWxlY3QgJiYgcC5pc1Nob3dTZWxlY3QpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdGQgPSAkKCc8dGQvPicpLmFkZENsYXNzKCdub1Jlc2l6ZScpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKCd3aWR0aCcsIHAubGluZV9oZWlnaHQpLmF0dHIoJ2hlaWdodCcsIHAubGluZV9oZWlnaHQpLmNzcygndGV4dC1hbGlnbicsICdjZW50ZXInKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZGl2ID0gJCgnPGRpdi8+JykuY3NzKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ3dpZHRoJzogcC5saW5lX2hlaWdodCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ2hlaWdodCc6IHAubGluZV9oZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicG9zaXRpb25cIjogXCJyZWxhdGl2ZVwiXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0aGNoO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChwLnNpbmdsZVNlbGVjdCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjdGhjaCA9ICQoJzxpbnB1dCB0eXBlPVwicmFkaW9cIiAvPicpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYXR0cignbmFtZScsIHAuc2VsZWN0b3IgKyAnX3NpbmdsZV8nICsgKHAuaWRQcm9wZXJ0eSB8fCBwLmNvbE1vZGVsQ29weVswXS5uYW1lKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3RoY2ggPSAkKCc8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIvPicpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB2YXIgbSA9IChwLmxpbmVfaGVpZ2h0IC0gMTMpIC8gMjtcclxuICAgICAgICAgICAgICAgICAgICBjdGhjaC5jc3MoeydtYXJnaW4nOiBtfSkuYWRkQ2xhc3MoJ0JvZHlDaGVja0JveCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5jbGljayhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdGhjaFswXS5jaGVja2VkID0gIWN0aGNoWzBdLmNoZWNrZWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciByYWRpb0RpdiA9ICQoXCI8ZGl2Lz5cIikuY3NzKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJwb3NpdGlvblwiOiBcImFic29sdXRlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidG9wXCI6IFwiMFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcImxlZnRcIjogXCIwXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicmlnaHRcIjogXCIwXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiYm90dG9tXCI6IFwiMFwiXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZGl2LmFwcGVuZChyYWRpb0RpdikuYXBwZW5kKGN0aGNoKTtcclxuICAgICAgICAgICAgICAgICAgICB0ZC5hcHBlbmQoZGl2KTtcclxuICAgICAgICAgICAgICAgICAgICB0ckNvbnRlbnQuYXBwZW5kKHRkKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChwLmV4cGFuZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0ZCA9ICQoJzx0ZC8+JykuYWRkQ2xhc3MoJ25vUmVzaXplJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ3dpZHRoJywgcC5saW5lX2hlaWdodCkuYWRkQ2xhc3MoJ0V4cGFuZEJveCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKCdoZWlnaHQnLCBwLmxpbmVfaGVpZ2h0KS5jc3MoJ3RleHQtYWxpZ24nLCAnY2VudGVyJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRpdiA9ICQoJzxkaXYvPicpLmNzcyh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICd3aWR0aCc6IHAubGluZV9oZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdoZWlnaHQnOiBwLmxpbmVfaGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcInBvc2l0aW9uXCI6IFwicmVsYXRpdmVcIlxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBrZXkgPSB0aGF0W3AuaWRQcm9wZXJ0eSB8fCBwLmNvbE1vZGVsQ29weVswXS5uYW1lXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5ID09PSB1bmRlZmluZWQgJiYgKHAuaWRQcm9wZXJ0eSB8fCBwLmNvbE1vZGVsQ29weVswXS5uYW1lKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAga2V5ID0gZXZhbCgndGhhdC4nICsgKHAuaWRQcm9wZXJ0eSB8fCBwLmNvbE1vZGVsQ29weVswXS5uYW1lKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETyAx44CB5b2T5YmN6KGM6auY5Lqu77yMIDLjgIHliLfmlrDooajmoLznmoTlk43lupTlkozlrrnlmajlpKflsI/lj5jljJblhbPns7tcclxuICAgICAgICAgICAgICAgICAgICBkaXYuYWRkQ2xhc3MoJ0JvZHlFeHBhbmQnKS5jbGljayhmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJCh0aGlzKS5oYXNDbGFzcygnRGlzYWJsZWQnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocC5leHBhbmRJbmRleCAhPSBudWxsICYmIHAuZXhwYW5kSW5kZXggIT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYm94ID0gJCh0KS5maW5kKFwidHIuY2hpbGRfXCIgKyBwLmV4cGFuZEluZGV4KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJveC5oYXNDbGFzcygnZXhwYW5kZWQnKSAmJiAkLmlzRnVuY3Rpb24ocC5mb2xkKSAmJiBwLmZvbGQoYm94LCBwLmV4cGFuZEluZGV4KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5wYXJlbnRzVW50aWwoJ3RyJykucGFyZW50KCkuc2libGluZ3MoJy5jaGlsZCcpLnJlbW92ZUNsYXNzKCdleHBhbmRlZCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnBhcmVudHNVbnRpbCgndHInKS5wYXJlbnQoKS5zaWJsaW5ncygnW2luZGV4XScpLnJlbW92ZUNsYXNzKCdpbnRvRXhwYW5kJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykucGFyZW50c1VudGlsKCd0cicpLnBhcmVudCgpLnNpYmxpbmdzKCdbaW5kZXhdJykuZmluZCgnLkJvZHlFeHBhbmQnKS5yZW1vdmVDbGFzcygnZXhwYW5kZWQnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCQodGhpcykuaGFzQ2xhc3MoJ2V4cGFuZGVkJykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHAuZXhwYW5kSW5kZXggPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmVDbGFzcyhcImV4cGFuZGVkXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJDb250ZW50LnJlbW92ZUNsYXNzKCdpbnRvRXhwYW5kJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKHQpLmZpbmQoXCJ0cltpbmRleD0nY2hpbGQnXVwiKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGcuY2xlYXJBcHBlbmRSb3coKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHAuZXhwYW5kSW5kZXggPSBrZXkgfHwgaTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykucGFyZW50c1VudGlsKCd0cicpLnBhcmVudCgpLnNpYmxpbmdzKCcuY2hpbGRfJyArIChrZXkgfHwgaSkpLmFkZENsYXNzKCdleHBhbmRlZCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5hZGRDbGFzcyhcImV4cGFuZGVkXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJDb250ZW50LmFkZENsYXNzKCdpbnRvRXhwYW5kJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGV4cGFuZEJveCA9ICQoJ2Rpdi5leHBhbmQtYm94JywgJCh0aGlzKS5wYXJlbnRzVW50aWwoJ3RyJykucGFyZW50KCkuc2libGluZ3MoJy5jaGlsZF8nICsgKGtleSB8fCBpKSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJCgnZGl2LmV4cGFuZC1ib3gnLCAkKHRoaXMpLnBhcmVudHNVbnRpbCgndHInKS5wYXJlbnQoKS5zaWJsaW5ncygnLmNoaWxkJykpLmVtcHR5KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnLmNsZWFyQXBwZW5kUm93KCkgJiYgJC5pc0Z1bmN0aW9uKHAuZXhwYW5kKSAmJiBwLmV4cGFuZCh0aGF0LCBleHBhbmRCb3gsIGkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHAuZXhwYW5kSW5kZXggPT0gKGtleSB8fCBpKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXYuYWRkQ2xhc3MoJ2V4cGFuZGVkJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyQ29udGVudC5hZGRDbGFzcygnaW50b0V4cGFuZCcpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAvL+WmguaenOayoeaciWV4cGFuZOaMiemSruagh+iusOWHveaVsCzmiJbogIXlh73mlbDliKTmlq3lvZPliY3ooYzpnIDopoHlsZXlvIBcclxuICAgICAgICAgICAgICAgICAgICBpZiAoISQuaXNGdW5jdGlvbihwLmV4cGFuZEZsYWcpIHx8IHAuZXhwYW5kRmxhZyh0aGF0KSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZC5hcHBlbmQoZGl2KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgLy/lpoLmnpzmnIlleHBhbmTmjInpkq7npoHnlKjmoIforrDlh73mlbAs5bm25LiU5Ye95pWw5Yik5pat5b2T5YmN6KGM6ZyA6KaB56aB55SoXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCQuaXNGdW5jdGlvbihwLmV4cGFuZERpc2FibGVGbGFnKSAmJiBwLmV4cGFuZERpc2FibGVGbGFnKHRoYXQpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpdi5hZGRDbGFzcygnRGlzYWJsZWQnKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRyQ29udGVudC5hcHBlbmQodGQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICQuZWFjaChwLmNvbE1vZGVsQ29weSwgZnVuY3Rpb24gKGksIHQpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdiA9IHRoYXRbdC5uYW1lXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodiA9PT0gdW5kZWZpbmVkICYmIHQubmFtZSkgdiA9IGV2YWwoJ3RoYXQuJyArIHQubmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRkID0gJChcIjx0ZC8+XCIpLmFkZENsYXNzKCdHcmlkSXRlbScpLmF0dHIoJ2RhdGEtd2lkdGgnLCB0LndpZHRoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuYXR0cigndGl0bGUnLCAoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2ID09PSBudWxsIHx8IHYgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogKCcnICsgdikucmVwbGFjZUhUTUxDaGFyKCkucmVwbGFjZSgv44CML2csICdbJykucmVwbGFjZSgv44CNL2csICddJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBkaXYgPSAkKFwiPGRpdi8+XCIpLmh0bWwoKGcuaGFuZGxlRGF0YSh2KSArIGcuaGFuZGxlRGF0YSh0aGlzLnVuaXQpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZUhUTUxDaGFyKCkucmVwbGFjZUlsbGVnYWxDaGFyKCkucmVwbGFjZSgv44CML2csICdbJykucmVwbGFjZSgv44CNL2csICddJykpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKCd2YWx1ZScsIHYpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKCduYW1lJywgdGhpcy5uYW1lKS5hZGRDbGFzcygnQm9keVRkQ29udGVudCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5jc3Moe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3RleHQtb3ZlcmZsb3cnOiAnZWxsaXBzaXMnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ292ZXJmbG93JzogJ2hpZGRlbicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnd2hpdGUtc3BhY2UnOiAnbm93cmFwJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaSAhPSBwLmNvbE1vZGVsQ29weS5sZW5ndGggLSAxKSB7IC8vIFRPRE9cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGQuYXR0cignd2lkdGgnLCBnLmNhbFdpZHRoKHQud2lkdGgsIHJjb2xzKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRkLmNzcygnd2lkdGgnLCBnLmNhbFdpZHRoKHQud2lkdGgsIHJjb2xzKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy90ZC5hdHRyKCd3aWR0aCcsIGcuY2FsV2lkdGgodC53aWR0aCwgcmNvbHMpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9kaXYuY3NzKCd3aWR0aCcsIGcuY2FsV2lkdGgodC53aWR0aCwgcmNvbHMpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGQuYWRkQ2xhc3MoJ2xhc3RJdGVtJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpdi5jc3MoJ3dpZHRoJywgJzEwMCUnKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbi8vICAgICAgICAgICAgICAgICAgICBkaXYuY3NzKCd3aWR0aCcsICcxMDAlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGQuYXBwZW5kKGRpdik7XHJcbiAgICAgICAgICAgICAgICAgICAgdC5jc3MgJiYgZGl2LmNzcyh0LmNzcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdC5mbkluaXQgJiYgdGhpcy5mbkluaXQoZGl2LCB2LCB0aGF0LCBpbmRleCwgdHJDb250ZW50KTtcclxuICAgICAgICAgICAgICAgICAgICB0LmhpZGUgJiYgdGQuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHQuYWxpZ24gPyB0ZC5jc3MoJ3RleHQtYWxpZ24nLCB0LmFsaWduKSA6IHRkLmNzcygndGV4dC1hbGlnbicsIHAuYWxpZ24pO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnR5cGUgPT0gJ2ltYWdlJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZC5odG1sKCQoXCI8ZGl2IGNsYXNzPSd0clBpY3R1cmUnPjwvZGl2PlwiKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRyQ29udGVudC5hcHBlbmQodGQpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJDb250ZW50O1xyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIOa3u+WKoOihqOagvOS4u+S9k+WGheWuueWNleWFg+agvOaVsOaNrlxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgYWRkRGF0YTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgZy5leHBhbmRDb2xNb2RlbCgpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHRhYmxlQ29udGVudCA9ICQoJ3RhYmxlJywgJyMnICsgcC5ib2R5SUQpLmVxKDApO1xyXG4gICAgICAgICAgICAgICAgdGFibGVDb250ZW50LmVtcHR5KCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXAuZGF0YSB8fCAhKHAuZGF0YSBpbnN0YW5jZW9mIEFycmF5KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChwLmRhdGEubGVuZ3RoIDw9IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocC5pc1Nob3dOb0RhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRyQ29udGVudCA9ICQoXCI8dHIvPlwiKS5jc3MoeydoZWlnaHQnOiBwLmxpbmVfaGVpZ2h0fSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyQ29udGVudC5hcHBlbmQoJChcIjx0ZC8+XCIpLmF0dHIoJ2NvbHNwYW4nLCAocC5jbGlja1NlbGVjdCAmJiBwLmlzU2hvd1NlbGVjdCkgPyBwLmNvbF9udW0gKyAxIDogcC5jb2xfbnVtKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmNzcygndGV4dC1hbGlnbicsICdjZW50ZXInKS5odG1sKE1zZy5yZXBvcnRUb29sLnRhYmxlWzhdKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhYmxlQ29udGVudC5hcHBlbmQodHJDb250ZW50KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnIycgKyBwLmJvZHlJRCkuY3NzKCdtYXJnaW4tdG9wJywgJy0xcHgnKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgIXAuc2luZ2FsTGluZUhlYWRlclRhYmxlICYmIGcuY3JlYXRlTWl0bEhlYWRlTGF5b3V0VFIodGFibGVDb250ZW50LCBwLmNvbE1vZGVsQ29weSk7XHJcbiAgICAgICAgICAgICAgICAgICAgJC5lYWNoKHAuZGF0YSwgZnVuY3Rpb24gKGkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRyQ29udGVudCA9IGcuY3JlYXRlUm93KHRoaXMsIGkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0YWJsZUNvbnRlbnQuYXBwZW5kKHRyQ29udGVudCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHAuZXhwYW5kICYmIHRhYmxlQ29udGVudC5hcHBlbmQoZy5jcmVhdGVFeHBhbmRCb3godGhpcywgaSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZy5yZXNpemVCb3goKTtcclxuICAgICAgICAgICAgICAgIGcubG9hZFN1Y2Nlc3MoKTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgaHRycyA9ICQoJyMnICsgcC5oZWFkZXJJRCkuZmluZCgndHI6bm90KC5jaGlsZCknKTtcclxuICAgICAgICAgICAgICAgIHZhciBidHJzID0gJCgnIycgKyBwLmJvZHlJRCkuZmluZCgndHI6bm90KC5jaGlsZCknKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAocC5vbkxvYWRSZWFkeSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHAub25Mb2FkUmVhZHkocC5kYXRhLCBidHJzLCBodHJzLCBwLnRvdGFsUmVjb3Jkcyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHAuaXNTZWFyY2hSZWNvcmRTZWxlY3RlZCB8fCBwLmlzUmVjb3JkU2VsZWN0ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbnVtID0gMDtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWVzID0gZy5tYXAuZ2V0S2V5cygpIHx8IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcC5kYXRhLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB2ID0gcC5kYXRhW2ldW3AuaWRQcm9wZXJ0eSB8fCBwLmNvbE1vZGVsQ29weVswXS5uYW1lXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHYgPT09IHVuZGVmaW5lZCAmJiAocC5pZFByb3BlcnR5IHx8IHAuY29sTW9kZWxDb3B5WzBdLm5hbWUpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdiA9IGV2YWwoJ3AuZGF0YVtpXS4nICsgKHAuaWRQcm9wZXJ0eSB8fCBwLmNvbE1vZGVsQ29weVswXS5uYW1lKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZXMuY29udGFpbnModikpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoYnRyc1tpXSkuYWRkQ2xhc3MoJ1NlbGVjdGVkQm9keUxpbmUnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHAuaXNTaG93U2VsZWN0ICYmICgkKGJ0cnNbaV0pLmZpbmQoJy5Cb2R5Q2hlY2tCb3gnKVswXS5jaGVja2VkID0gdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW0rKztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAobnVtICYmIG51bSA9PSBwLmRhdGEubGVuZ3RoICYmICFwLnNpbmdsZVNlbGVjdCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKGh0cnMpLmFkZENsYXNzKCdTZWxlY3RlZEhlYWRlckxpbmUnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcC5pc1Nob3dTZWxlY3QgJiYgKCQoaHRycykuZmluZCgnLkhlYWRlckNoZWNrQm94JylbMF0uY2hlY2tlZCA9IHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBNZW51Lmhhc0VsZW1lbnRSaWdodCgpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBjcmVhdGVFeHBhbmRCb3g6IGZ1bmN0aW9uICh0aGF0LCBpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSB0aGF0W3AuaWRQcm9wZXJ0eSB8fCBwLmNvbE1vZGVsQ29weVswXS5uYW1lXTtcclxuICAgICAgICAgICAgICAgIGlmIChpbmRleCA9PT0gdW5kZWZpbmVkICYmIChwLmlkUHJvcGVydHkgfHwgcC5jb2xNb2RlbENvcHlbMF0ubmFtZSkpXHJcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggPSBldmFsKCd0aGF0LicgKyAocC5pZFByb3BlcnR5IHx8IHAuY29sTW9kZWxDb3B5WzBdLm5hbWUpKTtcclxuICAgICAgICAgICAgICAgIHZhciB0ckNvbnRlbnQgPSAkKFwiPHRyLz5cIikuYWRkQ2xhc3MoJ2NoaWxkIGNoaWxkXycgKyAoaW5kZXggfHwgaSkpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGNvbHNwYW4gPSBwLmNvbF9udW0gKyAxO1xyXG4gICAgICAgICAgICAgICAgKHAuY2xpY2tTZWxlY3QgJiYgcC5pc1Nob3dTZWxlY3QpICYmIGNvbHNwYW4rKztcclxuICAgICAgICAgICAgICAgIHZhciB0ZENvbnRlbnQgPSAkKFwiPHRkLz5cIikuYXR0cignY29sc3BhbicsIGNvbHNwYW4pO1xyXG4gICAgICAgICAgICAgICAgdmFyIGNvbnRlbnQgPSAkKFwiPGRpdi8+XCIpLmFkZENsYXNzKCdleHBhbmQtYm94JykuY3NzKHtcclxuICAgICAgICAgICAgICAgICAgICAnaGVpZ2h0JzogcC5leHBhbmRCb3hIZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAgICAgJ21pbi1oZWlnaHQnOiBwLmxpbmVfaGVpZ2h0XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICB0ZENvbnRlbnQuYXBwZW5kKGNvbnRlbnQpO1xyXG4gICAgICAgICAgICAgICAgdHJDb250ZW50LmFwcGVuZCh0ZENvbnRlbnQpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChwLmV4cGFuZEluZGV4ID09IChpbmRleCB8fCBpKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRyQ29udGVudC5hZGRDbGFzcygnZXhwYW5kZWQnKTtcclxuICAgICAgICAgICAgICAgICAgICAkLmlzRnVuY3Rpb24ocC5leHBhbmQpICYmIHAuZXhwYW5kKHRoYXQsIGNvbnRlbnQsIGkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB0ckNvbnRlbnQ7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiDlr7nljZXlhYPmoLzmlbDmja7ov5vooYznibnmrorlpITnkIZcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIGhhbmRsZURhdGE6IGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGF0YSA9PSBudWxsKSByZXR1cm4gJyc7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0YTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIOWNleWHu+ihqOagvOWktOihjOeahOWkhOeQhuWHveaVsFxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgc2luZ2xlQ2xpY2tIZWFkZXJMaW5lOiBmdW5jdGlvbiAodHJDb250ZW50LCBkb3VibGVDbGljaykge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFwLmNsaWNrU2VsZWN0IHx8IHAuc2luZ2xlU2VsZWN0KSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB2YXIgY2hlY2tib3ggPSB0ckNvbnRlbnQuZmluZCgnLkhlYWRlckNoZWNrQm94JylbMF07XHJcbiAgICAgICAgICAgICAgICBpZiAoZG91YmxlQ2xpY2spIHtcclxuICAgICAgICAgICAgICAgICAgICB0ckNvbnRlbnQuYWRkQ2xhc3MoJ1NlbGVjdGVkSGVhZGVyTGluZScpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNoZWNrYm94LmNoZWNrZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0ckNvbnRlbnQudG9nZ2xlQ2xhc3MoJ1NlbGVjdGVkSGVhZGVyTGluZScpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNoZWNrYm94LmNoZWNrZWQgPSBjaGVja2JveC5jaGVja2VkID8gZmFsc2UgOiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0ckNvbnRlbnQuaGFzQ2xhc3MoJ1NlbGVjdGVkSGVhZGVyTGluZScpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnIycgKyBwLmJvZHlJRCArICcuR3JpZFRhYmxlQm9keURpdiB0cjpub3QoLmNoaWxkKScpLmVhY2goZnVuY3Rpb24gKGksIHJvdykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBnLnNpbmdsZUNsaWNrQm9keUxpbmUoJChyb3cpLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnIycgKyBwLmJvZHlJRCArICcuR3JpZFRhYmxlQm9keURpdiB0cjpub3QoLmNoaWxkKScpLmVhY2goZnVuY3Rpb24gKGksIHJvdykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBnLnNpbmdsZUNsaWNrQm9keUxpbmUoJChyb3cpLCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiDlj4zlh7vooajmoLzlpLTooYznmoTlpITnkIblh73mlbBcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIGRvdWJsZUNsaWNrSGVhZGVyTGluZTogZnVuY3Rpb24gKHRyQ29udGVudCkge1xyXG4gICAgICAgICAgICAgICAgZy5zaW5nbGVDbGlja0hlYWRlckxpbmUodHJDb250ZW50LCB0cnVlKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIOWNleWHu+ihqOagvOS4u+S9k+ihjOeahOWkhOeQhuWHveaVsFxyXG4gICAgICAgICAgICAgKlxyXG4gICAgICAgICAgICAgKiBAcGFyYW0gdHJDb250ZW50IOaTjeS9nOihjFxyXG4gICAgICAgICAgICAgKiBAcGFyYW0gZG91YmxlQ2xpY2sg5piv5ZCm5piv5Y+M5Ye75pON5L2cXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBzaW5nbGVDbGlja0JvZHlMaW5lOiBmdW5jdGlvbiAodHJDb250ZW50LCBkb3VibGVDbGljaykge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFwLmNsaWNrU2VsZWN0KSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICBpZiAocC5zaW5nbGVTZWxlY3QpIHtcclxuICAgICAgICAgICAgICAgICAgICBnLm1hcC5jbGVhcigpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRyQ29udGVudC5zaWJsaW5ncygpLmVhY2goZnVuY3Rpb24gKGksIHJvdykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKHJvdykucmVtb3ZlQ2xhc3MoJ1NlbGVjdGVkQm9keUxpbmUnKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHZhciBjaGVja2JveCA9IHRyQ29udGVudC5maW5kKCcuQm9keUNoZWNrQm94JylbMF07XHJcbiAgICAgICAgICAgICAgICBpZiAoY2hlY2tib3gpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZG91YmxlQ2xpY2spIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHJDb250ZW50LmFkZENsYXNzKCdTZWxlY3RlZEJvZHlMaW5lJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrYm94LmNoZWNrZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwLnNpbmdsZVNlbGVjdCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tib3guY2hlY2tlZCA9IHRyQ29udGVudC5oYXNDbGFzcygnU2VsZWN0ZWRCb2R5TGluZScpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyQ29udGVudC50b2dnbGVDbGFzcygnU2VsZWN0ZWRCb2R5TGluZScsICFjaGVja2JveC5jaGVja2VkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tib3guY2hlY2tlZCA9ICFjaGVja2JveC5jaGVja2VkO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJDb250ZW50LnRvZ2dsZUNsYXNzKCdTZWxlY3RlZEJvZHlMaW5lJywgIXRyQ29udGVudC5oYXNDbGFzcygnU2VsZWN0ZWRCb2R5TGluZScpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChwLm9uU2luZ2xlQ2xpY2spIHtcclxuICAgICAgICAgICAgICAgICAgICBwLm9uU2luZ2xlQ2xpY2sodHJDb250ZW50LCBnLmdldERhdGEodHJDb250ZW50KSwgdHJDb250ZW50Lmhhc0NsYXNzKCdTZWxlY3RlZEJvZHlMaW5lJykpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZy5zdG9yYWdlU2VsZWN0ZWQodHJDb250ZW50KTtcclxuICAgICAgICAgICAgICAgIGlmICghcC5zaW5nbGVTZWxlY3QpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaHRycyA9ICQoJyMnICsgcC5oZWFkZXJJRCkuZmluZCgndHI6bm90KC5jaGlsZCknKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYnRycyA9ICQoJyMnICsgcC5ib2R5SUQpLmZpbmQoJ3RyIHRkLm5vUmVzaXplIGlucHV0LkJvZHlDaGVja0JveCcpO1xyXG4vLyAgICAgICAgICAgICAgICAgICAgXHQkKCcjJyArIHAuYm9keUlEKS5maW5kKCd0cjpub3QoLmNoaWxkKScpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBic3RycyA9ICQoJy5TZWxlY3RlZEJvZHlMaW5lJywgJCgnIycgKyBwLmJvZHlJRCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChic3Rycy5sZW5ndGggJiYgYnN0cnMubGVuZ3RoID09IGJ0cnMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGh0cnMuYWRkQ2xhc3MoJ1NlbGVjdGVkSGVhZGVyTGluZScpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBodHJzLmZpbmQoJy5IZWFkZXJDaGVja0JveCcpWzBdLmNoZWNrZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGh0cnMucmVtb3ZlQ2xhc3MoJ1NlbGVjdGVkSGVhZGVyTGluZScpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBodHJzLmZpbmQoJy5IZWFkZXJDaGVja0JveCcpWzBdLmNoZWNrZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiDlj4zlh7vooajmoLzkuLvkvZPooYznmoTlpITnkIblh73mlbBcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIGRvdWJsZUNsaWNrQm9keUxpbmU6IGZ1bmN0aW9uICh0ckNvbnRlbnQpIHtcclxuICAgICAgICAgICAgICAgIGcuc2luZ2xlQ2xpY2tCb2R5TGluZSh0ckNvbnRlbnQsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHAub25Eb3VibGVDbGljaykge1xyXG4gICAgICAgICAgICAgICAgICAgIHAub25Eb3VibGVDbGljayh0ckNvbnRlbnQsIGcuZ2V0RGF0YSh0ckNvbnRlbnQpLCB0ckNvbnRlbnQuaGFzQ2xhc3MoJ1NlbGVjdGVkQm9keUxpbmUnKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiDorrDlvZXpgInkuK3poblcclxuICAgICAgICAgICAgICogQHBhcmFtIHRyQ29udGVudCDmk43kvZzooYxcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIHN0b3JhZ2VTZWxlY3RlZDogZnVuY3Rpb24gKHRyQ29udGVudCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlY29yZCA9IGcuZ2V0RGF0YSh0ckNvbnRlbnQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRyQ29udGVudC5oYXNDbGFzcygnU2VsZWN0ZWRCb2R5TGluZScpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZy5tYXAucHV0KHJlY29yZFtwLmlkUHJvcGVydHkgfHwgcC5jb2xNb2RlbENvcHlbMF0ubmFtZV0sIHJlY29yZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBnLm1hcC5yZW1vdmUocmVjb3JkW3AuaWRQcm9wZXJ0eSB8fCBwLmNvbE1vZGVsQ29weVswXS5uYW1lXSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBnLnJlZnJlc2hTZWxlY3RlZFNob3dCb3goKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIOWIt+aWsOmAieS4remhueWxleekuuahhlxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgcmVmcmVzaFNlbGVjdGVkU2hvd0JveDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgJCgnLnNlbGVjdGVkU2hvd0JveCcsICQodCkpLmVtcHR5KCk7XHJcbiAgICAgICAgICAgICAgICB2YXIgdmFsdWVzID0gZy5tYXAuZ2V0VmFsdWVzKCkgfHwgW107XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHZhbHVlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBuYW1lID0gcC5pZFByb3BlcnR5IHx8IHAuY29sTW9kZWxDb3B5WzBdLm5hbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRleHQgPSB2YWx1ZXNbaV1bcC5zaG93U2VsZWN0ZWROYW1lIHx8IG5hbWVdO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBrZXkgPSB2YWx1ZXNbaV1bbmFtZV07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0ZXh0ID09PSB1bmRlZmluZWQgJiYgKHAuc2hvd1NlbGVjdGVkTmFtZSB8fCBuYW1lKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dCA9IGV2YWwoJ3RoYXQuJyArIChwLnNob3dTZWxlY3RlZE5hbWUgfHwgbmFtZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChrZXkgPT09IHVuZGVmaW5lZCAmJiBuYW1lKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBrZXkgPSBldmFsKCd0aGF0LicgKyBuYW1lKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRleHQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGl0ZW0gPSAkKCc8bGk+JykuYXR0cigndGl0bGUnLCB0ZXh0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5hcHBlbmQoJCgnPGRpdj4nKS5hZGRDbGFzcygndCcpLnRleHQodGV4dCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmFwcGVuZCgkKCc8ZGl2Png8L2Rpdj4nKS5hZGRDbGFzcygnY2xvc2UnKS5jbGljaygoZnVuY3Rpb24gKGl0ZW0sIGtleSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZy5tYXAucmVtb3ZlKGtleSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnLmFkZERhdGEoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KShpdGVtLCBrZXkpKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQoJy5zZWxlY3RlZFNob3dCb3gnLCAkKHQpKS5hcHBlbmQoaXRlbSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpID09IHZhbHVlcy5sZW5ndGggLSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQoJy5zZWxlY3RlZFNob3dCb3gnLCAkKHQpKS5hcHBlbmQoJzxkaXYgY2xhc3M9XCJjbGVhclwiPjwvZGl2PicpXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICog6YCJ5Lit6aG56K6w5b2VIEpTT04g5pWw5o2uIOKAlOKAlCDnsbtNYXDmk43kvZxcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIG1hcDoge1xyXG4gICAgICAgICAgICAgICAgcHV0OiBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcC5zZWxlY3RlZFJlY29yZHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHAuc2VsZWN0ZWRSZWNvcmRzW2ldLmtleSA9PT0ga2V5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwLnNlbGVjdGVkUmVjb3Jkc1tpXS52YWx1ZSA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHAuc2VsZWN0ZWRSZWNvcmRzLnB1c2goeydrZXknOiBrZXksICd2YWx1ZSc6IHZhbHVlfSk7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgcmVtb3ZlOiBmdW5jdGlvbiAoa2V5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwLnNlbGVjdGVkUmVjb3Jkcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdiA9IHAuc2VsZWN0ZWRSZWNvcmRzLnBvcCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodi5rZXkgPT09IGtleSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgcC5zZWxlY3RlZFJlY29yZHMudW5zaGlmdCh2KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgZ2V0S2V5czogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHRBcnIgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHAuc2VsZWN0ZWRSZWNvcmRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB2ID0gcC5zZWxlY3RlZFJlY29yZHNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdEFyci5wdXNoKHYua2V5KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdEFycjtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBnZXRWYWx1ZXM6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdWx0QXJyID0gW107XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwLnNlbGVjdGVkUmVjb3Jkcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdiA9IHAuc2VsZWN0ZWRSZWNvcmRzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRBcnIucHVzaCh2LnZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdEFycjtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBjbGVhcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHAuc2VsZWN0ZWRSZWNvcmRzID0gW107XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiDojrflj5booajmoLzooYznmoTkuIDooYzmlbDmja7vvIzov5Tlm55qc29u5qC85byPXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBnZXREYXRhOiBmdW5jdGlvbiAodHJDb250ZW50KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmVjb3JkID0ge307XHJcbiAgICAgICAgICAgICAgICB0ckNvbnRlbnQuZmluZCgnLkJvZHlUZENvbnRlbnQnKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICByZWNvcmRbJCh0aGlzKS5hdHRyKCduYW1lJyldID0gJCh0aGlzKS5hdHRyKCd2YWx1ZScpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVjb3JkO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICog5Yib5bu65YiG6aG15bel5YW35p2hXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBwYWdlQmFyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBnLmFkZFRvb2xCYXIoKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIOa3u+WKoOihqOagvOWIhumhteW3peWFt+adoVxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgYWRkVG9vbEJhcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGJhckRpdiA9ICQoXCI8ZGl2IC8+XCIpO1xyXG4gICAgICAgICAgICAgICAgYmFyRGl2LmF0dHIoXCJpZFwiLCBwLnBhZ2VCYXJJRCk7XHJcbiAgICAgICAgICAgICAgICBiYXJEaXYuYXR0cihcImNsYXNzXCIsIFwiUGFnZVRvb2xCYXJcIik7XHJcbiAgICAgICAgICAgICAgICBiYXJEaXYuY3NzKHsnd2lkdGgnOiBnLmNhbFdpZHRoKCksICdoZWlnaHQnOiBwLnRvb2xCYXJIZWlnaHR9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAkKCcjJyArIHAud2hvbGVJRCkuYXBwZW5kKGJhckRpdik7XHJcbiAgICAgICAgICAgICAgICBwLnRvb2xCYXIgPT0gJ2hpZGUnID8gYmFyRGl2LmhpZGUoKSA6IDA7XHJcbiAgICAgICAgICAgICAgICBnLmFkZEJhclRhYmxlKGJhckRpdik7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiDmt7vliqDooajmoLzliIbpobXlt6XlhbfmnaHmoYbmnrZcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIGFkZEJhclRhYmxlOiBmdW5jdGlvbiAoYmFyRGl2KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGFibGVDb250ZW50ID0gJChcIjxkaXYvPlwiKS5hZGRDbGFzcygnR3JpZFRhYmxlQmFyQm9keScpO1xyXG4gICAgICAgICAgICAgICAgYmFyRGl2LmFwcGVuZCh0YWJsZUNvbnRlbnQpO1xyXG4gICAgICAgICAgICAgICAgZy5hZGRUb29sQmFyQ29udGVudCh0YWJsZUNvbnRlbnQsICdMZWZ0Jyk7XHJcbiAgICAgICAgICAgICAgICBnLmFkZFRvb2xCYXJDb250ZW50KHRhYmxlQ29udGVudCwgJ1JpZ2h0Jyk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiDmt7vliqDooajmoLzliIbpobXlt6XlhbfmnaHkuK3nmoTlhbfkvZPlhoXlrrlcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIGFkZFRvb2xCYXJDb250ZW50OiBmdW5jdGlvbiAodHJCYXJDb250ZW50LCB0eXBlKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY29udGVudCA9IFtdO1xyXG4gICAgICAgICAgICAgICAgdmFyIGFsaWduID0gJyc7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZSA9PSAnTGVmdCcpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb250ZW50ID0gcC5sZWZ0Q29udGVudDtcclxuICAgICAgICAgICAgICAgICAgICBhbGlnbiA9IFwibGVmdFwiO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlID09ICdSaWdodCcpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb250ZW50ID0gcC5yaWdodENvbnRlbnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgYWxpZ24gPSBcInJpZ2h0XCI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB2YXIgcGFuID0gJCgnPHAvPicpLmNzcygnZmxvYXQnLCBhbGlnbikuYWRkQ2xhc3MoJ0dyaWRUYWJsZVRvb2xCYXJCb2R5JyArIHR5cGUpO1xyXG4gICAgICAgICAgICAgICAgJC5lYWNoKGNvbnRlbnQsIGZ1bmN0aW9uIChpbmRleCwgZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBpbnB1dCA9ICQoXCI8XCIgKyBkLmlucHV0ICsgXCIgLz5cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgZC5uYW1lICYmIGlucHV0LmF0dHIoJ2NsYXNzJywgZC5uYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICBwYW4uYXBwZW5kKGlucHV0KTtcclxuICAgICAgICAgICAgICAgICAgICBkLmlkcyAmJiBpbnB1dC5hdHRyKCdpZCcsIHAucGFnZUJhcklEICsgZC5pZHMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkLnR5cGUgPT0gJ2xhYmVsJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZC5maXgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0LmNzcyh7J3doaXRlLXNwYWNlJzogJ25vd3JhcCcsICd0ZXh0LW92ZXJmbG93JzogJ2VsbGlwc2lzJ30pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZC5zaG93ICYmIGlucHV0Lmh0bWwoZC5zaG93KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGQuc2hvdyAmJiBpbnB1dC5odG1sKHBbdGhpcy5zaG93XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnB1dC5hdHRyKCdzaXplJywgJzQnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZC50eXBlID09ICdzZWxlY3QnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGQud2lkdGggJiYgaW5wdXQuY3NzKHtcIndpZHRoXCI6IGQud2lkdGh9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZC5oZWlnaHQgJiYgaW5wdXQuY3NzKHtcImhlaWdodFwiOiBkLmhlaWdodH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IHBbZC5zaG93XTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgb3B0aW9uID0gJChcIjxvcHRpb24gLz5cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnB1dC5hcHBlbmQob3B0aW9uKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbi52YWwoZGF0YVtpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb24uaHRtbChkYXRhW2ldKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChkLnR5cGUgPT0gJ3RleHQnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGQud2lkdGggJiYgaW5wdXQuY3NzKHtcIndpZHRoXCI6IGQud2lkdGh9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZC5oZWlnaHQgJiYgaW5wdXQuY3NzKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiaGVpZ2h0XCI6IGQuaGVpZ2h0LCBcInRleHQtYWxpZ25cIjogXCJjZW50ZXJcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZC5zaG93ICYmIGlucHV0LnZhbChwW2Quc2hvd10pO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZC50eXBlID09ICdidXR0b24nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0LmNzcyh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAndmVydGljYWwtYWxpZ24nOiAnbWlkZGxlJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ2lubGluZS1ibG9jaydcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSkuYWRkQ2xhc3MoXCJwYnV0dG9uX29uXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkLnNob3cgJiYgaW5wdXQudmFsKHBbZC5zaG93XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGQud2lkdGggJiYgaW5wdXQuY3NzKHtcIndpZHRoXCI6IGQud2lkdGh9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZC5oZWlnaHQgJiYgaW5wdXQuY3NzKHtcImhlaWdodFwiOiBkLmhlaWdodH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZGl2ID0gJChcIjxkaXYvPlwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZC5pZHMgJiYgZGl2LmF0dHIoXCJjbGFzc1wiLCBkLmlkcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGQud2lkdGggJiYgZGl2LmNzcyh7XCJ3aWR0aFwiOiAnMTAwJSd9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZC5oZWlnaHQgJiYgZGl2LmNzcyh7XCJoZWlnaHRcIjogJzEwMCUnfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0LmFwcGVuZChkaXYudGV4dChkLnNob3cpKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZC5sZWZ0ICYmIGlucHV0LmJlZm9yZSgkKFwiPGxhYmVsLz5cIikuY3NzKFwid2lkdGhcIiwgZC5sZWZ0KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZC5yaWdodCAmJiBpbnB1dC5hZnRlcigkKFwiPGxhYmVsLz5cIikuY3NzKFwid2lkdGhcIiwgZC5yaWdodCkpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB0ckJhckNvbnRlbnQuYXBwZW5kKHBhbik7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiDmt7vliqDooajmoLzliIbpobXlt6XlhbfmnaHkuK3nmoTkuovku7blk43lupRcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIGluaXRFdmVudHM6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICQoJyMnICsgcC5wYWdlQmFySUQgKyBcInBzZWxlY3RfcnBzXCIpLmNoYW5nZShmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHAuY3VycmVudFBhZ2UgPSAxO1xyXG4gICAgICAgICAgICAgICAgICAgIHAucnAgPSBwLnJwc1tkYXRhLmRlbGVnYXRlVGFyZ2V0LnNlbGVjdGVkSW5kZXhdO1xyXG4gICAgICAgICAgICAgICAgICAgIGcucmVmcmVzaFBhZ2UoKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgJCgnIycgKyBwLnBhZ2VCYXJJRCArIFwicGJ1dHRvbl9maXJzdFwiKS5jbGljayhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHAuY3VycmVudFBhZ2UgIT0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwLmN1cnJlbnRQYWdlID0gMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZy5yZWZyZXNoUGFnZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgJCgnIycgKyBwLnBhZ2VCYXJJRCArIFwicGJ1dHRvbl9wcmV2aW91c1wiKS5jbGljayhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHAuY3VycmVudFBhZ2UgPiAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHAuY3VycmVudFBhZ2UgLT0gMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZy5yZWZyZXNoUGFnZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgJCgnIycgKyBwLnBhZ2VCYXJJRCArIFwicGJ1dHRvbl9uZXh0XCIpLmNsaWNrKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocC5jdXJyZW50UGFnZSA8IHAudG90YWxQYWdlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHAuY3VycmVudFBhZ2UgPSBwYXJzZUludChwLmN1cnJlbnRQYWdlKSArIDE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGcucmVmcmVzaFBhZ2UoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICQoJyMnICsgcC5wYWdlQmFySUQgKyBcInBidXR0b25fbGFzdFwiKS5jbGljayhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHAuY3VycmVudFBhZ2UgIT0gcC50b3RhbFBhZ2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcC5jdXJyZW50UGFnZSA9IHAudG90YWxQYWdlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBnLnJlZnJlc2hQYWdlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAkKCcjJyArIHAucGFnZUJhcklEICsgXCJwdGV4dF90b1BhZ2VcIikua2V5ZG93bihmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZXZlbnQua2V5Q29kZSA9PSAxMykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBnLmp1bXBUb1BhZ2UoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICQoJyMnICsgcC5wYWdlQmFySUQgKyBcInBidXR0b25fanVtcFRvXCIpLmNsaWNrKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBnLmp1bXBUb1BhZ2UoKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgZy5pbml0VG9vbEJhclNlbGVjdCgpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogZ2/mjInpkq7ot7Povazlh73mlbBcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIGp1bXBUb1BhZ2U6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHZhciByZWcgPSAvXlswLTldKlsxLTldWzAtOV0qJC87XHJcbiAgICAgICAgICAgICAgICB2YXIgcGFnZVMgPSAkKCcjJyArIHAucGFnZUJhcklEICsgXCJwdGV4dF90b1BhZ2VcIikudmFsKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVnLnRlc3QocGFnZVMpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcGFnZVMgPSBwYXJzZUludChwYWdlUyk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBhZ2VTIDwgMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYWdlUyA9IDE7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwYWdlUyA+IHAudG90YWxQYWdlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhZ2VTID0gcC50b3RhbFBhZ2U7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwYWdlUyA9PSBwLmN1cnJlbnRQYWdlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICQoJyMnICsgcC5wYWdlQmFySUQgKyBcInB0ZXh0X3RvUGFnZVwiKS52YWwocC5jdXJyZW50UGFnZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcC5jdXJyZW50UGFnZSA9IHBhZ2VTO1xyXG4gICAgICAgICAgICAgICAgZy5yZWZyZXNoUGFnZSgpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICog5Yid5aeL5YyW6KGo5qC85YiG6aG15bel5YW35p2h5Lit55qEc2VsZWN05pWw5o2uXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBpbml0VG9vbEJhclNlbGVjdDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gcC5ycHMuaW5kZXhPZihwLnJwKTtcclxuICAgICAgICAgICAgICAgIGlmIChpbmRleCA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnIycgKyBwLnBhZ2VCYXJJRCArIFwicHNlbGVjdF9ycHNcIiArICcgb3B0aW9uOmVxKCcgKyBpbmRleCArICcpJykuYXR0cignc2VsZWN0ZWQnLCAndHJ1ZScpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBwLnJwID0gcC5ycHNbMF07XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICog5Yi35paw6KGo5qC85pW05L2T5YaF5a65XHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICByZWZyZXNoUGFnZTogZnVuY3Rpb24gKGYpIHtcclxuICAgICAgICAgICAgICAgIGlmIChmIHx8ICFwLmlzUmVjb3JkU2VsZWN0ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBnLm1hcC5jbGVhcigpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZy5jaGFuZ2VUb29sQmFyQnV0dG9uU3RzdHVzKCk7XHJcbiAgICAgICAgICAgICAgICBnLmNoYW5nZVBhcmFtcygpO1xyXG4gICAgICAgICAgICAgICAgJC5lYWNoKCQoJyMnICsgcC5oZWFkZXJJRCArICcgLkdyaWRUYWJsZUhlYWRlclRIJyksIGZ1bmN0aW9uIChpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlucHV0ID0gJCh0aGlzKS5maW5kKCdpbnB1dFt0eXBlPWNoZWNrYm94XScpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dC5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0WzBdLmNoZWNrZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmVDbGFzcygnU2VsZWN0ZWRIZWFkZXJMaW5lJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAkKCcjJyArIHAucGFnZUJhcklEICsgXCJwbGFiZWxfdG90YWxSZWNvcmRzXCIpLmh0bWwoTXNnLmdyaWRQYXJhbS5wcm9jTXNnKTtcclxuICAgICAgICAgICAgICAgIGlmIChwLnVybCkge1xyXG4gICAgICAgICAgICAgICAgICAgICQuaHR0cC5hamF4KHAudXJsLCBwLnBhcmFtcywgZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEuc3VjY2Vzcykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEuZGF0YSAmJiBkYXRhLmRhdGFbcC5saXN0XSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwLmxvYWRSZWFkeSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhLmRhdGEgPSBwLmxvYWRSZWFkeShkYXRhLmRhdGEpIHx8IGRhdGEuZGF0YTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcC50b3RhbFJlY29yZHMgPSBkYXRhLmRhdGFbcC50b3RhbF0gPyBkYXRhLmRhdGFbcC50b3RhbF0gOiAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHAuZGF0YSA9IGRhdGEuZGF0YVtwLmxpc3RdID8gZGF0YS5kYXRhW3AubGlzdF0gOiAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKCcjJyArIHAucGFnZUJhcklEICsgXCJwbGFiZWxfdG90YWxSZWNvcmRzXCIpLmh0bWwoTXNnLmdyaWRQYXJhbS5lbXB0eU1zZyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcC50b3RhbFJlY29yZHMgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHAuZGF0YSA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKCcjJyArIHAucGFnZUJhcklEICsgXCJwbGFiZWxfdG90YWxSZWNvcmRzXCIpLmh0bWwoTXNnLmdyaWRQYXJhbS5lbXB0eU1zZyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocC5sb2FkRXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwLmxvYWRFcnJvcihkYXRhLmRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcC50b3RhbFJlY29yZHMgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcC5kYXRhID0gMDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBnLmFkZERhdGEoKTtcclxuICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKCcjJyArIHAucGFnZUJhcklEICsgXCJwbGFiZWxfdG90YWxSZWNvcmRzXCIpLmh0bWwoTXNnLmdyaWRQYXJhbS5lbXB0eU1zZyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwLmxvYWRFcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcC5sb2FkRXJyb3IoZGF0YS5kYXRhIHx8IGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHAudG90YWxSZWNvcmRzID0gMDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcC5kYXRhID0gMDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZy5hZGREYXRhKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHAucHJvdG90eXBlRGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0ZW1wID0ge307XHJcbiAgICAgICAgICAgICAgICAgICAgdGVtcC5saXN0ID0gcC5wcm90b3R5cGVEYXRhLnNsaWNlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGVtcC50b3RhbCA9IHRlbXAubGlzdC5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRhdGEgPSB7fTtcclxuICAgICAgICAgICAgICAgICAgICBkYXRhLmRhdGEgPSB0ZW1wO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkYXRhLmRhdGEgJiYgZGF0YS5kYXRhW3AubGlzdF0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHAubG9hZFJlYWR5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhLmRhdGEgPSBwLmxvYWRSZWFkeShkYXRhLmRhdGEpIHx8IGRhdGEuZGF0YTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwLnRvdGFsUmVjb3JkcyA9IGRhdGEuZGF0YVtwLnRvdGFsXSA/IGRhdGEuZGF0YVtwLnRvdGFsXSA6IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHAuZGF0YSA9IGRhdGEuZGF0YVtwLmxpc3RdID8gZGF0YS5kYXRhW3AubGlzdF0gOiAwO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQoJyMnICsgcC5wYWdlQmFySUQgKyBcInBsYWJlbF90b3RhbFJlY29yZHNcIikuaHRtbChNc2cuZ3JpZFBhcmFtLmVtcHR5TXNnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcC50b3RhbFJlY29yZHMgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwLmRhdGEgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAocC5wcm90b3R5cGVTb3J0ICYmICQuaXNGdW5jdGlvbihwLnByb3RvdHlwZVNvcnQpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHAuZGF0YS5zb3J0KHAucHJvdG90eXBlU29ydChwLnBhcmFtc1snb3JkZXJCeSddLCBwLnBhcmFtc1snc29ydCddKSlcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcC5kYXRhID0gcC5kYXRhLnNsaWNlKChwLmN1cnJlbnRQYWdlIC0gMSkgKiBwLnJwLCBwLnJwICogcC5jdXJyZW50UGFnZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZy5hZGREYXRhKCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocC50b3RhbFJlY29yZHMgPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJCgnIycgKyBwLnBhZ2VCYXJJRCArIFwicGxhYmVsX3RvdGFsUmVjb3Jkc1wiKS5odG1sKE1zZy5ncmlkUGFyYW0uZW1wdHlNc2cpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJCgnIycgKyBwLnBhZ2VCYXJJRCArIFwicGxhYmVsX3RvdGFsUmVjb3Jkc1wiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5odG1sKFN0cmluZy5mb3JtYXQoTXNnLmdyaWRQYXJhbS5kaXNwbGF5TXNnLCBwLnRvdGFsUmVjb3JkcykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSwgMTAwKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIOWQjuWPsOaVsOaNruiOt+WPluaIkOWKn++8jOeahOWbnuiwg+WHveaVsFxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgbG9hZFN1Y2Nlc3M6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHAudG90YWxQYWdlID0gTWF0aC5jZWlsKHAudG90YWxSZWNvcmRzIC8gcC5ycCk7XHJcbiAgICAgICAgICAgICAgICBwLnRvdGFsUGFnZSA9IHAudG90YWxQYWdlID8gcC50b3RhbFBhZ2UgOiAxO1xyXG4gICAgICAgICAgICAgICAgZy5jaGFuZ2VUb29sQmFyQnV0dG9uU3RzdHVzKCk7XHJcbiAgICAgICAgICAgICAgICAkKCcjJyArIHAucGFnZUJhcklEICsgXCJwbGFiZWxfY3VycmVudFBhZ2UxXCIpLmh0bWwocC5jdXJyZW50UGFnZSk7XHJcbiAgICAgICAgICAgICAgICAkKCcjJyArIHAucGFnZUJhcklEICsgXCJwbGFiZWxfY3VycmVudFBhZ2UyXCIpLmh0bWwocC5jdXJyZW50UGFnZSk7XHJcbiAgICAgICAgICAgICAgICAkKCcjJyArIHAucGFnZUJhcklEICsgXCJwbGFiZWxfdG90YWxQYWdlXCIpLmh0bWwocC50b3RhbFBhZ2UpO1xyXG4gICAgICAgICAgICAgICAgJCgnIycgKyBwLnBhZ2VCYXJJRCArIFwicHRleHRfdG9QYWdlXCIpLnZhbChwLmN1cnJlbnRQYWdlKTtcclxuICAgICAgICAgICAgICAgIGlmIChwLnRvdGFsUmVjb3JkcyA9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnIycgKyBwLnBhZ2VCYXJJRCArIFwicGxhYmVsX3RvdGFsUmVjb3Jkc1wiKS5odG1sKE1zZy5ncmlkUGFyYW0uZW1wdHlNc2cpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAkKCcjJyArIHAucGFnZUJhcklEICsgXCJwbGFiZWxfdG90YWxSZWNvcmRzXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5odG1sKFN0cmluZy5mb3JtYXQoTXNnLmdyaWRQYXJhbS5kaXNwbGF5TXNnLCBwLnRvdGFsUmVjb3JkcykpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICog5qC55o2u5b2T5YmN6aG15ZKM5oC76aG15pWw5pS55Y+Y5bel5YW35p2h5oyJ6ZKu54q25oCBXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBjaGFuZ2VUb29sQmFyQnV0dG9uU3RzdHVzOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAkKFwiLnBidXR0b25cIiwgXCIjXCIgKyBwLnBhZ2VCYXJJRCkuYWRkQ2xhc3MoXCJwYnV0dG9uX29uXCIpO1xyXG4gICAgICAgICAgICAgICAgJChcIi5wYnV0dG9uXCIsIFwiI1wiICsgcC5wYWdlQmFySUQpLnJlbW92ZUNsYXNzKFwicGJ1dHRvbl9kaXNcIik7XHJcbiAgICAgICAgICAgICAgICBpZiAocC5jdXJyZW50UGFnZSA9PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnIycgKyBwLnBhZ2VCYXJJRCArIFwicGJ1dHRvbl9maXJzdFwiKS5yZW1vdmVDbGFzcyhcInBidXR0b25fb25cIikuYWRkQ2xhc3MoXCJwYnV0dG9uX2Rpc1wiKTtcclxuICAgICAgICAgICAgICAgICAgICAkKCcjJyArIHAucGFnZUJhcklEICsgXCJwYnV0dG9uX3ByZXZpb3VzXCIpLnJlbW92ZUNsYXNzKFwicGJ1dHRvbl9vblwiKS5hZGRDbGFzcyhcInBidXR0b25fZGlzXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHAuY3VycmVudFBhZ2UgPT0gcC50b3RhbFBhZ2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAkKCcjJyArIHAucGFnZUJhcklEICsgXCJwYnV0dG9uX25leHRcIikucmVtb3ZlQ2xhc3MoXCJwYnV0dG9uX29uXCIpLmFkZENsYXNzKFwicGJ1dHRvbl9kaXNcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnIycgKyBwLnBhZ2VCYXJJRCArIFwicGJ1dHRvbl9sYXN0XCIpLnJlbW92ZUNsYXNzKFwicGJ1dHRvbl9vblwiKS5hZGRDbGFzcyhcInBidXR0b25fZGlzXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICog5q+P5qyh5Yi35paw5YmN5L+u5pS55Y+C5pWw5YaF5a65XHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBjaGFuZ2VQYXJhbXM6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHAucGFyYW1zLnBhZ2UgPSBwLmN1cnJlbnRQYWdlO1xyXG4gICAgICAgICAgICAgICAgcC5wYXJhbXMucGFnZVNpemUgPSBwLnJwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgZy5pbml0KCk7XHJcbiAgICAgICAgZy5nZXRTaXplKCk7XHJcbiAgICAgICAgZy5jcmVhdGV3aG9sZSgpO1xyXG4gICAgICAgIHAuaXNSZWNvcmRTZWxlY3RlZCAmJiBwLnNob3dTZWxlY3RlZE5hbWUgJiYgZy5jcmVhdGVTZWxlY3RlZFNob3dCb3goKTtcclxuICAgICAgICBwLnRpdGxlICYmIGcuY3JlYXRlVGl0bGUoKTtcclxuICAgICAgICBwLmhlYWRlciAmJiBnLmNyZWF0ZUhlYWRlcigpO1xyXG4gICAgICAgIHAuYm9keSAmJiBnLmNyZWF0ZUJvZHkoKTtcclxuICAgICAgICBpZiAocC5wYWdlQmFyKSB7XHJcbiAgICAgICAgICAgIGcucGFnZUJhcigpO1xyXG4gICAgICAgICAgICBnLmluaXRFdmVudHMoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcC5ib2R5ICYmIChwLmRhdGEgPyBnLmFkZERhdGEoKSA6IGcucmVmcmVzaFBhZ2UoKSk7XHJcblxyXG4gICAgICAgICQodCkucmVzaXplKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgZy5yZXNpemUoKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBnLnJlc2l6ZSgpO1xyXG4gICAgICAgIHQuZ3JpZCA9IGc7XHJcbiAgICAgICAgdC5wID0gcDtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH07XHJcblxyXG4gICAgdmFyIGRvY0xvYWRlZCA9IGZhbHNlO1xyXG4gICAgJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGRvY0xvYWRlZCA9IHRydWU7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIOe7mOWIti/liJ3lp4vljJYg6KGo5qC8XHJcbiAgICAgKi9cclxuICAgICQuZm4uR3JpZFRhYmxlID0gZnVuY3Rpb24gKHApIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKCFkb2NMb2FkZWQpIHtcclxuICAgICAgICAgICAgICAgICQodGhpcykuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHQgPSB0aGlzO1xyXG4gICAgICAgICAgICAgICAgJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGFkZEdyaWQodCwgcCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGFkZEdyaWQodGhpcywgcCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDmianlsZXnu5Pngrnmn6Xor6Lkuovku7ZcclxuICAgICAqL1xyXG4gICAgJC5mbi5HcmlkVGFibGVTZWFyY2ggPSBmdW5jdGlvbiAocCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5ncmlkKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnAgPSAkLmV4dGVuZCh0aGlzLnAsIHApO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wLmN1cnJlbnRQYWdlID0gMTtcclxuICAgICAgICAgICAgICAgIHAgJiYgcC5kYXRhID8gdGhpcy5ncmlkLmFkZERhdGEoKSA6IHRoaXMuZ3JpZC5yZWZyZXNoUGFnZSghdGhpcy5wLmlzU2VhcmNoUmVjb3JkU2VsZWN0ZWQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICog6I635Y+W6YCJ5Lit6K6w5b2V55qESlNPTuWOn+Wei+agvOW8j1xyXG4gICAgICovXHJcbiAgICAkLmZuLkdyaWRUYWJsZVNlbGVjdGVkUmVjb3JkcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgcmVjb3JkcyA9IFtdO1xyXG4gICAgICAgIGlmICh0aGlzWzBdICYmIHRoaXNbMF0uZ3JpZClcclxuICAgICAgICAgICAgcmVjb3JkcyA9IHRoaXNbMF0uZ3JpZC5tYXAuZ2V0VmFsdWVzKCk7XHJcbiAgICAgICAgcmV0dXJuIHJlY29yZHM7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICog5Yid5aeL5YyW6YCJ5Lit6K6w5b2VXHJcbiAgICAgKi9cclxuICAgICQuZm4uR3JpZFRhYmxlSW5pdFNlbGVjdGVkUmVjb3JkcyA9IGZ1bmN0aW9uIChyZWNvcmRzKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoaSwgZykge1xyXG4gICAgICAgICAgICBpZiAoZyAmJiBnLmdyaWQgJiYgcmVjb3Jkcykge1xyXG4gICAgICAgICAgICAgICAgJC5lYWNoKHJlY29yZHMsIGZ1bmN0aW9uIChuLCB0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZy5ncmlkLm1hcC5wdXQodFtnLnAuaWRQcm9wZXJ0eSB8fCBnLnAuY29sTW9kZWxbMF0ubmFtZV0sIHQpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBnLmdyaWQucmVmcmVzaFNlbGVjdGVkU2hvd0JveCgpO1xyXG4gICAgICAgICAgICAgICAgLy9nLmdyaWQuYWRkRGF0YSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICog5Yi35paw6KGo5qC8XHJcbiAgICAgKi9cclxuICAgICQuZm4uR3JpZFRhYmxlUmVsb2FkID0gZnVuY3Rpb24gKHApIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuZ3JpZCAmJiBwKSAkLmV4dGVuZCh0aGlzLnAsIHApO1xyXG4gICAgICAgICAgICB0aGlzLnAudG90YWxSZWNvcmRzID0gMCxcclxuICAgICAgICAgICAgICAgIHRoaXMucC5jdXJyZW50UGFnZSA9IDEsXHJcbiAgICAgICAgICAgICAgICB0aGlzLnAudG90YWxQYWdlID0gMSxcclxuICAgICAgICAgICAgICAgIHRoaXMucC50b1BhZ2UgPSAxLFxyXG4gICAgICAgICAgICAgICAgdGhpcy5ncmlkLnJlZnJlc2hQYWdlKHRydWUsIHRydWUpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIOWIt+aWsOihqOagvOWcqOW9k+WJjemhteS4jeWBmumhtemdouWPmOabtC7kvYbmmK/mn6Xor6LmmK/kuI3og73mjonor6Xmlrnms5XnmoRcclxuICAgICAqL1xyXG4gICAgJC5mbi5HcmlkVGFibGVSZWZyZXNoUGFnZSA9IGZ1bmN0aW9uIChwKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmdyaWQgJiYgcCkgJC5leHRlbmQodGhpcy5wLCBwKTtcclxuICAgICAgICAgICAgdGhpcy5ncmlkLnJlZnJlc2hQYWdlKHRydWUpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIOiOt+WPluW9k+WJjemhtemhteeggVxyXG4gICAgICovXHJcbiAgICAkLmZuLkdyaWRUYWJsZUN1clBhZ2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGN1clBhZ2UgPSAxO1xyXG4gICAgICAgIGlmICh0aGlzWzBdICYmIHRoaXNbMF0uZ3JpZClcclxuICAgICAgICAgICAgY3VyUGFnZSA9IHRoaXNbMF0uZ3JpZC5wLmN1cnJlbnRQYWdlO1xyXG4gICAgICAgIHJldHVybiBjdXJQYWdlO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDmlrDlop7nu5PmnoTnm7jlkIznmoTooYwsIGV4cGFuZOeahOWPpuS4gOenjeaWueW8j1xyXG4gICAgICovXHJcbiAgICAkLmZuLkdyaWRUYWJsZUFwcGVuZFJvdyA9IGZ1bmN0aW9uIChpbmRleCwgZGF0YUxpc3QpIHtcclxuICAgICAgICB0aGlzWzBdLmdyaWQuYXBwZW5kUm93KGluZGV4LCBkYXRhTGlzdCk7XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiAkO1xyXG59KTsiXSwiZmlsZSI6InBsdWdpbnMvR3JpZFRhYmxlL0dyaWRUYWJsZS5qcyJ9
