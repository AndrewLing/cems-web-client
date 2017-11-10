/*
  Leaflet.AwesomeMarkers, a plugin that adds colorful iconic markers for Leaflet, based on the Font Awesome icons
  (c) 2012-2013, Lennard Voogdt

  http://leafletjs.com
  https://github.com/lvoogdt
*//*global L*/(function(e,t,n){"use strict";L.AwesomeMarkers={};L.AwesomeMarkers.version="2.0.1";L.AwesomeMarkers.Icon=L.Icon.extend({options:{iconSize:[35,45],iconAnchor:[17,42],popupAnchor:[1,-32],shadowAnchor:[10,12],shadowSize:[36,16],className:"awesome-marker",prefix:"glyphicon",spinClass:"fa-spin",icon:"home",markerColor:"blue",iconColor:"white"},initialize:function(e){e=L.Util.setOptions(this,e)},createIcon:function(){var e=t.createElement("div"),n=this.options;n.icon&&(e.innerHTML=this._createInner());n.bgPos&&(e.style.backgroundPosition=-n.bgPos.x+"px "+ -n.bgPos.y+"px");this._setIconStyles(e,"icon-"+n.markerColor);return e},_createInner:function(){var e,t="",n="",r="",i=this.options;i.icon.slice(0,i.prefix.length+1)===i.prefix+"-"?e=i.icon:e=i.prefix+"-"+i.icon;i.spin&&typeof i.spinClass=="string"&&(t=i.spinClass);i.iconColor&&(i.iconColor==="white"||i.iconColor==="black"?n="icon-"+i.iconColor:r="style='color: "+i.iconColor+"' ");return"<i "+r+"class='"+i.prefix+" "+e+" "+t+" "+n+"'></i>"},_setIconStyles:function(e,t){var n=this.options,r=L.point(n[t==="shadow"?"shadowSize":"iconSize"]),i;t==="shadow"?i=L.point(n.shadowAnchor||n.iconAnchor):i=L.point(n.iconAnchor);!i&&r&&(i=r.divideBy(2,!0));e.className="awesome-marker-"+t+" "+n.className;if(i){e.style.marginLeft=-i.x+"px";e.style.marginTop=-i.y+"px"}if(r){e.style.width=r.x+"px";e.style.height=r.y+"px"}},createShadow:function(){var e=t.createElement("div");this._setIconStyles(e,"shadow");return e}});L.AwesomeMarkers.icon=function(e){return new L.AwesomeMarkers.Icon(e)}})(this,document);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL0xlYWZsZXQvbGVhZmxldC5hd2Vzb21lLW1hcmtlcnMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLypcbiAgTGVhZmxldC5Bd2Vzb21lTWFya2VycywgYSBwbHVnaW4gdGhhdCBhZGRzIGNvbG9yZnVsIGljb25pYyBtYXJrZXJzIGZvciBMZWFmbGV0LCBiYXNlZCBvbiB0aGUgRm9udCBBd2Vzb21lIGljb25zXG4gIChjKSAyMDEyLTIwMTMsIExlbm5hcmQgVm9vZ2R0XG5cbiAgaHR0cDovL2xlYWZsZXRqcy5jb21cbiAgaHR0cHM6Ly9naXRodWIuY29tL2x2b29nZHRcbiovLypnbG9iYWwgTCovKGZ1bmN0aW9uKGUsdCxuKXtcInVzZSBzdHJpY3RcIjtMLkF3ZXNvbWVNYXJrZXJzPXt9O0wuQXdlc29tZU1hcmtlcnMudmVyc2lvbj1cIjIuMC4xXCI7TC5Bd2Vzb21lTWFya2Vycy5JY29uPUwuSWNvbi5leHRlbmQoe29wdGlvbnM6e2ljb25TaXplOlszNSw0NV0saWNvbkFuY2hvcjpbMTcsNDJdLHBvcHVwQW5jaG9yOlsxLC0zMl0sc2hhZG93QW5jaG9yOlsxMCwxMl0sc2hhZG93U2l6ZTpbMzYsMTZdLGNsYXNzTmFtZTpcImF3ZXNvbWUtbWFya2VyXCIscHJlZml4OlwiZ2x5cGhpY29uXCIsc3BpbkNsYXNzOlwiZmEtc3BpblwiLGljb246XCJob21lXCIsbWFya2VyQ29sb3I6XCJibHVlXCIsaWNvbkNvbG9yOlwid2hpdGVcIn0saW5pdGlhbGl6ZTpmdW5jdGlvbihlKXtlPUwuVXRpbC5zZXRPcHRpb25zKHRoaXMsZSl9LGNyZWF0ZUljb246ZnVuY3Rpb24oKXt2YXIgZT10LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiksbj10aGlzLm9wdGlvbnM7bi5pY29uJiYoZS5pbm5lckhUTUw9dGhpcy5fY3JlYXRlSW5uZXIoKSk7bi5iZ1BvcyYmKGUuc3R5bGUuYmFja2dyb3VuZFBvc2l0aW9uPS1uLmJnUG9zLngrXCJweCBcIisgLW4uYmdQb3MueStcInB4XCIpO3RoaXMuX3NldEljb25TdHlsZXMoZSxcImljb24tXCIrbi5tYXJrZXJDb2xvcik7cmV0dXJuIGV9LF9jcmVhdGVJbm5lcjpmdW5jdGlvbigpe3ZhciBlLHQ9XCJcIixuPVwiXCIscj1cIlwiLGk9dGhpcy5vcHRpb25zO2kuaWNvbi5zbGljZSgwLGkucHJlZml4Lmxlbmd0aCsxKT09PWkucHJlZml4K1wiLVwiP2U9aS5pY29uOmU9aS5wcmVmaXgrXCItXCIraS5pY29uO2kuc3BpbiYmdHlwZW9mIGkuc3BpbkNsYXNzPT1cInN0cmluZ1wiJiYodD1pLnNwaW5DbGFzcyk7aS5pY29uQ29sb3ImJihpLmljb25Db2xvcj09PVwid2hpdGVcInx8aS5pY29uQ29sb3I9PT1cImJsYWNrXCI/bj1cImljb24tXCIraS5pY29uQ29sb3I6cj1cInN0eWxlPSdjb2xvcjogXCIraS5pY29uQ29sb3IrXCInIFwiKTtyZXR1cm5cIjxpIFwiK3IrXCJjbGFzcz0nXCIraS5wcmVmaXgrXCIgXCIrZStcIiBcIit0K1wiIFwiK24rXCInPjwvaT5cIn0sX3NldEljb25TdHlsZXM6ZnVuY3Rpb24oZSx0KXt2YXIgbj10aGlzLm9wdGlvbnMscj1MLnBvaW50KG5bdD09PVwic2hhZG93XCI/XCJzaGFkb3dTaXplXCI6XCJpY29uU2l6ZVwiXSksaTt0PT09XCJzaGFkb3dcIj9pPUwucG9pbnQobi5zaGFkb3dBbmNob3J8fG4uaWNvbkFuY2hvcik6aT1MLnBvaW50KG4uaWNvbkFuY2hvcik7IWkmJnImJihpPXIuZGl2aWRlQnkoMiwhMCkpO2UuY2xhc3NOYW1lPVwiYXdlc29tZS1tYXJrZXItXCIrdCtcIiBcIituLmNsYXNzTmFtZTtpZihpKXtlLnN0eWxlLm1hcmdpbkxlZnQ9LWkueCtcInB4XCI7ZS5zdHlsZS5tYXJnaW5Ub3A9LWkueStcInB4XCJ9aWYocil7ZS5zdHlsZS53aWR0aD1yLngrXCJweFwiO2Uuc3R5bGUuaGVpZ2h0PXIueStcInB4XCJ9fSxjcmVhdGVTaGFkb3c6ZnVuY3Rpb24oKXt2YXIgZT10LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7dGhpcy5fc2V0SWNvblN0eWxlcyhlLFwic2hhZG93XCIpO3JldHVybiBlfX0pO0wuQXdlc29tZU1hcmtlcnMuaWNvbj1mdW5jdGlvbihlKXtyZXR1cm4gbmV3IEwuQXdlc29tZU1hcmtlcnMuSWNvbihlKX19KSh0aGlzLGRvY3VtZW50KTtcbiJdLCJmaWxlIjoicGx1Z2lucy9MZWFmbGV0L2xlYWZsZXQuYXdlc29tZS1tYXJrZXJzLmpzIn0=
