(function($,h,c){var a=$([]),e=$.resize=$.extend($.resize,{}),i,k="setTimeout",j="resize",d=j+"-special-event",b="delay",f="throttleWindow";e[b]=50;e[f]=true;$.event.special[j]={setup:function(){if(!e[f]&&this[k]){return false}var l=$(this);a=a.add(l);$.data(this,d,{w:l.width(),h:l.height()});if(a.length===1){g()}},teardown:function(){if(!e[f]&&this[k]){return false}var l=$(this);a=a.not(l);l.removeData(d);if(!a.length){clearTimeout(i)}},add:function(l){if(!e[f]&&this[k]){return false}var n;function m(s,o,p){var q=$(this),r=$.data(this,d);r.w=o!==c?o:q.width();r.h=p!==c?p:q.height();n.apply(this,arguments)}if($.isFunction(l)){n=l;return m}else{n=l.handler;l.handler=m}}};function g(){i=h[k](function(){a.each(function(){if($(this).is(":hidden"))return;var n=$(this),m=n.width(),l=n.height(),o=$.data(this,d);if(m!==o.w||l!==o.h){n.trigger(j,[o.w=m,o.h=l])}});g()},e[b])}})(jQuery,this);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3Jlc2l6ZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oJCxoLGMpe3ZhciBhPSQoW10pLGU9JC5yZXNpemU9JC5leHRlbmQoJC5yZXNpemUse30pLGksaz1cInNldFRpbWVvdXRcIixqPVwicmVzaXplXCIsZD1qK1wiLXNwZWNpYWwtZXZlbnRcIixiPVwiZGVsYXlcIixmPVwidGhyb3R0bGVXaW5kb3dcIjtlW2JdPTUwO2VbZl09dHJ1ZTskLmV2ZW50LnNwZWNpYWxbal09e3NldHVwOmZ1bmN0aW9uKCl7aWYoIWVbZl0mJnRoaXNba10pe3JldHVybiBmYWxzZX12YXIgbD0kKHRoaXMpO2E9YS5hZGQobCk7JC5kYXRhKHRoaXMsZCx7dzpsLndpZHRoKCksaDpsLmhlaWdodCgpfSk7aWYoYS5sZW5ndGg9PT0xKXtnKCl9fSx0ZWFyZG93bjpmdW5jdGlvbigpe2lmKCFlW2ZdJiZ0aGlzW2tdKXtyZXR1cm4gZmFsc2V9dmFyIGw9JCh0aGlzKTthPWEubm90KGwpO2wucmVtb3ZlRGF0YShkKTtpZighYS5sZW5ndGgpe2NsZWFyVGltZW91dChpKX19LGFkZDpmdW5jdGlvbihsKXtpZighZVtmXSYmdGhpc1trXSl7cmV0dXJuIGZhbHNlfXZhciBuO2Z1bmN0aW9uIG0ocyxvLHApe3ZhciBxPSQodGhpcykscj0kLmRhdGEodGhpcyxkKTtyLnc9byE9PWM/bzpxLndpZHRoKCk7ci5oPXAhPT1jP3A6cS5oZWlnaHQoKTtuLmFwcGx5KHRoaXMsYXJndW1lbnRzKX1pZigkLmlzRnVuY3Rpb24obCkpe249bDtyZXR1cm4gbX1lbHNle249bC5oYW5kbGVyO2wuaGFuZGxlcj1tfX19O2Z1bmN0aW9uIGcoKXtpPWhba10oZnVuY3Rpb24oKXthLmVhY2goZnVuY3Rpb24oKXtpZigkKHRoaXMpLmlzKFwiOmhpZGRlblwiKSlyZXR1cm47dmFyIG49JCh0aGlzKSxtPW4ud2lkdGgoKSxsPW4uaGVpZ2h0KCksbz0kLmRhdGEodGhpcyxkKTtpZihtIT09by53fHxsIT09by5oKXtuLnRyaWdnZXIoaixbby53PW0sby5oPWxdKX19KTtnKCl9LGVbYl0pfX0pKGpRdWVyeSx0aGlzKTsiXSwiZmlsZSI6InBsdWdpbnMvcmVzaXplLmpzIn0=