/**
 * Created by JetBrains PhpStorm.
 * User: taoqili
 * Date: 12-1-30
 * Time: 下午12:50
 * To change this template use File | Settings | File Templates.
 */



var wordImage = {};
//(function(){
var g = baidu.g,
	flashObj,flashContainer;

wordImage.init = function(opt, callbacks) {
	showLocalPath("localPath");
	//createCopyButton("clipboard","localPath");
	createFlashUploader(opt, callbacks);
	addUploadListener();
	addOkListener();
};

function hideFlash(){
    flashObj = null;
    flashContainer.innerHTML = "";
}
function addOkListener() {
	dialog.onok = function() {
		if (!imageUrls.length) return;
		var urlPrefix = editor.getOpt('imageUrlPrefix'),
            images = domUtils.getElementsByTagName(editor.document,"img");
        editor.fireEvent('saveScene');
		for (var i = 0,img; img = images[i++];) {
			var src = img.getAttribute("word_img");
			if (!src) continue;
			for (var j = 0,url; url = imageUrls[j++];) {
				if (src.indexOf(url.original.replace(" ","")) != -1) {
					img.src = urlPrefix + url.url;
					img.setAttribute("_src", urlPrefix + url.url);  //同时修改"_src"属性
					img.setAttribute("title",url.title);
                    domUtils.removeAttributes(img, ["word_img","style","width","height"]);
					editor.fireEvent("selectionchange");
					break;
				}
			}
		}
        editor.fireEvent('saveScene');
        hideFlash();
	};
    dialog.oncancel = function(){
        hideFlash();
    }
}

/**
 * 绑定开始上传事件
 */
function addUploadListener() {
	g("upload").onclick = function () {
		flashObj.upload();
		this.style.display = "none";
	};
}

function showLocalPath(id) {
    //单张编辑
    var img = editor.selection.getRange().getClosedNode();
    var images = editor.execCommand('wordimage');
    if(images.length==1 || img && img.tagName == 'IMG'){
        g(id).value = images[0];
        return;
    }
	var path = images[0];
    var leftSlashIndex  = path.lastIndexOf("/")||0,  //不同版本的doc和浏览器都可能影响到这个符号，故直接判断两种
        rightSlashIndex = path.lastIndexOf("\\")||0,
        separater = leftSlashIndex > rightSlashIndex ? "/":"\\" ;

	path = path.substring(0, path.lastIndexOf(separater)+1);
	g(id).value = path;
}

function createFlashUploader(opt, callbacks) {
    //由于lang.flashI18n是静态属性，不可以直接进行修改，否则会影响到后续内容
    var i18n = utils.extend({},lang.flashI18n);
    //处理图片资源地址的编码，补全等问题
    for(var i in i18n){
        if(!(i in {"lang":1,"uploadingTF":1,"imageTF":1,"textEncoding":1}) && i18n[i]){
            i18n[i] = encodeURIComponent(editor.options.langPath + editor.options.lang + "/images/" + i18n[i]);
        }
    }
    opt = utils.extend(opt,i18n,false);
	var option = {
		createOptions:{
			id:'flash',
			url:opt.flashUrl,
			width:opt.width,
			height:opt.height,
			errorMessage:lang.flashError,
			wmode:browser.safari ? 'transparent' : 'window',
			ver:'10.0.0',
			vars:opt,
			container:opt.container
		}
	};

	option = extendProperty(callbacks, option);
	flashObj = new baidu.flash.imageUploader(option);
    flashContainer = $G(opt.container);
}

function extendProperty(fromObj, toObj) {
	for (var i in fromObj) {
		if (!toObj[i]) {
			toObj[i] = fromObj[i];
		}
	}
	return toObj;
}

//})();

function getPasteData(id) {
	baidu.g("msg").innerHTML = lang.copySuccess + "</br>";
	setTimeout(function() {
		baidu.g("msg").innerHTML = "";
	}, 5000);
	return baidu.g(id).value;
}

