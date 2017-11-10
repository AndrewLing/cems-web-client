'use strict';
App.Module.config({
	package : '/main',
	moduleName : 'updatePassWord',
	description : '模块功能：修改密码',
	importList : [ 'jquery', 'bootstrap', 'easyTabs', 'ValidateForm',
			'datePicker', 'GridTable','jquery-base64' ]
});
App.Module('updatePassWord', function() {
	var updatePassWord = {
		Render : function() {
			var _this = this;
			$(function() {
				_this.initBtn();
			});
		},

		/**
		 * 初始化按钮行为
		 * @param params
		 * @param dmUtil
		 */
		initBtn: function () {
			var　url='/user/userUpdateInfo';
			var $P = this.getPage;
			//表单验证
			$P('#update_pass_word_form').validate({
				rules: {
					orginPass: {required: true, maxlength: 128},
					newPass: {required: true,maxlength: 128},
					confirmPass: {required:true,maxlength: 128,equalTo:"#update_pass_newPass"}
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
			
			$("input[name='confirmPass']").on('input propertychange',function(){
				if($("#update_pass_newPass").val()==$("#update_pass_newPass").val()){
					$('#update_pass_confirmPass-error').remove();
				}
				
			});
			//提交保存请求
			$('#update_pwd_sure').click(function () {
				$('#update_pass_confirmPass-error').remove();
				var dF = $P('#update_pass_word_form');
				if (!dF.valid()) {
					return;
				}
				$.http.ajax(url, {
					'oldPwd':$.md5($("#update_pass_orginPass").val()),
					'newPwd':main.base64($("#update_pass_newPass").val(),3)
				}, function (data) {
					if (data.success) {
						App.alert(Msg.modifySucceed);
						updatePassWord.closeDialog();
					}
					else {
						App.alert(data.data);
					}
				});
			});
		},
		/**
		 * 获取页面元素
		 * @param expr
		 * @returns {*}
		 */
		getPage: function (expr) {
			var page = $("#updatePassWord");
			return expr ? page.find(expr) : page;
		},
		/**
		 * 关闭弹出框
		 */
		closeDialog: function () {
			$("#pass_modify_moudle").modal('hide');
		}
	};
	return updatePassWord;
});