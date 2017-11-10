if(jQuery){(function(){$.extend($.fn,{contextMenu:function(a,b){if(a.menu==undefined){return false}if(a.inSpeed==undefined){a.inSpeed=150}if(a.outSpeed==undefined){a.outSpeed=75}if(a.inSpeed==0){a.inSpeed=-1}if(a.outSpeed==0){a.outSpeed=-1}$(this).each(function(){var c=$(this);var d=$(c).offset();$("#"+a.menu).addClass("contextMenu");$(this).mousedown(function(g){var f=g;$(this).mouseup(function(l){var i=$(this);$(this).unbind("mouseup");if(f.button==2){if(a.onPopup!=null){a.onPopup($(i))}$(".contextMenu").hide();var n=$("#"+a.menu);if($(c).hasClass("disabled")){return false}var m={},h,o;if(self.innerHeight){m.pageYOffset=self.pageYOffset;m.pageXOffset=self.pageXOffset;m.innerHeight=self.innerHeight;m.innerWidth=self.innerWidth}else{if(document.documentElement&&document.documentElement.clientHeight){m.pageYOffset=document.documentElement.scrollTop;m.pageXOffset=document.documentElement.scrollLeft;m.innerHeight=document.documentElement.clientHeight;m.innerWidth=document.documentElement.clientWidth}else{if(document.body){m.pageYOffset=document.body.scrollTop;m.pageXOffset=document.body.scrollLeft;m.innerHeight=document.body.clientHeight;m.innerWidth=document.body.clientWidth}}}(l.pageX)?h=l.pageX:h=l.clientX+m.scrollLeft;(l.pageY)?o=l.pageY:h=l.clientY+m.scrollTop;$(document).unbind("click");function k(q){var p=q.offsetLeft,r=q.offsetTop;while(q=q.offsetParent){p+=q.offsetLeft;r+=q.offsetTop}return{x:p,y:r}}var j=k($(n).parent()[0]);o=a.offset?o-j.y:o;$(n).css({top:o,left:h-j.x}).fadeIn(a.inSpeed);$(n).find("span[action]").mouseover(function(){$(n).find("LI.hover").removeClass("hover");$(this).parent().addClass("hover")}).mouseout(function(){$(n).find("LI.hover").removeClass("hover")});$(document).keypress(function(p){switch(p.keyCode){case 38:if($(n).find("LI.hover").size()==0){$(n).find("LI:last").addClass("hover")}else{$(n).find("LI.hover").removeClass("hover").prevAll("LI:not(.disabled)").eq(0).addClass("hover");if($(n).find("LI.hover").size()==0){$(n).find("LI:last").addClass("hover")}}break;case 40:if($(n).find("LI.hover").size()==0){$(n).find("LI:first").addClass("hover")}else{$(n).find("LI.hover").removeClass("hover").nextAll("LI:not(.disabled)").eq(0).addClass("hover");if($(n).find("LI.hover").size()==0){$(n).find("LI:first").addClass("hover")}}break;case 13:$(n).find("LI.hover span[action]").trigger("click");break;case 27:$(document).trigger("click");break}});$("#"+a.menu).find("LI[action]").unbind("click");$("#"+a.menu).find("LI:not(.disabled)[action]").click(function(){$(document).unbind("click").unbind("keypress");$(".contextMenu").hide();if(b){b($(this).attr("action"),$(i),{x:h-d.left,y:o-d.top,docX:h,docY:o})}return false});setTimeout(function(){$(document).click(function(){$(document).unbind("click").unbind("keypress");$(n).fadeOut(a.outSpeed);return false})},0)}})});if($.browser.mozilla){$("#"+a.menu).each(function(){$(this).css({MozUserSelect:"none"})})}else{if($.browser.msie){$("#"+a.menu).each(function(){$(this).bind("selectstart.disableTextSelect",function(){return false})})}else{$("#"+a.menu).each(function(){$(this).bind("mousedown.disableTextSelect",function(){return false})})}}$(c).add("UL.contextMenu").bind("contextmenu",function(){return false})});return $(this)},disableContextMenuItems:function(a){if(a==undefined){$(this).find("LI").addClass("disabled");return($(this))}$(this).each(function(){if(a!=undefined){var c=a.split(",");for(var b=0;b<c.length;b++){$(this).find('LI[action="'+c[b]+'"]').addClass("disabled")}}});return($(this))},enableContextMenuItems:function(a){if(a==undefined){$(this).find("LI.disabled").removeClass("disabled");return($(this))}$(this).each(function(){if(a!=undefined){var c=a.split(",");for(var b=0;b<c.length;b++){$(this).find('span[action="'+c[b]+'"]').parent().removeClass("disabled")}}});return($(this))},disableContextMenu:function(){$(this).each(function(){$(this).addClass("disabled")});return($(this))},enableContextMenu:function(){$(this).each(function(){$(this).removeClass("disabled")});return($(this))},destroyContextMenu:function(){$(this).each(function(){$(this).unbind("mousedown").unbind("mouseup")});return($(this))}})})(jQuery)};