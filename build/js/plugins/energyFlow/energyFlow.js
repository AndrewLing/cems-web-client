(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(function () {
            return factory(root);
        });
    } else if (typeof exports === 'object') {
        module.exports = factory;
    } else {
        root.energyFlow = factory(root);
    }
})(this, function (root) {
    'use strict';
    (function () {
        window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;
        if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = function (callback) {
                var id = window.setTimeout(callback, 1000 / 60);
                return id;
            };
        }
        if (!window.cancelAnimationFrame) {
            window.cancelAnimationFrame = function (id) {
                clearTimeout(id);
            };
        }
    }());

    window.ballsMap = {};
    window.iconsMap = {};
    window.animation = null;

    function autoLayout(canvas, config) {
        var rowCounts = 1;
        var colCounts = 1;
        $.each(config.nodes, function (idx, node) {
            rowCounts = (node.row >= rowCounts) ? node.row : rowCounts;
            colCounts = (node.col >= colCounts) ? node.col : colCounts;
        });
        var rowHeight = (config.layout.height - 5) / rowCounts;
        var colWidth = config.layout.width / colCounts;

        $.each(config.nodes, function (idx, node) {
            var x = (node.col - 1) * colWidth;
            var y = (node.row - 1) * rowHeight;
            $.extend(node, {
                x: x,
                y: y,
                height: rowHeight,
                width: colWidth,
                iconHeight: node.iconHeight || rowHeight,
                iconWidth: node.iconWidth || colWidth,
                focused: false,
                description: transDescription(node.description)
            });
        });


        $.each(config.links, function (i, link) {
            $.extend(link, {
                description: transDescription(link.description)
            });

            var routings = [];
            var fromNode = $.grep(config.nodes, function (node) {
                return node.id == link.fromNode;
            })[0];
            var toNode = $.grep(config.nodes, function (node) {
                return node.id == link.toNode;
            })[0];
            var sPoint = getConnectorPoint(fromNode, link.fromConnector);
            var ePoint = getConnectorPoint(toNode, link.toConnector);
            routings.push(sPoint);

            if (fromNode.row != toNode.row) {
                var celWidth = fromNode.width;
                if (link.fromConnector.substr(0, 1) == "R" && link.toConnector.substr(0, 1) == "L" && true == link.merge) {
                    routings.push({x: ePoint.x - celWidth / 15, y: sPoint.y});
                    routings.push({x: ePoint.x - celWidth / 15, y: sPoint.y + (ePoint.y - sPoint.y)});
                } else if (link.fromConnector.substr(0, 1) == "L" || link.fromConnector.substr(0, 1) == "R") {
                    routings.push({x: ePoint.x, y: sPoint.y});
                } else if (link.fromConnector.substr(0, 1) == "B" || link.fromConnector.substr(0, 1) == "L") {
                    ePoint.y = ePoint.y - 20;
                    routings.push({x: sPoint.x, y: ePoint.y});
                } else if (link.fromConnector.substr(0, 1) == "T" || link.fromConnector.substr(0, 1) == "L") {
                    ePoint.y = ePoint.y + 3;
                    routings.push({x: sPoint.x, y: ePoint.y});
                }
            }
            routings.push(ePoint);

            var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            var pathRouting = "";
            var newPoints = [];
            var r = 5;

            //调整为圆角
            $.each(routings, function (i, p) {
                if (i == 0) {
                    p.type = "M";
                    newPoints.push(p);
                    pathRouting += " M " + p.x + " " + p.y + " ";
                    return true;
                }
                if (i == routings.length - 1) {
                    p.type = "L";
                    newPoints.push(p);
                    pathRouting += " L " + p.x + " " + p.y + " ";
                    return true;
                }
                //垂直转水平
                if (routings[i - 1].x == p.x) {
                    var direction = {
                        x: routings[i + 1].x - routings[i - 1].x,
                        y: routings[i + 1].y - routings[i - 1].y
                    };
                    var p1 = {x: p.x, y: direction.y >= 0 ? (p.y - r) : (p.y + r), type: "L"}
                    p.type = "Q";
                    var p2 = {x: direction.x >= 0 ? (p.x + r) : (p.x - r), y: p.y, type: ""}
                    newPoints.push(p1, p, p2);
                    pathRouting += " L " + p1.x + " " + p1.y + " ";
                    pathRouting += " Q " + p.x + " " + p.y + " " + p2.x + " " + p2.y + " ";
                    return true;
                }

                //水平转垂直
                if (routings[i - 1].y == p.y) {
                    var direction = {
                        x: routings[i + 1].x - routings[i - 1].x,
                        y: routings[i + 1].y - routings[i - 1].y
                    };
                    var p1 = {x: direction.x >= 0 ? (p.x - r) : (p.x + r), y: p.y, type: "L"}
                    p.type = "Q";
                    var p2 = {x: p.x, y: (direction.y >= 0 ? (p.y + r) : (p.y - r)), type: ""}
                    newPoints.push(p1, p, p2);
                    pathRouting += " L " + p1.x + " " + p1.y + " ";
                    pathRouting += " Q " + p.x + " " + p.y + " " + p2.x + " " + p2.y + " ";
                    return true;
                }
            });
            path.setAttribute('d', pathRouting);
            $.extend(link, {
                routings: routings,
                points: newPoints,
                path: path,
                len: 0
            });
        });
    }

    function bindMouseEvent(canvas, ctx, config, lineDashSupport) {
        $(canvas).unbind("mousemove").mousemove(function (e) {
            $(canvas).parent("div").attr("title", "");
            var x = e.offsetX || e.clientX - $(canvas).offset().left,
                y = e.offsetY || e.clientY - $(canvas).offset().top;
            $.each(config.links, function (id, link) {
                if (link.tooltip) {
                    if (link.tooltip.sPoint.x <= x && x <= link.tooltip.ePoint.x
                        && link.tooltip.sPoint.y <= y && y <= link.tooltip.ePoint.y) {
                        $(canvas).parent("div").attr("title", link.tooltip.tip);
                    }
                }
            });
            $.each(config.nodes, function (id, node) {
                if (node.tooltip) {
                    if (node.tooltip.sPoint.x <= x && x <= node.tooltip.ePoint.x
                        && node.tooltip.sPoint.y <= y && y <= node.tooltip.ePoint.y) {
                        $(canvas).parent("div").attr("title", node.tooltip.tip);
                    }
                }
            });


            $.each(config.nodes, function (id, node) {
                if (!node.click)//无点击事件,不做鼠标悬停事件
                    return;
                if (!node.isHover) {
                    if (isInRange(canvas, e, node)) {
                        node.isHover = true;
                        $(canvas).css("cursor", "pointer");
                    } else {
                        node.isHover = false;
                    }
                } else {
                    if (!isInRange(canvas, e, node)) {
                        node.isHover = false;
                        $(canvas).css("cursor", "default");
                    } else {
                        node.isHover = true;
                    }
                }
            });
        });
        $(canvas).unbind("click").click(function (e) {
            $.each(config.nodes, function (id, node) {
                if (isInRange(canvas, e, node)) {
                    if (node.click && typeof(node.click) == "function") {
                        $.each(config.nodes, function (i, v) {//清空选择状态
                            v.status = "";
                            drawBorder(ctx, v, lineDashSupport);
                        });
                        node.status = "selected";
                        drawBorder(ctx, node, lineDashSupport);
                        node.click(node.customAttr);
                    }
                }
            });
        });
    }

    function isInRange(canvas, e, node) {
        var x = e.offsetX || e.clientX - $(canvas).offset().left,
            y = e.offsetY || e.clientY - $(canvas).offset().top;
        if (x >= node.x && x <= node.x + node.width
            && y >= node.y && y <= node.y + node.height) {
            return true;
        }
        return false;
    }

    function measureText(ctx, node, label, value) {
        ctx.font = "normal normal " + (node.description.labelFontSize || "14px") + " Microsoft Yahei";
        var labelWidth = ctx.measureText($.trim(label) != "" ? (label + "...") : node.description.label).width;
        ctx.font = "normal normal " + (node.description.valueFontSize || "14px") + " Microsoft Yahei";
        var valueWidth = ctx.measureText(value || node.description.value).width;
        return {labelWidth: labelWidth, valueWidth: valueWidth, width: labelWidth + valueWidth};
    }

    function adjustNodeText(ctx, node, label, value) {
        var measure = measureText(ctx, node, label, value);
        var Y = node.y + (node.height - node.iconHeight) / 2 + node.iconHeight + 18 + node.description.offset.y;
        var labelX = node.x + node.width / 2 - measure.width / 2 + measure.labelWidth / 2 + node.description.offset.x;
        var valueX = labelX + measure.width / 2;
        if (((labelX - measure.labelWidth / 2) < 0 || measure.width > 1.5 * node.width) && (label || node.description.label).length > 2) {
            var label = label || node.description.label;
            label = label.substring(label, label.length - 1);
            return adjustNodeText(ctx, node, label, node.description.value);
        }
        node.tooltip = {
            sPoint: {x: labelX - measure.labelWidth / 2, y: Y - 20},
            ePoint: {x: labelX + measure.labelWidth / 2, y: Y - 2},
            tip: node.description.label
        };
        return {
            label: {
                x: labelX,
                y: Y,
                text: $.trim(label) != "" ? label + "..." : node.description.label,
                width: measure.labelWidth
            },
            value: {x: valueX, y: Y, text: node.description.value, width: measure.valueWidth}
        };
    }

    function drawNode(ctx, node, createIcon, lineDashSupport) {
        if (createIcon) {
            ctx.clearRect(node.x, node.y, node.width, node.height);
            if (window.iconsMap[node.icon] == null) {
                var img = new Image();
                img.src = node.icon;
                $(img).load(function () {
                    window.iconsMap[node.icon] = img;
                    ctx.drawImage(img,
                        node.x + (node.width - node.iconWidth) / 2,
                        node.y + (node.height - node.iconHeight) / 2,
                        node.iconWidth, node.iconHeight);
                });
            } else {
                ctx.drawImage(window.iconsMap[node.icon],
                    node.x + (node.width - node.iconWidth) / 2,
                    node.y + (node.height - node.iconHeight) / 2,
                    node.iconWidth, node.iconHeight);
            }
        }

        if (node.render && typeof(node.render) == "function") {
            node.render(ctx, node);
        }
        if (node.preDescription) {
            var description = node.description;
            var perDescription = node.preDescription;
            node.description = perDescription;
            node.perDescription = description;
            var displayText = adjustNodeText(ctx, node);
            ctx.clearRect(displayText.label.x - displayText.label.width / 2 - 5, displayText.label.y - 12, displayText.label.width + displayText.value.width + 10, 18);
            node.description = description;
            node.perDescription = perDescription;
        }
        drawBorder(ctx, node, lineDashSupport);

        var displayText = adjustNodeText(ctx, node);
        //填充文字
        ctx.globalAlpha = 1;
        ctx.textAlign = "center";
        ctx.font = "normal normal " + (node.description.labelFontSize || "14px") + " Microsoft Yahei";
        ctx.fillStyle = (node.description.labelColor || "#333333");
        ctx.fillText(displayText.label.text, displayText.label.x, displayText.label.y);
        ctx.textAlign = "center";
        ctx.font = "normal normal " + (node.description.valueFontSize || "14px") + " Microsoft Yahei";
        ctx.fillStyle = (node.description.valueColor || "#19CE96");
        ctx.fillText(displayText.value.text, displayText.value.x, displayText.value.y);

    }

    function drawBorder(ctx, node, lineDashSupport) {
        var borderColor = "#FFFFFF";
        if (node.status == "selected") {
            borderColor = "#FFA500";
        }
        var padding = 5;
        var x = node.x + (node.width - node.iconWidth) / 2 - padding;
        var y = node.y + (node.height - node.iconHeight) / 2 - padding;
        var width = node.iconWidth + padding * 2;
        var height = node.iconHeight + padding * 2;
        var radius = 10;
        ctx.beginPath();
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = "3";
        if(lineDashSupport){
            ctx.setLineDash([6, 6]);//设置虚线
        }
        //画圆角矩形
        ctx.arc(x + radius, y + radius, radius, Math.PI, Math.PI * 3 / 2);
        ctx.lineTo(width - radius + x, y);
        ctx.arc(width - radius + x, radius + y, radius, Math.PI * 3 / 2, Math.PI * 2);
        ctx.lineTo(width + x, height + y - radius);
        ctx.arc(width - radius + x, height - radius + y, radius, 0, Math.PI * 1 / 2);
        ctx.lineTo(radius + x, height + y);
        ctx.arc(radius + x, height - radius + y, radius, Math.PI * 1 / 2, Math.PI);
        ctx.closePath();
        ctx.save();
        ctx.stroke();
        if(lineDashSupport){
            ctx.setLineDash([]);//清空虚线设置
        }
    }

    function getTextPosition(ctx, link) {
        var pIdx = -1, max_len = 0;
        for (var i = 1; i < link.points.length; i++) {
            //只取横向线段
            if (Math.abs(link.points[i].y - link.points[i - 1].y) != 0) {
                continue;
            }
            var tmp_len = Math.sqrt(Math.pow(Math.abs(link.points[i].x - link.points[i - 1].x), 2) + Math.pow(Math.abs(link.points[i].y - link.points[i - 1].y), 2));
            if (tmp_len > max_len) {
                max_len = tmp_len;
                pIdx = i;
            }
        }
        return {width: max_len, sPoint: link.points[pIdx - 1], ePoint: link.points[pIdx]};
    }

    function adjustLinkText(ctx, link, label, value) {
        var textPosition = getTextPosition(ctx, link);
        var measure = measureText(ctx, link, label, value);
        var Y = textPosition.sPoint.y - 8 + link.description.offset.y;
        var labelX = textPosition.sPoint.x + textPosition.width / 2 - measure.width / 2 + measure.labelWidth / 2 + link.description.offset.x;
        var valueX = labelX + measure.width / 2;
        if (((labelX - measure.labelWidth / 2) < 0 || measure.width > textPosition.width) && (label || link.description.label).length > 2) {
            var label = label || link.description.label;
            label = label.substring(label, label.length - 1);
            return adjustLinkText(ctx, link, label, link.description.value);
        }
        link.tooltip = {
            sPoint: {x: labelX - measure.labelWidth / 2, y: Y - 20},
            ePoint: {x: labelX + measure.labelWidth / 2, y: Y - 2},
            tip: link.description.label
        };
        return {
            label: {
                x: labelX,
                y: Y,
                text: $.trim(label) != "" ? label + "..." : link.description.label,
                width: measure.labelWidth
            },
            value: {x: valueX, y: Y, text: link.description.value, width: measure.valueWidth}
        };
    }

    function drawLinkText(ctx, link) {
        if (link.preDescription) {
            var paddingWidth = 5;
            var description = link.description;
            var perDescription = link.preDescription;
            link.description = perDescription;
            link.perDescription = description;
            var position = getTextPosition(ctx, link);
            if (position.sPoint.x > position.ePoint.x) {
                paddingWidth = -paddingWidth;
            }
            ctx.clearRect(position.sPoint.x + paddingWidth, position.sPoint.y - 20 + link.description.offset.y, position.ePoint.x - position.sPoint.x - 2 * paddingWidth, 18);
            link.description = description;
            link.perDescription = perDescription;
        }

        if (link.flowing == "WARNING") {
            var position = getTextPosition(ctx, link);
            var errorIcon = "images/main/singlePlant/energyFlow/communicationFailure.png";
            if (window.iconsMap[errorIcon] == null) {
                var img = new Image();
                img.src = errorIcon;
                $(img).load(function () {
                    window.iconsMap[errorIcon] = img;
                    ctx.drawImage(img,
                        (position.sPoint.x + position.ePoint.x) / 2 - 5 + link.description.offset.x,
                        position.sPoint.y - 20 + link.description.offset.y,
                        18, 18);
                });
            } else {
                ctx.drawImage(window.iconsMap[errorIcon],
                    (position.sPoint.x + position.ePoint.x) / 2 - 5 + link.description.offset.x,
                    position.sPoint.y - 20 + link.description.offset.y,
                    18, 18);
            }
            return;
        }
        var displayText = adjustLinkText(ctx, link);
        //填充文字
        ctx.globalAlpha = 1;
        ctx.textAlign = "center";
        ctx.font = "normal normal " + (link.description.labelFontSize || "14px") + " Microsoft Yahei";
        ctx.fillStyle = "#333333";
        ctx.fillText(displayText.label.text, displayText.label.x, displayText.label.y);
        ctx.textAlign = "center";
        ctx.font = "normal normal " + (link.description.valueFontSize || "14px") + " Microsoft Yahei";
        ctx.fillStyle = (link.arrowColor || "#19CE96");
        ctx.fillText(displayText.value.text, displayText.value.x, displayText.value.y);
    }

    function drawLine(ctx, link, width, color, dash) {
        ctx.save();
        if (dash) {
            ctx.setLineDash(dash);
        }
        ctx.beginPath();
        for (var i = 0; i < link.points.length; i++) {
            if (link.points[i].type == "M") {
                ctx.moveTo(link.points[i].x, link.points[i].y);
            } else if (link.points[i].type == "L") {
                ctx.lineTo(link.points[i].x, link.points[i].y);
            } else if (link.points[i].type == "Q") {
                ctx.quadraticCurveTo(link.points[i].x, link.points[i].y, link.points[i + 1].x, link.points[i + 1].y);
            }
        }
        ctx.lineWidth = width;
        ctx.strokeStyle = color;
        ctx.stroke();
        ctx.closePath();
        ctx.restore();
    }

    function drawLink(ctx, link, lineDashSupport, ignoreText) {
        var linkColor = link.linkColor || "#19CE88";
        drawLine(ctx, link, 6, "#FFFFFF");
        if(link.flowing =="WARNING"){
            drawLine(ctx, link, 1, linkColor);
        }else{
            drawLine(ctx, link, 2, linkColor, lineDashSupport ? [2, 4]:null);
        }
        if (!ignoreText) {
            drawLinkText(ctx, link);
        }
    }

    function drawArrow(ctx, link) {
        if (link.flowing == "NONE") {
            return;
        }
        if (link.flowing == "WARNING") {
            var theta = 25;
            var headlen = 6;
            var width = 1;
            var sPoint = link.points[link.points.length -2];
            var ePoint = link.points[link.points.length -1];
            var fromX = sPoint.x;
            var fromY = sPoint.y;
            var toX = ePoint.x;
            var toY = ePoint.y;
            // 计算各角度和对应的P2,P3坐标
            var angle = Math.atan2(fromY - toY, fromX - toX) * 180 / Math.PI,
                angle1 = (angle + theta) * Math.PI / 180,
                angle2 = (angle - theta) * Math.PI / 180,
                topX = headlen * Math.cos(angle1),
                topY = headlen * Math.sin(angle1),
                botX = headlen * Math.cos(angle2),
                botY = headlen * Math.sin(angle2);
            ctx.save();
            ctx.beginPath();
            var arrowX = fromX - topX,
                arrowY = fromY - topY;
            ctx.moveTo(arrowX, arrowY);
            ctx.moveTo(fromX, fromY);
            ctx.lineTo(toX, toY);
            arrowX = toX + topX;
            arrowY = toY + topY;
            ctx.moveTo(arrowX, arrowY);
            ctx.lineTo(toX, toY);
            arrowX = toX + botX;
            arrowY = toY + botY;
            ctx.lineTo(arrowX, arrowY);
            ctx.strokeStyle = link.linkColor || "#19CE88";
            ctx.lineWidth = width;
            ctx.stroke();
            ctx.restore();
            return;
        }

        var arrowColor = link.arrowColor || "#19CE88";
        var radius = 15;
        var cvsBall;
        if (window.ballsMap[arrowColor] != null) {
            cvsBall = window.ballsMap[arrowColor];
        } else {
            cvsBall = document.createElement('canvas');
            var ctxBall = cvsBall.getContext('2d');
            cvsBall.width = 100;
            cvsBall.height = 100;
            ctxBall.beginPath();
            ctxBall.arc(50, 50, 15, 0, Math.PI * 2);
            ctxBall.fillStyle = arrowColor;
            ctxBall.fill();
            window.ballsMap[arrowColor] = cvsBall;
        }

        if("REVERSE" == link.flowing){
            link.len -= 2;
            (link.len <= 4) && (link.len = link.path.getTotalLength());
            (link.path.getTotalLength() - link.len <= 4 ) && (link.len = link.path.getTotalLength() - 4);
        } else {
            link.len += 2;
            (link.len >= link.path.getTotalLength()) && (link.len = 4);
            (link.path.getTotalLength() - link.len <= 4 ) && (link.len = 4);
        }
        var current = link.path.getPointAtLength(link.len);
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.drawImage(cvsBall, current.x - radius / 2, current.y - radius / 2, radius, radius);
        ctx.restore();
    }

    function getConnectorOffset(connetcor) {
        var offsetSetting = {
            "2": 15,
            "3": 15
        };
        var offset = 0;
        if (connetcor.substr(1, 1) == "1" && connetcor.substr(2, 1) == "1") {
            return {x: 0, y: 0}
        } else if (parseInt(connetcor.substr(1, 1)) % 2 == 0) {
            offset = (parseInt(connetcor.substr(2, 1)) - (parseInt(connetcor.substr(1, 1))) / 2 - 0.5) * offsetSetting[connetcor.substr(1, 1)];
        } else {
            offset = (parseInt(connetcor.substr(2, 1)) - (parseInt(connetcor.substr(1, 1)) + 1) / 2) * offsetSetting[connetcor.substr(1, 1)];
        }

        if (connetcor.substr(0, 1) == "T" || connetcor.substr(0, 1) == "B") {
            return {x: offset, y: 0}
        } else {
            return {x: 0, y: offset}
        }
    }

    function getConnectorPoint(node, connetcor) {
        var xPadding = 7;
        var yPadding = 7;
        var x = node.x + (node.width - node.iconWidth) / 2;
        var y = node.y + (node.height - node.iconHeight) / 2;

        switch (connetcor.substr(0, 1)) {
            case "T":
                x = x + node.iconWidth / 2;
                y = y - yPadding;
                break;
            case "B":
                x = x + node.iconWidth / 2;
                y = y + node.iconHeight;
                y = y + yPadding;
                break;
            case "R":
                x = x + node.iconWidth;
                y = y + node.iconHeight / 2;
                x = x + xPadding;
                break;
            case "L":
                y = y + node.iconHeight / 2;
                x = x - xPadding;
                break;
        }
        var offset = getConnectorOffset(connetcor);
        return {x: x + offset.x, y: y + offset.y};
    }

    function transDescription(description) {
        description = $.extend(true, {
            label: "",
            labelFontSize: "14px",
            value: "",
            valueFontSize: "14px",
            offset: {x: 0, y: 0}
        }, description);
        if ($.trim(description.label) != "") {
            if (description.label.indexOf("Msg") != -1) {
                description.label = eval("window." + description.label);//国际化
            }
        }
        if ($.trim(description.value) != "" && description.value.split("#").length == 2) {
            var temp = parseFloat(description.value.split("#")[0]);
            var negative = temp < 0;
            var display = convert(Math.abs(temp), main.Lang + '_' + main.region).from(description.value.split("#")[1]).toBest();
            description.value = " " +(negative == true ? "-":"")+ parseFloat(display.val).toFixed(2) + " " + display.unit;
        }
        return description;
    }

    function needReCreate(curConfig, preConfig){

        if((curConfig != null && preConfig == null)
            ||(curConfig == null && preConfig != null)){
            return true;
        }
        if(curConfig == null && preConfig == null){
            return false;
        }
        if(curConfig.nodes.length != preConfig.nodes.length){
            return true;
        }
        if(curConfig.links.length != preConfig.links.length){
            return true;
        }

        for(var i = 0 ; i<curConfig.nodes.length; i++){
            if(parseInt(curConfig.nodes[i].id) != parseInt(preConfig.nodes[i].id)){
                return true
            }
        }
        for(var i = 0 ; i<curConfig.links.length; i++){
            if(parseInt(curConfig.links[i].id) != parseInt(preConfig.links[i].id)){
                return true
            }
        }
        return false;
    }


    $.fn.EnergyFlow = function () {
        return new EnergyFlow($(this)[0]);
    };

    function EnergyFlow(canvas) {
        this.lineDashSupport = (!main.getBrowser().msie || parseFloat(main.getBrowser().version) >= 11);
        this.canvas = canvas;
        this.preConfig = null;
        this.curConfig = null;
        this.animationId = "";
        this.id = "EF#"+new Date().getTime();
        $(canvas).attr("EFID",this.id);
        this.init();
    }

    EnergyFlow.prototype = {
        bind: function(canvas){
            this.canvas = canvas;
            this.preConfig = null;
            this.curConfig = null;
            this.id = "EF#"+new Date().getTime();
            $(canvas).attr("EFID",this.id);
            this.init();
        },
        resize: function(canvas){
            var config = this.curConfig||this.preConfig;
            config.layout = {
                width: $(this.canvas).width(),
                height: $(this.canvas).height()
            };
            this.bind(canvas);
            this.render(config);
        },
        init: function () {
            if (!this.canvas.getContext) {
                window.G_vmlCanvasManager.initElement(this.canvas);
            }
            this.canvas.width = $(this.canvas).width();
            this.canvas.height = $(this.canvas).height();
            this.ctx = this.canvas.getContext("2d");
            var _this = this;
            cancelAnimationFrame(_this.animationId);
            var animate = function () {
                if (_this.curConfig != null) {
                    var createFlag = needReCreate(_this.curConfig, _this.preConfig);
                    var iconCreateFlag = {};
                    for (var i = 0; i < _this.curConfig.nodes.length; i++) {
                        iconCreateFlag[_this.curConfig.nodes[i].id] = createFlag;
                    }
                    if (createFlag) {
                        autoLayout(_this.canvas, _this.curConfig);
                        bindMouseEvent(_this.canvas, _this.ctx, _this.curConfig, _this.lineDashSupport);
                        _this.ctx.clearRect(0, 0, $(_this.canvas).width(), $(_this.canvas).height());
                    } else {
                        for (var i = 0; i < _this.curConfig.nodes.length; i++) {
                            iconCreateFlag[_this.curConfig.nodes[i].id] = (_this.curConfig.nodes[i].icon != _this.preConfig.nodes[i].icon);
                            $.extend(true, _this.curConfig.nodes[i], {
                                iconWidth: _this.preConfig.nodes[i].iconWidth,
                                iconHeight: _this.preConfig.nodes[i].iconHeight,
                                width: _this.preConfig.nodes[i].width,
                                height: _this.preConfig.nodes[i].height,
                                x: _this.preConfig.nodes[i].x,
                                y: _this.preConfig.nodes[i].y,
                                step: _this.preConfig.nodes[i].step,
                                render: _this.preConfig.nodes[i].render,
                                description: transDescription(_this.curConfig.nodes[i].description),
                                preDescription: _this.preConfig.nodes[i].description
                            });
                        }

                        for (var i = 0; i < _this.curConfig.links.length; i++) {
                            $.extend(true, _this.curConfig.links[i], {
                                routings: _this.preConfig.links[i].routings,
                                points: _this.preConfig.links[i].points,
                                path: _this.preConfig.links[i].path,
                                len: _this.preConfig.links[i].len,
                                description: transDescription(_this.curConfig.links[i].description),
                                preDescription: _this.preConfig.links[i].description
                            })
                        }
                    }
                    $.each(_this.curConfig.nodes, function (idx, node) {
                        drawNode(_this.ctx, node, iconCreateFlag[node.id] || _this.preConfig == null, _this.lineDashSupport);
                    });
                    $.each(_this.curConfig.links, function (idx, link) {
                        drawLink(_this.ctx, link, _this.lineDashSupport, false);
                    });
                    $.each(_this.curConfig.links, function (idx, link) {
                        drawArrow(_this.ctx, link);
                    });
                    _this.preConfig = _this.curConfig;
                } else if(_this.preConfig != null){
                    $.each(_this.preConfig.nodes, function (idx, node) {
                        if(node.render){
                            node.render(_this.ctx, node);
                        }
                    });
                    $.each(_this.preConfig.links, function (idx, link) {
                        drawLink(_this.ctx, link, _this.lineDashSupport, true);
                    });
                    $.each(_this.preConfig.links, function (idx, link) {
                        drawArrow(_this.ctx, link);
                    });
                }
                _this.curConfig = null;
                _this.animationId = requestAnimationFrame(animate);
            };
            animate();
        },
        render: function (config) {
            this.curConfig = config;
            if (!this.curConfig.layout) {
                this.curConfig.layout = {};
            }
            this.curConfig.layout = {
                width: this.curConfig.layout.width || $(this.canvas).width(),
                height: this.curConfig.layout.height || $(this.canvas).height()
            };
        }
    };
    return EnergyFlow;
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL2VuZXJneUZsb3cvZW5lcmd5Rmxvdy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcclxuICAgIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcclxuICAgICAgICBkZWZpbmUoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFjdG9yeShyb290KTtcclxuICAgICAgICB9KTtcclxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByb290LmVuZXJneUZsb3cgPSBmYWN0b3J5KHJvb3QpO1xyXG4gICAgfVxyXG59KSh0aGlzLCBmdW5jdGlvbiAocm9vdCkge1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cud2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5tb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWU7XHJcbiAgICAgICAgaWYgKCF3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKSB7XHJcbiAgICAgICAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgIHZhciBpZCA9IHdpbmRvdy5zZXRUaW1lb3V0KGNhbGxiYWNrLCAxMDAwIC8gNjApO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlkO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIXdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSkge1xyXG4gICAgICAgICAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbiAoaWQpIHtcclxuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChpZCk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG4gICAgfSgpKTtcclxuXHJcbiAgICB3aW5kb3cuYmFsbHNNYXAgPSB7fTtcclxuICAgIHdpbmRvdy5pY29uc01hcCA9IHt9O1xyXG4gICAgd2luZG93LmFuaW1hdGlvbiA9IG51bGw7XHJcblxyXG4gICAgZnVuY3Rpb24gYXV0b0xheW91dChjYW52YXMsIGNvbmZpZykge1xyXG4gICAgICAgIHZhciByb3dDb3VudHMgPSAxO1xyXG4gICAgICAgIHZhciBjb2xDb3VudHMgPSAxO1xyXG4gICAgICAgICQuZWFjaChjb25maWcubm9kZXMsIGZ1bmN0aW9uIChpZHgsIG5vZGUpIHtcclxuICAgICAgICAgICAgcm93Q291bnRzID0gKG5vZGUucm93ID49IHJvd0NvdW50cykgPyBub2RlLnJvdyA6IHJvd0NvdW50cztcclxuICAgICAgICAgICAgY29sQ291bnRzID0gKG5vZGUuY29sID49IGNvbENvdW50cykgPyBub2RlLmNvbCA6IGNvbENvdW50cztcclxuICAgICAgICB9KTtcclxuICAgICAgICB2YXIgcm93SGVpZ2h0ID0gKGNvbmZpZy5sYXlvdXQuaGVpZ2h0IC0gNSkgLyByb3dDb3VudHM7XHJcbiAgICAgICAgdmFyIGNvbFdpZHRoID0gY29uZmlnLmxheW91dC53aWR0aCAvIGNvbENvdW50cztcclxuXHJcbiAgICAgICAgJC5lYWNoKGNvbmZpZy5ub2RlcywgZnVuY3Rpb24gKGlkeCwgbm9kZSkge1xyXG4gICAgICAgICAgICB2YXIgeCA9IChub2RlLmNvbCAtIDEpICogY29sV2lkdGg7XHJcbiAgICAgICAgICAgIHZhciB5ID0gKG5vZGUucm93IC0gMSkgKiByb3dIZWlnaHQ7XHJcbiAgICAgICAgICAgICQuZXh0ZW5kKG5vZGUsIHtcclxuICAgICAgICAgICAgICAgIHg6IHgsXHJcbiAgICAgICAgICAgICAgICB5OiB5LFxyXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiByb3dIZWlnaHQsXHJcbiAgICAgICAgICAgICAgICB3aWR0aDogY29sV2lkdGgsXHJcbiAgICAgICAgICAgICAgICBpY29uSGVpZ2h0OiBub2RlLmljb25IZWlnaHQgfHwgcm93SGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgaWNvbldpZHRoOiBub2RlLmljb25XaWR0aCB8fCBjb2xXaWR0aCxcclxuICAgICAgICAgICAgICAgIGZvY3VzZWQ6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IHRyYW5zRGVzY3JpcHRpb24obm9kZS5kZXNjcmlwdGlvbilcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG5cclxuICAgICAgICAkLmVhY2goY29uZmlnLmxpbmtzLCBmdW5jdGlvbiAoaSwgbGluaykge1xyXG4gICAgICAgICAgICAkLmV4dGVuZChsaW5rLCB7XHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogdHJhbnNEZXNjcmlwdGlvbihsaW5rLmRlc2NyaXB0aW9uKVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHZhciByb3V0aW5ncyA9IFtdO1xyXG4gICAgICAgICAgICB2YXIgZnJvbU5vZGUgPSAkLmdyZXAoY29uZmlnLm5vZGVzLCBmdW5jdGlvbiAobm9kZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vZGUuaWQgPT0gbGluay5mcm9tTm9kZTtcclxuICAgICAgICAgICAgfSlbMF07XHJcbiAgICAgICAgICAgIHZhciB0b05vZGUgPSAkLmdyZXAoY29uZmlnLm5vZGVzLCBmdW5jdGlvbiAobm9kZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vZGUuaWQgPT0gbGluay50b05vZGU7XHJcbiAgICAgICAgICAgIH0pWzBdO1xyXG4gICAgICAgICAgICB2YXIgc1BvaW50ID0gZ2V0Q29ubmVjdG9yUG9pbnQoZnJvbU5vZGUsIGxpbmsuZnJvbUNvbm5lY3Rvcik7XHJcbiAgICAgICAgICAgIHZhciBlUG9pbnQgPSBnZXRDb25uZWN0b3JQb2ludCh0b05vZGUsIGxpbmsudG9Db25uZWN0b3IpO1xyXG4gICAgICAgICAgICByb3V0aW5ncy5wdXNoKHNQb2ludCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoZnJvbU5vZGUucm93ICE9IHRvTm9kZS5yb3cpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjZWxXaWR0aCA9IGZyb21Ob2RlLndpZHRoO1xyXG4gICAgICAgICAgICAgICAgaWYgKGxpbmsuZnJvbUNvbm5lY3Rvci5zdWJzdHIoMCwgMSkgPT0gXCJSXCIgJiYgbGluay50b0Nvbm5lY3Rvci5zdWJzdHIoMCwgMSkgPT0gXCJMXCIgJiYgdHJ1ZSA9PSBsaW5rLm1lcmdlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcm91dGluZ3MucHVzaCh7eDogZVBvaW50LnggLSBjZWxXaWR0aCAvIDE1LCB5OiBzUG9pbnQueX0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHJvdXRpbmdzLnB1c2goe3g6IGVQb2ludC54IC0gY2VsV2lkdGggLyAxNSwgeTogc1BvaW50LnkgKyAoZVBvaW50LnkgLSBzUG9pbnQueSl9KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobGluay5mcm9tQ29ubmVjdG9yLnN1YnN0cigwLCAxKSA9PSBcIkxcIiB8fCBsaW5rLmZyb21Db25uZWN0b3Iuc3Vic3RyKDAsIDEpID09IFwiUlwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcm91dGluZ3MucHVzaCh7eDogZVBvaW50LngsIHk6IHNQb2ludC55fSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGxpbmsuZnJvbUNvbm5lY3Rvci5zdWJzdHIoMCwgMSkgPT0gXCJCXCIgfHwgbGluay5mcm9tQ29ubmVjdG9yLnN1YnN0cigwLCAxKSA9PSBcIkxcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIGVQb2ludC55ID0gZVBvaW50LnkgLSAyMDtcclxuICAgICAgICAgICAgICAgICAgICByb3V0aW5ncy5wdXNoKHt4OiBzUG9pbnQueCwgeTogZVBvaW50Lnl9KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobGluay5mcm9tQ29ubmVjdG9yLnN1YnN0cigwLCAxKSA9PSBcIlRcIiB8fCBsaW5rLmZyb21Db25uZWN0b3Iuc3Vic3RyKDAsIDEpID09IFwiTFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZVBvaW50LnkgPSBlUG9pbnQueSArIDM7XHJcbiAgICAgICAgICAgICAgICAgICAgcm91dGluZ3MucHVzaCh7eDogc1BvaW50LngsIHk6IGVQb2ludC55fSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcm91dGluZ3MucHVzaChlUG9pbnQpO1xyXG5cclxuICAgICAgICAgICAgdmFyIHBhdGggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywgJ3BhdGgnKTtcclxuICAgICAgICAgICAgdmFyIHBhdGhSb3V0aW5nID0gXCJcIjtcclxuICAgICAgICAgICAgdmFyIG5ld1BvaW50cyA9IFtdO1xyXG4gICAgICAgICAgICB2YXIgciA9IDU7XHJcblxyXG4gICAgICAgICAgICAvL+iwg+aVtOS4uuWchuinklxyXG4gICAgICAgICAgICAkLmVhY2gocm91dGluZ3MsIGZ1bmN0aW9uIChpLCBwKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaSA9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcC50eXBlID0gXCJNXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgbmV3UG9pbnRzLnB1c2gocCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcGF0aFJvdXRpbmcgKz0gXCIgTSBcIiArIHAueCArIFwiIFwiICsgcC55ICsgXCIgXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoaSA9PSByb3V0aW5ncy5sZW5ndGggLSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcC50eXBlID0gXCJMXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgbmV3UG9pbnRzLnB1c2gocCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcGF0aFJvdXRpbmcgKz0gXCIgTCBcIiArIHAueCArIFwiIFwiICsgcC55ICsgXCIgXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvL+WeguebtOi9rOawtOW5s1xyXG4gICAgICAgICAgICAgICAgaWYgKHJvdXRpbmdzW2kgLSAxXS54ID09IHAueCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBkaXJlY3Rpb24gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHg6IHJvdXRpbmdzW2kgKyAxXS54IC0gcm91dGluZ3NbaSAtIDFdLngsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHk6IHJvdXRpbmdzW2kgKyAxXS55IC0gcm91dGluZ3NbaSAtIDFdLnlcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwMSA9IHt4OiBwLngsIHk6IGRpcmVjdGlvbi55ID49IDAgPyAocC55IC0gcikgOiAocC55ICsgciksIHR5cGU6IFwiTFwifVxyXG4gICAgICAgICAgICAgICAgICAgIHAudHlwZSA9IFwiUVwiO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwMiA9IHt4OiBkaXJlY3Rpb24ueCA+PSAwID8gKHAueCArIHIpIDogKHAueCAtIHIpLCB5OiBwLnksIHR5cGU6IFwiXCJ9XHJcbiAgICAgICAgICAgICAgICAgICAgbmV3UG9pbnRzLnB1c2gocDEsIHAsIHAyKTtcclxuICAgICAgICAgICAgICAgICAgICBwYXRoUm91dGluZyArPSBcIiBMIFwiICsgcDEueCArIFwiIFwiICsgcDEueSArIFwiIFwiO1xyXG4gICAgICAgICAgICAgICAgICAgIHBhdGhSb3V0aW5nICs9IFwiIFEgXCIgKyBwLnggKyBcIiBcIiArIHAueSArIFwiIFwiICsgcDIueCArIFwiIFwiICsgcDIueSArIFwiIFwiO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8v5rC05bmz6L2s5Z6C55u0XHJcbiAgICAgICAgICAgICAgICBpZiAocm91dGluZ3NbaSAtIDFdLnkgPT0gcC55KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRpcmVjdGlvbiA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgeDogcm91dGluZ3NbaSArIDFdLnggLSByb3V0aW5nc1tpIC0gMV0ueCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgeTogcm91dGluZ3NbaSArIDFdLnkgLSByb3V0aW5nc1tpIC0gMV0ueVxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHAxID0ge3g6IGRpcmVjdGlvbi54ID49IDAgPyAocC54IC0gcikgOiAocC54ICsgciksIHk6IHAueSwgdHlwZTogXCJMXCJ9XHJcbiAgICAgICAgICAgICAgICAgICAgcC50eXBlID0gXCJRXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHAyID0ge3g6IHAueCwgeTogKGRpcmVjdGlvbi55ID49IDAgPyAocC55ICsgcikgOiAocC55IC0gcikpLCB0eXBlOiBcIlwifVxyXG4gICAgICAgICAgICAgICAgICAgIG5ld1BvaW50cy5wdXNoKHAxLCBwLCBwMik7XHJcbiAgICAgICAgICAgICAgICAgICAgcGF0aFJvdXRpbmcgKz0gXCIgTCBcIiArIHAxLnggKyBcIiBcIiArIHAxLnkgKyBcIiBcIjtcclxuICAgICAgICAgICAgICAgICAgICBwYXRoUm91dGluZyArPSBcIiBRIFwiICsgcC54ICsgXCIgXCIgKyBwLnkgKyBcIiBcIiArIHAyLnggKyBcIiBcIiArIHAyLnkgKyBcIiBcIjtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHBhdGguc2V0QXR0cmlidXRlKCdkJywgcGF0aFJvdXRpbmcpO1xyXG4gICAgICAgICAgICAkLmV4dGVuZChsaW5rLCB7XHJcbiAgICAgICAgICAgICAgICByb3V0aW5nczogcm91dGluZ3MsXHJcbiAgICAgICAgICAgICAgICBwb2ludHM6IG5ld1BvaW50cyxcclxuICAgICAgICAgICAgICAgIHBhdGg6IHBhdGgsXHJcbiAgICAgICAgICAgICAgICBsZW46IDBcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gYmluZE1vdXNlRXZlbnQoY2FudmFzLCBjdHgsIGNvbmZpZywgbGluZURhc2hTdXBwb3J0KSB7XHJcbiAgICAgICAgJChjYW52YXMpLnVuYmluZChcIm1vdXNlbW92ZVwiKS5tb3VzZW1vdmUoZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgJChjYW52YXMpLnBhcmVudChcImRpdlwiKS5hdHRyKFwidGl0bGVcIiwgXCJcIik7XHJcbiAgICAgICAgICAgIHZhciB4ID0gZS5vZmZzZXRYIHx8IGUuY2xpZW50WCAtICQoY2FudmFzKS5vZmZzZXQoKS5sZWZ0LFxyXG4gICAgICAgICAgICAgICAgeSA9IGUub2Zmc2V0WSB8fCBlLmNsaWVudFkgLSAkKGNhbnZhcykub2Zmc2V0KCkudG9wO1xyXG4gICAgICAgICAgICAkLmVhY2goY29uZmlnLmxpbmtzLCBmdW5jdGlvbiAoaWQsIGxpbmspIHtcclxuICAgICAgICAgICAgICAgIGlmIChsaW5rLnRvb2x0aXApIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobGluay50b29sdGlwLnNQb2ludC54IDw9IHggJiYgeCA8PSBsaW5rLnRvb2x0aXAuZVBvaW50LnhcclxuICAgICAgICAgICAgICAgICAgICAgICAgJiYgbGluay50b29sdGlwLnNQb2ludC55IDw9IHkgJiYgeSA8PSBsaW5rLnRvb2x0aXAuZVBvaW50LnkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJChjYW52YXMpLnBhcmVudChcImRpdlwiKS5hdHRyKFwidGl0bGVcIiwgbGluay50b29sdGlwLnRpcCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgJC5lYWNoKGNvbmZpZy5ub2RlcywgZnVuY3Rpb24gKGlkLCBub2RlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAobm9kZS50b29sdGlwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGUudG9vbHRpcC5zUG9pbnQueCA8PSB4ICYmIHggPD0gbm9kZS50b29sdGlwLmVQb2ludC54XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICYmIG5vZGUudG9vbHRpcC5zUG9pbnQueSA8PSB5ICYmIHkgPD0gbm9kZS50b29sdGlwLmVQb2ludC55KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQoY2FudmFzKS5wYXJlbnQoXCJkaXZcIikuYXR0cihcInRpdGxlXCIsIG5vZGUudG9vbHRpcC50aXApO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG5cclxuICAgICAgICAgICAgJC5lYWNoKGNvbmZpZy5ub2RlcywgZnVuY3Rpb24gKGlkLCBub2RlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIW5vZGUuY2xpY2spLy/ml6Dngrnlh7vkuovku7Ys5LiN5YGa6byg5qCH5oKs5YGc5LqL5Lu2XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFub2RlLmlzSG92ZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaXNJblJhbmdlKGNhbnZhcywgZSwgbm9kZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5pc0hvdmVyID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJChjYW52YXMpLmNzcyhcImN1cnNvclwiLCBcInBvaW50ZXJcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5pc0hvdmVyID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzSW5SYW5nZShjYW52YXMsIGUsIG5vZGUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuaXNIb3ZlciA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKGNhbnZhcykuY3NzKFwiY3Vyc29yXCIsIFwiZGVmYXVsdFwiKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLmlzSG92ZXIgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgJChjYW52YXMpLnVuYmluZChcImNsaWNrXCIpLmNsaWNrKGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgICQuZWFjaChjb25maWcubm9kZXMsIGZ1bmN0aW9uIChpZCwgbm9kZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGlzSW5SYW5nZShjYW52YXMsIGUsIG5vZGUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGUuY2xpY2sgJiYgdHlwZW9mKG5vZGUuY2xpY2spID09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkLmVhY2goY29uZmlnLm5vZGVzLCBmdW5jdGlvbiAoaSwgdikgey8v5riF56m66YCJ5oup54q25oCBXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2LnN0YXR1cyA9IFwiXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkcmF3Qm9yZGVyKGN0eCwgdiwgbGluZURhc2hTdXBwb3J0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuc3RhdHVzID0gXCJzZWxlY3RlZFwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkcmF3Qm9yZGVyKGN0eCwgbm9kZSwgbGluZURhc2hTdXBwb3J0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5jbGljayhub2RlLmN1c3RvbUF0dHIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gaXNJblJhbmdlKGNhbnZhcywgZSwgbm9kZSkge1xyXG4gICAgICAgIHZhciB4ID0gZS5vZmZzZXRYIHx8IGUuY2xpZW50WCAtICQoY2FudmFzKS5vZmZzZXQoKS5sZWZ0LFxyXG4gICAgICAgICAgICB5ID0gZS5vZmZzZXRZIHx8IGUuY2xpZW50WSAtICQoY2FudmFzKS5vZmZzZXQoKS50b3A7XHJcbiAgICAgICAgaWYgKHggPj0gbm9kZS54ICYmIHggPD0gbm9kZS54ICsgbm9kZS53aWR0aFxyXG4gICAgICAgICAgICAmJiB5ID49IG5vZGUueSAmJiB5IDw9IG5vZGUueSArIG5vZGUuaGVpZ2h0KSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbWVhc3VyZVRleHQoY3R4LCBub2RlLCBsYWJlbCwgdmFsdWUpIHtcclxuICAgICAgICBjdHguZm9udCA9IFwibm9ybWFsIG5vcm1hbCBcIiArIChub2RlLmRlc2NyaXB0aW9uLmxhYmVsRm9udFNpemUgfHwgXCIxNHB4XCIpICsgXCIgTWljcm9zb2Z0IFlhaGVpXCI7XHJcbiAgICAgICAgdmFyIGxhYmVsV2lkdGggPSBjdHgubWVhc3VyZVRleHQoJC50cmltKGxhYmVsKSAhPSBcIlwiID8gKGxhYmVsICsgXCIuLi5cIikgOiBub2RlLmRlc2NyaXB0aW9uLmxhYmVsKS53aWR0aDtcclxuICAgICAgICBjdHguZm9udCA9IFwibm9ybWFsIG5vcm1hbCBcIiArIChub2RlLmRlc2NyaXB0aW9uLnZhbHVlRm9udFNpemUgfHwgXCIxNHB4XCIpICsgXCIgTWljcm9zb2Z0IFlhaGVpXCI7XHJcbiAgICAgICAgdmFyIHZhbHVlV2lkdGggPSBjdHgubWVhc3VyZVRleHQodmFsdWUgfHwgbm9kZS5kZXNjcmlwdGlvbi52YWx1ZSkud2lkdGg7XHJcbiAgICAgICAgcmV0dXJuIHtsYWJlbFdpZHRoOiBsYWJlbFdpZHRoLCB2YWx1ZVdpZHRoOiB2YWx1ZVdpZHRoLCB3aWR0aDogbGFiZWxXaWR0aCArIHZhbHVlV2lkdGh9O1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGFkanVzdE5vZGVUZXh0KGN0eCwgbm9kZSwgbGFiZWwsIHZhbHVlKSB7XHJcbiAgICAgICAgdmFyIG1lYXN1cmUgPSBtZWFzdXJlVGV4dChjdHgsIG5vZGUsIGxhYmVsLCB2YWx1ZSk7XHJcbiAgICAgICAgdmFyIFkgPSBub2RlLnkgKyAobm9kZS5oZWlnaHQgLSBub2RlLmljb25IZWlnaHQpIC8gMiArIG5vZGUuaWNvbkhlaWdodCArIDE4ICsgbm9kZS5kZXNjcmlwdGlvbi5vZmZzZXQueTtcclxuICAgICAgICB2YXIgbGFiZWxYID0gbm9kZS54ICsgbm9kZS53aWR0aCAvIDIgLSBtZWFzdXJlLndpZHRoIC8gMiArIG1lYXN1cmUubGFiZWxXaWR0aCAvIDIgKyBub2RlLmRlc2NyaXB0aW9uLm9mZnNldC54O1xyXG4gICAgICAgIHZhciB2YWx1ZVggPSBsYWJlbFggKyBtZWFzdXJlLndpZHRoIC8gMjtcclxuICAgICAgICBpZiAoKChsYWJlbFggLSBtZWFzdXJlLmxhYmVsV2lkdGggLyAyKSA8IDAgfHwgbWVhc3VyZS53aWR0aCA+IDEuNSAqIG5vZGUud2lkdGgpICYmIChsYWJlbCB8fCBub2RlLmRlc2NyaXB0aW9uLmxhYmVsKS5sZW5ndGggPiAyKSB7XHJcbiAgICAgICAgICAgIHZhciBsYWJlbCA9IGxhYmVsIHx8IG5vZGUuZGVzY3JpcHRpb24ubGFiZWw7XHJcbiAgICAgICAgICAgIGxhYmVsID0gbGFiZWwuc3Vic3RyaW5nKGxhYmVsLCBsYWJlbC5sZW5ndGggLSAxKTtcclxuICAgICAgICAgICAgcmV0dXJuIGFkanVzdE5vZGVUZXh0KGN0eCwgbm9kZSwgbGFiZWwsIG5vZGUuZGVzY3JpcHRpb24udmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBub2RlLnRvb2x0aXAgPSB7XHJcbiAgICAgICAgICAgIHNQb2ludDoge3g6IGxhYmVsWCAtIG1lYXN1cmUubGFiZWxXaWR0aCAvIDIsIHk6IFkgLSAyMH0sXHJcbiAgICAgICAgICAgIGVQb2ludDoge3g6IGxhYmVsWCArIG1lYXN1cmUubGFiZWxXaWR0aCAvIDIsIHk6IFkgLSAyfSxcclxuICAgICAgICAgICAgdGlwOiBub2RlLmRlc2NyaXB0aW9uLmxhYmVsXHJcbiAgICAgICAgfTtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBsYWJlbDoge1xyXG4gICAgICAgICAgICAgICAgeDogbGFiZWxYLFxyXG4gICAgICAgICAgICAgICAgeTogWSxcclxuICAgICAgICAgICAgICAgIHRleHQ6ICQudHJpbShsYWJlbCkgIT0gXCJcIiA/IGxhYmVsICsgXCIuLi5cIiA6IG5vZGUuZGVzY3JpcHRpb24ubGFiZWwsXHJcbiAgICAgICAgICAgICAgICB3aWR0aDogbWVhc3VyZS5sYWJlbFdpZHRoXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHZhbHVlOiB7eDogdmFsdWVYLCB5OiBZLCB0ZXh0OiBub2RlLmRlc2NyaXB0aW9uLnZhbHVlLCB3aWR0aDogbWVhc3VyZS52YWx1ZVdpZHRofVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZHJhd05vZGUoY3R4LCBub2RlLCBjcmVhdGVJY29uLCBsaW5lRGFzaFN1cHBvcnQpIHtcclxuICAgICAgICBpZiAoY3JlYXRlSWNvbikge1xyXG4gICAgICAgICAgICBjdHguY2xlYXJSZWN0KG5vZGUueCwgbm9kZS55LCBub2RlLndpZHRoLCBub2RlLmhlaWdodCk7XHJcbiAgICAgICAgICAgIGlmICh3aW5kb3cuaWNvbnNNYXBbbm9kZS5pY29uXSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaW1nID0gbmV3IEltYWdlKCk7XHJcbiAgICAgICAgICAgICAgICBpbWcuc3JjID0gbm9kZS5pY29uO1xyXG4gICAgICAgICAgICAgICAgJChpbWcpLmxvYWQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5pY29uc01hcFtub2RlLmljb25dID0gaW1nO1xyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5kcmF3SW1hZ2UoaW1nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLnggKyAobm9kZS53aWR0aCAtIG5vZGUuaWNvbldpZHRoKSAvIDIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUueSArIChub2RlLmhlaWdodCAtIG5vZGUuaWNvbkhlaWdodCkgLyAyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLmljb25XaWR0aCwgbm9kZS5pY29uSGVpZ2h0KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY3R4LmRyYXdJbWFnZSh3aW5kb3cuaWNvbnNNYXBbbm9kZS5pY29uXSxcclxuICAgICAgICAgICAgICAgICAgICBub2RlLnggKyAobm9kZS53aWR0aCAtIG5vZGUuaWNvbldpZHRoKSAvIDIsXHJcbiAgICAgICAgICAgICAgICAgICAgbm9kZS55ICsgKG5vZGUuaGVpZ2h0IC0gbm9kZS5pY29uSGVpZ2h0KSAvIDIsXHJcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5pY29uV2lkdGgsIG5vZGUuaWNvbkhlaWdodCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChub2RlLnJlbmRlciAmJiB0eXBlb2Yobm9kZS5yZW5kZXIpID09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgICAgICBub2RlLnJlbmRlcihjdHgsIG5vZGUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAobm9kZS5wcmVEZXNjcmlwdGlvbikge1xyXG4gICAgICAgICAgICB2YXIgZGVzY3JpcHRpb24gPSBub2RlLmRlc2NyaXB0aW9uO1xyXG4gICAgICAgICAgICB2YXIgcGVyRGVzY3JpcHRpb24gPSBub2RlLnByZURlc2NyaXB0aW9uO1xyXG4gICAgICAgICAgICBub2RlLmRlc2NyaXB0aW9uID0gcGVyRGVzY3JpcHRpb247XHJcbiAgICAgICAgICAgIG5vZGUucGVyRGVzY3JpcHRpb24gPSBkZXNjcmlwdGlvbjtcclxuICAgICAgICAgICAgdmFyIGRpc3BsYXlUZXh0ID0gYWRqdXN0Tm9kZVRleHQoY3R4LCBub2RlKTtcclxuICAgICAgICAgICAgY3R4LmNsZWFyUmVjdChkaXNwbGF5VGV4dC5sYWJlbC54IC0gZGlzcGxheVRleHQubGFiZWwud2lkdGggLyAyIC0gNSwgZGlzcGxheVRleHQubGFiZWwueSAtIDEyLCBkaXNwbGF5VGV4dC5sYWJlbC53aWR0aCArIGRpc3BsYXlUZXh0LnZhbHVlLndpZHRoICsgMTAsIDE4KTtcclxuICAgICAgICAgICAgbm9kZS5kZXNjcmlwdGlvbiA9IGRlc2NyaXB0aW9uO1xyXG4gICAgICAgICAgICBub2RlLnBlckRlc2NyaXB0aW9uID0gcGVyRGVzY3JpcHRpb247XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGRyYXdCb3JkZXIoY3R4LCBub2RlLCBsaW5lRGFzaFN1cHBvcnQpO1xyXG5cclxuICAgICAgICB2YXIgZGlzcGxheVRleHQgPSBhZGp1c3ROb2RlVGV4dChjdHgsIG5vZGUpO1xyXG4gICAgICAgIC8v5aGr5YWF5paH5a2XXHJcbiAgICAgICAgY3R4Lmdsb2JhbEFscGhhID0gMTtcclxuICAgICAgICBjdHgudGV4dEFsaWduID0gXCJjZW50ZXJcIjtcclxuICAgICAgICBjdHguZm9udCA9IFwibm9ybWFsIG5vcm1hbCBcIiArIChub2RlLmRlc2NyaXB0aW9uLmxhYmVsRm9udFNpemUgfHwgXCIxNHB4XCIpICsgXCIgTWljcm9zb2Z0IFlhaGVpXCI7XHJcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9IChub2RlLmRlc2NyaXB0aW9uLmxhYmVsQ29sb3IgfHwgXCIjMzMzMzMzXCIpO1xyXG4gICAgICAgIGN0eC5maWxsVGV4dChkaXNwbGF5VGV4dC5sYWJlbC50ZXh0LCBkaXNwbGF5VGV4dC5sYWJlbC54LCBkaXNwbGF5VGV4dC5sYWJlbC55KTtcclxuICAgICAgICBjdHgudGV4dEFsaWduID0gXCJjZW50ZXJcIjtcclxuICAgICAgICBjdHguZm9udCA9IFwibm9ybWFsIG5vcm1hbCBcIiArIChub2RlLmRlc2NyaXB0aW9uLnZhbHVlRm9udFNpemUgfHwgXCIxNHB4XCIpICsgXCIgTWljcm9zb2Z0IFlhaGVpXCI7XHJcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9IChub2RlLmRlc2NyaXB0aW9uLnZhbHVlQ29sb3IgfHwgXCIjMTlDRTk2XCIpO1xyXG4gICAgICAgIGN0eC5maWxsVGV4dChkaXNwbGF5VGV4dC52YWx1ZS50ZXh0LCBkaXNwbGF5VGV4dC52YWx1ZS54LCBkaXNwbGF5VGV4dC52YWx1ZS55KTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZHJhd0JvcmRlcihjdHgsIG5vZGUsIGxpbmVEYXNoU3VwcG9ydCkge1xyXG4gICAgICAgIHZhciBib3JkZXJDb2xvciA9IFwiI0ZGRkZGRlwiO1xyXG4gICAgICAgIGlmIChub2RlLnN0YXR1cyA9PSBcInNlbGVjdGVkXCIpIHtcclxuICAgICAgICAgICAgYm9yZGVyQ29sb3IgPSBcIiNGRkE1MDBcIjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHBhZGRpbmcgPSA1O1xyXG4gICAgICAgIHZhciB4ID0gbm9kZS54ICsgKG5vZGUud2lkdGggLSBub2RlLmljb25XaWR0aCkgLyAyIC0gcGFkZGluZztcclxuICAgICAgICB2YXIgeSA9IG5vZGUueSArIChub2RlLmhlaWdodCAtIG5vZGUuaWNvbkhlaWdodCkgLyAyIC0gcGFkZGluZztcclxuICAgICAgICB2YXIgd2lkdGggPSBub2RlLmljb25XaWR0aCArIHBhZGRpbmcgKiAyO1xyXG4gICAgICAgIHZhciBoZWlnaHQgPSBub2RlLmljb25IZWlnaHQgKyBwYWRkaW5nICogMjtcclxuICAgICAgICB2YXIgcmFkaXVzID0gMTA7XHJcbiAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgIGN0eC5zdHJva2VTdHlsZSA9IGJvcmRlckNvbG9yO1xyXG4gICAgICAgIGN0eC5saW5lV2lkdGggPSBcIjNcIjtcclxuICAgICAgICBpZihsaW5lRGFzaFN1cHBvcnQpe1xyXG4gICAgICAgICAgICBjdHguc2V0TGluZURhc2goWzYsIDZdKTsvL+iuvue9ruiZmue6v1xyXG4gICAgICAgIH1cclxuICAgICAgICAvL+eUu+WchuinkuefqeW9olxyXG4gICAgICAgIGN0eC5hcmMoeCArIHJhZGl1cywgeSArIHJhZGl1cywgcmFkaXVzLCBNYXRoLlBJLCBNYXRoLlBJICogMyAvIDIpO1xyXG4gICAgICAgIGN0eC5saW5lVG8od2lkdGggLSByYWRpdXMgKyB4LCB5KTtcclxuICAgICAgICBjdHguYXJjKHdpZHRoIC0gcmFkaXVzICsgeCwgcmFkaXVzICsgeSwgcmFkaXVzLCBNYXRoLlBJICogMyAvIDIsIE1hdGguUEkgKiAyKTtcclxuICAgICAgICBjdHgubGluZVRvKHdpZHRoICsgeCwgaGVpZ2h0ICsgeSAtIHJhZGl1cyk7XHJcbiAgICAgICAgY3R4LmFyYyh3aWR0aCAtIHJhZGl1cyArIHgsIGhlaWdodCAtIHJhZGl1cyArIHksIHJhZGl1cywgMCwgTWF0aC5QSSAqIDEgLyAyKTtcclxuICAgICAgICBjdHgubGluZVRvKHJhZGl1cyArIHgsIGhlaWdodCArIHkpO1xyXG4gICAgICAgIGN0eC5hcmMocmFkaXVzICsgeCwgaGVpZ2h0IC0gcmFkaXVzICsgeSwgcmFkaXVzLCBNYXRoLlBJICogMSAvIDIsIE1hdGguUEkpO1xyXG4gICAgICAgIGN0eC5jbG9zZVBhdGgoKTtcclxuICAgICAgICBjdHguc2F2ZSgpO1xyXG4gICAgICAgIGN0eC5zdHJva2UoKTtcclxuICAgICAgICBpZihsaW5lRGFzaFN1cHBvcnQpe1xyXG4gICAgICAgICAgICBjdHguc2V0TGluZURhc2goW10pOy8v5riF56m66Jma57q/6K6+572uXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGdldFRleHRQb3NpdGlvbihjdHgsIGxpbmspIHtcclxuICAgICAgICB2YXIgcElkeCA9IC0xLCBtYXhfbGVuID0gMDtcclxuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGxpbmsucG9pbnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIC8v5Y+q5Y+W5qiq5ZCR57q/5q61XHJcbiAgICAgICAgICAgIGlmIChNYXRoLmFicyhsaW5rLnBvaW50c1tpXS55IC0gbGluay5wb2ludHNbaSAtIDFdLnkpICE9IDApIHtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciB0bXBfbGVuID0gTWF0aC5zcXJ0KE1hdGgucG93KE1hdGguYWJzKGxpbmsucG9pbnRzW2ldLnggLSBsaW5rLnBvaW50c1tpIC0gMV0ueCksIDIpICsgTWF0aC5wb3coTWF0aC5hYnMobGluay5wb2ludHNbaV0ueSAtIGxpbmsucG9pbnRzW2kgLSAxXS55KSwgMikpO1xyXG4gICAgICAgICAgICBpZiAodG1wX2xlbiA+IG1heF9sZW4pIHtcclxuICAgICAgICAgICAgICAgIG1heF9sZW4gPSB0bXBfbGVuO1xyXG4gICAgICAgICAgICAgICAgcElkeCA9IGk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHt3aWR0aDogbWF4X2xlbiwgc1BvaW50OiBsaW5rLnBvaW50c1twSWR4IC0gMV0sIGVQb2ludDogbGluay5wb2ludHNbcElkeF19O1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGFkanVzdExpbmtUZXh0KGN0eCwgbGluaywgbGFiZWwsIHZhbHVlKSB7XHJcbiAgICAgICAgdmFyIHRleHRQb3NpdGlvbiA9IGdldFRleHRQb3NpdGlvbihjdHgsIGxpbmspO1xyXG4gICAgICAgIHZhciBtZWFzdXJlID0gbWVhc3VyZVRleHQoY3R4LCBsaW5rLCBsYWJlbCwgdmFsdWUpO1xyXG4gICAgICAgIHZhciBZID0gdGV4dFBvc2l0aW9uLnNQb2ludC55IC0gOCArIGxpbmsuZGVzY3JpcHRpb24ub2Zmc2V0Lnk7XHJcbiAgICAgICAgdmFyIGxhYmVsWCA9IHRleHRQb3NpdGlvbi5zUG9pbnQueCArIHRleHRQb3NpdGlvbi53aWR0aCAvIDIgLSBtZWFzdXJlLndpZHRoIC8gMiArIG1lYXN1cmUubGFiZWxXaWR0aCAvIDIgKyBsaW5rLmRlc2NyaXB0aW9uLm9mZnNldC54O1xyXG4gICAgICAgIHZhciB2YWx1ZVggPSBsYWJlbFggKyBtZWFzdXJlLndpZHRoIC8gMjtcclxuICAgICAgICBpZiAoKChsYWJlbFggLSBtZWFzdXJlLmxhYmVsV2lkdGggLyAyKSA8IDAgfHwgbWVhc3VyZS53aWR0aCA+IHRleHRQb3NpdGlvbi53aWR0aCkgJiYgKGxhYmVsIHx8IGxpbmsuZGVzY3JpcHRpb24ubGFiZWwpLmxlbmd0aCA+IDIpIHtcclxuICAgICAgICAgICAgdmFyIGxhYmVsID0gbGFiZWwgfHwgbGluay5kZXNjcmlwdGlvbi5sYWJlbDtcclxuICAgICAgICAgICAgbGFiZWwgPSBsYWJlbC5zdWJzdHJpbmcobGFiZWwsIGxhYmVsLmxlbmd0aCAtIDEpO1xyXG4gICAgICAgICAgICByZXR1cm4gYWRqdXN0TGlua1RleHQoY3R4LCBsaW5rLCBsYWJlbCwgbGluay5kZXNjcmlwdGlvbi52YWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxpbmsudG9vbHRpcCA9IHtcclxuICAgICAgICAgICAgc1BvaW50OiB7eDogbGFiZWxYIC0gbWVhc3VyZS5sYWJlbFdpZHRoIC8gMiwgeTogWSAtIDIwfSxcclxuICAgICAgICAgICAgZVBvaW50OiB7eDogbGFiZWxYICsgbWVhc3VyZS5sYWJlbFdpZHRoIC8gMiwgeTogWSAtIDJ9LFxyXG4gICAgICAgICAgICB0aXA6IGxpbmsuZGVzY3JpcHRpb24ubGFiZWxcclxuICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGxhYmVsOiB7XHJcbiAgICAgICAgICAgICAgICB4OiBsYWJlbFgsXHJcbiAgICAgICAgICAgICAgICB5OiBZLFxyXG4gICAgICAgICAgICAgICAgdGV4dDogJC50cmltKGxhYmVsKSAhPSBcIlwiID8gbGFiZWwgKyBcIi4uLlwiIDogbGluay5kZXNjcmlwdGlvbi5sYWJlbCxcclxuICAgICAgICAgICAgICAgIHdpZHRoOiBtZWFzdXJlLmxhYmVsV2lkdGhcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdmFsdWU6IHt4OiB2YWx1ZVgsIHk6IFksIHRleHQ6IGxpbmsuZGVzY3JpcHRpb24udmFsdWUsIHdpZHRoOiBtZWFzdXJlLnZhbHVlV2lkdGh9XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBkcmF3TGlua1RleHQoY3R4LCBsaW5rKSB7XHJcbiAgICAgICAgaWYgKGxpbmsucHJlRGVzY3JpcHRpb24pIHtcclxuICAgICAgICAgICAgdmFyIHBhZGRpbmdXaWR0aCA9IDU7XHJcbiAgICAgICAgICAgIHZhciBkZXNjcmlwdGlvbiA9IGxpbmsuZGVzY3JpcHRpb247XHJcbiAgICAgICAgICAgIHZhciBwZXJEZXNjcmlwdGlvbiA9IGxpbmsucHJlRGVzY3JpcHRpb247XHJcbiAgICAgICAgICAgIGxpbmsuZGVzY3JpcHRpb24gPSBwZXJEZXNjcmlwdGlvbjtcclxuICAgICAgICAgICAgbGluay5wZXJEZXNjcmlwdGlvbiA9IGRlc2NyaXB0aW9uO1xyXG4gICAgICAgICAgICB2YXIgcG9zaXRpb24gPSBnZXRUZXh0UG9zaXRpb24oY3R4LCBsaW5rKTtcclxuICAgICAgICAgICAgaWYgKHBvc2l0aW9uLnNQb2ludC54ID4gcG9zaXRpb24uZVBvaW50LngpIHtcclxuICAgICAgICAgICAgICAgIHBhZGRpbmdXaWR0aCA9IC1wYWRkaW5nV2lkdGg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY3R4LmNsZWFyUmVjdChwb3NpdGlvbi5zUG9pbnQueCArIHBhZGRpbmdXaWR0aCwgcG9zaXRpb24uc1BvaW50LnkgLSAyMCArIGxpbmsuZGVzY3JpcHRpb24ub2Zmc2V0LnksIHBvc2l0aW9uLmVQb2ludC54IC0gcG9zaXRpb24uc1BvaW50LnggLSAyICogcGFkZGluZ1dpZHRoLCAxOCk7XHJcbiAgICAgICAgICAgIGxpbmsuZGVzY3JpcHRpb24gPSBkZXNjcmlwdGlvbjtcclxuICAgICAgICAgICAgbGluay5wZXJEZXNjcmlwdGlvbiA9IHBlckRlc2NyaXB0aW9uO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGxpbmsuZmxvd2luZyA9PSBcIldBUk5JTkdcIikge1xyXG4gICAgICAgICAgICB2YXIgcG9zaXRpb24gPSBnZXRUZXh0UG9zaXRpb24oY3R4LCBsaW5rKTtcclxuICAgICAgICAgICAgdmFyIGVycm9ySWNvbiA9IFwiaW1hZ2VzL21haW4vc2luZ2xlUGxhbnQvZW5lcmd5Rmxvdy9jb21tdW5pY2F0aW9uRmFpbHVyZS5wbmdcIjtcclxuICAgICAgICAgICAgaWYgKHdpbmRvdy5pY29uc01hcFtlcnJvckljb25dID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHZhciBpbWcgPSBuZXcgSW1hZ2UoKTtcclxuICAgICAgICAgICAgICAgIGltZy5zcmMgPSBlcnJvckljb247XHJcbiAgICAgICAgICAgICAgICAkKGltZykubG9hZChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgd2luZG93Lmljb25zTWFwW2Vycm9ySWNvbl0gPSBpbWc7XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmRyYXdJbWFnZShpbWcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIChwb3NpdGlvbi5zUG9pbnQueCArIHBvc2l0aW9uLmVQb2ludC54KSAvIDIgLSA1ICsgbGluay5kZXNjcmlwdGlvbi5vZmZzZXQueCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24uc1BvaW50LnkgLSAyMCArIGxpbmsuZGVzY3JpcHRpb24ub2Zmc2V0LnksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDE4LCAxOCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGN0eC5kcmF3SW1hZ2Uod2luZG93Lmljb25zTWFwW2Vycm9ySWNvbl0sXHJcbiAgICAgICAgICAgICAgICAgICAgKHBvc2l0aW9uLnNQb2ludC54ICsgcG9zaXRpb24uZVBvaW50LngpIC8gMiAtIDUgKyBsaW5rLmRlc2NyaXB0aW9uLm9mZnNldC54LFxyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uLnNQb2ludC55IC0gMjAgKyBsaW5rLmRlc2NyaXB0aW9uLm9mZnNldC55LFxyXG4gICAgICAgICAgICAgICAgICAgIDE4LCAxOCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgZGlzcGxheVRleHQgPSBhZGp1c3RMaW5rVGV4dChjdHgsIGxpbmspO1xyXG4gICAgICAgIC8v5aGr5YWF5paH5a2XXHJcbiAgICAgICAgY3R4Lmdsb2JhbEFscGhhID0gMTtcclxuICAgICAgICBjdHgudGV4dEFsaWduID0gXCJjZW50ZXJcIjtcclxuICAgICAgICBjdHguZm9udCA9IFwibm9ybWFsIG5vcm1hbCBcIiArIChsaW5rLmRlc2NyaXB0aW9uLmxhYmVsRm9udFNpemUgfHwgXCIxNHB4XCIpICsgXCIgTWljcm9zb2Z0IFlhaGVpXCI7XHJcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9IFwiIzMzMzMzM1wiO1xyXG4gICAgICAgIGN0eC5maWxsVGV4dChkaXNwbGF5VGV4dC5sYWJlbC50ZXh0LCBkaXNwbGF5VGV4dC5sYWJlbC54LCBkaXNwbGF5VGV4dC5sYWJlbC55KTtcclxuICAgICAgICBjdHgudGV4dEFsaWduID0gXCJjZW50ZXJcIjtcclxuICAgICAgICBjdHguZm9udCA9IFwibm9ybWFsIG5vcm1hbCBcIiArIChsaW5rLmRlc2NyaXB0aW9uLnZhbHVlRm9udFNpemUgfHwgXCIxNHB4XCIpICsgXCIgTWljcm9zb2Z0IFlhaGVpXCI7XHJcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9IChsaW5rLmFycm93Q29sb3IgfHwgXCIjMTlDRTk2XCIpO1xyXG4gICAgICAgIGN0eC5maWxsVGV4dChkaXNwbGF5VGV4dC52YWx1ZS50ZXh0LCBkaXNwbGF5VGV4dC52YWx1ZS54LCBkaXNwbGF5VGV4dC52YWx1ZS55KTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBkcmF3TGluZShjdHgsIGxpbmssIHdpZHRoLCBjb2xvciwgZGFzaCkge1xyXG4gICAgICAgIGN0eC5zYXZlKCk7XHJcbiAgICAgICAgaWYgKGRhc2gpIHtcclxuICAgICAgICAgICAgY3R4LnNldExpbmVEYXNoKGRhc2gpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjdHguYmVnaW5QYXRoKCk7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5rLnBvaW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAobGluay5wb2ludHNbaV0udHlwZSA9PSBcIk1cIikge1xyXG4gICAgICAgICAgICAgICAgY3R4Lm1vdmVUbyhsaW5rLnBvaW50c1tpXS54LCBsaW5rLnBvaW50c1tpXS55KTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChsaW5rLnBvaW50c1tpXS50eXBlID09IFwiTFwiKSB7XHJcbiAgICAgICAgICAgICAgICBjdHgubGluZVRvKGxpbmsucG9pbnRzW2ldLngsIGxpbmsucG9pbnRzW2ldLnkpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGxpbmsucG9pbnRzW2ldLnR5cGUgPT0gXCJRXCIpIHtcclxuICAgICAgICAgICAgICAgIGN0eC5xdWFkcmF0aWNDdXJ2ZVRvKGxpbmsucG9pbnRzW2ldLngsIGxpbmsucG9pbnRzW2ldLnksIGxpbmsucG9pbnRzW2kgKyAxXS54LCBsaW5rLnBvaW50c1tpICsgMV0ueSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgY3R4LmxpbmVXaWR0aCA9IHdpZHRoO1xyXG4gICAgICAgIGN0eC5zdHJva2VTdHlsZSA9IGNvbG9yO1xyXG4gICAgICAgIGN0eC5zdHJva2UoKTtcclxuICAgICAgICBjdHguY2xvc2VQYXRoKCk7XHJcbiAgICAgICAgY3R4LnJlc3RvcmUoKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBkcmF3TGluayhjdHgsIGxpbmssIGxpbmVEYXNoU3VwcG9ydCwgaWdub3JlVGV4dCkge1xyXG4gICAgICAgIHZhciBsaW5rQ29sb3IgPSBsaW5rLmxpbmtDb2xvciB8fCBcIiMxOUNFODhcIjtcclxuICAgICAgICBkcmF3TGluZShjdHgsIGxpbmssIDYsIFwiI0ZGRkZGRlwiKTtcclxuICAgICAgICBpZihsaW5rLmZsb3dpbmcgPT1cIldBUk5JTkdcIil7XHJcbiAgICAgICAgICAgIGRyYXdMaW5lKGN0eCwgbGluaywgMSwgbGlua0NvbG9yKTtcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgZHJhd0xpbmUoY3R4LCBsaW5rLCAyLCBsaW5rQ29sb3IsIGxpbmVEYXNoU3VwcG9ydCA/IFsyLCA0XTpudWxsKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCFpZ25vcmVUZXh0KSB7XHJcbiAgICAgICAgICAgIGRyYXdMaW5rVGV4dChjdHgsIGxpbmspO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBkcmF3QXJyb3coY3R4LCBsaW5rKSB7XHJcbiAgICAgICAgaWYgKGxpbmsuZmxvd2luZyA9PSBcIk5PTkVcIikge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChsaW5rLmZsb3dpbmcgPT0gXCJXQVJOSU5HXCIpIHtcclxuICAgICAgICAgICAgdmFyIHRoZXRhID0gMjU7XHJcbiAgICAgICAgICAgIHZhciBoZWFkbGVuID0gNjtcclxuICAgICAgICAgICAgdmFyIHdpZHRoID0gMTtcclxuICAgICAgICAgICAgdmFyIHNQb2ludCA9IGxpbmsucG9pbnRzW2xpbmsucG9pbnRzLmxlbmd0aCAtMl07XHJcbiAgICAgICAgICAgIHZhciBlUG9pbnQgPSBsaW5rLnBvaW50c1tsaW5rLnBvaW50cy5sZW5ndGggLTFdO1xyXG4gICAgICAgICAgICB2YXIgZnJvbVggPSBzUG9pbnQueDtcclxuICAgICAgICAgICAgdmFyIGZyb21ZID0gc1BvaW50Lnk7XHJcbiAgICAgICAgICAgIHZhciB0b1ggPSBlUG9pbnQueDtcclxuICAgICAgICAgICAgdmFyIHRvWSA9IGVQb2ludC55O1xyXG4gICAgICAgICAgICAvLyDorqHnrpflkITop5Lluqblkozlr7nlupTnmoRQMixQM+WdkOagh1xyXG4gICAgICAgICAgICB2YXIgYW5nbGUgPSBNYXRoLmF0YW4yKGZyb21ZIC0gdG9ZLCBmcm9tWCAtIHRvWCkgKiAxODAgLyBNYXRoLlBJLFxyXG4gICAgICAgICAgICAgICAgYW5nbGUxID0gKGFuZ2xlICsgdGhldGEpICogTWF0aC5QSSAvIDE4MCxcclxuICAgICAgICAgICAgICAgIGFuZ2xlMiA9IChhbmdsZSAtIHRoZXRhKSAqIE1hdGguUEkgLyAxODAsXHJcbiAgICAgICAgICAgICAgICB0b3BYID0gaGVhZGxlbiAqIE1hdGguY29zKGFuZ2xlMSksXHJcbiAgICAgICAgICAgICAgICB0b3BZID0gaGVhZGxlbiAqIE1hdGguc2luKGFuZ2xlMSksXHJcbiAgICAgICAgICAgICAgICBib3RYID0gaGVhZGxlbiAqIE1hdGguY29zKGFuZ2xlMiksXHJcbiAgICAgICAgICAgICAgICBib3RZID0gaGVhZGxlbiAqIE1hdGguc2luKGFuZ2xlMik7XHJcbiAgICAgICAgICAgIGN0eC5zYXZlKCk7XHJcbiAgICAgICAgICAgIGN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICAgICAgdmFyIGFycm93WCA9IGZyb21YIC0gdG9wWCxcclxuICAgICAgICAgICAgICAgIGFycm93WSA9IGZyb21ZIC0gdG9wWTtcclxuICAgICAgICAgICAgY3R4Lm1vdmVUbyhhcnJvd1gsIGFycm93WSk7XHJcbiAgICAgICAgICAgIGN0eC5tb3ZlVG8oZnJvbVgsIGZyb21ZKTtcclxuICAgICAgICAgICAgY3R4LmxpbmVUbyh0b1gsIHRvWSk7XHJcbiAgICAgICAgICAgIGFycm93WCA9IHRvWCArIHRvcFg7XHJcbiAgICAgICAgICAgIGFycm93WSA9IHRvWSArIHRvcFk7XHJcbiAgICAgICAgICAgIGN0eC5tb3ZlVG8oYXJyb3dYLCBhcnJvd1kpO1xyXG4gICAgICAgICAgICBjdHgubGluZVRvKHRvWCwgdG9ZKTtcclxuICAgICAgICAgICAgYXJyb3dYID0gdG9YICsgYm90WDtcclxuICAgICAgICAgICAgYXJyb3dZID0gdG9ZICsgYm90WTtcclxuICAgICAgICAgICAgY3R4LmxpbmVUbyhhcnJvd1gsIGFycm93WSk7XHJcbiAgICAgICAgICAgIGN0eC5zdHJva2VTdHlsZSA9IGxpbmsubGlua0NvbG9yIHx8IFwiIzE5Q0U4OFwiO1xyXG4gICAgICAgICAgICBjdHgubGluZVdpZHRoID0gd2lkdGg7XHJcbiAgICAgICAgICAgIGN0eC5zdHJva2UoKTtcclxuICAgICAgICAgICAgY3R4LnJlc3RvcmUoKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGFycm93Q29sb3IgPSBsaW5rLmFycm93Q29sb3IgfHwgXCIjMTlDRTg4XCI7XHJcbiAgICAgICAgdmFyIHJhZGl1cyA9IDE1O1xyXG4gICAgICAgIHZhciBjdnNCYWxsO1xyXG4gICAgICAgIGlmICh3aW5kb3cuYmFsbHNNYXBbYXJyb3dDb2xvcl0gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBjdnNCYWxsID0gd2luZG93LmJhbGxzTWFwW2Fycm93Q29sb3JdO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGN2c0JhbGwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcclxuICAgICAgICAgICAgdmFyIGN0eEJhbGwgPSBjdnNCYWxsLmdldENvbnRleHQoJzJkJyk7XHJcbiAgICAgICAgICAgIGN2c0JhbGwud2lkdGggPSAxMDA7XHJcbiAgICAgICAgICAgIGN2c0JhbGwuaGVpZ2h0ID0gMTAwO1xyXG4gICAgICAgICAgICBjdHhCYWxsLmJlZ2luUGF0aCgpO1xyXG4gICAgICAgICAgICBjdHhCYWxsLmFyYyg1MCwgNTAsIDE1LCAwLCBNYXRoLlBJICogMik7XHJcbiAgICAgICAgICAgIGN0eEJhbGwuZmlsbFN0eWxlID0gYXJyb3dDb2xvcjtcclxuICAgICAgICAgICAgY3R4QmFsbC5maWxsKCk7XHJcbiAgICAgICAgICAgIHdpbmRvdy5iYWxsc01hcFthcnJvd0NvbG9yXSA9IGN2c0JhbGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZihcIlJFVkVSU0VcIiA9PSBsaW5rLmZsb3dpbmcpe1xyXG4gICAgICAgICAgICBsaW5rLmxlbiAtPSAyO1xyXG4gICAgICAgICAgICAobGluay5sZW4gPD0gNCkgJiYgKGxpbmsubGVuID0gbGluay5wYXRoLmdldFRvdGFsTGVuZ3RoKCkpO1xyXG4gICAgICAgICAgICAobGluay5wYXRoLmdldFRvdGFsTGVuZ3RoKCkgLSBsaW5rLmxlbiA8PSA0ICkgJiYgKGxpbmsubGVuID0gbGluay5wYXRoLmdldFRvdGFsTGVuZ3RoKCkgLSA0KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsaW5rLmxlbiArPSAyO1xyXG4gICAgICAgICAgICAobGluay5sZW4gPj0gbGluay5wYXRoLmdldFRvdGFsTGVuZ3RoKCkpICYmIChsaW5rLmxlbiA9IDQpO1xyXG4gICAgICAgICAgICAobGluay5wYXRoLmdldFRvdGFsTGVuZ3RoKCkgLSBsaW5rLmxlbiA8PSA0ICkgJiYgKGxpbmsubGVuID0gNCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBjdXJyZW50ID0gbGluay5wYXRoLmdldFBvaW50QXRMZW5ndGgobGluay5sZW4pO1xyXG4gICAgICAgIGN0eC5zYXZlKCk7XHJcbiAgICAgICAgY3R4Lmdsb2JhbEFscGhhID0gMC41O1xyXG4gICAgICAgIGN0eC5kcmF3SW1hZ2UoY3ZzQmFsbCwgY3VycmVudC54IC0gcmFkaXVzIC8gMiwgY3VycmVudC55IC0gcmFkaXVzIC8gMiwgcmFkaXVzLCByYWRpdXMpO1xyXG4gICAgICAgIGN0eC5yZXN0b3JlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0Q29ubmVjdG9yT2Zmc2V0KGNvbm5ldGNvcikge1xyXG4gICAgICAgIHZhciBvZmZzZXRTZXR0aW5nID0ge1xyXG4gICAgICAgICAgICBcIjJcIjogMTUsXHJcbiAgICAgICAgICAgIFwiM1wiOiAxNVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgdmFyIG9mZnNldCA9IDA7XHJcbiAgICAgICAgaWYgKGNvbm5ldGNvci5zdWJzdHIoMSwgMSkgPT0gXCIxXCIgJiYgY29ubmV0Y29yLnN1YnN0cigyLCAxKSA9PSBcIjFcIikge1xyXG4gICAgICAgICAgICByZXR1cm4ge3g6IDAsIHk6IDB9XHJcbiAgICAgICAgfSBlbHNlIGlmIChwYXJzZUludChjb25uZXRjb3Iuc3Vic3RyKDEsIDEpKSAlIDIgPT0gMCkge1xyXG4gICAgICAgICAgICBvZmZzZXQgPSAocGFyc2VJbnQoY29ubmV0Y29yLnN1YnN0cigyLCAxKSkgLSAocGFyc2VJbnQoY29ubmV0Y29yLnN1YnN0cigxLCAxKSkpIC8gMiAtIDAuNSkgKiBvZmZzZXRTZXR0aW5nW2Nvbm5ldGNvci5zdWJzdHIoMSwgMSldO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIG9mZnNldCA9IChwYXJzZUludChjb25uZXRjb3Iuc3Vic3RyKDIsIDEpKSAtIChwYXJzZUludChjb25uZXRjb3Iuc3Vic3RyKDEsIDEpKSArIDEpIC8gMikgKiBvZmZzZXRTZXR0aW5nW2Nvbm5ldGNvci5zdWJzdHIoMSwgMSldO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGNvbm5ldGNvci5zdWJzdHIoMCwgMSkgPT0gXCJUXCIgfHwgY29ubmV0Y29yLnN1YnN0cigwLCAxKSA9PSBcIkJcIikge1xyXG4gICAgICAgICAgICByZXR1cm4ge3g6IG9mZnNldCwgeTogMH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4ge3g6IDAsIHk6IG9mZnNldH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0Q29ubmVjdG9yUG9pbnQobm9kZSwgY29ubmV0Y29yKSB7XHJcbiAgICAgICAgdmFyIHhQYWRkaW5nID0gNztcclxuICAgICAgICB2YXIgeVBhZGRpbmcgPSA3O1xyXG4gICAgICAgIHZhciB4ID0gbm9kZS54ICsgKG5vZGUud2lkdGggLSBub2RlLmljb25XaWR0aCkgLyAyO1xyXG4gICAgICAgIHZhciB5ID0gbm9kZS55ICsgKG5vZGUuaGVpZ2h0IC0gbm9kZS5pY29uSGVpZ2h0KSAvIDI7XHJcblxyXG4gICAgICAgIHN3aXRjaCAoY29ubmV0Y29yLnN1YnN0cigwLCAxKSkge1xyXG4gICAgICAgICAgICBjYXNlIFwiVFwiOlxyXG4gICAgICAgICAgICAgICAgeCA9IHggKyBub2RlLmljb25XaWR0aCAvIDI7XHJcbiAgICAgICAgICAgICAgICB5ID0geSAtIHlQYWRkaW5nO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgXCJCXCI6XHJcbiAgICAgICAgICAgICAgICB4ID0geCArIG5vZGUuaWNvbldpZHRoIC8gMjtcclxuICAgICAgICAgICAgICAgIHkgPSB5ICsgbm9kZS5pY29uSGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgeSA9IHkgKyB5UGFkZGluZztcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwiUlwiOlxyXG4gICAgICAgICAgICAgICAgeCA9IHggKyBub2RlLmljb25XaWR0aDtcclxuICAgICAgICAgICAgICAgIHkgPSB5ICsgbm9kZS5pY29uSGVpZ2h0IC8gMjtcclxuICAgICAgICAgICAgICAgIHggPSB4ICsgeFBhZGRpbmc7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcIkxcIjpcclxuICAgICAgICAgICAgICAgIHkgPSB5ICsgbm9kZS5pY29uSGVpZ2h0IC8gMjtcclxuICAgICAgICAgICAgICAgIHggPSB4IC0geFBhZGRpbmc7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIG9mZnNldCA9IGdldENvbm5lY3Rvck9mZnNldChjb25uZXRjb3IpO1xyXG4gICAgICAgIHJldHVybiB7eDogeCArIG9mZnNldC54LCB5OiB5ICsgb2Zmc2V0Lnl9O1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHRyYW5zRGVzY3JpcHRpb24oZGVzY3JpcHRpb24pIHtcclxuICAgICAgICBkZXNjcmlwdGlvbiA9ICQuZXh0ZW5kKHRydWUsIHtcclxuICAgICAgICAgICAgbGFiZWw6IFwiXCIsXHJcbiAgICAgICAgICAgIGxhYmVsRm9udFNpemU6IFwiMTRweFwiLFxyXG4gICAgICAgICAgICB2YWx1ZTogXCJcIixcclxuICAgICAgICAgICAgdmFsdWVGb250U2l6ZTogXCIxNHB4XCIsXHJcbiAgICAgICAgICAgIG9mZnNldDoge3g6IDAsIHk6IDB9XHJcbiAgICAgICAgfSwgZGVzY3JpcHRpb24pO1xyXG4gICAgICAgIGlmICgkLnRyaW0oZGVzY3JpcHRpb24ubGFiZWwpICE9IFwiXCIpIHtcclxuICAgICAgICAgICAgaWYgKGRlc2NyaXB0aW9uLmxhYmVsLmluZGV4T2YoXCJNc2dcIikgIT0gLTEpIHtcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uLmxhYmVsID0gZXZhbChcIndpbmRvdy5cIiArIGRlc2NyaXB0aW9uLmxhYmVsKTsvL+WbvemZheWMllxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICgkLnRyaW0oZGVzY3JpcHRpb24udmFsdWUpICE9IFwiXCIgJiYgZGVzY3JpcHRpb24udmFsdWUuc3BsaXQoXCIjXCIpLmxlbmd0aCA9PSAyKSB7XHJcbiAgICAgICAgICAgIHZhciB0ZW1wID0gcGFyc2VGbG9hdChkZXNjcmlwdGlvbi52YWx1ZS5zcGxpdChcIiNcIilbMF0pO1xyXG4gICAgICAgICAgICB2YXIgbmVnYXRpdmUgPSB0ZW1wIDwgMDtcclxuICAgICAgICAgICAgdmFyIGRpc3BsYXkgPSBjb252ZXJ0KE1hdGguYWJzKHRlbXApLCBtYWluLkxhbmcgKyAnXycgKyBtYWluLnJlZ2lvbikuZnJvbShkZXNjcmlwdGlvbi52YWx1ZS5zcGxpdChcIiNcIilbMV0pLnRvQmVzdCgpO1xyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbi52YWx1ZSA9IFwiIFwiICsobmVnYXRpdmUgPT0gdHJ1ZSA/IFwiLVwiOlwiXCIpKyBwYXJzZUZsb2F0KGRpc3BsYXkudmFsKS50b0ZpeGVkKDIpICsgXCIgXCIgKyBkaXNwbGF5LnVuaXQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBkZXNjcmlwdGlvbjtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBuZWVkUmVDcmVhdGUoY3VyQ29uZmlnLCBwcmVDb25maWcpe1xyXG5cclxuICAgICAgICBpZigoY3VyQ29uZmlnICE9IG51bGwgJiYgcHJlQ29uZmlnID09IG51bGwpXHJcbiAgICAgICAgICAgIHx8KGN1ckNvbmZpZyA9PSBudWxsICYmIHByZUNvbmZpZyAhPSBudWxsKSl7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZihjdXJDb25maWcgPT0gbnVsbCAmJiBwcmVDb25maWcgPT0gbnVsbCl7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoY3VyQ29uZmlnLm5vZGVzLmxlbmd0aCAhPSBwcmVDb25maWcubm9kZXMubGVuZ3RoKXtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKGN1ckNvbmZpZy5saW5rcy5sZW5ndGggIT0gcHJlQ29uZmlnLmxpbmtzLmxlbmd0aCl7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yKHZhciBpID0gMCA7IGk8Y3VyQ29uZmlnLm5vZGVzLmxlbmd0aDsgaSsrKXtcclxuICAgICAgICAgICAgaWYocGFyc2VJbnQoY3VyQ29uZmlnLm5vZGVzW2ldLmlkKSAhPSBwYXJzZUludChwcmVDb25maWcubm9kZXNbaV0uaWQpKXtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yKHZhciBpID0gMCA7IGk8Y3VyQ29uZmlnLmxpbmtzLmxlbmd0aDsgaSsrKXtcclxuICAgICAgICAgICAgaWYocGFyc2VJbnQoY3VyQ29uZmlnLmxpbmtzW2ldLmlkKSAhPSBwYXJzZUludChwcmVDb25maWcubGlua3NbaV0uaWQpKXtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICAkLmZuLkVuZXJneUZsb3cgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBFbmVyZ3lGbG93KCQodGhpcylbMF0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBmdW5jdGlvbiBFbmVyZ3lGbG93KGNhbnZhcykge1xyXG4gICAgICAgIHRoaXMubGluZURhc2hTdXBwb3J0ID0gKCFtYWluLmdldEJyb3dzZXIoKS5tc2llIHx8IHBhcnNlRmxvYXQobWFpbi5nZXRCcm93c2VyKCkudmVyc2lvbikgPj0gMTEpO1xyXG4gICAgICAgIHRoaXMuY2FudmFzID0gY2FudmFzO1xyXG4gICAgICAgIHRoaXMucHJlQ29uZmlnID0gbnVsbDtcclxuICAgICAgICB0aGlzLmN1ckNvbmZpZyA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5hbmltYXRpb25JZCA9IFwiXCI7XHJcbiAgICAgICAgdGhpcy5pZCA9IFwiRUYjXCIrbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcbiAgICAgICAgJChjYW52YXMpLmF0dHIoXCJFRklEXCIsdGhpcy5pZCk7XHJcbiAgICAgICAgdGhpcy5pbml0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgRW5lcmd5Rmxvdy5wcm90b3R5cGUgPSB7XHJcbiAgICAgICAgYmluZDogZnVuY3Rpb24oY2FudmFzKXtcclxuICAgICAgICAgICAgdGhpcy5jYW52YXMgPSBjYW52YXM7XHJcbiAgICAgICAgICAgIHRoaXMucHJlQ29uZmlnID0gbnVsbDtcclxuICAgICAgICAgICAgdGhpcy5jdXJDb25maWcgPSBudWxsO1xyXG4gICAgICAgICAgICB0aGlzLmlkID0gXCJFRiNcIituZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuICAgICAgICAgICAgJChjYW52YXMpLmF0dHIoXCJFRklEXCIsdGhpcy5pZCk7XHJcbiAgICAgICAgICAgIHRoaXMuaW5pdCgpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcmVzaXplOiBmdW5jdGlvbihjYW52YXMpe1xyXG4gICAgICAgICAgICB2YXIgY29uZmlnID0gdGhpcy5jdXJDb25maWd8fHRoaXMucHJlQ29uZmlnO1xyXG4gICAgICAgICAgICBjb25maWcubGF5b3V0ID0ge1xyXG4gICAgICAgICAgICAgICAgd2lkdGg6ICQodGhpcy5jYW52YXMpLndpZHRoKCksXHJcbiAgICAgICAgICAgICAgICBoZWlnaHQ6ICQodGhpcy5jYW52YXMpLmhlaWdodCgpXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHRoaXMuYmluZChjYW52YXMpO1xyXG4gICAgICAgICAgICB0aGlzLnJlbmRlcihjb25maWcpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgaW5pdDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMuY2FudmFzLmdldENvbnRleHQpIHtcclxuICAgICAgICAgICAgICAgIHdpbmRvdy5HX3ZtbENhbnZhc01hbmFnZXIuaW5pdEVsZW1lbnQodGhpcy5jYW52YXMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuY2FudmFzLndpZHRoID0gJCh0aGlzLmNhbnZhcykud2lkdGgoKTtcclxuICAgICAgICAgICAgdGhpcy5jYW52YXMuaGVpZ2h0ID0gJCh0aGlzLmNhbnZhcykuaGVpZ2h0KCk7XHJcbiAgICAgICAgICAgIHRoaXMuY3R4ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpO1xyXG4gICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgICAgICAgICBjYW5jZWxBbmltYXRpb25GcmFtZShfdGhpcy5hbmltYXRpb25JZCk7XHJcbiAgICAgICAgICAgIHZhciBhbmltYXRlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKF90aGlzLmN1ckNvbmZpZyAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNyZWF0ZUZsYWcgPSBuZWVkUmVDcmVhdGUoX3RoaXMuY3VyQ29uZmlnLCBfdGhpcy5wcmVDb25maWcpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBpY29uQ3JlYXRlRmxhZyA9IHt9O1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgX3RoaXMuY3VyQ29uZmlnLm5vZGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGljb25DcmVhdGVGbGFnW190aGlzLmN1ckNvbmZpZy5ub2Rlc1tpXS5pZF0gPSBjcmVhdGVGbGFnO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAoY3JlYXRlRmxhZykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhdXRvTGF5b3V0KF90aGlzLmNhbnZhcywgX3RoaXMuY3VyQ29uZmlnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYmluZE1vdXNlRXZlbnQoX3RoaXMuY2FudmFzLCBfdGhpcy5jdHgsIF90aGlzLmN1ckNvbmZpZywgX3RoaXMubGluZURhc2hTdXBwb3J0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuY3R4LmNsZWFyUmVjdCgwLCAwLCAkKF90aGlzLmNhbnZhcykud2lkdGgoKSwgJChfdGhpcy5jYW52YXMpLmhlaWdodCgpKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IF90aGlzLmN1ckNvbmZpZy5ub2Rlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWNvbkNyZWF0ZUZsYWdbX3RoaXMuY3VyQ29uZmlnLm5vZGVzW2ldLmlkXSA9IChfdGhpcy5jdXJDb25maWcubm9kZXNbaV0uaWNvbiAhPSBfdGhpcy5wcmVDb25maWcubm9kZXNbaV0uaWNvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmV4dGVuZCh0cnVlLCBfdGhpcy5jdXJDb25maWcubm9kZXNbaV0sIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpY29uV2lkdGg6IF90aGlzLnByZUNvbmZpZy5ub2Rlc1tpXS5pY29uV2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWNvbkhlaWdodDogX3RoaXMucHJlQ29uZmlnLm5vZGVzW2ldLmljb25IZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IF90aGlzLnByZUNvbmZpZy5ub2Rlc1tpXS53aWR0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IF90aGlzLnByZUNvbmZpZy5ub2Rlc1tpXS5oZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogX3RoaXMucHJlQ29uZmlnLm5vZGVzW2ldLngsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeTogX3RoaXMucHJlQ29uZmlnLm5vZGVzW2ldLnksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RlcDogX3RoaXMucHJlQ29uZmlnLm5vZGVzW2ldLnN0ZXAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVuZGVyOiBfdGhpcy5wcmVDb25maWcubm9kZXNbaV0ucmVuZGVyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiB0cmFuc0Rlc2NyaXB0aW9uKF90aGlzLmN1ckNvbmZpZy5ub2Rlc1tpXS5kZXNjcmlwdGlvbiksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJlRGVzY3JpcHRpb246IF90aGlzLnByZUNvbmZpZy5ub2Rlc1tpXS5kZXNjcmlwdGlvblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgX3RoaXMuY3VyQ29uZmlnLmxpbmtzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmV4dGVuZCh0cnVlLCBfdGhpcy5jdXJDb25maWcubGlua3NbaV0sIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByb3V0aW5nczogX3RoaXMucHJlQ29uZmlnLmxpbmtzW2ldLnJvdXRpbmdzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvaW50czogX3RoaXMucHJlQ29uZmlnLmxpbmtzW2ldLnBvaW50cyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiBfdGhpcy5wcmVDb25maWcubGlua3NbaV0ucGF0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZW46IF90aGlzLnByZUNvbmZpZy5saW5rc1tpXS5sZW4sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IHRyYW5zRGVzY3JpcHRpb24oX3RoaXMuY3VyQ29uZmlnLmxpbmtzW2ldLmRlc2NyaXB0aW9uKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmVEZXNjcmlwdGlvbjogX3RoaXMucHJlQ29uZmlnLmxpbmtzW2ldLmRlc2NyaXB0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICQuZWFjaChfdGhpcy5jdXJDb25maWcubm9kZXMsIGZ1bmN0aW9uIChpZHgsIG5vZGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZHJhd05vZGUoX3RoaXMuY3R4LCBub2RlLCBpY29uQ3JlYXRlRmxhZ1tub2RlLmlkXSB8fCBfdGhpcy5wcmVDb25maWcgPT0gbnVsbCwgX3RoaXMubGluZURhc2hTdXBwb3J0KTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAkLmVhY2goX3RoaXMuY3VyQ29uZmlnLmxpbmtzLCBmdW5jdGlvbiAoaWR4LCBsaW5rKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRyYXdMaW5rKF90aGlzLmN0eCwgbGluaywgX3RoaXMubGluZURhc2hTdXBwb3J0LCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgJC5lYWNoKF90aGlzLmN1ckNvbmZpZy5saW5rcywgZnVuY3Rpb24gKGlkeCwgbGluaykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkcmF3QXJyb3coX3RoaXMuY3R4LCBsaW5rKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICBfdGhpcy5wcmVDb25maWcgPSBfdGhpcy5jdXJDb25maWc7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYoX3RoaXMucHJlQ29uZmlnICE9IG51bGwpe1xyXG4gICAgICAgICAgICAgICAgICAgICQuZWFjaChfdGhpcy5wcmVDb25maWcubm9kZXMsIGZ1bmN0aW9uIChpZHgsIG5vZGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYobm9kZS5yZW5kZXIpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5yZW5kZXIoX3RoaXMuY3R4LCBub2RlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICQuZWFjaChfdGhpcy5wcmVDb25maWcubGlua3MsIGZ1bmN0aW9uIChpZHgsIGxpbmspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZHJhd0xpbmsoX3RoaXMuY3R4LCBsaW5rLCBfdGhpcy5saW5lRGFzaFN1cHBvcnQsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICQuZWFjaChfdGhpcy5wcmVDb25maWcubGlua3MsIGZ1bmN0aW9uIChpZHgsIGxpbmspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZHJhd0Fycm93KF90aGlzLmN0eCwgbGluayk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBfdGhpcy5jdXJDb25maWcgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgX3RoaXMuYW5pbWF0aW9uSWQgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoYW5pbWF0ZSk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGFuaW1hdGUoKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHJlbmRlcjogZnVuY3Rpb24gKGNvbmZpZykge1xyXG4gICAgICAgICAgICB0aGlzLmN1ckNvbmZpZyA9IGNvbmZpZztcclxuICAgICAgICAgICAgaWYgKCF0aGlzLmN1ckNvbmZpZy5sYXlvdXQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VyQ29uZmlnLmxheW91dCA9IHt9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuY3VyQ29uZmlnLmxheW91dCA9IHtcclxuICAgICAgICAgICAgICAgIHdpZHRoOiB0aGlzLmN1ckNvbmZpZy5sYXlvdXQud2lkdGggfHwgJCh0aGlzLmNhbnZhcykud2lkdGgoKSxcclxuICAgICAgICAgICAgICAgIGhlaWdodDogdGhpcy5jdXJDb25maWcubGF5b3V0LmhlaWdodCB8fCAkKHRoaXMuY2FudmFzKS5oZWlnaHQoKVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICByZXR1cm4gRW5lcmd5RmxvdztcclxufSk7Il0sImZpbGUiOiJwbHVnaW5zL2VuZXJneUZsb3cvZW5lcmd5Rmxvdy5qcyJ9
