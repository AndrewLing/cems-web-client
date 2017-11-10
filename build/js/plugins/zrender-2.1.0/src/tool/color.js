/**
 * 颜色辅助模块
 * @module zrender/tool/color
 */
define(function(require) {
    var util = require(['../tool/util']);

    var _ctx;

    // Color palette is an array containing the default colors for the chart's
    // series.
    // When all colors are used, new colors are selected from the start again.
    // Defaults to:
    // 默认色板
    var palette = [
        '#ff9277', ' #dddd00', ' #ffc877', ' #bbe3ff', ' #d5ffbb',
        '#bbbbff', ' #ddb000', ' #b0dd00', ' #e2bbff', ' #ffbbe3',
        '#ff7777', ' #ff9900', ' #83dd00', ' #77e3ff', ' #778fff',
        '#c877ff', ' #ff77ab', ' #ff6600', ' #aa8800', ' #77c7ff',
        '#ad77ff', ' #ff77ff', ' #dd0083', ' #777700', ' #00aa00',
        '#0088aa', ' #8400dd', ' #aa0088', ' #dd0000', ' #772e00'
    ];
    var _palette = palette;

    var highlightColor = 'rgba(255,255,0,0.5)';
    var _highlightColor = highlightColor;

    // 颜色格式
    /*jshint maxlen: 330 */
    var colorRegExp = /^\s*((#[a-f\d]{6})|(#[a-f\d]{3})|rgba?\(\s*([\d\.]+%?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+%?(?:\s*,\s*[\d\.]+%?)?)\s*\)|hsba?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+%?(?:\s*,\s*[\d\.]+)?)%?\s*\)|hsla?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+%?(?:\s*,\s*[\d\.]+)?)%?\s*\))\s*$/i;

    var _nameColors = {
        aliceblue : '#f0f8ff',
        antiquewhite : '#faebd7',
        aqua : '#0ff',
        aquamarine : '#7fffd4',
        azure : '#f0ffff',
        beige : '#f5f5dc',
        bisque : '#ffe4c4',
        black : '#000',
        blanchedalmond : '#ffebcd',
        blue : '#00f',
        blueviolet : '#8a2be2',
        brown : '#a52a2a',
        burlywood : '#deb887',
        cadetblue : '#5f9ea0',
        chartreuse : '#7fff00',
        chocolate : '#d2691e',
        coral : '#ff7f50',
        cornflowerblue : '#6495ed',
        cornsilk : '#fff8dc',
        crimson : '#dc143c',
        cyan : '#0ff',
        darkblue : '#00008b',
        darkcyan : '#008b8b',
        darkgoldenrod : '#b8860b',
        darkgray : '#a9a9a9',
        darkgrey : '#a9a9a9',
        darkgreen : '#006400',
        darkkhaki : '#bdb76b',
        darkmagenta : '#8b008b',
        darkolivegreen : '#556b2f',
        darkorange : '#ff8c00',
        darkorchid : '#9932cc',
        darkred : '#8b0000',
        darksalmon : '#e9967a',
        darkseagreen : '#8fbc8f',
        darkslateblue : '#483d8b',
        darkslategray : '#2f4f4f',
        darkslategrey : '#2f4f4f',
        darkturquoise : '#00ced1',
        darkviolet : '#9400d3',
        deeppink : '#ff1493',
        deepskyblue : '#00bfff',
        dimgray : '#696969',
        dimgrey : '#696969',
        dodgerblue : '#1e90ff',
        firebrick : '#b22222',
        floralwhite : '#fffaf0',
        forestgreen : '#228b22',
        fuchsia : '#f0f',
        gainsboro : '#dcdcdc',
        ghostwhite : '#f8f8ff',
        gold : '#ffd700',
        goldenrod : '#daa520',
        gray : '#808080',
        grey : '#808080',
        green : '#008000',
        greenyellow : '#adff2f',
        honeydew : '#f0fff0',
        hotpink : '#ff69b4',
        indianred : '#cd5c5c',
        indigo : '#4b0082',
        ivory : '#fffff0',
        khaki : '#f0e68c',
        lavender : '#e6e6fa',
        lavenderblush : '#fff0f5',
        lawngreen : '#7cfc00',
        lemonchiffon : '#fffacd',
        lightblue : '#add8e6',
        lightcoral : '#f08080',
        lightcyan : '#e0ffff',
        lightgoldenrodyellow : '#fafad2',
        lightgray : '#d3d3d3',
        lightgrey : '#d3d3d3',
        lightgreen : '#90ee90',
        lightpink : '#ffb6c1',
        lightsalmon : '#ffa07a',
        lightseagreen : '#20b2aa',
        lightskyblue : '#87cefa',
        lightslategray : '#789',
        lightslategrey : '#789',
        lightsteelblue : '#b0c4de',
        lightyellow : '#ffffe0',
        lime : '#0f0',
        limegreen : '#32cd32',
        linen : '#faf0e6',
        magenta : '#f0f',
        maroon : '#800000',
        mediumaquamarine : '#66cdaa',
        mediumblue : '#0000cd',
        mediumorchid : '#ba55d3',
        mediumpurple : '#9370d8',
        mediumseagreen : '#3cb371',
        mediumslateblue : '#7b68ee',
        mediumspringgreen : '#00fa9a',
        mediumturquoise : '#48d1cc',
        mediumvioletred : '#c71585',
        midnightblue : '#191970',
        mintcream : '#f5fffa',
        mistyrose : '#ffe4e1',
        moccasin : '#ffe4b5',
        navajowhite : '#ffdead',
        navy : '#000080',
        oldlace : '#fdf5e6',
        olive : '#808000',
        olivedrab : '#6b8e23',
        orange : '#ffa500',
        orangered : '#ff4500',
        orchid : '#da70d6',
        palegoldenrod : '#eee8aa',
        palegreen : '#98fb98',
        paleturquoise : '#afeeee',
        palevioletred : '#d87093',
        papayawhip : '#ffefd5',
        peachpuff : '#ffdab9',
        peru : '#cd853f',
        pink : '#ffc0cb',
        plum : '#dda0dd',
        powderblue : '#b0e0e6',
        purple : '#800080',
        red : '#f00',
        rosybrown : '#bc8f8f',
        royalblue : '#4169e1',
        saddlebrown : '#8b4513',
        salmon : '#fa8072',
        sandybrown : '#f4a460',
        seagreen : '#2e8b57',
        seashell : '#fff5ee',
        sienna : '#a0522d',
        silver : '#c0c0c0',
        skyblue : '#87ceeb',
        slateblue : '#6a5acd',
        slategray : '#708090',
        slategrey : '#708090',
        snow : '#fffafa',
        springgreen : '#00ff7f',
        steelblue : '#4682b4',
        tan : '#d2b48c',
        teal : '#008080',
        thistle : '#d8bfd8',
        tomato : '#ff6347',
        turquoise : '#40e0d0',
        violet : '#ee82ee',
        wheat : '#f5deb3',
        white : '#fff',
        whitesmoke : '#f5f5f5',
        yellow : '#ff0',
        yellowgreen : '#9acd32'
    };

    /**
     * 自定义调色板
     */
    function customPalette(userPalete) {
        palette = userPalete;
    }

    /**
     * 复位默认色板
     */
    function resetPalette() {
        palette = _palette;
    }

    /**
     * 获取色板颜色
     * @memberOf module:zrender/tool/color
     * @param {number} idx 色板位置
     * @param {Array.<string>} [userPalete] 自定义色板
     * @return {string} 颜色
     */
    function getColor(idx, userPalete) {
        idx = idx | 0;
        userPalete = userPalete || palette;
        return userPalete[idx % userPalete.length];
    }

    /**
     * 自定义默认高亮颜色
     */
    function customHighlight(userHighlightColor) {
        highlightColor = userHighlightColor;
    }

    /**
     * 重置默认高亮颜色
     */
    function resetHighlight() {
        _highlightColor = highlightColor;
    }

    /**
     * 获取默认高亮颜色
     */
    function getHighlightColor() {
        return highlightColor;
    }

    /**
     * 径向渐变
     * @memberOf module:zrender/tool/color
     * @param {number} x0 渐变起点
     * @param {number} y0
     * @param {number} r0
     * @param {number} x1 渐变终点
     * @param {number} y1
     * @param {number} r1
     * @param {Array} colorList 颜色列表
     * @return {CanvasGradient}
     */
    function getRadialGradient(x0, y0, r0, x1, y1, r1, colorList) {
        if (!_ctx) {
            _ctx = util.getContext();
        }
        var gradient = _ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
        for (var i = 0, l = colorList.length; i < l; i++) {
            gradient.addColorStop(colorList[i][0], colorList[i][1]);
        }
        gradient.__nonRecursion = true;
        return gradient;
    }

    /**
     * 线性渐变
     * @param {Object} x0 渐变起点
     * @param {Object} y0
     * @param {Object} x1 渐变终点
     * @param {Object} y1
     * @param {Array} colorList 颜色列表
     */
    function getLinearGradient(x0, y0, x1, y1, colorList) {
        if (!_ctx) {
            _ctx = util.getContext();
        }
        var gradient = _ctx.createLinearGradient(x0, y0, x1, y1);
        for (var i = 0, l = colorList.length; i < l; i++) {
            gradient.addColorStop(colorList[i][0], colorList[i][1]);
        }
        gradient.__nonRecursion = true;
        return gradient;
    }

    /**
     * 获取两种颜色之间渐变颜色数组
     * @param {color} start 起始颜色
     * @param {color} end 结束颜色
     * @param {number} step 渐变级数
     * @return {Array}  颜色数组
     */
    function getStepColors(start, end, step) {
        start = toRGBA(start);
        end = toRGBA(end);
        start = getData(start);
        end = getData(end);

        var colors = [];
        var stepR = (end[0] - start[0]) / step;
        var stepG = (end[1] - start[1]) / step;
        var stepB = (end[2] - start[2]) / step;
        var stepA = (end[3] - start[3]) / step;
        // 生成颜色集合
        // fix by linfeng 颜色堆积
        for (var i = 0, r = start[0], g = start[1], b = start[2], a = start[3]; i < step; i++) {
            colors[i] = toColor([
                adjust(Math.floor(r), [ 0, 255 ]),
                adjust(Math.floor(g), [ 0, 255 ]), 
                adjust(Math.floor(b), [ 0, 255 ]),
                a.toFixed(4) - 0
            ],'rgba');
            r += stepR;
            g += stepG;
            b += stepB;
            a += stepA;
        }
        r = end[0];
        g = end[1];
        b = end[2];
        a = end[3];
        colors[i] = toColor([r, g, b, a], 'rgba');
        return colors;
    }

    /**
     * 获取指定级数的渐变颜色数组
     * @memberOf module:zrender/tool/color
     * @param {Array.<string>} colors 颜色组
     * @param {number} [step=20] 渐变级数
     * @return {Array.<string>}  颜色数组
     */
    function getGradientColors(colors, step) {
        var ret = [];
        var len = colors.length;
        if (step === undefined) {
            step = 20;
        }
        if (len === 1) {
            ret = getStepColors(colors[0], colors[0], step);
        }
        else if (len > 1) {
            for (var i = 0, n = len - 1; i < n; i++) {
                var steps = getStepColors(colors[i], colors[i + 1], step);
                if (i < n - 1) {
                    steps.pop();
                }
                ret = ret.concat(steps);
            }
        }
        return ret;
    }

    /**
     * 颜色值数组转为指定格式颜色,例如:<br/>
     * data = [60,20,20,0.1] format = 'rgba'
     * 返回：rgba(60,20,20,0.1)
     * @param {Array} data 颜色值数组
     * @param {string} format 格式,默认rgb
     * @return {string} 颜色
     */
    function toColor(data, format) {
        format = format || 'rgb';
        if (data && (data.length === 3 || data.length === 4)) {
            data = map(data,
                function(c) {
                    return c > 1 ? Math.ceil(c) : c;
                }
            );

            if (format.indexOf('hex') > -1) {
                return '#' + ((1 << 24) + (data[0] << 16) + (data[1] << 8) + (+data[2])).toString(16).slice(1);
            }
            else if (format.indexOf('hs') > -1) {
                var sx = map(data.slice(1, 3),
                    function(c) {
                        return c + '%';
                    }
                );
                data[1] = sx[0];
                data[2] = sx[1];
            }

            if (format.indexOf('a') > -1) {
                if (data.length === 3) {
                    data.push(1);
                }
                data[3] = adjust(data[3], [ 0, 1 ]);
                return format + '(' + data.slice(0, 4).join(',') + ')';
            }

            return format + '(' + data.slice(0, 3).join(',') + ')';
        }
    }

    /**
     * 颜色字符串转换为rgba数组
     * @memberOf module:zrender/tool/color
     * @param {string} color 颜色
     * @return {Array.<number>} 颜色值数组
     */
    function toArray(color) {
        color = trim(color);
        if (color.indexOf('rgba') < 0) {
            color = toRGBA(color);
        }

        var data = [];
        var i = 0;
        color.replace(/[\d.]+/g, function (n) {
            if (i < 3) {
                n = n | 0;
            }
            else {
                // Alpha
                n = +n;
            }
            data[i++] = n;
        });
        return data;
    }

    /**
     * 颜色格式转化
     *
     * @param {string} color 颜色值数组
     * @param {string} format 格式,默认rgb
     * @return {string} 颜色
     */
    function convert(color, format) {
        if (!isCalculableColor(color)) {
            return color;
        }
        var data = getData(color);
        var alpha = data[3];
        if (typeof alpha === 'undefined') {
            alpha = 1;
        }

        if (color.indexOf('hsb') > -1) {
            data = _HSV_2_RGB(data);
        }
        else if (color.indexOf('hsl') > -1) {
            data = _HSL_2_RGB(data);
        }

        if (format.indexOf('hsb') > -1 || format.indexOf('hsv') > -1) {
            data = _RGB_2_HSB(data);
        }
        else if (format.indexOf('hsl') > -1) {
            data = _RGB_2_HSL(data);
        }

        data[3] = alpha;

        return toColor(data, format);
    }

    /**
     * 转换为rgba格式的颜色
     * @memberOf module:zrender/tool/color
     * @param {string} color 颜色
     * @return {string} rgba颜色，rgba(r,g,b,a)
     */
    function toRGBA(color) {
        return convert(color, 'rgba');
    }

    /**
     * 转换为rgb数字格式的颜色
     * @memberOf module:zrender/tool/color
     * @param {string} color 颜色
     * @return {string} rgb颜色，rgb(0,0,0)格式
     */
    function toRGB(color) {
        return convert(color, 'rgb');
    }

    /**
     * 转换为16进制颜色
     * @memberOf module:zrender/tool/color
     * @param {string} color 颜色
     * @return {string} 16进制颜色，#rrggbb格式
     */
    function toHex(color) {
        return convert(color, 'hex');
    }

    /**
     * 转换为HSV颜色
     * @memberOf module:zrender/tool/color
     * @param {string} color 颜色
     * @return {string} HSVA颜色，hsva(h,s,v,a)
     */
    function toHSVA(color) {
        return convert(color, 'hsva');
    }

    /**
     * 转换为HSV颜色
     * @memberOf module:zrender/tool/color
     * @param {string} color 颜色
     * @return {string} HSV颜色，hsv(h,s,v)
     */
    function toHSV(color) {
        return convert(color, 'hsv');
    }

    /**
     * 转换为HSBA颜色
     * @memberOf module:zrender/tool/color
     * @param {string} color 颜色
     * @return {string} HSBA颜色，hsba(h,s,b,a)
     */
    function toHSBA(color) {
        return convert(color, 'hsba');
    }

    /**
     * 转换为HSB颜色
     * @memberOf module:zrender/tool/color
     * @param {string} color 颜色
     * @return {string} HSB颜色，hsb(h,s,b)
     */
    function toHSB(color) {
        return convert(color, 'hsb');
    }

    /**
     * 转换为HSLA颜色
     * @memberOf module:zrender/tool/color
     * @param {string} color 颜色
     * @return {string} HSLA颜色，hsla(h,s,l,a)
     */
    function toHSLA(color) {
        return convert(color, 'hsla');
    }

    /**
     * 转换为HSL颜色
     * @memberOf module:zrender/tool/color
     * @param {string} color 颜色
     * @return {string} HSL颜色，hsl(h,s,l)
     */
    function toHSL(color) {
        return convert(color, 'hsl');
    }

    /**
     * 转换颜色名
     * 
     * @param {string} color 颜色
     * @return {string} 颜色名
     */
    function toName(color) {
        for (var key in _nameColors) {
            if (toHex(_nameColors[key]) === toHex(color)) {
                return key;
            }
        }
        return null;
    }

    /**
     * 移除颜色中多余空格
     * 
     * @param {string} color 颜色
     * @return {string} 无空格颜色
     */
    function trim(color) {
        return String(color).replace(/\s+/g, '');
    }

    /**
     * 颜色规范化
     * @memberOf module:zrender/tool/color
     * @param {string} color 颜色
     * @return {string} 规范化后的颜色
     */
    function normalize(color) {
        // 颜色名
        if (_nameColors[color]) {
            color = _nameColors[color];
        }
        // 去掉空格
        color = trim(color);
        // hsv与hsb等价
        color = color.replace(/hsv/i, 'hsb');
        // rgb转为rrggbb
        if (/^#[\da-f]{3}$/i.test(color)) {
            color = parseInt(color.slice(1), 16);
            var r = (color & 0xf00) << 8;
            var g = (color & 0xf0) << 4;
            var b = color & 0xf;

            color = '#' + ((1 << 24) + (r << 4) + r + (g << 4) + g + (b << 4) + b).toString(16).slice(1);
        }
        // 或者使用以下正则替换，不过 chrome 下性能相对差点
        // color = color.replace(/^#([\da-f])([\da-f])([\da-f])$/i, '#$1$1$2$2$3$3');
        return color;
    }

    /**
     * 颜色加深或减淡，当level>0加深，当level<0减淡
     * @memberOf module:zrender/tool/color
     * @param {string} color 颜色
     * @param {number} level 升降程度,取值区间[-1,1]
     * @return {string} 加深或减淡后颜色值
     */
    function lift(color, level) {
        if (!isCalculableColor(color)) {
            return color;
        }
        var direct = level > 0 ? 1 : -1;
        if (typeof level === 'undefined') {
            level = 0;
        }
        level = Math.abs(level) > 1 ? 1 : Math.abs(level);
        color = toRGB(color);
        var data = getData(color);
        for (var i = 0; i < 3; i++) {
            if (direct === 1) {
                data[i] = data[i] * (1 - level) | 0;
            }
            else {
                data[i] = ((255 - data[i]) * level + data[i]) | 0;
            }
        }
        return 'rgb(' + data.join(',') + ')';
    }

    /**
     * 颜色翻转,[255-r,255-g,255-b,1-a]
     * @memberOf module:zrender/tool/color
     * @param {string} color 颜色
     * @return {string} 翻转颜色
     */
    function reverse(color) {
        if (!isCalculableColor(color)) {
            return color;
        }
        var data = getData(toRGBA(color));
        data = map(data,
            function(c) {
                return 255 - c;
            }
        );
        return toColor(data, 'rgb');
    }

    /**
     * 简单两种颜色混合
     * @memberOf module:zrender/tool/color
     * @param {string} color1 第一种颜色
     * @param {string} color2 第二种颜色
     * @param {number} weight 混合权重[0-1]
     * @return {string} 结果色,rgb(r,g,b)或rgba(r,g,b,a)
     */
    function mix(color1, color2, weight) {
        if (!isCalculableColor(color1) || !isCalculableColor(color2)) {
            return color1;
        }
        
        if (typeof weight === 'undefined') {
            weight = 0.5;
        }
        weight = 1 - adjust(weight, [ 0, 1 ]);

        var w = weight * 2 - 1;
        var data1 = getData(toRGBA(color1));
        var data2 = getData(toRGBA(color2));

        var d = data1[3] - data2[3];

        var weight1 = (((w * d === -1) ? w : (w + d) / (1 + w * d)) + 1) / 2;
        var weight2 = 1 - weight1;

        var data = [];

        for (var i = 0; i < 3; i++) {
            data[i] = data1[i] * weight1 + data2[i] * weight2;
        }

        var alpha = data1[3] * weight + data2[3] * (1 - weight);
        alpha = Math.max(0, Math.min(1, alpha));

        if (data1[3] === 1 && data2[3] === 1) {// 不考虑透明度
            return toColor(data, 'rgb');
        }
        data[3] = alpha;
        return toColor(data, 'rgba');
    }

    /**
     * 随机颜色
     * 
     * @return {string} 颜色值，#rrggbb格式
     */
    function random() {
        return '#' + (Math.random().toString(16) + '0000').slice(2, 8);
    }

    /**
     * 获取颜色值数组,返回值范围： <br/>
     * RGB 范围[0-255] <br/>
     * HSL/HSV/HSB 范围[0-1]<br/>
     * A透明度范围[0-1]
     * 支持格式：
     * #rgb
     * #rrggbb
     * rgb(r,g,b)
     * rgb(r%,g%,b%)
     * rgba(r,g,b,a)
     * hsb(h,s,b) // hsv与hsb等价
     * hsb(h%,s%,b%)
     * hsba(h,s,b,a)
     * hsl(h,s,l)
     * hsl(h%,s%,l%)
     * hsla(h,s,l,a)
     *
     * @param {string} color 颜色
     * @return {Array.<number>} 颜色值数组或null
     */
    function getData(color) {
        color = normalize(color);
        var r = color.match(colorRegExp);
        if (r === null) {
            throw new Error('The color format error'); // 颜色格式错误
        }
        var d;
        var a;
        var data = [];
        var rgb;

        if (r[2]) {
            // #rrggbb
            d = r[2].replace('#', '').split('');
            rgb = [ d[0] + d[1], d[2] + d[3], d[4] + d[5] ];
            data = map(rgb,
                function(c) {
                    return adjust(parseInt(c, 16), [ 0, 255 ]);
                }
            );

        }
        else if (r[4]) {
            // rgb rgba
            var rgba = (r[4]).split(',');
            a = rgba[3];
            rgb = rgba.slice(0, 3);
            data = map(
                rgb,
                function(c) {
                    c = Math.floor(
                        c.indexOf('%') > 0 ? parseInt(c, 0) * 2.55 : c
                    );
                    return adjust(c, [ 0, 255 ]);
                }
            );

            if (typeof a !== 'undefined') {
                data.push(adjust(parseFloat(a), [ 0, 1 ]));
            }
        }
        else if (r[5] || r[6]) {
            // hsb hsba hsl hsla
            var hsxa = (r[5] || r[6]).split(',');
            var h = parseInt(hsxa[0], 0) / 360;
            var s = hsxa[1];
            var x = hsxa[2];
            a = hsxa[3];
            data = map([ s, x ],
                function(c) {
                    return adjust(parseFloat(c) / 100, [ 0, 1 ]);
                }
            );
            data.unshift(h);
            if (typeof a !== 'undefined') {
                data.push(adjust(parseFloat(a), [ 0, 1 ]));
            }
        }
        return data;
    }

    /**
     * 设置颜色透明度
     * @memberOf module:zrender/tool/color
     * @param {string} color 颜色
     * @param {number} a 透明度,区间[0,1]
     * @return {string} rgba颜色值
     */
    function alpha(color, a) {
        if (!isCalculableColor(color)) {
            return color;
        }
        if (a === null) {
            a = 1;
        }
        var data = getData(toRGBA(color));
        data[3] = adjust(Number(a).toFixed(4), [ 0, 1 ]);

        return toColor(data, 'rgba');
    }

    // 数组映射
    function map(array, fun) {
        if (typeof fun !== 'function') {
            throw new TypeError();
        }
        var len = array ? array.length : 0;
        for (var i = 0; i < len; i++) {
            array[i] = fun(array[i]);
        }
        return array;
    }

    // 调整值区间
    function adjust(value, region) {
        // < to <= & > to >=
        // modify by linzhifeng 2014-05-25 because -0 == 0
        if (value <= region[0]) {
            value = region[0];
        }
        else if (value >= region[1]) {
            value = region[1];
        }
        return value;
    }
    
    function isCalculableColor(color) {
        return color instanceof Array || typeof color === 'string';
    }

    // 参见 http:// www.easyrgb.com/index.php?X=MATH
    function _HSV_2_RGB(data) {
        var H = data[0];
        var S = data[1];
        var V = data[2];
        // HSV from 0 to 1
        var R; 
        var G;
        var B;
        if (S === 0) {
            R = V * 255;
            G = V * 255;
            B = V * 255;
        }
        else {
            var h = H * 6;
            if (h === 6) {
                h = 0;
            }
            var i = h | 0;
            var v1 = V * (1 - S);
            var v2 = V * (1 - S * (h - i));
            var v3 = V * (1 - S * (1 - (h - i)));
            var r = 0;
            var g = 0;
            var b = 0;

            if (i === 0) {
                r = V;
                g = v3;
                b = v1;
            }
            else if (i === 1) {
                r = v2;
                g = V;
                b = v1;
            }
            else if (i === 2) {
                r = v1;
                g = V;
                b = v3;
            }
            else if (i === 3) {
                r = v1;
                g = v2;
                b = V;
            }
            else if (i === 4) {
                r = v3;
                g = v1;
                b = V;
            }
            else {
                r = V;
                g = v1;
                b = v2;
            }

            // RGB results from 0 to 255
            R = r * 255;
            G = g * 255;
            B = b * 255;
        }
        return [ R, G, B ];
    }

    function _HSL_2_RGB(data) {
        var H = data[0];
        var S = data[1];
        var L = data[2];
        // HSL from 0 to 1
        var R;
        var G;
        var B;
        if (S === 0) {
            R = L * 255;
            G = L * 255;
            B = L * 255;
        }
        else {
            var v2;
            if (L < 0.5) {
                v2 = L * (1 + S);
            }
            else {
                v2 = (L + S) - (S * L);
            }

            var v1 = 2 * L - v2;

            R = 255 * _HUE_2_RGB(v1, v2, H + (1 / 3));
            G = 255 * _HUE_2_RGB(v1, v2, H);
            B = 255 * _HUE_2_RGB(v1, v2, H - (1 / 3));
        }
        return [ R, G, B ];
    }

    function _HUE_2_RGB(v1, v2, vH) {
        if (vH < 0) {
            vH += 1;
        }
        if (vH > 1) {
            vH -= 1;
        }
        if ((6 * vH) < 1) {
            return (v1 + (v2 - v1) * 6 * vH);
        }
        if ((2 * vH) < 1) {
            return (v2);
        }
        if ((3 * vH) < 2) {
            return (v1 + (v2 - v1) * ((2 / 3) - vH) * 6);
        }
        return v1;
    }

    function _RGB_2_HSB(data) {
        // RGB from 0 to 255
        var R = (data[0] / 255);
        var G = (data[1] / 255);
        var B = (data[2] / 255);

        var vMin = Math.min(R, G, B); // Min. value of RGB
        var vMax = Math.max(R, G, B); // Max. value of RGB
        var delta = vMax - vMin; // Delta RGB value
        var V = vMax;
        var H;
        var S;

        // HSV results from 0 to 1
        if (delta === 0) {
            H = 0;
            S = 0;
        }
        else {
            S = delta / vMax;

            var deltaR = (((vMax - R) / 6) + (delta / 2)) / delta;
            var deltaG = (((vMax - G) / 6) + (delta / 2)) / delta;
            var deltaB = (((vMax - B) / 6) + (delta / 2)) / delta;

            if (R === vMax) {
                H = deltaB - deltaG;
            }
            else if (G === vMax) {
                H = (1 / 3) + deltaR - deltaB;
            }
            else if (B === vMax) {
                H = (2 / 3) + deltaG - deltaR;
            }

            if (H < 0) {
                H += 1;
            }
            if (H > 1) {
                H -= 1;
            }
        }
        H = H * 360;
        S = S * 100;
        V = V * 100;
        return [ H, S, V ];
    }

    function _RGB_2_HSL(data) {
        // RGB from 0 to 255
        var R = (data[0] / 255);
        var G = (data[1] / 255);
        var B = (data[2] / 255);

        var vMin = Math.min(R, G, B); // Min. value of RGB
        var vMax = Math.max(R, G, B); // Max. value of RGB
        var delta = vMax - vMin; // Delta RGB value

        var L = (vMax + vMin) / 2;
        var H;
        var S;
        // HSL results from 0 to 1
        if (delta === 0) {
            H = 0;
            S = 0;
        }
        else {
            if (L < 0.5) {
                S = delta / (vMax + vMin);
            }
            else {
                S = delta / (2 - vMax - vMin);
            }

            var deltaR = (((vMax - R) / 6) + (delta / 2)) / delta;
            var deltaG = (((vMax - G) / 6) + (delta / 2)) / delta;
            var deltaB = (((vMax - B) / 6) + (delta / 2)) / delta;

            if (R === vMax) {
                H = deltaB - deltaG;
            }
            else if (G === vMax) {
                H = (1 / 3) + deltaR - deltaB;
            }
            else if (B === vMax) {
                H = (2 / 3) + deltaG - deltaR;
            }

            if (H < 0) {
                H += 1;
            }

            if (H > 1) {
                H -= 1;
            }
        }

        H = H * 360;
        S = S * 100;
        L = L * 100;

        return [ H, S, L ];
    }

    return {
        customPalette : customPalette,
        resetPalette : resetPalette,
        getColor : getColor,
        getHighlightColor : getHighlightColor,
        customHighlight : customHighlight,
        resetHighlight : resetHighlight,
        getRadialGradient : getRadialGradient,
        getLinearGradient : getLinearGradient,
        getGradientColors : getGradientColors,
        getStepColors : getStepColors,
        reverse : reverse,
        mix : mix,
        lift : lift,
        trim : trim,
        random : random,
        toRGB : toRGB,
        toRGBA : toRGBA,
        toHex : toHex,
        toHSL : toHSL,
        toHSLA : toHSLA,
        toHSB : toHSB,
        toHSBA : toHSBA,
        toHSV : toHSV,
        toHSVA : toHSVA,
        toName : toName,
        toColor : toColor,
        toArray : toArray,
        alpha : alpha,
        getData : getData
    };
});


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3Rvb2wvY29sb3IuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiDpopzoibLovoXliqnmqKHlnZdcbiAqIEBtb2R1bGUgenJlbmRlci90b29sL2NvbG9yXG4gKi9cbmRlZmluZShmdW5jdGlvbihyZXF1aXJlKSB7XG4gICAgdmFyIHV0aWwgPSByZXF1aXJlKFsnLi4vdG9vbC91dGlsJ10pO1xuXG4gICAgdmFyIF9jdHg7XG5cbiAgICAvLyBDb2xvciBwYWxldHRlIGlzIGFuIGFycmF5IGNvbnRhaW5pbmcgdGhlIGRlZmF1bHQgY29sb3JzIGZvciB0aGUgY2hhcnQnc1xuICAgIC8vIHNlcmllcy5cbiAgICAvLyBXaGVuIGFsbCBjb2xvcnMgYXJlIHVzZWQsIG5ldyBjb2xvcnMgYXJlIHNlbGVjdGVkIGZyb20gdGhlIHN0YXJ0IGFnYWluLlxuICAgIC8vIERlZmF1bHRzIHRvOlxuICAgIC8vIOm7mOiupOiJsuadv1xuICAgIHZhciBwYWxldHRlID0gW1xuICAgICAgICAnI2ZmOTI3NycsICcgI2RkZGQwMCcsICcgI2ZmYzg3NycsICcgI2JiZTNmZicsICcgI2Q1ZmZiYicsXG4gICAgICAgICcjYmJiYmZmJywgJyAjZGRiMDAwJywgJyAjYjBkZDAwJywgJyAjZTJiYmZmJywgJyAjZmZiYmUzJyxcbiAgICAgICAgJyNmZjc3NzcnLCAnICNmZjk5MDAnLCAnICM4M2RkMDAnLCAnICM3N2UzZmYnLCAnICM3NzhmZmYnLFxuICAgICAgICAnI2M4NzdmZicsICcgI2ZmNzdhYicsICcgI2ZmNjYwMCcsICcgI2FhODgwMCcsICcgIzc3YzdmZicsXG4gICAgICAgICcjYWQ3N2ZmJywgJyAjZmY3N2ZmJywgJyAjZGQwMDgzJywgJyAjNzc3NzAwJywgJyAjMDBhYTAwJyxcbiAgICAgICAgJyMwMDg4YWEnLCAnICM4NDAwZGQnLCAnICNhYTAwODgnLCAnICNkZDAwMDAnLCAnICM3NzJlMDAnXG4gICAgXTtcbiAgICB2YXIgX3BhbGV0dGUgPSBwYWxldHRlO1xuXG4gICAgdmFyIGhpZ2hsaWdodENvbG9yID0gJ3JnYmEoMjU1LDI1NSwwLDAuNSknO1xuICAgIHZhciBfaGlnaGxpZ2h0Q29sb3IgPSBoaWdobGlnaHRDb2xvcjtcblxuICAgIC8vIOminOiJsuagvOW8j1xuICAgIC8qanNoaW50IG1heGxlbjogMzMwICovXG4gICAgdmFyIGNvbG9yUmVnRXhwID0gL15cXHMqKCgjW2EtZlxcZF17Nn0pfCgjW2EtZlxcZF17M30pfHJnYmE/XFwoXFxzKihbXFxkXFwuXSslP1xccyosXFxzKltcXGRcXC5dKyU/XFxzKixcXHMqW1xcZFxcLl0rJT8oPzpcXHMqLFxccypbXFxkXFwuXSslPyk/KVxccypcXCl8aHNiYT9cXChcXHMqKFtcXGRcXC5dKyg/OmRlZ3xcXHhiMHwlKT9cXHMqLFxccypbXFxkXFwuXSslP1xccyosXFxzKltcXGRcXC5dKyU/KD86XFxzKixcXHMqW1xcZFxcLl0rKT8pJT9cXHMqXFwpfGhzbGE/XFwoXFxzKihbXFxkXFwuXSsoPzpkZWd8XFx4YjB8JSk/XFxzKixcXHMqW1xcZFxcLl0rJT9cXHMqLFxccypbXFxkXFwuXSslPyg/OlxccyosXFxzKltcXGRcXC5dKyk/KSU/XFxzKlxcKSlcXHMqJC9pO1xuXG4gICAgdmFyIF9uYW1lQ29sb3JzID0ge1xuICAgICAgICBhbGljZWJsdWUgOiAnI2YwZjhmZicsXG4gICAgICAgIGFudGlxdWV3aGl0ZSA6ICcjZmFlYmQ3JyxcbiAgICAgICAgYXF1YSA6ICcjMGZmJyxcbiAgICAgICAgYXF1YW1hcmluZSA6ICcjN2ZmZmQ0JyxcbiAgICAgICAgYXp1cmUgOiAnI2YwZmZmZicsXG4gICAgICAgIGJlaWdlIDogJyNmNWY1ZGMnLFxuICAgICAgICBiaXNxdWUgOiAnI2ZmZTRjNCcsXG4gICAgICAgIGJsYWNrIDogJyMwMDAnLFxuICAgICAgICBibGFuY2hlZGFsbW9uZCA6ICcjZmZlYmNkJyxcbiAgICAgICAgYmx1ZSA6ICcjMDBmJyxcbiAgICAgICAgYmx1ZXZpb2xldCA6ICcjOGEyYmUyJyxcbiAgICAgICAgYnJvd24gOiAnI2E1MmEyYScsXG4gICAgICAgIGJ1cmx5d29vZCA6ICcjZGViODg3JyxcbiAgICAgICAgY2FkZXRibHVlIDogJyM1ZjllYTAnLFxuICAgICAgICBjaGFydHJldXNlIDogJyM3ZmZmMDAnLFxuICAgICAgICBjaG9jb2xhdGUgOiAnI2QyNjkxZScsXG4gICAgICAgIGNvcmFsIDogJyNmZjdmNTAnLFxuICAgICAgICBjb3JuZmxvd2VyYmx1ZSA6ICcjNjQ5NWVkJyxcbiAgICAgICAgY29ybnNpbGsgOiAnI2ZmZjhkYycsXG4gICAgICAgIGNyaW1zb24gOiAnI2RjMTQzYycsXG4gICAgICAgIGN5YW4gOiAnIzBmZicsXG4gICAgICAgIGRhcmtibHVlIDogJyMwMDAwOGInLFxuICAgICAgICBkYXJrY3lhbiA6ICcjMDA4YjhiJyxcbiAgICAgICAgZGFya2dvbGRlbnJvZCA6ICcjYjg4NjBiJyxcbiAgICAgICAgZGFya2dyYXkgOiAnI2E5YTlhOScsXG4gICAgICAgIGRhcmtncmV5IDogJyNhOWE5YTknLFxuICAgICAgICBkYXJrZ3JlZW4gOiAnIzAwNjQwMCcsXG4gICAgICAgIGRhcmtraGFraSA6ICcjYmRiNzZiJyxcbiAgICAgICAgZGFya21hZ2VudGEgOiAnIzhiMDA4YicsXG4gICAgICAgIGRhcmtvbGl2ZWdyZWVuIDogJyM1NTZiMmYnLFxuICAgICAgICBkYXJrb3JhbmdlIDogJyNmZjhjMDAnLFxuICAgICAgICBkYXJrb3JjaGlkIDogJyM5OTMyY2MnLFxuICAgICAgICBkYXJrcmVkIDogJyM4YjAwMDAnLFxuICAgICAgICBkYXJrc2FsbW9uIDogJyNlOTk2N2EnLFxuICAgICAgICBkYXJrc2VhZ3JlZW4gOiAnIzhmYmM4ZicsXG4gICAgICAgIGRhcmtzbGF0ZWJsdWUgOiAnIzQ4M2Q4YicsXG4gICAgICAgIGRhcmtzbGF0ZWdyYXkgOiAnIzJmNGY0ZicsXG4gICAgICAgIGRhcmtzbGF0ZWdyZXkgOiAnIzJmNGY0ZicsXG4gICAgICAgIGRhcmt0dXJxdW9pc2UgOiAnIzAwY2VkMScsXG4gICAgICAgIGRhcmt2aW9sZXQgOiAnIzk0MDBkMycsXG4gICAgICAgIGRlZXBwaW5rIDogJyNmZjE0OTMnLFxuICAgICAgICBkZWVwc2t5Ymx1ZSA6ICcjMDBiZmZmJyxcbiAgICAgICAgZGltZ3JheSA6ICcjNjk2OTY5JyxcbiAgICAgICAgZGltZ3JleSA6ICcjNjk2OTY5JyxcbiAgICAgICAgZG9kZ2VyYmx1ZSA6ICcjMWU5MGZmJyxcbiAgICAgICAgZmlyZWJyaWNrIDogJyNiMjIyMjInLFxuICAgICAgICBmbG9yYWx3aGl0ZSA6ICcjZmZmYWYwJyxcbiAgICAgICAgZm9yZXN0Z3JlZW4gOiAnIzIyOGIyMicsXG4gICAgICAgIGZ1Y2hzaWEgOiAnI2YwZicsXG4gICAgICAgIGdhaW5zYm9ybyA6ICcjZGNkY2RjJyxcbiAgICAgICAgZ2hvc3R3aGl0ZSA6ICcjZjhmOGZmJyxcbiAgICAgICAgZ29sZCA6ICcjZmZkNzAwJyxcbiAgICAgICAgZ29sZGVucm9kIDogJyNkYWE1MjAnLFxuICAgICAgICBncmF5IDogJyM4MDgwODAnLFxuICAgICAgICBncmV5IDogJyM4MDgwODAnLFxuICAgICAgICBncmVlbiA6ICcjMDA4MDAwJyxcbiAgICAgICAgZ3JlZW55ZWxsb3cgOiAnI2FkZmYyZicsXG4gICAgICAgIGhvbmV5ZGV3IDogJyNmMGZmZjAnLFxuICAgICAgICBob3RwaW5rIDogJyNmZjY5YjQnLFxuICAgICAgICBpbmRpYW5yZWQgOiAnI2NkNWM1YycsXG4gICAgICAgIGluZGlnbyA6ICcjNGIwMDgyJyxcbiAgICAgICAgaXZvcnkgOiAnI2ZmZmZmMCcsXG4gICAgICAgIGtoYWtpIDogJyNmMGU2OGMnLFxuICAgICAgICBsYXZlbmRlciA6ICcjZTZlNmZhJyxcbiAgICAgICAgbGF2ZW5kZXJibHVzaCA6ICcjZmZmMGY1JyxcbiAgICAgICAgbGF3bmdyZWVuIDogJyM3Y2ZjMDAnLFxuICAgICAgICBsZW1vbmNoaWZmb24gOiAnI2ZmZmFjZCcsXG4gICAgICAgIGxpZ2h0Ymx1ZSA6ICcjYWRkOGU2JyxcbiAgICAgICAgbGlnaHRjb3JhbCA6ICcjZjA4MDgwJyxcbiAgICAgICAgbGlnaHRjeWFuIDogJyNlMGZmZmYnLFxuICAgICAgICBsaWdodGdvbGRlbnJvZHllbGxvdyA6ICcjZmFmYWQyJyxcbiAgICAgICAgbGlnaHRncmF5IDogJyNkM2QzZDMnLFxuICAgICAgICBsaWdodGdyZXkgOiAnI2QzZDNkMycsXG4gICAgICAgIGxpZ2h0Z3JlZW4gOiAnIzkwZWU5MCcsXG4gICAgICAgIGxpZ2h0cGluayA6ICcjZmZiNmMxJyxcbiAgICAgICAgbGlnaHRzYWxtb24gOiAnI2ZmYTA3YScsXG4gICAgICAgIGxpZ2h0c2VhZ3JlZW4gOiAnIzIwYjJhYScsXG4gICAgICAgIGxpZ2h0c2t5Ymx1ZSA6ICcjODdjZWZhJyxcbiAgICAgICAgbGlnaHRzbGF0ZWdyYXkgOiAnIzc4OScsXG4gICAgICAgIGxpZ2h0c2xhdGVncmV5IDogJyM3ODknLFxuICAgICAgICBsaWdodHN0ZWVsYmx1ZSA6ICcjYjBjNGRlJyxcbiAgICAgICAgbGlnaHR5ZWxsb3cgOiAnI2ZmZmZlMCcsXG4gICAgICAgIGxpbWUgOiAnIzBmMCcsXG4gICAgICAgIGxpbWVncmVlbiA6ICcjMzJjZDMyJyxcbiAgICAgICAgbGluZW4gOiAnI2ZhZjBlNicsXG4gICAgICAgIG1hZ2VudGEgOiAnI2YwZicsXG4gICAgICAgIG1hcm9vbiA6ICcjODAwMDAwJyxcbiAgICAgICAgbWVkaXVtYXF1YW1hcmluZSA6ICcjNjZjZGFhJyxcbiAgICAgICAgbWVkaXVtYmx1ZSA6ICcjMDAwMGNkJyxcbiAgICAgICAgbWVkaXVtb3JjaGlkIDogJyNiYTU1ZDMnLFxuICAgICAgICBtZWRpdW1wdXJwbGUgOiAnIzkzNzBkOCcsXG4gICAgICAgIG1lZGl1bXNlYWdyZWVuIDogJyMzY2IzNzEnLFxuICAgICAgICBtZWRpdW1zbGF0ZWJsdWUgOiAnIzdiNjhlZScsXG4gICAgICAgIG1lZGl1bXNwcmluZ2dyZWVuIDogJyMwMGZhOWEnLFxuICAgICAgICBtZWRpdW10dXJxdW9pc2UgOiAnIzQ4ZDFjYycsXG4gICAgICAgIG1lZGl1bXZpb2xldHJlZCA6ICcjYzcxNTg1JyxcbiAgICAgICAgbWlkbmlnaHRibHVlIDogJyMxOTE5NzAnLFxuICAgICAgICBtaW50Y3JlYW0gOiAnI2Y1ZmZmYScsXG4gICAgICAgIG1pc3R5cm9zZSA6ICcjZmZlNGUxJyxcbiAgICAgICAgbW9jY2FzaW4gOiAnI2ZmZTRiNScsXG4gICAgICAgIG5hdmFqb3doaXRlIDogJyNmZmRlYWQnLFxuICAgICAgICBuYXZ5IDogJyMwMDAwODAnLFxuICAgICAgICBvbGRsYWNlIDogJyNmZGY1ZTYnLFxuICAgICAgICBvbGl2ZSA6ICcjODA4MDAwJyxcbiAgICAgICAgb2xpdmVkcmFiIDogJyM2YjhlMjMnLFxuICAgICAgICBvcmFuZ2UgOiAnI2ZmYTUwMCcsXG4gICAgICAgIG9yYW5nZXJlZCA6ICcjZmY0NTAwJyxcbiAgICAgICAgb3JjaGlkIDogJyNkYTcwZDYnLFxuICAgICAgICBwYWxlZ29sZGVucm9kIDogJyNlZWU4YWEnLFxuICAgICAgICBwYWxlZ3JlZW4gOiAnIzk4ZmI5OCcsXG4gICAgICAgIHBhbGV0dXJxdW9pc2UgOiAnI2FmZWVlZScsXG4gICAgICAgIHBhbGV2aW9sZXRyZWQgOiAnI2Q4NzA5MycsXG4gICAgICAgIHBhcGF5YXdoaXAgOiAnI2ZmZWZkNScsXG4gICAgICAgIHBlYWNocHVmZiA6ICcjZmZkYWI5JyxcbiAgICAgICAgcGVydSA6ICcjY2Q4NTNmJyxcbiAgICAgICAgcGluayA6ICcjZmZjMGNiJyxcbiAgICAgICAgcGx1bSA6ICcjZGRhMGRkJyxcbiAgICAgICAgcG93ZGVyYmx1ZSA6ICcjYjBlMGU2JyxcbiAgICAgICAgcHVycGxlIDogJyM4MDAwODAnLFxuICAgICAgICByZWQgOiAnI2YwMCcsXG4gICAgICAgIHJvc3licm93biA6ICcjYmM4ZjhmJyxcbiAgICAgICAgcm95YWxibHVlIDogJyM0MTY5ZTEnLFxuICAgICAgICBzYWRkbGVicm93biA6ICcjOGI0NTEzJyxcbiAgICAgICAgc2FsbW9uIDogJyNmYTgwNzInLFxuICAgICAgICBzYW5keWJyb3duIDogJyNmNGE0NjAnLFxuICAgICAgICBzZWFncmVlbiA6ICcjMmU4YjU3JyxcbiAgICAgICAgc2Vhc2hlbGwgOiAnI2ZmZjVlZScsXG4gICAgICAgIHNpZW5uYSA6ICcjYTA1MjJkJyxcbiAgICAgICAgc2lsdmVyIDogJyNjMGMwYzAnLFxuICAgICAgICBza3libHVlIDogJyM4N2NlZWInLFxuICAgICAgICBzbGF0ZWJsdWUgOiAnIzZhNWFjZCcsXG4gICAgICAgIHNsYXRlZ3JheSA6ICcjNzA4MDkwJyxcbiAgICAgICAgc2xhdGVncmV5IDogJyM3MDgwOTAnLFxuICAgICAgICBzbm93IDogJyNmZmZhZmEnLFxuICAgICAgICBzcHJpbmdncmVlbiA6ICcjMDBmZjdmJyxcbiAgICAgICAgc3RlZWxibHVlIDogJyM0NjgyYjQnLFxuICAgICAgICB0YW4gOiAnI2QyYjQ4YycsXG4gICAgICAgIHRlYWwgOiAnIzAwODA4MCcsXG4gICAgICAgIHRoaXN0bGUgOiAnI2Q4YmZkOCcsXG4gICAgICAgIHRvbWF0byA6ICcjZmY2MzQ3JyxcbiAgICAgICAgdHVycXVvaXNlIDogJyM0MGUwZDAnLFxuICAgICAgICB2aW9sZXQgOiAnI2VlODJlZScsXG4gICAgICAgIHdoZWF0IDogJyNmNWRlYjMnLFxuICAgICAgICB3aGl0ZSA6ICcjZmZmJyxcbiAgICAgICAgd2hpdGVzbW9rZSA6ICcjZjVmNWY1JyxcbiAgICAgICAgeWVsbG93IDogJyNmZjAnLFxuICAgICAgICB5ZWxsb3dncmVlbiA6ICcjOWFjZDMyJ1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiDoh6rlrprkuYnosIPoibLmnb9cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBjdXN0b21QYWxldHRlKHVzZXJQYWxldGUpIHtcbiAgICAgICAgcGFsZXR0ZSA9IHVzZXJQYWxldGU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5aSN5L2N6buY6K6k6Imy5p2/XG4gICAgICovXG4gICAgZnVuY3Rpb24gcmVzZXRQYWxldHRlKCkge1xuICAgICAgICBwYWxldHRlID0gX3BhbGV0dGU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6I635Y+W6Imy5p2/6aKc6ImyXG4gICAgICogQG1lbWJlck9mIG1vZHVsZTp6cmVuZGVyL3Rvb2wvY29sb3JcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gaWR4IOiJsuadv+S9jee9rlxuICAgICAqIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IFt1c2VyUGFsZXRlXSDoh6rlrprkuYnoibLmnb9cbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IOminOiJslxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGdldENvbG9yKGlkeCwgdXNlclBhbGV0ZSkge1xuICAgICAgICBpZHggPSBpZHggfCAwO1xuICAgICAgICB1c2VyUGFsZXRlID0gdXNlclBhbGV0ZSB8fCBwYWxldHRlO1xuICAgICAgICByZXR1cm4gdXNlclBhbGV0ZVtpZHggJSB1c2VyUGFsZXRlLmxlbmd0aF07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6Ieq5a6a5LmJ6buY6K6k6auY5Lqu6aKc6ImyXG4gICAgICovXG4gICAgZnVuY3Rpb24gY3VzdG9tSGlnaGxpZ2h0KHVzZXJIaWdobGlnaHRDb2xvcikge1xuICAgICAgICBoaWdobGlnaHRDb2xvciA9IHVzZXJIaWdobGlnaHRDb2xvcjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDph43nva7pu5jorqTpq5jkuq7popzoibJcbiAgICAgKi9cbiAgICBmdW5jdGlvbiByZXNldEhpZ2hsaWdodCgpIHtcbiAgICAgICAgX2hpZ2hsaWdodENvbG9yID0gaGlnaGxpZ2h0Q29sb3I7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6I635Y+W6buY6K6k6auY5Lqu6aKc6ImyXG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2V0SGlnaGxpZ2h0Q29sb3IoKSB7XG4gICAgICAgIHJldHVybiBoaWdobGlnaHRDb2xvcjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlvoTlkJHmuJDlj5hcbiAgICAgKiBAbWVtYmVyT2YgbW9kdWxlOnpyZW5kZXIvdG9vbC9jb2xvclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB4MCDmuJDlj5jotbfngrlcbiAgICAgKiBAcGFyYW0ge251bWJlcn0geTBcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gcjBcbiAgICAgKiBAcGFyYW0ge251bWJlcn0geDEg5riQ5Y+Y57uI54K5XG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHkxXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHIxXG4gICAgICogQHBhcmFtIHtBcnJheX0gY29sb3JMaXN0IOminOiJsuWIl+ihqFxuICAgICAqIEByZXR1cm4ge0NhbnZhc0dyYWRpZW50fVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGdldFJhZGlhbEdyYWRpZW50KHgwLCB5MCwgcjAsIHgxLCB5MSwgcjEsIGNvbG9yTGlzdCkge1xuICAgICAgICBpZiAoIV9jdHgpIHtcbiAgICAgICAgICAgIF9jdHggPSB1dGlsLmdldENvbnRleHQoKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZ3JhZGllbnQgPSBfY3R4LmNyZWF0ZVJhZGlhbEdyYWRpZW50KHgwLCB5MCwgcjAsIHgxLCB5MSwgcjEpO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGNvbG9yTGlzdC5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIGdyYWRpZW50LmFkZENvbG9yU3RvcChjb2xvckxpc3RbaV1bMF0sIGNvbG9yTGlzdFtpXVsxXSk7XG4gICAgICAgIH1cbiAgICAgICAgZ3JhZGllbnQuX19ub25SZWN1cnNpb24gPSB0cnVlO1xuICAgICAgICByZXR1cm4gZ3JhZGllbnQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog57q/5oCn5riQ5Y+YXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHgwIOa4kOWPmOi1t+eCuVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSB5MFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSB4MSDmuJDlj5jnu4jngrlcbiAgICAgKiBAcGFyYW0ge09iamVjdH0geTFcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBjb2xvckxpc3Qg6aKc6Imy5YiX6KGoXG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2V0TGluZWFyR3JhZGllbnQoeDAsIHkwLCB4MSwgeTEsIGNvbG9yTGlzdCkge1xuICAgICAgICBpZiAoIV9jdHgpIHtcbiAgICAgICAgICAgIF9jdHggPSB1dGlsLmdldENvbnRleHQoKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZ3JhZGllbnQgPSBfY3R4LmNyZWF0ZUxpbmVhckdyYWRpZW50KHgwLCB5MCwgeDEsIHkxKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBjb2xvckxpc3QubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICBncmFkaWVudC5hZGRDb2xvclN0b3AoY29sb3JMaXN0W2ldWzBdLCBjb2xvckxpc3RbaV1bMV0pO1xuICAgICAgICB9XG4gICAgICAgIGdyYWRpZW50Ll9fbm9uUmVjdXJzaW9uID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIGdyYWRpZW50O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOiOt+WPluS4pOenjeminOiJsuS5i+mXtOa4kOWPmOminOiJsuaVsOe7hFxuICAgICAqIEBwYXJhbSB7Y29sb3J9IHN0YXJ0IOi1t+Wni+minOiJslxuICAgICAqIEBwYXJhbSB7Y29sb3J9IGVuZCDnu5PmnZ/popzoibJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gc3RlcCDmuJDlj5jnuqfmlbBcbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gIOminOiJsuaVsOe7hFxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGdldFN0ZXBDb2xvcnMoc3RhcnQsIGVuZCwgc3RlcCkge1xuICAgICAgICBzdGFydCA9IHRvUkdCQShzdGFydCk7XG4gICAgICAgIGVuZCA9IHRvUkdCQShlbmQpO1xuICAgICAgICBzdGFydCA9IGdldERhdGEoc3RhcnQpO1xuICAgICAgICBlbmQgPSBnZXREYXRhKGVuZCk7XG5cbiAgICAgICAgdmFyIGNvbG9ycyA9IFtdO1xuICAgICAgICB2YXIgc3RlcFIgPSAoZW5kWzBdIC0gc3RhcnRbMF0pIC8gc3RlcDtcbiAgICAgICAgdmFyIHN0ZXBHID0gKGVuZFsxXSAtIHN0YXJ0WzFdKSAvIHN0ZXA7XG4gICAgICAgIHZhciBzdGVwQiA9IChlbmRbMl0gLSBzdGFydFsyXSkgLyBzdGVwO1xuICAgICAgICB2YXIgc3RlcEEgPSAoZW5kWzNdIC0gc3RhcnRbM10pIC8gc3RlcDtcbiAgICAgICAgLy8g55Sf5oiQ6aKc6Imy6ZuG5ZCIXG4gICAgICAgIC8vIGZpeCBieSBsaW5mZW5nIOminOiJsuWghuenr1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgciA9IHN0YXJ0WzBdLCBnID0gc3RhcnRbMV0sIGIgPSBzdGFydFsyXSwgYSA9IHN0YXJ0WzNdOyBpIDwgc3RlcDsgaSsrKSB7XG4gICAgICAgICAgICBjb2xvcnNbaV0gPSB0b0NvbG9yKFtcbiAgICAgICAgICAgICAgICBhZGp1c3QoTWF0aC5mbG9vcihyKSwgWyAwLCAyNTUgXSksXG4gICAgICAgICAgICAgICAgYWRqdXN0KE1hdGguZmxvb3IoZyksIFsgMCwgMjU1IF0pLCBcbiAgICAgICAgICAgICAgICBhZGp1c3QoTWF0aC5mbG9vcihiKSwgWyAwLCAyNTUgXSksXG4gICAgICAgICAgICAgICAgYS50b0ZpeGVkKDQpIC0gMFxuICAgICAgICAgICAgXSwncmdiYScpO1xuICAgICAgICAgICAgciArPSBzdGVwUjtcbiAgICAgICAgICAgIGcgKz0gc3RlcEc7XG4gICAgICAgICAgICBiICs9IHN0ZXBCO1xuICAgICAgICAgICAgYSArPSBzdGVwQTtcbiAgICAgICAgfVxuICAgICAgICByID0gZW5kWzBdO1xuICAgICAgICBnID0gZW5kWzFdO1xuICAgICAgICBiID0gZW5kWzJdO1xuICAgICAgICBhID0gZW5kWzNdO1xuICAgICAgICBjb2xvcnNbaV0gPSB0b0NvbG9yKFtyLCBnLCBiLCBhXSwgJ3JnYmEnKTtcbiAgICAgICAgcmV0dXJuIGNvbG9ycztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDojrflj5bmjIflrprnuqfmlbDnmoTmuJDlj5jpopzoibLmlbDnu4RcbiAgICAgKiBAbWVtYmVyT2YgbW9kdWxlOnpyZW5kZXIvdG9vbC9jb2xvclxuICAgICAqIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IGNvbG9ycyDpopzoibLnu4RcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW3N0ZXA9MjBdIOa4kOWPmOe6p+aVsFxuICAgICAqIEByZXR1cm4ge0FycmF5LjxzdHJpbmc+fSAg6aKc6Imy5pWw57uEXG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2V0R3JhZGllbnRDb2xvcnMoY29sb3JzLCBzdGVwKSB7XG4gICAgICAgIHZhciByZXQgPSBbXTtcbiAgICAgICAgdmFyIGxlbiA9IGNvbG9ycy5sZW5ndGg7XG4gICAgICAgIGlmIChzdGVwID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHN0ZXAgPSAyMDtcbiAgICAgICAgfVxuICAgICAgICBpZiAobGVuID09PSAxKSB7XG4gICAgICAgICAgICByZXQgPSBnZXRTdGVwQ29sb3JzKGNvbG9yc1swXSwgY29sb3JzWzBdLCBzdGVwKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChsZW4gPiAxKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbiA9IGxlbiAtIDE7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RlcHMgPSBnZXRTdGVwQ29sb3JzKGNvbG9yc1tpXSwgY29sb3JzW2kgKyAxXSwgc3RlcCk7XG4gICAgICAgICAgICAgICAgaWYgKGkgPCBuIC0gMSkge1xuICAgICAgICAgICAgICAgICAgICBzdGVwcy5wb3AoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0ID0gcmV0LmNvbmNhdChzdGVwcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDpopzoibLlgLzmlbDnu4TovazkuLrmjIflrprmoLzlvI/popzoibIs5L6L5aaCOjxici8+XG4gICAgICogZGF0YSA9IFs2MCwyMCwyMCwwLjFdIGZvcm1hdCA9ICdyZ2JhJ1xuICAgICAqIOi/lOWbnu+8mnJnYmEoNjAsMjAsMjAsMC4xKVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGRhdGEg6aKc6Imy5YC85pWw57uEXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGZvcm1hdCDmoLzlvI8s6buY6K6kcmdiXG4gICAgICogQHJldHVybiB7c3RyaW5nfSDpopzoibJcbiAgICAgKi9cbiAgICBmdW5jdGlvbiB0b0NvbG9yKGRhdGEsIGZvcm1hdCkge1xuICAgICAgICBmb3JtYXQgPSBmb3JtYXQgfHwgJ3JnYic7XG4gICAgICAgIGlmIChkYXRhICYmIChkYXRhLmxlbmd0aCA9PT0gMyB8fCBkYXRhLmxlbmd0aCA9PT0gNCkpIHtcbiAgICAgICAgICAgIGRhdGEgPSBtYXAoZGF0YSxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbihjKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjID4gMSA/IE1hdGguY2VpbChjKSA6IGM7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCdoZXgnKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICcjJyArICgoMSA8PCAyNCkgKyAoZGF0YVswXSA8PCAxNikgKyAoZGF0YVsxXSA8PCA4KSArICgrZGF0YVsyXSkpLnRvU3RyaW5nKDE2KS5zbGljZSgxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGZvcm1hdC5pbmRleE9mKCdocycpID4gLTEpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3ggPSBtYXAoZGF0YS5zbGljZSgxLCAzKSxcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24oYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGMgKyAnJSc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGRhdGFbMV0gPSBzeFswXTtcbiAgICAgICAgICAgICAgICBkYXRhWzJdID0gc3hbMV07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChmb3JtYXQuaW5kZXhPZignYScpID4gLTEpIHtcbiAgICAgICAgICAgICAgICBpZiAoZGF0YS5sZW5ndGggPT09IDMpIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YS5wdXNoKDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBkYXRhWzNdID0gYWRqdXN0KGRhdGFbM10sIFsgMCwgMSBdKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZm9ybWF0ICsgJygnICsgZGF0YS5zbGljZSgwLCA0KS5qb2luKCcsJykgKyAnKSc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBmb3JtYXQgKyAnKCcgKyBkYXRhLnNsaWNlKDAsIDMpLmpvaW4oJywnKSArICcpJztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOminOiJsuWtl+espuS4sui9rOaNouS4unJnYmHmlbDnu4RcbiAgICAgKiBAbWVtYmVyT2YgbW9kdWxlOnpyZW5kZXIvdG9vbC9jb2xvclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb2xvciDpopzoibJcbiAgICAgKiBAcmV0dXJuIHtBcnJheS48bnVtYmVyPn0g6aKc6Imy5YC85pWw57uEXG4gICAgICovXG4gICAgZnVuY3Rpb24gdG9BcnJheShjb2xvcikge1xuICAgICAgICBjb2xvciA9IHRyaW0oY29sb3IpO1xuICAgICAgICBpZiAoY29sb3IuaW5kZXhPZigncmdiYScpIDwgMCkge1xuICAgICAgICAgICAgY29sb3IgPSB0b1JHQkEoY29sb3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGRhdGEgPSBbXTtcbiAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICBjb2xvci5yZXBsYWNlKC9bXFxkLl0rL2csIGZ1bmN0aW9uIChuKSB7XG4gICAgICAgICAgICBpZiAoaSA8IDMpIHtcbiAgICAgICAgICAgICAgICBuID0gbiB8IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBBbHBoYVxuICAgICAgICAgICAgICAgIG4gPSArbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRhdGFbaSsrXSA9IG47XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGF0YTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDpopzoibLmoLzlvI/ovazljJZcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb2xvciDpopzoibLlgLzmlbDnu4RcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZm9ybWF0IOagvOW8jyzpu5jorqRyZ2JcbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IOminOiJslxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGNvbnZlcnQoY29sb3IsIGZvcm1hdCkge1xuICAgICAgICBpZiAoIWlzQ2FsY3VsYWJsZUNvbG9yKGNvbG9yKSkge1xuICAgICAgICAgICAgcmV0dXJuIGNvbG9yO1xuICAgICAgICB9XG4gICAgICAgIHZhciBkYXRhID0gZ2V0RGF0YShjb2xvcik7XG4gICAgICAgIHZhciBhbHBoYSA9IGRhdGFbM107XG4gICAgICAgIGlmICh0eXBlb2YgYWxwaGEgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBhbHBoYSA9IDE7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29sb3IuaW5kZXhPZignaHNiJykgPiAtMSkge1xuICAgICAgICAgICAgZGF0YSA9IF9IU1ZfMl9SR0IoZGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoY29sb3IuaW5kZXhPZignaHNsJykgPiAtMSkge1xuICAgICAgICAgICAgZGF0YSA9IF9IU0xfMl9SR0IoZGF0YSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJ2hzYicpID4gLTEgfHwgZm9ybWF0LmluZGV4T2YoJ2hzdicpID4gLTEpIHtcbiAgICAgICAgICAgIGRhdGEgPSBfUkdCXzJfSFNCKGRhdGEpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGZvcm1hdC5pbmRleE9mKCdoc2wnKSA+IC0xKSB7XG4gICAgICAgICAgICBkYXRhID0gX1JHQl8yX0hTTChkYXRhKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGRhdGFbM10gPSBhbHBoYTtcblxuICAgICAgICByZXR1cm4gdG9Db2xvcihkYXRhLCBmb3JtYXQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOi9rOaNouS4unJnYmHmoLzlvI/nmoTpopzoibJcbiAgICAgKiBAbWVtYmVyT2YgbW9kdWxlOnpyZW5kZXIvdG9vbC9jb2xvclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb2xvciDpopzoibJcbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IHJnYmHpopzoibLvvIxyZ2JhKHIsZyxiLGEpXG4gICAgICovXG4gICAgZnVuY3Rpb24gdG9SR0JBKGNvbG9yKSB7XG4gICAgICAgIHJldHVybiBjb252ZXJ0KGNvbG9yLCAncmdiYScpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOi9rOaNouS4unJnYuaVsOWtl+agvOW8j+eahOminOiJslxuICAgICAqIEBtZW1iZXJPZiBtb2R1bGU6enJlbmRlci90b29sL2NvbG9yXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNvbG9yIOminOiJslxuICAgICAqIEByZXR1cm4ge3N0cmluZ30gcmdi6aKc6Imy77yMcmdiKDAsMCwwKeagvOW8j1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIHRvUkdCKGNvbG9yKSB7XG4gICAgICAgIHJldHVybiBjb252ZXJ0KGNvbG9yLCAncmdiJyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6L2s5o2i5Li6MTbov5vliLbpopzoibJcbiAgICAgKiBAbWVtYmVyT2YgbW9kdWxlOnpyZW5kZXIvdG9vbC9jb2xvclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb2xvciDpopzoibJcbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IDE26L+b5Yi26aKc6Imy77yMI3JyZ2diYuagvOW8j1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIHRvSGV4KGNvbG9yKSB7XG4gICAgICAgIHJldHVybiBjb252ZXJ0KGNvbG9yLCAnaGV4Jyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6L2s5o2i5Li6SFNW6aKc6ImyXG4gICAgICogQG1lbWJlck9mIG1vZHVsZTp6cmVuZGVyL3Rvb2wvY29sb3JcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29sb3Ig6aKc6ImyXG4gICAgICogQHJldHVybiB7c3RyaW5nfSBIU1ZB6aKc6Imy77yMaHN2YShoLHMsdixhKVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHRvSFNWQShjb2xvcikge1xuICAgICAgICByZXR1cm4gY29udmVydChjb2xvciwgJ2hzdmEnKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDovazmjaLkuLpIU1bpopzoibJcbiAgICAgKiBAbWVtYmVyT2YgbW9kdWxlOnpyZW5kZXIvdG9vbC9jb2xvclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb2xvciDpopzoibJcbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IEhTVuminOiJsu+8jGhzdihoLHMsdilcbiAgICAgKi9cbiAgICBmdW5jdGlvbiB0b0hTVihjb2xvcikge1xuICAgICAgICByZXR1cm4gY29udmVydChjb2xvciwgJ2hzdicpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOi9rOaNouS4ukhTQkHpopzoibJcbiAgICAgKiBAbWVtYmVyT2YgbW9kdWxlOnpyZW5kZXIvdG9vbC9jb2xvclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb2xvciDpopzoibJcbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IEhTQkHpopzoibLvvIxoc2JhKGgscyxiLGEpXG4gICAgICovXG4gICAgZnVuY3Rpb24gdG9IU0JBKGNvbG9yKSB7XG4gICAgICAgIHJldHVybiBjb252ZXJ0KGNvbG9yLCAnaHNiYScpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOi9rOaNouS4ukhTQuminOiJslxuICAgICAqIEBtZW1iZXJPZiBtb2R1bGU6enJlbmRlci90b29sL2NvbG9yXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNvbG9yIOminOiJslxuICAgICAqIEByZXR1cm4ge3N0cmluZ30gSFNC6aKc6Imy77yMaHNiKGgscyxiKVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHRvSFNCKGNvbG9yKSB7XG4gICAgICAgIHJldHVybiBjb252ZXJ0KGNvbG9yLCAnaHNiJyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6L2s5o2i5Li6SFNMQeminOiJslxuICAgICAqIEBtZW1iZXJPZiBtb2R1bGU6enJlbmRlci90b29sL2NvbG9yXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNvbG9yIOminOiJslxuICAgICAqIEByZXR1cm4ge3N0cmluZ30gSFNMQeminOiJsu+8jGhzbGEoaCxzLGwsYSlcbiAgICAgKi9cbiAgICBmdW5jdGlvbiB0b0hTTEEoY29sb3IpIHtcbiAgICAgICAgcmV0dXJuIGNvbnZlcnQoY29sb3IsICdoc2xhJyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6L2s5o2i5Li6SFNM6aKc6ImyXG4gICAgICogQG1lbWJlck9mIG1vZHVsZTp6cmVuZGVyL3Rvb2wvY29sb3JcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29sb3Ig6aKc6ImyXG4gICAgICogQHJldHVybiB7c3RyaW5nfSBIU0zpopzoibLvvIxoc2woaCxzLGwpXG4gICAgICovXG4gICAgZnVuY3Rpb24gdG9IU0woY29sb3IpIHtcbiAgICAgICAgcmV0dXJuIGNvbnZlcnQoY29sb3IsICdoc2wnKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDovazmjaLpopzoibLlkI1cbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29sb3Ig6aKc6ImyXG4gICAgICogQHJldHVybiB7c3RyaW5nfSDpopzoibLlkI1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiB0b05hbWUoY29sb3IpIHtcbiAgICAgICAgZm9yICh2YXIga2V5IGluIF9uYW1lQ29sb3JzKSB7XG4gICAgICAgICAgICBpZiAodG9IZXgoX25hbWVDb2xvcnNba2V5XSkgPT09IHRvSGV4KGNvbG9yKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBrZXk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog56e76Zmk6aKc6Imy5Lit5aSa5L2Z56m65qC8XG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNvbG9yIOminOiJslxuICAgICAqIEByZXR1cm4ge3N0cmluZ30g5peg56m65qC86aKc6ImyXG4gICAgICovXG4gICAgZnVuY3Rpb24gdHJpbShjb2xvcikge1xuICAgICAgICByZXR1cm4gU3RyaW5nKGNvbG9yKS5yZXBsYWNlKC9cXHMrL2csICcnKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDpopzoibLop4TojIPljJZcbiAgICAgKiBAbWVtYmVyT2YgbW9kdWxlOnpyZW5kZXIvdG9vbC9jb2xvclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb2xvciDpopzoibJcbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IOinhOiMg+WMluWQjueahOminOiJslxuICAgICAqL1xuICAgIGZ1bmN0aW9uIG5vcm1hbGl6ZShjb2xvcikge1xuICAgICAgICAvLyDpopzoibLlkI1cbiAgICAgICAgaWYgKF9uYW1lQ29sb3JzW2NvbG9yXSkge1xuICAgICAgICAgICAgY29sb3IgPSBfbmFtZUNvbG9yc1tjb2xvcl07XG4gICAgICAgIH1cbiAgICAgICAgLy8g5Y675o6J56m65qC8XG4gICAgICAgIGNvbG9yID0gdHJpbShjb2xvcik7XG4gICAgICAgIC8vIGhzduS4jmhzYuetieS7t1xuICAgICAgICBjb2xvciA9IGNvbG9yLnJlcGxhY2UoL2hzdi9pLCAnaHNiJyk7XG4gICAgICAgIC8vIHJnYui9rOS4unJyZ2diYlxuICAgICAgICBpZiAoL14jW1xcZGEtZl17M30kL2kudGVzdChjb2xvcikpIHtcbiAgICAgICAgICAgIGNvbG9yID0gcGFyc2VJbnQoY29sb3Iuc2xpY2UoMSksIDE2KTtcbiAgICAgICAgICAgIHZhciByID0gKGNvbG9yICYgMHhmMDApIDw8IDg7XG4gICAgICAgICAgICB2YXIgZyA9IChjb2xvciAmIDB4ZjApIDw8IDQ7XG4gICAgICAgICAgICB2YXIgYiA9IGNvbG9yICYgMHhmO1xuXG4gICAgICAgICAgICBjb2xvciA9ICcjJyArICgoMSA8PCAyNCkgKyAociA8PCA0KSArIHIgKyAoZyA8PCA0KSArIGcgKyAoYiA8PCA0KSArIGIpLnRvU3RyaW5nKDE2KS5zbGljZSgxKTtcbiAgICAgICAgfVxuICAgICAgICAvLyDmiJbogIXkvb/nlKjku6XkuIvmraPliJnmm7/mjaLvvIzkuI3ov4cgY2hyb21lIOS4i+aAp+iDveebuOWvueW3rueCuVxuICAgICAgICAvLyBjb2xvciA9IGNvbG9yLnJlcGxhY2UoL14jKFtcXGRhLWZdKShbXFxkYS1mXSkoW1xcZGEtZl0pJC9pLCAnIyQxJDEkMiQyJDMkMycpO1xuICAgICAgICByZXR1cm4gY29sb3I7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6aKc6Imy5Yqg5rex5oiW5YeP5reh77yM5b2TbGV2ZWw+MOWKoOa3se+8jOW9k2xldmVsPDDlh4/mt6FcbiAgICAgKiBAbWVtYmVyT2YgbW9kdWxlOnpyZW5kZXIvdG9vbC9jb2xvclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb2xvciDpopzoibJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gbGV2ZWwg5Y2H6ZmN56iL5bqmLOWPluWAvOWMuumXtFstMSwxXVxuICAgICAqIEByZXR1cm4ge3N0cmluZ30g5Yqg5rex5oiW5YeP5reh5ZCO6aKc6Imy5YC8XG4gICAgICovXG4gICAgZnVuY3Rpb24gbGlmdChjb2xvciwgbGV2ZWwpIHtcbiAgICAgICAgaWYgKCFpc0NhbGN1bGFibGVDb2xvcihjb2xvcikpIHtcbiAgICAgICAgICAgIHJldHVybiBjb2xvcjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZGlyZWN0ID0gbGV2ZWwgPiAwID8gMSA6IC0xO1xuICAgICAgICBpZiAodHlwZW9mIGxldmVsID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgbGV2ZWwgPSAwO1xuICAgICAgICB9XG4gICAgICAgIGxldmVsID0gTWF0aC5hYnMobGV2ZWwpID4gMSA/IDEgOiBNYXRoLmFicyhsZXZlbCk7XG4gICAgICAgIGNvbG9yID0gdG9SR0IoY29sb3IpO1xuICAgICAgICB2YXIgZGF0YSA9IGdldERhdGEoY29sb3IpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDM7IGkrKykge1xuICAgICAgICAgICAgaWYgKGRpcmVjdCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIGRhdGFbaV0gPSBkYXRhW2ldICogKDEgLSBsZXZlbCkgfCAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZGF0YVtpXSA9ICgoMjU1IC0gZGF0YVtpXSkgKiBsZXZlbCArIGRhdGFbaV0pIHwgMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJ3JnYignICsgZGF0YS5qb2luKCcsJykgKyAnKSc7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6aKc6Imy57+76L2sLFsyNTUtciwyNTUtZywyNTUtYiwxLWFdXG4gICAgICogQG1lbWJlck9mIG1vZHVsZTp6cmVuZGVyL3Rvb2wvY29sb3JcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29sb3Ig6aKc6ImyXG4gICAgICogQHJldHVybiB7c3RyaW5nfSDnv7vovazpopzoibJcbiAgICAgKi9cbiAgICBmdW5jdGlvbiByZXZlcnNlKGNvbG9yKSB7XG4gICAgICAgIGlmICghaXNDYWxjdWxhYmxlQ29sb3IoY29sb3IpKSB7XG4gICAgICAgICAgICByZXR1cm4gY29sb3I7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGRhdGEgPSBnZXREYXRhKHRvUkdCQShjb2xvcikpO1xuICAgICAgICBkYXRhID0gbWFwKGRhdGEsXG4gICAgICAgICAgICBmdW5jdGlvbihjKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDI1NSAtIGM7XG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiB0b0NvbG9yKGRhdGEsICdyZ2InKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDnroDljZXkuKTnp43popzoibLmt7flkIhcbiAgICAgKiBAbWVtYmVyT2YgbW9kdWxlOnpyZW5kZXIvdG9vbC9jb2xvclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb2xvcjEg56ys5LiA56eN6aKc6ImyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNvbG9yMiDnrKzkuoznp43popzoibJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gd2VpZ2h0IOa3t+WQiOadg+mHjVswLTFdXG4gICAgICogQHJldHVybiB7c3RyaW5nfSDnu5PmnpzoibIscmdiKHIsZyxiKeaIlnJnYmEocixnLGIsYSlcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBtaXgoY29sb3IxLCBjb2xvcjIsIHdlaWdodCkge1xuICAgICAgICBpZiAoIWlzQ2FsY3VsYWJsZUNvbG9yKGNvbG9yMSkgfHwgIWlzQ2FsY3VsYWJsZUNvbG9yKGNvbG9yMikpIHtcbiAgICAgICAgICAgIHJldHVybiBjb2xvcjE7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2Ygd2VpZ2h0ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgd2VpZ2h0ID0gMC41O1xuICAgICAgICB9XG4gICAgICAgIHdlaWdodCA9IDEgLSBhZGp1c3Qod2VpZ2h0LCBbIDAsIDEgXSk7XG5cbiAgICAgICAgdmFyIHcgPSB3ZWlnaHQgKiAyIC0gMTtcbiAgICAgICAgdmFyIGRhdGExID0gZ2V0RGF0YSh0b1JHQkEoY29sb3IxKSk7XG4gICAgICAgIHZhciBkYXRhMiA9IGdldERhdGEodG9SR0JBKGNvbG9yMikpO1xuXG4gICAgICAgIHZhciBkID0gZGF0YTFbM10gLSBkYXRhMlszXTtcblxuICAgICAgICB2YXIgd2VpZ2h0MSA9ICgoKHcgKiBkID09PSAtMSkgPyB3IDogKHcgKyBkKSAvICgxICsgdyAqIGQpKSArIDEpIC8gMjtcbiAgICAgICAgdmFyIHdlaWdodDIgPSAxIC0gd2VpZ2h0MTtcblxuICAgICAgICB2YXIgZGF0YSA9IFtdO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMzsgaSsrKSB7XG4gICAgICAgICAgICBkYXRhW2ldID0gZGF0YTFbaV0gKiB3ZWlnaHQxICsgZGF0YTJbaV0gKiB3ZWlnaHQyO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGFscGhhID0gZGF0YTFbM10gKiB3ZWlnaHQgKyBkYXRhMlszXSAqICgxIC0gd2VpZ2h0KTtcbiAgICAgICAgYWxwaGEgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigxLCBhbHBoYSkpO1xuXG4gICAgICAgIGlmIChkYXRhMVszXSA9PT0gMSAmJiBkYXRhMlszXSA9PT0gMSkgey8vIOS4jeiAg+iZkemAj+aYjuW6plxuICAgICAgICAgICAgcmV0dXJuIHRvQ29sb3IoZGF0YSwgJ3JnYicpO1xuICAgICAgICB9XG4gICAgICAgIGRhdGFbM10gPSBhbHBoYTtcbiAgICAgICAgcmV0dXJuIHRvQ29sb3IoZGF0YSwgJ3JnYmEnKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDpmo/mnLrpopzoibJcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IOminOiJsuWAvO+8jCNycmdnYmLmoLzlvI9cbiAgICAgKi9cbiAgICBmdW5jdGlvbiByYW5kb20oKSB7XG4gICAgICAgIHJldHVybiAnIycgKyAoTWF0aC5yYW5kb20oKS50b1N0cmluZygxNikgKyAnMDAwMCcpLnNsaWNlKDIsIDgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOiOt+WPluminOiJsuWAvOaVsOe7hCzov5Tlm57lgLzojIPlm7TvvJogPGJyLz5cbiAgICAgKiBSR0Ig6IyD5Zu0WzAtMjU1XSA8YnIvPlxuICAgICAqIEhTTC9IU1YvSFNCIOiMg+WbtFswLTFdPGJyLz5cbiAgICAgKiBB6YCP5piO5bqm6IyD5Zu0WzAtMV1cbiAgICAgKiDmlK/mjIHmoLzlvI/vvJpcbiAgICAgKiAjcmdiXG4gICAgICogI3JyZ2diYlxuICAgICAqIHJnYihyLGcsYilcbiAgICAgKiByZ2IociUsZyUsYiUpXG4gICAgICogcmdiYShyLGcsYixhKVxuICAgICAqIGhzYihoLHMsYikgLy8gaHN25LiOaHNi562J5Lu3XG4gICAgICogaHNiKGglLHMlLGIlKVxuICAgICAqIGhzYmEoaCxzLGIsYSlcbiAgICAgKiBoc2woaCxzLGwpXG4gICAgICogaHNsKGglLHMlLGwlKVxuICAgICAqIGhzbGEoaCxzLGwsYSlcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb2xvciDpopzoibJcbiAgICAgKiBAcmV0dXJuIHtBcnJheS48bnVtYmVyPn0g6aKc6Imy5YC85pWw57uE5oiWbnVsbFxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGdldERhdGEoY29sb3IpIHtcbiAgICAgICAgY29sb3IgPSBub3JtYWxpemUoY29sb3IpO1xuICAgICAgICB2YXIgciA9IGNvbG9yLm1hdGNoKGNvbG9yUmVnRXhwKTtcbiAgICAgICAgaWYgKHIgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIGNvbG9yIGZvcm1hdCBlcnJvcicpOyAvLyDpopzoibLmoLzlvI/plJnor69cbiAgICAgICAgfVxuICAgICAgICB2YXIgZDtcbiAgICAgICAgdmFyIGE7XG4gICAgICAgIHZhciBkYXRhID0gW107XG4gICAgICAgIHZhciByZ2I7XG5cbiAgICAgICAgaWYgKHJbMl0pIHtcbiAgICAgICAgICAgIC8vICNycmdnYmJcbiAgICAgICAgICAgIGQgPSByWzJdLnJlcGxhY2UoJyMnLCAnJykuc3BsaXQoJycpO1xuICAgICAgICAgICAgcmdiID0gWyBkWzBdICsgZFsxXSwgZFsyXSArIGRbM10sIGRbNF0gKyBkWzVdIF07XG4gICAgICAgICAgICBkYXRhID0gbWFwKHJnYixcbiAgICAgICAgICAgICAgICBmdW5jdGlvbihjKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhZGp1c3QocGFyc2VJbnQoYywgMTYpLCBbIDAsIDI1NSBdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAocls0XSkge1xuICAgICAgICAgICAgLy8gcmdiIHJnYmFcbiAgICAgICAgICAgIHZhciByZ2JhID0gKHJbNF0pLnNwbGl0KCcsJyk7XG4gICAgICAgICAgICBhID0gcmdiYVszXTtcbiAgICAgICAgICAgIHJnYiA9IHJnYmEuc2xpY2UoMCwgMyk7XG4gICAgICAgICAgICBkYXRhID0gbWFwKFxuICAgICAgICAgICAgICAgIHJnYixcbiAgICAgICAgICAgICAgICBmdW5jdGlvbihjKSB7XG4gICAgICAgICAgICAgICAgICAgIGMgPSBNYXRoLmZsb29yKFxuICAgICAgICAgICAgICAgICAgICAgICAgYy5pbmRleE9mKCclJykgPiAwID8gcGFyc2VJbnQoYywgMCkgKiAyLjU1IDogY1xuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYWRqdXN0KGMsIFsgMCwgMjU1IF0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgYSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBkYXRhLnB1c2goYWRqdXN0KHBhcnNlRmxvYXQoYSksIFsgMCwgMSBdKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAocls1XSB8fCByWzZdKSB7XG4gICAgICAgICAgICAvLyBoc2IgaHNiYSBoc2wgaHNsYVxuICAgICAgICAgICAgdmFyIGhzeGEgPSAocls1XSB8fCByWzZdKS5zcGxpdCgnLCcpO1xuICAgICAgICAgICAgdmFyIGggPSBwYXJzZUludChoc3hhWzBdLCAwKSAvIDM2MDtcbiAgICAgICAgICAgIHZhciBzID0gaHN4YVsxXTtcbiAgICAgICAgICAgIHZhciB4ID0gaHN4YVsyXTtcbiAgICAgICAgICAgIGEgPSBoc3hhWzNdO1xuICAgICAgICAgICAgZGF0YSA9IG1hcChbIHMsIHggXSxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbihjKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhZGp1c3QocGFyc2VGbG9hdChjKSAvIDEwMCwgWyAwLCAxIF0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBkYXRhLnVuc2hpZnQoaCk7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGEgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgZGF0YS5wdXNoKGFkanVzdChwYXJzZUZsb2F0KGEpLCBbIDAsIDEgXSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOiuvue9ruminOiJsumAj+aYjuW6plxuICAgICAqIEBtZW1iZXJPZiBtb2R1bGU6enJlbmRlci90b29sL2NvbG9yXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNvbG9yIOminOiJslxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBhIOmAj+aYjuW6pizljLrpl7RbMCwxXVxuICAgICAqIEByZXR1cm4ge3N0cmluZ30gcmdiYeminOiJsuWAvFxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGFscGhhKGNvbG9yLCBhKSB7XG4gICAgICAgIGlmICghaXNDYWxjdWxhYmxlQ29sb3IoY29sb3IpKSB7XG4gICAgICAgICAgICByZXR1cm4gY29sb3I7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGEgPT09IG51bGwpIHtcbiAgICAgICAgICAgIGEgPSAxO1xuICAgICAgICB9XG4gICAgICAgIHZhciBkYXRhID0gZ2V0RGF0YSh0b1JHQkEoY29sb3IpKTtcbiAgICAgICAgZGF0YVszXSA9IGFkanVzdChOdW1iZXIoYSkudG9GaXhlZCg0KSwgWyAwLCAxIF0pO1xuXG4gICAgICAgIHJldHVybiB0b0NvbG9yKGRhdGEsICdyZ2JhJyk7XG4gICAgfVxuXG4gICAgLy8g5pWw57uE5pig5bCEXG4gICAgZnVuY3Rpb24gbWFwKGFycmF5LCBmdW4pIHtcbiAgICAgICAgaWYgKHR5cGVvZiBmdW4gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbGVuID0gYXJyYXkgPyBhcnJheS5sZW5ndGggOiAwO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBhcnJheVtpXSA9IGZ1bihhcnJheVtpXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFycmF5O1xuICAgIH1cblxuICAgIC8vIOiwg+aVtOWAvOWMuumXtFxuICAgIGZ1bmN0aW9uIGFkanVzdCh2YWx1ZSwgcmVnaW9uKSB7XG4gICAgICAgIC8vIDwgdG8gPD0gJiA+IHRvID49XG4gICAgICAgIC8vIG1vZGlmeSBieSBsaW56aGlmZW5nIDIwMTQtMDUtMjUgYmVjYXVzZSAtMCA9PSAwXG4gICAgICAgIGlmICh2YWx1ZSA8PSByZWdpb25bMF0pIHtcbiAgICAgICAgICAgIHZhbHVlID0gcmVnaW9uWzBdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHZhbHVlID49IHJlZ2lvblsxXSkge1xuICAgICAgICAgICAgdmFsdWUgPSByZWdpb25bMV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgICBcbiAgICBmdW5jdGlvbiBpc0NhbGN1bGFibGVDb2xvcihjb2xvcikge1xuICAgICAgICByZXR1cm4gY29sb3IgaW5zdGFuY2VvZiBBcnJheSB8fCB0eXBlb2YgY29sb3IgPT09ICdzdHJpbmcnO1xuICAgIH1cblxuICAgIC8vIOWPguingSBodHRwOi8vIHd3dy5lYXN5cmdiLmNvbS9pbmRleC5waHA/WD1NQVRIXG4gICAgZnVuY3Rpb24gX0hTVl8yX1JHQihkYXRhKSB7XG4gICAgICAgIHZhciBIID0gZGF0YVswXTtcbiAgICAgICAgdmFyIFMgPSBkYXRhWzFdO1xuICAgICAgICB2YXIgViA9IGRhdGFbMl07XG4gICAgICAgIC8vIEhTViBmcm9tIDAgdG8gMVxuICAgICAgICB2YXIgUjsgXG4gICAgICAgIHZhciBHO1xuICAgICAgICB2YXIgQjtcbiAgICAgICAgaWYgKFMgPT09IDApIHtcbiAgICAgICAgICAgIFIgPSBWICogMjU1O1xuICAgICAgICAgICAgRyA9IFYgKiAyNTU7XG4gICAgICAgICAgICBCID0gViAqIDI1NTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBoID0gSCAqIDY7XG4gICAgICAgICAgICBpZiAoaCA9PT0gNikge1xuICAgICAgICAgICAgICAgIGggPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGkgPSBoIHwgMDtcbiAgICAgICAgICAgIHZhciB2MSA9IFYgKiAoMSAtIFMpO1xuICAgICAgICAgICAgdmFyIHYyID0gViAqICgxIC0gUyAqIChoIC0gaSkpO1xuICAgICAgICAgICAgdmFyIHYzID0gViAqICgxIC0gUyAqICgxIC0gKGggLSBpKSkpO1xuICAgICAgICAgICAgdmFyIHIgPSAwO1xuICAgICAgICAgICAgdmFyIGcgPSAwO1xuICAgICAgICAgICAgdmFyIGIgPSAwO1xuXG4gICAgICAgICAgICBpZiAoaSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHIgPSBWO1xuICAgICAgICAgICAgICAgIGcgPSB2MztcbiAgICAgICAgICAgICAgICBiID0gdjE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChpID09PSAxKSB7XG4gICAgICAgICAgICAgICAgciA9IHYyO1xuICAgICAgICAgICAgICAgIGcgPSBWO1xuICAgICAgICAgICAgICAgIGIgPSB2MTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGkgPT09IDIpIHtcbiAgICAgICAgICAgICAgICByID0gdjE7XG4gICAgICAgICAgICAgICAgZyA9IFY7XG4gICAgICAgICAgICAgICAgYiA9IHYzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoaSA9PT0gMykge1xuICAgICAgICAgICAgICAgIHIgPSB2MTtcbiAgICAgICAgICAgICAgICBnID0gdjI7XG4gICAgICAgICAgICAgICAgYiA9IFY7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChpID09PSA0KSB7XG4gICAgICAgICAgICAgICAgciA9IHYzO1xuICAgICAgICAgICAgICAgIGcgPSB2MTtcbiAgICAgICAgICAgICAgICBiID0gVjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHIgPSBWO1xuICAgICAgICAgICAgICAgIGcgPSB2MTtcbiAgICAgICAgICAgICAgICBiID0gdjI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFJHQiByZXN1bHRzIGZyb20gMCB0byAyNTVcbiAgICAgICAgICAgIFIgPSByICogMjU1O1xuICAgICAgICAgICAgRyA9IGcgKiAyNTU7XG4gICAgICAgICAgICBCID0gYiAqIDI1NTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gWyBSLCBHLCBCIF07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX0hTTF8yX1JHQihkYXRhKSB7XG4gICAgICAgIHZhciBIID0gZGF0YVswXTtcbiAgICAgICAgdmFyIFMgPSBkYXRhWzFdO1xuICAgICAgICB2YXIgTCA9IGRhdGFbMl07XG4gICAgICAgIC8vIEhTTCBmcm9tIDAgdG8gMVxuICAgICAgICB2YXIgUjtcbiAgICAgICAgdmFyIEc7XG4gICAgICAgIHZhciBCO1xuICAgICAgICBpZiAoUyA9PT0gMCkge1xuICAgICAgICAgICAgUiA9IEwgKiAyNTU7XG4gICAgICAgICAgICBHID0gTCAqIDI1NTtcbiAgICAgICAgICAgIEIgPSBMICogMjU1O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIHYyO1xuICAgICAgICAgICAgaWYgKEwgPCAwLjUpIHtcbiAgICAgICAgICAgICAgICB2MiA9IEwgKiAoMSArIFMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdjIgPSAoTCArIFMpIC0gKFMgKiBMKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHYxID0gMiAqIEwgLSB2MjtcblxuICAgICAgICAgICAgUiA9IDI1NSAqIF9IVUVfMl9SR0IodjEsIHYyLCBIICsgKDEgLyAzKSk7XG4gICAgICAgICAgICBHID0gMjU1ICogX0hVRV8yX1JHQih2MSwgdjIsIEgpO1xuICAgICAgICAgICAgQiA9IDI1NSAqIF9IVUVfMl9SR0IodjEsIHYyLCBIIC0gKDEgLyAzKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFsgUiwgRywgQiBdO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9IVUVfMl9SR0IodjEsIHYyLCB2SCkge1xuICAgICAgICBpZiAodkggPCAwKSB7XG4gICAgICAgICAgICB2SCArPSAxO1xuICAgICAgICB9XG4gICAgICAgIGlmICh2SCA+IDEpIHtcbiAgICAgICAgICAgIHZIIC09IDE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCg2ICogdkgpIDwgMSkge1xuICAgICAgICAgICAgcmV0dXJuICh2MSArICh2MiAtIHYxKSAqIDYgKiB2SCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCgyICogdkgpIDwgMSkge1xuICAgICAgICAgICAgcmV0dXJuICh2Mik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCgzICogdkgpIDwgMikge1xuICAgICAgICAgICAgcmV0dXJuICh2MSArICh2MiAtIHYxKSAqICgoMiAvIDMpIC0gdkgpICogNik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHYxO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9SR0JfMl9IU0IoZGF0YSkge1xuICAgICAgICAvLyBSR0IgZnJvbSAwIHRvIDI1NVxuICAgICAgICB2YXIgUiA9IChkYXRhWzBdIC8gMjU1KTtcbiAgICAgICAgdmFyIEcgPSAoZGF0YVsxXSAvIDI1NSk7XG4gICAgICAgIHZhciBCID0gKGRhdGFbMl0gLyAyNTUpO1xuXG4gICAgICAgIHZhciB2TWluID0gTWF0aC5taW4oUiwgRywgQik7IC8vIE1pbi4gdmFsdWUgb2YgUkdCXG4gICAgICAgIHZhciB2TWF4ID0gTWF0aC5tYXgoUiwgRywgQik7IC8vIE1heC4gdmFsdWUgb2YgUkdCXG4gICAgICAgIHZhciBkZWx0YSA9IHZNYXggLSB2TWluOyAvLyBEZWx0YSBSR0IgdmFsdWVcbiAgICAgICAgdmFyIFYgPSB2TWF4O1xuICAgICAgICB2YXIgSDtcbiAgICAgICAgdmFyIFM7XG5cbiAgICAgICAgLy8gSFNWIHJlc3VsdHMgZnJvbSAwIHRvIDFcbiAgICAgICAgaWYgKGRlbHRhID09PSAwKSB7XG4gICAgICAgICAgICBIID0gMDtcbiAgICAgICAgICAgIFMgPSAwO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgUyA9IGRlbHRhIC8gdk1heDtcblxuICAgICAgICAgICAgdmFyIGRlbHRhUiA9ICgoKHZNYXggLSBSKSAvIDYpICsgKGRlbHRhIC8gMikpIC8gZGVsdGE7XG4gICAgICAgICAgICB2YXIgZGVsdGFHID0gKCgodk1heCAtIEcpIC8gNikgKyAoZGVsdGEgLyAyKSkgLyBkZWx0YTtcbiAgICAgICAgICAgIHZhciBkZWx0YUIgPSAoKCh2TWF4IC0gQikgLyA2KSArIChkZWx0YSAvIDIpKSAvIGRlbHRhO1xuXG4gICAgICAgICAgICBpZiAoUiA9PT0gdk1heCkge1xuICAgICAgICAgICAgICAgIEggPSBkZWx0YUIgLSBkZWx0YUc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChHID09PSB2TWF4KSB7XG4gICAgICAgICAgICAgICAgSCA9ICgxIC8gMykgKyBkZWx0YVIgLSBkZWx0YUI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChCID09PSB2TWF4KSB7XG4gICAgICAgICAgICAgICAgSCA9ICgyIC8gMykgKyBkZWx0YUcgLSBkZWx0YVI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChIIDwgMCkge1xuICAgICAgICAgICAgICAgIEggKz0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChIID4gMSkge1xuICAgICAgICAgICAgICAgIEggLT0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBIID0gSCAqIDM2MDtcbiAgICAgICAgUyA9IFMgKiAxMDA7XG4gICAgICAgIFYgPSBWICogMTAwO1xuICAgICAgICByZXR1cm4gWyBILCBTLCBWIF07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX1JHQl8yX0hTTChkYXRhKSB7XG4gICAgICAgIC8vIFJHQiBmcm9tIDAgdG8gMjU1XG4gICAgICAgIHZhciBSID0gKGRhdGFbMF0gLyAyNTUpO1xuICAgICAgICB2YXIgRyA9IChkYXRhWzFdIC8gMjU1KTtcbiAgICAgICAgdmFyIEIgPSAoZGF0YVsyXSAvIDI1NSk7XG5cbiAgICAgICAgdmFyIHZNaW4gPSBNYXRoLm1pbihSLCBHLCBCKTsgLy8gTWluLiB2YWx1ZSBvZiBSR0JcbiAgICAgICAgdmFyIHZNYXggPSBNYXRoLm1heChSLCBHLCBCKTsgLy8gTWF4LiB2YWx1ZSBvZiBSR0JcbiAgICAgICAgdmFyIGRlbHRhID0gdk1heCAtIHZNaW47IC8vIERlbHRhIFJHQiB2YWx1ZVxuXG4gICAgICAgIHZhciBMID0gKHZNYXggKyB2TWluKSAvIDI7XG4gICAgICAgIHZhciBIO1xuICAgICAgICB2YXIgUztcbiAgICAgICAgLy8gSFNMIHJlc3VsdHMgZnJvbSAwIHRvIDFcbiAgICAgICAgaWYgKGRlbHRhID09PSAwKSB7XG4gICAgICAgICAgICBIID0gMDtcbiAgICAgICAgICAgIFMgPSAwO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKEwgPCAwLjUpIHtcbiAgICAgICAgICAgICAgICBTID0gZGVsdGEgLyAodk1heCArIHZNaW4pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgUyA9IGRlbHRhIC8gKDIgLSB2TWF4IC0gdk1pbik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBkZWx0YVIgPSAoKCh2TWF4IC0gUikgLyA2KSArIChkZWx0YSAvIDIpKSAvIGRlbHRhO1xuICAgICAgICAgICAgdmFyIGRlbHRhRyA9ICgoKHZNYXggLSBHKSAvIDYpICsgKGRlbHRhIC8gMikpIC8gZGVsdGE7XG4gICAgICAgICAgICB2YXIgZGVsdGFCID0gKCgodk1heCAtIEIpIC8gNikgKyAoZGVsdGEgLyAyKSkgLyBkZWx0YTtcblxuICAgICAgICAgICAgaWYgKFIgPT09IHZNYXgpIHtcbiAgICAgICAgICAgICAgICBIID0gZGVsdGFCIC0gZGVsdGFHO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoRyA9PT0gdk1heCkge1xuICAgICAgICAgICAgICAgIEggPSAoMSAvIDMpICsgZGVsdGFSIC0gZGVsdGFCO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoQiA9PT0gdk1heCkge1xuICAgICAgICAgICAgICAgIEggPSAoMiAvIDMpICsgZGVsdGFHIC0gZGVsdGFSO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoSCA8IDApIHtcbiAgICAgICAgICAgICAgICBIICs9IDE7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChIID4gMSkge1xuICAgICAgICAgICAgICAgIEggLT0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIEggPSBIICogMzYwO1xuICAgICAgICBTID0gUyAqIDEwMDtcbiAgICAgICAgTCA9IEwgKiAxMDA7XG5cbiAgICAgICAgcmV0dXJuIFsgSCwgUywgTCBdO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGN1c3RvbVBhbGV0dGUgOiBjdXN0b21QYWxldHRlLFxuICAgICAgICByZXNldFBhbGV0dGUgOiByZXNldFBhbGV0dGUsXG4gICAgICAgIGdldENvbG9yIDogZ2V0Q29sb3IsXG4gICAgICAgIGdldEhpZ2hsaWdodENvbG9yIDogZ2V0SGlnaGxpZ2h0Q29sb3IsXG4gICAgICAgIGN1c3RvbUhpZ2hsaWdodCA6IGN1c3RvbUhpZ2hsaWdodCxcbiAgICAgICAgcmVzZXRIaWdobGlnaHQgOiByZXNldEhpZ2hsaWdodCxcbiAgICAgICAgZ2V0UmFkaWFsR3JhZGllbnQgOiBnZXRSYWRpYWxHcmFkaWVudCxcbiAgICAgICAgZ2V0TGluZWFyR3JhZGllbnQgOiBnZXRMaW5lYXJHcmFkaWVudCxcbiAgICAgICAgZ2V0R3JhZGllbnRDb2xvcnMgOiBnZXRHcmFkaWVudENvbG9ycyxcbiAgICAgICAgZ2V0U3RlcENvbG9ycyA6IGdldFN0ZXBDb2xvcnMsXG4gICAgICAgIHJldmVyc2UgOiByZXZlcnNlLFxuICAgICAgICBtaXggOiBtaXgsXG4gICAgICAgIGxpZnQgOiBsaWZ0LFxuICAgICAgICB0cmltIDogdHJpbSxcbiAgICAgICAgcmFuZG9tIDogcmFuZG9tLFxuICAgICAgICB0b1JHQiA6IHRvUkdCLFxuICAgICAgICB0b1JHQkEgOiB0b1JHQkEsXG4gICAgICAgIHRvSGV4IDogdG9IZXgsXG4gICAgICAgIHRvSFNMIDogdG9IU0wsXG4gICAgICAgIHRvSFNMQSA6IHRvSFNMQSxcbiAgICAgICAgdG9IU0IgOiB0b0hTQixcbiAgICAgICAgdG9IU0JBIDogdG9IU0JBLFxuICAgICAgICB0b0hTViA6IHRvSFNWLFxuICAgICAgICB0b0hTVkEgOiB0b0hTVkEsXG4gICAgICAgIHRvTmFtZSA6IHRvTmFtZSxcbiAgICAgICAgdG9Db2xvciA6IHRvQ29sb3IsXG4gICAgICAgIHRvQXJyYXkgOiB0b0FycmF5LFxuICAgICAgICBhbHBoYSA6IGFscGhhLFxuICAgICAgICBnZXREYXRhIDogZ2V0RGF0YVxuICAgIH07XG59KTtcblxuIl0sImZpbGUiOiJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3Rvb2wvY29sb3IuanMifQ==
