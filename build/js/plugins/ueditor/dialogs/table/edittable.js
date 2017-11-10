/**
 * Created with JetBrains PhpStorm.
 * User: xuheng
 * Date: 12-12-19
 * Time: 下午4:55
 * To change this template use File | Settings | File Templates.
 */
(function () {
    var title = $G("J_title"),
        titleCol = $G("J_titleCol"),
        caption = $G("J_caption"),
        sorttable = $G("J_sorttable"),
        autoSizeContent = $G("J_autoSizeContent"),
        autoSizePage = $G("J_autoSizePage"),
        tone = $G("J_tone"),
        me,
        preview = $G("J_preview");

    var editTable = function () {
        me = this;
        me.init();
    };
    editTable.prototype = {
        init:function () {
            var colorPiker = new UE.ui.ColorPicker({
                    editor:editor
                }),
                colorPop = new UE.ui.Popup({
                    editor:editor,
                    content:colorPiker
                });

            title.checked = editor.queryCommandState("inserttitle") == -1;
            titleCol.checked = editor.queryCommandState("inserttitlecol") == -1;
            caption.checked = editor.queryCommandState("insertcaption") == -1;
            sorttable.checked = editor.queryCommandState("enablesort") == 1;

            var enablesortState = editor.queryCommandState("enablesort"),
                disablesortState = editor.queryCommandState("disablesort");

            sorttable.checked = !!(enablesortState < 0 && disablesortState >=0);
            sorttable.disabled = !!(enablesortState < 0 && disablesortState < 0);
            sorttable.title = enablesortState < 0 && disablesortState < 0 ? lang.errorMsg:'';

            me.createTable(title.checked, titleCol.checked, caption.checked);
            me.setAutoSize();
            me.setColor(me.getColor());

            domUtils.on(title, "click", me.titleHanler);
            domUtils.on(titleCol, "click", me.titleColHanler);
            domUtils.on(caption, "click", me.captionHanler);
            domUtils.on(sorttable, "click", me.sorttableHanler);
            domUtils.on(autoSizeContent, "click", me.autoSizeContentHanler);
            domUtils.on(autoSizePage, "click", me.autoSizePageHanler);

            domUtils.on(tone, "click", function () {
                colorPop.showAnchor(tone);
            });
            domUtils.on(document, 'mousedown', function () {
                colorPop.hide();
            });
            colorPiker.addListener("pickcolor", function () {
                me.setColor(arguments[1]);
                colorPop.hide();
            });
            colorPiker.addListener("picknocolor", function () {
                me.setColor("");
                colorPop.hide();
            });
        },

        createTable:function (hasTitle, hasTitleCol, hasCaption) {
            var arr = [],
                sortSpan = '<span>^</span>';
            arr.push("<table id='J_example'>");
            if (hasCaption) {
                arr.push("<caption>" + lang.captionName + "</caption>")
            }
            if (hasTitle) {
                arr.push("<tr>");
                if(hasTitleCol) { arr.push("<th>" + lang.titleName + "</th>"); }
                for (var j = 0; j < 5; j++) {
                    arr.push("<th>" + lang.titleName + "</th>");
                }
                arr.push("</tr>");
            }
            for (var i = 0; i < 6; i++) {
                arr.push("<tr>");
                if(hasTitleCol) { arr.push("<th>" + lang.titleName + "</th>") }
                for (var k = 0; k < 5; k++) {
                    arr.push("<td>" + lang.cellsName + "</td>")
                }
                arr.push("</tr>");
            }
            arr.push("</table>");
            preview.innerHTML = arr.join("");
            this.updateSortSpan();
        },
        titleHanler:function () {
            var example = $G("J_example"),
                frg=document.createDocumentFragment(),
                color = domUtils.getComputedStyle(domUtils.getElementsByTagName(example, "td")[0], "border-color"),
                colCount = example.rows[0].children.length;

            if (title.checked) {
                example.insertRow(0);
                for (var i = 0, node; i < colCount; i++) {
                    node = document.createElement("th");
                    node.innerHTML = lang.titleName;
                    frg.appendChild(node);
                }
                example.rows[0].appendChild(frg);

            } else {
                domUtils.remove(example.rows[0]);
            }
            me.setColor(color);
            me.updateSortSpan();
        },
        titleColHanler:function () {
            var example = $G("J_example"),
                color = domUtils.getComputedStyle(domUtils.getElementsByTagName(example, "td")[0], "border-color"),
                colArr = example.rows,
                colCount = colArr.length;

            if (titleCol.checked) {
                for (var i = 0, node; i < colCount; i++) {
                    node = document.createElement("th");
                    node.innerHTML = lang.titleName;
                    colArr[i].insertBefore(node, colArr[i].children[0]);
                }
            } else {
                for (var i = 0; i < colCount; i++) {
                    domUtils.remove(colArr[i].children[0]);
                }
            }
            me.setColor(color);
            me.updateSortSpan();
        },
        captionHanler:function () {
            var example = $G("J_example");
            if (caption.checked) {
                var row = document.createElement('caption');
                row.innerHTML = lang.captionName;
                example.insertBefore(row, example.firstChild);
            } else {
                domUtils.remove(domUtils.getElementsByTagName(example, 'caption')[0]);
            }
        },
        sorttableHanler:function(){
            me.updateSortSpan();
        },
        autoSizeContentHanler:function () {
            var example = $G("J_example");
            example.removeAttribute("width");
        },
        autoSizePageHanler:function () {
            var example = $G("J_example");
            var tds = example.getElementsByTagName(example, "td");
            utils.each(tds, function (td) {
                td.removeAttribute("width");
            });
            example.setAttribute('width', '100%');
        },
        updateSortSpan: function(){
            var example = $G("J_example"),
                row = example.rows[0];

            var spans = domUtils.getElementsByTagName(example,"span");
            utils.each(spans,function(span){
                span.parentNode.removeChild(span);
            });
            if (sorttable.checked) {
                utils.each(row.cells, function(cell, i){
                    var span = document.createElement("span");
                    span.innerHTML = "^";
                    cell.appendChild(span);
                });
            }
        },
        getColor:function () {
            var start = editor.selection.getStart(), color,
                cell = domUtils.findParentByTagName(start, ["td", "th", "caption"], true);
            color = cell && domUtils.getComputedStyle(cell, "border-color");
            if (!color)  color = "#DDDDDD";
            return color;
        },
        setColor:function (color) {
            var example = $G("J_example"),
                arr = domUtils.getElementsByTagName(example, "td").concat(
                    domUtils.getElementsByTagName(example, "th"),
                    domUtils.getElementsByTagName(example, "caption")
                );

            tone.value = color;
            utils.each(arr, function (node) {
                node.style.borderColor = color;
            });

        },
        setAutoSize:function () {
            var me = this;
            autoSizePage.checked = true;
            me.autoSizePageHanler();
        }
    };

    new editTable;

    dialog.onok = function () {
        editor.__hasEnterExecCommand = true;

        var checks = {
            title:"inserttitle deletetitle",
            titleCol:"inserttitlecol deletetitlecol",
            caption:"insertcaption deletecaption",
            sorttable:"enablesort disablesort"
        };
        editor.fireEvent('saveScene');
        for(var i in checks){
            var cmds = checks[i].split(" "),
                input = $G("J_" + i);
            if(input["checked"]){
                editor.queryCommandState(cmds[0])!=-1 &&editor.execCommand(cmds[0]);
            }else{
                editor.queryCommandState(cmds[1])!=-1 &&editor.execCommand(cmds[1]);
            }
        }

        editor.execCommand("edittable", tone.value);
        autoSizeContent.checked ?editor.execCommand('adaptbytext') : "";
        autoSizePage.checked ? editor.execCommand("adaptbywindow") : "";
        editor.fireEvent('saveScene');

        editor.__hasEnterExecCommand = false;
    };
})();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvZGlhbG9ncy90YWJsZS9lZGl0dGFibGUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDcmVhdGVkIHdpdGggSmV0QnJhaW5zIFBocFN0b3JtLlxuICogVXNlcjogeHVoZW5nXG4gKiBEYXRlOiAxMi0xMi0xOVxuICogVGltZTog5LiL5Y2INDo1NVxuICogVG8gY2hhbmdlIHRoaXMgdGVtcGxhdGUgdXNlIEZpbGUgfCBTZXR0aW5ncyB8IEZpbGUgVGVtcGxhdGVzLlxuICovXG4oZnVuY3Rpb24gKCkge1xuICAgIHZhciB0aXRsZSA9ICRHKFwiSl90aXRsZVwiKSxcbiAgICAgICAgdGl0bGVDb2wgPSAkRyhcIkpfdGl0bGVDb2xcIiksXG4gICAgICAgIGNhcHRpb24gPSAkRyhcIkpfY2FwdGlvblwiKSxcbiAgICAgICAgc29ydHRhYmxlID0gJEcoXCJKX3NvcnR0YWJsZVwiKSxcbiAgICAgICAgYXV0b1NpemVDb250ZW50ID0gJEcoXCJKX2F1dG9TaXplQ29udGVudFwiKSxcbiAgICAgICAgYXV0b1NpemVQYWdlID0gJEcoXCJKX2F1dG9TaXplUGFnZVwiKSxcbiAgICAgICAgdG9uZSA9ICRHKFwiSl90b25lXCIpLFxuICAgICAgICBtZSxcbiAgICAgICAgcHJldmlldyA9ICRHKFwiSl9wcmV2aWV3XCIpO1xuXG4gICAgdmFyIGVkaXRUYWJsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbWUgPSB0aGlzO1xuICAgICAgICBtZS5pbml0KCk7XG4gICAgfTtcbiAgICBlZGl0VGFibGUucHJvdG90eXBlID0ge1xuICAgICAgICBpbml0OmZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBjb2xvclBpa2VyID0gbmV3IFVFLnVpLkNvbG9yUGlja2VyKHtcbiAgICAgICAgICAgICAgICAgICAgZWRpdG9yOmVkaXRvclxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIGNvbG9yUG9wID0gbmV3IFVFLnVpLlBvcHVwKHtcbiAgICAgICAgICAgICAgICAgICAgZWRpdG9yOmVkaXRvcixcbiAgICAgICAgICAgICAgICAgICAgY29udGVudDpjb2xvclBpa2VyXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHRpdGxlLmNoZWNrZWQgPSBlZGl0b3IucXVlcnlDb21tYW5kU3RhdGUoXCJpbnNlcnR0aXRsZVwiKSA9PSAtMTtcbiAgICAgICAgICAgIHRpdGxlQ29sLmNoZWNrZWQgPSBlZGl0b3IucXVlcnlDb21tYW5kU3RhdGUoXCJpbnNlcnR0aXRsZWNvbFwiKSA9PSAtMTtcbiAgICAgICAgICAgIGNhcHRpb24uY2hlY2tlZCA9IGVkaXRvci5xdWVyeUNvbW1hbmRTdGF0ZShcImluc2VydGNhcHRpb25cIikgPT0gLTE7XG4gICAgICAgICAgICBzb3J0dGFibGUuY2hlY2tlZCA9IGVkaXRvci5xdWVyeUNvbW1hbmRTdGF0ZShcImVuYWJsZXNvcnRcIikgPT0gMTtcblxuICAgICAgICAgICAgdmFyIGVuYWJsZXNvcnRTdGF0ZSA9IGVkaXRvci5xdWVyeUNvbW1hbmRTdGF0ZShcImVuYWJsZXNvcnRcIiksXG4gICAgICAgICAgICAgICAgZGlzYWJsZXNvcnRTdGF0ZSA9IGVkaXRvci5xdWVyeUNvbW1hbmRTdGF0ZShcImRpc2FibGVzb3J0XCIpO1xuXG4gICAgICAgICAgICBzb3J0dGFibGUuY2hlY2tlZCA9ICEhKGVuYWJsZXNvcnRTdGF0ZSA8IDAgJiYgZGlzYWJsZXNvcnRTdGF0ZSA+PTApO1xuICAgICAgICAgICAgc29ydHRhYmxlLmRpc2FibGVkID0gISEoZW5hYmxlc29ydFN0YXRlIDwgMCAmJiBkaXNhYmxlc29ydFN0YXRlIDwgMCk7XG4gICAgICAgICAgICBzb3J0dGFibGUudGl0bGUgPSBlbmFibGVzb3J0U3RhdGUgPCAwICYmIGRpc2FibGVzb3J0U3RhdGUgPCAwID8gbGFuZy5lcnJvck1zZzonJztcblxuICAgICAgICAgICAgbWUuY3JlYXRlVGFibGUodGl0bGUuY2hlY2tlZCwgdGl0bGVDb2wuY2hlY2tlZCwgY2FwdGlvbi5jaGVja2VkKTtcbiAgICAgICAgICAgIG1lLnNldEF1dG9TaXplKCk7XG4gICAgICAgICAgICBtZS5zZXRDb2xvcihtZS5nZXRDb2xvcigpKTtcblxuICAgICAgICAgICAgZG9tVXRpbHMub24odGl0bGUsIFwiY2xpY2tcIiwgbWUudGl0bGVIYW5sZXIpO1xuICAgICAgICAgICAgZG9tVXRpbHMub24odGl0bGVDb2wsIFwiY2xpY2tcIiwgbWUudGl0bGVDb2xIYW5sZXIpO1xuICAgICAgICAgICAgZG9tVXRpbHMub24oY2FwdGlvbiwgXCJjbGlja1wiLCBtZS5jYXB0aW9uSGFubGVyKTtcbiAgICAgICAgICAgIGRvbVV0aWxzLm9uKHNvcnR0YWJsZSwgXCJjbGlja1wiLCBtZS5zb3J0dGFibGVIYW5sZXIpO1xuICAgICAgICAgICAgZG9tVXRpbHMub24oYXV0b1NpemVDb250ZW50LCBcImNsaWNrXCIsIG1lLmF1dG9TaXplQ29udGVudEhhbmxlcik7XG4gICAgICAgICAgICBkb21VdGlscy5vbihhdXRvU2l6ZVBhZ2UsIFwiY2xpY2tcIiwgbWUuYXV0b1NpemVQYWdlSGFubGVyKTtcblxuICAgICAgICAgICAgZG9tVXRpbHMub24odG9uZSwgXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgY29sb3JQb3Auc2hvd0FuY2hvcih0b25lKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZG9tVXRpbHMub24oZG9jdW1lbnQsICdtb3VzZWRvd24nLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgY29sb3JQb3AuaGlkZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb2xvclBpa2VyLmFkZExpc3RlbmVyKFwicGlja2NvbG9yXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBtZS5zZXRDb2xvcihhcmd1bWVudHNbMV0pO1xuICAgICAgICAgICAgICAgIGNvbG9yUG9wLmhpZGUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29sb3JQaWtlci5hZGRMaXN0ZW5lcihcInBpY2tub2NvbG9yXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBtZS5zZXRDb2xvcihcIlwiKTtcbiAgICAgICAgICAgICAgICBjb2xvclBvcC5oaWRlKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBjcmVhdGVUYWJsZTpmdW5jdGlvbiAoaGFzVGl0bGUsIGhhc1RpdGxlQ29sLCBoYXNDYXB0aW9uKSB7XG4gICAgICAgICAgICB2YXIgYXJyID0gW10sXG4gICAgICAgICAgICAgICAgc29ydFNwYW4gPSAnPHNwYW4+Xjwvc3Bhbj4nO1xuICAgICAgICAgICAgYXJyLnB1c2goXCI8dGFibGUgaWQ9J0pfZXhhbXBsZSc+XCIpO1xuICAgICAgICAgICAgaWYgKGhhc0NhcHRpb24pIHtcbiAgICAgICAgICAgICAgICBhcnIucHVzaChcIjxjYXB0aW9uPlwiICsgbGFuZy5jYXB0aW9uTmFtZSArIFwiPC9jYXB0aW9uPlwiKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGhhc1RpdGxlKSB7XG4gICAgICAgICAgICAgICAgYXJyLnB1c2goXCI8dHI+XCIpO1xuICAgICAgICAgICAgICAgIGlmKGhhc1RpdGxlQ29sKSB7IGFyci5wdXNoKFwiPHRoPlwiICsgbGFuZy50aXRsZU5hbWUgKyBcIjwvdGg+XCIpOyB9XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCA1OyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgYXJyLnB1c2goXCI8dGg+XCIgKyBsYW5nLnRpdGxlTmFtZSArIFwiPC90aD5cIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGFyci5wdXNoKFwiPC90cj5cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDY7IGkrKykge1xuICAgICAgICAgICAgICAgIGFyci5wdXNoKFwiPHRyPlwiKTtcbiAgICAgICAgICAgICAgICBpZihoYXNUaXRsZUNvbCkgeyBhcnIucHVzaChcIjx0aD5cIiArIGxhbmcudGl0bGVOYW1lICsgXCI8L3RoPlwiKSB9XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgayA9IDA7IGsgPCA1OyBrKyspIHtcbiAgICAgICAgICAgICAgICAgICAgYXJyLnB1c2goXCI8dGQ+XCIgKyBsYW5nLmNlbGxzTmFtZSArIFwiPC90ZD5cIilcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYXJyLnB1c2goXCI8L3RyPlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGFyci5wdXNoKFwiPC90YWJsZT5cIik7XG4gICAgICAgICAgICBwcmV2aWV3LmlubmVySFRNTCA9IGFyci5qb2luKFwiXCIpO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVTb3J0U3BhbigpO1xuICAgICAgICB9LFxuICAgICAgICB0aXRsZUhhbmxlcjpmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgZXhhbXBsZSA9ICRHKFwiSl9leGFtcGxlXCIpLFxuICAgICAgICAgICAgICAgIGZyZz1kb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCksXG4gICAgICAgICAgICAgICAgY29sb3IgPSBkb21VdGlscy5nZXRDb21wdXRlZFN0eWxlKGRvbVV0aWxzLmdldEVsZW1lbnRzQnlUYWdOYW1lKGV4YW1wbGUsIFwidGRcIilbMF0sIFwiYm9yZGVyLWNvbG9yXCIpLFxuICAgICAgICAgICAgICAgIGNvbENvdW50ID0gZXhhbXBsZS5yb3dzWzBdLmNoaWxkcmVuLmxlbmd0aDtcblxuICAgICAgICAgICAgaWYgKHRpdGxlLmNoZWNrZWQpIHtcbiAgICAgICAgICAgICAgICBleGFtcGxlLmluc2VydFJvdygwKTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbm9kZTsgaSA8IGNvbENvdW50OyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0aFwiKTtcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5pbm5lckhUTUwgPSBsYW5nLnRpdGxlTmFtZTtcbiAgICAgICAgICAgICAgICAgICAgZnJnLmFwcGVuZENoaWxkKG5vZGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBleGFtcGxlLnJvd3NbMF0uYXBwZW5kQ2hpbGQoZnJnKTtcblxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkb21VdGlscy5yZW1vdmUoZXhhbXBsZS5yb3dzWzBdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG1lLnNldENvbG9yKGNvbG9yKTtcbiAgICAgICAgICAgIG1lLnVwZGF0ZVNvcnRTcGFuKCk7XG4gICAgICAgIH0sXG4gICAgICAgIHRpdGxlQ29sSGFubGVyOmZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBleGFtcGxlID0gJEcoXCJKX2V4YW1wbGVcIiksXG4gICAgICAgICAgICAgICAgY29sb3IgPSBkb21VdGlscy5nZXRDb21wdXRlZFN0eWxlKGRvbVV0aWxzLmdldEVsZW1lbnRzQnlUYWdOYW1lKGV4YW1wbGUsIFwidGRcIilbMF0sIFwiYm9yZGVyLWNvbG9yXCIpLFxuICAgICAgICAgICAgICAgIGNvbEFyciA9IGV4YW1wbGUucm93cyxcbiAgICAgICAgICAgICAgICBjb2xDb3VudCA9IGNvbEFyci5sZW5ndGg7XG5cbiAgICAgICAgICAgIGlmICh0aXRsZUNvbC5jaGVja2VkKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIG5vZGU7IGkgPCBjb2xDb3VudDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGhcIik7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUuaW5uZXJIVE1MID0gbGFuZy50aXRsZU5hbWU7XG4gICAgICAgICAgICAgICAgICAgIGNvbEFycltpXS5pbnNlcnRCZWZvcmUobm9kZSwgY29sQXJyW2ldLmNoaWxkcmVuWzBdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29sQ291bnQ7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBkb21VdGlscy5yZW1vdmUoY29sQXJyW2ldLmNoaWxkcmVuWzBdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtZS5zZXRDb2xvcihjb2xvcik7XG4gICAgICAgICAgICBtZS51cGRhdGVTb3J0U3BhbigpO1xuICAgICAgICB9LFxuICAgICAgICBjYXB0aW9uSGFubGVyOmZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBleGFtcGxlID0gJEcoXCJKX2V4YW1wbGVcIik7XG4gICAgICAgICAgICBpZiAoY2FwdGlvbi5jaGVja2VkKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhcHRpb24nKTtcbiAgICAgICAgICAgICAgICByb3cuaW5uZXJIVE1MID0gbGFuZy5jYXB0aW9uTmFtZTtcbiAgICAgICAgICAgICAgICBleGFtcGxlLmluc2VydEJlZm9yZShyb3csIGV4YW1wbGUuZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRvbVV0aWxzLnJlbW92ZShkb21VdGlscy5nZXRFbGVtZW50c0J5VGFnTmFtZShleGFtcGxlLCAnY2FwdGlvbicpWzBdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgc29ydHRhYmxlSGFubGVyOmZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBtZS51cGRhdGVTb3J0U3BhbigpO1xuICAgICAgICB9LFxuICAgICAgICBhdXRvU2l6ZUNvbnRlbnRIYW5sZXI6ZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGV4YW1wbGUgPSAkRyhcIkpfZXhhbXBsZVwiKTtcbiAgICAgICAgICAgIGV4YW1wbGUucmVtb3ZlQXR0cmlidXRlKFwid2lkdGhcIik7XG4gICAgICAgIH0sXG4gICAgICAgIGF1dG9TaXplUGFnZUhhbmxlcjpmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgZXhhbXBsZSA9ICRHKFwiSl9leGFtcGxlXCIpO1xuICAgICAgICAgICAgdmFyIHRkcyA9IGV4YW1wbGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoZXhhbXBsZSwgXCJ0ZFwiKTtcbiAgICAgICAgICAgIHV0aWxzLmVhY2godGRzLCBmdW5jdGlvbiAodGQpIHtcbiAgICAgICAgICAgICAgICB0ZC5yZW1vdmVBdHRyaWJ1dGUoXCJ3aWR0aFwiKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZXhhbXBsZS5zZXRBdHRyaWJ1dGUoJ3dpZHRoJywgJzEwMCUnKTtcbiAgICAgICAgfSxcbiAgICAgICAgdXBkYXRlU29ydFNwYW46IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgZXhhbXBsZSA9ICRHKFwiSl9leGFtcGxlXCIpLFxuICAgICAgICAgICAgICAgIHJvdyA9IGV4YW1wbGUucm93c1swXTtcblxuICAgICAgICAgICAgdmFyIHNwYW5zID0gZG9tVXRpbHMuZ2V0RWxlbWVudHNCeVRhZ05hbWUoZXhhbXBsZSxcInNwYW5cIik7XG4gICAgICAgICAgICB1dGlscy5lYWNoKHNwYW5zLGZ1bmN0aW9uKHNwYW4pe1xuICAgICAgICAgICAgICAgIHNwYW4ucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChzcGFuKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKHNvcnR0YWJsZS5jaGVja2VkKSB7XG4gICAgICAgICAgICAgICAgdXRpbHMuZWFjaChyb3cuY2VsbHMsIGZ1bmN0aW9uKGNlbGwsIGkpe1xuICAgICAgICAgICAgICAgICAgICB2YXIgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICAgICAgICAgICAgICBzcGFuLmlubmVySFRNTCA9IFwiXlwiO1xuICAgICAgICAgICAgICAgICAgICBjZWxsLmFwcGVuZENoaWxkKHNwYW4pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBnZXRDb2xvcjpmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgc3RhcnQgPSBlZGl0b3Iuc2VsZWN0aW9uLmdldFN0YXJ0KCksIGNvbG9yLFxuICAgICAgICAgICAgICAgIGNlbGwgPSBkb21VdGlscy5maW5kUGFyZW50QnlUYWdOYW1lKHN0YXJ0LCBbXCJ0ZFwiLCBcInRoXCIsIFwiY2FwdGlvblwiXSwgdHJ1ZSk7XG4gICAgICAgICAgICBjb2xvciA9IGNlbGwgJiYgZG9tVXRpbHMuZ2V0Q29tcHV0ZWRTdHlsZShjZWxsLCBcImJvcmRlci1jb2xvclwiKTtcbiAgICAgICAgICAgIGlmICghY29sb3IpICBjb2xvciA9IFwiI0RERERERFwiO1xuICAgICAgICAgICAgcmV0dXJuIGNvbG9yO1xuICAgICAgICB9LFxuICAgICAgICBzZXRDb2xvcjpmdW5jdGlvbiAoY29sb3IpIHtcbiAgICAgICAgICAgIHZhciBleGFtcGxlID0gJEcoXCJKX2V4YW1wbGVcIiksXG4gICAgICAgICAgICAgICAgYXJyID0gZG9tVXRpbHMuZ2V0RWxlbWVudHNCeVRhZ05hbWUoZXhhbXBsZSwgXCJ0ZFwiKS5jb25jYXQoXG4gICAgICAgICAgICAgICAgICAgIGRvbVV0aWxzLmdldEVsZW1lbnRzQnlUYWdOYW1lKGV4YW1wbGUsIFwidGhcIiksXG4gICAgICAgICAgICAgICAgICAgIGRvbVV0aWxzLmdldEVsZW1lbnRzQnlUYWdOYW1lKGV4YW1wbGUsIFwiY2FwdGlvblwiKVxuICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHRvbmUudmFsdWUgPSBjb2xvcjtcbiAgICAgICAgICAgIHV0aWxzLmVhY2goYXJyLCBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgICAgIG5vZGUuc3R5bGUuYm9yZGVyQ29sb3IgPSBjb2xvcjtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH0sXG4gICAgICAgIHNldEF1dG9TaXplOmZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgICAgICAgICBhdXRvU2l6ZVBhZ2UuY2hlY2tlZCA9IHRydWU7XG4gICAgICAgICAgICBtZS5hdXRvU2l6ZVBhZ2VIYW5sZXIoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBuZXcgZWRpdFRhYmxlO1xuXG4gICAgZGlhbG9nLm9ub2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGVkaXRvci5fX2hhc0VudGVyRXhlY0NvbW1hbmQgPSB0cnVlO1xuXG4gICAgICAgIHZhciBjaGVja3MgPSB7XG4gICAgICAgICAgICB0aXRsZTpcImluc2VydHRpdGxlIGRlbGV0ZXRpdGxlXCIsXG4gICAgICAgICAgICB0aXRsZUNvbDpcImluc2VydHRpdGxlY29sIGRlbGV0ZXRpdGxlY29sXCIsXG4gICAgICAgICAgICBjYXB0aW9uOlwiaW5zZXJ0Y2FwdGlvbiBkZWxldGVjYXB0aW9uXCIsXG4gICAgICAgICAgICBzb3J0dGFibGU6XCJlbmFibGVzb3J0IGRpc2FibGVzb3J0XCJcbiAgICAgICAgfTtcbiAgICAgICAgZWRpdG9yLmZpcmVFdmVudCgnc2F2ZVNjZW5lJyk7XG4gICAgICAgIGZvcih2YXIgaSBpbiBjaGVja3Mpe1xuICAgICAgICAgICAgdmFyIGNtZHMgPSBjaGVja3NbaV0uc3BsaXQoXCIgXCIpLFxuICAgICAgICAgICAgICAgIGlucHV0ID0gJEcoXCJKX1wiICsgaSk7XG4gICAgICAgICAgICBpZihpbnB1dFtcImNoZWNrZWRcIl0pe1xuICAgICAgICAgICAgICAgIGVkaXRvci5xdWVyeUNvbW1hbmRTdGF0ZShjbWRzWzBdKSE9LTEgJiZlZGl0b3IuZXhlY0NvbW1hbmQoY21kc1swXSk7XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICBlZGl0b3IucXVlcnlDb21tYW5kU3RhdGUoY21kc1sxXSkhPS0xICYmZWRpdG9yLmV4ZWNDb21tYW5kKGNtZHNbMV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZWRpdG9yLmV4ZWNDb21tYW5kKFwiZWRpdHRhYmxlXCIsIHRvbmUudmFsdWUpO1xuICAgICAgICBhdXRvU2l6ZUNvbnRlbnQuY2hlY2tlZCA/ZWRpdG9yLmV4ZWNDb21tYW5kKCdhZGFwdGJ5dGV4dCcpIDogXCJcIjtcbiAgICAgICAgYXV0b1NpemVQYWdlLmNoZWNrZWQgPyBlZGl0b3IuZXhlY0NvbW1hbmQoXCJhZGFwdGJ5d2luZG93XCIpIDogXCJcIjtcbiAgICAgICAgZWRpdG9yLmZpcmVFdmVudCgnc2F2ZVNjZW5lJyk7XG5cbiAgICAgICAgZWRpdG9yLl9faGFzRW50ZXJFeGVjQ29tbWFuZCA9IGZhbHNlO1xuICAgIH07XG59KSgpOyJdLCJmaWxlIjoicGx1Z2lucy91ZWRpdG9yL2RpYWxvZ3MvdGFibGUvZWRpdHRhYmxlLmpzIn0=
