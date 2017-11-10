/*!
 * jQuery Form Plugin
 * version: 3.51.0-2014.06.20
 * Requires jQuery v1.5 or later
 * Copyright (c) 2014 M. Alsup
 * Examples and documentation at: http://malsup.com/jquery/form/
 * Project repository: https://github.com/malsup/form
 * Dual licensed under the MIT and GPL licenses.
 * https://github.com/malsup/form#copyright-and-license
 */
/*global ActiveXObject */

// AMD support
(function (factory) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        // using AMD; register as anon module
        define(['jquery'], factory);
    } else {
        // no AMD; invoke directly
        factory( (typeof(jQuery) != 'undefined') ? jQuery : window.Zepto );
    }
}

(function($) {
"use strict";

/*
    Usage Note:
    -----------
    Do not use both ajaxSubmit and ajaxForm on the same form.  These
    functions are mutually exclusive.  Use ajaxSubmit if you want
    to bind your own submit handler to the form.  For example,

    $(document).ready(function() {
        $('#myForm').on('submit', function(e) {
            e.preventDefault(); // <-- important
            $(this).ajaxSubmit({
                target: '#output'
            });
        });
    });

    Use ajaxForm when you want the plugin to manage all the event binding
    for you.  For example,

    $(document).ready(function() {
        $('#myForm').ajaxForm({
            target: '#output'
        });
    });

    You can also use ajaxForm with delegation (requires jQuery v1.7+), so the
    form does not have to exist when you invoke ajaxForm:

    $('#myForm').ajaxForm({
        delegation: true,
        target: '#output'
    });

    When using ajaxForm, the ajaxSubmit function will be invoked for you
    at the appropriate time.
*/

/**
 * Feature detection
 */
var feature = {};
feature.fileapi = $("<input type='file'/>").get(0).files !== undefined;
feature.formdata = window.FormData !== undefined;

var hasProp = !!$.fn.prop;

// attr2 uses prop when it can but checks the return type for
// an expected string.  this accounts for the case where a form 
// contains inputs with names like "action" or "method"; in those
// cases "prop" returns the element
$.fn.attr2 = function() {
    if ( ! hasProp ) {
        return this.attr.apply(this, arguments);
    }
    var val = this.prop.apply(this, arguments);
    if ( ( val && val.jquery ) || typeof val === 'string' ) {
        return val;
    }
    return this.attr.apply(this, arguments);
};

/**
 * ajaxSubmit() provides a mechanism for immediately submitting
 * an HTML form using AJAX.
 */
$.fn.ajaxSubmit = function(options) {
    /*jshint scripturl:true */

    // fast fail if nothing selected (http://dev.jquery.com/ticket/2752)
    if (!this.length) {
        log('ajaxSubmit: skipping submit process - no element selected');
        return this;
    }

    var method, action, url, $form = this;

    if (typeof options == 'function') {
        options = { success: options };
    }
    else if ( options === undefined ) {
        options = {};
    }

    method = options.type || this.attr2('method');
    action = options.url  || this.attr2('action');

    url = (typeof action === 'string') ? $.trim(action) : '';
    url = url || window.location.href || '';
    if (url) {
        // clean url (don't include hash vaue)
        url = (url.match(/^([^#]+)/)||[])[1];
    }

    options = $.extend(true, {
        url:  url,
        success: $.ajaxSettings.success,
        type: method || $.ajaxSettings.type,
        iframeSrc: /^https/i.test(window.location.href || '') ? 'javascript:false' : 'about:blank'
    }, options);

    // hook for manipulating the form data before it is extracted;
    // convenient for use with rich editors like tinyMCE or FCKEditor
    var veto = {};
    this.trigger('form-pre-serialize', [this, options, veto]);
    if (veto.veto) {
        log('ajaxSubmit: submit vetoed via form-pre-serialize trigger');
        return this;
    }

    // provide opportunity to alter form data before it is serialized
    if (options.beforeSerialize && options.beforeSerialize(this, options) === false) {
        log('ajaxSubmit: submit aborted via beforeSerialize callback');
        return this;
    }

    var traditional = options.traditional;
    if ( traditional === undefined ) {
        traditional = $.ajaxSettings.traditional;
    }

    var elements = [];
    var qx, a = this.formToArray(options.semantic, elements);
    if (options.data) {
        options.extraData = options.data;
        qx = $.param(options.data, traditional);
    }

    // give pre-submit callback an opportunity to abort the submit
    if (options.beforeSubmit && options.beforeSubmit(a, this, options) === false) {
        log('ajaxSubmit: submit aborted via beforeSubmit callback');
        return this;
    }

    // fire vetoable 'validate' event
    this.trigger('form-submit-validate', [a, this, options, veto]);
    if (veto.veto) {
        log('ajaxSubmit: submit vetoed via form-submit-validate trigger');
        return this;
    }

    var q = $.param(a, traditional);
    if (qx) {
        q = ( q ? (q + '&' + qx) : qx );
    }
    if (options.type.toUpperCase() == 'GET') {
        options.url += (options.url.indexOf('?') >= 0 ? '&' : '?') + q;
        options.data = null;  // data is null for 'get'
    }
    else {
        options.data = q; // data is the query string for 'post'
    }

    var callbacks = [];
    if (options.resetForm) {
        callbacks.push(function() { $form.resetForm(); });
    }
    if (options.clearForm) {
        callbacks.push(function() { $form.clearForm(options.includeHidden); });
    }

    // perform a load on the target only if dataType is not provided
    if (!options.dataType && options.target) {
        var oldSuccess = options.success || function(){};
        callbacks.push(function(data) {
            var fn = options.replaceTarget ? 'replaceWith' : 'html';
            $(options.target)[fn](data).each(oldSuccess, arguments);
        });
    }
    else if (options.success) {
        callbacks.push(options.success);
    }

    options.success = function(data, status, xhr) { // jQuery 1.4+ passes xhr as 3rd arg
        var context = options.context || this ;    // jQuery 1.4+ supports scope context
        for (var i=0, max=callbacks.length; i < max; i++) {
            callbacks[i].apply(context, [data, status, xhr || $form, $form]);
        }
    };

    if (options.error) {
        var oldError = options.error;
        options.error = function(xhr, status, error) {
            var context = options.context || this;
            oldError.apply(context, [xhr, status, error, $form]);
        };
    }

     if (options.complete) {
        var oldComplete = options.complete;
        options.complete = function(xhr, status) {
            var context = options.context || this;
            oldComplete.apply(context, [xhr, status, $form]);
        };
    }

    // are there files to upload?

    // [value] (issue #113), also see comment:
    // https://github.com/malsup/form/commit/588306aedba1de01388032d5f42a60159eea9228#commitcomment-2180219
    var fileInputs = $('input[type=file]:enabled', this).filter(function() { return $(this).val() !== ''; });

    var hasFileInputs = fileInputs.length > 0;
    var mp = 'multipart/form-data';
    var multipart = ($form.attr('enctype') == mp || $form.attr('encoding') == mp);

    var fileAPI = feature.fileapi && feature.formdata;
    log("fileAPI :" + fileAPI);
    var shouldUseFrame = (hasFileInputs || multipart) && !fileAPI;

    var jqxhr;

    // options.iframe allows user to force iframe mode
    // 06-NOV-09: now defaulting to iframe mode if file input is detected
    if (options.iframe !== false && (options.iframe || shouldUseFrame)) {
        // hack to fix Safari hang (thanks to Tim Molendijk for this)
        // see:  http://groups.google.com/group/jquery-dev/browse_thread/thread/36395b7ab510dd5d
        if (options.closeKeepAlive) {
            $.get(options.closeKeepAlive, function() {
                jqxhr = fileUploadIframe(a);
            });
        }
        else {
            jqxhr = fileUploadIframe(a);
        }
    }
    else if ((hasFileInputs || multipart) && fileAPI) {
        jqxhr = fileUploadXhr(a);
    }
    else {
        jqxhr = $.ajax(options);
    }

    $form.removeData('jqxhr').data('jqxhr', jqxhr);

    // clear element array
    for (var k=0; k < elements.length; k++) {
        elements[k] = null;
    }

    // fire 'notify' event
    this.trigger('form-submit-notify', [this, options]);
    return this;

    // utility fn for deep serialization
    function deepSerialize(extraData){
        var serialized = $.param(extraData, options.traditional).split('&');
        var len = serialized.length;
        var result = [];
        var i, part;
        for (i=0; i < len; i++) {
            // #252; undo param space replacement
            serialized[i] = serialized[i].replace(/\+/g,' ');
            part = serialized[i].split('=');
            // #278; use array instead of object storage, favoring array serializations
            result.push([decodeURIComponent(part[0]), decodeURIComponent(part[1])]);
        }
        return result;
    }

     // XMLHttpRequest Level 2 file uploads (big hat tip to francois2metz)
    function fileUploadXhr(a) {
        var formdata = new FormData();

        for (var i=0; i < a.length; i++) {
            formdata.append(a[i].name, a[i].value);
        }

        if (options.extraData) {
            var serializedData = deepSerialize(options.extraData);
            for (i=0; i < serializedData.length; i++) {
                if (serializedData[i]) {
                    formdata.append(serializedData[i][0], serializedData[i][1]);
                }
            }
        }

        options.data = null;

        var s = $.extend(true, {}, $.ajaxSettings, options, {
            contentType: false,
            processData: false,
            cache: false,
            type: method || 'POST'
        });

        if (options.uploadProgress) {
            // workaround because jqXHR does not expose upload property
            s.xhr = function() {
                var xhr = $.ajaxSettings.xhr();
                if (xhr.upload) {
                    xhr.upload.addEventListener('progress', function(event) {
                        var percent = 0;
                        var position = event.loaded || event.position; /*event.position is deprecated*/
                        var total = event.total;
                        if (event.lengthComputable) {
                            percent = Math.ceil(position / total * 100);
                        }
                        options.uploadProgress(event, position, total, percent);
                    }, false);
                }
                return xhr;
            };
        }

        s.data = null;
        var beforeSend = s.beforeSend;
        s.beforeSend = function(xhr, o) {
            //Send FormData() provided by user
            if (options.formData) {
                o.data = options.formData;
            }
            else {
                o.data = formdata;
            }
            if(beforeSend) {
                beforeSend.call(this, xhr, o);
            }
        };
        return $.ajax(s);
    }

    // private function for handling file uploads (hat tip to YAHOO!)
    function fileUploadIframe(a) {
        var form = $form[0], el, i, s, g, id, $io, io, xhr, sub, n, timedOut, timeoutHandle;
        var deferred = $.Deferred();

        // #341
        deferred.abort = function(status) {
            xhr.abort(status);
        };

        if (a) {
            // ensure that every serialized input is still enabled
            for (i=0; i < elements.length; i++) {
                el = $(elements[i]);
                if ( hasProp ) {
                    el.prop('disabled', false);
                }
                else {
                    el.removeAttr('disabled');
                }
            }
        }

        s = $.extend(true, {}, $.ajaxSettings, options);
        s.context = s.context || s;
        id = 'jqFormIO' + (new Date().getTime());
        if (s.iframeTarget) {
            $io = $(s.iframeTarget);
            n = $io.attr2('name');
            if (!n) {
                $io.attr2('name', id);
            }
            else {
                id = n;
            }
        }
        else {
            $io = $('<iframe name="' + id + '" src="'+ s.iframeSrc +'" />');
            $io.css({ position: 'absolute', top: '-1000px', left: '-1000px' });
        }
        io = $io[0];


        xhr = { // mock object
            aborted: 0,
            responseText: null,
            responseXML: null,
            status: 0,
            statusText: 'n/a',
            getAllResponseHeaders: function() {},
            getResponseHeader: function() {},
            setRequestHeader: function() {},
            abort: function(status) {
                var e = (status === 'timeout' ? 'timeout' : 'aborted');
                log('aborting upload... ' + e);
                this.aborted = 1;

                try { // #214, #257
                    if (io.contentWindow.document.execCommand) {
                        io.contentWindow.document.execCommand('Stop');
                    }
                }
                catch(ignore) {}

                $io.attr('src', s.iframeSrc); // abort op in progress
                xhr.error = e;
                if (s.error) {
                    s.error.call(s.context, xhr, e, status);
                }
                if (g) {
                    $.event.trigger("ajaxError", [xhr, s, e]);
                }
                if (s.complete) {
                    s.complete.call(s.context, xhr, e);
                }
            }
        };

        g = s.global;
        // trigger ajax global events so that activity/block indicators work like normal
        if (g && 0 === $.active++) {
            $.event.trigger("ajaxStart");
        }
        if (g) {
            $.event.trigger("ajaxSend", [xhr, s]);
        }

        if (s.beforeSend && s.beforeSend.call(s.context, xhr, s) === false) {
            if (s.global) {
                $.active--;
            }
            deferred.reject();
            return deferred;
        }
        if (xhr.aborted) {
            deferred.reject();
            return deferred;
        }

        // add submitting element to data if we know it
        sub = form.clk;
        if (sub) {
            n = sub.name;
            if (n && !sub.disabled) {
                s.extraData = s.extraData || {};
                s.extraData[n] = sub.value;
                if (sub.type == "image") {
                    s.extraData[n+'.x'] = form.clk_x;
                    s.extraData[n+'.y'] = form.clk_y;
                }
            }
        }

        var CLIENT_TIMEOUT_ABORT = 1;
        var SERVER_ABORT = 2;
                
        function getDoc(frame) {
            /* it looks like contentWindow or contentDocument do not
             * carry the protocol property in ie8, when running under ssl
             * frame.document is the only valid response document, since
             * the protocol is know but not on the other two objects. strange?
             * "Same origin policy" http://en.wikipedia.org/wiki/Same_origin_policy
             */
            
            var doc = null;
            
            // IE8 cascading access check
            try {
                if (frame.contentWindow) {
                    doc = frame.contentWindow.document;
                }
            } catch(err) {
                // IE8 access denied under ssl & missing protocol
                log('cannot get iframe.contentWindow document: ' + err);
            }

            if (doc) { // successful getting content
                return doc;
            }

            try { // simply checking may throw in ie8 under ssl or mismatched protocol
                doc = frame.contentDocument ? frame.contentDocument : frame.document;
            } catch(err) {
                // last attempt
                log('cannot get iframe.contentDocument: ' + err);
                doc = frame.document;
            }
            return doc;
        }

        // Rails CSRF hack (thanks to Yvan Barthelemy)
        var csrf_token = $('meta[name=csrf-token]').attr('content');
        var csrf_param = $('meta[name=csrf-param]').attr('content');
        if (csrf_param && csrf_token) {
            s.extraData = s.extraData || {};
            s.extraData[csrf_param] = csrf_token;
        }

        // take a breath so that pending repaints get some cpu time before the upload starts
        function doSubmit() {
            // make sure form attrs are set
            var t = $form.attr2('target'), 
                a = $form.attr2('action'), 
                mp = 'multipart/form-data',
                et = $form.attr('enctype') || $form.attr('encoding') || mp;

            // update form attrs in IE friendly way
            form.setAttribute('target',id);
            if (!method || /post/i.test(method) ) {
                form.setAttribute('method', 'POST');
            }
            if (a != s.url) {
                form.setAttribute('action', s.url);
            }

            // ie borks in some cases when setting encoding
            if (! s.skipEncodingOverride && (!method || /post/i.test(method))) {
                $form.attr({
                    encoding: 'multipart/form-data',
                    enctype:  'multipart/form-data'
                });
            }

            // support timout
            if (s.timeout) {
                timeoutHandle = setTimeout(function() { timedOut = true; cb(CLIENT_TIMEOUT_ABORT); }, s.timeout);
            }

            // look for server aborts
            function checkState() {
                try {
                    var state = getDoc(io).readyState;
                    log('state = ' + state);
                    if (state && state.toLowerCase() == 'uninitialized') {
                        setTimeout(checkState,50);
                    }
                }
                catch(e) {
                    log('Server abort: ' , e, ' (', e.name, ')');
                    cb(SERVER_ABORT);
                    if (timeoutHandle) {
                        clearTimeout(timeoutHandle);
                    }
                    timeoutHandle = undefined;
                }
            }

            // add "extra" data to form if provided in options
            var extraInputs = [];
            try {
                if (s.extraData) {
                    for (var n in s.extraData) {
                        if (s.extraData.hasOwnProperty(n)) {
                           // if using the $.param format that allows for multiple values with the same name
                           if($.isPlainObject(s.extraData[n]) && s.extraData[n].hasOwnProperty('name') && s.extraData[n].hasOwnProperty('value')) {
                               extraInputs.push(
                               $('<input type="hidden" name="'+s.extraData[n].name+'">').val(s.extraData[n].value)
                                   .appendTo(form)[0]);
                           } else {
                               extraInputs.push(
                               $('<input type="hidden" name="'+n+'">').val(s.extraData[n])
                                   .appendTo(form)[0]);
                           }
                        }
                    }
                }

                if (!s.iframeTarget) {
                    // add iframe to doc and submit the form
                    $io.appendTo('body');
                }
                if (io.attachEvent) {
                    io.attachEvent('onload', cb);
                }
                else {
                    io.addEventListener('load', cb, false);
                }
                setTimeout(checkState,15);

                try {
                    form.submit();
                } catch(err) {
                    // just in case form has element with name/id of 'submit'
                    var submitFn = document.createElement('form').submit;
                    submitFn.apply(form);
                }
            }
            finally {
                // reset attrs and remove "extra" input elements
                form.setAttribute('action',a);
                form.setAttribute('enctype', et); // #380
                if(t) {
                    form.setAttribute('target', t);
                } else {
                    $form.removeAttr('target');
                }
                $(extraInputs).remove();
            }
        }

        if (s.forceSync) {
            doSubmit();
        }
        else {
            setTimeout(doSubmit, 10); // this lets dom updates render
        }

        var data, doc, domCheckCount = 50, callbackProcessed;

        function cb(e) {
            if (xhr.aborted || callbackProcessed) {
                return;
            }
            
            doc = getDoc(io);
            if(!doc) {
                log('cannot access response document');
                e = SERVER_ABORT;
            }
            if (e === CLIENT_TIMEOUT_ABORT && xhr) {
                xhr.abort('timeout');
                deferred.reject(xhr, 'timeout');
                return;
            }
            else if (e == SERVER_ABORT && xhr) {
                xhr.abort('server abort');
                deferred.reject(xhr, 'error', 'server abort');
                return;
            }

            if (!doc || doc.location.href == s.iframeSrc) {
                // response not received yet
                if (!timedOut) {
                    return;
                }
            }
            if (io.detachEvent) {
                io.detachEvent('onload', cb);
            }
            else {
                io.removeEventListener('load', cb, false);
            }

            var status = 'success', errMsg;
            try {
                if (timedOut) {
                    throw 'timeout';
                }

                var isXml = s.dataType == 'xml' || doc.XMLDocument || $.isXMLDoc(doc);
                log('isXml='+isXml);
                if (!isXml && window.opera && (doc.body === null || !doc.body.innerHTML)) {
                    if (--domCheckCount) {
                        // in some browsers (Opera) the iframe DOM is not always traversable when
                        // the onload callback fires, so we loop a bit to accommodate
                        log('requeing onLoad callback, DOM not available');
                        setTimeout(cb, 250);
                        return;
                    }
                    // let this fall through because server response could be an empty document
                    //log('Could not access iframe DOM after mutiple tries.');
                    //throw 'DOMException: not available';
                }

                //log('response detected');
                var docRoot = doc.body ? doc.body : doc.documentElement;
                xhr.responseText = docRoot ? docRoot.innerHTML : null;
                xhr.responseXML = doc.XMLDocument ? doc.XMLDocument : doc;
                if (isXml) {
                    s.dataType = 'xml';
                }
                xhr.getResponseHeader = function(header){
                    var headers = {'content-type': s.dataType};
                    return headers[header.toLowerCase()];
                };
                // support for XHR 'status' & 'statusText' emulation :
                if (docRoot) {
                    xhr.status = Number( docRoot.getAttribute('status') ) || xhr.status;
                    xhr.statusText = docRoot.getAttribute('statusText') || xhr.statusText;
                }

                var dt = (s.dataType || '').toLowerCase();
                var scr = /(json|script|text)/.test(dt);
                if (scr || s.textarea) {
                    // see if user embedded response in textarea
                    var ta = doc.getElementsByTagName('textarea')[0];
                    if (ta) {
                        xhr.responseText = ta.value;
                        // support for XHR 'status' & 'statusText' emulation :
                        xhr.status = Number( ta.getAttribute('status') ) || xhr.status;
                        xhr.statusText = ta.getAttribute('statusText') || xhr.statusText;
                    }
                    else if (scr) {
                        // account for browsers injecting pre around json response
                        var pre = doc.getElementsByTagName('pre')[0];
                        var b = doc.getElementsByTagName('body')[0];
                        if (pre) {
                            xhr.responseText = pre.textContent ? pre.textContent : pre.innerText;
                        }
                        else if (b) {
                            xhr.responseText = b.textContent ? b.textContent : b.innerText;
                        }
                    }
                }
                else if (dt == 'xml' && !xhr.responseXML && xhr.responseText) {
                    xhr.responseXML = toXml(xhr.responseText);
                }

                try {
                    data = httpData(xhr, dt, s);
                }
                catch (err) {
                    status = 'parsererror';
                    xhr.error = errMsg = (err || status);
                }
            }
            catch (err) {
                log('error caught: ',err);
                status = 'error';
                xhr.error = errMsg = (err || status);
            }

            if (xhr.aborted) {
                log('upload aborted');
                status = null;
            }

            if (xhr.status) { // we've set xhr.status
                status = (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) ? 'success' : 'error';
            }

            // ordering of these callbacks/triggers is odd, but that's how $.ajax does it
            if (status === 'success') {
                if (s.success) {
                    s.success.call(s.context, data, 'success', xhr);
                }
                deferred.resolve(xhr.responseText, 'success', xhr);
                if (g) {
                    $.event.trigger("ajaxSuccess", [xhr, s]);
                }
            }
            else if (status) {
                if (errMsg === undefined) {
                    errMsg = xhr.statusText;
                }
                if (s.error) {
                    s.error.call(s.context, xhr, status, errMsg);
                }
                deferred.reject(xhr, 'error', errMsg);
                if (g) {
                    $.event.trigger("ajaxError", [xhr, s, errMsg]);
                }
            }

            if (g) {
                $.event.trigger("ajaxComplete", [xhr, s]);
            }

            if (g && ! --$.active) {
                $.event.trigger("ajaxStop");
            }

            if (s.complete) {
                s.complete.call(s.context, xhr, status);
            }

            callbackProcessed = true;
            if (s.timeout) {
                clearTimeout(timeoutHandle);
            }

            // clean up
            setTimeout(function() {
                if (!s.iframeTarget) {
                    $io.remove();
                }
                else { //adding else to clean up existing iframe response.
                    $io.attr('src', s.iframeSrc);
                }
                xhr.responseXML = null;
            }, 100);
        }

        var toXml = $.parseXML || function(s, doc) { // use parseXML if available (jQuery 1.5+)
            if (window.ActiveXObject) {
                doc = new ActiveXObject('Microsoft.XMLDOM');
                doc.async = 'false';
                doc.loadXML(s);
            }
            else {
                doc = (new DOMParser()).parseFromString(s, 'text/xml');
            }
            return (doc && doc.documentElement && doc.documentElement.nodeName != 'parsererror') ? doc : null;
        };
        var parseJSON = $.parseJSON || function(s) {
            /*jslint evil:true */
            return window['eval']('(' + s + ')');
        };

        var httpData = function( xhr, type, s ) { // mostly lifted from jq1.4.4

            var ct = xhr.getResponseHeader('content-type') || '',
                xml = type === 'xml' || !type && ct.indexOf('xml') >= 0,
                data = xml ? xhr.responseXML : xhr.responseText;

            if (xml && data.documentElement.nodeName === 'parsererror') {
                if ($.error) {
                    $.error('parsererror');
                }
            }
            if (s && s.dataFilter) {
                data = s.dataFilter(data, type);
            }
            if (typeof data === 'string') {
                if (type === 'json' || !type && ct.indexOf('json') >= 0) {
                    data = parseJSON(data);
                } else if (type === "script" || !type && ct.indexOf("javascript") >= 0) {
                    $.globalEval(data);
                }
            }
            return data;
        };

        return deferred;
    }
};

/**
 * ajaxForm() provides a mechanism for fully automating form submission.
 *
 * The advantages of using this method instead of ajaxSubmit() are:
 *
 * 1: This method will include coordinates for <input type="image" /> elements (if the element
 *    is used to submit the form).
 * 2. This method will include the submit element's name/value data (for the element that was
 *    used to submit the form).
 * 3. This method binds the submit() method to the form for you.
 *
 * The options argument for ajaxForm works exactly as it does for ajaxSubmit.  ajaxForm merely
 * passes the options argument along after properly binding events for submit elements and
 * the form itself.
 */
$.fn.ajaxForm = function(options) {
    options = options || {};
    options.delegation = options.delegation && $.isFunction($.fn.on);

    // in jQuery 1.3+ we can fix mistakes with the ready state
    if (!options.delegation && this.length === 0) {
        var o = { s: this.selector, c: this.context };
        if (!$.isReady && o.s) {
            log('DOM not ready, queuing ajaxForm');
            $(function() {
                $(o.s,o.c).ajaxForm(options);
            });
            return this;
        }
        // is your DOM ready?  http://docs.jquery.com/Tutorials:Introducing_$(document).ready()
        log('terminating; zero elements found by selector' + ($.isReady ? '' : ' (DOM not ready)'));
        return this;
    }

    if ( options.delegation ) {
        $(document)
            .off('submit.form-plugin', this.selector, doAjaxSubmit)
            .off('click.form-plugin', this.selector, captureSubmittingElement)
            .on('submit.form-plugin', this.selector, options, doAjaxSubmit)
            .on('click.form-plugin', this.selector, options, captureSubmittingElement);
        return this;
    }

    return this.ajaxFormUnbind()
        .bind('submit.form-plugin', options, doAjaxSubmit)
        .bind('click.form-plugin', options, captureSubmittingElement);
};

// private event handlers
function doAjaxSubmit(e) {
    /*jshint validthis:true */
    var options = e.data;
    if (!e.isDefaultPrevented()) { // if event has been canceled, don't proceed
        e.preventDefault();
        $(e.target).ajaxSubmit(options); // #365
    }
}

function captureSubmittingElement(e) {
    /*jshint validthis:true */
    var target = e.target;
    var $el = $(target);
    if (!($el.is("[type=submit],[type=image]"))) {
        // is this a child element of the submit el?  (ex: a span within a button)
        var t = $el.closest('[type=submit]');
        if (t.length === 0) {
            return;
        }
        target = t[0];
    }
    var form = this;
    form.clk = target;
    if (target.type == 'image') {
        if (e.offsetX !== undefined) {
            form.clk_x = e.offsetX;
            form.clk_y = e.offsetY;
        } else if (typeof $.fn.offset == 'function') {
            var offset = $el.offset();
            form.clk_x = e.pageX - offset.left;
            form.clk_y = e.pageY - offset.top;
        } else {
            form.clk_x = e.pageX - target.offsetLeft;
            form.clk_y = e.pageY - target.offsetTop;
        }
    }
    // clear form vars
    setTimeout(function() { form.clk = form.clk_x = form.clk_y = null; }, 100);
}


// ajaxFormUnbind unbinds the event handlers that were bound by ajaxForm
$.fn.ajaxFormUnbind = function() {
    return this.unbind('submit.form-plugin click.form-plugin');
};

/**
 * formToArray() gathers form element data into an array of objects that can
 * be passed to any of the following ajax functions: $.get, $.post, or load.
 * Each object in the array has both a 'name' and 'value' property.  An example of
 * an array for a simple login form might be:
 *
 * [ { name: 'username', value: 'jresig' }, { name: 'password', value: 'secret' } ]
 *
 * It is this array that is passed to pre-submit callback functions provided to the
 * ajaxSubmit() and ajaxForm() methods.
 */
$.fn.formToArray = function(semantic, elements) {
    var a = [];
    if (this.length === 0) {
        return a;
    }

    var form = this[0];
    var formId = this.attr('id');
    var els = semantic ? form.getElementsByTagName('*') : form.elements;
    var els2;

    if (els && !/MSIE [678]/.test(navigator.userAgent)) { // #390
        els = $(els).get();  // convert to standard array
    }

    // #386; account for inputs outside the form which use the 'form' attribute
    if ( formId ) {
        els2 = $(':input[form="' + formId + '"]').get(); // hat tip @thet
        if ( els2.length ) {
            els = (els || []).concat(els2);
        }
    }

    if (!els || !els.length) {
        return a;
    }

    var i,j,n,v,el,max,jmax;
    for(i=0, max=els.length; i < max; i++) {
        el = els[i];
        n = el.name;
        if (!n || el.disabled) {
            continue;
        }

        if (semantic && form.clk && el.type == "image") {
            // handle image inputs on the fly when semantic == true
            if(form.clk == el) {
                a.push({name: n, value: $(el).val(), type: el.type });
                a.push({name: n+'.x', value: form.clk_x}, {name: n+'.y', value: form.clk_y});
            }
            continue;
        }

        v = $.fieldValue(el, true);
        if (v && v.constructor == Array) {
            if (elements) {
                elements.push(el);
            }
            for(j=0, jmax=v.length; j < jmax; j++) {
                a.push({name: n, value: v[j]});
            }
        }
        else if (feature.fileapi && el.type == 'file') {
            if (elements) {
                elements.push(el);
            }
            var files = el.files;
            if (files.length) {
                for (j=0; j < files.length; j++) {
                    a.push({name: n, value: files[j], type: el.type});
                }
            }
            else {
                // #180
                a.push({ name: n, value: '', type: el.type });
            }
        }
        else if (v !== null && typeof v != 'undefined') {
            if (elements) {
                elements.push(el);
            }
            a.push({name: n, value: v, type: el.type, required: el.required});
        }
    }

    if (!semantic && form.clk) {
        // input type=='image' are not found in elements array! handle it here
        var $input = $(form.clk), input = $input[0];
        n = input.name;
        if (n && !input.disabled && input.type == 'image') {
            a.push({name: n, value: $input.val()});
            a.push({name: n+'.x', value: form.clk_x}, {name: n+'.y', value: form.clk_y});
        }
    }
    return a;
};

/**
 * Serializes form data into a 'submittable' string. This method will return a string
 * in the format: name1=value1&amp;name2=value2
 */
$.fn.formSerialize = function(semantic) {
    //hand off to jQuery.param for proper encoding
    return $.param(this.formToArray(semantic));
};

/**
 * Serializes all field elements in the jQuery object into a query string.
 * This method will return a string in the format: name1=value1&amp;name2=value2
 */
$.fn.fieldSerialize = function(successful) {
    var a = [];
    this.each(function() {
        var n = this.name;
        if (!n) {
            return;
        }
        var v = $.fieldValue(this, successful);
        if (v && v.constructor == Array) {
            for (var i=0,max=v.length; i < max; i++) {
                a.push({name: n, value: v[i]});
            }
        }
        else if (v !== null && typeof v != 'undefined') {
            a.push({name: this.name, value: v});
        }
    });
    //hand off to jQuery.param for proper encoding
    return $.param(a);
};

/**
 * Returns the value(s) of the element in the matched set.  For example, consider the following form:
 *
 *  <form><fieldset>
 *      <input name="A" type="text" />
 *      <input name="A" type="text" />
 *      <input name="B" type="checkbox" value="B1" />
 *      <input name="B" type="checkbox" value="B2"/>
 *      <input name="C" type="radio" value="C1" />
 *      <input name="C" type="radio" value="C2" />
 *  </fieldset></form>
 *
 *  var v = $('input[type=text]').fieldValue();
 *  // if no values are entered into the text inputs
 *  v == ['','']
 *  // if values entered into the text inputs are 'foo' and 'bar'
 *  v == ['foo','bar']
 *
 *  var v = $('input[type=checkbox]').fieldValue();
 *  // if neither checkbox is checked
 *  v === undefined
 *  // if both checkboxes are checked
 *  v == ['B1', 'B2']
 *
 *  var v = $('input[type=radio]').fieldValue();
 *  // if neither radio is checked
 *  v === undefined
 *  // if first radio is checked
 *  v == ['C1']
 *
 * The successful argument controls whether or not the field element must be 'successful'
 * (per http://www.w3.org/TR/html4/interact/forms.html#successful-controls).
 * The default value of the successful argument is true.  If this value is false the value(s)
 * for each element is returned.
 *
 * Note: This method *always* returns an array.  If no valid value can be determined the
 *    array will be empty, otherwise it will contain one or more values.
 */
$.fn.fieldValue = function(successful) {
    for (var val=[], i=0, max=this.length; i < max; i++) {
        var el = this[i];
        var v = $.fieldValue(el, successful);
        if (v === null || typeof v == 'undefined' || (v.constructor == Array && !v.length)) {
            continue;
        }
        if (v.constructor == Array) {
            $.merge(val, v);
        }
        else {
            val.push(v);
        }
    }
    return val;
};

/**
 * Returns the value of the field element.
 */
$.fieldValue = function(el, successful) {
    var n = el.name, t = el.type, tag = el.tagName.toLowerCase();
    if (successful === undefined) {
        successful = true;
    }

    if (successful && (!n || el.disabled || t == 'reset' || t == 'button' ||
        (t == 'checkbox' || t == 'radio') && !el.checked ||
        (t == 'submit' || t == 'image') && el.form && el.form.clk != el ||
        tag == 'select' && el.selectedIndex == -1)) {
            return null;
    }

    if (tag == 'select') {
        var index = el.selectedIndex;
        if (index < 0) {
            return null;
        }
        var a = [], ops = el.options;
        var one = (t == 'select-one');
        var max = (one ? index+1 : ops.length);
        for(var i=(one ? index : 0); i < max; i++) {
            var op = ops[i];
            if (op.selected) {
                var v = op.value;
                if (!v) { // extra pain for IE...
                    v = (op.attributes && op.attributes.value && !(op.attributes.value.specified)) ? op.text : op.value;
                }
                if (one) {
                    return v;
                }
                a.push(v);
            }
        }
        return a;
    }
    return $(el).val();
};

/**
 * Clears the form data.  Takes the following actions on the form's input fields:
 *  - input text fields will have their 'value' property set to the empty string
 *  - select elements will have their 'selectedIndex' property set to -1
 *  - checkbox and radio inputs will have their 'checked' property set to false
 *  - inputs of type submit, button, reset, and hidden will *not* be effected
 *  - button elements will *not* be effected
 */
$.fn.clearForm = function(includeHidden) {
    return this.each(function() {
        $('input,select,textarea', this).clearFields(includeHidden);
    });
};

/**
 * Clears the selected form elements.
 */
$.fn.clearFields = $.fn.clearInputs = function(includeHidden) {
    var re = /^(?:color|date|datetime|email|month|number|password|range|search|tel|text|time|url|week)$/i; // 'hidden' is not in this list
    return this.each(function() {
        var t = this.type, tag = this.tagName.toLowerCase();
        if (re.test(t) || tag == 'textarea') {
            this.value = '';
        }
        else if (t == 'checkbox' || t == 'radio') {
            this.checked = false;
        }
        else if (tag == 'select') {
            this.selectedIndex = -1;
        }
        else if (t == "file") {
            if (/MSIE/.test(navigator.userAgent)) {
                $(this).replaceWith($(this).clone(true));
            } else {
                $(this).val('');
            }
        }
        else if (includeHidden) {
            // includeHidden can be the value true, or it can be a selector string
            // indicating a special test; for example:
            //  $('#myForm').clearForm('.special:hidden')
            // the above would clean hidden inputs that have the class of 'special'
            if ( (includeHidden === true && /hidden/.test(t)) ||
                 (typeof includeHidden == 'string' && $(this).is(includeHidden)) ) {
                this.value = '';
            }
        }
    });
};

/**
 * Resets the form data.  Causes all form elements to be reset to their original value.
 */
/*$.fn.resetForm = function() {
    return this.each(function() {
        // guard against an input with the name of 'reset'
        // note that IE reports the reset function as an 'object'
        if (typeof this.reset == 'function' || (typeof this.reset == 'object' && !this.reset.nodeType)) {
            this.reset();
        }
    });
};*/

/**
 * Enables or disables any matching elements.
 */
$.fn.enable = function(b) {
    if (b === undefined) {
        b = true;
    }
    return this.each(function() {
        this.disabled = !b;
    });
};

/**
 * Checks/unchecks any matching checkboxes or radio buttons and
 * selects/deselects and matching option elements.
 */
$.fn.selected = function(select) {
    if (select === undefined) {
        select = true;
    }
    return this.each(function() {
        var t = this.type;
        if (t == 'checkbox' || t == 'radio') {
            this.checked = select;
        }
        else if (this.tagName.toLowerCase() == 'option') {
            var $sel = $(this).parent('select');
            if (select && $sel[0] && $sel[0].type == 'select-one') {
                // deselect all other options
                $sel.find('option').selected(false);
            }
            this.selected = select;
        }
    });
};

// expose debug var
$.fn.ajaxSubmit.debug = false;

// helper fn for console logging
function log() {
    if (!$.fn.ajaxSubmit.debug) {
        return;
    }
    var msg = '[jquery.form] ' + Array.prototype.join.call(arguments,'');
    if (window.console && window.console.log) {
        window.console.log(msg);
    }
    else if (window.opera && window.opera.postError) {
        window.opera.postError(msg);
    }
}

}));

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL2Zvcm0vZm9ybS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiFcbiAqIGpRdWVyeSBGb3JtIFBsdWdpblxuICogdmVyc2lvbjogMy41MS4wLTIwMTQuMDYuMjBcbiAqIFJlcXVpcmVzIGpRdWVyeSB2MS41IG9yIGxhdGVyXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQgTS4gQWxzdXBcbiAqIEV4YW1wbGVzIGFuZCBkb2N1bWVudGF0aW9uIGF0OiBodHRwOi8vbWFsc3VwLmNvbS9qcXVlcnkvZm9ybS9cbiAqIFByb2plY3QgcmVwb3NpdG9yeTogaHR0cHM6Ly9naXRodWIuY29tL21hbHN1cC9mb3JtXG4gKiBEdWFsIGxpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgYW5kIEdQTCBsaWNlbnNlcy5cbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9tYWxzdXAvZm9ybSNjb3B5cmlnaHQtYW5kLWxpY2Vuc2VcbiAqL1xuLypnbG9iYWwgQWN0aXZlWE9iamVjdCAqL1xuXG4vLyBBTUQgc3VwcG9ydFxuKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICAvLyB1c2luZyBBTUQ7IHJlZ2lzdGVyIGFzIGFub24gbW9kdWxlXG4gICAgICAgIGRlZmluZShbJ2pxdWVyeSddLCBmYWN0b3J5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBubyBBTUQ7IGludm9rZSBkaXJlY3RseVxuICAgICAgICBmYWN0b3J5KCAodHlwZW9mKGpRdWVyeSkgIT0gJ3VuZGVmaW5lZCcpID8galF1ZXJ5IDogd2luZG93LlplcHRvICk7XG4gICAgfVxufVxuXG4oZnVuY3Rpb24oJCkge1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qXG4gICAgVXNhZ2UgTm90ZTpcbiAgICAtLS0tLS0tLS0tLVxuICAgIERvIG5vdCB1c2UgYm90aCBhamF4U3VibWl0IGFuZCBhamF4Rm9ybSBvbiB0aGUgc2FtZSBmb3JtLiAgVGhlc2VcbiAgICBmdW5jdGlvbnMgYXJlIG11dHVhbGx5IGV4Y2x1c2l2ZS4gIFVzZSBhamF4U3VibWl0IGlmIHlvdSB3YW50XG4gICAgdG8gYmluZCB5b3VyIG93biBzdWJtaXQgaGFuZGxlciB0byB0aGUgZm9ybS4gIEZvciBleGFtcGxlLFxuXG4gICAgJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKSB7XG4gICAgICAgICQoJyNteUZvcm0nKS5vbignc3VibWl0JywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpOyAvLyA8LS0gaW1wb3J0YW50XG4gICAgICAgICAgICAkKHRoaXMpLmFqYXhTdWJtaXQoe1xuICAgICAgICAgICAgICAgIHRhcmdldDogJyNvdXRwdXQnXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBVc2UgYWpheEZvcm0gd2hlbiB5b3Ugd2FudCB0aGUgcGx1Z2luIHRvIG1hbmFnZSBhbGwgdGhlIGV2ZW50IGJpbmRpbmdcbiAgICBmb3IgeW91LiAgRm9yIGV4YW1wbGUsXG5cbiAgICAkKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigpIHtcbiAgICAgICAgJCgnI215Rm9ybScpLmFqYXhGb3JtKHtcbiAgICAgICAgICAgIHRhcmdldDogJyNvdXRwdXQnXG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgWW91IGNhbiBhbHNvIHVzZSBhamF4Rm9ybSB3aXRoIGRlbGVnYXRpb24gKHJlcXVpcmVzIGpRdWVyeSB2MS43KyksIHNvIHRoZVxuICAgIGZvcm0gZG9lcyBub3QgaGF2ZSB0byBleGlzdCB3aGVuIHlvdSBpbnZva2UgYWpheEZvcm06XG5cbiAgICAkKCcjbXlGb3JtJykuYWpheEZvcm0oe1xuICAgICAgICBkZWxlZ2F0aW9uOiB0cnVlLFxuICAgICAgICB0YXJnZXQ6ICcjb3V0cHV0J1xuICAgIH0pO1xuXG4gICAgV2hlbiB1c2luZyBhamF4Rm9ybSwgdGhlIGFqYXhTdWJtaXQgZnVuY3Rpb24gd2lsbCBiZSBpbnZva2VkIGZvciB5b3VcbiAgICBhdCB0aGUgYXBwcm9wcmlhdGUgdGltZS5cbiovXG5cbi8qKlxuICogRmVhdHVyZSBkZXRlY3Rpb25cbiAqL1xudmFyIGZlYXR1cmUgPSB7fTtcbmZlYXR1cmUuZmlsZWFwaSA9ICQoXCI8aW5wdXQgdHlwZT0nZmlsZScvPlwiKS5nZXQoMCkuZmlsZXMgIT09IHVuZGVmaW5lZDtcbmZlYXR1cmUuZm9ybWRhdGEgPSB3aW5kb3cuRm9ybURhdGEgIT09IHVuZGVmaW5lZDtcblxudmFyIGhhc1Byb3AgPSAhISQuZm4ucHJvcDtcblxuLy8gYXR0cjIgdXNlcyBwcm9wIHdoZW4gaXQgY2FuIGJ1dCBjaGVja3MgdGhlIHJldHVybiB0eXBlIGZvclxuLy8gYW4gZXhwZWN0ZWQgc3RyaW5nLiAgdGhpcyBhY2NvdW50cyBmb3IgdGhlIGNhc2Ugd2hlcmUgYSBmb3JtIFxuLy8gY29udGFpbnMgaW5wdXRzIHdpdGggbmFtZXMgbGlrZSBcImFjdGlvblwiIG9yIFwibWV0aG9kXCI7IGluIHRob3NlXG4vLyBjYXNlcyBcInByb3BcIiByZXR1cm5zIHRoZSBlbGVtZW50XG4kLmZuLmF0dHIyID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCAhIGhhc1Byb3AgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmF0dHIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gICAgdmFyIHZhbCA9IHRoaXMucHJvcC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIGlmICggKCB2YWwgJiYgdmFsLmpxdWVyeSApIHx8IHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnICkge1xuICAgICAgICByZXR1cm4gdmFsO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5hdHRyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59O1xuXG4vKipcbiAqIGFqYXhTdWJtaXQoKSBwcm92aWRlcyBhIG1lY2hhbmlzbSBmb3IgaW1tZWRpYXRlbHkgc3VibWl0dGluZ1xuICogYW4gSFRNTCBmb3JtIHVzaW5nIEFKQVguXG4gKi9cbiQuZm4uYWpheFN1Ym1pdCA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAvKmpzaGludCBzY3JpcHR1cmw6dHJ1ZSAqL1xuXG4gICAgLy8gZmFzdCBmYWlsIGlmIG5vdGhpbmcgc2VsZWN0ZWQgKGh0dHA6Ly9kZXYuanF1ZXJ5LmNvbS90aWNrZXQvMjc1MilcbiAgICBpZiAoIXRoaXMubGVuZ3RoKSB7XG4gICAgICAgIGxvZygnYWpheFN1Ym1pdDogc2tpcHBpbmcgc3VibWl0IHByb2Nlc3MgLSBubyBlbGVtZW50IHNlbGVjdGVkJyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHZhciBtZXRob2QsIGFjdGlvbiwgdXJsLCAkZm9ybSA9IHRoaXM7XG5cbiAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBvcHRpb25zID0geyBzdWNjZXNzOiBvcHRpb25zIH07XG4gICAgfVxuICAgIGVsc2UgaWYgKCBvcHRpb25zID09PSB1bmRlZmluZWQgKSB7XG4gICAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICB9XG5cbiAgICBtZXRob2QgPSBvcHRpb25zLnR5cGUgfHwgdGhpcy5hdHRyMignbWV0aG9kJyk7XG4gICAgYWN0aW9uID0gb3B0aW9ucy51cmwgIHx8IHRoaXMuYXR0cjIoJ2FjdGlvbicpO1xuXG4gICAgdXJsID0gKHR5cGVvZiBhY3Rpb24gPT09ICdzdHJpbmcnKSA/ICQudHJpbShhY3Rpb24pIDogJyc7XG4gICAgdXJsID0gdXJsIHx8IHdpbmRvdy5sb2NhdGlvbi5ocmVmIHx8ICcnO1xuICAgIGlmICh1cmwpIHtcbiAgICAgICAgLy8gY2xlYW4gdXJsIChkb24ndCBpbmNsdWRlIGhhc2ggdmF1ZSlcbiAgICAgICAgdXJsID0gKHVybC5tYXRjaCgvXihbXiNdKykvKXx8W10pWzFdO1xuICAgIH1cblxuICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7XG4gICAgICAgIHVybDogIHVybCxcbiAgICAgICAgc3VjY2VzczogJC5hamF4U2V0dGluZ3Muc3VjY2VzcyxcbiAgICAgICAgdHlwZTogbWV0aG9kIHx8ICQuYWpheFNldHRpbmdzLnR5cGUsXG4gICAgICAgIGlmcmFtZVNyYzogL15odHRwcy9pLnRlc3Qod2luZG93LmxvY2F0aW9uLmhyZWYgfHwgJycpID8gJ2phdmFzY3JpcHQ6ZmFsc2UnIDogJ2Fib3V0OmJsYW5rJ1xuICAgIH0sIG9wdGlvbnMpO1xuXG4gICAgLy8gaG9vayBmb3IgbWFuaXB1bGF0aW5nIHRoZSBmb3JtIGRhdGEgYmVmb3JlIGl0IGlzIGV4dHJhY3RlZDtcbiAgICAvLyBjb252ZW5pZW50IGZvciB1c2Ugd2l0aCByaWNoIGVkaXRvcnMgbGlrZSB0aW55TUNFIG9yIEZDS0VkaXRvclxuICAgIHZhciB2ZXRvID0ge307XG4gICAgdGhpcy50cmlnZ2VyKCdmb3JtLXByZS1zZXJpYWxpemUnLCBbdGhpcywgb3B0aW9ucywgdmV0b10pO1xuICAgIGlmICh2ZXRvLnZldG8pIHtcbiAgICAgICAgbG9nKCdhamF4U3VibWl0OiBzdWJtaXQgdmV0b2VkIHZpYSBmb3JtLXByZS1zZXJpYWxpemUgdHJpZ2dlcicpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvLyBwcm92aWRlIG9wcG9ydHVuaXR5IHRvIGFsdGVyIGZvcm0gZGF0YSBiZWZvcmUgaXQgaXMgc2VyaWFsaXplZFxuICAgIGlmIChvcHRpb25zLmJlZm9yZVNlcmlhbGl6ZSAmJiBvcHRpb25zLmJlZm9yZVNlcmlhbGl6ZSh0aGlzLCBvcHRpb25zKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgbG9nKCdhamF4U3VibWl0OiBzdWJtaXQgYWJvcnRlZCB2aWEgYmVmb3JlU2VyaWFsaXplIGNhbGxiYWNrJyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHZhciB0cmFkaXRpb25hbCA9IG9wdGlvbnMudHJhZGl0aW9uYWw7XG4gICAgaWYgKCB0cmFkaXRpb25hbCA9PT0gdW5kZWZpbmVkICkge1xuICAgICAgICB0cmFkaXRpb25hbCA9ICQuYWpheFNldHRpbmdzLnRyYWRpdGlvbmFsO1xuICAgIH1cblxuICAgIHZhciBlbGVtZW50cyA9IFtdO1xuICAgIHZhciBxeCwgYSA9IHRoaXMuZm9ybVRvQXJyYXkob3B0aW9ucy5zZW1hbnRpYywgZWxlbWVudHMpO1xuICAgIGlmIChvcHRpb25zLmRhdGEpIHtcbiAgICAgICAgb3B0aW9ucy5leHRyYURhdGEgPSBvcHRpb25zLmRhdGE7XG4gICAgICAgIHF4ID0gJC5wYXJhbShvcHRpb25zLmRhdGEsIHRyYWRpdGlvbmFsKTtcbiAgICB9XG5cbiAgICAvLyBnaXZlIHByZS1zdWJtaXQgY2FsbGJhY2sgYW4gb3Bwb3J0dW5pdHkgdG8gYWJvcnQgdGhlIHN1Ym1pdFxuICAgIGlmIChvcHRpb25zLmJlZm9yZVN1Ym1pdCAmJiBvcHRpb25zLmJlZm9yZVN1Ym1pdChhLCB0aGlzLCBvcHRpb25zKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgbG9nKCdhamF4U3VibWl0OiBzdWJtaXQgYWJvcnRlZCB2aWEgYmVmb3JlU3VibWl0IGNhbGxiYWNrJyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8vIGZpcmUgdmV0b2FibGUgJ3ZhbGlkYXRlJyBldmVudFxuICAgIHRoaXMudHJpZ2dlcignZm9ybS1zdWJtaXQtdmFsaWRhdGUnLCBbYSwgdGhpcywgb3B0aW9ucywgdmV0b10pO1xuICAgIGlmICh2ZXRvLnZldG8pIHtcbiAgICAgICAgbG9nKCdhamF4U3VibWl0OiBzdWJtaXQgdmV0b2VkIHZpYSBmb3JtLXN1Ym1pdC12YWxpZGF0ZSB0cmlnZ2VyJyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHZhciBxID0gJC5wYXJhbShhLCB0cmFkaXRpb25hbCk7XG4gICAgaWYgKHF4KSB7XG4gICAgICAgIHEgPSAoIHEgPyAocSArICcmJyArIHF4KSA6IHF4ICk7XG4gICAgfVxuICAgIGlmIChvcHRpb25zLnR5cGUudG9VcHBlckNhc2UoKSA9PSAnR0VUJykge1xuICAgICAgICBvcHRpb25zLnVybCArPSAob3B0aW9ucy51cmwuaW5kZXhPZignPycpID49IDAgPyAnJicgOiAnPycpICsgcTtcbiAgICAgICAgb3B0aW9ucy5kYXRhID0gbnVsbDsgIC8vIGRhdGEgaXMgbnVsbCBmb3IgJ2dldCdcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIG9wdGlvbnMuZGF0YSA9IHE7IC8vIGRhdGEgaXMgdGhlIHF1ZXJ5IHN0cmluZyBmb3IgJ3Bvc3QnXG4gICAgfVxuXG4gICAgdmFyIGNhbGxiYWNrcyA9IFtdO1xuICAgIGlmIChvcHRpb25zLnJlc2V0Rm9ybSkge1xuICAgICAgICBjYWxsYmFja3MucHVzaChmdW5jdGlvbigpIHsgJGZvcm0ucmVzZXRGb3JtKCk7IH0pO1xuICAgIH1cbiAgICBpZiAob3B0aW9ucy5jbGVhckZvcm0pIHtcbiAgICAgICAgY2FsbGJhY2tzLnB1c2goZnVuY3Rpb24oKSB7ICRmb3JtLmNsZWFyRm9ybShvcHRpb25zLmluY2x1ZGVIaWRkZW4pOyB9KTtcbiAgICB9XG5cbiAgICAvLyBwZXJmb3JtIGEgbG9hZCBvbiB0aGUgdGFyZ2V0IG9ubHkgaWYgZGF0YVR5cGUgaXMgbm90IHByb3ZpZGVkXG4gICAgaWYgKCFvcHRpb25zLmRhdGFUeXBlICYmIG9wdGlvbnMudGFyZ2V0KSB7XG4gICAgICAgIHZhciBvbGRTdWNjZXNzID0gb3B0aW9ucy5zdWNjZXNzIHx8IGZ1bmN0aW9uKCl7fTtcbiAgICAgICAgY2FsbGJhY2tzLnB1c2goZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgdmFyIGZuID0gb3B0aW9ucy5yZXBsYWNlVGFyZ2V0ID8gJ3JlcGxhY2VXaXRoJyA6ICdodG1sJztcbiAgICAgICAgICAgICQob3B0aW9ucy50YXJnZXQpW2ZuXShkYXRhKS5lYWNoKG9sZFN1Y2Nlc3MsIGFyZ3VtZW50cyk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIGlmIChvcHRpb25zLnN1Y2Nlc3MpIHtcbiAgICAgICAgY2FsbGJhY2tzLnB1c2gob3B0aW9ucy5zdWNjZXNzKTtcbiAgICB9XG5cbiAgICBvcHRpb25zLnN1Y2Nlc3MgPSBmdW5jdGlvbihkYXRhLCBzdGF0dXMsIHhocikgeyAvLyBqUXVlcnkgMS40KyBwYXNzZXMgeGhyIGFzIDNyZCBhcmdcbiAgICAgICAgdmFyIGNvbnRleHQgPSBvcHRpb25zLmNvbnRleHQgfHwgdGhpcyA7ICAgIC8vIGpRdWVyeSAxLjQrIHN1cHBvcnRzIHNjb3BlIGNvbnRleHRcbiAgICAgICAgZm9yICh2YXIgaT0wLCBtYXg9Y2FsbGJhY2tzLmxlbmd0aDsgaSA8IG1heDsgaSsrKSB7XG4gICAgICAgICAgICBjYWxsYmFja3NbaV0uYXBwbHkoY29udGV4dCwgW2RhdGEsIHN0YXR1cywgeGhyIHx8ICRmb3JtLCAkZm9ybV0pO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGlmIChvcHRpb25zLmVycm9yKSB7XG4gICAgICAgIHZhciBvbGRFcnJvciA9IG9wdGlvbnMuZXJyb3I7XG4gICAgICAgIG9wdGlvbnMuZXJyb3IgPSBmdW5jdGlvbih4aHIsIHN0YXR1cywgZXJyb3IpIHtcbiAgICAgICAgICAgIHZhciBjb250ZXh0ID0gb3B0aW9ucy5jb250ZXh0IHx8IHRoaXM7XG4gICAgICAgICAgICBvbGRFcnJvci5hcHBseShjb250ZXh0LCBbeGhyLCBzdGF0dXMsIGVycm9yLCAkZm9ybV0pO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgICBpZiAob3B0aW9ucy5jb21wbGV0ZSkge1xuICAgICAgICB2YXIgb2xkQ29tcGxldGUgPSBvcHRpb25zLmNvbXBsZXRlO1xuICAgICAgICBvcHRpb25zLmNvbXBsZXRlID0gZnVuY3Rpb24oeGhyLCBzdGF0dXMpIHtcbiAgICAgICAgICAgIHZhciBjb250ZXh0ID0gb3B0aW9ucy5jb250ZXh0IHx8IHRoaXM7XG4gICAgICAgICAgICBvbGRDb21wbGV0ZS5hcHBseShjb250ZXh0LCBbeGhyLCBzdGF0dXMsICRmb3JtXSk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gYXJlIHRoZXJlIGZpbGVzIHRvIHVwbG9hZD9cblxuICAgIC8vIFt2YWx1ZV0gKGlzc3VlICMxMTMpLCBhbHNvIHNlZSBjb21tZW50OlxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9tYWxzdXAvZm9ybS9jb21taXQvNTg4MzA2YWVkYmExZGUwMTM4ODAzMmQ1ZjQyYTYwMTU5ZWVhOTIyOCNjb21taXRjb21tZW50LTIxODAyMTlcbiAgICB2YXIgZmlsZUlucHV0cyA9ICQoJ2lucHV0W3R5cGU9ZmlsZV06ZW5hYmxlZCcsIHRoaXMpLmZpbHRlcihmdW5jdGlvbigpIHsgcmV0dXJuICQodGhpcykudmFsKCkgIT09ICcnOyB9KTtcblxuICAgIHZhciBoYXNGaWxlSW5wdXRzID0gZmlsZUlucHV0cy5sZW5ndGggPiAwO1xuICAgIHZhciBtcCA9ICdtdWx0aXBhcnQvZm9ybS1kYXRhJztcbiAgICB2YXIgbXVsdGlwYXJ0ID0gKCRmb3JtLmF0dHIoJ2VuY3R5cGUnKSA9PSBtcCB8fCAkZm9ybS5hdHRyKCdlbmNvZGluZycpID09IG1wKTtcblxuICAgIHZhciBmaWxlQVBJID0gZmVhdHVyZS5maWxlYXBpICYmIGZlYXR1cmUuZm9ybWRhdGE7XG4gICAgbG9nKFwiZmlsZUFQSSA6XCIgKyBmaWxlQVBJKTtcbiAgICB2YXIgc2hvdWxkVXNlRnJhbWUgPSAoaGFzRmlsZUlucHV0cyB8fCBtdWx0aXBhcnQpICYmICFmaWxlQVBJO1xuXG4gICAgdmFyIGpxeGhyO1xuXG4gICAgLy8gb3B0aW9ucy5pZnJhbWUgYWxsb3dzIHVzZXIgdG8gZm9yY2UgaWZyYW1lIG1vZGVcbiAgICAvLyAwNi1OT1YtMDk6IG5vdyBkZWZhdWx0aW5nIHRvIGlmcmFtZSBtb2RlIGlmIGZpbGUgaW5wdXQgaXMgZGV0ZWN0ZWRcbiAgICBpZiAob3B0aW9ucy5pZnJhbWUgIT09IGZhbHNlICYmIChvcHRpb25zLmlmcmFtZSB8fCBzaG91bGRVc2VGcmFtZSkpIHtcbiAgICAgICAgLy8gaGFjayB0byBmaXggU2FmYXJpIGhhbmcgKHRoYW5rcyB0byBUaW0gTW9sZW5kaWprIGZvciB0aGlzKVxuICAgICAgICAvLyBzZWU6ICBodHRwOi8vZ3JvdXBzLmdvb2dsZS5jb20vZ3JvdXAvanF1ZXJ5LWRldi9icm93c2VfdGhyZWFkL3RocmVhZC8zNjM5NWI3YWI1MTBkZDVkXG4gICAgICAgIGlmIChvcHRpb25zLmNsb3NlS2VlcEFsaXZlKSB7XG4gICAgICAgICAgICAkLmdldChvcHRpb25zLmNsb3NlS2VlcEFsaXZlLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBqcXhociA9IGZpbGVVcGxvYWRJZnJhbWUoYSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGpxeGhyID0gZmlsZVVwbG9hZElmcmFtZShhKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmICgoaGFzRmlsZUlucHV0cyB8fCBtdWx0aXBhcnQpICYmIGZpbGVBUEkpIHtcbiAgICAgICAganF4aHIgPSBmaWxlVXBsb2FkWGhyKGEpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAganF4aHIgPSAkLmFqYXgob3B0aW9ucyk7XG4gICAgfVxuXG4gICAgJGZvcm0ucmVtb3ZlRGF0YSgnanF4aHInKS5kYXRhKCdqcXhocicsIGpxeGhyKTtcblxuICAgIC8vIGNsZWFyIGVsZW1lbnQgYXJyYXlcbiAgICBmb3IgKHZhciBrPTA7IGsgPCBlbGVtZW50cy5sZW5ndGg7IGsrKykge1xuICAgICAgICBlbGVtZW50c1trXSA9IG51bGw7XG4gICAgfVxuXG4gICAgLy8gZmlyZSAnbm90aWZ5JyBldmVudFxuICAgIHRoaXMudHJpZ2dlcignZm9ybS1zdWJtaXQtbm90aWZ5JywgW3RoaXMsIG9wdGlvbnNdKTtcbiAgICByZXR1cm4gdGhpcztcblxuICAgIC8vIHV0aWxpdHkgZm4gZm9yIGRlZXAgc2VyaWFsaXphdGlvblxuICAgIGZ1bmN0aW9uIGRlZXBTZXJpYWxpemUoZXh0cmFEYXRhKXtcbiAgICAgICAgdmFyIHNlcmlhbGl6ZWQgPSAkLnBhcmFtKGV4dHJhRGF0YSwgb3B0aW9ucy50cmFkaXRpb25hbCkuc3BsaXQoJyYnKTtcbiAgICAgICAgdmFyIGxlbiA9IHNlcmlhbGl6ZWQubGVuZ3RoO1xuICAgICAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgICAgIHZhciBpLCBwYXJ0O1xuICAgICAgICBmb3IgKGk9MDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAvLyAjMjUyOyB1bmRvIHBhcmFtIHNwYWNlIHJlcGxhY2VtZW50XG4gICAgICAgICAgICBzZXJpYWxpemVkW2ldID0gc2VyaWFsaXplZFtpXS5yZXBsYWNlKC9cXCsvZywnICcpO1xuICAgICAgICAgICAgcGFydCA9IHNlcmlhbGl6ZWRbaV0uc3BsaXQoJz0nKTtcbiAgICAgICAgICAgIC8vICMyNzg7IHVzZSBhcnJheSBpbnN0ZWFkIG9mIG9iamVjdCBzdG9yYWdlLCBmYXZvcmluZyBhcnJheSBzZXJpYWxpemF0aW9uc1xuICAgICAgICAgICAgcmVzdWx0LnB1c2goW2RlY29kZVVSSUNvbXBvbmVudChwYXJ0WzBdKSwgZGVjb2RlVVJJQ29tcG9uZW50KHBhcnRbMV0pXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAgLy8gWE1MSHR0cFJlcXVlc3QgTGV2ZWwgMiBmaWxlIHVwbG9hZHMgKGJpZyBoYXQgdGlwIHRvIGZyYW5jb2lzMm1ldHopXG4gICAgZnVuY3Rpb24gZmlsZVVwbG9hZFhocihhKSB7XG4gICAgICAgIHZhciBmb3JtZGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xuXG4gICAgICAgIGZvciAodmFyIGk9MDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGZvcm1kYXRhLmFwcGVuZChhW2ldLm5hbWUsIGFbaV0udmFsdWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG9wdGlvbnMuZXh0cmFEYXRhKSB7XG4gICAgICAgICAgICB2YXIgc2VyaWFsaXplZERhdGEgPSBkZWVwU2VyaWFsaXplKG9wdGlvbnMuZXh0cmFEYXRhKTtcbiAgICAgICAgICAgIGZvciAoaT0wOyBpIDwgc2VyaWFsaXplZERhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoc2VyaWFsaXplZERhdGFbaV0pIHtcbiAgICAgICAgICAgICAgICAgICAgZm9ybWRhdGEuYXBwZW5kKHNlcmlhbGl6ZWREYXRhW2ldWzBdLCBzZXJpYWxpemVkRGF0YVtpXVsxXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgb3B0aW9ucy5kYXRhID0gbnVsbDtcblxuICAgICAgICB2YXIgcyA9ICQuZXh0ZW5kKHRydWUsIHt9LCAkLmFqYXhTZXR0aW5ncywgb3B0aW9ucywge1xuICAgICAgICAgICAgY29udGVudFR5cGU6IGZhbHNlLFxuICAgICAgICAgICAgcHJvY2Vzc0RhdGE6IGZhbHNlLFxuICAgICAgICAgICAgY2FjaGU6IGZhbHNlLFxuICAgICAgICAgICAgdHlwZTogbWV0aG9kIHx8ICdQT1NUJ1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAob3B0aW9ucy51cGxvYWRQcm9ncmVzcykge1xuICAgICAgICAgICAgLy8gd29ya2Fyb3VuZCBiZWNhdXNlIGpxWEhSIGRvZXMgbm90IGV4cG9zZSB1cGxvYWQgcHJvcGVydHlcbiAgICAgICAgICAgIHMueGhyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIHhociA9ICQuYWpheFNldHRpbmdzLnhocigpO1xuICAgICAgICAgICAgICAgIGlmICh4aHIudXBsb2FkKSB7XG4gICAgICAgICAgICAgICAgICAgIHhoci51cGxvYWQuYWRkRXZlbnRMaXN0ZW5lcigncHJvZ3Jlc3MnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHBlcmNlbnQgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHBvc2l0aW9uID0gZXZlbnQubG9hZGVkIHx8IGV2ZW50LnBvc2l0aW9uOyAvKmV2ZW50LnBvc2l0aW9uIGlzIGRlcHJlY2F0ZWQqL1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRvdGFsID0gZXZlbnQudG90YWw7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXZlbnQubGVuZ3RoQ29tcHV0YWJsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlcmNlbnQgPSBNYXRoLmNlaWwocG9zaXRpb24gLyB0b3RhbCAqIDEwMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zLnVwbG9hZFByb2dyZXNzKGV2ZW50LCBwb3NpdGlvbiwgdG90YWwsIHBlcmNlbnQpO1xuICAgICAgICAgICAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB4aHI7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcy5kYXRhID0gbnVsbDtcbiAgICAgICAgdmFyIGJlZm9yZVNlbmQgPSBzLmJlZm9yZVNlbmQ7XG4gICAgICAgIHMuYmVmb3JlU2VuZCA9IGZ1bmN0aW9uKHhociwgbykge1xuICAgICAgICAgICAgLy9TZW5kIEZvcm1EYXRhKCkgcHJvdmlkZWQgYnkgdXNlclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuZm9ybURhdGEpIHtcbiAgICAgICAgICAgICAgICBvLmRhdGEgPSBvcHRpb25zLmZvcm1EYXRhO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgby5kYXRhID0gZm9ybWRhdGE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihiZWZvcmVTZW5kKSB7XG4gICAgICAgICAgICAgICAgYmVmb3JlU2VuZC5jYWxsKHRoaXMsIHhociwgbyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiAkLmFqYXgocyk7XG4gICAgfVxuXG4gICAgLy8gcHJpdmF0ZSBmdW5jdGlvbiBmb3IgaGFuZGxpbmcgZmlsZSB1cGxvYWRzIChoYXQgdGlwIHRvIFlBSE9PISlcbiAgICBmdW5jdGlvbiBmaWxlVXBsb2FkSWZyYW1lKGEpIHtcbiAgICAgICAgdmFyIGZvcm0gPSAkZm9ybVswXSwgZWwsIGksIHMsIGcsIGlkLCAkaW8sIGlvLCB4aHIsIHN1YiwgbiwgdGltZWRPdXQsIHRpbWVvdXRIYW5kbGU7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9ICQuRGVmZXJyZWQoKTtcblxuICAgICAgICAvLyAjMzQxXG4gICAgICAgIGRlZmVycmVkLmFib3J0ID0gZnVuY3Rpb24oc3RhdHVzKSB7XG4gICAgICAgICAgICB4aHIuYWJvcnQoc3RhdHVzKTtcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoYSkge1xuICAgICAgICAgICAgLy8gZW5zdXJlIHRoYXQgZXZlcnkgc2VyaWFsaXplZCBpbnB1dCBpcyBzdGlsbCBlbmFibGVkXG4gICAgICAgICAgICBmb3IgKGk9MDsgaSA8IGVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgZWwgPSAkKGVsZW1lbnRzW2ldKTtcbiAgICAgICAgICAgICAgICBpZiAoIGhhc1Byb3AgKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsLnByb3AoJ2Rpc2FibGVkJywgZmFsc2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZWwucmVtb3ZlQXR0cignZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBzID0gJC5leHRlbmQodHJ1ZSwge30sICQuYWpheFNldHRpbmdzLCBvcHRpb25zKTtcbiAgICAgICAgcy5jb250ZXh0ID0gcy5jb250ZXh0IHx8IHM7XG4gICAgICAgIGlkID0gJ2pxRm9ybUlPJyArIChuZXcgRGF0ZSgpLmdldFRpbWUoKSk7XG4gICAgICAgIGlmIChzLmlmcmFtZVRhcmdldCkge1xuICAgICAgICAgICAgJGlvID0gJChzLmlmcmFtZVRhcmdldCk7XG4gICAgICAgICAgICBuID0gJGlvLmF0dHIyKCduYW1lJyk7XG4gICAgICAgICAgICBpZiAoIW4pIHtcbiAgICAgICAgICAgICAgICAkaW8uYXR0cjIoJ25hbWUnLCBpZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZCA9IG47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAkaW8gPSAkKCc8aWZyYW1lIG5hbWU9XCInICsgaWQgKyAnXCIgc3JjPVwiJysgcy5pZnJhbWVTcmMgKydcIiAvPicpO1xuICAgICAgICAgICAgJGlvLmNzcyh7IHBvc2l0aW9uOiAnYWJzb2x1dGUnLCB0b3A6ICctMTAwMHB4JywgbGVmdDogJy0xMDAwcHgnIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlvID0gJGlvWzBdO1xuXG5cbiAgICAgICAgeGhyID0geyAvLyBtb2NrIG9iamVjdFxuICAgICAgICAgICAgYWJvcnRlZDogMCxcbiAgICAgICAgICAgIHJlc3BvbnNlVGV4dDogbnVsbCxcbiAgICAgICAgICAgIHJlc3BvbnNlWE1MOiBudWxsLFxuICAgICAgICAgICAgc3RhdHVzOiAwLFxuICAgICAgICAgICAgc3RhdHVzVGV4dDogJ24vYScsXG4gICAgICAgICAgICBnZXRBbGxSZXNwb25zZUhlYWRlcnM6IGZ1bmN0aW9uKCkge30sXG4gICAgICAgICAgICBnZXRSZXNwb25zZUhlYWRlcjogZnVuY3Rpb24oKSB7fSxcbiAgICAgICAgICAgIHNldFJlcXVlc3RIZWFkZXI6IGZ1bmN0aW9uKCkge30sXG4gICAgICAgICAgICBhYm9ydDogZnVuY3Rpb24oc3RhdHVzKSB7XG4gICAgICAgICAgICAgICAgdmFyIGUgPSAoc3RhdHVzID09PSAndGltZW91dCcgPyAndGltZW91dCcgOiAnYWJvcnRlZCcpO1xuICAgICAgICAgICAgICAgIGxvZygnYWJvcnRpbmcgdXBsb2FkLi4uICcgKyBlKTtcbiAgICAgICAgICAgICAgICB0aGlzLmFib3J0ZWQgPSAxO1xuXG4gICAgICAgICAgICAgICAgdHJ5IHsgLy8gIzIxNCwgIzI1N1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW8uY29udGVudFdpbmRvdy5kb2N1bWVudC5leGVjQ29tbWFuZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW8uY29udGVudFdpbmRvdy5kb2N1bWVudC5leGVjQ29tbWFuZCgnU3RvcCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoKGlnbm9yZSkge31cblxuICAgICAgICAgICAgICAgICRpby5hdHRyKCdzcmMnLCBzLmlmcmFtZVNyYyk7IC8vIGFib3J0IG9wIGluIHByb2dyZXNzXG4gICAgICAgICAgICAgICAgeGhyLmVycm9yID0gZTtcbiAgICAgICAgICAgICAgICBpZiAocy5lcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBzLmVycm9yLmNhbGwocy5jb250ZXh0LCB4aHIsIGUsIHN0YXR1cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChnKSB7XG4gICAgICAgICAgICAgICAgICAgICQuZXZlbnQudHJpZ2dlcihcImFqYXhFcnJvclwiLCBbeGhyLCBzLCBlXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChzLmNvbXBsZXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIHMuY29tcGxldGUuY2FsbChzLmNvbnRleHQsIHhociwgZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGcgPSBzLmdsb2JhbDtcbiAgICAgICAgLy8gdHJpZ2dlciBhamF4IGdsb2JhbCBldmVudHMgc28gdGhhdCBhY3Rpdml0eS9ibG9jayBpbmRpY2F0b3JzIHdvcmsgbGlrZSBub3JtYWxcbiAgICAgICAgaWYgKGcgJiYgMCA9PT0gJC5hY3RpdmUrKykge1xuICAgICAgICAgICAgJC5ldmVudC50cmlnZ2VyKFwiYWpheFN0YXJ0XCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChnKSB7XG4gICAgICAgICAgICAkLmV2ZW50LnRyaWdnZXIoXCJhamF4U2VuZFwiLCBbeGhyLCBzXSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocy5iZWZvcmVTZW5kICYmIHMuYmVmb3JlU2VuZC5jYWxsKHMuY29udGV4dCwgeGhyLCBzKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIGlmIChzLmdsb2JhbCkge1xuICAgICAgICAgICAgICAgICQuYWN0aXZlLS07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoKTtcbiAgICAgICAgICAgIHJldHVybiBkZWZlcnJlZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoeGhyLmFib3J0ZWQpIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdCgpO1xuICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gYWRkIHN1Ym1pdHRpbmcgZWxlbWVudCB0byBkYXRhIGlmIHdlIGtub3cgaXRcbiAgICAgICAgc3ViID0gZm9ybS5jbGs7XG4gICAgICAgIGlmIChzdWIpIHtcbiAgICAgICAgICAgIG4gPSBzdWIubmFtZTtcbiAgICAgICAgICAgIGlmIChuICYmICFzdWIuZGlzYWJsZWQpIHtcbiAgICAgICAgICAgICAgICBzLmV4dHJhRGF0YSA9IHMuZXh0cmFEYXRhIHx8IHt9O1xuICAgICAgICAgICAgICAgIHMuZXh0cmFEYXRhW25dID0gc3ViLnZhbHVlO1xuICAgICAgICAgICAgICAgIGlmIChzdWIudHlwZSA9PSBcImltYWdlXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcy5leHRyYURhdGFbbisnLngnXSA9IGZvcm0uY2xrX3g7XG4gICAgICAgICAgICAgICAgICAgIHMuZXh0cmFEYXRhW24rJy55J10gPSBmb3JtLmNsa195O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBDTElFTlRfVElNRU9VVF9BQk9SVCA9IDE7XG4gICAgICAgIHZhciBTRVJWRVJfQUJPUlQgPSAyO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICBmdW5jdGlvbiBnZXREb2MoZnJhbWUpIHtcbiAgICAgICAgICAgIC8qIGl0IGxvb2tzIGxpa2UgY29udGVudFdpbmRvdyBvciBjb250ZW50RG9jdW1lbnQgZG8gbm90XG4gICAgICAgICAgICAgKiBjYXJyeSB0aGUgcHJvdG9jb2wgcHJvcGVydHkgaW4gaWU4LCB3aGVuIHJ1bm5pbmcgdW5kZXIgc3NsXG4gICAgICAgICAgICAgKiBmcmFtZS5kb2N1bWVudCBpcyB0aGUgb25seSB2YWxpZCByZXNwb25zZSBkb2N1bWVudCwgc2luY2VcbiAgICAgICAgICAgICAqIHRoZSBwcm90b2NvbCBpcyBrbm93IGJ1dCBub3Qgb24gdGhlIG90aGVyIHR3byBvYmplY3RzLiBzdHJhbmdlP1xuICAgICAgICAgICAgICogXCJTYW1lIG9yaWdpbiBwb2xpY3lcIiBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1NhbWVfb3JpZ2luX3BvbGljeVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBkb2MgPSBudWxsO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBJRTggY2FzY2FkaW5nIGFjY2VzcyBjaGVja1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAoZnJhbWUuY29udGVudFdpbmRvdykge1xuICAgICAgICAgICAgICAgICAgICBkb2MgPSBmcmFtZS5jb250ZW50V2luZG93LmRvY3VtZW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2goZXJyKSB7XG4gICAgICAgICAgICAgICAgLy8gSUU4IGFjY2VzcyBkZW5pZWQgdW5kZXIgc3NsICYgbWlzc2luZyBwcm90b2NvbFxuICAgICAgICAgICAgICAgIGxvZygnY2Fubm90IGdldCBpZnJhbWUuY29udGVudFdpbmRvdyBkb2N1bWVudDogJyArIGVycik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChkb2MpIHsgLy8gc3VjY2Vzc2Z1bCBnZXR0aW5nIGNvbnRlbnRcbiAgICAgICAgICAgICAgICByZXR1cm4gZG9jO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0cnkgeyAvLyBzaW1wbHkgY2hlY2tpbmcgbWF5IHRocm93IGluIGllOCB1bmRlciBzc2wgb3IgbWlzbWF0Y2hlZCBwcm90b2NvbFxuICAgICAgICAgICAgICAgIGRvYyA9IGZyYW1lLmNvbnRlbnREb2N1bWVudCA/IGZyYW1lLmNvbnRlbnREb2N1bWVudCA6IGZyYW1lLmRvY3VtZW50O1xuICAgICAgICAgICAgfSBjYXRjaChlcnIpIHtcbiAgICAgICAgICAgICAgICAvLyBsYXN0IGF0dGVtcHRcbiAgICAgICAgICAgICAgICBsb2coJ2Nhbm5vdCBnZXQgaWZyYW1lLmNvbnRlbnREb2N1bWVudDogJyArIGVycik7XG4gICAgICAgICAgICAgICAgZG9jID0gZnJhbWUuZG9jdW1lbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZG9jO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmFpbHMgQ1NSRiBoYWNrICh0aGFua3MgdG8gWXZhbiBCYXJ0aGVsZW15KVxuICAgICAgICB2YXIgY3NyZl90b2tlbiA9ICQoJ21ldGFbbmFtZT1jc3JmLXRva2VuXScpLmF0dHIoJ2NvbnRlbnQnKTtcbiAgICAgICAgdmFyIGNzcmZfcGFyYW0gPSAkKCdtZXRhW25hbWU9Y3NyZi1wYXJhbV0nKS5hdHRyKCdjb250ZW50Jyk7XG4gICAgICAgIGlmIChjc3JmX3BhcmFtICYmIGNzcmZfdG9rZW4pIHtcbiAgICAgICAgICAgIHMuZXh0cmFEYXRhID0gcy5leHRyYURhdGEgfHwge307XG4gICAgICAgICAgICBzLmV4dHJhRGF0YVtjc3JmX3BhcmFtXSA9IGNzcmZfdG9rZW47XG4gICAgICAgIH1cblxuICAgICAgICAvLyB0YWtlIGEgYnJlYXRoIHNvIHRoYXQgcGVuZGluZyByZXBhaW50cyBnZXQgc29tZSBjcHUgdGltZSBiZWZvcmUgdGhlIHVwbG9hZCBzdGFydHNcbiAgICAgICAgZnVuY3Rpb24gZG9TdWJtaXQoKSB7XG4gICAgICAgICAgICAvLyBtYWtlIHN1cmUgZm9ybSBhdHRycyBhcmUgc2V0XG4gICAgICAgICAgICB2YXIgdCA9ICRmb3JtLmF0dHIyKCd0YXJnZXQnKSwgXG4gICAgICAgICAgICAgICAgYSA9ICRmb3JtLmF0dHIyKCdhY3Rpb24nKSwgXG4gICAgICAgICAgICAgICAgbXAgPSAnbXVsdGlwYXJ0L2Zvcm0tZGF0YScsXG4gICAgICAgICAgICAgICAgZXQgPSAkZm9ybS5hdHRyKCdlbmN0eXBlJykgfHwgJGZvcm0uYXR0cignZW5jb2RpbmcnKSB8fCBtcDtcblxuICAgICAgICAgICAgLy8gdXBkYXRlIGZvcm0gYXR0cnMgaW4gSUUgZnJpZW5kbHkgd2F5XG4gICAgICAgICAgICBmb3JtLnNldEF0dHJpYnV0ZSgndGFyZ2V0JyxpZCk7XG4gICAgICAgICAgICBpZiAoIW1ldGhvZCB8fCAvcG9zdC9pLnRlc3QobWV0aG9kKSApIHtcbiAgICAgICAgICAgICAgICBmb3JtLnNldEF0dHJpYnV0ZSgnbWV0aG9kJywgJ1BPU1QnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhICE9IHMudXJsKSB7XG4gICAgICAgICAgICAgICAgZm9ybS5zZXRBdHRyaWJ1dGUoJ2FjdGlvbicsIHMudXJsKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gaWUgYm9ya3MgaW4gc29tZSBjYXNlcyB3aGVuIHNldHRpbmcgZW5jb2RpbmdcbiAgICAgICAgICAgIGlmICghIHMuc2tpcEVuY29kaW5nT3ZlcnJpZGUgJiYgKCFtZXRob2QgfHwgL3Bvc3QvaS50ZXN0KG1ldGhvZCkpKSB7XG4gICAgICAgICAgICAgICAgJGZvcm0uYXR0cih7XG4gICAgICAgICAgICAgICAgICAgIGVuY29kaW5nOiAnbXVsdGlwYXJ0L2Zvcm0tZGF0YScsXG4gICAgICAgICAgICAgICAgICAgIGVuY3R5cGU6ICAnbXVsdGlwYXJ0L2Zvcm0tZGF0YSdcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gc3VwcG9ydCB0aW1vdXRcbiAgICAgICAgICAgIGlmIChzLnRpbWVvdXQpIHtcbiAgICAgICAgICAgICAgICB0aW1lb3V0SGFuZGxlID0gc2V0VGltZW91dChmdW5jdGlvbigpIHsgdGltZWRPdXQgPSB0cnVlOyBjYihDTElFTlRfVElNRU9VVF9BQk9SVCk7IH0sIHMudGltZW91dCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGxvb2sgZm9yIHNlcnZlciBhYm9ydHNcbiAgICAgICAgICAgIGZ1bmN0aW9uIGNoZWNrU3RhdGUoKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN0YXRlID0gZ2V0RG9jKGlvKS5yZWFkeVN0YXRlO1xuICAgICAgICAgICAgICAgICAgICBsb2coJ3N0YXRlID0gJyArIHN0YXRlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXRlICYmIHN0YXRlLnRvTG93ZXJDYXNlKCkgPT0gJ3VuaW5pdGlhbGl6ZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGNoZWNrU3RhdGUsNTApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9nKCdTZXJ2ZXIgYWJvcnQ6ICcgLCBlLCAnICgnLCBlLm5hbWUsICcpJyk7XG4gICAgICAgICAgICAgICAgICAgIGNiKFNFUlZFUl9BQk9SVCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aW1lb3V0SGFuZGxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dEhhbmRsZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGltZW91dEhhbmRsZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGFkZCBcImV4dHJhXCIgZGF0YSB0byBmb3JtIGlmIHByb3ZpZGVkIGluIG9wdGlvbnNcbiAgICAgICAgICAgIHZhciBleHRyYUlucHV0cyA9IFtdO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAocy5leHRyYURhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgbiBpbiBzLmV4dHJhRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHMuZXh0cmFEYXRhLmhhc093blByb3BlcnR5KG4pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiB1c2luZyB0aGUgJC5wYXJhbSBmb3JtYXQgdGhhdCBhbGxvd3MgZm9yIG11bHRpcGxlIHZhbHVlcyB3aXRoIHRoZSBzYW1lIG5hbWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKCQuaXNQbGFpbk9iamVjdChzLmV4dHJhRGF0YVtuXSkgJiYgcy5leHRyYURhdGFbbl0uaGFzT3duUHJvcGVydHkoJ25hbWUnKSAmJiBzLmV4dHJhRGF0YVtuXS5oYXNPd25Qcm9wZXJ0eSgndmFsdWUnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhSW5wdXRzLnB1c2goXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJCgnPGlucHV0IHR5cGU9XCJoaWRkZW5cIiBuYW1lPVwiJytzLmV4dHJhRGF0YVtuXS5uYW1lKydcIj4nKS52YWwocy5leHRyYURhdGFbbl0udmFsdWUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hcHBlbmRUbyhmb3JtKVswXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhSW5wdXRzLnB1c2goXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJCgnPGlucHV0IHR5cGU9XCJoaWRkZW5cIiBuYW1lPVwiJytuKydcIj4nKS52YWwocy5leHRyYURhdGFbbl0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hcHBlbmRUbyhmb3JtKVswXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoIXMuaWZyYW1lVGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGFkZCBpZnJhbWUgdG8gZG9jIGFuZCBzdWJtaXQgdGhlIGZvcm1cbiAgICAgICAgICAgICAgICAgICAgJGlvLmFwcGVuZFRvKCdib2R5Jyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChpby5hdHRhY2hFdmVudCkge1xuICAgICAgICAgICAgICAgICAgICBpby5hdHRhY2hFdmVudCgnb25sb2FkJywgY2IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaW8uYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGNiLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoY2hlY2tTdGF0ZSwxNSk7XG5cbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBmb3JtLnN1Ym1pdCgpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2goZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGp1c3QgaW4gY2FzZSBmb3JtIGhhcyBlbGVtZW50IHdpdGggbmFtZS9pZCBvZiAnc3VibWl0J1xuICAgICAgICAgICAgICAgICAgICB2YXIgc3VibWl0Rm4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdmb3JtJykuc3VibWl0O1xuICAgICAgICAgICAgICAgICAgICBzdWJtaXRGbi5hcHBseShmb3JtKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICAvLyByZXNldCBhdHRycyBhbmQgcmVtb3ZlIFwiZXh0cmFcIiBpbnB1dCBlbGVtZW50c1xuICAgICAgICAgICAgICAgIGZvcm0uc2V0QXR0cmlidXRlKCdhY3Rpb24nLGEpO1xuICAgICAgICAgICAgICAgIGZvcm0uc2V0QXR0cmlidXRlKCdlbmN0eXBlJywgZXQpOyAvLyAjMzgwXG4gICAgICAgICAgICAgICAgaWYodCkge1xuICAgICAgICAgICAgICAgICAgICBmb3JtLnNldEF0dHJpYnV0ZSgndGFyZ2V0JywgdCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgJGZvcm0ucmVtb3ZlQXR0cigndGFyZ2V0Jyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICQoZXh0cmFJbnB1dHMpLnJlbW92ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHMuZm9yY2VTeW5jKSB7XG4gICAgICAgICAgICBkb1N1Ym1pdCgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgc2V0VGltZW91dChkb1N1Ym1pdCwgMTApOyAvLyB0aGlzIGxldHMgZG9tIHVwZGF0ZXMgcmVuZGVyXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZGF0YSwgZG9jLCBkb21DaGVja0NvdW50ID0gNTAsIGNhbGxiYWNrUHJvY2Vzc2VkO1xuXG4gICAgICAgIGZ1bmN0aW9uIGNiKGUpIHtcbiAgICAgICAgICAgIGlmICh4aHIuYWJvcnRlZCB8fCBjYWxsYmFja1Byb2Nlc3NlZCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZG9jID0gZ2V0RG9jKGlvKTtcbiAgICAgICAgICAgIGlmKCFkb2MpIHtcbiAgICAgICAgICAgICAgICBsb2coJ2Nhbm5vdCBhY2Nlc3MgcmVzcG9uc2UgZG9jdW1lbnQnKTtcbiAgICAgICAgICAgICAgICBlID0gU0VSVkVSX0FCT1JUO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGUgPT09IENMSUVOVF9USU1FT1VUX0FCT1JUICYmIHhocikge1xuICAgICAgICAgICAgICAgIHhoci5hYm9ydCgndGltZW91dCcpO1xuICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdCh4aHIsICd0aW1lb3V0Jyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoZSA9PSBTRVJWRVJfQUJPUlQgJiYgeGhyKSB7XG4gICAgICAgICAgICAgICAgeGhyLmFib3J0KCdzZXJ2ZXIgYWJvcnQnKTtcbiAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoeGhyLCAnZXJyb3InLCAnc2VydmVyIGFib3J0Jyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIWRvYyB8fCBkb2MubG9jYXRpb24uaHJlZiA9PSBzLmlmcmFtZVNyYykge1xuICAgICAgICAgICAgICAgIC8vIHJlc3BvbnNlIG5vdCByZWNlaXZlZCB5ZXRcbiAgICAgICAgICAgICAgICBpZiAoIXRpbWVkT3V0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaW8uZGV0YWNoRXZlbnQpIHtcbiAgICAgICAgICAgICAgICBpby5kZXRhY2hFdmVudCgnb25sb2FkJywgY2IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaW8ucmVtb3ZlRXZlbnRMaXN0ZW5lcignbG9hZCcsIGNiLCBmYWxzZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBzdGF0dXMgPSAnc3VjY2VzcycsIGVyck1zZztcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKHRpbWVkT3V0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93ICd0aW1lb3V0JztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgaXNYbWwgPSBzLmRhdGFUeXBlID09ICd4bWwnIHx8IGRvYy5YTUxEb2N1bWVudCB8fCAkLmlzWE1MRG9jKGRvYyk7XG4gICAgICAgICAgICAgICAgbG9nKCdpc1htbD0nK2lzWG1sKTtcbiAgICAgICAgICAgICAgICBpZiAoIWlzWG1sICYmIHdpbmRvdy5vcGVyYSAmJiAoZG9jLmJvZHkgPT09IG51bGwgfHwgIWRvYy5ib2R5LmlubmVySFRNTCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKC0tZG9tQ2hlY2tDb3VudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaW4gc29tZSBicm93c2VycyAoT3BlcmEpIHRoZSBpZnJhbWUgRE9NIGlzIG5vdCBhbHdheXMgdHJhdmVyc2FibGUgd2hlblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhlIG9ubG9hZCBjYWxsYmFjayBmaXJlcywgc28gd2UgbG9vcCBhIGJpdCB0byBhY2NvbW1vZGF0ZVxuICAgICAgICAgICAgICAgICAgICAgICAgbG9nKCdyZXF1ZWluZyBvbkxvYWQgY2FsbGJhY2ssIERPTSBub3QgYXZhaWxhYmxlJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGNiLCAyNTApO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIGxldCB0aGlzIGZhbGwgdGhyb3VnaCBiZWNhdXNlIHNlcnZlciByZXNwb25zZSBjb3VsZCBiZSBhbiBlbXB0eSBkb2N1bWVudFxuICAgICAgICAgICAgICAgICAgICAvL2xvZygnQ291bGQgbm90IGFjY2VzcyBpZnJhbWUgRE9NIGFmdGVyIG11dGlwbGUgdHJpZXMuJyk7XG4gICAgICAgICAgICAgICAgICAgIC8vdGhyb3cgJ0RPTUV4Y2VwdGlvbjogbm90IGF2YWlsYWJsZSc7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy9sb2coJ3Jlc3BvbnNlIGRldGVjdGVkJyk7XG4gICAgICAgICAgICAgICAgdmFyIGRvY1Jvb3QgPSBkb2MuYm9keSA/IGRvYy5ib2R5IDogZG9jLmRvY3VtZW50RWxlbWVudDtcbiAgICAgICAgICAgICAgICB4aHIucmVzcG9uc2VUZXh0ID0gZG9jUm9vdCA/IGRvY1Jvb3QuaW5uZXJIVE1MIDogbnVsbDtcbiAgICAgICAgICAgICAgICB4aHIucmVzcG9uc2VYTUwgPSBkb2MuWE1MRG9jdW1lbnQgPyBkb2MuWE1MRG9jdW1lbnQgOiBkb2M7XG4gICAgICAgICAgICAgICAgaWYgKGlzWG1sKSB7XG4gICAgICAgICAgICAgICAgICAgIHMuZGF0YVR5cGUgPSAneG1sJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgeGhyLmdldFJlc3BvbnNlSGVhZGVyID0gZnVuY3Rpb24oaGVhZGVyKXtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGhlYWRlcnMgPSB7J2NvbnRlbnQtdHlwZSc6IHMuZGF0YVR5cGV9O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaGVhZGVyc1toZWFkZXIudG9Mb3dlckNhc2UoKV07XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAvLyBzdXBwb3J0IGZvciBYSFIgJ3N0YXR1cycgJiAnc3RhdHVzVGV4dCcgZW11bGF0aW9uIDpcbiAgICAgICAgICAgICAgICBpZiAoZG9jUm9vdCkge1xuICAgICAgICAgICAgICAgICAgICB4aHIuc3RhdHVzID0gTnVtYmVyKCBkb2NSb290LmdldEF0dHJpYnV0ZSgnc3RhdHVzJykgKSB8fCB4aHIuc3RhdHVzO1xuICAgICAgICAgICAgICAgICAgICB4aHIuc3RhdHVzVGV4dCA9IGRvY1Jvb3QuZ2V0QXR0cmlidXRlKCdzdGF0dXNUZXh0JykgfHwgeGhyLnN0YXR1c1RleHQ7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIGR0ID0gKHMuZGF0YVR5cGUgfHwgJycpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgdmFyIHNjciA9IC8oanNvbnxzY3JpcHR8dGV4dCkvLnRlc3QoZHQpO1xuICAgICAgICAgICAgICAgIGlmIChzY3IgfHwgcy50ZXh0YXJlYSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBzZWUgaWYgdXNlciBlbWJlZGRlZCByZXNwb25zZSBpbiB0ZXh0YXJlYVxuICAgICAgICAgICAgICAgICAgICB2YXIgdGEgPSBkb2MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3RleHRhcmVhJylbMF07XG4gICAgICAgICAgICAgICAgICAgIGlmICh0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgeGhyLnJlc3BvbnNlVGV4dCA9IHRhLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc3VwcG9ydCBmb3IgWEhSICdzdGF0dXMnICYgJ3N0YXR1c1RleHQnIGVtdWxhdGlvbiA6XG4gICAgICAgICAgICAgICAgICAgICAgICB4aHIuc3RhdHVzID0gTnVtYmVyKCB0YS5nZXRBdHRyaWJ1dGUoJ3N0YXR1cycpICkgfHwgeGhyLnN0YXR1cztcbiAgICAgICAgICAgICAgICAgICAgICAgIHhoci5zdGF0dXNUZXh0ID0gdGEuZ2V0QXR0cmlidXRlKCdzdGF0dXNUZXh0JykgfHwgeGhyLnN0YXR1c1RleHQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoc2NyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBhY2NvdW50IGZvciBicm93c2VycyBpbmplY3RpbmcgcHJlIGFyb3VuZCBqc29uIHJlc3BvbnNlXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJlID0gZG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdwcmUnKVswXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBiID0gZG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdib2R5JylbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeGhyLnJlc3BvbnNlVGV4dCA9IHByZS50ZXh0Q29udGVudCA/IHByZS50ZXh0Q29udGVudCA6IHByZS5pbm5lclRleHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeGhyLnJlc3BvbnNlVGV4dCA9IGIudGV4dENvbnRlbnQgPyBiLnRleHRDb250ZW50IDogYi5pbm5lclRleHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoZHQgPT0gJ3htbCcgJiYgIXhoci5yZXNwb25zZVhNTCAmJiB4aHIucmVzcG9uc2VUZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgIHhoci5yZXNwb25zZVhNTCA9IHRvWG1sKHhoci5yZXNwb25zZVRleHQpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEgPSBodHRwRGF0YSh4aHIsIGR0LCBzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICBzdGF0dXMgPSAncGFyc2VyZXJyb3InO1xuICAgICAgICAgICAgICAgICAgICB4aHIuZXJyb3IgPSBlcnJNc2cgPSAoZXJyIHx8IHN0YXR1cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGxvZygnZXJyb3IgY2F1Z2h0OiAnLGVycik7XG4gICAgICAgICAgICAgICAgc3RhdHVzID0gJ2Vycm9yJztcbiAgICAgICAgICAgICAgICB4aHIuZXJyb3IgPSBlcnJNc2cgPSAoZXJyIHx8IHN0YXR1cyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh4aHIuYWJvcnRlZCkge1xuICAgICAgICAgICAgICAgIGxvZygndXBsb2FkIGFib3J0ZWQnKTtcbiAgICAgICAgICAgICAgICBzdGF0dXMgPSBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoeGhyLnN0YXR1cykgeyAvLyB3ZSd2ZSBzZXQgeGhyLnN0YXR1c1xuICAgICAgICAgICAgICAgIHN0YXR1cyA9ICh4aHIuc3RhdHVzID49IDIwMCAmJiB4aHIuc3RhdHVzIDwgMzAwIHx8IHhoci5zdGF0dXMgPT09IDMwNCkgPyAnc3VjY2VzcycgOiAnZXJyb3InO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBvcmRlcmluZyBvZiB0aGVzZSBjYWxsYmFja3MvdHJpZ2dlcnMgaXMgb2RkLCBidXQgdGhhdCdzIGhvdyAkLmFqYXggZG9lcyBpdFxuICAgICAgICAgICAgaWYgKHN0YXR1cyA9PT0gJ3N1Y2Nlc3MnKSB7XG4gICAgICAgICAgICAgICAgaWYgKHMuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgICAgICBzLnN1Y2Nlc3MuY2FsbChzLmNvbnRleHQsIGRhdGEsICdzdWNjZXNzJywgeGhyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSh4aHIucmVzcG9uc2VUZXh0LCAnc3VjY2VzcycsIHhocik7XG4gICAgICAgICAgICAgICAgaWYgKGcpIHtcbiAgICAgICAgICAgICAgICAgICAgJC5ldmVudC50cmlnZ2VyKFwiYWpheFN1Y2Nlc3NcIiwgW3hociwgc10pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHN0YXR1cykge1xuICAgICAgICAgICAgICAgIGlmIChlcnJNc2cgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBlcnJNc2cgPSB4aHIuc3RhdHVzVGV4dDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHMuZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgcy5lcnJvci5jYWxsKHMuY29udGV4dCwgeGhyLCBzdGF0dXMsIGVyck1zZyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdCh4aHIsICdlcnJvcicsIGVyck1zZyk7XG4gICAgICAgICAgICAgICAgaWYgKGcpIHtcbiAgICAgICAgICAgICAgICAgICAgJC5ldmVudC50cmlnZ2VyKFwiYWpheEVycm9yXCIsIFt4aHIsIHMsIGVyck1zZ10pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGcpIHtcbiAgICAgICAgICAgICAgICAkLmV2ZW50LnRyaWdnZXIoXCJhamF4Q29tcGxldGVcIiwgW3hociwgc10pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZyAmJiAhIC0tJC5hY3RpdmUpIHtcbiAgICAgICAgICAgICAgICAkLmV2ZW50LnRyaWdnZXIoXCJhamF4U3RvcFwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHMuY29tcGxldGUpIHtcbiAgICAgICAgICAgICAgICBzLmNvbXBsZXRlLmNhbGwocy5jb250ZXh0LCB4aHIsIHN0YXR1cyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNhbGxiYWNrUHJvY2Vzc2VkID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChzLnRpbWVvdXQpIHtcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dEhhbmRsZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGNsZWFuIHVwXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmICghcy5pZnJhbWVUYXJnZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgJGlvLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHsgLy9hZGRpbmcgZWxzZSB0byBjbGVhbiB1cCBleGlzdGluZyBpZnJhbWUgcmVzcG9uc2UuXG4gICAgICAgICAgICAgICAgICAgICRpby5hdHRyKCdzcmMnLCBzLmlmcmFtZVNyYyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHhoci5yZXNwb25zZVhNTCA9IG51bGw7XG4gICAgICAgICAgICB9LCAxMDApO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHRvWG1sID0gJC5wYXJzZVhNTCB8fCBmdW5jdGlvbihzLCBkb2MpIHsgLy8gdXNlIHBhcnNlWE1MIGlmIGF2YWlsYWJsZSAoalF1ZXJ5IDEuNSspXG4gICAgICAgICAgICBpZiAod2luZG93LkFjdGl2ZVhPYmplY3QpIHtcbiAgICAgICAgICAgICAgICBkb2MgPSBuZXcgQWN0aXZlWE9iamVjdCgnTWljcm9zb2Z0LlhNTERPTScpO1xuICAgICAgICAgICAgICAgIGRvYy5hc3luYyA9ICdmYWxzZSc7XG4gICAgICAgICAgICAgICAgZG9jLmxvYWRYTUwocyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBkb2MgPSAobmV3IERPTVBhcnNlcigpKS5wYXJzZUZyb21TdHJpbmcocywgJ3RleHQveG1sJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gKGRvYyAmJiBkb2MuZG9jdW1lbnRFbGVtZW50ICYmIGRvYy5kb2N1bWVudEVsZW1lbnQubm9kZU5hbWUgIT0gJ3BhcnNlcmVycm9yJykgPyBkb2MgOiBudWxsO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgcGFyc2VKU09OID0gJC5wYXJzZUpTT04gfHwgZnVuY3Rpb24ocykge1xuICAgICAgICAgICAgLypqc2xpbnQgZXZpbDp0cnVlICovXG4gICAgICAgICAgICByZXR1cm4gd2luZG93WydldmFsJ10oJygnICsgcyArICcpJyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGh0dHBEYXRhID0gZnVuY3Rpb24oIHhociwgdHlwZSwgcyApIHsgLy8gbW9zdGx5IGxpZnRlZCBmcm9tIGpxMS40LjRcblxuICAgICAgICAgICAgdmFyIGN0ID0geGhyLmdldFJlc3BvbnNlSGVhZGVyKCdjb250ZW50LXR5cGUnKSB8fCAnJyxcbiAgICAgICAgICAgICAgICB4bWwgPSB0eXBlID09PSAneG1sJyB8fCAhdHlwZSAmJiBjdC5pbmRleE9mKCd4bWwnKSA+PSAwLFxuICAgICAgICAgICAgICAgIGRhdGEgPSB4bWwgPyB4aHIucmVzcG9uc2VYTUwgOiB4aHIucmVzcG9uc2VUZXh0O1xuXG4gICAgICAgICAgICBpZiAoeG1sICYmIGRhdGEuZG9jdW1lbnRFbGVtZW50Lm5vZGVOYW1lID09PSAncGFyc2VyZXJyb3InKSB7XG4gICAgICAgICAgICAgICAgaWYgKCQuZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgJC5lcnJvcigncGFyc2VyZXJyb3InKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocyAmJiBzLmRhdGFGaWx0ZXIpIHtcbiAgICAgICAgICAgICAgICBkYXRhID0gcy5kYXRhRmlsdGVyKGRhdGEsIHR5cGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBkYXRhID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlID09PSAnanNvbicgfHwgIXR5cGUgJiYgY3QuaW5kZXhPZignanNvbicpID49IDApIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YSA9IHBhcnNlSlNPTihkYXRhKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT09IFwic2NyaXB0XCIgfHwgIXR5cGUgJiYgY3QuaW5kZXhPZihcImphdmFzY3JpcHRcIikgPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICAkLmdsb2JhbEV2YWwoZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIGRlZmVycmVkO1xuICAgIH1cbn07XG5cbi8qKlxuICogYWpheEZvcm0oKSBwcm92aWRlcyBhIG1lY2hhbmlzbSBmb3IgZnVsbHkgYXV0b21hdGluZyBmb3JtIHN1Ym1pc3Npb24uXG4gKlxuICogVGhlIGFkdmFudGFnZXMgb2YgdXNpbmcgdGhpcyBtZXRob2QgaW5zdGVhZCBvZiBhamF4U3VibWl0KCkgYXJlOlxuICpcbiAqIDE6IFRoaXMgbWV0aG9kIHdpbGwgaW5jbHVkZSBjb29yZGluYXRlcyBmb3IgPGlucHV0IHR5cGU9XCJpbWFnZVwiIC8+IGVsZW1lbnRzIChpZiB0aGUgZWxlbWVudFxuICogICAgaXMgdXNlZCB0byBzdWJtaXQgdGhlIGZvcm0pLlxuICogMi4gVGhpcyBtZXRob2Qgd2lsbCBpbmNsdWRlIHRoZSBzdWJtaXQgZWxlbWVudCdzIG5hbWUvdmFsdWUgZGF0YSAoZm9yIHRoZSBlbGVtZW50IHRoYXQgd2FzXG4gKiAgICB1c2VkIHRvIHN1Ym1pdCB0aGUgZm9ybSkuXG4gKiAzLiBUaGlzIG1ldGhvZCBiaW5kcyB0aGUgc3VibWl0KCkgbWV0aG9kIHRvIHRoZSBmb3JtIGZvciB5b3UuXG4gKlxuICogVGhlIG9wdGlvbnMgYXJndW1lbnQgZm9yIGFqYXhGb3JtIHdvcmtzIGV4YWN0bHkgYXMgaXQgZG9lcyBmb3IgYWpheFN1Ym1pdC4gIGFqYXhGb3JtIG1lcmVseVxuICogcGFzc2VzIHRoZSBvcHRpb25zIGFyZ3VtZW50IGFsb25nIGFmdGVyIHByb3Blcmx5IGJpbmRpbmcgZXZlbnRzIGZvciBzdWJtaXQgZWxlbWVudHMgYW5kXG4gKiB0aGUgZm9ybSBpdHNlbGYuXG4gKi9cbiQuZm4uYWpheEZvcm0gPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgb3B0aW9ucy5kZWxlZ2F0aW9uID0gb3B0aW9ucy5kZWxlZ2F0aW9uICYmICQuaXNGdW5jdGlvbigkLmZuLm9uKTtcblxuICAgIC8vIGluIGpRdWVyeSAxLjMrIHdlIGNhbiBmaXggbWlzdGFrZXMgd2l0aCB0aGUgcmVhZHkgc3RhdGVcbiAgICBpZiAoIW9wdGlvbnMuZGVsZWdhdGlvbiAmJiB0aGlzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICB2YXIgbyA9IHsgczogdGhpcy5zZWxlY3RvciwgYzogdGhpcy5jb250ZXh0IH07XG4gICAgICAgIGlmICghJC5pc1JlYWR5ICYmIG8ucykge1xuICAgICAgICAgICAgbG9nKCdET00gbm90IHJlYWR5LCBxdWV1aW5nIGFqYXhGb3JtJyk7XG4gICAgICAgICAgICAkKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICQoby5zLG8uYykuYWpheEZvcm0ob3B0aW9ucyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIC8vIGlzIHlvdXIgRE9NIHJlYWR5PyAgaHR0cDovL2RvY3MuanF1ZXJ5LmNvbS9UdXRvcmlhbHM6SW50cm9kdWNpbmdfJChkb2N1bWVudCkucmVhZHkoKVxuICAgICAgICBsb2coJ3Rlcm1pbmF0aW5nOyB6ZXJvIGVsZW1lbnRzIGZvdW5kIGJ5IHNlbGVjdG9yJyArICgkLmlzUmVhZHkgPyAnJyA6ICcgKERPTSBub3QgcmVhZHkpJykpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBpZiAoIG9wdGlvbnMuZGVsZWdhdGlvbiApIHtcbiAgICAgICAgJChkb2N1bWVudClcbiAgICAgICAgICAgIC5vZmYoJ3N1Ym1pdC5mb3JtLXBsdWdpbicsIHRoaXMuc2VsZWN0b3IsIGRvQWpheFN1Ym1pdClcbiAgICAgICAgICAgIC5vZmYoJ2NsaWNrLmZvcm0tcGx1Z2luJywgdGhpcy5zZWxlY3RvciwgY2FwdHVyZVN1Ym1pdHRpbmdFbGVtZW50KVxuICAgICAgICAgICAgLm9uKCdzdWJtaXQuZm9ybS1wbHVnaW4nLCB0aGlzLnNlbGVjdG9yLCBvcHRpb25zLCBkb0FqYXhTdWJtaXQpXG4gICAgICAgICAgICAub24oJ2NsaWNrLmZvcm0tcGx1Z2luJywgdGhpcy5zZWxlY3Rvciwgb3B0aW9ucywgY2FwdHVyZVN1Ym1pdHRpbmdFbGVtZW50KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuYWpheEZvcm1VbmJpbmQoKVxuICAgICAgICAuYmluZCgnc3VibWl0LmZvcm0tcGx1Z2luJywgb3B0aW9ucywgZG9BamF4U3VibWl0KVxuICAgICAgICAuYmluZCgnY2xpY2suZm9ybS1wbHVnaW4nLCBvcHRpb25zLCBjYXB0dXJlU3VibWl0dGluZ0VsZW1lbnQpO1xufTtcblxuLy8gcHJpdmF0ZSBldmVudCBoYW5kbGVyc1xuZnVuY3Rpb24gZG9BamF4U3VibWl0KGUpIHtcbiAgICAvKmpzaGludCB2YWxpZHRoaXM6dHJ1ZSAqL1xuICAgIHZhciBvcHRpb25zID0gZS5kYXRhO1xuICAgIGlmICghZS5pc0RlZmF1bHRQcmV2ZW50ZWQoKSkgeyAvLyBpZiBldmVudCBoYXMgYmVlbiBjYW5jZWxlZCwgZG9uJ3QgcHJvY2VlZFxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICQoZS50YXJnZXQpLmFqYXhTdWJtaXQob3B0aW9ucyk7IC8vICMzNjVcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNhcHR1cmVTdWJtaXR0aW5nRWxlbWVudChlKSB7XG4gICAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cbiAgICB2YXIgdGFyZ2V0ID0gZS50YXJnZXQ7XG4gICAgdmFyICRlbCA9ICQodGFyZ2V0KTtcbiAgICBpZiAoISgkZWwuaXMoXCJbdHlwZT1zdWJtaXRdLFt0eXBlPWltYWdlXVwiKSkpIHtcbiAgICAgICAgLy8gaXMgdGhpcyBhIGNoaWxkIGVsZW1lbnQgb2YgdGhlIHN1Ym1pdCBlbD8gIChleDogYSBzcGFuIHdpdGhpbiBhIGJ1dHRvbilcbiAgICAgICAgdmFyIHQgPSAkZWwuY2xvc2VzdCgnW3R5cGU9c3VibWl0XScpO1xuICAgICAgICBpZiAodC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0YXJnZXQgPSB0WzBdO1xuICAgIH1cbiAgICB2YXIgZm9ybSA9IHRoaXM7XG4gICAgZm9ybS5jbGsgPSB0YXJnZXQ7XG4gICAgaWYgKHRhcmdldC50eXBlID09ICdpbWFnZScpIHtcbiAgICAgICAgaWYgKGUub2Zmc2V0WCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBmb3JtLmNsa194ID0gZS5vZmZzZXRYO1xuICAgICAgICAgICAgZm9ybS5jbGtfeSA9IGUub2Zmc2V0WTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgJC5mbi5vZmZzZXQgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdmFyIG9mZnNldCA9ICRlbC5vZmZzZXQoKTtcbiAgICAgICAgICAgIGZvcm0uY2xrX3ggPSBlLnBhZ2VYIC0gb2Zmc2V0LmxlZnQ7XG4gICAgICAgICAgICBmb3JtLmNsa195ID0gZS5wYWdlWSAtIG9mZnNldC50b3A7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3JtLmNsa194ID0gZS5wYWdlWCAtIHRhcmdldC5vZmZzZXRMZWZ0O1xuICAgICAgICAgICAgZm9ybS5jbGtfeSA9IGUucGFnZVkgLSB0YXJnZXQub2Zmc2V0VG9wO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIGNsZWFyIGZvcm0gdmFyc1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGZvcm0uY2xrID0gZm9ybS5jbGtfeCA9IGZvcm0uY2xrX3kgPSBudWxsOyB9LCAxMDApO1xufVxuXG5cbi8vIGFqYXhGb3JtVW5iaW5kIHVuYmluZHMgdGhlIGV2ZW50IGhhbmRsZXJzIHRoYXQgd2VyZSBib3VuZCBieSBhamF4Rm9ybVxuJC5mbi5hamF4Rm9ybVVuYmluZCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnVuYmluZCgnc3VibWl0LmZvcm0tcGx1Z2luIGNsaWNrLmZvcm0tcGx1Z2luJyk7XG59O1xuXG4vKipcbiAqIGZvcm1Ub0FycmF5KCkgZ2F0aGVycyBmb3JtIGVsZW1lbnQgZGF0YSBpbnRvIGFuIGFycmF5IG9mIG9iamVjdHMgdGhhdCBjYW5cbiAqIGJlIHBhc3NlZCB0byBhbnkgb2YgdGhlIGZvbGxvd2luZyBhamF4IGZ1bmN0aW9uczogJC5nZXQsICQucG9zdCwgb3IgbG9hZC5cbiAqIEVhY2ggb2JqZWN0IGluIHRoZSBhcnJheSBoYXMgYm90aCBhICduYW1lJyBhbmQgJ3ZhbHVlJyBwcm9wZXJ0eS4gIEFuIGV4YW1wbGUgb2ZcbiAqIGFuIGFycmF5IGZvciBhIHNpbXBsZSBsb2dpbiBmb3JtIG1pZ2h0IGJlOlxuICpcbiAqIFsgeyBuYW1lOiAndXNlcm5hbWUnLCB2YWx1ZTogJ2pyZXNpZycgfSwgeyBuYW1lOiAncGFzc3dvcmQnLCB2YWx1ZTogJ3NlY3JldCcgfSBdXG4gKlxuICogSXQgaXMgdGhpcyBhcnJheSB0aGF0IGlzIHBhc3NlZCB0byBwcmUtc3VibWl0IGNhbGxiYWNrIGZ1bmN0aW9ucyBwcm92aWRlZCB0byB0aGVcbiAqIGFqYXhTdWJtaXQoKSBhbmQgYWpheEZvcm0oKSBtZXRob2RzLlxuICovXG4kLmZuLmZvcm1Ub0FycmF5ID0gZnVuY3Rpb24oc2VtYW50aWMsIGVsZW1lbnRzKSB7XG4gICAgdmFyIGEgPSBbXTtcbiAgICBpZiAodGhpcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIGE7XG4gICAgfVxuXG4gICAgdmFyIGZvcm0gPSB0aGlzWzBdO1xuICAgIHZhciBmb3JtSWQgPSB0aGlzLmF0dHIoJ2lkJyk7XG4gICAgdmFyIGVscyA9IHNlbWFudGljID8gZm9ybS5nZXRFbGVtZW50c0J5VGFnTmFtZSgnKicpIDogZm9ybS5lbGVtZW50cztcbiAgICB2YXIgZWxzMjtcblxuICAgIGlmIChlbHMgJiYgIS9NU0lFIFs2NzhdLy50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpKSB7IC8vICMzOTBcbiAgICAgICAgZWxzID0gJChlbHMpLmdldCgpOyAgLy8gY29udmVydCB0byBzdGFuZGFyZCBhcnJheVxuICAgIH1cblxuICAgIC8vICMzODY7IGFjY291bnQgZm9yIGlucHV0cyBvdXRzaWRlIHRoZSBmb3JtIHdoaWNoIHVzZSB0aGUgJ2Zvcm0nIGF0dHJpYnV0ZVxuICAgIGlmICggZm9ybUlkICkge1xuICAgICAgICBlbHMyID0gJCgnOmlucHV0W2Zvcm09XCInICsgZm9ybUlkICsgJ1wiXScpLmdldCgpOyAvLyBoYXQgdGlwIEB0aGV0XG4gICAgICAgIGlmICggZWxzMi5sZW5ndGggKSB7XG4gICAgICAgICAgICBlbHMgPSAoZWxzIHx8IFtdKS5jb25jYXQoZWxzMik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWVscyB8fCAhZWxzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gYTtcbiAgICB9XG5cbiAgICB2YXIgaSxqLG4sdixlbCxtYXgsam1heDtcbiAgICBmb3IoaT0wLCBtYXg9ZWxzLmxlbmd0aDsgaSA8IG1heDsgaSsrKSB7XG4gICAgICAgIGVsID0gZWxzW2ldO1xuICAgICAgICBuID0gZWwubmFtZTtcbiAgICAgICAgaWYgKCFuIHx8IGVsLmRpc2FibGVkKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzZW1hbnRpYyAmJiBmb3JtLmNsayAmJiBlbC50eXBlID09IFwiaW1hZ2VcIikge1xuICAgICAgICAgICAgLy8gaGFuZGxlIGltYWdlIGlucHV0cyBvbiB0aGUgZmx5IHdoZW4gc2VtYW50aWMgPT0gdHJ1ZVxuICAgICAgICAgICAgaWYoZm9ybS5jbGsgPT0gZWwpIHtcbiAgICAgICAgICAgICAgICBhLnB1c2goe25hbWU6IG4sIHZhbHVlOiAkKGVsKS52YWwoKSwgdHlwZTogZWwudHlwZSB9KTtcbiAgICAgICAgICAgICAgICBhLnB1c2goe25hbWU6IG4rJy54JywgdmFsdWU6IGZvcm0uY2xrX3h9LCB7bmFtZTogbisnLnknLCB2YWx1ZTogZm9ybS5jbGtfeX0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICB2ID0gJC5maWVsZFZhbHVlKGVsLCB0cnVlKTtcbiAgICAgICAgaWYgKHYgJiYgdi5jb25zdHJ1Y3RvciA9PSBBcnJheSkge1xuICAgICAgICAgICAgaWYgKGVsZW1lbnRzKSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudHMucHVzaChlbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3Ioaj0wLCBqbWF4PXYubGVuZ3RoOyBqIDwgam1heDsgaisrKSB7XG4gICAgICAgICAgICAgICAgYS5wdXNoKHtuYW1lOiBuLCB2YWx1ZTogdltqXX0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGZlYXR1cmUuZmlsZWFwaSAmJiBlbC50eXBlID09ICdmaWxlJykge1xuICAgICAgICAgICAgaWYgKGVsZW1lbnRzKSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudHMucHVzaChlbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgZmlsZXMgPSBlbC5maWxlcztcbiAgICAgICAgICAgIGlmIChmaWxlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGo9MDsgaiA8IGZpbGVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGEucHVzaCh7bmFtZTogbiwgdmFsdWU6IGZpbGVzW2pdLCB0eXBlOiBlbC50eXBlfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gIzE4MFxuICAgICAgICAgICAgICAgIGEucHVzaCh7IG5hbWU6IG4sIHZhbHVlOiAnJywgdHlwZTogZWwudHlwZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh2ICE9PSBudWxsICYmIHR5cGVvZiB2ICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBpZiAoZWxlbWVudHMpIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50cy5wdXNoKGVsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGEucHVzaCh7bmFtZTogbiwgdmFsdWU6IHYsIHR5cGU6IGVsLnR5cGUsIHJlcXVpcmVkOiBlbC5yZXF1aXJlZH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFzZW1hbnRpYyAmJiBmb3JtLmNsaykge1xuICAgICAgICAvLyBpbnB1dCB0eXBlPT0naW1hZ2UnIGFyZSBub3QgZm91bmQgaW4gZWxlbWVudHMgYXJyYXkhIGhhbmRsZSBpdCBoZXJlXG4gICAgICAgIHZhciAkaW5wdXQgPSAkKGZvcm0uY2xrKSwgaW5wdXQgPSAkaW5wdXRbMF07XG4gICAgICAgIG4gPSBpbnB1dC5uYW1lO1xuICAgICAgICBpZiAobiAmJiAhaW5wdXQuZGlzYWJsZWQgJiYgaW5wdXQudHlwZSA9PSAnaW1hZ2UnKSB7XG4gICAgICAgICAgICBhLnB1c2goe25hbWU6IG4sIHZhbHVlOiAkaW5wdXQudmFsKCl9KTtcbiAgICAgICAgICAgIGEucHVzaCh7bmFtZTogbisnLngnLCB2YWx1ZTogZm9ybS5jbGtfeH0sIHtuYW1lOiBuKycueScsIHZhbHVlOiBmb3JtLmNsa195fSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGE7XG59O1xuXG4vKipcbiAqIFNlcmlhbGl6ZXMgZm9ybSBkYXRhIGludG8gYSAnc3VibWl0dGFibGUnIHN0cmluZy4gVGhpcyBtZXRob2Qgd2lsbCByZXR1cm4gYSBzdHJpbmdcbiAqIGluIHRoZSBmb3JtYXQ6IG5hbWUxPXZhbHVlMSZhbXA7bmFtZTI9dmFsdWUyXG4gKi9cbiQuZm4uZm9ybVNlcmlhbGl6ZSA9IGZ1bmN0aW9uKHNlbWFudGljKSB7XG4gICAgLy9oYW5kIG9mZiB0byBqUXVlcnkucGFyYW0gZm9yIHByb3BlciBlbmNvZGluZ1xuICAgIHJldHVybiAkLnBhcmFtKHRoaXMuZm9ybVRvQXJyYXkoc2VtYW50aWMpKTtcbn07XG5cbi8qKlxuICogU2VyaWFsaXplcyBhbGwgZmllbGQgZWxlbWVudHMgaW4gdGhlIGpRdWVyeSBvYmplY3QgaW50byBhIHF1ZXJ5IHN0cmluZy5cbiAqIFRoaXMgbWV0aG9kIHdpbGwgcmV0dXJuIGEgc3RyaW5nIGluIHRoZSBmb3JtYXQ6IG5hbWUxPXZhbHVlMSZhbXA7bmFtZTI9dmFsdWUyXG4gKi9cbiQuZm4uZmllbGRTZXJpYWxpemUgPSBmdW5jdGlvbihzdWNjZXNzZnVsKSB7XG4gICAgdmFyIGEgPSBbXTtcbiAgICB0aGlzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBuID0gdGhpcy5uYW1lO1xuICAgICAgICBpZiAoIW4pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgdiA9ICQuZmllbGRWYWx1ZSh0aGlzLCBzdWNjZXNzZnVsKTtcbiAgICAgICAgaWYgKHYgJiYgdi5jb25zdHJ1Y3RvciA9PSBBcnJheSkge1xuICAgICAgICAgICAgZm9yICh2YXIgaT0wLG1heD12Lmxlbmd0aDsgaSA8IG1heDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgYS5wdXNoKHtuYW1lOiBuLCB2YWx1ZTogdltpXX0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHYgIT09IG51bGwgJiYgdHlwZW9mIHYgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGEucHVzaCh7bmFtZTogdGhpcy5uYW1lLCB2YWx1ZTogdn0pO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgLy9oYW5kIG9mZiB0byBqUXVlcnkucGFyYW0gZm9yIHByb3BlciBlbmNvZGluZ1xuICAgIHJldHVybiAkLnBhcmFtKGEpO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSB2YWx1ZShzKSBvZiB0aGUgZWxlbWVudCBpbiB0aGUgbWF0Y2hlZCBzZXQuICBGb3IgZXhhbXBsZSwgY29uc2lkZXIgdGhlIGZvbGxvd2luZyBmb3JtOlxuICpcbiAqICA8Zm9ybT48ZmllbGRzZXQ+XG4gKiAgICAgIDxpbnB1dCBuYW1lPVwiQVwiIHR5cGU9XCJ0ZXh0XCIgLz5cbiAqICAgICAgPGlucHV0IG5hbWU9XCJBXCIgdHlwZT1cInRleHRcIiAvPlxuICogICAgICA8aW5wdXQgbmFtZT1cIkJcIiB0eXBlPVwiY2hlY2tib3hcIiB2YWx1ZT1cIkIxXCIgLz5cbiAqICAgICAgPGlucHV0IG5hbWU9XCJCXCIgdHlwZT1cImNoZWNrYm94XCIgdmFsdWU9XCJCMlwiLz5cbiAqICAgICAgPGlucHV0IG5hbWU9XCJDXCIgdHlwZT1cInJhZGlvXCIgdmFsdWU9XCJDMVwiIC8+XG4gKiAgICAgIDxpbnB1dCBuYW1lPVwiQ1wiIHR5cGU9XCJyYWRpb1wiIHZhbHVlPVwiQzJcIiAvPlxuICogIDwvZmllbGRzZXQ+PC9mb3JtPlxuICpcbiAqICB2YXIgdiA9ICQoJ2lucHV0W3R5cGU9dGV4dF0nKS5maWVsZFZhbHVlKCk7XG4gKiAgLy8gaWYgbm8gdmFsdWVzIGFyZSBlbnRlcmVkIGludG8gdGhlIHRleHQgaW5wdXRzXG4gKiAgdiA9PSBbJycsJyddXG4gKiAgLy8gaWYgdmFsdWVzIGVudGVyZWQgaW50byB0aGUgdGV4dCBpbnB1dHMgYXJlICdmb28nIGFuZCAnYmFyJ1xuICogIHYgPT0gWydmb28nLCdiYXInXVxuICpcbiAqICB2YXIgdiA9ICQoJ2lucHV0W3R5cGU9Y2hlY2tib3hdJykuZmllbGRWYWx1ZSgpO1xuICogIC8vIGlmIG5laXRoZXIgY2hlY2tib3ggaXMgY2hlY2tlZFxuICogIHYgPT09IHVuZGVmaW5lZFxuICogIC8vIGlmIGJvdGggY2hlY2tib3hlcyBhcmUgY2hlY2tlZFxuICogIHYgPT0gWydCMScsICdCMiddXG4gKlxuICogIHZhciB2ID0gJCgnaW5wdXRbdHlwZT1yYWRpb10nKS5maWVsZFZhbHVlKCk7XG4gKiAgLy8gaWYgbmVpdGhlciByYWRpbyBpcyBjaGVja2VkXG4gKiAgdiA9PT0gdW5kZWZpbmVkXG4gKiAgLy8gaWYgZmlyc3QgcmFkaW8gaXMgY2hlY2tlZFxuICogIHYgPT0gWydDMSddXG4gKlxuICogVGhlIHN1Y2Nlc3NmdWwgYXJndW1lbnQgY29udHJvbHMgd2hldGhlciBvciBub3QgdGhlIGZpZWxkIGVsZW1lbnQgbXVzdCBiZSAnc3VjY2Vzc2Z1bCdcbiAqIChwZXIgaHR0cDovL3d3dy53My5vcmcvVFIvaHRtbDQvaW50ZXJhY3QvZm9ybXMuaHRtbCNzdWNjZXNzZnVsLWNvbnRyb2xzKS5cbiAqIFRoZSBkZWZhdWx0IHZhbHVlIG9mIHRoZSBzdWNjZXNzZnVsIGFyZ3VtZW50IGlzIHRydWUuICBJZiB0aGlzIHZhbHVlIGlzIGZhbHNlIHRoZSB2YWx1ZShzKVxuICogZm9yIGVhY2ggZWxlbWVudCBpcyByZXR1cm5lZC5cbiAqXG4gKiBOb3RlOiBUaGlzIG1ldGhvZCAqYWx3YXlzKiByZXR1cm5zIGFuIGFycmF5LiAgSWYgbm8gdmFsaWQgdmFsdWUgY2FuIGJlIGRldGVybWluZWQgdGhlXG4gKiAgICBhcnJheSB3aWxsIGJlIGVtcHR5LCBvdGhlcndpc2UgaXQgd2lsbCBjb250YWluIG9uZSBvciBtb3JlIHZhbHVlcy5cbiAqL1xuJC5mbi5maWVsZFZhbHVlID0gZnVuY3Rpb24oc3VjY2Vzc2Z1bCkge1xuICAgIGZvciAodmFyIHZhbD1bXSwgaT0wLCBtYXg9dGhpcy5sZW5ndGg7IGkgPCBtYXg7IGkrKykge1xuICAgICAgICB2YXIgZWwgPSB0aGlzW2ldO1xuICAgICAgICB2YXIgdiA9ICQuZmllbGRWYWx1ZShlbCwgc3VjY2Vzc2Z1bCk7XG4gICAgICAgIGlmICh2ID09PSBudWxsIHx8IHR5cGVvZiB2ID09ICd1bmRlZmluZWQnIHx8ICh2LmNvbnN0cnVjdG9yID09IEFycmF5ICYmICF2Lmxlbmd0aCkpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh2LmNvbnN0cnVjdG9yID09IEFycmF5KSB7XG4gICAgICAgICAgICAkLm1lcmdlKHZhbCwgdik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YWwucHVzaCh2KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdmFsO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSB2YWx1ZSBvZiB0aGUgZmllbGQgZWxlbWVudC5cbiAqL1xuJC5maWVsZFZhbHVlID0gZnVuY3Rpb24oZWwsIHN1Y2Nlc3NmdWwpIHtcbiAgICB2YXIgbiA9IGVsLm5hbWUsIHQgPSBlbC50eXBlLCB0YWcgPSBlbC50YWdOYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgaWYgKHN1Y2Nlc3NmdWwgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBzdWNjZXNzZnVsID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoc3VjY2Vzc2Z1bCAmJiAoIW4gfHwgZWwuZGlzYWJsZWQgfHwgdCA9PSAncmVzZXQnIHx8IHQgPT0gJ2J1dHRvbicgfHxcbiAgICAgICAgKHQgPT0gJ2NoZWNrYm94JyB8fCB0ID09ICdyYWRpbycpICYmICFlbC5jaGVja2VkIHx8XG4gICAgICAgICh0ID09ICdzdWJtaXQnIHx8IHQgPT0gJ2ltYWdlJykgJiYgZWwuZm9ybSAmJiBlbC5mb3JtLmNsayAhPSBlbCB8fFxuICAgICAgICB0YWcgPT0gJ3NlbGVjdCcgJiYgZWwuc2VsZWN0ZWRJbmRleCA9PSAtMSkpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmICh0YWcgPT0gJ3NlbGVjdCcpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gZWwuc2VsZWN0ZWRJbmRleDtcbiAgICAgICAgaWYgKGluZGV4IDwgMCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGEgPSBbXSwgb3BzID0gZWwub3B0aW9ucztcbiAgICAgICAgdmFyIG9uZSA9ICh0ID09ICdzZWxlY3Qtb25lJyk7XG4gICAgICAgIHZhciBtYXggPSAob25lID8gaW5kZXgrMSA6IG9wcy5sZW5ndGgpO1xuICAgICAgICBmb3IodmFyIGk9KG9uZSA/IGluZGV4IDogMCk7IGkgPCBtYXg7IGkrKykge1xuICAgICAgICAgICAgdmFyIG9wID0gb3BzW2ldO1xuICAgICAgICAgICAgaWYgKG9wLnNlbGVjdGVkKSB7XG4gICAgICAgICAgICAgICAgdmFyIHYgPSBvcC52YWx1ZTtcbiAgICAgICAgICAgICAgICBpZiAoIXYpIHsgLy8gZXh0cmEgcGFpbiBmb3IgSUUuLi5cbiAgICAgICAgICAgICAgICAgICAgdiA9IChvcC5hdHRyaWJ1dGVzICYmIG9wLmF0dHJpYnV0ZXMudmFsdWUgJiYgIShvcC5hdHRyaWJ1dGVzLnZhbHVlLnNwZWNpZmllZCkpID8gb3AudGV4dCA6IG9wLnZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAob25lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhLnB1c2godik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGE7XG4gICAgfVxuICAgIHJldHVybiAkKGVsKS52YWwoKTtcbn07XG5cbi8qKlxuICogQ2xlYXJzIHRoZSBmb3JtIGRhdGEuICBUYWtlcyB0aGUgZm9sbG93aW5nIGFjdGlvbnMgb24gdGhlIGZvcm0ncyBpbnB1dCBmaWVsZHM6XG4gKiAgLSBpbnB1dCB0ZXh0IGZpZWxkcyB3aWxsIGhhdmUgdGhlaXIgJ3ZhbHVlJyBwcm9wZXJ0eSBzZXQgdG8gdGhlIGVtcHR5IHN0cmluZ1xuICogIC0gc2VsZWN0IGVsZW1lbnRzIHdpbGwgaGF2ZSB0aGVpciAnc2VsZWN0ZWRJbmRleCcgcHJvcGVydHkgc2V0IHRvIC0xXG4gKiAgLSBjaGVja2JveCBhbmQgcmFkaW8gaW5wdXRzIHdpbGwgaGF2ZSB0aGVpciAnY2hlY2tlZCcgcHJvcGVydHkgc2V0IHRvIGZhbHNlXG4gKiAgLSBpbnB1dHMgb2YgdHlwZSBzdWJtaXQsIGJ1dHRvbiwgcmVzZXQsIGFuZCBoaWRkZW4gd2lsbCAqbm90KiBiZSBlZmZlY3RlZFxuICogIC0gYnV0dG9uIGVsZW1lbnRzIHdpbGwgKm5vdCogYmUgZWZmZWN0ZWRcbiAqL1xuJC5mbi5jbGVhckZvcm0gPSBmdW5jdGlvbihpbmNsdWRlSGlkZGVuKSB7XG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgJCgnaW5wdXQsc2VsZWN0LHRleHRhcmVhJywgdGhpcykuY2xlYXJGaWVsZHMoaW5jbHVkZUhpZGRlbik7XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIENsZWFycyB0aGUgc2VsZWN0ZWQgZm9ybSBlbGVtZW50cy5cbiAqL1xuJC5mbi5jbGVhckZpZWxkcyA9ICQuZm4uY2xlYXJJbnB1dHMgPSBmdW5jdGlvbihpbmNsdWRlSGlkZGVuKSB7XG4gICAgdmFyIHJlID0gL14oPzpjb2xvcnxkYXRlfGRhdGV0aW1lfGVtYWlsfG1vbnRofG51bWJlcnxwYXNzd29yZHxyYW5nZXxzZWFyY2h8dGVsfHRleHR8dGltZXx1cmx8d2VlaykkL2k7IC8vICdoaWRkZW4nIGlzIG5vdCBpbiB0aGlzIGxpc3RcbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdCA9IHRoaXMudHlwZSwgdGFnID0gdGhpcy50YWdOYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGlmIChyZS50ZXN0KHQpIHx8IHRhZyA9PSAndGV4dGFyZWEnKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlID0gJyc7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodCA9PSAnY2hlY2tib3gnIHx8IHQgPT0gJ3JhZGlvJykge1xuICAgICAgICAgICAgdGhpcy5jaGVja2VkID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGFnID09ICdzZWxlY3QnKSB7XG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkSW5kZXggPSAtMTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0ID09IFwiZmlsZVwiKSB7XG4gICAgICAgICAgICBpZiAoL01TSUUvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpIHtcbiAgICAgICAgICAgICAgICAkKHRoaXMpLnJlcGxhY2VXaXRoKCQodGhpcykuY2xvbmUodHJ1ZSkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkKHRoaXMpLnZhbCgnJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaW5jbHVkZUhpZGRlbikge1xuICAgICAgICAgICAgLy8gaW5jbHVkZUhpZGRlbiBjYW4gYmUgdGhlIHZhbHVlIHRydWUsIG9yIGl0IGNhbiBiZSBhIHNlbGVjdG9yIHN0cmluZ1xuICAgICAgICAgICAgLy8gaW5kaWNhdGluZyBhIHNwZWNpYWwgdGVzdDsgZm9yIGV4YW1wbGU6XG4gICAgICAgICAgICAvLyAgJCgnI215Rm9ybScpLmNsZWFyRm9ybSgnLnNwZWNpYWw6aGlkZGVuJylcbiAgICAgICAgICAgIC8vIHRoZSBhYm92ZSB3b3VsZCBjbGVhbiBoaWRkZW4gaW5wdXRzIHRoYXQgaGF2ZSB0aGUgY2xhc3Mgb2YgJ3NwZWNpYWwnXG4gICAgICAgICAgICBpZiAoIChpbmNsdWRlSGlkZGVuID09PSB0cnVlICYmIC9oaWRkZW4vLnRlc3QodCkpIHx8XG4gICAgICAgICAgICAgICAgICh0eXBlb2YgaW5jbHVkZUhpZGRlbiA9PSAnc3RyaW5nJyAmJiAkKHRoaXMpLmlzKGluY2x1ZGVIaWRkZW4pKSApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbn07XG5cbi8qKlxuICogUmVzZXRzIHRoZSBmb3JtIGRhdGEuICBDYXVzZXMgYWxsIGZvcm0gZWxlbWVudHMgdG8gYmUgcmVzZXQgdG8gdGhlaXIgb3JpZ2luYWwgdmFsdWUuXG4gKi9cbi8qJC5mbi5yZXNldEZvcm0gPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBndWFyZCBhZ2FpbnN0IGFuIGlucHV0IHdpdGggdGhlIG5hbWUgb2YgJ3Jlc2V0J1xuICAgICAgICAvLyBub3RlIHRoYXQgSUUgcmVwb3J0cyB0aGUgcmVzZXQgZnVuY3Rpb24gYXMgYW4gJ29iamVjdCdcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLnJlc2V0ID09ICdmdW5jdGlvbicgfHwgKHR5cGVvZiB0aGlzLnJlc2V0ID09ICdvYmplY3QnICYmICF0aGlzLnJlc2V0Lm5vZGVUeXBlKSkge1xuICAgICAgICAgICAgdGhpcy5yZXNldCgpO1xuICAgICAgICB9XG4gICAgfSk7XG59OyovXG5cbi8qKlxuICogRW5hYmxlcyBvciBkaXNhYmxlcyBhbnkgbWF0Y2hpbmcgZWxlbWVudHMuXG4gKi9cbiQuZm4uZW5hYmxlID0gZnVuY3Rpb24oYikge1xuICAgIGlmIChiID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgYiA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZGlzYWJsZWQgPSAhYjtcbiAgICB9KTtcbn07XG5cbi8qKlxuICogQ2hlY2tzL3VuY2hlY2tzIGFueSBtYXRjaGluZyBjaGVja2JveGVzIG9yIHJhZGlvIGJ1dHRvbnMgYW5kXG4gKiBzZWxlY3RzL2Rlc2VsZWN0cyBhbmQgbWF0Y2hpbmcgb3B0aW9uIGVsZW1lbnRzLlxuICovXG4kLmZuLnNlbGVjdGVkID0gZnVuY3Rpb24oc2VsZWN0KSB7XG4gICAgaWYgKHNlbGVjdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHNlbGVjdCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB0ID0gdGhpcy50eXBlO1xuICAgICAgICBpZiAodCA9PSAnY2hlY2tib3gnIHx8IHQgPT0gJ3JhZGlvJykge1xuICAgICAgICAgICAgdGhpcy5jaGVja2VkID0gc2VsZWN0O1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRoaXMudGFnTmFtZS50b0xvd2VyQ2FzZSgpID09ICdvcHRpb24nKSB7XG4gICAgICAgICAgICB2YXIgJHNlbCA9ICQodGhpcykucGFyZW50KCdzZWxlY3QnKTtcbiAgICAgICAgICAgIGlmIChzZWxlY3QgJiYgJHNlbFswXSAmJiAkc2VsWzBdLnR5cGUgPT0gJ3NlbGVjdC1vbmUnKSB7XG4gICAgICAgICAgICAgICAgLy8gZGVzZWxlY3QgYWxsIG90aGVyIG9wdGlvbnNcbiAgICAgICAgICAgICAgICAkc2VsLmZpbmQoJ29wdGlvbicpLnNlbGVjdGVkKGZhbHNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWQgPSBzZWxlY3Q7XG4gICAgICAgIH1cbiAgICB9KTtcbn07XG5cbi8vIGV4cG9zZSBkZWJ1ZyB2YXJcbiQuZm4uYWpheFN1Ym1pdC5kZWJ1ZyA9IGZhbHNlO1xuXG4vLyBoZWxwZXIgZm4gZm9yIGNvbnNvbGUgbG9nZ2luZ1xuZnVuY3Rpb24gbG9nKCkge1xuICAgIGlmICghJC5mbi5hamF4U3VibWl0LmRlYnVnKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIG1zZyA9ICdbanF1ZXJ5LmZvcm1dICcgKyBBcnJheS5wcm90b3R5cGUuam9pbi5jYWxsKGFyZ3VtZW50cywnJyk7XG4gICAgaWYgKHdpbmRvdy5jb25zb2xlICYmIHdpbmRvdy5jb25zb2xlLmxvZykge1xuICAgICAgICB3aW5kb3cuY29uc29sZS5sb2cobXNnKTtcbiAgICB9XG4gICAgZWxzZSBpZiAod2luZG93Lm9wZXJhICYmIHdpbmRvdy5vcGVyYS5wb3N0RXJyb3IpIHtcbiAgICAgICAgd2luZG93Lm9wZXJhLnBvc3RFcnJvcihtc2cpO1xuICAgIH1cbn1cblxufSkpO1xuIl0sImZpbGUiOiJwbHVnaW5zL2Zvcm0vZm9ybS5qcyJ9
