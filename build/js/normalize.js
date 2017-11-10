//>>excludeStart('excludeRequireCss', pragmas.excludeRequireCss)
/*
 * css.normalize.js
 *
 * CSS Normalization
 *
 * CSS paths are normalized based on an optional basePath and the RequireJS config
 *
 * Usage:
 *   normalize(css, fromBasePath, toBasePath);
 *
 * css: the stylesheet content to normalize
 * fromBasePath: the absolute base path of the css relative to any root (but without ../ backtracking)
 * toBasePath: the absolute new base path of the css relative to the same root
 * 
 * Absolute dependencies are left untouched.
 *
 * Urls in the CSS are picked up by regular expressions.
 * These will catch all statements of the form:
 *
 * url(*)
 * url('*')
 * url("*")
 * 
 * @import '*'
 * @import "*"
 *
 * (and so also @import url(*) variations)
 *
 * For urls needing normalization
 *
 */

define(function() {
  
  // regular expression for removing double slashes
  // eg http://www.example.com//my///url/here -> http://www.example.com/my/url/here
  var slashes = /([^:])\/+/g
  var removeDoubleSlashes = function(uri) {
    return uri.replace(slashes, '$1/');
  }

  // given a relative URI, and two absolute base URIs, convert it from one base to another
  var protocolRegEx = /[^\:\/]*:\/\/([^\/])*/;
  var absUrlRegEx = /^(\/|data:)/;
  function convertURIBase(uri, fromBase, toBase) {
    if (uri.match(absUrlRegEx) || uri.match(protocolRegEx))
      return uri;
    uri = removeDoubleSlashes(uri);
    // if toBase specifies a protocol path, ensure this is the same protocol as fromBase, if not
    // use absolute path at fromBase
    var toBaseProtocol = toBase.match(protocolRegEx);
    var fromBaseProtocol = fromBase.match(protocolRegEx);
    if (fromBaseProtocol && (!toBaseProtocol || toBaseProtocol[1] != fromBaseProtocol[1] || toBaseProtocol[2] != fromBaseProtocol[2]))
      return absoluteURI(uri, fromBase);
    
    else {
      return relativeURI(absoluteURI(uri, fromBase), toBase);
    }
  };
  
  // given a relative URI, calculate the absolute URI
  function absoluteURI(uri, base) {
    if (uri.substr(0, 2) == './')
      uri = uri.substr(2);

    // absolute urls are left in tact
    if (uri.match(absUrlRegEx) || uri.match(protocolRegEx))
      return uri;
    
    var baseParts = base.split('/');
    var uriParts = uri.split('/');
    
    baseParts.pop();
    
    while (curPart = uriParts.shift())
      if (curPart == '..')
        baseParts.pop();
      else
        baseParts.push(curPart);
    
    return baseParts.join('/');
  };


  // given an absolute URI, calculate the relative URI
  function relativeURI(uri, base) {
    
    // reduce base and uri strings to just their difference string
    var baseParts = base.split('/');
    baseParts.pop();
    base = baseParts.join('/') + '/';
    i = 0;
    while (base.substr(i, 1) == uri.substr(i, 1))
      i++;
    while (base.substr(i, 1) != '/')
      i--;
    base = base.substr(i + 1);
    uri = uri.substr(i + 1);

    // each base folder difference is thus a backtrack
    baseParts = base.split('/');
    var uriParts = uri.split('/');
    out = '';
    while (baseParts.shift())
      out += '../';
    
    // finally add uri parts
    while (curPart = uriParts.shift())
      out += curPart + '/';
    
    return out.substr(0, out.length - 1);
  };
  
  var normalizeCSS = function(source, fromBase, toBase) {

    fromBase = removeDoubleSlashes(fromBase);
    toBase = removeDoubleSlashes(toBase);

    var urlRegEx = /@import\s*("([^"]*)"|'([^']*)')|url\s*\((?!#)\s*(\s*"([^"]*)"|'([^']*)'|[^\)]*\s*)\s*\)/ig;
    var result, url, source;

    while (result = urlRegEx.exec(source)) {
      url = result[3] || result[2] || result[5] || result[6] || result[4];
      var newUrl;
      newUrl = convertURIBase(url, fromBase, toBase);
      var quoteLen = result[5] || result[6] ? 1 : 0;
      source = source.substr(0, urlRegEx.lastIndex - url.length - quoteLen - 1) + newUrl + source.substr(urlRegEx.lastIndex - quoteLen - 1);
      urlRegEx.lastIndex = urlRegEx.lastIndex + (newUrl.length - url.length);
    }
    
    return source;
  };
  
  normalizeCSS.convertURIBase = convertURIBase;
  normalizeCSS.absoluteURI = absoluteURI;
  normalizeCSS.relativeURI = relativeURI;
  
  return normalizeCSS;
});
//>>excludeEnd('excludeRequireCss')

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJub3JtYWxpemUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8+PmV4Y2x1ZGVTdGFydCgnZXhjbHVkZVJlcXVpcmVDc3MnLCBwcmFnbWFzLmV4Y2x1ZGVSZXF1aXJlQ3NzKVxuLypcbiAqIGNzcy5ub3JtYWxpemUuanNcbiAqXG4gKiBDU1MgTm9ybWFsaXphdGlvblxuICpcbiAqIENTUyBwYXRocyBhcmUgbm9ybWFsaXplZCBiYXNlZCBvbiBhbiBvcHRpb25hbCBiYXNlUGF0aCBhbmQgdGhlIFJlcXVpcmVKUyBjb25maWdcbiAqXG4gKiBVc2FnZTpcbiAqICAgbm9ybWFsaXplKGNzcywgZnJvbUJhc2VQYXRoLCB0b0Jhc2VQYXRoKTtcbiAqXG4gKiBjc3M6IHRoZSBzdHlsZXNoZWV0IGNvbnRlbnQgdG8gbm9ybWFsaXplXG4gKiBmcm9tQmFzZVBhdGg6IHRoZSBhYnNvbHV0ZSBiYXNlIHBhdGggb2YgdGhlIGNzcyByZWxhdGl2ZSB0byBhbnkgcm9vdCAoYnV0IHdpdGhvdXQgLi4vIGJhY2t0cmFja2luZylcbiAqIHRvQmFzZVBhdGg6IHRoZSBhYnNvbHV0ZSBuZXcgYmFzZSBwYXRoIG9mIHRoZSBjc3MgcmVsYXRpdmUgdG8gdGhlIHNhbWUgcm9vdFxuICogXG4gKiBBYnNvbHV0ZSBkZXBlbmRlbmNpZXMgYXJlIGxlZnQgdW50b3VjaGVkLlxuICpcbiAqIFVybHMgaW4gdGhlIENTUyBhcmUgcGlja2VkIHVwIGJ5IHJlZ3VsYXIgZXhwcmVzc2lvbnMuXG4gKiBUaGVzZSB3aWxsIGNhdGNoIGFsbCBzdGF0ZW1lbnRzIG9mIHRoZSBmb3JtOlxuICpcbiAqIHVybCgqKVxuICogdXJsKCcqJylcbiAqIHVybChcIipcIilcbiAqIFxuICogQGltcG9ydCAnKidcbiAqIEBpbXBvcnQgXCIqXCJcbiAqXG4gKiAoYW5kIHNvIGFsc28gQGltcG9ydCB1cmwoKikgdmFyaWF0aW9ucylcbiAqXG4gKiBGb3IgdXJscyBuZWVkaW5nIG5vcm1hbGl6YXRpb25cbiAqXG4gKi9cblxuZGVmaW5lKGZ1bmN0aW9uKCkge1xuICBcbiAgLy8gcmVndWxhciBleHByZXNzaW9uIGZvciByZW1vdmluZyBkb3VibGUgc2xhc2hlc1xuICAvLyBlZyBodHRwOi8vd3d3LmV4YW1wbGUuY29tLy9teS8vL3VybC9oZXJlIC0+IGh0dHA6Ly93d3cuZXhhbXBsZS5jb20vbXkvdXJsL2hlcmVcbiAgdmFyIHNsYXNoZXMgPSAvKFteOl0pXFwvKy9nXG4gIHZhciByZW1vdmVEb3VibGVTbGFzaGVzID0gZnVuY3Rpb24odXJpKSB7XG4gICAgcmV0dXJuIHVyaS5yZXBsYWNlKHNsYXNoZXMsICckMS8nKTtcbiAgfVxuXG4gIC8vIGdpdmVuIGEgcmVsYXRpdmUgVVJJLCBhbmQgdHdvIGFic29sdXRlIGJhc2UgVVJJcywgY29udmVydCBpdCBmcm9tIG9uZSBiYXNlIHRvIGFub3RoZXJcbiAgdmFyIHByb3RvY29sUmVnRXggPSAvW15cXDpcXC9dKjpcXC9cXC8oW15cXC9dKSovO1xuICB2YXIgYWJzVXJsUmVnRXggPSAvXihcXC98ZGF0YTopLztcbiAgZnVuY3Rpb24gY29udmVydFVSSUJhc2UodXJpLCBmcm9tQmFzZSwgdG9CYXNlKSB7XG4gICAgaWYgKHVyaS5tYXRjaChhYnNVcmxSZWdFeCkgfHwgdXJpLm1hdGNoKHByb3RvY29sUmVnRXgpKVxuICAgICAgcmV0dXJuIHVyaTtcbiAgICB1cmkgPSByZW1vdmVEb3VibGVTbGFzaGVzKHVyaSk7XG4gICAgLy8gaWYgdG9CYXNlIHNwZWNpZmllcyBhIHByb3RvY29sIHBhdGgsIGVuc3VyZSB0aGlzIGlzIHRoZSBzYW1lIHByb3RvY29sIGFzIGZyb21CYXNlLCBpZiBub3RcbiAgICAvLyB1c2UgYWJzb2x1dGUgcGF0aCBhdCBmcm9tQmFzZVxuICAgIHZhciB0b0Jhc2VQcm90b2NvbCA9IHRvQmFzZS5tYXRjaChwcm90b2NvbFJlZ0V4KTtcbiAgICB2YXIgZnJvbUJhc2VQcm90b2NvbCA9IGZyb21CYXNlLm1hdGNoKHByb3RvY29sUmVnRXgpO1xuICAgIGlmIChmcm9tQmFzZVByb3RvY29sICYmICghdG9CYXNlUHJvdG9jb2wgfHwgdG9CYXNlUHJvdG9jb2xbMV0gIT0gZnJvbUJhc2VQcm90b2NvbFsxXSB8fCB0b0Jhc2VQcm90b2NvbFsyXSAhPSBmcm9tQmFzZVByb3RvY29sWzJdKSlcbiAgICAgIHJldHVybiBhYnNvbHV0ZVVSSSh1cmksIGZyb21CYXNlKTtcbiAgICBcbiAgICBlbHNlIHtcbiAgICAgIHJldHVybiByZWxhdGl2ZVVSSShhYnNvbHV0ZVVSSSh1cmksIGZyb21CYXNlKSwgdG9CYXNlKTtcbiAgICB9XG4gIH07XG4gIFxuICAvLyBnaXZlbiBhIHJlbGF0aXZlIFVSSSwgY2FsY3VsYXRlIHRoZSBhYnNvbHV0ZSBVUklcbiAgZnVuY3Rpb24gYWJzb2x1dGVVUkkodXJpLCBiYXNlKSB7XG4gICAgaWYgKHVyaS5zdWJzdHIoMCwgMikgPT0gJy4vJylcbiAgICAgIHVyaSA9IHVyaS5zdWJzdHIoMik7XG5cbiAgICAvLyBhYnNvbHV0ZSB1cmxzIGFyZSBsZWZ0IGluIHRhY3RcbiAgICBpZiAodXJpLm1hdGNoKGFic1VybFJlZ0V4KSB8fCB1cmkubWF0Y2gocHJvdG9jb2xSZWdFeCkpXG4gICAgICByZXR1cm4gdXJpO1xuICAgIFxuICAgIHZhciBiYXNlUGFydHMgPSBiYXNlLnNwbGl0KCcvJyk7XG4gICAgdmFyIHVyaVBhcnRzID0gdXJpLnNwbGl0KCcvJyk7XG4gICAgXG4gICAgYmFzZVBhcnRzLnBvcCgpO1xuICAgIFxuICAgIHdoaWxlIChjdXJQYXJ0ID0gdXJpUGFydHMuc2hpZnQoKSlcbiAgICAgIGlmIChjdXJQYXJ0ID09ICcuLicpXG4gICAgICAgIGJhc2VQYXJ0cy5wb3AoKTtcbiAgICAgIGVsc2VcbiAgICAgICAgYmFzZVBhcnRzLnB1c2goY3VyUGFydCk7XG4gICAgXG4gICAgcmV0dXJuIGJhc2VQYXJ0cy5qb2luKCcvJyk7XG4gIH07XG5cblxuICAvLyBnaXZlbiBhbiBhYnNvbHV0ZSBVUkksIGNhbGN1bGF0ZSB0aGUgcmVsYXRpdmUgVVJJXG4gIGZ1bmN0aW9uIHJlbGF0aXZlVVJJKHVyaSwgYmFzZSkge1xuICAgIFxuICAgIC8vIHJlZHVjZSBiYXNlIGFuZCB1cmkgc3RyaW5ncyB0byBqdXN0IHRoZWlyIGRpZmZlcmVuY2Ugc3RyaW5nXG4gICAgdmFyIGJhc2VQYXJ0cyA9IGJhc2Uuc3BsaXQoJy8nKTtcbiAgICBiYXNlUGFydHMucG9wKCk7XG4gICAgYmFzZSA9IGJhc2VQYXJ0cy5qb2luKCcvJykgKyAnLyc7XG4gICAgaSA9IDA7XG4gICAgd2hpbGUgKGJhc2Uuc3Vic3RyKGksIDEpID09IHVyaS5zdWJzdHIoaSwgMSkpXG4gICAgICBpKys7XG4gICAgd2hpbGUgKGJhc2Uuc3Vic3RyKGksIDEpICE9ICcvJylcbiAgICAgIGktLTtcbiAgICBiYXNlID0gYmFzZS5zdWJzdHIoaSArIDEpO1xuICAgIHVyaSA9IHVyaS5zdWJzdHIoaSArIDEpO1xuXG4gICAgLy8gZWFjaCBiYXNlIGZvbGRlciBkaWZmZXJlbmNlIGlzIHRodXMgYSBiYWNrdHJhY2tcbiAgICBiYXNlUGFydHMgPSBiYXNlLnNwbGl0KCcvJyk7XG4gICAgdmFyIHVyaVBhcnRzID0gdXJpLnNwbGl0KCcvJyk7XG4gICAgb3V0ID0gJyc7XG4gICAgd2hpbGUgKGJhc2VQYXJ0cy5zaGlmdCgpKVxuICAgICAgb3V0ICs9ICcuLi8nO1xuICAgIFxuICAgIC8vIGZpbmFsbHkgYWRkIHVyaSBwYXJ0c1xuICAgIHdoaWxlIChjdXJQYXJ0ID0gdXJpUGFydHMuc2hpZnQoKSlcbiAgICAgIG91dCArPSBjdXJQYXJ0ICsgJy8nO1xuICAgIFxuICAgIHJldHVybiBvdXQuc3Vic3RyKDAsIG91dC5sZW5ndGggLSAxKTtcbiAgfTtcbiAgXG4gIHZhciBub3JtYWxpemVDU1MgPSBmdW5jdGlvbihzb3VyY2UsIGZyb21CYXNlLCB0b0Jhc2UpIHtcblxuICAgIGZyb21CYXNlID0gcmVtb3ZlRG91YmxlU2xhc2hlcyhmcm9tQmFzZSk7XG4gICAgdG9CYXNlID0gcmVtb3ZlRG91YmxlU2xhc2hlcyh0b0Jhc2UpO1xuXG4gICAgdmFyIHVybFJlZ0V4ID0gL0BpbXBvcnRcXHMqKFwiKFteXCJdKilcInwnKFteJ10qKScpfHVybFxccypcXCgoPyEjKVxccyooXFxzKlwiKFteXCJdKilcInwnKFteJ10qKSd8W15cXCldKlxccyopXFxzKlxcKS9pZztcbiAgICB2YXIgcmVzdWx0LCB1cmwsIHNvdXJjZTtcblxuICAgIHdoaWxlIChyZXN1bHQgPSB1cmxSZWdFeC5leGVjKHNvdXJjZSkpIHtcbiAgICAgIHVybCA9IHJlc3VsdFszXSB8fCByZXN1bHRbMl0gfHwgcmVzdWx0WzVdIHx8IHJlc3VsdFs2XSB8fCByZXN1bHRbNF07XG4gICAgICB2YXIgbmV3VXJsO1xuICAgICAgbmV3VXJsID0gY29udmVydFVSSUJhc2UodXJsLCBmcm9tQmFzZSwgdG9CYXNlKTtcbiAgICAgIHZhciBxdW90ZUxlbiA9IHJlc3VsdFs1XSB8fCByZXN1bHRbNl0gPyAxIDogMDtcbiAgICAgIHNvdXJjZSA9IHNvdXJjZS5zdWJzdHIoMCwgdXJsUmVnRXgubGFzdEluZGV4IC0gdXJsLmxlbmd0aCAtIHF1b3RlTGVuIC0gMSkgKyBuZXdVcmwgKyBzb3VyY2Uuc3Vic3RyKHVybFJlZ0V4Lmxhc3RJbmRleCAtIHF1b3RlTGVuIC0gMSk7XG4gICAgICB1cmxSZWdFeC5sYXN0SW5kZXggPSB1cmxSZWdFeC5sYXN0SW5kZXggKyAobmV3VXJsLmxlbmd0aCAtIHVybC5sZW5ndGgpO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gc291cmNlO1xuICB9O1xuICBcbiAgbm9ybWFsaXplQ1NTLmNvbnZlcnRVUklCYXNlID0gY29udmVydFVSSUJhc2U7XG4gIG5vcm1hbGl6ZUNTUy5hYnNvbHV0ZVVSSSA9IGFic29sdXRlVVJJO1xuICBub3JtYWxpemVDU1MucmVsYXRpdmVVUkkgPSByZWxhdGl2ZVVSSTtcbiAgXG4gIHJldHVybiBub3JtYWxpemVDU1M7XG59KTtcbi8vPj5leGNsdWRlRW5kKCdleGNsdWRlUmVxdWlyZUNzcycpXG4iXSwiZmlsZSI6Im5vcm1hbGl6ZS5qcyJ9
