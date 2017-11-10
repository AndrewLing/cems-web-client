App.Module.config({
    package: '/findpassword',
    moduleName: 'findpassword',
    description: '模块功能：密码找回',
    importList: ['jquery', 'bootstrap','jquery-base64','Timer']
});
App.Module('findpassword', function () {
	var cur_time;
	var max_time = 60;
    var fpd = {
        Render: function (params) {
        	fpd.initEvent();
        },
        //事件初始化
        initEvent:function(){
        	//更换验证码
        	$('#changeCode').off('click').on('click',function(){
				$('.errorInfo').html('');
				$('#verifyImg').attr("src","user/getcode?t="+new Date().getTime());
			});
        	//回车提交验证账号
			$('#verrifyCode').off('keydown').on('keydown',function(e){
				if(e.keyCode == 13 || e.which == 13){
					$('#accountValid').click();
				}
			});
			
			//提交验证账号
			$('#accountValid').off('click').on('click',function(){
				$('.errorInfo').html('');
				if(!$('#verrifyCode').val()){
					$('#changeCode').click();
		       	 	$('#verrifyCodeErr').html(Msg.modules.findpassword.vercodeError); 
		       	 	return;
				}
				$.http.POST("/user/validAccount",{
			        "loginName": $('#loginName').val(),
			        "verrifyCode": $('#verrifyCode').val()
			    },function(data){
			    	if (data.success) {
			    		$('#curUsername').val($('#loginName').val());
			       	 	$('#index-1').remove();
			       	 	$('#index-2').show();
			       	 	$('.pross-ok .pross-dir').addClass('pross-dir-bg');
			       	 	$($('.pross')[1]).addClass('pross-ok');
			       	 	$('#iemsEmail').val(data.data);
			       	 	fpd.bindIndex2();
			        }else if(data.failCode == '10005'){
			       	 	$('#changeCode').click();
			       	 	$('#verrifyCodeErr').html(Msg.modules.findpassword.vercodeError); 
			        }else if(data.failCode == '10006'){
			       	 	$('#changeCode').click();
			       	 	$('#loginNameErr').html(Msg.modules.findpassword.accountNotExist);
			        }
				})
			});
        },
        initVliData :function(){
        	//表单验证
        	$('#findpwdForm').validate({
				rules: {
					pwd1: {
						required: true,
						maxlength: 64,
						passwordCheck:true
					},
					pwd2:{
						required: true,
						maxlength: 64,
						passwordCheck:true,
						equalTo:"#npwd"
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
        //计时 发送邮箱验证码 
        timer:function(num){
			cur_time = max_time;
			if(num){
				cur_time = num;
			}
			var curTimes = cur_time;
			$('#sendCode').off('click');
			var msgT = Msg.modules.findpassword.laterOnagian;
			$('#sendCode').val(msgT.replace('{0}',--cur_time));
			$('#sendCode').everyTimer("1000ms","sendCodetimes",function(counter){
				if(cur_time == 0){
					cur_time = max_time;
					fpd.sendCode();
					$('#sendCode').val(Msg.modules.findpassword.sendCode);
					return;
				}
				$('#sendCode').val(msgT.replace('{0}',--cur_time));
    		},curTimes);
		},
		//密码找回
		bidnindex3 :function(){
			$('#updatePwd').off('click').on('click',function(){
				$('.errorInfo').html('');
				var npw = $('#npwd').val();
				var cnpw = $('#cnpwd').val();
				var form = $('#findpwdForm');
				if (!form.valid()) {
					return;
				}
				$.http.POST("/user/pwdBack",{
			        "loginName": $('#acountloginName').val(),
			        "pwd": main.base64(npw, 3),
			        "verCode":$('#verCode').val()
			    },function(data){
			    	if (data.success) {
			    		$('#index-3').remove();
			       	 	$('#index-4').show();
			        }else if(data.failCode == '10007'){
			       	 	$('#validErr').html(Msg.modules.findpassword.accountNodeSame);
			        }else if(data.failCode == '10006'){
			       	 	$('#validErr').html(Msg.modules.findpassword.accountNotExist);
			        }else if(data.failCode == '10008'){
			        	$('#validErr').html(Msg.modules.findpassword.vercodeOverdue);
			        }
				});
			});
			$('#cnpwd').off('keydown').on('keydown',function(e){
				if(e.keyCode == 13 || e.which == 13){
					$('#updatePwd').click();
				}
			});
		},
		//验证码校验
		bindIndex2 : function(){
			$('#validSub').off('click').bind('click',function(){
				$('.errorInfo').html('');
				var code = $('#inputCode').val();
				if(!code){
					$('#iemsEmailErr').html(Msg.modules.findpassword.inpVacCode); 
					return;
				}
				$.http.POST("/user/validVerCode",{
			        "loginName": $('#curUsername').val(),
			        "verCode":code
			    },function(data){
			    	if (data.success) {
			    		$('#verCode').val($('#inputCode').val());
			    		$('#acountName').html($('#curUsername').val());
			    		$('#acountloginName').val($('#curUsername').val());
			       	 	$('#index-2').remove();
			       	 	$('#index-3').show();
			       	 	$('.pross-ok .pross-dir').addClass('pross-dir-bg');
			       	 	$($('.pross')[2]).addClass('pross-ok');
			       	 	fpd.initVliData();
			       	 	fpd.bidnindex3();
			        }else if(data.failCode == '10007'){
			       	 	$('#iemsEmailErr').html(Msg.modules.findpassword.accountNodeSame);
			        }else if(data.failCode == '10006'){
			       	 	$('#iemsEmailErr').html(Msg.modules.findpassword.accountNotExist);
			        }else{
			        	$('#iemsEmailErr').html(Msg.modules.findpassword.vercodeOverdueOrError);
			        }
				});
			});
			fpd.sendCode();
			$('#inputCode').off('keydown').on('keydown',function(e){
				if(e.keyCode == 13 || e.which == 13){
					$('#validSub').click();
				}
			});
		},
		//发送验证码
		sendCode : function(){
			//发送验证码  curUsername
			$('#sendCode').off('click').on('click',function(){
				$('.errorInfo').html('');
				var mail = $('#iemsEmail').val();
				if(!mail){
					$('#iemsEmailErr').html(Msg.modules.findpassword.notBindMailNotSend);
				}
				$.http.POST("/user/sendEmail",{
			        "loginName": $('#curUsername').val()
			    },function(data){
			    	if (data.success) {
			    		fpd.timer();
			        }else if(data.failCode == '10007'){
			       	 	$('#iemsEmailErr').html(Msg.modules.findpassword.accountNodeSame);
			        }else if(data.failCode == '10006'){
			       	 	$('#iemsEmailErr').html(Msg.modules.findpassword.accountNotExist);
			        }else if(data.failCode == '10009'){
			       	 	$('#iemsEmailErr').html(Msg.modules.findpassword.notBindMailNotSend);
			        }else{
			        	if(data.failCode > 0){
			        		fpd.timer(data.failCode);
    			        	$('#iemsEmailErr').html(Msg.modules.findpassword.notOftenSendMail);
			        	}else{
			        		$('#iemsEmailErr').html(Msg.modules.findpassword.getpfpddMailFailed);
			        	}
			        }
				});
			});
		}
    };
    return fpd;
});