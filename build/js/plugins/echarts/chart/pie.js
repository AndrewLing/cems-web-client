define("echarts/chart/pie",["require","./base","zrender/shape/Text","zrender/shape/Ring","zrender/shape/Circle","zrender/shape/Sector","zrender/shape/Polyline","../config","../util/ecData","zrender/tool/util","zrender/tool/math","zrender/tool/color","../chart"],function(e){function t(e,t,n,a,o){i.call(this,e,t,n,a,o);var s=this;s.shapeHandler.onmouseover=function(e){var t=e.target,i=h.get(t,"seriesIndex"),n=h.get(t,"dataIndex"),a=h.get(t,"special"),o=[t.style.x,t.style.y],r=t.style.startAngle,l=t.style.endAngle,d=((l+r)/2+360)%360,m=t.highlightStyle.color,c=s.getLabel(i,n,a,o,d,m,!0);c&&s.zr.addHoverShape(c);var p=s.getLabelLine(i,n,o,t.style.r0,t.style.r,d,m,!0);p&&s.zr.addHoverShape(p)},this.refresh(a)}var i=e("./base"),n=e("zrender/shape/Text"),a=e("zrender/shape/Ring"),o=e("zrender/shape/Circle"),s=e("zrender/shape/Sector"),r=e("zrender/shape/Polyline"),l=e("../config");l.pie={zlevel:0,z:2,clickable:!0,legendHoverLink:!0,center:["50%","50%"],radius:[0,"75%"],clockWise:!0,startAngle:90,minAngle:0,selectedOffset:10,itemStyle:{normal:{borderColor:"rgba(0,0,0,0)",borderWidth:1,label:{show:!0,position:"outer"},labelLine:{show:!0,length:20,lineStyle:{width:1,type:"solid"}}},emphasis:{borderColor:"rgba(0,0,0,0)",borderWidth:1,label:{show:!1},labelLine:{show:!1,length:20,lineStyle:{width:1,type:"solid"}}}}};var h=e("../util/ecData"),d=e("zrender/tool/util"),m=e("zrender/tool/math"),c=e("zrender/tool/color");return t.prototype={type:l.CHART_TYPE_PIE,_buildShape:function(){var e=this.series,t=this.component.legend;this.selectedMap={},this._selected={};var i,n,s;this._selectedMode=!1;for(var r,d=0,m=e.length;m>d;d++)if(e[d].type===l.CHART_TYPE_PIE){if(e[d]=this.reformOption(e[d]),this.legendHoverLink=e[d].legendHoverLink||this.legendHoverLink,r=e[d].name||"",this.selectedMap[r]=t?t.isSelected(r):!0,!this.selectedMap[r])continue;i=this.parseCenter(this.zr,e[d].center),n=this.parseRadius(this.zr,e[d].radius),this._selectedMode=this._selectedMode||e[d].selectedMode,this._selected[d]=[],this.deepQuery([e[d],this.option],"calculable")&&(s={zlevel:this.getZlevelBase(),z:this.getZBase(),hoverable:!1,style:{x:i[0],y:i[1],r0:n[0]<=10?0:n[0]-10,r:n[1]+10,brushType:"stroke",lineWidth:1,strokeColor:e[d].calculableHolderColor||this.ecTheme.calculableHolderColor||l.calculableHolderColor}},h.pack(s,e[d],d,void 0,-1),this.setCalculable(s),s=n[0]<=10?new o(s):new a(s),this.shapeList.push(s)),this._buildSinglePie(d),this.buildMark(d)}this.addShapeList()},_buildSinglePie:function(e){for(var t,i=this.series,n=i[e],a=n.data,o=this.component.legend,s=0,r=0,l=0,h=Number.NEGATIVE_INFINITY,d=[],m=0,c=a.length;c>m;m++)t=a[m].name,this.selectedMap[t]=o?o.isSelected(t):!0,this.selectedMap[t]&&!isNaN(a[m].value)&&(0!==+a[m].value?s++:r++,l+=+a[m].value,h=Math.max(h,+a[m].value));if(0!==l){for(var p,u,V,g,U,y,f=100,b=n.clockWise,_=(n.startAngle.toFixed(2)-0+360)%360,x=n.minAngle||.01,k=360-x*s-.01*r,L=n.roseType,m=0,c=a.length;c>m;m++)if(t=a[m].name,this.selectedMap[t]&&!isNaN(a[m].value)){if(u=o?o.getColor(t):this.zr.getColor(m),f=a[m].value/l,p="area"!=L?b?_-f*k-(0!==f?x:.01):f*k+_+(0!==f?x:.01):b?_-360/c:360/c+_,p=p.toFixed(2)-0,f=(100*f).toFixed(2),V=this.parseCenter(this.zr,n.center),g=this.parseRadius(this.zr,n.radius),U=+g[0],y=+g[1],"radius"===L?y=a[m].value/h*(y-U)*.8+.2*(y-U)+U:"area"===L&&(y=Math.sqrt(a[m].value/h)*(y-U)+U),b){var v;v=_,_=p,p=v}this._buildItem(d,e,m,f,a[m].selected,V,U,y,_,p,u),b||(_=p)}this._autoLabelLayout(d,V,y);for(var m=0,c=d.length;c>m;m++)this.shapeList.push(d[m]);d=null}},_buildItem:function(e,t,i,n,a,o,s,r,l,d,m){var c=this.series,p=((d+l)/2+360)%360,u=this.getSector(t,i,n,a,o,s,r,l,d,m);h.pack(u,c[t],t,c[t].data[i],i,c[t].data[i].name,n),e.push(u);var V=this.getLabel(t,i,n,o,p,m,!1),g=this.getLabelLine(t,i,o,s,r,p,m,!1);g&&(h.pack(g,c[t],t,c[t].data[i],i,c[t].data[i].name,n),e.push(g)),V&&(h.pack(V,c[t],t,c[t].data[i],i,c[t].data[i].name,n),V._labelLine=g,e.push(V))},getSector:function(e,t,i,n,a,o,r,l,h,d){var p=this.series,u=p[e],V=u.data[t],g=[V,u],U=this.deepMerge(g,"itemStyle.normal")||{},y=this.deepMerge(g,"itemStyle.emphasis")||{},f=this.getItemStyleColor(U.color,e,t,V)||d,b=this.getItemStyleColor(y.color,e,t,V)||("string"==typeof f?c.lift(f,-.2):f),_={zlevel:this.getZlevelBase(),z:this.getZBase(),clickable:this.deepQuery(g,"clickable"),style:{x:a[0],y:a[1],r0:o,r:r,startAngle:l,endAngle:h,brushType:"both",color:f,lineWidth:U.borderWidth,strokeColor:U.borderColor,lineJoin:"round"},highlightStyle:{color:b,lineWidth:y.borderWidth,strokeColor:y.borderColor,lineJoin:"round"},_seriesIndex:e,_dataIndex:t};if(n){var x=((_.style.startAngle+_.style.endAngle)/2).toFixed(2)-0;_.style._hasSelected=!0,_.style._x=_.style.x,_.style._y=_.style.y;var k=this.query(u,"selectedOffset");_.style.x+=m.cos(x,!0)*k,_.style.y-=m.sin(x,!0)*k,this._selected[e][t]=!0}else this._selected[e][t]=!1;return this._selectedMode&&(_.onclick=this.shapeHandler.onclick),this.deepQuery([V,u,this.option],"calculable")&&(this.setCalculable(_),_.draggable=!0),(this._needLabel(u,V,!0)||this._needLabelLine(u,V,!0))&&(_.onmouseover=this.shapeHandler.onmouseover),_=new s(_)},getLabel:function(e,t,i,a,o,s,r){var l=this.series,h=l[e],c=h.data[t];if(this._needLabel(h,c,r)){var p,u,V,g=r?"emphasis":"normal",U=d.merge(d.clone(c.itemStyle)||{},h.itemStyle),y=U[g].label,f=y.textStyle||{},b=a[0],_=a[1],x=this.parseRadius(this.zr,h.radius),k="middle";y.position=y.position||U.normal.label.position,"center"===y.position?(p=b,u=_,V="center"):"inner"===y.position||"inside"===y.position?(x=(x[0]+x[1])*(y.distance||.5),p=Math.round(b+x*m.cos(o,!0)),u=Math.round(_-x*m.sin(o,!0)),s="#fff",V="center"):(x=x[1]- -U[g].labelLine.length,p=Math.round(b+x*m.cos(o,!0)),u=Math.round(_-x*m.sin(o,!0)),V=o>=90&&270>=o?"right":"left"),"center"!=y.position&&"inner"!=y.position&&"inside"!=y.position&&(p+="left"===V?20:-20),c.__labelX=p-("left"===V?5:-5),c.__labelY=u;var L=new n({zlevel:this.getZlevelBase(),z:this.getZBase()+1,hoverable:!1,style:{x:p,y:u,color:f.color||s,text:this.getLabelText(e,t,i,g),textAlign:f.align||V,textBaseline:f.baseline||k,textFont:this.getFont(f)},highlightStyle:{brushType:"fill"}});return L._radius=x,L._labelPosition=y.position||"outer",L._rect=L.getRect(L.style),L._seriesIndex=e,L._dataIndex=t,L}},getLabelText:function(e,t,i,n){var a=this.series,o=a[e],s=o.data[t],r=this.deepQuery([s,o],"itemStyle."+n+".label.formatter");return r?"function"==typeof r?r.call(this.myChart,{seriesIndex:e,seriesName:o.name||"",series:o,dataIndex:t,data:s,name:s.name,value:s.value,percent:i}):"string"==typeof r?(r=r.replace("{a}","{a0}").replace("{b}","{b0}").replace("{c}","{c0}").replace("{d}","{d0}"),r=r.replace("{a0}",o.name).replace("{b0}",s.name).replace("{c0}",s.value).replace("{d0}",i)):void 0:s.name},getLabelLine:function(e,t,i,n,a,o,s,l){var h=this.series,c=h[e],p=c.data[t];if(this._needLabelLine(c,p,l)){var u=l?"emphasis":"normal",V=d.merge(d.clone(p.itemStyle)||{},c.itemStyle),g=V[u].labelLine,U=g.lineStyle||{},y=i[0],f=i[1],b=a,_=this.parseRadius(this.zr,c.radius)[1]- -g.length,x=m.cos(o,!0),k=m.sin(o,!0);return new r({zlevel:this.getZlevelBase(),z:this.getZBase()+1,hoverable:!1,style:{pointList:[[y+b*x,f-b*k],[y+_*x,f-_*k],[p.__labelX,p.__labelY]],strokeColor:U.color||s,lineType:U.type,lineWidth:U.width},_seriesIndex:e,_dataIndex:t})}},_needLabel:function(e,t,i){return this.deepQuery([t,e],"itemStyle."+(i?"emphasis":"normal")+".label.show")},_needLabelLine:function(e,t,i){return this.deepQuery([t,e],"itemStyle."+(i?"emphasis":"normal")+".labelLine.show")},_autoLabelLayout:function(e,t,i){for(var n=[],a=[],o=0,s=e.length;s>o;o++)("outer"===e[o]._labelPosition||"outside"===e[o]._labelPosition)&&(e[o]._rect._y=e[o]._rect.y,e[o]._rect.x<t[0]?n.push(e[o]):a.push(e[o]));this._layoutCalculate(n,t,i,-1),this._layoutCalculate(a,t,i,1)},_layoutCalculate:function(e,t,i,n){function a(t,i,n){for(var a=t;i>a;a++)if(e[a]._rect.y+=n,e[a].style.y+=n,e[a]._labelLine&&(e[a]._labelLine.style.pointList[1][1]+=n,e[a]._labelLine.style.pointList[2][1]+=n),a>t&&i>a+1&&e[a+1]._rect.y>e[a]._rect.y+e[a]._rect.height)return void o(a,n/2);o(i-1,n/2)}function o(t,i){for(var n=t;n>=0&&(e[n]._rect.y-=i,e[n].style.y-=i,e[n]._labelLine&&(e[n]._labelLine.style.pointList[1][1]-=i,e[n]._labelLine.style.pointList[2][1]-=i),!(n>0&&e[n]._rect.y>e[n-1]._rect.y+e[n-1]._rect.height));n--);}function s(e,t,i,n,a){for(var o,s,r,l=i[0],h=i[1],d=a>0?t?Number.MAX_VALUE:0:t?Number.MAX_VALUE:0,m=0,c=e.length;c>m;m++)s=Math.abs(e[m]._rect.y-h),r=e[m]._radius-n,o=n+r>s?Math.sqrt((n+r+20)*(n+r+20)-Math.pow(e[m]._rect.y-h,2)):Math.abs(e[m]._rect.x+(a>0?0:e[m]._rect.width)-l),t&&o>=d&&(o=d-10),!t&&d>=o&&(o=d+10),e[m]._rect.x=e[m].style.x=l+o*a,e[m]._labelLine&&(e[m]._labelLine.style.pointList[2][0]=l+(o-5)*a,e[m]._labelLine.style.pointList[1][0]=l+(o-20)*a),d=o}e.sort(function(e,t){return e._rect.y-t._rect.y});for(var r,l=0,h=e.length,d=[],m=[],c=0;h>c;c++)r=e[c]._rect.y-l,0>r&&a(c,h,-r,n),l=e[c]._rect.y+e[c]._rect.height;this.zr.getHeight()-l<0&&o(h-1,l-this.zr.getHeight());for(var c=0;h>c;c++)e[c]._rect.y>=t[1]?m.push(e[c]):d.push(e[c]);s(m,!0,t,i,n),s(d,!1,t,i,n)},reformOption:function(e){var t=d.merge;return e=t(t(e||{},d.clone(this.ecTheme.pie||{})),d.clone(l.pie)),e.itemStyle.normal.label.textStyle=this.getTextStyle(e.itemStyle.normal.label.textStyle),e.itemStyle.emphasis.label.textStyle=this.getTextStyle(e.itemStyle.emphasis.label.textStyle),e},refresh:function(e){e&&(this.option=e,this.series=e.series),this.backupShapeList(),this._buildShape()},addDataAnimation:function(e){for(var t=this.series,i={},n=0,a=e.length;a>n;n++)i[e[n][0]]=e[n];var o={},s={},r={},h=this.shapeList;this.shapeList=[];for(var d,m,c,p={},n=0,a=e.length;a>n;n++)d=e[n][0],m=e[n][2],c=e[n][3],t[d]&&t[d].type===l.CHART_TYPE_PIE&&(m?(c||(o[d+"_"+t[d].data.length]="delete"),p[d]=1):c?p[d]=0:(o[d+"_-1"]="delete",p[d]=-1),this._buildSinglePie(d));for(var u,V,n=0,a=this.shapeList.length;a>n;n++)switch(d=this.shapeList[n]._seriesIndex,u=this.shapeList[n]._dataIndex,V=d+"_"+u,this.shapeList[n].type){case"sector":o[V]=this.shapeList[n];break;case"text":s[V]=this.shapeList[n];break;case"polyline":r[V]=this.shapeList[n]}this.shapeList=[];for(var g,n=0,a=h.length;a>n;n++)if(d=h[n]._seriesIndex,i[d]){if(u=h[n]._dataIndex+p[d],V=d+"_"+u,g=o[V],!g)continue;if("sector"===h[n].type)"delete"!=g?this.zr.animate(h[n].id,"style").when(400,{startAngle:g.style.startAngle,endAngle:g.style.endAngle}).start():this.zr.animate(h[n].id,"style").when(400,p[d]<0?{startAngle:h[n].style.startAngle}:{endAngle:h[n].style.endAngle}).start();else if("text"===h[n].type||"polyline"===h[n].type)if("delete"===g)this.zr.delShape(h[n].id);else switch(h[n].type){case"text":g=s[V],this.zr.animate(h[n].id,"style").when(400,{x:g.style.x,y:g.style.y}).start();break;case"polyline":g=r[V],this.zr.animate(h[n].id,"style").when(400,{pointList:g.style.pointList}).start()}}this.shapeList=h},onclick:function(e){var t=this.series;if(this.isClick&&e.target){this.isClick=!1;for(var i,n=e.target,a=n.style,o=h.get(n,"seriesIndex"),s=h.get(n,"dataIndex"),r=0,d=this.shapeList.length;d>r;r++)if(this.shapeList[r].id===n.id){if(o=h.get(n,"seriesIndex"),s=h.get(n,"dataIndex"),a._hasSelected)n.style.x=n.style._x,n.style.y=n.style._y,n.style._hasSelected=!1,this._selected[o][s]=!1;else{var c=((a.startAngle+a.endAngle)/2).toFixed(2)-0;n.style._hasSelected=!0,this._selected[o][s]=!0,n.style._x=n.style.x,n.style._y=n.style.y,i=this.query(t[o],"selectedOffset"),n.style.x+=m.cos(c,!0)*i,n.style.y-=m.sin(c,!0)*i}this.zr.modShape(n.id,n)}else this.shapeList[r].style._hasSelected&&"single"===this._selectedMode&&(o=h.get(this.shapeList[r],"seriesIndex"),s=h.get(this.shapeList[r],"dataIndex"),this.shapeList[r].style.x=this.shapeList[r].style._x,this.shapeList[r].style.y=this.shapeList[r].style._y,this.shapeList[r].style._hasSelected=!1,this._selected[o][s]=!1,this.zr.modShape(this.shapeList[r].id,this.shapeList[r]));this.messageCenter.dispatch(l.EVENT.PIE_SELECTED,e.event,{selected:this._selected,target:h.get(n,"name")},this.myChart),this.zr.refreshNextFrame()}}},d.inherits(t,i),e("../chart").define("pie",t),t});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL2VjaGFydHMvY2hhcnQvcGllLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImRlZmluZShcImVjaGFydHMvY2hhcnQvcGllXCIsW1wicmVxdWlyZVwiLFwiLi9iYXNlXCIsXCJ6cmVuZGVyL3NoYXBlL1RleHRcIixcInpyZW5kZXIvc2hhcGUvUmluZ1wiLFwienJlbmRlci9zaGFwZS9DaXJjbGVcIixcInpyZW5kZXIvc2hhcGUvU2VjdG9yXCIsXCJ6cmVuZGVyL3NoYXBlL1BvbHlsaW5lXCIsXCIuLi9jb25maWdcIixcIi4uL3V0aWwvZWNEYXRhXCIsXCJ6cmVuZGVyL3Rvb2wvdXRpbFwiLFwienJlbmRlci90b29sL21hdGhcIixcInpyZW5kZXIvdG9vbC9jb2xvclwiLFwiLi4vY2hhcnRcIl0sZnVuY3Rpb24oZSl7ZnVuY3Rpb24gdChlLHQsbixhLG8pe2kuY2FsbCh0aGlzLGUsdCxuLGEsbyk7dmFyIHM9dGhpcztzLnNoYXBlSGFuZGxlci5vbm1vdXNlb3Zlcj1mdW5jdGlvbihlKXt2YXIgdD1lLnRhcmdldCxpPWguZ2V0KHQsXCJzZXJpZXNJbmRleFwiKSxuPWguZ2V0KHQsXCJkYXRhSW5kZXhcIiksYT1oLmdldCh0LFwic3BlY2lhbFwiKSxvPVt0LnN0eWxlLngsdC5zdHlsZS55XSxyPXQuc3R5bGUuc3RhcnRBbmdsZSxsPXQuc3R5bGUuZW5kQW5nbGUsZD0oKGwrcikvMiszNjApJTM2MCxtPXQuaGlnaGxpZ2h0U3R5bGUuY29sb3IsYz1zLmdldExhYmVsKGksbixhLG8sZCxtLCEwKTtjJiZzLnpyLmFkZEhvdmVyU2hhcGUoYyk7dmFyIHA9cy5nZXRMYWJlbExpbmUoaSxuLG8sdC5zdHlsZS5yMCx0LnN0eWxlLnIsZCxtLCEwKTtwJiZzLnpyLmFkZEhvdmVyU2hhcGUocCl9LHRoaXMucmVmcmVzaChhKX12YXIgaT1lKFwiLi9iYXNlXCIpLG49ZShcInpyZW5kZXIvc2hhcGUvVGV4dFwiKSxhPWUoXCJ6cmVuZGVyL3NoYXBlL1JpbmdcIiksbz1lKFwienJlbmRlci9zaGFwZS9DaXJjbGVcIikscz1lKFwienJlbmRlci9zaGFwZS9TZWN0b3JcIikscj1lKFwienJlbmRlci9zaGFwZS9Qb2x5bGluZVwiKSxsPWUoXCIuLi9jb25maWdcIik7bC5waWU9e3psZXZlbDowLHo6MixjbGlja2FibGU6ITAsbGVnZW5kSG92ZXJMaW5rOiEwLGNlbnRlcjpbXCI1MCVcIixcIjUwJVwiXSxyYWRpdXM6WzAsXCI3NSVcIl0sY2xvY2tXaXNlOiEwLHN0YXJ0QW5nbGU6OTAsbWluQW5nbGU6MCxzZWxlY3RlZE9mZnNldDoxMCxpdGVtU3R5bGU6e25vcm1hbDp7Ym9yZGVyQ29sb3I6XCJyZ2JhKDAsMCwwLDApXCIsYm9yZGVyV2lkdGg6MSxsYWJlbDp7c2hvdzohMCxwb3NpdGlvbjpcIm91dGVyXCJ9LGxhYmVsTGluZTp7c2hvdzohMCxsZW5ndGg6MjAsbGluZVN0eWxlOnt3aWR0aDoxLHR5cGU6XCJzb2xpZFwifX19LGVtcGhhc2lzOntib3JkZXJDb2xvcjpcInJnYmEoMCwwLDAsMClcIixib3JkZXJXaWR0aDoxLGxhYmVsOntzaG93OiExfSxsYWJlbExpbmU6e3Nob3c6ITEsbGVuZ3RoOjIwLGxpbmVTdHlsZTp7d2lkdGg6MSx0eXBlOlwic29saWRcIn19fX19O3ZhciBoPWUoXCIuLi91dGlsL2VjRGF0YVwiKSxkPWUoXCJ6cmVuZGVyL3Rvb2wvdXRpbFwiKSxtPWUoXCJ6cmVuZGVyL3Rvb2wvbWF0aFwiKSxjPWUoXCJ6cmVuZGVyL3Rvb2wvY29sb3JcIik7cmV0dXJuIHQucHJvdG90eXBlPXt0eXBlOmwuQ0hBUlRfVFlQRV9QSUUsX2J1aWxkU2hhcGU6ZnVuY3Rpb24oKXt2YXIgZT10aGlzLnNlcmllcyx0PXRoaXMuY29tcG9uZW50LmxlZ2VuZDt0aGlzLnNlbGVjdGVkTWFwPXt9LHRoaXMuX3NlbGVjdGVkPXt9O3ZhciBpLG4sczt0aGlzLl9zZWxlY3RlZE1vZGU9ITE7Zm9yKHZhciByLGQ9MCxtPWUubGVuZ3RoO20+ZDtkKyspaWYoZVtkXS50eXBlPT09bC5DSEFSVF9UWVBFX1BJRSl7aWYoZVtkXT10aGlzLnJlZm9ybU9wdGlvbihlW2RdKSx0aGlzLmxlZ2VuZEhvdmVyTGluaz1lW2RdLmxlZ2VuZEhvdmVyTGlua3x8dGhpcy5sZWdlbmRIb3Zlckxpbmsscj1lW2RdLm5hbWV8fFwiXCIsdGhpcy5zZWxlY3RlZE1hcFtyXT10P3QuaXNTZWxlY3RlZChyKTohMCwhdGhpcy5zZWxlY3RlZE1hcFtyXSljb250aW51ZTtpPXRoaXMucGFyc2VDZW50ZXIodGhpcy56cixlW2RdLmNlbnRlciksbj10aGlzLnBhcnNlUmFkaXVzKHRoaXMuenIsZVtkXS5yYWRpdXMpLHRoaXMuX3NlbGVjdGVkTW9kZT10aGlzLl9zZWxlY3RlZE1vZGV8fGVbZF0uc2VsZWN0ZWRNb2RlLHRoaXMuX3NlbGVjdGVkW2RdPVtdLHRoaXMuZGVlcFF1ZXJ5KFtlW2RdLHRoaXMub3B0aW9uXSxcImNhbGN1bGFibGVcIikmJihzPXt6bGV2ZWw6dGhpcy5nZXRabGV2ZWxCYXNlKCksejp0aGlzLmdldFpCYXNlKCksaG92ZXJhYmxlOiExLHN0eWxlOnt4OmlbMF0seTppWzFdLHIwOm5bMF08PTEwPzA6blswXS0xMCxyOm5bMV0rMTAsYnJ1c2hUeXBlOlwic3Ryb2tlXCIsbGluZVdpZHRoOjEsc3Ryb2tlQ29sb3I6ZVtkXS5jYWxjdWxhYmxlSG9sZGVyQ29sb3J8fHRoaXMuZWNUaGVtZS5jYWxjdWxhYmxlSG9sZGVyQ29sb3J8fGwuY2FsY3VsYWJsZUhvbGRlckNvbG9yfX0saC5wYWNrKHMsZVtkXSxkLHZvaWQgMCwtMSksdGhpcy5zZXRDYWxjdWxhYmxlKHMpLHM9blswXTw9MTA/bmV3IG8ocyk6bmV3IGEocyksdGhpcy5zaGFwZUxpc3QucHVzaChzKSksdGhpcy5fYnVpbGRTaW5nbGVQaWUoZCksdGhpcy5idWlsZE1hcmsoZCl9dGhpcy5hZGRTaGFwZUxpc3QoKX0sX2J1aWxkU2luZ2xlUGllOmZ1bmN0aW9uKGUpe2Zvcih2YXIgdCxpPXRoaXMuc2VyaWVzLG49aVtlXSxhPW4uZGF0YSxvPXRoaXMuY29tcG9uZW50LmxlZ2VuZCxzPTAscj0wLGw9MCxoPU51bWJlci5ORUdBVElWRV9JTkZJTklUWSxkPVtdLG09MCxjPWEubGVuZ3RoO2M+bTttKyspdD1hW21dLm5hbWUsdGhpcy5zZWxlY3RlZE1hcFt0XT1vP28uaXNTZWxlY3RlZCh0KTohMCx0aGlzLnNlbGVjdGVkTWFwW3RdJiYhaXNOYU4oYVttXS52YWx1ZSkmJigwIT09K2FbbV0udmFsdWU/cysrOnIrKyxsKz0rYVttXS52YWx1ZSxoPU1hdGgubWF4KGgsK2FbbV0udmFsdWUpKTtpZigwIT09bCl7Zm9yKHZhciBwLHUsVixnLFUseSxmPTEwMCxiPW4uY2xvY2tXaXNlLF89KG4uc3RhcnRBbmdsZS50b0ZpeGVkKDIpLTArMzYwKSUzNjAseD1uLm1pbkFuZ2xlfHwuMDEsaz0zNjAteCpzLS4wMSpyLEw9bi5yb3NlVHlwZSxtPTAsYz1hLmxlbmd0aDtjPm07bSsrKWlmKHQ9YVttXS5uYW1lLHRoaXMuc2VsZWN0ZWRNYXBbdF0mJiFpc05hTihhW21dLnZhbHVlKSl7aWYodT1vP28uZ2V0Q29sb3IodCk6dGhpcy56ci5nZXRDb2xvcihtKSxmPWFbbV0udmFsdWUvbCxwPVwiYXJlYVwiIT1MP2I/Xy1mKmstKDAhPT1mP3g6LjAxKTpmKmsrXysoMCE9PWY/eDouMDEpOmI/Xy0zNjAvYzozNjAvYytfLHA9cC50b0ZpeGVkKDIpLTAsZj0oMTAwKmYpLnRvRml4ZWQoMiksVj10aGlzLnBhcnNlQ2VudGVyKHRoaXMuenIsbi5jZW50ZXIpLGc9dGhpcy5wYXJzZVJhZGl1cyh0aGlzLnpyLG4ucmFkaXVzKSxVPStnWzBdLHk9K2dbMV0sXCJyYWRpdXNcIj09PUw/eT1hW21dLnZhbHVlL2gqKHktVSkqLjgrLjIqKHktVSkrVTpcImFyZWFcIj09PUwmJih5PU1hdGguc3FydChhW21dLnZhbHVlL2gpKih5LVUpK1UpLGIpe3ZhciB2O3Y9XyxfPXAscD12fXRoaXMuX2J1aWxkSXRlbShkLGUsbSxmLGFbbV0uc2VsZWN0ZWQsVixVLHksXyxwLHUpLGJ8fChfPXApfXRoaXMuX2F1dG9MYWJlbExheW91dChkLFYseSk7Zm9yKHZhciBtPTAsYz1kLmxlbmd0aDtjPm07bSsrKXRoaXMuc2hhcGVMaXN0LnB1c2goZFttXSk7ZD1udWxsfX0sX2J1aWxkSXRlbTpmdW5jdGlvbihlLHQsaSxuLGEsbyxzLHIsbCxkLG0pe3ZhciBjPXRoaXMuc2VyaWVzLHA9KChkK2wpLzIrMzYwKSUzNjAsdT10aGlzLmdldFNlY3Rvcih0LGksbixhLG8scyxyLGwsZCxtKTtoLnBhY2sodSxjW3RdLHQsY1t0XS5kYXRhW2ldLGksY1t0XS5kYXRhW2ldLm5hbWUsbiksZS5wdXNoKHUpO3ZhciBWPXRoaXMuZ2V0TGFiZWwodCxpLG4sbyxwLG0sITEpLGc9dGhpcy5nZXRMYWJlbExpbmUodCxpLG8scyxyLHAsbSwhMSk7ZyYmKGgucGFjayhnLGNbdF0sdCxjW3RdLmRhdGFbaV0saSxjW3RdLmRhdGFbaV0ubmFtZSxuKSxlLnB1c2goZykpLFYmJihoLnBhY2soVixjW3RdLHQsY1t0XS5kYXRhW2ldLGksY1t0XS5kYXRhW2ldLm5hbWUsbiksVi5fbGFiZWxMaW5lPWcsZS5wdXNoKFYpKX0sZ2V0U2VjdG9yOmZ1bmN0aW9uKGUsdCxpLG4sYSxvLHIsbCxoLGQpe3ZhciBwPXRoaXMuc2VyaWVzLHU9cFtlXSxWPXUuZGF0YVt0XSxnPVtWLHVdLFU9dGhpcy5kZWVwTWVyZ2UoZyxcIml0ZW1TdHlsZS5ub3JtYWxcIil8fHt9LHk9dGhpcy5kZWVwTWVyZ2UoZyxcIml0ZW1TdHlsZS5lbXBoYXNpc1wiKXx8e30sZj10aGlzLmdldEl0ZW1TdHlsZUNvbG9yKFUuY29sb3IsZSx0LFYpfHxkLGI9dGhpcy5nZXRJdGVtU3R5bGVDb2xvcih5LmNvbG9yLGUsdCxWKXx8KFwic3RyaW5nXCI9PXR5cGVvZiBmP2MubGlmdChmLC0uMik6ZiksXz17emxldmVsOnRoaXMuZ2V0WmxldmVsQmFzZSgpLHo6dGhpcy5nZXRaQmFzZSgpLGNsaWNrYWJsZTp0aGlzLmRlZXBRdWVyeShnLFwiY2xpY2thYmxlXCIpLHN0eWxlOnt4OmFbMF0seTphWzFdLHIwOm8scjpyLHN0YXJ0QW5nbGU6bCxlbmRBbmdsZTpoLGJydXNoVHlwZTpcImJvdGhcIixjb2xvcjpmLGxpbmVXaWR0aDpVLmJvcmRlcldpZHRoLHN0cm9rZUNvbG9yOlUuYm9yZGVyQ29sb3IsbGluZUpvaW46XCJyb3VuZFwifSxoaWdobGlnaHRTdHlsZTp7Y29sb3I6YixsaW5lV2lkdGg6eS5ib3JkZXJXaWR0aCxzdHJva2VDb2xvcjp5LmJvcmRlckNvbG9yLGxpbmVKb2luOlwicm91bmRcIn0sX3Nlcmllc0luZGV4OmUsX2RhdGFJbmRleDp0fTtpZihuKXt2YXIgeD0oKF8uc3R5bGUuc3RhcnRBbmdsZStfLnN0eWxlLmVuZEFuZ2xlKS8yKS50b0ZpeGVkKDIpLTA7Xy5zdHlsZS5faGFzU2VsZWN0ZWQ9ITAsXy5zdHlsZS5feD1fLnN0eWxlLngsXy5zdHlsZS5feT1fLnN0eWxlLnk7dmFyIGs9dGhpcy5xdWVyeSh1LFwic2VsZWN0ZWRPZmZzZXRcIik7Xy5zdHlsZS54Kz1tLmNvcyh4LCEwKSprLF8uc3R5bGUueS09bS5zaW4oeCwhMCkqayx0aGlzLl9zZWxlY3RlZFtlXVt0XT0hMH1lbHNlIHRoaXMuX3NlbGVjdGVkW2VdW3RdPSExO3JldHVybiB0aGlzLl9zZWxlY3RlZE1vZGUmJihfLm9uY2xpY2s9dGhpcy5zaGFwZUhhbmRsZXIub25jbGljayksdGhpcy5kZWVwUXVlcnkoW1YsdSx0aGlzLm9wdGlvbl0sXCJjYWxjdWxhYmxlXCIpJiYodGhpcy5zZXRDYWxjdWxhYmxlKF8pLF8uZHJhZ2dhYmxlPSEwKSwodGhpcy5fbmVlZExhYmVsKHUsViwhMCl8fHRoaXMuX25lZWRMYWJlbExpbmUodSxWLCEwKSkmJihfLm9ubW91c2VvdmVyPXRoaXMuc2hhcGVIYW5kbGVyLm9ubW91c2VvdmVyKSxfPW5ldyBzKF8pfSxnZXRMYWJlbDpmdW5jdGlvbihlLHQsaSxhLG8scyxyKXt2YXIgbD10aGlzLnNlcmllcyxoPWxbZV0sYz1oLmRhdGFbdF07aWYodGhpcy5fbmVlZExhYmVsKGgsYyxyKSl7dmFyIHAsdSxWLGc9cj9cImVtcGhhc2lzXCI6XCJub3JtYWxcIixVPWQubWVyZ2UoZC5jbG9uZShjLml0ZW1TdHlsZSl8fHt9LGguaXRlbVN0eWxlKSx5PVVbZ10ubGFiZWwsZj15LnRleHRTdHlsZXx8e30sYj1hWzBdLF89YVsxXSx4PXRoaXMucGFyc2VSYWRpdXModGhpcy56cixoLnJhZGl1cyksaz1cIm1pZGRsZVwiO3kucG9zaXRpb249eS5wb3NpdGlvbnx8VS5ub3JtYWwubGFiZWwucG9zaXRpb24sXCJjZW50ZXJcIj09PXkucG9zaXRpb24/KHA9Yix1PV8sVj1cImNlbnRlclwiKTpcImlubmVyXCI9PT15LnBvc2l0aW9ufHxcImluc2lkZVwiPT09eS5wb3NpdGlvbj8oeD0oeFswXSt4WzFdKSooeS5kaXN0YW5jZXx8LjUpLHA9TWF0aC5yb3VuZChiK3gqbS5jb3MobywhMCkpLHU9TWF0aC5yb3VuZChfLXgqbS5zaW4obywhMCkpLHM9XCIjZmZmXCIsVj1cImNlbnRlclwiKTooeD14WzFdLSAtVVtnXS5sYWJlbExpbmUubGVuZ3RoLHA9TWF0aC5yb3VuZChiK3gqbS5jb3MobywhMCkpLHU9TWF0aC5yb3VuZChfLXgqbS5zaW4obywhMCkpLFY9bz49OTAmJjI3MD49bz9cInJpZ2h0XCI6XCJsZWZ0XCIpLFwiY2VudGVyXCIhPXkucG9zaXRpb24mJlwiaW5uZXJcIiE9eS5wb3NpdGlvbiYmXCJpbnNpZGVcIiE9eS5wb3NpdGlvbiYmKHArPVwibGVmdFwiPT09Vj8yMDotMjApLGMuX19sYWJlbFg9cC0oXCJsZWZ0XCI9PT1WPzU6LTUpLGMuX19sYWJlbFk9dTt2YXIgTD1uZXcgbih7emxldmVsOnRoaXMuZ2V0WmxldmVsQmFzZSgpLHo6dGhpcy5nZXRaQmFzZSgpKzEsaG92ZXJhYmxlOiExLHN0eWxlOnt4OnAseTp1LGNvbG9yOmYuY29sb3J8fHMsdGV4dDp0aGlzLmdldExhYmVsVGV4dChlLHQsaSxnKSx0ZXh0QWxpZ246Zi5hbGlnbnx8Vix0ZXh0QmFzZWxpbmU6Zi5iYXNlbGluZXx8ayx0ZXh0Rm9udDp0aGlzLmdldEZvbnQoZil9LGhpZ2hsaWdodFN0eWxlOnticnVzaFR5cGU6XCJmaWxsXCJ9fSk7cmV0dXJuIEwuX3JhZGl1cz14LEwuX2xhYmVsUG9zaXRpb249eS5wb3NpdGlvbnx8XCJvdXRlclwiLEwuX3JlY3Q9TC5nZXRSZWN0KEwuc3R5bGUpLEwuX3Nlcmllc0luZGV4PWUsTC5fZGF0YUluZGV4PXQsTH19LGdldExhYmVsVGV4dDpmdW5jdGlvbihlLHQsaSxuKXt2YXIgYT10aGlzLnNlcmllcyxvPWFbZV0scz1vLmRhdGFbdF0scj10aGlzLmRlZXBRdWVyeShbcyxvXSxcIml0ZW1TdHlsZS5cIituK1wiLmxhYmVsLmZvcm1hdHRlclwiKTtyZXR1cm4gcj9cImZ1bmN0aW9uXCI9PXR5cGVvZiByP3IuY2FsbCh0aGlzLm15Q2hhcnQse3Nlcmllc0luZGV4OmUsc2VyaWVzTmFtZTpvLm5hbWV8fFwiXCIsc2VyaWVzOm8sZGF0YUluZGV4OnQsZGF0YTpzLG5hbWU6cy5uYW1lLHZhbHVlOnMudmFsdWUscGVyY2VudDppfSk6XCJzdHJpbmdcIj09dHlwZW9mIHI/KHI9ci5yZXBsYWNlKFwie2F9XCIsXCJ7YTB9XCIpLnJlcGxhY2UoXCJ7Yn1cIixcIntiMH1cIikucmVwbGFjZShcIntjfVwiLFwie2MwfVwiKS5yZXBsYWNlKFwie2R9XCIsXCJ7ZDB9XCIpLHI9ci5yZXBsYWNlKFwie2EwfVwiLG8ubmFtZSkucmVwbGFjZShcIntiMH1cIixzLm5hbWUpLnJlcGxhY2UoXCJ7YzB9XCIscy52YWx1ZSkucmVwbGFjZShcIntkMH1cIixpKSk6dm9pZCAwOnMubmFtZX0sZ2V0TGFiZWxMaW5lOmZ1bmN0aW9uKGUsdCxpLG4sYSxvLHMsbCl7dmFyIGg9dGhpcy5zZXJpZXMsYz1oW2VdLHA9Yy5kYXRhW3RdO2lmKHRoaXMuX25lZWRMYWJlbExpbmUoYyxwLGwpKXt2YXIgdT1sP1wiZW1waGFzaXNcIjpcIm5vcm1hbFwiLFY9ZC5tZXJnZShkLmNsb25lKHAuaXRlbVN0eWxlKXx8e30sYy5pdGVtU3R5bGUpLGc9Vlt1XS5sYWJlbExpbmUsVT1nLmxpbmVTdHlsZXx8e30seT1pWzBdLGY9aVsxXSxiPWEsXz10aGlzLnBhcnNlUmFkaXVzKHRoaXMuenIsYy5yYWRpdXMpWzFdLSAtZy5sZW5ndGgseD1tLmNvcyhvLCEwKSxrPW0uc2luKG8sITApO3JldHVybiBuZXcgcih7emxldmVsOnRoaXMuZ2V0WmxldmVsQmFzZSgpLHo6dGhpcy5nZXRaQmFzZSgpKzEsaG92ZXJhYmxlOiExLHN0eWxlOntwb2ludExpc3Q6W1t5K2IqeCxmLWIqa10sW3krXyp4LGYtXyprXSxbcC5fX2xhYmVsWCxwLl9fbGFiZWxZXV0sc3Ryb2tlQ29sb3I6VS5jb2xvcnx8cyxsaW5lVHlwZTpVLnR5cGUsbGluZVdpZHRoOlUud2lkdGh9LF9zZXJpZXNJbmRleDplLF9kYXRhSW5kZXg6dH0pfX0sX25lZWRMYWJlbDpmdW5jdGlvbihlLHQsaSl7cmV0dXJuIHRoaXMuZGVlcFF1ZXJ5KFt0LGVdLFwiaXRlbVN0eWxlLlwiKyhpP1wiZW1waGFzaXNcIjpcIm5vcm1hbFwiKStcIi5sYWJlbC5zaG93XCIpfSxfbmVlZExhYmVsTGluZTpmdW5jdGlvbihlLHQsaSl7cmV0dXJuIHRoaXMuZGVlcFF1ZXJ5KFt0LGVdLFwiaXRlbVN0eWxlLlwiKyhpP1wiZW1waGFzaXNcIjpcIm5vcm1hbFwiKStcIi5sYWJlbExpbmUuc2hvd1wiKX0sX2F1dG9MYWJlbExheW91dDpmdW5jdGlvbihlLHQsaSl7Zm9yKHZhciBuPVtdLGE9W10sbz0wLHM9ZS5sZW5ndGg7cz5vO28rKykoXCJvdXRlclwiPT09ZVtvXS5fbGFiZWxQb3NpdGlvbnx8XCJvdXRzaWRlXCI9PT1lW29dLl9sYWJlbFBvc2l0aW9uKSYmKGVbb10uX3JlY3QuX3k9ZVtvXS5fcmVjdC55LGVbb10uX3JlY3QueDx0WzBdP24ucHVzaChlW29dKTphLnB1c2goZVtvXSkpO3RoaXMuX2xheW91dENhbGN1bGF0ZShuLHQsaSwtMSksdGhpcy5fbGF5b3V0Q2FsY3VsYXRlKGEsdCxpLDEpfSxfbGF5b3V0Q2FsY3VsYXRlOmZ1bmN0aW9uKGUsdCxpLG4pe2Z1bmN0aW9uIGEodCxpLG4pe2Zvcih2YXIgYT10O2k+YTthKyspaWYoZVthXS5fcmVjdC55Kz1uLGVbYV0uc3R5bGUueSs9bixlW2FdLl9sYWJlbExpbmUmJihlW2FdLl9sYWJlbExpbmUuc3R5bGUucG9pbnRMaXN0WzFdWzFdKz1uLGVbYV0uX2xhYmVsTGluZS5zdHlsZS5wb2ludExpc3RbMl1bMV0rPW4pLGE+dCYmaT5hKzEmJmVbYSsxXS5fcmVjdC55PmVbYV0uX3JlY3QueStlW2FdLl9yZWN0LmhlaWdodClyZXR1cm4gdm9pZCBvKGEsbi8yKTtvKGktMSxuLzIpfWZ1bmN0aW9uIG8odCxpKXtmb3IodmFyIG49dDtuPj0wJiYoZVtuXS5fcmVjdC55LT1pLGVbbl0uc3R5bGUueS09aSxlW25dLl9sYWJlbExpbmUmJihlW25dLl9sYWJlbExpbmUuc3R5bGUucG9pbnRMaXN0WzFdWzFdLT1pLGVbbl0uX2xhYmVsTGluZS5zdHlsZS5wb2ludExpc3RbMl1bMV0tPWkpLCEobj4wJiZlW25dLl9yZWN0Lnk+ZVtuLTFdLl9yZWN0LnkrZVtuLTFdLl9yZWN0LmhlaWdodCkpO24tLSk7fWZ1bmN0aW9uIHMoZSx0LGksbixhKXtmb3IodmFyIG8scyxyLGw9aVswXSxoPWlbMV0sZD1hPjA/dD9OdW1iZXIuTUFYX1ZBTFVFOjA6dD9OdW1iZXIuTUFYX1ZBTFVFOjAsbT0wLGM9ZS5sZW5ndGg7Yz5tO20rKylzPU1hdGguYWJzKGVbbV0uX3JlY3QueS1oKSxyPWVbbV0uX3JhZGl1cy1uLG89bityPnM/TWF0aC5zcXJ0KChuK3IrMjApKihuK3IrMjApLU1hdGgucG93KGVbbV0uX3JlY3QueS1oLDIpKTpNYXRoLmFicyhlW21dLl9yZWN0LngrKGE+MD8wOmVbbV0uX3JlY3Qud2lkdGgpLWwpLHQmJm8+PWQmJihvPWQtMTApLCF0JiZkPj1vJiYobz1kKzEwKSxlW21dLl9yZWN0Lng9ZVttXS5zdHlsZS54PWwrbyphLGVbbV0uX2xhYmVsTGluZSYmKGVbbV0uX2xhYmVsTGluZS5zdHlsZS5wb2ludExpc3RbMl1bMF09bCsoby01KSphLGVbbV0uX2xhYmVsTGluZS5zdHlsZS5wb2ludExpc3RbMV1bMF09bCsoby0yMCkqYSksZD1vfWUuc29ydChmdW5jdGlvbihlLHQpe3JldHVybiBlLl9yZWN0LnktdC5fcmVjdC55fSk7Zm9yKHZhciByLGw9MCxoPWUubGVuZ3RoLGQ9W10sbT1bXSxjPTA7aD5jO2MrKylyPWVbY10uX3JlY3QueS1sLDA+ciYmYShjLGgsLXIsbiksbD1lW2NdLl9yZWN0LnkrZVtjXS5fcmVjdC5oZWlnaHQ7dGhpcy56ci5nZXRIZWlnaHQoKS1sPDAmJm8oaC0xLGwtdGhpcy56ci5nZXRIZWlnaHQoKSk7Zm9yKHZhciBjPTA7aD5jO2MrKyllW2NdLl9yZWN0Lnk+PXRbMV0/bS5wdXNoKGVbY10pOmQucHVzaChlW2NdKTtzKG0sITAsdCxpLG4pLHMoZCwhMSx0LGksbil9LHJlZm9ybU9wdGlvbjpmdW5jdGlvbihlKXt2YXIgdD1kLm1lcmdlO3JldHVybiBlPXQodChlfHx7fSxkLmNsb25lKHRoaXMuZWNUaGVtZS5waWV8fHt9KSksZC5jbG9uZShsLnBpZSkpLGUuaXRlbVN0eWxlLm5vcm1hbC5sYWJlbC50ZXh0U3R5bGU9dGhpcy5nZXRUZXh0U3R5bGUoZS5pdGVtU3R5bGUubm9ybWFsLmxhYmVsLnRleHRTdHlsZSksZS5pdGVtU3R5bGUuZW1waGFzaXMubGFiZWwudGV4dFN0eWxlPXRoaXMuZ2V0VGV4dFN0eWxlKGUuaXRlbVN0eWxlLmVtcGhhc2lzLmxhYmVsLnRleHRTdHlsZSksZX0scmVmcmVzaDpmdW5jdGlvbihlKXtlJiYodGhpcy5vcHRpb249ZSx0aGlzLnNlcmllcz1lLnNlcmllcyksdGhpcy5iYWNrdXBTaGFwZUxpc3QoKSx0aGlzLl9idWlsZFNoYXBlKCl9LGFkZERhdGFBbmltYXRpb246ZnVuY3Rpb24oZSl7Zm9yKHZhciB0PXRoaXMuc2VyaWVzLGk9e30sbj0wLGE9ZS5sZW5ndGg7YT5uO24rKylpW2Vbbl1bMF1dPWVbbl07dmFyIG89e30scz17fSxyPXt9LGg9dGhpcy5zaGFwZUxpc3Q7dGhpcy5zaGFwZUxpc3Q9W107Zm9yKHZhciBkLG0sYyxwPXt9LG49MCxhPWUubGVuZ3RoO2E+bjtuKyspZD1lW25dWzBdLG09ZVtuXVsyXSxjPWVbbl1bM10sdFtkXSYmdFtkXS50eXBlPT09bC5DSEFSVF9UWVBFX1BJRSYmKG0/KGN8fChvW2QrXCJfXCIrdFtkXS5kYXRhLmxlbmd0aF09XCJkZWxldGVcIikscFtkXT0xKTpjP3BbZF09MDoob1tkK1wiXy0xXCJdPVwiZGVsZXRlXCIscFtkXT0tMSksdGhpcy5fYnVpbGRTaW5nbGVQaWUoZCkpO2Zvcih2YXIgdSxWLG49MCxhPXRoaXMuc2hhcGVMaXN0Lmxlbmd0aDthPm47bisrKXN3aXRjaChkPXRoaXMuc2hhcGVMaXN0W25dLl9zZXJpZXNJbmRleCx1PXRoaXMuc2hhcGVMaXN0W25dLl9kYXRhSW5kZXgsVj1kK1wiX1wiK3UsdGhpcy5zaGFwZUxpc3Rbbl0udHlwZSl7Y2FzZVwic2VjdG9yXCI6b1tWXT10aGlzLnNoYXBlTGlzdFtuXTticmVhaztjYXNlXCJ0ZXh0XCI6c1tWXT10aGlzLnNoYXBlTGlzdFtuXTticmVhaztjYXNlXCJwb2x5bGluZVwiOnJbVl09dGhpcy5zaGFwZUxpc3Rbbl19dGhpcy5zaGFwZUxpc3Q9W107Zm9yKHZhciBnLG49MCxhPWgubGVuZ3RoO2E+bjtuKyspaWYoZD1oW25dLl9zZXJpZXNJbmRleCxpW2RdKXtpZih1PWhbbl0uX2RhdGFJbmRleCtwW2RdLFY9ZCtcIl9cIit1LGc9b1tWXSwhZyljb250aW51ZTtpZihcInNlY3RvclwiPT09aFtuXS50eXBlKVwiZGVsZXRlXCIhPWc/dGhpcy56ci5hbmltYXRlKGhbbl0uaWQsXCJzdHlsZVwiKS53aGVuKDQwMCx7c3RhcnRBbmdsZTpnLnN0eWxlLnN0YXJ0QW5nbGUsZW5kQW5nbGU6Zy5zdHlsZS5lbmRBbmdsZX0pLnN0YXJ0KCk6dGhpcy56ci5hbmltYXRlKGhbbl0uaWQsXCJzdHlsZVwiKS53aGVuKDQwMCxwW2RdPDA/e3N0YXJ0QW5nbGU6aFtuXS5zdHlsZS5zdGFydEFuZ2xlfTp7ZW5kQW5nbGU6aFtuXS5zdHlsZS5lbmRBbmdsZX0pLnN0YXJ0KCk7ZWxzZSBpZihcInRleHRcIj09PWhbbl0udHlwZXx8XCJwb2x5bGluZVwiPT09aFtuXS50eXBlKWlmKFwiZGVsZXRlXCI9PT1nKXRoaXMuenIuZGVsU2hhcGUoaFtuXS5pZCk7ZWxzZSBzd2l0Y2goaFtuXS50eXBlKXtjYXNlXCJ0ZXh0XCI6Zz1zW1ZdLHRoaXMuenIuYW5pbWF0ZShoW25dLmlkLFwic3R5bGVcIikud2hlbig0MDAse3g6Zy5zdHlsZS54LHk6Zy5zdHlsZS55fSkuc3RhcnQoKTticmVhaztjYXNlXCJwb2x5bGluZVwiOmc9cltWXSx0aGlzLnpyLmFuaW1hdGUoaFtuXS5pZCxcInN0eWxlXCIpLndoZW4oNDAwLHtwb2ludExpc3Q6Zy5zdHlsZS5wb2ludExpc3R9KS5zdGFydCgpfX10aGlzLnNoYXBlTGlzdD1ofSxvbmNsaWNrOmZ1bmN0aW9uKGUpe3ZhciB0PXRoaXMuc2VyaWVzO2lmKHRoaXMuaXNDbGljayYmZS50YXJnZXQpe3RoaXMuaXNDbGljaz0hMTtmb3IodmFyIGksbj1lLnRhcmdldCxhPW4uc3R5bGUsbz1oLmdldChuLFwic2VyaWVzSW5kZXhcIikscz1oLmdldChuLFwiZGF0YUluZGV4XCIpLHI9MCxkPXRoaXMuc2hhcGVMaXN0Lmxlbmd0aDtkPnI7cisrKWlmKHRoaXMuc2hhcGVMaXN0W3JdLmlkPT09bi5pZCl7aWYobz1oLmdldChuLFwic2VyaWVzSW5kZXhcIikscz1oLmdldChuLFwiZGF0YUluZGV4XCIpLGEuX2hhc1NlbGVjdGVkKW4uc3R5bGUueD1uLnN0eWxlLl94LG4uc3R5bGUueT1uLnN0eWxlLl95LG4uc3R5bGUuX2hhc1NlbGVjdGVkPSExLHRoaXMuX3NlbGVjdGVkW29dW3NdPSExO2Vsc2V7dmFyIGM9KChhLnN0YXJ0QW5nbGUrYS5lbmRBbmdsZSkvMikudG9GaXhlZCgyKS0wO24uc3R5bGUuX2hhc1NlbGVjdGVkPSEwLHRoaXMuX3NlbGVjdGVkW29dW3NdPSEwLG4uc3R5bGUuX3g9bi5zdHlsZS54LG4uc3R5bGUuX3k9bi5zdHlsZS55LGk9dGhpcy5xdWVyeSh0W29dLFwic2VsZWN0ZWRPZmZzZXRcIiksbi5zdHlsZS54Kz1tLmNvcyhjLCEwKSppLG4uc3R5bGUueS09bS5zaW4oYywhMCkqaX10aGlzLnpyLm1vZFNoYXBlKG4uaWQsbil9ZWxzZSB0aGlzLnNoYXBlTGlzdFtyXS5zdHlsZS5faGFzU2VsZWN0ZWQmJlwic2luZ2xlXCI9PT10aGlzLl9zZWxlY3RlZE1vZGUmJihvPWguZ2V0KHRoaXMuc2hhcGVMaXN0W3JdLFwic2VyaWVzSW5kZXhcIikscz1oLmdldCh0aGlzLnNoYXBlTGlzdFtyXSxcImRhdGFJbmRleFwiKSx0aGlzLnNoYXBlTGlzdFtyXS5zdHlsZS54PXRoaXMuc2hhcGVMaXN0W3JdLnN0eWxlLl94LHRoaXMuc2hhcGVMaXN0W3JdLnN0eWxlLnk9dGhpcy5zaGFwZUxpc3Rbcl0uc3R5bGUuX3ksdGhpcy5zaGFwZUxpc3Rbcl0uc3R5bGUuX2hhc1NlbGVjdGVkPSExLHRoaXMuX3NlbGVjdGVkW29dW3NdPSExLHRoaXMuenIubW9kU2hhcGUodGhpcy5zaGFwZUxpc3Rbcl0uaWQsdGhpcy5zaGFwZUxpc3Rbcl0pKTt0aGlzLm1lc3NhZ2VDZW50ZXIuZGlzcGF0Y2gobC5FVkVOVC5QSUVfU0VMRUNURUQsZS5ldmVudCx7c2VsZWN0ZWQ6dGhpcy5fc2VsZWN0ZWQsdGFyZ2V0OmguZ2V0KG4sXCJuYW1lXCIpfSx0aGlzLm15Q2hhcnQpLHRoaXMuenIucmVmcmVzaE5leHRGcmFtZSgpfX19LGQuaW5oZXJpdHModCxpKSxlKFwiLi4vY2hhcnRcIikuZGVmaW5lKFwicGllXCIsdCksdH0pOyJdLCJmaWxlIjoicGx1Z2lucy9lY2hhcnRzL2NoYXJ0L3BpZS5qcyJ9
