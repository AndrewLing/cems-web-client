'use strict';
App.Module.config({
    package: '/sm_domain',
    moduleName: 'sm_domain_addDomain',
    description: '模块功能：添加域',
    importList: ['jquery', 'bootstrap', 'datePicker', 'plugins/ajaxfileupload', 'dynamic']
});
App.Module('sm_domain_addDomain', function() {
    var type = null; //是否是修改数据
    var data = null; //修改时的data
    var callback = null; //创建或成功后回调的方法
    var addDomain = {
        Render: function(params) {
            main.setBackColor();
            type = params.type;
            callback = params.callback;
            data = params.data && params.data;
            //初始化校验
            addDomain.initValid();
            //初始化事件
            addDomain.initEvent();
            //数据初始化
            addDomain.initData();

        },
        //初始化校验
        initValid: function() {
            //表单验证
            $('#addDomainForm').validate({
                rules: {
                    domainName: {
                        required: true,
                        maxlength: 64,
                        vacSepecialString: true
                    },
                    description: {
                        maxlength: 255,
                        vacSepecialString: true
                    }
                },
                errorPlacement: function(error, element) {
                    var msg = $(error).html();
                    if ($(element)[0].className.indexOf('error') >= 0) {
                        main.tip($(element), null, false);
                    }
                    main.tip($(element), msg.replaceHTMLChar(), true, 'bottom');
                },
                unhighlight: function(e, errorClass) {
                    $(e).removeClass(errorClass);
                    main.tip($(e), null, false);
                }
            });
        },
        //修改时 回显数据
        initData: function() {
            if ('view' == type) {
                $('.must').removeClass("tdMust");
                $('#cancel').hide();
                $('#add_domain_save').hide();
                $('#close').show();
                var arr = $('.inputVal');
                arr.addClass('inputValOnlyRead');
                arr.attr('readOnly', true);
                $('#parentDomain').attr('disabled', true);
            } else {
                $('.must').addClass('tdMust');
                $('#cancel').show();
                $('#add_domain_save').show();
                $('#close').hide();
            }
            if (data) {
                var inputArr = $('.inputVal');
                $.each(inputArr, function(t, e) {
                    var name = $(e).attr('name');
                    var val = data[name];
                    if ('pid' != name) {
                        $(e).val(val);
                    }
                });
            }
        },
        //初始化事件
        initEvent: function() {
            //域选择框
            $('#parentDomain').iemsInputTree({
                url: 'domain/queryUserDomains',
                checkStyle: "radio",
                textFiled: "name",
                ajaxBefore: true,
                isPromptlyInit: true,
                clickPIsChecked: true,
                treeNodeFormat: function(nodes) {
                    var n = nodes.length;
                    while (n--) {
                        var e = nodes[n];
                        if (e.id == 1) {
                            nodes.splice(e, 1);
                        }
                    }
                    return nodes;
                },
                success: function(datas, treeObj) {
                    if ('mdf' == type) {
                        var nodes = treeObj.getNodesByParam("id", data.id, null);
                        if (nodes && nodes.length > 0) {
                            treeObj.setChkDisabled(nodes[0], true);
                        }
                    }
                },
                selectNodes: data && data.pid ? [data.pid + ""] : false
            });
            $("#parentDomain_searchDiv").hide();
            //保存按钮
            $('#add_domain_save').off('click').on('click', function() {
                var form = $('#addDomainForm');
                if (!form.valid()) {
                    return;
                }
                if ('view' == type) return;
                if ($('#stationPicText').val()) {
                    var params = {};
                    params.formId = "stationPicFile";
                    params.serviceId = "1";
                    var fileId = data && data.picUrl ? data.picUrl : "";
                    if (fileId && fileId != "" && fileId != undefined) {
                        params.fileId = fileId;
                    }
                    main.fileUpload(params, function() {
                        var url = "/station/save";
                        addDomain.saveOrMdfDomain();
                    }, function() {
                        main.comonErrorFun(Msg.image.uploadFailed);
                    });
                } else {
                    addDomain.saveOrMdfDomain();
                }
            });

        },
        //保存或者修改站点信息
        saveOrMdfDomain: function(params) {
            var url = "/domain/createDomain";
            if (type == "mdf") {
                url = "/domain/updateDomain";
            }
            var info = addDomain.getDomainInfo();
            $.http.ajax(url, info, function(res) {
                if (res.success) {
                    main.comonErrorFun(type == "mdf" ? Msg.modifySucceed : Msg.saveSucceed, function() {
                        $.isFunction(callback) && callback(type, res);
                        App.dialog('close');
                    });
                } else {
                    var msg = type == "mdf" ? Msg.modifyFailed : Msg.saveFailed;
                    if (!$.isPlainObject(res.data)) {
                        msg = res.data;
                    }
                    main.comonErrorFun(msg);
                }
            }, function() {
                main.comonErrorFun(type == "mdf" ? Msg.modifyFailed : Msg.saveFailed);
            });
        },
        //获取页面输入的域信息
        getDomainInfo: function() {
            var info = {};
            var inputArr = $('.inputVal');
            $.each(inputArr, function(t, e) {
                var name = $(e).attr('name');
                var val = $(e).val();
                if (name == 'pid') {
                    val = $(e).attr("treeSelId");
                    val = !val ? 1 : val;
                }
                info[name] = val;
            });
            info.id = data && data.id ? data.id : null;
            return info;
        }
    };
    return addDomain;
});