// CodeMirror version 2.2
//
// All functions that need access to the editor's state live inside
// the CodeMirror function. Below that, at the bottom of the file,
// some utilities are defined.

// CodeMirror is the only global var we claim
var CodeMirror = (function() {
    // This is the function that produces an editor instance. It's
    // closure is used to store the editor state.
    function CodeMirror(place, givenOptions) {
        // Determine effective options based on given values and defaults.
        var options = {}, defaults = CodeMirror.defaults;
        for (var opt in defaults)
            if (defaults.hasOwnProperty(opt))
                options[opt] = (givenOptions && givenOptions.hasOwnProperty(opt) ? givenOptions : defaults)[opt];

        var targetDocument = options["document"];
        // The element in which the editor lives.
        var wrapper = targetDocument.createElement("div");
        wrapper.className = "CodeMirror" + (options.lineWrapping ? " CodeMirror-wrap" : "");
        // This mess creates the base DOM structure for the editor.
        wrapper.innerHTML =
            '<div style="overflow: hidden; position: relative; width: 3px; height: 0px;">' + // Wraps and hides input textarea
                '<textarea style="position: absolute; padding: 0; width: 1px;" wrap="off" ' +
                'autocorrect="off" autocapitalize="off"></textarea></div>' +
                '<div class="CodeMirror-scroll" tabindex="-1">' +
                '<div style="position: relative">' + // Set to the height of the text, causes scrolling
                '<div style="position: relative">' + // Moved around its parent to cover visible view
                '<div class="CodeMirror-gutter"><div class="CodeMirror-gutter-text"></div></div>' +
                // Provides positioning relative to (visible) text origin
                '<div class="CodeMirror-lines"><div style="position: relative">' +
                '<div style="position: absolute; width: 100%; height: 0; overflow: hidden; visibility: hidden"></div>' +
                '<pre class="CodeMirror-cursor">&#160;</pre>' + // Absolutely positioned blinky cursor
                '<div></div>' + // This DIV contains the actual code
                '</div></div></div></div></div>';
        if (place.appendChild) place.appendChild(wrapper); else place(wrapper);
        // I've never seen more elegant code in my life.
        var inputDiv = wrapper.firstChild, input = inputDiv.firstChild,
            scroller = wrapper.lastChild, code = scroller.firstChild,
            mover = code.firstChild, gutter = mover.firstChild, gutterText = gutter.firstChild,
            lineSpace = gutter.nextSibling.firstChild, measure = lineSpace.firstChild,
            cursor = measure.nextSibling, lineDiv = cursor.nextSibling;
        themeChanged();
        // Needed to hide big blue blinking cursor on Mobile Safari
        if (/AppleWebKit/.test(navigator.userAgent) && /Mobile\/\w+/.test(navigator.userAgent)) input.style.width = "0px";
        if (!webkit) lineSpace.draggable = true;
        if (options.tabindex != null) input.tabIndex = options.tabindex;
        if (!options.gutter && !options.lineNumbers) gutter.style.display = "none";

        // Check for problem with IE innerHTML not working when we have a
        // P (or similar) parent node.
        try { stringWidth("x"); }
        catch (e) {
            if (e.message.match(/runtime/i))
                e = new Error("A CodeMirror inside a P-style element does not work in Internet Explorer. (innerHTML bug)");
            throw e;
        }

        // Delayed object wrap timeouts, making sure only one is active. blinker holds an interval.
        var poll = new Delayed(), highlight = new Delayed(), blinker;

        // mode holds a mode API object. doc is the tree of Line objects,
        // work an array of lines that should be parsed, and history the
        // undo history (instance of History constructor).
        var mode, doc = new BranchChunk([new LeafChunk([new Line("")])]), work, focused;
        loadMode();
        // The selection. These are always maintained to point at valid
        // positions. Inverted is used to remember that the user is
        // selecting bottom-to-top.
        var sel = {from: {line: 0, ch: 0}, to: {line: 0, ch: 0}, inverted: false};
        // Selection-related flags. shiftSelecting obviously tracks
        // whether the user is holding shift.
        var shiftSelecting, lastClick, lastDoubleClick, draggingText, overwrite = false;
        // Variables used by startOperation/endOperation to track what
        // happened during the operation.
        var updateInput, userSelChange, changes, textChanged, selectionChanged, leaveInputAlone,
            gutterDirty, callbacks;
        // Current visible range (may be bigger than the view window).
        var displayOffset = 0, showingFrom = 0, showingTo = 0, lastSizeC = 0;
        // bracketHighlighted is used to remember that a backet has been
        // marked.
        var bracketHighlighted;
        // Tracks the maximum line length so that the horizontal scrollbar
        // can be kept static when scrolling.
        var maxLine = "", maxWidth, tabText = computeTabText();

        // Initialize the content.
        operation(function(){setValue(options.value || ""); updateInput = false;})();
        var history = new History();

        // Register our event handlers.
        connect(scroller, "mousedown", operation(onMouseDown));
        connect(scroller, "dblclick", operation(onDoubleClick));
        connect(lineSpace, "dragstart", onDragStart);
        connect(lineSpace, "selectstart", e_preventDefault);
        // Gecko browsers fire contextmenu *after* opening the menu, at
        // which point we can't mess with it anymore. Context menu is
        // handled in onMouseDown for Gecko.
        if (!gecko) connect(scroller, "contextmenu", onContextMenu);
        connect(scroller, "scroll", function() {
            updateDisplay([]);
            if (options.fixedGutter) gutter.style.left = scroller.scrollLeft + "px";
            if (options.onScroll) options.onScroll(instance);
        });
        connect(window, "resize", function() {updateDisplay(true);});
        connect(input, "keyup", operation(onKeyUp));
        connect(input, "input", fastPoll);
        connect(input, "keydown", operation(onKeyDown));
        connect(input, "keypress", operation(onKeyPress));
        connect(input, "focus", onFocus);
        connect(input, "blur", onBlur);

        connect(scroller, "dragenter", e_stop);
        connect(scroller, "dragover", e_stop);
        connect(scroller, "drop", operation(onDrop));
        connect(scroller, "paste", function(){focusInput(); fastPoll();});
        connect(input, "paste", fastPoll);
        connect(input, "cut", operation(function(){replaceSelection("");}));

        // IE throws unspecified error in certain cases, when
        // trying to access activeElement before onload
        var hasFocus; try { hasFocus = (targetDocument.activeElement == input); } catch(e) { }
        if (hasFocus) setTimeout(onFocus, 20);
        else onBlur();

        function isLine(l) {return l >= 0 && l < doc.size;}
        // The instance object that we'll return. Mostly calls out to
        // local functions in the CodeMirror function. Some do some extra
        // range checking and/or clipping. operation is used to wrap the
        // call so that changes it makes are tracked, and the display is
        // updated afterwards.
        var instance = wrapper.CodeMirror = {
            getValue: getValue,
            setValue: operation(setValue),
            getSelection: getSelection,
            replaceSelection: operation(replaceSelection),
            focus: function(){focusInput(); onFocus(); fastPoll();},
            setOption: function(option, value) {
                var oldVal = options[option];
                options[option] = value;
                if (option == "mode" || option == "indentUnit") loadMode();
                else if (option == "readOnly" && value) {onBlur(); input.blur();}
                else if (option == "theme") themeChanged();
                else if (option == "lineWrapping" && oldVal != value) operation(wrappingChanged)();
                else if (option == "tabSize") operation(tabsChanged)();
                if (option == "lineNumbers" || option == "gutter" || option == "firstLineNumber" || option == "theme")
                    operation(gutterChanged)();
            },
            getOption: function(option) {return options[option];},
            undo: operation(undo),
            redo: operation(redo),
            indentLine: operation(function(n, dir) {
                if (isLine(n)) indentLine(n, dir == null ? "smart" : dir ? "add" : "subtract");
            }),
            indentSelection: operation(indentSelected),
            historySize: function() {return {undo: history.done.length, redo: history.undone.length};},
            clearHistory: function() {history = new History();},
            matchBrackets: operation(function(){matchBrackets(true);}),
            getTokenAt: operation(function(pos) {
                pos = clipPos(pos);
                return getLine(pos.line).getTokenAt(mode, getStateBefore(pos.line), pos.ch);
            }),
            getStateAfter: function(line) {
                line = clipLine(line == null ? doc.size - 1: line);
                return getStateBefore(line + 1);
            },
            cursorCoords: function(start){
                if (start == null) start = sel.inverted;
                return pageCoords(start ? sel.from : sel.to);
            },
            charCoords: function(pos){return pageCoords(clipPos(pos));},
            coordsChar: function(coords) {
                var off = eltOffset(lineSpace);
                return coordsChar(coords.x - off.left, coords.y - off.top);
            },
            markText: operation(markText),
            setBookmark: setBookmark,
            setMarker: operation(addGutterMarker),
            clearMarker: operation(removeGutterMarker),
            setLineClass: operation(setLineClass),
            hideLine: operation(function(h) {return setLineHidden(h, true);}),
            showLine: operation(function(h) {return setLineHidden(h, false);}),
            onDeleteLine: function(line, f) {
                if (typeof line == "number") {
                    if (!isLine(line)) return null;
                    line = getLine(line);
                }
                (line.handlers || (line.handlers = [])).push(f);
                return line;
            },
            lineInfo: lineInfo,
            addWidget: function(pos, node, scroll, vert, horiz) {
                pos = localCoords(clipPos(pos));
                var top = pos.yBot, left = pos.x;
                node.style.position = "absolute";
                code.appendChild(node);
                if (vert == "over") top = pos.y;
                else if (vert == "near") {
                    var vspace = Math.max(scroller.offsetHeight, doc.height * textHeight()),
                        hspace = Math.max(code.clientWidth, lineSpace.clientWidth) - paddingLeft();
                    if (pos.yBot + node.offsetHeight > vspace && pos.y > node.offsetHeight)
                        top = pos.y - node.offsetHeight;
                    if (left + node.offsetWidth > hspace)
                        left = hspace - node.offsetWidth;
                }
                node.style.top = (top + paddingTop()) + "px";
                node.style.left = node.style.right = "";
                if (horiz == "right") {
                    left = code.clientWidth - node.offsetWidth;
                    node.style.right = "0px";
                } else {
                    if (horiz == "left") left = 0;
                    else if (horiz == "middle") left = (code.clientWidth - node.offsetWidth) / 2;
                    node.style.left = (left + paddingLeft()) + "px";
                }
                if (scroll)
                    scrollIntoView(left, top, left + node.offsetWidth, top + node.offsetHeight);
            },

            lineCount: function() {return doc.size;},
            clipPos: clipPos,
            getCursor: function(start) {
                if (start == null) start = sel.inverted;
                return copyPos(start ? sel.from : sel.to);
            },
            somethingSelected: function() {return !posEq(sel.from, sel.to);},
            setCursor: operation(function(line, ch, user) {
                if (ch == null && typeof line.line == "number") setCursor(line.line, line.ch, user);
                else setCursor(line, ch, user);
            }),
            setSelection: operation(function(from, to, user) {
                (user ? setSelectionUser : setSelection)(clipPos(from), clipPos(to || from));
            }),
            getLine: function(line) {if (isLine(line)) return getLine(line).text;},
            getLineHandle: function(line) {if (isLine(line)) return getLine(line);},
            setLine: operation(function(line, text) {
                if (isLine(line)) replaceRange(text, {line: line, ch: 0}, {line: line, ch: getLine(line).text.length});
            }),
            removeLine: operation(function(line) {
                if (isLine(line)) replaceRange("", {line: line, ch: 0}, clipPos({line: line+1, ch: 0}));
            }),
            replaceRange: operation(replaceRange),
            getRange: function(from, to) {return getRange(clipPos(from), clipPos(to));},

            execCommand: function(cmd) {return commands[cmd](instance);},
            // Stuff used by commands, probably not much use to outside code.
            moveH: operation(moveH),
            deleteH: operation(deleteH),
            moveV: operation(moveV),
            toggleOverwrite: function() {overwrite = !overwrite;},

            posFromIndex: function(off) {
                var lineNo = 0, ch;
                doc.iter(0, doc.size, function(line) {
                    var sz = line.text.length + 1;
                    if (sz > off) { ch = off; return true; }
                    off -= sz;
                    ++lineNo;
                });
                return clipPos({line: lineNo, ch: ch});
            },
            indexFromPos: function (coords) {
                if (coords.line < 0 || coords.ch < 0) return 0;
                var index = coords.ch;
                doc.iter(0, coords.line, function (line) {
                    index += line.text.length + 1;
                });
                return index;
            },

            operation: function(f){return operation(f)();},
            refresh: function(){updateDisplay(true);},
            getInputField: function(){return input;},
            getWrapperElement: function(){return wrapper;},
            getScrollerElement: function(){return scroller;},
            getGutterElement: function(){return gutter;}
        };

        function getLine(n) { return getLineAt(doc, n); }
        function updateLineHeight(line, height) {
            gutterDirty = true;
            var diff = height - line.height;
            for (var n = line; n; n = n.parent) n.height += diff;
        }

        function setValue(code) {
            var top = {line: 0, ch: 0};
            updateLines(top, {line: doc.size - 1, ch: getLine(doc.size-1).text.length},
                splitLines(code), top, top);
            updateInput = true;
        }
        function getValue(code) {
            var text = [];
            doc.iter(0, doc.size, function(line) { text.push(line.text); });
            return text.join("\n");
        }

        function onMouseDown(e) {
            setShift(e.shiftKey);
            // Check whether this is a click in a widget
            for (var n = e_target(e); n != wrapper; n = n.parentNode)
                if (n.parentNode == code && n != mover) return;

            // See if this is a click in the gutter
            for (var n = e_target(e); n != wrapper; n = n.parentNode)
                if (n.parentNode == gutterText) {
                    if (options.onGutterClick)
                        options.onGutterClick(instance, indexOf(gutterText.childNodes, n) + showingFrom, e);
                    return e_preventDefault(e);
                }

            var start = posFromMouse(e);

            switch (e_button(e)) {
                case 3:
                    if (gecko && !mac) onContextMenu(e);
                    return;
                case 2:
                    if (start) setCursor(start.line, start.ch, true);
                    return;
            }
            // For button 1, if it was clicked inside the editor
            // (posFromMouse returning non-null), we have to adjust the
            // selection.
            if (!start) {if (e_target(e) == scroller) e_preventDefault(e); return;}

            if (!focused) onFocus();

            var now = +new Date;
            if (lastDoubleClick && lastDoubleClick.time > now - 400 && posEq(lastDoubleClick.pos, start)) {
                e_preventDefault(e);
                setTimeout(focusInput, 20);
                return selectLine(start.line);
            } else if (lastClick && lastClick.time > now - 400 && posEq(lastClick.pos, start)) {
                lastDoubleClick = {time: now, pos: start};
                e_preventDefault(e);
                return selectWordAt(start);
            } else { lastClick = {time: now, pos: start}; }

            var last = start, going;
            if (dragAndDrop && !posEq(sel.from, sel.to) &&
                !posLess(start, sel.from) && !posLess(sel.to, start)) {
                // Let the drag handler handle this.
                if (webkit) lineSpace.draggable = true;
                var up = connect(targetDocument, "mouseup", operation(function(e2) {
                    if (webkit) lineSpace.draggable = false;
                    draggingText = false;
                    up();
                    if (Math.abs(e.clientX - e2.clientX) + Math.abs(e.clientY - e2.clientY) < 10) {
                        e_preventDefault(e2);
                        setCursor(start.line, start.ch, true);
                        focusInput();
                    }
                }), true);
                draggingText = true;
                return;
            }
            e_preventDefault(e);
            setCursor(start.line, start.ch, true);

            function extend(e) {
                var cur = posFromMouse(e, true);
                if (cur && !posEq(cur, last)) {
                    if (!focused) onFocus();
                    last = cur;
                    setSelectionUser(start, cur);
                    updateInput = false;
                    var visible = visibleLines();
                    if (cur.line >= visible.to || cur.line < visible.from)
                        going = setTimeout(operation(function(){extend(e);}), 150);
                }
            }

            var move = connect(targetDocument, "mousemove", operation(function(e) {
                clearTimeout(going);
                e_preventDefault(e);
                extend(e);
            }), true);
            var up = connect(targetDocument, "mouseup", operation(function(e) {
                clearTimeout(going);
                var cur = posFromMouse(e);
                if (cur) setSelectionUser(start, cur);
                e_preventDefault(e);
                focusInput();
                updateInput = true;
                move(); up();
            }), true);
        }
        function onDoubleClick(e) {
            for (var n = e_target(e); n != wrapper; n = n.parentNode)
                if (n.parentNode == gutterText) return e_preventDefault(e);
            var start = posFromMouse(e);
            if (!start) return;
            lastDoubleClick = {time: +new Date, pos: start};
            e_preventDefault(e);
            selectWordAt(start);
        }
        function onDrop(e) {
            e.preventDefault();
            var pos = posFromMouse(e, true), files = e.dataTransfer.files;
            if (!pos || options.readOnly) return;
            if (files && files.length && window.FileReader && window.File) {
                function loadFile(file, i) {
                    var reader = new FileReader;
                    reader.onload = function() {
                        text[i] = reader.result;
                        if (++read == n) {
                            pos = clipPos(pos);
                            operation(function() {
                                var end = replaceRange(text.join(""), pos, pos);
                                setSelectionUser(pos, end);
                            })();
                        }
                    };
                    reader.readAsText(file);
                }
                var n = files.length, text = Array(n), read = 0;
                for (var i = 0; i < n; ++i) loadFile(files[i], i);
            }
            else {
                try {
                    var text = e.dataTransfer.getData("Text");
                    if (text) {
                        var end = replaceRange(text, pos, pos);
                        var curFrom = sel.from, curTo = sel.to;
                        setSelectionUser(pos, end);
                        if (draggingText) replaceRange("", curFrom, curTo);
                        focusInput();
                    }
                }
                catch(e){}
            }
        }
        function onDragStart(e) {
            var txt = getSelection();
            // This will reset escapeElement
            htmlEscape(txt);
            e.dataTransfer.setDragImage(escapeElement, 0, 0);
            e.dataTransfer.setData("Text", txt);
        }
        function handleKeyBinding(e) {
            var name = keyNames[e.keyCode], next = keyMap[options.keyMap].auto, bound, dropShift;
            if (name == null || e.altGraphKey) {
                if (next) options.keyMap = next;
                return null;
            }
            if (e.altKey) name = "Alt-" + name;
            if (e.ctrlKey) name = "Ctrl-" + name;
            if (e.metaKey) name = "Cmd-" + name;
            if (e.shiftKey && (bound = lookupKey("Shift-" + name, options.extraKeys, options.keyMap))) {
                dropShift = true;
            } else {
                bound = lookupKey(name, options.extraKeys, options.keyMap);
            }
            if (typeof bound == "string") {
                if (commands.propertyIsEnumerable(bound)) bound = commands[bound];
                else bound = null;
            }
            if (next && (bound || !isModifierKey(e))) options.keyMap = next;
            if (!bound) return false;
            if (dropShift) {
                var prevShift = shiftSelecting;
                shiftSelecting = null;
                bound(instance);
                shiftSelecting = prevShift;
            } else bound(instance);
            e_preventDefault(e);
            return true;
        }
        var lastStoppedKey = null;
        function onKeyDown(e) {
            if (!focused) onFocus();
            var code = e.keyCode;
            // IE does strange things with escape.
            if (ie && code == 27) { e.returnValue = false; }
            setShift(code == 16 || e.shiftKey);
            // First give onKeyEvent option a chance to handle this.
            if (options.onKeyEvent && options.onKeyEvent(instance, addStop(e))) return;
            var handled = handleKeyBinding(e);
            if (window.opera) {
                lastStoppedKey = handled ? e.keyCode : null;
                // Opera has no cut event... we try to at least catch the key combo
                if (!handled && (mac ? e.metaKey : e.ctrlKey) && e.keyCode == 88)
                    replaceSelection("");
            }
        }
        function onKeyPress(e) {
            if (window.opera && e.keyCode == lastStoppedKey) {lastStoppedKey = null; e_preventDefault(e); return;}
            if (options.onKeyEvent && options.onKeyEvent(instance, addStop(e))) return;
            if (window.opera && !e.which && handleKeyBinding(e)) return;
            if (options.electricChars && mode.electricChars) {
                var ch = String.fromCharCode(e.charCode == null ? e.keyCode : e.charCode);
                if (mode.electricChars.indexOf(ch) > -1)
                    setTimeout(operation(function() {indentLine(sel.to.line, "smart");}), 75);
            }
            fastPoll();
        }
        function onKeyUp(e) {
            if (options.onKeyEvent && options.onKeyEvent(instance, addStop(e))) return;
            if (e.keyCode == 16) shiftSelecting = null;
        }

        function onFocus() {
            if (options.readOnly) return;
            if (!focused) {
                if (options.onFocus) options.onFocus(instance);
                focused = true;
                if (wrapper.className.search(/\bCodeMirror-focused\b/) == -1)
                    wrapper.className += " CodeMirror-focused";
                if (!leaveInputAlone) resetInput(true);
            }
            slowPoll();
            restartBlink();
        }
        function onBlur() {
            if (focused) {
                if (options.onBlur) options.onBlur(instance);
                focused = false;
                wrapper.className = wrapper.className.replace(" CodeMirror-focused", "");
            }
            clearInterval(blinker);
            setTimeout(function() {if (!focused) shiftSelecting = null;}, 150);
        }

        // Replace the range from from to to by the strings in newText.
        // Afterwards, set the selection to selFrom, selTo.
        function updateLines(from, to, newText, selFrom, selTo) {
            if (history) {
                var old = [];
                doc.iter(from.line, to.line + 1, function(line) { old.push(line.text); });
                history.addChange(from.line, newText.length, old);
                while (history.done.length > options.undoDepth) history.done.shift();
            }
            updateLinesNoUndo(from, to, newText, selFrom, selTo);
        }
        function unredoHelper(from, to) {
            var change = from.pop();
            if (change) {
                var replaced = [], end = change.start + change.added;
                doc.iter(change.start, end, function(line) { replaced.push(line.text); });
                to.push({start: change.start, added: change.old.length, old: replaced});
                var pos = clipPos({line: change.start + change.old.length - 1,
                    ch: editEnd(replaced[replaced.length-1], change.old[change.old.length-1])});
                updateLinesNoUndo({line: change.start, ch: 0}, {line: end - 1, ch: getLine(end-1).text.length}, change.old, pos, pos);
                updateInput = true;
            }
        }
        function undo() {unredoHelper(history.done, history.undone);}
        function redo() {unredoHelper(history.undone, history.done);}

        function updateLinesNoUndo(from, to, newText, selFrom, selTo) {
            var recomputeMaxLength = false, maxLineLength = maxLine.length;
            if (!options.lineWrapping)
                doc.iter(from.line, to.line, function(line) {
                    if (line.text.length == maxLineLength) {recomputeMaxLength = true; return true;}
                });
            if (from.line != to.line || newText.length > 1) gutterDirty = true;

            var nlines = to.line - from.line, firstLine = getLine(from.line), lastLine = getLine(to.line);
            // First adjust the line structure, taking some care to leave highlighting intact.
            if (from.ch == 0 && to.ch == 0 && newText[newText.length - 1] == "") {
                // This is a whole-line replace. Treated specially to make
                // sure line objects move the way they are supposed to.
                var added = [], prevLine = null;
                if (from.line) {
                    prevLine = getLine(from.line - 1);
                    prevLine.fixMarkEnds(lastLine);
                } else lastLine.fixMarkStarts();
                for (var i = 0, e = newText.length - 1; i < e; ++i)
                    added.push(Line.inheritMarks(newText[i], prevLine));
                if (nlines) doc.remove(from.line, nlines, callbacks);
                if (added.length) doc.insert(from.line, added);
            } else if (firstLine == lastLine) {
                if (newText.length == 1)
                    firstLine.replace(from.ch, to.ch, newText[0]);
                else {
                    lastLine = firstLine.split(to.ch, newText[newText.length-1]);
                    firstLine.replace(from.ch, null, newText[0]);
                    firstLine.fixMarkEnds(lastLine);
                    var added = [];
                    for (var i = 1, e = newText.length - 1; i < e; ++i)
                        added.push(Line.inheritMarks(newText[i], firstLine));
                    added.push(lastLine);
                    doc.insert(from.line + 1, added);
                }
            } else if (newText.length == 1) {
                firstLine.replace(from.ch, null, newText[0]);
                lastLine.replace(null, to.ch, "");
                firstLine.append(lastLine);
                doc.remove(from.line + 1, nlines, callbacks);
            } else {
                var added = [];
                firstLine.replace(from.ch, null, newText[0]);
                lastLine.replace(null, to.ch, newText[newText.length-1]);
                firstLine.fixMarkEnds(lastLine);
                for (var i = 1, e = newText.length - 1; i < e; ++i)
                    added.push(Line.inheritMarks(newText[i], firstLine));
                if (nlines > 1) doc.remove(from.line + 1, nlines - 1, callbacks);
                doc.insert(from.line + 1, added);
            }
            if (options.lineWrapping) {
                var perLine = scroller.clientWidth / charWidth() - 3;
                doc.iter(from.line, from.line + newText.length, function(line) {
                    if (line.hidden) return;
                    var guess = Math.ceil(line.text.length / perLine) || 1;
                    if (guess != line.height) updateLineHeight(line, guess);
                });
            } else {
                doc.iter(from.line, i + newText.length, function(line) {
                    var l = line.text;
                    if (l.length > maxLineLength) {
                        maxLine = l; maxLineLength = l.length; maxWidth = null;
                        recomputeMaxLength = false;
                    }
                });
                if (recomputeMaxLength) {
                    maxLineLength = 0; maxLine = ""; maxWidth = null;
                    doc.iter(0, doc.size, function(line) {
                        var l = line.text;
                        if (l.length > maxLineLength) {
                            maxLineLength = l.length; maxLine = l;
                        }
                    });
                }
            }

            // Add these lines to the work array, so that they will be
            // highlighted. Adjust work lines if lines were added/removed.
            var newWork = [], lendiff = newText.length - nlines - 1;
            for (var i = 0, l = work.length; i < l; ++i) {
                var task = work[i];
                if (task < from.line) newWork.push(task);
                else if (task > to.line) newWork.push(task + lendiff);
            }
            var hlEnd = from.line + Math.min(newText.length, 500);
            highlightLines(from.line, hlEnd);
            newWork.push(hlEnd);
            work = newWork;
            startWorker(100);
            // Remember that these lines changed, for updating the display
            changes.push({from: from.line, to: to.line + 1, diff: lendiff});
            var changeObj = {from: from, to: to, text: newText};
            if (textChanged) {
                for (var cur = textChanged; cur.next; cur = cur.next) {}
                cur.next = changeObj;
            } else textChanged = changeObj;

            // Update the selection
            function updateLine(n) {return n <= Math.min(to.line, to.line + lendiff) ? n : n + lendiff;}
            setSelection(selFrom, selTo, updateLine(sel.from.line), updateLine(sel.to.line));

            // Make sure the scroll-size div has the correct height.
            code.style.height = (doc.height * textHeight() + 2 * paddingTop()) + "px";
        }

        function replaceRange(code, from, to) {
            from = clipPos(from);
            if (!to) to = from; else to = clipPos(to);
            code = splitLines(code);
            function adjustPos(pos) {
                if (posLess(pos, from)) return pos;
                if (!posLess(to, pos)) return end;
                var line = pos.line + code.length - (to.line - from.line) - 1;
                var ch = pos.ch;
                if (pos.line == to.line)
                    ch += code[code.length-1].length - (to.ch - (to.line == from.line ? from.ch : 0));
                return {line: line, ch: ch};
            }
            var end;
            replaceRange1(code, from, to, function(end1) {
                end = end1;
                return {from: adjustPos(sel.from), to: adjustPos(sel.to)};
            });
            return end;
        }
        function replaceSelection(code, collapse) {
            replaceRange1(splitLines(code), sel.from, sel.to, function(end) {
                if (collapse == "end") return {from: end, to: end};
                else if (collapse == "start") return {from: sel.from, to: sel.from};
                else return {from: sel.from, to: end};
            });
        }
        function replaceRange1(code, from, to, computeSel) {
            var endch = code.length == 1 ? code[0].length + from.ch : code[code.length-1].length;
            var newSel = computeSel({line: from.line + code.length - 1, ch: endch});
            updateLines(from, to, code, newSel.from, newSel.to);
        }

        function getRange(from, to) {
            var l1 = from.line, l2 = to.line;
            if (l1 == l2) return getLine(l1).text.slice(from.ch, to.ch);
            var code = [getLine(l1).text.slice(from.ch)];
            doc.iter(l1 + 1, l2, function(line) { code.push(line.text); });
            code.push(getLine(l2).text.slice(0, to.ch));
            return code.join("\n");
        }
        function getSelection() {
            return getRange(sel.from, sel.to);
        }

        var pollingFast = false; // Ensures slowPoll doesn't cancel fastPoll
        function slowPoll() {
            if (pollingFast) return;
            poll.set(options.pollInterval, function() {
                startOperation();
                readInput();
                if (focused) slowPoll();
                endOperation();
            });
        }
        function fastPoll() {
            var missed = false;
            pollingFast = true;
            function p() {
                startOperation();
                var changed = readInput();
                if (!changed && !missed) {missed = true; poll.set(60, p);}
                else {pollingFast = false; slowPoll();}
                endOperation();
            }
            poll.set(20, p);
        }

        // Previnput is a hack to work with IME. If we reset the textarea
        // on every change, that breaks IME. So we look for changes
        // compared to the previous content instead. (Modern browsers have
        // events that indicate IME taking place, but these are not widely
        // supported or compatible enough yet to rely on.)
        var prevInput = "";
        function readInput() {
            if (leaveInputAlone || !focused || hasSelection(input)) return false;
            var text = input.value;
            if (text == prevInput) return false;
            shiftSelecting = null;
            var same = 0, l = Math.min(prevInput.length, text.length);
            while (same < l && prevInput[same] == text[same]) ++same;
            if (same < prevInput.length)
                sel.from = {line: sel.from.line, ch: sel.from.ch - (prevInput.length - same)};
            else if (overwrite && posEq(sel.from, sel.to))
                sel.to = {line: sel.to.line, ch: Math.min(getLine(sel.to.line).text.length, sel.to.ch + (text.length - same))};
            replaceSelection(text.slice(same), "end");
            prevInput = text;
            return true;
        }
        function resetInput(user) {
            if (!posEq(sel.from, sel.to)) {
                prevInput = "";
                input.value = getSelection();
                input.select();
            } else if (user) prevInput = input.value = "";
        }

        function focusInput() {
            if (!options.readOnly) input.focus();
        }

        function scrollEditorIntoView() {
            if (!cursor.getBoundingClientRect) return;
            var rect = cursor.getBoundingClientRect();
            // IE returns bogus coordinates when the instance sits inside of an iframe and the cursor is hidden
            if (ie && rect.top == rect.bottom) return;
            var winH = window.innerHeight || Math.max(document.body.offsetHeight, document.documentElement.offsetHeight);
            if (rect.top < 0 || rect.bottom > winH) cursor.scrollIntoView();
        }
        function scrollCursorIntoView() {
            var cursor = localCoords(sel.inverted ? sel.from : sel.to);
            var x = options.lineWrapping ? Math.min(cursor.x, lineSpace.offsetWidth) : cursor.x;
            return scrollIntoView(x, cursor.y, x, cursor.yBot);
        }
        function scrollIntoView(x1, y1, x2, y2) {
            var pl = paddingLeft(), pt = paddingTop(), lh = textHeight();
            y1 += pt; y2 += pt; x1 += pl; x2 += pl;
            var screen = scroller.clientHeight, screentop = scroller.scrollTop, scrolled = false, result = true;
            if (y1 < screentop) {scroller.scrollTop = Math.max(0, y1 - 2*lh); scrolled = true;}
            else if (y2 > screentop + screen) {scroller.scrollTop = y2 + lh - screen; scrolled = true;}

            var screenw = scroller.clientWidth, screenleft = scroller.scrollLeft;
            var gutterw = options.fixedGutter ? gutter.clientWidth : 0;
            if (x1 < screenleft + gutterw) {
                if (x1 < 50) x1 = 0;
                scroller.scrollLeft = Math.max(0, x1 - 10 - gutterw);
                scrolled = true;
            }
            else if (x2 > screenw + screenleft - 3) {
                scroller.scrollLeft = x2 + 10 - screenw;
                scrolled = true;
                if (x2 > code.clientWidth) result = false;
            }
            if (scrolled && options.onScroll) options.onScroll(instance);
            return result;
        }

        function visibleLines() {
            var lh = textHeight(), top = scroller.scrollTop - paddingTop();
            var from_height = Math.max(0, Math.floor(top / lh));
            var to_height = Math.ceil((top + scroller.clientHeight) / lh);
            return {from: lineAtHeight(doc, from_height),
                to: lineAtHeight(doc, to_height)};
        }
        // Uses a set of changes plus the current scroll position to
        // determine which DOM updates have to be made, and makes the
        // updates.
        function updateDisplay(changes, suppressCallback) {
            if (!scroller.clientWidth) {
                showingFrom = showingTo = displayOffset = 0;
                return;
            }
            // Compute the new visible window
            var visible = visibleLines();
            // Bail out if the visible area is already rendered and nothing changed.
            if (changes !== true && changes.length == 0 && visible.from >= showingFrom && visible.to <= showingTo) return;
            var from = Math.max(visible.from - 100, 0), to = Math.min(doc.size, visible.to + 100);
            if (showingFrom < from && from - showingFrom < 20) from = showingFrom;
            if (showingTo > to && showingTo - to < 20) to = Math.min(doc.size, showingTo);

            // Create a range of theoretically intact lines, and punch holes
            // in that using the change info.
            var intact = changes === true ? [] :
                computeIntact([{from: showingFrom, to: showingTo, domStart: 0}], changes);
            // Clip off the parts that won't be visible
            var intactLines = 0;
            for (var i = 0; i < intact.length; ++i) {
                var range = intact[i];
                if (range.from < from) {range.domStart += (from - range.from); range.from = from;}
                if (range.to > to) range.to = to;
                if (range.from >= range.to) intact.splice(i--, 1);
                else intactLines += range.to - range.from;
            }
            if (intactLines == to - from) return;
            intact.sort(function(a, b) {return a.domStart - b.domStart;});

            var th = textHeight(), gutterDisplay = gutter.style.display;
            lineDiv.style.display = gutter.style.display = "none";
            patchDisplay(from, to, intact);
            lineDiv.style.display = "";

            // Position the mover div to align with the lines it's supposed
            // to be showing (which will cover the visible display)
            var different = from != showingFrom || to != showingTo || lastSizeC != scroller.clientHeight + th;
            // This is just a bogus formula that detects when the editor is
            // resized or the font size changes.
            if (different) lastSizeC = scroller.clientHeight + th;
            showingFrom = from; showingTo = to;
            displayOffset = heightAtLine(doc, from);
            mover.style.top = (displayOffset * th) + "px";
            code.style.height = (doc.height * th + 2 * paddingTop()) + "px";

            // Since this is all rather error prone, it is honoured with the
            // only assertion in the whole file.
            if (lineDiv.childNodes.length != showingTo - showingFrom)
                throw new Error("BAD PATCH! " + JSON.stringify(intact) + " size=" + (showingTo - showingFrom) +
                    " nodes=" + lineDiv.childNodes.length);

            if (options.lineWrapping) {
                maxWidth = scroller.clientWidth;
                var curNode = lineDiv.firstChild;
                doc.iter(showingFrom, showingTo, function(line) {
                    if (!line.hidden) {
                        var height = Math.round(curNode.offsetHeight / th) || 1;
                        if (line.height != height) {updateLineHeight(line, height); gutterDirty = true;}
                    }
                    curNode = curNode.nextSibling;
                });
            } else {
                if (maxWidth == null) maxWidth = stringWidth(maxLine);
                if (maxWidth > scroller.clientWidth) {
                    lineSpace.style.width = maxWidth + "px";
                    // Needed to prevent odd wrapping/hiding of widgets placed in here.
                    code.style.width = "";
                    code.style.width = scroller.scrollWidth + "px";
                } else {
                    lineSpace.style.width = code.style.width = "";
                }
            }
            gutter.style.display = gutterDisplay;
            if (different || gutterDirty) updateGutter();
            updateCursor();
            if (!suppressCallback && options.onUpdate) options.onUpdate(instance);
            return true;
        }

        function computeIntact(intact, changes) {
            for (var i = 0, l = changes.length || 0; i < l; ++i) {
                var change = changes[i], intact2 = [], diff = change.diff || 0;
                for (var j = 0, l2 = intact.length; j < l2; ++j) {
                    var range = intact[j];
                    if (change.to <= range.from && change.diff)
                        intact2.push({from: range.from + diff, to: range.to + diff,
                            domStart: range.domStart});
                    else if (change.to <= range.from || change.from >= range.to)
                        intact2.push(range);
                    else {
                        if (change.from > range.from)
                            intact2.push({from: range.from, to: change.from, domStart: range.domStart});
                        if (change.to < range.to)
                            intact2.push({from: change.to + diff, to: range.to + diff,
                                domStart: range.domStart + (change.to - range.from)});
                    }
                }
                intact = intact2;
            }
            return intact;
        }

        function patchDisplay(from, to, intact) {
            // The first pass removes the DOM nodes that aren't intact.
            if (!intact.length) lineDiv.innerHTML = "";
            else {
                function killNode(node) {
                    var tmp = node.nextSibling;
                    node.parentNode.removeChild(node);
                    return tmp;
                }
                var domPos = 0, curNode = lineDiv.firstChild, n;
                for (var i = 0; i < intact.length; ++i) {
                    var cur = intact[i];
                    while (cur.domStart > domPos) {curNode = killNode(curNode); domPos++;}
                    for (var j = 0, e = cur.to - cur.from; j < e; ++j) {curNode = curNode.nextSibling; domPos++;}
                }
                while (curNode) curNode = killNode(curNode);
            }
            // This pass fills in the lines that actually changed.
            var nextIntact = intact.shift(), curNode = lineDiv.firstChild, j = from;
            var sfrom = sel.from.line, sto = sel.to.line, inSel = sfrom < from && sto >= from;
            var scratch = targetDocument.createElement("div"), newElt;
            doc.iter(from, to, function(line) {
                var ch1 = null, ch2 = null;
                if (inSel) {
                    ch1 = 0;
                    if (sto == j) {inSel = false; ch2 = sel.to.ch;}
                } else if (sfrom == j) {
                    if (sto == j) {ch1 = sel.from.ch; ch2 = sel.to.ch;}
                    else {inSel = true; ch1 = sel.from.ch;}
                }
                if (nextIntact && nextIntact.to == j) nextIntact = intact.shift();
                if (!nextIntact || nextIntact.from > j) {
                    if (line.hidden) scratch.innerHTML = "<pre></pre>";
                    else scratch.innerHTML = line.getHTML(ch1, ch2, true, tabText);
                    lineDiv.insertBefore(scratch.firstChild, curNode);
                } else {
                    curNode = curNode.nextSibling;
                }
                ++j;
            });
        }

        function updateGutter() {
            if (!options.gutter && !options.lineNumbers) return;
            var hText = mover.offsetHeight, hEditor = scroller.clientHeight;
            gutter.style.height = (hText - hEditor < 2 ? hEditor : hText) + "px";
            var html = [], i = showingFrom;
            doc.iter(showingFrom, Math.max(showingTo, showingFrom + 1), function(line) {
                if (line.hidden) {
                    html.push("<pre></pre>");
                } else {
                    var marker = line.gutterMarker;
                    var text = options.lineNumbers ? i + options.firstLineNumber : null;
                    if (marker && marker.text)
                        text = marker.text.replace("%N%", text != null ? text : "");
                    else if (text == null)
                        text = "\u00a0";
                    html.push((marker && marker.style ? '<pre class="' + marker.style + '">' : "<pre>"), text);
                    for (var j = 1; j < line.height; ++j) html.push("<br/>&#160;");
                    html.push("</pre>");
                }
                ++i;
            });
            gutter.style.display = "none";
            gutterText.innerHTML = html.join("");
            var minwidth = String(doc.size).length, firstNode = gutterText.firstChild, val = eltText(firstNode), pad = "";
            while (val.length + pad.length < minwidth) pad += "\u00a0";
            if (pad) firstNode.insertBefore(targetDocument.createTextNode(pad), firstNode.firstChild);
            gutter.style.display = "";
            lineSpace.style.marginLeft = gutter.offsetWidth + "px";
            gutterDirty = false;
        }
        function updateCursor() {
            var head = sel.inverted ? sel.from : sel.to, lh = textHeight();
            var pos = localCoords(head, true);
            var wrapOff = eltOffset(wrapper), lineOff = eltOffset(lineDiv);
            inputDiv.style.top = (pos.y + lineOff.top - wrapOff.top) + "px";
            inputDiv.style.left = (pos.x + lineOff.left - wrapOff.left) + "px";
            if (posEq(sel.from, sel.to)) {
                cursor.style.top = pos.y + "px";
                cursor.style.left = (options.lineWrapping ? Math.min(pos.x, lineSpace.offsetWidth) : pos.x) + "px";
                cursor.style.display = "";
            }
            else cursor.style.display = "none";
        }

        function setShift(val) {
            if (val) shiftSelecting = shiftSelecting || (sel.inverted ? sel.to : sel.from);
            else shiftSelecting = null;
        }
        function setSelectionUser(from, to) {
            var sh = shiftSelecting && clipPos(shiftSelecting);
            if (sh) {
                if (posLess(sh, from)) from = sh;
                else if (posLess(to, sh)) to = sh;
            }
            setSelection(from, to);
            userSelChange = true;
        }
        // Update the selection. Last two args are only used by
        // updateLines, since they have to be expressed in the line
        // numbers before the update.
        function setSelection(from, to, oldFrom, oldTo) {
            goalColumn = null;
            if (oldFrom == null) {oldFrom = sel.from.line; oldTo = sel.to.line;}
            if (posEq(sel.from, from) && posEq(sel.to, to)) return;
            if (posLess(to, from)) {var tmp = to; to = from; from = tmp;}

            // Skip over hidden lines.
            if (from.line != oldFrom) from = skipHidden(from, oldFrom, sel.from.ch);
            if (to.line != oldTo) to = skipHidden(to, oldTo, sel.to.ch);

            if (posEq(from, to)) sel.inverted = false;
            else if (posEq(from, sel.to)) sel.inverted = false;
            else if (posEq(to, sel.from)) sel.inverted = true;

            // Some ugly logic used to only mark the lines that actually did
            // see a change in selection as changed, rather than the whole
            // selected range.
            if (posEq(from, to)) {
                if (!posEq(sel.from, sel.to))
                    changes.push({from: oldFrom, to: oldTo + 1});
            }
            else if (posEq(sel.from, sel.to)) {
                changes.push({from: from.line, to: to.line + 1});
            }
            else {
                if (!posEq(from, sel.from)) {
                    if (from.line < oldFrom)
                        changes.push({from: from.line, to: Math.min(to.line, oldFrom) + 1});
                    else
                        changes.push({from: oldFrom, to: Math.min(oldTo, from.line) + 1});
                }
                if (!posEq(to, sel.to)) {
                    if (to.line < oldTo)
                        changes.push({from: Math.max(oldFrom, from.line), to: oldTo + 1});
                    else
                        changes.push({from: Math.max(from.line, oldTo), to: to.line + 1});
                }
            }
            sel.from = from; sel.to = to;
            selectionChanged = true;
        }
        function skipHidden(pos, oldLine, oldCh) {
            function getNonHidden(dir) {
                var lNo = pos.line + dir, end = dir == 1 ? doc.size : -1;
                while (lNo != end) {
                    var line = getLine(lNo);
                    if (!line.hidden) {
                        var ch = pos.ch;
                        if (ch > oldCh || ch > line.text.length) ch = line.text.length;
                        return {line: lNo, ch: ch};
                    }
                    lNo += dir;
                }
            }
            var line = getLine(pos.line);
            if (!line.hidden) return pos;
            if (pos.line >= oldLine) return getNonHidden(1) || getNonHidden(-1);
            else return getNonHidden(-1) || getNonHidden(1);
        }
        function setCursor(line, ch, user) {
            var pos = clipPos({line: line, ch: ch || 0});
            (user ? setSelectionUser : setSelection)(pos, pos);
        }

        function clipLine(n) {return Math.max(0, Math.min(n, doc.size-1));}
        function clipPos(pos) {
            if (pos.line < 0) return {line: 0, ch: 0};
            if (pos.line >= doc.size) return {line: doc.size-1, ch: getLine(doc.size-1).text.length};
            var ch = pos.ch, linelen = getLine(pos.line).text.length;
            if (ch == null || ch > linelen) return {line: pos.line, ch: linelen};
            else if (ch < 0) return {line: pos.line, ch: 0};
            else return pos;
        }

        function findPosH(dir, unit) {
            var end = sel.inverted ? sel.from : sel.to, line = end.line, ch = end.ch;
            var lineObj = getLine(line);
            function findNextLine() {
                for (var l = line + dir, e = dir < 0 ? -1 : doc.size; l != e; l += dir) {
                    var lo = getLine(l);
                    if (!lo.hidden) { line = l; lineObj = lo; return true; }
                }
            }
            function moveOnce(boundToLine) {
                if (ch == (dir < 0 ? 0 : lineObj.text.length)) {
                    if (!boundToLine && findNextLine()) ch = dir < 0 ? lineObj.text.length : 0;
                    else return false;
                } else ch += dir;
                return true;
            }
            if (unit == "char") moveOnce();
            else if (unit == "column") moveOnce(true);
            else if (unit == "word") {
                var sawWord = false;
                for (;;) {
                    if (dir < 0) if (!moveOnce()) break;
                    if (isWordChar(lineObj.text.charAt(ch))) sawWord = true;
                    else if (sawWord) {if (dir < 0) {dir = 1; moveOnce();} break;}
                    if (dir > 0) if (!moveOnce()) break;
                }
            }
            return {line: line, ch: ch};
        }
        function moveH(dir, unit) {
            var pos = dir < 0 ? sel.from : sel.to;
            if (shiftSelecting || posEq(sel.from, sel.to)) pos = findPosH(dir, unit);
            setCursor(pos.line, pos.ch, true);
        }
        function deleteH(dir, unit) {
            if (!posEq(sel.from, sel.to)) replaceRange("", sel.from, sel.to);
            else if (dir < 0) replaceRange("", findPosH(dir, unit), sel.to);
            else replaceRange("", sel.from, findPosH(dir, unit));
            userSelChange = true;
        }
        var goalColumn = null;
        function moveV(dir, unit) {
            var dist = 0, pos = localCoords(sel.inverted ? sel.from : sel.to, true);
            if (goalColumn != null) pos.x = goalColumn;
            if (unit == "page") dist = scroller.clientHeight;
            else if (unit == "line") dist = textHeight();
            var target = coordsChar(pos.x, pos.y + dist * dir + 2);
            setCursor(target.line, target.ch, true);
            goalColumn = pos.x;
        }

        function selectWordAt(pos) {
            var line = getLine(pos.line).text;
            var start = pos.ch, end = pos.ch;
            while (start > 0 && isWordChar(line.charAt(start - 1))) --start;
            while (end < line.length && isWordChar(line.charAt(end))) ++end;
            setSelectionUser({line: pos.line, ch: start}, {line: pos.line, ch: end});
        }
        function selectLine(line) {
            setSelectionUser({line: line, ch: 0}, {line: line, ch: getLine(line).text.length});
        }
        function indentSelected(mode) {
            if (posEq(sel.from, sel.to)) return indentLine(sel.from.line, mode);
            var e = sel.to.line - (sel.to.ch ? 0 : 1);
            for (var i = sel.from.line; i <= e; ++i) indentLine(i, mode);
        }

        function indentLine(n, how) {
            if (!how) how = "add";
            if (how == "smart") {
                if (!mode.indent) how = "prev";
                else var state = getStateBefore(n);
            }

            var line = getLine(n), curSpace = line.indentation(options.tabSize),
                curSpaceString = line.text.match(/^\s*/)[0], indentation;
            if (how == "prev") {
                if (n) indentation = getLine(n-1).indentation(options.tabSize);
                else indentation = 0;
            }
            else if (how == "smart") indentation = mode.indent(state, line.text.slice(curSpaceString.length), line.text);
            else if (how == "add") indentation = curSpace + options.indentUnit;
            else if (how == "subtract") indentation = curSpace - options.indentUnit;
            indentation = Math.max(0, indentation);
            var diff = indentation - curSpace;

            if (!diff) {
                if (sel.from.line != n && sel.to.line != n) return;
                var indentString = curSpaceString;
            }
            else {
                var indentString = "", pos = 0;
                if (options.indentWithTabs)
                    for (var i = Math.floor(indentation / options.tabSize); i; --i) {pos += options.tabSize; indentString += "\t";}
                while (pos < indentation) {++pos; indentString += " ";}
            }

            replaceRange(indentString, {line: n, ch: 0}, {line: n, ch: curSpaceString.length});
        }

        function loadMode() {
            mode = CodeMirror.getMode(options, options.mode);
            doc.iter(0, doc.size, function(line) { line.stateAfter = null; });
            work = [0];
            startWorker();
        }
        function gutterChanged() {
            var visible = options.gutter || options.lineNumbers;
            gutter.style.display = visible ? "" : "none";
            if (visible) gutterDirty = true;
            else lineDiv.parentNode.style.marginLeft = 0;
        }
        function wrappingChanged(from, to) {
            if (options.lineWrapping) {
                wrapper.className += " CodeMirror-wrap";
                var perLine = scroller.clientWidth / charWidth() - 3;
                doc.iter(0, doc.size, function(line) {
                    if (line.hidden) return;
                    var guess = Math.ceil(line.text.length / perLine) || 1;
                    if (guess != 1) updateLineHeight(line, guess);
                });
                lineSpace.style.width = code.style.width = "";
            } else {
                wrapper.className = wrapper.className.replace(" CodeMirror-wrap", "");
                maxWidth = null; maxLine = "";
                doc.iter(0, doc.size, function(line) {
                    if (line.height != 1 && !line.hidden) updateLineHeight(line, 1);
                    if (line.text.length > maxLine.length) maxLine = line.text;
                });
            }
            changes.push({from: 0, to: doc.size});
        }
        function computeTabText() {
            for (var str = '<span class="cm-tab">', i = 0; i < options.tabSize; ++i) str += " ";
            return str + "</span>";
        }
        function tabsChanged() {
            tabText = computeTabText();
            updateDisplay(true);
        }
        function themeChanged() {
            scroller.className = scroller.className.replace(/\s*cm-s-\w+/g, "") +
                options.theme.replace(/(^|\s)\s*/g, " cm-s-");
        }

        function TextMarker() { this.set = []; }
        TextMarker.prototype.clear = operation(function() {
            var min = Infinity, max = -Infinity;
            for (var i = 0, e = this.set.length; i < e; ++i) {
                var line = this.set[i], mk = line.marked;
                if (!mk || !line.parent) continue;
                var lineN = lineNo(line);
                min = Math.min(min, lineN); max = Math.max(max, lineN);
                for (var j = 0; j < mk.length; ++j)
                    if (mk[j].set == this.set) mk.splice(j--, 1);
            }
            if (min != Infinity)
                changes.push({from: min, to: max + 1});
        });
        TextMarker.prototype.find = function() {
            var from, to;
            for (var i = 0, e = this.set.length; i < e; ++i) {
                var line = this.set[i], mk = line.marked;
                for (var j = 0; j < mk.length; ++j) {
                    var mark = mk[j];
                    if (mark.set == this.set) {
                        if (mark.from != null || mark.to != null) {
                            var found = lineNo(line);
                            if (found != null) {
                                if (mark.from != null) from = {line: found, ch: mark.from};
                                if (mark.to != null) to = {line: found, ch: mark.to};
                            }
                        }
                    }
                }
            }
            return {from: from, to: to};
        };

        function markText(from, to, className) {
            from = clipPos(from); to = clipPos(to);
            var tm = new TextMarker();
            function add(line, from, to, className) {
                getLine(line).addMark(new MarkedText(from, to, className, tm.set));
            }
            if (from.line == to.line) add(from.line, from.ch, to.ch, className);
            else {
                add(from.line, from.ch, null, className);
                for (var i = from.line + 1, e = to.line; i < e; ++i)
                    add(i, null, null, className);
                add(to.line, null, to.ch, className);
            }
            changes.push({from: from.line, to: to.line + 1});
            return tm;
        }

        function setBookmark(pos) {
            pos = clipPos(pos);
            var bm = new Bookmark(pos.ch);
            getLine(pos.line).addMark(bm);
            return bm;
        }

        function addGutterMarker(line, text, className) {
            if (typeof line == "number") line = getLine(clipLine(line));
            line.gutterMarker = {text: text, style: className};
            gutterDirty = true;
            return line;
        }
        function removeGutterMarker(line) {
            if (typeof line == "number") line = getLine(clipLine(line));
            line.gutterMarker = null;
            gutterDirty = true;
        }

        function changeLine(handle, op) {
            var no = handle, line = handle;
            if (typeof handle == "number") line = getLine(clipLine(handle));
            else no = lineNo(handle);
            if (no == null) return null;
            if (op(line, no)) changes.push({from: no, to: no + 1});
            else return null;
            return line;
        }
        function setLineClass(handle, className) {
            return changeLine(handle, function(line) {
                if (line.className != className) {
                    line.className = className;
                    return true;
                }
            });
        }
        function setLineHidden(handle, hidden) {
            return changeLine(handle, function(line, no) {
                if (line.hidden != hidden) {
                    line.hidden = hidden;
                    updateLineHeight(line, hidden ? 0 : 1);
                    if (hidden && (sel.from.line == no || sel.to.line == no))
                        setSelection(skipHidden(sel.from, sel.from.line, sel.from.ch),
                            skipHidden(sel.to, sel.to.line, sel.to.ch));
                    return (gutterDirty = true);
                }
            });
        }

        function lineInfo(line) {
            if (typeof line == "number") {
                if (!isLine(line)) return null;
                var n = line;
                line = getLine(line);
                if (!line) return null;
            }
            else {
                var n = lineNo(line);
                if (n == null) return null;
            }
            var marker = line.gutterMarker;
            return {line: n, handle: line, text: line.text, markerText: marker && marker.text,
                markerClass: marker && marker.style, lineClass: line.className};
        }

        function stringWidth(str) {
            measure.innerHTML = "<pre><span>x</span></pre>";
            measure.firstChild.firstChild.firstChild.nodeValue = str;
            return measure.firstChild.firstChild.offsetWidth || 10;
        }
        // These are used to go from pixel positions to character
        // positions, taking varying character widths into account.
        function charFromX(line, x) {
            if (x <= 0) return 0;
            var lineObj = getLine(line), text = lineObj.text;
            function getX(len) {
                measure.innerHTML = "<pre><span>" + lineObj.getHTML(null, null, false, tabText, len) + "</span></pre>";
                return measure.firstChild.firstChild.offsetWidth;
            }
            var from = 0, fromX = 0, to = text.length, toX;
            // Guess a suitable upper bound for our search.
            var estimated = Math.min(to, Math.ceil(x / charWidth()));
            for (;;) {
                var estX = getX(estimated);
                if (estX <= x && estimated < to) estimated = Math.min(to, Math.ceil(estimated * 1.2));
                else {toX = estX; to = estimated; break;}
            }
            if (x > toX) return to;
            // Try to guess a suitable lower bound as well.
            estimated = Math.floor(to * 0.8); estX = getX(estimated);
            if (estX < x) {from = estimated; fromX = estX;}
            // Do a binary search between these bounds.
            for (;;) {
                if (to - from <= 1) return (toX - x > x - fromX) ? from : to;
                var middle = Math.ceil((from + to) / 2), middleX = getX(middle);
                if (middleX > x) {to = middle; toX = middleX;}
                else {from = middle; fromX = middleX;}
            }
        }

        var tempId = Math.floor(Math.random() * 0xffffff).toString(16);
        function measureLine(line, ch) {
            var extra = "";
            // Include extra text at the end to make sure the measured line is wrapped in the right way.
            if (options.lineWrapping) {
                var end = line.text.indexOf(" ", ch + 2);
                extra = htmlEscape(line.text.slice(ch + 1, end < 0 ? line.text.length : end + (ie ? 5 : 0)));
            }
            measure.innerHTML = "<pre>" + line.getHTML(null, null, false, tabText, ch) +
                '<span id="CodeMirror-temp-' + tempId + '">' + htmlEscape(line.text.charAt(ch) || " ") + "</span>" +
                extra + "</pre>";
            var elt = document.getElementById("CodeMirror-temp-" + tempId);
            var top = elt.offsetTop, left = elt.offsetLeft;
            // Older IEs report zero offsets for spans directly after a wrap
            if (ie && ch && top == 0 && left == 0) {
                var backup = document.createElement("span");
                backup.innerHTML = "x";
                elt.parentNode.insertBefore(backup, elt.nextSibling);
                top = backup.offsetTop;
            }
            return {top: top, left: left};
        }
        function localCoords(pos, inLineWrap) {
            var x, lh = textHeight(), y = lh * (heightAtLine(doc, pos.line) - (inLineWrap ? displayOffset : 0));
            if (pos.ch == 0) x = 0;
            else {
                var sp = measureLine(getLine(pos.line), pos.ch);
                x = sp.left;
                if (options.lineWrapping) y += Math.max(0, sp.top);
            }
            return {x: x, y: y, yBot: y + lh};
        }
        // Coords must be lineSpace-local
        function coordsChar(x, y) {
            if (y < 0) y = 0;
            var th = textHeight(), cw = charWidth(), heightPos = displayOffset + Math.floor(y / th);
            var lineNo = lineAtHeight(doc, heightPos);
            if (lineNo >= doc.size) return {line: doc.size - 1, ch: getLine(doc.size - 1).text.length};
            var lineObj = getLine(lineNo), text = lineObj.text;
            var tw = options.lineWrapping, innerOff = tw ? heightPos - heightAtLine(doc, lineNo) : 0;
            if (x <= 0 && innerOff == 0) return {line: lineNo, ch: 0};
            function getX(len) {
                var sp = measureLine(lineObj, len);
                if (tw) {
                    var off = Math.round(sp.top / th);
                    return Math.max(0, sp.left + (off - innerOff) * scroller.clientWidth);
                }
                return sp.left;
            }
            var from = 0, fromX = 0, to = text.length, toX;
            // Guess a suitable upper bound for our search.
            var estimated = Math.min(to, Math.ceil((x + innerOff * scroller.clientWidth * .9) / cw));
            for (;;) {
                var estX = getX(estimated);
                if (estX <= x && estimated < to) estimated = Math.min(to, Math.ceil(estimated * 1.2));
                else {toX = estX; to = estimated; break;}
            }
            if (x > toX) return {line: lineNo, ch: to};
            // Try to guess a suitable lower bound as well.
            estimated = Math.floor(to * 0.8); estX = getX(estimated);
            if (estX < x) {from = estimated; fromX = estX;}
            // Do a binary search between these bounds.
            for (;;) {
                if (to - from <= 1) return {line: lineNo, ch: (toX - x > x - fromX) ? from : to};
                var middle = Math.ceil((from + to) / 2), middleX = getX(middle);
                if (middleX > x) {to = middle; toX = middleX;}
                else {from = middle; fromX = middleX;}
            }
        }
        function pageCoords(pos) {
            var local = localCoords(pos, true), off = eltOffset(lineSpace);
            return {x: off.left + local.x, y: off.top + local.y, yBot: off.top + local.yBot};
        }

        var cachedHeight, cachedHeightFor, measureText;
        function textHeight() {
            if (measureText == null) {
                measureText = "<pre>";
                for (var i = 0; i < 49; ++i) measureText += "x<br/>";
                measureText += "x</pre>";
            }
            var offsetHeight = lineDiv.clientHeight;
            if (offsetHeight == cachedHeightFor) return cachedHeight;
            cachedHeightFor = offsetHeight;
            measure.innerHTML = measureText;
            cachedHeight = measure.firstChild.offsetHeight / 50 || 1;
            measure.innerHTML = "";
            return cachedHeight;
        }
        var cachedWidth, cachedWidthFor = 0;
        function charWidth() {
            if (scroller.clientWidth == cachedWidthFor) return cachedWidth;
            cachedWidthFor = scroller.clientWidth;
            return (cachedWidth = stringWidth("x"));
        }
        function paddingTop() {return lineSpace.offsetTop;}
        function paddingLeft() {return lineSpace.offsetLeft;}

        function posFromMouse(e, liberal) {
            var offW = eltOffset(scroller, true), x, y;
            // Fails unpredictably on IE[67] when mouse is dragged around quickly.
            try { x = e.clientX; y = e.clientY; } catch (e) { return null; }
            // This is a mess of a heuristic to try and determine whether a
            // scroll-bar was clicked or not, and to return null if one was
            // (and !liberal).
            if (!liberal && (x - offW.left > scroller.clientWidth || y - offW.top > scroller.clientHeight))
                return null;
            var offL = eltOffset(lineSpace, true);
            return coordsChar(x - offL.left, y - offL.top);
        }
        function onContextMenu(e) {
            var pos = posFromMouse(e);
            if (!pos || window.opera) return; // Opera is difficult.
            if (posEq(sel.from, sel.to) || posLess(pos, sel.from) || !posLess(pos, sel.to))
                operation(setCursor)(pos.line, pos.ch);

            var oldCSS = input.style.cssText;
            inputDiv.style.position = "absolute";
            input.style.cssText = "position: fixed; width: 30px; height: 30px; top: " + (e.clientY - 5) +
                "px; left: " + (e.clientX - 5) + "px; z-index: 1000; background: white; " +
                "border-width: 0; outline: none; overflow: hidden; opacity: .05; filter: alpha(opacity=5);";
            leaveInputAlone = true;
            var val = input.value = getSelection();
            focusInput();
            input.select();
            function rehide() {
                var newVal = splitLines(input.value).join("\n");
                if (newVal != val) operation(replaceSelection)(newVal, "end");
                inputDiv.style.position = "relative";
                input.style.cssText = oldCSS;
                leaveInputAlone = false;
                resetInput(true);
                slowPoll();
            }

            if (gecko) {
                e_stop(e);
                var mouseup = connect(window, "mouseup", function() {
                    mouseup();
                    setTimeout(rehide, 20);
                }, true);
            }
            else {
                setTimeout(rehide, 50);
            }
        }

        // Cursor-blinking
        function restartBlink() {
            clearInterval(blinker);
            var on = true;
            cursor.style.visibility = "";
            blinker = setInterval(function() {
                cursor.style.visibility = (on = !on) ? "" : "hidden";
            }, 650);
        }

        var matching = {"(": ")>", ")": "(<", "[": "]>", "]": "[<", "{": "}>", "}": "{<"};
        function matchBrackets(autoclear) {
            var head = sel.inverted ? sel.from : sel.to, line = getLine(head.line), pos = head.ch - 1;
            var match = (pos >= 0 && matching[line.text.charAt(pos)]) || matching[line.text.charAt(++pos)];
            if (!match) return;
            var ch = match.charAt(0), forward = match.charAt(1) == ">", d = forward ? 1 : -1, st = line.styles;
            for (var off = pos + 1, i = 0, e = st.length; i < e; i+=2)
                if ((off -= st[i].length) <= 0) {var style = st[i+1]; break;}

            var stack = [line.text.charAt(pos)], re = /[(){}[\]]/;
            function scan(line, from, to) {
                if (!line.text) return;
                var st = line.styles, pos = forward ? 0 : line.text.length - 1, cur;
                for (var i = forward ? 0 : st.length - 2, e = forward ? st.length : -2; i != e; i += 2*d) {
                    var text = st[i];
                    if (st[i+1] != null && st[i+1] != style) {pos += d * text.length; continue;}
                    for (var j = forward ? 0 : text.length - 1, te = forward ? text.length : -1; j != te; j += d, pos+=d) {
                        if (pos >= from && pos < to && re.test(cur = text.charAt(j))) {
                            var match = matching[cur];
                            if (match.charAt(1) == ">" == forward) stack.push(cur);
                            else if (stack.pop() != match.charAt(0)) return {pos: pos, match: false};
                            else if (!stack.length) return {pos: pos, match: true};
                        }
                    }
                }
            }
            for (var i = head.line, e = forward ? Math.min(i + 100, doc.size) : Math.max(-1, i - 100); i != e; i+=d) {
                var line = getLine(i), first = i == head.line;
                var found = scan(line, first && forward ? pos + 1 : 0, first && !forward ? pos : line.text.length);
                if (found) break;
            }
            if (!found) found = {pos: null, match: false};
            var style = found.match ? "CodeMirror-matchingbracket" : "CodeMirror-nonmatchingbracket";
            var one = markText({line: head.line, ch: pos}, {line: head.line, ch: pos+1}, style),
                two = found.pos != null && markText({line: i, ch: found.pos}, {line: i, ch: found.pos + 1}, style);
            var clear = operation(function(){one.clear(); two && two.clear();});
            if (autoclear) setTimeout(clear, 800);
            else bracketHighlighted = clear;
        }

        // Finds the line to start with when starting a parse. Tries to
        // find a line with a stateAfter, so that it can start with a
        // valid state. If that fails, it returns the line with the
        // smallest indentation, which tends to need the least context to
        // parse correctly.
        function findStartLine(n) {
            var minindent, minline;
            for (var search = n, lim = n - 40; search > lim; --search) {
                if (search == 0) return 0;
                var line = getLine(search-1);
                if (line.stateAfter) return search;
                var indented = line.indentation(options.tabSize);
                if (minline == null || minindent > indented) {
                    minline = search - 1;
                    minindent = indented;
                }
            }
            return minline;
        }
        function getStateBefore(n) {
            var start = findStartLine(n), state = start && getLine(start-1).stateAfter;
            if (!state) state = startState(mode);
            else state = copyState(mode, state);
            doc.iter(start, n, function(line) {
                line.highlight(mode, state, options.tabSize);
                line.stateAfter = copyState(mode, state);
            });
            if (start < n) changes.push({from: start, to: n});
            if (n < doc.size && !getLine(n).stateAfter) work.push(n);
            return state;
        }
        function highlightLines(start, end) {
            var state = getStateBefore(start);
            doc.iter(start, end, function(line) {
                line.highlight(mode, state, options.tabSize);
                line.stateAfter = copyState(mode, state);
            });
        }
        function highlightWorker() {
            var end = +new Date + options.workTime;
            var foundWork = work.length;
            while (work.length) {
                if (!getLine(showingFrom).stateAfter) var task = showingFrom;
                else var task = work.pop();
                if (task >= doc.size) continue;
                var start = findStartLine(task), state = start && getLine(start-1).stateAfter;
                if (state) state = copyState(mode, state);
                else state = startState(mode);

                var unchanged = 0, compare = mode.compareStates, realChange = false,
                    i = start, bail = false;
                doc.iter(i, doc.size, function(line) {
                    var hadState = line.stateAfter;
                    if (+new Date > end) {
                        work.push(i);
                        startWorker(options.workDelay);
                        if (realChange) changes.push({from: task, to: i + 1});
                        return (bail = true);
                    }
                    var changed = line.highlight(mode, state, options.tabSize);
                    if (changed) realChange = true;
                    line.stateAfter = copyState(mode, state);
                    if (compare) {
                        if (hadState && compare(hadState, state)) return true;
                    } else {
                        if (changed !== false || !hadState) unchanged = 0;
                        else if (++unchanged > 3 && (!mode.indent || mode.indent(hadState, "") == mode.indent(state, "")))
                            return true;
                    }
                    ++i;
                });
                if (bail) return;
                if (realChange) changes.push({from: task, to: i + 1});
            }
            if (foundWork && options.onHighlightComplete)
                options.onHighlightComplete(instance);
        }
        function startWorker(time) {
            if (!work.length) return;
            highlight.set(time, operation(highlightWorker));
        }

        // Operations are used to wrap changes in such a way that each
        // change won't have to update the cursor and display (which would
        // be awkward, slow, and error-prone), but instead updates are
        // batched and then all combined and executed at once.
        function startOperation() {
            updateInput = userSelChange = textChanged = null;
            changes = []; selectionChanged = false; callbacks = [];
        }
        function endOperation() {
            var reScroll = false, updated;
            if (selectionChanged) reScroll = !scrollCursorIntoView();
            if (changes.length) updated = updateDisplay(changes, true);
            else {
                if (selectionChanged) updateCursor();
                if (gutterDirty) updateGutter();
            }
            if (reScroll) scrollCursorIntoView();
            if (selectionChanged) {scrollEditorIntoView(); restartBlink();}

            if (focused && !leaveInputAlone &&
                (updateInput === true || (updateInput !== false && selectionChanged)))
                resetInput(userSelChange);

            if (selectionChanged && options.matchBrackets)
                setTimeout(operation(function() {
                    if (bracketHighlighted) {bracketHighlighted(); bracketHighlighted = null;}
                    if (posEq(sel.from, sel.to)) matchBrackets(false);
                }), 20);
            var tc = textChanged, cbs = callbacks; // these can be reset by callbacks
            if (selectionChanged && options.onCursorActivity)
                options.onCursorActivity(instance);
            if (tc && options.onChange && instance)
                options.onChange(instance, tc);
            for (var i = 0; i < cbs.length; ++i) cbs[i](instance);
            if (updated && options.onUpdate) options.onUpdate(instance);
        }
        var nestedOperation = 0;
        function operation(f) {
            return function() {
                if (!nestedOperation++) startOperation();
                try {var result = f.apply(this, arguments);}
                finally {if (!--nestedOperation) endOperation();}
                return result;
            };
        }

        for (var ext in extensions)
            if (extensions.propertyIsEnumerable(ext) &&
                !instance.propertyIsEnumerable(ext))
                instance[ext] = extensions[ext];
        return instance;
    } // (end of function CodeMirror)

    // The default configuration options.
    CodeMirror.defaults = {
        value: "",
        mode: null,
        theme: "default",
        indentUnit: 2,
        indentWithTabs: false,
        tabSize: 4,
        keyMap: "default",
        extraKeys: null,
        electricChars: true,
        onKeyEvent: null,
        lineWrapping: false,
        lineNumbers: false,
        gutter: false,
        fixedGutter: false,
        firstLineNumber: 1,
        readOnly: false,
        onChange: null,
        onCursorActivity: null,
        onGutterClick: null,
        onHighlightComplete: null,
        onUpdate: null,
        onFocus: null, onBlur: null, onScroll: null,
        matchBrackets: false,
        workTime: 100,
        workDelay: 200,
        pollInterval: 100,
        undoDepth: 40,
        tabindex: null,
        document: window.document
    };

    var mac = /Mac/.test(navigator.platform);
    var win = /Win/.test(navigator.platform);

    // Known modes, by name and by MIME
    var modes = {}, mimeModes = {};
    CodeMirror.defineMode = function(name, mode) {
        if (!CodeMirror.defaults.mode && name != "null") CodeMirror.defaults.mode = name;
        modes[name] = mode;
    };
    CodeMirror.defineMIME = function(mime, spec) {
        mimeModes[mime] = spec;
    };
    CodeMirror.getMode = function(options, spec) {
        if (typeof spec == "string" && mimeModes.hasOwnProperty(spec))
            spec = mimeModes[spec];
        if (typeof spec == "string")
            var mname = spec, config = {};
        else if (spec != null)
            var mname = spec.name, config = spec;
        var mfactory = modes[mname];
        if (!mfactory) {
            if (window.console) console.warn("No mode " + mname + " found, falling back to plain text.");
            return CodeMirror.getMode(options, "text/plain");
        }
        return mfactory(options, config || {});
    };
    CodeMirror.listModes = function() {
        var list = [];
        for (var m in modes)
            if (modes.propertyIsEnumerable(m)) list.push(m);
        return list;
    };
    CodeMirror.listMIMEs = function() {
        var list = [];
        for (var m in mimeModes)
            if (mimeModes.propertyIsEnumerable(m)) list.push({mime: m, mode: mimeModes[m]});
        return list;
    };

    var extensions = CodeMirror.extensions = {};
    CodeMirror.defineExtension = function(name, func) {
        extensions[name] = func;
    };

    var commands = CodeMirror.commands = {
        selectAll: function(cm) {cm.setSelection({line: 0, ch: 0}, {line: cm.lineCount() - 1});},
        killLine: function(cm) {
            var from = cm.getCursor(true), to = cm.getCursor(false), sel = !posEq(from, to);
            if (!sel && cm.getLine(from.line).length == from.ch) cm.replaceRange("", from, {line: from.line + 1, ch: 0});
            else cm.replaceRange("", from, sel ? to : {line: from.line});
        },
        deleteLine: function(cm) {var l = cm.getCursor().line; cm.replaceRange("", {line: l, ch: 0}, {line: l});},
        undo: function(cm) {cm.undo();},
        redo: function(cm) {cm.redo();},
        goDocStart: function(cm) {cm.setCursor(0, 0, true);},
        goDocEnd: function(cm) {cm.setSelection({line: cm.lineCount() - 1}, null, true);},
        goLineStart: function(cm) {cm.setCursor(cm.getCursor().line, 0, true);},
        goLineStartSmart: function(cm) {
            var cur = cm.getCursor();
            var text = cm.getLine(cur.line), firstNonWS = Math.max(0, text.search(/\S/));
            cm.setCursor(cur.line, cur.ch <= firstNonWS && cur.ch ? 0 : firstNonWS, true);
        },
        goLineEnd: function(cm) {cm.setSelection({line: cm.getCursor().line}, null, true);},
        goLineUp: function(cm) {cm.moveV(-1, "line");},
        goLineDown: function(cm) {cm.moveV(1, "line");},
        goPageUp: function(cm) {cm.moveV(-1, "page");},
        goPageDown: function(cm) {cm.moveV(1, "page");},
        goCharLeft: function(cm) {cm.moveH(-1, "char");},
        goCharRight: function(cm) {cm.moveH(1, "char");},
        goColumnLeft: function(cm) {cm.moveH(-1, "column");},
        goColumnRight: function(cm) {cm.moveH(1, "column");},
        goWordLeft: function(cm) {cm.moveH(-1, "word");},
        goWordRight: function(cm) {cm.moveH(1, "word");},
        delCharLeft: function(cm) {cm.deleteH(-1, "char");},
        delCharRight: function(cm) {cm.deleteH(1, "char");},
        delWordLeft: function(cm) {cm.deleteH(-1, "word");},
        delWordRight: function(cm) {cm.deleteH(1, "word");},
        indentAuto: function(cm) {cm.indentSelection("smart");},
        indentMore: function(cm) {cm.indentSelection("add");},
        indentLess: function(cm) {cm.indentSelection("subtract");},
        insertTab: function(cm) {cm.replaceSelection("\t", "end");},
        transposeChars: function(cm) {
            var cur = cm.getCursor(), line = cm.getLine(cur.line);
            if (cur.ch > 0 && cur.ch < line.length - 1)
                cm.replaceRange(line.charAt(cur.ch) + line.charAt(cur.ch - 1),
                    {line: cur.line, ch: cur.ch - 1}, {line: cur.line, ch: cur.ch + 1});
        },
        newlineAndIndent: function(cm) {
            cm.replaceSelection("\n", "end");
            cm.indentLine(cm.getCursor().line);
        },
        toggleOverwrite: function(cm) {cm.toggleOverwrite();}
    };

    var keyMap = CodeMirror.keyMap = {};
    keyMap.basic = {
        "Left": "goCharLeft", "Right": "goCharRight", "Up": "goLineUp", "Down": "goLineDown",
        "End": "goLineEnd", "Home": "goLineStartSmart", "PageUp": "goPageUp", "PageDown": "goPageDown",
        "Delete": "delCharRight", "Backspace": "delCharLeft", "Tab": "indentMore", "Shift-Tab": "indentLess",
        "Enter": "newlineAndIndent", "Insert": "toggleOverwrite"
    };
    // Note that the save and find-related commands aren't defined by
    // default. Unknown commands are simply ignored.
    keyMap.pcDefault = {
        "Ctrl-A": "selectAll", "Ctrl-D": "deleteLine", "Ctrl-Z": "undo", "Shift-Ctrl-Z": "redo", "Ctrl-Y": "redo",
        "Ctrl-Home": "goDocStart", "Alt-Up": "goDocStart", "Ctrl-End": "goDocEnd", "Ctrl-Down": "goDocEnd",
        "Ctrl-Left": "goWordLeft", "Ctrl-Right": "goWordRight", "Alt-Left": "goLineStart", "Alt-Right": "goLineEnd",
        "Ctrl-Backspace": "delWordLeft", "Ctrl-Delete": "delWordRight", "Ctrl-S": "save", "Ctrl-F": "find",
        "Ctrl-G": "findNext", "Shift-Ctrl-G": "findPrev", "Shift-Ctrl-F": "replace", "Shift-Ctrl-R": "replaceAll",
        fallthrough: "basic"
    };
    keyMap.macDefault = {
        "Cmd-A": "selectAll", "Cmd-D": "deleteLine", "Cmd-Z": "undo", "Shift-Cmd-Z": "redo", "Cmd-Y": "redo",
        "Cmd-Up": "goDocStart", "Cmd-End": "goDocEnd", "Cmd-Down": "goDocEnd", "Alt-Left": "goWordLeft",
        "Alt-Right": "goWordRight", "Cmd-Left": "goLineStart", "Cmd-Right": "goLineEnd", "Alt-Backspace": "delWordLeft",
        "Ctrl-Alt-Backspace": "delWordRight", "Alt-Delete": "delWordRight", "Cmd-S": "save", "Cmd-F": "find",
        "Cmd-G": "findNext", "Shift-Cmd-G": "findPrev", "Cmd-Alt-F": "replace", "Shift-Cmd-Alt-F": "replaceAll",
        fallthrough: ["basic", "emacsy"]
    };
    keyMap["default"] = mac ? keyMap.macDefault : keyMap.pcDefault;
    keyMap.emacsy = {
        "Ctrl-F": "goCharRight", "Ctrl-B": "goCharLeft", "Ctrl-P": "goLineUp", "Ctrl-N": "goLineDown",
        "Alt-F": "goWordRight", "Alt-B": "goWordLeft", "Ctrl-A": "goLineStart", "Ctrl-E": "goLineEnd",
        "Ctrl-V": "goPageUp", "Shift-Ctrl-V": "goPageDown", "Ctrl-D": "delCharRight", "Ctrl-H": "delCharLeft",
        "Alt-D": "delWordRight", "Alt-Backspace": "delWordLeft", "Ctrl-K": "killLine", "Ctrl-T": "transposeChars"
    };

    function lookupKey(name, extraMap, map) {
        function lookup(name, map, ft) {
            var found = map[name];
            if (found != null) return found;
            if (ft == null) ft = map.fallthrough;
            if (ft == null) return map.catchall;
            if (typeof ft == "string") return lookup(name, keyMap[ft]);
            for (var i = 0, e = ft.length; i < e; ++i) {
                found = lookup(name, keyMap[ft[i]]);
                if (found != null) return found;
            }
            return null;
        }
        return extraMap ? lookup(name, extraMap, map) : lookup(name, keyMap[map]);
    }
    function isModifierKey(event) {
        var name = keyNames[event.keyCode];
        return name == "Ctrl" || name == "Alt" || name == "Shift" || name == "Mod";
    }

    CodeMirror.fromTextArea = function(textarea, options) {
        if (!options) options = {};
        options.value = textarea.value;
        if (!options.tabindex && textarea.tabindex)
            options.tabindex = textarea.tabindex;

        function save() {textarea.value = instance.getValue();}
        if (textarea.form) {
            // Deplorable hack to make the submit method do the right thing.
            var rmSubmit = connect(textarea.form, "submit", save, true);
            if (typeof textarea.form.submit == "function") {
                var realSubmit = textarea.form.submit;
                function wrappedSubmit() {
                    save();
                    textarea.form.submit = realSubmit;
                    textarea.form.submit();
                    textarea.form.submit = wrappedSubmit;
                }
                textarea.form.submit = wrappedSubmit;
            }
        }

        textarea.style.display = "none";
        var instance = CodeMirror(function(node) {
            textarea.parentNode.insertBefore(node, textarea.nextSibling);
        }, options);
        instance.save = save;
        instance.getTextArea = function() { return textarea; };
        instance.toTextArea = function() {
            save();
            textarea.parentNode.removeChild(instance.getWrapperElement());
            textarea.style.display = "";
            if (textarea.form) {
                rmSubmit();
                if (typeof textarea.form.submit == "function")
                    textarea.form.submit = realSubmit;
            }
        };
        return instance;
    };

    // Utility functions for working with state. Exported because modes
    // sometimes need to do this.
    function copyState(mode, state) {
        if (state === true) return state;
        if (mode.copyState) return mode.copyState(state);
        var nstate = {};
        for (var n in state) {
            var val = state[n];
            if (val instanceof Array) val = val.concat([]);
            nstate[n] = val;
        }
        return nstate;
    }
    CodeMirror.copyState = copyState;
    function startState(mode, a1, a2) {
        return mode.startState ? mode.startState(a1, a2) : true;
    }
    CodeMirror.startState = startState;

    // The character stream used by a mode's parser.
    function StringStream(string, tabSize) {
        this.pos = this.start = 0;
        this.string = string;
        this.tabSize = tabSize || 8;
    }
    StringStream.prototype = {
        eol: function() {return this.pos >= this.string.length;},
        sol: function() {return this.pos == 0;},
        peek: function() {return this.string.charAt(this.pos);},
        next: function() {
            if (this.pos < this.string.length)
                return this.string.charAt(this.pos++);
        },
        eat: function(match) {
            var ch = this.string.charAt(this.pos);
            if (typeof match == "string") var ok = ch == match;
            else var ok = ch && (match.test ? match.test(ch) : match(ch));
            if (ok) {++this.pos; return ch;}
        },
        eatWhile: function(match) {
            var start = this.pos;
            while (this.eat(match)){}
            return this.pos > start;
        },
        eatSpace: function() {
            var start = this.pos;
            while (/[\s\u00a0]/.test(this.string.charAt(this.pos))) ++this.pos;
            return this.pos > start;
        },
        skipToEnd: function() {this.pos = this.string.length;},
        skipTo: function(ch) {
            var found = this.string.indexOf(ch, this.pos);
            if (found > -1) {this.pos = found; return true;}
        },
        backUp: function(n) {this.pos -= n;},
        column: function() {return countColumn(this.string, this.start, this.tabSize);},
        indentation: function() {return countColumn(this.string, null, this.tabSize);},
        match: function(pattern, consume, caseInsensitive) {
            if (typeof pattern == "string") {
                function cased(str) {return caseInsensitive ? str.toLowerCase() : str;}
                if (cased(this.string).indexOf(cased(pattern), this.pos) == this.pos) {
                    if (consume !== false) this.pos += pattern.length;
                    return true;
                }
            }
            else {
                var match = this.string.slice(this.pos).match(pattern);
                if (match && consume !== false) this.pos += match[0].length;
                return match;
            }
        },
        current: function(){return this.string.slice(this.start, this.pos);}
    };
    CodeMirror.StringStream = StringStream;

    function MarkedText(from, to, className, set) {
        this.from = from; this.to = to; this.style = className; this.set = set;
    }
    MarkedText.prototype = {
        attach: function(line) { this.set.push(line); },
        detach: function(line) {
            var ix = indexOf(this.set, line);
            if (ix > -1) this.set.splice(ix, 1);
        },
        split: function(pos, lenBefore) {
            if (this.to <= pos && this.to != null) return null;
            var from = this.from < pos || this.from == null ? null : this.from - pos + lenBefore;
            var to = this.to == null ? null : this.to - pos + lenBefore;
            return new MarkedText(from, to, this.style, this.set);
        },
        dup: function() { return new MarkedText(null, null, this.style, this.set); },
        clipTo: function(fromOpen, from, toOpen, to, diff) {
            if (this.from != null && this.from >= from)
                this.from = Math.max(to, this.from) + diff;
            if (this.to != null && this.to > from)
                this.to = to < this.to ? this.to + diff : from;
            if (fromOpen && to > this.from && (to < this.to || this.to == null))
                this.from = null;
            if (toOpen && (from < this.to || this.to == null) && (from > this.from || this.from == null))
                this.to = null;
        },
        isDead: function() { return this.from != null && this.to != null && this.from >= this.to; },
        sameSet: function(x) { return this.set == x.set; }
    };

    function Bookmark(pos) {
        this.from = pos; this.to = pos; this.line = null;
    }
    Bookmark.prototype = {
        attach: function(line) { this.line = line; },
        detach: function(line) { if (this.line == line) this.line = null; },
        split: function(pos, lenBefore) {
            if (pos < this.from) {
                this.from = this.to = (this.from - pos) + lenBefore;
                return this;
            }
        },
        isDead: function() { return this.from > this.to; },
        clipTo: function(fromOpen, from, toOpen, to, diff) {
            if ((fromOpen || from < this.from) && (toOpen || to > this.to)) {
                this.from = 0; this.to = -1;
            } else if (this.from > from) {
                this.from = this.to = Math.max(to, this.from) + diff;
            }
        },
        sameSet: function(x) { return false; },
        find: function() {
            if (!this.line || !this.line.parent) return null;
            return {line: lineNo(this.line), ch: this.from};
        },
        clear: function() {
            if (this.line) {
                var found = indexOf(this.line.marked, this);
                if (found != -1) this.line.marked.splice(found, 1);
                this.line = null;
            }
        }
    };

    // Line objects. These hold state related to a line, including
    // highlighting info (the styles array).
    function Line(text, styles) {
        this.styles = styles || [text, null];
        this.text = text;
        this.height = 1;
        this.marked = this.gutterMarker = this.className = this.handlers = null;
        this.stateAfter = this.parent = this.hidden = null;
    }
    Line.inheritMarks = function(text, orig) {
        var ln = new Line(text), mk = orig && orig.marked;
        if (mk) {
            for (var i = 0; i < mk.length; ++i) {
                if (mk[i].to == null && mk[i].style) {
                    var newmk = ln.marked || (ln.marked = []), mark = mk[i];
                    var nmark = mark.dup(); newmk.push(nmark); nmark.attach(ln);
                }
            }
        }
        return ln;
    }
    Line.prototype = {
        // Replace a piece of a line, keeping the styles around it intact.
        replace: function(from, to_, text) {
            var st = [], mk = this.marked, to = to_ == null ? this.text.length : to_;
            copyStyles(0, from, this.styles, st);
            if (text) st.push(text, null);
            copyStyles(to, this.text.length, this.styles, st);
            this.styles = st;
            this.text = this.text.slice(0, from) + text + this.text.slice(to);
            this.stateAfter = null;
            if (mk) {
                var diff = text.length - (to - from);
                for (var i = 0, mark = mk[i]; i < mk.length; ++i) {
                    mark.clipTo(from == null, from || 0, to_ == null, to, diff);
                    if (mark.isDead()) {mark.detach(this); mk.splice(i--, 1);}
                }
            }
        },
        // Split a part off a line, keeping styles and markers intact.
        split: function(pos, textBefore) {
            var st = [textBefore, null], mk = this.marked;
            copyStyles(pos, this.text.length, this.styles, st);
            var taken = new Line(textBefore + this.text.slice(pos), st);
            if (mk) {
                for (var i = 0; i < mk.length; ++i) {
                    var mark = mk[i];
                    var newmark = mark.split(pos, textBefore.length);
                    if (newmark) {
                        if (!taken.marked) taken.marked = [];
                        taken.marked.push(newmark); newmark.attach(taken);
                    }
                }
            }
            return taken;
        },
        append: function(line) {
            var mylen = this.text.length, mk = line.marked, mymk = this.marked;
            this.text += line.text;
            copyStyles(0, line.text.length, line.styles, this.styles);
            if (mymk) {
                for (var i = 0; i < mymk.length; ++i)
                    if (mymk[i].to == null) mymk[i].to = mylen;
            }
            if (mk && mk.length) {
                if (!mymk) this.marked = mymk = [];
                outer: for (var i = 0; i < mk.length; ++i) {
                    var mark = mk[i];
                    if (!mark.from) {
                        for (var j = 0; j < mymk.length; ++j) {
                            var mymark = mymk[j];
                            if (mymark.to == mylen && mymark.sameSet(mark)) {
                                mymark.to = mark.to == null ? null : mark.to + mylen;
                                if (mymark.isDead()) {
                                    mymark.detach(this);
                                    mk.splice(i--, 1);
                                }
                                continue outer;
                            }
                        }
                    }
                    mymk.push(mark);
                    mark.attach(this);
                    mark.from += mylen;
                    if (mark.to != null) mark.to += mylen;
                }
            }
        },
        fixMarkEnds: function(other) {
            var mk = this.marked, omk = other.marked;
            if (!mk) return;
            for (var i = 0; i < mk.length; ++i) {
                var mark = mk[i], close = mark.to == null;
                if (close && omk) {
                    for (var j = 0; j < omk.length; ++j)
                        if (omk[j].sameSet(mark)) {close = false; break;}
                }
                if (close) mark.to = this.text.length;
            }
        },
        fixMarkStarts: function() {
            var mk = this.marked;
            if (!mk) return;
            for (var i = 0; i < mk.length; ++i)
                if (mk[i].from == null) mk[i].from = 0;
        },
        addMark: function(mark) {
            mark.attach(this);
            if (this.marked == null) this.marked = [];
            this.marked.push(mark);
            this.marked.sort(function(a, b){return (a.from || 0) - (b.from || 0);});
        },
        // Run the given mode's parser over a line, update the styles
        // array, which contains alternating fragments of text and CSS
        // classes.
        highlight: function(mode, state, tabSize) {
            var stream = new StringStream(this.text, tabSize), st = this.styles, pos = 0;
            var changed = false, curWord = st[0], prevWord;
            if (this.text == "" && mode.blankLine) mode.blankLine(state);
            while (!stream.eol()) {
                var style = mode.token(stream, state);
                var substr = this.text.slice(stream.start, stream.pos);
                stream.start = stream.pos;
                if (pos && st[pos-1] == style)
                    st[pos-2] += substr;
                else if (substr) {
                    if (!changed && (st[pos+1] != style || (pos && st[pos-2] != prevWord))) changed = true;
                    st[pos++] = substr; st[pos++] = style;
                    prevWord = curWord; curWord = st[pos];
                }
                // Give up when line is ridiculously long
                if (stream.pos > 5000) {
                    st[pos++] = this.text.slice(stream.pos); st[pos++] = null;
                    break;
                }
            }
            if (st.length != pos) {st.length = pos; changed = true;}
            if (pos && st[pos-2] != prevWord) changed = true;
            // Short lines with simple highlights return null, and are
            // counted as changed by the driver because they are likely to
            // highlight the same way in various contexts.
            return changed || (st.length < 5 && this.text.length < 10 ? null : false);
        },
        // Fetch the parser token for a given character. Useful for hacks
        // that want to inspect the mode state (say, for completion).
        getTokenAt: function(mode, state, ch) {
            var txt = this.text, stream = new StringStream(txt);
            while (stream.pos < ch && !stream.eol()) {
                stream.start = stream.pos;
                var style = mode.token(stream, state);
            }
            return {start: stream.start,
                end: stream.pos,
                string: stream.current(),
                className: style || null,
                state: state};
        },
        indentation: function(tabSize) {return countColumn(this.text, null, tabSize);},
        // Produces an HTML fragment for the line, taking selection,
        // marking, and highlighting into account.
        getHTML: function(sfrom, sto, includePre, tabText, endAt) {
            var html = [], first = true;
            if (includePre)
                html.push(this.className ? '<pre class="' + this.className + '">': "<pre>");
            function span(text, style) {
                if (!text) return;
                // Work around a bug where, in some compat modes, IE ignores leading spaces
                if (first && ie && text.charAt(0) == " ") text = "\u00a0" + text.slice(1);
                first = false;
                if (style) html.push('<span class="', style, '">', htmlEscape(text).replace(/\t/g, tabText), "</span>");
                else html.push(htmlEscape(text).replace(/\t/g, tabText));
            }
            var st = this.styles, allText = this.text, marked = this.marked;
            if (sfrom == sto) sfrom = null;
            var len = allText.length;
            if (endAt != null) len = Math.min(endAt, len);

            if (!allText && endAt == null)
                span(" ", sfrom != null && sto == null ? "CodeMirror-selected" : null);
            else if (!marked && sfrom == null)
                for (var i = 0, ch = 0; ch < len; i+=2) {
                    var str = st[i], style = st[i+1], l = str.length;
                    if (ch + l > len) str = str.slice(0, len - ch);
                    ch += l;
                    span(str, style && "cm-" + style);
                }
            else {
                var pos = 0, i = 0, text = "", style, sg = 0;
                var markpos = -1, mark = null;
                function nextMark() {
                    if (marked) {
                        markpos += 1;
                        mark = (markpos < marked.length) ? marked[markpos] : null;
                    }
                }
                nextMark();
                while (pos < len) {
                    var upto = len;
                    var extraStyle = "";
                    if (sfrom != null) {
                        if (sfrom > pos) upto = sfrom;
                        else if (sto == null || sto > pos) {
                            extraStyle = " CodeMirror-selected";
                            if (sto != null) upto = Math.min(upto, sto);
                        }
                    }
                    while (mark && mark.to != null && mark.to <= pos) nextMark();
                    if (mark) {
                        if (mark.from > pos) upto = Math.min(upto, mark.from);
                        else {
                            extraStyle += " " + mark.style;
                            if (mark.to != null) upto = Math.min(upto, mark.to);
                        }
                    }
                    for (;;) {
                        var end = pos + text.length;
                        var appliedStyle = style;
                        if (extraStyle) appliedStyle = style ? style + extraStyle : extraStyle;
                        span(end > upto ? text.slice(0, upto - pos) : text, appliedStyle);
                        if (end >= upto) {text = text.slice(upto - pos); pos = upto; break;}
                        pos = end;
                        text = st[i++]; style = "cm-" + st[i++];
                    }
                }
                if (sfrom != null && sto == null) span(" ", "CodeMirror-selected");
            }
            if (includePre) html.push("</pre>");
            return html.join("");
        },
        cleanUp: function() {
            this.parent = null;
            if (this.marked)
                for (var i = 0, e = this.marked.length; i < e; ++i) this.marked[i].detach(this);
        }
    };
    // Utility used by replace and split above
    function copyStyles(from, to, source, dest) {
        for (var i = 0, pos = 0, state = 0; pos < to; i+=2) {
            var part = source[i], end = pos + part.length;
            if (state == 0) {
                if (end > from) dest.push(part.slice(from - pos, Math.min(part.length, to - pos)), source[i+1]);
                if (end >= from) state = 1;
            }
            else if (state == 1) {
                if (end > to) dest.push(part.slice(0, to - pos), source[i+1]);
                else dest.push(part, source[i+1]);
            }
            pos = end;
        }
    }

    // Data structure that holds the sequence of lines.
    function LeafChunk(lines) {
        this.lines = lines;
        this.parent = null;
        for (var i = 0, e = lines.length, height = 0; i < e; ++i) {
            lines[i].parent = this;
            height += lines[i].height;
        }
        this.height = height;
    }
    LeafChunk.prototype = {
        chunkSize: function() { return this.lines.length; },
        remove: function(at, n, callbacks) {
            for (var i = at, e = at + n; i < e; ++i) {
                var line = this.lines[i];
                this.height -= line.height;
                line.cleanUp();
                if (line.handlers)
                    for (var j = 0; j < line.handlers.length; ++j) callbacks.push(line.handlers[j]);
            }
            this.lines.splice(at, n);
        },
        collapse: function(lines) {
            lines.splice.apply(lines, [lines.length, 0].concat(this.lines));
        },
        insertHeight: function(at, lines, height) {
            this.height += height;
            this.lines.splice.apply(this.lines, [at, 0].concat(lines));
            for (var i = 0, e = lines.length; i < e; ++i) lines[i].parent = this;
        },
        iterN: function(at, n, op) {
            for (var e = at + n; at < e; ++at)
                if (op(this.lines[at])) return true;
        }
    };
    function BranchChunk(children) {
        this.children = children;
        var size = 0, height = 0;
        for (var i = 0, e = children.length; i < e; ++i) {
            var ch = children[i];
            size += ch.chunkSize(); height += ch.height;
            ch.parent = this;
        }
        this.size = size;
        this.height = height;
        this.parent = null;
    }
    BranchChunk.prototype = {
        chunkSize: function() { return this.size; },
        remove: function(at, n, callbacks) {
            this.size -= n;
            for (var i = 0; i < this.children.length; ++i) {
                var child = this.children[i], sz = child.chunkSize();
                if (at < sz) {
                    var rm = Math.min(n, sz - at), oldHeight = child.height;
                    child.remove(at, rm, callbacks);
                    this.height -= oldHeight - child.height;
                    if (sz == rm) { this.children.splice(i--, 1); child.parent = null; }
                    if ((n -= rm) == 0) break;
                    at = 0;
                } else at -= sz;
            }
            if (this.size - n < 25) {
                var lines = [];
                this.collapse(lines);
                this.children = [new LeafChunk(lines)];
            }
        },
        collapse: function(lines) {
            for (var i = 0, e = this.children.length; i < e; ++i) this.children[i].collapse(lines);
        },
        insert: function(at, lines) {
            var height = 0;
            for (var i = 0, e = lines.length; i < e; ++i) height += lines[i].height;
            this.insertHeight(at, lines, height);
        },
        insertHeight: function(at, lines, height) {
            this.size += lines.length;
            this.height += height;
            for (var i = 0, e = this.children.length; i < e; ++i) {
                var child = this.children[i], sz = child.chunkSize();
                if (at <= sz) {
                    child.insertHeight(at, lines, height);
                    if (child.lines && child.lines.length > 50) {
                        while (child.lines.length > 50) {
                            var spilled = child.lines.splice(child.lines.length - 25, 25);
                            var newleaf = new LeafChunk(spilled);
                            child.height -= newleaf.height;
                            this.children.splice(i + 1, 0, newleaf);
                            newleaf.parent = this;
                        }
                        this.maybeSpill();
                    }
                    break;
                }
                at -= sz;
            }
        },
        maybeSpill: function() {
            if (this.children.length <= 10) return;
            var me = this;
            do {
                var spilled = me.children.splice(me.children.length - 5, 5);
                var sibling = new BranchChunk(spilled);
                if (!me.parent) { // Become the parent node
                    var copy = new BranchChunk(me.children);
                    copy.parent = me;
                    me.children = [copy, sibling];
                    me = copy;
                } else {
                    me.size -= sibling.size;
                    me.height -= sibling.height;
                    var myIndex = indexOf(me.parent.children, me);
                    me.parent.children.splice(myIndex + 1, 0, sibling);
                }
                sibling.parent = me.parent;
            } while (me.children.length > 10);
            me.parent.maybeSpill();
        },
        iter: function(from, to, op) { this.iterN(from, to - from, op); },
        iterN: function(at, n, op) {
            for (var i = 0, e = this.children.length; i < e; ++i) {
                var child = this.children[i], sz = child.chunkSize();
                if (at < sz) {
                    var used = Math.min(n, sz - at);
                    if (child.iterN(at, used, op)) return true;
                    if ((n -= used) == 0) break;
                    at = 0;
                } else at -= sz;
            }
        }
    };

    function getLineAt(chunk, n) {
        while (!chunk.lines) {
            for (var i = 0;; ++i) {
                var child = chunk.children[i], sz = child.chunkSize();
                if (n < sz) { chunk = child; break; }
                n -= sz;
            }
        }
        return chunk.lines[n];
    }
    function lineNo(line) {
        if (line.parent == null) return null;
        var cur = line.parent, no = indexOf(cur.lines, line);
        for (var chunk = cur.parent; chunk; cur = chunk, chunk = chunk.parent) {
            for (var i = 0, e = chunk.children.length; ; ++i) {
                if (chunk.children[i] == cur) break;
                no += chunk.children[i].chunkSize();
            }
        }
        return no;
    }
    function lineAtHeight(chunk, h) {
        var n = 0;
        outer: do {
            for (var i = 0, e = chunk.children.length; i < e; ++i) {
                var child = chunk.children[i], ch = child.height;
                if (h < ch) { chunk = child; continue outer; }
                h -= ch;
                n += child.chunkSize();
            }
            return n;
        } while (!chunk.lines);
        for (var i = 0, e = chunk.lines.length; i < e; ++i) {
            var line = chunk.lines[i], lh = line.height;
            if (h < lh) break;
            h -= lh;
        }
        return n + i;
    }
    function heightAtLine(chunk, n) {
        var h = 0;
        outer: do {
            for (var i = 0, e = chunk.children.length; i < e; ++i) {
                var child = chunk.children[i], sz = child.chunkSize();
                if (n < sz) { chunk = child; continue outer; }
                n -= sz;
                h += child.height;
            }
            return h;
        } while (!chunk.lines);
        for (var i = 0; i < n; ++i) h += chunk.lines[i].height;
        return h;
    }

    // The history object 'chunks' changes that are made close together
    // and at almost the same time into bigger undoable units.
    function History() {
        this.time = 0;
        this.done = []; this.undone = [];
    }
    History.prototype = {
        addChange: function(start, added, old) {
            this.undone.length = 0;
            var time = +new Date, last = this.done[this.done.length - 1];
            if (time - this.time > 400 || !last ||
                last.start > start + added || last.start + last.added < start - last.added + last.old.length)
                this.done.push({start: start, added: added, old: old});
            else {
                var oldoff = 0;
                if (start < last.start) {
                    for (var i = last.start - start - 1; i >= 0; --i)
                        last.old.unshift(old[i]);
                    last.added += last.start - start;
                    last.start = start;
                }
                else if (last.start < start) {
                    oldoff = start - last.start;
                    added += oldoff;
                }
                for (var i = last.added - oldoff, e = old.length; i < e; ++i)
                    last.old.push(old[i]);
                if (last.added < added) last.added = added;
            }
            this.time = time;
        }
    };

    function stopMethod() {e_stop(this);}
    // Ensure an event has a stop method.
    function addStop(event) {
        if (!event.stop) event.stop = stopMethod;
        return event;
    }

    function e_preventDefault(e) {
        if (e.preventDefault) e.preventDefault();
        else e.returnValue = false;
    }
    function e_stopPropagation(e) {
        if (e.stopPropagation) e.stopPropagation();
        else e.cancelBubble = true;
    }
    function e_stop(e) {e_preventDefault(e); e_stopPropagation(e);}
    CodeMirror.e_stop = e_stop;
    CodeMirror.e_preventDefault = e_preventDefault;
    CodeMirror.e_stopPropagation = e_stopPropagation;

    function e_target(e) {return e.target || e.srcElement;}
    function e_button(e) {
        if (e.which) return e.which;
        else if (e.button & 1) return 1;
        else if (e.button & 2) return 3;
        else if (e.button & 4) return 2;
    }

    // Event handler registration. If disconnect is true, it'll return a
    // function that unregisters the handler.
    function connect(node, type, handler, disconnect) {
        if (typeof node.addEventListener == "function") {
            node.addEventListener(type, handler, false);
            if (disconnect) return function() {node.removeEventListener(type, handler, false);};
        }
        else {
            var wrapHandler = function(event) {handler(event || window.event);};
            node.attachEvent("on" + type, wrapHandler);
            if (disconnect) return function() {node.detachEvent("on" + type, wrapHandler);};
        }
    }
    CodeMirror.connect = connect;

    function Delayed() {this.id = null;}
    Delayed.prototype = {set: function(ms, f) {clearTimeout(this.id); this.id = setTimeout(f, ms);}};

    // Detect drag-and-drop
    var dragAndDrop = function() {
        // IE8 has ondragstart and ondrop properties, but doesn't seem to
        // actually support ondragstart the way it's supposed to work.
        if (/MSIE [1-8]\b/.test(navigator.userAgent)) return false;
        var div = document.createElement('div');
        return "draggable" in div;
    }();

    var gecko = /gecko\/\d{7}/i.test(navigator.userAgent);
    var ie = /MSIE \d/.test(navigator.userAgent);
    var webkit = /WebKit\//.test(navigator.userAgent);

    var lineSep = "\n";
    // Feature-detect whether newlines in textareas are converted to \r\n
    (function () {
        var te = document.createElement("textarea");
        te.value = "foo\nbar";
        if (te.value.indexOf("\r") > -1) lineSep = "\r\n";
    }());

    // Counts the column offset in a string, taking tabs into account.
    // Used mostly to find indentation.
    function countColumn(string, end, tabSize) {
        if (end == null) {
            end = string.search(/[^\s\u00a0]/);
            if (end == -1) end = string.length;
        }
        for (var i = 0, n = 0; i < end; ++i) {
            if (string.charAt(i) == "\t") n += tabSize - (n % tabSize);
            else ++n;
        }
        return n;
    }

    function computedStyle(elt) {
        if (elt.currentStyle) return elt.currentStyle;
        return window.getComputedStyle(elt, null);
    }

    // Find the position of an element by following the offsetParent chain.
    // If screen==true, it returns screen (rather than page) coordinates.
    function eltOffset(node, screen) {
        var bod = node.ownerDocument.body;
        var x = 0, y = 0, skipBody = false;
        for (var n = node; n; n = n.offsetParent) {
            var ol = n.offsetLeft, ot = n.offsetTop;
            // Firefox reports weird inverted offsets when the body has a border.
            if (n == bod) { x += Math.abs(ol); y += Math.abs(ot); }
            else { x += ol, y += ot; }
            if (screen && computedStyle(n).position == "fixed")
                skipBody = true;
        }
        var e = screen && !skipBody ? null : bod;
        for (var n = node.parentNode; n != e; n = n.parentNode)
            if (n.scrollLeft != null) { x -= n.scrollLeft; y -= n.scrollTop;}
        return {left: x, top: y};
    }
    // Use the faster and saner getBoundingClientRect method when possible.
    if (document.documentElement.getBoundingClientRect != null) eltOffset = function(node, screen) {
        // Take the parts of bounding client rect that we are interested in so we are able to edit if need be,
        // since the returned value cannot be changed externally (they are kept in sync as the element moves within the page)
        try { var box = node.getBoundingClientRect(); box = { top: box.top, left: box.left }; }
        catch(e) { box = {top: 0, left: 0}; }
        if (!screen) {
            // Get the toplevel scroll, working around browser differences.
            if (window.pageYOffset == null) {
                var t = document.documentElement || document.body.parentNode;
                if (t.scrollTop == null) t = document.body;
                box.top += t.scrollTop; box.left += t.scrollLeft;
            } else {
                box.top += window.pageYOffset; box.left += window.pageXOffset;
            }
        }
        return box;
    };

    // Get a node's text content.
    function eltText(node) {
        return node.textContent || node.innerText || node.nodeValue || "";
    }

    // Operations on {line, ch} objects.
    function posEq(a, b) {return a.line == b.line && a.ch == b.ch;}
    function posLess(a, b) {return a.line < b.line || (a.line == b.line && a.ch < b.ch);}
    function copyPos(x) {return {line: x.line, ch: x.ch};}

    var escapeElement = document.createElement("pre");
    function htmlEscape(str) {
        escapeElement.textContent = str;
        return escapeElement.innerHTML;
    }
    // Recent (late 2011) Opera betas insert bogus newlines at the start
    // of the textContent, so we strip those.
    if (htmlEscape("a") == "\na")
        htmlEscape = function(str) {
            escapeElement.textContent = str;
            return escapeElement.innerHTML.slice(1);
        };
    // Some IEs don't preserve tabs through innerHTML
    else if (htmlEscape("\t") != "\t")
        htmlEscape = function(str) {
            escapeElement.innerHTML = "";
            escapeElement.appendChild(document.createTextNode(str));
            return escapeElement.innerHTML;
        };
    CodeMirror.htmlEscape = htmlEscape;

    // Used to position the cursor after an undo/redo by finding the
    // last edited character.
    function editEnd(from, to) {
        if (!to) return from ? from.length : 0;
        if (!from) return to.length;
        for (var i = from.length, j = to.length; i >= 0 && j >= 0; --i, --j)
            if (from.charAt(i) != to.charAt(j)) break;
        return j + 1;
    }

    function indexOf(collection, elt) {
        if (collection.indexOf) return collection.indexOf(elt);
        for (var i = 0, e = collection.length; i < e; ++i)
            if (collection[i] == elt) return i;
        return -1;
    }
    function isWordChar(ch) {
        return /\w/.test(ch) || ch.toUpperCase() != ch.toLowerCase();
    }

    // See if "".split is the broken IE version, if so, provide an
    // alternative way to split lines.
    var splitLines = "\n\nb".split(/\n/).length != 3 ? function(string) {
        var pos = 0, nl, result = [];
        while ((nl = string.indexOf("\n", pos)) > -1) {
            result.push(string.slice(pos, string.charAt(nl-1) == "\r" ? nl - 1 : nl));
            pos = nl + 1;
        }
        result.push(string.slice(pos));
        return result;
    } : function(string){return string.split(/\r?\n/);};
    CodeMirror.splitLines = splitLines;

    var hasSelection = window.getSelection ? function(te) {
        try { return te.selectionStart != te.selectionEnd; }
        catch(e) { return false; }
    } : function(te) {
        try {var range = te.ownerDocument.selection.createRange();}
        catch(e) {}
        if (!range || range.parentElement() != te) return false;
        return range.compareEndPoints("StartToEnd", range) != 0;
    };

    CodeMirror.defineMode("null", function() {
        return {token: function(stream) {stream.skipToEnd();}};
    });
    CodeMirror.defineMIME("text/plain", "null");

    var keyNames = {3: "Enter", 8: "Backspace", 9: "Tab", 13: "Enter", 16: "Shift", 17: "Ctrl", 18: "Alt",
        19: "Pause", 20: "CapsLock", 27: "Esc", 32: "Space", 33: "PageUp", 34: "PageDown", 35: "End",
        36: "Home", 37: "Left", 38: "Up", 39: "Right", 40: "Down", 44: "PrintScrn", 45: "Insert",
        46: "Delete", 59: ";", 91: "Mod", 92: "Mod", 93: "Mod", 186: ";", 187: "=", 188: ",",
        189: "-", 190: ".", 191: "/", 192: "`", 219: "[", 220: "\\", 221: "]", 222: "'", 63276: "PageUp",
        63277: "PageDown", 63275: "End", 63273: "Home", 63234: "Left", 63232: "Up", 63235: "Right",
        63233: "Down", 63302: "Insert", 63272: "Delete"};
    CodeMirror.keyNames = keyNames;
    (function() {
        // Number keys
        for (var i = 0; i < 10; i++) keyNames[i + 48] = String(i);
        // Alphabetic keys
        for (var i = 65; i <= 90; i++) keyNames[i] = String.fromCharCode(i);
        // Function keys
        for (var i = 1; i <= 12; i++) keyNames[i + 111] = keyNames[i + 63235] = "F" + i;
    })();

    return CodeMirror;
})();
CodeMirror.defineMode("xml", function(config, parserConfig) {
    var indentUnit = config.indentUnit;
    var Kludges = parserConfig.htmlMode ? {
        autoSelfClosers: {"br": true, "img": true, "hr": true, "link": true, "input": true,
            "meta": true, "col": true, "frame": true, "base": true, "area": true},
        doNotIndent: {"pre": true},
        allowUnquoted: true
    } : {autoSelfClosers: {}, doNotIndent: {}, allowUnquoted: false};
    var alignCDATA = parserConfig.alignCDATA;

    // Return variables for tokenizers
    var tagName, type;

    function inText(stream, state) {
        function chain(parser) {
            state.tokenize = parser;
            return parser(stream, state);
        }

        var ch = stream.next();
        if (ch == "<") {
            if (stream.eat("!")) {
                if (stream.eat("[")) {
                    if (stream.match("CDATA[")) return chain(inBlock("atom", "]]>"));
                    else return null;
                }
                else if (stream.match("--")) return chain(inBlock("comment", "-->"));
                else if (stream.match("DOCTYPE", true, true)) {
                    stream.eatWhile(/[\w\._\-]/);
                    return chain(doctype(1));
                }
                else return null;
            }
            else if (stream.eat("?")) {
                stream.eatWhile(/[\w\._\-]/);
                state.tokenize = inBlock("meta", "?>");
                return "meta";
            }
            else {
                type = stream.eat("/") ? "closeTag" : "openTag";
                stream.eatSpace();
                tagName = "";
                var c;
                while ((c = stream.eat(/[^\s\u00a0=<>\"\'\/?]/))) tagName += c;
                state.tokenize = inTag;
                return "tag";
            }
        }
        else if (ch == "&") {
            stream.eatWhile(/[^;]/);
            stream.eat(";");
            return "atom";
        }
        else {
            stream.eatWhile(/[^&<]/);
            return null;
        }
    }

    function inTag(stream, state) {
        var ch = stream.next();
        if (ch == ">" || (ch == "/" && stream.eat(">"))) {
            state.tokenize = inText;
            type = ch == ">" ? "endTag" : "selfcloseTag";
            return "tag";
        }
        else if (ch == "=") {
            type = "equals";
            return null;
        }
        else if (/[\'\"]/.test(ch)) {
            state.tokenize = inAttribute(ch);
            return state.tokenize(stream, state);
        }
        else {
            stream.eatWhile(/[^\s\u00a0=<>\"\'\/?]/);
            return "word";
        }
    }

    function inAttribute(quote) {
        return function(stream, state) {
            while (!stream.eol()) {
                if (stream.next() == quote) {
                    state.tokenize = inTag;
                    break;
                }
            }
            return "string";
        };
    }

    function inBlock(style, terminator) {
        return function(stream, state) {
            while (!stream.eol()) {
                if (stream.match(terminator)) {
                    state.tokenize = inText;
                    break;
                }
                stream.next();
            }
            return style;
        };
    }
    function doctype(depth) {
        return function(stream, state) {
            var ch;
            while ((ch = stream.next()) != null) {
                if (ch == "<") {
                    state.tokenize = doctype(depth + 1);
                    return state.tokenize(stream, state);
                } else if (ch == ">") {
                    if (depth == 1) {
                        state.tokenize = inText;
                        break;
                    } else {
                        state.tokenize = doctype(depth - 1);
                        return state.tokenize(stream, state);
                    }
                }
            }
            return "meta";
        };
    }

    var curState, setStyle;
    function pass() {
        for (var i = arguments.length - 1; i >= 0; i--) curState.cc.push(arguments[i]);
    }
    function cont() {
        pass.apply(null, arguments);
        return true;
    }

    function pushContext(tagName, startOfLine) {
        var noIndent = Kludges.doNotIndent.hasOwnProperty(tagName) || (curState.context && curState.context.noIndent);
        curState.context = {
            prev: curState.context,
            tagName: tagName,
            indent: curState.indented,
            startOfLine: startOfLine,
            noIndent: noIndent
        };
    }
    function popContext() {
        if (curState.context) curState.context = curState.context.prev;
    }

    function element(type) {
        if (type == "openTag") {
            curState.tagName = tagName;
            return cont(attributes, endtag(curState.startOfLine));
        } else if (type == "closeTag") {
            var err = false;
            if (curState.context) {
                err = curState.context.tagName != tagName;
            } else {
                err = true;
            }
            if (err) setStyle = "error";
            return cont(endclosetag(err));
        }
        return cont();
    }
    function endtag(startOfLine) {
        return function(type) {
            if (type == "selfcloseTag" ||
                (type == "endTag" && Kludges.autoSelfClosers.hasOwnProperty(curState.tagName.toLowerCase())))
                return cont();
            if (type == "endTag") {pushContext(curState.tagName, startOfLine); return cont();}
            return cont();
        };
    }
    function endclosetag(err) {
        return function(type) {
            if (err) setStyle = "error";
            if (type == "endTag") { popContext(); return cont(); }
            setStyle = "error";
            return cont(arguments.callee);
        }
    }

    function attributes(type) {
        if (type == "word") {setStyle = "attribute"; return cont(attributes);}
        if (type == "equals") return cont(attvalue, attributes);
        if (type == "string") {setStyle = "error"; return cont(attributes);}
        return pass();
    }
    function attvalue(type) {
        if (type == "word" && Kludges.allowUnquoted) {setStyle = "string"; return cont();}
        if (type == "string") return cont(attvaluemaybe);
        return pass();
    }
    function attvaluemaybe(type) {
        if (type == "string") return cont(attvaluemaybe);
        else return pass();
    }

    return {
        startState: function() {
            return {tokenize: inText, cc: [], indented: 0, startOfLine: true, tagName: null, context: null};
        },

        token: function(stream, state) {
            if (stream.sol()) {
                state.startOfLine = true;
                state.indented = stream.indentation();
            }
            if (stream.eatSpace()) return null;

            setStyle = type = tagName = null;
            var style = state.tokenize(stream, state);
            state.type = type;
            if ((style || type) && style != "comment") {
                curState = state;
                while (true) {
                    var comb = state.cc.pop() || element;
                    if (comb(type || style)) break;
                }
            }
            state.startOfLine = false;
            return setStyle || style;
        },

        indent: function(state, textAfter, fullLine) {
            var context = state.context;
            if ((state.tokenize != inTag && state.tokenize != inText) ||
                context && context.noIndent)
                return fullLine ? fullLine.match(/^(\s*)/)[0].length : 0;
            if (alignCDATA && /<!\[CDATA\[/.test(textAfter)) return 0;
            if (context && /^<\//.test(textAfter))
                context = context.prev;
            while (context && !context.startOfLine)
                context = context.prev;
            if (context) return context.indent + indentUnit;
            else return 0;
        },

        compareStates: function(a, b) {
            if (a.indented != b.indented || a.tokenize != b.tokenize) return false;
            for (var ca = a.context, cb = b.context; ; ca = ca.prev, cb = cb.prev) {
                if (!ca || !cb) return ca == cb;
                if (ca.tagName != cb.tagName) return false;
            }
        },

        electricChars: "/"
    };
});

CodeMirror.defineMIME("application/xml", "xml");
CodeMirror.defineMIME("text/html", {name: "xml", htmlMode: true});
CodeMirror.defineMode("javascript", function(config, parserConfig) {
    var indentUnit = config.indentUnit;
    var jsonMode = parserConfig.json;

    // Tokenizer

    var keywords = function(){
        function kw(type) {return {type: type, style: "keyword"};}
        var A = kw("keyword a"), B = kw("keyword b"), C = kw("keyword c");
        var operator = kw("operator"), atom = {type: "atom", style: "atom"};
        return {
            "if": A, "while": A, "with": A, "else": B, "do": B, "try": B, "finally": B,
            "return": C, "break": C, "continue": C, "new": C, "delete": C, "throw": C,
            "var": kw("var"), "const": kw("var"), "let": kw("var"),
            "function": kw("function"), "catch": kw("catch"),
            "for": kw("for"), "switch": kw("switch"), "case": kw("case"), "default": kw("default"),
            "in": operator, "typeof": operator, "instanceof": operator,
            "true": atom, "false": atom, "null": atom, "undefined": atom, "NaN": atom, "Infinity": atom
        };
    }();

    var isOperatorChar = /[+\-*&%=<>!?|]/;

    function chain(stream, state, f) {
        state.tokenize = f;
        return f(stream, state);
    }

    function nextUntilUnescaped(stream, end) {
        var escaped = false, next;
        while ((next = stream.next()) != null) {
            if (next == end && !escaped)
                return false;
            escaped = !escaped && next == "\\";
        }
        return escaped;
    }

    // Used as scratch variables to communicate multiple values without
    // consing up tons of objects.
    var type, content;
    function ret(tp, style, cont) {
        type = tp; content = cont;
        return style;
    }

    function jsTokenBase(stream, state) {
        var ch = stream.next();
        if (ch == '"' || ch == "'")
            return chain(stream, state, jsTokenString(ch));
        else if (/[\[\]{}\(\),;\:\.]/.test(ch))
            return ret(ch);
        else if (ch == "0" && stream.eat(/x/i)) {
            stream.eatWhile(/[\da-f]/i);
            return ret("number", "number");
        }
        else if (/\d/.test(ch)) {
            stream.match(/^\d*(?:\.\d*)?(?:[eE][+\-]?\d+)?/);
            return ret("number", "number");
        }
        else if (ch == "/") {
            if (stream.eat("*")) {
                return chain(stream, state, jsTokenComment);
            }
            else if (stream.eat("/")) {
                stream.skipToEnd();
                return ret("comment", "comment");
            }
            else if (state.reAllowed) {
                nextUntilUnescaped(stream, "/");
                stream.eatWhile(/[gimy]/); // 'y' is "sticky" option in Mozilla
                return ret("regexp", "string");
            }
            else {
                stream.eatWhile(isOperatorChar);
                return ret("operator", null, stream.current());
            }
        }
        else if (ch == "#") {
            stream.skipToEnd();
            return ret("error", "error");
        }
        else if (isOperatorChar.test(ch)) {
            stream.eatWhile(isOperatorChar);
            return ret("operator", null, stream.current());
        }
        else {
            stream.eatWhile(/[\w\$_]/);
            var word = stream.current(), known = keywords.propertyIsEnumerable(word) && keywords[word];
            return (known && state.kwAllowed) ? ret(known.type, known.style, word) :
                ret("variable", "variable", word);
        }
    }

    function jsTokenString(quote) {
        return function(stream, state) {
            if (!nextUntilUnescaped(stream, quote))
                state.tokenize = jsTokenBase;
            return ret("string", "string");
        };
    }

    function jsTokenComment(stream, state) {
        var maybeEnd = false, ch;
        while (ch = stream.next()) {
            if (ch == "/" && maybeEnd) {
                state.tokenize = jsTokenBase;
                break;
            }
            maybeEnd = (ch == "*");
        }
        return ret("comment", "comment");
    }

    // Parser

    var atomicTypes = {"atom": true, "number": true, "variable": true, "string": true, "regexp": true};

    function JSLexical(indented, column, type, align, prev, info) {
        this.indented = indented;
        this.column = column;
        this.type = type;
        this.prev = prev;
        this.info = info;
        if (align != null) this.align = align;
    }

    function inScope(state, varname) {
        for (var v = state.localVars; v; v = v.next)
            if (v.name == varname) return true;
    }

    function parseJS(state, style, type, content, stream) {
        var cc = state.cc;
        // Communicate our context to the combinators.
        // (Less wasteful than consing up a hundred closures on every call.)
        cx.state = state; cx.stream = stream; cx.marked = null, cx.cc = cc;

        if (!state.lexical.hasOwnProperty("align"))
            state.lexical.align = true;

        while(true) {
            var combinator = cc.length ? cc.pop() : jsonMode ? expression : statement;
            if (combinator(type, content)) {
                while(cc.length && cc[cc.length - 1].lex)
                    cc.pop()();
                if (cx.marked) return cx.marked;
                if (type == "variable" && inScope(state, content)) return "variable-2";
                return style;
            }
        }
    }

    // Combinator utils

    var cx = {state: null, column: null, marked: null, cc: null};
    function pass() {
        for (var i = arguments.length - 1; i >= 0; i--) cx.cc.push(arguments[i]);
    }
    function cont() {
        pass.apply(null, arguments);
        return true;
    }
    function register(varname) {
        var state = cx.state;
        if (state.context) {
            cx.marked = "def";
            for (var v = state.localVars; v; v = v.next)
                if (v.name == varname) return;
            state.localVars = {name: varname, next: state.localVars};
        }
    }

    // Combinators

    var defaultVars = {name: "this", next: {name: "arguments"}};
    function pushcontext() {
        if (!cx.state.context) cx.state.localVars = defaultVars;
        cx.state.context = {prev: cx.state.context, vars: cx.state.localVars};
    }
    function popcontext() {
        cx.state.localVars = cx.state.context.vars;
        cx.state.context = cx.state.context.prev;
    }
    function pushlex(type, info) {
        var result = function() {
            var state = cx.state;
            state.lexical = new JSLexical(state.indented, cx.stream.column(), type, null, state.lexical, info)
        };
        result.lex = true;
        return result;
    }
    function poplex() {
        var state = cx.state;
        if (state.lexical.prev) {
            if (state.lexical.type == ")")
                state.indented = state.lexical.indented;
            state.lexical = state.lexical.prev;
        }
    }
    poplex.lex = true;

    function expect(wanted) {
        return function expecting(type) {
            if (type == wanted) return cont();
            else if (wanted == ";") return pass();
            else return cont(arguments.callee);
        };
    }

    function statement(type) {
        if (type == "var") return cont(pushlex("vardef"), vardef1, expect(";"), poplex);
        if (type == "keyword a") return cont(pushlex("form"), expression, statement, poplex);
        if (type == "keyword b") return cont(pushlex("form"), statement, poplex);
        if (type == "{") return cont(pushlex("}"), block, poplex);
        if (type == ";") return cont();
        if (type == "function") return cont(functiondef);
        if (type == "for") return cont(pushlex("form"), expect("("), pushlex(")"), forspec1, expect(")"),
            poplex, statement, poplex);
        if (type == "variable") return cont(pushlex("stat"), maybelabel);
        if (type == "switch") return cont(pushlex("form"), expression, pushlex("}", "switch"), expect("{"),
            block, poplex, poplex);
        if (type == "case") return cont(expression, expect(":"));
        if (type == "default") return cont(expect(":"));
        if (type == "catch") return cont(pushlex("form"), pushcontext, expect("("), funarg, expect(")"),
            statement, poplex, popcontext);
        return pass(pushlex("stat"), expression, expect(";"), poplex);
    }
    function expression(type) {
        if (atomicTypes.hasOwnProperty(type)) return cont(maybeoperator);
        if (type == "function") return cont(functiondef);
        if (type == "keyword c") return cont(maybeexpression);
        if (type == "(") return cont(pushlex(")"), expression, expect(")"), poplex, maybeoperator);
        if (type == "operator") return cont(expression);
        if (type == "[") return cont(pushlex("]"), commasep(expression, "]"), poplex, maybeoperator);
        if (type == "{") return cont(pushlex("}"), commasep(objprop, "}"), poplex, maybeoperator);
        return cont();
    }
    function maybeexpression(type) {
        if (type.match(/[;\}\)\],]/)) return pass();
        return pass(expression);
    }

    function maybeoperator(type, value) {
        if (type == "operator" && /\+\+|--/.test(value)) return cont(maybeoperator);
        if (type == "operator") return cont(expression);
        if (type == ";") return;
        if (type == "(") return cont(pushlex(")"), commasep(expression, ")"), poplex, maybeoperator);
        if (type == ".") return cont(property, maybeoperator);
        if (type == "[") return cont(pushlex("]"), expression, expect("]"), poplex, maybeoperator);
    }
    function maybelabel(type) {
        if (type == ":") return cont(poplex, statement);
        return pass(maybeoperator, expect(";"), poplex);
    }
    function property(type) {
        if (type == "variable") {cx.marked = "property"; return cont();}
    }
    function objprop(type) {
        if (type == "variable") cx.marked = "property";
        if (atomicTypes.hasOwnProperty(type)) return cont(expect(":"), expression);
    }
    function commasep(what, end) {
        function proceed(type) {
            if (type == ",") return cont(what, proceed);
            if (type == end) return cont();
            return cont(expect(end));
        }
        return function commaSeparated(type) {
            if (type == end) return cont();
            else return pass(what, proceed);
        };
    }
    function block(type) {
        if (type == "}") return cont();
        return pass(statement, block);
    }
    function vardef1(type, value) {
        if (type == "variable"){register(value); return cont(vardef2);}
        return cont();
    }
    function vardef2(type, value) {
        if (value == "=") return cont(expression, vardef2);
        if (type == ",") return cont(vardef1);
    }
    function forspec1(type) {
        if (type == "var") return cont(vardef1, forspec2);
        if (type == ";") return pass(forspec2);
        if (type == "variable") return cont(formaybein);
        return pass(forspec2);
    }
    function formaybein(type, value) {
        if (value == "in") return cont(expression);
        return cont(maybeoperator, forspec2);
    }
    function forspec2(type, value) {
        if (type == ";") return cont(forspec3);
        if (value == "in") return cont(expression);
        return cont(expression, expect(";"), forspec3);
    }
    function forspec3(type) {
        if (type != ")") cont(expression);
    }
    function functiondef(type, value) {
        if (type == "variable") {register(value); return cont(functiondef);}
        if (type == "(") return cont(pushlex(")"), pushcontext, commasep(funarg, ")"), poplex, statement, popcontext);
    }
    function funarg(type, value) {
        if (type == "variable") {register(value); return cont();}
    }

    // Interface

    return {
        startState: function(basecolumn) {
            return {
                tokenize: jsTokenBase,
                reAllowed: true,
                kwAllowed: true,
                cc: [],
                lexical: new JSLexical((basecolumn || 0) - indentUnit, 0, "block", false),
                localVars: null,
                context: null,
                indented: 0
            };
        },

        token: function(stream, state) {
            if (stream.sol()) {
                if (!state.lexical.hasOwnProperty("align"))
                    state.lexical.align = false;
                state.indented = stream.indentation();
            }
            if (stream.eatSpace()) return null;
            var style = state.tokenize(stream, state);
            if (type == "comment") return style;
            state.reAllowed = type == "operator" || type == "keyword c" || type.match(/^[\[{}\(,;:]$/);
            state.kwAllowed = type != '.';
            return parseJS(state, style, type, content, stream);
        },

        indent: function(state, textAfter) {
            if (state.tokenize != jsTokenBase) return 0;
            var firstChar = textAfter && textAfter.charAt(0), lexical = state.lexical,
                type = lexical.type, closing = firstChar == type;
            if (type == "vardef") return lexical.indented + 4;
            else if (type == "form" && firstChar == "{") return lexical.indented;
            else if (type == "stat" || type == "form") return lexical.indented + indentUnit;
            else if (lexical.info == "switch" && !closing)
                return lexical.indented + (/^(?:case|default)\b/.test(textAfter) ? indentUnit : 2 * indentUnit);
            else if (lexical.align) return lexical.column + (closing ? 0 : 1);
            else return lexical.indented + (closing ? 0 : indentUnit);
        },

        electricChars: ":{}"
    };
});

CodeMirror.defineMIME("text/javascript", "javascript");
CodeMirror.defineMIME("application/json", {name: "javascript", json: true});

CodeMirror.defineMode("css", function(config) {
    var indentUnit = config.indentUnit, type;
    function ret(style, tp) {type = tp; return style;}

    function tokenBase(stream, state) {
        var ch = stream.next();
        if (ch == "@") {stream.eatWhile(/[\w\\\-]/); return ret("meta", stream.current());}
        else if (ch == "/" && stream.eat("*")) {
            state.tokenize = tokenCComment;
            return tokenCComment(stream, state);
        }
        else if (ch == "<" && stream.eat("!")) {
            state.tokenize = tokenSGMLComment;
            return tokenSGMLComment(stream, state);
        }
        else if (ch == "=") ret(null, "compare");
        else if ((ch == "~" || ch == "|") && stream.eat("=")) return ret(null, "compare");
        else if (ch == "\"" || ch == "'") {
            state.tokenize = tokenString(ch);
            return state.tokenize(stream, state);
        }
        else if (ch == "#") {
            stream.eatWhile(/[\w\\\-]/);
            return ret("atom", "hash");
        }
        else if (ch == "!") {
            stream.match(/^\s*\w*/);
            return ret("keyword", "important");
        }
        else if (/\d/.test(ch)) {
            stream.eatWhile(/[\w.%]/);
            return ret("number", "unit");
        }
        else if (/[,.+>*\/]/.test(ch)) {
            return ret(null, "select-op");
        }
        else if (/[;{}:\[\]]/.test(ch)) {
            return ret(null, ch);
        }
        else {
            stream.eatWhile(/[\w\\\-]/);
            return ret("variable", "variable");
        }
    }

    function tokenCComment(stream, state) {
        var maybeEnd = false, ch;
        while ((ch = stream.next()) != null) {
            if (maybeEnd && ch == "/") {
                state.tokenize = tokenBase;
                break;
            }
            maybeEnd = (ch == "*");
        }
        return ret("comment", "comment");
    }

    function tokenSGMLComment(stream, state) {
        var dashes = 0, ch;
        while ((ch = stream.next()) != null) {
            if (dashes >= 2 && ch == ">") {
                state.tokenize = tokenBase;
                break;
            }
            dashes = (ch == "-") ? dashes + 1 : 0;
        }
        return ret("comment", "comment");
    }

    function tokenString(quote) {
        return function(stream, state) {
            var escaped = false, ch;
            while ((ch = stream.next()) != null) {
                if (ch == quote && !escaped)
                    break;
                escaped = !escaped && ch == "\\";
            }
            if (!escaped) state.tokenize = tokenBase;
            return ret("string", "string");
        };
    }

    return {
        startState: function(base) {
            return {tokenize: tokenBase,
                baseIndent: base || 0,
                stack: []};
        },

        token: function(stream, state) {
            if (stream.eatSpace()) return null;
            var style = state.tokenize(stream, state);

            var context = state.stack[state.stack.length-1];
            if (type == "hash" && context == "rule") style = "atom";
            else if (style == "variable") {
                if (context == "rule") style = "number";
                else if (!context || context == "@media{") style = "tag";
            }

            if (context == "rule" && /^[\{\};]$/.test(type))
                state.stack.pop();
            if (type == "{") {
                if (context == "@media") state.stack[state.stack.length-1] = "@media{";
                else state.stack.push("{");
            }
            else if (type == "}") state.stack.pop();
            else if (type == "@media") state.stack.push("@media");
            else if (context == "{" && type != "comment") state.stack.push("rule");
            return style;
        },

        indent: function(state, textAfter) {
            var n = state.stack.length;
            if (/^\}/.test(textAfter))
                n -= state.stack[state.stack.length-1] == "rule" ? 2 : 1;
            return state.baseIndent + n * indentUnit;
        },

        electricChars: "}"
    };
});

CodeMirror.defineMIME("text/css", "css");
CodeMirror.defineMode("htmlmixed", function(config, parserConfig) {
    var htmlMode = CodeMirror.getMode(config, {name: "xml", htmlMode: true});
    var jsMode = CodeMirror.getMode(config, "javascript");
    var cssMode = CodeMirror.getMode(config, "css");

    function html(stream, state) {
        var style = htmlMode.token(stream, state.htmlState);
        if (style == "tag" && stream.current() == ">" && state.htmlState.context) {
            if (/^script$/i.test(state.htmlState.context.tagName)) {
                state.token = javascript;
                state.localState = jsMode.startState(htmlMode.indent(state.htmlState, ""));
                state.mode = "javascript";
            }
            else if (/^style$/i.test(state.htmlState.context.tagName)) {
                state.token = css;
                state.localState = cssMode.startState(htmlMode.indent(state.htmlState, ""));
                state.mode = "css";
            }
        }
        return style;
    }
    function maybeBackup(stream, pat, style) {
        var cur = stream.current();
        var close = cur.search(pat);
        if (close > -1) stream.backUp(cur.length - close);
        return style;
    }
    function javascript(stream, state) {
        if (stream.match(/^<\/\s*script\s*>/i, false)) {
            state.token = html;
            state.curState = null;
            state.mode = "html";
            return html(stream, state);
        }
        return maybeBackup(stream, /<\/\s*script\s*>/,
            jsMode.token(stream, state.localState));
    }
    function css(stream, state) {
        if (stream.match(/^<\/\s*style\s*>/i, false)) {
            state.token = html;
            state.localState = null;
            state.mode = "html";
            return html(stream, state);
        }
        return maybeBackup(stream, /<\/\s*style\s*>/,
            cssMode.token(stream, state.localState));
    }

    return {
        startState: function() {
            var state = htmlMode.startState();
            return {token: html, localState: null, mode: "html", htmlState: state};
        },

        copyState: function(state) {
            if (state.localState)
                var local = CodeMirror.copyState(state.token == css ? cssMode : jsMode, state.localState);
            return {token: state.token, localState: local, mode: state.mode,
                htmlState: CodeMirror.copyState(htmlMode, state.htmlState)};
        },

        token: function(stream, state) {
            return state.token(stream, state);
        },

        indent: function(state, textAfter) {
            if (state.token == html || /^\s*<\//.test(textAfter))
                return htmlMode.indent(state.htmlState, textAfter);
            else if (state.token == javascript)
                return jsMode.indent(state.localState, textAfter);
            else
                return cssMode.indent(state.localState, textAfter);
        },

        compareStates: function(a, b) {
            return htmlMode.compareStates(a.htmlState, b.htmlState);
        },

        electricChars: "/{}:"
    }
});

CodeMirror.defineMIME("text/html", "htmlmixed");

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvdGhpcmQtcGFydHkvY29kZW1pcnJvci9jb2RlbWlycm9yLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvZGVNaXJyb3IgdmVyc2lvbiAyLjJcclxuLy9cclxuLy8gQWxsIGZ1bmN0aW9ucyB0aGF0IG5lZWQgYWNjZXNzIHRvIHRoZSBlZGl0b3IncyBzdGF0ZSBsaXZlIGluc2lkZVxyXG4vLyB0aGUgQ29kZU1pcnJvciBmdW5jdGlvbi4gQmVsb3cgdGhhdCwgYXQgdGhlIGJvdHRvbSBvZiB0aGUgZmlsZSxcclxuLy8gc29tZSB1dGlsaXRpZXMgYXJlIGRlZmluZWQuXHJcblxyXG4vLyBDb2RlTWlycm9yIGlzIHRoZSBvbmx5IGdsb2JhbCB2YXIgd2UgY2xhaW1cclxudmFyIENvZGVNaXJyb3IgPSAoZnVuY3Rpb24oKSB7XHJcbiAgICAvLyBUaGlzIGlzIHRoZSBmdW5jdGlvbiB0aGF0IHByb2R1Y2VzIGFuIGVkaXRvciBpbnN0YW5jZS4gSXQnc1xyXG4gICAgLy8gY2xvc3VyZSBpcyB1c2VkIHRvIHN0b3JlIHRoZSBlZGl0b3Igc3RhdGUuXHJcbiAgICBmdW5jdGlvbiBDb2RlTWlycm9yKHBsYWNlLCBnaXZlbk9wdGlvbnMpIHtcclxuICAgICAgICAvLyBEZXRlcm1pbmUgZWZmZWN0aXZlIG9wdGlvbnMgYmFzZWQgb24gZ2l2ZW4gdmFsdWVzIGFuZCBkZWZhdWx0cy5cclxuICAgICAgICB2YXIgb3B0aW9ucyA9IHt9LCBkZWZhdWx0cyA9IENvZGVNaXJyb3IuZGVmYXVsdHM7XHJcbiAgICAgICAgZm9yICh2YXIgb3B0IGluIGRlZmF1bHRzKVxyXG4gICAgICAgICAgICBpZiAoZGVmYXVsdHMuaGFzT3duUHJvcGVydHkob3B0KSlcclxuICAgICAgICAgICAgICAgIG9wdGlvbnNbb3B0XSA9IChnaXZlbk9wdGlvbnMgJiYgZ2l2ZW5PcHRpb25zLmhhc093blByb3BlcnR5KG9wdCkgPyBnaXZlbk9wdGlvbnMgOiBkZWZhdWx0cylbb3B0XTtcclxuXHJcbiAgICAgICAgdmFyIHRhcmdldERvY3VtZW50ID0gb3B0aW9uc1tcImRvY3VtZW50XCJdO1xyXG4gICAgICAgIC8vIFRoZSBlbGVtZW50IGluIHdoaWNoIHRoZSBlZGl0b3IgbGl2ZXMuXHJcbiAgICAgICAgdmFyIHdyYXBwZXIgPSB0YXJnZXREb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgIHdyYXBwZXIuY2xhc3NOYW1lID0gXCJDb2RlTWlycm9yXCIgKyAob3B0aW9ucy5saW5lV3JhcHBpbmcgPyBcIiBDb2RlTWlycm9yLXdyYXBcIiA6IFwiXCIpO1xyXG4gICAgICAgIC8vIFRoaXMgbWVzcyBjcmVhdGVzIHRoZSBiYXNlIERPTSBzdHJ1Y3R1cmUgZm9yIHRoZSBlZGl0b3IuXHJcbiAgICAgICAgd3JhcHBlci5pbm5lckhUTUwgPVxyXG4gICAgICAgICAgICAnPGRpdiBzdHlsZT1cIm92ZXJmbG93OiBoaWRkZW47IHBvc2l0aW9uOiByZWxhdGl2ZTsgd2lkdGg6IDNweDsgaGVpZ2h0OiAwcHg7XCI+JyArIC8vIFdyYXBzIGFuZCBoaWRlcyBpbnB1dCB0ZXh0YXJlYVxyXG4gICAgICAgICAgICAgICAgJzx0ZXh0YXJlYSBzdHlsZT1cInBvc2l0aW9uOiBhYnNvbHV0ZTsgcGFkZGluZzogMDsgd2lkdGg6IDFweDtcIiB3cmFwPVwib2ZmXCIgJyArXHJcbiAgICAgICAgICAgICAgICAnYXV0b2NvcnJlY3Q9XCJvZmZcIiBhdXRvY2FwaXRhbGl6ZT1cIm9mZlwiPjwvdGV4dGFyZWE+PC9kaXY+JyArXHJcbiAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cIkNvZGVNaXJyb3Itc2Nyb2xsXCIgdGFiaW5kZXg9XCItMVwiPicgK1xyXG4gICAgICAgICAgICAgICAgJzxkaXYgc3R5bGU9XCJwb3NpdGlvbjogcmVsYXRpdmVcIj4nICsgLy8gU2V0IHRvIHRoZSBoZWlnaHQgb2YgdGhlIHRleHQsIGNhdXNlcyBzY3JvbGxpbmdcclxuICAgICAgICAgICAgICAgICc8ZGl2IHN0eWxlPVwicG9zaXRpb246IHJlbGF0aXZlXCI+JyArIC8vIE1vdmVkIGFyb3VuZCBpdHMgcGFyZW50IHRvIGNvdmVyIHZpc2libGUgdmlld1xyXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJDb2RlTWlycm9yLWd1dHRlclwiPjxkaXYgY2xhc3M9XCJDb2RlTWlycm9yLWd1dHRlci10ZXh0XCI+PC9kaXY+PC9kaXY+JyArXHJcbiAgICAgICAgICAgICAgICAvLyBQcm92aWRlcyBwb3NpdGlvbmluZyByZWxhdGl2ZSB0byAodmlzaWJsZSkgdGV4dCBvcmlnaW5cclxuICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiQ29kZU1pcnJvci1saW5lc1wiPjxkaXYgc3R5bGU9XCJwb3NpdGlvbjogcmVsYXRpdmVcIj4nICtcclxuICAgICAgICAgICAgICAgICc8ZGl2IHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlOyB3aWR0aDogMTAwJTsgaGVpZ2h0OiAwOyBvdmVyZmxvdzogaGlkZGVuOyB2aXNpYmlsaXR5OiBoaWRkZW5cIj48L2Rpdj4nICtcclxuICAgICAgICAgICAgICAgICc8cHJlIGNsYXNzPVwiQ29kZU1pcnJvci1jdXJzb3JcIj4mIzE2MDs8L3ByZT4nICsgLy8gQWJzb2x1dGVseSBwb3NpdGlvbmVkIGJsaW5reSBjdXJzb3JcclxuICAgICAgICAgICAgICAgICc8ZGl2PjwvZGl2PicgKyAvLyBUaGlzIERJViBjb250YWlucyB0aGUgYWN0dWFsIGNvZGVcclxuICAgICAgICAgICAgICAgICc8L2Rpdj48L2Rpdj48L2Rpdj48L2Rpdj48L2Rpdj4nO1xyXG4gICAgICAgIGlmIChwbGFjZS5hcHBlbmRDaGlsZCkgcGxhY2UuYXBwZW5kQ2hpbGQod3JhcHBlcik7IGVsc2UgcGxhY2Uod3JhcHBlcik7XHJcbiAgICAgICAgLy8gSSd2ZSBuZXZlciBzZWVuIG1vcmUgZWxlZ2FudCBjb2RlIGluIG15IGxpZmUuXHJcbiAgICAgICAgdmFyIGlucHV0RGl2ID0gd3JhcHBlci5maXJzdENoaWxkLCBpbnB1dCA9IGlucHV0RGl2LmZpcnN0Q2hpbGQsXHJcbiAgICAgICAgICAgIHNjcm9sbGVyID0gd3JhcHBlci5sYXN0Q2hpbGQsIGNvZGUgPSBzY3JvbGxlci5maXJzdENoaWxkLFxyXG4gICAgICAgICAgICBtb3ZlciA9IGNvZGUuZmlyc3RDaGlsZCwgZ3V0dGVyID0gbW92ZXIuZmlyc3RDaGlsZCwgZ3V0dGVyVGV4dCA9IGd1dHRlci5maXJzdENoaWxkLFxyXG4gICAgICAgICAgICBsaW5lU3BhY2UgPSBndXR0ZXIubmV4dFNpYmxpbmcuZmlyc3RDaGlsZCwgbWVhc3VyZSA9IGxpbmVTcGFjZS5maXJzdENoaWxkLFxyXG4gICAgICAgICAgICBjdXJzb3IgPSBtZWFzdXJlLm5leHRTaWJsaW5nLCBsaW5lRGl2ID0gY3Vyc29yLm5leHRTaWJsaW5nO1xyXG4gICAgICAgIHRoZW1lQ2hhbmdlZCgpO1xyXG4gICAgICAgIC8vIE5lZWRlZCB0byBoaWRlIGJpZyBibHVlIGJsaW5raW5nIGN1cnNvciBvbiBNb2JpbGUgU2FmYXJpXHJcbiAgICAgICAgaWYgKC9BcHBsZVdlYktpdC8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSAmJiAvTW9iaWxlXFwvXFx3Ky8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSkgaW5wdXQuc3R5bGUud2lkdGggPSBcIjBweFwiO1xyXG4gICAgICAgIGlmICghd2Via2l0KSBsaW5lU3BhY2UuZHJhZ2dhYmxlID0gdHJ1ZTtcclxuICAgICAgICBpZiAob3B0aW9ucy50YWJpbmRleCAhPSBudWxsKSBpbnB1dC50YWJJbmRleCA9IG9wdGlvbnMudGFiaW5kZXg7XHJcbiAgICAgICAgaWYgKCFvcHRpb25zLmd1dHRlciAmJiAhb3B0aW9ucy5saW5lTnVtYmVycykgZ3V0dGVyLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcclxuXHJcbiAgICAgICAgLy8gQ2hlY2sgZm9yIHByb2JsZW0gd2l0aCBJRSBpbm5lckhUTUwgbm90IHdvcmtpbmcgd2hlbiB3ZSBoYXZlIGFcclxuICAgICAgICAvLyBQIChvciBzaW1pbGFyKSBwYXJlbnQgbm9kZS5cclxuICAgICAgICB0cnkgeyBzdHJpbmdXaWR0aChcInhcIik7IH1cclxuICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICBpZiAoZS5tZXNzYWdlLm1hdGNoKC9ydW50aW1lL2kpKVxyXG4gICAgICAgICAgICAgICAgZSA9IG5ldyBFcnJvcihcIkEgQ29kZU1pcnJvciBpbnNpZGUgYSBQLXN0eWxlIGVsZW1lbnQgZG9lcyBub3Qgd29yayBpbiBJbnRlcm5ldCBFeHBsb3Jlci4gKGlubmVySFRNTCBidWcpXCIpO1xyXG4gICAgICAgICAgICB0aHJvdyBlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRGVsYXllZCBvYmplY3Qgd3JhcCB0aW1lb3V0cywgbWFraW5nIHN1cmUgb25seSBvbmUgaXMgYWN0aXZlLiBibGlua2VyIGhvbGRzIGFuIGludGVydmFsLlxyXG4gICAgICAgIHZhciBwb2xsID0gbmV3IERlbGF5ZWQoKSwgaGlnaGxpZ2h0ID0gbmV3IERlbGF5ZWQoKSwgYmxpbmtlcjtcclxuXHJcbiAgICAgICAgLy8gbW9kZSBob2xkcyBhIG1vZGUgQVBJIG9iamVjdC4gZG9jIGlzIHRoZSB0cmVlIG9mIExpbmUgb2JqZWN0cyxcclxuICAgICAgICAvLyB3b3JrIGFuIGFycmF5IG9mIGxpbmVzIHRoYXQgc2hvdWxkIGJlIHBhcnNlZCwgYW5kIGhpc3RvcnkgdGhlXHJcbiAgICAgICAgLy8gdW5kbyBoaXN0b3J5IChpbnN0YW5jZSBvZiBIaXN0b3J5IGNvbnN0cnVjdG9yKS5cclxuICAgICAgICB2YXIgbW9kZSwgZG9jID0gbmV3IEJyYW5jaENodW5rKFtuZXcgTGVhZkNodW5rKFtuZXcgTGluZShcIlwiKV0pXSksIHdvcmssIGZvY3VzZWQ7XHJcbiAgICAgICAgbG9hZE1vZGUoKTtcclxuICAgICAgICAvLyBUaGUgc2VsZWN0aW9uLiBUaGVzZSBhcmUgYWx3YXlzIG1haW50YWluZWQgdG8gcG9pbnQgYXQgdmFsaWRcclxuICAgICAgICAvLyBwb3NpdGlvbnMuIEludmVydGVkIGlzIHVzZWQgdG8gcmVtZW1iZXIgdGhhdCB0aGUgdXNlciBpc1xyXG4gICAgICAgIC8vIHNlbGVjdGluZyBib3R0b20tdG8tdG9wLlxyXG4gICAgICAgIHZhciBzZWwgPSB7ZnJvbToge2xpbmU6IDAsIGNoOiAwfSwgdG86IHtsaW5lOiAwLCBjaDogMH0sIGludmVydGVkOiBmYWxzZX07XHJcbiAgICAgICAgLy8gU2VsZWN0aW9uLXJlbGF0ZWQgZmxhZ3MuIHNoaWZ0U2VsZWN0aW5nIG9idmlvdXNseSB0cmFja3NcclxuICAgICAgICAvLyB3aGV0aGVyIHRoZSB1c2VyIGlzIGhvbGRpbmcgc2hpZnQuXHJcbiAgICAgICAgdmFyIHNoaWZ0U2VsZWN0aW5nLCBsYXN0Q2xpY2ssIGxhc3REb3VibGVDbGljaywgZHJhZ2dpbmdUZXh0LCBvdmVyd3JpdGUgPSBmYWxzZTtcclxuICAgICAgICAvLyBWYXJpYWJsZXMgdXNlZCBieSBzdGFydE9wZXJhdGlvbi9lbmRPcGVyYXRpb24gdG8gdHJhY2sgd2hhdFxyXG4gICAgICAgIC8vIGhhcHBlbmVkIGR1cmluZyB0aGUgb3BlcmF0aW9uLlxyXG4gICAgICAgIHZhciB1cGRhdGVJbnB1dCwgdXNlclNlbENoYW5nZSwgY2hhbmdlcywgdGV4dENoYW5nZWQsIHNlbGVjdGlvbkNoYW5nZWQsIGxlYXZlSW5wdXRBbG9uZSxcclxuICAgICAgICAgICAgZ3V0dGVyRGlydHksIGNhbGxiYWNrcztcclxuICAgICAgICAvLyBDdXJyZW50IHZpc2libGUgcmFuZ2UgKG1heSBiZSBiaWdnZXIgdGhhbiB0aGUgdmlldyB3aW5kb3cpLlxyXG4gICAgICAgIHZhciBkaXNwbGF5T2Zmc2V0ID0gMCwgc2hvd2luZ0Zyb20gPSAwLCBzaG93aW5nVG8gPSAwLCBsYXN0U2l6ZUMgPSAwO1xyXG4gICAgICAgIC8vIGJyYWNrZXRIaWdobGlnaHRlZCBpcyB1c2VkIHRvIHJlbWVtYmVyIHRoYXQgYSBiYWNrZXQgaGFzIGJlZW5cclxuICAgICAgICAvLyBtYXJrZWQuXHJcbiAgICAgICAgdmFyIGJyYWNrZXRIaWdobGlnaHRlZDtcclxuICAgICAgICAvLyBUcmFja3MgdGhlIG1heGltdW0gbGluZSBsZW5ndGggc28gdGhhdCB0aGUgaG9yaXpvbnRhbCBzY3JvbGxiYXJcclxuICAgICAgICAvLyBjYW4gYmUga2VwdCBzdGF0aWMgd2hlbiBzY3JvbGxpbmcuXHJcbiAgICAgICAgdmFyIG1heExpbmUgPSBcIlwiLCBtYXhXaWR0aCwgdGFiVGV4dCA9IGNvbXB1dGVUYWJUZXh0KCk7XHJcblxyXG4gICAgICAgIC8vIEluaXRpYWxpemUgdGhlIGNvbnRlbnQuXHJcbiAgICAgICAgb3BlcmF0aW9uKGZ1bmN0aW9uKCl7c2V0VmFsdWUob3B0aW9ucy52YWx1ZSB8fCBcIlwiKTsgdXBkYXRlSW5wdXQgPSBmYWxzZTt9KSgpO1xyXG4gICAgICAgIHZhciBoaXN0b3J5ID0gbmV3IEhpc3RvcnkoKTtcclxuXHJcbiAgICAgICAgLy8gUmVnaXN0ZXIgb3VyIGV2ZW50IGhhbmRsZXJzLlxyXG4gICAgICAgIGNvbm5lY3Qoc2Nyb2xsZXIsIFwibW91c2Vkb3duXCIsIG9wZXJhdGlvbihvbk1vdXNlRG93bikpO1xyXG4gICAgICAgIGNvbm5lY3Qoc2Nyb2xsZXIsIFwiZGJsY2xpY2tcIiwgb3BlcmF0aW9uKG9uRG91YmxlQ2xpY2spKTtcclxuICAgICAgICBjb25uZWN0KGxpbmVTcGFjZSwgXCJkcmFnc3RhcnRcIiwgb25EcmFnU3RhcnQpO1xyXG4gICAgICAgIGNvbm5lY3QobGluZVNwYWNlLCBcInNlbGVjdHN0YXJ0XCIsIGVfcHJldmVudERlZmF1bHQpO1xyXG4gICAgICAgIC8vIEdlY2tvIGJyb3dzZXJzIGZpcmUgY29udGV4dG1lbnUgKmFmdGVyKiBvcGVuaW5nIHRoZSBtZW51LCBhdFxyXG4gICAgICAgIC8vIHdoaWNoIHBvaW50IHdlIGNhbid0IG1lc3Mgd2l0aCBpdCBhbnltb3JlLiBDb250ZXh0IG1lbnUgaXNcclxuICAgICAgICAvLyBoYW5kbGVkIGluIG9uTW91c2VEb3duIGZvciBHZWNrby5cclxuICAgICAgICBpZiAoIWdlY2tvKSBjb25uZWN0KHNjcm9sbGVyLCBcImNvbnRleHRtZW51XCIsIG9uQ29udGV4dE1lbnUpO1xyXG4gICAgICAgIGNvbm5lY3Qoc2Nyb2xsZXIsIFwic2Nyb2xsXCIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB1cGRhdGVEaXNwbGF5KFtdKTtcclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuZml4ZWRHdXR0ZXIpIGd1dHRlci5zdHlsZS5sZWZ0ID0gc2Nyb2xsZXIuc2Nyb2xsTGVmdCArIFwicHhcIjtcclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMub25TY3JvbGwpIG9wdGlvbnMub25TY3JvbGwoaW5zdGFuY2UpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGNvbm5lY3Qod2luZG93LCBcInJlc2l6ZVwiLCBmdW5jdGlvbigpIHt1cGRhdGVEaXNwbGF5KHRydWUpO30pO1xyXG4gICAgICAgIGNvbm5lY3QoaW5wdXQsIFwia2V5dXBcIiwgb3BlcmF0aW9uKG9uS2V5VXApKTtcclxuICAgICAgICBjb25uZWN0KGlucHV0LCBcImlucHV0XCIsIGZhc3RQb2xsKTtcclxuICAgICAgICBjb25uZWN0KGlucHV0LCBcImtleWRvd25cIiwgb3BlcmF0aW9uKG9uS2V5RG93bikpO1xyXG4gICAgICAgIGNvbm5lY3QoaW5wdXQsIFwia2V5cHJlc3NcIiwgb3BlcmF0aW9uKG9uS2V5UHJlc3MpKTtcclxuICAgICAgICBjb25uZWN0KGlucHV0LCBcImZvY3VzXCIsIG9uRm9jdXMpO1xyXG4gICAgICAgIGNvbm5lY3QoaW5wdXQsIFwiYmx1clwiLCBvbkJsdXIpO1xyXG5cclxuICAgICAgICBjb25uZWN0KHNjcm9sbGVyLCBcImRyYWdlbnRlclwiLCBlX3N0b3ApO1xyXG4gICAgICAgIGNvbm5lY3Qoc2Nyb2xsZXIsIFwiZHJhZ292ZXJcIiwgZV9zdG9wKTtcclxuICAgICAgICBjb25uZWN0KHNjcm9sbGVyLCBcImRyb3BcIiwgb3BlcmF0aW9uKG9uRHJvcCkpO1xyXG4gICAgICAgIGNvbm5lY3Qoc2Nyb2xsZXIsIFwicGFzdGVcIiwgZnVuY3Rpb24oKXtmb2N1c0lucHV0KCk7IGZhc3RQb2xsKCk7fSk7XHJcbiAgICAgICAgY29ubmVjdChpbnB1dCwgXCJwYXN0ZVwiLCBmYXN0UG9sbCk7XHJcbiAgICAgICAgY29ubmVjdChpbnB1dCwgXCJjdXRcIiwgb3BlcmF0aW9uKGZ1bmN0aW9uKCl7cmVwbGFjZVNlbGVjdGlvbihcIlwiKTt9KSk7XHJcblxyXG4gICAgICAgIC8vIElFIHRocm93cyB1bnNwZWNpZmllZCBlcnJvciBpbiBjZXJ0YWluIGNhc2VzLCB3aGVuXHJcbiAgICAgICAgLy8gdHJ5aW5nIHRvIGFjY2VzcyBhY3RpdmVFbGVtZW50IGJlZm9yZSBvbmxvYWRcclxuICAgICAgICB2YXIgaGFzRm9jdXM7IHRyeSB7IGhhc0ZvY3VzID0gKHRhcmdldERvY3VtZW50LmFjdGl2ZUVsZW1lbnQgPT0gaW5wdXQpOyB9IGNhdGNoKGUpIHsgfVxyXG4gICAgICAgIGlmIChoYXNGb2N1cykgc2V0VGltZW91dChvbkZvY3VzLCAyMCk7XHJcbiAgICAgICAgZWxzZSBvbkJsdXIoKTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gaXNMaW5lKGwpIHtyZXR1cm4gbCA+PSAwICYmIGwgPCBkb2Muc2l6ZTt9XHJcbiAgICAgICAgLy8gVGhlIGluc3RhbmNlIG9iamVjdCB0aGF0IHdlJ2xsIHJldHVybi4gTW9zdGx5IGNhbGxzIG91dCB0b1xyXG4gICAgICAgIC8vIGxvY2FsIGZ1bmN0aW9ucyBpbiB0aGUgQ29kZU1pcnJvciBmdW5jdGlvbi4gU29tZSBkbyBzb21lIGV4dHJhXHJcbiAgICAgICAgLy8gcmFuZ2UgY2hlY2tpbmcgYW5kL29yIGNsaXBwaW5nLiBvcGVyYXRpb24gaXMgdXNlZCB0byB3cmFwIHRoZVxyXG4gICAgICAgIC8vIGNhbGwgc28gdGhhdCBjaGFuZ2VzIGl0IG1ha2VzIGFyZSB0cmFja2VkLCBhbmQgdGhlIGRpc3BsYXkgaXNcclxuICAgICAgICAvLyB1cGRhdGVkIGFmdGVyd2FyZHMuXHJcbiAgICAgICAgdmFyIGluc3RhbmNlID0gd3JhcHBlci5Db2RlTWlycm9yID0ge1xyXG4gICAgICAgICAgICBnZXRWYWx1ZTogZ2V0VmFsdWUsXHJcbiAgICAgICAgICAgIHNldFZhbHVlOiBvcGVyYXRpb24oc2V0VmFsdWUpLFxyXG4gICAgICAgICAgICBnZXRTZWxlY3Rpb246IGdldFNlbGVjdGlvbixcclxuICAgICAgICAgICAgcmVwbGFjZVNlbGVjdGlvbjogb3BlcmF0aW9uKHJlcGxhY2VTZWxlY3Rpb24pLFxyXG4gICAgICAgICAgICBmb2N1czogZnVuY3Rpb24oKXtmb2N1c0lucHV0KCk7IG9uRm9jdXMoKTsgZmFzdFBvbGwoKTt9LFxyXG4gICAgICAgICAgICBzZXRPcHRpb246IGZ1bmN0aW9uKG9wdGlvbiwgdmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIHZhciBvbGRWYWwgPSBvcHRpb25zW29wdGlvbl07XHJcbiAgICAgICAgICAgICAgICBvcHRpb25zW29wdGlvbl0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIGlmIChvcHRpb24gPT0gXCJtb2RlXCIgfHwgb3B0aW9uID09IFwiaW5kZW50VW5pdFwiKSBsb2FkTW9kZSgpO1xyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAob3B0aW9uID09IFwicmVhZE9ubHlcIiAmJiB2YWx1ZSkge29uQmx1cigpOyBpbnB1dC5ibHVyKCk7fVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAob3B0aW9uID09IFwidGhlbWVcIikgdGhlbWVDaGFuZ2VkKCk7XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChvcHRpb24gPT0gXCJsaW5lV3JhcHBpbmdcIiAmJiBvbGRWYWwgIT0gdmFsdWUpIG9wZXJhdGlvbih3cmFwcGluZ0NoYW5nZWQpKCk7XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChvcHRpb24gPT0gXCJ0YWJTaXplXCIpIG9wZXJhdGlvbih0YWJzQ2hhbmdlZCkoKTtcclxuICAgICAgICAgICAgICAgIGlmIChvcHRpb24gPT0gXCJsaW5lTnVtYmVyc1wiIHx8IG9wdGlvbiA9PSBcImd1dHRlclwiIHx8IG9wdGlvbiA9PSBcImZpcnN0TGluZU51bWJlclwiIHx8IG9wdGlvbiA9PSBcInRoZW1lXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgb3BlcmF0aW9uKGd1dHRlckNoYW5nZWQpKCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGdldE9wdGlvbjogZnVuY3Rpb24ob3B0aW9uKSB7cmV0dXJuIG9wdGlvbnNbb3B0aW9uXTt9LFxyXG4gICAgICAgICAgICB1bmRvOiBvcGVyYXRpb24odW5kbyksXHJcbiAgICAgICAgICAgIHJlZG86IG9wZXJhdGlvbihyZWRvKSxcclxuICAgICAgICAgICAgaW5kZW50TGluZTogb3BlcmF0aW9uKGZ1bmN0aW9uKG4sIGRpcikge1xyXG4gICAgICAgICAgICAgICAgaWYgKGlzTGluZShuKSkgaW5kZW50TGluZShuLCBkaXIgPT0gbnVsbCA/IFwic21hcnRcIiA6IGRpciA/IFwiYWRkXCIgOiBcInN1YnRyYWN0XCIpO1xyXG4gICAgICAgICAgICB9KSxcclxuICAgICAgICAgICAgaW5kZW50U2VsZWN0aW9uOiBvcGVyYXRpb24oaW5kZW50U2VsZWN0ZWQpLFxyXG4gICAgICAgICAgICBoaXN0b3J5U2l6ZTogZnVuY3Rpb24oKSB7cmV0dXJuIHt1bmRvOiBoaXN0b3J5LmRvbmUubGVuZ3RoLCByZWRvOiBoaXN0b3J5LnVuZG9uZS5sZW5ndGh9O30sXHJcbiAgICAgICAgICAgIGNsZWFySGlzdG9yeTogZnVuY3Rpb24oKSB7aGlzdG9yeSA9IG5ldyBIaXN0b3J5KCk7fSxcclxuICAgICAgICAgICAgbWF0Y2hCcmFja2V0czogb3BlcmF0aW9uKGZ1bmN0aW9uKCl7bWF0Y2hCcmFja2V0cyh0cnVlKTt9KSxcclxuICAgICAgICAgICAgZ2V0VG9rZW5BdDogb3BlcmF0aW9uKGZ1bmN0aW9uKHBvcykge1xyXG4gICAgICAgICAgICAgICAgcG9zID0gY2xpcFBvcyhwb3MpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldExpbmUocG9zLmxpbmUpLmdldFRva2VuQXQobW9kZSwgZ2V0U3RhdGVCZWZvcmUocG9zLmxpbmUpLCBwb3MuY2gpO1xyXG4gICAgICAgICAgICB9KSxcclxuICAgICAgICAgICAgZ2V0U3RhdGVBZnRlcjogZnVuY3Rpb24obGluZSkge1xyXG4gICAgICAgICAgICAgICAgbGluZSA9IGNsaXBMaW5lKGxpbmUgPT0gbnVsbCA/IGRvYy5zaXplIC0gMTogbGluZSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0U3RhdGVCZWZvcmUobGluZSArIDEpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBjdXJzb3JDb29yZHM6IGZ1bmN0aW9uKHN0YXJ0KXtcclxuICAgICAgICAgICAgICAgIGlmIChzdGFydCA9PSBudWxsKSBzdGFydCA9IHNlbC5pbnZlcnRlZDtcclxuICAgICAgICAgICAgICAgIHJldHVybiBwYWdlQ29vcmRzKHN0YXJ0ID8gc2VsLmZyb20gOiBzZWwudG8pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBjaGFyQ29vcmRzOiBmdW5jdGlvbihwb3Mpe3JldHVybiBwYWdlQ29vcmRzKGNsaXBQb3MocG9zKSk7fSxcclxuICAgICAgICAgICAgY29vcmRzQ2hhcjogZnVuY3Rpb24oY29vcmRzKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgb2ZmID0gZWx0T2Zmc2V0KGxpbmVTcGFjZSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29vcmRzQ2hhcihjb29yZHMueCAtIG9mZi5sZWZ0LCBjb29yZHMueSAtIG9mZi50b3ApO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBtYXJrVGV4dDogb3BlcmF0aW9uKG1hcmtUZXh0KSxcclxuICAgICAgICAgICAgc2V0Qm9va21hcms6IHNldEJvb2ttYXJrLFxyXG4gICAgICAgICAgICBzZXRNYXJrZXI6IG9wZXJhdGlvbihhZGRHdXR0ZXJNYXJrZXIpLFxyXG4gICAgICAgICAgICBjbGVhck1hcmtlcjogb3BlcmF0aW9uKHJlbW92ZUd1dHRlck1hcmtlciksXHJcbiAgICAgICAgICAgIHNldExpbmVDbGFzczogb3BlcmF0aW9uKHNldExpbmVDbGFzcyksXHJcbiAgICAgICAgICAgIGhpZGVMaW5lOiBvcGVyYXRpb24oZnVuY3Rpb24oaCkge3JldHVybiBzZXRMaW5lSGlkZGVuKGgsIHRydWUpO30pLFxyXG4gICAgICAgICAgICBzaG93TGluZTogb3BlcmF0aW9uKGZ1bmN0aW9uKGgpIHtyZXR1cm4gc2V0TGluZUhpZGRlbihoLCBmYWxzZSk7fSksXHJcbiAgICAgICAgICAgIG9uRGVsZXRlTGluZTogZnVuY3Rpb24obGluZSwgZikge1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBsaW5lID09IFwibnVtYmVyXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzTGluZShsaW5lKSkgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgbGluZSA9IGdldExpbmUobGluZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAobGluZS5oYW5kbGVycyB8fCAobGluZS5oYW5kbGVycyA9IFtdKSkucHVzaChmKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBsaW5lO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBsaW5lSW5mbzogbGluZUluZm8sXHJcbiAgICAgICAgICAgIGFkZFdpZGdldDogZnVuY3Rpb24ocG9zLCBub2RlLCBzY3JvbGwsIHZlcnQsIGhvcml6KSB7XHJcbiAgICAgICAgICAgICAgICBwb3MgPSBsb2NhbENvb3JkcyhjbGlwUG9zKHBvcykpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHRvcCA9IHBvcy55Qm90LCBsZWZ0ID0gcG9zLng7XHJcbiAgICAgICAgICAgICAgICBub2RlLnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xyXG4gICAgICAgICAgICAgICAgY29kZS5hcHBlbmRDaGlsZChub2RlKTtcclxuICAgICAgICAgICAgICAgIGlmICh2ZXJ0ID09IFwib3ZlclwiKSB0b3AgPSBwb3MueTtcclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHZlcnQgPT0gXCJuZWFyXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdnNwYWNlID0gTWF0aC5tYXgoc2Nyb2xsZXIub2Zmc2V0SGVpZ2h0LCBkb2MuaGVpZ2h0ICogdGV4dEhlaWdodCgpKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaHNwYWNlID0gTWF0aC5tYXgoY29kZS5jbGllbnRXaWR0aCwgbGluZVNwYWNlLmNsaWVudFdpZHRoKSAtIHBhZGRpbmdMZWZ0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBvcy55Qm90ICsgbm9kZS5vZmZzZXRIZWlnaHQgPiB2c3BhY2UgJiYgcG9zLnkgPiBub2RlLm9mZnNldEhlaWdodClcclxuICAgICAgICAgICAgICAgICAgICAgICAgdG9wID0gcG9zLnkgLSBub2RlLm9mZnNldEhlaWdodDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobGVmdCArIG5vZGUub2Zmc2V0V2lkdGggPiBoc3BhY2UpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlZnQgPSBoc3BhY2UgLSBub2RlLm9mZnNldFdpZHRoO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgbm9kZS5zdHlsZS50b3AgPSAodG9wICsgcGFkZGluZ1RvcCgpKSArIFwicHhcIjtcclxuICAgICAgICAgICAgICAgIG5vZGUuc3R5bGUubGVmdCA9IG5vZGUuc3R5bGUucmlnaHQgPSBcIlwiO1xyXG4gICAgICAgICAgICAgICAgaWYgKGhvcml6ID09IFwicmlnaHRcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIGxlZnQgPSBjb2RlLmNsaWVudFdpZHRoIC0gbm9kZS5vZmZzZXRXaWR0aDtcclxuICAgICAgICAgICAgICAgICAgICBub2RlLnN0eWxlLnJpZ2h0ID0gXCIwcHhcIjtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGhvcml6ID09IFwibGVmdFwiKSBsZWZ0ID0gMDtcclxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChob3JpeiA9PSBcIm1pZGRsZVwiKSBsZWZ0ID0gKGNvZGUuY2xpZW50V2lkdGggLSBub2RlLm9mZnNldFdpZHRoKSAvIDI7XHJcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5zdHlsZS5sZWZ0ID0gKGxlZnQgKyBwYWRkaW5nTGVmdCgpKSArIFwicHhcIjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChzY3JvbGwpXHJcbiAgICAgICAgICAgICAgICAgICAgc2Nyb2xsSW50b1ZpZXcobGVmdCwgdG9wLCBsZWZ0ICsgbm9kZS5vZmZzZXRXaWR0aCwgdG9wICsgbm9kZS5vZmZzZXRIZWlnaHQpO1xyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgbGluZUNvdW50OiBmdW5jdGlvbigpIHtyZXR1cm4gZG9jLnNpemU7fSxcclxuICAgICAgICAgICAgY2xpcFBvczogY2xpcFBvcyxcclxuICAgICAgICAgICAgZ2V0Q3Vyc29yOiBmdW5jdGlvbihzdGFydCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHN0YXJ0ID09IG51bGwpIHN0YXJ0ID0gc2VsLmludmVydGVkO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvcHlQb3Moc3RhcnQgPyBzZWwuZnJvbSA6IHNlbC50byk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHNvbWV0aGluZ1NlbGVjdGVkOiBmdW5jdGlvbigpIHtyZXR1cm4gIXBvc0VxKHNlbC5mcm9tLCBzZWwudG8pO30sXHJcbiAgICAgICAgICAgIHNldEN1cnNvcjogb3BlcmF0aW9uKGZ1bmN0aW9uKGxpbmUsIGNoLCB1c2VyKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoY2ggPT0gbnVsbCAmJiB0eXBlb2YgbGluZS5saW5lID09IFwibnVtYmVyXCIpIHNldEN1cnNvcihsaW5lLmxpbmUsIGxpbmUuY2gsIHVzZXIpO1xyXG4gICAgICAgICAgICAgICAgZWxzZSBzZXRDdXJzb3IobGluZSwgY2gsIHVzZXIpO1xyXG4gICAgICAgICAgICB9KSxcclxuICAgICAgICAgICAgc2V0U2VsZWN0aW9uOiBvcGVyYXRpb24oZnVuY3Rpb24oZnJvbSwgdG8sIHVzZXIpIHtcclxuICAgICAgICAgICAgICAgICh1c2VyID8gc2V0U2VsZWN0aW9uVXNlciA6IHNldFNlbGVjdGlvbikoY2xpcFBvcyhmcm9tKSwgY2xpcFBvcyh0byB8fCBmcm9tKSk7XHJcbiAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICBnZXRMaW5lOiBmdW5jdGlvbihsaW5lKSB7aWYgKGlzTGluZShsaW5lKSkgcmV0dXJuIGdldExpbmUobGluZSkudGV4dDt9LFxyXG4gICAgICAgICAgICBnZXRMaW5lSGFuZGxlOiBmdW5jdGlvbihsaW5lKSB7aWYgKGlzTGluZShsaW5lKSkgcmV0dXJuIGdldExpbmUobGluZSk7fSxcclxuICAgICAgICAgICAgc2V0TGluZTogb3BlcmF0aW9uKGZ1bmN0aW9uKGxpbmUsIHRleHQpIHtcclxuICAgICAgICAgICAgICAgIGlmIChpc0xpbmUobGluZSkpIHJlcGxhY2VSYW5nZSh0ZXh0LCB7bGluZTogbGluZSwgY2g6IDB9LCB7bGluZTogbGluZSwgY2g6IGdldExpbmUobGluZSkudGV4dC5sZW5ndGh9KTtcclxuICAgICAgICAgICAgfSksXHJcbiAgICAgICAgICAgIHJlbW92ZUxpbmU6IG9wZXJhdGlvbihmdW5jdGlvbihsaW5lKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNMaW5lKGxpbmUpKSByZXBsYWNlUmFuZ2UoXCJcIiwge2xpbmU6IGxpbmUsIGNoOiAwfSwgY2xpcFBvcyh7bGluZTogbGluZSsxLCBjaDogMH0pKTtcclxuICAgICAgICAgICAgfSksXHJcbiAgICAgICAgICAgIHJlcGxhY2VSYW5nZTogb3BlcmF0aW9uKHJlcGxhY2VSYW5nZSksXHJcbiAgICAgICAgICAgIGdldFJhbmdlOiBmdW5jdGlvbihmcm9tLCB0bykge3JldHVybiBnZXRSYW5nZShjbGlwUG9zKGZyb20pLCBjbGlwUG9zKHRvKSk7fSxcclxuXHJcbiAgICAgICAgICAgIGV4ZWNDb21tYW5kOiBmdW5jdGlvbihjbWQpIHtyZXR1cm4gY29tbWFuZHNbY21kXShpbnN0YW5jZSk7fSxcclxuICAgICAgICAgICAgLy8gU3R1ZmYgdXNlZCBieSBjb21tYW5kcywgcHJvYmFibHkgbm90IG11Y2ggdXNlIHRvIG91dHNpZGUgY29kZS5cclxuICAgICAgICAgICAgbW92ZUg6IG9wZXJhdGlvbihtb3ZlSCksXHJcbiAgICAgICAgICAgIGRlbGV0ZUg6IG9wZXJhdGlvbihkZWxldGVIKSxcclxuICAgICAgICAgICAgbW92ZVY6IG9wZXJhdGlvbihtb3ZlViksXHJcbiAgICAgICAgICAgIHRvZ2dsZU92ZXJ3cml0ZTogZnVuY3Rpb24oKSB7b3ZlcndyaXRlID0gIW92ZXJ3cml0ZTt9LFxyXG5cclxuICAgICAgICAgICAgcG9zRnJvbUluZGV4OiBmdW5jdGlvbihvZmYpIHtcclxuICAgICAgICAgICAgICAgIHZhciBsaW5lTm8gPSAwLCBjaDtcclxuICAgICAgICAgICAgICAgIGRvYy5pdGVyKDAsIGRvYy5zaXplLCBmdW5jdGlvbihsaW5lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN6ID0gbGluZS50ZXh0Lmxlbmd0aCArIDE7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN6ID4gb2ZmKSB7IGNoID0gb2ZmOyByZXR1cm4gdHJ1ZTsgfVxyXG4gICAgICAgICAgICAgICAgICAgIG9mZiAtPSBzejtcclxuICAgICAgICAgICAgICAgICAgICArK2xpbmVObztcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNsaXBQb3Moe2xpbmU6IGxpbmVObywgY2g6IGNofSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGluZGV4RnJvbVBvczogZnVuY3Rpb24gKGNvb3Jkcykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGNvb3Jkcy5saW5lIDwgMCB8fCBjb29yZHMuY2ggPCAwKSByZXR1cm4gMDtcclxuICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IGNvb3Jkcy5jaDtcclxuICAgICAgICAgICAgICAgIGRvYy5pdGVyKDAsIGNvb3Jkcy5saW5lLCBmdW5jdGlvbiAobGluZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGluZGV4ICs9IGxpbmUudGV4dC5sZW5ndGggKyAxO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaW5kZXg7XHJcbiAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICBvcGVyYXRpb246IGZ1bmN0aW9uKGYpe3JldHVybiBvcGVyYXRpb24oZikoKTt9LFxyXG4gICAgICAgICAgICByZWZyZXNoOiBmdW5jdGlvbigpe3VwZGF0ZURpc3BsYXkodHJ1ZSk7fSxcclxuICAgICAgICAgICAgZ2V0SW5wdXRGaWVsZDogZnVuY3Rpb24oKXtyZXR1cm4gaW5wdXQ7fSxcclxuICAgICAgICAgICAgZ2V0V3JhcHBlckVsZW1lbnQ6IGZ1bmN0aW9uKCl7cmV0dXJuIHdyYXBwZXI7fSxcclxuICAgICAgICAgICAgZ2V0U2Nyb2xsZXJFbGVtZW50OiBmdW5jdGlvbigpe3JldHVybiBzY3JvbGxlcjt9LFxyXG4gICAgICAgICAgICBnZXRHdXR0ZXJFbGVtZW50OiBmdW5jdGlvbigpe3JldHVybiBndXR0ZXI7fVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGdldExpbmUobikgeyByZXR1cm4gZ2V0TGluZUF0KGRvYywgbik7IH1cclxuICAgICAgICBmdW5jdGlvbiB1cGRhdGVMaW5lSGVpZ2h0KGxpbmUsIGhlaWdodCkge1xyXG4gICAgICAgICAgICBndXR0ZXJEaXJ0eSA9IHRydWU7XHJcbiAgICAgICAgICAgIHZhciBkaWZmID0gaGVpZ2h0IC0gbGluZS5oZWlnaHQ7XHJcbiAgICAgICAgICAgIGZvciAodmFyIG4gPSBsaW5lOyBuOyBuID0gbi5wYXJlbnQpIG4uaGVpZ2h0ICs9IGRpZmY7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBzZXRWYWx1ZShjb2RlKSB7XHJcbiAgICAgICAgICAgIHZhciB0b3AgPSB7bGluZTogMCwgY2g6IDB9O1xyXG4gICAgICAgICAgICB1cGRhdGVMaW5lcyh0b3AsIHtsaW5lOiBkb2Muc2l6ZSAtIDEsIGNoOiBnZXRMaW5lKGRvYy5zaXplLTEpLnRleHQubGVuZ3RofSxcclxuICAgICAgICAgICAgICAgIHNwbGl0TGluZXMoY29kZSksIHRvcCwgdG9wKTtcclxuICAgICAgICAgICAgdXBkYXRlSW5wdXQgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBnZXRWYWx1ZShjb2RlKSB7XHJcbiAgICAgICAgICAgIHZhciB0ZXh0ID0gW107XHJcbiAgICAgICAgICAgIGRvYy5pdGVyKDAsIGRvYy5zaXplLCBmdW5jdGlvbihsaW5lKSB7IHRleHQucHVzaChsaW5lLnRleHQpOyB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIHRleHQuam9pbihcIlxcblwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIG9uTW91c2VEb3duKGUpIHtcclxuICAgICAgICAgICAgc2V0U2hpZnQoZS5zaGlmdEtleSk7XHJcbiAgICAgICAgICAgIC8vIENoZWNrIHdoZXRoZXIgdGhpcyBpcyBhIGNsaWNrIGluIGEgd2lkZ2V0XHJcbiAgICAgICAgICAgIGZvciAodmFyIG4gPSBlX3RhcmdldChlKTsgbiAhPSB3cmFwcGVyOyBuID0gbi5wYXJlbnROb2RlKVxyXG4gICAgICAgICAgICAgICAgaWYgKG4ucGFyZW50Tm9kZSA9PSBjb2RlICYmIG4gIT0gbW92ZXIpIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgIC8vIFNlZSBpZiB0aGlzIGlzIGEgY2xpY2sgaW4gdGhlIGd1dHRlclxyXG4gICAgICAgICAgICBmb3IgKHZhciBuID0gZV90YXJnZXQoZSk7IG4gIT0gd3JhcHBlcjsgbiA9IG4ucGFyZW50Tm9kZSlcclxuICAgICAgICAgICAgICAgIGlmIChuLnBhcmVudE5vZGUgPT0gZ3V0dGVyVGV4dCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLm9uR3V0dGVyQ2xpY2spXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMub25HdXR0ZXJDbGljayhpbnN0YW5jZSwgaW5kZXhPZihndXR0ZXJUZXh0LmNoaWxkTm9kZXMsIG4pICsgc2hvd2luZ0Zyb20sIGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlX3ByZXZlbnREZWZhdWx0KGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHN0YXJ0ID0gcG9zRnJvbU1vdXNlKGUpO1xyXG5cclxuICAgICAgICAgICAgc3dpdGNoIChlX2J1dHRvbihlKSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAzOlxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChnZWNrbyAmJiAhbWFjKSBvbkNvbnRleHRNZW51KGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIGNhc2UgMjpcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc3RhcnQpIHNldEN1cnNvcihzdGFydC5saW5lLCBzdGFydC5jaCwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIEZvciBidXR0b24gMSwgaWYgaXQgd2FzIGNsaWNrZWQgaW5zaWRlIHRoZSBlZGl0b3JcclxuICAgICAgICAgICAgLy8gKHBvc0Zyb21Nb3VzZSByZXR1cm5pbmcgbm9uLW51bGwpLCB3ZSBoYXZlIHRvIGFkanVzdCB0aGVcclxuICAgICAgICAgICAgLy8gc2VsZWN0aW9uLlxyXG4gICAgICAgICAgICBpZiAoIXN0YXJ0KSB7aWYgKGVfdGFyZ2V0KGUpID09IHNjcm9sbGVyKSBlX3ByZXZlbnREZWZhdWx0KGUpOyByZXR1cm47fVxyXG5cclxuICAgICAgICAgICAgaWYgKCFmb2N1c2VkKSBvbkZvY3VzKCk7XHJcblxyXG4gICAgICAgICAgICB2YXIgbm93ID0gK25ldyBEYXRlO1xyXG4gICAgICAgICAgICBpZiAobGFzdERvdWJsZUNsaWNrICYmIGxhc3REb3VibGVDbGljay50aW1lID4gbm93IC0gNDAwICYmIHBvc0VxKGxhc3REb3VibGVDbGljay5wb3MsIHN0YXJ0KSkge1xyXG4gICAgICAgICAgICAgICAgZV9wcmV2ZW50RGVmYXVsdChlKTtcclxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZm9jdXNJbnB1dCwgMjApO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlbGVjdExpbmUoc3RhcnQubGluZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobGFzdENsaWNrICYmIGxhc3RDbGljay50aW1lID4gbm93IC0gNDAwICYmIHBvc0VxKGxhc3RDbGljay5wb3MsIHN0YXJ0KSkge1xyXG4gICAgICAgICAgICAgICAgbGFzdERvdWJsZUNsaWNrID0ge3RpbWU6IG5vdywgcG9zOiBzdGFydH07XHJcbiAgICAgICAgICAgICAgICBlX3ByZXZlbnREZWZhdWx0KGUpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlbGVjdFdvcmRBdChzdGFydCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7IGxhc3RDbGljayA9IHt0aW1lOiBub3csIHBvczogc3RhcnR9OyB9XHJcblxyXG4gICAgICAgICAgICB2YXIgbGFzdCA9IHN0YXJ0LCBnb2luZztcclxuICAgICAgICAgICAgaWYgKGRyYWdBbmREcm9wICYmICFwb3NFcShzZWwuZnJvbSwgc2VsLnRvKSAmJlxyXG4gICAgICAgICAgICAgICAgIXBvc0xlc3Moc3RhcnQsIHNlbC5mcm9tKSAmJiAhcG9zTGVzcyhzZWwudG8sIHN0YXJ0KSkge1xyXG4gICAgICAgICAgICAgICAgLy8gTGV0IHRoZSBkcmFnIGhhbmRsZXIgaGFuZGxlIHRoaXMuXHJcbiAgICAgICAgICAgICAgICBpZiAod2Via2l0KSBsaW5lU3BhY2UuZHJhZ2dhYmxlID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHZhciB1cCA9IGNvbm5lY3QodGFyZ2V0RG9jdW1lbnQsIFwibW91c2V1cFwiLCBvcGVyYXRpb24oZnVuY3Rpb24oZTIpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAod2Via2l0KSBsaW5lU3BhY2UuZHJhZ2dhYmxlID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgZHJhZ2dpbmdUZXh0ID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgdXAoKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoTWF0aC5hYnMoZS5jbGllbnRYIC0gZTIuY2xpZW50WCkgKyBNYXRoLmFicyhlLmNsaWVudFkgLSBlMi5jbGllbnRZKSA8IDEwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVfcHJldmVudERlZmF1bHQoZTIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRDdXJzb3Ioc3RhcnQubGluZSwgc3RhcnQuY2gsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb2N1c0lucHV0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSksIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgZHJhZ2dpbmdUZXh0ID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlX3ByZXZlbnREZWZhdWx0KGUpO1xyXG4gICAgICAgICAgICBzZXRDdXJzb3Ioc3RhcnQubGluZSwgc3RhcnQuY2gsIHRydWUpO1xyXG5cclxuICAgICAgICAgICAgZnVuY3Rpb24gZXh0ZW5kKGUpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjdXIgPSBwb3NGcm9tTW91c2UoZSwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoY3VyICYmICFwb3NFcShjdXIsIGxhc3QpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFmb2N1c2VkKSBvbkZvY3VzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgbGFzdCA9IGN1cjtcclxuICAgICAgICAgICAgICAgICAgICBzZXRTZWxlY3Rpb25Vc2VyKHN0YXJ0LCBjdXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZUlucHV0ID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZpc2libGUgPSB2aXNpYmxlTGluZXMoKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoY3VyLmxpbmUgPj0gdmlzaWJsZS50byB8fCBjdXIubGluZSA8IHZpc2libGUuZnJvbSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgZ29pbmcgPSBzZXRUaW1lb3V0KG9wZXJhdGlvbihmdW5jdGlvbigpe2V4dGVuZChlKTt9KSwgMTUwKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIG1vdmUgPSBjb25uZWN0KHRhcmdldERvY3VtZW50LCBcIm1vdXNlbW92ZVwiLCBvcGVyYXRpb24oZnVuY3Rpb24oZSkge1xyXG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KGdvaW5nKTtcclxuICAgICAgICAgICAgICAgIGVfcHJldmVudERlZmF1bHQoZSk7XHJcbiAgICAgICAgICAgICAgICBleHRlbmQoZSk7XHJcbiAgICAgICAgICAgIH0pLCB0cnVlKTtcclxuICAgICAgICAgICAgdmFyIHVwID0gY29ubmVjdCh0YXJnZXREb2N1bWVudCwgXCJtb3VzZXVwXCIsIG9wZXJhdGlvbihmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoZ29pbmcpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGN1ciA9IHBvc0Zyb21Nb3VzZShlKTtcclxuICAgICAgICAgICAgICAgIGlmIChjdXIpIHNldFNlbGVjdGlvblVzZXIoc3RhcnQsIGN1cik7XHJcbiAgICAgICAgICAgICAgICBlX3ByZXZlbnREZWZhdWx0KGUpO1xyXG4gICAgICAgICAgICAgICAgZm9jdXNJbnB1dCgpO1xyXG4gICAgICAgICAgICAgICAgdXBkYXRlSW5wdXQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgbW92ZSgpOyB1cCgpO1xyXG4gICAgICAgICAgICB9KSwgdHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIG9uRG91YmxlQ2xpY2soZSkge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBuID0gZV90YXJnZXQoZSk7IG4gIT0gd3JhcHBlcjsgbiA9IG4ucGFyZW50Tm9kZSlcclxuICAgICAgICAgICAgICAgIGlmIChuLnBhcmVudE5vZGUgPT0gZ3V0dGVyVGV4dCkgcmV0dXJuIGVfcHJldmVudERlZmF1bHQoZSk7XHJcbiAgICAgICAgICAgIHZhciBzdGFydCA9IHBvc0Zyb21Nb3VzZShlKTtcclxuICAgICAgICAgICAgaWYgKCFzdGFydCkgcmV0dXJuO1xyXG4gICAgICAgICAgICBsYXN0RG91YmxlQ2xpY2sgPSB7dGltZTogK25ldyBEYXRlLCBwb3M6IHN0YXJ0fTtcclxuICAgICAgICAgICAgZV9wcmV2ZW50RGVmYXVsdChlKTtcclxuICAgICAgICAgICAgc2VsZWN0V29yZEF0KHN0YXJ0KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gb25Ecm9wKGUpIHtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICB2YXIgcG9zID0gcG9zRnJvbU1vdXNlKGUsIHRydWUpLCBmaWxlcyA9IGUuZGF0YVRyYW5zZmVyLmZpbGVzO1xyXG4gICAgICAgICAgICBpZiAoIXBvcyB8fCBvcHRpb25zLnJlYWRPbmx5KSByZXR1cm47XHJcbiAgICAgICAgICAgIGlmIChmaWxlcyAmJiBmaWxlcy5sZW5ndGggJiYgd2luZG93LkZpbGVSZWFkZXIgJiYgd2luZG93LkZpbGUpIHtcclxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGxvYWRGaWxlKGZpbGUsIGkpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXI7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0W2ldID0gcmVhZGVyLnJlc3VsdDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCsrcmVhZCA9PSBuKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3MgPSBjbGlwUG9zKHBvcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcGVyYXRpb24oZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGVuZCA9IHJlcGxhY2VSYW5nZSh0ZXh0LmpvaW4oXCJcIiksIHBvcywgcG9zKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRTZWxlY3Rpb25Vc2VyKHBvcywgZW5kKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIHJlYWRlci5yZWFkQXNUZXh0KGZpbGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdmFyIG4gPSBmaWxlcy5sZW5ndGgsIHRleHQgPSBBcnJheShuKSwgcmVhZCA9IDA7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG47ICsraSkgbG9hZEZpbGUoZmlsZXNbaV0sIGkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdGV4dCA9IGUuZGF0YVRyYW5zZmVyLmdldERhdGEoXCJUZXh0XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0ZXh0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlbmQgPSByZXBsYWNlUmFuZ2UodGV4dCwgcG9zLCBwb3MpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY3VyRnJvbSA9IHNlbC5mcm9tLCBjdXJUbyA9IHNlbC50bztcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2V0U2VsZWN0aW9uVXNlcihwb3MsIGVuZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkcmFnZ2luZ1RleHQpIHJlcGxhY2VSYW5nZShcIlwiLCBjdXJGcm9tLCBjdXJUbyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvY3VzSW5wdXQoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXRjaChlKXt9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gb25EcmFnU3RhcnQoZSkge1xyXG4gICAgICAgICAgICB2YXIgdHh0ID0gZ2V0U2VsZWN0aW9uKCk7XHJcbiAgICAgICAgICAgIC8vIFRoaXMgd2lsbCByZXNldCBlc2NhcGVFbGVtZW50XHJcbiAgICAgICAgICAgIGh0bWxFc2NhcGUodHh0KTtcclxuICAgICAgICAgICAgZS5kYXRhVHJhbnNmZXIuc2V0RHJhZ0ltYWdlKGVzY2FwZUVsZW1lbnQsIDAsIDApO1xyXG4gICAgICAgICAgICBlLmRhdGFUcmFuc2Zlci5zZXREYXRhKFwiVGV4dFwiLCB0eHQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBoYW5kbGVLZXlCaW5kaW5nKGUpIHtcclxuICAgICAgICAgICAgdmFyIG5hbWUgPSBrZXlOYW1lc1tlLmtleUNvZGVdLCBuZXh0ID0ga2V5TWFwW29wdGlvbnMua2V5TWFwXS5hdXRvLCBib3VuZCwgZHJvcFNoaWZ0O1xyXG4gICAgICAgICAgICBpZiAobmFtZSA9PSBudWxsIHx8IGUuYWx0R3JhcGhLZXkpIHtcclxuICAgICAgICAgICAgICAgIGlmIChuZXh0KSBvcHRpb25zLmtleU1hcCA9IG5leHQ7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoZS5hbHRLZXkpIG5hbWUgPSBcIkFsdC1cIiArIG5hbWU7XHJcbiAgICAgICAgICAgIGlmIChlLmN0cmxLZXkpIG5hbWUgPSBcIkN0cmwtXCIgKyBuYW1lO1xyXG4gICAgICAgICAgICBpZiAoZS5tZXRhS2V5KSBuYW1lID0gXCJDbWQtXCIgKyBuYW1lO1xyXG4gICAgICAgICAgICBpZiAoZS5zaGlmdEtleSAmJiAoYm91bmQgPSBsb29rdXBLZXkoXCJTaGlmdC1cIiArIG5hbWUsIG9wdGlvbnMuZXh0cmFLZXlzLCBvcHRpb25zLmtleU1hcCkpKSB7XHJcbiAgICAgICAgICAgICAgICBkcm9wU2hpZnQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgYm91bmQgPSBsb29rdXBLZXkobmFtZSwgb3B0aW9ucy5leHRyYUtleXMsIG9wdGlvbnMua2V5TWFwKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIGJvdW5kID09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgICAgICAgIGlmIChjb21tYW5kcy5wcm9wZXJ0eUlzRW51bWVyYWJsZShib3VuZCkpIGJvdW5kID0gY29tbWFuZHNbYm91bmRdO1xyXG4gICAgICAgICAgICAgICAgZWxzZSBib3VuZCA9IG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKG5leHQgJiYgKGJvdW5kIHx8ICFpc01vZGlmaWVyS2V5KGUpKSkgb3B0aW9ucy5rZXlNYXAgPSBuZXh0O1xyXG4gICAgICAgICAgICBpZiAoIWJvdW5kKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIGlmIChkcm9wU2hpZnQpIHtcclxuICAgICAgICAgICAgICAgIHZhciBwcmV2U2hpZnQgPSBzaGlmdFNlbGVjdGluZztcclxuICAgICAgICAgICAgICAgIHNoaWZ0U2VsZWN0aW5nID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIGJvdW5kKGluc3RhbmNlKTtcclxuICAgICAgICAgICAgICAgIHNoaWZ0U2VsZWN0aW5nID0gcHJldlNoaWZ0O1xyXG4gICAgICAgICAgICB9IGVsc2UgYm91bmQoaW5zdGFuY2UpO1xyXG4gICAgICAgICAgICBlX3ByZXZlbnREZWZhdWx0KGUpO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGxhc3RTdG9wcGVkS2V5ID0gbnVsbDtcclxuICAgICAgICBmdW5jdGlvbiBvbktleURvd24oZSkge1xyXG4gICAgICAgICAgICBpZiAoIWZvY3VzZWQpIG9uRm9jdXMoKTtcclxuICAgICAgICAgICAgdmFyIGNvZGUgPSBlLmtleUNvZGU7XHJcbiAgICAgICAgICAgIC8vIElFIGRvZXMgc3RyYW5nZSB0aGluZ3Mgd2l0aCBlc2NhcGUuXHJcbiAgICAgICAgICAgIGlmIChpZSAmJiBjb2RlID09IDI3KSB7IGUucmV0dXJuVmFsdWUgPSBmYWxzZTsgfVxyXG4gICAgICAgICAgICBzZXRTaGlmdChjb2RlID09IDE2IHx8IGUuc2hpZnRLZXkpO1xyXG4gICAgICAgICAgICAvLyBGaXJzdCBnaXZlIG9uS2V5RXZlbnQgb3B0aW9uIGEgY2hhbmNlIHRvIGhhbmRsZSB0aGlzLlxyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5vbktleUV2ZW50ICYmIG9wdGlvbnMub25LZXlFdmVudChpbnN0YW5jZSwgYWRkU3RvcChlKSkpIHJldHVybjtcclxuICAgICAgICAgICAgdmFyIGhhbmRsZWQgPSBoYW5kbGVLZXlCaW5kaW5nKGUpO1xyXG4gICAgICAgICAgICBpZiAod2luZG93Lm9wZXJhKSB7XHJcbiAgICAgICAgICAgICAgICBsYXN0U3RvcHBlZEtleSA9IGhhbmRsZWQgPyBlLmtleUNvZGUgOiBudWxsO1xyXG4gICAgICAgICAgICAgICAgLy8gT3BlcmEgaGFzIG5vIGN1dCBldmVudC4uLiB3ZSB0cnkgdG8gYXQgbGVhc3QgY2F0Y2ggdGhlIGtleSBjb21ib1xyXG4gICAgICAgICAgICAgICAgaWYgKCFoYW5kbGVkICYmIChtYWMgPyBlLm1ldGFLZXkgOiBlLmN0cmxLZXkpICYmIGUua2V5Q29kZSA9PSA4OClcclxuICAgICAgICAgICAgICAgICAgICByZXBsYWNlU2VsZWN0aW9uKFwiXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIG9uS2V5UHJlc3MoZSkge1xyXG4gICAgICAgICAgICBpZiAod2luZG93Lm9wZXJhICYmIGUua2V5Q29kZSA9PSBsYXN0U3RvcHBlZEtleSkge2xhc3RTdG9wcGVkS2V5ID0gbnVsbDsgZV9wcmV2ZW50RGVmYXVsdChlKTsgcmV0dXJuO31cclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMub25LZXlFdmVudCAmJiBvcHRpb25zLm9uS2V5RXZlbnQoaW5zdGFuY2UsIGFkZFN0b3AoZSkpKSByZXR1cm47XHJcbiAgICAgICAgICAgIGlmICh3aW5kb3cub3BlcmEgJiYgIWUud2hpY2ggJiYgaGFuZGxlS2V5QmluZGluZyhlKSkgcmV0dXJuO1xyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5lbGVjdHJpY0NoYXJzICYmIG1vZGUuZWxlY3RyaWNDaGFycykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNoID0gU3RyaW5nLmZyb21DaGFyQ29kZShlLmNoYXJDb2RlID09IG51bGwgPyBlLmtleUNvZGUgOiBlLmNoYXJDb2RlKTtcclxuICAgICAgICAgICAgICAgIGlmIChtb2RlLmVsZWN0cmljQ2hhcnMuaW5kZXhPZihjaCkgPiAtMSlcclxuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KG9wZXJhdGlvbihmdW5jdGlvbigpIHtpbmRlbnRMaW5lKHNlbC50by5saW5lLCBcInNtYXJ0XCIpO30pLCA3NSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZmFzdFBvbGwoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gb25LZXlVcChlKSB7XHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLm9uS2V5RXZlbnQgJiYgb3B0aW9ucy5vbktleUV2ZW50KGluc3RhbmNlLCBhZGRTdG9wKGUpKSkgcmV0dXJuO1xyXG4gICAgICAgICAgICBpZiAoZS5rZXlDb2RlID09IDE2KSBzaGlmdFNlbGVjdGluZyA9IG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBvbkZvY3VzKCkge1xyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5yZWFkT25seSkgcmV0dXJuO1xyXG4gICAgICAgICAgICBpZiAoIWZvY3VzZWQpIHtcclxuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLm9uRm9jdXMpIG9wdGlvbnMub25Gb2N1cyhpbnN0YW5jZSk7XHJcbiAgICAgICAgICAgICAgICBmb2N1c2VkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIGlmICh3cmFwcGVyLmNsYXNzTmFtZS5zZWFyY2goL1xcYkNvZGVNaXJyb3ItZm9jdXNlZFxcYi8pID09IC0xKVxyXG4gICAgICAgICAgICAgICAgICAgIHdyYXBwZXIuY2xhc3NOYW1lICs9IFwiIENvZGVNaXJyb3ItZm9jdXNlZFwiO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFsZWF2ZUlucHV0QWxvbmUpIHJlc2V0SW5wdXQodHJ1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc2xvd1BvbGwoKTtcclxuICAgICAgICAgICAgcmVzdGFydEJsaW5rKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIG9uQmx1cigpIHtcclxuICAgICAgICAgICAgaWYgKGZvY3VzZWQpIHtcclxuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLm9uQmx1cikgb3B0aW9ucy5vbkJsdXIoaW5zdGFuY2UpO1xyXG4gICAgICAgICAgICAgICAgZm9jdXNlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgd3JhcHBlci5jbGFzc05hbWUgPSB3cmFwcGVyLmNsYXNzTmFtZS5yZXBsYWNlKFwiIENvZGVNaXJyb3ItZm9jdXNlZFwiLCBcIlwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjbGVhckludGVydmFsKGJsaW5rZXIpO1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge2lmICghZm9jdXNlZCkgc2hpZnRTZWxlY3RpbmcgPSBudWxsO30sIDE1MCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBSZXBsYWNlIHRoZSByYW5nZSBmcm9tIGZyb20gdG8gdG8gYnkgdGhlIHN0cmluZ3MgaW4gbmV3VGV4dC5cclxuICAgICAgICAvLyBBZnRlcndhcmRzLCBzZXQgdGhlIHNlbGVjdGlvbiB0byBzZWxGcm9tLCBzZWxUby5cclxuICAgICAgICBmdW5jdGlvbiB1cGRhdGVMaW5lcyhmcm9tLCB0bywgbmV3VGV4dCwgc2VsRnJvbSwgc2VsVG8pIHtcclxuICAgICAgICAgICAgaWYgKGhpc3RvcnkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBvbGQgPSBbXTtcclxuICAgICAgICAgICAgICAgIGRvYy5pdGVyKGZyb20ubGluZSwgdG8ubGluZSArIDEsIGZ1bmN0aW9uKGxpbmUpIHsgb2xkLnB1c2gobGluZS50ZXh0KTsgfSk7XHJcbiAgICAgICAgICAgICAgICBoaXN0b3J5LmFkZENoYW5nZShmcm9tLmxpbmUsIG5ld1RleHQubGVuZ3RoLCBvbGQpO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGhpc3RvcnkuZG9uZS5sZW5ndGggPiBvcHRpb25zLnVuZG9EZXB0aCkgaGlzdG9yeS5kb25lLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdXBkYXRlTGluZXNOb1VuZG8oZnJvbSwgdG8sIG5ld1RleHQsIHNlbEZyb20sIHNlbFRvKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gdW5yZWRvSGVscGVyKGZyb20sIHRvKSB7XHJcbiAgICAgICAgICAgIHZhciBjaGFuZ2UgPSBmcm9tLnBvcCgpO1xyXG4gICAgICAgICAgICBpZiAoY2hhbmdlKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmVwbGFjZWQgPSBbXSwgZW5kID0gY2hhbmdlLnN0YXJ0ICsgY2hhbmdlLmFkZGVkO1xyXG4gICAgICAgICAgICAgICAgZG9jLml0ZXIoY2hhbmdlLnN0YXJ0LCBlbmQsIGZ1bmN0aW9uKGxpbmUpIHsgcmVwbGFjZWQucHVzaChsaW5lLnRleHQpOyB9KTtcclxuICAgICAgICAgICAgICAgIHRvLnB1c2goe3N0YXJ0OiBjaGFuZ2Uuc3RhcnQsIGFkZGVkOiBjaGFuZ2Uub2xkLmxlbmd0aCwgb2xkOiByZXBsYWNlZH0pO1xyXG4gICAgICAgICAgICAgICAgdmFyIHBvcyA9IGNsaXBQb3Moe2xpbmU6IGNoYW5nZS5zdGFydCArIGNoYW5nZS5vbGQubGVuZ3RoIC0gMSxcclxuICAgICAgICAgICAgICAgICAgICBjaDogZWRpdEVuZChyZXBsYWNlZFtyZXBsYWNlZC5sZW5ndGgtMV0sIGNoYW5nZS5vbGRbY2hhbmdlLm9sZC5sZW5ndGgtMV0pfSk7XHJcbiAgICAgICAgICAgICAgICB1cGRhdGVMaW5lc05vVW5kbyh7bGluZTogY2hhbmdlLnN0YXJ0LCBjaDogMH0sIHtsaW5lOiBlbmQgLSAxLCBjaDogZ2V0TGluZShlbmQtMSkudGV4dC5sZW5ndGh9LCBjaGFuZ2Uub2xkLCBwb3MsIHBvcyk7XHJcbiAgICAgICAgICAgICAgICB1cGRhdGVJbnB1dCA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gdW5kbygpIHt1bnJlZG9IZWxwZXIoaGlzdG9yeS5kb25lLCBoaXN0b3J5LnVuZG9uZSk7fVxyXG4gICAgICAgIGZ1bmN0aW9uIHJlZG8oKSB7dW5yZWRvSGVscGVyKGhpc3RvcnkudW5kb25lLCBoaXN0b3J5LmRvbmUpO31cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gdXBkYXRlTGluZXNOb1VuZG8oZnJvbSwgdG8sIG5ld1RleHQsIHNlbEZyb20sIHNlbFRvKSB7XHJcbiAgICAgICAgICAgIHZhciByZWNvbXB1dGVNYXhMZW5ndGggPSBmYWxzZSwgbWF4TGluZUxlbmd0aCA9IG1heExpbmUubGVuZ3RoO1xyXG4gICAgICAgICAgICBpZiAoIW9wdGlvbnMubGluZVdyYXBwaW5nKVxyXG4gICAgICAgICAgICAgICAgZG9jLml0ZXIoZnJvbS5saW5lLCB0by5saW5lLCBmdW5jdGlvbihsaW5lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxpbmUudGV4dC5sZW5ndGggPT0gbWF4TGluZUxlbmd0aCkge3JlY29tcHV0ZU1heExlbmd0aCA9IHRydWU7IHJldHVybiB0cnVlO31cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBpZiAoZnJvbS5saW5lICE9IHRvLmxpbmUgfHwgbmV3VGV4dC5sZW5ndGggPiAxKSBndXR0ZXJEaXJ0eSA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICB2YXIgbmxpbmVzID0gdG8ubGluZSAtIGZyb20ubGluZSwgZmlyc3RMaW5lID0gZ2V0TGluZShmcm9tLmxpbmUpLCBsYXN0TGluZSA9IGdldExpbmUodG8ubGluZSk7XHJcbiAgICAgICAgICAgIC8vIEZpcnN0IGFkanVzdCB0aGUgbGluZSBzdHJ1Y3R1cmUsIHRha2luZyBzb21lIGNhcmUgdG8gbGVhdmUgaGlnaGxpZ2h0aW5nIGludGFjdC5cclxuICAgICAgICAgICAgaWYgKGZyb20uY2ggPT0gMCAmJiB0by5jaCA9PSAwICYmIG5ld1RleHRbbmV3VGV4dC5sZW5ndGggLSAxXSA9PSBcIlwiKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIGEgd2hvbGUtbGluZSByZXBsYWNlLiBUcmVhdGVkIHNwZWNpYWxseSB0byBtYWtlXHJcbiAgICAgICAgICAgICAgICAvLyBzdXJlIGxpbmUgb2JqZWN0cyBtb3ZlIHRoZSB3YXkgdGhleSBhcmUgc3VwcG9zZWQgdG8uXHJcbiAgICAgICAgICAgICAgICB2YXIgYWRkZWQgPSBbXSwgcHJldkxpbmUgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZyb20ubGluZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHByZXZMaW5lID0gZ2V0TGluZShmcm9tLmxpbmUgLSAxKTtcclxuICAgICAgICAgICAgICAgICAgICBwcmV2TGluZS5maXhNYXJrRW5kcyhsYXN0TGluZSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgbGFzdExpbmUuZml4TWFya1N0YXJ0cygpO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGUgPSBuZXdUZXh0Lmxlbmd0aCAtIDE7IGkgPCBlOyArK2kpXHJcbiAgICAgICAgICAgICAgICAgICAgYWRkZWQucHVzaChMaW5lLmluaGVyaXRNYXJrcyhuZXdUZXh0W2ldLCBwcmV2TGluZSkpO1xyXG4gICAgICAgICAgICAgICAgaWYgKG5saW5lcykgZG9jLnJlbW92ZShmcm9tLmxpbmUsIG5saW5lcywgY2FsbGJhY2tzKTtcclxuICAgICAgICAgICAgICAgIGlmIChhZGRlZC5sZW5ndGgpIGRvYy5pbnNlcnQoZnJvbS5saW5lLCBhZGRlZCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmlyc3RMaW5lID09IGxhc3RMaW5lKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAobmV3VGV4dC5sZW5ndGggPT0gMSlcclxuICAgICAgICAgICAgICAgICAgICBmaXJzdExpbmUucmVwbGFjZShmcm9tLmNoLCB0by5jaCwgbmV3VGV4dFswXSk7XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBsYXN0TGluZSA9IGZpcnN0TGluZS5zcGxpdCh0by5jaCwgbmV3VGV4dFtuZXdUZXh0Lmxlbmd0aC0xXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZmlyc3RMaW5lLnJlcGxhY2UoZnJvbS5jaCwgbnVsbCwgbmV3VGV4dFswXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZmlyc3RMaW5lLmZpeE1hcmtFbmRzKGxhc3RMaW5lKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYWRkZWQgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMSwgZSA9IG5ld1RleHQubGVuZ3RoIC0gMTsgaSA8IGU7ICsraSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWRkZWQucHVzaChMaW5lLmluaGVyaXRNYXJrcyhuZXdUZXh0W2ldLCBmaXJzdExpbmUpKTtcclxuICAgICAgICAgICAgICAgICAgICBhZGRlZC5wdXNoKGxhc3RMaW5lKTtcclxuICAgICAgICAgICAgICAgICAgICBkb2MuaW5zZXJ0KGZyb20ubGluZSArIDEsIGFkZGVkKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIGlmIChuZXdUZXh0Lmxlbmd0aCA9PSAxKSB7XHJcbiAgICAgICAgICAgICAgICBmaXJzdExpbmUucmVwbGFjZShmcm9tLmNoLCBudWxsLCBuZXdUZXh0WzBdKTtcclxuICAgICAgICAgICAgICAgIGxhc3RMaW5lLnJlcGxhY2UobnVsbCwgdG8uY2gsIFwiXCIpO1xyXG4gICAgICAgICAgICAgICAgZmlyc3RMaW5lLmFwcGVuZChsYXN0TGluZSk7XHJcbiAgICAgICAgICAgICAgICBkb2MucmVtb3ZlKGZyb20ubGluZSArIDEsIG5saW5lcywgY2FsbGJhY2tzKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHZhciBhZGRlZCA9IFtdO1xyXG4gICAgICAgICAgICAgICAgZmlyc3RMaW5lLnJlcGxhY2UoZnJvbS5jaCwgbnVsbCwgbmV3VGV4dFswXSk7XHJcbiAgICAgICAgICAgICAgICBsYXN0TGluZS5yZXBsYWNlKG51bGwsIHRvLmNoLCBuZXdUZXh0W25ld1RleHQubGVuZ3RoLTFdKTtcclxuICAgICAgICAgICAgICAgIGZpcnN0TGluZS5maXhNYXJrRW5kcyhsYXN0TGluZSk7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMSwgZSA9IG5ld1RleHQubGVuZ3RoIC0gMTsgaSA8IGU7ICsraSlcclxuICAgICAgICAgICAgICAgICAgICBhZGRlZC5wdXNoKExpbmUuaW5oZXJpdE1hcmtzKG5ld1RleHRbaV0sIGZpcnN0TGluZSkpO1xyXG4gICAgICAgICAgICAgICAgaWYgKG5saW5lcyA+IDEpIGRvYy5yZW1vdmUoZnJvbS5saW5lICsgMSwgbmxpbmVzIC0gMSwgY2FsbGJhY2tzKTtcclxuICAgICAgICAgICAgICAgIGRvYy5pbnNlcnQoZnJvbS5saW5lICsgMSwgYWRkZWQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmxpbmVXcmFwcGluZykge1xyXG4gICAgICAgICAgICAgICAgdmFyIHBlckxpbmUgPSBzY3JvbGxlci5jbGllbnRXaWR0aCAvIGNoYXJXaWR0aCgpIC0gMztcclxuICAgICAgICAgICAgICAgIGRvYy5pdGVyKGZyb20ubGluZSwgZnJvbS5saW5lICsgbmV3VGV4dC5sZW5ndGgsIGZ1bmN0aW9uKGxpbmUpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobGluZS5oaWRkZW4pIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZ3Vlc3MgPSBNYXRoLmNlaWwobGluZS50ZXh0Lmxlbmd0aCAvIHBlckxpbmUpIHx8IDE7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGd1ZXNzICE9IGxpbmUuaGVpZ2h0KSB1cGRhdGVMaW5lSGVpZ2h0KGxpbmUsIGd1ZXNzKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZG9jLml0ZXIoZnJvbS5saW5lLCBpICsgbmV3VGV4dC5sZW5ndGgsIGZ1bmN0aW9uKGxpbmUpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbCA9IGxpbmUudGV4dDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobC5sZW5ndGggPiBtYXhMaW5lTGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heExpbmUgPSBsOyBtYXhMaW5lTGVuZ3RoID0gbC5sZW5ndGg7IG1heFdpZHRoID0gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVjb21wdXRlTWF4TGVuZ3RoID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVjb21wdXRlTWF4TGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWF4TGluZUxlbmd0aCA9IDA7IG1heExpbmUgPSBcIlwiOyBtYXhXaWR0aCA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgZG9jLml0ZXIoMCwgZG9jLnNpemUsIGZ1bmN0aW9uKGxpbmUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGwgPSBsaW5lLnRleHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsLmxlbmd0aCA+IG1heExpbmVMZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heExpbmVMZW5ndGggPSBsLmxlbmd0aDsgbWF4TGluZSA9IGw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gQWRkIHRoZXNlIGxpbmVzIHRvIHRoZSB3b3JrIGFycmF5LCBzbyB0aGF0IHRoZXkgd2lsbCBiZVxyXG4gICAgICAgICAgICAvLyBoaWdobGlnaHRlZC4gQWRqdXN0IHdvcmsgbGluZXMgaWYgbGluZXMgd2VyZSBhZGRlZC9yZW1vdmVkLlxyXG4gICAgICAgICAgICB2YXIgbmV3V29yayA9IFtdLCBsZW5kaWZmID0gbmV3VGV4dC5sZW5ndGggLSBubGluZXMgLSAxO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IHdvcmsubGVuZ3RoOyBpIDwgbDsgKytpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGFzayA9IHdvcmtbaV07XHJcbiAgICAgICAgICAgICAgICBpZiAodGFzayA8IGZyb20ubGluZSkgbmV3V29yay5wdXNoKHRhc2spO1xyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodGFzayA+IHRvLmxpbmUpIG5ld1dvcmsucHVzaCh0YXNrICsgbGVuZGlmZik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIGhsRW5kID0gZnJvbS5saW5lICsgTWF0aC5taW4obmV3VGV4dC5sZW5ndGgsIDUwMCk7XHJcbiAgICAgICAgICAgIGhpZ2hsaWdodExpbmVzKGZyb20ubGluZSwgaGxFbmQpO1xyXG4gICAgICAgICAgICBuZXdXb3JrLnB1c2goaGxFbmQpO1xyXG4gICAgICAgICAgICB3b3JrID0gbmV3V29yaztcclxuICAgICAgICAgICAgc3RhcnRXb3JrZXIoMTAwKTtcclxuICAgICAgICAgICAgLy8gUmVtZW1iZXIgdGhhdCB0aGVzZSBsaW5lcyBjaGFuZ2VkLCBmb3IgdXBkYXRpbmcgdGhlIGRpc3BsYXlcclxuICAgICAgICAgICAgY2hhbmdlcy5wdXNoKHtmcm9tOiBmcm9tLmxpbmUsIHRvOiB0by5saW5lICsgMSwgZGlmZjogbGVuZGlmZn0pO1xyXG4gICAgICAgICAgICB2YXIgY2hhbmdlT2JqID0ge2Zyb206IGZyb20sIHRvOiB0bywgdGV4dDogbmV3VGV4dH07XHJcbiAgICAgICAgICAgIGlmICh0ZXh0Q2hhbmdlZCkge1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgY3VyID0gdGV4dENoYW5nZWQ7IGN1ci5uZXh0OyBjdXIgPSBjdXIubmV4dCkge31cclxuICAgICAgICAgICAgICAgIGN1ci5uZXh0ID0gY2hhbmdlT2JqO1xyXG4gICAgICAgICAgICB9IGVsc2UgdGV4dENoYW5nZWQgPSBjaGFuZ2VPYmo7XHJcblxyXG4gICAgICAgICAgICAvLyBVcGRhdGUgdGhlIHNlbGVjdGlvblxyXG4gICAgICAgICAgICBmdW5jdGlvbiB1cGRhdGVMaW5lKG4pIHtyZXR1cm4gbiA8PSBNYXRoLm1pbih0by5saW5lLCB0by5saW5lICsgbGVuZGlmZikgPyBuIDogbiArIGxlbmRpZmY7fVxyXG4gICAgICAgICAgICBzZXRTZWxlY3Rpb24oc2VsRnJvbSwgc2VsVG8sIHVwZGF0ZUxpbmUoc2VsLmZyb20ubGluZSksIHVwZGF0ZUxpbmUoc2VsLnRvLmxpbmUpKTtcclxuXHJcbiAgICAgICAgICAgIC8vIE1ha2Ugc3VyZSB0aGUgc2Nyb2xsLXNpemUgZGl2IGhhcyB0aGUgY29ycmVjdCBoZWlnaHQuXHJcbiAgICAgICAgICAgIGNvZGUuc3R5bGUuaGVpZ2h0ID0gKGRvYy5oZWlnaHQgKiB0ZXh0SGVpZ2h0KCkgKyAyICogcGFkZGluZ1RvcCgpKSArIFwicHhcIjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHJlcGxhY2VSYW5nZShjb2RlLCBmcm9tLCB0bykge1xyXG4gICAgICAgICAgICBmcm9tID0gY2xpcFBvcyhmcm9tKTtcclxuICAgICAgICAgICAgaWYgKCF0bykgdG8gPSBmcm9tOyBlbHNlIHRvID0gY2xpcFBvcyh0byk7XHJcbiAgICAgICAgICAgIGNvZGUgPSBzcGxpdExpbmVzKGNvZGUpO1xyXG4gICAgICAgICAgICBmdW5jdGlvbiBhZGp1c3RQb3MocG9zKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAocG9zTGVzcyhwb3MsIGZyb20pKSByZXR1cm4gcG9zO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFwb3NMZXNzKHRvLCBwb3MpKSByZXR1cm4gZW5kO1xyXG4gICAgICAgICAgICAgICAgdmFyIGxpbmUgPSBwb3MubGluZSArIGNvZGUubGVuZ3RoIC0gKHRvLmxpbmUgLSBmcm9tLmxpbmUpIC0gMTtcclxuICAgICAgICAgICAgICAgIHZhciBjaCA9IHBvcy5jaDtcclxuICAgICAgICAgICAgICAgIGlmIChwb3MubGluZSA9PSB0by5saW5lKVxyXG4gICAgICAgICAgICAgICAgICAgIGNoICs9IGNvZGVbY29kZS5sZW5ndGgtMV0ubGVuZ3RoIC0gKHRvLmNoIC0gKHRvLmxpbmUgPT0gZnJvbS5saW5lID8gZnJvbS5jaCA6IDApKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB7bGluZTogbGluZSwgY2g6IGNofTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgZW5kO1xyXG4gICAgICAgICAgICByZXBsYWNlUmFuZ2UxKGNvZGUsIGZyb20sIHRvLCBmdW5jdGlvbihlbmQxKSB7XHJcbiAgICAgICAgICAgICAgICBlbmQgPSBlbmQxO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtmcm9tOiBhZGp1c3RQb3Moc2VsLmZyb20pLCB0bzogYWRqdXN0UG9zKHNlbC50byl9O1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIGVuZDtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gcmVwbGFjZVNlbGVjdGlvbihjb2RlLCBjb2xsYXBzZSkge1xyXG4gICAgICAgICAgICByZXBsYWNlUmFuZ2UxKHNwbGl0TGluZXMoY29kZSksIHNlbC5mcm9tLCBzZWwudG8sIGZ1bmN0aW9uKGVuZCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGNvbGxhcHNlID09IFwiZW5kXCIpIHJldHVybiB7ZnJvbTogZW5kLCB0bzogZW5kfTtcclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGNvbGxhcHNlID09IFwic3RhcnRcIikgcmV0dXJuIHtmcm9tOiBzZWwuZnJvbSwgdG86IHNlbC5mcm9tfTtcclxuICAgICAgICAgICAgICAgIGVsc2UgcmV0dXJuIHtmcm9tOiBzZWwuZnJvbSwgdG86IGVuZH07XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiByZXBsYWNlUmFuZ2UxKGNvZGUsIGZyb20sIHRvLCBjb21wdXRlU2VsKSB7XHJcbiAgICAgICAgICAgIHZhciBlbmRjaCA9IGNvZGUubGVuZ3RoID09IDEgPyBjb2RlWzBdLmxlbmd0aCArIGZyb20uY2ggOiBjb2RlW2NvZGUubGVuZ3RoLTFdLmxlbmd0aDtcclxuICAgICAgICAgICAgdmFyIG5ld1NlbCA9IGNvbXB1dGVTZWwoe2xpbmU6IGZyb20ubGluZSArIGNvZGUubGVuZ3RoIC0gMSwgY2g6IGVuZGNofSk7XHJcbiAgICAgICAgICAgIHVwZGF0ZUxpbmVzKGZyb20sIHRvLCBjb2RlLCBuZXdTZWwuZnJvbSwgbmV3U2VsLnRvKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGdldFJhbmdlKGZyb20sIHRvKSB7XHJcbiAgICAgICAgICAgIHZhciBsMSA9IGZyb20ubGluZSwgbDIgPSB0by5saW5lO1xyXG4gICAgICAgICAgICBpZiAobDEgPT0gbDIpIHJldHVybiBnZXRMaW5lKGwxKS50ZXh0LnNsaWNlKGZyb20uY2gsIHRvLmNoKTtcclxuICAgICAgICAgICAgdmFyIGNvZGUgPSBbZ2V0TGluZShsMSkudGV4dC5zbGljZShmcm9tLmNoKV07XHJcbiAgICAgICAgICAgIGRvYy5pdGVyKGwxICsgMSwgbDIsIGZ1bmN0aW9uKGxpbmUpIHsgY29kZS5wdXNoKGxpbmUudGV4dCk7IH0pO1xyXG4gICAgICAgICAgICBjb2RlLnB1c2goZ2V0TGluZShsMikudGV4dC5zbGljZSgwLCB0by5jaCkpO1xyXG4gICAgICAgICAgICByZXR1cm4gY29kZS5qb2luKFwiXFxuXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBnZXRTZWxlY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBnZXRSYW5nZShzZWwuZnJvbSwgc2VsLnRvKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBwb2xsaW5nRmFzdCA9IGZhbHNlOyAvLyBFbnN1cmVzIHNsb3dQb2xsIGRvZXNuJ3QgY2FuY2VsIGZhc3RQb2xsXHJcbiAgICAgICAgZnVuY3Rpb24gc2xvd1BvbGwoKSB7XHJcbiAgICAgICAgICAgIGlmIChwb2xsaW5nRmFzdCkgcmV0dXJuO1xyXG4gICAgICAgICAgICBwb2xsLnNldChvcHRpb25zLnBvbGxJbnRlcnZhbCwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICBzdGFydE9wZXJhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgcmVhZElucHV0KCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZm9jdXNlZCkgc2xvd1BvbGwoKTtcclxuICAgICAgICAgICAgICAgIGVuZE9wZXJhdGlvbigpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gZmFzdFBvbGwoKSB7XHJcbiAgICAgICAgICAgIHZhciBtaXNzZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgcG9sbGluZ0Zhc3QgPSB0cnVlO1xyXG4gICAgICAgICAgICBmdW5jdGlvbiBwKCkge1xyXG4gICAgICAgICAgICAgICAgc3RhcnRPcGVyYXRpb24oKTtcclxuICAgICAgICAgICAgICAgIHZhciBjaGFuZ2VkID0gcmVhZElucHV0KCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWNoYW5nZWQgJiYgIW1pc3NlZCkge21pc3NlZCA9IHRydWU7IHBvbGwuc2V0KDYwLCBwKTt9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtwb2xsaW5nRmFzdCA9IGZhbHNlOyBzbG93UG9sbCgpO31cclxuICAgICAgICAgICAgICAgIGVuZE9wZXJhdGlvbigpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHBvbGwuc2V0KDIwLCBwKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFByZXZpbnB1dCBpcyBhIGhhY2sgdG8gd29yayB3aXRoIElNRS4gSWYgd2UgcmVzZXQgdGhlIHRleHRhcmVhXHJcbiAgICAgICAgLy8gb24gZXZlcnkgY2hhbmdlLCB0aGF0IGJyZWFrcyBJTUUuIFNvIHdlIGxvb2sgZm9yIGNoYW5nZXNcclxuICAgICAgICAvLyBjb21wYXJlZCB0byB0aGUgcHJldmlvdXMgY29udGVudCBpbnN0ZWFkLiAoTW9kZXJuIGJyb3dzZXJzIGhhdmVcclxuICAgICAgICAvLyBldmVudHMgdGhhdCBpbmRpY2F0ZSBJTUUgdGFraW5nIHBsYWNlLCBidXQgdGhlc2UgYXJlIG5vdCB3aWRlbHlcclxuICAgICAgICAvLyBzdXBwb3J0ZWQgb3IgY29tcGF0aWJsZSBlbm91Z2ggeWV0IHRvIHJlbHkgb24uKVxyXG4gICAgICAgIHZhciBwcmV2SW5wdXQgPSBcIlwiO1xyXG4gICAgICAgIGZ1bmN0aW9uIHJlYWRJbnB1dCgpIHtcclxuICAgICAgICAgICAgaWYgKGxlYXZlSW5wdXRBbG9uZSB8fCAhZm9jdXNlZCB8fCBoYXNTZWxlY3Rpb24oaW5wdXQpKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIHZhciB0ZXh0ID0gaW5wdXQudmFsdWU7XHJcbiAgICAgICAgICAgIGlmICh0ZXh0ID09IHByZXZJbnB1dCkgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICBzaGlmdFNlbGVjdGluZyA9IG51bGw7XHJcbiAgICAgICAgICAgIHZhciBzYW1lID0gMCwgbCA9IE1hdGgubWluKHByZXZJbnB1dC5sZW5ndGgsIHRleHQubGVuZ3RoKTtcclxuICAgICAgICAgICAgd2hpbGUgKHNhbWUgPCBsICYmIHByZXZJbnB1dFtzYW1lXSA9PSB0ZXh0W3NhbWVdKSArK3NhbWU7XHJcbiAgICAgICAgICAgIGlmIChzYW1lIDwgcHJldklucHV0Lmxlbmd0aClcclxuICAgICAgICAgICAgICAgIHNlbC5mcm9tID0ge2xpbmU6IHNlbC5mcm9tLmxpbmUsIGNoOiBzZWwuZnJvbS5jaCAtIChwcmV2SW5wdXQubGVuZ3RoIC0gc2FtZSl9O1xyXG4gICAgICAgICAgICBlbHNlIGlmIChvdmVyd3JpdGUgJiYgcG9zRXEoc2VsLmZyb20sIHNlbC50bykpXHJcbiAgICAgICAgICAgICAgICBzZWwudG8gPSB7bGluZTogc2VsLnRvLmxpbmUsIGNoOiBNYXRoLm1pbihnZXRMaW5lKHNlbC50by5saW5lKS50ZXh0Lmxlbmd0aCwgc2VsLnRvLmNoICsgKHRleHQubGVuZ3RoIC0gc2FtZSkpfTtcclxuICAgICAgICAgICAgcmVwbGFjZVNlbGVjdGlvbih0ZXh0LnNsaWNlKHNhbWUpLCBcImVuZFwiKTtcclxuICAgICAgICAgICAgcHJldklucHV0ID0gdGV4dDtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIHJlc2V0SW5wdXQodXNlcikge1xyXG4gICAgICAgICAgICBpZiAoIXBvc0VxKHNlbC5mcm9tLCBzZWwudG8pKSB7XHJcbiAgICAgICAgICAgICAgICBwcmV2SW5wdXQgPSBcIlwiO1xyXG4gICAgICAgICAgICAgICAgaW5wdXQudmFsdWUgPSBnZXRTZWxlY3Rpb24oKTtcclxuICAgICAgICAgICAgICAgIGlucHV0LnNlbGVjdCgpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHVzZXIpIHByZXZJbnB1dCA9IGlucHV0LnZhbHVlID0gXCJcIjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGZvY3VzSW5wdXQoKSB7XHJcbiAgICAgICAgICAgIGlmICghb3B0aW9ucy5yZWFkT25seSkgaW5wdXQuZm9jdXMoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHNjcm9sbEVkaXRvckludG9WaWV3KCkge1xyXG4gICAgICAgICAgICBpZiAoIWN1cnNvci5nZXRCb3VuZGluZ0NsaWVudFJlY3QpIHJldHVybjtcclxuICAgICAgICAgICAgdmFyIHJlY3QgPSBjdXJzb3IuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcbiAgICAgICAgICAgIC8vIElFIHJldHVybnMgYm9ndXMgY29vcmRpbmF0ZXMgd2hlbiB0aGUgaW5zdGFuY2Ugc2l0cyBpbnNpZGUgb2YgYW4gaWZyYW1lIGFuZCB0aGUgY3Vyc29yIGlzIGhpZGRlblxyXG4gICAgICAgICAgICBpZiAoaWUgJiYgcmVjdC50b3AgPT0gcmVjdC5ib3R0b20pIHJldHVybjtcclxuICAgICAgICAgICAgdmFyIHdpbkggPSB3aW5kb3cuaW5uZXJIZWlnaHQgfHwgTWF0aC5tYXgoZG9jdW1lbnQuYm9keS5vZmZzZXRIZWlnaHQsIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5vZmZzZXRIZWlnaHQpO1xyXG4gICAgICAgICAgICBpZiAocmVjdC50b3AgPCAwIHx8IHJlY3QuYm90dG9tID4gd2luSCkgY3Vyc29yLnNjcm9sbEludG9WaWV3KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIHNjcm9sbEN1cnNvckludG9WaWV3KCkge1xyXG4gICAgICAgICAgICB2YXIgY3Vyc29yID0gbG9jYWxDb29yZHMoc2VsLmludmVydGVkID8gc2VsLmZyb20gOiBzZWwudG8pO1xyXG4gICAgICAgICAgICB2YXIgeCA9IG9wdGlvbnMubGluZVdyYXBwaW5nID8gTWF0aC5taW4oY3Vyc29yLngsIGxpbmVTcGFjZS5vZmZzZXRXaWR0aCkgOiBjdXJzb3IueDtcclxuICAgICAgICAgICAgcmV0dXJuIHNjcm9sbEludG9WaWV3KHgsIGN1cnNvci55LCB4LCBjdXJzb3IueUJvdCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIHNjcm9sbEludG9WaWV3KHgxLCB5MSwgeDIsIHkyKSB7XHJcbiAgICAgICAgICAgIHZhciBwbCA9IHBhZGRpbmdMZWZ0KCksIHB0ID0gcGFkZGluZ1RvcCgpLCBsaCA9IHRleHRIZWlnaHQoKTtcclxuICAgICAgICAgICAgeTEgKz0gcHQ7IHkyICs9IHB0OyB4MSArPSBwbDsgeDIgKz0gcGw7XHJcbiAgICAgICAgICAgIHZhciBzY3JlZW4gPSBzY3JvbGxlci5jbGllbnRIZWlnaHQsIHNjcmVlbnRvcCA9IHNjcm9sbGVyLnNjcm9sbFRvcCwgc2Nyb2xsZWQgPSBmYWxzZSwgcmVzdWx0ID0gdHJ1ZTtcclxuICAgICAgICAgICAgaWYgKHkxIDwgc2NyZWVudG9wKSB7c2Nyb2xsZXIuc2Nyb2xsVG9wID0gTWF0aC5tYXgoMCwgeTEgLSAyKmxoKTsgc2Nyb2xsZWQgPSB0cnVlO31cclxuICAgICAgICAgICAgZWxzZSBpZiAoeTIgPiBzY3JlZW50b3AgKyBzY3JlZW4pIHtzY3JvbGxlci5zY3JvbGxUb3AgPSB5MiArIGxoIC0gc2NyZWVuOyBzY3JvbGxlZCA9IHRydWU7fVxyXG5cclxuICAgICAgICAgICAgdmFyIHNjcmVlbncgPSBzY3JvbGxlci5jbGllbnRXaWR0aCwgc2NyZWVubGVmdCA9IHNjcm9sbGVyLnNjcm9sbExlZnQ7XHJcbiAgICAgICAgICAgIHZhciBndXR0ZXJ3ID0gb3B0aW9ucy5maXhlZEd1dHRlciA/IGd1dHRlci5jbGllbnRXaWR0aCA6IDA7XHJcbiAgICAgICAgICAgIGlmICh4MSA8IHNjcmVlbmxlZnQgKyBndXR0ZXJ3KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoeDEgPCA1MCkgeDEgPSAwO1xyXG4gICAgICAgICAgICAgICAgc2Nyb2xsZXIuc2Nyb2xsTGVmdCA9IE1hdGgubWF4KDAsIHgxIC0gMTAgLSBndXR0ZXJ3KTtcclxuICAgICAgICAgICAgICAgIHNjcm9sbGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmICh4MiA+IHNjcmVlbncgKyBzY3JlZW5sZWZ0IC0gMykge1xyXG4gICAgICAgICAgICAgICAgc2Nyb2xsZXIuc2Nyb2xsTGVmdCA9IHgyICsgMTAgLSBzY3JlZW53O1xyXG4gICAgICAgICAgICAgICAgc2Nyb2xsZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgaWYgKHgyID4gY29kZS5jbGllbnRXaWR0aCkgcmVzdWx0ID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHNjcm9sbGVkICYmIG9wdGlvbnMub25TY3JvbGwpIG9wdGlvbnMub25TY3JvbGwoaW5zdGFuY2UpO1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gdmlzaWJsZUxpbmVzKCkge1xyXG4gICAgICAgICAgICB2YXIgbGggPSB0ZXh0SGVpZ2h0KCksIHRvcCA9IHNjcm9sbGVyLnNjcm9sbFRvcCAtIHBhZGRpbmdUb3AoKTtcclxuICAgICAgICAgICAgdmFyIGZyb21faGVpZ2h0ID0gTWF0aC5tYXgoMCwgTWF0aC5mbG9vcih0b3AgLyBsaCkpO1xyXG4gICAgICAgICAgICB2YXIgdG9faGVpZ2h0ID0gTWF0aC5jZWlsKCh0b3AgKyBzY3JvbGxlci5jbGllbnRIZWlnaHQpIC8gbGgpO1xyXG4gICAgICAgICAgICByZXR1cm4ge2Zyb206IGxpbmVBdEhlaWdodChkb2MsIGZyb21faGVpZ2h0KSxcclxuICAgICAgICAgICAgICAgIHRvOiBsaW5lQXRIZWlnaHQoZG9jLCB0b19oZWlnaHQpfTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gVXNlcyBhIHNldCBvZiBjaGFuZ2VzIHBsdXMgdGhlIGN1cnJlbnQgc2Nyb2xsIHBvc2l0aW9uIHRvXHJcbiAgICAgICAgLy8gZGV0ZXJtaW5lIHdoaWNoIERPTSB1cGRhdGVzIGhhdmUgdG8gYmUgbWFkZSwgYW5kIG1ha2VzIHRoZVxyXG4gICAgICAgIC8vIHVwZGF0ZXMuXHJcbiAgICAgICAgZnVuY3Rpb24gdXBkYXRlRGlzcGxheShjaGFuZ2VzLCBzdXBwcmVzc0NhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIGlmICghc2Nyb2xsZXIuY2xpZW50V2lkdGgpIHtcclxuICAgICAgICAgICAgICAgIHNob3dpbmdGcm9tID0gc2hvd2luZ1RvID0gZGlzcGxheU9mZnNldCA9IDA7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gQ29tcHV0ZSB0aGUgbmV3IHZpc2libGUgd2luZG93XHJcbiAgICAgICAgICAgIHZhciB2aXNpYmxlID0gdmlzaWJsZUxpbmVzKCk7XHJcbiAgICAgICAgICAgIC8vIEJhaWwgb3V0IGlmIHRoZSB2aXNpYmxlIGFyZWEgaXMgYWxyZWFkeSByZW5kZXJlZCBhbmQgbm90aGluZyBjaGFuZ2VkLlxyXG4gICAgICAgICAgICBpZiAoY2hhbmdlcyAhPT0gdHJ1ZSAmJiBjaGFuZ2VzLmxlbmd0aCA9PSAwICYmIHZpc2libGUuZnJvbSA+PSBzaG93aW5nRnJvbSAmJiB2aXNpYmxlLnRvIDw9IHNob3dpbmdUbykgcmV0dXJuO1xyXG4gICAgICAgICAgICB2YXIgZnJvbSA9IE1hdGgubWF4KHZpc2libGUuZnJvbSAtIDEwMCwgMCksIHRvID0gTWF0aC5taW4oZG9jLnNpemUsIHZpc2libGUudG8gKyAxMDApO1xyXG4gICAgICAgICAgICBpZiAoc2hvd2luZ0Zyb20gPCBmcm9tICYmIGZyb20gLSBzaG93aW5nRnJvbSA8IDIwKSBmcm9tID0gc2hvd2luZ0Zyb207XHJcbiAgICAgICAgICAgIGlmIChzaG93aW5nVG8gPiB0byAmJiBzaG93aW5nVG8gLSB0byA8IDIwKSB0byA9IE1hdGgubWluKGRvYy5zaXplLCBzaG93aW5nVG8pO1xyXG5cclxuICAgICAgICAgICAgLy8gQ3JlYXRlIGEgcmFuZ2Ugb2YgdGhlb3JldGljYWxseSBpbnRhY3QgbGluZXMsIGFuZCBwdW5jaCBob2xlc1xyXG4gICAgICAgICAgICAvLyBpbiB0aGF0IHVzaW5nIHRoZSBjaGFuZ2UgaW5mby5cclxuICAgICAgICAgICAgdmFyIGludGFjdCA9IGNoYW5nZXMgPT09IHRydWUgPyBbXSA6XHJcbiAgICAgICAgICAgICAgICBjb21wdXRlSW50YWN0KFt7ZnJvbTogc2hvd2luZ0Zyb20sIHRvOiBzaG93aW5nVG8sIGRvbVN0YXJ0OiAwfV0sIGNoYW5nZXMpO1xyXG4gICAgICAgICAgICAvLyBDbGlwIG9mZiB0aGUgcGFydHMgdGhhdCB3b24ndCBiZSB2aXNpYmxlXHJcbiAgICAgICAgICAgIHZhciBpbnRhY3RMaW5lcyA9IDA7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaW50YWN0Lmxlbmd0aDsgKytpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmFuZ2UgPSBpbnRhY3RbaV07XHJcbiAgICAgICAgICAgICAgICBpZiAocmFuZ2UuZnJvbSA8IGZyb20pIHtyYW5nZS5kb21TdGFydCArPSAoZnJvbSAtIHJhbmdlLmZyb20pOyByYW5nZS5mcm9tID0gZnJvbTt9XHJcbiAgICAgICAgICAgICAgICBpZiAocmFuZ2UudG8gPiB0bykgcmFuZ2UudG8gPSB0bztcclxuICAgICAgICAgICAgICAgIGlmIChyYW5nZS5mcm9tID49IHJhbmdlLnRvKSBpbnRhY3Quc3BsaWNlKGktLSwgMSk7XHJcbiAgICAgICAgICAgICAgICBlbHNlIGludGFjdExpbmVzICs9IHJhbmdlLnRvIC0gcmFuZ2UuZnJvbTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoaW50YWN0TGluZXMgPT0gdG8gLSBmcm9tKSByZXR1cm47XHJcbiAgICAgICAgICAgIGludGFjdC5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtyZXR1cm4gYS5kb21TdGFydCAtIGIuZG9tU3RhcnQ7fSk7XHJcblxyXG4gICAgICAgICAgICB2YXIgdGggPSB0ZXh0SGVpZ2h0KCksIGd1dHRlckRpc3BsYXkgPSBndXR0ZXIuc3R5bGUuZGlzcGxheTtcclxuICAgICAgICAgICAgbGluZURpdi5zdHlsZS5kaXNwbGF5ID0gZ3V0dGVyLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcclxuICAgICAgICAgICAgcGF0Y2hEaXNwbGF5KGZyb20sIHRvLCBpbnRhY3QpO1xyXG4gICAgICAgICAgICBsaW5lRGl2LnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xyXG5cclxuICAgICAgICAgICAgLy8gUG9zaXRpb24gdGhlIG1vdmVyIGRpdiB0byBhbGlnbiB3aXRoIHRoZSBsaW5lcyBpdCdzIHN1cHBvc2VkXHJcbiAgICAgICAgICAgIC8vIHRvIGJlIHNob3dpbmcgKHdoaWNoIHdpbGwgY292ZXIgdGhlIHZpc2libGUgZGlzcGxheSlcclxuICAgICAgICAgICAgdmFyIGRpZmZlcmVudCA9IGZyb20gIT0gc2hvd2luZ0Zyb20gfHwgdG8gIT0gc2hvd2luZ1RvIHx8IGxhc3RTaXplQyAhPSBzY3JvbGxlci5jbGllbnRIZWlnaHQgKyB0aDtcclxuICAgICAgICAgICAgLy8gVGhpcyBpcyBqdXN0IGEgYm9ndXMgZm9ybXVsYSB0aGF0IGRldGVjdHMgd2hlbiB0aGUgZWRpdG9yIGlzXHJcbiAgICAgICAgICAgIC8vIHJlc2l6ZWQgb3IgdGhlIGZvbnQgc2l6ZSBjaGFuZ2VzLlxyXG4gICAgICAgICAgICBpZiAoZGlmZmVyZW50KSBsYXN0U2l6ZUMgPSBzY3JvbGxlci5jbGllbnRIZWlnaHQgKyB0aDtcclxuICAgICAgICAgICAgc2hvd2luZ0Zyb20gPSBmcm9tOyBzaG93aW5nVG8gPSB0bztcclxuICAgICAgICAgICAgZGlzcGxheU9mZnNldCA9IGhlaWdodEF0TGluZShkb2MsIGZyb20pO1xyXG4gICAgICAgICAgICBtb3Zlci5zdHlsZS50b3AgPSAoZGlzcGxheU9mZnNldCAqIHRoKSArIFwicHhcIjtcclxuICAgICAgICAgICAgY29kZS5zdHlsZS5oZWlnaHQgPSAoZG9jLmhlaWdodCAqIHRoICsgMiAqIHBhZGRpbmdUb3AoKSkgKyBcInB4XCI7XHJcblxyXG4gICAgICAgICAgICAvLyBTaW5jZSB0aGlzIGlzIGFsbCByYXRoZXIgZXJyb3IgcHJvbmUsIGl0IGlzIGhvbm91cmVkIHdpdGggdGhlXHJcbiAgICAgICAgICAgIC8vIG9ubHkgYXNzZXJ0aW9uIGluIHRoZSB3aG9sZSBmaWxlLlxyXG4gICAgICAgICAgICBpZiAobGluZURpdi5jaGlsZE5vZGVzLmxlbmd0aCAhPSBzaG93aW5nVG8gLSBzaG93aW5nRnJvbSlcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkJBRCBQQVRDSCEgXCIgKyBKU09OLnN0cmluZ2lmeShpbnRhY3QpICsgXCIgc2l6ZT1cIiArIChzaG93aW5nVG8gLSBzaG93aW5nRnJvbSkgK1xyXG4gICAgICAgICAgICAgICAgICAgIFwiIG5vZGVzPVwiICsgbGluZURpdi5jaGlsZE5vZGVzLmxlbmd0aCk7XHJcblxyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5saW5lV3JhcHBpbmcpIHtcclxuICAgICAgICAgICAgICAgIG1heFdpZHRoID0gc2Nyb2xsZXIuY2xpZW50V2lkdGg7XHJcbiAgICAgICAgICAgICAgICB2YXIgY3VyTm9kZSA9IGxpbmVEaXYuZmlyc3RDaGlsZDtcclxuICAgICAgICAgICAgICAgIGRvYy5pdGVyKHNob3dpbmdGcm9tLCBzaG93aW5nVG8sIGZ1bmN0aW9uKGxpbmUpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWxpbmUuaGlkZGVuKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBoZWlnaHQgPSBNYXRoLnJvdW5kKGN1ck5vZGUub2Zmc2V0SGVpZ2h0IC8gdGgpIHx8IDE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsaW5lLmhlaWdodCAhPSBoZWlnaHQpIHt1cGRhdGVMaW5lSGVpZ2h0KGxpbmUsIGhlaWdodCk7IGd1dHRlckRpcnR5ID0gdHJ1ZTt9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGN1ck5vZGUgPSBjdXJOb2RlLm5leHRTaWJsaW5nO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpZiAobWF4V2lkdGggPT0gbnVsbCkgbWF4V2lkdGggPSBzdHJpbmdXaWR0aChtYXhMaW5lKTtcclxuICAgICAgICAgICAgICAgIGlmIChtYXhXaWR0aCA+IHNjcm9sbGVyLmNsaWVudFdpZHRoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGluZVNwYWNlLnN0eWxlLndpZHRoID0gbWF4V2lkdGggKyBcInB4XCI7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gTmVlZGVkIHRvIHByZXZlbnQgb2RkIHdyYXBwaW5nL2hpZGluZyBvZiB3aWRnZXRzIHBsYWNlZCBpbiBoZXJlLlxyXG4gICAgICAgICAgICAgICAgICAgIGNvZGUuc3R5bGUud2lkdGggPSBcIlwiO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvZGUuc3R5bGUud2lkdGggPSBzY3JvbGxlci5zY3JvbGxXaWR0aCArIFwicHhcIjtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGluZVNwYWNlLnN0eWxlLndpZHRoID0gY29kZS5zdHlsZS53aWR0aCA9IFwiXCI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZ3V0dGVyLnN0eWxlLmRpc3BsYXkgPSBndXR0ZXJEaXNwbGF5O1xyXG4gICAgICAgICAgICBpZiAoZGlmZmVyZW50IHx8IGd1dHRlckRpcnR5KSB1cGRhdGVHdXR0ZXIoKTtcclxuICAgICAgICAgICAgdXBkYXRlQ3Vyc29yKCk7XHJcbiAgICAgICAgICAgIGlmICghc3VwcHJlc3NDYWxsYmFjayAmJiBvcHRpb25zLm9uVXBkYXRlKSBvcHRpb25zLm9uVXBkYXRlKGluc3RhbmNlKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBjb21wdXRlSW50YWN0KGludGFjdCwgY2hhbmdlcykge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGNoYW5nZXMubGVuZ3RoIHx8IDA7IGkgPCBsOyArK2kpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjaGFuZ2UgPSBjaGFuZ2VzW2ldLCBpbnRhY3QyID0gW10sIGRpZmYgPSBjaGFuZ2UuZGlmZiB8fCAwO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDAsIGwyID0gaW50YWN0Lmxlbmd0aDsgaiA8IGwyOyArK2opIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcmFuZ2UgPSBpbnRhY3Rbal07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoYW5nZS50byA8PSByYW5nZS5mcm9tICYmIGNoYW5nZS5kaWZmKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnRhY3QyLnB1c2goe2Zyb206IHJhbmdlLmZyb20gKyBkaWZmLCB0bzogcmFuZ2UudG8gKyBkaWZmLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9tU3RhcnQ6IHJhbmdlLmRvbVN0YXJ0fSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoY2hhbmdlLnRvIDw9IHJhbmdlLmZyb20gfHwgY2hhbmdlLmZyb20gPj0gcmFuZ2UudG8pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGludGFjdDIucHVzaChyYW5nZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjaGFuZ2UuZnJvbSA+IHJhbmdlLmZyb20pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnRhY3QyLnB1c2goe2Zyb206IHJhbmdlLmZyb20sIHRvOiBjaGFuZ2UuZnJvbSwgZG9tU3RhcnQ6IHJhbmdlLmRvbVN0YXJ0fSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjaGFuZ2UudG8gPCByYW5nZS50bylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludGFjdDIucHVzaCh7ZnJvbTogY2hhbmdlLnRvICsgZGlmZiwgdG86IHJhbmdlLnRvICsgZGlmZixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb21TdGFydDogcmFuZ2UuZG9tU3RhcnQgKyAoY2hhbmdlLnRvIC0gcmFuZ2UuZnJvbSl9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpbnRhY3QgPSBpbnRhY3QyO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBpbnRhY3Q7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBwYXRjaERpc3BsYXkoZnJvbSwgdG8sIGludGFjdCkge1xyXG4gICAgICAgICAgICAvLyBUaGUgZmlyc3QgcGFzcyByZW1vdmVzIHRoZSBET00gbm9kZXMgdGhhdCBhcmVuJ3QgaW50YWN0LlxyXG4gICAgICAgICAgICBpZiAoIWludGFjdC5sZW5ndGgpIGxpbmVEaXYuaW5uZXJIVE1MID0gXCJcIjtcclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBraWxsTm9kZShub2RlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRtcCA9IG5vZGUubmV4dFNpYmxpbmc7XHJcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKG5vZGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0bXA7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB2YXIgZG9tUG9zID0gMCwgY3VyTm9kZSA9IGxpbmVEaXYuZmlyc3RDaGlsZCwgbjtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaW50YWN0Lmxlbmd0aDsgKytpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN1ciA9IGludGFjdFtpXTtcclxuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoY3VyLmRvbVN0YXJ0ID4gZG9tUG9zKSB7Y3VyTm9kZSA9IGtpbGxOb2RlKGN1ck5vZGUpOyBkb21Qb3MrKzt9XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDAsIGUgPSBjdXIudG8gLSBjdXIuZnJvbTsgaiA8IGU7ICsraikge2N1ck5vZGUgPSBjdXJOb2RlLm5leHRTaWJsaW5nOyBkb21Qb3MrKzt9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoY3VyTm9kZSkgY3VyTm9kZSA9IGtpbGxOb2RlKGN1ck5vZGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIFRoaXMgcGFzcyBmaWxscyBpbiB0aGUgbGluZXMgdGhhdCBhY3R1YWxseSBjaGFuZ2VkLlxyXG4gICAgICAgICAgICB2YXIgbmV4dEludGFjdCA9IGludGFjdC5zaGlmdCgpLCBjdXJOb2RlID0gbGluZURpdi5maXJzdENoaWxkLCBqID0gZnJvbTtcclxuICAgICAgICAgICAgdmFyIHNmcm9tID0gc2VsLmZyb20ubGluZSwgc3RvID0gc2VsLnRvLmxpbmUsIGluU2VsID0gc2Zyb20gPCBmcm9tICYmIHN0byA+PSBmcm9tO1xyXG4gICAgICAgICAgICB2YXIgc2NyYXRjaCA9IHRhcmdldERvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiksIG5ld0VsdDtcclxuICAgICAgICAgICAgZG9jLml0ZXIoZnJvbSwgdG8sIGZ1bmN0aW9uKGxpbmUpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjaDEgPSBudWxsLCBjaDIgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgaWYgKGluU2VsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2gxID0gMDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc3RvID09IGopIHtpblNlbCA9IGZhbHNlOyBjaDIgPSBzZWwudG8uY2g7fVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzZnJvbSA9PSBqKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0byA9PSBqKSB7Y2gxID0gc2VsLmZyb20uY2g7IGNoMiA9IHNlbC50by5jaDt9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7aW5TZWwgPSB0cnVlOyBjaDEgPSBzZWwuZnJvbS5jaDt9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAobmV4dEludGFjdCAmJiBuZXh0SW50YWN0LnRvID09IGopIG5leHRJbnRhY3QgPSBpbnRhY3Quc2hpZnQoKTtcclxuICAgICAgICAgICAgICAgIGlmICghbmV4dEludGFjdCB8fCBuZXh0SW50YWN0LmZyb20gPiBqKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxpbmUuaGlkZGVuKSBzY3JhdGNoLmlubmVySFRNTCA9IFwiPHByZT48L3ByZT5cIjtcclxuICAgICAgICAgICAgICAgICAgICBlbHNlIHNjcmF0Y2guaW5uZXJIVE1MID0gbGluZS5nZXRIVE1MKGNoMSwgY2gyLCB0cnVlLCB0YWJUZXh0KTtcclxuICAgICAgICAgICAgICAgICAgICBsaW5lRGl2Lmluc2VydEJlZm9yZShzY3JhdGNoLmZpcnN0Q2hpbGQsIGN1ck5vZGUpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBjdXJOb2RlID0gY3VyTm9kZS5uZXh0U2libGluZztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICsrajtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiB1cGRhdGVHdXR0ZXIoKSB7XHJcbiAgICAgICAgICAgIGlmICghb3B0aW9ucy5ndXR0ZXIgJiYgIW9wdGlvbnMubGluZU51bWJlcnMpIHJldHVybjtcclxuICAgICAgICAgICAgdmFyIGhUZXh0ID0gbW92ZXIub2Zmc2V0SGVpZ2h0LCBoRWRpdG9yID0gc2Nyb2xsZXIuY2xpZW50SGVpZ2h0O1xyXG4gICAgICAgICAgICBndXR0ZXIuc3R5bGUuaGVpZ2h0ID0gKGhUZXh0IC0gaEVkaXRvciA8IDIgPyBoRWRpdG9yIDogaFRleHQpICsgXCJweFwiO1xyXG4gICAgICAgICAgICB2YXIgaHRtbCA9IFtdLCBpID0gc2hvd2luZ0Zyb207XHJcbiAgICAgICAgICAgIGRvYy5pdGVyKHNob3dpbmdGcm9tLCBNYXRoLm1heChzaG93aW5nVG8sIHNob3dpbmdGcm9tICsgMSksIGZ1bmN0aW9uKGxpbmUpIHtcclxuICAgICAgICAgICAgICAgIGlmIChsaW5lLmhpZGRlbikge1xyXG4gICAgICAgICAgICAgICAgICAgIGh0bWwucHVzaChcIjxwcmU+PC9wcmU+XCIpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbWFya2VyID0gbGluZS5ndXR0ZXJNYXJrZXI7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRleHQgPSBvcHRpb25zLmxpbmVOdW1iZXJzID8gaSArIG9wdGlvbnMuZmlyc3RMaW5lTnVtYmVyIDogbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobWFya2VyICYmIG1hcmtlci50ZXh0KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0ID0gbWFya2VyLnRleHQucmVwbGFjZShcIiVOJVwiLCB0ZXh0ICE9IG51bGwgPyB0ZXh0IDogXCJcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAodGV4dCA9PSBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0ID0gXCJcXHUwMGEwXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgaHRtbC5wdXNoKChtYXJrZXIgJiYgbWFya2VyLnN0eWxlID8gJzxwcmUgY2xhc3M9XCInICsgbWFya2VyLnN0eWxlICsgJ1wiPicgOiBcIjxwcmU+XCIpLCB0ZXh0KTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMTsgaiA8IGxpbmUuaGVpZ2h0OyArK2opIGh0bWwucHVzaChcIjxici8+JiMxNjA7XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGh0bWwucHVzaChcIjwvcHJlPlwiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICsraTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGd1dHRlci5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XHJcbiAgICAgICAgICAgIGd1dHRlclRleHQuaW5uZXJIVE1MID0gaHRtbC5qb2luKFwiXCIpO1xyXG4gICAgICAgICAgICB2YXIgbWlud2lkdGggPSBTdHJpbmcoZG9jLnNpemUpLmxlbmd0aCwgZmlyc3ROb2RlID0gZ3V0dGVyVGV4dC5maXJzdENoaWxkLCB2YWwgPSBlbHRUZXh0KGZpcnN0Tm9kZSksIHBhZCA9IFwiXCI7XHJcbiAgICAgICAgICAgIHdoaWxlICh2YWwubGVuZ3RoICsgcGFkLmxlbmd0aCA8IG1pbndpZHRoKSBwYWQgKz0gXCJcXHUwMGEwXCI7XHJcbiAgICAgICAgICAgIGlmIChwYWQpIGZpcnN0Tm9kZS5pbnNlcnRCZWZvcmUodGFyZ2V0RG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUocGFkKSwgZmlyc3ROb2RlLmZpcnN0Q2hpbGQpO1xyXG4gICAgICAgICAgICBndXR0ZXIuc3R5bGUuZGlzcGxheSA9IFwiXCI7XHJcbiAgICAgICAgICAgIGxpbmVTcGFjZS5zdHlsZS5tYXJnaW5MZWZ0ID0gZ3V0dGVyLm9mZnNldFdpZHRoICsgXCJweFwiO1xyXG4gICAgICAgICAgICBndXR0ZXJEaXJ0eSA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiB1cGRhdGVDdXJzb3IoKSB7XHJcbiAgICAgICAgICAgIHZhciBoZWFkID0gc2VsLmludmVydGVkID8gc2VsLmZyb20gOiBzZWwudG8sIGxoID0gdGV4dEhlaWdodCgpO1xyXG4gICAgICAgICAgICB2YXIgcG9zID0gbG9jYWxDb29yZHMoaGVhZCwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIHZhciB3cmFwT2ZmID0gZWx0T2Zmc2V0KHdyYXBwZXIpLCBsaW5lT2ZmID0gZWx0T2Zmc2V0KGxpbmVEaXYpO1xyXG4gICAgICAgICAgICBpbnB1dERpdi5zdHlsZS50b3AgPSAocG9zLnkgKyBsaW5lT2ZmLnRvcCAtIHdyYXBPZmYudG9wKSArIFwicHhcIjtcclxuICAgICAgICAgICAgaW5wdXREaXYuc3R5bGUubGVmdCA9IChwb3MueCArIGxpbmVPZmYubGVmdCAtIHdyYXBPZmYubGVmdCkgKyBcInB4XCI7XHJcbiAgICAgICAgICAgIGlmIChwb3NFcShzZWwuZnJvbSwgc2VsLnRvKSkge1xyXG4gICAgICAgICAgICAgICAgY3Vyc29yLnN0eWxlLnRvcCA9IHBvcy55ICsgXCJweFwiO1xyXG4gICAgICAgICAgICAgICAgY3Vyc29yLnN0eWxlLmxlZnQgPSAob3B0aW9ucy5saW5lV3JhcHBpbmcgPyBNYXRoLm1pbihwb3MueCwgbGluZVNwYWNlLm9mZnNldFdpZHRoKSA6IHBvcy54KSArIFwicHhcIjtcclxuICAgICAgICAgICAgICAgIGN1cnNvci5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGN1cnNvci5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBzZXRTaGlmdCh2YWwpIHtcclxuICAgICAgICAgICAgaWYgKHZhbCkgc2hpZnRTZWxlY3RpbmcgPSBzaGlmdFNlbGVjdGluZyB8fCAoc2VsLmludmVydGVkID8gc2VsLnRvIDogc2VsLmZyb20pO1xyXG4gICAgICAgICAgICBlbHNlIHNoaWZ0U2VsZWN0aW5nID0gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gc2V0U2VsZWN0aW9uVXNlcihmcm9tLCB0bykge1xyXG4gICAgICAgICAgICB2YXIgc2ggPSBzaGlmdFNlbGVjdGluZyAmJiBjbGlwUG9zKHNoaWZ0U2VsZWN0aW5nKTtcclxuICAgICAgICAgICAgaWYgKHNoKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAocG9zTGVzcyhzaCwgZnJvbSkpIGZyb20gPSBzaDtcclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHBvc0xlc3ModG8sIHNoKSkgdG8gPSBzaDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBzZXRTZWxlY3Rpb24oZnJvbSwgdG8pO1xyXG4gICAgICAgICAgICB1c2VyU2VsQ2hhbmdlID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gVXBkYXRlIHRoZSBzZWxlY3Rpb24uIExhc3QgdHdvIGFyZ3MgYXJlIG9ubHkgdXNlZCBieVxyXG4gICAgICAgIC8vIHVwZGF0ZUxpbmVzLCBzaW5jZSB0aGV5IGhhdmUgdG8gYmUgZXhwcmVzc2VkIGluIHRoZSBsaW5lXHJcbiAgICAgICAgLy8gbnVtYmVycyBiZWZvcmUgdGhlIHVwZGF0ZS5cclxuICAgICAgICBmdW5jdGlvbiBzZXRTZWxlY3Rpb24oZnJvbSwgdG8sIG9sZEZyb20sIG9sZFRvKSB7XHJcbiAgICAgICAgICAgIGdvYWxDb2x1bW4gPSBudWxsO1xyXG4gICAgICAgICAgICBpZiAob2xkRnJvbSA9PSBudWxsKSB7b2xkRnJvbSA9IHNlbC5mcm9tLmxpbmU7IG9sZFRvID0gc2VsLnRvLmxpbmU7fVxyXG4gICAgICAgICAgICBpZiAocG9zRXEoc2VsLmZyb20sIGZyb20pICYmIHBvc0VxKHNlbC50bywgdG8pKSByZXR1cm47XHJcbiAgICAgICAgICAgIGlmIChwb3NMZXNzKHRvLCBmcm9tKSkge3ZhciB0bXAgPSB0bzsgdG8gPSBmcm9tOyBmcm9tID0gdG1wO31cclxuXHJcbiAgICAgICAgICAgIC8vIFNraXAgb3ZlciBoaWRkZW4gbGluZXMuXHJcbiAgICAgICAgICAgIGlmIChmcm9tLmxpbmUgIT0gb2xkRnJvbSkgZnJvbSA9IHNraXBIaWRkZW4oZnJvbSwgb2xkRnJvbSwgc2VsLmZyb20uY2gpO1xyXG4gICAgICAgICAgICBpZiAodG8ubGluZSAhPSBvbGRUbykgdG8gPSBza2lwSGlkZGVuKHRvLCBvbGRUbywgc2VsLnRvLmNoKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChwb3NFcShmcm9tLCB0bykpIHNlbC5pbnZlcnRlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICBlbHNlIGlmIChwb3NFcShmcm9tLCBzZWwudG8pKSBzZWwuaW52ZXJ0ZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgZWxzZSBpZiAocG9zRXEodG8sIHNlbC5mcm9tKSkgc2VsLmludmVydGVkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgIC8vIFNvbWUgdWdseSBsb2dpYyB1c2VkIHRvIG9ubHkgbWFyayB0aGUgbGluZXMgdGhhdCBhY3R1YWxseSBkaWRcclxuICAgICAgICAgICAgLy8gc2VlIGEgY2hhbmdlIGluIHNlbGVjdGlvbiBhcyBjaGFuZ2VkLCByYXRoZXIgdGhhbiB0aGUgd2hvbGVcclxuICAgICAgICAgICAgLy8gc2VsZWN0ZWQgcmFuZ2UuXHJcbiAgICAgICAgICAgIGlmIChwb3NFcShmcm9tLCB0bykpIHtcclxuICAgICAgICAgICAgICAgIGlmICghcG9zRXEoc2VsLmZyb20sIHNlbC50bykpXHJcbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlcy5wdXNoKHtmcm9tOiBvbGRGcm9tLCB0bzogb2xkVG8gKyAxfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAocG9zRXEoc2VsLmZyb20sIHNlbC50bykpIHtcclxuICAgICAgICAgICAgICAgIGNoYW5nZXMucHVzaCh7ZnJvbTogZnJvbS5saW5lLCB0bzogdG8ubGluZSArIDF9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGlmICghcG9zRXEoZnJvbSwgc2VsLmZyb20pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZyb20ubGluZSA8IG9sZEZyb20pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZXMucHVzaCh7ZnJvbTogZnJvbS5saW5lLCB0bzogTWF0aC5taW4odG8ubGluZSwgb2xkRnJvbSkgKyAxfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2VzLnB1c2goe2Zyb206IG9sZEZyb20sIHRvOiBNYXRoLm1pbihvbGRUbywgZnJvbS5saW5lKSArIDF9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICghcG9zRXEodG8sIHNlbC50bykpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodG8ubGluZSA8IG9sZFRvKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2VzLnB1c2goe2Zyb206IE1hdGgubWF4KG9sZEZyb20sIGZyb20ubGluZSksIHRvOiBvbGRUbyArIDF9KTtcclxuICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZXMucHVzaCh7ZnJvbTogTWF0aC5tYXgoZnJvbS5saW5lLCBvbGRUbyksIHRvOiB0by5saW5lICsgMX0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHNlbC5mcm9tID0gZnJvbTsgc2VsLnRvID0gdG87XHJcbiAgICAgICAgICAgIHNlbGVjdGlvbkNoYW5nZWQgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBza2lwSGlkZGVuKHBvcywgb2xkTGluZSwgb2xkQ2gpIHtcclxuICAgICAgICAgICAgZnVuY3Rpb24gZ2V0Tm9uSGlkZGVuKGRpcikge1xyXG4gICAgICAgICAgICAgICAgdmFyIGxObyA9IHBvcy5saW5lICsgZGlyLCBlbmQgPSBkaXIgPT0gMSA/IGRvYy5zaXplIDogLTE7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAobE5vICE9IGVuZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBsaW5lID0gZ2V0TGluZShsTm8pO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghbGluZS5oaWRkZW4pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNoID0gcG9zLmNoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2ggPiBvbGRDaCB8fCBjaCA+IGxpbmUudGV4dC5sZW5ndGgpIGNoID0gbGluZS50ZXh0Lmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtsaW5lOiBsTm8sIGNoOiBjaH07XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGxObyArPSBkaXI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIGxpbmUgPSBnZXRMaW5lKHBvcy5saW5lKTtcclxuICAgICAgICAgICAgaWYgKCFsaW5lLmhpZGRlbikgcmV0dXJuIHBvcztcclxuICAgICAgICAgICAgaWYgKHBvcy5saW5lID49IG9sZExpbmUpIHJldHVybiBnZXROb25IaWRkZW4oMSkgfHwgZ2V0Tm9uSGlkZGVuKC0xKTtcclxuICAgICAgICAgICAgZWxzZSByZXR1cm4gZ2V0Tm9uSGlkZGVuKC0xKSB8fCBnZXROb25IaWRkZW4oMSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIHNldEN1cnNvcihsaW5lLCBjaCwgdXNlcikge1xyXG4gICAgICAgICAgICB2YXIgcG9zID0gY2xpcFBvcyh7bGluZTogbGluZSwgY2g6IGNoIHx8IDB9KTtcclxuICAgICAgICAgICAgKHVzZXIgPyBzZXRTZWxlY3Rpb25Vc2VyIDogc2V0U2VsZWN0aW9uKShwb3MsIHBvcyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBjbGlwTGluZShuKSB7cmV0dXJuIE1hdGgubWF4KDAsIE1hdGgubWluKG4sIGRvYy5zaXplLTEpKTt9XHJcbiAgICAgICAgZnVuY3Rpb24gY2xpcFBvcyhwb3MpIHtcclxuICAgICAgICAgICAgaWYgKHBvcy5saW5lIDwgMCkgcmV0dXJuIHtsaW5lOiAwLCBjaDogMH07XHJcbiAgICAgICAgICAgIGlmIChwb3MubGluZSA+PSBkb2Muc2l6ZSkgcmV0dXJuIHtsaW5lOiBkb2Muc2l6ZS0xLCBjaDogZ2V0TGluZShkb2Muc2l6ZS0xKS50ZXh0Lmxlbmd0aH07XHJcbiAgICAgICAgICAgIHZhciBjaCA9IHBvcy5jaCwgbGluZWxlbiA9IGdldExpbmUocG9zLmxpbmUpLnRleHQubGVuZ3RoO1xyXG4gICAgICAgICAgICBpZiAoY2ggPT0gbnVsbCB8fCBjaCA+IGxpbmVsZW4pIHJldHVybiB7bGluZTogcG9zLmxpbmUsIGNoOiBsaW5lbGVufTtcclxuICAgICAgICAgICAgZWxzZSBpZiAoY2ggPCAwKSByZXR1cm4ge2xpbmU6IHBvcy5saW5lLCBjaDogMH07XHJcbiAgICAgICAgICAgIGVsc2UgcmV0dXJuIHBvcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGZpbmRQb3NIKGRpciwgdW5pdCkge1xyXG4gICAgICAgICAgICB2YXIgZW5kID0gc2VsLmludmVydGVkID8gc2VsLmZyb20gOiBzZWwudG8sIGxpbmUgPSBlbmQubGluZSwgY2ggPSBlbmQuY2g7XHJcbiAgICAgICAgICAgIHZhciBsaW5lT2JqID0gZ2V0TGluZShsaW5lKTtcclxuICAgICAgICAgICAgZnVuY3Rpb24gZmluZE5leHRMaW5lKCkge1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgbCA9IGxpbmUgKyBkaXIsIGUgPSBkaXIgPCAwID8gLTEgOiBkb2Muc2l6ZTsgbCAhPSBlOyBsICs9IGRpcikge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBsbyA9IGdldExpbmUobCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFsby5oaWRkZW4pIHsgbGluZSA9IGw7IGxpbmVPYmogPSBsbzsgcmV0dXJuIHRydWU7IH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBmdW5jdGlvbiBtb3ZlT25jZShib3VuZFRvTGluZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGNoID09IChkaXIgPCAwID8gMCA6IGxpbmVPYmoudGV4dC5sZW5ndGgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFib3VuZFRvTGluZSAmJiBmaW5kTmV4dExpbmUoKSkgY2ggPSBkaXIgPCAwID8gbGluZU9iai50ZXh0Lmxlbmd0aCA6IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgY2ggKz0gZGlyO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHVuaXQgPT0gXCJjaGFyXCIpIG1vdmVPbmNlKCk7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHVuaXQgPT0gXCJjb2x1bW5cIikgbW92ZU9uY2UodHJ1ZSk7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHVuaXQgPT0gXCJ3b3JkXCIpIHtcclxuICAgICAgICAgICAgICAgIHZhciBzYXdXb3JkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBmb3IgKDs7KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRpciA8IDApIGlmICghbW92ZU9uY2UoKSkgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzV29yZENoYXIobGluZU9iai50ZXh0LmNoYXJBdChjaCkpKSBzYXdXb3JkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChzYXdXb3JkKSB7aWYgKGRpciA8IDApIHtkaXIgPSAxOyBtb3ZlT25jZSgpO30gYnJlYWs7fVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkaXIgPiAwKSBpZiAoIW1vdmVPbmNlKCkpIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB7bGluZTogbGluZSwgY2g6IGNofTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gbW92ZUgoZGlyLCB1bml0KSB7XHJcbiAgICAgICAgICAgIHZhciBwb3MgPSBkaXIgPCAwID8gc2VsLmZyb20gOiBzZWwudG87XHJcbiAgICAgICAgICAgIGlmIChzaGlmdFNlbGVjdGluZyB8fCBwb3NFcShzZWwuZnJvbSwgc2VsLnRvKSkgcG9zID0gZmluZFBvc0goZGlyLCB1bml0KTtcclxuICAgICAgICAgICAgc2V0Q3Vyc29yKHBvcy5saW5lLCBwb3MuY2gsIHRydWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBkZWxldGVIKGRpciwgdW5pdCkge1xyXG4gICAgICAgICAgICBpZiAoIXBvc0VxKHNlbC5mcm9tLCBzZWwudG8pKSByZXBsYWNlUmFuZ2UoXCJcIiwgc2VsLmZyb20sIHNlbC50byk7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKGRpciA8IDApIHJlcGxhY2VSYW5nZShcIlwiLCBmaW5kUG9zSChkaXIsIHVuaXQpLCBzZWwudG8pO1xyXG4gICAgICAgICAgICBlbHNlIHJlcGxhY2VSYW5nZShcIlwiLCBzZWwuZnJvbSwgZmluZFBvc0goZGlyLCB1bml0KSk7XHJcbiAgICAgICAgICAgIHVzZXJTZWxDaGFuZ2UgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgZ29hbENvbHVtbiA9IG51bGw7XHJcbiAgICAgICAgZnVuY3Rpb24gbW92ZVYoZGlyLCB1bml0KSB7XHJcbiAgICAgICAgICAgIHZhciBkaXN0ID0gMCwgcG9zID0gbG9jYWxDb29yZHMoc2VsLmludmVydGVkID8gc2VsLmZyb20gOiBzZWwudG8sIHRydWUpO1xyXG4gICAgICAgICAgICBpZiAoZ29hbENvbHVtbiAhPSBudWxsKSBwb3MueCA9IGdvYWxDb2x1bW47XHJcbiAgICAgICAgICAgIGlmICh1bml0ID09IFwicGFnZVwiKSBkaXN0ID0gc2Nyb2xsZXIuY2xpZW50SGVpZ2h0O1xyXG4gICAgICAgICAgICBlbHNlIGlmICh1bml0ID09IFwibGluZVwiKSBkaXN0ID0gdGV4dEhlaWdodCgpO1xyXG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0gY29vcmRzQ2hhcihwb3MueCwgcG9zLnkgKyBkaXN0ICogZGlyICsgMik7XHJcbiAgICAgICAgICAgIHNldEN1cnNvcih0YXJnZXQubGluZSwgdGFyZ2V0LmNoLCB0cnVlKTtcclxuICAgICAgICAgICAgZ29hbENvbHVtbiA9IHBvcy54O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gc2VsZWN0V29yZEF0KHBvcykge1xyXG4gICAgICAgICAgICB2YXIgbGluZSA9IGdldExpbmUocG9zLmxpbmUpLnRleHQ7XHJcbiAgICAgICAgICAgIHZhciBzdGFydCA9IHBvcy5jaCwgZW5kID0gcG9zLmNoO1xyXG4gICAgICAgICAgICB3aGlsZSAoc3RhcnQgPiAwICYmIGlzV29yZENoYXIobGluZS5jaGFyQXQoc3RhcnQgLSAxKSkpIC0tc3RhcnQ7XHJcbiAgICAgICAgICAgIHdoaWxlIChlbmQgPCBsaW5lLmxlbmd0aCAmJiBpc1dvcmRDaGFyKGxpbmUuY2hhckF0KGVuZCkpKSArK2VuZDtcclxuICAgICAgICAgICAgc2V0U2VsZWN0aW9uVXNlcih7bGluZTogcG9zLmxpbmUsIGNoOiBzdGFydH0sIHtsaW5lOiBwb3MubGluZSwgY2g6IGVuZH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBzZWxlY3RMaW5lKGxpbmUpIHtcclxuICAgICAgICAgICAgc2V0U2VsZWN0aW9uVXNlcih7bGluZTogbGluZSwgY2g6IDB9LCB7bGluZTogbGluZSwgY2g6IGdldExpbmUobGluZSkudGV4dC5sZW5ndGh9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gaW5kZW50U2VsZWN0ZWQobW9kZSkge1xyXG4gICAgICAgICAgICBpZiAocG9zRXEoc2VsLmZyb20sIHNlbC50bykpIHJldHVybiBpbmRlbnRMaW5lKHNlbC5mcm9tLmxpbmUsIG1vZGUpO1xyXG4gICAgICAgICAgICB2YXIgZSA9IHNlbC50by5saW5lIC0gKHNlbC50by5jaCA/IDAgOiAxKTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IHNlbC5mcm9tLmxpbmU7IGkgPD0gZTsgKytpKSBpbmRlbnRMaW5lKGksIG1vZGUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gaW5kZW50TGluZShuLCBob3cpIHtcclxuICAgICAgICAgICAgaWYgKCFob3cpIGhvdyA9IFwiYWRkXCI7XHJcbiAgICAgICAgICAgIGlmIChob3cgPT0gXCJzbWFydFwiKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIW1vZGUuaW5kZW50KSBob3cgPSBcInByZXZcIjtcclxuICAgICAgICAgICAgICAgIGVsc2UgdmFyIHN0YXRlID0gZ2V0U3RhdGVCZWZvcmUobik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBsaW5lID0gZ2V0TGluZShuKSwgY3VyU3BhY2UgPSBsaW5lLmluZGVudGF0aW9uKG9wdGlvbnMudGFiU2l6ZSksXHJcbiAgICAgICAgICAgICAgICBjdXJTcGFjZVN0cmluZyA9IGxpbmUudGV4dC5tYXRjaCgvXlxccyovKVswXSwgaW5kZW50YXRpb247XHJcbiAgICAgICAgICAgIGlmIChob3cgPT0gXCJwcmV2XCIpIHtcclxuICAgICAgICAgICAgICAgIGlmIChuKSBpbmRlbnRhdGlvbiA9IGdldExpbmUobi0xKS5pbmRlbnRhdGlvbihvcHRpb25zLnRhYlNpemUpO1xyXG4gICAgICAgICAgICAgICAgZWxzZSBpbmRlbnRhdGlvbiA9IDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoaG93ID09IFwic21hcnRcIikgaW5kZW50YXRpb24gPSBtb2RlLmluZGVudChzdGF0ZSwgbGluZS50ZXh0LnNsaWNlKGN1clNwYWNlU3RyaW5nLmxlbmd0aCksIGxpbmUudGV4dCk7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKGhvdyA9PSBcImFkZFwiKSBpbmRlbnRhdGlvbiA9IGN1clNwYWNlICsgb3B0aW9ucy5pbmRlbnRVbml0O1xyXG4gICAgICAgICAgICBlbHNlIGlmIChob3cgPT0gXCJzdWJ0cmFjdFwiKSBpbmRlbnRhdGlvbiA9IGN1clNwYWNlIC0gb3B0aW9ucy5pbmRlbnRVbml0O1xyXG4gICAgICAgICAgICBpbmRlbnRhdGlvbiA9IE1hdGgubWF4KDAsIGluZGVudGF0aW9uKTtcclxuICAgICAgICAgICAgdmFyIGRpZmYgPSBpbmRlbnRhdGlvbiAtIGN1clNwYWNlO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFkaWZmKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2VsLmZyb20ubGluZSAhPSBuICYmIHNlbC50by5saW5lICE9IG4pIHJldHVybjtcclxuICAgICAgICAgICAgICAgIHZhciBpbmRlbnRTdHJpbmcgPSBjdXJTcGFjZVN0cmluZztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHZhciBpbmRlbnRTdHJpbmcgPSBcIlwiLCBwb3MgPSAwO1xyXG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuaW5kZW50V2l0aFRhYnMpXHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IE1hdGguZmxvb3IoaW5kZW50YXRpb24gLyBvcHRpb25zLnRhYlNpemUpOyBpOyAtLWkpIHtwb3MgKz0gb3B0aW9ucy50YWJTaXplOyBpbmRlbnRTdHJpbmcgKz0gXCJcXHRcIjt9XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAocG9zIDwgaW5kZW50YXRpb24pIHsrK3BvczsgaW5kZW50U3RyaW5nICs9IFwiIFwiO31cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmVwbGFjZVJhbmdlKGluZGVudFN0cmluZywge2xpbmU6IG4sIGNoOiAwfSwge2xpbmU6IG4sIGNoOiBjdXJTcGFjZVN0cmluZy5sZW5ndGh9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGxvYWRNb2RlKCkge1xyXG4gICAgICAgICAgICBtb2RlID0gQ29kZU1pcnJvci5nZXRNb2RlKG9wdGlvbnMsIG9wdGlvbnMubW9kZSk7XHJcbiAgICAgICAgICAgIGRvYy5pdGVyKDAsIGRvYy5zaXplLCBmdW5jdGlvbihsaW5lKSB7IGxpbmUuc3RhdGVBZnRlciA9IG51bGw7IH0pO1xyXG4gICAgICAgICAgICB3b3JrID0gWzBdO1xyXG4gICAgICAgICAgICBzdGFydFdvcmtlcigpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBndXR0ZXJDaGFuZ2VkKCkge1xyXG4gICAgICAgICAgICB2YXIgdmlzaWJsZSA9IG9wdGlvbnMuZ3V0dGVyIHx8IG9wdGlvbnMubGluZU51bWJlcnM7XHJcbiAgICAgICAgICAgIGd1dHRlci5zdHlsZS5kaXNwbGF5ID0gdmlzaWJsZSA/IFwiXCIgOiBcIm5vbmVcIjtcclxuICAgICAgICAgICAgaWYgKHZpc2libGUpIGd1dHRlckRpcnR5ID0gdHJ1ZTtcclxuICAgICAgICAgICAgZWxzZSBsaW5lRGl2LnBhcmVudE5vZGUuc3R5bGUubWFyZ2luTGVmdCA9IDA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIHdyYXBwaW5nQ2hhbmdlZChmcm9tLCB0bykge1xyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5saW5lV3JhcHBpbmcpIHtcclxuICAgICAgICAgICAgICAgIHdyYXBwZXIuY2xhc3NOYW1lICs9IFwiIENvZGVNaXJyb3Itd3JhcFwiO1xyXG4gICAgICAgICAgICAgICAgdmFyIHBlckxpbmUgPSBzY3JvbGxlci5jbGllbnRXaWR0aCAvIGNoYXJXaWR0aCgpIC0gMztcclxuICAgICAgICAgICAgICAgIGRvYy5pdGVyKDAsIGRvYy5zaXplLCBmdW5jdGlvbihsaW5lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxpbmUuaGlkZGVuKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGd1ZXNzID0gTWF0aC5jZWlsKGxpbmUudGV4dC5sZW5ndGggLyBwZXJMaW5lKSB8fCAxO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChndWVzcyAhPSAxKSB1cGRhdGVMaW5lSGVpZ2h0KGxpbmUsIGd1ZXNzKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgbGluZVNwYWNlLnN0eWxlLndpZHRoID0gY29kZS5zdHlsZS53aWR0aCA9IFwiXCI7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB3cmFwcGVyLmNsYXNzTmFtZSA9IHdyYXBwZXIuY2xhc3NOYW1lLnJlcGxhY2UoXCIgQ29kZU1pcnJvci13cmFwXCIsIFwiXCIpO1xyXG4gICAgICAgICAgICAgICAgbWF4V2lkdGggPSBudWxsOyBtYXhMaW5lID0gXCJcIjtcclxuICAgICAgICAgICAgICAgIGRvYy5pdGVyKDAsIGRvYy5zaXplLCBmdW5jdGlvbihsaW5lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxpbmUuaGVpZ2h0ICE9IDEgJiYgIWxpbmUuaGlkZGVuKSB1cGRhdGVMaW5lSGVpZ2h0KGxpbmUsIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChsaW5lLnRleHQubGVuZ3RoID4gbWF4TGluZS5sZW5ndGgpIG1heExpbmUgPSBsaW5lLnRleHQ7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjaGFuZ2VzLnB1c2goe2Zyb206IDAsIHRvOiBkb2Muc2l6ZX0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBjb21wdXRlVGFiVGV4dCgpIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgc3RyID0gJzxzcGFuIGNsYXNzPVwiY20tdGFiXCI+JywgaSA9IDA7IGkgPCBvcHRpb25zLnRhYlNpemU7ICsraSkgc3RyICs9IFwiIFwiO1xyXG4gICAgICAgICAgICByZXR1cm4gc3RyICsgXCI8L3NwYW4+XCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIHRhYnNDaGFuZ2VkKCkge1xyXG4gICAgICAgICAgICB0YWJUZXh0ID0gY29tcHV0ZVRhYlRleHQoKTtcclxuICAgICAgICAgICAgdXBkYXRlRGlzcGxheSh0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gdGhlbWVDaGFuZ2VkKCkge1xyXG4gICAgICAgICAgICBzY3JvbGxlci5jbGFzc05hbWUgPSBzY3JvbGxlci5jbGFzc05hbWUucmVwbGFjZSgvXFxzKmNtLXMtXFx3Ky9nLCBcIlwiKSArXHJcbiAgICAgICAgICAgICAgICBvcHRpb25zLnRoZW1lLnJlcGxhY2UoLyhefFxccylcXHMqL2csIFwiIGNtLXMtXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gVGV4dE1hcmtlcigpIHsgdGhpcy5zZXQgPSBbXTsgfVxyXG4gICAgICAgIFRleHRNYXJrZXIucHJvdG90eXBlLmNsZWFyID0gb3BlcmF0aW9uKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB2YXIgbWluID0gSW5maW5pdHksIG1heCA9IC1JbmZpbml0eTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGUgPSB0aGlzLnNldC5sZW5ndGg7IGkgPCBlOyArK2kpIHtcclxuICAgICAgICAgICAgICAgIHZhciBsaW5lID0gdGhpcy5zZXRbaV0sIG1rID0gbGluZS5tYXJrZWQ7XHJcbiAgICAgICAgICAgICAgICBpZiAoIW1rIHx8ICFsaW5lLnBhcmVudCkgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICB2YXIgbGluZU4gPSBsaW5lTm8obGluZSk7XHJcbiAgICAgICAgICAgICAgICBtaW4gPSBNYXRoLm1pbihtaW4sIGxpbmVOKTsgbWF4ID0gTWF0aC5tYXgobWF4LCBsaW5lTik7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IG1rLmxlbmd0aDsgKytqKVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChta1tqXS5zZXQgPT0gdGhpcy5zZXQpIG1rLnNwbGljZShqLS0sIDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChtaW4gIT0gSW5maW5pdHkpXHJcbiAgICAgICAgICAgICAgICBjaGFuZ2VzLnB1c2goe2Zyb206IG1pbiwgdG86IG1heCArIDF9KTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBUZXh0TWFya2VyLnByb3RvdHlwZS5maW5kID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHZhciBmcm9tLCB0bztcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGUgPSB0aGlzLnNldC5sZW5ndGg7IGkgPCBlOyArK2kpIHtcclxuICAgICAgICAgICAgICAgIHZhciBsaW5lID0gdGhpcy5zZXRbaV0sIG1rID0gbGluZS5tYXJrZWQ7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IG1rLmxlbmd0aDsgKytqKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1hcmsgPSBta1tqXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobWFyay5zZXQgPT0gdGhpcy5zZXQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1hcmsuZnJvbSAhPSBudWxsIHx8IG1hcmsudG8gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGZvdW5kID0gbGluZU5vKGxpbmUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZvdW5kICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobWFyay5mcm9tICE9IG51bGwpIGZyb20gPSB7bGluZTogZm91bmQsIGNoOiBtYXJrLmZyb219O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtYXJrLnRvICE9IG51bGwpIHRvID0ge2xpbmU6IGZvdW5kLCBjaDogbWFyay50b307XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHtmcm9tOiBmcm9tLCB0bzogdG99O1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIG1hcmtUZXh0KGZyb20sIHRvLCBjbGFzc05hbWUpIHtcclxuICAgICAgICAgICAgZnJvbSA9IGNsaXBQb3MoZnJvbSk7IHRvID0gY2xpcFBvcyh0byk7XHJcbiAgICAgICAgICAgIHZhciB0bSA9IG5ldyBUZXh0TWFya2VyKCk7XHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIGFkZChsaW5lLCBmcm9tLCB0bywgY2xhc3NOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICBnZXRMaW5lKGxpbmUpLmFkZE1hcmsobmV3IE1hcmtlZFRleHQoZnJvbSwgdG8sIGNsYXNzTmFtZSwgdG0uc2V0KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGZyb20ubGluZSA9PSB0by5saW5lKSBhZGQoZnJvbS5saW5lLCBmcm9tLmNoLCB0by5jaCwgY2xhc3NOYW1lKTtcclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBhZGQoZnJvbS5saW5lLCBmcm9tLmNoLCBudWxsLCBjbGFzc05hbWUpO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IGZyb20ubGluZSArIDEsIGUgPSB0by5saW5lOyBpIDwgZTsgKytpKVxyXG4gICAgICAgICAgICAgICAgICAgIGFkZChpLCBudWxsLCBudWxsLCBjbGFzc05hbWUpO1xyXG4gICAgICAgICAgICAgICAgYWRkKHRvLmxpbmUsIG51bGwsIHRvLmNoLCBjbGFzc05hbWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNoYW5nZXMucHVzaCh7ZnJvbTogZnJvbS5saW5lLCB0bzogdG8ubGluZSArIDF9KTtcclxuICAgICAgICAgICAgcmV0dXJuIHRtO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gc2V0Qm9va21hcmsocG9zKSB7XHJcbiAgICAgICAgICAgIHBvcyA9IGNsaXBQb3MocG9zKTtcclxuICAgICAgICAgICAgdmFyIGJtID0gbmV3IEJvb2ttYXJrKHBvcy5jaCk7XHJcbiAgICAgICAgICAgIGdldExpbmUocG9zLmxpbmUpLmFkZE1hcmsoYm0pO1xyXG4gICAgICAgICAgICByZXR1cm4gYm07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBhZGRHdXR0ZXJNYXJrZXIobGluZSwgdGV4dCwgY2xhc3NOYW1lKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgbGluZSA9PSBcIm51bWJlclwiKSBsaW5lID0gZ2V0TGluZShjbGlwTGluZShsaW5lKSk7XHJcbiAgICAgICAgICAgIGxpbmUuZ3V0dGVyTWFya2VyID0ge3RleHQ6IHRleHQsIHN0eWxlOiBjbGFzc05hbWV9O1xyXG4gICAgICAgICAgICBndXR0ZXJEaXJ0eSA9IHRydWU7XHJcbiAgICAgICAgICAgIHJldHVybiBsaW5lO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiByZW1vdmVHdXR0ZXJNYXJrZXIobGluZSkge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIGxpbmUgPT0gXCJudW1iZXJcIikgbGluZSA9IGdldExpbmUoY2xpcExpbmUobGluZSkpO1xyXG4gICAgICAgICAgICBsaW5lLmd1dHRlck1hcmtlciA9IG51bGw7XHJcbiAgICAgICAgICAgIGd1dHRlckRpcnR5ID0gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGNoYW5nZUxpbmUoaGFuZGxlLCBvcCkge1xyXG4gICAgICAgICAgICB2YXIgbm8gPSBoYW5kbGUsIGxpbmUgPSBoYW5kbGU7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgaGFuZGxlID09IFwibnVtYmVyXCIpIGxpbmUgPSBnZXRMaW5lKGNsaXBMaW5lKGhhbmRsZSkpO1xyXG4gICAgICAgICAgICBlbHNlIG5vID0gbGluZU5vKGhhbmRsZSk7XHJcbiAgICAgICAgICAgIGlmIChubyA9PSBudWxsKSByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgaWYgKG9wKGxpbmUsIG5vKSkgY2hhbmdlcy5wdXNoKHtmcm9tOiBubywgdG86IG5vICsgMX0pO1xyXG4gICAgICAgICAgICBlbHNlIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICByZXR1cm4gbGluZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gc2V0TGluZUNsYXNzKGhhbmRsZSwgY2xhc3NOYW1lKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBjaGFuZ2VMaW5lKGhhbmRsZSwgZnVuY3Rpb24obGluZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGxpbmUuY2xhc3NOYW1lICE9IGNsYXNzTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxpbmUuY2xhc3NOYW1lID0gY2xhc3NOYW1lO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gc2V0TGluZUhpZGRlbihoYW5kbGUsIGhpZGRlbikge1xyXG4gICAgICAgICAgICByZXR1cm4gY2hhbmdlTGluZShoYW5kbGUsIGZ1bmN0aW9uKGxpbmUsIG5vKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAobGluZS5oaWRkZW4gIT0gaGlkZGVuKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGluZS5oaWRkZW4gPSBoaWRkZW47XHJcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlTGluZUhlaWdodChsaW5lLCBoaWRkZW4gPyAwIDogMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGhpZGRlbiAmJiAoc2VsLmZyb20ubGluZSA9PSBubyB8fCBzZWwudG8ubGluZSA9PSBubykpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFNlbGVjdGlvbihza2lwSGlkZGVuKHNlbC5mcm9tLCBzZWwuZnJvbS5saW5lLCBzZWwuZnJvbS5jaCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBza2lwSGlkZGVuKHNlbC50bywgc2VsLnRvLmxpbmUsIHNlbC50by5jaCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoZ3V0dGVyRGlydHkgPSB0cnVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBsaW5lSW5mbyhsaW5lKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgbGluZSA9PSBcIm51bWJlclwiKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWlzTGluZShsaW5lKSkgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgICAgICB2YXIgbiA9IGxpbmU7XHJcbiAgICAgICAgICAgICAgICBsaW5lID0gZ2V0TGluZShsaW5lKTtcclxuICAgICAgICAgICAgICAgIGlmICghbGluZSkgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbiA9IGxpbmVObyhsaW5lKTtcclxuICAgICAgICAgICAgICAgIGlmIChuID09IG51bGwpIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciBtYXJrZXIgPSBsaW5lLmd1dHRlck1hcmtlcjtcclxuICAgICAgICAgICAgcmV0dXJuIHtsaW5lOiBuLCBoYW5kbGU6IGxpbmUsIHRleHQ6IGxpbmUudGV4dCwgbWFya2VyVGV4dDogbWFya2VyICYmIG1hcmtlci50ZXh0LFxyXG4gICAgICAgICAgICAgICAgbWFya2VyQ2xhc3M6IG1hcmtlciAmJiBtYXJrZXIuc3R5bGUsIGxpbmVDbGFzczogbGluZS5jbGFzc05hbWV9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gc3RyaW5nV2lkdGgoc3RyKSB7XHJcbiAgICAgICAgICAgIG1lYXN1cmUuaW5uZXJIVE1MID0gXCI8cHJlPjxzcGFuPng8L3NwYW4+PC9wcmU+XCI7XHJcbiAgICAgICAgICAgIG1lYXN1cmUuZmlyc3RDaGlsZC5maXJzdENoaWxkLmZpcnN0Q2hpbGQubm9kZVZhbHVlID0gc3RyO1xyXG4gICAgICAgICAgICByZXR1cm4gbWVhc3VyZS5maXJzdENoaWxkLmZpcnN0Q2hpbGQub2Zmc2V0V2lkdGggfHwgMTA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIFRoZXNlIGFyZSB1c2VkIHRvIGdvIGZyb20gcGl4ZWwgcG9zaXRpb25zIHRvIGNoYXJhY3RlclxyXG4gICAgICAgIC8vIHBvc2l0aW9ucywgdGFraW5nIHZhcnlpbmcgY2hhcmFjdGVyIHdpZHRocyBpbnRvIGFjY291bnQuXHJcbiAgICAgICAgZnVuY3Rpb24gY2hhckZyb21YKGxpbmUsIHgpIHtcclxuICAgICAgICAgICAgaWYgKHggPD0gMCkgcmV0dXJuIDA7XHJcbiAgICAgICAgICAgIHZhciBsaW5lT2JqID0gZ2V0TGluZShsaW5lKSwgdGV4dCA9IGxpbmVPYmoudGV4dDtcclxuICAgICAgICAgICAgZnVuY3Rpb24gZ2V0WChsZW4pIHtcclxuICAgICAgICAgICAgICAgIG1lYXN1cmUuaW5uZXJIVE1MID0gXCI8cHJlPjxzcGFuPlwiICsgbGluZU9iai5nZXRIVE1MKG51bGwsIG51bGwsIGZhbHNlLCB0YWJUZXh0LCBsZW4pICsgXCI8L3NwYW4+PC9wcmU+XCI7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbWVhc3VyZS5maXJzdENoaWxkLmZpcnN0Q2hpbGQub2Zmc2V0V2lkdGg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIGZyb20gPSAwLCBmcm9tWCA9IDAsIHRvID0gdGV4dC5sZW5ndGgsIHRvWDtcclxuICAgICAgICAgICAgLy8gR3Vlc3MgYSBzdWl0YWJsZSB1cHBlciBib3VuZCBmb3Igb3VyIHNlYXJjaC5cclxuICAgICAgICAgICAgdmFyIGVzdGltYXRlZCA9IE1hdGgubWluKHRvLCBNYXRoLmNlaWwoeCAvIGNoYXJXaWR0aCgpKSk7XHJcbiAgICAgICAgICAgIGZvciAoOzspIHtcclxuICAgICAgICAgICAgICAgIHZhciBlc3RYID0gZ2V0WChlc3RpbWF0ZWQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGVzdFggPD0geCAmJiBlc3RpbWF0ZWQgPCB0bykgZXN0aW1hdGVkID0gTWF0aC5taW4odG8sIE1hdGguY2VpbChlc3RpbWF0ZWQgKiAxLjIpKTtcclxuICAgICAgICAgICAgICAgIGVsc2Uge3RvWCA9IGVzdFg7IHRvID0gZXN0aW1hdGVkOyBicmVhazt9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHggPiB0b1gpIHJldHVybiB0bztcclxuICAgICAgICAgICAgLy8gVHJ5IHRvIGd1ZXNzIGEgc3VpdGFibGUgbG93ZXIgYm91bmQgYXMgd2VsbC5cclxuICAgICAgICAgICAgZXN0aW1hdGVkID0gTWF0aC5mbG9vcih0byAqIDAuOCk7IGVzdFggPSBnZXRYKGVzdGltYXRlZCk7XHJcbiAgICAgICAgICAgIGlmIChlc3RYIDwgeCkge2Zyb20gPSBlc3RpbWF0ZWQ7IGZyb21YID0gZXN0WDt9XHJcbiAgICAgICAgICAgIC8vIERvIGEgYmluYXJ5IHNlYXJjaCBiZXR3ZWVuIHRoZXNlIGJvdW5kcy5cclxuICAgICAgICAgICAgZm9yICg7Oykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRvIC0gZnJvbSA8PSAxKSByZXR1cm4gKHRvWCAtIHggPiB4IC0gZnJvbVgpID8gZnJvbSA6IHRvO1xyXG4gICAgICAgICAgICAgICAgdmFyIG1pZGRsZSA9IE1hdGguY2VpbCgoZnJvbSArIHRvKSAvIDIpLCBtaWRkbGVYID0gZ2V0WChtaWRkbGUpO1xyXG4gICAgICAgICAgICAgICAgaWYgKG1pZGRsZVggPiB4KSB7dG8gPSBtaWRkbGU7IHRvWCA9IG1pZGRsZVg7fVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7ZnJvbSA9IG1pZGRsZTsgZnJvbVggPSBtaWRkbGVYO31cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHRlbXBJZCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDB4ZmZmZmZmKS50b1N0cmluZygxNik7XHJcbiAgICAgICAgZnVuY3Rpb24gbWVhc3VyZUxpbmUobGluZSwgY2gpIHtcclxuICAgICAgICAgICAgdmFyIGV4dHJhID0gXCJcIjtcclxuICAgICAgICAgICAgLy8gSW5jbHVkZSBleHRyYSB0ZXh0IGF0IHRoZSBlbmQgdG8gbWFrZSBzdXJlIHRoZSBtZWFzdXJlZCBsaW5lIGlzIHdyYXBwZWQgaW4gdGhlIHJpZ2h0IHdheS5cclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMubGluZVdyYXBwaW5nKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZW5kID0gbGluZS50ZXh0LmluZGV4T2YoXCIgXCIsIGNoICsgMik7XHJcbiAgICAgICAgICAgICAgICBleHRyYSA9IGh0bWxFc2NhcGUobGluZS50ZXh0LnNsaWNlKGNoICsgMSwgZW5kIDwgMCA/IGxpbmUudGV4dC5sZW5ndGggOiBlbmQgKyAoaWUgPyA1IDogMCkpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBtZWFzdXJlLmlubmVySFRNTCA9IFwiPHByZT5cIiArIGxpbmUuZ2V0SFRNTChudWxsLCBudWxsLCBmYWxzZSwgdGFiVGV4dCwgY2gpICtcclxuICAgICAgICAgICAgICAgICc8c3BhbiBpZD1cIkNvZGVNaXJyb3ItdGVtcC0nICsgdGVtcElkICsgJ1wiPicgKyBodG1sRXNjYXBlKGxpbmUudGV4dC5jaGFyQXQoY2gpIHx8IFwiIFwiKSArIFwiPC9zcGFuPlwiICtcclxuICAgICAgICAgICAgICAgIGV4dHJhICsgXCI8L3ByZT5cIjtcclxuICAgICAgICAgICAgdmFyIGVsdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiQ29kZU1pcnJvci10ZW1wLVwiICsgdGVtcElkKTtcclxuICAgICAgICAgICAgdmFyIHRvcCA9IGVsdC5vZmZzZXRUb3AsIGxlZnQgPSBlbHQub2Zmc2V0TGVmdDtcclxuICAgICAgICAgICAgLy8gT2xkZXIgSUVzIHJlcG9ydCB6ZXJvIG9mZnNldHMgZm9yIHNwYW5zIGRpcmVjdGx5IGFmdGVyIGEgd3JhcFxyXG4gICAgICAgICAgICBpZiAoaWUgJiYgY2ggJiYgdG9wID09IDAgJiYgbGVmdCA9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYmFja3VwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcbiAgICAgICAgICAgICAgICBiYWNrdXAuaW5uZXJIVE1MID0gXCJ4XCI7XHJcbiAgICAgICAgICAgICAgICBlbHQucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoYmFja3VwLCBlbHQubmV4dFNpYmxpbmcpO1xyXG4gICAgICAgICAgICAgICAgdG9wID0gYmFja3VwLm9mZnNldFRvcDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4ge3RvcDogdG9wLCBsZWZ0OiBsZWZ0fTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gbG9jYWxDb29yZHMocG9zLCBpbkxpbmVXcmFwKSB7XHJcbiAgICAgICAgICAgIHZhciB4LCBsaCA9IHRleHRIZWlnaHQoKSwgeSA9IGxoICogKGhlaWdodEF0TGluZShkb2MsIHBvcy5saW5lKSAtIChpbkxpbmVXcmFwID8gZGlzcGxheU9mZnNldCA6IDApKTtcclxuICAgICAgICAgICAgaWYgKHBvcy5jaCA9PSAwKSB4ID0gMDtcclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3AgPSBtZWFzdXJlTGluZShnZXRMaW5lKHBvcy5saW5lKSwgcG9zLmNoKTtcclxuICAgICAgICAgICAgICAgIHggPSBzcC5sZWZ0O1xyXG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMubGluZVdyYXBwaW5nKSB5ICs9IE1hdGgubWF4KDAsIHNwLnRvcCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHt4OiB4LCB5OiB5LCB5Qm90OiB5ICsgbGh9O1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBDb29yZHMgbXVzdCBiZSBsaW5lU3BhY2UtbG9jYWxcclxuICAgICAgICBmdW5jdGlvbiBjb29yZHNDaGFyKHgsIHkpIHtcclxuICAgICAgICAgICAgaWYgKHkgPCAwKSB5ID0gMDtcclxuICAgICAgICAgICAgdmFyIHRoID0gdGV4dEhlaWdodCgpLCBjdyA9IGNoYXJXaWR0aCgpLCBoZWlnaHRQb3MgPSBkaXNwbGF5T2Zmc2V0ICsgTWF0aC5mbG9vcih5IC8gdGgpO1xyXG4gICAgICAgICAgICB2YXIgbGluZU5vID0gbGluZUF0SGVpZ2h0KGRvYywgaGVpZ2h0UG9zKTtcclxuICAgICAgICAgICAgaWYgKGxpbmVObyA+PSBkb2Muc2l6ZSkgcmV0dXJuIHtsaW5lOiBkb2Muc2l6ZSAtIDEsIGNoOiBnZXRMaW5lKGRvYy5zaXplIC0gMSkudGV4dC5sZW5ndGh9O1xyXG4gICAgICAgICAgICB2YXIgbGluZU9iaiA9IGdldExpbmUobGluZU5vKSwgdGV4dCA9IGxpbmVPYmoudGV4dDtcclxuICAgICAgICAgICAgdmFyIHR3ID0gb3B0aW9ucy5saW5lV3JhcHBpbmcsIGlubmVyT2ZmID0gdHcgPyBoZWlnaHRQb3MgLSBoZWlnaHRBdExpbmUoZG9jLCBsaW5lTm8pIDogMDtcclxuICAgICAgICAgICAgaWYgKHggPD0gMCAmJiBpbm5lck9mZiA9PSAwKSByZXR1cm4ge2xpbmU6IGxpbmVObywgY2g6IDB9O1xyXG4gICAgICAgICAgICBmdW5jdGlvbiBnZXRYKGxlbikge1xyXG4gICAgICAgICAgICAgICAgdmFyIHNwID0gbWVhc3VyZUxpbmUobGluZU9iaiwgbGVuKTtcclxuICAgICAgICAgICAgICAgIGlmICh0dykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBvZmYgPSBNYXRoLnJvdW5kKHNwLnRvcCAvIHRoKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gTWF0aC5tYXgoMCwgc3AubGVmdCArIChvZmYgLSBpbm5lck9mZikgKiBzY3JvbGxlci5jbGllbnRXaWR0aCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc3AubGVmdDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgZnJvbSA9IDAsIGZyb21YID0gMCwgdG8gPSB0ZXh0Lmxlbmd0aCwgdG9YO1xyXG4gICAgICAgICAgICAvLyBHdWVzcyBhIHN1aXRhYmxlIHVwcGVyIGJvdW5kIGZvciBvdXIgc2VhcmNoLlxyXG4gICAgICAgICAgICB2YXIgZXN0aW1hdGVkID0gTWF0aC5taW4odG8sIE1hdGguY2VpbCgoeCArIGlubmVyT2ZmICogc2Nyb2xsZXIuY2xpZW50V2lkdGggKiAuOSkgLyBjdykpO1xyXG4gICAgICAgICAgICBmb3IgKDs7KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZXN0WCA9IGdldFgoZXN0aW1hdGVkKTtcclxuICAgICAgICAgICAgICAgIGlmIChlc3RYIDw9IHggJiYgZXN0aW1hdGVkIDwgdG8pIGVzdGltYXRlZCA9IE1hdGgubWluKHRvLCBNYXRoLmNlaWwoZXN0aW1hdGVkICogMS4yKSk7XHJcbiAgICAgICAgICAgICAgICBlbHNlIHt0b1ggPSBlc3RYOyB0byA9IGVzdGltYXRlZDsgYnJlYWs7fVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh4ID4gdG9YKSByZXR1cm4ge2xpbmU6IGxpbmVObywgY2g6IHRvfTtcclxuICAgICAgICAgICAgLy8gVHJ5IHRvIGd1ZXNzIGEgc3VpdGFibGUgbG93ZXIgYm91bmQgYXMgd2VsbC5cclxuICAgICAgICAgICAgZXN0aW1hdGVkID0gTWF0aC5mbG9vcih0byAqIDAuOCk7IGVzdFggPSBnZXRYKGVzdGltYXRlZCk7XHJcbiAgICAgICAgICAgIGlmIChlc3RYIDwgeCkge2Zyb20gPSBlc3RpbWF0ZWQ7IGZyb21YID0gZXN0WDt9XHJcbiAgICAgICAgICAgIC8vIERvIGEgYmluYXJ5IHNlYXJjaCBiZXR3ZWVuIHRoZXNlIGJvdW5kcy5cclxuICAgICAgICAgICAgZm9yICg7Oykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRvIC0gZnJvbSA8PSAxKSByZXR1cm4ge2xpbmU6IGxpbmVObywgY2g6ICh0b1ggLSB4ID4geCAtIGZyb21YKSA/IGZyb20gOiB0b307XHJcbiAgICAgICAgICAgICAgICB2YXIgbWlkZGxlID0gTWF0aC5jZWlsKChmcm9tICsgdG8pIC8gMiksIG1pZGRsZVggPSBnZXRYKG1pZGRsZSk7XHJcbiAgICAgICAgICAgICAgICBpZiAobWlkZGxlWCA+IHgpIHt0byA9IG1pZGRsZTsgdG9YID0gbWlkZGxlWDt9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtmcm9tID0gbWlkZGxlOyBmcm9tWCA9IG1pZGRsZVg7fVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIHBhZ2VDb29yZHMocG9zKSB7XHJcbiAgICAgICAgICAgIHZhciBsb2NhbCA9IGxvY2FsQ29vcmRzKHBvcywgdHJ1ZSksIG9mZiA9IGVsdE9mZnNldChsaW5lU3BhY2UpO1xyXG4gICAgICAgICAgICByZXR1cm4ge3g6IG9mZi5sZWZ0ICsgbG9jYWwueCwgeTogb2ZmLnRvcCArIGxvY2FsLnksIHlCb3Q6IG9mZi50b3AgKyBsb2NhbC55Qm90fTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBjYWNoZWRIZWlnaHQsIGNhY2hlZEhlaWdodEZvciwgbWVhc3VyZVRleHQ7XHJcbiAgICAgICAgZnVuY3Rpb24gdGV4dEhlaWdodCgpIHtcclxuICAgICAgICAgICAgaWYgKG1lYXN1cmVUZXh0ID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIG1lYXN1cmVUZXh0ID0gXCI8cHJlPlwiO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA0OTsgKytpKSBtZWFzdXJlVGV4dCArPSBcIng8YnIvPlwiO1xyXG4gICAgICAgICAgICAgICAgbWVhc3VyZVRleHQgKz0gXCJ4PC9wcmU+XCI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIG9mZnNldEhlaWdodCA9IGxpbmVEaXYuY2xpZW50SGVpZ2h0O1xyXG4gICAgICAgICAgICBpZiAob2Zmc2V0SGVpZ2h0ID09IGNhY2hlZEhlaWdodEZvcikgcmV0dXJuIGNhY2hlZEhlaWdodDtcclxuICAgICAgICAgICAgY2FjaGVkSGVpZ2h0Rm9yID0gb2Zmc2V0SGVpZ2h0O1xyXG4gICAgICAgICAgICBtZWFzdXJlLmlubmVySFRNTCA9IG1lYXN1cmVUZXh0O1xyXG4gICAgICAgICAgICBjYWNoZWRIZWlnaHQgPSBtZWFzdXJlLmZpcnN0Q2hpbGQub2Zmc2V0SGVpZ2h0IC8gNTAgfHwgMTtcclxuICAgICAgICAgICAgbWVhc3VyZS5pbm5lckhUTUwgPSBcIlwiO1xyXG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkSGVpZ2h0O1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgY2FjaGVkV2lkdGgsIGNhY2hlZFdpZHRoRm9yID0gMDtcclxuICAgICAgICBmdW5jdGlvbiBjaGFyV2lkdGgoKSB7XHJcbiAgICAgICAgICAgIGlmIChzY3JvbGxlci5jbGllbnRXaWR0aCA9PSBjYWNoZWRXaWR0aEZvcikgcmV0dXJuIGNhY2hlZFdpZHRoO1xyXG4gICAgICAgICAgICBjYWNoZWRXaWR0aEZvciA9IHNjcm9sbGVyLmNsaWVudFdpZHRoO1xyXG4gICAgICAgICAgICByZXR1cm4gKGNhY2hlZFdpZHRoID0gc3RyaW5nV2lkdGgoXCJ4XCIpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gcGFkZGluZ1RvcCgpIHtyZXR1cm4gbGluZVNwYWNlLm9mZnNldFRvcDt9XHJcbiAgICAgICAgZnVuY3Rpb24gcGFkZGluZ0xlZnQoKSB7cmV0dXJuIGxpbmVTcGFjZS5vZmZzZXRMZWZ0O31cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gcG9zRnJvbU1vdXNlKGUsIGxpYmVyYWwpIHtcclxuICAgICAgICAgICAgdmFyIG9mZlcgPSBlbHRPZmZzZXQoc2Nyb2xsZXIsIHRydWUpLCB4LCB5O1xyXG4gICAgICAgICAgICAvLyBGYWlscyB1bnByZWRpY3RhYmx5IG9uIElFWzY3XSB3aGVuIG1vdXNlIGlzIGRyYWdnZWQgYXJvdW5kIHF1aWNrbHkuXHJcbiAgICAgICAgICAgIHRyeSB7IHggPSBlLmNsaWVudFg7IHkgPSBlLmNsaWVudFk7IH0gY2F0Y2ggKGUpIHsgcmV0dXJuIG51bGw7IH1cclxuICAgICAgICAgICAgLy8gVGhpcyBpcyBhIG1lc3Mgb2YgYSBoZXVyaXN0aWMgdG8gdHJ5IGFuZCBkZXRlcm1pbmUgd2hldGhlciBhXHJcbiAgICAgICAgICAgIC8vIHNjcm9sbC1iYXIgd2FzIGNsaWNrZWQgb3Igbm90LCBhbmQgdG8gcmV0dXJuIG51bGwgaWYgb25lIHdhc1xyXG4gICAgICAgICAgICAvLyAoYW5kICFsaWJlcmFsKS5cclxuICAgICAgICAgICAgaWYgKCFsaWJlcmFsICYmICh4IC0gb2ZmVy5sZWZ0ID4gc2Nyb2xsZXIuY2xpZW50V2lkdGggfHwgeSAtIG9mZlcudG9wID4gc2Nyb2xsZXIuY2xpZW50SGVpZ2h0KSlcclxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICB2YXIgb2ZmTCA9IGVsdE9mZnNldChsaW5lU3BhY2UsIHRydWUpO1xyXG4gICAgICAgICAgICByZXR1cm4gY29vcmRzQ2hhcih4IC0gb2ZmTC5sZWZ0LCB5IC0gb2ZmTC50b3ApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBvbkNvbnRleHRNZW51KGUpIHtcclxuICAgICAgICAgICAgdmFyIHBvcyA9IHBvc0Zyb21Nb3VzZShlKTtcclxuICAgICAgICAgICAgaWYgKCFwb3MgfHwgd2luZG93Lm9wZXJhKSByZXR1cm47IC8vIE9wZXJhIGlzIGRpZmZpY3VsdC5cclxuICAgICAgICAgICAgaWYgKHBvc0VxKHNlbC5mcm9tLCBzZWwudG8pIHx8IHBvc0xlc3MocG9zLCBzZWwuZnJvbSkgfHwgIXBvc0xlc3MocG9zLCBzZWwudG8pKVxyXG4gICAgICAgICAgICAgICAgb3BlcmF0aW9uKHNldEN1cnNvcikocG9zLmxpbmUsIHBvcy5jaCk7XHJcblxyXG4gICAgICAgICAgICB2YXIgb2xkQ1NTID0gaW5wdXQuc3R5bGUuY3NzVGV4dDtcclxuICAgICAgICAgICAgaW5wdXREaXYuc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XHJcbiAgICAgICAgICAgIGlucHV0LnN0eWxlLmNzc1RleHQgPSBcInBvc2l0aW9uOiBmaXhlZDsgd2lkdGg6IDMwcHg7IGhlaWdodDogMzBweDsgdG9wOiBcIiArIChlLmNsaWVudFkgLSA1KSArXHJcbiAgICAgICAgICAgICAgICBcInB4OyBsZWZ0OiBcIiArIChlLmNsaWVudFggLSA1KSArIFwicHg7IHotaW5kZXg6IDEwMDA7IGJhY2tncm91bmQ6IHdoaXRlOyBcIiArXHJcbiAgICAgICAgICAgICAgICBcImJvcmRlci13aWR0aDogMDsgb3V0bGluZTogbm9uZTsgb3ZlcmZsb3c6IGhpZGRlbjsgb3BhY2l0eTogLjA1OyBmaWx0ZXI6IGFscGhhKG9wYWNpdHk9NSk7XCI7XHJcbiAgICAgICAgICAgIGxlYXZlSW5wdXRBbG9uZSA9IHRydWU7XHJcbiAgICAgICAgICAgIHZhciB2YWwgPSBpbnB1dC52YWx1ZSA9IGdldFNlbGVjdGlvbigpO1xyXG4gICAgICAgICAgICBmb2N1c0lucHV0KCk7XHJcbiAgICAgICAgICAgIGlucHV0LnNlbGVjdCgpO1xyXG4gICAgICAgICAgICBmdW5jdGlvbiByZWhpZGUoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmV3VmFsID0gc3BsaXRMaW5lcyhpbnB1dC52YWx1ZSkuam9pbihcIlxcblwiKTtcclxuICAgICAgICAgICAgICAgIGlmIChuZXdWYWwgIT0gdmFsKSBvcGVyYXRpb24ocmVwbGFjZVNlbGVjdGlvbikobmV3VmFsLCBcImVuZFwiKTtcclxuICAgICAgICAgICAgICAgIGlucHV0RGl2LnN0eWxlLnBvc2l0aW9uID0gXCJyZWxhdGl2ZVwiO1xyXG4gICAgICAgICAgICAgICAgaW5wdXQuc3R5bGUuY3NzVGV4dCA9IG9sZENTUztcclxuICAgICAgICAgICAgICAgIGxlYXZlSW5wdXRBbG9uZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgcmVzZXRJbnB1dCh0cnVlKTtcclxuICAgICAgICAgICAgICAgIHNsb3dQb2xsKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChnZWNrbykge1xyXG4gICAgICAgICAgICAgICAgZV9zdG9wKGUpO1xyXG4gICAgICAgICAgICAgICAgdmFyIG1vdXNldXAgPSBjb25uZWN0KHdpbmRvdywgXCJtb3VzZXVwXCIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG1vdXNldXAoKTtcclxuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KHJlaGlkZSwgMjApO1xyXG4gICAgICAgICAgICAgICAgfSwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KHJlaGlkZSwgNTApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBDdXJzb3ItYmxpbmtpbmdcclxuICAgICAgICBmdW5jdGlvbiByZXN0YXJ0QmxpbmsoKSB7XHJcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoYmxpbmtlcik7XHJcbiAgICAgICAgICAgIHZhciBvbiA9IHRydWU7XHJcbiAgICAgICAgICAgIGN1cnNvci5zdHlsZS52aXNpYmlsaXR5ID0gXCJcIjtcclxuICAgICAgICAgICAgYmxpbmtlciA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgY3Vyc29yLnN0eWxlLnZpc2liaWxpdHkgPSAob24gPSAhb24pID8gXCJcIiA6IFwiaGlkZGVuXCI7XHJcbiAgICAgICAgICAgIH0sIDY1MCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgbWF0Y2hpbmcgPSB7XCIoXCI6IFwiKT5cIiwgXCIpXCI6IFwiKDxcIiwgXCJbXCI6IFwiXT5cIiwgXCJdXCI6IFwiWzxcIiwgXCJ7XCI6IFwifT5cIiwgXCJ9XCI6IFwiezxcIn07XHJcbiAgICAgICAgZnVuY3Rpb24gbWF0Y2hCcmFja2V0cyhhdXRvY2xlYXIpIHtcclxuICAgICAgICAgICAgdmFyIGhlYWQgPSBzZWwuaW52ZXJ0ZWQgPyBzZWwuZnJvbSA6IHNlbC50bywgbGluZSA9IGdldExpbmUoaGVhZC5saW5lKSwgcG9zID0gaGVhZC5jaCAtIDE7XHJcbiAgICAgICAgICAgIHZhciBtYXRjaCA9IChwb3MgPj0gMCAmJiBtYXRjaGluZ1tsaW5lLnRleHQuY2hhckF0KHBvcyldKSB8fCBtYXRjaGluZ1tsaW5lLnRleHQuY2hhckF0KCsrcG9zKV07XHJcbiAgICAgICAgICAgIGlmICghbWF0Y2gpIHJldHVybjtcclxuICAgICAgICAgICAgdmFyIGNoID0gbWF0Y2guY2hhckF0KDApLCBmb3J3YXJkID0gbWF0Y2guY2hhckF0KDEpID09IFwiPlwiLCBkID0gZm9yd2FyZCA/IDEgOiAtMSwgc3QgPSBsaW5lLnN0eWxlcztcclxuICAgICAgICAgICAgZm9yICh2YXIgb2ZmID0gcG9zICsgMSwgaSA9IDAsIGUgPSBzdC5sZW5ndGg7IGkgPCBlOyBpKz0yKVxyXG4gICAgICAgICAgICAgICAgaWYgKChvZmYgLT0gc3RbaV0ubGVuZ3RoKSA8PSAwKSB7dmFyIHN0eWxlID0gc3RbaSsxXTsgYnJlYWs7fVxyXG5cclxuICAgICAgICAgICAgdmFyIHN0YWNrID0gW2xpbmUudGV4dC5jaGFyQXQocG9zKV0sIHJlID0gL1soKXt9W1xcXV0vO1xyXG4gICAgICAgICAgICBmdW5jdGlvbiBzY2FuKGxpbmUsIGZyb20sIHRvKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWxpbmUudGV4dCkgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgdmFyIHN0ID0gbGluZS5zdHlsZXMsIHBvcyA9IGZvcndhcmQgPyAwIDogbGluZS50ZXh0Lmxlbmd0aCAtIDEsIGN1cjtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSBmb3J3YXJkID8gMCA6IHN0Lmxlbmd0aCAtIDIsIGUgPSBmb3J3YXJkID8gc3QubGVuZ3RoIDogLTI7IGkgIT0gZTsgaSArPSAyKmQpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdGV4dCA9IHN0W2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzdFtpKzFdICE9IG51bGwgJiYgc3RbaSsxXSAhPSBzdHlsZSkge3BvcyArPSBkICogdGV4dC5sZW5ndGg7IGNvbnRpbnVlO31cclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gZm9yd2FyZCA/IDAgOiB0ZXh0Lmxlbmd0aCAtIDEsIHRlID0gZm9yd2FyZCA/IHRleHQubGVuZ3RoIDogLTE7IGogIT0gdGU7IGogKz0gZCwgcG9zKz1kKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwb3MgPj0gZnJvbSAmJiBwb3MgPCB0byAmJiByZS50ZXN0KGN1ciA9IHRleHQuY2hhckF0KGopKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1hdGNoID0gbWF0Y2hpbmdbY3VyXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtYXRjaC5jaGFyQXQoMSkgPT0gXCI+XCIgPT0gZm9yd2FyZCkgc3RhY2sucHVzaChjdXIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoc3RhY2sucG9wKCkgIT0gbWF0Y2guY2hhckF0KDApKSByZXR1cm4ge3BvczogcG9zLCBtYXRjaDogZmFsc2V9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoIXN0YWNrLmxlbmd0aCkgcmV0dXJuIHtwb3M6IHBvcywgbWF0Y2g6IHRydWV9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBoZWFkLmxpbmUsIGUgPSBmb3J3YXJkID8gTWF0aC5taW4oaSArIDEwMCwgZG9jLnNpemUpIDogTWF0aC5tYXgoLTEsIGkgLSAxMDApOyBpICE9IGU7IGkrPWQpIHtcclxuICAgICAgICAgICAgICAgIHZhciBsaW5lID0gZ2V0TGluZShpKSwgZmlyc3QgPSBpID09IGhlYWQubGluZTtcclxuICAgICAgICAgICAgICAgIHZhciBmb3VuZCA9IHNjYW4obGluZSwgZmlyc3QgJiYgZm9yd2FyZCA/IHBvcyArIDEgOiAwLCBmaXJzdCAmJiAhZm9yd2FyZCA/IHBvcyA6IGxpbmUudGV4dC5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZvdW5kKSBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIWZvdW5kKSBmb3VuZCA9IHtwb3M6IG51bGwsIG1hdGNoOiBmYWxzZX07XHJcbiAgICAgICAgICAgIHZhciBzdHlsZSA9IGZvdW5kLm1hdGNoID8gXCJDb2RlTWlycm9yLW1hdGNoaW5nYnJhY2tldFwiIDogXCJDb2RlTWlycm9yLW5vbm1hdGNoaW5nYnJhY2tldFwiO1xyXG4gICAgICAgICAgICB2YXIgb25lID0gbWFya1RleHQoe2xpbmU6IGhlYWQubGluZSwgY2g6IHBvc30sIHtsaW5lOiBoZWFkLmxpbmUsIGNoOiBwb3MrMX0sIHN0eWxlKSxcclxuICAgICAgICAgICAgICAgIHR3byA9IGZvdW5kLnBvcyAhPSBudWxsICYmIG1hcmtUZXh0KHtsaW5lOiBpLCBjaDogZm91bmQucG9zfSwge2xpbmU6IGksIGNoOiBmb3VuZC5wb3MgKyAxfSwgc3R5bGUpO1xyXG4gICAgICAgICAgICB2YXIgY2xlYXIgPSBvcGVyYXRpb24oZnVuY3Rpb24oKXtvbmUuY2xlYXIoKTsgdHdvICYmIHR3by5jbGVhcigpO30pO1xyXG4gICAgICAgICAgICBpZiAoYXV0b2NsZWFyKSBzZXRUaW1lb3V0KGNsZWFyLCA4MDApO1xyXG4gICAgICAgICAgICBlbHNlIGJyYWNrZXRIaWdobGlnaHRlZCA9IGNsZWFyO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRmluZHMgdGhlIGxpbmUgdG8gc3RhcnQgd2l0aCB3aGVuIHN0YXJ0aW5nIGEgcGFyc2UuIFRyaWVzIHRvXHJcbiAgICAgICAgLy8gZmluZCBhIGxpbmUgd2l0aCBhIHN0YXRlQWZ0ZXIsIHNvIHRoYXQgaXQgY2FuIHN0YXJ0IHdpdGggYVxyXG4gICAgICAgIC8vIHZhbGlkIHN0YXRlLiBJZiB0aGF0IGZhaWxzLCBpdCByZXR1cm5zIHRoZSBsaW5lIHdpdGggdGhlXHJcbiAgICAgICAgLy8gc21hbGxlc3QgaW5kZW50YXRpb24sIHdoaWNoIHRlbmRzIHRvIG5lZWQgdGhlIGxlYXN0IGNvbnRleHQgdG9cclxuICAgICAgICAvLyBwYXJzZSBjb3JyZWN0bHkuXHJcbiAgICAgICAgZnVuY3Rpb24gZmluZFN0YXJ0TGluZShuKSB7XHJcbiAgICAgICAgICAgIHZhciBtaW5pbmRlbnQsIG1pbmxpbmU7XHJcbiAgICAgICAgICAgIGZvciAodmFyIHNlYXJjaCA9IG4sIGxpbSA9IG4gLSA0MDsgc2VhcmNoID4gbGltOyAtLXNlYXJjaCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHNlYXJjaCA9PSAwKSByZXR1cm4gMDtcclxuICAgICAgICAgICAgICAgIHZhciBsaW5lID0gZ2V0TGluZShzZWFyY2gtMSk7XHJcbiAgICAgICAgICAgICAgICBpZiAobGluZS5zdGF0ZUFmdGVyKSByZXR1cm4gc2VhcmNoO1xyXG4gICAgICAgICAgICAgICAgdmFyIGluZGVudGVkID0gbGluZS5pbmRlbnRhdGlvbihvcHRpb25zLnRhYlNpemUpO1xyXG4gICAgICAgICAgICAgICAgaWYgKG1pbmxpbmUgPT0gbnVsbCB8fCBtaW5pbmRlbnQgPiBpbmRlbnRlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG1pbmxpbmUgPSBzZWFyY2ggLSAxO1xyXG4gICAgICAgICAgICAgICAgICAgIG1pbmluZGVudCA9IGluZGVudGVkO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBtaW5saW5lO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBnZXRTdGF0ZUJlZm9yZShuKSB7XHJcbiAgICAgICAgICAgIHZhciBzdGFydCA9IGZpbmRTdGFydExpbmUobiksIHN0YXRlID0gc3RhcnQgJiYgZ2V0TGluZShzdGFydC0xKS5zdGF0ZUFmdGVyO1xyXG4gICAgICAgICAgICBpZiAoIXN0YXRlKSBzdGF0ZSA9IHN0YXJ0U3RhdGUobW9kZSk7XHJcbiAgICAgICAgICAgIGVsc2Ugc3RhdGUgPSBjb3B5U3RhdGUobW9kZSwgc3RhdGUpO1xyXG4gICAgICAgICAgICBkb2MuaXRlcihzdGFydCwgbiwgZnVuY3Rpb24obGluZSkge1xyXG4gICAgICAgICAgICAgICAgbGluZS5oaWdobGlnaHQobW9kZSwgc3RhdGUsIG9wdGlvbnMudGFiU2l6ZSk7XHJcbiAgICAgICAgICAgICAgICBsaW5lLnN0YXRlQWZ0ZXIgPSBjb3B5U3RhdGUobW9kZSwgc3RhdGUpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgaWYgKHN0YXJ0IDwgbikgY2hhbmdlcy5wdXNoKHtmcm9tOiBzdGFydCwgdG86IG59KTtcclxuICAgICAgICAgICAgaWYgKG4gPCBkb2Muc2l6ZSAmJiAhZ2V0TGluZShuKS5zdGF0ZUFmdGVyKSB3b3JrLnB1c2gobik7XHJcbiAgICAgICAgICAgIHJldHVybiBzdGF0ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gaGlnaGxpZ2h0TGluZXMoc3RhcnQsIGVuZCkge1xyXG4gICAgICAgICAgICB2YXIgc3RhdGUgPSBnZXRTdGF0ZUJlZm9yZShzdGFydCk7XHJcbiAgICAgICAgICAgIGRvYy5pdGVyKHN0YXJ0LCBlbmQsIGZ1bmN0aW9uKGxpbmUpIHtcclxuICAgICAgICAgICAgICAgIGxpbmUuaGlnaGxpZ2h0KG1vZGUsIHN0YXRlLCBvcHRpb25zLnRhYlNpemUpO1xyXG4gICAgICAgICAgICAgICAgbGluZS5zdGF0ZUFmdGVyID0gY29weVN0YXRlKG1vZGUsIHN0YXRlKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIGhpZ2hsaWdodFdvcmtlcigpIHtcclxuICAgICAgICAgICAgdmFyIGVuZCA9ICtuZXcgRGF0ZSArIG9wdGlvbnMud29ya1RpbWU7XHJcbiAgICAgICAgICAgIHZhciBmb3VuZFdvcmsgPSB3b3JrLmxlbmd0aDtcclxuICAgICAgICAgICAgd2hpbGUgKHdvcmsubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWdldExpbmUoc2hvd2luZ0Zyb20pLnN0YXRlQWZ0ZXIpIHZhciB0YXNrID0gc2hvd2luZ0Zyb207XHJcbiAgICAgICAgICAgICAgICBlbHNlIHZhciB0YXNrID0gd29yay5wb3AoKTtcclxuICAgICAgICAgICAgICAgIGlmICh0YXNrID49IGRvYy5zaXplKSBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIHZhciBzdGFydCA9IGZpbmRTdGFydExpbmUodGFzayksIHN0YXRlID0gc3RhcnQgJiYgZ2V0TGluZShzdGFydC0xKS5zdGF0ZUFmdGVyO1xyXG4gICAgICAgICAgICAgICAgaWYgKHN0YXRlKSBzdGF0ZSA9IGNvcHlTdGF0ZShtb2RlLCBzdGF0ZSk7XHJcbiAgICAgICAgICAgICAgICBlbHNlIHN0YXRlID0gc3RhcnRTdGF0ZShtb2RlKTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgdW5jaGFuZ2VkID0gMCwgY29tcGFyZSA9IG1vZGUuY29tcGFyZVN0YXRlcywgcmVhbENoYW5nZSA9IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIGkgPSBzdGFydCwgYmFpbCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgZG9jLml0ZXIoaSwgZG9jLnNpemUsIGZ1bmN0aW9uKGxpbmUpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaGFkU3RhdGUgPSBsaW5lLnN0YXRlQWZ0ZXI7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCtuZXcgRGF0ZSA+IGVuZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB3b3JrLnB1c2goaSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0V29ya2VyKG9wdGlvbnMud29ya0RlbGF5KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlYWxDaGFuZ2UpIGNoYW5nZXMucHVzaCh7ZnJvbTogdGFzaywgdG86IGkgKyAxfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoYmFpbCA9IHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB2YXIgY2hhbmdlZCA9IGxpbmUuaGlnaGxpZ2h0KG1vZGUsIHN0YXRlLCBvcHRpb25zLnRhYlNpemUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjaGFuZ2VkKSByZWFsQ2hhbmdlID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICBsaW5lLnN0YXRlQWZ0ZXIgPSBjb3B5U3RhdGUobW9kZSwgc3RhdGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjb21wYXJlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChoYWRTdGF0ZSAmJiBjb21wYXJlKGhhZFN0YXRlLCBzdGF0ZSkpIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjaGFuZ2VkICE9PSBmYWxzZSB8fCAhaGFkU3RhdGUpIHVuY2hhbmdlZCA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCsrdW5jaGFuZ2VkID4gMyAmJiAoIW1vZGUuaW5kZW50IHx8IG1vZGUuaW5kZW50KGhhZFN0YXRlLCBcIlwiKSA9PSBtb2RlLmluZGVudChzdGF0ZSwgXCJcIikpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICsraTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKGJhaWwpIHJldHVybjtcclxuICAgICAgICAgICAgICAgIGlmIChyZWFsQ2hhbmdlKSBjaGFuZ2VzLnB1c2goe2Zyb206IHRhc2ssIHRvOiBpICsgMX0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChmb3VuZFdvcmsgJiYgb3B0aW9ucy5vbkhpZ2hsaWdodENvbXBsZXRlKVxyXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5vbkhpZ2hsaWdodENvbXBsZXRlKGluc3RhbmNlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gc3RhcnRXb3JrZXIodGltZSkge1xyXG4gICAgICAgICAgICBpZiAoIXdvcmsubGVuZ3RoKSByZXR1cm47XHJcbiAgICAgICAgICAgIGhpZ2hsaWdodC5zZXQodGltZSwgb3BlcmF0aW9uKGhpZ2hsaWdodFdvcmtlcikpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gT3BlcmF0aW9ucyBhcmUgdXNlZCB0byB3cmFwIGNoYW5nZXMgaW4gc3VjaCBhIHdheSB0aGF0IGVhY2hcclxuICAgICAgICAvLyBjaGFuZ2Ugd29uJ3QgaGF2ZSB0byB1cGRhdGUgdGhlIGN1cnNvciBhbmQgZGlzcGxheSAod2hpY2ggd291bGRcclxuICAgICAgICAvLyBiZSBhd2t3YXJkLCBzbG93LCBhbmQgZXJyb3ItcHJvbmUpLCBidXQgaW5zdGVhZCB1cGRhdGVzIGFyZVxyXG4gICAgICAgIC8vIGJhdGNoZWQgYW5kIHRoZW4gYWxsIGNvbWJpbmVkIGFuZCBleGVjdXRlZCBhdCBvbmNlLlxyXG4gICAgICAgIGZ1bmN0aW9uIHN0YXJ0T3BlcmF0aW9uKCkge1xyXG4gICAgICAgICAgICB1cGRhdGVJbnB1dCA9IHVzZXJTZWxDaGFuZ2UgPSB0ZXh0Q2hhbmdlZCA9IG51bGw7XHJcbiAgICAgICAgICAgIGNoYW5nZXMgPSBbXTsgc2VsZWN0aW9uQ2hhbmdlZCA9IGZhbHNlOyBjYWxsYmFja3MgPSBbXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gZW5kT3BlcmF0aW9uKCkge1xyXG4gICAgICAgICAgICB2YXIgcmVTY3JvbGwgPSBmYWxzZSwgdXBkYXRlZDtcclxuICAgICAgICAgICAgaWYgKHNlbGVjdGlvbkNoYW5nZWQpIHJlU2Nyb2xsID0gIXNjcm9sbEN1cnNvckludG9WaWV3KCk7XHJcbiAgICAgICAgICAgIGlmIChjaGFuZ2VzLmxlbmd0aCkgdXBkYXRlZCA9IHVwZGF0ZURpc3BsYXkoY2hhbmdlcywgdHJ1ZSk7XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaWYgKHNlbGVjdGlvbkNoYW5nZWQpIHVwZGF0ZUN1cnNvcigpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGd1dHRlckRpcnR5KSB1cGRhdGVHdXR0ZXIoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAocmVTY3JvbGwpIHNjcm9sbEN1cnNvckludG9WaWV3KCk7XHJcbiAgICAgICAgICAgIGlmIChzZWxlY3Rpb25DaGFuZ2VkKSB7c2Nyb2xsRWRpdG9ySW50b1ZpZXcoKTsgcmVzdGFydEJsaW5rKCk7fVxyXG5cclxuICAgICAgICAgICAgaWYgKGZvY3VzZWQgJiYgIWxlYXZlSW5wdXRBbG9uZSAmJlxyXG4gICAgICAgICAgICAgICAgKHVwZGF0ZUlucHV0ID09PSB0cnVlIHx8ICh1cGRhdGVJbnB1dCAhPT0gZmFsc2UgJiYgc2VsZWN0aW9uQ2hhbmdlZCkpKVxyXG4gICAgICAgICAgICAgICAgcmVzZXRJbnB1dCh1c2VyU2VsQ2hhbmdlKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChzZWxlY3Rpb25DaGFuZ2VkICYmIG9wdGlvbnMubWF0Y2hCcmFja2V0cylcclxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQob3BlcmF0aW9uKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChicmFja2V0SGlnaGxpZ2h0ZWQpIHticmFja2V0SGlnaGxpZ2h0ZWQoKTsgYnJhY2tldEhpZ2hsaWdodGVkID0gbnVsbDt9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBvc0VxKHNlbC5mcm9tLCBzZWwudG8pKSBtYXRjaEJyYWNrZXRzKGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIH0pLCAyMCk7XHJcbiAgICAgICAgICAgIHZhciB0YyA9IHRleHRDaGFuZ2VkLCBjYnMgPSBjYWxsYmFja3M7IC8vIHRoZXNlIGNhbiBiZSByZXNldCBieSBjYWxsYmFja3NcclxuICAgICAgICAgICAgaWYgKHNlbGVjdGlvbkNoYW5nZWQgJiYgb3B0aW9ucy5vbkN1cnNvckFjdGl2aXR5KVxyXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5vbkN1cnNvckFjdGl2aXR5KGluc3RhbmNlKTtcclxuICAgICAgICAgICAgaWYgKHRjICYmIG9wdGlvbnMub25DaGFuZ2UgJiYgaW5zdGFuY2UpXHJcbiAgICAgICAgICAgICAgICBvcHRpb25zLm9uQ2hhbmdlKGluc3RhbmNlLCB0Yyk7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2JzLmxlbmd0aDsgKytpKSBjYnNbaV0oaW5zdGFuY2UpO1xyXG4gICAgICAgICAgICBpZiAodXBkYXRlZCAmJiBvcHRpb25zLm9uVXBkYXRlKSBvcHRpb25zLm9uVXBkYXRlKGluc3RhbmNlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIG5lc3RlZE9wZXJhdGlvbiA9IDA7XHJcbiAgICAgICAgZnVuY3Rpb24gb3BlcmF0aW9uKGYpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFuZXN0ZWRPcGVyYXRpb24rKykgc3RhcnRPcGVyYXRpb24oKTtcclxuICAgICAgICAgICAgICAgIHRyeSB7dmFyIHJlc3VsdCA9IGYuYXBwbHkodGhpcywgYXJndW1lbnRzKTt9XHJcbiAgICAgICAgICAgICAgICBmaW5hbGx5IHtpZiAoIS0tbmVzdGVkT3BlcmF0aW9uKSBlbmRPcGVyYXRpb24oKTt9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yICh2YXIgZXh0IGluIGV4dGVuc2lvbnMpXHJcbiAgICAgICAgICAgIGlmIChleHRlbnNpb25zLnByb3BlcnR5SXNFbnVtZXJhYmxlKGV4dCkgJiZcclxuICAgICAgICAgICAgICAgICFpbnN0YW5jZS5wcm9wZXJ0eUlzRW51bWVyYWJsZShleHQpKVxyXG4gICAgICAgICAgICAgICAgaW5zdGFuY2VbZXh0XSA9IGV4dGVuc2lvbnNbZXh0XTtcclxuICAgICAgICByZXR1cm4gaW5zdGFuY2U7XHJcbiAgICB9IC8vIChlbmQgb2YgZnVuY3Rpb24gQ29kZU1pcnJvcilcclxuXHJcbiAgICAvLyBUaGUgZGVmYXVsdCBjb25maWd1cmF0aW9uIG9wdGlvbnMuXHJcbiAgICBDb2RlTWlycm9yLmRlZmF1bHRzID0ge1xyXG4gICAgICAgIHZhbHVlOiBcIlwiLFxyXG4gICAgICAgIG1vZGU6IG51bGwsXHJcbiAgICAgICAgdGhlbWU6IFwiZGVmYXVsdFwiLFxyXG4gICAgICAgIGluZGVudFVuaXQ6IDIsXHJcbiAgICAgICAgaW5kZW50V2l0aFRhYnM6IGZhbHNlLFxyXG4gICAgICAgIHRhYlNpemU6IDQsXHJcbiAgICAgICAga2V5TWFwOiBcImRlZmF1bHRcIixcclxuICAgICAgICBleHRyYUtleXM6IG51bGwsXHJcbiAgICAgICAgZWxlY3RyaWNDaGFyczogdHJ1ZSxcclxuICAgICAgICBvbktleUV2ZW50OiBudWxsLFxyXG4gICAgICAgIGxpbmVXcmFwcGluZzogZmFsc2UsXHJcbiAgICAgICAgbGluZU51bWJlcnM6IGZhbHNlLFxyXG4gICAgICAgIGd1dHRlcjogZmFsc2UsXHJcbiAgICAgICAgZml4ZWRHdXR0ZXI6IGZhbHNlLFxyXG4gICAgICAgIGZpcnN0TGluZU51bWJlcjogMSxcclxuICAgICAgICByZWFkT25seTogZmFsc2UsXHJcbiAgICAgICAgb25DaGFuZ2U6IG51bGwsXHJcbiAgICAgICAgb25DdXJzb3JBY3Rpdml0eTogbnVsbCxcclxuICAgICAgICBvbkd1dHRlckNsaWNrOiBudWxsLFxyXG4gICAgICAgIG9uSGlnaGxpZ2h0Q29tcGxldGU6IG51bGwsXHJcbiAgICAgICAgb25VcGRhdGU6IG51bGwsXHJcbiAgICAgICAgb25Gb2N1czogbnVsbCwgb25CbHVyOiBudWxsLCBvblNjcm9sbDogbnVsbCxcclxuICAgICAgICBtYXRjaEJyYWNrZXRzOiBmYWxzZSxcclxuICAgICAgICB3b3JrVGltZTogMTAwLFxyXG4gICAgICAgIHdvcmtEZWxheTogMjAwLFxyXG4gICAgICAgIHBvbGxJbnRlcnZhbDogMTAwLFxyXG4gICAgICAgIHVuZG9EZXB0aDogNDAsXHJcbiAgICAgICAgdGFiaW5kZXg6IG51bGwsXHJcbiAgICAgICAgZG9jdW1lbnQ6IHdpbmRvdy5kb2N1bWVudFxyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgbWFjID0gL01hYy8udGVzdChuYXZpZ2F0b3IucGxhdGZvcm0pO1xyXG4gICAgdmFyIHdpbiA9IC9XaW4vLnRlc3QobmF2aWdhdG9yLnBsYXRmb3JtKTtcclxuXHJcbiAgICAvLyBLbm93biBtb2RlcywgYnkgbmFtZSBhbmQgYnkgTUlNRVxyXG4gICAgdmFyIG1vZGVzID0ge30sIG1pbWVNb2RlcyA9IHt9O1xyXG4gICAgQ29kZU1pcnJvci5kZWZpbmVNb2RlID0gZnVuY3Rpb24obmFtZSwgbW9kZSkge1xyXG4gICAgICAgIGlmICghQ29kZU1pcnJvci5kZWZhdWx0cy5tb2RlICYmIG5hbWUgIT0gXCJudWxsXCIpIENvZGVNaXJyb3IuZGVmYXVsdHMubW9kZSA9IG5hbWU7XHJcbiAgICAgICAgbW9kZXNbbmFtZV0gPSBtb2RlO1xyXG4gICAgfTtcclxuICAgIENvZGVNaXJyb3IuZGVmaW5lTUlNRSA9IGZ1bmN0aW9uKG1pbWUsIHNwZWMpIHtcclxuICAgICAgICBtaW1lTW9kZXNbbWltZV0gPSBzcGVjO1xyXG4gICAgfTtcclxuICAgIENvZGVNaXJyb3IuZ2V0TW9kZSA9IGZ1bmN0aW9uKG9wdGlvbnMsIHNwZWMpIHtcclxuICAgICAgICBpZiAodHlwZW9mIHNwZWMgPT0gXCJzdHJpbmdcIiAmJiBtaW1lTW9kZXMuaGFzT3duUHJvcGVydHkoc3BlYykpXHJcbiAgICAgICAgICAgIHNwZWMgPSBtaW1lTW9kZXNbc3BlY107XHJcbiAgICAgICAgaWYgKHR5cGVvZiBzcGVjID09IFwic3RyaW5nXCIpXHJcbiAgICAgICAgICAgIHZhciBtbmFtZSA9IHNwZWMsIGNvbmZpZyA9IHt9O1xyXG4gICAgICAgIGVsc2UgaWYgKHNwZWMgIT0gbnVsbClcclxuICAgICAgICAgICAgdmFyIG1uYW1lID0gc3BlYy5uYW1lLCBjb25maWcgPSBzcGVjO1xyXG4gICAgICAgIHZhciBtZmFjdG9yeSA9IG1vZGVzW21uYW1lXTtcclxuICAgICAgICBpZiAoIW1mYWN0b3J5KSB7XHJcbiAgICAgICAgICAgIGlmICh3aW5kb3cuY29uc29sZSkgY29uc29sZS53YXJuKFwiTm8gbW9kZSBcIiArIG1uYW1lICsgXCIgZm91bmQsIGZhbGxpbmcgYmFjayB0byBwbGFpbiB0ZXh0LlwiKTtcclxuICAgICAgICAgICAgcmV0dXJuIENvZGVNaXJyb3IuZ2V0TW9kZShvcHRpb25zLCBcInRleHQvcGxhaW5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBtZmFjdG9yeShvcHRpb25zLCBjb25maWcgfHwge30pO1xyXG4gICAgfTtcclxuICAgIENvZGVNaXJyb3IubGlzdE1vZGVzID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGxpc3QgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBtIGluIG1vZGVzKVxyXG4gICAgICAgICAgICBpZiAobW9kZXMucHJvcGVydHlJc0VudW1lcmFibGUobSkpIGxpc3QucHVzaChtKTtcclxuICAgICAgICByZXR1cm4gbGlzdDtcclxuICAgIH07XHJcbiAgICBDb2RlTWlycm9yLmxpc3RNSU1FcyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBsaXN0ID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgbSBpbiBtaW1lTW9kZXMpXHJcbiAgICAgICAgICAgIGlmIChtaW1lTW9kZXMucHJvcGVydHlJc0VudW1lcmFibGUobSkpIGxpc3QucHVzaCh7bWltZTogbSwgbW9kZTogbWltZU1vZGVzW21dfSk7XHJcbiAgICAgICAgcmV0dXJuIGxpc3Q7XHJcbiAgICB9O1xyXG5cclxuICAgIHZhciBleHRlbnNpb25zID0gQ29kZU1pcnJvci5leHRlbnNpb25zID0ge307XHJcbiAgICBDb2RlTWlycm9yLmRlZmluZUV4dGVuc2lvbiA9IGZ1bmN0aW9uKG5hbWUsIGZ1bmMpIHtcclxuICAgICAgICBleHRlbnNpb25zW25hbWVdID0gZnVuYztcclxuICAgIH07XHJcblxyXG4gICAgdmFyIGNvbW1hbmRzID0gQ29kZU1pcnJvci5jb21tYW5kcyA9IHtcclxuICAgICAgICBzZWxlY3RBbGw6IGZ1bmN0aW9uKGNtKSB7Y20uc2V0U2VsZWN0aW9uKHtsaW5lOiAwLCBjaDogMH0sIHtsaW5lOiBjbS5saW5lQ291bnQoKSAtIDF9KTt9LFxyXG4gICAgICAgIGtpbGxMaW5lOiBmdW5jdGlvbihjbSkge1xyXG4gICAgICAgICAgICB2YXIgZnJvbSA9IGNtLmdldEN1cnNvcih0cnVlKSwgdG8gPSBjbS5nZXRDdXJzb3IoZmFsc2UpLCBzZWwgPSAhcG9zRXEoZnJvbSwgdG8pO1xyXG4gICAgICAgICAgICBpZiAoIXNlbCAmJiBjbS5nZXRMaW5lKGZyb20ubGluZSkubGVuZ3RoID09IGZyb20uY2gpIGNtLnJlcGxhY2VSYW5nZShcIlwiLCBmcm9tLCB7bGluZTogZnJvbS5saW5lICsgMSwgY2g6IDB9KTtcclxuICAgICAgICAgICAgZWxzZSBjbS5yZXBsYWNlUmFuZ2UoXCJcIiwgZnJvbSwgc2VsID8gdG8gOiB7bGluZTogZnJvbS5saW5lfSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBkZWxldGVMaW5lOiBmdW5jdGlvbihjbSkge3ZhciBsID0gY20uZ2V0Q3Vyc29yKCkubGluZTsgY20ucmVwbGFjZVJhbmdlKFwiXCIsIHtsaW5lOiBsLCBjaDogMH0sIHtsaW5lOiBsfSk7fSxcclxuICAgICAgICB1bmRvOiBmdW5jdGlvbihjbSkge2NtLnVuZG8oKTt9LFxyXG4gICAgICAgIHJlZG86IGZ1bmN0aW9uKGNtKSB7Y20ucmVkbygpO30sXHJcbiAgICAgICAgZ29Eb2NTdGFydDogZnVuY3Rpb24oY20pIHtjbS5zZXRDdXJzb3IoMCwgMCwgdHJ1ZSk7fSxcclxuICAgICAgICBnb0RvY0VuZDogZnVuY3Rpb24oY20pIHtjbS5zZXRTZWxlY3Rpb24oe2xpbmU6IGNtLmxpbmVDb3VudCgpIC0gMX0sIG51bGwsIHRydWUpO30sXHJcbiAgICAgICAgZ29MaW5lU3RhcnQ6IGZ1bmN0aW9uKGNtKSB7Y20uc2V0Q3Vyc29yKGNtLmdldEN1cnNvcigpLmxpbmUsIDAsIHRydWUpO30sXHJcbiAgICAgICAgZ29MaW5lU3RhcnRTbWFydDogZnVuY3Rpb24oY20pIHtcclxuICAgICAgICAgICAgdmFyIGN1ciA9IGNtLmdldEN1cnNvcigpO1xyXG4gICAgICAgICAgICB2YXIgdGV4dCA9IGNtLmdldExpbmUoY3VyLmxpbmUpLCBmaXJzdE5vbldTID0gTWF0aC5tYXgoMCwgdGV4dC5zZWFyY2goL1xcUy8pKTtcclxuICAgICAgICAgICAgY20uc2V0Q3Vyc29yKGN1ci5saW5lLCBjdXIuY2ggPD0gZmlyc3ROb25XUyAmJiBjdXIuY2ggPyAwIDogZmlyc3ROb25XUywgdHJ1ZSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBnb0xpbmVFbmQ6IGZ1bmN0aW9uKGNtKSB7Y20uc2V0U2VsZWN0aW9uKHtsaW5lOiBjbS5nZXRDdXJzb3IoKS5saW5lfSwgbnVsbCwgdHJ1ZSk7fSxcclxuICAgICAgICBnb0xpbmVVcDogZnVuY3Rpb24oY20pIHtjbS5tb3ZlVigtMSwgXCJsaW5lXCIpO30sXHJcbiAgICAgICAgZ29MaW5lRG93bjogZnVuY3Rpb24oY20pIHtjbS5tb3ZlVigxLCBcImxpbmVcIik7fSxcclxuICAgICAgICBnb1BhZ2VVcDogZnVuY3Rpb24oY20pIHtjbS5tb3ZlVigtMSwgXCJwYWdlXCIpO30sXHJcbiAgICAgICAgZ29QYWdlRG93bjogZnVuY3Rpb24oY20pIHtjbS5tb3ZlVigxLCBcInBhZ2VcIik7fSxcclxuICAgICAgICBnb0NoYXJMZWZ0OiBmdW5jdGlvbihjbSkge2NtLm1vdmVIKC0xLCBcImNoYXJcIik7fSxcclxuICAgICAgICBnb0NoYXJSaWdodDogZnVuY3Rpb24oY20pIHtjbS5tb3ZlSCgxLCBcImNoYXJcIik7fSxcclxuICAgICAgICBnb0NvbHVtbkxlZnQ6IGZ1bmN0aW9uKGNtKSB7Y20ubW92ZUgoLTEsIFwiY29sdW1uXCIpO30sXHJcbiAgICAgICAgZ29Db2x1bW5SaWdodDogZnVuY3Rpb24oY20pIHtjbS5tb3ZlSCgxLCBcImNvbHVtblwiKTt9LFxyXG4gICAgICAgIGdvV29yZExlZnQ6IGZ1bmN0aW9uKGNtKSB7Y20ubW92ZUgoLTEsIFwid29yZFwiKTt9LFxyXG4gICAgICAgIGdvV29yZFJpZ2h0OiBmdW5jdGlvbihjbSkge2NtLm1vdmVIKDEsIFwid29yZFwiKTt9LFxyXG4gICAgICAgIGRlbENoYXJMZWZ0OiBmdW5jdGlvbihjbSkge2NtLmRlbGV0ZUgoLTEsIFwiY2hhclwiKTt9LFxyXG4gICAgICAgIGRlbENoYXJSaWdodDogZnVuY3Rpb24oY20pIHtjbS5kZWxldGVIKDEsIFwiY2hhclwiKTt9LFxyXG4gICAgICAgIGRlbFdvcmRMZWZ0OiBmdW5jdGlvbihjbSkge2NtLmRlbGV0ZUgoLTEsIFwid29yZFwiKTt9LFxyXG4gICAgICAgIGRlbFdvcmRSaWdodDogZnVuY3Rpb24oY20pIHtjbS5kZWxldGVIKDEsIFwid29yZFwiKTt9LFxyXG4gICAgICAgIGluZGVudEF1dG86IGZ1bmN0aW9uKGNtKSB7Y20uaW5kZW50U2VsZWN0aW9uKFwic21hcnRcIik7fSxcclxuICAgICAgICBpbmRlbnRNb3JlOiBmdW5jdGlvbihjbSkge2NtLmluZGVudFNlbGVjdGlvbihcImFkZFwiKTt9LFxyXG4gICAgICAgIGluZGVudExlc3M6IGZ1bmN0aW9uKGNtKSB7Y20uaW5kZW50U2VsZWN0aW9uKFwic3VidHJhY3RcIik7fSxcclxuICAgICAgICBpbnNlcnRUYWI6IGZ1bmN0aW9uKGNtKSB7Y20ucmVwbGFjZVNlbGVjdGlvbihcIlxcdFwiLCBcImVuZFwiKTt9LFxyXG4gICAgICAgIHRyYW5zcG9zZUNoYXJzOiBmdW5jdGlvbihjbSkge1xyXG4gICAgICAgICAgICB2YXIgY3VyID0gY20uZ2V0Q3Vyc29yKCksIGxpbmUgPSBjbS5nZXRMaW5lKGN1ci5saW5lKTtcclxuICAgICAgICAgICAgaWYgKGN1ci5jaCA+IDAgJiYgY3VyLmNoIDwgbGluZS5sZW5ndGggLSAxKVxyXG4gICAgICAgICAgICAgICAgY20ucmVwbGFjZVJhbmdlKGxpbmUuY2hhckF0KGN1ci5jaCkgKyBsaW5lLmNoYXJBdChjdXIuY2ggLSAxKSxcclxuICAgICAgICAgICAgICAgICAgICB7bGluZTogY3VyLmxpbmUsIGNoOiBjdXIuY2ggLSAxfSwge2xpbmU6IGN1ci5saW5lLCBjaDogY3VyLmNoICsgMX0pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgbmV3bGluZUFuZEluZGVudDogZnVuY3Rpb24oY20pIHtcclxuICAgICAgICAgICAgY20ucmVwbGFjZVNlbGVjdGlvbihcIlxcblwiLCBcImVuZFwiKTtcclxuICAgICAgICAgICAgY20uaW5kZW50TGluZShjbS5nZXRDdXJzb3IoKS5saW5lKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHRvZ2dsZU92ZXJ3cml0ZTogZnVuY3Rpb24oY20pIHtjbS50b2dnbGVPdmVyd3JpdGUoKTt9XHJcbiAgICB9O1xyXG5cclxuICAgIHZhciBrZXlNYXAgPSBDb2RlTWlycm9yLmtleU1hcCA9IHt9O1xyXG4gICAga2V5TWFwLmJhc2ljID0ge1xyXG4gICAgICAgIFwiTGVmdFwiOiBcImdvQ2hhckxlZnRcIiwgXCJSaWdodFwiOiBcImdvQ2hhclJpZ2h0XCIsIFwiVXBcIjogXCJnb0xpbmVVcFwiLCBcIkRvd25cIjogXCJnb0xpbmVEb3duXCIsXHJcbiAgICAgICAgXCJFbmRcIjogXCJnb0xpbmVFbmRcIiwgXCJIb21lXCI6IFwiZ29MaW5lU3RhcnRTbWFydFwiLCBcIlBhZ2VVcFwiOiBcImdvUGFnZVVwXCIsIFwiUGFnZURvd25cIjogXCJnb1BhZ2VEb3duXCIsXHJcbiAgICAgICAgXCJEZWxldGVcIjogXCJkZWxDaGFyUmlnaHRcIiwgXCJCYWNrc3BhY2VcIjogXCJkZWxDaGFyTGVmdFwiLCBcIlRhYlwiOiBcImluZGVudE1vcmVcIiwgXCJTaGlmdC1UYWJcIjogXCJpbmRlbnRMZXNzXCIsXHJcbiAgICAgICAgXCJFbnRlclwiOiBcIm5ld2xpbmVBbmRJbmRlbnRcIiwgXCJJbnNlcnRcIjogXCJ0b2dnbGVPdmVyd3JpdGVcIlxyXG4gICAgfTtcclxuICAgIC8vIE5vdGUgdGhhdCB0aGUgc2F2ZSBhbmQgZmluZC1yZWxhdGVkIGNvbW1hbmRzIGFyZW4ndCBkZWZpbmVkIGJ5XHJcbiAgICAvLyBkZWZhdWx0LiBVbmtub3duIGNvbW1hbmRzIGFyZSBzaW1wbHkgaWdub3JlZC5cclxuICAgIGtleU1hcC5wY0RlZmF1bHQgPSB7XHJcbiAgICAgICAgXCJDdHJsLUFcIjogXCJzZWxlY3RBbGxcIiwgXCJDdHJsLURcIjogXCJkZWxldGVMaW5lXCIsIFwiQ3RybC1aXCI6IFwidW5kb1wiLCBcIlNoaWZ0LUN0cmwtWlwiOiBcInJlZG9cIiwgXCJDdHJsLVlcIjogXCJyZWRvXCIsXHJcbiAgICAgICAgXCJDdHJsLUhvbWVcIjogXCJnb0RvY1N0YXJ0XCIsIFwiQWx0LVVwXCI6IFwiZ29Eb2NTdGFydFwiLCBcIkN0cmwtRW5kXCI6IFwiZ29Eb2NFbmRcIiwgXCJDdHJsLURvd25cIjogXCJnb0RvY0VuZFwiLFxyXG4gICAgICAgIFwiQ3RybC1MZWZ0XCI6IFwiZ29Xb3JkTGVmdFwiLCBcIkN0cmwtUmlnaHRcIjogXCJnb1dvcmRSaWdodFwiLCBcIkFsdC1MZWZ0XCI6IFwiZ29MaW5lU3RhcnRcIiwgXCJBbHQtUmlnaHRcIjogXCJnb0xpbmVFbmRcIixcclxuICAgICAgICBcIkN0cmwtQmFja3NwYWNlXCI6IFwiZGVsV29yZExlZnRcIiwgXCJDdHJsLURlbGV0ZVwiOiBcImRlbFdvcmRSaWdodFwiLCBcIkN0cmwtU1wiOiBcInNhdmVcIiwgXCJDdHJsLUZcIjogXCJmaW5kXCIsXHJcbiAgICAgICAgXCJDdHJsLUdcIjogXCJmaW5kTmV4dFwiLCBcIlNoaWZ0LUN0cmwtR1wiOiBcImZpbmRQcmV2XCIsIFwiU2hpZnQtQ3RybC1GXCI6IFwicmVwbGFjZVwiLCBcIlNoaWZ0LUN0cmwtUlwiOiBcInJlcGxhY2VBbGxcIixcclxuICAgICAgICBmYWxsdGhyb3VnaDogXCJiYXNpY1wiXHJcbiAgICB9O1xyXG4gICAga2V5TWFwLm1hY0RlZmF1bHQgPSB7XHJcbiAgICAgICAgXCJDbWQtQVwiOiBcInNlbGVjdEFsbFwiLCBcIkNtZC1EXCI6IFwiZGVsZXRlTGluZVwiLCBcIkNtZC1aXCI6IFwidW5kb1wiLCBcIlNoaWZ0LUNtZC1aXCI6IFwicmVkb1wiLCBcIkNtZC1ZXCI6IFwicmVkb1wiLFxyXG4gICAgICAgIFwiQ21kLVVwXCI6IFwiZ29Eb2NTdGFydFwiLCBcIkNtZC1FbmRcIjogXCJnb0RvY0VuZFwiLCBcIkNtZC1Eb3duXCI6IFwiZ29Eb2NFbmRcIiwgXCJBbHQtTGVmdFwiOiBcImdvV29yZExlZnRcIixcclxuICAgICAgICBcIkFsdC1SaWdodFwiOiBcImdvV29yZFJpZ2h0XCIsIFwiQ21kLUxlZnRcIjogXCJnb0xpbmVTdGFydFwiLCBcIkNtZC1SaWdodFwiOiBcImdvTGluZUVuZFwiLCBcIkFsdC1CYWNrc3BhY2VcIjogXCJkZWxXb3JkTGVmdFwiLFxyXG4gICAgICAgIFwiQ3RybC1BbHQtQmFja3NwYWNlXCI6IFwiZGVsV29yZFJpZ2h0XCIsIFwiQWx0LURlbGV0ZVwiOiBcImRlbFdvcmRSaWdodFwiLCBcIkNtZC1TXCI6IFwic2F2ZVwiLCBcIkNtZC1GXCI6IFwiZmluZFwiLFxyXG4gICAgICAgIFwiQ21kLUdcIjogXCJmaW5kTmV4dFwiLCBcIlNoaWZ0LUNtZC1HXCI6IFwiZmluZFByZXZcIiwgXCJDbWQtQWx0LUZcIjogXCJyZXBsYWNlXCIsIFwiU2hpZnQtQ21kLUFsdC1GXCI6IFwicmVwbGFjZUFsbFwiLFxyXG4gICAgICAgIGZhbGx0aHJvdWdoOiBbXCJiYXNpY1wiLCBcImVtYWNzeVwiXVxyXG4gICAgfTtcclxuICAgIGtleU1hcFtcImRlZmF1bHRcIl0gPSBtYWMgPyBrZXlNYXAubWFjRGVmYXVsdCA6IGtleU1hcC5wY0RlZmF1bHQ7XHJcbiAgICBrZXlNYXAuZW1hY3N5ID0ge1xyXG4gICAgICAgIFwiQ3RybC1GXCI6IFwiZ29DaGFyUmlnaHRcIiwgXCJDdHJsLUJcIjogXCJnb0NoYXJMZWZ0XCIsIFwiQ3RybC1QXCI6IFwiZ29MaW5lVXBcIiwgXCJDdHJsLU5cIjogXCJnb0xpbmVEb3duXCIsXHJcbiAgICAgICAgXCJBbHQtRlwiOiBcImdvV29yZFJpZ2h0XCIsIFwiQWx0LUJcIjogXCJnb1dvcmRMZWZ0XCIsIFwiQ3RybC1BXCI6IFwiZ29MaW5lU3RhcnRcIiwgXCJDdHJsLUVcIjogXCJnb0xpbmVFbmRcIixcclxuICAgICAgICBcIkN0cmwtVlwiOiBcImdvUGFnZVVwXCIsIFwiU2hpZnQtQ3RybC1WXCI6IFwiZ29QYWdlRG93blwiLCBcIkN0cmwtRFwiOiBcImRlbENoYXJSaWdodFwiLCBcIkN0cmwtSFwiOiBcImRlbENoYXJMZWZ0XCIsXHJcbiAgICAgICAgXCJBbHQtRFwiOiBcImRlbFdvcmRSaWdodFwiLCBcIkFsdC1CYWNrc3BhY2VcIjogXCJkZWxXb3JkTGVmdFwiLCBcIkN0cmwtS1wiOiBcImtpbGxMaW5lXCIsIFwiQ3RybC1UXCI6IFwidHJhbnNwb3NlQ2hhcnNcIlxyXG4gICAgfTtcclxuXHJcbiAgICBmdW5jdGlvbiBsb29rdXBLZXkobmFtZSwgZXh0cmFNYXAsIG1hcCkge1xyXG4gICAgICAgIGZ1bmN0aW9uIGxvb2t1cChuYW1lLCBtYXAsIGZ0KSB7XHJcbiAgICAgICAgICAgIHZhciBmb3VuZCA9IG1hcFtuYW1lXTtcclxuICAgICAgICAgICAgaWYgKGZvdW5kICE9IG51bGwpIHJldHVybiBmb3VuZDtcclxuICAgICAgICAgICAgaWYgKGZ0ID09IG51bGwpIGZ0ID0gbWFwLmZhbGx0aHJvdWdoO1xyXG4gICAgICAgICAgICBpZiAoZnQgPT0gbnVsbCkgcmV0dXJuIG1hcC5jYXRjaGFsbDtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBmdCA9PSBcInN0cmluZ1wiKSByZXR1cm4gbG9va3VwKG5hbWUsIGtleU1hcFtmdF0pO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgZSA9IGZ0Lmxlbmd0aDsgaSA8IGU7ICsraSkge1xyXG4gICAgICAgICAgICAgICAgZm91bmQgPSBsb29rdXAobmFtZSwga2V5TWFwW2Z0W2ldXSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZm91bmQgIT0gbnVsbCkgcmV0dXJuIGZvdW5kO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZXh0cmFNYXAgPyBsb29rdXAobmFtZSwgZXh0cmFNYXAsIG1hcCkgOiBsb29rdXAobmFtZSwga2V5TWFwW21hcF0pO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gaXNNb2RpZmllcktleShldmVudCkge1xyXG4gICAgICAgIHZhciBuYW1lID0ga2V5TmFtZXNbZXZlbnQua2V5Q29kZV07XHJcbiAgICAgICAgcmV0dXJuIG5hbWUgPT0gXCJDdHJsXCIgfHwgbmFtZSA9PSBcIkFsdFwiIHx8IG5hbWUgPT0gXCJTaGlmdFwiIHx8IG5hbWUgPT0gXCJNb2RcIjtcclxuICAgIH1cclxuXHJcbiAgICBDb2RlTWlycm9yLmZyb21UZXh0QXJlYSA9IGZ1bmN0aW9uKHRleHRhcmVhLCBvcHRpb25zKSB7XHJcbiAgICAgICAgaWYgKCFvcHRpb25zKSBvcHRpb25zID0ge307XHJcbiAgICAgICAgb3B0aW9ucy52YWx1ZSA9IHRleHRhcmVhLnZhbHVlO1xyXG4gICAgICAgIGlmICghb3B0aW9ucy50YWJpbmRleCAmJiB0ZXh0YXJlYS50YWJpbmRleClcclxuICAgICAgICAgICAgb3B0aW9ucy50YWJpbmRleCA9IHRleHRhcmVhLnRhYmluZGV4O1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBzYXZlKCkge3RleHRhcmVhLnZhbHVlID0gaW5zdGFuY2UuZ2V0VmFsdWUoKTt9XHJcbiAgICAgICAgaWYgKHRleHRhcmVhLmZvcm0pIHtcclxuICAgICAgICAgICAgLy8gRGVwbG9yYWJsZSBoYWNrIHRvIG1ha2UgdGhlIHN1Ym1pdCBtZXRob2QgZG8gdGhlIHJpZ2h0IHRoaW5nLlxyXG4gICAgICAgICAgICB2YXIgcm1TdWJtaXQgPSBjb25uZWN0KHRleHRhcmVhLmZvcm0sIFwic3VibWl0XCIsIHNhdmUsIHRydWUpO1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHRleHRhcmVhLmZvcm0uc3VibWl0ID09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlYWxTdWJtaXQgPSB0ZXh0YXJlYS5mb3JtLnN1Ym1pdDtcclxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHdyYXBwZWRTdWJtaXQoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2F2ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRleHRhcmVhLmZvcm0uc3VibWl0ID0gcmVhbFN1Ym1pdDtcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0YXJlYS5mb3JtLnN1Ym1pdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRleHRhcmVhLmZvcm0uc3VibWl0ID0gd3JhcHBlZFN1Ym1pdDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRleHRhcmVhLmZvcm0uc3VibWl0ID0gd3JhcHBlZFN1Ym1pdDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGV4dGFyZWEuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG4gICAgICAgIHZhciBpbnN0YW5jZSA9IENvZGVNaXJyb3IoZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICAgICAgICB0ZXh0YXJlYS5wYXJlbnROb2RlLmluc2VydEJlZm9yZShub2RlLCB0ZXh0YXJlYS5uZXh0U2libGluZyk7XHJcbiAgICAgICAgfSwgb3B0aW9ucyk7XHJcbiAgICAgICAgaW5zdGFuY2Uuc2F2ZSA9IHNhdmU7XHJcbiAgICAgICAgaW5zdGFuY2UuZ2V0VGV4dEFyZWEgPSBmdW5jdGlvbigpIHsgcmV0dXJuIHRleHRhcmVhOyB9O1xyXG4gICAgICAgIGluc3RhbmNlLnRvVGV4dEFyZWEgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgc2F2ZSgpO1xyXG4gICAgICAgICAgICB0ZXh0YXJlYS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGluc3RhbmNlLmdldFdyYXBwZXJFbGVtZW50KCkpO1xyXG4gICAgICAgICAgICB0ZXh0YXJlYS5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcclxuICAgICAgICAgICAgaWYgKHRleHRhcmVhLmZvcm0pIHtcclxuICAgICAgICAgICAgICAgIHJtU3VibWl0KCk7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHRleHRhcmVhLmZvcm0uc3VibWl0ID09IFwiZnVuY3Rpb25cIilcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0YXJlYS5mb3JtLnN1Ym1pdCA9IHJlYWxTdWJtaXQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiBpbnN0YW5jZTtcclxuICAgIH07XHJcblxyXG4gICAgLy8gVXRpbGl0eSBmdW5jdGlvbnMgZm9yIHdvcmtpbmcgd2l0aCBzdGF0ZS4gRXhwb3J0ZWQgYmVjYXVzZSBtb2Rlc1xyXG4gICAgLy8gc29tZXRpbWVzIG5lZWQgdG8gZG8gdGhpcy5cclxuICAgIGZ1bmN0aW9uIGNvcHlTdGF0ZShtb2RlLCBzdGF0ZSkge1xyXG4gICAgICAgIGlmIChzdGF0ZSA9PT0gdHJ1ZSkgcmV0dXJuIHN0YXRlO1xyXG4gICAgICAgIGlmIChtb2RlLmNvcHlTdGF0ZSkgcmV0dXJuIG1vZGUuY29weVN0YXRlKHN0YXRlKTtcclxuICAgICAgICB2YXIgbnN0YXRlID0ge307XHJcbiAgICAgICAgZm9yICh2YXIgbiBpbiBzdGF0ZSkge1xyXG4gICAgICAgICAgICB2YXIgdmFsID0gc3RhdGVbbl07XHJcbiAgICAgICAgICAgIGlmICh2YWwgaW5zdGFuY2VvZiBBcnJheSkgdmFsID0gdmFsLmNvbmNhdChbXSk7XHJcbiAgICAgICAgICAgIG5zdGF0ZVtuXSA9IHZhbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG5zdGF0ZTtcclxuICAgIH1cclxuICAgIENvZGVNaXJyb3IuY29weVN0YXRlID0gY29weVN0YXRlO1xyXG4gICAgZnVuY3Rpb24gc3RhcnRTdGF0ZShtb2RlLCBhMSwgYTIpIHtcclxuICAgICAgICByZXR1cm4gbW9kZS5zdGFydFN0YXRlID8gbW9kZS5zdGFydFN0YXRlKGExLCBhMikgOiB0cnVlO1xyXG4gICAgfVxyXG4gICAgQ29kZU1pcnJvci5zdGFydFN0YXRlID0gc3RhcnRTdGF0ZTtcclxuXHJcbiAgICAvLyBUaGUgY2hhcmFjdGVyIHN0cmVhbSB1c2VkIGJ5IGEgbW9kZSdzIHBhcnNlci5cclxuICAgIGZ1bmN0aW9uIFN0cmluZ1N0cmVhbShzdHJpbmcsIHRhYlNpemUpIHtcclxuICAgICAgICB0aGlzLnBvcyA9IHRoaXMuc3RhcnQgPSAwO1xyXG4gICAgICAgIHRoaXMuc3RyaW5nID0gc3RyaW5nO1xyXG4gICAgICAgIHRoaXMudGFiU2l6ZSA9IHRhYlNpemUgfHwgODtcclxuICAgIH1cclxuICAgIFN0cmluZ1N0cmVhbS5wcm90b3R5cGUgPSB7XHJcbiAgICAgICAgZW9sOiBmdW5jdGlvbigpIHtyZXR1cm4gdGhpcy5wb3MgPj0gdGhpcy5zdHJpbmcubGVuZ3RoO30sXHJcbiAgICAgICAgc29sOiBmdW5jdGlvbigpIHtyZXR1cm4gdGhpcy5wb3MgPT0gMDt9LFxyXG4gICAgICAgIHBlZWs6IGZ1bmN0aW9uKCkge3JldHVybiB0aGlzLnN0cmluZy5jaGFyQXQodGhpcy5wb3MpO30sXHJcbiAgICAgICAgbmV4dDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnBvcyA8IHRoaXMuc3RyaW5nLmxlbmd0aClcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnN0cmluZy5jaGFyQXQodGhpcy5wb3MrKyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlYXQ6IGZ1bmN0aW9uKG1hdGNoKSB7XHJcbiAgICAgICAgICAgIHZhciBjaCA9IHRoaXMuc3RyaW5nLmNoYXJBdCh0aGlzLnBvcyk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgbWF0Y2ggPT0gXCJzdHJpbmdcIikgdmFyIG9rID0gY2ggPT0gbWF0Y2g7XHJcbiAgICAgICAgICAgIGVsc2UgdmFyIG9rID0gY2ggJiYgKG1hdGNoLnRlc3QgPyBtYXRjaC50ZXN0KGNoKSA6IG1hdGNoKGNoKSk7XHJcbiAgICAgICAgICAgIGlmIChvaykgeysrdGhpcy5wb3M7IHJldHVybiBjaDt9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlYXRXaGlsZTogZnVuY3Rpb24obWF0Y2gpIHtcclxuICAgICAgICAgICAgdmFyIHN0YXJ0ID0gdGhpcy5wb3M7XHJcbiAgICAgICAgICAgIHdoaWxlICh0aGlzLmVhdChtYXRjaCkpe31cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucG9zID4gc3RhcnQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlYXRTcGFjZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHZhciBzdGFydCA9IHRoaXMucG9zO1xyXG4gICAgICAgICAgICB3aGlsZSAoL1tcXHNcXHUwMGEwXS8udGVzdCh0aGlzLnN0cmluZy5jaGFyQXQodGhpcy5wb3MpKSkgKyt0aGlzLnBvcztcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucG9zID4gc3RhcnQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBza2lwVG9FbmQ6IGZ1bmN0aW9uKCkge3RoaXMucG9zID0gdGhpcy5zdHJpbmcubGVuZ3RoO30sXHJcbiAgICAgICAgc2tpcFRvOiBmdW5jdGlvbihjaCkge1xyXG4gICAgICAgICAgICB2YXIgZm91bmQgPSB0aGlzLnN0cmluZy5pbmRleE9mKGNoLCB0aGlzLnBvcyk7XHJcbiAgICAgICAgICAgIGlmIChmb3VuZCA+IC0xKSB7dGhpcy5wb3MgPSBmb3VuZDsgcmV0dXJuIHRydWU7fVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYmFja1VwOiBmdW5jdGlvbihuKSB7dGhpcy5wb3MgLT0gbjt9LFxyXG4gICAgICAgIGNvbHVtbjogZnVuY3Rpb24oKSB7cmV0dXJuIGNvdW50Q29sdW1uKHRoaXMuc3RyaW5nLCB0aGlzLnN0YXJ0LCB0aGlzLnRhYlNpemUpO30sXHJcbiAgICAgICAgaW5kZW50YXRpb246IGZ1bmN0aW9uKCkge3JldHVybiBjb3VudENvbHVtbih0aGlzLnN0cmluZywgbnVsbCwgdGhpcy50YWJTaXplKTt9LFxyXG4gICAgICAgIG1hdGNoOiBmdW5jdGlvbihwYXR0ZXJuLCBjb25zdW1lLCBjYXNlSW5zZW5zaXRpdmUpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBwYXR0ZXJuID09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGNhc2VkKHN0cikge3JldHVybiBjYXNlSW5zZW5zaXRpdmUgPyBzdHIudG9Mb3dlckNhc2UoKSA6IHN0cjt9XHJcbiAgICAgICAgICAgICAgICBpZiAoY2FzZWQodGhpcy5zdHJpbmcpLmluZGV4T2YoY2FzZWQocGF0dGVybiksIHRoaXMucG9zKSA9PSB0aGlzLnBvcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjb25zdW1lICE9PSBmYWxzZSkgdGhpcy5wb3MgKz0gcGF0dGVybi5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbWF0Y2ggPSB0aGlzLnN0cmluZy5zbGljZSh0aGlzLnBvcykubWF0Y2gocGF0dGVybik7XHJcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2ggJiYgY29uc3VtZSAhPT0gZmFsc2UpIHRoaXMucG9zICs9IG1hdGNoWzBdLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIHJldHVybiBtYXRjaDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY3VycmVudDogZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5zdHJpbmcuc2xpY2UodGhpcy5zdGFydCwgdGhpcy5wb3MpO31cclxuICAgIH07XHJcbiAgICBDb2RlTWlycm9yLlN0cmluZ1N0cmVhbSA9IFN0cmluZ1N0cmVhbTtcclxuXHJcbiAgICBmdW5jdGlvbiBNYXJrZWRUZXh0KGZyb20sIHRvLCBjbGFzc05hbWUsIHNldCkge1xyXG4gICAgICAgIHRoaXMuZnJvbSA9IGZyb207IHRoaXMudG8gPSB0bzsgdGhpcy5zdHlsZSA9IGNsYXNzTmFtZTsgdGhpcy5zZXQgPSBzZXQ7XHJcbiAgICB9XHJcbiAgICBNYXJrZWRUZXh0LnByb3RvdHlwZSA9IHtcclxuICAgICAgICBhdHRhY2g6IGZ1bmN0aW9uKGxpbmUpIHsgdGhpcy5zZXQucHVzaChsaW5lKTsgfSxcclxuICAgICAgICBkZXRhY2g6IGZ1bmN0aW9uKGxpbmUpIHtcclxuICAgICAgICAgICAgdmFyIGl4ID0gaW5kZXhPZih0aGlzLnNldCwgbGluZSk7XHJcbiAgICAgICAgICAgIGlmIChpeCA+IC0xKSB0aGlzLnNldC5zcGxpY2UoaXgsIDEpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc3BsaXQ6IGZ1bmN0aW9uKHBvcywgbGVuQmVmb3JlKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnRvIDw9IHBvcyAmJiB0aGlzLnRvICE9IG51bGwpIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICB2YXIgZnJvbSA9IHRoaXMuZnJvbSA8IHBvcyB8fCB0aGlzLmZyb20gPT0gbnVsbCA/IG51bGwgOiB0aGlzLmZyb20gLSBwb3MgKyBsZW5CZWZvcmU7XHJcbiAgICAgICAgICAgIHZhciB0byA9IHRoaXMudG8gPT0gbnVsbCA/IG51bGwgOiB0aGlzLnRvIC0gcG9zICsgbGVuQmVmb3JlO1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IE1hcmtlZFRleHQoZnJvbSwgdG8sIHRoaXMuc3R5bGUsIHRoaXMuc2V0KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGR1cDogZnVuY3Rpb24oKSB7IHJldHVybiBuZXcgTWFya2VkVGV4dChudWxsLCBudWxsLCB0aGlzLnN0eWxlLCB0aGlzLnNldCk7IH0sXHJcbiAgICAgICAgY2xpcFRvOiBmdW5jdGlvbihmcm9tT3BlbiwgZnJvbSwgdG9PcGVuLCB0bywgZGlmZikge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5mcm9tICE9IG51bGwgJiYgdGhpcy5mcm9tID49IGZyb20pXHJcbiAgICAgICAgICAgICAgICB0aGlzLmZyb20gPSBNYXRoLm1heCh0bywgdGhpcy5mcm9tKSArIGRpZmY7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnRvICE9IG51bGwgJiYgdGhpcy50byA+IGZyb20pXHJcbiAgICAgICAgICAgICAgICB0aGlzLnRvID0gdG8gPCB0aGlzLnRvID8gdGhpcy50byArIGRpZmYgOiBmcm9tO1xyXG4gICAgICAgICAgICBpZiAoZnJvbU9wZW4gJiYgdG8gPiB0aGlzLmZyb20gJiYgKHRvIDwgdGhpcy50byB8fCB0aGlzLnRvID09IG51bGwpKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5mcm9tID0gbnVsbDtcclxuICAgICAgICAgICAgaWYgKHRvT3BlbiAmJiAoZnJvbSA8IHRoaXMudG8gfHwgdGhpcy50byA9PSBudWxsKSAmJiAoZnJvbSA+IHRoaXMuZnJvbSB8fCB0aGlzLmZyb20gPT0gbnVsbCkpXHJcbiAgICAgICAgICAgICAgICB0aGlzLnRvID0gbnVsbDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGlzRGVhZDogZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLmZyb20gIT0gbnVsbCAmJiB0aGlzLnRvICE9IG51bGwgJiYgdGhpcy5mcm9tID49IHRoaXMudG87IH0sXHJcbiAgICAgICAgc2FtZVNldDogZnVuY3Rpb24oeCkgeyByZXR1cm4gdGhpcy5zZXQgPT0geC5zZXQ7IH1cclxuICAgIH07XHJcblxyXG4gICAgZnVuY3Rpb24gQm9va21hcmsocG9zKSB7XHJcbiAgICAgICAgdGhpcy5mcm9tID0gcG9zOyB0aGlzLnRvID0gcG9zOyB0aGlzLmxpbmUgPSBudWxsO1xyXG4gICAgfVxyXG4gICAgQm9va21hcmsucHJvdG90eXBlID0ge1xyXG4gICAgICAgIGF0dGFjaDogZnVuY3Rpb24obGluZSkgeyB0aGlzLmxpbmUgPSBsaW5lOyB9LFxyXG4gICAgICAgIGRldGFjaDogZnVuY3Rpb24obGluZSkgeyBpZiAodGhpcy5saW5lID09IGxpbmUpIHRoaXMubGluZSA9IG51bGw7IH0sXHJcbiAgICAgICAgc3BsaXQ6IGZ1bmN0aW9uKHBvcywgbGVuQmVmb3JlKSB7XHJcbiAgICAgICAgICAgIGlmIChwb3MgPCB0aGlzLmZyb20pIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZnJvbSA9IHRoaXMudG8gPSAodGhpcy5mcm9tIC0gcG9zKSArIGxlbkJlZm9yZTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBpc0RlYWQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5mcm9tID4gdGhpcy50bzsgfSxcclxuICAgICAgICBjbGlwVG86IGZ1bmN0aW9uKGZyb21PcGVuLCBmcm9tLCB0b09wZW4sIHRvLCBkaWZmKSB7XHJcbiAgICAgICAgICAgIGlmICgoZnJvbU9wZW4gfHwgZnJvbSA8IHRoaXMuZnJvbSkgJiYgKHRvT3BlbiB8fCB0byA+IHRoaXMudG8pKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZyb20gPSAwOyB0aGlzLnRvID0gLTE7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5mcm9tID4gZnJvbSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5mcm9tID0gdGhpcy50byA9IE1hdGgubWF4KHRvLCB0aGlzLmZyb20pICsgZGlmZjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2FtZVNldDogZnVuY3Rpb24oeCkgeyByZXR1cm4gZmFsc2U7IH0sXHJcbiAgICAgICAgZmluZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5saW5lIHx8ICF0aGlzLmxpbmUucGFyZW50KSByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgcmV0dXJuIHtsaW5lOiBsaW5lTm8odGhpcy5saW5lKSwgY2g6IHRoaXMuZnJvbX07XHJcbiAgICAgICAgfSxcclxuICAgICAgICBjbGVhcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmxpbmUpIHtcclxuICAgICAgICAgICAgICAgIHZhciBmb3VuZCA9IGluZGV4T2YodGhpcy5saW5lLm1hcmtlZCwgdGhpcyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZm91bmQgIT0gLTEpIHRoaXMubGluZS5tYXJrZWQuc3BsaWNlKGZvdW5kLCAxKTtcclxuICAgICAgICAgICAgICAgIHRoaXMubGluZSA9IG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIExpbmUgb2JqZWN0cy4gVGhlc2UgaG9sZCBzdGF0ZSByZWxhdGVkIHRvIGEgbGluZSwgaW5jbHVkaW5nXHJcbiAgICAvLyBoaWdobGlnaHRpbmcgaW5mbyAodGhlIHN0eWxlcyBhcnJheSkuXHJcbiAgICBmdW5jdGlvbiBMaW5lKHRleHQsIHN0eWxlcykge1xyXG4gICAgICAgIHRoaXMuc3R5bGVzID0gc3R5bGVzIHx8IFt0ZXh0LCBudWxsXTtcclxuICAgICAgICB0aGlzLnRleHQgPSB0ZXh0O1xyXG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gMTtcclxuICAgICAgICB0aGlzLm1hcmtlZCA9IHRoaXMuZ3V0dGVyTWFya2VyID0gdGhpcy5jbGFzc05hbWUgPSB0aGlzLmhhbmRsZXJzID0gbnVsbDtcclxuICAgICAgICB0aGlzLnN0YXRlQWZ0ZXIgPSB0aGlzLnBhcmVudCA9IHRoaXMuaGlkZGVuID0gbnVsbDtcclxuICAgIH1cclxuICAgIExpbmUuaW5oZXJpdE1hcmtzID0gZnVuY3Rpb24odGV4dCwgb3JpZykge1xyXG4gICAgICAgIHZhciBsbiA9IG5ldyBMaW5lKHRleHQpLCBtayA9IG9yaWcgJiYgb3JpZy5tYXJrZWQ7XHJcbiAgICAgICAgaWYgKG1rKSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbWsubGVuZ3RoOyArK2kpIHtcclxuICAgICAgICAgICAgICAgIGlmIChta1tpXS50byA9PSBudWxsICYmIG1rW2ldLnN0eWxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5ld21rID0gbG4ubWFya2VkIHx8IChsbi5tYXJrZWQgPSBbXSksIG1hcmsgPSBta1tpXTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbm1hcmsgPSBtYXJrLmR1cCgpOyBuZXdtay5wdXNoKG5tYXJrKTsgbm1hcmsuYXR0YWNoKGxuKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbG47XHJcbiAgICB9XHJcbiAgICBMaW5lLnByb3RvdHlwZSA9IHtcclxuICAgICAgICAvLyBSZXBsYWNlIGEgcGllY2Ugb2YgYSBsaW5lLCBrZWVwaW5nIHRoZSBzdHlsZXMgYXJvdW5kIGl0IGludGFjdC5cclxuICAgICAgICByZXBsYWNlOiBmdW5jdGlvbihmcm9tLCB0b18sIHRleHQpIHtcclxuICAgICAgICAgICAgdmFyIHN0ID0gW10sIG1rID0gdGhpcy5tYXJrZWQsIHRvID0gdG9fID09IG51bGwgPyB0aGlzLnRleHQubGVuZ3RoIDogdG9fO1xyXG4gICAgICAgICAgICBjb3B5U3R5bGVzKDAsIGZyb20sIHRoaXMuc3R5bGVzLCBzdCk7XHJcbiAgICAgICAgICAgIGlmICh0ZXh0KSBzdC5wdXNoKHRleHQsIG51bGwpO1xyXG4gICAgICAgICAgICBjb3B5U3R5bGVzKHRvLCB0aGlzLnRleHQubGVuZ3RoLCB0aGlzLnN0eWxlcywgc3QpO1xyXG4gICAgICAgICAgICB0aGlzLnN0eWxlcyA9IHN0O1xyXG4gICAgICAgICAgICB0aGlzLnRleHQgPSB0aGlzLnRleHQuc2xpY2UoMCwgZnJvbSkgKyB0ZXh0ICsgdGhpcy50ZXh0LnNsaWNlKHRvKTtcclxuICAgICAgICAgICAgdGhpcy5zdGF0ZUFmdGVyID0gbnVsbDtcclxuICAgICAgICAgICAgaWYgKG1rKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZGlmZiA9IHRleHQubGVuZ3RoIC0gKHRvIC0gZnJvbSk7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbWFyayA9IG1rW2ldOyBpIDwgbWsubGVuZ3RoOyArK2kpIHtcclxuICAgICAgICAgICAgICAgICAgICBtYXJrLmNsaXBUbyhmcm9tID09IG51bGwsIGZyb20gfHwgMCwgdG9fID09IG51bGwsIHRvLCBkaWZmKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobWFyay5pc0RlYWQoKSkge21hcmsuZGV0YWNoKHRoaXMpOyBtay5zcGxpY2UoaS0tLCAxKTt9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIC8vIFNwbGl0IGEgcGFydCBvZmYgYSBsaW5lLCBrZWVwaW5nIHN0eWxlcyBhbmQgbWFya2VycyBpbnRhY3QuXHJcbiAgICAgICAgc3BsaXQ6IGZ1bmN0aW9uKHBvcywgdGV4dEJlZm9yZSkge1xyXG4gICAgICAgICAgICB2YXIgc3QgPSBbdGV4dEJlZm9yZSwgbnVsbF0sIG1rID0gdGhpcy5tYXJrZWQ7XHJcbiAgICAgICAgICAgIGNvcHlTdHlsZXMocG9zLCB0aGlzLnRleHQubGVuZ3RoLCB0aGlzLnN0eWxlcywgc3QpO1xyXG4gICAgICAgICAgICB2YXIgdGFrZW4gPSBuZXcgTGluZSh0ZXh0QmVmb3JlICsgdGhpcy50ZXh0LnNsaWNlKHBvcyksIHN0KTtcclxuICAgICAgICAgICAgaWYgKG1rKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1rLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1hcmsgPSBta1tpXTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3bWFyayA9IG1hcmsuc3BsaXQocG9zLCB0ZXh0QmVmb3JlLmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5ld21hcmspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0YWtlbi5tYXJrZWQpIHRha2VuLm1hcmtlZCA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0YWtlbi5tYXJrZWQucHVzaChuZXdtYXJrKTsgbmV3bWFyay5hdHRhY2godGFrZW4pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdGFrZW47XHJcbiAgICAgICAgfSxcclxuICAgICAgICBhcHBlbmQ6IGZ1bmN0aW9uKGxpbmUpIHtcclxuICAgICAgICAgICAgdmFyIG15bGVuID0gdGhpcy50ZXh0Lmxlbmd0aCwgbWsgPSBsaW5lLm1hcmtlZCwgbXltayA9IHRoaXMubWFya2VkO1xyXG4gICAgICAgICAgICB0aGlzLnRleHQgKz0gbGluZS50ZXh0O1xyXG4gICAgICAgICAgICBjb3B5U3R5bGVzKDAsIGxpbmUudGV4dC5sZW5ndGgsIGxpbmUuc3R5bGVzLCB0aGlzLnN0eWxlcyk7XHJcbiAgICAgICAgICAgIGlmIChteW1rKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG15bWsubGVuZ3RoOyArK2kpXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG15bWtbaV0udG8gPT0gbnVsbCkgbXlta1tpXS50byA9IG15bGVuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChtayAmJiBtay5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIGlmICghbXltaykgdGhpcy5tYXJrZWQgPSBteW1rID0gW107XHJcbiAgICAgICAgICAgICAgICBvdXRlcjogZm9yICh2YXIgaSA9IDA7IGkgPCBtay5sZW5ndGg7ICsraSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBtYXJrID0gbWtbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFtYXJrLmZyb20pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBteW1rLmxlbmd0aDsgKytqKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbXltYXJrID0gbXlta1tqXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChteW1hcmsudG8gPT0gbXlsZW4gJiYgbXltYXJrLnNhbWVTZXQobWFyaykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBteW1hcmsudG8gPSBtYXJrLnRvID09IG51bGwgPyBudWxsIDogbWFyay50byArIG15bGVuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChteW1hcmsuaXNEZWFkKCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbXltYXJrLmRldGFjaCh0aGlzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWsuc3BsaWNlKGktLSwgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlIG91dGVyO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIG15bWsucHVzaChtYXJrKTtcclxuICAgICAgICAgICAgICAgICAgICBtYXJrLmF0dGFjaCh0aGlzKTtcclxuICAgICAgICAgICAgICAgICAgICBtYXJrLmZyb20gKz0gbXlsZW47XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1hcmsudG8gIT0gbnVsbCkgbWFyay50byArPSBteWxlbjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZml4TWFya0VuZHM6IGZ1bmN0aW9uKG90aGVyKSB7XHJcbiAgICAgICAgICAgIHZhciBtayA9IHRoaXMubWFya2VkLCBvbWsgPSBvdGhlci5tYXJrZWQ7XHJcbiAgICAgICAgICAgIGlmICghbWspIHJldHVybjtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtay5sZW5ndGg7ICsraSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIG1hcmsgPSBta1tpXSwgY2xvc2UgPSBtYXJrLnRvID09IG51bGw7XHJcbiAgICAgICAgICAgICAgICBpZiAoY2xvc2UgJiYgb21rKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBvbWsubGVuZ3RoOyArK2opXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvbWtbal0uc2FtZVNldChtYXJrKSkge2Nsb3NlID0gZmFsc2U7IGJyZWFrO31cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChjbG9zZSkgbWFyay50byA9IHRoaXMudGV4dC5sZW5ndGg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIGZpeE1hcmtTdGFydHM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB2YXIgbWsgPSB0aGlzLm1hcmtlZDtcclxuICAgICAgICAgICAgaWYgKCFtaykgcmV0dXJuO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1rLmxlbmd0aDsgKytpKVxyXG4gICAgICAgICAgICAgICAgaWYgKG1rW2ldLmZyb20gPT0gbnVsbCkgbWtbaV0uZnJvbSA9IDA7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBhZGRNYXJrOiBmdW5jdGlvbihtYXJrKSB7XHJcbiAgICAgICAgICAgIG1hcmsuYXR0YWNoKHRoaXMpO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5tYXJrZWQgPT0gbnVsbCkgdGhpcy5tYXJrZWQgPSBbXTtcclxuICAgICAgICAgICAgdGhpcy5tYXJrZWQucHVzaChtYXJrKTtcclxuICAgICAgICAgICAgdGhpcy5tYXJrZWQuc29ydChmdW5jdGlvbihhLCBiKXtyZXR1cm4gKGEuZnJvbSB8fCAwKSAtIChiLmZyb20gfHwgMCk7fSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAvLyBSdW4gdGhlIGdpdmVuIG1vZGUncyBwYXJzZXIgb3ZlciBhIGxpbmUsIHVwZGF0ZSB0aGUgc3R5bGVzXHJcbiAgICAgICAgLy8gYXJyYXksIHdoaWNoIGNvbnRhaW5zIGFsdGVybmF0aW5nIGZyYWdtZW50cyBvZiB0ZXh0IGFuZCBDU1NcclxuICAgICAgICAvLyBjbGFzc2VzLlxyXG4gICAgICAgIGhpZ2hsaWdodDogZnVuY3Rpb24obW9kZSwgc3RhdGUsIHRhYlNpemUpIHtcclxuICAgICAgICAgICAgdmFyIHN0cmVhbSA9IG5ldyBTdHJpbmdTdHJlYW0odGhpcy50ZXh0LCB0YWJTaXplKSwgc3QgPSB0aGlzLnN0eWxlcywgcG9zID0gMDtcclxuICAgICAgICAgICAgdmFyIGNoYW5nZWQgPSBmYWxzZSwgY3VyV29yZCA9IHN0WzBdLCBwcmV2V29yZDtcclxuICAgICAgICAgICAgaWYgKHRoaXMudGV4dCA9PSBcIlwiICYmIG1vZGUuYmxhbmtMaW5lKSBtb2RlLmJsYW5rTGluZShzdGF0ZSk7XHJcbiAgICAgICAgICAgIHdoaWxlICghc3RyZWFtLmVvbCgpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3R5bGUgPSBtb2RlLnRva2VuKHN0cmVhbSwgc3RhdGUpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHN1YnN0ciA9IHRoaXMudGV4dC5zbGljZShzdHJlYW0uc3RhcnQsIHN0cmVhbS5wb3MpO1xyXG4gICAgICAgICAgICAgICAgc3RyZWFtLnN0YXJ0ID0gc3RyZWFtLnBvcztcclxuICAgICAgICAgICAgICAgIGlmIChwb3MgJiYgc3RbcG9zLTFdID09IHN0eWxlKVxyXG4gICAgICAgICAgICAgICAgICAgIHN0W3Bvcy0yXSArPSBzdWJzdHI7XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChzdWJzdHIpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWNoYW5nZWQgJiYgKHN0W3BvcysxXSAhPSBzdHlsZSB8fCAocG9zICYmIHN0W3Bvcy0yXSAhPSBwcmV2V29yZCkpKSBjaGFuZ2VkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICBzdFtwb3MrK10gPSBzdWJzdHI7IHN0W3BvcysrXSA9IHN0eWxlO1xyXG4gICAgICAgICAgICAgICAgICAgIHByZXZXb3JkID0gY3VyV29yZDsgY3VyV29yZCA9IHN0W3Bvc107XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyBHaXZlIHVwIHdoZW4gbGluZSBpcyByaWRpY3Vsb3VzbHkgbG9uZ1xyXG4gICAgICAgICAgICAgICAgaWYgKHN0cmVhbS5wb3MgPiA1MDAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RbcG9zKytdID0gdGhpcy50ZXh0LnNsaWNlKHN0cmVhbS5wb3MpOyBzdFtwb3MrK10gPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChzdC5sZW5ndGggIT0gcG9zKSB7c3QubGVuZ3RoID0gcG9zOyBjaGFuZ2VkID0gdHJ1ZTt9XHJcbiAgICAgICAgICAgIGlmIChwb3MgJiYgc3RbcG9zLTJdICE9IHByZXZXb3JkKSBjaGFuZ2VkID0gdHJ1ZTtcclxuICAgICAgICAgICAgLy8gU2hvcnQgbGluZXMgd2l0aCBzaW1wbGUgaGlnaGxpZ2h0cyByZXR1cm4gbnVsbCwgYW5kIGFyZVxyXG4gICAgICAgICAgICAvLyBjb3VudGVkIGFzIGNoYW5nZWQgYnkgdGhlIGRyaXZlciBiZWNhdXNlIHRoZXkgYXJlIGxpa2VseSB0b1xyXG4gICAgICAgICAgICAvLyBoaWdobGlnaHQgdGhlIHNhbWUgd2F5IGluIHZhcmlvdXMgY29udGV4dHMuXHJcbiAgICAgICAgICAgIHJldHVybiBjaGFuZ2VkIHx8IChzdC5sZW5ndGggPCA1ICYmIHRoaXMudGV4dC5sZW5ndGggPCAxMCA/IG51bGwgOiBmYWxzZSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAvLyBGZXRjaCB0aGUgcGFyc2VyIHRva2VuIGZvciBhIGdpdmVuIGNoYXJhY3Rlci4gVXNlZnVsIGZvciBoYWNrc1xyXG4gICAgICAgIC8vIHRoYXQgd2FudCB0byBpbnNwZWN0IHRoZSBtb2RlIHN0YXRlIChzYXksIGZvciBjb21wbGV0aW9uKS5cclxuICAgICAgICBnZXRUb2tlbkF0OiBmdW5jdGlvbihtb2RlLCBzdGF0ZSwgY2gpIHtcclxuICAgICAgICAgICAgdmFyIHR4dCA9IHRoaXMudGV4dCwgc3RyZWFtID0gbmV3IFN0cmluZ1N0cmVhbSh0eHQpO1xyXG4gICAgICAgICAgICB3aGlsZSAoc3RyZWFtLnBvcyA8IGNoICYmICFzdHJlYW0uZW9sKCkpIHtcclxuICAgICAgICAgICAgICAgIHN0cmVhbS5zdGFydCA9IHN0cmVhbS5wb3M7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3R5bGUgPSBtb2RlLnRva2VuKHN0cmVhbSwgc3RhdGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB7c3RhcnQ6IHN0cmVhbS5zdGFydCxcclxuICAgICAgICAgICAgICAgIGVuZDogc3RyZWFtLnBvcyxcclxuICAgICAgICAgICAgICAgIHN0cmluZzogc3RyZWFtLmN1cnJlbnQoKSxcclxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZTogc3R5bGUgfHwgbnVsbCxcclxuICAgICAgICAgICAgICAgIHN0YXRlOiBzdGF0ZX07XHJcbiAgICAgICAgfSxcclxuICAgICAgICBpbmRlbnRhdGlvbjogZnVuY3Rpb24odGFiU2l6ZSkge3JldHVybiBjb3VudENvbHVtbih0aGlzLnRleHQsIG51bGwsIHRhYlNpemUpO30sXHJcbiAgICAgICAgLy8gUHJvZHVjZXMgYW4gSFRNTCBmcmFnbWVudCBmb3IgdGhlIGxpbmUsIHRha2luZyBzZWxlY3Rpb24sXHJcbiAgICAgICAgLy8gbWFya2luZywgYW5kIGhpZ2hsaWdodGluZyBpbnRvIGFjY291bnQuXHJcbiAgICAgICAgZ2V0SFRNTDogZnVuY3Rpb24oc2Zyb20sIHN0bywgaW5jbHVkZVByZSwgdGFiVGV4dCwgZW5kQXQpIHtcclxuICAgICAgICAgICAgdmFyIGh0bWwgPSBbXSwgZmlyc3QgPSB0cnVlO1xyXG4gICAgICAgICAgICBpZiAoaW5jbHVkZVByZSlcclxuICAgICAgICAgICAgICAgIGh0bWwucHVzaCh0aGlzLmNsYXNzTmFtZSA/ICc8cHJlIGNsYXNzPVwiJyArIHRoaXMuY2xhc3NOYW1lICsgJ1wiPic6IFwiPHByZT5cIik7XHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIHNwYW4odGV4dCwgc3R5bGUpIHtcclxuICAgICAgICAgICAgICAgIGlmICghdGV4dCkgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgLy8gV29yayBhcm91bmQgYSBidWcgd2hlcmUsIGluIHNvbWUgY29tcGF0IG1vZGVzLCBJRSBpZ25vcmVzIGxlYWRpbmcgc3BhY2VzXHJcbiAgICAgICAgICAgICAgICBpZiAoZmlyc3QgJiYgaWUgJiYgdGV4dC5jaGFyQXQoMCkgPT0gXCIgXCIpIHRleHQgPSBcIlxcdTAwYTBcIiArIHRleHQuc2xpY2UoMSk7XHJcbiAgICAgICAgICAgICAgICBmaXJzdCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgaWYgKHN0eWxlKSBodG1sLnB1c2goJzxzcGFuIGNsYXNzPVwiJywgc3R5bGUsICdcIj4nLCBodG1sRXNjYXBlKHRleHQpLnJlcGxhY2UoL1xcdC9nLCB0YWJUZXh0KSwgXCI8L3NwYW4+XCIpO1xyXG4gICAgICAgICAgICAgICAgZWxzZSBodG1sLnB1c2goaHRtbEVzY2FwZSh0ZXh0KS5yZXBsYWNlKC9cXHQvZywgdGFiVGV4dCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciBzdCA9IHRoaXMuc3R5bGVzLCBhbGxUZXh0ID0gdGhpcy50ZXh0LCBtYXJrZWQgPSB0aGlzLm1hcmtlZDtcclxuICAgICAgICAgICAgaWYgKHNmcm9tID09IHN0bykgc2Zyb20gPSBudWxsO1xyXG4gICAgICAgICAgICB2YXIgbGVuID0gYWxsVGV4dC5sZW5ndGg7XHJcbiAgICAgICAgICAgIGlmIChlbmRBdCAhPSBudWxsKSBsZW4gPSBNYXRoLm1pbihlbmRBdCwgbGVuKTtcclxuXHJcbiAgICAgICAgICAgIGlmICghYWxsVGV4dCAmJiBlbmRBdCA9PSBudWxsKVxyXG4gICAgICAgICAgICAgICAgc3BhbihcIiBcIiwgc2Zyb20gIT0gbnVsbCAmJiBzdG8gPT0gbnVsbCA/IFwiQ29kZU1pcnJvci1zZWxlY3RlZFwiIDogbnVsbCk7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKCFtYXJrZWQgJiYgc2Zyb20gPT0gbnVsbClcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBjaCA9IDA7IGNoIDwgbGVuOyBpKz0yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN0ciA9IHN0W2ldLCBzdHlsZSA9IHN0W2krMV0sIGwgPSBzdHIubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjaCArIGwgPiBsZW4pIHN0ciA9IHN0ci5zbGljZSgwLCBsZW4gLSBjaCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY2ggKz0gbDtcclxuICAgICAgICAgICAgICAgICAgICBzcGFuKHN0ciwgc3R5bGUgJiYgXCJjbS1cIiArIHN0eWxlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcG9zID0gMCwgaSA9IDAsIHRleHQgPSBcIlwiLCBzdHlsZSwgc2cgPSAwO1xyXG4gICAgICAgICAgICAgICAgdmFyIG1hcmtwb3MgPSAtMSwgbWFyayA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBuZXh0TWFyaygpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobWFya2VkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtwb3MgKz0gMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWFyayA9IChtYXJrcG9zIDwgbWFya2VkLmxlbmd0aCkgPyBtYXJrZWRbbWFya3Bvc10gOiBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIG5leHRNYXJrKCk7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAocG9zIDwgbGVuKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHVwdG8gPSBsZW47XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGV4dHJhU3R5bGUgPSBcIlwiO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzZnJvbSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZnJvbSA+IHBvcykgdXB0byA9IHNmcm9tO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChzdG8gPT0gbnVsbCB8fCBzdG8gPiBwb3MpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhU3R5bGUgPSBcIiBDb2RlTWlycm9yLXNlbGVjdGVkXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3RvICE9IG51bGwpIHVwdG8gPSBNYXRoLm1pbih1cHRvLCBzdG8pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChtYXJrICYmIG1hcmsudG8gIT0gbnVsbCAmJiBtYXJrLnRvIDw9IHBvcykgbmV4dE1hcmsoKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobWFyaykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobWFyay5mcm9tID4gcG9zKSB1cHRvID0gTWF0aC5taW4odXB0bywgbWFyay5mcm9tKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHRyYVN0eWxlICs9IFwiIFwiICsgbWFyay5zdHlsZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtYXJrLnRvICE9IG51bGwpIHVwdG8gPSBNYXRoLm1pbih1cHRvLCBtYXJrLnRvKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBmb3IgKDs7KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlbmQgPSBwb3MgKyB0ZXh0Lmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFwcGxpZWRTdHlsZSA9IHN0eWxlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXh0cmFTdHlsZSkgYXBwbGllZFN0eWxlID0gc3R5bGUgPyBzdHlsZSArIGV4dHJhU3R5bGUgOiBleHRyYVN0eWxlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzcGFuKGVuZCA+IHVwdG8gPyB0ZXh0LnNsaWNlKDAsIHVwdG8gLSBwb3MpIDogdGV4dCwgYXBwbGllZFN0eWxlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVuZCA+PSB1cHRvKSB7dGV4dCA9IHRleHQuc2xpY2UodXB0byAtIHBvcyk7IHBvcyA9IHVwdG87IGJyZWFrO31cclxuICAgICAgICAgICAgICAgICAgICAgICAgcG9zID0gZW5kO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0ID0gc3RbaSsrXTsgc3R5bGUgPSBcImNtLVwiICsgc3RbaSsrXTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoc2Zyb20gIT0gbnVsbCAmJiBzdG8gPT0gbnVsbCkgc3BhbihcIiBcIiwgXCJDb2RlTWlycm9yLXNlbGVjdGVkXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChpbmNsdWRlUHJlKSBodG1sLnB1c2goXCI8L3ByZT5cIik7XHJcbiAgICAgICAgICAgIHJldHVybiBodG1sLmpvaW4oXCJcIik7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBjbGVhblVwOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgdGhpcy5wYXJlbnQgPSBudWxsO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5tYXJrZWQpXHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgZSA9IHRoaXMubWFya2VkLmxlbmd0aDsgaSA8IGU7ICsraSkgdGhpcy5tYXJrZWRbaV0uZGV0YWNoKHRoaXMpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICAvLyBVdGlsaXR5IHVzZWQgYnkgcmVwbGFjZSBhbmQgc3BsaXQgYWJvdmVcclxuICAgIGZ1bmN0aW9uIGNvcHlTdHlsZXMoZnJvbSwgdG8sIHNvdXJjZSwgZGVzdCkge1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBwb3MgPSAwLCBzdGF0ZSA9IDA7IHBvcyA8IHRvOyBpKz0yKSB7XHJcbiAgICAgICAgICAgIHZhciBwYXJ0ID0gc291cmNlW2ldLCBlbmQgPSBwb3MgKyBwYXJ0Lmxlbmd0aDtcclxuICAgICAgICAgICAgaWYgKHN0YXRlID09IDApIHtcclxuICAgICAgICAgICAgICAgIGlmIChlbmQgPiBmcm9tKSBkZXN0LnB1c2gocGFydC5zbGljZShmcm9tIC0gcG9zLCBNYXRoLm1pbihwYXJ0Lmxlbmd0aCwgdG8gLSBwb3MpKSwgc291cmNlW2krMV0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKGVuZCA+PSBmcm9tKSBzdGF0ZSA9IDE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoc3RhdGUgPT0gMSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGVuZCA+IHRvKSBkZXN0LnB1c2gocGFydC5zbGljZSgwLCB0byAtIHBvcyksIHNvdXJjZVtpKzFdKTtcclxuICAgICAgICAgICAgICAgIGVsc2UgZGVzdC5wdXNoKHBhcnQsIHNvdXJjZVtpKzFdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBwb3MgPSBlbmQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIERhdGEgc3RydWN0dXJlIHRoYXQgaG9sZHMgdGhlIHNlcXVlbmNlIG9mIGxpbmVzLlxyXG4gICAgZnVuY3Rpb24gTGVhZkNodW5rKGxpbmVzKSB7XHJcbiAgICAgICAgdGhpcy5saW5lcyA9IGxpbmVzO1xyXG4gICAgICAgIHRoaXMucGFyZW50ID0gbnVsbDtcclxuICAgICAgICBmb3IgKHZhciBpID0gMCwgZSA9IGxpbmVzLmxlbmd0aCwgaGVpZ2h0ID0gMDsgaSA8IGU7ICsraSkge1xyXG4gICAgICAgICAgICBsaW5lc1tpXS5wYXJlbnQgPSB0aGlzO1xyXG4gICAgICAgICAgICBoZWlnaHQgKz0gbGluZXNbaV0uaGVpZ2h0O1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcclxuICAgIH1cclxuICAgIExlYWZDaHVuay5wcm90b3R5cGUgPSB7XHJcbiAgICAgICAgY2h1bmtTaXplOiBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXMubGluZXMubGVuZ3RoOyB9LFxyXG4gICAgICAgIHJlbW92ZTogZnVuY3Rpb24oYXQsIG4sIGNhbGxiYWNrcykge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gYXQsIGUgPSBhdCArIG47IGkgPCBlOyArK2kpIHtcclxuICAgICAgICAgICAgICAgIHZhciBsaW5lID0gdGhpcy5saW5lc1tpXTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaGVpZ2h0IC09IGxpbmUuaGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgbGluZS5jbGVhblVwKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAobGluZS5oYW5kbGVycylcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGxpbmUuaGFuZGxlcnMubGVuZ3RoOyArK2opIGNhbGxiYWNrcy5wdXNoKGxpbmUuaGFuZGxlcnNbal0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMubGluZXMuc3BsaWNlKGF0LCBuKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGNvbGxhcHNlOiBmdW5jdGlvbihsaW5lcykge1xyXG4gICAgICAgICAgICBsaW5lcy5zcGxpY2UuYXBwbHkobGluZXMsIFtsaW5lcy5sZW5ndGgsIDBdLmNvbmNhdCh0aGlzLmxpbmVzKSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBpbnNlcnRIZWlnaHQ6IGZ1bmN0aW9uKGF0LCBsaW5lcywgaGVpZ2h0KSB7XHJcbiAgICAgICAgICAgIHRoaXMuaGVpZ2h0ICs9IGhlaWdodDtcclxuICAgICAgICAgICAgdGhpcy5saW5lcy5zcGxpY2UuYXBwbHkodGhpcy5saW5lcywgW2F0LCAwXS5jb25jYXQobGluZXMpKTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGUgPSBsaW5lcy5sZW5ndGg7IGkgPCBlOyArK2kpIGxpbmVzW2ldLnBhcmVudCA9IHRoaXM7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBpdGVyTjogZnVuY3Rpb24oYXQsIG4sIG9wKSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGUgPSBhdCArIG47IGF0IDwgZTsgKythdClcclxuICAgICAgICAgICAgICAgIGlmIChvcCh0aGlzLmxpbmVzW2F0XSkpIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICBmdW5jdGlvbiBCcmFuY2hDaHVuayhjaGlsZHJlbikge1xyXG4gICAgICAgIHRoaXMuY2hpbGRyZW4gPSBjaGlsZHJlbjtcclxuICAgICAgICB2YXIgc2l6ZSA9IDAsIGhlaWdodCA9IDA7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGUgPSBjaGlsZHJlbi5sZW5ndGg7IGkgPCBlOyArK2kpIHtcclxuICAgICAgICAgICAgdmFyIGNoID0gY2hpbGRyZW5baV07XHJcbiAgICAgICAgICAgIHNpemUgKz0gY2guY2h1bmtTaXplKCk7IGhlaWdodCArPSBjaC5oZWlnaHQ7XHJcbiAgICAgICAgICAgIGNoLnBhcmVudCA9IHRoaXM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuc2l6ZSA9IHNpemU7XHJcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XHJcbiAgICAgICAgdGhpcy5wYXJlbnQgPSBudWxsO1xyXG4gICAgfVxyXG4gICAgQnJhbmNoQ2h1bmsucHJvdG90eXBlID0ge1xyXG4gICAgICAgIGNodW5rU2l6ZTogZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLnNpemU7IH0sXHJcbiAgICAgICAgcmVtb3ZlOiBmdW5jdGlvbihhdCwgbiwgY2FsbGJhY2tzKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2l6ZSAtPSBuO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuY2hpbGRyZW4ubGVuZ3RoOyArK2kpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjaGlsZCA9IHRoaXMuY2hpbGRyZW5baV0sIHN6ID0gY2hpbGQuY2h1bmtTaXplKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoYXQgPCBzeikge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBybSA9IE1hdGgubWluKG4sIHN6IC0gYXQpLCBvbGRIZWlnaHQgPSBjaGlsZC5oZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgY2hpbGQucmVtb3ZlKGF0LCBybSwgY2FsbGJhY2tzKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmhlaWdodCAtPSBvbGRIZWlnaHQgLSBjaGlsZC5oZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN6ID09IHJtKSB7IHRoaXMuY2hpbGRyZW4uc3BsaWNlKGktLSwgMSk7IGNoaWxkLnBhcmVudCA9IG51bGw7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAoKG4gLT0gcm0pID09IDApIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGF0ID0gMDtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBhdCAtPSBzejtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodGhpcy5zaXplIC0gbiA8IDI1KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbGluZXMgPSBbXTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY29sbGFwc2UobGluZXMpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jaGlsZHJlbiA9IFtuZXcgTGVhZkNodW5rKGxpbmVzKV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIGNvbGxhcHNlOiBmdW5jdGlvbihsaW5lcykge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgZSA9IHRoaXMuY2hpbGRyZW4ubGVuZ3RoOyBpIDwgZTsgKytpKSB0aGlzLmNoaWxkcmVuW2ldLmNvbGxhcHNlKGxpbmVzKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGluc2VydDogZnVuY3Rpb24oYXQsIGxpbmVzKSB7XHJcbiAgICAgICAgICAgIHZhciBoZWlnaHQgPSAwO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgZSA9IGxpbmVzLmxlbmd0aDsgaSA8IGU7ICsraSkgaGVpZ2h0ICs9IGxpbmVzW2ldLmhlaWdodDtcclxuICAgICAgICAgICAgdGhpcy5pbnNlcnRIZWlnaHQoYXQsIGxpbmVzLCBoZWlnaHQpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgaW5zZXJ0SGVpZ2h0OiBmdW5jdGlvbihhdCwgbGluZXMsIGhlaWdodCkge1xyXG4gICAgICAgICAgICB0aGlzLnNpemUgKz0gbGluZXMubGVuZ3RoO1xyXG4gICAgICAgICAgICB0aGlzLmhlaWdodCArPSBoZWlnaHQ7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBlID0gdGhpcy5jaGlsZHJlbi5sZW5ndGg7IGkgPCBlOyArK2kpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjaGlsZCA9IHRoaXMuY2hpbGRyZW5baV0sIHN6ID0gY2hpbGQuY2h1bmtTaXplKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoYXQgPD0gc3opIHtcclxuICAgICAgICAgICAgICAgICAgICBjaGlsZC5pbnNlcnRIZWlnaHQoYXQsIGxpbmVzLCBoZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjaGlsZC5saW5lcyAmJiBjaGlsZC5saW5lcy5sZW5ndGggPiA1MCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoY2hpbGQubGluZXMubGVuZ3RoID4gNTApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzcGlsbGVkID0gY2hpbGQubGluZXMuc3BsaWNlKGNoaWxkLmxpbmVzLmxlbmd0aCAtIDI1LCAyNSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbmV3bGVhZiA9IG5ldyBMZWFmQ2h1bmsoc3BpbGxlZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGlsZC5oZWlnaHQgLT0gbmV3bGVhZi5oZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNoaWxkcmVuLnNwbGljZShpICsgMSwgMCwgbmV3bGVhZik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdsZWFmLnBhcmVudCA9IHRoaXM7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5tYXliZVNwaWxsKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYXQgLT0gc3o7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIG1heWJlU3BpbGw6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5jaGlsZHJlbi5sZW5ndGggPD0gMTApIHJldHVybjtcclxuICAgICAgICAgICAgdmFyIG1lID0gdGhpcztcclxuICAgICAgICAgICAgZG8ge1xyXG4gICAgICAgICAgICAgICAgdmFyIHNwaWxsZWQgPSBtZS5jaGlsZHJlbi5zcGxpY2UobWUuY2hpbGRyZW4ubGVuZ3RoIC0gNSwgNSk7XHJcbiAgICAgICAgICAgICAgICB2YXIgc2libGluZyA9IG5ldyBCcmFuY2hDaHVuayhzcGlsbGVkKTtcclxuICAgICAgICAgICAgICAgIGlmICghbWUucGFyZW50KSB7IC8vIEJlY29tZSB0aGUgcGFyZW50IG5vZGVcclxuICAgICAgICAgICAgICAgICAgICB2YXIgY29weSA9IG5ldyBCcmFuY2hDaHVuayhtZS5jaGlsZHJlbik7XHJcbiAgICAgICAgICAgICAgICAgICAgY29weS5wYXJlbnQgPSBtZTtcclxuICAgICAgICAgICAgICAgICAgICBtZS5jaGlsZHJlbiA9IFtjb3B5LCBzaWJsaW5nXTtcclxuICAgICAgICAgICAgICAgICAgICBtZSA9IGNvcHk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIG1lLnNpemUgLT0gc2libGluZy5zaXplO1xyXG4gICAgICAgICAgICAgICAgICAgIG1lLmhlaWdodCAtPSBzaWJsaW5nLmhlaWdodDtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbXlJbmRleCA9IGluZGV4T2YobWUucGFyZW50LmNoaWxkcmVuLCBtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgbWUucGFyZW50LmNoaWxkcmVuLnNwbGljZShteUluZGV4ICsgMSwgMCwgc2libGluZyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBzaWJsaW5nLnBhcmVudCA9IG1lLnBhcmVudDtcclxuICAgICAgICAgICAgfSB3aGlsZSAobWUuY2hpbGRyZW4ubGVuZ3RoID4gMTApO1xyXG4gICAgICAgICAgICBtZS5wYXJlbnQubWF5YmVTcGlsbCgpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgaXRlcjogZnVuY3Rpb24oZnJvbSwgdG8sIG9wKSB7IHRoaXMuaXRlck4oZnJvbSwgdG8gLSBmcm9tLCBvcCk7IH0sXHJcbiAgICAgICAgaXRlck46IGZ1bmN0aW9uKGF0LCBuLCBvcCkge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgZSA9IHRoaXMuY2hpbGRyZW4ubGVuZ3RoOyBpIDwgZTsgKytpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY2hpbGQgPSB0aGlzLmNoaWxkcmVuW2ldLCBzeiA9IGNoaWxkLmNodW5rU2l6ZSgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGF0IDwgc3opIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdXNlZCA9IE1hdGgubWluKG4sIHN6IC0gYXQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjaGlsZC5pdGVyTihhdCwgdXNlZCwgb3ApKSByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoKG4gLT0gdXNlZCkgPT0gMCkgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgYXQgPSAwO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGF0IC09IHN6O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBmdW5jdGlvbiBnZXRMaW5lQXQoY2h1bmssIG4pIHtcclxuICAgICAgICB3aGlsZSAoIWNodW5rLmxpbmVzKSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOzsgKytpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY2hpbGQgPSBjaHVuay5jaGlsZHJlbltpXSwgc3ogPSBjaGlsZC5jaHVua1NpemUoKTtcclxuICAgICAgICAgICAgICAgIGlmIChuIDwgc3opIHsgY2h1bmsgPSBjaGlsZDsgYnJlYWs7IH1cclxuICAgICAgICAgICAgICAgIG4gLT0gc3o7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGNodW5rLmxpbmVzW25dO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gbGluZU5vKGxpbmUpIHtcclxuICAgICAgICBpZiAobGluZS5wYXJlbnQgPT0gbnVsbCkgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgdmFyIGN1ciA9IGxpbmUucGFyZW50LCBubyA9IGluZGV4T2YoY3VyLmxpbmVzLCBsaW5lKTtcclxuICAgICAgICBmb3IgKHZhciBjaHVuayA9IGN1ci5wYXJlbnQ7IGNodW5rOyBjdXIgPSBjaHVuaywgY2h1bmsgPSBjaHVuay5wYXJlbnQpIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGUgPSBjaHVuay5jaGlsZHJlbi5sZW5ndGg7IDsgKytpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoY2h1bmsuY2hpbGRyZW5baV0gPT0gY3VyKSBicmVhaztcclxuICAgICAgICAgICAgICAgIG5vICs9IGNodW5rLmNoaWxkcmVuW2ldLmNodW5rU2l6ZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBubztcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIGxpbmVBdEhlaWdodChjaHVuaywgaCkge1xyXG4gICAgICAgIHZhciBuID0gMDtcclxuICAgICAgICBvdXRlcjogZG8ge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgZSA9IGNodW5rLmNoaWxkcmVuLmxlbmd0aDsgaSA8IGU7ICsraSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNoaWxkID0gY2h1bmsuY2hpbGRyZW5baV0sIGNoID0gY2hpbGQuaGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgaWYgKGggPCBjaCkgeyBjaHVuayA9IGNoaWxkOyBjb250aW51ZSBvdXRlcjsgfVxyXG4gICAgICAgICAgICAgICAgaCAtPSBjaDtcclxuICAgICAgICAgICAgICAgIG4gKz0gY2hpbGQuY2h1bmtTaXplKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIG47XHJcbiAgICAgICAgfSB3aGlsZSAoIWNodW5rLmxpbmVzKTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMCwgZSA9IGNodW5rLmxpbmVzLmxlbmd0aDsgaSA8IGU7ICsraSkge1xyXG4gICAgICAgICAgICB2YXIgbGluZSA9IGNodW5rLmxpbmVzW2ldLCBsaCA9IGxpbmUuaGVpZ2h0O1xyXG4gICAgICAgICAgICBpZiAoaCA8IGxoKSBicmVhaztcclxuICAgICAgICAgICAgaCAtPSBsaDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG4gKyBpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gaGVpZ2h0QXRMaW5lKGNodW5rLCBuKSB7XHJcbiAgICAgICAgdmFyIGggPSAwO1xyXG4gICAgICAgIG91dGVyOiBkbyB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBlID0gY2h1bmsuY2hpbGRyZW4ubGVuZ3RoOyBpIDwgZTsgKytpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY2hpbGQgPSBjaHVuay5jaGlsZHJlbltpXSwgc3ogPSBjaGlsZC5jaHVua1NpemUoKTtcclxuICAgICAgICAgICAgICAgIGlmIChuIDwgc3opIHsgY2h1bmsgPSBjaGlsZDsgY29udGludWUgb3V0ZXI7IH1cclxuICAgICAgICAgICAgICAgIG4gLT0gc3o7XHJcbiAgICAgICAgICAgICAgICBoICs9IGNoaWxkLmhlaWdodDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gaDtcclxuICAgICAgICB9IHdoaWxlICghY2h1bmsubGluZXMpO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgKytpKSBoICs9IGNodW5rLmxpbmVzW2ldLmhlaWdodDtcclxuICAgICAgICByZXR1cm4gaDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBUaGUgaGlzdG9yeSBvYmplY3QgJ2NodW5rcycgY2hhbmdlcyB0aGF0IGFyZSBtYWRlIGNsb3NlIHRvZ2V0aGVyXHJcbiAgICAvLyBhbmQgYXQgYWxtb3N0IHRoZSBzYW1lIHRpbWUgaW50byBiaWdnZXIgdW5kb2FibGUgdW5pdHMuXHJcbiAgICBmdW5jdGlvbiBIaXN0b3J5KCkge1xyXG4gICAgICAgIHRoaXMudGltZSA9IDA7XHJcbiAgICAgICAgdGhpcy5kb25lID0gW107IHRoaXMudW5kb25lID0gW107XHJcbiAgICB9XHJcbiAgICBIaXN0b3J5LnByb3RvdHlwZSA9IHtcclxuICAgICAgICBhZGRDaGFuZ2U6IGZ1bmN0aW9uKHN0YXJ0LCBhZGRlZCwgb2xkKSB7XHJcbiAgICAgICAgICAgIHRoaXMudW5kb25lLmxlbmd0aCA9IDA7XHJcbiAgICAgICAgICAgIHZhciB0aW1lID0gK25ldyBEYXRlLCBsYXN0ID0gdGhpcy5kb25lW3RoaXMuZG9uZS5sZW5ndGggLSAxXTtcclxuICAgICAgICAgICAgaWYgKHRpbWUgLSB0aGlzLnRpbWUgPiA0MDAgfHwgIWxhc3QgfHxcclxuICAgICAgICAgICAgICAgIGxhc3Quc3RhcnQgPiBzdGFydCArIGFkZGVkIHx8IGxhc3Quc3RhcnQgKyBsYXN0LmFkZGVkIDwgc3RhcnQgLSBsYXN0LmFkZGVkICsgbGFzdC5vbGQubGVuZ3RoKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5kb25lLnB1c2goe3N0YXJ0OiBzdGFydCwgYWRkZWQ6IGFkZGVkLCBvbGQ6IG9sZH0pO1xyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHZhciBvbGRvZmYgPSAwO1xyXG4gICAgICAgICAgICAgICAgaWYgKHN0YXJ0IDwgbGFzdC5zdGFydCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSBsYXN0LnN0YXJ0IC0gc3RhcnQgLSAxOyBpID49IDA7IC0taSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGFzdC5vbGQudW5zaGlmdChvbGRbaV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGxhc3QuYWRkZWQgKz0gbGFzdC5zdGFydCAtIHN0YXJ0O1xyXG4gICAgICAgICAgICAgICAgICAgIGxhc3Quc3RhcnQgPSBzdGFydDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGxhc3Quc3RhcnQgPCBzdGFydCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG9sZG9mZiA9IHN0YXJ0IC0gbGFzdC5zdGFydDtcclxuICAgICAgICAgICAgICAgICAgICBhZGRlZCArPSBvbGRvZmY7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gbGFzdC5hZGRlZCAtIG9sZG9mZiwgZSA9IG9sZC5sZW5ndGg7IGkgPCBlOyArK2kpXHJcbiAgICAgICAgICAgICAgICAgICAgbGFzdC5vbGQucHVzaChvbGRbaV0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKGxhc3QuYWRkZWQgPCBhZGRlZCkgbGFzdC5hZGRlZCA9IGFkZGVkO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMudGltZSA9IHRpbWU7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBmdW5jdGlvbiBzdG9wTWV0aG9kKCkge2Vfc3RvcCh0aGlzKTt9XHJcbiAgICAvLyBFbnN1cmUgYW4gZXZlbnQgaGFzIGEgc3RvcCBtZXRob2QuXHJcbiAgICBmdW5jdGlvbiBhZGRTdG9wKGV2ZW50KSB7XHJcbiAgICAgICAgaWYgKCFldmVudC5zdG9wKSBldmVudC5zdG9wID0gc3RvcE1ldGhvZDtcclxuICAgICAgICByZXR1cm4gZXZlbnQ7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZV9wcmV2ZW50RGVmYXVsdChlKSB7XHJcbiAgICAgICAgaWYgKGUucHJldmVudERlZmF1bHQpIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBlbHNlIGUucmV0dXJuVmFsdWUgPSBmYWxzZTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIGVfc3RvcFByb3BhZ2F0aW9uKGUpIHtcclxuICAgICAgICBpZiAoZS5zdG9wUHJvcGFnYXRpb24pIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgZWxzZSBlLmNhbmNlbEJ1YmJsZSA9IHRydWU7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBlX3N0b3AoZSkge2VfcHJldmVudERlZmF1bHQoZSk7IGVfc3RvcFByb3BhZ2F0aW9uKGUpO31cclxuICAgIENvZGVNaXJyb3IuZV9zdG9wID0gZV9zdG9wO1xyXG4gICAgQ29kZU1pcnJvci5lX3ByZXZlbnREZWZhdWx0ID0gZV9wcmV2ZW50RGVmYXVsdDtcclxuICAgIENvZGVNaXJyb3IuZV9zdG9wUHJvcGFnYXRpb24gPSBlX3N0b3BQcm9wYWdhdGlvbjtcclxuXHJcbiAgICBmdW5jdGlvbiBlX3RhcmdldChlKSB7cmV0dXJuIGUudGFyZ2V0IHx8IGUuc3JjRWxlbWVudDt9XHJcbiAgICBmdW5jdGlvbiBlX2J1dHRvbihlKSB7XHJcbiAgICAgICAgaWYgKGUud2hpY2gpIHJldHVybiBlLndoaWNoO1xyXG4gICAgICAgIGVsc2UgaWYgKGUuYnV0dG9uICYgMSkgcmV0dXJuIDE7XHJcbiAgICAgICAgZWxzZSBpZiAoZS5idXR0b24gJiAyKSByZXR1cm4gMztcclxuICAgICAgICBlbHNlIGlmIChlLmJ1dHRvbiAmIDQpIHJldHVybiAyO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEV2ZW50IGhhbmRsZXIgcmVnaXN0cmF0aW9uLiBJZiBkaXNjb25uZWN0IGlzIHRydWUsIGl0J2xsIHJldHVybiBhXHJcbiAgICAvLyBmdW5jdGlvbiB0aGF0IHVucmVnaXN0ZXJzIHRoZSBoYW5kbGVyLlxyXG4gICAgZnVuY3Rpb24gY29ubmVjdChub2RlLCB0eXBlLCBoYW5kbGVyLCBkaXNjb25uZWN0KSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBub2RlLmFkZEV2ZW50TGlzdGVuZXIgPT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgICAgIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBoYW5kbGVyLCBmYWxzZSk7XHJcbiAgICAgICAgICAgIGlmIChkaXNjb25uZWN0KSByZXR1cm4gZnVuY3Rpb24oKSB7bm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGhhbmRsZXIsIGZhbHNlKTt9O1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdmFyIHdyYXBIYW5kbGVyID0gZnVuY3Rpb24oZXZlbnQpIHtoYW5kbGVyKGV2ZW50IHx8IHdpbmRvdy5ldmVudCk7fTtcclxuICAgICAgICAgICAgbm9kZS5hdHRhY2hFdmVudChcIm9uXCIgKyB0eXBlLCB3cmFwSGFuZGxlcik7XHJcbiAgICAgICAgICAgIGlmIChkaXNjb25uZWN0KSByZXR1cm4gZnVuY3Rpb24oKSB7bm9kZS5kZXRhY2hFdmVudChcIm9uXCIgKyB0eXBlLCB3cmFwSGFuZGxlcik7fTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBDb2RlTWlycm9yLmNvbm5lY3QgPSBjb25uZWN0O1xyXG5cclxuICAgIGZ1bmN0aW9uIERlbGF5ZWQoKSB7dGhpcy5pZCA9IG51bGw7fVxyXG4gICAgRGVsYXllZC5wcm90b3R5cGUgPSB7c2V0OiBmdW5jdGlvbihtcywgZikge2NsZWFyVGltZW91dCh0aGlzLmlkKTsgdGhpcy5pZCA9IHNldFRpbWVvdXQoZiwgbXMpO319O1xyXG5cclxuICAgIC8vIERldGVjdCBkcmFnLWFuZC1kcm9wXHJcbiAgICB2YXIgZHJhZ0FuZERyb3AgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAvLyBJRTggaGFzIG9uZHJhZ3N0YXJ0IGFuZCBvbmRyb3AgcHJvcGVydGllcywgYnV0IGRvZXNuJ3Qgc2VlbSB0b1xyXG4gICAgICAgIC8vIGFjdHVhbGx5IHN1cHBvcnQgb25kcmFnc3RhcnQgdGhlIHdheSBpdCdzIHN1cHBvc2VkIHRvIHdvcmsuXHJcbiAgICAgICAgaWYgKC9NU0lFIFsxLThdXFxiLy50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgIHJldHVybiBcImRyYWdnYWJsZVwiIGluIGRpdjtcclxuICAgIH0oKTtcclxuXHJcbiAgICB2YXIgZ2Vja28gPSAvZ2Vja29cXC9cXGR7N30vaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpO1xyXG4gICAgdmFyIGllID0gL01TSUUgXFxkLy50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpO1xyXG4gICAgdmFyIHdlYmtpdCA9IC9XZWJLaXRcXC8vLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XHJcblxyXG4gICAgdmFyIGxpbmVTZXAgPSBcIlxcblwiO1xyXG4gICAgLy8gRmVhdHVyZS1kZXRlY3Qgd2hldGhlciBuZXdsaW5lcyBpbiB0ZXh0YXJlYXMgYXJlIGNvbnZlcnRlZCB0byBcXHJcXG5cclxuICAgIChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRleHRhcmVhXCIpO1xyXG4gICAgICAgIHRlLnZhbHVlID0gXCJmb29cXG5iYXJcIjtcclxuICAgICAgICBpZiAodGUudmFsdWUuaW5kZXhPZihcIlxcclwiKSA+IC0xKSBsaW5lU2VwID0gXCJcXHJcXG5cIjtcclxuICAgIH0oKSk7XHJcblxyXG4gICAgLy8gQ291bnRzIHRoZSBjb2x1bW4gb2Zmc2V0IGluIGEgc3RyaW5nLCB0YWtpbmcgdGFicyBpbnRvIGFjY291bnQuXHJcbiAgICAvLyBVc2VkIG1vc3RseSB0byBmaW5kIGluZGVudGF0aW9uLlxyXG4gICAgZnVuY3Rpb24gY291bnRDb2x1bW4oc3RyaW5nLCBlbmQsIHRhYlNpemUpIHtcclxuICAgICAgICBpZiAoZW5kID09IG51bGwpIHtcclxuICAgICAgICAgICAgZW5kID0gc3RyaW5nLnNlYXJjaCgvW15cXHNcXHUwMGEwXS8pO1xyXG4gICAgICAgICAgICBpZiAoZW5kID09IC0xKSBlbmQgPSBzdHJpbmcubGVuZ3RoO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IgKHZhciBpID0gMCwgbiA9IDA7IGkgPCBlbmQ7ICsraSkge1xyXG4gICAgICAgICAgICBpZiAoc3RyaW5nLmNoYXJBdChpKSA9PSBcIlxcdFwiKSBuICs9IHRhYlNpemUgLSAobiAlIHRhYlNpemUpO1xyXG4gICAgICAgICAgICBlbHNlICsrbjtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG47XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gY29tcHV0ZWRTdHlsZShlbHQpIHtcclxuICAgICAgICBpZiAoZWx0LmN1cnJlbnRTdHlsZSkgcmV0dXJuIGVsdC5jdXJyZW50U3R5bGU7XHJcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsdCwgbnVsbCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRmluZCB0aGUgcG9zaXRpb24gb2YgYW4gZWxlbWVudCBieSBmb2xsb3dpbmcgdGhlIG9mZnNldFBhcmVudCBjaGFpbi5cclxuICAgIC8vIElmIHNjcmVlbj09dHJ1ZSwgaXQgcmV0dXJucyBzY3JlZW4gKHJhdGhlciB0aGFuIHBhZ2UpIGNvb3JkaW5hdGVzLlxyXG4gICAgZnVuY3Rpb24gZWx0T2Zmc2V0KG5vZGUsIHNjcmVlbikge1xyXG4gICAgICAgIHZhciBib2QgPSBub2RlLm93bmVyRG9jdW1lbnQuYm9keTtcclxuICAgICAgICB2YXIgeCA9IDAsIHkgPSAwLCBza2lwQm9keSA9IGZhbHNlO1xyXG4gICAgICAgIGZvciAodmFyIG4gPSBub2RlOyBuOyBuID0gbi5vZmZzZXRQYXJlbnQpIHtcclxuICAgICAgICAgICAgdmFyIG9sID0gbi5vZmZzZXRMZWZ0LCBvdCA9IG4ub2Zmc2V0VG9wO1xyXG4gICAgICAgICAgICAvLyBGaXJlZm94IHJlcG9ydHMgd2VpcmQgaW52ZXJ0ZWQgb2Zmc2V0cyB3aGVuIHRoZSBib2R5IGhhcyBhIGJvcmRlci5cclxuICAgICAgICAgICAgaWYgKG4gPT0gYm9kKSB7IHggKz0gTWF0aC5hYnMob2wpOyB5ICs9IE1hdGguYWJzKG90KTsgfVxyXG4gICAgICAgICAgICBlbHNlIHsgeCArPSBvbCwgeSArPSBvdDsgfVxyXG4gICAgICAgICAgICBpZiAoc2NyZWVuICYmIGNvbXB1dGVkU3R5bGUobikucG9zaXRpb24gPT0gXCJmaXhlZFwiKVxyXG4gICAgICAgICAgICAgICAgc2tpcEJvZHkgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgZSA9IHNjcmVlbiAmJiAhc2tpcEJvZHkgPyBudWxsIDogYm9kO1xyXG4gICAgICAgIGZvciAodmFyIG4gPSBub2RlLnBhcmVudE5vZGU7IG4gIT0gZTsgbiA9IG4ucGFyZW50Tm9kZSlcclxuICAgICAgICAgICAgaWYgKG4uc2Nyb2xsTGVmdCAhPSBudWxsKSB7IHggLT0gbi5zY3JvbGxMZWZ0OyB5IC09IG4uc2Nyb2xsVG9wO31cclxuICAgICAgICByZXR1cm4ge2xlZnQ6IHgsIHRvcDogeX07XHJcbiAgICB9XHJcbiAgICAvLyBVc2UgdGhlIGZhc3RlciBhbmQgc2FuZXIgZ2V0Qm91bmRpbmdDbGllbnRSZWN0IG1ldGhvZCB3aGVuIHBvc3NpYmxlLlxyXG4gICAgaWYgKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QgIT0gbnVsbCkgZWx0T2Zmc2V0ID0gZnVuY3Rpb24obm9kZSwgc2NyZWVuKSB7XHJcbiAgICAgICAgLy8gVGFrZSB0aGUgcGFydHMgb2YgYm91bmRpbmcgY2xpZW50IHJlY3QgdGhhdCB3ZSBhcmUgaW50ZXJlc3RlZCBpbiBzbyB3ZSBhcmUgYWJsZSB0byBlZGl0IGlmIG5lZWQgYmUsXHJcbiAgICAgICAgLy8gc2luY2UgdGhlIHJldHVybmVkIHZhbHVlIGNhbm5vdCBiZSBjaGFuZ2VkIGV4dGVybmFsbHkgKHRoZXkgYXJlIGtlcHQgaW4gc3luYyBhcyB0aGUgZWxlbWVudCBtb3ZlcyB3aXRoaW4gdGhlIHBhZ2UpXHJcbiAgICAgICAgdHJ5IHsgdmFyIGJveCA9IG5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7IGJveCA9IHsgdG9wOiBib3gudG9wLCBsZWZ0OiBib3gubGVmdCB9OyB9XHJcbiAgICAgICAgY2F0Y2goZSkgeyBib3ggPSB7dG9wOiAwLCBsZWZ0OiAwfTsgfVxyXG4gICAgICAgIGlmICghc2NyZWVuKSB7XHJcbiAgICAgICAgICAgIC8vIEdldCB0aGUgdG9wbGV2ZWwgc2Nyb2xsLCB3b3JraW5nIGFyb3VuZCBicm93c2VyIGRpZmZlcmVuY2VzLlxyXG4gICAgICAgICAgICBpZiAod2luZG93LnBhZ2VZT2Zmc2V0ID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHZhciB0ID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IHx8IGRvY3VtZW50LmJvZHkucGFyZW50Tm9kZTtcclxuICAgICAgICAgICAgICAgIGlmICh0LnNjcm9sbFRvcCA9PSBudWxsKSB0ID0gZG9jdW1lbnQuYm9keTtcclxuICAgICAgICAgICAgICAgIGJveC50b3AgKz0gdC5zY3JvbGxUb3A7IGJveC5sZWZ0ICs9IHQuc2Nyb2xsTGVmdDtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGJveC50b3AgKz0gd2luZG93LnBhZ2VZT2Zmc2V0OyBib3gubGVmdCArPSB3aW5kb3cucGFnZVhPZmZzZXQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGJveDtcclxuICAgIH07XHJcblxyXG4gICAgLy8gR2V0IGEgbm9kZSdzIHRleHQgY29udGVudC5cclxuICAgIGZ1bmN0aW9uIGVsdFRleHQobm9kZSkge1xyXG4gICAgICAgIHJldHVybiBub2RlLnRleHRDb250ZW50IHx8IG5vZGUuaW5uZXJUZXh0IHx8IG5vZGUubm9kZVZhbHVlIHx8IFwiXCI7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gT3BlcmF0aW9ucyBvbiB7bGluZSwgY2h9IG9iamVjdHMuXHJcbiAgICBmdW5jdGlvbiBwb3NFcShhLCBiKSB7cmV0dXJuIGEubGluZSA9PSBiLmxpbmUgJiYgYS5jaCA9PSBiLmNoO31cclxuICAgIGZ1bmN0aW9uIHBvc0xlc3MoYSwgYikge3JldHVybiBhLmxpbmUgPCBiLmxpbmUgfHwgKGEubGluZSA9PSBiLmxpbmUgJiYgYS5jaCA8IGIuY2gpO31cclxuICAgIGZ1bmN0aW9uIGNvcHlQb3MoeCkge3JldHVybiB7bGluZTogeC5saW5lLCBjaDogeC5jaH07fVxyXG5cclxuICAgIHZhciBlc2NhcGVFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInByZVwiKTtcclxuICAgIGZ1bmN0aW9uIGh0bWxFc2NhcGUoc3RyKSB7XHJcbiAgICAgICAgZXNjYXBlRWxlbWVudC50ZXh0Q29udGVudCA9IHN0cjtcclxuICAgICAgICByZXR1cm4gZXNjYXBlRWxlbWVudC5pbm5lckhUTUw7XHJcbiAgICB9XHJcbiAgICAvLyBSZWNlbnQgKGxhdGUgMjAxMSkgT3BlcmEgYmV0YXMgaW5zZXJ0IGJvZ3VzIG5ld2xpbmVzIGF0IHRoZSBzdGFydFxyXG4gICAgLy8gb2YgdGhlIHRleHRDb250ZW50LCBzbyB3ZSBzdHJpcCB0aG9zZS5cclxuICAgIGlmIChodG1sRXNjYXBlKFwiYVwiKSA9PSBcIlxcbmFcIilcclxuICAgICAgICBodG1sRXNjYXBlID0gZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAgICAgICAgIGVzY2FwZUVsZW1lbnQudGV4dENvbnRlbnQgPSBzdHI7XHJcbiAgICAgICAgICAgIHJldHVybiBlc2NhcGVFbGVtZW50LmlubmVySFRNTC5zbGljZSgxKTtcclxuICAgICAgICB9O1xyXG4gICAgLy8gU29tZSBJRXMgZG9uJ3QgcHJlc2VydmUgdGFicyB0aHJvdWdoIGlubmVySFRNTFxyXG4gICAgZWxzZSBpZiAoaHRtbEVzY2FwZShcIlxcdFwiKSAhPSBcIlxcdFwiKVxyXG4gICAgICAgIGh0bWxFc2NhcGUgPSBmdW5jdGlvbihzdHIpIHtcclxuICAgICAgICAgICAgZXNjYXBlRWxlbWVudC5pbm5lckhUTUwgPSBcIlwiO1xyXG4gICAgICAgICAgICBlc2NhcGVFbGVtZW50LmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHN0cikpO1xyXG4gICAgICAgICAgICByZXR1cm4gZXNjYXBlRWxlbWVudC5pbm5lckhUTUw7XHJcbiAgICAgICAgfTtcclxuICAgIENvZGVNaXJyb3IuaHRtbEVzY2FwZSA9IGh0bWxFc2NhcGU7XHJcblxyXG4gICAgLy8gVXNlZCB0byBwb3NpdGlvbiB0aGUgY3Vyc29yIGFmdGVyIGFuIHVuZG8vcmVkbyBieSBmaW5kaW5nIHRoZVxyXG4gICAgLy8gbGFzdCBlZGl0ZWQgY2hhcmFjdGVyLlxyXG4gICAgZnVuY3Rpb24gZWRpdEVuZChmcm9tLCB0bykge1xyXG4gICAgICAgIGlmICghdG8pIHJldHVybiBmcm9tID8gZnJvbS5sZW5ndGggOiAwO1xyXG4gICAgICAgIGlmICghZnJvbSkgcmV0dXJuIHRvLmxlbmd0aDtcclxuICAgICAgICBmb3IgKHZhciBpID0gZnJvbS5sZW5ndGgsIGogPSB0by5sZW5ndGg7IGkgPj0gMCAmJiBqID49IDA7IC0taSwgLS1qKVxyXG4gICAgICAgICAgICBpZiAoZnJvbS5jaGFyQXQoaSkgIT0gdG8uY2hhckF0KGopKSBicmVhaztcclxuICAgICAgICByZXR1cm4gaiArIDE7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gaW5kZXhPZihjb2xsZWN0aW9uLCBlbHQpIHtcclxuICAgICAgICBpZiAoY29sbGVjdGlvbi5pbmRleE9mKSByZXR1cm4gY29sbGVjdGlvbi5pbmRleE9mKGVsdCk7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGUgPSBjb2xsZWN0aW9uLmxlbmd0aDsgaSA8IGU7ICsraSlcclxuICAgICAgICAgICAgaWYgKGNvbGxlY3Rpb25baV0gPT0gZWx0KSByZXR1cm4gaTtcclxuICAgICAgICByZXR1cm4gLTE7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBpc1dvcmRDaGFyKGNoKSB7XHJcbiAgICAgICAgcmV0dXJuIC9cXHcvLnRlc3QoY2gpIHx8IGNoLnRvVXBwZXJDYXNlKCkgIT0gY2gudG9Mb3dlckNhc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBTZWUgaWYgXCJcIi5zcGxpdCBpcyB0aGUgYnJva2VuIElFIHZlcnNpb24sIGlmIHNvLCBwcm92aWRlIGFuXHJcbiAgICAvLyBhbHRlcm5hdGl2ZSB3YXkgdG8gc3BsaXQgbGluZXMuXHJcbiAgICB2YXIgc3BsaXRMaW5lcyA9IFwiXFxuXFxuYlwiLnNwbGl0KC9cXG4vKS5sZW5ndGggIT0gMyA/IGZ1bmN0aW9uKHN0cmluZykge1xyXG4gICAgICAgIHZhciBwb3MgPSAwLCBubCwgcmVzdWx0ID0gW107XHJcbiAgICAgICAgd2hpbGUgKChubCA9IHN0cmluZy5pbmRleE9mKFwiXFxuXCIsIHBvcykpID4gLTEpIHtcclxuICAgICAgICAgICAgcmVzdWx0LnB1c2goc3RyaW5nLnNsaWNlKHBvcywgc3RyaW5nLmNoYXJBdChubC0xKSA9PSBcIlxcclwiID8gbmwgLSAxIDogbmwpKTtcclxuICAgICAgICAgICAgcG9zID0gbmwgKyAxO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXN1bHQucHVzaChzdHJpbmcuc2xpY2UocG9zKSk7XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0gOiBmdW5jdGlvbihzdHJpbmcpe3JldHVybiBzdHJpbmcuc3BsaXQoL1xccj9cXG4vKTt9O1xyXG4gICAgQ29kZU1pcnJvci5zcGxpdExpbmVzID0gc3BsaXRMaW5lcztcclxuXHJcbiAgICB2YXIgaGFzU2VsZWN0aW9uID0gd2luZG93LmdldFNlbGVjdGlvbiA/IGZ1bmN0aW9uKHRlKSB7XHJcbiAgICAgICAgdHJ5IHsgcmV0dXJuIHRlLnNlbGVjdGlvblN0YXJ0ICE9IHRlLnNlbGVjdGlvbkVuZDsgfVxyXG4gICAgICAgIGNhdGNoKGUpIHsgcmV0dXJuIGZhbHNlOyB9XHJcbiAgICB9IDogZnVuY3Rpb24odGUpIHtcclxuICAgICAgICB0cnkge3ZhciByYW5nZSA9IHRlLm93bmVyRG9jdW1lbnQuc2VsZWN0aW9uLmNyZWF0ZVJhbmdlKCk7fVxyXG4gICAgICAgIGNhdGNoKGUpIHt9XHJcbiAgICAgICAgaWYgKCFyYW5nZSB8fCByYW5nZS5wYXJlbnRFbGVtZW50KCkgIT0gdGUpIHJldHVybiBmYWxzZTtcclxuICAgICAgICByZXR1cm4gcmFuZ2UuY29tcGFyZUVuZFBvaW50cyhcIlN0YXJ0VG9FbmRcIiwgcmFuZ2UpICE9IDA7XHJcbiAgICB9O1xyXG5cclxuICAgIENvZGVNaXJyb3IuZGVmaW5lTW9kZShcIm51bGxcIiwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHt0b2tlbjogZnVuY3Rpb24oc3RyZWFtKSB7c3RyZWFtLnNraXBUb0VuZCgpO319O1xyXG4gICAgfSk7XHJcbiAgICBDb2RlTWlycm9yLmRlZmluZU1JTUUoXCJ0ZXh0L3BsYWluXCIsIFwibnVsbFwiKTtcclxuXHJcbiAgICB2YXIga2V5TmFtZXMgPSB7MzogXCJFbnRlclwiLCA4OiBcIkJhY2tzcGFjZVwiLCA5OiBcIlRhYlwiLCAxMzogXCJFbnRlclwiLCAxNjogXCJTaGlmdFwiLCAxNzogXCJDdHJsXCIsIDE4OiBcIkFsdFwiLFxyXG4gICAgICAgIDE5OiBcIlBhdXNlXCIsIDIwOiBcIkNhcHNMb2NrXCIsIDI3OiBcIkVzY1wiLCAzMjogXCJTcGFjZVwiLCAzMzogXCJQYWdlVXBcIiwgMzQ6IFwiUGFnZURvd25cIiwgMzU6IFwiRW5kXCIsXHJcbiAgICAgICAgMzY6IFwiSG9tZVwiLCAzNzogXCJMZWZ0XCIsIDM4OiBcIlVwXCIsIDM5OiBcIlJpZ2h0XCIsIDQwOiBcIkRvd25cIiwgNDQ6IFwiUHJpbnRTY3JuXCIsIDQ1OiBcIkluc2VydFwiLFxyXG4gICAgICAgIDQ2OiBcIkRlbGV0ZVwiLCA1OTogXCI7XCIsIDkxOiBcIk1vZFwiLCA5MjogXCJNb2RcIiwgOTM6IFwiTW9kXCIsIDE4NjogXCI7XCIsIDE4NzogXCI9XCIsIDE4ODogXCIsXCIsXHJcbiAgICAgICAgMTg5OiBcIi1cIiwgMTkwOiBcIi5cIiwgMTkxOiBcIi9cIiwgMTkyOiBcImBcIiwgMjE5OiBcIltcIiwgMjIwOiBcIlxcXFxcIiwgMjIxOiBcIl1cIiwgMjIyOiBcIidcIiwgNjMyNzY6IFwiUGFnZVVwXCIsXHJcbiAgICAgICAgNjMyNzc6IFwiUGFnZURvd25cIiwgNjMyNzU6IFwiRW5kXCIsIDYzMjczOiBcIkhvbWVcIiwgNjMyMzQ6IFwiTGVmdFwiLCA2MzIzMjogXCJVcFwiLCA2MzIzNTogXCJSaWdodFwiLFxyXG4gICAgICAgIDYzMjMzOiBcIkRvd25cIiwgNjMzMDI6IFwiSW5zZXJ0XCIsIDYzMjcyOiBcIkRlbGV0ZVwifTtcclxuICAgIENvZGVNaXJyb3Iua2V5TmFtZXMgPSBrZXlOYW1lcztcclxuICAgIChmdW5jdGlvbigpIHtcclxuICAgICAgICAvLyBOdW1iZXIga2V5c1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMTA7IGkrKykga2V5TmFtZXNbaSArIDQ4XSA9IFN0cmluZyhpKTtcclxuICAgICAgICAvLyBBbHBoYWJldGljIGtleXNcclxuICAgICAgICBmb3IgKHZhciBpID0gNjU7IGkgPD0gOTA7IGkrKykga2V5TmFtZXNbaV0gPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGkpO1xyXG4gICAgICAgIC8vIEZ1bmN0aW9uIGtleXNcclxuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8PSAxMjsgaSsrKSBrZXlOYW1lc1tpICsgMTExXSA9IGtleU5hbWVzW2kgKyA2MzIzNV0gPSBcIkZcIiArIGk7XHJcbiAgICB9KSgpO1xyXG5cclxuICAgIHJldHVybiBDb2RlTWlycm9yO1xyXG59KSgpO1xyXG5Db2RlTWlycm9yLmRlZmluZU1vZGUoXCJ4bWxcIiwgZnVuY3Rpb24oY29uZmlnLCBwYXJzZXJDb25maWcpIHtcclxuICAgIHZhciBpbmRlbnRVbml0ID0gY29uZmlnLmluZGVudFVuaXQ7XHJcbiAgICB2YXIgS2x1ZGdlcyA9IHBhcnNlckNvbmZpZy5odG1sTW9kZSA/IHtcclxuICAgICAgICBhdXRvU2VsZkNsb3NlcnM6IHtcImJyXCI6IHRydWUsIFwiaW1nXCI6IHRydWUsIFwiaHJcIjogdHJ1ZSwgXCJsaW5rXCI6IHRydWUsIFwiaW5wdXRcIjogdHJ1ZSxcclxuICAgICAgICAgICAgXCJtZXRhXCI6IHRydWUsIFwiY29sXCI6IHRydWUsIFwiZnJhbWVcIjogdHJ1ZSwgXCJiYXNlXCI6IHRydWUsIFwiYXJlYVwiOiB0cnVlfSxcclxuICAgICAgICBkb05vdEluZGVudDoge1wicHJlXCI6IHRydWV9LFxyXG4gICAgICAgIGFsbG93VW5xdW90ZWQ6IHRydWVcclxuICAgIH0gOiB7YXV0b1NlbGZDbG9zZXJzOiB7fSwgZG9Ob3RJbmRlbnQ6IHt9LCBhbGxvd1VucXVvdGVkOiBmYWxzZX07XHJcbiAgICB2YXIgYWxpZ25DREFUQSA9IHBhcnNlckNvbmZpZy5hbGlnbkNEQVRBO1xyXG5cclxuICAgIC8vIFJldHVybiB2YXJpYWJsZXMgZm9yIHRva2VuaXplcnNcclxuICAgIHZhciB0YWdOYW1lLCB0eXBlO1xyXG5cclxuICAgIGZ1bmN0aW9uIGluVGV4dChzdHJlYW0sIHN0YXRlKSB7XHJcbiAgICAgICAgZnVuY3Rpb24gY2hhaW4ocGFyc2VyKSB7XHJcbiAgICAgICAgICAgIHN0YXRlLnRva2VuaXplID0gcGFyc2VyO1xyXG4gICAgICAgICAgICByZXR1cm4gcGFyc2VyKHN0cmVhbSwgc3RhdGUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGNoID0gc3RyZWFtLm5leHQoKTtcclxuICAgICAgICBpZiAoY2ggPT0gXCI8XCIpIHtcclxuICAgICAgICAgICAgaWYgKHN0cmVhbS5lYXQoXCIhXCIpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc3RyZWFtLmVhdChcIltcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc3RyZWFtLm1hdGNoKFwiQ0RBVEFbXCIpKSByZXR1cm4gY2hhaW4oaW5CbG9jayhcImF0b21cIiwgXCJdXT5cIikpO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChzdHJlYW0ubWF0Y2goXCItLVwiKSkgcmV0dXJuIGNoYWluKGluQmxvY2soXCJjb21tZW50XCIsIFwiLS0+XCIpKTtcclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHN0cmVhbS5tYXRjaChcIkRPQ1RZUEVcIiwgdHJ1ZSwgdHJ1ZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICBzdHJlYW0uZWF0V2hpbGUoL1tcXHdcXC5fXFwtXS8pO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjaGFpbihkb2N0eXBlKDEpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoc3RyZWFtLmVhdChcIj9cIikpIHtcclxuICAgICAgICAgICAgICAgIHN0cmVhbS5lYXRXaGlsZSgvW1xcd1xcLl9cXC1dLyk7XHJcbiAgICAgICAgICAgICAgICBzdGF0ZS50b2tlbml6ZSA9IGluQmxvY2soXCJtZXRhXCIsIFwiPz5cIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJtZXRhXCI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0eXBlID0gc3RyZWFtLmVhdChcIi9cIikgPyBcImNsb3NlVGFnXCIgOiBcIm9wZW5UYWdcIjtcclxuICAgICAgICAgICAgICAgIHN0cmVhbS5lYXRTcGFjZSgpO1xyXG4gICAgICAgICAgICAgICAgdGFnTmFtZSA9IFwiXCI7XHJcbiAgICAgICAgICAgICAgICB2YXIgYztcclxuICAgICAgICAgICAgICAgIHdoaWxlICgoYyA9IHN0cmVhbS5lYXQoL1teXFxzXFx1MDBhMD08PlxcXCJcXCdcXC8/XS8pKSkgdGFnTmFtZSArPSBjO1xyXG4gICAgICAgICAgICAgICAgc3RhdGUudG9rZW5pemUgPSBpblRhZztcclxuICAgICAgICAgICAgICAgIHJldHVybiBcInRhZ1wiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKGNoID09IFwiJlwiKSB7XHJcbiAgICAgICAgICAgIHN0cmVhbS5lYXRXaGlsZSgvW147XS8pO1xyXG4gICAgICAgICAgICBzdHJlYW0uZWF0KFwiO1wiKTtcclxuICAgICAgICAgICAgcmV0dXJuIFwiYXRvbVwiO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgc3RyZWFtLmVhdFdoaWxlKC9bXiY8XS8pO1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gaW5UYWcoc3RyZWFtLCBzdGF0ZSkge1xyXG4gICAgICAgIHZhciBjaCA9IHN0cmVhbS5uZXh0KCk7XHJcbiAgICAgICAgaWYgKGNoID09IFwiPlwiIHx8IChjaCA9PSBcIi9cIiAmJiBzdHJlYW0uZWF0KFwiPlwiKSkpIHtcclxuICAgICAgICAgICAgc3RhdGUudG9rZW5pemUgPSBpblRleHQ7XHJcbiAgICAgICAgICAgIHR5cGUgPSBjaCA9PSBcIj5cIiA/IFwiZW5kVGFnXCIgOiBcInNlbGZjbG9zZVRhZ1wiO1xyXG4gICAgICAgICAgICByZXR1cm4gXCJ0YWdcIjtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoY2ggPT0gXCI9XCIpIHtcclxuICAgICAgICAgICAgdHlwZSA9IFwiZXF1YWxzXCI7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICgvW1xcJ1xcXCJdLy50ZXN0KGNoKSkge1xyXG4gICAgICAgICAgICBzdGF0ZS50b2tlbml6ZSA9IGluQXR0cmlidXRlKGNoKTtcclxuICAgICAgICAgICAgcmV0dXJuIHN0YXRlLnRva2VuaXplKHN0cmVhbSwgc3RhdGUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgc3RyZWFtLmVhdFdoaWxlKC9bXlxcc1xcdTAwYTA9PD5cXFwiXFwnXFwvP10vKTtcclxuICAgICAgICAgICAgcmV0dXJuIFwid29yZFwiO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBpbkF0dHJpYnV0ZShxdW90ZSkge1xyXG4gICAgICAgIHJldHVybiBmdW5jdGlvbihzdHJlYW0sIHN0YXRlKSB7XHJcbiAgICAgICAgICAgIHdoaWxlICghc3RyZWFtLmVvbCgpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc3RyZWFtLm5leHQoKSA9PSBxdW90ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLnRva2VuaXplID0gaW5UYWc7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIFwic3RyaW5nXCI7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBpbkJsb2NrKHN0eWxlLCB0ZXJtaW5hdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHN0cmVhbSwgc3RhdGUpIHtcclxuICAgICAgICAgICAgd2hpbGUgKCFzdHJlYW0uZW9sKCkpIHtcclxuICAgICAgICAgICAgICAgIGlmIChzdHJlYW0ubWF0Y2godGVybWluYXRvcikpIHtcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZS50b2tlbml6ZSA9IGluVGV4dDtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHN0cmVhbS5uZXh0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHN0eWxlO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBkb2N0eXBlKGRlcHRoKSB7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHN0cmVhbSwgc3RhdGUpIHtcclxuICAgICAgICAgICAgdmFyIGNoO1xyXG4gICAgICAgICAgICB3aGlsZSAoKGNoID0gc3RyZWFtLm5leHQoKSkgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGNoID09IFwiPFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUudG9rZW5pemUgPSBkb2N0eXBlKGRlcHRoICsgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN0YXRlLnRva2VuaXplKHN0cmVhbSwgc3RhdGUpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjaCA9PSBcIj5cIikge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkZXB0aCA9PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlLnRva2VuaXplID0gaW5UZXh0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZS50b2tlbml6ZSA9IGRvY3R5cGUoZGVwdGggLSAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN0YXRlLnRva2VuaXplKHN0cmVhbSwgc3RhdGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gXCJtZXRhXCI7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgY3VyU3RhdGUsIHNldFN0eWxlO1xyXG4gICAgZnVuY3Rpb24gcGFzcygpIHtcclxuICAgICAgICBmb3IgKHZhciBpID0gYXJndW1lbnRzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBjdXJTdGF0ZS5jYy5wdXNoKGFyZ3VtZW50c1tpXSk7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBjb250KCkge1xyXG4gICAgICAgIHBhc3MuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBwdXNoQ29udGV4dCh0YWdOYW1lLCBzdGFydE9mTGluZSkge1xyXG4gICAgICAgIHZhciBub0luZGVudCA9IEtsdWRnZXMuZG9Ob3RJbmRlbnQuaGFzT3duUHJvcGVydHkodGFnTmFtZSkgfHwgKGN1clN0YXRlLmNvbnRleHQgJiYgY3VyU3RhdGUuY29udGV4dC5ub0luZGVudCk7XHJcbiAgICAgICAgY3VyU3RhdGUuY29udGV4dCA9IHtcclxuICAgICAgICAgICAgcHJldjogY3VyU3RhdGUuY29udGV4dCxcclxuICAgICAgICAgICAgdGFnTmFtZTogdGFnTmFtZSxcclxuICAgICAgICAgICAgaW5kZW50OiBjdXJTdGF0ZS5pbmRlbnRlZCxcclxuICAgICAgICAgICAgc3RhcnRPZkxpbmU6IHN0YXJ0T2ZMaW5lLFxyXG4gICAgICAgICAgICBub0luZGVudDogbm9JbmRlbnRcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcG9wQ29udGV4dCgpIHtcclxuICAgICAgICBpZiAoY3VyU3RhdGUuY29udGV4dCkgY3VyU3RhdGUuY29udGV4dCA9IGN1clN0YXRlLmNvbnRleHQucHJldjtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBlbGVtZW50KHR5cGUpIHtcclxuICAgICAgICBpZiAodHlwZSA9PSBcIm9wZW5UYWdcIikge1xyXG4gICAgICAgICAgICBjdXJTdGF0ZS50YWdOYW1lID0gdGFnTmFtZTtcclxuICAgICAgICAgICAgcmV0dXJuIGNvbnQoYXR0cmlidXRlcywgZW5kdGFnKGN1clN0YXRlLnN0YXJ0T2ZMaW5lKSk7XHJcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlID09IFwiY2xvc2VUYWdcIikge1xyXG4gICAgICAgICAgICB2YXIgZXJyID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGlmIChjdXJTdGF0ZS5jb250ZXh0KSB7XHJcbiAgICAgICAgICAgICAgICBlcnIgPSBjdXJTdGF0ZS5jb250ZXh0LnRhZ05hbWUgIT0gdGFnTmFtZTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGVyciA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGVycikgc2V0U3R5bGUgPSBcImVycm9yXCI7XHJcbiAgICAgICAgICAgIHJldHVybiBjb250KGVuZGNsb3NldGFnKGVycikpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gY29udCgpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gZW5kdGFnKHN0YXJ0T2ZMaW5lKSB7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHR5cGUpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJzZWxmY2xvc2VUYWdcIiB8fFxyXG4gICAgICAgICAgICAgICAgKHR5cGUgPT0gXCJlbmRUYWdcIiAmJiBLbHVkZ2VzLmF1dG9TZWxmQ2xvc2Vycy5oYXNPd25Qcm9wZXJ0eShjdXJTdGF0ZS50YWdOYW1lLnRvTG93ZXJDYXNlKCkpKSlcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KCk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwiZW5kVGFnXCIpIHtwdXNoQ29udGV4dChjdXJTdGF0ZS50YWdOYW1lLCBzdGFydE9mTGluZSk7IHJldHVybiBjb250KCk7fVxyXG4gICAgICAgICAgICByZXR1cm4gY29udCgpO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBlbmRjbG9zZXRhZyhlcnIpIHtcclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24odHlwZSkge1xyXG4gICAgICAgICAgICBpZiAoZXJyKSBzZXRTdHlsZSA9IFwiZXJyb3JcIjtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJlbmRUYWdcIikgeyBwb3BDb250ZXh0KCk7IHJldHVybiBjb250KCk7IH1cclxuICAgICAgICAgICAgc2V0U3R5bGUgPSBcImVycm9yXCI7XHJcbiAgICAgICAgICAgIHJldHVybiBjb250KGFyZ3VtZW50cy5jYWxsZWUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBhdHRyaWJ1dGVzKHR5cGUpIHtcclxuICAgICAgICBpZiAodHlwZSA9PSBcIndvcmRcIikge3NldFN0eWxlID0gXCJhdHRyaWJ1dGVcIjsgcmV0dXJuIGNvbnQoYXR0cmlidXRlcyk7fVxyXG4gICAgICAgIGlmICh0eXBlID09IFwiZXF1YWxzXCIpIHJldHVybiBjb250KGF0dHZhbHVlLCBhdHRyaWJ1dGVzKTtcclxuICAgICAgICBpZiAodHlwZSA9PSBcInN0cmluZ1wiKSB7c2V0U3R5bGUgPSBcImVycm9yXCI7IHJldHVybiBjb250KGF0dHJpYnV0ZXMpO31cclxuICAgICAgICByZXR1cm4gcGFzcygpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gYXR0dmFsdWUodHlwZSkge1xyXG4gICAgICAgIGlmICh0eXBlID09IFwid29yZFwiICYmIEtsdWRnZXMuYWxsb3dVbnF1b3RlZCkge3NldFN0eWxlID0gXCJzdHJpbmdcIjsgcmV0dXJuIGNvbnQoKTt9XHJcbiAgICAgICAgaWYgKHR5cGUgPT0gXCJzdHJpbmdcIikgcmV0dXJuIGNvbnQoYXR0dmFsdWVtYXliZSk7XHJcbiAgICAgICAgcmV0dXJuIHBhc3MoKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIGF0dHZhbHVlbWF5YmUodHlwZSkge1xyXG4gICAgICAgIGlmICh0eXBlID09IFwic3RyaW5nXCIpIHJldHVybiBjb250KGF0dHZhbHVlbWF5YmUpO1xyXG4gICAgICAgIGVsc2UgcmV0dXJuIHBhc3MoKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHN0YXJ0U3RhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4ge3Rva2VuaXplOiBpblRleHQsIGNjOiBbXSwgaW5kZW50ZWQ6IDAsIHN0YXJ0T2ZMaW5lOiB0cnVlLCB0YWdOYW1lOiBudWxsLCBjb250ZXh0OiBudWxsfTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB0b2tlbjogZnVuY3Rpb24oc3RyZWFtLCBzdGF0ZSkge1xyXG4gICAgICAgICAgICBpZiAoc3RyZWFtLnNvbCgpKSB7XHJcbiAgICAgICAgICAgICAgICBzdGF0ZS5zdGFydE9mTGluZSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBzdGF0ZS5pbmRlbnRlZCA9IHN0cmVhbS5pbmRlbnRhdGlvbigpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChzdHJlYW0uZWF0U3BhY2UoKSkgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgICAgICAgICBzZXRTdHlsZSA9IHR5cGUgPSB0YWdOYW1lID0gbnVsbDtcclxuICAgICAgICAgICAgdmFyIHN0eWxlID0gc3RhdGUudG9rZW5pemUoc3RyZWFtLCBzdGF0ZSk7XHJcbiAgICAgICAgICAgIHN0YXRlLnR5cGUgPSB0eXBlO1xyXG4gICAgICAgICAgICBpZiAoKHN0eWxlIHx8IHR5cGUpICYmIHN0eWxlICE9IFwiY29tbWVudFwiKSB7XHJcbiAgICAgICAgICAgICAgICBjdXJTdGF0ZSA9IHN0YXRlO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKHRydWUpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgY29tYiA9IHN0YXRlLmNjLnBvcCgpIHx8IGVsZW1lbnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbWIodHlwZSB8fCBzdHlsZSkpIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHN0YXRlLnN0YXJ0T2ZMaW5lID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHJldHVybiBzZXRTdHlsZSB8fCBzdHlsZTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBpbmRlbnQ6IGZ1bmN0aW9uKHN0YXRlLCB0ZXh0QWZ0ZXIsIGZ1bGxMaW5lKSB7XHJcbiAgICAgICAgICAgIHZhciBjb250ZXh0ID0gc3RhdGUuY29udGV4dDtcclxuICAgICAgICAgICAgaWYgKChzdGF0ZS50b2tlbml6ZSAhPSBpblRhZyAmJiBzdGF0ZS50b2tlbml6ZSAhPSBpblRleHQpIHx8XHJcbiAgICAgICAgICAgICAgICBjb250ZXh0ICYmIGNvbnRleHQubm9JbmRlbnQpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVsbExpbmUgPyBmdWxsTGluZS5tYXRjaCgvXihcXHMqKS8pWzBdLmxlbmd0aCA6IDA7XHJcbiAgICAgICAgICAgIGlmIChhbGlnbkNEQVRBICYmIC88IVxcW0NEQVRBXFxbLy50ZXN0KHRleHRBZnRlcikpIHJldHVybiAwO1xyXG4gICAgICAgICAgICBpZiAoY29udGV4dCAmJiAvXjxcXC8vLnRlc3QodGV4dEFmdGVyKSlcclxuICAgICAgICAgICAgICAgIGNvbnRleHQgPSBjb250ZXh0LnByZXY7XHJcbiAgICAgICAgICAgIHdoaWxlIChjb250ZXh0ICYmICFjb250ZXh0LnN0YXJ0T2ZMaW5lKVxyXG4gICAgICAgICAgICAgICAgY29udGV4dCA9IGNvbnRleHQucHJldjtcclxuICAgICAgICAgICAgaWYgKGNvbnRleHQpIHJldHVybiBjb250ZXh0LmluZGVudCArIGluZGVudFVuaXQ7XHJcbiAgICAgICAgICAgIGVsc2UgcmV0dXJuIDA7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgY29tcGFyZVN0YXRlczogZnVuY3Rpb24oYSwgYikge1xyXG4gICAgICAgICAgICBpZiAoYS5pbmRlbnRlZCAhPSBiLmluZGVudGVkIHx8IGEudG9rZW5pemUgIT0gYi50b2tlbml6ZSkgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBjYSA9IGEuY29udGV4dCwgY2IgPSBiLmNvbnRleHQ7IDsgY2EgPSBjYS5wcmV2LCBjYiA9IGNiLnByZXYpIHtcclxuICAgICAgICAgICAgICAgIGlmICghY2EgfHwgIWNiKSByZXR1cm4gY2EgPT0gY2I7XHJcbiAgICAgICAgICAgICAgICBpZiAoY2EudGFnTmFtZSAhPSBjYi50YWdOYW1lKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBlbGVjdHJpY0NoYXJzOiBcIi9cIlxyXG4gICAgfTtcclxufSk7XHJcblxyXG5Db2RlTWlycm9yLmRlZmluZU1JTUUoXCJhcHBsaWNhdGlvbi94bWxcIiwgXCJ4bWxcIik7XHJcbkNvZGVNaXJyb3IuZGVmaW5lTUlNRShcInRleHQvaHRtbFwiLCB7bmFtZTogXCJ4bWxcIiwgaHRtbE1vZGU6IHRydWV9KTtcclxuQ29kZU1pcnJvci5kZWZpbmVNb2RlKFwiamF2YXNjcmlwdFwiLCBmdW5jdGlvbihjb25maWcsIHBhcnNlckNvbmZpZykge1xyXG4gICAgdmFyIGluZGVudFVuaXQgPSBjb25maWcuaW5kZW50VW5pdDtcclxuICAgIHZhciBqc29uTW9kZSA9IHBhcnNlckNvbmZpZy5qc29uO1xyXG5cclxuICAgIC8vIFRva2VuaXplclxyXG5cclxuICAgIHZhciBrZXl3b3JkcyA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgZnVuY3Rpb24ga3codHlwZSkge3JldHVybiB7dHlwZTogdHlwZSwgc3R5bGU6IFwia2V5d29yZFwifTt9XHJcbiAgICAgICAgdmFyIEEgPSBrdyhcImtleXdvcmQgYVwiKSwgQiA9IGt3KFwia2V5d29yZCBiXCIpLCBDID0ga3coXCJrZXl3b3JkIGNcIik7XHJcbiAgICAgICAgdmFyIG9wZXJhdG9yID0ga3coXCJvcGVyYXRvclwiKSwgYXRvbSA9IHt0eXBlOiBcImF0b21cIiwgc3R5bGU6IFwiYXRvbVwifTtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBcImlmXCI6IEEsIFwid2hpbGVcIjogQSwgXCJ3aXRoXCI6IEEsIFwiZWxzZVwiOiBCLCBcImRvXCI6IEIsIFwidHJ5XCI6IEIsIFwiZmluYWxseVwiOiBCLFxyXG4gICAgICAgICAgICBcInJldHVyblwiOiBDLCBcImJyZWFrXCI6IEMsIFwiY29udGludWVcIjogQywgXCJuZXdcIjogQywgXCJkZWxldGVcIjogQywgXCJ0aHJvd1wiOiBDLFxyXG4gICAgICAgICAgICBcInZhclwiOiBrdyhcInZhclwiKSwgXCJjb25zdFwiOiBrdyhcInZhclwiKSwgXCJsZXRcIjoga3coXCJ2YXJcIiksXHJcbiAgICAgICAgICAgIFwiZnVuY3Rpb25cIjoga3coXCJmdW5jdGlvblwiKSwgXCJjYXRjaFwiOiBrdyhcImNhdGNoXCIpLFxyXG4gICAgICAgICAgICBcImZvclwiOiBrdyhcImZvclwiKSwgXCJzd2l0Y2hcIjoga3coXCJzd2l0Y2hcIiksIFwiY2FzZVwiOiBrdyhcImNhc2VcIiksIFwiZGVmYXVsdFwiOiBrdyhcImRlZmF1bHRcIiksXHJcbiAgICAgICAgICAgIFwiaW5cIjogb3BlcmF0b3IsIFwidHlwZW9mXCI6IG9wZXJhdG9yLCBcImluc3RhbmNlb2ZcIjogb3BlcmF0b3IsXHJcbiAgICAgICAgICAgIFwidHJ1ZVwiOiBhdG9tLCBcImZhbHNlXCI6IGF0b20sIFwibnVsbFwiOiBhdG9tLCBcInVuZGVmaW5lZFwiOiBhdG9tLCBcIk5hTlwiOiBhdG9tLCBcIkluZmluaXR5XCI6IGF0b21cclxuICAgICAgICB9O1xyXG4gICAgfSgpO1xyXG5cclxuICAgIHZhciBpc09wZXJhdG9yQ2hhciA9IC9bK1xcLSomJT08PiE/fF0vO1xyXG5cclxuICAgIGZ1bmN0aW9uIGNoYWluKHN0cmVhbSwgc3RhdGUsIGYpIHtcclxuICAgICAgICBzdGF0ZS50b2tlbml6ZSA9IGY7XHJcbiAgICAgICAgcmV0dXJuIGYoc3RyZWFtLCBzdGF0ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbmV4dFVudGlsVW5lc2NhcGVkKHN0cmVhbSwgZW5kKSB7XHJcbiAgICAgICAgdmFyIGVzY2FwZWQgPSBmYWxzZSwgbmV4dDtcclxuICAgICAgICB3aGlsZSAoKG5leHQgPSBzdHJlYW0ubmV4dCgpKSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIGlmIChuZXh0ID09IGVuZCAmJiAhZXNjYXBlZClcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgZXNjYXBlZCA9ICFlc2NhcGVkICYmIG5leHQgPT0gXCJcXFxcXCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBlc2NhcGVkO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFVzZWQgYXMgc2NyYXRjaCB2YXJpYWJsZXMgdG8gY29tbXVuaWNhdGUgbXVsdGlwbGUgdmFsdWVzIHdpdGhvdXRcclxuICAgIC8vIGNvbnNpbmcgdXAgdG9ucyBvZiBvYmplY3RzLlxyXG4gICAgdmFyIHR5cGUsIGNvbnRlbnQ7XHJcbiAgICBmdW5jdGlvbiByZXQodHAsIHN0eWxlLCBjb250KSB7XHJcbiAgICAgICAgdHlwZSA9IHRwOyBjb250ZW50ID0gY29udDtcclxuICAgICAgICByZXR1cm4gc3R5bGU7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24ganNUb2tlbkJhc2Uoc3RyZWFtLCBzdGF0ZSkge1xyXG4gICAgICAgIHZhciBjaCA9IHN0cmVhbS5uZXh0KCk7XHJcbiAgICAgICAgaWYgKGNoID09ICdcIicgfHwgY2ggPT0gXCInXCIpXHJcbiAgICAgICAgICAgIHJldHVybiBjaGFpbihzdHJlYW0sIHN0YXRlLCBqc1Rva2VuU3RyaW5nKGNoKSk7XHJcbiAgICAgICAgZWxzZSBpZiAoL1tcXFtcXF17fVxcKFxcKSw7XFw6XFwuXS8udGVzdChjaCkpXHJcbiAgICAgICAgICAgIHJldHVybiByZXQoY2gpO1xyXG4gICAgICAgIGVsc2UgaWYgKGNoID09IFwiMFwiICYmIHN0cmVhbS5lYXQoL3gvaSkpIHtcclxuICAgICAgICAgICAgc3RyZWFtLmVhdFdoaWxlKC9bXFxkYS1mXS9pKTtcclxuICAgICAgICAgICAgcmV0dXJuIHJldChcIm51bWJlclwiLCBcIm51bWJlclwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoL1xcZC8udGVzdChjaCkpIHtcclxuICAgICAgICAgICAgc3RyZWFtLm1hdGNoKC9eXFxkKig/OlxcLlxcZCopPyg/OltlRV1bK1xcLV0/XFxkKyk/Lyk7XHJcbiAgICAgICAgICAgIHJldHVybiByZXQoXCJudW1iZXJcIiwgXCJudW1iZXJcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKGNoID09IFwiL1wiKSB7XHJcbiAgICAgICAgICAgIGlmIChzdHJlYW0uZWF0KFwiKlwiKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNoYWluKHN0cmVhbSwgc3RhdGUsIGpzVG9rZW5Db21tZW50KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmIChzdHJlYW0uZWF0KFwiL1wiKSkge1xyXG4gICAgICAgICAgICAgICAgc3RyZWFtLnNraXBUb0VuZCgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldChcImNvbW1lbnRcIiwgXCJjb21tZW50XCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHN0YXRlLnJlQWxsb3dlZCkge1xyXG4gICAgICAgICAgICAgICAgbmV4dFVudGlsVW5lc2NhcGVkKHN0cmVhbSwgXCIvXCIpO1xyXG4gICAgICAgICAgICAgICAgc3RyZWFtLmVhdFdoaWxlKC9bZ2lteV0vKTsgLy8gJ3knIGlzIFwic3RpY2t5XCIgb3B0aW9uIGluIE1vemlsbGFcclxuICAgICAgICAgICAgICAgIHJldHVybiByZXQoXCJyZWdleHBcIiwgXCJzdHJpbmdcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBzdHJlYW0uZWF0V2hpbGUoaXNPcGVyYXRvckNoYXIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldChcIm9wZXJhdG9yXCIsIG51bGwsIHN0cmVhbS5jdXJyZW50KCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKGNoID09IFwiI1wiKSB7XHJcbiAgICAgICAgICAgIHN0cmVhbS5za2lwVG9FbmQoKTtcclxuICAgICAgICAgICAgcmV0dXJuIHJldChcImVycm9yXCIsIFwiZXJyb3JcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKGlzT3BlcmF0b3JDaGFyLnRlc3QoY2gpKSB7XHJcbiAgICAgICAgICAgIHN0cmVhbS5lYXRXaGlsZShpc09wZXJhdG9yQ2hhcik7XHJcbiAgICAgICAgICAgIHJldHVybiByZXQoXCJvcGVyYXRvclwiLCBudWxsLCBzdHJlYW0uY3VycmVudCgpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHN0cmVhbS5lYXRXaGlsZSgvW1xcd1xcJF9dLyk7XHJcbiAgICAgICAgICAgIHZhciB3b3JkID0gc3RyZWFtLmN1cnJlbnQoKSwga25vd24gPSBrZXl3b3Jkcy5wcm9wZXJ0eUlzRW51bWVyYWJsZSh3b3JkKSAmJiBrZXl3b3Jkc1t3b3JkXTtcclxuICAgICAgICAgICAgcmV0dXJuIChrbm93biAmJiBzdGF0ZS5rd0FsbG93ZWQpID8gcmV0KGtub3duLnR5cGUsIGtub3duLnN0eWxlLCB3b3JkKSA6XHJcbiAgICAgICAgICAgICAgICByZXQoXCJ2YXJpYWJsZVwiLCBcInZhcmlhYmxlXCIsIHdvcmQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBqc1Rva2VuU3RyaW5nKHF1b3RlKSB7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHN0cmVhbSwgc3RhdGUpIHtcclxuICAgICAgICAgICAgaWYgKCFuZXh0VW50aWxVbmVzY2FwZWQoc3RyZWFtLCBxdW90ZSkpXHJcbiAgICAgICAgICAgICAgICBzdGF0ZS50b2tlbml6ZSA9IGpzVG9rZW5CYXNlO1xyXG4gICAgICAgICAgICByZXR1cm4gcmV0KFwic3RyaW5nXCIsIFwic3RyaW5nXCIpO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24ganNUb2tlbkNvbW1lbnQoc3RyZWFtLCBzdGF0ZSkge1xyXG4gICAgICAgIHZhciBtYXliZUVuZCA9IGZhbHNlLCBjaDtcclxuICAgICAgICB3aGlsZSAoY2ggPSBzdHJlYW0ubmV4dCgpKSB7XHJcbiAgICAgICAgICAgIGlmIChjaCA9PSBcIi9cIiAmJiBtYXliZUVuZCkge1xyXG4gICAgICAgICAgICAgICAgc3RhdGUudG9rZW5pemUgPSBqc1Rva2VuQmFzZTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIG1heWJlRW5kID0gKGNoID09IFwiKlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJldChcImNvbW1lbnRcIiwgXCJjb21tZW50XCIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFBhcnNlclxyXG5cclxuICAgIHZhciBhdG9taWNUeXBlcyA9IHtcImF0b21cIjogdHJ1ZSwgXCJudW1iZXJcIjogdHJ1ZSwgXCJ2YXJpYWJsZVwiOiB0cnVlLCBcInN0cmluZ1wiOiB0cnVlLCBcInJlZ2V4cFwiOiB0cnVlfTtcclxuXHJcbiAgICBmdW5jdGlvbiBKU0xleGljYWwoaW5kZW50ZWQsIGNvbHVtbiwgdHlwZSwgYWxpZ24sIHByZXYsIGluZm8pIHtcclxuICAgICAgICB0aGlzLmluZGVudGVkID0gaW5kZW50ZWQ7XHJcbiAgICAgICAgdGhpcy5jb2x1bW4gPSBjb2x1bW47XHJcbiAgICAgICAgdGhpcy50eXBlID0gdHlwZTtcclxuICAgICAgICB0aGlzLnByZXYgPSBwcmV2O1xyXG4gICAgICAgIHRoaXMuaW5mbyA9IGluZm87XHJcbiAgICAgICAgaWYgKGFsaWduICE9IG51bGwpIHRoaXMuYWxpZ24gPSBhbGlnbjtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBpblNjb3BlKHN0YXRlLCB2YXJuYW1lKSB7XHJcbiAgICAgICAgZm9yICh2YXIgdiA9IHN0YXRlLmxvY2FsVmFyczsgdjsgdiA9IHYubmV4dClcclxuICAgICAgICAgICAgaWYgKHYubmFtZSA9PSB2YXJuYW1lKSByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBwYXJzZUpTKHN0YXRlLCBzdHlsZSwgdHlwZSwgY29udGVudCwgc3RyZWFtKSB7XHJcbiAgICAgICAgdmFyIGNjID0gc3RhdGUuY2M7XHJcbiAgICAgICAgLy8gQ29tbXVuaWNhdGUgb3VyIGNvbnRleHQgdG8gdGhlIGNvbWJpbmF0b3JzLlxyXG4gICAgICAgIC8vIChMZXNzIHdhc3RlZnVsIHRoYW4gY29uc2luZyB1cCBhIGh1bmRyZWQgY2xvc3VyZXMgb24gZXZlcnkgY2FsbC4pXHJcbiAgICAgICAgY3guc3RhdGUgPSBzdGF0ZTsgY3guc3RyZWFtID0gc3RyZWFtOyBjeC5tYXJrZWQgPSBudWxsLCBjeC5jYyA9IGNjO1xyXG5cclxuICAgICAgICBpZiAoIXN0YXRlLmxleGljYWwuaGFzT3duUHJvcGVydHkoXCJhbGlnblwiKSlcclxuICAgICAgICAgICAgc3RhdGUubGV4aWNhbC5hbGlnbiA9IHRydWU7XHJcblxyXG4gICAgICAgIHdoaWxlKHRydWUpIHtcclxuICAgICAgICAgICAgdmFyIGNvbWJpbmF0b3IgPSBjYy5sZW5ndGggPyBjYy5wb3AoKSA6IGpzb25Nb2RlID8gZXhwcmVzc2lvbiA6IHN0YXRlbWVudDtcclxuICAgICAgICAgICAgaWYgKGNvbWJpbmF0b3IodHlwZSwgY29udGVudCkpIHtcclxuICAgICAgICAgICAgICAgIHdoaWxlKGNjLmxlbmd0aCAmJiBjY1tjYy5sZW5ndGggLSAxXS5sZXgpXHJcbiAgICAgICAgICAgICAgICAgICAgY2MucG9wKCkoKTtcclxuICAgICAgICAgICAgICAgIGlmIChjeC5tYXJrZWQpIHJldHVybiBjeC5tYXJrZWQ7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZSA9PSBcInZhcmlhYmxlXCIgJiYgaW5TY29wZShzdGF0ZSwgY29udGVudCkpIHJldHVybiBcInZhcmlhYmxlLTJcIjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBzdHlsZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBDb21iaW5hdG9yIHV0aWxzXHJcblxyXG4gICAgdmFyIGN4ID0ge3N0YXRlOiBudWxsLCBjb2x1bW46IG51bGwsIG1hcmtlZDogbnVsbCwgY2M6IG51bGx9O1xyXG4gICAgZnVuY3Rpb24gcGFzcygpIHtcclxuICAgICAgICBmb3IgKHZhciBpID0gYXJndW1lbnRzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBjeC5jYy5wdXNoKGFyZ3VtZW50c1tpXSk7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBjb250KCkge1xyXG4gICAgICAgIHBhc3MuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHJlZ2lzdGVyKHZhcm5hbWUpIHtcclxuICAgICAgICB2YXIgc3RhdGUgPSBjeC5zdGF0ZTtcclxuICAgICAgICBpZiAoc3RhdGUuY29udGV4dCkge1xyXG4gICAgICAgICAgICBjeC5tYXJrZWQgPSBcImRlZlwiO1xyXG4gICAgICAgICAgICBmb3IgKHZhciB2ID0gc3RhdGUubG9jYWxWYXJzOyB2OyB2ID0gdi5uZXh0KVxyXG4gICAgICAgICAgICAgICAgaWYgKHYubmFtZSA9PSB2YXJuYW1lKSByZXR1cm47XHJcbiAgICAgICAgICAgIHN0YXRlLmxvY2FsVmFycyA9IHtuYW1lOiB2YXJuYW1lLCBuZXh0OiBzdGF0ZS5sb2NhbFZhcnN9O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBDb21iaW5hdG9yc1xyXG5cclxuICAgIHZhciBkZWZhdWx0VmFycyA9IHtuYW1lOiBcInRoaXNcIiwgbmV4dDoge25hbWU6IFwiYXJndW1lbnRzXCJ9fTtcclxuICAgIGZ1bmN0aW9uIHB1c2hjb250ZXh0KCkge1xyXG4gICAgICAgIGlmICghY3guc3RhdGUuY29udGV4dCkgY3guc3RhdGUubG9jYWxWYXJzID0gZGVmYXVsdFZhcnM7XHJcbiAgICAgICAgY3guc3RhdGUuY29udGV4dCA9IHtwcmV2OiBjeC5zdGF0ZS5jb250ZXh0LCB2YXJzOiBjeC5zdGF0ZS5sb2NhbFZhcnN9O1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcG9wY29udGV4dCgpIHtcclxuICAgICAgICBjeC5zdGF0ZS5sb2NhbFZhcnMgPSBjeC5zdGF0ZS5jb250ZXh0LnZhcnM7XHJcbiAgICAgICAgY3guc3RhdGUuY29udGV4dCA9IGN4LnN0YXRlLmNvbnRleHQucHJldjtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHB1c2hsZXgodHlwZSwgaW5mbykge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgdmFyIHN0YXRlID0gY3guc3RhdGU7XHJcbiAgICAgICAgICAgIHN0YXRlLmxleGljYWwgPSBuZXcgSlNMZXhpY2FsKHN0YXRlLmluZGVudGVkLCBjeC5zdHJlYW0uY29sdW1uKCksIHR5cGUsIG51bGwsIHN0YXRlLmxleGljYWwsIGluZm8pXHJcbiAgICAgICAgfTtcclxuICAgICAgICByZXN1bHQubGV4ID0gdHJ1ZTtcclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcG9wbGV4KCkge1xyXG4gICAgICAgIHZhciBzdGF0ZSA9IGN4LnN0YXRlO1xyXG4gICAgICAgIGlmIChzdGF0ZS5sZXhpY2FsLnByZXYpIHtcclxuICAgICAgICAgICAgaWYgKHN0YXRlLmxleGljYWwudHlwZSA9PSBcIilcIilcclxuICAgICAgICAgICAgICAgIHN0YXRlLmluZGVudGVkID0gc3RhdGUubGV4aWNhbC5pbmRlbnRlZDtcclxuICAgICAgICAgICAgc3RhdGUubGV4aWNhbCA9IHN0YXRlLmxleGljYWwucHJldjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBwb3BsZXgubGV4ID0gdHJ1ZTtcclxuXHJcbiAgICBmdW5jdGlvbiBleHBlY3Qod2FudGVkKSB7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIGV4cGVjdGluZyh0eXBlKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IHdhbnRlZCkgcmV0dXJuIGNvbnQoKTtcclxuICAgICAgICAgICAgZWxzZSBpZiAod2FudGVkID09IFwiO1wiKSByZXR1cm4gcGFzcygpO1xyXG4gICAgICAgICAgICBlbHNlIHJldHVybiBjb250KGFyZ3VtZW50cy5jYWxsZWUpO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gc3RhdGVtZW50KHR5cGUpIHtcclxuICAgICAgICBpZiAodHlwZSA9PSBcInZhclwiKSByZXR1cm4gY29udChwdXNobGV4KFwidmFyZGVmXCIpLCB2YXJkZWYxLCBleHBlY3QoXCI7XCIpLCBwb3BsZXgpO1xyXG4gICAgICAgIGlmICh0eXBlID09IFwia2V5d29yZCBhXCIpIHJldHVybiBjb250KHB1c2hsZXgoXCJmb3JtXCIpLCBleHByZXNzaW9uLCBzdGF0ZW1lbnQsIHBvcGxleCk7XHJcbiAgICAgICAgaWYgKHR5cGUgPT0gXCJrZXl3b3JkIGJcIikgcmV0dXJuIGNvbnQocHVzaGxleChcImZvcm1cIiksIHN0YXRlbWVudCwgcG9wbGV4KTtcclxuICAgICAgICBpZiAodHlwZSA9PSBcIntcIikgcmV0dXJuIGNvbnQocHVzaGxleChcIn1cIiksIGJsb2NrLCBwb3BsZXgpO1xyXG4gICAgICAgIGlmICh0eXBlID09IFwiO1wiKSByZXR1cm4gY29udCgpO1xyXG4gICAgICAgIGlmICh0eXBlID09IFwiZnVuY3Rpb25cIikgcmV0dXJuIGNvbnQoZnVuY3Rpb25kZWYpO1xyXG4gICAgICAgIGlmICh0eXBlID09IFwiZm9yXCIpIHJldHVybiBjb250KHB1c2hsZXgoXCJmb3JtXCIpLCBleHBlY3QoXCIoXCIpLCBwdXNobGV4KFwiKVwiKSwgZm9yc3BlYzEsIGV4cGVjdChcIilcIiksXHJcbiAgICAgICAgICAgIHBvcGxleCwgc3RhdGVtZW50LCBwb3BsZXgpO1xyXG4gICAgICAgIGlmICh0eXBlID09IFwidmFyaWFibGVcIikgcmV0dXJuIGNvbnQocHVzaGxleChcInN0YXRcIiksIG1heWJlbGFiZWwpO1xyXG4gICAgICAgIGlmICh0eXBlID09IFwic3dpdGNoXCIpIHJldHVybiBjb250KHB1c2hsZXgoXCJmb3JtXCIpLCBleHByZXNzaW9uLCBwdXNobGV4KFwifVwiLCBcInN3aXRjaFwiKSwgZXhwZWN0KFwie1wiKSxcclxuICAgICAgICAgICAgYmxvY2ssIHBvcGxleCwgcG9wbGV4KTtcclxuICAgICAgICBpZiAodHlwZSA9PSBcImNhc2VcIikgcmV0dXJuIGNvbnQoZXhwcmVzc2lvbiwgZXhwZWN0KFwiOlwiKSk7XHJcbiAgICAgICAgaWYgKHR5cGUgPT0gXCJkZWZhdWx0XCIpIHJldHVybiBjb250KGV4cGVjdChcIjpcIikpO1xyXG4gICAgICAgIGlmICh0eXBlID09IFwiY2F0Y2hcIikgcmV0dXJuIGNvbnQocHVzaGxleChcImZvcm1cIiksIHB1c2hjb250ZXh0LCBleHBlY3QoXCIoXCIpLCBmdW5hcmcsIGV4cGVjdChcIilcIiksXHJcbiAgICAgICAgICAgIHN0YXRlbWVudCwgcG9wbGV4LCBwb3Bjb250ZXh0KTtcclxuICAgICAgICByZXR1cm4gcGFzcyhwdXNobGV4KFwic3RhdFwiKSwgZXhwcmVzc2lvbiwgZXhwZWN0KFwiO1wiKSwgcG9wbGV4KTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIGV4cHJlc3Npb24odHlwZSkge1xyXG4gICAgICAgIGlmIChhdG9taWNUeXBlcy5oYXNPd25Qcm9wZXJ0eSh0eXBlKSkgcmV0dXJuIGNvbnQobWF5YmVvcGVyYXRvcik7XHJcbiAgICAgICAgaWYgKHR5cGUgPT0gXCJmdW5jdGlvblwiKSByZXR1cm4gY29udChmdW5jdGlvbmRlZik7XHJcbiAgICAgICAgaWYgKHR5cGUgPT0gXCJrZXl3b3JkIGNcIikgcmV0dXJuIGNvbnQobWF5YmVleHByZXNzaW9uKTtcclxuICAgICAgICBpZiAodHlwZSA9PSBcIihcIikgcmV0dXJuIGNvbnQocHVzaGxleChcIilcIiksIGV4cHJlc3Npb24sIGV4cGVjdChcIilcIiksIHBvcGxleCwgbWF5YmVvcGVyYXRvcik7XHJcbiAgICAgICAgaWYgKHR5cGUgPT0gXCJvcGVyYXRvclwiKSByZXR1cm4gY29udChleHByZXNzaW9uKTtcclxuICAgICAgICBpZiAodHlwZSA9PSBcIltcIikgcmV0dXJuIGNvbnQocHVzaGxleChcIl1cIiksIGNvbW1hc2VwKGV4cHJlc3Npb24sIFwiXVwiKSwgcG9wbGV4LCBtYXliZW9wZXJhdG9yKTtcclxuICAgICAgICBpZiAodHlwZSA9PSBcIntcIikgcmV0dXJuIGNvbnQocHVzaGxleChcIn1cIiksIGNvbW1hc2VwKG9ianByb3AsIFwifVwiKSwgcG9wbGV4LCBtYXliZW9wZXJhdG9yKTtcclxuICAgICAgICByZXR1cm4gY29udCgpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gbWF5YmVleHByZXNzaW9uKHR5cGUpIHtcclxuICAgICAgICBpZiAodHlwZS5tYXRjaCgvWztcXH1cXClcXF0sXS8pKSByZXR1cm4gcGFzcygpO1xyXG4gICAgICAgIHJldHVybiBwYXNzKGV4cHJlc3Npb24pO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIG1heWJlb3BlcmF0b3IodHlwZSwgdmFsdWUpIHtcclxuICAgICAgICBpZiAodHlwZSA9PSBcIm9wZXJhdG9yXCIgJiYgL1xcK1xcK3wtLS8udGVzdCh2YWx1ZSkpIHJldHVybiBjb250KG1heWJlb3BlcmF0b3IpO1xyXG4gICAgICAgIGlmICh0eXBlID09IFwib3BlcmF0b3JcIikgcmV0dXJuIGNvbnQoZXhwcmVzc2lvbik7XHJcbiAgICAgICAgaWYgKHR5cGUgPT0gXCI7XCIpIHJldHVybjtcclxuICAgICAgICBpZiAodHlwZSA9PSBcIihcIikgcmV0dXJuIGNvbnQocHVzaGxleChcIilcIiksIGNvbW1hc2VwKGV4cHJlc3Npb24sIFwiKVwiKSwgcG9wbGV4LCBtYXliZW9wZXJhdG9yKTtcclxuICAgICAgICBpZiAodHlwZSA9PSBcIi5cIikgcmV0dXJuIGNvbnQocHJvcGVydHksIG1heWJlb3BlcmF0b3IpO1xyXG4gICAgICAgIGlmICh0eXBlID09IFwiW1wiKSByZXR1cm4gY29udChwdXNobGV4KFwiXVwiKSwgZXhwcmVzc2lvbiwgZXhwZWN0KFwiXVwiKSwgcG9wbGV4LCBtYXliZW9wZXJhdG9yKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIG1heWJlbGFiZWwodHlwZSkge1xyXG4gICAgICAgIGlmICh0eXBlID09IFwiOlwiKSByZXR1cm4gY29udChwb3BsZXgsIHN0YXRlbWVudCk7XHJcbiAgICAgICAgcmV0dXJuIHBhc3MobWF5YmVvcGVyYXRvciwgZXhwZWN0KFwiO1wiKSwgcG9wbGV4KTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHByb3BlcnR5KHR5cGUpIHtcclxuICAgICAgICBpZiAodHlwZSA9PSBcInZhcmlhYmxlXCIpIHtjeC5tYXJrZWQgPSBcInByb3BlcnR5XCI7IHJldHVybiBjb250KCk7fVxyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gb2JqcHJvcCh0eXBlKSB7XHJcbiAgICAgICAgaWYgKHR5cGUgPT0gXCJ2YXJpYWJsZVwiKSBjeC5tYXJrZWQgPSBcInByb3BlcnR5XCI7XHJcbiAgICAgICAgaWYgKGF0b21pY1R5cGVzLmhhc093blByb3BlcnR5KHR5cGUpKSByZXR1cm4gY29udChleHBlY3QoXCI6XCIpLCBleHByZXNzaW9uKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIGNvbW1hc2VwKHdoYXQsIGVuZCkge1xyXG4gICAgICAgIGZ1bmN0aW9uIHByb2NlZWQodHlwZSkge1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcIixcIikgcmV0dXJuIGNvbnQod2hhdCwgcHJvY2VlZCk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IGVuZCkgcmV0dXJuIGNvbnQoKTtcclxuICAgICAgICAgICAgcmV0dXJuIGNvbnQoZXhwZWN0KGVuZCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gY29tbWFTZXBhcmF0ZWQodHlwZSkge1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBlbmQpIHJldHVybiBjb250KCk7XHJcbiAgICAgICAgICAgIGVsc2UgcmV0dXJuIHBhc3Mod2hhdCwgcHJvY2VlZCk7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIGJsb2NrKHR5cGUpIHtcclxuICAgICAgICBpZiAodHlwZSA9PSBcIn1cIikgcmV0dXJuIGNvbnQoKTtcclxuICAgICAgICByZXR1cm4gcGFzcyhzdGF0ZW1lbnQsIGJsb2NrKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHZhcmRlZjEodHlwZSwgdmFsdWUpIHtcclxuICAgICAgICBpZiAodHlwZSA9PSBcInZhcmlhYmxlXCIpe3JlZ2lzdGVyKHZhbHVlKTsgcmV0dXJuIGNvbnQodmFyZGVmMik7fVxyXG4gICAgICAgIHJldHVybiBjb250KCk7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiB2YXJkZWYyKHR5cGUsIHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKHZhbHVlID09IFwiPVwiKSByZXR1cm4gY29udChleHByZXNzaW9uLCB2YXJkZWYyKTtcclxuICAgICAgICBpZiAodHlwZSA9PSBcIixcIikgcmV0dXJuIGNvbnQodmFyZGVmMSk7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBmb3JzcGVjMSh0eXBlKSB7XHJcbiAgICAgICAgaWYgKHR5cGUgPT0gXCJ2YXJcIikgcmV0dXJuIGNvbnQodmFyZGVmMSwgZm9yc3BlYzIpO1xyXG4gICAgICAgIGlmICh0eXBlID09IFwiO1wiKSByZXR1cm4gcGFzcyhmb3JzcGVjMik7XHJcbiAgICAgICAgaWYgKHR5cGUgPT0gXCJ2YXJpYWJsZVwiKSByZXR1cm4gY29udChmb3JtYXliZWluKTtcclxuICAgICAgICByZXR1cm4gcGFzcyhmb3JzcGVjMik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBmb3JtYXliZWluKHR5cGUsIHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKHZhbHVlID09IFwiaW5cIikgcmV0dXJuIGNvbnQoZXhwcmVzc2lvbik7XHJcbiAgICAgICAgcmV0dXJuIGNvbnQobWF5YmVvcGVyYXRvciwgZm9yc3BlYzIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gZm9yc3BlYzIodHlwZSwgdmFsdWUpIHtcclxuICAgICAgICBpZiAodHlwZSA9PSBcIjtcIikgcmV0dXJuIGNvbnQoZm9yc3BlYzMpO1xyXG4gICAgICAgIGlmICh2YWx1ZSA9PSBcImluXCIpIHJldHVybiBjb250KGV4cHJlc3Npb24pO1xyXG4gICAgICAgIHJldHVybiBjb250KGV4cHJlc3Npb24sIGV4cGVjdChcIjtcIiksIGZvcnNwZWMzKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIGZvcnNwZWMzKHR5cGUpIHtcclxuICAgICAgICBpZiAodHlwZSAhPSBcIilcIikgY29udChleHByZXNzaW9uKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIGZ1bmN0aW9uZGVmKHR5cGUsIHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKHR5cGUgPT0gXCJ2YXJpYWJsZVwiKSB7cmVnaXN0ZXIodmFsdWUpOyByZXR1cm4gY29udChmdW5jdGlvbmRlZik7fVxyXG4gICAgICAgIGlmICh0eXBlID09IFwiKFwiKSByZXR1cm4gY29udChwdXNobGV4KFwiKVwiKSwgcHVzaGNvbnRleHQsIGNvbW1hc2VwKGZ1bmFyZywgXCIpXCIpLCBwb3BsZXgsIHN0YXRlbWVudCwgcG9wY29udGV4dCk7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBmdW5hcmcodHlwZSwgdmFsdWUpIHtcclxuICAgICAgICBpZiAodHlwZSA9PSBcInZhcmlhYmxlXCIpIHtyZWdpc3Rlcih2YWx1ZSk7IHJldHVybiBjb250KCk7fVxyXG4gICAgfVxyXG5cclxuICAgIC8vIEludGVyZmFjZVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgc3RhcnRTdGF0ZTogZnVuY3Rpb24oYmFzZWNvbHVtbikge1xyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgdG9rZW5pemU6IGpzVG9rZW5CYXNlLFxyXG4gICAgICAgICAgICAgICAgcmVBbGxvd2VkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAga3dBbGxvd2VkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgY2M6IFtdLFxyXG4gICAgICAgICAgICAgICAgbGV4aWNhbDogbmV3IEpTTGV4aWNhbCgoYmFzZWNvbHVtbiB8fCAwKSAtIGluZGVudFVuaXQsIDAsIFwiYmxvY2tcIiwgZmFsc2UpLFxyXG4gICAgICAgICAgICAgICAgbG9jYWxWYXJzOiBudWxsLFxyXG4gICAgICAgICAgICAgICAgY29udGV4dDogbnVsbCxcclxuICAgICAgICAgICAgICAgIGluZGVudGVkOiAwXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgdG9rZW46IGZ1bmN0aW9uKHN0cmVhbSwgc3RhdGUpIHtcclxuICAgICAgICAgICAgaWYgKHN0cmVhbS5zb2woKSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFzdGF0ZS5sZXhpY2FsLmhhc093blByb3BlcnR5KFwiYWxpZ25cIikpXHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUubGV4aWNhbC5hbGlnbiA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgc3RhdGUuaW5kZW50ZWQgPSBzdHJlYW0uaW5kZW50YXRpb24oKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoc3RyZWFtLmVhdFNwYWNlKCkpIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICB2YXIgc3R5bGUgPSBzdGF0ZS50b2tlbml6ZShzdHJlYW0sIHN0YXRlKTtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJjb21tZW50XCIpIHJldHVybiBzdHlsZTtcclxuICAgICAgICAgICAgc3RhdGUucmVBbGxvd2VkID0gdHlwZSA9PSBcIm9wZXJhdG9yXCIgfHwgdHlwZSA9PSBcImtleXdvcmQgY1wiIHx8IHR5cGUubWF0Y2goL15bXFxbe31cXCgsOzpdJC8pO1xyXG4gICAgICAgICAgICBzdGF0ZS5rd0FsbG93ZWQgPSB0eXBlICE9ICcuJztcclxuICAgICAgICAgICAgcmV0dXJuIHBhcnNlSlMoc3RhdGUsIHN0eWxlLCB0eXBlLCBjb250ZW50LCBzdHJlYW0pO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGluZGVudDogZnVuY3Rpb24oc3RhdGUsIHRleHRBZnRlcikge1xyXG4gICAgICAgICAgICBpZiAoc3RhdGUudG9rZW5pemUgIT0ganNUb2tlbkJhc2UpIHJldHVybiAwO1xyXG4gICAgICAgICAgICB2YXIgZmlyc3RDaGFyID0gdGV4dEFmdGVyICYmIHRleHRBZnRlci5jaGFyQXQoMCksIGxleGljYWwgPSBzdGF0ZS5sZXhpY2FsLFxyXG4gICAgICAgICAgICAgICAgdHlwZSA9IGxleGljYWwudHlwZSwgY2xvc2luZyA9IGZpcnN0Q2hhciA9PSB0eXBlO1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcInZhcmRlZlwiKSByZXR1cm4gbGV4aWNhbC5pbmRlbnRlZCArIDQ7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHR5cGUgPT0gXCJmb3JtXCIgJiYgZmlyc3RDaGFyID09IFwie1wiKSByZXR1cm4gbGV4aWNhbC5pbmRlbnRlZDtcclxuICAgICAgICAgICAgZWxzZSBpZiAodHlwZSA9PSBcInN0YXRcIiB8fCB0eXBlID09IFwiZm9ybVwiKSByZXR1cm4gbGV4aWNhbC5pbmRlbnRlZCArIGluZGVudFVuaXQ7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKGxleGljYWwuaW5mbyA9PSBcInN3aXRjaFwiICYmICFjbG9zaW5nKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxleGljYWwuaW5kZW50ZWQgKyAoL14oPzpjYXNlfGRlZmF1bHQpXFxiLy50ZXN0KHRleHRBZnRlcikgPyBpbmRlbnRVbml0IDogMiAqIGluZGVudFVuaXQpO1xyXG4gICAgICAgICAgICBlbHNlIGlmIChsZXhpY2FsLmFsaWduKSByZXR1cm4gbGV4aWNhbC5jb2x1bW4gKyAoY2xvc2luZyA/IDAgOiAxKTtcclxuICAgICAgICAgICAgZWxzZSByZXR1cm4gbGV4aWNhbC5pbmRlbnRlZCArIChjbG9zaW5nID8gMCA6IGluZGVudFVuaXQpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGVsZWN0cmljQ2hhcnM6IFwiOnt9XCJcclxuICAgIH07XHJcbn0pO1xyXG5cclxuQ29kZU1pcnJvci5kZWZpbmVNSU1FKFwidGV4dC9qYXZhc2NyaXB0XCIsIFwiamF2YXNjcmlwdFwiKTtcclxuQ29kZU1pcnJvci5kZWZpbmVNSU1FKFwiYXBwbGljYXRpb24vanNvblwiLCB7bmFtZTogXCJqYXZhc2NyaXB0XCIsIGpzb246IHRydWV9KTtcclxuXHJcbkNvZGVNaXJyb3IuZGVmaW5lTW9kZShcImNzc1wiLCBmdW5jdGlvbihjb25maWcpIHtcclxuICAgIHZhciBpbmRlbnRVbml0ID0gY29uZmlnLmluZGVudFVuaXQsIHR5cGU7XHJcbiAgICBmdW5jdGlvbiByZXQoc3R5bGUsIHRwKSB7dHlwZSA9IHRwOyByZXR1cm4gc3R5bGU7fVxyXG5cclxuICAgIGZ1bmN0aW9uIHRva2VuQmFzZShzdHJlYW0sIHN0YXRlKSB7XHJcbiAgICAgICAgdmFyIGNoID0gc3RyZWFtLm5leHQoKTtcclxuICAgICAgICBpZiAoY2ggPT0gXCJAXCIpIHtzdHJlYW0uZWF0V2hpbGUoL1tcXHdcXFxcXFwtXS8pOyByZXR1cm4gcmV0KFwibWV0YVwiLCBzdHJlYW0uY3VycmVudCgpKTt9XHJcbiAgICAgICAgZWxzZSBpZiAoY2ggPT0gXCIvXCIgJiYgc3RyZWFtLmVhdChcIipcIikpIHtcclxuICAgICAgICAgICAgc3RhdGUudG9rZW5pemUgPSB0b2tlbkNDb21tZW50O1xyXG4gICAgICAgICAgICByZXR1cm4gdG9rZW5DQ29tbWVudChzdHJlYW0sIHN0YXRlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoY2ggPT0gXCI8XCIgJiYgc3RyZWFtLmVhdChcIiFcIikpIHtcclxuICAgICAgICAgICAgc3RhdGUudG9rZW5pemUgPSB0b2tlblNHTUxDb21tZW50O1xyXG4gICAgICAgICAgICByZXR1cm4gdG9rZW5TR01MQ29tbWVudChzdHJlYW0sIHN0YXRlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoY2ggPT0gXCI9XCIpIHJldChudWxsLCBcImNvbXBhcmVcIik7XHJcbiAgICAgICAgZWxzZSBpZiAoKGNoID09IFwiflwiIHx8IGNoID09IFwifFwiKSAmJiBzdHJlYW0uZWF0KFwiPVwiKSkgcmV0dXJuIHJldChudWxsLCBcImNvbXBhcmVcIik7XHJcbiAgICAgICAgZWxzZSBpZiAoY2ggPT0gXCJcXFwiXCIgfHwgY2ggPT0gXCInXCIpIHtcclxuICAgICAgICAgICAgc3RhdGUudG9rZW5pemUgPSB0b2tlblN0cmluZyhjaCk7XHJcbiAgICAgICAgICAgIHJldHVybiBzdGF0ZS50b2tlbml6ZShzdHJlYW0sIHN0YXRlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoY2ggPT0gXCIjXCIpIHtcclxuICAgICAgICAgICAgc3RyZWFtLmVhdFdoaWxlKC9bXFx3XFxcXFxcLV0vKTtcclxuICAgICAgICAgICAgcmV0dXJuIHJldChcImF0b21cIiwgXCJoYXNoXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChjaCA9PSBcIiFcIikge1xyXG4gICAgICAgICAgICBzdHJlYW0ubWF0Y2goL15cXHMqXFx3Ki8pO1xyXG4gICAgICAgICAgICByZXR1cm4gcmV0KFwia2V5d29yZFwiLCBcImltcG9ydGFudFwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoL1xcZC8udGVzdChjaCkpIHtcclxuICAgICAgICAgICAgc3RyZWFtLmVhdFdoaWxlKC9bXFx3LiVdLyk7XHJcbiAgICAgICAgICAgIHJldHVybiByZXQoXCJudW1iZXJcIiwgXCJ1bml0XCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICgvWywuKz4qXFwvXS8udGVzdChjaCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJldChudWxsLCBcInNlbGVjdC1vcFwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoL1s7e306XFxbXFxdXS8udGVzdChjaCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJldChudWxsLCBjaCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBzdHJlYW0uZWF0V2hpbGUoL1tcXHdcXFxcXFwtXS8pO1xyXG4gICAgICAgICAgICByZXR1cm4gcmV0KFwidmFyaWFibGVcIiwgXCJ2YXJpYWJsZVwiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gdG9rZW5DQ29tbWVudChzdHJlYW0sIHN0YXRlKSB7XHJcbiAgICAgICAgdmFyIG1heWJlRW5kID0gZmFsc2UsIGNoO1xyXG4gICAgICAgIHdoaWxlICgoY2ggPSBzdHJlYW0ubmV4dCgpKSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIGlmIChtYXliZUVuZCAmJiBjaCA9PSBcIi9cIikge1xyXG4gICAgICAgICAgICAgICAgc3RhdGUudG9rZW5pemUgPSB0b2tlbkJhc2U7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBtYXliZUVuZCA9IChjaCA9PSBcIipcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXQoXCJjb21tZW50XCIsIFwiY29tbWVudFwiKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiB0b2tlblNHTUxDb21tZW50KHN0cmVhbSwgc3RhdGUpIHtcclxuICAgICAgICB2YXIgZGFzaGVzID0gMCwgY2g7XHJcbiAgICAgICAgd2hpbGUgKChjaCA9IHN0cmVhbS5uZXh0KCkpICE9IG51bGwpIHtcclxuICAgICAgICAgICAgaWYgKGRhc2hlcyA+PSAyICYmIGNoID09IFwiPlwiKSB7XHJcbiAgICAgICAgICAgICAgICBzdGF0ZS50b2tlbml6ZSA9IHRva2VuQmFzZTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGRhc2hlcyA9IChjaCA9PSBcIi1cIikgPyBkYXNoZXMgKyAxIDogMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJldChcImNvbW1lbnRcIiwgXCJjb21tZW50XCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHRva2VuU3RyaW5nKHF1b3RlKSB7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHN0cmVhbSwgc3RhdGUpIHtcclxuICAgICAgICAgICAgdmFyIGVzY2FwZWQgPSBmYWxzZSwgY2g7XHJcbiAgICAgICAgICAgIHdoaWxlICgoY2ggPSBzdHJlYW0ubmV4dCgpKSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoY2ggPT0gcXVvdGUgJiYgIWVzY2FwZWQpXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBlc2NhcGVkID0gIWVzY2FwZWQgJiYgY2ggPT0gXCJcXFxcXCI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCFlc2NhcGVkKSBzdGF0ZS50b2tlbml6ZSA9IHRva2VuQmFzZTtcclxuICAgICAgICAgICAgcmV0dXJuIHJldChcInN0cmluZ1wiLCBcInN0cmluZ1wiKTtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgc3RhcnRTdGF0ZTogZnVuY3Rpb24oYmFzZSkge1xyXG4gICAgICAgICAgICByZXR1cm4ge3Rva2VuaXplOiB0b2tlbkJhc2UsXHJcbiAgICAgICAgICAgICAgICBiYXNlSW5kZW50OiBiYXNlIHx8IDAsXHJcbiAgICAgICAgICAgICAgICBzdGFjazogW119O1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHRva2VuOiBmdW5jdGlvbihzdHJlYW0sIHN0YXRlKSB7XHJcbiAgICAgICAgICAgIGlmIChzdHJlYW0uZWF0U3BhY2UoKSkgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIHZhciBzdHlsZSA9IHN0YXRlLnRva2VuaXplKHN0cmVhbSwgc3RhdGUpO1xyXG5cclxuICAgICAgICAgICAgdmFyIGNvbnRleHQgPSBzdGF0ZS5zdGFja1tzdGF0ZS5zdGFjay5sZW5ndGgtMV07XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwiaGFzaFwiICYmIGNvbnRleHQgPT0gXCJydWxlXCIpIHN0eWxlID0gXCJhdG9tXCI7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHN0eWxlID09IFwidmFyaWFibGVcIikge1xyXG4gICAgICAgICAgICAgICAgaWYgKGNvbnRleHQgPT0gXCJydWxlXCIpIHN0eWxlID0gXCJudW1iZXJcIjtcclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKCFjb250ZXh0IHx8IGNvbnRleHQgPT0gXCJAbWVkaWF7XCIpIHN0eWxlID0gXCJ0YWdcIjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGNvbnRleHQgPT0gXCJydWxlXCIgJiYgL15bXFx7XFx9O10kLy50ZXN0KHR5cGUpKVxyXG4gICAgICAgICAgICAgICAgc3RhdGUuc3RhY2sucG9wKCk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwie1wiKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoY29udGV4dCA9PSBcIkBtZWRpYVwiKSBzdGF0ZS5zdGFja1tzdGF0ZS5zdGFjay5sZW5ndGgtMV0gPSBcIkBtZWRpYXtcIjtcclxuICAgICAgICAgICAgICAgIGVsc2Ugc3RhdGUuc3RhY2sucHVzaChcIntcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAodHlwZSA9PSBcIn1cIikgc3RhdGUuc3RhY2sucG9wKCk7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHR5cGUgPT0gXCJAbWVkaWFcIikgc3RhdGUuc3RhY2sucHVzaChcIkBtZWRpYVwiKTtcclxuICAgICAgICAgICAgZWxzZSBpZiAoY29udGV4dCA9PSBcIntcIiAmJiB0eXBlICE9IFwiY29tbWVudFwiKSBzdGF0ZS5zdGFjay5wdXNoKFwicnVsZVwiKTtcclxuICAgICAgICAgICAgcmV0dXJuIHN0eWxlO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGluZGVudDogZnVuY3Rpb24oc3RhdGUsIHRleHRBZnRlcikge1xyXG4gICAgICAgICAgICB2YXIgbiA9IHN0YXRlLnN0YWNrLmxlbmd0aDtcclxuICAgICAgICAgICAgaWYgKC9eXFx9Ly50ZXN0KHRleHRBZnRlcikpXHJcbiAgICAgICAgICAgICAgICBuIC09IHN0YXRlLnN0YWNrW3N0YXRlLnN0YWNrLmxlbmd0aC0xXSA9PSBcInJ1bGVcIiA/IDIgOiAxO1xyXG4gICAgICAgICAgICByZXR1cm4gc3RhdGUuYmFzZUluZGVudCArIG4gKiBpbmRlbnRVbml0O1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGVsZWN0cmljQ2hhcnM6IFwifVwiXHJcbiAgICB9O1xyXG59KTtcclxuXHJcbkNvZGVNaXJyb3IuZGVmaW5lTUlNRShcInRleHQvY3NzXCIsIFwiY3NzXCIpO1xyXG5Db2RlTWlycm9yLmRlZmluZU1vZGUoXCJodG1sbWl4ZWRcIiwgZnVuY3Rpb24oY29uZmlnLCBwYXJzZXJDb25maWcpIHtcclxuICAgIHZhciBodG1sTW9kZSA9IENvZGVNaXJyb3IuZ2V0TW9kZShjb25maWcsIHtuYW1lOiBcInhtbFwiLCBodG1sTW9kZTogdHJ1ZX0pO1xyXG4gICAgdmFyIGpzTW9kZSA9IENvZGVNaXJyb3IuZ2V0TW9kZShjb25maWcsIFwiamF2YXNjcmlwdFwiKTtcclxuICAgIHZhciBjc3NNb2RlID0gQ29kZU1pcnJvci5nZXRNb2RlKGNvbmZpZywgXCJjc3NcIik7XHJcblxyXG4gICAgZnVuY3Rpb24gaHRtbChzdHJlYW0sIHN0YXRlKSB7XHJcbiAgICAgICAgdmFyIHN0eWxlID0gaHRtbE1vZGUudG9rZW4oc3RyZWFtLCBzdGF0ZS5odG1sU3RhdGUpO1xyXG4gICAgICAgIGlmIChzdHlsZSA9PSBcInRhZ1wiICYmIHN0cmVhbS5jdXJyZW50KCkgPT0gXCI+XCIgJiYgc3RhdGUuaHRtbFN0YXRlLmNvbnRleHQpIHtcclxuICAgICAgICAgICAgaWYgKC9ec2NyaXB0JC9pLnRlc3Qoc3RhdGUuaHRtbFN0YXRlLmNvbnRleHQudGFnTmFtZSkpIHtcclxuICAgICAgICAgICAgICAgIHN0YXRlLnRva2VuID0gamF2YXNjcmlwdDtcclxuICAgICAgICAgICAgICAgIHN0YXRlLmxvY2FsU3RhdGUgPSBqc01vZGUuc3RhcnRTdGF0ZShodG1sTW9kZS5pbmRlbnQoc3RhdGUuaHRtbFN0YXRlLCBcIlwiKSk7XHJcbiAgICAgICAgICAgICAgICBzdGF0ZS5tb2RlID0gXCJqYXZhc2NyaXB0XCI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoL15zdHlsZSQvaS50ZXN0KHN0YXRlLmh0bWxTdGF0ZS5jb250ZXh0LnRhZ05hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICBzdGF0ZS50b2tlbiA9IGNzcztcclxuICAgICAgICAgICAgICAgIHN0YXRlLmxvY2FsU3RhdGUgPSBjc3NNb2RlLnN0YXJ0U3RhdGUoaHRtbE1vZGUuaW5kZW50KHN0YXRlLmh0bWxTdGF0ZSwgXCJcIikpO1xyXG4gICAgICAgICAgICAgICAgc3RhdGUubW9kZSA9IFwiY3NzXCI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHN0eWxlO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gbWF5YmVCYWNrdXAoc3RyZWFtLCBwYXQsIHN0eWxlKSB7XHJcbiAgICAgICAgdmFyIGN1ciA9IHN0cmVhbS5jdXJyZW50KCk7XHJcbiAgICAgICAgdmFyIGNsb3NlID0gY3VyLnNlYXJjaChwYXQpO1xyXG4gICAgICAgIGlmIChjbG9zZSA+IC0xKSBzdHJlYW0uYmFja1VwKGN1ci5sZW5ndGggLSBjbG9zZSk7XHJcbiAgICAgICAgcmV0dXJuIHN0eWxlO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gamF2YXNjcmlwdChzdHJlYW0sIHN0YXRlKSB7XHJcbiAgICAgICAgaWYgKHN0cmVhbS5tYXRjaCgvXjxcXC9cXHMqc2NyaXB0XFxzKj4vaSwgZmFsc2UpKSB7XHJcbiAgICAgICAgICAgIHN0YXRlLnRva2VuID0gaHRtbDtcclxuICAgICAgICAgICAgc3RhdGUuY3VyU3RhdGUgPSBudWxsO1xyXG4gICAgICAgICAgICBzdGF0ZS5tb2RlID0gXCJodG1sXCI7XHJcbiAgICAgICAgICAgIHJldHVybiBodG1sKHN0cmVhbSwgc3RhdGUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbWF5YmVCYWNrdXAoc3RyZWFtLCAvPFxcL1xccypzY3JpcHRcXHMqPi8sXHJcbiAgICAgICAgICAgIGpzTW9kZS50b2tlbihzdHJlYW0sIHN0YXRlLmxvY2FsU3RhdGUpKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIGNzcyhzdHJlYW0sIHN0YXRlKSB7XHJcbiAgICAgICAgaWYgKHN0cmVhbS5tYXRjaCgvXjxcXC9cXHMqc3R5bGVcXHMqPi9pLCBmYWxzZSkpIHtcclxuICAgICAgICAgICAgc3RhdGUudG9rZW4gPSBodG1sO1xyXG4gICAgICAgICAgICBzdGF0ZS5sb2NhbFN0YXRlID0gbnVsbDtcclxuICAgICAgICAgICAgc3RhdGUubW9kZSA9IFwiaHRtbFwiO1xyXG4gICAgICAgICAgICByZXR1cm4gaHRtbChzdHJlYW0sIHN0YXRlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG1heWJlQmFja3VwKHN0cmVhbSwgLzxcXC9cXHMqc3R5bGVcXHMqPi8sXHJcbiAgICAgICAgICAgIGNzc01vZGUudG9rZW4oc3RyZWFtLCBzdGF0ZS5sb2NhbFN0YXRlKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBzdGFydFN0YXRlOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgdmFyIHN0YXRlID0gaHRtbE1vZGUuc3RhcnRTdGF0ZSgpO1xyXG4gICAgICAgICAgICByZXR1cm4ge3Rva2VuOiBodG1sLCBsb2NhbFN0YXRlOiBudWxsLCBtb2RlOiBcImh0bWxcIiwgaHRtbFN0YXRlOiBzdGF0ZX07XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgY29weVN0YXRlOiBmdW5jdGlvbihzdGF0ZSkge1xyXG4gICAgICAgICAgICBpZiAoc3RhdGUubG9jYWxTdGF0ZSlcclxuICAgICAgICAgICAgICAgIHZhciBsb2NhbCA9IENvZGVNaXJyb3IuY29weVN0YXRlKHN0YXRlLnRva2VuID09IGNzcyA/IGNzc01vZGUgOiBqc01vZGUsIHN0YXRlLmxvY2FsU3RhdGUpO1xyXG4gICAgICAgICAgICByZXR1cm4ge3Rva2VuOiBzdGF0ZS50b2tlbiwgbG9jYWxTdGF0ZTogbG9jYWwsIG1vZGU6IHN0YXRlLm1vZGUsXHJcbiAgICAgICAgICAgICAgICBodG1sU3RhdGU6IENvZGVNaXJyb3IuY29weVN0YXRlKGh0bWxNb2RlLCBzdGF0ZS5odG1sU3RhdGUpfTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB0b2tlbjogZnVuY3Rpb24oc3RyZWFtLCBzdGF0ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gc3RhdGUudG9rZW4oc3RyZWFtLCBzdGF0ZSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgaW5kZW50OiBmdW5jdGlvbihzdGF0ZSwgdGV4dEFmdGVyKSB7XHJcbiAgICAgICAgICAgIGlmIChzdGF0ZS50b2tlbiA9PSBodG1sIHx8IC9eXFxzKjxcXC8vLnRlc3QodGV4dEFmdGVyKSlcclxuICAgICAgICAgICAgICAgIHJldHVybiBodG1sTW9kZS5pbmRlbnQoc3RhdGUuaHRtbFN0YXRlLCB0ZXh0QWZ0ZXIpO1xyXG4gICAgICAgICAgICBlbHNlIGlmIChzdGF0ZS50b2tlbiA9PSBqYXZhc2NyaXB0KVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGpzTW9kZS5pbmRlbnQoc3RhdGUubG9jYWxTdGF0ZSwgdGV4dEFmdGVyKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNzc01vZGUuaW5kZW50KHN0YXRlLmxvY2FsU3RhdGUsIHRleHRBZnRlcik7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgY29tcGFyZVN0YXRlczogZnVuY3Rpb24oYSwgYikge1xyXG4gICAgICAgICAgICByZXR1cm4gaHRtbE1vZGUuY29tcGFyZVN0YXRlcyhhLmh0bWxTdGF0ZSwgYi5odG1sU3RhdGUpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGVsZWN0cmljQ2hhcnM6IFwiL3t9OlwiXHJcbiAgICB9XHJcbn0pO1xyXG5cclxuQ29kZU1pcnJvci5kZWZpbmVNSU1FKFwidGV4dC9odG1sXCIsIFwiaHRtbG1peGVkXCIpO1xyXG4iXSwiZmlsZSI6InBsdWdpbnMvdWVkaXRvci90aGlyZC1wYXJ0eS9jb2RlbWlycm9yL2NvZGVtaXJyb3IuanMifQ==
