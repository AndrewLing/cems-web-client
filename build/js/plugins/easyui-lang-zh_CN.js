if ($.fn.pagination){
	$.fn.pagination.defaults.beforePageText = '第';
	$.fn.pagination.defaults.afterPageText = '共{pages}页';
	$.fn.pagination.defaults.displayMsg = '显示{from}到{to},共{total}记录';
}
if ($.fn.datagrid){
	$.fn.datagrid.defaults.loadMsg = '正在处理，请稍待。。。';
}
if ($.fn.treegrid && $.fn.datagrid){
	$.fn.treegrid.defaults.loadMsg = $.fn.datagrid.defaults.loadMsg;
}
if ($.messager){
	$.messager.defaults.ok = '确定';
	$.messager.defaults.cancel = '取消';
}
$.map(['validatebox','textbox','passwordbox','filebox','searchbox',
		'combo','combobox','combogrid','combotree',
		'datebox','datetimebox','numberbox',
		'spinner','numberspinner','timespinner','datetimespinner'], function(plugin){
	if ($.fn[plugin]){
		$.fn[plugin].defaults.missingMessage = '该输入项为必输项';
	}
});
if ($.fn.validatebox){
	$.fn.validatebox.defaults.rules.email.message = '请输入有效的电子邮件地址';
	$.fn.validatebox.defaults.rules.url.message = '请输入有效的URL地址';
	$.fn.validatebox.defaults.rules.length.message = '输入内容长度必须介于{0}和{1}之间';
	$.fn.validatebox.defaults.rules.remote.message = '请修正该字段';
}
if ($.fn.calendar){
	$.fn.calendar.defaults.weeks = ['日','一','二','三','四','五','六'];
	$.fn.calendar.defaults.months = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];
}
if ($.fn.datebox){
	$.fn.datebox.defaults.currentText = '今天';
	$.fn.datebox.defaults.closeText = '关闭';
	$.fn.datebox.defaults.okText = '确定';
	$.fn.datebox.defaults.formatter = function(date){
		var y = date.getFullYear();
		var m = date.getMonth()+1;
		var d = date.getDate();
		return y+'-'+(m<10?('0'+m):m)+'-'+(d<10?('0'+d):d);
	};
	$.fn.datebox.defaults.parser = function(s){
		if (!s) return new Date();
		var ss = s.split('-');
		var y = parseInt(ss[0],10);
		var m = parseInt(ss[1],10);
		var d = parseInt(ss[2],10);
		if (!isNaN(y) && !isNaN(m) && !isNaN(d)){
			return new Date(y,m-1,d);
		} else {
			return new Date();
		}
	};
}
if ($.fn.datetimebox && $.fn.datebox){
	$.extend($.fn.datetimebox.defaults,{
		currentText: $.fn.datebox.defaults.currentText,
		closeText: $.fn.datebox.defaults.closeText,
		okText: $.fn.datebox.defaults.okText
	});
}
if ($.fn.datetimespinner){
	$.fn.datetimespinner.defaults.selections = [[0,4],[5,7],[8,10],[11,13],[14,16],[17,19]]
}

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL2Vhc3l1aS1sYW5nLXpoX0NOLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImlmICgkLmZuLnBhZ2luYXRpb24pe1xyXG5cdCQuZm4ucGFnaW5hdGlvbi5kZWZhdWx0cy5iZWZvcmVQYWdlVGV4dCA9ICfnrKwnO1xyXG5cdCQuZm4ucGFnaW5hdGlvbi5kZWZhdWx0cy5hZnRlclBhZ2VUZXh0ID0gJ+WFsXtwYWdlc33pobUnO1xyXG5cdCQuZm4ucGFnaW5hdGlvbi5kZWZhdWx0cy5kaXNwbGF5TXNnID0gJ+aYvuekuntmcm9tfeWIsHt0b30s5YWxe3RvdGFsfeiusOW9lSc7XHJcbn1cclxuaWYgKCQuZm4uZGF0YWdyaWQpe1xyXG5cdCQuZm4uZGF0YWdyaWQuZGVmYXVsdHMubG9hZE1zZyA9ICfmraPlnKjlpITnkIbvvIzor7fnqI3lvoXjgILjgILjgIInO1xyXG59XHJcbmlmICgkLmZuLnRyZWVncmlkICYmICQuZm4uZGF0YWdyaWQpe1xyXG5cdCQuZm4udHJlZWdyaWQuZGVmYXVsdHMubG9hZE1zZyA9ICQuZm4uZGF0YWdyaWQuZGVmYXVsdHMubG9hZE1zZztcclxufVxyXG5pZiAoJC5tZXNzYWdlcil7XHJcblx0JC5tZXNzYWdlci5kZWZhdWx0cy5vayA9ICfnoa7lrponO1xyXG5cdCQubWVzc2FnZXIuZGVmYXVsdHMuY2FuY2VsID0gJ+WPlua2iCc7XHJcbn1cclxuJC5tYXAoWyd2YWxpZGF0ZWJveCcsJ3RleHRib3gnLCdwYXNzd29yZGJveCcsJ2ZpbGVib3gnLCdzZWFyY2hib3gnLFxyXG5cdFx0J2NvbWJvJywnY29tYm9ib3gnLCdjb21ib2dyaWQnLCdjb21ib3RyZWUnLFxyXG5cdFx0J2RhdGVib3gnLCdkYXRldGltZWJveCcsJ251bWJlcmJveCcsXHJcblx0XHQnc3Bpbm5lcicsJ251bWJlcnNwaW5uZXInLCd0aW1lc3Bpbm5lcicsJ2RhdGV0aW1lc3Bpbm5lciddLCBmdW5jdGlvbihwbHVnaW4pe1xyXG5cdGlmICgkLmZuW3BsdWdpbl0pe1xyXG5cdFx0JC5mbltwbHVnaW5dLmRlZmF1bHRzLm1pc3NpbmdNZXNzYWdlID0gJ+ivpei+k+WFpemhueS4uuW/hei+k+mhuSc7XHJcblx0fVxyXG59KTtcclxuaWYgKCQuZm4udmFsaWRhdGVib3gpe1xyXG5cdCQuZm4udmFsaWRhdGVib3guZGVmYXVsdHMucnVsZXMuZW1haWwubWVzc2FnZSA9ICfor7fovpPlhaXmnInmlYjnmoTnlLXlrZDpgq7ku7blnLDlnYAnO1xyXG5cdCQuZm4udmFsaWRhdGVib3guZGVmYXVsdHMucnVsZXMudXJsLm1lc3NhZ2UgPSAn6K+36L6T5YWl5pyJ5pWI55qEVVJM5Zyw5Z2AJztcclxuXHQkLmZuLnZhbGlkYXRlYm94LmRlZmF1bHRzLnJ1bGVzLmxlbmd0aC5tZXNzYWdlID0gJ+i+k+WFpeWGheWuuemVv+W6puW/hemhu+S7i+S6jnswfeWSjHsxfeS5i+mXtCc7XHJcblx0JC5mbi52YWxpZGF0ZWJveC5kZWZhdWx0cy5ydWxlcy5yZW1vdGUubWVzc2FnZSA9ICfor7fkv67mraPor6XlrZfmrrUnO1xyXG59XHJcbmlmICgkLmZuLmNhbGVuZGFyKXtcclxuXHQkLmZuLmNhbGVuZGFyLmRlZmF1bHRzLndlZWtzID0gWyfml6UnLCfkuIAnLCfkuownLCfkuIknLCflm5snLCfkupQnLCflha0nXTtcclxuXHQkLmZuLmNhbGVuZGFyLmRlZmF1bHRzLm1vbnRocyA9IFsn5LiA5pyIJywn5LqM5pyIJywn5LiJ5pyIJywn5Zub5pyIJywn5LqU5pyIJywn5YWt5pyIJywn5LiD5pyIJywn5YWr5pyIJywn5Lmd5pyIJywn5Y2B5pyIJywn5Y2B5LiA5pyIJywn5Y2B5LqM5pyIJ107XHJcbn1cclxuaWYgKCQuZm4uZGF0ZWJveCl7XHJcblx0JC5mbi5kYXRlYm94LmRlZmF1bHRzLmN1cnJlbnRUZXh0ID0gJ+S7iuWkqSc7XHJcblx0JC5mbi5kYXRlYm94LmRlZmF1bHRzLmNsb3NlVGV4dCA9ICflhbPpl60nO1xyXG5cdCQuZm4uZGF0ZWJveC5kZWZhdWx0cy5va1RleHQgPSAn56Gu5a6aJztcclxuXHQkLmZuLmRhdGVib3guZGVmYXVsdHMuZm9ybWF0dGVyID0gZnVuY3Rpb24oZGF0ZSl7XHJcblx0XHR2YXIgeSA9IGRhdGUuZ2V0RnVsbFllYXIoKTtcclxuXHRcdHZhciBtID0gZGF0ZS5nZXRNb250aCgpKzE7XHJcblx0XHR2YXIgZCA9IGRhdGUuZ2V0RGF0ZSgpO1xyXG5cdFx0cmV0dXJuIHkrJy0nKyhtPDEwPygnMCcrbSk6bSkrJy0nKyhkPDEwPygnMCcrZCk6ZCk7XHJcblx0fTtcclxuXHQkLmZuLmRhdGVib3guZGVmYXVsdHMucGFyc2VyID0gZnVuY3Rpb24ocyl7XHJcblx0XHRpZiAoIXMpIHJldHVybiBuZXcgRGF0ZSgpO1xyXG5cdFx0dmFyIHNzID0gcy5zcGxpdCgnLScpO1xyXG5cdFx0dmFyIHkgPSBwYXJzZUludChzc1swXSwxMCk7XHJcblx0XHR2YXIgbSA9IHBhcnNlSW50KHNzWzFdLDEwKTtcclxuXHRcdHZhciBkID0gcGFyc2VJbnQoc3NbMl0sMTApO1xyXG5cdFx0aWYgKCFpc05hTih5KSAmJiAhaXNOYU4obSkgJiYgIWlzTmFOKGQpKXtcclxuXHRcdFx0cmV0dXJuIG5ldyBEYXRlKHksbS0xLGQpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0cmV0dXJuIG5ldyBEYXRlKCk7XHJcblx0XHR9XHJcblx0fTtcclxufVxyXG5pZiAoJC5mbi5kYXRldGltZWJveCAmJiAkLmZuLmRhdGVib3gpe1xyXG5cdCQuZXh0ZW5kKCQuZm4uZGF0ZXRpbWVib3guZGVmYXVsdHMse1xyXG5cdFx0Y3VycmVudFRleHQ6ICQuZm4uZGF0ZWJveC5kZWZhdWx0cy5jdXJyZW50VGV4dCxcclxuXHRcdGNsb3NlVGV4dDogJC5mbi5kYXRlYm94LmRlZmF1bHRzLmNsb3NlVGV4dCxcclxuXHRcdG9rVGV4dDogJC5mbi5kYXRlYm94LmRlZmF1bHRzLm9rVGV4dFxyXG5cdH0pO1xyXG59XHJcbmlmICgkLmZuLmRhdGV0aW1lc3Bpbm5lcil7XHJcblx0JC5mbi5kYXRldGltZXNwaW5uZXIuZGVmYXVsdHMuc2VsZWN0aW9ucyA9IFtbMCw0XSxbNSw3XSxbOCwxMF0sWzExLDEzXSxbMTQsMTZdLFsxNywxOV1dXHJcbn1cclxuIl0sImZpbGUiOiJwbHVnaW5zL2Vhc3l1aS1sYW5nLXpoX0NOLmpzIn0=
