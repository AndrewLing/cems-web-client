/*
 * My97 DatePicker 4.8 Beta1
 * License: http://www.my97.net/dp/license.asp
 */
var $dp, WdatePicker;
(function () {
    var $ = {
        $langList: [
            {
                name: "en",
                charset: "UTF-8"
            },
            {
                name: "zh-cn",
                charset: "gb2312"
            },
            {
                name: "zh-tw",
                charset: "GBK"
            },
            {
                name: "ja",
                charset: "UTF-8"
            }
        ],
        $skinList: [
            {
                name: "default",
                charset: "gb2312"
            },
            {
                name: "whyGreen",
                charset: "gb2312"
            },
            {
                name: "gsBlue",
                charset: "gb2312"
            },
            {
                name: "black",
                charset: "gb2312"
            }
        ],
        $wdate: true,
        $crossFrame: true,
        $preLoad: false,
        doubleCalendar: false,
        enableKeyboard: true,
        enableInputMask: true,
        autoUpdateOnChanged: null,
        whichDayIsfirstWeek: 4,
//        parent: 'main_view',
        position: {},
        lang: "auto",
        skin: "default",
        dateFmt: "yyyy-MM-dd",
        realDateFmt: "yyyy-MM-dd",
        realTimeFmt: "HH:mm:ss",
        realFullFmt: "%Date %Time",
        minDate: "1900-01-01 00:00:00",
        maxDate: "2099-12-31 23:59:59",
        startDate: "",
        alwaysUseStartDate: false,
        yearOffset: 1911,
        firstDayOfWeek: 0,
        isShowWeek: false,
        highLineWeekDay: true,
//        isShowClear: true,
        isShowClear: false,
//        isShowToday: true,
        isShowToday: false,
//        isShowOK: true,
        isShowOK: false,
        isShowOthers: true,
        readOnly: true,
        errDealMode: 1,
//        autoPickDate: null,
        autoPickDate: true,
        qsEnabled: false,
        autoShowQS: false,

        specialDates: null,
        specialDays: null,
        disabledDates: null,
        disabledDays: null,
        opposite: false,
        errMsg: "",
        quickSel: [],
        has: {},

        onpicking: false,
        onpicked: false,
        ychanging: false,
        Mchanging: false,
        dchanging: false,
        Hchanging: false,
        mchanging: false,
        schanging: false,
        ychanged: false,
        Mchanged: false,
        dchanged: false,
        Hchanged: false,
        mchanged: false,
        schanged: false,

        getRealLang: function () {
            var _ = $.$langList;
            for (var A = 0; A < _.length; A++)
                if (_[A].name == this.lang)
                    return _[A];
            return _[0]
        }
    };
    WdatePicker = T;
    var X = window, S = {
        innerHTML: ""
    }, M = "document", H = "documentElement", C = "getElementsByTagName", U, A, R, G, a, W = navigator.appName;
    if (W == "Microsoft Internet Explorer")
        R = true;
    else if (W == "Opera")
        a = true;
    else
        G = true;
    A = J();
    if ($.$wdate)
        K(A + "skin/WdatePicker.css");
    U = X;
    if ($.$crossFrame) {
        try {
            while (U.parent && U.parent[M] != U[M]
                && U.parent[M][C]("frameset").length == 0)
                U = U.parent
        } catch (N) {
        }
    }
    if (!U.$dp)
        U.$dp = {
            ff: G,
            ie: R,
            opera: a,
            status: 0,
            defMinDate: $.minDate,
            defMaxDate: $.maxDate
        };
    B();
    if ($.$preLoad && $dp.status == 0)
        E(X, "onload", function () {
            T(null, true)
        });
    if (!X[M].docMD) {
        E(X[M], "onmousedown", D);
        X[M].docMD = true
    }
    if (!U[M].docMD) {
        E(U[M], "onmousedown", D);
        U[M].docMD = true
    }
    E(X, "onunload", function () {
        if ($dp.dd)
            O($dp.dd, "none")
    });
    function B() {
        U.$dp = U.$dp || {};
        obj = {
            $: function ($) {
                return (typeof $ == "string") ? X[M].getElementById($) : $
            },
            $D: function ($, _) {
                return this.$DV(this.$($).value, _)
            },
            $DV: function (_, $) {
                if (_ != "") {
                    this.dt = $dp.cal.splitDate(_, $dp.cal.dateFmt);
                    if ($)
                        for (var B in $)
                            if (this.dt[B] === undefined)
                                this.errMsg = "invalid property:" + B;
                            else {
                                this.dt[B] += $[B];
                                if (B == "M") {
                                    var C = $["M"] > 0 ? 1 : 0, A = new Date(
                                        this.dt["y"], this.dt["M"], 0)
                                        .getDate();
                                    this.dt["d"] = Math
                                        .min(A + C, this.dt["d"])
                                }
                            }
                    if (this.dt.refresh())
                        return this.dt
                }
                return ""
            },
            show: function () {
                var A = U[M].getElementsByTagName("div"), $ = 100000;
                for (var B = 0; B < A.length; B++) {
                    var _ = parseInt(A[B].style.zIndex);
                    if (_ > $)
                        $ = _
                }
                this.dd.style.zIndex = $ + 1;
                O(this.dd, "block");
            },
            hide: function () {
                O(this.dd, "none")
            },
            attachEvent: E
        };
        for (var $ in obj)
            U.$dp[$] = obj[$];
        $dp = U.$dp
    }

    function E(A, $, _) {
        if (R)
            A.attachEvent($, _);
        else if (_) {
            var B = $.replace(/on/, "");
            _._ieEmuEventHandler = function ($) {
                try {
                    return _($);
                } catch (e) {}
            };
            A.addEventListener(B, _._ieEmuEventHandler, false)
        }
    }

    function J() {
        var _, A, $ = X[M][C]("script");
        for (var B = 0; B < $.length; B++) {
            _ = $[B].getAttribute("src");
            _ = _.substr(0, _.toLowerCase().indexOf("wdatepicker.js"));
            A = _.lastIndexOf("/");
            if (A > 0)
                _ = _.substring(0, A + 1);
            if (_)
                break
        }
        return _
    }

    function K(A, $, B) {
        var D = X[M][C]("HEAD").item(0), _ = X[M].createElement("link");
        if (D) {
            _.href = A;
            _.rel = "stylesheet";
            _.type = "text/css";
            if ($)
                _.title = $;
            if (B)
                _.charset = B;
            D.appendChild(_)
        }
    }

    function F($) {
        $ = $ || U;
        var A = 0, _ = 0;
        while ($ != U) {
            var D = $.parent[M][C]("iframe");
            for (var F = 0; F < D.length; F++) {
                try {
                    if (D[F].contentWindow == $) {
                        var E = V(D[F]);
                        A += E.left;
                        _ += E.top;
                        break
                    }
                } catch (B) {
                }
            }
            $ = $.parent
        }
        return {
            "leftM": A,
            "topM": _
        }
    }

    function V(F) {
        if (F.getBoundingClientRect)
            return F.getBoundingClientRect();
        else {
            var A = {
                ROOT_TAG: /^body|html$/i,
                OP_SCROLL: /^(?:inline|table-row)$/i
            }, E = false, H = null, _ = F.offsetTop, G = F.offsetLeft, D = F.offsetWidth, B = F.offsetHeight, C = F.offsetParent;
            if (C != F)
                while (C) {
                    G += C.offsetLeft;
                    _ += C.offsetTop;
                    if (Q(C, "position").toLowerCase() == "fixed")
                        E = true;
                    else if (C.tagName.toLowerCase() == "body")
                        H = C.ownerDocument.defaultView;
                    C = C.offsetParent
                }

        F.getBoundingClientRect && (G = F.getBoundingClientRect().left);
            C = F.parentNode;
            while (Q(C, "position").toLowerCase() != "fixed" && (C.tagName && !A.ROOT_TAG.test(C.tagName))) {
                if (C.scrollTop || C.scrollLeft)
                    if (!A.OP_SCROLL.test(O(C)))
                        if (!a || C.style.overflow !== "visible") {
                            G -= C.scrollLeft;
                            _ -= C.scrollTop
                        }
                C = C.parentNode
            }
            if (!E) {
                var $ = Z(H);
                G -= $.left;
                _ -= $.top
            }
            D += G;
            B += _;
            return {
                "left": G,
                "top": _,
                "right": D,
                "bottom": B
            };
        }
    }

    function L($) {
        $ = $ || U;
        var B = $[M], A = ($.innerWidth) ? $.innerWidth
            : (B[H] && B[H].clientWidth) ? B[H].clientWidth
            : B.body.offsetWidth, _ = ($.innerHeight) ? $.innerHeight
            : (B[H] && B[H].clientHeight) ? B[H].clientHeight
            : B.body.offsetHeight;
        return {
            "width": A,
            "height": _
        }
    }

    function Z($) {
        $ = $ || U;
        var B = $[M], A = B[H], _ = B.body;
        B = (A && A.scrollTop != null && (A.scrollTop > _.scrollTop || A.scrollLeft > _.scrollLeft)) ? A
            : _;
        return {
            "top": B.scrollTop,
            "left": B.scrollLeft
        }
    }

    function D($) {
        var _ = $ ? ($.srcElement || $.target) : null;
        try {
            if ($dp.cal && !$dp.eCont && $dp.dd && _ != $dp.el
                && $dp.dd.style.display == "block")
                $dp.cal.close()
        } catch ($) {
        }
    }

    function Y() {
        $dp.status = 2
    }

    var P, _;

    function T(L, D) {
        $dp.win = X;
        B();
        L = L || {};
        for (var J in $)
            if (J.substring(0, 1) != "$" && L[J] === undefined)
                L[J] = $[J];
        if (D) {
            if (!K()) {
                _ = _ || setInterval(function () {
                    if (U[M].readyState == "complete")
                        clearInterval(_);
                    T(null, true)
                }, 50);
                return
            }
            if ($dp.status == 0) {
                $dp.status = 1;
                L.el = S;
                I(L, true)
            } else
                return
        } else if (L.eCont) {
            L.eCont = $dp.$(L.eCont);
            L.el = S;
            L.autoPickDate = true;
            L.qsEnabled = false;
            I(L)
        } else {
            if ($.$preLoad && $dp.status != 2)
                return;
            var H = F();
            if (H) {
                L.srcEl = H.srcElement || H.target;
                H.cancelBubble = true
            }
            L.el = L.el = $dp.$(L.el || L.srcEl);
			if (!L.el
					|| L.el["My97Mark"] === true
					|| L.el.disabled
					|| ($dp.dd && O($dp.dd) != "none" && $dp.dd.style.left != "-970px")) {
				L.el["My97Mark"] = false;
                if (!L.el && L.el.disabled) return;
			}
            I(L);
            if (H && L.el.nodeType == 1 && L.el["My97Mark"] === undefined) {
                L.el["My97Mark"] = false;
                var A, C;
                if (H.type == "focus") {
                    A = "onclick";
                    C = "onfocus"
                } else {
                    A = "onfocus";
                    C = "onclick"
                }
                E(L.el, A, L.el[C])
            }
        }
        function K() {
            if (R && U != X && U[M].readyState != "complete")
                return false;
            return true
        }

        function F() {
            if (G) {
                func = F.caller;
                while (func != null) {
                    var $ = func.arguments[0];
                    if ($ && ($ + "").indexOf("Event") >= 0)
                        return $;
                    func = func.caller
                }
                return null
            }
            return event
        }
    }

    function Q(_, $) {
        return _.currentStyle ? _.currentStyle[$] : document.defaultView.getComputedStyle(_, false)[$]
    }

    function O(_, $) {
        if (_)
            if ($ != null)
                _.style.display = $;
            else
                return Q(_, "display")
    }

    function I(G, _) {
        var D = G.el ? G.el.nodeName : "INPUT";
        if (_ || G.eCont || new RegExp(/input|textarea|div|span|p|a/ig).test(D))
            G.elProp = D == "INPUT" ? "value" : "innerHTML";
        else
            return;
        if (G.lang == "auto")
            G.lang = R ? navigator.browserLanguage.toLowerCase() : navigator.language.toLowerCase();
        if (!G.eCont)
            for (var C in G)
                $dp[C] = G[C];
        if (!$dp.dd
            || G.eCont
            || ($dp.dd && (G.getRealLang().name != $dp.dd.lang || G.skin != $dp.dd.skin))) {
            if (G.eCont)
                E(G.eCont, G);
            else {
                $dp.dd = U[M].createElement("DIV");
                $dp.dd.id = "iemsDatePicker";
                $dp.dd.style.cssText = "position:fixed";
                (($.parent && U[M].getElementById($.parent)) || U[M].body).appendChild($dp.dd);
                E($dp.dd, G);
                if (_)
                    $dp.dd.style.left = $dp.dd.style.top = "-970px";
                else {
                    $dp.show();
                    B($dp)
                }
            }
        } else if ($dp.cal) {
            $dp.show();
            $dp.cal.init();
            if (!$dp.eCont)
                B($dp)
        }
        function E(F, E) {
            F.innerHTML = "<iframe hideFocus=true width=97 height=9 frameborder=0 border=0 scrolling=no></iframe>";
            var D = F.lastChild.contentWindow[M], _ = $.$langList, C = $.$skinList, H = E.getRealLang();
            F.lang = H.name;
            F.skin = E.skin;
            var G = [
                "<head><script>document.oncontextmenu=function(){return false;};",
                "window.onkeydown=function(){if (event.keyCode === 112) {parent.openOnlineHelp();event.keyCode = 0;return false;}};",
                "var $d, $dp, $cfg=document.cfg, $pdp = parent.$dp, $dt, $tdt, $sdt, $lastInput, $IE=$pdp.ie, $FF = $pdp.ff,$OPERA=$pdp.opera, $ny, $cMark = false;",
                "if($cfg.eCont) {$dp = {};for(var p in $pdp) {$dp[p] = $pdp[p];}}else{$dp = $pdp;};for (var p in $cfg) {$dp[p] = $cfg[p];};",
                "</script><script src=", A, "lang/", H.name,
                ".js charset=", H.charset, "></script>" ];
            for (var I = 0; I < C.length; I++)
                if (C[I].name == E.skin)
                    G.push("<link rel=\"stylesheet\" type=\"text/css\" href=\""
                        + A + "skin/" + C[I].name
                        + "/datepicker.css\" charset=\"" + C[I].charset
                        + "\"/>");
            G.push("<script type=\"text/javascript\" src=\""
                    + A + "calendar.js?\"+Math.random()+\" charset=\"gb2312\"></script>");
            G.push("</head><body leftmargin=\"0\" topmargin=\"0\" tabindex=0></body></html>");
            G.push("<script>var t;t=t||setInterval(function(){if(document.ready){new My97DP();$cfg.onload();$c.autoSize();$cfg.setPos($dp);clearInterval(t);}},20);if($FF||$OPERA)document.close();</script>");
            E.setPos = B;
            E.onload = Y;
            D.write("<html>");
            D.cfg = E;
            D.write(G.join(""))
        }

        function B(I) {
            var G = I.position.left, B = I.position.top, C = I.el;
            if (C == S)
                return;
            if (C != I.srcEl && (O(C) == "none" || C.type == "hidden"))
                C = I.srcEl;
            var H = V(C), $ = F(X), D = L(U), A = Z(U), E = $dp.dd.offsetHeight, _ = $dp.dd.offsetWidth;
            if (isNaN(B))
                B = 0;
            if (B != "under"
                && (($.topM + H.bottom + E > D.height) && ($.topM + H.top
                    - E > 0)))
                B += A.top + $.topM + H.top - E - 2;
            else
                B += A.top + $.topM + Math.min(H.bottom, D.height - E) + 2;
            if (isNaN(G))
                G = 0;
            G += A.left + Math.min($.leftM + H.left, D.width - _ - 5)
                - (R ? 2 : 0);
            I.dd.style.top = B + "px";
            I.dd.style.left = G + "px";

            if (!!$dp.dd.children[0].contentDocument.all.dpTitle) {
                $dp.dd.children[0].contentDocument.all.dpTitle.children[2].children[1].readOnly = true;
                $dp.dd.children[0].contentDocument.all.dpTitle.children[3].children[1].readOnly = true;
            }
            if (!!($dp.dd.children[0].contentDocument.all.dpTime)) {
                $dp.dd.children[0].contentDocument.all.dpTime.children[3].children[0].children[0].children[0].children[1].readOnly = true;
            }
        }

    }
})();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL0RhdGVQaWNrZXIvV2RhdGVQaWNrZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLypcclxuICogTXk5NyBEYXRlUGlja2VyIDQuOCBCZXRhMVxyXG4gKiBMaWNlbnNlOiBodHRwOi8vd3d3Lm15OTcubmV0L2RwL2xpY2Vuc2UuYXNwXHJcbiAqL1xyXG52YXIgJGRwLCBXZGF0ZVBpY2tlcjtcclxuKGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciAkID0ge1xyXG4gICAgICAgICRsYW5nTGlzdDogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImVuXCIsXHJcbiAgICAgICAgICAgICAgICBjaGFyc2V0OiBcIlVURi04XCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJ6aC1jblwiLFxyXG4gICAgICAgICAgICAgICAgY2hhcnNldDogXCJnYjIzMTJcIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInpoLXR3XCIsXHJcbiAgICAgICAgICAgICAgICBjaGFyc2V0OiBcIkdCS1wiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiamFcIixcclxuICAgICAgICAgICAgICAgIGNoYXJzZXQ6IFwiVVRGLThcIlxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXSxcclxuICAgICAgICAkc2tpbkxpc3Q6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJkZWZhdWx0XCIsXHJcbiAgICAgICAgICAgICAgICBjaGFyc2V0OiBcImdiMjMxMlwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwid2h5R3JlZW5cIixcclxuICAgICAgICAgICAgICAgIGNoYXJzZXQ6IFwiZ2IyMzEyXCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJnc0JsdWVcIixcclxuICAgICAgICAgICAgICAgIGNoYXJzZXQ6IFwiZ2IyMzEyXCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJibGFja1wiLFxyXG4gICAgICAgICAgICAgICAgY2hhcnNldDogXCJnYjIzMTJcIlxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXSxcclxuICAgICAgICAkd2RhdGU6IHRydWUsXHJcbiAgICAgICAgJGNyb3NzRnJhbWU6IHRydWUsXHJcbiAgICAgICAgJHByZUxvYWQ6IGZhbHNlLFxyXG4gICAgICAgIGRvdWJsZUNhbGVuZGFyOiBmYWxzZSxcclxuICAgICAgICBlbmFibGVLZXlib2FyZDogdHJ1ZSxcclxuICAgICAgICBlbmFibGVJbnB1dE1hc2s6IHRydWUsXHJcbiAgICAgICAgYXV0b1VwZGF0ZU9uQ2hhbmdlZDogbnVsbCxcclxuICAgICAgICB3aGljaERheUlzZmlyc3RXZWVrOiA0LFxyXG4vLyAgICAgICAgcGFyZW50OiAnbWFpbl92aWV3JyxcclxuICAgICAgICBwb3NpdGlvbjoge30sXHJcbiAgICAgICAgbGFuZzogXCJhdXRvXCIsXHJcbiAgICAgICAgc2tpbjogXCJkZWZhdWx0XCIsXHJcbiAgICAgICAgZGF0ZUZtdDogXCJ5eXl5LU1NLWRkXCIsXHJcbiAgICAgICAgcmVhbERhdGVGbXQ6IFwieXl5eS1NTS1kZFwiLFxyXG4gICAgICAgIHJlYWxUaW1lRm10OiBcIkhIOm1tOnNzXCIsXHJcbiAgICAgICAgcmVhbEZ1bGxGbXQ6IFwiJURhdGUgJVRpbWVcIixcclxuICAgICAgICBtaW5EYXRlOiBcIjE5MDAtMDEtMDEgMDA6MDA6MDBcIixcclxuICAgICAgICBtYXhEYXRlOiBcIjIwOTktMTItMzEgMjM6NTk6NTlcIixcclxuICAgICAgICBzdGFydERhdGU6IFwiXCIsXHJcbiAgICAgICAgYWx3YXlzVXNlU3RhcnREYXRlOiBmYWxzZSxcclxuICAgICAgICB5ZWFyT2Zmc2V0OiAxOTExLFxyXG4gICAgICAgIGZpcnN0RGF5T2ZXZWVrOiAwLFxyXG4gICAgICAgIGlzU2hvd1dlZWs6IGZhbHNlLFxyXG4gICAgICAgIGhpZ2hMaW5lV2Vla0RheTogdHJ1ZSxcclxuLy8gICAgICAgIGlzU2hvd0NsZWFyOiB0cnVlLFxyXG4gICAgICAgIGlzU2hvd0NsZWFyOiBmYWxzZSxcclxuLy8gICAgICAgIGlzU2hvd1RvZGF5OiB0cnVlLFxyXG4gICAgICAgIGlzU2hvd1RvZGF5OiBmYWxzZSxcclxuLy8gICAgICAgIGlzU2hvd09LOiB0cnVlLFxyXG4gICAgICAgIGlzU2hvd09LOiBmYWxzZSxcclxuICAgICAgICBpc1Nob3dPdGhlcnM6IHRydWUsXHJcbiAgICAgICAgcmVhZE9ubHk6IHRydWUsXHJcbiAgICAgICAgZXJyRGVhbE1vZGU6IDEsXHJcbi8vICAgICAgICBhdXRvUGlja0RhdGU6IG51bGwsXHJcbiAgICAgICAgYXV0b1BpY2tEYXRlOiB0cnVlLFxyXG4gICAgICAgIHFzRW5hYmxlZDogZmFsc2UsXHJcbiAgICAgICAgYXV0b1Nob3dRUzogZmFsc2UsXHJcblxyXG4gICAgICAgIHNwZWNpYWxEYXRlczogbnVsbCxcclxuICAgICAgICBzcGVjaWFsRGF5czogbnVsbCxcclxuICAgICAgICBkaXNhYmxlZERhdGVzOiBudWxsLFxyXG4gICAgICAgIGRpc2FibGVkRGF5czogbnVsbCxcclxuICAgICAgICBvcHBvc2l0ZTogZmFsc2UsXHJcbiAgICAgICAgZXJyTXNnOiBcIlwiLFxyXG4gICAgICAgIHF1aWNrU2VsOiBbXSxcclxuICAgICAgICBoYXM6IHt9LFxyXG5cclxuICAgICAgICBvbnBpY2tpbmc6IGZhbHNlLFxyXG4gICAgICAgIG9ucGlja2VkOiBmYWxzZSxcclxuICAgICAgICB5Y2hhbmdpbmc6IGZhbHNlLFxyXG4gICAgICAgIE1jaGFuZ2luZzogZmFsc2UsXHJcbiAgICAgICAgZGNoYW5naW5nOiBmYWxzZSxcclxuICAgICAgICBIY2hhbmdpbmc6IGZhbHNlLFxyXG4gICAgICAgIG1jaGFuZ2luZzogZmFsc2UsXHJcbiAgICAgICAgc2NoYW5naW5nOiBmYWxzZSxcclxuICAgICAgICB5Y2hhbmdlZDogZmFsc2UsXHJcbiAgICAgICAgTWNoYW5nZWQ6IGZhbHNlLFxyXG4gICAgICAgIGRjaGFuZ2VkOiBmYWxzZSxcclxuICAgICAgICBIY2hhbmdlZDogZmFsc2UsXHJcbiAgICAgICAgbWNoYW5nZWQ6IGZhbHNlLFxyXG4gICAgICAgIHNjaGFuZ2VkOiBmYWxzZSxcclxuXHJcbiAgICAgICAgZ2V0UmVhbExhbmc6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIF8gPSAkLiRsYW5nTGlzdDtcclxuICAgICAgICAgICAgZm9yICh2YXIgQSA9IDA7IEEgPCBfLmxlbmd0aDsgQSsrKVxyXG4gICAgICAgICAgICAgICAgaWYgKF9bQV0ubmFtZSA9PSB0aGlzLmxhbmcpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF9bQV07XHJcbiAgICAgICAgICAgIHJldHVybiBfWzBdXHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIFdkYXRlUGlja2VyID0gVDtcclxuICAgIHZhciBYID0gd2luZG93LCBTID0ge1xyXG4gICAgICAgIGlubmVySFRNTDogXCJcIlxyXG4gICAgfSwgTSA9IFwiZG9jdW1lbnRcIiwgSCA9IFwiZG9jdW1lbnRFbGVtZW50XCIsIEMgPSBcImdldEVsZW1lbnRzQnlUYWdOYW1lXCIsIFUsIEEsIFIsIEcsIGEsIFcgPSBuYXZpZ2F0b3IuYXBwTmFtZTtcclxuICAgIGlmIChXID09IFwiTWljcm9zb2Z0IEludGVybmV0IEV4cGxvcmVyXCIpXHJcbiAgICAgICAgUiA9IHRydWU7XHJcbiAgICBlbHNlIGlmIChXID09IFwiT3BlcmFcIilcclxuICAgICAgICBhID0gdHJ1ZTtcclxuICAgIGVsc2VcclxuICAgICAgICBHID0gdHJ1ZTtcclxuICAgIEEgPSBKKCk7XHJcbiAgICBpZiAoJC4kd2RhdGUpXHJcbiAgICAgICAgSyhBICsgXCJza2luL1dkYXRlUGlja2VyLmNzc1wiKTtcclxuICAgIFUgPSBYO1xyXG4gICAgaWYgKCQuJGNyb3NzRnJhbWUpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICB3aGlsZSAoVS5wYXJlbnQgJiYgVS5wYXJlbnRbTV0gIT0gVVtNXVxyXG4gICAgICAgICAgICAgICAgJiYgVS5wYXJlbnRbTV1bQ10oXCJmcmFtZXNldFwiKS5sZW5ndGggPT0gMClcclxuICAgICAgICAgICAgICAgIFUgPSBVLnBhcmVudFxyXG4gICAgICAgIH0gY2F0Y2ggKE4pIHtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAoIVUuJGRwKVxyXG4gICAgICAgIFUuJGRwID0ge1xyXG4gICAgICAgICAgICBmZjogRyxcclxuICAgICAgICAgICAgaWU6IFIsXHJcbiAgICAgICAgICAgIG9wZXJhOiBhLFxyXG4gICAgICAgICAgICBzdGF0dXM6IDAsXHJcbiAgICAgICAgICAgIGRlZk1pbkRhdGU6ICQubWluRGF0ZSxcclxuICAgICAgICAgICAgZGVmTWF4RGF0ZTogJC5tYXhEYXRlXHJcbiAgICAgICAgfTtcclxuICAgIEIoKTtcclxuICAgIGlmICgkLiRwcmVMb2FkICYmICRkcC5zdGF0dXMgPT0gMClcclxuICAgICAgICBFKFgsIFwib25sb2FkXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgVChudWxsLCB0cnVlKVxyXG4gICAgICAgIH0pO1xyXG4gICAgaWYgKCFYW01dLmRvY01EKSB7XHJcbiAgICAgICAgRShYW01dLCBcIm9ubW91c2Vkb3duXCIsIEQpO1xyXG4gICAgICAgIFhbTV0uZG9jTUQgPSB0cnVlXHJcbiAgICB9XHJcbiAgICBpZiAoIVVbTV0uZG9jTUQpIHtcclxuICAgICAgICBFKFVbTV0sIFwib25tb3VzZWRvd25cIiwgRCk7XHJcbiAgICAgICAgVVtNXS5kb2NNRCA9IHRydWVcclxuICAgIH1cclxuICAgIEUoWCwgXCJvbnVubG9hZFwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKCRkcC5kZClcclxuICAgICAgICAgICAgTygkZHAuZGQsIFwibm9uZVwiKVxyXG4gICAgfSk7XHJcbiAgICBmdW5jdGlvbiBCKCkge1xyXG4gICAgICAgIFUuJGRwID0gVS4kZHAgfHwge307XHJcbiAgICAgICAgb2JqID0ge1xyXG4gICAgICAgICAgICAkOiBmdW5jdGlvbiAoJCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuICh0eXBlb2YgJCA9PSBcInN0cmluZ1wiKSA/IFhbTV0uZ2V0RWxlbWVudEJ5SWQoJCkgOiAkXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICREOiBmdW5jdGlvbiAoJCwgXykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuJERWKHRoaXMuJCgkKS52YWx1ZSwgXylcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgJERWOiBmdW5jdGlvbiAoXywgJCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKF8gIT0gXCJcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZHQgPSAkZHAuY2FsLnNwbGl0RGF0ZShfLCAkZHAuY2FsLmRhdGVGbXQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICgkKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBCIGluICQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5kdFtCXSA9PT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZXJyTXNnID0gXCJpbnZhbGlkIHByb3BlcnR5OlwiICsgQjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZHRbQl0gKz0gJFtCXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoQiA9PSBcIk1cIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgQyA9ICRbXCJNXCJdID4gMCA/IDEgOiAwLCBBID0gbmV3IERhdGUoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmR0W1wieVwiXSwgdGhpcy5kdFtcIk1cIl0sIDApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZ2V0RGF0ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmR0W1wiZFwiXSA9IE1hdGhcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5taW4oQSArIEMsIHRoaXMuZHRbXCJkXCJdKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5kdC5yZWZyZXNoKCkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmR0XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJcIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzaG93OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgQSA9IFVbTV0uZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJkaXZcIiksICQgPSAxMDAwMDA7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBCID0gMDsgQiA8IEEubGVuZ3RoOyBCKyspIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgXyA9IHBhcnNlSW50KEFbQl0uc3R5bGUuekluZGV4KTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoXyA+ICQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQgPSBfXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRkLnN0eWxlLnpJbmRleCA9ICQgKyAxO1xyXG4gICAgICAgICAgICAgICAgTyh0aGlzLmRkLCBcImJsb2NrXCIpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBoaWRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBPKHRoaXMuZGQsIFwibm9uZVwiKVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBhdHRhY2hFdmVudDogRVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgZm9yICh2YXIgJCBpbiBvYmopXHJcbiAgICAgICAgICAgIFUuJGRwWyRdID0gb2JqWyRdO1xyXG4gICAgICAgICRkcCA9IFUuJGRwXHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gRShBLCAkLCBfKSB7XHJcbiAgICAgICAgaWYgKFIpXHJcbiAgICAgICAgICAgIEEuYXR0YWNoRXZlbnQoJCwgXyk7XHJcbiAgICAgICAgZWxzZSBpZiAoXykge1xyXG4gICAgICAgICAgICB2YXIgQiA9ICQucmVwbGFjZSgvb24vLCBcIlwiKTtcclxuICAgICAgICAgICAgXy5faWVFbXVFdmVudEhhbmRsZXIgPSBmdW5jdGlvbiAoJCkge1xyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXygkKTtcclxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHt9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIEEuYWRkRXZlbnRMaXN0ZW5lcihCLCBfLl9pZUVtdUV2ZW50SGFuZGxlciwgZmFsc2UpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIEooKSB7XHJcbiAgICAgICAgdmFyIF8sIEEsICQgPSBYW01dW0NdKFwic2NyaXB0XCIpO1xyXG4gICAgICAgIGZvciAodmFyIEIgPSAwOyBCIDwgJC5sZW5ndGg7IEIrKykge1xyXG4gICAgICAgICAgICBfID0gJFtCXS5nZXRBdHRyaWJ1dGUoXCJzcmNcIik7XHJcbiAgICAgICAgICAgIF8gPSBfLnN1YnN0cigwLCBfLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihcIndkYXRlcGlja2VyLmpzXCIpKTtcclxuICAgICAgICAgICAgQSA9IF8ubGFzdEluZGV4T2YoXCIvXCIpO1xyXG4gICAgICAgICAgICBpZiAoQSA+IDApXHJcbiAgICAgICAgICAgICAgICBfID0gXy5zdWJzdHJpbmcoMCwgQSArIDEpO1xyXG4gICAgICAgICAgICBpZiAoXylcclxuICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBfXHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gSyhBLCAkLCBCKSB7XHJcbiAgICAgICAgdmFyIEQgPSBYW01dW0NdKFwiSEVBRFwiKS5pdGVtKDApLCBfID0gWFtNXS5jcmVhdGVFbGVtZW50KFwibGlua1wiKTtcclxuICAgICAgICBpZiAoRCkge1xyXG4gICAgICAgICAgICBfLmhyZWYgPSBBO1xyXG4gICAgICAgICAgICBfLnJlbCA9IFwic3R5bGVzaGVldFwiO1xyXG4gICAgICAgICAgICBfLnR5cGUgPSBcInRleHQvY3NzXCI7XHJcbiAgICAgICAgICAgIGlmICgkKVxyXG4gICAgICAgICAgICAgICAgXy50aXRsZSA9ICQ7XHJcbiAgICAgICAgICAgIGlmIChCKVxyXG4gICAgICAgICAgICAgICAgXy5jaGFyc2V0ID0gQjtcclxuICAgICAgICAgICAgRC5hcHBlbmRDaGlsZChfKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBGKCQpIHtcclxuICAgICAgICAkID0gJCB8fCBVO1xyXG4gICAgICAgIHZhciBBID0gMCwgXyA9IDA7XHJcbiAgICAgICAgd2hpbGUgKCQgIT0gVSkge1xyXG4gICAgICAgICAgICB2YXIgRCA9ICQucGFyZW50W01dW0NdKFwiaWZyYW1lXCIpO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBGID0gMDsgRiA8IEQubGVuZ3RoOyBGKyspIHtcclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKERbRl0uY29udGVudFdpbmRvdyA9PSAkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBFID0gVihEW0ZdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgQSArPSBFLmxlZnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF8gKz0gRS50b3A7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoQikge1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICQgPSAkLnBhcmVudFxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBcImxlZnRNXCI6IEEsXHJcbiAgICAgICAgICAgIFwidG9wTVwiOiBfXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIFYoRikge1xyXG4gICAgICAgIGlmIChGLmdldEJvdW5kaW5nQ2xpZW50UmVjdClcclxuICAgICAgICAgICAgcmV0dXJuIEYuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHZhciBBID0ge1xyXG4gICAgICAgICAgICAgICAgUk9PVF9UQUc6IC9eYm9keXxodG1sJC9pLFxyXG4gICAgICAgICAgICAgICAgT1BfU0NST0xMOiAvXig/OmlubGluZXx0YWJsZS1yb3cpJC9pXHJcbiAgICAgICAgICAgIH0sIEUgPSBmYWxzZSwgSCA9IG51bGwsIF8gPSBGLm9mZnNldFRvcCwgRyA9IEYub2Zmc2V0TGVmdCwgRCA9IEYub2Zmc2V0V2lkdGgsIEIgPSBGLm9mZnNldEhlaWdodCwgQyA9IEYub2Zmc2V0UGFyZW50O1xyXG4gICAgICAgICAgICBpZiAoQyAhPSBGKVxyXG4gICAgICAgICAgICAgICAgd2hpbGUgKEMpIHtcclxuICAgICAgICAgICAgICAgICAgICBHICs9IEMub2Zmc2V0TGVmdDtcclxuICAgICAgICAgICAgICAgICAgICBfICs9IEMub2Zmc2V0VG9wO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChRKEMsIFwicG9zaXRpb25cIikudG9Mb3dlckNhc2UoKSA9PSBcImZpeGVkXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIEUgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKEMudGFnTmFtZS50b0xvd2VyQ2FzZSgpID09IFwiYm9keVwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBIID0gQy5vd25lckRvY3VtZW50LmRlZmF1bHRWaWV3O1xyXG4gICAgICAgICAgICAgICAgICAgIEMgPSBDLm9mZnNldFBhcmVudFxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICBGLmdldEJvdW5kaW5nQ2xpZW50UmVjdCAmJiAoRyA9IEYuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkubGVmdCk7XHJcbiAgICAgICAgICAgIEMgPSBGLnBhcmVudE5vZGU7XHJcbiAgICAgICAgICAgIHdoaWxlIChRKEMsIFwicG9zaXRpb25cIikudG9Mb3dlckNhc2UoKSAhPSBcImZpeGVkXCIgJiYgKEMudGFnTmFtZSAmJiAhQS5ST09UX1RBRy50ZXN0KEMudGFnTmFtZSkpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoQy5zY3JvbGxUb3AgfHwgQy5zY3JvbGxMZWZ0KVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghQS5PUF9TQ1JPTEwudGVzdChPKEMpKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFhIHx8IEMuc3R5bGUub3ZlcmZsb3cgIT09IFwidmlzaWJsZVwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBHIC09IEMuc2Nyb2xsTGVmdDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF8gLT0gQy5zY3JvbGxUb3BcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgQyA9IEMucGFyZW50Tm9kZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICghRSkge1xyXG4gICAgICAgICAgICAgICAgdmFyICQgPSBaKEgpO1xyXG4gICAgICAgICAgICAgICAgRyAtPSAkLmxlZnQ7XHJcbiAgICAgICAgICAgICAgICBfIC09ICQudG9wXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgRCArPSBHO1xyXG4gICAgICAgICAgICBCICs9IF87XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBcImxlZnRcIjogRyxcclxuICAgICAgICAgICAgICAgIFwidG9wXCI6IF8sXHJcbiAgICAgICAgICAgICAgICBcInJpZ2h0XCI6IEQsXHJcbiAgICAgICAgICAgICAgICBcImJvdHRvbVwiOiBCXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIEwoJCkge1xyXG4gICAgICAgICQgPSAkIHx8IFU7XHJcbiAgICAgICAgdmFyIEIgPSAkW01dLCBBID0gKCQuaW5uZXJXaWR0aCkgPyAkLmlubmVyV2lkdGhcclxuICAgICAgICAgICAgOiAoQltIXSAmJiBCW0hdLmNsaWVudFdpZHRoKSA/IEJbSF0uY2xpZW50V2lkdGhcclxuICAgICAgICAgICAgOiBCLmJvZHkub2Zmc2V0V2lkdGgsIF8gPSAoJC5pbm5lckhlaWdodCkgPyAkLmlubmVySGVpZ2h0XHJcbiAgICAgICAgICAgIDogKEJbSF0gJiYgQltIXS5jbGllbnRIZWlnaHQpID8gQltIXS5jbGllbnRIZWlnaHRcclxuICAgICAgICAgICAgOiBCLmJvZHkub2Zmc2V0SGVpZ2h0O1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIFwid2lkdGhcIjogQSxcclxuICAgICAgICAgICAgXCJoZWlnaHRcIjogX1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBaKCQpIHtcclxuICAgICAgICAkID0gJCB8fCBVO1xyXG4gICAgICAgIHZhciBCID0gJFtNXSwgQSA9IEJbSF0sIF8gPSBCLmJvZHk7XHJcbiAgICAgICAgQiA9IChBICYmIEEuc2Nyb2xsVG9wICE9IG51bGwgJiYgKEEuc2Nyb2xsVG9wID4gXy5zY3JvbGxUb3AgfHwgQS5zY3JvbGxMZWZ0ID4gXy5zY3JvbGxMZWZ0KSkgPyBBXHJcbiAgICAgICAgICAgIDogXztcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBcInRvcFwiOiBCLnNjcm9sbFRvcCxcclxuICAgICAgICAgICAgXCJsZWZ0XCI6IEIuc2Nyb2xsTGVmdFxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBEKCQpIHtcclxuICAgICAgICB2YXIgXyA9ICQgPyAoJC5zcmNFbGVtZW50IHx8ICQudGFyZ2V0KSA6IG51bGw7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgaWYgKCRkcC5jYWwgJiYgISRkcC5lQ29udCAmJiAkZHAuZGQgJiYgXyAhPSAkZHAuZWxcclxuICAgICAgICAgICAgICAgICYmICRkcC5kZC5zdHlsZS5kaXNwbGF5ID09IFwiYmxvY2tcIilcclxuICAgICAgICAgICAgICAgICRkcC5jYWwuY2xvc2UoKVxyXG4gICAgICAgIH0gY2F0Y2ggKCQpIHtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gWSgpIHtcclxuICAgICAgICAkZHAuc3RhdHVzID0gMlxyXG4gICAgfVxyXG5cclxuICAgIHZhciBQLCBfO1xyXG5cclxuICAgIGZ1bmN0aW9uIFQoTCwgRCkge1xyXG4gICAgICAgICRkcC53aW4gPSBYO1xyXG4gICAgICAgIEIoKTtcclxuICAgICAgICBMID0gTCB8fCB7fTtcclxuICAgICAgICBmb3IgKHZhciBKIGluICQpXHJcbiAgICAgICAgICAgIGlmIChKLnN1YnN0cmluZygwLCAxKSAhPSBcIiRcIiAmJiBMW0pdID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgICAgICBMW0pdID0gJFtKXTtcclxuICAgICAgICBpZiAoRCkge1xyXG4gICAgICAgICAgICBpZiAoIUsoKSkge1xyXG4gICAgICAgICAgICAgICAgXyA9IF8gfHwgc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChVW01dLnJlYWR5U3RhdGUgPT0gXCJjb21wbGV0ZVwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKF8pO1xyXG4gICAgICAgICAgICAgICAgICAgIFQobnVsbCwgdHJ1ZSlcclxuICAgICAgICAgICAgICAgIH0sIDUwKTtcclxuICAgICAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICgkZHAuc3RhdHVzID09IDApIHtcclxuICAgICAgICAgICAgICAgICRkcC5zdGF0dXMgPSAxO1xyXG4gICAgICAgICAgICAgICAgTC5lbCA9IFM7XHJcbiAgICAgICAgICAgICAgICBJKEwsIHRydWUpXHJcbiAgICAgICAgICAgIH0gZWxzZVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgfSBlbHNlIGlmIChMLmVDb250KSB7XHJcbiAgICAgICAgICAgIEwuZUNvbnQgPSAkZHAuJChMLmVDb250KTtcclxuICAgICAgICAgICAgTC5lbCA9IFM7XHJcbiAgICAgICAgICAgIEwuYXV0b1BpY2tEYXRlID0gdHJ1ZTtcclxuICAgICAgICAgICAgTC5xc0VuYWJsZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgSShMKVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGlmICgkLiRwcmVMb2FkICYmICRkcC5zdGF0dXMgIT0gMilcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgdmFyIEggPSBGKCk7XHJcbiAgICAgICAgICAgIGlmIChIKSB7XHJcbiAgICAgICAgICAgICAgICBMLnNyY0VsID0gSC5zcmNFbGVtZW50IHx8IEgudGFyZ2V0O1xyXG4gICAgICAgICAgICAgICAgSC5jYW5jZWxCdWJibGUgPSB0cnVlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgTC5lbCA9IEwuZWwgPSAkZHAuJChMLmVsIHx8IEwuc3JjRWwpO1xyXG5cdFx0XHRpZiAoIUwuZWxcclxuXHRcdFx0XHRcdHx8IEwuZWxbXCJNeTk3TWFya1wiXSA9PT0gdHJ1ZVxyXG5cdFx0XHRcdFx0fHwgTC5lbC5kaXNhYmxlZFxyXG5cdFx0XHRcdFx0fHwgKCRkcC5kZCAmJiBPKCRkcC5kZCkgIT0gXCJub25lXCIgJiYgJGRwLmRkLnN0eWxlLmxlZnQgIT0gXCItOTcwcHhcIikpIHtcclxuXHRcdFx0XHRMLmVsW1wiTXk5N01hcmtcIl0gPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIGlmICghTC5lbCAmJiBMLmVsLmRpc2FibGVkKSByZXR1cm47XHJcblx0XHRcdH1cclxuICAgICAgICAgICAgSShMKTtcclxuICAgICAgICAgICAgaWYgKEggJiYgTC5lbC5ub2RlVHlwZSA9PSAxICYmIEwuZWxbXCJNeTk3TWFya1wiXSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICBMLmVsW1wiTXk5N01hcmtcIl0gPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIHZhciBBLCBDO1xyXG4gICAgICAgICAgICAgICAgaWYgKEgudHlwZSA9PSBcImZvY3VzXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBBID0gXCJvbmNsaWNrXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgQyA9IFwib25mb2N1c1wiXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIEEgPSBcIm9uZm9jdXNcIjtcclxuICAgICAgICAgICAgICAgICAgICBDID0gXCJvbmNsaWNrXCJcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIEUoTC5lbCwgQSwgTC5lbFtDXSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBLKCkge1xyXG4gICAgICAgICAgICBpZiAoUiAmJiBVICE9IFggJiYgVVtNXS5yZWFkeVN0YXRlICE9IFwiY29tcGxldGVcIilcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWVcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIEYoKSB7XHJcbiAgICAgICAgICAgIGlmIChHKSB7XHJcbiAgICAgICAgICAgICAgICBmdW5jID0gRi5jYWxsZXI7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoZnVuYyAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyICQgPSBmdW5jLmFyZ3VtZW50c1swXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoJCAmJiAoJCArIFwiXCIpLmluZGV4T2YoXCJFdmVudFwiKSA+PSAwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJDtcclxuICAgICAgICAgICAgICAgICAgICBmdW5jID0gZnVuYy5jYWxsZXJcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGV2ZW50XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIFEoXywgJCkge1xyXG4gICAgICAgIHJldHVybiBfLmN1cnJlbnRTdHlsZSA/IF8uY3VycmVudFN0eWxlWyRdIDogZG9jdW1lbnQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZShfLCBmYWxzZSlbJF1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBPKF8sICQpIHtcclxuICAgICAgICBpZiAoXylcclxuICAgICAgICAgICAgaWYgKCQgIT0gbnVsbClcclxuICAgICAgICAgICAgICAgIF8uc3R5bGUuZGlzcGxheSA9ICQ7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHJldHVybiBRKF8sIFwiZGlzcGxheVwiKVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIEkoRywgXykge1xyXG4gICAgICAgIHZhciBEID0gRy5lbCA/IEcuZWwubm9kZU5hbWUgOiBcIklOUFVUXCI7XHJcbiAgICAgICAgaWYgKF8gfHwgRy5lQ29udCB8fCBuZXcgUmVnRXhwKC9pbnB1dHx0ZXh0YXJlYXxkaXZ8c3BhbnxwfGEvaWcpLnRlc3QoRCkpXHJcbiAgICAgICAgICAgIEcuZWxQcm9wID0gRCA9PSBcIklOUFVUXCIgPyBcInZhbHVlXCIgOiBcImlubmVySFRNTFwiO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIGlmIChHLmxhbmcgPT0gXCJhdXRvXCIpXHJcbiAgICAgICAgICAgIEcubGFuZyA9IFIgPyBuYXZpZ2F0b3IuYnJvd3Nlckxhbmd1YWdlLnRvTG93ZXJDYXNlKCkgOiBuYXZpZ2F0b3IubGFuZ3VhZ2UudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICBpZiAoIUcuZUNvbnQpXHJcbiAgICAgICAgICAgIGZvciAodmFyIEMgaW4gRylcclxuICAgICAgICAgICAgICAgICRkcFtDXSA9IEdbQ107XHJcbiAgICAgICAgaWYgKCEkZHAuZGRcclxuICAgICAgICAgICAgfHwgRy5lQ29udFxyXG4gICAgICAgICAgICB8fCAoJGRwLmRkICYmIChHLmdldFJlYWxMYW5nKCkubmFtZSAhPSAkZHAuZGQubGFuZyB8fCBHLnNraW4gIT0gJGRwLmRkLnNraW4pKSkge1xyXG4gICAgICAgICAgICBpZiAoRy5lQ29udClcclxuICAgICAgICAgICAgICAgIEUoRy5lQ29udCwgRyk7XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgJGRwLmRkID0gVVtNXS5jcmVhdGVFbGVtZW50KFwiRElWXCIpO1xyXG4gICAgICAgICAgICAgICAgJGRwLmRkLmlkID0gXCJpZW1zRGF0ZVBpY2tlclwiO1xyXG4gICAgICAgICAgICAgICAgJGRwLmRkLnN0eWxlLmNzc1RleHQgPSBcInBvc2l0aW9uOmZpeGVkXCI7XHJcbiAgICAgICAgICAgICAgICAoKCQucGFyZW50ICYmIFVbTV0uZ2V0RWxlbWVudEJ5SWQoJC5wYXJlbnQpKSB8fCBVW01dLmJvZHkpLmFwcGVuZENoaWxkKCRkcC5kZCk7XHJcbiAgICAgICAgICAgICAgICBFKCRkcC5kZCwgRyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoXylcclxuICAgICAgICAgICAgICAgICAgICAkZHAuZGQuc3R5bGUubGVmdCA9ICRkcC5kZC5zdHlsZS50b3AgPSBcIi05NzBweFwiO1xyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJGRwLnNob3coKTtcclxuICAgICAgICAgICAgICAgICAgICBCKCRkcClcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAoJGRwLmNhbCkge1xyXG4gICAgICAgICAgICAkZHAuc2hvdygpO1xyXG4gICAgICAgICAgICAkZHAuY2FsLmluaXQoKTtcclxuICAgICAgICAgICAgaWYgKCEkZHAuZUNvbnQpXHJcbiAgICAgICAgICAgICAgICBCKCRkcClcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gRShGLCBFKSB7XHJcbiAgICAgICAgICAgIEYuaW5uZXJIVE1MID0gXCI8aWZyYW1lIGhpZGVGb2N1cz10cnVlIHdpZHRoPTk3IGhlaWdodD05IGZyYW1lYm9yZGVyPTAgYm9yZGVyPTAgc2Nyb2xsaW5nPW5vPjwvaWZyYW1lPlwiO1xyXG4gICAgICAgICAgICB2YXIgRCA9IEYubGFzdENoaWxkLmNvbnRlbnRXaW5kb3dbTV0sIF8gPSAkLiRsYW5nTGlzdCwgQyA9ICQuJHNraW5MaXN0LCBIID0gRS5nZXRSZWFsTGFuZygpO1xyXG4gICAgICAgICAgICBGLmxhbmcgPSBILm5hbWU7XHJcbiAgICAgICAgICAgIEYuc2tpbiA9IEUuc2tpbjtcclxuICAgICAgICAgICAgdmFyIEcgPSBbXHJcbiAgICAgICAgICAgICAgICBcIjxoZWFkPjxzY3JpcHQ+ZG9jdW1lbnQub25jb250ZXh0bWVudT1mdW5jdGlvbigpe3JldHVybiBmYWxzZTt9O1wiLFxyXG4gICAgICAgICAgICAgICAgXCJ3aW5kb3cub25rZXlkb3duPWZ1bmN0aW9uKCl7aWYgKGV2ZW50LmtleUNvZGUgPT09IDExMikge3BhcmVudC5vcGVuT25saW5lSGVscCgpO2V2ZW50LmtleUNvZGUgPSAwO3JldHVybiBmYWxzZTt9fTtcIixcclxuICAgICAgICAgICAgICAgIFwidmFyICRkLCAkZHAsICRjZmc9ZG9jdW1lbnQuY2ZnLCAkcGRwID0gcGFyZW50LiRkcCwgJGR0LCAkdGR0LCAkc2R0LCAkbGFzdElucHV0LCAkSUU9JHBkcC5pZSwgJEZGID0gJHBkcC5mZiwkT1BFUkE9JHBkcC5vcGVyYSwgJG55LCAkY01hcmsgPSBmYWxzZTtcIixcclxuICAgICAgICAgICAgICAgIFwiaWYoJGNmZy5lQ29udCkgeyRkcCA9IHt9O2Zvcih2YXIgcCBpbiAkcGRwKSB7JGRwW3BdID0gJHBkcFtwXTt9fWVsc2V7JGRwID0gJHBkcDt9O2ZvciAodmFyIHAgaW4gJGNmZykgeyRkcFtwXSA9ICRjZmdbcF07fTtcIixcclxuICAgICAgICAgICAgICAgIFwiPC9zY3JpcHQ+PHNjcmlwdCBzcmM9XCIsIEEsIFwibGFuZy9cIiwgSC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgXCIuanMgY2hhcnNldD1cIiwgSC5jaGFyc2V0LCBcIj48L3NjcmlwdD5cIiBdO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBJID0gMDsgSSA8IEMubGVuZ3RoOyBJKyspXHJcbiAgICAgICAgICAgICAgICBpZiAoQ1tJXS5uYW1lID09IEUuc2tpbilcclxuICAgICAgICAgICAgICAgICAgICBHLnB1c2goXCI8bGluayByZWw9XFxcInN0eWxlc2hlZXRcXFwiIHR5cGU9XFxcInRleHQvY3NzXFxcIiBocmVmPVxcXCJcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICArIEEgKyBcInNraW4vXCIgKyBDW0ldLm5hbWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgKyBcIi9kYXRlcGlja2VyLmNzc1xcXCIgY2hhcnNldD1cXFwiXCIgKyBDW0ldLmNoYXJzZXRcclxuICAgICAgICAgICAgICAgICAgICAgICAgKyBcIlxcXCIvPlwiKTtcclxuICAgICAgICAgICAgRy5wdXNoKFwiPHNjcmlwdCB0eXBlPVxcXCJ0ZXh0L2phdmFzY3JpcHRcXFwiIHNyYz1cXFwiXCJcclxuICAgICAgICAgICAgICAgICAgICArIEEgKyBcImNhbGVuZGFyLmpzP1xcXCIrTWF0aC5yYW5kb20oKStcXFwiIGNoYXJzZXQ9XFxcImdiMjMxMlxcXCI+PC9zY3JpcHQ+XCIpO1xyXG4gICAgICAgICAgICBHLnB1c2goXCI8L2hlYWQ+PGJvZHkgbGVmdG1hcmdpbj1cXFwiMFxcXCIgdG9wbWFyZ2luPVxcXCIwXFxcIiB0YWJpbmRleD0wPjwvYm9keT48L2h0bWw+XCIpO1xyXG4gICAgICAgICAgICBHLnB1c2goXCI8c2NyaXB0PnZhciB0O3Q9dHx8c2V0SW50ZXJ2YWwoZnVuY3Rpb24oKXtpZihkb2N1bWVudC5yZWFkeSl7bmV3IE15OTdEUCgpOyRjZmcub25sb2FkKCk7JGMuYXV0b1NpemUoKTskY2ZnLnNldFBvcygkZHApO2NsZWFySW50ZXJ2YWwodCk7fX0sMjApO2lmKCRGRnx8JE9QRVJBKWRvY3VtZW50LmNsb3NlKCk7PC9zY3JpcHQ+XCIpO1xyXG4gICAgICAgICAgICBFLnNldFBvcyA9IEI7XHJcbiAgICAgICAgICAgIEUub25sb2FkID0gWTtcclxuICAgICAgICAgICAgRC53cml0ZShcIjxodG1sPlwiKTtcclxuICAgICAgICAgICAgRC5jZmcgPSBFO1xyXG4gICAgICAgICAgICBELndyaXRlKEcuam9pbihcIlwiKSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIEIoSSkge1xyXG4gICAgICAgICAgICB2YXIgRyA9IEkucG9zaXRpb24ubGVmdCwgQiA9IEkucG9zaXRpb24udG9wLCBDID0gSS5lbDtcclxuICAgICAgICAgICAgaWYgKEMgPT0gUylcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgaWYgKEMgIT0gSS5zcmNFbCAmJiAoTyhDKSA9PSBcIm5vbmVcIiB8fCBDLnR5cGUgPT0gXCJoaWRkZW5cIikpXHJcbiAgICAgICAgICAgICAgICBDID0gSS5zcmNFbDtcclxuICAgICAgICAgICAgdmFyIEggPSBWKEMpLCAkID0gRihYKSwgRCA9IEwoVSksIEEgPSBaKFUpLCBFID0gJGRwLmRkLm9mZnNldEhlaWdodCwgXyA9ICRkcC5kZC5vZmZzZXRXaWR0aDtcclxuICAgICAgICAgICAgaWYgKGlzTmFOKEIpKVxyXG4gICAgICAgICAgICAgICAgQiA9IDA7XHJcbiAgICAgICAgICAgIGlmIChCICE9IFwidW5kZXJcIlxyXG4gICAgICAgICAgICAgICAgJiYgKCgkLnRvcE0gKyBILmJvdHRvbSArIEUgPiBELmhlaWdodCkgJiYgKCQudG9wTSArIEgudG9wXHJcbiAgICAgICAgICAgICAgICAgICAgLSBFID4gMCkpKVxyXG4gICAgICAgICAgICAgICAgQiArPSBBLnRvcCArICQudG9wTSArIEgudG9wIC0gRSAtIDI7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIEIgKz0gQS50b3AgKyAkLnRvcE0gKyBNYXRoLm1pbihILmJvdHRvbSwgRC5oZWlnaHQgLSBFKSArIDI7XHJcbiAgICAgICAgICAgIGlmIChpc05hTihHKSlcclxuICAgICAgICAgICAgICAgIEcgPSAwO1xyXG4gICAgICAgICAgICBHICs9IEEubGVmdCArIE1hdGgubWluKCQubGVmdE0gKyBILmxlZnQsIEQud2lkdGggLSBfIC0gNSlcclxuICAgICAgICAgICAgICAgIC0gKFIgPyAyIDogMCk7XHJcbiAgICAgICAgICAgIEkuZGQuc3R5bGUudG9wID0gQiArIFwicHhcIjtcclxuICAgICAgICAgICAgSS5kZC5zdHlsZS5sZWZ0ID0gRyArIFwicHhcIjtcclxuXHJcbiAgICAgICAgICAgIGlmICghISRkcC5kZC5jaGlsZHJlblswXS5jb250ZW50RG9jdW1lbnQuYWxsLmRwVGl0bGUpIHtcclxuICAgICAgICAgICAgICAgICRkcC5kZC5jaGlsZHJlblswXS5jb250ZW50RG9jdW1lbnQuYWxsLmRwVGl0bGUuY2hpbGRyZW5bMl0uY2hpbGRyZW5bMV0ucmVhZE9ubHkgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgJGRwLmRkLmNoaWxkcmVuWzBdLmNvbnRlbnREb2N1bWVudC5hbGwuZHBUaXRsZS5jaGlsZHJlblszXS5jaGlsZHJlblsxXS5yZWFkT25seSA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCEhKCRkcC5kZC5jaGlsZHJlblswXS5jb250ZW50RG9jdW1lbnQuYWxsLmRwVGltZSkpIHtcclxuICAgICAgICAgICAgICAgICRkcC5kZC5jaGlsZHJlblswXS5jb250ZW50RG9jdW1lbnQuYWxsLmRwVGltZS5jaGlsZHJlblszXS5jaGlsZHJlblswXS5jaGlsZHJlblswXS5jaGlsZHJlblswXS5jaGlsZHJlblsxXS5yZWFkT25seSA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG59KSgpOyJdLCJmaWxlIjoicGx1Z2lucy9EYXRlUGlja2VyL1dkYXRlUGlja2VyLmpzIn0=
