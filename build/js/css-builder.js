define(['require', './normalize'], function(req, normalize) {
  var cssAPI = {};

  var isWindows = !!process.platform.match(/^win/);

  function compress(css) {
    if (config.optimizeCss == 'none') {
      return css;
    }
    
    if (typeof process !== "undefined" && process.versions && !!process.versions.node && require.nodeRequire) {
      try {
        var csso = require.nodeRequire('csso');
      }
      catch(e) {
        console.log('Compression module not installed. Use "npm install csso -g" to enable.');
        return css;
      }
      var csslen = css.length;
      try {
        css =  csso.justDoIt(css);
      }
      catch(e) {
        console.log('Compression failed due to a CSS syntax error.');
        return css;
      }
      console.log('Compressed CSS output to ' + Math.round(css.length / csslen * 100) + '%.');
      return css;
    }
    console.log('Compression not supported outside of nodejs environments.');
    return css;
  }

  //load file code - stolen from text plugin
  function loadFile(path) {
    if (typeof process !== "undefined" && process.versions && !!process.versions.node && require.nodeRequire) {
      var fs = require.nodeRequire('fs');
      var file = fs.readFileSync(path, 'utf8');
      if (file.indexOf('\uFEFF') === 0)
        return file.substring(1);
      return file;
    }
    else {
      var file = new java.io.File(path),
        lineSeparator = java.lang.System.getProperty("line.separator"),
        input = new java.io.BufferedReader(new java.io.InputStreamReader(new java.io.FileInputStream(file), 'utf-8')),
        stringBuffer, line;
      try {
        stringBuffer = new java.lang.StringBuffer();
        line = input.readLine();
        if (line && line.length() && line.charAt(0) === 0xfeff)
          line = line.substring(1);
        stringBuffer.append(line);
        while ((line = input.readLine()) !== null) {
          stringBuffer.append(lineSeparator).append(line);
        }
        return String(stringBuffer.toString());
      }
      finally {
        input.close();
      }
    }
  }


  function saveFile(path, data) {
    if (typeof process !== "undefined" && process.versions && !!process.versions.node && require.nodeRequire) {
      var fs = require.nodeRequire('fs');
      fs.writeFileSync(path, data, 'utf8');
    }
    else {
      var content = new java.lang.String(data);
      var output = new java.io.BufferedWriter(new java.io.OutputStreamWriter(new java.io.FileOutputStream(path), 'utf-8'));

      try {
        output.write(content, 0, content.length());
        output.flush();
      }
      finally {
        output.close();
      }
    }
  }

  //when adding to the link buffer, paths are normalised to the baseUrl
  //when removing from the link buffer, paths are normalised to the output file path
  function escape(content) {
    return content.replace(/(["'\\])/g, '\\$1')
      .replace(/[\f]/g, "\\f")
      .replace(/[\b]/g, "\\b")
      .replace(/[\n]/g, "\\n")
      .replace(/[\t]/g, "\\t")
      .replace(/[\r]/g, "\\r");
  }

  // NB add @media query support for media imports
  var importRegEx = /@import\s*(url)?\s*(('([^']*)'|"([^"]*)")|\(('([^']*)'|"([^"]*)"|([^\)]*))\))\s*;?/g;
  var absUrlRegEx = /^([^\:\/]+:\/)?\//;
  
  // Write Css module definition
  var writeCSSDefinition = "define('@writecss', function() {return function writeCss(c) {var d=document,a='appendChild',i='styleSheet',s=d.createElement('style');s.type='text/css';d.getElementsByTagName('head')[0][a](s);s[i]?s[i].cssText=c:s[a](d.createTextNode(c));};});";

  var siteRoot;

  var baseParts = req.toUrl('base_url').split('/');
  baseParts[baseParts.length - 1] = '';
  var baseUrl = baseParts.join('/');

  var curModule = 0;
  var config;

  var writeCSSForLayer = true;
  var layerBuffer = [];
  var cssBuffer = {};

  cssAPI.load = function(name, req, load, _config) {
    //store config
    config = config || _config;

    if (!siteRoot) {
      siteRoot = path.resolve(config.dir || path.dirname(config.out), config.siteRoot || '.') + '/';
      if (isWindows)
        siteRoot = siteRoot.replace(/\\/g, '/');
    }

    //external URLS don't get added (just like JS requires)
    if (name.match(absUrlRegEx))
      return load();

    var fileUrl = req.toUrl(name + '.css');
    if (isWindows)
      fileUrl = fileUrl.replace(/\\/g, '/');

    // rebase to the output directory if based on the source directory;
    // baseUrl points always to the output directory, fileUrl only if
    // it is not prefixed by a computed path (relative too)
    var fileSiteUrl = fileUrl;
    if (fileSiteUrl.indexOf(baseUrl) < 0) {
      var appRoot = req.toUrl(config.appDir);
      if (isWindows)
        appRoot = appRoot.replace(/\\/g, '/');
      if (fileSiteUrl.indexOf(appRoot) == 0)
        fileSiteUrl = siteRoot + fileSiteUrl.substring(appRoot.length);
    }

    //add to the buffer
    cssBuffer[name] = normalize(loadFile(fileUrl), fileSiteUrl, siteRoot);

    load();
  }

  cssAPI.normalize = function(name, normalize) {
    if (name.substr(name.length - 4, 4) == '.css')
      name = name.substr(0, name.length - 4);
    return normalize(name);
  }

  cssAPI.write = function(pluginName, moduleName, write, parse) {
    var cssModule;
    
    //external URLS don't get added (just like JS requires)
    if (moduleName.match(absUrlRegEx))
      return;

    layerBuffer.push(cssBuffer[moduleName]);
    
    if (!global._requirejsCssData) {
      global._requirejsCssData = {
        usedBy: {css: true},
        css: ''
      }
    } else {
      global._requirejsCssData.usedBy.css = true;
    }

    if (config.buildCSS != false) {
      var style = cssBuffer[moduleName];

      if (config.writeCSSModule && style) {
 	    if (writeCSSForLayer) {
    	  writeCSSForLayer = false;
          write(writeCSSDefinition);
        }

        cssModule = 'define(["@writecss"], function(writeCss){\n writeCss("'+ escape(compress(style)) +'");\n})';
      }
      else {
		cssModule = 'define(function(){})';
      }

      write.asModule(pluginName + '!' + moduleName, cssModule);
    }
  }

  cssAPI.onLayerEnd = function(write, data) {
    if (config.separateCSS && config.IESelectorLimit)
      throw 'RequireCSS: separateCSS option is not compatible with ensuring the IE selector limit';

    if (config.separateCSS) {
      var outPath = data.path.replace(/(\.js)?$/, '.css');
      console.log('Writing CSS! file: ' + outPath + '\n');

      var css = layerBuffer.join('');

      process.nextTick(function() {
        if (global._requirejsCssData) {
          css = global._requirejsCssData.css = css + global._requirejsCssData.css;
          delete global._requirejsCssData.usedBy.css;
          if (Object.keys(global._requirejsCssData.usedBy).length === 0) {
            delete global._requirejsCssData;
          }
        }
        
        saveFile(outPath, compress(css));
      });

    }
    else if (config.buildCSS != false && config.writeCSSModule != true) {
      var styles = config.IESelectorLimit ? layerBuffer : [layerBuffer.join('')];
      for (var i = 0; i < styles.length; i++) {
        if (styles[i] == '')
          return;
        write(
          "(function(c){var d=document,a='appendChild',i='styleSheet',s=d.createElement('style');s.type='text/css';d.getElementsByTagName('head')[0][a](s);s[i]?s[i].cssText=c:s[a](d.createTextNode(c));})\n"
          + "('" + escape(compress(styles[i])) + "');\n"
        );
      }
    }
    //clear layer buffer for next layer
    layerBuffer = [];
    writeCSSForLayer = true;
  }

  return cssAPI;
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJjc3MtYnVpbGRlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJkZWZpbmUoWydyZXF1aXJlJywgJy4vbm9ybWFsaXplJ10sIGZ1bmN0aW9uKHJlcSwgbm9ybWFsaXplKSB7XG4gIHZhciBjc3NBUEkgPSB7fTtcblxuICB2YXIgaXNXaW5kb3dzID0gISFwcm9jZXNzLnBsYXRmb3JtLm1hdGNoKC9ed2luLyk7XG5cbiAgZnVuY3Rpb24gY29tcHJlc3MoY3NzKSB7XG4gICAgaWYgKGNvbmZpZy5vcHRpbWl6ZUNzcyA9PSAnbm9uZScpIHtcbiAgICAgIHJldHVybiBjc3M7XG4gICAgfVxuICAgIFxuICAgIGlmICh0eXBlb2YgcHJvY2VzcyAhPT0gXCJ1bmRlZmluZWRcIiAmJiBwcm9jZXNzLnZlcnNpb25zICYmICEhcHJvY2Vzcy52ZXJzaW9ucy5ub2RlICYmIHJlcXVpcmUubm9kZVJlcXVpcmUpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHZhciBjc3NvID0gcmVxdWlyZS5ub2RlUmVxdWlyZSgnY3NzbycpO1xuICAgICAgfVxuICAgICAgY2F0Y2goZSkge1xuICAgICAgICBjb25zb2xlLmxvZygnQ29tcHJlc3Npb24gbW9kdWxlIG5vdCBpbnN0YWxsZWQuIFVzZSBcIm5wbSBpbnN0YWxsIGNzc28gLWdcIiB0byBlbmFibGUuJyk7XG4gICAgICAgIHJldHVybiBjc3M7XG4gICAgICB9XG4gICAgICB2YXIgY3NzbGVuID0gY3NzLmxlbmd0aDtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNzcyA9ICBjc3NvLmp1c3REb0l0KGNzcyk7XG4gICAgICB9XG4gICAgICBjYXRjaChlKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdDb21wcmVzc2lvbiBmYWlsZWQgZHVlIHRvIGEgQ1NTIHN5bnRheCBlcnJvci4nKTtcbiAgICAgICAgcmV0dXJuIGNzcztcbiAgICAgIH1cbiAgICAgIGNvbnNvbGUubG9nKCdDb21wcmVzc2VkIENTUyBvdXRwdXQgdG8gJyArIE1hdGgucm91bmQoY3NzLmxlbmd0aCAvIGNzc2xlbiAqIDEwMCkgKyAnJS4nKTtcbiAgICAgIHJldHVybiBjc3M7XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKCdDb21wcmVzc2lvbiBub3Qgc3VwcG9ydGVkIG91dHNpZGUgb2Ygbm9kZWpzIGVudmlyb25tZW50cy4nKTtcbiAgICByZXR1cm4gY3NzO1xuICB9XG5cbiAgLy9sb2FkIGZpbGUgY29kZSAtIHN0b2xlbiBmcm9tIHRleHQgcGx1Z2luXG4gIGZ1bmN0aW9uIGxvYWRGaWxlKHBhdGgpIHtcbiAgICBpZiAodHlwZW9mIHByb2Nlc3MgIT09IFwidW5kZWZpbmVkXCIgJiYgcHJvY2Vzcy52ZXJzaW9ucyAmJiAhIXByb2Nlc3MudmVyc2lvbnMubm9kZSAmJiByZXF1aXJlLm5vZGVSZXF1aXJlKSB7XG4gICAgICB2YXIgZnMgPSByZXF1aXJlLm5vZGVSZXF1aXJlKCdmcycpO1xuICAgICAgdmFyIGZpbGUgPSBmcy5yZWFkRmlsZVN5bmMocGF0aCwgJ3V0ZjgnKTtcbiAgICAgIGlmIChmaWxlLmluZGV4T2YoJ1xcdUZFRkYnKSA9PT0gMClcbiAgICAgICAgcmV0dXJuIGZpbGUuc3Vic3RyaW5nKDEpO1xuICAgICAgcmV0dXJuIGZpbGU7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdmFyIGZpbGUgPSBuZXcgamF2YS5pby5GaWxlKHBhdGgpLFxuICAgICAgICBsaW5lU2VwYXJhdG9yID0gamF2YS5sYW5nLlN5c3RlbS5nZXRQcm9wZXJ0eShcImxpbmUuc2VwYXJhdG9yXCIpLFxuICAgICAgICBpbnB1dCA9IG5ldyBqYXZhLmlvLkJ1ZmZlcmVkUmVhZGVyKG5ldyBqYXZhLmlvLklucHV0U3RyZWFtUmVhZGVyKG5ldyBqYXZhLmlvLkZpbGVJbnB1dFN0cmVhbShmaWxlKSwgJ3V0Zi04JykpLFxuICAgICAgICBzdHJpbmdCdWZmZXIsIGxpbmU7XG4gICAgICB0cnkge1xuICAgICAgICBzdHJpbmdCdWZmZXIgPSBuZXcgamF2YS5sYW5nLlN0cmluZ0J1ZmZlcigpO1xuICAgICAgICBsaW5lID0gaW5wdXQucmVhZExpbmUoKTtcbiAgICAgICAgaWYgKGxpbmUgJiYgbGluZS5sZW5ndGgoKSAmJiBsaW5lLmNoYXJBdCgwKSA9PT0gMHhmZWZmKVxuICAgICAgICAgIGxpbmUgPSBsaW5lLnN1YnN0cmluZygxKTtcbiAgICAgICAgc3RyaW5nQnVmZmVyLmFwcGVuZChsaW5lKTtcbiAgICAgICAgd2hpbGUgKChsaW5lID0gaW5wdXQucmVhZExpbmUoKSkgIT09IG51bGwpIHtcbiAgICAgICAgICBzdHJpbmdCdWZmZXIuYXBwZW5kKGxpbmVTZXBhcmF0b3IpLmFwcGVuZChsaW5lKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gU3RyaW5nKHN0cmluZ0J1ZmZlci50b1N0cmluZygpKTtcbiAgICAgIH1cbiAgICAgIGZpbmFsbHkge1xuICAgICAgICBpbnB1dC5jbG9zZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG5cbiAgZnVuY3Rpb24gc2F2ZUZpbGUocGF0aCwgZGF0YSkge1xuICAgIGlmICh0eXBlb2YgcHJvY2VzcyAhPT0gXCJ1bmRlZmluZWRcIiAmJiBwcm9jZXNzLnZlcnNpb25zICYmICEhcHJvY2Vzcy52ZXJzaW9ucy5ub2RlICYmIHJlcXVpcmUubm9kZVJlcXVpcmUpIHtcbiAgICAgIHZhciBmcyA9IHJlcXVpcmUubm9kZVJlcXVpcmUoJ2ZzJyk7XG4gICAgICBmcy53cml0ZUZpbGVTeW5jKHBhdGgsIGRhdGEsICd1dGY4Jyk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdmFyIGNvbnRlbnQgPSBuZXcgamF2YS5sYW5nLlN0cmluZyhkYXRhKTtcbiAgICAgIHZhciBvdXRwdXQgPSBuZXcgamF2YS5pby5CdWZmZXJlZFdyaXRlcihuZXcgamF2YS5pby5PdXRwdXRTdHJlYW1Xcml0ZXIobmV3IGphdmEuaW8uRmlsZU91dHB1dFN0cmVhbShwYXRoKSwgJ3V0Zi04JykpO1xuXG4gICAgICB0cnkge1xuICAgICAgICBvdXRwdXQud3JpdGUoY29udGVudCwgMCwgY29udGVudC5sZW5ndGgoKSk7XG4gICAgICAgIG91dHB1dC5mbHVzaCgpO1xuICAgICAgfVxuICAgICAgZmluYWxseSB7XG4gICAgICAgIG91dHB1dC5jbG9zZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vd2hlbiBhZGRpbmcgdG8gdGhlIGxpbmsgYnVmZmVyLCBwYXRocyBhcmUgbm9ybWFsaXNlZCB0byB0aGUgYmFzZVVybFxuICAvL3doZW4gcmVtb3ZpbmcgZnJvbSB0aGUgbGluayBidWZmZXIsIHBhdGhzIGFyZSBub3JtYWxpc2VkIHRvIHRoZSBvdXRwdXQgZmlsZSBwYXRoXG4gIGZ1bmN0aW9uIGVzY2FwZShjb250ZW50KSB7XG4gICAgcmV0dXJuIGNvbnRlbnQucmVwbGFjZSgvKFtcIidcXFxcXSkvZywgJ1xcXFwkMScpXG4gICAgICAucmVwbGFjZSgvW1xcZl0vZywgXCJcXFxcZlwiKVxuICAgICAgLnJlcGxhY2UoL1tcXGJdL2csIFwiXFxcXGJcIilcbiAgICAgIC5yZXBsYWNlKC9bXFxuXS9nLCBcIlxcXFxuXCIpXG4gICAgICAucmVwbGFjZSgvW1xcdF0vZywgXCJcXFxcdFwiKVxuICAgICAgLnJlcGxhY2UoL1tcXHJdL2csIFwiXFxcXHJcIik7XG4gIH1cblxuICAvLyBOQiBhZGQgQG1lZGlhIHF1ZXJ5IHN1cHBvcnQgZm9yIG1lZGlhIGltcG9ydHNcbiAgdmFyIGltcG9ydFJlZ0V4ID0gL0BpbXBvcnRcXHMqKHVybCk/XFxzKigoJyhbXiddKiknfFwiKFteXCJdKilcIil8XFwoKCcoW14nXSopJ3xcIihbXlwiXSopXCJ8KFteXFwpXSopKVxcKSlcXHMqOz8vZztcbiAgdmFyIGFic1VybFJlZ0V4ID0gL14oW15cXDpcXC9dKzpcXC8pP1xcLy87XG4gIFxuICAvLyBXcml0ZSBDc3MgbW9kdWxlIGRlZmluaXRpb25cbiAgdmFyIHdyaXRlQ1NTRGVmaW5pdGlvbiA9IFwiZGVmaW5lKCdAd3JpdGVjc3MnLCBmdW5jdGlvbigpIHtyZXR1cm4gZnVuY3Rpb24gd3JpdGVDc3MoYykge3ZhciBkPWRvY3VtZW50LGE9J2FwcGVuZENoaWxkJyxpPSdzdHlsZVNoZWV0JyxzPWQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtzLnR5cGU9J3RleHQvY3NzJztkLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF1bYV0ocyk7c1tpXT9zW2ldLmNzc1RleHQ9YzpzW2FdKGQuY3JlYXRlVGV4dE5vZGUoYykpO307fSk7XCI7XG5cbiAgdmFyIHNpdGVSb290O1xuXG4gIHZhciBiYXNlUGFydHMgPSByZXEudG9VcmwoJ2Jhc2VfdXJsJykuc3BsaXQoJy8nKTtcbiAgYmFzZVBhcnRzW2Jhc2VQYXJ0cy5sZW5ndGggLSAxXSA9ICcnO1xuICB2YXIgYmFzZVVybCA9IGJhc2VQYXJ0cy5qb2luKCcvJyk7XG5cbiAgdmFyIGN1ck1vZHVsZSA9IDA7XG4gIHZhciBjb25maWc7XG5cbiAgdmFyIHdyaXRlQ1NTRm9yTGF5ZXIgPSB0cnVlO1xuICB2YXIgbGF5ZXJCdWZmZXIgPSBbXTtcbiAgdmFyIGNzc0J1ZmZlciA9IHt9O1xuXG4gIGNzc0FQSS5sb2FkID0gZnVuY3Rpb24obmFtZSwgcmVxLCBsb2FkLCBfY29uZmlnKSB7XG4gICAgLy9zdG9yZSBjb25maWdcbiAgICBjb25maWcgPSBjb25maWcgfHwgX2NvbmZpZztcblxuICAgIGlmICghc2l0ZVJvb3QpIHtcbiAgICAgIHNpdGVSb290ID0gcGF0aC5yZXNvbHZlKGNvbmZpZy5kaXIgfHwgcGF0aC5kaXJuYW1lKGNvbmZpZy5vdXQpLCBjb25maWcuc2l0ZVJvb3QgfHwgJy4nKSArICcvJztcbiAgICAgIGlmIChpc1dpbmRvd3MpXG4gICAgICAgIHNpdGVSb290ID0gc2l0ZVJvb3QucmVwbGFjZSgvXFxcXC9nLCAnLycpO1xuICAgIH1cblxuICAgIC8vZXh0ZXJuYWwgVVJMUyBkb24ndCBnZXQgYWRkZWQgKGp1c3QgbGlrZSBKUyByZXF1aXJlcylcbiAgICBpZiAobmFtZS5tYXRjaChhYnNVcmxSZWdFeCkpXG4gICAgICByZXR1cm4gbG9hZCgpO1xuXG4gICAgdmFyIGZpbGVVcmwgPSByZXEudG9VcmwobmFtZSArICcuY3NzJyk7XG4gICAgaWYgKGlzV2luZG93cylcbiAgICAgIGZpbGVVcmwgPSBmaWxlVXJsLnJlcGxhY2UoL1xcXFwvZywgJy8nKTtcblxuICAgIC8vIHJlYmFzZSB0byB0aGUgb3V0cHV0IGRpcmVjdG9yeSBpZiBiYXNlZCBvbiB0aGUgc291cmNlIGRpcmVjdG9yeTtcbiAgICAvLyBiYXNlVXJsIHBvaW50cyBhbHdheXMgdG8gdGhlIG91dHB1dCBkaXJlY3RvcnksIGZpbGVVcmwgb25seSBpZlxuICAgIC8vIGl0IGlzIG5vdCBwcmVmaXhlZCBieSBhIGNvbXB1dGVkIHBhdGggKHJlbGF0aXZlIHRvbylcbiAgICB2YXIgZmlsZVNpdGVVcmwgPSBmaWxlVXJsO1xuICAgIGlmIChmaWxlU2l0ZVVybC5pbmRleE9mKGJhc2VVcmwpIDwgMCkge1xuICAgICAgdmFyIGFwcFJvb3QgPSByZXEudG9VcmwoY29uZmlnLmFwcERpcik7XG4gICAgICBpZiAoaXNXaW5kb3dzKVxuICAgICAgICBhcHBSb290ID0gYXBwUm9vdC5yZXBsYWNlKC9cXFxcL2csICcvJyk7XG4gICAgICBpZiAoZmlsZVNpdGVVcmwuaW5kZXhPZihhcHBSb290KSA9PSAwKVxuICAgICAgICBmaWxlU2l0ZVVybCA9IHNpdGVSb290ICsgZmlsZVNpdGVVcmwuc3Vic3RyaW5nKGFwcFJvb3QubGVuZ3RoKTtcbiAgICB9XG5cbiAgICAvL2FkZCB0byB0aGUgYnVmZmVyXG4gICAgY3NzQnVmZmVyW25hbWVdID0gbm9ybWFsaXplKGxvYWRGaWxlKGZpbGVVcmwpLCBmaWxlU2l0ZVVybCwgc2l0ZVJvb3QpO1xuXG4gICAgbG9hZCgpO1xuICB9XG5cbiAgY3NzQVBJLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uKG5hbWUsIG5vcm1hbGl6ZSkge1xuICAgIGlmIChuYW1lLnN1YnN0cihuYW1lLmxlbmd0aCAtIDQsIDQpID09ICcuY3NzJylcbiAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigwLCBuYW1lLmxlbmd0aCAtIDQpO1xuICAgIHJldHVybiBub3JtYWxpemUobmFtZSk7XG4gIH1cblxuICBjc3NBUEkud3JpdGUgPSBmdW5jdGlvbihwbHVnaW5OYW1lLCBtb2R1bGVOYW1lLCB3cml0ZSwgcGFyc2UpIHtcbiAgICB2YXIgY3NzTW9kdWxlO1xuICAgIFxuICAgIC8vZXh0ZXJuYWwgVVJMUyBkb24ndCBnZXQgYWRkZWQgKGp1c3QgbGlrZSBKUyByZXF1aXJlcylcbiAgICBpZiAobW9kdWxlTmFtZS5tYXRjaChhYnNVcmxSZWdFeCkpXG4gICAgICByZXR1cm47XG5cbiAgICBsYXllckJ1ZmZlci5wdXNoKGNzc0J1ZmZlclttb2R1bGVOYW1lXSk7XG4gICAgXG4gICAgaWYgKCFnbG9iYWwuX3JlcXVpcmVqc0Nzc0RhdGEpIHtcbiAgICAgIGdsb2JhbC5fcmVxdWlyZWpzQ3NzRGF0YSA9IHtcbiAgICAgICAgdXNlZEJ5OiB7Y3NzOiB0cnVlfSxcbiAgICAgICAgY3NzOiAnJ1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBnbG9iYWwuX3JlcXVpcmVqc0Nzc0RhdGEudXNlZEJ5LmNzcyA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKGNvbmZpZy5idWlsZENTUyAhPSBmYWxzZSkge1xuICAgICAgdmFyIHN0eWxlID0gY3NzQnVmZmVyW21vZHVsZU5hbWVdO1xuXG4gICAgICBpZiAoY29uZmlnLndyaXRlQ1NTTW9kdWxlICYmIHN0eWxlKSB7XG4gXHQgICAgaWYgKHdyaXRlQ1NTRm9yTGF5ZXIpIHtcbiAgICBcdCAgd3JpdGVDU1NGb3JMYXllciA9IGZhbHNlO1xuICAgICAgICAgIHdyaXRlKHdyaXRlQ1NTRGVmaW5pdGlvbik7XG4gICAgICAgIH1cblxuICAgICAgICBjc3NNb2R1bGUgPSAnZGVmaW5lKFtcIkB3cml0ZWNzc1wiXSwgZnVuY3Rpb24od3JpdGVDc3Mpe1xcbiB3cml0ZUNzcyhcIicrIGVzY2FwZShjb21wcmVzcyhzdHlsZSkpICsnXCIpO1xcbn0pJztcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuXHRcdGNzc01vZHVsZSA9ICdkZWZpbmUoZnVuY3Rpb24oKXt9KSc7XG4gICAgICB9XG5cbiAgICAgIHdyaXRlLmFzTW9kdWxlKHBsdWdpbk5hbWUgKyAnIScgKyBtb2R1bGVOYW1lLCBjc3NNb2R1bGUpO1xuICAgIH1cbiAgfVxuXG4gIGNzc0FQSS5vbkxheWVyRW5kID0gZnVuY3Rpb24od3JpdGUsIGRhdGEpIHtcbiAgICBpZiAoY29uZmlnLnNlcGFyYXRlQ1NTICYmIGNvbmZpZy5JRVNlbGVjdG9yTGltaXQpXG4gICAgICB0aHJvdyAnUmVxdWlyZUNTUzogc2VwYXJhdGVDU1Mgb3B0aW9uIGlzIG5vdCBjb21wYXRpYmxlIHdpdGggZW5zdXJpbmcgdGhlIElFIHNlbGVjdG9yIGxpbWl0JztcblxuICAgIGlmIChjb25maWcuc2VwYXJhdGVDU1MpIHtcbiAgICAgIHZhciBvdXRQYXRoID0gZGF0YS5wYXRoLnJlcGxhY2UoLyhcXC5qcyk/JC8sICcuY3NzJyk7XG4gICAgICBjb25zb2xlLmxvZygnV3JpdGluZyBDU1MhIGZpbGU6ICcgKyBvdXRQYXRoICsgJ1xcbicpO1xuXG4gICAgICB2YXIgY3NzID0gbGF5ZXJCdWZmZXIuam9pbignJyk7XG5cbiAgICAgIHByb2Nlc3MubmV4dFRpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChnbG9iYWwuX3JlcXVpcmVqc0Nzc0RhdGEpIHtcbiAgICAgICAgICBjc3MgPSBnbG9iYWwuX3JlcXVpcmVqc0Nzc0RhdGEuY3NzID0gY3NzICsgZ2xvYmFsLl9yZXF1aXJlanNDc3NEYXRhLmNzcztcbiAgICAgICAgICBkZWxldGUgZ2xvYmFsLl9yZXF1aXJlanNDc3NEYXRhLnVzZWRCeS5jc3M7XG4gICAgICAgICAgaWYgKE9iamVjdC5rZXlzKGdsb2JhbC5fcmVxdWlyZWpzQ3NzRGF0YS51c2VkQnkpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgZGVsZXRlIGdsb2JhbC5fcmVxdWlyZWpzQ3NzRGF0YTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHNhdmVGaWxlKG91dFBhdGgsIGNvbXByZXNzKGNzcykpO1xuICAgICAgfSk7XG5cbiAgICB9XG4gICAgZWxzZSBpZiAoY29uZmlnLmJ1aWxkQ1NTICE9IGZhbHNlICYmIGNvbmZpZy53cml0ZUNTU01vZHVsZSAhPSB0cnVlKSB7XG4gICAgICB2YXIgc3R5bGVzID0gY29uZmlnLklFU2VsZWN0b3JMaW1pdCA/IGxheWVyQnVmZmVyIDogW2xheWVyQnVmZmVyLmpvaW4oJycpXTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3R5bGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChzdHlsZXNbaV0gPT0gJycpXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB3cml0ZShcbiAgICAgICAgICBcIihmdW5jdGlvbihjKXt2YXIgZD1kb2N1bWVudCxhPSdhcHBlbmRDaGlsZCcsaT0nc3R5bGVTaGVldCcscz1kLmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7cy50eXBlPSd0ZXh0L2Nzcyc7ZC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdW2FdKHMpO3NbaV0/c1tpXS5jc3NUZXh0PWM6c1thXShkLmNyZWF0ZVRleHROb2RlKGMpKTt9KVxcblwiXG4gICAgICAgICAgKyBcIignXCIgKyBlc2NhcGUoY29tcHJlc3Moc3R5bGVzW2ldKSkgKyBcIicpO1xcblwiXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICAgIC8vY2xlYXIgbGF5ZXIgYnVmZmVyIGZvciBuZXh0IGxheWVyXG4gICAgbGF5ZXJCdWZmZXIgPSBbXTtcbiAgICB3cml0ZUNTU0ZvckxheWVyID0gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBjc3NBUEk7XG59KTtcbiJdLCJmaWxlIjoiY3NzLWJ1aWxkZXIuanMifQ==
