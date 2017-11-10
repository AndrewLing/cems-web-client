(function () {
    var parent = window.parent;
    //dialog对象
    dialog = parent.$EDITORUI[window.frameElement.id.replace( /_iframe$/, '' )];
    //当前打开dialog的编辑器实例
    editor = dialog.editor;

    UE = parent.UE;

    domUtils = UE.dom.domUtils;

    utils = UE.utils;

    browser = UE.browser;

    ajax = UE.ajax;

    $G = function ( id ) {
        return document.getElementById( id )
    };
    //focus元素
    $focus = function ( node ) {
        setTimeout( function () {
            if ( browser.ie ) {
                var r = node.createTextRange();
                r.collapse( false );
                r.select();
            } else {
                node.focus()
            }
        }, 0 )
    };
    utils.loadFile(document,{
        href:editor.options.themePath + editor.options.theme + "/dialogbase.css?cache="+Math.random(),
        tag:"link",
        type:"text/css",
        rel:"stylesheet"
    });
    lang = editor.getLang(dialog.className.split( "-" )[2]);
    if(lang){
        domUtils.on(window,'load',function () {

            var langImgPath = editor.options.langPath + editor.options.lang + "/images/";
            //针对静态资源
            for ( var i in lang["static"] ) {
                var dom = $G( i );
                if(!dom) continue;
                var tagName = dom.tagName,
                    content = lang["static"][i];
                if(content.src){
                    //clone
                    content = utils.extend({},content,false);
                    content.src = langImgPath + content.src;
                }
                if(content.style){
                    content = utils.extend({},content,false);
                    content.style = content.style.replace(/url\s*\(/g,"url(" + langImgPath)
                }
                switch ( tagName.toLowerCase() ) {
                    case "var":
                        dom.parentNode.replaceChild( document.createTextNode( content ), dom );
                        break;
                    case "select":
                        var ops = dom.options;
                        for ( var j = 0, oj; oj = ops[j]; ) {
                            oj.innerHTML = content.options[j++];
                        }
                        for ( var p in content ) {
                            p != "options" && dom.setAttribute( p, content[p] );
                        }
                        break;
                    default :
                        domUtils.setAttributes( dom, content);
                }
            }
        } );
    }


})();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvZGlhbG9ncy9pbnRlcm5hbC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHBhcmVudCA9IHdpbmRvdy5wYXJlbnQ7XHJcbiAgICAvL2RpYWxvZ+WvueixoVxyXG4gICAgZGlhbG9nID0gcGFyZW50LiRFRElUT1JVSVt3aW5kb3cuZnJhbWVFbGVtZW50LmlkLnJlcGxhY2UoIC9faWZyYW1lJC8sICcnICldO1xyXG4gICAgLy/lvZPliY3miZPlvIBkaWFsb2fnmoTnvJbovpHlmajlrp7kvotcclxuICAgIGVkaXRvciA9IGRpYWxvZy5lZGl0b3I7XHJcblxyXG4gICAgVUUgPSBwYXJlbnQuVUU7XHJcblxyXG4gICAgZG9tVXRpbHMgPSBVRS5kb20uZG9tVXRpbHM7XHJcblxyXG4gICAgdXRpbHMgPSBVRS51dGlscztcclxuXHJcbiAgICBicm93c2VyID0gVUUuYnJvd3NlcjtcclxuXHJcbiAgICBhamF4ID0gVUUuYWpheDtcclxuXHJcbiAgICAkRyA9IGZ1bmN0aW9uICggaWQgKSB7XHJcbiAgICAgICAgcmV0dXJuIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCBpZCApXHJcbiAgICB9O1xyXG4gICAgLy9mb2N1c+WFg+e0oFxyXG4gICAgJGZvY3VzID0gZnVuY3Rpb24gKCBub2RlICkge1xyXG4gICAgICAgIHNldFRpbWVvdXQoIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKCBicm93c2VyLmllICkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHIgPSBub2RlLmNyZWF0ZVRleHRSYW5nZSgpO1xyXG4gICAgICAgICAgICAgICAgci5jb2xsYXBzZSggZmFsc2UgKTtcclxuICAgICAgICAgICAgICAgIHIuc2VsZWN0KCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBub2RlLmZvY3VzKClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIDAgKVxyXG4gICAgfTtcclxuICAgIHV0aWxzLmxvYWRGaWxlKGRvY3VtZW50LHtcclxuICAgICAgICBocmVmOmVkaXRvci5vcHRpb25zLnRoZW1lUGF0aCArIGVkaXRvci5vcHRpb25zLnRoZW1lICsgXCIvZGlhbG9nYmFzZS5jc3M/Y2FjaGU9XCIrTWF0aC5yYW5kb20oKSxcclxuICAgICAgICB0YWc6XCJsaW5rXCIsXHJcbiAgICAgICAgdHlwZTpcInRleHQvY3NzXCIsXHJcbiAgICAgICAgcmVsOlwic3R5bGVzaGVldFwiXHJcbiAgICB9KTtcclxuICAgIGxhbmcgPSBlZGl0b3IuZ2V0TGFuZyhkaWFsb2cuY2xhc3NOYW1lLnNwbGl0KCBcIi1cIiApWzJdKTtcclxuICAgIGlmKGxhbmcpe1xyXG4gICAgICAgIGRvbVV0aWxzLm9uKHdpbmRvdywnbG9hZCcsZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgdmFyIGxhbmdJbWdQYXRoID0gZWRpdG9yLm9wdGlvbnMubGFuZ1BhdGggKyBlZGl0b3Iub3B0aW9ucy5sYW5nICsgXCIvaW1hZ2VzL1wiO1xyXG4gICAgICAgICAgICAvL+mSiOWvuemdmeaAgei1hOa6kFxyXG4gICAgICAgICAgICBmb3IgKCB2YXIgaSBpbiBsYW5nW1wic3RhdGljXCJdICkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGRvbSA9ICRHKCBpICk7XHJcbiAgICAgICAgICAgICAgICBpZighZG9tKSBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIHZhciB0YWdOYW1lID0gZG9tLnRhZ05hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgY29udGVudCA9IGxhbmdbXCJzdGF0aWNcIl1baV07XHJcbiAgICAgICAgICAgICAgICBpZihjb250ZW50LnNyYyl7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9jbG9uZVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQgPSB1dGlscy5leHRlbmQoe30sY29udGVudCxmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGVudC5zcmMgPSBsYW5nSW1nUGF0aCArIGNvbnRlbnQuc3JjO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYoY29udGVudC5zdHlsZSl7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGVudCA9IHV0aWxzLmV4dGVuZCh7fSxjb250ZW50LGZhbHNlKTtcclxuICAgICAgICAgICAgICAgICAgICBjb250ZW50LnN0eWxlID0gY29udGVudC5zdHlsZS5yZXBsYWNlKC91cmxcXHMqXFwoL2csXCJ1cmwoXCIgKyBsYW5nSW1nUGF0aClcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHN3aXRjaCAoIHRhZ05hbWUudG9Mb3dlckNhc2UoKSApIHtcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwidmFyXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvbS5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZCggZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoIGNvbnRlbnQgKSwgZG9tICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJzZWxlY3RcIjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG9wcyA9IGRvbS5vcHRpb25zO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaiA9IDAsIG9qOyBvaiA9IG9wc1tqXTsgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvai5pbm5lckhUTUwgPSBjb250ZW50Lm9wdGlvbnNbaisrXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKCB2YXIgcCBpbiBjb250ZW50ICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcCAhPSBcIm9wdGlvbnNcIiAmJiBkb20uc2V0QXR0cmlidXRlKCBwLCBjb250ZW50W3BdICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdCA6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvbVV0aWxzLnNldEF0dHJpYnV0ZXMoIGRvbSwgY29udGVudCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9ICk7XHJcbiAgICB9XHJcblxyXG5cclxufSkoKTtcclxuXHJcbiJdLCJmaWxlIjoicGx1Z2lucy91ZWRpdG9yL2RpYWxvZ3MvaW50ZXJuYWwuanMifQ==
