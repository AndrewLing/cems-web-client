define("echarts/chart/funnel",["require","./base","zrender/shape/Text","zrender/shape/Line","zrender/shape/Polygon","../config","../util/ecData","../util/number","zrender/tool/util","zrender/tool/color","zrender/tool/area","../chart"],function(e){function t(e,t,i,a,o){n.call(this,e,t,i,a,o),this.refresh(a)}var n=e("./base"),i=e("zrender/shape/Text"),a=e("zrender/shape/Line"),o=e("zrender/shape/Polygon"),s=e("../config");s.funnel={zlevel:0,z:2,clickable:!0,legendHoverLink:!0,x:80,y:60,x2:80,y2:60,min:0,max:100,minSize:"0%",maxSize:"100%",sort:"descending",gap:0,funnelAlign:"center",itemStyle:{normal:{borderColor:"#fff",borderWidth:1,label:{show:!0,position:"outer"},labelLine:{show:!0,length:10,lineStyle:{width:1,type:"solid"}}},emphasis:{borderColor:"rgba(0,0,0,0)",borderWidth:1,label:{show:!0},labelLine:{show:!0}}}};var r=e("../util/ecData"),l=e("../util/number"),h=e("zrender/tool/util"),m=e("zrender/tool/color"),V=e("zrender/tool/area");return t.prototype={type:s.CHART_TYPE_FUNNEL,_buildShape:function(){var e=this.series,t=this.component.legend;this._paramsMap={},this._selected={},this.selectedMap={};for(var n,i=0,a=e.length;a>i;i++)if(e[i].type===s.CHART_TYPE_FUNNEL){if(e[i]=this.reformOption(e[i]),this.legendHoverLink=e[i].legendHoverLink||this.legendHoverLink,n=e[i].name||"",this.selectedMap[n]=t?t.isSelected(n):!0,!this.selectedMap[n])continue;this._buildSingleFunnel(i),this.buildMark(i)}this.addShapeList()},_buildSingleFunnel:function(e){var t=this.component.legend,n=this.series[e],i=this._mapData(e),a=this._getLocation(e);this._paramsMap[e]={location:a,data:i};for(var o,s=0,r=[],h=0,m=i.length;m>h;h++)o=i[h].name,this.selectedMap[o]=t?t.isSelected(o):!0,this.selectedMap[o]&&!isNaN(i[h].value)&&(r.push(i[h]),s++);if(0!==s){for(var V,U,d,p,c=this._buildFunnelCase(e),u=n.funnelAlign,y=n.gap,g=s>1?(a.height-(s-1)*y)/s:a.height,b=a.y,f="descending"===n.sort?this._getItemWidth(e,r[0].value):l.parsePercent(n.minSize,a.width),k="descending"===n.sort?1:0,x=a.centerX,_=[],h=0,m=r.length;m>h;h++)if(o=r[h].name,this.selectedMap[o]&&!isNaN(r[h].value)){switch(V=m-2>=h?this._getItemWidth(e,r[h+k].value):"descending"===n.sort?l.parsePercent(n.minSize,a.width):l.parsePercent(n.maxSize,a.width),u){case"left":U=a.x;break;case"right":U=a.x+a.width-f;break;default:U=x-f/2}d=this._buildItem(e,r[h]._index,t?t.getColor(o):this.zr.getColor(r[h]._index),U,b,f,V,g,u),b+=g+y,p=d.style.pointList,_.unshift([p[0][0]-10,p[0][1]]),_.push([p[1][0]+10,p[1][1]]),0===h&&(0===f?(p=_.pop(),"center"==u&&(_[0][0]+=10),"right"==u&&(_[0][0]=p[0]),_[0][1]-="center"==u?10:15,1==m&&(p=d.style.pointList)):(_[_.length-1][1]-=5,_[0][1]-=5)),f=V}c&&(_.unshift([p[3][0]-10,p[3][1]]),_.push([p[2][0]+10,p[2][1]]),0===f?(p=_.pop(),"center"==u&&(_[0][0]+=10),"right"==u&&(_[0][0]=p[0]),_[0][1]+="center"==u?10:15):(_[_.length-1][1]+=5,_[0][1]+=5),c.style.pointList=_)}},_buildFunnelCase:function(e){var t=this.series[e];if(this.deepQuery([t,this.option],"calculable")){var n=this._paramsMap[e].location,i=10,a={hoverable:!1,style:{pointListd:[[n.x-i,n.y-i],[n.x+n.width+i,n.y-i],[n.x+n.width+i,n.y+n.height+i],[n.x-i,n.y+n.height+i]],brushType:"stroke",lineWidth:1,strokeColor:t.calculableHolderColor||this.ecTheme.calculableHolderColor||s.calculableHolderColor}};return r.pack(a,t,e,void 0,-1),this.setCalculable(a),a=new o(a),this.shapeList.push(a),a}},_getLocation:function(e){var t=this.series[e],n=this.zr.getWidth(),i=this.zr.getHeight(),a=this.parsePercent(t.x,n),o=this.parsePercent(t.y,i),s=null==t.width?n-a-this.parsePercent(t.x2,n):this.parsePercent(t.width,n);return{x:a,y:o,width:s,height:null==t.height?i-o-this.parsePercent(t.y2,i):this.parsePercent(t.height,i),centerX:a+s/2}},_mapData:function(e){function t(e,t){return"-"===e.value?1:"-"===t.value?-1:t.value-e.value}function n(e,n){return-t(e,n)}for(var i=this.series[e],a=h.clone(i.data),o=0,s=a.length;s>o;o++)a[o]._index=o;return"none"!=i.sort&&a.sort("descending"===i.sort?t:n),a},_buildItem:function(e,t,n,i,a,o,s,l,h){var m=this.series,V=m[e],U=V.data[t],d=this.getPolygon(e,t,n,i,a,o,s,l,h);r.pack(d,m[e],e,m[e].data[t],t,m[e].data[t].name),this.shapeList.push(d);var p=this.getLabel(e,t,n,i,a,o,s,l,h);r.pack(p,m[e],e,m[e].data[t],t,m[e].data[t].name),this.shapeList.push(p),this._needLabel(V,U,!1)||(p.invisible=!0);var c=this.getLabelLine(e,t,n,i,a,o,s,l,h);this.shapeList.push(c),this._needLabelLine(V,U,!1)||(c.invisible=!0);var u=[],y=[];return this._needLabelLine(V,U,!0)&&(u.push(c.id),y.push(c.id)),this._needLabel(V,U,!0)&&(u.push(p.id),y.push(d.id)),d.hoverConnect=u,p.hoverConnect=y,d},_getItemWidth:function(e,t){var n=this.series[e],i=this._paramsMap[e].location,a=n.min,o=n.max,s=l.parsePercent(n.minSize,i.width),r=l.parsePercent(n.maxSize,i.width);return t*(r-s)/(o-a)},getPolygon:function(e,t,n,i,a,s,r,l,h){var V,U=this.series[e],d=U.data[t],p=[d,U],c=this.deepMerge(p,"itemStyle.normal")||{},u=this.deepMerge(p,"itemStyle.emphasis")||{},y=this.getItemStyleColor(c.color,e,t,d)||n,g=this.getItemStyleColor(u.color,e,t,d)||("string"==typeof y?m.lift(y,-.2):y);switch(h){case"left":V=i;break;case"right":V=i+(s-r);break;default:V=i+(s-r)/2}var b={zlevel:this.getZlevelBase(),z:this.getZBase(),clickable:this.deepQuery(p,"clickable"),style:{pointList:[[i,a],[i+s,a],[V+r,a+l],[V,a+l]],brushType:"both",color:y,lineWidth:c.borderWidth,strokeColor:c.borderColor},highlightStyle:{color:g,lineWidth:u.borderWidth,strokeColor:u.borderColor}};return this.deepQuery([d,U,this.option],"calculable")&&(this.setCalculable(b),b.draggable=!0),new o(b)},getLabel:function(e,t,n,a,o,s,r,l,U){var d,p=this.series[e],c=p.data[t],u=this._paramsMap[e].location,y=h.merge(h.clone(c.itemStyle)||{},p.itemStyle),g="normal",b=y[g].label,f=b.textStyle||{},k=y[g].labelLine.length,x=this.getLabelText(e,t,g),_=this.getFont(f),L=n;b.position=b.position||y.normal.label.position,"inner"===b.position||"inside"===b.position||"center"===b.position?(d=U,L=Math.max(s,r)/2>V.getTextWidth(x,_)?"#fff":m.reverse(n)):d="left"===b.position?"right":"left";var W={zlevel:this.getZlevelBase(),z:this.getZBase()+1,style:{x:this._getLabelPoint(b.position,a,u,s,r,k,U),y:o+l/2,color:f.color||L,text:x,textAlign:f.align||d,textBaseline:f.baseline||"middle",textFont:_}};return g="emphasis",b=y[g].label||b,f=b.textStyle||f,k=y[g].labelLine.length||k,b.position=b.position||y.normal.label.position,x=this.getLabelText(e,t,g),_=this.getFont(f),L=n,"inner"===b.position||"inside"===b.position||"center"===b.position?(d=U,L=Math.max(s,r)/2>V.getTextWidth(x,_)?"#fff":m.reverse(n)):d="left"===b.position?"right":"left",W.highlightStyle={x:this._getLabelPoint(b.position,a,u,s,r,k,U),color:f.color||L,text:x,textAlign:f.align||d,textFont:_,brushType:"fill"},new i(W)},getLabelText:function(e,t,n){var i=this.series,a=i[e],o=a.data[t],s=this.deepQuery([o,a],"itemStyle."+n+".label.formatter");return s?"function"==typeof s?s.call(this.myChart,{seriesIndex:e,seriesName:a.name||"",series:a,dataIndex:t,data:o,name:o.name,value:o.value}):"string"==typeof s?s=s.replace("{a}","{a0}").replace("{b}","{b0}").replace("{c}","{c0}").replace("{a0}",a.name).replace("{b0}",o.name).replace("{c0}",o.value):void 0:o.name},getLabelLine:function(e,t,n,i,o,s,r,l,m){var V=this.series[e],U=V.data[t],d=this._paramsMap[e].location,p=h.merge(h.clone(U.itemStyle)||{},V.itemStyle),c="normal",u=p[c].labelLine,y=p[c].labelLine.length,g=u.lineStyle||{},b=p[c].label;b.position=b.position||p.normal.label.position;var f={zlevel:this.getZlevelBase(),z:this.getZBase()+1,hoverable:!1,style:{xStart:this._getLabelLineStartPoint(i,d,s,r,m),yStart:o+l/2,xEnd:this._getLabelPoint(b.position,i,d,s,r,y,m),yEnd:o+l/2,strokeColor:g.color||n,lineType:g.type,lineWidth:g.width}};return c="emphasis",u=p[c].labelLine||u,y=p[c].labelLine.length||y,g=u.lineStyle||g,b=p[c].label||b,b.position=b.position,f.highlightStyle={xEnd:this._getLabelPoint(b.position,i,d,s,r,y,m),strokeColor:g.color||n,lineType:g.type,lineWidth:g.width},new a(f)},_getLabelPoint:function(e,t,n,i,a,o,s){switch(e="inner"===e||"inside"===e?"center":e){case"center":return"center"==s?t+i/2:"left"==s?t+10:t+i-10;case"left":return"auto"===o?n.x-10:"center"==s?n.centerX-Math.max(i,a)/2-o:"right"==s?t-(a>i?a-i:0)-o:n.x-o;default:return"auto"===o?n.x+n.width+10:"center"==s?n.centerX+Math.max(i,a)/2+o:"right"==s?n.x+n.width+o:t+Math.max(i,a)+o}},_getLabelLineStartPoint:function(e,t,n,i,a){return"center"==a?t.centerX:i>n?e+Math.min(n,i)/2:e+Math.max(n,i)/2},_needLabel:function(e,t,n){return this.deepQuery([t,e],"itemStyle."+(n?"emphasis":"normal")+".label.show")},_needLabelLine:function(e,t,n){return this.deepQuery([t,e],"itemStyle."+(n?"emphasis":"normal")+".labelLine.show")},refresh:function(e){e&&(this.option=e,this.series=e.series),this.backupShapeList(),this._buildShape()}},h.inherits(t,n),e("../chart").define("funnel",t),t});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL2VjaGFydHMvY2hhcnQvZnVubmVsLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImRlZmluZShcImVjaGFydHMvY2hhcnQvZnVubmVsXCIsW1wicmVxdWlyZVwiLFwiLi9iYXNlXCIsXCJ6cmVuZGVyL3NoYXBlL1RleHRcIixcInpyZW5kZXIvc2hhcGUvTGluZVwiLFwienJlbmRlci9zaGFwZS9Qb2x5Z29uXCIsXCIuLi9jb25maWdcIixcIi4uL3V0aWwvZWNEYXRhXCIsXCIuLi91dGlsL251bWJlclwiLFwienJlbmRlci90b29sL3V0aWxcIixcInpyZW5kZXIvdG9vbC9jb2xvclwiLFwienJlbmRlci90b29sL2FyZWFcIixcIi4uL2NoYXJ0XCJdLGZ1bmN0aW9uKGUpe2Z1bmN0aW9uIHQoZSx0LGksYSxvKXtuLmNhbGwodGhpcyxlLHQsaSxhLG8pLHRoaXMucmVmcmVzaChhKX12YXIgbj1lKFwiLi9iYXNlXCIpLGk9ZShcInpyZW5kZXIvc2hhcGUvVGV4dFwiKSxhPWUoXCJ6cmVuZGVyL3NoYXBlL0xpbmVcIiksbz1lKFwienJlbmRlci9zaGFwZS9Qb2x5Z29uXCIpLHM9ZShcIi4uL2NvbmZpZ1wiKTtzLmZ1bm5lbD17emxldmVsOjAsejoyLGNsaWNrYWJsZTohMCxsZWdlbmRIb3Zlckxpbms6ITAseDo4MCx5OjYwLHgyOjgwLHkyOjYwLG1pbjowLG1heDoxMDAsbWluU2l6ZTpcIjAlXCIsbWF4U2l6ZTpcIjEwMCVcIixzb3J0OlwiZGVzY2VuZGluZ1wiLGdhcDowLGZ1bm5lbEFsaWduOlwiY2VudGVyXCIsaXRlbVN0eWxlOntub3JtYWw6e2JvcmRlckNvbG9yOlwiI2ZmZlwiLGJvcmRlcldpZHRoOjEsbGFiZWw6e3Nob3c6ITAscG9zaXRpb246XCJvdXRlclwifSxsYWJlbExpbmU6e3Nob3c6ITAsbGVuZ3RoOjEwLGxpbmVTdHlsZTp7d2lkdGg6MSx0eXBlOlwic29saWRcIn19fSxlbXBoYXNpczp7Ym9yZGVyQ29sb3I6XCJyZ2JhKDAsMCwwLDApXCIsYm9yZGVyV2lkdGg6MSxsYWJlbDp7c2hvdzohMH0sbGFiZWxMaW5lOntzaG93OiEwfX19fTt2YXIgcj1lKFwiLi4vdXRpbC9lY0RhdGFcIiksbD1lKFwiLi4vdXRpbC9udW1iZXJcIiksaD1lKFwienJlbmRlci90b29sL3V0aWxcIiksbT1lKFwienJlbmRlci90b29sL2NvbG9yXCIpLFY9ZShcInpyZW5kZXIvdG9vbC9hcmVhXCIpO3JldHVybiB0LnByb3RvdHlwZT17dHlwZTpzLkNIQVJUX1RZUEVfRlVOTkVMLF9idWlsZFNoYXBlOmZ1bmN0aW9uKCl7dmFyIGU9dGhpcy5zZXJpZXMsdD10aGlzLmNvbXBvbmVudC5sZWdlbmQ7dGhpcy5fcGFyYW1zTWFwPXt9LHRoaXMuX3NlbGVjdGVkPXt9LHRoaXMuc2VsZWN0ZWRNYXA9e307Zm9yKHZhciBuLGk9MCxhPWUubGVuZ3RoO2E+aTtpKyspaWYoZVtpXS50eXBlPT09cy5DSEFSVF9UWVBFX0ZVTk5FTCl7aWYoZVtpXT10aGlzLnJlZm9ybU9wdGlvbihlW2ldKSx0aGlzLmxlZ2VuZEhvdmVyTGluaz1lW2ldLmxlZ2VuZEhvdmVyTGlua3x8dGhpcy5sZWdlbmRIb3Zlckxpbmssbj1lW2ldLm5hbWV8fFwiXCIsdGhpcy5zZWxlY3RlZE1hcFtuXT10P3QuaXNTZWxlY3RlZChuKTohMCwhdGhpcy5zZWxlY3RlZE1hcFtuXSljb250aW51ZTt0aGlzLl9idWlsZFNpbmdsZUZ1bm5lbChpKSx0aGlzLmJ1aWxkTWFyayhpKX10aGlzLmFkZFNoYXBlTGlzdCgpfSxfYnVpbGRTaW5nbGVGdW5uZWw6ZnVuY3Rpb24oZSl7dmFyIHQ9dGhpcy5jb21wb25lbnQubGVnZW5kLG49dGhpcy5zZXJpZXNbZV0saT10aGlzLl9tYXBEYXRhKGUpLGE9dGhpcy5fZ2V0TG9jYXRpb24oZSk7dGhpcy5fcGFyYW1zTWFwW2VdPXtsb2NhdGlvbjphLGRhdGE6aX07Zm9yKHZhciBvLHM9MCxyPVtdLGg9MCxtPWkubGVuZ3RoO20+aDtoKyspbz1pW2hdLm5hbWUsdGhpcy5zZWxlY3RlZE1hcFtvXT10P3QuaXNTZWxlY3RlZChvKTohMCx0aGlzLnNlbGVjdGVkTWFwW29dJiYhaXNOYU4oaVtoXS52YWx1ZSkmJihyLnB1c2goaVtoXSkscysrKTtpZigwIT09cyl7Zm9yKHZhciBWLFUsZCxwLGM9dGhpcy5fYnVpbGRGdW5uZWxDYXNlKGUpLHU9bi5mdW5uZWxBbGlnbix5PW4uZ2FwLGc9cz4xPyhhLmhlaWdodC0ocy0xKSp5KS9zOmEuaGVpZ2h0LGI9YS55LGY9XCJkZXNjZW5kaW5nXCI9PT1uLnNvcnQ/dGhpcy5fZ2V0SXRlbVdpZHRoKGUsclswXS52YWx1ZSk6bC5wYXJzZVBlcmNlbnQobi5taW5TaXplLGEud2lkdGgpLGs9XCJkZXNjZW5kaW5nXCI9PT1uLnNvcnQ/MTowLHg9YS5jZW50ZXJYLF89W10saD0wLG09ci5sZW5ndGg7bT5oO2grKylpZihvPXJbaF0ubmFtZSx0aGlzLnNlbGVjdGVkTWFwW29dJiYhaXNOYU4ocltoXS52YWx1ZSkpe3N3aXRjaChWPW0tMj49aD90aGlzLl9nZXRJdGVtV2lkdGgoZSxyW2gra10udmFsdWUpOlwiZGVzY2VuZGluZ1wiPT09bi5zb3J0P2wucGFyc2VQZXJjZW50KG4ubWluU2l6ZSxhLndpZHRoKTpsLnBhcnNlUGVyY2VudChuLm1heFNpemUsYS53aWR0aCksdSl7Y2FzZVwibGVmdFwiOlU9YS54O2JyZWFrO2Nhc2VcInJpZ2h0XCI6VT1hLngrYS53aWR0aC1mO2JyZWFrO2RlZmF1bHQ6VT14LWYvMn1kPXRoaXMuX2J1aWxkSXRlbShlLHJbaF0uX2luZGV4LHQ/dC5nZXRDb2xvcihvKTp0aGlzLnpyLmdldENvbG9yKHJbaF0uX2luZGV4KSxVLGIsZixWLGcsdSksYis9Zyt5LHA9ZC5zdHlsZS5wb2ludExpc3QsXy51bnNoaWZ0KFtwWzBdWzBdLTEwLHBbMF1bMV1dKSxfLnB1c2goW3BbMV1bMF0rMTAscFsxXVsxXV0pLDA9PT1oJiYoMD09PWY/KHA9Xy5wb3AoKSxcImNlbnRlclwiPT11JiYoX1swXVswXSs9MTApLFwicmlnaHRcIj09dSYmKF9bMF1bMF09cFswXSksX1swXVsxXS09XCJjZW50ZXJcIj09dT8xMDoxNSwxPT1tJiYocD1kLnN0eWxlLnBvaW50TGlzdCkpOihfW18ubGVuZ3RoLTFdWzFdLT01LF9bMF1bMV0tPTUpKSxmPVZ9YyYmKF8udW5zaGlmdChbcFszXVswXS0xMCxwWzNdWzFdXSksXy5wdXNoKFtwWzJdWzBdKzEwLHBbMl1bMV1dKSwwPT09Zj8ocD1fLnBvcCgpLFwiY2VudGVyXCI9PXUmJihfWzBdWzBdKz0xMCksXCJyaWdodFwiPT11JiYoX1swXVswXT1wWzBdKSxfWzBdWzFdKz1cImNlbnRlclwiPT11PzEwOjE1KTooX1tfLmxlbmd0aC0xXVsxXSs9NSxfWzBdWzFdKz01KSxjLnN0eWxlLnBvaW50TGlzdD1fKX19LF9idWlsZEZ1bm5lbENhc2U6ZnVuY3Rpb24oZSl7dmFyIHQ9dGhpcy5zZXJpZXNbZV07aWYodGhpcy5kZWVwUXVlcnkoW3QsdGhpcy5vcHRpb25dLFwiY2FsY3VsYWJsZVwiKSl7dmFyIG49dGhpcy5fcGFyYW1zTWFwW2VdLmxvY2F0aW9uLGk9MTAsYT17aG92ZXJhYmxlOiExLHN0eWxlOntwb2ludExpc3RkOltbbi54LWksbi55LWldLFtuLngrbi53aWR0aCtpLG4ueS1pXSxbbi54K24ud2lkdGgraSxuLnkrbi5oZWlnaHQraV0sW24ueC1pLG4ueStuLmhlaWdodCtpXV0sYnJ1c2hUeXBlOlwic3Ryb2tlXCIsbGluZVdpZHRoOjEsc3Ryb2tlQ29sb3I6dC5jYWxjdWxhYmxlSG9sZGVyQ29sb3J8fHRoaXMuZWNUaGVtZS5jYWxjdWxhYmxlSG9sZGVyQ29sb3J8fHMuY2FsY3VsYWJsZUhvbGRlckNvbG9yfX07cmV0dXJuIHIucGFjayhhLHQsZSx2b2lkIDAsLTEpLHRoaXMuc2V0Q2FsY3VsYWJsZShhKSxhPW5ldyBvKGEpLHRoaXMuc2hhcGVMaXN0LnB1c2goYSksYX19LF9nZXRMb2NhdGlvbjpmdW5jdGlvbihlKXt2YXIgdD10aGlzLnNlcmllc1tlXSxuPXRoaXMuenIuZ2V0V2lkdGgoKSxpPXRoaXMuenIuZ2V0SGVpZ2h0KCksYT10aGlzLnBhcnNlUGVyY2VudCh0Lngsbiksbz10aGlzLnBhcnNlUGVyY2VudCh0LnksaSkscz1udWxsPT10LndpZHRoP24tYS10aGlzLnBhcnNlUGVyY2VudCh0LngyLG4pOnRoaXMucGFyc2VQZXJjZW50KHQud2lkdGgsbik7cmV0dXJue3g6YSx5Om8sd2lkdGg6cyxoZWlnaHQ6bnVsbD09dC5oZWlnaHQ/aS1vLXRoaXMucGFyc2VQZXJjZW50KHQueTIsaSk6dGhpcy5wYXJzZVBlcmNlbnQodC5oZWlnaHQsaSksY2VudGVyWDphK3MvMn19LF9tYXBEYXRhOmZ1bmN0aW9uKGUpe2Z1bmN0aW9uIHQoZSx0KXtyZXR1cm5cIi1cIj09PWUudmFsdWU/MTpcIi1cIj09PXQudmFsdWU/LTE6dC52YWx1ZS1lLnZhbHVlfWZ1bmN0aW9uIG4oZSxuKXtyZXR1cm4tdChlLG4pfWZvcih2YXIgaT10aGlzLnNlcmllc1tlXSxhPWguY2xvbmUoaS5kYXRhKSxvPTAscz1hLmxlbmd0aDtzPm87bysrKWFbb10uX2luZGV4PW87cmV0dXJuXCJub25lXCIhPWkuc29ydCYmYS5zb3J0KFwiZGVzY2VuZGluZ1wiPT09aS5zb3J0P3Q6biksYX0sX2J1aWxkSXRlbTpmdW5jdGlvbihlLHQsbixpLGEsbyxzLGwsaCl7dmFyIG09dGhpcy5zZXJpZXMsVj1tW2VdLFU9Vi5kYXRhW3RdLGQ9dGhpcy5nZXRQb2x5Z29uKGUsdCxuLGksYSxvLHMsbCxoKTtyLnBhY2soZCxtW2VdLGUsbVtlXS5kYXRhW3RdLHQsbVtlXS5kYXRhW3RdLm5hbWUpLHRoaXMuc2hhcGVMaXN0LnB1c2goZCk7dmFyIHA9dGhpcy5nZXRMYWJlbChlLHQsbixpLGEsbyxzLGwsaCk7ci5wYWNrKHAsbVtlXSxlLG1bZV0uZGF0YVt0XSx0LG1bZV0uZGF0YVt0XS5uYW1lKSx0aGlzLnNoYXBlTGlzdC5wdXNoKHApLHRoaXMuX25lZWRMYWJlbChWLFUsITEpfHwocC5pbnZpc2libGU9ITApO3ZhciBjPXRoaXMuZ2V0TGFiZWxMaW5lKGUsdCxuLGksYSxvLHMsbCxoKTt0aGlzLnNoYXBlTGlzdC5wdXNoKGMpLHRoaXMuX25lZWRMYWJlbExpbmUoVixVLCExKXx8KGMuaW52aXNpYmxlPSEwKTt2YXIgdT1bXSx5PVtdO3JldHVybiB0aGlzLl9uZWVkTGFiZWxMaW5lKFYsVSwhMCkmJih1LnB1c2goYy5pZCkseS5wdXNoKGMuaWQpKSx0aGlzLl9uZWVkTGFiZWwoVixVLCEwKSYmKHUucHVzaChwLmlkKSx5LnB1c2goZC5pZCkpLGQuaG92ZXJDb25uZWN0PXUscC5ob3ZlckNvbm5lY3Q9eSxkfSxfZ2V0SXRlbVdpZHRoOmZ1bmN0aW9uKGUsdCl7dmFyIG49dGhpcy5zZXJpZXNbZV0saT10aGlzLl9wYXJhbXNNYXBbZV0ubG9jYXRpb24sYT1uLm1pbixvPW4ubWF4LHM9bC5wYXJzZVBlcmNlbnQobi5taW5TaXplLGkud2lkdGgpLHI9bC5wYXJzZVBlcmNlbnQobi5tYXhTaXplLGkud2lkdGgpO3JldHVybiB0KihyLXMpLyhvLWEpfSxnZXRQb2x5Z29uOmZ1bmN0aW9uKGUsdCxuLGksYSxzLHIsbCxoKXt2YXIgVixVPXRoaXMuc2VyaWVzW2VdLGQ9VS5kYXRhW3RdLHA9W2QsVV0sYz10aGlzLmRlZXBNZXJnZShwLFwiaXRlbVN0eWxlLm5vcm1hbFwiKXx8e30sdT10aGlzLmRlZXBNZXJnZShwLFwiaXRlbVN0eWxlLmVtcGhhc2lzXCIpfHx7fSx5PXRoaXMuZ2V0SXRlbVN0eWxlQ29sb3IoYy5jb2xvcixlLHQsZCl8fG4sZz10aGlzLmdldEl0ZW1TdHlsZUNvbG9yKHUuY29sb3IsZSx0LGQpfHwoXCJzdHJpbmdcIj09dHlwZW9mIHk/bS5saWZ0KHksLS4yKTp5KTtzd2l0Y2goaCl7Y2FzZVwibGVmdFwiOlY9aTticmVhaztjYXNlXCJyaWdodFwiOlY9aSsocy1yKTticmVhaztkZWZhdWx0OlY9aSsocy1yKS8yfXZhciBiPXt6bGV2ZWw6dGhpcy5nZXRabGV2ZWxCYXNlKCksejp0aGlzLmdldFpCYXNlKCksY2xpY2thYmxlOnRoaXMuZGVlcFF1ZXJ5KHAsXCJjbGlja2FibGVcIiksc3R5bGU6e3BvaW50TGlzdDpbW2ksYV0sW2krcyxhXSxbVityLGErbF0sW1YsYStsXV0sYnJ1c2hUeXBlOlwiYm90aFwiLGNvbG9yOnksbGluZVdpZHRoOmMuYm9yZGVyV2lkdGgsc3Ryb2tlQ29sb3I6Yy5ib3JkZXJDb2xvcn0saGlnaGxpZ2h0U3R5bGU6e2NvbG9yOmcsbGluZVdpZHRoOnUuYm9yZGVyV2lkdGgsc3Ryb2tlQ29sb3I6dS5ib3JkZXJDb2xvcn19O3JldHVybiB0aGlzLmRlZXBRdWVyeShbZCxVLHRoaXMub3B0aW9uXSxcImNhbGN1bGFibGVcIikmJih0aGlzLnNldENhbGN1bGFibGUoYiksYi5kcmFnZ2FibGU9ITApLG5ldyBvKGIpfSxnZXRMYWJlbDpmdW5jdGlvbihlLHQsbixhLG8scyxyLGwsVSl7dmFyIGQscD10aGlzLnNlcmllc1tlXSxjPXAuZGF0YVt0XSx1PXRoaXMuX3BhcmFtc01hcFtlXS5sb2NhdGlvbix5PWgubWVyZ2UoaC5jbG9uZShjLml0ZW1TdHlsZSl8fHt9LHAuaXRlbVN0eWxlKSxnPVwibm9ybWFsXCIsYj15W2ddLmxhYmVsLGY9Yi50ZXh0U3R5bGV8fHt9LGs9eVtnXS5sYWJlbExpbmUubGVuZ3RoLHg9dGhpcy5nZXRMYWJlbFRleHQoZSx0LGcpLF89dGhpcy5nZXRGb250KGYpLEw9bjtiLnBvc2l0aW9uPWIucG9zaXRpb258fHkubm9ybWFsLmxhYmVsLnBvc2l0aW9uLFwiaW5uZXJcIj09PWIucG9zaXRpb258fFwiaW5zaWRlXCI9PT1iLnBvc2l0aW9ufHxcImNlbnRlclwiPT09Yi5wb3NpdGlvbj8oZD1VLEw9TWF0aC5tYXgocyxyKS8yPlYuZ2V0VGV4dFdpZHRoKHgsXyk/XCIjZmZmXCI6bS5yZXZlcnNlKG4pKTpkPVwibGVmdFwiPT09Yi5wb3NpdGlvbj9cInJpZ2h0XCI6XCJsZWZ0XCI7dmFyIFc9e3psZXZlbDp0aGlzLmdldFpsZXZlbEJhc2UoKSx6OnRoaXMuZ2V0WkJhc2UoKSsxLHN0eWxlOnt4OnRoaXMuX2dldExhYmVsUG9pbnQoYi5wb3NpdGlvbixhLHUscyxyLGssVSkseTpvK2wvMixjb2xvcjpmLmNvbG9yfHxMLHRleHQ6eCx0ZXh0QWxpZ246Zi5hbGlnbnx8ZCx0ZXh0QmFzZWxpbmU6Zi5iYXNlbGluZXx8XCJtaWRkbGVcIix0ZXh0Rm9udDpffX07cmV0dXJuIGc9XCJlbXBoYXNpc1wiLGI9eVtnXS5sYWJlbHx8YixmPWIudGV4dFN0eWxlfHxmLGs9eVtnXS5sYWJlbExpbmUubGVuZ3RofHxrLGIucG9zaXRpb249Yi5wb3NpdGlvbnx8eS5ub3JtYWwubGFiZWwucG9zaXRpb24seD10aGlzLmdldExhYmVsVGV4dChlLHQsZyksXz10aGlzLmdldEZvbnQoZiksTD1uLFwiaW5uZXJcIj09PWIucG9zaXRpb258fFwiaW5zaWRlXCI9PT1iLnBvc2l0aW9ufHxcImNlbnRlclwiPT09Yi5wb3NpdGlvbj8oZD1VLEw9TWF0aC5tYXgocyxyKS8yPlYuZ2V0VGV4dFdpZHRoKHgsXyk/XCIjZmZmXCI6bS5yZXZlcnNlKG4pKTpkPVwibGVmdFwiPT09Yi5wb3NpdGlvbj9cInJpZ2h0XCI6XCJsZWZ0XCIsVy5oaWdobGlnaHRTdHlsZT17eDp0aGlzLl9nZXRMYWJlbFBvaW50KGIucG9zaXRpb24sYSx1LHMscixrLFUpLGNvbG9yOmYuY29sb3J8fEwsdGV4dDp4LHRleHRBbGlnbjpmLmFsaWdufHxkLHRleHRGb250Ol8sYnJ1c2hUeXBlOlwiZmlsbFwifSxuZXcgaShXKX0sZ2V0TGFiZWxUZXh0OmZ1bmN0aW9uKGUsdCxuKXt2YXIgaT10aGlzLnNlcmllcyxhPWlbZV0sbz1hLmRhdGFbdF0scz10aGlzLmRlZXBRdWVyeShbbyxhXSxcIml0ZW1TdHlsZS5cIituK1wiLmxhYmVsLmZvcm1hdHRlclwiKTtyZXR1cm4gcz9cImZ1bmN0aW9uXCI9PXR5cGVvZiBzP3MuY2FsbCh0aGlzLm15Q2hhcnQse3Nlcmllc0luZGV4OmUsc2VyaWVzTmFtZTphLm5hbWV8fFwiXCIsc2VyaWVzOmEsZGF0YUluZGV4OnQsZGF0YTpvLG5hbWU6by5uYW1lLHZhbHVlOm8udmFsdWV9KTpcInN0cmluZ1wiPT10eXBlb2Ygcz9zPXMucmVwbGFjZShcInthfVwiLFwie2EwfVwiKS5yZXBsYWNlKFwie2J9XCIsXCJ7YjB9XCIpLnJlcGxhY2UoXCJ7Y31cIixcIntjMH1cIikucmVwbGFjZShcInthMH1cIixhLm5hbWUpLnJlcGxhY2UoXCJ7YjB9XCIsby5uYW1lKS5yZXBsYWNlKFwie2MwfVwiLG8udmFsdWUpOnZvaWQgMDpvLm5hbWV9LGdldExhYmVsTGluZTpmdW5jdGlvbihlLHQsbixpLG8scyxyLGwsbSl7dmFyIFY9dGhpcy5zZXJpZXNbZV0sVT1WLmRhdGFbdF0sZD10aGlzLl9wYXJhbXNNYXBbZV0ubG9jYXRpb24scD1oLm1lcmdlKGguY2xvbmUoVS5pdGVtU3R5bGUpfHx7fSxWLml0ZW1TdHlsZSksYz1cIm5vcm1hbFwiLHU9cFtjXS5sYWJlbExpbmUseT1wW2NdLmxhYmVsTGluZS5sZW5ndGgsZz11LmxpbmVTdHlsZXx8e30sYj1wW2NdLmxhYmVsO2IucG9zaXRpb249Yi5wb3NpdGlvbnx8cC5ub3JtYWwubGFiZWwucG9zaXRpb247dmFyIGY9e3psZXZlbDp0aGlzLmdldFpsZXZlbEJhc2UoKSx6OnRoaXMuZ2V0WkJhc2UoKSsxLGhvdmVyYWJsZTohMSxzdHlsZTp7eFN0YXJ0OnRoaXMuX2dldExhYmVsTGluZVN0YXJ0UG9pbnQoaSxkLHMscixtKSx5U3RhcnQ6bytsLzIseEVuZDp0aGlzLl9nZXRMYWJlbFBvaW50KGIucG9zaXRpb24saSxkLHMscix5LG0pLHlFbmQ6bytsLzIsc3Ryb2tlQ29sb3I6Zy5jb2xvcnx8bixsaW5lVHlwZTpnLnR5cGUsbGluZVdpZHRoOmcud2lkdGh9fTtyZXR1cm4gYz1cImVtcGhhc2lzXCIsdT1wW2NdLmxhYmVsTGluZXx8dSx5PXBbY10ubGFiZWxMaW5lLmxlbmd0aHx8eSxnPXUubGluZVN0eWxlfHxnLGI9cFtjXS5sYWJlbHx8YixiLnBvc2l0aW9uPWIucG9zaXRpb24sZi5oaWdobGlnaHRTdHlsZT17eEVuZDp0aGlzLl9nZXRMYWJlbFBvaW50KGIucG9zaXRpb24saSxkLHMscix5LG0pLHN0cm9rZUNvbG9yOmcuY29sb3J8fG4sbGluZVR5cGU6Zy50eXBlLGxpbmVXaWR0aDpnLndpZHRofSxuZXcgYShmKX0sX2dldExhYmVsUG9pbnQ6ZnVuY3Rpb24oZSx0LG4saSxhLG8scyl7c3dpdGNoKGU9XCJpbm5lclwiPT09ZXx8XCJpbnNpZGVcIj09PWU/XCJjZW50ZXJcIjplKXtjYXNlXCJjZW50ZXJcIjpyZXR1cm5cImNlbnRlclwiPT1zP3QraS8yOlwibGVmdFwiPT1zP3QrMTA6dCtpLTEwO2Nhc2VcImxlZnRcIjpyZXR1cm5cImF1dG9cIj09PW8/bi54LTEwOlwiY2VudGVyXCI9PXM/bi5jZW50ZXJYLU1hdGgubWF4KGksYSkvMi1vOlwicmlnaHRcIj09cz90LShhPmk/YS1pOjApLW86bi54LW87ZGVmYXVsdDpyZXR1cm5cImF1dG9cIj09PW8/bi54K24ud2lkdGgrMTA6XCJjZW50ZXJcIj09cz9uLmNlbnRlclgrTWF0aC5tYXgoaSxhKS8yK286XCJyaWdodFwiPT1zP24ueCtuLndpZHRoK286dCtNYXRoLm1heChpLGEpK299fSxfZ2V0TGFiZWxMaW5lU3RhcnRQb2ludDpmdW5jdGlvbihlLHQsbixpLGEpe3JldHVyblwiY2VudGVyXCI9PWE/dC5jZW50ZXJYOmk+bj9lK01hdGgubWluKG4saSkvMjplK01hdGgubWF4KG4saSkvMn0sX25lZWRMYWJlbDpmdW5jdGlvbihlLHQsbil7cmV0dXJuIHRoaXMuZGVlcFF1ZXJ5KFt0LGVdLFwiaXRlbVN0eWxlLlwiKyhuP1wiZW1waGFzaXNcIjpcIm5vcm1hbFwiKStcIi5sYWJlbC5zaG93XCIpfSxfbmVlZExhYmVsTGluZTpmdW5jdGlvbihlLHQsbil7cmV0dXJuIHRoaXMuZGVlcFF1ZXJ5KFt0LGVdLFwiaXRlbVN0eWxlLlwiKyhuP1wiZW1waGFzaXNcIjpcIm5vcm1hbFwiKStcIi5sYWJlbExpbmUuc2hvd1wiKX0scmVmcmVzaDpmdW5jdGlvbihlKXtlJiYodGhpcy5vcHRpb249ZSx0aGlzLnNlcmllcz1lLnNlcmllcyksdGhpcy5iYWNrdXBTaGFwZUxpc3QoKSx0aGlzLl9idWlsZFNoYXBlKCl9fSxoLmluaGVyaXRzKHQsbiksZShcIi4uL2NoYXJ0XCIpLmRlZmluZShcImZ1bm5lbFwiLHQpLHR9KTsiXSwiZmlsZSI6InBsdWdpbnMvZWNoYXJ0cy9jaGFydC9mdW5uZWwuanMifQ==