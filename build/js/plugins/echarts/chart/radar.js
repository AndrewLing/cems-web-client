define("echarts/chart/radar",["require","./base","zrender/shape/Polygon","../component/polar","../config","../util/ecData","zrender/tool/util","zrender/tool/color","../util/accMath","../chart"],function(e){function t(e,t,n,a,o){i.call(this,e,t,n,a,o),this.refresh(a)}var i=e("./base"),n=e("zrender/shape/Polygon");e("../component/polar");var a=e("../config");a.radar={zlevel:0,z:2,clickable:!0,legendHoverLink:!0,polarIndex:0,itemStyle:{normal:{label:{show:!1},lineStyle:{width:2,type:"solid"}},emphasis:{label:{show:!1}}},symbolSize:2};var o=e("../util/ecData"),s=e("zrender/tool/util"),r=e("zrender/tool/color");return t.prototype={type:a.CHART_TYPE_RADAR,_buildShape:function(){this.selectedMap={},this._symbol=this.option.symbolList,this._queryTarget,this._dropBoxList=[],this._radarDataCounter=0;for(var e,t=this.series,i=this.component.legend,n=0,o=t.length;o>n;n++)t[n].type===a.CHART_TYPE_RADAR&&(this.serie=this.reformOption(t[n]),this.legendHoverLink=t[n].legendHoverLink||this.legendHoverLink,e=this.serie.name||"",this.selectedMap[e]=i?i.isSelected(e):!0,this.selectedMap[e]&&(this._queryTarget=[this.serie,this.option],this.deepQuery(this._queryTarget,"calculable")&&this._addDropBox(n),this._buildSingleRadar(n),this.buildMark(n)));this.addShapeList()},_buildSingleRadar:function(e){for(var t,i,n,a,o=this.component.legend,s=this.serie.data,r=this.deepQuery(this._queryTarget,"calculable"),l=0;l<s.length;l++)n=s[l].name||"",this.selectedMap[n]=o?o.isSelected(n):!0,this.selectedMap[n]&&(o?(i=o.getColor(n),t=o.getItemShape(n),t&&(t.style.brushType=this.deepQuery([s[l],this.serie],"itemStyle.normal.areaStyle")?"both":"stroke",o.setItemShape(n,t))):i=this.zr.getColor(l),a=this._getPointList(this.serie.polarIndex,s[l]),this._addSymbol(a,i,l,e,this.serie.polarIndex),this._addDataShape(a,i,s[l],e,l,r),this._radarDataCounter++)},_getPointList:function(e,t){for(var i,n,a=[],o=this.component.polar,s=0,r=t.value.length;r>s;s++)n=this.getDataFromOption(t.value[s]),i="-"!=n?o.getVector(e,s,n):!1,i&&a.push(i);return a},_addSymbol:function(e,t,i,n,a){for(var s,r=this.series,l=this.component.polar,h=0,d=e.length;d>h;h++)s=this.getSymbolShape(this.deepMerge([r[n].data[i],r[n]]),n,r[n].data[i].value[h],h,l.getIndicatorText(a,h),e[h][0],e[h][1],this._symbol[this._radarDataCounter%this._symbol.length],t,"#fff","vertical"),s.zlevel=this.getZlevelBase(),s.z=this.getZBase()+1,o.set(s,"data",r[n].data[i]),o.set(s,"value",r[n].data[i].value),o.set(s,"dataIndex",i),o.set(s,"special",h),this.shapeList.push(s)},_addDataShape:function(e,t,i,a,s,l){var h=this.series,d=[i,this.serie],m=this.getItemStyleColor(this.deepQuery(d,"itemStyle.normal.color"),a,s,i),c=this.deepQuery(d,"itemStyle.normal.lineStyle.width"),p=this.deepQuery(d,"itemStyle.normal.lineStyle.type"),u=this.deepQuery(d,"itemStyle.normal.areaStyle.color"),V=this.deepQuery(d,"itemStyle.normal.areaStyle"),g={zlevel:this.getZlevelBase(),z:this.getZBase(),style:{pointList:e,brushType:V?"both":"stroke",color:u||m||("string"==typeof t?r.alpha(t,.5):t),strokeColor:m||t,lineWidth:c,lineType:p},highlightStyle:{brushType:this.deepQuery(d,"itemStyle.emphasis.areaStyle")||V?"both":"stroke",color:this.deepQuery(d,"itemStyle.emphasis.areaStyle.color")||u||m||("string"==typeof t?r.alpha(t,.5):t),strokeColor:this.getItemStyleColor(this.deepQuery(d,"itemStyle.emphasis.color"),a,s,i)||m||t,lineWidth:this.deepQuery(d,"itemStyle.emphasis.lineStyle.width")||c,lineType:this.deepQuery(d,"itemStyle.emphasis.lineStyle.type")||p}};o.pack(g,h[a],a,i,s,i.name,this.component.polar.getIndicator(h[a].polarIndex)),l&&(g.draggable=!0,this.setCalculable(g)),g=new n(g),this.shapeList.push(g)},_addDropBox:function(e){var t=this.series,i=this.deepQuery(this._queryTarget,"polarIndex");if(!this._dropBoxList[i]){var n=this.component.polar.getDropBox(i);n.zlevel=this.getZlevelBase(),n.z=this.getZBase(),this.setCalculable(n),o.pack(n,t,e,void 0,-1),this.shapeList.push(n),this._dropBoxList[i]=!0}},ondragend:function(e,t){var i=this.series;if(this.isDragend&&e.target){var n=e.target,a=o.get(n,"seriesIndex"),s=o.get(n,"dataIndex");this.component.legend&&this.component.legend.del(i[a].data[s].name),i[a].data.splice(s,1),t.dragOut=!0,t.needRefresh=!0,this.isDragend=!1}},ondrop:function(t,i){var n=this.series;if(this.isDrop&&t.target){var a,s,r=t.target,l=t.dragged,h=o.get(r,"seriesIndex"),d=o.get(r,"dataIndex"),m=this.component.legend;if(-1===d)a={value:o.get(l,"value"),name:o.get(l,"name")},n[h].data.push(a),m&&m.add(a.name,l.style.color||l.style.strokeColor);else{var c=e("../util/accMath");a=n[h].data[d],m&&m.del(a.name),a.name+=this.option.nameConnector+o.get(l,"name"),s=o.get(l,"value");for(var p=0;p<s.length;p++)a.value[p]=c.accAdd(a.value[p],s[p]);m&&m.add(a.name,l.style.color||l.style.strokeColor)}i.dragIn=i.dragIn||!0,this.isDrop=!1}},refresh:function(e){e&&(this.option=e,this.series=e.series),this.backupShapeList(),this._buildShape()}},s.inherits(t,i),e("../chart").define("radar",t),t}),define("echarts/component/polar",["require","./base","zrender/shape/Text","zrender/shape/Line","zrender/shape/Polygon","zrender/shape/Circle","zrender/shape/Ring","../config","zrender/tool/util","../util/coordinates","../util/accMath","../util/smartSteps","../component"],function(e){function t(e,t,n,a,o){i.call(this,e,t,n,a,o),this.refresh(a)}var i=e("./base"),n=e("zrender/shape/Text"),a=e("zrender/shape/Line"),o=e("zrender/shape/Polygon"),s=e("zrender/shape/Circle"),r=e("zrender/shape/Ring"),l=e("../config");l.polar={zlevel:0,z:0,center:["50%","50%"],radius:"75%",startAngle:90,boundaryGap:[0,0],splitNumber:5,name:{show:!0,textStyle:{color:"#333"}},axisLine:{show:!0,lineStyle:{color:"#ccc",width:1,type:"solid"}},axisLabel:{show:!1,textStyle:{color:"#333"}},splitArea:{show:!0,areaStyle:{color:["rgba(250,250,250,0.3)","rgba(200,200,200,0.3)"]}},splitLine:{show:!0,lineStyle:{width:1,color:"#ccc"}},type:"polygon"};var h=e("zrender/tool/util"),d=e("../util/coordinates");return t.prototype={type:l.COMPONENT_TYPE_POLAR,_buildShape:function(){for(var e=0;e<this.polar.length;e++)this._index=e,this.reformOption(this.polar[e]),this._queryTarget=[this.polar[e],this.option],this._createVector(e),this._buildSpiderWeb(e),this._buildText(e),this._adjustIndicatorValue(e),this._addAxisLabel(e);for(var e=0;e<this.shapeList.length;e++)this.zr.addShape(this.shapeList[e])},_createVector:function(e){for(var t,i=this.polar[e],n=this.deepQuery(this._queryTarget,"indicator"),a=n.length,o=i.startAngle,s=2*Math.PI/a,r=this._getRadius(),l=i.__ecIndicator=[],h=0;a>h;h++)t=d.polar2cartesian(r,o*Math.PI/180+s*h),l.push({vector:[t[1],-t[0]]})},_getRadius:function(){var e=this.polar[this._index];return this.parsePercent(e.radius,Math.min(this.zr.getWidth(),this.zr.getHeight())/2)},_buildSpiderWeb:function(e){var t=this.polar[e],i=t.__ecIndicator,n=t.splitArea,a=t.splitLine,o=this.getCenter(e),s=t.splitNumber,r=a.lineStyle.color,l=a.lineStyle.width,h=a.show,d=this.deepQuery(this._queryTarget,"axisLine");this._addArea(i,s,o,n,r,l,h),d.show&&this._addLine(i,o,d)},_addAxisLabel:function(t){for(var i,a,o,s,a,r,l,d,m,c,p=e("../util/accMath"),u=this.polar[t],V=this.deepQuery(this._queryTarget,"indicator"),g=u.__ecIndicator,U=this.deepQuery(this._queryTarget,"splitNumber"),y=this.getCenter(t),f=0;f<V.length;f++)if(i=this.deepQuery([V[f],u,this.option],"axisLabel"),i.show){var _=this.deepQuery([i,u,this.option],"textStyle");if(o={},o.textFont=this.getFont(_),o.color=_.color,o=h.merge(o,i),o.lineWidth=o.width,a=g[f].vector,r=g[f].value,d=f/V.length*2*Math.PI,m=i.offset||10,c=i.interval||0,!r)return;for(var b=1;U>=b;b+=c+1)s=h.merge({},o),l=p.accAdd(r.min,p.accMul(r.step,b)),s.text=this.numAddCommas(l),s.x=b*a[0]/U+Math.cos(d)*m+y[0],s.y=b*a[1]/U+Math.sin(d)*m+y[1],this.shapeList.push(new n({zlevel:this.getZlevelBase(),z:this.getZBase(),style:s,draggable:!1,hoverable:!1}))}},_buildText:function(e){for(var t,i,a,o,s,r,l,h=this.polar[e],d=h.__ecIndicator,m=this.deepQuery(this._queryTarget,"indicator"),c=this.getCenter(e),p=0,u=0,V=0;V<m.length;V++)o=this.deepQuery([m[V],h,this.option],"name"),o.show&&(l=this.deepQuery([o,h,this.option],"textStyle"),i={},i.textFont=this.getFont(l),i.color=l.color,i.text="function"==typeof o.formatter?o.formatter.call(this.myChart,m[V].text,V):"string"==typeof o.formatter?o.formatter.replace("{value}",m[V].text):m[V].text,d[V].text=i.text,t=d[V].vector,a=Math.round(t[0])>0?"left":Math.round(t[0])<0?"right":"center",null==o.margin?t=this._mapVector(t,c,1.1):(r=o.margin,p=t[0]>0?r:-r,u=t[1]>0?r:-r,p=0===t[0]?0:p,u=0===t[1]?0:u,t=this._mapVector(t,c,1)),i.textAlign=a,i.x=t[0]+p,i.y=t[1]+u,s=o.rotate?[o.rotate/180*Math.PI,t[0],t[1]]:[0,0,0],this.shapeList.push(new n({zlevel:this.getZlevelBase(),z:this.getZBase(),style:i,draggable:!1,hoverable:!1,rotation:s})))},getIndicatorText:function(e,t){return this.polar[e]&&this.polar[e].__ecIndicator[t]&&this.polar[e].__ecIndicator[t].text},getDropBox:function(e){var t,i,e=e||0,n=this.polar[e],a=this.getCenter(e),o=n.__ecIndicator,s=o.length,r=[],l=n.type;if("polygon"==l){for(var h=0;s>h;h++)t=o[h].vector,r.push(this._mapVector(t,a,1.2));i=this._getShape(r,"fill","rgba(0,0,0,0)","",1)}else"circle"==l&&(i=this._getCircle("",1,1.2,a,"fill","rgba(0,0,0,0)"));return i},_addArea:function(e,t,i,n,a,o,s){for(var r,l,h,d,m=this.deepQuery(this._queryTarget,"type"),c=0;t>c;c++)l=(t-c)/t,s&&("polygon"==m?(d=this._getPointList(e,l,i),r=this._getShape(d,"stroke","",a,o)):"circle"==m&&(r=this._getCircle(a,o,l,i,"stroke")),this.shapeList.push(r)),n.show&&(h=(t-c-1)/t,this._addSplitArea(e,n,l,h,i,c))},_getCircle:function(e,t,i,n,a,o){var r=this._getRadius();return new s({zlevel:this.getZlevelBase(),z:this.getZBase(),style:{x:n[0],y:n[1],r:r*i,brushType:a,strokeColor:e,lineWidth:t,color:o},hoverable:!1,draggable:!1})},_getRing:function(e,t,i,n){var a=this._getRadius();return new r({zlevel:this.getZlevelBase(),z:this.getZBase(),style:{x:n[0],y:n[1],r:t*a,r0:i*a,color:e,brushType:"fill"},hoverable:!1,draggable:!1})},_getPointList:function(e,t,i){for(var n,a=[],o=e.length,s=0;o>s;s++)n=e[s].vector,a.push(this._mapVector(n,i,t));return a},_getShape:function(e,t,i,n,a){return new o({zlevel:this.getZlevelBase(),z:this.getZBase(),style:{pointList:e,brushType:t,color:i,strokeColor:n,lineWidth:a},hoverable:!1,draggable:!1})},_addSplitArea:function(e,t,i,n,a,o){var s,r,l,h,d,m=e.length,c=t.areaStyle.color,p=[],m=e.length,u=this.deepQuery(this._queryTarget,"type");if("string"==typeof c&&(c=[c]),r=c.length,s=c[o%r],"polygon"==u)for(var V=0;m>V;V++)p=[],l=e[V].vector,h=e[(V+1)%m].vector,p.push(this._mapVector(l,a,i)),p.push(this._mapVector(l,a,n)),p.push(this._mapVector(h,a,n)),p.push(this._mapVector(h,a,i)),d=this._getShape(p,"fill",s,"",1),this.shapeList.push(d);else"circle"==u&&(d=this._getRing(s,i,n,a),this.shapeList.push(d))},_mapVector:function(e,t,i){return[e[0]*i+t[0],e[1]*i+t[1]]},getCenter:function(e){var e=e||0;return this.parseCenter(this.zr,this.polar[e].center)},_addLine:function(e,t,i){for(var n,a,o=e.length,s=i.lineStyle,r=s.color,l=s.width,h=s.type,d=0;o>d;d++)a=e[d].vector,n=this._getLine(t[0],t[1],a[0]+t[0],a[1]+t[1],r,l,h),this.shapeList.push(n)},_getLine:function(e,t,i,n,o,s,r){return new a({zlevel:this.getZlevelBase(),z:this.getZBase(),style:{xStart:e,yStart:t,xEnd:i,yEnd:n,strokeColor:o,lineWidth:s,lineType:r},hoverable:!1})},_adjustIndicatorValue:function(t){for(var i,n,a=this.polar[t],o=this.deepQuery(this._queryTarget,"indicator"),s=o.length,r=a.__ecIndicator,l=this._getSeriesData(t),h=a.boundaryGap,d=a.splitNumber,m=a.scale,c=e("../util/smartSteps"),p=0;s>p;p++){if("number"==typeof o[p].max)i=o[p].max,n=o[p].min||0;else{var u=this._findValue(l,p,d,h);n=u.min,i=u.max}!m&&n>=0&&i>=0&&(n=0),!m&&0>=n&&0>=i&&(i=0);var V=c(n,i,d);r[p].value={min:V.min,max:V.max,step:V.step}}},_getSeriesData:function(e){for(var t,i,n,a=[],o=this.component.legend,s=0;s<this.series.length;s++)if(t=this.series[s],t.type==l.CHART_TYPE_RADAR){i=t.data||[];for(var r=0;r<i.length;r++)n=this.deepQuery([i[r],t,this.option],"polarIndex")||0,n!=e||o&&!o.isSelected(i[r].name)||a.push(i[r])}return a},_findValue:function(e,t,i,n){function a(e){(e>o||void 0===o)&&(o=e),(s>e||void 0===s)&&(s=e)}var o,s,r;if(e&&0!==e.length){if(1==e.length&&(s=0),1!=e.length)for(var l=0;l<e.length;l++)a(this.getDataFromOption(e[l].value[t]));else{r=e[0];for(var l=0;l<r.value.length;l++)a(this.getDataFromOption(r.value[l]))}var h=Math.abs(o-s);return s-=Math.abs(h*n[0]),o+=Math.abs(h*n[1]),s===o&&(0===o?o=1:o>0?s=o/i:o/=i),{max:o,min:s}}},getVector:function(e,t,i){e=e||0,t=t||0;var n=this.polar[e].__ecIndicator;if(!(t>=n.length)){var a,o=this.polar[e].__ecIndicator[t],s=this.getCenter(e),r=o.vector,l=o.value.max,h=o.value.min;if("undefined"==typeof i)return s;switch(i){case"min":i=h;break;case"max":i=l;break;case"center":i=(l+h)/2}return a=l!=h?(i-h)/(l-h):.5,this._mapVector(r,s,a)}},isInside:function(e){var t=this.getNearestIndex(e);return t?t.polarIndex:-1},getNearestIndex:function(e){for(var t,i,n,a,o,s,r,l,h,m=0;m<this.polar.length;m++){if(t=this.polar[m],i=this.getCenter(m),e[0]==i[0]&&e[1]==i[1])return{polarIndex:m,valueIndex:0};if(n=this._getRadius(),o=t.startAngle,s=t.indicator,r=s.length,l=2*Math.PI/r,a=d.cartesian2polar(e[0]-i[0],i[1]-e[1]),e[0]-i[0]<0&&(a[1]+=Math.PI),a[1]<0&&(a[1]+=2*Math.PI),h=a[1]-o/180*Math.PI+2*Math.PI,Math.abs(Math.cos(h%(l/2)))*n>a[0])return{polarIndex:m,valueIndex:Math.floor((h+l/2)/l)%r}}},getIndicator:function(e){var e=e||0;return this.polar[e].indicator},refresh:function(e){e&&(this.option=e,this.polar=this.option.polar,this.series=this.option.series),this.clear(),this._buildShape()}},h.inherits(t,i),e("../component").define("polar",t),t}),define("echarts/util/coordinates",["require","zrender/tool/math"],function(e){function t(e,t){return[e*n.sin(t),e*n.cos(t)]}function i(e,t){return[Math.sqrt(e*e+t*t),Math.atan(t/e)]}var n=e("zrender/tool/math");return{polar2cartesian:t,cartesian2polar:i}});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL2VjaGFydHMvY2hhcnQvcmFkYXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiZGVmaW5lKFwiZWNoYXJ0cy9jaGFydC9yYWRhclwiLFtcInJlcXVpcmVcIixcIi4vYmFzZVwiLFwienJlbmRlci9zaGFwZS9Qb2x5Z29uXCIsXCIuLi9jb21wb25lbnQvcG9sYXJcIixcIi4uL2NvbmZpZ1wiLFwiLi4vdXRpbC9lY0RhdGFcIixcInpyZW5kZXIvdG9vbC91dGlsXCIsXCJ6cmVuZGVyL3Rvb2wvY29sb3JcIixcIi4uL3V0aWwvYWNjTWF0aFwiLFwiLi4vY2hhcnRcIl0sZnVuY3Rpb24oZSl7ZnVuY3Rpb24gdChlLHQsbixhLG8pe2kuY2FsbCh0aGlzLGUsdCxuLGEsbyksdGhpcy5yZWZyZXNoKGEpfXZhciBpPWUoXCIuL2Jhc2VcIiksbj1lKFwienJlbmRlci9zaGFwZS9Qb2x5Z29uXCIpO2UoXCIuLi9jb21wb25lbnQvcG9sYXJcIik7dmFyIGE9ZShcIi4uL2NvbmZpZ1wiKTthLnJhZGFyPXt6bGV2ZWw6MCx6OjIsY2xpY2thYmxlOiEwLGxlZ2VuZEhvdmVyTGluazohMCxwb2xhckluZGV4OjAsaXRlbVN0eWxlOntub3JtYWw6e2xhYmVsOntzaG93OiExfSxsaW5lU3R5bGU6e3dpZHRoOjIsdHlwZTpcInNvbGlkXCJ9fSxlbXBoYXNpczp7bGFiZWw6e3Nob3c6ITF9fX0sc3ltYm9sU2l6ZToyfTt2YXIgbz1lKFwiLi4vdXRpbC9lY0RhdGFcIikscz1lKFwienJlbmRlci90b29sL3V0aWxcIikscj1lKFwienJlbmRlci90b29sL2NvbG9yXCIpO3JldHVybiB0LnByb3RvdHlwZT17dHlwZTphLkNIQVJUX1RZUEVfUkFEQVIsX2J1aWxkU2hhcGU6ZnVuY3Rpb24oKXt0aGlzLnNlbGVjdGVkTWFwPXt9LHRoaXMuX3N5bWJvbD10aGlzLm9wdGlvbi5zeW1ib2xMaXN0LHRoaXMuX3F1ZXJ5VGFyZ2V0LHRoaXMuX2Ryb3BCb3hMaXN0PVtdLHRoaXMuX3JhZGFyRGF0YUNvdW50ZXI9MDtmb3IodmFyIGUsdD10aGlzLnNlcmllcyxpPXRoaXMuY29tcG9uZW50LmxlZ2VuZCxuPTAsbz10Lmxlbmd0aDtvPm47bisrKXRbbl0udHlwZT09PWEuQ0hBUlRfVFlQRV9SQURBUiYmKHRoaXMuc2VyaWU9dGhpcy5yZWZvcm1PcHRpb24odFtuXSksdGhpcy5sZWdlbmRIb3Zlckxpbms9dFtuXS5sZWdlbmRIb3Zlckxpbmt8fHRoaXMubGVnZW5kSG92ZXJMaW5rLGU9dGhpcy5zZXJpZS5uYW1lfHxcIlwiLHRoaXMuc2VsZWN0ZWRNYXBbZV09aT9pLmlzU2VsZWN0ZWQoZSk6ITAsdGhpcy5zZWxlY3RlZE1hcFtlXSYmKHRoaXMuX3F1ZXJ5VGFyZ2V0PVt0aGlzLnNlcmllLHRoaXMub3B0aW9uXSx0aGlzLmRlZXBRdWVyeSh0aGlzLl9xdWVyeVRhcmdldCxcImNhbGN1bGFibGVcIikmJnRoaXMuX2FkZERyb3BCb3gobiksdGhpcy5fYnVpbGRTaW5nbGVSYWRhcihuKSx0aGlzLmJ1aWxkTWFyayhuKSkpO3RoaXMuYWRkU2hhcGVMaXN0KCl9LF9idWlsZFNpbmdsZVJhZGFyOmZ1bmN0aW9uKGUpe2Zvcih2YXIgdCxpLG4sYSxvPXRoaXMuY29tcG9uZW50LmxlZ2VuZCxzPXRoaXMuc2VyaWUuZGF0YSxyPXRoaXMuZGVlcFF1ZXJ5KHRoaXMuX3F1ZXJ5VGFyZ2V0LFwiY2FsY3VsYWJsZVwiKSxsPTA7bDxzLmxlbmd0aDtsKyspbj1zW2xdLm5hbWV8fFwiXCIsdGhpcy5zZWxlY3RlZE1hcFtuXT1vP28uaXNTZWxlY3RlZChuKTohMCx0aGlzLnNlbGVjdGVkTWFwW25dJiYobz8oaT1vLmdldENvbG9yKG4pLHQ9by5nZXRJdGVtU2hhcGUobiksdCYmKHQuc3R5bGUuYnJ1c2hUeXBlPXRoaXMuZGVlcFF1ZXJ5KFtzW2xdLHRoaXMuc2VyaWVdLFwiaXRlbVN0eWxlLm5vcm1hbC5hcmVhU3R5bGVcIik/XCJib3RoXCI6XCJzdHJva2VcIixvLnNldEl0ZW1TaGFwZShuLHQpKSk6aT10aGlzLnpyLmdldENvbG9yKGwpLGE9dGhpcy5fZ2V0UG9pbnRMaXN0KHRoaXMuc2VyaWUucG9sYXJJbmRleCxzW2xdKSx0aGlzLl9hZGRTeW1ib2woYSxpLGwsZSx0aGlzLnNlcmllLnBvbGFySW5kZXgpLHRoaXMuX2FkZERhdGFTaGFwZShhLGksc1tsXSxlLGwsciksdGhpcy5fcmFkYXJEYXRhQ291bnRlcisrKX0sX2dldFBvaW50TGlzdDpmdW5jdGlvbihlLHQpe2Zvcih2YXIgaSxuLGE9W10sbz10aGlzLmNvbXBvbmVudC5wb2xhcixzPTAscj10LnZhbHVlLmxlbmd0aDtyPnM7cysrKW49dGhpcy5nZXREYXRhRnJvbU9wdGlvbih0LnZhbHVlW3NdKSxpPVwiLVwiIT1uP28uZ2V0VmVjdG9yKGUscyxuKTohMSxpJiZhLnB1c2goaSk7cmV0dXJuIGF9LF9hZGRTeW1ib2w6ZnVuY3Rpb24oZSx0LGksbixhKXtmb3IodmFyIHMscj10aGlzLnNlcmllcyxsPXRoaXMuY29tcG9uZW50LnBvbGFyLGg9MCxkPWUubGVuZ3RoO2Q+aDtoKyspcz10aGlzLmdldFN5bWJvbFNoYXBlKHRoaXMuZGVlcE1lcmdlKFtyW25dLmRhdGFbaV0scltuXV0pLG4scltuXS5kYXRhW2ldLnZhbHVlW2hdLGgsbC5nZXRJbmRpY2F0b3JUZXh0KGEsaCksZVtoXVswXSxlW2hdWzFdLHRoaXMuX3N5bWJvbFt0aGlzLl9yYWRhckRhdGFDb3VudGVyJXRoaXMuX3N5bWJvbC5sZW5ndGhdLHQsXCIjZmZmXCIsXCJ2ZXJ0aWNhbFwiKSxzLnpsZXZlbD10aGlzLmdldFpsZXZlbEJhc2UoKSxzLno9dGhpcy5nZXRaQmFzZSgpKzEsby5zZXQocyxcImRhdGFcIixyW25dLmRhdGFbaV0pLG8uc2V0KHMsXCJ2YWx1ZVwiLHJbbl0uZGF0YVtpXS52YWx1ZSksby5zZXQocyxcImRhdGFJbmRleFwiLGkpLG8uc2V0KHMsXCJzcGVjaWFsXCIsaCksdGhpcy5zaGFwZUxpc3QucHVzaChzKX0sX2FkZERhdGFTaGFwZTpmdW5jdGlvbihlLHQsaSxhLHMsbCl7dmFyIGg9dGhpcy5zZXJpZXMsZD1baSx0aGlzLnNlcmllXSxtPXRoaXMuZ2V0SXRlbVN0eWxlQ29sb3IodGhpcy5kZWVwUXVlcnkoZCxcIml0ZW1TdHlsZS5ub3JtYWwuY29sb3JcIiksYSxzLGkpLGM9dGhpcy5kZWVwUXVlcnkoZCxcIml0ZW1TdHlsZS5ub3JtYWwubGluZVN0eWxlLndpZHRoXCIpLHA9dGhpcy5kZWVwUXVlcnkoZCxcIml0ZW1TdHlsZS5ub3JtYWwubGluZVN0eWxlLnR5cGVcIiksdT10aGlzLmRlZXBRdWVyeShkLFwiaXRlbVN0eWxlLm5vcm1hbC5hcmVhU3R5bGUuY29sb3JcIiksVj10aGlzLmRlZXBRdWVyeShkLFwiaXRlbVN0eWxlLm5vcm1hbC5hcmVhU3R5bGVcIiksZz17emxldmVsOnRoaXMuZ2V0WmxldmVsQmFzZSgpLHo6dGhpcy5nZXRaQmFzZSgpLHN0eWxlOntwb2ludExpc3Q6ZSxicnVzaFR5cGU6Vj9cImJvdGhcIjpcInN0cm9rZVwiLGNvbG9yOnV8fG18fChcInN0cmluZ1wiPT10eXBlb2YgdD9yLmFscGhhKHQsLjUpOnQpLHN0cm9rZUNvbG9yOm18fHQsbGluZVdpZHRoOmMsbGluZVR5cGU6cH0saGlnaGxpZ2h0U3R5bGU6e2JydXNoVHlwZTp0aGlzLmRlZXBRdWVyeShkLFwiaXRlbVN0eWxlLmVtcGhhc2lzLmFyZWFTdHlsZVwiKXx8Vj9cImJvdGhcIjpcInN0cm9rZVwiLGNvbG9yOnRoaXMuZGVlcFF1ZXJ5KGQsXCJpdGVtU3R5bGUuZW1waGFzaXMuYXJlYVN0eWxlLmNvbG9yXCIpfHx1fHxtfHwoXCJzdHJpbmdcIj09dHlwZW9mIHQ/ci5hbHBoYSh0LC41KTp0KSxzdHJva2VDb2xvcjp0aGlzLmdldEl0ZW1TdHlsZUNvbG9yKHRoaXMuZGVlcFF1ZXJ5KGQsXCJpdGVtU3R5bGUuZW1waGFzaXMuY29sb3JcIiksYSxzLGkpfHxtfHx0LGxpbmVXaWR0aDp0aGlzLmRlZXBRdWVyeShkLFwiaXRlbVN0eWxlLmVtcGhhc2lzLmxpbmVTdHlsZS53aWR0aFwiKXx8YyxsaW5lVHlwZTp0aGlzLmRlZXBRdWVyeShkLFwiaXRlbVN0eWxlLmVtcGhhc2lzLmxpbmVTdHlsZS50eXBlXCIpfHxwfX07by5wYWNrKGcsaFthXSxhLGkscyxpLm5hbWUsdGhpcy5jb21wb25lbnQucG9sYXIuZ2V0SW5kaWNhdG9yKGhbYV0ucG9sYXJJbmRleCkpLGwmJihnLmRyYWdnYWJsZT0hMCx0aGlzLnNldENhbGN1bGFibGUoZykpLGc9bmV3IG4oZyksdGhpcy5zaGFwZUxpc3QucHVzaChnKX0sX2FkZERyb3BCb3g6ZnVuY3Rpb24oZSl7dmFyIHQ9dGhpcy5zZXJpZXMsaT10aGlzLmRlZXBRdWVyeSh0aGlzLl9xdWVyeVRhcmdldCxcInBvbGFySW5kZXhcIik7aWYoIXRoaXMuX2Ryb3BCb3hMaXN0W2ldKXt2YXIgbj10aGlzLmNvbXBvbmVudC5wb2xhci5nZXREcm9wQm94KGkpO24uemxldmVsPXRoaXMuZ2V0WmxldmVsQmFzZSgpLG4uej10aGlzLmdldFpCYXNlKCksdGhpcy5zZXRDYWxjdWxhYmxlKG4pLG8ucGFjayhuLHQsZSx2b2lkIDAsLTEpLHRoaXMuc2hhcGVMaXN0LnB1c2gobiksdGhpcy5fZHJvcEJveExpc3RbaV09ITB9fSxvbmRyYWdlbmQ6ZnVuY3Rpb24oZSx0KXt2YXIgaT10aGlzLnNlcmllcztpZih0aGlzLmlzRHJhZ2VuZCYmZS50YXJnZXQpe3ZhciBuPWUudGFyZ2V0LGE9by5nZXQobixcInNlcmllc0luZGV4XCIpLHM9by5nZXQobixcImRhdGFJbmRleFwiKTt0aGlzLmNvbXBvbmVudC5sZWdlbmQmJnRoaXMuY29tcG9uZW50LmxlZ2VuZC5kZWwoaVthXS5kYXRhW3NdLm5hbWUpLGlbYV0uZGF0YS5zcGxpY2UocywxKSx0LmRyYWdPdXQ9ITAsdC5uZWVkUmVmcmVzaD0hMCx0aGlzLmlzRHJhZ2VuZD0hMX19LG9uZHJvcDpmdW5jdGlvbih0LGkpe3ZhciBuPXRoaXMuc2VyaWVzO2lmKHRoaXMuaXNEcm9wJiZ0LnRhcmdldCl7dmFyIGEscyxyPXQudGFyZ2V0LGw9dC5kcmFnZ2VkLGg9by5nZXQocixcInNlcmllc0luZGV4XCIpLGQ9by5nZXQocixcImRhdGFJbmRleFwiKSxtPXRoaXMuY29tcG9uZW50LmxlZ2VuZDtpZigtMT09PWQpYT17dmFsdWU6by5nZXQobCxcInZhbHVlXCIpLG5hbWU6by5nZXQobCxcIm5hbWVcIil9LG5baF0uZGF0YS5wdXNoKGEpLG0mJm0uYWRkKGEubmFtZSxsLnN0eWxlLmNvbG9yfHxsLnN0eWxlLnN0cm9rZUNvbG9yKTtlbHNle3ZhciBjPWUoXCIuLi91dGlsL2FjY01hdGhcIik7YT1uW2hdLmRhdGFbZF0sbSYmbS5kZWwoYS5uYW1lKSxhLm5hbWUrPXRoaXMub3B0aW9uLm5hbWVDb25uZWN0b3Irby5nZXQobCxcIm5hbWVcIikscz1vLmdldChsLFwidmFsdWVcIik7Zm9yKHZhciBwPTA7cDxzLmxlbmd0aDtwKyspYS52YWx1ZVtwXT1jLmFjY0FkZChhLnZhbHVlW3BdLHNbcF0pO20mJm0uYWRkKGEubmFtZSxsLnN0eWxlLmNvbG9yfHxsLnN0eWxlLnN0cm9rZUNvbG9yKX1pLmRyYWdJbj1pLmRyYWdJbnx8ITAsdGhpcy5pc0Ryb3A9ITF9fSxyZWZyZXNoOmZ1bmN0aW9uKGUpe2UmJih0aGlzLm9wdGlvbj1lLHRoaXMuc2VyaWVzPWUuc2VyaWVzKSx0aGlzLmJhY2t1cFNoYXBlTGlzdCgpLHRoaXMuX2J1aWxkU2hhcGUoKX19LHMuaW5oZXJpdHModCxpKSxlKFwiLi4vY2hhcnRcIikuZGVmaW5lKFwicmFkYXJcIix0KSx0fSksZGVmaW5lKFwiZWNoYXJ0cy9jb21wb25lbnQvcG9sYXJcIixbXCJyZXF1aXJlXCIsXCIuL2Jhc2VcIixcInpyZW5kZXIvc2hhcGUvVGV4dFwiLFwienJlbmRlci9zaGFwZS9MaW5lXCIsXCJ6cmVuZGVyL3NoYXBlL1BvbHlnb25cIixcInpyZW5kZXIvc2hhcGUvQ2lyY2xlXCIsXCJ6cmVuZGVyL3NoYXBlL1JpbmdcIixcIi4uL2NvbmZpZ1wiLFwienJlbmRlci90b29sL3V0aWxcIixcIi4uL3V0aWwvY29vcmRpbmF0ZXNcIixcIi4uL3V0aWwvYWNjTWF0aFwiLFwiLi4vdXRpbC9zbWFydFN0ZXBzXCIsXCIuLi9jb21wb25lbnRcIl0sZnVuY3Rpb24oZSl7ZnVuY3Rpb24gdChlLHQsbixhLG8pe2kuY2FsbCh0aGlzLGUsdCxuLGEsbyksdGhpcy5yZWZyZXNoKGEpfXZhciBpPWUoXCIuL2Jhc2VcIiksbj1lKFwienJlbmRlci9zaGFwZS9UZXh0XCIpLGE9ZShcInpyZW5kZXIvc2hhcGUvTGluZVwiKSxvPWUoXCJ6cmVuZGVyL3NoYXBlL1BvbHlnb25cIikscz1lKFwienJlbmRlci9zaGFwZS9DaXJjbGVcIikscj1lKFwienJlbmRlci9zaGFwZS9SaW5nXCIpLGw9ZShcIi4uL2NvbmZpZ1wiKTtsLnBvbGFyPXt6bGV2ZWw6MCx6OjAsY2VudGVyOltcIjUwJVwiLFwiNTAlXCJdLHJhZGl1czpcIjc1JVwiLHN0YXJ0QW5nbGU6OTAsYm91bmRhcnlHYXA6WzAsMF0sc3BsaXROdW1iZXI6NSxuYW1lOntzaG93OiEwLHRleHRTdHlsZTp7Y29sb3I6XCIjMzMzXCJ9fSxheGlzTGluZTp7c2hvdzohMCxsaW5lU3R5bGU6e2NvbG9yOlwiI2NjY1wiLHdpZHRoOjEsdHlwZTpcInNvbGlkXCJ9fSxheGlzTGFiZWw6e3Nob3c6ITEsdGV4dFN0eWxlOntjb2xvcjpcIiMzMzNcIn19LHNwbGl0QXJlYTp7c2hvdzohMCxhcmVhU3R5bGU6e2NvbG9yOltcInJnYmEoMjUwLDI1MCwyNTAsMC4zKVwiLFwicmdiYSgyMDAsMjAwLDIwMCwwLjMpXCJdfX0sc3BsaXRMaW5lOntzaG93OiEwLGxpbmVTdHlsZTp7d2lkdGg6MSxjb2xvcjpcIiNjY2NcIn19LHR5cGU6XCJwb2x5Z29uXCJ9O3ZhciBoPWUoXCJ6cmVuZGVyL3Rvb2wvdXRpbFwiKSxkPWUoXCIuLi91dGlsL2Nvb3JkaW5hdGVzXCIpO3JldHVybiB0LnByb3RvdHlwZT17dHlwZTpsLkNPTVBPTkVOVF9UWVBFX1BPTEFSLF9idWlsZFNoYXBlOmZ1bmN0aW9uKCl7Zm9yKHZhciBlPTA7ZTx0aGlzLnBvbGFyLmxlbmd0aDtlKyspdGhpcy5faW5kZXg9ZSx0aGlzLnJlZm9ybU9wdGlvbih0aGlzLnBvbGFyW2VdKSx0aGlzLl9xdWVyeVRhcmdldD1bdGhpcy5wb2xhcltlXSx0aGlzLm9wdGlvbl0sdGhpcy5fY3JlYXRlVmVjdG9yKGUpLHRoaXMuX2J1aWxkU3BpZGVyV2ViKGUpLHRoaXMuX2J1aWxkVGV4dChlKSx0aGlzLl9hZGp1c3RJbmRpY2F0b3JWYWx1ZShlKSx0aGlzLl9hZGRBeGlzTGFiZWwoZSk7Zm9yKHZhciBlPTA7ZTx0aGlzLnNoYXBlTGlzdC5sZW5ndGg7ZSsrKXRoaXMuenIuYWRkU2hhcGUodGhpcy5zaGFwZUxpc3RbZV0pfSxfY3JlYXRlVmVjdG9yOmZ1bmN0aW9uKGUpe2Zvcih2YXIgdCxpPXRoaXMucG9sYXJbZV0sbj10aGlzLmRlZXBRdWVyeSh0aGlzLl9xdWVyeVRhcmdldCxcImluZGljYXRvclwiKSxhPW4ubGVuZ3RoLG89aS5zdGFydEFuZ2xlLHM9MipNYXRoLlBJL2Escj10aGlzLl9nZXRSYWRpdXMoKSxsPWkuX19lY0luZGljYXRvcj1bXSxoPTA7YT5oO2grKyl0PWQucG9sYXIyY2FydGVzaWFuKHIsbypNYXRoLlBJLzE4MCtzKmgpLGwucHVzaCh7dmVjdG9yOlt0WzFdLC10WzBdXX0pfSxfZ2V0UmFkaXVzOmZ1bmN0aW9uKCl7dmFyIGU9dGhpcy5wb2xhclt0aGlzLl9pbmRleF07cmV0dXJuIHRoaXMucGFyc2VQZXJjZW50KGUucmFkaXVzLE1hdGgubWluKHRoaXMuenIuZ2V0V2lkdGgoKSx0aGlzLnpyLmdldEhlaWdodCgpKS8yKX0sX2J1aWxkU3BpZGVyV2ViOmZ1bmN0aW9uKGUpe3ZhciB0PXRoaXMucG9sYXJbZV0saT10Ll9fZWNJbmRpY2F0b3Isbj10LnNwbGl0QXJlYSxhPXQuc3BsaXRMaW5lLG89dGhpcy5nZXRDZW50ZXIoZSkscz10LnNwbGl0TnVtYmVyLHI9YS5saW5lU3R5bGUuY29sb3IsbD1hLmxpbmVTdHlsZS53aWR0aCxoPWEuc2hvdyxkPXRoaXMuZGVlcFF1ZXJ5KHRoaXMuX3F1ZXJ5VGFyZ2V0LFwiYXhpc0xpbmVcIik7dGhpcy5fYWRkQXJlYShpLHMsbyxuLHIsbCxoKSxkLnNob3cmJnRoaXMuX2FkZExpbmUoaSxvLGQpfSxfYWRkQXhpc0xhYmVsOmZ1bmN0aW9uKHQpe2Zvcih2YXIgaSxhLG8scyxhLHIsbCxkLG0sYyxwPWUoXCIuLi91dGlsL2FjY01hdGhcIiksdT10aGlzLnBvbGFyW3RdLFY9dGhpcy5kZWVwUXVlcnkodGhpcy5fcXVlcnlUYXJnZXQsXCJpbmRpY2F0b3JcIiksZz11Ll9fZWNJbmRpY2F0b3IsVT10aGlzLmRlZXBRdWVyeSh0aGlzLl9xdWVyeVRhcmdldCxcInNwbGl0TnVtYmVyXCIpLHk9dGhpcy5nZXRDZW50ZXIodCksZj0wO2Y8Vi5sZW5ndGg7ZisrKWlmKGk9dGhpcy5kZWVwUXVlcnkoW1ZbZl0sdSx0aGlzLm9wdGlvbl0sXCJheGlzTGFiZWxcIiksaS5zaG93KXt2YXIgXz10aGlzLmRlZXBRdWVyeShbaSx1LHRoaXMub3B0aW9uXSxcInRleHRTdHlsZVwiKTtpZihvPXt9LG8udGV4dEZvbnQ9dGhpcy5nZXRGb250KF8pLG8uY29sb3I9Xy5jb2xvcixvPWgubWVyZ2UobyxpKSxvLmxpbmVXaWR0aD1vLndpZHRoLGE9Z1tmXS52ZWN0b3Iscj1nW2ZdLnZhbHVlLGQ9Zi9WLmxlbmd0aCoyKk1hdGguUEksbT1pLm9mZnNldHx8MTAsYz1pLmludGVydmFsfHwwLCFyKXJldHVybjtmb3IodmFyIGI9MTtVPj1iO2IrPWMrMSlzPWgubWVyZ2Uoe30sbyksbD1wLmFjY0FkZChyLm1pbixwLmFjY011bChyLnN0ZXAsYikpLHMudGV4dD10aGlzLm51bUFkZENvbW1hcyhsKSxzLng9YiphWzBdL1UrTWF0aC5jb3MoZCkqbSt5WzBdLHMueT1iKmFbMV0vVStNYXRoLnNpbihkKSptK3lbMV0sdGhpcy5zaGFwZUxpc3QucHVzaChuZXcgbih7emxldmVsOnRoaXMuZ2V0WmxldmVsQmFzZSgpLHo6dGhpcy5nZXRaQmFzZSgpLHN0eWxlOnMsZHJhZ2dhYmxlOiExLGhvdmVyYWJsZTohMX0pKX19LF9idWlsZFRleHQ6ZnVuY3Rpb24oZSl7Zm9yKHZhciB0LGksYSxvLHMscixsLGg9dGhpcy5wb2xhcltlXSxkPWguX19lY0luZGljYXRvcixtPXRoaXMuZGVlcFF1ZXJ5KHRoaXMuX3F1ZXJ5VGFyZ2V0LFwiaW5kaWNhdG9yXCIpLGM9dGhpcy5nZXRDZW50ZXIoZSkscD0wLHU9MCxWPTA7VjxtLmxlbmd0aDtWKyspbz10aGlzLmRlZXBRdWVyeShbbVtWXSxoLHRoaXMub3B0aW9uXSxcIm5hbWVcIiksby5zaG93JiYobD10aGlzLmRlZXBRdWVyeShbbyxoLHRoaXMub3B0aW9uXSxcInRleHRTdHlsZVwiKSxpPXt9LGkudGV4dEZvbnQ9dGhpcy5nZXRGb250KGwpLGkuY29sb3I9bC5jb2xvcixpLnRleHQ9XCJmdW5jdGlvblwiPT10eXBlb2Ygby5mb3JtYXR0ZXI/by5mb3JtYXR0ZXIuY2FsbCh0aGlzLm15Q2hhcnQsbVtWXS50ZXh0LFYpOlwic3RyaW5nXCI9PXR5cGVvZiBvLmZvcm1hdHRlcj9vLmZvcm1hdHRlci5yZXBsYWNlKFwie3ZhbHVlfVwiLG1bVl0udGV4dCk6bVtWXS50ZXh0LGRbVl0udGV4dD1pLnRleHQsdD1kW1ZdLnZlY3RvcixhPU1hdGgucm91bmQodFswXSk+MD9cImxlZnRcIjpNYXRoLnJvdW5kKHRbMF0pPDA/XCJyaWdodFwiOlwiY2VudGVyXCIsbnVsbD09by5tYXJnaW4/dD10aGlzLl9tYXBWZWN0b3IodCxjLDEuMSk6KHI9by5tYXJnaW4scD10WzBdPjA/cjotcix1PXRbMV0+MD9yOi1yLHA9MD09PXRbMF0/MDpwLHU9MD09PXRbMV0/MDp1LHQ9dGhpcy5fbWFwVmVjdG9yKHQsYywxKSksaS50ZXh0QWxpZ249YSxpLng9dFswXStwLGkueT10WzFdK3Uscz1vLnJvdGF0ZT9bby5yb3RhdGUvMTgwKk1hdGguUEksdFswXSx0WzFdXTpbMCwwLDBdLHRoaXMuc2hhcGVMaXN0LnB1c2gobmV3IG4oe3psZXZlbDp0aGlzLmdldFpsZXZlbEJhc2UoKSx6OnRoaXMuZ2V0WkJhc2UoKSxzdHlsZTppLGRyYWdnYWJsZTohMSxob3ZlcmFibGU6ITEscm90YXRpb246c30pKSl9LGdldEluZGljYXRvclRleHQ6ZnVuY3Rpb24oZSx0KXtyZXR1cm4gdGhpcy5wb2xhcltlXSYmdGhpcy5wb2xhcltlXS5fX2VjSW5kaWNhdG9yW3RdJiZ0aGlzLnBvbGFyW2VdLl9fZWNJbmRpY2F0b3JbdF0udGV4dH0sZ2V0RHJvcEJveDpmdW5jdGlvbihlKXt2YXIgdCxpLGU9ZXx8MCxuPXRoaXMucG9sYXJbZV0sYT10aGlzLmdldENlbnRlcihlKSxvPW4uX19lY0luZGljYXRvcixzPW8ubGVuZ3RoLHI9W10sbD1uLnR5cGU7aWYoXCJwb2x5Z29uXCI9PWwpe2Zvcih2YXIgaD0wO3M+aDtoKyspdD1vW2hdLnZlY3RvcixyLnB1c2godGhpcy5fbWFwVmVjdG9yKHQsYSwxLjIpKTtpPXRoaXMuX2dldFNoYXBlKHIsXCJmaWxsXCIsXCJyZ2JhKDAsMCwwLDApXCIsXCJcIiwxKX1lbHNlXCJjaXJjbGVcIj09bCYmKGk9dGhpcy5fZ2V0Q2lyY2xlKFwiXCIsMSwxLjIsYSxcImZpbGxcIixcInJnYmEoMCwwLDAsMClcIikpO3JldHVybiBpfSxfYWRkQXJlYTpmdW5jdGlvbihlLHQsaSxuLGEsbyxzKXtmb3IodmFyIHIsbCxoLGQsbT10aGlzLmRlZXBRdWVyeSh0aGlzLl9xdWVyeVRhcmdldCxcInR5cGVcIiksYz0wO3Q+YztjKyspbD0odC1jKS90LHMmJihcInBvbHlnb25cIj09bT8oZD10aGlzLl9nZXRQb2ludExpc3QoZSxsLGkpLHI9dGhpcy5fZ2V0U2hhcGUoZCxcInN0cm9rZVwiLFwiXCIsYSxvKSk6XCJjaXJjbGVcIj09bSYmKHI9dGhpcy5fZ2V0Q2lyY2xlKGEsbyxsLGksXCJzdHJva2VcIikpLHRoaXMuc2hhcGVMaXN0LnB1c2gocikpLG4uc2hvdyYmKGg9KHQtYy0xKS90LHRoaXMuX2FkZFNwbGl0QXJlYShlLG4sbCxoLGksYykpfSxfZ2V0Q2lyY2xlOmZ1bmN0aW9uKGUsdCxpLG4sYSxvKXt2YXIgcj10aGlzLl9nZXRSYWRpdXMoKTtyZXR1cm4gbmV3IHMoe3psZXZlbDp0aGlzLmdldFpsZXZlbEJhc2UoKSx6OnRoaXMuZ2V0WkJhc2UoKSxzdHlsZTp7eDpuWzBdLHk6blsxXSxyOnIqaSxicnVzaFR5cGU6YSxzdHJva2VDb2xvcjplLGxpbmVXaWR0aDp0LGNvbG9yOm99LGhvdmVyYWJsZTohMSxkcmFnZ2FibGU6ITF9KX0sX2dldFJpbmc6ZnVuY3Rpb24oZSx0LGksbil7dmFyIGE9dGhpcy5fZ2V0UmFkaXVzKCk7cmV0dXJuIG5ldyByKHt6bGV2ZWw6dGhpcy5nZXRabGV2ZWxCYXNlKCksejp0aGlzLmdldFpCYXNlKCksc3R5bGU6e3g6blswXSx5Om5bMV0scjp0KmEscjA6aSphLGNvbG9yOmUsYnJ1c2hUeXBlOlwiZmlsbFwifSxob3ZlcmFibGU6ITEsZHJhZ2dhYmxlOiExfSl9LF9nZXRQb2ludExpc3Q6ZnVuY3Rpb24oZSx0LGkpe2Zvcih2YXIgbixhPVtdLG89ZS5sZW5ndGgscz0wO28+cztzKyspbj1lW3NdLnZlY3RvcixhLnB1c2godGhpcy5fbWFwVmVjdG9yKG4saSx0KSk7cmV0dXJuIGF9LF9nZXRTaGFwZTpmdW5jdGlvbihlLHQsaSxuLGEpe3JldHVybiBuZXcgbyh7emxldmVsOnRoaXMuZ2V0WmxldmVsQmFzZSgpLHo6dGhpcy5nZXRaQmFzZSgpLHN0eWxlOntwb2ludExpc3Q6ZSxicnVzaFR5cGU6dCxjb2xvcjppLHN0cm9rZUNvbG9yOm4sbGluZVdpZHRoOmF9LGhvdmVyYWJsZTohMSxkcmFnZ2FibGU6ITF9KX0sX2FkZFNwbGl0QXJlYTpmdW5jdGlvbihlLHQsaSxuLGEsbyl7dmFyIHMscixsLGgsZCxtPWUubGVuZ3RoLGM9dC5hcmVhU3R5bGUuY29sb3IscD1bXSxtPWUubGVuZ3RoLHU9dGhpcy5kZWVwUXVlcnkodGhpcy5fcXVlcnlUYXJnZXQsXCJ0eXBlXCIpO2lmKFwic3RyaW5nXCI9PXR5cGVvZiBjJiYoYz1bY10pLHI9Yy5sZW5ndGgscz1jW28lcl0sXCJwb2x5Z29uXCI9PXUpZm9yKHZhciBWPTA7bT5WO1YrKylwPVtdLGw9ZVtWXS52ZWN0b3IsaD1lWyhWKzEpJW1dLnZlY3RvcixwLnB1c2godGhpcy5fbWFwVmVjdG9yKGwsYSxpKSkscC5wdXNoKHRoaXMuX21hcFZlY3RvcihsLGEsbikpLHAucHVzaCh0aGlzLl9tYXBWZWN0b3IoaCxhLG4pKSxwLnB1c2godGhpcy5fbWFwVmVjdG9yKGgsYSxpKSksZD10aGlzLl9nZXRTaGFwZShwLFwiZmlsbFwiLHMsXCJcIiwxKSx0aGlzLnNoYXBlTGlzdC5wdXNoKGQpO2Vsc2VcImNpcmNsZVwiPT11JiYoZD10aGlzLl9nZXRSaW5nKHMsaSxuLGEpLHRoaXMuc2hhcGVMaXN0LnB1c2goZCkpfSxfbWFwVmVjdG9yOmZ1bmN0aW9uKGUsdCxpKXtyZXR1cm5bZVswXSppK3RbMF0sZVsxXSppK3RbMV1dfSxnZXRDZW50ZXI6ZnVuY3Rpb24oZSl7dmFyIGU9ZXx8MDtyZXR1cm4gdGhpcy5wYXJzZUNlbnRlcih0aGlzLnpyLHRoaXMucG9sYXJbZV0uY2VudGVyKX0sX2FkZExpbmU6ZnVuY3Rpb24oZSx0LGkpe2Zvcih2YXIgbixhLG89ZS5sZW5ndGgscz1pLmxpbmVTdHlsZSxyPXMuY29sb3IsbD1zLndpZHRoLGg9cy50eXBlLGQ9MDtvPmQ7ZCsrKWE9ZVtkXS52ZWN0b3Isbj10aGlzLl9nZXRMaW5lKHRbMF0sdFsxXSxhWzBdK3RbMF0sYVsxXSt0WzFdLHIsbCxoKSx0aGlzLnNoYXBlTGlzdC5wdXNoKG4pfSxfZ2V0TGluZTpmdW5jdGlvbihlLHQsaSxuLG8scyxyKXtyZXR1cm4gbmV3IGEoe3psZXZlbDp0aGlzLmdldFpsZXZlbEJhc2UoKSx6OnRoaXMuZ2V0WkJhc2UoKSxzdHlsZTp7eFN0YXJ0OmUseVN0YXJ0OnQseEVuZDppLHlFbmQ6bixzdHJva2VDb2xvcjpvLGxpbmVXaWR0aDpzLGxpbmVUeXBlOnJ9LGhvdmVyYWJsZTohMX0pfSxfYWRqdXN0SW5kaWNhdG9yVmFsdWU6ZnVuY3Rpb24odCl7Zm9yKHZhciBpLG4sYT10aGlzLnBvbGFyW3RdLG89dGhpcy5kZWVwUXVlcnkodGhpcy5fcXVlcnlUYXJnZXQsXCJpbmRpY2F0b3JcIikscz1vLmxlbmd0aCxyPWEuX19lY0luZGljYXRvcixsPXRoaXMuX2dldFNlcmllc0RhdGEodCksaD1hLmJvdW5kYXJ5R2FwLGQ9YS5zcGxpdE51bWJlcixtPWEuc2NhbGUsYz1lKFwiLi4vdXRpbC9zbWFydFN0ZXBzXCIpLHA9MDtzPnA7cCsrKXtpZihcIm51bWJlclwiPT10eXBlb2Ygb1twXS5tYXgpaT1vW3BdLm1heCxuPW9bcF0ubWlufHwwO2Vsc2V7dmFyIHU9dGhpcy5fZmluZFZhbHVlKGwscCxkLGgpO249dS5taW4saT11Lm1heH0hbSYmbj49MCYmaT49MCYmKG49MCksIW0mJjA+PW4mJjA+PWkmJihpPTApO3ZhciBWPWMobixpLGQpO3JbcF0udmFsdWU9e21pbjpWLm1pbixtYXg6Vi5tYXgsc3RlcDpWLnN0ZXB9fX0sX2dldFNlcmllc0RhdGE6ZnVuY3Rpb24oZSl7Zm9yKHZhciB0LGksbixhPVtdLG89dGhpcy5jb21wb25lbnQubGVnZW5kLHM9MDtzPHRoaXMuc2VyaWVzLmxlbmd0aDtzKyspaWYodD10aGlzLnNlcmllc1tzXSx0LnR5cGU9PWwuQ0hBUlRfVFlQRV9SQURBUil7aT10LmRhdGF8fFtdO2Zvcih2YXIgcj0wO3I8aS5sZW5ndGg7cisrKW49dGhpcy5kZWVwUXVlcnkoW2lbcl0sdCx0aGlzLm9wdGlvbl0sXCJwb2xhckluZGV4XCIpfHwwLG4hPWV8fG8mJiFvLmlzU2VsZWN0ZWQoaVtyXS5uYW1lKXx8YS5wdXNoKGlbcl0pfXJldHVybiBhfSxfZmluZFZhbHVlOmZ1bmN0aW9uKGUsdCxpLG4pe2Z1bmN0aW9uIGEoZSl7KGU+b3x8dm9pZCAwPT09bykmJihvPWUpLChzPmV8fHZvaWQgMD09PXMpJiYocz1lKX12YXIgbyxzLHI7aWYoZSYmMCE9PWUubGVuZ3RoKXtpZigxPT1lLmxlbmd0aCYmKHM9MCksMSE9ZS5sZW5ndGgpZm9yKHZhciBsPTA7bDxlLmxlbmd0aDtsKyspYSh0aGlzLmdldERhdGFGcm9tT3B0aW9uKGVbbF0udmFsdWVbdF0pKTtlbHNle3I9ZVswXTtmb3IodmFyIGw9MDtsPHIudmFsdWUubGVuZ3RoO2wrKylhKHRoaXMuZ2V0RGF0YUZyb21PcHRpb24oci52YWx1ZVtsXSkpfXZhciBoPU1hdGguYWJzKG8tcyk7cmV0dXJuIHMtPU1hdGguYWJzKGgqblswXSksbys9TWF0aC5hYnMoaCpuWzFdKSxzPT09byYmKDA9PT1vP289MTpvPjA/cz1vL2k6by89aSkse21heDpvLG1pbjpzfX19LGdldFZlY3RvcjpmdW5jdGlvbihlLHQsaSl7ZT1lfHwwLHQ9dHx8MDt2YXIgbj10aGlzLnBvbGFyW2VdLl9fZWNJbmRpY2F0b3I7aWYoISh0Pj1uLmxlbmd0aCkpe3ZhciBhLG89dGhpcy5wb2xhcltlXS5fX2VjSW5kaWNhdG9yW3RdLHM9dGhpcy5nZXRDZW50ZXIoZSkscj1vLnZlY3RvcixsPW8udmFsdWUubWF4LGg9by52YWx1ZS5taW47aWYoXCJ1bmRlZmluZWRcIj09dHlwZW9mIGkpcmV0dXJuIHM7c3dpdGNoKGkpe2Nhc2VcIm1pblwiOmk9aDticmVhaztjYXNlXCJtYXhcIjppPWw7YnJlYWs7Y2FzZVwiY2VudGVyXCI6aT0obCtoKS8yfXJldHVybiBhPWwhPWg/KGktaCkvKGwtaCk6LjUsdGhpcy5fbWFwVmVjdG9yKHIscyxhKX19LGlzSW5zaWRlOmZ1bmN0aW9uKGUpe3ZhciB0PXRoaXMuZ2V0TmVhcmVzdEluZGV4KGUpO3JldHVybiB0P3QucG9sYXJJbmRleDotMX0sZ2V0TmVhcmVzdEluZGV4OmZ1bmN0aW9uKGUpe2Zvcih2YXIgdCxpLG4sYSxvLHMscixsLGgsbT0wO208dGhpcy5wb2xhci5sZW5ndGg7bSsrKXtpZih0PXRoaXMucG9sYXJbbV0saT10aGlzLmdldENlbnRlcihtKSxlWzBdPT1pWzBdJiZlWzFdPT1pWzFdKXJldHVybntwb2xhckluZGV4Om0sdmFsdWVJbmRleDowfTtpZihuPXRoaXMuX2dldFJhZGl1cygpLG89dC5zdGFydEFuZ2xlLHM9dC5pbmRpY2F0b3Iscj1zLmxlbmd0aCxsPTIqTWF0aC5QSS9yLGE9ZC5jYXJ0ZXNpYW4ycG9sYXIoZVswXS1pWzBdLGlbMV0tZVsxXSksZVswXS1pWzBdPDAmJihhWzFdKz1NYXRoLlBJKSxhWzFdPDAmJihhWzFdKz0yKk1hdGguUEkpLGg9YVsxXS1vLzE4MCpNYXRoLlBJKzIqTWF0aC5QSSxNYXRoLmFicyhNYXRoLmNvcyhoJShsLzIpKSkqbj5hWzBdKXJldHVybntwb2xhckluZGV4Om0sdmFsdWVJbmRleDpNYXRoLmZsb29yKChoK2wvMikvbCklcn19fSxnZXRJbmRpY2F0b3I6ZnVuY3Rpb24oZSl7dmFyIGU9ZXx8MDtyZXR1cm4gdGhpcy5wb2xhcltlXS5pbmRpY2F0b3J9LHJlZnJlc2g6ZnVuY3Rpb24oZSl7ZSYmKHRoaXMub3B0aW9uPWUsdGhpcy5wb2xhcj10aGlzLm9wdGlvbi5wb2xhcix0aGlzLnNlcmllcz10aGlzLm9wdGlvbi5zZXJpZXMpLHRoaXMuY2xlYXIoKSx0aGlzLl9idWlsZFNoYXBlKCl9fSxoLmluaGVyaXRzKHQsaSksZShcIi4uL2NvbXBvbmVudFwiKS5kZWZpbmUoXCJwb2xhclwiLHQpLHR9KSxkZWZpbmUoXCJlY2hhcnRzL3V0aWwvY29vcmRpbmF0ZXNcIixbXCJyZXF1aXJlXCIsXCJ6cmVuZGVyL3Rvb2wvbWF0aFwiXSxmdW5jdGlvbihlKXtmdW5jdGlvbiB0KGUsdCl7cmV0dXJuW2Uqbi5zaW4odCksZSpuLmNvcyh0KV19ZnVuY3Rpb24gaShlLHQpe3JldHVybltNYXRoLnNxcnQoZSplK3QqdCksTWF0aC5hdGFuKHQvZSldfXZhciBuPWUoXCJ6cmVuZGVyL3Rvb2wvbWF0aFwiKTtyZXR1cm57cG9sYXIyY2FydGVzaWFuOnQsY2FydGVzaWFuMnBvbGFyOml9fSk7Il0sImZpbGUiOiJwbHVnaW5zL2VjaGFydHMvY2hhcnQvcmFkYXIuanMifQ==