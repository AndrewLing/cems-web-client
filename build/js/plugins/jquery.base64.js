/*!
 * jquery.base64.js 0.0.3 - https://github.com/yckart/jquery.base64.js
 * Makes Base64 en & -decoding simpler as it is.
 *
 * Based upon: https://gist.github.com/Yaffle/1284012
 *
 * Copyright (c) 2012 Yannick Albert (http://yckart.com)
 * Licensed under the MIT license (http://www.opensource.org/licenses/mit-license.php).
 * 2013/02/10
 **/
;(function($) {

    var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
        a256 = '',
        r64 = [256],
        r256 = [256],
        i = 0;

    var UTF8 = {

        /**
         * Encode multi-byte Unicode string into utf-8 multiple single-byte characters
         * (BMP / basic multilingual plane only)
         *
         * Chars in range U+0080 - U+07FF are encoded in 2 chars, U+0800 - U+FFFF in 3 chars
         *
         * @param {String} strUni Unicode string to be encoded as UTF-8
         * @returns {String} encoded string
         */
        encode: function(strUni) {
            // use regular expressions & String.replace callback function for better efficiency
            // than procedural approaches
            var strUtf = strUni.replace(/[\u0080-\u07ff]/g, // U+0080 - U+07FF => 2 bytes 110yyyyy, 10zzzzzz
            function(c) {
                var cc = c.charCodeAt(0);
                return String.fromCharCode(0xc0 | cc >> 6, 0x80 | cc & 0x3f);
            })
            .replace(/[\u0800-\uffff]/g, // U+0800 - U+FFFF => 3 bytes 1110xxxx, 10yyyyyy, 10zzzzzz
            function(c) {
                var cc = c.charCodeAt(0);
                return String.fromCharCode(0xe0 | cc >> 12, 0x80 | cc >> 6 & 0x3F, 0x80 | cc & 0x3f);
            });
            return strUtf;
        },

        /**
         * Decode utf-8 encoded string back into multi-byte Unicode characters
         *
         * @param {String} strUtf UTF-8 string to be decoded back to Unicode
         * @returns {String} decoded string
         */
        decode: function(strUtf) {
            // note: decode 3-byte chars first as decoded 2-byte strings could appear to be 3-byte char!
            var strUni = strUtf.replace(/[\u00e0-\u00ef][\u0080-\u00bf][\u0080-\u00bf]/g, // 3-byte chars
            function(c) { // (note parentheses for precence)
                var cc = ((c.charCodeAt(0) & 0x0f) << 12) | ((c.charCodeAt(1) & 0x3f) << 6) | (c.charCodeAt(2) & 0x3f);
                return String.fromCharCode(cc);
            })
            .replace(/[\u00c0-\u00df][\u0080-\u00bf]/g, // 2-byte chars
            function(c) { // (note parentheses for precence)
                var cc = (c.charCodeAt(0) & 0x1f) << 6 | c.charCodeAt(1) & 0x3f;
                return String.fromCharCode(cc);
            });
            return strUni;
        }
    };

    while(i < 256) {
        var c = String.fromCharCode(i);
        a256 += c;
        r256[i] = i;
        r64[i] = b64.indexOf(c);
        ++i;
    }

    function code(s, discard, alpha, beta, w1, w2) {
        s = String(s);
        var buffer = 0,
            i = 0,
            length = s.length,
            result = '',
            bitsInBuffer = 0;

        while(i < length) {
            var c = s.charCodeAt(i);
            c = c < 256 ? alpha[c] : -1;

            buffer = (buffer << w1) + c;
            bitsInBuffer += w1;

            while(bitsInBuffer >= w2) {
                bitsInBuffer -= w2;
                var tmp = buffer >> bitsInBuffer;
                result += beta.charAt(tmp);
                buffer ^= tmp << bitsInBuffer;
            }
            ++i;
        }
        if(!discard && bitsInBuffer > 0) result += beta.charAt(buffer << (w2 - bitsInBuffer));
        return result;
    }

    var Plugin = $.base64 = function(dir, input, encode) {
            return input ? Plugin[dir](input, encode) : dir ? null : this;
        };

    Plugin.btoa = Plugin.encode = function(plain, utf8encode) {
        plain = Plugin.raw === false || Plugin.utf8encode || utf8encode ? UTF8.encode(plain) : plain;
        plain = code(plain, false, r256, b64, 8, 6);
        return plain + '===='.slice((plain.length % 4) || 4);
    };

    Plugin.atob = Plugin.decode = function(coded, utf8decode) {
        coded = String(coded).split('=');
        var i = coded.length;
        do {--i;
            coded[i] = code(coded[i], true, r64, a256, 6, 8);
        } while (i > 0);
        coded = coded.join('');
        return Plugin.raw === false || Plugin.utf8decode || utf8decode ? UTF8.decode(coded) : coded;
    };
}(jQuery));
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL2pxdWVyeS5iYXNlNjQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyohXG4gKiBqcXVlcnkuYmFzZTY0LmpzIDAuMC4zIC0gaHR0cHM6Ly9naXRodWIuY29tL3lja2FydC9qcXVlcnkuYmFzZTY0LmpzXG4gKiBNYWtlcyBCYXNlNjQgZW4gJiAtZGVjb2Rpbmcgc2ltcGxlciBhcyBpdCBpcy5cbiAqXG4gKiBCYXNlZCB1cG9uOiBodHRwczovL2dpc3QuZ2l0aHViLmNvbS9ZYWZmbGUvMTI4NDAxMlxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxMiBZYW5uaWNrIEFsYmVydCAoaHR0cDovL3lja2FydC5jb20pXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UgKGh0dHA6Ly93d3cub3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvbWl0LWxpY2Vuc2UucGhwKS5cbiAqIDIwMTMvMDIvMTBcbiAqKi9cbjsoZnVuY3Rpb24oJCkge1xuXG4gICAgdmFyIGI2NCA9IFwiQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrL1wiLFxuICAgICAgICBhMjU2ID0gJycsXG4gICAgICAgIHI2NCA9IFsyNTZdLFxuICAgICAgICByMjU2ID0gWzI1Nl0sXG4gICAgICAgIGkgPSAwO1xuXG4gICAgdmFyIFVURjggPSB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEVuY29kZSBtdWx0aS1ieXRlIFVuaWNvZGUgc3RyaW5nIGludG8gdXRmLTggbXVsdGlwbGUgc2luZ2xlLWJ5dGUgY2hhcmFjdGVyc1xuICAgICAgICAgKiAoQk1QIC8gYmFzaWMgbXVsdGlsaW5ndWFsIHBsYW5lIG9ubHkpXG4gICAgICAgICAqXG4gICAgICAgICAqIENoYXJzIGluIHJhbmdlIFUrMDA4MCAtIFUrMDdGRiBhcmUgZW5jb2RlZCBpbiAyIGNoYXJzLCBVKzA4MDAgLSBVK0ZGRkYgaW4gMyBjaGFyc1xuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gc3RyVW5pIFVuaWNvZGUgc3RyaW5nIHRvIGJlIGVuY29kZWQgYXMgVVRGLThcbiAgICAgICAgICogQHJldHVybnMge1N0cmluZ30gZW5jb2RlZCBzdHJpbmdcbiAgICAgICAgICovXG4gICAgICAgIGVuY29kZTogZnVuY3Rpb24oc3RyVW5pKSB7XG4gICAgICAgICAgICAvLyB1c2UgcmVndWxhciBleHByZXNzaW9ucyAmIFN0cmluZy5yZXBsYWNlIGNhbGxiYWNrIGZ1bmN0aW9uIGZvciBiZXR0ZXIgZWZmaWNpZW5jeVxuICAgICAgICAgICAgLy8gdGhhbiBwcm9jZWR1cmFsIGFwcHJvYWNoZXNcbiAgICAgICAgICAgIHZhciBzdHJVdGYgPSBzdHJVbmkucmVwbGFjZSgvW1xcdTAwODAtXFx1MDdmZl0vZywgLy8gVSswMDgwIC0gVSswN0ZGID0+IDIgYnl0ZXMgMTEweXl5eXksIDEwenp6enp6XG4gICAgICAgICAgICBmdW5jdGlvbihjKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNjID0gYy5jaGFyQ29kZUF0KDApO1xuICAgICAgICAgICAgICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKDB4YzAgfCBjYyA+PiA2LCAweDgwIHwgY2MgJiAweDNmKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAucmVwbGFjZSgvW1xcdTA4MDAtXFx1ZmZmZl0vZywgLy8gVSswODAwIC0gVStGRkZGID0+IDMgYnl0ZXMgMTExMHh4eHgsIDEweXl5eXl5LCAxMHp6enp6elxuICAgICAgICAgICAgZnVuY3Rpb24oYykge1xuICAgICAgICAgICAgICAgIHZhciBjYyA9IGMuY2hhckNvZGVBdCgwKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZSgweGUwIHwgY2MgPj4gMTIsIDB4ODAgfCBjYyA+PiA2ICYgMHgzRiwgMHg4MCB8IGNjICYgMHgzZik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBzdHJVdGY7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERlY29kZSB1dGYtOCBlbmNvZGVkIHN0cmluZyBiYWNrIGludG8gbXVsdGktYnl0ZSBVbmljb2RlIGNoYXJhY3RlcnNcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IHN0clV0ZiBVVEYtOCBzdHJpbmcgdG8gYmUgZGVjb2RlZCBiYWNrIHRvIFVuaWNvZGVcbiAgICAgICAgICogQHJldHVybnMge1N0cmluZ30gZGVjb2RlZCBzdHJpbmdcbiAgICAgICAgICovXG4gICAgICAgIGRlY29kZTogZnVuY3Rpb24oc3RyVXRmKSB7XG4gICAgICAgICAgICAvLyBub3RlOiBkZWNvZGUgMy1ieXRlIGNoYXJzIGZpcnN0IGFzIGRlY29kZWQgMi1ieXRlIHN0cmluZ3MgY291bGQgYXBwZWFyIHRvIGJlIDMtYnl0ZSBjaGFyIVxuICAgICAgICAgICAgdmFyIHN0clVuaSA9IHN0clV0Zi5yZXBsYWNlKC9bXFx1MDBlMC1cXHUwMGVmXVtcXHUwMDgwLVxcdTAwYmZdW1xcdTAwODAtXFx1MDBiZl0vZywgLy8gMy1ieXRlIGNoYXJzXG4gICAgICAgICAgICBmdW5jdGlvbihjKSB7IC8vIChub3RlIHBhcmVudGhlc2VzIGZvciBwcmVjZW5jZSlcbiAgICAgICAgICAgICAgICB2YXIgY2MgPSAoKGMuY2hhckNvZGVBdCgwKSAmIDB4MGYpIDw8IDEyKSB8ICgoYy5jaGFyQ29kZUF0KDEpICYgMHgzZikgPDwgNikgfCAoYy5jaGFyQ29kZUF0KDIpICYgMHgzZik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUoY2MpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5yZXBsYWNlKC9bXFx1MDBjMC1cXHUwMGRmXVtcXHUwMDgwLVxcdTAwYmZdL2csIC8vIDItYnl0ZSBjaGFyc1xuICAgICAgICAgICAgZnVuY3Rpb24oYykgeyAvLyAobm90ZSBwYXJlbnRoZXNlcyBmb3IgcHJlY2VuY2UpXG4gICAgICAgICAgICAgICAgdmFyIGNjID0gKGMuY2hhckNvZGVBdCgwKSAmIDB4MWYpIDw8IDYgfCBjLmNoYXJDb2RlQXQoMSkgJiAweDNmO1xuICAgICAgICAgICAgICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKGNjKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHN0clVuaTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB3aGlsZShpIDwgMjU2KSB7XG4gICAgICAgIHZhciBjID0gU3RyaW5nLmZyb21DaGFyQ29kZShpKTtcbiAgICAgICAgYTI1NiArPSBjO1xuICAgICAgICByMjU2W2ldID0gaTtcbiAgICAgICAgcjY0W2ldID0gYjY0LmluZGV4T2YoYyk7XG4gICAgICAgICsraTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjb2RlKHMsIGRpc2NhcmQsIGFscGhhLCBiZXRhLCB3MSwgdzIpIHtcbiAgICAgICAgcyA9IFN0cmluZyhzKTtcbiAgICAgICAgdmFyIGJ1ZmZlciA9IDAsXG4gICAgICAgICAgICBpID0gMCxcbiAgICAgICAgICAgIGxlbmd0aCA9IHMubGVuZ3RoLFxuICAgICAgICAgICAgcmVzdWx0ID0gJycsXG4gICAgICAgICAgICBiaXRzSW5CdWZmZXIgPSAwO1xuXG4gICAgICAgIHdoaWxlKGkgPCBsZW5ndGgpIHtcbiAgICAgICAgICAgIHZhciBjID0gcy5jaGFyQ29kZUF0KGkpO1xuICAgICAgICAgICAgYyA9IGMgPCAyNTYgPyBhbHBoYVtjXSA6IC0xO1xuXG4gICAgICAgICAgICBidWZmZXIgPSAoYnVmZmVyIDw8IHcxKSArIGM7XG4gICAgICAgICAgICBiaXRzSW5CdWZmZXIgKz0gdzE7XG5cbiAgICAgICAgICAgIHdoaWxlKGJpdHNJbkJ1ZmZlciA+PSB3Mikge1xuICAgICAgICAgICAgICAgIGJpdHNJbkJ1ZmZlciAtPSB3MjtcbiAgICAgICAgICAgICAgICB2YXIgdG1wID0gYnVmZmVyID4+IGJpdHNJbkJ1ZmZlcjtcbiAgICAgICAgICAgICAgICByZXN1bHQgKz0gYmV0YS5jaGFyQXQodG1wKTtcbiAgICAgICAgICAgICAgICBidWZmZXIgXj0gdG1wIDw8IGJpdHNJbkJ1ZmZlcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICsraTtcbiAgICAgICAgfVxuICAgICAgICBpZighZGlzY2FyZCAmJiBiaXRzSW5CdWZmZXIgPiAwKSByZXN1bHQgKz0gYmV0YS5jaGFyQXQoYnVmZmVyIDw8ICh3MiAtIGJpdHNJbkJ1ZmZlcikpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHZhciBQbHVnaW4gPSAkLmJhc2U2NCA9IGZ1bmN0aW9uKGRpciwgaW5wdXQsIGVuY29kZSkge1xuICAgICAgICAgICAgcmV0dXJuIGlucHV0ID8gUGx1Z2luW2Rpcl0oaW5wdXQsIGVuY29kZSkgOiBkaXIgPyBudWxsIDogdGhpcztcbiAgICAgICAgfTtcblxuICAgIFBsdWdpbi5idG9hID0gUGx1Z2luLmVuY29kZSA9IGZ1bmN0aW9uKHBsYWluLCB1dGY4ZW5jb2RlKSB7XG4gICAgICAgIHBsYWluID0gUGx1Z2luLnJhdyA9PT0gZmFsc2UgfHwgUGx1Z2luLnV0ZjhlbmNvZGUgfHwgdXRmOGVuY29kZSA/IFVURjguZW5jb2RlKHBsYWluKSA6IHBsYWluO1xuICAgICAgICBwbGFpbiA9IGNvZGUocGxhaW4sIGZhbHNlLCByMjU2LCBiNjQsIDgsIDYpO1xuICAgICAgICByZXR1cm4gcGxhaW4gKyAnPT09PScuc2xpY2UoKHBsYWluLmxlbmd0aCAlIDQpIHx8IDQpO1xuICAgIH07XG5cbiAgICBQbHVnaW4uYXRvYiA9IFBsdWdpbi5kZWNvZGUgPSBmdW5jdGlvbihjb2RlZCwgdXRmOGRlY29kZSkge1xuICAgICAgICBjb2RlZCA9IFN0cmluZyhjb2RlZCkuc3BsaXQoJz0nKTtcbiAgICAgICAgdmFyIGkgPSBjb2RlZC5sZW5ndGg7XG4gICAgICAgIGRvIHstLWk7XG4gICAgICAgICAgICBjb2RlZFtpXSA9IGNvZGUoY29kZWRbaV0sIHRydWUsIHI2NCwgYTI1NiwgNiwgOCk7XG4gICAgICAgIH0gd2hpbGUgKGkgPiAwKTtcbiAgICAgICAgY29kZWQgPSBjb2RlZC5qb2luKCcnKTtcbiAgICAgICAgcmV0dXJuIFBsdWdpbi5yYXcgPT09IGZhbHNlIHx8IFBsdWdpbi51dGY4ZGVjb2RlIHx8IHV0ZjhkZWNvZGUgPyBVVEY4LmRlY29kZShjb2RlZCkgOiBjb2RlZDtcbiAgICB9O1xufShqUXVlcnkpKTsiXSwiZmlsZSI6InBsdWdpbnMvanF1ZXJ5LmJhc2U2NC5qcyJ9
