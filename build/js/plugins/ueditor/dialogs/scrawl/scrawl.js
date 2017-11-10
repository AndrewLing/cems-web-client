/**
 * Created with JetBrains PhpStorm.
 * User: xuheng
 * Date: 12-5-22
 * Time: 上午11:38
 * To change this template use File | Settings | File Templates.
 */
var scrawl = function (options) {
    options && this.initOptions(options);
};
(function () {
    var canvas = $G("J_brushBoard"),
        context = canvas.getContext('2d'),
        drawStep = [], //undo redo存储
        drawStepIndex = 0; //undo redo指针

    scrawl.prototype = {
        isScrawl:false, //是否涂鸦
        brushWidth:-1, //画笔粗细
        brushColor:"", //画笔颜色

        initOptions:function (options) {
            var me = this;
            me.originalState(options);//初始页面状态
            me._buildToolbarColor(options.colorList);//动态生成颜色选择集合

            me._addBoardListener(options.saveNum);//添加画板处理
            me._addOPerateListener(options.saveNum);//添加undo redo clearBoard处理
            me._addColorBarListener();//添加颜色选择处理
            me._addBrushBarListener();//添加画笔大小处理
            me._addEraserBarListener();//添加橡皮大小处理
            me._addAddImgListener();//添加增添背景图片处理
            me._addRemoveImgListenter();//删除背景图片处理
            me._addScalePicListenter();//添加缩放处理
            me._addClearSelectionListenter();//添加清楚选中状态处理

            me._originalColorSelect(options.drawBrushColor);//初始化颜色选中
            me._originalBrushSelect(options.drawBrushSize);//初始化画笔选中
            me._clearSelection();//清楚选中状态
        },

        originalState:function (options) {
            var me = this;

            me.brushWidth = options.drawBrushSize;//同步画笔粗细
            me.brushColor = options.drawBrushColor;//同步画笔颜色

            context.lineWidth = me.brushWidth;//初始画笔大小
            context.strokeStyle = me.brushColor;//初始画笔颜色
            context.fillStyle = "transparent";//初始画布背景颜色
            context.lineCap = "round";//去除锯齿
            context.fill();
        },
        _buildToolbarColor:function (colorList) {
            var tmp = null, arr = [];
            arr.push("<table id='J_colorList'>");
            for (var i = 0, color; color = colorList[i++];) {
                if ((i - 1) % 5 == 0) {
                    if (i != 1) {
                        arr.push("</tr>");
                    }
                    arr.push("<tr>");
                }
                tmp = '#' + color;
                arr.push("<td><a title='" + tmp + "' href='javascript:void(0)' style='background-color:" + tmp + "'></a></td>");
            }
            arr.push("</tr></table>");
            $G("J_colorBar").innerHTML = arr.join("");
        },

        _addBoardListener:function (saveNum) {
            var me = this,
                margin = 0,
                startX = -1,
                startY = -1,
                isMouseDown = false,
                isMouseMove = false,
                isMouseUp = false,
                buttonPress = 0, button, flag = '';

            margin = parseInt(domUtils.getComputedStyle($G("J_wrap"), "margin-left"));
            drawStep.push(context.getImageData(0, 0, context.canvas.width, context.canvas.height));
            drawStepIndex += 1;

            domUtils.on(canvas, ["mousedown", "mousemove", "mouseup", "mouseout"], function (e) {
                button = browser.webkit ? e.which : buttonPress;
                switch (e.type) {
                    case 'mousedown':
                        buttonPress = 1;
                        flag = 1;
                        isMouseDown = true;
                        isMouseUp = false;
                        isMouseMove = false;
                        me.isScrawl = true;
                        startX = e.clientX - margin;//10为外边距总和
                        startY = e.clientY - margin;
                        context.beginPath();
                        break;
                    case 'mousemove' :
                        if (!flag && button == 0) {
                            return;
                        }
                        if (!flag && button) {
                            startX = e.clientX - margin;//10为外边距总和
                            startY = e.clientY - margin;
                            context.beginPath();
                            flag = 1;
                        }
                        if (isMouseUp || !isMouseDown) {
                            return;
                        }
                        var endX = e.clientX - margin,
                            endY = e.clientY - margin;

                        context.moveTo(startX, startY);
                        context.lineTo(endX, endY);
                        context.stroke();
                        startX = endX;
                        startY = endY;
                        isMouseMove = true;
                        break;
                    case 'mouseup':
                        buttonPress = 0;
                        if (!isMouseDown)return;
                        if (!isMouseMove) {
                            context.arc(startX, startY, context.lineWidth, 0, Math.PI * 2, false);
                            context.fillStyle = context.strokeStyle;
                            context.fill();
                        }
                        context.closePath();
                        me._saveOPerate(saveNum);
                        isMouseDown = false;
                        isMouseMove = false;
                        isMouseUp = true;
                        startX = -1;
                        startY = -1;
                        break;
                    case 'mouseout':
                        flag = '';
                        buttonPress = 0;
                        if (button == 1) return;
                        context.closePath();
                        break;
                }
            });
        },
        _addOPerateListener:function (saveNum) {
            var me = this;
            domUtils.on($G("J_previousStep"), "click", function () {
                if (drawStepIndex > 1) {
                    drawStepIndex -= 1;
                    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
                    context.putImageData(drawStep[drawStepIndex - 1], 0, 0);
                    me.btn2Highlight("J_nextStep");
                    drawStepIndex == 1 && me.btn2disable("J_previousStep");
                }
            });
            domUtils.on($G("J_nextStep"), "click", function () {
                if (drawStepIndex > 0 && drawStepIndex < drawStep.length) {
                    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
                    context.putImageData(drawStep[drawStepIndex], 0, 0);
                    drawStepIndex += 1;
                    me.btn2Highlight("J_previousStep");
                    drawStepIndex == drawStep.length && me.btn2disable("J_nextStep");
                }
            });
            domUtils.on($G("J_clearBoard"), "click", function () {
                context.clearRect(0, 0, context.canvas.width, context.canvas.height);
                drawStep = [];
                me._saveOPerate(saveNum);
                drawStepIndex = 1;
                me.isScrawl = false;
                me.btn2disable("J_previousStep");
                me.btn2disable("J_nextStep");
                me.btn2disable("J_clearBoard");
            });
        },
        _addColorBarListener:function () {
            var me = this;
            domUtils.on($G("J_colorBar"), "click", function (e) {
                var target = me.getTarget(e),
                    color = target.title;
                if (!!color) {
                    me._addColorSelect(target);

                    me.brushColor = color;
                    context.globalCompositeOperation = "source-over";
                    context.lineWidth = me.brushWidth;
                    context.strokeStyle = color;
                }
            });
        },
        _addBrushBarListener:function () {
            var me = this;
            domUtils.on($G("J_brushBar"), "click", function (e) {
                var target = me.getTarget(e),
                    size = browser.ie ? target.innerText : target.text;
                if (!!size) {
                    me._addBESelect(target);

                    context.globalCompositeOperation = "source-over";
                    context.lineWidth = parseInt(size);
                    context.strokeStyle = me.brushColor;
                    me.brushWidth = context.lineWidth;
                }
            });
        },
        _addEraserBarListener:function () {
            var me = this;
            domUtils.on($G("J_eraserBar"), "click", function (e) {
                var target = me.getTarget(e),
                    size = browser.ie ? target.innerText : target.text;
                if (!!size) {
                    me._addBESelect(target);

                    context.lineWidth = parseInt(size);
                    context.globalCompositeOperation = "destination-out";
                    context.strokeStyle = "#FFF";
                }
            });
        },
        _addAddImgListener:function () {
            var file = $G("J_imgTxt");
            if (!window.FileReader) {
                $G("J_addImg").style.display = 'none';
                $G("J_removeImg").style.display = 'none';
                $G("J_sacleBoard").style.display = 'none';
            }
            domUtils.on(file, "change", function (e) {
                var frm = file.parentNode;
                addMaskLayer(lang.backgroundUploading);

                var target = e.target || e.srcElement,
                    reader = new FileReader();
                reader.onload = function(evt){
                    var target = evt.target || evt.srcElement;
                    ue_callback(target.result, 'SUCCESS');
                };
                reader.readAsDataURL(target.files[0]);
                frm.reset();
            });
        },
        _addRemoveImgListenter:function () {
            var me = this;
            domUtils.on($G("J_removeImg"), "click", function () {
                $G("J_picBoard").innerHTML = "";
                me.btn2disable("J_removeImg");
                me.btn2disable("J_sacleBoard");
            });
        },
        _addScalePicListenter:function () {
            domUtils.on($G("J_sacleBoard"), "click", function () {
                var picBoard = $G("J_picBoard"),
                    scaleCon = $G("J_scaleCon"),
                    img = picBoard.children[0];

                if (img) {
                    if (!scaleCon) {
                        picBoard.style.cssText = "position:relative;z-index:999;"+picBoard.style.cssText;
                        img.style.cssText = "position: absolute;top:" + (canvas.height - img.height) / 2 + "px;left:" + (canvas.width - img.width) / 2 + "px;";
                        var scale = new ScaleBoy();
                        picBoard.appendChild(scale.init());
                        scale.startScale(img);
                    } else {
                        if (scaleCon.style.visibility == "visible") {
                            scaleCon.style.visibility = "hidden";
                            picBoard.style.position = "";
                            picBoard.style.zIndex = "";
                        } else {
                            scaleCon.style.visibility = "visible";
                            picBoard.style.cssText += "position:relative;z-index:999";
                        }
                    }
                }
            });
        },
        _addClearSelectionListenter:function () {
            var doc = document;
            domUtils.on(doc, 'mousemove', function (e) {
                if (browser.ie && browser.version < 11)
                    doc.selection.clear();
                else
                    window.getSelection().removeAllRanges();
            });
        },
        _clearSelection:function () {
            var list = ["J_operateBar", "J_colorBar", "J_brushBar", "J_eraserBar", "J_picBoard"];
            for (var i = 0, group; group = list[i++];) {
                domUtils.unSelectable($G(group));
            }
        },

        _saveOPerate:function (saveNum) {
            var me = this;
            if (drawStep.length <= saveNum) {
                if(drawStepIndex<drawStep.length){
                    me.btn2disable("J_nextStep");
                    drawStep.splice(drawStepIndex);
                }
                drawStep.push(context.getImageData(0, 0, context.canvas.width, context.canvas.height));
                drawStepIndex = drawStep.length;
            } else {
                drawStep.shift();
                drawStep.push(context.getImageData(0, 0, context.canvas.width, context.canvas.height));
                drawStepIndex = drawStep.length;
            }
            me.btn2Highlight("J_previousStep");
            me.btn2Highlight("J_clearBoard");
        },

        _originalColorSelect:function (title) {
            var colorList = $G("J_colorList").getElementsByTagName("td");
            for (var j = 0, cell; cell = colorList[j++];) {
                if (cell.children[0].title.toLowerCase() == title) {
                    cell.children[0].style.opacity = 1;
                }
            }
        },
        _originalBrushSelect:function (text) {
            var brushList = $G("J_brushBar").children;
            for (var i = 0, ele; ele = brushList[i++];) {
                if (ele.tagName.toLowerCase() == "a") {
                    var size = browser.ie ? ele.innerText : ele.text;
                    if (size.toLowerCase() == text) {
                        ele.style.opacity = 1;
                    }
                }
            }
        },
        _addColorSelect:function (target) {
            var me = this,
                colorList = $G("J_colorList").getElementsByTagName("td"),
                eraserList = $G("J_eraserBar").children,
                brushList = $G("J_brushBar").children;

            for (var i = 0, cell; cell = colorList[i++];) {
                cell.children[0].style.opacity = 0.3;
            }
            for (var k = 0, ele; ele = brushList[k++];) {
                if (ele.tagName.toLowerCase() == "a") {
                    ele.style.opacity = 0.3;
                    var size = browser.ie ? ele.innerText : ele.text;
                    if (size.toLowerCase() == this.brushWidth) {
                        ele.style.opacity = 1;
                    }
                }
            }
            for (var j = 0, node; node = eraserList[j++];) {
                if (node.tagName.toLowerCase() == "a") {
                    node.style.opacity = 0.3;
                }
            }

            target.style.opacity = 1;
            target.blur();
        },
        _addBESelect:function (target) {
            var brushList = $G("J_brushBar").children;
            var eraserList = $G("J_eraserBar").children;

            for (var i = 0, ele; ele = brushList[i++];) {
                if (ele.tagName.toLowerCase() == "a") {
                    ele.style.opacity = 0.3;
                }
            }
            for (var j = 0, node; node = eraserList[j++];) {
                if (node.tagName.toLowerCase() == "a") {
                    node.style.opacity = 0.3;
                }
            }

            target.style.opacity = 1;
            target.blur();
        },
        getCanvasData:function () {
            var picContainer = $G("J_picBoard"),
                img = picContainer.children[0];
            if (img) {
                var x, y;
                if (img.style.position == "absolute") {
                    x = parseInt(img.style.left);
                    y = parseInt(img.style.top);
                } else {
                    x = (picContainer.offsetWidth - img.width) / 2;
                    y = (picContainer.offsetHeight - img.height) / 2;
                }
                context.globalCompositeOperation = "destination-over";
                context.drawImage(img, x, y, img.width, img.height);
            } else {
                context.globalCompositeOperation = "destination-atop";
                context.fillStyle = "#fff";//重置画布背景白色
                context.fillRect(0, 0, canvas.width, canvas.height);
            }
            try {
                return canvas.toDataURL("image/png").substring(22);
            } catch (e) {
                return "";
            }
        },
        btn2Highlight:function (id) {
            var cur = $G(id);
            cur.className.indexOf("H") == -1 && (cur.className += "H");
        },
        btn2disable:function (id) {
            var cur = $G(id);
            cur.className.indexOf("H") != -1 && (cur.className = cur.className.replace("H", ""));
        },
        getTarget:function (evt) {
            return evt.target || evt.srcElement;
        }
    };
})();

