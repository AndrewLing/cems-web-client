App.Module.config({
    package: '/dp_man',
    moduleName: 'addStation',
    description: '模块功能：添加站点',
    importList: ['jquery', 'bootstrap','datePicker', 'plugins/ajaxfileupload','ValidataOwner']
});
App.Module('addStation', function () {
	var isMdf = null;//是否是修改数据
	var data = null;//修改时的data
	var callback = null;//创建或成功后回调的方法
    var addStation = {
        Render: function (params) {
        	//设置背景色
        	 main.setBackColor();
        	//修改上传头像框的提示信息
         	$('#stationPicFile').attr("title",Msg.scan);
         	$('.imgtip').html((Msg.image.imgTip).replace('{0}',512));
         	
        	isMdf = params.isMdf;
        	callback= params.callback;
        	data = params.data && params.data[0];
        	//初始化验证规则
        	addStation.initValid();
        	//初始化事件监听
        	addStation.initEvent();
        	//修改时 回显数据
        	addStation.initData();
        },
        //修改时 回显数据
        initData : function(){
        	var btimel = Date.parse('00:00:00','HH:mm:ss').getTime();
        	$('#busines_begin').val((Date.parse(btimel)).format(Msg.dateFormat.HHmmss));
        	var etimel = Date.parse('23:59:59','HH:mm:ss').getTime();
        	$('#busines_end').val((Date.parse(etimel)).format(Msg.dateFormat.HHmmss));
        	if(data){
        		var inputArr = $('.inputVal');
            	$.each(inputArr,function(t,e){
            		var name = $(e).attr('name');
            		var val = data[name];
            		if(name == 'businesStartHours' || name =='businesEndHours'){
            			val = (Date.parse(val)).format(Msg.dateFormat.HHmmss);
            		}
            		if(name != 'administrativeAreaId' && val){
            			$(e).val(val);
            		} 
            	});
            	var picUrl = data['picUrl'];
            	if(picUrl){
            		$('#stationPicFile').attr('fileId',picUrl);
            		$("#stationPicImg").attr("src", "/fileManager/downloadFile?serviceId=1&fileId="+picUrl+"&t="+new Date().getTime()).error(function(){
	        			 $(this).removeAttr('src');
	        		});	
            	}
        	}
        },
        //初始化验证规则
        initValid:function(){
        	var $this = addStation.getPage;
        	//表单验证
        	$this('#addStationForm').validate({
				rules: {
					name: {
						required: true,
						maxlength: 64,
						vacSepecialString:true
					},
					administrativeAreaId:{
						required: true
					},
					address:{
						maxlength: 64,
						vacSepecialString:true
					},
					stationOwner:{
						maxlength: 128,
						vacSepecialString:true
					},
					longitude:{
						number:true,
						required: true,
						max:180,
						min:-180,
						maxlength: 15,
					},
					latitude:{
						number:true,
						required: true,
						max:90,
						min:-90,
						maxlength: 15,
					},
					powerRate:{
						required: true,
						number:true,
						maxlength: 15
					},
					parkMoney:{
						number:true,
						maxlength: 15
					},
					serveMoney:{
						required: true,
						number:true,
						maxlength: 15
					},
					businesEndHours:{
						comparGtTime:{to:"#busines_begin",formatter:Msg.dateFormat.HHmmss}
					}
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
        },
        //初始化事件
        initEvent:function(){
        	var $this = addStation.getPage;
        	//域选择框
        	$this('#stationArea').iemsInputTree({
                url: 'domain/queryUserDomains',
                checkStyle: "radio",
                textFiled:"name",
                ajaxBefore:true,
                clickPIsChecked:true,
                isPromptlyInit:true,
                treeNodeFormat:function(nodes){
                	var n = nodes.length;
                	while(n--){
                		var e = nodes[n];
                		if(e.id == 1){
                			nodes.splice(e,1);
                		}
                	}
                	return nodes;
                },
                selectNodes: data && data.administrativeAreaId ? [data.administrativeAreaId+""] : false
                		
            });
        	$("#stationArea_searchDiv").hide();
        	//时间
        	$('#busines_begin').off("click").on("click", function (e) {
	       		 DatePicker({
	                 dateFmt: Msg.dateFormat.HHmmss,
	                 maxDate:$('#busines_end').val()
	       		 });
        	});
        	$('#busines_end').off("click").on("click", function (e) {
	       		 DatePicker({
	                 dateFmt: Msg.dateFormat.HHmmss,
	                 minDate:$('#busines_begin').val()
	       		 });
        	});
        	//保存按钮
        	$('#add_station_save').off('click').on('click',function(){
        		var form = $this('#addStationForm');
				if (!form.valid()) {
					return;
				}
                if($('#stationPicText').val()){
                	var params={};
                    params.formId="stationPicFile";
                    params.serviceId= "1";
                    fileId = data && data.picUrl ? data.picUrl : "";
                    if(fileId && fileId !="" && fileId != undefined){
                        params.fileId = fileId;
                    }
                    main.fileUpload(params,function(res){
                    	addStation.saveOrMdfStation(res.data);
                    },function(){
                    	main.comonErrorFun(Msg.image.uploadFailed);
                    });
                }else{
                	addStation.saveOrMdfStation();
                }
        	});
        	//图片上传
        	if(main.getBrowser() && !main.getBrowser().msie){
        		$this('.btn-scan').off('click').on('click',function(){
        			$('#stationPicFile').click();
        		});
        	}
        	$('#stationPicFile').off('change').on('change',function(e){
        		var $this = $(this);
    			var fileURL = $this.val();
    	        var fileName = '';
    	        if(fileURL && fileURL != ''){
	        		 var all = fileURL.split('\\');
	                 fileName = all[all.length-1];
    	        }
    	        $("#stationPicText").val(fileName);
    	        if(fileName == ''){
    	        	var fileId = $("#stationPicFile").attr('fileId');
    	        	if(fileId){
    	        		$("#stationPicImg").attr("src", "/fileManager/downloadFile?serviceId=1&fileId="+fileId+"&t="+new Date().getTime()).error(function(){
     	        			 $(this).removeAttr('src');
     	        		});	
    	        	}else{
    	        		$("#stationPicImg").removeAttr('src');
    	        	}
    	        	return;
    	        }
    			if(!main.checkImage(e,$("#stationPicText"))){
            		return;
            	}
    			var prevDiv = $('#stationPicImg');
    	        if (this.files && this.files[0]){
    	        	 if(!(typeof FileReader == "undefined")){
    	        		 var reader = new FileReader();
        	        	 reader.onload = function(evt){
        	        		 prevDiv.attr('src',evt.target.result );
        	        	 }
        	        	 reader.readAsDataURL(this.files[0]);
    	        	 }
    	        }
    		});
        	
        },
        //保存或者修改站点信息
        saveOrMdfStation:function(picurl){
        	var $this = addStation.getPage;
        	var form = $this('#addStationForm');
			if (!form.valid()) {
				return;
			}
        	var url = "/station/save";
        	if(isMdf) {
        		url = "/station/mdf";
        	}
        	var info = addStation.getStationInfo();
        	info.picUrl = picurl || $("#stationPicFile").attr('fileId');
        	$.http.ajax(url, info, function (res) {
                if (res.success) {
                	main.comonErrorFun(isMdf ? Msg.modifySucceed : Msg.saveSucceed,function(){
                		$.isFunction(callback) && callback(res);
                		App.dialog('close')
                	});
                } else {
                	var msg = isMdf ? Msg.modifyFailed : Msg.saveFailed;
                	if( !$.isPlainObject(res.data)){
                		msg = res.data;
                	}
                	main.comonErrorFun(msg);
                }
            },function(){
            	main.comonErrorFun(isMdf ? Msg.modifyFailed : Msg.saveFailed);
            });
        },
        //获取页面输入的站点信息
        getStationInfo:function(){
        	var info = {};
        	var inputArr = $('.inputVal');
        	$.each(inputArr,function(t,e){
        		var name = $(e).attr('name');
        		var val = $(e).val();
        		if(name == 'administrativeAreaId'){
        			val = $(e).attr("treeSelId");
        		}else if('businesStartHours' == name || 'businesEndHours' == name){
        			val = Date.parse(val,Msg.dateFormat.HHmmss).getTime();
        		}
        		info[name]= val;
        	});
        	info.id = data && data.id ? data.id :null;
        	return info;
        },
        /**
		 * 获取页面元素
		 * @param expr
		 * @returns {*}
		 */
		getPage: function (expr) {
			var page = $("#dpManAddStation");
			return expr ? page.find(expr) : page;
		}
    };
    return addStation;
});