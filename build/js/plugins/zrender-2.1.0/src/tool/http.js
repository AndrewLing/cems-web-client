/**
 * @module zrender/tool/http
 */
define(function(require) {
    /**
     * @typedef {Object} IHTTPGetOption
     * @property {string} url
     * @property {Function} onsuccess
     * @property {Function} [onerror]
     */

    /**
     * HTTP Get
     * @param {string|IHTTPGetOption} url
     * @param {Function} onsuccess
     * @param {Function} [onerror]
     * @param {Object} [opts] 额外参数
     */
    function get(url, onsuccess, onerror, opts) {
        if (typeof(url) === 'object') {
            var obj = url;
            url = obj.url;
            onsuccess = obj.onsuccess;
            onerror = obj.onerror;
            opts = obj;
        } else {
            if (typeof(onerror) === 'object') {
                opts = onerror;
            }
        }
        /* jshint ignore:start */
        var xhr = window.XMLHttpRequest
            ? new XMLHttpRequest()
            : new ActiveXObject('Microsoft.XMLHTTP');
        xhr.open('GET', url, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) {
                    onsuccess && onsuccess(xhr.responseText);
                } else {
                    onerror && onerror();
                }
                xhr.onreadystatechange = new Function();
                xhr = null;
            }
        };

        xhr.send(null);
        /* jshint ignore:end */
    }

    return {
        get: get
    };
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL3Rvb2wvaHR0cC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBtb2R1bGUgenJlbmRlci90b29sL2h0dHBcbiAqL1xuZGVmaW5lKGZ1bmN0aW9uKHJlcXVpcmUpIHtcbiAgICAvKipcbiAgICAgKiBAdHlwZWRlZiB7T2JqZWN0fSBJSFRUUEdldE9wdGlvblxuICAgICAqIEBwcm9wZXJ0eSB7c3RyaW5nfSB1cmxcbiAgICAgKiBAcHJvcGVydHkge0Z1bmN0aW9ufSBvbnN1Y2Nlc3NcbiAgICAgKiBAcHJvcGVydHkge0Z1bmN0aW9ufSBbb25lcnJvcl1cbiAgICAgKi9cblxuICAgIC8qKlxuICAgICAqIEhUVFAgR2V0XG4gICAgICogQHBhcmFtIHtzdHJpbmd8SUhUVFBHZXRPcHRpb259IHVybFxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IG9uc3VjY2Vzc1xuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IFtvbmVycm9yXVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0c10g6aKd5aSW5Y+C5pWwXG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2V0KHVybCwgb25zdWNjZXNzLCBvbmVycm9yLCBvcHRzKSB7XG4gICAgICAgIGlmICh0eXBlb2YodXJsKSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHZhciBvYmogPSB1cmw7XG4gICAgICAgICAgICB1cmwgPSBvYmoudXJsO1xuICAgICAgICAgICAgb25zdWNjZXNzID0gb2JqLm9uc3VjY2VzcztcbiAgICAgICAgICAgIG9uZXJyb3IgPSBvYmoub25lcnJvcjtcbiAgICAgICAgICAgIG9wdHMgPSBvYmo7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mKG9uZXJyb3IpID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgIG9wdHMgPSBvbmVycm9yO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cbiAgICAgICAgdmFyIHhociA9IHdpbmRvdy5YTUxIdHRwUmVxdWVzdFxuICAgICAgICAgICAgPyBuZXcgWE1MSHR0cFJlcXVlc3QoKVxuICAgICAgICAgICAgOiBuZXcgQWN0aXZlWE9iamVjdCgnTWljcm9zb2Z0LlhNTEhUVFAnKTtcbiAgICAgICAgeGhyLm9wZW4oJ0dFVCcsIHVybCwgdHJ1ZSk7XG4gICAgICAgIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICh4aHIucmVhZHlTdGF0ZSA9PSA0KSB7XG4gICAgICAgICAgICAgICAgaWYgKHhoci5zdGF0dXMgPj0gMjAwICYmIHhoci5zdGF0dXMgPCAzMDAgfHwgeGhyLnN0YXR1cyA9PT0gMzA0KSB7XG4gICAgICAgICAgICAgICAgICAgIG9uc3VjY2VzcyAmJiBvbnN1Y2Nlc3MoeGhyLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgb25lcnJvciAmJiBvbmVycm9yKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBuZXcgRnVuY3Rpb24oKTtcbiAgICAgICAgICAgICAgICB4aHIgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHhoci5zZW5kKG51bGwpO1xuICAgICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGdldDogZ2V0XG4gICAgfTtcbn0pOyJdLCJmaWxlIjoicGx1Z2lucy96cmVuZGVyLTIuMS4wL3NyYy90b29sL2h0dHAuanMifQ==
