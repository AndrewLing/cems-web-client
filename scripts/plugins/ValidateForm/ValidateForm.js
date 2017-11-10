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
        p.only = p.model &&  p.model[0][0][0] ? false : true;

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