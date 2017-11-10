App.Module.config({
	package : '/dz_',
	moduleName : 'dz_addPile',
	description : '模块功能：充电桩管理',
	importList : [ 'jquery', 'bootstrap', 'easyTabs', 'ValidateForm','iemsInputTree',
			'datePicker', 'GridTable', 'dynamic' ]
});
App.Module('dz_addPile', function() {
	var url;
    var result;
    var pileInfoData;
    var pileRateData;
    var clickNum;
	var addPile = {
		Render : function(params) {
			main.setBackColor();
			var _this = this;
			$(function() { 
				url='/pile/savePile';
				result = Msg.saveSucceed;
				_this.fillData(params);
				_this.initBtn();
				_this.useDefaultCheck();
				_this.addBtnClick(0);
				_this.deleteBtnClick();
			});
		},
		/**
         * 初始化按钮行为
         * @param params
         * @param dmUtil
         */
        initBtn: function () {
            var $P = this.getPage;
            addPile.clickTime($('#startTime'),$('#endTime'));
            //表单验证
            $P('#dzMan_form').validate({
                rules: {
                    serialNumber: {required: true, maxlength: 64, vacSepecialString: true},
                    gunsNum: {required: true, digits: true},
                    stationId: {required: true},
                    ratedVoltage: {number: true},
                    powerRating: {number: true},
                    longitude: {
                        number: true,
                        max: 180,
                        min: -180,
                        maxlength: 15,
                    },
                    latitude: {
                        number: true,
                        max: 180,
                        min: -180,
                        maxlength: 15,
                    },
                    businessType: {maxlength: 64},
                    chargeInterface: {maxlength: 64}

                },
                errorPlacement: function (error, element) {
					var msg = $(error).html();
					if($(element)[0].className.indexOf('error') >=0){
						main.tip($(element),null,false);
					}
					main.tip($(element),msg.replaceHTMLChar(),true,'bottom');
		        },
		        unhighlight:function(e, errorClass){
		        	$(e).removeClass(errorClass);
		        	main.tip($(e),null,false);
		        }
            });
            
            $("input[name='stationId']").off('click').on('click', function () {
                $(this).iemsInputTree({
                    url: 'domain/queryUserDomainStaRes',
                    checkStyle: "radio",
                    textFiled: "name",
                    ajaxBefore: true,
                    isPromptlyInit: true,
                    selectNodes: pileInfoData && pileInfoData.stationId ? [pileInfoData.stationId] : false,
                    treeNodeFormat: function (nodes) {
                    	var n = nodes.length;
                    	while(n--){
                    		var e = nodes[n];
                    		if(e.id == 1 || e.id == '1'){
                    			nodes.splice(e,1);
                    		}
                    		if (e.model == "STATION") {
                             	e.icon = "/images/main/sm_domain/nodeStation.png";
                            }
                            else if((e.model).indexOf("DOMAIN")>=0) {
                             	e.chkDisabled = true;
                            }
                    		e.name = main.getTopDomianName(e.name);
                    	}
                    	return nodes;
                  }
                });
            })
           
            //提交保存请求
            $('#dzman_submit_btn').click(function () {
            	var faultRateSetSelect = $("#useDefaultPrice")[0].checked;
            	if(!faultRateSetSelect){
            		// 对费率设置校验
                	var endTime = addPile.rateSetChecked();
                	if(!endTime){
                		return;
                	}
                	if(endTime != "23:59:59"){
                		App.alert(Msg.modules.dz_man.addPile.lEndTime);
    					return;
                	}
            	}
            	// 将桩的信息封装成JSON对象
            	var pileData = addPile.pileInfoToJson(0);
                $.http.ajax(url, {
                    data: pileData,
                }, function (data) {
                    if (data.success) {
                        App.alert(data.data == null ? result : data.data);
                        $("#ChargepileTable").GridTableReload();
                        addPile.closeDialog();
                    } else {
                        App.alert(Msg.saveFailed);
                    }
                });
            });
            //提交保存并上线请求
            $('#dzman_save_online_btn').click(function () {
            	var faultRateSetSelect = $("#useDefaultPrice")[0].checked;
            	if(!faultRateSetSelect){
            		// 对费率设置校验
                	var endTime = addPile.rateSetChecked();
                	if(!endTime){
                		return;
                	}
                	if(endTime != "23:59:59"){
                		App.alert(Msg.modules.dz_man.addPile.lEndTime);
    					return;
                	}
            	}
            	// 将桩的信息封装成JSON对象
            	var pileData = addPile.pileInfoToJson(1);
                $.http.ajax(url, {
                    data: pileData,
                }, function (data) {
                    if (data.success) {
                        App.alert(data.data == null ? result : data.data);
                        $("#ChargepileTable").GridTableReload();
                        addPile.closeDialog();
                    } else {
                        App.alert(Msg.saveFailed);
                    }
                });
            });
        },
        /**
         * 获取桩的编号
         */
        getPileNo:function (){
        	return $("input[name='serialNumber']").val();
        },
        /**
         * 获取页面元素
         * @param expr
         * @returns {*}
         */
        getPage: function (expr) {
            var page = $("#dz_addPile");
            return expr ? page.find(expr) : page;
        },
        /**
         * 添加必填项*号标记
         */
        addStar: function () {
            var $P = this.getPage;
            var names = ['serialNumber', 'stationId'];
            $.each(names, function (k, v) {
                var _star = $('<span> * </span>').css({
                    'color': 'red'
                });
                var e = $P('input[name=' + v + '], textarea[name=' + v + ']');
                e.next('span').remove();
                e.after(_star);
            });
        },
        /**
         * 关闭弹出框
         */
        closeDialog: function () {
            $("#pile_moudle").modal('hide');
        },
        /**
         * 填充表单数据
         * @param data
         */
        fillData: function (data) {
        	var type = data.type;
        	if(data.data){
        		pileInfoData = data.data.pileInfo;
                pileRateData = data.data.pileRate;
                var rateNum = pileRateData.length;
                if(type == 1 || type == 3){
                    addPile.addBtnClick(0);
                }
                for (var n = 1; n < rateNum; n++) {
                	addPile.pileRateDIV(n);
                	if(data.type == 3){
                		$('#dzManRateSet').find('.closeTag').remove();
                	}
				}
                if (pileInfoData && pileRateData && data.type == 2) { // 修改
                	
                    var infoData = {
                        id: pileInfoData.id,
                        serialNumber: pileInfoData.serialNumber,
                        deviceType: pileInfoData.deviceType,
                        gunsNum: pileInfoData.gunsNum,
                        businessType: pileInfoData.businessType,
                        ratedVoltage: pileInfoData.ratedVoltage,
                        powerRating: pileInfoData.powerRating,
                        longitude: pileInfoData.longitude,
                        latitude: pileInfoData.latitude,
                        stationId: pileInfoData.stationId,
                        statioName: pileInfoData.statioName
                    };
                    $.each(infoData, function (k, v) {
                        if (k == 'deviceType') {
                            $("#dzManCreatePile").seek('deviceType').val(v);
                        } else if (k == 'stationId'){
                        	 $("input[name='stationId']").val(infoData.statioName);
                        	 $("input[name='stationId']").attr('treeselid', v);
                        } else if (k == 'businessType') {
                            $("#dzManCreatePile").seek('businessType').val(parseFloat(v));
                        } else if (k == 'serialNumber') {
                        	 $("input[name='serialNumber']").val(v);
                        } else {
                            $("#dzManCreatePile").seek(k).val(v);
                        }
                    });
                 // 填充费率信息
                    for (var i = 0; i < pileRateData.length; i++) {
                    	var rateData = {
                    		startTime: pileRateData[i].startTime,
                    		endTime: pileRateData[i].endTime,
                    		price: pileRateData[i].price,
                    		service: pileRateData[i].service
                            };
                    	var id = 'priceTag'+i;
                        $.each(rateData, function (k, v) {
                            if (k == 'startTime') {
                                $("#"+id).seek(k).val((Date.parse(v)).format(Msg.dateFormat.HHmmss));
                            } else if (k == 'endTime') {
                                $("#"+id).seek(k).val((Date.parse(v)).format(Msg.dateFormat.HHmmss));
                            } else if (k == 'price') {
                                $("#"+id).seek(k).val(parseFloat(v));
                            } else {
                                $("#"+id).seek(k).val(parseFloat(v));
                            }
                        });
    				}
                    $("input[name='serialNumber']").attr('disabled',true);
                    $("#dzman_save_online_btn").remove();
                    url = '/pile/updatePile';
                    result = Msg.modifySucceed;
                } else if (pileInfoData && pileRateData && data.type == 3) { // 详细信息
                	// 填充桩信息
                    var infoData = {
                        id: pileInfoData.id,
                        serialNumber: pileInfoData.serialNumber,
                        deviceType: pileInfoData.deviceType,
                        gunsNum: pileInfoData.gunsNum,
                        businessType: pileInfoData.businessType,
                        ratedVoltage: pileInfoData.ratedVoltage,
                        powerRating: pileInfoData.powerRating,
                        longitude: pileInfoData.longitude,
                        latitude: pileInfoData.latitude,
                        stationId: pileInfoData.statioName
                    };
                    $.each(infoData, function (k, v) {
                        if (k == 'deviceType') {
                            $("#dzManCreatePile").seek('deviceType').val(v);
                        } else if (k == 'businessType') {
                            $("#dzManCreatePile").seek('businessType').val(parseFloat(v));
                        } else if (k == 'stationId') {
                            $("#dzManCreatePile").seek(k).fillText(v);
                        } else {
                            $("#dzManCreatePile").seek(k).fillText(v);
                        }
                    });
                    // 填充费率信息
                    for (var i = 0; i < pileRateData.length; i++) {
                    	var rateData = {
                    		startTime: pileRateData[i].startTime,
                    		endTime: pileRateData[i].endTime,
                    		price: pileRateData[i].price,
                    		service: pileRateData[i].service
                    		};
                    	var id = 'priceTag'+i;
                            $.each(rateData, function (k, v) {
                                if (k == 'startTime') {
                                    $("#"+id).seek(k).val((Date.parse(v)).format(Msg.dateFormat.HHmmss));
                                } else if (k == 'endTime') {
                                    $("#"+id).seek(k).val((Date.parse(v)).format(Msg.dateFormat.HHmmss));
                                } else if (k == 'price') {
                                    $("#"+id).seek(k).val(parseFloat(v));
                                } else {
                                    $("#"+id).seek(k).val(parseFloat(v));
                                }
                            });
    				}
                    $(".modal-footer").find('button').hide();
                    addPile.getPage().find('.tdMust').removeClass('tdMust');
                    addPile.getPage().find('input').attr('disabled', true);
                    $.each(addPile.getPage().find('input'),function(t,e){
                    	var str = $(e).val();
                    	str && $(e).attr('title',str);
                    });
                    addPile.getPage().find('select').attr('disabled', true);
                    $.each(addPile.getPage().find('select'),function(t,e){
                    	var val = $(e).val();
                    	var str = $(e).find('option[value='+val+']').text();
                    	str && $(e).attr('title',str);
                    	});
                    }
                }
        	},

        /**
         * 查询站点
         * @param id
         * @returns {*}
         */
        getStation: function (id) {
            var station =null;
            $.http.ajax('/station/queryStationById', {
                'id': id,
            }, function (data) {
                if (data.success) {
                    station = data.data;
                }
            },null,false);
            return station;
        },
        /**
		 * 是否选择默认电价设置事件
		 */
		 useDefaultCheck:function(){
			$("#useDefaultPrice").click(function(){
				var checked = this.checked;
				if(!checked){
					$("#timeSubsection").show();
				} else {
					$("#timeSubsection").hide();
				}
			});
		},
		/**
		 * 新增分段费率设置
		 */
		 addBtnClick:function(clickNum){
			$("#addBtn").click(function(){
				clickNum ++;
				addPile.pileRateDIV(clickNum);
			});
		},
		 deleteBtnClick:function(){
			$(".closeTag").off('click').on('click',function(){
				$(this).parents('.headerContent').remove();
				clickNum--;
				addPile.setFirstTime();
			});
		},
		clickTime:function(startTimeInput,endTimeInput){
			var s = startTimeInput.val();
			startTimeInput.data("endTimeInput",endTimeInput);
			startTimeInput.off("click").on("click", function (e) {
				 var _this = $(this);
	       		 DatePicker({
	                 dateFmt: Msg.dateFormat.HHmmss,
	                 maxDate:$(_this.data("endTimeInput")).val(),
	                 isShowClear:true
	       		 });
       	      });
			endTimeInput.data("startTimeInput",startTimeInput);
			endTimeInput.off("click").on("click", function (e) {
				var _this = $(this);
	       		 DatePicker({
	                 dateFmt: Msg.dateFormat.HHmmss,
	                 minDate:$(_this.data("startTimeInput")).val(),
	                 isShowClear:true
	       		 });
			});
		},
		/**
		 * 对费率设置校验
		 */
		rateSetChecked:function(){
			// 先对时间段和费率是否为空判断
			var contents = $('#timeDivide').find('.headerContent');
			var startTimeTemp = "";
			var endTimeTemp = true;
			for(var i = 0; i < contents.length; i++){
				if(!endTimeTemp){
					break;
				}
				var content = contents[i];
				var div = $(content);
				var inputs = div.find('input');
				$.each(inputs,function(index,v){
					var value = $(v).val();
					if(null == value || value == ""){
						if (index == 0) {
							App.alert(Msg.modules.dz_man.addPile.sTimeNull);
							endTimeTemp=false;
							return false;
						} else if (index == 1) {
							App.alert(Msg.modules.dz_man.addPile.eTimeNull);
							endTimeTemp=false;
							return false;
						} else if (index == 2) {
							App.alert(Msg.modules.dz_man.addPile.priceNull);
							endTimeTemp=false;
							return false;
						} else {
							App.alert(Msg.modules.dz_man.addPile.serviceNull);
							endTimeTemp=false;
							return false;
						}
					} else {
						if (index == 0) {
							if(endTimeTemp == null || endTimeTemp == true){
								startTimeTemp = value;
								if(value != "00:00:00"){
									App.alert(Msg.modules.dz_man.addPile.fStartTime);
									endTimeTemp=false;
									return false;
								}
							} else {
								if(value != endTimeTemp){
									App.alert(Msg.modules.dz_man.addPile.isRepeat);
									endTimeTemp=false;
									return false;
								}
							}
						} else if (index == 1) {
							endTimeTemp = value;
							if(endTimeTemp == startTimeTemp){
								App.alert(Msg.modules.dz_man.addPile.isEqulse);
								endTimeTemp=false;
								return false;
							}
						} else if (index == 2) { // 电价设置
							if(!parseFloat(value)){
								App.alert(Msg.modules.dz_man.addPile.priceRight);
								endTimeTemp=false;
								return false;
							}
						} else { // 服务费设置
							if(!parseFloat(value)){
								App.alert(Msg.modules.dz_man.addPile.serviceRight);
								endTimeTemp=false;
								return false;
							}
						}
					}
				});
			}
			return endTimeTemp;
		},
		/**
         * 将桩的信息(静态信息+费率设置)元素组装为JSON格式
         * @returns {{{}}}
         */
		pileInfoToJson: function (onlineStatus) {
			var data = {};
			// 封装桩的静态信息
			var info = {};
			if ($('#dzMan_form') && $('#dzMan_form').serializeArray) {
                var form = $('#dzMan_form').serializeArray();
                $.each(form, function (k, v) {
                    var key = v.name;
                    if (key == 'stationId') {
                    	info[key] = $("input[name='stationId']").attr('treeSelId');
                    }
                    else {
                        var value = v.value.trim();
                        info[key] = value;
                    }
                });
                info.onlineStatus = onlineStatus;
                info.serialNumber = $("input[name='serialNumber']").val();
            }
			data.info = info;
			//如果选择默认的就不用再往下了
			if($("#useDefaultPrice")[0].checked){
				return data;
			}
			// 封装桩的费率
            var pileRate = {};
            var contents = $('#timeDivide').find('.headerContent');
        	for(var i = 0; i < contents.length; i++){
                var rate = {};
        		var content = contents[i];
        		var div = $(content);
        		var inputs = div.find('input');
        		$.each(inputs, function (k, v) {
                    var key = v.name;
                    var value = "";
                    if(k == 0 || k == 1){
                        value = Date.parse(v.value.trim(),'HH:mm:ss').getTime();
                    }else{
                    	value = v.value.trim();
                    }
                    rate[key] = value;
                });
        		rate.serialNumber = addPile.getPileNo();
        		pileRate[i] = rate;
        	}
        	data.pileRate = pileRate;
            return data;
        },
        /**
         * 新增桩的费率设置DIV
         * @returns DIV
         */
		pileRateDIV: function (tagNum) {
			var contentDiv = $('<div/>').addClass('headerContent').attr('id',"priceTag" + tagNum);
			var startTimeInput = $('<input/>').addClass('selectTime i18n').attr('name',"startTime").attr('type',"text").attr('value',"").attr('readonly',"readonly").attr('placeholder',"开始时间");
			var span1 = $('<span/>').html(" ~ ");
			var endTimeInput = $('<input/>').addClass('selectTime i18n').attr('name',"endTime").attr('type',"text").attr('value',"").attr('readonly',"readonly").attr('placeholder',"结束时间");
			var priceLabel = $('<label/>').addClass('i18n text').attr('for',"modelPrice").attr('data-i18n-type',"text").attr('name',"price");
			var spanPrice = $('<span/>').html(Msg.modules.dz_man.addPile.price + Msg.unit.chargeMoneyUnit);
			var span2 = $('<span/>').html(" : ");
			var priceInput = $('<input/>').addClass('money i18n').attr('name',"price").attr('type',"text").attr('value',"").attr('placeholder',"电价");
			var serviceLabel = $('<label/>').addClass('i18n text').attr('for',"modelService").attr('data-i18n-type',"text").attr('name',"price");
			var spanService = $('<span/>').html(Msg.modules.dz_man.addPile.service + Msg.unit.chargeMoneyUnit);
			var span3 = $('<span/>').html(" : ");
			var serviceInput = $('<input/>').addClass('money i18n').attr('name',"service").attr('type',"text").attr('value',"").attr('placeholder',"服务费");
			var b = $('<b/>').addClass('closeTag').attr('style',"display: block;").attr('id',"close");
			var spanx = $('<span/>').html(" x ");
			startTimeInput.appendTo(contentDiv);
			span1.appendTo(contentDiv);
			endTimeInput.appendTo(contentDiv);
			
			priceLabel.appendTo(contentDiv);
			spanPrice.appendTo(priceLabel);
			span2.appendTo(contentDiv);
			priceInput.appendTo(contentDiv);
			
			serviceLabel.appendTo(contentDiv);
			spanService.appendTo(serviceLabel);
			span3.appendTo(contentDiv);
			serviceInput.appendTo(contentDiv);
			
			b.appendTo(contentDiv);
			spanx.appendTo(b);
			
			$('#timeDivide').find('.priceHeader').append(contentDiv);
			addPile.setFirstTime();

			addPile.clickTime(startTimeInput,endTimeInput);
			addPile.deleteBtnClick();
		},
		
		/**
		 * 第一个时间段开始时间设置为00.00.00
		 */
		setFirstTime:function(){
			var time = $("input[name='startTime']").first();
			var btimel = Date.parse('00:00:00','HH:mm:ss').getTime();
        	time.val((Date.parse(btimel)).format(Msg.dateFormat.HHmmss));
		}
        
	};
	return addPile;
});