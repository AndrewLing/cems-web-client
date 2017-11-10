/**
 * echarts设备环境识别
 *
 * @desc echarts基于Canvas，纯Javascript图表库，提供直观，生动，可交互，可个性化定制的数据统计图表。
 * @author firede[firede@firede.us]
 * @desc thanks zepto.
 */
define(function() {
    // Zepto.js
    // (c) 2010-2013 Thomas Fuchs
    // Zepto.js may be freely distributed under the MIT license.

    function detect(ua) {
        var os = this.os = {};
        var browser = this.browser = {};
        var webkit = ua.match(/Web[kK]it[\/]{0,1}([\d.]+)/);
        var android = ua.match(/(Android);?[\s\/]+([\d.]+)?/);
        var ipad = ua.match(/(iPad).*OS\s([\d_]+)/);
        var ipod = ua.match(/(iPod)(.*OS\s([\d_]+))?/);
        var iphone = !ipad && ua.match(/(iPhone\sOS)\s([\d_]+)/);
        var webos = ua.match(/(webOS|hpwOS)[\s\/]([\d.]+)/);
        var touchpad = webos && ua.match(/TouchPad/);
        var kindle = ua.match(/Kindle\/([\d.]+)/);
        var silk = ua.match(/Silk\/([\d._]+)/);
        var blackberry = ua.match(/(BlackBerry).*Version\/([\d.]+)/);
        var bb10 = ua.match(/(BB10).*Version\/([\d.]+)/);
        var rimtabletos = ua.match(/(RIM\sTablet\sOS)\s([\d.]+)/);
        var playbook = ua.match(/PlayBook/);
        var chrome = ua.match(/Chrome\/([\d.]+)/) || ua.match(/CriOS\/([\d.]+)/);
        var firefox = ua.match(/Firefox\/([\d.]+)/);
        var ie = ua.match(/MSIE ([\d.]+)/);
        var safari = webkit && ua.match(/Mobile\//) && !chrome;
        var webview = ua.match(/(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/) && !chrome;
        var ie = ua.match(/MSIE\s([\d.]+)/);

        // Todo: clean this up with a better OS/browser seperation:
        // - discern (more) between multiple browsers on android
        // - decide if kindle fire in silk mode is android or not
        // - Firefox on Android doesn't specify the Android version
        // - possibly devide in os, device and browser hashes

        if (browser.webkit = !!webkit) browser.version = webkit[1];

        if (android) os.android = true, os.version = android[2];
        if (iphone && !ipod) os.ios = os.iphone = true, os.version = iphone[2].replace(/_/g, '.');
        if (ipad) os.ios = os.ipad = true, os.version = ipad[2].replace(/_/g, '.');
        if (ipod) os.ios = os.ipod = true, os.version = ipod[3] ? ipod[3].replace(/_/g, '.') : null;
        if (webos) os.webos = true, os.version = webos[2];
        if (touchpad) os.touchpad = true;
        if (blackberry) os.blackberry = true, os.version = blackberry[2];
        if (bb10) os.bb10 = true, os.version = bb10[2];
        if (rimtabletos) os.rimtabletos = true, os.version = rimtabletos[2];
        if (playbook) browser.playbook = true;
        if (kindle) os.kindle = true, os.version = kindle[1];
        if (silk) browser.silk = true, browser.version = silk[1];
        if (!silk && os.android && ua.match(/Kindle Fire/)) browser.silk = true;
        if (chrome) browser.chrome = true, browser.version = chrome[1];
        if (firefox) browser.firefox = true, browser.version = firefox[1];
        if (ie) browser.ie = true, browser.version = ie[1];
        if (safari && (ua.match(/Safari/) || !!os.ios)) browser.safari = true;
        if (webview) browser.webview = true;
        if (ie) browser.ie = true, browser.version = ie[1];

        os.tablet = !!(ipad || playbook || (android && !ua.match(/Mobile/)) ||
            (firefox && ua.match(/Tablet/)) || (ie && !ua.match(/Phone/) && ua.match(/Touch/)));
        os.phone  = !!(!os.tablet && !os.ipod && (android || iphone || webos || blackberry || bb10 ||
            (chrome && ua.match(/Android/)) || (chrome && ua.match(/CriOS\/([\d.]+)/)) ||
            (firefox && ua.match(/Mobile/)) || (ie && ua.match(/Touch/))));

        return {
            browser: browser,
            os: os,
            // 原生canvas支持，改极端点了
            // canvasSupported : !(browser.ie && parseFloat(browser.version) < 9)
            canvasSupported : document.createElement('canvas').getContext ? true : false
        };
    }

    return detect(navigator.userAgent);
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3Rvb2wvZW52LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogZWNoYXJ0c+iuvuWkh+eOr+Wig+ivhuWIq1xuICpcbiAqIEBkZXNjIGVjaGFydHPln7rkuo5DYW52YXPvvIznuq9KYXZhc2NyaXB05Zu+6KGo5bqT77yM5o+Q5L6b55u06KeC77yM55Sf5Yqo77yM5Y+v5Lqk5LqS77yM5Y+v5Liq5oCn5YyW5a6a5Yi255qE5pWw5o2u57uf6K6h5Zu+6KGo44CCXG4gKiBAYXV0aG9yIGZpcmVkZVtmaXJlZGVAZmlyZWRlLnVzXVxuICogQGRlc2MgdGhhbmtzIHplcHRvLlxuICovXG5kZWZpbmUoZnVuY3Rpb24oKSB7XG4gICAgLy8gWmVwdG8uanNcbiAgICAvLyAoYykgMjAxMC0yMDEzIFRob21hcyBGdWNoc1xuICAgIC8vIFplcHRvLmpzIG1heSBiZSBmcmVlbHkgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuXG4gICAgZnVuY3Rpb24gZGV0ZWN0KHVhKSB7XG4gICAgICAgIHZhciBvcyA9IHRoaXMub3MgPSB7fTtcbiAgICAgICAgdmFyIGJyb3dzZXIgPSB0aGlzLmJyb3dzZXIgPSB7fTtcbiAgICAgICAgdmFyIHdlYmtpdCA9IHVhLm1hdGNoKC9XZWJba0tdaXRbXFwvXXswLDF9KFtcXGQuXSspLyk7XG4gICAgICAgIHZhciBhbmRyb2lkID0gdWEubWF0Y2goLyhBbmRyb2lkKTs/W1xcc1xcL10rKFtcXGQuXSspPy8pO1xuICAgICAgICB2YXIgaXBhZCA9IHVhLm1hdGNoKC8oaVBhZCkuKk9TXFxzKFtcXGRfXSspLyk7XG4gICAgICAgIHZhciBpcG9kID0gdWEubWF0Y2goLyhpUG9kKSguKk9TXFxzKFtcXGRfXSspKT8vKTtcbiAgICAgICAgdmFyIGlwaG9uZSA9ICFpcGFkICYmIHVhLm1hdGNoKC8oaVBob25lXFxzT1MpXFxzKFtcXGRfXSspLyk7XG4gICAgICAgIHZhciB3ZWJvcyA9IHVhLm1hdGNoKC8od2ViT1N8aHB3T1MpW1xcc1xcL10oW1xcZC5dKykvKTtcbiAgICAgICAgdmFyIHRvdWNocGFkID0gd2Vib3MgJiYgdWEubWF0Y2goL1RvdWNoUGFkLyk7XG4gICAgICAgIHZhciBraW5kbGUgPSB1YS5tYXRjaCgvS2luZGxlXFwvKFtcXGQuXSspLyk7XG4gICAgICAgIHZhciBzaWxrID0gdWEubWF0Y2goL1NpbGtcXC8oW1xcZC5fXSspLyk7XG4gICAgICAgIHZhciBibGFja2JlcnJ5ID0gdWEubWF0Y2goLyhCbGFja0JlcnJ5KS4qVmVyc2lvblxcLyhbXFxkLl0rKS8pO1xuICAgICAgICB2YXIgYmIxMCA9IHVhLm1hdGNoKC8oQkIxMCkuKlZlcnNpb25cXC8oW1xcZC5dKykvKTtcbiAgICAgICAgdmFyIHJpbXRhYmxldG9zID0gdWEubWF0Y2goLyhSSU1cXHNUYWJsZXRcXHNPUylcXHMoW1xcZC5dKykvKTtcbiAgICAgICAgdmFyIHBsYXlib29rID0gdWEubWF0Y2goL1BsYXlCb29rLyk7XG4gICAgICAgIHZhciBjaHJvbWUgPSB1YS5tYXRjaCgvQ2hyb21lXFwvKFtcXGQuXSspLykgfHwgdWEubWF0Y2goL0NyaU9TXFwvKFtcXGQuXSspLyk7XG4gICAgICAgIHZhciBmaXJlZm94ID0gdWEubWF0Y2goL0ZpcmVmb3hcXC8oW1xcZC5dKykvKTtcbiAgICAgICAgdmFyIGllID0gdWEubWF0Y2goL01TSUUgKFtcXGQuXSspLyk7XG4gICAgICAgIHZhciBzYWZhcmkgPSB3ZWJraXQgJiYgdWEubWF0Y2goL01vYmlsZVxcLy8pICYmICFjaHJvbWU7XG4gICAgICAgIHZhciB3ZWJ2aWV3ID0gdWEubWF0Y2goLyhpUGhvbmV8aVBvZHxpUGFkKS4qQXBwbGVXZWJLaXQoPyEuKlNhZmFyaSkvKSAmJiAhY2hyb21lO1xuICAgICAgICB2YXIgaWUgPSB1YS5tYXRjaCgvTVNJRVxccyhbXFxkLl0rKS8pO1xuXG4gICAgICAgIC8vIFRvZG86IGNsZWFuIHRoaXMgdXAgd2l0aCBhIGJldHRlciBPUy9icm93c2VyIHNlcGVyYXRpb246XG4gICAgICAgIC8vIC0gZGlzY2VybiAobW9yZSkgYmV0d2VlbiBtdWx0aXBsZSBicm93c2VycyBvbiBhbmRyb2lkXG4gICAgICAgIC8vIC0gZGVjaWRlIGlmIGtpbmRsZSBmaXJlIGluIHNpbGsgbW9kZSBpcyBhbmRyb2lkIG9yIG5vdFxuICAgICAgICAvLyAtIEZpcmVmb3ggb24gQW5kcm9pZCBkb2Vzbid0IHNwZWNpZnkgdGhlIEFuZHJvaWQgdmVyc2lvblxuICAgICAgICAvLyAtIHBvc3NpYmx5IGRldmlkZSBpbiBvcywgZGV2aWNlIGFuZCBicm93c2VyIGhhc2hlc1xuXG4gICAgICAgIGlmIChicm93c2VyLndlYmtpdCA9ICEhd2Via2l0KSBicm93c2VyLnZlcnNpb24gPSB3ZWJraXRbMV07XG5cbiAgICAgICAgaWYgKGFuZHJvaWQpIG9zLmFuZHJvaWQgPSB0cnVlLCBvcy52ZXJzaW9uID0gYW5kcm9pZFsyXTtcbiAgICAgICAgaWYgKGlwaG9uZSAmJiAhaXBvZCkgb3MuaW9zID0gb3MuaXBob25lID0gdHJ1ZSwgb3MudmVyc2lvbiA9IGlwaG9uZVsyXS5yZXBsYWNlKC9fL2csICcuJyk7XG4gICAgICAgIGlmIChpcGFkKSBvcy5pb3MgPSBvcy5pcGFkID0gdHJ1ZSwgb3MudmVyc2lvbiA9IGlwYWRbMl0ucmVwbGFjZSgvXy9nLCAnLicpO1xuICAgICAgICBpZiAoaXBvZCkgb3MuaW9zID0gb3MuaXBvZCA9IHRydWUsIG9zLnZlcnNpb24gPSBpcG9kWzNdID8gaXBvZFszXS5yZXBsYWNlKC9fL2csICcuJykgOiBudWxsO1xuICAgICAgICBpZiAod2Vib3MpIG9zLndlYm9zID0gdHJ1ZSwgb3MudmVyc2lvbiA9IHdlYm9zWzJdO1xuICAgICAgICBpZiAodG91Y2hwYWQpIG9zLnRvdWNocGFkID0gdHJ1ZTtcbiAgICAgICAgaWYgKGJsYWNrYmVycnkpIG9zLmJsYWNrYmVycnkgPSB0cnVlLCBvcy52ZXJzaW9uID0gYmxhY2tiZXJyeVsyXTtcbiAgICAgICAgaWYgKGJiMTApIG9zLmJiMTAgPSB0cnVlLCBvcy52ZXJzaW9uID0gYmIxMFsyXTtcbiAgICAgICAgaWYgKHJpbXRhYmxldG9zKSBvcy5yaW10YWJsZXRvcyA9IHRydWUsIG9zLnZlcnNpb24gPSByaW10YWJsZXRvc1syXTtcbiAgICAgICAgaWYgKHBsYXlib29rKSBicm93c2VyLnBsYXlib29rID0gdHJ1ZTtcbiAgICAgICAgaWYgKGtpbmRsZSkgb3Mua2luZGxlID0gdHJ1ZSwgb3MudmVyc2lvbiA9IGtpbmRsZVsxXTtcbiAgICAgICAgaWYgKHNpbGspIGJyb3dzZXIuc2lsayA9IHRydWUsIGJyb3dzZXIudmVyc2lvbiA9IHNpbGtbMV07XG4gICAgICAgIGlmICghc2lsayAmJiBvcy5hbmRyb2lkICYmIHVhLm1hdGNoKC9LaW5kbGUgRmlyZS8pKSBicm93c2VyLnNpbGsgPSB0cnVlO1xuICAgICAgICBpZiAoY2hyb21lKSBicm93c2VyLmNocm9tZSA9IHRydWUsIGJyb3dzZXIudmVyc2lvbiA9IGNocm9tZVsxXTtcbiAgICAgICAgaWYgKGZpcmVmb3gpIGJyb3dzZXIuZmlyZWZveCA9IHRydWUsIGJyb3dzZXIudmVyc2lvbiA9IGZpcmVmb3hbMV07XG4gICAgICAgIGlmIChpZSkgYnJvd3Nlci5pZSA9IHRydWUsIGJyb3dzZXIudmVyc2lvbiA9IGllWzFdO1xuICAgICAgICBpZiAoc2FmYXJpICYmICh1YS5tYXRjaCgvU2FmYXJpLykgfHwgISFvcy5pb3MpKSBicm93c2VyLnNhZmFyaSA9IHRydWU7XG4gICAgICAgIGlmICh3ZWJ2aWV3KSBicm93c2VyLndlYnZpZXcgPSB0cnVlO1xuICAgICAgICBpZiAoaWUpIGJyb3dzZXIuaWUgPSB0cnVlLCBicm93c2VyLnZlcnNpb24gPSBpZVsxXTtcblxuICAgICAgICBvcy50YWJsZXQgPSAhIShpcGFkIHx8IHBsYXlib29rIHx8IChhbmRyb2lkICYmICF1YS5tYXRjaCgvTW9iaWxlLykpIHx8XG4gICAgICAgICAgICAoZmlyZWZveCAmJiB1YS5tYXRjaCgvVGFibGV0LykpIHx8IChpZSAmJiAhdWEubWF0Y2goL1Bob25lLykgJiYgdWEubWF0Y2goL1RvdWNoLykpKTtcbiAgICAgICAgb3MucGhvbmUgID0gISEoIW9zLnRhYmxldCAmJiAhb3MuaXBvZCAmJiAoYW5kcm9pZCB8fCBpcGhvbmUgfHwgd2Vib3MgfHwgYmxhY2tiZXJyeSB8fCBiYjEwIHx8XG4gICAgICAgICAgICAoY2hyb21lICYmIHVhLm1hdGNoKC9BbmRyb2lkLykpIHx8IChjaHJvbWUgJiYgdWEubWF0Y2goL0NyaU9TXFwvKFtcXGQuXSspLykpIHx8XG4gICAgICAgICAgICAoZmlyZWZveCAmJiB1YS5tYXRjaCgvTW9iaWxlLykpIHx8IChpZSAmJiB1YS5tYXRjaCgvVG91Y2gvKSkpKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgYnJvd3NlcjogYnJvd3NlcixcbiAgICAgICAgICAgIG9zOiBvcyxcbiAgICAgICAgICAgIC8vIOWOn+eUn2NhbnZhc+aUr+aMge+8jOaUueaegeerr+eCueS6hlxuICAgICAgICAgICAgLy8gY2FudmFzU3VwcG9ydGVkIDogIShicm93c2VyLmllICYmIHBhcnNlRmxvYXQoYnJvd3Nlci52ZXJzaW9uKSA8IDkpXG4gICAgICAgICAgICBjYW52YXNTdXBwb3J0ZWQgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKS5nZXRDb250ZXh0ID8gdHJ1ZSA6IGZhbHNlXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIGRldGVjdChuYXZpZ2F0b3IudXNlckFnZW50KTtcbn0pOyJdLCJmaWxlIjoicGx1Z2lucy96cmVuZGVyLTIuMS4wL3NyYy90b29sL2Vudi5qcyJ9
