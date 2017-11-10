/**
 * Created with JetBrains PhpStorm.
 * User: xuheng
 * Date: 12-9-26
 * Time: 下午1:09
 * To change this template use File | Settings | File Templates.
 */
var charsContent = [
    { name:"tsfh", title:lang.tsfh, content:toArray("、,。,·,ˉ,ˇ,¨,〃,々,—,～,‖,…,‘,’,“,”,〔,〕,〈,〉,《,》,「,」,『,』,〖,〗,【,】,±,×,÷,∶,∧,∨,∑,∏,∪,∩,∈,∷,√,⊥,∥,∠,⌒,⊙,∫,∮,≡,≌,≈,∽,∝,≠,≮,≯,≤,≥,∞,∵,∴,♂,♀,°,′,″,℃,＄,¤,￠,￡,‰,§,№,☆,★,○,●,◎,◇,◆,□,■,△,▲,※,→,←,↑,↓,〓,〡,〢,〣,〤,〥,〦,〧,〨,〩,㊣,㎎,㎏,㎜,㎝,㎞,㎡,㏄,㏎,㏑,㏒,㏕,︰,￢,￤,℡,ˊ,ˋ,˙,–,―,‥,‵,℅,℉,↖,↗,↘,↙,∕,∟,∣,≒,≦,≧,⊿,═,║,╒,╓,╔,╕,╖,╗,╘,╙,╚,╛,╜,╝,╞,╟,╠,╡,╢,╣,╤,╥,╦,╧,╨,╩,╪,╫,╬,╭,╮,╯,╰,╱,╲,╳,▁,▂,▃,▄,▅,▆,▇,�,█,▉,▊,▋,▌,▍,▎,▏,▓,▔,▕,▼,▽,◢,◣,◤,◥,☉,⊕,〒,〝,〞")},
    { name:"lmsz", title:lang.lmsz, content:toArray("ⅰ,ⅱ,ⅲ,ⅳ,ⅴ,ⅵ,ⅶ,ⅷ,ⅸ,ⅹ,Ⅰ,Ⅱ,Ⅲ,Ⅳ,Ⅴ,Ⅵ,Ⅶ,Ⅷ,Ⅸ,Ⅹ,Ⅺ,Ⅻ")},
    { name:"szfh", title:lang.szfh, content:toArray("⒈,⒉,⒊,⒋,⒌,⒍,⒎,⒏,⒐,⒑,⒒,⒓,⒔,⒕,⒖,⒗,⒘,⒙,⒚,⒛,⑴,⑵,⑶,⑷,⑸,⑹,⑺,⑻,⑼,⑽,⑾,⑿,⒀,⒁,⒂,⒃,⒄,⒅,⒆,⒇,①,②,③,④,⑤,⑥,⑦,⑧,⑨,⑩,㈠,㈡,㈢,㈣,㈤,㈥,㈦,㈧,㈨,㈩")},
    { name:"rwfh", title:lang.rwfh, content:toArray("ぁ,あ,ぃ,い,ぅ,う,ぇ,え,ぉ,お,か,が,き,ぎ,く,ぐ,け,げ,こ,ご,さ,ざ,し,じ,す,ず,せ,ぜ,そ,ぞ,た,だ,ち,ぢ,っ,つ,づ,て,で,と,ど,な,に,ぬ,ね,の,は,ば,ぱ,ひ,び,ぴ,ふ,ぶ,ぷ,へ,べ,ぺ,ほ,ぼ,ぽ,ま,み,む,め,も,ゃ,や,ゅ,ゆ,ょ,よ,ら,り,る,れ,ろ,ゎ,わ,ゐ,ゑ,を,ん,ァ,ア,ィ,イ,ゥ,ウ,ェ,エ,ォ,オ,カ,ガ,キ,ギ,ク,グ,ケ,ゲ,コ,ゴ,サ,ザ,シ,ジ,ス,ズ,セ,ゼ,ソ,ゾ,タ,ダ,チ,ヂ,ッ,ツ,ヅ,テ,デ,ト,ド,ナ,ニ,ヌ,ネ,ノ,ハ,バ,パ,ヒ,ビ,ピ,フ,ブ,プ,ヘ,ベ,ペ,ホ,ボ,ポ,マ,ミ,ム,メ,モ,ャ,ヤ,ュ,ユ,ョ,ヨ,ラ,リ,ル,レ,ロ,ヮ,ワ,ヰ,ヱ,ヲ,ン,ヴ,ヵ,ヶ")},
    { name:"xlzm", title:lang.xlzm, content:toArray("Α,Β,Γ,Δ,Ε,Ζ,Η,Θ,Ι,Κ,Λ,Μ,Ν,Ξ,Ο,Π,Ρ,Σ,Τ,Υ,Φ,Χ,Ψ,Ω,α,β,γ,δ,ε,ζ,η,θ,ι,κ,λ,μ,ν,ξ,ο,π,ρ,σ,τ,υ,φ,χ,ψ,ω")},
    { name:"ewzm", title:lang.ewzm, content:toArray("А,Б,В,Г,Д,Е,Ё,Ж,З,И,Й,К,Л,М,Н,О,П,Р,С,Т,У,Ф,Х,Ц,Ч,Ш,Щ,Ъ,Ы,Ь,Э,Ю,Я,а,б,в,г,д,е,ё,ж,з,и,й,к,л,м,н,о,п,р,с,т,у,ф,х,ц,ч,ш,щ,ъ,ы,ь,э,ю,я")},
    { name:"pyzm", title:lang.pyzm, content:toArray("ā,á,ǎ,à,ē,é,ě,è,ī,í,ǐ,ì,ō,ó,ǒ,ò,ū,ú,ǔ,ù,ǖ,ǘ,ǚ,ǜ,ü")},
    { name:"yyyb", title:lang.yyyb, content:toArray("i:,i,e,æ,ʌ,ə:,ə,u:,u,ɔ:,ɔ,a:,ei,ai,ɔi,əu,au,iə,εə,uə,p,t,k,b,d,g,f,s,ʃ,θ,h,v,z,ʒ,ð,tʃ,tr,ts,dʒ,dr,dz,m,n,ŋ,l,r,w,j,")},
    { name:"zyzf", title:lang.zyzf, content:toArray("ㄅ,ㄆ,ㄇ,ㄈ,ㄉ,ㄊ,ㄋ,ㄌ,ㄍ,ㄎ,ㄏ,ㄐ,ㄑ,ㄒ,ㄓ,ㄔ,ㄕ,ㄖ,ㄗ,ㄘ,ㄙ,ㄚ,ㄛ,ㄜ,ㄝ,ㄞ,ㄟ,ㄠ,ㄡ,ㄢ,ㄣ,ㄤ,ㄥ,ㄦ,ㄧ,ㄨ")}
];
(function createTab(content) {
    for (var i = 0, ci; ci = content[i++];) {
        var span = document.createElement("span");
        span.setAttribute("tabSrc", ci.name);
        span.innerHTML = ci.title;
        if (i == 1)span.className = "focus";
        domUtils.on(span, "click", function () {
            var tmps = $G("tabHeads").children;
            for (var k = 0, sk; sk = tmps[k++];) {
                sk.className = "";
            }
            tmps = $G("tabBodys").children;
            for (var k = 0, sk; sk = tmps[k++];) {
                sk.style.display = "none";
            }
            this.className = "focus";
            $G(this.getAttribute("tabSrc")).style.display = "";
        });
        $G("tabHeads").appendChild(span);
        domUtils.insertAfter(span, document.createTextNode("\n"));
        var div = document.createElement("div");
        div.id = ci.name;
        div.style.display = (i == 1) ? "" : "none";
        var cons = ci.content;
        for (var j = 0, con; con = cons[j++];) {
            var charSpan = document.createElement("span");
            charSpan.innerHTML = con;
            domUtils.on(charSpan, "click", function () {
                editor.execCommand("insertHTML", this.innerHTML);
                dialog.close();
            });
            div.appendChild(charSpan);
        }
        $G("tabBodys").appendChild(div);
    }
})(charsContent);
function toArray(str) {
    return str.split(",");
}

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvZGlhbG9ncy9zcGVjaGFycy9zcGVjaGFycy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQ3JlYXRlZCB3aXRoIEpldEJyYWlucyBQaHBTdG9ybS5cclxuICogVXNlcjogeHVoZW5nXHJcbiAqIERhdGU6IDEyLTktMjZcclxuICogVGltZTog5LiL5Y2IMTowOVxyXG4gKiBUbyBjaGFuZ2UgdGhpcyB0ZW1wbGF0ZSB1c2UgRmlsZSB8IFNldHRpbmdzIHwgRmlsZSBUZW1wbGF0ZXMuXHJcbiAqL1xyXG52YXIgY2hhcnNDb250ZW50ID0gW1xyXG4gICAgeyBuYW1lOlwidHNmaFwiLCB0aXRsZTpsYW5nLnRzZmgsIGNvbnRlbnQ6dG9BcnJheShcIuOAgSzjgIIswrcsy4ksy4cswqgs44CDLOOAhSzigJQs772eLOKAlizigKYs4oCYLOKAmSzigJws4oCdLOOAlCzjgJUs44CILOOAiSzjgIos44CLLOOAjCzjgI0s44COLOOAjyzjgJYs44CXLOOAkCzjgJEswrEsw5csw7cs4oi2LOKIpyziiKgs4oiRLOKIjyziiKos4oipLOKIiCziiLcs4oiaLOKKpSziiKUs4oigLOKMkiziipks4oirLOKIriziiaEs4omMLOKJiCziiL0s4oidLOKJoCziia4s4omvLOKJpCziiaUs4oieLOKItSziiLQs4pmCLOKZgCzCsCzigLIs4oCzLOKEgyzvvIQswqQs77+gLO+/oSzigLAswqcs4oSWLOKYhizimIUs4peLLOKXjyzil44s4peHLOKXhizilqEs4pagLOKWsyzilrIs4oC7LOKGkizihpAs4oaRLOKGkyzjgJMs44ChLOOAoizjgKMs44CkLOOApSzjgKYs44CnLOOAqCzjgKks44qjLOOOjizjjo8s446cLOOOnSzjjp4s446hLOOPhCzjj44s44+RLOOPkizjj5Us77iwLO+/oizvv6Qs4oShLMuKLMuLLMuZLOKAkyzigJUs4oClLOKAtSzihIUs4oSJLOKGlizihpcs4oaYLOKGmSziiJUs4oifLOKIoyziiZIs4ommLOKJpyziir8s4pWQLOKVkSzilZIs4pWTLOKVlCzilZUs4pWWLOKVlyzilZgs4pWZLOKVmizilZss4pWcLOKVnSzilZ4s4pWfLOKVoCzilaEs4pWiLOKVoyzilaQs4pWlLOKVpizilacs4pWoLOKVqSzilaos4pWrLOKVrCzila0s4pWuLOKVryzilbAs4pWxLOKVsizilbMs4paBLOKWgiziloMs4paELOKWhSziloYs4paHLO+/vX8s4paILOKWiSziloos4paLLOKWjCzilo0s4paOLOKWjyzilpMs4paULOKWlSzilrws4pa9LOKXoizil6Ms4pekLOKXpSzimIks4oqVLOOAkizjgJ0s44CeXCIpfSxcclxuICAgIHsgbmFtZTpcImxtc3pcIiwgdGl0bGU6bGFuZy5sbXN6LCBjb250ZW50OnRvQXJyYXkoXCLihbAs4oWxLOKFsizihbMs4oW0LOKFtSzihbYs4oW3LOKFuCzihbks4oWgLOKFoSzihaIs4oWjLOKFpCzihaUs4oWmLOKFpyzihags4oWpLOKFqizihatcIil9LFxyXG4gICAgeyBuYW1lOlwic3pmaFwiLCB0aXRsZTpsYW5nLnN6ZmgsIGNvbnRlbnQ6dG9BcnJheShcIuKSiCzikoks4pKKLOKSiyzikows4pKNLOKSjiziko8s4pKQLOKSkSzikpIs4pKTLOKSlCzikpUs4pKWLOKSlyzikpgs4pKZLOKSmizikpss4pG0LOKRtSzikbYs4pG3LOKRuCzikbks4pG6LOKRuyzikbws4pG9LOKRvizikb8s4pKALOKSgSzikoIs4pKDLOKShCzikoUs4pKGLOKShyzikaAs4pGhLOKRoizikaMs4pGkLOKRpSzikaYs4pGnLOKRqCzikaks44igLOOIoSzjiKIs44ijLOOIpCzjiKUs44imLOOIpyzjiKgs44ipXCIpfSxcclxuICAgIHsgbmFtZTpcInJ3ZmhcIiwgdGl0bGU6bGFuZy5yd2ZoLCBjb250ZW50OnRvQXJyYXkoXCLjgYEs44GCLOOBgyzjgYQs44GFLOOBhizjgYcs44GILOOBiSzjgYos44GLLOOBjCzjgY0s44GOLOOBjyzjgZAs44GRLOOBkizjgZMs44GULOOBlSzjgZYs44GXLOOBmCzjgZks44GaLOOBmyzjgZws44GdLOOBnizjgZ8s44GgLOOBoSzjgaIs44GjLOOBpCzjgaUs44GmLOOBpyzjgags44GpLOOBqizjgass44GsLOOBrSzjga4s44GvLOOBsCzjgbEs44GyLOOBsyzjgbQs44G1LOOBtizjgbcs44G4LOOBuSzjgbos44G7LOOBvCzjgb0s44G+LOOBvyzjgoAs44KBLOOCgizjgoMs44KELOOChSzjgoYs44KHLOOCiCzjgoks44KKLOOCiyzjgows44KNLOOCjizjgo8s44KQLOOCkSzjgpIs44KTLOOCoSzjgqIs44KjLOOCpCzjgqUs44KmLOOCpyzjgqgs44KpLOOCqizjgqss44KsLOOCrSzjgq4s44KvLOOCsCzjgrEs44KyLOOCsyzjgrQs44K1LOOCtizjgrcs44K4LOOCuSzjgros44K7LOOCvCzjgr0s44K+LOOCvyzjg4As44OBLOODgizjg4Ms44OELOODhSzjg4Ys44OHLOODiCzjg4ks44OKLOODiyzjg4ws44ONLOODjizjg48s44OQLOODkSzjg5Is44OTLOODlCzjg5Us44OWLOODlyzjg5gs44OZLOODmizjg5ss44OcLOODnSzjg54s44OfLOODoCzjg6Es44OiLOODoyzjg6Qs44OlLOODpizjg6cs44OoLOODqSzjg6os44OrLOODrCzjg60s44OuLOODryzjg7As44OxLOODsizjg7Ms44O0LOODtSzjg7ZcIil9LFxyXG4gICAgeyBuYW1lOlwieGx6bVwiLCB0aXRsZTpsYW5nLnhsem0sIGNvbnRlbnQ6dG9BcnJheShcIs6RLM6SLM6TLM6ULM6VLM6WLM6XLM6YLM6ZLM6aLM6bLM6cLM6dLM6eLM6fLM6gLM6hLM6jLM6kLM6lLM6mLM6nLM6oLM6pLM6xLM6yLM6zLM60LM61LM62LM63LM64LM65LM66LM67LM68LM69LM6+LM6/LM+ALM+BLM+DLM+ELM+FLM+GLM+HLM+ILM+JXCIpfSxcclxuICAgIHsgbmFtZTpcImV3em1cIiwgdGl0bGU6bGFuZy5ld3ptLCBjb250ZW50OnRvQXJyYXkoXCLQkCzQkSzQkizQkyzQlCzQlSzQgSzQlizQlyzQmCzQmSzQmizQmyzQnCzQnSzQnizQnyzQoCzQoSzQoizQoyzQpCzQpSzQpizQpyzQqCzQqSzQqizQqyzQrCzQrSzQrizQryzQsCzQsSzQsizQsyzQtCzQtSzRkSzQtizQtyzQuCzQuSzQuizQuyzQvCzQvSzQvizQvyzRgCzRgSzRgizRgyzRhCzRhSzRhizRhyzRiCzRiSzRiizRiyzRjCzRjSzRjizRj1wiKX0sXHJcbiAgICB7IG5hbWU6XCJweXptXCIsIHRpdGxlOmxhbmcucHl6bSwgY29udGVudDp0b0FycmF5KFwixIEsw6Esx44sw6AsxJMsw6ksxJssw6gsxKssw60sx5Asw6wsxY0sw7Msx5Isw7Isxassw7osx5Qsw7ksx5Ysx5gsx5osx5wsw7xcIil9LFxyXG4gICAgeyBuYW1lOlwieXl5YlwiLCB0aXRsZTpsYW5nLnl5eWIsIGNvbnRlbnQ6dG9BcnJheShcImk6LGksZSzDpizKjCzJmTosyZksdTosdSzJlDosyZQsYTosZWksYWksyZRpLMmZdSxhdSxpyZkszrXJmSx1yZkscCx0LGssYixkLGcsZixzLMqDLM64LGgsdix6LMqSLMOwLHTKgyx0cix0cyxkypIsZHIsZHosbSxuLMWLLGwscix3LGosXCIpfSxcclxuICAgIHsgbmFtZTpcInp5emZcIiwgdGl0bGU6bGFuZy56eXpmLCBjb250ZW50OnRvQXJyYXkoXCLjhIUs44SGLOOEhyzjhIgs44SJLOOEiizjhIss44SMLOOEjSzjhI4s44SPLOOEkCzjhJEs44SSLOOEkyzjhJQs44SVLOOElizjhJcs44SYLOOEmSzjhJos44SbLOOEnCzjhJ0s44SeLOOEnyzjhKAs44ShLOOEoizjhKMs44SkLOOEpSzjhKYs44SnLOOEqFwiKX1cclxuXTtcclxuKGZ1bmN0aW9uIGNyZWF0ZVRhYihjb250ZW50KSB7XHJcbiAgICBmb3IgKHZhciBpID0gMCwgY2k7IGNpID0gY29udGVudFtpKytdOykge1xyXG4gICAgICAgIHZhciBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcbiAgICAgICAgc3Bhbi5zZXRBdHRyaWJ1dGUoXCJ0YWJTcmNcIiwgY2kubmFtZSk7XHJcbiAgICAgICAgc3Bhbi5pbm5lckhUTUwgPSBjaS50aXRsZTtcclxuICAgICAgICBpZiAoaSA9PSAxKXNwYW4uY2xhc3NOYW1lID0gXCJmb2N1c1wiO1xyXG4gICAgICAgIGRvbVV0aWxzLm9uKHNwYW4sIFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgdG1wcyA9ICRHKFwidGFiSGVhZHNcIikuY2hpbGRyZW47XHJcbiAgICAgICAgICAgIGZvciAodmFyIGsgPSAwLCBzazsgc2sgPSB0bXBzW2srK107KSB7XHJcbiAgICAgICAgICAgICAgICBzay5jbGFzc05hbWUgPSBcIlwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRtcHMgPSAkRyhcInRhYkJvZHlzXCIpLmNoaWxkcmVuO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBrID0gMCwgc2s7IHNrID0gdG1wc1trKytdOykge1xyXG4gICAgICAgICAgICAgICAgc2suc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuY2xhc3NOYW1lID0gXCJmb2N1c1wiO1xyXG4gICAgICAgICAgICAkRyh0aGlzLmdldEF0dHJpYnV0ZShcInRhYlNyY1wiKSkuc3R5bGUuZGlzcGxheSA9IFwiXCI7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgJEcoXCJ0YWJIZWFkc1wiKS5hcHBlbmRDaGlsZChzcGFuKTtcclxuICAgICAgICBkb21VdGlscy5pbnNlcnRBZnRlcihzcGFuLCBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIlxcblwiKSk7XHJcbiAgICAgICAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgZGl2LmlkID0gY2kubmFtZTtcclxuICAgICAgICBkaXYuc3R5bGUuZGlzcGxheSA9IChpID09IDEpID8gXCJcIiA6IFwibm9uZVwiO1xyXG4gICAgICAgIHZhciBjb25zID0gY2kuY29udGVudDtcclxuICAgICAgICBmb3IgKHZhciBqID0gMCwgY29uOyBjb24gPSBjb25zW2orK107KSB7XHJcbiAgICAgICAgICAgIHZhciBjaGFyU3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gICAgICAgICAgICBjaGFyU3Bhbi5pbm5lckhUTUwgPSBjb247XHJcbiAgICAgICAgICAgIGRvbVV0aWxzLm9uKGNoYXJTcGFuLCBcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGVkaXRvci5leGVjQ29tbWFuZChcImluc2VydEhUTUxcIiwgdGhpcy5pbm5lckhUTUwpO1xyXG4gICAgICAgICAgICAgICAgZGlhbG9nLmNsb3NlKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBkaXYuYXBwZW5kQ2hpbGQoY2hhclNwYW4pO1xyXG4gICAgICAgIH1cclxuICAgICAgICAkRyhcInRhYkJvZHlzXCIpLmFwcGVuZENoaWxkKGRpdik7XHJcbiAgICB9XHJcbn0pKGNoYXJzQ29udGVudCk7XHJcbmZ1bmN0aW9uIHRvQXJyYXkoc3RyKSB7XHJcbiAgICByZXR1cm4gc3RyLnNwbGl0KFwiLFwiKTtcclxufVxyXG4iXSwiZmlsZSI6InBsdWdpbnMvdWVkaXRvci9kaWFsb2dzL3NwZWNoYXJzL3NwZWNoYXJzLmpzIn0=