var ScaleBoy = function () {
    this.dom = null;
    this.scalingElement = null;
};
(function () {
    function _appendStyle() {
        var doc = document,
            head = doc.getElementsByTagName('head')[0],
            style = doc.createElement('style'),
            cssText = '.scale{visibility:hidden;cursor:move;position:absolute;left:0;top:0;width:100px;height:50px;background-color:#fff;font-size:0;line-height:0;opacity:.4;filter:Alpha(opacity=40);}'
                + '.scale span{position:absolute;left:0;top:0;width:6px;height:6px;background-color:#006DAE;}'
                + '.scale .hand0, .scale .hand7{cursor:nw-resize;}'
                + '.scale .hand1, .scale .hand6{left:50%;margin-left:-3px;cursor:n-resize;}'
                + '.scale .hand2, .scale .hand4, .scale .hand7{left:100%;margin-left:-6px;}'
                + '.scale .hand3, .scale .hand4{top:50%;margin-top:-3px;cursor:w-resize;}'
                + '.scale .hand5, .scale .hand6, .scale .hand7{margin-top:-6px;top:100%;}'
                + '.scale .hand2, .scale .hand5{cursor:ne-resize;}';
        style.type = 'text/css';

        try {
            style.appendChild(doc.createTextNode(cssText));
        } catch (e) {
            style.styleSheet.cssText = cssText;
        }
        head.appendChild(style);
    }

    function _getDom() {
        var doc = document,
            hand,
            arr = [],
            scale = doc.createElement('div');

        scale.id = 'J_scaleCon';
        scale.className = 'scale';
        for (var i = 0; i < 8; i++) {
            arr.push("<span class='hand" + i + "'></span>");
        }
        scale.innerHTML = arr.join("");
        return scale;
    }

    var rect = [
        //[left, top, width, height]
        [1, 1, -1, -1],
        [0, 1, 0, -1],
        [0, 1, 1, -1],
        [1, 0, -1, 0],
        [0, 0, 1, 0],
        [1, 0, -1, 1],
        [0, 0, 0, 1],
        [0, 0, 1, 1]
    ];
    ScaleBoy.prototype = {
        init:function () {
            _appendStyle();
            var me = this,
                scale = me.dom = _getDom();

            me.scaleMousemove.fp = me;
            domUtils.on(scale, 'mousedown', function (e) {
                var target = e.target || e.srcElement;
                me.start = {x:e.clientX, y:e.clientY};
                if (target.className.indexOf('hand') != -1) {
                    me.dir = target.className.replace('hand', '');
                }
                domUtils.on(document.body, 'mousemove', me.scaleMousemove);
                e.stopPropagation ? e.stopPropagation() : e.cancelBubble = true;
            });
            domUtils.on(document.body, 'mouseup', function (e) {
                if (me.start) {
                    domUtils.un(document.body, 'mousemove', me.scaleMousemove);
                    if (me.moved) {
                        me.updateScaledElement({position:{x:scale.style.left, y:scale.style.top}, size:{w:scale.style.width, h:scale.style.height}});
                    }
                    delete me.start;
                    delete me.moved;
                    delete me.dir;
                }
            });
            return scale;
        },
        startScale:function (objElement) {
            var me = this, Idom = me.dom;

            Idom.style.cssText = 'visibility:visible;top:' + objElement.style.top + ';left:' + objElement.style.left + ';width:' + objElement.offsetWidth + 'px;height:' + objElement.offsetHeight + 'px;';
            me.scalingElement = objElement;
        },
        updateScaledElement:function (objStyle) {
            var cur = this.scalingElement,
                pos = objStyle.position,
                size = objStyle.size;
            if (pos) {
                typeof pos.x != 'undefined' && (cur.style.left = pos.x);
                typeof pos.y != 'undefined' && (cur.style.top = pos.y);
            }
            if (size) {
                size.w && (cur.style.width = size.w);
                size.h && (cur.style.height = size.h);
            }
        },
        updateStyleByDir:function (dir, offset) {
            var me = this,
                dom = me.dom, tmp;

            rect['def'] = [1, 1, 0, 0];
            if (rect[dir][0] != 0) {
                tmp = parseInt(dom.style.left) + offset.x;
                dom.style.left = me._validScaledProp('left', tmp) + 'px';
            }
            if (rect[dir][1] != 0) {
                tmp = parseInt(dom.style.top) + offset.y;
                dom.style.top = me._validScaledProp('top', tmp) + 'px';
            }
            if (rect[dir][2] != 0) {
                tmp = dom.clientWidth + rect[dir][2] * offset.x;
                dom.style.width = me._validScaledProp('width', tmp) + 'px';
            }
            if (rect[dir][3] != 0) {
                tmp = dom.clientHeight + rect[dir][3] * offset.y;
                dom.style.height = me._validScaledProp('height', tmp) + 'px';
            }
            if (dir === 'def') {
                me.updateScaledElement({position:{x:dom.style.left, y:dom.style.top}});
            }
        },
        scaleMousemove:function (e) {
            var me = arguments.callee.fp,
                start = me.start,
                dir = me.dir || 'def',
                offset = {x:e.clientX - start.x, y:e.clientY - start.y};

            me.updateStyleByDir(dir, offset);
            arguments.callee.fp.start = {x:e.clientX, y:e.clientY};
            arguments.callee.fp.moved = 1;
        },
        _validScaledProp:function (prop, value) {
            var ele = this.dom,
                wrap = $G("J_picBoard");

            value = isNaN(value) ? 0 : value;
            switch (prop) {
                case 'left':
                    return value < 0 ? 0 : (value + ele.clientWidth) > wrap.clientWidth ? wrap.clientWidth - ele.clientWidth : value;
                case 'top':
                    return value < 0 ? 0 : (value + ele.clientHeight) > wrap.clientHeight ? wrap.clientHeight - ele.clientHeight : value;
                case 'width':
                    return value <= 0 ? 1 : (value + ele.offsetLeft) > wrap.clientWidth ? wrap.clientWidth - ele.offsetLeft : value;
                case 'height':
                    return value <= 0 ? 1 : (value + ele.offsetTop) > wrap.clientHeight ? wrap.clientHeight - ele.offsetTop : value;
            }
        }
    };
})();