function createCopyButton(id, dataFrom) {
	baidu.swf.create({
			id:"copyFlash",
			url:"fClipboard_ueditor.swf",
			width:"58",
			height:"25",
			errorMessage:"",
			bgColor:"#CBCBCB",
			wmode:"transparent",
			ver:"10.0.0",
			vars:{
				tid:dataFrom
			}
		}, id
	);

	var clipboard = baidu.swf.getMovie("copyFlash");
	var clipinterval = setInterval(function() {
		if (clipboard && clipboard.flashInit) {
			clearInterval(clipinterval);
			clipboard.setHandCursor(true);
			clipboard.setContentFuncName("getPasteData");
			//clipboard.setMEFuncName("mouseEventHandler");
		}
	}, 500);
}
createCopyButton("clipboard", "localPath");
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvZGlhbG9ncy93b3JkaW1hZ2Uvd29yZGltYWdlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IEpldEJyYWlucyBQaHBTdG9ybS5cclxuICogVXNlcjogdGFvcWlsaVxyXG4gKiBEYXRlOiAxMi0xLTMwXHJcbiAqIFRpbWU6IOS4i+WNiDEyOjUwXHJcbiAqIFRvIGNoYW5nZSB0aGlzIHRlbXBsYXRlIHVzZSBGaWxlIHwgU2V0dGluZ3MgfCBGaWxlIFRlbXBsYXRlcy5cclxuICovXHJcblxyXG5cclxuXHJcbnZhciB3b3JkSW1hZ2UgPSB7fTtcclxuLy8oZnVuY3Rpb24oKXtcclxudmFyIGcgPSBiYWlkdS5nLFxyXG5cdGZsYXNoT2JqLGZsYXNoQ29udGFpbmVyO1xyXG5cclxud29yZEltYWdlLmluaXQgPSBmdW5jdGlvbihvcHQsIGNhbGxiYWNrcykge1xyXG5cdHNob3dMb2NhbFBhdGgoXCJsb2NhbFBhdGhcIik7XHJcblx0Ly9jcmVhdGVDb3B5QnV0dG9uKFwiY2xpcGJvYXJkXCIsXCJsb2NhbFBhdGhcIik7XHJcblx0Y3JlYXRlRmxhc2hVcGxvYWRlcihvcHQsIGNhbGxiYWNrcyk7XHJcblx0YWRkVXBsb2FkTGlzdGVuZXIoKTtcclxuXHRhZGRPa0xpc3RlbmVyKCk7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBoaWRlRmxhc2goKXtcclxuICAgIGZsYXNoT2JqID0gbnVsbDtcclxuICAgIGZsYXNoQ29udGFpbmVyLmlubmVySFRNTCA9IFwiXCI7XHJcbn1cclxuZnVuY3Rpb24gYWRkT2tMaXN0ZW5lcigpIHtcclxuXHRkaWFsb2cub25vayA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0aWYgKCFpbWFnZVVybHMubGVuZ3RoKSByZXR1cm47XHJcblx0XHR2YXIgdXJsUHJlZml4ID0gZWRpdG9yLmdldE9wdCgnaW1hZ2VVcmxQcmVmaXgnKSxcclxuICAgICAgICAgICAgaW1hZ2VzID0gZG9tVXRpbHMuZ2V0RWxlbWVudHNCeVRhZ05hbWUoZWRpdG9yLmRvY3VtZW50LFwiaW1nXCIpO1xyXG4gICAgICAgIGVkaXRvci5maXJlRXZlbnQoJ3NhdmVTY2VuZScpO1xyXG5cdFx0Zm9yICh2YXIgaSA9IDAsaW1nOyBpbWcgPSBpbWFnZXNbaSsrXTspIHtcclxuXHRcdFx0dmFyIHNyYyA9IGltZy5nZXRBdHRyaWJ1dGUoXCJ3b3JkX2ltZ1wiKTtcclxuXHRcdFx0aWYgKCFzcmMpIGNvbnRpbnVlO1xyXG5cdFx0XHRmb3IgKHZhciBqID0gMCx1cmw7IHVybCA9IGltYWdlVXJsc1tqKytdOykge1xyXG5cdFx0XHRcdGlmIChzcmMuaW5kZXhPZih1cmwub3JpZ2luYWwucmVwbGFjZShcIiBcIixcIlwiKSkgIT0gLTEpIHtcclxuXHRcdFx0XHRcdGltZy5zcmMgPSB1cmxQcmVmaXggKyB1cmwudXJsO1xyXG5cdFx0XHRcdFx0aW1nLnNldEF0dHJpYnV0ZShcIl9zcmNcIiwgdXJsUHJlZml4ICsgdXJsLnVybCk7ICAvL+WQjOaXtuS/ruaUuVwiX3NyY1wi5bGe5oCnXHJcblx0XHRcdFx0XHRpbWcuc2V0QXR0cmlidXRlKFwidGl0bGVcIix1cmwudGl0bGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGRvbVV0aWxzLnJlbW92ZUF0dHJpYnV0ZXMoaW1nLCBbXCJ3b3JkX2ltZ1wiLFwic3R5bGVcIixcIndpZHRoXCIsXCJoZWlnaHRcIl0pO1xyXG5cdFx0XHRcdFx0ZWRpdG9yLmZpcmVFdmVudChcInNlbGVjdGlvbmNoYW5nZVwiKTtcclxuXHRcdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG4gICAgICAgIGVkaXRvci5maXJlRXZlbnQoJ3NhdmVTY2VuZScpO1xyXG4gICAgICAgIGhpZGVGbGFzaCgpO1xyXG5cdH07XHJcbiAgICBkaWFsb2cub25jYW5jZWwgPSBmdW5jdGlvbigpe1xyXG4gICAgICAgIGhpZGVGbGFzaCgpO1xyXG4gICAgfVxyXG59XHJcblxyXG4vKipcclxuICog57uR5a6a5byA5aeL5LiK5Lyg5LqL5Lu2XHJcbiAqL1xyXG5mdW5jdGlvbiBhZGRVcGxvYWRMaXN0ZW5lcigpIHtcclxuXHRnKFwidXBsb2FkXCIpLm9uY2xpY2sgPSBmdW5jdGlvbiAoKSB7XHJcblx0XHRmbGFzaE9iai51cGxvYWQoKTtcclxuXHRcdHRoaXMuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG5cdH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNob3dMb2NhbFBhdGgoaWQpIHtcclxuICAgIC8v5Y2V5byg57yW6L6RXHJcbiAgICB2YXIgaW1nID0gZWRpdG9yLnNlbGVjdGlvbi5nZXRSYW5nZSgpLmdldENsb3NlZE5vZGUoKTtcclxuICAgIHZhciBpbWFnZXMgPSBlZGl0b3IuZXhlY0NvbW1hbmQoJ3dvcmRpbWFnZScpO1xyXG4gICAgaWYoaW1hZ2VzLmxlbmd0aD09MSB8fCBpbWcgJiYgaW1nLnRhZ05hbWUgPT0gJ0lNRycpe1xyXG4gICAgICAgIGcoaWQpLnZhbHVlID0gaW1hZ2VzWzBdO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHR2YXIgcGF0aCA9IGltYWdlc1swXTtcclxuICAgIHZhciBsZWZ0U2xhc2hJbmRleCAgPSBwYXRoLmxhc3RJbmRleE9mKFwiL1wiKXx8MCwgIC8v5LiN5ZCM54mI5pys55qEZG9j5ZKM5rWP6KeI5Zmo6YO95Y+v6IO95b2x5ZON5Yiw6L+Z5Liq56ym5Y+377yM5pWF55u05o6l5Yik5pat5Lik56eNXHJcbiAgICAgICAgcmlnaHRTbGFzaEluZGV4ID0gcGF0aC5sYXN0SW5kZXhPZihcIlxcXFxcIil8fDAsXHJcbiAgICAgICAgc2VwYXJhdGVyID0gbGVmdFNsYXNoSW5kZXggPiByaWdodFNsYXNoSW5kZXggPyBcIi9cIjpcIlxcXFxcIiA7XHJcblxyXG5cdHBhdGggPSBwYXRoLnN1YnN0cmluZygwLCBwYXRoLmxhc3RJbmRleE9mKHNlcGFyYXRlcikrMSk7XHJcblx0ZyhpZCkudmFsdWUgPSBwYXRoO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVGbGFzaFVwbG9hZGVyKG9wdCwgY2FsbGJhY2tzKSB7XHJcbiAgICAvL+eUseS6jmxhbmcuZmxhc2hJMThu5piv6Z2Z5oCB5bGe5oCn77yM5LiN5Y+v5Lul55u05o6l6L+b6KGM5L+u5pS577yM5ZCm5YiZ5Lya5b2x5ZON5Yiw5ZCO57ut5YaF5a65XHJcbiAgICB2YXIgaTE4biA9IHV0aWxzLmV4dGVuZCh7fSxsYW5nLmZsYXNoSTE4bik7XHJcbiAgICAvL+WkhOeQhuWbvueJh+i1hOa6kOWcsOWdgOeahOe8luegge+8jOihpeWFqOetiemXrumimFxyXG4gICAgZm9yKHZhciBpIGluIGkxOG4pe1xyXG4gICAgICAgIGlmKCEoaSBpbiB7XCJsYW5nXCI6MSxcInVwbG9hZGluZ1RGXCI6MSxcImltYWdlVEZcIjoxLFwidGV4dEVuY29kaW5nXCI6MX0pICYmIGkxOG5baV0pe1xyXG4gICAgICAgICAgICBpMThuW2ldID0gZW5jb2RlVVJJQ29tcG9uZW50KGVkaXRvci5vcHRpb25zLmxhbmdQYXRoICsgZWRpdG9yLm9wdGlvbnMubGFuZyArIFwiL2ltYWdlcy9cIiArIGkxOG5baV0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIG9wdCA9IHV0aWxzLmV4dGVuZChvcHQsaTE4bixmYWxzZSk7XHJcblx0dmFyIG9wdGlvbiA9IHtcclxuXHRcdGNyZWF0ZU9wdGlvbnM6e1xyXG5cdFx0XHRpZDonZmxhc2gnLFxyXG5cdFx0XHR1cmw6b3B0LmZsYXNoVXJsLFxyXG5cdFx0XHR3aWR0aDpvcHQud2lkdGgsXHJcblx0XHRcdGhlaWdodDpvcHQuaGVpZ2h0LFxyXG5cdFx0XHRlcnJvck1lc3NhZ2U6bGFuZy5mbGFzaEVycm9yLFxyXG5cdFx0XHR3bW9kZTpicm93c2VyLnNhZmFyaSA/ICd0cmFuc3BhcmVudCcgOiAnd2luZG93JyxcclxuXHRcdFx0dmVyOicxMC4wLjAnLFxyXG5cdFx0XHR2YXJzOm9wdCxcclxuXHRcdFx0Y29udGFpbmVyOm9wdC5jb250YWluZXJcclxuXHRcdH1cclxuXHR9O1xyXG5cclxuXHRvcHRpb24gPSBleHRlbmRQcm9wZXJ0eShjYWxsYmFja3MsIG9wdGlvbik7XHJcblx0Zmxhc2hPYmogPSBuZXcgYmFpZHUuZmxhc2guaW1hZ2VVcGxvYWRlcihvcHRpb24pO1xyXG4gICAgZmxhc2hDb250YWluZXIgPSAkRyhvcHQuY29udGFpbmVyKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZXh0ZW5kUHJvcGVydHkoZnJvbU9iaiwgdG9PYmopIHtcclxuXHRmb3IgKHZhciBpIGluIGZyb21PYmopIHtcclxuXHRcdGlmICghdG9PYmpbaV0pIHtcclxuXHRcdFx0dG9PYmpbaV0gPSBmcm9tT2JqW2ldO1xyXG5cdFx0fVxyXG5cdH1cclxuXHRyZXR1cm4gdG9PYmo7XHJcbn1cclxuXHJcbi8vfSkoKTtcclxuXHJcbmZ1bmN0aW9uIGdldFBhc3RlRGF0YShpZCkge1xyXG5cdGJhaWR1LmcoXCJtc2dcIikuaW5uZXJIVE1MID0gbGFuZy5jb3B5U3VjY2VzcyArIFwiPC9icj5cIjtcclxuXHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG5cdFx0YmFpZHUuZyhcIm1zZ1wiKS5pbm5lckhUTUwgPSBcIlwiO1xyXG5cdH0sIDUwMDApO1xyXG5cdHJldHVybiBiYWlkdS5nKGlkKS52YWx1ZTtcclxufVxyXG5cclxuZnVuY3Rpb24gY3JlYXRlQ29weUJ1dHRvbihpZCwgZGF0YUZyb20pIHtcclxuXHRiYWlkdS5zd2YuY3JlYXRlKHtcclxuXHRcdFx0aWQ6XCJjb3B5Rmxhc2hcIixcclxuXHRcdFx0dXJsOlwiZkNsaXBib2FyZF91ZWRpdG9yLnN3ZlwiLFxyXG5cdFx0XHR3aWR0aDpcIjU4XCIsXHJcblx0XHRcdGhlaWdodDpcIjI1XCIsXHJcblx0XHRcdGVycm9yTWVzc2FnZTpcIlwiLFxyXG5cdFx0XHRiZ0NvbG9yOlwiI0NCQ0JDQlwiLFxyXG5cdFx0XHR3bW9kZTpcInRyYW5zcGFyZW50XCIsXHJcblx0XHRcdHZlcjpcIjEwLjAuMFwiLFxyXG5cdFx0XHR2YXJzOntcclxuXHRcdFx0XHR0aWQ6ZGF0YUZyb21cclxuXHRcdFx0fVxyXG5cdFx0fSwgaWRcclxuXHQpO1xyXG5cclxuXHR2YXIgY2xpcGJvYXJkID0gYmFpZHUuc3dmLmdldE1vdmllKFwiY29weUZsYXNoXCIpO1xyXG5cdHZhciBjbGlwaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcclxuXHRcdGlmIChjbGlwYm9hcmQgJiYgY2xpcGJvYXJkLmZsYXNoSW5pdCkge1xyXG5cdFx0XHRjbGVhckludGVydmFsKGNsaXBpbnRlcnZhbCk7XHJcblx0XHRcdGNsaXBib2FyZC5zZXRIYW5kQ3Vyc29yKHRydWUpO1xyXG5cdFx0XHRjbGlwYm9hcmQuc2V0Q29udGVudEZ1bmNOYW1lKFwiZ2V0UGFzdGVEYXRhXCIpO1xyXG5cdFx0XHQvL2NsaXBib2FyZC5zZXRNRUZ1bmNOYW1lKFwibW91c2VFdmVudEhhbmRsZXJcIik7XHJcblx0XHR9XHJcblx0fSwgNTAwKTtcclxufVxyXG5jcmVhdGVDb3B5QnV0dG9uKFwiY2xpcGJvYXJkXCIsIFwibG9jYWxQYXRoXCIpOyJdLCJmaWxlIjoicGx1Z2lucy91ZWRpdG9yL2RpYWxvZ3Mvd29yZGltYWdlL3dvcmRpbWFnZS5qcyJ9
