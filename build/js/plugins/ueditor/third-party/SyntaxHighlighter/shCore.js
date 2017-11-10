// XRegExp 1.5.1
// (c) 2007-2012 Steven Levithan
// MIT License
// <http://xregexp.com>
// Provides an augmented, extensible, cross-browser implementation of regular expressions,
// including support for additional syntax, flags, and methods

var XRegExp;

if (XRegExp) {
    // Avoid running twice, since that would break references to native globals
    throw Error("can't load XRegExp twice in the same frame");
}

// Run within an anonymous function to protect variables and avoid new globals
(function (undefined) {

    //---------------------------------
    //  Constructor
    //---------------------------------

    // Accepts a pattern and flags; returns a new, extended `RegExp` object. Differs from a native
    // regular expression in that additional syntax and flags are supported and cross-browser
    // syntax inconsistencies are ameliorated. `XRegExp(/regex/)` clones an existing regex and
    // converts to type XRegExp
    XRegExp = function (pattern, flags) {
        var output = [],
            currScope = XRegExp.OUTSIDE_CLASS,
            pos = 0,
            context, tokenResult, match, chr, regex;

        if (XRegExp.isRegExp(pattern)) {
            if (flags !== undefined)
                throw TypeError("can't supply flags when constructing one RegExp from another");
            return clone(pattern);
        }
        // Tokens become part of the regex construction process, so protect against infinite
        // recursion when an XRegExp is constructed within a token handler or trigger
        if (isInsideConstructor)
            throw Error("can't call the XRegExp constructor within token definition functions");

        flags = flags || "";
        context = { // `this` object for custom tokens
            hasNamedCapture: false,
            captureNames: [],
            hasFlag: function (flag) {return flags.indexOf(flag) > -1;},
            setFlag: function (flag) {flags += flag;}
        };

        while (pos < pattern.length) {
            // Check for custom tokens at the current position
            tokenResult = runTokens(pattern, pos, currScope, context);

            if (tokenResult) {
                output.push(tokenResult.output);
                pos += (tokenResult.match[0].length || 1);
            } else {
                // Check for native multicharacter metasequences (excluding character classes) at
                // the current position
                if (match = nativ.exec.call(nativeTokens[currScope], pattern.slice(pos))) {
                    output.push(match[0]);
                    pos += match[0].length;
                } else {
                    chr = pattern.charAt(pos);
                    if (chr === "[")
                        currScope = XRegExp.INSIDE_CLASS;
                    else if (chr === "]")
                        currScope = XRegExp.OUTSIDE_CLASS;
                    // Advance position one character
                    output.push(chr);
                    pos++;
                }
            }
        }

        regex = RegExp(output.join(""), nativ.replace.call(flags, flagClip, ""));
        regex._xregexp = {
            source: pattern,
            captureNames: context.hasNamedCapture ? context.captureNames : null
        };
        return regex;
    };


    //---------------------------------
    //  Public properties
    //---------------------------------

    XRegExp.version = "1.5.1";

    // Token scope bitflags
    XRegExp.INSIDE_CLASS = 1;
    XRegExp.OUTSIDE_CLASS = 2;


    //---------------------------------
    //  Private variables
    //---------------------------------

    var replacementToken = /\$(?:(\d\d?|[$&`'])|{([$\w]+)})/g,
        flagClip = /[^gimy]+|([\s\S])(?=[\s\S]*\1)/g, // Nonnative and duplicate flags
        quantifier = /^(?:[?*+]|{\d+(?:,\d*)?})\??/,
        isInsideConstructor = false,
        tokens = [],
    // Copy native globals for reference ("native" is an ES3 reserved keyword)
        nativ = {
            exec: RegExp.prototype.exec,
            test: RegExp.prototype.test,
            match: String.prototype.match,
            replace: String.prototype.replace,
            split: String.prototype.split
        },
        compliantExecNpcg = nativ.exec.call(/()??/, "")[1] === undefined, // check `exec` handling of nonparticipating capturing groups
        compliantLastIndexIncrement = function () {
            var x = /^/g;
            nativ.test.call(x, "");
            return !x.lastIndex;
        }(),
        hasNativeY = RegExp.prototype.sticky !== undefined,
        nativeTokens = {};

    // `nativeTokens` match native multicharacter metasequences only (including deprecated octals,
    // excluding character classes)
    nativeTokens[XRegExp.INSIDE_CLASS] = /^(?:\\(?:[0-3][0-7]{0,2}|[4-7][0-7]?|x[\dA-Fa-f]{2}|u[\dA-Fa-f]{4}|c[A-Za-z]|[\s\S]))/;
    nativeTokens[XRegExp.OUTSIDE_CLASS] = /^(?:\\(?:0(?:[0-3][0-7]{0,2}|[4-7][0-7]?)?|[1-9]\d*|x[\dA-Fa-f]{2}|u[\dA-Fa-f]{4}|c[A-Za-z]|[\s\S])|\(\?[:=!]|[?*+]\?|{\d+(?:,\d*)?}\??)/;


    //---------------------------------
    //  Public methods
    //---------------------------------

    // Lets you extend or change XRegExp syntax and create custom flags. This is used internally by
    // the XRegExp library and can be used to create XRegExp plugins. This function is intended for
    // users with advanced knowledge of JavaScript's regular expression syntax and behavior. It can
    // be disabled by `XRegExp.freezeTokens`
    XRegExp.addToken = function (regex, handler, scope, trigger) {
        tokens.push({
            pattern: clone(regex, "g" + (hasNativeY ? "y" : "")),
            handler: handler,
            scope: scope || XRegExp.OUTSIDE_CLASS,
            trigger: trigger || null
        });
    };

    // Accepts a pattern and flags; returns an extended `RegExp` object. If the pattern and flag
    // combination has previously been cached, the cached copy is returned; otherwise the newly
    // created regex is cached
    XRegExp.cache = function (pattern, flags) {
        var key = pattern + "/" + (flags || "");
        return XRegExp.cache[key] || (XRegExp.cache[key] = XRegExp(pattern, flags));
    };

    // Accepts a `RegExp` instance; returns a copy with the `/g` flag set. The copy has a fresh
    // `lastIndex` (set to zero). If you want to copy a regex without forcing the `global`
    // property, use `XRegExp(regex)`. Do not use `RegExp(regex)` because it will not preserve
    // special properties required for named capture
    XRegExp.copyAsGlobal = function (regex) {
        return clone(regex, "g");
    };

    // Accepts a string; returns the string with regex metacharacters escaped. The returned string
    // can safely be used at any point within a regex to match the provided literal string. Escaped
    // characters are [ ] { } ( ) * + ? - . , \ ^ $ | # and whitespace
    XRegExp.escape = function (str) {
        return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    };

    // Accepts a string to search, regex to search with, position to start the search within the
    // string (default: 0), and an optional Boolean indicating whether matches must start at-or-
    // after the position or at the specified position only. This function ignores the `lastIndex`
    // of the provided regex in its own handling, but updates the property for compatibility
    XRegExp.execAt = function (str, regex, pos, anchored) {
        var r2 = clone(regex, "g" + ((anchored && hasNativeY) ? "y" : "")),
            match;
        r2.lastIndex = pos = pos || 0;
        match = r2.exec(str); // Run the altered `exec` (required for `lastIndex` fix, etc.)
        if (anchored && match && match.index !== pos)
            match = null;
        if (regex.global)
            regex.lastIndex = match ? r2.lastIndex : 0;
        return match;
    };

    // Breaks the unrestorable link to XRegExp's private list of tokens, thereby preventing
    // syntax and flag changes. Should be run after XRegExp and any plugins are loaded
    XRegExp.freezeTokens = function () {
        XRegExp.addToken = function () {
            throw Error("can't run addToken after freezeTokens");
        };
    };

    // Accepts any value; returns a Boolean indicating whether the argument is a `RegExp` object.
    // Note that this is also `true` for regex literals and regexes created by the `XRegExp`
    // constructor. This works correctly for variables created in another frame, when `instanceof`
    // and `constructor` checks would fail to work as intended
    XRegExp.isRegExp = function (o) {
        return Object.prototype.toString.call(o) === "[object RegExp]";
    };

    // Executes `callback` once per match within `str`. Provides a simpler and cleaner way to
    // iterate over regex matches compared to the traditional approaches of subverting
    // `String.prototype.replace` or repeatedly calling `exec` within a `while` loop
    XRegExp.iterate = function (str, regex, callback, context) {
        var r2 = clone(regex, "g"),
            i = -1, match;
        while (match = r2.exec(str)) { // Run the altered `exec` (required for `lastIndex` fix, etc.)
            if (regex.global)
                regex.lastIndex = r2.lastIndex; // Doing this to follow expectations if `lastIndex` is checked within `callback`
            callback.call(context, match, ++i, str, regex);
            if (r2.lastIndex === match.index)
                r2.lastIndex++;
        }
        if (regex.global)
            regex.lastIndex = 0;
    };

    // Accepts a string and an array of regexes; returns the result of using each successive regex
    // to search within the matches of the previous regex. The array of regexes can also contain
    // objects with `regex` and `backref` properties, in which case the named or numbered back-
    // references specified are passed forward to the next regex or returned. E.g.:
    // var xregexpImgFileNames = XRegExp.matchChain(html, [
    //     {regex: /<img\b([^>]+)>/i, backref: 1}, // <img> tag attributes
    //     {regex: XRegExp('(?ix) \\s src=" (?<src> [^"]+ )'), backref: "src"}, // src attribute values
    //     {regex: XRegExp("^http://xregexp\\.com(/[^#?]+)", "i"), backref: 1}, // xregexp.com paths
    //     /[^\/]+$/ // filenames (strip directory paths)
    // ]);
    XRegExp.matchChain = function (str, chain) {
        return function recurseChain (values, level) {
            var item = chain[level].regex ? chain[level] : {regex: chain[level]},
                regex = clone(item.regex, "g"),
                matches = [], i;
            for (i = 0; i < values.length; i++) {
                XRegExp.iterate(values[i], regex, function (match) {
                    matches.push(item.backref ? (match[item.backref] || "") : match[0]);
                });
            }
            return ((level === chain.length - 1) || !matches.length) ?
                matches : recurseChain(matches, level + 1);
        }([str], 0);
    };


    //---------------------------------
    //  New RegExp prototype methods
    //---------------------------------

    // Accepts a context object and arguments array; returns the result of calling `exec` with the
    // first value in the arguments array. the context is ignored but is accepted for congruity
    // with `Function.prototype.apply`
    RegExp.prototype.apply = function (context, args) {
        return this.exec(args[0]);
    };

    // Accepts a context object and string; returns the result of calling `exec` with the provided
    // string. the context is ignored but is accepted for congruity with `Function.prototype.call`
    RegExp.prototype.call = function (context, str) {
        return this.exec(str);
    };


    //---------------------------------
    //  Overriden native methods
    //---------------------------------

    // Adds named capture support (with backreferences returned as `result.name`), and fixes two
    // cross-browser issues per ES3:
    // - Captured values for nonparticipating capturing groups should be returned as `undefined`,
    //   rather than the empty string.
    // - `lastIndex` should not be incremented after zero-length matches.
    RegExp.prototype.exec = function (str) {
        var match, name, r2, origLastIndex;
        if (!this.global)
            origLastIndex = this.lastIndex;
        match = nativ.exec.apply(this, arguments);
        if (match) {
            // Fix browsers whose `exec` methods don't consistently return `undefined` for
            // nonparticipating capturing groups
            if (!compliantExecNpcg && match.length > 1 && indexOf(match, "") > -1) {
                r2 = RegExp(this.source, nativ.replace.call(getNativeFlags(this), "g", ""));
                // Using `str.slice(match.index)` rather than `match[0]` in case lookahead allowed
                // matching due to characters outside the match
                nativ.replace.call((str + "").slice(match.index), r2, function () {
                    for (var i = 1; i < arguments.length - 2; i++) {
                        if (arguments[i] === undefined)
                            match[i] = undefined;
                    }
                });
            }
            // Attach named capture properties
            if (this._xregexp && this._xregexp.captureNames) {
                for (var i = 1; i < match.length; i++) {
                    name = this._xregexp.captureNames[i - 1];
                    if (name)
                        match[name] = match[i];
                }
            }
            // Fix browsers that increment `lastIndex` after zero-length matches
            if (!compliantLastIndexIncrement && this.global && !match[0].length && (this.lastIndex > match.index))
                this.lastIndex--;
        }
        if (!this.global)
            this.lastIndex = origLastIndex; // Fix IE, Opera bug (last tested IE 9.0.5, Opera 11.61 on Windows)
        return match;
    };

    // Fix browser bugs in native method
    RegExp.prototype.test = function (str) {
        // Use the native `exec` to skip some processing overhead, even though the altered
        // `exec` would take care of the `lastIndex` fixes
        var match, origLastIndex;
        if (!this.global)
            origLastIndex = this.lastIndex;
        match = nativ.exec.call(this, str);
        // Fix browsers that increment `lastIndex` after zero-length matches
        if (match && !compliantLastIndexIncrement && this.global && !match[0].length && (this.lastIndex > match.index))
            this.lastIndex--;
        if (!this.global)
            this.lastIndex = origLastIndex; // Fix IE, Opera bug (last tested IE 9.0.5, Opera 11.61 on Windows)
        return !!match;
    };

    // Adds named capture support and fixes browser bugs in native method
    String.prototype.match = function (regex) {
        if (!XRegExp.isRegExp(regex))
            regex = RegExp(regex); // Native `RegExp`
        if (regex.global) {
            var result = nativ.match.apply(this, arguments);
            regex.lastIndex = 0; // Fix IE bug
            return result;
        }
        return regex.exec(this); // Run the altered `exec`
    };

    // Adds support for `${n}` tokens for named and numbered backreferences in replacement text,
    // and provides named backreferences to replacement functions as `arguments[0].name`. Also
    // fixes cross-browser differences in replacement text syntax when performing a replacement
    // using a nonregex search value, and the value of replacement regexes' `lastIndex` property
    // during replacement iterations. Note that this doesn't support SpiderMonkey's proprietary
    // third (`flags`) parameter
    String.prototype.replace = function (search, replacement) {
        var isRegex = XRegExp.isRegExp(search),
            captureNames, result, str, origLastIndex;

        // There are too many combinations of search/replacement types/values and browser bugs that
        // preclude passing to native `replace`, so don't try
        //if (...)
        //    return nativ.replace.apply(this, arguments);

        if (isRegex) {
            if (search._xregexp)
                captureNames = search._xregexp.captureNames; // Array or `null`
            if (!search.global)
                origLastIndex = search.lastIndex;
        } else {
            search = search + ""; // Type conversion
        }

        if (Object.prototype.toString.call(replacement) === "[object Function]") {
            result = nativ.replace.call(this + "", search, function () {
                if (captureNames) {
                    // Change the `arguments[0]` string primitive to a String object which can store properties
                    arguments[0] = new String(arguments[0]);
                    // Store named backreferences on `arguments[0]`
                    for (var i = 0; i < captureNames.length; i++) {
                        if (captureNames[i])
                            arguments[0][captureNames[i]] = arguments[i + 1];
                    }
                }
                // Update `lastIndex` before calling `replacement` (fix browsers)
                if (isRegex && search.global)
                    search.lastIndex = arguments[arguments.length - 2] + arguments[0].length;
                return replacement.apply(null, arguments);
            });
        } else {
            str = this + ""; // Type conversion, so `args[args.length - 1]` will be a string (given nonstring `this`)
            result = nativ.replace.call(str, search, function () {
                var args = arguments; // Keep this function's `arguments` available through closure
                return nativ.replace.call(replacement + "", replacementToken, function ($0, $1, $2) {
                    // Numbered backreference (without delimiters) or special variable
                    if ($1) {
                        switch ($1) {
                            case "$": return "$";
                            case "&": return args[0];
                            case "`": return args[args.length - 1].slice(0, args[args.length - 2]);
                            case "'": return args[args.length - 1].slice(args[args.length - 2] + args[0].length);
                            // Numbered backreference
                            default:
                                // What does "$10" mean?
                                // - Backreference 10, if 10 or more capturing groups exist
                                // - Backreference 1 followed by "0", if 1-9 capturing groups exist
                                // - Otherwise, it's the string "$10"
                                // Also note:
                                // - Backreferences cannot be more than two digits (enforced by `replacementToken`)
                                // - "$01" is equivalent to "$1" if a capturing group exists, otherwise it's the string "$01"
                                // - There is no "$0" token ("$&" is the entire match)
                                var literalNumbers = "";
                                $1 = +$1; // Type conversion; drop leading zero
                                if (!$1) // `$1` was "0" or "00"
                                    return $0;
                                while ($1 > args.length - 3) {
                                    literalNumbers = String.prototype.slice.call($1, -1) + literalNumbers;
                                    $1 = Math.floor($1 / 10); // Drop the last digit
                                }
                                return ($1 ? args[$1] || "" : "$") + literalNumbers;
                        }
                        // Named backreference or delimited numbered backreference
                    } else {
                        // What does "${n}" mean?
                        // - Backreference to numbered capture n. Two differences from "$n":
                        //   - n can be more than two digits
                        //   - Backreference 0 is allowed, and is the entire match
                        // - Backreference to named capture n, if it exists and is not a number overridden by numbered capture
                        // - Otherwise, it's the string "${n}"
                        var n = +$2; // Type conversion; drop leading zeros
                        if (n <= args.length - 3)
                            return args[n];
                        n = captureNames ? indexOf(captureNames, $2) : -1;
                        return n > -1 ? args[n + 1] : $0;
                    }
                });
            });
        }

        if (isRegex) {
            if (search.global)
                search.lastIndex = 0; // Fix IE, Safari bug (last tested IE 9.0.5, Safari 5.1.2 on Windows)
            else
                search.lastIndex = origLastIndex; // Fix IE, Opera bug (last tested IE 9.0.5, Opera 11.61 on Windows)
        }

        return result;
    };

    // A consistent cross-browser, ES3 compliant `split`
    String.prototype.split = function (s /* separator */, limit) {
        // If separator `s` is not a regex, use the native `split`
        if (!XRegExp.isRegExp(s))
            return nativ.split.apply(this, arguments);

        var str = this + "", // Type conversion
            output = [],
            lastLastIndex = 0,
            match, lastLength;

        // Behavior for `limit`: if it's...
        // - `undefined`: No limit
        // - `NaN` or zero: Return an empty array
        // - A positive number: Use `Math.floor(limit)`
        // - A negative number: No limit
        // - Other: Type-convert, then use the above rules
        if (limit === undefined || +limit < 0) {
            limit = Infinity;
        } else {
            limit = Math.floor(+limit);
            if (!limit)
                return [];
        }

        // This is required if not `s.global`, and it avoids needing to set `s.lastIndex` to zero
        // and restore it to its original value when we're done using the regex
        s = XRegExp.copyAsGlobal(s);

        while (match = s.exec(str)) { // Run the altered `exec` (required for `lastIndex` fix, etc.)
            if (s.lastIndex > lastLastIndex) {
                output.push(str.slice(lastLastIndex, match.index));

                if (match.length > 1 && match.index < str.length)
                    Array.prototype.push.apply(output, match.slice(1));

                lastLength = match[0].length;
                lastLastIndex = s.lastIndex;

                if (output.length >= limit)
                    break;
            }

            if (s.lastIndex === match.index)
                s.lastIndex++;
        }

        if (lastLastIndex === str.length) {
            if (!nativ.test.call(s, "") || lastLength)
                output.push("");
        } else {
            output.push(str.slice(lastLastIndex));
        }

        return output.length > limit ? output.slice(0, limit) : output;
    };


    //---------------------------------
    //  Private helper functions
    //---------------------------------

    // Supporting function for `XRegExp`, `XRegExp.copyAsGlobal`, etc. Returns a copy of a `RegExp`
    // instance with a fresh `lastIndex` (set to zero), preserving properties required for named
    // capture. Also allows adding new flags in the process of copying the regex
    function clone (regex, additionalFlags) {
        if (!XRegExp.isRegExp(regex))
            throw TypeError("type RegExp expected");
        var x = regex._xregexp;
        regex = XRegExp(regex.source, getNativeFlags(regex) + (additionalFlags || ""));
        if (x) {
            regex._xregexp = {
                source: x.source,
                captureNames: x.captureNames ? x.captureNames.slice(0) : null
            };
        }
        return regex;
    }

    function getNativeFlags (regex) {
        return (regex.global     ? "g" : "") +
            (regex.ignoreCase ? "i" : "") +
            (regex.multiline  ? "m" : "") +
            (regex.extended   ? "x" : "") + // Proposed for ES4; included in AS3
            (regex.sticky     ? "y" : "");
    }

    function runTokens (pattern, index, scope, context) {
        var i = tokens.length,
            result, match, t;
        // Protect against constructing XRegExps within token handler and trigger functions
        isInsideConstructor = true;
        // Must reset `isInsideConstructor`, even if a `trigger` or `handler` throws
        try {
            while (i--) { // Run in reverse order
                t = tokens[i];
                if ((scope & t.scope) && (!t.trigger || t.trigger.call(context))) {
                    t.pattern.lastIndex = index;
                    match = t.pattern.exec(pattern); // Running the altered `exec` here allows use of named backreferences, etc.
                    if (match && match.index === index) {
                        result = {
                            output: t.handler.call(context, match, scope),
                            match: match
                        };
                        break;
                    }
                }
            }
        } catch (err) {
            throw err;
        } finally {
            isInsideConstructor = false;
        }
        return result;
    }

    function indexOf (array, item, from) {
        if (Array.prototype.indexOf) // Use the native array method if available
            return array.indexOf(item, from);
        for (var i = from || 0; i < array.length; i++) {
            if (array[i] === item)
                return i;
        }
        return -1;
    }


    //---------------------------------
    //  Built-in tokens
    //---------------------------------

    // Augment XRegExp's regular expression syntax and flags. Note that when adding tokens, the
    // third (`scope`) argument defaults to `XRegExp.OUTSIDE_CLASS`

    // Comment pattern: (?# )
    XRegExp.addToken(
        /\(\?#[^)]*\)/,
        function (match) {
            // Keep tokens separated unless the following token is a quantifier
            return nativ.test.call(quantifier, match.input.slice(match.index + match[0].length)) ? "" : "(?:)";
        }
    );

    // Capturing group (match the opening parenthesis only).
    // Required for support of named capturing groups
    XRegExp.addToken(
        /\((?!\?)/,
        function () {
            this.captureNames.push(null);
            return "(";
        }
    );

    // Named capturing group (match the opening delimiter only): (?<name>
    XRegExp.addToken(
        /\(\?<([$\w]+)>/,
        function (match) {
            this.captureNames.push(match[1]);
            this.hasNamedCapture = true;
            return "(";
        }
    );

    // Named backreference: \k<name>
    XRegExp.addToken(
        /\\k<([\w$]+)>/,
        function (match) {
            var index = indexOf(this.captureNames, match[1]);
            // Keep backreferences separate from subsequent literal numbers. Preserve back-
            // references to named groups that are undefined at this point as literal strings
            return index > -1 ?
                "\\" + (index + 1) + (isNaN(match.input.charAt(match.index + match[0].length)) ? "" : "(?:)") :
                match[0];
        }
    );

    // Empty character class: [] or [^]
    XRegExp.addToken(
        /\[\^?]/,
        function (match) {
            // For cross-browser compatibility with ES3, convert [] to \b\B and [^] to [\s\S].
            // (?!) should work like \b\B, but is unreliable in Firefox
            return match[0] === "[]" ? "\\b\\B" : "[\\s\\S]";
        }
    );

    // Mode modifier at the start of the pattern only, with any combination of flags imsx: (?imsx)
    // Does not support x(?i), (?-i), (?i-m), (?i: ), (?i)(?m), etc.
    XRegExp.addToken(
        /^\(\?([imsx]+)\)/,
        function (match) {
            this.setFlag(match[1]);
            return "";
        }
    );

    // Whitespace and comments, in free-spacing (aka extended) mode only
    XRegExp.addToken(
        /(?:\s+|#.*)+/,
        function (match) {
            // Keep tokens separated unless the following token is a quantifier
            return nativ.test.call(quantifier, match.input.slice(match.index + match[0].length)) ? "" : "(?:)";
        },
        XRegExp.OUTSIDE_CLASS,
        function () {return this.hasFlag("x");}
    );

    // Dot, in dotall (aka singleline) mode only
    XRegExp.addToken(
        /\./,
        function () {return "[\\s\\S]";},
        XRegExp.OUTSIDE_CLASS,
        function () {return this.hasFlag("s");}
    );


    //---------------------------------
    //  Backward compatibility
    //---------------------------------

    // Uncomment the following block for compatibility with XRegExp 1.0-1.2:
    /*
     XRegExp.matchWithinChain = XRegExp.matchChain;
     RegExp.prototype.addFlags = function (s) {return clone(this, s);};
     RegExp.prototype.execAll = function (s) {var r = []; XRegExp.iterate(s, this, function (m) {r.push(m);}); return r;};
     RegExp.prototype.forEachExec = function (s, f, c) {return XRegExp.iterate(s, this, f, c);};
     RegExp.prototype.validate = function (s) {var r = RegExp("^(?:" + this.source + ")$(?!\\s)", getNativeFlags(this)); if (this.global) this.lastIndex = 0; return s.search(r) === 0;};
     */

})();

//
// Begin anonymous function. This is used to contain local scope variables without polutting global scope.
//
if (typeof(SyntaxHighlighter) == 'undefined') var SyntaxHighlighter = function() {

// CommonJS
    if (typeof(require) != 'undefined' && typeof(XRegExp) == 'undefined')
    {
        XRegExp = require('XRegExp').XRegExp;
    }

// Shortcut object which will be assigned to the SyntaxHighlighter variable.
// This is a shorthand for local reference in order to avoid long namespace
// references to SyntaxHighlighter.whatever...
    var sh = {
        defaults : {
            /** Additional CSS class names to be added to highlighter elements. */
            'class-name' : '',

            /** First line number. */
            'first-line' : 1,

            /**
             * Pads line numbers. Possible values are:
             *
             *   false - don't pad line numbers.
             *   true  - automaticaly pad numbers with minimum required number of leading zeroes.
             *   [int] - length up to which pad line numbers.
             */
            'pad-line-numbers' : false,

            /** Lines to highlight. */
            'highlight' : false,

            /** Title to be displayed above the code block. */
            'title' : null,

            /** Enables or disables smart tabs. */
            'smart-tabs' : true,

            /** Gets or sets tab size. */
            'tab-size' : 4,

            /** Enables or disables gutter. */
            'gutter' : true,

            /** Enables or disables toolbar. */
            'toolbar' : true,

            /** Enables quick code copy and paste from double click. */
            'quick-code' : true,

            /** Forces code view to be collapsed. */
            'collapse' : false,

            /** Enables or disables automatic links. */
            'auto-links' : false,

            /** Gets or sets light mode. Equavalent to turning off gutter and toolbar. */
            'light' : false,

            'unindent' : true,

            'html-script' : false
        },

        config : {
            space : '&nbsp;',

            /** Enables use of <SCRIPT type="syntaxhighlighter" /> tags. */
            useScriptTags : true,

            /** Blogger mode flag. */
            bloggerMode : false,

            stripBrs : false,

            /** Name of the tag that SyntaxHighlighter will automatically look for. */
            tagName : 'pre',

            strings : {
                expandSource : 'expand source',
                help : '?',
                alert: 'SyntaxHighlighter\n\n',
                noBrush : 'Can\'t find brush for: ',
                brushNotHtmlScript : 'Brush wasn\'t configured for html-script option: ',

                // this is populated by the build script
                aboutDialog : '@ABOUT@'
            }
        },

        /** Internal 'global' variables. */
        vars : {
            discoveredBrushes : null,
            highlighters : {}
        },

        /** This object is populated by user included external brush files. */
        brushes : {},

        /** Common regular expressions. */
        regexLib : {
            multiLineCComments			: /\/\*[\s\S]*?\*\//gm,
            singleLineCComments			: /\/\/.*$/gm,
            singleLinePerlComments		: /#.*$/gm,
            doubleQuotedString			: /"([^\\"\n]|\\.)*"/g,
            singleQuotedString			: /'([^\\'\n]|\\.)*'/g,
            multiLineDoubleQuotedString	: new XRegExp('"([^\\\\"]|\\\\.)*"', 'gs'),
            multiLineSingleQuotedString	: new XRegExp("'([^\\\\']|\\\\.)*'", 'gs'),
            xmlComments					: /(&lt;|<)!--[\s\S]*?--(&gt;|>)/gm,
            url							: /\w+:\/\/[\w-.\/?%&=:@;#]*/g,

            /** <?= ?> tags. */
            phpScriptTags 				: { left: /(&lt;|<)\?(?:=|php)?/g, right: /\?(&gt;|>)/g, 'eof' : true },

            /** <%= %> tags. */
            aspScriptTags				: { left: /(&lt;|<)%=?/g, right: /%(&gt;|>)/g },

            /** <script> tags. */
            scriptScriptTags			: { left: /(&lt;|<)\s*script.*?(&gt;|>)/gi, right: /(&lt;|<)\/\s*script\s*(&gt;|>)/gi }
        },

        toolbar: {
            /**
             * Generates HTML markup for the toolbar.
             * @param {Highlighter} highlighter Highlighter instance.
             * @return {String} Returns HTML markup.
             */
            getHtml: function(highlighter)
            {
                var html = '<div class="toolbar">',
                    items = sh.toolbar.items,
                    list = items.list
                    ;

                function defaultGetHtml(highlighter, name)
                {
                    return sh.toolbar.getButtonHtml(highlighter, name, sh.config.strings[name]);
                };

                for (var i = 0; i < list.length; i++)
                    html += (items[list[i]].getHtml || defaultGetHtml)(highlighter, list[i]);

                html += '</div>';

                return html;
            },

            /**
             * Generates HTML markup for a regular button in the toolbar.
             * @param {Highlighter} highlighter Highlighter instance.
             * @param {String} commandName		Command name that would be executed.
             * @param {String} label			Label text to display.
             * @return {String}					Returns HTML markup.
             */
            getButtonHtml: function(highlighter, commandName, label)
            {
                return '<span><a href="#" class="toolbar_item'
                    + ' command_' + commandName
                    + ' ' + commandName
                    + '">' + label + '</a></span>'
                    ;
            },

            /**
             * Event handler for a toolbar anchor.
             */
            handler: function(e)
            {
                var target = e.target,
                    className = target.className || ''
                    ;

                function getValue(name)
                {
                    var r = new RegExp(name + '_(\\w+)'),
                        match = r.exec(className)
                        ;

                    return match ? match[1] : null;
                };

                var highlighter = getHighlighterById(findParentElement(target, '.syntaxhighlighter').id),
                    commandName = getValue('command')
                    ;

                // execute the toolbar command
                if (highlighter && commandName)
                    sh.toolbar.items[commandName].execute(highlighter);

                // disable default A click behaviour
                e.preventDefault();
            },

            /** Collection of toolbar items. */
            items : {
                // Ordered lis of items in the toolbar. Can't expect `for (var n in items)` to be consistent.
                list: ['expandSource', 'help'],

                expandSource: {
                    getHtml: function(highlighter)
                    {
                        if (highlighter.getParam('collapse') != true)
                            return '';

                        var title = highlighter.getParam('title');
                        return sh.toolbar.getButtonHtml(highlighter, 'expandSource', title ? title : sh.config.strings.expandSource);
                    },

                    execute: function(highlighter)
                    {
                        var div = getHighlighterDivById(highlighter.id);
                        removeClass(div, 'collapsed');
                    }
                },

                /** Command to display the about dialog window. */
                help: {
                    execute: function(highlighter)
                    {
                        var wnd = popup('', '_blank', 500, 250, 'scrollbars=0'),
                            doc = wnd.document
                            ;

                        doc.write(sh.config.strings.aboutDialog);
                        doc.close();
                        wnd.focus();
                    }
                }
            }
        },

        /**
         * Finds all elements on the page which should be processes by SyntaxHighlighter.
         *
         * @param {Object} globalParams		Optional parameters which override element's
         * 									parameters. Only used if element is specified.
         *
         * @param {Object} element	Optional element to highlight. If none is
         * 							provided, all elements in the current document
         * 							are returned which qualify.
         *
         * @return {Array}	Returns list of <code>{ target: DOMElement, params: Object }</code> objects.
         */
        findElements: function(globalParams, element)
        {
            var elements = element ? [element] : toArray(document.getElementsByTagName(sh.config.tagName)),
                conf = sh.config,
                result = []
                ;

            // support for <SCRIPT TYPE="syntaxhighlighter" /> feature
            if (conf.useScriptTags)
                elements = elements.concat(getSyntaxHighlighterScriptTags());

            if (elements.length === 0)
                return result;

            for (var i = 0; i < elements.length; i++)
            {
                var item = {
                    target: elements[i],
                    // local params take precedence over globals
                    params: merge(globalParams, parseParams(elements[i].className))
                };

                if (item.params['brush'] == null)
                    continue;

                result.push(item);
            }

            return result;
        },

        /**
         * Shorthand to highlight all elements on the page that are marked as
         * SyntaxHighlighter source code.
         *
         * @param {Object} globalParams		Optional parameters which override element's
         * 									parameters. Only used if element is specified.
         *
         * @param {Object} element	Optional element to highlight. If none is
         * 							provided, all elements in the current document
         * 							are highlighted.
         */
        highlight: function(globalParams, element)
        {
            var elements = this.findElements(globalParams, element),
                propertyName = 'innerHTML',
                highlighter = null,
                conf = sh.config
                ;

            if (elements.length === 0)
                return;

            for (var i = 0; i < elements.length; i++)
            {
                var element = elements[i],
                    target = element.target,
                    params = element.params,
                    brushName = params.brush,
                    code
                    ;

                if (brushName == null)
                    continue;

                // Instantiate a brush
                if (params['html-script'] == 'true' || sh.defaults['html-script'] == true)
                {
                    highlighter = new sh.HtmlScript(brushName);
                    brushName = 'htmlscript';
                }
                else
                {
                    var brush = findBrush(brushName);

                    if (brush)
                        highlighter = new brush();
                    else
                        continue;
                }

                code = target[propertyName];

                // remove CDATA from <SCRIPT/> tags if it's present
                if (conf.useScriptTags)
                    code = stripCData(code);

                // Inject title if the attribute is present
                if ((target.title || '') != '')
                    params.title = target.title;

                params['brush'] = brushName;
                highlighter.init(params);
                element = highlighter.getDiv(code);

                // carry over ID
                if ((target.id || '') != '')
                    element.id = target.id;
                //by zhanyi 去掉多余的外围div
                var tmp = element.firstChild.firstChild;
                tmp.className = element.firstChild.className;

                target.parentNode.replaceChild(tmp, target);
            }
        },

        /**
         * Main entry point for the SyntaxHighlighter.
         * @param {Object} params Optional params to apply to all highlighted elements.
         */
        all: function(params)
        {
            attachEvent(
                window,
                'load',
                function() { sh.highlight(params); }
            );
        }
    }; // end of sh

    /**
     * Checks if target DOM elements has specified CSS class.
     * @param {DOMElement} target Target DOM element to check.
     * @param {String} className Name of the CSS class to check for.
     * @return {Boolean} Returns true if class name is present, false otherwise.
     */
    function hasClass(target, className)
    {
        return target.className.indexOf(className) != -1;
    };

    /**
     * Adds CSS class name to the target DOM element.
     * @param {DOMElement} target Target DOM element.
     * @param {String} className New CSS class to add.
     */
    function addClass(target, className)
    {
        if (!hasClass(target, className))
            target.className += ' ' + className;
    };

    /**
     * Removes CSS class name from the target DOM element.
     * @param {DOMElement} target Target DOM element.
     * @param {String} className CSS class to remove.
     */
    function removeClass(target, className)
    {
        target.className = target.className.replace(className, '');
    };

    /**
     * Converts the source to array object. Mostly used for function arguments and
     * lists returned by getElementsByTagName() which aren't Array objects.
     * @param {List} source Source list.
     * @return {Array} Returns array.
     */
    function toArray(source)
    {
        var result = [];

        for (var i = 0; i < source.length; i++)
            result.push(source[i]);

        return result;
    };

    /**
     * Splits block of text into lines.
     * @param {String} block Block of text.
     * @return {Array} Returns array of lines.
     */
    function splitLines(block)
    {
        return block.split(/\r?\n/);
    }

    /**
     * Generates HTML ID for the highlighter.
     * @param {String} highlighterId Highlighter ID.
     * @return {String} Returns HTML ID.
     */
    function getHighlighterId(id)
    {
        var prefix = 'highlighter_';
        return id.indexOf(prefix) == 0 ? id : prefix + id;
    };

    /**
     * Finds Highlighter instance by ID.
     * @param {String} highlighterId Highlighter ID.
     * @return {Highlighter} Returns instance of the highlighter.
     */
    function getHighlighterById(id)
    {
        return sh.vars.highlighters[getHighlighterId(id)];
    };

    /**
     * Finds highlighter's DIV container.
     * @param {String} highlighterId Highlighter ID.
     * @return {Element} Returns highlighter's DIV element.
     */
    function getHighlighterDivById(id)
    {
        return document.getElementById(getHighlighterId(id));
    };

    /**
     * Stores highlighter so that getHighlighterById() can do its thing. Each
     * highlighter must call this method to preserve itself.
     * @param {Highilghter} highlighter Highlighter instance.
     */
    function storeHighlighter(highlighter)
    {
        sh.vars.highlighters[getHighlighterId(highlighter.id)] = highlighter;
    };

    /**
     * Looks for a child or parent node which has specified classname.
     * Equivalent to jQuery's $(container).find(".className")
     * @param {Element} target Target element.
     * @param {String} search Class name or node name to look for.
     * @param {Boolean} reverse If set to true, will go up the node tree instead of down.
     * @return {Element} Returns found child or parent element on null.
     */
    function findElement(target, search, reverse /* optional */)
    {
        if (target == null)
            return null;

        var nodes			= reverse != true ? target.childNodes : [ target.parentNode ],
            propertyToFind	= { '#' : 'id', '.' : 'className' }[search.substr(0, 1)] || 'nodeName',
            expectedValue,
            found
            ;

        expectedValue = propertyToFind != 'nodeName'
            ? search.substr(1)
            : search.toUpperCase()
        ;

        // main return of the found node
        if ((target[propertyToFind] || '').indexOf(expectedValue) != -1)
            return target;

        for (var i = 0; nodes && i < nodes.length && found == null; i++)
            found = findElement(nodes[i], search, reverse);

        return found;
    };

    /**
     * Looks for a parent node which has specified classname.
     * This is an alias to <code>findElement(container, className, true)</code>.
     * @param {Element} target Target element.
     * @param {String} className Class name to look for.
     * @return {Element} Returns found parent element on null.
     */
    function findParentElement(target, className)
    {
        return findElement(target, className, true);
    };

    /**
     * Finds an index of element in the array.
     * @ignore
     * @param {Object} searchElement
     * @param {Number} fromIndex
     * @return {Number} Returns index of element if found; -1 otherwise.
     */
    function indexOf(array, searchElement, fromIndex)
    {
        fromIndex = Math.max(fromIndex || 0, 0);

        for (var i = fromIndex; i < array.length; i++)
            if(array[i] == searchElement)
                return i;

        return -1;
    };

    /**
     * Generates a unique element ID.
     */
    function guid(prefix)
    {
        return (prefix || '') + Math.round(Math.random() * 1000000).toString();
    };

    /**
     * Merges two objects. Values from obj2 override values in obj1.
     * Function is NOT recursive and works only for one dimensional objects.
     * @param {Object} obj1 First object.
     * @param {Object} obj2 Second object.
     * @return {Object} Returns combination of both objects.
     */
    function merge(obj1, obj2)
    {
        var result = {}, name;

        for (name in obj1)
            result[name] = obj1[name];

        for (name in obj2)
            result[name] = obj2[name];

        return result;
    };

    /**
     * Attempts to convert string to boolean.
     * @param {String} value Input string.
     * @return {Boolean} Returns true if input was "true", false if input was "false" and value otherwise.
     */
    function toBoolean(value)
    {
        var result = { "true" : true, "false" : false }[value];
        return result == null ? value : result;
    };

    /**
     * Opens up a centered popup window.
     * @param {String} url		URL to open in the window.
     * @param {String} name		Popup name.
     * @param {int} width		Popup width.
     * @param {int} height		Popup height.
     * @param {String} options	window.open() options.
     * @return {Window}			Returns window instance.
     */
    function popup(url, name, width, height, options)
    {
        var x = (screen.width - width) / 2,
            y = (screen.height - height) / 2
            ;

        options +=	', left=' + x +
            ', top=' + y +
            ', width=' + width +
            ', height=' + height
        ;
        options = options.replace(/^,/, '');

        var win = window.open(url, name, options);
        win.focus();
        return win;
    };

    /**
     * Adds event handler to the target object.
     * @param {Object} obj		Target object.
     * @param {String} type		Name of the event.
     * @param {Function} func	Handling function.
     */
    function attachEvent(obj, type, func, scope)
    {
        function handler(e)
        {
            e = e || window.event;

            if (!e.target)
            {
                e.target = e.srcElement;
                e.preventDefault = function()
                {
                    this.returnValue = false;
                };
            }

            func.call(scope || window, e);
        };

        if (obj.attachEvent)
        {
            obj.attachEvent('on' + type, handler);
        }
        else
        {
            obj.addEventListener(type, handler, false);
        }
    };

    /**
     * Displays an alert.
     * @param {String} str String to display.
     */
    function alert(str)
    {
        window.alert(sh.config.strings.alert + str);
    };

    /**
     * Finds a brush by its alias.
     *
     * @param {String} alias		Brush alias.
     * @param {Boolean} showAlert	Suppresses the alert if false.
     * @return {Brush}				Returns bursh constructor if found, null otherwise.
     */
    function findBrush(alias, showAlert)
    {
        var brushes = sh.vars.discoveredBrushes,
            result = null
            ;

        if (brushes == null)
        {
            brushes = {};

            // Find all brushes
            for (var brush in sh.brushes)
            {
                var info = sh.brushes[brush],
                    aliases = info.aliases
                    ;

                if (aliases == null)
                    continue;

                // keep the brush name
                info.brushName = brush.toLowerCase();

                for (var i = 0; i < aliases.length; i++)
                    brushes[aliases[i]] = brush;
            }

            sh.vars.discoveredBrushes = brushes;
        }

        result = sh.brushes[brushes[alias]];

        if (result == null && showAlert)
            alert(sh.config.strings.noBrush + alias);

        return result;
    };

    /**
     * Executes a callback on each line and replaces each line with result from the callback.
     * @param {Object} str			Input string.
     * @param {Object} callback		Callback function taking one string argument and returning a string.
     */
    function eachLine(str, callback)
    {
        var lines = splitLines(str);

        for (var i = 0; i < lines.length; i++)
            lines[i] = callback(lines[i], i);

        // include \r to enable copy-paste on windows (ie8) without getting everything on one line
        return lines.join('\r\n');
    };

    /**
     * This is a special trim which only removes first and last empty lines
     * and doesn't affect valid leading space on the first line.
     *
     * @param {String} str   Input string
     * @return {String}      Returns string without empty first and last lines.
     */
    function trimFirstAndLastLines(str)
    {
        return str.replace(/^[ ]*[\n]+|[\n]*[ ]*$/g, '');
    };

    /**
     * Parses key/value pairs into hash object.
     *
     * Understands the following formats:
     * - name: word;
     * - name: [word, word];
     * - name: "string";
     * - name: 'string';
     *
     * For example:
     *   name1: value; name2: [value, value]; name3: 'value'
     *
     * @param {String} str    Input string.
     * @return {Object}       Returns deserialized object.
     */
    function parseParams(str)
    {
        var match,
            result = {},
            arrayRegex = new XRegExp("^\\[(?<values>(.*?))\\]$"),
            regex = new XRegExp(
                "(?<name>[\\w-]+)" +
                    "\\s*:\\s*" +
                    "(?<value>" +
                    "[\\w-%#]+|" +		// word
                    "\\[.*?\\]|" +		// [] array
                    '".*?"|' +			// "" string
                    "'.*?'" +			// '' string
                    ")\\s*;?",
                "g"
            )
            ;

        while ((match = regex.exec(str)) != null)
        {
            var value = match.value
                    .replace(/^['"]|['"]$/g, '') // strip quotes from end of strings
                ;

            // try to parse array value
            if (value != null && arrayRegex.test(value))
            {
                var m = arrayRegex.exec(value);
                value = m.values.length > 0 ? m.values.split(/\s*,\s*/) : [];
            }

            result[match.name] = value;
        }

        return result;
    };

    /**
     * Wraps each line of the string into <code/> tag with given style applied to it.
     *
     * @param {String} str   Input string.
     * @param {String} css   Style name to apply to the string.
     * @return {String}      Returns input string with each line surrounded by <span/> tag.
     */
    function wrapLinesWithCode(str, css)
    {
        if (str == null || str.length == 0 || str == '\n')
            return str;

        str = str.replace(/</g, '&lt;');

        // Replace two or more sequential spaces with &nbsp; leaving last space untouched.
        str = str.replace(/ {2,}/g, function(m)
        {
            var spaces = '';

            for (var i = 0; i < m.length - 1; i++)
                spaces += sh.config.space;

            return spaces + ' ';
        });

        // Split each line and apply <span class="...">...</span> to them so that
        // leading spaces aren't included.
        if (css != null)
            str = eachLine(str, function(line)
            {
                if (line.length == 0)
                    return '';

                var spaces = '';

                line = line.replace(/^(&nbsp;| )+/, function(s)
                {
                    spaces = s;
                    return '';
                });

                if (line.length == 0)
                    return spaces;

                return spaces + '<code class="' + css + '">' + line + '</code>';
            });

        return str;
    };

    /**
     * Pads number with zeros until it's length is the same as given length.
     *
     * @param {Number} number	Number to pad.
     * @param {Number} length	Max string length with.
     * @return {String}			Returns a string padded with proper amount of '0'.
     */
    function padNumber(number, length)
    {
        var result = number.toString();

        while (result.length < length)
            result = '0' + result;

        return result;
    };

    /**
     * Replaces tabs with spaces.
     *
     * @param {String} code		Source code.
     * @param {Number} tabSize	Size of the tab.
     * @return {String}			Returns code with all tabs replaces by spaces.
     */
    function processTabs(code, tabSize)
    {
        var tab = '';

        for (var i = 0; i < tabSize; i++)
            tab += ' ';

        return code.replace(/\t/g, tab);
    };

    /**
     * Replaces tabs with smart spaces.
     *
     * @param {String} code    Code to fix the tabs in.
     * @param {Number} tabSize Number of spaces in a column.
     * @return {String}        Returns code with all tabs replaces with roper amount of spaces.
     */
    function processSmartTabs(code, tabSize)
    {
        var lines = splitLines(code),
            tab = '\t',
            spaces = ''
            ;

        // Create a string with 1000 spaces to copy spaces from...
        // It's assumed that there would be no indentation longer than that.
        for (var i = 0; i < 50; i++)
            spaces += '                    '; // 20 spaces * 50

        // This function inserts specified amount of spaces in the string
        // where a tab is while removing that given tab.
        function insertSpaces(line, pos, count)
        {
            return line.substr(0, pos)
                + spaces.substr(0, count)
                + line.substr(pos + 1, line.length) // pos + 1 will get rid of the tab
                ;
        };

        // Go through all the lines and do the 'smart tabs' magic.
        code = eachLine(code, function(line)
        {
            if (line.indexOf(tab) == -1)
                return line;

            var pos = 0;

            while ((pos = line.indexOf(tab)) != -1)
            {
                // This is pretty much all there is to the 'smart tabs' logic.
                // Based on the position within the line and size of a tab,
                // calculate the amount of spaces we need to insert.
                var spaces = tabSize - pos % tabSize;
                line = insertSpaces(line, pos, spaces);
            }

            return line;
        });

        return code;
    };

    /**
     * Performs various string fixes based on configuration.
     */
    function fixInputString(str)
    {
        var br = /<br\s*\/?>|&lt;br\s*\/?&gt;/gi;

        if (sh.config.bloggerMode == true)
            str = str.replace(br, '\n');

        if (sh.config.stripBrs == true)
            str = str.replace(br, '');

        return str;
    };

    /**
     * Removes all white space at the begining and end of a string.
     *
     * @param {String} str   String to trim.
     * @return {String}      Returns string without leading and following white space characters.
     */
    function trim(str)
    {
        return str.replace(/^\s+|\s+$/g, '');
    };

    /**
     * Unindents a block of text by the lowest common indent amount.
     * @param {String} str   Text to unindent.
     * @return {String}      Returns unindented text block.
     */
    function unindent(str)
    {
        var lines = splitLines(fixInputString(str)),
            indents = new Array(),
            regex = /^\s*/,
            min = 1000
            ;

        // go through every line and check for common number of indents
        for (var i = 0; i < lines.length && min > 0; i++)
        {
            var line = lines[i];

            if (trim(line).length == 0)
                continue;

            var matches = regex.exec(line);

            // In the event that just one line doesn't have leading white space
            // we can't unindent anything, so bail completely.
            if (matches == null)
                return str;

            min = Math.min(matches[0].length, min);
        }

        // trim minimum common number of white space from the begining of every line
        if (min > 0)
            for (var i = 0; i < lines.length; i++)
                lines[i] = lines[i].substr(min);

        return lines.join('\n');
    };

    /**
     * Callback method for Array.sort() which sorts matches by
     * index position and then by length.
     *
     * @param {Match} m1	Left object.
     * @param {Match} m2    Right object.
     * @return {Number}     Returns -1, 0 or -1 as a comparison result.
     */
    function matchesSortCallback(m1, m2)
    {
        // sort matches by index first
        if(m1.index < m2.index)
            return -1;
        else if(m1.index > m2.index)
            return 1;
        else
        {
            // if index is the same, sort by length
            if(m1.length < m2.length)
                return -1;
            else if(m1.length > m2.length)
                return 1;
        }

        return 0;
    };

    /**
     * Executes given regular expression on provided code and returns all
     * matches that are found.
     *
     * @param {String} code    Code to execute regular expression on.
     * @param {Object} regex   Regular expression item info from <code>regexList</code> collection.
     * @return {Array}         Returns a list of Match objects.
     */
    function getMatches(code, regexInfo)
    {
        function defaultAdd(match, regexInfo)
        {
            return match[0];
        };

        var index = 0,
            match = null,
            matches = [],
            func = regexInfo.func ? regexInfo.func : defaultAdd
            ;

        while((match = regexInfo.regex.exec(code)) != null)
        {
            var resultMatch = func(match, regexInfo);

            if (typeof(resultMatch) == 'string')
                resultMatch = [new sh.Match(resultMatch, match.index, regexInfo.css)];

            matches = matches.concat(resultMatch);
        }

        return matches;
    };

    /**
     * Turns all URLs in the code into <a/> tags.
     * @param {String} code Input code.
     * @return {String} Returns code with </a> tags.
     */
    function processUrls(code)
    {
        var gt = /(.*)((&gt;|&lt;).*)/;

        return code.replace(sh.regexLib.url, function(m)
        {
            var suffix = '',
                match = null
                ;

            // We include &lt; and &gt; in the URL for the common cases like <http://google.com>
            // The problem is that they get transformed into &lt;http://google.com&gt;
            // Where as &gt; easily looks like part of the URL string.

            if (match = gt.exec(m))
            {
                m = match[1];
                suffix = match[2];
            }

            return '<a href="' + m + '">' + m + '</a>' + suffix;
        });
    };

    /**
     * Finds all <SCRIPT TYPE="syntaxhighlighter" /> elementss.
     * @return {Array} Returns array of all found SyntaxHighlighter tags.
     */
    function getSyntaxHighlighterScriptTags()
    {
        var tags = document.getElementsByTagName('script'),
            result = []
            ;

        for (var i = 0; i < tags.length; i++)
            if (tags[i].type == 'syntaxhighlighter')
                result.push(tags[i]);

        return result;
    };

    /**
     * Strips <![CDATA[]]> from <SCRIPT /> content because it should be used
     * there in most cases for XHTML compliance.
     * @param {String} original	Input code.
     * @return {String} Returns code without leading <![CDATA[]]> tags.
     */
    function stripCData(original)
    {
        var left = '<![CDATA[',
            right = ']]>',
        // for some reason IE inserts some leading blanks here
            copy = trim(original),
            changed = false,
            leftLength = left.length,
            rightLength = right.length
            ;

        if (copy.indexOf(left) == 0)
        {
            copy = copy.substring(leftLength);
            changed = true;
        }

        var copyLength = copy.length;

        if (copy.indexOf(right) == copyLength - rightLength)
        {
            copy = copy.substring(0, copyLength - rightLength);
            changed = true;
        }

        return changed ? copy : original;
    };


    /**
     * Quick code mouse double click handler.
     */
    function quickCodeHandler(e)
    {
        var target = e.target,
            highlighterDiv = findParentElement(target, '.syntaxhighlighter'),
            container = findParentElement(target, '.container'),
            textarea = document.createElement('textarea'),
            highlighter
            ;

        if (!container || !highlighterDiv || findElement(container, 'textarea'))
            return;

        highlighter = getHighlighterById(highlighterDiv.id);

        // add source class name
        addClass(highlighterDiv, 'source');

        // Have to go over each line and grab it's text, can't just do it on the
        // container because Firefox loses all \n where as Webkit doesn't.
        var lines = container.childNodes,
            code = []
            ;

        for (var i = 0; i < lines.length; i++)
            code.push(lines[i].innerText || lines[i].textContent);

        // using \r instead of \r or \r\n makes this work equally well on IE, FF and Webkit
        code = code.join('\r');

        // For Webkit browsers, replace nbsp with a breaking space
        code = code.replace(/\u00a0/g, " ");

        // inject <textarea/> tag
        textarea.appendChild(document.createTextNode(code));
        container.appendChild(textarea);

        // preselect all text
        textarea.focus();
        textarea.select();

        // set up handler for lost focus
        attachEvent(textarea, 'blur', function(e)
        {
            textarea.parentNode.removeChild(textarea);
            removeClass(highlighterDiv, 'source');
        });
    };

    /**
     * Match object.
     */
    sh.Match = function(value, index, css)
    {
        this.value = value;
        this.index = index;
        this.length = value.length;
        this.css = css;
        this.brushName = null;
    };

    sh.Match.prototype.toString = function()
    {
        return this.value;
    };

    /**
     * Simulates HTML code with a scripting language embedded.
     *
     * @param {String} scriptBrushName Brush name of the scripting language.
     */
    sh.HtmlScript = function(scriptBrushName)
    {
        var brushClass = findBrush(scriptBrushName),
            scriptBrush,
            xmlBrush = new sh.brushes.Xml(),
            bracketsRegex = null,
            ref = this,
            methodsToExpose = 'getDiv getHtml init'.split(' ')
            ;

        if (brushClass == null)
            return;

        scriptBrush = new brushClass();

        for(var i = 0; i < methodsToExpose.length; i++)
            // make a closure so we don't lose the name after i changes
            (function() {
                var name = methodsToExpose[i];

                ref[name] = function()
                {
                    return xmlBrush[name].apply(xmlBrush, arguments);
                };
            })();

        if (scriptBrush.htmlScript == null)
        {
            alert(sh.config.strings.brushNotHtmlScript + scriptBrushName);
            return;
        }

        xmlBrush.regexList.push(
            { regex: scriptBrush.htmlScript.code, func: process }
        );

        function offsetMatches(matches, offset)
        {
            for (var j = 0; j < matches.length; j++)
                matches[j].index += offset;
        }

        function process(match, info)
        {
            var code = match.code,
                matches = [],
                regexList = scriptBrush.regexList,
                offset = match.index + match.left.length,
                htmlScript = scriptBrush.htmlScript,
                result
                ;

            // add all matches from the code
            for (var i = 0; i < regexList.length; i++)
            {
                result = getMatches(code, regexList[i]);
                offsetMatches(result, offset);
                matches = matches.concat(result);
            }

            // add left script bracket
            if (htmlScript.left != null && match.left != null)
            {
                result = getMatches(match.left, htmlScript.left);
                offsetMatches(result, match.index);
                matches = matches.concat(result);
            }

            // add right script bracket
            if (htmlScript.right != null && match.right != null)
            {
                result = getMatches(match.right, htmlScript.right);
                offsetMatches(result, match.index + match[0].lastIndexOf(match.right));
                matches = matches.concat(result);
            }

            for (var j = 0; j < matches.length; j++)
                matches[j].brushName = brushClass.brushName;

            return matches;
        }
    };

    /**
     * Main Highlither class.
     * @constructor
     */
    sh.Highlighter = function()
    {
        // not putting any code in here because of the prototype inheritance
    };

    sh.Highlighter.prototype = {
        /**
         * Returns value of the parameter passed to the highlighter.
         * @param {String} name				Name of the parameter.
         * @param {Object} defaultValue		Default value.
         * @return {Object}					Returns found value or default value otherwise.
         */
        getParam: function(name, defaultValue)
        {
            var result = this.params[name];
            return toBoolean(result == null ? defaultValue : result);
        },

        /**
         * Shortcut to document.createElement().
         * @param {String} name		Name of the element to create (DIV, A, etc).
         * @return {HTMLElement}	Returns new HTML element.
         */
        create: function(name)
        {
            return document.createElement(name);
        },

        /**
         * Applies all regular expression to the code and stores all found
         * matches in the `this.matches` array.
         * @param {Array} regexList		List of regular expressions.
         * @param {String} code			Source code.
         * @return {Array}				Returns list of matches.
         */
        findMatches: function(regexList, code)
        {
            var result = [];

            if (regexList != null)
                for (var i = 0; i < regexList.length; i++)
                    // BUG: length returns len+1 for array if methods added to prototype chain (oising@gmail.com)
                    if (typeof (regexList[i]) == "object")
                        result = result.concat(getMatches(code, regexList[i]));

            // sort and remove nested the matches
            return this.removeNestedMatches(result.sort(matchesSortCallback));
        },

        /**
         * Checks to see if any of the matches are inside of other matches.
         * This process would get rid of highligted strings inside comments,
         * keywords inside strings and so on.
         */
        removeNestedMatches: function(matches)
        {
            // Optimized by Jose Prado (http://joseprado.com)
            for (var i = 0; i < matches.length; i++)
            {
                if (matches[i] === null)
                    continue;

                var itemI = matches[i],
                    itemIEndPos = itemI.index + itemI.length
                    ;

                for (var j = i + 1; j < matches.length && matches[i] !== null; j++)
                {
                    var itemJ = matches[j];

                    if (itemJ === null)
                        continue;
                    else if (itemJ.index > itemIEndPos)
                        break;
                    else if (itemJ.index == itemI.index && itemJ.length > itemI.length)
                        matches[i] = null;
                    else if (itemJ.index >= itemI.index && itemJ.index < itemIEndPos)
                        matches[j] = null;
                }
            }

            return matches;
        },

        /**
         * Creates an array containing integer line numbers starting from the 'first-line' param.
         * @return {Array} Returns array of integers.
         */
        figureOutLineNumbers: function(code)
        {
            var lines = [],
                firstLine = parseInt(this.getParam('first-line'))
                ;

            eachLine(code, function(line, index)
            {
                lines.push(index + firstLine);
            });

            return lines;
        },

        /**
         * Determines if specified line number is in the highlighted list.
         */
        isLineHighlighted: function(lineNumber)
        {
            var list = this.getParam('highlight', []);

            if (typeof(list) != 'object' && list.push == null)
                list = [ list ];

            return indexOf(list, lineNumber.toString()) != -1;
        },

        /**
         * Generates HTML markup for a single line of code while determining alternating line style.
         * @param {Integer} lineNumber	Line number.
         * @param {String} code Line	HTML markup.
         * @return {String}				Returns HTML markup.
         */
        getLineHtml: function(lineIndex, lineNumber, code)
        {
            var classes = [
                'line',
                'number' + lineNumber,
                'index' + lineIndex,
                'alt' + (lineNumber % 2 == 0 ? 1 : 2).toString()
            ];

            if (this.isLineHighlighted(lineNumber))
                classes.push('highlighted');

            if (lineNumber == 0)
                classes.push('break');

            return '<div class="' + classes.join(' ') + '">' + code + '</div>';
        },

        /**
         * Generates HTML markup for line number column.
         * @param {String} code			Complete code HTML markup.
         * @param {Array} lineNumbers	Calculated line numbers.
         * @return {String}				Returns HTML markup.
         */
        getLineNumbersHtml: function(code, lineNumbers)
        {
            var html = '',
                count = splitLines(code).length,
                firstLine = parseInt(this.getParam('first-line')),
                pad = this.getParam('pad-line-numbers')
                ;

            if (pad == true)
                pad = (firstLine + count - 1).toString().length;
            else if (isNaN(pad) == true)
                pad = 0;

            for (var i = 0; i < count; i++)
            {
                var lineNumber = lineNumbers ? lineNumbers[i] : firstLine + i,
                    code = lineNumber == 0 ? sh.config.space : padNumber(lineNumber, pad)
                    ;

                html += this.getLineHtml(i, lineNumber, code);
            }

            return html;
        },

        /**
         * Splits block of text into individual DIV lines.
         * @param {String} code			Code to highlight.
         * @param {Array} lineNumbers	Calculated line numbers.
         * @return {String}				Returns highlighted code in HTML form.
         */
        getCodeLinesHtml: function(html, lineNumbers)
        {
            html = trim(html);

            var lines = splitLines(html),
                padLength = this.getParam('pad-line-numbers'),
                firstLine = parseInt(this.getParam('first-line')),
                html = '',
                brushName = this.getParam('brush')
                ;

            for (var i = 0; i < lines.length; i++)
            {
                var line = lines[i],
                    indent = /^(&nbsp;|\s)+/.exec(line),
                    spaces = null,
                    lineNumber = lineNumbers ? lineNumbers[i] : firstLine + i;
                ;

                if (indent != null)
                {
                    spaces = indent[0].toString();
                    line = line.substr(spaces.length);
                    spaces = spaces.replace(' ', sh.config.space);
                }

                line = trim(line);

                if (line.length == 0)
                    line = sh.config.space;

                html += this.getLineHtml(
                    i,
                    lineNumber,
                    (spaces != null ? '<code class="' + brushName + ' spaces">' + spaces + '</code>' : '') + line
                );
            }

            return html;
        },

        /**
         * Returns HTML for the table title or empty string if title is null.
         */
        getTitleHtml: function(title)
        {
            return title ? '<caption>' + title + '</caption>' : '';
        },

        /**
         * Finds all matches in the source code.
         * @param {String} code		Source code to process matches in.
         * @param {Array} matches	Discovered regex matches.
         * @return {String} Returns formatted HTML with processed mathes.
         */
        getMatchesHtml: function(code, matches)
        {
            var pos = 0,
                result = '',
                brushName = this.getParam('brush', '')
                ;

            function getBrushNameCss(match)
            {
                var result = match ? (match.brushName || brushName) : brushName;
                return result ? result + ' ' : '';
            };

            // Finally, go through the final list of matches and pull the all
            // together adding everything in between that isn't a match.
            for (var i = 0; i < matches.length; i++)
            {
                var match = matches[i],
                    matchBrushName
                    ;

                if (match === null || match.length === 0)
                    continue;

                matchBrushName = getBrushNameCss(match);

                result += wrapLinesWithCode(code.substr(pos, match.index - pos), matchBrushName + 'plain')
                    + wrapLinesWithCode(match.value, matchBrushName + match.css)
                ;

                pos = match.index + match.length + (match.offset || 0);
            }

            // don't forget to add whatever's remaining in the string
            result += wrapLinesWithCode(code.substr(pos), getBrushNameCss() + 'plain');

            return result;
        },

        /**
         * Generates HTML markup for the whole syntax highlighter.
         * @param {String} code Source code.
         * @return {String} Returns HTML markup.
         */
        getHtml: function(code)
        {
            var html = '',
                classes = [ 'syntaxhighlighter' ],
                tabSize,
                matches,
                lineNumbers
                ;

            // process light mode
            if (this.getParam('light') == true)
                this.params.toolbar = this.params.gutter = false;

            className = 'syntaxhighlighter';

            if (this.getParam('collapse') == true)
                classes.push('collapsed');

            if ((gutter = this.getParam('gutter')) == false)
                classes.push('nogutter');

            // add custom user style name
            classes.push(this.getParam('class-name'));

            // add brush alias to the class name for custom CSS
            classes.push(this.getParam('brush'));

            code = trimFirstAndLastLines(code)
                .replace(/\r/g, ' ') // IE lets these buggers through
            ;

            tabSize = this.getParam('tab-size');

            // replace tabs with spaces
            code = this.getParam('smart-tabs') == true
                ? processSmartTabs(code, tabSize)
                : processTabs(code, tabSize)
            ;

            // unindent code by the common indentation
            if (this.getParam('unindent'))
                code = unindent(code);

            if (gutter)
                lineNumbers = this.figureOutLineNumbers(code);

            // find matches in the code using brushes regex list
            matches = this.findMatches(this.regexList, code);
            // processes found matches into the html
            html = this.getMatchesHtml(code, matches);
            // finally, split all lines so that they wrap well
            html = this.getCodeLinesHtml(html, lineNumbers);

            // finally, process the links
            if (this.getParam('auto-links'))
                html = processUrls(html);

            if (typeof(navigator) != 'undefined' && navigator.userAgent && navigator.userAgent.match(/MSIE/))
                classes.push('ie');

            html =
                '<div id="' + getHighlighterId(this.id) + '" class="' + classes.join(' ') + '">'
                    + (this.getParam('toolbar') ? sh.toolbar.getHtml(this) : '')
                    + '<table border="0" cellpadding="0" cellspacing="0">'
                    + this.getTitleHtml(this.getParam('title'))
                    + '<tbody>'
                    + '<tr>'
                    + (gutter ? '<td class="gutter">' + this.getLineNumbersHtml(code) + '</td>' : '')
                    + '<td class="code">'
                    + '<div class="container">'
                    + html
                    + '</div>'
                    + '</td>'
                    + '</tr>'
                    + '</tbody>'
                    + '</table>'
                    + '</div>'
            ;

            return html;
        },

        /**
         * Highlights the code and returns complete HTML.
         * @param {String} code     Code to highlight.
         * @return {Element}        Returns container DIV element with all markup.
         */
        getDiv: function(code)
        {
            if (code === null)
                code = '';

            this.code = code;

            var div = this.create('div');

            // create main HTML
            div.innerHTML = this.getHtml(code);

            // set up click handlers
            if (this.getParam('toolbar'))
                attachEvent(findElement(div, '.toolbar'), 'click', sh.toolbar.handler);

            if (this.getParam('quick-code'))
                attachEvent(findElement(div, '.code'), 'dblclick', quickCodeHandler);

            return div;
        },

        /**
         * Initializes the highlighter/brush.
         *
         * Constructor isn't used for initialization so that nothing executes during necessary
         * `new SyntaxHighlighter.Highlighter()` call when setting up brush inheritence.
         *
         * @param {Hash} params Highlighter parameters.
         */
        init: function(params)
        {
            this.id = guid();

            // register this instance in the highlighters list
            storeHighlighter(this);

            // local params take precedence over defaults
            this.params = merge(sh.defaults, params || {})

            // process light mode
            if (this.getParam('light') == true)
                this.params.toolbar = this.params.gutter = false;
        },

        /**
         * Converts space separated list of keywords into a regular expression string.
         * @param {String} str    Space separated keywords.
         * @return {String}       Returns regular expression string.
         */
        getKeywords: function(str)
        {
            str = str
                .replace(/^\s+|\s+$/g, '')
                .replace(/\s+/g, '|')
            ;

            return '\\b(?:' + str + ')\\b';
        },

        /**
         * Makes a brush compatible with the `html-script` functionality.
         * @param {Object} regexGroup Object containing `left` and `right` regular expressions.
         */
        forHtmlScript: function(regexGroup)
        {
            var regex = { 'end' : regexGroup.right.source };

            if(regexGroup.eof)
                regex.end = "(?:(?:" + regex.end + ")|$)";

            this.htmlScript = {
                left : { regex: regexGroup.left, css: 'script' },
                right : { regex: regexGroup.right, css: 'script' },
                code : new XRegExp(
                    "(?<left>" + regexGroup.left.source + ")" +
                        "(?<code>.*?)" +
                        "(?<right>" + regex.end + ")",
                    "sgi"
                )
            };
        }
    }; // end of Highlighter

    return sh;
}(); // end of anonymous function

// CommonJS
typeof(exports) != 'undefined' ? exports.SyntaxHighlighter = SyntaxHighlighter : null;

;(function()
{
    // CommonJS
    SyntaxHighlighter = SyntaxHighlighter || (typeof require !== 'undefined'? require('shCore').SyntaxHighlighter : null);

    function Brush()
    {
        // Created by Peter Atoria @ http://iAtoria.com

        var inits 	 =  'class interface function package';

        var keywords =	'-Infinity ...rest Array as AS3 Boolean break case catch const continue Date decodeURI ' +
                'decodeURIComponent default delete do dynamic each else encodeURI encodeURIComponent escape ' +
                'extends false final finally flash_proxy for get if implements import in include Infinity ' +
                'instanceof int internal is isFinite isNaN isXMLName label namespace NaN native new null ' +
                'Null Number Object object_proxy override parseFloat parseInt private protected public ' +
                'return set static String super switch this throw true try typeof uint undefined unescape ' +
                'use void while with'
            ;

        this.regexList = [
            { regex: SyntaxHighlighter.regexLib.singleLineCComments,	css: 'comments' },		// one line comments
            { regex: SyntaxHighlighter.regexLib.multiLineCComments,		css: 'comments' },		// multiline comments
            { regex: SyntaxHighlighter.regexLib.doubleQuotedString,		css: 'string' },		// double quoted strings
            { regex: SyntaxHighlighter.regexLib.singleQuotedString,		css: 'string' },		// single quoted strings
            { regex: /\b([\d]+(\.[\d]+)?|0x[a-f0-9]+)\b/gi,				css: 'value' },			// numbers
            { regex: new RegExp(this.getKeywords(inits), 'gm'),			css: 'color3' },		// initializations
            { regex: new RegExp(this.getKeywords(keywords), 'gm'),		css: 'keyword' },		// keywords
            { regex: new RegExp('var', 'gm'),							css: 'variable' },		// variable
            { regex: new RegExp('trace', 'gm'),							css: 'color1' }			// trace
        ];

        this.forHtmlScript(SyntaxHighlighter.regexLib.scriptScriptTags);
    };

    Brush.prototype	= new SyntaxHighlighter.Highlighter();
    Brush.aliases	= ['actionscript3', 'as3'];

    SyntaxHighlighter.brushes.AS3 = Brush;

    // CommonJS
    typeof(exports) != 'undefined' ? exports.Brush = Brush : null;
})();

;(function()
{
    // CommonJS
    SyntaxHighlighter = SyntaxHighlighter || (typeof require !== 'undefined'? require('shCore').SyntaxHighlighter : null);

    function Brush()
    {
        // AppleScript brush by David Chambers
        // http://davidchambersdesign.com/
        var keywords   = 'after before beginning continue copy each end every from return get global in local named of set some that the then times to where whose with without';
        var ordinals   = 'first second third fourth fifth sixth seventh eighth ninth tenth last front back middle';
        var specials   = 'activate add alias AppleScript ask attachment boolean class constant delete duplicate empty exists false id integer list make message modal modified new no paragraph pi properties quit real record remove rest result reveal reverse run running save string true word yes';

        this.regexList = [

            { regex: /(--|#).*$/gm,
                css: 'comments' },

            { regex: /\(\*(?:[\s\S]*?\(\*[\s\S]*?\*\))*[\s\S]*?\*\)/gm, // support nested comments
                css: 'comments' },

            { regex: /"[\s\S]*?"/gm,
                css: 'string' },

            { regex: /(?:,|:|¬|'s\b|\(|\)|\{|\}|«|\b\w*»)/g,
                css: 'color1' },

            { regex: /(-)?(\d)+(\.(\d)?)?(E\+(\d)+)?/g, // numbers
                css: 'color1' },

            { regex: /(?:&(amp;|gt;|lt;)?|=|� |>|<|≥|>=|≤|<=|\*|\+|-|\/|÷|\^)/g,
                css: 'color2' },

            { regex: /\b(?:and|as|div|mod|not|or|return(?!\s&)(ing)?|equals|(is(n't| not)? )?equal( to)?|does(n't| not) equal|(is(n't| not)? )?(greater|less) than( or equal( to)?)?|(comes|does(n't| not) come) (after|before)|is(n't| not)?( in)? (back|front) of|is(n't| not)? behind|is(n't| not)?( (in|contained by))?|does(n't| not) contain|contain(s)?|(start|begin|end)(s)? with|((but|end) )?(consider|ignor)ing|prop(erty)?|(a )?ref(erence)?( to)?|repeat (until|while|with)|((end|exit) )?repeat|((else|end) )?if|else|(end )?(script|tell|try)|(on )?error|(put )?into|(of )?(it|me)|its|my|with (timeout( of)?|transaction)|end (timeout|transaction))\b/g,
                css: 'keyword' },

            { regex: /\b\d+(st|nd|rd|th)\b/g, // ordinals
                css: 'keyword' },

            { regex: /\b(?:about|above|against|around|at|below|beneath|beside|between|by|(apart|aside) from|(instead|out) of|into|on(to)?|over|since|thr(ough|u)|under)\b/g,
                css: 'color3' },

            { regex: /\b(?:adding folder items to|after receiving|choose( ((remote )?application|color|folder|from list|URL))?|clipboard info|set the clipboard to|(the )?clipboard|entire contents|display(ing| (alert|dialog|mode))?|document( (edited|file|nib name))?|file( (name|type))?|(info )?for|giving up after|(name )?extension|quoted form|return(ed)?|second(?! item)(s)?|list (disks|folder)|text item(s| delimiters)?|(Unicode )?text|(disk )?item(s)?|((current|list) )?view|((container|key) )?window|with (data|icon( (caution|note|stop))?|parameter(s)?|prompt|properties|seed|title)|case|diacriticals|hyphens|numeric strings|punctuation|white space|folder creation|application(s( folder)?| (processes|scripts position|support))?|((desktop )?(pictures )?|(documents|downloads|favorites|home|keychain|library|movies|music|public|scripts|sites|system|users|utilities|workflows) )folder|desktop|Folder Action scripts|font(s| panel)?|help|internet plugins|modem scripts|(system )?preferences|printer descriptions|scripting (additions|components)|shared (documents|libraries)|startup (disk|items)|temporary items|trash|on server|in AppleTalk zone|((as|long|short) )?user name|user (ID|locale)|(with )?password|in (bundle( with identifier)?|directory)|(close|open for) access|read|write( permission)?|(g|s)et eof|using( delimiters)?|starting at|default (answer|button|color|country code|entr(y|ies)|identifiers|items|name|location|script editor)|hidden( answer)?|open(ed| (location|untitled))?|error (handling|reporting)|(do( shell)?|load|run|store) script|administrator privileges|altering line endings|get volume settings|(alert|boot|input|mount|output|set) volume|output muted|(fax|random )?number|round(ing)?|up|down|toward zero|to nearest|as taught in school|system (attribute|info)|((AppleScript( Studio)?|system) )?version|(home )?directory|(IPv4|primary Ethernet) address|CPU (type|speed)|physical memory|time (stamp|to GMT)|replacing|ASCII (character|number)|localized string|from table|offset|summarize|beep|delay|say|(empty|multiple) selections allowed|(of|preferred) type|invisibles|showing( package contents)?|editable URL|(File|FTP|News|Media|Web) [Ss]ervers|Telnet hosts|Directory services|Remote applications|waiting until completion|saving( (in|to))?|path (for|to( (((current|frontmost) )?application|resource))?)|POSIX (file|path)|(background|RGB) color|(OK|cancel) button name|cancel button|button(s)?|cubic ((centi)?met(re|er)s|yards|feet|inches)|square ((kilo)?met(re|er)s|miles|yards|feet)|(centi|kilo)?met(re|er)s|miles|yards|feet|inches|lit(re|er)s|gallons|quarts|(kilo)?grams|ounces|pounds|degrees (Celsius|Fahrenheit|Kelvin)|print( (dialog|settings))?|clos(e(able)?|ing)|(de)?miniaturized|miniaturizable|zoom(ed|able)|attribute run|action (method|property|title)|phone|email|((start|end)ing|home) page|((birth|creation|current|custom|modification) )?date|((((phonetic )?(first|last|middle))|computer|host|maiden|related) |nick)?name|aim|icq|jabber|msn|yahoo|address(es)?|save addressbook|should enable action|city|country( code)?|formatte(r|d address)|(palette )?label|state|street|zip|AIM [Hh]andle(s)?|my card|select(ion| all)?|unsaved|(alpha )?value|entr(y|ies)|group|(ICQ|Jabber|MSN) handle|person|people|company|department|icon image|job title|note|organization|suffix|vcard|url|copies|collating|pages (across|down)|request print time|target( printer)?|((GUI Scripting|Script menu) )?enabled|show Computer scripts|(de)?activated|awake from nib|became (key|main)|call method|of (class|object)|center|clicked toolbar item|closed|for document|exposed|(can )?hide|idle|keyboard (down|up)|event( (number|type))?|launch(ed)?|load (image|movie|nib|sound)|owner|log|mouse (down|dragged|entered|exited|moved|up)|move|column|localization|resource|script|register|drag (info|types)|resigned (active|key|main)|resiz(e(d)?|able)|right mouse (down|dragged|up)|scroll wheel|(at )?index|should (close|open( untitled)?|quit( after last window closed)?|zoom)|((proposed|screen) )?bounds|show(n)?|behind|in front of|size (mode|to fit)|update(d| toolbar item)?|was (hidden|miniaturized)|will (become active|close|finish launching|hide|miniaturize|move|open|quit|(resign )?active|((maximum|minimum|proposed) )?size|show|zoom)|bundle|data source|movie|pasteboard|sound|tool(bar| tip)|(color|open|save) panel|coordinate system|frontmost|main( (bundle|menu|window))?|((services|(excluded from )?windows) )?menu|((executable|frameworks|resource|scripts|shared (frameworks|support)) )?path|(selected item )?identifier|data|content(s| view)?|character(s)?|click count|(command|control|option|shift) key down|context|delta (x|y|z)|key( code)?|location|pressure|unmodified characters|types|(first )?responder|playing|(allowed|selectable) identifiers|allows customization|(auto saves )?configuration|visible|image( name)?|menu form representation|tag|user(-| )defaults|associated file name|(auto|needs) display|current field editor|floating|has (resize indicator|shadow)|hides when deactivated|level|minimized (image|title)|opaque|position|release when closed|sheet|title(d)?)\b/g,
                css: 'color3' },

            { regex: new RegExp(this.getKeywords(specials), 'gm'), css: 'color3' },
            { regex: new RegExp(this.getKeywords(keywords), 'gm'), css: 'keyword' },
            { regex: new RegExp(this.getKeywords(ordinals), 'gm'), css: 'keyword' }
        ];
    };

    Brush.prototype = new SyntaxHighlighter.Highlighter();
    Brush.aliases = ['applescript'];

    SyntaxHighlighter.brushes.AppleScript = Brush;

    // CommonJS
    typeof(exports) != 'undefined' ? exports.Brush = Brush : null;
})();
;(function()
{
	// CommonJS
	SyntaxHighlighter = SyntaxHighlighter || (typeof require !== 'undefined'? require('shCore').SyntaxHighlighter : null);

	function Brush()
	{
		var keywords =	'if fi then elif else for do done until while break continue case esac function return in eq ne ge le';
		var commands =  'alias apropos awk basename bash bc bg builtin bzip2 cal cat cd cfdisk chgrp chmod chown chroot' +
						'cksum clear cmp comm command cp cron crontab csplit cut date dc dd ddrescue declare df ' +
						'diff diff3 dig dir dircolors dirname dirs du echo egrep eject enable env ethtool eval ' +
						'exec exit expand export expr false fdformat fdisk fg fgrep file find fmt fold format ' +
						'free fsck ftp gawk getopts grep groups gzip hash head history hostname id ifconfig ' +
						'import install join kill less let ln local locate logname logout look lpc lpr lprint ' +
						'lprintd lprintq lprm ls lsof make man mkdir mkfifo mkisofs mknod more mount mtools ' +
						'mv netstat nice nl nohup nslookup open op passwd paste pathchk ping popd pr printcap ' +
						'printenv printf ps pushd pwd quota quotacheck quotactl ram rcp read readonly renice ' +
						'remsync rm rmdir rsync screen scp sdiff sed select seq set sftp shift shopt shutdown ' +
						'sleep sort source split ssh strace su sudo sum symlink sync tail tar tee test time ' +
						'times touch top traceroute trap tr true tsort tty type ulimit umask umount unalias ' +
						'uname unexpand uniq units unset unshar useradd usermod users uuencode uudecode v vdir ' +
						'vi watch wc whereis which who whoami Wget xargs yes'
						;

		this.regexList = [
			{ regex: /^#!.*$/gm,											css: 'preprocessor bold' },
			{ regex: /\/[\w-\/]+/gm,										css: 'plain' },
			{ regex: SyntaxHighlighter.regexLib.singleLinePerlComments,		css: 'comments' },		// one line comments
			{ regex: SyntaxHighlighter.regexLib.doubleQuotedString,			css: 'string' },		// double quoted strings
			{ regex: SyntaxHighlighter.regexLib.singleQuotedString,			css: 'string' },		// single quoted strings
			{ regex: new RegExp(this.getKeywords(keywords), 'gm'),			css: 'keyword' },		// keywords
			{ regex: new RegExp(this.getKeywords(commands), 'gm'),			css: 'functions' }		// commands
			];
	}

	Brush.prototype	= new SyntaxHighlighter.Highlighter();
	Brush.aliases	= ['bash', 'shell', 'sh'];

	SyntaxHighlighter.brushes.Bash = Brush;

	// CommonJS
	typeof(exports) != 'undefined' ? exports.Brush = Brush : null;
})();
;(function()
{
	// CommonJS
	SyntaxHighlighter = SyntaxHighlighter || (typeof require !== 'undefined'? require('shCore').SyntaxHighlighter : null);

	function Brush()
	{
		// Contributed by Jen
		// http://www.jensbits.com/2009/05/14/coldfusion-brush-for-syntaxhighlighter-plus
	
		var funcs	=	'Abs ACos AddSOAPRequestHeader AddSOAPResponseHeader AjaxLink AjaxOnLoad ArrayAppend ArrayAvg ArrayClear ArrayDeleteAt ' + 
						'ArrayInsertAt ArrayIsDefined ArrayIsEmpty ArrayLen ArrayMax ArrayMin ArraySet ArraySort ArraySum ArraySwap ArrayToList ' + 
						'Asc ASin Atn BinaryDecode BinaryEncode BitAnd BitMaskClear BitMaskRead BitMaskSet BitNot BitOr BitSHLN BitSHRN BitXor ' + 
						'Ceiling CharsetDecode CharsetEncode Chr CJustify Compare CompareNoCase Cos CreateDate CreateDateTime CreateObject ' + 
						'CreateODBCDate CreateODBCDateTime CreateODBCTime CreateTime CreateTimeSpan CreateUUID DateAdd DateCompare DateConvert ' + 
						'DateDiff DateFormat DatePart Day DayOfWeek DayOfWeekAsString DayOfYear DaysInMonth DaysInYear DE DecimalFormat DecrementValue ' + 
						'Decrypt DecryptBinary DeleteClientVariable DeserializeJSON DirectoryExists DollarFormat DotNetToCFType Duplicate Encrypt ' + 
						'EncryptBinary Evaluate Exp ExpandPath FileClose FileCopy FileDelete FileExists FileIsEOF FileMove FileOpen FileRead ' + 
						'FileReadBinary FileReadLine FileSetAccessMode FileSetAttribute FileSetLastModified FileWrite Find FindNoCase FindOneOf ' + 
						'FirstDayOfMonth Fix FormatBaseN GenerateSecretKey GetAuthUser GetBaseTagData GetBaseTagList GetBaseTemplatePath ' + 
						'GetClientVariablesList GetComponentMetaData GetContextRoot GetCurrentTemplatePath GetDirectoryFromPath GetEncoding ' + 
						'GetException GetFileFromPath GetFileInfo GetFunctionList GetGatewayHelper GetHttpRequestData GetHttpTimeString ' + 
						'GetK2ServerDocCount GetK2ServerDocCountLimit GetLocale GetLocaleDisplayName GetLocalHostIP GetMetaData GetMetricData ' + 
						'GetPageContext GetPrinterInfo GetProfileSections GetProfileString GetReadableImageFormats GetSOAPRequest GetSOAPRequestHeader ' + 
						'GetSOAPResponse GetSOAPResponseHeader GetTempDirectory GetTempFile GetTemplatePath GetTickCount GetTimeZoneInfo GetToken ' + 
						'GetUserRoles GetWriteableImageFormats Hash Hour HTMLCodeFormat HTMLEditFormat IIf ImageAddBorder ImageBlur ImageClearRect ' + 
						'ImageCopy ImageCrop ImageDrawArc ImageDrawBeveledRect ImageDrawCubicCurve ImageDrawLine ImageDrawLines ImageDrawOval ' + 
						'ImageDrawPoint ImageDrawQuadraticCurve ImageDrawRect ImageDrawRoundRect ImageDrawText ImageFlip ImageGetBlob ImageGetBufferedImage ' + 
						'ImageGetEXIFTag ImageGetHeight ImageGetIPTCTag ImageGetWidth ImageGrayscale ImageInfo ImageNegative ImageNew ImageOverlay ImagePaste ' + 
						'ImageRead ImageReadBase64 ImageResize ImageRotate ImageRotateDrawingAxis ImageScaleToFit ImageSetAntialiasing ImageSetBackgroundColor ' + 
						'ImageSetDrawingColor ImageSetDrawingStroke ImageSetDrawingTransparency ImageSharpen ImageShear ImageShearDrawingAxis ImageTranslate ' + 
						'ImageTranslateDrawingAxis ImageWrite ImageWriteBase64 ImageXORDrawingMode IncrementValue InputBaseN Insert Int IsArray IsBinary ' + 
						'IsBoolean IsCustomFunction IsDate IsDDX IsDebugMode IsDefined IsImage IsImageFile IsInstanceOf IsJSON IsLeapYear IsLocalHost ' + 
						'IsNumeric IsNumericDate IsObject IsPDFFile IsPDFObject IsQuery IsSimpleValue IsSOAPRequest IsStruct IsUserInAnyRole IsUserInRole ' + 
						'IsUserLoggedIn IsValid IsWDDX IsXML IsXmlAttribute IsXmlDoc IsXmlElem IsXmlNode IsXmlRoot JavaCast JSStringFormat LCase Left Len ' + 
						'ListAppend ListChangeDelims ListContains ListContainsNoCase ListDeleteAt ListFind ListFindNoCase ListFirst ListGetAt ListInsertAt ' + 
						'ListLast ListLen ListPrepend ListQualify ListRest ListSetAt ListSort ListToArray ListValueCount ListValueCountNoCase LJustify Log ' + 
						'Log10 LSCurrencyFormat LSDateFormat LSEuroCurrencyFormat LSIsCurrency LSIsDate LSIsNumeric LSNumberFormat LSParseCurrency LSParseDateTime ' + 
						'LSParseEuroCurrency LSParseNumber LSTimeFormat LTrim Max Mid Min Minute Month MonthAsString Now NumberFormat ParagraphFormat ParseDateTime ' + 
						'Pi PrecisionEvaluate PreserveSingleQuotes Quarter QueryAddColumn QueryAddRow QueryConvertForGrid QueryNew QuerySetCell QuotedValueList Rand ' + 
						'Randomize RandRange REFind REFindNoCase ReleaseComObject REMatch REMatchNoCase RemoveChars RepeatString Replace ReplaceList ReplaceNoCase ' + 
						'REReplace REReplaceNoCase Reverse Right RJustify Round RTrim Second SendGatewayMessage SerializeJSON SetEncoding SetLocale SetProfileString ' + 
						'SetVariable Sgn Sin Sleep SpanExcluding SpanIncluding Sqr StripCR StructAppend StructClear StructCopy StructCount StructDelete StructFind ' + 
						'StructFindKey StructFindValue StructGet StructInsert StructIsEmpty StructKeyArray StructKeyExists StructKeyList StructKeyList StructNew ' + 
						'StructSort StructUpdate Tan TimeFormat ToBase64 ToBinary ToScript ToString Trim UCase URLDecode URLEncodedFormat URLSessionFormat Val ' + 
						'ValueList VerifyClient Week Wrap Wrap WriteOutput XmlChildPos XmlElemNew XmlFormat XmlGetNodeType XmlNew XmlParse XmlSearch XmlTransform ' + 
						'XmlValidate Year YesNoFormat';

		var keywords =	'cfabort cfajaximport cfajaxproxy cfapplet cfapplication cfargument cfassociate cfbreak cfcache cfcalendar ' + 
						'cfcase cfcatch cfchart cfchartdata cfchartseries cfcol cfcollection cfcomponent cfcontent cfcookie cfdbinfo ' + 
						'cfdefaultcase cfdirectory cfdiv cfdocument cfdocumentitem cfdocumentsection cfdump cfelse cfelseif cferror ' + 
						'cfexchangecalendar cfexchangeconnection cfexchangecontact cfexchangefilter cfexchangemail cfexchangetask ' + 
						'cfexecute cfexit cffeed cffile cfflush cfform cfformgroup cfformitem cfftp cffunction cfgrid cfgridcolumn ' + 
						'cfgridrow cfgridupdate cfheader cfhtmlhead cfhttp cfhttpparam cfif cfimage cfimport cfinclude cfindex ' + 
						'cfinput cfinsert cfinterface cfinvoke cfinvokeargument cflayout cflayoutarea cfldap cflocation cflock cflog ' + 
						'cflogin cfloginuser cflogout cfloop cfmail cfmailparam cfmailpart cfmenu cfmenuitem cfmodule cfNTauthenticate ' + 
						'cfobject cfobjectcache cfoutput cfparam cfpdf cfpdfform cfpdfformparam cfpdfparam cfpdfsubform cfpod cfpop ' + 
						'cfpresentation cfpresentationslide cfpresenter cfprint cfprocessingdirective cfprocparam cfprocresult ' + 
						'cfproperty cfquery cfqueryparam cfregistry cfreport cfreportparam cfrethrow cfreturn cfsavecontent cfschedule ' + 
						'cfscript cfsearch cfselect cfset cfsetting cfsilent cfslider cfsprydataset cfstoredproc cfswitch cftable ' + 
						'cftextarea cfthread cfthrow cftimer cftooltip cftrace cftransaction cftree cftreeitem cftry cfupdate cfwddx ' + 
						'cfwindow cfxml cfzip cfzipparam';

		var operators =	'all and any between cross in join like not null or outer some';

		this.regexList = [
			{ regex: new RegExp('--(.*)$', 'gm'),						css: 'comments' },  // one line and multiline comments
			{ regex: SyntaxHighlighter.regexLib.xmlComments,			css: 'comments' },    // single quoted strings
			{ regex: SyntaxHighlighter.regexLib.doubleQuotedString,		css: 'string' },    // double quoted strings
			{ regex: SyntaxHighlighter.regexLib.singleQuotedString,		css: 'string' },    // single quoted strings
			{ regex: new RegExp(this.getKeywords(funcs), 'gmi'),		css: 'functions' }, // functions
			{ regex: new RegExp(this.getKeywords(operators), 'gmi'),	css: 'color1' },    // operators and such
			{ regex: new RegExp(this.getKeywords(keywords), 'gmi'),		css: 'keyword' }    // keyword
			];
	}

	Brush.prototype	= new SyntaxHighlighter.Highlighter();
	Brush.aliases	= ['coldfusion','cf'];
	
	SyntaxHighlighter.brushes.ColdFusion = Brush;

	// CommonJS
	typeof(exports) != 'undefined' ? exports.Brush = Brush : null;
})();
;(function()
{
	// CommonJS
	SyntaxHighlighter = SyntaxHighlighter || (typeof require !== 'undefined'? require('shCore').SyntaxHighlighter : null);

	function Brush()
	{
		// Copyright 2006 Shin, YoungJin
	
		var datatypes =	'ATOM BOOL BOOLEAN BYTE CHAR COLORREF DWORD DWORDLONG DWORD_PTR ' +
						'DWORD32 DWORD64 FLOAT HACCEL HALF_PTR HANDLE HBITMAP HBRUSH ' +
						'HCOLORSPACE HCONV HCONVLIST HCURSOR HDC HDDEDATA HDESK HDROP HDWP ' +
						'HENHMETAFILE HFILE HFONT HGDIOBJ HGLOBAL HHOOK HICON HINSTANCE HKEY ' +
						'HKL HLOCAL HMENU HMETAFILE HMODULE HMONITOR HPALETTE HPEN HRESULT ' +
						'HRGN HRSRC HSZ HWINSTA HWND INT INT_PTR INT32 INT64 LANGID LCID LCTYPE ' +
						'LGRPID LONG LONGLONG LONG_PTR LONG32 LONG64 LPARAM LPBOOL LPBYTE LPCOLORREF ' +
						'LPCSTR LPCTSTR LPCVOID LPCWSTR LPDWORD LPHANDLE LPINT LPLONG LPSTR LPTSTR ' +
						'LPVOID LPWORD LPWSTR LRESULT PBOOL PBOOLEAN PBYTE PCHAR PCSTR PCTSTR PCWSTR ' +
						'PDWORDLONG PDWORD_PTR PDWORD32 PDWORD64 PFLOAT PHALF_PTR PHANDLE PHKEY PINT ' +
						'PINT_PTR PINT32 PINT64 PLCID PLONG PLONGLONG PLONG_PTR PLONG32 PLONG64 POINTER_32 ' +
						'POINTER_64 PSHORT PSIZE_T PSSIZE_T PSTR PTBYTE PTCHAR PTSTR PUCHAR PUHALF_PTR ' +
						'PUINT PUINT_PTR PUINT32 PUINT64 PULONG PULONGLONG PULONG_PTR PULONG32 PULONG64 ' +
						'PUSHORT PVOID PWCHAR PWORD PWSTR SC_HANDLE SC_LOCK SERVICE_STATUS_HANDLE SHORT ' +
						'SIZE_T SSIZE_T TBYTE TCHAR UCHAR UHALF_PTR UINT UINT_PTR UINT32 UINT64 ULONG ' +
						'ULONGLONG ULONG_PTR ULONG32 ULONG64 USHORT USN VOID WCHAR WORD WPARAM WPARAM WPARAM ' +
						'char bool short int __int32 __int64 __int8 __int16 long float double __wchar_t ' +
						'clock_t _complex _dev_t _diskfree_t div_t ldiv_t _exception _EXCEPTION_POINTERS ' +
						'FILE _finddata_t _finddatai64_t _wfinddata_t _wfinddatai64_t __finddata64_t ' +
						'__wfinddata64_t _FPIEEE_RECORD fpos_t _HEAPINFO _HFILE lconv intptr_t ' +
						'jmp_buf mbstate_t _off_t _onexit_t _PNH ptrdiff_t _purecall_handler ' +
						'sig_atomic_t size_t _stat __stat64 _stati64 terminate_function ' +
						'time_t __time64_t _timeb __timeb64 tm uintptr_t _utimbuf ' +
						'va_list wchar_t wctrans_t wctype_t wint_t signed';

		var keywords =	'auto break case catch class const decltype __finally __exception __try ' +
						'const_cast continue private public protected __declspec ' +
						'default delete deprecated dllexport dllimport do dynamic_cast ' +
						'else enum explicit extern if for friend goto inline ' +
						'mutable naked namespace new noinline noreturn nothrow ' +
						'register reinterpret_cast return selectany ' +
						'sizeof static static_cast struct switch template this ' +
						'thread throw true false try typedef typeid typename union ' +
						'using uuid virtual void volatile whcar_t while';
					
		var functions =	'assert isalnum isalpha iscntrl isdigit isgraph islower isprint' +
						'ispunct isspace isupper isxdigit tolower toupper errno localeconv ' +
						'setlocale acos asin atan atan2 ceil cos cosh exp fabs floor fmod ' +
						'frexp ldexp log log10 modf pow sin sinh sqrt tan tanh jmp_buf ' +
						'longjmp setjmp raise signal sig_atomic_t va_arg va_end va_start ' +
						'clearerr fclose feof ferror fflush fgetc fgetpos fgets fopen ' +
						'fprintf fputc fputs fread freopen fscanf fseek fsetpos ftell ' +
						'fwrite getc getchar gets perror printf putc putchar puts remove ' +
						'rename rewind scanf setbuf setvbuf sprintf sscanf tmpfile tmpnam ' +
						'ungetc vfprintf vprintf vsprintf abort abs atexit atof atoi atol ' +
						'bsearch calloc div exit free getenv labs ldiv malloc mblen mbstowcs ' +
						'mbtowc qsort rand realloc srand strtod strtol strtoul system ' +
						'wcstombs wctomb memchr memcmp memcpy memmove memset strcat strchr ' +
						'strcmp strcoll strcpy strcspn strerror strlen strncat strncmp ' +
						'strncpy strpbrk strrchr strspn strstr strtok strxfrm asctime ' +
						'clock ctime difftime gmtime localtime mktime strftime time';

		this.regexList = [
			{ regex: SyntaxHighlighter.regexLib.singleLineCComments,	css: 'comments' },			// one line comments
			{ regex: SyntaxHighlighter.regexLib.multiLineCComments,		css: 'comments' },			// multiline comments
			{ regex: SyntaxHighlighter.regexLib.doubleQuotedString,		css: 'string' },			// strings
			{ regex: SyntaxHighlighter.regexLib.singleQuotedString,		css: 'string' },			// strings
			{ regex: /^ *#.*/gm,										css: 'preprocessor' },
			{ regex: new RegExp(this.getKeywords(datatypes), 'gm'),		css: 'color1 bold' },
			{ regex: new RegExp(this.getKeywords(functions), 'gm'),		css: 'functions bold' },
			{ regex: new RegExp(this.getKeywords(keywords), 'gm'),		css: 'keyword bold' }
			];
	};

	Brush.prototype	= new SyntaxHighlighter.Highlighter();
	Brush.aliases	= ['cpp', 'c'];

	SyntaxHighlighter.brushes.Cpp = Brush;

	// CommonJS
	typeof(exports) != 'undefined' ? exports.Brush = Brush : null;
})();
;(function()
{
	// CommonJS
	SyntaxHighlighter = SyntaxHighlighter || (typeof require !== 'undefined'? require('shCore').SyntaxHighlighter : null);

	function Brush()
	{
		var keywords =	'abstract as base bool break byte case catch char checked class const ' +
						'continue decimal default delegate do double else enum event explicit volatile ' +
						'extern false finally fixed float for foreach get goto if implicit in int ' +
						'interface internal is lock long namespace new null object operator out ' +
						'override params private protected public readonly ref return sbyte sealed set ' +
						'short sizeof stackalloc static string struct switch this throw true try ' +
						'typeof uint ulong unchecked unsafe ushort using virtual void while var ' +
						'from group by into select let where orderby join on equals ascending descending';

		function fixComments(match, regexInfo)
		{
			var css = (match[0].indexOf("///") == 0)
				? 'color1'
				: 'comments'
				;
			
			return [new SyntaxHighlighter.Match(match[0], match.index, css)];
		}

		this.regexList = [
			{ regex: SyntaxHighlighter.regexLib.singleLineCComments,	func : fixComments },		// one line comments
			{ regex: SyntaxHighlighter.regexLib.multiLineCComments,		css: 'comments' },			// multiline comments
			{ regex: /@"(?:[^"]|"")*"/g,								css: 'string' },			// @-quoted strings
			{ regex: SyntaxHighlighter.regexLib.doubleQuotedString,		css: 'string' },			// strings
			{ regex: SyntaxHighlighter.regexLib.singleQuotedString,		css: 'string' },			// strings
			{ regex: /^\s*#.*/gm,										css: 'preprocessor' },		// preprocessor tags like #region and #endregion
			{ regex: new RegExp(this.getKeywords(keywords), 'gm'),		css: 'keyword' },			// c# keyword
			{ regex: /\bpartial(?=\s+(?:class|interface|struct)\b)/g,	css: 'keyword' },			// contextual keyword: 'partial'
			{ regex: /\byield(?=\s+(?:return|break)\b)/g,				css: 'keyword' }			// contextual keyword: 'yield'
			];
		
		this.forHtmlScript(SyntaxHighlighter.regexLib.aspScriptTags);
	};

	Brush.prototype	= new SyntaxHighlighter.Highlighter();
	Brush.aliases	= ['c#', 'c-sharp', 'csharp'];

	SyntaxHighlighter.brushes.CSharp = Brush;

	// CommonJS
	typeof(exports) != 'undefined' ? exports.Brush = Brush : null;
})();
;(function()
{
	// CommonJS
	SyntaxHighlighter = SyntaxHighlighter || (typeof require !== 'undefined'? require('shCore').SyntaxHighlighter : null);

	function Brush()
	{
		function getKeywordsCSS(str)
		{
			return '\\b([a-z_]|)' + str.replace(/ /g, '(?=:)\\b|\\b([a-z_\\*]|\\*|)') + '(?=:)\\b';
		};
	
		function getValuesCSS(str)
		{
			return '\\b' + str.replace(/ /g, '(?!-)(?!:)\\b|\\b()') + '\:\\b';
		};

		var keywords =	'ascent azimuth background-attachment background-color background-image background-position ' +
						'background-repeat background baseline bbox border-collapse border-color border-spacing border-style border-top ' +
						'border-right border-bottom border-left border-top-color border-right-color border-bottom-color border-left-color ' +
						'border-top-style border-right-style border-bottom-style border-left-style border-top-width border-right-width ' +
						'border-bottom-width border-left-width border-width border bottom cap-height caption-side centerline clear clip color ' +
						'content counter-increment counter-reset cue-after cue-before cue cursor definition-src descent direction display ' +
						'elevation empty-cells float font-size-adjust font-family font-size font-stretch font-style font-variant font-weight font ' +
						'height left letter-spacing line-height list-style-image list-style-position list-style-type list-style margin-top ' +
						'margin-right margin-bottom margin-left margin marker-offset marks mathline max-height max-width min-height min-width orphans ' +
						'outline-color outline-style outline-width outline overflow padding-top padding-right padding-bottom padding-left padding page ' +
						'page-break-after page-break-before page-break-inside pause pause-after pause-before pitch pitch-range play-during position ' +
						'quotes right richness size slope src speak-header speak-numeral speak-punctuation speak speech-rate stemh stemv stress ' +
						'table-layout text-align top text-decoration text-indent text-shadow text-transform unicode-bidi unicode-range units-per-em ' +
						'vertical-align visibility voice-family volume white-space widows width widths word-spacing x-height z-index';

		var values =	'above absolute all always aqua armenian attr aural auto avoid baseline behind below bidi-override black blink block blue bold bolder '+
						'both bottom braille capitalize caption center center-left center-right circle close-quote code collapse compact condensed '+
						'continuous counter counters crop cross crosshair cursive dashed decimal decimal-leading-zero default digits disc dotted double '+
						'embed embossed e-resize expanded extra-condensed extra-expanded fantasy far-left far-right fast faster fixed format fuchsia '+
						'gray green groove handheld hebrew help hidden hide high higher icon inline-table inline inset inside invert italic '+
						'justify landscape large larger left-side left leftwards level lighter lime line-through list-item local loud lower-alpha '+
						'lowercase lower-greek lower-latin lower-roman lower low ltr marker maroon medium message-box middle mix move narrower '+
						'navy ne-resize no-close-quote none no-open-quote no-repeat normal nowrap n-resize nw-resize oblique olive once open-quote outset '+
						'outside overline pointer portrait pre print projection purple red relative repeat repeat-x repeat-y rgb ridge right right-side '+
						'rightwards rtl run-in screen scroll semi-condensed semi-expanded separate se-resize show silent silver slower slow '+
						'small small-caps small-caption smaller soft solid speech spell-out square s-resize static status-bar sub super sw-resize '+
						'table-caption table-cell table-column table-column-group table-footer-group table-header-group table-row table-row-group teal '+
						'text-bottom text-top thick thin top transparent tty tv ultra-condensed ultra-expanded underline upper-alpha uppercase upper-latin '+
						'upper-roman url visible wait white wider w-resize x-fast x-high x-large x-loud x-low x-slow x-small x-soft xx-large xx-small yellow';

		var fonts =		'[mM]onospace [tT]ahoma [vV]erdana [aA]rial [hH]elvetica [sS]ans-serif [sS]erif [cC]ourier mono sans serif';
	
		this.regexList = [
			{ regex: SyntaxHighlighter.regexLib.multiLineCComments,		css: 'comments' },	// multiline comments
			{ regex: SyntaxHighlighter.regexLib.doubleQuotedString,		css: 'string' },	// double quoted strings
			{ regex: SyntaxHighlighter.regexLib.singleQuotedString,		css: 'string' },	// single quoted strings
			{ regex: /\#[a-fA-F0-9]{3,6}/g,								css: 'value' },		// html colors
			{ regex: /(-?\d+)(\.\d+)?(px|em|pt|\:|\%|)/g,				css: 'value' },		// sizes
			{ regex: /!important/g,										css: 'color3' },	// !important
			{ regex: new RegExp(getKeywordsCSS(keywords), 'gm'),		css: 'keyword' },	// keywords
			{ regex: new RegExp(getValuesCSS(values), 'g'),				css: 'value' },		// values
			{ regex: new RegExp(this.getKeywords(fonts), 'g'),			css: 'color1' }		// fonts
			];

		this.forHtmlScript({ 
			left: /(&lt;|<)\s*style.*?(&gt;|>)/gi, 
			right: /(&lt;|<)\/\s*style\s*(&gt;|>)/gi 
			});
	};

	Brush.prototype	= new SyntaxHighlighter.Highlighter();
	Brush.aliases	= ['css'];

	SyntaxHighlighter.brushes.CSS = Brush;

	// CommonJS
	typeof(exports) != 'undefined' ? exports.Brush = Brush : null;
})();
;(function()
{
	// CommonJS
	SyntaxHighlighter = SyntaxHighlighter || (typeof require !== 'undefined'? require('shCore').SyntaxHighlighter : null);

	function Brush()
	{
		var keywords =	'abs addr and ansichar ansistring array as asm begin boolean byte cardinal ' +
						'case char class comp const constructor currency destructor div do double ' +
						'downto else end except exports extended false file finalization finally ' +
						'for function goto if implementation in inherited int64 initialization ' +
						'integer interface is label library longint longword mod nil not object ' +
						'of on or packed pansichar pansistring pchar pcurrency pdatetime pextended ' +
						'pint64 pointer private procedure program property pshortstring pstring ' +
						'pvariant pwidechar pwidestring protected public published raise real real48 ' +
						'record repeat set shl shortint shortstring shr single smallint string then ' +
						'threadvar to true try type unit until uses val var varirnt while widechar ' +
						'widestring with word write writeln xor';

		this.regexList = [
			{ regex: /\(\*[\s\S]*?\*\)/gm,								css: 'comments' },  	// multiline comments (* *)
			{ regex: /{(?!\$)[\s\S]*?}/gm,								css: 'comments' },  	// multiline comments { }
			{ regex: SyntaxHighlighter.regexLib.singleLineCComments,	css: 'comments' },  	// one line
			{ regex: SyntaxHighlighter.regexLib.singleQuotedString,		css: 'string' },		// strings
			{ regex: /\{\$[a-zA-Z]+ .+\}/g,								css: 'color1' },		// compiler Directives and Region tags
			{ regex: /\b[\d\.]+\b/g,									css: 'value' },			// numbers 12345
			{ regex: /\$[a-zA-Z0-9]+\b/g,								css: 'value' },			// numbers $F5D3
			{ regex: new RegExp(this.getKeywords(keywords), 'gmi'),		css: 'keyword' }		// keyword
			];
	};

	Brush.prototype	= new SyntaxHighlighter.Highlighter();
	Brush.aliases	= ['delphi', 'pascal', 'pas'];

	SyntaxHighlighter.brushes.Delphi = Brush;

	// CommonJS
	typeof(exports) != 'undefined' ? exports.Brush = Brush : null;
})();
;(function()
{
	// CommonJS
	SyntaxHighlighter = SyntaxHighlighter || (typeof require !== 'undefined'? require('shCore').SyntaxHighlighter : null);

	function Brush()
	{
		this.regexList = [
			{ regex: /^\+\+\+ .*$/gm,	css: 'color2' },	// new file
			{ regex: /^\-\-\- .*$/gm,	css: 'color2' },	// old file
			{ regex: /^\s.*$/gm,		css: 'color1' },	// unchanged
			{ regex: /^@@.*@@.*$/gm,	css: 'variable' },	// location
			{ regex: /^\+.*$/gm,		css: 'string' },	// additions
			{ regex: /^\-.*$/gm,		css: 'color3' }		// deletions
			];
	};

	Brush.prototype	= new SyntaxHighlighter.Highlighter();
	Brush.aliases	= ['diff', 'patch'];

	SyntaxHighlighter.brushes.Diff = Brush;

	// CommonJS
	typeof(exports) != 'undefined' ? exports.Brush = Brush : null;
})();
;(function()
{
	// CommonJS
	SyntaxHighlighter = SyntaxHighlighter || (typeof require !== 'undefined'? require('shCore').SyntaxHighlighter : null);

	function Brush()
	{
		// Contributed by Jean-Lou Dupont
		// http://jldupont.blogspot.com/2009/06/erlang-syntax-highlighter.html  

		// According to: http://erlang.org/doc/reference_manual/introduction.html#1.5
		var keywords = 'after and andalso band begin bnot bor bsl bsr bxor '+
			'case catch cond div end fun if let not of or orelse '+
			'query receive rem try when xor'+
			// additional
			' module export import define';

		this.regexList = [
			{ regex: new RegExp("[A-Z][A-Za-z0-9_]+", 'g'), 			css: 'constants' },
			{ regex: new RegExp("\\%.+", 'gm'), 						css: 'comments' },
			{ regex: new RegExp("\\?[A-Za-z0-9_]+", 'g'), 				css: 'preprocessor' },
			{ regex: new RegExp("[a-z0-9_]+:[a-z0-9_]+", 'g'), 			css: 'functions' },
			{ regex: SyntaxHighlighter.regexLib.doubleQuotedString,		css: 'string' },
			{ regex: SyntaxHighlighter.regexLib.singleQuotedString,		css: 'string' },
			{ regex: new RegExp(this.getKeywords(keywords),	'gm'),		css: 'keyword' }
			];
	};

	Brush.prototype	= new SyntaxHighlighter.Highlighter();
	Brush.aliases	= ['erl', 'erlang'];

	SyntaxHighlighter.brushes.Erland = Brush;

	// CommonJS
	typeof(exports) != 'undefined' ? exports.Brush = Brush : null;
})();
;(function()
{
	// CommonJS
	SyntaxHighlighter = SyntaxHighlighter || (typeof require !== 'undefined'? require('shCore').SyntaxHighlighter : null);

	function Brush()
	{
		// Contributed by Andres Almiray
		// http://jroller.com/aalmiray/entry/nice_source_code_syntax_highlighter

		var keywords =	'as assert break case catch class continue def default do else extends finally ' +
						'if in implements import instanceof interface new package property return switch ' +
						'throw throws try while public protected private static';
		var types    =  'void boolean byte char short int long float double';
		var constants = 'null';
		var methods   = 'allProperties count get size '+
						'collect each eachProperty eachPropertyName eachWithIndex find findAll ' +
						'findIndexOf grep inject max min reverseEach sort ' +
						'asImmutable asSynchronized flatten intersect join pop reverse subMap toList ' +
						'padRight padLeft contains eachMatch toCharacter toLong toUrl tokenize ' +
						'eachFile eachFileRecurse eachB yte eachLine readBytes readLine getText ' +
						'splitEachLine withReader append encodeBase64 decodeBase64 filterLine ' +
						'transformChar transformLine withOutputStream withPrintWriter withStream ' +
						'withStreams withWriter withWriterAppend write writeLine '+
						'dump inspect invokeMethod print println step times upto use waitForOrKill '+
						'getText';

		this.regexList = [
			{ regex: SyntaxHighlighter.regexLib.singleLineCComments,				css: 'comments' },		// one line comments
			{ regex: SyntaxHighlighter.regexLib.multiLineCComments,					css: 'comments' },		// multiline comments
			{ regex: SyntaxHighlighter.regexLib.doubleQuotedString,					css: 'string' },		// strings
			{ regex: SyntaxHighlighter.regexLib.singleQuotedString,					css: 'string' },		// strings
			{ regex: /""".*"""/g,													css: 'string' },		// GStrings
			{ regex: new RegExp('\\b([\\d]+(\\.[\\d]+)?|0x[a-f0-9]+)\\b', 'gi'),	css: 'value' },			// numbers
			{ regex: new RegExp(this.getKeywords(keywords), 'gm'),					css: 'keyword' },		// goovy keyword
			{ regex: new RegExp(this.getKeywords(types), 'gm'),						css: 'color1' },		// goovy/java type
			{ regex: new RegExp(this.getKeywords(constants), 'gm'),					css: 'constants' },		// constants
			{ regex: new RegExp(this.getKeywords(methods), 'gm'),					css: 'functions' }		// methods
			];

		this.forHtmlScript(SyntaxHighlighter.regexLib.aspScriptTags);
	}

	Brush.prototype	= new SyntaxHighlighter.Highlighter();
	Brush.aliases	= ['groovy'];

	SyntaxHighlighter.brushes.Groovy = Brush;

	// CommonJS
	typeof(exports) != 'undefined' ? exports.Brush = Brush : null;
})();
;(function()
{
	// CommonJS
	SyntaxHighlighter = SyntaxHighlighter || (typeof require !== 'undefined'? require('shCore').SyntaxHighlighter : null);

	function Brush()
	{
		var keywords =	'abstract assert boolean break byte case catch char class const ' +
						'continue default do double else enum extends ' +
						'false final finally float for goto if implements import ' +
						'instanceof int interface long native new null ' +
						'package private protected public return ' +
						'short static strictfp super switch synchronized this throw throws true ' +
						'transient try void volatile while';

		this.regexList = [
			{ regex: SyntaxHighlighter.regexLib.singleLineCComments,	css: 'comments' },		// one line comments
			{ regex: /\/\*([^\*][\s\S]*)?\*\//gm,						css: 'comments' },	 	// multiline comments
			{ regex: /\/\*(?!\*\/)\*[\s\S]*?\*\//gm,					css: 'preprocessor' },	// documentation comments
			{ regex: SyntaxHighlighter.regexLib.doubleQuotedString,		css: 'string' },		// strings
			{ regex: SyntaxHighlighter.regexLib.singleQuotedString,		css: 'string' },		// strings
			{ regex: /\b([\d]+(\.[\d]+)?|0x[a-f0-9]+)\b/gi,				css: 'value' },			// numbers
			{ regex: /(?!\@interface\b)\@[\$\w]+\b/g,					css: 'color1' },		// annotation @anno
			{ regex: /\@interface\b/g,									css: 'color2' },		// @interface keyword
			{ regex: new RegExp(this.getKeywords(keywords), 'gm'),		css: 'keyword' }		// java keyword
			];

		this.forHtmlScript({
			left	: /(&lt;|<)%[@!=]?/g, 
			right	: /%(&gt;|>)/g 
		});
	};

	Brush.prototype	= new SyntaxHighlighter.Highlighter();
	Brush.aliases	= ['java'];

	SyntaxHighlighter.brushes.Java = Brush;

	// CommonJS
	typeof(exports) != 'undefined' ? exports.Brush = Brush : null;
})();
;(function()
{
	// CommonJS
	SyntaxHighlighter = SyntaxHighlighter || (typeof require !== 'undefined'? require('shCore').SyntaxHighlighter : null);

	function Brush()
	{
		// Contributed by Patrick Webster
		// http://patrickwebster.blogspot.com/2009/04/javafx-brush-for-syntaxhighlighter.html
		var datatypes =	'Boolean Byte Character Double Duration '
						+ 'Float Integer Long Number Short String Void'
						;

		var keywords = 'abstract after and as assert at before bind bound break catch class '
						+ 'continue def delete else exclusive extends false finally first for from '
						+ 'function if import in indexof init insert instanceof into inverse last '
						+ 'lazy mixin mod nativearray new not null on or override package postinit '
						+ 'protected public public-init public-read replace return reverse sizeof '
						+ 'step super then this throw true try tween typeof var where while with '
						+ 'attribute let private readonly static trigger'
						;

		this.regexList = [
			{ regex: SyntaxHighlighter.regexLib.singleLineCComments,	css: 'comments' },
			{ regex: SyntaxHighlighter.regexLib.multiLineCComments,		css: 'comments' },
			{ regex: SyntaxHighlighter.regexLib.singleQuotedString,		css: 'string' },
			{ regex: SyntaxHighlighter.regexLib.doubleQuotedString,		css: 'string' },
			{ regex: /(-?\.?)(\b(\d*\.?\d+|\d+\.?\d*)(e[+-]?\d+)?|0x[a-f\d]+)\b\.?/gi, css: 'color2' },	// numbers
			{ regex: new RegExp(this.getKeywords(datatypes), 'gm'),		css: 'variable' },	// datatypes
			{ regex: new RegExp(this.getKeywords(keywords), 'gm'),		css: 'keyword' }
		];
		this.forHtmlScript(SyntaxHighlighter.regexLib.aspScriptTags);
	};

	Brush.prototype	= new SyntaxHighlighter.Highlighter();
	Brush.aliases	= ['jfx', 'javafx'];

	SyntaxHighlighter.brushes.JavaFX = Brush;

	// CommonJS
	typeof(exports) != 'undefined' ? exports.Brush = Brush : null;
})();
;(function()
{
	// CommonJS
	SyntaxHighlighter = SyntaxHighlighter || (typeof require !== 'undefined'? require('shCore').SyntaxHighlighter : null);

	function Brush()
	{
		var keywords =	'break case catch continue ' +
						'default delete do else false  ' +
						'for function if in instanceof ' +
						'new null return super switch ' +
						'this throw true try typeof var while with'
						;

		var r = SyntaxHighlighter.regexLib;
		
		this.regexList = [
			{ regex: r.multiLineDoubleQuotedString,					css: 'string' },			// double quoted strings
			{ regex: r.multiLineSingleQuotedString,					css: 'string' },			// single quoted strings
			{ regex: r.singleLineCComments,							css: 'comments' },			// one line comments
			{ regex: r.multiLineCComments,							css: 'comments' },			// multiline comments
			{ regex: /\s*#.*/gm,									css: 'preprocessor' },		// preprocessor tags like #region and #endregion
			{ regex: new RegExp(this.getKeywords(keywords), 'gm'),	css: 'keyword' }			// keywords
			];
	
		this.forHtmlScript(r.scriptScriptTags);
	};

	Brush.prototype	= new SyntaxHighlighter.Highlighter();
	Brush.aliases	= ['js', 'jscript', 'javascript'];

	SyntaxHighlighter.brushes.JScript = Brush;

	// CommonJS
	typeof(exports) != 'undefined' ? exports.Brush = Brush : null;
})();
;(function()
{
	// CommonJS
	SyntaxHighlighter = SyntaxHighlighter || (typeof require !== 'undefined'? require('shCore').SyntaxHighlighter : null);

	function Brush()
	{
		// Contributed by David Simmons-Duffin and Marty Kube
	
		var funcs = 
			'abs accept alarm atan2 bind binmode chdir chmod chomp chop chown chr ' + 
			'chroot close closedir connect cos crypt defined delete each endgrent ' + 
			'endhostent endnetent endprotoent endpwent endservent eof exec exists ' + 
			'exp fcntl fileno flock fork format formline getc getgrent getgrgid ' + 
			'getgrnam gethostbyaddr gethostbyname gethostent getlogin getnetbyaddr ' + 
			'getnetbyname getnetent getpeername getpgrp getppid getpriority ' + 
			'getprotobyname getprotobynumber getprotoent getpwent getpwnam getpwuid ' + 
			'getservbyname getservbyport getservent getsockname getsockopt glob ' + 
			'gmtime grep hex index int ioctl join keys kill lc lcfirst length link ' + 
			'listen localtime lock log lstat map mkdir msgctl msgget msgrcv msgsnd ' + 
			'oct open opendir ord pack pipe pop pos print printf prototype push ' + 
			'quotemeta rand read readdir readline readlink readpipe recv rename ' + 
			'reset reverse rewinddir rindex rmdir scalar seek seekdir select semctl ' + 
			'semget semop send setgrent sethostent setnetent setpgrp setpriority ' + 
			'setprotoent setpwent setservent setsockopt shift shmctl shmget shmread ' + 
			'shmwrite shutdown sin sleep socket socketpair sort splice split sprintf ' + 
			'sqrt srand stat study substr symlink syscall sysopen sysread sysseek ' + 
			'system syswrite tell telldir time times tr truncate uc ucfirst umask ' + 
			'undef unlink unpack unshift utime values vec wait waitpid warn write ' +
			// feature
			'say';
    
		var keywords =  
			'bless caller continue dbmclose dbmopen die do dump else elsif eval exit ' +
			'for foreach goto if import last local my next no our package redo ref ' + 
			'require return sub tie tied unless untie until use wantarray while ' +
			// feature
			'given when default ' +
			// Try::Tiny
			'try catch finally ' +
			// Moose
			'has extends with before after around override augment';
    
		this.regexList = [
			{ regex: /(<<|&lt;&lt;)((\w+)|(['"])(.+?)\4)[\s\S]+?\n\3\5\n/g,	css: 'string' },	// here doc (maybe html encoded)
			{ regex: /#.*$/gm,										css: 'comments' },
			{ regex: /^#!.*\n/g,									css: 'preprocessor' },	// shebang
			{ regex: /-?\w+(?=\s*=(>|&gt;))/g,	css: 'string' }, // fat comma

			// is this too much?
			{ regex: /\bq[qwxr]?\([\s\S]*?\)/g,	css: 'string' }, // quote-like operators ()
			{ regex: /\bq[qwxr]?\{[\s\S]*?\}/g,	css: 'string' }, // quote-like operators {}
			{ regex: /\bq[qwxr]?\[[\s\S]*?\]/g,	css: 'string' }, // quote-like operators []
			{ regex: /\bq[qwxr]?(<|&lt;)[\s\S]*?(>|&gt;)/g,	css: 'string' }, // quote-like operators <>
			{ regex: /\bq[qwxr]?([^\w({<[])[\s\S]*?\1/g,	css: 'string' }, // quote-like operators non-paired

			{ regex: SyntaxHighlighter.regexLib.doubleQuotedString,	css: 'string' },
			{ regex: SyntaxHighlighter.regexLib.singleQuotedString,	css: 'string' },
			// currently ignoring single quote package separator and utf8 names
			{ regex: /(?:&amp;|[$@%*]|\$#)[a-zA-Z_](\w+|::)*/g,   		css: 'variable' },
			{ regex: /\b__(?:END|DATA)__\b[\s\S]*$/g,				css: 'comments' },
			{ regex: /(^|\n)=\w[\s\S]*?(\n=cut\s*\n|$)/g,				css: 'comments' },		// pod
			{ regex: new RegExp(this.getKeywords(funcs), 'gm'),		css: 'functions' },
			{ regex: new RegExp(this.getKeywords(keywords), 'gm'),	css: 'keyword' }
		];

		this.forHtmlScript(SyntaxHighlighter.regexLib.phpScriptTags);
	}

	Brush.prototype	= new SyntaxHighlighter.Highlighter();
	Brush.aliases		= ['perl', 'Perl', 'pl'];

	SyntaxHighlighter.brushes.Perl = Brush;

	// CommonJS
	typeof(exports) != 'undefined' ? exports.Brush = Brush : null;
})();
;(function()
{
	// CommonJS
	SyntaxHighlighter = SyntaxHighlighter || (typeof require !== 'undefined'? require('shCore').SyntaxHighlighter : null);

	function Brush()
	{
		var funcs	=	'abs acos acosh addcslashes addslashes ' +
						'array_change_key_case array_chunk array_combine array_count_values array_diff '+
						'array_diff_assoc array_diff_key array_diff_uassoc array_diff_ukey array_fill '+
						'array_filter array_flip array_intersect array_intersect_assoc array_intersect_key '+
						'array_intersect_uassoc array_intersect_ukey array_key_exists array_keys array_map '+
						'array_merge array_merge_recursive array_multisort array_pad array_pop array_product '+
						'array_push array_rand array_reduce array_reverse array_search array_shift '+
						'array_slice array_splice array_sum array_udiff array_udiff_assoc '+
						'array_udiff_uassoc array_uintersect array_uintersect_assoc '+
						'array_uintersect_uassoc array_unique array_unshift array_values array_walk '+
						'array_walk_recursive atan atan2 atanh base64_decode base64_encode base_convert '+
						'basename bcadd bccomp bcdiv bcmod bcmul bindec bindtextdomain bzclose bzcompress '+
						'bzdecompress bzerrno bzerror bzerrstr bzflush bzopen bzread bzwrite ceil chdir '+
						'checkdate checkdnsrr chgrp chmod chop chown chr chroot chunk_split class_exists '+
						'closedir closelog copy cos cosh count count_chars date decbin dechex decoct '+
						'deg2rad delete ebcdic2ascii echo empty end ereg ereg_replace eregi eregi_replace error_log '+
						'error_reporting escapeshellarg escapeshellcmd eval exec exit exp explode extension_loaded '+
						'feof fflush fgetc fgetcsv fgets fgetss file_exists file_get_contents file_put_contents '+
						'fileatime filectime filegroup fileinode filemtime fileowner fileperms filesize filetype '+
						'floatval flock floor flush fmod fnmatch fopen fpassthru fprintf fputcsv fputs fread fscanf '+
						'fseek fsockopen fstat ftell ftok getallheaders getcwd getdate getenv gethostbyaddr gethostbyname '+
						'gethostbynamel getimagesize getlastmod getmxrr getmygid getmyinode getmypid getmyuid getopt '+
						'getprotobyname getprotobynumber getrandmax getrusage getservbyname getservbyport gettext '+
						'gettimeofday gettype glob gmdate gmmktime ini_alter ini_get ini_get_all ini_restore ini_set '+
						'interface_exists intval ip2long is_a is_array is_bool is_callable is_dir is_double '+
						'is_executable is_file is_finite is_float is_infinite is_int is_integer is_link is_long '+
						'is_nan is_null is_numeric is_object is_readable is_real is_resource is_scalar is_soap_fault '+
						'is_string is_subclass_of is_uploaded_file is_writable is_writeable mkdir mktime nl2br '+
						'parse_ini_file parse_str parse_url passthru pathinfo print readlink realpath rewind rewinddir rmdir '+
						'round str_ireplace str_pad str_repeat str_replace str_rot13 str_shuffle str_split '+
						'str_word_count strcasecmp strchr strcmp strcoll strcspn strftime strip_tags stripcslashes '+
						'stripos stripslashes stristr strlen strnatcasecmp strnatcmp strncasecmp strncmp strpbrk '+
						'strpos strptime strrchr strrev strripos strrpos strspn strstr strtok strtolower strtotime '+
						'strtoupper strtr strval substr substr_compare';

		var keywords =	'abstract and array as break case catch cfunction class clone const continue declare default die do ' +
						'else elseif enddeclare endfor endforeach endif endswitch endwhile extends final for foreach ' +
						'function global goto if implements include include_once interface instanceof insteadof namespace new ' +
						'old_function or private protected public return require require_once static switch ' +
						'trait throw try use var while xor ';
		
		var constants	= '__FILE__ __LINE__ __METHOD__ __FUNCTION__ __CLASS__';

		this.regexList = [
			{ regex: SyntaxHighlighter.regexLib.singleLineCComments,	css: 'comments' },			// one line comments
			{ regex: SyntaxHighlighter.regexLib.multiLineCComments,		css: 'comments' },			// multiline comments
			{ regex: SyntaxHighlighter.regexLib.doubleQuotedString,		css: 'string' },			// double quoted strings
			{ regex: SyntaxHighlighter.regexLib.singleQuotedString,		css: 'string' },			// single quoted strings
			{ regex: /\$\w+/g,											css: 'variable' },			// variables
			{ regex: new RegExp(this.getKeywords(funcs), 'gmi'),		css: 'functions' },			// common functions
			{ regex: new RegExp(this.getKeywords(constants), 'gmi'),	css: 'constants' },			// constants
			{ regex: new RegExp(this.getKeywords(keywords), 'gm'),		css: 'keyword' }			// keyword
			];

		this.forHtmlScript(SyntaxHighlighter.regexLib.phpScriptTags);
	};

	Brush.prototype	= new SyntaxHighlighter.Highlighter();
	Brush.aliases	= ['php'];

	SyntaxHighlighter.brushes.Php = Brush;

	// CommonJS
	typeof(exports) != 'undefined' ? exports.Brush = Brush : null;
})();
;(function()
{
	// CommonJS
	SyntaxHighlighter = SyntaxHighlighter || (typeof require !== 'undefined'? require('shCore').SyntaxHighlighter : null);

	function Brush()
	{
	};

	Brush.prototype	= new SyntaxHighlighter.Highlighter();
	Brush.aliases	= ['text', 'plain'];

	SyntaxHighlighter.brushes.Plain = Brush;

	// CommonJS
	typeof(exports) != 'undefined' ? exports.Brush = Brush : null;
})();
;(function()
{
	// CommonJS
	SyntaxHighlighter = SyntaxHighlighter || (typeof require !== 'undefined'? require('shCore').SyntaxHighlighter : null);

	function Brush()
	{
		// Contributed by Joel 'Jaykul' Bennett, http://PoshCode.org | http://HuddledMasses.org
		var keywords =	'while validateset validaterange validatepattern validatelength validatecount ' +
						'until trap switch return ref process param parameter in if global: '+
						'function foreach for finally filter end elseif else dynamicparam do default ' +
						'continue cmdletbinding break begin alias \\? % #script #private #local #global '+
						'mandatory parametersetname position valuefrompipeline ' +
						'valuefrompipelinebypropertyname valuefromremainingarguments helpmessage ';

		var operators =	' and as band bnot bor bxor casesensitive ccontains ceq cge cgt cle ' +
						'clike clt cmatch cne cnotcontains cnotlike cnotmatch contains ' +
						'creplace eq exact f file ge gt icontains ieq ige igt ile ilike ilt ' +
						'imatch ine inotcontains inotlike inotmatch ireplace is isnot le like ' +
						'lt match ne not notcontains notlike notmatch or regex replace wildcard';
						
		var verbs =		'write where wait use update unregister undo trace test tee take suspend ' +
						'stop start split sort skip show set send select scroll resume restore ' +
						'restart resolve resize reset rename remove register receive read push ' +
						'pop ping out new move measure limit join invoke import group get format ' +
						'foreach export expand exit enter enable disconnect disable debug cxnew ' +
						'copy convertto convertfrom convert connect complete compare clear ' +
						'checkpoint aggregate add';

		// I can't find a way to match the comment based help in multi-line comments, because SH won't highlight in highlights, and javascript doesn't support lookbehind
		var commenthelp = ' component description example externalhelp forwardhelpcategory forwardhelptargetname forwardhelptargetname functionality inputs link notes outputs parameter remotehelprunspace role synopsis';

		this.regexList = [
			{ regex: new RegExp('^\\s*#[#\\s]*\\.('+this.getKeywords(commenthelp)+').*$', 'gim'),			css: 'preprocessor help bold' },		// comment-based help
			{ regex: SyntaxHighlighter.regexLib.singleLinePerlComments,										css: 'comments' },						// one line comments
			{ regex: /(&lt;|<)#[\s\S]*?#(&gt;|>)/gm,														css: 'comments here' },					// multi-line comments
			
			{ regex: new RegExp('@"\\n[\\s\\S]*?\\n"@', 'gm'),												css: 'script string here' },			// double quoted here-strings
			{ regex: new RegExp("@'\\n[\\s\\S]*?\\n'@", 'gm'),												css: 'script string single here' },		// single quoted here-strings
			{ regex: new RegExp('"(?:\\$\\([^\\)]*\\)|[^"]|`"|"")*[^`]"','g'),								css: 'string' },						// double quoted strings
			{ regex: new RegExp("'(?:[^']|'')*'", 'g'),														css: 'string single' },					// single quoted strings
			
			{ regex: new RegExp('[\\$|@|@@](?:(?:global|script|private|env):)?[A-Z0-9_]+', 'gi'),			css: 'variable' },						// $variables
			{ regex: new RegExp('(?:\\b'+verbs.replace(/ /g, '\\b|\\b')+')-[a-zA-Z_][a-zA-Z0-9_]*', 'gmi'),	css: 'functions' },						// functions and cmdlets
			{ regex: new RegExp(this.getKeywords(keywords), 'gmi'),											css: 'keyword' },						// keywords
			{ regex: new RegExp('-'+this.getKeywords(operators), 'gmi'),									css: 'operator value' },				// operators
			{ regex: new RegExp('\\[[A-Z_\\[][A-Z0-9_. `,\\[\\]]*\\]', 'gi'),								css: 'constants' },						// .Net [Type]s
			{ regex: new RegExp('\\s+-(?!'+this.getKeywords(operators)+')[a-zA-Z_][a-zA-Z0-9_]*', 'gmi'),	css: 'color1' },						// parameters	  
		];
	};

	Brush.prototype	= new SyntaxHighlighter.Highlighter();
	Brush.aliases	= ['powershell', 'ps', 'posh'];

	SyntaxHighlighter.brushes.PowerShell = Brush;

	// CommonJS
	typeof(exports) != 'undefined' ? exports.Brush = Brush : null;
})();
;(function()
{
	// CommonJS
	SyntaxHighlighter = SyntaxHighlighter || (typeof require !== 'undefined'? require('shCore').SyntaxHighlighter : null);

	function Brush()
	{
		// Contributed by Gheorghe Milas and Ahmad Sherif
	
		var keywords =  'and assert break class continue def del elif else ' +
						'except exec finally for from global if import in is ' +
						'lambda not or pass print raise return try yield while';

		var funcs = '__import__ abs all any apply basestring bin bool buffer callable ' +
					'chr classmethod cmp coerce compile complex delattr dict dir ' +
					'divmod enumerate eval execfile file filter float format frozenset ' +
					'getattr globals hasattr hash help hex id input int intern ' +
					'isinstance issubclass iter len list locals long map max min next ' +
					'object oct open ord pow print property range raw_input reduce ' +
					'reload repr reversed round set setattr slice sorted staticmethod ' +
					'str sum super tuple type type unichr unicode vars xrange zip';

		var special =  'None True False self cls class_';

		this.regexList = [
				{ regex: SyntaxHighlighter.regexLib.singleLinePerlComments, css: 'comments' },
				{ regex: /^\s*@\w+/gm, 										css: 'decorator' },
				{ regex: /(['\"]{3})([^\1])*?\1/gm, 						css: 'comments' },
				{ regex: /"(?!")(?:\.|\\\"|[^\""\n])*"/gm, 					css: 'string' },
				{ regex: /'(?!')(?:\.|(\\\')|[^\''\n])*'/gm, 				css: 'string' },
				{ regex: /\+|\-|\*|\/|\%|=|==/gm, 							css: 'keyword' },
				{ regex: /\b\d+\.?\w*/g, 									css: 'value' },
				{ regex: new RegExp(this.getKeywords(funcs), 'gmi'),		css: 'functions' },
				{ regex: new RegExp(this.getKeywords(keywords), 'gm'), 		css: 'keyword' },
				{ regex: new RegExp(this.getKeywords(special), 'gm'), 		css: 'color1' }
				];
			
		this.forHtmlScript(SyntaxHighlighter.regexLib.aspScriptTags);
	};

	Brush.prototype	= new SyntaxHighlighter.Highlighter();
	Brush.aliases	= ['py', 'python'];

	SyntaxHighlighter.brushes.Python = Brush;

	// CommonJS
	typeof(exports) != 'undefined' ? exports.Brush = Brush : null;
})();
;(function()
{
	// CommonJS
	SyntaxHighlighter = SyntaxHighlighter || (typeof require !== 'undefined'? require('shCore').SyntaxHighlighter : null);

	function Brush()
	{
		// Contributed by Erik Peterson.
	
		var keywords =	'alias and BEGIN begin break case class def define_method defined do each else elsif ' +
						'END end ensure false for if in module new next nil not or raise redo rescue retry return ' +
						'self super then throw true undef unless until when while yield';

		var builtins =	'Array Bignum Binding Class Continuation Dir Exception FalseClass File::Stat File Fixnum Fload ' +
						'Hash Integer IO MatchData Method Module NilClass Numeric Object Proc Range Regexp String Struct::TMS Symbol ' +
						'ThreadGroup Thread Time TrueClass';

		this.regexList = [
			{ regex: SyntaxHighlighter.regexLib.singleLinePerlComments,	css: 'comments' },		// one line comments
			{ regex: SyntaxHighlighter.regexLib.doubleQuotedString,		css: 'string' },		// double quoted strings
			{ regex: SyntaxHighlighter.regexLib.singleQuotedString,		css: 'string' },		// single quoted strings
			{ regex: /\b[A-Z0-9_]+\b/g,									css: 'constants' },		// constants
			{ regex: /:[a-z][A-Za-z0-9_]*/g,							css: 'color2' },		// symbols
			{ regex: /(\$|@@|@)\w+/g,									css: 'variable bold' },	// $global, @instance, and @@class variables
			{ regex: new RegExp(this.getKeywords(keywords), 'gm'),		css: 'keyword' },		// keywords
			{ regex: new RegExp(this.getKeywords(builtins), 'gm'),		css: 'color1' }			// builtins
			];

		this.forHtmlScript(SyntaxHighlighter.regexLib.aspScriptTags);
	};

	Brush.prototype	= new SyntaxHighlighter.Highlighter();
	Brush.aliases	= ['ruby', 'rails', 'ror', 'rb'];

	SyntaxHighlighter.brushes.Ruby = Brush;

	// CommonJS
	typeof(exports) != 'undefined' ? exports.Brush = Brush : null;
})();
;(function()
{
	// CommonJS
	SyntaxHighlighter = SyntaxHighlighter || (typeof require !== 'undefined'? require('shCore').SyntaxHighlighter : null);

	function Brush()
	{
		function getKeywordsCSS(str)
		{
			return '\\b([a-z_]|)' + str.replace(/ /g, '(?=:)\\b|\\b([a-z_\\*]|\\*|)') + '(?=:)\\b';
		};
	
		function getValuesCSS(str)
		{
			return '\\b' + str.replace(/ /g, '(?!-)(?!:)\\b|\\b()') + '\:\\b';
		};

		var keywords =	'ascent azimuth background-attachment background-color background-image background-position ' +
						'background-repeat background baseline bbox border-collapse border-color border-spacing border-style border-top ' +
						'border-right border-bottom border-left border-top-color border-right-color border-bottom-color border-left-color ' +
						'border-top-style border-right-style border-bottom-style border-left-style border-top-width border-right-width ' +
						'border-bottom-width border-left-width border-width border bottom cap-height caption-side centerline clear clip color ' +
						'content counter-increment counter-reset cue-after cue-before cue cursor definition-src descent direction display ' +
						'elevation empty-cells float font-size-adjust font-family font-size font-stretch font-style font-variant font-weight font ' +
						'height left letter-spacing line-height list-style-image list-style-position list-style-type list-style margin-top ' +
						'margin-right margin-bottom margin-left margin marker-offset marks mathline max-height max-width min-height min-width orphans ' +
						'outline-color outline-style outline-width outline overflow padding-top padding-right padding-bottom padding-left padding page ' +
						'page-break-after page-break-before page-break-inside pause pause-after pause-before pitch pitch-range play-during position ' +
						'quotes right richness size slope src speak-header speak-numeral speak-punctuation speak speech-rate stemh stemv stress ' +
						'table-layout text-align top text-decoration text-indent text-shadow text-transform unicode-bidi unicode-range units-per-em ' +
						'vertical-align visibility voice-family volume white-space widows width widths word-spacing x-height z-index';
		
		var values =	'above absolute all always aqua armenian attr aural auto avoid baseline behind below bidi-override black blink block blue bold bolder '+
						'both bottom braille capitalize caption center center-left center-right circle close-quote code collapse compact condensed '+
						'continuous counter counters crop cross crosshair cursive dashed decimal decimal-leading-zero digits disc dotted double '+
						'embed embossed e-resize expanded extra-condensed extra-expanded fantasy far-left far-right fast faster fixed format fuchsia '+
						'gray green groove handheld hebrew help hidden hide high higher icon inline-table inline inset inside invert italic '+
						'justify landscape large larger left-side left leftwards level lighter lime line-through list-item local loud lower-alpha '+
						'lowercase lower-greek lower-latin lower-roman lower low ltr marker maroon medium message-box middle mix move narrower '+
						'navy ne-resize no-close-quote none no-open-quote no-repeat normal nowrap n-resize nw-resize oblique olive once open-quote outset '+
						'outside overline pointer portrait pre print projection purple red relative repeat repeat-x repeat-y rgb ridge right right-side '+
						'rightwards rtl run-in screen scroll semi-condensed semi-expanded separate se-resize show silent silver slower slow '+
						'small small-caps small-caption smaller soft solid speech spell-out square s-resize static status-bar sub super sw-resize '+
						'table-caption table-cell table-column table-column-group table-footer-group table-header-group table-row table-row-group teal '+
						'text-bottom text-top thick thin top transparent tty tv ultra-condensed ultra-expanded underline upper-alpha uppercase upper-latin '+
						'upper-roman url visible wait white wider w-resize x-fast x-high x-large x-loud x-low x-slow x-small x-soft xx-large xx-small yellow';
		
		var fonts =		'[mM]onospace [tT]ahoma [vV]erdana [aA]rial [hH]elvetica [sS]ans-serif [sS]erif [cC]ourier mono sans serif';
		
		var statements		= '!important !default';
		var preprocessor	= '@import @extend @debug @warn @if @for @while @mixin @include';
		
		var r = SyntaxHighlighter.regexLib;
		
		this.regexList = [
			{ regex: r.multiLineCComments,								css: 'comments' },		// multiline comments
			{ regex: r.singleLineCComments,								css: 'comments' },		// singleline comments
			{ regex: r.doubleQuotedString,								css: 'string' },		// double quoted strings
			{ regex: r.singleQuotedString,								css: 'string' },		// single quoted strings
			{ regex: /\#[a-fA-F0-9]{3,6}/g,								css: 'value' },			// html colors
			{ regex: /\b(-?\d+)(\.\d+)?(px|em|pt|\:|\%|)\b/g,			css: 'value' },			// sizes
			{ regex: /\$\w+/g,											css: 'variable' },		// variables
			{ regex: new RegExp(this.getKeywords(statements), 'g'),		css: 'color3' },		// statements
			{ regex: new RegExp(this.getKeywords(preprocessor), 'g'),	css: 'preprocessor' },	// preprocessor
			{ regex: new RegExp(getKeywordsCSS(keywords), 'gm'),		css: 'keyword' },		// keywords
			{ regex: new RegExp(getValuesCSS(values), 'g'),				css: 'value' },			// values
			{ regex: new RegExp(this.getKeywords(fonts), 'g'),			css: 'color1' }			// fonts
			];
	};

	Brush.prototype	= new SyntaxHighlighter.Highlighter();
	Brush.aliases	= ['sass', 'scss'];

	SyntaxHighlighter.brushes.Sass = Brush;

	// CommonJS
	typeof(exports) != 'undefined' ? exports.Brush = Brush : null;
})();
;(function()
{
	// CommonJS
	SyntaxHighlighter = SyntaxHighlighter || (typeof require !== 'undefined'? require('shCore').SyntaxHighlighter : null);

	function Brush()
	{
		// Contributed by Yegor Jbanov and David Bernard.
	
		var keywords =	'val sealed case def true trait implicit forSome import match object null finally super ' +
						'override try lazy for var catch throw type extends class while with new final yield abstract ' +
						'else do if return protected private this package false';

		var keyops =	'[_:=><%#@]+';

		this.regexList = [
			{ regex: SyntaxHighlighter.regexLib.singleLineCComments,			css: 'comments' },	// one line comments
			{ regex: SyntaxHighlighter.regexLib.multiLineCComments,				css: 'comments' },	// multiline comments
			{ regex: SyntaxHighlighter.regexLib.multiLineSingleQuotedString,	css: 'string' },	// multi-line strings
			{ regex: SyntaxHighlighter.regexLib.multiLineDoubleQuotedString,    css: 'string' },	// double-quoted string
			{ regex: SyntaxHighlighter.regexLib.singleQuotedString,				css: 'string' },	// strings
			{ regex: /0x[a-f0-9]+|\d+(\.\d+)?/gi,								css: 'value' },		// numbers
			{ regex: new RegExp(this.getKeywords(keywords), 'gm'),				css: 'keyword' },	// keywords
			{ regex: new RegExp(keyops, 'gm'),									css: 'keyword' }	// scala keyword
			];
	}

	Brush.prototype	= new SyntaxHighlighter.Highlighter();
	Brush.aliases	= ['scala'];

	SyntaxHighlighter.brushes.Scala = Brush;

	// CommonJS
	typeof(exports) != 'undefined' ? exports.Brush = Brush : null;
})();
;(function()
{
	// CommonJS
	SyntaxHighlighter = SyntaxHighlighter || (typeof require !== 'undefined'? require('shCore').SyntaxHighlighter : null);

	function Brush()
	{
		var funcs	=	'abs avg case cast coalesce convert count current_timestamp ' +
						'current_user day isnull left lower month nullif replace right ' +
						'session_user space substring sum system_user upper user year';

		var keywords =	'absolute action add after alter as asc at authorization begin bigint ' +
						'binary bit by cascade char character check checkpoint close collate ' +
						'column commit committed connect connection constraint contains continue ' +
						'create cube current current_date current_time cursor database date ' +
						'deallocate dec decimal declare default delete desc distinct double drop ' +
						'dynamic else end end-exec escape except exec execute false fetch first ' +
						'float for force foreign forward free from full function global goto grant ' +
						'group grouping having hour ignore index inner insensitive insert instead ' +
						'int integer intersect into is isolation key last level load local max min ' +
						'minute modify move name national nchar next no numeric of off on only ' +
						'open option order out output partial password precision prepare primary ' +
						'prior privileges procedure public read real references relative repeatable ' +
						'restrict return returns revoke rollback rollup rows rule schema scroll ' +
						'second section select sequence serializable set size smallint static ' +
						'statistics table temp temporary then time timestamp to top transaction ' +
						'translation trigger true truncate uncommitted union unique update values ' +
						'varchar varying view when where with work';

		var operators =	'all and any between cross in join like not null or outer some';

		this.regexList = [
			{ regex: /--(.*)$/gm,												css: 'comments' },			// one line and multiline comments
			{ regex: SyntaxHighlighter.regexLib.multiLineDoubleQuotedString,	css: 'string' },			// double quoted strings
			{ regex: SyntaxHighlighter.regexLib.multiLineSingleQuotedString,	css: 'string' },			// single quoted strings
			{ regex: new RegExp(this.getKeywords(funcs), 'gmi'),				css: 'color2' },			// functions
			{ regex: new RegExp(this.getKeywords(operators), 'gmi'),			css: 'color1' },			// operators and such
			{ regex: new RegExp(this.getKeywords(keywords), 'gmi'),				css: 'keyword' }			// keyword
			];
	};

	Brush.prototype	= new SyntaxHighlighter.Highlighter();
	Brush.aliases	= ['sql'];

	SyntaxHighlighter.brushes.Sql = Brush;

	// CommonJS
	typeof(exports) != 'undefined' ? exports.Brush = Brush : null;
})();

;(function()
{
	// CommonJS
	SyntaxHighlighter = SyntaxHighlighter || (typeof require !== 'undefined'? require('shCore').SyntaxHighlighter : null);

	function Brush()
	{
		var keywords =	'AddHandler AddressOf AndAlso Alias And Ansi As Assembly Auto ' +
						'Boolean ByRef Byte ByVal Call Case Catch CBool CByte CChar CDate ' +
						'CDec CDbl Char CInt Class CLng CObj Const CShort CSng CStr CType ' +
						'Date Decimal Declare Default Delegate Dim DirectCast Do Double Each ' +
						'Else ElseIf End Enum Erase Error Event Exit False Finally For Friend ' +
						'Function Get GetType GoSub GoTo Handles If Implements Imports In ' +
						'Inherits Integer Interface Is Let Lib Like Long Loop Me Mod Module ' +
						'MustInherit MustOverride MyBase MyClass Namespace New Next Not Nothing ' +
						'NotInheritable NotOverridable Object On Option Optional Or OrElse ' +
						'Overloads Overridable Overrides ParamArray Preserve Private Property ' +
						'Protected Public RaiseEvent ReadOnly ReDim REM RemoveHandler Resume ' +
						'Return Select Set Shadows Shared Short Single Static Step Stop String ' +
						'Structure Sub SyncLock Then Throw To True Try TypeOf Unicode Until ' +
						'Variant When While With WithEvents WriteOnly Xor';

		this.regexList = [
			{ regex: /'.*$/gm,										css: 'comments' },			// one line comments
			{ regex: SyntaxHighlighter.regexLib.doubleQuotedString,	css: 'string' },			// strings
			{ regex: /^\s*#.*$/gm,									css: 'preprocessor' },		// preprocessor tags like #region and #endregion
			{ regex: new RegExp(this.getKeywords(keywords), 'gm'),	css: 'keyword' }			// vb keyword
			];

		this.forHtmlScript(SyntaxHighlighter.regexLib.aspScriptTags);
	};

	Brush.prototype	= new SyntaxHighlighter.Highlighter();
	Brush.aliases	= ['vb', 'vbnet'];

	SyntaxHighlighter.brushes.Vb = Brush;

	// CommonJS
	typeof(exports) != 'undefined' ? exports.Brush = Brush : null;
})();
;(function()
{
	// CommonJS
	SyntaxHighlighter = SyntaxHighlighter || (typeof require !== 'undefined'? require('shCore').SyntaxHighlighter : null);

	function Brush()
	{
		function process(match, regexInfo)
		{
			var constructor = SyntaxHighlighter.Match,
				code = match[0],
				tag = new XRegExp('(&lt;|<)[\\s\\/\\?]*(?<name>[:\\w-\\.]+)', 'xg').exec(code),
				result = []
				;
		
			if (match.attributes != null) 
			{
				var attributes,
					regex = new XRegExp('(?<name> [\\w:\\-\\.]+)' +
										'\\s*=\\s*' +
										'(?<value> ".*?"|\'.*?\'|\\w+)',
										'xg');

				while ((attributes = regex.exec(code)) != null) 
				{
					result.push(new constructor(attributes.name, match.index + attributes.index, 'color1'));
					result.push(new constructor(attributes.value, match.index + attributes.index + attributes[0].indexOf(attributes.value), 'string'));
				}
			}

			if (tag != null)
				result.push(
					new constructor(tag.name, match.index + tag[0].indexOf(tag.name), 'keyword')
				);

			return result;
		}
	
		this.regexList = [
			{ regex: new XRegExp('(\\&lt;|<)\\!\\[[\\w\\s]*?\\[(.|\\s)*?\\]\\](\\&gt;|>)', 'gm'),			css: 'color2' },	// <![ ... [ ... ]]>
			{ regex: SyntaxHighlighter.regexLib.xmlComments,												css: 'comments' },	// <!-- ... -->
			{ regex: new XRegExp('(&lt;|<)[\\s\\/\\?]*(\\w+)(?<attributes>.*?)[\\s\\/\\?]*(&gt;|>)', 'sg'), func: process }
		];
	};

	Brush.prototype	= new SyntaxHighlighter.Highlighter();
	Brush.aliases	= ['xml', 'xhtml', 'xslt', 'html'];

	SyntaxHighlighter.brushes.Xml = Brush;

	// CommonJS
	typeof(exports) != 'undefined' ? exports.Brush = Brush : null;
})();

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvdGhpcmQtcGFydHkvU3ludGF4SGlnaGxpZ2h0ZXIvc2hDb3JlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIFhSZWdFeHAgMS41LjFcbi8vIChjKSAyMDA3LTIwMTIgU3RldmVuIExldml0aGFuXG4vLyBNSVQgTGljZW5zZVxuLy8gPGh0dHA6Ly94cmVnZXhwLmNvbT5cbi8vIFByb3ZpZGVzIGFuIGF1Z21lbnRlZCwgZXh0ZW5zaWJsZSwgY3Jvc3MtYnJvd3NlciBpbXBsZW1lbnRhdGlvbiBvZiByZWd1bGFyIGV4cHJlc3Npb25zLFxuLy8gaW5jbHVkaW5nIHN1cHBvcnQgZm9yIGFkZGl0aW9uYWwgc3ludGF4LCBmbGFncywgYW5kIG1ldGhvZHNcblxudmFyIFhSZWdFeHA7XG5cbmlmIChYUmVnRXhwKSB7XG4gICAgLy8gQXZvaWQgcnVubmluZyB0d2ljZSwgc2luY2UgdGhhdCB3b3VsZCBicmVhayByZWZlcmVuY2VzIHRvIG5hdGl2ZSBnbG9iYWxzXG4gICAgdGhyb3cgRXJyb3IoXCJjYW4ndCBsb2FkIFhSZWdFeHAgdHdpY2UgaW4gdGhlIHNhbWUgZnJhbWVcIik7XG59XG5cbi8vIFJ1biB3aXRoaW4gYW4gYW5vbnltb3VzIGZ1bmN0aW9uIHRvIHByb3RlY3QgdmFyaWFibGVzIGFuZCBhdm9pZCBuZXcgZ2xvYmFsc1xuKGZ1bmN0aW9uICh1bmRlZmluZWQpIHtcblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gIENvbnN0cnVjdG9yXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAgIC8vIEFjY2VwdHMgYSBwYXR0ZXJuIGFuZCBmbGFnczsgcmV0dXJucyBhIG5ldywgZXh0ZW5kZWQgYFJlZ0V4cGAgb2JqZWN0LiBEaWZmZXJzIGZyb20gYSBuYXRpdmVcbiAgICAvLyByZWd1bGFyIGV4cHJlc3Npb24gaW4gdGhhdCBhZGRpdGlvbmFsIHN5bnRheCBhbmQgZmxhZ3MgYXJlIHN1cHBvcnRlZCBhbmQgY3Jvc3MtYnJvd3NlclxuICAgIC8vIHN5bnRheCBpbmNvbnNpc3RlbmNpZXMgYXJlIGFtZWxpb3JhdGVkLiBgWFJlZ0V4cCgvcmVnZXgvKWAgY2xvbmVzIGFuIGV4aXN0aW5nIHJlZ2V4IGFuZFxuICAgIC8vIGNvbnZlcnRzIHRvIHR5cGUgWFJlZ0V4cFxuICAgIFhSZWdFeHAgPSBmdW5jdGlvbiAocGF0dGVybiwgZmxhZ3MpIHtcbiAgICAgICAgdmFyIG91dHB1dCA9IFtdLFxuICAgICAgICAgICAgY3VyclNjb3BlID0gWFJlZ0V4cC5PVVRTSURFX0NMQVNTLFxuICAgICAgICAgICAgcG9zID0gMCxcbiAgICAgICAgICAgIGNvbnRleHQsIHRva2VuUmVzdWx0LCBtYXRjaCwgY2hyLCByZWdleDtcblxuICAgICAgICBpZiAoWFJlZ0V4cC5pc1JlZ0V4cChwYXR0ZXJuKSkge1xuICAgICAgICAgICAgaWYgKGZsYWdzICE9PSB1bmRlZmluZWQpXG4gICAgICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKFwiY2FuJ3Qgc3VwcGx5IGZsYWdzIHdoZW4gY29uc3RydWN0aW5nIG9uZSBSZWdFeHAgZnJvbSBhbm90aGVyXCIpO1xuICAgICAgICAgICAgcmV0dXJuIGNsb25lKHBhdHRlcm4pO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRva2VucyBiZWNvbWUgcGFydCBvZiB0aGUgcmVnZXggY29uc3RydWN0aW9uIHByb2Nlc3MsIHNvIHByb3RlY3QgYWdhaW5zdCBpbmZpbml0ZVxuICAgICAgICAvLyByZWN1cnNpb24gd2hlbiBhbiBYUmVnRXhwIGlzIGNvbnN0cnVjdGVkIHdpdGhpbiBhIHRva2VuIGhhbmRsZXIgb3IgdHJpZ2dlclxuICAgICAgICBpZiAoaXNJbnNpZGVDb25zdHJ1Y3RvcilcbiAgICAgICAgICAgIHRocm93IEVycm9yKFwiY2FuJ3QgY2FsbCB0aGUgWFJlZ0V4cCBjb25zdHJ1Y3RvciB3aXRoaW4gdG9rZW4gZGVmaW5pdGlvbiBmdW5jdGlvbnNcIik7XG5cbiAgICAgICAgZmxhZ3MgPSBmbGFncyB8fCBcIlwiO1xuICAgICAgICBjb250ZXh0ID0geyAvLyBgdGhpc2Agb2JqZWN0IGZvciBjdXN0b20gdG9rZW5zXG4gICAgICAgICAgICBoYXNOYW1lZENhcHR1cmU6IGZhbHNlLFxuICAgICAgICAgICAgY2FwdHVyZU5hbWVzOiBbXSxcbiAgICAgICAgICAgIGhhc0ZsYWc6IGZ1bmN0aW9uIChmbGFnKSB7cmV0dXJuIGZsYWdzLmluZGV4T2YoZmxhZykgPiAtMTt9LFxuICAgICAgICAgICAgc2V0RmxhZzogZnVuY3Rpb24gKGZsYWcpIHtmbGFncyArPSBmbGFnO31cbiAgICAgICAgfTtcblxuICAgICAgICB3aGlsZSAocG9zIDwgcGF0dGVybi5sZW5ndGgpIHtcbiAgICAgICAgICAgIC8vIENoZWNrIGZvciBjdXN0b20gdG9rZW5zIGF0IHRoZSBjdXJyZW50IHBvc2l0aW9uXG4gICAgICAgICAgICB0b2tlblJlc3VsdCA9IHJ1blRva2VucyhwYXR0ZXJuLCBwb3MsIGN1cnJTY29wZSwgY29udGV4dCk7XG5cbiAgICAgICAgICAgIGlmICh0b2tlblJlc3VsdCkge1xuICAgICAgICAgICAgICAgIG91dHB1dC5wdXNoKHRva2VuUmVzdWx0Lm91dHB1dCk7XG4gICAgICAgICAgICAgICAgcG9zICs9ICh0b2tlblJlc3VsdC5tYXRjaFswXS5sZW5ndGggfHwgMSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIENoZWNrIGZvciBuYXRpdmUgbXVsdGljaGFyYWN0ZXIgbWV0YXNlcXVlbmNlcyAoZXhjbHVkaW5nIGNoYXJhY3RlciBjbGFzc2VzKSBhdFxuICAgICAgICAgICAgICAgIC8vIHRoZSBjdXJyZW50IHBvc2l0aW9uXG4gICAgICAgICAgICAgICAgaWYgKG1hdGNoID0gbmF0aXYuZXhlYy5jYWxsKG5hdGl2ZVRva2Vuc1tjdXJyU2NvcGVdLCBwYXR0ZXJuLnNsaWNlKHBvcykpKSB7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dC5wdXNoKG1hdGNoWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgcG9zICs9IG1hdGNoWzBdLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjaHIgPSBwYXR0ZXJuLmNoYXJBdChwb3MpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2hyID09PSBcIltcIilcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJTY29wZSA9IFhSZWdFeHAuSU5TSURFX0NMQVNTO1xuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChjaHIgPT09IFwiXVwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgY3VyclNjb3BlID0gWFJlZ0V4cC5PVVRTSURFX0NMQVNTO1xuICAgICAgICAgICAgICAgICAgICAvLyBBZHZhbmNlIHBvc2l0aW9uIG9uZSBjaGFyYWN0ZXJcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnB1c2goY2hyKTtcbiAgICAgICAgICAgICAgICAgICAgcG9zKys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmVnZXggPSBSZWdFeHAob3V0cHV0LmpvaW4oXCJcIiksIG5hdGl2LnJlcGxhY2UuY2FsbChmbGFncywgZmxhZ0NsaXAsIFwiXCIpKTtcbiAgICAgICAgcmVnZXguX3hyZWdleHAgPSB7XG4gICAgICAgICAgICBzb3VyY2U6IHBhdHRlcm4sXG4gICAgICAgICAgICBjYXB0dXJlTmFtZXM6IGNvbnRleHQuaGFzTmFtZWRDYXB0dXJlID8gY29udGV4dC5jYXB0dXJlTmFtZXMgOiBudWxsXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiByZWdleDtcbiAgICB9O1xuXG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vICBQdWJsaWMgcHJvcGVydGllc1xuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgICBYUmVnRXhwLnZlcnNpb24gPSBcIjEuNS4xXCI7XG5cbiAgICAvLyBUb2tlbiBzY29wZSBiaXRmbGFnc1xuICAgIFhSZWdFeHAuSU5TSURFX0NMQVNTID0gMTtcbiAgICBYUmVnRXhwLk9VVFNJREVfQ0xBU1MgPSAyO1xuXG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vICBQcml2YXRlIHZhcmlhYmxlc1xuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgICB2YXIgcmVwbGFjZW1lbnRUb2tlbiA9IC9cXCQoPzooXFxkXFxkP3xbJCZgJ10pfHsoWyRcXHddKyl9KS9nLFxuICAgICAgICBmbGFnQ2xpcCA9IC9bXmdpbXldK3woW1xcc1xcU10pKD89W1xcc1xcU10qXFwxKS9nLCAvLyBOb25uYXRpdmUgYW5kIGR1cGxpY2F0ZSBmbGFnc1xuICAgICAgICBxdWFudGlmaWVyID0gL14oPzpbPyorXXx7XFxkKyg/OixcXGQqKT99KVxcPz8vLFxuICAgICAgICBpc0luc2lkZUNvbnN0cnVjdG9yID0gZmFsc2UsXG4gICAgICAgIHRva2VucyA9IFtdLFxuICAgIC8vIENvcHkgbmF0aXZlIGdsb2JhbHMgZm9yIHJlZmVyZW5jZSAoXCJuYXRpdmVcIiBpcyBhbiBFUzMgcmVzZXJ2ZWQga2V5d29yZClcbiAgICAgICAgbmF0aXYgPSB7XG4gICAgICAgICAgICBleGVjOiBSZWdFeHAucHJvdG90eXBlLmV4ZWMsXG4gICAgICAgICAgICB0ZXN0OiBSZWdFeHAucHJvdG90eXBlLnRlc3QsXG4gICAgICAgICAgICBtYXRjaDogU3RyaW5nLnByb3RvdHlwZS5tYXRjaCxcbiAgICAgICAgICAgIHJlcGxhY2U6IFN0cmluZy5wcm90b3R5cGUucmVwbGFjZSxcbiAgICAgICAgICAgIHNwbGl0OiBTdHJpbmcucHJvdG90eXBlLnNwbGl0XG4gICAgICAgIH0sXG4gICAgICAgIGNvbXBsaWFudEV4ZWNOcGNnID0gbmF0aXYuZXhlYy5jYWxsKC8oKT8/LywgXCJcIilbMV0gPT09IHVuZGVmaW5lZCwgLy8gY2hlY2sgYGV4ZWNgIGhhbmRsaW5nIG9mIG5vbnBhcnRpY2lwYXRpbmcgY2FwdHVyaW5nIGdyb3Vwc1xuICAgICAgICBjb21wbGlhbnRMYXN0SW5kZXhJbmNyZW1lbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgeCA9IC9eL2c7XG4gICAgICAgICAgICBuYXRpdi50ZXN0LmNhbGwoeCwgXCJcIik7XG4gICAgICAgICAgICByZXR1cm4gIXgubGFzdEluZGV4O1xuICAgICAgICB9KCksXG4gICAgICAgIGhhc05hdGl2ZVkgPSBSZWdFeHAucHJvdG90eXBlLnN0aWNreSAhPT0gdW5kZWZpbmVkLFxuICAgICAgICBuYXRpdmVUb2tlbnMgPSB7fTtcblxuICAgIC8vIGBuYXRpdmVUb2tlbnNgIG1hdGNoIG5hdGl2ZSBtdWx0aWNoYXJhY3RlciBtZXRhc2VxdWVuY2VzIG9ubHkgKGluY2x1ZGluZyBkZXByZWNhdGVkIG9jdGFscyxcbiAgICAvLyBleGNsdWRpbmcgY2hhcmFjdGVyIGNsYXNzZXMpXG4gICAgbmF0aXZlVG9rZW5zW1hSZWdFeHAuSU5TSURFX0NMQVNTXSA9IC9eKD86XFxcXCg/OlswLTNdWzAtN117MCwyfXxbNC03XVswLTddP3x4W1xcZEEtRmEtZl17Mn18dVtcXGRBLUZhLWZdezR9fGNbQS1aYS16XXxbXFxzXFxTXSkpLztcbiAgICBuYXRpdmVUb2tlbnNbWFJlZ0V4cC5PVVRTSURFX0NMQVNTXSA9IC9eKD86XFxcXCg/OjAoPzpbMC0zXVswLTddezAsMn18WzQtN11bMC03XT8pP3xbMS05XVxcZCp8eFtcXGRBLUZhLWZdezJ9fHVbXFxkQS1GYS1mXXs0fXxjW0EtWmEtel18W1xcc1xcU10pfFxcKFxcP1s6PSFdfFs/KitdXFw/fHtcXGQrKD86LFxcZCopP31cXD8/KS87XG5cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gIFB1YmxpYyBtZXRob2RzXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAgIC8vIExldHMgeW91IGV4dGVuZCBvciBjaGFuZ2UgWFJlZ0V4cCBzeW50YXggYW5kIGNyZWF0ZSBjdXN0b20gZmxhZ3MuIFRoaXMgaXMgdXNlZCBpbnRlcm5hbGx5IGJ5XG4gICAgLy8gdGhlIFhSZWdFeHAgbGlicmFyeSBhbmQgY2FuIGJlIHVzZWQgdG8gY3JlYXRlIFhSZWdFeHAgcGx1Z2lucy4gVGhpcyBmdW5jdGlvbiBpcyBpbnRlbmRlZCBmb3JcbiAgICAvLyB1c2VycyB3aXRoIGFkdmFuY2VkIGtub3dsZWRnZSBvZiBKYXZhU2NyaXB0J3MgcmVndWxhciBleHByZXNzaW9uIHN5bnRheCBhbmQgYmVoYXZpb3IuIEl0IGNhblxuICAgIC8vIGJlIGRpc2FibGVkIGJ5IGBYUmVnRXhwLmZyZWV6ZVRva2Vuc2BcbiAgICBYUmVnRXhwLmFkZFRva2VuID0gZnVuY3Rpb24gKHJlZ2V4LCBoYW5kbGVyLCBzY29wZSwgdHJpZ2dlcikge1xuICAgICAgICB0b2tlbnMucHVzaCh7XG4gICAgICAgICAgICBwYXR0ZXJuOiBjbG9uZShyZWdleCwgXCJnXCIgKyAoaGFzTmF0aXZlWSA/IFwieVwiIDogXCJcIikpLFxuICAgICAgICAgICAgaGFuZGxlcjogaGFuZGxlcixcbiAgICAgICAgICAgIHNjb3BlOiBzY29wZSB8fCBYUmVnRXhwLk9VVFNJREVfQ0xBU1MsXG4gICAgICAgICAgICB0cmlnZ2VyOiB0cmlnZ2VyIHx8IG51bGxcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8vIEFjY2VwdHMgYSBwYXR0ZXJuIGFuZCBmbGFnczsgcmV0dXJucyBhbiBleHRlbmRlZCBgUmVnRXhwYCBvYmplY3QuIElmIHRoZSBwYXR0ZXJuIGFuZCBmbGFnXG4gICAgLy8gY29tYmluYXRpb24gaGFzIHByZXZpb3VzbHkgYmVlbiBjYWNoZWQsIHRoZSBjYWNoZWQgY29weSBpcyByZXR1cm5lZDsgb3RoZXJ3aXNlIHRoZSBuZXdseVxuICAgIC8vIGNyZWF0ZWQgcmVnZXggaXMgY2FjaGVkXG4gICAgWFJlZ0V4cC5jYWNoZSA9IGZ1bmN0aW9uIChwYXR0ZXJuLCBmbGFncykge1xuICAgICAgICB2YXIga2V5ID0gcGF0dGVybiArIFwiL1wiICsgKGZsYWdzIHx8IFwiXCIpO1xuICAgICAgICByZXR1cm4gWFJlZ0V4cC5jYWNoZVtrZXldIHx8IChYUmVnRXhwLmNhY2hlW2tleV0gPSBYUmVnRXhwKHBhdHRlcm4sIGZsYWdzKSk7XG4gICAgfTtcblxuICAgIC8vIEFjY2VwdHMgYSBgUmVnRXhwYCBpbnN0YW5jZTsgcmV0dXJucyBhIGNvcHkgd2l0aCB0aGUgYC9nYCBmbGFnIHNldC4gVGhlIGNvcHkgaGFzIGEgZnJlc2hcbiAgICAvLyBgbGFzdEluZGV4YCAoc2V0IHRvIHplcm8pLiBJZiB5b3Ugd2FudCB0byBjb3B5IGEgcmVnZXggd2l0aG91dCBmb3JjaW5nIHRoZSBgZ2xvYmFsYFxuICAgIC8vIHByb3BlcnR5LCB1c2UgYFhSZWdFeHAocmVnZXgpYC4gRG8gbm90IHVzZSBgUmVnRXhwKHJlZ2V4KWAgYmVjYXVzZSBpdCB3aWxsIG5vdCBwcmVzZXJ2ZVxuICAgIC8vIHNwZWNpYWwgcHJvcGVydGllcyByZXF1aXJlZCBmb3IgbmFtZWQgY2FwdHVyZVxuICAgIFhSZWdFeHAuY29weUFzR2xvYmFsID0gZnVuY3Rpb24gKHJlZ2V4KSB7XG4gICAgICAgIHJldHVybiBjbG9uZShyZWdleCwgXCJnXCIpO1xuICAgIH07XG5cbiAgICAvLyBBY2NlcHRzIGEgc3RyaW5nOyByZXR1cm5zIHRoZSBzdHJpbmcgd2l0aCByZWdleCBtZXRhY2hhcmFjdGVycyBlc2NhcGVkLiBUaGUgcmV0dXJuZWQgc3RyaW5nXG4gICAgLy8gY2FuIHNhZmVseSBiZSB1c2VkIGF0IGFueSBwb2ludCB3aXRoaW4gYSByZWdleCB0byBtYXRjaCB0aGUgcHJvdmlkZWQgbGl0ZXJhbCBzdHJpbmcuIEVzY2FwZWRcbiAgICAvLyBjaGFyYWN0ZXJzIGFyZSBbIF0geyB9ICggKSAqICsgPyAtIC4gLCBcXCBeICQgfCAjIGFuZCB3aGl0ZXNwYWNlXG4gICAgWFJlZ0V4cC5lc2NhcGUgPSBmdW5jdGlvbiAoc3RyKSB7XG4gICAgICAgIHJldHVybiBzdHIucmVwbGFjZSgvWy1bXFxde30oKSorPy4sXFxcXF4kfCNcXHNdL2csIFwiXFxcXCQmXCIpO1xuICAgIH07XG5cbiAgICAvLyBBY2NlcHRzIGEgc3RyaW5nIHRvIHNlYXJjaCwgcmVnZXggdG8gc2VhcmNoIHdpdGgsIHBvc2l0aW9uIHRvIHN0YXJ0IHRoZSBzZWFyY2ggd2l0aGluIHRoZVxuICAgIC8vIHN0cmluZyAoZGVmYXVsdDogMCksIGFuZCBhbiBvcHRpb25hbCBCb29sZWFuIGluZGljYXRpbmcgd2hldGhlciBtYXRjaGVzIG11c3Qgc3RhcnQgYXQtb3ItXG4gICAgLy8gYWZ0ZXIgdGhlIHBvc2l0aW9uIG9yIGF0IHRoZSBzcGVjaWZpZWQgcG9zaXRpb24gb25seS4gVGhpcyBmdW5jdGlvbiBpZ25vcmVzIHRoZSBgbGFzdEluZGV4YFxuICAgIC8vIG9mIHRoZSBwcm92aWRlZCByZWdleCBpbiBpdHMgb3duIGhhbmRsaW5nLCBidXQgdXBkYXRlcyB0aGUgcHJvcGVydHkgZm9yIGNvbXBhdGliaWxpdHlcbiAgICBYUmVnRXhwLmV4ZWNBdCA9IGZ1bmN0aW9uIChzdHIsIHJlZ2V4LCBwb3MsIGFuY2hvcmVkKSB7XG4gICAgICAgIHZhciByMiA9IGNsb25lKHJlZ2V4LCBcImdcIiArICgoYW5jaG9yZWQgJiYgaGFzTmF0aXZlWSkgPyBcInlcIiA6IFwiXCIpKSxcbiAgICAgICAgICAgIG1hdGNoO1xuICAgICAgICByMi5sYXN0SW5kZXggPSBwb3MgPSBwb3MgfHwgMDtcbiAgICAgICAgbWF0Y2ggPSByMi5leGVjKHN0cik7IC8vIFJ1biB0aGUgYWx0ZXJlZCBgZXhlY2AgKHJlcXVpcmVkIGZvciBgbGFzdEluZGV4YCBmaXgsIGV0Yy4pXG4gICAgICAgIGlmIChhbmNob3JlZCAmJiBtYXRjaCAmJiBtYXRjaC5pbmRleCAhPT0gcG9zKVxuICAgICAgICAgICAgbWF0Y2ggPSBudWxsO1xuICAgICAgICBpZiAocmVnZXguZ2xvYmFsKVxuICAgICAgICAgICAgcmVnZXgubGFzdEluZGV4ID0gbWF0Y2ggPyByMi5sYXN0SW5kZXggOiAwO1xuICAgICAgICByZXR1cm4gbWF0Y2g7XG4gICAgfTtcblxuICAgIC8vIEJyZWFrcyB0aGUgdW5yZXN0b3JhYmxlIGxpbmsgdG8gWFJlZ0V4cCdzIHByaXZhdGUgbGlzdCBvZiB0b2tlbnMsIHRoZXJlYnkgcHJldmVudGluZ1xuICAgIC8vIHN5bnRheCBhbmQgZmxhZyBjaGFuZ2VzLiBTaG91bGQgYmUgcnVuIGFmdGVyIFhSZWdFeHAgYW5kIGFueSBwbHVnaW5zIGFyZSBsb2FkZWRcbiAgICBYUmVnRXhwLmZyZWV6ZVRva2VucyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgWFJlZ0V4cC5hZGRUb2tlbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRocm93IEVycm9yKFwiY2FuJ3QgcnVuIGFkZFRva2VuIGFmdGVyIGZyZWV6ZVRva2Vuc1wiKTtcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgLy8gQWNjZXB0cyBhbnkgdmFsdWU7IHJldHVybnMgYSBCb29sZWFuIGluZGljYXRpbmcgd2hldGhlciB0aGUgYXJndW1lbnQgaXMgYSBgUmVnRXhwYCBvYmplY3QuXG4gICAgLy8gTm90ZSB0aGF0IHRoaXMgaXMgYWxzbyBgdHJ1ZWAgZm9yIHJlZ2V4IGxpdGVyYWxzIGFuZCByZWdleGVzIGNyZWF0ZWQgYnkgdGhlIGBYUmVnRXhwYFxuICAgIC8vIGNvbnN0cnVjdG9yLiBUaGlzIHdvcmtzIGNvcnJlY3RseSBmb3IgdmFyaWFibGVzIGNyZWF0ZWQgaW4gYW5vdGhlciBmcmFtZSwgd2hlbiBgaW5zdGFuY2VvZmBcbiAgICAvLyBhbmQgYGNvbnN0cnVjdG9yYCBjaGVja3Mgd291bGQgZmFpbCB0byB3b3JrIGFzIGludGVuZGVkXG4gICAgWFJlZ0V4cC5pc1JlZ0V4cCA9IGZ1bmN0aW9uIChvKSB7XG4gICAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobykgPT09IFwiW29iamVjdCBSZWdFeHBdXCI7XG4gICAgfTtcblxuICAgIC8vIEV4ZWN1dGVzIGBjYWxsYmFja2Agb25jZSBwZXIgbWF0Y2ggd2l0aGluIGBzdHJgLiBQcm92aWRlcyBhIHNpbXBsZXIgYW5kIGNsZWFuZXIgd2F5IHRvXG4gICAgLy8gaXRlcmF0ZSBvdmVyIHJlZ2V4IG1hdGNoZXMgY29tcGFyZWQgdG8gdGhlIHRyYWRpdGlvbmFsIGFwcHJvYWNoZXMgb2Ygc3VidmVydGluZ1xuICAgIC8vIGBTdHJpbmcucHJvdG90eXBlLnJlcGxhY2VgIG9yIHJlcGVhdGVkbHkgY2FsbGluZyBgZXhlY2Agd2l0aGluIGEgYHdoaWxlYCBsb29wXG4gICAgWFJlZ0V4cC5pdGVyYXRlID0gZnVuY3Rpb24gKHN0ciwgcmVnZXgsIGNhbGxiYWNrLCBjb250ZXh0KSB7XG4gICAgICAgIHZhciByMiA9IGNsb25lKHJlZ2V4LCBcImdcIiksXG4gICAgICAgICAgICBpID0gLTEsIG1hdGNoO1xuICAgICAgICB3aGlsZSAobWF0Y2ggPSByMi5leGVjKHN0cikpIHsgLy8gUnVuIHRoZSBhbHRlcmVkIGBleGVjYCAocmVxdWlyZWQgZm9yIGBsYXN0SW5kZXhgIGZpeCwgZXRjLilcbiAgICAgICAgICAgIGlmIChyZWdleC5nbG9iYWwpXG4gICAgICAgICAgICAgICAgcmVnZXgubGFzdEluZGV4ID0gcjIubGFzdEluZGV4OyAvLyBEb2luZyB0aGlzIHRvIGZvbGxvdyBleHBlY3RhdGlvbnMgaWYgYGxhc3RJbmRleGAgaXMgY2hlY2tlZCB3aXRoaW4gYGNhbGxiYWNrYFxuICAgICAgICAgICAgY2FsbGJhY2suY2FsbChjb250ZXh0LCBtYXRjaCwgKytpLCBzdHIsIHJlZ2V4KTtcbiAgICAgICAgICAgIGlmIChyMi5sYXN0SW5kZXggPT09IG1hdGNoLmluZGV4KVxuICAgICAgICAgICAgICAgIHIyLmxhc3RJbmRleCsrO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZWdleC5nbG9iYWwpXG4gICAgICAgICAgICByZWdleC5sYXN0SW5kZXggPSAwO1xuICAgIH07XG5cbiAgICAvLyBBY2NlcHRzIGEgc3RyaW5nIGFuZCBhbiBhcnJheSBvZiByZWdleGVzOyByZXR1cm5zIHRoZSByZXN1bHQgb2YgdXNpbmcgZWFjaCBzdWNjZXNzaXZlIHJlZ2V4XG4gICAgLy8gdG8gc2VhcmNoIHdpdGhpbiB0aGUgbWF0Y2hlcyBvZiB0aGUgcHJldmlvdXMgcmVnZXguIFRoZSBhcnJheSBvZiByZWdleGVzIGNhbiBhbHNvIGNvbnRhaW5cbiAgICAvLyBvYmplY3RzIHdpdGggYHJlZ2V4YCBhbmQgYGJhY2tyZWZgIHByb3BlcnRpZXMsIGluIHdoaWNoIGNhc2UgdGhlIG5hbWVkIG9yIG51bWJlcmVkIGJhY2stXG4gICAgLy8gcmVmZXJlbmNlcyBzcGVjaWZpZWQgYXJlIHBhc3NlZCBmb3J3YXJkIHRvIHRoZSBuZXh0IHJlZ2V4IG9yIHJldHVybmVkLiBFLmcuOlxuICAgIC8vIHZhciB4cmVnZXhwSW1nRmlsZU5hbWVzID0gWFJlZ0V4cC5tYXRjaENoYWluKGh0bWwsIFtcbiAgICAvLyAgICAge3JlZ2V4OiAvPGltZ1xcYihbXj5dKyk+L2ksIGJhY2tyZWY6IDF9LCAvLyA8aW1nPiB0YWcgYXR0cmlidXRlc1xuICAgIC8vICAgICB7cmVnZXg6IFhSZWdFeHAoJyg/aXgpIFxcXFxzIHNyYz1cIiAoPzxzcmM+IFteXCJdKyApJyksIGJhY2tyZWY6IFwic3JjXCJ9LCAvLyBzcmMgYXR0cmlidXRlIHZhbHVlc1xuICAgIC8vICAgICB7cmVnZXg6IFhSZWdFeHAoXCJeaHR0cDovL3hyZWdleHBcXFxcLmNvbSgvW14jP10rKVwiLCBcImlcIiksIGJhY2tyZWY6IDF9LCAvLyB4cmVnZXhwLmNvbSBwYXRoc1xuICAgIC8vICAgICAvW15cXC9dKyQvIC8vIGZpbGVuYW1lcyAoc3RyaXAgZGlyZWN0b3J5IHBhdGhzKVxuICAgIC8vIF0pO1xuICAgIFhSZWdFeHAubWF0Y2hDaGFpbiA9IGZ1bmN0aW9uIChzdHIsIGNoYWluKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiByZWN1cnNlQ2hhaW4gKHZhbHVlcywgbGV2ZWwpIHtcbiAgICAgICAgICAgIHZhciBpdGVtID0gY2hhaW5bbGV2ZWxdLnJlZ2V4ID8gY2hhaW5bbGV2ZWxdIDoge3JlZ2V4OiBjaGFpbltsZXZlbF19LFxuICAgICAgICAgICAgICAgIHJlZ2V4ID0gY2xvbmUoaXRlbS5yZWdleCwgXCJnXCIpLFxuICAgICAgICAgICAgICAgIG1hdGNoZXMgPSBbXSwgaTtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCB2YWx1ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBYUmVnRXhwLml0ZXJhdGUodmFsdWVzW2ldLCByZWdleCwgZnVuY3Rpb24gKG1hdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgIG1hdGNoZXMucHVzaChpdGVtLmJhY2tyZWYgPyAobWF0Y2hbaXRlbS5iYWNrcmVmXSB8fCBcIlwiKSA6IG1hdGNoWzBdKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAoKGxldmVsID09PSBjaGFpbi5sZW5ndGggLSAxKSB8fCAhbWF0Y2hlcy5sZW5ndGgpID9cbiAgICAgICAgICAgICAgICBtYXRjaGVzIDogcmVjdXJzZUNoYWluKG1hdGNoZXMsIGxldmVsICsgMSk7XG4gICAgICAgIH0oW3N0cl0sIDApO1xuICAgIH07XG5cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gIE5ldyBSZWdFeHAgcHJvdG90eXBlIG1ldGhvZHNcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gICAgLy8gQWNjZXB0cyBhIGNvbnRleHQgb2JqZWN0IGFuZCBhcmd1bWVudHMgYXJyYXk7IHJldHVybnMgdGhlIHJlc3VsdCBvZiBjYWxsaW5nIGBleGVjYCB3aXRoIHRoZVxuICAgIC8vIGZpcnN0IHZhbHVlIGluIHRoZSBhcmd1bWVudHMgYXJyYXkuIHRoZSBjb250ZXh0IGlzIGlnbm9yZWQgYnV0IGlzIGFjY2VwdGVkIGZvciBjb25ncnVpdHlcbiAgICAvLyB3aXRoIGBGdW5jdGlvbi5wcm90b3R5cGUuYXBwbHlgXG4gICAgUmVnRXhwLnByb3RvdHlwZS5hcHBseSA9IGZ1bmN0aW9uIChjb250ZXh0LCBhcmdzKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmV4ZWMoYXJnc1swXSk7XG4gICAgfTtcblxuICAgIC8vIEFjY2VwdHMgYSBjb250ZXh0IG9iamVjdCBhbmQgc3RyaW5nOyByZXR1cm5zIHRoZSByZXN1bHQgb2YgY2FsbGluZyBgZXhlY2Agd2l0aCB0aGUgcHJvdmlkZWRcbiAgICAvLyBzdHJpbmcuIHRoZSBjb250ZXh0IGlzIGlnbm9yZWQgYnV0IGlzIGFjY2VwdGVkIGZvciBjb25ncnVpdHkgd2l0aCBgRnVuY3Rpb24ucHJvdG90eXBlLmNhbGxgXG4gICAgUmVnRXhwLnByb3RvdHlwZS5jYWxsID0gZnVuY3Rpb24gKGNvbnRleHQsIHN0cikge1xuICAgICAgICByZXR1cm4gdGhpcy5leGVjKHN0cik7XG4gICAgfTtcblxuXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyAgT3ZlcnJpZGVuIG5hdGl2ZSBtZXRob2RzXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAgIC8vIEFkZHMgbmFtZWQgY2FwdHVyZSBzdXBwb3J0ICh3aXRoIGJhY2tyZWZlcmVuY2VzIHJldHVybmVkIGFzIGByZXN1bHQubmFtZWApLCBhbmQgZml4ZXMgdHdvXG4gICAgLy8gY3Jvc3MtYnJvd3NlciBpc3N1ZXMgcGVyIEVTMzpcbiAgICAvLyAtIENhcHR1cmVkIHZhbHVlcyBmb3Igbm9ucGFydGljaXBhdGluZyBjYXB0dXJpbmcgZ3JvdXBzIHNob3VsZCBiZSByZXR1cm5lZCBhcyBgdW5kZWZpbmVkYCxcbiAgICAvLyAgIHJhdGhlciB0aGFuIHRoZSBlbXB0eSBzdHJpbmcuXG4gICAgLy8gLSBgbGFzdEluZGV4YCBzaG91bGQgbm90IGJlIGluY3JlbWVudGVkIGFmdGVyIHplcm8tbGVuZ3RoIG1hdGNoZXMuXG4gICAgUmVnRXhwLnByb3RvdHlwZS5leGVjID0gZnVuY3Rpb24gKHN0cikge1xuICAgICAgICB2YXIgbWF0Y2gsIG5hbWUsIHIyLCBvcmlnTGFzdEluZGV4O1xuICAgICAgICBpZiAoIXRoaXMuZ2xvYmFsKVxuICAgICAgICAgICAgb3JpZ0xhc3RJbmRleCA9IHRoaXMubGFzdEluZGV4O1xuICAgICAgICBtYXRjaCA9IG5hdGl2LmV4ZWMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICAvLyBGaXggYnJvd3NlcnMgd2hvc2UgYGV4ZWNgIG1ldGhvZHMgZG9uJ3QgY29uc2lzdGVudGx5IHJldHVybiBgdW5kZWZpbmVkYCBmb3JcbiAgICAgICAgICAgIC8vIG5vbnBhcnRpY2lwYXRpbmcgY2FwdHVyaW5nIGdyb3Vwc1xuICAgICAgICAgICAgaWYgKCFjb21wbGlhbnRFeGVjTnBjZyAmJiBtYXRjaC5sZW5ndGggPiAxICYmIGluZGV4T2YobWF0Y2gsIFwiXCIpID4gLTEpIHtcbiAgICAgICAgICAgICAgICByMiA9IFJlZ0V4cCh0aGlzLnNvdXJjZSwgbmF0aXYucmVwbGFjZS5jYWxsKGdldE5hdGl2ZUZsYWdzKHRoaXMpLCBcImdcIiwgXCJcIikpO1xuICAgICAgICAgICAgICAgIC8vIFVzaW5nIGBzdHIuc2xpY2UobWF0Y2guaW5kZXgpYCByYXRoZXIgdGhhbiBgbWF0Y2hbMF1gIGluIGNhc2UgbG9va2FoZWFkIGFsbG93ZWRcbiAgICAgICAgICAgICAgICAvLyBtYXRjaGluZyBkdWUgdG8gY2hhcmFjdGVycyBvdXRzaWRlIHRoZSBtYXRjaFxuICAgICAgICAgICAgICAgIG5hdGl2LnJlcGxhY2UuY2FsbCgoc3RyICsgXCJcIikuc2xpY2UobWF0Y2guaW5kZXgpLCByMiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGggLSAyOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhcmd1bWVudHNbaV0gPT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaFtpXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gQXR0YWNoIG5hbWVkIGNhcHR1cmUgcHJvcGVydGllc1xuICAgICAgICAgICAgaWYgKHRoaXMuX3hyZWdleHAgJiYgdGhpcy5feHJlZ2V4cC5jYXB0dXJlTmFtZXMpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IG1hdGNoLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWUgPSB0aGlzLl94cmVnZXhwLmNhcHR1cmVOYW1lc1tpIC0gMV07XG4gICAgICAgICAgICAgICAgICAgIGlmIChuYW1lKVxuICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hbbmFtZV0gPSBtYXRjaFtpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBGaXggYnJvd3NlcnMgdGhhdCBpbmNyZW1lbnQgYGxhc3RJbmRleGAgYWZ0ZXIgemVyby1sZW5ndGggbWF0Y2hlc1xuICAgICAgICAgICAgaWYgKCFjb21wbGlhbnRMYXN0SW5kZXhJbmNyZW1lbnQgJiYgdGhpcy5nbG9iYWwgJiYgIW1hdGNoWzBdLmxlbmd0aCAmJiAodGhpcy5sYXN0SW5kZXggPiBtYXRjaC5pbmRleCkpXG4gICAgICAgICAgICAgICAgdGhpcy5sYXN0SW5kZXgtLTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuZ2xvYmFsKVxuICAgICAgICAgICAgdGhpcy5sYXN0SW5kZXggPSBvcmlnTGFzdEluZGV4OyAvLyBGaXggSUUsIE9wZXJhIGJ1ZyAobGFzdCB0ZXN0ZWQgSUUgOS4wLjUsIE9wZXJhIDExLjYxIG9uIFdpbmRvd3MpXG4gICAgICAgIHJldHVybiBtYXRjaDtcbiAgICB9O1xuXG4gICAgLy8gRml4IGJyb3dzZXIgYnVncyBpbiBuYXRpdmUgbWV0aG9kXG4gICAgUmVnRXhwLnByb3RvdHlwZS50ZXN0ID0gZnVuY3Rpb24gKHN0cikge1xuICAgICAgICAvLyBVc2UgdGhlIG5hdGl2ZSBgZXhlY2AgdG8gc2tpcCBzb21lIHByb2Nlc3Npbmcgb3ZlcmhlYWQsIGV2ZW4gdGhvdWdoIHRoZSBhbHRlcmVkXG4gICAgICAgIC8vIGBleGVjYCB3b3VsZCB0YWtlIGNhcmUgb2YgdGhlIGBsYXN0SW5kZXhgIGZpeGVzXG4gICAgICAgIHZhciBtYXRjaCwgb3JpZ0xhc3RJbmRleDtcbiAgICAgICAgaWYgKCF0aGlzLmdsb2JhbClcbiAgICAgICAgICAgIG9yaWdMYXN0SW5kZXggPSB0aGlzLmxhc3RJbmRleDtcbiAgICAgICAgbWF0Y2ggPSBuYXRpdi5leGVjLmNhbGwodGhpcywgc3RyKTtcbiAgICAgICAgLy8gRml4IGJyb3dzZXJzIHRoYXQgaW5jcmVtZW50IGBsYXN0SW5kZXhgIGFmdGVyIHplcm8tbGVuZ3RoIG1hdGNoZXNcbiAgICAgICAgaWYgKG1hdGNoICYmICFjb21wbGlhbnRMYXN0SW5kZXhJbmNyZW1lbnQgJiYgdGhpcy5nbG9iYWwgJiYgIW1hdGNoWzBdLmxlbmd0aCAmJiAodGhpcy5sYXN0SW5kZXggPiBtYXRjaC5pbmRleCkpXG4gICAgICAgICAgICB0aGlzLmxhc3RJbmRleC0tO1xuICAgICAgICBpZiAoIXRoaXMuZ2xvYmFsKVxuICAgICAgICAgICAgdGhpcy5sYXN0SW5kZXggPSBvcmlnTGFzdEluZGV4OyAvLyBGaXggSUUsIE9wZXJhIGJ1ZyAobGFzdCB0ZXN0ZWQgSUUgOS4wLjUsIE9wZXJhIDExLjYxIG9uIFdpbmRvd3MpXG4gICAgICAgIHJldHVybiAhIW1hdGNoO1xuICAgIH07XG5cbiAgICAvLyBBZGRzIG5hbWVkIGNhcHR1cmUgc3VwcG9ydCBhbmQgZml4ZXMgYnJvd3NlciBidWdzIGluIG5hdGl2ZSBtZXRob2RcbiAgICBTdHJpbmcucHJvdG90eXBlLm1hdGNoID0gZnVuY3Rpb24gKHJlZ2V4KSB7XG4gICAgICAgIGlmICghWFJlZ0V4cC5pc1JlZ0V4cChyZWdleCkpXG4gICAgICAgICAgICByZWdleCA9IFJlZ0V4cChyZWdleCk7IC8vIE5hdGl2ZSBgUmVnRXhwYFxuICAgICAgICBpZiAocmVnZXguZ2xvYmFsKSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gbmF0aXYubWF0Y2guYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIHJlZ2V4Lmxhc3RJbmRleCA9IDA7IC8vIEZpeCBJRSBidWdcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlZ2V4LmV4ZWModGhpcyk7IC8vIFJ1biB0aGUgYWx0ZXJlZCBgZXhlY2BcbiAgICB9O1xuXG4gICAgLy8gQWRkcyBzdXBwb3J0IGZvciBgJHtufWAgdG9rZW5zIGZvciBuYW1lZCBhbmQgbnVtYmVyZWQgYmFja3JlZmVyZW5jZXMgaW4gcmVwbGFjZW1lbnQgdGV4dCxcbiAgICAvLyBhbmQgcHJvdmlkZXMgbmFtZWQgYmFja3JlZmVyZW5jZXMgdG8gcmVwbGFjZW1lbnQgZnVuY3Rpb25zIGFzIGBhcmd1bWVudHNbMF0ubmFtZWAuIEFsc29cbiAgICAvLyBmaXhlcyBjcm9zcy1icm93c2VyIGRpZmZlcmVuY2VzIGluIHJlcGxhY2VtZW50IHRleHQgc3ludGF4IHdoZW4gcGVyZm9ybWluZyBhIHJlcGxhY2VtZW50XG4gICAgLy8gdXNpbmcgYSBub25yZWdleCBzZWFyY2ggdmFsdWUsIGFuZCB0aGUgdmFsdWUgb2YgcmVwbGFjZW1lbnQgcmVnZXhlcycgYGxhc3RJbmRleGAgcHJvcGVydHlcbiAgICAvLyBkdXJpbmcgcmVwbGFjZW1lbnQgaXRlcmF0aW9ucy4gTm90ZSB0aGF0IHRoaXMgZG9lc24ndCBzdXBwb3J0IFNwaWRlck1vbmtleSdzIHByb3ByaWV0YXJ5XG4gICAgLy8gdGhpcmQgKGBmbGFnc2ApIHBhcmFtZXRlclxuICAgIFN0cmluZy5wcm90b3R5cGUucmVwbGFjZSA9IGZ1bmN0aW9uIChzZWFyY2gsIHJlcGxhY2VtZW50KSB7XG4gICAgICAgIHZhciBpc1JlZ2V4ID0gWFJlZ0V4cC5pc1JlZ0V4cChzZWFyY2gpLFxuICAgICAgICAgICAgY2FwdHVyZU5hbWVzLCByZXN1bHQsIHN0ciwgb3JpZ0xhc3RJbmRleDtcblxuICAgICAgICAvLyBUaGVyZSBhcmUgdG9vIG1hbnkgY29tYmluYXRpb25zIG9mIHNlYXJjaC9yZXBsYWNlbWVudCB0eXBlcy92YWx1ZXMgYW5kIGJyb3dzZXIgYnVncyB0aGF0XG4gICAgICAgIC8vIHByZWNsdWRlIHBhc3NpbmcgdG8gbmF0aXZlIGByZXBsYWNlYCwgc28gZG9uJ3QgdHJ5XG4gICAgICAgIC8vaWYgKC4uLilcbiAgICAgICAgLy8gICAgcmV0dXJuIG5hdGl2LnJlcGxhY2UuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgICAgICBpZiAoaXNSZWdleCkge1xuICAgICAgICAgICAgaWYgKHNlYXJjaC5feHJlZ2V4cClcbiAgICAgICAgICAgICAgICBjYXB0dXJlTmFtZXMgPSBzZWFyY2guX3hyZWdleHAuY2FwdHVyZU5hbWVzOyAvLyBBcnJheSBvciBgbnVsbGBcbiAgICAgICAgICAgIGlmICghc2VhcmNoLmdsb2JhbClcbiAgICAgICAgICAgICAgICBvcmlnTGFzdEluZGV4ID0gc2VhcmNoLmxhc3RJbmRleDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNlYXJjaCA9IHNlYXJjaCArIFwiXCI7IC8vIFR5cGUgY29udmVyc2lvblxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChyZXBsYWNlbWVudCkgPT09IFwiW29iamVjdCBGdW5jdGlvbl1cIikge1xuICAgICAgICAgICAgcmVzdWx0ID0gbmF0aXYucmVwbGFjZS5jYWxsKHRoaXMgKyBcIlwiLCBzZWFyY2gsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoY2FwdHVyZU5hbWVzKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIENoYW5nZSB0aGUgYGFyZ3VtZW50c1swXWAgc3RyaW5nIHByaW1pdGl2ZSB0byBhIFN0cmluZyBvYmplY3Qgd2hpY2ggY2FuIHN0b3JlIHByb3BlcnRpZXNcbiAgICAgICAgICAgICAgICAgICAgYXJndW1lbnRzWzBdID0gbmV3IFN0cmluZyhhcmd1bWVudHNbMF0pO1xuICAgICAgICAgICAgICAgICAgICAvLyBTdG9yZSBuYW1lZCBiYWNrcmVmZXJlbmNlcyBvbiBgYXJndW1lbnRzWzBdYFxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhcHR1cmVOYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNhcHR1cmVOYW1lc1tpXSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmd1bWVudHNbMF1bY2FwdHVyZU5hbWVzW2ldXSA9IGFyZ3VtZW50c1tpICsgMV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gVXBkYXRlIGBsYXN0SW5kZXhgIGJlZm9yZSBjYWxsaW5nIGByZXBsYWNlbWVudGAgKGZpeCBicm93c2VycylcbiAgICAgICAgICAgICAgICBpZiAoaXNSZWdleCAmJiBzZWFyY2guZ2xvYmFsKVxuICAgICAgICAgICAgICAgICAgICBzZWFyY2gubGFzdEluZGV4ID0gYXJndW1lbnRzW2FyZ3VtZW50cy5sZW5ndGggLSAyXSArIGFyZ3VtZW50c1swXS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcGxhY2VtZW50LmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN0ciA9IHRoaXMgKyBcIlwiOyAvLyBUeXBlIGNvbnZlcnNpb24sIHNvIGBhcmdzW2FyZ3MubGVuZ3RoIC0gMV1gIHdpbGwgYmUgYSBzdHJpbmcgKGdpdmVuIG5vbnN0cmluZyBgdGhpc2ApXG4gICAgICAgICAgICByZXN1bHQgPSBuYXRpdi5yZXBsYWNlLmNhbGwoc3RyLCBzZWFyY2gsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgYXJncyA9IGFyZ3VtZW50czsgLy8gS2VlcCB0aGlzIGZ1bmN0aW9uJ3MgYGFyZ3VtZW50c2AgYXZhaWxhYmxlIHRocm91Z2ggY2xvc3VyZVxuICAgICAgICAgICAgICAgIHJldHVybiBuYXRpdi5yZXBsYWNlLmNhbGwocmVwbGFjZW1lbnQgKyBcIlwiLCByZXBsYWNlbWVudFRva2VuLCBmdW5jdGlvbiAoJDAsICQxLCAkMikge1xuICAgICAgICAgICAgICAgICAgICAvLyBOdW1iZXJlZCBiYWNrcmVmZXJlbmNlICh3aXRob3V0IGRlbGltaXRlcnMpIG9yIHNwZWNpYWwgdmFyaWFibGVcbiAgICAgICAgICAgICAgICAgICAgaWYgKCQxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKCQxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIiRcIjogcmV0dXJuIFwiJFwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCImXCI6IHJldHVybiBhcmdzWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJgXCI6IHJldHVybiBhcmdzW2FyZ3MubGVuZ3RoIC0gMV0uc2xpY2UoMCwgYXJnc1thcmdzLmxlbmd0aCAtIDJdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiJ1wiOiByZXR1cm4gYXJnc1thcmdzLmxlbmd0aCAtIDFdLnNsaWNlKGFyZ3NbYXJncy5sZW5ndGggLSAyXSArIGFyZ3NbMF0ubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBOdW1iZXJlZCBiYWNrcmVmZXJlbmNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2hhdCBkb2VzIFwiJDEwXCIgbWVhbj9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gLSBCYWNrcmVmZXJlbmNlIDEwLCBpZiAxMCBvciBtb3JlIGNhcHR1cmluZyBncm91cHMgZXhpc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gLSBCYWNrcmVmZXJlbmNlIDEgZm9sbG93ZWQgYnkgXCIwXCIsIGlmIDEtOSBjYXB0dXJpbmcgZ3JvdXBzIGV4aXN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIC0gT3RoZXJ3aXNlLCBpdCdzIHRoZSBzdHJpbmcgXCIkMTBcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBbHNvIG5vdGU6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIC0gQmFja3JlZmVyZW5jZXMgY2Fubm90IGJlIG1vcmUgdGhhbiB0d28gZGlnaXRzIChlbmZvcmNlZCBieSBgcmVwbGFjZW1lbnRUb2tlbmApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIC0gXCIkMDFcIiBpcyBlcXVpdmFsZW50IHRvIFwiJDFcIiBpZiBhIGNhcHR1cmluZyBncm91cCBleGlzdHMsIG90aGVyd2lzZSBpdCdzIHRoZSBzdHJpbmcgXCIkMDFcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAtIFRoZXJlIGlzIG5vIFwiJDBcIiB0b2tlbiAoXCIkJlwiIGlzIHRoZSBlbnRpcmUgbWF0Y2gpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsaXRlcmFsTnVtYmVycyA9IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQxID0gKyQxOyAvLyBUeXBlIGNvbnZlcnNpb247IGRyb3AgbGVhZGluZyB6ZXJvXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghJDEpIC8vIGAkMWAgd2FzIFwiMFwiIG9yIFwiMDBcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICQwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoJDEgPiBhcmdzLmxlbmd0aCAtIDMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpdGVyYWxOdW1iZXJzID0gU3RyaW5nLnByb3RvdHlwZS5zbGljZS5jYWxsKCQxLCAtMSkgKyBsaXRlcmFsTnVtYmVycztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQxID0gTWF0aC5mbG9vcigkMSAvIDEwKTsgLy8gRHJvcCB0aGUgbGFzdCBkaWdpdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoJDEgPyBhcmdzWyQxXSB8fCBcIlwiIDogXCIkXCIpICsgbGl0ZXJhbE51bWJlcnM7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBOYW1lZCBiYWNrcmVmZXJlbmNlIG9yIGRlbGltaXRlZCBudW1iZXJlZCBiYWNrcmVmZXJlbmNlXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBXaGF0IGRvZXMgXCIke259XCIgbWVhbj9cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIC0gQmFja3JlZmVyZW5jZSB0byBudW1iZXJlZCBjYXB0dXJlIG4uIFR3byBkaWZmZXJlbmNlcyBmcm9tIFwiJG5cIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgLSBuIGNhbiBiZSBtb3JlIHRoYW4gdHdvIGRpZ2l0c1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAtIEJhY2tyZWZlcmVuY2UgMCBpcyBhbGxvd2VkLCBhbmQgaXMgdGhlIGVudGlyZSBtYXRjaFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gLSBCYWNrcmVmZXJlbmNlIHRvIG5hbWVkIGNhcHR1cmUgbiwgaWYgaXQgZXhpc3RzIGFuZCBpcyBub3QgYSBudW1iZXIgb3ZlcnJpZGRlbiBieSBudW1iZXJlZCBjYXB0dXJlXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAtIE90aGVyd2lzZSwgaXQncyB0aGUgc3RyaW5nIFwiJHtufVwiXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbiA9ICskMjsgLy8gVHlwZSBjb252ZXJzaW9uOyBkcm9wIGxlYWRpbmcgemVyb3NcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuIDw9IGFyZ3MubGVuZ3RoIC0gMylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXJnc1tuXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG4gPSBjYXB0dXJlTmFtZXMgPyBpbmRleE9mKGNhcHR1cmVOYW1lcywgJDIpIDogLTE7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbiA+IC0xID8gYXJnc1tuICsgMV0gOiAkMDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXNSZWdleCkge1xuICAgICAgICAgICAgaWYgKHNlYXJjaC5nbG9iYWwpXG4gICAgICAgICAgICAgICAgc2VhcmNoLmxhc3RJbmRleCA9IDA7IC8vIEZpeCBJRSwgU2FmYXJpIGJ1ZyAobGFzdCB0ZXN0ZWQgSUUgOS4wLjUsIFNhZmFyaSA1LjEuMiBvbiBXaW5kb3dzKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHNlYXJjaC5sYXN0SW5kZXggPSBvcmlnTGFzdEluZGV4OyAvLyBGaXggSUUsIE9wZXJhIGJ1ZyAobGFzdCB0ZXN0ZWQgSUUgOS4wLjUsIE9wZXJhIDExLjYxIG9uIFdpbmRvd3MpXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG5cbiAgICAvLyBBIGNvbnNpc3RlbnQgY3Jvc3MtYnJvd3NlciwgRVMzIGNvbXBsaWFudCBgc3BsaXRgXG4gICAgU3RyaW5nLnByb3RvdHlwZS5zcGxpdCA9IGZ1bmN0aW9uIChzIC8qIHNlcGFyYXRvciAqLywgbGltaXQpIHtcbiAgICAgICAgLy8gSWYgc2VwYXJhdG9yIGBzYCBpcyBub3QgYSByZWdleCwgdXNlIHRoZSBuYXRpdmUgYHNwbGl0YFxuICAgICAgICBpZiAoIVhSZWdFeHAuaXNSZWdFeHAocykpXG4gICAgICAgICAgICByZXR1cm4gbmF0aXYuc3BsaXQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgICAgICB2YXIgc3RyID0gdGhpcyArIFwiXCIsIC8vIFR5cGUgY29udmVyc2lvblxuICAgICAgICAgICAgb3V0cHV0ID0gW10sXG4gICAgICAgICAgICBsYXN0TGFzdEluZGV4ID0gMCxcbiAgICAgICAgICAgIG1hdGNoLCBsYXN0TGVuZ3RoO1xuXG4gICAgICAgIC8vIEJlaGF2aW9yIGZvciBgbGltaXRgOiBpZiBpdCdzLi4uXG4gICAgICAgIC8vIC0gYHVuZGVmaW5lZGA6IE5vIGxpbWl0XG4gICAgICAgIC8vIC0gYE5hTmAgb3IgemVybzogUmV0dXJuIGFuIGVtcHR5IGFycmF5XG4gICAgICAgIC8vIC0gQSBwb3NpdGl2ZSBudW1iZXI6IFVzZSBgTWF0aC5mbG9vcihsaW1pdClgXG4gICAgICAgIC8vIC0gQSBuZWdhdGl2ZSBudW1iZXI6IE5vIGxpbWl0XG4gICAgICAgIC8vIC0gT3RoZXI6IFR5cGUtY29udmVydCwgdGhlbiB1c2UgdGhlIGFib3ZlIHJ1bGVzXG4gICAgICAgIGlmIChsaW1pdCA9PT0gdW5kZWZpbmVkIHx8ICtsaW1pdCA8IDApIHtcbiAgICAgICAgICAgIGxpbWl0ID0gSW5maW5pdHk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsaW1pdCA9IE1hdGguZmxvb3IoK2xpbWl0KTtcbiAgICAgICAgICAgIGlmICghbGltaXQpXG4gICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGhpcyBpcyByZXF1aXJlZCBpZiBub3QgYHMuZ2xvYmFsYCwgYW5kIGl0IGF2b2lkcyBuZWVkaW5nIHRvIHNldCBgcy5sYXN0SW5kZXhgIHRvIHplcm9cbiAgICAgICAgLy8gYW5kIHJlc3RvcmUgaXQgdG8gaXRzIG9yaWdpbmFsIHZhbHVlIHdoZW4gd2UncmUgZG9uZSB1c2luZyB0aGUgcmVnZXhcbiAgICAgICAgcyA9IFhSZWdFeHAuY29weUFzR2xvYmFsKHMpO1xuXG4gICAgICAgIHdoaWxlIChtYXRjaCA9IHMuZXhlYyhzdHIpKSB7IC8vIFJ1biB0aGUgYWx0ZXJlZCBgZXhlY2AgKHJlcXVpcmVkIGZvciBgbGFzdEluZGV4YCBmaXgsIGV0Yy4pXG4gICAgICAgICAgICBpZiAocy5sYXN0SW5kZXggPiBsYXN0TGFzdEluZGV4KSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0LnB1c2goc3RyLnNsaWNlKGxhc3RMYXN0SW5kZXgsIG1hdGNoLmluZGV4KSk7XG5cbiAgICAgICAgICAgICAgICBpZiAobWF0Y2gubGVuZ3RoID4gMSAmJiBtYXRjaC5pbmRleCA8IHN0ci5sZW5ndGgpXG4gICAgICAgICAgICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KG91dHB1dCwgbWF0Y2guc2xpY2UoMSkpO1xuXG4gICAgICAgICAgICAgICAgbGFzdExlbmd0aCA9IG1hdGNoWzBdLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBsYXN0TGFzdEluZGV4ID0gcy5sYXN0SW5kZXg7XG5cbiAgICAgICAgICAgICAgICBpZiAob3V0cHV0Lmxlbmd0aCA+PSBsaW1pdClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzLmxhc3RJbmRleCA9PT0gbWF0Y2guaW5kZXgpXG4gICAgICAgICAgICAgICAgcy5sYXN0SW5kZXgrKztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChsYXN0TGFzdEluZGV4ID09PSBzdHIubGVuZ3RoKSB7XG4gICAgICAgICAgICBpZiAoIW5hdGl2LnRlc3QuY2FsbChzLCBcIlwiKSB8fCBsYXN0TGVuZ3RoKVxuICAgICAgICAgICAgICAgIG91dHB1dC5wdXNoKFwiXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb3V0cHV0LnB1c2goc3RyLnNsaWNlKGxhc3RMYXN0SW5kZXgpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBvdXRwdXQubGVuZ3RoID4gbGltaXQgPyBvdXRwdXQuc2xpY2UoMCwgbGltaXQpIDogb3V0cHV0O1xuICAgIH07XG5cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gIFByaXZhdGUgaGVscGVyIGZ1bmN0aW9uc1xuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgICAvLyBTdXBwb3J0aW5nIGZ1bmN0aW9uIGZvciBgWFJlZ0V4cGAsIGBYUmVnRXhwLmNvcHlBc0dsb2JhbGAsIGV0Yy4gUmV0dXJucyBhIGNvcHkgb2YgYSBgUmVnRXhwYFxuICAgIC8vIGluc3RhbmNlIHdpdGggYSBmcmVzaCBgbGFzdEluZGV4YCAoc2V0IHRvIHplcm8pLCBwcmVzZXJ2aW5nIHByb3BlcnRpZXMgcmVxdWlyZWQgZm9yIG5hbWVkXG4gICAgLy8gY2FwdHVyZS4gQWxzbyBhbGxvd3MgYWRkaW5nIG5ldyBmbGFncyBpbiB0aGUgcHJvY2VzcyBvZiBjb3B5aW5nIHRoZSByZWdleFxuICAgIGZ1bmN0aW9uIGNsb25lIChyZWdleCwgYWRkaXRpb25hbEZsYWdzKSB7XG4gICAgICAgIGlmICghWFJlZ0V4cC5pc1JlZ0V4cChyZWdleCkpXG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoXCJ0eXBlIFJlZ0V4cCBleHBlY3RlZFwiKTtcbiAgICAgICAgdmFyIHggPSByZWdleC5feHJlZ2V4cDtcbiAgICAgICAgcmVnZXggPSBYUmVnRXhwKHJlZ2V4LnNvdXJjZSwgZ2V0TmF0aXZlRmxhZ3MocmVnZXgpICsgKGFkZGl0aW9uYWxGbGFncyB8fCBcIlwiKSk7XG4gICAgICAgIGlmICh4KSB7XG4gICAgICAgICAgICByZWdleC5feHJlZ2V4cCA9IHtcbiAgICAgICAgICAgICAgICBzb3VyY2U6IHguc291cmNlLFxuICAgICAgICAgICAgICAgIGNhcHR1cmVOYW1lczogeC5jYXB0dXJlTmFtZXMgPyB4LmNhcHR1cmVOYW1lcy5zbGljZSgwKSA6IG51bGxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlZ2V4O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldE5hdGl2ZUZsYWdzIChyZWdleCkge1xuICAgICAgICByZXR1cm4gKHJlZ2V4Lmdsb2JhbCAgICAgPyBcImdcIiA6IFwiXCIpICtcbiAgICAgICAgICAgIChyZWdleC5pZ25vcmVDYXNlID8gXCJpXCIgOiBcIlwiKSArXG4gICAgICAgICAgICAocmVnZXgubXVsdGlsaW5lICA/IFwibVwiIDogXCJcIikgK1xuICAgICAgICAgICAgKHJlZ2V4LmV4dGVuZGVkICAgPyBcInhcIiA6IFwiXCIpICsgLy8gUHJvcG9zZWQgZm9yIEVTNDsgaW5jbHVkZWQgaW4gQVMzXG4gICAgICAgICAgICAocmVnZXguc3RpY2t5ICAgICA/IFwieVwiIDogXCJcIik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcnVuVG9rZW5zIChwYXR0ZXJuLCBpbmRleCwgc2NvcGUsIGNvbnRleHQpIHtcbiAgICAgICAgdmFyIGkgPSB0b2tlbnMubGVuZ3RoLFxuICAgICAgICAgICAgcmVzdWx0LCBtYXRjaCwgdDtcbiAgICAgICAgLy8gUHJvdGVjdCBhZ2FpbnN0IGNvbnN0cnVjdGluZyBYUmVnRXhwcyB3aXRoaW4gdG9rZW4gaGFuZGxlciBhbmQgdHJpZ2dlciBmdW5jdGlvbnNcbiAgICAgICAgaXNJbnNpZGVDb25zdHJ1Y3RvciA9IHRydWU7XG4gICAgICAgIC8vIE11c3QgcmVzZXQgYGlzSW5zaWRlQ29uc3RydWN0b3JgLCBldmVuIGlmIGEgYHRyaWdnZXJgIG9yIGBoYW5kbGVyYCB0aHJvd3NcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHdoaWxlIChpLS0pIHsgLy8gUnVuIGluIHJldmVyc2Ugb3JkZXJcbiAgICAgICAgICAgICAgICB0ID0gdG9rZW5zW2ldO1xuICAgICAgICAgICAgICAgIGlmICgoc2NvcGUgJiB0LnNjb3BlKSAmJiAoIXQudHJpZ2dlciB8fCB0LnRyaWdnZXIuY2FsbChjb250ZXh0KSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdC5wYXR0ZXJuLmxhc3RJbmRleCA9IGluZGV4O1xuICAgICAgICAgICAgICAgICAgICBtYXRjaCA9IHQucGF0dGVybi5leGVjKHBhdHRlcm4pOyAvLyBSdW5uaW5nIHRoZSBhbHRlcmVkIGBleGVjYCBoZXJlIGFsbG93cyB1c2Ugb2YgbmFtZWQgYmFja3JlZmVyZW5jZXMsIGV0Yy5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG1hdGNoICYmIG1hdGNoLmluZGV4ID09PSBpbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dDogdC5oYW5kbGVyLmNhbGwoY29udGV4dCwgbWF0Y2gsIHNjb3BlKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaDogbWF0Y2hcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICBpc0luc2lkZUNvbnN0cnVjdG9yID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpbmRleE9mIChhcnJheSwgaXRlbSwgZnJvbSkge1xuICAgICAgICBpZiAoQXJyYXkucHJvdG90eXBlLmluZGV4T2YpIC8vIFVzZSB0aGUgbmF0aXZlIGFycmF5IG1ldGhvZCBpZiBhdmFpbGFibGVcbiAgICAgICAgICAgIHJldHVybiBhcnJheS5pbmRleE9mKGl0ZW0sIGZyb20pO1xuICAgICAgICBmb3IgKHZhciBpID0gZnJvbSB8fCAwOyBpIDwgYXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChhcnJheVtpXSA9PT0gaXRlbSlcbiAgICAgICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gLTE7XG4gICAgfVxuXG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vICBCdWlsdC1pbiB0b2tlbnNcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gICAgLy8gQXVnbWVudCBYUmVnRXhwJ3MgcmVndWxhciBleHByZXNzaW9uIHN5bnRheCBhbmQgZmxhZ3MuIE5vdGUgdGhhdCB3aGVuIGFkZGluZyB0b2tlbnMsIHRoZVxuICAgIC8vIHRoaXJkIChgc2NvcGVgKSBhcmd1bWVudCBkZWZhdWx0cyB0byBgWFJlZ0V4cC5PVVRTSURFX0NMQVNTYFxuXG4gICAgLy8gQ29tbWVudCBwYXR0ZXJuOiAoPyMgKVxuICAgIFhSZWdFeHAuYWRkVG9rZW4oXG4gICAgICAgIC9cXChcXD8jW14pXSpcXCkvLFxuICAgICAgICBmdW5jdGlvbiAobWF0Y2gpIHtcbiAgICAgICAgICAgIC8vIEtlZXAgdG9rZW5zIHNlcGFyYXRlZCB1bmxlc3MgdGhlIGZvbGxvd2luZyB0b2tlbiBpcyBhIHF1YW50aWZpZXJcbiAgICAgICAgICAgIHJldHVybiBuYXRpdi50ZXN0LmNhbGwocXVhbnRpZmllciwgbWF0Y2guaW5wdXQuc2xpY2UobWF0Y2guaW5kZXggKyBtYXRjaFswXS5sZW5ndGgpKSA/IFwiXCIgOiBcIig/OilcIjtcbiAgICAgICAgfVxuICAgICk7XG5cbiAgICAvLyBDYXB0dXJpbmcgZ3JvdXAgKG1hdGNoIHRoZSBvcGVuaW5nIHBhcmVudGhlc2lzIG9ubHkpLlxuICAgIC8vIFJlcXVpcmVkIGZvciBzdXBwb3J0IG9mIG5hbWVkIGNhcHR1cmluZyBncm91cHNcbiAgICBYUmVnRXhwLmFkZFRva2VuKFxuICAgICAgICAvXFwoKD8hXFw/KS8sXG4gICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuY2FwdHVyZU5hbWVzLnB1c2gobnVsbCk7XG4gICAgICAgICAgICByZXR1cm4gXCIoXCI7XG4gICAgICAgIH1cbiAgICApO1xuXG4gICAgLy8gTmFtZWQgY2FwdHVyaW5nIGdyb3VwIChtYXRjaCB0aGUgb3BlbmluZyBkZWxpbWl0ZXIgb25seSk6ICg/PG5hbWU+XG4gICAgWFJlZ0V4cC5hZGRUb2tlbihcbiAgICAgICAgL1xcKFxcPzwoWyRcXHddKyk+LyxcbiAgICAgICAgZnVuY3Rpb24gKG1hdGNoKSB7XG4gICAgICAgICAgICB0aGlzLmNhcHR1cmVOYW1lcy5wdXNoKG1hdGNoWzFdKTtcbiAgICAgICAgICAgIHRoaXMuaGFzTmFtZWRDYXB0dXJlID0gdHJ1ZTtcbiAgICAgICAgICAgIHJldHVybiBcIihcIjtcbiAgICAgICAgfVxuICAgICk7XG5cbiAgICAvLyBOYW1lZCBiYWNrcmVmZXJlbmNlOiBcXGs8bmFtZT5cbiAgICBYUmVnRXhwLmFkZFRva2VuKFxuICAgICAgICAvXFxcXGs8KFtcXHckXSspPi8sXG4gICAgICAgIGZ1bmN0aW9uIChtYXRjaCkge1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gaW5kZXhPZih0aGlzLmNhcHR1cmVOYW1lcywgbWF0Y2hbMV0pO1xuICAgICAgICAgICAgLy8gS2VlcCBiYWNrcmVmZXJlbmNlcyBzZXBhcmF0ZSBmcm9tIHN1YnNlcXVlbnQgbGl0ZXJhbCBudW1iZXJzLiBQcmVzZXJ2ZSBiYWNrLVxuICAgICAgICAgICAgLy8gcmVmZXJlbmNlcyB0byBuYW1lZCBncm91cHMgdGhhdCBhcmUgdW5kZWZpbmVkIGF0IHRoaXMgcG9pbnQgYXMgbGl0ZXJhbCBzdHJpbmdzXG4gICAgICAgICAgICByZXR1cm4gaW5kZXggPiAtMSA/XG4gICAgICAgICAgICAgICAgXCJcXFxcXCIgKyAoaW5kZXggKyAxKSArIChpc05hTihtYXRjaC5pbnB1dC5jaGFyQXQobWF0Y2guaW5kZXggKyBtYXRjaFswXS5sZW5ndGgpKSA/IFwiXCIgOiBcIig/OilcIikgOlxuICAgICAgICAgICAgICAgIG1hdGNoWzBdO1xuICAgICAgICB9XG4gICAgKTtcblxuICAgIC8vIEVtcHR5IGNoYXJhY3RlciBjbGFzczogW10gb3IgW15dXG4gICAgWFJlZ0V4cC5hZGRUb2tlbihcbiAgICAgICAgL1xcW1xcXj9dLyxcbiAgICAgICAgZnVuY3Rpb24gKG1hdGNoKSB7XG4gICAgICAgICAgICAvLyBGb3IgY3Jvc3MtYnJvd3NlciBjb21wYXRpYmlsaXR5IHdpdGggRVMzLCBjb252ZXJ0IFtdIHRvIFxcYlxcQiBhbmQgW15dIHRvIFtcXHNcXFNdLlxuICAgICAgICAgICAgLy8gKD8hKSBzaG91bGQgd29yayBsaWtlIFxcYlxcQiwgYnV0IGlzIHVucmVsaWFibGUgaW4gRmlyZWZveFxuICAgICAgICAgICAgcmV0dXJuIG1hdGNoWzBdID09PSBcIltdXCIgPyBcIlxcXFxiXFxcXEJcIiA6IFwiW1xcXFxzXFxcXFNdXCI7XG4gICAgICAgIH1cbiAgICApO1xuXG4gICAgLy8gTW9kZSBtb2RpZmllciBhdCB0aGUgc3RhcnQgb2YgdGhlIHBhdHRlcm4gb25seSwgd2l0aCBhbnkgY29tYmluYXRpb24gb2YgZmxhZ3MgaW1zeDogKD9pbXN4KVxuICAgIC8vIERvZXMgbm90IHN1cHBvcnQgeCg/aSksICg/LWkpLCAoP2ktbSksICg/aTogKSwgKD9pKSg/bSksIGV0Yy5cbiAgICBYUmVnRXhwLmFkZFRva2VuKFxuICAgICAgICAvXlxcKFxcPyhbaW1zeF0rKVxcKS8sXG4gICAgICAgIGZ1bmN0aW9uIChtYXRjaCkge1xuICAgICAgICAgICAgdGhpcy5zZXRGbGFnKG1hdGNoWzFdKTtcbiAgICAgICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgICB9XG4gICAgKTtcblxuICAgIC8vIFdoaXRlc3BhY2UgYW5kIGNvbW1lbnRzLCBpbiBmcmVlLXNwYWNpbmcgKGFrYSBleHRlbmRlZCkgbW9kZSBvbmx5XG4gICAgWFJlZ0V4cC5hZGRUb2tlbihcbiAgICAgICAgLyg/Olxccyt8Iy4qKSsvLFxuICAgICAgICBmdW5jdGlvbiAobWF0Y2gpIHtcbiAgICAgICAgICAgIC8vIEtlZXAgdG9rZW5zIHNlcGFyYXRlZCB1bmxlc3MgdGhlIGZvbGxvd2luZyB0b2tlbiBpcyBhIHF1YW50aWZpZXJcbiAgICAgICAgICAgIHJldHVybiBuYXRpdi50ZXN0LmNhbGwocXVhbnRpZmllciwgbWF0Y2guaW5wdXQuc2xpY2UobWF0Y2guaW5kZXggKyBtYXRjaFswXS5sZW5ndGgpKSA/IFwiXCIgOiBcIig/OilcIjtcbiAgICAgICAgfSxcbiAgICAgICAgWFJlZ0V4cC5PVVRTSURFX0NMQVNTLFxuICAgICAgICBmdW5jdGlvbiAoKSB7cmV0dXJuIHRoaXMuaGFzRmxhZyhcInhcIik7fVxuICAgICk7XG5cbiAgICAvLyBEb3QsIGluIGRvdGFsbCAoYWthIHNpbmdsZWxpbmUpIG1vZGUgb25seVxuICAgIFhSZWdFeHAuYWRkVG9rZW4oXG4gICAgICAgIC9cXC4vLFxuICAgICAgICBmdW5jdGlvbiAoKSB7cmV0dXJuIFwiW1xcXFxzXFxcXFNdXCI7fSxcbiAgICAgICAgWFJlZ0V4cC5PVVRTSURFX0NMQVNTLFxuICAgICAgICBmdW5jdGlvbiAoKSB7cmV0dXJuIHRoaXMuaGFzRmxhZyhcInNcIik7fVxuICAgICk7XG5cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gIEJhY2t3YXJkIGNvbXBhdGliaWxpdHlcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gICAgLy8gVW5jb21tZW50IHRoZSBmb2xsb3dpbmcgYmxvY2sgZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBYUmVnRXhwIDEuMC0xLjI6XG4gICAgLypcbiAgICAgWFJlZ0V4cC5tYXRjaFdpdGhpbkNoYWluID0gWFJlZ0V4cC5tYXRjaENoYWluO1xuICAgICBSZWdFeHAucHJvdG90eXBlLmFkZEZsYWdzID0gZnVuY3Rpb24gKHMpIHtyZXR1cm4gY2xvbmUodGhpcywgcyk7fTtcbiAgICAgUmVnRXhwLnByb3RvdHlwZS5leGVjQWxsID0gZnVuY3Rpb24gKHMpIHt2YXIgciA9IFtdOyBYUmVnRXhwLml0ZXJhdGUocywgdGhpcywgZnVuY3Rpb24gKG0pIHtyLnB1c2gobSk7fSk7IHJldHVybiByO307XG4gICAgIFJlZ0V4cC5wcm90b3R5cGUuZm9yRWFjaEV4ZWMgPSBmdW5jdGlvbiAocywgZiwgYykge3JldHVybiBYUmVnRXhwLml0ZXJhdGUocywgdGhpcywgZiwgYyk7fTtcbiAgICAgUmVnRXhwLnByb3RvdHlwZS52YWxpZGF0ZSA9IGZ1bmN0aW9uIChzKSB7dmFyIHIgPSBSZWdFeHAoXCJeKD86XCIgKyB0aGlzLnNvdXJjZSArIFwiKSQoPyFcXFxccylcIiwgZ2V0TmF0aXZlRmxhZ3ModGhpcykpOyBpZiAodGhpcy5nbG9iYWwpIHRoaXMubGFzdEluZGV4ID0gMDsgcmV0dXJuIHMuc2VhcmNoKHIpID09PSAwO307XG4gICAgICovXG5cbn0pKCk7XG5cbi8vXG4vLyBCZWdpbiBhbm9ueW1vdXMgZnVuY3Rpb24uIFRoaXMgaXMgdXNlZCB0byBjb250YWluIGxvY2FsIHNjb3BlIHZhcmlhYmxlcyB3aXRob3V0IHBvbHV0dGluZyBnbG9iYWwgc2NvcGUuXG4vL1xuaWYgKHR5cGVvZihTeW50YXhIaWdobGlnaHRlcikgPT0gJ3VuZGVmaW5lZCcpIHZhciBTeW50YXhIaWdobGlnaHRlciA9IGZ1bmN0aW9uKCkge1xuXG4vLyBDb21tb25KU1xuICAgIGlmICh0eXBlb2YocmVxdWlyZSkgIT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mKFhSZWdFeHApID09ICd1bmRlZmluZWQnKVxuICAgIHtcbiAgICAgICAgWFJlZ0V4cCA9IHJlcXVpcmUoJ1hSZWdFeHAnKS5YUmVnRXhwO1xuICAgIH1cblxuLy8gU2hvcnRjdXQgb2JqZWN0IHdoaWNoIHdpbGwgYmUgYXNzaWduZWQgdG8gdGhlIFN5bnRheEhpZ2hsaWdodGVyIHZhcmlhYmxlLlxuLy8gVGhpcyBpcyBhIHNob3J0aGFuZCBmb3IgbG9jYWwgcmVmZXJlbmNlIGluIG9yZGVyIHRvIGF2b2lkIGxvbmcgbmFtZXNwYWNlXG4vLyByZWZlcmVuY2VzIHRvIFN5bnRheEhpZ2hsaWdodGVyLndoYXRldmVyLi4uXG4gICAgdmFyIHNoID0ge1xuICAgICAgICBkZWZhdWx0cyA6IHtcbiAgICAgICAgICAgIC8qKiBBZGRpdGlvbmFsIENTUyBjbGFzcyBuYW1lcyB0byBiZSBhZGRlZCB0byBoaWdobGlnaHRlciBlbGVtZW50cy4gKi9cbiAgICAgICAgICAgICdjbGFzcy1uYW1lJyA6ICcnLFxuXG4gICAgICAgICAgICAvKiogRmlyc3QgbGluZSBudW1iZXIuICovXG4gICAgICAgICAgICAnZmlyc3QtbGluZScgOiAxLFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFBhZHMgbGluZSBudW1iZXJzLiBQb3NzaWJsZSB2YWx1ZXMgYXJlOlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqICAgZmFsc2UgLSBkb24ndCBwYWQgbGluZSBudW1iZXJzLlxuICAgICAgICAgICAgICogICB0cnVlICAtIGF1dG9tYXRpY2FseSBwYWQgbnVtYmVycyB3aXRoIG1pbmltdW0gcmVxdWlyZWQgbnVtYmVyIG9mIGxlYWRpbmcgemVyb2VzLlxuICAgICAgICAgICAgICogICBbaW50XSAtIGxlbmd0aCB1cCB0byB3aGljaCBwYWQgbGluZSBudW1iZXJzLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICAncGFkLWxpbmUtbnVtYmVycycgOiBmYWxzZSxcblxuICAgICAgICAgICAgLyoqIExpbmVzIHRvIGhpZ2hsaWdodC4gKi9cbiAgICAgICAgICAgICdoaWdobGlnaHQnIDogZmFsc2UsXG5cbiAgICAgICAgICAgIC8qKiBUaXRsZSB0byBiZSBkaXNwbGF5ZWQgYWJvdmUgdGhlIGNvZGUgYmxvY2suICovXG4gICAgICAgICAgICAndGl0bGUnIDogbnVsbCxcblxuICAgICAgICAgICAgLyoqIEVuYWJsZXMgb3IgZGlzYWJsZXMgc21hcnQgdGFicy4gKi9cbiAgICAgICAgICAgICdzbWFydC10YWJzJyA6IHRydWUsXG5cbiAgICAgICAgICAgIC8qKiBHZXRzIG9yIHNldHMgdGFiIHNpemUuICovXG4gICAgICAgICAgICAndGFiLXNpemUnIDogNCxcblxuICAgICAgICAgICAgLyoqIEVuYWJsZXMgb3IgZGlzYWJsZXMgZ3V0dGVyLiAqL1xuICAgICAgICAgICAgJ2d1dHRlcicgOiB0cnVlLFxuXG4gICAgICAgICAgICAvKiogRW5hYmxlcyBvciBkaXNhYmxlcyB0b29sYmFyLiAqL1xuICAgICAgICAgICAgJ3Rvb2xiYXInIDogdHJ1ZSxcblxuICAgICAgICAgICAgLyoqIEVuYWJsZXMgcXVpY2sgY29kZSBjb3B5IGFuZCBwYXN0ZSBmcm9tIGRvdWJsZSBjbGljay4gKi9cbiAgICAgICAgICAgICdxdWljay1jb2RlJyA6IHRydWUsXG5cbiAgICAgICAgICAgIC8qKiBGb3JjZXMgY29kZSB2aWV3IHRvIGJlIGNvbGxhcHNlZC4gKi9cbiAgICAgICAgICAgICdjb2xsYXBzZScgOiBmYWxzZSxcblxuICAgICAgICAgICAgLyoqIEVuYWJsZXMgb3IgZGlzYWJsZXMgYXV0b21hdGljIGxpbmtzLiAqL1xuICAgICAgICAgICAgJ2F1dG8tbGlua3MnIDogZmFsc2UsXG5cbiAgICAgICAgICAgIC8qKiBHZXRzIG9yIHNldHMgbGlnaHQgbW9kZS4gRXF1YXZhbGVudCB0byB0dXJuaW5nIG9mZiBndXR0ZXIgYW5kIHRvb2xiYXIuICovXG4gICAgICAgICAgICAnbGlnaHQnIDogZmFsc2UsXG5cbiAgICAgICAgICAgICd1bmluZGVudCcgOiB0cnVlLFxuXG4gICAgICAgICAgICAnaHRtbC1zY3JpcHQnIDogZmFsc2VcbiAgICAgICAgfSxcblxuICAgICAgICBjb25maWcgOiB7XG4gICAgICAgICAgICBzcGFjZSA6ICcmbmJzcDsnLFxuXG4gICAgICAgICAgICAvKiogRW5hYmxlcyB1c2Ugb2YgPFNDUklQVCB0eXBlPVwic3ludGF4aGlnaGxpZ2h0ZXJcIiAvPiB0YWdzLiAqL1xuICAgICAgICAgICAgdXNlU2NyaXB0VGFncyA6IHRydWUsXG5cbiAgICAgICAgICAgIC8qKiBCbG9nZ2VyIG1vZGUgZmxhZy4gKi9cbiAgICAgICAgICAgIGJsb2dnZXJNb2RlIDogZmFsc2UsXG5cbiAgICAgICAgICAgIHN0cmlwQnJzIDogZmFsc2UsXG5cbiAgICAgICAgICAgIC8qKiBOYW1lIG9mIHRoZSB0YWcgdGhhdCBTeW50YXhIaWdobGlnaHRlciB3aWxsIGF1dG9tYXRpY2FsbHkgbG9vayBmb3IuICovXG4gICAgICAgICAgICB0YWdOYW1lIDogJ3ByZScsXG5cbiAgICAgICAgICAgIHN0cmluZ3MgOiB7XG4gICAgICAgICAgICAgICAgZXhwYW5kU291cmNlIDogJ2V4cGFuZCBzb3VyY2UnLFxuICAgICAgICAgICAgICAgIGhlbHAgOiAnPycsXG4gICAgICAgICAgICAgICAgYWxlcnQ6ICdTeW50YXhIaWdobGlnaHRlclxcblxcbicsXG4gICAgICAgICAgICAgICAgbm9CcnVzaCA6ICdDYW5cXCd0IGZpbmQgYnJ1c2ggZm9yOiAnLFxuICAgICAgICAgICAgICAgIGJydXNoTm90SHRtbFNjcmlwdCA6ICdCcnVzaCB3YXNuXFwndCBjb25maWd1cmVkIGZvciBodG1sLXNjcmlwdCBvcHRpb246ICcsXG5cbiAgICAgICAgICAgICAgICAvLyB0aGlzIGlzIHBvcHVsYXRlZCBieSB0aGUgYnVpbGQgc2NyaXB0XG4gICAgICAgICAgICAgICAgYWJvdXREaWFsb2cgOiAnQEFCT1VUQCdcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICAvKiogSW50ZXJuYWwgJ2dsb2JhbCcgdmFyaWFibGVzLiAqL1xuICAgICAgICB2YXJzIDoge1xuICAgICAgICAgICAgZGlzY292ZXJlZEJydXNoZXMgOiBudWxsLFxuICAgICAgICAgICAgaGlnaGxpZ2h0ZXJzIDoge31cbiAgICAgICAgfSxcblxuICAgICAgICAvKiogVGhpcyBvYmplY3QgaXMgcG9wdWxhdGVkIGJ5IHVzZXIgaW5jbHVkZWQgZXh0ZXJuYWwgYnJ1c2ggZmlsZXMuICovXG4gICAgICAgIGJydXNoZXMgOiB7fSxcblxuICAgICAgICAvKiogQ29tbW9uIHJlZ3VsYXIgZXhwcmVzc2lvbnMuICovXG4gICAgICAgIHJlZ2V4TGliIDoge1xuICAgICAgICAgICAgbXVsdGlMaW5lQ0NvbW1lbnRzXHRcdFx0OiAvXFwvXFwqW1xcc1xcU10qP1xcKlxcLy9nbSxcbiAgICAgICAgICAgIHNpbmdsZUxpbmVDQ29tbWVudHNcdFx0XHQ6IC9cXC9cXC8uKiQvZ20sXG4gICAgICAgICAgICBzaW5nbGVMaW5lUGVybENvbW1lbnRzXHRcdDogLyMuKiQvZ20sXG4gICAgICAgICAgICBkb3VibGVRdW90ZWRTdHJpbmdcdFx0XHQ6IC9cIihbXlxcXFxcIlxcbl18XFxcXC4pKlwiL2csXG4gICAgICAgICAgICBzaW5nbGVRdW90ZWRTdHJpbmdcdFx0XHQ6IC8nKFteXFxcXCdcXG5dfFxcXFwuKSonL2csXG4gICAgICAgICAgICBtdWx0aUxpbmVEb3VibGVRdW90ZWRTdHJpbmdcdDogbmV3IFhSZWdFeHAoJ1wiKFteXFxcXFxcXFxcIl18XFxcXFxcXFwuKSpcIicsICdncycpLFxuICAgICAgICAgICAgbXVsdGlMaW5lU2luZ2xlUXVvdGVkU3RyaW5nXHQ6IG5ldyBYUmVnRXhwKFwiJyhbXlxcXFxcXFxcJ118XFxcXFxcXFwuKSonXCIsICdncycpLFxuICAgICAgICAgICAgeG1sQ29tbWVudHNcdFx0XHRcdFx0OiAvKCZsdDt8PCkhLS1bXFxzXFxTXSo/LS0oJmd0O3w+KS9nbSxcbiAgICAgICAgICAgIHVybFx0XHRcdFx0XHRcdFx0OiAvXFx3KzpcXC9cXC9bXFx3LS5cXC8/JSY9OkA7I10qL2csXG5cbiAgICAgICAgICAgIC8qKiA8Pz0gPz4gdGFncy4gKi9cbiAgICAgICAgICAgIHBocFNjcmlwdFRhZ3MgXHRcdFx0XHQ6IHsgbGVmdDogLygmbHQ7fDwpXFw/KD86PXxwaHApPy9nLCByaWdodDogL1xcPygmZ3Q7fD4pL2csICdlb2YnIDogdHJ1ZSB9LFxuXG4gICAgICAgICAgICAvKiogPCU9ICU+IHRhZ3MuICovXG4gICAgICAgICAgICBhc3BTY3JpcHRUYWdzXHRcdFx0XHQ6IHsgbGVmdDogLygmbHQ7fDwpJT0/L2csIHJpZ2h0OiAvJSgmZ3Q7fD4pL2cgfSxcblxuICAgICAgICAgICAgLyoqIDxzY3JpcHQ+IHRhZ3MuICovXG4gICAgICAgICAgICBzY3JpcHRTY3JpcHRUYWdzXHRcdFx0OiB7IGxlZnQ6IC8oJmx0O3w8KVxccypzY3JpcHQuKj8oJmd0O3w+KS9naSwgcmlnaHQ6IC8oJmx0O3w8KVxcL1xccypzY3JpcHRcXHMqKCZndDt8PikvZ2kgfVxuICAgICAgICB9LFxuXG4gICAgICAgIHRvb2xiYXI6IHtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogR2VuZXJhdGVzIEhUTUwgbWFya3VwIGZvciB0aGUgdG9vbGJhci5cbiAgICAgICAgICAgICAqIEBwYXJhbSB7SGlnaGxpZ2h0ZXJ9IGhpZ2hsaWdodGVyIEhpZ2hsaWdodGVyIGluc3RhbmNlLlxuICAgICAgICAgICAgICogQHJldHVybiB7U3RyaW5nfSBSZXR1cm5zIEhUTUwgbWFya3VwLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBnZXRIdG1sOiBmdW5jdGlvbihoaWdobGlnaHRlcilcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB2YXIgaHRtbCA9ICc8ZGl2IGNsYXNzPVwidG9vbGJhclwiPicsXG4gICAgICAgICAgICAgICAgICAgIGl0ZW1zID0gc2gudG9vbGJhci5pdGVtcyxcbiAgICAgICAgICAgICAgICAgICAgbGlzdCA9IGl0ZW1zLmxpc3RcbiAgICAgICAgICAgICAgICAgICAgO1xuXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gZGVmYXVsdEdldEh0bWwoaGlnaGxpZ2h0ZXIsIG5hbWUpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2gudG9vbGJhci5nZXRCdXR0b25IdG1sKGhpZ2hsaWdodGVyLCBuYW1lLCBzaC5jb25maWcuc3RyaW5nc1tuYW1lXSk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKylcbiAgICAgICAgICAgICAgICAgICAgaHRtbCArPSAoaXRlbXNbbGlzdFtpXV0uZ2V0SHRtbCB8fCBkZWZhdWx0R2V0SHRtbCkoaGlnaGxpZ2h0ZXIsIGxpc3RbaV0pO1xuXG4gICAgICAgICAgICAgICAgaHRtbCArPSAnPC9kaXY+JztcblxuICAgICAgICAgICAgICAgIHJldHVybiBodG1sO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBHZW5lcmF0ZXMgSFRNTCBtYXJrdXAgZm9yIGEgcmVndWxhciBidXR0b24gaW4gdGhlIHRvb2xiYXIuXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0hpZ2hsaWdodGVyfSBoaWdobGlnaHRlciBIaWdobGlnaHRlciBpbnN0YW5jZS5cbiAgICAgICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBjb21tYW5kTmFtZVx0XHRDb21tYW5kIG5hbWUgdGhhdCB3b3VsZCBiZSBleGVjdXRlZC5cbiAgICAgICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBsYWJlbFx0XHRcdExhYmVsIHRleHQgdG8gZGlzcGxheS5cbiAgICAgICAgICAgICAqIEByZXR1cm4ge1N0cmluZ31cdFx0XHRcdFx0UmV0dXJucyBIVE1MIG1hcmt1cC5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZ2V0QnV0dG9uSHRtbDogZnVuY3Rpb24oaGlnaGxpZ2h0ZXIsIGNvbW1hbmROYW1lLCBsYWJlbClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJzxzcGFuPjxhIGhyZWY9XCIjXCIgY2xhc3M9XCJ0b29sYmFyX2l0ZW0nXG4gICAgICAgICAgICAgICAgICAgICsgJyBjb21tYW5kXycgKyBjb21tYW5kTmFtZVxuICAgICAgICAgICAgICAgICAgICArICcgJyArIGNvbW1hbmROYW1lXG4gICAgICAgICAgICAgICAgICAgICsgJ1wiPicgKyBsYWJlbCArICc8L2E+PC9zcGFuPidcbiAgICAgICAgICAgICAgICAgICAgO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBFdmVudCBoYW5kbGVyIGZvciBhIHRvb2xiYXIgYW5jaG9yLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbihlKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHZhciB0YXJnZXQgPSBlLnRhcmdldCxcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lID0gdGFyZ2V0LmNsYXNzTmFtZSB8fCAnJ1xuICAgICAgICAgICAgICAgICAgICA7XG5cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBnZXRWYWx1ZShuYW1lKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHIgPSBuZXcgUmVnRXhwKG5hbWUgKyAnXyhcXFxcdyspJyksXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXRjaCA9IHIuZXhlYyhjbGFzc05hbWUpXG4gICAgICAgICAgICAgICAgICAgICAgICA7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1hdGNoID8gbWF0Y2hbMV0gOiBudWxsO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICB2YXIgaGlnaGxpZ2h0ZXIgPSBnZXRIaWdobGlnaHRlckJ5SWQoZmluZFBhcmVudEVsZW1lbnQodGFyZ2V0LCAnLnN5bnRheGhpZ2hsaWdodGVyJykuaWQpLFxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kTmFtZSA9IGdldFZhbHVlKCdjb21tYW5kJylcbiAgICAgICAgICAgICAgICAgICAgO1xuXG4gICAgICAgICAgICAgICAgLy8gZXhlY3V0ZSB0aGUgdG9vbGJhciBjb21tYW5kXG4gICAgICAgICAgICAgICAgaWYgKGhpZ2hsaWdodGVyICYmIGNvbW1hbmROYW1lKVxuICAgICAgICAgICAgICAgICAgICBzaC50b29sYmFyLml0ZW1zW2NvbW1hbmROYW1lXS5leGVjdXRlKGhpZ2hsaWdodGVyKTtcblxuICAgICAgICAgICAgICAgIC8vIGRpc2FibGUgZGVmYXVsdCBBIGNsaWNrIGJlaGF2aW91clxuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qKiBDb2xsZWN0aW9uIG9mIHRvb2xiYXIgaXRlbXMuICovXG4gICAgICAgICAgICBpdGVtcyA6IHtcbiAgICAgICAgICAgICAgICAvLyBPcmRlcmVkIGxpcyBvZiBpdGVtcyBpbiB0aGUgdG9vbGJhci4gQ2FuJ3QgZXhwZWN0IGBmb3IgKHZhciBuIGluIGl0ZW1zKWAgdG8gYmUgY29uc2lzdGVudC5cbiAgICAgICAgICAgICAgICBsaXN0OiBbJ2V4cGFuZFNvdXJjZScsICdoZWxwJ10sXG5cbiAgICAgICAgICAgICAgICBleHBhbmRTb3VyY2U6IHtcbiAgICAgICAgICAgICAgICAgICAgZ2V0SHRtbDogZnVuY3Rpb24oaGlnaGxpZ2h0ZXIpXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChoaWdobGlnaHRlci5nZXRQYXJhbSgnY29sbGFwc2UnKSAhPSB0cnVlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnJztcblxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRpdGxlID0gaGlnaGxpZ2h0ZXIuZ2V0UGFyYW0oJ3RpdGxlJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2gudG9vbGJhci5nZXRCdXR0b25IdG1sKGhpZ2hsaWdodGVyLCAnZXhwYW5kU291cmNlJywgdGl0bGUgPyB0aXRsZSA6IHNoLmNvbmZpZy5zdHJpbmdzLmV4cGFuZFNvdXJjZSk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAgICAgZXhlY3V0ZTogZnVuY3Rpb24oaGlnaGxpZ2h0ZXIpXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkaXYgPSBnZXRIaWdobGlnaHRlckRpdkJ5SWQoaGlnaGxpZ2h0ZXIuaWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlQ2xhc3MoZGl2LCAnY29sbGFwc2VkJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgLyoqIENvbW1hbmQgdG8gZGlzcGxheSB0aGUgYWJvdXQgZGlhbG9nIHdpbmRvdy4gKi9cbiAgICAgICAgICAgICAgICBoZWxwOiB7XG4gICAgICAgICAgICAgICAgICAgIGV4ZWN1dGU6IGZ1bmN0aW9uKGhpZ2hsaWdodGVyKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgd25kID0gcG9wdXAoJycsICdfYmxhbmsnLCA1MDAsIDI1MCwgJ3Njcm9sbGJhcnM9MCcpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvYyA9IHduZC5kb2N1bWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgZG9jLndyaXRlKHNoLmNvbmZpZy5zdHJpbmdzLmFib3V0RGlhbG9nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvYy5jbG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgd25kLmZvY3VzKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZpbmRzIGFsbCBlbGVtZW50cyBvbiB0aGUgcGFnZSB3aGljaCBzaG91bGQgYmUgcHJvY2Vzc2VzIGJ5IFN5bnRheEhpZ2hsaWdodGVyLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gZ2xvYmFsUGFyYW1zXHRcdE9wdGlvbmFsIHBhcmFtZXRlcnMgd2hpY2ggb3ZlcnJpZGUgZWxlbWVudCdzXG4gICAgICAgICAqIFx0XHRcdFx0XHRcdFx0XHRcdHBhcmFtZXRlcnMuIE9ubHkgdXNlZCBpZiBlbGVtZW50IGlzIHNwZWNpZmllZC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnRcdE9wdGlvbmFsIGVsZW1lbnQgdG8gaGlnaGxpZ2h0LiBJZiBub25lIGlzXG4gICAgICAgICAqIFx0XHRcdFx0XHRcdFx0cHJvdmlkZWQsIGFsbCBlbGVtZW50cyBpbiB0aGUgY3VycmVudCBkb2N1bWVudFxuICAgICAgICAgKiBcdFx0XHRcdFx0XHRcdGFyZSByZXR1cm5lZCB3aGljaCBxdWFsaWZ5LlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcmV0dXJuIHtBcnJheX1cdFJldHVybnMgbGlzdCBvZiA8Y29kZT57IHRhcmdldDogRE9NRWxlbWVudCwgcGFyYW1zOiBPYmplY3QgfTwvY29kZT4gb2JqZWN0cy5cbiAgICAgICAgICovXG4gICAgICAgIGZpbmRFbGVtZW50czogZnVuY3Rpb24oZ2xvYmFsUGFyYW1zLCBlbGVtZW50KVxuICAgICAgICB7XG4gICAgICAgICAgICB2YXIgZWxlbWVudHMgPSBlbGVtZW50ID8gW2VsZW1lbnRdIDogdG9BcnJheShkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShzaC5jb25maWcudGFnTmFtZSkpLFxuICAgICAgICAgICAgICAgIGNvbmYgPSBzaC5jb25maWcsXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gW11cbiAgICAgICAgICAgICAgICA7XG5cbiAgICAgICAgICAgIC8vIHN1cHBvcnQgZm9yIDxTQ1JJUFQgVFlQRT1cInN5bnRheGhpZ2hsaWdodGVyXCIgLz4gZmVhdHVyZVxuICAgICAgICAgICAgaWYgKGNvbmYudXNlU2NyaXB0VGFncylcbiAgICAgICAgICAgICAgICBlbGVtZW50cyA9IGVsZW1lbnRzLmNvbmNhdChnZXRTeW50YXhIaWdobGlnaHRlclNjcmlwdFRhZ3MoKSk7XG5cbiAgICAgICAgICAgIGlmIChlbGVtZW50cy5sZW5ndGggPT09IDApXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbGVtZW50cy5sZW5ndGg7IGkrKylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB2YXIgaXRlbSA9IHtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0OiBlbGVtZW50c1tpXSxcbiAgICAgICAgICAgICAgICAgICAgLy8gbG9jYWwgcGFyYW1zIHRha2UgcHJlY2VkZW5jZSBvdmVyIGdsb2JhbHNcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1zOiBtZXJnZShnbG9iYWxQYXJhbXMsIHBhcnNlUGFyYW1zKGVsZW1lbnRzW2ldLmNsYXNzTmFtZSkpXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIGlmIChpdGVtLnBhcmFtc1snYnJ1c2gnXSA9PSBudWxsKVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGl0ZW0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTaG9ydGhhbmQgdG8gaGlnaGxpZ2h0IGFsbCBlbGVtZW50cyBvbiB0aGUgcGFnZSB0aGF0IGFyZSBtYXJrZWQgYXNcbiAgICAgICAgICogU3ludGF4SGlnaGxpZ2h0ZXIgc291cmNlIGNvZGUuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBnbG9iYWxQYXJhbXNcdFx0T3B0aW9uYWwgcGFyYW1ldGVycyB3aGljaCBvdmVycmlkZSBlbGVtZW50J3NcbiAgICAgICAgICogXHRcdFx0XHRcdFx0XHRcdFx0cGFyYW1ldGVycy4gT25seSB1c2VkIGlmIGVsZW1lbnQgaXMgc3BlY2lmaWVkLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbWVudFx0T3B0aW9uYWwgZWxlbWVudCB0byBoaWdobGlnaHQuIElmIG5vbmUgaXNcbiAgICAgICAgICogXHRcdFx0XHRcdFx0XHRwcm92aWRlZCwgYWxsIGVsZW1lbnRzIGluIHRoZSBjdXJyZW50IGRvY3VtZW50XG4gICAgICAgICAqIFx0XHRcdFx0XHRcdFx0YXJlIGhpZ2hsaWdodGVkLlxuICAgICAgICAgKi9cbiAgICAgICAgaGlnaGxpZ2h0OiBmdW5jdGlvbihnbG9iYWxQYXJhbXMsIGVsZW1lbnQpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHZhciBlbGVtZW50cyA9IHRoaXMuZmluZEVsZW1lbnRzKGdsb2JhbFBhcmFtcywgZWxlbWVudCksXG4gICAgICAgICAgICAgICAgcHJvcGVydHlOYW1lID0gJ2lubmVySFRNTCcsXG4gICAgICAgICAgICAgICAgaGlnaGxpZ2h0ZXIgPSBudWxsLFxuICAgICAgICAgICAgICAgIGNvbmYgPSBzaC5jb25maWdcbiAgICAgICAgICAgICAgICA7XG5cbiAgICAgICAgICAgIGlmIChlbGVtZW50cy5sZW5ndGggPT09IDApXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVsZW1lbnRzLmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHZhciBlbGVtZW50ID0gZWxlbWVudHNbaV0sXG4gICAgICAgICAgICAgICAgICAgIHRhcmdldCA9IGVsZW1lbnQudGFyZ2V0LFxuICAgICAgICAgICAgICAgICAgICBwYXJhbXMgPSBlbGVtZW50LnBhcmFtcyxcbiAgICAgICAgICAgICAgICAgICAgYnJ1c2hOYW1lID0gcGFyYW1zLmJydXNoLFxuICAgICAgICAgICAgICAgICAgICBjb2RlXG4gICAgICAgICAgICAgICAgICAgIDtcblxuICAgICAgICAgICAgICAgIGlmIChicnVzaE5hbWUgPT0gbnVsbClcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG5cbiAgICAgICAgICAgICAgICAvLyBJbnN0YW50aWF0ZSBhIGJydXNoXG4gICAgICAgICAgICAgICAgaWYgKHBhcmFtc1snaHRtbC1zY3JpcHQnXSA9PSAndHJ1ZScgfHwgc2guZGVmYXVsdHNbJ2h0bWwtc2NyaXB0J10gPT0gdHJ1ZSlcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGhpZ2hsaWdodGVyID0gbmV3IHNoLkh0bWxTY3JpcHQoYnJ1c2hOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgYnJ1c2hOYW1lID0gJ2h0bWxzY3JpcHQnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYnJ1c2ggPSBmaW5kQnJ1c2goYnJ1c2hOYW1lKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoYnJ1c2gpXG4gICAgICAgICAgICAgICAgICAgICAgICBoaWdobGlnaHRlciA9IG5ldyBicnVzaCgpO1xuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb2RlID0gdGFyZ2V0W3Byb3BlcnR5TmFtZV07XG5cbiAgICAgICAgICAgICAgICAvLyByZW1vdmUgQ0RBVEEgZnJvbSA8U0NSSVBULz4gdGFncyBpZiBpdCdzIHByZXNlbnRcbiAgICAgICAgICAgICAgICBpZiAoY29uZi51c2VTY3JpcHRUYWdzKVxuICAgICAgICAgICAgICAgICAgICBjb2RlID0gc3RyaXBDRGF0YShjb2RlKTtcblxuICAgICAgICAgICAgICAgIC8vIEluamVjdCB0aXRsZSBpZiB0aGUgYXR0cmlidXRlIGlzIHByZXNlbnRcbiAgICAgICAgICAgICAgICBpZiAoKHRhcmdldC50aXRsZSB8fCAnJykgIT0gJycpXG4gICAgICAgICAgICAgICAgICAgIHBhcmFtcy50aXRsZSA9IHRhcmdldC50aXRsZTtcblxuICAgICAgICAgICAgICAgIHBhcmFtc1snYnJ1c2gnXSA9IGJydXNoTmFtZTtcbiAgICAgICAgICAgICAgICBoaWdobGlnaHRlci5pbml0KHBhcmFtcyk7XG4gICAgICAgICAgICAgICAgZWxlbWVudCA9IGhpZ2hsaWdodGVyLmdldERpdihjb2RlKTtcblxuICAgICAgICAgICAgICAgIC8vIGNhcnJ5IG92ZXIgSURcbiAgICAgICAgICAgICAgICBpZiAoKHRhcmdldC5pZCB8fCAnJykgIT0gJycpXG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuaWQgPSB0YXJnZXQuaWQ7XG4gICAgICAgICAgICAgICAgLy9ieSB6aGFueWkg5Y675o6J5aSa5L2Z55qE5aSW5Zu0ZGl2XG4gICAgICAgICAgICAgICAgdmFyIHRtcCA9IGVsZW1lbnQuZmlyc3RDaGlsZC5maXJzdENoaWxkO1xuICAgICAgICAgICAgICAgIHRtcC5jbGFzc05hbWUgPSBlbGVtZW50LmZpcnN0Q2hpbGQuY2xhc3NOYW1lO1xuXG4gICAgICAgICAgICAgICAgdGFyZ2V0LnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKHRtcCwgdGFyZ2V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogTWFpbiBlbnRyeSBwb2ludCBmb3IgdGhlIFN5bnRheEhpZ2hsaWdodGVyLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zIE9wdGlvbmFsIHBhcmFtcyB0byBhcHBseSB0byBhbGwgaGlnaGxpZ2h0ZWQgZWxlbWVudHMuXG4gICAgICAgICAqL1xuICAgICAgICBhbGw6IGZ1bmN0aW9uKHBhcmFtcylcbiAgICAgICAge1xuICAgICAgICAgICAgYXR0YWNoRXZlbnQoXG4gICAgICAgICAgICAgICAgd2luZG93LFxuICAgICAgICAgICAgICAgICdsb2FkJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbigpIHsgc2guaGlnaGxpZ2h0KHBhcmFtcyk7IH1cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICB9OyAvLyBlbmQgb2Ygc2hcblxuICAgIC8qKlxuICAgICAqIENoZWNrcyBpZiB0YXJnZXQgRE9NIGVsZW1lbnRzIGhhcyBzcGVjaWZpZWQgQ1NTIGNsYXNzLlxuICAgICAqIEBwYXJhbSB7RE9NRWxlbWVudH0gdGFyZ2V0IFRhcmdldCBET00gZWxlbWVudCB0byBjaGVjay5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gY2xhc3NOYW1lIE5hbWUgb2YgdGhlIENTUyBjbGFzcyB0byBjaGVjayBmb3IuXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn0gUmV0dXJucyB0cnVlIGlmIGNsYXNzIG5hbWUgaXMgcHJlc2VudCwgZmFsc2Ugb3RoZXJ3aXNlLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGhhc0NsYXNzKHRhcmdldCwgY2xhc3NOYW1lKVxuICAgIHtcbiAgICAgICAgcmV0dXJuIHRhcmdldC5jbGFzc05hbWUuaW5kZXhPZihjbGFzc05hbWUpICE9IC0xO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBBZGRzIENTUyBjbGFzcyBuYW1lIHRvIHRoZSB0YXJnZXQgRE9NIGVsZW1lbnQuXG4gICAgICogQHBhcmFtIHtET01FbGVtZW50fSB0YXJnZXQgVGFyZ2V0IERPTSBlbGVtZW50LlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBjbGFzc05hbWUgTmV3IENTUyBjbGFzcyB0byBhZGQuXG4gICAgICovXG4gICAgZnVuY3Rpb24gYWRkQ2xhc3ModGFyZ2V0LCBjbGFzc05hbWUpXG4gICAge1xuICAgICAgICBpZiAoIWhhc0NsYXNzKHRhcmdldCwgY2xhc3NOYW1lKSlcbiAgICAgICAgICAgIHRhcmdldC5jbGFzc05hbWUgKz0gJyAnICsgY2xhc3NOYW1lO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIENTUyBjbGFzcyBuYW1lIGZyb20gdGhlIHRhcmdldCBET00gZWxlbWVudC5cbiAgICAgKiBAcGFyYW0ge0RPTUVsZW1lbnR9IHRhcmdldCBUYXJnZXQgRE9NIGVsZW1lbnQuXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGNsYXNzTmFtZSBDU1MgY2xhc3MgdG8gcmVtb3ZlLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHJlbW92ZUNsYXNzKHRhcmdldCwgY2xhc3NOYW1lKVxuICAgIHtcbiAgICAgICAgdGFyZ2V0LmNsYXNzTmFtZSA9IHRhcmdldC5jbGFzc05hbWUucmVwbGFjZShjbGFzc05hbWUsICcnKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQ29udmVydHMgdGhlIHNvdXJjZSB0byBhcnJheSBvYmplY3QuIE1vc3RseSB1c2VkIGZvciBmdW5jdGlvbiBhcmd1bWVudHMgYW5kXG4gICAgICogbGlzdHMgcmV0dXJuZWQgYnkgZ2V0RWxlbWVudHNCeVRhZ05hbWUoKSB3aGljaCBhcmVuJ3QgQXJyYXkgb2JqZWN0cy5cbiAgICAgKiBAcGFyYW0ge0xpc3R9IHNvdXJjZSBTb3VyY2UgbGlzdC5cbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gUmV0dXJucyBhcnJheS5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiB0b0FycmF5KHNvdXJjZSlcbiAgICB7XG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNvdXJjZS5sZW5ndGg7IGkrKylcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKHNvdXJjZVtpXSk7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogU3BsaXRzIGJsb2NrIG9mIHRleHQgaW50byBsaW5lcy5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gYmxvY2sgQmxvY2sgb2YgdGV4dC5cbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gUmV0dXJucyBhcnJheSBvZiBsaW5lcy5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBzcGxpdExpbmVzKGJsb2NrKVxuICAgIHtcbiAgICAgICAgcmV0dXJuIGJsb2NrLnNwbGl0KC9cXHI/XFxuLyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2VuZXJhdGVzIEhUTUwgSUQgZm9yIHRoZSBoaWdobGlnaHRlci5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gaGlnaGxpZ2h0ZXJJZCBIaWdobGlnaHRlciBJRC5cbiAgICAgKiBAcmV0dXJuIHtTdHJpbmd9IFJldHVybnMgSFRNTCBJRC5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBnZXRIaWdobGlnaHRlcklkKGlkKVxuICAgIHtcbiAgICAgICAgdmFyIHByZWZpeCA9ICdoaWdobGlnaHRlcl8nO1xuICAgICAgICByZXR1cm4gaWQuaW5kZXhPZihwcmVmaXgpID09IDAgPyBpZCA6IHByZWZpeCArIGlkO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBGaW5kcyBIaWdobGlnaHRlciBpbnN0YW5jZSBieSBJRC5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gaGlnaGxpZ2h0ZXJJZCBIaWdobGlnaHRlciBJRC5cbiAgICAgKiBAcmV0dXJuIHtIaWdobGlnaHRlcn0gUmV0dXJucyBpbnN0YW5jZSBvZiB0aGUgaGlnaGxpZ2h0ZXIuXG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2V0SGlnaGxpZ2h0ZXJCeUlkKGlkKVxuICAgIHtcbiAgICAgICAgcmV0dXJuIHNoLnZhcnMuaGlnaGxpZ2h0ZXJzW2dldEhpZ2hsaWdodGVySWQoaWQpXTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogRmluZHMgaGlnaGxpZ2h0ZXIncyBESVYgY29udGFpbmVyLlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBoaWdobGlnaHRlcklkIEhpZ2hsaWdodGVyIElELlxuICAgICAqIEByZXR1cm4ge0VsZW1lbnR9IFJldHVybnMgaGlnaGxpZ2h0ZXIncyBESVYgZWxlbWVudC5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBnZXRIaWdobGlnaHRlckRpdkJ5SWQoaWQpXG4gICAge1xuICAgICAgICByZXR1cm4gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZ2V0SGlnaGxpZ2h0ZXJJZChpZCkpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTdG9yZXMgaGlnaGxpZ2h0ZXIgc28gdGhhdCBnZXRIaWdobGlnaHRlckJ5SWQoKSBjYW4gZG8gaXRzIHRoaW5nLiBFYWNoXG4gICAgICogaGlnaGxpZ2h0ZXIgbXVzdCBjYWxsIHRoaXMgbWV0aG9kIHRvIHByZXNlcnZlIGl0c2VsZi5cbiAgICAgKiBAcGFyYW0ge0hpZ2hpbGdodGVyfSBoaWdobGlnaHRlciBIaWdobGlnaHRlciBpbnN0YW5jZS5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBzdG9yZUhpZ2hsaWdodGVyKGhpZ2hsaWdodGVyKVxuICAgIHtcbiAgICAgICAgc2gudmFycy5oaWdobGlnaHRlcnNbZ2V0SGlnaGxpZ2h0ZXJJZChoaWdobGlnaHRlci5pZCldID0gaGlnaGxpZ2h0ZXI7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIExvb2tzIGZvciBhIGNoaWxkIG9yIHBhcmVudCBub2RlIHdoaWNoIGhhcyBzcGVjaWZpZWQgY2xhc3NuYW1lLlxuICAgICAqIEVxdWl2YWxlbnQgdG8galF1ZXJ5J3MgJChjb250YWluZXIpLmZpbmQoXCIuY2xhc3NOYW1lXCIpXG4gICAgICogQHBhcmFtIHtFbGVtZW50fSB0YXJnZXQgVGFyZ2V0IGVsZW1lbnQuXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHNlYXJjaCBDbGFzcyBuYW1lIG9yIG5vZGUgbmFtZSB0byBsb29rIGZvci5cbiAgICAgKiBAcGFyYW0ge0Jvb2xlYW59IHJldmVyc2UgSWYgc2V0IHRvIHRydWUsIHdpbGwgZ28gdXAgdGhlIG5vZGUgdHJlZSBpbnN0ZWFkIG9mIGRvd24uXG4gICAgICogQHJldHVybiB7RWxlbWVudH0gUmV0dXJucyBmb3VuZCBjaGlsZCBvciBwYXJlbnQgZWxlbWVudCBvbiBudWxsLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGZpbmRFbGVtZW50KHRhcmdldCwgc2VhcmNoLCByZXZlcnNlIC8qIG9wdGlvbmFsICovKVxuICAgIHtcbiAgICAgICAgaWYgKHRhcmdldCA9PSBudWxsKVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgdmFyIG5vZGVzXHRcdFx0PSByZXZlcnNlICE9IHRydWUgPyB0YXJnZXQuY2hpbGROb2RlcyA6IFsgdGFyZ2V0LnBhcmVudE5vZGUgXSxcbiAgICAgICAgICAgIHByb3BlcnR5VG9GaW5kXHQ9IHsgJyMnIDogJ2lkJywgJy4nIDogJ2NsYXNzTmFtZScgfVtzZWFyY2guc3Vic3RyKDAsIDEpXSB8fCAnbm9kZU5hbWUnLFxuICAgICAgICAgICAgZXhwZWN0ZWRWYWx1ZSxcbiAgICAgICAgICAgIGZvdW5kXG4gICAgICAgICAgICA7XG5cbiAgICAgICAgZXhwZWN0ZWRWYWx1ZSA9IHByb3BlcnR5VG9GaW5kICE9ICdub2RlTmFtZSdcbiAgICAgICAgICAgID8gc2VhcmNoLnN1YnN0cigxKVxuICAgICAgICAgICAgOiBzZWFyY2gudG9VcHBlckNhc2UoKVxuICAgICAgICA7XG5cbiAgICAgICAgLy8gbWFpbiByZXR1cm4gb2YgdGhlIGZvdW5kIG5vZGVcbiAgICAgICAgaWYgKCh0YXJnZXRbcHJvcGVydHlUb0ZpbmRdIHx8ICcnKS5pbmRleE9mKGV4cGVjdGVkVmFsdWUpICE9IC0xKVxuICAgICAgICAgICAgcmV0dXJuIHRhcmdldDtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgbm9kZXMgJiYgaSA8IG5vZGVzLmxlbmd0aCAmJiBmb3VuZCA9PSBudWxsOyBpKyspXG4gICAgICAgICAgICBmb3VuZCA9IGZpbmRFbGVtZW50KG5vZGVzW2ldLCBzZWFyY2gsIHJldmVyc2UpO1xuXG4gICAgICAgIHJldHVybiBmb3VuZDtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogTG9va3MgZm9yIGEgcGFyZW50IG5vZGUgd2hpY2ggaGFzIHNwZWNpZmllZCBjbGFzc25hbWUuXG4gICAgICogVGhpcyBpcyBhbiBhbGlhcyB0byA8Y29kZT5maW5kRWxlbWVudChjb250YWluZXIsIGNsYXNzTmFtZSwgdHJ1ZSk8L2NvZGU+LlxuICAgICAqIEBwYXJhbSB7RWxlbWVudH0gdGFyZ2V0IFRhcmdldCBlbGVtZW50LlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBjbGFzc05hbWUgQ2xhc3MgbmFtZSB0byBsb29rIGZvci5cbiAgICAgKiBAcmV0dXJuIHtFbGVtZW50fSBSZXR1cm5zIGZvdW5kIHBhcmVudCBlbGVtZW50IG9uIG51bGwuXG4gICAgICovXG4gICAgZnVuY3Rpb24gZmluZFBhcmVudEVsZW1lbnQodGFyZ2V0LCBjbGFzc05hbWUpXG4gICAge1xuICAgICAgICByZXR1cm4gZmluZEVsZW1lbnQodGFyZ2V0LCBjbGFzc05hbWUsIHRydWUpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBGaW5kcyBhbiBpbmRleCBvZiBlbGVtZW50IGluIHRoZSBhcnJheS5cbiAgICAgKiBAaWdub3JlXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHNlYXJjaEVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gZnJvbUluZGV4XG4gICAgICogQHJldHVybiB7TnVtYmVyfSBSZXR1cm5zIGluZGV4IG9mIGVsZW1lbnQgaWYgZm91bmQ7IC0xIG90aGVyd2lzZS5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBpbmRleE9mKGFycmF5LCBzZWFyY2hFbGVtZW50LCBmcm9tSW5kZXgpXG4gICAge1xuICAgICAgICBmcm9tSW5kZXggPSBNYXRoLm1heChmcm9tSW5kZXggfHwgMCwgMCk7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IGZyb21JbmRleDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgaWYoYXJyYXlbaV0gPT0gc2VhcmNoRWxlbWVudClcbiAgICAgICAgICAgICAgICByZXR1cm4gaTtcblxuICAgICAgICByZXR1cm4gLTE7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlcyBhIHVuaXF1ZSBlbGVtZW50IElELlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGd1aWQocHJlZml4KVxuICAgIHtcbiAgICAgICAgcmV0dXJuIChwcmVmaXggfHwgJycpICsgTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogMTAwMDAwMCkudG9TdHJpbmcoKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogTWVyZ2VzIHR3byBvYmplY3RzLiBWYWx1ZXMgZnJvbSBvYmoyIG92ZXJyaWRlIHZhbHVlcyBpbiBvYmoxLlxuICAgICAqIEZ1bmN0aW9uIGlzIE5PVCByZWN1cnNpdmUgYW5kIHdvcmtzIG9ubHkgZm9yIG9uZSBkaW1lbnNpb25hbCBvYmplY3RzLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmoxIEZpcnN0IG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqMiBTZWNvbmQgb2JqZWN0LlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gUmV0dXJucyBjb21iaW5hdGlvbiBvZiBib3RoIG9iamVjdHMuXG4gICAgICovXG4gICAgZnVuY3Rpb24gbWVyZ2Uob2JqMSwgb2JqMilcbiAgICB7XG4gICAgICAgIHZhciByZXN1bHQgPSB7fSwgbmFtZTtcblxuICAgICAgICBmb3IgKG5hbWUgaW4gb2JqMSlcbiAgICAgICAgICAgIHJlc3VsdFtuYW1lXSA9IG9iajFbbmFtZV07XG5cbiAgICAgICAgZm9yIChuYW1lIGluIG9iajIpXG4gICAgICAgICAgICByZXN1bHRbbmFtZV0gPSBvYmoyW25hbWVdO1xuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEF0dGVtcHRzIHRvIGNvbnZlcnQgc3RyaW5nIHRvIGJvb2xlYW4uXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHZhbHVlIElucHV0IHN0cmluZy5cbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufSBSZXR1cm5zIHRydWUgaWYgaW5wdXQgd2FzIFwidHJ1ZVwiLCBmYWxzZSBpZiBpbnB1dCB3YXMgXCJmYWxzZVwiIGFuZCB2YWx1ZSBvdGhlcndpc2UuXG4gICAgICovXG4gICAgZnVuY3Rpb24gdG9Cb29sZWFuKHZhbHVlKVxuICAgIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IHsgXCJ0cnVlXCIgOiB0cnVlLCBcImZhbHNlXCIgOiBmYWxzZSB9W3ZhbHVlXTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdCA9PSBudWxsID8gdmFsdWUgOiByZXN1bHQ7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIE9wZW5zIHVwIGEgY2VudGVyZWQgcG9wdXAgd2luZG93LlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB1cmxcdFx0VVJMIHRvIG9wZW4gaW4gdGhlIHdpbmRvdy5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZVx0XHRQb3B1cCBuYW1lLlxuICAgICAqIEBwYXJhbSB7aW50fSB3aWR0aFx0XHRQb3B1cCB3aWR0aC5cbiAgICAgKiBAcGFyYW0ge2ludH0gaGVpZ2h0XHRcdFBvcHVwIGhlaWdodC5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gb3B0aW9uc1x0d2luZG93Lm9wZW4oKSBvcHRpb25zLlxuICAgICAqIEByZXR1cm4ge1dpbmRvd31cdFx0XHRSZXR1cm5zIHdpbmRvdyBpbnN0YW5jZS5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBwb3B1cCh1cmwsIG5hbWUsIHdpZHRoLCBoZWlnaHQsIG9wdGlvbnMpXG4gICAge1xuICAgICAgICB2YXIgeCA9IChzY3JlZW4ud2lkdGggLSB3aWR0aCkgLyAyLFxuICAgICAgICAgICAgeSA9IChzY3JlZW4uaGVpZ2h0IC0gaGVpZ2h0KSAvIDJcbiAgICAgICAgICAgIDtcblxuICAgICAgICBvcHRpb25zICs9XHQnLCBsZWZ0PScgKyB4ICtcbiAgICAgICAgICAgICcsIHRvcD0nICsgeSArXG4gICAgICAgICAgICAnLCB3aWR0aD0nICsgd2lkdGggK1xuICAgICAgICAgICAgJywgaGVpZ2h0PScgKyBoZWlnaHRcbiAgICAgICAgO1xuICAgICAgICBvcHRpb25zID0gb3B0aW9ucy5yZXBsYWNlKC9eLC8sICcnKTtcblxuICAgICAgICB2YXIgd2luID0gd2luZG93Lm9wZW4odXJsLCBuYW1lLCBvcHRpb25zKTtcbiAgICAgICAgd2luLmZvY3VzKCk7XG4gICAgICAgIHJldHVybiB3aW47XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEFkZHMgZXZlbnQgaGFuZGxlciB0byB0aGUgdGFyZ2V0IG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqXHRcdFRhcmdldCBvYmplY3QuXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHR5cGVcdFx0TmFtZSBvZiB0aGUgZXZlbnQuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuY1x0SGFuZGxpbmcgZnVuY3Rpb24uXG4gICAgICovXG4gICAgZnVuY3Rpb24gYXR0YWNoRXZlbnQob2JqLCB0eXBlLCBmdW5jLCBzY29wZSlcbiAgICB7XG4gICAgICAgIGZ1bmN0aW9uIGhhbmRsZXIoZSlcbiAgICAgICAge1xuICAgICAgICAgICAgZSA9IGUgfHwgd2luZG93LmV2ZW50O1xuXG4gICAgICAgICAgICBpZiAoIWUudGFyZ2V0KVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGUudGFyZ2V0ID0gZS5zcmNFbGVtZW50O1xuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQgPSBmdW5jdGlvbigpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuYy5jYWxsKHNjb3BlIHx8IHdpbmRvdywgZSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKG9iai5hdHRhY2hFdmVudClcbiAgICAgICAge1xuICAgICAgICAgICAgb2JqLmF0dGFjaEV2ZW50KCdvbicgKyB0eXBlLCBoYW5kbGVyKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgIHtcbiAgICAgICAgICAgIG9iai5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGhhbmRsZXIsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBEaXNwbGF5cyBhbiBhbGVydC5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc3RyIFN0cmluZyB0byBkaXNwbGF5LlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGFsZXJ0KHN0cilcbiAgICB7XG4gICAgICAgIHdpbmRvdy5hbGVydChzaC5jb25maWcuc3RyaW5ncy5hbGVydCArIHN0cik7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEZpbmRzIGEgYnJ1c2ggYnkgaXRzIGFsaWFzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGFsaWFzXHRcdEJydXNoIGFsaWFzLlxuICAgICAqIEBwYXJhbSB7Qm9vbGVhbn0gc2hvd0FsZXJ0XHRTdXBwcmVzc2VzIHRoZSBhbGVydCBpZiBmYWxzZS5cbiAgICAgKiBAcmV0dXJuIHtCcnVzaH1cdFx0XHRcdFJldHVybnMgYnVyc2ggY29uc3RydWN0b3IgaWYgZm91bmQsIG51bGwgb3RoZXJ3aXNlLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGZpbmRCcnVzaChhbGlhcywgc2hvd0FsZXJ0KVxuICAgIHtcbiAgICAgICAgdmFyIGJydXNoZXMgPSBzaC52YXJzLmRpc2NvdmVyZWRCcnVzaGVzLFxuICAgICAgICAgICAgcmVzdWx0ID0gbnVsbFxuICAgICAgICAgICAgO1xuXG4gICAgICAgIGlmIChicnVzaGVzID09IG51bGwpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGJydXNoZXMgPSB7fTtcblxuICAgICAgICAgICAgLy8gRmluZCBhbGwgYnJ1c2hlc1xuICAgICAgICAgICAgZm9yICh2YXIgYnJ1c2ggaW4gc2guYnJ1c2hlcylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB2YXIgaW5mbyA9IHNoLmJydXNoZXNbYnJ1c2hdLFxuICAgICAgICAgICAgICAgICAgICBhbGlhc2VzID0gaW5mby5hbGlhc2VzXG4gICAgICAgICAgICAgICAgICAgIDtcblxuICAgICAgICAgICAgICAgIGlmIChhbGlhc2VzID09IG51bGwpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICAgICAgLy8ga2VlcCB0aGUgYnJ1c2ggbmFtZVxuICAgICAgICAgICAgICAgIGluZm8uYnJ1c2hOYW1lID0gYnJ1c2gudG9Mb3dlckNhc2UoKTtcblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYWxpYXNlcy5sZW5ndGg7IGkrKylcbiAgICAgICAgICAgICAgICAgICAgYnJ1c2hlc1thbGlhc2VzW2ldXSA9IGJydXNoO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzaC52YXJzLmRpc2NvdmVyZWRCcnVzaGVzID0gYnJ1c2hlcztcbiAgICAgICAgfVxuXG4gICAgICAgIHJlc3VsdCA9IHNoLmJydXNoZXNbYnJ1c2hlc1thbGlhc11dO1xuXG4gICAgICAgIGlmIChyZXN1bHQgPT0gbnVsbCAmJiBzaG93QWxlcnQpXG4gICAgICAgICAgICBhbGVydChzaC5jb25maWcuc3RyaW5ncy5ub0JydXNoICsgYWxpYXMpO1xuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEV4ZWN1dGVzIGEgY2FsbGJhY2sgb24gZWFjaCBsaW5lIGFuZCByZXBsYWNlcyBlYWNoIGxpbmUgd2l0aCByZXN1bHQgZnJvbSB0aGUgY2FsbGJhY2suXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHN0clx0XHRcdElucHV0IHN0cmluZy5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY2FsbGJhY2tcdFx0Q2FsbGJhY2sgZnVuY3Rpb24gdGFraW5nIG9uZSBzdHJpbmcgYXJndW1lbnQgYW5kIHJldHVybmluZyBhIHN0cmluZy5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBlYWNoTGluZShzdHIsIGNhbGxiYWNrKVxuICAgIHtcbiAgICAgICAgdmFyIGxpbmVzID0gc3BsaXRMaW5lcyhzdHIpO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspXG4gICAgICAgICAgICBsaW5lc1tpXSA9IGNhbGxiYWNrKGxpbmVzW2ldLCBpKTtcblxuICAgICAgICAvLyBpbmNsdWRlIFxcciB0byBlbmFibGUgY29weS1wYXN0ZSBvbiB3aW5kb3dzIChpZTgpIHdpdGhvdXQgZ2V0dGluZyBldmVyeXRoaW5nIG9uIG9uZSBsaW5lXG4gICAgICAgIHJldHVybiBsaW5lcy5qb2luKCdcXHJcXG4nKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogVGhpcyBpcyBhIHNwZWNpYWwgdHJpbSB3aGljaCBvbmx5IHJlbW92ZXMgZmlyc3QgYW5kIGxhc3QgZW1wdHkgbGluZXNcbiAgICAgKiBhbmQgZG9lc24ndCBhZmZlY3QgdmFsaWQgbGVhZGluZyBzcGFjZSBvbiB0aGUgZmlyc3QgbGluZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgICBJbnB1dCBzdHJpbmdcbiAgICAgKiBAcmV0dXJuIHtTdHJpbmd9ICAgICAgUmV0dXJucyBzdHJpbmcgd2l0aG91dCBlbXB0eSBmaXJzdCBhbmQgbGFzdCBsaW5lcy5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiB0cmltRmlyc3RBbmRMYXN0TGluZXMoc3RyKVxuICAgIHtcbiAgICAgICAgcmV0dXJuIHN0ci5yZXBsYWNlKC9eWyBdKltcXG5dK3xbXFxuXSpbIF0qJC9nLCAnJyk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFBhcnNlcyBrZXkvdmFsdWUgcGFpcnMgaW50byBoYXNoIG9iamVjdC5cbiAgICAgKlxuICAgICAqIFVuZGVyc3RhbmRzIHRoZSBmb2xsb3dpbmcgZm9ybWF0czpcbiAgICAgKiAtIG5hbWU6IHdvcmQ7XG4gICAgICogLSBuYW1lOiBbd29yZCwgd29yZF07XG4gICAgICogLSBuYW1lOiBcInN0cmluZ1wiO1xuICAgICAqIC0gbmFtZTogJ3N0cmluZyc7XG4gICAgICpcbiAgICAgKiBGb3IgZXhhbXBsZTpcbiAgICAgKiAgIG5hbWUxOiB2YWx1ZTsgbmFtZTI6IFt2YWx1ZSwgdmFsdWVdOyBuYW1lMzogJ3ZhbHVlJ1xuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHN0ciAgICBJbnB1dCBzdHJpbmcuXG4gICAgICogQHJldHVybiB7T2JqZWN0fSAgICAgICBSZXR1cm5zIGRlc2VyaWFsaXplZCBvYmplY3QuXG4gICAgICovXG4gICAgZnVuY3Rpb24gcGFyc2VQYXJhbXMoc3RyKVxuICAgIHtcbiAgICAgICAgdmFyIG1hdGNoLFxuICAgICAgICAgICAgcmVzdWx0ID0ge30sXG4gICAgICAgICAgICBhcnJheVJlZ2V4ID0gbmV3IFhSZWdFeHAoXCJeXFxcXFsoPzx2YWx1ZXM+KC4qPykpXFxcXF0kXCIpLFxuICAgICAgICAgICAgcmVnZXggPSBuZXcgWFJlZ0V4cChcbiAgICAgICAgICAgICAgICBcIig/PG5hbWU+W1xcXFx3LV0rKVwiICtcbiAgICAgICAgICAgICAgICAgICAgXCJcXFxccyo6XFxcXHMqXCIgK1xuICAgICAgICAgICAgICAgICAgICBcIig/PHZhbHVlPlwiICtcbiAgICAgICAgICAgICAgICAgICAgXCJbXFxcXHctJSNdK3xcIiArXHRcdC8vIHdvcmRcbiAgICAgICAgICAgICAgICAgICAgXCJcXFxcWy4qP1xcXFxdfFwiICtcdFx0Ly8gW10gYXJyYXlcbiAgICAgICAgICAgICAgICAgICAgJ1wiLio/XCJ8JyArXHRcdFx0Ly8gXCJcIiBzdHJpbmdcbiAgICAgICAgICAgICAgICAgICAgXCInLio/J1wiICtcdFx0XHQvLyAnJyBzdHJpbmdcbiAgICAgICAgICAgICAgICAgICAgXCIpXFxcXHMqOz9cIixcbiAgICAgICAgICAgICAgICBcImdcIlxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgO1xuXG4gICAgICAgIHdoaWxlICgobWF0Y2ggPSByZWdleC5leGVjKHN0cikpICE9IG51bGwpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IG1hdGNoLnZhbHVlXG4gICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9eWydcIl18WydcIl0kL2csICcnKSAvLyBzdHJpcCBxdW90ZXMgZnJvbSBlbmQgb2Ygc3RyaW5nc1xuICAgICAgICAgICAgICAgIDtcblxuICAgICAgICAgICAgLy8gdHJ5IHRvIHBhcnNlIGFycmF5IHZhbHVlXG4gICAgICAgICAgICBpZiAodmFsdWUgIT0gbnVsbCAmJiBhcnJheVJlZ2V4LnRlc3QodmFsdWUpKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHZhciBtID0gYXJyYXlSZWdleC5leGVjKHZhbHVlKTtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IG0udmFsdWVzLmxlbmd0aCA+IDAgPyBtLnZhbHVlcy5zcGxpdCgvXFxzKixcXHMqLykgOiBbXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVzdWx0W21hdGNoLm5hbWVdID0gdmFsdWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBXcmFwcyBlYWNoIGxpbmUgb2YgdGhlIHN0cmluZyBpbnRvIDxjb2RlLz4gdGFnIHdpdGggZ2l2ZW4gc3R5bGUgYXBwbGllZCB0byBpdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgICBJbnB1dCBzdHJpbmcuXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGNzcyAgIFN0eWxlIG5hbWUgdG8gYXBwbHkgdG8gdGhlIHN0cmluZy5cbiAgICAgKiBAcmV0dXJuIHtTdHJpbmd9ICAgICAgUmV0dXJucyBpbnB1dCBzdHJpbmcgd2l0aCBlYWNoIGxpbmUgc3Vycm91bmRlZCBieSA8c3Bhbi8+IHRhZy5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiB3cmFwTGluZXNXaXRoQ29kZShzdHIsIGNzcylcbiAgICB7XG4gICAgICAgIGlmIChzdHIgPT0gbnVsbCB8fCBzdHIubGVuZ3RoID09IDAgfHwgc3RyID09ICdcXG4nKVxuICAgICAgICAgICAgcmV0dXJuIHN0cjtcblxuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvPC9nLCAnJmx0OycpO1xuXG4gICAgICAgIC8vIFJlcGxhY2UgdHdvIG9yIG1vcmUgc2VxdWVudGlhbCBzcGFjZXMgd2l0aCAmbmJzcDsgbGVhdmluZyBsYXN0IHNwYWNlIHVudG91Y2hlZC5cbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoLyB7Mix9L2csIGZ1bmN0aW9uKG0pXG4gICAgICAgIHtcbiAgICAgICAgICAgIHZhciBzcGFjZXMgPSAnJztcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtLmxlbmd0aCAtIDE7IGkrKylcbiAgICAgICAgICAgICAgICBzcGFjZXMgKz0gc2guY29uZmlnLnNwYWNlO1xuXG4gICAgICAgICAgICByZXR1cm4gc3BhY2VzICsgJyAnO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBTcGxpdCBlYWNoIGxpbmUgYW5kIGFwcGx5IDxzcGFuIGNsYXNzPVwiLi4uXCI+Li4uPC9zcGFuPiB0byB0aGVtIHNvIHRoYXRcbiAgICAgICAgLy8gbGVhZGluZyBzcGFjZXMgYXJlbid0IGluY2x1ZGVkLlxuICAgICAgICBpZiAoY3NzICE9IG51bGwpXG4gICAgICAgICAgICBzdHIgPSBlYWNoTGluZShzdHIsIGZ1bmN0aW9uKGxpbmUpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWYgKGxpbmUubGVuZ3RoID09IDApXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnJztcblxuICAgICAgICAgICAgICAgIHZhciBzcGFjZXMgPSAnJztcblxuICAgICAgICAgICAgICAgIGxpbmUgPSBsaW5lLnJlcGxhY2UoL14oJm5ic3A7fCApKy8sIGZ1bmN0aW9uKHMpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBzcGFjZXMgPSBzO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBpZiAobGluZS5sZW5ndGggPT0gMClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNwYWNlcztcblxuICAgICAgICAgICAgICAgIHJldHVybiBzcGFjZXMgKyAnPGNvZGUgY2xhc3M9XCInICsgY3NzICsgJ1wiPicgKyBsaW5lICsgJzwvY29kZT4nO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHN0cjtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUGFkcyBudW1iZXIgd2l0aCB6ZXJvcyB1bnRpbCBpdCdzIGxlbmd0aCBpcyB0aGUgc2FtZSBhcyBnaXZlbiBsZW5ndGguXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gbnVtYmVyXHROdW1iZXIgdG8gcGFkLlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBsZW5ndGhcdE1heCBzdHJpbmcgbGVuZ3RoIHdpdGguXG4gICAgICogQHJldHVybiB7U3RyaW5nfVx0XHRcdFJldHVybnMgYSBzdHJpbmcgcGFkZGVkIHdpdGggcHJvcGVyIGFtb3VudCBvZiAnMCcuXG4gICAgICovXG4gICAgZnVuY3Rpb24gcGFkTnVtYmVyKG51bWJlciwgbGVuZ3RoKVxuICAgIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IG51bWJlci50b1N0cmluZygpO1xuXG4gICAgICAgIHdoaWxlIChyZXN1bHQubGVuZ3RoIDwgbGVuZ3RoKVxuICAgICAgICAgICAgcmVzdWx0ID0gJzAnICsgcmVzdWx0O1xuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFJlcGxhY2VzIHRhYnMgd2l0aCBzcGFjZXMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gY29kZVx0XHRTb3VyY2UgY29kZS5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gdGFiU2l6ZVx0U2l6ZSBvZiB0aGUgdGFiLlxuICAgICAqIEByZXR1cm4ge1N0cmluZ31cdFx0XHRSZXR1cm5zIGNvZGUgd2l0aCBhbGwgdGFicyByZXBsYWNlcyBieSBzcGFjZXMuXG4gICAgICovXG4gICAgZnVuY3Rpb24gcHJvY2Vzc1RhYnMoY29kZSwgdGFiU2l6ZSlcbiAgICB7XG4gICAgICAgIHZhciB0YWIgPSAnJztcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRhYlNpemU7IGkrKylcbiAgICAgICAgICAgIHRhYiArPSAnICc7XG5cbiAgICAgICAgcmV0dXJuIGNvZGUucmVwbGFjZSgvXFx0L2csIHRhYik7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFJlcGxhY2VzIHRhYnMgd2l0aCBzbWFydCBzcGFjZXMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gY29kZSAgICBDb2RlIHRvIGZpeCB0aGUgdGFicyBpbi5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gdGFiU2l6ZSBOdW1iZXIgb2Ygc3BhY2VzIGluIGEgY29sdW1uLlxuICAgICAqIEByZXR1cm4ge1N0cmluZ30gICAgICAgIFJldHVybnMgY29kZSB3aXRoIGFsbCB0YWJzIHJlcGxhY2VzIHdpdGggcm9wZXIgYW1vdW50IG9mIHNwYWNlcy5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBwcm9jZXNzU21hcnRUYWJzKGNvZGUsIHRhYlNpemUpXG4gICAge1xuICAgICAgICB2YXIgbGluZXMgPSBzcGxpdExpbmVzKGNvZGUpLFxuICAgICAgICAgICAgdGFiID0gJ1xcdCcsXG4gICAgICAgICAgICBzcGFjZXMgPSAnJ1xuICAgICAgICAgICAgO1xuXG4gICAgICAgIC8vIENyZWF0ZSBhIHN0cmluZyB3aXRoIDEwMDAgc3BhY2VzIHRvIGNvcHkgc3BhY2VzIGZyb20uLi5cbiAgICAgICAgLy8gSXQncyBhc3N1bWVkIHRoYXQgdGhlcmUgd291bGQgYmUgbm8gaW5kZW50YXRpb24gbG9uZ2VyIHRoYW4gdGhhdC5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA1MDsgaSsrKVxuICAgICAgICAgICAgc3BhY2VzICs9ICcgICAgICAgICAgICAgICAgICAgICc7IC8vIDIwIHNwYWNlcyAqIDUwXG5cbiAgICAgICAgLy8gVGhpcyBmdW5jdGlvbiBpbnNlcnRzIHNwZWNpZmllZCBhbW91bnQgb2Ygc3BhY2VzIGluIHRoZSBzdHJpbmdcbiAgICAgICAgLy8gd2hlcmUgYSB0YWIgaXMgd2hpbGUgcmVtb3ZpbmcgdGhhdCBnaXZlbiB0YWIuXG4gICAgICAgIGZ1bmN0aW9uIGluc2VydFNwYWNlcyhsaW5lLCBwb3MsIGNvdW50KVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm4gbGluZS5zdWJzdHIoMCwgcG9zKVxuICAgICAgICAgICAgICAgICsgc3BhY2VzLnN1YnN0cigwLCBjb3VudClcbiAgICAgICAgICAgICAgICArIGxpbmUuc3Vic3RyKHBvcyArIDEsIGxpbmUubGVuZ3RoKSAvLyBwb3MgKyAxIHdpbGwgZ2V0IHJpZCBvZiB0aGUgdGFiXG4gICAgICAgICAgICAgICAgO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIEdvIHRocm91Z2ggYWxsIHRoZSBsaW5lcyBhbmQgZG8gdGhlICdzbWFydCB0YWJzJyBtYWdpYy5cbiAgICAgICAgY29kZSA9IGVhY2hMaW5lKGNvZGUsIGZ1bmN0aW9uKGxpbmUpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGlmIChsaW5lLmluZGV4T2YodGFiKSA9PSAtMSlcbiAgICAgICAgICAgICAgICByZXR1cm4gbGluZTtcblxuICAgICAgICAgICAgdmFyIHBvcyA9IDA7XG5cbiAgICAgICAgICAgIHdoaWxlICgocG9zID0gbGluZS5pbmRleE9mKHRhYikpICE9IC0xKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgcHJldHR5IG11Y2ggYWxsIHRoZXJlIGlzIHRvIHRoZSAnc21hcnQgdGFicycgbG9naWMuXG4gICAgICAgICAgICAgICAgLy8gQmFzZWQgb24gdGhlIHBvc2l0aW9uIHdpdGhpbiB0aGUgbGluZSBhbmQgc2l6ZSBvZiBhIHRhYixcbiAgICAgICAgICAgICAgICAvLyBjYWxjdWxhdGUgdGhlIGFtb3VudCBvZiBzcGFjZXMgd2UgbmVlZCB0byBpbnNlcnQuXG4gICAgICAgICAgICAgICAgdmFyIHNwYWNlcyA9IHRhYlNpemUgLSBwb3MgJSB0YWJTaXplO1xuICAgICAgICAgICAgICAgIGxpbmUgPSBpbnNlcnRTcGFjZXMobGluZSwgcG9zLCBzcGFjZXMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gbGluZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGNvZGU7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFBlcmZvcm1zIHZhcmlvdXMgc3RyaW5nIGZpeGVzIGJhc2VkIG9uIGNvbmZpZ3VyYXRpb24uXG4gICAgICovXG4gICAgZnVuY3Rpb24gZml4SW5wdXRTdHJpbmcoc3RyKVxuICAgIHtcbiAgICAgICAgdmFyIGJyID0gLzxiclxccypcXC8/PnwmbHQ7YnJcXHMqXFwvPyZndDsvZ2k7XG5cbiAgICAgICAgaWYgKHNoLmNvbmZpZy5ibG9nZ2VyTW9kZSA9PSB0cnVlKVxuICAgICAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoYnIsICdcXG4nKTtcblxuICAgICAgICBpZiAoc2guY29uZmlnLnN0cmlwQnJzID09IHRydWUpXG4gICAgICAgICAgICBzdHIgPSBzdHIucmVwbGFjZShiciwgJycpO1xuXG4gICAgICAgIHJldHVybiBzdHI7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgYWxsIHdoaXRlIHNwYWNlIGF0IHRoZSBiZWdpbmluZyBhbmQgZW5kIG9mIGEgc3RyaW5nLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHN0ciAgIFN0cmluZyB0byB0cmltLlxuICAgICAqIEByZXR1cm4ge1N0cmluZ30gICAgICBSZXR1cm5zIHN0cmluZyB3aXRob3V0IGxlYWRpbmcgYW5kIGZvbGxvd2luZyB3aGl0ZSBzcGFjZSBjaGFyYWN0ZXJzLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHRyaW0oc3RyKVxuICAgIHtcbiAgICAgICAgcmV0dXJuIHN0ci5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJyk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFVuaW5kZW50cyBhIGJsb2NrIG9mIHRleHQgYnkgdGhlIGxvd2VzdCBjb21tb24gaW5kZW50IGFtb3VudC5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc3RyICAgVGV4dCB0byB1bmluZGVudC5cbiAgICAgKiBAcmV0dXJuIHtTdHJpbmd9ICAgICAgUmV0dXJucyB1bmluZGVudGVkIHRleHQgYmxvY2suXG4gICAgICovXG4gICAgZnVuY3Rpb24gdW5pbmRlbnQoc3RyKVxuICAgIHtcbiAgICAgICAgdmFyIGxpbmVzID0gc3BsaXRMaW5lcyhmaXhJbnB1dFN0cmluZyhzdHIpKSxcbiAgICAgICAgICAgIGluZGVudHMgPSBuZXcgQXJyYXkoKSxcbiAgICAgICAgICAgIHJlZ2V4ID0gL15cXHMqLyxcbiAgICAgICAgICAgIG1pbiA9IDEwMDBcbiAgICAgICAgICAgIDtcblxuICAgICAgICAvLyBnbyB0aHJvdWdoIGV2ZXJ5IGxpbmUgYW5kIGNoZWNrIGZvciBjb21tb24gbnVtYmVyIG9mIGluZGVudHNcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGggJiYgbWluID4gMDsgaSsrKVxuICAgICAgICB7XG4gICAgICAgICAgICB2YXIgbGluZSA9IGxpbmVzW2ldO1xuXG4gICAgICAgICAgICBpZiAodHJpbShsaW5lKS5sZW5ndGggPT0gMClcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICAgICAgdmFyIG1hdGNoZXMgPSByZWdleC5leGVjKGxpbmUpO1xuXG4gICAgICAgICAgICAvLyBJbiB0aGUgZXZlbnQgdGhhdCBqdXN0IG9uZSBsaW5lIGRvZXNuJ3QgaGF2ZSBsZWFkaW5nIHdoaXRlIHNwYWNlXG4gICAgICAgICAgICAvLyB3ZSBjYW4ndCB1bmluZGVudCBhbnl0aGluZywgc28gYmFpbCBjb21wbGV0ZWx5LlxuICAgICAgICAgICAgaWYgKG1hdGNoZXMgPT0gbnVsbClcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RyO1xuXG4gICAgICAgICAgICBtaW4gPSBNYXRoLm1pbihtYXRjaGVzWzBdLmxlbmd0aCwgbWluKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHRyaW0gbWluaW11bSBjb21tb24gbnVtYmVyIG9mIHdoaXRlIHNwYWNlIGZyb20gdGhlIGJlZ2luaW5nIG9mIGV2ZXJ5IGxpbmVcbiAgICAgICAgaWYgKG1pbiA+IDApXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgICAgIGxpbmVzW2ldID0gbGluZXNbaV0uc3Vic3RyKG1pbik7XG5cbiAgICAgICAgcmV0dXJuIGxpbmVzLmpvaW4oJ1xcbicpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBDYWxsYmFjayBtZXRob2QgZm9yIEFycmF5LnNvcnQoKSB3aGljaCBzb3J0cyBtYXRjaGVzIGJ5XG4gICAgICogaW5kZXggcG9zaXRpb24gYW5kIHRoZW4gYnkgbGVuZ3RoLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtNYXRjaH0gbTFcdExlZnQgb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7TWF0Y2h9IG0yICAgIFJpZ2h0IG9iamVjdC5cbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9ICAgICBSZXR1cm5zIC0xLCAwIG9yIC0xIGFzIGEgY29tcGFyaXNvbiByZXN1bHQuXG4gICAgICovXG4gICAgZnVuY3Rpb24gbWF0Y2hlc1NvcnRDYWxsYmFjayhtMSwgbTIpXG4gICAge1xuICAgICAgICAvLyBzb3J0IG1hdGNoZXMgYnkgaW5kZXggZmlyc3RcbiAgICAgICAgaWYobTEuaW5kZXggPCBtMi5pbmRleClcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgZWxzZSBpZihtMS5pbmRleCA+IG0yLmluZGV4KVxuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIGVsc2VcbiAgICAgICAge1xuICAgICAgICAgICAgLy8gaWYgaW5kZXggaXMgdGhlIHNhbWUsIHNvcnQgYnkgbGVuZ3RoXG4gICAgICAgICAgICBpZihtMS5sZW5ndGggPCBtMi5sZW5ndGgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgZWxzZSBpZihtMS5sZW5ndGggPiBtMi5sZW5ndGgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gMDtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogRXhlY3V0ZXMgZ2l2ZW4gcmVndWxhciBleHByZXNzaW9uIG9uIHByb3ZpZGVkIGNvZGUgYW5kIHJldHVybnMgYWxsXG4gICAgICogbWF0Y2hlcyB0aGF0IGFyZSBmb3VuZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBjb2RlICAgIENvZGUgdG8gZXhlY3V0ZSByZWd1bGFyIGV4cHJlc3Npb24gb24uXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHJlZ2V4ICAgUmVndWxhciBleHByZXNzaW9uIGl0ZW0gaW5mbyBmcm9tIDxjb2RlPnJlZ2V4TGlzdDwvY29kZT4gY29sbGVjdGlvbi5cbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gICAgICAgICBSZXR1cm5zIGEgbGlzdCBvZiBNYXRjaCBvYmplY3RzLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGdldE1hdGNoZXMoY29kZSwgcmVnZXhJbmZvKVxuICAgIHtcbiAgICAgICAgZnVuY3Rpb24gZGVmYXVsdEFkZChtYXRjaCwgcmVnZXhJbmZvKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hbMF07XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGluZGV4ID0gMCxcbiAgICAgICAgICAgIG1hdGNoID0gbnVsbCxcbiAgICAgICAgICAgIG1hdGNoZXMgPSBbXSxcbiAgICAgICAgICAgIGZ1bmMgPSByZWdleEluZm8uZnVuYyA/IHJlZ2V4SW5mby5mdW5jIDogZGVmYXVsdEFkZFxuICAgICAgICAgICAgO1xuXG4gICAgICAgIHdoaWxlKChtYXRjaCA9IHJlZ2V4SW5mby5yZWdleC5leGVjKGNvZGUpKSAhPSBudWxsKVxuICAgICAgICB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0TWF0Y2ggPSBmdW5jKG1hdGNoLCByZWdleEluZm8pO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mKHJlc3VsdE1hdGNoKSA9PSAnc3RyaW5nJylcbiAgICAgICAgICAgICAgICByZXN1bHRNYXRjaCA9IFtuZXcgc2guTWF0Y2gocmVzdWx0TWF0Y2gsIG1hdGNoLmluZGV4LCByZWdleEluZm8uY3NzKV07XG5cbiAgICAgICAgICAgIG1hdGNoZXMgPSBtYXRjaGVzLmNvbmNhdChyZXN1bHRNYXRjaCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbWF0Y2hlcztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogVHVybnMgYWxsIFVSTHMgaW4gdGhlIGNvZGUgaW50byA8YS8+IHRhZ3MuXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGNvZGUgSW5wdXQgY29kZS5cbiAgICAgKiBAcmV0dXJuIHtTdHJpbmd9IFJldHVybnMgY29kZSB3aXRoIDwvYT4gdGFncy5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBwcm9jZXNzVXJscyhjb2RlKVxuICAgIHtcbiAgICAgICAgdmFyIGd0ID0gLyguKikoKCZndDt8Jmx0OykuKikvO1xuXG4gICAgICAgIHJldHVybiBjb2RlLnJlcGxhY2Uoc2gucmVnZXhMaWIudXJsLCBmdW5jdGlvbihtKVxuICAgICAgICB7XG4gICAgICAgICAgICB2YXIgc3VmZml4ID0gJycsXG4gICAgICAgICAgICAgICAgbWF0Y2ggPSBudWxsXG4gICAgICAgICAgICAgICAgO1xuXG4gICAgICAgICAgICAvLyBXZSBpbmNsdWRlICZsdDsgYW5kICZndDsgaW4gdGhlIFVSTCBmb3IgdGhlIGNvbW1vbiBjYXNlcyBsaWtlIDxodHRwOi8vZ29vZ2xlLmNvbT5cbiAgICAgICAgICAgIC8vIFRoZSBwcm9ibGVtIGlzIHRoYXQgdGhleSBnZXQgdHJhbnNmb3JtZWQgaW50byAmbHQ7aHR0cDovL2dvb2dsZS5jb20mZ3Q7XG4gICAgICAgICAgICAvLyBXaGVyZSBhcyAmZ3Q7IGVhc2lseSBsb29rcyBsaWtlIHBhcnQgb2YgdGhlIFVSTCBzdHJpbmcuXG5cbiAgICAgICAgICAgIGlmIChtYXRjaCA9IGd0LmV4ZWMobSkpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbSA9IG1hdGNoWzFdO1xuICAgICAgICAgICAgICAgIHN1ZmZpeCA9IG1hdGNoWzJdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gJzxhIGhyZWY9XCInICsgbSArICdcIj4nICsgbSArICc8L2E+JyArIHN1ZmZpeDtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEZpbmRzIGFsbCA8U0NSSVBUIFRZUEU9XCJzeW50YXhoaWdobGlnaHRlclwiIC8+IGVsZW1lbnRzcy5cbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gUmV0dXJucyBhcnJheSBvZiBhbGwgZm91bmQgU3ludGF4SGlnaGxpZ2h0ZXIgdGFncy5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBnZXRTeW50YXhIaWdobGlnaHRlclNjcmlwdFRhZ3MoKVxuICAgIHtcbiAgICAgICAgdmFyIHRhZ3MgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc2NyaXB0JyksXG4gICAgICAgICAgICByZXN1bHQgPSBbXVxuICAgICAgICAgICAgO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGFncy5sZW5ndGg7IGkrKylcbiAgICAgICAgICAgIGlmICh0YWdzW2ldLnR5cGUgPT0gJ3N5bnRheGhpZ2hsaWdodGVyJylcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaCh0YWdzW2ldKTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTdHJpcHMgPCFbQ0RBVEFbXV0+IGZyb20gPFNDUklQVCAvPiBjb250ZW50IGJlY2F1c2UgaXQgc2hvdWxkIGJlIHVzZWRcbiAgICAgKiB0aGVyZSBpbiBtb3N0IGNhc2VzIGZvciBYSFRNTCBjb21wbGlhbmNlLlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBvcmlnaW5hbFx0SW5wdXQgY29kZS5cbiAgICAgKiBAcmV0dXJuIHtTdHJpbmd9IFJldHVybnMgY29kZSB3aXRob3V0IGxlYWRpbmcgPCFbQ0RBVEFbXV0+IHRhZ3MuXG4gICAgICovXG4gICAgZnVuY3Rpb24gc3RyaXBDRGF0YShvcmlnaW5hbClcbiAgICB7XG4gICAgICAgIHZhciBsZWZ0ID0gJzwhW0NEQVRBWycsXG4gICAgICAgICAgICByaWdodCA9ICddXT4nLFxuICAgICAgICAvLyBmb3Igc29tZSByZWFzb24gSUUgaW5zZXJ0cyBzb21lIGxlYWRpbmcgYmxhbmtzIGhlcmVcbiAgICAgICAgICAgIGNvcHkgPSB0cmltKG9yaWdpbmFsKSxcbiAgICAgICAgICAgIGNoYW5nZWQgPSBmYWxzZSxcbiAgICAgICAgICAgIGxlZnRMZW5ndGggPSBsZWZ0Lmxlbmd0aCxcbiAgICAgICAgICAgIHJpZ2h0TGVuZ3RoID0gcmlnaHQubGVuZ3RoXG4gICAgICAgICAgICA7XG5cbiAgICAgICAgaWYgKGNvcHkuaW5kZXhPZihsZWZ0KSA9PSAwKVxuICAgICAgICB7XG4gICAgICAgICAgICBjb3B5ID0gY29weS5zdWJzdHJpbmcobGVmdExlbmd0aCk7XG4gICAgICAgICAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBjb3B5TGVuZ3RoID0gY29weS5sZW5ndGg7XG5cbiAgICAgICAgaWYgKGNvcHkuaW5kZXhPZihyaWdodCkgPT0gY29weUxlbmd0aCAtIHJpZ2h0TGVuZ3RoKVxuICAgICAgICB7XG4gICAgICAgICAgICBjb3B5ID0gY29weS5zdWJzdHJpbmcoMCwgY29weUxlbmd0aCAtIHJpZ2h0TGVuZ3RoKTtcbiAgICAgICAgICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNoYW5nZWQgPyBjb3B5IDogb3JpZ2luYWw7XG4gICAgfTtcblxuXG4gICAgLyoqXG4gICAgICogUXVpY2sgY29kZSBtb3VzZSBkb3VibGUgY2xpY2sgaGFuZGxlci5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBxdWlja0NvZGVIYW5kbGVyKGUpXG4gICAge1xuICAgICAgICB2YXIgdGFyZ2V0ID0gZS50YXJnZXQsXG4gICAgICAgICAgICBoaWdobGlnaHRlckRpdiA9IGZpbmRQYXJlbnRFbGVtZW50KHRhcmdldCwgJy5zeW50YXhoaWdobGlnaHRlcicpLFxuICAgICAgICAgICAgY29udGFpbmVyID0gZmluZFBhcmVudEVsZW1lbnQodGFyZ2V0LCAnLmNvbnRhaW5lcicpLFxuICAgICAgICAgICAgdGV4dGFyZWEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZXh0YXJlYScpLFxuICAgICAgICAgICAgaGlnaGxpZ2h0ZXJcbiAgICAgICAgICAgIDtcblxuICAgICAgICBpZiAoIWNvbnRhaW5lciB8fCAhaGlnaGxpZ2h0ZXJEaXYgfHwgZmluZEVsZW1lbnQoY29udGFpbmVyLCAndGV4dGFyZWEnKSlcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICBoaWdobGlnaHRlciA9IGdldEhpZ2hsaWdodGVyQnlJZChoaWdobGlnaHRlckRpdi5pZCk7XG5cbiAgICAgICAgLy8gYWRkIHNvdXJjZSBjbGFzcyBuYW1lXG4gICAgICAgIGFkZENsYXNzKGhpZ2hsaWdodGVyRGl2LCAnc291cmNlJyk7XG5cbiAgICAgICAgLy8gSGF2ZSB0byBnbyBvdmVyIGVhY2ggbGluZSBhbmQgZ3JhYiBpdCdzIHRleHQsIGNhbid0IGp1c3QgZG8gaXQgb24gdGhlXG4gICAgICAgIC8vIGNvbnRhaW5lciBiZWNhdXNlIEZpcmVmb3ggbG9zZXMgYWxsIFxcbiB3aGVyZSBhcyBXZWJraXQgZG9lc24ndC5cbiAgICAgICAgdmFyIGxpbmVzID0gY29udGFpbmVyLmNoaWxkTm9kZXMsXG4gICAgICAgICAgICBjb2RlID0gW11cbiAgICAgICAgICAgIDtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgY29kZS5wdXNoKGxpbmVzW2ldLmlubmVyVGV4dCB8fCBsaW5lc1tpXS50ZXh0Q29udGVudCk7XG5cbiAgICAgICAgLy8gdXNpbmcgXFxyIGluc3RlYWQgb2YgXFxyIG9yIFxcclxcbiBtYWtlcyB0aGlzIHdvcmsgZXF1YWxseSB3ZWxsIG9uIElFLCBGRiBhbmQgV2Via2l0XG4gICAgICAgIGNvZGUgPSBjb2RlLmpvaW4oJ1xccicpO1xuXG4gICAgICAgIC8vIEZvciBXZWJraXQgYnJvd3NlcnMsIHJlcGxhY2UgbmJzcCB3aXRoIGEgYnJlYWtpbmcgc3BhY2VcbiAgICAgICAgY29kZSA9IGNvZGUucmVwbGFjZSgvXFx1MDBhMC9nLCBcIiBcIik7XG5cbiAgICAgICAgLy8gaW5qZWN0IDx0ZXh0YXJlYS8+IHRhZ1xuICAgICAgICB0ZXh0YXJlYS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShjb2RlKSk7XG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh0ZXh0YXJlYSk7XG5cbiAgICAgICAgLy8gcHJlc2VsZWN0IGFsbCB0ZXh0XG4gICAgICAgIHRleHRhcmVhLmZvY3VzKCk7XG4gICAgICAgIHRleHRhcmVhLnNlbGVjdCgpO1xuXG4gICAgICAgIC8vIHNldCB1cCBoYW5kbGVyIGZvciBsb3N0IGZvY3VzXG4gICAgICAgIGF0dGFjaEV2ZW50KHRleHRhcmVhLCAnYmx1cicsIGZ1bmN0aW9uKGUpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRleHRhcmVhLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGV4dGFyZWEpO1xuICAgICAgICAgICAgcmVtb3ZlQ2xhc3MoaGlnaGxpZ2h0ZXJEaXYsICdzb3VyY2UnKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIE1hdGNoIG9iamVjdC5cbiAgICAgKi9cbiAgICBzaC5NYXRjaCA9IGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgY3NzKVxuICAgIHtcbiAgICAgICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAgICAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG4gICAgICAgIHRoaXMubGVuZ3RoID0gdmFsdWUubGVuZ3RoO1xuICAgICAgICB0aGlzLmNzcyA9IGNzcztcbiAgICAgICAgdGhpcy5icnVzaE5hbWUgPSBudWxsO1xuICAgIH07XG5cbiAgICBzaC5NYXRjaC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpXG4gICAge1xuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogU2ltdWxhdGVzIEhUTUwgY29kZSB3aXRoIGEgc2NyaXB0aW5nIGxhbmd1YWdlIGVtYmVkZGVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHNjcmlwdEJydXNoTmFtZSBCcnVzaCBuYW1lIG9mIHRoZSBzY3JpcHRpbmcgbGFuZ3VhZ2UuXG4gICAgICovXG4gICAgc2guSHRtbFNjcmlwdCA9IGZ1bmN0aW9uKHNjcmlwdEJydXNoTmFtZSlcbiAgICB7XG4gICAgICAgIHZhciBicnVzaENsYXNzID0gZmluZEJydXNoKHNjcmlwdEJydXNoTmFtZSksXG4gICAgICAgICAgICBzY3JpcHRCcnVzaCxcbiAgICAgICAgICAgIHhtbEJydXNoID0gbmV3IHNoLmJydXNoZXMuWG1sKCksXG4gICAgICAgICAgICBicmFja2V0c1JlZ2V4ID0gbnVsbCxcbiAgICAgICAgICAgIHJlZiA9IHRoaXMsXG4gICAgICAgICAgICBtZXRob2RzVG9FeHBvc2UgPSAnZ2V0RGl2IGdldEh0bWwgaW5pdCcuc3BsaXQoJyAnKVxuICAgICAgICAgICAgO1xuXG4gICAgICAgIGlmIChicnVzaENsYXNzID09IG51bGwpXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgc2NyaXB0QnJ1c2ggPSBuZXcgYnJ1c2hDbGFzcygpO1xuXG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBtZXRob2RzVG9FeHBvc2UubGVuZ3RoOyBpKyspXG4gICAgICAgICAgICAvLyBtYWtlIGEgY2xvc3VyZSBzbyB3ZSBkb24ndCBsb3NlIHRoZSBuYW1lIGFmdGVyIGkgY2hhbmdlc1xuICAgICAgICAgICAgKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBuYW1lID0gbWV0aG9kc1RvRXhwb3NlW2ldO1xuXG4gICAgICAgICAgICAgICAgcmVmW25hbWVdID0gZnVuY3Rpb24oKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHhtbEJydXNoW25hbWVdLmFwcGx5KHhtbEJydXNoLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9KSgpO1xuXG4gICAgICAgIGlmIChzY3JpcHRCcnVzaC5odG1sU2NyaXB0ID09IG51bGwpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGFsZXJ0KHNoLmNvbmZpZy5zdHJpbmdzLmJydXNoTm90SHRtbFNjcmlwdCArIHNjcmlwdEJydXNoTmFtZSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB4bWxCcnVzaC5yZWdleExpc3QucHVzaChcbiAgICAgICAgICAgIHsgcmVnZXg6IHNjcmlwdEJydXNoLmh0bWxTY3JpcHQuY29kZSwgZnVuYzogcHJvY2VzcyB9XG4gICAgICAgICk7XG5cbiAgICAgICAgZnVuY3Rpb24gb2Zmc2V0TWF0Y2hlcyhtYXRjaGVzLCBvZmZzZXQpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgbWF0Y2hlcy5sZW5ndGg7IGorKylcbiAgICAgICAgICAgICAgICBtYXRjaGVzW2pdLmluZGV4ICs9IG9mZnNldDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHByb2Nlc3MobWF0Y2gsIGluZm8pXG4gICAgICAgIHtcbiAgICAgICAgICAgIHZhciBjb2RlID0gbWF0Y2guY29kZSxcbiAgICAgICAgICAgICAgICBtYXRjaGVzID0gW10sXG4gICAgICAgICAgICAgICAgcmVnZXhMaXN0ID0gc2NyaXB0QnJ1c2gucmVnZXhMaXN0LFxuICAgICAgICAgICAgICAgIG9mZnNldCA9IG1hdGNoLmluZGV4ICsgbWF0Y2gubGVmdC5sZW5ndGgsXG4gICAgICAgICAgICAgICAgaHRtbFNjcmlwdCA9IHNjcmlwdEJydXNoLmh0bWxTY3JpcHQsXG4gICAgICAgICAgICAgICAgcmVzdWx0XG4gICAgICAgICAgICAgICAgO1xuXG4gICAgICAgICAgICAvLyBhZGQgYWxsIG1hdGNoZXMgZnJvbSB0aGUgY29kZVxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWdleExpc3QubGVuZ3RoOyBpKyspXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gZ2V0TWF0Y2hlcyhjb2RlLCByZWdleExpc3RbaV0pO1xuICAgICAgICAgICAgICAgIG9mZnNldE1hdGNoZXMocmVzdWx0LCBvZmZzZXQpO1xuICAgICAgICAgICAgICAgIG1hdGNoZXMgPSBtYXRjaGVzLmNvbmNhdChyZXN1bHQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBhZGQgbGVmdCBzY3JpcHQgYnJhY2tldFxuICAgICAgICAgICAgaWYgKGh0bWxTY3JpcHQubGVmdCAhPSBudWxsICYmIG1hdGNoLmxlZnQgIT0gbnVsbClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBnZXRNYXRjaGVzKG1hdGNoLmxlZnQsIGh0bWxTY3JpcHQubGVmdCk7XG4gICAgICAgICAgICAgICAgb2Zmc2V0TWF0Y2hlcyhyZXN1bHQsIG1hdGNoLmluZGV4KTtcbiAgICAgICAgICAgICAgICBtYXRjaGVzID0gbWF0Y2hlcy5jb25jYXQocmVzdWx0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gYWRkIHJpZ2h0IHNjcmlwdCBicmFja2V0XG4gICAgICAgICAgICBpZiAoaHRtbFNjcmlwdC5yaWdodCAhPSBudWxsICYmIG1hdGNoLnJpZ2h0ICE9IG51bGwpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gZ2V0TWF0Y2hlcyhtYXRjaC5yaWdodCwgaHRtbFNjcmlwdC5yaWdodCk7XG4gICAgICAgICAgICAgICAgb2Zmc2V0TWF0Y2hlcyhyZXN1bHQsIG1hdGNoLmluZGV4ICsgbWF0Y2hbMF0ubGFzdEluZGV4T2YobWF0Y2gucmlnaHQpKTtcbiAgICAgICAgICAgICAgICBtYXRjaGVzID0gbWF0Y2hlcy5jb25jYXQocmVzdWx0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBtYXRjaGVzLmxlbmd0aDsgaisrKVxuICAgICAgICAgICAgICAgIG1hdGNoZXNbal0uYnJ1c2hOYW1lID0gYnJ1c2hDbGFzcy5icnVzaE5hbWU7XG5cbiAgICAgICAgICAgIHJldHVybiBtYXRjaGVzO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIE1haW4gSGlnaGxpdGhlciBjbGFzcy5cbiAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgKi9cbiAgICBzaC5IaWdobGlnaHRlciA9IGZ1bmN0aW9uKClcbiAgICB7XG4gICAgICAgIC8vIG5vdCBwdXR0aW5nIGFueSBjb2RlIGluIGhlcmUgYmVjYXVzZSBvZiB0aGUgcHJvdG90eXBlIGluaGVyaXRhbmNlXG4gICAgfTtcblxuICAgIHNoLkhpZ2hsaWdodGVyLnByb3RvdHlwZSA9IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHVybnMgdmFsdWUgb2YgdGhlIHBhcmFtZXRlciBwYXNzZWQgdG8gdGhlIGhpZ2hsaWdodGVyLlxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZVx0XHRcdFx0TmFtZSBvZiB0aGUgcGFyYW1ldGVyLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gZGVmYXVsdFZhbHVlXHRcdERlZmF1bHQgdmFsdWUuXG4gICAgICAgICAqIEByZXR1cm4ge09iamVjdH1cdFx0XHRcdFx0UmV0dXJucyBmb3VuZCB2YWx1ZSBvciBkZWZhdWx0IHZhbHVlIG90aGVyd2lzZS5cbiAgICAgICAgICovXG4gICAgICAgIGdldFBhcmFtOiBmdW5jdGlvbihuYW1lLCBkZWZhdWx0VmFsdWUpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSB0aGlzLnBhcmFtc1tuYW1lXTtcbiAgICAgICAgICAgIHJldHVybiB0b0Jvb2xlYW4ocmVzdWx0ID09IG51bGwgPyBkZWZhdWx0VmFsdWUgOiByZXN1bHQpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTaG9ydGN1dCB0byBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCkuXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lXHRcdE5hbWUgb2YgdGhlIGVsZW1lbnQgdG8gY3JlYXRlIChESVYsIEEsIGV0YykuXG4gICAgICAgICAqIEByZXR1cm4ge0hUTUxFbGVtZW50fVx0UmV0dXJucyBuZXcgSFRNTCBlbGVtZW50LlxuICAgICAgICAgKi9cbiAgICAgICAgY3JlYXRlOiBmdW5jdGlvbihuYW1lKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChuYW1lKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQXBwbGllcyBhbGwgcmVndWxhciBleHByZXNzaW9uIHRvIHRoZSBjb2RlIGFuZCBzdG9yZXMgYWxsIGZvdW5kXG4gICAgICAgICAqIG1hdGNoZXMgaW4gdGhlIGB0aGlzLm1hdGNoZXNgIGFycmF5LlxuICAgICAgICAgKiBAcGFyYW0ge0FycmF5fSByZWdleExpc3RcdFx0TGlzdCBvZiByZWd1bGFyIGV4cHJlc3Npb25zLlxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gY29kZVx0XHRcdFNvdXJjZSBjb2RlLlxuICAgICAgICAgKiBAcmV0dXJuIHtBcnJheX1cdFx0XHRcdFJldHVybnMgbGlzdCBvZiBtYXRjaGVzLlxuICAgICAgICAgKi9cbiAgICAgICAgZmluZE1hdGNoZXM6IGZ1bmN0aW9uKHJlZ2V4TGlzdCwgY29kZSlcbiAgICAgICAge1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuXG4gICAgICAgICAgICBpZiAocmVnZXhMaXN0ICE9IG51bGwpXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWdleExpc3QubGVuZ3RoOyBpKyspXG4gICAgICAgICAgICAgICAgICAgIC8vIEJVRzogbGVuZ3RoIHJldHVybnMgbGVuKzEgZm9yIGFycmF5IGlmIG1ldGhvZHMgYWRkZWQgdG8gcHJvdG90eXBlIGNoYWluIChvaXNpbmdAZ21haWwuY29tKVxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIChyZWdleExpc3RbaV0pID09IFwib2JqZWN0XCIpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSByZXN1bHQuY29uY2F0KGdldE1hdGNoZXMoY29kZSwgcmVnZXhMaXN0W2ldKSk7XG5cbiAgICAgICAgICAgIC8vIHNvcnQgYW5kIHJlbW92ZSBuZXN0ZWQgdGhlIG1hdGNoZXNcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlbW92ZU5lc3RlZE1hdGNoZXMocmVzdWx0LnNvcnQobWF0Y2hlc1NvcnRDYWxsYmFjaykpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDaGVja3MgdG8gc2VlIGlmIGFueSBvZiB0aGUgbWF0Y2hlcyBhcmUgaW5zaWRlIG9mIG90aGVyIG1hdGNoZXMuXG4gICAgICAgICAqIFRoaXMgcHJvY2VzcyB3b3VsZCBnZXQgcmlkIG9mIGhpZ2hsaWd0ZWQgc3RyaW5ncyBpbnNpZGUgY29tbWVudHMsXG4gICAgICAgICAqIGtleXdvcmRzIGluc2lkZSBzdHJpbmdzIGFuZCBzbyBvbi5cbiAgICAgICAgICovXG4gICAgICAgIHJlbW92ZU5lc3RlZE1hdGNoZXM6IGZ1bmN0aW9uKG1hdGNoZXMpXG4gICAgICAgIHtcbiAgICAgICAgICAgIC8vIE9wdGltaXplZCBieSBKb3NlIFByYWRvIChodHRwOi8vam9zZXByYWRvLmNvbSlcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbWF0Y2hlcy5sZW5ndGg7IGkrKylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2hlc1tpXSA9PT0gbnVsbClcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG5cbiAgICAgICAgICAgICAgICB2YXIgaXRlbUkgPSBtYXRjaGVzW2ldLFxuICAgICAgICAgICAgICAgICAgICBpdGVtSUVuZFBvcyA9IGl0ZW1JLmluZGV4ICsgaXRlbUkubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIDtcblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSBpICsgMTsgaiA8IG1hdGNoZXMubGVuZ3RoICYmIG1hdGNoZXNbaV0gIT09IG51bGw7IGorKylcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpdGVtSiA9IG1hdGNoZXNbal07XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW1KID09PSBudWxsKVxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGl0ZW1KLmluZGV4ID4gaXRlbUlFbmRQb3MpXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoaXRlbUouaW5kZXggPT0gaXRlbUkuaW5kZXggJiYgaXRlbUoubGVuZ3RoID4gaXRlbUkubGVuZ3RoKVxuICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hlc1tpXSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGl0ZW1KLmluZGV4ID49IGl0ZW1JLmluZGV4ICYmIGl0ZW1KLmluZGV4IDwgaXRlbUlFbmRQb3MpXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXRjaGVzW2pdID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBtYXRjaGVzO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDcmVhdGVzIGFuIGFycmF5IGNvbnRhaW5pbmcgaW50ZWdlciBsaW5lIG51bWJlcnMgc3RhcnRpbmcgZnJvbSB0aGUgJ2ZpcnN0LWxpbmUnIHBhcmFtLlxuICAgICAgICAgKiBAcmV0dXJuIHtBcnJheX0gUmV0dXJucyBhcnJheSBvZiBpbnRlZ2Vycy5cbiAgICAgICAgICovXG4gICAgICAgIGZpZ3VyZU91dExpbmVOdW1iZXJzOiBmdW5jdGlvbihjb2RlKVxuICAgICAgICB7XG4gICAgICAgICAgICB2YXIgbGluZXMgPSBbXSxcbiAgICAgICAgICAgICAgICBmaXJzdExpbmUgPSBwYXJzZUludCh0aGlzLmdldFBhcmFtKCdmaXJzdC1saW5lJykpXG4gICAgICAgICAgICAgICAgO1xuXG4gICAgICAgICAgICBlYWNoTGluZShjb2RlLCBmdW5jdGlvbihsaW5lLCBpbmRleClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBsaW5lcy5wdXNoKGluZGV4ICsgZmlyc3RMaW5lKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gbGluZXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERldGVybWluZXMgaWYgc3BlY2lmaWVkIGxpbmUgbnVtYmVyIGlzIGluIHRoZSBoaWdobGlnaHRlZCBsaXN0LlxuICAgICAgICAgKi9cbiAgICAgICAgaXNMaW5lSGlnaGxpZ2h0ZWQ6IGZ1bmN0aW9uKGxpbmVOdW1iZXIpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHZhciBsaXN0ID0gdGhpcy5nZXRQYXJhbSgnaGlnaGxpZ2h0JywgW10pO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mKGxpc3QpICE9ICdvYmplY3QnICYmIGxpc3QucHVzaCA9PSBudWxsKVxuICAgICAgICAgICAgICAgIGxpc3QgPSBbIGxpc3QgXTtcblxuICAgICAgICAgICAgcmV0dXJuIGluZGV4T2YobGlzdCwgbGluZU51bWJlci50b1N0cmluZygpKSAhPSAtMTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogR2VuZXJhdGVzIEhUTUwgbWFya3VwIGZvciBhIHNpbmdsZSBsaW5lIG9mIGNvZGUgd2hpbGUgZGV0ZXJtaW5pbmcgYWx0ZXJuYXRpbmcgbGluZSBzdHlsZS5cbiAgICAgICAgICogQHBhcmFtIHtJbnRlZ2VyfSBsaW5lTnVtYmVyXHRMaW5lIG51bWJlci5cbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IGNvZGUgTGluZVx0SFRNTCBtYXJrdXAuXG4gICAgICAgICAqIEByZXR1cm4ge1N0cmluZ31cdFx0XHRcdFJldHVybnMgSFRNTCBtYXJrdXAuXG4gICAgICAgICAqL1xuICAgICAgICBnZXRMaW5lSHRtbDogZnVuY3Rpb24obGluZUluZGV4LCBsaW5lTnVtYmVyLCBjb2RlKVxuICAgICAgICB7XG4gICAgICAgICAgICB2YXIgY2xhc3NlcyA9IFtcbiAgICAgICAgICAgICAgICAnbGluZScsXG4gICAgICAgICAgICAgICAgJ251bWJlcicgKyBsaW5lTnVtYmVyLFxuICAgICAgICAgICAgICAgICdpbmRleCcgKyBsaW5lSW5kZXgsXG4gICAgICAgICAgICAgICAgJ2FsdCcgKyAobGluZU51bWJlciAlIDIgPT0gMCA/IDEgOiAyKS50b1N0cmluZygpXG4gICAgICAgICAgICBdO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5pc0xpbmVIaWdobGlnaHRlZChsaW5lTnVtYmVyKSlcbiAgICAgICAgICAgICAgICBjbGFzc2VzLnB1c2goJ2hpZ2hsaWdodGVkJyk7XG5cbiAgICAgICAgICAgIGlmIChsaW5lTnVtYmVyID09IDApXG4gICAgICAgICAgICAgICAgY2xhc3Nlcy5wdXNoKCdicmVhaycpO1xuXG4gICAgICAgICAgICByZXR1cm4gJzxkaXYgY2xhc3M9XCInICsgY2xhc3Nlcy5qb2luKCcgJykgKyAnXCI+JyArIGNvZGUgKyAnPC9kaXY+JztcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogR2VuZXJhdGVzIEhUTUwgbWFya3VwIGZvciBsaW5lIG51bWJlciBjb2x1bW4uXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBjb2RlXHRcdFx0Q29tcGxldGUgY29kZSBIVE1MIG1hcmt1cC5cbiAgICAgICAgICogQHBhcmFtIHtBcnJheX0gbGluZU51bWJlcnNcdENhbGN1bGF0ZWQgbGluZSBudW1iZXJzLlxuICAgICAgICAgKiBAcmV0dXJuIHtTdHJpbmd9XHRcdFx0XHRSZXR1cm5zIEhUTUwgbWFya3VwLlxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0TGluZU51bWJlcnNIdG1sOiBmdW5jdGlvbihjb2RlLCBsaW5lTnVtYmVycylcbiAgICAgICAge1xuICAgICAgICAgICAgdmFyIGh0bWwgPSAnJyxcbiAgICAgICAgICAgICAgICBjb3VudCA9IHNwbGl0TGluZXMoY29kZSkubGVuZ3RoLFxuICAgICAgICAgICAgICAgIGZpcnN0TGluZSA9IHBhcnNlSW50KHRoaXMuZ2V0UGFyYW0oJ2ZpcnN0LWxpbmUnKSksXG4gICAgICAgICAgICAgICAgcGFkID0gdGhpcy5nZXRQYXJhbSgncGFkLWxpbmUtbnVtYmVycycpXG4gICAgICAgICAgICAgICAgO1xuXG4gICAgICAgICAgICBpZiAocGFkID09IHRydWUpXG4gICAgICAgICAgICAgICAgcGFkID0gKGZpcnN0TGluZSArIGNvdW50IC0gMSkudG9TdHJpbmcoKS5sZW5ndGg7XG4gICAgICAgICAgICBlbHNlIGlmIChpc05hTihwYWQpID09IHRydWUpXG4gICAgICAgICAgICAgICAgcGFkID0gMDtcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb3VudDsgaSsrKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHZhciBsaW5lTnVtYmVyID0gbGluZU51bWJlcnMgPyBsaW5lTnVtYmVyc1tpXSA6IGZpcnN0TGluZSArIGksXG4gICAgICAgICAgICAgICAgICAgIGNvZGUgPSBsaW5lTnVtYmVyID09IDAgPyBzaC5jb25maWcuc3BhY2UgOiBwYWROdW1iZXIobGluZU51bWJlciwgcGFkKVxuICAgICAgICAgICAgICAgICAgICA7XG5cbiAgICAgICAgICAgICAgICBodG1sICs9IHRoaXMuZ2V0TGluZUh0bWwoaSwgbGluZU51bWJlciwgY29kZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBodG1sO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTcGxpdHMgYmxvY2sgb2YgdGV4dCBpbnRvIGluZGl2aWR1YWwgRElWIGxpbmVzLlxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gY29kZVx0XHRcdENvZGUgdG8gaGlnaGxpZ2h0LlxuICAgICAgICAgKiBAcGFyYW0ge0FycmF5fSBsaW5lTnVtYmVyc1x0Q2FsY3VsYXRlZCBsaW5lIG51bWJlcnMuXG4gICAgICAgICAqIEByZXR1cm4ge1N0cmluZ31cdFx0XHRcdFJldHVybnMgaGlnaGxpZ2h0ZWQgY29kZSBpbiBIVE1MIGZvcm0uXG4gICAgICAgICAqL1xuICAgICAgICBnZXRDb2RlTGluZXNIdG1sOiBmdW5jdGlvbihodG1sLCBsaW5lTnVtYmVycylcbiAgICAgICAge1xuICAgICAgICAgICAgaHRtbCA9IHRyaW0oaHRtbCk7XG5cbiAgICAgICAgICAgIHZhciBsaW5lcyA9IHNwbGl0TGluZXMoaHRtbCksXG4gICAgICAgICAgICAgICAgcGFkTGVuZ3RoID0gdGhpcy5nZXRQYXJhbSgncGFkLWxpbmUtbnVtYmVycycpLFxuICAgICAgICAgICAgICAgIGZpcnN0TGluZSA9IHBhcnNlSW50KHRoaXMuZ2V0UGFyYW0oJ2ZpcnN0LWxpbmUnKSksXG4gICAgICAgICAgICAgICAgaHRtbCA9ICcnLFxuICAgICAgICAgICAgICAgIGJydXNoTmFtZSA9IHRoaXMuZ2V0UGFyYW0oJ2JydXNoJylcbiAgICAgICAgICAgICAgICA7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdmFyIGxpbmUgPSBsaW5lc1tpXSxcbiAgICAgICAgICAgICAgICAgICAgaW5kZW50ID0gL14oJm5ic3A7fFxccykrLy5leGVjKGxpbmUpLFxuICAgICAgICAgICAgICAgICAgICBzcGFjZXMgPSBudWxsLFxuICAgICAgICAgICAgICAgICAgICBsaW5lTnVtYmVyID0gbGluZU51bWJlcnMgPyBsaW5lTnVtYmVyc1tpXSA6IGZpcnN0TGluZSArIGk7XG4gICAgICAgICAgICAgICAgO1xuXG4gICAgICAgICAgICAgICAgaWYgKGluZGVudCAhPSBudWxsKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgc3BhY2VzID0gaW5kZW50WzBdLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgICAgIGxpbmUgPSBsaW5lLnN1YnN0cihzcGFjZXMubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAgICAgc3BhY2VzID0gc3BhY2VzLnJlcGxhY2UoJyAnLCBzaC5jb25maWcuc3BhY2UpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGxpbmUgPSB0cmltKGxpbmUpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGxpbmUubGVuZ3RoID09IDApXG4gICAgICAgICAgICAgICAgICAgIGxpbmUgPSBzaC5jb25maWcuc3BhY2U7XG5cbiAgICAgICAgICAgICAgICBodG1sICs9IHRoaXMuZ2V0TGluZUh0bWwoXG4gICAgICAgICAgICAgICAgICAgIGksXG4gICAgICAgICAgICAgICAgICAgIGxpbmVOdW1iZXIsXG4gICAgICAgICAgICAgICAgICAgIChzcGFjZXMgIT0gbnVsbCA/ICc8Y29kZSBjbGFzcz1cIicgKyBicnVzaE5hbWUgKyAnIHNwYWNlc1wiPicgKyBzcGFjZXMgKyAnPC9jb2RlPicgOiAnJykgKyBsaW5lXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGh0bWw7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHVybnMgSFRNTCBmb3IgdGhlIHRhYmxlIHRpdGxlIG9yIGVtcHR5IHN0cmluZyBpZiB0aXRsZSBpcyBudWxsLlxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0VGl0bGVIdG1sOiBmdW5jdGlvbih0aXRsZSlcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIHRpdGxlID8gJzxjYXB0aW9uPicgKyB0aXRsZSArICc8L2NhcHRpb24+JyA6ICcnO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGaW5kcyBhbGwgbWF0Y2hlcyBpbiB0aGUgc291cmNlIGNvZGUuXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBjb2RlXHRcdFNvdXJjZSBjb2RlIHRvIHByb2Nlc3MgbWF0Y2hlcyBpbi5cbiAgICAgICAgICogQHBhcmFtIHtBcnJheX0gbWF0Y2hlc1x0RGlzY292ZXJlZCByZWdleCBtYXRjaGVzLlxuICAgICAgICAgKiBAcmV0dXJuIHtTdHJpbmd9IFJldHVybnMgZm9ybWF0dGVkIEhUTUwgd2l0aCBwcm9jZXNzZWQgbWF0aGVzLlxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0TWF0Y2hlc0h0bWw6IGZ1bmN0aW9uKGNvZGUsIG1hdGNoZXMpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHZhciBwb3MgPSAwLFxuICAgICAgICAgICAgICAgIHJlc3VsdCA9ICcnLFxuICAgICAgICAgICAgICAgIGJydXNoTmFtZSA9IHRoaXMuZ2V0UGFyYW0oJ2JydXNoJywgJycpXG4gICAgICAgICAgICAgICAgO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBnZXRCcnVzaE5hbWVDc3MobWF0Y2gpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IG1hdGNoID8gKG1hdGNoLmJydXNoTmFtZSB8fCBicnVzaE5hbWUpIDogYnJ1c2hOYW1lO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQgPyByZXN1bHQgKyAnICcgOiAnJztcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vIEZpbmFsbHksIGdvIHRocm91Z2ggdGhlIGZpbmFsIGxpc3Qgb2YgbWF0Y2hlcyBhbmQgcHVsbCB0aGUgYWxsXG4gICAgICAgICAgICAvLyB0b2dldGhlciBhZGRpbmcgZXZlcnl0aGluZyBpbiBiZXR3ZWVuIHRoYXQgaXNuJ3QgYSBtYXRjaC5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbWF0Y2hlcy5sZW5ndGg7IGkrKylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB2YXIgbWF0Y2ggPSBtYXRjaGVzW2ldLFxuICAgICAgICAgICAgICAgICAgICBtYXRjaEJydXNoTmFtZVxuICAgICAgICAgICAgICAgICAgICA7XG5cbiAgICAgICAgICAgICAgICBpZiAobWF0Y2ggPT09IG51bGwgfHwgbWF0Y2gubGVuZ3RoID09PSAwKVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICAgICAgICAgIG1hdGNoQnJ1c2hOYW1lID0gZ2V0QnJ1c2hOYW1lQ3NzKG1hdGNoKTtcblxuICAgICAgICAgICAgICAgIHJlc3VsdCArPSB3cmFwTGluZXNXaXRoQ29kZShjb2RlLnN1YnN0cihwb3MsIG1hdGNoLmluZGV4IC0gcG9zKSwgbWF0Y2hCcnVzaE5hbWUgKyAncGxhaW4nKVxuICAgICAgICAgICAgICAgICAgICArIHdyYXBMaW5lc1dpdGhDb2RlKG1hdGNoLnZhbHVlLCBtYXRjaEJydXNoTmFtZSArIG1hdGNoLmNzcylcbiAgICAgICAgICAgICAgICA7XG5cbiAgICAgICAgICAgICAgICBwb3MgPSBtYXRjaC5pbmRleCArIG1hdGNoLmxlbmd0aCArIChtYXRjaC5vZmZzZXQgfHwgMCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGRvbid0IGZvcmdldCB0byBhZGQgd2hhdGV2ZXIncyByZW1haW5pbmcgaW4gdGhlIHN0cmluZ1xuICAgICAgICAgICAgcmVzdWx0ICs9IHdyYXBMaW5lc1dpdGhDb2RlKGNvZGUuc3Vic3RyKHBvcyksIGdldEJydXNoTmFtZUNzcygpICsgJ3BsYWluJyk7XG5cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdlbmVyYXRlcyBIVE1MIG1hcmt1cCBmb3IgdGhlIHdob2xlIHN5bnRheCBoaWdobGlnaHRlci5cbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IGNvZGUgU291cmNlIGNvZGUuXG4gICAgICAgICAqIEByZXR1cm4ge1N0cmluZ30gUmV0dXJucyBIVE1MIG1hcmt1cC5cbiAgICAgICAgICovXG4gICAgICAgIGdldEh0bWw6IGZ1bmN0aW9uKGNvZGUpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHZhciBodG1sID0gJycsXG4gICAgICAgICAgICAgICAgY2xhc3NlcyA9IFsgJ3N5bnRheGhpZ2hsaWdodGVyJyBdLFxuICAgICAgICAgICAgICAgIHRhYlNpemUsXG4gICAgICAgICAgICAgICAgbWF0Y2hlcyxcbiAgICAgICAgICAgICAgICBsaW5lTnVtYmVyc1xuICAgICAgICAgICAgICAgIDtcblxuICAgICAgICAgICAgLy8gcHJvY2VzcyBsaWdodCBtb2RlXG4gICAgICAgICAgICBpZiAodGhpcy5nZXRQYXJhbSgnbGlnaHQnKSA9PSB0cnVlKVxuICAgICAgICAgICAgICAgIHRoaXMucGFyYW1zLnRvb2xiYXIgPSB0aGlzLnBhcmFtcy5ndXR0ZXIgPSBmYWxzZTtcblxuICAgICAgICAgICAgY2xhc3NOYW1lID0gJ3N5bnRheGhpZ2hsaWdodGVyJztcblxuICAgICAgICAgICAgaWYgKHRoaXMuZ2V0UGFyYW0oJ2NvbGxhcHNlJykgPT0gdHJ1ZSlcbiAgICAgICAgICAgICAgICBjbGFzc2VzLnB1c2goJ2NvbGxhcHNlZCcpO1xuXG4gICAgICAgICAgICBpZiAoKGd1dHRlciA9IHRoaXMuZ2V0UGFyYW0oJ2d1dHRlcicpKSA9PSBmYWxzZSlcbiAgICAgICAgICAgICAgICBjbGFzc2VzLnB1c2goJ25vZ3V0dGVyJyk7XG5cbiAgICAgICAgICAgIC8vIGFkZCBjdXN0b20gdXNlciBzdHlsZSBuYW1lXG4gICAgICAgICAgICBjbGFzc2VzLnB1c2godGhpcy5nZXRQYXJhbSgnY2xhc3MtbmFtZScpKTtcblxuICAgICAgICAgICAgLy8gYWRkIGJydXNoIGFsaWFzIHRvIHRoZSBjbGFzcyBuYW1lIGZvciBjdXN0b20gQ1NTXG4gICAgICAgICAgICBjbGFzc2VzLnB1c2godGhpcy5nZXRQYXJhbSgnYnJ1c2gnKSk7XG5cbiAgICAgICAgICAgIGNvZGUgPSB0cmltRmlyc3RBbmRMYXN0TGluZXMoY29kZSlcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxyL2csICcgJykgLy8gSUUgbGV0cyB0aGVzZSBidWdnZXJzIHRocm91Z2hcbiAgICAgICAgICAgIDtcblxuICAgICAgICAgICAgdGFiU2l6ZSA9IHRoaXMuZ2V0UGFyYW0oJ3RhYi1zaXplJyk7XG5cbiAgICAgICAgICAgIC8vIHJlcGxhY2UgdGFicyB3aXRoIHNwYWNlc1xuICAgICAgICAgICAgY29kZSA9IHRoaXMuZ2V0UGFyYW0oJ3NtYXJ0LXRhYnMnKSA9PSB0cnVlXG4gICAgICAgICAgICAgICAgPyBwcm9jZXNzU21hcnRUYWJzKGNvZGUsIHRhYlNpemUpXG4gICAgICAgICAgICAgICAgOiBwcm9jZXNzVGFicyhjb2RlLCB0YWJTaXplKVxuICAgICAgICAgICAgO1xuXG4gICAgICAgICAgICAvLyB1bmluZGVudCBjb2RlIGJ5IHRoZSBjb21tb24gaW5kZW50YXRpb25cbiAgICAgICAgICAgIGlmICh0aGlzLmdldFBhcmFtKCd1bmluZGVudCcpKVxuICAgICAgICAgICAgICAgIGNvZGUgPSB1bmluZGVudChjb2RlKTtcblxuICAgICAgICAgICAgaWYgKGd1dHRlcilcbiAgICAgICAgICAgICAgICBsaW5lTnVtYmVycyA9IHRoaXMuZmlndXJlT3V0TGluZU51bWJlcnMoY29kZSk7XG5cbiAgICAgICAgICAgIC8vIGZpbmQgbWF0Y2hlcyBpbiB0aGUgY29kZSB1c2luZyBicnVzaGVzIHJlZ2V4IGxpc3RcbiAgICAgICAgICAgIG1hdGNoZXMgPSB0aGlzLmZpbmRNYXRjaGVzKHRoaXMucmVnZXhMaXN0LCBjb2RlKTtcbiAgICAgICAgICAgIC8vIHByb2Nlc3NlcyBmb3VuZCBtYXRjaGVzIGludG8gdGhlIGh0bWxcbiAgICAgICAgICAgIGh0bWwgPSB0aGlzLmdldE1hdGNoZXNIdG1sKGNvZGUsIG1hdGNoZXMpO1xuICAgICAgICAgICAgLy8gZmluYWxseSwgc3BsaXQgYWxsIGxpbmVzIHNvIHRoYXQgdGhleSB3cmFwIHdlbGxcbiAgICAgICAgICAgIGh0bWwgPSB0aGlzLmdldENvZGVMaW5lc0h0bWwoaHRtbCwgbGluZU51bWJlcnMpO1xuXG4gICAgICAgICAgICAvLyBmaW5hbGx5LCBwcm9jZXNzIHRoZSBsaW5rc1xuICAgICAgICAgICAgaWYgKHRoaXMuZ2V0UGFyYW0oJ2F1dG8tbGlua3MnKSlcbiAgICAgICAgICAgICAgICBodG1sID0gcHJvY2Vzc1VybHMoaHRtbCk7XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YobmF2aWdhdG9yKSAhPSAndW5kZWZpbmVkJyAmJiBuYXZpZ2F0b3IudXNlckFnZW50ICYmIG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL01TSUUvKSlcbiAgICAgICAgICAgICAgICBjbGFzc2VzLnB1c2goJ2llJyk7XG5cbiAgICAgICAgICAgIGh0bWwgPVxuICAgICAgICAgICAgICAgICc8ZGl2IGlkPVwiJyArIGdldEhpZ2hsaWdodGVySWQodGhpcy5pZCkgKyAnXCIgY2xhc3M9XCInICsgY2xhc3Nlcy5qb2luKCcgJykgKyAnXCI+J1xuICAgICAgICAgICAgICAgICAgICArICh0aGlzLmdldFBhcmFtKCd0b29sYmFyJykgPyBzaC50b29sYmFyLmdldEh0bWwodGhpcykgOiAnJylcbiAgICAgICAgICAgICAgICAgICAgKyAnPHRhYmxlIGJvcmRlcj1cIjBcIiBjZWxscGFkZGluZz1cIjBcIiBjZWxsc3BhY2luZz1cIjBcIj4nXG4gICAgICAgICAgICAgICAgICAgICsgdGhpcy5nZXRUaXRsZUh0bWwodGhpcy5nZXRQYXJhbSgndGl0bGUnKSlcbiAgICAgICAgICAgICAgICAgICAgKyAnPHRib2R5PidcbiAgICAgICAgICAgICAgICAgICAgKyAnPHRyPidcbiAgICAgICAgICAgICAgICAgICAgKyAoZ3V0dGVyID8gJzx0ZCBjbGFzcz1cImd1dHRlclwiPicgKyB0aGlzLmdldExpbmVOdW1iZXJzSHRtbChjb2RlKSArICc8L3RkPicgOiAnJylcbiAgICAgICAgICAgICAgICAgICAgKyAnPHRkIGNsYXNzPVwiY29kZVwiPidcbiAgICAgICAgICAgICAgICAgICAgKyAnPGRpdiBjbGFzcz1cImNvbnRhaW5lclwiPidcbiAgICAgICAgICAgICAgICAgICAgKyBodG1sXG4gICAgICAgICAgICAgICAgICAgICsgJzwvZGl2PidcbiAgICAgICAgICAgICAgICAgICAgKyAnPC90ZD4nXG4gICAgICAgICAgICAgICAgICAgICsgJzwvdHI+J1xuICAgICAgICAgICAgICAgICAgICArICc8L3Rib2R5PidcbiAgICAgICAgICAgICAgICAgICAgKyAnPC90YWJsZT4nXG4gICAgICAgICAgICAgICAgICAgICsgJzwvZGl2PidcbiAgICAgICAgICAgIDtcblxuICAgICAgICAgICAgcmV0dXJuIGh0bWw7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEhpZ2hsaWdodHMgdGhlIGNvZGUgYW5kIHJldHVybnMgY29tcGxldGUgSFRNTC5cbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IGNvZGUgICAgIENvZGUgdG8gaGlnaGxpZ2h0LlxuICAgICAgICAgKiBAcmV0dXJuIHtFbGVtZW50fSAgICAgICAgUmV0dXJucyBjb250YWluZXIgRElWIGVsZW1lbnQgd2l0aCBhbGwgbWFya3VwLlxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0RGl2OiBmdW5jdGlvbihjb2RlKVxuICAgICAgICB7XG4gICAgICAgICAgICBpZiAoY29kZSA9PT0gbnVsbClcbiAgICAgICAgICAgICAgICBjb2RlID0gJyc7XG5cbiAgICAgICAgICAgIHRoaXMuY29kZSA9IGNvZGU7XG5cbiAgICAgICAgICAgIHZhciBkaXYgPSB0aGlzLmNyZWF0ZSgnZGl2Jyk7XG5cbiAgICAgICAgICAgIC8vIGNyZWF0ZSBtYWluIEhUTUxcbiAgICAgICAgICAgIGRpdi5pbm5lckhUTUwgPSB0aGlzLmdldEh0bWwoY29kZSk7XG5cbiAgICAgICAgICAgIC8vIHNldCB1cCBjbGljayBoYW5kbGVyc1xuICAgICAgICAgICAgaWYgKHRoaXMuZ2V0UGFyYW0oJ3Rvb2xiYXInKSlcbiAgICAgICAgICAgICAgICBhdHRhY2hFdmVudChmaW5kRWxlbWVudChkaXYsICcudG9vbGJhcicpLCAnY2xpY2snLCBzaC50b29sYmFyLmhhbmRsZXIpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5nZXRQYXJhbSgncXVpY2stY29kZScpKVxuICAgICAgICAgICAgICAgIGF0dGFjaEV2ZW50KGZpbmRFbGVtZW50KGRpdiwgJy5jb2RlJyksICdkYmxjbGljaycsIHF1aWNrQ29kZUhhbmRsZXIpO1xuXG4gICAgICAgICAgICByZXR1cm4gZGl2O1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJbml0aWFsaXplcyB0aGUgaGlnaGxpZ2h0ZXIvYnJ1c2guXG4gICAgICAgICAqXG4gICAgICAgICAqIENvbnN0cnVjdG9yIGlzbid0IHVzZWQgZm9yIGluaXRpYWxpemF0aW9uIHNvIHRoYXQgbm90aGluZyBleGVjdXRlcyBkdXJpbmcgbmVjZXNzYXJ5XG4gICAgICAgICAqIGBuZXcgU3ludGF4SGlnaGxpZ2h0ZXIuSGlnaGxpZ2h0ZXIoKWAgY2FsbCB3aGVuIHNldHRpbmcgdXAgYnJ1c2ggaW5oZXJpdGVuY2UuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7SGFzaH0gcGFyYW1zIEhpZ2hsaWdodGVyIHBhcmFtZXRlcnMuXG4gICAgICAgICAqL1xuICAgICAgICBpbml0OiBmdW5jdGlvbihwYXJhbXMpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBndWlkKCk7XG5cbiAgICAgICAgICAgIC8vIHJlZ2lzdGVyIHRoaXMgaW5zdGFuY2UgaW4gdGhlIGhpZ2hsaWdodGVycyBsaXN0XG4gICAgICAgICAgICBzdG9yZUhpZ2hsaWdodGVyKHRoaXMpO1xuXG4gICAgICAgICAgICAvLyBsb2NhbCBwYXJhbXMgdGFrZSBwcmVjZWRlbmNlIG92ZXIgZGVmYXVsdHNcbiAgICAgICAgICAgIHRoaXMucGFyYW1zID0gbWVyZ2Uoc2guZGVmYXVsdHMsIHBhcmFtcyB8fCB7fSlcblxuICAgICAgICAgICAgLy8gcHJvY2VzcyBsaWdodCBtb2RlXG4gICAgICAgICAgICBpZiAodGhpcy5nZXRQYXJhbSgnbGlnaHQnKSA9PSB0cnVlKVxuICAgICAgICAgICAgICAgIHRoaXMucGFyYW1zLnRvb2xiYXIgPSB0aGlzLnBhcmFtcy5ndXR0ZXIgPSBmYWxzZTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ29udmVydHMgc3BhY2Ugc2VwYXJhdGVkIGxpc3Qgb2Yga2V5d29yZHMgaW50byBhIHJlZ3VsYXIgZXhwcmVzc2lvbiBzdHJpbmcuXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgICAgU3BhY2Ugc2VwYXJhdGVkIGtleXdvcmRzLlxuICAgICAgICAgKiBAcmV0dXJuIHtTdHJpbmd9ICAgICAgIFJldHVybnMgcmVndWxhciBleHByZXNzaW9uIHN0cmluZy5cbiAgICAgICAgICovXG4gICAgICAgIGdldEtleXdvcmRzOiBmdW5jdGlvbihzdHIpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHN0ciA9IHN0clxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJylcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxzKy9nLCAnfCcpXG4gICAgICAgICAgICA7XG5cbiAgICAgICAgICAgIHJldHVybiAnXFxcXGIoPzonICsgc3RyICsgJylcXFxcYic7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE1ha2VzIGEgYnJ1c2ggY29tcGF0aWJsZSB3aXRoIHRoZSBgaHRtbC1zY3JpcHRgIGZ1bmN0aW9uYWxpdHkuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSByZWdleEdyb3VwIE9iamVjdCBjb250YWluaW5nIGBsZWZ0YCBhbmQgYHJpZ2h0YCByZWd1bGFyIGV4cHJlc3Npb25zLlxuICAgICAgICAgKi9cbiAgICAgICAgZm9ySHRtbFNjcmlwdDogZnVuY3Rpb24ocmVnZXhHcm91cClcbiAgICAgICAge1xuICAgICAgICAgICAgdmFyIHJlZ2V4ID0geyAnZW5kJyA6IHJlZ2V4R3JvdXAucmlnaHQuc291cmNlIH07XG5cbiAgICAgICAgICAgIGlmKHJlZ2V4R3JvdXAuZW9mKVxuICAgICAgICAgICAgICAgIHJlZ2V4LmVuZCA9IFwiKD86KD86XCIgKyByZWdleC5lbmQgKyBcIil8JClcIjtcblxuICAgICAgICAgICAgdGhpcy5odG1sU2NyaXB0ID0ge1xuICAgICAgICAgICAgICAgIGxlZnQgOiB7IHJlZ2V4OiByZWdleEdyb3VwLmxlZnQsIGNzczogJ3NjcmlwdCcgfSxcbiAgICAgICAgICAgICAgICByaWdodCA6IHsgcmVnZXg6IHJlZ2V4R3JvdXAucmlnaHQsIGNzczogJ3NjcmlwdCcgfSxcbiAgICAgICAgICAgICAgICBjb2RlIDogbmV3IFhSZWdFeHAoXG4gICAgICAgICAgICAgICAgICAgIFwiKD88bGVmdD5cIiArIHJlZ2V4R3JvdXAubGVmdC5zb3VyY2UgKyBcIilcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICBcIig/PGNvZGU+Lio/KVwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiKD88cmlnaHQ+XCIgKyByZWdleC5lbmQgKyBcIilcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzZ2lcIlxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9OyAvLyBlbmQgb2YgSGlnaGxpZ2h0ZXJcblxuICAgIHJldHVybiBzaDtcbn0oKTsgLy8gZW5kIG9mIGFub255bW91cyBmdW5jdGlvblxuXG4vLyBDb21tb25KU1xudHlwZW9mKGV4cG9ydHMpICE9ICd1bmRlZmluZWQnID8gZXhwb3J0cy5TeW50YXhIaWdobGlnaHRlciA9IFN5bnRheEhpZ2hsaWdodGVyIDogbnVsbDtcblxuOyhmdW5jdGlvbigpXG57XG4gICAgLy8gQ29tbW9uSlNcbiAgICBTeW50YXhIaWdobGlnaHRlciA9IFN5bnRheEhpZ2hsaWdodGVyIHx8ICh0eXBlb2YgcmVxdWlyZSAhPT0gJ3VuZGVmaW5lZCc/IHJlcXVpcmUoJ3NoQ29yZScpLlN5bnRheEhpZ2hsaWdodGVyIDogbnVsbCk7XG5cbiAgICBmdW5jdGlvbiBCcnVzaCgpXG4gICAge1xuICAgICAgICAvLyBDcmVhdGVkIGJ5IFBldGVyIEF0b3JpYSBAIGh0dHA6Ly9pQXRvcmlhLmNvbVxuXG4gICAgICAgIHZhciBpbml0cyBcdCA9ICAnY2xhc3MgaW50ZXJmYWNlIGZ1bmN0aW9uIHBhY2thZ2UnO1xuXG4gICAgICAgIHZhciBrZXl3b3JkcyA9XHQnLUluZmluaXR5IC4uLnJlc3QgQXJyYXkgYXMgQVMzIEJvb2xlYW4gYnJlYWsgY2FzZSBjYXRjaCBjb25zdCBjb250aW51ZSBEYXRlIGRlY29kZVVSSSAnICtcbiAgICAgICAgICAgICAgICAnZGVjb2RlVVJJQ29tcG9uZW50IGRlZmF1bHQgZGVsZXRlIGRvIGR5bmFtaWMgZWFjaCBlbHNlIGVuY29kZVVSSSBlbmNvZGVVUklDb21wb25lbnQgZXNjYXBlICcgK1xuICAgICAgICAgICAgICAgICdleHRlbmRzIGZhbHNlIGZpbmFsIGZpbmFsbHkgZmxhc2hfcHJveHkgZm9yIGdldCBpZiBpbXBsZW1lbnRzIGltcG9ydCBpbiBpbmNsdWRlIEluZmluaXR5ICcgK1xuICAgICAgICAgICAgICAgICdpbnN0YW5jZW9mIGludCBpbnRlcm5hbCBpcyBpc0Zpbml0ZSBpc05hTiBpc1hNTE5hbWUgbGFiZWwgbmFtZXNwYWNlIE5hTiBuYXRpdmUgbmV3IG51bGwgJyArXG4gICAgICAgICAgICAgICAgJ051bGwgTnVtYmVyIE9iamVjdCBvYmplY3RfcHJveHkgb3ZlcnJpZGUgcGFyc2VGbG9hdCBwYXJzZUludCBwcml2YXRlIHByb3RlY3RlZCBwdWJsaWMgJyArXG4gICAgICAgICAgICAgICAgJ3JldHVybiBzZXQgc3RhdGljIFN0cmluZyBzdXBlciBzd2l0Y2ggdGhpcyB0aHJvdyB0cnVlIHRyeSB0eXBlb2YgdWludCB1bmRlZmluZWQgdW5lc2NhcGUgJyArXG4gICAgICAgICAgICAgICAgJ3VzZSB2b2lkIHdoaWxlIHdpdGgnXG4gICAgICAgICAgICA7XG5cbiAgICAgICAgdGhpcy5yZWdleExpc3QgPSBbXG4gICAgICAgICAgICB7IHJlZ2V4OiBTeW50YXhIaWdobGlnaHRlci5yZWdleExpYi5zaW5nbGVMaW5lQ0NvbW1lbnRzLFx0Y3NzOiAnY29tbWVudHMnIH0sXHRcdC8vIG9uZSBsaW5lIGNvbW1lbnRzXG4gICAgICAgICAgICB7IHJlZ2V4OiBTeW50YXhIaWdobGlnaHRlci5yZWdleExpYi5tdWx0aUxpbmVDQ29tbWVudHMsXHRcdGNzczogJ2NvbW1lbnRzJyB9LFx0XHQvLyBtdWx0aWxpbmUgY29tbWVudHNcbiAgICAgICAgICAgIHsgcmVnZXg6IFN5bnRheEhpZ2hsaWdodGVyLnJlZ2V4TGliLmRvdWJsZVF1b3RlZFN0cmluZyxcdFx0Y3NzOiAnc3RyaW5nJyB9LFx0XHQvLyBkb3VibGUgcXVvdGVkIHN0cmluZ3NcbiAgICAgICAgICAgIHsgcmVnZXg6IFN5bnRheEhpZ2hsaWdodGVyLnJlZ2V4TGliLnNpbmdsZVF1b3RlZFN0cmluZyxcdFx0Y3NzOiAnc3RyaW5nJyB9LFx0XHQvLyBzaW5nbGUgcXVvdGVkIHN0cmluZ3NcbiAgICAgICAgICAgIHsgcmVnZXg6IC9cXGIoW1xcZF0rKFxcLltcXGRdKyk/fDB4W2EtZjAtOV0rKVxcYi9naSxcdFx0XHRcdGNzczogJ3ZhbHVlJyB9LFx0XHRcdC8vIG51bWJlcnNcbiAgICAgICAgICAgIHsgcmVnZXg6IG5ldyBSZWdFeHAodGhpcy5nZXRLZXl3b3Jkcyhpbml0cyksICdnbScpLFx0XHRcdGNzczogJ2NvbG9yMycgfSxcdFx0Ly8gaW5pdGlhbGl6YXRpb25zXG4gICAgICAgICAgICB7IHJlZ2V4OiBuZXcgUmVnRXhwKHRoaXMuZ2V0S2V5d29yZHMoa2V5d29yZHMpLCAnZ20nKSxcdFx0Y3NzOiAna2V5d29yZCcgfSxcdFx0Ly8ga2V5d29yZHNcbiAgICAgICAgICAgIHsgcmVnZXg6IG5ldyBSZWdFeHAoJ3ZhcicsICdnbScpLFx0XHRcdFx0XHRcdFx0Y3NzOiAndmFyaWFibGUnIH0sXHRcdC8vIHZhcmlhYmxlXG4gICAgICAgICAgICB7IHJlZ2V4OiBuZXcgUmVnRXhwKCd0cmFjZScsICdnbScpLFx0XHRcdFx0XHRcdFx0Y3NzOiAnY29sb3IxJyB9XHRcdFx0Ly8gdHJhY2VcbiAgICAgICAgXTtcblxuICAgICAgICB0aGlzLmZvckh0bWxTY3JpcHQoU3ludGF4SGlnaGxpZ2h0ZXIucmVnZXhMaWIuc2NyaXB0U2NyaXB0VGFncyk7XG4gICAgfTtcblxuICAgIEJydXNoLnByb3RvdHlwZVx0PSBuZXcgU3ludGF4SGlnaGxpZ2h0ZXIuSGlnaGxpZ2h0ZXIoKTtcbiAgICBCcnVzaC5hbGlhc2VzXHQ9IFsnYWN0aW9uc2NyaXB0MycsICdhczMnXTtcblxuICAgIFN5bnRheEhpZ2hsaWdodGVyLmJydXNoZXMuQVMzID0gQnJ1c2g7XG5cbiAgICAvLyBDb21tb25KU1xuICAgIHR5cGVvZihleHBvcnRzKSAhPSAndW5kZWZpbmVkJyA/IGV4cG9ydHMuQnJ1c2ggPSBCcnVzaCA6IG51bGw7XG59KSgpO1xuXG47KGZ1bmN0aW9uKClcbntcbiAgICAvLyBDb21tb25KU1xuICAgIFN5bnRheEhpZ2hsaWdodGVyID0gU3ludGF4SGlnaGxpZ2h0ZXIgfHwgKHR5cGVvZiByZXF1aXJlICE9PSAndW5kZWZpbmVkJz8gcmVxdWlyZSgnc2hDb3JlJykuU3ludGF4SGlnaGxpZ2h0ZXIgOiBudWxsKTtcblxuICAgIGZ1bmN0aW9uIEJydXNoKClcbiAgICB7XG4gICAgICAgIC8vIEFwcGxlU2NyaXB0IGJydXNoIGJ5IERhdmlkIENoYW1iZXJzXG4gICAgICAgIC8vIGh0dHA6Ly9kYXZpZGNoYW1iZXJzZGVzaWduLmNvbS9cbiAgICAgICAgdmFyIGtleXdvcmRzICAgPSAnYWZ0ZXIgYmVmb3JlIGJlZ2lubmluZyBjb250aW51ZSBjb3B5IGVhY2ggZW5kIGV2ZXJ5IGZyb20gcmV0dXJuIGdldCBnbG9iYWwgaW4gbG9jYWwgbmFtZWQgb2Ygc2V0IHNvbWUgdGhhdCB0aGUgdGhlbiB0aW1lcyB0byB3aGVyZSB3aG9zZSB3aXRoIHdpdGhvdXQnO1xuICAgICAgICB2YXIgb3JkaW5hbHMgICA9ICdmaXJzdCBzZWNvbmQgdGhpcmQgZm91cnRoIGZpZnRoIHNpeHRoIHNldmVudGggZWlnaHRoIG5pbnRoIHRlbnRoIGxhc3QgZnJvbnQgYmFjayBtaWRkbGUnO1xuICAgICAgICB2YXIgc3BlY2lhbHMgICA9ICdhY3RpdmF0ZSBhZGQgYWxpYXMgQXBwbGVTY3JpcHQgYXNrIGF0dGFjaG1lbnQgYm9vbGVhbiBjbGFzcyBjb25zdGFudCBkZWxldGUgZHVwbGljYXRlIGVtcHR5IGV4aXN0cyBmYWxzZSBpZCBpbnRlZ2VyIGxpc3QgbWFrZSBtZXNzYWdlIG1vZGFsIG1vZGlmaWVkIG5ldyBubyBwYXJhZ3JhcGggcGkgcHJvcGVydGllcyBxdWl0IHJlYWwgcmVjb3JkIHJlbW92ZSByZXN0IHJlc3VsdCByZXZlYWwgcmV2ZXJzZSBydW4gcnVubmluZyBzYXZlIHN0cmluZyB0cnVlIHdvcmQgeWVzJztcblxuICAgICAgICB0aGlzLnJlZ2V4TGlzdCA9IFtcblxuICAgICAgICAgICAgeyByZWdleDogLygtLXwjKS4qJC9nbSxcbiAgICAgICAgICAgICAgICBjc3M6ICdjb21tZW50cycgfSxcblxuICAgICAgICAgICAgeyByZWdleDogL1xcKFxcKig/OltcXHNcXFNdKj9cXChcXCpbXFxzXFxTXSo/XFwqXFwpKSpbXFxzXFxTXSo/XFwqXFwpL2dtLCAvLyBzdXBwb3J0IG5lc3RlZCBjb21tZW50c1xuICAgICAgICAgICAgICAgIGNzczogJ2NvbW1lbnRzJyB9LFxuXG4gICAgICAgICAgICB7IHJlZ2V4OiAvXCJbXFxzXFxTXSo/XCIvZ20sXG4gICAgICAgICAgICAgICAgY3NzOiAnc3RyaW5nJyB9LFxuXG4gICAgICAgICAgICB7IHJlZ2V4OiAvKD86LHw6fMKsfCdzXFxifFxcKHxcXCl8XFx7fFxcfXzCq3xcXGJcXHcqwrspL2csXG4gICAgICAgICAgICAgICAgY3NzOiAnY29sb3IxJyB9LFxuXG4gICAgICAgICAgICB7IHJlZ2V4OiAvKC0pPyhcXGQpKyhcXC4oXFxkKT8pPyhFXFwrKFxcZCkrKT8vZywgLy8gbnVtYmVyc1xuICAgICAgICAgICAgICAgIGNzczogJ2NvbG9yMScgfSxcblxuICAgICAgICAgICAgeyByZWdleDogLyg/OiYoYW1wO3xndDt8bHQ7KT98PXzvv70gfD58PHziiaV8Pj184omkfDw9fFxcKnxcXCt8LXxcXC98w7d8XFxeKS9nLFxuICAgICAgICAgICAgICAgIGNzczogJ2NvbG9yMicgfSxcblxuICAgICAgICAgICAgeyByZWdleDogL1xcYig/OmFuZHxhc3xkaXZ8bW9kfG5vdHxvcnxyZXR1cm4oPyFcXHMmKShpbmcpP3xlcXVhbHN8KGlzKG4ndHwgbm90KT8gKT9lcXVhbCggdG8pP3xkb2VzKG4ndHwgbm90KSBlcXVhbHwoaXMobid0fCBub3QpPyApPyhncmVhdGVyfGxlc3MpIHRoYW4oIG9yIGVxdWFsKCB0byk/KT98KGNvbWVzfGRvZXMobid0fCBub3QpIGNvbWUpIChhZnRlcnxiZWZvcmUpfGlzKG4ndHwgbm90KT8oIGluKT8gKGJhY2t8ZnJvbnQpIG9mfGlzKG4ndHwgbm90KT8gYmVoaW5kfGlzKG4ndHwgbm90KT8oIChpbnxjb250YWluZWQgYnkpKT98ZG9lcyhuJ3R8IG5vdCkgY29udGFpbnxjb250YWluKHMpP3woc3RhcnR8YmVnaW58ZW5kKShzKT8gd2l0aHwoKGJ1dHxlbmQpICk/KGNvbnNpZGVyfGlnbm9yKWluZ3xwcm9wKGVydHkpP3woYSApP3JlZihlcmVuY2UpPyggdG8pP3xyZXBlYXQgKHVudGlsfHdoaWxlfHdpdGgpfCgoZW5kfGV4aXQpICk/cmVwZWF0fCgoZWxzZXxlbmQpICk/aWZ8ZWxzZXwoZW5kICk/KHNjcmlwdHx0ZWxsfHRyeSl8KG9uICk/ZXJyb3J8KHB1dCApP2ludG98KG9mICk/KGl0fG1lKXxpdHN8bXl8d2l0aCAodGltZW91dCggb2YpP3x0cmFuc2FjdGlvbil8ZW5kICh0aW1lb3V0fHRyYW5zYWN0aW9uKSlcXGIvZyxcbiAgICAgICAgICAgICAgICBjc3M6ICdrZXl3b3JkJyB9LFxuXG4gICAgICAgICAgICB7IHJlZ2V4OiAvXFxiXFxkKyhzdHxuZHxyZHx0aClcXGIvZywgLy8gb3JkaW5hbHNcbiAgICAgICAgICAgICAgICBjc3M6ICdrZXl3b3JkJyB9LFxuXG4gICAgICAgICAgICB7IHJlZ2V4OiAvXFxiKD86YWJvdXR8YWJvdmV8YWdhaW5zdHxhcm91bmR8YXR8YmVsb3d8YmVuZWF0aHxiZXNpZGV8YmV0d2VlbnxieXwoYXBhcnR8YXNpZGUpIGZyb218KGluc3RlYWR8b3V0KSBvZnxpbnRvfG9uKHRvKT98b3ZlcnxzaW5jZXx0aHIob3VnaHx1KXx1bmRlcilcXGIvZyxcbiAgICAgICAgICAgICAgICBjc3M6ICdjb2xvcjMnIH0sXG5cbiAgICAgICAgICAgIHsgcmVnZXg6IC9cXGIoPzphZGRpbmcgZm9sZGVyIGl0ZW1zIHRvfGFmdGVyIHJlY2VpdmluZ3xjaG9vc2UoICgocmVtb3RlICk/YXBwbGljYXRpb258Y29sb3J8Zm9sZGVyfGZyb20gbGlzdHxVUkwpKT98Y2xpcGJvYXJkIGluZm98c2V0IHRoZSBjbGlwYm9hcmQgdG98KHRoZSApP2NsaXBib2FyZHxlbnRpcmUgY29udGVudHN8ZGlzcGxheShpbmd8IChhbGVydHxkaWFsb2d8bW9kZSkpP3xkb2N1bWVudCggKGVkaXRlZHxmaWxlfG5pYiBuYW1lKSk/fGZpbGUoIChuYW1lfHR5cGUpKT98KGluZm8gKT9mb3J8Z2l2aW5nIHVwIGFmdGVyfChuYW1lICk/ZXh0ZW5zaW9ufHF1b3RlZCBmb3JtfHJldHVybihlZCk/fHNlY29uZCg/ISBpdGVtKShzKT98bGlzdCAoZGlza3N8Zm9sZGVyKXx0ZXh0IGl0ZW0oc3wgZGVsaW1pdGVycyk/fChVbmljb2RlICk/dGV4dHwoZGlzayApP2l0ZW0ocyk/fCgoY3VycmVudHxsaXN0KSApP3ZpZXd8KChjb250YWluZXJ8a2V5KSApP3dpbmRvd3x3aXRoIChkYXRhfGljb24oIChjYXV0aW9ufG5vdGV8c3RvcCkpP3xwYXJhbWV0ZXIocyk/fHByb21wdHxwcm9wZXJ0aWVzfHNlZWR8dGl0bGUpfGNhc2V8ZGlhY3JpdGljYWxzfGh5cGhlbnN8bnVtZXJpYyBzdHJpbmdzfHB1bmN0dWF0aW9ufHdoaXRlIHNwYWNlfGZvbGRlciBjcmVhdGlvbnxhcHBsaWNhdGlvbihzKCBmb2xkZXIpP3wgKHByb2Nlc3Nlc3xzY3JpcHRzIHBvc2l0aW9ufHN1cHBvcnQpKT98KChkZXNrdG9wICk/KHBpY3R1cmVzICk/fChkb2N1bWVudHN8ZG93bmxvYWRzfGZhdm9yaXRlc3xob21lfGtleWNoYWlufGxpYnJhcnl8bW92aWVzfG11c2ljfHB1YmxpY3xzY3JpcHRzfHNpdGVzfHN5c3RlbXx1c2Vyc3x1dGlsaXRpZXN8d29ya2Zsb3dzKSApZm9sZGVyfGRlc2t0b3B8Rm9sZGVyIEFjdGlvbiBzY3JpcHRzfGZvbnQoc3wgcGFuZWwpP3xoZWxwfGludGVybmV0IHBsdWdpbnN8bW9kZW0gc2NyaXB0c3woc3lzdGVtICk/cHJlZmVyZW5jZXN8cHJpbnRlciBkZXNjcmlwdGlvbnN8c2NyaXB0aW5nIChhZGRpdGlvbnN8Y29tcG9uZW50cyl8c2hhcmVkIChkb2N1bWVudHN8bGlicmFyaWVzKXxzdGFydHVwIChkaXNrfGl0ZW1zKXx0ZW1wb3JhcnkgaXRlbXN8dHJhc2h8b24gc2VydmVyfGluIEFwcGxlVGFsayB6b25lfCgoYXN8bG9uZ3xzaG9ydCkgKT91c2VyIG5hbWV8dXNlciAoSUR8bG9jYWxlKXwod2l0aCApP3Bhc3N3b3JkfGluIChidW5kbGUoIHdpdGggaWRlbnRpZmllcik/fGRpcmVjdG9yeSl8KGNsb3NlfG9wZW4gZm9yKSBhY2Nlc3N8cmVhZHx3cml0ZSggcGVybWlzc2lvbik/fChnfHMpZXQgZW9mfHVzaW5nKCBkZWxpbWl0ZXJzKT98c3RhcnRpbmcgYXR8ZGVmYXVsdCAoYW5zd2VyfGJ1dHRvbnxjb2xvcnxjb3VudHJ5IGNvZGV8ZW50cih5fGllcyl8aWRlbnRpZmllcnN8aXRlbXN8bmFtZXxsb2NhdGlvbnxzY3JpcHQgZWRpdG9yKXxoaWRkZW4oIGFuc3dlcik/fG9wZW4oZWR8IChsb2NhdGlvbnx1bnRpdGxlZCkpP3xlcnJvciAoaGFuZGxpbmd8cmVwb3J0aW5nKXwoZG8oIHNoZWxsKT98bG9hZHxydW58c3RvcmUpIHNjcmlwdHxhZG1pbmlzdHJhdG9yIHByaXZpbGVnZXN8YWx0ZXJpbmcgbGluZSBlbmRpbmdzfGdldCB2b2x1bWUgc2V0dGluZ3N8KGFsZXJ0fGJvb3R8aW5wdXR8bW91bnR8b3V0cHV0fHNldCkgdm9sdW1lfG91dHB1dCBtdXRlZHwoZmF4fHJhbmRvbSApP251bWJlcnxyb3VuZChpbmcpP3x1cHxkb3dufHRvd2FyZCB6ZXJvfHRvIG5lYXJlc3R8YXMgdGF1Z2h0IGluIHNjaG9vbHxzeXN0ZW0gKGF0dHJpYnV0ZXxpbmZvKXwoKEFwcGxlU2NyaXB0KCBTdHVkaW8pP3xzeXN0ZW0pICk/dmVyc2lvbnwoaG9tZSApP2RpcmVjdG9yeXwoSVB2NHxwcmltYXJ5IEV0aGVybmV0KSBhZGRyZXNzfENQVSAodHlwZXxzcGVlZCl8cGh5c2ljYWwgbWVtb3J5fHRpbWUgKHN0YW1wfHRvIEdNVCl8cmVwbGFjaW5nfEFTQ0lJIChjaGFyYWN0ZXJ8bnVtYmVyKXxsb2NhbGl6ZWQgc3RyaW5nfGZyb20gdGFibGV8b2Zmc2V0fHN1bW1hcml6ZXxiZWVwfGRlbGF5fHNheXwoZW1wdHl8bXVsdGlwbGUpIHNlbGVjdGlvbnMgYWxsb3dlZHwob2Z8cHJlZmVycmVkKSB0eXBlfGludmlzaWJsZXN8c2hvd2luZyggcGFja2FnZSBjb250ZW50cyk/fGVkaXRhYmxlIFVSTHwoRmlsZXxGVFB8TmV3c3xNZWRpYXxXZWIpIFtTc11lcnZlcnN8VGVsbmV0IGhvc3RzfERpcmVjdG9yeSBzZXJ2aWNlc3xSZW1vdGUgYXBwbGljYXRpb25zfHdhaXRpbmcgdW50aWwgY29tcGxldGlvbnxzYXZpbmcoIChpbnx0bykpP3xwYXRoIChmb3J8dG8oICgoKGN1cnJlbnR8ZnJvbnRtb3N0KSApP2FwcGxpY2F0aW9ufHJlc291cmNlKSk/KXxQT1NJWCAoZmlsZXxwYXRoKXwoYmFja2dyb3VuZHxSR0IpIGNvbG9yfChPS3xjYW5jZWwpIGJ1dHRvbiBuYW1lfGNhbmNlbCBidXR0b258YnV0dG9uKHMpP3xjdWJpYyAoKGNlbnRpKT9tZXQocmV8ZXIpc3x5YXJkc3xmZWV0fGluY2hlcyl8c3F1YXJlICgoa2lsbyk/bWV0KHJlfGVyKXN8bWlsZXN8eWFyZHN8ZmVldCl8KGNlbnRpfGtpbG8pP21ldChyZXxlcilzfG1pbGVzfHlhcmRzfGZlZXR8aW5jaGVzfGxpdChyZXxlcilzfGdhbGxvbnN8cXVhcnRzfChraWxvKT9ncmFtc3xvdW5jZXN8cG91bmRzfGRlZ3JlZXMgKENlbHNpdXN8RmFocmVuaGVpdHxLZWx2aW4pfHByaW50KCAoZGlhbG9nfHNldHRpbmdzKSk/fGNsb3MoZShhYmxlKT98aW5nKXwoZGUpP21pbmlhdHVyaXplZHxtaW5pYXR1cml6YWJsZXx6b29tKGVkfGFibGUpfGF0dHJpYnV0ZSBydW58YWN0aW9uIChtZXRob2R8cHJvcGVydHl8dGl0bGUpfHBob25lfGVtYWlsfCgoc3RhcnR8ZW5kKWluZ3xob21lKSBwYWdlfCgoYmlydGh8Y3JlYXRpb258Y3VycmVudHxjdXN0b218bW9kaWZpY2F0aW9uKSApP2RhdGV8KCgoKHBob25ldGljICk/KGZpcnN0fGxhc3R8bWlkZGxlKSl8Y29tcHV0ZXJ8aG9zdHxtYWlkZW58cmVsYXRlZCkgfG5pY2spP25hbWV8YWltfGljcXxqYWJiZXJ8bXNufHlhaG9vfGFkZHJlc3MoZXMpP3xzYXZlIGFkZHJlc3Nib29rfHNob3VsZCBlbmFibGUgYWN0aW9ufGNpdHl8Y291bnRyeSggY29kZSk/fGZvcm1hdHRlKHJ8ZCBhZGRyZXNzKXwocGFsZXR0ZSApP2xhYmVsfHN0YXRlfHN0cmVldHx6aXB8QUlNIFtIaF1hbmRsZShzKT98bXkgY2FyZHxzZWxlY3QoaW9ufCBhbGwpP3x1bnNhdmVkfChhbHBoYSApP3ZhbHVlfGVudHIoeXxpZXMpfGdyb3VwfChJQ1F8SmFiYmVyfE1TTikgaGFuZGxlfHBlcnNvbnxwZW9wbGV8Y29tcGFueXxkZXBhcnRtZW50fGljb24gaW1hZ2V8am9iIHRpdGxlfG5vdGV8b3JnYW5pemF0aW9ufHN1ZmZpeHx2Y2FyZHx1cmx8Y29waWVzfGNvbGxhdGluZ3xwYWdlcyAoYWNyb3NzfGRvd24pfHJlcXVlc3QgcHJpbnQgdGltZXx0YXJnZXQoIHByaW50ZXIpP3woKEdVSSBTY3JpcHRpbmd8U2NyaXB0IG1lbnUpICk/ZW5hYmxlZHxzaG93IENvbXB1dGVyIHNjcmlwdHN8KGRlKT9hY3RpdmF0ZWR8YXdha2UgZnJvbSBuaWJ8YmVjYW1lIChrZXl8bWFpbil8Y2FsbCBtZXRob2R8b2YgKGNsYXNzfG9iamVjdCl8Y2VudGVyfGNsaWNrZWQgdG9vbGJhciBpdGVtfGNsb3NlZHxmb3IgZG9jdW1lbnR8ZXhwb3NlZHwoY2FuICk/aGlkZXxpZGxlfGtleWJvYXJkIChkb3dufHVwKXxldmVudCggKG51bWJlcnx0eXBlKSk/fGxhdW5jaChlZCk/fGxvYWQgKGltYWdlfG1vdmllfG5pYnxzb3VuZCl8b3duZXJ8bG9nfG1vdXNlIChkb3dufGRyYWdnZWR8ZW50ZXJlZHxleGl0ZWR8bW92ZWR8dXApfG1vdmV8Y29sdW1ufGxvY2FsaXphdGlvbnxyZXNvdXJjZXxzY3JpcHR8cmVnaXN0ZXJ8ZHJhZyAoaW5mb3x0eXBlcyl8cmVzaWduZWQgKGFjdGl2ZXxrZXl8bWFpbil8cmVzaXooZShkKT98YWJsZSl8cmlnaHQgbW91c2UgKGRvd258ZHJhZ2dlZHx1cCl8c2Nyb2xsIHdoZWVsfChhdCApP2luZGV4fHNob3VsZCAoY2xvc2V8b3BlbiggdW50aXRsZWQpP3xxdWl0KCBhZnRlciBsYXN0IHdpbmRvdyBjbG9zZWQpP3x6b29tKXwoKHByb3Bvc2VkfHNjcmVlbikgKT9ib3VuZHN8c2hvdyhuKT98YmVoaW5kfGluIGZyb250IG9mfHNpemUgKG1vZGV8dG8gZml0KXx1cGRhdGUoZHwgdG9vbGJhciBpdGVtKT98d2FzIChoaWRkZW58bWluaWF0dXJpemVkKXx3aWxsIChiZWNvbWUgYWN0aXZlfGNsb3NlfGZpbmlzaCBsYXVuY2hpbmd8aGlkZXxtaW5pYXR1cml6ZXxtb3ZlfG9wZW58cXVpdHwocmVzaWduICk/YWN0aXZlfCgobWF4aW11bXxtaW5pbXVtfHByb3Bvc2VkKSApP3NpemV8c2hvd3x6b29tKXxidW5kbGV8ZGF0YSBzb3VyY2V8bW92aWV8cGFzdGVib2FyZHxzb3VuZHx0b29sKGJhcnwgdGlwKXwoY29sb3J8b3BlbnxzYXZlKSBwYW5lbHxjb29yZGluYXRlIHN5c3RlbXxmcm9udG1vc3R8bWFpbiggKGJ1bmRsZXxtZW51fHdpbmRvdykpP3woKHNlcnZpY2VzfChleGNsdWRlZCBmcm9tICk/d2luZG93cykgKT9tZW51fCgoZXhlY3V0YWJsZXxmcmFtZXdvcmtzfHJlc291cmNlfHNjcmlwdHN8c2hhcmVkIChmcmFtZXdvcmtzfHN1cHBvcnQpKSApP3BhdGh8KHNlbGVjdGVkIGl0ZW0gKT9pZGVudGlmaWVyfGRhdGF8Y29udGVudChzfCB2aWV3KT98Y2hhcmFjdGVyKHMpP3xjbGljayBjb3VudHwoY29tbWFuZHxjb250cm9sfG9wdGlvbnxzaGlmdCkga2V5IGRvd258Y29udGV4dHxkZWx0YSAoeHx5fHopfGtleSggY29kZSk/fGxvY2F0aW9ufHByZXNzdXJlfHVubW9kaWZpZWQgY2hhcmFjdGVyc3x0eXBlc3woZmlyc3QgKT9yZXNwb25kZXJ8cGxheWluZ3woYWxsb3dlZHxzZWxlY3RhYmxlKSBpZGVudGlmaWVyc3xhbGxvd3MgY3VzdG9taXphdGlvbnwoYXV0byBzYXZlcyApP2NvbmZpZ3VyYXRpb258dmlzaWJsZXxpbWFnZSggbmFtZSk/fG1lbnUgZm9ybSByZXByZXNlbnRhdGlvbnx0YWd8dXNlcigtfCApZGVmYXVsdHN8YXNzb2NpYXRlZCBmaWxlIG5hbWV8KGF1dG98bmVlZHMpIGRpc3BsYXl8Y3VycmVudCBmaWVsZCBlZGl0b3J8ZmxvYXRpbmd8aGFzIChyZXNpemUgaW5kaWNhdG9yfHNoYWRvdyl8aGlkZXMgd2hlbiBkZWFjdGl2YXRlZHxsZXZlbHxtaW5pbWl6ZWQgKGltYWdlfHRpdGxlKXxvcGFxdWV8cG9zaXRpb258cmVsZWFzZSB3aGVuIGNsb3NlZHxzaGVldHx0aXRsZShkKT8pXFxiL2csXG4gICAgICAgICAgICAgICAgY3NzOiAnY29sb3IzJyB9LFxuXG4gICAgICAgICAgICB7IHJlZ2V4OiBuZXcgUmVnRXhwKHRoaXMuZ2V0S2V5d29yZHMoc3BlY2lhbHMpLCAnZ20nKSwgY3NzOiAnY29sb3IzJyB9LFxuICAgICAgICAgICAgeyByZWdleDogbmV3IFJlZ0V4cCh0aGlzLmdldEtleXdvcmRzKGtleXdvcmRzKSwgJ2dtJyksIGNzczogJ2tleXdvcmQnIH0sXG4gICAgICAgICAgICB7IHJlZ2V4OiBuZXcgUmVnRXhwKHRoaXMuZ2V0S2V5d29yZHMob3JkaW5hbHMpLCAnZ20nKSwgY3NzOiAna2V5d29yZCcgfVxuICAgICAgICBdO1xuICAgIH07XG5cbiAgICBCcnVzaC5wcm90b3R5cGUgPSBuZXcgU3ludGF4SGlnaGxpZ2h0ZXIuSGlnaGxpZ2h0ZXIoKTtcbiAgICBCcnVzaC5hbGlhc2VzID0gWydhcHBsZXNjcmlwdCddO1xuXG4gICAgU3ludGF4SGlnaGxpZ2h0ZXIuYnJ1c2hlcy5BcHBsZVNjcmlwdCA9IEJydXNoO1xuXG4gICAgLy8gQ29tbW9uSlNcbiAgICB0eXBlb2YoZXhwb3J0cykgIT0gJ3VuZGVmaW5lZCcgPyBleHBvcnRzLkJydXNoID0gQnJ1c2ggOiBudWxsO1xufSkoKTtcbjsoZnVuY3Rpb24oKVxue1xuXHQvLyBDb21tb25KU1xuXHRTeW50YXhIaWdobGlnaHRlciA9IFN5bnRheEhpZ2hsaWdodGVyIHx8ICh0eXBlb2YgcmVxdWlyZSAhPT0gJ3VuZGVmaW5lZCc/IHJlcXVpcmUoJ3NoQ29yZScpLlN5bnRheEhpZ2hsaWdodGVyIDogbnVsbCk7XG5cblx0ZnVuY3Rpb24gQnJ1c2goKVxuXHR7XG5cdFx0dmFyIGtleXdvcmRzID1cdCdpZiBmaSB0aGVuIGVsaWYgZWxzZSBmb3IgZG8gZG9uZSB1bnRpbCB3aGlsZSBicmVhayBjb250aW51ZSBjYXNlIGVzYWMgZnVuY3Rpb24gcmV0dXJuIGluIGVxIG5lIGdlIGxlJztcblx0XHR2YXIgY29tbWFuZHMgPSAgJ2FsaWFzIGFwcm9wb3MgYXdrIGJhc2VuYW1lIGJhc2ggYmMgYmcgYnVpbHRpbiBiemlwMiBjYWwgY2F0IGNkIGNmZGlzayBjaGdycCBjaG1vZCBjaG93biBjaHJvb3QnICtcblx0XHRcdFx0XHRcdCdja3N1bSBjbGVhciBjbXAgY29tbSBjb21tYW5kIGNwIGNyb24gY3JvbnRhYiBjc3BsaXQgY3V0IGRhdGUgZGMgZGQgZGRyZXNjdWUgZGVjbGFyZSBkZiAnICtcblx0XHRcdFx0XHRcdCdkaWZmIGRpZmYzIGRpZyBkaXIgZGlyY29sb3JzIGRpcm5hbWUgZGlycyBkdSBlY2hvIGVncmVwIGVqZWN0IGVuYWJsZSBlbnYgZXRodG9vbCBldmFsICcgK1xuXHRcdFx0XHRcdFx0J2V4ZWMgZXhpdCBleHBhbmQgZXhwb3J0IGV4cHIgZmFsc2UgZmRmb3JtYXQgZmRpc2sgZmcgZmdyZXAgZmlsZSBmaW5kIGZtdCBmb2xkIGZvcm1hdCAnICtcblx0XHRcdFx0XHRcdCdmcmVlIGZzY2sgZnRwIGdhd2sgZ2V0b3B0cyBncmVwIGdyb3VwcyBnemlwIGhhc2ggaGVhZCBoaXN0b3J5IGhvc3RuYW1lIGlkIGlmY29uZmlnICcgK1xuXHRcdFx0XHRcdFx0J2ltcG9ydCBpbnN0YWxsIGpvaW4ga2lsbCBsZXNzIGxldCBsbiBsb2NhbCBsb2NhdGUgbG9nbmFtZSBsb2dvdXQgbG9vayBscGMgbHByIGxwcmludCAnICtcblx0XHRcdFx0XHRcdCdscHJpbnRkIGxwcmludHEgbHBybSBscyBsc29mIG1ha2UgbWFuIG1rZGlyIG1rZmlmbyBta2lzb2ZzIG1rbm9kIG1vcmUgbW91bnQgbXRvb2xzICcgK1xuXHRcdFx0XHRcdFx0J212IG5ldHN0YXQgbmljZSBubCBub2h1cCBuc2xvb2t1cCBvcGVuIG9wIHBhc3N3ZCBwYXN0ZSBwYXRoY2hrIHBpbmcgcG9wZCBwciBwcmludGNhcCAnICtcblx0XHRcdFx0XHRcdCdwcmludGVudiBwcmludGYgcHMgcHVzaGQgcHdkIHF1b3RhIHF1b3RhY2hlY2sgcXVvdGFjdGwgcmFtIHJjcCByZWFkIHJlYWRvbmx5IHJlbmljZSAnICtcblx0XHRcdFx0XHRcdCdyZW1zeW5jIHJtIHJtZGlyIHJzeW5jIHNjcmVlbiBzY3Agc2RpZmYgc2VkIHNlbGVjdCBzZXEgc2V0IHNmdHAgc2hpZnQgc2hvcHQgc2h1dGRvd24gJyArXG5cdFx0XHRcdFx0XHQnc2xlZXAgc29ydCBzb3VyY2Ugc3BsaXQgc3NoIHN0cmFjZSBzdSBzdWRvIHN1bSBzeW1saW5rIHN5bmMgdGFpbCB0YXIgdGVlIHRlc3QgdGltZSAnICtcblx0XHRcdFx0XHRcdCd0aW1lcyB0b3VjaCB0b3AgdHJhY2Vyb3V0ZSB0cmFwIHRyIHRydWUgdHNvcnQgdHR5IHR5cGUgdWxpbWl0IHVtYXNrIHVtb3VudCB1bmFsaWFzICcgK1xuXHRcdFx0XHRcdFx0J3VuYW1lIHVuZXhwYW5kIHVuaXEgdW5pdHMgdW5zZXQgdW5zaGFyIHVzZXJhZGQgdXNlcm1vZCB1c2VycyB1dWVuY29kZSB1dWRlY29kZSB2IHZkaXIgJyArXG5cdFx0XHRcdFx0XHQndmkgd2F0Y2ggd2Mgd2hlcmVpcyB3aGljaCB3aG8gd2hvYW1pIFdnZXQgeGFyZ3MgeWVzJ1xuXHRcdFx0XHRcdFx0O1xuXG5cdFx0dGhpcy5yZWdleExpc3QgPSBbXG5cdFx0XHR7IHJlZ2V4OiAvXiMhLiokL2dtLFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjc3M6ICdwcmVwcm9jZXNzb3IgYm9sZCcgfSxcblx0XHRcdHsgcmVnZXg6IC9cXC9bXFx3LVxcL10rL2dtLFx0XHRcdFx0XHRcdFx0XHRcdFx0Y3NzOiAncGxhaW4nIH0sXG5cdFx0XHR7IHJlZ2V4OiBTeW50YXhIaWdobGlnaHRlci5yZWdleExpYi5zaW5nbGVMaW5lUGVybENvbW1lbnRzLFx0XHRjc3M6ICdjb21tZW50cycgfSxcdFx0Ly8gb25lIGxpbmUgY29tbWVudHNcblx0XHRcdHsgcmVnZXg6IFN5bnRheEhpZ2hsaWdodGVyLnJlZ2V4TGliLmRvdWJsZVF1b3RlZFN0cmluZyxcdFx0XHRjc3M6ICdzdHJpbmcnIH0sXHRcdC8vIGRvdWJsZSBxdW90ZWQgc3RyaW5nc1xuXHRcdFx0eyByZWdleDogU3ludGF4SGlnaGxpZ2h0ZXIucmVnZXhMaWIuc2luZ2xlUXVvdGVkU3RyaW5nLFx0XHRcdGNzczogJ3N0cmluZycgfSxcdFx0Ly8gc2luZ2xlIHF1b3RlZCBzdHJpbmdzXG5cdFx0XHR7IHJlZ2V4OiBuZXcgUmVnRXhwKHRoaXMuZ2V0S2V5d29yZHMoa2V5d29yZHMpLCAnZ20nKSxcdFx0XHRjc3M6ICdrZXl3b3JkJyB9LFx0XHQvLyBrZXl3b3Jkc1xuXHRcdFx0eyByZWdleDogbmV3IFJlZ0V4cCh0aGlzLmdldEtleXdvcmRzKGNvbW1hbmRzKSwgJ2dtJyksXHRcdFx0Y3NzOiAnZnVuY3Rpb25zJyB9XHRcdC8vIGNvbW1hbmRzXG5cdFx0XHRdO1xuXHR9XG5cblx0QnJ1c2gucHJvdG90eXBlXHQ9IG5ldyBTeW50YXhIaWdobGlnaHRlci5IaWdobGlnaHRlcigpO1xuXHRCcnVzaC5hbGlhc2VzXHQ9IFsnYmFzaCcsICdzaGVsbCcsICdzaCddO1xuXG5cdFN5bnRheEhpZ2hsaWdodGVyLmJydXNoZXMuQmFzaCA9IEJydXNoO1xuXG5cdC8vIENvbW1vbkpTXG5cdHR5cGVvZihleHBvcnRzKSAhPSAndW5kZWZpbmVkJyA/IGV4cG9ydHMuQnJ1c2ggPSBCcnVzaCA6IG51bGw7XG59KSgpO1xuOyhmdW5jdGlvbigpXG57XG5cdC8vIENvbW1vbkpTXG5cdFN5bnRheEhpZ2hsaWdodGVyID0gU3ludGF4SGlnaGxpZ2h0ZXIgfHwgKHR5cGVvZiByZXF1aXJlICE9PSAndW5kZWZpbmVkJz8gcmVxdWlyZSgnc2hDb3JlJykuU3ludGF4SGlnaGxpZ2h0ZXIgOiBudWxsKTtcblxuXHRmdW5jdGlvbiBCcnVzaCgpXG5cdHtcblx0XHQvLyBDb250cmlidXRlZCBieSBKZW5cblx0XHQvLyBodHRwOi8vd3d3LmplbnNiaXRzLmNvbS8yMDA5LzA1LzE0L2NvbGRmdXNpb24tYnJ1c2gtZm9yLXN5bnRheGhpZ2hsaWdodGVyLXBsdXNcblx0XG5cdFx0dmFyIGZ1bmNzXHQ9XHQnQWJzIEFDb3MgQWRkU09BUFJlcXVlc3RIZWFkZXIgQWRkU09BUFJlc3BvbnNlSGVhZGVyIEFqYXhMaW5rIEFqYXhPbkxvYWQgQXJyYXlBcHBlbmQgQXJyYXlBdmcgQXJyYXlDbGVhciBBcnJheURlbGV0ZUF0ICcgKyBcblx0XHRcdFx0XHRcdCdBcnJheUluc2VydEF0IEFycmF5SXNEZWZpbmVkIEFycmF5SXNFbXB0eSBBcnJheUxlbiBBcnJheU1heCBBcnJheU1pbiBBcnJheVNldCBBcnJheVNvcnQgQXJyYXlTdW0gQXJyYXlTd2FwIEFycmF5VG9MaXN0ICcgKyBcblx0XHRcdFx0XHRcdCdBc2MgQVNpbiBBdG4gQmluYXJ5RGVjb2RlIEJpbmFyeUVuY29kZSBCaXRBbmQgQml0TWFza0NsZWFyIEJpdE1hc2tSZWFkIEJpdE1hc2tTZXQgQml0Tm90IEJpdE9yIEJpdFNITE4gQml0U0hSTiBCaXRYb3IgJyArIFxuXHRcdFx0XHRcdFx0J0NlaWxpbmcgQ2hhcnNldERlY29kZSBDaGFyc2V0RW5jb2RlIENociBDSnVzdGlmeSBDb21wYXJlIENvbXBhcmVOb0Nhc2UgQ29zIENyZWF0ZURhdGUgQ3JlYXRlRGF0ZVRpbWUgQ3JlYXRlT2JqZWN0ICcgKyBcblx0XHRcdFx0XHRcdCdDcmVhdGVPREJDRGF0ZSBDcmVhdGVPREJDRGF0ZVRpbWUgQ3JlYXRlT0RCQ1RpbWUgQ3JlYXRlVGltZSBDcmVhdGVUaW1lU3BhbiBDcmVhdGVVVUlEIERhdGVBZGQgRGF0ZUNvbXBhcmUgRGF0ZUNvbnZlcnQgJyArIFxuXHRcdFx0XHRcdFx0J0RhdGVEaWZmIERhdGVGb3JtYXQgRGF0ZVBhcnQgRGF5IERheU9mV2VlayBEYXlPZldlZWtBc1N0cmluZyBEYXlPZlllYXIgRGF5c0luTW9udGggRGF5c0luWWVhciBERSBEZWNpbWFsRm9ybWF0IERlY3JlbWVudFZhbHVlICcgKyBcblx0XHRcdFx0XHRcdCdEZWNyeXB0IERlY3J5cHRCaW5hcnkgRGVsZXRlQ2xpZW50VmFyaWFibGUgRGVzZXJpYWxpemVKU09OIERpcmVjdG9yeUV4aXN0cyBEb2xsYXJGb3JtYXQgRG90TmV0VG9DRlR5cGUgRHVwbGljYXRlIEVuY3J5cHQgJyArIFxuXHRcdFx0XHRcdFx0J0VuY3J5cHRCaW5hcnkgRXZhbHVhdGUgRXhwIEV4cGFuZFBhdGggRmlsZUNsb3NlIEZpbGVDb3B5IEZpbGVEZWxldGUgRmlsZUV4aXN0cyBGaWxlSXNFT0YgRmlsZU1vdmUgRmlsZU9wZW4gRmlsZVJlYWQgJyArIFxuXHRcdFx0XHRcdFx0J0ZpbGVSZWFkQmluYXJ5IEZpbGVSZWFkTGluZSBGaWxlU2V0QWNjZXNzTW9kZSBGaWxlU2V0QXR0cmlidXRlIEZpbGVTZXRMYXN0TW9kaWZpZWQgRmlsZVdyaXRlIEZpbmQgRmluZE5vQ2FzZSBGaW5kT25lT2YgJyArIFxuXHRcdFx0XHRcdFx0J0ZpcnN0RGF5T2ZNb250aCBGaXggRm9ybWF0QmFzZU4gR2VuZXJhdGVTZWNyZXRLZXkgR2V0QXV0aFVzZXIgR2V0QmFzZVRhZ0RhdGEgR2V0QmFzZVRhZ0xpc3QgR2V0QmFzZVRlbXBsYXRlUGF0aCAnICsgXG5cdFx0XHRcdFx0XHQnR2V0Q2xpZW50VmFyaWFibGVzTGlzdCBHZXRDb21wb25lbnRNZXRhRGF0YSBHZXRDb250ZXh0Um9vdCBHZXRDdXJyZW50VGVtcGxhdGVQYXRoIEdldERpcmVjdG9yeUZyb21QYXRoIEdldEVuY29kaW5nICcgKyBcblx0XHRcdFx0XHRcdCdHZXRFeGNlcHRpb24gR2V0RmlsZUZyb21QYXRoIEdldEZpbGVJbmZvIEdldEZ1bmN0aW9uTGlzdCBHZXRHYXRld2F5SGVscGVyIEdldEh0dHBSZXF1ZXN0RGF0YSBHZXRIdHRwVGltZVN0cmluZyAnICsgXG5cdFx0XHRcdFx0XHQnR2V0SzJTZXJ2ZXJEb2NDb3VudCBHZXRLMlNlcnZlckRvY0NvdW50TGltaXQgR2V0TG9jYWxlIEdldExvY2FsZURpc3BsYXlOYW1lIEdldExvY2FsSG9zdElQIEdldE1ldGFEYXRhIEdldE1ldHJpY0RhdGEgJyArIFxuXHRcdFx0XHRcdFx0J0dldFBhZ2VDb250ZXh0IEdldFByaW50ZXJJbmZvIEdldFByb2ZpbGVTZWN0aW9ucyBHZXRQcm9maWxlU3RyaW5nIEdldFJlYWRhYmxlSW1hZ2VGb3JtYXRzIEdldFNPQVBSZXF1ZXN0IEdldFNPQVBSZXF1ZXN0SGVhZGVyICcgKyBcblx0XHRcdFx0XHRcdCdHZXRTT0FQUmVzcG9uc2UgR2V0U09BUFJlc3BvbnNlSGVhZGVyIEdldFRlbXBEaXJlY3RvcnkgR2V0VGVtcEZpbGUgR2V0VGVtcGxhdGVQYXRoIEdldFRpY2tDb3VudCBHZXRUaW1lWm9uZUluZm8gR2V0VG9rZW4gJyArIFxuXHRcdFx0XHRcdFx0J0dldFVzZXJSb2xlcyBHZXRXcml0ZWFibGVJbWFnZUZvcm1hdHMgSGFzaCBIb3VyIEhUTUxDb2RlRm9ybWF0IEhUTUxFZGl0Rm9ybWF0IElJZiBJbWFnZUFkZEJvcmRlciBJbWFnZUJsdXIgSW1hZ2VDbGVhclJlY3QgJyArIFxuXHRcdFx0XHRcdFx0J0ltYWdlQ29weSBJbWFnZUNyb3AgSW1hZ2VEcmF3QXJjIEltYWdlRHJhd0JldmVsZWRSZWN0IEltYWdlRHJhd0N1YmljQ3VydmUgSW1hZ2VEcmF3TGluZSBJbWFnZURyYXdMaW5lcyBJbWFnZURyYXdPdmFsICcgKyBcblx0XHRcdFx0XHRcdCdJbWFnZURyYXdQb2ludCBJbWFnZURyYXdRdWFkcmF0aWNDdXJ2ZSBJbWFnZURyYXdSZWN0IEltYWdlRHJhd1JvdW5kUmVjdCBJbWFnZURyYXdUZXh0IEltYWdlRmxpcCBJbWFnZUdldEJsb2IgSW1hZ2VHZXRCdWZmZXJlZEltYWdlICcgKyBcblx0XHRcdFx0XHRcdCdJbWFnZUdldEVYSUZUYWcgSW1hZ2VHZXRIZWlnaHQgSW1hZ2VHZXRJUFRDVGFnIEltYWdlR2V0V2lkdGggSW1hZ2VHcmF5c2NhbGUgSW1hZ2VJbmZvIEltYWdlTmVnYXRpdmUgSW1hZ2VOZXcgSW1hZ2VPdmVybGF5IEltYWdlUGFzdGUgJyArIFxuXHRcdFx0XHRcdFx0J0ltYWdlUmVhZCBJbWFnZVJlYWRCYXNlNjQgSW1hZ2VSZXNpemUgSW1hZ2VSb3RhdGUgSW1hZ2VSb3RhdGVEcmF3aW5nQXhpcyBJbWFnZVNjYWxlVG9GaXQgSW1hZ2VTZXRBbnRpYWxpYXNpbmcgSW1hZ2VTZXRCYWNrZ3JvdW5kQ29sb3IgJyArIFxuXHRcdFx0XHRcdFx0J0ltYWdlU2V0RHJhd2luZ0NvbG9yIEltYWdlU2V0RHJhd2luZ1N0cm9rZSBJbWFnZVNldERyYXdpbmdUcmFuc3BhcmVuY3kgSW1hZ2VTaGFycGVuIEltYWdlU2hlYXIgSW1hZ2VTaGVhckRyYXdpbmdBeGlzIEltYWdlVHJhbnNsYXRlICcgKyBcblx0XHRcdFx0XHRcdCdJbWFnZVRyYW5zbGF0ZURyYXdpbmdBeGlzIEltYWdlV3JpdGUgSW1hZ2VXcml0ZUJhc2U2NCBJbWFnZVhPUkRyYXdpbmdNb2RlIEluY3JlbWVudFZhbHVlIElucHV0QmFzZU4gSW5zZXJ0IEludCBJc0FycmF5IElzQmluYXJ5ICcgKyBcblx0XHRcdFx0XHRcdCdJc0Jvb2xlYW4gSXNDdXN0b21GdW5jdGlvbiBJc0RhdGUgSXNERFggSXNEZWJ1Z01vZGUgSXNEZWZpbmVkIElzSW1hZ2UgSXNJbWFnZUZpbGUgSXNJbnN0YW5jZU9mIElzSlNPTiBJc0xlYXBZZWFyIElzTG9jYWxIb3N0ICcgKyBcblx0XHRcdFx0XHRcdCdJc051bWVyaWMgSXNOdW1lcmljRGF0ZSBJc09iamVjdCBJc1BERkZpbGUgSXNQREZPYmplY3QgSXNRdWVyeSBJc1NpbXBsZVZhbHVlIElzU09BUFJlcXVlc3QgSXNTdHJ1Y3QgSXNVc2VySW5BbnlSb2xlIElzVXNlckluUm9sZSAnICsgXG5cdFx0XHRcdFx0XHQnSXNVc2VyTG9nZ2VkSW4gSXNWYWxpZCBJc1dERFggSXNYTUwgSXNYbWxBdHRyaWJ1dGUgSXNYbWxEb2MgSXNYbWxFbGVtIElzWG1sTm9kZSBJc1htbFJvb3QgSmF2YUNhc3QgSlNTdHJpbmdGb3JtYXQgTENhc2UgTGVmdCBMZW4gJyArIFxuXHRcdFx0XHRcdFx0J0xpc3RBcHBlbmQgTGlzdENoYW5nZURlbGltcyBMaXN0Q29udGFpbnMgTGlzdENvbnRhaW5zTm9DYXNlIExpc3REZWxldGVBdCBMaXN0RmluZCBMaXN0RmluZE5vQ2FzZSBMaXN0Rmlyc3QgTGlzdEdldEF0IExpc3RJbnNlcnRBdCAnICsgXG5cdFx0XHRcdFx0XHQnTGlzdExhc3QgTGlzdExlbiBMaXN0UHJlcGVuZCBMaXN0UXVhbGlmeSBMaXN0UmVzdCBMaXN0U2V0QXQgTGlzdFNvcnQgTGlzdFRvQXJyYXkgTGlzdFZhbHVlQ291bnQgTGlzdFZhbHVlQ291bnROb0Nhc2UgTEp1c3RpZnkgTG9nICcgKyBcblx0XHRcdFx0XHRcdCdMb2cxMCBMU0N1cnJlbmN5Rm9ybWF0IExTRGF0ZUZvcm1hdCBMU0V1cm9DdXJyZW5jeUZvcm1hdCBMU0lzQ3VycmVuY3kgTFNJc0RhdGUgTFNJc051bWVyaWMgTFNOdW1iZXJGb3JtYXQgTFNQYXJzZUN1cnJlbmN5IExTUGFyc2VEYXRlVGltZSAnICsgXG5cdFx0XHRcdFx0XHQnTFNQYXJzZUV1cm9DdXJyZW5jeSBMU1BhcnNlTnVtYmVyIExTVGltZUZvcm1hdCBMVHJpbSBNYXggTWlkIE1pbiBNaW51dGUgTW9udGggTW9udGhBc1N0cmluZyBOb3cgTnVtYmVyRm9ybWF0IFBhcmFncmFwaEZvcm1hdCBQYXJzZURhdGVUaW1lICcgKyBcblx0XHRcdFx0XHRcdCdQaSBQcmVjaXNpb25FdmFsdWF0ZSBQcmVzZXJ2ZVNpbmdsZVF1b3RlcyBRdWFydGVyIFF1ZXJ5QWRkQ29sdW1uIFF1ZXJ5QWRkUm93IFF1ZXJ5Q29udmVydEZvckdyaWQgUXVlcnlOZXcgUXVlcnlTZXRDZWxsIFF1b3RlZFZhbHVlTGlzdCBSYW5kICcgKyBcblx0XHRcdFx0XHRcdCdSYW5kb21pemUgUmFuZFJhbmdlIFJFRmluZCBSRUZpbmROb0Nhc2UgUmVsZWFzZUNvbU9iamVjdCBSRU1hdGNoIFJFTWF0Y2hOb0Nhc2UgUmVtb3ZlQ2hhcnMgUmVwZWF0U3RyaW5nIFJlcGxhY2UgUmVwbGFjZUxpc3QgUmVwbGFjZU5vQ2FzZSAnICsgXG5cdFx0XHRcdFx0XHQnUkVSZXBsYWNlIFJFUmVwbGFjZU5vQ2FzZSBSZXZlcnNlIFJpZ2h0IFJKdXN0aWZ5IFJvdW5kIFJUcmltIFNlY29uZCBTZW5kR2F0ZXdheU1lc3NhZ2UgU2VyaWFsaXplSlNPTiBTZXRFbmNvZGluZyBTZXRMb2NhbGUgU2V0UHJvZmlsZVN0cmluZyAnICsgXG5cdFx0XHRcdFx0XHQnU2V0VmFyaWFibGUgU2duIFNpbiBTbGVlcCBTcGFuRXhjbHVkaW5nIFNwYW5JbmNsdWRpbmcgU3FyIFN0cmlwQ1IgU3RydWN0QXBwZW5kIFN0cnVjdENsZWFyIFN0cnVjdENvcHkgU3RydWN0Q291bnQgU3RydWN0RGVsZXRlIFN0cnVjdEZpbmQgJyArIFxuXHRcdFx0XHRcdFx0J1N0cnVjdEZpbmRLZXkgU3RydWN0RmluZFZhbHVlIFN0cnVjdEdldCBTdHJ1Y3RJbnNlcnQgU3RydWN0SXNFbXB0eSBTdHJ1Y3RLZXlBcnJheSBTdHJ1Y3RLZXlFeGlzdHMgU3RydWN0S2V5TGlzdCBTdHJ1Y3RLZXlMaXN0IFN0cnVjdE5ldyAnICsgXG5cdFx0XHRcdFx0XHQnU3RydWN0U29ydCBTdHJ1Y3RVcGRhdGUgVGFuIFRpbWVGb3JtYXQgVG9CYXNlNjQgVG9CaW5hcnkgVG9TY3JpcHQgVG9TdHJpbmcgVHJpbSBVQ2FzZSBVUkxEZWNvZGUgVVJMRW5jb2RlZEZvcm1hdCBVUkxTZXNzaW9uRm9ybWF0IFZhbCAnICsgXG5cdFx0XHRcdFx0XHQnVmFsdWVMaXN0IFZlcmlmeUNsaWVudCBXZWVrIFdyYXAgV3JhcCBXcml0ZU91dHB1dCBYbWxDaGlsZFBvcyBYbWxFbGVtTmV3IFhtbEZvcm1hdCBYbWxHZXROb2RlVHlwZSBYbWxOZXcgWG1sUGFyc2UgWG1sU2VhcmNoIFhtbFRyYW5zZm9ybSAnICsgXG5cdFx0XHRcdFx0XHQnWG1sVmFsaWRhdGUgWWVhciBZZXNOb0Zvcm1hdCc7XG5cblx0XHR2YXIga2V5d29yZHMgPVx0J2NmYWJvcnQgY2ZhamF4aW1wb3J0IGNmYWpheHByb3h5IGNmYXBwbGV0IGNmYXBwbGljYXRpb24gY2Zhcmd1bWVudCBjZmFzc29jaWF0ZSBjZmJyZWFrIGNmY2FjaGUgY2ZjYWxlbmRhciAnICsgXG5cdFx0XHRcdFx0XHQnY2ZjYXNlIGNmY2F0Y2ggY2ZjaGFydCBjZmNoYXJ0ZGF0YSBjZmNoYXJ0c2VyaWVzIGNmY29sIGNmY29sbGVjdGlvbiBjZmNvbXBvbmVudCBjZmNvbnRlbnQgY2Zjb29raWUgY2ZkYmluZm8gJyArIFxuXHRcdFx0XHRcdFx0J2NmZGVmYXVsdGNhc2UgY2ZkaXJlY3RvcnkgY2ZkaXYgY2Zkb2N1bWVudCBjZmRvY3VtZW50aXRlbSBjZmRvY3VtZW50c2VjdGlvbiBjZmR1bXAgY2ZlbHNlIGNmZWxzZWlmIGNmZXJyb3IgJyArIFxuXHRcdFx0XHRcdFx0J2NmZXhjaGFuZ2VjYWxlbmRhciBjZmV4Y2hhbmdlY29ubmVjdGlvbiBjZmV4Y2hhbmdlY29udGFjdCBjZmV4Y2hhbmdlZmlsdGVyIGNmZXhjaGFuZ2VtYWlsIGNmZXhjaGFuZ2V0YXNrICcgKyBcblx0XHRcdFx0XHRcdCdjZmV4ZWN1dGUgY2ZleGl0IGNmZmVlZCBjZmZpbGUgY2ZmbHVzaCBjZmZvcm0gY2Zmb3JtZ3JvdXAgY2Zmb3JtaXRlbSBjZmZ0cCBjZmZ1bmN0aW9uIGNmZ3JpZCBjZmdyaWRjb2x1bW4gJyArIFxuXHRcdFx0XHRcdFx0J2NmZ3JpZHJvdyBjZmdyaWR1cGRhdGUgY2ZoZWFkZXIgY2ZodG1saGVhZCBjZmh0dHAgY2ZodHRwcGFyYW0gY2ZpZiBjZmltYWdlIGNmaW1wb3J0IGNmaW5jbHVkZSBjZmluZGV4ICcgKyBcblx0XHRcdFx0XHRcdCdjZmlucHV0IGNmaW5zZXJ0IGNmaW50ZXJmYWNlIGNmaW52b2tlIGNmaW52b2tlYXJndW1lbnQgY2ZsYXlvdXQgY2ZsYXlvdXRhcmVhIGNmbGRhcCBjZmxvY2F0aW9uIGNmbG9jayBjZmxvZyAnICsgXG5cdFx0XHRcdFx0XHQnY2Zsb2dpbiBjZmxvZ2ludXNlciBjZmxvZ291dCBjZmxvb3AgY2ZtYWlsIGNmbWFpbHBhcmFtIGNmbWFpbHBhcnQgY2ZtZW51IGNmbWVudWl0ZW0gY2Ztb2R1bGUgY2ZOVGF1dGhlbnRpY2F0ZSAnICsgXG5cdFx0XHRcdFx0XHQnY2ZvYmplY3QgY2ZvYmplY3RjYWNoZSBjZm91dHB1dCBjZnBhcmFtIGNmcGRmIGNmcGRmZm9ybSBjZnBkZmZvcm1wYXJhbSBjZnBkZnBhcmFtIGNmcGRmc3ViZm9ybSBjZnBvZCBjZnBvcCAnICsgXG5cdFx0XHRcdFx0XHQnY2ZwcmVzZW50YXRpb24gY2ZwcmVzZW50YXRpb25zbGlkZSBjZnByZXNlbnRlciBjZnByaW50IGNmcHJvY2Vzc2luZ2RpcmVjdGl2ZSBjZnByb2NwYXJhbSBjZnByb2NyZXN1bHQgJyArIFxuXHRcdFx0XHRcdFx0J2NmcHJvcGVydHkgY2ZxdWVyeSBjZnF1ZXJ5cGFyYW0gY2ZyZWdpc3RyeSBjZnJlcG9ydCBjZnJlcG9ydHBhcmFtIGNmcmV0aHJvdyBjZnJldHVybiBjZnNhdmVjb250ZW50IGNmc2NoZWR1bGUgJyArIFxuXHRcdFx0XHRcdFx0J2Nmc2NyaXB0IGNmc2VhcmNoIGNmc2VsZWN0IGNmc2V0IGNmc2V0dGluZyBjZnNpbGVudCBjZnNsaWRlciBjZnNwcnlkYXRhc2V0IGNmc3RvcmVkcHJvYyBjZnN3aXRjaCBjZnRhYmxlICcgKyBcblx0XHRcdFx0XHRcdCdjZnRleHRhcmVhIGNmdGhyZWFkIGNmdGhyb3cgY2Z0aW1lciBjZnRvb2x0aXAgY2Z0cmFjZSBjZnRyYW5zYWN0aW9uIGNmdHJlZSBjZnRyZWVpdGVtIGNmdHJ5IGNmdXBkYXRlIGNmd2RkeCAnICsgXG5cdFx0XHRcdFx0XHQnY2Z3aW5kb3cgY2Z4bWwgY2Z6aXAgY2Z6aXBwYXJhbSc7XG5cblx0XHR2YXIgb3BlcmF0b3JzID1cdCdhbGwgYW5kIGFueSBiZXR3ZWVuIGNyb3NzIGluIGpvaW4gbGlrZSBub3QgbnVsbCBvciBvdXRlciBzb21lJztcblxuXHRcdHRoaXMucmVnZXhMaXN0ID0gW1xuXHRcdFx0eyByZWdleDogbmV3IFJlZ0V4cCgnLS0oLiopJCcsICdnbScpLFx0XHRcdFx0XHRcdGNzczogJ2NvbW1lbnRzJyB9LCAgLy8gb25lIGxpbmUgYW5kIG11bHRpbGluZSBjb21tZW50c1xuXHRcdFx0eyByZWdleDogU3ludGF4SGlnaGxpZ2h0ZXIucmVnZXhMaWIueG1sQ29tbWVudHMsXHRcdFx0Y3NzOiAnY29tbWVudHMnIH0sICAgIC8vIHNpbmdsZSBxdW90ZWQgc3RyaW5nc1xuXHRcdFx0eyByZWdleDogU3ludGF4SGlnaGxpZ2h0ZXIucmVnZXhMaWIuZG91YmxlUXVvdGVkU3RyaW5nLFx0XHRjc3M6ICdzdHJpbmcnIH0sICAgIC8vIGRvdWJsZSBxdW90ZWQgc3RyaW5nc1xuXHRcdFx0eyByZWdleDogU3ludGF4SGlnaGxpZ2h0ZXIucmVnZXhMaWIuc2luZ2xlUXVvdGVkU3RyaW5nLFx0XHRjc3M6ICdzdHJpbmcnIH0sICAgIC8vIHNpbmdsZSBxdW90ZWQgc3RyaW5nc1xuXHRcdFx0eyByZWdleDogbmV3IFJlZ0V4cCh0aGlzLmdldEtleXdvcmRzKGZ1bmNzKSwgJ2dtaScpLFx0XHRjc3M6ICdmdW5jdGlvbnMnIH0sIC8vIGZ1bmN0aW9uc1xuXHRcdFx0eyByZWdleDogbmV3IFJlZ0V4cCh0aGlzLmdldEtleXdvcmRzKG9wZXJhdG9ycyksICdnbWknKSxcdGNzczogJ2NvbG9yMScgfSwgICAgLy8gb3BlcmF0b3JzIGFuZCBzdWNoXG5cdFx0XHR7IHJlZ2V4OiBuZXcgUmVnRXhwKHRoaXMuZ2V0S2V5d29yZHMoa2V5d29yZHMpLCAnZ21pJyksXHRcdGNzczogJ2tleXdvcmQnIH0gICAgLy8ga2V5d29yZFxuXHRcdFx0XTtcblx0fVxuXG5cdEJydXNoLnByb3RvdHlwZVx0PSBuZXcgU3ludGF4SGlnaGxpZ2h0ZXIuSGlnaGxpZ2h0ZXIoKTtcblx0QnJ1c2guYWxpYXNlc1x0PSBbJ2NvbGRmdXNpb24nLCdjZiddO1xuXHRcblx0U3ludGF4SGlnaGxpZ2h0ZXIuYnJ1c2hlcy5Db2xkRnVzaW9uID0gQnJ1c2g7XG5cblx0Ly8gQ29tbW9uSlNcblx0dHlwZW9mKGV4cG9ydHMpICE9ICd1bmRlZmluZWQnID8gZXhwb3J0cy5CcnVzaCA9IEJydXNoIDogbnVsbDtcbn0pKCk7XG47KGZ1bmN0aW9uKClcbntcblx0Ly8gQ29tbW9uSlNcblx0U3ludGF4SGlnaGxpZ2h0ZXIgPSBTeW50YXhIaWdobGlnaHRlciB8fCAodHlwZW9mIHJlcXVpcmUgIT09ICd1bmRlZmluZWQnPyByZXF1aXJlKCdzaENvcmUnKS5TeW50YXhIaWdobGlnaHRlciA6IG51bGwpO1xuXG5cdGZ1bmN0aW9uIEJydXNoKClcblx0e1xuXHRcdC8vIENvcHlyaWdodCAyMDA2IFNoaW4sIFlvdW5nSmluXG5cdFxuXHRcdHZhciBkYXRhdHlwZXMgPVx0J0FUT00gQk9PTCBCT09MRUFOIEJZVEUgQ0hBUiBDT0xPUlJFRiBEV09SRCBEV09SRExPTkcgRFdPUkRfUFRSICcgK1xuXHRcdFx0XHRcdFx0J0RXT1JEMzIgRFdPUkQ2NCBGTE9BVCBIQUNDRUwgSEFMRl9QVFIgSEFORExFIEhCSVRNQVAgSEJSVVNIICcgK1xuXHRcdFx0XHRcdFx0J0hDT0xPUlNQQUNFIEhDT05WIEhDT05WTElTVCBIQ1VSU09SIEhEQyBIRERFREFUQSBIREVTSyBIRFJPUCBIRFdQICcgK1xuXHRcdFx0XHRcdFx0J0hFTkhNRVRBRklMRSBIRklMRSBIRk9OVCBIR0RJT0JKIEhHTE9CQUwgSEhPT0sgSElDT04gSElOU1RBTkNFIEhLRVkgJyArXG5cdFx0XHRcdFx0XHQnSEtMIEhMT0NBTCBITUVOVSBITUVUQUZJTEUgSE1PRFVMRSBITU9OSVRPUiBIUEFMRVRURSBIUEVOIEhSRVNVTFQgJyArXG5cdFx0XHRcdFx0XHQnSFJHTiBIUlNSQyBIU1ogSFdJTlNUQSBIV05EIElOVCBJTlRfUFRSIElOVDMyIElOVDY0IExBTkdJRCBMQ0lEIExDVFlQRSAnICtcblx0XHRcdFx0XHRcdCdMR1JQSUQgTE9ORyBMT05HTE9ORyBMT05HX1BUUiBMT05HMzIgTE9ORzY0IExQQVJBTSBMUEJPT0wgTFBCWVRFIExQQ09MT1JSRUYgJyArXG5cdFx0XHRcdFx0XHQnTFBDU1RSIExQQ1RTVFIgTFBDVk9JRCBMUENXU1RSIExQRFdPUkQgTFBIQU5ETEUgTFBJTlQgTFBMT05HIExQU1RSIExQVFNUUiAnICtcblx0XHRcdFx0XHRcdCdMUFZPSUQgTFBXT1JEIExQV1NUUiBMUkVTVUxUIFBCT09MIFBCT09MRUFOIFBCWVRFIFBDSEFSIFBDU1RSIFBDVFNUUiBQQ1dTVFIgJyArXG5cdFx0XHRcdFx0XHQnUERXT1JETE9ORyBQRFdPUkRfUFRSIFBEV09SRDMyIFBEV09SRDY0IFBGTE9BVCBQSEFMRl9QVFIgUEhBTkRMRSBQSEtFWSBQSU5UICcgK1xuXHRcdFx0XHRcdFx0J1BJTlRfUFRSIFBJTlQzMiBQSU5UNjQgUExDSUQgUExPTkcgUExPTkdMT05HIFBMT05HX1BUUiBQTE9ORzMyIFBMT05HNjQgUE9JTlRFUl8zMiAnICtcblx0XHRcdFx0XHRcdCdQT0lOVEVSXzY0IFBTSE9SVCBQU0laRV9UIFBTU0laRV9UIFBTVFIgUFRCWVRFIFBUQ0hBUiBQVFNUUiBQVUNIQVIgUFVIQUxGX1BUUiAnICtcblx0XHRcdFx0XHRcdCdQVUlOVCBQVUlOVF9QVFIgUFVJTlQzMiBQVUlOVDY0IFBVTE9ORyBQVUxPTkdMT05HIFBVTE9OR19QVFIgUFVMT05HMzIgUFVMT05HNjQgJyArXG5cdFx0XHRcdFx0XHQnUFVTSE9SVCBQVk9JRCBQV0NIQVIgUFdPUkQgUFdTVFIgU0NfSEFORExFIFNDX0xPQ0sgU0VSVklDRV9TVEFUVVNfSEFORExFIFNIT1JUICcgK1xuXHRcdFx0XHRcdFx0J1NJWkVfVCBTU0laRV9UIFRCWVRFIFRDSEFSIFVDSEFSIFVIQUxGX1BUUiBVSU5UIFVJTlRfUFRSIFVJTlQzMiBVSU5UNjQgVUxPTkcgJyArXG5cdFx0XHRcdFx0XHQnVUxPTkdMT05HIFVMT05HX1BUUiBVTE9ORzMyIFVMT05HNjQgVVNIT1JUIFVTTiBWT0lEIFdDSEFSIFdPUkQgV1BBUkFNIFdQQVJBTSBXUEFSQU0gJyArXG5cdFx0XHRcdFx0XHQnY2hhciBib29sIHNob3J0IGludCBfX2ludDMyIF9faW50NjQgX19pbnQ4IF9faW50MTYgbG9uZyBmbG9hdCBkb3VibGUgX193Y2hhcl90ICcgK1xuXHRcdFx0XHRcdFx0J2Nsb2NrX3QgX2NvbXBsZXggX2Rldl90IF9kaXNrZnJlZV90IGRpdl90IGxkaXZfdCBfZXhjZXB0aW9uIF9FWENFUFRJT05fUE9JTlRFUlMgJyArXG5cdFx0XHRcdFx0XHQnRklMRSBfZmluZGRhdGFfdCBfZmluZGRhdGFpNjRfdCBfd2ZpbmRkYXRhX3QgX3dmaW5kZGF0YWk2NF90IF9fZmluZGRhdGE2NF90ICcgK1xuXHRcdFx0XHRcdFx0J19fd2ZpbmRkYXRhNjRfdCBfRlBJRUVFX1JFQ09SRCBmcG9zX3QgX0hFQVBJTkZPIF9IRklMRSBsY29udiBpbnRwdHJfdCAnICtcblx0XHRcdFx0XHRcdCdqbXBfYnVmIG1ic3RhdGVfdCBfb2ZmX3QgX29uZXhpdF90IF9QTkggcHRyZGlmZl90IF9wdXJlY2FsbF9oYW5kbGVyICcgK1xuXHRcdFx0XHRcdFx0J3NpZ19hdG9taWNfdCBzaXplX3QgX3N0YXQgX19zdGF0NjQgX3N0YXRpNjQgdGVybWluYXRlX2Z1bmN0aW9uICcgK1xuXHRcdFx0XHRcdFx0J3RpbWVfdCBfX3RpbWU2NF90IF90aW1lYiBfX3RpbWViNjQgdG0gdWludHB0cl90IF91dGltYnVmICcgK1xuXHRcdFx0XHRcdFx0J3ZhX2xpc3Qgd2NoYXJfdCB3Y3RyYW5zX3Qgd2N0eXBlX3Qgd2ludF90IHNpZ25lZCc7XG5cblx0XHR2YXIga2V5d29yZHMgPVx0J2F1dG8gYnJlYWsgY2FzZSBjYXRjaCBjbGFzcyBjb25zdCBkZWNsdHlwZSBfX2ZpbmFsbHkgX19leGNlcHRpb24gX190cnkgJyArXG5cdFx0XHRcdFx0XHQnY29uc3RfY2FzdCBjb250aW51ZSBwcml2YXRlIHB1YmxpYyBwcm90ZWN0ZWQgX19kZWNsc3BlYyAnICtcblx0XHRcdFx0XHRcdCdkZWZhdWx0IGRlbGV0ZSBkZXByZWNhdGVkIGRsbGV4cG9ydCBkbGxpbXBvcnQgZG8gZHluYW1pY19jYXN0ICcgK1xuXHRcdFx0XHRcdFx0J2Vsc2UgZW51bSBleHBsaWNpdCBleHRlcm4gaWYgZm9yIGZyaWVuZCBnb3RvIGlubGluZSAnICtcblx0XHRcdFx0XHRcdCdtdXRhYmxlIG5ha2VkIG5hbWVzcGFjZSBuZXcgbm9pbmxpbmUgbm9yZXR1cm4gbm90aHJvdyAnICtcblx0XHRcdFx0XHRcdCdyZWdpc3RlciByZWludGVycHJldF9jYXN0IHJldHVybiBzZWxlY3RhbnkgJyArXG5cdFx0XHRcdFx0XHQnc2l6ZW9mIHN0YXRpYyBzdGF0aWNfY2FzdCBzdHJ1Y3Qgc3dpdGNoIHRlbXBsYXRlIHRoaXMgJyArXG5cdFx0XHRcdFx0XHQndGhyZWFkIHRocm93IHRydWUgZmFsc2UgdHJ5IHR5cGVkZWYgdHlwZWlkIHR5cGVuYW1lIHVuaW9uICcgK1xuXHRcdFx0XHRcdFx0J3VzaW5nIHV1aWQgdmlydHVhbCB2b2lkIHZvbGF0aWxlIHdoY2FyX3Qgd2hpbGUnO1xuXHRcdFx0XHRcdFxuXHRcdHZhciBmdW5jdGlvbnMgPVx0J2Fzc2VydCBpc2FsbnVtIGlzYWxwaGEgaXNjbnRybCBpc2RpZ2l0IGlzZ3JhcGggaXNsb3dlciBpc3ByaW50JyArXG5cdFx0XHRcdFx0XHQnaXNwdW5jdCBpc3NwYWNlIGlzdXBwZXIgaXN4ZGlnaXQgdG9sb3dlciB0b3VwcGVyIGVycm5vIGxvY2FsZWNvbnYgJyArXG5cdFx0XHRcdFx0XHQnc2V0bG9jYWxlIGFjb3MgYXNpbiBhdGFuIGF0YW4yIGNlaWwgY29zIGNvc2ggZXhwIGZhYnMgZmxvb3IgZm1vZCAnICtcblx0XHRcdFx0XHRcdCdmcmV4cCBsZGV4cCBsb2cgbG9nMTAgbW9kZiBwb3cgc2luIHNpbmggc3FydCB0YW4gdGFuaCBqbXBfYnVmICcgK1xuXHRcdFx0XHRcdFx0J2xvbmdqbXAgc2V0am1wIHJhaXNlIHNpZ25hbCBzaWdfYXRvbWljX3QgdmFfYXJnIHZhX2VuZCB2YV9zdGFydCAnICtcblx0XHRcdFx0XHRcdCdjbGVhcmVyciBmY2xvc2UgZmVvZiBmZXJyb3IgZmZsdXNoIGZnZXRjIGZnZXRwb3MgZmdldHMgZm9wZW4gJyArXG5cdFx0XHRcdFx0XHQnZnByaW50ZiBmcHV0YyBmcHV0cyBmcmVhZCBmcmVvcGVuIGZzY2FuZiBmc2VlayBmc2V0cG9zIGZ0ZWxsICcgK1xuXHRcdFx0XHRcdFx0J2Z3cml0ZSBnZXRjIGdldGNoYXIgZ2V0cyBwZXJyb3IgcHJpbnRmIHB1dGMgcHV0Y2hhciBwdXRzIHJlbW92ZSAnICtcblx0XHRcdFx0XHRcdCdyZW5hbWUgcmV3aW5kIHNjYW5mIHNldGJ1ZiBzZXR2YnVmIHNwcmludGYgc3NjYW5mIHRtcGZpbGUgdG1wbmFtICcgK1xuXHRcdFx0XHRcdFx0J3VuZ2V0YyB2ZnByaW50ZiB2cHJpbnRmIHZzcHJpbnRmIGFib3J0IGFicyBhdGV4aXQgYXRvZiBhdG9pIGF0b2wgJyArXG5cdFx0XHRcdFx0XHQnYnNlYXJjaCBjYWxsb2MgZGl2IGV4aXQgZnJlZSBnZXRlbnYgbGFicyBsZGl2IG1hbGxvYyBtYmxlbiBtYnN0b3djcyAnICtcblx0XHRcdFx0XHRcdCdtYnRvd2MgcXNvcnQgcmFuZCByZWFsbG9jIHNyYW5kIHN0cnRvZCBzdHJ0b2wgc3RydG91bCBzeXN0ZW0gJyArXG5cdFx0XHRcdFx0XHQnd2NzdG9tYnMgd2N0b21iIG1lbWNociBtZW1jbXAgbWVtY3B5IG1lbW1vdmUgbWVtc2V0IHN0cmNhdCBzdHJjaHIgJyArXG5cdFx0XHRcdFx0XHQnc3RyY21wIHN0cmNvbGwgc3RyY3B5IHN0cmNzcG4gc3RyZXJyb3Igc3RybGVuIHN0cm5jYXQgc3RybmNtcCAnICtcblx0XHRcdFx0XHRcdCdzdHJuY3B5IHN0cnBicmsgc3RycmNociBzdHJzcG4gc3Ryc3RyIHN0cnRvayBzdHJ4ZnJtIGFzY3RpbWUgJyArXG5cdFx0XHRcdFx0XHQnY2xvY2sgY3RpbWUgZGlmZnRpbWUgZ210aW1lIGxvY2FsdGltZSBta3RpbWUgc3RyZnRpbWUgdGltZSc7XG5cblx0XHR0aGlzLnJlZ2V4TGlzdCA9IFtcblx0XHRcdHsgcmVnZXg6IFN5bnRheEhpZ2hsaWdodGVyLnJlZ2V4TGliLnNpbmdsZUxpbmVDQ29tbWVudHMsXHRjc3M6ICdjb21tZW50cycgfSxcdFx0XHQvLyBvbmUgbGluZSBjb21tZW50c1xuXHRcdFx0eyByZWdleDogU3ludGF4SGlnaGxpZ2h0ZXIucmVnZXhMaWIubXVsdGlMaW5lQ0NvbW1lbnRzLFx0XHRjc3M6ICdjb21tZW50cycgfSxcdFx0XHQvLyBtdWx0aWxpbmUgY29tbWVudHNcblx0XHRcdHsgcmVnZXg6IFN5bnRheEhpZ2hsaWdodGVyLnJlZ2V4TGliLmRvdWJsZVF1b3RlZFN0cmluZyxcdFx0Y3NzOiAnc3RyaW5nJyB9LFx0XHRcdC8vIHN0cmluZ3Ncblx0XHRcdHsgcmVnZXg6IFN5bnRheEhpZ2hsaWdodGVyLnJlZ2V4TGliLnNpbmdsZVF1b3RlZFN0cmluZyxcdFx0Y3NzOiAnc3RyaW5nJyB9LFx0XHRcdC8vIHN0cmluZ3Ncblx0XHRcdHsgcmVnZXg6IC9eICojLiovZ20sXHRcdFx0XHRcdFx0XHRcdFx0XHRjc3M6ICdwcmVwcm9jZXNzb3InIH0sXG5cdFx0XHR7IHJlZ2V4OiBuZXcgUmVnRXhwKHRoaXMuZ2V0S2V5d29yZHMoZGF0YXR5cGVzKSwgJ2dtJyksXHRcdGNzczogJ2NvbG9yMSBib2xkJyB9LFxuXHRcdFx0eyByZWdleDogbmV3IFJlZ0V4cCh0aGlzLmdldEtleXdvcmRzKGZ1bmN0aW9ucyksICdnbScpLFx0XHRjc3M6ICdmdW5jdGlvbnMgYm9sZCcgfSxcblx0XHRcdHsgcmVnZXg6IG5ldyBSZWdFeHAodGhpcy5nZXRLZXl3b3JkcyhrZXl3b3JkcyksICdnbScpLFx0XHRjc3M6ICdrZXl3b3JkIGJvbGQnIH1cblx0XHRcdF07XG5cdH07XG5cblx0QnJ1c2gucHJvdG90eXBlXHQ9IG5ldyBTeW50YXhIaWdobGlnaHRlci5IaWdobGlnaHRlcigpO1xuXHRCcnVzaC5hbGlhc2VzXHQ9IFsnY3BwJywgJ2MnXTtcblxuXHRTeW50YXhIaWdobGlnaHRlci5icnVzaGVzLkNwcCA9IEJydXNoO1xuXG5cdC8vIENvbW1vbkpTXG5cdHR5cGVvZihleHBvcnRzKSAhPSAndW5kZWZpbmVkJyA/IGV4cG9ydHMuQnJ1c2ggPSBCcnVzaCA6IG51bGw7XG59KSgpO1xuOyhmdW5jdGlvbigpXG57XG5cdC8vIENvbW1vbkpTXG5cdFN5bnRheEhpZ2hsaWdodGVyID0gU3ludGF4SGlnaGxpZ2h0ZXIgfHwgKHR5cGVvZiByZXF1aXJlICE9PSAndW5kZWZpbmVkJz8gcmVxdWlyZSgnc2hDb3JlJykuU3ludGF4SGlnaGxpZ2h0ZXIgOiBudWxsKTtcblxuXHRmdW5jdGlvbiBCcnVzaCgpXG5cdHtcblx0XHR2YXIga2V5d29yZHMgPVx0J2Fic3RyYWN0IGFzIGJhc2UgYm9vbCBicmVhayBieXRlIGNhc2UgY2F0Y2ggY2hhciBjaGVja2VkIGNsYXNzIGNvbnN0ICcgK1xuXHRcdFx0XHRcdFx0J2NvbnRpbnVlIGRlY2ltYWwgZGVmYXVsdCBkZWxlZ2F0ZSBkbyBkb3VibGUgZWxzZSBlbnVtIGV2ZW50IGV4cGxpY2l0IHZvbGF0aWxlICcgK1xuXHRcdFx0XHRcdFx0J2V4dGVybiBmYWxzZSBmaW5hbGx5IGZpeGVkIGZsb2F0IGZvciBmb3JlYWNoIGdldCBnb3RvIGlmIGltcGxpY2l0IGluIGludCAnICtcblx0XHRcdFx0XHRcdCdpbnRlcmZhY2UgaW50ZXJuYWwgaXMgbG9jayBsb25nIG5hbWVzcGFjZSBuZXcgbnVsbCBvYmplY3Qgb3BlcmF0b3Igb3V0ICcgK1xuXHRcdFx0XHRcdFx0J292ZXJyaWRlIHBhcmFtcyBwcml2YXRlIHByb3RlY3RlZCBwdWJsaWMgcmVhZG9ubHkgcmVmIHJldHVybiBzYnl0ZSBzZWFsZWQgc2V0ICcgK1xuXHRcdFx0XHRcdFx0J3Nob3J0IHNpemVvZiBzdGFja2FsbG9jIHN0YXRpYyBzdHJpbmcgc3RydWN0IHN3aXRjaCB0aGlzIHRocm93IHRydWUgdHJ5ICcgK1xuXHRcdFx0XHRcdFx0J3R5cGVvZiB1aW50IHVsb25nIHVuY2hlY2tlZCB1bnNhZmUgdXNob3J0IHVzaW5nIHZpcnR1YWwgdm9pZCB3aGlsZSB2YXIgJyArXG5cdFx0XHRcdFx0XHQnZnJvbSBncm91cCBieSBpbnRvIHNlbGVjdCBsZXQgd2hlcmUgb3JkZXJieSBqb2luIG9uIGVxdWFscyBhc2NlbmRpbmcgZGVzY2VuZGluZyc7XG5cblx0XHRmdW5jdGlvbiBmaXhDb21tZW50cyhtYXRjaCwgcmVnZXhJbmZvKVxuXHRcdHtcblx0XHRcdHZhciBjc3MgPSAobWF0Y2hbMF0uaW5kZXhPZihcIi8vL1wiKSA9PSAwKVxuXHRcdFx0XHQ/ICdjb2xvcjEnXG5cdFx0XHRcdDogJ2NvbW1lbnRzJ1xuXHRcdFx0XHQ7XG5cdFx0XHRcblx0XHRcdHJldHVybiBbbmV3IFN5bnRheEhpZ2hsaWdodGVyLk1hdGNoKG1hdGNoWzBdLCBtYXRjaC5pbmRleCwgY3NzKV07XG5cdFx0fVxuXG5cdFx0dGhpcy5yZWdleExpc3QgPSBbXG5cdFx0XHR7IHJlZ2V4OiBTeW50YXhIaWdobGlnaHRlci5yZWdleExpYi5zaW5nbGVMaW5lQ0NvbW1lbnRzLFx0ZnVuYyA6IGZpeENvbW1lbnRzIH0sXHRcdC8vIG9uZSBsaW5lIGNvbW1lbnRzXG5cdFx0XHR7IHJlZ2V4OiBTeW50YXhIaWdobGlnaHRlci5yZWdleExpYi5tdWx0aUxpbmVDQ29tbWVudHMsXHRcdGNzczogJ2NvbW1lbnRzJyB9LFx0XHRcdC8vIG11bHRpbGluZSBjb21tZW50c1xuXHRcdFx0eyByZWdleDogL0BcIig/OlteXCJdfFwiXCIpKlwiL2csXHRcdFx0XHRcdFx0XHRcdGNzczogJ3N0cmluZycgfSxcdFx0XHQvLyBALXF1b3RlZCBzdHJpbmdzXG5cdFx0XHR7IHJlZ2V4OiBTeW50YXhIaWdobGlnaHRlci5yZWdleExpYi5kb3VibGVRdW90ZWRTdHJpbmcsXHRcdGNzczogJ3N0cmluZycgfSxcdFx0XHQvLyBzdHJpbmdzXG5cdFx0XHR7IHJlZ2V4OiBTeW50YXhIaWdobGlnaHRlci5yZWdleExpYi5zaW5nbGVRdW90ZWRTdHJpbmcsXHRcdGNzczogJ3N0cmluZycgfSxcdFx0XHQvLyBzdHJpbmdzXG5cdFx0XHR7IHJlZ2V4OiAvXlxccyojLiovZ20sXHRcdFx0XHRcdFx0XHRcdFx0XHRjc3M6ICdwcmVwcm9jZXNzb3InIH0sXHRcdC8vIHByZXByb2Nlc3NvciB0YWdzIGxpa2UgI3JlZ2lvbiBhbmQgI2VuZHJlZ2lvblxuXHRcdFx0eyByZWdleDogbmV3IFJlZ0V4cCh0aGlzLmdldEtleXdvcmRzKGtleXdvcmRzKSwgJ2dtJyksXHRcdGNzczogJ2tleXdvcmQnIH0sXHRcdFx0Ly8gYyMga2V5d29yZFxuXHRcdFx0eyByZWdleDogL1xcYnBhcnRpYWwoPz1cXHMrKD86Y2xhc3N8aW50ZXJmYWNlfHN0cnVjdClcXGIpL2csXHRjc3M6ICdrZXl3b3JkJyB9LFx0XHRcdC8vIGNvbnRleHR1YWwga2V5d29yZDogJ3BhcnRpYWwnXG5cdFx0XHR7IHJlZ2V4OiAvXFxieWllbGQoPz1cXHMrKD86cmV0dXJufGJyZWFrKVxcYikvZyxcdFx0XHRcdGNzczogJ2tleXdvcmQnIH1cdFx0XHQvLyBjb250ZXh0dWFsIGtleXdvcmQ6ICd5aWVsZCdcblx0XHRcdF07XG5cdFx0XG5cdFx0dGhpcy5mb3JIdG1sU2NyaXB0KFN5bnRheEhpZ2hsaWdodGVyLnJlZ2V4TGliLmFzcFNjcmlwdFRhZ3MpO1xuXHR9O1xuXG5cdEJydXNoLnByb3RvdHlwZVx0PSBuZXcgU3ludGF4SGlnaGxpZ2h0ZXIuSGlnaGxpZ2h0ZXIoKTtcblx0QnJ1c2guYWxpYXNlc1x0PSBbJ2MjJywgJ2Mtc2hhcnAnLCAnY3NoYXJwJ107XG5cblx0U3ludGF4SGlnaGxpZ2h0ZXIuYnJ1c2hlcy5DU2hhcnAgPSBCcnVzaDtcblxuXHQvLyBDb21tb25KU1xuXHR0eXBlb2YoZXhwb3J0cykgIT0gJ3VuZGVmaW5lZCcgPyBleHBvcnRzLkJydXNoID0gQnJ1c2ggOiBudWxsO1xufSkoKTtcbjsoZnVuY3Rpb24oKVxue1xuXHQvLyBDb21tb25KU1xuXHRTeW50YXhIaWdobGlnaHRlciA9IFN5bnRheEhpZ2hsaWdodGVyIHx8ICh0eXBlb2YgcmVxdWlyZSAhPT0gJ3VuZGVmaW5lZCc/IHJlcXVpcmUoJ3NoQ29yZScpLlN5bnRheEhpZ2hsaWdodGVyIDogbnVsbCk7XG5cblx0ZnVuY3Rpb24gQnJ1c2goKVxuXHR7XG5cdFx0ZnVuY3Rpb24gZ2V0S2V5d29yZHNDU1Moc3RyKVxuXHRcdHtcblx0XHRcdHJldHVybiAnXFxcXGIoW2Etel9dfCknICsgc3RyLnJlcGxhY2UoLyAvZywgJyg/PTopXFxcXGJ8XFxcXGIoW2Etel9cXFxcKl18XFxcXCp8KScpICsgJyg/PTopXFxcXGInO1xuXHRcdH07XG5cdFxuXHRcdGZ1bmN0aW9uIGdldFZhbHVlc0NTUyhzdHIpXG5cdFx0e1xuXHRcdFx0cmV0dXJuICdcXFxcYicgKyBzdHIucmVwbGFjZSgvIC9nLCAnKD8hLSkoPyE6KVxcXFxifFxcXFxiKCknKSArICdcXDpcXFxcYic7XG5cdFx0fTtcblxuXHRcdHZhciBrZXl3b3JkcyA9XHQnYXNjZW50IGF6aW11dGggYmFja2dyb3VuZC1hdHRhY2htZW50IGJhY2tncm91bmQtY29sb3IgYmFja2dyb3VuZC1pbWFnZSBiYWNrZ3JvdW5kLXBvc2l0aW9uICcgK1xuXHRcdFx0XHRcdFx0J2JhY2tncm91bmQtcmVwZWF0IGJhY2tncm91bmQgYmFzZWxpbmUgYmJveCBib3JkZXItY29sbGFwc2UgYm9yZGVyLWNvbG9yIGJvcmRlci1zcGFjaW5nIGJvcmRlci1zdHlsZSBib3JkZXItdG9wICcgK1xuXHRcdFx0XHRcdFx0J2JvcmRlci1yaWdodCBib3JkZXItYm90dG9tIGJvcmRlci1sZWZ0IGJvcmRlci10b3AtY29sb3IgYm9yZGVyLXJpZ2h0LWNvbG9yIGJvcmRlci1ib3R0b20tY29sb3IgYm9yZGVyLWxlZnQtY29sb3IgJyArXG5cdFx0XHRcdFx0XHQnYm9yZGVyLXRvcC1zdHlsZSBib3JkZXItcmlnaHQtc3R5bGUgYm9yZGVyLWJvdHRvbS1zdHlsZSBib3JkZXItbGVmdC1zdHlsZSBib3JkZXItdG9wLXdpZHRoIGJvcmRlci1yaWdodC13aWR0aCAnICtcblx0XHRcdFx0XHRcdCdib3JkZXItYm90dG9tLXdpZHRoIGJvcmRlci1sZWZ0LXdpZHRoIGJvcmRlci13aWR0aCBib3JkZXIgYm90dG9tIGNhcC1oZWlnaHQgY2FwdGlvbi1zaWRlIGNlbnRlcmxpbmUgY2xlYXIgY2xpcCBjb2xvciAnICtcblx0XHRcdFx0XHRcdCdjb250ZW50IGNvdW50ZXItaW5jcmVtZW50IGNvdW50ZXItcmVzZXQgY3VlLWFmdGVyIGN1ZS1iZWZvcmUgY3VlIGN1cnNvciBkZWZpbml0aW9uLXNyYyBkZXNjZW50IGRpcmVjdGlvbiBkaXNwbGF5ICcgK1xuXHRcdFx0XHRcdFx0J2VsZXZhdGlvbiBlbXB0eS1jZWxscyBmbG9hdCBmb250LXNpemUtYWRqdXN0IGZvbnQtZmFtaWx5IGZvbnQtc2l6ZSBmb250LXN0cmV0Y2ggZm9udC1zdHlsZSBmb250LXZhcmlhbnQgZm9udC13ZWlnaHQgZm9udCAnICtcblx0XHRcdFx0XHRcdCdoZWlnaHQgbGVmdCBsZXR0ZXItc3BhY2luZyBsaW5lLWhlaWdodCBsaXN0LXN0eWxlLWltYWdlIGxpc3Qtc3R5bGUtcG9zaXRpb24gbGlzdC1zdHlsZS10eXBlIGxpc3Qtc3R5bGUgbWFyZ2luLXRvcCAnICtcblx0XHRcdFx0XHRcdCdtYXJnaW4tcmlnaHQgbWFyZ2luLWJvdHRvbSBtYXJnaW4tbGVmdCBtYXJnaW4gbWFya2VyLW9mZnNldCBtYXJrcyBtYXRobGluZSBtYXgtaGVpZ2h0IG1heC13aWR0aCBtaW4taGVpZ2h0IG1pbi13aWR0aCBvcnBoYW5zICcgK1xuXHRcdFx0XHRcdFx0J291dGxpbmUtY29sb3Igb3V0bGluZS1zdHlsZSBvdXRsaW5lLXdpZHRoIG91dGxpbmUgb3ZlcmZsb3cgcGFkZGluZy10b3AgcGFkZGluZy1yaWdodCBwYWRkaW5nLWJvdHRvbSBwYWRkaW5nLWxlZnQgcGFkZGluZyBwYWdlICcgK1xuXHRcdFx0XHRcdFx0J3BhZ2UtYnJlYWstYWZ0ZXIgcGFnZS1icmVhay1iZWZvcmUgcGFnZS1icmVhay1pbnNpZGUgcGF1c2UgcGF1c2UtYWZ0ZXIgcGF1c2UtYmVmb3JlIHBpdGNoIHBpdGNoLXJhbmdlIHBsYXktZHVyaW5nIHBvc2l0aW9uICcgK1xuXHRcdFx0XHRcdFx0J3F1b3RlcyByaWdodCByaWNobmVzcyBzaXplIHNsb3BlIHNyYyBzcGVhay1oZWFkZXIgc3BlYWstbnVtZXJhbCBzcGVhay1wdW5jdHVhdGlvbiBzcGVhayBzcGVlY2gtcmF0ZSBzdGVtaCBzdGVtdiBzdHJlc3MgJyArXG5cdFx0XHRcdFx0XHQndGFibGUtbGF5b3V0IHRleHQtYWxpZ24gdG9wIHRleHQtZGVjb3JhdGlvbiB0ZXh0LWluZGVudCB0ZXh0LXNoYWRvdyB0ZXh0LXRyYW5zZm9ybSB1bmljb2RlLWJpZGkgdW5pY29kZS1yYW5nZSB1bml0cy1wZXItZW0gJyArXG5cdFx0XHRcdFx0XHQndmVydGljYWwtYWxpZ24gdmlzaWJpbGl0eSB2b2ljZS1mYW1pbHkgdm9sdW1lIHdoaXRlLXNwYWNlIHdpZG93cyB3aWR0aCB3aWR0aHMgd29yZC1zcGFjaW5nIHgtaGVpZ2h0IHotaW5kZXgnO1xuXG5cdFx0dmFyIHZhbHVlcyA9XHQnYWJvdmUgYWJzb2x1dGUgYWxsIGFsd2F5cyBhcXVhIGFybWVuaWFuIGF0dHIgYXVyYWwgYXV0byBhdm9pZCBiYXNlbGluZSBiZWhpbmQgYmVsb3cgYmlkaS1vdmVycmlkZSBibGFjayBibGluayBibG9jayBibHVlIGJvbGQgYm9sZGVyICcrXG5cdFx0XHRcdFx0XHQnYm90aCBib3R0b20gYnJhaWxsZSBjYXBpdGFsaXplIGNhcHRpb24gY2VudGVyIGNlbnRlci1sZWZ0IGNlbnRlci1yaWdodCBjaXJjbGUgY2xvc2UtcXVvdGUgY29kZSBjb2xsYXBzZSBjb21wYWN0IGNvbmRlbnNlZCAnK1xuXHRcdFx0XHRcdFx0J2NvbnRpbnVvdXMgY291bnRlciBjb3VudGVycyBjcm9wIGNyb3NzIGNyb3NzaGFpciBjdXJzaXZlIGRhc2hlZCBkZWNpbWFsIGRlY2ltYWwtbGVhZGluZy16ZXJvIGRlZmF1bHQgZGlnaXRzIGRpc2MgZG90dGVkIGRvdWJsZSAnK1xuXHRcdFx0XHRcdFx0J2VtYmVkIGVtYm9zc2VkIGUtcmVzaXplIGV4cGFuZGVkIGV4dHJhLWNvbmRlbnNlZCBleHRyYS1leHBhbmRlZCBmYW50YXN5IGZhci1sZWZ0IGZhci1yaWdodCBmYXN0IGZhc3RlciBmaXhlZCBmb3JtYXQgZnVjaHNpYSAnK1xuXHRcdFx0XHRcdFx0J2dyYXkgZ3JlZW4gZ3Jvb3ZlIGhhbmRoZWxkIGhlYnJldyBoZWxwIGhpZGRlbiBoaWRlIGhpZ2ggaGlnaGVyIGljb24gaW5saW5lLXRhYmxlIGlubGluZSBpbnNldCBpbnNpZGUgaW52ZXJ0IGl0YWxpYyAnK1xuXHRcdFx0XHRcdFx0J2p1c3RpZnkgbGFuZHNjYXBlIGxhcmdlIGxhcmdlciBsZWZ0LXNpZGUgbGVmdCBsZWZ0d2FyZHMgbGV2ZWwgbGlnaHRlciBsaW1lIGxpbmUtdGhyb3VnaCBsaXN0LWl0ZW0gbG9jYWwgbG91ZCBsb3dlci1hbHBoYSAnK1xuXHRcdFx0XHRcdFx0J2xvd2VyY2FzZSBsb3dlci1ncmVlayBsb3dlci1sYXRpbiBsb3dlci1yb21hbiBsb3dlciBsb3cgbHRyIG1hcmtlciBtYXJvb24gbWVkaXVtIG1lc3NhZ2UtYm94IG1pZGRsZSBtaXggbW92ZSBuYXJyb3dlciAnK1xuXHRcdFx0XHRcdFx0J25hdnkgbmUtcmVzaXplIG5vLWNsb3NlLXF1b3RlIG5vbmUgbm8tb3Blbi1xdW90ZSBuby1yZXBlYXQgbm9ybWFsIG5vd3JhcCBuLXJlc2l6ZSBudy1yZXNpemUgb2JsaXF1ZSBvbGl2ZSBvbmNlIG9wZW4tcXVvdGUgb3V0c2V0ICcrXG5cdFx0XHRcdFx0XHQnb3V0c2lkZSBvdmVybGluZSBwb2ludGVyIHBvcnRyYWl0IHByZSBwcmludCBwcm9qZWN0aW9uIHB1cnBsZSByZWQgcmVsYXRpdmUgcmVwZWF0IHJlcGVhdC14IHJlcGVhdC15IHJnYiByaWRnZSByaWdodCByaWdodC1zaWRlICcrXG5cdFx0XHRcdFx0XHQncmlnaHR3YXJkcyBydGwgcnVuLWluIHNjcmVlbiBzY3JvbGwgc2VtaS1jb25kZW5zZWQgc2VtaS1leHBhbmRlZCBzZXBhcmF0ZSBzZS1yZXNpemUgc2hvdyBzaWxlbnQgc2lsdmVyIHNsb3dlciBzbG93ICcrXG5cdFx0XHRcdFx0XHQnc21hbGwgc21hbGwtY2FwcyBzbWFsbC1jYXB0aW9uIHNtYWxsZXIgc29mdCBzb2xpZCBzcGVlY2ggc3BlbGwtb3V0IHNxdWFyZSBzLXJlc2l6ZSBzdGF0aWMgc3RhdHVzLWJhciBzdWIgc3VwZXIgc3ctcmVzaXplICcrXG5cdFx0XHRcdFx0XHQndGFibGUtY2FwdGlvbiB0YWJsZS1jZWxsIHRhYmxlLWNvbHVtbiB0YWJsZS1jb2x1bW4tZ3JvdXAgdGFibGUtZm9vdGVyLWdyb3VwIHRhYmxlLWhlYWRlci1ncm91cCB0YWJsZS1yb3cgdGFibGUtcm93LWdyb3VwIHRlYWwgJytcblx0XHRcdFx0XHRcdCd0ZXh0LWJvdHRvbSB0ZXh0LXRvcCB0aGljayB0aGluIHRvcCB0cmFuc3BhcmVudCB0dHkgdHYgdWx0cmEtY29uZGVuc2VkIHVsdHJhLWV4cGFuZGVkIHVuZGVybGluZSB1cHBlci1hbHBoYSB1cHBlcmNhc2UgdXBwZXItbGF0aW4gJytcblx0XHRcdFx0XHRcdCd1cHBlci1yb21hbiB1cmwgdmlzaWJsZSB3YWl0IHdoaXRlIHdpZGVyIHctcmVzaXplIHgtZmFzdCB4LWhpZ2ggeC1sYXJnZSB4LWxvdWQgeC1sb3cgeC1zbG93IHgtc21hbGwgeC1zb2Z0IHh4LWxhcmdlIHh4LXNtYWxsIHllbGxvdyc7XG5cblx0XHR2YXIgZm9udHMgPVx0XHQnW21NXW9ub3NwYWNlIFt0VF1haG9tYSBbdlZdZXJkYW5hIFthQV1yaWFsIFtoSF1lbHZldGljYSBbc1NdYW5zLXNlcmlmIFtzU11lcmlmIFtjQ11vdXJpZXIgbW9ubyBzYW5zIHNlcmlmJztcblx0XG5cdFx0dGhpcy5yZWdleExpc3QgPSBbXG5cdFx0XHR7IHJlZ2V4OiBTeW50YXhIaWdobGlnaHRlci5yZWdleExpYi5tdWx0aUxpbmVDQ29tbWVudHMsXHRcdGNzczogJ2NvbW1lbnRzJyB9LFx0Ly8gbXVsdGlsaW5lIGNvbW1lbnRzXG5cdFx0XHR7IHJlZ2V4OiBTeW50YXhIaWdobGlnaHRlci5yZWdleExpYi5kb3VibGVRdW90ZWRTdHJpbmcsXHRcdGNzczogJ3N0cmluZycgfSxcdC8vIGRvdWJsZSBxdW90ZWQgc3RyaW5nc1xuXHRcdFx0eyByZWdleDogU3ludGF4SGlnaGxpZ2h0ZXIucmVnZXhMaWIuc2luZ2xlUXVvdGVkU3RyaW5nLFx0XHRjc3M6ICdzdHJpbmcnIH0sXHQvLyBzaW5nbGUgcXVvdGVkIHN0cmluZ3Ncblx0XHRcdHsgcmVnZXg6IC9cXCNbYS1mQS1GMC05XXszLDZ9L2csXHRcdFx0XHRcdFx0XHRcdGNzczogJ3ZhbHVlJyB9LFx0XHQvLyBodG1sIGNvbG9yc1xuXHRcdFx0eyByZWdleDogLygtP1xcZCspKFxcLlxcZCspPyhweHxlbXxwdHxcXDp8XFwlfCkvZyxcdFx0XHRcdGNzczogJ3ZhbHVlJyB9LFx0XHQvLyBzaXplc1xuXHRcdFx0eyByZWdleDogLyFpbXBvcnRhbnQvZyxcdFx0XHRcdFx0XHRcdFx0XHRcdGNzczogJ2NvbG9yMycgfSxcdC8vICFpbXBvcnRhbnRcblx0XHRcdHsgcmVnZXg6IG5ldyBSZWdFeHAoZ2V0S2V5d29yZHNDU1Moa2V5d29yZHMpLCAnZ20nKSxcdFx0Y3NzOiAna2V5d29yZCcgfSxcdC8vIGtleXdvcmRzXG5cdFx0XHR7IHJlZ2V4OiBuZXcgUmVnRXhwKGdldFZhbHVlc0NTUyh2YWx1ZXMpLCAnZycpLFx0XHRcdFx0Y3NzOiAndmFsdWUnIH0sXHRcdC8vIHZhbHVlc1xuXHRcdFx0eyByZWdleDogbmV3IFJlZ0V4cCh0aGlzLmdldEtleXdvcmRzKGZvbnRzKSwgJ2cnKSxcdFx0XHRjc3M6ICdjb2xvcjEnIH1cdFx0Ly8gZm9udHNcblx0XHRcdF07XG5cblx0XHR0aGlzLmZvckh0bWxTY3JpcHQoeyBcblx0XHRcdGxlZnQ6IC8oJmx0O3w8KVxccypzdHlsZS4qPygmZ3Q7fD4pL2dpLCBcblx0XHRcdHJpZ2h0OiAvKCZsdDt8PClcXC9cXHMqc3R5bGVcXHMqKCZndDt8PikvZ2kgXG5cdFx0XHR9KTtcblx0fTtcblxuXHRCcnVzaC5wcm90b3R5cGVcdD0gbmV3IFN5bnRheEhpZ2hsaWdodGVyLkhpZ2hsaWdodGVyKCk7XG5cdEJydXNoLmFsaWFzZXNcdD0gWydjc3MnXTtcblxuXHRTeW50YXhIaWdobGlnaHRlci5icnVzaGVzLkNTUyA9IEJydXNoO1xuXG5cdC8vIENvbW1vbkpTXG5cdHR5cGVvZihleHBvcnRzKSAhPSAndW5kZWZpbmVkJyA/IGV4cG9ydHMuQnJ1c2ggPSBCcnVzaCA6IG51bGw7XG59KSgpO1xuOyhmdW5jdGlvbigpXG57XG5cdC8vIENvbW1vbkpTXG5cdFN5bnRheEhpZ2hsaWdodGVyID0gU3ludGF4SGlnaGxpZ2h0ZXIgfHwgKHR5cGVvZiByZXF1aXJlICE9PSAndW5kZWZpbmVkJz8gcmVxdWlyZSgnc2hDb3JlJykuU3ludGF4SGlnaGxpZ2h0ZXIgOiBudWxsKTtcblxuXHRmdW5jdGlvbiBCcnVzaCgpXG5cdHtcblx0XHR2YXIga2V5d29yZHMgPVx0J2FicyBhZGRyIGFuZCBhbnNpY2hhciBhbnNpc3RyaW5nIGFycmF5IGFzIGFzbSBiZWdpbiBib29sZWFuIGJ5dGUgY2FyZGluYWwgJyArXG5cdFx0XHRcdFx0XHQnY2FzZSBjaGFyIGNsYXNzIGNvbXAgY29uc3QgY29uc3RydWN0b3IgY3VycmVuY3kgZGVzdHJ1Y3RvciBkaXYgZG8gZG91YmxlICcgK1xuXHRcdFx0XHRcdFx0J2Rvd250byBlbHNlIGVuZCBleGNlcHQgZXhwb3J0cyBleHRlbmRlZCBmYWxzZSBmaWxlIGZpbmFsaXphdGlvbiBmaW5hbGx5ICcgK1xuXHRcdFx0XHRcdFx0J2ZvciBmdW5jdGlvbiBnb3RvIGlmIGltcGxlbWVudGF0aW9uIGluIGluaGVyaXRlZCBpbnQ2NCBpbml0aWFsaXphdGlvbiAnICtcblx0XHRcdFx0XHRcdCdpbnRlZ2VyIGludGVyZmFjZSBpcyBsYWJlbCBsaWJyYXJ5IGxvbmdpbnQgbG9uZ3dvcmQgbW9kIG5pbCBub3Qgb2JqZWN0ICcgK1xuXHRcdFx0XHRcdFx0J29mIG9uIG9yIHBhY2tlZCBwYW5zaWNoYXIgcGFuc2lzdHJpbmcgcGNoYXIgcGN1cnJlbmN5IHBkYXRldGltZSBwZXh0ZW5kZWQgJyArXG5cdFx0XHRcdFx0XHQncGludDY0IHBvaW50ZXIgcHJpdmF0ZSBwcm9jZWR1cmUgcHJvZ3JhbSBwcm9wZXJ0eSBwc2hvcnRzdHJpbmcgcHN0cmluZyAnICtcblx0XHRcdFx0XHRcdCdwdmFyaWFudCBwd2lkZWNoYXIgcHdpZGVzdHJpbmcgcHJvdGVjdGVkIHB1YmxpYyBwdWJsaXNoZWQgcmFpc2UgcmVhbCByZWFsNDggJyArXG5cdFx0XHRcdFx0XHQncmVjb3JkIHJlcGVhdCBzZXQgc2hsIHNob3J0aW50IHNob3J0c3RyaW5nIHNociBzaW5nbGUgc21hbGxpbnQgc3RyaW5nIHRoZW4gJyArXG5cdFx0XHRcdFx0XHQndGhyZWFkdmFyIHRvIHRydWUgdHJ5IHR5cGUgdW5pdCB1bnRpbCB1c2VzIHZhbCB2YXIgdmFyaXJudCB3aGlsZSB3aWRlY2hhciAnICtcblx0XHRcdFx0XHRcdCd3aWRlc3RyaW5nIHdpdGggd29yZCB3cml0ZSB3cml0ZWxuIHhvcic7XG5cblx0XHR0aGlzLnJlZ2V4TGlzdCA9IFtcblx0XHRcdHsgcmVnZXg6IC9cXChcXCpbXFxzXFxTXSo/XFwqXFwpL2dtLFx0XHRcdFx0XHRcdFx0XHRjc3M6ICdjb21tZW50cycgfSwgIFx0Ly8gbXVsdGlsaW5lIGNvbW1lbnRzICgqICopXG5cdFx0XHR7IHJlZ2V4OiAveyg/IVxcJClbXFxzXFxTXSo/fS9nbSxcdFx0XHRcdFx0XHRcdFx0Y3NzOiAnY29tbWVudHMnIH0sICBcdC8vIG11bHRpbGluZSBjb21tZW50cyB7IH1cblx0XHRcdHsgcmVnZXg6IFN5bnRheEhpZ2hsaWdodGVyLnJlZ2V4TGliLnNpbmdsZUxpbmVDQ29tbWVudHMsXHRjc3M6ICdjb21tZW50cycgfSwgIFx0Ly8gb25lIGxpbmVcblx0XHRcdHsgcmVnZXg6IFN5bnRheEhpZ2hsaWdodGVyLnJlZ2V4TGliLnNpbmdsZVF1b3RlZFN0cmluZyxcdFx0Y3NzOiAnc3RyaW5nJyB9LFx0XHQvLyBzdHJpbmdzXG5cdFx0XHR7IHJlZ2V4OiAvXFx7XFwkW2EtekEtWl0rIC4rXFx9L2csXHRcdFx0XHRcdFx0XHRcdGNzczogJ2NvbG9yMScgfSxcdFx0Ly8gY29tcGlsZXIgRGlyZWN0aXZlcyBhbmQgUmVnaW9uIHRhZ3Ncblx0XHRcdHsgcmVnZXg6IC9cXGJbXFxkXFwuXStcXGIvZyxcdFx0XHRcdFx0XHRcdFx0XHRjc3M6ICd2YWx1ZScgfSxcdFx0XHQvLyBudW1iZXJzIDEyMzQ1XG5cdFx0XHR7IHJlZ2V4OiAvXFwkW2EtekEtWjAtOV0rXFxiL2csXHRcdFx0XHRcdFx0XHRcdGNzczogJ3ZhbHVlJyB9LFx0XHRcdC8vIG51bWJlcnMgJEY1RDNcblx0XHRcdHsgcmVnZXg6IG5ldyBSZWdFeHAodGhpcy5nZXRLZXl3b3JkcyhrZXl3b3JkcyksICdnbWknKSxcdFx0Y3NzOiAna2V5d29yZCcgfVx0XHQvLyBrZXl3b3JkXG5cdFx0XHRdO1xuXHR9O1xuXG5cdEJydXNoLnByb3RvdHlwZVx0PSBuZXcgU3ludGF4SGlnaGxpZ2h0ZXIuSGlnaGxpZ2h0ZXIoKTtcblx0QnJ1c2guYWxpYXNlc1x0PSBbJ2RlbHBoaScsICdwYXNjYWwnLCAncGFzJ107XG5cblx0U3ludGF4SGlnaGxpZ2h0ZXIuYnJ1c2hlcy5EZWxwaGkgPSBCcnVzaDtcblxuXHQvLyBDb21tb25KU1xuXHR0eXBlb2YoZXhwb3J0cykgIT0gJ3VuZGVmaW5lZCcgPyBleHBvcnRzLkJydXNoID0gQnJ1c2ggOiBudWxsO1xufSkoKTtcbjsoZnVuY3Rpb24oKVxue1xuXHQvLyBDb21tb25KU1xuXHRTeW50YXhIaWdobGlnaHRlciA9IFN5bnRheEhpZ2hsaWdodGVyIHx8ICh0eXBlb2YgcmVxdWlyZSAhPT0gJ3VuZGVmaW5lZCc/IHJlcXVpcmUoJ3NoQ29yZScpLlN5bnRheEhpZ2hsaWdodGVyIDogbnVsbCk7XG5cblx0ZnVuY3Rpb24gQnJ1c2goKVxuXHR7XG5cdFx0dGhpcy5yZWdleExpc3QgPSBbXG5cdFx0XHR7IHJlZ2V4OiAvXlxcK1xcK1xcKyAuKiQvZ20sXHRjc3M6ICdjb2xvcjInIH0sXHQvLyBuZXcgZmlsZVxuXHRcdFx0eyByZWdleDogL15cXC1cXC1cXC0gLiokL2dtLFx0Y3NzOiAnY29sb3IyJyB9LFx0Ly8gb2xkIGZpbGVcblx0XHRcdHsgcmVnZXg6IC9eXFxzLiokL2dtLFx0XHRjc3M6ICdjb2xvcjEnIH0sXHQvLyB1bmNoYW5nZWRcblx0XHRcdHsgcmVnZXg6IC9eQEAuKkBALiokL2dtLFx0Y3NzOiAndmFyaWFibGUnIH0sXHQvLyBsb2NhdGlvblxuXHRcdFx0eyByZWdleDogL15cXCsuKiQvZ20sXHRcdGNzczogJ3N0cmluZycgfSxcdC8vIGFkZGl0aW9uc1xuXHRcdFx0eyByZWdleDogL15cXC0uKiQvZ20sXHRcdGNzczogJ2NvbG9yMycgfVx0XHQvLyBkZWxldGlvbnNcblx0XHRcdF07XG5cdH07XG5cblx0QnJ1c2gucHJvdG90eXBlXHQ9IG5ldyBTeW50YXhIaWdobGlnaHRlci5IaWdobGlnaHRlcigpO1xuXHRCcnVzaC5hbGlhc2VzXHQ9IFsnZGlmZicsICdwYXRjaCddO1xuXG5cdFN5bnRheEhpZ2hsaWdodGVyLmJydXNoZXMuRGlmZiA9IEJydXNoO1xuXG5cdC8vIENvbW1vbkpTXG5cdHR5cGVvZihleHBvcnRzKSAhPSAndW5kZWZpbmVkJyA/IGV4cG9ydHMuQnJ1c2ggPSBCcnVzaCA6IG51bGw7XG59KSgpO1xuOyhmdW5jdGlvbigpXG57XG5cdC8vIENvbW1vbkpTXG5cdFN5bnRheEhpZ2hsaWdodGVyID0gU3ludGF4SGlnaGxpZ2h0ZXIgfHwgKHR5cGVvZiByZXF1aXJlICE9PSAndW5kZWZpbmVkJz8gcmVxdWlyZSgnc2hDb3JlJykuU3ludGF4SGlnaGxpZ2h0ZXIgOiBudWxsKTtcblxuXHRmdW5jdGlvbiBCcnVzaCgpXG5cdHtcblx0XHQvLyBDb250cmlidXRlZCBieSBKZWFuLUxvdSBEdXBvbnRcblx0XHQvLyBodHRwOi8vamxkdXBvbnQuYmxvZ3Nwb3QuY29tLzIwMDkvMDYvZXJsYW5nLXN5bnRheC1oaWdobGlnaHRlci5odG1sICBcblxuXHRcdC8vIEFjY29yZGluZyB0bzogaHR0cDovL2VybGFuZy5vcmcvZG9jL3JlZmVyZW5jZV9tYW51YWwvaW50cm9kdWN0aW9uLmh0bWwjMS41XG5cdFx0dmFyIGtleXdvcmRzID0gJ2FmdGVyIGFuZCBhbmRhbHNvIGJhbmQgYmVnaW4gYm5vdCBib3IgYnNsIGJzciBieG9yICcrXG5cdFx0XHQnY2FzZSBjYXRjaCBjb25kIGRpdiBlbmQgZnVuIGlmIGxldCBub3Qgb2Ygb3Igb3JlbHNlICcrXG5cdFx0XHQncXVlcnkgcmVjZWl2ZSByZW0gdHJ5IHdoZW4geG9yJytcblx0XHRcdC8vIGFkZGl0aW9uYWxcblx0XHRcdCcgbW9kdWxlIGV4cG9ydCBpbXBvcnQgZGVmaW5lJztcblxuXHRcdHRoaXMucmVnZXhMaXN0ID0gW1xuXHRcdFx0eyByZWdleDogbmV3IFJlZ0V4cChcIltBLVpdW0EtWmEtejAtOV9dK1wiLCAnZycpLCBcdFx0XHRjc3M6ICdjb25zdGFudHMnIH0sXG5cdFx0XHR7IHJlZ2V4OiBuZXcgUmVnRXhwKFwiXFxcXCUuK1wiLCAnZ20nKSwgXHRcdFx0XHRcdFx0Y3NzOiAnY29tbWVudHMnIH0sXG5cdFx0XHR7IHJlZ2V4OiBuZXcgUmVnRXhwKFwiXFxcXD9bQS1aYS16MC05X10rXCIsICdnJyksIFx0XHRcdFx0Y3NzOiAncHJlcHJvY2Vzc29yJyB9LFxuXHRcdFx0eyByZWdleDogbmV3IFJlZ0V4cChcIlthLXowLTlfXSs6W2EtejAtOV9dK1wiLCAnZycpLCBcdFx0XHRjc3M6ICdmdW5jdGlvbnMnIH0sXG5cdFx0XHR7IHJlZ2V4OiBTeW50YXhIaWdobGlnaHRlci5yZWdleExpYi5kb3VibGVRdW90ZWRTdHJpbmcsXHRcdGNzczogJ3N0cmluZycgfSxcblx0XHRcdHsgcmVnZXg6IFN5bnRheEhpZ2hsaWdodGVyLnJlZ2V4TGliLnNpbmdsZVF1b3RlZFN0cmluZyxcdFx0Y3NzOiAnc3RyaW5nJyB9LFxuXHRcdFx0eyByZWdleDogbmV3IFJlZ0V4cCh0aGlzLmdldEtleXdvcmRzKGtleXdvcmRzKSxcdCdnbScpLFx0XHRjc3M6ICdrZXl3b3JkJyB9XG5cdFx0XHRdO1xuXHR9O1xuXG5cdEJydXNoLnByb3RvdHlwZVx0PSBuZXcgU3ludGF4SGlnaGxpZ2h0ZXIuSGlnaGxpZ2h0ZXIoKTtcblx0QnJ1c2guYWxpYXNlc1x0PSBbJ2VybCcsICdlcmxhbmcnXTtcblxuXHRTeW50YXhIaWdobGlnaHRlci5icnVzaGVzLkVybGFuZCA9IEJydXNoO1xuXG5cdC8vIENvbW1vbkpTXG5cdHR5cGVvZihleHBvcnRzKSAhPSAndW5kZWZpbmVkJyA/IGV4cG9ydHMuQnJ1c2ggPSBCcnVzaCA6IG51bGw7XG59KSgpO1xuOyhmdW5jdGlvbigpXG57XG5cdC8vIENvbW1vbkpTXG5cdFN5bnRheEhpZ2hsaWdodGVyID0gU3ludGF4SGlnaGxpZ2h0ZXIgfHwgKHR5cGVvZiByZXF1aXJlICE9PSAndW5kZWZpbmVkJz8gcmVxdWlyZSgnc2hDb3JlJykuU3ludGF4SGlnaGxpZ2h0ZXIgOiBudWxsKTtcblxuXHRmdW5jdGlvbiBCcnVzaCgpXG5cdHtcblx0XHQvLyBDb250cmlidXRlZCBieSBBbmRyZXMgQWxtaXJheVxuXHRcdC8vIGh0dHA6Ly9qcm9sbGVyLmNvbS9hYWxtaXJheS9lbnRyeS9uaWNlX3NvdXJjZV9jb2RlX3N5bnRheF9oaWdobGlnaHRlclxuXG5cdFx0dmFyIGtleXdvcmRzID1cdCdhcyBhc3NlcnQgYnJlYWsgY2FzZSBjYXRjaCBjbGFzcyBjb250aW51ZSBkZWYgZGVmYXVsdCBkbyBlbHNlIGV4dGVuZHMgZmluYWxseSAnICtcblx0XHRcdFx0XHRcdCdpZiBpbiBpbXBsZW1lbnRzIGltcG9ydCBpbnN0YW5jZW9mIGludGVyZmFjZSBuZXcgcGFja2FnZSBwcm9wZXJ0eSByZXR1cm4gc3dpdGNoICcgK1xuXHRcdFx0XHRcdFx0J3Rocm93IHRocm93cyB0cnkgd2hpbGUgcHVibGljIHByb3RlY3RlZCBwcml2YXRlIHN0YXRpYyc7XG5cdFx0dmFyIHR5cGVzICAgID0gICd2b2lkIGJvb2xlYW4gYnl0ZSBjaGFyIHNob3J0IGludCBsb25nIGZsb2F0IGRvdWJsZSc7XG5cdFx0dmFyIGNvbnN0YW50cyA9ICdudWxsJztcblx0XHR2YXIgbWV0aG9kcyAgID0gJ2FsbFByb3BlcnRpZXMgY291bnQgZ2V0IHNpemUgJytcblx0XHRcdFx0XHRcdCdjb2xsZWN0IGVhY2ggZWFjaFByb3BlcnR5IGVhY2hQcm9wZXJ0eU5hbWUgZWFjaFdpdGhJbmRleCBmaW5kIGZpbmRBbGwgJyArXG5cdFx0XHRcdFx0XHQnZmluZEluZGV4T2YgZ3JlcCBpbmplY3QgbWF4IG1pbiByZXZlcnNlRWFjaCBzb3J0ICcgK1xuXHRcdFx0XHRcdFx0J2FzSW1tdXRhYmxlIGFzU3luY2hyb25pemVkIGZsYXR0ZW4gaW50ZXJzZWN0IGpvaW4gcG9wIHJldmVyc2Ugc3ViTWFwIHRvTGlzdCAnICtcblx0XHRcdFx0XHRcdCdwYWRSaWdodCBwYWRMZWZ0IGNvbnRhaW5zIGVhY2hNYXRjaCB0b0NoYXJhY3RlciB0b0xvbmcgdG9VcmwgdG9rZW5pemUgJyArXG5cdFx0XHRcdFx0XHQnZWFjaEZpbGUgZWFjaEZpbGVSZWN1cnNlIGVhY2hCIHl0ZSBlYWNoTGluZSByZWFkQnl0ZXMgcmVhZExpbmUgZ2V0VGV4dCAnICtcblx0XHRcdFx0XHRcdCdzcGxpdEVhY2hMaW5lIHdpdGhSZWFkZXIgYXBwZW5kIGVuY29kZUJhc2U2NCBkZWNvZGVCYXNlNjQgZmlsdGVyTGluZSAnICtcblx0XHRcdFx0XHRcdCd0cmFuc2Zvcm1DaGFyIHRyYW5zZm9ybUxpbmUgd2l0aE91dHB1dFN0cmVhbSB3aXRoUHJpbnRXcml0ZXIgd2l0aFN0cmVhbSAnICtcblx0XHRcdFx0XHRcdCd3aXRoU3RyZWFtcyB3aXRoV3JpdGVyIHdpdGhXcml0ZXJBcHBlbmQgd3JpdGUgd3JpdGVMaW5lICcrXG5cdFx0XHRcdFx0XHQnZHVtcCBpbnNwZWN0IGludm9rZU1ldGhvZCBwcmludCBwcmludGxuIHN0ZXAgdGltZXMgdXB0byB1c2Ugd2FpdEZvck9yS2lsbCAnK1xuXHRcdFx0XHRcdFx0J2dldFRleHQnO1xuXG5cdFx0dGhpcy5yZWdleExpc3QgPSBbXG5cdFx0XHR7IHJlZ2V4OiBTeW50YXhIaWdobGlnaHRlci5yZWdleExpYi5zaW5nbGVMaW5lQ0NvbW1lbnRzLFx0XHRcdFx0Y3NzOiAnY29tbWVudHMnIH0sXHRcdC8vIG9uZSBsaW5lIGNvbW1lbnRzXG5cdFx0XHR7IHJlZ2V4OiBTeW50YXhIaWdobGlnaHRlci5yZWdleExpYi5tdWx0aUxpbmVDQ29tbWVudHMsXHRcdFx0XHRcdGNzczogJ2NvbW1lbnRzJyB9LFx0XHQvLyBtdWx0aWxpbmUgY29tbWVudHNcblx0XHRcdHsgcmVnZXg6IFN5bnRheEhpZ2hsaWdodGVyLnJlZ2V4TGliLmRvdWJsZVF1b3RlZFN0cmluZyxcdFx0XHRcdFx0Y3NzOiAnc3RyaW5nJyB9LFx0XHQvLyBzdHJpbmdzXG5cdFx0XHR7IHJlZ2V4OiBTeW50YXhIaWdobGlnaHRlci5yZWdleExpYi5zaW5nbGVRdW90ZWRTdHJpbmcsXHRcdFx0XHRcdGNzczogJ3N0cmluZycgfSxcdFx0Ly8gc3RyaW5nc1xuXHRcdFx0eyByZWdleDogL1wiXCJcIi4qXCJcIlwiL2csXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjc3M6ICdzdHJpbmcnIH0sXHRcdC8vIEdTdHJpbmdzXG5cdFx0XHR7IHJlZ2V4OiBuZXcgUmVnRXhwKCdcXFxcYihbXFxcXGRdKyhcXFxcLltcXFxcZF0rKT98MHhbYS1mMC05XSspXFxcXGInLCAnZ2knKSxcdGNzczogJ3ZhbHVlJyB9LFx0XHRcdC8vIG51bWJlcnNcblx0XHRcdHsgcmVnZXg6IG5ldyBSZWdFeHAodGhpcy5nZXRLZXl3b3JkcyhrZXl3b3JkcyksICdnbScpLFx0XHRcdFx0XHRjc3M6ICdrZXl3b3JkJyB9LFx0XHQvLyBnb292eSBrZXl3b3JkXG5cdFx0XHR7IHJlZ2V4OiBuZXcgUmVnRXhwKHRoaXMuZ2V0S2V5d29yZHModHlwZXMpLCAnZ20nKSxcdFx0XHRcdFx0XHRjc3M6ICdjb2xvcjEnIH0sXHRcdC8vIGdvb3Z5L2phdmEgdHlwZVxuXHRcdFx0eyByZWdleDogbmV3IFJlZ0V4cCh0aGlzLmdldEtleXdvcmRzKGNvbnN0YW50cyksICdnbScpLFx0XHRcdFx0XHRjc3M6ICdjb25zdGFudHMnIH0sXHRcdC8vIGNvbnN0YW50c1xuXHRcdFx0eyByZWdleDogbmV3IFJlZ0V4cCh0aGlzLmdldEtleXdvcmRzKG1ldGhvZHMpLCAnZ20nKSxcdFx0XHRcdFx0Y3NzOiAnZnVuY3Rpb25zJyB9XHRcdC8vIG1ldGhvZHNcblx0XHRcdF07XG5cblx0XHR0aGlzLmZvckh0bWxTY3JpcHQoU3ludGF4SGlnaGxpZ2h0ZXIucmVnZXhMaWIuYXNwU2NyaXB0VGFncyk7XG5cdH1cblxuXHRCcnVzaC5wcm90b3R5cGVcdD0gbmV3IFN5bnRheEhpZ2hsaWdodGVyLkhpZ2hsaWdodGVyKCk7XG5cdEJydXNoLmFsaWFzZXNcdD0gWydncm9vdnknXTtcblxuXHRTeW50YXhIaWdobGlnaHRlci5icnVzaGVzLkdyb292eSA9IEJydXNoO1xuXG5cdC8vIENvbW1vbkpTXG5cdHR5cGVvZihleHBvcnRzKSAhPSAndW5kZWZpbmVkJyA/IGV4cG9ydHMuQnJ1c2ggPSBCcnVzaCA6IG51bGw7XG59KSgpO1xuOyhmdW5jdGlvbigpXG57XG5cdC8vIENvbW1vbkpTXG5cdFN5bnRheEhpZ2hsaWdodGVyID0gU3ludGF4SGlnaGxpZ2h0ZXIgfHwgKHR5cGVvZiByZXF1aXJlICE9PSAndW5kZWZpbmVkJz8gcmVxdWlyZSgnc2hDb3JlJykuU3ludGF4SGlnaGxpZ2h0ZXIgOiBudWxsKTtcblxuXHRmdW5jdGlvbiBCcnVzaCgpXG5cdHtcblx0XHR2YXIga2V5d29yZHMgPVx0J2Fic3RyYWN0IGFzc2VydCBib29sZWFuIGJyZWFrIGJ5dGUgY2FzZSBjYXRjaCBjaGFyIGNsYXNzIGNvbnN0ICcgK1xuXHRcdFx0XHRcdFx0J2NvbnRpbnVlIGRlZmF1bHQgZG8gZG91YmxlIGVsc2UgZW51bSBleHRlbmRzICcgK1xuXHRcdFx0XHRcdFx0J2ZhbHNlIGZpbmFsIGZpbmFsbHkgZmxvYXQgZm9yIGdvdG8gaWYgaW1wbGVtZW50cyBpbXBvcnQgJyArXG5cdFx0XHRcdFx0XHQnaW5zdGFuY2VvZiBpbnQgaW50ZXJmYWNlIGxvbmcgbmF0aXZlIG5ldyBudWxsICcgK1xuXHRcdFx0XHRcdFx0J3BhY2thZ2UgcHJpdmF0ZSBwcm90ZWN0ZWQgcHVibGljIHJldHVybiAnICtcblx0XHRcdFx0XHRcdCdzaG9ydCBzdGF0aWMgc3RyaWN0ZnAgc3VwZXIgc3dpdGNoIHN5bmNocm9uaXplZCB0aGlzIHRocm93IHRocm93cyB0cnVlICcgK1xuXHRcdFx0XHRcdFx0J3RyYW5zaWVudCB0cnkgdm9pZCB2b2xhdGlsZSB3aGlsZSc7XG5cblx0XHR0aGlzLnJlZ2V4TGlzdCA9IFtcblx0XHRcdHsgcmVnZXg6IFN5bnRheEhpZ2hsaWdodGVyLnJlZ2V4TGliLnNpbmdsZUxpbmVDQ29tbWVudHMsXHRjc3M6ICdjb21tZW50cycgfSxcdFx0Ly8gb25lIGxpbmUgY29tbWVudHNcblx0XHRcdHsgcmVnZXg6IC9cXC9cXCooW15cXCpdW1xcc1xcU10qKT9cXCpcXC8vZ20sXHRcdFx0XHRcdFx0Y3NzOiAnY29tbWVudHMnIH0sXHQgXHQvLyBtdWx0aWxpbmUgY29tbWVudHNcblx0XHRcdHsgcmVnZXg6IC9cXC9cXCooPyFcXCpcXC8pXFwqW1xcc1xcU10qP1xcKlxcLy9nbSxcdFx0XHRcdFx0Y3NzOiAncHJlcHJvY2Vzc29yJyB9LFx0Ly8gZG9jdW1lbnRhdGlvbiBjb21tZW50c1xuXHRcdFx0eyByZWdleDogU3ludGF4SGlnaGxpZ2h0ZXIucmVnZXhMaWIuZG91YmxlUXVvdGVkU3RyaW5nLFx0XHRjc3M6ICdzdHJpbmcnIH0sXHRcdC8vIHN0cmluZ3Ncblx0XHRcdHsgcmVnZXg6IFN5bnRheEhpZ2hsaWdodGVyLnJlZ2V4TGliLnNpbmdsZVF1b3RlZFN0cmluZyxcdFx0Y3NzOiAnc3RyaW5nJyB9LFx0XHQvLyBzdHJpbmdzXG5cdFx0XHR7IHJlZ2V4OiAvXFxiKFtcXGRdKyhcXC5bXFxkXSspP3wweFthLWYwLTldKylcXGIvZ2ksXHRcdFx0XHRjc3M6ICd2YWx1ZScgfSxcdFx0XHQvLyBudW1iZXJzXG5cdFx0XHR7IHJlZ2V4OiAvKD8hXFxAaW50ZXJmYWNlXFxiKVxcQFtcXCRcXHddK1xcYi9nLFx0XHRcdFx0XHRjc3M6ICdjb2xvcjEnIH0sXHRcdC8vIGFubm90YXRpb24gQGFubm9cblx0XHRcdHsgcmVnZXg6IC9cXEBpbnRlcmZhY2VcXGIvZyxcdFx0XHRcdFx0XHRcdFx0XHRjc3M6ICdjb2xvcjInIH0sXHRcdC8vIEBpbnRlcmZhY2Uga2V5d29yZFxuXHRcdFx0eyByZWdleDogbmV3IFJlZ0V4cCh0aGlzLmdldEtleXdvcmRzKGtleXdvcmRzKSwgJ2dtJyksXHRcdGNzczogJ2tleXdvcmQnIH1cdFx0Ly8gamF2YSBrZXl3b3JkXG5cdFx0XHRdO1xuXG5cdFx0dGhpcy5mb3JIdG1sU2NyaXB0KHtcblx0XHRcdGxlZnRcdDogLygmbHQ7fDwpJVtAIT1dPy9nLCBcblx0XHRcdHJpZ2h0XHQ6IC8lKCZndDt8PikvZyBcblx0XHR9KTtcblx0fTtcblxuXHRCcnVzaC5wcm90b3R5cGVcdD0gbmV3IFN5bnRheEhpZ2hsaWdodGVyLkhpZ2hsaWdodGVyKCk7XG5cdEJydXNoLmFsaWFzZXNcdD0gWydqYXZhJ107XG5cblx0U3ludGF4SGlnaGxpZ2h0ZXIuYnJ1c2hlcy5KYXZhID0gQnJ1c2g7XG5cblx0Ly8gQ29tbW9uSlNcblx0dHlwZW9mKGV4cG9ydHMpICE9ICd1bmRlZmluZWQnID8gZXhwb3J0cy5CcnVzaCA9IEJydXNoIDogbnVsbDtcbn0pKCk7XG47KGZ1bmN0aW9uKClcbntcblx0Ly8gQ29tbW9uSlNcblx0U3ludGF4SGlnaGxpZ2h0ZXIgPSBTeW50YXhIaWdobGlnaHRlciB8fCAodHlwZW9mIHJlcXVpcmUgIT09ICd1bmRlZmluZWQnPyByZXF1aXJlKCdzaENvcmUnKS5TeW50YXhIaWdobGlnaHRlciA6IG51bGwpO1xuXG5cdGZ1bmN0aW9uIEJydXNoKClcblx0e1xuXHRcdC8vIENvbnRyaWJ1dGVkIGJ5IFBhdHJpY2sgV2Vic3RlclxuXHRcdC8vIGh0dHA6Ly9wYXRyaWNrd2Vic3Rlci5ibG9nc3BvdC5jb20vMjAwOS8wNC9qYXZhZngtYnJ1c2gtZm9yLXN5bnRheGhpZ2hsaWdodGVyLmh0bWxcblx0XHR2YXIgZGF0YXR5cGVzID1cdCdCb29sZWFuIEJ5dGUgQ2hhcmFjdGVyIERvdWJsZSBEdXJhdGlvbiAnXG5cdFx0XHRcdFx0XHQrICdGbG9hdCBJbnRlZ2VyIExvbmcgTnVtYmVyIFNob3J0IFN0cmluZyBWb2lkJ1xuXHRcdFx0XHRcdFx0O1xuXG5cdFx0dmFyIGtleXdvcmRzID0gJ2Fic3RyYWN0IGFmdGVyIGFuZCBhcyBhc3NlcnQgYXQgYmVmb3JlIGJpbmQgYm91bmQgYnJlYWsgY2F0Y2ggY2xhc3MgJ1xuXHRcdFx0XHRcdFx0KyAnY29udGludWUgZGVmIGRlbGV0ZSBlbHNlIGV4Y2x1c2l2ZSBleHRlbmRzIGZhbHNlIGZpbmFsbHkgZmlyc3QgZm9yIGZyb20gJ1xuXHRcdFx0XHRcdFx0KyAnZnVuY3Rpb24gaWYgaW1wb3J0IGluIGluZGV4b2YgaW5pdCBpbnNlcnQgaW5zdGFuY2VvZiBpbnRvIGludmVyc2UgbGFzdCAnXG5cdFx0XHRcdFx0XHQrICdsYXp5IG1peGluIG1vZCBuYXRpdmVhcnJheSBuZXcgbm90IG51bGwgb24gb3Igb3ZlcnJpZGUgcGFja2FnZSBwb3N0aW5pdCAnXG5cdFx0XHRcdFx0XHQrICdwcm90ZWN0ZWQgcHVibGljIHB1YmxpYy1pbml0IHB1YmxpYy1yZWFkIHJlcGxhY2UgcmV0dXJuIHJldmVyc2Ugc2l6ZW9mICdcblx0XHRcdFx0XHRcdCsgJ3N0ZXAgc3VwZXIgdGhlbiB0aGlzIHRocm93IHRydWUgdHJ5IHR3ZWVuIHR5cGVvZiB2YXIgd2hlcmUgd2hpbGUgd2l0aCAnXG5cdFx0XHRcdFx0XHQrICdhdHRyaWJ1dGUgbGV0IHByaXZhdGUgcmVhZG9ubHkgc3RhdGljIHRyaWdnZXInXG5cdFx0XHRcdFx0XHQ7XG5cblx0XHR0aGlzLnJlZ2V4TGlzdCA9IFtcblx0XHRcdHsgcmVnZXg6IFN5bnRheEhpZ2hsaWdodGVyLnJlZ2V4TGliLnNpbmdsZUxpbmVDQ29tbWVudHMsXHRjc3M6ICdjb21tZW50cycgfSxcblx0XHRcdHsgcmVnZXg6IFN5bnRheEhpZ2hsaWdodGVyLnJlZ2V4TGliLm11bHRpTGluZUNDb21tZW50cyxcdFx0Y3NzOiAnY29tbWVudHMnIH0sXG5cdFx0XHR7IHJlZ2V4OiBTeW50YXhIaWdobGlnaHRlci5yZWdleExpYi5zaW5nbGVRdW90ZWRTdHJpbmcsXHRcdGNzczogJ3N0cmluZycgfSxcblx0XHRcdHsgcmVnZXg6IFN5bnRheEhpZ2hsaWdodGVyLnJlZ2V4TGliLmRvdWJsZVF1b3RlZFN0cmluZyxcdFx0Y3NzOiAnc3RyaW5nJyB9LFxuXHRcdFx0eyByZWdleDogLygtP1xcLj8pKFxcYihcXGQqXFwuP1xcZCt8XFxkK1xcLj9cXGQqKShlWystXT9cXGQrKT98MHhbYS1mXFxkXSspXFxiXFwuPy9naSwgY3NzOiAnY29sb3IyJyB9LFx0Ly8gbnVtYmVyc1xuXHRcdFx0eyByZWdleDogbmV3IFJlZ0V4cCh0aGlzLmdldEtleXdvcmRzKGRhdGF0eXBlcyksICdnbScpLFx0XHRjc3M6ICd2YXJpYWJsZScgfSxcdC8vIGRhdGF0eXBlc1xuXHRcdFx0eyByZWdleDogbmV3IFJlZ0V4cCh0aGlzLmdldEtleXdvcmRzKGtleXdvcmRzKSwgJ2dtJyksXHRcdGNzczogJ2tleXdvcmQnIH1cblx0XHRdO1xuXHRcdHRoaXMuZm9ySHRtbFNjcmlwdChTeW50YXhIaWdobGlnaHRlci5yZWdleExpYi5hc3BTY3JpcHRUYWdzKTtcblx0fTtcblxuXHRCcnVzaC5wcm90b3R5cGVcdD0gbmV3IFN5bnRheEhpZ2hsaWdodGVyLkhpZ2hsaWdodGVyKCk7XG5cdEJydXNoLmFsaWFzZXNcdD0gWydqZngnLCAnamF2YWZ4J107XG5cblx0U3ludGF4SGlnaGxpZ2h0ZXIuYnJ1c2hlcy5KYXZhRlggPSBCcnVzaDtcblxuXHQvLyBDb21tb25KU1xuXHR0eXBlb2YoZXhwb3J0cykgIT0gJ3VuZGVmaW5lZCcgPyBleHBvcnRzLkJydXNoID0gQnJ1c2ggOiBudWxsO1xufSkoKTtcbjsoZnVuY3Rpb24oKVxue1xuXHQvLyBDb21tb25KU1xuXHRTeW50YXhIaWdobGlnaHRlciA9IFN5bnRheEhpZ2hsaWdodGVyIHx8ICh0eXBlb2YgcmVxdWlyZSAhPT0gJ3VuZGVmaW5lZCc/IHJlcXVpcmUoJ3NoQ29yZScpLlN5bnRheEhpZ2hsaWdodGVyIDogbnVsbCk7XG5cblx0ZnVuY3Rpb24gQnJ1c2goKVxuXHR7XG5cdFx0dmFyIGtleXdvcmRzID1cdCdicmVhayBjYXNlIGNhdGNoIGNvbnRpbnVlICcgK1xuXHRcdFx0XHRcdFx0J2RlZmF1bHQgZGVsZXRlIGRvIGVsc2UgZmFsc2UgICcgK1xuXHRcdFx0XHRcdFx0J2ZvciBmdW5jdGlvbiBpZiBpbiBpbnN0YW5jZW9mICcgK1xuXHRcdFx0XHRcdFx0J25ldyBudWxsIHJldHVybiBzdXBlciBzd2l0Y2ggJyArXG5cdFx0XHRcdFx0XHQndGhpcyB0aHJvdyB0cnVlIHRyeSB0eXBlb2YgdmFyIHdoaWxlIHdpdGgnXG5cdFx0XHRcdFx0XHQ7XG5cblx0XHR2YXIgciA9IFN5bnRheEhpZ2hsaWdodGVyLnJlZ2V4TGliO1xuXHRcdFxuXHRcdHRoaXMucmVnZXhMaXN0ID0gW1xuXHRcdFx0eyByZWdleDogci5tdWx0aUxpbmVEb3VibGVRdW90ZWRTdHJpbmcsXHRcdFx0XHRcdGNzczogJ3N0cmluZycgfSxcdFx0XHQvLyBkb3VibGUgcXVvdGVkIHN0cmluZ3Ncblx0XHRcdHsgcmVnZXg6IHIubXVsdGlMaW5lU2luZ2xlUXVvdGVkU3RyaW5nLFx0XHRcdFx0XHRjc3M6ICdzdHJpbmcnIH0sXHRcdFx0Ly8gc2luZ2xlIHF1b3RlZCBzdHJpbmdzXG5cdFx0XHR7IHJlZ2V4OiByLnNpbmdsZUxpbmVDQ29tbWVudHMsXHRcdFx0XHRcdFx0XHRjc3M6ICdjb21tZW50cycgfSxcdFx0XHQvLyBvbmUgbGluZSBjb21tZW50c1xuXHRcdFx0eyByZWdleDogci5tdWx0aUxpbmVDQ29tbWVudHMsXHRcdFx0XHRcdFx0XHRjc3M6ICdjb21tZW50cycgfSxcdFx0XHQvLyBtdWx0aWxpbmUgY29tbWVudHNcblx0XHRcdHsgcmVnZXg6IC9cXHMqIy4qL2dtLFx0XHRcdFx0XHRcdFx0XHRcdGNzczogJ3ByZXByb2Nlc3NvcicgfSxcdFx0Ly8gcHJlcHJvY2Vzc29yIHRhZ3MgbGlrZSAjcmVnaW9uIGFuZCAjZW5kcmVnaW9uXG5cdFx0XHR7IHJlZ2V4OiBuZXcgUmVnRXhwKHRoaXMuZ2V0S2V5d29yZHMoa2V5d29yZHMpLCAnZ20nKSxcdGNzczogJ2tleXdvcmQnIH1cdFx0XHQvLyBrZXl3b3Jkc1xuXHRcdFx0XTtcblx0XG5cdFx0dGhpcy5mb3JIdG1sU2NyaXB0KHIuc2NyaXB0U2NyaXB0VGFncyk7XG5cdH07XG5cblx0QnJ1c2gucHJvdG90eXBlXHQ9IG5ldyBTeW50YXhIaWdobGlnaHRlci5IaWdobGlnaHRlcigpO1xuXHRCcnVzaC5hbGlhc2VzXHQ9IFsnanMnLCAnanNjcmlwdCcsICdqYXZhc2NyaXB0J107XG5cblx0U3ludGF4SGlnaGxpZ2h0ZXIuYnJ1c2hlcy5KU2NyaXB0ID0gQnJ1c2g7XG5cblx0Ly8gQ29tbW9uSlNcblx0dHlwZW9mKGV4cG9ydHMpICE9ICd1bmRlZmluZWQnID8gZXhwb3J0cy5CcnVzaCA9IEJydXNoIDogbnVsbDtcbn0pKCk7XG47KGZ1bmN0aW9uKClcbntcblx0Ly8gQ29tbW9uSlNcblx0U3ludGF4SGlnaGxpZ2h0ZXIgPSBTeW50YXhIaWdobGlnaHRlciB8fCAodHlwZW9mIHJlcXVpcmUgIT09ICd1bmRlZmluZWQnPyByZXF1aXJlKCdzaENvcmUnKS5TeW50YXhIaWdobGlnaHRlciA6IG51bGwpO1xuXG5cdGZ1bmN0aW9uIEJydXNoKClcblx0e1xuXHRcdC8vIENvbnRyaWJ1dGVkIGJ5IERhdmlkIFNpbW1vbnMtRHVmZmluIGFuZCBNYXJ0eSBLdWJlXG5cdFxuXHRcdHZhciBmdW5jcyA9IFxuXHRcdFx0J2FicyBhY2NlcHQgYWxhcm0gYXRhbjIgYmluZCBiaW5tb2RlIGNoZGlyIGNobW9kIGNob21wIGNob3AgY2hvd24gY2hyICcgKyBcblx0XHRcdCdjaHJvb3QgY2xvc2UgY2xvc2VkaXIgY29ubmVjdCBjb3MgY3J5cHQgZGVmaW5lZCBkZWxldGUgZWFjaCBlbmRncmVudCAnICsgXG5cdFx0XHQnZW5kaG9zdGVudCBlbmRuZXRlbnQgZW5kcHJvdG9lbnQgZW5kcHdlbnQgZW5kc2VydmVudCBlb2YgZXhlYyBleGlzdHMgJyArIFxuXHRcdFx0J2V4cCBmY250bCBmaWxlbm8gZmxvY2sgZm9yayBmb3JtYXQgZm9ybWxpbmUgZ2V0YyBnZXRncmVudCBnZXRncmdpZCAnICsgXG5cdFx0XHQnZ2V0Z3JuYW0gZ2V0aG9zdGJ5YWRkciBnZXRob3N0YnluYW1lIGdldGhvc3RlbnQgZ2V0bG9naW4gZ2V0bmV0YnlhZGRyICcgKyBcblx0XHRcdCdnZXRuZXRieW5hbWUgZ2V0bmV0ZW50IGdldHBlZXJuYW1lIGdldHBncnAgZ2V0cHBpZCBnZXRwcmlvcml0eSAnICsgXG5cdFx0XHQnZ2V0cHJvdG9ieW5hbWUgZ2V0cHJvdG9ieW51bWJlciBnZXRwcm90b2VudCBnZXRwd2VudCBnZXRwd25hbSBnZXRwd3VpZCAnICsgXG5cdFx0XHQnZ2V0c2VydmJ5bmFtZSBnZXRzZXJ2Ynlwb3J0IGdldHNlcnZlbnQgZ2V0c29ja25hbWUgZ2V0c29ja29wdCBnbG9iICcgKyBcblx0XHRcdCdnbXRpbWUgZ3JlcCBoZXggaW5kZXggaW50IGlvY3RsIGpvaW4ga2V5cyBraWxsIGxjIGxjZmlyc3QgbGVuZ3RoIGxpbmsgJyArIFxuXHRcdFx0J2xpc3RlbiBsb2NhbHRpbWUgbG9jayBsb2cgbHN0YXQgbWFwIG1rZGlyIG1zZ2N0bCBtc2dnZXQgbXNncmN2IG1zZ3NuZCAnICsgXG5cdFx0XHQnb2N0IG9wZW4gb3BlbmRpciBvcmQgcGFjayBwaXBlIHBvcCBwb3MgcHJpbnQgcHJpbnRmIHByb3RvdHlwZSBwdXNoICcgKyBcblx0XHRcdCdxdW90ZW1ldGEgcmFuZCByZWFkIHJlYWRkaXIgcmVhZGxpbmUgcmVhZGxpbmsgcmVhZHBpcGUgcmVjdiByZW5hbWUgJyArIFxuXHRcdFx0J3Jlc2V0IHJldmVyc2UgcmV3aW5kZGlyIHJpbmRleCBybWRpciBzY2FsYXIgc2VlayBzZWVrZGlyIHNlbGVjdCBzZW1jdGwgJyArIFxuXHRcdFx0J3NlbWdldCBzZW1vcCBzZW5kIHNldGdyZW50IHNldGhvc3RlbnQgc2V0bmV0ZW50IHNldHBncnAgc2V0cHJpb3JpdHkgJyArIFxuXHRcdFx0J3NldHByb3RvZW50IHNldHB3ZW50IHNldHNlcnZlbnQgc2V0c29ja29wdCBzaGlmdCBzaG1jdGwgc2htZ2V0IHNobXJlYWQgJyArIFxuXHRcdFx0J3NobXdyaXRlIHNodXRkb3duIHNpbiBzbGVlcCBzb2NrZXQgc29ja2V0cGFpciBzb3J0IHNwbGljZSBzcGxpdCBzcHJpbnRmICcgKyBcblx0XHRcdCdzcXJ0IHNyYW5kIHN0YXQgc3R1ZHkgc3Vic3RyIHN5bWxpbmsgc3lzY2FsbCBzeXNvcGVuIHN5c3JlYWQgc3lzc2VlayAnICsgXG5cdFx0XHQnc3lzdGVtIHN5c3dyaXRlIHRlbGwgdGVsbGRpciB0aW1lIHRpbWVzIHRyIHRydW5jYXRlIHVjIHVjZmlyc3QgdW1hc2sgJyArIFxuXHRcdFx0J3VuZGVmIHVubGluayB1bnBhY2sgdW5zaGlmdCB1dGltZSB2YWx1ZXMgdmVjIHdhaXQgd2FpdHBpZCB3YXJuIHdyaXRlICcgK1xuXHRcdFx0Ly8gZmVhdHVyZVxuXHRcdFx0J3NheSc7XG4gICAgXG5cdFx0dmFyIGtleXdvcmRzID0gIFxuXHRcdFx0J2JsZXNzIGNhbGxlciBjb250aW51ZSBkYm1jbG9zZSBkYm1vcGVuIGRpZSBkbyBkdW1wIGVsc2UgZWxzaWYgZXZhbCBleGl0ICcgK1xuXHRcdFx0J2ZvciBmb3JlYWNoIGdvdG8gaWYgaW1wb3J0IGxhc3QgbG9jYWwgbXkgbmV4dCBubyBvdXIgcGFja2FnZSByZWRvIHJlZiAnICsgXG5cdFx0XHQncmVxdWlyZSByZXR1cm4gc3ViIHRpZSB0aWVkIHVubGVzcyB1bnRpZSB1bnRpbCB1c2Ugd2FudGFycmF5IHdoaWxlICcgK1xuXHRcdFx0Ly8gZmVhdHVyZVxuXHRcdFx0J2dpdmVuIHdoZW4gZGVmYXVsdCAnICtcblx0XHRcdC8vIFRyeTo6VGlueVxuXHRcdFx0J3RyeSBjYXRjaCBmaW5hbGx5ICcgK1xuXHRcdFx0Ly8gTW9vc2Vcblx0XHRcdCdoYXMgZXh0ZW5kcyB3aXRoIGJlZm9yZSBhZnRlciBhcm91bmQgb3ZlcnJpZGUgYXVnbWVudCc7XG4gICAgXG5cdFx0dGhpcy5yZWdleExpc3QgPSBbXG5cdFx0XHR7IHJlZ2V4OiAvKDw8fCZsdDsmbHQ7KSgoXFx3Kyl8KFsnXCJdKSguKz8pXFw0KVtcXHNcXFNdKz9cXG5cXDNcXDVcXG4vZyxcdGNzczogJ3N0cmluZycgfSxcdC8vIGhlcmUgZG9jIChtYXliZSBodG1sIGVuY29kZWQpXG5cdFx0XHR7IHJlZ2V4OiAvIy4qJC9nbSxcdFx0XHRcdFx0XHRcdFx0XHRcdGNzczogJ2NvbW1lbnRzJyB9LFxuXHRcdFx0eyByZWdleDogL14jIS4qXFxuL2csXHRcdFx0XHRcdFx0XHRcdFx0Y3NzOiAncHJlcHJvY2Vzc29yJyB9LFx0Ly8gc2hlYmFuZ1xuXHRcdFx0eyByZWdleDogLy0/XFx3Kyg/PVxccyo9KD58Jmd0OykpL2csXHRjc3M6ICdzdHJpbmcnIH0sIC8vIGZhdCBjb21tYVxuXG5cdFx0XHQvLyBpcyB0aGlzIHRvbyBtdWNoP1xuXHRcdFx0eyByZWdleDogL1xcYnFbcXd4cl0/XFwoW1xcc1xcU10qP1xcKS9nLFx0Y3NzOiAnc3RyaW5nJyB9LCAvLyBxdW90ZS1saWtlIG9wZXJhdG9ycyAoKVxuXHRcdFx0eyByZWdleDogL1xcYnFbcXd4cl0/XFx7W1xcc1xcU10qP1xcfS9nLFx0Y3NzOiAnc3RyaW5nJyB9LCAvLyBxdW90ZS1saWtlIG9wZXJhdG9ycyB7fVxuXHRcdFx0eyByZWdleDogL1xcYnFbcXd4cl0/XFxbW1xcc1xcU10qP1xcXS9nLFx0Y3NzOiAnc3RyaW5nJyB9LCAvLyBxdW90ZS1saWtlIG9wZXJhdG9ycyBbXVxuXHRcdFx0eyByZWdleDogL1xcYnFbcXd4cl0/KDx8Jmx0OylbXFxzXFxTXSo/KD58Jmd0OykvZyxcdGNzczogJ3N0cmluZycgfSwgLy8gcXVvdGUtbGlrZSBvcGVyYXRvcnMgPD5cblx0XHRcdHsgcmVnZXg6IC9cXGJxW3F3eHJdPyhbXlxcdyh7PFtdKVtcXHNcXFNdKj9cXDEvZyxcdGNzczogJ3N0cmluZycgfSwgLy8gcXVvdGUtbGlrZSBvcGVyYXRvcnMgbm9uLXBhaXJlZFxuXG5cdFx0XHR7IHJlZ2V4OiBTeW50YXhIaWdobGlnaHRlci5yZWdleExpYi5kb3VibGVRdW90ZWRTdHJpbmcsXHRjc3M6ICdzdHJpbmcnIH0sXG5cdFx0XHR7IHJlZ2V4OiBTeW50YXhIaWdobGlnaHRlci5yZWdleExpYi5zaW5nbGVRdW90ZWRTdHJpbmcsXHRjc3M6ICdzdHJpbmcnIH0sXG5cdFx0XHQvLyBjdXJyZW50bHkgaWdub3Jpbmcgc2luZ2xlIHF1b3RlIHBhY2thZ2Ugc2VwYXJhdG9yIGFuZCB1dGY4IG5hbWVzXG5cdFx0XHR7IHJlZ2V4OiAvKD86JmFtcDt8WyRAJSpdfFxcJCMpW2EtekEtWl9dKFxcdyt8OjopKi9nLCAgIFx0XHRjc3M6ICd2YXJpYWJsZScgfSxcblx0XHRcdHsgcmVnZXg6IC9cXGJfXyg/OkVORHxEQVRBKV9fXFxiW1xcc1xcU10qJC9nLFx0XHRcdFx0Y3NzOiAnY29tbWVudHMnIH0sXG5cdFx0XHR7IHJlZ2V4OiAvKF58XFxuKT1cXHdbXFxzXFxTXSo/KFxcbj1jdXRcXHMqXFxufCQpL2csXHRcdFx0XHRjc3M6ICdjb21tZW50cycgfSxcdFx0Ly8gcG9kXG5cdFx0XHR7IHJlZ2V4OiBuZXcgUmVnRXhwKHRoaXMuZ2V0S2V5d29yZHMoZnVuY3MpLCAnZ20nKSxcdFx0Y3NzOiAnZnVuY3Rpb25zJyB9LFxuXHRcdFx0eyByZWdleDogbmV3IFJlZ0V4cCh0aGlzLmdldEtleXdvcmRzKGtleXdvcmRzKSwgJ2dtJyksXHRjc3M6ICdrZXl3b3JkJyB9XG5cdFx0XTtcblxuXHRcdHRoaXMuZm9ySHRtbFNjcmlwdChTeW50YXhIaWdobGlnaHRlci5yZWdleExpYi5waHBTY3JpcHRUYWdzKTtcblx0fVxuXG5cdEJydXNoLnByb3RvdHlwZVx0PSBuZXcgU3ludGF4SGlnaGxpZ2h0ZXIuSGlnaGxpZ2h0ZXIoKTtcblx0QnJ1c2guYWxpYXNlc1x0XHQ9IFsncGVybCcsICdQZXJsJywgJ3BsJ107XG5cblx0U3ludGF4SGlnaGxpZ2h0ZXIuYnJ1c2hlcy5QZXJsID0gQnJ1c2g7XG5cblx0Ly8gQ29tbW9uSlNcblx0dHlwZW9mKGV4cG9ydHMpICE9ICd1bmRlZmluZWQnID8gZXhwb3J0cy5CcnVzaCA9IEJydXNoIDogbnVsbDtcbn0pKCk7XG47KGZ1bmN0aW9uKClcbntcblx0Ly8gQ29tbW9uSlNcblx0U3ludGF4SGlnaGxpZ2h0ZXIgPSBTeW50YXhIaWdobGlnaHRlciB8fCAodHlwZW9mIHJlcXVpcmUgIT09ICd1bmRlZmluZWQnPyByZXF1aXJlKCdzaENvcmUnKS5TeW50YXhIaWdobGlnaHRlciA6IG51bGwpO1xuXG5cdGZ1bmN0aW9uIEJydXNoKClcblx0e1xuXHRcdHZhciBmdW5jc1x0PVx0J2FicyBhY29zIGFjb3NoIGFkZGNzbGFzaGVzIGFkZHNsYXNoZXMgJyArXG5cdFx0XHRcdFx0XHQnYXJyYXlfY2hhbmdlX2tleV9jYXNlIGFycmF5X2NodW5rIGFycmF5X2NvbWJpbmUgYXJyYXlfY291bnRfdmFsdWVzIGFycmF5X2RpZmYgJytcblx0XHRcdFx0XHRcdCdhcnJheV9kaWZmX2Fzc29jIGFycmF5X2RpZmZfa2V5IGFycmF5X2RpZmZfdWFzc29jIGFycmF5X2RpZmZfdWtleSBhcnJheV9maWxsICcrXG5cdFx0XHRcdFx0XHQnYXJyYXlfZmlsdGVyIGFycmF5X2ZsaXAgYXJyYXlfaW50ZXJzZWN0IGFycmF5X2ludGVyc2VjdF9hc3NvYyBhcnJheV9pbnRlcnNlY3Rfa2V5ICcrXG5cdFx0XHRcdFx0XHQnYXJyYXlfaW50ZXJzZWN0X3Vhc3NvYyBhcnJheV9pbnRlcnNlY3RfdWtleSBhcnJheV9rZXlfZXhpc3RzIGFycmF5X2tleXMgYXJyYXlfbWFwICcrXG5cdFx0XHRcdFx0XHQnYXJyYXlfbWVyZ2UgYXJyYXlfbWVyZ2VfcmVjdXJzaXZlIGFycmF5X211bHRpc29ydCBhcnJheV9wYWQgYXJyYXlfcG9wIGFycmF5X3Byb2R1Y3QgJytcblx0XHRcdFx0XHRcdCdhcnJheV9wdXNoIGFycmF5X3JhbmQgYXJyYXlfcmVkdWNlIGFycmF5X3JldmVyc2UgYXJyYXlfc2VhcmNoIGFycmF5X3NoaWZ0ICcrXG5cdFx0XHRcdFx0XHQnYXJyYXlfc2xpY2UgYXJyYXlfc3BsaWNlIGFycmF5X3N1bSBhcnJheV91ZGlmZiBhcnJheV91ZGlmZl9hc3NvYyAnK1xuXHRcdFx0XHRcdFx0J2FycmF5X3VkaWZmX3Vhc3NvYyBhcnJheV91aW50ZXJzZWN0IGFycmF5X3VpbnRlcnNlY3RfYXNzb2MgJytcblx0XHRcdFx0XHRcdCdhcnJheV91aW50ZXJzZWN0X3Vhc3NvYyBhcnJheV91bmlxdWUgYXJyYXlfdW5zaGlmdCBhcnJheV92YWx1ZXMgYXJyYXlfd2FsayAnK1xuXHRcdFx0XHRcdFx0J2FycmF5X3dhbGtfcmVjdXJzaXZlIGF0YW4gYXRhbjIgYXRhbmggYmFzZTY0X2RlY29kZSBiYXNlNjRfZW5jb2RlIGJhc2VfY29udmVydCAnK1xuXHRcdFx0XHRcdFx0J2Jhc2VuYW1lIGJjYWRkIGJjY29tcCBiY2RpdiBiY21vZCBiY211bCBiaW5kZWMgYmluZHRleHRkb21haW4gYnpjbG9zZSBiemNvbXByZXNzICcrXG5cdFx0XHRcdFx0XHQnYnpkZWNvbXByZXNzIGJ6ZXJybm8gYnplcnJvciBiemVycnN0ciBiemZsdXNoIGJ6b3BlbiBienJlYWQgYnp3cml0ZSBjZWlsIGNoZGlyICcrXG5cdFx0XHRcdFx0XHQnY2hlY2tkYXRlIGNoZWNrZG5zcnIgY2hncnAgY2htb2QgY2hvcCBjaG93biBjaHIgY2hyb290IGNodW5rX3NwbGl0IGNsYXNzX2V4aXN0cyAnK1xuXHRcdFx0XHRcdFx0J2Nsb3NlZGlyIGNsb3NlbG9nIGNvcHkgY29zIGNvc2ggY291bnQgY291bnRfY2hhcnMgZGF0ZSBkZWNiaW4gZGVjaGV4IGRlY29jdCAnK1xuXHRcdFx0XHRcdFx0J2RlZzJyYWQgZGVsZXRlIGViY2RpYzJhc2NpaSBlY2hvIGVtcHR5IGVuZCBlcmVnIGVyZWdfcmVwbGFjZSBlcmVnaSBlcmVnaV9yZXBsYWNlIGVycm9yX2xvZyAnK1xuXHRcdFx0XHRcdFx0J2Vycm9yX3JlcG9ydGluZyBlc2NhcGVzaGVsbGFyZyBlc2NhcGVzaGVsbGNtZCBldmFsIGV4ZWMgZXhpdCBleHAgZXhwbG9kZSBleHRlbnNpb25fbG9hZGVkICcrXG5cdFx0XHRcdFx0XHQnZmVvZiBmZmx1c2ggZmdldGMgZmdldGNzdiBmZ2V0cyBmZ2V0c3MgZmlsZV9leGlzdHMgZmlsZV9nZXRfY29udGVudHMgZmlsZV9wdXRfY29udGVudHMgJytcblx0XHRcdFx0XHRcdCdmaWxlYXRpbWUgZmlsZWN0aW1lIGZpbGVncm91cCBmaWxlaW5vZGUgZmlsZW10aW1lIGZpbGVvd25lciBmaWxlcGVybXMgZmlsZXNpemUgZmlsZXR5cGUgJytcblx0XHRcdFx0XHRcdCdmbG9hdHZhbCBmbG9jayBmbG9vciBmbHVzaCBmbW9kIGZubWF0Y2ggZm9wZW4gZnBhc3N0aHJ1IGZwcmludGYgZnB1dGNzdiBmcHV0cyBmcmVhZCBmc2NhbmYgJytcblx0XHRcdFx0XHRcdCdmc2VlayBmc29ja29wZW4gZnN0YXQgZnRlbGwgZnRvayBnZXRhbGxoZWFkZXJzIGdldGN3ZCBnZXRkYXRlIGdldGVudiBnZXRob3N0YnlhZGRyIGdldGhvc3RieW5hbWUgJytcblx0XHRcdFx0XHRcdCdnZXRob3N0YnluYW1lbCBnZXRpbWFnZXNpemUgZ2V0bGFzdG1vZCBnZXRteHJyIGdldG15Z2lkIGdldG15aW5vZGUgZ2V0bXlwaWQgZ2V0bXl1aWQgZ2V0b3B0ICcrXG5cdFx0XHRcdFx0XHQnZ2V0cHJvdG9ieW5hbWUgZ2V0cHJvdG9ieW51bWJlciBnZXRyYW5kbWF4IGdldHJ1c2FnZSBnZXRzZXJ2YnluYW1lIGdldHNlcnZieXBvcnQgZ2V0dGV4dCAnK1xuXHRcdFx0XHRcdFx0J2dldHRpbWVvZmRheSBnZXR0eXBlIGdsb2IgZ21kYXRlIGdtbWt0aW1lIGluaV9hbHRlciBpbmlfZ2V0IGluaV9nZXRfYWxsIGluaV9yZXN0b3JlIGluaV9zZXQgJytcblx0XHRcdFx0XHRcdCdpbnRlcmZhY2VfZXhpc3RzIGludHZhbCBpcDJsb25nIGlzX2EgaXNfYXJyYXkgaXNfYm9vbCBpc19jYWxsYWJsZSBpc19kaXIgaXNfZG91YmxlICcrXG5cdFx0XHRcdFx0XHQnaXNfZXhlY3V0YWJsZSBpc19maWxlIGlzX2Zpbml0ZSBpc19mbG9hdCBpc19pbmZpbml0ZSBpc19pbnQgaXNfaW50ZWdlciBpc19saW5rIGlzX2xvbmcgJytcblx0XHRcdFx0XHRcdCdpc19uYW4gaXNfbnVsbCBpc19udW1lcmljIGlzX29iamVjdCBpc19yZWFkYWJsZSBpc19yZWFsIGlzX3Jlc291cmNlIGlzX3NjYWxhciBpc19zb2FwX2ZhdWx0ICcrXG5cdFx0XHRcdFx0XHQnaXNfc3RyaW5nIGlzX3N1YmNsYXNzX29mIGlzX3VwbG9hZGVkX2ZpbGUgaXNfd3JpdGFibGUgaXNfd3JpdGVhYmxlIG1rZGlyIG1rdGltZSBubDJiciAnK1xuXHRcdFx0XHRcdFx0J3BhcnNlX2luaV9maWxlIHBhcnNlX3N0ciBwYXJzZV91cmwgcGFzc3RocnUgcGF0aGluZm8gcHJpbnQgcmVhZGxpbmsgcmVhbHBhdGggcmV3aW5kIHJld2luZGRpciBybWRpciAnK1xuXHRcdFx0XHRcdFx0J3JvdW5kIHN0cl9pcmVwbGFjZSBzdHJfcGFkIHN0cl9yZXBlYXQgc3RyX3JlcGxhY2Ugc3RyX3JvdDEzIHN0cl9zaHVmZmxlIHN0cl9zcGxpdCAnK1xuXHRcdFx0XHRcdFx0J3N0cl93b3JkX2NvdW50IHN0cmNhc2VjbXAgc3RyY2hyIHN0cmNtcCBzdHJjb2xsIHN0cmNzcG4gc3RyZnRpbWUgc3RyaXBfdGFncyBzdHJpcGNzbGFzaGVzICcrXG5cdFx0XHRcdFx0XHQnc3RyaXBvcyBzdHJpcHNsYXNoZXMgc3RyaXN0ciBzdHJsZW4gc3RybmF0Y2FzZWNtcCBzdHJuYXRjbXAgc3RybmNhc2VjbXAgc3RybmNtcCBzdHJwYnJrICcrXG5cdFx0XHRcdFx0XHQnc3RycG9zIHN0cnB0aW1lIHN0cnJjaHIgc3RycmV2IHN0cnJpcG9zIHN0cnJwb3Mgc3Ryc3BuIHN0cnN0ciBzdHJ0b2sgc3RydG9sb3dlciBzdHJ0b3RpbWUgJytcblx0XHRcdFx0XHRcdCdzdHJ0b3VwcGVyIHN0cnRyIHN0cnZhbCBzdWJzdHIgc3Vic3RyX2NvbXBhcmUnO1xuXG5cdFx0dmFyIGtleXdvcmRzID1cdCdhYnN0cmFjdCBhbmQgYXJyYXkgYXMgYnJlYWsgY2FzZSBjYXRjaCBjZnVuY3Rpb24gY2xhc3MgY2xvbmUgY29uc3QgY29udGludWUgZGVjbGFyZSBkZWZhdWx0IGRpZSBkbyAnICtcblx0XHRcdFx0XHRcdCdlbHNlIGVsc2VpZiBlbmRkZWNsYXJlIGVuZGZvciBlbmRmb3JlYWNoIGVuZGlmIGVuZHN3aXRjaCBlbmR3aGlsZSBleHRlbmRzIGZpbmFsIGZvciBmb3JlYWNoICcgK1xuXHRcdFx0XHRcdFx0J2Z1bmN0aW9uIGdsb2JhbCBnb3RvIGlmIGltcGxlbWVudHMgaW5jbHVkZSBpbmNsdWRlX29uY2UgaW50ZXJmYWNlIGluc3RhbmNlb2YgaW5zdGVhZG9mIG5hbWVzcGFjZSBuZXcgJyArXG5cdFx0XHRcdFx0XHQnb2xkX2Z1bmN0aW9uIG9yIHByaXZhdGUgcHJvdGVjdGVkIHB1YmxpYyByZXR1cm4gcmVxdWlyZSByZXF1aXJlX29uY2Ugc3RhdGljIHN3aXRjaCAnICtcblx0XHRcdFx0XHRcdCd0cmFpdCB0aHJvdyB0cnkgdXNlIHZhciB3aGlsZSB4b3IgJztcblx0XHRcblx0XHR2YXIgY29uc3RhbnRzXHQ9ICdfX0ZJTEVfXyBfX0xJTkVfXyBfX01FVEhPRF9fIF9fRlVOQ1RJT05fXyBfX0NMQVNTX18nO1xuXG5cdFx0dGhpcy5yZWdleExpc3QgPSBbXG5cdFx0XHR7IHJlZ2V4OiBTeW50YXhIaWdobGlnaHRlci5yZWdleExpYi5zaW5nbGVMaW5lQ0NvbW1lbnRzLFx0Y3NzOiAnY29tbWVudHMnIH0sXHRcdFx0Ly8gb25lIGxpbmUgY29tbWVudHNcblx0XHRcdHsgcmVnZXg6IFN5bnRheEhpZ2hsaWdodGVyLnJlZ2V4TGliLm11bHRpTGluZUNDb21tZW50cyxcdFx0Y3NzOiAnY29tbWVudHMnIH0sXHRcdFx0Ly8gbXVsdGlsaW5lIGNvbW1lbnRzXG5cdFx0XHR7IHJlZ2V4OiBTeW50YXhIaWdobGlnaHRlci5yZWdleExpYi5kb3VibGVRdW90ZWRTdHJpbmcsXHRcdGNzczogJ3N0cmluZycgfSxcdFx0XHQvLyBkb3VibGUgcXVvdGVkIHN0cmluZ3Ncblx0XHRcdHsgcmVnZXg6IFN5bnRheEhpZ2hsaWdodGVyLnJlZ2V4TGliLnNpbmdsZVF1b3RlZFN0cmluZyxcdFx0Y3NzOiAnc3RyaW5nJyB9LFx0XHRcdC8vIHNpbmdsZSBxdW90ZWQgc3RyaW5nc1xuXHRcdFx0eyByZWdleDogL1xcJFxcdysvZyxcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y3NzOiAndmFyaWFibGUnIH0sXHRcdFx0Ly8gdmFyaWFibGVzXG5cdFx0XHR7IHJlZ2V4OiBuZXcgUmVnRXhwKHRoaXMuZ2V0S2V5d29yZHMoZnVuY3MpLCAnZ21pJyksXHRcdGNzczogJ2Z1bmN0aW9ucycgfSxcdFx0XHQvLyBjb21tb24gZnVuY3Rpb25zXG5cdFx0XHR7IHJlZ2V4OiBuZXcgUmVnRXhwKHRoaXMuZ2V0S2V5d29yZHMoY29uc3RhbnRzKSwgJ2dtaScpLFx0Y3NzOiAnY29uc3RhbnRzJyB9LFx0XHRcdC8vIGNvbnN0YW50c1xuXHRcdFx0eyByZWdleDogbmV3IFJlZ0V4cCh0aGlzLmdldEtleXdvcmRzKGtleXdvcmRzKSwgJ2dtJyksXHRcdGNzczogJ2tleXdvcmQnIH1cdFx0XHQvLyBrZXl3b3JkXG5cdFx0XHRdO1xuXG5cdFx0dGhpcy5mb3JIdG1sU2NyaXB0KFN5bnRheEhpZ2hsaWdodGVyLnJlZ2V4TGliLnBocFNjcmlwdFRhZ3MpO1xuXHR9O1xuXG5cdEJydXNoLnByb3RvdHlwZVx0PSBuZXcgU3ludGF4SGlnaGxpZ2h0ZXIuSGlnaGxpZ2h0ZXIoKTtcblx0QnJ1c2guYWxpYXNlc1x0PSBbJ3BocCddO1xuXG5cdFN5bnRheEhpZ2hsaWdodGVyLmJydXNoZXMuUGhwID0gQnJ1c2g7XG5cblx0Ly8gQ29tbW9uSlNcblx0dHlwZW9mKGV4cG9ydHMpICE9ICd1bmRlZmluZWQnID8gZXhwb3J0cy5CcnVzaCA9IEJydXNoIDogbnVsbDtcbn0pKCk7XG47KGZ1bmN0aW9uKClcbntcblx0Ly8gQ29tbW9uSlNcblx0U3ludGF4SGlnaGxpZ2h0ZXIgPSBTeW50YXhIaWdobGlnaHRlciB8fCAodHlwZW9mIHJlcXVpcmUgIT09ICd1bmRlZmluZWQnPyByZXF1aXJlKCdzaENvcmUnKS5TeW50YXhIaWdobGlnaHRlciA6IG51bGwpO1xuXG5cdGZ1bmN0aW9uIEJydXNoKClcblx0e1xuXHR9O1xuXG5cdEJydXNoLnByb3RvdHlwZVx0PSBuZXcgU3ludGF4SGlnaGxpZ2h0ZXIuSGlnaGxpZ2h0ZXIoKTtcblx0QnJ1c2guYWxpYXNlc1x0PSBbJ3RleHQnLCAncGxhaW4nXTtcblxuXHRTeW50YXhIaWdobGlnaHRlci5icnVzaGVzLlBsYWluID0gQnJ1c2g7XG5cblx0Ly8gQ29tbW9uSlNcblx0dHlwZW9mKGV4cG9ydHMpICE9ICd1bmRlZmluZWQnID8gZXhwb3J0cy5CcnVzaCA9IEJydXNoIDogbnVsbDtcbn0pKCk7XG47KGZ1bmN0aW9uKClcbntcblx0Ly8gQ29tbW9uSlNcblx0U3ludGF4SGlnaGxpZ2h0ZXIgPSBTeW50YXhIaWdobGlnaHRlciB8fCAodHlwZW9mIHJlcXVpcmUgIT09ICd1bmRlZmluZWQnPyByZXF1aXJlKCdzaENvcmUnKS5TeW50YXhIaWdobGlnaHRlciA6IG51bGwpO1xuXG5cdGZ1bmN0aW9uIEJydXNoKClcblx0e1xuXHRcdC8vIENvbnRyaWJ1dGVkIGJ5IEpvZWwgJ0pheWt1bCcgQmVubmV0dCwgaHR0cDovL1Bvc2hDb2RlLm9yZyB8IGh0dHA6Ly9IdWRkbGVkTWFzc2VzLm9yZ1xuXHRcdHZhciBrZXl3b3JkcyA9XHQnd2hpbGUgdmFsaWRhdGVzZXQgdmFsaWRhdGVyYW5nZSB2YWxpZGF0ZXBhdHRlcm4gdmFsaWRhdGVsZW5ndGggdmFsaWRhdGVjb3VudCAnICtcblx0XHRcdFx0XHRcdCd1bnRpbCB0cmFwIHN3aXRjaCByZXR1cm4gcmVmIHByb2Nlc3MgcGFyYW0gcGFyYW1ldGVyIGluIGlmIGdsb2JhbDogJytcblx0XHRcdFx0XHRcdCdmdW5jdGlvbiBmb3JlYWNoIGZvciBmaW5hbGx5IGZpbHRlciBlbmQgZWxzZWlmIGVsc2UgZHluYW1pY3BhcmFtIGRvIGRlZmF1bHQgJyArXG5cdFx0XHRcdFx0XHQnY29udGludWUgY21kbGV0YmluZGluZyBicmVhayBiZWdpbiBhbGlhcyBcXFxcPyAlICNzY3JpcHQgI3ByaXZhdGUgI2xvY2FsICNnbG9iYWwgJytcblx0XHRcdFx0XHRcdCdtYW5kYXRvcnkgcGFyYW1ldGVyc2V0bmFtZSBwb3NpdGlvbiB2YWx1ZWZyb21waXBlbGluZSAnICtcblx0XHRcdFx0XHRcdCd2YWx1ZWZyb21waXBlbGluZWJ5cHJvcGVydHluYW1lIHZhbHVlZnJvbXJlbWFpbmluZ2FyZ3VtZW50cyBoZWxwbWVzc2FnZSAnO1xuXG5cdFx0dmFyIG9wZXJhdG9ycyA9XHQnIGFuZCBhcyBiYW5kIGJub3QgYm9yIGJ4b3IgY2FzZXNlbnNpdGl2ZSBjY29udGFpbnMgY2VxIGNnZSBjZ3QgY2xlICcgK1xuXHRcdFx0XHRcdFx0J2NsaWtlIGNsdCBjbWF0Y2ggY25lIGNub3Rjb250YWlucyBjbm90bGlrZSBjbm90bWF0Y2ggY29udGFpbnMgJyArXG5cdFx0XHRcdFx0XHQnY3JlcGxhY2UgZXEgZXhhY3QgZiBmaWxlIGdlIGd0IGljb250YWlucyBpZXEgaWdlIGlndCBpbGUgaWxpa2UgaWx0ICcgK1xuXHRcdFx0XHRcdFx0J2ltYXRjaCBpbmUgaW5vdGNvbnRhaW5zIGlub3RsaWtlIGlub3RtYXRjaCBpcmVwbGFjZSBpcyBpc25vdCBsZSBsaWtlICcgK1xuXHRcdFx0XHRcdFx0J2x0IG1hdGNoIG5lIG5vdCBub3Rjb250YWlucyBub3RsaWtlIG5vdG1hdGNoIG9yIHJlZ2V4IHJlcGxhY2Ugd2lsZGNhcmQnO1xuXHRcdFx0XHRcdFx0XG5cdFx0dmFyIHZlcmJzID1cdFx0J3dyaXRlIHdoZXJlIHdhaXQgdXNlIHVwZGF0ZSB1bnJlZ2lzdGVyIHVuZG8gdHJhY2UgdGVzdCB0ZWUgdGFrZSBzdXNwZW5kICcgK1xuXHRcdFx0XHRcdFx0J3N0b3Agc3RhcnQgc3BsaXQgc29ydCBza2lwIHNob3cgc2V0IHNlbmQgc2VsZWN0IHNjcm9sbCByZXN1bWUgcmVzdG9yZSAnICtcblx0XHRcdFx0XHRcdCdyZXN0YXJ0IHJlc29sdmUgcmVzaXplIHJlc2V0IHJlbmFtZSByZW1vdmUgcmVnaXN0ZXIgcmVjZWl2ZSByZWFkIHB1c2ggJyArXG5cdFx0XHRcdFx0XHQncG9wIHBpbmcgb3V0IG5ldyBtb3ZlIG1lYXN1cmUgbGltaXQgam9pbiBpbnZva2UgaW1wb3J0IGdyb3VwIGdldCBmb3JtYXQgJyArXG5cdFx0XHRcdFx0XHQnZm9yZWFjaCBleHBvcnQgZXhwYW5kIGV4aXQgZW50ZXIgZW5hYmxlIGRpc2Nvbm5lY3QgZGlzYWJsZSBkZWJ1ZyBjeG5ldyAnICtcblx0XHRcdFx0XHRcdCdjb3B5IGNvbnZlcnR0byBjb252ZXJ0ZnJvbSBjb252ZXJ0IGNvbm5lY3QgY29tcGxldGUgY29tcGFyZSBjbGVhciAnICtcblx0XHRcdFx0XHRcdCdjaGVja3BvaW50IGFnZ3JlZ2F0ZSBhZGQnO1xuXG5cdFx0Ly8gSSBjYW4ndCBmaW5kIGEgd2F5IHRvIG1hdGNoIHRoZSBjb21tZW50IGJhc2VkIGhlbHAgaW4gbXVsdGktbGluZSBjb21tZW50cywgYmVjYXVzZSBTSCB3b24ndCBoaWdobGlnaHQgaW4gaGlnaGxpZ2h0cywgYW5kIGphdmFzY3JpcHQgZG9lc24ndCBzdXBwb3J0IGxvb2tiZWhpbmRcblx0XHR2YXIgY29tbWVudGhlbHAgPSAnIGNvbXBvbmVudCBkZXNjcmlwdGlvbiBleGFtcGxlIGV4dGVybmFsaGVscCBmb3J3YXJkaGVscGNhdGVnb3J5IGZvcndhcmRoZWxwdGFyZ2V0bmFtZSBmb3J3YXJkaGVscHRhcmdldG5hbWUgZnVuY3Rpb25hbGl0eSBpbnB1dHMgbGluayBub3RlcyBvdXRwdXRzIHBhcmFtZXRlciByZW1vdGVoZWxwcnVuc3BhY2Ugcm9sZSBzeW5vcHNpcyc7XG5cblx0XHR0aGlzLnJlZ2V4TGlzdCA9IFtcblx0XHRcdHsgcmVnZXg6IG5ldyBSZWdFeHAoJ15cXFxccyojWyNcXFxcc10qXFxcXC4oJyt0aGlzLmdldEtleXdvcmRzKGNvbW1lbnRoZWxwKSsnKS4qJCcsICdnaW0nKSxcdFx0XHRjc3M6ICdwcmVwcm9jZXNzb3IgaGVscCBib2xkJyB9LFx0XHQvLyBjb21tZW50LWJhc2VkIGhlbHBcblx0XHRcdHsgcmVnZXg6IFN5bnRheEhpZ2hsaWdodGVyLnJlZ2V4TGliLnNpbmdsZUxpbmVQZXJsQ29tbWVudHMsXHRcdFx0XHRcdFx0XHRcdFx0XHRjc3M6ICdjb21tZW50cycgfSxcdFx0XHRcdFx0XHQvLyBvbmUgbGluZSBjb21tZW50c1xuXHRcdFx0eyByZWdleDogLygmbHQ7fDwpI1tcXHNcXFNdKj8jKCZndDt8PikvZ20sXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNzczogJ2NvbW1lbnRzIGhlcmUnIH0sXHRcdFx0XHRcdC8vIG11bHRpLWxpbmUgY29tbWVudHNcblx0XHRcdFxuXHRcdFx0eyByZWdleDogbmV3IFJlZ0V4cCgnQFwiXFxcXG5bXFxcXHNcXFxcU10qP1xcXFxuXCJAJywgJ2dtJyksXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y3NzOiAnc2NyaXB0IHN0cmluZyBoZXJlJyB9LFx0XHRcdC8vIGRvdWJsZSBxdW90ZWQgaGVyZS1zdHJpbmdzXG5cdFx0XHR7IHJlZ2V4OiBuZXcgUmVnRXhwKFwiQCdcXFxcbltcXFxcc1xcXFxTXSo/XFxcXG4nQFwiLCAnZ20nKSxcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjc3M6ICdzY3JpcHQgc3RyaW5nIHNpbmdsZSBoZXJlJyB9LFx0XHQvLyBzaW5nbGUgcXVvdGVkIGhlcmUtc3RyaW5nc1xuXHRcdFx0eyByZWdleDogbmV3IFJlZ0V4cCgnXCIoPzpcXFxcJFxcXFwoW15cXFxcKV0qXFxcXCl8W15cIl18YFwifFwiXCIpKlteYF1cIicsJ2cnKSxcdFx0XHRcdFx0XHRcdFx0Y3NzOiAnc3RyaW5nJyB9LFx0XHRcdFx0XHRcdC8vIGRvdWJsZSBxdW90ZWQgc3RyaW5nc1xuXHRcdFx0eyByZWdleDogbmV3IFJlZ0V4cChcIicoPzpbXiddfCcnKSonXCIsICdnJyksXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNzczogJ3N0cmluZyBzaW5nbGUnIH0sXHRcdFx0XHRcdC8vIHNpbmdsZSBxdW90ZWQgc3RyaW5nc1xuXHRcdFx0XG5cdFx0XHR7IHJlZ2V4OiBuZXcgUmVnRXhwKCdbXFxcXCR8QHxAQF0oPzooPzpnbG9iYWx8c2NyaXB0fHByaXZhdGV8ZW52KTopP1tBLVowLTlfXSsnLCAnZ2knKSxcdFx0XHRjc3M6ICd2YXJpYWJsZScgfSxcdFx0XHRcdFx0XHQvLyAkdmFyaWFibGVzXG5cdFx0XHR7IHJlZ2V4OiBuZXcgUmVnRXhwKCcoPzpcXFxcYicrdmVyYnMucmVwbGFjZSgvIC9nLCAnXFxcXGJ8XFxcXGInKSsnKS1bYS16QS1aX11bYS16QS1aMC05X10qJywgJ2dtaScpLFx0Y3NzOiAnZnVuY3Rpb25zJyB9LFx0XHRcdFx0XHRcdC8vIGZ1bmN0aW9ucyBhbmQgY21kbGV0c1xuXHRcdFx0eyByZWdleDogbmV3IFJlZ0V4cCh0aGlzLmdldEtleXdvcmRzKGtleXdvcmRzKSwgJ2dtaScpLFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjc3M6ICdrZXl3b3JkJyB9LFx0XHRcdFx0XHRcdC8vIGtleXdvcmRzXG5cdFx0XHR7IHJlZ2V4OiBuZXcgUmVnRXhwKCctJyt0aGlzLmdldEtleXdvcmRzKG9wZXJhdG9ycyksICdnbWknKSxcdFx0XHRcdFx0XHRcdFx0XHRjc3M6ICdvcGVyYXRvciB2YWx1ZScgfSxcdFx0XHRcdC8vIG9wZXJhdG9yc1xuXHRcdFx0eyByZWdleDogbmV3IFJlZ0V4cCgnXFxcXFtbQS1aX1xcXFxbXVtBLVowLTlfLiBgLFxcXFxbXFxcXF1dKlxcXFxdJywgJ2dpJyksXHRcdFx0XHRcdFx0XHRcdGNzczogJ2NvbnN0YW50cycgfSxcdFx0XHRcdFx0XHQvLyAuTmV0IFtUeXBlXXNcblx0XHRcdHsgcmVnZXg6IG5ldyBSZWdFeHAoJ1xcXFxzKy0oPyEnK3RoaXMuZ2V0S2V5d29yZHMob3BlcmF0b3JzKSsnKVthLXpBLVpfXVthLXpBLVowLTlfXSonLCAnZ21pJyksXHRjc3M6ICdjb2xvcjEnIH0sXHRcdFx0XHRcdFx0Ly8gcGFyYW1ldGVyc1x0ICBcblx0XHRdO1xuXHR9O1xuXG5cdEJydXNoLnByb3RvdHlwZVx0PSBuZXcgU3ludGF4SGlnaGxpZ2h0ZXIuSGlnaGxpZ2h0ZXIoKTtcblx0QnJ1c2guYWxpYXNlc1x0PSBbJ3Bvd2Vyc2hlbGwnLCAncHMnLCAncG9zaCddO1xuXG5cdFN5bnRheEhpZ2hsaWdodGVyLmJydXNoZXMuUG93ZXJTaGVsbCA9IEJydXNoO1xuXG5cdC8vIENvbW1vbkpTXG5cdHR5cGVvZihleHBvcnRzKSAhPSAndW5kZWZpbmVkJyA/IGV4cG9ydHMuQnJ1c2ggPSBCcnVzaCA6IG51bGw7XG59KSgpO1xuOyhmdW5jdGlvbigpXG57XG5cdC8vIENvbW1vbkpTXG5cdFN5bnRheEhpZ2hsaWdodGVyID0gU3ludGF4SGlnaGxpZ2h0ZXIgfHwgKHR5cGVvZiByZXF1aXJlICE9PSAndW5kZWZpbmVkJz8gcmVxdWlyZSgnc2hDb3JlJykuU3ludGF4SGlnaGxpZ2h0ZXIgOiBudWxsKTtcblxuXHRmdW5jdGlvbiBCcnVzaCgpXG5cdHtcblx0XHQvLyBDb250cmlidXRlZCBieSBHaGVvcmdoZSBNaWxhcyBhbmQgQWhtYWQgU2hlcmlmXG5cdFxuXHRcdHZhciBrZXl3b3JkcyA9ICAnYW5kIGFzc2VydCBicmVhayBjbGFzcyBjb250aW51ZSBkZWYgZGVsIGVsaWYgZWxzZSAnICtcblx0XHRcdFx0XHRcdCdleGNlcHQgZXhlYyBmaW5hbGx5IGZvciBmcm9tIGdsb2JhbCBpZiBpbXBvcnQgaW4gaXMgJyArXG5cdFx0XHRcdFx0XHQnbGFtYmRhIG5vdCBvciBwYXNzIHByaW50IHJhaXNlIHJldHVybiB0cnkgeWllbGQgd2hpbGUnO1xuXG5cdFx0dmFyIGZ1bmNzID0gJ19faW1wb3J0X18gYWJzIGFsbCBhbnkgYXBwbHkgYmFzZXN0cmluZyBiaW4gYm9vbCBidWZmZXIgY2FsbGFibGUgJyArXG5cdFx0XHRcdFx0J2NociBjbGFzc21ldGhvZCBjbXAgY29lcmNlIGNvbXBpbGUgY29tcGxleCBkZWxhdHRyIGRpY3QgZGlyICcgK1xuXHRcdFx0XHRcdCdkaXZtb2QgZW51bWVyYXRlIGV2YWwgZXhlY2ZpbGUgZmlsZSBmaWx0ZXIgZmxvYXQgZm9ybWF0IGZyb3plbnNldCAnICtcblx0XHRcdFx0XHQnZ2V0YXR0ciBnbG9iYWxzIGhhc2F0dHIgaGFzaCBoZWxwIGhleCBpZCBpbnB1dCBpbnQgaW50ZXJuICcgK1xuXHRcdFx0XHRcdCdpc2luc3RhbmNlIGlzc3ViY2xhc3MgaXRlciBsZW4gbGlzdCBsb2NhbHMgbG9uZyBtYXAgbWF4IG1pbiBuZXh0ICcgK1xuXHRcdFx0XHRcdCdvYmplY3Qgb2N0IG9wZW4gb3JkIHBvdyBwcmludCBwcm9wZXJ0eSByYW5nZSByYXdfaW5wdXQgcmVkdWNlICcgK1xuXHRcdFx0XHRcdCdyZWxvYWQgcmVwciByZXZlcnNlZCByb3VuZCBzZXQgc2V0YXR0ciBzbGljZSBzb3J0ZWQgc3RhdGljbWV0aG9kICcgK1xuXHRcdFx0XHRcdCdzdHIgc3VtIHN1cGVyIHR1cGxlIHR5cGUgdHlwZSB1bmljaHIgdW5pY29kZSB2YXJzIHhyYW5nZSB6aXAnO1xuXG5cdFx0dmFyIHNwZWNpYWwgPSAgJ05vbmUgVHJ1ZSBGYWxzZSBzZWxmIGNscyBjbGFzc18nO1xuXG5cdFx0dGhpcy5yZWdleExpc3QgPSBbXG5cdFx0XHRcdHsgcmVnZXg6IFN5bnRheEhpZ2hsaWdodGVyLnJlZ2V4TGliLnNpbmdsZUxpbmVQZXJsQ29tbWVudHMsIGNzczogJ2NvbW1lbnRzJyB9LFxuXHRcdFx0XHR7IHJlZ2V4OiAvXlxccypAXFx3Ky9nbSwgXHRcdFx0XHRcdFx0XHRcdFx0XHRjc3M6ICdkZWNvcmF0b3InIH0sXG5cdFx0XHRcdHsgcmVnZXg6IC8oWydcXFwiXXszfSkoW15cXDFdKSo/XFwxL2dtLCBcdFx0XHRcdFx0XHRjc3M6ICdjb21tZW50cycgfSxcblx0XHRcdFx0eyByZWdleDogL1wiKD8hXCIpKD86XFwufFxcXFxcXFwifFteXFxcIlwiXFxuXSkqXCIvZ20sIFx0XHRcdFx0XHRjc3M6ICdzdHJpbmcnIH0sXG5cdFx0XHRcdHsgcmVnZXg6IC8nKD8hJykoPzpcXC58KFxcXFxcXCcpfFteXFwnJ1xcbl0pKicvZ20sIFx0XHRcdFx0Y3NzOiAnc3RyaW5nJyB9LFxuXHRcdFx0XHR7IHJlZ2V4OiAvXFwrfFxcLXxcXCp8XFwvfFxcJXw9fD09L2dtLCBcdFx0XHRcdFx0XHRcdGNzczogJ2tleXdvcmQnIH0sXG5cdFx0XHRcdHsgcmVnZXg6IC9cXGJcXGQrXFwuP1xcdyovZywgXHRcdFx0XHRcdFx0XHRcdFx0Y3NzOiAndmFsdWUnIH0sXG5cdFx0XHRcdHsgcmVnZXg6IG5ldyBSZWdFeHAodGhpcy5nZXRLZXl3b3JkcyhmdW5jcyksICdnbWknKSxcdFx0Y3NzOiAnZnVuY3Rpb25zJyB9LFxuXHRcdFx0XHR7IHJlZ2V4OiBuZXcgUmVnRXhwKHRoaXMuZ2V0S2V5d29yZHMoa2V5d29yZHMpLCAnZ20nKSwgXHRcdGNzczogJ2tleXdvcmQnIH0sXG5cdFx0XHRcdHsgcmVnZXg6IG5ldyBSZWdFeHAodGhpcy5nZXRLZXl3b3JkcyhzcGVjaWFsKSwgJ2dtJyksIFx0XHRjc3M6ICdjb2xvcjEnIH1cblx0XHRcdFx0XTtcblx0XHRcdFxuXHRcdHRoaXMuZm9ySHRtbFNjcmlwdChTeW50YXhIaWdobGlnaHRlci5yZWdleExpYi5hc3BTY3JpcHRUYWdzKTtcblx0fTtcblxuXHRCcnVzaC5wcm90b3R5cGVcdD0gbmV3IFN5bnRheEhpZ2hsaWdodGVyLkhpZ2hsaWdodGVyKCk7XG5cdEJydXNoLmFsaWFzZXNcdD0gWydweScsICdweXRob24nXTtcblxuXHRTeW50YXhIaWdobGlnaHRlci5icnVzaGVzLlB5dGhvbiA9IEJydXNoO1xuXG5cdC8vIENvbW1vbkpTXG5cdHR5cGVvZihleHBvcnRzKSAhPSAndW5kZWZpbmVkJyA/IGV4cG9ydHMuQnJ1c2ggPSBCcnVzaCA6IG51bGw7XG59KSgpO1xuOyhmdW5jdGlvbigpXG57XG5cdC8vIENvbW1vbkpTXG5cdFN5bnRheEhpZ2hsaWdodGVyID0gU3ludGF4SGlnaGxpZ2h0ZXIgfHwgKHR5cGVvZiByZXF1aXJlICE9PSAndW5kZWZpbmVkJz8gcmVxdWlyZSgnc2hDb3JlJykuU3ludGF4SGlnaGxpZ2h0ZXIgOiBudWxsKTtcblxuXHRmdW5jdGlvbiBCcnVzaCgpXG5cdHtcblx0XHQvLyBDb250cmlidXRlZCBieSBFcmlrIFBldGVyc29uLlxuXHRcblx0XHR2YXIga2V5d29yZHMgPVx0J2FsaWFzIGFuZCBCRUdJTiBiZWdpbiBicmVhayBjYXNlIGNsYXNzIGRlZiBkZWZpbmVfbWV0aG9kIGRlZmluZWQgZG8gZWFjaCBlbHNlIGVsc2lmICcgK1xuXHRcdFx0XHRcdFx0J0VORCBlbmQgZW5zdXJlIGZhbHNlIGZvciBpZiBpbiBtb2R1bGUgbmV3IG5leHQgbmlsIG5vdCBvciByYWlzZSByZWRvIHJlc2N1ZSByZXRyeSByZXR1cm4gJyArXG5cdFx0XHRcdFx0XHQnc2VsZiBzdXBlciB0aGVuIHRocm93IHRydWUgdW5kZWYgdW5sZXNzIHVudGlsIHdoZW4gd2hpbGUgeWllbGQnO1xuXG5cdFx0dmFyIGJ1aWx0aW5zID1cdCdBcnJheSBCaWdudW0gQmluZGluZyBDbGFzcyBDb250aW51YXRpb24gRGlyIEV4Y2VwdGlvbiBGYWxzZUNsYXNzIEZpbGU6OlN0YXQgRmlsZSBGaXhudW0gRmxvYWQgJyArXG5cdFx0XHRcdFx0XHQnSGFzaCBJbnRlZ2VyIElPIE1hdGNoRGF0YSBNZXRob2QgTW9kdWxlIE5pbENsYXNzIE51bWVyaWMgT2JqZWN0IFByb2MgUmFuZ2UgUmVnZXhwIFN0cmluZyBTdHJ1Y3Q6OlRNUyBTeW1ib2wgJyArXG5cdFx0XHRcdFx0XHQnVGhyZWFkR3JvdXAgVGhyZWFkIFRpbWUgVHJ1ZUNsYXNzJztcblxuXHRcdHRoaXMucmVnZXhMaXN0ID0gW1xuXHRcdFx0eyByZWdleDogU3ludGF4SGlnaGxpZ2h0ZXIucmVnZXhMaWIuc2luZ2xlTGluZVBlcmxDb21tZW50cyxcdGNzczogJ2NvbW1lbnRzJyB9LFx0XHQvLyBvbmUgbGluZSBjb21tZW50c1xuXHRcdFx0eyByZWdleDogU3ludGF4SGlnaGxpZ2h0ZXIucmVnZXhMaWIuZG91YmxlUXVvdGVkU3RyaW5nLFx0XHRjc3M6ICdzdHJpbmcnIH0sXHRcdC8vIGRvdWJsZSBxdW90ZWQgc3RyaW5nc1xuXHRcdFx0eyByZWdleDogU3ludGF4SGlnaGxpZ2h0ZXIucmVnZXhMaWIuc2luZ2xlUXVvdGVkU3RyaW5nLFx0XHRjc3M6ICdzdHJpbmcnIH0sXHRcdC8vIHNpbmdsZSBxdW90ZWQgc3RyaW5nc1xuXHRcdFx0eyByZWdleDogL1xcYltBLVowLTlfXStcXGIvZyxcdFx0XHRcdFx0XHRcdFx0XHRjc3M6ICdjb25zdGFudHMnIH0sXHRcdC8vIGNvbnN0YW50c1xuXHRcdFx0eyByZWdleDogLzpbYS16XVtBLVphLXowLTlfXSovZyxcdFx0XHRcdFx0XHRcdGNzczogJ2NvbG9yMicgfSxcdFx0Ly8gc3ltYm9sc1xuXHRcdFx0eyByZWdleDogLyhcXCR8QEB8QClcXHcrL2csXHRcdFx0XHRcdFx0XHRcdFx0Y3NzOiAndmFyaWFibGUgYm9sZCcgfSxcdC8vICRnbG9iYWwsIEBpbnN0YW5jZSwgYW5kIEBAY2xhc3MgdmFyaWFibGVzXG5cdFx0XHR7IHJlZ2V4OiBuZXcgUmVnRXhwKHRoaXMuZ2V0S2V5d29yZHMoa2V5d29yZHMpLCAnZ20nKSxcdFx0Y3NzOiAna2V5d29yZCcgfSxcdFx0Ly8ga2V5d29yZHNcblx0XHRcdHsgcmVnZXg6IG5ldyBSZWdFeHAodGhpcy5nZXRLZXl3b3JkcyhidWlsdGlucyksICdnbScpLFx0XHRjc3M6ICdjb2xvcjEnIH1cdFx0XHQvLyBidWlsdGluc1xuXHRcdFx0XTtcblxuXHRcdHRoaXMuZm9ySHRtbFNjcmlwdChTeW50YXhIaWdobGlnaHRlci5yZWdleExpYi5hc3BTY3JpcHRUYWdzKTtcblx0fTtcblxuXHRCcnVzaC5wcm90b3R5cGVcdD0gbmV3IFN5bnRheEhpZ2hsaWdodGVyLkhpZ2hsaWdodGVyKCk7XG5cdEJydXNoLmFsaWFzZXNcdD0gWydydWJ5JywgJ3JhaWxzJywgJ3JvcicsICdyYiddO1xuXG5cdFN5bnRheEhpZ2hsaWdodGVyLmJydXNoZXMuUnVieSA9IEJydXNoO1xuXG5cdC8vIENvbW1vbkpTXG5cdHR5cGVvZihleHBvcnRzKSAhPSAndW5kZWZpbmVkJyA/IGV4cG9ydHMuQnJ1c2ggPSBCcnVzaCA6IG51bGw7XG59KSgpO1xuOyhmdW5jdGlvbigpXG57XG5cdC8vIENvbW1vbkpTXG5cdFN5bnRheEhpZ2hsaWdodGVyID0gU3ludGF4SGlnaGxpZ2h0ZXIgfHwgKHR5cGVvZiByZXF1aXJlICE9PSAndW5kZWZpbmVkJz8gcmVxdWlyZSgnc2hDb3JlJykuU3ludGF4SGlnaGxpZ2h0ZXIgOiBudWxsKTtcblxuXHRmdW5jdGlvbiBCcnVzaCgpXG5cdHtcblx0XHRmdW5jdGlvbiBnZXRLZXl3b3Jkc0NTUyhzdHIpXG5cdFx0e1xuXHRcdFx0cmV0dXJuICdcXFxcYihbYS16X118KScgKyBzdHIucmVwbGFjZSgvIC9nLCAnKD89OilcXFxcYnxcXFxcYihbYS16X1xcXFwqXXxcXFxcKnwpJykgKyAnKD89OilcXFxcYic7XG5cdFx0fTtcblx0XG5cdFx0ZnVuY3Rpb24gZ2V0VmFsdWVzQ1NTKHN0cilcblx0XHR7XG5cdFx0XHRyZXR1cm4gJ1xcXFxiJyArIHN0ci5yZXBsYWNlKC8gL2csICcoPyEtKSg/ITopXFxcXGJ8XFxcXGIoKScpICsgJ1xcOlxcXFxiJztcblx0XHR9O1xuXG5cdFx0dmFyIGtleXdvcmRzID1cdCdhc2NlbnQgYXppbXV0aCBiYWNrZ3JvdW5kLWF0dGFjaG1lbnQgYmFja2dyb3VuZC1jb2xvciBiYWNrZ3JvdW5kLWltYWdlIGJhY2tncm91bmQtcG9zaXRpb24gJyArXG5cdFx0XHRcdFx0XHQnYmFja2dyb3VuZC1yZXBlYXQgYmFja2dyb3VuZCBiYXNlbGluZSBiYm94IGJvcmRlci1jb2xsYXBzZSBib3JkZXItY29sb3IgYm9yZGVyLXNwYWNpbmcgYm9yZGVyLXN0eWxlIGJvcmRlci10b3AgJyArXG5cdFx0XHRcdFx0XHQnYm9yZGVyLXJpZ2h0IGJvcmRlci1ib3R0b20gYm9yZGVyLWxlZnQgYm9yZGVyLXRvcC1jb2xvciBib3JkZXItcmlnaHQtY29sb3IgYm9yZGVyLWJvdHRvbS1jb2xvciBib3JkZXItbGVmdC1jb2xvciAnICtcblx0XHRcdFx0XHRcdCdib3JkZXItdG9wLXN0eWxlIGJvcmRlci1yaWdodC1zdHlsZSBib3JkZXItYm90dG9tLXN0eWxlIGJvcmRlci1sZWZ0LXN0eWxlIGJvcmRlci10b3Atd2lkdGggYm9yZGVyLXJpZ2h0LXdpZHRoICcgK1xuXHRcdFx0XHRcdFx0J2JvcmRlci1ib3R0b20td2lkdGggYm9yZGVyLWxlZnQtd2lkdGggYm9yZGVyLXdpZHRoIGJvcmRlciBib3R0b20gY2FwLWhlaWdodCBjYXB0aW9uLXNpZGUgY2VudGVybGluZSBjbGVhciBjbGlwIGNvbG9yICcgK1xuXHRcdFx0XHRcdFx0J2NvbnRlbnQgY291bnRlci1pbmNyZW1lbnQgY291bnRlci1yZXNldCBjdWUtYWZ0ZXIgY3VlLWJlZm9yZSBjdWUgY3Vyc29yIGRlZmluaXRpb24tc3JjIGRlc2NlbnQgZGlyZWN0aW9uIGRpc3BsYXkgJyArXG5cdFx0XHRcdFx0XHQnZWxldmF0aW9uIGVtcHR5LWNlbGxzIGZsb2F0IGZvbnQtc2l6ZS1hZGp1c3QgZm9udC1mYW1pbHkgZm9udC1zaXplIGZvbnQtc3RyZXRjaCBmb250LXN0eWxlIGZvbnQtdmFyaWFudCBmb250LXdlaWdodCBmb250ICcgK1xuXHRcdFx0XHRcdFx0J2hlaWdodCBsZWZ0IGxldHRlci1zcGFjaW5nIGxpbmUtaGVpZ2h0IGxpc3Qtc3R5bGUtaW1hZ2UgbGlzdC1zdHlsZS1wb3NpdGlvbiBsaXN0LXN0eWxlLXR5cGUgbGlzdC1zdHlsZSBtYXJnaW4tdG9wICcgK1xuXHRcdFx0XHRcdFx0J21hcmdpbi1yaWdodCBtYXJnaW4tYm90dG9tIG1hcmdpbi1sZWZ0IG1hcmdpbiBtYXJrZXItb2Zmc2V0IG1hcmtzIG1hdGhsaW5lIG1heC1oZWlnaHQgbWF4LXdpZHRoIG1pbi1oZWlnaHQgbWluLXdpZHRoIG9ycGhhbnMgJyArXG5cdFx0XHRcdFx0XHQnb3V0bGluZS1jb2xvciBvdXRsaW5lLXN0eWxlIG91dGxpbmUtd2lkdGggb3V0bGluZSBvdmVyZmxvdyBwYWRkaW5nLXRvcCBwYWRkaW5nLXJpZ2h0IHBhZGRpbmctYm90dG9tIHBhZGRpbmctbGVmdCBwYWRkaW5nIHBhZ2UgJyArXG5cdFx0XHRcdFx0XHQncGFnZS1icmVhay1hZnRlciBwYWdlLWJyZWFrLWJlZm9yZSBwYWdlLWJyZWFrLWluc2lkZSBwYXVzZSBwYXVzZS1hZnRlciBwYXVzZS1iZWZvcmUgcGl0Y2ggcGl0Y2gtcmFuZ2UgcGxheS1kdXJpbmcgcG9zaXRpb24gJyArXG5cdFx0XHRcdFx0XHQncXVvdGVzIHJpZ2h0IHJpY2huZXNzIHNpemUgc2xvcGUgc3JjIHNwZWFrLWhlYWRlciBzcGVhay1udW1lcmFsIHNwZWFrLXB1bmN0dWF0aW9uIHNwZWFrIHNwZWVjaC1yYXRlIHN0ZW1oIHN0ZW12IHN0cmVzcyAnICtcblx0XHRcdFx0XHRcdCd0YWJsZS1sYXlvdXQgdGV4dC1hbGlnbiB0b3AgdGV4dC1kZWNvcmF0aW9uIHRleHQtaW5kZW50IHRleHQtc2hhZG93IHRleHQtdHJhbnNmb3JtIHVuaWNvZGUtYmlkaSB1bmljb2RlLXJhbmdlIHVuaXRzLXBlci1lbSAnICtcblx0XHRcdFx0XHRcdCd2ZXJ0aWNhbC1hbGlnbiB2aXNpYmlsaXR5IHZvaWNlLWZhbWlseSB2b2x1bWUgd2hpdGUtc3BhY2Ugd2lkb3dzIHdpZHRoIHdpZHRocyB3b3JkLXNwYWNpbmcgeC1oZWlnaHQgei1pbmRleCc7XG5cdFx0XG5cdFx0dmFyIHZhbHVlcyA9XHQnYWJvdmUgYWJzb2x1dGUgYWxsIGFsd2F5cyBhcXVhIGFybWVuaWFuIGF0dHIgYXVyYWwgYXV0byBhdm9pZCBiYXNlbGluZSBiZWhpbmQgYmVsb3cgYmlkaS1vdmVycmlkZSBibGFjayBibGluayBibG9jayBibHVlIGJvbGQgYm9sZGVyICcrXG5cdFx0XHRcdFx0XHQnYm90aCBib3R0b20gYnJhaWxsZSBjYXBpdGFsaXplIGNhcHRpb24gY2VudGVyIGNlbnRlci1sZWZ0IGNlbnRlci1yaWdodCBjaXJjbGUgY2xvc2UtcXVvdGUgY29kZSBjb2xsYXBzZSBjb21wYWN0IGNvbmRlbnNlZCAnK1xuXHRcdFx0XHRcdFx0J2NvbnRpbnVvdXMgY291bnRlciBjb3VudGVycyBjcm9wIGNyb3NzIGNyb3NzaGFpciBjdXJzaXZlIGRhc2hlZCBkZWNpbWFsIGRlY2ltYWwtbGVhZGluZy16ZXJvIGRpZ2l0cyBkaXNjIGRvdHRlZCBkb3VibGUgJytcblx0XHRcdFx0XHRcdCdlbWJlZCBlbWJvc3NlZCBlLXJlc2l6ZSBleHBhbmRlZCBleHRyYS1jb25kZW5zZWQgZXh0cmEtZXhwYW5kZWQgZmFudGFzeSBmYXItbGVmdCBmYXItcmlnaHQgZmFzdCBmYXN0ZXIgZml4ZWQgZm9ybWF0IGZ1Y2hzaWEgJytcblx0XHRcdFx0XHRcdCdncmF5IGdyZWVuIGdyb292ZSBoYW5kaGVsZCBoZWJyZXcgaGVscCBoaWRkZW4gaGlkZSBoaWdoIGhpZ2hlciBpY29uIGlubGluZS10YWJsZSBpbmxpbmUgaW5zZXQgaW5zaWRlIGludmVydCBpdGFsaWMgJytcblx0XHRcdFx0XHRcdCdqdXN0aWZ5IGxhbmRzY2FwZSBsYXJnZSBsYXJnZXIgbGVmdC1zaWRlIGxlZnQgbGVmdHdhcmRzIGxldmVsIGxpZ2h0ZXIgbGltZSBsaW5lLXRocm91Z2ggbGlzdC1pdGVtIGxvY2FsIGxvdWQgbG93ZXItYWxwaGEgJytcblx0XHRcdFx0XHRcdCdsb3dlcmNhc2UgbG93ZXItZ3JlZWsgbG93ZXItbGF0aW4gbG93ZXItcm9tYW4gbG93ZXIgbG93IGx0ciBtYXJrZXIgbWFyb29uIG1lZGl1bSBtZXNzYWdlLWJveCBtaWRkbGUgbWl4IG1vdmUgbmFycm93ZXIgJytcblx0XHRcdFx0XHRcdCduYXZ5IG5lLXJlc2l6ZSBuby1jbG9zZS1xdW90ZSBub25lIG5vLW9wZW4tcXVvdGUgbm8tcmVwZWF0IG5vcm1hbCBub3dyYXAgbi1yZXNpemUgbnctcmVzaXplIG9ibGlxdWUgb2xpdmUgb25jZSBvcGVuLXF1b3RlIG91dHNldCAnK1xuXHRcdFx0XHRcdFx0J291dHNpZGUgb3ZlcmxpbmUgcG9pbnRlciBwb3J0cmFpdCBwcmUgcHJpbnQgcHJvamVjdGlvbiBwdXJwbGUgcmVkIHJlbGF0aXZlIHJlcGVhdCByZXBlYXQteCByZXBlYXQteSByZ2IgcmlkZ2UgcmlnaHQgcmlnaHQtc2lkZSAnK1xuXHRcdFx0XHRcdFx0J3JpZ2h0d2FyZHMgcnRsIHJ1bi1pbiBzY3JlZW4gc2Nyb2xsIHNlbWktY29uZGVuc2VkIHNlbWktZXhwYW5kZWQgc2VwYXJhdGUgc2UtcmVzaXplIHNob3cgc2lsZW50IHNpbHZlciBzbG93ZXIgc2xvdyAnK1xuXHRcdFx0XHRcdFx0J3NtYWxsIHNtYWxsLWNhcHMgc21hbGwtY2FwdGlvbiBzbWFsbGVyIHNvZnQgc29saWQgc3BlZWNoIHNwZWxsLW91dCBzcXVhcmUgcy1yZXNpemUgc3RhdGljIHN0YXR1cy1iYXIgc3ViIHN1cGVyIHN3LXJlc2l6ZSAnK1xuXHRcdFx0XHRcdFx0J3RhYmxlLWNhcHRpb24gdGFibGUtY2VsbCB0YWJsZS1jb2x1bW4gdGFibGUtY29sdW1uLWdyb3VwIHRhYmxlLWZvb3Rlci1ncm91cCB0YWJsZS1oZWFkZXItZ3JvdXAgdGFibGUtcm93IHRhYmxlLXJvdy1ncm91cCB0ZWFsICcrXG5cdFx0XHRcdFx0XHQndGV4dC1ib3R0b20gdGV4dC10b3AgdGhpY2sgdGhpbiB0b3AgdHJhbnNwYXJlbnQgdHR5IHR2IHVsdHJhLWNvbmRlbnNlZCB1bHRyYS1leHBhbmRlZCB1bmRlcmxpbmUgdXBwZXItYWxwaGEgdXBwZXJjYXNlIHVwcGVyLWxhdGluICcrXG5cdFx0XHRcdFx0XHQndXBwZXItcm9tYW4gdXJsIHZpc2libGUgd2FpdCB3aGl0ZSB3aWRlciB3LXJlc2l6ZSB4LWZhc3QgeC1oaWdoIHgtbGFyZ2UgeC1sb3VkIHgtbG93IHgtc2xvdyB4LXNtYWxsIHgtc29mdCB4eC1sYXJnZSB4eC1zbWFsbCB5ZWxsb3cnO1xuXHRcdFxuXHRcdHZhciBmb250cyA9XHRcdCdbbU1db25vc3BhY2UgW3RUXWFob21hIFt2Vl1lcmRhbmEgW2FBXXJpYWwgW2hIXWVsdmV0aWNhIFtzU11hbnMtc2VyaWYgW3NTXWVyaWYgW2NDXW91cmllciBtb25vIHNhbnMgc2VyaWYnO1xuXHRcdFxuXHRcdHZhciBzdGF0ZW1lbnRzXHRcdD0gJyFpbXBvcnRhbnQgIWRlZmF1bHQnO1xuXHRcdHZhciBwcmVwcm9jZXNzb3JcdD0gJ0BpbXBvcnQgQGV4dGVuZCBAZGVidWcgQHdhcm4gQGlmIEBmb3IgQHdoaWxlIEBtaXhpbiBAaW5jbHVkZSc7XG5cdFx0XG5cdFx0dmFyIHIgPSBTeW50YXhIaWdobGlnaHRlci5yZWdleExpYjtcblx0XHRcblx0XHR0aGlzLnJlZ2V4TGlzdCA9IFtcblx0XHRcdHsgcmVnZXg6IHIubXVsdGlMaW5lQ0NvbW1lbnRzLFx0XHRcdFx0XHRcdFx0XHRjc3M6ICdjb21tZW50cycgfSxcdFx0Ly8gbXVsdGlsaW5lIGNvbW1lbnRzXG5cdFx0XHR7IHJlZ2V4OiByLnNpbmdsZUxpbmVDQ29tbWVudHMsXHRcdFx0XHRcdFx0XHRcdGNzczogJ2NvbW1lbnRzJyB9LFx0XHQvLyBzaW5nbGVsaW5lIGNvbW1lbnRzXG5cdFx0XHR7IHJlZ2V4OiByLmRvdWJsZVF1b3RlZFN0cmluZyxcdFx0XHRcdFx0XHRcdFx0Y3NzOiAnc3RyaW5nJyB9LFx0XHQvLyBkb3VibGUgcXVvdGVkIHN0cmluZ3Ncblx0XHRcdHsgcmVnZXg6IHIuc2luZ2xlUXVvdGVkU3RyaW5nLFx0XHRcdFx0XHRcdFx0XHRjc3M6ICdzdHJpbmcnIH0sXHRcdC8vIHNpbmdsZSBxdW90ZWQgc3RyaW5nc1xuXHRcdFx0eyByZWdleDogL1xcI1thLWZBLUYwLTldezMsNn0vZyxcdFx0XHRcdFx0XHRcdFx0Y3NzOiAndmFsdWUnIH0sXHRcdFx0Ly8gaHRtbCBjb2xvcnNcblx0XHRcdHsgcmVnZXg6IC9cXGIoLT9cXGQrKShcXC5cXGQrKT8ocHh8ZW18cHR8XFw6fFxcJXwpXFxiL2csXHRcdFx0Y3NzOiAndmFsdWUnIH0sXHRcdFx0Ly8gc2l6ZXNcblx0XHRcdHsgcmVnZXg6IC9cXCRcXHcrL2csXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNzczogJ3ZhcmlhYmxlJyB9LFx0XHQvLyB2YXJpYWJsZXNcblx0XHRcdHsgcmVnZXg6IG5ldyBSZWdFeHAodGhpcy5nZXRLZXl3b3JkcyhzdGF0ZW1lbnRzKSwgJ2cnKSxcdFx0Y3NzOiAnY29sb3IzJyB9LFx0XHQvLyBzdGF0ZW1lbnRzXG5cdFx0XHR7IHJlZ2V4OiBuZXcgUmVnRXhwKHRoaXMuZ2V0S2V5d29yZHMocHJlcHJvY2Vzc29yKSwgJ2cnKSxcdGNzczogJ3ByZXByb2Nlc3NvcicgfSxcdC8vIHByZXByb2Nlc3NvclxuXHRcdFx0eyByZWdleDogbmV3IFJlZ0V4cChnZXRLZXl3b3Jkc0NTUyhrZXl3b3JkcyksICdnbScpLFx0XHRjc3M6ICdrZXl3b3JkJyB9LFx0XHQvLyBrZXl3b3Jkc1xuXHRcdFx0eyByZWdleDogbmV3IFJlZ0V4cChnZXRWYWx1ZXNDU1ModmFsdWVzKSwgJ2cnKSxcdFx0XHRcdGNzczogJ3ZhbHVlJyB9LFx0XHRcdC8vIHZhbHVlc1xuXHRcdFx0eyByZWdleDogbmV3IFJlZ0V4cCh0aGlzLmdldEtleXdvcmRzKGZvbnRzKSwgJ2cnKSxcdFx0XHRjc3M6ICdjb2xvcjEnIH1cdFx0XHQvLyBmb250c1xuXHRcdFx0XTtcblx0fTtcblxuXHRCcnVzaC5wcm90b3R5cGVcdD0gbmV3IFN5bnRheEhpZ2hsaWdodGVyLkhpZ2hsaWdodGVyKCk7XG5cdEJydXNoLmFsaWFzZXNcdD0gWydzYXNzJywgJ3Njc3MnXTtcblxuXHRTeW50YXhIaWdobGlnaHRlci5icnVzaGVzLlNhc3MgPSBCcnVzaDtcblxuXHQvLyBDb21tb25KU1xuXHR0eXBlb2YoZXhwb3J0cykgIT0gJ3VuZGVmaW5lZCcgPyBleHBvcnRzLkJydXNoID0gQnJ1c2ggOiBudWxsO1xufSkoKTtcbjsoZnVuY3Rpb24oKVxue1xuXHQvLyBDb21tb25KU1xuXHRTeW50YXhIaWdobGlnaHRlciA9IFN5bnRheEhpZ2hsaWdodGVyIHx8ICh0eXBlb2YgcmVxdWlyZSAhPT0gJ3VuZGVmaW5lZCc/IHJlcXVpcmUoJ3NoQ29yZScpLlN5bnRheEhpZ2hsaWdodGVyIDogbnVsbCk7XG5cblx0ZnVuY3Rpb24gQnJ1c2goKVxuXHR7XG5cdFx0Ly8gQ29udHJpYnV0ZWQgYnkgWWVnb3IgSmJhbm92IGFuZCBEYXZpZCBCZXJuYXJkLlxuXHRcblx0XHR2YXIga2V5d29yZHMgPVx0J3ZhbCBzZWFsZWQgY2FzZSBkZWYgdHJ1ZSB0cmFpdCBpbXBsaWNpdCBmb3JTb21lIGltcG9ydCBtYXRjaCBvYmplY3QgbnVsbCBmaW5hbGx5IHN1cGVyICcgK1xuXHRcdFx0XHRcdFx0J292ZXJyaWRlIHRyeSBsYXp5IGZvciB2YXIgY2F0Y2ggdGhyb3cgdHlwZSBleHRlbmRzIGNsYXNzIHdoaWxlIHdpdGggbmV3IGZpbmFsIHlpZWxkIGFic3RyYWN0ICcgK1xuXHRcdFx0XHRcdFx0J2Vsc2UgZG8gaWYgcmV0dXJuIHByb3RlY3RlZCBwcml2YXRlIHRoaXMgcGFja2FnZSBmYWxzZSc7XG5cblx0XHR2YXIga2V5b3BzID1cdCdbXzo9PjwlI0BdKyc7XG5cblx0XHR0aGlzLnJlZ2V4TGlzdCA9IFtcblx0XHRcdHsgcmVnZXg6IFN5bnRheEhpZ2hsaWdodGVyLnJlZ2V4TGliLnNpbmdsZUxpbmVDQ29tbWVudHMsXHRcdFx0Y3NzOiAnY29tbWVudHMnIH0sXHQvLyBvbmUgbGluZSBjb21tZW50c1xuXHRcdFx0eyByZWdleDogU3ludGF4SGlnaGxpZ2h0ZXIucmVnZXhMaWIubXVsdGlMaW5lQ0NvbW1lbnRzLFx0XHRcdFx0Y3NzOiAnY29tbWVudHMnIH0sXHQvLyBtdWx0aWxpbmUgY29tbWVudHNcblx0XHRcdHsgcmVnZXg6IFN5bnRheEhpZ2hsaWdodGVyLnJlZ2V4TGliLm11bHRpTGluZVNpbmdsZVF1b3RlZFN0cmluZyxcdGNzczogJ3N0cmluZycgfSxcdC8vIG11bHRpLWxpbmUgc3RyaW5nc1xuXHRcdFx0eyByZWdleDogU3ludGF4SGlnaGxpZ2h0ZXIucmVnZXhMaWIubXVsdGlMaW5lRG91YmxlUXVvdGVkU3RyaW5nLCAgICBjc3M6ICdzdHJpbmcnIH0sXHQvLyBkb3VibGUtcXVvdGVkIHN0cmluZ1xuXHRcdFx0eyByZWdleDogU3ludGF4SGlnaGxpZ2h0ZXIucmVnZXhMaWIuc2luZ2xlUXVvdGVkU3RyaW5nLFx0XHRcdFx0Y3NzOiAnc3RyaW5nJyB9LFx0Ly8gc3RyaW5nc1xuXHRcdFx0eyByZWdleDogLzB4W2EtZjAtOV0rfFxcZCsoXFwuXFxkKyk/L2dpLFx0XHRcdFx0XHRcdFx0XHRjc3M6ICd2YWx1ZScgfSxcdFx0Ly8gbnVtYmVyc1xuXHRcdFx0eyByZWdleDogbmV3IFJlZ0V4cCh0aGlzLmdldEtleXdvcmRzKGtleXdvcmRzKSwgJ2dtJyksXHRcdFx0XHRjc3M6ICdrZXl3b3JkJyB9LFx0Ly8ga2V5d29yZHNcblx0XHRcdHsgcmVnZXg6IG5ldyBSZWdFeHAoa2V5b3BzLCAnZ20nKSxcdFx0XHRcdFx0XHRcdFx0XHRjc3M6ICdrZXl3b3JkJyB9XHQvLyBzY2FsYSBrZXl3b3JkXG5cdFx0XHRdO1xuXHR9XG5cblx0QnJ1c2gucHJvdG90eXBlXHQ9IG5ldyBTeW50YXhIaWdobGlnaHRlci5IaWdobGlnaHRlcigpO1xuXHRCcnVzaC5hbGlhc2VzXHQ9IFsnc2NhbGEnXTtcblxuXHRTeW50YXhIaWdobGlnaHRlci5icnVzaGVzLlNjYWxhID0gQnJ1c2g7XG5cblx0Ly8gQ29tbW9uSlNcblx0dHlwZW9mKGV4cG9ydHMpICE9ICd1bmRlZmluZWQnID8gZXhwb3J0cy5CcnVzaCA9IEJydXNoIDogbnVsbDtcbn0pKCk7XG47KGZ1bmN0aW9uKClcbntcblx0Ly8gQ29tbW9uSlNcblx0U3ludGF4SGlnaGxpZ2h0ZXIgPSBTeW50YXhIaWdobGlnaHRlciB8fCAodHlwZW9mIHJlcXVpcmUgIT09ICd1bmRlZmluZWQnPyByZXF1aXJlKCdzaENvcmUnKS5TeW50YXhIaWdobGlnaHRlciA6IG51bGwpO1xuXG5cdGZ1bmN0aW9uIEJydXNoKClcblx0e1xuXHRcdHZhciBmdW5jc1x0PVx0J2FicyBhdmcgY2FzZSBjYXN0IGNvYWxlc2NlIGNvbnZlcnQgY291bnQgY3VycmVudF90aW1lc3RhbXAgJyArXG5cdFx0XHRcdFx0XHQnY3VycmVudF91c2VyIGRheSBpc251bGwgbGVmdCBsb3dlciBtb250aCBudWxsaWYgcmVwbGFjZSByaWdodCAnICtcblx0XHRcdFx0XHRcdCdzZXNzaW9uX3VzZXIgc3BhY2Ugc3Vic3RyaW5nIHN1bSBzeXN0ZW1fdXNlciB1cHBlciB1c2VyIHllYXInO1xuXG5cdFx0dmFyIGtleXdvcmRzID1cdCdhYnNvbHV0ZSBhY3Rpb24gYWRkIGFmdGVyIGFsdGVyIGFzIGFzYyBhdCBhdXRob3JpemF0aW9uIGJlZ2luIGJpZ2ludCAnICtcblx0XHRcdFx0XHRcdCdiaW5hcnkgYml0IGJ5IGNhc2NhZGUgY2hhciBjaGFyYWN0ZXIgY2hlY2sgY2hlY2twb2ludCBjbG9zZSBjb2xsYXRlICcgK1xuXHRcdFx0XHRcdFx0J2NvbHVtbiBjb21taXQgY29tbWl0dGVkIGNvbm5lY3QgY29ubmVjdGlvbiBjb25zdHJhaW50IGNvbnRhaW5zIGNvbnRpbnVlICcgK1xuXHRcdFx0XHRcdFx0J2NyZWF0ZSBjdWJlIGN1cnJlbnQgY3VycmVudF9kYXRlIGN1cnJlbnRfdGltZSBjdXJzb3IgZGF0YWJhc2UgZGF0ZSAnICtcblx0XHRcdFx0XHRcdCdkZWFsbG9jYXRlIGRlYyBkZWNpbWFsIGRlY2xhcmUgZGVmYXVsdCBkZWxldGUgZGVzYyBkaXN0aW5jdCBkb3VibGUgZHJvcCAnICtcblx0XHRcdFx0XHRcdCdkeW5hbWljIGVsc2UgZW5kIGVuZC1leGVjIGVzY2FwZSBleGNlcHQgZXhlYyBleGVjdXRlIGZhbHNlIGZldGNoIGZpcnN0ICcgK1xuXHRcdFx0XHRcdFx0J2Zsb2F0IGZvciBmb3JjZSBmb3JlaWduIGZvcndhcmQgZnJlZSBmcm9tIGZ1bGwgZnVuY3Rpb24gZ2xvYmFsIGdvdG8gZ3JhbnQgJyArXG5cdFx0XHRcdFx0XHQnZ3JvdXAgZ3JvdXBpbmcgaGF2aW5nIGhvdXIgaWdub3JlIGluZGV4IGlubmVyIGluc2Vuc2l0aXZlIGluc2VydCBpbnN0ZWFkICcgK1xuXHRcdFx0XHRcdFx0J2ludCBpbnRlZ2VyIGludGVyc2VjdCBpbnRvIGlzIGlzb2xhdGlvbiBrZXkgbGFzdCBsZXZlbCBsb2FkIGxvY2FsIG1heCBtaW4gJyArXG5cdFx0XHRcdFx0XHQnbWludXRlIG1vZGlmeSBtb3ZlIG5hbWUgbmF0aW9uYWwgbmNoYXIgbmV4dCBubyBudW1lcmljIG9mIG9mZiBvbiBvbmx5ICcgK1xuXHRcdFx0XHRcdFx0J29wZW4gb3B0aW9uIG9yZGVyIG91dCBvdXRwdXQgcGFydGlhbCBwYXNzd29yZCBwcmVjaXNpb24gcHJlcGFyZSBwcmltYXJ5ICcgK1xuXHRcdFx0XHRcdFx0J3ByaW9yIHByaXZpbGVnZXMgcHJvY2VkdXJlIHB1YmxpYyByZWFkIHJlYWwgcmVmZXJlbmNlcyByZWxhdGl2ZSByZXBlYXRhYmxlICcgK1xuXHRcdFx0XHRcdFx0J3Jlc3RyaWN0IHJldHVybiByZXR1cm5zIHJldm9rZSByb2xsYmFjayByb2xsdXAgcm93cyBydWxlIHNjaGVtYSBzY3JvbGwgJyArXG5cdFx0XHRcdFx0XHQnc2Vjb25kIHNlY3Rpb24gc2VsZWN0IHNlcXVlbmNlIHNlcmlhbGl6YWJsZSBzZXQgc2l6ZSBzbWFsbGludCBzdGF0aWMgJyArXG5cdFx0XHRcdFx0XHQnc3RhdGlzdGljcyB0YWJsZSB0ZW1wIHRlbXBvcmFyeSB0aGVuIHRpbWUgdGltZXN0YW1wIHRvIHRvcCB0cmFuc2FjdGlvbiAnICtcblx0XHRcdFx0XHRcdCd0cmFuc2xhdGlvbiB0cmlnZ2VyIHRydWUgdHJ1bmNhdGUgdW5jb21taXR0ZWQgdW5pb24gdW5pcXVlIHVwZGF0ZSB2YWx1ZXMgJyArXG5cdFx0XHRcdFx0XHQndmFyY2hhciB2YXJ5aW5nIHZpZXcgd2hlbiB3aGVyZSB3aXRoIHdvcmsnO1xuXG5cdFx0dmFyIG9wZXJhdG9ycyA9XHQnYWxsIGFuZCBhbnkgYmV0d2VlbiBjcm9zcyBpbiBqb2luIGxpa2Ugbm90IG51bGwgb3Igb3V0ZXIgc29tZSc7XG5cblx0XHR0aGlzLnJlZ2V4TGlzdCA9IFtcblx0XHRcdHsgcmVnZXg6IC8tLSguKikkL2dtLFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNzczogJ2NvbW1lbnRzJyB9LFx0XHRcdC8vIG9uZSBsaW5lIGFuZCBtdWx0aWxpbmUgY29tbWVudHNcblx0XHRcdHsgcmVnZXg6IFN5bnRheEhpZ2hsaWdodGVyLnJlZ2V4TGliLm11bHRpTGluZURvdWJsZVF1b3RlZFN0cmluZyxcdGNzczogJ3N0cmluZycgfSxcdFx0XHQvLyBkb3VibGUgcXVvdGVkIHN0cmluZ3Ncblx0XHRcdHsgcmVnZXg6IFN5bnRheEhpZ2hsaWdodGVyLnJlZ2V4TGliLm11bHRpTGluZVNpbmdsZVF1b3RlZFN0cmluZyxcdGNzczogJ3N0cmluZycgfSxcdFx0XHQvLyBzaW5nbGUgcXVvdGVkIHN0cmluZ3Ncblx0XHRcdHsgcmVnZXg6IG5ldyBSZWdFeHAodGhpcy5nZXRLZXl3b3JkcyhmdW5jcyksICdnbWknKSxcdFx0XHRcdGNzczogJ2NvbG9yMicgfSxcdFx0XHQvLyBmdW5jdGlvbnNcblx0XHRcdHsgcmVnZXg6IG5ldyBSZWdFeHAodGhpcy5nZXRLZXl3b3JkcyhvcGVyYXRvcnMpLCAnZ21pJyksXHRcdFx0Y3NzOiAnY29sb3IxJyB9LFx0XHRcdC8vIG9wZXJhdG9ycyBhbmQgc3VjaFxuXHRcdFx0eyByZWdleDogbmV3IFJlZ0V4cCh0aGlzLmdldEtleXdvcmRzKGtleXdvcmRzKSwgJ2dtaScpLFx0XHRcdFx0Y3NzOiAna2V5d29yZCcgfVx0XHRcdC8vIGtleXdvcmRcblx0XHRcdF07XG5cdH07XG5cblx0QnJ1c2gucHJvdG90eXBlXHQ9IG5ldyBTeW50YXhIaWdobGlnaHRlci5IaWdobGlnaHRlcigpO1xuXHRCcnVzaC5hbGlhc2VzXHQ9IFsnc3FsJ107XG5cblx0U3ludGF4SGlnaGxpZ2h0ZXIuYnJ1c2hlcy5TcWwgPSBCcnVzaDtcblxuXHQvLyBDb21tb25KU1xuXHR0eXBlb2YoZXhwb3J0cykgIT0gJ3VuZGVmaW5lZCcgPyBleHBvcnRzLkJydXNoID0gQnJ1c2ggOiBudWxsO1xufSkoKTtcblxuOyhmdW5jdGlvbigpXG57XG5cdC8vIENvbW1vbkpTXG5cdFN5bnRheEhpZ2hsaWdodGVyID0gU3ludGF4SGlnaGxpZ2h0ZXIgfHwgKHR5cGVvZiByZXF1aXJlICE9PSAndW5kZWZpbmVkJz8gcmVxdWlyZSgnc2hDb3JlJykuU3ludGF4SGlnaGxpZ2h0ZXIgOiBudWxsKTtcblxuXHRmdW5jdGlvbiBCcnVzaCgpXG5cdHtcblx0XHR2YXIga2V5d29yZHMgPVx0J0FkZEhhbmRsZXIgQWRkcmVzc09mIEFuZEFsc28gQWxpYXMgQW5kIEFuc2kgQXMgQXNzZW1ibHkgQXV0byAnICtcblx0XHRcdFx0XHRcdCdCb29sZWFuIEJ5UmVmIEJ5dGUgQnlWYWwgQ2FsbCBDYXNlIENhdGNoIENCb29sIENCeXRlIENDaGFyIENEYXRlICcgK1xuXHRcdFx0XHRcdFx0J0NEZWMgQ0RibCBDaGFyIENJbnQgQ2xhc3MgQ0xuZyBDT2JqIENvbnN0IENTaG9ydCBDU25nIENTdHIgQ1R5cGUgJyArXG5cdFx0XHRcdFx0XHQnRGF0ZSBEZWNpbWFsIERlY2xhcmUgRGVmYXVsdCBEZWxlZ2F0ZSBEaW0gRGlyZWN0Q2FzdCBEbyBEb3VibGUgRWFjaCAnICtcblx0XHRcdFx0XHRcdCdFbHNlIEVsc2VJZiBFbmQgRW51bSBFcmFzZSBFcnJvciBFdmVudCBFeGl0IEZhbHNlIEZpbmFsbHkgRm9yIEZyaWVuZCAnICtcblx0XHRcdFx0XHRcdCdGdW5jdGlvbiBHZXQgR2V0VHlwZSBHb1N1YiBHb1RvIEhhbmRsZXMgSWYgSW1wbGVtZW50cyBJbXBvcnRzIEluICcgK1xuXHRcdFx0XHRcdFx0J0luaGVyaXRzIEludGVnZXIgSW50ZXJmYWNlIElzIExldCBMaWIgTGlrZSBMb25nIExvb3AgTWUgTW9kIE1vZHVsZSAnICtcblx0XHRcdFx0XHRcdCdNdXN0SW5oZXJpdCBNdXN0T3ZlcnJpZGUgTXlCYXNlIE15Q2xhc3MgTmFtZXNwYWNlIE5ldyBOZXh0IE5vdCBOb3RoaW5nICcgK1xuXHRcdFx0XHRcdFx0J05vdEluaGVyaXRhYmxlIE5vdE92ZXJyaWRhYmxlIE9iamVjdCBPbiBPcHRpb24gT3B0aW9uYWwgT3IgT3JFbHNlICcgK1xuXHRcdFx0XHRcdFx0J092ZXJsb2FkcyBPdmVycmlkYWJsZSBPdmVycmlkZXMgUGFyYW1BcnJheSBQcmVzZXJ2ZSBQcml2YXRlIFByb3BlcnR5ICcgK1xuXHRcdFx0XHRcdFx0J1Byb3RlY3RlZCBQdWJsaWMgUmFpc2VFdmVudCBSZWFkT25seSBSZURpbSBSRU0gUmVtb3ZlSGFuZGxlciBSZXN1bWUgJyArXG5cdFx0XHRcdFx0XHQnUmV0dXJuIFNlbGVjdCBTZXQgU2hhZG93cyBTaGFyZWQgU2hvcnQgU2luZ2xlIFN0YXRpYyBTdGVwIFN0b3AgU3RyaW5nICcgK1xuXHRcdFx0XHRcdFx0J1N0cnVjdHVyZSBTdWIgU3luY0xvY2sgVGhlbiBUaHJvdyBUbyBUcnVlIFRyeSBUeXBlT2YgVW5pY29kZSBVbnRpbCAnICtcblx0XHRcdFx0XHRcdCdWYXJpYW50IFdoZW4gV2hpbGUgV2l0aCBXaXRoRXZlbnRzIFdyaXRlT25seSBYb3InO1xuXG5cdFx0dGhpcy5yZWdleExpc3QgPSBbXG5cdFx0XHR7IHJlZ2V4OiAvJy4qJC9nbSxcdFx0XHRcdFx0XHRcdFx0XHRcdGNzczogJ2NvbW1lbnRzJyB9LFx0XHRcdC8vIG9uZSBsaW5lIGNvbW1lbnRzXG5cdFx0XHR7IHJlZ2V4OiBTeW50YXhIaWdobGlnaHRlci5yZWdleExpYi5kb3VibGVRdW90ZWRTdHJpbmcsXHRjc3M6ICdzdHJpbmcnIH0sXHRcdFx0Ly8gc3RyaW5nc1xuXHRcdFx0eyByZWdleDogL15cXHMqIy4qJC9nbSxcdFx0XHRcdFx0XHRcdFx0XHRjc3M6ICdwcmVwcm9jZXNzb3InIH0sXHRcdC8vIHByZXByb2Nlc3NvciB0YWdzIGxpa2UgI3JlZ2lvbiBhbmQgI2VuZHJlZ2lvblxuXHRcdFx0eyByZWdleDogbmV3IFJlZ0V4cCh0aGlzLmdldEtleXdvcmRzKGtleXdvcmRzKSwgJ2dtJyksXHRjc3M6ICdrZXl3b3JkJyB9XHRcdFx0Ly8gdmIga2V5d29yZFxuXHRcdFx0XTtcblxuXHRcdHRoaXMuZm9ySHRtbFNjcmlwdChTeW50YXhIaWdobGlnaHRlci5yZWdleExpYi5hc3BTY3JpcHRUYWdzKTtcblx0fTtcblxuXHRCcnVzaC5wcm90b3R5cGVcdD0gbmV3IFN5bnRheEhpZ2hsaWdodGVyLkhpZ2hsaWdodGVyKCk7XG5cdEJydXNoLmFsaWFzZXNcdD0gWyd2YicsICd2Ym5ldCddO1xuXG5cdFN5bnRheEhpZ2hsaWdodGVyLmJydXNoZXMuVmIgPSBCcnVzaDtcblxuXHQvLyBDb21tb25KU1xuXHR0eXBlb2YoZXhwb3J0cykgIT0gJ3VuZGVmaW5lZCcgPyBleHBvcnRzLkJydXNoID0gQnJ1c2ggOiBudWxsO1xufSkoKTtcbjsoZnVuY3Rpb24oKVxue1xuXHQvLyBDb21tb25KU1xuXHRTeW50YXhIaWdobGlnaHRlciA9IFN5bnRheEhpZ2hsaWdodGVyIHx8ICh0eXBlb2YgcmVxdWlyZSAhPT0gJ3VuZGVmaW5lZCc/IHJlcXVpcmUoJ3NoQ29yZScpLlN5bnRheEhpZ2hsaWdodGVyIDogbnVsbCk7XG5cblx0ZnVuY3Rpb24gQnJ1c2goKVxuXHR7XG5cdFx0ZnVuY3Rpb24gcHJvY2VzcyhtYXRjaCwgcmVnZXhJbmZvKVxuXHRcdHtcblx0XHRcdHZhciBjb25zdHJ1Y3RvciA9IFN5bnRheEhpZ2hsaWdodGVyLk1hdGNoLFxuXHRcdFx0XHRjb2RlID0gbWF0Y2hbMF0sXG5cdFx0XHRcdHRhZyA9IG5ldyBYUmVnRXhwKCcoJmx0O3w8KVtcXFxcc1xcXFwvXFxcXD9dKig/PG5hbWU+WzpcXFxcdy1cXFxcLl0rKScsICd4ZycpLmV4ZWMoY29kZSksXG5cdFx0XHRcdHJlc3VsdCA9IFtdXG5cdFx0XHRcdDtcblx0XHRcblx0XHRcdGlmIChtYXRjaC5hdHRyaWJ1dGVzICE9IG51bGwpIFxuXHRcdFx0e1xuXHRcdFx0XHR2YXIgYXR0cmlidXRlcyxcblx0XHRcdFx0XHRyZWdleCA9IG5ldyBYUmVnRXhwKCcoPzxuYW1lPiBbXFxcXHc6XFxcXC1cXFxcLl0rKScgK1xuXHRcdFx0XHRcdFx0XHRcdFx0XHQnXFxcXHMqPVxcXFxzKicgK1xuXHRcdFx0XHRcdFx0XHRcdFx0XHQnKD88dmFsdWU+IFwiLio/XCJ8XFwnLio/XFwnfFxcXFx3KyknLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHQneGcnKTtcblxuXHRcdFx0XHR3aGlsZSAoKGF0dHJpYnV0ZXMgPSByZWdleC5leGVjKGNvZGUpKSAhPSBudWxsKSBcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHJlc3VsdC5wdXNoKG5ldyBjb25zdHJ1Y3RvcihhdHRyaWJ1dGVzLm5hbWUsIG1hdGNoLmluZGV4ICsgYXR0cmlidXRlcy5pbmRleCwgJ2NvbG9yMScpKTtcblx0XHRcdFx0XHRyZXN1bHQucHVzaChuZXcgY29uc3RydWN0b3IoYXR0cmlidXRlcy52YWx1ZSwgbWF0Y2guaW5kZXggKyBhdHRyaWJ1dGVzLmluZGV4ICsgYXR0cmlidXRlc1swXS5pbmRleE9mKGF0dHJpYnV0ZXMudmFsdWUpLCAnc3RyaW5nJykpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmICh0YWcgIT0gbnVsbClcblx0XHRcdFx0cmVzdWx0LnB1c2goXG5cdFx0XHRcdFx0bmV3IGNvbnN0cnVjdG9yKHRhZy5uYW1lLCBtYXRjaC5pbmRleCArIHRhZ1swXS5pbmRleE9mKHRhZy5uYW1lKSwgJ2tleXdvcmQnKVxuXHRcdFx0XHQpO1xuXG5cdFx0XHRyZXR1cm4gcmVzdWx0O1xuXHRcdH1cblx0XG5cdFx0dGhpcy5yZWdleExpc3QgPSBbXG5cdFx0XHR7IHJlZ2V4OiBuZXcgWFJlZ0V4cCgnKFxcXFwmbHQ7fDwpXFxcXCFcXFxcW1tcXFxcd1xcXFxzXSo/XFxcXFsoLnxcXFxccykqP1xcXFxdXFxcXF0oXFxcXCZndDt8PiknLCAnZ20nKSxcdFx0XHRjc3M6ICdjb2xvcjInIH0sXHQvLyA8IVsgLi4uIFsgLi4uIF1dPlxuXHRcdFx0eyByZWdleDogU3ludGF4SGlnaGxpZ2h0ZXIucmVnZXhMaWIueG1sQ29tbWVudHMsXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y3NzOiAnY29tbWVudHMnIH0sXHQvLyA8IS0tIC4uLiAtLT5cblx0XHRcdHsgcmVnZXg6IG5ldyBYUmVnRXhwKCcoJmx0O3w8KVtcXFxcc1xcXFwvXFxcXD9dKihcXFxcdyspKD88YXR0cmlidXRlcz4uKj8pW1xcXFxzXFxcXC9cXFxcP10qKCZndDt8PiknLCAnc2cnKSwgZnVuYzogcHJvY2VzcyB9XG5cdFx0XTtcblx0fTtcblxuXHRCcnVzaC5wcm90b3R5cGVcdD0gbmV3IFN5bnRheEhpZ2hsaWdodGVyLkhpZ2hsaWdodGVyKCk7XG5cdEJydXNoLmFsaWFzZXNcdD0gWyd4bWwnLCAneGh0bWwnLCAneHNsdCcsICdodG1sJ107XG5cblx0U3ludGF4SGlnaGxpZ2h0ZXIuYnJ1c2hlcy5YbWwgPSBCcnVzaDtcblxuXHQvLyBDb21tb25KU1xuXHR0eXBlb2YoZXhwb3J0cykgIT0gJ3VuZGVmaW5lZCcgPyBleHBvcnRzLkJydXNoID0gQnJ1c2ggOiBudWxsO1xufSkoKTtcbiJdLCJmaWxlIjoicGx1Z2lucy91ZWRpdG9yL3RoaXJkLXBhcnR5L1N5bnRheEhpZ2hsaWdodGVyL3NoQ29yZS5qcyJ9
