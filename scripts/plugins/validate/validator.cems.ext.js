$.extend($.validator.messages, {
	comparGtTime:Msg.validator.comparGtTime,
	comparLtTime:Msg.validator.comparLtTime,
	notEqualTo:Msg.validator.notEqualTo
});
$.extend($.validator.methods,{
	/**
	 * 比较时间 大于to的时间   用法如下  to表示开始时间   formatter 表示时间格式的规则
	 * businesEndHours:{
						comparGtTime:{to:"#busines_begin",formatter:Msg.dateFormat.HHmmss}
					}
	 */
	comparGtTime:function(val,e,obj){
		var btime = Date.parse(val,obj.formatter).getTime();
		var etime = Date.parse($(obj.to).val(),obj.formatter).getTime();
		if(btime <= etime){
			return false;
		}
		return true;
	},
	/**
	 * 比较时间 小于to的时间   用法如下  to表示结束始时间   formatter 表示时间格式的规则
	 * businesStartHours:{
						comparLtTime:{to:"#busines_end",formatter:Msg.dateFormat.HHmmss}
					}
	 */
	comparLtTime:function(val,e,obj){
		var btime = Date.parse($(obj.to).val(),obj.formatter).getTime();
		var etime = Date.parse(val,obj.formatter).getTime();
		if(btime <= etime){
			return false;
		}
		return true;
	},
	//不等于
	notEqualTo:function(val,e,ele){
		var oval = $(ele).val();
		if(val == oval){
			return false;
		}
		return true;
	}
});

