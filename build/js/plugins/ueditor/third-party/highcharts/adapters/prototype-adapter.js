/*
 Highcharts JS v3.0.6 (2013-10-04)
 Prototype adapter

 @author Michael Nelson, Torstein Hønsi.

 Feel free to use and modify this script.
 Highcharts license: www.highcharts.com/license.
*/
var HighchartsAdapter=function(){var f=typeof Effect!=="undefined";return{init:function(a){if(f)Effect.HighchartsTransition=Class.create(Effect.Base,{initialize:function(b,c,d,g){var e;this.element=b;this.key=c;e=b.attr?b.attr(c):$(b).getStyle(c);if(c==="d")this.paths=a.init(b,b.d,d),this.toD=d,e=0,d=1;this.start(Object.extend(g||{},{from:e,to:d,attribute:c}))},setup:function(){HighchartsAdapter._extend(this.element);if(!this.element._highchart_animation)this.element._highchart_animation={};this.element._highchart_animation[this.key]=
this},update:function(b){var c=this.paths,d=this.element;c&&(b=a.step(c[0],c[1],b,this.toD));d.attr?d.element&&d.attr(this.options.attribute,b):(c={},c[this.options.attribute]=b,$(d).setStyle(c))},finish:function(){this.element&&this.element._highchart_animation&&delete this.element._highchart_animation[this.key]}})},adapterRun:function(a,b){return parseInt($(a).getStyle(b),10)},getScript:function(a,b){var c=$$("head")[0];c&&c.appendChild((new Element("script",{type:"text/javascript",src:a})).observe("load",
b))},addNS:function(a){var b=/^(?:click|mouse(?:down|up|over|move|out))$/;return/^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/.test(a)||b.test(a)?a:"h:"+a},addEvent:function(a,b,c){a.addEventListener||a.attachEvent?Event.observe($(a),HighchartsAdapter.addNS(b),c):(HighchartsAdapter._extend(a),a._highcharts_observe(b,c))},animate:function(a,b,c){var d,c=c||{};c.delay=0;c.duration=(c.duration||500)/1E3;c.afterFinish=c.complete;if(f)for(d in b)new Effect.HighchartsTransition($(a),
d,b[d],c);else{if(a.attr)for(d in b)a.attr(d,b[d]);c.complete&&c.complete()}a.attr||$(a).setStyle(b)},stop:function(a){var b;if(a._highcharts_extended&&a._highchart_animation)for(b in a._highchart_animation)a._highchart_animation[b].cancel()},each:function(a,b){$A(a).each(b)},inArray:function(a,b,c){return b?b.indexOf(a,c):-1},offset:function(a){return $(a).cumulativeOffset()},fireEvent:function(a,b,c,d){a.fire?a.fire(HighchartsAdapter.addNS(b),c):a._highcharts_extended&&(c=c||{},a._highcharts_fire(b,
c));c&&c.defaultPrevented&&(d=null);d&&d(c)},removeEvent:function(a,b,c){$(a).stopObserving&&(b&&(b=HighchartsAdapter.addNS(b)),$(a).stopObserving(b,c));window===a?Event.stopObserving(a,b,c):(HighchartsAdapter._extend(a),a._highcharts_stop_observing(b,c))},washMouseEvent:function(a){return a},grep:function(a,b){return a.findAll(b)},map:function(a,b){return a.map(b)},_extend:function(a){a._highcharts_extended||Object.extend(a,{_highchart_events:{},_highchart_animation:null,_highcharts_extended:!0,
_highcharts_observe:function(b,a){this._highchart_events[b]=[this._highchart_events[b],a].compact().flatten()},_highcharts_stop_observing:function(b,a){b?a?this._highchart_events[b]=[this._highchart_events[b]].compact().flatten().without(a):delete this._highchart_events[b]:this._highchart_events={}},_highcharts_fire:function(a,c){var d=this;(this._highchart_events[a]||[]).each(function(a){if(!c.stopped)c.preventDefault=function(){c.defaultPrevented=!0},c.target=d,a.bind(this)(c)===!1&&c.preventDefault()}.bind(this))}})}}}();

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvdGhpcmQtcGFydHkvaGlnaGNoYXJ0cy9hZGFwdGVycy9wcm90b3R5cGUtYWRhcHRlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuIEhpZ2hjaGFydHMgSlMgdjMuMC42ICgyMDEzLTEwLTA0KVxuIFByb3RvdHlwZSBhZGFwdGVyXG5cbiBAYXV0aG9yIE1pY2hhZWwgTmVsc29uLCBUb3JzdGVpbiBIw7huc2kuXG5cbiBGZWVsIGZyZWUgdG8gdXNlIGFuZCBtb2RpZnkgdGhpcyBzY3JpcHQuXG4gSGlnaGNoYXJ0cyBsaWNlbnNlOiB3d3cuaGlnaGNoYXJ0cy5jb20vbGljZW5zZS5cbiovXG52YXIgSGlnaGNoYXJ0c0FkYXB0ZXI9ZnVuY3Rpb24oKXt2YXIgZj10eXBlb2YgRWZmZWN0IT09XCJ1bmRlZmluZWRcIjtyZXR1cm57aW5pdDpmdW5jdGlvbihhKXtpZihmKUVmZmVjdC5IaWdoY2hhcnRzVHJhbnNpdGlvbj1DbGFzcy5jcmVhdGUoRWZmZWN0LkJhc2Use2luaXRpYWxpemU6ZnVuY3Rpb24oYixjLGQsZyl7dmFyIGU7dGhpcy5lbGVtZW50PWI7dGhpcy5rZXk9YztlPWIuYXR0cj9iLmF0dHIoYyk6JChiKS5nZXRTdHlsZShjKTtpZihjPT09XCJkXCIpdGhpcy5wYXRocz1hLmluaXQoYixiLmQsZCksdGhpcy50b0Q9ZCxlPTAsZD0xO3RoaXMuc3RhcnQoT2JqZWN0LmV4dGVuZChnfHx7fSx7ZnJvbTplLHRvOmQsYXR0cmlidXRlOmN9KSl9LHNldHVwOmZ1bmN0aW9uKCl7SGlnaGNoYXJ0c0FkYXB0ZXIuX2V4dGVuZCh0aGlzLmVsZW1lbnQpO2lmKCF0aGlzLmVsZW1lbnQuX2hpZ2hjaGFydF9hbmltYXRpb24pdGhpcy5lbGVtZW50Ll9oaWdoY2hhcnRfYW5pbWF0aW9uPXt9O3RoaXMuZWxlbWVudC5faGlnaGNoYXJ0X2FuaW1hdGlvblt0aGlzLmtleV09XG50aGlzfSx1cGRhdGU6ZnVuY3Rpb24oYil7dmFyIGM9dGhpcy5wYXRocyxkPXRoaXMuZWxlbWVudDtjJiYoYj1hLnN0ZXAoY1swXSxjWzFdLGIsdGhpcy50b0QpKTtkLmF0dHI/ZC5lbGVtZW50JiZkLmF0dHIodGhpcy5vcHRpb25zLmF0dHJpYnV0ZSxiKTooYz17fSxjW3RoaXMub3B0aW9ucy5hdHRyaWJ1dGVdPWIsJChkKS5zZXRTdHlsZShjKSl9LGZpbmlzaDpmdW5jdGlvbigpe3RoaXMuZWxlbWVudCYmdGhpcy5lbGVtZW50Ll9oaWdoY2hhcnRfYW5pbWF0aW9uJiZkZWxldGUgdGhpcy5lbGVtZW50Ll9oaWdoY2hhcnRfYW5pbWF0aW9uW3RoaXMua2V5XX19KX0sYWRhcHRlclJ1bjpmdW5jdGlvbihhLGIpe3JldHVybiBwYXJzZUludCgkKGEpLmdldFN0eWxlKGIpLDEwKX0sZ2V0U2NyaXB0OmZ1bmN0aW9uKGEsYil7dmFyIGM9JCQoXCJoZWFkXCIpWzBdO2MmJmMuYXBwZW5kQ2hpbGQoKG5ldyBFbGVtZW50KFwic2NyaXB0XCIse3R5cGU6XCJ0ZXh0L2phdmFzY3JpcHRcIixzcmM6YX0pKS5vYnNlcnZlKFwibG9hZFwiLFxuYikpfSxhZGROUzpmdW5jdGlvbihhKXt2YXIgYj0vXig/OmNsaWNrfG1vdXNlKD86ZG93bnx1cHxvdmVyfG1vdmV8b3V0KSkkLztyZXR1cm4vXig/OmxvYWR8dW5sb2FkfGFib3J0fGVycm9yfHNlbGVjdHxjaGFuZ2V8c3VibWl0fHJlc2V0fGZvY3VzfGJsdXJ8cmVzaXplfHNjcm9sbCkkLy50ZXN0KGEpfHxiLnRlc3QoYSk/YTpcImg6XCIrYX0sYWRkRXZlbnQ6ZnVuY3Rpb24oYSxiLGMpe2EuYWRkRXZlbnRMaXN0ZW5lcnx8YS5hdHRhY2hFdmVudD9FdmVudC5vYnNlcnZlKCQoYSksSGlnaGNoYXJ0c0FkYXB0ZXIuYWRkTlMoYiksYyk6KEhpZ2hjaGFydHNBZGFwdGVyLl9leHRlbmQoYSksYS5faGlnaGNoYXJ0c19vYnNlcnZlKGIsYykpfSxhbmltYXRlOmZ1bmN0aW9uKGEsYixjKXt2YXIgZCxjPWN8fHt9O2MuZGVsYXk9MDtjLmR1cmF0aW9uPShjLmR1cmF0aW9ufHw1MDApLzFFMztjLmFmdGVyRmluaXNoPWMuY29tcGxldGU7aWYoZilmb3IoZCBpbiBiKW5ldyBFZmZlY3QuSGlnaGNoYXJ0c1RyYW5zaXRpb24oJChhKSxcbmQsYltkXSxjKTtlbHNle2lmKGEuYXR0cilmb3IoZCBpbiBiKWEuYXR0cihkLGJbZF0pO2MuY29tcGxldGUmJmMuY29tcGxldGUoKX1hLmF0dHJ8fCQoYSkuc2V0U3R5bGUoYil9LHN0b3A6ZnVuY3Rpb24oYSl7dmFyIGI7aWYoYS5faGlnaGNoYXJ0c19leHRlbmRlZCYmYS5faGlnaGNoYXJ0X2FuaW1hdGlvbilmb3IoYiBpbiBhLl9oaWdoY2hhcnRfYW5pbWF0aW9uKWEuX2hpZ2hjaGFydF9hbmltYXRpb25bYl0uY2FuY2VsKCl9LGVhY2g6ZnVuY3Rpb24oYSxiKXskQShhKS5lYWNoKGIpfSxpbkFycmF5OmZ1bmN0aW9uKGEsYixjKXtyZXR1cm4gYj9iLmluZGV4T2YoYSxjKTotMX0sb2Zmc2V0OmZ1bmN0aW9uKGEpe3JldHVybiAkKGEpLmN1bXVsYXRpdmVPZmZzZXQoKX0sZmlyZUV2ZW50OmZ1bmN0aW9uKGEsYixjLGQpe2EuZmlyZT9hLmZpcmUoSGlnaGNoYXJ0c0FkYXB0ZXIuYWRkTlMoYiksYyk6YS5faGlnaGNoYXJ0c19leHRlbmRlZCYmKGM9Y3x8e30sYS5faGlnaGNoYXJ0c19maXJlKGIsXG5jKSk7YyYmYy5kZWZhdWx0UHJldmVudGVkJiYoZD1udWxsKTtkJiZkKGMpfSxyZW1vdmVFdmVudDpmdW5jdGlvbihhLGIsYyl7JChhKS5zdG9wT2JzZXJ2aW5nJiYoYiYmKGI9SGlnaGNoYXJ0c0FkYXB0ZXIuYWRkTlMoYikpLCQoYSkuc3RvcE9ic2VydmluZyhiLGMpKTt3aW5kb3c9PT1hP0V2ZW50LnN0b3BPYnNlcnZpbmcoYSxiLGMpOihIaWdoY2hhcnRzQWRhcHRlci5fZXh0ZW5kKGEpLGEuX2hpZ2hjaGFydHNfc3RvcF9vYnNlcnZpbmcoYixjKSl9LHdhc2hNb3VzZUV2ZW50OmZ1bmN0aW9uKGEpe3JldHVybiBhfSxncmVwOmZ1bmN0aW9uKGEsYil7cmV0dXJuIGEuZmluZEFsbChiKX0sbWFwOmZ1bmN0aW9uKGEsYil7cmV0dXJuIGEubWFwKGIpfSxfZXh0ZW5kOmZ1bmN0aW9uKGEpe2EuX2hpZ2hjaGFydHNfZXh0ZW5kZWR8fE9iamVjdC5leHRlbmQoYSx7X2hpZ2hjaGFydF9ldmVudHM6e30sX2hpZ2hjaGFydF9hbmltYXRpb246bnVsbCxfaGlnaGNoYXJ0c19leHRlbmRlZDohMCxcbl9oaWdoY2hhcnRzX29ic2VydmU6ZnVuY3Rpb24oYixhKXt0aGlzLl9oaWdoY2hhcnRfZXZlbnRzW2JdPVt0aGlzLl9oaWdoY2hhcnRfZXZlbnRzW2JdLGFdLmNvbXBhY3QoKS5mbGF0dGVuKCl9LF9oaWdoY2hhcnRzX3N0b3Bfb2JzZXJ2aW5nOmZ1bmN0aW9uKGIsYSl7Yj9hP3RoaXMuX2hpZ2hjaGFydF9ldmVudHNbYl09W3RoaXMuX2hpZ2hjaGFydF9ldmVudHNbYl1dLmNvbXBhY3QoKS5mbGF0dGVuKCkud2l0aG91dChhKTpkZWxldGUgdGhpcy5faGlnaGNoYXJ0X2V2ZW50c1tiXTp0aGlzLl9oaWdoY2hhcnRfZXZlbnRzPXt9fSxfaGlnaGNoYXJ0c19maXJlOmZ1bmN0aW9uKGEsYyl7dmFyIGQ9dGhpczsodGhpcy5faGlnaGNoYXJ0X2V2ZW50c1thXXx8W10pLmVhY2goZnVuY3Rpb24oYSl7aWYoIWMuc3RvcHBlZCljLnByZXZlbnREZWZhdWx0PWZ1bmN0aW9uKCl7Yy5kZWZhdWx0UHJldmVudGVkPSEwfSxjLnRhcmdldD1kLGEuYmluZCh0aGlzKShjKT09PSExJiZjLnByZXZlbnREZWZhdWx0KCl9LmJpbmQodGhpcykpfX0pfX19KCk7XG4iXSwiZmlsZSI6InBsdWdpbnMvdWVkaXRvci90aGlyZC1wYXJ0eS9oaWdoY2hhcnRzL2FkYXB0ZXJzL3Byb3RvdHlwZS1hZGFwdGVyLmpzIn0=
