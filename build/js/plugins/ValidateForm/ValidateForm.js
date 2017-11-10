/**
 * jQuery
 */

define(["jquery", "css!plugins/ValidateForm/css/ValidateForm.css"], function ($) {

    $.addValidate = function (t, id, options) {
        var p = $.extend({
            height: 400,			       //表单高度
            width: 400,				       //表单宽度
            validateID: '',			       //表单ID

            params: {},				       //表单内容获取时的参数
            listURL: '',			       //表单内容获取的请求url
            fnListSuccess: null,	       //表单内容获取成功回调函数
            fnListError: null,		       //表单内容获取失败回调函数

            header: [],				       //多表展示的表头
            only: true,				       //多表还是单表
            show: 'vertical',		       //表单显示方式：竖直的'vertical'，水平的'horizontal'
            type: 'add',			       //表单类型，add、modify、view
            config: '',				       //配置表单中显示框灰化（不能修改）
            parent: 'dialog',		       //该表单是否在dialog里

            model: null,			       //设置表单内容的配置,实例如下
            data: null,				       //表单所要展示的数据
            fnGetData: null,

            fnModifyData: null,		       //表单提交之前修改数据的回调
            fnSubmit: null,			       //自定义表单提交，若赋值，优先执行该方法，不执行表单默认的提交方法
            submitURL: '',			       //表单内容提交的请求url
            fnSubmitSuccess: null,	       //表单内容提交成功回调函数
            fnSubmitError: null,	       //表单内容提交失败回调函数

            rules: {},				       //表单验证规则
            messages: {},                  //表单验证自定义消息

            isEnterSubmit: null,           //是否回车键提交表单（前置条件：表单必须设置有 type=submit 的按钮；如果show='horizontal'，默认true；如果show='vertical'，默认false）
            hoverTitle: true,              //鼠标悬浮时显示提示信息(title)

            noButtons: false,              //是否不显示按钮（该参数只能控制 buttons 和 extraButtons 中配置的按钮显示情况，不能控制 toolButtons）
            toolButtons: false,            //工具栏按钮，已对象数组方式添加 [[{},{}],[{},{}]]，此参数有值时buttons、extraButtons参数无效
            extraButtons: false,		   //额外的按钮,已对象数组方式添加 [{},{}]
            buttons: [				       //表单按钮
                [
                    {
                        input: 'button',
                        type: 'submit',
                        show: Msg.sure,
                        name: '',
                        align: 'right',
                        width: '52%',
                        unit: '&nbsp;&nbsp;&nbsp;&nbsp;',
                        //extend: {class: 'button-save'}
                        extend: {'class': 'btn blueBtn btnThemeA noIcon'}
                    },
                    {
                        input: 'button',
                        type: 'close',
                        show: Msg.cancel,
                        name: '',
                        align: 'left',
                        width: '48%',
                        // extend: {class: 'button-cancel'},
                        extend: {'class': 'btn grayBtn btnThemeB noIcon'}
                    },
                    {
                        input: 'button',
                        type: 'close',
                        show: Msg.close,
                        name: '',
                        align: 'center',
                        width: '48%',
                        //extend: {class: 'button-save'},
                        extend: {'class': 'btn blueBtn btnThemeA noIcon'}
                    },
                    {
                        input: 'button',
                        type: 'submit',
                        show: Msg.search,
                        name: '',
                        align: 'center',
                        extend: {'class': 'btn searchBtn btnThemeA'}
                    }
                ]
            ]

        }, options);
        p.tempData = {};

        if (p.toolButtons) {
            p.buttons = p.toolButtons;
        } else {
            if (p.extraButtons) {
                p.buttons[1] = p.extraButtons
            }
            if (p.noButtons) {
                p.buttons[0].splice(0, p.buttons[0].length);
            } else {
                if (p.show == 'horizontal') {
                    p.buttons[0].shift();
                    p.buttons[0].shift();
                    p.buttons[0].shift();
                } else {
                    p.buttons[0].pop();
                    if (p.type == 'view') {
                        p.config = 'ALL';
                        p.buttons[0].shift();
                        p.buttons[0].shift();
                    } else {
                        p.buttons[0].pop();
                    }
                }
            }
        }

        t.p = p;
        var $this = $(t);

        $this.empty();
        p.validateID = id + "Validate";
        var validate = $("<form/>");
        validate.attr("id", p.validateID);
        $this.append(validate);
        p.only = p.model[0][0][0] ? false : true;

        var r = {
            /**
             * 作用:创建table
             * @validate:Form表单框架
             * @data:单个table表数据
             * @title:table表名
             */
            addFieldset: function (validate, data, title) {
                var maxLength = 0;
                $.each(data, function () {
                    maxLength = this.length > maxLength ? this.length : maxLength;
                });
                var fieldset = $("<fieldset/>");
                validate.append(fieldset);
                if (title) {
                    var legend = $("<legend/>");
                    legend.html(title);
                    fieldset.append(legend);
                }
                //else {
                //    if (p.show != 'horizontal') {
                //        fieldset.css({'margin-top': '10px'});
                //    }
                //}
                var tableContent = p.show == 'horizontal' ? $("<div/>") : $("<table/>");
                tableContent.addClass(p.show == 'horizontal' ? "horizontal-table" : "vertical-table");

                fieldset.append(tableContent);
                $.each(data, function () {
                    if (this.length > 0)
                        r.addTrContents(tableContent, this, maxLength);
                });
            },
            /**
             * 作用:添加表中一列数据
             * @tableContent:所要添加的table
             * @data:所要添加的一列内容的配置数据
             * @maxLength:所有列的最大td数
             */
            addTrContents: function (tableContent, data, maxLength) {
                var trContent = p.show == 'horizontal' ? $('<div class="clsRow"/>') : $('<tr/>');
                p.show != 'horizontal' ? tableContent.append(trContent) : 0;
                $.each(data, function (i) {
                    if (p.show == 'horizontal') {
                        trContent = $('<div class="clsRow"/>');
                        tableContent.append(trContent);
                    }
                    if ($.isArray(this)) {
                        $.each(this, function () {
                            r.addOneInputContents(trContent, this, data.length, i, maxLength);
                        });
                    } else {
                        r.addOneInputContents(trContent, this, data.length, i, maxLength);
                    }
                });
                if (p.show == 'horizontal') {
                    $.each(p.buttons, function () {
                        trContent = $('<div class="clsRow"/>');
                        tableContent.append(trContent);
                        r.addButton(trContent, this);
                    });
                }
                return trContent;
            },
            addOneInputContents: function (trContent, data, length, i, maxLength) {
                //if(!data.placeholder){
                r.addKeyclsTd(trContent, data);
                //}

                r.addValclsTd(trContent, data, length, i, maxLength);
            },
            addKeyclsTd: function (trContent, data) {
                var keycls = p.show == 'horizontal' ? $("<span/>") : $("<td/>");
                keycls.addClass("keycls");
                trContent.append(keycls);
                r.addKeyclsTdAttrs(keycls, data);
                return keycls;
            },
            addKeyclsTdAttrs: function (keycls, data) {
                var show = data.show ? data.show : keycls.hide();
                data.unit ? keycls.html(show + "(" + data.unit + ")") : keycls.html(show);
                data.hide ? keycls.parent().css({'display': 'none'}) : 0;
            },
            addValclsTd: function (trContent, data, length, i, maxLength) {
                var valcls = p.show == 'horizontal' ? $("<span/>") : $("<td/>");
                valcls.addClass("valcls");
                trContent.append(valcls);
                r.addValclsTdAttrs(valcls, data, length, i, maxLength);
                return valcls;
            },
            addValclsTdAttrs: function (tdContent, data, length, i, maxLength) {
                var colspan = 1;
                if (maxLength > length) {
                    colspan = (maxLength - length) * 2 + 1;
                }
                if (!(data.show)) colspan++;
                var input = null;
                // 非编辑效果
                if (p.config == "ALL" || p.config.split(",").indexOf(data.name + "") > -1) {
                    var inputType = data.input;
                    if (data.type == 'select') {
                        p.tempData[data.name] = [];
                        $.each(data.options, function () {
                            p.tempData[data.name].push(this);
                        });
                        inputType = 'input';
                        var showPanel = $('<div/>').addClass('valselect').addClass('disabled').css({
                            'text-overflow': 'ellipsis', 'overflow': 'hidden'
                        });
                        tdContent.append(showPanel);
                    }
                    if (data.type == 'range') {
                        inputType = 'input';
                    }
                    if (data.type == 'group') {
                        inputType = 'fieldset';
                    }
                    if (data.type == 'image-form') {
                        inputType = 'img';
                    }
                    input = $("<" + inputType + "/>").attr("type", data.type).attr("name", data.name)
                        .attr("readOnly", "readOnly").addClass("disabled");
                    if (data.type == 'group') {
                        input.attr('disabled', true);
                    }
                    if (data.type == 'image-form') {
                        input.attr('data-fileDisDir', data.fileDisDir);
                    }
                    tdContent.append(input);
                }
                // 编辑效果
                else {
                    if (data.type == 'select') {
                        input = $("<" + data.input + "/>").attr("name", data.name);
                        tdContent.append(input);
                        p.tempData[data.name] = [];
                        $.each(data.options, function () {
                            p.tempData[data.name].push(this);
                            var option = $("<option/>").val(this.value);
                            this.text ? option.html(this.text) : option.html(this.value);
                            input.append(option);
                        });
                    }
                    else if (data.type == 'range') {
                        input = r.createRangeBox(tdContent, data);
                    }
                    else if (data.type == 'group') {
                        input = $("<fieldset/>").attr('type', data.type).attr("name", data.name);
                        tdContent.append(input);
                    }
                    else if (data.type == 'file-form') {
                        input = r.createFromBox(tdContent, data);
                    }
                    else if (data.type == 'image-form') {
                        input = r.createFromBox(tdContent, data);
                    }
                    else {
                        input = $("<" + data.input + "/>").attr("type", data.type).attr("name", data.name);
                        tdContent.append(input);
                    }
                    p.rules[data.name] = data.rule || {};
                    data.placeholder && input.attr('placeholder', data.placeholder);
                    data.fnClick && input.click(data.fnClick);
                    data.rule && data.rule.required && tdContent.append($("<span/>").addClass("required-label").html("*"));
                }
                if (data.extend) {
                    for (var key in data.extend) {
                        if (data.extend.hasOwnProperty(key)) {
                            if (key == 'class') {
                                input.addClass(data.extend[key]);
                            }
                            else {
                                input.attr(key, data.extend[key]);
                            }
                        }
                    }
                }
                //input.blur(function(){r.onblur(this)});
                //input.css({'text-overflow': 'ellipsis', 'overflow': 'hidden'});
                input.addClass("valinput").addClass("val" + data.input);
                data.width && input.css({'width': data.width + 'px'});
                data.height && input.css({'height': data.height + 'px'});
                data.css && input.css(data.css);
                data.hide && tdContent.css({'display': 'none'});
                data.fnInit && input.data('fnInit', data.fnInit);
                data.before && input.before(data.before.css({
                        'display': 'inline-block',
                        'vertical-align': 'middle',
                        'margin-right': '10px'
                    })
                );
                data.after && input.after(data.after.css({
                        'display': 'inline-block',
                        'vertical-align': 'middle',
                        'margin-left': '10px'
                    })
                );
                if (p.hoverTitle) {
                    if (data.type != 'password' && data.type != 'group' && data.type != 'range' && data.type != 'image-form') {
                        $('[name=' + data.name + ']', '#' + p.validateID).parent('td').hover(function () {
                            var $this = $('[name=' + data.name + ']', $(this));
                            var text = $this.val() || '';
                            if (text && $this.get(0) && ($this.attr('type') || $this.get(0).tagName.toLowerCase()) == 'select') {
                                text = $('option[value="' + text + '"]', $this).text() || $this.text();
                            }
                            tdContent.attr('title', text);
                        });
                    }
                }
                if (i == length - 1 && colspan > 1) {
                    tdContent.attr('colspan', colspan);
                }
            },

            /**
             * 生成值域区间表单元素
             * @param tdContent 容器
             * @param data 数据
             */
            createRangeBox: function (tdContent, data) {
                var input = $("<" + data.input + "/>").attr('type', 'hidden').attr("name", data.name);
                tdContent.append(input);

                for (var i = 0; i < 2; i++) {
                    var queryBox = $('<span/>').attr('id', p.validateID + '_' + data.name + '_range' + i);
                    var operatorArr = [
                        {text: Msg.queryCondition.inclusion[1], value: 1},
                        {text: Msg.queryCondition.inclusion[0], value: 0}
                    ];
                    var operator = $("<select/>").addClass('operator').addClass("valinput")
                        .css({width: 70, height: 28, marginRight: 0});
                    $.each(operatorArr, function () {
                        operator.append($("<option/>").val(this.value).html(this.text));
                    });
                    queryBox.append(operator);
                    var value = $("<input/>").attr('id', p.validateID + '_' + data.name + '_range_' + i)
                        .attr('name', data.name + '_range' + i).attr('type', 'number')
                        .addClass('value').addClass("valinput").css({width: 105}).val(0);
                    queryBox.attr('enabled', true).append(value);
                    queryBox.prepend(i ? '<br/>' + Msg.queryCondition.extrernes[1] + '：'
                        : ' ' + Msg.queryCondition.extrernes[0] + '：');
                    tdContent.append(queryBox);

                    var rangeRule = (i === 0
                        ? {minTo: '#' + p.validateID + '_' + data.name + '_range_1'}
                        : {maxTo: '#' + p.validateID + '_' + data.name + '_range_0'});
                    //p.messages[data.name + '_range' + i] = { maxTo: '请输入大于最小值的数', minTo: '请输入小于最大值的数'};
                    p.rules[data.name + '_range' + i] = $.extend({}, data.rule || {}, rangeRule);
                }
                //增加在设置完成异常保护设置之后，还是会显示‘请输入小于最大值的数’
                $("#" + p.validateID + '_' + data.name + '_range_0').keyup(function () {
                    $("#" + p.validateID + '_' + data.name + '_range_1').focusout();
                });
                $("#" + p.validateID + '_' + data.name + '_range_1').keyup(function () {
                    $("#" + p.validateID + '_' + data.name + '_range_0').focusout();
                });
                return input;
            },

            /**
             * 生成表单表单元素（内嵌表单）
             * @param tdContent
             * @param data
             */
            createFromBox: function (tdContent, data) {
                var input = $('<input/>').attr('type', data.type).attr("name", data.name)
                    .attr('data-fileDisDir', data.fileDisDir).hide();
                for (var k = 0; k < (data.picNum || 1); k++) {
                    var picNumber = (k != 0 ? k : "");
                    var div = $('<div/>').addClass('valfileForm');
                    var chooseFileBtn = $('<button type="button" class="btnThemeA btn uploadBtn">' +
                    '<span class="btnL btnS"></span><span class="btnC btnS">' + Msg.upload +
                    '</span><span class="btnR btnS"></span></button>');
                    var chooseFile = $('<input/>').attr('type', 'file')
                        .attr('id', p.validateID + '_' + data.name + '_file' + picNumber).attr('name', data.name + '_file' + picNumber)
                        //.attr('accept', data.mimeType.toString())
                        .attr('title', '').addClass('fileupload-div').hide();
                    var preview = '';
                    if (data.type == 'image-form') {
                        preview = $('<img/>').attr('id', p.validateID + '_' + data.name + '_show' + picNumber)
                            .attr('src', '/images/index/fileupload/default.jpg')
                            .attr('onerror', 'this.src="/images/index/fileupload/default.jpg";this.onerror=null;');
                    }
                    div.append(preview);
                    div.append(chooseFileBtn.bind('click', function () {
                        $(this).parent().find('input[type=file]').click();
                    }));
                    div.append(chooseFile);

                    if (data.fnCloseClick) {
                        var closeImgDiv = $('<div/>').addClass('closeImgDiv').css({
                            'position': 'absolute',
                            'background': 'red url("/images/main/gs/close.png") no-repeat center',
                            'top': 0,
                            'right': 0,
                            'cursor': 'pointer',
                            'z-index': '1',
                            'width': 12,
                            'height': 12,
                            'border-radius': '50%',
                            'padding': 5,
                            'display': 'none'
                        }).bind('click', function (e) {
                            var d = $(e.target).parents('.valfileForm');
                            var img = $('#' + p.validateID + '_' + data.name + '_show' + picNumber, d);
                            if (img.get(0).tagName.toLowerCase() == 'img') {
                                img.attr('src', '/images/index/fileupload/default.jpg');
                            }
                            data.fnCloseClick(img, d.siblings('input[name=' + data.name + ']'), d);
                        });
                        div.append(closeImgDiv);
                    }

                    tdContent.append(div);
                }
                tdContent.append(input);
                $(".valfileForm").mouseover(function () { //显示删除叉
                    $(this).find(".closeImgDiv").css("display", "block");
                });
                $(".valfileForm").mouseout(function () {  //隐藏删除叉
                    $(this).find(".closeImgDiv").css("display", "none");
                });
                return input;

            },
            /**
             * 失去焦点时触发
             */
            onblur: function (that) {
                if ($(that).attr('type') == 'text') {
                    var value = $(that).val().trim();
                    $(that).val(value);
                }
            },
            addButton: function (trContent, data) {
                $.each(data, function (i, d) {
                    var tdContent = p.show == 'horizontal' ? $("<div/>").addClass('inline-button') : $("<td/>");
                    if (d.permissions) {
                        tdContent.attr('permission', d.permissions);
                    }
                    tdContent.attr('align', d.align).attr('width', d.width);
                    var input = $("<" + d.input + "/>").attr("type", "button").attr('data-btnType', d.type).addClass(d.name);
                    var span = $("<span/>").addClass("ui-button-text");
                    d.show && span.html(d.show);
                    tdContent.append(input);
                    input.append(span);
                    d.unit && tdContent.append($("<span/>").html(d.unit));

                    var rbtn = $('<button type="button" data-btnType="' + d.type + '">'
                    + '  <span class="btnL btnS"></span>'
                    + '  <span class="btnC btnS">' + d.show + '</span>'
                    + '  <span class="btnR btnS"></span>'
                    + '</button>');
                    input.replaceWith(rbtn);
                    rbtn.click(function () {
                        try {
                            eval(d.type + '()');
                        } catch (e) {
                        }
                        d.fnClick && d.fnClick();
                    });
                    // 点击回车键执行表单 submit 按钮单击事件
                    if ((p.isEnterSubmit || p.show == 'horizontal') && d.type === "submit") {
                        $("#" + p.validateID).keyup(function (event) {
                            if ((event.keyCode || event.which) == 13) {
                                $("[data-btnType='submit']", "#" + p.validateID).trigger("click");
                            }
                        });
                    }
                    if (d.extend) {
                        for (var key in d.extend) {
                            if (d.extend.hasOwnProperty(key)) {
                                if (key == 'class') {
                                    rbtn.addClass(d.extend[key]);
                                }
                                else {
                                    rbtn.attr(key, d.extend[key]);
                                }
                            }
                        }
                    }
                    trContent.append(tdContent);
                });
            },
            /**
             * 作用:添加addButtonsTable
             * @validate:Form表单框架
             * @data:所要添加的一列内容的配置数据
             */
            addButtonsTable: function (validate, data) {
                if (!(data && data[0] && data[0][0])) {
                    return;
                }
                var fieldset = $("<fieldset/>");
                var tableContent = $("<table/>").attr('width', '100%').attr('align', 'center').addClass("ui-dialog-buttonpane");
                $.each(data, function () {
                    var trContent = $("<tr style='height:45px' />");
                    r.addButton(trContent, this);
                    tableContent.append(trContent);
                });
                fieldset.append(tableContent);
                validate.append(fieldset);
            },
            /**
             * 作用:获取表单数据
             */
            list: function () {
                if (p.listURL) {
                    $.http.ajax(p.listURL, p.params, function (data) {
                        if (data.success) {
                            p.data = data.data;
                            r.init(p.data);
                            p.fnListSuccess && p.fnListSuccess(data);
                        }
                        else {
                            p.fnListError && p.fnListError(data);
                            r.init();
                            //r.close();
                        }
                    });
                }
            },
            /**
             * 作用:提交表单数据
             */
            modify: function () {
                var dt = $("#" + p.validateID).serializeArray();
                var data = {};
                $.each(dt, function (t, e) {
                    var key = e.name;
                    var tag = $('.valinput[name=' + key + ']', '#' + p.validateID);
                    if (tag.get(0).tagName.toLowerCase() == 'textarea') {
                        data[key] = e.value && ('' + e.value).replaceIllegalChar().replace(/\[/g, '「').replace(/]/g, '」');
                    } else {
                        data[key] = e.value && ('' + e.value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/x22/g, '&quot;').replace(/x27/g, '&#39;').replace(/\[/g, '「').replace(/]/g, '」');
                    }
                });
                data = p.fnModifyData ? p.fnModifyData(data) : data;
                if (p.fnSubmit) {
                    data.params = p.params;
                    $('[data-btnType=submit]', '#' + p.validateID).attr('disabled', false);
                    p.fnSubmit(data);
                }
                if (p.submitURL) {
                    $.http.ajax(p.submitURL, data, function (data) {
                        $('[data-btnType=submit]', '#' + p.validateID).attr('disabled', false);
                        if (data.success) {
                            p.fnSubmitSuccess && p.fnSubmitSuccess(data);
                            p.parent == 'dialog' && r.close();
                        }
                        else {
//                            p.type == 'modify' && r.init(p.data);
                            p.fnSubmitError && p.fnSubmitError(data);
                        }
                    });
                }
                return false;
            },
            /**
             * 作用:提交表单数据
             */
            submit: function () {
                $('[data-btnType=submit]', '#' + p.validateID).attr('disabled', true);
                r.modify();
                return false;
            },
            /**
             * 作用:关闭父类
             */
            close: function () {
                $(t).parents("div[role='dialog']").modal('hide');
            },
            /**
             * 作用:初始化表单内容
             * @data:表单数据
             */
            init: function (data) {
                /*var op = {};
                 op.rules = p.rules;
                 op.submitHandler = r.submit;
                 $("#" + p.validateID).validate(op);*/
                $(".valinput", "#" + p.validateID).each(function () {

                    var that = $(this);
                    var name = that.attr('name');
                    var value = data ? data[name] : null;
                    if ((name || name === '0') && (value || value === 0 || value === '0')) {
                        !$.isArray(value) && (value = ("" + value).replaceHTMLChar().replace(/「/g, '[').replace(/」/g, ']'));
                        if (this.tagName.toLowerCase() == 'textarea') {
                            that.html((value + "").replaceHTMLChar().replaceIllegalChar());
                        }
                        else if (this.tagName.toLowerCase() == 'select') {
                            var item = p.tempData[name];
                            if (item && value) {
                                that.val(value);
                            }
                        }
                        else if (this.getAttribute('type').toLowerCase() == 'image-form') {
                            if (value) {
                                var bg = new Image();
                                bg.src = (that.attr('data-fileDisDir') || '/temp/system/image/') + value;
                                bg.onload = function () {
                                    setTimeout(function () {
                                        that.parent().find('img')
                                            .attr('src', (that.attr('data-fileDisDir') || '/temp/system/image/') + value).attr('alt', value);
                                    }, 10);
                                };
                            }
                            that.val(value);
                        }
                        else {
                            if (that.attr('type') == 'select') {
                                var item = p.tempData[name];
                                if (item && value) {
                                    $.each(item, function (i, t) {
                                        if (t.value == value) {
                                            that.parent().find('.disabled')
                                                .html(((t.text || t.value) + "").replaceIllegalChar());
                                        }
                                    });
                                    that.hide();
                                }
                            }
                            that.val(value);
                        }
                    }
                    that.data('fnInit') && $.isFunction(that.data('fnInit')) && that.data('fnInit')(that, value, data);
                });
            },
            getData: function () {
                var dt = $("#" + p.validateID).serializeArray();
                var data = {};
                $.each(dt, function (t, e) {
                    //var key = e.name && e.name.replaceIllegalChar();
                    //data[key] = e.value && e.value.replaceIllegalChar();
                    var key = e.name;
                    data[key] = e.value;
                });
                data = p.fnModifyData ? p.fnModifyData(data) : data;
                p.fnGetData(data);
            }
        };

        var submit = function () {
            $("#" + p.validateID).submit();
        };
        var close = function () {
            r.close();
        };
        if (p.only) {
            var title = null;
            if (p.header.constructor == Array && p.header[0]) {
                title = p.header[0];
            } else if (p.header.constructor == String && p.header) {
                title = p.header;
            }
            r.addFieldset(validate, p.model, title);
        } else {
            $.each(p.model, function (i) {
                r.addFieldset(validate, this, p.header[i] ? p.header[i] : null);
            });
        }

        //表单初始化完成添加验证规则
        var op = {};
        op.rules = p.rules;
        op.messages = p.messages;
        op.submitHandler = r.submit;
        $("#" + p.validateID).validate(op);

        p.show == 'vertical' && r.addButtonsTable(validate, p.buttons);
        p.type == 'add' ? r.init({}) : (p.data ? r.init(p.data) : r.list());
        p.fnGetData && r.getData();
        t.r = r;
        return true;
    };
    var docLoaded = false;
    $(document).ready(function () {
        docLoaded = true;
    });

    $.fn.ValidateForm = function (id, p) {
        return this.each(function () {
            if (!docLoaded) {
                $(this).hide();
                var t = this;
                $(document).ready(function () {
                    $.addValidate(t, id, p);
                });
            } else {
                $.addValidate(this, id, p);
            }
        });
    };
    /**
     * 获取表单序列化数据
     * @param id
     * @returns {{}}
     * @constructor
     */
    $.fn.ValidateValue = function (id) {
        var dt = $("#" + id + "Validate").serializeArray();
        var data = {};
        $.each(dt, function (t, e) {
            var key = e.name;
            data[key] = e.value;
        });
        return data;
    };
    /**
     * 表单数据初始化
     * @returns {*}
     * @constructor
     */
    $.fn.ValidateInit = function () {
        return this.each(function () {
            if (this.p) {
                this.p.data ? this.r.init(this.p.data) : this.r.list();
            }
        });
    };
    $.fn.ValidateDialogClose = function () {
        return this.each(function () {
            if (this.p) {
                this.r.close();
            }
        });
    };
    return $;
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL1ZhbGlkYXRlRm9ybS9WYWxpZGF0ZUZvcm0uanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIGpRdWVyeVxyXG4gKi9cclxuXHJcbmRlZmluZShbXCJqcXVlcnlcIiwgXCJjc3MhcGx1Z2lucy9WYWxpZGF0ZUZvcm0vY3NzL1ZhbGlkYXRlRm9ybS5jc3NcIl0sIGZ1bmN0aW9uICgkKSB7XHJcblxyXG4gICAgJC5hZGRWYWxpZGF0ZSA9IGZ1bmN0aW9uICh0LCBpZCwgb3B0aW9ucykge1xyXG4gICAgICAgIHZhciBwID0gJC5leHRlbmQoe1xyXG4gICAgICAgICAgICBoZWlnaHQ6IDQwMCxcdFx0XHQgICAgICAgLy/ooajljZXpq5jluqZcclxuICAgICAgICAgICAgd2lkdGg6IDQwMCxcdFx0XHRcdCAgICAgICAvL+ihqOWNleWuveW6plxyXG4gICAgICAgICAgICB2YWxpZGF0ZUlEOiAnJyxcdFx0XHQgICAgICAgLy/ooajljZVJRFxyXG5cclxuICAgICAgICAgICAgcGFyYW1zOiB7fSxcdFx0XHRcdCAgICAgICAvL+ihqOWNleWGheWuueiOt+WPluaXtueahOWPguaVsFxyXG4gICAgICAgICAgICBsaXN0VVJMOiAnJyxcdFx0XHQgICAgICAgLy/ooajljZXlhoXlrrnojrflj5bnmoTor7fmsYJ1cmxcclxuICAgICAgICAgICAgZm5MaXN0U3VjY2VzczogbnVsbCxcdCAgICAgICAvL+ihqOWNleWGheWuueiOt+WPluaIkOWKn+Wbnuiwg+WHveaVsFxyXG4gICAgICAgICAgICBmbkxpc3RFcnJvcjogbnVsbCxcdFx0ICAgICAgIC8v6KGo5Y2V5YaF5a656I635Y+W5aSx6LSl5Zue6LCD5Ye95pWwXHJcblxyXG4gICAgICAgICAgICBoZWFkZXI6IFtdLFx0XHRcdFx0ICAgICAgIC8v5aSa6KGo5bGV56S655qE6KGo5aS0XHJcbiAgICAgICAgICAgIG9ubHk6IHRydWUsXHRcdFx0XHQgICAgICAgLy/lpJrooajov5jmmK/ljZXooahcclxuICAgICAgICAgICAgc2hvdzogJ3ZlcnRpY2FsJyxcdFx0ICAgICAgIC8v6KGo5Y2V5pi+56S65pa55byP77ya56uW55u055qEJ3ZlcnRpY2FsJ++8jOawtOW5s+eahCdob3Jpem9udGFsJ1xyXG4gICAgICAgICAgICB0eXBlOiAnYWRkJyxcdFx0XHQgICAgICAgLy/ooajljZXnsbvlnovvvIxhZGTjgIFtb2RpZnnjgIF2aWV3XHJcbiAgICAgICAgICAgIGNvbmZpZzogJycsXHRcdFx0XHQgICAgICAgLy/phY3nva7ooajljZXkuK3mmL7npLrmoYbngbDljJbvvIjkuI3og73kv67mlLnvvIlcclxuICAgICAgICAgICAgcGFyZW50OiAnZGlhbG9nJyxcdFx0ICAgICAgIC8v6K+l6KGo5Y2V5piv5ZCm5ZyoZGlhbG9n6YeMXHJcblxyXG4gICAgICAgICAgICBtb2RlbDogbnVsbCxcdFx0XHQgICAgICAgLy/orr7nva7ooajljZXlhoXlrrnnmoTphY3nva4s5a6e5L6L5aaC5LiLXHJcbiAgICAgICAgICAgIGRhdGE6IG51bGwsXHRcdFx0XHQgICAgICAgLy/ooajljZXmiYDopoHlsZXnpLrnmoTmlbDmja5cclxuICAgICAgICAgICAgZm5HZXREYXRhOiBudWxsLFxyXG5cclxuICAgICAgICAgICAgZm5Nb2RpZnlEYXRhOiBudWxsLFx0XHQgICAgICAgLy/ooajljZXmj5DkuqTkuYvliY3kv67mlLnmlbDmja7nmoTlm57osINcclxuICAgICAgICAgICAgZm5TdWJtaXQ6IG51bGwsXHRcdFx0ICAgICAgIC8v6Ieq5a6a5LmJ6KGo5Y2V5o+Q5Lqk77yM6Iul6LWL5YC877yM5LyY5YWI5omn6KGM6K+l5pa55rOV77yM5LiN5omn6KGM6KGo5Y2V6buY6K6k55qE5o+Q5Lqk5pa55rOVXHJcbiAgICAgICAgICAgIHN1Ym1pdFVSTDogJycsXHRcdFx0ICAgICAgIC8v6KGo5Y2V5YaF5a655o+Q5Lqk55qE6K+35rGCdXJsXHJcbiAgICAgICAgICAgIGZuU3VibWl0U3VjY2VzczogbnVsbCxcdCAgICAgICAvL+ihqOWNleWGheWuueaPkOS6pOaIkOWKn+Wbnuiwg+WHveaVsFxyXG4gICAgICAgICAgICBmblN1Ym1pdEVycm9yOiBudWxsLFx0ICAgICAgIC8v6KGo5Y2V5YaF5a655o+Q5Lqk5aSx6LSl5Zue6LCD5Ye95pWwXHJcblxyXG4gICAgICAgICAgICBydWxlczoge30sXHRcdFx0XHQgICAgICAgLy/ooajljZXpqozor4Hop4TliJlcclxuICAgICAgICAgICAgbWVzc2FnZXM6IHt9LCAgICAgICAgICAgICAgICAgIC8v6KGo5Y2V6aqM6K+B6Ieq5a6a5LmJ5raI5oGvXHJcblxyXG4gICAgICAgICAgICBpc0VudGVyU3VibWl0OiBudWxsLCAgICAgICAgICAgLy/mmK/lkKblm57ovabplK7mj5DkuqTooajljZXvvIjliY3nva7mnaHku7bvvJrooajljZXlv4Xpobvorr7nva7mnIkgdHlwZT1zdWJtaXQg55qE5oyJ6ZKu77yb5aaC5p6cc2hvdz0naG9yaXpvbnRhbCfvvIzpu5jorqR0cnVl77yb5aaC5p6cc2hvdz0ndmVydGljYWwn77yM6buY6K6kZmFsc2XvvIlcclxuICAgICAgICAgICAgaG92ZXJUaXRsZTogdHJ1ZSwgICAgICAgICAgICAgIC8v6byg5qCH5oKs5rWu5pe25pi+56S65o+Q56S65L+h5oGvKHRpdGxlKVxyXG5cclxuICAgICAgICAgICAgbm9CdXR0b25zOiBmYWxzZSwgICAgICAgICAgICAgIC8v5piv5ZCm5LiN5pi+56S65oyJ6ZKu77yI6K+l5Y+C5pWw5Y+q6IO95o6n5Yi2IGJ1dHRvbnMg5ZKMIGV4dHJhQnV0dG9ucyDkuK3phY3nva7nmoTmjInpkq7mmL7npLrmg4XlhrXvvIzkuI3og73mjqfliLYgdG9vbEJ1dHRvbnPvvIlcclxuICAgICAgICAgICAgdG9vbEJ1dHRvbnM6IGZhbHNlLCAgICAgICAgICAgIC8v5bel5YW35qCP5oyJ6ZKu77yM5bey5a+56LGh5pWw57uE5pa55byP5re75YqgIFtbe30se31dLFt7fSx7fV1d77yM5q2k5Y+C5pWw5pyJ5YC85pe2YnV0dG9uc+OAgWV4dHJhQnV0dG9uc+WPguaVsOaXoOaViFxyXG4gICAgICAgICAgICBleHRyYUJ1dHRvbnM6IGZhbHNlLFx0XHQgICAvL+mineWklueahOaMiemSrizlt7Llr7nosaHmlbDnu4TmlrnlvI/mt7vliqAgW3t9LHt9XVxyXG4gICAgICAgICAgICBidXR0b25zOiBbXHRcdFx0XHQgICAgICAgLy/ooajljZXmjInpkq5cclxuICAgICAgICAgICAgICAgIFtcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0OiAnYnV0dG9uJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N1Ym1pdCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNob3c6IE1zZy5zdXJlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAnJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWxpZ246ICdyaWdodCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAnNTIlJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdW5pdDogJyZuYnNwOyZuYnNwOyZuYnNwOyZuYnNwOycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vZXh0ZW5kOiB7Y2xhc3M6ICdidXR0b24tc2F2ZSd9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4dGVuZDogeydjbGFzcyc6ICdidG4gYmx1ZUJ0biBidG5UaGVtZUEgbm9JY29uJ31cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXQ6ICdidXR0b24nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnY2xvc2UnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzaG93OiBNc2cuY2FuY2VsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAnJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWxpZ246ICdsZWZ0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICc0OCUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBleHRlbmQ6IHtjbGFzczogJ2J1dHRvbi1jYW5jZWwnfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXh0ZW5kOiB7J2NsYXNzJzogJ2J0biBncmF5QnRuIGJ0blRoZW1lQiBub0ljb24nfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnB1dDogJ2J1dHRvbicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdjbG9zZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNob3c6IE1zZy5jbG9zZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsaWduOiAnY2VudGVyJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICc0OCUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL2V4dGVuZDoge2NsYXNzOiAnYnV0dG9uLXNhdmUnfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXh0ZW5kOiB7J2NsYXNzJzogJ2J0biBibHVlQnRuIGJ0blRoZW1lQSBub0ljb24nfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnB1dDogJ2J1dHRvbicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdWJtaXQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzaG93OiBNc2cuc2VhcmNoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAnJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWxpZ246ICdjZW50ZXInLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBleHRlbmQ6IHsnY2xhc3MnOiAnYnRuIHNlYXJjaEJ0biBidG5UaGVtZUEnfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgXVxyXG5cclxuICAgICAgICB9LCBvcHRpb25zKTtcclxuICAgICAgICBwLnRlbXBEYXRhID0ge307XHJcblxyXG4gICAgICAgIGlmIChwLnRvb2xCdXR0b25zKSB7XHJcbiAgICAgICAgICAgIHAuYnV0dG9ucyA9IHAudG9vbEJ1dHRvbnM7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaWYgKHAuZXh0cmFCdXR0b25zKSB7XHJcbiAgICAgICAgICAgICAgICBwLmJ1dHRvbnNbMV0gPSBwLmV4dHJhQnV0dG9uc1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChwLm5vQnV0dG9ucykge1xyXG4gICAgICAgICAgICAgICAgcC5idXR0b25zWzBdLnNwbGljZSgwLCBwLmJ1dHRvbnNbMF0ubGVuZ3RoKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGlmIChwLnNob3cgPT0gJ2hvcml6b250YWwnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcC5idXR0b25zWzBdLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcC5idXR0b25zWzBdLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcC5idXR0b25zWzBdLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHAuYnV0dG9uc1swXS5wb3AoKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocC50eXBlID09ICd2aWV3Jykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwLmNvbmZpZyA9ICdBTEwnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwLmJ1dHRvbnNbMF0uc2hpZnQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcC5idXR0b25zWzBdLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcC5idXR0b25zWzBdLnBvcCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdC5wID0gcDtcclxuICAgICAgICB2YXIgJHRoaXMgPSAkKHQpO1xyXG5cclxuICAgICAgICAkdGhpcy5lbXB0eSgpO1xyXG4gICAgICAgIHAudmFsaWRhdGVJRCA9IGlkICsgXCJWYWxpZGF0ZVwiO1xyXG4gICAgICAgIHZhciB2YWxpZGF0ZSA9ICQoXCI8Zm9ybS8+XCIpO1xyXG4gICAgICAgIHZhbGlkYXRlLmF0dHIoXCJpZFwiLCBwLnZhbGlkYXRlSUQpO1xyXG4gICAgICAgICR0aGlzLmFwcGVuZCh2YWxpZGF0ZSk7XHJcbiAgICAgICAgcC5vbmx5ID0gcC5tb2RlbFswXVswXVswXSA/IGZhbHNlIDogdHJ1ZTtcclxuXHJcbiAgICAgICAgdmFyIHIgPSB7XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiDkvZznlKg65Yib5bu6dGFibGVcclxuICAgICAgICAgICAgICogQHZhbGlkYXRlOkZvcm3ooajljZXmoYbmnrZcclxuICAgICAgICAgICAgICogQGRhdGE65Y2V5LiqdGFibGXooajmlbDmja5cclxuICAgICAgICAgICAgICogQHRpdGxlOnRhYmxl6KGo5ZCNXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBhZGRGaWVsZHNldDogZnVuY3Rpb24gKHZhbGlkYXRlLCBkYXRhLCB0aXRsZSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIG1heExlbmd0aCA9IDA7XHJcbiAgICAgICAgICAgICAgICAkLmVhY2goZGF0YSwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG1heExlbmd0aCA9IHRoaXMubGVuZ3RoID4gbWF4TGVuZ3RoID8gdGhpcy5sZW5ndGggOiBtYXhMZW5ndGg7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHZhciBmaWVsZHNldCA9ICQoXCI8ZmllbGRzZXQvPlwiKTtcclxuICAgICAgICAgICAgICAgIHZhbGlkYXRlLmFwcGVuZChmaWVsZHNldCk7XHJcbiAgICAgICAgICAgICAgICBpZiAodGl0bGUpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbGVnZW5kID0gJChcIjxsZWdlbmQvPlwiKTtcclxuICAgICAgICAgICAgICAgICAgICBsZWdlbmQuaHRtbCh0aXRsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZmllbGRzZXQuYXBwZW5kKGxlZ2VuZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvL2Vsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gICAgaWYgKHAuc2hvdyAhPSAnaG9yaXpvbnRhbCcpIHtcclxuICAgICAgICAgICAgICAgIC8vICAgICAgICBmaWVsZHNldC5jc3MoeydtYXJnaW4tdG9wJzogJzEwcHgnfSk7XHJcbiAgICAgICAgICAgICAgICAvLyAgICB9XHJcbiAgICAgICAgICAgICAgICAvL31cclxuICAgICAgICAgICAgICAgIHZhciB0YWJsZUNvbnRlbnQgPSBwLnNob3cgPT0gJ2hvcml6b250YWwnID8gJChcIjxkaXYvPlwiKSA6ICQoXCI8dGFibGUvPlwiKTtcclxuICAgICAgICAgICAgICAgIHRhYmxlQ29udGVudC5hZGRDbGFzcyhwLnNob3cgPT0gJ2hvcml6b250YWwnID8gXCJob3Jpem9udGFsLXRhYmxlXCIgOiBcInZlcnRpY2FsLXRhYmxlXCIpO1xyXG5cclxuICAgICAgICAgICAgICAgIGZpZWxkc2V0LmFwcGVuZCh0YWJsZUNvbnRlbnQpO1xyXG4gICAgICAgICAgICAgICAgJC5lYWNoKGRhdGEsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5sZW5ndGggPiAwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByLmFkZFRyQ29udGVudHModGFibGVDb250ZW50LCB0aGlzLCBtYXhMZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiDkvZznlKg65re75Yqg6KGo5Lit5LiA5YiX5pWw5o2uXHJcbiAgICAgICAgICAgICAqIEB0YWJsZUNvbnRlbnQ65omA6KaB5re75Yqg55qEdGFibGVcclxuICAgICAgICAgICAgICogQGRhdGE65omA6KaB5re75Yqg55qE5LiA5YiX5YaF5a6555qE6YWN572u5pWw5o2uXHJcbiAgICAgICAgICAgICAqIEBtYXhMZW5ndGg65omA5pyJ5YiX55qE5pyA5aSndGTmlbBcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIGFkZFRyQ29udGVudHM6IGZ1bmN0aW9uICh0YWJsZUNvbnRlbnQsIGRhdGEsIG1heExlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHRyQ29udGVudCA9IHAuc2hvdyA9PSAnaG9yaXpvbnRhbCcgPyAkKCc8ZGl2IGNsYXNzPVwiY2xzUm93XCIvPicpIDogJCgnPHRyLz4nKTtcclxuICAgICAgICAgICAgICAgIHAuc2hvdyAhPSAnaG9yaXpvbnRhbCcgPyB0YWJsZUNvbnRlbnQuYXBwZW5kKHRyQ29udGVudCkgOiAwO1xyXG4gICAgICAgICAgICAgICAgJC5lYWNoKGRhdGEsIGZ1bmN0aW9uIChpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHAuc2hvdyA9PSAnaG9yaXpvbnRhbCcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHJDb250ZW50ID0gJCgnPGRpdiBjbGFzcz1cImNsc1Jvd1wiLz4nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGFibGVDb250ZW50LmFwcGVuZCh0ckNvbnRlbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAoJC5pc0FycmF5KHRoaXMpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaCh0aGlzLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByLmFkZE9uZUlucHV0Q29udGVudHModHJDb250ZW50LCB0aGlzLCBkYXRhLmxlbmd0aCwgaSwgbWF4TGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgci5hZGRPbmVJbnB1dENvbnRlbnRzKHRyQ29udGVudCwgdGhpcywgZGF0YS5sZW5ndGgsIGksIG1heExlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBpZiAocC5zaG93ID09ICdob3Jpem9udGFsJykge1xyXG4gICAgICAgICAgICAgICAgICAgICQuZWFjaChwLmJ1dHRvbnMsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHJDb250ZW50ID0gJCgnPGRpdiBjbGFzcz1cImNsc1Jvd1wiLz4nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGFibGVDb250ZW50LmFwcGVuZCh0ckNvbnRlbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByLmFkZEJ1dHRvbih0ckNvbnRlbnQsIHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRyQ29udGVudDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgYWRkT25lSW5wdXRDb250ZW50czogZnVuY3Rpb24gKHRyQ29udGVudCwgZGF0YSwgbGVuZ3RoLCBpLCBtYXhMZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIC8vaWYoIWRhdGEucGxhY2Vob2xkZXIpe1xyXG4gICAgICAgICAgICAgICAgci5hZGRLZXljbHNUZCh0ckNvbnRlbnQsIGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgLy99XHJcblxyXG4gICAgICAgICAgICAgICAgci5hZGRWYWxjbHNUZCh0ckNvbnRlbnQsIGRhdGEsIGxlbmd0aCwgaSwgbWF4TGVuZ3RoKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgYWRkS2V5Y2xzVGQ6IGZ1bmN0aW9uICh0ckNvbnRlbnQsIGRhdGEpIHtcclxuICAgICAgICAgICAgICAgIHZhciBrZXljbHMgPSBwLnNob3cgPT0gJ2hvcml6b250YWwnID8gJChcIjxzcGFuLz5cIikgOiAkKFwiPHRkLz5cIik7XHJcbiAgICAgICAgICAgICAgICBrZXljbHMuYWRkQ2xhc3MoXCJrZXljbHNcIik7XHJcbiAgICAgICAgICAgICAgICB0ckNvbnRlbnQuYXBwZW5kKGtleWNscyk7XHJcbiAgICAgICAgICAgICAgICByLmFkZEtleWNsc1RkQXR0cnMoa2V5Y2xzLCBkYXRhKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBrZXljbHM7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGFkZEtleWNsc1RkQXR0cnM6IGZ1bmN0aW9uIChrZXljbHMsIGRhdGEpIHtcclxuICAgICAgICAgICAgICAgIHZhciBzaG93ID0gZGF0YS5zaG93ID8gZGF0YS5zaG93IDoga2V5Y2xzLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgIGRhdGEudW5pdCA/IGtleWNscy5odG1sKHNob3cgKyBcIihcIiArIGRhdGEudW5pdCArIFwiKVwiKSA6IGtleWNscy5odG1sKHNob3cpO1xyXG4gICAgICAgICAgICAgICAgZGF0YS5oaWRlID8ga2V5Y2xzLnBhcmVudCgpLmNzcyh7J2Rpc3BsYXknOiAnbm9uZSd9KSA6IDA7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGFkZFZhbGNsc1RkOiBmdW5jdGlvbiAodHJDb250ZW50LCBkYXRhLCBsZW5ndGgsIGksIG1heExlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHZhbGNscyA9IHAuc2hvdyA9PSAnaG9yaXpvbnRhbCcgPyAkKFwiPHNwYW4vPlwiKSA6ICQoXCI8dGQvPlwiKTtcclxuICAgICAgICAgICAgICAgIHZhbGNscy5hZGRDbGFzcyhcInZhbGNsc1wiKTtcclxuICAgICAgICAgICAgICAgIHRyQ29udGVudC5hcHBlbmQodmFsY2xzKTtcclxuICAgICAgICAgICAgICAgIHIuYWRkVmFsY2xzVGRBdHRycyh2YWxjbHMsIGRhdGEsIGxlbmd0aCwgaSwgbWF4TGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB2YWxjbHM7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGFkZFZhbGNsc1RkQXR0cnM6IGZ1bmN0aW9uICh0ZENvbnRlbnQsIGRhdGEsIGxlbmd0aCwgaSwgbWF4TGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY29sc3BhbiA9IDE7XHJcbiAgICAgICAgICAgICAgICBpZiAobWF4TGVuZ3RoID4gbGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sc3BhbiA9IChtYXhMZW5ndGggLSBsZW5ndGgpICogMiArIDE7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoIShkYXRhLnNob3cpKSBjb2xzcGFuKys7XHJcbiAgICAgICAgICAgICAgICB2YXIgaW5wdXQgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgLy8g6Z2e57yW6L6R5pWI5p6cXHJcbiAgICAgICAgICAgICAgICBpZiAocC5jb25maWcgPT0gXCJBTExcIiB8fCBwLmNvbmZpZy5zcGxpdChcIixcIikuaW5kZXhPZihkYXRhLm5hbWUgKyBcIlwiKSA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlucHV0VHlwZSA9IGRhdGEuaW5wdXQ7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEudHlwZSA9PSAnc2VsZWN0Jykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwLnRlbXBEYXRhW2RhdGEubmFtZV0gPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKGRhdGEub3B0aW9ucywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcC50ZW1wRGF0YVtkYXRhLm5hbWVdLnB1c2godGhpcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnB1dFR5cGUgPSAnaW5wdXQnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2hvd1BhbmVsID0gJCgnPGRpdi8+JykuYWRkQ2xhc3MoJ3ZhbHNlbGVjdCcpLmFkZENsYXNzKCdkaXNhYmxlZCcpLmNzcyh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAndGV4dC1vdmVyZmxvdyc6ICdlbGxpcHNpcycsICdvdmVyZmxvdyc6ICdoaWRkZW4nXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZENvbnRlbnQuYXBwZW5kKHNob3dQYW5lbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkYXRhLnR5cGUgPT0gJ3JhbmdlJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnB1dFR5cGUgPSAnaW5wdXQnO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YS50eXBlID09ICdncm91cCcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXRUeXBlID0gJ2ZpZWxkc2V0JztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEudHlwZSA9PSAnaW1hZ2UtZm9ybScpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXRUeXBlID0gJ2ltZyc7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlucHV0ID0gJChcIjxcIiArIGlucHV0VHlwZSArIFwiLz5cIikuYXR0cihcInR5cGVcIiwgZGF0YS50eXBlKS5hdHRyKFwibmFtZVwiLCBkYXRhLm5hbWUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKFwicmVhZE9ubHlcIiwgXCJyZWFkT25seVwiKS5hZGRDbGFzcyhcImRpc2FibGVkXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkYXRhLnR5cGUgPT0gJ2dyb3VwJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnB1dC5hdHRyKCdkaXNhYmxlZCcsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YS50eXBlID09ICdpbWFnZS1mb3JtJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnB1dC5hdHRyKCdkYXRhLWZpbGVEaXNEaXInLCBkYXRhLmZpbGVEaXNEaXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB0ZENvbnRlbnQuYXBwZW5kKGlucHV0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIOe8lui+keaViOaenFxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEudHlwZSA9PSAnc2VsZWN0Jykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnB1dCA9ICQoXCI8XCIgKyBkYXRhLmlucHV0ICsgXCIvPlwiKS5hdHRyKFwibmFtZVwiLCBkYXRhLm5hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZENvbnRlbnQuYXBwZW5kKGlucHV0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcC50ZW1wRGF0YVtkYXRhLm5hbWVdID0gW107XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaChkYXRhLm9wdGlvbnMsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHAudGVtcERhdGFbZGF0YS5uYW1lXS5wdXNoKHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG9wdGlvbiA9ICQoXCI8b3B0aW9uLz5cIikudmFsKHRoaXMudmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50ZXh0ID8gb3B0aW9uLmh0bWwodGhpcy50ZXh0KSA6IG9wdGlvbi5odG1sKHRoaXMudmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXQuYXBwZW5kKG9wdGlvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChkYXRhLnR5cGUgPT0gJ3JhbmdlJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnB1dCA9IHIuY3JlYXRlUmFuZ2VCb3godGRDb250ZW50LCBkYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoZGF0YS50eXBlID09ICdncm91cCcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXQgPSAkKFwiPGZpZWxkc2V0Lz5cIikuYXR0cigndHlwZScsIGRhdGEudHlwZSkuYXR0cihcIm5hbWVcIiwgZGF0YS5uYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGRDb250ZW50LmFwcGVuZChpbnB1dCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGRhdGEudHlwZSA9PSAnZmlsZS1mb3JtJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnB1dCA9IHIuY3JlYXRlRnJvbUJveCh0ZENvbnRlbnQsIGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChkYXRhLnR5cGUgPT0gJ2ltYWdlLWZvcm0nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0ID0gci5jcmVhdGVGcm9tQm94KHRkQ29udGVudCwgZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnB1dCA9ICQoXCI8XCIgKyBkYXRhLmlucHV0ICsgXCIvPlwiKS5hdHRyKFwidHlwZVwiLCBkYXRhLnR5cGUpLmF0dHIoXCJuYW1lXCIsIGRhdGEubmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRkQ29udGVudC5hcHBlbmQoaW5wdXQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBwLnJ1bGVzW2RhdGEubmFtZV0gPSBkYXRhLnJ1bGUgfHwge307XHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YS5wbGFjZWhvbGRlciAmJiBpbnB1dC5hdHRyKCdwbGFjZWhvbGRlcicsIGRhdGEucGxhY2Vob2xkZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGRhdGEuZm5DbGljayAmJiBpbnB1dC5jbGljayhkYXRhLmZuQ2xpY2spO1xyXG4gICAgICAgICAgICAgICAgICAgIGRhdGEucnVsZSAmJiBkYXRhLnJ1bGUucmVxdWlyZWQgJiYgdGRDb250ZW50LmFwcGVuZCgkKFwiPHNwYW4vPlwiKS5hZGRDbGFzcyhcInJlcXVpcmVkLWxhYmVsXCIpLmh0bWwoXCIqXCIpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChkYXRhLmV4dGVuZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBkYXRhLmV4dGVuZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YS5leHRlbmQuaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGtleSA9PSAnY2xhc3MnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXQuYWRkQ2xhc3MoZGF0YS5leHRlbmRba2V5XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnB1dC5hdHRyKGtleSwgZGF0YS5leHRlbmRba2V5XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvL2lucHV0LmJsdXIoZnVuY3Rpb24oKXtyLm9uYmx1cih0aGlzKX0pO1xyXG4gICAgICAgICAgICAgICAgLy9pbnB1dC5jc3Moeyd0ZXh0LW92ZXJmbG93JzogJ2VsbGlwc2lzJywgJ292ZXJmbG93JzogJ2hpZGRlbid9KTtcclxuICAgICAgICAgICAgICAgIGlucHV0LmFkZENsYXNzKFwidmFsaW5wdXRcIikuYWRkQ2xhc3MoXCJ2YWxcIiArIGRhdGEuaW5wdXQpO1xyXG4gICAgICAgICAgICAgICAgZGF0YS53aWR0aCAmJiBpbnB1dC5jc3Moeyd3aWR0aCc6IGRhdGEud2lkdGggKyAncHgnfSk7XHJcbiAgICAgICAgICAgICAgICBkYXRhLmhlaWdodCAmJiBpbnB1dC5jc3MoeydoZWlnaHQnOiBkYXRhLmhlaWdodCArICdweCd9KTtcclxuICAgICAgICAgICAgICAgIGRhdGEuY3NzICYmIGlucHV0LmNzcyhkYXRhLmNzcyk7XHJcbiAgICAgICAgICAgICAgICBkYXRhLmhpZGUgJiYgdGRDb250ZW50LmNzcyh7J2Rpc3BsYXknOiAnbm9uZSd9KTtcclxuICAgICAgICAgICAgICAgIGRhdGEuZm5Jbml0ICYmIGlucHV0LmRhdGEoJ2ZuSW5pdCcsIGRhdGEuZm5Jbml0KTtcclxuICAgICAgICAgICAgICAgIGRhdGEuYmVmb3JlICYmIGlucHV0LmJlZm9yZShkYXRhLmJlZm9yZS5jc3Moe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdpbmxpbmUtYmxvY2snLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAndmVydGljYWwtYWxpZ24nOiAnbWlkZGxlJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ21hcmdpbi1yaWdodCc6ICcxMHB4J1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgZGF0YS5hZnRlciAmJiBpbnB1dC5hZnRlcihkYXRhLmFmdGVyLmNzcyh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ2lubGluZS1ibG9jaycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICd2ZXJ0aWNhbC1hbGlnbic6ICdtaWRkbGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAnbWFyZ2luLWxlZnQnOiAnMTBweCdcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIGlmIChwLmhvdmVyVGl0bGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YS50eXBlICE9ICdwYXNzd29yZCcgJiYgZGF0YS50eXBlICE9ICdncm91cCcgJiYgZGF0YS50eXBlICE9ICdyYW5nZScgJiYgZGF0YS50eXBlICE9ICdpbWFnZS1mb3JtJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKCdbbmFtZT0nICsgZGF0YS5uYW1lICsgJ10nLCAnIycgKyBwLnZhbGlkYXRlSUQpLnBhcmVudCgndGQnKS5ob3ZlcihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgJHRoaXMgPSAkKCdbbmFtZT0nICsgZGF0YS5uYW1lICsgJ10nLCAkKHRoaXMpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0ZXh0ID0gJHRoaXMudmFsKCkgfHwgJyc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGV4dCAmJiAkdGhpcy5nZXQoMCkgJiYgKCR0aGlzLmF0dHIoJ3R5cGUnKSB8fCAkdGhpcy5nZXQoMCkudGFnTmFtZS50b0xvd2VyQ2FzZSgpKSA9PSAnc2VsZWN0Jykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQgPSAkKCdvcHRpb25bdmFsdWU9XCInICsgdGV4dCArICdcIl0nLCAkdGhpcykudGV4dCgpIHx8ICR0aGlzLnRleHQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRkQ29udGVudC5hdHRyKCd0aXRsZScsIHRleHQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoaSA9PSBsZW5ndGggLSAxICYmIGNvbHNwYW4gPiAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGRDb250ZW50LmF0dHIoJ2NvbHNwYW4nLCBjb2xzcGFuKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiDnlJ/miJDlgLzln5/ljLrpl7TooajljZXlhYPntKBcclxuICAgICAgICAgICAgICogQHBhcmFtIHRkQ29udGVudCDlrrnlmahcclxuICAgICAgICAgICAgICogQHBhcmFtIGRhdGEg5pWw5o2uXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBjcmVhdGVSYW5nZUJveDogZnVuY3Rpb24gKHRkQ29udGVudCwgZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGlucHV0ID0gJChcIjxcIiArIGRhdGEuaW5wdXQgKyBcIi8+XCIpLmF0dHIoJ3R5cGUnLCAnaGlkZGVuJykuYXR0cihcIm5hbWVcIiwgZGF0YS5uYW1lKTtcclxuICAgICAgICAgICAgICAgIHRkQ29udGVudC5hcHBlbmQoaW5wdXQpO1xyXG5cclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMjsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHF1ZXJ5Qm94ID0gJCgnPHNwYW4vPicpLmF0dHIoJ2lkJywgcC52YWxpZGF0ZUlEICsgJ18nICsgZGF0YS5uYW1lICsgJ19yYW5nZScgKyBpKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgb3BlcmF0b3JBcnIgPSBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHt0ZXh0OiBNc2cucXVlcnlDb25kaXRpb24uaW5jbHVzaW9uWzFdLCB2YWx1ZTogMX0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHt0ZXh0OiBNc2cucXVlcnlDb25kaXRpb24uaW5jbHVzaW9uWzBdLCB2YWx1ZTogMH1cclxuICAgICAgICAgICAgICAgICAgICBdO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBvcGVyYXRvciA9ICQoXCI8c2VsZWN0Lz5cIikuYWRkQ2xhc3MoJ29wZXJhdG9yJykuYWRkQ2xhc3MoXCJ2YWxpbnB1dFwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuY3NzKHt3aWR0aDogNzAsIGhlaWdodDogMjgsIG1hcmdpblJpZ2h0OiAwfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgJC5lYWNoKG9wZXJhdG9yQXJyLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wZXJhdG9yLmFwcGVuZCgkKFwiPG9wdGlvbi8+XCIpLnZhbCh0aGlzLnZhbHVlKS5odG1sKHRoaXMudGV4dCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHF1ZXJ5Qm94LmFwcGVuZChvcGVyYXRvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gJChcIjxpbnB1dC8+XCIpLmF0dHIoJ2lkJywgcC52YWxpZGF0ZUlEICsgJ18nICsgZGF0YS5uYW1lICsgJ19yYW5nZV8nICsgaSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ25hbWUnLCBkYXRhLm5hbWUgKyAnX3JhbmdlJyArIGkpLmF0dHIoJ3R5cGUnLCAnbnVtYmVyJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmFkZENsYXNzKCd2YWx1ZScpLmFkZENsYXNzKFwidmFsaW5wdXRcIikuY3NzKHt3aWR0aDogMTA1fSkudmFsKDApO1xyXG4gICAgICAgICAgICAgICAgICAgIHF1ZXJ5Qm94LmF0dHIoJ2VuYWJsZWQnLCB0cnVlKS5hcHBlbmQodmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHF1ZXJ5Qm94LnByZXBlbmQoaSA/ICc8YnIvPicgKyBNc2cucXVlcnlDb25kaXRpb24uZXh0cmVybmVzWzFdICsgJ++8midcclxuICAgICAgICAgICAgICAgICAgICAgICAgOiAnICcgKyBNc2cucXVlcnlDb25kaXRpb24uZXh0cmVybmVzWzBdICsgJ++8micpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRkQ29udGVudC5hcHBlbmQocXVlcnlCb3gpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgcmFuZ2VSdWxlID0gKGkgPT09IDBcclxuICAgICAgICAgICAgICAgICAgICAgICAgPyB7bWluVG86ICcjJyArIHAudmFsaWRhdGVJRCArICdfJyArIGRhdGEubmFtZSArICdfcmFuZ2VfMSd9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDoge21heFRvOiAnIycgKyBwLnZhbGlkYXRlSUQgKyAnXycgKyBkYXRhLm5hbWUgKyAnX3JhbmdlXzAnfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9wLm1lc3NhZ2VzW2RhdGEubmFtZSArICdfcmFuZ2UnICsgaV0gPSB7IG1heFRvOiAn6K+36L6T5YWl5aSn5LqO5pyA5bCP5YC855qE5pWwJywgbWluVG86ICfor7fovpPlhaXlsI/kuo7mnIDlpKflgLznmoTmlbAnfTtcclxuICAgICAgICAgICAgICAgICAgICBwLnJ1bGVzW2RhdGEubmFtZSArICdfcmFuZ2UnICsgaV0gPSAkLmV4dGVuZCh7fSwgZGF0YS5ydWxlIHx8IHt9LCByYW5nZVJ1bGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy/lop7liqDlnKjorr7nva7lrozmiJDlvILluLjkv53miqTorr7nva7kuYvlkI7vvIzov5jmmK/kvJrmmL7npLrigJjor7fovpPlhaXlsI/kuo7mnIDlpKflgLznmoTmlbDigJlcclxuICAgICAgICAgICAgICAgICQoXCIjXCIgKyBwLnZhbGlkYXRlSUQgKyAnXycgKyBkYXRhLm5hbWUgKyAnX3JhbmdlXzAnKS5rZXl1cChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJChcIiNcIiArIHAudmFsaWRhdGVJRCArICdfJyArIGRhdGEubmFtZSArICdfcmFuZ2VfMScpLmZvY3Vzb3V0KCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICQoXCIjXCIgKyBwLnZhbGlkYXRlSUQgKyAnXycgKyBkYXRhLm5hbWUgKyAnX3JhbmdlXzEnKS5rZXl1cChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJChcIiNcIiArIHAudmFsaWRhdGVJRCArICdfJyArIGRhdGEubmFtZSArICdfcmFuZ2VfMCcpLmZvY3Vzb3V0KCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBpbnB1dDtcclxuICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiDnlJ/miJDooajljZXooajljZXlhYPntKDvvIjlhoXltYzooajljZXvvIlcclxuICAgICAgICAgICAgICogQHBhcmFtIHRkQ29udGVudFxyXG4gICAgICAgICAgICAgKiBAcGFyYW0gZGF0YVxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgY3JlYXRlRnJvbUJveDogZnVuY3Rpb24gKHRkQ29udGVudCwgZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGlucHV0ID0gJCgnPGlucHV0Lz4nKS5hdHRyKCd0eXBlJywgZGF0YS50eXBlKS5hdHRyKFwibmFtZVwiLCBkYXRhLm5hbWUpXHJcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2RhdGEtZmlsZURpc0RpcicsIGRhdGEuZmlsZURpc0RpcikuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgayA9IDA7IGsgPCAoZGF0YS5waWNOdW0gfHwgMSk7IGsrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwaWNOdW1iZXIgPSAoayAhPSAwID8gayA6IFwiXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBkaXYgPSAkKCc8ZGl2Lz4nKS5hZGRDbGFzcygndmFsZmlsZUZvcm0nKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgY2hvb3NlRmlsZUJ0biA9ICQoJzxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuVGhlbWVBIGJ0biB1cGxvYWRCdG5cIj4nICtcclxuICAgICAgICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJidG5MIGJ0blNcIj48L3NwYW4+PHNwYW4gY2xhc3M9XCJidG5DIGJ0blNcIj4nICsgTXNnLnVwbG9hZCArXHJcbiAgICAgICAgICAgICAgICAgICAgJzwvc3Bhbj48c3BhbiBjbGFzcz1cImJ0blIgYnRuU1wiPjwvc3Bhbj48L2J1dHRvbj4nKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgY2hvb3NlRmlsZSA9ICQoJzxpbnB1dC8+JykuYXR0cigndHlwZScsICdmaWxlJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2lkJywgcC52YWxpZGF0ZUlEICsgJ18nICsgZGF0YS5uYW1lICsgJ19maWxlJyArIHBpY051bWJlcikuYXR0cignbmFtZScsIGRhdGEubmFtZSArICdfZmlsZScgKyBwaWNOdW1iZXIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vLmF0dHIoJ2FjY2VwdCcsIGRhdGEubWltZVR5cGUudG9TdHJpbmcoKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ3RpdGxlJywgJycpLmFkZENsYXNzKCdmaWxldXBsb2FkLWRpdicpLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcHJldmlldyA9ICcnO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkYXRhLnR5cGUgPT0gJ2ltYWdlLWZvcm0nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXZpZXcgPSAkKCc8aW1nLz4nKS5hdHRyKCdpZCcsIHAudmFsaWRhdGVJRCArICdfJyArIGRhdGEubmFtZSArICdfc2hvdycgKyBwaWNOdW1iZXIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYXR0cignc3JjJywgJy9pbWFnZXMvaW5kZXgvZmlsZXVwbG9hZC9kZWZhdWx0LmpwZycpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYXR0cignb25lcnJvcicsICd0aGlzLnNyYz1cIi9pbWFnZXMvaW5kZXgvZmlsZXVwbG9hZC9kZWZhdWx0LmpwZ1wiO3RoaXMub25lcnJvcj1udWxsOycpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBkaXYuYXBwZW5kKHByZXZpZXcpO1xyXG4gICAgICAgICAgICAgICAgICAgIGRpdi5hcHBlbmQoY2hvb3NlRmlsZUJ0bi5iaW5kKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5wYXJlbnQoKS5maW5kKCdpbnB1dFt0eXBlPWZpbGVdJykuY2xpY2soKTtcclxuICAgICAgICAgICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZGl2LmFwcGVuZChjaG9vc2VGaWxlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEuZm5DbG9zZUNsaWNrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjbG9zZUltZ0RpdiA9ICQoJzxkaXYvPicpLmFkZENsYXNzKCdjbG9zZUltZ0RpdicpLmNzcyh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAncG9zaXRpb24nOiAnYWJzb2x1dGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2JhY2tncm91bmQnOiAncmVkIHVybChcIi9pbWFnZXMvbWFpbi9ncy9jbG9zZS5wbmdcIikgbm8tcmVwZWF0IGNlbnRlcicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAndG9wJzogMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdyaWdodCc6IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnY3Vyc29yJzogJ3BvaW50ZXInLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3otaW5kZXgnOiAnMScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnd2lkdGgnOiAxMixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdoZWlnaHQnOiAxMixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdib3JkZXItcmFkaXVzJzogJzUwJScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAncGFkZGluZyc6IDUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdub25lJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KS5iaW5kKCdjbGljaycsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZCA9ICQoZS50YXJnZXQpLnBhcmVudHMoJy52YWxmaWxlRm9ybScpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGltZyA9ICQoJyMnICsgcC52YWxpZGF0ZUlEICsgJ18nICsgZGF0YS5uYW1lICsgJ19zaG93JyArIHBpY051bWJlciwgZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW1nLmdldCgwKS50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT0gJ2ltZycpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbWcuYXR0cignc3JjJywgJy9pbWFnZXMvaW5kZXgvZmlsZXVwbG9hZC9kZWZhdWx0LmpwZycpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS5mbkNsb3NlQ2xpY2soaW1nLCBkLnNpYmxpbmdzKCdpbnB1dFtuYW1lPScgKyBkYXRhLm5hbWUgKyAnXScpLCBkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpdi5hcHBlbmQoY2xvc2VJbWdEaXYpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdGRDb250ZW50LmFwcGVuZChkaXYpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGRDb250ZW50LmFwcGVuZChpbnB1dCk7XHJcbiAgICAgICAgICAgICAgICAkKFwiLnZhbGZpbGVGb3JtXCIpLm1vdXNlb3ZlcihmdW5jdGlvbiAoKSB7IC8v5pi+56S65Yig6Zmk5Y+JXHJcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5maW5kKFwiLmNsb3NlSW1nRGl2XCIpLmNzcyhcImRpc3BsYXlcIiwgXCJibG9ja1wiKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgJChcIi52YWxmaWxlRm9ybVwiKS5tb3VzZW91dChmdW5jdGlvbiAoKSB7ICAvL+makOiXj+WIoOmZpOWPiVxyXG4gICAgICAgICAgICAgICAgICAgICQodGhpcykuZmluZChcIi5jbG9zZUltZ0RpdlwiKS5jc3MoXCJkaXNwbGF5XCIsIFwibm9uZVwiKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlucHV0O1xyXG5cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIOWkseWOu+eEpueCueaXtuinpuWPkVxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgb25ibHVyOiBmdW5jdGlvbiAodGhhdCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCQodGhhdCkuYXR0cigndHlwZScpID09ICd0ZXh0Jykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9ICQodGhhdCkudmFsKCkudHJpbSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICQodGhhdCkudmFsKHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgYWRkQnV0dG9uOiBmdW5jdGlvbiAodHJDb250ZW50LCBkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAkLmVhY2goZGF0YSwgZnVuY3Rpb24gKGksIGQpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdGRDb250ZW50ID0gcC5zaG93ID09ICdob3Jpem9udGFsJyA/ICQoXCI8ZGl2Lz5cIikuYWRkQ2xhc3MoJ2lubGluZS1idXR0b24nKSA6ICQoXCI8dGQvPlwiKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZC5wZXJtaXNzaW9ucykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZENvbnRlbnQuYXR0cigncGVybWlzc2lvbicsIGQucGVybWlzc2lvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB0ZENvbnRlbnQuYXR0cignYWxpZ24nLCBkLmFsaWduKS5hdHRyKCd3aWR0aCcsIGQud2lkdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBpbnB1dCA9ICQoXCI8XCIgKyBkLmlucHV0ICsgXCIvPlwiKS5hdHRyKFwidHlwZVwiLCBcImJ1dHRvblwiKS5hdHRyKCdkYXRhLWJ0blR5cGUnLCBkLnR5cGUpLmFkZENsYXNzKGQubmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNwYW4gPSAkKFwiPHNwYW4vPlwiKS5hZGRDbGFzcyhcInVpLWJ1dHRvbi10ZXh0XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGQuc2hvdyAmJiBzcGFuLmh0bWwoZC5zaG93KTtcclxuICAgICAgICAgICAgICAgICAgICB0ZENvbnRlbnQuYXBwZW5kKGlucHV0KTtcclxuICAgICAgICAgICAgICAgICAgICBpbnB1dC5hcHBlbmQoc3Bhbik7XHJcbiAgICAgICAgICAgICAgICAgICAgZC51bml0ICYmIHRkQ29udGVudC5hcHBlbmQoJChcIjxzcGFuLz5cIikuaHRtbChkLnVuaXQpKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJidG4gPSAkKCc8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBkYXRhLWJ0blR5cGU9XCInICsgZC50eXBlICsgJ1wiPidcclxuICAgICAgICAgICAgICAgICAgICArICcgIDxzcGFuIGNsYXNzPVwiYnRuTCBidG5TXCI+PC9zcGFuPidcclxuICAgICAgICAgICAgICAgICAgICArICcgIDxzcGFuIGNsYXNzPVwiYnRuQyBidG5TXCI+JyArIGQuc2hvdyArICc8L3NwYW4+J1xyXG4gICAgICAgICAgICAgICAgICAgICsgJyAgPHNwYW4gY2xhc3M9XCJidG5SIGJ0blNcIj48L3NwYW4+J1xyXG4gICAgICAgICAgICAgICAgICAgICsgJzwvYnV0dG9uPicpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlucHV0LnJlcGxhY2VXaXRoKHJidG4pO1xyXG4gICAgICAgICAgICAgICAgICAgIHJidG4uY2xpY2soZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZhbChkLnR5cGUgKyAnKCknKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGQuZm5DbGljayAmJiBkLmZuQ2xpY2soKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAvLyDngrnlh7vlm57ovabplK7miafooYzooajljZUgc3VibWl0IOaMiemSruWNleWHu+S6i+S7tlxyXG4gICAgICAgICAgICAgICAgICAgIGlmICgocC5pc0VudGVyU3VibWl0IHx8IHAuc2hvdyA9PSAnaG9yaXpvbnRhbCcpICYmIGQudHlwZSA9PT0gXCJzdWJtaXRcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKFwiI1wiICsgcC52YWxpZGF0ZUlEKS5rZXl1cChmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgoZXZlbnQua2V5Q29kZSB8fCBldmVudC53aGljaCkgPT0gMTMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKFwiW2RhdGEtYnRuVHlwZT0nc3VibWl0J11cIiwgXCIjXCIgKyBwLnZhbGlkYXRlSUQpLnRyaWdnZXIoXCJjbGlja1wiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkLmV4dGVuZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gZC5leHRlbmQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkLmV4dGVuZC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGtleSA9PSAnY2xhc3MnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJidG4uYWRkQ2xhc3MoZC5leHRlbmRba2V5XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByYnRuLmF0dHIoa2V5LCBkLmV4dGVuZFtrZXldKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgdHJDb250ZW50LmFwcGVuZCh0ZENvbnRlbnQpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiDkvZznlKg65re75YqgYWRkQnV0dG9uc1RhYmxlXHJcbiAgICAgICAgICAgICAqIEB2YWxpZGF0ZTpGb3Jt6KGo5Y2V5qGG5p62XHJcbiAgICAgICAgICAgICAqIEBkYXRhOuaJgOimgea3u+WKoOeahOS4gOWIl+WGheWuueeahOmFjee9ruaVsOaNrlxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgYWRkQnV0dG9uc1RhYmxlOiBmdW5jdGlvbiAodmFsaWRhdGUsIGRhdGEpIHtcclxuICAgICAgICAgICAgICAgIGlmICghKGRhdGEgJiYgZGF0YVswXSAmJiBkYXRhWzBdWzBdKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHZhciBmaWVsZHNldCA9ICQoXCI8ZmllbGRzZXQvPlwiKTtcclxuICAgICAgICAgICAgICAgIHZhciB0YWJsZUNvbnRlbnQgPSAkKFwiPHRhYmxlLz5cIikuYXR0cignd2lkdGgnLCAnMTAwJScpLmF0dHIoJ2FsaWduJywgJ2NlbnRlcicpLmFkZENsYXNzKFwidWktZGlhbG9nLWJ1dHRvbnBhbmVcIik7XHJcbiAgICAgICAgICAgICAgICAkLmVhY2goZGF0YSwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0ckNvbnRlbnQgPSAkKFwiPHRyIHN0eWxlPSdoZWlnaHQ6NDVweCcgLz5cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgci5hZGRCdXR0b24odHJDb250ZW50LCB0aGlzKTtcclxuICAgICAgICAgICAgICAgICAgICB0YWJsZUNvbnRlbnQuYXBwZW5kKHRyQ29udGVudCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGZpZWxkc2V0LmFwcGVuZCh0YWJsZUNvbnRlbnQpO1xyXG4gICAgICAgICAgICAgICAgdmFsaWRhdGUuYXBwZW5kKGZpZWxkc2V0KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIOS9nOeUqDrojrflj5booajljZXmlbDmja5cclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIGxpc3Q6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGlmIChwLmxpc3RVUkwpIHtcclxuICAgICAgICAgICAgICAgICAgICAkLmh0dHAuYWpheChwLmxpc3RVUkwsIHAucGFyYW1zLCBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YS5zdWNjZXNzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwLmRhdGEgPSBkYXRhLmRhdGE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByLmluaXQocC5kYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHAuZm5MaXN0U3VjY2VzcyAmJiBwLmZuTGlzdFN1Y2Nlc3MoZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwLmZuTGlzdEVycm9yICYmIHAuZm5MaXN0RXJyb3IoZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByLmluaXQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vci5jbG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiDkvZznlKg65o+Q5Lqk6KGo5Y2V5pWw5o2uXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBtb2RpZnk6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBkdCA9ICQoXCIjXCIgKyBwLnZhbGlkYXRlSUQpLnNlcmlhbGl6ZUFycmF5KCk7XHJcbiAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IHt9O1xyXG4gICAgICAgICAgICAgICAgJC5lYWNoKGR0LCBmdW5jdGlvbiAodCwgZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBrZXkgPSBlLm5hbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRhZyA9ICQoJy52YWxpbnB1dFtuYW1lPScgKyBrZXkgKyAnXScsICcjJyArIHAudmFsaWRhdGVJRCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRhZy5nZXQoMCkudGFnTmFtZS50b0xvd2VyQ2FzZSgpID09ICd0ZXh0YXJlYScpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVtrZXldID0gZS52YWx1ZSAmJiAoJycgKyBlLnZhbHVlKS5yZXBsYWNlSWxsZWdhbENoYXIoKS5yZXBsYWNlKC9cXFsvZywgJ+OAjCcpLnJlcGxhY2UoL10vZywgJ+OAjScpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFba2V5XSA9IGUudmFsdWUgJiYgKCcnICsgZS52YWx1ZSkucmVwbGFjZSgvJi9nLCAnJmFtcDsnKS5yZXBsYWNlKC88L2csICcmbHQ7JykucmVwbGFjZSgvPi9nLCAnJmd0OycpLnJlcGxhY2UoL3gyMi9nLCAnJnF1b3Q7JykucmVwbGFjZSgveDI3L2csICcmIzM5OycpLnJlcGxhY2UoL1xcWy9nLCAn44CMJykucmVwbGFjZSgvXS9nLCAn44CNJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBkYXRhID0gcC5mbk1vZGlmeURhdGEgPyBwLmZuTW9kaWZ5RGF0YShkYXRhKSA6IGRhdGE7XHJcbiAgICAgICAgICAgICAgICBpZiAocC5mblN1Ym1pdCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGRhdGEucGFyYW1zID0gcC5wYXJhbXM7XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnW2RhdGEtYnRuVHlwZT1zdWJtaXRdJywgJyMnICsgcC52YWxpZGF0ZUlEKS5hdHRyKCdkaXNhYmxlZCcsIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgICAgICBwLmZuU3VibWl0KGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHAuc3VibWl0VVJMKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJC5odHRwLmFqYXgocC5zdWJtaXRVUkwsIGRhdGEsIGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQoJ1tkYXRhLWJ0blR5cGU9c3VibWl0XScsICcjJyArIHAudmFsaWRhdGVJRCkuYXR0cignZGlzYWJsZWQnLCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkYXRhLnN1Y2Nlc3MpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHAuZm5TdWJtaXRTdWNjZXNzICYmIHAuZm5TdWJtaXRTdWNjZXNzKGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcC5wYXJlbnQgPT0gJ2RpYWxvZycgJiYgci5jbG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICBwLnR5cGUgPT0gJ21vZGlmeScgJiYgci5pbml0KHAuZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwLmZuU3VibWl0RXJyb3IgJiYgcC5mblN1Ym1pdEVycm9yKGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiDkvZznlKg65o+Q5Lqk6KGo5Y2V5pWw5o2uXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBzdWJtaXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICQoJ1tkYXRhLWJ0blR5cGU9c3VibWl0XScsICcjJyArIHAudmFsaWRhdGVJRCkuYXR0cignZGlzYWJsZWQnLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgIHIubW9kaWZ5KCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiDkvZznlKg65YWz6Zet54i257G7XHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBjbG9zZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgJCh0KS5wYXJlbnRzKFwiZGl2W3JvbGU9J2RpYWxvZyddXCIpLm1vZGFsKCdoaWRlJyk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiDkvZznlKg65Yid5aeL5YyW6KGo5Y2V5YaF5a65XHJcbiAgICAgICAgICAgICAqIEBkYXRhOuihqOWNleaVsOaNrlxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgaW5pdDogZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgIC8qdmFyIG9wID0ge307XHJcbiAgICAgICAgICAgICAgICAgb3AucnVsZXMgPSBwLnJ1bGVzO1xyXG4gICAgICAgICAgICAgICAgIG9wLnN1Ym1pdEhhbmRsZXIgPSByLnN1Ym1pdDtcclxuICAgICAgICAgICAgICAgICAkKFwiI1wiICsgcC52YWxpZGF0ZUlEKS52YWxpZGF0ZShvcCk7Ki9cclxuICAgICAgICAgICAgICAgICQoXCIudmFsaW5wdXRcIiwgXCIjXCIgKyBwLnZhbGlkYXRlSUQpLmVhY2goZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgdGhhdCA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5hbWUgPSB0aGF0LmF0dHIoJ25hbWUnKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBkYXRhID8gZGF0YVtuYW1lXSA6IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKChuYW1lIHx8IG5hbWUgPT09ICcwJykgJiYgKHZhbHVlIHx8IHZhbHVlID09PSAwIHx8IHZhbHVlID09PSAnMCcpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICEkLmlzQXJyYXkodmFsdWUpICYmICh2YWx1ZSA9IChcIlwiICsgdmFsdWUpLnJlcGxhY2VIVE1MQ2hhcigpLnJlcGxhY2UoL+OAjC9nLCAnWycpLnJlcGxhY2UoL+OAjS9nLCAnXScpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudGFnTmFtZS50b0xvd2VyQ2FzZSgpID09ICd0ZXh0YXJlYScpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuaHRtbCgodmFsdWUgKyBcIlwiKS5yZXBsYWNlSFRNTENoYXIoKS5yZXBsYWNlSWxsZWdhbENoYXIoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAodGhpcy50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT0gJ3NlbGVjdCcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpdGVtID0gcC50ZW1wRGF0YVtuYW1lXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpdGVtICYmIHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC52YWwodmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHRoaXMuZ2V0QXR0cmlidXRlKCd0eXBlJykudG9Mb3dlckNhc2UoKSA9PSAnaW1hZ2UtZm9ybScpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBiZyA9IG5ldyBJbWFnZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJnLnNyYyA9ICh0aGF0LmF0dHIoJ2RhdGEtZmlsZURpc0RpcicpIHx8ICcvdGVtcC9zeXN0ZW0vaW1hZ2UvJykgKyB2YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiZy5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5wYXJlbnQoKS5maW5kKCdpbWcnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKCdzcmMnLCAodGhhdC5hdHRyKCdkYXRhLWZpbGVEaXNEaXInKSB8fCAnL3RlbXAvc3lzdGVtL2ltYWdlLycpICsgdmFsdWUpLmF0dHIoJ2FsdCcsIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgMTApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnZhbCh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhhdC5hdHRyKCd0eXBlJykgPT0gJ3NlbGVjdCcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaXRlbSA9IHAudGVtcERhdGFbbmFtZV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0gJiYgdmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKGl0ZW0sIGZ1bmN0aW9uIChpLCB0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodC52YWx1ZSA9PSB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQucGFyZW50KCkuZmluZCgnLmRpc2FibGVkJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmh0bWwoKCh0LnRleHQgfHwgdC52YWx1ZSkgKyBcIlwiKS5yZXBsYWNlSWxsZWdhbENoYXIoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LmhpZGUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnZhbCh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5kYXRhKCdmbkluaXQnKSAmJiAkLmlzRnVuY3Rpb24odGhhdC5kYXRhKCdmbkluaXQnKSkgJiYgdGhhdC5kYXRhKCdmbkluaXQnKSh0aGF0LCB2YWx1ZSwgZGF0YSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZ2V0RGF0YTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGR0ID0gJChcIiNcIiArIHAudmFsaWRhdGVJRCkuc2VyaWFsaXplQXJyYXkoKTtcclxuICAgICAgICAgICAgICAgIHZhciBkYXRhID0ge307XHJcbiAgICAgICAgICAgICAgICAkLmVhY2goZHQsIGZ1bmN0aW9uICh0LCBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy92YXIga2V5ID0gZS5uYW1lICYmIGUubmFtZS5yZXBsYWNlSWxsZWdhbENoYXIoKTtcclxuICAgICAgICAgICAgICAgICAgICAvL2RhdGFba2V5XSA9IGUudmFsdWUgJiYgZS52YWx1ZS5yZXBsYWNlSWxsZWdhbENoYXIoKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIga2V5ID0gZS5uYW1lO1xyXG4gICAgICAgICAgICAgICAgICAgIGRhdGFba2V5XSA9IGUudmFsdWU7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGRhdGEgPSBwLmZuTW9kaWZ5RGF0YSA/IHAuZm5Nb2RpZnlEYXRhKGRhdGEpIDogZGF0YTtcclxuICAgICAgICAgICAgICAgIHAuZm5HZXREYXRhKGRhdGEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIHN1Ym1pdCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgJChcIiNcIiArIHAudmFsaWRhdGVJRCkuc3VibWl0KCk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICB2YXIgY2xvc2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHIuY2xvc2UoKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIGlmIChwLm9ubHkpIHtcclxuICAgICAgICAgICAgdmFyIHRpdGxlID0gbnVsbDtcclxuICAgICAgICAgICAgaWYgKHAuaGVhZGVyLmNvbnN0cnVjdG9yID09IEFycmF5ICYmIHAuaGVhZGVyWzBdKSB7XHJcbiAgICAgICAgICAgICAgICB0aXRsZSA9IHAuaGVhZGVyWzBdO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHAuaGVhZGVyLmNvbnN0cnVjdG9yID09IFN0cmluZyAmJiBwLmhlYWRlcikge1xyXG4gICAgICAgICAgICAgICAgdGl0bGUgPSBwLmhlYWRlcjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByLmFkZEZpZWxkc2V0KHZhbGlkYXRlLCBwLm1vZGVsLCB0aXRsZSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgJC5lYWNoKHAubW9kZWwsIGZ1bmN0aW9uIChpKSB7XHJcbiAgICAgICAgICAgICAgICByLmFkZEZpZWxkc2V0KHZhbGlkYXRlLCB0aGlzLCBwLmhlYWRlcltpXSA/IHAuaGVhZGVyW2ldIDogbnVsbCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy/ooajljZXliJ3lp4vljJblrozmiJDmt7vliqDpqozor4Hop4TliJlcclxuICAgICAgICB2YXIgb3AgPSB7fTtcclxuICAgICAgICBvcC5ydWxlcyA9IHAucnVsZXM7XHJcbiAgICAgICAgb3AubWVzc2FnZXMgPSBwLm1lc3NhZ2VzO1xyXG4gICAgICAgIG9wLnN1Ym1pdEhhbmRsZXIgPSByLnN1Ym1pdDtcclxuICAgICAgICAkKFwiI1wiICsgcC52YWxpZGF0ZUlEKS52YWxpZGF0ZShvcCk7XHJcblxyXG4gICAgICAgIHAuc2hvdyA9PSAndmVydGljYWwnICYmIHIuYWRkQnV0dG9uc1RhYmxlKHZhbGlkYXRlLCBwLmJ1dHRvbnMpO1xyXG4gICAgICAgIHAudHlwZSA9PSAnYWRkJyA/IHIuaW5pdCh7fSkgOiAocC5kYXRhID8gci5pbml0KHAuZGF0YSkgOiByLmxpc3QoKSk7XHJcbiAgICAgICAgcC5mbkdldERhdGEgJiYgci5nZXREYXRhKCk7XHJcbiAgICAgICAgdC5yID0gcjtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH07XHJcbiAgICB2YXIgZG9jTG9hZGVkID0gZmFsc2U7XHJcbiAgICAkKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgZG9jTG9hZGVkID0gdHJ1ZTtcclxuICAgIH0pO1xyXG5cclxuICAgICQuZm4uVmFsaWRhdGVGb3JtID0gZnVuY3Rpb24gKGlkLCBwKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmICghZG9jTG9hZGVkKSB7XHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgIHZhciB0ID0gdGhpcztcclxuICAgICAgICAgICAgICAgICQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAkLmFkZFZhbGlkYXRlKHQsIGlkLCBwKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgJC5hZGRWYWxpZGF0ZSh0aGlzLCBpZCwgcCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbiAgICAvKipcclxuICAgICAqIOiOt+WPluihqOWNleW6j+WIl+WMluaVsOaNrlxyXG4gICAgICogQHBhcmFtIGlkXHJcbiAgICAgKiBAcmV0dXJucyB7e319XHJcbiAgICAgKiBAY29uc3RydWN0b3JcclxuICAgICAqL1xyXG4gICAgJC5mbi5WYWxpZGF0ZVZhbHVlID0gZnVuY3Rpb24gKGlkKSB7XHJcbiAgICAgICAgdmFyIGR0ID0gJChcIiNcIiArIGlkICsgXCJWYWxpZGF0ZVwiKS5zZXJpYWxpemVBcnJheSgpO1xyXG4gICAgICAgIHZhciBkYXRhID0ge307XHJcbiAgICAgICAgJC5lYWNoKGR0LCBmdW5jdGlvbiAodCwgZSkge1xyXG4gICAgICAgICAgICB2YXIga2V5ID0gZS5uYW1lO1xyXG4gICAgICAgICAgICBkYXRhW2tleV0gPSBlLnZhbHVlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBkYXRhO1xyXG4gICAgfTtcclxuICAgIC8qKlxyXG4gICAgICog6KGo5Y2V5pWw5o2u5Yid5aeL5YyWXHJcbiAgICAgKiBAcmV0dXJucyB7Kn1cclxuICAgICAqIEBjb25zdHJ1Y3RvclxyXG4gICAgICovXHJcbiAgICAkLmZuLlZhbGlkYXRlSW5pdCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMucCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wLmRhdGEgPyB0aGlzLnIuaW5pdCh0aGlzLnAuZGF0YSkgOiB0aGlzLnIubGlzdCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG4gICAgJC5mbi5WYWxpZGF0ZURpYWxvZ0Nsb3NlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5wKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnIuY2xvc2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuICAgIHJldHVybiAkO1xyXG59KTsiXSwiZmlsZSI6InBsdWdpbnMvVmFsaWRhdGVGb3JtL1ZhbGlkYXRlRm9ybS5qcyJ9
