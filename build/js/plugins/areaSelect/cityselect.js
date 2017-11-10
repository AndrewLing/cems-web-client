/**
 * Ajax 三级省市联动
 * settings 参数说明 ----- url:省市数据josn文件路径 prov:默认省份 city:默认城市 dist:默认地区（县）
 * nodata:无数据状态 required:必选项
 * 2017/01/17
 */
(function($){
	$.fn.citySelect=function(settings){
		if(this.length<1){return;};

		// 默认值
		settings=$.extend({
			url:"/js/plugins/areaSelect/city.min.json",
			prov:null,
			city:null,
			dist:null,
			nodata:null,
			required:true
		},settings);
		var box_obj=this;
		var prov_obj=box_obj.find(".prov");
		var city_obj=box_obj.find(".city");
		var dist_obj=box_obj.find(".dist");
		var prov_val=settings.prov;
		var city_val=settings.city;
		var dist_val=settings.dist;
		var select_prehtml=(settings.required) ? "" : "<option value=''>请选择</option>";
		var city_json;

		// 赋值市级函数
		var cityStart=function(){
			var prov_id=prov_obj.get(0).selectedIndex;
			if(!settings.required){
				prov_id--;
			};
			city_obj.empty().attr("disabled",true);
			dist_obj.empty().attr("disabled",true);

			if(prov_id<0||typeof(city_json.citylist[prov_id].c)=="undefined"){
				if(settings.nodata=="none"){
					city_obj.css("display","none");
					dist_obj.css("display","none");
				}else if(settings.nodata=="hidden"){
					city_obj.css("visibility","hidden");
					dist_obj.css("visibility","hidden");
				};
				return;
			};
			
			// 遍历赋值市级下拉列表
			temp_html=select_prehtml;
			$.each(city_json.citylist[prov_id].c,function(i,city){
				temp_html+="<option value='"+city.n+"'>"+city.n+"</option>";
			});
			city_obj.html(temp_html).attr("disabled",false).css({"display":"","visibility":""});
			distStart();
		};

		// 赋值地区（县）函数
		var distStart=function(){
			var prov_id=prov_obj.get(0).selectedIndex;
			var city_id=city_obj.get(0).selectedIndex;
			if(!settings.required){
				prov_id--;
				city_id--;
			};
			dist_obj.empty().attr("disabled",true);

			if(prov_id<0||city_id<0||typeof(city_json.citylist[prov_id].c[city_id].a)=="undefined"){
				if(settings.nodata=="none"){
					dist_obj.css("display","none");
				}else if(settings.nodata=="hidden"){
					dist_obj.css("visibility","hidden");
				};
				return;
			};
			
			// 遍历赋值市级下拉列表
			temp_html=select_prehtml;
			$.each(city_json.citylist[prov_id].c[city_id].a,function(i,dist){
				temp_html+="<option value='"+dist.s+"'>"+dist.s+"</option>";
			});
			dist_obj.html(temp_html).attr("disabled",false).css({"display":"","visibility":""});
		};

		var init=function(){
			// 遍历赋值省份下拉列表
			temp_html=select_prehtml;
			$.each(city_json.citylist,function(i,prov){
				temp_html+="<option value='"+prov.p+"'>"+prov.p+"</option>";
			});
			prov_obj.html(temp_html);

			// 若有传入省份与市级的值，则选中。（setTimeout为兼容IE6而设置）
			setTimeout(function(){
				if(settings.prov!=null){
					prov_obj.val(settings.prov);
					cityStart();
					setTimeout(function(){
						if(settings.city!=null){
							city_obj.val(settings.city);
							distStart();
							setTimeout(function(){
								if(settings.dist!=null){
									dist_obj.val(settings.dist);
								};
							},1);
						};
					},1);
				};
			},1);

			// 选择省份时发生事件
			prov_obj.bind("change",function(){
				cityStart();
			});

			// 选择市级时发生事件
			city_obj.bind("change",function(){
				distStart();
			});
		};

		// 设置省市json数据
		if(typeof(settings.url)=="string"){
			$.getJSON(settings.url,function(json){
				city_json=json;
				init();
			});
		}else{
			city_json=settings.url;
			init();
		};
	};
})(jQuery);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL2FyZWFTZWxlY3QvY2l0eXNlbGVjdC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQWpheCDkuInnuqfnnIHluILogZTliqhcclxuICogc2V0dGluZ3Mg5Y+C5pWw6K+05piOIC0tLS0tIHVybDrnnIHluILmlbDmja5qb3Nu5paH5Lu26Lev5b6EIHByb3Y66buY6K6k55yB5Lu9IGNpdHk66buY6K6k5Z+O5biCIGRpc3Q66buY6K6k5Zyw5Yy677yI5Y6/77yJXHJcbiAqIG5vZGF0YTrml6DmlbDmja7nirbmgIEgcmVxdWlyZWQ65b+F6YCJ6aG5XHJcbiAqIDIwMTcvMDEvMTdcclxuICovXHJcbihmdW5jdGlvbigkKXtcclxuXHQkLmZuLmNpdHlTZWxlY3Q9ZnVuY3Rpb24oc2V0dGluZ3Mpe1xyXG5cdFx0aWYodGhpcy5sZW5ndGg8MSl7cmV0dXJuO307XHJcblxyXG5cdFx0Ly8g6buY6K6k5YC8XHJcblx0XHRzZXR0aW5ncz0kLmV4dGVuZCh7XHJcblx0XHRcdHVybDpcIi9qcy9wbHVnaW5zL2FyZWFTZWxlY3QvY2l0eS5taW4uanNvblwiLFxyXG5cdFx0XHRwcm92Om51bGwsXHJcblx0XHRcdGNpdHk6bnVsbCxcclxuXHRcdFx0ZGlzdDpudWxsLFxyXG5cdFx0XHRub2RhdGE6bnVsbCxcclxuXHRcdFx0cmVxdWlyZWQ6dHJ1ZVxyXG5cdFx0fSxzZXR0aW5ncyk7XHJcblx0XHR2YXIgYm94X29iaj10aGlzO1xyXG5cdFx0dmFyIHByb3Zfb2JqPWJveF9vYmouZmluZChcIi5wcm92XCIpO1xyXG5cdFx0dmFyIGNpdHlfb2JqPWJveF9vYmouZmluZChcIi5jaXR5XCIpO1xyXG5cdFx0dmFyIGRpc3Rfb2JqPWJveF9vYmouZmluZChcIi5kaXN0XCIpO1xyXG5cdFx0dmFyIHByb3ZfdmFsPXNldHRpbmdzLnByb3Y7XHJcblx0XHR2YXIgY2l0eV92YWw9c2V0dGluZ3MuY2l0eTtcclxuXHRcdHZhciBkaXN0X3ZhbD1zZXR0aW5ncy5kaXN0O1xyXG5cdFx0dmFyIHNlbGVjdF9wcmVodG1sPShzZXR0aW5ncy5yZXF1aXJlZCkgPyBcIlwiIDogXCI8b3B0aW9uIHZhbHVlPScnPuivt+mAieaLqTwvb3B0aW9uPlwiO1xyXG5cdFx0dmFyIGNpdHlfanNvbjtcclxuXHJcblx0XHQvLyDotYvlgLzluILnuqflh73mlbBcclxuXHRcdHZhciBjaXR5U3RhcnQ9ZnVuY3Rpb24oKXtcclxuXHRcdFx0dmFyIHByb3ZfaWQ9cHJvdl9vYmouZ2V0KDApLnNlbGVjdGVkSW5kZXg7XHJcblx0XHRcdGlmKCFzZXR0aW5ncy5yZXF1aXJlZCl7XHJcblx0XHRcdFx0cHJvdl9pZC0tO1xyXG5cdFx0XHR9O1xyXG5cdFx0XHRjaXR5X29iai5lbXB0eSgpLmF0dHIoXCJkaXNhYmxlZFwiLHRydWUpO1xyXG5cdFx0XHRkaXN0X29iai5lbXB0eSgpLmF0dHIoXCJkaXNhYmxlZFwiLHRydWUpO1xyXG5cclxuXHRcdFx0aWYocHJvdl9pZDwwfHx0eXBlb2YoY2l0eV9qc29uLmNpdHlsaXN0W3Byb3ZfaWRdLmMpPT1cInVuZGVmaW5lZFwiKXtcclxuXHRcdFx0XHRpZihzZXR0aW5ncy5ub2RhdGE9PVwibm9uZVwiKXtcclxuXHRcdFx0XHRcdGNpdHlfb2JqLmNzcyhcImRpc3BsYXlcIixcIm5vbmVcIik7XHJcblx0XHRcdFx0XHRkaXN0X29iai5jc3MoXCJkaXNwbGF5XCIsXCJub25lXCIpO1xyXG5cdFx0XHRcdH1lbHNlIGlmKHNldHRpbmdzLm5vZGF0YT09XCJoaWRkZW5cIil7XHJcblx0XHRcdFx0XHRjaXR5X29iai5jc3MoXCJ2aXNpYmlsaXR5XCIsXCJoaWRkZW5cIik7XHJcblx0XHRcdFx0XHRkaXN0X29iai5jc3MoXCJ2aXNpYmlsaXR5XCIsXCJoaWRkZW5cIik7XHJcblx0XHRcdFx0fTtcclxuXHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdH07XHJcblx0XHRcdFxyXG5cdFx0XHQvLyDpgY3ljobotYvlgLzluILnuqfkuIvmi4nliJfooahcclxuXHRcdFx0dGVtcF9odG1sPXNlbGVjdF9wcmVodG1sO1xyXG5cdFx0XHQkLmVhY2goY2l0eV9qc29uLmNpdHlsaXN0W3Byb3ZfaWRdLmMsZnVuY3Rpb24oaSxjaXR5KXtcclxuXHRcdFx0XHR0ZW1wX2h0bWwrPVwiPG9wdGlvbiB2YWx1ZT0nXCIrY2l0eS5uK1wiJz5cIitjaXR5Lm4rXCI8L29wdGlvbj5cIjtcclxuXHRcdFx0fSk7XHJcblx0XHRcdGNpdHlfb2JqLmh0bWwodGVtcF9odG1sKS5hdHRyKFwiZGlzYWJsZWRcIixmYWxzZSkuY3NzKHtcImRpc3BsYXlcIjpcIlwiLFwidmlzaWJpbGl0eVwiOlwiXCJ9KTtcclxuXHRcdFx0ZGlzdFN0YXJ0KCk7XHJcblx0XHR9O1xyXG5cclxuXHRcdC8vIOi1i+WAvOWcsOWMuu+8iOWOv++8ieWHveaVsFxyXG5cdFx0dmFyIGRpc3RTdGFydD1mdW5jdGlvbigpe1xyXG5cdFx0XHR2YXIgcHJvdl9pZD1wcm92X29iai5nZXQoMCkuc2VsZWN0ZWRJbmRleDtcclxuXHRcdFx0dmFyIGNpdHlfaWQ9Y2l0eV9vYmouZ2V0KDApLnNlbGVjdGVkSW5kZXg7XHJcblx0XHRcdGlmKCFzZXR0aW5ncy5yZXF1aXJlZCl7XHJcblx0XHRcdFx0cHJvdl9pZC0tO1xyXG5cdFx0XHRcdGNpdHlfaWQtLTtcclxuXHRcdFx0fTtcclxuXHRcdFx0ZGlzdF9vYmouZW1wdHkoKS5hdHRyKFwiZGlzYWJsZWRcIix0cnVlKTtcclxuXHJcblx0XHRcdGlmKHByb3ZfaWQ8MHx8Y2l0eV9pZDwwfHx0eXBlb2YoY2l0eV9qc29uLmNpdHlsaXN0W3Byb3ZfaWRdLmNbY2l0eV9pZF0uYSk9PVwidW5kZWZpbmVkXCIpe1xyXG5cdFx0XHRcdGlmKHNldHRpbmdzLm5vZGF0YT09XCJub25lXCIpe1xyXG5cdFx0XHRcdFx0ZGlzdF9vYmouY3NzKFwiZGlzcGxheVwiLFwibm9uZVwiKTtcclxuXHRcdFx0XHR9ZWxzZSBpZihzZXR0aW5ncy5ub2RhdGE9PVwiaGlkZGVuXCIpe1xyXG5cdFx0XHRcdFx0ZGlzdF9vYmouY3NzKFwidmlzaWJpbGl0eVwiLFwiaGlkZGVuXCIpO1xyXG5cdFx0XHRcdH07XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9O1xyXG5cdFx0XHRcclxuXHRcdFx0Ly8g6YGN5Y6G6LWL5YC85biC57qn5LiL5ouJ5YiX6KGoXHJcblx0XHRcdHRlbXBfaHRtbD1zZWxlY3RfcHJlaHRtbDtcclxuXHRcdFx0JC5lYWNoKGNpdHlfanNvbi5jaXR5bGlzdFtwcm92X2lkXS5jW2NpdHlfaWRdLmEsZnVuY3Rpb24oaSxkaXN0KXtcclxuXHRcdFx0XHR0ZW1wX2h0bWwrPVwiPG9wdGlvbiB2YWx1ZT0nXCIrZGlzdC5zK1wiJz5cIitkaXN0LnMrXCI8L29wdGlvbj5cIjtcclxuXHRcdFx0fSk7XHJcblx0XHRcdGRpc3Rfb2JqLmh0bWwodGVtcF9odG1sKS5hdHRyKFwiZGlzYWJsZWRcIixmYWxzZSkuY3NzKHtcImRpc3BsYXlcIjpcIlwiLFwidmlzaWJpbGl0eVwiOlwiXCJ9KTtcclxuXHRcdH07XHJcblxyXG5cdFx0dmFyIGluaXQ9ZnVuY3Rpb24oKXtcclxuXHRcdFx0Ly8g6YGN5Y6G6LWL5YC855yB5Lu95LiL5ouJ5YiX6KGoXHJcblx0XHRcdHRlbXBfaHRtbD1zZWxlY3RfcHJlaHRtbDtcclxuXHRcdFx0JC5lYWNoKGNpdHlfanNvbi5jaXR5bGlzdCxmdW5jdGlvbihpLHByb3Ype1xyXG5cdFx0XHRcdHRlbXBfaHRtbCs9XCI8b3B0aW9uIHZhbHVlPSdcIitwcm92LnArXCInPlwiK3Byb3YucCtcIjwvb3B0aW9uPlwiO1xyXG5cdFx0XHR9KTtcclxuXHRcdFx0cHJvdl9vYmouaHRtbCh0ZW1wX2h0bWwpO1xyXG5cclxuXHRcdFx0Ly8g6Iul5pyJ5Lyg5YWl55yB5Lu95LiO5biC57qn55qE5YC877yM5YiZ6YCJ5Lit44CC77yIc2V0VGltZW91dOS4uuWFvOWuuUlFNuiAjOiuvue9ru+8iVxyXG5cdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0aWYoc2V0dGluZ3MucHJvdiE9bnVsbCl7XHJcblx0XHRcdFx0XHRwcm92X29iai52YWwoc2V0dGluZ3MucHJvdik7XHJcblx0XHRcdFx0XHRjaXR5U3RhcnQoKTtcclxuXHRcdFx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRcdFx0aWYoc2V0dGluZ3MuY2l0eSE9bnVsbCl7XHJcblx0XHRcdFx0XHRcdFx0Y2l0eV9vYmoudmFsKHNldHRpbmdzLmNpdHkpO1xyXG5cdFx0XHRcdFx0XHRcdGRpc3RTdGFydCgpO1xyXG5cdFx0XHRcdFx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRcdFx0XHRcdGlmKHNldHRpbmdzLmRpc3QhPW51bGwpe1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRkaXN0X29iai52YWwoc2V0dGluZ3MuZGlzdCk7XHJcblx0XHRcdFx0XHRcdFx0XHR9O1xyXG5cdFx0XHRcdFx0XHRcdH0sMSk7XHJcblx0XHRcdFx0XHRcdH07XHJcblx0XHRcdFx0XHR9LDEpO1xyXG5cdFx0XHRcdH07XHJcblx0XHRcdH0sMSk7XHJcblxyXG5cdFx0XHQvLyDpgInmi6nnnIHku73ml7blj5HnlJ/kuovku7ZcclxuXHRcdFx0cHJvdl9vYmouYmluZChcImNoYW5nZVwiLGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0Y2l0eVN0YXJ0KCk7XHJcblx0XHRcdH0pO1xyXG5cclxuXHRcdFx0Ly8g6YCJ5oup5biC57qn5pe25Y+R55Sf5LqL5Lu2XHJcblx0XHRcdGNpdHlfb2JqLmJpbmQoXCJjaGFuZ2VcIixmdW5jdGlvbigpe1xyXG5cdFx0XHRcdGRpc3RTdGFydCgpO1xyXG5cdFx0XHR9KTtcclxuXHRcdH07XHJcblxyXG5cdFx0Ly8g6K6+572u55yB5biCanNvbuaVsOaNrlxyXG5cdFx0aWYodHlwZW9mKHNldHRpbmdzLnVybCk9PVwic3RyaW5nXCIpe1xyXG5cdFx0XHQkLmdldEpTT04oc2V0dGluZ3MudXJsLGZ1bmN0aW9uKGpzb24pe1xyXG5cdFx0XHRcdGNpdHlfanNvbj1qc29uO1xyXG5cdFx0XHRcdGluaXQoKTtcclxuXHRcdFx0fSk7XHJcblx0XHR9ZWxzZXtcclxuXHRcdFx0Y2l0eV9qc29uPXNldHRpbmdzLnVybDtcclxuXHRcdFx0aW5pdCgpO1xyXG5cdFx0fTtcclxuXHR9O1xyXG59KShqUXVlcnkpOyJdLCJmaWxlIjoicGx1Z2lucy9hcmVhU2VsZWN0L2NpdHlzZWxlY3QuanMifQ==
