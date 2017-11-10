/*
 * JQuery zTree exHideNodes v3.5.17-beta.2
 * http://zTree.me/
 *
 * Copyright (c) 2010 Hunter.z
 *
 * Licensed same as jquery - MIT License
 * http://www.opensource.org/licenses/mit-license.php
 *
 * email: hunter.z@263.net
 * Date: 2014-05-08
 */
(function(i){i.extend(!0,i.fn.zTree._z,{view:{clearOldFirstNode:function(c,a){for(var b=a.getNextNode();b;){if(b.isFirstNode){b.isFirstNode=!1;d.setNodeLineIcos(c,b);break}if(b.isLastNode)break;b=b.getNextNode()}},clearOldLastNode:function(c,a,b){for(a=a.getPreNode();a;){if(a.isLastNode){a.isLastNode=!1;b&&d.setNodeLineIcos(c,a);break}if(a.isFirstNode)break;a=a.getPreNode()}},makeDOMNodeMainBefore:function(c,a,b){c.push("<li ",b.isHidden?"style='display:none;' ":"","id='",b.tId,"' class='",l.className.LEVEL,
b.level,"' tabindex='0' hidefocus='true' treenode>")},showNode:function(c,a){a.isHidden=!1;f.initShowForExCheck(c,a);j(a,c).show()},showNodes:function(c,a,b){if(a&&a.length!=0){var e={},g,k;for(g=0,k=a.length;g<k;g++){var h=a[g];if(!e[h.parentTId]){var i=h.getParentNode();e[h.parentTId]=i===null?f.getRoot(c):h.getParentNode()}d.showNode(c,h,b)}for(var j in e)a=e[j][c.data.key.children],d.setFirstNodeForShow(c,a),d.setLastNodeForShow(c,a)}},hideNode:function(c,a){a.isHidden=!0;a.isFirstNode=!1;a.isLastNode=
!1;f.initHideForExCheck(c,a);d.cancelPreSelectedNode(c,a);j(a,c).hide()},hideNodes:function(c,a,b){if(a&&a.length!=0){var e={},g,k;for(g=0,k=a.length;g<k;g++){var h=a[g];if((h.isFirstNode||h.isLastNode)&&!e[h.parentTId]){var i=h.getParentNode();e[h.parentTId]=i===null?f.getRoot(c):h.getParentNode()}d.hideNode(c,h,b)}for(var j in e)a=e[j][c.data.key.children],d.setFirstNodeForHide(c,a),d.setLastNodeForHide(c,a)}},setFirstNode:function(c,a){var b=c.data.key.children,e=a[b].length;e>0&&!a[b][0].isHidden?
a[b][0].isFirstNode=!0:e>0&&d.setFirstNodeForHide(c,a[b])},setLastNode:function(c,a){var b=c.data.key.children,e=a[b].length;e>0&&!a[b][0].isHidden?a[b][e-1].isLastNode=!0:e>0&&d.setLastNodeForHide(c,a[b])},setFirstNodeForHide:function(c,a){var b,e,g;for(e=0,g=a.length;e<g;e++){b=a[e];if(b.isFirstNode)break;if(!b.isHidden&&!b.isFirstNode){b.isFirstNode=!0;d.setNodeLineIcos(c,b);break}else b=null}return b},setFirstNodeForShow:function(c,a){var b,e,g,f,h;for(e=0,g=a.length;e<g;e++)if(b=a[e],!f&&!b.isHidden&&
b.isFirstNode){f=b;break}else if(!f&&!b.isHidden&&!b.isFirstNode)b.isFirstNode=!0,f=b,d.setNodeLineIcos(c,b);else if(f&&b.isFirstNode){b.isFirstNode=!1;h=b;d.setNodeLineIcos(c,b);break}return{"new":f,old:h}},setLastNodeForHide:function(c,a){var b,e;for(e=a.length-1;e>=0;e--){b=a[e];if(b.isLastNode)break;if(!b.isHidden&&!b.isLastNode){b.isLastNode=!0;d.setNodeLineIcos(c,b);break}else b=null}return b},setLastNodeForShow:function(c,a){var b,e,g,f;for(e=a.length-1;e>=0;e--)if(b=a[e],!g&&!b.isHidden&&
b.isLastNode){g=b;break}else if(!g&&!b.isHidden&&!b.isLastNode)b.isLastNode=!0,g=b,d.setNodeLineIcos(c,b);else if(g&&b.isLastNode){b.isLastNode=!1;f=b;d.setNodeLineIcos(c,b);break}return{"new":g,old:f}}},data:{initHideForExCheck:function(c,a){if(a.isHidden&&c.check&&c.check.enable){if(typeof a._nocheck=="undefined")a._nocheck=!!a.nocheck,a.nocheck=!0;a.check_Child_State=-1;d.repairParentChkClassWithSelf&&d.repairParentChkClassWithSelf(c,a)}},initShowForExCheck:function(c,a){if(!a.isHidden&&c.check&&
c.check.enable){if(typeof a._nocheck!="undefined")a.nocheck=a._nocheck,delete a._nocheck;if(d.setChkClass){var b=j(a,l.id.CHECK,c);d.setChkClass(c,b,a)}d.repairParentChkClassWithSelf&&d.repairParentChkClassWithSelf(c,a)}}}});var i=i.fn.zTree,m=i._z.tools,l=i.consts,d=i._z.view,f=i._z.data,j=m.$;f.addInitNode(function(c,a,b){if(typeof b.isHidden=="string")b.isHidden=m.eqs(b.isHidden,"true");b.isHidden=!!b.isHidden;f.initHideForExCheck(c,b)});f.addBeforeA(function(){});f.addZTreeTools(function(c,a){a.showNodes=
function(a,b){d.showNodes(c,a,b)};a.showNode=function(a,b){a&&d.showNodes(c,[a],b)};a.hideNodes=function(a,b){d.hideNodes(c,a,b)};a.hideNode=function(a,b){a&&d.hideNodes(c,[a],b)};var b=a.checkNode;if(b)a.checkNode=function(c,d,f,h){(!c||!c.isHidden)&&b.apply(a,arguments)}});var n=f.initNode;f.initNode=function(c,a,b,e,g,i,h){var j=(e?e:f.getRoot(c))[c.data.key.children];f.tmpHideFirstNode=d.setFirstNodeForHide(c,j);f.tmpHideLastNode=d.setLastNodeForHide(c,j);h&&(d.setNodeLineIcos(c,f.tmpHideFirstNode),
d.setNodeLineIcos(c,f.tmpHideLastNode));g=f.tmpHideFirstNode===b;i=f.tmpHideLastNode===b;n&&n.apply(f,arguments);h&&i&&d.clearOldLastNode(c,b,h)};var o=f.makeChkFlag;if(o)f.makeChkFlag=function(c,a){(!a||!a.isHidden)&&o.apply(f,arguments)};var p=f.getTreeCheckedNodes;if(p)f.getTreeCheckedNodes=function(c,a,b,e){if(a&&a.length>0){var d=a[0].getParentNode();if(d&&d.isHidden)return[]}return p.apply(f,arguments)};var q=f.getTreeChangeCheckedNodes;if(q)f.getTreeChangeCheckedNodes=function(c,a,b){if(a&&
a.length>0){var d=a[0].getParentNode();if(d&&d.isHidden)return[]}return q.apply(f,arguments)};var r=d.expandCollapseSonNode;if(r)d.expandCollapseSonNode=function(c,a,b,e,f){(!a||!a.isHidden)&&r.apply(d,arguments)};var s=d.setSonNodeCheckBox;if(s)d.setSonNodeCheckBox=function(c,a,b,e){(!a||!a.isHidden)&&s.apply(d,arguments)};var t=d.repairParentChkClassWithSelf;if(t)d.repairParentChkClassWithSelf=function(c,a){(!a||!a.isHidden)&&t.apply(d,arguments)}})(jQuery);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pUcmVlL2V4aGlkZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogSlF1ZXJ5IHpUcmVlIGV4SGlkZU5vZGVzIHYzLjUuMTctYmV0YS4yXG4gKiBodHRwOi8velRyZWUubWUvXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDEwIEh1bnRlci56XG4gKlxuICogTGljZW5zZWQgc2FtZSBhcyBqcXVlcnkgLSBNSVQgTGljZW5zZVxuICogaHR0cDovL3d3dy5vcGVuc291cmNlLm9yZy9saWNlbnNlcy9taXQtbGljZW5zZS5waHBcbiAqXG4gKiBlbWFpbDogaHVudGVyLnpAMjYzLm5ldFxuICogRGF0ZTogMjAxNC0wNS0wOFxuICovXG4oZnVuY3Rpb24oaSl7aS5leHRlbmQoITAsaS5mbi56VHJlZS5feix7dmlldzp7Y2xlYXJPbGRGaXJzdE5vZGU6ZnVuY3Rpb24oYyxhKXtmb3IodmFyIGI9YS5nZXROZXh0Tm9kZSgpO2I7KXtpZihiLmlzRmlyc3ROb2RlKXtiLmlzRmlyc3ROb2RlPSExO2Quc2V0Tm9kZUxpbmVJY29zKGMsYik7YnJlYWt9aWYoYi5pc0xhc3ROb2RlKWJyZWFrO2I9Yi5nZXROZXh0Tm9kZSgpfX0sY2xlYXJPbGRMYXN0Tm9kZTpmdW5jdGlvbihjLGEsYil7Zm9yKGE9YS5nZXRQcmVOb2RlKCk7YTspe2lmKGEuaXNMYXN0Tm9kZSl7YS5pc0xhc3ROb2RlPSExO2ImJmQuc2V0Tm9kZUxpbmVJY29zKGMsYSk7YnJlYWt9aWYoYS5pc0ZpcnN0Tm9kZSlicmVhazthPWEuZ2V0UHJlTm9kZSgpfX0sbWFrZURPTU5vZGVNYWluQmVmb3JlOmZ1bmN0aW9uKGMsYSxiKXtjLnB1c2goXCI8bGkgXCIsYi5pc0hpZGRlbj9cInN0eWxlPSdkaXNwbGF5Om5vbmU7JyBcIjpcIlwiLFwiaWQ9J1wiLGIudElkLFwiJyBjbGFzcz0nXCIsbC5jbGFzc05hbWUuTEVWRUwsXG5iLmxldmVsLFwiJyB0YWJpbmRleD0nMCcgaGlkZWZvY3VzPSd0cnVlJyB0cmVlbm9kZT5cIil9LHNob3dOb2RlOmZ1bmN0aW9uKGMsYSl7YS5pc0hpZGRlbj0hMTtmLmluaXRTaG93Rm9yRXhDaGVjayhjLGEpO2ooYSxjKS5zaG93KCl9LHNob3dOb2RlczpmdW5jdGlvbihjLGEsYil7aWYoYSYmYS5sZW5ndGghPTApe3ZhciBlPXt9LGcsaztmb3IoZz0wLGs9YS5sZW5ndGg7ZzxrO2crKyl7dmFyIGg9YVtnXTtpZighZVtoLnBhcmVudFRJZF0pe3ZhciBpPWguZ2V0UGFyZW50Tm9kZSgpO2VbaC5wYXJlbnRUSWRdPWk9PT1udWxsP2YuZ2V0Um9vdChjKTpoLmdldFBhcmVudE5vZGUoKX1kLnNob3dOb2RlKGMsaCxiKX1mb3IodmFyIGogaW4gZSlhPWVbal1bYy5kYXRhLmtleS5jaGlsZHJlbl0sZC5zZXRGaXJzdE5vZGVGb3JTaG93KGMsYSksZC5zZXRMYXN0Tm9kZUZvclNob3coYyxhKX19LGhpZGVOb2RlOmZ1bmN0aW9uKGMsYSl7YS5pc0hpZGRlbj0hMDthLmlzRmlyc3ROb2RlPSExO2EuaXNMYXN0Tm9kZT1cbiExO2YuaW5pdEhpZGVGb3JFeENoZWNrKGMsYSk7ZC5jYW5jZWxQcmVTZWxlY3RlZE5vZGUoYyxhKTtqKGEsYykuaGlkZSgpfSxoaWRlTm9kZXM6ZnVuY3Rpb24oYyxhLGIpe2lmKGEmJmEubGVuZ3RoIT0wKXt2YXIgZT17fSxnLGs7Zm9yKGc9MCxrPWEubGVuZ3RoO2c8aztnKyspe3ZhciBoPWFbZ107aWYoKGguaXNGaXJzdE5vZGV8fGguaXNMYXN0Tm9kZSkmJiFlW2gucGFyZW50VElkXSl7dmFyIGk9aC5nZXRQYXJlbnROb2RlKCk7ZVtoLnBhcmVudFRJZF09aT09PW51bGw/Zi5nZXRSb290KGMpOmguZ2V0UGFyZW50Tm9kZSgpfWQuaGlkZU5vZGUoYyxoLGIpfWZvcih2YXIgaiBpbiBlKWE9ZVtqXVtjLmRhdGEua2V5LmNoaWxkcmVuXSxkLnNldEZpcnN0Tm9kZUZvckhpZGUoYyxhKSxkLnNldExhc3ROb2RlRm9ySGlkZShjLGEpfX0sc2V0Rmlyc3ROb2RlOmZ1bmN0aW9uKGMsYSl7dmFyIGI9Yy5kYXRhLmtleS5jaGlsZHJlbixlPWFbYl0ubGVuZ3RoO2U+MCYmIWFbYl1bMF0uaXNIaWRkZW4/XG5hW2JdWzBdLmlzRmlyc3ROb2RlPSEwOmU+MCYmZC5zZXRGaXJzdE5vZGVGb3JIaWRlKGMsYVtiXSl9LHNldExhc3ROb2RlOmZ1bmN0aW9uKGMsYSl7dmFyIGI9Yy5kYXRhLmtleS5jaGlsZHJlbixlPWFbYl0ubGVuZ3RoO2U+MCYmIWFbYl1bMF0uaXNIaWRkZW4/YVtiXVtlLTFdLmlzTGFzdE5vZGU9ITA6ZT4wJiZkLnNldExhc3ROb2RlRm9ySGlkZShjLGFbYl0pfSxzZXRGaXJzdE5vZGVGb3JIaWRlOmZ1bmN0aW9uKGMsYSl7dmFyIGIsZSxnO2ZvcihlPTAsZz1hLmxlbmd0aDtlPGc7ZSsrKXtiPWFbZV07aWYoYi5pc0ZpcnN0Tm9kZSlicmVhaztpZighYi5pc0hpZGRlbiYmIWIuaXNGaXJzdE5vZGUpe2IuaXNGaXJzdE5vZGU9ITA7ZC5zZXROb2RlTGluZUljb3MoYyxiKTticmVha31lbHNlIGI9bnVsbH1yZXR1cm4gYn0sc2V0Rmlyc3ROb2RlRm9yU2hvdzpmdW5jdGlvbihjLGEpe3ZhciBiLGUsZyxmLGg7Zm9yKGU9MCxnPWEubGVuZ3RoO2U8ZztlKyspaWYoYj1hW2VdLCFmJiYhYi5pc0hpZGRlbiYmXG5iLmlzRmlyc3ROb2RlKXtmPWI7YnJlYWt9ZWxzZSBpZighZiYmIWIuaXNIaWRkZW4mJiFiLmlzRmlyc3ROb2RlKWIuaXNGaXJzdE5vZGU9ITAsZj1iLGQuc2V0Tm9kZUxpbmVJY29zKGMsYik7ZWxzZSBpZihmJiZiLmlzRmlyc3ROb2RlKXtiLmlzRmlyc3ROb2RlPSExO2g9YjtkLnNldE5vZGVMaW5lSWNvcyhjLGIpO2JyZWFrfXJldHVybntcIm5ld1wiOmYsb2xkOmh9fSxzZXRMYXN0Tm9kZUZvckhpZGU6ZnVuY3Rpb24oYyxhKXt2YXIgYixlO2ZvcihlPWEubGVuZ3RoLTE7ZT49MDtlLS0pe2I9YVtlXTtpZihiLmlzTGFzdE5vZGUpYnJlYWs7aWYoIWIuaXNIaWRkZW4mJiFiLmlzTGFzdE5vZGUpe2IuaXNMYXN0Tm9kZT0hMDtkLnNldE5vZGVMaW5lSWNvcyhjLGIpO2JyZWFrfWVsc2UgYj1udWxsfXJldHVybiBifSxzZXRMYXN0Tm9kZUZvclNob3c6ZnVuY3Rpb24oYyxhKXt2YXIgYixlLGcsZjtmb3IoZT1hLmxlbmd0aC0xO2U+PTA7ZS0tKWlmKGI9YVtlXSwhZyYmIWIuaXNIaWRkZW4mJlxuYi5pc0xhc3ROb2RlKXtnPWI7YnJlYWt9ZWxzZSBpZighZyYmIWIuaXNIaWRkZW4mJiFiLmlzTGFzdE5vZGUpYi5pc0xhc3ROb2RlPSEwLGc9YixkLnNldE5vZGVMaW5lSWNvcyhjLGIpO2Vsc2UgaWYoZyYmYi5pc0xhc3ROb2RlKXtiLmlzTGFzdE5vZGU9ITE7Zj1iO2Quc2V0Tm9kZUxpbmVJY29zKGMsYik7YnJlYWt9cmV0dXJue1wibmV3XCI6ZyxvbGQ6Zn19fSxkYXRhOntpbml0SGlkZUZvckV4Q2hlY2s6ZnVuY3Rpb24oYyxhKXtpZihhLmlzSGlkZGVuJiZjLmNoZWNrJiZjLmNoZWNrLmVuYWJsZSl7aWYodHlwZW9mIGEuX25vY2hlY2s9PVwidW5kZWZpbmVkXCIpYS5fbm9jaGVjaz0hIWEubm9jaGVjayxhLm5vY2hlY2s9ITA7YS5jaGVja19DaGlsZF9TdGF0ZT0tMTtkLnJlcGFpclBhcmVudENoa0NsYXNzV2l0aFNlbGYmJmQucmVwYWlyUGFyZW50Q2hrQ2xhc3NXaXRoU2VsZihjLGEpfX0saW5pdFNob3dGb3JFeENoZWNrOmZ1bmN0aW9uKGMsYSl7aWYoIWEuaXNIaWRkZW4mJmMuY2hlY2smJlxuYy5jaGVjay5lbmFibGUpe2lmKHR5cGVvZiBhLl9ub2NoZWNrIT1cInVuZGVmaW5lZFwiKWEubm9jaGVjaz1hLl9ub2NoZWNrLGRlbGV0ZSBhLl9ub2NoZWNrO2lmKGQuc2V0Q2hrQ2xhc3Mpe3ZhciBiPWooYSxsLmlkLkNIRUNLLGMpO2Quc2V0Q2hrQ2xhc3MoYyxiLGEpfWQucmVwYWlyUGFyZW50Q2hrQ2xhc3NXaXRoU2VsZiYmZC5yZXBhaXJQYXJlbnRDaGtDbGFzc1dpdGhTZWxmKGMsYSl9fX19KTt2YXIgaT1pLmZuLnpUcmVlLG09aS5fei50b29scyxsPWkuY29uc3RzLGQ9aS5fei52aWV3LGY9aS5fei5kYXRhLGo9bS4kO2YuYWRkSW5pdE5vZGUoZnVuY3Rpb24oYyxhLGIpe2lmKHR5cGVvZiBiLmlzSGlkZGVuPT1cInN0cmluZ1wiKWIuaXNIaWRkZW49bS5lcXMoYi5pc0hpZGRlbixcInRydWVcIik7Yi5pc0hpZGRlbj0hIWIuaXNIaWRkZW47Zi5pbml0SGlkZUZvckV4Q2hlY2soYyxiKX0pO2YuYWRkQmVmb3JlQShmdW5jdGlvbigpe30pO2YuYWRkWlRyZWVUb29scyhmdW5jdGlvbihjLGEpe2Euc2hvd05vZGVzPVxuZnVuY3Rpb24oYSxiKXtkLnNob3dOb2RlcyhjLGEsYil9O2Euc2hvd05vZGU9ZnVuY3Rpb24oYSxiKXthJiZkLnNob3dOb2RlcyhjLFthXSxiKX07YS5oaWRlTm9kZXM9ZnVuY3Rpb24oYSxiKXtkLmhpZGVOb2RlcyhjLGEsYil9O2EuaGlkZU5vZGU9ZnVuY3Rpb24oYSxiKXthJiZkLmhpZGVOb2RlcyhjLFthXSxiKX07dmFyIGI9YS5jaGVja05vZGU7aWYoYilhLmNoZWNrTm9kZT1mdW5jdGlvbihjLGQsZixoKXsoIWN8fCFjLmlzSGlkZGVuKSYmYi5hcHBseShhLGFyZ3VtZW50cyl9fSk7dmFyIG49Zi5pbml0Tm9kZTtmLmluaXROb2RlPWZ1bmN0aW9uKGMsYSxiLGUsZyxpLGgpe3ZhciBqPShlP2U6Zi5nZXRSb290KGMpKVtjLmRhdGEua2V5LmNoaWxkcmVuXTtmLnRtcEhpZGVGaXJzdE5vZGU9ZC5zZXRGaXJzdE5vZGVGb3JIaWRlKGMsaik7Zi50bXBIaWRlTGFzdE5vZGU9ZC5zZXRMYXN0Tm9kZUZvckhpZGUoYyxqKTtoJiYoZC5zZXROb2RlTGluZUljb3MoYyxmLnRtcEhpZGVGaXJzdE5vZGUpLFxuZC5zZXROb2RlTGluZUljb3MoYyxmLnRtcEhpZGVMYXN0Tm9kZSkpO2c9Zi50bXBIaWRlRmlyc3ROb2RlPT09YjtpPWYudG1wSGlkZUxhc3ROb2RlPT09YjtuJiZuLmFwcGx5KGYsYXJndW1lbnRzKTtoJiZpJiZkLmNsZWFyT2xkTGFzdE5vZGUoYyxiLGgpfTt2YXIgbz1mLm1ha2VDaGtGbGFnO2lmKG8pZi5tYWtlQ2hrRmxhZz1mdW5jdGlvbihjLGEpeyghYXx8IWEuaXNIaWRkZW4pJiZvLmFwcGx5KGYsYXJndW1lbnRzKX07dmFyIHA9Zi5nZXRUcmVlQ2hlY2tlZE5vZGVzO2lmKHApZi5nZXRUcmVlQ2hlY2tlZE5vZGVzPWZ1bmN0aW9uKGMsYSxiLGUpe2lmKGEmJmEubGVuZ3RoPjApe3ZhciBkPWFbMF0uZ2V0UGFyZW50Tm9kZSgpO2lmKGQmJmQuaXNIaWRkZW4pcmV0dXJuW119cmV0dXJuIHAuYXBwbHkoZixhcmd1bWVudHMpfTt2YXIgcT1mLmdldFRyZWVDaGFuZ2VDaGVja2VkTm9kZXM7aWYocSlmLmdldFRyZWVDaGFuZ2VDaGVja2VkTm9kZXM9ZnVuY3Rpb24oYyxhLGIpe2lmKGEmJlxuYS5sZW5ndGg+MCl7dmFyIGQ9YVswXS5nZXRQYXJlbnROb2RlKCk7aWYoZCYmZC5pc0hpZGRlbilyZXR1cm5bXX1yZXR1cm4gcS5hcHBseShmLGFyZ3VtZW50cyl9O3ZhciByPWQuZXhwYW5kQ29sbGFwc2VTb25Ob2RlO2lmKHIpZC5leHBhbmRDb2xsYXBzZVNvbk5vZGU9ZnVuY3Rpb24oYyxhLGIsZSxmKXsoIWF8fCFhLmlzSGlkZGVuKSYmci5hcHBseShkLGFyZ3VtZW50cyl9O3ZhciBzPWQuc2V0U29uTm9kZUNoZWNrQm94O2lmKHMpZC5zZXRTb25Ob2RlQ2hlY2tCb3g9ZnVuY3Rpb24oYyxhLGIsZSl7KCFhfHwhYS5pc0hpZGRlbikmJnMuYXBwbHkoZCxhcmd1bWVudHMpfTt2YXIgdD1kLnJlcGFpclBhcmVudENoa0NsYXNzV2l0aFNlbGY7aWYodClkLnJlcGFpclBhcmVudENoa0NsYXNzV2l0aFNlbGY9ZnVuY3Rpb24oYyxhKXsoIWF8fCFhLmlzSGlkZGVuKSYmdC5hcHBseShkLGFyZ3VtZW50cyl9fSkoalF1ZXJ5KTtcbiJdLCJmaWxlIjoicGx1Z2lucy96VHJlZS9leGhpZGUuanMifQ==
