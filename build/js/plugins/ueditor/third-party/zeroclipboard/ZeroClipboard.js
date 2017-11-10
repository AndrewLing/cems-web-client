/*!
* ZeroClipboard
* The ZeroClipboard library provides an easy way to copy text to the clipboard using an invisible Adobe Flash movie and a JavaScript interface.
* Copyright (c) 2014 Jon Rohan, James M. Greene
* Licensed MIT
* http://zeroclipboard.org/
* v2.0.0-beta.5
*/
(function(window) {
  "use strict";
  var _currentElement;
  var _flashState = {
    bridge: null,
    version: "0.0.0",
    pluginType: "unknown",
    disabled: null,
    outdated: null,
    unavailable: null,
    deactivated: null,
    overdue: null,
    ready: null
  };
  var _clipData = {};
  var _clipDataFormatMap = null;
  var _clientIdCounter = 0;
  var _clientMeta = {};
  var _elementIdCounter = 0;
  var _elementMeta = {};
  var _swfPath = function() {
    var i, jsDir, tmpJsPath, jsPath, swfPath = "ZeroClipboard.swf";
    if (!(document.currentScript && (jsPath = document.currentScript.src))) {
      var scripts = document.getElementsByTagName("script");
      if ("readyState" in scripts[0]) {
        for (i = scripts.length; i--; ) {
          if (scripts[i].readyState === "interactive" && (jsPath = scripts[i].src)) {
            break;
          }
        }
      } else if (document.readyState === "loading") {
        jsPath = scripts[scripts.length - 1].src;
      } else {
        for (i = scripts.length; i--; ) {
          tmpJsPath = scripts[i].src;
          if (!tmpJsPath) {
            jsDir = null;
            break;
          }
          tmpJsPath = tmpJsPath.split("#")[0].split("?")[0];
          tmpJsPath = tmpJsPath.slice(0, tmpJsPath.lastIndexOf("/") + 1);
          if (jsDir == null) {
            jsDir = tmpJsPath;
          } else if (jsDir !== tmpJsPath) {
            jsDir = null;
            break;
          }
        }
        if (jsDir !== null) {
          jsPath = jsDir;
        }
      }
    }
    if (jsPath) {
      jsPath = jsPath.split("#")[0].split("?")[0];
      swfPath = jsPath.slice(0, jsPath.lastIndexOf("/") + 1) + swfPath;
    }
    return swfPath;
  }();
  var _camelizeCssPropName = function() {
    var matcherRegex = /\-([a-z])/g, replacerFn = function(match, group) {
      return group.toUpperCase();
    };
    return function(prop) {
      return prop.replace(matcherRegex, replacerFn);
    };
  }();
  var _getStyle = function(el, prop) {
    var value, camelProp, tagName;
    if (window.getComputedStyle) {
      value = window.getComputedStyle(el, null).getPropertyValue(prop);
    } else {
      camelProp = _camelizeCssPropName(prop);
      if (el.currentStyle) {
        value = el.currentStyle[camelProp];
      } else {
        value = el.style[camelProp];
      }
    }
    if (prop === "cursor") {
      if (!value || value === "auto") {
        tagName = el.tagName.toLowerCase();
        if (tagName === "a") {
          return "pointer";
        }
      }
    }
    return value;
  };
  var _elementMouseOver = function(event) {
    if (!event) {
      event = window.event;
    }
    var target;
    if (this !== window) {
      target = this;
    } else if (event.target) {
      target = event.target;
    } else if (event.srcElement) {
      target = event.srcElement;
    }
    ZeroClipboard.activate(target);
  };
  var _addEventHandler = function(element, method, func) {
    if (!element || element.nodeType !== 1) {
      return;
    }
    if (element.addEventListener) {
      element.addEventListener(method, func, false);
    } else if (element.attachEvent) {
      element.attachEvent("on" + method, func);
    }
  };
  var _removeEventHandler = function(element, method, func) {
    if (!element || element.nodeType !== 1) {
      return;
    }
    if (element.removeEventListener) {
      element.removeEventListener(method, func, false);
    } else if (element.detachEvent) {
      element.detachEvent("on" + method, func);
    }
  };
  var _addClass = function(element, value) {
    if (!element || element.nodeType !== 1) {
      return element;
    }
    if (element.classList) {
      if (!element.classList.contains(value)) {
        element.classList.add(value);
      }
      return element;
    }
    if (value && typeof value === "string") {
      var classNames = (value || "").split(/\s+/);
      if (element.nodeType === 1) {
        if (!element.className) {
          element.className = value;
        } else {
          var className = " " + element.className + " ", setClass = element.className;
          for (var c = 0, cl = classNames.length; c < cl; c++) {
            if (className.indexOf(" " + classNames[c] + " ") < 0) {
              setClass += " " + classNames[c];
            }
          }
          element.className = setClass.replace(/^\s+|\s+$/g, "");
        }
      }
    }
    return element;
  };
  var _removeClass = function(element, value) {
    if (!element || element.nodeType !== 1) {
      return element;
    }
    if (element.classList) {
      if (element.classList.contains(value)) {
        element.classList.remove(value);
      }
      return element;
    }
    if (value && typeof value === "string" || value === undefined) {
      var classNames = (value || "").split(/\s+/);
      if (element.nodeType === 1 && element.className) {
        if (value) {
          var className = (" " + element.className + " ").replace(/[\n\t]/g, " ");
          for (var c = 0, cl = classNames.length; c < cl; c++) {
            className = className.replace(" " + classNames[c] + " ", " ");
          }
          element.className = className.replace(/^\s+|\s+$/g, "");
        } else {
          element.className = "";
        }
      }
    }
    return element;
  };
  var _getZoomFactor = function() {
    var rect, physicalWidth, logicalWidth, zoomFactor = 1;
    if (typeof document.body.getBoundingClientRect === "function") {
      rect = document.body.getBoundingClientRect();
      physicalWidth = rect.right - rect.left;
      logicalWidth = document.body.offsetWidth;
      zoomFactor = Math.round(physicalWidth / logicalWidth * 100) / 100;
    }
    return zoomFactor;
  };
  var _getDOMObjectPosition = function(obj, defaultZIndex) {
    var info = {
      left: 0,
      top: 0,
      width: 0,
      height: 0,
      zIndex: _getSafeZIndex(defaultZIndex) - 1
    };
    if (obj.getBoundingClientRect) {
      var rect = obj.getBoundingClientRect();
      var pageXOffset, pageYOffset, zoomFactor;
      if ("pageXOffset" in window && "pageYOffset" in window) {
        pageXOffset = window.pageXOffset;
        pageYOffset = window.pageYOffset;
      } else {
        zoomFactor = _getZoomFactor();
        pageXOffset = Math.round(document.documentElement.scrollLeft / zoomFactor);
        pageYOffset = Math.round(document.documentElement.scrollTop / zoomFactor);
      }
      var leftBorderWidth = document.documentElement.clientLeft || 0;
      var topBorderWidth = document.documentElement.clientTop || 0;
      info.left = rect.left + pageXOffset - leftBorderWidth;
      info.top = rect.top + pageYOffset - topBorderWidth;
      info.width = "width" in rect ? rect.width : rect.right - rect.left;
      info.height = "height" in rect ? rect.height : rect.bottom - rect.top;
    }
    return info;
  };
  var _cacheBust = function(path, options) {
    var cacheBust = options == null || options && options.cacheBust === true;
    if (cacheBust) {
      return (path.indexOf("?") === -1 ? "?" : "&") + "noCache=" + new Date().getTime();
    } else {
      return "";
    }
  };
  var _vars = function(options) {
    var i, len, domain, domains, str = "", trustedOriginsExpanded = [];
    if (options.trustedDomains) {
      if (typeof options.trustedDomains === "string") {
        domains = [ options.trustedDomains ];
      } else if (typeof options.trustedDomains === "object" && "length" in options.trustedDomains) {
        domains = options.trustedDomains;
      }
    }
    if (domains && domains.length) {
      for (i = 0, len = domains.length; i < len; i++) {
        if (domains.hasOwnProperty(i) && domains[i] && typeof domains[i] === "string") {
          domain = _extractDomain(domains[i]);
          if (!domain) {
            continue;
          }
          if (domain === "*") {
            trustedOriginsExpanded = [ domain ];
            break;
          }
          trustedOriginsExpanded.push.apply(trustedOriginsExpanded, [ domain, "//" + domain, window.location.protocol + "//" + domain ]);
        }
      }
    }
    if (trustedOriginsExpanded.length) {
      str += "trustedOrigins=" + encodeURIComponent(trustedOriginsExpanded.join(","));
    }
    if (options.forceEnhancedClipboard === true) {
      str += (str ? "&" : "") + "forceEnhancedClipboard=true";
    }
    return str;
  };
  var _inArray = function(elem, array, fromIndex) {
    if (typeof array.indexOf === "function") {
      return array.indexOf(elem, fromIndex);
    }
    var i, len = array.length;
    if (typeof fromIndex === "undefined") {
      fromIndex = 0;
    } else if (fromIndex < 0) {
      fromIndex = len + fromIndex;
    }
    for (i = fromIndex; i < len; i++) {
      if (array.hasOwnProperty(i) && array[i] === elem) {
        return i;
      }
    }
    return -1;
  };
  var _prepClip = function(elements) {
    if (typeof elements === "string") {
      throw new TypeError("ZeroClipboard doesn't accept query strings.");
    }
    return typeof elements.length !== "number" ? [ elements ] : elements;
  };
  var _dispatchCallback = function(func, context, args, async) {
    if (async) {
      window.setTimeout(function() {
        func.apply(context, args);
      }, 0);
    } else {
      func.apply(context, args);
    }
  };
  var _getSafeZIndex = function(val) {
    var zIndex, tmp;
    if (val) {
      if (typeof val === "number" && val > 0) {
        zIndex = val;
      } else if (typeof val === "string" && (tmp = parseInt(val, 10)) && !isNaN(tmp) && tmp > 0) {
        zIndex = tmp;
      }
    }
    if (!zIndex) {
      if (typeof _globalConfig.zIndex === "number" && _globalConfig.zIndex > 0) {
        zIndex = _globalConfig.zIndex;
      } else if (typeof _globalConfig.zIndex === "string" && (tmp = parseInt(_globalConfig.zIndex, 10)) && !isNaN(tmp) && tmp > 0) {
        zIndex = tmp;
      }
    }
    return zIndex || 0;
  };
  var _extend = function() {
    var i, len, arg, prop, src, copy, target = arguments[0] || {};
    for (i = 1, len = arguments.length; i < len; i++) {
      if ((arg = arguments[i]) != null) {
        for (prop in arg) {
          if (arg.hasOwnProperty(prop)) {
            src = target[prop];
            copy = arg[prop];
            if (target === copy) {
              continue;
            }
            if (copy !== undefined) {
              target[prop] = copy;
            }
          }
        }
      }
    }
    return target;
  };
  var _extractDomain = function(originOrUrl) {
    if (originOrUrl == null || originOrUrl === "") {
      return null;
    }
    originOrUrl = originOrUrl.replace(/^\s+|\s+$/g, "");
    if (originOrUrl === "") {
      return null;
    }
    var protocolIndex = originOrUrl.indexOf("//");
    originOrUrl = protocolIndex === -1 ? originOrUrl : originOrUrl.slice(protocolIndex + 2);
    var pathIndex = originOrUrl.indexOf("/");
    originOrUrl = pathIndex === -1 ? originOrUrl : protocolIndex === -1 || pathIndex === 0 ? null : originOrUrl.slice(0, pathIndex);
    if (originOrUrl && originOrUrl.slice(-4).toLowerCase() === ".swf") {
      return null;
    }
    return originOrUrl || null;
  };
  var _determineScriptAccess = function() {
    var _extractAllDomains = function(origins, resultsArray) {
      var i, len, tmp;
      if (origins == null || resultsArray[0] === "*") {
        return;
      }
      if (typeof origins === "string") {
        origins = [ origins ];
      }
      if (!(typeof origins === "object" && typeof origins.length === "number")) {
        return;
      }
      for (i = 0, len = origins.length; i < len; i++) {
        if (origins.hasOwnProperty(i) && (tmp = _extractDomain(origins[i]))) {
          if (tmp === "*") {
            resultsArray.length = 0;
            resultsArray.push("*");
            break;
          }
          if (_inArray(tmp, resultsArray) === -1) {
            resultsArray.push(tmp);
          }
        }
      }
    };
    return function(currentDomain, configOptions) {
      var swfDomain = _extractDomain(configOptions.swfPath);
      if (swfDomain === null) {
        swfDomain = currentDomain;
      }
      var trustedDomains = [];
      _extractAllDomains(configOptions.trustedOrigins, trustedDomains);
      _extractAllDomains(configOptions.trustedDomains, trustedDomains);
      var len = trustedDomains.length;
      if (len > 0) {
        if (len === 1 && trustedDomains[0] === "*") {
          return "always";
        }
        if (_inArray(currentDomain, trustedDomains) !== -1) {
          if (len === 1 && currentDomain === swfDomain) {
            return "sameDomain";
          }
          return "always";
        }
      }
      return "never";
    };
  }();
  var _objectKeys = function(obj) {
    if (obj == null) {
      return [];
    }
    if (Object.keys) {
      return Object.keys(obj);
    }
    var keys = [];
    for (var prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        keys.push(prop);
      }
    }
    return keys;
  };
  var _deleteOwnProperties = function(obj) {
    if (obj) {
      for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
          delete obj[prop];
        }
      }
    }
    return obj;
  };
  var _safeActiveElement = function() {
    try {
      return document.activeElement;
    } catch (err) {}
    return null;
  };
  var _pick = function(obj, keys) {
    var newObj = {};
    for (var i = 0, len = keys.length; i < len; i++) {
      if (keys[i] in obj) {
        newObj[keys[i]] = obj[keys[i]];
      }
    }
    return newObj;
  };
  var _omit = function(obj, keys) {
    var newObj = {};
    for (var prop in obj) {
      if (_inArray(prop, keys) === -1) {
        newObj[prop] = obj[prop];
      }
    }
    return newObj;
  };
  var _mapClipDataToFlash = function(clipData) {
    var newClipData = {}, formatMap = {};
    if (!(typeof clipData === "object" && clipData)) {
      return;
    }
    for (var dataFormat in clipData) {
      if (dataFormat && clipData.hasOwnProperty(dataFormat) && typeof clipData[dataFormat] === "string" && clipData[dataFormat]) {
        switch (dataFormat.toLowerCase()) {
         case "text/plain":
         case "text":
         case "air:text":
         case "flash:text":
          newClipData.text = clipData[dataFormat];
          formatMap.text = dataFormat;
          break;

         case "text/html":
         case "html":
         case "air:html":
         case "flash:html":
          newClipData.html = clipData[dataFormat];
          formatMap.html = dataFormat;
          break;

         case "application/rtf":
         case "text/rtf":
         case "rtf":
         case "richtext":
         case "air:rtf":
         case "flash:rtf":
          newClipData.rtf = clipData[dataFormat];
          formatMap.rtf = dataFormat;
          break;

         default:
          break;
        }
      }
    }
    return {
      data: newClipData,
      formatMap: formatMap
    };
  };
  var _mapClipResultsFromFlash = function(clipResults, formatMap) {
    if (!(typeof clipResults === "object" && clipResults && typeof formatMap === "object" && formatMap)) {
      return clipResults;
    }
    var newResults = {};
    for (var prop in clipResults) {
      if (clipResults.hasOwnProperty(prop)) {
        if (prop !== "success" && prop !== "data") {
          newResults[prop] = clipResults[prop];
          continue;
        }
        newResults[prop] = {};
        var tmpHash = clipResults[prop];
        for (var dataFormat in tmpHash) {
          if (dataFormat && tmpHash.hasOwnProperty(dataFormat) && formatMap.hasOwnProperty(dataFormat)) {
            newResults[prop][formatMap[dataFormat]] = tmpHash[dataFormat];
          }
        }
      }
    }
    return newResults;
  };
  var _args = function(arraySlice) {
    return function(args) {
      return arraySlice.call(args, 0);
    };
  }(window.Array.prototype.slice);
  var _detectFlashSupport = function() {
    var plugin, ax, mimeType, hasFlash = false, isActiveX = false, isPPAPI = false, flashVersion = "";
    function parseFlashVersion(desc) {
      var matches = desc.match(/[\d]+/g);
      matches.length = 3;
      return matches.join(".");
    }
    function isPepperFlash(flashPlayerFileName) {
      return !!flashPlayerFileName && (flashPlayerFileName = flashPlayerFileName.toLowerCase()) && (/^(pepflashplayer\.dll|libpepflashplayer\.so|pepperflashplayer\.plugin)$/.test(flashPlayerFileName) || flashPlayerFileName.slice(-13) === "chrome.plugin");
    }
    function inspectPlugin(plugin) {
      if (plugin) {
        hasFlash = true;
        if (plugin.version) {
          flashVersion = parseFlashVersion(plugin.version);
        }
        if (!flashVersion && plugin.description) {
          flashVersion = parseFlashVersion(plugin.description);
        }
        if (plugin.filename) {
          isPPAPI = isPepperFlash(plugin.filename);
        }
      }
    }
    if (navigator.plugins && navigator.plugins.length) {
      plugin = navigator.plugins["Shockwave Flash"];
      inspectPlugin(plugin);
      if (navigator.plugins["Shockwave Flash 2.0"]) {
        hasFlash = true;
        flashVersion = "2.0.0.11";
      }
    } else if (navigator.mimeTypes && navigator.mimeTypes.length) {
      mimeType = navigator.mimeTypes["application/x-shockwave-flash"];
      plugin = mimeType && mimeType.enabledPlugin;
      inspectPlugin(plugin);
    } else if (typeof ActiveXObject !== "undefined") {
      isActiveX = true;
      try {
        ax = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.7");
        hasFlash = true;
        flashVersion = parseFlashVersion(ax.GetVariable("$version"));
      } catch (e1) {
        try {
          ax = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.6");
          hasFlash = true;
          flashVersion = "6.0.21";
        } catch (e2) {
          try {
            ax = new ActiveXObject("ShockwaveFlash.ShockwaveFlash");
            hasFlash = true;
            flashVersion = parseFlashVersion(ax.GetVariable("$version"));
          } catch (e3) {
            isActiveX = false;
          }
        }
      }
    }
    _flashState.disabled = hasFlash !== true;
    _flashState.outdated = flashVersion && parseFloat(flashVersion) < 11;
    _flashState.version = flashVersion || "0.0.0";
    _flashState.pluginType = isPPAPI ? "pepper" : isActiveX ? "activex" : hasFlash ? "netscape" : "unknown";
  };
  _detectFlashSupport();
  var ZeroClipboard = function(elements) {
    if (!(this instanceof ZeroClipboard)) {
      return new ZeroClipboard(elements);
    }
    this.id = "" + _clientIdCounter++;
    _clientMeta[this.id] = {
      instance: this,
      elements: [],
      handlers: {}
    };
    if (elements) {
      this.clip(elements);
    }
    if (typeof _flashState.ready !== "boolean") {
      _flashState.ready = false;
    }
    if (!ZeroClipboard.isFlashUnusable() && _flashState.bridge === null) {
      var _client = this;
      var maxWait = _globalConfig.flashLoadTimeout;
      if (typeof maxWait === "number" && maxWait >= 0) {
        setTimeout(function() {
          if (typeof _flashState.deactivated !== "boolean") {
            _flashState.deactivated = true;
          }
          if (_flashState.deactivated === true) {
            ZeroClipboard.emit({
              type: "error",
              name: "flash-deactivated",
              client: _client
            });
          }
        }, maxWait);
      }
      _flashState.overdue = false;
      _bridge();
    }
  };
  ZeroClipboard.prototype.setText = function(text) {
    ZeroClipboard.setData("text/plain", text);
    return this;
  };
  ZeroClipboard.prototype.setHtml = function(html) {
    ZeroClipboard.setData("text/html", html);
    return this;
  };
  ZeroClipboard.prototype.setRichText = function(richText) {
    ZeroClipboard.setData("application/rtf", richText);
    return this;
  };
  ZeroClipboard.prototype.setData = function() {
    ZeroClipboard.setData.apply(ZeroClipboard, _args(arguments));
    return this;
  };
  ZeroClipboard.prototype.clearData = function() {
    ZeroClipboard.clearData.apply(ZeroClipboard, _args(arguments));
    return this;
  };
  ZeroClipboard.prototype.setSize = function(width, height) {
    _setSize(width, height);
    return this;
  };
  var _setHandCursor = function(enabled) {
    if (_flashState.ready === true && _flashState.bridge && typeof _flashState.bridge.setHandCursor === "function") {
      _flashState.bridge.setHandCursor(enabled);
    } else {
      _flashState.ready = false;
    }
  };
  ZeroClipboard.prototype.destroy = function() {
    this.unclip();
    this.off();
    delete _clientMeta[this.id];
  };
  var _getAllClients = function() {
    var i, len, client, clients = [], clientIds = _objectKeys(_clientMeta);
    for (i = 0, len = clientIds.length; i < len; i++) {
      client = _clientMeta[clientIds[i]].instance;
      if (client && client instanceof ZeroClipboard) {
        clients.push(client);
      }
    }
    return clients;
  };
  ZeroClipboard.version = "2.0.0-beta.5";
  var _globalConfig = {
    swfPath: _swfPath,
    trustedDomains: window.location.host ? [ window.location.host ] : [],
    cacheBust: true,
    forceHandCursor: false,
    forceEnhancedClipboard: false,
    zIndex: 999999999,
    debug: false,
    title: null,
    autoActivate: true,
    flashLoadTimeout: 3e4
  };
  ZeroClipboard.isFlashUnusable = function() {
    return !!(_flashState.disabled || _flashState.outdated || _flashState.unavailable || _flashState.deactivated);
  };
  ZeroClipboard.config = function(options) {
    if (typeof options === "object" && options !== null) {
      _extend(_globalConfig, options);
    }
    if (typeof options === "string" && options) {
      if (_globalConfig.hasOwnProperty(options)) {
        return _globalConfig[options];
      }
      return;
    }
    var copy = {};
    for (var prop in _globalConfig) {
      if (_globalConfig.hasOwnProperty(prop)) {
        if (typeof _globalConfig[prop] === "object" && _globalConfig[prop] !== null) {
          if ("length" in _globalConfig[prop]) {
            copy[prop] = _globalConfig[prop].slice(0);
          } else {
            copy[prop] = _extend({}, _globalConfig[prop]);
          }
        } else {
          copy[prop] = _globalConfig[prop];
        }
      }
    }
    return copy;
  };
  ZeroClipboard.destroy = function() {
    ZeroClipboard.deactivate();
    for (var clientId in _clientMeta) {
      if (_clientMeta.hasOwnProperty(clientId) && _clientMeta[clientId]) {
        var client = _clientMeta[clientId].instance;
        if (client && typeof client.destroy === "function") {
          client.destroy();
        }
      }
    }
    var flashBridge = _flashState.bridge;
    if (flashBridge) {
      var htmlBridge = _getHtmlBridge(flashBridge);
      if (htmlBridge) {
        if (_flashState.pluginType === "activex" && "readyState" in flashBridge) {
          flashBridge.style.display = "none";
          (function removeSwfFromIE() {
            if (flashBridge.readyState === 4) {
              for (var prop in flashBridge) {
                if (typeof flashBridge[prop] === "function") {
                  flashBridge[prop] = null;
                }
              }
              flashBridge.parentNode.removeChild(flashBridge);
              if (htmlBridge.parentNode) {
                htmlBridge.parentNode.removeChild(htmlBridge);
              }
            } else {
              setTimeout(removeSwfFromIE, 10);
            }
          })();
        } else {
          flashBridge.parentNode.removeChild(flashBridge);
          if (htmlBridge.parentNode) {
            htmlBridge.parentNode.removeChild(htmlBridge);
          }
        }
      }
      _flashState.ready = null;
      _flashState.bridge = null;
      _flashState.deactivated = null;
    }
    ZeroClipboard.clearData();
  };
  ZeroClipboard.activate = function(element) {
    if (_currentElement) {
      _removeClass(_currentElement, _globalConfig.hoverClass);
      _removeClass(_currentElement, _globalConfig.activeClass);
    }
    _currentElement = element;
    _addClass(element, _globalConfig.hoverClass);
    _reposition();
    var newTitle = _globalConfig.title || element.getAttribute("title");
    if (newTitle) {
      var htmlBridge = _getHtmlBridge(_flashState.bridge);
      if (htmlBridge) {
        htmlBridge.setAttribute("title", newTitle);
      }
    }
    var useHandCursor = _globalConfig.forceHandCursor === true || _getStyle(element, "cursor") === "pointer";
    _setHandCursor(useHandCursor);
  };
  ZeroClipboard.deactivate = function() {
    var htmlBridge = _getHtmlBridge(_flashState.bridge);
    if (htmlBridge) {
      htmlBridge.removeAttribute("title");
      htmlBridge.style.left = "0px";
      htmlBridge.style.top = "-9999px";
      _setSize(1, 1);
    }
    if (_currentElement) {
      _removeClass(_currentElement, _globalConfig.hoverClass);
      _removeClass(_currentElement, _globalConfig.activeClass);
      _currentElement = null;
    }
  };
  ZeroClipboard.state = function() {
    return {
      browser: _pick(window.navigator, [ "userAgent", "platform", "appName" ]),
      flash: _omit(_flashState, [ "bridge" ]),
      zeroclipboard: {
        version: ZeroClipboard.version,
        config: ZeroClipboard.config()
      }
    };
  };
  ZeroClipboard.setData = function(format, data) {
    var dataObj;
    if (typeof format === "object" && format && typeof data === "undefined") {
      dataObj = format;
      ZeroClipboard.clearData();
    } else if (typeof format === "string" && format) {
      dataObj = {};
      dataObj[format] = data;
    } else {
      return;
    }
    for (var dataFormat in dataObj) {
      if (dataFormat && dataObj.hasOwnProperty(dataFormat) && typeof dataObj[dataFormat] === "string" && dataObj[dataFormat]) {
        _clipData[dataFormat] = dataObj[dataFormat];
      }
    }
  };
  ZeroClipboard.clearData = function(format) {
    if (typeof format === "undefined") {
      _deleteOwnProperties(_clipData);
      _clipDataFormatMap = null;
    } else if (typeof format === "string" && _clipData.hasOwnProperty(format)) {
      delete _clipData[format];
    }
  };
  var _bridge = function() {
    var flashBridge, len;
    var container = document.getElementById("global-zeroclipboard-html-bridge");
    if (!container) {
      var allowScriptAccess = _determineScriptAccess(window.location.host, _globalConfig);
      var allowNetworking = allowScriptAccess === "never" ? "none" : "all";
      var flashvars = _vars(_globalConfig);
      var swfUrl = _globalConfig.swfPath + _cacheBust(_globalConfig.swfPath, _globalConfig);
      container = _createHtmlBridge();
      var divToBeReplaced = document.createElement("div");
      container.appendChild(divToBeReplaced);
      document.body.appendChild(container);
      var tmpDiv = document.createElement("div");
      var oldIE = _flashState.pluginType === "activex";
      tmpDiv.innerHTML = '<object id="global-zeroclipboard-flash-bridge" name="global-zeroclipboard-flash-bridge" ' + 'width="100%" height="100%" ' + (oldIE ? 'classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000"' : 'type="application/x-shockwave-flash" data="' + swfUrl + '"') + ">" + (oldIE ? '<param name="movie" value="' + swfUrl + '"/>' : "") + '<param name="allowScriptAccess" value="' + allowScriptAccess + '"/>' + '<param name="allowNetworking" value="' + allowNetworking + '"/>' + '<param name="menu" value="false"/>' + '<param name="wmode" value="transparent"/>' + '<param name="flashvars" value="' + flashvars + '"/>' + "</object>";
      flashBridge = tmpDiv.firstChild;
      tmpDiv = null;
      flashBridge.ZeroClipboard = ZeroClipboard;
      container.replaceChild(flashBridge, divToBeReplaced);
    }
    if (!flashBridge) {
      flashBridge = document["global-zeroclipboard-flash-bridge"];
      if (flashBridge && (len = flashBridge.length)) {
        flashBridge = flashBridge[len - 1];
      }
      if (!flashBridge) {
        flashBridge = container.firstChild;
      }
    }
    _flashState.bridge = flashBridge || null;
  };
  var _createHtmlBridge = function() {
    var container = document.createElement("div");
    container.id = "global-zeroclipboard-html-bridge";
    container.className = "global-zeroclipboard-container";
    container.style.position = "absolute";
    container.style.left = "0px";
    container.style.top = "-9999px";
    container.style.width = "1px";
    container.style.height = "1px";
    container.style.zIndex = "" + _getSafeZIndex(_globalConfig.zIndex);
    return container;
  };
  var _getHtmlBridge = function(flashBridge) {
    var htmlBridge = flashBridge && flashBridge.parentNode;
    while (htmlBridge && htmlBridge.nodeName === "OBJECT" && htmlBridge.parentNode) {
      htmlBridge = htmlBridge.parentNode;
    }
    return htmlBridge || null;
  };
  var _reposition = function() {
    if (_currentElement) {
      var pos = _getDOMObjectPosition(_currentElement, _globalConfig.zIndex);
      var htmlBridge = _getHtmlBridge(_flashState.bridge);
      if (htmlBridge) {
        htmlBridge.style.top = pos.top + "px";
        htmlBridge.style.left = pos.left + "px";
        htmlBridge.style.width = pos.width + "px";
        htmlBridge.style.height = pos.height + "px";
        htmlBridge.style.zIndex = pos.zIndex + 1;
      }
      _setSize(pos.width, pos.height);
    }
  };
  var _setSize = function(width, height) {
    var htmlBridge = _getHtmlBridge(_flashState.bridge);
    if (htmlBridge) {
      htmlBridge.style.width = width + "px";
      htmlBridge.style.height = height + "px";
    }
  };
  ZeroClipboard.emit = function(event) {
    var eventType, eventObj, performCallbackAsync, clients, i, len, eventCopy, returnVal, tmp;
    if (typeof event === "string" && event) {
      eventType = event;
    }
    if (typeof event === "object" && event && typeof event.type === "string" && event.type) {
      eventType = event.type;
      eventObj = event;
    }
    if (!eventType) {
      return;
    }
    event = _createEvent(eventType, eventObj);
    _preprocessEvent(event);
    if (event.type === "ready" && _flashState.overdue === true) {
      return ZeroClipboard.emit({
        type: "error",
        name: "flash-overdue"
      });
    }
    performCallbackAsync = !/^(before)?copy$/.test(event.type);
    if (event.client) {
      _dispatchClientCallbacks.call(event.client, event, performCallbackAsync);
    } else {
      clients = event.target && event.target !== window && _globalConfig.autoActivate === true ? _getAllClientsClippedToElement(event.target) : _getAllClients();
      for (i = 0, len = clients.length; i < len; i++) {
        eventCopy = _extend({}, event, {
          client: clients[i]
        });
        _dispatchClientCallbacks.call(clients[i], eventCopy, performCallbackAsync);
      }
    }
    if (event.type === "copy") {
      tmp = _mapClipDataToFlash(_clipData);
      returnVal = tmp.data;
      _clipDataFormatMap = tmp.formatMap;
    }
    return returnVal;
  };
  var _dispatchClientCallbacks = function(event, async) {
    var handlers = _clientMeta[this.id] && _clientMeta[this.id].handlers[event.type];
    if (handlers && handlers.length) {
      var i, len, func, context, originalContext = this;
      for (i = 0, len = handlers.length; i < len; i++) {
        func = handlers[i];
        context = originalContext;
        if (typeof func === "string" && typeof window[func] === "function") {
          func = window[func];
        }
        if (typeof func === "object" && func && typeof func.handleEvent === "function") {
          context = func;
          func = func.handleEvent;
        }
        if (typeof func === "function") {
          _dispatchCallback(func, context, [ event ], async);
        }
      }
    }
    return this;
  };
  var _eventMessages = {
    ready: "Flash communication is established",
    error: {
      "flash-disabled": "Flash is disabled or not installed",
      "flash-outdated": "Flash is too outdated to support ZeroClipboard",
      "flash-unavailable": "Flash is unable to communicate bidirectionally with JavaScript",
      "flash-deactivated": "Flash is too outdated for your browser and/or is configured as click-to-activate",
      "flash-overdue": "Flash communication was established but NOT within the acceptable time limit"
    }
  };
  var _createEvent = function(eventType, event) {
    if (!(eventType || event && event.type)) {
      return;
    }
    event = event || {};
    eventType = (eventType || event.type).toLowerCase();
    _extend(event, {
      type: eventType,
      target: event.target || _currentElement || null,
      relatedTarget: event.relatedTarget || null,
      currentTarget: _flashState && _flashState.bridge || null
    });
    var msg = _eventMessages[event.type];
    if (event.type === "error" && event.name && msg) {
      msg = msg[event.name];
    }
    if (msg) {
      event.message = msg;
    }
    if (event.type === "ready") {
      _extend(event, {
        target: null,
        version: _flashState.version
      });
    }
    if (event.type === "error") {
      event.target = null;
      if (/^flash-(outdated|unavailable|deactivated|overdue)$/.test(event.name)) {
        _extend(event, {
          version: _flashState.version,
          minimumVersion: "11.0.0"
        });
      }
    }
    if (event.type === "copy") {
      event.clipboardData = {
        setData: ZeroClipboard.setData,
        clearData: ZeroClipboard.clearData
      };
    }
    if (event.type === "aftercopy") {
      event = _mapClipResultsFromFlash(event, _clipDataFormatMap);
    }
    if (event.target && !event.relatedTarget) {
      event.relatedTarget = _getRelatedTarget(event.target);
    }
    return event;
  };
  var _getRelatedTarget = function(targetEl) {
    var relatedTargetId = targetEl && targetEl.getAttribute && targetEl.getAttribute("data-clipboard-target");
    return relatedTargetId ? document.getElementById(relatedTargetId) : null;
  };
  var _preprocessEvent = function(event) {
    var element = event.target || _currentElement;
    switch (event.type) {
     case "error":
      if (_inArray(event.name, [ "flash-disabled", "flash-outdated", "flash-deactivated", "flash-overdue" ])) {
        _extend(_flashState, {
          disabled: event.name === "flash-disabled",
          outdated: event.name === "flash-outdated",
          unavailable: event.name === "flash-unavailable",
          deactivated: event.name === "flash-deactivated",
          overdue: event.name === "flash-overdue",
          ready: false
        });
      }
      break;

     case "ready":
      var wasDeactivated = _flashState.deactivated === true;
      _extend(_flashState, {
        disabled: false,
        outdated: false,
        unavailable: false,
        deactivated: false,
        overdue: wasDeactivated,
        ready: !wasDeactivated
      });
      break;

     case "copy":
      var textContent, htmlContent, targetEl = event.relatedTarget;
      if (!(_clipData["text/html"] || _clipData["text/plain"]) && targetEl && (htmlContent = targetEl.value || targetEl.outerHTML || targetEl.innerHTML) && (textContent = targetEl.value || targetEl.textContent || targetEl.innerText)) {
        event.clipboardData.clearData();
        event.clipboardData.setData("text/plain", textContent);
        if (htmlContent !== textContent) {
          event.clipboardData.setData("text/html", htmlContent);
        }
      } else if (!_clipData["text/plain"] && event.target && (textContent = event.target.getAttribute("data-clipboard-text"))) {
        event.clipboardData.clearData();
        event.clipboardData.setData("text/plain", textContent);
      }
      break;

     case "aftercopy":
      ZeroClipboard.clearData();
      if (element && element !== _safeActiveElement() && element.focus) {
        element.focus();
      }
      break;

     case "mouseover":
      _addClass(element, _globalConfig.hoverClass);
      break;

     case "mouseout":
      if (_globalConfig.autoActivate === true) {
        ZeroClipboard.deactivate();
      }
      break;

     case "mousedown":
      _addClass(element, _globalConfig.activeClass);
      break;

     case "mouseup":
      _removeClass(element, _globalConfig.activeClass);
      break;
    }
  };
  ZeroClipboard.prototype.on = function(eventName, func) {
    var i, len, events, added = {}, handlers = _clientMeta[this.id] && _clientMeta[this.id].handlers;
    if (typeof eventName === "string" && eventName) {
      events = eventName.toLowerCase().split(/\s+/);
    } else if (typeof eventName === "object" && eventName && typeof func === "undefined") {
      for (i in eventName) {
        if (eventName.hasOwnProperty(i) && typeof i === "string" && i && typeof eventName[i] === "function") {
          this.on(i, eventName[i]);
        }
      }
    }
    if (events && events.length) {
      for (i = 0, len = events.length; i < len; i++) {
        eventName = events[i].replace(/^on/, "");
        added[eventName] = true;
        if (!handlers[eventName]) {
          handlers[eventName] = [];
        }
        handlers[eventName].push(func);
      }
      if (added.ready && _flashState.ready) {
        ZeroClipboard.emit({
          type: "ready",
          client: this
        });
      }
      if (added.error) {
        var errorTypes = [ "disabled", "outdated", "unavailable", "deactivated", "overdue" ];
        for (i = 0, len = errorTypes.length; i < len; i++) {
          if (_flashState[errorTypes[i]]) {
            ZeroClipboard.emit({
              type: "error",
              name: "flash-" + errorTypes[i],
              client: this
            });
            break;
          }
        }
      }
    }
    return this;
  };
  ZeroClipboard.prototype.off = function(eventName, func) {
    var i, len, foundIndex, events, perEventHandlers, handlers = _clientMeta[this.id] && _clientMeta[this.id].handlers;
    if (arguments.length === 0) {
      events = _objectKeys(handlers);
    } else if (typeof eventName === "string" && eventName) {
      events = eventName.split(/\s+/);
    } else if (typeof eventName === "object" && eventName && typeof func === "undefined") {
      for (i in eventName) {
        if (eventName.hasOwnProperty(i) && typeof i === "string" && i && typeof eventName[i] === "function") {
          this.off(i, eventName[i]);
        }
      }
    }
    if (events && events.length) {
      for (i = 0, len = events.length; i < len; i++) {
        eventName = events[i].toLowerCase().replace(/^on/, "");
        perEventHandlers = handlers[eventName];
        if (perEventHandlers && perEventHandlers.length) {
          if (func) {
            foundIndex = _inArray(func, perEventHandlers);
            while (foundIndex !== -1) {
              perEventHandlers.splice(foundIndex, 1);
              foundIndex = _inArray(func, perEventHandlers, foundIndex);
            }
          } else {
            handlers[eventName].length = 0;
          }
        }
      }
    }
    return this;
  };
  ZeroClipboard.prototype.handlers = function(eventName) {
    var prop, copy = null, handlers = _clientMeta[this.id] && _clientMeta[this.id].handlers;
    if (handlers) {
      if (typeof eventName === "string" && eventName) {
        return handlers[eventName] ? handlers[eventName].slice(0) : null;
      }
      copy = {};
      for (prop in handlers) {
        if (handlers.hasOwnProperty(prop) && handlers[prop]) {
          copy[prop] = handlers[prop].slice(0);
        }
      }
    }
    return copy;
  };
  ZeroClipboard.prototype.clip = function(elements) {
    elements = _prepClip(elements);
    for (var i = 0; i < elements.length; i++) {
      if (elements.hasOwnProperty(i) && elements[i] && elements[i].nodeType === 1) {
        if (!elements[i].zcClippingId) {
          elements[i].zcClippingId = "zcClippingId_" + _elementIdCounter++;
          _elementMeta[elements[i].zcClippingId] = [ this.id ];
          if (_globalConfig.autoActivate === true) {
            _addEventHandler(elements[i], "mouseover", _elementMouseOver);
          }
        } else if (_inArray(this.id, _elementMeta[elements[i].zcClippingId]) === -1) {
          _elementMeta[elements[i].zcClippingId].push(this.id);
        }
        var clippedElements = _clientMeta[this.id].elements;
        if (_inArray(elements[i], clippedElements) === -1) {
          clippedElements.push(elements[i]);
        }
      }
    }
    return this;
  };
  ZeroClipboard.prototype.unclip = function(elements) {
    var meta = _clientMeta[this.id];
    if (!meta) {
      return this;
    }
    var clippedElements = meta.elements;
    var arrayIndex;
    if (typeof elements === "undefined") {
      elements = clippedElements.slice(0);
    } else {
      elements = _prepClip(elements);
    }
    for (var i = elements.length; i--; ) {
      if (elements.hasOwnProperty(i) && elements[i] && elements[i].nodeType === 1) {
        arrayIndex = 0;
        while ((arrayIndex = _inArray(elements[i], clippedElements, arrayIndex)) !== -1) {
          clippedElements.splice(arrayIndex, 1);
        }
        var clientIds = _elementMeta[elements[i].zcClippingId];
        if (clientIds) {
          arrayIndex = 0;
          while ((arrayIndex = _inArray(this.id, clientIds, arrayIndex)) !== -1) {
            clientIds.splice(arrayIndex, 1);
          }
          if (clientIds.length === 0) {
            if (_globalConfig.autoActivate === true) {
              _removeEventHandler(elements[i], "mouseover", _elementMouseOver);
            }
            delete elements[i].zcClippingId;
          }
        }
      }
    }
    return this;
  };
  ZeroClipboard.prototype.elements = function() {
    var meta = _clientMeta[this.id];
    return meta && meta.elements ? meta.elements.slice(0) : [];
  };
  var _getAllClientsClippedToElement = function(element) {
    var elementMetaId, clientIds, i, len, client, clients = [];
    if (element && element.nodeType === 1 && (elementMetaId = element.zcClippingId) && _elementMeta.hasOwnProperty(elementMetaId)) {
      clientIds = _elementMeta[elementMetaId];
      if (clientIds && clientIds.length) {
        for (i = 0, len = clientIds.length; i < len; i++) {
          client = _clientMeta[clientIds[i]].instance;
          if (client && client instanceof ZeroClipboard) {
            clients.push(client);
          }
        }
      }
    }
    return clients;
  };
  _globalConfig.hoverClass = "zeroclipboard-is-hover";
  _globalConfig.activeClass = "zeroclipboard-is-active";
  if (typeof define === "function" && define.amd) {
	    define(function() {
	      return ZeroClipboard;
	    });
	  } else if (typeof module === "object" && module && typeof module.exports === "object" && module.exports) {
	    module.exports = ZeroClipboard;
	  }
	  window.ZeroClipboard = ZeroClipboard;
})(function() {
  return this;
}());
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvdGhpcmQtcGFydHkvemVyb2NsaXBib2FyZC9aZXJvQ2xpcGJvYXJkLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qIVxuKiBaZXJvQ2xpcGJvYXJkXG4qIFRoZSBaZXJvQ2xpcGJvYXJkIGxpYnJhcnkgcHJvdmlkZXMgYW4gZWFzeSB3YXkgdG8gY29weSB0ZXh0IHRvIHRoZSBjbGlwYm9hcmQgdXNpbmcgYW4gaW52aXNpYmxlIEFkb2JlIEZsYXNoIG1vdmllIGFuZCBhIEphdmFTY3JpcHQgaW50ZXJmYWNlLlxuKiBDb3B5cmlnaHQgKGMpIDIwMTQgSm9uIFJvaGFuLCBKYW1lcyBNLiBHcmVlbmVcbiogTGljZW5zZWQgTUlUXG4qIGh0dHA6Ly96ZXJvY2xpcGJvYXJkLm9yZy9cbiogdjIuMC4wLWJldGEuNVxuKi9cbihmdW5jdGlvbih3aW5kb3cpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfY3VycmVudEVsZW1lbnQ7XG4gIHZhciBfZmxhc2hTdGF0ZSA9IHtcbiAgICBicmlkZ2U6IG51bGwsXG4gICAgdmVyc2lvbjogXCIwLjAuMFwiLFxuICAgIHBsdWdpblR5cGU6IFwidW5rbm93blwiLFxuICAgIGRpc2FibGVkOiBudWxsLFxuICAgIG91dGRhdGVkOiBudWxsLFxuICAgIHVuYXZhaWxhYmxlOiBudWxsLFxuICAgIGRlYWN0aXZhdGVkOiBudWxsLFxuICAgIG92ZXJkdWU6IG51bGwsXG4gICAgcmVhZHk6IG51bGxcbiAgfTtcbiAgdmFyIF9jbGlwRGF0YSA9IHt9O1xuICB2YXIgX2NsaXBEYXRhRm9ybWF0TWFwID0gbnVsbDtcbiAgdmFyIF9jbGllbnRJZENvdW50ZXIgPSAwO1xuICB2YXIgX2NsaWVudE1ldGEgPSB7fTtcbiAgdmFyIF9lbGVtZW50SWRDb3VudGVyID0gMDtcbiAgdmFyIF9lbGVtZW50TWV0YSA9IHt9O1xuICB2YXIgX3N3ZlBhdGggPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaSwganNEaXIsIHRtcEpzUGF0aCwganNQYXRoLCBzd2ZQYXRoID0gXCJaZXJvQ2xpcGJvYXJkLnN3ZlwiO1xuICAgIGlmICghKGRvY3VtZW50LmN1cnJlbnRTY3JpcHQgJiYgKGpzUGF0aCA9IGRvY3VtZW50LmN1cnJlbnRTY3JpcHQuc3JjKSkpIHtcbiAgICAgIHZhciBzY3JpcHRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJzY3JpcHRcIik7XG4gICAgICBpZiAoXCJyZWFkeVN0YXRlXCIgaW4gc2NyaXB0c1swXSkge1xuICAgICAgICBmb3IgKGkgPSBzY3JpcHRzLmxlbmd0aDsgaS0tOyApIHtcbiAgICAgICAgICBpZiAoc2NyaXB0c1tpXS5yZWFkeVN0YXRlID09PSBcImludGVyYWN0aXZlXCIgJiYgKGpzUGF0aCA9IHNjcmlwdHNbaV0uc3JjKSkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09IFwibG9hZGluZ1wiKSB7XG4gICAgICAgIGpzUGF0aCA9IHNjcmlwdHNbc2NyaXB0cy5sZW5ndGggLSAxXS5zcmM7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKGkgPSBzY3JpcHRzLmxlbmd0aDsgaS0tOyApIHtcbiAgICAgICAgICB0bXBKc1BhdGggPSBzY3JpcHRzW2ldLnNyYztcbiAgICAgICAgICBpZiAoIXRtcEpzUGF0aCkge1xuICAgICAgICAgICAganNEaXIgPSBudWxsO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRtcEpzUGF0aCA9IHRtcEpzUGF0aC5zcGxpdChcIiNcIilbMF0uc3BsaXQoXCI/XCIpWzBdO1xuICAgICAgICAgIHRtcEpzUGF0aCA9IHRtcEpzUGF0aC5zbGljZSgwLCB0bXBKc1BhdGgubGFzdEluZGV4T2YoXCIvXCIpICsgMSk7XG4gICAgICAgICAgaWYgKGpzRGlyID09IG51bGwpIHtcbiAgICAgICAgICAgIGpzRGlyID0gdG1wSnNQYXRoO1xuICAgICAgICAgIH0gZWxzZSBpZiAoanNEaXIgIT09IHRtcEpzUGF0aCkge1xuICAgICAgICAgICAganNEaXIgPSBudWxsO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChqc0RpciAhPT0gbnVsbCkge1xuICAgICAgICAgIGpzUGF0aCA9IGpzRGlyO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChqc1BhdGgpIHtcbiAgICAgIGpzUGF0aCA9IGpzUGF0aC5zcGxpdChcIiNcIilbMF0uc3BsaXQoXCI/XCIpWzBdO1xuICAgICAgc3dmUGF0aCA9IGpzUGF0aC5zbGljZSgwLCBqc1BhdGgubGFzdEluZGV4T2YoXCIvXCIpICsgMSkgKyBzd2ZQYXRoO1xuICAgIH1cbiAgICByZXR1cm4gc3dmUGF0aDtcbiAgfSgpO1xuICB2YXIgX2NhbWVsaXplQ3NzUHJvcE5hbWUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbWF0Y2hlclJlZ2V4ID0gL1xcLShbYS16XSkvZywgcmVwbGFjZXJGbiA9IGZ1bmN0aW9uKG1hdGNoLCBncm91cCkge1xuICAgICAgcmV0dXJuIGdyb3VwLnRvVXBwZXJDYXNlKCk7XG4gICAgfTtcbiAgICByZXR1cm4gZnVuY3Rpb24ocHJvcCkge1xuICAgICAgcmV0dXJuIHByb3AucmVwbGFjZShtYXRjaGVyUmVnZXgsIHJlcGxhY2VyRm4pO1xuICAgIH07XG4gIH0oKTtcbiAgdmFyIF9nZXRTdHlsZSA9IGZ1bmN0aW9uKGVsLCBwcm9wKSB7XG4gICAgdmFyIHZhbHVlLCBjYW1lbFByb3AsIHRhZ05hbWU7XG4gICAgaWYgKHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKSB7XG4gICAgICB2YWx1ZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsLCBudWxsKS5nZXRQcm9wZXJ0eVZhbHVlKHByb3ApO1xuICAgIH0gZWxzZSB7XG4gICAgICBjYW1lbFByb3AgPSBfY2FtZWxpemVDc3NQcm9wTmFtZShwcm9wKTtcbiAgICAgIGlmIChlbC5jdXJyZW50U3R5bGUpIHtcbiAgICAgICAgdmFsdWUgPSBlbC5jdXJyZW50U3R5bGVbY2FtZWxQcm9wXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhbHVlID0gZWwuc3R5bGVbY2FtZWxQcm9wXTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHByb3AgPT09IFwiY3Vyc29yXCIpIHtcbiAgICAgIGlmICghdmFsdWUgfHwgdmFsdWUgPT09IFwiYXV0b1wiKSB7XG4gICAgICAgIHRhZ05hbWUgPSBlbC50YWdOYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGlmICh0YWdOYW1lID09PSBcImFcIikge1xuICAgICAgICAgIHJldHVybiBcInBvaW50ZXJcIjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG4gIH07XG4gIHZhciBfZWxlbWVudE1vdXNlT3ZlciA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgaWYgKCFldmVudCkge1xuICAgICAgZXZlbnQgPSB3aW5kb3cuZXZlbnQ7XG4gICAgfVxuICAgIHZhciB0YXJnZXQ7XG4gICAgaWYgKHRoaXMgIT09IHdpbmRvdykge1xuICAgICAgdGFyZ2V0ID0gdGhpcztcbiAgICB9IGVsc2UgaWYgKGV2ZW50LnRhcmdldCkge1xuICAgICAgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0O1xuICAgIH0gZWxzZSBpZiAoZXZlbnQuc3JjRWxlbWVudCkge1xuICAgICAgdGFyZ2V0ID0gZXZlbnQuc3JjRWxlbWVudDtcbiAgICB9XG4gICAgWmVyb0NsaXBib2FyZC5hY3RpdmF0ZSh0YXJnZXQpO1xuICB9O1xuICB2YXIgX2FkZEV2ZW50SGFuZGxlciA9IGZ1bmN0aW9uKGVsZW1lbnQsIG1ldGhvZCwgZnVuYykge1xuICAgIGlmICghZWxlbWVudCB8fCBlbGVtZW50Lm5vZGVUeXBlICE9PSAxKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihtZXRob2QsIGZ1bmMsIGZhbHNlKTtcbiAgICB9IGVsc2UgaWYgKGVsZW1lbnQuYXR0YWNoRXZlbnQpIHtcbiAgICAgIGVsZW1lbnQuYXR0YWNoRXZlbnQoXCJvblwiICsgbWV0aG9kLCBmdW5jKTtcbiAgICB9XG4gIH07XG4gIHZhciBfcmVtb3ZlRXZlbnRIYW5kbGVyID0gZnVuY3Rpb24oZWxlbWVudCwgbWV0aG9kLCBmdW5jKSB7XG4gICAgaWYgKCFlbGVtZW50IHx8IGVsZW1lbnQubm9kZVR5cGUgIT09IDEpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcikge1xuICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKG1ldGhvZCwgZnVuYywgZmFsc2UpO1xuICAgIH0gZWxzZSBpZiAoZWxlbWVudC5kZXRhY2hFdmVudCkge1xuICAgICAgZWxlbWVudC5kZXRhY2hFdmVudChcIm9uXCIgKyBtZXRob2QsIGZ1bmMpO1xuICAgIH1cbiAgfTtcbiAgdmFyIF9hZGRDbGFzcyA9IGZ1bmN0aW9uKGVsZW1lbnQsIHZhbHVlKSB7XG4gICAgaWYgKCFlbGVtZW50IHx8IGVsZW1lbnQubm9kZVR5cGUgIT09IDEpIHtcbiAgICAgIHJldHVybiBlbGVtZW50O1xuICAgIH1cbiAgICBpZiAoZWxlbWVudC5jbGFzc0xpc3QpIHtcbiAgICAgIGlmICghZWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnModmFsdWUpKSB7XG4gICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCh2YWx1ZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZWxlbWVudDtcbiAgICB9XG4gICAgaWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgdmFyIGNsYXNzTmFtZXMgPSAodmFsdWUgfHwgXCJcIikuc3BsaXQoL1xccysvKTtcbiAgICAgIGlmIChlbGVtZW50Lm5vZGVUeXBlID09PSAxKSB7XG4gICAgICAgIGlmICghZWxlbWVudC5jbGFzc05hbWUpIHtcbiAgICAgICAgICBlbGVtZW50LmNsYXNzTmFtZSA9IHZhbHVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBjbGFzc05hbWUgPSBcIiBcIiArIGVsZW1lbnQuY2xhc3NOYW1lICsgXCIgXCIsIHNldENsYXNzID0gZWxlbWVudC5jbGFzc05hbWU7XG4gICAgICAgICAgZm9yICh2YXIgYyA9IDAsIGNsID0gY2xhc3NOYW1lcy5sZW5ndGg7IGMgPCBjbDsgYysrKSB7XG4gICAgICAgICAgICBpZiAoY2xhc3NOYW1lLmluZGV4T2YoXCIgXCIgKyBjbGFzc05hbWVzW2NdICsgXCIgXCIpIDwgMCkge1xuICAgICAgICAgICAgICBzZXRDbGFzcyArPSBcIiBcIiArIGNsYXNzTmFtZXNbY107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsZW1lbnQuY2xhc3NOYW1lID0gc2V0Q2xhc3MucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgXCJcIik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGVsZW1lbnQ7XG4gIH07XG4gIHZhciBfcmVtb3ZlQ2xhc3MgPSBmdW5jdGlvbihlbGVtZW50LCB2YWx1ZSkge1xuICAgIGlmICghZWxlbWVudCB8fCBlbGVtZW50Lm5vZGVUeXBlICE9PSAxKSB7XG4gICAgICByZXR1cm4gZWxlbWVudDtcbiAgICB9XG4gICAgaWYgKGVsZW1lbnQuY2xhc3NMaXN0KSB7XG4gICAgICBpZiAoZWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnModmFsdWUpKSB7XG4gICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSh2YWx1ZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZWxlbWVudDtcbiAgICB9XG4gICAgaWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIiB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB2YXIgY2xhc3NOYW1lcyA9ICh2YWx1ZSB8fCBcIlwiKS5zcGxpdCgvXFxzKy8pO1xuICAgICAgaWYgKGVsZW1lbnQubm9kZVR5cGUgPT09IDEgJiYgZWxlbWVudC5jbGFzc05hbWUpIHtcbiAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgdmFyIGNsYXNzTmFtZSA9IChcIiBcIiArIGVsZW1lbnQuY2xhc3NOYW1lICsgXCIgXCIpLnJlcGxhY2UoL1tcXG5cXHRdL2csIFwiIFwiKTtcbiAgICAgICAgICBmb3IgKHZhciBjID0gMCwgY2wgPSBjbGFzc05hbWVzLmxlbmd0aDsgYyA8IGNsOyBjKyspIHtcbiAgICAgICAgICAgIGNsYXNzTmFtZSA9IGNsYXNzTmFtZS5yZXBsYWNlKFwiIFwiICsgY2xhc3NOYW1lc1tjXSArIFwiIFwiLCBcIiBcIik7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsZW1lbnQuY2xhc3NOYW1lID0gY2xhc3NOYW1lLnJlcGxhY2UoL15cXHMrfFxccyskL2csIFwiXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVsZW1lbnQuY2xhc3NOYW1lID0gXCJcIjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZWxlbWVudDtcbiAgfTtcbiAgdmFyIF9nZXRab29tRmFjdG9yID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHJlY3QsIHBoeXNpY2FsV2lkdGgsIGxvZ2ljYWxXaWR0aCwgem9vbUZhY3RvciA9IDE7XG4gICAgaWYgKHR5cGVvZiBkb2N1bWVudC5ib2R5LmdldEJvdW5kaW5nQ2xpZW50UmVjdCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICByZWN0ID0gZG9jdW1lbnQuYm9keS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgIHBoeXNpY2FsV2lkdGggPSByZWN0LnJpZ2h0IC0gcmVjdC5sZWZ0O1xuICAgICAgbG9naWNhbFdpZHRoID0gZG9jdW1lbnQuYm9keS5vZmZzZXRXaWR0aDtcbiAgICAgIHpvb21GYWN0b3IgPSBNYXRoLnJvdW5kKHBoeXNpY2FsV2lkdGggLyBsb2dpY2FsV2lkdGggKiAxMDApIC8gMTAwO1xuICAgIH1cbiAgICByZXR1cm4gem9vbUZhY3RvcjtcbiAgfTtcbiAgdmFyIF9nZXRET01PYmplY3RQb3NpdGlvbiA9IGZ1bmN0aW9uKG9iaiwgZGVmYXVsdFpJbmRleCkge1xuICAgIHZhciBpbmZvID0ge1xuICAgICAgbGVmdDogMCxcbiAgICAgIHRvcDogMCxcbiAgICAgIHdpZHRoOiAwLFxuICAgICAgaGVpZ2h0OiAwLFxuICAgICAgekluZGV4OiBfZ2V0U2FmZVpJbmRleChkZWZhdWx0WkluZGV4KSAtIDFcbiAgICB9O1xuICAgIGlmIChvYmouZ2V0Qm91bmRpbmdDbGllbnRSZWN0KSB7XG4gICAgICB2YXIgcmVjdCA9IG9iai5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgIHZhciBwYWdlWE9mZnNldCwgcGFnZVlPZmZzZXQsIHpvb21GYWN0b3I7XG4gICAgICBpZiAoXCJwYWdlWE9mZnNldFwiIGluIHdpbmRvdyAmJiBcInBhZ2VZT2Zmc2V0XCIgaW4gd2luZG93KSB7XG4gICAgICAgIHBhZ2VYT2Zmc2V0ID0gd2luZG93LnBhZ2VYT2Zmc2V0O1xuICAgICAgICBwYWdlWU9mZnNldCA9IHdpbmRvdy5wYWdlWU9mZnNldDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHpvb21GYWN0b3IgPSBfZ2V0Wm9vbUZhY3RvcigpO1xuICAgICAgICBwYWdlWE9mZnNldCA9IE1hdGgucm91bmQoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbExlZnQgLyB6b29tRmFjdG9yKTtcbiAgICAgICAgcGFnZVlPZmZzZXQgPSBNYXRoLnJvdW5kKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3AgLyB6b29tRmFjdG9yKTtcbiAgICAgIH1cbiAgICAgIHZhciBsZWZ0Qm9yZGVyV2lkdGggPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50TGVmdCB8fCAwO1xuICAgICAgdmFyIHRvcEJvcmRlcldpZHRoID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFRvcCB8fCAwO1xuICAgICAgaW5mby5sZWZ0ID0gcmVjdC5sZWZ0ICsgcGFnZVhPZmZzZXQgLSBsZWZ0Qm9yZGVyV2lkdGg7XG4gICAgICBpbmZvLnRvcCA9IHJlY3QudG9wICsgcGFnZVlPZmZzZXQgLSB0b3BCb3JkZXJXaWR0aDtcbiAgICAgIGluZm8ud2lkdGggPSBcIndpZHRoXCIgaW4gcmVjdCA/IHJlY3Qud2lkdGggOiByZWN0LnJpZ2h0IC0gcmVjdC5sZWZ0O1xuICAgICAgaW5mby5oZWlnaHQgPSBcImhlaWdodFwiIGluIHJlY3QgPyByZWN0LmhlaWdodCA6IHJlY3QuYm90dG9tIC0gcmVjdC50b3A7XG4gICAgfVxuICAgIHJldHVybiBpbmZvO1xuICB9O1xuICB2YXIgX2NhY2hlQnVzdCA9IGZ1bmN0aW9uKHBhdGgsIG9wdGlvbnMpIHtcbiAgICB2YXIgY2FjaGVCdXN0ID0gb3B0aW9ucyA9PSBudWxsIHx8IG9wdGlvbnMgJiYgb3B0aW9ucy5jYWNoZUJ1c3QgPT09IHRydWU7XG4gICAgaWYgKGNhY2hlQnVzdCkge1xuICAgICAgcmV0dXJuIChwYXRoLmluZGV4T2YoXCI/XCIpID09PSAtMSA/IFwiP1wiIDogXCImXCIpICsgXCJub0NhY2hlPVwiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cbiAgfTtcbiAgdmFyIF92YXJzID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIHZhciBpLCBsZW4sIGRvbWFpbiwgZG9tYWlucywgc3RyID0gXCJcIiwgdHJ1c3RlZE9yaWdpbnNFeHBhbmRlZCA9IFtdO1xuICAgIGlmIChvcHRpb25zLnRydXN0ZWREb21haW5zKSB7XG4gICAgICBpZiAodHlwZW9mIG9wdGlvbnMudHJ1c3RlZERvbWFpbnMgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgZG9tYWlucyA9IFsgb3B0aW9ucy50cnVzdGVkRG9tYWlucyBdO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygb3B0aW9ucy50cnVzdGVkRG9tYWlucyA9PT0gXCJvYmplY3RcIiAmJiBcImxlbmd0aFwiIGluIG9wdGlvbnMudHJ1c3RlZERvbWFpbnMpIHtcbiAgICAgICAgZG9tYWlucyA9IG9wdGlvbnMudHJ1c3RlZERvbWFpbnM7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChkb21haW5zICYmIGRvbWFpbnMubGVuZ3RoKSB7XG4gICAgICBmb3IgKGkgPSAwLCBsZW4gPSBkb21haW5zLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIGlmIChkb21haW5zLmhhc093blByb3BlcnR5KGkpICYmIGRvbWFpbnNbaV0gJiYgdHlwZW9mIGRvbWFpbnNbaV0gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICBkb21haW4gPSBfZXh0cmFjdERvbWFpbihkb21haW5zW2ldKTtcbiAgICAgICAgICBpZiAoIWRvbWFpbikge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChkb21haW4gPT09IFwiKlwiKSB7XG4gICAgICAgICAgICB0cnVzdGVkT3JpZ2luc0V4cGFuZGVkID0gWyBkb21haW4gXTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0cnVzdGVkT3JpZ2luc0V4cGFuZGVkLnB1c2guYXBwbHkodHJ1c3RlZE9yaWdpbnNFeHBhbmRlZCwgWyBkb21haW4sIFwiLy9cIiArIGRvbWFpbiwgd2luZG93LmxvY2F0aW9uLnByb3RvY29sICsgXCIvL1wiICsgZG9tYWluIF0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0cnVzdGVkT3JpZ2luc0V4cGFuZGVkLmxlbmd0aCkge1xuICAgICAgc3RyICs9IFwidHJ1c3RlZE9yaWdpbnM9XCIgKyBlbmNvZGVVUklDb21wb25lbnQodHJ1c3RlZE9yaWdpbnNFeHBhbmRlZC5qb2luKFwiLFwiKSk7XG4gICAgfVxuICAgIGlmIChvcHRpb25zLmZvcmNlRW5oYW5jZWRDbGlwYm9hcmQgPT09IHRydWUpIHtcbiAgICAgIHN0ciArPSAoc3RyID8gXCImXCIgOiBcIlwiKSArIFwiZm9yY2VFbmhhbmNlZENsaXBib2FyZD10cnVlXCI7XG4gICAgfVxuICAgIHJldHVybiBzdHI7XG4gIH07XG4gIHZhciBfaW5BcnJheSA9IGZ1bmN0aW9uKGVsZW0sIGFycmF5LCBmcm9tSW5kZXgpIHtcbiAgICBpZiAodHlwZW9mIGFycmF5LmluZGV4T2YgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgcmV0dXJuIGFycmF5LmluZGV4T2YoZWxlbSwgZnJvbUluZGV4KTtcbiAgICB9XG4gICAgdmFyIGksIGxlbiA9IGFycmF5Lmxlbmd0aDtcbiAgICBpZiAodHlwZW9mIGZyb21JbmRleCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgZnJvbUluZGV4ID0gMDtcbiAgICB9IGVsc2UgaWYgKGZyb21JbmRleCA8IDApIHtcbiAgICAgIGZyb21JbmRleCA9IGxlbiArIGZyb21JbmRleDtcbiAgICB9XG4gICAgZm9yIChpID0gZnJvbUluZGV4OyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGlmIChhcnJheS5oYXNPd25Qcm9wZXJ0eShpKSAmJiBhcnJheVtpXSA9PT0gZWxlbSkge1xuICAgICAgICByZXR1cm4gaTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIC0xO1xuICB9O1xuICB2YXIgX3ByZXBDbGlwID0gZnVuY3Rpb24oZWxlbWVudHMpIHtcbiAgICBpZiAodHlwZW9mIGVsZW1lbnRzID09PSBcInN0cmluZ1wiKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiWmVyb0NsaXBib2FyZCBkb2Vzbid0IGFjY2VwdCBxdWVyeSBzdHJpbmdzLlwiKTtcbiAgICB9XG4gICAgcmV0dXJuIHR5cGVvZiBlbGVtZW50cy5sZW5ndGggIT09IFwibnVtYmVyXCIgPyBbIGVsZW1lbnRzIF0gOiBlbGVtZW50cztcbiAgfTtcbiAgdmFyIF9kaXNwYXRjaENhbGxiYWNrID0gZnVuY3Rpb24oZnVuYywgY29udGV4dCwgYXJncywgYXN5bmMpIHtcbiAgICBpZiAoYXN5bmMpIHtcbiAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgfSwgMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgfVxuICB9O1xuICB2YXIgX2dldFNhZmVaSW5kZXggPSBmdW5jdGlvbih2YWwpIHtcbiAgICB2YXIgekluZGV4LCB0bXA7XG4gICAgaWYgKHZhbCkge1xuICAgICAgaWYgKHR5cGVvZiB2YWwgPT09IFwibnVtYmVyXCIgJiYgdmFsID4gMCkge1xuICAgICAgICB6SW5kZXggPSB2YWw7XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWwgPT09IFwic3RyaW5nXCIgJiYgKHRtcCA9IHBhcnNlSW50KHZhbCwgMTApKSAmJiAhaXNOYU4odG1wKSAmJiB0bXAgPiAwKSB7XG4gICAgICAgIHpJbmRleCA9IHRtcDtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCF6SW5kZXgpIHtcbiAgICAgIGlmICh0eXBlb2YgX2dsb2JhbENvbmZpZy56SW5kZXggPT09IFwibnVtYmVyXCIgJiYgX2dsb2JhbENvbmZpZy56SW5kZXggPiAwKSB7XG4gICAgICAgIHpJbmRleCA9IF9nbG9iYWxDb25maWcuekluZGV4O1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgX2dsb2JhbENvbmZpZy56SW5kZXggPT09IFwic3RyaW5nXCIgJiYgKHRtcCA9IHBhcnNlSW50KF9nbG9iYWxDb25maWcuekluZGV4LCAxMCkpICYmICFpc05hTih0bXApICYmIHRtcCA+IDApIHtcbiAgICAgICAgekluZGV4ID0gdG1wO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gekluZGV4IHx8IDA7XG4gIH07XG4gIHZhciBfZXh0ZW5kID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGksIGxlbiwgYXJnLCBwcm9wLCBzcmMsIGNvcHksIHRhcmdldCA9IGFyZ3VtZW50c1swXSB8fCB7fTtcbiAgICBmb3IgKGkgPSAxLCBsZW4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGlmICgoYXJnID0gYXJndW1lbnRzW2ldKSAhPSBudWxsKSB7XG4gICAgICAgIGZvciAocHJvcCBpbiBhcmcpIHtcbiAgICAgICAgICBpZiAoYXJnLmhhc093blByb3BlcnR5KHByb3ApKSB7XG4gICAgICAgICAgICBzcmMgPSB0YXJnZXRbcHJvcF07XG4gICAgICAgICAgICBjb3B5ID0gYXJnW3Byb3BdO1xuICAgICAgICAgICAgaWYgKHRhcmdldCA9PT0gY29weSkge1xuICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjb3B5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgdGFyZ2V0W3Byb3BdID0gY29weTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRhcmdldDtcbiAgfTtcbiAgdmFyIF9leHRyYWN0RG9tYWluID0gZnVuY3Rpb24ob3JpZ2luT3JVcmwpIHtcbiAgICBpZiAob3JpZ2luT3JVcmwgPT0gbnVsbCB8fCBvcmlnaW5PclVybCA9PT0gXCJcIikge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIG9yaWdpbk9yVXJsID0gb3JpZ2luT3JVcmwucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgXCJcIik7XG4gICAgaWYgKG9yaWdpbk9yVXJsID09PSBcIlwiKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgdmFyIHByb3RvY29sSW5kZXggPSBvcmlnaW5PclVybC5pbmRleE9mKFwiLy9cIik7XG4gICAgb3JpZ2luT3JVcmwgPSBwcm90b2NvbEluZGV4ID09PSAtMSA/IG9yaWdpbk9yVXJsIDogb3JpZ2luT3JVcmwuc2xpY2UocHJvdG9jb2xJbmRleCArIDIpO1xuICAgIHZhciBwYXRoSW5kZXggPSBvcmlnaW5PclVybC5pbmRleE9mKFwiL1wiKTtcbiAgICBvcmlnaW5PclVybCA9IHBhdGhJbmRleCA9PT0gLTEgPyBvcmlnaW5PclVybCA6IHByb3RvY29sSW5kZXggPT09IC0xIHx8IHBhdGhJbmRleCA9PT0gMCA/IG51bGwgOiBvcmlnaW5PclVybC5zbGljZSgwLCBwYXRoSW5kZXgpO1xuICAgIGlmIChvcmlnaW5PclVybCAmJiBvcmlnaW5PclVybC5zbGljZSgtNCkudG9Mb3dlckNhc2UoKSA9PT0gXCIuc3dmXCIpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gb3JpZ2luT3JVcmwgfHwgbnVsbDtcbiAgfTtcbiAgdmFyIF9kZXRlcm1pbmVTY3JpcHRBY2Nlc3MgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgX2V4dHJhY3RBbGxEb21haW5zID0gZnVuY3Rpb24ob3JpZ2lucywgcmVzdWx0c0FycmF5KSB7XG4gICAgICB2YXIgaSwgbGVuLCB0bXA7XG4gICAgICBpZiAob3JpZ2lucyA9PSBudWxsIHx8IHJlc3VsdHNBcnJheVswXSA9PT0gXCIqXCIpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiBvcmlnaW5zID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIG9yaWdpbnMgPSBbIG9yaWdpbnMgXTtcbiAgICAgIH1cbiAgICAgIGlmICghKHR5cGVvZiBvcmlnaW5zID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBvcmlnaW5zLmxlbmd0aCA9PT0gXCJudW1iZXJcIikpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZm9yIChpID0gMCwgbGVuID0gb3JpZ2lucy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBpZiAob3JpZ2lucy5oYXNPd25Qcm9wZXJ0eShpKSAmJiAodG1wID0gX2V4dHJhY3REb21haW4ob3JpZ2luc1tpXSkpKSB7XG4gICAgICAgICAgaWYgKHRtcCA9PT0gXCIqXCIpIHtcbiAgICAgICAgICAgIHJlc3VsdHNBcnJheS5sZW5ndGggPSAwO1xuICAgICAgICAgICAgcmVzdWx0c0FycmF5LnB1c2goXCIqXCIpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChfaW5BcnJheSh0bXAsIHJlc3VsdHNBcnJheSkgPT09IC0xKSB7XG4gICAgICAgICAgICByZXN1bHRzQXJyYXkucHVzaCh0bXApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGN1cnJlbnREb21haW4sIGNvbmZpZ09wdGlvbnMpIHtcbiAgICAgIHZhciBzd2ZEb21haW4gPSBfZXh0cmFjdERvbWFpbihjb25maWdPcHRpb25zLnN3ZlBhdGgpO1xuICAgICAgaWYgKHN3ZkRvbWFpbiA9PT0gbnVsbCkge1xuICAgICAgICBzd2ZEb21haW4gPSBjdXJyZW50RG9tYWluO1xuICAgICAgfVxuICAgICAgdmFyIHRydXN0ZWREb21haW5zID0gW107XG4gICAgICBfZXh0cmFjdEFsbERvbWFpbnMoY29uZmlnT3B0aW9ucy50cnVzdGVkT3JpZ2lucywgdHJ1c3RlZERvbWFpbnMpO1xuICAgICAgX2V4dHJhY3RBbGxEb21haW5zKGNvbmZpZ09wdGlvbnMudHJ1c3RlZERvbWFpbnMsIHRydXN0ZWREb21haW5zKTtcbiAgICAgIHZhciBsZW4gPSB0cnVzdGVkRG9tYWlucy5sZW5ndGg7XG4gICAgICBpZiAobGVuID4gMCkge1xuICAgICAgICBpZiAobGVuID09PSAxICYmIHRydXN0ZWREb21haW5zWzBdID09PSBcIipcIikge1xuICAgICAgICAgIHJldHVybiBcImFsd2F5c1wiO1xuICAgICAgICB9XG4gICAgICAgIGlmIChfaW5BcnJheShjdXJyZW50RG9tYWluLCB0cnVzdGVkRG9tYWlucykgIT09IC0xKSB7XG4gICAgICAgICAgaWYgKGxlbiA9PT0gMSAmJiBjdXJyZW50RG9tYWluID09PSBzd2ZEb21haW4pIHtcbiAgICAgICAgICAgIHJldHVybiBcInNhbWVEb21haW5cIjtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIFwiYWx3YXlzXCI7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBcIm5ldmVyXCI7XG4gICAgfTtcbiAgfSgpO1xuICB2YXIgX29iamVjdEtleXMgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAob2JqID09IG51bGwpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgaWYgKE9iamVjdC5rZXlzKSB7XG4gICAgICByZXR1cm4gT2JqZWN0LmtleXMob2JqKTtcbiAgICB9XG4gICAgdmFyIGtleXMgPSBbXTtcbiAgICBmb3IgKHZhciBwcm9wIGluIG9iaikge1xuICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuICAgICAgICBrZXlzLnB1c2gocHJvcCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBrZXlzO1xuICB9O1xuICB2YXIgX2RlbGV0ZU93blByb3BlcnRpZXMgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAob2JqKSB7XG4gICAgICBmb3IgKHZhciBwcm9wIGluIG9iaikge1xuICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KHByb3ApKSB7XG4gICAgICAgICAgZGVsZXRlIG9ialtwcm9wXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb2JqO1xuICB9O1xuICB2YXIgX3NhZmVBY3RpdmVFbGVtZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBkb2N1bWVudC5hY3RpdmVFbGVtZW50O1xuICAgIH0gY2F0Y2ggKGVycikge31cbiAgICByZXR1cm4gbnVsbDtcbiAgfTtcbiAgdmFyIF9waWNrID0gZnVuY3Rpb24ob2JqLCBrZXlzKSB7XG4gICAgdmFyIG5ld09iaiA9IHt9O1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBrZXlzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBpZiAoa2V5c1tpXSBpbiBvYmopIHtcbiAgICAgICAgbmV3T2JqW2tleXNbaV1dID0gb2JqW2tleXNbaV1dO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbmV3T2JqO1xuICB9O1xuICB2YXIgX29taXQgPSBmdW5jdGlvbihvYmosIGtleXMpIHtcbiAgICB2YXIgbmV3T2JqID0ge307XG4gICAgZm9yICh2YXIgcHJvcCBpbiBvYmopIHtcbiAgICAgIGlmIChfaW5BcnJheShwcm9wLCBrZXlzKSA9PT0gLTEpIHtcbiAgICAgICAgbmV3T2JqW3Byb3BdID0gb2JqW3Byb3BdO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbmV3T2JqO1xuICB9O1xuICB2YXIgX21hcENsaXBEYXRhVG9GbGFzaCA9IGZ1bmN0aW9uKGNsaXBEYXRhKSB7XG4gICAgdmFyIG5ld0NsaXBEYXRhID0ge30sIGZvcm1hdE1hcCA9IHt9O1xuICAgIGlmICghKHR5cGVvZiBjbGlwRGF0YSA9PT0gXCJvYmplY3RcIiAmJiBjbGlwRGF0YSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZm9yICh2YXIgZGF0YUZvcm1hdCBpbiBjbGlwRGF0YSkge1xuICAgICAgaWYgKGRhdGFGb3JtYXQgJiYgY2xpcERhdGEuaGFzT3duUHJvcGVydHkoZGF0YUZvcm1hdCkgJiYgdHlwZW9mIGNsaXBEYXRhW2RhdGFGb3JtYXRdID09PSBcInN0cmluZ1wiICYmIGNsaXBEYXRhW2RhdGFGb3JtYXRdKSB7XG4gICAgICAgIHN3aXRjaCAoZGF0YUZvcm1hdC50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgICBjYXNlIFwidGV4dC9wbGFpblwiOlxuICAgICAgICAgY2FzZSBcInRleHRcIjpcbiAgICAgICAgIGNhc2UgXCJhaXI6dGV4dFwiOlxuICAgICAgICAgY2FzZSBcImZsYXNoOnRleHRcIjpcbiAgICAgICAgICBuZXdDbGlwRGF0YS50ZXh0ID0gY2xpcERhdGFbZGF0YUZvcm1hdF07XG4gICAgICAgICAgZm9ybWF0TWFwLnRleHQgPSBkYXRhRm9ybWF0O1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICBjYXNlIFwidGV4dC9odG1sXCI6XG4gICAgICAgICBjYXNlIFwiaHRtbFwiOlxuICAgICAgICAgY2FzZSBcImFpcjpodG1sXCI6XG4gICAgICAgICBjYXNlIFwiZmxhc2g6aHRtbFwiOlxuICAgICAgICAgIG5ld0NsaXBEYXRhLmh0bWwgPSBjbGlwRGF0YVtkYXRhRm9ybWF0XTtcbiAgICAgICAgICBmb3JtYXRNYXAuaHRtbCA9IGRhdGFGb3JtYXQ7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgIGNhc2UgXCJhcHBsaWNhdGlvbi9ydGZcIjpcbiAgICAgICAgIGNhc2UgXCJ0ZXh0L3J0ZlwiOlxuICAgICAgICAgY2FzZSBcInJ0ZlwiOlxuICAgICAgICAgY2FzZSBcInJpY2h0ZXh0XCI6XG4gICAgICAgICBjYXNlIFwiYWlyOnJ0ZlwiOlxuICAgICAgICAgY2FzZSBcImZsYXNoOnJ0ZlwiOlxuICAgICAgICAgIG5ld0NsaXBEYXRhLnJ0ZiA9IGNsaXBEYXRhW2RhdGFGb3JtYXRdO1xuICAgICAgICAgIGZvcm1hdE1hcC5ydGYgPSBkYXRhRm9ybWF0O1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBkYXRhOiBuZXdDbGlwRGF0YSxcbiAgICAgIGZvcm1hdE1hcDogZm9ybWF0TWFwXG4gICAgfTtcbiAgfTtcbiAgdmFyIF9tYXBDbGlwUmVzdWx0c0Zyb21GbGFzaCA9IGZ1bmN0aW9uKGNsaXBSZXN1bHRzLCBmb3JtYXRNYXApIHtcbiAgICBpZiAoISh0eXBlb2YgY2xpcFJlc3VsdHMgPT09IFwib2JqZWN0XCIgJiYgY2xpcFJlc3VsdHMgJiYgdHlwZW9mIGZvcm1hdE1hcCA9PT0gXCJvYmplY3RcIiAmJiBmb3JtYXRNYXApKSB7XG4gICAgICByZXR1cm4gY2xpcFJlc3VsdHM7XG4gICAgfVxuICAgIHZhciBuZXdSZXN1bHRzID0ge307XG4gICAgZm9yICh2YXIgcHJvcCBpbiBjbGlwUmVzdWx0cykge1xuICAgICAgaWYgKGNsaXBSZXN1bHRzLmhhc093blByb3BlcnR5KHByb3ApKSB7XG4gICAgICAgIGlmIChwcm9wICE9PSBcInN1Y2Nlc3NcIiAmJiBwcm9wICE9PSBcImRhdGFcIikge1xuICAgICAgICAgIG5ld1Jlc3VsdHNbcHJvcF0gPSBjbGlwUmVzdWx0c1twcm9wXTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBuZXdSZXN1bHRzW3Byb3BdID0ge307XG4gICAgICAgIHZhciB0bXBIYXNoID0gY2xpcFJlc3VsdHNbcHJvcF07XG4gICAgICAgIGZvciAodmFyIGRhdGFGb3JtYXQgaW4gdG1wSGFzaCkge1xuICAgICAgICAgIGlmIChkYXRhRm9ybWF0ICYmIHRtcEhhc2guaGFzT3duUHJvcGVydHkoZGF0YUZvcm1hdCkgJiYgZm9ybWF0TWFwLmhhc093blByb3BlcnR5KGRhdGFGb3JtYXQpKSB7XG4gICAgICAgICAgICBuZXdSZXN1bHRzW3Byb3BdW2Zvcm1hdE1hcFtkYXRhRm9ybWF0XV0gPSB0bXBIYXNoW2RhdGFGb3JtYXRdO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbmV3UmVzdWx0cztcbiAgfTtcbiAgdmFyIF9hcmdzID0gZnVuY3Rpb24oYXJyYXlTbGljZSkge1xuICAgIHJldHVybiBmdW5jdGlvbihhcmdzKSB7XG4gICAgICByZXR1cm4gYXJyYXlTbGljZS5jYWxsKGFyZ3MsIDApO1xuICAgIH07XG4gIH0od2luZG93LkFycmF5LnByb3RvdHlwZS5zbGljZSk7XG4gIHZhciBfZGV0ZWN0Rmxhc2hTdXBwb3J0ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHBsdWdpbiwgYXgsIG1pbWVUeXBlLCBoYXNGbGFzaCA9IGZhbHNlLCBpc0FjdGl2ZVggPSBmYWxzZSwgaXNQUEFQSSA9IGZhbHNlLCBmbGFzaFZlcnNpb24gPSBcIlwiO1xuICAgIGZ1bmN0aW9uIHBhcnNlRmxhc2hWZXJzaW9uKGRlc2MpIHtcbiAgICAgIHZhciBtYXRjaGVzID0gZGVzYy5tYXRjaCgvW1xcZF0rL2cpO1xuICAgICAgbWF0Y2hlcy5sZW5ndGggPSAzO1xuICAgICAgcmV0dXJuIG1hdGNoZXMuam9pbihcIi5cIik7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGlzUGVwcGVyRmxhc2goZmxhc2hQbGF5ZXJGaWxlTmFtZSkge1xuICAgICAgcmV0dXJuICEhZmxhc2hQbGF5ZXJGaWxlTmFtZSAmJiAoZmxhc2hQbGF5ZXJGaWxlTmFtZSA9IGZsYXNoUGxheWVyRmlsZU5hbWUudG9Mb3dlckNhc2UoKSkgJiYgKC9eKHBlcGZsYXNocGxheWVyXFwuZGxsfGxpYnBlcGZsYXNocGxheWVyXFwuc298cGVwcGVyZmxhc2hwbGF5ZXJcXC5wbHVnaW4pJC8udGVzdChmbGFzaFBsYXllckZpbGVOYW1lKSB8fCBmbGFzaFBsYXllckZpbGVOYW1lLnNsaWNlKC0xMykgPT09IFwiY2hyb21lLnBsdWdpblwiKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gaW5zcGVjdFBsdWdpbihwbHVnaW4pIHtcbiAgICAgIGlmIChwbHVnaW4pIHtcbiAgICAgICAgaGFzRmxhc2ggPSB0cnVlO1xuICAgICAgICBpZiAocGx1Z2luLnZlcnNpb24pIHtcbiAgICAgICAgICBmbGFzaFZlcnNpb24gPSBwYXJzZUZsYXNoVmVyc2lvbihwbHVnaW4udmVyc2lvbik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFmbGFzaFZlcnNpb24gJiYgcGx1Z2luLmRlc2NyaXB0aW9uKSB7XG4gICAgICAgICAgZmxhc2hWZXJzaW9uID0gcGFyc2VGbGFzaFZlcnNpb24ocGx1Z2luLmRlc2NyaXB0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocGx1Z2luLmZpbGVuYW1lKSB7XG4gICAgICAgICAgaXNQUEFQSSA9IGlzUGVwcGVyRmxhc2gocGx1Z2luLmZpbGVuYW1lKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAobmF2aWdhdG9yLnBsdWdpbnMgJiYgbmF2aWdhdG9yLnBsdWdpbnMubGVuZ3RoKSB7XG4gICAgICBwbHVnaW4gPSBuYXZpZ2F0b3IucGx1Z2luc1tcIlNob2Nrd2F2ZSBGbGFzaFwiXTtcbiAgICAgIGluc3BlY3RQbHVnaW4ocGx1Z2luKTtcbiAgICAgIGlmIChuYXZpZ2F0b3IucGx1Z2luc1tcIlNob2Nrd2F2ZSBGbGFzaCAyLjBcIl0pIHtcbiAgICAgICAgaGFzRmxhc2ggPSB0cnVlO1xuICAgICAgICBmbGFzaFZlcnNpb24gPSBcIjIuMC4wLjExXCI7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChuYXZpZ2F0b3IubWltZVR5cGVzICYmIG5hdmlnYXRvci5taW1lVHlwZXMubGVuZ3RoKSB7XG4gICAgICBtaW1lVHlwZSA9IG5hdmlnYXRvci5taW1lVHlwZXNbXCJhcHBsaWNhdGlvbi94LXNob2Nrd2F2ZS1mbGFzaFwiXTtcbiAgICAgIHBsdWdpbiA9IG1pbWVUeXBlICYmIG1pbWVUeXBlLmVuYWJsZWRQbHVnaW47XG4gICAgICBpbnNwZWN0UGx1Z2luKHBsdWdpbik7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgQWN0aXZlWE9iamVjdCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgaXNBY3RpdmVYID0gdHJ1ZTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF4ID0gbmV3IEFjdGl2ZVhPYmplY3QoXCJTaG9ja3dhdmVGbGFzaC5TaG9ja3dhdmVGbGFzaC43XCIpO1xuICAgICAgICBoYXNGbGFzaCA9IHRydWU7XG4gICAgICAgIGZsYXNoVmVyc2lvbiA9IHBhcnNlRmxhc2hWZXJzaW9uKGF4LkdldFZhcmlhYmxlKFwiJHZlcnNpb25cIikpO1xuICAgICAgfSBjYXRjaCAoZTEpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBheCA9IG5ldyBBY3RpdmVYT2JqZWN0KFwiU2hvY2t3YXZlRmxhc2guU2hvY2t3YXZlRmxhc2guNlwiKTtcbiAgICAgICAgICBoYXNGbGFzaCA9IHRydWU7XG4gICAgICAgICAgZmxhc2hWZXJzaW9uID0gXCI2LjAuMjFcIjtcbiAgICAgICAgfSBjYXRjaCAoZTIpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXggPSBuZXcgQWN0aXZlWE9iamVjdChcIlNob2Nrd2F2ZUZsYXNoLlNob2Nrd2F2ZUZsYXNoXCIpO1xuICAgICAgICAgICAgaGFzRmxhc2ggPSB0cnVlO1xuICAgICAgICAgICAgZmxhc2hWZXJzaW9uID0gcGFyc2VGbGFzaFZlcnNpb24oYXguR2V0VmFyaWFibGUoXCIkdmVyc2lvblwiKSk7XG4gICAgICAgICAgfSBjYXRjaCAoZTMpIHtcbiAgICAgICAgICAgIGlzQWN0aXZlWCA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBfZmxhc2hTdGF0ZS5kaXNhYmxlZCA9IGhhc0ZsYXNoICE9PSB0cnVlO1xuICAgIF9mbGFzaFN0YXRlLm91dGRhdGVkID0gZmxhc2hWZXJzaW9uICYmIHBhcnNlRmxvYXQoZmxhc2hWZXJzaW9uKSA8IDExO1xuICAgIF9mbGFzaFN0YXRlLnZlcnNpb24gPSBmbGFzaFZlcnNpb24gfHwgXCIwLjAuMFwiO1xuICAgIF9mbGFzaFN0YXRlLnBsdWdpblR5cGUgPSBpc1BQQVBJID8gXCJwZXBwZXJcIiA6IGlzQWN0aXZlWCA/IFwiYWN0aXZleFwiIDogaGFzRmxhc2ggPyBcIm5ldHNjYXBlXCIgOiBcInVua25vd25cIjtcbiAgfTtcbiAgX2RldGVjdEZsYXNoU3VwcG9ydCgpO1xuICB2YXIgWmVyb0NsaXBib2FyZCA9IGZ1bmN0aW9uKGVsZW1lbnRzKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFplcm9DbGlwYm9hcmQpKSB7XG4gICAgICByZXR1cm4gbmV3IFplcm9DbGlwYm9hcmQoZWxlbWVudHMpO1xuICAgIH1cbiAgICB0aGlzLmlkID0gXCJcIiArIF9jbGllbnRJZENvdW50ZXIrKztcbiAgICBfY2xpZW50TWV0YVt0aGlzLmlkXSA9IHtcbiAgICAgIGluc3RhbmNlOiB0aGlzLFxuICAgICAgZWxlbWVudHM6IFtdLFxuICAgICAgaGFuZGxlcnM6IHt9XG4gICAgfTtcbiAgICBpZiAoZWxlbWVudHMpIHtcbiAgICAgIHRoaXMuY2xpcChlbGVtZW50cyk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgX2ZsYXNoU3RhdGUucmVhZHkgIT09IFwiYm9vbGVhblwiKSB7XG4gICAgICBfZmxhc2hTdGF0ZS5yZWFkeSA9IGZhbHNlO1xuICAgIH1cbiAgICBpZiAoIVplcm9DbGlwYm9hcmQuaXNGbGFzaFVudXNhYmxlKCkgJiYgX2ZsYXNoU3RhdGUuYnJpZGdlID09PSBudWxsKSB7XG4gICAgICB2YXIgX2NsaWVudCA9IHRoaXM7XG4gICAgICB2YXIgbWF4V2FpdCA9IF9nbG9iYWxDb25maWcuZmxhc2hMb2FkVGltZW91dDtcbiAgICAgIGlmICh0eXBlb2YgbWF4V2FpdCA9PT0gXCJudW1iZXJcIiAmJiBtYXhXYWl0ID49IDApIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAodHlwZW9mIF9mbGFzaFN0YXRlLmRlYWN0aXZhdGVkICE9PSBcImJvb2xlYW5cIikge1xuICAgICAgICAgICAgX2ZsYXNoU3RhdGUuZGVhY3RpdmF0ZWQgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoX2ZsYXNoU3RhdGUuZGVhY3RpdmF0ZWQgPT09IHRydWUpIHtcbiAgICAgICAgICAgIFplcm9DbGlwYm9hcmQuZW1pdCh7XG4gICAgICAgICAgICAgIHR5cGU6IFwiZXJyb3JcIixcbiAgICAgICAgICAgICAgbmFtZTogXCJmbGFzaC1kZWFjdGl2YXRlZFwiLFxuICAgICAgICAgICAgICBjbGllbnQ6IF9jbGllbnRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgbWF4V2FpdCk7XG4gICAgICB9XG4gICAgICBfZmxhc2hTdGF0ZS5vdmVyZHVlID0gZmFsc2U7XG4gICAgICBfYnJpZGdlKCk7XG4gICAgfVxuICB9O1xuICBaZXJvQ2xpcGJvYXJkLnByb3RvdHlwZS5zZXRUZXh0ID0gZnVuY3Rpb24odGV4dCkge1xuICAgIFplcm9DbGlwYm9hcmQuc2V0RGF0YShcInRleHQvcGxhaW5cIiwgdGV4dCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG4gIFplcm9DbGlwYm9hcmQucHJvdG90eXBlLnNldEh0bWwgPSBmdW5jdGlvbihodG1sKSB7XG4gICAgWmVyb0NsaXBib2FyZC5zZXREYXRhKFwidGV4dC9odG1sXCIsIGh0bWwpO1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xuICBaZXJvQ2xpcGJvYXJkLnByb3RvdHlwZS5zZXRSaWNoVGV4dCA9IGZ1bmN0aW9uKHJpY2hUZXh0KSB7XG4gICAgWmVyb0NsaXBib2FyZC5zZXREYXRhKFwiYXBwbGljYXRpb24vcnRmXCIsIHJpY2hUZXh0KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcbiAgWmVyb0NsaXBib2FyZC5wcm90b3R5cGUuc2V0RGF0YSA9IGZ1bmN0aW9uKCkge1xuICAgIFplcm9DbGlwYm9hcmQuc2V0RGF0YS5hcHBseShaZXJvQ2xpcGJvYXJkLCBfYXJncyhhcmd1bWVudHMpKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcbiAgWmVyb0NsaXBib2FyZC5wcm90b3R5cGUuY2xlYXJEYXRhID0gZnVuY3Rpb24oKSB7XG4gICAgWmVyb0NsaXBib2FyZC5jbGVhckRhdGEuYXBwbHkoWmVyb0NsaXBib2FyZCwgX2FyZ3MoYXJndW1lbnRzKSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG4gIFplcm9DbGlwYm9hcmQucHJvdG90eXBlLnNldFNpemUgPSBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0KSB7XG4gICAgX3NldFNpemUod2lkdGgsIGhlaWdodCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG4gIHZhciBfc2V0SGFuZEN1cnNvciA9IGZ1bmN0aW9uKGVuYWJsZWQpIHtcbiAgICBpZiAoX2ZsYXNoU3RhdGUucmVhZHkgPT09IHRydWUgJiYgX2ZsYXNoU3RhdGUuYnJpZGdlICYmIHR5cGVvZiBfZmxhc2hTdGF0ZS5icmlkZ2Uuc2V0SGFuZEN1cnNvciA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICBfZmxhc2hTdGF0ZS5icmlkZ2Uuc2V0SGFuZEN1cnNvcihlbmFibGVkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgX2ZsYXNoU3RhdGUucmVhZHkgPSBmYWxzZTtcbiAgICB9XG4gIH07XG4gIFplcm9DbGlwYm9hcmQucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnVuY2xpcCgpO1xuICAgIHRoaXMub2ZmKCk7XG4gICAgZGVsZXRlIF9jbGllbnRNZXRhW3RoaXMuaWRdO1xuICB9O1xuICB2YXIgX2dldEFsbENsaWVudHMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaSwgbGVuLCBjbGllbnQsIGNsaWVudHMgPSBbXSwgY2xpZW50SWRzID0gX29iamVjdEtleXMoX2NsaWVudE1ldGEpO1xuICAgIGZvciAoaSA9IDAsIGxlbiA9IGNsaWVudElkcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgY2xpZW50ID0gX2NsaWVudE1ldGFbY2xpZW50SWRzW2ldXS5pbnN0YW5jZTtcbiAgICAgIGlmIChjbGllbnQgJiYgY2xpZW50IGluc3RhbmNlb2YgWmVyb0NsaXBib2FyZCkge1xuICAgICAgICBjbGllbnRzLnB1c2goY2xpZW50KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNsaWVudHM7XG4gIH07XG4gIFplcm9DbGlwYm9hcmQudmVyc2lvbiA9IFwiMi4wLjAtYmV0YS41XCI7XG4gIHZhciBfZ2xvYmFsQ29uZmlnID0ge1xuICAgIHN3ZlBhdGg6IF9zd2ZQYXRoLFxuICAgIHRydXN0ZWREb21haW5zOiB3aW5kb3cubG9jYXRpb24uaG9zdCA/IFsgd2luZG93LmxvY2F0aW9uLmhvc3QgXSA6IFtdLFxuICAgIGNhY2hlQnVzdDogdHJ1ZSxcbiAgICBmb3JjZUhhbmRDdXJzb3I6IGZhbHNlLFxuICAgIGZvcmNlRW5oYW5jZWRDbGlwYm9hcmQ6IGZhbHNlLFxuICAgIHpJbmRleDogOTk5OTk5OTk5LFxuICAgIGRlYnVnOiBmYWxzZSxcbiAgICB0aXRsZTogbnVsbCxcbiAgICBhdXRvQWN0aXZhdGU6IHRydWUsXG4gICAgZmxhc2hMb2FkVGltZW91dDogM2U0XG4gIH07XG4gIFplcm9DbGlwYm9hcmQuaXNGbGFzaFVudXNhYmxlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICEhKF9mbGFzaFN0YXRlLmRpc2FibGVkIHx8IF9mbGFzaFN0YXRlLm91dGRhdGVkIHx8IF9mbGFzaFN0YXRlLnVuYXZhaWxhYmxlIHx8IF9mbGFzaFN0YXRlLmRlYWN0aXZhdGVkKTtcbiAgfTtcbiAgWmVyb0NsaXBib2FyZC5jb25maWcgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgaWYgKHR5cGVvZiBvcHRpb25zID09PSBcIm9iamVjdFwiICYmIG9wdGlvbnMgIT09IG51bGwpIHtcbiAgICAgIF9leHRlbmQoX2dsb2JhbENvbmZpZywgb3B0aW9ucyk7XG4gICAgfVxuICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gXCJzdHJpbmdcIiAmJiBvcHRpb25zKSB7XG4gICAgICBpZiAoX2dsb2JhbENvbmZpZy5oYXNPd25Qcm9wZXJ0eShvcHRpb25zKSkge1xuICAgICAgICByZXR1cm4gX2dsb2JhbENvbmZpZ1tvcHRpb25zXTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIGNvcHkgPSB7fTtcbiAgICBmb3IgKHZhciBwcm9wIGluIF9nbG9iYWxDb25maWcpIHtcbiAgICAgIGlmIChfZ2xvYmFsQ29uZmlnLmhhc093blByb3BlcnR5KHByb3ApKSB7XG4gICAgICAgIGlmICh0eXBlb2YgX2dsb2JhbENvbmZpZ1twcm9wXSA9PT0gXCJvYmplY3RcIiAmJiBfZ2xvYmFsQ29uZmlnW3Byb3BdICE9PSBudWxsKSB7XG4gICAgICAgICAgaWYgKFwibGVuZ3RoXCIgaW4gX2dsb2JhbENvbmZpZ1twcm9wXSkge1xuICAgICAgICAgICAgY29weVtwcm9wXSA9IF9nbG9iYWxDb25maWdbcHJvcF0uc2xpY2UoMCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvcHlbcHJvcF0gPSBfZXh0ZW5kKHt9LCBfZ2xvYmFsQ29uZmlnW3Byb3BdKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29weVtwcm9wXSA9IF9nbG9iYWxDb25maWdbcHJvcF07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNvcHk7XG4gIH07XG4gIFplcm9DbGlwYm9hcmQuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuICAgIFplcm9DbGlwYm9hcmQuZGVhY3RpdmF0ZSgpO1xuICAgIGZvciAodmFyIGNsaWVudElkIGluIF9jbGllbnRNZXRhKSB7XG4gICAgICBpZiAoX2NsaWVudE1ldGEuaGFzT3duUHJvcGVydHkoY2xpZW50SWQpICYmIF9jbGllbnRNZXRhW2NsaWVudElkXSkge1xuICAgICAgICB2YXIgY2xpZW50ID0gX2NsaWVudE1ldGFbY2xpZW50SWRdLmluc3RhbmNlO1xuICAgICAgICBpZiAoY2xpZW50ICYmIHR5cGVvZiBjbGllbnQuZGVzdHJveSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgY2xpZW50LmRlc3Ryb3koKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICB2YXIgZmxhc2hCcmlkZ2UgPSBfZmxhc2hTdGF0ZS5icmlkZ2U7XG4gICAgaWYgKGZsYXNoQnJpZGdlKSB7XG4gICAgICB2YXIgaHRtbEJyaWRnZSA9IF9nZXRIdG1sQnJpZGdlKGZsYXNoQnJpZGdlKTtcbiAgICAgIGlmIChodG1sQnJpZGdlKSB7XG4gICAgICAgIGlmIChfZmxhc2hTdGF0ZS5wbHVnaW5UeXBlID09PSBcImFjdGl2ZXhcIiAmJiBcInJlYWR5U3RhdGVcIiBpbiBmbGFzaEJyaWRnZSkge1xuICAgICAgICAgIGZsYXNoQnJpZGdlLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAoZnVuY3Rpb24gcmVtb3ZlU3dmRnJvbUlFKCkge1xuICAgICAgICAgICAgaWYgKGZsYXNoQnJpZGdlLnJlYWR5U3RhdGUgPT09IDQpIHtcbiAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBmbGFzaEJyaWRnZSkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZmxhc2hCcmlkZ2VbcHJvcF0gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgZmxhc2hCcmlkZ2VbcHJvcF0gPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBmbGFzaEJyaWRnZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGZsYXNoQnJpZGdlKTtcbiAgICAgICAgICAgICAgaWYgKGh0bWxCcmlkZ2UucGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgICAgIGh0bWxCcmlkZ2UucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChodG1sQnJpZGdlKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgc2V0VGltZW91dChyZW1vdmVTd2ZGcm9tSUUsIDEwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGZsYXNoQnJpZGdlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZmxhc2hCcmlkZ2UpO1xuICAgICAgICAgIGlmIChodG1sQnJpZGdlLnBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgIGh0bWxCcmlkZ2UucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChodG1sQnJpZGdlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIF9mbGFzaFN0YXRlLnJlYWR5ID0gbnVsbDtcbiAgICAgIF9mbGFzaFN0YXRlLmJyaWRnZSA9IG51bGw7XG4gICAgICBfZmxhc2hTdGF0ZS5kZWFjdGl2YXRlZCA9IG51bGw7XG4gICAgfVxuICAgIFplcm9DbGlwYm9hcmQuY2xlYXJEYXRhKCk7XG4gIH07XG4gIFplcm9DbGlwYm9hcmQuYWN0aXZhdGUgPSBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgaWYgKF9jdXJyZW50RWxlbWVudCkge1xuICAgICAgX3JlbW92ZUNsYXNzKF9jdXJyZW50RWxlbWVudCwgX2dsb2JhbENvbmZpZy5ob3ZlckNsYXNzKTtcbiAgICAgIF9yZW1vdmVDbGFzcyhfY3VycmVudEVsZW1lbnQsIF9nbG9iYWxDb25maWcuYWN0aXZlQ2xhc3MpO1xuICAgIH1cbiAgICBfY3VycmVudEVsZW1lbnQgPSBlbGVtZW50O1xuICAgIF9hZGRDbGFzcyhlbGVtZW50LCBfZ2xvYmFsQ29uZmlnLmhvdmVyQ2xhc3MpO1xuICAgIF9yZXBvc2l0aW9uKCk7XG4gICAgdmFyIG5ld1RpdGxlID0gX2dsb2JhbENvbmZpZy50aXRsZSB8fCBlbGVtZW50LmdldEF0dHJpYnV0ZShcInRpdGxlXCIpO1xuICAgIGlmIChuZXdUaXRsZSkge1xuICAgICAgdmFyIGh0bWxCcmlkZ2UgPSBfZ2V0SHRtbEJyaWRnZShfZmxhc2hTdGF0ZS5icmlkZ2UpO1xuICAgICAgaWYgKGh0bWxCcmlkZ2UpIHtcbiAgICAgICAgaHRtbEJyaWRnZS5zZXRBdHRyaWJ1dGUoXCJ0aXRsZVwiLCBuZXdUaXRsZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHZhciB1c2VIYW5kQ3Vyc29yID0gX2dsb2JhbENvbmZpZy5mb3JjZUhhbmRDdXJzb3IgPT09IHRydWUgfHwgX2dldFN0eWxlKGVsZW1lbnQsIFwiY3Vyc29yXCIpID09PSBcInBvaW50ZXJcIjtcbiAgICBfc2V0SGFuZEN1cnNvcih1c2VIYW5kQ3Vyc29yKTtcbiAgfTtcbiAgWmVyb0NsaXBib2FyZC5kZWFjdGl2YXRlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGh0bWxCcmlkZ2UgPSBfZ2V0SHRtbEJyaWRnZShfZmxhc2hTdGF0ZS5icmlkZ2UpO1xuICAgIGlmIChodG1sQnJpZGdlKSB7XG4gICAgICBodG1sQnJpZGdlLnJlbW92ZUF0dHJpYnV0ZShcInRpdGxlXCIpO1xuICAgICAgaHRtbEJyaWRnZS5zdHlsZS5sZWZ0ID0gXCIwcHhcIjtcbiAgICAgIGh0bWxCcmlkZ2Uuc3R5bGUudG9wID0gXCItOTk5OXB4XCI7XG4gICAgICBfc2V0U2l6ZSgxLCAxKTtcbiAgICB9XG4gICAgaWYgKF9jdXJyZW50RWxlbWVudCkge1xuICAgICAgX3JlbW92ZUNsYXNzKF9jdXJyZW50RWxlbWVudCwgX2dsb2JhbENvbmZpZy5ob3ZlckNsYXNzKTtcbiAgICAgIF9yZW1vdmVDbGFzcyhfY3VycmVudEVsZW1lbnQsIF9nbG9iYWxDb25maWcuYWN0aXZlQ2xhc3MpO1xuICAgICAgX2N1cnJlbnRFbGVtZW50ID0gbnVsbDtcbiAgICB9XG4gIH07XG4gIFplcm9DbGlwYm9hcmQuc3RhdGUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYnJvd3NlcjogX3BpY2sod2luZG93Lm5hdmlnYXRvciwgWyBcInVzZXJBZ2VudFwiLCBcInBsYXRmb3JtXCIsIFwiYXBwTmFtZVwiIF0pLFxuICAgICAgZmxhc2g6IF9vbWl0KF9mbGFzaFN0YXRlLCBbIFwiYnJpZGdlXCIgXSksXG4gICAgICB6ZXJvY2xpcGJvYXJkOiB7XG4gICAgICAgIHZlcnNpb246IFplcm9DbGlwYm9hcmQudmVyc2lvbixcbiAgICAgICAgY29uZmlnOiBaZXJvQ2xpcGJvYXJkLmNvbmZpZygpXG4gICAgICB9XG4gICAgfTtcbiAgfTtcbiAgWmVyb0NsaXBib2FyZC5zZXREYXRhID0gZnVuY3Rpb24oZm9ybWF0LCBkYXRhKSB7XG4gICAgdmFyIGRhdGFPYmo7XG4gICAgaWYgKHR5cGVvZiBmb3JtYXQgPT09IFwib2JqZWN0XCIgJiYgZm9ybWF0ICYmIHR5cGVvZiBkYXRhID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBkYXRhT2JqID0gZm9ybWF0O1xuICAgICAgWmVyb0NsaXBib2FyZC5jbGVhckRhdGEoKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBmb3JtYXQgPT09IFwic3RyaW5nXCIgJiYgZm9ybWF0KSB7XG4gICAgICBkYXRhT2JqID0ge307XG4gICAgICBkYXRhT2JqW2Zvcm1hdF0gPSBkYXRhO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGZvciAodmFyIGRhdGFGb3JtYXQgaW4gZGF0YU9iaikge1xuICAgICAgaWYgKGRhdGFGb3JtYXQgJiYgZGF0YU9iai5oYXNPd25Qcm9wZXJ0eShkYXRhRm9ybWF0KSAmJiB0eXBlb2YgZGF0YU9ialtkYXRhRm9ybWF0XSA9PT0gXCJzdHJpbmdcIiAmJiBkYXRhT2JqW2RhdGFGb3JtYXRdKSB7XG4gICAgICAgIF9jbGlwRGF0YVtkYXRhRm9ybWF0XSA9IGRhdGFPYmpbZGF0YUZvcm1hdF07XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBaZXJvQ2xpcGJvYXJkLmNsZWFyRGF0YSA9IGZ1bmN0aW9uKGZvcm1hdCkge1xuICAgIGlmICh0eXBlb2YgZm9ybWF0ID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBfZGVsZXRlT3duUHJvcGVydGllcyhfY2xpcERhdGEpO1xuICAgICAgX2NsaXBEYXRhRm9ybWF0TWFwID0gbnVsbDtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBmb3JtYXQgPT09IFwic3RyaW5nXCIgJiYgX2NsaXBEYXRhLmhhc093blByb3BlcnR5KGZvcm1hdCkpIHtcbiAgICAgIGRlbGV0ZSBfY2xpcERhdGFbZm9ybWF0XTtcbiAgICB9XG4gIH07XG4gIHZhciBfYnJpZGdlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGZsYXNoQnJpZGdlLCBsZW47XG4gICAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ2xvYmFsLXplcm9jbGlwYm9hcmQtaHRtbC1icmlkZ2VcIik7XG4gICAgaWYgKCFjb250YWluZXIpIHtcbiAgICAgIHZhciBhbGxvd1NjcmlwdEFjY2VzcyA9IF9kZXRlcm1pbmVTY3JpcHRBY2Nlc3Mod2luZG93LmxvY2F0aW9uLmhvc3QsIF9nbG9iYWxDb25maWcpO1xuICAgICAgdmFyIGFsbG93TmV0d29ya2luZyA9IGFsbG93U2NyaXB0QWNjZXNzID09PSBcIm5ldmVyXCIgPyBcIm5vbmVcIiA6IFwiYWxsXCI7XG4gICAgICB2YXIgZmxhc2h2YXJzID0gX3ZhcnMoX2dsb2JhbENvbmZpZyk7XG4gICAgICB2YXIgc3dmVXJsID0gX2dsb2JhbENvbmZpZy5zd2ZQYXRoICsgX2NhY2hlQnVzdChfZ2xvYmFsQ29uZmlnLnN3ZlBhdGgsIF9nbG9iYWxDb25maWcpO1xuICAgICAgY29udGFpbmVyID0gX2NyZWF0ZUh0bWxCcmlkZ2UoKTtcbiAgICAgIHZhciBkaXZUb0JlUmVwbGFjZWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGRpdlRvQmVSZXBsYWNlZCk7XG4gICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGNvbnRhaW5lcik7XG4gICAgICB2YXIgdG1wRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgIHZhciBvbGRJRSA9IF9mbGFzaFN0YXRlLnBsdWdpblR5cGUgPT09IFwiYWN0aXZleFwiO1xuICAgICAgdG1wRGl2LmlubmVySFRNTCA9ICc8b2JqZWN0IGlkPVwiZ2xvYmFsLXplcm9jbGlwYm9hcmQtZmxhc2gtYnJpZGdlXCIgbmFtZT1cImdsb2JhbC16ZXJvY2xpcGJvYXJkLWZsYXNoLWJyaWRnZVwiICcgKyAnd2lkdGg9XCIxMDAlXCIgaGVpZ2h0PVwiMTAwJVwiICcgKyAob2xkSUUgPyAnY2xhc3NpZD1cImNsc2lkOmQyN2NkYjZlLWFlNmQtMTFjZi05NmI4LTQ0NDU1MzU0MDAwMFwiJyA6ICd0eXBlPVwiYXBwbGljYXRpb24veC1zaG9ja3dhdmUtZmxhc2hcIiBkYXRhPVwiJyArIHN3ZlVybCArICdcIicpICsgXCI+XCIgKyAob2xkSUUgPyAnPHBhcmFtIG5hbWU9XCJtb3ZpZVwiIHZhbHVlPVwiJyArIHN3ZlVybCArICdcIi8+JyA6IFwiXCIpICsgJzxwYXJhbSBuYW1lPVwiYWxsb3dTY3JpcHRBY2Nlc3NcIiB2YWx1ZT1cIicgKyBhbGxvd1NjcmlwdEFjY2VzcyArICdcIi8+JyArICc8cGFyYW0gbmFtZT1cImFsbG93TmV0d29ya2luZ1wiIHZhbHVlPVwiJyArIGFsbG93TmV0d29ya2luZyArICdcIi8+JyArICc8cGFyYW0gbmFtZT1cIm1lbnVcIiB2YWx1ZT1cImZhbHNlXCIvPicgKyAnPHBhcmFtIG5hbWU9XCJ3bW9kZVwiIHZhbHVlPVwidHJhbnNwYXJlbnRcIi8+JyArICc8cGFyYW0gbmFtZT1cImZsYXNodmFyc1wiIHZhbHVlPVwiJyArIGZsYXNodmFycyArICdcIi8+JyArIFwiPC9vYmplY3Q+XCI7XG4gICAgICBmbGFzaEJyaWRnZSA9IHRtcERpdi5maXJzdENoaWxkO1xuICAgICAgdG1wRGl2ID0gbnVsbDtcbiAgICAgIGZsYXNoQnJpZGdlLlplcm9DbGlwYm9hcmQgPSBaZXJvQ2xpcGJvYXJkO1xuICAgICAgY29udGFpbmVyLnJlcGxhY2VDaGlsZChmbGFzaEJyaWRnZSwgZGl2VG9CZVJlcGxhY2VkKTtcbiAgICB9XG4gICAgaWYgKCFmbGFzaEJyaWRnZSkge1xuICAgICAgZmxhc2hCcmlkZ2UgPSBkb2N1bWVudFtcImdsb2JhbC16ZXJvY2xpcGJvYXJkLWZsYXNoLWJyaWRnZVwiXTtcbiAgICAgIGlmIChmbGFzaEJyaWRnZSAmJiAobGVuID0gZmxhc2hCcmlkZ2UubGVuZ3RoKSkge1xuICAgICAgICBmbGFzaEJyaWRnZSA9IGZsYXNoQnJpZGdlW2xlbiAtIDFdO1xuICAgICAgfVxuICAgICAgaWYgKCFmbGFzaEJyaWRnZSkge1xuICAgICAgICBmbGFzaEJyaWRnZSA9IGNvbnRhaW5lci5maXJzdENoaWxkO1xuICAgICAgfVxuICAgIH1cbiAgICBfZmxhc2hTdGF0ZS5icmlkZ2UgPSBmbGFzaEJyaWRnZSB8fCBudWxsO1xuICB9O1xuICB2YXIgX2NyZWF0ZUh0bWxCcmlkZ2UgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICBjb250YWluZXIuaWQgPSBcImdsb2JhbC16ZXJvY2xpcGJvYXJkLWh0bWwtYnJpZGdlXCI7XG4gICAgY29udGFpbmVyLmNsYXNzTmFtZSA9IFwiZ2xvYmFsLXplcm9jbGlwYm9hcmQtY29udGFpbmVyXCI7XG4gICAgY29udGFpbmVyLnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuICAgIGNvbnRhaW5lci5zdHlsZS5sZWZ0ID0gXCIwcHhcIjtcbiAgICBjb250YWluZXIuc3R5bGUudG9wID0gXCItOTk5OXB4XCI7XG4gICAgY29udGFpbmVyLnN0eWxlLndpZHRoID0gXCIxcHhcIjtcbiAgICBjb250YWluZXIuc3R5bGUuaGVpZ2h0ID0gXCIxcHhcIjtcbiAgICBjb250YWluZXIuc3R5bGUuekluZGV4ID0gXCJcIiArIF9nZXRTYWZlWkluZGV4KF9nbG9iYWxDb25maWcuekluZGV4KTtcbiAgICByZXR1cm4gY29udGFpbmVyO1xuICB9O1xuICB2YXIgX2dldEh0bWxCcmlkZ2UgPSBmdW5jdGlvbihmbGFzaEJyaWRnZSkge1xuICAgIHZhciBodG1sQnJpZGdlID0gZmxhc2hCcmlkZ2UgJiYgZmxhc2hCcmlkZ2UucGFyZW50Tm9kZTtcbiAgICB3aGlsZSAoaHRtbEJyaWRnZSAmJiBodG1sQnJpZGdlLm5vZGVOYW1lID09PSBcIk9CSkVDVFwiICYmIGh0bWxCcmlkZ2UucGFyZW50Tm9kZSkge1xuICAgICAgaHRtbEJyaWRnZSA9IGh0bWxCcmlkZ2UucGFyZW50Tm9kZTtcbiAgICB9XG4gICAgcmV0dXJuIGh0bWxCcmlkZ2UgfHwgbnVsbDtcbiAgfTtcbiAgdmFyIF9yZXBvc2l0aW9uID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKF9jdXJyZW50RWxlbWVudCkge1xuICAgICAgdmFyIHBvcyA9IF9nZXRET01PYmplY3RQb3NpdGlvbihfY3VycmVudEVsZW1lbnQsIF9nbG9iYWxDb25maWcuekluZGV4KTtcbiAgICAgIHZhciBodG1sQnJpZGdlID0gX2dldEh0bWxCcmlkZ2UoX2ZsYXNoU3RhdGUuYnJpZGdlKTtcbiAgICAgIGlmIChodG1sQnJpZGdlKSB7XG4gICAgICAgIGh0bWxCcmlkZ2Uuc3R5bGUudG9wID0gcG9zLnRvcCArIFwicHhcIjtcbiAgICAgICAgaHRtbEJyaWRnZS5zdHlsZS5sZWZ0ID0gcG9zLmxlZnQgKyBcInB4XCI7XG4gICAgICAgIGh0bWxCcmlkZ2Uuc3R5bGUud2lkdGggPSBwb3Mud2lkdGggKyBcInB4XCI7XG4gICAgICAgIGh0bWxCcmlkZ2Uuc3R5bGUuaGVpZ2h0ID0gcG9zLmhlaWdodCArIFwicHhcIjtcbiAgICAgICAgaHRtbEJyaWRnZS5zdHlsZS56SW5kZXggPSBwb3MuekluZGV4ICsgMTtcbiAgICAgIH1cbiAgICAgIF9zZXRTaXplKHBvcy53aWR0aCwgcG9zLmhlaWdodCk7XG4gICAgfVxuICB9O1xuICB2YXIgX3NldFNpemUgPSBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0KSB7XG4gICAgdmFyIGh0bWxCcmlkZ2UgPSBfZ2V0SHRtbEJyaWRnZShfZmxhc2hTdGF0ZS5icmlkZ2UpO1xuICAgIGlmIChodG1sQnJpZGdlKSB7XG4gICAgICBodG1sQnJpZGdlLnN0eWxlLndpZHRoID0gd2lkdGggKyBcInB4XCI7XG4gICAgICBodG1sQnJpZGdlLnN0eWxlLmhlaWdodCA9IGhlaWdodCArIFwicHhcIjtcbiAgICB9XG4gIH07XG4gIFplcm9DbGlwYm9hcmQuZW1pdCA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgdmFyIGV2ZW50VHlwZSwgZXZlbnRPYmosIHBlcmZvcm1DYWxsYmFja0FzeW5jLCBjbGllbnRzLCBpLCBsZW4sIGV2ZW50Q29weSwgcmV0dXJuVmFsLCB0bXA7XG4gICAgaWYgKHR5cGVvZiBldmVudCA9PT0gXCJzdHJpbmdcIiAmJiBldmVudCkge1xuICAgICAgZXZlbnRUeXBlID0gZXZlbnQ7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgZXZlbnQgPT09IFwib2JqZWN0XCIgJiYgZXZlbnQgJiYgdHlwZW9mIGV2ZW50LnR5cGUgPT09IFwic3RyaW5nXCIgJiYgZXZlbnQudHlwZSkge1xuICAgICAgZXZlbnRUeXBlID0gZXZlbnQudHlwZTtcbiAgICAgIGV2ZW50T2JqID0gZXZlbnQ7XG4gICAgfVxuICAgIGlmICghZXZlbnRUeXBlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGV2ZW50ID0gX2NyZWF0ZUV2ZW50KGV2ZW50VHlwZSwgZXZlbnRPYmopO1xuICAgIF9wcmVwcm9jZXNzRXZlbnQoZXZlbnQpO1xuICAgIGlmIChldmVudC50eXBlID09PSBcInJlYWR5XCIgJiYgX2ZsYXNoU3RhdGUub3ZlcmR1ZSA9PT0gdHJ1ZSkge1xuICAgICAgcmV0dXJuIFplcm9DbGlwYm9hcmQuZW1pdCh7XG4gICAgICAgIHR5cGU6IFwiZXJyb3JcIixcbiAgICAgICAgbmFtZTogXCJmbGFzaC1vdmVyZHVlXCJcbiAgICAgIH0pO1xuICAgIH1cbiAgICBwZXJmb3JtQ2FsbGJhY2tBc3luYyA9ICEvXihiZWZvcmUpP2NvcHkkLy50ZXN0KGV2ZW50LnR5cGUpO1xuICAgIGlmIChldmVudC5jbGllbnQpIHtcbiAgICAgIF9kaXNwYXRjaENsaWVudENhbGxiYWNrcy5jYWxsKGV2ZW50LmNsaWVudCwgZXZlbnQsIHBlcmZvcm1DYWxsYmFja0FzeW5jKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2xpZW50cyA9IGV2ZW50LnRhcmdldCAmJiBldmVudC50YXJnZXQgIT09IHdpbmRvdyAmJiBfZ2xvYmFsQ29uZmlnLmF1dG9BY3RpdmF0ZSA9PT0gdHJ1ZSA/IF9nZXRBbGxDbGllbnRzQ2xpcHBlZFRvRWxlbWVudChldmVudC50YXJnZXQpIDogX2dldEFsbENsaWVudHMoKTtcbiAgICAgIGZvciAoaSA9IDAsIGxlbiA9IGNsaWVudHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgZXZlbnRDb3B5ID0gX2V4dGVuZCh7fSwgZXZlbnQsIHtcbiAgICAgICAgICBjbGllbnQ6IGNsaWVudHNbaV1cbiAgICAgICAgfSk7XG4gICAgICAgIF9kaXNwYXRjaENsaWVudENhbGxiYWNrcy5jYWxsKGNsaWVudHNbaV0sIGV2ZW50Q29weSwgcGVyZm9ybUNhbGxiYWNrQXN5bmMpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoZXZlbnQudHlwZSA9PT0gXCJjb3B5XCIpIHtcbiAgICAgIHRtcCA9IF9tYXBDbGlwRGF0YVRvRmxhc2goX2NsaXBEYXRhKTtcbiAgICAgIHJldHVyblZhbCA9IHRtcC5kYXRhO1xuICAgICAgX2NsaXBEYXRhRm9ybWF0TWFwID0gdG1wLmZvcm1hdE1hcDtcbiAgICB9XG4gICAgcmV0dXJuIHJldHVyblZhbDtcbiAgfTtcbiAgdmFyIF9kaXNwYXRjaENsaWVudENhbGxiYWNrcyA9IGZ1bmN0aW9uKGV2ZW50LCBhc3luYykge1xuICAgIHZhciBoYW5kbGVycyA9IF9jbGllbnRNZXRhW3RoaXMuaWRdICYmIF9jbGllbnRNZXRhW3RoaXMuaWRdLmhhbmRsZXJzW2V2ZW50LnR5cGVdO1xuICAgIGlmIChoYW5kbGVycyAmJiBoYW5kbGVycy5sZW5ndGgpIHtcbiAgICAgIHZhciBpLCBsZW4sIGZ1bmMsIGNvbnRleHQsIG9yaWdpbmFsQ29udGV4dCA9IHRoaXM7XG4gICAgICBmb3IgKGkgPSAwLCBsZW4gPSBoYW5kbGVycy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBmdW5jID0gaGFuZGxlcnNbaV07XG4gICAgICAgIGNvbnRleHQgPSBvcmlnaW5hbENvbnRleHQ7XG4gICAgICAgIGlmICh0eXBlb2YgZnVuYyA9PT0gXCJzdHJpbmdcIiAmJiB0eXBlb2Ygd2luZG93W2Z1bmNdID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICBmdW5jID0gd2luZG93W2Z1bmNdO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgZnVuYyA9PT0gXCJvYmplY3RcIiAmJiBmdW5jICYmIHR5cGVvZiBmdW5jLmhhbmRsZUV2ZW50ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICBjb250ZXh0ID0gZnVuYztcbiAgICAgICAgICBmdW5jID0gZnVuYy5oYW5kbGVFdmVudDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGZ1bmMgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgIF9kaXNwYXRjaENhbGxiYWNrKGZ1bmMsIGNvbnRleHQsIFsgZXZlbnQgXSwgYXN5bmMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9O1xuICB2YXIgX2V2ZW50TWVzc2FnZXMgPSB7XG4gICAgcmVhZHk6IFwiRmxhc2ggY29tbXVuaWNhdGlvbiBpcyBlc3RhYmxpc2hlZFwiLFxuICAgIGVycm9yOiB7XG4gICAgICBcImZsYXNoLWRpc2FibGVkXCI6IFwiRmxhc2ggaXMgZGlzYWJsZWQgb3Igbm90IGluc3RhbGxlZFwiLFxuICAgICAgXCJmbGFzaC1vdXRkYXRlZFwiOiBcIkZsYXNoIGlzIHRvbyBvdXRkYXRlZCB0byBzdXBwb3J0IFplcm9DbGlwYm9hcmRcIixcbiAgICAgIFwiZmxhc2gtdW5hdmFpbGFibGVcIjogXCJGbGFzaCBpcyB1bmFibGUgdG8gY29tbXVuaWNhdGUgYmlkaXJlY3Rpb25hbGx5IHdpdGggSmF2YVNjcmlwdFwiLFxuICAgICAgXCJmbGFzaC1kZWFjdGl2YXRlZFwiOiBcIkZsYXNoIGlzIHRvbyBvdXRkYXRlZCBmb3IgeW91ciBicm93c2VyIGFuZC9vciBpcyBjb25maWd1cmVkIGFzIGNsaWNrLXRvLWFjdGl2YXRlXCIsXG4gICAgICBcImZsYXNoLW92ZXJkdWVcIjogXCJGbGFzaCBjb21tdW5pY2F0aW9uIHdhcyBlc3RhYmxpc2hlZCBidXQgTk9UIHdpdGhpbiB0aGUgYWNjZXB0YWJsZSB0aW1lIGxpbWl0XCJcbiAgICB9XG4gIH07XG4gIHZhciBfY3JlYXRlRXZlbnQgPSBmdW5jdGlvbihldmVudFR5cGUsIGV2ZW50KSB7XG4gICAgaWYgKCEoZXZlbnRUeXBlIHx8IGV2ZW50ICYmIGV2ZW50LnR5cGUpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGV2ZW50ID0gZXZlbnQgfHwge307XG4gICAgZXZlbnRUeXBlID0gKGV2ZW50VHlwZSB8fCBldmVudC50eXBlKS50b0xvd2VyQ2FzZSgpO1xuICAgIF9leHRlbmQoZXZlbnQsIHtcbiAgICAgIHR5cGU6IGV2ZW50VHlwZSxcbiAgICAgIHRhcmdldDogZXZlbnQudGFyZ2V0IHx8IF9jdXJyZW50RWxlbWVudCB8fCBudWxsLFxuICAgICAgcmVsYXRlZFRhcmdldDogZXZlbnQucmVsYXRlZFRhcmdldCB8fCBudWxsLFxuICAgICAgY3VycmVudFRhcmdldDogX2ZsYXNoU3RhdGUgJiYgX2ZsYXNoU3RhdGUuYnJpZGdlIHx8IG51bGxcbiAgICB9KTtcbiAgICB2YXIgbXNnID0gX2V2ZW50TWVzc2FnZXNbZXZlbnQudHlwZV07XG4gICAgaWYgKGV2ZW50LnR5cGUgPT09IFwiZXJyb3JcIiAmJiBldmVudC5uYW1lICYmIG1zZykge1xuICAgICAgbXNnID0gbXNnW2V2ZW50Lm5hbWVdO1xuICAgIH1cbiAgICBpZiAobXNnKSB7XG4gICAgICBldmVudC5tZXNzYWdlID0gbXNnO1xuICAgIH1cbiAgICBpZiAoZXZlbnQudHlwZSA9PT0gXCJyZWFkeVwiKSB7XG4gICAgICBfZXh0ZW5kKGV2ZW50LCB7XG4gICAgICAgIHRhcmdldDogbnVsbCxcbiAgICAgICAgdmVyc2lvbjogX2ZsYXNoU3RhdGUudmVyc2lvblxuICAgICAgfSk7XG4gICAgfVxuICAgIGlmIChldmVudC50eXBlID09PSBcImVycm9yXCIpIHtcbiAgICAgIGV2ZW50LnRhcmdldCA9IG51bGw7XG4gICAgICBpZiAoL15mbGFzaC0ob3V0ZGF0ZWR8dW5hdmFpbGFibGV8ZGVhY3RpdmF0ZWR8b3ZlcmR1ZSkkLy50ZXN0KGV2ZW50Lm5hbWUpKSB7XG4gICAgICAgIF9leHRlbmQoZXZlbnQsIHtcbiAgICAgICAgICB2ZXJzaW9uOiBfZmxhc2hTdGF0ZS52ZXJzaW9uLFxuICAgICAgICAgIG1pbmltdW1WZXJzaW9uOiBcIjExLjAuMFwiXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoZXZlbnQudHlwZSA9PT0gXCJjb3B5XCIpIHtcbiAgICAgIGV2ZW50LmNsaXBib2FyZERhdGEgPSB7XG4gICAgICAgIHNldERhdGE6IFplcm9DbGlwYm9hcmQuc2V0RGF0YSxcbiAgICAgICAgY2xlYXJEYXRhOiBaZXJvQ2xpcGJvYXJkLmNsZWFyRGF0YVxuICAgICAgfTtcbiAgICB9XG4gICAgaWYgKGV2ZW50LnR5cGUgPT09IFwiYWZ0ZXJjb3B5XCIpIHtcbiAgICAgIGV2ZW50ID0gX21hcENsaXBSZXN1bHRzRnJvbUZsYXNoKGV2ZW50LCBfY2xpcERhdGFGb3JtYXRNYXApO1xuICAgIH1cbiAgICBpZiAoZXZlbnQudGFyZ2V0ICYmICFldmVudC5yZWxhdGVkVGFyZ2V0KSB7XG4gICAgICBldmVudC5yZWxhdGVkVGFyZ2V0ID0gX2dldFJlbGF0ZWRUYXJnZXQoZXZlbnQudGFyZ2V0KTtcbiAgICB9XG4gICAgcmV0dXJuIGV2ZW50O1xuICB9O1xuICB2YXIgX2dldFJlbGF0ZWRUYXJnZXQgPSBmdW5jdGlvbih0YXJnZXRFbCkge1xuICAgIHZhciByZWxhdGVkVGFyZ2V0SWQgPSB0YXJnZXRFbCAmJiB0YXJnZXRFbC5nZXRBdHRyaWJ1dGUgJiYgdGFyZ2V0RWwuZ2V0QXR0cmlidXRlKFwiZGF0YS1jbGlwYm9hcmQtdGFyZ2V0XCIpO1xuICAgIHJldHVybiByZWxhdGVkVGFyZ2V0SWQgPyBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChyZWxhdGVkVGFyZ2V0SWQpIDogbnVsbDtcbiAgfTtcbiAgdmFyIF9wcmVwcm9jZXNzRXZlbnQgPSBmdW5jdGlvbihldmVudCkge1xuICAgIHZhciBlbGVtZW50ID0gZXZlbnQudGFyZ2V0IHx8IF9jdXJyZW50RWxlbWVudDtcbiAgICBzd2l0Y2ggKGV2ZW50LnR5cGUpIHtcbiAgICAgY2FzZSBcImVycm9yXCI6XG4gICAgICBpZiAoX2luQXJyYXkoZXZlbnQubmFtZSwgWyBcImZsYXNoLWRpc2FibGVkXCIsIFwiZmxhc2gtb3V0ZGF0ZWRcIiwgXCJmbGFzaC1kZWFjdGl2YXRlZFwiLCBcImZsYXNoLW92ZXJkdWVcIiBdKSkge1xuICAgICAgICBfZXh0ZW5kKF9mbGFzaFN0YXRlLCB7XG4gICAgICAgICAgZGlzYWJsZWQ6IGV2ZW50Lm5hbWUgPT09IFwiZmxhc2gtZGlzYWJsZWRcIixcbiAgICAgICAgICBvdXRkYXRlZDogZXZlbnQubmFtZSA9PT0gXCJmbGFzaC1vdXRkYXRlZFwiLFxuICAgICAgICAgIHVuYXZhaWxhYmxlOiBldmVudC5uYW1lID09PSBcImZsYXNoLXVuYXZhaWxhYmxlXCIsXG4gICAgICAgICAgZGVhY3RpdmF0ZWQ6IGV2ZW50Lm5hbWUgPT09IFwiZmxhc2gtZGVhY3RpdmF0ZWRcIixcbiAgICAgICAgICBvdmVyZHVlOiBldmVudC5uYW1lID09PSBcImZsYXNoLW92ZXJkdWVcIixcbiAgICAgICAgICByZWFkeTogZmFsc2VcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBicmVhaztcblxuICAgICBjYXNlIFwicmVhZHlcIjpcbiAgICAgIHZhciB3YXNEZWFjdGl2YXRlZCA9IF9mbGFzaFN0YXRlLmRlYWN0aXZhdGVkID09PSB0cnVlO1xuICAgICAgX2V4dGVuZChfZmxhc2hTdGF0ZSwge1xuICAgICAgICBkaXNhYmxlZDogZmFsc2UsXG4gICAgICAgIG91dGRhdGVkOiBmYWxzZSxcbiAgICAgICAgdW5hdmFpbGFibGU6IGZhbHNlLFxuICAgICAgICBkZWFjdGl2YXRlZDogZmFsc2UsXG4gICAgICAgIG92ZXJkdWU6IHdhc0RlYWN0aXZhdGVkLFxuICAgICAgICByZWFkeTogIXdhc0RlYWN0aXZhdGVkXG4gICAgICB9KTtcbiAgICAgIGJyZWFrO1xuXG4gICAgIGNhc2UgXCJjb3B5XCI6XG4gICAgICB2YXIgdGV4dENvbnRlbnQsIGh0bWxDb250ZW50LCB0YXJnZXRFbCA9IGV2ZW50LnJlbGF0ZWRUYXJnZXQ7XG4gICAgICBpZiAoIShfY2xpcERhdGFbXCJ0ZXh0L2h0bWxcIl0gfHwgX2NsaXBEYXRhW1widGV4dC9wbGFpblwiXSkgJiYgdGFyZ2V0RWwgJiYgKGh0bWxDb250ZW50ID0gdGFyZ2V0RWwudmFsdWUgfHwgdGFyZ2V0RWwub3V0ZXJIVE1MIHx8IHRhcmdldEVsLmlubmVySFRNTCkgJiYgKHRleHRDb250ZW50ID0gdGFyZ2V0RWwudmFsdWUgfHwgdGFyZ2V0RWwudGV4dENvbnRlbnQgfHwgdGFyZ2V0RWwuaW5uZXJUZXh0KSkge1xuICAgICAgICBldmVudC5jbGlwYm9hcmREYXRhLmNsZWFyRGF0YSgpO1xuICAgICAgICBldmVudC5jbGlwYm9hcmREYXRhLnNldERhdGEoXCJ0ZXh0L3BsYWluXCIsIHRleHRDb250ZW50KTtcbiAgICAgICAgaWYgKGh0bWxDb250ZW50ICE9PSB0ZXh0Q29udGVudCkge1xuICAgICAgICAgIGV2ZW50LmNsaXBib2FyZERhdGEuc2V0RGF0YShcInRleHQvaHRtbFwiLCBodG1sQ29udGVudCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoIV9jbGlwRGF0YVtcInRleHQvcGxhaW5cIl0gJiYgZXZlbnQudGFyZ2V0ICYmICh0ZXh0Q29udGVudCA9IGV2ZW50LnRhcmdldC5nZXRBdHRyaWJ1dGUoXCJkYXRhLWNsaXBib2FyZC10ZXh0XCIpKSkge1xuICAgICAgICBldmVudC5jbGlwYm9hcmREYXRhLmNsZWFyRGF0YSgpO1xuICAgICAgICBldmVudC5jbGlwYm9hcmREYXRhLnNldERhdGEoXCJ0ZXh0L3BsYWluXCIsIHRleHRDb250ZW50KTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuXG4gICAgIGNhc2UgXCJhZnRlcmNvcHlcIjpcbiAgICAgIFplcm9DbGlwYm9hcmQuY2xlYXJEYXRhKCk7XG4gICAgICBpZiAoZWxlbWVudCAmJiBlbGVtZW50ICE9PSBfc2FmZUFjdGl2ZUVsZW1lbnQoKSAmJiBlbGVtZW50LmZvY3VzKSB7XG4gICAgICAgIGVsZW1lbnQuZm9jdXMoKTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuXG4gICAgIGNhc2UgXCJtb3VzZW92ZXJcIjpcbiAgICAgIF9hZGRDbGFzcyhlbGVtZW50LCBfZ2xvYmFsQ29uZmlnLmhvdmVyQ2xhc3MpO1xuICAgICAgYnJlYWs7XG5cbiAgICAgY2FzZSBcIm1vdXNlb3V0XCI6XG4gICAgICBpZiAoX2dsb2JhbENvbmZpZy5hdXRvQWN0aXZhdGUgPT09IHRydWUpIHtcbiAgICAgICAgWmVyb0NsaXBib2FyZC5kZWFjdGl2YXRlKCk7XG4gICAgICB9XG4gICAgICBicmVhaztcblxuICAgICBjYXNlIFwibW91c2Vkb3duXCI6XG4gICAgICBfYWRkQ2xhc3MoZWxlbWVudCwgX2dsb2JhbENvbmZpZy5hY3RpdmVDbGFzcyk7XG4gICAgICBicmVhaztcblxuICAgICBjYXNlIFwibW91c2V1cFwiOlxuICAgICAgX3JlbW92ZUNsYXNzKGVsZW1lbnQsIF9nbG9iYWxDb25maWcuYWN0aXZlQ2xhc3MpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9O1xuICBaZXJvQ2xpcGJvYXJkLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uKGV2ZW50TmFtZSwgZnVuYykge1xuICAgIHZhciBpLCBsZW4sIGV2ZW50cywgYWRkZWQgPSB7fSwgaGFuZGxlcnMgPSBfY2xpZW50TWV0YVt0aGlzLmlkXSAmJiBfY2xpZW50TWV0YVt0aGlzLmlkXS5oYW5kbGVycztcbiAgICBpZiAodHlwZW9mIGV2ZW50TmFtZSA9PT0gXCJzdHJpbmdcIiAmJiBldmVudE5hbWUpIHtcbiAgICAgIGV2ZW50cyA9IGV2ZW50TmFtZS50b0xvd2VyQ2FzZSgpLnNwbGl0KC9cXHMrLyk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZXZlbnROYW1lID09PSBcIm9iamVjdFwiICYmIGV2ZW50TmFtZSAmJiB0eXBlb2YgZnVuYyA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgZm9yIChpIGluIGV2ZW50TmFtZSkge1xuICAgICAgICBpZiAoZXZlbnROYW1lLmhhc093blByb3BlcnR5KGkpICYmIHR5cGVvZiBpID09PSBcInN0cmluZ1wiICYmIGkgJiYgdHlwZW9mIGV2ZW50TmFtZVtpXSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgdGhpcy5vbihpLCBldmVudE5hbWVbaV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChldmVudHMgJiYgZXZlbnRzLmxlbmd0aCkge1xuICAgICAgZm9yIChpID0gMCwgbGVuID0gZXZlbnRzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIGV2ZW50TmFtZSA9IGV2ZW50c1tpXS5yZXBsYWNlKC9eb24vLCBcIlwiKTtcbiAgICAgICAgYWRkZWRbZXZlbnROYW1lXSA9IHRydWU7XG4gICAgICAgIGlmICghaGFuZGxlcnNbZXZlbnROYW1lXSkge1xuICAgICAgICAgIGhhbmRsZXJzW2V2ZW50TmFtZV0gPSBbXTtcbiAgICAgICAgfVxuICAgICAgICBoYW5kbGVyc1tldmVudE5hbWVdLnB1c2goZnVuYyk7XG4gICAgICB9XG4gICAgICBpZiAoYWRkZWQucmVhZHkgJiYgX2ZsYXNoU3RhdGUucmVhZHkpIHtcbiAgICAgICAgWmVyb0NsaXBib2FyZC5lbWl0KHtcbiAgICAgICAgICB0eXBlOiBcInJlYWR5XCIsXG4gICAgICAgICAgY2xpZW50OiB0aGlzXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgaWYgKGFkZGVkLmVycm9yKSB7XG4gICAgICAgIHZhciBlcnJvclR5cGVzID0gWyBcImRpc2FibGVkXCIsIFwib3V0ZGF0ZWRcIiwgXCJ1bmF2YWlsYWJsZVwiLCBcImRlYWN0aXZhdGVkXCIsIFwib3ZlcmR1ZVwiIF07XG4gICAgICAgIGZvciAoaSA9IDAsIGxlbiA9IGVycm9yVHlwZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICBpZiAoX2ZsYXNoU3RhdGVbZXJyb3JUeXBlc1tpXV0pIHtcbiAgICAgICAgICAgIFplcm9DbGlwYm9hcmQuZW1pdCh7XG4gICAgICAgICAgICAgIHR5cGU6IFwiZXJyb3JcIixcbiAgICAgICAgICAgICAgbmFtZTogXCJmbGFzaC1cIiArIGVycm9yVHlwZXNbaV0sXG4gICAgICAgICAgICAgIGNsaWVudDogdGhpc1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG4gIFplcm9DbGlwYm9hcmQucHJvdG90eXBlLm9mZiA9IGZ1bmN0aW9uKGV2ZW50TmFtZSwgZnVuYykge1xuICAgIHZhciBpLCBsZW4sIGZvdW5kSW5kZXgsIGV2ZW50cywgcGVyRXZlbnRIYW5kbGVycywgaGFuZGxlcnMgPSBfY2xpZW50TWV0YVt0aGlzLmlkXSAmJiBfY2xpZW50TWV0YVt0aGlzLmlkXS5oYW5kbGVycztcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgZXZlbnRzID0gX29iamVjdEtleXMoaGFuZGxlcnMpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGV2ZW50TmFtZSA9PT0gXCJzdHJpbmdcIiAmJiBldmVudE5hbWUpIHtcbiAgICAgIGV2ZW50cyA9IGV2ZW50TmFtZS5zcGxpdCgvXFxzKy8pO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGV2ZW50TmFtZSA9PT0gXCJvYmplY3RcIiAmJiBldmVudE5hbWUgJiYgdHlwZW9mIGZ1bmMgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGZvciAoaSBpbiBldmVudE5hbWUpIHtcbiAgICAgICAgaWYgKGV2ZW50TmFtZS5oYXNPd25Qcm9wZXJ0eShpKSAmJiB0eXBlb2YgaSA9PT0gXCJzdHJpbmdcIiAmJiBpICYmIHR5cGVvZiBldmVudE5hbWVbaV0gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgIHRoaXMub2ZmKGksIGV2ZW50TmFtZVtpXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGV2ZW50cyAmJiBldmVudHMubGVuZ3RoKSB7XG4gICAgICBmb3IgKGkgPSAwLCBsZW4gPSBldmVudHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgZXZlbnROYW1lID0gZXZlbnRzW2ldLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXm9uLywgXCJcIik7XG4gICAgICAgIHBlckV2ZW50SGFuZGxlcnMgPSBoYW5kbGVyc1tldmVudE5hbWVdO1xuICAgICAgICBpZiAocGVyRXZlbnRIYW5kbGVycyAmJiBwZXJFdmVudEhhbmRsZXJzLmxlbmd0aCkge1xuICAgICAgICAgIGlmIChmdW5jKSB7XG4gICAgICAgICAgICBmb3VuZEluZGV4ID0gX2luQXJyYXkoZnVuYywgcGVyRXZlbnRIYW5kbGVycyk7XG4gICAgICAgICAgICB3aGlsZSAoZm91bmRJbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgcGVyRXZlbnRIYW5kbGVycy5zcGxpY2UoZm91bmRJbmRleCwgMSk7XG4gICAgICAgICAgICAgIGZvdW5kSW5kZXggPSBfaW5BcnJheShmdW5jLCBwZXJFdmVudEhhbmRsZXJzLCBmb3VuZEluZGV4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaGFuZGxlcnNbZXZlbnROYW1lXS5sZW5ndGggPSAwO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcbiAgWmVyb0NsaXBib2FyZC5wcm90b3R5cGUuaGFuZGxlcnMgPSBmdW5jdGlvbihldmVudE5hbWUpIHtcbiAgICB2YXIgcHJvcCwgY29weSA9IG51bGwsIGhhbmRsZXJzID0gX2NsaWVudE1ldGFbdGhpcy5pZF0gJiYgX2NsaWVudE1ldGFbdGhpcy5pZF0uaGFuZGxlcnM7XG4gICAgaWYgKGhhbmRsZXJzKSB7XG4gICAgICBpZiAodHlwZW9mIGV2ZW50TmFtZSA9PT0gXCJzdHJpbmdcIiAmJiBldmVudE5hbWUpIHtcbiAgICAgICAgcmV0dXJuIGhhbmRsZXJzW2V2ZW50TmFtZV0gPyBoYW5kbGVyc1tldmVudE5hbWVdLnNsaWNlKDApIDogbnVsbDtcbiAgICAgIH1cbiAgICAgIGNvcHkgPSB7fTtcbiAgICAgIGZvciAocHJvcCBpbiBoYW5kbGVycykge1xuICAgICAgICBpZiAoaGFuZGxlcnMuaGFzT3duUHJvcGVydHkocHJvcCkgJiYgaGFuZGxlcnNbcHJvcF0pIHtcbiAgICAgICAgICBjb3B5W3Byb3BdID0gaGFuZGxlcnNbcHJvcF0uc2xpY2UoMCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNvcHk7XG4gIH07XG4gIFplcm9DbGlwYm9hcmQucHJvdG90eXBlLmNsaXAgPSBmdW5jdGlvbihlbGVtZW50cykge1xuICAgIGVsZW1lbnRzID0gX3ByZXBDbGlwKGVsZW1lbnRzKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoZWxlbWVudHMuaGFzT3duUHJvcGVydHkoaSkgJiYgZWxlbWVudHNbaV0gJiYgZWxlbWVudHNbaV0ubm9kZVR5cGUgPT09IDEpIHtcbiAgICAgICAgaWYgKCFlbGVtZW50c1tpXS56Y0NsaXBwaW5nSWQpIHtcbiAgICAgICAgICBlbGVtZW50c1tpXS56Y0NsaXBwaW5nSWQgPSBcInpjQ2xpcHBpbmdJZF9cIiArIF9lbGVtZW50SWRDb3VudGVyKys7XG4gICAgICAgICAgX2VsZW1lbnRNZXRhW2VsZW1lbnRzW2ldLnpjQ2xpcHBpbmdJZF0gPSBbIHRoaXMuaWQgXTtcbiAgICAgICAgICBpZiAoX2dsb2JhbENvbmZpZy5hdXRvQWN0aXZhdGUgPT09IHRydWUpIHtcbiAgICAgICAgICAgIF9hZGRFdmVudEhhbmRsZXIoZWxlbWVudHNbaV0sIFwibW91c2VvdmVyXCIsIF9lbGVtZW50TW91c2VPdmVyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoX2luQXJyYXkodGhpcy5pZCwgX2VsZW1lbnRNZXRhW2VsZW1lbnRzW2ldLnpjQ2xpcHBpbmdJZF0pID09PSAtMSkge1xuICAgICAgICAgIF9lbGVtZW50TWV0YVtlbGVtZW50c1tpXS56Y0NsaXBwaW5nSWRdLnB1c2godGhpcy5pZCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGNsaXBwZWRFbGVtZW50cyA9IF9jbGllbnRNZXRhW3RoaXMuaWRdLmVsZW1lbnRzO1xuICAgICAgICBpZiAoX2luQXJyYXkoZWxlbWVudHNbaV0sIGNsaXBwZWRFbGVtZW50cykgPT09IC0xKSB7XG4gICAgICAgICAgY2xpcHBlZEVsZW1lbnRzLnB1c2goZWxlbWVudHNbaV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9O1xuICBaZXJvQ2xpcGJvYXJkLnByb3RvdHlwZS51bmNsaXAgPSBmdW5jdGlvbihlbGVtZW50cykge1xuICAgIHZhciBtZXRhID0gX2NsaWVudE1ldGFbdGhpcy5pZF07XG4gICAgaWYgKCFtZXRhKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgdmFyIGNsaXBwZWRFbGVtZW50cyA9IG1ldGEuZWxlbWVudHM7XG4gICAgdmFyIGFycmF5SW5kZXg7XG4gICAgaWYgKHR5cGVvZiBlbGVtZW50cyA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgZWxlbWVudHMgPSBjbGlwcGVkRWxlbWVudHMuc2xpY2UoMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVsZW1lbnRzID0gX3ByZXBDbGlwKGVsZW1lbnRzKTtcbiAgICB9XG4gICAgZm9yICh2YXIgaSA9IGVsZW1lbnRzLmxlbmd0aDsgaS0tOyApIHtcbiAgICAgIGlmIChlbGVtZW50cy5oYXNPd25Qcm9wZXJ0eShpKSAmJiBlbGVtZW50c1tpXSAmJiBlbGVtZW50c1tpXS5ub2RlVHlwZSA9PT0gMSkge1xuICAgICAgICBhcnJheUluZGV4ID0gMDtcbiAgICAgICAgd2hpbGUgKChhcnJheUluZGV4ID0gX2luQXJyYXkoZWxlbWVudHNbaV0sIGNsaXBwZWRFbGVtZW50cywgYXJyYXlJbmRleCkpICE9PSAtMSkge1xuICAgICAgICAgIGNsaXBwZWRFbGVtZW50cy5zcGxpY2UoYXJyYXlJbmRleCwgMSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGNsaWVudElkcyA9IF9lbGVtZW50TWV0YVtlbGVtZW50c1tpXS56Y0NsaXBwaW5nSWRdO1xuICAgICAgICBpZiAoY2xpZW50SWRzKSB7XG4gICAgICAgICAgYXJyYXlJbmRleCA9IDA7XG4gICAgICAgICAgd2hpbGUgKChhcnJheUluZGV4ID0gX2luQXJyYXkodGhpcy5pZCwgY2xpZW50SWRzLCBhcnJheUluZGV4KSkgIT09IC0xKSB7XG4gICAgICAgICAgICBjbGllbnRJZHMuc3BsaWNlKGFycmF5SW5kZXgsIDEpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoY2xpZW50SWRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgaWYgKF9nbG9iYWxDb25maWcuYXV0b0FjdGl2YXRlID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgIF9yZW1vdmVFdmVudEhhbmRsZXIoZWxlbWVudHNbaV0sIFwibW91c2VvdmVyXCIsIF9lbGVtZW50TW91c2VPdmVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlbGV0ZSBlbGVtZW50c1tpXS56Y0NsaXBwaW5nSWQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9O1xuICBaZXJvQ2xpcGJvYXJkLnByb3RvdHlwZS5lbGVtZW50cyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBtZXRhID0gX2NsaWVudE1ldGFbdGhpcy5pZF07XG4gICAgcmV0dXJuIG1ldGEgJiYgbWV0YS5lbGVtZW50cyA/IG1ldGEuZWxlbWVudHMuc2xpY2UoMCkgOiBbXTtcbiAgfTtcbiAgdmFyIF9nZXRBbGxDbGllbnRzQ2xpcHBlZFRvRWxlbWVudCA9IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICB2YXIgZWxlbWVudE1ldGFJZCwgY2xpZW50SWRzLCBpLCBsZW4sIGNsaWVudCwgY2xpZW50cyA9IFtdO1xuICAgIGlmIChlbGVtZW50ICYmIGVsZW1lbnQubm9kZVR5cGUgPT09IDEgJiYgKGVsZW1lbnRNZXRhSWQgPSBlbGVtZW50LnpjQ2xpcHBpbmdJZCkgJiYgX2VsZW1lbnRNZXRhLmhhc093blByb3BlcnR5KGVsZW1lbnRNZXRhSWQpKSB7XG4gICAgICBjbGllbnRJZHMgPSBfZWxlbWVudE1ldGFbZWxlbWVudE1ldGFJZF07XG4gICAgICBpZiAoY2xpZW50SWRzICYmIGNsaWVudElkcy5sZW5ndGgpIHtcbiAgICAgICAgZm9yIChpID0gMCwgbGVuID0gY2xpZW50SWRzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgY2xpZW50ID0gX2NsaWVudE1ldGFbY2xpZW50SWRzW2ldXS5pbnN0YW5jZTtcbiAgICAgICAgICBpZiAoY2xpZW50ICYmIGNsaWVudCBpbnN0YW5jZW9mIFplcm9DbGlwYm9hcmQpIHtcbiAgICAgICAgICAgIGNsaWVudHMucHVzaChjbGllbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY2xpZW50cztcbiAgfTtcbiAgX2dsb2JhbENvbmZpZy5ob3ZlckNsYXNzID0gXCJ6ZXJvY2xpcGJvYXJkLWlzLWhvdmVyXCI7XG4gIF9nbG9iYWxDb25maWcuYWN0aXZlQ2xhc3MgPSBcInplcm9jbGlwYm9hcmQtaXMtYWN0aXZlXCI7XG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZCkge1xuXHQgICAgZGVmaW5lKGZ1bmN0aW9uKCkge1xuXHQgICAgICByZXR1cm4gWmVyb0NsaXBib2FyZDtcblx0ICAgIH0pO1xuXHQgIH0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSA9PT0gXCJvYmplY3RcIiAmJiBtb2R1bGUgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzID09PSBcIm9iamVjdFwiICYmIG1vZHVsZS5leHBvcnRzKSB7XG5cdCAgICBtb2R1bGUuZXhwb3J0cyA9IFplcm9DbGlwYm9hcmQ7XG5cdCAgfVxuXHQgIHdpbmRvdy5aZXJvQ2xpcGJvYXJkID0gWmVyb0NsaXBib2FyZDtcbn0pKGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcztcbn0oKSk7Il0sImZpbGUiOiJwbHVnaW5zL3VlZGl0b3IvdGhpcmQtcGFydHkvemVyb2NsaXBib2FyZC9aZXJvQ2xpcGJvYXJkLmpzIn0=