//后台回调
function ue_callback(url, state) {
    var doc = document,
        picBorard = $G("J_picBoard"),
        img = doc.createElement("img");

    //图片缩放
    function scale(img, max, oWidth, oHeight) {
        var width = 0, height = 0, percent, ow = img.width || oWidth, oh = img.height || oHeight;
        if (ow > max || oh > max) {
            if (ow >= oh) {
                if (width = ow - max) {
                    percent = (width / ow).toFixed(2);
                    img.height = oh - oh * percent;
                    img.width = max;
                }
            } else {
                if (height = oh - max) {
                    percent = (height / oh).toFixed(2);
                    img.width = ow - ow * percent;
                    img.height = max;
                }
            }
        }
    }

    //移除遮罩层
    removeMaskLayer();
    //状态响应
    if (state == "SUCCESS") {
        picBorard.innerHTML = "";
        img.onload = function () {
            scale(this, 300);
            picBorard.appendChild(img);

            var obj = new scrawl();
            obj.btn2Highlight("J_removeImg");
            //trace 2457
            obj.btn2Highlight("J_sacleBoard");
        };
        img.src = url;
    } else {
        alert(state);
    }
}
//去掉遮罩层
function removeMaskLayer() {
    var maskLayer = $G("J_maskLayer");
    maskLayer.className = "maskLayerNull";
    maskLayer.innerHTML = "";
    dialog.buttons[0].setDisabled(false);
}
//添加遮罩层
function addMaskLayer(html) {
    var maskLayer = $G("J_maskLayer");
    dialog.buttons[0].setDisabled(true);
    maskLayer.className = "maskLayer";
    maskLayer.innerHTML = html;
}
//执行确认按钮方法
function exec(scrawlObj) {
    if (scrawlObj.isScrawl) {
        addMaskLayer(lang.scrawlUpLoading);
        var base64 = scrawlObj.getCanvasData();
        if (!!base64) {
            var options = {
                timeout:100000,
                onsuccess:function (xhr) {
                    if (!scrawlObj.isCancelScrawl) {
                        var responseObj;
                        responseObj = eval("(" + xhr.responseText + ")");
                        if (responseObj.state == "SUCCESS") {
                            var imgObj = {},
                                url = editor.options.scrawlUrlPrefix + responseObj.url;
                            imgObj.src = url;
                            imgObj._src = url;
                            imgObj.alt = responseObj.original || '';
                            imgObj.title = responseObj.title || '';
                            editor.execCommand("insertImage", imgObj);
                            dialog.close();
                        } else {
                            alert(responseObj.state);
                        }

                    }
                },
                onerror:function () {
                    alert(lang.imageError);
                    dialog.close();
                }
            };
            options[editor.getOpt('scrawlFieldName')] = base64;

            var actionUrl = editor.getActionUrl(editor.getOpt('scrawlActionName')),
                params = utils.serializeParam(editor.queryCommandValue('serverparam')) || '',
                url = utils.formatUrl(actionUrl + (actionUrl.indexOf('?') == -1 ? '?':'&') + params);
            ajax.request(url, options);
        }
    } else {
        addMaskLayer(lang.noScarwl + "&nbsp;&nbsp;&nbsp;<input type='button' value='" + lang.continueBtn + "'  onclick='removeMaskLayer()'/>");
    }
}


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvZGlhbG9ncy9zY3Jhd2wvc2NyYXdsLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBDcmVhdGVkIHdpdGggSmV0QnJhaW5zIFBocFN0b3JtLlxyXG4gKiBVc2VyOiB4dWhlbmdcclxuICogRGF0ZTogMTItNS0yMlxyXG4gKiBUaW1lOiDkuIrljYgxMTozOFxyXG4gKiBUbyBjaGFuZ2UgdGhpcyB0ZW1wbGF0ZSB1c2UgRmlsZSB8IFNldHRpbmdzIHwgRmlsZSBUZW1wbGF0ZXMuXHJcbiAqL1xyXG52YXIgc2NyYXdsID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuICAgIG9wdGlvbnMgJiYgdGhpcy5pbml0T3B0aW9ucyhvcHRpb25zKTtcclxufTtcclxuKGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBjYW52YXMgPSAkRyhcIkpfYnJ1c2hCb2FyZFwiKSxcclxuICAgICAgICBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyksXHJcbiAgICAgICAgZHJhd1N0ZXAgPSBbXSwgLy91bmRvIHJlZG/lrZjlgqhcclxuICAgICAgICBkcmF3U3RlcEluZGV4ID0gMDsgLy91bmRvIHJlZG/mjIfpkohcclxuXHJcbiAgICBzY3Jhd2wucHJvdG90eXBlID0ge1xyXG4gICAgICAgIGlzU2NyYXdsOmZhbHNlLCAvL+aYr+WQpua2gum4plxyXG4gICAgICAgIGJydXNoV2lkdGg6LTEsIC8v55S756yU57KX57uGXHJcbiAgICAgICAgYnJ1c2hDb2xvcjpcIlwiLCAvL+eUu+eslOminOiJslxyXG5cclxuICAgICAgICBpbml0T3B0aW9uczpmdW5jdGlvbiAob3B0aW9ucykge1xyXG4gICAgICAgICAgICB2YXIgbWUgPSB0aGlzO1xyXG4gICAgICAgICAgICBtZS5vcmlnaW5hbFN0YXRlKG9wdGlvbnMpOy8v5Yid5aeL6aG16Z2i54q25oCBXHJcbiAgICAgICAgICAgIG1lLl9idWlsZFRvb2xiYXJDb2xvcihvcHRpb25zLmNvbG9yTGlzdCk7Ly/liqjmgIHnlJ/miJDpopzoibLpgInmi6npm4blkIhcclxuXHJcbiAgICAgICAgICAgIG1lLl9hZGRCb2FyZExpc3RlbmVyKG9wdGlvbnMuc2F2ZU51bSk7Ly/mt7vliqDnlLvmnb/lpITnkIZcclxuICAgICAgICAgICAgbWUuX2FkZE9QZXJhdGVMaXN0ZW5lcihvcHRpb25zLnNhdmVOdW0pOy8v5re75YqgdW5kbyByZWRvIGNsZWFyQm9hcmTlpITnkIZcclxuICAgICAgICAgICAgbWUuX2FkZENvbG9yQmFyTGlzdGVuZXIoKTsvL+a3u+WKoOminOiJsumAieaLqeWkhOeQhlxyXG4gICAgICAgICAgICBtZS5fYWRkQnJ1c2hCYXJMaXN0ZW5lcigpOy8v5re75Yqg55S756yU5aSn5bCP5aSE55CGXHJcbiAgICAgICAgICAgIG1lLl9hZGRFcmFzZXJCYXJMaXN0ZW5lcigpOy8v5re75Yqg5qmh55qu5aSn5bCP5aSE55CGXHJcbiAgICAgICAgICAgIG1lLl9hZGRBZGRJbWdMaXN0ZW5lcigpOy8v5re75Yqg5aKe5re76IOM5pmv5Zu+54mH5aSE55CGXHJcbiAgICAgICAgICAgIG1lLl9hZGRSZW1vdmVJbWdMaXN0ZW50ZXIoKTsvL+WIoOmZpOiDjOaZr+WbvueJh+WkhOeQhlxyXG4gICAgICAgICAgICBtZS5fYWRkU2NhbGVQaWNMaXN0ZW50ZXIoKTsvL+a3u+WKoOe8qeaUvuWkhOeQhlxyXG4gICAgICAgICAgICBtZS5fYWRkQ2xlYXJTZWxlY3Rpb25MaXN0ZW50ZXIoKTsvL+a3u+WKoOa4healmumAieS4reeKtuaAgeWkhOeQhlxyXG5cclxuICAgICAgICAgICAgbWUuX29yaWdpbmFsQ29sb3JTZWxlY3Qob3B0aW9ucy5kcmF3QnJ1c2hDb2xvcik7Ly/liJ3lp4vljJbpopzoibLpgInkuK1cclxuICAgICAgICAgICAgbWUuX29yaWdpbmFsQnJ1c2hTZWxlY3Qob3B0aW9ucy5kcmF3QnJ1c2hTaXplKTsvL+WIneWni+WMlueUu+eslOmAieS4rVxyXG4gICAgICAgICAgICBtZS5fY2xlYXJTZWxlY3Rpb24oKTsvL+a4healmumAieS4reeKtuaAgVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIG9yaWdpbmFsU3RhdGU6ZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgdmFyIG1lID0gdGhpcztcclxuXHJcbiAgICAgICAgICAgIG1lLmJydXNoV2lkdGggPSBvcHRpb25zLmRyYXdCcnVzaFNpemU7Ly/lkIzmraXnlLvnrJTnspfnu4ZcclxuICAgICAgICAgICAgbWUuYnJ1c2hDb2xvciA9IG9wdGlvbnMuZHJhd0JydXNoQ29sb3I7Ly/lkIzmraXnlLvnrJTpopzoibJcclxuXHJcbiAgICAgICAgICAgIGNvbnRleHQubGluZVdpZHRoID0gbWUuYnJ1c2hXaWR0aDsvL+WIneWni+eUu+eslOWkp+Wwj1xyXG4gICAgICAgICAgICBjb250ZXh0LnN0cm9rZVN0eWxlID0gbWUuYnJ1c2hDb2xvcjsvL+WIneWni+eUu+eslOminOiJslxyXG4gICAgICAgICAgICBjb250ZXh0LmZpbGxTdHlsZSA9IFwidHJhbnNwYXJlbnRcIjsvL+WIneWni+eUu+W4g+iDjOaZr+minOiJslxyXG4gICAgICAgICAgICBjb250ZXh0LmxpbmVDYXAgPSBcInJvdW5kXCI7Ly/ljrvpmaTplK/pvb9cclxuICAgICAgICAgICAgY29udGV4dC5maWxsKCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBfYnVpbGRUb29sYmFyQ29sb3I6ZnVuY3Rpb24gKGNvbG9yTGlzdCkge1xyXG4gICAgICAgICAgICB2YXIgdG1wID0gbnVsbCwgYXJyID0gW107XHJcbiAgICAgICAgICAgIGFyci5wdXNoKFwiPHRhYmxlIGlkPSdKX2NvbG9yTGlzdCc+XCIpO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgY29sb3I7IGNvbG9yID0gY29sb3JMaXN0W2krK107KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoKGkgLSAxKSAlIDUgPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpICE9IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXJyLnB1c2goXCI8L3RyPlwiKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYXJyLnB1c2goXCI8dHI+XCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdG1wID0gJyMnICsgY29sb3I7XHJcbiAgICAgICAgICAgICAgICBhcnIucHVzaChcIjx0ZD48YSB0aXRsZT0nXCIgKyB0bXAgKyBcIicgaHJlZj0namF2YXNjcmlwdDp2b2lkKDApJyBzdHlsZT0nYmFja2dyb3VuZC1jb2xvcjpcIiArIHRtcCArIFwiJz48L2E+PC90ZD5cIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYXJyLnB1c2goXCI8L3RyPjwvdGFibGU+XCIpO1xyXG4gICAgICAgICAgICAkRyhcIkpfY29sb3JCYXJcIikuaW5uZXJIVE1MID0gYXJyLmpvaW4oXCJcIik7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgX2FkZEJvYXJkTGlzdGVuZXI6ZnVuY3Rpb24gKHNhdmVOdW0pIHtcclxuICAgICAgICAgICAgdmFyIG1lID0gdGhpcyxcclxuICAgICAgICAgICAgICAgIG1hcmdpbiA9IDAsXHJcbiAgICAgICAgICAgICAgICBzdGFydFggPSAtMSxcclxuICAgICAgICAgICAgICAgIHN0YXJ0WSA9IC0xLFxyXG4gICAgICAgICAgICAgICAgaXNNb3VzZURvd24gPSBmYWxzZSxcclxuICAgICAgICAgICAgICAgIGlzTW91c2VNb3ZlID0gZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBpc01vdXNlVXAgPSBmYWxzZSxcclxuICAgICAgICAgICAgICAgIGJ1dHRvblByZXNzID0gMCwgYnV0dG9uLCBmbGFnID0gJyc7XHJcblxyXG4gICAgICAgICAgICBtYXJnaW4gPSBwYXJzZUludChkb21VdGlscy5nZXRDb21wdXRlZFN0eWxlKCRHKFwiSl93cmFwXCIpLCBcIm1hcmdpbi1sZWZ0XCIpKTtcclxuICAgICAgICAgICAgZHJhd1N0ZXAucHVzaChjb250ZXh0LmdldEltYWdlRGF0YSgwLCAwLCBjb250ZXh0LmNhbnZhcy53aWR0aCwgY29udGV4dC5jYW52YXMuaGVpZ2h0KSk7XHJcbiAgICAgICAgICAgIGRyYXdTdGVwSW5kZXggKz0gMTtcclxuXHJcbiAgICAgICAgICAgIGRvbVV0aWxzLm9uKGNhbnZhcywgW1wibW91c2Vkb3duXCIsIFwibW91c2Vtb3ZlXCIsIFwibW91c2V1cFwiLCBcIm1vdXNlb3V0XCJdLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICAgICAgYnV0dG9uID0gYnJvd3Nlci53ZWJraXQgPyBlLndoaWNoIDogYnV0dG9uUHJlc3M7XHJcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGUudHlwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ21vdXNlZG93bic6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1dHRvblByZXNzID0gMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmxhZyA9IDE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzTW91c2VEb3duID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXNNb3VzZVVwID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzTW91c2VNb3ZlID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lLmlzU2NyYXdsID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRYID0gZS5jbGllbnRYIC0gbWFyZ2luOy8vMTDkuLrlpJbovrnot53mgLvlkoxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRZID0gZS5jbGllbnRZIC0gbWFyZ2luO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdtb3VzZW1vdmUnIDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFmbGFnICYmIGJ1dHRvbiA9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFmbGFnICYmIGJ1dHRvbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRYID0gZS5jbGllbnRYIC0gbWFyZ2luOy8vMTDkuLrlpJbovrnot53mgLvlkoxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0WSA9IGUuY2xpZW50WSAtIG1hcmdpbjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQuYmVnaW5QYXRoKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbGFnID0gMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNNb3VzZVVwIHx8ICFpc01vdXNlRG93bikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlbmRYID0gZS5jbGllbnRYIC0gbWFyZ2luLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kWSA9IGUuY2xpZW50WSAtIG1hcmdpbjtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQubW92ZVRvKHN0YXJ0WCwgc3RhcnRZKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dC5saW5lVG8oZW5kWCwgZW5kWSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQuc3Ryb2tlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0WCA9IGVuZFg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0WSA9IGVuZFk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzTW91c2VNb3ZlID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnbW91c2V1cCc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1dHRvblByZXNzID0gMDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpc01vdXNlRG93bilyZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaXNNb3VzZU1vdmUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQuYXJjKHN0YXJ0WCwgc3RhcnRZLCBjb250ZXh0LmxpbmVXaWR0aCwgMCwgTWF0aC5QSSAqIDIsIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbFN0eWxlID0gY29udGV4dC5zdHJva2VTdHlsZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQuY2xvc2VQYXRoKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lLl9zYXZlT1BlcmF0ZShzYXZlTnVtKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXNNb3VzZURvd24gPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXNNb3VzZU1vdmUgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXNNb3VzZVVwID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRYID0gLTE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0WSA9IC0xO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdtb3VzZW91dCc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZsYWcgPSAnJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnV0dG9uUHJlc3MgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYnV0dG9uID09IDEpIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dC5jbG9zZVBhdGgoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgX2FkZE9QZXJhdGVMaXN0ZW5lcjpmdW5jdGlvbiAoc2F2ZU51bSkge1xyXG4gICAgICAgICAgICB2YXIgbWUgPSB0aGlzO1xyXG4gICAgICAgICAgICBkb21VdGlscy5vbigkRyhcIkpfcHJldmlvdXNTdGVwXCIpLCBcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGlmIChkcmF3U3RlcEluZGV4ID4gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGRyYXdTdGVwSW5kZXggLT0gMTtcclxuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LmNsZWFyUmVjdCgwLCAwLCBjb250ZXh0LmNhbnZhcy53aWR0aCwgY29udGV4dC5jYW52YXMuaGVpZ2h0KTtcclxuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnB1dEltYWdlRGF0YShkcmF3U3RlcFtkcmF3U3RlcEluZGV4IC0gMV0sIDAsIDApO1xyXG4gICAgICAgICAgICAgICAgICAgIG1lLmJ0bjJIaWdobGlnaHQoXCJKX25leHRTdGVwXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGRyYXdTdGVwSW5kZXggPT0gMSAmJiBtZS5idG4yZGlzYWJsZShcIkpfcHJldmlvdXNTdGVwXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgZG9tVXRpbHMub24oJEcoXCJKX25leHRTdGVwXCIpLCBcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGlmIChkcmF3U3RlcEluZGV4ID4gMCAmJiBkcmF3U3RlcEluZGV4IDwgZHJhd1N0ZXAubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5jbGVhclJlY3QoMCwgMCwgY29udGV4dC5jYW52YXMud2lkdGgsIGNvbnRleHQuY2FudmFzLmhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5wdXRJbWFnZURhdGEoZHJhd1N0ZXBbZHJhd1N0ZXBJbmRleF0sIDAsIDApO1xyXG4gICAgICAgICAgICAgICAgICAgIGRyYXdTdGVwSW5kZXggKz0gMTtcclxuICAgICAgICAgICAgICAgICAgICBtZS5idG4ySGlnaGxpZ2h0KFwiSl9wcmV2aW91c1N0ZXBcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgZHJhd1N0ZXBJbmRleCA9PSBkcmF3U3RlcC5sZW5ndGggJiYgbWUuYnRuMmRpc2FibGUoXCJKX25leHRTdGVwXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgZG9tVXRpbHMub24oJEcoXCJKX2NsZWFyQm9hcmRcIiksIFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY29udGV4dC5jbGVhclJlY3QoMCwgMCwgY29udGV4dC5jYW52YXMud2lkdGgsIGNvbnRleHQuY2FudmFzLmhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICBkcmF3U3RlcCA9IFtdO1xyXG4gICAgICAgICAgICAgICAgbWUuX3NhdmVPUGVyYXRlKHNhdmVOdW0pO1xyXG4gICAgICAgICAgICAgICAgZHJhd1N0ZXBJbmRleCA9IDE7XHJcbiAgICAgICAgICAgICAgICBtZS5pc1NjcmF3bCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgbWUuYnRuMmRpc2FibGUoXCJKX3ByZXZpb3VzU3RlcFwiKTtcclxuICAgICAgICAgICAgICAgIG1lLmJ0bjJkaXNhYmxlKFwiSl9uZXh0U3RlcFwiKTtcclxuICAgICAgICAgICAgICAgIG1lLmJ0bjJkaXNhYmxlKFwiSl9jbGVhckJvYXJkXCIpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIF9hZGRDb2xvckJhckxpc3RlbmVyOmZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIG1lID0gdGhpcztcclxuICAgICAgICAgICAgZG9tVXRpbHMub24oJEcoXCJKX2NvbG9yQmFyXCIpLCBcImNsaWNrXCIsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0ID0gbWUuZ2V0VGFyZ2V0KGUpLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yID0gdGFyZ2V0LnRpdGxlO1xyXG4gICAgICAgICAgICAgICAgaWYgKCEhY29sb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICBtZS5fYWRkQ29sb3JTZWxlY3QodGFyZ2V0KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgbWUuYnJ1c2hDb2xvciA9IGNvbG9yO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQuZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gXCJzb3VyY2Utb3ZlclwiO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQubGluZVdpZHRoID0gbWUuYnJ1c2hXaWR0aDtcclxuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnN0cm9rZVN0eWxlID0gY29sb3I7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgX2FkZEJydXNoQmFyTGlzdGVuZXI6ZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgbWUgPSB0aGlzO1xyXG4gICAgICAgICAgICBkb21VdGlscy5vbigkRyhcIkpfYnJ1c2hCYXJcIiksIFwiY2xpY2tcIiwgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgICAgIHZhciB0YXJnZXQgPSBtZS5nZXRUYXJnZXQoZSksXHJcbiAgICAgICAgICAgICAgICAgICAgc2l6ZSA9IGJyb3dzZXIuaWUgPyB0YXJnZXQuaW5uZXJUZXh0IDogdGFyZ2V0LnRleHQ7XHJcbiAgICAgICAgICAgICAgICBpZiAoISFzaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWUuX2FkZEJFU2VsZWN0KHRhcmdldCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQuZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gXCJzb3VyY2Utb3ZlclwiO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQubGluZVdpZHRoID0gcGFyc2VJbnQoc2l6ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5zdHJva2VTdHlsZSA9IG1lLmJydXNoQ29sb3I7XHJcbiAgICAgICAgICAgICAgICAgICAgbWUuYnJ1c2hXaWR0aCA9IGNvbnRleHQubGluZVdpZHRoO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIF9hZGRFcmFzZXJCYXJMaXN0ZW5lcjpmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciBtZSA9IHRoaXM7XHJcbiAgICAgICAgICAgIGRvbVV0aWxzLm9uKCRHKFwiSl9lcmFzZXJCYXJcIiksIFwiY2xpY2tcIiwgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgICAgIHZhciB0YXJnZXQgPSBtZS5nZXRUYXJnZXQoZSksXHJcbiAgICAgICAgICAgICAgICAgICAgc2l6ZSA9IGJyb3dzZXIuaWUgPyB0YXJnZXQuaW5uZXJUZXh0IDogdGFyZ2V0LnRleHQ7XHJcbiAgICAgICAgICAgICAgICBpZiAoISFzaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWUuX2FkZEJFU2VsZWN0KHRhcmdldCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQubGluZVdpZHRoID0gcGFyc2VJbnQoc2l6ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSBcImRlc3RpbmF0aW9uLW91dFwiO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQuc3Ryb2tlU3R5bGUgPSBcIiNGRkZcIjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBfYWRkQWRkSW1nTGlzdGVuZXI6ZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgZmlsZSA9ICRHKFwiSl9pbWdUeHRcIik7XHJcbiAgICAgICAgICAgIGlmICghd2luZG93LkZpbGVSZWFkZXIpIHtcclxuICAgICAgICAgICAgICAgICRHKFwiSl9hZGRJbWdcIikuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuICAgICAgICAgICAgICAgICRHKFwiSl9yZW1vdmVJbWdcIikuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuICAgICAgICAgICAgICAgICRHKFwiSl9zYWNsZUJvYXJkXCIpLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZG9tVXRpbHMub24oZmlsZSwgXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgICAgIHZhciBmcm0gPSBmaWxlLnBhcmVudE5vZGU7XHJcbiAgICAgICAgICAgICAgICBhZGRNYXNrTGF5ZXIobGFuZy5iYWNrZ3JvdW5kVXBsb2FkaW5nKTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0ID0gZS50YXJnZXQgfHwgZS5zcmNFbGVtZW50LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XHJcbiAgICAgICAgICAgICAgICByZWFkZXIub25sb2FkID0gZnVuY3Rpb24oZXZ0KXtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0ID0gZXZ0LnRhcmdldCB8fCBldnQuc3JjRWxlbWVudDtcclxuICAgICAgICAgICAgICAgICAgICB1ZV9jYWxsYmFjayh0YXJnZXQucmVzdWx0LCAnU1VDQ0VTUycpO1xyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKHRhcmdldC5maWxlc1swXSk7XHJcbiAgICAgICAgICAgICAgICBmcm0ucmVzZXQoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBfYWRkUmVtb3ZlSW1nTGlzdGVudGVyOmZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIG1lID0gdGhpcztcclxuICAgICAgICAgICAgZG9tVXRpbHMub24oJEcoXCJKX3JlbW92ZUltZ1wiKSwgXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAkRyhcIkpfcGljQm9hcmRcIikuaW5uZXJIVE1MID0gXCJcIjtcclxuICAgICAgICAgICAgICAgIG1lLmJ0bjJkaXNhYmxlKFwiSl9yZW1vdmVJbWdcIik7XHJcbiAgICAgICAgICAgICAgICBtZS5idG4yZGlzYWJsZShcIkpfc2FjbGVCb2FyZFwiKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBfYWRkU2NhbGVQaWNMaXN0ZW50ZXI6ZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBkb21VdGlscy5vbigkRyhcIkpfc2FjbGVCb2FyZFwiKSwgXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcGljQm9hcmQgPSAkRyhcIkpfcGljQm9hcmRcIiksXHJcbiAgICAgICAgICAgICAgICAgICAgc2NhbGVDb24gPSAkRyhcIkpfc2NhbGVDb25cIiksXHJcbiAgICAgICAgICAgICAgICAgICAgaW1nID0gcGljQm9hcmQuY2hpbGRyZW5bMF07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGltZykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghc2NhbGVDb24pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGljQm9hcmQuc3R5bGUuY3NzVGV4dCA9IFwicG9zaXRpb246cmVsYXRpdmU7ei1pbmRleDo5OTk7XCIrcGljQm9hcmQuc3R5bGUuY3NzVGV4dDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW1nLnN0eWxlLmNzc1RleHQgPSBcInBvc2l0aW9uOiBhYnNvbHV0ZTt0b3A6XCIgKyAoY2FudmFzLmhlaWdodCAtIGltZy5oZWlnaHQpIC8gMiArIFwicHg7bGVmdDpcIiArIChjYW52YXMud2lkdGggLSBpbWcud2lkdGgpIC8gMiArIFwicHg7XCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzY2FsZSA9IG5ldyBTY2FsZUJveSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwaWNCb2FyZC5hcHBlbmRDaGlsZChzY2FsZS5pbml0KCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzY2FsZS5zdGFydFNjYWxlKGltZyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNjYWxlQ29uLnN0eWxlLnZpc2liaWxpdHkgPT0gXCJ2aXNpYmxlXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjYWxlQ29uLnN0eWxlLnZpc2liaWxpdHkgPSBcImhpZGRlblwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGljQm9hcmQuc3R5bGUucG9zaXRpb24gPSBcIlwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGljQm9hcmQuc3R5bGUuekluZGV4ID0gXCJcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjYWxlQ29uLnN0eWxlLnZpc2liaWxpdHkgPSBcInZpc2libGVcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBpY0JvYXJkLnN0eWxlLmNzc1RleHQgKz0gXCJwb3NpdGlvbjpyZWxhdGl2ZTt6LWluZGV4Ojk5OVwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIF9hZGRDbGVhclNlbGVjdGlvbkxpc3RlbnRlcjpmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciBkb2MgPSBkb2N1bWVudDtcclxuICAgICAgICAgICAgZG9tVXRpbHMub24oZG9jLCAnbW91c2Vtb3ZlJywgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgICAgIGlmIChicm93c2VyLmllICYmIGJyb3dzZXIudmVyc2lvbiA8IDExKVxyXG4gICAgICAgICAgICAgICAgICAgIGRvYy5zZWxlY3Rpb24uY2xlYXIoKTtcclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuZ2V0U2VsZWN0aW9uKCkucmVtb3ZlQWxsUmFuZ2VzKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgX2NsZWFyU2VsZWN0aW9uOmZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIGxpc3QgPSBbXCJKX29wZXJhdGVCYXJcIiwgXCJKX2NvbG9yQmFyXCIsIFwiSl9icnVzaEJhclwiLCBcIkpfZXJhc2VyQmFyXCIsIFwiSl9waWNCb2FyZFwiXTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGdyb3VwOyBncm91cCA9IGxpc3RbaSsrXTspIHtcclxuICAgICAgICAgICAgICAgIGRvbVV0aWxzLnVuU2VsZWN0YWJsZSgkRyhncm91cCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgX3NhdmVPUGVyYXRlOmZ1bmN0aW9uIChzYXZlTnVtKSB7XHJcbiAgICAgICAgICAgIHZhciBtZSA9IHRoaXM7XHJcbiAgICAgICAgICAgIGlmIChkcmF3U3RlcC5sZW5ndGggPD0gc2F2ZU51bSkge1xyXG4gICAgICAgICAgICAgICAgaWYoZHJhd1N0ZXBJbmRleDxkcmF3U3RlcC5sZW5ndGgpe1xyXG4gICAgICAgICAgICAgICAgICAgIG1lLmJ0bjJkaXNhYmxlKFwiSl9uZXh0U3RlcFwiKTtcclxuICAgICAgICAgICAgICAgICAgICBkcmF3U3RlcC5zcGxpY2UoZHJhd1N0ZXBJbmRleCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBkcmF3U3RlcC5wdXNoKGNvbnRleHQuZ2V0SW1hZ2VEYXRhKDAsIDAsIGNvbnRleHQuY2FudmFzLndpZHRoLCBjb250ZXh0LmNhbnZhcy5oZWlnaHQpKTtcclxuICAgICAgICAgICAgICAgIGRyYXdTdGVwSW5kZXggPSBkcmF3U3RlcC5sZW5ndGg7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBkcmF3U3RlcC5zaGlmdCgpO1xyXG4gICAgICAgICAgICAgICAgZHJhd1N0ZXAucHVzaChjb250ZXh0LmdldEltYWdlRGF0YSgwLCAwLCBjb250ZXh0LmNhbnZhcy53aWR0aCwgY29udGV4dC5jYW52YXMuaGVpZ2h0KSk7XHJcbiAgICAgICAgICAgICAgICBkcmF3U3RlcEluZGV4ID0gZHJhd1N0ZXAubGVuZ3RoO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIG1lLmJ0bjJIaWdobGlnaHQoXCJKX3ByZXZpb3VzU3RlcFwiKTtcclxuICAgICAgICAgICAgbWUuYnRuMkhpZ2hsaWdodChcIkpfY2xlYXJCb2FyZFwiKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBfb3JpZ2luYWxDb2xvclNlbGVjdDpmdW5jdGlvbiAodGl0bGUpIHtcclxuICAgICAgICAgICAgdmFyIGNvbG9yTGlzdCA9ICRHKFwiSl9jb2xvckxpc3RcIikuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJ0ZFwiKTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDAsIGNlbGw7IGNlbGwgPSBjb2xvckxpc3RbaisrXTspIHtcclxuICAgICAgICAgICAgICAgIGlmIChjZWxsLmNoaWxkcmVuWzBdLnRpdGxlLnRvTG93ZXJDYXNlKCkgPT0gdGl0bGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjZWxsLmNoaWxkcmVuWzBdLnN0eWxlLm9wYWNpdHkgPSAxO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBfb3JpZ2luYWxCcnVzaFNlbGVjdDpmdW5jdGlvbiAodGV4dCkge1xyXG4gICAgICAgICAgICB2YXIgYnJ1c2hMaXN0ID0gJEcoXCJKX2JydXNoQmFyXCIpLmNoaWxkcmVuO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgZWxlOyBlbGUgPSBicnVzaExpc3RbaSsrXTspIHtcclxuICAgICAgICAgICAgICAgIGlmIChlbGUudGFnTmFtZS50b0xvd2VyQ2FzZSgpID09IFwiYVwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNpemUgPSBicm93c2VyLmllID8gZWxlLmlubmVyVGV4dCA6IGVsZS50ZXh0O1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzaXplLnRvTG93ZXJDYXNlKCkgPT0gdGV4dCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGUuc3R5bGUub3BhY2l0eSA9IDE7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBfYWRkQ29sb3JTZWxlY3Q6ZnVuY3Rpb24gKHRhcmdldCkge1xyXG4gICAgICAgICAgICB2YXIgbWUgPSB0aGlzLFxyXG4gICAgICAgICAgICAgICAgY29sb3JMaXN0ID0gJEcoXCJKX2NvbG9yTGlzdFwiKS5nZXRFbGVtZW50c0J5VGFnTmFtZShcInRkXCIpLFxyXG4gICAgICAgICAgICAgICAgZXJhc2VyTGlzdCA9ICRHKFwiSl9lcmFzZXJCYXJcIikuY2hpbGRyZW4sXHJcbiAgICAgICAgICAgICAgICBicnVzaExpc3QgPSAkRyhcIkpfYnJ1c2hCYXJcIikuY2hpbGRyZW47XHJcblxyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgY2VsbDsgY2VsbCA9IGNvbG9yTGlzdFtpKytdOykge1xyXG4gICAgICAgICAgICAgICAgY2VsbC5jaGlsZHJlblswXS5zdHlsZS5vcGFjaXR5ID0gMC4zO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGZvciAodmFyIGsgPSAwLCBlbGU7IGVsZSA9IGJydXNoTGlzdFtrKytdOykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGVsZS50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT0gXCJhXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBlbGUuc3R5bGUub3BhY2l0eSA9IDAuMztcclxuICAgICAgICAgICAgICAgICAgICB2YXIgc2l6ZSA9IGJyb3dzZXIuaWUgPyBlbGUuaW5uZXJUZXh0IDogZWxlLnRleHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNpemUudG9Mb3dlckNhc2UoKSA9PSB0aGlzLmJydXNoV2lkdGgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlLnN0eWxlLm9wYWNpdHkgPSAxO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMCwgbm9kZTsgbm9kZSA9IGVyYXNlckxpc3RbaisrXTspIHtcclxuICAgICAgICAgICAgICAgIGlmIChub2RlLnRhZ05hbWUudG9Mb3dlckNhc2UoKSA9PSBcImFcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIG5vZGUuc3R5bGUub3BhY2l0eSA9IDAuMztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGFyZ2V0LnN0eWxlLm9wYWNpdHkgPSAxO1xyXG4gICAgICAgICAgICB0YXJnZXQuYmx1cigpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgX2FkZEJFU2VsZWN0OmZ1bmN0aW9uICh0YXJnZXQpIHtcclxuICAgICAgICAgICAgdmFyIGJydXNoTGlzdCA9ICRHKFwiSl9icnVzaEJhclwiKS5jaGlsZHJlbjtcclxuICAgICAgICAgICAgdmFyIGVyYXNlckxpc3QgPSAkRyhcIkpfZXJhc2VyQmFyXCIpLmNoaWxkcmVuO1xyXG5cclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGVsZTsgZWxlID0gYnJ1c2hMaXN0W2krK107KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZWxlLnRhZ05hbWUudG9Mb3dlckNhc2UoKSA9PSBcImFcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIGVsZS5zdHlsZS5vcGFjaXR5ID0gMC4zO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwLCBub2RlOyBub2RlID0gZXJhc2VyTGlzdFtqKytdOykge1xyXG4gICAgICAgICAgICAgICAgaWYgKG5vZGUudGFnTmFtZS50b0xvd2VyQ2FzZSgpID09IFwiYVwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5zdHlsZS5vcGFjaXR5ID0gMC4zO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0YXJnZXQuc3R5bGUub3BhY2l0eSA9IDE7XHJcbiAgICAgICAgICAgIHRhcmdldC5ibHVyKCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBnZXRDYW52YXNEYXRhOmZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIHBpY0NvbnRhaW5lciA9ICRHKFwiSl9waWNCb2FyZFwiKSxcclxuICAgICAgICAgICAgICAgIGltZyA9IHBpY0NvbnRhaW5lci5jaGlsZHJlblswXTtcclxuICAgICAgICAgICAgaWYgKGltZykge1xyXG4gICAgICAgICAgICAgICAgdmFyIHgsIHk7XHJcbiAgICAgICAgICAgICAgICBpZiAoaW1nLnN0eWxlLnBvc2l0aW9uID09IFwiYWJzb2x1dGVcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIHggPSBwYXJzZUludChpbWcuc3R5bGUubGVmdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgeSA9IHBhcnNlSW50KGltZy5zdHlsZS50b3ApO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB4ID0gKHBpY0NvbnRhaW5lci5vZmZzZXRXaWR0aCAtIGltZy53aWR0aCkgLyAyO1xyXG4gICAgICAgICAgICAgICAgICAgIHkgPSAocGljQ29udGFpbmVyLm9mZnNldEhlaWdodCAtIGltZy5oZWlnaHQpIC8gMjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNvbnRleHQuZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gXCJkZXN0aW5hdGlvbi1vdmVyXCI7XHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShpbWcsIHgsIHksIGltZy53aWR0aCwgaW1nLmhlaWdodCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb250ZXh0Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9IFwiZGVzdGluYXRpb24tYXRvcFwiO1xyXG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsU3R5bGUgPSBcIiNmZmZcIjsvL+mHjee9rueUu+W4g+iDjOaZr+eZveiJslxyXG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FudmFzLnRvRGF0YVVSTChcImltYWdlL3BuZ1wiKS5zdWJzdHJpbmcoMjIpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJcIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYnRuMkhpZ2hsaWdodDpmdW5jdGlvbiAoaWQpIHtcclxuICAgICAgICAgICAgdmFyIGN1ciA9ICRHKGlkKTtcclxuICAgICAgICAgICAgY3VyLmNsYXNzTmFtZS5pbmRleE9mKFwiSFwiKSA9PSAtMSAmJiAoY3VyLmNsYXNzTmFtZSArPSBcIkhcIik7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBidG4yZGlzYWJsZTpmdW5jdGlvbiAoaWQpIHtcclxuICAgICAgICAgICAgdmFyIGN1ciA9ICRHKGlkKTtcclxuICAgICAgICAgICAgY3VyLmNsYXNzTmFtZS5pbmRleE9mKFwiSFwiKSAhPSAtMSAmJiAoY3VyLmNsYXNzTmFtZSA9IGN1ci5jbGFzc05hbWUucmVwbGFjZShcIkhcIiwgXCJcIikpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZ2V0VGFyZ2V0OmZ1bmN0aW9uIChldnQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGV2dC50YXJnZXQgfHwgZXZ0LnNyY0VsZW1lbnQ7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufSkoKTtcclxuXHJcbnZhciBTY2FsZUJveSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMuZG9tID0gbnVsbDtcclxuICAgIHRoaXMuc2NhbGluZ0VsZW1lbnQgPSBudWxsO1xyXG59O1xyXG4oZnVuY3Rpb24gKCkge1xyXG4gICAgZnVuY3Rpb24gX2FwcGVuZFN0eWxlKCkge1xyXG4gICAgICAgIHZhciBkb2MgPSBkb2N1bWVudCxcclxuICAgICAgICAgICAgaGVhZCA9IGRvYy5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdLFxyXG4gICAgICAgICAgICBzdHlsZSA9IGRvYy5jcmVhdGVFbGVtZW50KCdzdHlsZScpLFxyXG4gICAgICAgICAgICBjc3NUZXh0ID0gJy5zY2FsZXt2aXNpYmlsaXR5OmhpZGRlbjtjdXJzb3I6bW92ZTtwb3NpdGlvbjphYnNvbHV0ZTtsZWZ0OjA7dG9wOjA7d2lkdGg6MTAwcHg7aGVpZ2h0OjUwcHg7YmFja2dyb3VuZC1jb2xvcjojZmZmO2ZvbnQtc2l6ZTowO2xpbmUtaGVpZ2h0OjA7b3BhY2l0eTouNDtmaWx0ZXI6QWxwaGEob3BhY2l0eT00MCk7fSdcclxuICAgICAgICAgICAgICAgICsgJy5zY2FsZSBzcGFue3Bvc2l0aW9uOmFic29sdXRlO2xlZnQ6MDt0b3A6MDt3aWR0aDo2cHg7aGVpZ2h0OjZweDtiYWNrZ3JvdW5kLWNvbG9yOiMwMDZEQUU7fSdcclxuICAgICAgICAgICAgICAgICsgJy5zY2FsZSAuaGFuZDAsIC5zY2FsZSAuaGFuZDd7Y3Vyc29yOm53LXJlc2l6ZTt9J1xyXG4gICAgICAgICAgICAgICAgKyAnLnNjYWxlIC5oYW5kMSwgLnNjYWxlIC5oYW5kNntsZWZ0OjUwJTttYXJnaW4tbGVmdDotM3B4O2N1cnNvcjpuLXJlc2l6ZTt9J1xyXG4gICAgICAgICAgICAgICAgKyAnLnNjYWxlIC5oYW5kMiwgLnNjYWxlIC5oYW5kNCwgLnNjYWxlIC5oYW5kN3tsZWZ0OjEwMCU7bWFyZ2luLWxlZnQ6LTZweDt9J1xyXG4gICAgICAgICAgICAgICAgKyAnLnNjYWxlIC5oYW5kMywgLnNjYWxlIC5oYW5kNHt0b3A6NTAlO21hcmdpbi10b3A6LTNweDtjdXJzb3I6dy1yZXNpemU7fSdcclxuICAgICAgICAgICAgICAgICsgJy5zY2FsZSAuaGFuZDUsIC5zY2FsZSAuaGFuZDYsIC5zY2FsZSAuaGFuZDd7bWFyZ2luLXRvcDotNnB4O3RvcDoxMDAlO30nXHJcbiAgICAgICAgICAgICAgICArICcuc2NhbGUgLmhhbmQyLCAuc2NhbGUgLmhhbmQ1e2N1cnNvcjpuZS1yZXNpemU7fSc7XHJcbiAgICAgICAgc3R5bGUudHlwZSA9ICd0ZXh0L2Nzcyc7XHJcblxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHN0eWxlLmFwcGVuZENoaWxkKGRvYy5jcmVhdGVUZXh0Tm9kZShjc3NUZXh0KSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICBzdHlsZS5zdHlsZVNoZWV0LmNzc1RleHQgPSBjc3NUZXh0O1xyXG4gICAgICAgIH1cclxuICAgICAgICBoZWFkLmFwcGVuZENoaWxkKHN0eWxlKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBfZ2V0RG9tKCkge1xyXG4gICAgICAgIHZhciBkb2MgPSBkb2N1bWVudCxcclxuICAgICAgICAgICAgaGFuZCxcclxuICAgICAgICAgICAgYXJyID0gW10sXHJcbiAgICAgICAgICAgIHNjYWxlID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG5cclxuICAgICAgICBzY2FsZS5pZCA9ICdKX3NjYWxlQ29uJztcclxuICAgICAgICBzY2FsZS5jbGFzc05hbWUgPSAnc2NhbGUnO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgODsgaSsrKSB7XHJcbiAgICAgICAgICAgIGFyci5wdXNoKFwiPHNwYW4gY2xhc3M9J2hhbmRcIiArIGkgKyBcIic+PC9zcGFuPlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgc2NhbGUuaW5uZXJIVE1MID0gYXJyLmpvaW4oXCJcIik7XHJcbiAgICAgICAgcmV0dXJuIHNjYWxlO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciByZWN0ID0gW1xyXG4gICAgICAgIC8vW2xlZnQsIHRvcCwgd2lkdGgsIGhlaWdodF1cclxuICAgICAgICBbMSwgMSwgLTEsIC0xXSxcclxuICAgICAgICBbMCwgMSwgMCwgLTFdLFxyXG4gICAgICAgIFswLCAxLCAxLCAtMV0sXHJcbiAgICAgICAgWzEsIDAsIC0xLCAwXSxcclxuICAgICAgICBbMCwgMCwgMSwgMF0sXHJcbiAgICAgICAgWzEsIDAsIC0xLCAxXSxcclxuICAgICAgICBbMCwgMCwgMCwgMV0sXHJcbiAgICAgICAgWzAsIDAsIDEsIDFdXHJcbiAgICBdO1xyXG4gICAgU2NhbGVCb3kucHJvdG90eXBlID0ge1xyXG4gICAgICAgIGluaXQ6ZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBfYXBwZW5kU3R5bGUoKTtcclxuICAgICAgICAgICAgdmFyIG1lID0gdGhpcyxcclxuICAgICAgICAgICAgICAgIHNjYWxlID0gbWUuZG9tID0gX2dldERvbSgpO1xyXG5cclxuICAgICAgICAgICAgbWUuc2NhbGVNb3VzZW1vdmUuZnAgPSBtZTtcclxuICAgICAgICAgICAgZG9tVXRpbHMub24oc2NhbGUsICdtb3VzZWRvd24nLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHRhcmdldCA9IGUudGFyZ2V0IHx8IGUuc3JjRWxlbWVudDtcclxuICAgICAgICAgICAgICAgIG1lLnN0YXJ0ID0ge3g6ZS5jbGllbnRYLCB5OmUuY2xpZW50WX07XHJcbiAgICAgICAgICAgICAgICBpZiAodGFyZ2V0LmNsYXNzTmFtZS5pbmRleE9mKCdoYW5kJykgIT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICBtZS5kaXIgPSB0YXJnZXQuY2xhc3NOYW1lLnJlcGxhY2UoJ2hhbmQnLCAnJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBkb21VdGlscy5vbihkb2N1bWVudC5ib2R5LCAnbW91c2Vtb3ZlJywgbWUuc2NhbGVNb3VzZW1vdmUpO1xyXG4gICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24gPyBlLnN0b3BQcm9wYWdhdGlvbigpIDogZS5jYW5jZWxCdWJibGUgPSB0cnVlO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgZG9tVXRpbHMub24oZG9jdW1lbnQuYm9keSwgJ21vdXNldXAnLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKG1lLnN0YXJ0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZG9tVXRpbHMudW4oZG9jdW1lbnQuYm9keSwgJ21vdXNlbW92ZScsIG1lLnNjYWxlTW91c2Vtb3ZlKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobWUubW92ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWUudXBkYXRlU2NhbGVkRWxlbWVudCh7cG9zaXRpb246e3g6c2NhbGUuc3R5bGUubGVmdCwgeTpzY2FsZS5zdHlsZS50b3B9LCBzaXplOnt3OnNjYWxlLnN0eWxlLndpZHRoLCBoOnNjYWxlLnN0eWxlLmhlaWdodH19KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIG1lLnN0YXJ0O1xyXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBtZS5tb3ZlZDtcclxuICAgICAgICAgICAgICAgICAgICBkZWxldGUgbWUuZGlyO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIHNjYWxlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc3RhcnRTY2FsZTpmdW5jdGlvbiAob2JqRWxlbWVudCkge1xyXG4gICAgICAgICAgICB2YXIgbWUgPSB0aGlzLCBJZG9tID0gbWUuZG9tO1xyXG5cclxuICAgICAgICAgICAgSWRvbS5zdHlsZS5jc3NUZXh0ID0gJ3Zpc2liaWxpdHk6dmlzaWJsZTt0b3A6JyArIG9iakVsZW1lbnQuc3R5bGUudG9wICsgJztsZWZ0OicgKyBvYmpFbGVtZW50LnN0eWxlLmxlZnQgKyAnO3dpZHRoOicgKyBvYmpFbGVtZW50Lm9mZnNldFdpZHRoICsgJ3B4O2hlaWdodDonICsgb2JqRWxlbWVudC5vZmZzZXRIZWlnaHQgKyAncHg7JztcclxuICAgICAgICAgICAgbWUuc2NhbGluZ0VsZW1lbnQgPSBvYmpFbGVtZW50O1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdXBkYXRlU2NhbGVkRWxlbWVudDpmdW5jdGlvbiAob2JqU3R5bGUpIHtcclxuICAgICAgICAgICAgdmFyIGN1ciA9IHRoaXMuc2NhbGluZ0VsZW1lbnQsXHJcbiAgICAgICAgICAgICAgICBwb3MgPSBvYmpTdHlsZS5wb3NpdGlvbixcclxuICAgICAgICAgICAgICAgIHNpemUgPSBvYmpTdHlsZS5zaXplO1xyXG4gICAgICAgICAgICBpZiAocG9zKSB7XHJcbiAgICAgICAgICAgICAgICB0eXBlb2YgcG9zLnggIT0gJ3VuZGVmaW5lZCcgJiYgKGN1ci5zdHlsZS5sZWZ0ID0gcG9zLngpO1xyXG4gICAgICAgICAgICAgICAgdHlwZW9mIHBvcy55ICE9ICd1bmRlZmluZWQnICYmIChjdXIuc3R5bGUudG9wID0gcG9zLnkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChzaXplKSB7XHJcbiAgICAgICAgICAgICAgICBzaXplLncgJiYgKGN1ci5zdHlsZS53aWR0aCA9IHNpemUudyk7XHJcbiAgICAgICAgICAgICAgICBzaXplLmggJiYgKGN1ci5zdHlsZS5oZWlnaHQgPSBzaXplLmgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICB1cGRhdGVTdHlsZUJ5RGlyOmZ1bmN0aW9uIChkaXIsIG9mZnNldCkge1xyXG4gICAgICAgICAgICB2YXIgbWUgPSB0aGlzLFxyXG4gICAgICAgICAgICAgICAgZG9tID0gbWUuZG9tLCB0bXA7XHJcblxyXG4gICAgICAgICAgICByZWN0WydkZWYnXSA9IFsxLCAxLCAwLCAwXTtcclxuICAgICAgICAgICAgaWYgKHJlY3RbZGlyXVswXSAhPSAwKSB7XHJcbiAgICAgICAgICAgICAgICB0bXAgPSBwYXJzZUludChkb20uc3R5bGUubGVmdCkgKyBvZmZzZXQueDtcclxuICAgICAgICAgICAgICAgIGRvbS5zdHlsZS5sZWZ0ID0gbWUuX3ZhbGlkU2NhbGVkUHJvcCgnbGVmdCcsIHRtcCkgKyAncHgnO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChyZWN0W2Rpcl1bMV0gIT0gMCkge1xyXG4gICAgICAgICAgICAgICAgdG1wID0gcGFyc2VJbnQoZG9tLnN0eWxlLnRvcCkgKyBvZmZzZXQueTtcclxuICAgICAgICAgICAgICAgIGRvbS5zdHlsZS50b3AgPSBtZS5fdmFsaWRTY2FsZWRQcm9wKCd0b3AnLCB0bXApICsgJ3B4JztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAocmVjdFtkaXJdWzJdICE9IDApIHtcclxuICAgICAgICAgICAgICAgIHRtcCA9IGRvbS5jbGllbnRXaWR0aCArIHJlY3RbZGlyXVsyXSAqIG9mZnNldC54O1xyXG4gICAgICAgICAgICAgICAgZG9tLnN0eWxlLndpZHRoID0gbWUuX3ZhbGlkU2NhbGVkUHJvcCgnd2lkdGgnLCB0bXApICsgJ3B4JztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAocmVjdFtkaXJdWzNdICE9IDApIHtcclxuICAgICAgICAgICAgICAgIHRtcCA9IGRvbS5jbGllbnRIZWlnaHQgKyByZWN0W2Rpcl1bM10gKiBvZmZzZXQueTtcclxuICAgICAgICAgICAgICAgIGRvbS5zdHlsZS5oZWlnaHQgPSBtZS5fdmFsaWRTY2FsZWRQcm9wKCdoZWlnaHQnLCB0bXApICsgJ3B4JztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoZGlyID09PSAnZGVmJykge1xyXG4gICAgICAgICAgICAgICAgbWUudXBkYXRlU2NhbGVkRWxlbWVudCh7cG9zaXRpb246e3g6ZG9tLnN0eWxlLmxlZnQsIHk6ZG9tLnN0eWxlLnRvcH19KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2NhbGVNb3VzZW1vdmU6ZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgdmFyIG1lID0gYXJndW1lbnRzLmNhbGxlZS5mcCxcclxuICAgICAgICAgICAgICAgIHN0YXJ0ID0gbWUuc3RhcnQsXHJcbiAgICAgICAgICAgICAgICBkaXIgPSBtZS5kaXIgfHwgJ2RlZicsXHJcbiAgICAgICAgICAgICAgICBvZmZzZXQgPSB7eDplLmNsaWVudFggLSBzdGFydC54LCB5OmUuY2xpZW50WSAtIHN0YXJ0Lnl9O1xyXG5cclxuICAgICAgICAgICAgbWUudXBkYXRlU3R5bGVCeURpcihkaXIsIG9mZnNldCk7XHJcbiAgICAgICAgICAgIGFyZ3VtZW50cy5jYWxsZWUuZnAuc3RhcnQgPSB7eDplLmNsaWVudFgsIHk6ZS5jbGllbnRZfTtcclxuICAgICAgICAgICAgYXJndW1lbnRzLmNhbGxlZS5mcC5tb3ZlZCA9IDE7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBfdmFsaWRTY2FsZWRQcm9wOmZ1bmN0aW9uIChwcm9wLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICB2YXIgZWxlID0gdGhpcy5kb20sXHJcbiAgICAgICAgICAgICAgICB3cmFwID0gJEcoXCJKX3BpY0JvYXJkXCIpO1xyXG5cclxuICAgICAgICAgICAgdmFsdWUgPSBpc05hTih2YWx1ZSkgPyAwIDogdmFsdWU7XHJcbiAgICAgICAgICAgIHN3aXRjaCAocHJvcCkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnbGVmdCc6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlIDwgMCA/IDAgOiAodmFsdWUgKyBlbGUuY2xpZW50V2lkdGgpID4gd3JhcC5jbGllbnRXaWR0aCA/IHdyYXAuY2xpZW50V2lkdGggLSBlbGUuY2xpZW50V2lkdGggOiB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ3RvcCc6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlIDwgMCA/IDAgOiAodmFsdWUgKyBlbGUuY2xpZW50SGVpZ2h0KSA+IHdyYXAuY2xpZW50SGVpZ2h0ID8gd3JhcC5jbGllbnRIZWlnaHQgLSBlbGUuY2xpZW50SGVpZ2h0IDogdmFsdWU7XHJcbiAgICAgICAgICAgICAgICBjYXNlICd3aWR0aCc6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlIDw9IDAgPyAxIDogKHZhbHVlICsgZWxlLm9mZnNldExlZnQpID4gd3JhcC5jbGllbnRXaWR0aCA/IHdyYXAuY2xpZW50V2lkdGggLSBlbGUub2Zmc2V0TGVmdCA6IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnaGVpZ2h0JzpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWUgPD0gMCA/IDEgOiAodmFsdWUgKyBlbGUub2Zmc2V0VG9wKSA+IHdyYXAuY2xpZW50SGVpZ2h0ID8gd3JhcC5jbGllbnRIZWlnaHQgLSBlbGUub2Zmc2V0VG9wIDogdmFsdWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59KSgpO1xyXG5cclxuLy/lkI7lj7Dlm57osINcclxuZnVuY3Rpb24gdWVfY2FsbGJhY2sodXJsLCBzdGF0ZSkge1xyXG4gICAgdmFyIGRvYyA9IGRvY3VtZW50LFxyXG4gICAgICAgIHBpY0JvcmFyZCA9ICRHKFwiSl9waWNCb2FyZFwiKSxcclxuICAgICAgICBpbWcgPSBkb2MuY3JlYXRlRWxlbWVudChcImltZ1wiKTtcclxuXHJcbiAgICAvL+WbvueJh+e8qeaUvlxyXG4gICAgZnVuY3Rpb24gc2NhbGUoaW1nLCBtYXgsIG9XaWR0aCwgb0hlaWdodCkge1xyXG4gICAgICAgIHZhciB3aWR0aCA9IDAsIGhlaWdodCA9IDAsIHBlcmNlbnQsIG93ID0gaW1nLndpZHRoIHx8IG9XaWR0aCwgb2ggPSBpbWcuaGVpZ2h0IHx8IG9IZWlnaHQ7XHJcbiAgICAgICAgaWYgKG93ID4gbWF4IHx8IG9oID4gbWF4KSB7XHJcbiAgICAgICAgICAgIGlmIChvdyA+PSBvaCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHdpZHRoID0gb3cgLSBtYXgpIHtcclxuICAgICAgICAgICAgICAgICAgICBwZXJjZW50ID0gKHdpZHRoIC8gb3cpLnRvRml4ZWQoMik7XHJcbiAgICAgICAgICAgICAgICAgICAgaW1nLmhlaWdodCA9IG9oIC0gb2ggKiBwZXJjZW50O1xyXG4gICAgICAgICAgICAgICAgICAgIGltZy53aWR0aCA9IG1heDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGlmIChoZWlnaHQgPSBvaCAtIG1heCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHBlcmNlbnQgPSAoaGVpZ2h0IC8gb2gpLnRvRml4ZWQoMik7XHJcbiAgICAgICAgICAgICAgICAgICAgaW1nLndpZHRoID0gb3cgLSBvdyAqIHBlcmNlbnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgaW1nLmhlaWdodCA9IG1heDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvL+enu+mZpOmBrue9qeWxglxyXG4gICAgcmVtb3ZlTWFza0xheWVyKCk7XHJcbiAgICAvL+eKtuaAgeWTjeW6lFxyXG4gICAgaWYgKHN0YXRlID09IFwiU1VDQ0VTU1wiKSB7XHJcbiAgICAgICAgcGljQm9yYXJkLmlubmVySFRNTCA9IFwiXCI7XHJcbiAgICAgICAgaW1nLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgc2NhbGUodGhpcywgMzAwKTtcclxuICAgICAgICAgICAgcGljQm9yYXJkLmFwcGVuZENoaWxkKGltZyk7XHJcblxyXG4gICAgICAgICAgICB2YXIgb2JqID0gbmV3IHNjcmF3bCgpO1xyXG4gICAgICAgICAgICBvYmouYnRuMkhpZ2hsaWdodChcIkpfcmVtb3ZlSW1nXCIpO1xyXG4gICAgICAgICAgICAvL3RyYWNlIDI0NTdcclxuICAgICAgICAgICAgb2JqLmJ0bjJIaWdobGlnaHQoXCJKX3NhY2xlQm9hcmRcIik7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBpbWcuc3JjID0gdXJsO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBhbGVydChzdGF0ZSk7XHJcbiAgICB9XHJcbn1cclxuLy/ljrvmjonpga7nvanlsYJcclxuZnVuY3Rpb24gcmVtb3ZlTWFza0xheWVyKCkge1xyXG4gICAgdmFyIG1hc2tMYXllciA9ICRHKFwiSl9tYXNrTGF5ZXJcIik7XHJcbiAgICBtYXNrTGF5ZXIuY2xhc3NOYW1lID0gXCJtYXNrTGF5ZXJOdWxsXCI7XHJcbiAgICBtYXNrTGF5ZXIuaW5uZXJIVE1MID0gXCJcIjtcclxuICAgIGRpYWxvZy5idXR0b25zWzBdLnNldERpc2FibGVkKGZhbHNlKTtcclxufVxyXG4vL+a3u+WKoOmBrue9qeWxglxyXG5mdW5jdGlvbiBhZGRNYXNrTGF5ZXIoaHRtbCkge1xyXG4gICAgdmFyIG1hc2tMYXllciA9ICRHKFwiSl9tYXNrTGF5ZXJcIik7XHJcbiAgICBkaWFsb2cuYnV0dG9uc1swXS5zZXREaXNhYmxlZCh0cnVlKTtcclxuICAgIG1hc2tMYXllci5jbGFzc05hbWUgPSBcIm1hc2tMYXllclwiO1xyXG4gICAgbWFza0xheWVyLmlubmVySFRNTCA9IGh0bWw7XHJcbn1cclxuLy/miafooYznoa7orqTmjInpkq7mlrnms5VcclxuZnVuY3Rpb24gZXhlYyhzY3Jhd2xPYmopIHtcclxuICAgIGlmIChzY3Jhd2xPYmouaXNTY3Jhd2wpIHtcclxuICAgICAgICBhZGRNYXNrTGF5ZXIobGFuZy5zY3Jhd2xVcExvYWRpbmcpO1xyXG4gICAgICAgIHZhciBiYXNlNjQgPSBzY3Jhd2xPYmouZ2V0Q2FudmFzRGF0YSgpO1xyXG4gICAgICAgIGlmICghIWJhc2U2NCkge1xyXG4gICAgICAgICAgICB2YXIgb3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgICAgIHRpbWVvdXQ6MTAwMDAwLFxyXG4gICAgICAgICAgICAgICAgb25zdWNjZXNzOmZ1bmN0aW9uICh4aHIpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXNjcmF3bE9iai5pc0NhbmNlbFNjcmF3bCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzcG9uc2VPYmo7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlT2JqID0gZXZhbChcIihcIiArIHhoci5yZXNwb25zZVRleHQgKyBcIilcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZU9iai5zdGF0ZSA9PSBcIlNVQ0NFU1NcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGltZ09iaiA9IHt9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybCA9IGVkaXRvci5vcHRpb25zLnNjcmF3bFVybFByZWZpeCArIHJlc3BvbnNlT2JqLnVybDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltZ09iai5zcmMgPSB1cmw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbWdPYmouX3NyYyA9IHVybDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltZ09iai5hbHQgPSByZXNwb25zZU9iai5vcmlnaW5hbCB8fCAnJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltZ09iai50aXRsZSA9IHJlc3BvbnNlT2JqLnRpdGxlIHx8ICcnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdG9yLmV4ZWNDb21tYW5kKFwiaW5zZXJ0SW1hZ2VcIiwgaW1nT2JqKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpYWxvZy5jbG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxlcnQocmVzcG9uc2VPYmouc3RhdGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBvbmVycm9yOmZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBhbGVydChsYW5nLmltYWdlRXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgICAgIGRpYWxvZy5jbG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBvcHRpb25zW2VkaXRvci5nZXRPcHQoJ3NjcmF3bEZpZWxkTmFtZScpXSA9IGJhc2U2NDtcclxuXHJcbiAgICAgICAgICAgIHZhciBhY3Rpb25VcmwgPSBlZGl0b3IuZ2V0QWN0aW9uVXJsKGVkaXRvci5nZXRPcHQoJ3NjcmF3bEFjdGlvbk5hbWUnKSksXHJcbiAgICAgICAgICAgICAgICBwYXJhbXMgPSB1dGlscy5zZXJpYWxpemVQYXJhbShlZGl0b3IucXVlcnlDb21tYW5kVmFsdWUoJ3NlcnZlcnBhcmFtJykpIHx8ICcnLFxyXG4gICAgICAgICAgICAgICAgdXJsID0gdXRpbHMuZm9ybWF0VXJsKGFjdGlvblVybCArIChhY3Rpb25VcmwuaW5kZXhPZignPycpID09IC0xID8gJz8nOicmJykgKyBwYXJhbXMpO1xyXG4gICAgICAgICAgICBhamF4LnJlcXVlc3QodXJsLCBvcHRpb25zKTtcclxuICAgICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGFkZE1hc2tMYXllcihsYW5nLm5vU2NhcndsICsgXCImbmJzcDsmbmJzcDsmbmJzcDs8aW5wdXQgdHlwZT0nYnV0dG9uJyB2YWx1ZT0nXCIgKyBsYW5nLmNvbnRpbnVlQnRuICsgXCInICBvbmNsaWNrPSdyZW1vdmVNYXNrTGF5ZXIoKScvPlwiKTtcclxuICAgIH1cclxufVxyXG5cclxuIl0sImZpbGUiOiJwbHVnaW5zL3VlZGl0b3IvZGlhbG9ncy9zY3Jhd2wvc2NyYXdsLmpzIn0=
