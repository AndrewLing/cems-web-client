/*
 Highcharts JS v3.0.6 (2013-10-04)
 Exporting module

 (c) 2010-2013 Torstein Hønsi

 License: www.highcharts.com/license
*/
(function(f){var A=f.Chart,t=f.addEvent,C=f.removeEvent,k=f.createElement,n=f.discardElement,u=f.css,o=f.merge,r=f.each,p=f.extend,D=Math.max,j=document,B=window,E=f.isTouchDevice,F=f.Renderer.prototype.symbols,x=f.getOptions(),y;p(x.lang,{printChart:"Print chart",downloadPNG:"Download PNG image",downloadJPEG:"Download JPEG image",downloadPDF:"Download PDF document",downloadSVG:"Download SVG vector image",contextButtonTitle:"Chart context menu"});x.navigation={menuStyle:{border:"1px solid #A0A0A0",
background:"#FFFFFF",padding:"5px 0"},menuItemStyle:{padding:"0 10px",background:"none",color:"#303030",fontSize:E?"14px":"11px"},menuItemHoverStyle:{background:"#4572A5",color:"#FFFFFF"},buttonOptions:{symbolFill:"#E0E0E0",symbolSize:14,symbolStroke:"#666",symbolStrokeWidth:3,symbolX:12.5,symbolY:10.5,align:"right",buttonSpacing:3,height:22,theme:{fill:"white",stroke:"none"},verticalAlign:"top",width:24}};x.exporting={type:"image/png",url:"http://export.highcharts.com/",buttons:{contextButton:{menuClassName:"highcharts-contextmenu",
symbol:"menu",_titleKey:"contextButtonTitle",menuItems:[{textKey:"printChart",onclick:function(){this.print()}},{separator:!0},{textKey:"downloadPNG",onclick:function(){this.exportChart()}},{textKey:"downloadJPEG",onclick:function(){this.exportChart({type:"image/jpeg"})}},{textKey:"downloadPDF",onclick:function(){this.exportChart({type:"application/pdf"})}},{textKey:"downloadSVG",onclick:function(){this.exportChart({type:"image/svg+xml"})}}]}}};f.post=function(c,a){var d,b;b=k("form",{method:"post",
action:c,enctype:"multipart/form-data"},{display:"none"},j.body);for(d in a)k("input",{type:"hidden",name:d,value:a[d]},null,b);b.submit();n(b)};p(A.prototype,{getSVG:function(c){var a=this,d,b,z,h,g=o(a.options,c);if(!j.createElementNS)j.createElementNS=function(a,b){return j.createElement(b)};c=k("div",null,{position:"absolute",top:"-9999em",width:a.chartWidth+"px",height:a.chartHeight+"px"},j.body);b=a.renderTo.style.width;h=a.renderTo.style.height;b=g.exporting.sourceWidth||g.chart.width||/px$/.test(b)&&
parseInt(b,10)||600;h=g.exporting.sourceHeight||g.chart.height||/px$/.test(h)&&parseInt(h,10)||400;p(g.chart,{animation:!1,renderTo:c,forExport:!0,width:b,height:h});g.exporting.enabled=!1;g.series=[];r(a.series,function(a){z=o(a.options,{animation:!1,showCheckbox:!1,visible:a.visible});z.isInternal||g.series.push(z)});d=new f.Chart(g,a.callback);r(["xAxis","yAxis"],function(b){r(a[b],function(a,c){var g=d[b][c],f=a.getExtremes(),h=f.userMin,f=f.userMax;g&&(h!==void 0||f!==void 0)&&g.setExtremes(h,
f,!0,!1)})});b=d.container.innerHTML;g=null;d.destroy();n(c);b=b.replace(/zIndex="[^"]+"/g,"").replace(/isShadow="[^"]+"/g,"").replace(/symbolName="[^"]+"/g,"").replace(/jQuery[0-9]+="[^"]+"/g,"").replace(/url\([^#]+#/g,"url(#").replace(/<svg /,'<svg xmlns:xlink="http://www.w3.org/1999/xlink" ').replace(/ href=/g," xlink:href=").replace(/\n/," ").replace(/<\/svg>.*?$/,"</svg>").replace(/&nbsp;/g," ").replace(/&shy;/g,"­").replace(/<IMG /g,"<image ").replace(/height=([^" ]+)/g,'height="$1"').replace(/width=([^" ]+)/g,
'width="$1"').replace(/hc-svg-href="([^"]+)">/g,'xlink:href="$1"/>').replace(/id=([^" >]+)/g,'id="$1"').replace(/class=([^" >]+)/g,'class="$1"').replace(/ transform /g," ").replace(/:(path|rect)/g,"$1").replace(/style="([^"]+)"/g,function(a){return a.toLowerCase()});return b=b.replace(/(url\(#highcharts-[0-9]+)&quot;/g,"$1").replace(/&quot;/g,"'")},exportChart:function(c,a){var c=c||{},d=this.options.exporting,d=this.getSVG(o({chart:{borderRadius:0}},d.chartOptions,a,{exporting:{sourceWidth:c.sourceWidth||
d.sourceWidth,sourceHeight:c.sourceHeight||d.sourceHeight}})),c=o(this.options.exporting,c);f.post(c.url,{filename:c.filename||"chart",type:c.type,width:c.width||0,scale:c.scale||2,svg:d})},print:function(){var c=this,a=c.container,d=[],b=a.parentNode,f=j.body,h=f.childNodes;if(!c.isPrinting)c.isPrinting=!0,r(h,function(a,b){if(a.nodeType===1)d[b]=a.style.display,a.style.display="none"}),f.appendChild(a),B.focus(),B.print(),setTimeout(function(){b.appendChild(a);r(h,function(a,b){if(a.nodeType===
1)a.style.display=d[b]});c.isPrinting=!1},1E3)},contextMenu:function(c,a,d,b,f,h,g){var e=this,j=e.options.navigation,q=j.menuItemStyle,l=e.chartWidth,m=e.chartHeight,o="cache-"+c,i=e[o],s=D(f,h),v,w,n;if(!i)e[o]=i=k("div",{className:c},{position:"absolute",zIndex:1E3,padding:s+"px"},e.container),v=k("div",null,p({MozBoxShadow:"3px 3px 10px #888",WebkitBoxShadow:"3px 3px 10px #888",boxShadow:"3px 3px 10px #888"},j.menuStyle),i),w=function(){u(i,{display:"none"});g&&g.setState(0);e.openMenu=!1},t(i,
"mouseleave",function(){n=setTimeout(w,500)}),t(i,"mouseenter",function(){clearTimeout(n)}),t(document,"mousedown",function(a){e.pointer.inClass(a.target,c)||w()}),r(a,function(a){if(a){var b=a.separator?k("hr",null,null,v):k("div",{onmouseover:function(){u(this,j.menuItemHoverStyle)},onmouseout:function(){u(this,q)},onclick:function(){w();a.onclick.apply(e,arguments)},innerHTML:a.text||e.options.lang[a.textKey]},p({cursor:"pointer"},q),v);e.exportDivElements.push(b)}}),e.exportDivElements.push(v,
i),e.exportMenuWidth=i.offsetWidth,e.exportMenuHeight=i.offsetHeight;a={display:"block"};d+e.exportMenuWidth>l?a.right=l-d-f-s+"px":a.left=d-s+"px";b+h+e.exportMenuHeight>m&&g.alignOptions.verticalAlign!=="top"?a.bottom=m-b-s+"px":a.top=b+h-s+"px";u(i,a);e.openMenu=!0},addButton:function(c){var a=this,d=a.renderer,b=o(a.options.navigation.buttonOptions,c),j=b.onclick,h=b.menuItems,g,e,k={stroke:b.symbolStroke,fill:b.symbolFill},q=b.symbolSize||12;if(!a.btnCount)a.btnCount=0;if(!a.exportDivElements)a.exportDivElements=
[],a.exportSVGElements=[];if(b.enabled!==!1){var l=b.theme,m=l.states,n=m&&m.hover,m=m&&m.select,i;delete l.states;j?i=function(){j.apply(a,arguments)}:h&&(i=function(){a.contextMenu(e.menuClassName,h,e.translateX,e.translateY,e.width,e.height,e);e.setState(2)});b.text&&b.symbol?l.paddingLeft=f.pick(l.paddingLeft,25):b.text||p(l,{width:b.width,height:b.height,padding:0});e=d.button(b.text,0,0,i,l,n,m).attr({title:a.options.lang[b._titleKey],"stroke-linecap":"round"});e.menuClassName=c.menuClassName||
"highcharts-menu-"+a.btnCount++;b.symbol&&(g=d.symbol(b.symbol,b.symbolX-q/2,b.symbolY-q/2,q,q).attr(p(k,{"stroke-width":b.symbolStrokeWidth||1,zIndex:1})).add(e));e.add().align(p(b,{width:e.width,x:f.pick(b.x,y)}),!0,"spacingBox");y+=(e.width+b.buttonSpacing)*(b.align==="right"?-1:1);a.exportSVGElements.push(e,g)}},destroyExport:function(c){var c=c.target,a,d;for(a=0;a<c.exportSVGElements.length;a++)if(d=c.exportSVGElements[a])d.onclick=d.ontouchstart=null,c.exportSVGElements[a]=d.destroy();for(a=
0;a<c.exportDivElements.length;a++)d=c.exportDivElements[a],C(d,"mouseleave"),c.exportDivElements[a]=d.onmouseout=d.onmouseover=d.ontouchstart=d.onclick=null,n(d)}});F.menu=function(c,a,d,b){return["M",c,a+2.5,"L",c+d,a+2.5,"M",c,a+b/2+0.5,"L",c+d,a+b/2+0.5,"M",c,a+b-1.5,"L",c+d,a+b-1.5]};A.prototype.callbacks.push(function(c){var a,d=c.options.exporting,b=d.buttons;y=0;if(d.enabled!==!1){for(a in b)c.addButton(b[a]);t(c,"destroy",c.destroyExport)}})})(Highcharts);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvdGhpcmQtcGFydHkvaGlnaGNoYXJ0cy9tb2R1bGVzL2V4cG9ydGluZy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuIEhpZ2hjaGFydHMgSlMgdjMuMC42ICgyMDEzLTEwLTA0KVxuIEV4cG9ydGluZyBtb2R1bGVcblxuIChjKSAyMDEwLTIwMTMgVG9yc3RlaW4gSMO4bnNpXG5cbiBMaWNlbnNlOiB3d3cuaGlnaGNoYXJ0cy5jb20vbGljZW5zZVxuKi9cbihmdW5jdGlvbihmKXt2YXIgQT1mLkNoYXJ0LHQ9Zi5hZGRFdmVudCxDPWYucmVtb3ZlRXZlbnQsaz1mLmNyZWF0ZUVsZW1lbnQsbj1mLmRpc2NhcmRFbGVtZW50LHU9Zi5jc3Msbz1mLm1lcmdlLHI9Zi5lYWNoLHA9Zi5leHRlbmQsRD1NYXRoLm1heCxqPWRvY3VtZW50LEI9d2luZG93LEU9Zi5pc1RvdWNoRGV2aWNlLEY9Zi5SZW5kZXJlci5wcm90b3R5cGUuc3ltYm9scyx4PWYuZ2V0T3B0aW9ucygpLHk7cCh4Lmxhbmcse3ByaW50Q2hhcnQ6XCJQcmludCBjaGFydFwiLGRvd25sb2FkUE5HOlwiRG93bmxvYWQgUE5HIGltYWdlXCIsZG93bmxvYWRKUEVHOlwiRG93bmxvYWQgSlBFRyBpbWFnZVwiLGRvd25sb2FkUERGOlwiRG93bmxvYWQgUERGIGRvY3VtZW50XCIsZG93bmxvYWRTVkc6XCJEb3dubG9hZCBTVkcgdmVjdG9yIGltYWdlXCIsY29udGV4dEJ1dHRvblRpdGxlOlwiQ2hhcnQgY29udGV4dCBtZW51XCJ9KTt4Lm5hdmlnYXRpb249e21lbnVTdHlsZTp7Ym9yZGVyOlwiMXB4IHNvbGlkICNBMEEwQTBcIixcbmJhY2tncm91bmQ6XCIjRkZGRkZGXCIscGFkZGluZzpcIjVweCAwXCJ9LG1lbnVJdGVtU3R5bGU6e3BhZGRpbmc6XCIwIDEwcHhcIixiYWNrZ3JvdW5kOlwibm9uZVwiLGNvbG9yOlwiIzMwMzAzMFwiLGZvbnRTaXplOkU/XCIxNHB4XCI6XCIxMXB4XCJ9LG1lbnVJdGVtSG92ZXJTdHlsZTp7YmFja2dyb3VuZDpcIiM0NTcyQTVcIixjb2xvcjpcIiNGRkZGRkZcIn0sYnV0dG9uT3B0aW9uczp7c3ltYm9sRmlsbDpcIiNFMEUwRTBcIixzeW1ib2xTaXplOjE0LHN5bWJvbFN0cm9rZTpcIiM2NjZcIixzeW1ib2xTdHJva2VXaWR0aDozLHN5bWJvbFg6MTIuNSxzeW1ib2xZOjEwLjUsYWxpZ246XCJyaWdodFwiLGJ1dHRvblNwYWNpbmc6MyxoZWlnaHQ6MjIsdGhlbWU6e2ZpbGw6XCJ3aGl0ZVwiLHN0cm9rZTpcIm5vbmVcIn0sdmVydGljYWxBbGlnbjpcInRvcFwiLHdpZHRoOjI0fX07eC5leHBvcnRpbmc9e3R5cGU6XCJpbWFnZS9wbmdcIix1cmw6XCJodHRwOi8vZXhwb3J0LmhpZ2hjaGFydHMuY29tL1wiLGJ1dHRvbnM6e2NvbnRleHRCdXR0b246e21lbnVDbGFzc05hbWU6XCJoaWdoY2hhcnRzLWNvbnRleHRtZW51XCIsXG5zeW1ib2w6XCJtZW51XCIsX3RpdGxlS2V5OlwiY29udGV4dEJ1dHRvblRpdGxlXCIsbWVudUl0ZW1zOlt7dGV4dEtleTpcInByaW50Q2hhcnRcIixvbmNsaWNrOmZ1bmN0aW9uKCl7dGhpcy5wcmludCgpfX0se3NlcGFyYXRvcjohMH0se3RleHRLZXk6XCJkb3dubG9hZFBOR1wiLG9uY2xpY2s6ZnVuY3Rpb24oKXt0aGlzLmV4cG9ydENoYXJ0KCl9fSx7dGV4dEtleTpcImRvd25sb2FkSlBFR1wiLG9uY2xpY2s6ZnVuY3Rpb24oKXt0aGlzLmV4cG9ydENoYXJ0KHt0eXBlOlwiaW1hZ2UvanBlZ1wifSl9fSx7dGV4dEtleTpcImRvd25sb2FkUERGXCIsb25jbGljazpmdW5jdGlvbigpe3RoaXMuZXhwb3J0Q2hhcnQoe3R5cGU6XCJhcHBsaWNhdGlvbi9wZGZcIn0pfX0se3RleHRLZXk6XCJkb3dubG9hZFNWR1wiLG9uY2xpY2s6ZnVuY3Rpb24oKXt0aGlzLmV4cG9ydENoYXJ0KHt0eXBlOlwiaW1hZ2Uvc3ZnK3htbFwifSl9fV19fX07Zi5wb3N0PWZ1bmN0aW9uKGMsYSl7dmFyIGQsYjtiPWsoXCJmb3JtXCIse21ldGhvZDpcInBvc3RcIixcbmFjdGlvbjpjLGVuY3R5cGU6XCJtdWx0aXBhcnQvZm9ybS1kYXRhXCJ9LHtkaXNwbGF5Olwibm9uZVwifSxqLmJvZHkpO2ZvcihkIGluIGEpayhcImlucHV0XCIse3R5cGU6XCJoaWRkZW5cIixuYW1lOmQsdmFsdWU6YVtkXX0sbnVsbCxiKTtiLnN1Ym1pdCgpO24oYil9O3AoQS5wcm90b3R5cGUse2dldFNWRzpmdW5jdGlvbihjKXt2YXIgYT10aGlzLGQsYix6LGgsZz1vKGEub3B0aW9ucyxjKTtpZighai5jcmVhdGVFbGVtZW50TlMpai5jcmVhdGVFbGVtZW50TlM9ZnVuY3Rpb24oYSxiKXtyZXR1cm4gai5jcmVhdGVFbGVtZW50KGIpfTtjPWsoXCJkaXZcIixudWxsLHtwb3NpdGlvbjpcImFic29sdXRlXCIsdG9wOlwiLTk5OTllbVwiLHdpZHRoOmEuY2hhcnRXaWR0aCtcInB4XCIsaGVpZ2h0OmEuY2hhcnRIZWlnaHQrXCJweFwifSxqLmJvZHkpO2I9YS5yZW5kZXJUby5zdHlsZS53aWR0aDtoPWEucmVuZGVyVG8uc3R5bGUuaGVpZ2h0O2I9Zy5leHBvcnRpbmcuc291cmNlV2lkdGh8fGcuY2hhcnQud2lkdGh8fC9weCQvLnRlc3QoYikmJlxucGFyc2VJbnQoYiwxMCl8fDYwMDtoPWcuZXhwb3J0aW5nLnNvdXJjZUhlaWdodHx8Zy5jaGFydC5oZWlnaHR8fC9weCQvLnRlc3QoaCkmJnBhcnNlSW50KGgsMTApfHw0MDA7cChnLmNoYXJ0LHthbmltYXRpb246ITEscmVuZGVyVG86Yyxmb3JFeHBvcnQ6ITAsd2lkdGg6YixoZWlnaHQ6aH0pO2cuZXhwb3J0aW5nLmVuYWJsZWQ9ITE7Zy5zZXJpZXM9W107cihhLnNlcmllcyxmdW5jdGlvbihhKXt6PW8oYS5vcHRpb25zLHthbmltYXRpb246ITEsc2hvd0NoZWNrYm94OiExLHZpc2libGU6YS52aXNpYmxlfSk7ei5pc0ludGVybmFsfHxnLnNlcmllcy5wdXNoKHopfSk7ZD1uZXcgZi5DaGFydChnLGEuY2FsbGJhY2spO3IoW1wieEF4aXNcIixcInlBeGlzXCJdLGZ1bmN0aW9uKGIpe3IoYVtiXSxmdW5jdGlvbihhLGMpe3ZhciBnPWRbYl1bY10sZj1hLmdldEV4dHJlbWVzKCksaD1mLnVzZXJNaW4sZj1mLnVzZXJNYXg7ZyYmKGghPT12b2lkIDB8fGYhPT12b2lkIDApJiZnLnNldEV4dHJlbWVzKGgsXG5mLCEwLCExKX0pfSk7Yj1kLmNvbnRhaW5lci5pbm5lckhUTUw7Zz1udWxsO2QuZGVzdHJveSgpO24oYyk7Yj1iLnJlcGxhY2UoL3pJbmRleD1cIlteXCJdK1wiL2csXCJcIikucmVwbGFjZSgvaXNTaGFkb3c9XCJbXlwiXStcIi9nLFwiXCIpLnJlcGxhY2UoL3N5bWJvbE5hbWU9XCJbXlwiXStcIi9nLFwiXCIpLnJlcGxhY2UoL2pRdWVyeVswLTldKz1cIlteXCJdK1wiL2csXCJcIikucmVwbGFjZSgvdXJsXFwoW14jXSsjL2csXCJ1cmwoI1wiKS5yZXBsYWNlKC88c3ZnIC8sJzxzdmcgeG1sbnM6eGxpbms9XCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rXCIgJykucmVwbGFjZSgvIGhyZWY9L2csXCIgeGxpbms6aHJlZj1cIikucmVwbGFjZSgvXFxuLyxcIiBcIikucmVwbGFjZSgvPFxcL3N2Zz4uKj8kLyxcIjwvc3ZnPlwiKS5yZXBsYWNlKC8mbmJzcDsvZyxcIsKgXCIpLnJlcGxhY2UoLyZzaHk7L2csXCLCrVwiKS5yZXBsYWNlKC88SU1HIC9nLFwiPGltYWdlIFwiKS5yZXBsYWNlKC9oZWlnaHQ9KFteXCIgXSspL2csJ2hlaWdodD1cIiQxXCInKS5yZXBsYWNlKC93aWR0aD0oW15cIiBdKykvZyxcbid3aWR0aD1cIiQxXCInKS5yZXBsYWNlKC9oYy1zdmctaHJlZj1cIihbXlwiXSspXCI+L2csJ3hsaW5rOmhyZWY9XCIkMVwiLz4nKS5yZXBsYWNlKC9pZD0oW15cIiA+XSspL2csJ2lkPVwiJDFcIicpLnJlcGxhY2UoL2NsYXNzPShbXlwiID5dKykvZywnY2xhc3M9XCIkMVwiJykucmVwbGFjZSgvIHRyYW5zZm9ybSAvZyxcIiBcIikucmVwbGFjZSgvOihwYXRofHJlY3QpL2csXCIkMVwiKS5yZXBsYWNlKC9zdHlsZT1cIihbXlwiXSspXCIvZyxmdW5jdGlvbihhKXtyZXR1cm4gYS50b0xvd2VyQ2FzZSgpfSk7cmV0dXJuIGI9Yi5yZXBsYWNlKC8odXJsXFwoI2hpZ2hjaGFydHMtWzAtOV0rKSZxdW90Oy9nLFwiJDFcIikucmVwbGFjZSgvJnF1b3Q7L2csXCInXCIpfSxleHBvcnRDaGFydDpmdW5jdGlvbihjLGEpe3ZhciBjPWN8fHt9LGQ9dGhpcy5vcHRpb25zLmV4cG9ydGluZyxkPXRoaXMuZ2V0U1ZHKG8oe2NoYXJ0Ontib3JkZXJSYWRpdXM6MH19LGQuY2hhcnRPcHRpb25zLGEse2V4cG9ydGluZzp7c291cmNlV2lkdGg6Yy5zb3VyY2VXaWR0aHx8XG5kLnNvdXJjZVdpZHRoLHNvdXJjZUhlaWdodDpjLnNvdXJjZUhlaWdodHx8ZC5zb3VyY2VIZWlnaHR9fSkpLGM9byh0aGlzLm9wdGlvbnMuZXhwb3J0aW5nLGMpO2YucG9zdChjLnVybCx7ZmlsZW5hbWU6Yy5maWxlbmFtZXx8XCJjaGFydFwiLHR5cGU6Yy50eXBlLHdpZHRoOmMud2lkdGh8fDAsc2NhbGU6Yy5zY2FsZXx8Mixzdmc6ZH0pfSxwcmludDpmdW5jdGlvbigpe3ZhciBjPXRoaXMsYT1jLmNvbnRhaW5lcixkPVtdLGI9YS5wYXJlbnROb2RlLGY9ai5ib2R5LGg9Zi5jaGlsZE5vZGVzO2lmKCFjLmlzUHJpbnRpbmcpYy5pc1ByaW50aW5nPSEwLHIoaCxmdW5jdGlvbihhLGIpe2lmKGEubm9kZVR5cGU9PT0xKWRbYl09YS5zdHlsZS5kaXNwbGF5LGEuc3R5bGUuZGlzcGxheT1cIm5vbmVcIn0pLGYuYXBwZW5kQ2hpbGQoYSksQi5mb2N1cygpLEIucHJpbnQoKSxzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7Yi5hcHBlbmRDaGlsZChhKTtyKGgsZnVuY3Rpb24oYSxiKXtpZihhLm5vZGVUeXBlPT09XG4xKWEuc3R5bGUuZGlzcGxheT1kW2JdfSk7Yy5pc1ByaW50aW5nPSExfSwxRTMpfSxjb250ZXh0TWVudTpmdW5jdGlvbihjLGEsZCxiLGYsaCxnKXt2YXIgZT10aGlzLGo9ZS5vcHRpb25zLm5hdmlnYXRpb24scT1qLm1lbnVJdGVtU3R5bGUsbD1lLmNoYXJ0V2lkdGgsbT1lLmNoYXJ0SGVpZ2h0LG89XCJjYWNoZS1cIitjLGk9ZVtvXSxzPUQoZixoKSx2LHcsbjtpZighaSllW29dPWk9ayhcImRpdlwiLHtjbGFzc05hbWU6Y30se3Bvc2l0aW9uOlwiYWJzb2x1dGVcIix6SW5kZXg6MUUzLHBhZGRpbmc6cytcInB4XCJ9LGUuY29udGFpbmVyKSx2PWsoXCJkaXZcIixudWxsLHAoe01vekJveFNoYWRvdzpcIjNweCAzcHggMTBweCAjODg4XCIsV2Via2l0Qm94U2hhZG93OlwiM3B4IDNweCAxMHB4ICM4ODhcIixib3hTaGFkb3c6XCIzcHggM3B4IDEwcHggIzg4OFwifSxqLm1lbnVTdHlsZSksaSksdz1mdW5jdGlvbigpe3UoaSx7ZGlzcGxheTpcIm5vbmVcIn0pO2cmJmcuc2V0U3RhdGUoMCk7ZS5vcGVuTWVudT0hMX0sdChpLFxuXCJtb3VzZWxlYXZlXCIsZnVuY3Rpb24oKXtuPXNldFRpbWVvdXQodyw1MDApfSksdChpLFwibW91c2VlbnRlclwiLGZ1bmN0aW9uKCl7Y2xlYXJUaW1lb3V0KG4pfSksdChkb2N1bWVudCxcIm1vdXNlZG93blwiLGZ1bmN0aW9uKGEpe2UucG9pbnRlci5pbkNsYXNzKGEudGFyZ2V0LGMpfHx3KCl9KSxyKGEsZnVuY3Rpb24oYSl7aWYoYSl7dmFyIGI9YS5zZXBhcmF0b3I/ayhcImhyXCIsbnVsbCxudWxsLHYpOmsoXCJkaXZcIix7b25tb3VzZW92ZXI6ZnVuY3Rpb24oKXt1KHRoaXMsai5tZW51SXRlbUhvdmVyU3R5bGUpfSxvbm1vdXNlb3V0OmZ1bmN0aW9uKCl7dSh0aGlzLHEpfSxvbmNsaWNrOmZ1bmN0aW9uKCl7dygpO2Eub25jbGljay5hcHBseShlLGFyZ3VtZW50cyl9LGlubmVySFRNTDphLnRleHR8fGUub3B0aW9ucy5sYW5nW2EudGV4dEtleV19LHAoe2N1cnNvcjpcInBvaW50ZXJcIn0scSksdik7ZS5leHBvcnREaXZFbGVtZW50cy5wdXNoKGIpfX0pLGUuZXhwb3J0RGl2RWxlbWVudHMucHVzaCh2LFxuaSksZS5leHBvcnRNZW51V2lkdGg9aS5vZmZzZXRXaWR0aCxlLmV4cG9ydE1lbnVIZWlnaHQ9aS5vZmZzZXRIZWlnaHQ7YT17ZGlzcGxheTpcImJsb2NrXCJ9O2QrZS5leHBvcnRNZW51V2lkdGg+bD9hLnJpZ2h0PWwtZC1mLXMrXCJweFwiOmEubGVmdD1kLXMrXCJweFwiO2IraCtlLmV4cG9ydE1lbnVIZWlnaHQ+bSYmZy5hbGlnbk9wdGlvbnMudmVydGljYWxBbGlnbiE9PVwidG9wXCI/YS5ib3R0b209bS1iLXMrXCJweFwiOmEudG9wPWIraC1zK1wicHhcIjt1KGksYSk7ZS5vcGVuTWVudT0hMH0sYWRkQnV0dG9uOmZ1bmN0aW9uKGMpe3ZhciBhPXRoaXMsZD1hLnJlbmRlcmVyLGI9byhhLm9wdGlvbnMubmF2aWdhdGlvbi5idXR0b25PcHRpb25zLGMpLGo9Yi5vbmNsaWNrLGg9Yi5tZW51SXRlbXMsZyxlLGs9e3N0cm9rZTpiLnN5bWJvbFN0cm9rZSxmaWxsOmIuc3ltYm9sRmlsbH0scT1iLnN5bWJvbFNpemV8fDEyO2lmKCFhLmJ0bkNvdW50KWEuYnRuQ291bnQ9MDtpZighYS5leHBvcnREaXZFbGVtZW50cylhLmV4cG9ydERpdkVsZW1lbnRzPVxuW10sYS5leHBvcnRTVkdFbGVtZW50cz1bXTtpZihiLmVuYWJsZWQhPT0hMSl7dmFyIGw9Yi50aGVtZSxtPWwuc3RhdGVzLG49bSYmbS5ob3ZlcixtPW0mJm0uc2VsZWN0LGk7ZGVsZXRlIGwuc3RhdGVzO2o/aT1mdW5jdGlvbigpe2ouYXBwbHkoYSxhcmd1bWVudHMpfTpoJiYoaT1mdW5jdGlvbigpe2EuY29udGV4dE1lbnUoZS5tZW51Q2xhc3NOYW1lLGgsZS50cmFuc2xhdGVYLGUudHJhbnNsYXRlWSxlLndpZHRoLGUuaGVpZ2h0LGUpO2Uuc2V0U3RhdGUoMil9KTtiLnRleHQmJmIuc3ltYm9sP2wucGFkZGluZ0xlZnQ9Zi5waWNrKGwucGFkZGluZ0xlZnQsMjUpOmIudGV4dHx8cChsLHt3aWR0aDpiLndpZHRoLGhlaWdodDpiLmhlaWdodCxwYWRkaW5nOjB9KTtlPWQuYnV0dG9uKGIudGV4dCwwLDAsaSxsLG4sbSkuYXR0cih7dGl0bGU6YS5vcHRpb25zLmxhbmdbYi5fdGl0bGVLZXldLFwic3Ryb2tlLWxpbmVjYXBcIjpcInJvdW5kXCJ9KTtlLm1lbnVDbGFzc05hbWU9Yy5tZW51Q2xhc3NOYW1lfHxcblwiaGlnaGNoYXJ0cy1tZW51LVwiK2EuYnRuQ291bnQrKztiLnN5bWJvbCYmKGc9ZC5zeW1ib2woYi5zeW1ib2wsYi5zeW1ib2xYLXEvMixiLnN5bWJvbFktcS8yLHEscSkuYXR0cihwKGsse1wic3Ryb2tlLXdpZHRoXCI6Yi5zeW1ib2xTdHJva2VXaWR0aHx8MSx6SW5kZXg6MX0pKS5hZGQoZSkpO2UuYWRkKCkuYWxpZ24ocChiLHt3aWR0aDplLndpZHRoLHg6Zi5waWNrKGIueCx5KX0pLCEwLFwic3BhY2luZ0JveFwiKTt5Kz0oZS53aWR0aCtiLmJ1dHRvblNwYWNpbmcpKihiLmFsaWduPT09XCJyaWdodFwiPy0xOjEpO2EuZXhwb3J0U1ZHRWxlbWVudHMucHVzaChlLGcpfX0sZGVzdHJveUV4cG9ydDpmdW5jdGlvbihjKXt2YXIgYz1jLnRhcmdldCxhLGQ7Zm9yKGE9MDthPGMuZXhwb3J0U1ZHRWxlbWVudHMubGVuZ3RoO2ErKylpZihkPWMuZXhwb3J0U1ZHRWxlbWVudHNbYV0pZC5vbmNsaWNrPWQub250b3VjaHN0YXJ0PW51bGwsYy5leHBvcnRTVkdFbGVtZW50c1thXT1kLmRlc3Ryb3koKTtmb3IoYT1cbjA7YTxjLmV4cG9ydERpdkVsZW1lbnRzLmxlbmd0aDthKyspZD1jLmV4cG9ydERpdkVsZW1lbnRzW2FdLEMoZCxcIm1vdXNlbGVhdmVcIiksYy5leHBvcnREaXZFbGVtZW50c1thXT1kLm9ubW91c2VvdXQ9ZC5vbm1vdXNlb3Zlcj1kLm9udG91Y2hzdGFydD1kLm9uY2xpY2s9bnVsbCxuKGQpfX0pO0YubWVudT1mdW5jdGlvbihjLGEsZCxiKXtyZXR1cm5bXCJNXCIsYyxhKzIuNSxcIkxcIixjK2QsYSsyLjUsXCJNXCIsYyxhK2IvMiswLjUsXCJMXCIsYytkLGErYi8yKzAuNSxcIk1cIixjLGErYi0xLjUsXCJMXCIsYytkLGErYi0xLjVdfTtBLnByb3RvdHlwZS5jYWxsYmFja3MucHVzaChmdW5jdGlvbihjKXt2YXIgYSxkPWMub3B0aW9ucy5leHBvcnRpbmcsYj1kLmJ1dHRvbnM7eT0wO2lmKGQuZW5hYmxlZCE9PSExKXtmb3IoYSBpbiBiKWMuYWRkQnV0dG9uKGJbYV0pO3QoYyxcImRlc3Ryb3lcIixjLmRlc3Ryb3lFeHBvcnQpfX0pfSkoSGlnaGNoYXJ0cyk7XG4iXSwiZmlsZSI6InBsdWdpbnMvdWVkaXRvci90aGlyZC1wYXJ0eS9oaWdoY2hhcnRzL21vZHVsZXMvZXhwb3J0aW5nLmpzIn0=