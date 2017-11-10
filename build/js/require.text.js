/**
 * @license RequireJS text 2.0.13+ Copyright (c) 2010-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/requirejs/text for details
 */
/*jslint regexp: true */
/*global require, XMLHttpRequest, ActiveXObject,
  define, window, process, Packages,
  java, location, Components, FileUtils */

define(['module'], function (module) {
    'use strict';

    var text, fs, Cc, Ci, xpcIsWindows,
        progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'],
        xmlRegExp = /^\s*<\?xml(\s)+version=[\'\"](\d)*.(\d)*[\'\"](\s)*\?>/im,
        bodyRegExp = /<body[^>]*>\s*([\s\S]+)\s*<\/body>/im,
        hasLocation = typeof location !== 'undefined' && location.href,
        defaultProtocol = hasLocation && location.protocol && location.protocol.replace(/\:/, ''),
        defaultHostName = hasLocation && location.hostname,
        defaultPort = hasLocation && (location.port || undefined),
        buildMap = {},
        masterConfig = (module.config && module.config()) || {};

    text = {
        version: '2.0.13+',

        strip: function (content) {
            //Strips <?xml ...?> declarations so that external SVG and XML
            //documents can be added to a document without worry. Also, if the string
            //is an HTML document, only the part inside the body tag is returned.
            if (content) {
                content = content.replace(xmlRegExp, "");
                var matches = content.match(bodyRegExp);
                if (matches) {
                    content = matches[1];
                }
            } else {
                content = "";
            }
            return content;
        },

        jsEscape: function (content) {
            return content.replace(/(['\\])/g, '\\$1')
                .replace(/[\f]/g, "\\f")
                .replace(/[\b]/g, "\\b")
                .replace(/[\n]/g, "\\n")
                .replace(/[\t]/g, "\\t")
                .replace(/[\r]/g, "\\r")
                .replace(/[\u2028]/g, "\\u2028")
                .replace(/[\u2029]/g, "\\u2029");
        },

        createXhr: masterConfig.createXhr || function () {
            //Would love to dump the ActiveX crap in here. Need IE 6 to die first.
            var xhr, i, progId;
            if (typeof XMLHttpRequest !== "undefined") {
                return new XMLHttpRequest();
            } else if (typeof ActiveXObject !== "undefined") {
                for (i = 0; i < 3; i += 1) {
                    progId = progIds[i];
                    try {
                        xhr = new ActiveXObject(progId);
                    } catch (e) {}

                    if (xhr) {
                        progIds = [progId];  // so faster next time
                        break;
                    }
                }
            }

            return xhr;
        },

        /**
         * Parses a resource name into its component parts. Resource names
         * look like: module/name.ext!strip, where the !strip part is
         * optional.
         * @param {String} name the resource name
         * @returns {Object} with properties "moduleName", "ext" and "strip"
         * where strip is a boolean.
         */
        parseName: function (name) {
            var modName, ext, temp,
                strip = false,
                index = name.lastIndexOf("."),
                isRelative = name.indexOf('./') === 0 ||
                             name.indexOf('../') === 0;

            if (index !== -1 && (!isRelative || index > 1)) {
                modName = name.substring(0, index);
                ext = name.substring(index + 1);
            } else {
                modName = name;
            }

            temp = ext || modName;
            index = temp.indexOf("!");
            if (index !== -1) {
                //Pull off the strip arg.
                strip = temp.substring(index + 1) === "strip";
                temp = temp.substring(0, index);
                if (ext) {
                    ext = temp;
                } else {
                    modName = temp;
                }
            }

            return {
                moduleName: modName,
                ext: ext,
                strip: strip
            };
        },

        xdRegExp: /^((\w+)\:)?\/\/([^\/\\]+)/,

        /**
         * Is an URL on another domain. Only works for browser use, returns
         * false in non-browser environments. Only used to know if an
         * optimized .js version of a text resource should be loaded
         * instead.
         * @param {String} url
         * @returns Boolean
         */
        useXhr: function (url, protocol, hostname, port) {
            var uProtocol, uHostName, uPort,
                match = text.xdRegExp.exec(url);
            if (!match) {
                return true;
            }
            uProtocol = match[2];
            uHostName = match[3];

            uHostName = uHostName.split(':');
            uPort = uHostName[1];
            uHostName = uHostName[0];

            return (!uProtocol || uProtocol === protocol) &&
                   (!uHostName || uHostName.toLowerCase() === hostname.toLowerCase()) &&
                   ((!uPort && !uHostName) || uPort === port);
        },

        finishLoad: function (name, strip, content, onLoad) {
            content = strip ? text.strip(content) : content;
            if (masterConfig.isBuild) {
                buildMap[name] = content;
            }
            onLoad(content);
        },

        load: function (name, req, onLoad, config) {
            //Name has format: some.module.filext!strip
            //The strip part is optional.
            //if strip is present, then that means only get the string contents
            //inside a body tag in an HTML string. For XML/SVG content it means
            //removing the <?xml ...?> declarations so the content can be inserted
            //into the current doc without problems.

            // Do not bother with the work if a build and text will
            // not be inlined.
            if (config && config.isBuild && !config.inlineText) {
                onLoad();
                return;
            }

            masterConfig.isBuild = config && config.isBuild;

            var parsed = text.parseName(name),
                nonStripName = parsed.moduleName +
                    (parsed.ext ? '.' + parsed.ext : ''),
                url = req.toUrl(nonStripName),
                useXhr = (masterConfig.useXhr) ||
                         text.useXhr;

            // Do not load if it is an empty: url
            if (url.indexOf('empty:') === 0) {
                onLoad();
                return;
            }

            //Load the text. Use XHR if possible and in a browser.
            if (!hasLocation || useXhr(url, defaultProtocol, defaultHostName, defaultPort)) {
                text.get(url, function (content) {
                    text.finishLoad(name, parsed.strip, content, onLoad);
                }, function (err) {
                    if (onLoad.error) {
                        onLoad.error(err);
                    }
                });
            } else {
                //Need to fetch the resource across domains. Assume
                //the resource has been optimized into a JS module. Fetch
                //by the module name + extension, but do not include the
                //!strip part to avoid file system issues.
                req([nonStripName], function (content) {
                    text.finishLoad(parsed.moduleName + '.' + parsed.ext,
                                    parsed.strip, content, onLoad);
                });
            }
        },

        write: function (pluginName, moduleName, write, config) {
            if (buildMap.hasOwnProperty(moduleName)) {
                var content = text.jsEscape(buildMap[moduleName]);
                write.asModule(pluginName + "!" + moduleName,
                               "define(function () { return '" +
                                   content +
                               "';});\n");
            }
        },

        writeFile: function (pluginName, moduleName, req, write, config) {
            var parsed = text.parseName(moduleName),
                extPart = parsed.ext ? '.' + parsed.ext : '',
                nonStripName = parsed.moduleName + extPart,
                //Use a '.js' file name so that it indicates it is a
                //script that can be loaded across domains.
                fileName = req.toUrl(parsed.moduleName + extPart) + '.js';

            //Leverage own load() method to load plugin value, but only
            //write out values that do not have the strip argument,
            //to avoid any potential issues with ! in file names.
            text.load(nonStripName, req, function (value) {
                //Use own write() method to construct full module value.
                //But need to create shell that translates writeFile's
                //write() to the right interface.
                var textWrite = function (contents) {
                    return write(fileName, contents);
                };
                textWrite.asModule = function (moduleName, contents) {
                    return write.asModule(moduleName, fileName, contents);
                };

                text.write(pluginName, nonStripName, textWrite, config);
            }, config);
        }
    };

    if (masterConfig.env === 'node' || (!masterConfig.env &&
            typeof process !== "undefined" &&
            process.versions &&
            !!process.versions.node &&
            !process.versions['node-webkit'] &&
            !process.versions['atom-shell'])) {
        //Using special require.nodeRequire, something added by r.js.
        fs = require.nodeRequire('fs');

        text.get = function (url, callback, errback) {
            try {
                var file = fs.readFileSync(url, 'utf8');
                //Remove BOM (Byte Mark Order) from utf8 files if it is there.
                if (file[0] === '\uFEFF') {
                    file = file.substring(1);
                }
                callback(file);
            } catch (e) {
                if (errback) {
                    errback(e);
                }
            }
        };
    } else if (masterConfig.env === 'xhr' || (!masterConfig.env &&
            text.createXhr())) {
        text.get = function (url, callback, errback, headers) {
            var xhr = text.createXhr(), header;
            xhr.open('GET', url, true);

            //Allow plugins direct access to xhr headers
            if (headers) {
                for (header in headers) {
                    if (headers.hasOwnProperty(header)) {
                        xhr.setRequestHeader(header.toLowerCase(), headers[header]);
                    }
                }
            }

            //Allow overrides specified in config
            if (masterConfig.onXhr) {
                masterConfig.onXhr(xhr, url);
            }

            xhr.onreadystatechange = function (evt) {
                var status, err;
                //Do not explicitly handle errors, those should be
                //visible via console output in the browser.
                if (xhr.readyState === 4) {
                    status = xhr.status || 0;
                    if (status > 399 && status < 600) {
                        //An http 4xx or 5xx error. Signal an error.
                        err = new Error(url + ' HTTP status: ' + status);
                        err.xhr = xhr;
                        if (errback) {
                            errback(err);
                        }
                    } else {
                        callback(xhr.responseText);
                    }

                    if (masterConfig.onXhrComplete) {
                        masterConfig.onXhrComplete(xhr, url);
                    }
                }
            };
            xhr.send(null);
        };
    } else if (masterConfig.env === 'rhino' || (!masterConfig.env &&
            typeof Packages !== 'undefined' && typeof java !== 'undefined')) {
        //Why Java, why is this so awkward?
        text.get = function (url, callback) {
            var stringBuffer, line,
                encoding = "utf-8",
                file = new java.io.File(url),
                lineSeparator = java.lang.System.getProperty("line.separator"),
                input = new java.io.BufferedReader(new java.io.InputStreamReader(new java.io.FileInputStream(file), encoding)),
                content = '';
            try {
                stringBuffer = new java.lang.StringBuffer();
                line = input.readLine();

                // Byte Order Mark (BOM) - The Unicode Standard, version 3.0, page 324
                // http://www.unicode.org/faq/utf_bom.html

                // Note that when we use utf-8, the BOM should appear as "EF BB BF", but it doesn't due to this bug in the JDK:
                // http://bugs.sun.com/bugdatabase/view_bug.do?bug_id=4508058
                if (line && line.length() && line.charAt(0) === 0xfeff) {
                    // Eat the BOM, since we've already found the encoding on this file,
                    // and we plan to concatenating this buffer with others; the BOM should
                    // only appear at the top of a file.
                    line = line.substring(1);
                }

                if (line !== null) {
                    stringBuffer.append(line);
                }

                while ((line = input.readLine()) !== null) {
                    stringBuffer.append(lineSeparator);
                    stringBuffer.append(line);
                }
                //Make sure we return a JavaScript string and not a Java string.
                content = String(stringBuffer.toString()); //String
            } finally {
                input.close();
            }
            callback(content);
        };
    } else if (masterConfig.env === 'xpconnect' || (!masterConfig.env &&
            typeof Components !== 'undefined' && Components.classes &&
            Components.interfaces)) {
        //Avert your gaze!
        Cc = Components.classes;
        Ci = Components.interfaces;
        Components.utils['import']('resource://gre/modules/FileUtils.jsm');
        xpcIsWindows = ('@mozilla.org/windows-registry-key;1' in Cc);

        text.get = function (url, callback) {
            var inStream, convertStream, fileObj,
                readData = {};

            if (xpcIsWindows) {
                url = url.replace(/\//g, '\\');
            }

            fileObj = new FileUtils.File(url);

            //XPCOM, you so crazy
            try {
                inStream = Cc['@mozilla.org/network/file-input-stream;1']
                           .createInstance(Ci.nsIFileInputStream);
                inStream.init(fileObj, 1, 0, false);

                convertStream = Cc['@mozilla.org/intl/converter-input-stream;1']
                                .createInstance(Ci.nsIConverterInputStream);
                convertStream.init(inStream, "utf-8", inStream.available(),
                Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);

                convertStream.readString(inStream.available(), readData);
                convertStream.close();
                inStream.close();
                callback(readData.value);
            } catch (e) {
                throw new Error((fileObj && fileObj.path || '') + ': ' + e);
            }
        };
    }
    return text;
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJyZXF1aXJlLnRleHQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZSBSZXF1aXJlSlMgdGV4dCAyLjAuMTMrIENvcHlyaWdodCAoYykgMjAxMC0yMDE0LCBUaGUgRG9qbyBGb3VuZGF0aW9uIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBBdmFpbGFibGUgdmlhIHRoZSBNSVQgb3IgbmV3IEJTRCBsaWNlbnNlLlxuICogc2VlOiBodHRwOi8vZ2l0aHViLmNvbS9yZXF1aXJlanMvdGV4dCBmb3IgZGV0YWlsc1xuICovXG4vKmpzbGludCByZWdleHA6IHRydWUgKi9cbi8qZ2xvYmFsIHJlcXVpcmUsIFhNTEh0dHBSZXF1ZXN0LCBBY3RpdmVYT2JqZWN0LFxuICBkZWZpbmUsIHdpbmRvdywgcHJvY2VzcywgUGFja2FnZXMsXG4gIGphdmEsIGxvY2F0aW9uLCBDb21wb25lbnRzLCBGaWxlVXRpbHMgKi9cblxuZGVmaW5lKFsnbW9kdWxlJ10sIGZ1bmN0aW9uIChtb2R1bGUpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgdGV4dCwgZnMsIENjLCBDaSwgeHBjSXNXaW5kb3dzLFxuICAgICAgICBwcm9nSWRzID0gWydNc3htbDIuWE1MSFRUUCcsICdNaWNyb3NvZnQuWE1MSFRUUCcsICdNc3htbDIuWE1MSFRUUC40LjAnXSxcbiAgICAgICAgeG1sUmVnRXhwID0gL15cXHMqPFxcP3htbChcXHMpK3ZlcnNpb249W1xcJ1xcXCJdKFxcZCkqLihcXGQpKltcXCdcXFwiXShcXHMpKlxcPz4vaW0sXG4gICAgICAgIGJvZHlSZWdFeHAgPSAvPGJvZHlbXj5dKj5cXHMqKFtcXHNcXFNdKylcXHMqPFxcL2JvZHk+L2ltLFxuICAgICAgICBoYXNMb2NhdGlvbiA9IHR5cGVvZiBsb2NhdGlvbiAhPT0gJ3VuZGVmaW5lZCcgJiYgbG9jYXRpb24uaHJlZixcbiAgICAgICAgZGVmYXVsdFByb3RvY29sID0gaGFzTG9jYXRpb24gJiYgbG9jYXRpb24ucHJvdG9jb2wgJiYgbG9jYXRpb24ucHJvdG9jb2wucmVwbGFjZSgvXFw6LywgJycpLFxuICAgICAgICBkZWZhdWx0SG9zdE5hbWUgPSBoYXNMb2NhdGlvbiAmJiBsb2NhdGlvbi5ob3N0bmFtZSxcbiAgICAgICAgZGVmYXVsdFBvcnQgPSBoYXNMb2NhdGlvbiAmJiAobG9jYXRpb24ucG9ydCB8fCB1bmRlZmluZWQpLFxuICAgICAgICBidWlsZE1hcCA9IHt9LFxuICAgICAgICBtYXN0ZXJDb25maWcgPSAobW9kdWxlLmNvbmZpZyAmJiBtb2R1bGUuY29uZmlnKCkpIHx8IHt9O1xuXG4gICAgdGV4dCA9IHtcbiAgICAgICAgdmVyc2lvbjogJzIuMC4xMysnLFxuXG4gICAgICAgIHN0cmlwOiBmdW5jdGlvbiAoY29udGVudCkge1xuICAgICAgICAgICAgLy9TdHJpcHMgPD94bWwgLi4uPz4gZGVjbGFyYXRpb25zIHNvIHRoYXQgZXh0ZXJuYWwgU1ZHIGFuZCBYTUxcbiAgICAgICAgICAgIC8vZG9jdW1lbnRzIGNhbiBiZSBhZGRlZCB0byBhIGRvY3VtZW50IHdpdGhvdXQgd29ycnkuIEFsc28sIGlmIHRoZSBzdHJpbmdcbiAgICAgICAgICAgIC8vaXMgYW4gSFRNTCBkb2N1bWVudCwgb25seSB0aGUgcGFydCBpbnNpZGUgdGhlIGJvZHkgdGFnIGlzIHJldHVybmVkLlxuICAgICAgICAgICAgaWYgKGNvbnRlbnQpIHtcbiAgICAgICAgICAgICAgICBjb250ZW50ID0gY29udGVudC5yZXBsYWNlKHhtbFJlZ0V4cCwgXCJcIik7XG4gICAgICAgICAgICAgICAgdmFyIG1hdGNoZXMgPSBjb250ZW50Lm1hdGNoKGJvZHlSZWdFeHApO1xuICAgICAgICAgICAgICAgIGlmIChtYXRjaGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQgPSBtYXRjaGVzWzFdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29udGVudCA9IFwiXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY29udGVudDtcbiAgICAgICAgfSxcblxuICAgICAgICBqc0VzY2FwZTogZnVuY3Rpb24gKGNvbnRlbnQpIHtcbiAgICAgICAgICAgIHJldHVybiBjb250ZW50LnJlcGxhY2UoLyhbJ1xcXFxdKS9nLCAnXFxcXCQxJylcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvW1xcZl0vZywgXCJcXFxcZlwiKVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9bXFxiXS9nLCBcIlxcXFxiXCIpXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoL1tcXG5dL2csIFwiXFxcXG5cIilcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvW1xcdF0vZywgXCJcXFxcdFwiKVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9bXFxyXS9nLCBcIlxcXFxyXCIpXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoL1tcXHUyMDI4XS9nLCBcIlxcXFx1MjAyOFwiKVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9bXFx1MjAyOV0vZywgXCJcXFxcdTIwMjlcIik7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY3JlYXRlWGhyOiBtYXN0ZXJDb25maWcuY3JlYXRlWGhyIHx8IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vV291bGQgbG92ZSB0byBkdW1wIHRoZSBBY3RpdmVYIGNyYXAgaW4gaGVyZS4gTmVlZCBJRSA2IHRvIGRpZSBmaXJzdC5cbiAgICAgICAgICAgIHZhciB4aHIsIGksIHByb2dJZDtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgWE1MSHR0cFJlcXVlc3QgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBBY3RpdmVYT2JqZWN0ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IDM7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgICAgICBwcm9nSWQgPSBwcm9nSWRzW2ldO1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgeGhyID0gbmV3IEFjdGl2ZVhPYmplY3QocHJvZ0lkKTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge31cblxuICAgICAgICAgICAgICAgICAgICBpZiAoeGhyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9nSWRzID0gW3Byb2dJZF07ICAvLyBzbyBmYXN0ZXIgbmV4dCB0aW1lXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHhocjtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogUGFyc2VzIGEgcmVzb3VyY2UgbmFtZSBpbnRvIGl0cyBjb21wb25lbnQgcGFydHMuIFJlc291cmNlIG5hbWVzXG4gICAgICAgICAqIGxvb2sgbGlrZTogbW9kdWxlL25hbWUuZXh0IXN0cmlwLCB3aGVyZSB0aGUgIXN0cmlwIHBhcnQgaXNcbiAgICAgICAgICogb3B0aW9uYWwuXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIHRoZSByZXNvdXJjZSBuYW1lXG4gICAgICAgICAqIEByZXR1cm5zIHtPYmplY3R9IHdpdGggcHJvcGVydGllcyBcIm1vZHVsZU5hbWVcIiwgXCJleHRcIiBhbmQgXCJzdHJpcFwiXG4gICAgICAgICAqIHdoZXJlIHN0cmlwIGlzIGEgYm9vbGVhbi5cbiAgICAgICAgICovXG4gICAgICAgIHBhcnNlTmFtZTogZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgIHZhciBtb2ROYW1lLCBleHQsIHRlbXAsXG4gICAgICAgICAgICAgICAgc3RyaXAgPSBmYWxzZSxcbiAgICAgICAgICAgICAgICBpbmRleCA9IG5hbWUubGFzdEluZGV4T2YoXCIuXCIpLFxuICAgICAgICAgICAgICAgIGlzUmVsYXRpdmUgPSBuYW1lLmluZGV4T2YoJy4vJykgPT09IDAgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZS5pbmRleE9mKCcuLi8nKSA9PT0gMDtcblxuICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSAmJiAoIWlzUmVsYXRpdmUgfHwgaW5kZXggPiAxKSkge1xuICAgICAgICAgICAgICAgIG1vZE5hbWUgPSBuYW1lLnN1YnN0cmluZygwLCBpbmRleCk7XG4gICAgICAgICAgICAgICAgZXh0ID0gbmFtZS5zdWJzdHJpbmcoaW5kZXggKyAxKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbW9kTmFtZSA9IG5hbWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRlbXAgPSBleHQgfHwgbW9kTmFtZTtcbiAgICAgICAgICAgIGluZGV4ID0gdGVtcC5pbmRleE9mKFwiIVwiKTtcbiAgICAgICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAvL1B1bGwgb2ZmIHRoZSBzdHJpcCBhcmcuXG4gICAgICAgICAgICAgICAgc3RyaXAgPSB0ZW1wLnN1YnN0cmluZyhpbmRleCArIDEpID09PSBcInN0cmlwXCI7XG4gICAgICAgICAgICAgICAgdGVtcCA9IHRlbXAuc3Vic3RyaW5nKDAsIGluZGV4KTtcbiAgICAgICAgICAgICAgICBpZiAoZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgIGV4dCA9IHRlbXA7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbW9kTmFtZSA9IHRlbXA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG1vZHVsZU5hbWU6IG1vZE5hbWUsXG4gICAgICAgICAgICAgICAgZXh0OiBleHQsXG4gICAgICAgICAgICAgICAgc3RyaXA6IHN0cmlwXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuXG4gICAgICAgIHhkUmVnRXhwOiAvXigoXFx3KylcXDopP1xcL1xcLyhbXlxcL1xcXFxdKykvLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJcyBhbiBVUkwgb24gYW5vdGhlciBkb21haW4uIE9ubHkgd29ya3MgZm9yIGJyb3dzZXIgdXNlLCByZXR1cm5zXG4gICAgICAgICAqIGZhbHNlIGluIG5vbi1icm93c2VyIGVudmlyb25tZW50cy4gT25seSB1c2VkIHRvIGtub3cgaWYgYW5cbiAgICAgICAgICogb3B0aW1pemVkIC5qcyB2ZXJzaW9uIG9mIGEgdGV4dCByZXNvdXJjZSBzaG91bGQgYmUgbG9hZGVkXG4gICAgICAgICAqIGluc3RlYWQuXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSB1cmxcbiAgICAgICAgICogQHJldHVybnMgQm9vbGVhblxuICAgICAgICAgKi9cbiAgICAgICAgdXNlWGhyOiBmdW5jdGlvbiAodXJsLCBwcm90b2NvbCwgaG9zdG5hbWUsIHBvcnQpIHtcbiAgICAgICAgICAgIHZhciB1UHJvdG9jb2wsIHVIb3N0TmFtZSwgdVBvcnQsXG4gICAgICAgICAgICAgICAgbWF0Y2ggPSB0ZXh0LnhkUmVnRXhwLmV4ZWModXJsKTtcbiAgICAgICAgICAgIGlmICghbWF0Y2gpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHVQcm90b2NvbCA9IG1hdGNoWzJdO1xuICAgICAgICAgICAgdUhvc3ROYW1lID0gbWF0Y2hbM107XG5cbiAgICAgICAgICAgIHVIb3N0TmFtZSA9IHVIb3N0TmFtZS5zcGxpdCgnOicpO1xuICAgICAgICAgICAgdVBvcnQgPSB1SG9zdE5hbWVbMV07XG4gICAgICAgICAgICB1SG9zdE5hbWUgPSB1SG9zdE5hbWVbMF07XG5cbiAgICAgICAgICAgIHJldHVybiAoIXVQcm90b2NvbCB8fCB1UHJvdG9jb2wgPT09IHByb3RvY29sKSAmJlxuICAgICAgICAgICAgICAgICAgICghdUhvc3ROYW1lIHx8IHVIb3N0TmFtZS50b0xvd2VyQ2FzZSgpID09PSBob3N0bmFtZS50b0xvd2VyQ2FzZSgpKSAmJlxuICAgICAgICAgICAgICAgICAgICgoIXVQb3J0ICYmICF1SG9zdE5hbWUpIHx8IHVQb3J0ID09PSBwb3J0KTtcbiAgICAgICAgfSxcblxuICAgICAgICBmaW5pc2hMb2FkOiBmdW5jdGlvbiAobmFtZSwgc3RyaXAsIGNvbnRlbnQsIG9uTG9hZCkge1xuICAgICAgICAgICAgY29udGVudCA9IHN0cmlwID8gdGV4dC5zdHJpcChjb250ZW50KSA6IGNvbnRlbnQ7XG4gICAgICAgICAgICBpZiAobWFzdGVyQ29uZmlnLmlzQnVpbGQpIHtcbiAgICAgICAgICAgICAgICBidWlsZE1hcFtuYW1lXSA9IGNvbnRlbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBvbkxvYWQoY29udGVudCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgbG9hZDogZnVuY3Rpb24gKG5hbWUsIHJlcSwgb25Mb2FkLCBjb25maWcpIHtcbiAgICAgICAgICAgIC8vTmFtZSBoYXMgZm9ybWF0OiBzb21lLm1vZHVsZS5maWxleHQhc3RyaXBcbiAgICAgICAgICAgIC8vVGhlIHN0cmlwIHBhcnQgaXMgb3B0aW9uYWwuXG4gICAgICAgICAgICAvL2lmIHN0cmlwIGlzIHByZXNlbnQsIHRoZW4gdGhhdCBtZWFucyBvbmx5IGdldCB0aGUgc3RyaW5nIGNvbnRlbnRzXG4gICAgICAgICAgICAvL2luc2lkZSBhIGJvZHkgdGFnIGluIGFuIEhUTUwgc3RyaW5nLiBGb3IgWE1ML1NWRyBjb250ZW50IGl0IG1lYW5zXG4gICAgICAgICAgICAvL3JlbW92aW5nIHRoZSA8P3htbCAuLi4/PiBkZWNsYXJhdGlvbnMgc28gdGhlIGNvbnRlbnQgY2FuIGJlIGluc2VydGVkXG4gICAgICAgICAgICAvL2ludG8gdGhlIGN1cnJlbnQgZG9jIHdpdGhvdXQgcHJvYmxlbXMuXG5cbiAgICAgICAgICAgIC8vIERvIG5vdCBib3RoZXIgd2l0aCB0aGUgd29yayBpZiBhIGJ1aWxkIGFuZCB0ZXh0IHdpbGxcbiAgICAgICAgICAgIC8vIG5vdCBiZSBpbmxpbmVkLlxuICAgICAgICAgICAgaWYgKGNvbmZpZyAmJiBjb25maWcuaXNCdWlsZCAmJiAhY29uZmlnLmlubGluZVRleHQpIHtcbiAgICAgICAgICAgICAgICBvbkxvYWQoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG1hc3RlckNvbmZpZy5pc0J1aWxkID0gY29uZmlnICYmIGNvbmZpZy5pc0J1aWxkO1xuXG4gICAgICAgICAgICB2YXIgcGFyc2VkID0gdGV4dC5wYXJzZU5hbWUobmFtZSksXG4gICAgICAgICAgICAgICAgbm9uU3RyaXBOYW1lID0gcGFyc2VkLm1vZHVsZU5hbWUgK1xuICAgICAgICAgICAgICAgICAgICAocGFyc2VkLmV4dCA/ICcuJyArIHBhcnNlZC5leHQgOiAnJyksXG4gICAgICAgICAgICAgICAgdXJsID0gcmVxLnRvVXJsKG5vblN0cmlwTmFtZSksXG4gICAgICAgICAgICAgICAgdXNlWGhyID0gKG1hc3RlckNvbmZpZy51c2VYaHIpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgdGV4dC51c2VYaHI7XG5cbiAgICAgICAgICAgIC8vIERvIG5vdCBsb2FkIGlmIGl0IGlzIGFuIGVtcHR5OiB1cmxcbiAgICAgICAgICAgIGlmICh1cmwuaW5kZXhPZignZW1wdHk6JykgPT09IDApIHtcbiAgICAgICAgICAgICAgICBvbkxvYWQoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vTG9hZCB0aGUgdGV4dC4gVXNlIFhIUiBpZiBwb3NzaWJsZSBhbmQgaW4gYSBicm93c2VyLlxuICAgICAgICAgICAgaWYgKCFoYXNMb2NhdGlvbiB8fCB1c2VYaHIodXJsLCBkZWZhdWx0UHJvdG9jb2wsIGRlZmF1bHRIb3N0TmFtZSwgZGVmYXVsdFBvcnQpKSB7XG4gICAgICAgICAgICAgICAgdGV4dC5nZXQodXJsLCBmdW5jdGlvbiAoY29udGVudCkge1xuICAgICAgICAgICAgICAgICAgICB0ZXh0LmZpbmlzaExvYWQobmFtZSwgcGFyc2VkLnN0cmlwLCBjb250ZW50LCBvbkxvYWQpO1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9uTG9hZC5lcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgb25Mb2FkLmVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy9OZWVkIHRvIGZldGNoIHRoZSByZXNvdXJjZSBhY3Jvc3MgZG9tYWlucy4gQXNzdW1lXG4gICAgICAgICAgICAgICAgLy90aGUgcmVzb3VyY2UgaGFzIGJlZW4gb3B0aW1pemVkIGludG8gYSBKUyBtb2R1bGUuIEZldGNoXG4gICAgICAgICAgICAgICAgLy9ieSB0aGUgbW9kdWxlIG5hbWUgKyBleHRlbnNpb24sIGJ1dCBkbyBub3QgaW5jbHVkZSB0aGVcbiAgICAgICAgICAgICAgICAvLyFzdHJpcCBwYXJ0IHRvIGF2b2lkIGZpbGUgc3lzdGVtIGlzc3Vlcy5cbiAgICAgICAgICAgICAgICByZXEoW25vblN0cmlwTmFtZV0sIGZ1bmN0aW9uIChjb250ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHRleHQuZmluaXNoTG9hZChwYXJzZWQubW9kdWxlTmFtZSArICcuJyArIHBhcnNlZC5leHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJzZWQuc3RyaXAsIGNvbnRlbnQsIG9uTG9hZCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgd3JpdGU6IGZ1bmN0aW9uIChwbHVnaW5OYW1lLCBtb2R1bGVOYW1lLCB3cml0ZSwgY29uZmlnKSB7XG4gICAgICAgICAgICBpZiAoYnVpbGRNYXAuaGFzT3duUHJvcGVydHkobW9kdWxlTmFtZSkpIHtcbiAgICAgICAgICAgICAgICB2YXIgY29udGVudCA9IHRleHQuanNFc2NhcGUoYnVpbGRNYXBbbW9kdWxlTmFtZV0pO1xuICAgICAgICAgICAgICAgIHdyaXRlLmFzTW9kdWxlKHBsdWdpbk5hbWUgKyBcIiFcIiArIG1vZHVsZU5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJkZWZpbmUoZnVuY3Rpb24gKCkgeyByZXR1cm4gJ1wiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudCArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCInO30pO1xcblwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICB3cml0ZUZpbGU6IGZ1bmN0aW9uIChwbHVnaW5OYW1lLCBtb2R1bGVOYW1lLCByZXEsIHdyaXRlLCBjb25maWcpIHtcbiAgICAgICAgICAgIHZhciBwYXJzZWQgPSB0ZXh0LnBhcnNlTmFtZShtb2R1bGVOYW1lKSxcbiAgICAgICAgICAgICAgICBleHRQYXJ0ID0gcGFyc2VkLmV4dCA/ICcuJyArIHBhcnNlZC5leHQgOiAnJyxcbiAgICAgICAgICAgICAgICBub25TdHJpcE5hbWUgPSBwYXJzZWQubW9kdWxlTmFtZSArIGV4dFBhcnQsXG4gICAgICAgICAgICAgICAgLy9Vc2UgYSAnLmpzJyBmaWxlIG5hbWUgc28gdGhhdCBpdCBpbmRpY2F0ZXMgaXQgaXMgYVxuICAgICAgICAgICAgICAgIC8vc2NyaXB0IHRoYXQgY2FuIGJlIGxvYWRlZCBhY3Jvc3MgZG9tYWlucy5cbiAgICAgICAgICAgICAgICBmaWxlTmFtZSA9IHJlcS50b1VybChwYXJzZWQubW9kdWxlTmFtZSArIGV4dFBhcnQpICsgJy5qcyc7XG5cbiAgICAgICAgICAgIC8vTGV2ZXJhZ2Ugb3duIGxvYWQoKSBtZXRob2QgdG8gbG9hZCBwbHVnaW4gdmFsdWUsIGJ1dCBvbmx5XG4gICAgICAgICAgICAvL3dyaXRlIG91dCB2YWx1ZXMgdGhhdCBkbyBub3QgaGF2ZSB0aGUgc3RyaXAgYXJndW1lbnQsXG4gICAgICAgICAgICAvL3RvIGF2b2lkIGFueSBwb3RlbnRpYWwgaXNzdWVzIHdpdGggISBpbiBmaWxlIG5hbWVzLlxuICAgICAgICAgICAgdGV4dC5sb2FkKG5vblN0cmlwTmFtZSwgcmVxLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAvL1VzZSBvd24gd3JpdGUoKSBtZXRob2QgdG8gY29uc3RydWN0IGZ1bGwgbW9kdWxlIHZhbHVlLlxuICAgICAgICAgICAgICAgIC8vQnV0IG5lZWQgdG8gY3JlYXRlIHNoZWxsIHRoYXQgdHJhbnNsYXRlcyB3cml0ZUZpbGUnc1xuICAgICAgICAgICAgICAgIC8vd3JpdGUoKSB0byB0aGUgcmlnaHQgaW50ZXJmYWNlLlxuICAgICAgICAgICAgICAgIHZhciB0ZXh0V3JpdGUgPSBmdW5jdGlvbiAoY29udGVudHMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHdyaXRlKGZpbGVOYW1lLCBjb250ZW50cyk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB0ZXh0V3JpdGUuYXNNb2R1bGUgPSBmdW5jdGlvbiAobW9kdWxlTmFtZSwgY29udGVudHMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHdyaXRlLmFzTW9kdWxlKG1vZHVsZU5hbWUsIGZpbGVOYW1lLCBjb250ZW50cyk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIHRleHQud3JpdGUocGx1Z2luTmFtZSwgbm9uU3RyaXBOYW1lLCB0ZXh0V3JpdGUsIGNvbmZpZyk7XG4gICAgICAgICAgICB9LCBjb25maWcpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGlmIChtYXN0ZXJDb25maWcuZW52ID09PSAnbm9kZScgfHwgKCFtYXN0ZXJDb25maWcuZW52ICYmXG4gICAgICAgICAgICB0eXBlb2YgcHJvY2VzcyAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgICAgICAgICAgcHJvY2Vzcy52ZXJzaW9ucyAmJlxuICAgICAgICAgICAgISFwcm9jZXNzLnZlcnNpb25zLm5vZGUgJiZcbiAgICAgICAgICAgICFwcm9jZXNzLnZlcnNpb25zWydub2RlLXdlYmtpdCddICYmXG4gICAgICAgICAgICAhcHJvY2Vzcy52ZXJzaW9uc1snYXRvbS1zaGVsbCddKSkge1xuICAgICAgICAvL1VzaW5nIHNwZWNpYWwgcmVxdWlyZS5ub2RlUmVxdWlyZSwgc29tZXRoaW5nIGFkZGVkIGJ5IHIuanMuXG4gICAgICAgIGZzID0gcmVxdWlyZS5ub2RlUmVxdWlyZSgnZnMnKTtcblxuICAgICAgICB0ZXh0LmdldCA9IGZ1bmN0aW9uICh1cmwsIGNhbGxiYWNrLCBlcnJiYWNrKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHZhciBmaWxlID0gZnMucmVhZEZpbGVTeW5jKHVybCwgJ3V0ZjgnKTtcbiAgICAgICAgICAgICAgICAvL1JlbW92ZSBCT00gKEJ5dGUgTWFyayBPcmRlcikgZnJvbSB1dGY4IGZpbGVzIGlmIGl0IGlzIHRoZXJlLlxuICAgICAgICAgICAgICAgIGlmIChmaWxlWzBdID09PSAnXFx1RkVGRicpIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsZSA9IGZpbGUuc3Vic3RyaW5nKDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYWxsYmFjayhmaWxlKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBlcnJiYWNrKGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKG1hc3RlckNvbmZpZy5lbnYgPT09ICd4aHInIHx8ICghbWFzdGVyQ29uZmlnLmVudiAmJlxuICAgICAgICAgICAgdGV4dC5jcmVhdGVYaHIoKSkpIHtcbiAgICAgICAgdGV4dC5nZXQgPSBmdW5jdGlvbiAodXJsLCBjYWxsYmFjaywgZXJyYmFjaywgaGVhZGVycykge1xuICAgICAgICAgICAgdmFyIHhociA9IHRleHQuY3JlYXRlWGhyKCksIGhlYWRlcjtcbiAgICAgICAgICAgIHhoci5vcGVuKCdHRVQnLCB1cmwsIHRydWUpO1xuXG4gICAgICAgICAgICAvL0FsbG93IHBsdWdpbnMgZGlyZWN0IGFjY2VzcyB0byB4aHIgaGVhZGVyc1xuICAgICAgICAgICAgaWYgKGhlYWRlcnMpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGhlYWRlciBpbiBoZWFkZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChoZWFkZXJzLmhhc093blByb3BlcnR5KGhlYWRlcikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKGhlYWRlci50b0xvd2VyQ2FzZSgpLCBoZWFkZXJzW2hlYWRlcl0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvL0FsbG93IG92ZXJyaWRlcyBzcGVjaWZpZWQgaW4gY29uZmlnXG4gICAgICAgICAgICBpZiAobWFzdGVyQ29uZmlnLm9uWGhyKSB7XG4gICAgICAgICAgICAgICAgbWFzdGVyQ29uZmlnLm9uWGhyKHhociwgdXJsKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RhdHVzLCBlcnI7XG4gICAgICAgICAgICAgICAgLy9EbyBub3QgZXhwbGljaXRseSBoYW5kbGUgZXJyb3JzLCB0aG9zZSBzaG91bGQgYmVcbiAgICAgICAgICAgICAgICAvL3Zpc2libGUgdmlhIGNvbnNvbGUgb3V0cHV0IGluIHRoZSBicm93c2VyLlxuICAgICAgICAgICAgICAgIGlmICh4aHIucmVhZHlTdGF0ZSA9PT0gNCkge1xuICAgICAgICAgICAgICAgICAgICBzdGF0dXMgPSB4aHIuc3RhdHVzIHx8IDA7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdGF0dXMgPiAzOTkgJiYgc3RhdHVzIDwgNjAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL0FuIGh0dHAgNHh4IG9yIDV4eCBlcnJvci4gU2lnbmFsIGFuIGVycm9yLlxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyID0gbmV3IEVycm9yKHVybCArICcgSFRUUCBzdGF0dXM6ICcgKyBzdGF0dXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZXJyLnhociA9IHhocjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnJiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyYmFjayhlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soeGhyLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAobWFzdGVyQ29uZmlnLm9uWGhyQ29tcGxldGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hc3RlckNvbmZpZy5vblhockNvbXBsZXRlKHhociwgdXJsKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB4aHIuc2VuZChudWxsKTtcbiAgICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKG1hc3RlckNvbmZpZy5lbnYgPT09ICdyaGlubycgfHwgKCFtYXN0ZXJDb25maWcuZW52ICYmXG4gICAgICAgICAgICB0eXBlb2YgUGFja2FnZXMgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBqYXZhICE9PSAndW5kZWZpbmVkJykpIHtcbiAgICAgICAgLy9XaHkgSmF2YSwgd2h5IGlzIHRoaXMgc28gYXdrd2FyZD9cbiAgICAgICAgdGV4dC5nZXQgPSBmdW5jdGlvbiAodXJsLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgdmFyIHN0cmluZ0J1ZmZlciwgbGluZSxcbiAgICAgICAgICAgICAgICBlbmNvZGluZyA9IFwidXRmLThcIixcbiAgICAgICAgICAgICAgICBmaWxlID0gbmV3IGphdmEuaW8uRmlsZSh1cmwpLFxuICAgICAgICAgICAgICAgIGxpbmVTZXBhcmF0b3IgPSBqYXZhLmxhbmcuU3lzdGVtLmdldFByb3BlcnR5KFwibGluZS5zZXBhcmF0b3JcIiksXG4gICAgICAgICAgICAgICAgaW5wdXQgPSBuZXcgamF2YS5pby5CdWZmZXJlZFJlYWRlcihuZXcgamF2YS5pby5JbnB1dFN0cmVhbVJlYWRlcihuZXcgamF2YS5pby5GaWxlSW5wdXRTdHJlYW0oZmlsZSksIGVuY29kaW5nKSksXG4gICAgICAgICAgICAgICAgY29udGVudCA9ICcnO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBzdHJpbmdCdWZmZXIgPSBuZXcgamF2YS5sYW5nLlN0cmluZ0J1ZmZlcigpO1xuICAgICAgICAgICAgICAgIGxpbmUgPSBpbnB1dC5yZWFkTGluZSgpO1xuXG4gICAgICAgICAgICAgICAgLy8gQnl0ZSBPcmRlciBNYXJrIChCT00pIC0gVGhlIFVuaWNvZGUgU3RhbmRhcmQsIHZlcnNpb24gMy4wLCBwYWdlIDMyNFxuICAgICAgICAgICAgICAgIC8vIGh0dHA6Ly93d3cudW5pY29kZS5vcmcvZmFxL3V0Zl9ib20uaHRtbFxuXG4gICAgICAgICAgICAgICAgLy8gTm90ZSB0aGF0IHdoZW4gd2UgdXNlIHV0Zi04LCB0aGUgQk9NIHNob3VsZCBhcHBlYXIgYXMgXCJFRiBCQiBCRlwiLCBidXQgaXQgZG9lc24ndCBkdWUgdG8gdGhpcyBidWcgaW4gdGhlIEpESzpcbiAgICAgICAgICAgICAgICAvLyBodHRwOi8vYnVncy5zdW4uY29tL2J1Z2RhdGFiYXNlL3ZpZXdfYnVnLmRvP2J1Z19pZD00NTA4MDU4XG4gICAgICAgICAgICAgICAgaWYgKGxpbmUgJiYgbGluZS5sZW5ndGgoKSAmJiBsaW5lLmNoYXJBdCgwKSA9PT0gMHhmZWZmKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEVhdCB0aGUgQk9NLCBzaW5jZSB3ZSd2ZSBhbHJlYWR5IGZvdW5kIHRoZSBlbmNvZGluZyBvbiB0aGlzIGZpbGUsXG4gICAgICAgICAgICAgICAgICAgIC8vIGFuZCB3ZSBwbGFuIHRvIGNvbmNhdGVuYXRpbmcgdGhpcyBidWZmZXIgd2l0aCBvdGhlcnM7IHRoZSBCT00gc2hvdWxkXG4gICAgICAgICAgICAgICAgICAgIC8vIG9ubHkgYXBwZWFyIGF0IHRoZSB0b3Agb2YgYSBmaWxlLlxuICAgICAgICAgICAgICAgICAgICBsaW5lID0gbGluZS5zdWJzdHJpbmcoMSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGxpbmUgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RyaW5nQnVmZmVyLmFwcGVuZChsaW5lKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB3aGlsZSAoKGxpbmUgPSBpbnB1dC5yZWFkTGluZSgpKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBzdHJpbmdCdWZmZXIuYXBwZW5kKGxpbmVTZXBhcmF0b3IpO1xuICAgICAgICAgICAgICAgICAgICBzdHJpbmdCdWZmZXIuYXBwZW5kKGxpbmUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvL01ha2Ugc3VyZSB3ZSByZXR1cm4gYSBKYXZhU2NyaXB0IHN0cmluZyBhbmQgbm90IGEgSmF2YSBzdHJpbmcuXG4gICAgICAgICAgICAgICAgY29udGVudCA9IFN0cmluZyhzdHJpbmdCdWZmZXIudG9TdHJpbmcoKSk7IC8vU3RyaW5nXG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIGlucHV0LmNsb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYWxsYmFjayhjb250ZW50KTtcbiAgICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKG1hc3RlckNvbmZpZy5lbnYgPT09ICd4cGNvbm5lY3QnIHx8ICghbWFzdGVyQ29uZmlnLmVudiAmJlxuICAgICAgICAgICAgdHlwZW9mIENvbXBvbmVudHMgIT09ICd1bmRlZmluZWQnICYmIENvbXBvbmVudHMuY2xhc3NlcyAmJlxuICAgICAgICAgICAgQ29tcG9uZW50cy5pbnRlcmZhY2VzKSkge1xuICAgICAgICAvL0F2ZXJ0IHlvdXIgZ2F6ZSFcbiAgICAgICAgQ2MgPSBDb21wb25lbnRzLmNsYXNzZXM7XG4gICAgICAgIENpID0gQ29tcG9uZW50cy5pbnRlcmZhY2VzO1xuICAgICAgICBDb21wb25lbnRzLnV0aWxzWydpbXBvcnQnXSgncmVzb3VyY2U6Ly9ncmUvbW9kdWxlcy9GaWxlVXRpbHMuanNtJyk7XG4gICAgICAgIHhwY0lzV2luZG93cyA9ICgnQG1vemlsbGEub3JnL3dpbmRvd3MtcmVnaXN0cnkta2V5OzEnIGluIENjKTtcblxuICAgICAgICB0ZXh0LmdldCA9IGZ1bmN0aW9uICh1cmwsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICB2YXIgaW5TdHJlYW0sIGNvbnZlcnRTdHJlYW0sIGZpbGVPYmosXG4gICAgICAgICAgICAgICAgcmVhZERhdGEgPSB7fTtcblxuICAgICAgICAgICAgaWYgKHhwY0lzV2luZG93cykge1xuICAgICAgICAgICAgICAgIHVybCA9IHVybC5yZXBsYWNlKC9cXC8vZywgJ1xcXFwnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZmlsZU9iaiA9IG5ldyBGaWxlVXRpbHMuRmlsZSh1cmwpO1xuXG4gICAgICAgICAgICAvL1hQQ09NLCB5b3Ugc28gY3JhenlcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaW5TdHJlYW0gPSBDY1snQG1vemlsbGEub3JnL25ldHdvcmsvZmlsZS1pbnB1dC1zdHJlYW07MSddXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAuY3JlYXRlSW5zdGFuY2UoQ2kubnNJRmlsZUlucHV0U3RyZWFtKTtcbiAgICAgICAgICAgICAgICBpblN0cmVhbS5pbml0KGZpbGVPYmosIDEsIDAsIGZhbHNlKTtcblxuICAgICAgICAgICAgICAgIGNvbnZlcnRTdHJlYW0gPSBDY1snQG1vemlsbGEub3JnL2ludGwvY29udmVydGVyLWlucHV0LXN0cmVhbTsxJ11cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmNyZWF0ZUluc3RhbmNlKENpLm5zSUNvbnZlcnRlcklucHV0U3RyZWFtKTtcbiAgICAgICAgICAgICAgICBjb252ZXJ0U3RyZWFtLmluaXQoaW5TdHJlYW0sIFwidXRmLThcIiwgaW5TdHJlYW0uYXZhaWxhYmxlKCksXG4gICAgICAgICAgICAgICAgQ2kubnNJQ29udmVydGVySW5wdXRTdHJlYW0uREVGQVVMVF9SRVBMQUNFTUVOVF9DSEFSQUNURVIpO1xuXG4gICAgICAgICAgICAgICAgY29udmVydFN0cmVhbS5yZWFkU3RyaW5nKGluU3RyZWFtLmF2YWlsYWJsZSgpLCByZWFkRGF0YSk7XG4gICAgICAgICAgICAgICAgY29udmVydFN0cmVhbS5jbG9zZSgpO1xuICAgICAgICAgICAgICAgIGluU3RyZWFtLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2socmVhZERhdGEudmFsdWUpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigoZmlsZU9iaiAmJiBmaWxlT2JqLnBhdGggfHwgJycpICsgJzogJyArIGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gdGV4dDtcbn0pO1xuIl0sImZpbGUiOiJyZXF1aXJlLnRleHQuanMifQ==
