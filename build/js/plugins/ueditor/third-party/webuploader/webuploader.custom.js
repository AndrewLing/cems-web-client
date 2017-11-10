/*! WebUploader 0.1.2 */


/**
 * @fileOverview 让内部各个部件的代码可以用[amd](https://github.com/amdjs/amdjs-api/wiki/AMD)模块定义方式组织起来。
 *
 * AMD API 内部的简单不完全实现，请忽略。只有当WebUploader被合并成一个文件的时候才会引入。
 */
(function( root, factory ) {
    var modules = {},

        // 内部require, 简单不完全实现。
        // https://github.com/amdjs/amdjs-api/wiki/require
        _require = function( deps, callback ) {
            var args, len, i;

            // 如果deps不是数组，则直接返回指定module
            if ( typeof deps === 'string' ) {
                return getModule( deps );
            } else {
                args = [];
                for( len = deps.length, i = 0; i < len; i++ ) {
                    args.push( getModule( deps[ i ] ) );
                }

                return callback.apply( null, args );
            }
        },

        // 内部define，暂时不支持不指定id.
        _define = function( id, deps, factory ) {
            if ( arguments.length === 2 ) {
                factory = deps;
                deps = null;
            }

            _require( deps || [], function() {
                setModule( id, factory, arguments );
            });
        },

        // 设置module, 兼容CommonJs写法。
        setModule = function( id, factory, args ) {
            var module = {
                    exports: factory
                },
                returned;

            if ( typeof factory === 'function' ) {
                args.length || (args = [ _require, module.exports, module ]);
                returned = factory.apply( null, args );
                returned !== undefined && (module.exports = returned);
            }

            modules[ id ] = module.exports;
        },

        // 根据id获取module
        getModule = function( id ) {
            var module = modules[ id ] || root[ id ];

            if ( !module ) {
                throw new Error( '`' + id + '` is undefined' );
            }

            return module;
        },

        // 将所有modules，将路径ids装换成对象。
        exportsTo = function( obj ) {
            var key, host, parts, part, last, ucFirst;

            // make the first character upper case.
            ucFirst = function( str ) {
                return str && (str.charAt( 0 ).toUpperCase() + str.substr( 1 ));
            };

            for ( key in modules ) {
                host = obj;

                if ( !modules.hasOwnProperty( key ) ) {
                    continue;
                }

                parts = key.split('/');
                last = ucFirst( parts.pop() );

                while( (part = ucFirst( parts.shift() )) ) {
                    host[ part ] = host[ part ] || {};
                    host = host[ part ];
                }

                host[ last ] = modules[ key ];
            }
        },

        exports = factory( root, _define, _require ),
        origin;

    // exports every module.
    exportsTo( exports );

    if ( typeof module === 'object' && typeof module.exports === 'object' ) {

        // For CommonJS and CommonJS-like environments where a proper window is present,
        module.exports = exports;
    } else if ( typeof define === 'function' && define.amd ) {

        // Allow using this built library as an AMD module
        // in another project. That other project will only
        // see this AMD call, not the internal modules in
        // the closure below.
        define([], exports );
    } else {

        // Browser globals case. Just assign the
        // result to a property on the global.
        origin = root.WebUploader;
        root.WebUploader = exports;
        root.WebUploader.noConflict = function() {
            root.WebUploader = origin;
        };
    }
})( this, function( window, define, require ) {


    /**
     * @fileOverview jQuery or Zepto
     */
    define('dollar-third',[],function() {
        return window.jQuery || window.Zepto;
    });
    /**
     * @fileOverview Dom 操作相关
     */
    define('dollar',[
        'dollar-third'
    ], function( _ ) {
        return _;
    });
    /**
     * @fileOverview 使用jQuery的Promise
     */
    define('promise-third',[
        'dollar'
    ], function( $ ) {
        return {
            Deferred: $.Deferred,
            when: $.when,
    
            isPromise: function( anything ) {
                return anything && typeof anything.then === 'function';
            }
        };
    });
    /**
     * @fileOverview Promise/A+
     */
    define('promise',[
        'promise-third'
    ], function( _ ) {
        return _;
    });
    /**
     * @fileOverview 基础类方法。
     */
    
    /**
     * Web Uploader内部类的详细说明，以下提及的功能类，都可以在`WebUploader`这个变量中访问到。
     *
     * As you know, Web Uploader的每个文件都是用过[AMD](https://github.com/amdjs/amdjs-api/wiki/AMD)规范中的`define`组织起来的, 每个Module都会有个module id.
     * 默认module id该文件的路径，而此路径将会转化成名字空间存放在WebUploader中。如：
     *
     * * module `base`：WebUploader.Base
     * * module `file`: WebUploader.File
     * * module `lib/dnd`: WebUploader.Lib.Dnd
     * * module `runtime/html5/dnd`: WebUploader.Runtime.Html5.Dnd
     *
     *
     * 以下文档将可能省略`WebUploader`前缀。
     * @module WebUploader
     * @title WebUploader API文档
     */
    define('base',[
        'dollar',
        'promise'
    ], function( $, promise ) {
    
        var noop = function() {},
            call = Function.call;
    
        // http://jsperf.com/uncurrythis
        // 反科里化
        function uncurryThis( fn ) {
            return function() {
                return call.apply( fn, arguments );
            };
        }
    
        function bindFn( fn, context ) {
            return function() {
                return fn.apply( context, arguments );
            };
        }
    
        function createObject( proto ) {
            var f;
    
            if ( Object.create ) {
                return Object.create( proto );
            } else {
                f = function() {};
                f.prototype = proto;
                return new f();
            }
        }
    
    
        /**
         * 基础类，提供一些简单常用的方法。
         * @class Base
         */
        return {
    
            /**
             * @property {String} version 当前版本号。
             */
            version: '0.1.2',
    
            /**
             * @property {jQuery|Zepto} $ 引用依赖的jQuery或者Zepto对象。
             */
            $: $,
    
            Deferred: promise.Deferred,
    
            isPromise: promise.isPromise,
    
            when: promise.when,
    
            /**
             * @description  简单的浏览器检查结果。
             *
             * * `webkit`  webkit版本号，如果浏览器为非webkit内核，此属性为`undefined`。
             * * `chrome`  chrome浏览器版本号，如果浏览器为chrome，此属性为`undefined`。
             * * `ie`  ie浏览器版本号，如果浏览器为非ie，此属性为`undefined`。**暂不支持ie10+**
             * * `firefox`  firefox浏览器版本号，如果浏览器为非firefox，此属性为`undefined`。
             * * `safari`  safari浏览器版本号，如果浏览器为非safari，此属性为`undefined`。
             * * `opera`  opera浏览器版本号，如果浏览器为非opera，此属性为`undefined`。
             *
             * @property {Object} [browser]
             */
            browser: (function( ua ) {
                var ret = {},
                    webkit = ua.match( /WebKit\/([\d.]+)/ ),
                    chrome = ua.match( /Chrome\/([\d.]+)/ ) ||
                        ua.match( /CriOS\/([\d.]+)/ ),
    
                    ie = ua.match( /MSIE\s([\d\.]+)/ ) ||
                        ua.match(/(?:trident)(?:.*rv:([\w.]+))?/i),
                    firefox = ua.match( /Firefox\/([\d.]+)/ ),
                    safari = ua.match( /Safari\/([\d.]+)/ ),
                    opera = ua.match( /OPR\/([\d.]+)/ );
    
                webkit && (ret.webkit = parseFloat( webkit[ 1 ] ));
                chrome && (ret.chrome = parseFloat( chrome[ 1 ] ));
                ie && (ret.ie = parseFloat( ie[ 1 ] ));
                firefox && (ret.firefox = parseFloat( firefox[ 1 ] ));
                safari && (ret.safari = parseFloat( safari[ 1 ] ));
                opera && (ret.opera = parseFloat( opera[ 1 ] ));
    
                return ret;
            })( navigator.userAgent ),
    
            /**
             * @description  操作系统检查结果。
             *
             * * `android`  如果在android浏览器环境下，此值为对应的android版本号，否则为`undefined`。
             * * `ios` 如果在ios浏览器环境下，此值为对应的ios版本号，否则为`undefined`。
             * @property {Object} [os]
             */
            os: (function( ua ) {
                var ret = {},
    
                    // osx = !!ua.match( /\(Macintosh\; Intel / ),
                    android = ua.match( /(?:Android);?[\s\/]+([\d.]+)?/ ),
                    ios = ua.match( /(?:iPad|iPod|iPhone).*OS\s([\d_]+)/ );
    
                // osx && (ret.osx = true);
                android && (ret.android = parseFloat( android[ 1 ] ));
                ios && (ret.ios = parseFloat( ios[ 1 ].replace( /_/g, '.' ) ));
    
                return ret;
            })( navigator.userAgent ),
    
            /**
             * 实现类与类之间的继承。
             * @method inherits
             * @grammar Base.inherits( super ) => child
             * @grammar Base.inherits( super, protos ) => child
             * @grammar Base.inherits( super, protos, statics ) => child
             * @param  {Class} super 父类
             * @param  {Object | Function} [protos] 子类或者对象。如果对象中包含constructor，子类将是用此属性值。
             * @param  {Function} [protos.constructor] 子类构造器，不指定的话将创建个临时的直接执行父类构造器的方法。
             * @param  {Object} [statics] 静态属性或方法。
             * @return {Class} 返回子类。
             * @example
             * function Person() {
             *     console.log( 'Super' );
             * }
             * Person.prototype.hello = function() {
             *     console.log( 'hello' );
             * };
             *
             * var Manager = Base.inherits( Person, {
             *     world: function() {
             *         console.log( 'World' );
             *     }
             * });
             *
             * // 因为没有指定构造器，父类的构造器将会执行。
             * var instance = new Manager();    // => Super
             *
             * // 继承子父类的方法
             * instance.hello();    // => hello
             * instance.world();    // => World
             *
             * // 子类的__super__属性指向父类
             * console.log( Manager.__super__ === Person );    // => true
             */
            inherits: function( Super, protos, staticProtos ) {
                var child;
    
                if ( typeof protos === 'function' ) {
                    child = protos;
                    protos = null;
                } else if ( protos && protos.hasOwnProperty('constructor') ) {
                    child = protos.constructor;
                } else {
                    child = function() {
                        return Super.apply( this, arguments );
                    };
                }
    
                // 复制静态方法
                $.extend( true, child, Super, staticProtos || {} );
    
                /* jshint camelcase: false */
    
                // 让子类的__super__属性指向父类。
                child.__super__ = Super.prototype;
    
                // 构建原型，添加原型方法或属性。
                // 暂时用Object.create实现。
                child.prototype = createObject( Super.prototype );
                protos && $.extend( true, child.prototype, protos );
    
                return child;
            },
    
            /**
             * 一个不做任何事情的方法。可以用来赋值给默认的callback.
             * @method noop
             */
            noop: noop,
    
            /**
             * 返回一个新的方法，此方法将已指定的`context`来执行。
             * @grammar Base.bindFn( fn, context ) => Function
             * @method bindFn
             * @example
             * var doSomething = function() {
             *         console.log( this.name );
             *     },
             *     obj = {
             *         name: 'Object Name'
             *     },
             *     aliasFn = Base.bind( doSomething, obj );
             *
             *  aliasFn();    // => Object Name
             *
             */
            bindFn: bindFn,
    
            /**
             * 引用Console.log如果存在的话，否则引用一个[空函数loop](#WebUploader:Base.log)。
             * @grammar Base.log( args... ) => undefined
             * @method log
             */
            log: (function() {
                if ( window.console ) {
                    return bindFn( console.log, console );
                }
                return noop;
            })(),
    
            nextTick: (function() {
    
                return function( cb ) {
                    setTimeout( cb, 1 );
                };
    
                // @bug 当浏览器不在当前窗口时就停了。
                // var next = window.requestAnimationFrame ||
                //     window.webkitRequestAnimationFrame ||
                //     window.mozRequestAnimationFrame ||
                //     function( cb ) {
                //         window.setTimeout( cb, 1000 / 60 );
                //     };
    
                // // fix: Uncaught TypeError: Illegal invocation
                // return bindFn( next, window );
            })(),
    
            /**
             * 被[uncurrythis](http://www.2ality.com/2011/11/uncurrying-this.html)的数组slice方法。
             * 将用来将非数组对象转化成数组对象。
             * @grammar Base.slice( target, start[, end] ) => Array
             * @method slice
             * @example
             * function doSomthing() {
             *     var args = Base.slice( arguments, 1 );
             *     console.log( args );
             * }
             *
             * doSomthing( 'ignored', 'arg2', 'arg3' );    // => Array ["arg2", "arg3"]
             */
            slice: uncurryThis( [].slice ),
    
            /**
             * 生成唯一的ID
             * @method guid
             * @grammar Base.guid() => String
             * @grammar Base.guid( prefx ) => String
             */
            guid: (function() {
                var counter = 0;
    
                return function( prefix ) {
                    var guid = (+new Date()).toString( 32 ),
                        i = 0;
    
                    for ( ; i < 5; i++ ) {
                        guid += Math.floor( Math.random() * 65535 ).toString( 32 );
                    }
    
                    return (prefix || 'wu_') + guid + (counter++).toString( 32 );
                };
            })(),
    
            /**
             * 格式化文件大小, 输出成带单位的字符串
             * @method formatSize
             * @grammar Base.formatSize( size ) => String
             * @grammar Base.formatSize( size, pointLength ) => String
             * @grammar Base.formatSize( size, pointLength, units ) => String
             * @param {Number} size 文件大小
             * @param {Number} [pointLength=2] 精确到的小数点数。
             * @param {Array} [units=[ 'B', 'K', 'M', 'G', 'TB' ]] 单位数组。从字节，到千字节，一直往上指定。如果单位数组里面只指定了到了K(千字节)，同时文件大小大于M, 此方法的输出将还是显示成多少K.
             * @example
             * console.log( Base.formatSize( 100 ) );    // => 100B
             * console.log( Base.formatSize( 1024 ) );    // => 1.00K
             * console.log( Base.formatSize( 1024, 0 ) );    // => 1K
             * console.log( Base.formatSize( 1024 * 1024 ) );    // => 1.00M
             * console.log( Base.formatSize( 1024 * 1024 * 1024 ) );    // => 1.00G
             * console.log( Base.formatSize( 1024 * 1024 * 1024, 0, ['B', 'KB', 'MB'] ) );    // => 1024MB
             */
            formatSize: function( size, pointLength, units ) {
                var unit;
    
                units = units || [ 'B', 'K', 'M', 'G', 'TB' ];
    
                while ( (unit = units.shift()) && size > 1024 ) {
                    size = size / 1024;
                }
    
                return (unit === 'B' ? size : size.toFixed( pointLength || 2 )) +
                        unit;
            }
        };
    });
    /**
     * 事件处理类，可以独立使用，也可以扩展给对象使用。
     * @fileOverview Mediator
     */
    define('mediator',[
        'base'
    ], function( Base ) {
        var $ = Base.$,
            slice = [].slice,
            separator = /\s+/,
            protos;
    
        // 根据条件过滤出事件handlers.
        function findHandlers( arr, name, callback, context ) {
            return $.grep( arr, function( handler ) {
                return handler &&
                        (!name || handler.e === name) &&
                        (!callback || handler.cb === callback ||
                        handler.cb._cb === callback) &&
                        (!context || handler.ctx === context);
            });
        }
    
        function eachEvent( events, callback, iterator ) {
            // 不支持对象，只支持多个event用空格隔开
            $.each( (events || '').split( separator ), function( _, key ) {
                iterator( key, callback );
            });
        }
    
        function triggerHanders( events, args ) {
            var stoped = false,
                i = -1,
                len = events.length,
                handler;
    
            while ( ++i < len ) {
                handler = events[ i ];
    
                if ( handler.cb.apply( handler.ctx2, args ) === false ) {
                    stoped = true;
                    break;
                }
            }
    
            return !stoped;
        }
    
        protos = {
    
            /**
             * 绑定事件。
             *
             * `callback`方法在执行时，arguments将会来源于trigger的时候携带的参数。如
             * ```javascript
             * var obj = {};
             *
             * // 使得obj有事件行为
             * Mediator.installTo( obj );
             *
             * obj.on( 'testa', function( arg1, arg2 ) {
             *     console.log( arg1, arg2 ); // => 'arg1', 'arg2'
             * });
             *
             * obj.trigger( 'testa', 'arg1', 'arg2' );
             * ```
             *
             * 如果`callback`中，某一个方法`return false`了，则后续的其他`callback`都不会被执行到。
             * 切会影响到`trigger`方法的返回值，为`false`。
             *
             * `on`还可以用来添加一个特殊事件`all`, 这样所有的事件触发都会响应到。同时此类`callback`中的arguments有一个不同处，
             * 就是第一个参数为`type`，记录当前是什么事件在触发。此类`callback`的优先级比脚低，会再正常`callback`执行完后触发。
             * ```javascript
             * obj.on( 'all', function( type, arg1, arg2 ) {
             *     console.log( type, arg1, arg2 ); // => 'testa', 'arg1', 'arg2'
             * });
             * ```
             *
             * @method on
             * @grammar on( name, callback[, context] ) => self
             * @param  {String}   name     事件名，支持多个事件用空格隔开
             * @param  {Function} callback 事件处理器
             * @param  {Object}   [context]  事件处理器的上下文。
             * @return {self} 返回自身，方便链式
             * @chainable
             * @class Mediator
             */
            on: function( name, callback, context ) {
                var me = this,
                    set;
    
                if ( !callback ) {
                    return this;
                }
    
                set = this._events || (this._events = []);
    
                eachEvent( name, callback, function( name, callback ) {
                    var handler = { e: name };
    
                    handler.cb = callback;
                    handler.ctx = context;
                    handler.ctx2 = context || me;
                    handler.id = set.length;
    
                    set.push( handler );
                });
    
                return this;
            },
    
            /**
             * 绑定事件，且当handler执行完后，自动解除绑定。
             * @method once
             * @grammar once( name, callback[, context] ) => self
             * @param  {String}   name     事件名
             * @param  {Function} callback 事件处理器
             * @param  {Object}   [context]  事件处理器的上下文。
             * @return {self} 返回自身，方便链式
             * @chainable
             */
            once: function( name, callback, context ) {
                var me = this;
    
                if ( !callback ) {
                    return me;
                }
    
                eachEvent( name, callback, function( name, callback ) {
                    var once = function() {
                            me.off( name, once );
                            return callback.apply( context || me, arguments );
                        };
    
                    once._cb = callback;
                    me.on( name, once, context );
                });
    
                return me;
            },
    
            /**
             * 解除事件绑定
             * @method off
             * @grammar off( [name[, callback[, context] ] ] ) => self
             * @param  {String}   [name]     事件名
             * @param  {Function} [callback] 事件处理器
             * @param  {Object}   [context]  事件处理器的上下文。
             * @return {self} 返回自身，方便链式
             * @chainable
             */
            off: function( name, cb, ctx ) {
                var events = this._events;
    
                if ( !events ) {
                    return this;
                }
    
                if ( !name && !cb && !ctx ) {
                    this._events = [];
                    return this;
                }
    
                eachEvent( name, cb, function( name, cb ) {
                    $.each( findHandlers( events, name, cb, ctx ), function() {
                        delete events[ this.id ];
                    });
                });
    
                return this;
            },
    
            /**
             * 触发事件
             * @method trigger
             * @grammar trigger( name[, args...] ) => self
             * @param  {String}   type     事件名
             * @param  {*} [...] 任意参数
             * @return {Boolean} 如果handler中return false了，则返回false, 否则返回true
             */
            trigger: function( type ) {
                var args, events, allEvents;
    
                if ( !this._events || !type ) {
                    return this;
                }
    
                args = slice.call( arguments, 1 );
                events = findHandlers( this._events, type );
                allEvents = findHandlers( this._events, 'all' );
    
                return triggerHanders( events, args ) &&
                        triggerHanders( allEvents, arguments );
            }
        };
    
        /**
         * 中介者，它本身是个单例，但可以通过[installTo](#WebUploader:Mediator:installTo)方法，使任何对象具备事件行为。
         * 主要目的是负责模块与模块之间的合作，降低耦合度。
         *
         * @class Mediator
         */
        return $.extend({
    
            /**
             * 可以通过这个接口，使任何对象具备事件功能。
             * @method installTo
             * @param  {Object} obj 需要具备事件行为的对象。
             * @return {Object} 返回obj.
             */
            installTo: function( obj ) {
                return $.extend( obj, protos );
            }
    
        }, protos );
    });
    /**
     * @fileOverview Uploader上传类
     */
    define('uploader',[
        'base',
        'mediator'
    ], function( Base, Mediator ) {
    
        var $ = Base.$;
    
        /**
         * 上传入口类。
         * @class Uploader
         * @constructor
         * @grammar new Uploader( opts ) => Uploader
         * @example
         * var uploader = WebUploader.Uploader({
         *     swf: 'path_of_swf/Uploader.swf',
         *
         *     // 开起分片上传。
         *     chunked: true
         * });
         */
        function Uploader( opts ) {
            this.options = $.extend( true, {}, Uploader.options, opts );
            this._init( this.options );
        }
    
        // default Options
        // widgets中有相应扩展
        Uploader.options = {};
        Mediator.installTo( Uploader.prototype );
    
        // 批量添加纯命令式方法。
        $.each({
            upload: 'start-upload',
            stop: 'stop-upload',
            getFile: 'get-file',
            getFiles: 'get-files',
            addFile: 'add-file',
            addFiles: 'add-file',
            sort: 'sort-files',
            removeFile: 'remove-file',
            skipFile: 'skip-file',
            retry: 'retry',
            isInProgress: 'is-in-progress',
            makeThumb: 'make-thumb',
            getDimension: 'get-dimension',
            addButton: 'add-btn',
            getRuntimeType: 'get-runtime-type',
            refresh: 'refresh',
            disable: 'disable',
            enable: 'enable',
            reset: 'reset'
        }, function( fn, command ) {
            Uploader.prototype[ fn ] = function() {
                return this.request( command, arguments );
            };
        });
    
        $.extend( Uploader.prototype, {
            state: 'pending',
    
            _init: function( opts ) {
                var me = this;
    
                me.request( 'init', opts, function() {
                    me.state = 'ready';
                    me.trigger('ready');
                });
            },
    
            /**
             * 获取或者设置Uploader配置项。
             * @method option
             * @grammar option( key ) => *
             * @grammar option( key, val ) => self
             * @example
             *
             * // 初始状态图片上传前不会压缩
             * var uploader = new WebUploader.Uploader({
             *     resize: null;
             * });
             *
             * // 修改后图片上传前，尝试将图片压缩到1600 * 1600
             * uploader.options( 'resize', {
             *     width: 1600,
             *     height: 1600
             * });
             */
            option: function( key, val ) {
                var opts = this.options;
    
                // setter
                if ( arguments.length > 1 ) {
    
                    if ( $.isPlainObject( val ) &&
                            $.isPlainObject( opts[ key ] ) ) {
                        $.extend( opts[ key ], val );
                    } else {
                        opts[ key ] = val;
                    }
    
                } else {    // getter
                    return key ? opts[ key ] : opts;
                }
            },
    
            /**
             * 获取文件统计信息。返回一个包含一下信息的对象。
             * * `successNum` 上传成功的文件数
             * * `uploadFailNum` 上传失败的文件数
             * * `cancelNum` 被删除的文件数
             * * `invalidNum` 无效的文件数
             * * `queueNum` 还在队列中的文件数
             * @method getStats
             * @grammar getStats() => Object
             */
            getStats: function() {
                // return this._mgr.getStats.apply( this._mgr, arguments );
                var stats = this.request('get-stats');
    
                return {
                    successNum: stats.numOfSuccess,
    
                    // who care?
                    // queueFailNum: 0,
                    cancelNum: stats.numOfCancel,
                    invalidNum: stats.numOfInvalid,
                    uploadFailNum: stats.numOfUploadFailed,
                    queueNum: stats.numOfQueue
                };
            },
    
            // 需要重写此方法来来支持opts.onEvent和instance.onEvent的处理器
            trigger: function( type/*, args...*/ ) {
                var args = [].slice.call( arguments, 1 ),
                    opts = this.options,
                    name = 'on' + type.substring( 0, 1 ).toUpperCase() +
                        type.substring( 1 );
    
                if (
                        // 调用通过on方法注册的handler.
                        Mediator.trigger.apply( this, arguments ) === false ||
    
                        // 调用opts.onEvent
                        $.isFunction( opts[ name ] ) &&
                        opts[ name ].apply( this, args ) === false ||
    
                        // 调用this.onEvent
                        $.isFunction( this[ name ] ) &&
                        this[ name ].apply( this, args ) === false ||
    
                        // 广播所有uploader的事件。
                        Mediator.trigger.apply( Mediator,
                        [ this, type ].concat( args ) ) === false ) {
    
                    return false;
                }
    
                return true;
            },
    
            // widgets/widget.js将补充此方法的详细文档。
            request: Base.noop
        });
    
        /**
         * 创建Uploader实例，等同于new Uploader( opts );
         * @method create
         * @class Base
         * @static
         * @grammar Base.create( opts ) => Uploader
         */
        Base.create = Uploader.create = function( opts ) {
            return new Uploader( opts );
        };
    
        // 暴露Uploader，可以通过它来扩展业务逻辑。
        Base.Uploader = Uploader;
    
        return Uploader;
    });
    /**
     * @fileOverview Runtime管理器，负责Runtime的选择, 连接
     */
    define('runtime/runtime',[
        'base',
        'mediator'
    ], function( Base, Mediator ) {
    
        var $ = Base.$,
            factories = {},
    
            // 获取对象的第一个key
            getFirstKey = function( obj ) {
                for ( var key in obj ) {
                    if ( obj.hasOwnProperty( key ) ) {
                        return key;
                    }
                }
                return null;
            };
    
        // 接口类。
        function Runtime( options ) {
            this.options = $.extend({
                container: document.body
            }, options );
            this.uid = Base.guid('rt_');
        }
    
        $.extend( Runtime.prototype, {
    
            getContainer: function() {
                var opts = this.options,
                    parent, container;
    
                if ( this._container ) {
                    return this._container;
                }
    
                parent = $( opts.container || document.body );
                container = $( document.createElement('div') );
    
                container.attr( 'id', 'rt_' + this.uid );
                container.css({
                    position: 'absolute',
                    top: '0px',
                    left: '0px',
                    width: '1px',
                    height: '1px',
                    overflow: 'hidden'
                });
    
                parent.append( container );
                parent.addClass('webuploader-container');
                this._container = container;
                return container;
            },
    
            init: Base.noop,
            exec: Base.noop,
    
            destroy: function() {
                if ( this._container ) {
                    this._container.parentNode.removeChild( this.__container );
                }
    
                this.off();
            }
        });
    
        Runtime.orders = 'html5,flash';
    
    
        /**
         * 添加Runtime实现。
         * @param {String} type    类型
         * @param {Runtime} factory 具体Runtime实现。
         */
        Runtime.addRuntime = function( type, factory ) {
            factories[ type ] = factory;
        };
    
        Runtime.hasRuntime = function( type ) {
            return !!(type ? factories[ type ] : getFirstKey( factories ));
        };
    
        Runtime.create = function( opts, orders ) {
            var type, runtime;
    
            orders = orders || Runtime.orders;
            $.each( orders.split( /\s*,\s*/g ), function() {
                if ( factories[ this ] ) {
                    type = this;
                    return false;
                }
            });
    
            type = type || getFirstKey( factories );
    
            if ( !type ) {
                throw new Error('Runtime Error');
            }
    
            runtime = new factories[ type ]( opts );
            return runtime;
        };
    
        Mediator.installTo( Runtime.prototype );
        return Runtime;
    });
    
    /**
     * @fileOverview Runtime管理器，负责Runtime的选择, 连接
     */
    define('runtime/client',[
        'base',
        'mediator',
        'runtime/runtime'
    ], function( Base, Mediator, Runtime ) {
    
        var cache;
    
        cache = (function() {
            var obj = {};
    
            return {
                add: function( runtime ) {
                    obj[ runtime.uid ] = runtime;
                },
    
                get: function( ruid, standalone ) {
                    var i;
    
                    if ( ruid ) {
                        return obj[ ruid ];
                    }
    
                    for ( i in obj ) {
                        // 有些类型不能重用，比如filepicker.
                        if ( standalone && obj[ i ].__standalone ) {
                            continue;
                        }
    
                        return obj[ i ];
                    }
    
                    return null;
                },
    
                remove: function( runtime ) {
                    delete obj[ runtime.uid ];
                }
            };
        })();
    
        function RuntimeClient( component, standalone ) {
            var deferred = Base.Deferred(),
                runtime;
    
            this.uid = Base.guid('client_');
    
            // 允许runtime没有初始化之前，注册一些方法在初始化后执行。
            this.runtimeReady = function( cb ) {
                return deferred.done( cb );
            };
    
            this.connectRuntime = function( opts, cb ) {
    
                // already connected.
                if ( runtime ) {
                    throw new Error('already connected!');
                }
    
                deferred.done( cb );
    
                if ( typeof opts === 'string' && cache.get( opts ) ) {
                    runtime = cache.get( opts );
                }
    
                // 像filePicker只能独立存在，不能公用。
                runtime = runtime || cache.get( null, standalone );
    
                // 需要创建
                if ( !runtime ) {
                    runtime = Runtime.create( opts, opts.runtimeOrder );
                    runtime.__promise = deferred.promise();
                    runtime.once( 'ready', deferred.resolve );
                    runtime.init();
                    cache.add( runtime );
                    runtime.__client = 1;
                } else {
                    // 来自cache
                    Base.$.extend( runtime.options, opts );
                    runtime.__promise.then( deferred.resolve );
                    runtime.__client++;
                }
    
                standalone && (runtime.__standalone = standalone);
                return runtime;
            };
    
            this.getRuntime = function() {
                return runtime;
            };
    
            this.disconnectRuntime = function() {
                if ( !runtime ) {
                    return;
                }
    
                runtime.__client--;
    
                if ( runtime.__client <= 0 ) {
                    cache.remove( runtime );
                    delete runtime.__promise;
                    runtime.destroy();
                }
    
                runtime = null;
            };
    
            this.exec = function() {
                if ( !runtime ) {
                    return;
                }
    
                var args = Base.slice( arguments );
                component && args.unshift( component );
    
                return runtime.exec.apply( this, args );
            };
    
            this.getRuid = function() {
                return runtime && runtime.uid;
            };
    
            this.destroy = (function( destroy ) {
                return function() {
                    destroy && destroy.apply( this, arguments );
                    this.trigger('destroy');
                    this.off();
                    this.exec('destroy');
                    this.disconnectRuntime();
                };
            })( this.destroy );
        }
    
        Mediator.installTo( RuntimeClient.prototype );
        return RuntimeClient;
    });
    /**
     * @fileOverview Blob
     */
    define('lib/blob',[
        'base',
        'runtime/client'
    ], function( Base, RuntimeClient ) {
    
        function Blob( ruid, source ) {
            var me = this;
    
            me.source = source;
            me.ruid = ruid;
    
            RuntimeClient.call( me, 'Blob' );
    
            this.uid = source.uid || this.uid;
            this.type = source.type || '';
            this.size = source.size || 0;
    
            if ( ruid ) {
                me.connectRuntime( ruid );
            }
        }
    
        Base.inherits( RuntimeClient, {
            constructor: Blob,
    
            slice: function( start, end ) {
                return this.exec( 'slice', start, end );
            },
    
            getSource: function() {
                return this.source;
            }
        });
    
        return Blob;
    });
    /**
     * 为了统一化Flash的File和HTML5的File而存在。
     * 以至于要调用Flash里面的File，也可以像调用HTML5版本的File一下。
     * @fileOverview File
     */
    define('lib/file',[
        'base',
        'lib/blob'
    ], function( Base, Blob ) {
    
        var uid = 1,
            rExt = /\.([^.]+)$/;
    
        function File( ruid, file ) {
            var ext;
    
            Blob.apply( this, arguments );
            this.name = file.name || ('untitled' + uid++);
            ext = rExt.exec( file.name ) ? RegExp.$1.toLowerCase() : '';
    
            // todo 支持其他类型文件的转换。
    
            // 如果有mimetype, 但是文件名里面没有找出后缀规律
            if ( !ext && this.type ) {
                ext = /\/(jpg|jpeg|png|gif|bmp)$/i.exec( this.type ) ?
                        RegExp.$1.toLowerCase() : '';
                this.name += '.' + ext;
            }
    
            // 如果没有指定mimetype, 但是知道文件后缀。
            if ( !this.type &&  ~'jpg,jpeg,png,gif,bmp'.indexOf( ext ) ) {
                this.type = 'image/' + (ext === 'jpg' ? 'jpeg' : ext);
            }
    
            this.ext = ext;
            this.lastModifiedDate = file.lastModifiedDate ||
                    (new Date()).toLocaleString();
        }
    
        return Base.inherits( Blob, File );
    });
    
    /**
     * @fileOverview 错误信息
     */
    define('lib/filepicker',[
        'base',
        'runtime/client',
        'lib/file'
    ], function( Base, RuntimeClent, File ) {
    
        var $ = Base.$;
    
        function FilePicker( opts ) {
            opts = this.options = $.extend({}, FilePicker.options, opts );
    
            opts.container = $( opts.id );
    
            if ( !opts.container.length ) {
                throw new Error('按钮指定错误');
            }
    
            opts.innerHTML = opts.innerHTML || opts.label ||
                    opts.container.html() || '';
    
            opts.button = $( opts.button || document.createElement('div') );
            opts.button.html( opts.innerHTML );
            opts.container.html( opts.button );
    
            RuntimeClent.call( this, 'FilePicker', true );
        }
    
        FilePicker.options = {
            button: null,
            container: null,
            label: null,
            innerHTML: null,
            multiple: true,
            accept: null,
            name: 'file'
        };
    
        Base.inherits( RuntimeClent, {
            constructor: FilePicker,
    
            init: function() {
                var me = this,
                    opts = me.options,
                    button = opts.button;
    
                button.addClass('webuploader-pick');
    
                me.on( 'all', function( type ) {
                    var files;
    
                    switch ( type ) {
                        case 'mouseenter':
                            button.addClass('webuploader-pick-hover');
                            break;
    
                        case 'mouseleave':
                            button.removeClass('webuploader-pick-hover');
                            break;
    
                        case 'change':
                            files = me.exec('getFiles');
                            me.trigger( 'select', $.map( files, function( file ) {
                                file = new File( me.getRuid(), file );
    
                                // 记录来源。
                                file._refer = opts.container;
                                return file;
                            }), opts.container );
                            break;
                    }
                });
    
                me.connectRuntime( opts, function() {
                    me.refresh();
                    me.exec( 'init', opts );
                    me.trigger('ready');
                });
    
                $( window ).on( 'resize', function() {
                    me.refresh();
                });
            },
    
            refresh: function() {
                var shimContainer = this.getRuntime().getContainer(),
                    button = this.options.button,
                    width = button.outerWidth ?
                            button.outerWidth() : button.width(),
    
                    height = button.outerHeight ?
                            button.outerHeight() : button.height(),
    
                    pos = button.offset();
    
                width && height && shimContainer.css({
                    bottom: 'auto',
                    right: 'auto',
                    width: width + 'px',
                    height: height + 'px'
                }).offset( pos );
            },
    
            enable: function() {
                var btn = this.options.button;
    
                btn.removeClass('webuploader-pick-disable');
                this.refresh();
            },
    
            disable: function() {
                var btn = this.options.button;
    
                this.getRuntime().getContainer().css({
                    top: '-99999px'
                });
    
                btn.addClass('webuploader-pick-disable');
            },
    
            destroy: function() {
                if ( this.runtime ) {
                    this.exec('destroy');
                    this.disconnectRuntime();
                }
            }
        });
    
        return FilePicker;
    });
    
    /**
     * @fileOverview 组件基类。
     */
    define('widgets/widget',[
        'base',
        'uploader'
    ], function( Base, Uploader ) {
    
        var $ = Base.$,
            _init = Uploader.prototype._init,
            IGNORE = {},
            widgetClass = [];
    
        function isArrayLike( obj ) {
            if ( !obj ) {
                return false;
            }
    
            var length = obj.length,
                type = $.type( obj );
    
            if ( obj.nodeType === 1 && length ) {
                return true;
            }
    
            return type === 'array' || type !== 'function' && type !== 'string' &&
                    (length === 0 || typeof length === 'number' && length > 0 &&
                    (length - 1) in obj);
        }
    
        function Widget( uploader ) {
            this.owner = uploader;
            this.options = uploader.options;
        }
    
        $.extend( Widget.prototype, {
    
            init: Base.noop,
    
            // 类Backbone的事件监听声明，监听uploader实例上的事件
            // widget直接无法监听事件，事件只能通过uploader来传递
            invoke: function( apiName, args ) {
    
                /*
                    {
                        'make-thumb': 'makeThumb'
                    }
                 */
                var map = this.responseMap;
    
                // 如果无API响应声明则忽略
                if ( !map || !(apiName in map) || !(map[ apiName ] in this) ||
                        !$.isFunction( this[ map[ apiName ] ] ) ) {
    
                    return IGNORE;
                }
    
                return this[ map[ apiName ] ].apply( this, args );
    
            },
    
            /**
             * 发送命令。当传入`callback`或者`handler`中返回`promise`时。返回一个当所有`handler`中的promise都完成后完成的新`promise`。
             * @method request
             * @grammar request( command, args ) => * | Promise
             * @grammar request( command, args, callback ) => Promise
             * @for  Uploader
             */
            request: function() {
                return this.owner.request.apply( this.owner, arguments );
            }
        });
    
        // 扩展Uploader.
        $.extend( Uploader.prototype, {
    
            // 覆写_init用来初始化widgets
            _init: function() {
                var me = this,
                    widgets = me._widgets = [];
    
                $.each( widgetClass, function( _, klass ) {
                    widgets.push( new klass( me ) );
                });
    
                return _init.apply( me, arguments );
            },
    
            request: function( apiName, args, callback ) {
                var i = 0,
                    widgets = this._widgets,
                    len = widgets.length,
                    rlts = [],
                    dfds = [],
                    widget, rlt, promise, key;
    
                args = isArrayLike( args ) ? args : [ args ];
    
                for ( ; i < len; i++ ) {
                    widget = widgets[ i ];
                    rlt = widget.invoke( apiName, args );
    
                    if ( rlt !== IGNORE ) {
    
                        // Deferred对象
                        if ( Base.isPromise( rlt ) ) {
                            dfds.push( rlt );
                        } else {
                            rlts.push( rlt );
                        }
                    }
                }
    
                // 如果有callback，则用异步方式。
                if ( callback || dfds.length ) {
                    promise = Base.when.apply( Base, dfds );
                    key = promise.pipe ? 'pipe' : 'then';
    
                    // 很重要不能删除。删除了会死循环。
                    // 保证执行顺序。让callback总是在下一个tick中执行。
                    return promise[ key ](function() {
                                var deferred = Base.Deferred(),
                                    args = arguments;
    
                                setTimeout(function() {
                                    deferred.resolve.apply( deferred, args );
                                }, 1 );
    
                                return deferred.promise();
                            })[ key ]( callback || Base.noop );
                } else {
                    return rlts[ 0 ];
                }
            }
        });
    
        /**
         * 添加组件
         * @param  {object} widgetProto 组件原型，构造函数通过constructor属性定义
         * @param  {object} responseMap API名称与函数实现的映射
         * @example
         *     Uploader.register( {
         *         init: function( options ) {},
         *         makeThumb: function() {}
         *     }, {
         *         'make-thumb': 'makeThumb'
         *     } );
         */
        Uploader.register = Widget.register = function( responseMap, widgetProto ) {
            var map = { init: 'init' },
                klass;
    
            if ( arguments.length === 1 ) {
                widgetProto = responseMap;
                widgetProto.responseMap = map;
            } else {
                widgetProto.responseMap = $.extend( map, responseMap );
            }
    
            klass = Base.inherits( Widget, widgetProto );
            widgetClass.push( klass );
    
            return klass;
        };
    
        return Widget;
    });
    /**
     * @fileOverview 文件选择相关
     */
    define('widgets/filepicker',[
        'base',
        'uploader',
        'lib/filepicker',
        'widgets/widget'
    ], function( Base, Uploader, FilePicker ) {
        var $ = Base.$;
    
        $.extend( Uploader.options, {
    
            /**
             * @property {Selector | Object} [pick=undefined]
             * @namespace options
             * @for Uploader
             * @description 指定选择文件的按钮容器，不指定则不创建按钮。
             *
             * * `id` {Seletor} 指定选择文件的按钮容器，不指定则不创建按钮。
             * * `label` {String} 请采用 `innerHTML` 代替
             * * `innerHTML` {String} 指定按钮文字。不指定时优先从指定的容器中看是否自带文字。
             * * `multiple` {Boolean} 是否开起同时选择多个文件能力。
             */
            pick: null,
    
            /**
             * @property {Arroy} [accept=null]
             * @namespace options
             * @for Uploader
             * @description 指定接受哪些类型的文件。 由于目前还有ext转mimeType表，所以这里需要分开指定。
             *
             * * `title` {String} 文字描述
             * * `extensions` {String} 允许的文件后缀，不带点，多个用逗号分割。
             * * `mimeTypes` {String} 多个用逗号分割。
             *
             * 如：
             *
             * ```
             * {
             *     title: 'Images',
             *     extensions: 'gif,jpg,jpeg,bmp,png',
             *     mimeTypes: 'image/*'
             * }
             * ```
             */
            accept: null/*{
                title: 'Images',
                extensions: 'gif,jpg,jpeg,bmp,png',
                mimeTypes: 'image/*'
            }*/
        });
    
        return Uploader.register({
            'add-btn': 'addButton',
            refresh: 'refresh',
            disable: 'disable',
            enable: 'enable'
        }, {
    
            init: function( opts ) {
                this.pickers = [];
                return opts.pick && this.addButton( opts.pick );
            },
    
            refresh: function() {
                $.each( this.pickers, function() {
                    this.refresh();
                });
            },
    
            /**
             * @method addButton
             * @for Uploader
             * @grammar addButton( pick ) => Promise
             * @description
             * 添加文件选择按钮，如果一个按钮不够，需要调用此方法来添加。参数跟[options.pick](#WebUploader:Uploader:options)一致。
             * @example
             * uploader.addButton({
             *     id: '#btnContainer',
             *     innerHTML: '选择文件'
             * });
             */
            addButton: function( pick ) {
                var me = this,
                    opts = me.options,
                    accept = opts.accept,
                    options, picker, deferred;
    
                if ( !pick ) {
                    return;
                }
    
                deferred = Base.Deferred();
                $.isPlainObject( pick ) || (pick = {
                    id: pick
                });
    
                options = $.extend({}, pick, {
                    accept: $.isPlainObject( accept ) ? [ accept ] : accept,
                    swf: opts.swf,
                    runtimeOrder: opts.runtimeOrder
                });
    
                picker = new FilePicker( options );
    
                picker.once( 'ready', deferred.resolve );
                picker.on( 'select', function( files ) {
                    me.owner.request( 'add-file', [ files ]);
                });
                picker.init();
    
                this.pickers.push( picker );
    
                return deferred.promise();
            },
    
            disable: function() {
                $.each( this.pickers, function() {
                    this.disable();
                });
            },
    
            enable: function() {
                $.each( this.pickers, function() {
                    this.enable();
                });
            }
        });
    });
    /**
     * @fileOverview Image
     */
    define('lib/image',[
        'base',
        'runtime/client',
        'lib/blob'
    ], function( Base, RuntimeClient, Blob ) {
        var $ = Base.$;
    
        // 构造器。
        function Image( opts ) {
            this.options = $.extend({}, Image.options, opts );
            RuntimeClient.call( this, 'Image' );
    
            this.on( 'load', function() {
                this._info = this.exec('info');
                this._meta = this.exec('meta');
            });
        }
    
        // 默认选项。
        Image.options = {
    
            // 默认的图片处理质量
            quality: 90,
    
            // 是否裁剪
            crop: false,
    
            // 是否保留头部信息
            preserveHeaders: true,
    
            // 是否允许放大。
            allowMagnify: true
        };
    
        // 继承RuntimeClient.
        Base.inherits( RuntimeClient, {
            constructor: Image,
    
            info: function( val ) {
    
                // setter
                if ( val ) {
                    this._info = val;
                    return this;
                }
    
                // getter
                return this._info;
            },
    
            meta: function( val ) {
    
                // setter
                if ( val ) {
                    this._meta = val;
                    return this;
                }
    
                // getter
                return this._meta;
            },
    
            loadFromBlob: function( blob ) {
                var me = this,
                    ruid = blob.getRuid();
    
                this.connectRuntime( ruid, function() {
                    me.exec( 'init', me.options );
                    me.exec( 'loadFromBlob', blob );
                });
            },
    
            resize: function() {
                var args = Base.slice( arguments );
                return this.exec.apply( this, [ 'resize' ].concat( args ) );
            },
    
            getAsDataUrl: function( type ) {
                return this.exec( 'getAsDataUrl', type );
            },
    
            getAsBlob: function( type ) {
                var blob = this.exec( 'getAsBlob', type );
    
                return new Blob( this.getRuid(), blob );
            }
        });
    
        return Image;
    });
    /**
     * @fileOverview 图片操作, 负责预览图片和上传前压缩图片
     */
    define('widgets/image',[
        'base',
        'uploader',
        'lib/image',
        'widgets/widget'
    ], function( Base, Uploader, Image ) {
    
        var $ = Base.$,
            throttle;
    
        // 根据要处理的文件大小来节流，一次不能处理太多，会卡。
        throttle = (function( max ) {
            var occupied = 0,
                waiting = [],
                tick = function() {
                    var item;
    
                    while ( waiting.length && occupied < max ) {
                        item = waiting.shift();
                        occupied += item[ 0 ];
                        item[ 1 ]();
                    }
                };
    
            return function( emiter, size, cb ) {
                waiting.push([ size, cb ]);
                emiter.once( 'destroy', function() {
                    occupied -= size;
                    setTimeout( tick, 1 );
                });
                setTimeout( tick, 1 );
            };
        })( 5 * 1024 * 1024 );
    
        $.extend( Uploader.options, {
    
            /**
             * @property {Object} [thumb]
             * @namespace options
             * @for Uploader
             * @description 配置生成缩略图的选项。
             *
             * 默认为：
             *
             * ```javascript
             * {
             *     width: 110,
             *     height: 110,
             *
             *     // 图片质量，只有type为`image/jpeg`的时候才有效。
             *     quality: 70,
             *
             *     // 是否允许放大，如果想要生成小图的时候不失真，此选项应该设置为false.
             *     allowMagnify: true,
             *
             *     // 是否允许裁剪。
             *     crop: true,
             *
             *     // 是否保留头部meta信息。
             *     preserveHeaders: false,
             *
             *     // 为空的话则保留原有图片格式。
             *     // 否则强制转换成指定的类型。
             *     type: 'image/jpeg'
             * }
             * ```
             */
            thumb: {
                width: 110,
                height: 110,
                quality: 70,
                allowMagnify: true,
                crop: true,
                preserveHeaders: false,
    
                // 为空的话则保留原有图片格式。
                // 否则强制转换成指定的类型。
                // IE 8下面 base64 大小不能超过 32K 否则预览失败，而非 jpeg 编码的图片很可
                // 能会超过 32k, 所以这里设置成预览的时候都是 image/jpeg
                type: 'image/jpeg'
            },
    
            /**
             * @property {Object} [compress]
             * @namespace options
             * @for Uploader
             * @description 配置压缩的图片的选项。如果此选项为`false`, 则图片在上传前不进行压缩。
             *
             * 默认为：
             *
             * ```javascript
             * {
             *     width: 1600,
             *     height: 1600,
             *
             *     // 图片质量，只有type为`image/jpeg`的时候才有效。
             *     quality: 90,
             *
             *     // 是否允许放大，如果想要生成小图的时候不失真，此选项应该设置为false.
             *     allowMagnify: false,
             *
             *     // 是否允许裁剪。
             *     crop: false,
             *
             *     // 是否保留头部meta信息。
             *     preserveHeaders: true
             * }
             * ```
             */
            compress: {
                width: 1600,
                height: 1600,
                quality: 90,
                allowMagnify: false,
                crop: false,
                preserveHeaders: true
            }
        });
    
        return Uploader.register({
            'make-thumb': 'makeThumb',
            'before-send-file': 'compressImage'
        }, {
    
    
            /**
             * 生成缩略图，此过程为异步，所以需要传入`callback`。
             * 通常情况在图片加入队里后调用此方法来生成预览图以增强交互效果。
             *
             * `callback`中可以接收到两个参数。
             * * 第一个为error，如果生成缩略图有错误，此error将为真。
             * * 第二个为ret, 缩略图的Data URL值。
             *
             * **注意**
             * Date URL在IE6/7中不支持，所以不用调用此方法了，直接显示一张暂不支持预览图片好了。
             *
             *
             * @method makeThumb
             * @grammar makeThumb( file, callback ) => undefined
             * @grammar makeThumb( file, callback, width, height ) => undefined
             * @for Uploader
             * @example
             *
             * uploader.on( 'fileQueued', function( file ) {
             *     var $li = ...;
             *
             *     uploader.makeThumb( file, function( error, ret ) {
             *         if ( error ) {
             *             $li.text('预览错误');
             *         } else {
             *             $li.append('<img alt="" src="' + ret + '" />');
             *         }
             *     });
             *
             * });
             */
            makeThumb: function( file, cb, width, height ) {
                var opts, image;
    
                file = this.request( 'get-file', file );
    
                // 只预览图片格式。
                if ( !file.type.match( /^image/ ) ) {
                    cb( true );
                    return;
                }
    
                opts = $.extend({}, this.options.thumb );
    
                // 如果传入的是object.
                if ( $.isPlainObject( width ) ) {
                    opts = $.extend( opts, width );
                    width = null;
                }
    
                width = width || opts.width;
                height = height || opts.height;
    
                image = new Image( opts );
    
                image.once( 'load', function() {
                    file._info = file._info || image.info();
                    file._meta = file._meta || image.meta();
                    image.resize( width, height );
                });
    
                image.once( 'complete', function() {
                    cb( false, image.getAsDataUrl( opts.type ) );
                    image.destroy();
                });
    
                image.once( 'error', function() {
                    cb( true );
                    image.destroy();
                });
    
                throttle( image, file.source.size, function() {
                    file._info && image.info( file._info );
                    file._meta && image.meta( file._meta );
                    image.loadFromBlob( file.source );
                });
            },
    
            compressImage: function( file ) {
                var opts = this.options.compress || this.options.resize,
                    compressSize = opts && opts.compressSize || 300 * 1024,
                    image, deferred;
    
                file = this.request( 'get-file', file );
    
                // 只预览图片格式。
                if ( !opts || !~'image/jpeg,image/jpg'.indexOf( file.type ) ||
                        file.size < compressSize ||
                        file._compressed ) {
                    return;
                }
    
                opts = $.extend({}, opts );
                deferred = Base.Deferred();
    
                image = new Image( opts );
    
                deferred.always(function() {
                    image.destroy();
                    image = null;
                });
                image.once( 'error', deferred.reject );
                image.once( 'load', function() {
                    file._info = file._info || image.info();
                    file._meta = file._meta || image.meta();
                    image.resize( opts.width, opts.height );
                });
    
                image.once( 'complete', function() {
                    var blob, size;
    
                    // 移动端 UC / qq 浏览器的无图模式下
                    // ctx.getImageData 处理大图的时候会报 Exception
                    // INDEX_SIZE_ERR: DOM Exception 1
                    try {
                        blob = image.getAsBlob( opts.type );
    
                        size = file.size;
    
                        // 如果压缩后，比原来还大则不用压缩后的。
                        if ( blob.size < size ) {
                            // file.source.destroy && file.source.destroy();
                            file.source = blob;
                            file.size = blob.size;
    
                            file.trigger( 'resize', blob.size, size );
                        }
    
                        // 标记，避免重复压缩。
                        file._compressed = true;
                        deferred.resolve();
                    } catch ( e ) {
                        // 出错了直接继续，让其上传原始图片
                        deferred.resolve();
                    }
                });
    
                file._info && image.info( file._info );
                file._meta && image.meta( file._meta );
    
                image.loadFromBlob( file.source );
                return deferred.promise();
            }
        });
    });
    /**
     * @fileOverview 文件属性封装
     */
    define('file',[
        'base',
        'mediator'
    ], function( Base, Mediator ) {
    
        var $ = Base.$,
            idPrefix = 'WU_FILE_',
            idSuffix = 0,
            rExt = /\.([^.]+)$/,
            statusMap = {};
    
        function gid() {
            return idPrefix + idSuffix++;
        }
    
        /**
         * 文件类
         * @class File
         * @constructor 构造函数
         * @grammar new File( source ) => File
         * @param {Lib.File} source [lib.File](#Lib.File)实例, 此source对象是带有Runtime信息的。
         */
        function WUFile( source ) {
    
            /**
             * 文件名，包括扩展名（后缀）
             * @property name
             * @type {string}
             */
            this.name = source.name || 'Untitled';
    
            /**
             * 文件体积（字节）
             * @property size
             * @type {uint}
             * @default 0
             */
            this.size = source.size || 0;
    
            /**
             * 文件MIMETYPE类型，与文件类型的对应关系请参考[http://t.cn/z8ZnFny](http://t.cn/z8ZnFny)
             * @property type
             * @type {string}
             * @default 'application'
             */
            this.type = source.type || 'application';
    
            /**
             * 文件最后修改日期
             * @property lastModifiedDate
             * @type {int}
             * @default 当前时间戳
             */
            this.lastModifiedDate = source.lastModifiedDate || (new Date() * 1);
    
            /**
             * 文件ID，每个对象具有唯一ID，与文件名无关
             * @property id
             * @type {string}
             */
            this.id = gid();
    
            /**
             * 文件扩展名，通过文件名获取，例如test.png的扩展名为png
             * @property ext
             * @type {string}
             */
            this.ext = rExt.exec( this.name ) ? RegExp.$1 : '';
    
    
            /**
             * 状态文字说明。在不同的status语境下有不同的用途。
             * @property statusText
             * @type {string}
             */
            this.statusText = '';
    
            // 存储文件状态，防止通过属性直接修改
            statusMap[ this.id ] = WUFile.Status.INITED;
    
            this.source = source;
            this.loaded = 0;
    
            this.on( 'error', function( msg ) {
                this.setStatus( WUFile.Status.ERROR, msg );
            });
        }
    
        $.extend( WUFile.prototype, {
    
            /**
             * 设置状态，状态变化时会触发`change`事件。
             * @method setStatus
             * @grammar setStatus( status[, statusText] );
             * @param {File.Status|String} status [文件状态值](#WebUploader:File:File.Status)
             * @param {String} [statusText=''] 状态说明，常在error时使用，用http, abort,server等来标记是由于什么原因导致文件错误。
             */
            setStatus: function( status, text ) {
    
                var prevStatus = statusMap[ this.id ];
    
                typeof text !== 'undefined' && (this.statusText = text);
    
                if ( status !== prevStatus ) {
                    statusMap[ this.id ] = status;
                    /**
                     * 文件状态变化
                     * @event statuschange
                     */
                    this.trigger( 'statuschange', status, prevStatus );
                }
    
            },
    
            /**
             * 获取文件状态
             * @return {File.Status}
             * @example
                     文件状态具体包括以下几种类型：
                     {
                         // 初始化
                        INITED:     0,
                        // 已入队列
                        QUEUED:     1,
                        // 正在上传
                        PROGRESS:     2,
                        // 上传出错
                        ERROR:         3,
                        // 上传成功
                        COMPLETE:     4,
                        // 上传取消
                        CANCELLED:     5
                    }
             */
            getStatus: function() {
                return statusMap[ this.id ];
            },
    
            /**
             * 获取文件原始信息。
             * @return {*}
             */
            getSource: function() {
                return this.source;
            },
    
            destory: function() {
                delete statusMap[ this.id ];
            }
        });
    
        Mediator.installTo( WUFile.prototype );
    
        /**
         * 文件状态值，具体包括以下几种类型：
         * * `inited` 初始状态
         * * `queued` 已经进入队列, 等待上传
         * * `progress` 上传中
         * * `complete` 上传完成。
         * * `error` 上传出错，可重试
         * * `interrupt` 上传中断，可续传。
         * * `invalid` 文件不合格，不能重试上传。会自动从队列中移除。
         * * `cancelled` 文件被移除。
         * @property {Object} Status
         * @namespace File
         * @class File
         * @static
         */
        WUFile.Status = {
            INITED:     'inited',    // 初始状态
            QUEUED:     'queued',    // 已经进入队列, 等待上传
            PROGRESS:   'progress',    // 上传中
            ERROR:      'error',    // 上传出错，可重试
            COMPLETE:   'complete',    // 上传完成。
            CANCELLED:  'cancelled',    // 上传取消。
            INTERRUPT:  'interrupt',    // 上传中断，可续传。
            INVALID:    'invalid'    // 文件不合格，不能重试上传。
        };
    
        return WUFile;
    });
    
    /**
     * @fileOverview 文件队列
     */
    define('queue',[
        'base',
        'mediator',
        'file'
    ], function( Base, Mediator, WUFile ) {
    
        var $ = Base.$,
            STATUS = WUFile.Status;
    
        /**
         * 文件队列, 用来存储各个状态中的文件。
         * @class Queue
         * @extends Mediator
         */
        function Queue() {
    
            /**
             * 统计文件数。
             * * `numOfQueue` 队列中的文件数。
             * * `numOfSuccess` 上传成功的文件数
             * * `numOfCancel` 被移除的文件数
             * * `numOfProgress` 正在上传中的文件数
             * * `numOfUploadFailed` 上传错误的文件数。
             * * `numOfInvalid` 无效的文件数。
             * @property {Object} stats
             */
            this.stats = {
                numOfQueue: 0,
                numOfSuccess: 0,
                numOfCancel: 0,
                numOfProgress: 0,
                numOfUploadFailed: 0,
                numOfInvalid: 0
            };
    
            // 上传队列，仅包括等待上传的文件
            this._queue = [];
    
            // 存储所有文件
            this._map = {};
        }
    
        $.extend( Queue.prototype, {
    
            /**
             * 将新文件加入对队列尾部
             *
             * @method append
             * @param  {File} file   文件对象
             */
            append: function( file ) {
                this._queue.push( file );
                this._fileAdded( file );
                return this;
            },
    
            /**
             * 将新文件加入对队列头部
             *
             * @method prepend
             * @param  {File} file   文件对象
             */
            prepend: function( file ) {
                this._queue.unshift( file );
                this._fileAdded( file );
                return this;
            },
    
            /**
             * 获取文件对象
             *
             * @method getFile
             * @param  {String} fileId   文件ID
             * @return {File}
             */
            getFile: function( fileId ) {
                if ( typeof fileId !== 'string' ) {
                    return fileId;
                }
                return this._map[ fileId ];
            },
    
            /**
             * 从队列中取出一个指定状态的文件。
             * @grammar fetch( status ) => File
             * @method fetch
             * @param {String} status [文件状态值](#WebUploader:File:File.Status)
             * @return {File} [File](#WebUploader:File)
             */
            fetch: function( status ) {
                var len = this._queue.length,
                    i, file;
    
                status = status || STATUS.QUEUED;
    
                for ( i = 0; i < len; i++ ) {
                    file = this._queue[ i ];
    
                    if ( status === file.getStatus() ) {
                        return file;
                    }
                }
    
                return null;
            },
    
            /**
             * 对队列进行排序，能够控制文件上传顺序。
             * @grammar sort( fn ) => undefined
             * @method sort
             * @param {Function} fn 排序方法
             */
            sort: function( fn ) {
                if ( typeof fn === 'function' ) {
                    this._queue.sort( fn );
                }
            },
    
            /**
             * 获取指定类型的文件列表, 列表中每一个成员为[File](#WebUploader:File)对象。
             * @grammar getFiles( [status1[, status2 ...]] ) => Array
             * @method getFiles
             * @param {String} [status] [文件状态值](#WebUploader:File:File.Status)
             */
            getFiles: function() {
                var sts = [].slice.call( arguments, 0 ),
                    ret = [],
                    i = 0,
                    len = this._queue.length,
                    file;
    
                for ( ; i < len; i++ ) {
                    file = this._queue[ i ];
    
                    if ( sts.length && !~$.inArray( file.getStatus(), sts ) ) {
                        continue;
                    }
    
                    ret.push( file );
                }
    
                return ret;
            },
    
            _fileAdded: function( file ) {
                var me = this,
                    existing = this._map[ file.id ];
    
                if ( !existing ) {
                    this._map[ file.id ] = file;
    
                    file.on( 'statuschange', function( cur, pre ) {
                        me._onFileStatusChange( cur, pre );
                    });
                }
    
                file.setStatus( STATUS.QUEUED );
            },
    
            _onFileStatusChange: function( curStatus, preStatus ) {
                var stats = this.stats;
    
                switch ( preStatus ) {
                    case STATUS.PROGRESS:
                        stats.numOfProgress--;
                        break;
    
                    case STATUS.QUEUED:
                        stats.numOfQueue --;
                        break;
    
                    case STATUS.ERROR:
                        stats.numOfUploadFailed--;
                        break;
    
                    case STATUS.INVALID:
                        stats.numOfInvalid--;
                        break;
                }
    
                switch ( curStatus ) {
                    case STATUS.QUEUED:
                        stats.numOfQueue++;
                        break;
    
                    case STATUS.PROGRESS:
                        stats.numOfProgress++;
                        break;
    
                    case STATUS.ERROR:
                        stats.numOfUploadFailed++;
                        break;
    
                    case STATUS.COMPLETE:
                        stats.numOfSuccess++;
                        break;
    
                    case STATUS.CANCELLED:
                        stats.numOfCancel++;
                        break;
    
                    case STATUS.INVALID:
                        stats.numOfInvalid++;
                        break;
                }
            }
    
        });
    
        Mediator.installTo( Queue.prototype );
    
        return Queue;
    });
    /**
     * @fileOverview 队列
     */
    define('widgets/queue',[
        'base',
        'uploader',
        'queue',
        'file',
        'lib/file',
        'runtime/client',
        'widgets/widget'
    ], function( Base, Uploader, Queue, WUFile, File, RuntimeClient ) {
    
        var $ = Base.$,
            rExt = /\.\w+$/,
            Status = WUFile.Status;
    
        return Uploader.register({
            'sort-files': 'sortFiles',
            'add-file': 'addFiles',
            'get-file': 'getFile',
            'fetch-file': 'fetchFile',
            'get-stats': 'getStats',
            'get-files': 'getFiles',
            'remove-file': 'removeFile',
            'retry': 'retry',
            'reset': 'reset',
            'accept-file': 'acceptFile'
        }, {
    
            init: function( opts ) {
                var me = this,
                    deferred, len, i, item, arr, accept, runtime;
    
                if ( $.isPlainObject( opts.accept ) ) {
                    opts.accept = [ opts.accept ];
                }
    
                // accept中的中生成匹配正则。
                if ( opts.accept ) {
                    arr = [];
    
                    for ( i = 0, len = opts.accept.length; i < len; i++ ) {
                        item = opts.accept[ i ].extensions;
                        item && arr.push( item );
                    }
    
                    if ( arr.length ) {
                        accept = '\\.' + arr.join(',')
                                .replace( /,/g, '$|\\.' )
                                .replace( /\*/g, '.*' ) + '$';
                    }
    
                    me.accept = new RegExp( accept, 'i' );
                }
    
                me.queue = new Queue();
                me.stats = me.queue.stats;
    
                // 如果当前不是html5运行时，那就算了。
                // 不执行后续操作
                if ( this.request('predict-runtime-type') !== 'html5' ) {
                    return;
                }
    
                // 创建一个 html5 运行时的 placeholder
                // 以至于外部添加原生 File 对象的时候能正确包裹一下供 webuploader 使用。
                deferred = Base.Deferred();
                runtime = new RuntimeClient('Placeholder');
                runtime.connectRuntime({
                    runtimeOrder: 'html5'
                }, function() {
                    me._ruid = runtime.getRuid();
                    deferred.resolve();
                });
                return deferred.promise();
            },
    
    
            // 为了支持外部直接添加一个原生File对象。
            _wrapFile: function( file ) {
                if ( !(file instanceof WUFile) ) {
    
                    if ( !(file instanceof File) ) {
                        if ( !this._ruid ) {
                            throw new Error('Can\'t add external files.');
                        }
                        file = new File( this._ruid, file );
                    }
    
                    file = new WUFile( file );
                }
    
                return file;
            },
    
            // 判断文件是否可以被加入队列
            acceptFile: function( file ) {
                var invalid = !file || file.size < 6 || this.accept &&
    
                        // 如果名字中有后缀，才做后缀白名单处理。
                        rExt.exec( file.name ) && !this.accept.test( file.name );
    
                return !invalid;
            },
    
    
            /**
             * @event beforeFileQueued
             * @param {File} file File对象
             * @description 当文件被加入队列之前触发，此事件的handler返回值为`false`，则此文件不会被添加进入队列。
             * @for  Uploader
             */
    
            /**
             * @event fileQueued
             * @param {File} file File对象
             * @description 当文件被加入队列以后触发。
             * @for  Uploader
             */
    
            _addFile: function( file ) {
                var me = this;
    
                file = me._wrapFile( file );
    
                // 不过类型判断允许不允许，先派送 `beforeFileQueued`
                if ( !me.owner.trigger( 'beforeFileQueued', file ) ) {
                    return;
                }
    
                // 类型不匹配，则派送错误事件，并返回。
                if ( !me.acceptFile( file ) ) {
                    me.owner.trigger( 'error', 'Q_TYPE_DENIED', file );
                    return;
                }
    
                me.queue.append( file );
                me.owner.trigger( 'fileQueued', file );
                return file;
            },
    
            getFile: function( fileId ) {
                return this.queue.getFile( fileId );
            },
    
            /**
             * @event filesQueued
             * @param {File} files 数组，内容为原始File(lib/File）对象。
             * @description 当一批文件添加进队列以后触发。
             * @for  Uploader
             */
    
            /**
             * @method addFiles
             * @grammar addFiles( file ) => undefined
             * @grammar addFiles( [file1, file2 ...] ) => undefined
             * @param {Array of File or File} [files] Files 对象 数组
             * @description 添加文件到队列
             * @for  Uploader
             */
            addFiles: function( files ) {
                var me = this;
    
                if ( !files.length ) {
                    files = [ files ];
                }
    
                files = $.map( files, function( file ) {
                    return me._addFile( file );
                });
    
                me.owner.trigger( 'filesQueued', files );
    
                if ( me.options.auto ) {
                    me.request('start-upload');
                }
            },
    
            getStats: function() {
                return this.stats;
            },
    
            /**
             * @event fileDequeued
             * @param {File} file File对象
             * @description 当文件被移除队列后触发。
             * @for  Uploader
             */
    
            /**
             * @method removeFile
             * @grammar removeFile( file ) => undefined
             * @grammar removeFile( id ) => undefined
             * @param {File|id} file File对象或这File对象的id
             * @description 移除某一文件。
             * @for  Uploader
             * @example
             *
             * $li.on('click', '.remove-this', function() {
             *     uploader.removeFile( file );
             * })
             */
            removeFile: function( file ) {
                var me = this;
    
                file = file.id ? file : me.queue.getFile( file );
    
                file.setStatus( Status.CANCELLED );
                me.owner.trigger( 'fileDequeued', file );
            },
    
            /**
             * @method getFiles
             * @grammar getFiles() => Array
             * @grammar getFiles( status1, status2, status... ) => Array
             * @description 返回指定状态的文件集合，不传参数将返回所有状态的文件。
             * @for  Uploader
             * @example
             * console.log( uploader.getFiles() );    // => all files
             * console.log( uploader.getFiles('error') )    // => all error files.
             */
            getFiles: function() {
                return this.queue.getFiles.apply( this.queue, arguments );
            },
    
            fetchFile: function() {
                return this.queue.fetch.apply( this.queue, arguments );
            },
    
            /**
             * @method retry
             * @grammar retry() => undefined
             * @grammar retry( file ) => undefined
             * @description 重试上传，重试指定文件，或者从出错的文件开始重新上传。
             * @for  Uploader
             * @example
             * function retry() {
             *     uploader.retry();
             * }
             */
            retry: function( file, noForceStart ) {
                var me = this,
                    files, i, len;
    
                if ( file ) {
                    file = file.id ? file : me.queue.getFile( file );
                    file.setStatus( Status.QUEUED );
                    noForceStart || me.request('start-upload');
                    return;
                }
    
                files = me.queue.getFiles( Status.ERROR );
                i = 0;
                len = files.length;
    
                for ( ; i < len; i++ ) {
                    file = files[ i ];
                    file.setStatus( Status.QUEUED );
                }
    
                me.request('start-upload');
            },
    
            /**
             * @method sort
             * @grammar sort( fn ) => undefined
             * @description 排序队列中的文件，在上传之前调整可以控制上传顺序。
             * @for  Uploader
             */
            sortFiles: function() {
                return this.queue.sort.apply( this.queue, arguments );
            },
    
            /**
             * @method reset
             * @grammar reset() => undefined
             * @description 重置uploader。目前只重置了队列。
             * @for  Uploader
             * @example
             * uploader.reset();
             */
            reset: function() {
                this.queue = new Queue();
                this.stats = this.queue.stats;
            }
        });
    
    });
    /**
     * @fileOverview 添加获取Runtime相关信息的方法。
     */
    define('widgets/runtime',[
        'uploader',
        'runtime/runtime',
        'widgets/widget'
    ], function( Uploader, Runtime ) {
    
        Uploader.support = function() {
            return Runtime.hasRuntime.apply( Runtime, arguments );
        };
    
        return Uploader.register({
            'predict-runtime-type': 'predictRuntmeType'
        }, {
    
            init: function() {
                if ( !this.predictRuntmeType() ) {
                    throw Error('Runtime Error');
                }
            },
    
            /**
             * 预测Uploader将采用哪个`Runtime`
             * @grammar predictRuntmeType() => String
             * @method predictRuntmeType
             * @for  Uploader
             */
            predictRuntmeType: function() {
                var orders = this.options.runtimeOrder || Runtime.orders,
                    type = this.type,
                    i, len;
    
                if ( !type ) {
                    orders = orders.split( /\s*,\s*/g );
    
                    for ( i = 0, len = orders.length; i < len; i++ ) {
                        if ( Runtime.hasRuntime( orders[ i ] ) ) {
                            this.type = type = orders[ i ];
                            break;
                        }
                    }
                }
    
                return type;
            }
        });
    });
    /**
     * @fileOverview Transport
     */
    define('lib/transport',[
        'base',
        'runtime/client',
        'mediator'
    ], function( Base, RuntimeClient, Mediator ) {
    
        var $ = Base.$;
    
        function Transport( opts ) {
            var me = this;
    
            opts = me.options = $.extend( true, {}, Transport.options, opts || {} );
            RuntimeClient.call( this, 'Transport' );
    
            this._blob = null;
            this._formData = opts.formData || {};
            this._headers = opts.headers || {};
    
            this.on( 'progress', this._timeout );
            this.on( 'load error', function() {
                me.trigger( 'progress', 1 );
                clearTimeout( me._timer );
            });
        }
    
        Transport.options = {
            server: '',
            method: 'POST',
    
            // 跨域时，是否允许携带cookie, 只有html5 runtime才有效
            withCredentials: false,
            fileVal: 'file',
            timeout: 2 * 60 * 1000,    // 2分钟
            formData: {},
            headers: {},
            sendAsBinary: false
        };
    
        $.extend( Transport.prototype, {
    
            // 添加Blob, 只能添加一次，最后一次有效。
            appendBlob: function( key, blob, filename ) {
                var me = this,
                    opts = me.options;
    
                if ( me.getRuid() ) {
                    me.disconnectRuntime();
                }
    
                // 连接到blob归属的同一个runtime.
                me.connectRuntime( blob.ruid, function() {
                    me.exec('init');
                });
    
                me._blob = blob;
                opts.fileVal = key || opts.fileVal;
                opts.filename = filename || opts.filename;
            },
    
            // 添加其他字段
            append: function( key, value ) {
                if ( typeof key === 'object' ) {
                    $.extend( this._formData, key );
                } else {
                    this._formData[ key ] = value;
                }
            },
    
            setRequestHeader: function( key, value ) {
                if ( typeof key === 'object' ) {
                    $.extend( this._headers, key );
                } else {
                    this._headers[ key ] = value;
                }
            },
    
            send: function( method ) {
                this.exec( 'send', method );
                this._timeout();
            },
    
            abort: function() {
                clearTimeout( this._timer );
                return this.exec('abort');
            },
    
            destroy: function() {
                this.trigger('destroy');
                this.off();
                this.exec('destroy');
                this.disconnectRuntime();
            },
    
            getResponse: function() {
                return this.exec('getResponse');
            },
    
            getResponseAsJson: function() {
                return this.exec('getResponseAsJson');
            },
    
            getStatus: function() {
                return this.exec('getStatus');
            },
    
            _timeout: function() {
                var me = this,
                    duration = me.options.timeout;
    
                if ( !duration ) {
                    return;
                }
    
                clearTimeout( me._timer );
                me._timer = setTimeout(function() {
                    me.abort();
                    me.trigger( 'error', 'timeout' );
                }, duration );
            }
    
        });
    
        // 让Transport具备事件功能。
        Mediator.installTo( Transport.prototype );
    
        return Transport;
    });
    /**
     * @fileOverview 负责文件上传相关。
     */
    define('widgets/upload',[
        'base',
        'uploader',
        'file',
        'lib/transport',
        'widgets/widget'
    ], function( Base, Uploader, WUFile, Transport ) {
    
        var $ = Base.$,
            isPromise = Base.isPromise,
            Status = WUFile.Status;
    
        // 添加默认配置项
        $.extend( Uploader.options, {
    
    
            /**
             * @property {Boolean} [prepareNextFile=false]
             * @namespace options
             * @for Uploader
             * @description 是否允许在文件传输时提前把下一个文件准备好。
             * 对于一个文件的准备工作比较耗时，比如图片压缩，md5序列化。
             * 如果能提前在当前文件传输期处理，可以节省总体耗时。
             */
            prepareNextFile: false,
    
            /**
             * @property {Boolean} [chunked=false]
             * @namespace options
             * @for Uploader
             * @description 是否要分片处理大文件上传。
             */
            chunked: false,
    
            /**
             * @property {Boolean} [chunkSize=5242880]
             * @namespace options
             * @for Uploader
             * @description 如果要分片，分多大一片？ 默认大小为5M.
             */
            chunkSize: 5 * 1024 * 1024,
    
            /**
             * @property {Boolean} [chunkRetry=2]
             * @namespace options
             * @for Uploader
             * @description 如果某个分片由于网络问题出错，允许自动重传多少次？
             */
            chunkRetry: 2,
    
            /**
             * @property {Boolean} [threads=3]
             * @namespace options
             * @for Uploader
             * @description 上传并发数。允许同时最大上传进程数。
             */
            threads: 3,
    
    
            /**
             * @property {Object} [formData]
             * @namespace options
             * @for Uploader
             * @description 文件上传请求的参数表，每次发送都会发送此对象中的参数。
             */
            formData: null
    
            /**
             * @property {Object} [fileVal='file']
             * @namespace options
             * @for Uploader
             * @description 设置文件上传域的name。
             */
    
            /**
             * @property {Object} [method='POST']
             * @namespace options
             * @for Uploader
             * @description 文件上传方式，`POST`或者`GET`。
             */
    
            /**
             * @property {Object} [sendAsBinary=false]
             * @namespace options
             * @for Uploader
             * @description 是否已二进制的流的方式发送文件，这样整个上传内容`php://input`都为文件内容，
             * 其他参数在$_GET数组中。
             */
        });
    
        // 负责将文件切片。
        function CuteFile( file, chunkSize ) {
            var pending = [],
                blob = file.source,
                total = blob.size,
                chunks = chunkSize ? Math.ceil( total / chunkSize ) : 1,
                start = 0,
                index = 0,
                len;
    
            while ( index < chunks ) {
                len = Math.min( chunkSize, total - start );
    
                pending.push({
                    file: file,
                    start: start,
                    end: chunkSize ? (start + len) : total,
                    total: total,
                    chunks: chunks,
                    chunk: index++
                });
                start += len;
            }
    
            file.blocks = pending.concat();
            file.remaning = pending.length;
    
            return {
                file: file,
    
                has: function() {
                    return !!pending.length;
                },
    
                fetch: function() {
                    return pending.shift();
                }
            };
        }
    
        Uploader.register({
            'start-upload': 'start',
            'stop-upload': 'stop',
            'skip-file': 'skipFile',
            'is-in-progress': 'isInProgress'
        }, {
    
            init: function() {
                var owner = this.owner;
    
                this.runing = false;
    
                // 记录当前正在传的数据，跟threads相关
                this.pool = [];
    
                // 缓存即将上传的文件。
                this.pending = [];
    
                // 跟踪还有多少分片没有完成上传。
                this.remaning = 0;
                this.__tick = Base.bindFn( this._tick, this );
    
                owner.on( 'uploadComplete', function( file ) {
                    // 把其他块取消了。
                    file.blocks && $.each( file.blocks, function( _, v ) {
                        v.transport && (v.transport.abort(), v.transport.destroy());
                        delete v.transport;
                    });
    
                    delete file.blocks;
                    delete file.remaning;
                });
            },
    
            /**
             * @event startUpload
             * @description 当开始上传流程时触发。
             * @for  Uploader
             */
    
            /**
             * 开始上传。此方法可以从初始状态调用开始上传流程，也可以从暂停状态调用，继续上传流程。
             * @grammar upload() => undefined
             * @method upload
             * @for  Uploader
             */
            start: function() {
                var me = this;
    
                // 移出invalid的文件
                $.each( me.request( 'get-files', Status.INVALID ), function() {
                    me.request( 'remove-file', this );
                });
    
                if ( me.runing ) {
                    return;
                }
    
                me.runing = true;
    
                // 如果有暂停的，则续传
                $.each( me.pool, function( _, v ) {
                    var file = v.file;
    
                    if ( file.getStatus() === Status.INTERRUPT ) {
                        file.setStatus( Status.PROGRESS );
                        me._trigged = false;
                        v.transport && v.transport.send();
                    }
                });
    
                me._trigged = false;
                me.owner.trigger('startUpload');
                Base.nextTick( me.__tick );
            },
    
            /**
             * @event stopUpload
             * @description 当开始上传流程暂停时触发。
             * @for  Uploader
             */
    
            /**
             * 暂停上传。第一个参数为是否中断上传当前正在上传的文件。
             * @grammar stop() => undefined
             * @grammar stop( true ) => undefined
             * @method stop
             * @for  Uploader
             */
            stop: function( interrupt ) {
                var me = this;
    
                if ( me.runing === false ) {
                    return;
                }
    
                me.runing = false;
    
                interrupt && $.each( me.pool, function( _, v ) {
                    v.transport && v.transport.abort();
                    v.file.setStatus( Status.INTERRUPT );
                });
    
                me.owner.trigger('stopUpload');
            },
    
            /**
             * 判断`Uplaode`r是否正在上传中。
             * @grammar isInProgress() => Boolean
             * @method isInProgress
             * @for  Uploader
             */
            isInProgress: function() {
                return !!this.runing;
            },
    
            getStats: function() {
                return this.request('get-stats');
            },
    
            /**
             * 掉过一个文件上传，直接标记指定文件为已上传状态。
             * @grammar skipFile( file ) => undefined
             * @method skipFile
             * @for  Uploader
             */
            skipFile: function( file, status ) {
                file = this.request( 'get-file', file );
    
                file.setStatus( status || Status.COMPLETE );
                file.skipped = true;
    
                // 如果正在上传。
                file.blocks && $.each( file.blocks, function( _, v ) {
                    var _tr = v.transport;
    
                    if ( _tr ) {
                        _tr.abort();
                        _tr.destroy();
                        delete v.transport;
                    }
                });
    
                this.owner.trigger( 'uploadSkip', file );
            },
    
            /**
             * @event uploadFinished
             * @description 当所有文件上传结束时触发。
             * @for  Uploader
             */
            _tick: function() {
                var me = this,
                    opts = me.options,
                    fn, val;
    
                // 上一个promise还没有结束，则等待完成后再执行。
                if ( me._promise ) {
                    return me._promise.always( me.__tick );
                }
    
                // 还有位置，且还有文件要处理的话。
                if ( me.pool.length < opts.threads && (val = me._nextBlock()) ) {
                    me._trigged = false;
    
                    fn = function( val ) {
                        me._promise = null;
    
                        // 有可能是reject过来的，所以要检测val的类型。
                        val && val.file && me._startSend( val );
                        Base.nextTick( me.__tick );
                    };
    
                    me._promise = isPromise( val ) ? val.always( fn ) : fn( val );
    
                // 没有要上传的了，且没有正在传输的了。
                } else if ( !me.remaning && !me.getStats().numOfQueue ) {
                    me.runing = false;
    
                    me._trigged || Base.nextTick(function() {
                        me.owner.trigger('uploadFinished');
                    });
                    me._trigged = true;
                }
            },
    
            _nextBlock: function() {
                var me = this,
                    act = me._act,
                    opts = me.options,
                    next, done;
    
                // 如果当前文件还有没有需要传输的，则直接返回剩下的。
                if ( act && act.has() &&
                        act.file.getStatus() === Status.PROGRESS ) {
    
                    // 是否提前准备下一个文件
                    if ( opts.prepareNextFile && !me.pending.length ) {
                        me._prepareNextFile();
                    }
    
                    return act.fetch();
    
                // 否则，如果正在运行，则准备下一个文件，并等待完成后返回下个分片。
                } else if ( me.runing ) {
    
                    // 如果缓存中有，则直接在缓存中取，没有则去queue中取。
                    if ( !me.pending.length && me.getStats().numOfQueue ) {
                        me._prepareNextFile();
                    }
    
                    next = me.pending.shift();
                    done = function( file ) {
                        if ( !file ) {
                            return null;
                        }
    
                        act = CuteFile( file, opts.chunked ? opts.chunkSize : 0 );
                        me._act = act;
                        return act.fetch();
                    };
    
                    // 文件可能还在prepare中，也有可能已经完全准备好了。
                    return isPromise( next ) ?
                            next[ next.pipe ? 'pipe' : 'then']( done ) :
                            done( next );
                }
            },
    
    
            /**
             * @event uploadStart
             * @param {File} file File对象
             * @description 某个文件开始上传前触发，一个文件只会触发一次。
             * @for  Uploader
             */
            _prepareNextFile: function() {
                var me = this,
                    file = me.request('fetch-file'),
                    pending = me.pending,
                    promise;
    
                if ( file ) {
                    promise = me.request( 'before-send-file', file, function() {
    
                        // 有可能文件被skip掉了。文件被skip掉后，状态坑定不是Queued.
                        if ( file.getStatus() === Status.QUEUED ) {
                            me.owner.trigger( 'uploadStart', file );
                            file.setStatus( Status.PROGRESS );
                            return file;
                        }
    
                        return me._finishFile( file );
                    });
    
                    // 如果还在pending中，则替换成文件本身。
                    promise.done(function() {
                        var idx = $.inArray( promise, pending );
    
                        ~idx && pending.splice( idx, 1, file );
                    });
    
                    // befeore-send-file的钩子就有错误发生。
                    promise.fail(function( reason ) {
                        file.setStatus( Status.ERROR, reason );
                        me.owner.trigger( 'uploadError', file, reason );
                        me.owner.trigger( 'uploadComplete', file );
                    });
    
                    pending.push( promise );
                }
            },
    
            // 让出位置了，可以让其他分片开始上传
            _popBlock: function( block ) {
                var idx = $.inArray( block, this.pool );
    
                this.pool.splice( idx, 1 );
                block.file.remaning--;
                this.remaning--;
            },
    
            // 开始上传，可以被掉过。如果promise被reject了，则表示跳过此分片。
            _startSend: function( block ) {
                var me = this,
                    file = block.file,
                    promise;
    
                me.pool.push( block );
                me.remaning++;
    
                // 如果没有分片，则直接使用原始的。
                // 不会丢失content-type信息。
                block.blob = block.chunks === 1 ? file.source :
                        file.source.slice( block.start, block.end );
    
                // hook, 每个分片发送之前可能要做些异步的事情。
                promise = me.request( 'before-send', block, function() {
    
                    // 有可能文件已经上传出错了，所以不需要再传输了。
                    if ( file.getStatus() === Status.PROGRESS ) {
                        me._doSend( block );
                    } else {
                        me._popBlock( block );
                        Base.nextTick( me.__tick );
                    }
                });
    
                // 如果为fail了，则跳过此分片。
                promise.fail(function() {
                    if ( file.remaning === 1 ) {
                        me._finishFile( file ).always(function() {
                            block.percentage = 1;
                            me._popBlock( block );
                            me.owner.trigger( 'uploadComplete', file );
                            Base.nextTick( me.__tick );
                        });
                    } else {
                        block.percentage = 1;
                        me._popBlock( block );
                        Base.nextTick( me.__tick );
                    }
                });
            },
    
    
            /**
             * @event uploadBeforeSend
             * @param {Object} object
             * @param {Object} data 默认的上传参数，可以扩展此对象来控制上传参数。
             * @description 当某个文件的分块在发送前触发，主要用来询问是否要添加附带参数，大文件在开起分片上传的前提下此事件可能会触发多次。
             * @for  Uploader
             */
    
            /**
             * @event uploadAccept
             * @param {Object} object
             * @param {Object} ret 服务端的返回数据，json格式，如果服务端不是json格式，从ret._raw中取数据，自行解析。
             * @description 当某个文件上传到服务端响应后，会派送此事件来询问服务端响应是否有效。如果此事件handler返回值为`false`, 则此文件将派送`server`类型的`uploadError`事件。
             * @for  Uploader
             */
    
            /**
             * @event uploadProgress
             * @param {File} file File对象
             * @param {Number} percentage 上传进度
             * @description 上传过程中触发，携带上传进度。
             * @for  Uploader
             */
    
    
            /**
             * @event uploadError
             * @param {File} file File对象
             * @param {String} reason 出错的code
             * @description 当文件上传出错时触发。
             * @for  Uploader
             */
    
            /**
             * @event uploadSuccess
             * @param {File} file File对象
             * @param {Object} response 服务端返回的数据
             * @description 当文件上传成功时触发。
             * @for  Uploader
             */
    
            /**
             * @event uploadComplete
             * @param {File} [file] File对象
             * @description 不管成功或者失败，文件上传完成时触发。
             * @for  Uploader
             */
    
            // 做上传操作。
            _doSend: function( block ) {
                var me = this,
                    owner = me.owner,
                    opts = me.options,
                    file = block.file,
                    tr = new Transport( opts ),
                    data = $.extend({}, opts.formData ),
                    headers = $.extend({}, opts.headers ),
                    requestAccept, ret;
    
                block.transport = tr;
    
                tr.on( 'destroy', function() {
                    delete block.transport;
                    me._popBlock( block );
                    Base.nextTick( me.__tick );
                });
    
                // 广播上传进度。以文件为单位。
                tr.on( 'progress', function( percentage ) {
                    var totalPercent = 0,
                        uploaded = 0;
    
                    // 可能没有abort掉，progress还是执行进来了。
                    // if ( !file.blocks ) {
                    //     return;
                    // }
    
                    totalPercent = block.percentage = percentage;
    
                    if ( block.chunks > 1 ) {    // 计算文件的整体速度。
                        $.each( file.blocks, function( _, v ) {
                            uploaded += (v.percentage || 0) * (v.end - v.start);
                        });
    
                        totalPercent = uploaded / file.size;
                    }
    
                    owner.trigger( 'uploadProgress', file, totalPercent || 0 );
                });
    
                // 用来询问，是否返回的结果是有错误的。
                requestAccept = function( reject ) {
                    var fn;
    
                    ret = tr.getResponseAsJson() || {};
                    ret._raw = tr.getResponse();
                    fn = function( value ) {
                        reject = value;
                    };
    
                    // 服务端响应了，不代表成功了，询问是否响应正确。
                    if ( !owner.trigger( 'uploadAccept', block, ret, fn ) ) {
                        reject = reject || 'server';
                    }
    
                    return reject;
                };
    
                // 尝试重试，然后广播文件上传出错。
                tr.on( 'error', function( type, flag ) {
                    block.retried = block.retried || 0;
    
                    // 自动重试
                    if ( block.chunks > 1 && ~'http,abort'.indexOf( type ) &&
                            block.retried < opts.chunkRetry ) {
    
                        block.retried++;
                        tr.send();
    
                    } else {
    
                        // http status 500 ~ 600
                        if ( !flag && type === 'server' ) {
                            type = requestAccept( type );
                        }
    
                        file.setStatus( Status.ERROR, type );
                        owner.trigger( 'uploadError', file, type );
                        owner.trigger( 'uploadComplete', file );
                    }
                });
    
                // 上传成功
                tr.on( 'load', function() {
                    var reason;
    
                    // 如果非预期，转向上传出错。
                    if ( (reason = requestAccept()) ) {
                        tr.trigger( 'error', reason, true );
                        return;
                    }
    
                    // 全部上传完成。
                    if ( file.remaning === 1 ) {
                        me._finishFile( file, ret );
                    } else {
                        tr.destroy();
                    }
                });
    
                // 配置默认的上传字段。
                data = $.extend( data, {
                    id: file.id,
                    name: file.name,
                    type: file.type,
                    lastModifiedDate: file.lastModifiedDate,
                    size: file.size
                });
    
                block.chunks > 1 && $.extend( data, {
                    chunks: block.chunks,
                    chunk: block.chunk
                });
    
                // 在发送之间可以添加字段什么的。。。
                // 如果默认的字段不够使用，可以通过监听此事件来扩展
                owner.trigger( 'uploadBeforeSend', block, data, headers );
    
                // 开始发送。
                tr.appendBlob( opts.fileVal, block.blob, file.name );
                tr.append( data );
                tr.setRequestHeader( headers );
                tr.send();
            },
    
            // 完成上传。
            _finishFile: function( file, ret, hds ) {
                var owner = this.owner;
    
                return owner
                        .request( 'after-send-file', arguments, function() {
                            file.setStatus( Status.COMPLETE );
                            owner.trigger( 'uploadSuccess', file, ret, hds );
                        })
                        .fail(function( reason ) {
    
                            // 如果外部已经标记为invalid什么的，不再改状态。
                            if ( file.getStatus() === Status.PROGRESS ) {
                                file.setStatus( Status.ERROR, reason );
                            }
    
                            owner.trigger( 'uploadError', file, reason );
                        })
                        .always(function() {
                            owner.trigger( 'uploadComplete', file );
                        });
            }
    
        });
    });
    /**
     * @fileOverview Runtime管理器，负责Runtime的选择, 连接
     */
    define('runtime/compbase',[],function() {
    
        function CompBase( owner, runtime ) {
    
            this.owner = owner;
            this.options = owner.options;
    
            this.getRuntime = function() {
                return runtime;
            };
    
            this.getRuid = function() {
                return runtime.uid;
            };
    
            this.trigger = function() {
                return owner.trigger.apply( owner, arguments );
            };
        }
    
        return CompBase;
    });
    /**
     * @fileOverview Html5Runtime
     */
    define('runtime/html5/runtime',[
        'base',
        'runtime/runtime',
        'runtime/compbase'
    ], function( Base, Runtime, CompBase ) {
    
        var type = 'html5',
            components = {};
    
        function Html5Runtime() {
            var pool = {},
                me = this,
                destory = this.destory;
    
            Runtime.apply( me, arguments );
            me.type = type;
    
    
            // 这个方法的调用者，实际上是RuntimeClient
            me.exec = function( comp, fn/*, args...*/) {
                var client = this,
                    uid = client.uid,
                    args = Base.slice( arguments, 2 ),
                    instance;
    
                if ( components[ comp ] ) {
                    instance = pool[ uid ] = pool[ uid ] ||
                            new components[ comp ]( client, me );
    
                    if ( instance[ fn ] ) {
                        return instance[ fn ].apply( instance, args );
                    }
                }
            };
    
            me.destory = function() {
                // @todo 删除池子中的所有实例
                return destory && destory.apply( this, arguments );
            };
        }
    
        Base.inherits( Runtime, {
            constructor: Html5Runtime,
    
            // 不需要连接其他程序，直接执行callback
            init: function() {
                var me = this;
                setTimeout(function() {
                    me.trigger('ready');
                }, 1 );
            }
    
        });
    
        // 注册Components
        Html5Runtime.register = function( name, component ) {
            var klass = components[ name ] = Base.inherits( CompBase, component );
            return klass;
        };
    
        // 注册html5运行时。
        // 只有在支持的前提下注册。
        if ( window.Blob && window.FileReader && window.DataView ) {
            Runtime.addRuntime( type, Html5Runtime );
        }
    
        return Html5Runtime;
    });
    /**
     * @fileOverview Blob Html实现
     */
    define('runtime/html5/blob',[
        'runtime/html5/runtime',
        'lib/blob'
    ], function( Html5Runtime, Blob ) {
    
        return Html5Runtime.register( 'Blob', {
            slice: function( start, end ) {
                var blob = this.owner.source,
                    slice = blob.slice || blob.webkitSlice || blob.mozSlice;
    
                blob = slice.call( blob, start, end );
    
                return new Blob( this.getRuid(), blob );
            }
        });
    });
    /**
     * @fileOverview FilePicker
     */
    define('runtime/html5/filepicker',[
        'base',
        'runtime/html5/runtime'
    ], function( Base, Html5Runtime ) {
    
        var $ = Base.$;
    
        return Html5Runtime.register( 'FilePicker', {
            init: function() {
                var container = this.getRuntime().getContainer(),
                    me = this,
                    owner = me.owner,
                    opts = me.options,
                    lable = $( document.createElement('label') ),
                    input = $( document.createElement('input') ),
                    arr, i, len, mouseHandler;
    
                input.attr( 'type', 'file' );
                input.attr( 'name', opts.name );
                input.addClass('webuploader-element-invisible');
    
                lable.on( 'click', function() {
                    input.trigger('click');
                });
    
                lable.css({
                    opacity: 0,
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    cursor: 'pointer',
                    background: '#ffffff'
                });
    
                if ( opts.multiple ) {
                    input.attr( 'multiple', 'multiple' );
                }
    
                // @todo Firefox不支持单独指定后缀
                if ( opts.accept && opts.accept.length > 0 ) {
                    arr = [];
    
                    for ( i = 0, len = opts.accept.length; i < len; i++ ) {
                        arr.push( opts.accept[ i ].mimeTypes );
                    }
    
                    input.attr( 'accept', arr.join(',') );
                }
    
                container.append( input );
                container.append( lable );
    
                mouseHandler = function( e ) {
                    owner.trigger( e.type );
                };
    
                input.on( 'change', function( e ) {
                    var fn = arguments.callee,
                        clone;
    
                    me.files = e.target.files;
    
                    // reset input
                    clone = this.cloneNode( true );
                    this.parentNode.replaceChild( clone, this );
    
                    input.off();
                    input = $( clone ).on( 'change', fn )
                            .on( 'mouseenter mouseleave', mouseHandler );
    
                    owner.trigger('change');
                });
    
                lable.on( 'mouseenter mouseleave', mouseHandler );
    
            },
    
    
            getFiles: function() {
                return this.files;
            },
    
            destroy: function() {
                // todo
            }
        });
    });
    /**
     * Terms:
     *
     * Uint8Array, FileReader, BlobBuilder, atob, ArrayBuffer
     * @fileOverview Image控件
     */
    define('runtime/html5/util',[
        'base'
    ], function( Base ) {
    
        var urlAPI = window.createObjectURL && window ||
                window.URL && URL.revokeObjectURL && URL ||
                window.webkitURL,
            createObjectURL = Base.noop,
            revokeObjectURL = createObjectURL;
    
        if ( urlAPI ) {
    
            // 更安全的方式调用，比如android里面就能把context改成其他的对象。
            createObjectURL = function() {
                return urlAPI.createObjectURL.apply( urlAPI, arguments );
            };
    
            revokeObjectURL = function() {
                return urlAPI.revokeObjectURL.apply( urlAPI, arguments );
            };
        }
    
        return {
            createObjectURL: createObjectURL,
            revokeObjectURL: revokeObjectURL,
    
            dataURL2Blob: function( dataURI ) {
                var byteStr, intArray, ab, i, mimetype, parts;
    
                parts = dataURI.split(',');
    
                if ( ~parts[ 0 ].indexOf('base64') ) {
                    byteStr = atob( parts[ 1 ] );
                } else {
                    byteStr = decodeURIComponent( parts[ 1 ] );
                }
    
                ab = new ArrayBuffer( byteStr.length );
                intArray = new Uint8Array( ab );
    
                for ( i = 0; i < byteStr.length; i++ ) {
                    intArray[ i ] = byteStr.charCodeAt( i );
                }
    
                mimetype = parts[ 0 ].split(':')[ 1 ].split(';')[ 0 ];
    
                return this.arrayBufferToBlob( ab, mimetype );
            },
    
            dataURL2ArrayBuffer: function( dataURI ) {
                var byteStr, intArray, i, parts;
    
                parts = dataURI.split(',');
    
                if ( ~parts[ 0 ].indexOf('base64') ) {
                    byteStr = atob( parts[ 1 ] );
                } else {
                    byteStr = decodeURIComponent( parts[ 1 ] );
                }
    
                intArray = new Uint8Array( byteStr.length );
    
                for ( i = 0; i < byteStr.length; i++ ) {
                    intArray[ i ] = byteStr.charCodeAt( i );
                }
    
                return intArray.buffer;
            },
    
            arrayBufferToBlob: function( buffer, type ) {
                var builder = window.BlobBuilder || window.WebKitBlobBuilder,
                    bb;
    
                // android不支持直接new Blob, 只能借助blobbuilder.
                if ( builder ) {
                    bb = new builder();
                    bb.append( buffer );
                    return bb.getBlob( type );
                }
    
                return new Blob([ buffer ], type ? { type: type } : {} );
            },
    
            // 抽出来主要是为了解决android下面canvas.toDataUrl不支持jpeg.
            // 你得到的结果是png.
            canvasToDataUrl: function( canvas, type, quality ) {
                return canvas.toDataURL( type, quality / 100 );
            },
    
            // imagemeat会复写这个方法，如果用户选择加载那个文件了的话。
            parseMeta: function( blob, callback ) {
                callback( false, {});
            },
    
            // imagemeat会复写这个方法，如果用户选择加载那个文件了的话。
            updateImageHead: function( data ) {
                return data;
            }
        };
    });
    /**
     * Terms:
     *
     * Uint8Array, FileReader, BlobBuilder, atob, ArrayBuffer
     * @fileOverview Image控件
     */
    define('runtime/html5/imagemeta',[
        'runtime/html5/util'
    ], function( Util ) {
    
        var api;
    
        api = {
            parsers: {
                0xffe1: []
            },
    
            maxMetaDataSize: 262144,
    
            parse: function( blob, cb ) {
                var me = this,
                    fr = new FileReader();
    
                fr.onload = function() {
                    cb( false, me._parse( this.result ) );
                    fr = fr.onload = fr.onerror = null;
                };
    
                fr.onerror = function( e ) {
                    cb( e.message );
                    fr = fr.onload = fr.onerror = null;
                };
    
                blob = blob.slice( 0, me.maxMetaDataSize );
                fr.readAsArrayBuffer( blob.getSource() );
            },
    
            _parse: function( buffer, noParse ) {
                if ( buffer.byteLength < 6 ) {
                    return;
                }
    
                var dataview = new DataView( buffer ),
                    offset = 2,
                    maxOffset = dataview.byteLength - 4,
                    headLength = offset,
                    ret = {},
                    markerBytes, markerLength, parsers, i;
    
                if ( dataview.getUint16( 0 ) === 0xffd8 ) {
    
                    while ( offset < maxOffset ) {
                        markerBytes = dataview.getUint16( offset );
    
                        if ( markerBytes >= 0xffe0 && markerBytes <= 0xffef ||
                                markerBytes === 0xfffe ) {
    
                            markerLength = dataview.getUint16( offset + 2 ) + 2;
    
                            if ( offset + markerLength > dataview.byteLength ) {
                                break;
                            }
    
                            parsers = api.parsers[ markerBytes ];
    
                            if ( !noParse && parsers ) {
                                for ( i = 0; i < parsers.length; i += 1 ) {
                                    parsers[ i ].call( api, dataview, offset,
                                            markerLength, ret );
                                }
                            }
    
                            offset += markerLength;
                            headLength = offset;
                        } else {
                            break;
                        }
                    }
    
                    if ( headLength > 6 ) {
                        if ( buffer.slice ) {
                            ret.imageHead = buffer.slice( 2, headLength );
                        } else {
                            // Workaround for IE10, which does not yet
                            // support ArrayBuffer.slice:
                            ret.imageHead = new Uint8Array( buffer )
                                    .subarray( 2, headLength );
                        }
                    }
                }
    
                return ret;
            },
    
            updateImageHead: function( buffer, head ) {
                var data = this._parse( buffer, true ),
                    buf1, buf2, bodyoffset;
    
    
                bodyoffset = 2;
                if ( data.imageHead ) {
                    bodyoffset = 2 + data.imageHead.byteLength;
                }
    
                if ( buffer.slice ) {
                    buf2 = buffer.slice( bodyoffset );
                } else {
                    buf2 = new Uint8Array( buffer ).subarray( bodyoffset );
                }
    
                buf1 = new Uint8Array( head.byteLength + 2 + buf2.byteLength );
    
                buf1[ 0 ] = 0xFF;
                buf1[ 1 ] = 0xD8;
                buf1.set( new Uint8Array( head ), 2 );
                buf1.set( new Uint8Array( buf2 ), head.byteLength + 2 );
    
                return buf1.buffer;
            }
        };
    
        Util.parseMeta = function() {
            return api.parse.apply( api, arguments );
        };
    
        Util.updateImageHead = function() {
            return api.updateImageHead.apply( api, arguments );
        };
    
        return api;
    });
    /**
     * 代码来自于：https://github.com/blueimp/JavaScript-Load-Image
     * 暂时项目中只用了orientation.
     *
     * 去除了 Exif Sub IFD Pointer, GPS Info IFD Pointer, Exif Thumbnail.
     * @fileOverview EXIF解析
     */
    
    // Sample
    // ====================================
    // Make : Apple
    // Model : iPhone 4S
    // Orientation : 1
    // XResolution : 72 [72/1]
    // YResolution : 72 [72/1]
    // ResolutionUnit : 2
    // Software : QuickTime 7.7.1
    // DateTime : 2013:09:01 22:53:55
    // ExifIFDPointer : 190
    // ExposureTime : 0.058823529411764705 [1/17]
    // FNumber : 2.4 [12/5]
    // ExposureProgram : Normal program
    // ISOSpeedRatings : 800
    // ExifVersion : 0220
    // DateTimeOriginal : 2013:09:01 22:52:51
    // DateTimeDigitized : 2013:09:01 22:52:51
    // ComponentsConfiguration : YCbCr
    // ShutterSpeedValue : 4.058893515764426
    // ApertureValue : 2.5260688216892597 [4845/1918]
    // BrightnessValue : -0.3126686601998395
    // MeteringMode : Pattern
    // Flash : Flash did not fire, compulsory flash mode
    // FocalLength : 4.28 [107/25]
    // SubjectArea : [4 values]
    // FlashpixVersion : 0100
    // ColorSpace : 1
    // PixelXDimension : 2448
    // PixelYDimension : 3264
    // SensingMethod : One-chip color area sensor
    // ExposureMode : 0
    // WhiteBalance : Auto white balance
    // FocalLengthIn35mmFilm : 35
    // SceneCaptureType : Standard
    define('runtime/html5/imagemeta/exif',[
        'base',
        'runtime/html5/imagemeta'
    ], function( Base, ImageMeta ) {
    
        var EXIF = {};
    
        EXIF.ExifMap = function() {
            return this;
        };
    
        EXIF.ExifMap.prototype.map = {
            'Orientation': 0x0112
        };
    
        EXIF.ExifMap.prototype.get = function( id ) {
            return this[ id ] || this[ this.map[ id ] ];
        };
    
        EXIF.exifTagTypes = {
            // byte, 8-bit unsigned int:
            1: {
                getValue: function( dataView, dataOffset ) {
                    return dataView.getUint8( dataOffset );
                },
                size: 1
            },
    
            // ascii, 8-bit byte:
            2: {
                getValue: function( dataView, dataOffset ) {
                    return String.fromCharCode( dataView.getUint8( dataOffset ) );
                },
                size: 1,
                ascii: true
            },
    
            // short, 16 bit int:
            3: {
                getValue: function( dataView, dataOffset, littleEndian ) {
                    return dataView.getUint16( dataOffset, littleEndian );
                },
                size: 2
            },
    
            // long, 32 bit int:
            4: {
                getValue: function( dataView, dataOffset, littleEndian ) {
                    return dataView.getUint32( dataOffset, littleEndian );
                },
                size: 4
            },
    
            // rational = two long values,
            // first is numerator, second is denominator:
            5: {
                getValue: function( dataView, dataOffset, littleEndian ) {
                    return dataView.getUint32( dataOffset, littleEndian ) /
                        dataView.getUint32( dataOffset + 4, littleEndian );
                },
                size: 8
            },
    
            // slong, 32 bit signed int:
            9: {
                getValue: function( dataView, dataOffset, littleEndian ) {
                    return dataView.getInt32( dataOffset, littleEndian );
                },
                size: 4
            },
    
            // srational, two slongs, first is numerator, second is denominator:
            10: {
                getValue: function( dataView, dataOffset, littleEndian ) {
                    return dataView.getInt32( dataOffset, littleEndian ) /
                        dataView.getInt32( dataOffset + 4, littleEndian );
                },
                size: 8
            }
        };
    
        // undefined, 8-bit byte, value depending on field:
        EXIF.exifTagTypes[ 7 ] = EXIF.exifTagTypes[ 1 ];
    
        EXIF.getExifValue = function( dataView, tiffOffset, offset, type, length,
                littleEndian ) {
    
            var tagType = EXIF.exifTagTypes[ type ],
                tagSize, dataOffset, values, i, str, c;
    
            if ( !tagType ) {
                Base.log('Invalid Exif data: Invalid tag type.');
                return;
            }
    
            tagSize = tagType.size * length;
    
            // Determine if the value is contained in the dataOffset bytes,
            // or if the value at the dataOffset is a pointer to the actual data:
            dataOffset = tagSize > 4 ? tiffOffset + dataView.getUint32( offset + 8,
                    littleEndian ) : (offset + 8);
    
            if ( dataOffset + tagSize > dataView.byteLength ) {
                Base.log('Invalid Exif data: Invalid data offset.');
                return;
            }
    
            if ( length === 1 ) {
                return tagType.getValue( dataView, dataOffset, littleEndian );
            }
    
            values = [];
    
            for ( i = 0; i < length; i += 1 ) {
                values[ i ] = tagType.getValue( dataView,
                        dataOffset + i * tagType.size, littleEndian );
            }
    
            if ( tagType.ascii ) {
                str = '';
    
                // Concatenate the chars:
                for ( i = 0; i < values.length; i += 1 ) {
                    c = values[ i ];
    
                    // Ignore the terminating NULL byte(s):
                    if ( c === '\u0000' ) {
                        break;
                    }
                    str += c;
                }
    
                return str;
            }
            return values;
        };
    
        EXIF.parseExifTag = function( dataView, tiffOffset, offset, littleEndian,
                data ) {
    
            var tag = dataView.getUint16( offset, littleEndian );
            data.exif[ tag ] = EXIF.getExifValue( dataView, tiffOffset, offset,
                    dataView.getUint16( offset + 2, littleEndian ),    // tag type
                    dataView.getUint32( offset + 4, littleEndian ),    // tag length
                    littleEndian );
        };
    
        EXIF.parseExifTags = function( dataView, tiffOffset, dirOffset,
                littleEndian, data ) {
    
            var tagsNumber, dirEndOffset, i;
    
            if ( dirOffset + 6 > dataView.byteLength ) {
                Base.log('Invalid Exif data: Invalid directory offset.');
                return;
            }
    
            tagsNumber = dataView.getUint16( dirOffset, littleEndian );
            dirEndOffset = dirOffset + 2 + 12 * tagsNumber;
    
            if ( dirEndOffset + 4 > dataView.byteLength ) {
                Base.log('Invalid Exif data: Invalid directory size.');
                return;
            }
    
            for ( i = 0; i < tagsNumber; i += 1 ) {
                this.parseExifTag( dataView, tiffOffset,
                        dirOffset + 2 + 12 * i,    // tag offset
                        littleEndian, data );
            }
    
            // Return the offset to the next directory:
            return dataView.getUint32( dirEndOffset, littleEndian );
        };
    
        // EXIF.getExifThumbnail = function(dataView, offset, length) {
        //     var hexData,
        //         i,
        //         b;
        //     if (!length || offset + length > dataView.byteLength) {
        //         Base.log('Invalid Exif data: Invalid thumbnail data.');
        //         return;
        //     }
        //     hexData = [];
        //     for (i = 0; i < length; i += 1) {
        //         b = dataView.getUint8(offset + i);
        //         hexData.push((b < 16 ? '0' : '') + b.toString(16));
        //     }
        //     return 'data:image/jpeg,%' + hexData.join('%');
        // };
    
        EXIF.parseExifData = function( dataView, offset, length, data ) {
    
            var tiffOffset = offset + 10,
                littleEndian, dirOffset;
    
            // Check for the ASCII code for "Exif" (0x45786966):
            if ( dataView.getUint32( offset + 4 ) !== 0x45786966 ) {
                // No Exif data, might be XMP data instead
                return;
            }
            if ( tiffOffset + 8 > dataView.byteLength ) {
                Base.log('Invalid Exif data: Invalid segment size.');
                return;
            }
    
            // Check for the two null bytes:
            if ( dataView.getUint16( offset + 8 ) !== 0x0000 ) {
                Base.log('Invalid Exif data: Missing byte alignment offset.');
                return;
            }
    
            // Check the byte alignment:
            switch ( dataView.getUint16( tiffOffset ) ) {
                case 0x4949:
                    littleEndian = true;
                    break;
    
                case 0x4D4D:
                    littleEndian = false;
                    break;
    
                default:
                    Base.log('Invalid Exif data: Invalid byte alignment marker.');
                    return;
            }
    
            // Check for the TIFF tag marker (0x002A):
            if ( dataView.getUint16( tiffOffset + 2, littleEndian ) !== 0x002A ) {
                Base.log('Invalid Exif data: Missing TIFF marker.');
                return;
            }
    
            // Retrieve the directory offset bytes, usually 0x00000008 or 8 decimal:
            dirOffset = dataView.getUint32( tiffOffset + 4, littleEndian );
            // Create the exif object to store the tags:
            data.exif = new EXIF.ExifMap();
            // Parse the tags of the main image directory and retrieve the
            // offset to the next directory, usually the thumbnail directory:
            dirOffset = EXIF.parseExifTags( dataView, tiffOffset,
                    tiffOffset + dirOffset, littleEndian, data );
    
            // 尝试读取缩略图
            // if ( dirOffset ) {
            //     thumbnailData = {exif: {}};
            //     dirOffset = EXIF.parseExifTags(
            //         dataView,
            //         tiffOffset,
            //         tiffOffset + dirOffset,
            //         littleEndian,
            //         thumbnailData
            //     );
    
            //     // Check for JPEG Thumbnail offset:
            //     if (thumbnailData.exif[0x0201]) {
            //         data.exif.Thumbnail = EXIF.getExifThumbnail(
            //             dataView,
            //             tiffOffset + thumbnailData.exif[0x0201],
            //             thumbnailData.exif[0x0202] // Thumbnail data length
            //         );
            //     }
            // }
        };
    
        ImageMeta.parsers[ 0xffe1 ].push( EXIF.parseExifData );
        return EXIF;
    });
    /**
     * @fileOverview Image
     */
    define('runtime/html5/image',[
        'base',
        'runtime/html5/runtime',
        'runtime/html5/util'
    ], function( Base, Html5Runtime, Util ) {
    
        var BLANK = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D';
    
        return Html5Runtime.register( 'Image', {
    
            // flag: 标记是否被修改过。
            modified: false,
    
            init: function() {
                var me = this,
                    img = new Image();
    
                img.onload = function() {
    
                    me._info = {
                        type: me.type,
                        width: this.width,
                        height: this.height
                    };
    
                    // 读取meta信息。
                    if ( !me._metas && 'image/jpeg' === me.type ) {
                        Util.parseMeta( me._blob, function( error, ret ) {
                            me._metas = ret;
                            me.owner.trigger('load');
                        });
                    } else {
                        me.owner.trigger('load');
                    }
                };
    
                img.onerror = function() {
                    me.owner.trigger('error');
                };
    
                me._img = img;
            },
    
            loadFromBlob: function( blob ) {
                var me = this,
                    img = me._img;
    
                me._blob = blob;
                me.type = blob.type;
                img.src = Util.createObjectURL( blob.getSource() );
                me.owner.once( 'load', function() {
                    Util.revokeObjectURL( img.src );
                });
            },
    
            resize: function( width, height ) {
                var canvas = this._canvas ||
                        (this._canvas = document.createElement('canvas'));
    
                this._resize( this._img, canvas, width, height );
                this._blob = null;    // 没用了，可以删掉了。
                this.modified = true;
                this.owner.trigger('complete');
            },
    
            getAsBlob: function( type ) {
                var blob = this._blob,
                    opts = this.options,
                    canvas;
    
                type = type || this.type;
    
                // blob需要重新生成。
                if ( this.modified || this.type !== type ) {
                    canvas = this._canvas;
    
                    if ( type === 'image/jpeg' ) {
    
                        blob = Util.canvasToDataUrl( canvas, 'image/jpeg',
                                opts.quality );
    
                        if ( opts.preserveHeaders && this._metas &&
                                this._metas.imageHead ) {
    
                            blob = Util.dataURL2ArrayBuffer( blob );
                            blob = Util.updateImageHead( blob,
                                    this._metas.imageHead );
                            blob = Util.arrayBufferToBlob( blob, type );
                            return blob;
                        }
                    } else {
                        blob = Util.canvasToDataUrl( canvas, type );
                    }
    
                    blob = Util.dataURL2Blob( blob );
                }
    
                return blob;
            },
    
            getAsDataUrl: function( type ) {
                var opts = this.options;
    
                type = type || this.type;
    
                if ( type === 'image/jpeg' ) {
                    return Util.canvasToDataUrl( this._canvas, type, opts.quality );
                } else {
                    return this._canvas.toDataURL( type );
                }
            },
    
            getOrientation: function() {
                return this._metas && this._metas.exif &&
                        this._metas.exif.get('Orientation') || 1;
            },
    
            info: function( val ) {
    
                // setter
                if ( val ) {
                    this._info = val;
                    return this;
                }
    
                // getter
                return this._info;
            },
    
            meta: function( val ) {
    
                // setter
                if ( val ) {
                    this._meta = val;
                    return this;
                }
    
                // getter
                return this._meta;
            },
    
            destroy: function() {
                var canvas = this._canvas;
                this._img.onload = null;
    
                if ( canvas ) {
                    canvas.getContext('2d')
                            .clearRect( 0, 0, canvas.width, canvas.height );
                    canvas.width = canvas.height = 0;
                    this._canvas = null;
                }
    
                // 释放内存。非常重要，否则释放不了image的内存。
                this._img.src = BLANK;
                this._img = this._blob = null;
            },
    
            _resize: function( img, cvs, width, height ) {
                var opts = this.options,
                    naturalWidth = img.width,
                    naturalHeight = img.height,
                    orientation = this.getOrientation(),
                    scale, w, h, x, y;
    
                // values that require 90 degree rotation
                if ( ~[ 5, 6, 7, 8 ].indexOf( orientation ) ) {
    
                    // 交换width, height的值。
                    width ^= height;
                    height ^= width;
                    width ^= height;
                }
    
                scale = Math[ opts.crop ? 'max' : 'min' ]( width / naturalWidth,
                        height / naturalHeight );
    
                // 不允许放大。
                opts.allowMagnify || (scale = Math.min( 1, scale ));
    
                w = naturalWidth * scale;
                h = naturalHeight * scale;
    
                if ( opts.crop ) {
                    cvs.width = width;
                    cvs.height = height;
                } else {
                    cvs.width = w;
                    cvs.height = h;
                }
    
                x = (cvs.width - w) / 2;
                y = (cvs.height - h) / 2;
    
                opts.preserveHeaders || this._rotate2Orientaion( cvs, orientation );
    
                this._renderImageToCanvas( cvs, img, x, y, w, h );
            },
    
            _rotate2Orientaion: function( canvas, orientation ) {
                var width = canvas.width,
                    height = canvas.height,
                    ctx = canvas.getContext('2d');
    
                switch ( orientation ) {
                    case 5:
                    case 6:
                    case 7:
                    case 8:
                        canvas.width = height;
                        canvas.height = width;
                        break;
                }
    
                switch ( orientation ) {
                    case 2:    // horizontal flip
                        ctx.translate( width, 0 );
                        ctx.scale( -1, 1 );
                        break;
    
                    case 3:    // 180 rotate left
                        ctx.translate( width, height );
                        ctx.rotate( Math.PI );
                        break;
    
                    case 4:    // vertical flip
                        ctx.translate( 0, height );
                        ctx.scale( 1, -1 );
                        break;
    
                    case 5:    // vertical flip + 90 rotate right
                        ctx.rotate( 0.5 * Math.PI );
                        ctx.scale( 1, -1 );
                        break;
    
                    case 6:    // 90 rotate right
                        ctx.rotate( 0.5 * Math.PI );
                        ctx.translate( 0, -height );
                        break;
    
                    case 7:    // horizontal flip + 90 rotate right
                        ctx.rotate( 0.5 * Math.PI );
                        ctx.translate( width, -height );
                        ctx.scale( -1, 1 );
                        break;
    
                    case 8:    // 90 rotate left
                        ctx.rotate( -0.5 * Math.PI );
                        ctx.translate( -width, 0 );
                        break;
                }
            },
    
            // https://github.com/stomita/ios-imagefile-megapixel/
            // blob/master/src/megapix-image.js
            _renderImageToCanvas: (function() {
    
                // 如果不是ios, 不需要这么复杂！
                if ( !Base.os.ios ) {
                    return function( canvas, img, x, y, w, h ) {
                        canvas.getContext('2d').drawImage( img, x, y, w, h );
                    };
                }
    
                /**
                 * Detecting vertical squash in loaded image.
                 * Fixes a bug which squash image vertically while drawing into
                 * canvas for some images.
                 */
                function detectVerticalSquash( img, iw, ih ) {
                    var canvas = document.createElement('canvas'),
                        ctx = canvas.getContext('2d'),
                        sy = 0,
                        ey = ih,
                        py = ih,
                        data, alpha, ratio;
    
    
                    canvas.width = 1;
                    canvas.height = ih;
                    ctx.drawImage( img, 0, 0 );
                    data = ctx.getImageData( 0, 0, 1, ih ).data;
    
                    // search image edge pixel position in case
                    // it is squashed vertically.
                    while ( py > sy ) {
                        alpha = data[ (py - 1) * 4 + 3 ];
    
                        if ( alpha === 0 ) {
                            ey = py;
                        } else {
                            sy = py;
                        }
    
                        py = (ey + sy) >> 1;
                    }
    
                    ratio = (py / ih);
                    return (ratio === 0) ? 1 : ratio;
                }
    
                // fix ie7 bug
                // http://stackoverflow.com/questions/11929099/
                // html5-canvas-drawimage-ratio-bug-ios
                if ( Base.os.ios >= 7 ) {
                    return function( canvas, img, x, y, w, h ) {
                        var iw = img.naturalWidth,
                            ih = img.naturalHeight,
                            vertSquashRatio = detectVerticalSquash( img, iw, ih );
    
                        return canvas.getContext('2d').drawImage( img, 0, 0,
                            iw * vertSquashRatio, ih * vertSquashRatio,
                            x, y, w, h );
                    };
                }
    
                /**
                 * Detect subsampling in loaded image.
                 * In iOS, larger images than 2M pixels may be
                 * subsampled in rendering.
                 */
                function detectSubsampling( img ) {
                    var iw = img.naturalWidth,
                        ih = img.naturalHeight,
                        canvas, ctx;
    
                    // subsampling may happen overmegapixel image
                    if ( iw * ih > 1024 * 1024 ) {
                        canvas = document.createElement('canvas');
                        canvas.width = canvas.height = 1;
                        ctx = canvas.getContext('2d');
                        ctx.drawImage( img, -iw + 1, 0 );
    
                        // subsampled image becomes half smaller in rendering size.
                        // check alpha channel value to confirm image is covering
                        // edge pixel or not. if alpha value is 0
                        // image is not covering, hence subsampled.
                        return ctx.getImageData( 0, 0, 1, 1 ).data[ 3 ] === 0;
                    } else {
                        return false;
                    }
                }
    
    
                return function( canvas, img, x, y, width, height ) {
                    var iw = img.naturalWidth,
                        ih = img.naturalHeight,
                        ctx = canvas.getContext('2d'),
                        subsampled = detectSubsampling( img ),
                        doSquash = this.type === 'image/jpeg',
                        d = 1024,
                        sy = 0,
                        dy = 0,
                        tmpCanvas, tmpCtx, vertSquashRatio, dw, dh, sx, dx;
    
                    if ( subsampled ) {
                        iw /= 2;
                        ih /= 2;
                    }
    
                    ctx.save();
                    tmpCanvas = document.createElement('canvas');
                    tmpCanvas.width = tmpCanvas.height = d;
    
                    tmpCtx = tmpCanvas.getContext('2d');
                    vertSquashRatio = doSquash ?
                            detectVerticalSquash( img, iw, ih ) : 1;
    
                    dw = Math.ceil( d * width / iw );
                    dh = Math.ceil( d * height / ih / vertSquashRatio );
    
                    while ( sy < ih ) {
                        sx = 0;
                        dx = 0;
                        while ( sx < iw ) {
                            tmpCtx.clearRect( 0, 0, d, d );
                            tmpCtx.drawImage( img, -sx, -sy );
                            ctx.drawImage( tmpCanvas, 0, 0, d, d,
                                    x + dx, y + dy, dw, dh );
                            sx += d;
                            dx += dw;
                        }
                        sy += d;
                        dy += dh;
                    }
                    ctx.restore();
                    tmpCanvas = tmpCtx = null;
                };
            })()
        });
    });
    /**
     * 这个方式性能不行，但是可以解决android里面的toDataUrl的bug
     * android里面toDataUrl('image/jpege')得到的结果却是png.
     *
     * 所以这里没辙，只能借助这个工具
     * @fileOverview jpeg encoder
     */
    define('runtime/html5/jpegencoder',[], function( require, exports, module ) {
    
        /*
          Copyright (c) 2008, Adobe Systems Incorporated
          All rights reserved.
    
          Redistribution and use in source and binary forms, with or without
          modification, are permitted provided that the following conditions are
          met:
    
          * Redistributions of source code must retain the above copyright notice,
            this list of conditions and the following disclaimer.
    
          * Redistributions in binary form must reproduce the above copyright
            notice, this list of conditions and the following disclaimer in the
            documentation and/or other materials provided with the distribution.
    
          * Neither the name of Adobe Systems Incorporated nor the names of its
            contributors may be used to endorse or promote products derived from
            this software without specific prior written permission.
    
          THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
          IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
          THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
          PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR
          CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
          EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
          PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
          PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
          LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
          NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
          SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
        */
        /*
        JPEG encoder ported to JavaScript and optimized by Andreas Ritter, www.bytestrom.eu, 11/2009
    
        Basic GUI blocking jpeg encoder
        */
    
        function JPEGEncoder(quality) {
          var self = this;
            var fround = Math.round;
            var ffloor = Math.floor;
            var YTable = new Array(64);
            var UVTable = new Array(64);
            var fdtbl_Y = new Array(64);
            var fdtbl_UV = new Array(64);
            var YDC_HT;
            var UVDC_HT;
            var YAC_HT;
            var UVAC_HT;
    
            var bitcode = new Array(65535);
            var category = new Array(65535);
            var outputfDCTQuant = new Array(64);
            var DU = new Array(64);
            var byteout = [];
            var bytenew = 0;
            var bytepos = 7;
    
            var YDU = new Array(64);
            var UDU = new Array(64);
            var VDU = new Array(64);
            var clt = new Array(256);
            var RGB_YUV_TABLE = new Array(2048);
            var currentQuality;
    
            var ZigZag = [
                     0, 1, 5, 6,14,15,27,28,
                     2, 4, 7,13,16,26,29,42,
                     3, 8,12,17,25,30,41,43,
                     9,11,18,24,31,40,44,53,
                    10,19,23,32,39,45,52,54,
                    20,22,33,38,46,51,55,60,
                    21,34,37,47,50,56,59,61,
                    35,36,48,49,57,58,62,63
                ];
    
            var std_dc_luminance_nrcodes = [0,0,1,5,1,1,1,1,1,1,0,0,0,0,0,0,0];
            var std_dc_luminance_values = [0,1,2,3,4,5,6,7,8,9,10,11];
            var std_ac_luminance_nrcodes = [0,0,2,1,3,3,2,4,3,5,5,4,4,0,0,1,0x7d];
            var std_ac_luminance_values = [
                    0x01,0x02,0x03,0x00,0x04,0x11,0x05,0x12,
                    0x21,0x31,0x41,0x06,0x13,0x51,0x61,0x07,
                    0x22,0x71,0x14,0x32,0x81,0x91,0xa1,0x08,
                    0x23,0x42,0xb1,0xc1,0x15,0x52,0xd1,0xf0,
                    0x24,0x33,0x62,0x72,0x82,0x09,0x0a,0x16,
                    0x17,0x18,0x19,0x1a,0x25,0x26,0x27,0x28,
                    0x29,0x2a,0x34,0x35,0x36,0x37,0x38,0x39,
                    0x3a,0x43,0x44,0x45,0x46,0x47,0x48,0x49,
                    0x4a,0x53,0x54,0x55,0x56,0x57,0x58,0x59,
                    0x5a,0x63,0x64,0x65,0x66,0x67,0x68,0x69,
                    0x6a,0x73,0x74,0x75,0x76,0x77,0x78,0x79,
                    0x7a,0x83,0x84,0x85,0x86,0x87,0x88,0x89,
                    0x8a,0x92,0x93,0x94,0x95,0x96,0x97,0x98,
                    0x99,0x9a,0xa2,0xa3,0xa4,0xa5,0xa6,0xa7,
                    0xa8,0xa9,0xaa,0xb2,0xb3,0xb4,0xb5,0xb6,
                    0xb7,0xb8,0xb9,0xba,0xc2,0xc3,0xc4,0xc5,
                    0xc6,0xc7,0xc8,0xc9,0xca,0xd2,0xd3,0xd4,
                    0xd5,0xd6,0xd7,0xd8,0xd9,0xda,0xe1,0xe2,
                    0xe3,0xe4,0xe5,0xe6,0xe7,0xe8,0xe9,0xea,
                    0xf1,0xf2,0xf3,0xf4,0xf5,0xf6,0xf7,0xf8,
                    0xf9,0xfa
                ];
    
            var std_dc_chrominance_nrcodes = [0,0,3,1,1,1,1,1,1,1,1,1,0,0,0,0,0];
            var std_dc_chrominance_values = [0,1,2,3,4,5,6,7,8,9,10,11];
            var std_ac_chrominance_nrcodes = [0,0,2,1,2,4,4,3,4,7,5,4,4,0,1,2,0x77];
            var std_ac_chrominance_values = [
                    0x00,0x01,0x02,0x03,0x11,0x04,0x05,0x21,
                    0x31,0x06,0x12,0x41,0x51,0x07,0x61,0x71,
                    0x13,0x22,0x32,0x81,0x08,0x14,0x42,0x91,
                    0xa1,0xb1,0xc1,0x09,0x23,0x33,0x52,0xf0,
                    0x15,0x62,0x72,0xd1,0x0a,0x16,0x24,0x34,
                    0xe1,0x25,0xf1,0x17,0x18,0x19,0x1a,0x26,
                    0x27,0x28,0x29,0x2a,0x35,0x36,0x37,0x38,
                    0x39,0x3a,0x43,0x44,0x45,0x46,0x47,0x48,
                    0x49,0x4a,0x53,0x54,0x55,0x56,0x57,0x58,
                    0x59,0x5a,0x63,0x64,0x65,0x66,0x67,0x68,
                    0x69,0x6a,0x73,0x74,0x75,0x76,0x77,0x78,
                    0x79,0x7a,0x82,0x83,0x84,0x85,0x86,0x87,
                    0x88,0x89,0x8a,0x92,0x93,0x94,0x95,0x96,
                    0x97,0x98,0x99,0x9a,0xa2,0xa3,0xa4,0xa5,
                    0xa6,0xa7,0xa8,0xa9,0xaa,0xb2,0xb3,0xb4,
                    0xb5,0xb6,0xb7,0xb8,0xb9,0xba,0xc2,0xc3,
                    0xc4,0xc5,0xc6,0xc7,0xc8,0xc9,0xca,0xd2,
                    0xd3,0xd4,0xd5,0xd6,0xd7,0xd8,0xd9,0xda,
                    0xe2,0xe3,0xe4,0xe5,0xe6,0xe7,0xe8,0xe9,
                    0xea,0xf2,0xf3,0xf4,0xf5,0xf6,0xf7,0xf8,
                    0xf9,0xfa
                ];
    
            function initQuantTables(sf){
                    var YQT = [
                        16, 11, 10, 16, 24, 40, 51, 61,
                        12, 12, 14, 19, 26, 58, 60, 55,
                        14, 13, 16, 24, 40, 57, 69, 56,
                        14, 17, 22, 29, 51, 87, 80, 62,
                        18, 22, 37, 56, 68,109,103, 77,
                        24, 35, 55, 64, 81,104,113, 92,
                        49, 64, 78, 87,103,121,120,101,
                        72, 92, 95, 98,112,100,103, 99
                    ];
    
                    for (var i = 0; i < 64; i++) {
                        var t = ffloor((YQT[i]*sf+50)/100);
                        if (t < 1) {
                            t = 1;
                        } else if (t > 255) {
                            t = 255;
                        }
                        YTable[ZigZag[i]] = t;
                    }
                    var UVQT = [
                        17, 18, 24, 47, 99, 99, 99, 99,
                        18, 21, 26, 66, 99, 99, 99, 99,
                        24, 26, 56, 99, 99, 99, 99, 99,
                        47, 66, 99, 99, 99, 99, 99, 99,
                        99, 99, 99, 99, 99, 99, 99, 99,
                        99, 99, 99, 99, 99, 99, 99, 99,
                        99, 99, 99, 99, 99, 99, 99, 99,
                        99, 99, 99, 99, 99, 99, 99, 99
                    ];
                    for (var j = 0; j < 64; j++) {
                        var u = ffloor((UVQT[j]*sf+50)/100);
                        if (u < 1) {
                            u = 1;
                        } else if (u > 255) {
                            u = 255;
                        }
                        UVTable[ZigZag[j]] = u;
                    }
                    var aasf = [
                        1.0, 1.387039845, 1.306562965, 1.175875602,
                        1.0, 0.785694958, 0.541196100, 0.275899379
                    ];
                    var k = 0;
                    for (var row = 0; row < 8; row++)
                    {
                        for (var col = 0; col < 8; col++)
                        {
                            fdtbl_Y[k]  = (1.0 / (YTable [ZigZag[k]] * aasf[row] * aasf[col] * 8.0));
                            fdtbl_UV[k] = (1.0 / (UVTable[ZigZag[k]] * aasf[row] * aasf[col] * 8.0));
                            k++;
                        }
                    }
                }
    
                function computeHuffmanTbl(nrcodes, std_table){
                    var codevalue = 0;
                    var pos_in_table = 0;
                    var HT = new Array();
                    for (var k = 1; k <= 16; k++) {
                        for (var j = 1; j <= nrcodes[k]; j++) {
                            HT[std_table[pos_in_table]] = [];
                            HT[std_table[pos_in_table]][0] = codevalue;
                            HT[std_table[pos_in_table]][1] = k;
                            pos_in_table++;
                            codevalue++;
                        }
                        codevalue*=2;
                    }
                    return HT;
                }
    
                function initHuffmanTbl()
                {
                    YDC_HT = computeHuffmanTbl(std_dc_luminance_nrcodes,std_dc_luminance_values);
                    UVDC_HT = computeHuffmanTbl(std_dc_chrominance_nrcodes,std_dc_chrominance_values);
                    YAC_HT = computeHuffmanTbl(std_ac_luminance_nrcodes,std_ac_luminance_values);
                    UVAC_HT = computeHuffmanTbl(std_ac_chrominance_nrcodes,std_ac_chrominance_values);
                }
    
                function initCategoryNumber()
                {
                    var nrlower = 1;
                    var nrupper = 2;
                    for (var cat = 1; cat <= 15; cat++) {
                        //Positive numbers
                        for (var nr = nrlower; nr<nrupper; nr++) {
                            category[32767+nr] = cat;
                            bitcode[32767+nr] = [];
                            bitcode[32767+nr][1] = cat;
                            bitcode[32767+nr][0] = nr;
                        }
                        //Negative numbers
                        for (var nrneg =-(nrupper-1); nrneg<=-nrlower; nrneg++) {
                            category[32767+nrneg] = cat;
                            bitcode[32767+nrneg] = [];
                            bitcode[32767+nrneg][1] = cat;
                            bitcode[32767+nrneg][0] = nrupper-1+nrneg;
                        }
                        nrlower <<= 1;
                        nrupper <<= 1;
                    }
                }
    
                function initRGBYUVTable() {
                    for(var i = 0; i < 256;i++) {
                        RGB_YUV_TABLE[i]            =  19595 * i;
                        RGB_YUV_TABLE[(i+ 256)>>0]  =  38470 * i;
                        RGB_YUV_TABLE[(i+ 512)>>0]  =   7471 * i + 0x8000;
                        RGB_YUV_TABLE[(i+ 768)>>0]  = -11059 * i;
                        RGB_YUV_TABLE[(i+1024)>>0]  = -21709 * i;
                        RGB_YUV_TABLE[(i+1280)>>0]  =  32768 * i + 0x807FFF;
                        RGB_YUV_TABLE[(i+1536)>>0]  = -27439 * i;
                        RGB_YUV_TABLE[(i+1792)>>0]  = - 5329 * i;
                    }
                }
    
                // IO functions
                function writeBits(bs)
                {
                    var value = bs[0];
                    var posval = bs[1]-1;
                    while ( posval >= 0 ) {
                        if (value & (1 << posval) ) {
                            bytenew |= (1 << bytepos);
                        }
                        posval--;
                        bytepos--;
                        if (bytepos < 0) {
                            if (bytenew == 0xFF) {
                                writeByte(0xFF);
                                writeByte(0);
                            }
                            else {
                                writeByte(bytenew);
                            }
                            bytepos=7;
                            bytenew=0;
                        }
                    }
                }
    
                function writeByte(value)
                {
                    byteout.push(clt[value]); // write char directly instead of converting later
                }
    
                function writeWord(value)
                {
                    writeByte((value>>8)&0xFF);
                    writeByte((value   )&0xFF);
                }
    
                // DCT & quantization core
                function fDCTQuant(data, fdtbl)
                {
                    var d0, d1, d2, d3, d4, d5, d6, d7;
                    /* Pass 1: process rows. */
                    var dataOff=0;
                    var i;
                    var I8 = 8;
                    var I64 = 64;
                    for (i=0; i<I8; ++i)
                    {
                        d0 = data[dataOff];
                        d1 = data[dataOff+1];
                        d2 = data[dataOff+2];
                        d3 = data[dataOff+3];
                        d4 = data[dataOff+4];
                        d5 = data[dataOff+5];
                        d6 = data[dataOff+6];
                        d7 = data[dataOff+7];
    
                        var tmp0 = d0 + d7;
                        var tmp7 = d0 - d7;
                        var tmp1 = d1 + d6;
                        var tmp6 = d1 - d6;
                        var tmp2 = d2 + d5;
                        var tmp5 = d2 - d5;
                        var tmp3 = d3 + d4;
                        var tmp4 = d3 - d4;
    
                        /* Even part */
                        var tmp10 = tmp0 + tmp3;    /* phase 2 */
                        var tmp13 = tmp0 - tmp3;
                        var tmp11 = tmp1 + tmp2;
                        var tmp12 = tmp1 - tmp2;
    
                        data[dataOff] = tmp10 + tmp11; /* phase 3 */
                        data[dataOff+4] = tmp10 - tmp11;
    
                        var z1 = (tmp12 + tmp13) * 0.707106781; /* c4 */
                        data[dataOff+2] = tmp13 + z1; /* phase 5 */
                        data[dataOff+6] = tmp13 - z1;
    
                        /* Odd part */
                        tmp10 = tmp4 + tmp5; /* phase 2 */
                        tmp11 = tmp5 + tmp6;
                        tmp12 = tmp6 + tmp7;
    
                        /* The rotator is modified from fig 4-8 to avoid extra negations. */
                        var z5 = (tmp10 - tmp12) * 0.382683433; /* c6 */
                        var z2 = 0.541196100 * tmp10 + z5; /* c2-c6 */
                        var z4 = 1.306562965 * tmp12 + z5; /* c2+c6 */
                        var z3 = tmp11 * 0.707106781; /* c4 */
    
                        var z11 = tmp7 + z3;    /* phase 5 */
                        var z13 = tmp7 - z3;
    
                        data[dataOff+5] = z13 + z2; /* phase 6 */
                        data[dataOff+3] = z13 - z2;
                        data[dataOff+1] = z11 + z4;
                        data[dataOff+7] = z11 - z4;
    
                        dataOff += 8; /* advance pointer to next row */
                    }
    
                    /* Pass 2: process columns. */
                    dataOff = 0;
                    for (i=0; i<I8; ++i)
                    {
                        d0 = data[dataOff];
                        d1 = data[dataOff + 8];
                        d2 = data[dataOff + 16];
                        d3 = data[dataOff + 24];
                        d4 = data[dataOff + 32];
                        d5 = data[dataOff + 40];
                        d6 = data[dataOff + 48];
                        d7 = data[dataOff + 56];
    
                        var tmp0p2 = d0 + d7;
                        var tmp7p2 = d0 - d7;
                        var tmp1p2 = d1 + d6;
                        var tmp6p2 = d1 - d6;
                        var tmp2p2 = d2 + d5;
                        var tmp5p2 = d2 - d5;
                        var tmp3p2 = d3 + d4;
                        var tmp4p2 = d3 - d4;
    
                        /* Even part */
                        var tmp10p2 = tmp0p2 + tmp3p2;  /* phase 2 */
                        var tmp13p2 = tmp0p2 - tmp3p2;
                        var tmp11p2 = tmp1p2 + tmp2p2;
                        var tmp12p2 = tmp1p2 - tmp2p2;
    
                        data[dataOff] = tmp10p2 + tmp11p2; /* phase 3 */
                        data[dataOff+32] = tmp10p2 - tmp11p2;
    
                        var z1p2 = (tmp12p2 + tmp13p2) * 0.707106781; /* c4 */
                        data[dataOff+16] = tmp13p2 + z1p2; /* phase 5 */
                        data[dataOff+48] = tmp13p2 - z1p2;
    
                        /* Odd part */
                        tmp10p2 = tmp4p2 + tmp5p2; /* phase 2 */
                        tmp11p2 = tmp5p2 + tmp6p2;
                        tmp12p2 = tmp6p2 + tmp7p2;
    
                        /* The rotator is modified from fig 4-8 to avoid extra negations. */
                        var z5p2 = (tmp10p2 - tmp12p2) * 0.382683433; /* c6 */
                        var z2p2 = 0.541196100 * tmp10p2 + z5p2; /* c2-c6 */
                        var z4p2 = 1.306562965 * tmp12p2 + z5p2; /* c2+c6 */
                        var z3p2 = tmp11p2 * 0.707106781; /* c4 */
    
                        var z11p2 = tmp7p2 + z3p2;  /* phase 5 */
                        var z13p2 = tmp7p2 - z3p2;
    
                        data[dataOff+40] = z13p2 + z2p2; /* phase 6 */
                        data[dataOff+24] = z13p2 - z2p2;
                        data[dataOff+ 8] = z11p2 + z4p2;
                        data[dataOff+56] = z11p2 - z4p2;
    
                        dataOff++; /* advance pointer to next column */
                    }
    
                    // Quantize/descale the coefficients
                    var fDCTQuant;
                    for (i=0; i<I64; ++i)
                    {
                        // Apply the quantization and scaling factor & Round to nearest integer
                        fDCTQuant = data[i]*fdtbl[i];
                        outputfDCTQuant[i] = (fDCTQuant > 0.0) ? ((fDCTQuant + 0.5)|0) : ((fDCTQuant - 0.5)|0);
                        //outputfDCTQuant[i] = fround(fDCTQuant);
    
                    }
                    return outputfDCTQuant;
                }
    
                function writeAPP0()
                {
                    writeWord(0xFFE0); // marker
                    writeWord(16); // length
                    writeByte(0x4A); // J
                    writeByte(0x46); // F
                    writeByte(0x49); // I
                    writeByte(0x46); // F
                    writeByte(0); // = "JFIF",'\0'
                    writeByte(1); // versionhi
                    writeByte(1); // versionlo
                    writeByte(0); // xyunits
                    writeWord(1); // xdensity
                    writeWord(1); // ydensity
                    writeByte(0); // thumbnwidth
                    writeByte(0); // thumbnheight
                }
    
                function writeSOF0(width, height)
                {
                    writeWord(0xFFC0); // marker
                    writeWord(17);   // length, truecolor YUV JPG
                    writeByte(8);    // precision
                    writeWord(height);
                    writeWord(width);
                    writeByte(3);    // nrofcomponents
                    writeByte(1);    // IdY
                    writeByte(0x11); // HVY
                    writeByte(0);    // QTY
                    writeByte(2);    // IdU
                    writeByte(0x11); // HVU
                    writeByte(1);    // QTU
                    writeByte(3);    // IdV
                    writeByte(0x11); // HVV
                    writeByte(1);    // QTV
                }
    
                function writeDQT()
                {
                    writeWord(0xFFDB); // marker
                    writeWord(132);    // length
                    writeByte(0);
                    for (var i=0; i<64; i++) {
                        writeByte(YTable[i]);
                    }
                    writeByte(1);
                    for (var j=0; j<64; j++) {
                        writeByte(UVTable[j]);
                    }
                }
    
                function writeDHT()
                {
                    writeWord(0xFFC4); // marker
                    writeWord(0x01A2); // length
    
                    writeByte(0); // HTYDCinfo
                    for (var i=0; i<16; i++) {
                        writeByte(std_dc_luminance_nrcodes[i+1]);
                    }
                    for (var j=0; j<=11; j++) {
                        writeByte(std_dc_luminance_values[j]);
                    }
    
                    writeByte(0x10); // HTYACinfo
                    for (var k=0; k<16; k++) {
                        writeByte(std_ac_luminance_nrcodes[k+1]);
                    }
                    for (var l=0; l<=161; l++) {
                        writeByte(std_ac_luminance_values[l]);
                    }
    
                    writeByte(1); // HTUDCinfo
                    for (var m=0; m<16; m++) {
                        writeByte(std_dc_chrominance_nrcodes[m+1]);
                    }
                    for (var n=0; n<=11; n++) {
                        writeByte(std_dc_chrominance_values[n]);
                    }
    
                    writeByte(0x11); // HTUACinfo
                    for (var o=0; o<16; o++) {
                        writeByte(std_ac_chrominance_nrcodes[o+1]);
                    }
                    for (var p=0; p<=161; p++) {
                        writeByte(std_ac_chrominance_values[p]);
                    }
                }
    
                function writeSOS()
                {
                    writeWord(0xFFDA); // marker
                    writeWord(12); // length
                    writeByte(3); // nrofcomponents
                    writeByte(1); // IdY
                    writeByte(0); // HTY
                    writeByte(2); // IdU
                    writeByte(0x11); // HTU
                    writeByte(3); // IdV
                    writeByte(0x11); // HTV
                    writeByte(0); // Ss
                    writeByte(0x3f); // Se
                    writeByte(0); // Bf
                }
    
                function processDU(CDU, fdtbl, DC, HTDC, HTAC){
                    var EOB = HTAC[0x00];
                    var M16zeroes = HTAC[0xF0];
                    var pos;
                    var I16 = 16;
                    var I63 = 63;
                    var I64 = 64;
                    var DU_DCT = fDCTQuant(CDU, fdtbl);
                    //ZigZag reorder
                    for (var j=0;j<I64;++j) {
                        DU[ZigZag[j]]=DU_DCT[j];
                    }
                    var Diff = DU[0] - DC; DC = DU[0];
                    //Encode DC
                    if (Diff==0) {
                        writeBits(HTDC[0]); // Diff might be 0
                    } else {
                        pos = 32767+Diff;
                        writeBits(HTDC[category[pos]]);
                        writeBits(bitcode[pos]);
                    }
                    //Encode ACs
                    var end0pos = 63; // was const... which is crazy
                    for (; (end0pos>0)&&(DU[end0pos]==0); end0pos--) {};
                    //end0pos = first element in reverse order !=0
                    if ( end0pos == 0) {
                        writeBits(EOB);
                        return DC;
                    }
                    var i = 1;
                    var lng;
                    while ( i <= end0pos ) {
                        var startpos = i;
                        for (; (DU[i]==0) && (i<=end0pos); ++i) {}
                        var nrzeroes = i-startpos;
                        if ( nrzeroes >= I16 ) {
                            lng = nrzeroes>>4;
                            for (var nrmarker=1; nrmarker <= lng; ++nrmarker)
                                writeBits(M16zeroes);
                            nrzeroes = nrzeroes&0xF;
                        }
                        pos = 32767+DU[i];
                        writeBits(HTAC[(nrzeroes<<4)+category[pos]]);
                        writeBits(bitcode[pos]);
                        i++;
                    }
                    if ( end0pos != I63 ) {
                        writeBits(EOB);
                    }
                    return DC;
                }
    
                function initCharLookupTable(){
                    var sfcc = String.fromCharCode;
                    for(var i=0; i < 256; i++){ ///// ACHTUNG // 255
                        clt[i] = sfcc(i);
                    }
                }
    
                this.encode = function(image,quality) // image data object
                {
                    // var time_start = new Date().getTime();
    
                    if(quality) setQuality(quality);
    
                    // Initialize bit writer
                    byteout = new Array();
                    bytenew=0;
                    bytepos=7;
    
                    // Add JPEG headers
                    writeWord(0xFFD8); // SOI
                    writeAPP0();
                    writeDQT();
                    writeSOF0(image.width,image.height);
                    writeDHT();
                    writeSOS();
    
    
                    // Encode 8x8 macroblocks
                    var DCY=0;
                    var DCU=0;
                    var DCV=0;
    
                    bytenew=0;
                    bytepos=7;
    
    
                    this.encode.displayName = "_encode_";
    
                    var imageData = image.data;
                    var width = image.width;
                    var height = image.height;
    
                    var quadWidth = width*4;
                    var tripleWidth = width*3;
    
                    var x, y = 0;
                    var r, g, b;
                    var start,p, col,row,pos;
                    while(y < height){
                        x = 0;
                        while(x < quadWidth){
                        start = quadWidth * y + x;
                        p = start;
                        col = -1;
                        row = 0;
    
                        for(pos=0; pos < 64; pos++){
                            row = pos >> 3;// /8
                            col = ( pos & 7 ) * 4; // %8
                            p = start + ( row * quadWidth ) + col;
    
                            if(y+row >= height){ // padding bottom
                                p-= (quadWidth*(y+1+row-height));
                            }
    
                            if(x+col >= quadWidth){ // padding right
                                p-= ((x+col) - quadWidth +4)
                            }
    
                            r = imageData[ p++ ];
                            g = imageData[ p++ ];
                            b = imageData[ p++ ];
    
    
                            /* // calculate YUV values dynamically
                            YDU[pos]=((( 0.29900)*r+( 0.58700)*g+( 0.11400)*b))-128; //-0x80
                            UDU[pos]=(((-0.16874)*r+(-0.33126)*g+( 0.50000)*b));
                            VDU[pos]=((( 0.50000)*r+(-0.41869)*g+(-0.08131)*b));
                            */
    
                            // use lookup table (slightly faster)
                            YDU[pos] = ((RGB_YUV_TABLE[r]             + RGB_YUV_TABLE[(g +  256)>>0] + RGB_YUV_TABLE[(b +  512)>>0]) >> 16)-128;
                            UDU[pos] = ((RGB_YUV_TABLE[(r +  768)>>0] + RGB_YUV_TABLE[(g + 1024)>>0] + RGB_YUV_TABLE[(b + 1280)>>0]) >> 16)-128;
                            VDU[pos] = ((RGB_YUV_TABLE[(r + 1280)>>0] + RGB_YUV_TABLE[(g + 1536)>>0] + RGB_YUV_TABLE[(b + 1792)>>0]) >> 16)-128;
    
                        }
    
                        DCY = processDU(YDU, fdtbl_Y, DCY, YDC_HT, YAC_HT);
                        DCU = processDU(UDU, fdtbl_UV, DCU, UVDC_HT, UVAC_HT);
                        DCV = processDU(VDU, fdtbl_UV, DCV, UVDC_HT, UVAC_HT);
                        x+=32;
                        }
                        y+=8;
                    }
    
    
                    ////////////////////////////////////////////////////////////////
    
                    // Do the bit alignment of the EOI marker
                    if ( bytepos >= 0 ) {
                        var fillbits = [];
                        fillbits[1] = bytepos+1;
                        fillbits[0] = (1<<(bytepos+1))-1;
                        writeBits(fillbits);
                    }
    
                    writeWord(0xFFD9); //EOI
    
                    var jpegDataUri = 'data:image/jpeg;base64,' + btoa(byteout.join(''));
    
                    byteout = [];
    
                    // benchmarking
                    // var duration = new Date().getTime() - time_start;
                    // console.log('Encoding time: '+ currentQuality + 'ms');
                    //
    
                    return jpegDataUri
            }
    
            function setQuality(quality){
                if (quality <= 0) {
                    quality = 1;
                }
                if (quality > 100) {
                    quality = 100;
                }
    
                if(currentQuality == quality) return // don't recalc if unchanged
    
                var sf = 0;
                if (quality < 50) {
                    sf = Math.floor(5000 / quality);
                } else {
                    sf = Math.floor(200 - quality*2);
                }
    
                initQuantTables(sf);
                currentQuality = quality;
                // console.log('Quality set to: '+quality +'%');
            }
    
            function init(){
                // var time_start = new Date().getTime();
                if(!quality) quality = 50;
                // Create tables
                initCharLookupTable()
                initHuffmanTbl();
                initCategoryNumber();
                initRGBYUVTable();
    
                setQuality(quality);
                // var duration = new Date().getTime() - time_start;
                // console.log('Initialization '+ duration + 'ms');
            }
    
            init();
    
        };
    
        JPEGEncoder.encode = function( data, quality ) {
            var encoder = new JPEGEncoder( quality );
    
            return encoder.encode( data );
        }
    
        return JPEGEncoder;
    });
    /**
     * @fileOverview Fix android canvas.toDataUrl bug.
     */
    define('runtime/html5/androidpatch',[
        'runtime/html5/util',
        'runtime/html5/jpegencoder',
        'base'
    ], function( Util, encoder, Base ) {
        var origin = Util.canvasToDataUrl,
            supportJpeg;
    
        Util.canvasToDataUrl = function( canvas, type, quality ) {
            var ctx, w, h, fragement, parts;
    
            // 非android手机直接跳过。
            if ( !Base.os.android ) {
                return origin.apply( null, arguments );
            }
    
            // 检测是否canvas支持jpeg导出，根据数据格式来判断。
            // JPEG 前两位分别是：255, 216
            if ( type === 'image/jpeg' && typeof supportJpeg === 'undefined' ) {
                fragement = origin.apply( null, arguments );
    
                parts = fragement.split(',');
    
                if ( ~parts[ 0 ].indexOf('base64') ) {
                    fragement = atob( parts[ 1 ] );
                } else {
                    fragement = decodeURIComponent( parts[ 1 ] );
                }
    
                fragement = fragement.substring( 0, 2 );
    
                supportJpeg = fragement.charCodeAt( 0 ) === 255 &&
                        fragement.charCodeAt( 1 ) === 216;
            }
    
            // 只有在android环境下才修复
            if ( type === 'image/jpeg' && !supportJpeg ) {
                w = canvas.width;
                h = canvas.height;
                ctx = canvas.getContext('2d');
    
                return encoder.encode( ctx.getImageData( 0, 0, w, h ), quality );
            }
    
            return origin.apply( null, arguments );
        };
    });
    /**
     * @fileOverview Transport
     * @todo 支持chunked传输，优势：
     * 可以将大文件分成小块，挨个传输，可以提高大文件成功率，当失败的时候，也只需要重传那小部分，
     * 而不需要重头再传一次。另外断点续传也需要用chunked方式。
     */
    define('runtime/html5/transport',[
        'base',
        'runtime/html5/runtime'
    ], function( Base, Html5Runtime ) {
    
        var noop = Base.noop,
            $ = Base.$;
    
        return Html5Runtime.register( 'Transport', {
            init: function() {
                this._status = 0;
                this._response = null;
            },
    
            send: function() {
                var owner = this.owner,
                    opts = this.options,
                    xhr = this._initAjax(),
                    blob = owner._blob,
                    server = opts.server,
                    formData, binary, fr;
    
                if ( opts.sendAsBinary ) {
                    server += (/\?/.test( server ) ? '&' : '?') +
                            $.param( owner._formData );
    
                    binary = blob.getSource();
                } else {
                    formData = new FormData();
                    $.each( owner._formData, function( k, v ) {
                        formData.append( k, v );
                    });
    
                    formData.append( opts.fileVal, blob.getSource(),
                            opts.filename || owner._formData.name || '' );
                }
    
                if ( opts.withCredentials && 'withCredentials' in xhr ) {
                    xhr.open( opts.method, server, true );
                    xhr.withCredentials = true;
                } else {
                    xhr.open( opts.method, server );
                }
    
                this._setRequestHeader( xhr, opts.headers );
    
                if ( binary ) {
                    xhr.overrideMimeType('application/octet-stream');
    
                    // android直接发送blob会导致服务端接收到的是空文件。
                    // bug详情。
                    // https://code.google.com/p/android/issues/detail?id=39882
                    // 所以先用fileReader读取出来再通过arraybuffer的方式发送。
                    if ( Base.os.android ) {
                        fr = new FileReader();
    
                        fr.onload = function() {
                            xhr.send( this.result );
                            fr = fr.onload = null;
                        };
    
                        fr.readAsArrayBuffer( binary );
                    } else {
                        xhr.send( binary );
                    }
                } else {
                    xhr.send( formData );
                }
            },
    
            getResponse: function() {
                return this._response;
            },
    
            getResponseAsJson: function() {
                return this._parseJson( this._response );
            },
    
            getStatus: function() {
                return this._status;
            },
    
            abort: function() {
                var xhr = this._xhr;
    
                if ( xhr ) {
                    xhr.upload.onprogress = noop;
                    xhr.onreadystatechange = noop;
                    xhr.abort();
    
                    this._xhr = xhr = null;
                }
            },
    
            destroy: function() {
                this.abort();
            },
    
            _initAjax: function() {
                var me = this,
                    xhr = new XMLHttpRequest(),
                    opts = this.options;
    
                if ( opts.withCredentials && !('withCredentials' in xhr) &&
                        typeof XDomainRequest !== 'undefined' ) {
                    xhr = new XDomainRequest();
                }
    
                xhr.upload.onprogress = function( e ) {
                    var percentage = 0;
    
                    if ( e.lengthComputable ) {
                        percentage = e.loaded / e.total;
                    }
    
                    return me.trigger( 'progress', percentage );
                };
    
                xhr.onreadystatechange = function() {
    
                    if ( xhr.readyState !== 4 ) {
                        return;
                    }
    
                    xhr.upload.onprogress = noop;
                    xhr.onreadystatechange = noop;
                    me._xhr = null;
                    me._status = xhr.status;
    
                    if ( xhr.status >= 200 && xhr.status < 300 ) {
                        me._response = xhr.responseText;
                        return me.trigger('load');
                    } else if ( xhr.status >= 500 && xhr.status < 600 ) {
                        me._response = xhr.responseText;
                        return me.trigger( 'error', 'server' );
                    }
    
    
                    return me.trigger( 'error', me._status ? 'http' : 'abort' );
                };
    
                me._xhr = xhr;
                return xhr;
            },
    
            _setRequestHeader: function( xhr, headers ) {
                $.each( headers, function( key, val ) {
                    xhr.setRequestHeader( key, val );
                });
            },
    
            _parseJson: function( str ) {
                var json;
    
                try {
                    json = JSON.parse( str );
                } catch ( ex ) {
                    json = {};
                }
    
                return json;
            }
        });
    });
    define('webuploader',[
        'base',
        'widgets/filepicker',
        'widgets/image',
        'widgets/queue',
        'widgets/runtime',
        'widgets/upload',
        'runtime/html5/blob',
        'runtime/html5/filepicker',
        'runtime/html5/imagemeta/exif',
        'runtime/html5/image',
        'runtime/html5/androidpatch',
        'runtime/html5/transport'
    ], function( Base ) {
        return Base;
    });
    return require('webuploader');
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvdGhpcmQtcGFydHkvd2VidXBsb2FkZXIvd2VidXBsb2FkZXIuY3VzdG9tLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qISBXZWJVcGxvYWRlciAwLjEuMiAqL1xuXG5cbi8qKlxuICogQGZpbGVPdmVydmlldyDorqnlhoXpg6jlkITkuKrpg6jku7bnmoTku6PnoIHlj6/ku6XnlKhbYW1kXShodHRwczovL2dpdGh1Yi5jb20vYW1kanMvYW1kanMtYXBpL3dpa2kvQU1EKeaooeWdl+WumuS5ieaWueW8j+e7hOe7h+i1t+adpeOAglxuICpcbiAqIEFNRCBBUEkg5YaF6YOo55qE566A5Y2V5LiN5a6M5YWo5a6e546w77yM6K+35b+955Wl44CC5Y+q5pyJ5b2TV2ViVXBsb2FkZXLooqvlkIjlubbmiJDkuIDkuKrmlofku7bnmoTml7blgJnmiY3kvJrlvJXlhaXjgIJcbiAqL1xuKGZ1bmN0aW9uKCByb290LCBmYWN0b3J5ICkge1xuICAgIHZhciBtb2R1bGVzID0ge30sXG5cbiAgICAgICAgLy8g5YaF6YOocmVxdWlyZSwg566A5Y2V5LiN5a6M5YWo5a6e546w44CCXG4gICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9hbWRqcy9hbWRqcy1hcGkvd2lraS9yZXF1aXJlXG4gICAgICAgIF9yZXF1aXJlID0gZnVuY3Rpb24oIGRlcHMsIGNhbGxiYWNrICkge1xuICAgICAgICAgICAgdmFyIGFyZ3MsIGxlbiwgaTtcblxuICAgICAgICAgICAgLy8g5aaC5p6cZGVwc+S4jeaYr+aVsOe7hO+8jOWImeebtOaOpei/lOWbnuaMh+Wumm1vZHVsZVxuICAgICAgICAgICAgaWYgKCB0eXBlb2YgZGVwcyA9PT0gJ3N0cmluZycgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldE1vZHVsZSggZGVwcyApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhcmdzID0gW107XG4gICAgICAgICAgICAgICAgZm9yKCBsZW4gPSBkZXBzLmxlbmd0aCwgaSA9IDA7IGkgPCBsZW47IGkrKyApIHtcbiAgICAgICAgICAgICAgICAgICAgYXJncy5wdXNoKCBnZXRNb2R1bGUoIGRlcHNbIGkgXSApICk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmFwcGx5KCBudWxsLCBhcmdzICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8g5YaF6YOoZGVmaW5l77yM5pqC5pe25LiN5pSv5oyB5LiN5oyH5a6aaWQuXG4gICAgICAgIF9kZWZpbmUgPSBmdW5jdGlvbiggaWQsIGRlcHMsIGZhY3RvcnkgKSB7XG4gICAgICAgICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT09IDIgKSB7XG4gICAgICAgICAgICAgICAgZmFjdG9yeSA9IGRlcHM7XG4gICAgICAgICAgICAgICAgZGVwcyA9IG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIF9yZXF1aXJlKCBkZXBzIHx8IFtdLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzZXRNb2R1bGUoIGlkLCBmYWN0b3J5LCBhcmd1bWVudHMgKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIOiuvue9rm1vZHVsZSwg5YW85a65Q29tbW9uSnPlhpnms5XjgIJcbiAgICAgICAgc2V0TW9kdWxlID0gZnVuY3Rpb24oIGlkLCBmYWN0b3J5LCBhcmdzICkge1xuICAgICAgICAgICAgdmFyIG1vZHVsZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgZXhwb3J0czogZmFjdG9yeVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgcmV0dXJuZWQ7XG5cbiAgICAgICAgICAgIGlmICggdHlwZW9mIGZhY3RvcnkgPT09ICdmdW5jdGlvbicgKSB7XG4gICAgICAgICAgICAgICAgYXJncy5sZW5ndGggfHwgKGFyZ3MgPSBbIF9yZXF1aXJlLCBtb2R1bGUuZXhwb3J0cywgbW9kdWxlIF0pO1xuICAgICAgICAgICAgICAgIHJldHVybmVkID0gZmFjdG9yeS5hcHBseSggbnVsbCwgYXJncyApO1xuICAgICAgICAgICAgICAgIHJldHVybmVkICE9PSB1bmRlZmluZWQgJiYgKG1vZHVsZS5leHBvcnRzID0gcmV0dXJuZWQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBtb2R1bGVzWyBpZCBdID0gbW9kdWxlLmV4cG9ydHM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8g5qC55o2uaWTojrflj5Ztb2R1bGVcbiAgICAgICAgZ2V0TW9kdWxlID0gZnVuY3Rpb24oIGlkICkge1xuICAgICAgICAgICAgdmFyIG1vZHVsZSA9IG1vZHVsZXNbIGlkIF0gfHwgcm9vdFsgaWQgXTtcblxuICAgICAgICAgICAgaWYgKCAhbW9kdWxlICkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciggJ2AnICsgaWQgKyAnYCBpcyB1bmRlZmluZWQnICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBtb2R1bGU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8g5bCG5omA5pyJbW9kdWxlc++8jOWwhui3r+W+hGlkc+ijheaNouaIkOWvueixoeOAglxuICAgICAgICBleHBvcnRzVG8gPSBmdW5jdGlvbiggb2JqICkge1xuICAgICAgICAgICAgdmFyIGtleSwgaG9zdCwgcGFydHMsIHBhcnQsIGxhc3QsIHVjRmlyc3Q7XG5cbiAgICAgICAgICAgIC8vIG1ha2UgdGhlIGZpcnN0IGNoYXJhY3RlciB1cHBlciBjYXNlLlxuICAgICAgICAgICAgdWNGaXJzdCA9IGZ1bmN0aW9uKCBzdHIgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0ciAmJiAoc3RyLmNoYXJBdCggMCApLnRvVXBwZXJDYXNlKCkgKyBzdHIuc3Vic3RyKCAxICkpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZm9yICgga2V5IGluIG1vZHVsZXMgKSB7XG4gICAgICAgICAgICAgICAgaG9zdCA9IG9iajtcblxuICAgICAgICAgICAgICAgIGlmICggIW1vZHVsZXMuaGFzT3duUHJvcGVydHkoIGtleSApICkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBwYXJ0cyA9IGtleS5zcGxpdCgnLycpO1xuICAgICAgICAgICAgICAgIGxhc3QgPSB1Y0ZpcnN0KCBwYXJ0cy5wb3AoKSApO1xuXG4gICAgICAgICAgICAgICAgd2hpbGUoIChwYXJ0ID0gdWNGaXJzdCggcGFydHMuc2hpZnQoKSApKSApIHtcbiAgICAgICAgICAgICAgICAgICAgaG9zdFsgcGFydCBdID0gaG9zdFsgcGFydCBdIHx8IHt9O1xuICAgICAgICAgICAgICAgICAgICBob3N0ID0gaG9zdFsgcGFydCBdO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGhvc3RbIGxhc3QgXSA9IG1vZHVsZXNbIGtleSBdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGV4cG9ydHMgPSBmYWN0b3J5KCByb290LCBfZGVmaW5lLCBfcmVxdWlyZSApLFxuICAgICAgICBvcmlnaW47XG5cbiAgICAvLyBleHBvcnRzIGV2ZXJ5IG1vZHVsZS5cbiAgICBleHBvcnRzVG8oIGV4cG9ydHMgKTtcblxuICAgIGlmICggdHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzID09PSAnb2JqZWN0JyApIHtcblxuICAgICAgICAvLyBGb3IgQ29tbW9uSlMgYW5kIENvbW1vbkpTLWxpa2UgZW52aXJvbm1lbnRzIHdoZXJlIGEgcHJvcGVyIHdpbmRvdyBpcyBwcmVzZW50LFxuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHM7XG4gICAgfSBlbHNlIGlmICggdHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kICkge1xuXG4gICAgICAgIC8vIEFsbG93IHVzaW5nIHRoaXMgYnVpbHQgbGlicmFyeSBhcyBhbiBBTUQgbW9kdWxlXG4gICAgICAgIC8vIGluIGFub3RoZXIgcHJvamVjdC4gVGhhdCBvdGhlciBwcm9qZWN0IHdpbGwgb25seVxuICAgICAgICAvLyBzZWUgdGhpcyBBTUQgY2FsbCwgbm90IHRoZSBpbnRlcm5hbCBtb2R1bGVzIGluXG4gICAgICAgIC8vIHRoZSBjbG9zdXJlIGJlbG93LlxuICAgICAgICBkZWZpbmUoW10sIGV4cG9ydHMgKTtcbiAgICB9IGVsc2Uge1xuXG4gICAgICAgIC8vIEJyb3dzZXIgZ2xvYmFscyBjYXNlLiBKdXN0IGFzc2lnbiB0aGVcbiAgICAgICAgLy8gcmVzdWx0IHRvIGEgcHJvcGVydHkgb24gdGhlIGdsb2JhbC5cbiAgICAgICAgb3JpZ2luID0gcm9vdC5XZWJVcGxvYWRlcjtcbiAgICAgICAgcm9vdC5XZWJVcGxvYWRlciA9IGV4cG9ydHM7XG4gICAgICAgIHJvb3QuV2ViVXBsb2FkZXIubm9Db25mbGljdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcm9vdC5XZWJVcGxvYWRlciA9IG9yaWdpbjtcbiAgICAgICAgfTtcbiAgICB9XG59KSggdGhpcywgZnVuY3Rpb24oIHdpbmRvdywgZGVmaW5lLCByZXF1aXJlICkge1xuXG5cbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IGpRdWVyeSBvciBaZXB0b1xuICAgICAqL1xuICAgIGRlZmluZSgnZG9sbGFyLXRoaXJkJyxbXSxmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5qUXVlcnkgfHwgd2luZG93LlplcHRvO1xuICAgIH0pO1xuICAgIC8qKlxuICAgICAqIEBmaWxlT3ZlcnZpZXcgRG9tIOaTjeS9nOebuOWFs1xuICAgICAqL1xuICAgIGRlZmluZSgnZG9sbGFyJyxbXG4gICAgICAgICdkb2xsYXItdGhpcmQnXG4gICAgXSwgZnVuY3Rpb24oIF8gKSB7XG4gICAgICAgIHJldHVybiBfO1xuICAgIH0pO1xuICAgIC8qKlxuICAgICAqIEBmaWxlT3ZlcnZpZXcg5L2/55SoalF1ZXJ555qEUHJvbWlzZVxuICAgICAqL1xuICAgIGRlZmluZSgncHJvbWlzZS10aGlyZCcsW1xuICAgICAgICAnZG9sbGFyJ1xuICAgIF0sIGZ1bmN0aW9uKCAkICkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgRGVmZXJyZWQ6ICQuRGVmZXJyZWQsXG4gICAgICAgICAgICB3aGVuOiAkLndoZW4sXG4gICAgXG4gICAgICAgICAgICBpc1Byb21pc2U6IGZ1bmN0aW9uKCBhbnl0aGluZyApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYW55dGhpbmcgJiYgdHlwZW9mIGFueXRoaW5nLnRoZW4gPT09ICdmdW5jdGlvbic7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSk7XG4gICAgLyoqXG4gICAgICogQGZpbGVPdmVydmlldyBQcm9taXNlL0ErXG4gICAgICovXG4gICAgZGVmaW5lKCdwcm9taXNlJyxbXG4gICAgICAgICdwcm9taXNlLXRoaXJkJ1xuICAgIF0sIGZ1bmN0aW9uKCBfICkge1xuICAgICAgICByZXR1cm4gXztcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IOWfuuehgOexu+aWueazleOAglxuICAgICAqL1xuICAgIFxuICAgIC8qKlxuICAgICAqIFdlYiBVcGxvYWRlcuWGhemDqOexu+eahOivpue7huivtOaYju+8jOS7peS4i+aPkOWPiueahOWKn+iDveexu++8jOmDveWPr+S7peWcqGBXZWJVcGxvYWRlcmDov5nkuKrlj5jph4/kuK3orr/pl67liLDjgIJcbiAgICAgKlxuICAgICAqIEFzIHlvdSBrbm93LCBXZWIgVXBsb2FkZXLnmoTmr4/kuKrmlofku7bpg73mmK/nlKjov4dbQU1EXShodHRwczovL2dpdGh1Yi5jb20vYW1kanMvYW1kanMtYXBpL3dpa2kvQU1EKeinhOiMg+S4reeahGBkZWZpbmVg57uE57uH6LW35p2l55qELCDmr4/kuKpNb2R1bGXpg73kvJrmnInkuKptb2R1bGUgaWQuXG4gICAgICog6buY6K6kbW9kdWxlIGlk6K+l5paH5Lu255qE6Lev5b6E77yM6ICM5q2k6Lev5b6E5bCG5Lya6L2s5YyW5oiQ5ZCN5a2X56m66Ze05a2Y5pS+5ZyoV2ViVXBsb2FkZXLkuK3jgILlpoLvvJpcbiAgICAgKlxuICAgICAqICogbW9kdWxlIGBiYXNlYO+8mldlYlVwbG9hZGVyLkJhc2VcbiAgICAgKiAqIG1vZHVsZSBgZmlsZWA6IFdlYlVwbG9hZGVyLkZpbGVcbiAgICAgKiAqIG1vZHVsZSBgbGliL2RuZGA6IFdlYlVwbG9hZGVyLkxpYi5EbmRcbiAgICAgKiAqIG1vZHVsZSBgcnVudGltZS9odG1sNS9kbmRgOiBXZWJVcGxvYWRlci5SdW50aW1lLkh0bWw1LkRuZFxuICAgICAqXG4gICAgICpcbiAgICAgKiDku6XkuIvmlofmoaPlsIblj6/og73nnIHnlaVgV2ViVXBsb2FkZXJg5YmN57yA44CCXG4gICAgICogQG1vZHVsZSBXZWJVcGxvYWRlclxuICAgICAqIEB0aXRsZSBXZWJVcGxvYWRlciBBUEnmlofmoaNcbiAgICAgKi9cbiAgICBkZWZpbmUoJ2Jhc2UnLFtcbiAgICAgICAgJ2RvbGxhcicsXG4gICAgICAgICdwcm9taXNlJ1xuICAgIF0sIGZ1bmN0aW9uKCAkLCBwcm9taXNlICkge1xuICAgIFxuICAgICAgICB2YXIgbm9vcCA9IGZ1bmN0aW9uKCkge30sXG4gICAgICAgICAgICBjYWxsID0gRnVuY3Rpb24uY2FsbDtcbiAgICBcbiAgICAgICAgLy8gaHR0cDovL2pzcGVyZi5jb20vdW5jdXJyeXRoaXNcbiAgICAgICAgLy8g5Y+N56eR6YeM5YyWXG4gICAgICAgIGZ1bmN0aW9uIHVuY3VycnlUaGlzKCBmbiApIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbC5hcHBseSggZm4sIGFyZ3VtZW50cyApO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIFxuICAgICAgICBmdW5jdGlvbiBiaW5kRm4oIGZuLCBjb250ZXh0ICkge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmbi5hcHBseSggY29udGV4dCwgYXJndW1lbnRzICk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZU9iamVjdCggcHJvdG8gKSB7XG4gICAgICAgICAgICB2YXIgZjtcbiAgICBcbiAgICAgICAgICAgIGlmICggT2JqZWN0LmNyZWF0ZSApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gT2JqZWN0LmNyZWF0ZSggcHJvdG8gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZiA9IGZ1bmN0aW9uKCkge307XG4gICAgICAgICAgICAgICAgZi5wcm90b3R5cGUgPSBwcm90bztcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IGYoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIFxuICAgIFxuICAgICAgICAvKipcbiAgICAgICAgICog5Z+656GA57G777yM5o+Q5L6b5LiA5Lqb566A5Y2V5bi455So55qE5pa55rOV44CCXG4gICAgICAgICAqIEBjbGFzcyBCYXNlXG4gICAgICAgICAqL1xuICAgICAgICByZXR1cm4ge1xuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkge1N0cmluZ30gdmVyc2lvbiDlvZPliY3niYjmnKzlj7fjgIJcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdmVyc2lvbjogJzAuMS4yJyxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQHByb3BlcnR5IHtqUXVlcnl8WmVwdG99ICQg5byV55So5L6d6LWW55qEalF1ZXJ55oiW6ICFWmVwdG/lr7nosaHjgIJcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgJDogJCxcbiAgICBcbiAgICAgICAgICAgIERlZmVycmVkOiBwcm9taXNlLkRlZmVycmVkLFxuICAgIFxuICAgICAgICAgICAgaXNQcm9taXNlOiBwcm9taXNlLmlzUHJvbWlzZSxcbiAgICBcbiAgICAgICAgICAgIHdoZW46IHByb21pc2Uud2hlbixcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uICDnroDljZXnmoTmtY/op4jlmajmo4Dmn6Xnu5PmnpzjgIJcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiAqIGB3ZWJraXRgICB3ZWJraXTniYjmnKzlj7fvvIzlpoLmnpzmtY/op4jlmajkuLrpnZ53ZWJraXTlhoXmoLjvvIzmraTlsZ7mgKfkuLpgdW5kZWZpbmVkYOOAglxuICAgICAgICAgICAgICogKiBgY2hyb21lYCAgY2hyb21l5rWP6KeI5Zmo54mI5pys5Y+377yM5aaC5p6c5rWP6KeI5Zmo5Li6Y2hyb21l77yM5q2k5bGe5oCn5Li6YHVuZGVmaW5lZGDjgIJcbiAgICAgICAgICAgICAqICogYGllYCAgaWXmtY/op4jlmajniYjmnKzlj7fvvIzlpoLmnpzmtY/op4jlmajkuLrpnZ5pZe+8jOatpOWxnuaAp+S4umB1bmRlZmluZWRg44CCKirmmoLkuI3mlK/mjIFpZTEwKyoqXG4gICAgICAgICAgICAgKiAqIGBmaXJlZm94YCAgZmlyZWZveOa1j+iniOWZqOeJiOacrOWPt++8jOWmguaenOa1j+iniOWZqOS4uumdnmZpcmVmb3jvvIzmraTlsZ7mgKfkuLpgdW5kZWZpbmVkYOOAglxuICAgICAgICAgICAgICogKiBgc2FmYXJpYCAgc2FmYXJp5rWP6KeI5Zmo54mI5pys5Y+377yM5aaC5p6c5rWP6KeI5Zmo5Li66Z2ec2FmYXJp77yM5q2k5bGe5oCn5Li6YHVuZGVmaW5lZGDjgIJcbiAgICAgICAgICAgICAqICogYG9wZXJhYCAgb3BlcmHmtY/op4jlmajniYjmnKzlj7fvvIzlpoLmnpzmtY/op4jlmajkuLrpnZ5vcGVyYe+8jOatpOWxnuaAp+S4umB1bmRlZmluZWRg44CCXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHByb3BlcnR5IHtPYmplY3R9IFticm93c2VyXVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBicm93c2VyOiAoZnVuY3Rpb24oIHVhICkge1xuICAgICAgICAgICAgICAgIHZhciByZXQgPSB7fSxcbiAgICAgICAgICAgICAgICAgICAgd2Via2l0ID0gdWEubWF0Y2goIC9XZWJLaXRcXC8oW1xcZC5dKykvICksXG4gICAgICAgICAgICAgICAgICAgIGNocm9tZSA9IHVhLm1hdGNoKCAvQ2hyb21lXFwvKFtcXGQuXSspLyApIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICB1YS5tYXRjaCggL0NyaU9TXFwvKFtcXGQuXSspLyApLFxuICAgIFxuICAgICAgICAgICAgICAgICAgICBpZSA9IHVhLm1hdGNoKCAvTVNJRVxccyhbXFxkXFwuXSspLyApIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICB1YS5tYXRjaCgvKD86dHJpZGVudCkoPzouKnJ2OihbXFx3Ll0rKSk/L2kpLFxuICAgICAgICAgICAgICAgICAgICBmaXJlZm94ID0gdWEubWF0Y2goIC9GaXJlZm94XFwvKFtcXGQuXSspLyApLFxuICAgICAgICAgICAgICAgICAgICBzYWZhcmkgPSB1YS5tYXRjaCggL1NhZmFyaVxcLyhbXFxkLl0rKS8gKSxcbiAgICAgICAgICAgICAgICAgICAgb3BlcmEgPSB1YS5tYXRjaCggL09QUlxcLyhbXFxkLl0rKS8gKTtcbiAgICBcbiAgICAgICAgICAgICAgICB3ZWJraXQgJiYgKHJldC53ZWJraXQgPSBwYXJzZUZsb2F0KCB3ZWJraXRbIDEgXSApKTtcbiAgICAgICAgICAgICAgICBjaHJvbWUgJiYgKHJldC5jaHJvbWUgPSBwYXJzZUZsb2F0KCBjaHJvbWVbIDEgXSApKTtcbiAgICAgICAgICAgICAgICBpZSAmJiAocmV0LmllID0gcGFyc2VGbG9hdCggaWVbIDEgXSApKTtcbiAgICAgICAgICAgICAgICBmaXJlZm94ICYmIChyZXQuZmlyZWZveCA9IHBhcnNlRmxvYXQoIGZpcmVmb3hbIDEgXSApKTtcbiAgICAgICAgICAgICAgICBzYWZhcmkgJiYgKHJldC5zYWZhcmkgPSBwYXJzZUZsb2F0KCBzYWZhcmlbIDEgXSApKTtcbiAgICAgICAgICAgICAgICBvcGVyYSAmJiAocmV0Lm9wZXJhID0gcGFyc2VGbG9hdCggb3BlcmFbIDEgXSApKTtcbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICAgICAgfSkoIG5hdmlnYXRvci51c2VyQWdlbnQgKSxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uICDmk43kvZzns7vnu5/mo4Dmn6Xnu5PmnpzjgIJcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiAqIGBhbmRyb2lkYCAg5aaC5p6c5ZyoYW5kcm9pZOa1j+iniOWZqOeOr+Wig+S4i++8jOatpOWAvOS4uuWvueW6lOeahGFuZHJvaWTniYjmnKzlj7fvvIzlkKbliJnkuLpgdW5kZWZpbmVkYOOAglxuICAgICAgICAgICAgICogKiBgaW9zYCDlpoLmnpzlnKhpb3PmtY/op4jlmajnjq/looPkuIvvvIzmraTlgLzkuLrlr7nlupTnmoRpb3PniYjmnKzlj7fvvIzlkKbliJnkuLpgdW5kZWZpbmVkYOOAglxuICAgICAgICAgICAgICogQHByb3BlcnR5IHtPYmplY3R9IFtvc11cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgb3M6IChmdW5jdGlvbiggdWEgKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJldCA9IHt9LFxuICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyBvc3ggPSAhIXVhLm1hdGNoKCAvXFwoTWFjaW50b3NoXFw7IEludGVsIC8gKSxcbiAgICAgICAgICAgICAgICAgICAgYW5kcm9pZCA9IHVhLm1hdGNoKCAvKD86QW5kcm9pZCk7P1tcXHNcXC9dKyhbXFxkLl0rKT8vICksXG4gICAgICAgICAgICAgICAgICAgIGlvcyA9IHVhLm1hdGNoKCAvKD86aVBhZHxpUG9kfGlQaG9uZSkuKk9TXFxzKFtcXGRfXSspLyApO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIG9zeCAmJiAocmV0Lm9zeCA9IHRydWUpO1xuICAgICAgICAgICAgICAgIGFuZHJvaWQgJiYgKHJldC5hbmRyb2lkID0gcGFyc2VGbG9hdCggYW5kcm9pZFsgMSBdICkpO1xuICAgICAgICAgICAgICAgIGlvcyAmJiAocmV0LmlvcyA9IHBhcnNlRmxvYXQoIGlvc1sgMSBdLnJlcGxhY2UoIC9fL2csICcuJyApICkpO1xuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgICAgICB9KSggbmF2aWdhdG9yLnVzZXJBZ2VudCApLFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDlrp7njrDnsbvkuI7nsbvkuYvpl7TnmoTnu6fmib/jgIJcbiAgICAgICAgICAgICAqIEBtZXRob2QgaW5oZXJpdHNcbiAgICAgICAgICAgICAqIEBncmFtbWFyIEJhc2UuaW5oZXJpdHMoIHN1cGVyICkgPT4gY2hpbGRcbiAgICAgICAgICAgICAqIEBncmFtbWFyIEJhc2UuaW5oZXJpdHMoIHN1cGVyLCBwcm90b3MgKSA9PiBjaGlsZFxuICAgICAgICAgICAgICogQGdyYW1tYXIgQmFzZS5pbmhlcml0cyggc3VwZXIsIHByb3Rvcywgc3RhdGljcyApID0+IGNoaWxkXG4gICAgICAgICAgICAgKiBAcGFyYW0gIHtDbGFzc30gc3VwZXIg54i257G7XG4gICAgICAgICAgICAgKiBAcGFyYW0gIHtPYmplY3QgfCBGdW5jdGlvbn0gW3Byb3Rvc10g5a2Q57G75oiW6ICF5a+56LGh44CC5aaC5p6c5a+56LGh5Lit5YyF5ZCrY29uc3RydWN0b3LvvIzlrZDnsbvlsIbmmK/nlKjmraTlsZ7mgKflgLzjgIJcbiAgICAgICAgICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBbcHJvdG9zLmNvbnN0cnVjdG9yXSDlrZDnsbvmnoTpgKDlmajvvIzkuI3mjIflrprnmoTor53lsIbliJvlu7rkuKrkuLTml7bnmoTnm7TmjqXmiafooYzniLbnsbvmnoTpgKDlmajnmoTmlrnms5XjgIJcbiAgICAgICAgICAgICAqIEBwYXJhbSAge09iamVjdH0gW3N0YXRpY3NdIOmdmeaAgeWxnuaAp+aIluaWueazleOAglxuICAgICAgICAgICAgICogQHJldHVybiB7Q2xhc3N9IOi/lOWbnuWtkOexu+OAglxuICAgICAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICAgICAqIGZ1bmN0aW9uIFBlcnNvbigpIHtcbiAgICAgICAgICAgICAqICAgICBjb25zb2xlLmxvZyggJ1N1cGVyJyApO1xuICAgICAgICAgICAgICogfVxuICAgICAgICAgICAgICogUGVyc29uLnByb3RvdHlwZS5oZWxsbyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICogICAgIGNvbnNvbGUubG9nKCAnaGVsbG8nICk7XG4gICAgICAgICAgICAgKiB9O1xuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIHZhciBNYW5hZ2VyID0gQmFzZS5pbmhlcml0cyggUGVyc29uLCB7XG4gICAgICAgICAgICAgKiAgICAgd29ybGQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICogICAgICAgICBjb25zb2xlLmxvZyggJ1dvcmxkJyApO1xuICAgICAgICAgICAgICogICAgIH1cbiAgICAgICAgICAgICAqIH0pO1xuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIC8vIOWboOS4uuayoeacieaMh+WumuaehOmAoOWZqO+8jOeItuexu+eahOaehOmAoOWZqOWwhuS8muaJp+ihjOOAglxuICAgICAgICAgICAgICogdmFyIGluc3RhbmNlID0gbmV3IE1hbmFnZXIoKTsgICAgLy8gPT4gU3VwZXJcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiAvLyDnu6fmib/lrZDniLbnsbvnmoTmlrnms5VcbiAgICAgICAgICAgICAqIGluc3RhbmNlLmhlbGxvKCk7ICAgIC8vID0+IGhlbGxvXG4gICAgICAgICAgICAgKiBpbnN0YW5jZS53b3JsZCgpOyAgICAvLyA9PiBXb3JsZFxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIC8vIOWtkOexu+eahF9fc3VwZXJfX+WxnuaAp+aMh+WQkeeItuexu1xuICAgICAgICAgICAgICogY29uc29sZS5sb2coIE1hbmFnZXIuX19zdXBlcl9fID09PSBQZXJzb24gKTsgICAgLy8gPT4gdHJ1ZVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBpbmhlcml0czogZnVuY3Rpb24oIFN1cGVyLCBwcm90b3MsIHN0YXRpY1Byb3RvcyApIHtcbiAgICAgICAgICAgICAgICB2YXIgY2hpbGQ7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCB0eXBlb2YgcHJvdG9zID09PSAnZnVuY3Rpb24nICkge1xuICAgICAgICAgICAgICAgICAgICBjaGlsZCA9IHByb3RvcztcbiAgICAgICAgICAgICAgICAgICAgcHJvdG9zID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCBwcm90b3MgJiYgcHJvdG9zLmhhc093blByb3BlcnR5KCdjb25zdHJ1Y3RvcicpICkge1xuICAgICAgICAgICAgICAgICAgICBjaGlsZCA9IHByb3Rvcy5jb25zdHJ1Y3RvcjtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjaGlsZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFN1cGVyLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g5aSN5Yi26Z2Z5oCB5pa55rOVXG4gICAgICAgICAgICAgICAgJC5leHRlbmQoIHRydWUsIGNoaWxkLCBTdXBlciwgc3RhdGljUHJvdG9zIHx8IHt9ICk7XG4gICAgXG4gICAgICAgICAgICAgICAgLyoganNoaW50IGNhbWVsY2FzZTogZmFsc2UgKi9cbiAgICBcbiAgICAgICAgICAgICAgICAvLyDorqnlrZDnsbvnmoRfX3N1cGVyX1/lsZ7mgKfmjIflkJHniLbnsbvjgIJcbiAgICAgICAgICAgICAgICBjaGlsZC5fX3N1cGVyX18gPSBTdXBlci5wcm90b3R5cGU7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g5p6E5bu65Y6f5Z6L77yM5re75Yqg5Y6f5Z6L5pa55rOV5oiW5bGe5oCn44CCXG4gICAgICAgICAgICAgICAgLy8g5pqC5pe255SoT2JqZWN0LmNyZWF0ZeWunueOsOOAglxuICAgICAgICAgICAgICAgIGNoaWxkLnByb3RvdHlwZSA9IGNyZWF0ZU9iamVjdCggU3VwZXIucHJvdG90eXBlICk7XG4gICAgICAgICAgICAgICAgcHJvdG9zICYmICQuZXh0ZW5kKCB0cnVlLCBjaGlsZC5wcm90b3R5cGUsIHByb3RvcyApO1xuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBjaGlsZDtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOS4gOS4quS4jeWBmuS7u+S9leS6i+aDheeahOaWueazleOAguWPr+S7peeUqOadpei1i+WAvOe7mem7mOiupOeahGNhbGxiYWNrLlxuICAgICAgICAgICAgICogQG1ldGhvZCBub29wXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIG5vb3A6IG5vb3AsXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOi/lOWbnuS4gOS4quaWsOeahOaWueazle+8jOatpOaWueazleWwhuW3suaMh+WumueahGBjb250ZXh0YOadpeaJp+ihjOOAglxuICAgICAgICAgICAgICogQGdyYW1tYXIgQmFzZS5iaW5kRm4oIGZuLCBjb250ZXh0ICkgPT4gRnVuY3Rpb25cbiAgICAgICAgICAgICAqIEBtZXRob2QgYmluZEZuXG4gICAgICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgICAgICogdmFyIGRvU29tZXRoaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgKiAgICAgICAgIGNvbnNvbGUubG9nKCB0aGlzLm5hbWUgKTtcbiAgICAgICAgICAgICAqICAgICB9LFxuICAgICAgICAgICAgICogICAgIG9iaiA9IHtcbiAgICAgICAgICAgICAqICAgICAgICAgbmFtZTogJ09iamVjdCBOYW1lJ1xuICAgICAgICAgICAgICogICAgIH0sXG4gICAgICAgICAgICAgKiAgICAgYWxpYXNGbiA9IEJhc2UuYmluZCggZG9Tb21ldGhpbmcsIG9iaiApO1xuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqICBhbGlhc0ZuKCk7ICAgIC8vID0+IE9iamVjdCBOYW1lXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBiaW5kRm46IGJpbmRGbixcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5byV55SoQ29uc29sZS5sb2flpoLmnpzlrZjlnKjnmoTor53vvIzlkKbliJnlvJXnlKjkuIDkuKpb56m65Ye95pWwbG9vcF0oI1dlYlVwbG9hZGVyOkJhc2UubG9nKeOAglxuICAgICAgICAgICAgICogQGdyYW1tYXIgQmFzZS5sb2coIGFyZ3MuLi4gKSA9PiB1bmRlZmluZWRcbiAgICAgICAgICAgICAqIEBtZXRob2QgbG9nXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGxvZzogKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmICggd2luZG93LmNvbnNvbGUgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBiaW5kRm4oIGNvbnNvbGUubG9nLCBjb25zb2xlICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBub29wO1xuICAgICAgICAgICAgfSkoKSxcbiAgICBcbiAgICAgICAgICAgIG5leHRUaWNrOiAoZnVuY3Rpb24oKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCBjYiApIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCggY2IsIDEgKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIEBidWcg5b2T5rWP6KeI5Zmo5LiN5Zyo5b2T5YmN56qX5Y+j5pe25bCx5YGc5LqG44CCXG4gICAgICAgICAgICAgICAgLy8gdmFyIG5leHQgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgICAgICAgICAgICAgLy8gICAgIHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICAgICAgICAgICAgICAvLyAgICAgd2luZG93Lm1velJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuICAgICAgICAgICAgICAgIC8vICAgICBmdW5jdGlvbiggY2IgKSB7XG4gICAgICAgICAgICAgICAgLy8gICAgICAgICB3aW5kb3cuc2V0VGltZW91dCggY2IsIDEwMDAgLyA2MCApO1xuICAgICAgICAgICAgICAgIC8vICAgICB9O1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIC8vIGZpeDogVW5jYXVnaHQgVHlwZUVycm9yOiBJbGxlZ2FsIGludm9jYXRpb25cbiAgICAgICAgICAgICAgICAvLyByZXR1cm4gYmluZEZuKCBuZXh0LCB3aW5kb3cgKTtcbiAgICAgICAgICAgIH0pKCksXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOiiq1t1bmN1cnJ5dGhpc10oaHR0cDovL3d3dy4yYWxpdHkuY29tLzIwMTEvMTEvdW5jdXJyeWluZy10aGlzLmh0bWwp55qE5pWw57uEc2xpY2Xmlrnms5XjgIJcbiAgICAgICAgICAgICAqIOWwhueUqOadpeWwhumdnuaVsOe7hOWvueixoei9rOWMluaIkOaVsOe7hOWvueixoeOAglxuICAgICAgICAgICAgICogQGdyYW1tYXIgQmFzZS5zbGljZSggdGFyZ2V0LCBzdGFydFssIGVuZF0gKSA9PiBBcnJheVxuICAgICAgICAgICAgICogQG1ldGhvZCBzbGljZVxuICAgICAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICAgICAqIGZ1bmN0aW9uIGRvU29tdGhpbmcoKSB7XG4gICAgICAgICAgICAgKiAgICAgdmFyIGFyZ3MgPSBCYXNlLnNsaWNlKCBhcmd1bWVudHMsIDEgKTtcbiAgICAgICAgICAgICAqICAgICBjb25zb2xlLmxvZyggYXJncyApO1xuICAgICAgICAgICAgICogfVxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIGRvU29tdGhpbmcoICdpZ25vcmVkJywgJ2FyZzInLCAnYXJnMycgKTsgICAgLy8gPT4gQXJyYXkgW1wiYXJnMlwiLCBcImFyZzNcIl1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgc2xpY2U6IHVuY3VycnlUaGlzKCBbXS5zbGljZSApLFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDnlJ/miJDllK/kuIDnmoRJRFxuICAgICAgICAgICAgICogQG1ldGhvZCBndWlkXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBCYXNlLmd1aWQoKSA9PiBTdHJpbmdcbiAgICAgICAgICAgICAqIEBncmFtbWFyIEJhc2UuZ3VpZCggcHJlZnggKSA9PiBTdHJpbmdcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZ3VpZDogKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBjb3VudGVyID0gMDtcbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oIHByZWZpeCApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGd1aWQgPSAoK25ldyBEYXRlKCkpLnRvU3RyaW5nKCAzMiApLFxuICAgICAgICAgICAgICAgICAgICAgICAgaSA9IDA7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGZvciAoIDsgaSA8IDU7IGkrKyApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGd1aWQgKz0gTWF0aC5mbG9vciggTWF0aC5yYW5kb20oKSAqIDY1NTM1ICkudG9TdHJpbmcoIDMyICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChwcmVmaXggfHwgJ3d1XycpICsgZ3VpZCArIChjb3VudGVyKyspLnRvU3RyaW5nKCAzMiApO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9KSgpLFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDmoLzlvI/ljJbmlofku7blpKflsI8sIOi+k+WHuuaIkOW4puWNleS9jeeahOWtl+espuS4slxuICAgICAgICAgICAgICogQG1ldGhvZCBmb3JtYXRTaXplXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBCYXNlLmZvcm1hdFNpemUoIHNpemUgKSA9PiBTdHJpbmdcbiAgICAgICAgICAgICAqIEBncmFtbWFyIEJhc2UuZm9ybWF0U2l6ZSggc2l6ZSwgcG9pbnRMZW5ndGggKSA9PiBTdHJpbmdcbiAgICAgICAgICAgICAqIEBncmFtbWFyIEJhc2UuZm9ybWF0U2l6ZSggc2l6ZSwgcG9pbnRMZW5ndGgsIHVuaXRzICkgPT4gU3RyaW5nXG4gICAgICAgICAgICAgKiBAcGFyYW0ge051bWJlcn0gc2l6ZSDmlofku7blpKflsI9cbiAgICAgICAgICAgICAqIEBwYXJhbSB7TnVtYmVyfSBbcG9pbnRMZW5ndGg9Ml0g57K+56Gu5Yiw55qE5bCP5pWw54K55pWw44CCXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0FycmF5fSBbdW5pdHM9WyAnQicsICdLJywgJ00nLCAnRycsICdUQicgXV0g5Y2V5L2N5pWw57uE44CC5LuO5a2X6IqC77yM5Yiw5Y2D5a2X6IqC77yM5LiA55u05b6A5LiK5oyH5a6a44CC5aaC5p6c5Y2V5L2N5pWw57uE6YeM6Z2i5Y+q5oyH5a6a5LqG5Yiw5LqGSyjljYPlrZfoioIp77yM5ZCM5pe25paH5Lu25aSn5bCP5aSn5LqOTSwg5q2k5pa55rOV55qE6L6T5Ye65bCG6L+Y5piv5pi+56S65oiQ5aSa5bCRSy5cbiAgICAgICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAgICAgKiBjb25zb2xlLmxvZyggQmFzZS5mb3JtYXRTaXplKCAxMDAgKSApOyAgICAvLyA9PiAxMDBCXG4gICAgICAgICAgICAgKiBjb25zb2xlLmxvZyggQmFzZS5mb3JtYXRTaXplKCAxMDI0ICkgKTsgICAgLy8gPT4gMS4wMEtcbiAgICAgICAgICAgICAqIGNvbnNvbGUubG9nKCBCYXNlLmZvcm1hdFNpemUoIDEwMjQsIDAgKSApOyAgICAvLyA9PiAxS1xuICAgICAgICAgICAgICogY29uc29sZS5sb2coIEJhc2UuZm9ybWF0U2l6ZSggMTAyNCAqIDEwMjQgKSApOyAgICAvLyA9PiAxLjAwTVxuICAgICAgICAgICAgICogY29uc29sZS5sb2coIEJhc2UuZm9ybWF0U2l6ZSggMTAyNCAqIDEwMjQgKiAxMDI0ICkgKTsgICAgLy8gPT4gMS4wMEdcbiAgICAgICAgICAgICAqIGNvbnNvbGUubG9nKCBCYXNlLmZvcm1hdFNpemUoIDEwMjQgKiAxMDI0ICogMTAyNCwgMCwgWydCJywgJ0tCJywgJ01CJ10gKSApOyAgICAvLyA9PiAxMDI0TUJcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZm9ybWF0U2l6ZTogZnVuY3Rpb24oIHNpemUsIHBvaW50TGVuZ3RoLCB1bml0cyApIHtcbiAgICAgICAgICAgICAgICB2YXIgdW5pdDtcbiAgICBcbiAgICAgICAgICAgICAgICB1bml0cyA9IHVuaXRzIHx8IFsgJ0InLCAnSycsICdNJywgJ0cnLCAnVEInIF07XG4gICAgXG4gICAgICAgICAgICAgICAgd2hpbGUgKCAodW5pdCA9IHVuaXRzLnNoaWZ0KCkpICYmIHNpemUgPiAxMDI0ICkge1xuICAgICAgICAgICAgICAgICAgICBzaXplID0gc2l6ZSAvIDEwMjQ7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiAodW5pdCA9PT0gJ0InID8gc2l6ZSA6IHNpemUudG9GaXhlZCggcG9pbnRMZW5ndGggfHwgMiApKSArXG4gICAgICAgICAgICAgICAgICAgICAgICB1bml0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0pO1xuICAgIC8qKlxuICAgICAqIOS6i+S7tuWkhOeQhuexu++8jOWPr+S7peeLrOeri+S9v+eUqO+8jOS5n+WPr+S7peaJqeWxlee7meWvueixoeS9v+eUqOOAglxuICAgICAqIEBmaWxlT3ZlcnZpZXcgTWVkaWF0b3JcbiAgICAgKi9cbiAgICBkZWZpbmUoJ21lZGlhdG9yJyxbXG4gICAgICAgICdiYXNlJ1xuICAgIF0sIGZ1bmN0aW9uKCBCYXNlICkge1xuICAgICAgICB2YXIgJCA9IEJhc2UuJCxcbiAgICAgICAgICAgIHNsaWNlID0gW10uc2xpY2UsXG4gICAgICAgICAgICBzZXBhcmF0b3IgPSAvXFxzKy8sXG4gICAgICAgICAgICBwcm90b3M7XG4gICAgXG4gICAgICAgIC8vIOagueaNruadoeS7tui/h+a7pOWHuuS6i+S7tmhhbmRsZXJzLlxuICAgICAgICBmdW5jdGlvbiBmaW5kSGFuZGxlcnMoIGFyciwgbmFtZSwgY2FsbGJhY2ssIGNvbnRleHQgKSB7XG4gICAgICAgICAgICByZXR1cm4gJC5ncmVwKCBhcnIsIGZ1bmN0aW9uKCBoYW5kbGVyICkge1xuICAgICAgICAgICAgICAgIHJldHVybiBoYW5kbGVyICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAoIW5hbWUgfHwgaGFuZGxlci5lID09PSBuYW1lKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgKCFjYWxsYmFjayB8fCBoYW5kbGVyLmNiID09PSBjYWxsYmFjayB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlci5jYi5fY2IgPT09IGNhbGxiYWNrKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgKCFjb250ZXh0IHx8IGhhbmRsZXIuY3R4ID09PSBjb250ZXh0KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIGZ1bmN0aW9uIGVhY2hFdmVudCggZXZlbnRzLCBjYWxsYmFjaywgaXRlcmF0b3IgKSB7XG4gICAgICAgICAgICAvLyDkuI3mlK/mjIHlr7nosaHvvIzlj6rmlK/mjIHlpJrkuKpldmVudOeUqOepuuagvOmalOW8gFxuICAgICAgICAgICAgJC5lYWNoKCAoZXZlbnRzIHx8ICcnKS5zcGxpdCggc2VwYXJhdG9yICksIGZ1bmN0aW9uKCBfLCBrZXkgKSB7XG4gICAgICAgICAgICAgICAgaXRlcmF0b3IoIGtleSwgY2FsbGJhY2sgKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIGZ1bmN0aW9uIHRyaWdnZXJIYW5kZXJzKCBldmVudHMsIGFyZ3MgKSB7XG4gICAgICAgICAgICB2YXIgc3RvcGVkID0gZmFsc2UsXG4gICAgICAgICAgICAgICAgaSA9IC0xLFxuICAgICAgICAgICAgICAgIGxlbiA9IGV2ZW50cy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgaGFuZGxlcjtcbiAgICBcbiAgICAgICAgICAgIHdoaWxlICggKytpIDwgbGVuICkge1xuICAgICAgICAgICAgICAgIGhhbmRsZXIgPSBldmVudHNbIGkgXTtcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoIGhhbmRsZXIuY2IuYXBwbHkoIGhhbmRsZXIuY3R4MiwgYXJncyApID09PSBmYWxzZSApIHtcbiAgICAgICAgICAgICAgICAgICAgc3RvcGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgcmV0dXJuICFzdG9wZWQ7XG4gICAgICAgIH1cbiAgICBcbiAgICAgICAgcHJvdG9zID0ge1xuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDnu5Hlrprkuovku7bjgIJcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBgY2FsbGJhY2tg5pa55rOV5Zyo5omn6KGM5pe277yMYXJndW1lbnRz5bCG5Lya5p2l5rqQ5LqOdHJpZ2dlcueahOaXtuWAmeaQuuW4pueahOWPguaVsOOAguWmglxuICAgICAgICAgICAgICogYGBgamF2YXNjcmlwdFxuICAgICAgICAgICAgICogdmFyIG9iaiA9IHt9O1xuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIC8vIOS9v+W+l29iauacieS6i+S7tuihjOS4ulxuICAgICAgICAgICAgICogTWVkaWF0b3IuaW5zdGFsbFRvKCBvYmogKTtcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBvYmoub24oICd0ZXN0YScsIGZ1bmN0aW9uKCBhcmcxLCBhcmcyICkge1xuICAgICAgICAgICAgICogICAgIGNvbnNvbGUubG9nKCBhcmcxLCBhcmcyICk7IC8vID0+ICdhcmcxJywgJ2FyZzInXG4gICAgICAgICAgICAgKiB9KTtcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBvYmoudHJpZ2dlciggJ3Rlc3RhJywgJ2FyZzEnLCAnYXJnMicgKTtcbiAgICAgICAgICAgICAqIGBgYFxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIOWmguaenGBjYWxsYmFja2DkuK3vvIzmn5DkuIDkuKrmlrnms5VgcmV0dXJuIGZhbHNlYOS6hu+8jOWImeWQjue7reeahOWFtuS7lmBjYWxsYmFja2Dpg73kuI3kvJrooqvmiafooYzliLDjgIJcbiAgICAgICAgICAgICAqIOWIh+S8muW9seWTjeWIsGB0cmlnZ2VyYOaWueazleeahOi/lOWbnuWAvO+8jOS4umBmYWxzZWDjgIJcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBgb25g6L+Y5Y+v5Lul55So5p2l5re75Yqg5LiA5Liq54m55q6K5LqL5Lu2YGFsbGAsIOi/meagt+aJgOacieeahOS6i+S7tuinpuWPkemDveS8muWTjeW6lOWIsOOAguWQjOaXtuatpOexu2BjYWxsYmFja2DkuK3nmoRhcmd1bWVudHPmnInkuIDkuKrkuI3lkIzlpITvvIxcbiAgICAgICAgICAgICAqIOWwseaYr+esrOS4gOS4quWPguaVsOS4umB0eXBlYO+8jOiusOW9leW9k+WJjeaYr+S7gOS5iOS6i+S7tuWcqOinpuWPkeOAguatpOexu2BjYWxsYmFja2DnmoTkvJjlhYjnuqfmr5TohJrkvY7vvIzkvJrlho3mraPluLhgY2FsbGJhY2tg5omn6KGM5a6M5ZCO6Kem5Y+R44CCXG4gICAgICAgICAgICAgKiBgYGBqYXZhc2NyaXB0XG4gICAgICAgICAgICAgKiBvYmoub24oICdhbGwnLCBmdW5jdGlvbiggdHlwZSwgYXJnMSwgYXJnMiApIHtcbiAgICAgICAgICAgICAqICAgICBjb25zb2xlLmxvZyggdHlwZSwgYXJnMSwgYXJnMiApOyAvLyA9PiAndGVzdGEnLCAnYXJnMScsICdhcmcyJ1xuICAgICAgICAgICAgICogfSk7XG4gICAgICAgICAgICAgKiBgYGBcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAbWV0aG9kIG9uXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBvbiggbmFtZSwgY2FsbGJhY2tbLCBjb250ZXh0XSApID0+IHNlbGZcbiAgICAgICAgICAgICAqIEBwYXJhbSAge1N0cmluZ30gICBuYW1lICAgICDkuovku7blkI3vvIzmlK/mjIHlpJrkuKrkuovku7bnlKjnqbrmoLzpmpTlvIBcbiAgICAgICAgICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjYWxsYmFjayDkuovku7blpITnkIblmahcbiAgICAgICAgICAgICAqIEBwYXJhbSAge09iamVjdH0gICBbY29udGV4dF0gIOS6i+S7tuWkhOeQhuWZqOeahOS4iuS4i+aWh+OAglxuICAgICAgICAgICAgICogQHJldHVybiB7c2VsZn0g6L+U5Zue6Ieq6Lqr77yM5pa55L6/6ZO+5byPXG4gICAgICAgICAgICAgKiBAY2hhaW5hYmxlXG4gICAgICAgICAgICAgKiBAY2xhc3MgTWVkaWF0b3JcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgb246IGZ1bmN0aW9uKCBuYW1lLCBjYWxsYmFjaywgY29udGV4dCApIHtcbiAgICAgICAgICAgICAgICB2YXIgbWUgPSB0aGlzLFxuICAgICAgICAgICAgICAgICAgICBzZXQ7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCAhY2FsbGJhY2sgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBzZXQgPSB0aGlzLl9ldmVudHMgfHwgKHRoaXMuX2V2ZW50cyA9IFtdKTtcbiAgICBcbiAgICAgICAgICAgICAgICBlYWNoRXZlbnQoIG5hbWUsIGNhbGxiYWNrLCBmdW5jdGlvbiggbmFtZSwgY2FsbGJhY2sgKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBoYW5kbGVyID0geyBlOiBuYW1lIH07XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZXIuY2IgPSBjYWxsYmFjaztcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlci5jdHggPSBjb250ZXh0O1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVyLmN0eDIgPSBjb250ZXh0IHx8IG1lO1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVyLmlkID0gc2V0Lmxlbmd0aDtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgc2V0LnB1c2goIGhhbmRsZXIgKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOe7keWumuS6i+S7tu+8jOS4lOW9k2hhbmRsZXLmiafooYzlrozlkI7vvIzoh6rliqjop6PpmaTnu5HlrprjgIJcbiAgICAgICAgICAgICAqIEBtZXRob2Qgb25jZVxuICAgICAgICAgICAgICogQGdyYW1tYXIgb25jZSggbmFtZSwgY2FsbGJhY2tbLCBjb250ZXh0XSApID0+IHNlbGZcbiAgICAgICAgICAgICAqIEBwYXJhbSAge1N0cmluZ30gICBuYW1lICAgICDkuovku7blkI1cbiAgICAgICAgICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjYWxsYmFjayDkuovku7blpITnkIblmahcbiAgICAgICAgICAgICAqIEBwYXJhbSAge09iamVjdH0gICBbY29udGV4dF0gIOS6i+S7tuWkhOeQhuWZqOeahOS4iuS4i+aWh+OAglxuICAgICAgICAgICAgICogQHJldHVybiB7c2VsZn0g6L+U5Zue6Ieq6Lqr77yM5pa55L6/6ZO+5byPXG4gICAgICAgICAgICAgKiBAY2hhaW5hYmxlXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIG9uY2U6IGZ1bmN0aW9uKCBuYW1lLCBjYWxsYmFjaywgY29udGV4dCApIHtcbiAgICAgICAgICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggIWNhbGxiYWNrICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWU7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIGVhY2hFdmVudCggbmFtZSwgY2FsbGJhY2ssIGZ1bmN0aW9uKCBuYW1lLCBjYWxsYmFjayApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9uY2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZS5vZmYoIG5hbWUsIG9uY2UgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2suYXBwbHkoIGNvbnRleHQgfHwgbWUsIGFyZ3VtZW50cyApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgb25jZS5fY2IgPSBjYWxsYmFjaztcbiAgICAgICAgICAgICAgICAgICAgbWUub24oIG5hbWUsIG9uY2UsIGNvbnRleHQgKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gbWU7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDop6PpmaTkuovku7bnu5HlrppcbiAgICAgICAgICAgICAqIEBtZXRob2Qgb2ZmXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBvZmYoIFtuYW1lWywgY2FsbGJhY2tbLCBjb250ZXh0XSBdIF0gKSA9PiBzZWxmXG4gICAgICAgICAgICAgKiBAcGFyYW0gIHtTdHJpbmd9ICAgW25hbWVdICAgICDkuovku7blkI1cbiAgICAgICAgICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBbY2FsbGJhY2tdIOS6i+S7tuWkhOeQhuWZqFxuICAgICAgICAgICAgICogQHBhcmFtICB7T2JqZWN0fSAgIFtjb250ZXh0XSAg5LqL5Lu25aSE55CG5Zmo55qE5LiK5LiL5paH44CCXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtzZWxmfSDov5Tlm57oh6rouqvvvIzmlrnkvr/pk77lvI9cbiAgICAgICAgICAgICAqIEBjaGFpbmFibGVcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgb2ZmOiBmdW5jdGlvbiggbmFtZSwgY2IsIGN0eCApIHtcbiAgICAgICAgICAgICAgICB2YXIgZXZlbnRzID0gdGhpcy5fZXZlbnRzO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggIWV2ZW50cyApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIGlmICggIW5hbWUgJiYgIWNiICYmICFjdHggKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50cyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgZWFjaEV2ZW50KCBuYW1lLCBjYiwgZnVuY3Rpb24oIG5hbWUsIGNiICkge1xuICAgICAgICAgICAgICAgICAgICAkLmVhY2goIGZpbmRIYW5kbGVycyggZXZlbnRzLCBuYW1lLCBjYiwgY3R4ICksIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGV2ZW50c1sgdGhpcy5pZCBdO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOinpuWPkeS6i+S7tlxuICAgICAgICAgICAgICogQG1ldGhvZCB0cmlnZ2VyXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciB0cmlnZ2VyKCBuYW1lWywgYXJncy4uLl0gKSA9PiBzZWxmXG4gICAgICAgICAgICAgKiBAcGFyYW0gIHtTdHJpbmd9ICAgdHlwZSAgICAg5LqL5Lu25ZCNXG4gICAgICAgICAgICAgKiBAcGFyYW0gIHsqfSBbLi4uXSDku7vmhI/lj4LmlbBcbiAgICAgICAgICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IOWmguaenGhhbmRsZXLkuK1yZXR1cm4gZmFsc2XkuobvvIzliJnov5Tlm55mYWxzZSwg5ZCm5YiZ6L+U5ZuedHJ1ZVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0cmlnZ2VyOiBmdW5jdGlvbiggdHlwZSApIHtcbiAgICAgICAgICAgICAgICB2YXIgYXJncywgZXZlbnRzLCBhbGxFdmVudHM7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCAhdGhpcy5fZXZlbnRzIHx8ICF0eXBlICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgYXJncyA9IHNsaWNlLmNhbGwoIGFyZ3VtZW50cywgMSApO1xuICAgICAgICAgICAgICAgIGV2ZW50cyA9IGZpbmRIYW5kbGVycyggdGhpcy5fZXZlbnRzLCB0eXBlICk7XG4gICAgICAgICAgICAgICAgYWxsRXZlbnRzID0gZmluZEhhbmRsZXJzKCB0aGlzLl9ldmVudHMsICdhbGwnICk7XG4gICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRyaWdnZXJIYW5kZXJzKCBldmVudHMsIGFyZ3MgKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgdHJpZ2dlckhhbmRlcnMoIGFsbEV2ZW50cywgYXJndW1lbnRzICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDkuK3ku4vogIXvvIzlroPmnKzouqvmmK/kuKrljZXkvovvvIzkvYblj6/ku6XpgJrov4dbaW5zdGFsbFRvXSgjV2ViVXBsb2FkZXI6TWVkaWF0b3I6aW5zdGFsbFRvKeaWueazle+8jOS9v+S7u+S9leWvueixoeWFt+Wkh+S6i+S7tuihjOS4uuOAglxuICAgICAgICAgKiDkuLvopoHnm67nmoTmmK/otJ/otKPmqKHlnZfkuI7mqKHlnZfkuYvpl7TnmoTlkIjkvZzvvIzpmY3kvY7ogKblkIjluqbjgIJcbiAgICAgICAgICpcbiAgICAgICAgICogQGNsYXNzIE1lZGlhdG9yXG4gICAgICAgICAqL1xuICAgICAgICByZXR1cm4gJC5leHRlbmQoe1xuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDlj6/ku6XpgJrov4fov5nkuKrmjqXlj6PvvIzkvb/ku7vkvZXlr7nosaHlhbflpIfkuovku7blip/og73jgIJcbiAgICAgICAgICAgICAqIEBtZXRob2QgaW5zdGFsbFRvXG4gICAgICAgICAgICAgKiBAcGFyYW0gIHtPYmplY3R9IG9iaiDpnIDopoHlhbflpIfkuovku7booYzkuLrnmoTlr7nosaHjgIJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge09iamVjdH0g6L+U5Zueb2JqLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBpbnN0YWxsVG86IGZ1bmN0aW9uKCBvYmogKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICQuZXh0ZW5kKCBvYmosIHByb3RvcyApO1xuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICB9LCBwcm90b3MgKTtcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IFVwbG9hZGVy5LiK5Lyg57G7XG4gICAgICovXG4gICAgZGVmaW5lKCd1cGxvYWRlcicsW1xuICAgICAgICAnYmFzZScsXG4gICAgICAgICdtZWRpYXRvcidcbiAgICBdLCBmdW5jdGlvbiggQmFzZSwgTWVkaWF0b3IgKSB7XG4gICAgXG4gICAgICAgIHZhciAkID0gQmFzZS4kO1xuICAgIFxuICAgICAgICAvKipcbiAgICAgICAgICog5LiK5Lyg5YWl5Y+j57G744CCXG4gICAgICAgICAqIEBjbGFzcyBVcGxvYWRlclxuICAgICAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgICAgICogQGdyYW1tYXIgbmV3IFVwbG9hZGVyKCBvcHRzICkgPT4gVXBsb2FkZXJcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICogdmFyIHVwbG9hZGVyID0gV2ViVXBsb2FkZXIuVXBsb2FkZXIoe1xuICAgICAgICAgKiAgICAgc3dmOiAncGF0aF9vZl9zd2YvVXBsb2FkZXIuc3dmJyxcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIOW8gOi1t+WIhueJh+S4iuS8oOOAglxuICAgICAgICAgKiAgICAgY2h1bmtlZDogdHJ1ZVxuICAgICAgICAgKiB9KTtcbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIFVwbG9hZGVyKCBvcHRzICkge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoIHRydWUsIHt9LCBVcGxvYWRlci5vcHRpb25zLCBvcHRzICk7XG4gICAgICAgICAgICB0aGlzLl9pbml0KCB0aGlzLm9wdGlvbnMgKTtcbiAgICAgICAgfVxuICAgIFxuICAgICAgICAvLyBkZWZhdWx0IE9wdGlvbnNcbiAgICAgICAgLy8gd2lkZ2V0c+S4reacieebuOW6lOaJqeWxlVxuICAgICAgICBVcGxvYWRlci5vcHRpb25zID0ge307XG4gICAgICAgIE1lZGlhdG9yLmluc3RhbGxUbyggVXBsb2FkZXIucHJvdG90eXBlICk7XG4gICAgXG4gICAgICAgIC8vIOaJuemHj+a3u+WKoOe6r+WRveS7pOW8j+aWueazleOAglxuICAgICAgICAkLmVhY2goe1xuICAgICAgICAgICAgdXBsb2FkOiAnc3RhcnQtdXBsb2FkJyxcbiAgICAgICAgICAgIHN0b3A6ICdzdG9wLXVwbG9hZCcsXG4gICAgICAgICAgICBnZXRGaWxlOiAnZ2V0LWZpbGUnLFxuICAgICAgICAgICAgZ2V0RmlsZXM6ICdnZXQtZmlsZXMnLFxuICAgICAgICAgICAgYWRkRmlsZTogJ2FkZC1maWxlJyxcbiAgICAgICAgICAgIGFkZEZpbGVzOiAnYWRkLWZpbGUnLFxuICAgICAgICAgICAgc29ydDogJ3NvcnQtZmlsZXMnLFxuICAgICAgICAgICAgcmVtb3ZlRmlsZTogJ3JlbW92ZS1maWxlJyxcbiAgICAgICAgICAgIHNraXBGaWxlOiAnc2tpcC1maWxlJyxcbiAgICAgICAgICAgIHJldHJ5OiAncmV0cnknLFxuICAgICAgICAgICAgaXNJblByb2dyZXNzOiAnaXMtaW4tcHJvZ3Jlc3MnLFxuICAgICAgICAgICAgbWFrZVRodW1iOiAnbWFrZS10aHVtYicsXG4gICAgICAgICAgICBnZXREaW1lbnNpb246ICdnZXQtZGltZW5zaW9uJyxcbiAgICAgICAgICAgIGFkZEJ1dHRvbjogJ2FkZC1idG4nLFxuICAgICAgICAgICAgZ2V0UnVudGltZVR5cGU6ICdnZXQtcnVudGltZS10eXBlJyxcbiAgICAgICAgICAgIHJlZnJlc2g6ICdyZWZyZXNoJyxcbiAgICAgICAgICAgIGRpc2FibGU6ICdkaXNhYmxlJyxcbiAgICAgICAgICAgIGVuYWJsZTogJ2VuYWJsZScsXG4gICAgICAgICAgICByZXNldDogJ3Jlc2V0J1xuICAgICAgICB9LCBmdW5jdGlvbiggZm4sIGNvbW1hbmQgKSB7XG4gICAgICAgICAgICBVcGxvYWRlci5wcm90b3R5cGVbIGZuIF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZXF1ZXN0KCBjb21tYW5kLCBhcmd1bWVudHMgKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgIFxuICAgICAgICAkLmV4dGVuZCggVXBsb2FkZXIucHJvdG90eXBlLCB7XG4gICAgICAgICAgICBzdGF0ZTogJ3BlbmRpbmcnLFxuICAgIFxuICAgICAgICAgICAgX2luaXQ6IGZ1bmN0aW9uKCBvcHRzICkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgXG4gICAgICAgICAgICAgICAgbWUucmVxdWVzdCggJ2luaXQnLCBvcHRzLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgbWUuc3RhdGUgPSAncmVhZHknO1xuICAgICAgICAgICAgICAgICAgICBtZS50cmlnZ2VyKCdyZWFkeScpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog6I635Y+W5oiW6ICF6K6+572uVXBsb2FkZXLphY3nva7pobnjgIJcbiAgICAgICAgICAgICAqIEBtZXRob2Qgb3B0aW9uXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBvcHRpb24oIGtleSApID0+ICpcbiAgICAgICAgICAgICAqIEBncmFtbWFyIG9wdGlvbigga2V5LCB2YWwgKSA9PiBzZWxmXG4gICAgICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIC8vIOWIneWni+eKtuaAgeWbvueJh+S4iuS8oOWJjeS4jeS8muWOi+e8qVxuICAgICAgICAgICAgICogdmFyIHVwbG9hZGVyID0gbmV3IFdlYlVwbG9hZGVyLlVwbG9hZGVyKHtcbiAgICAgICAgICAgICAqICAgICByZXNpemU6IG51bGw7XG4gICAgICAgICAgICAgKiB9KTtcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiAvLyDkv67mlLnlkI7lm77niYfkuIrkvKDliY3vvIzlsJ3or5XlsIblm77niYfljovnvKnliLAxNjAwICogMTYwMFxuICAgICAgICAgICAgICogdXBsb2FkZXIub3B0aW9ucyggJ3Jlc2l6ZScsIHtcbiAgICAgICAgICAgICAqICAgICB3aWR0aDogMTYwMCxcbiAgICAgICAgICAgICAqICAgICBoZWlnaHQ6IDE2MDBcbiAgICAgICAgICAgICAqIH0pO1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBvcHRpb246IGZ1bmN0aW9uKCBrZXksIHZhbCApIHtcbiAgICAgICAgICAgICAgICB2YXIgb3B0cyA9IHRoaXMub3B0aW9ucztcbiAgICBcbiAgICAgICAgICAgICAgICAvLyBzZXR0ZXJcbiAgICAgICAgICAgICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPiAxICkge1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAoICQuaXNQbGFpbk9iamVjdCggdmFsICkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmlzUGxhaW5PYmplY3QoIG9wdHNbIGtleSBdICkgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkLmV4dGVuZCggb3B0c1sga2V5IF0sIHZhbCApO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3B0c1sga2V5IF0gPSB2YWw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICB9IGVsc2UgeyAgICAvLyBnZXR0ZXJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGtleSA/IG9wdHNbIGtleSBdIDogb3B0cztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDojrflj5bmlofku7bnu5/orqHkv6Hmga/jgILov5Tlm57kuIDkuKrljIXlkKvkuIDkuIvkv6Hmga/nmoTlr7nosaHjgIJcbiAgICAgICAgICAgICAqICogYHN1Y2Nlc3NOdW1gIOS4iuS8oOaIkOWKn+eahOaWh+S7tuaVsFxuICAgICAgICAgICAgICogKiBgdXBsb2FkRmFpbE51bWAg5LiK5Lyg5aSx6LSl55qE5paH5Lu25pWwXG4gICAgICAgICAgICAgKiAqIGBjYW5jZWxOdW1gIOiiq+WIoOmZpOeahOaWh+S7tuaVsFxuICAgICAgICAgICAgICogKiBgaW52YWxpZE51bWAg5peg5pWI55qE5paH5Lu25pWwXG4gICAgICAgICAgICAgKiAqIGBxdWV1ZU51bWAg6L+Y5Zyo6Zif5YiX5Lit55qE5paH5Lu25pWwXG4gICAgICAgICAgICAgKiBAbWV0aG9kIGdldFN0YXRzXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBnZXRTdGF0cygpID0+IE9iamVjdFxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBnZXRTdGF0czogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgLy8gcmV0dXJuIHRoaXMuX21nci5nZXRTdGF0cy5hcHBseSggdGhpcy5fbWdyLCBhcmd1bWVudHMgKTtcbiAgICAgICAgICAgICAgICB2YXIgc3RhdHMgPSB0aGlzLnJlcXVlc3QoJ2dldC1zdGF0cycpO1xuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NOdW06IHN0YXRzLm51bU9mU3VjY2VzcyxcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8gd2hvIGNhcmU/XG4gICAgICAgICAgICAgICAgICAgIC8vIHF1ZXVlRmFpbE51bTogMCxcbiAgICAgICAgICAgICAgICAgICAgY2FuY2VsTnVtOiBzdGF0cy5udW1PZkNhbmNlbCxcbiAgICAgICAgICAgICAgICAgICAgaW52YWxpZE51bTogc3RhdHMubnVtT2ZJbnZhbGlkLFxuICAgICAgICAgICAgICAgICAgICB1cGxvYWRGYWlsTnVtOiBzdGF0cy5udW1PZlVwbG9hZEZhaWxlZCxcbiAgICAgICAgICAgICAgICAgICAgcXVldWVOdW06IHN0YXRzLm51bU9mUXVldWVcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8vIOmcgOimgemHjeWGmeatpOaWueazleadpeadpeaUr+aMgW9wdHMub25FdmVudOWSjGluc3RhbmNlLm9uRXZlbnTnmoTlpITnkIblmahcbiAgICAgICAgICAgIHRyaWdnZXI6IGZ1bmN0aW9uKCB0eXBlLyosIGFyZ3MuLi4qLyApIHtcbiAgICAgICAgICAgICAgICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoIGFyZ3VtZW50cywgMSApLFxuICAgICAgICAgICAgICAgICAgICBvcHRzID0gdGhpcy5vcHRpb25zLFxuICAgICAgICAgICAgICAgICAgICBuYW1lID0gJ29uJyArIHR5cGUuc3Vic3RyaW5nKCAwLCAxICkudG9VcHBlckNhc2UoKSArXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlLnN1YnN0cmluZyggMSApO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOiwg+eUqOmAmui/h29u5pa55rOV5rOo5YaM55qEaGFuZGxlci5cbiAgICAgICAgICAgICAgICAgICAgICAgIE1lZGlhdG9yLnRyaWdnZXIuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApID09PSBmYWxzZSB8fFxuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g6LCD55Sob3B0cy5vbkV2ZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAkLmlzRnVuY3Rpb24oIG9wdHNbIG5hbWUgXSApICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBvcHRzWyBuYW1lIF0uYXBwbHkoIHRoaXMsIGFyZ3MgKSA9PT0gZmFsc2UgfHxcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOiwg+eUqHRoaXMub25FdmVudFxuICAgICAgICAgICAgICAgICAgICAgICAgJC5pc0Z1bmN0aW9uKCB0aGlzWyBuYW1lIF0gKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpc1sgbmFtZSBdLmFwcGx5KCB0aGlzLCBhcmdzICkgPT09IGZhbHNlIHx8XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDlub/mkq3miYDmnIl1cGxvYWRlcueahOS6i+S7tuOAglxuICAgICAgICAgICAgICAgICAgICAgICAgTWVkaWF0b3IudHJpZ2dlci5hcHBseSggTWVkaWF0b3IsXG4gICAgICAgICAgICAgICAgICAgICAgICBbIHRoaXMsIHR5cGUgXS5jb25jYXQoIGFyZ3MgKSApID09PSBmYWxzZSApIHtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvLyB3aWRnZXRzL3dpZGdldC5qc+WwhuihpeWFheatpOaWueazleeahOivpue7huaWh+aho+OAglxuICAgICAgICAgICAgcmVxdWVzdDogQmFzZS5ub29wXG4gICAgICAgIH0pO1xuICAgIFxuICAgICAgICAvKipcbiAgICAgICAgICog5Yib5bu6VXBsb2FkZXLlrp7kvovvvIznrYnlkIzkuo5uZXcgVXBsb2FkZXIoIG9wdHMgKTtcbiAgICAgICAgICogQG1ldGhvZCBjcmVhdGVcbiAgICAgICAgICogQGNsYXNzIEJhc2VcbiAgICAgICAgICogQHN0YXRpY1xuICAgICAgICAgKiBAZ3JhbW1hciBCYXNlLmNyZWF0ZSggb3B0cyApID0+IFVwbG9hZGVyXG4gICAgICAgICAqL1xuICAgICAgICBCYXNlLmNyZWF0ZSA9IFVwbG9hZGVyLmNyZWF0ZSA9IGZ1bmN0aW9uKCBvcHRzICkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBVcGxvYWRlciggb3B0cyApO1xuICAgICAgICB9O1xuICAgIFxuICAgICAgICAvLyDmmrTpnLJVcGxvYWRlcu+8jOWPr+S7pemAmui/h+Wug+adpeaJqeWxleS4muWKoemAu+i+keOAglxuICAgICAgICBCYXNlLlVwbG9hZGVyID0gVXBsb2FkZXI7XG4gICAgXG4gICAgICAgIHJldHVybiBVcGxvYWRlcjtcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IFJ1bnRpbWXnrqHnkIblmajvvIzotJ/otKNSdW50aW1l55qE6YCJ5oupLCDov57mjqVcbiAgICAgKi9cbiAgICBkZWZpbmUoJ3J1bnRpbWUvcnVudGltZScsW1xuICAgICAgICAnYmFzZScsXG4gICAgICAgICdtZWRpYXRvcidcbiAgICBdLCBmdW5jdGlvbiggQmFzZSwgTWVkaWF0b3IgKSB7XG4gICAgXG4gICAgICAgIHZhciAkID0gQmFzZS4kLFxuICAgICAgICAgICAgZmFjdG9yaWVzID0ge30sXG4gICAgXG4gICAgICAgICAgICAvLyDojrflj5blr7nosaHnmoTnrKzkuIDkuKprZXlcbiAgICAgICAgICAgIGdldEZpcnN0S2V5ID0gZnVuY3Rpb24oIG9iaiApIHtcbiAgICAgICAgICAgICAgICBmb3IgKCB2YXIga2V5IGluIG9iaiApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBvYmouaGFzT3duUHJvcGVydHkoIGtleSApICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGtleTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgIC8vIOaOpeWPo+exu+OAglxuICAgICAgICBmdW5jdGlvbiBSdW50aW1lKCBvcHRpb25zICkge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe1xuICAgICAgICAgICAgICAgIGNvbnRhaW5lcjogZG9jdW1lbnQuYm9keVxuICAgICAgICAgICAgfSwgb3B0aW9ucyApO1xuICAgICAgICAgICAgdGhpcy51aWQgPSBCYXNlLmd1aWQoJ3J0XycpO1xuICAgICAgICB9XG4gICAgXG4gICAgICAgICQuZXh0ZW5kKCBSdW50aW1lLnByb3RvdHlwZSwge1xuICAgIFxuICAgICAgICAgICAgZ2V0Q29udGFpbmVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgb3B0cyA9IHRoaXMub3B0aW9ucyxcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50LCBjb250YWluZXI7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLl9jb250YWluZXIgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9jb250YWluZXI7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIHBhcmVudCA9ICQoIG9wdHMuY29udGFpbmVyIHx8IGRvY3VtZW50LmJvZHkgKTtcbiAgICAgICAgICAgICAgICBjb250YWluZXIgPSAkKCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSApO1xuICAgIFxuICAgICAgICAgICAgICAgIGNvbnRhaW5lci5hdHRyKCAnaWQnLCAncnRfJyArIHRoaXMudWlkICk7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyLmNzcyh7XG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgICAgICAgICAgICAgICB0b3A6ICcwcHgnLFxuICAgICAgICAgICAgICAgICAgICBsZWZ0OiAnMHB4JyxcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICcxcHgnLFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICcxcHgnLFxuICAgICAgICAgICAgICAgICAgICBvdmVyZmxvdzogJ2hpZGRlbidcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICBwYXJlbnQuYXBwZW5kKCBjb250YWluZXIgKTtcbiAgICAgICAgICAgICAgICBwYXJlbnQuYWRkQ2xhc3MoJ3dlYnVwbG9hZGVyLWNvbnRhaW5lcicpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2NvbnRhaW5lciA9IGNvbnRhaW5lcjtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGFpbmVyO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGluaXQ6IEJhc2Uubm9vcCxcbiAgICAgICAgICAgIGV4ZWM6IEJhc2Uubm9vcCxcbiAgICBcbiAgICAgICAgICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmICggdGhpcy5fY29udGFpbmVyICkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jb250YWluZXIucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCggdGhpcy5fX2NvbnRhaW5lciApO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICB0aGlzLm9mZigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgUnVudGltZS5vcmRlcnMgPSAnaHRtbDUsZmxhc2gnO1xuICAgIFxuICAgIFxuICAgICAgICAvKipcbiAgICAgICAgICog5re75YqgUnVudGltZeWunueOsOOAglxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gdHlwZSAgICDnsbvlnotcbiAgICAgICAgICogQHBhcmFtIHtSdW50aW1lfSBmYWN0b3J5IOWFt+S9k1J1bnRpbWXlrp7njrDjgIJcbiAgICAgICAgICovXG4gICAgICAgIFJ1bnRpbWUuYWRkUnVudGltZSA9IGZ1bmN0aW9uKCB0eXBlLCBmYWN0b3J5ICkge1xuICAgICAgICAgICAgZmFjdG9yaWVzWyB0eXBlIF0gPSBmYWN0b3J5O1xuICAgICAgICB9O1xuICAgIFxuICAgICAgICBSdW50aW1lLmhhc1J1bnRpbWUgPSBmdW5jdGlvbiggdHlwZSApIHtcbiAgICAgICAgICAgIHJldHVybiAhISh0eXBlID8gZmFjdG9yaWVzWyB0eXBlIF0gOiBnZXRGaXJzdEtleSggZmFjdG9yaWVzICkpO1xuICAgICAgICB9O1xuICAgIFxuICAgICAgICBSdW50aW1lLmNyZWF0ZSA9IGZ1bmN0aW9uKCBvcHRzLCBvcmRlcnMgKSB7XG4gICAgICAgICAgICB2YXIgdHlwZSwgcnVudGltZTtcbiAgICBcbiAgICAgICAgICAgIG9yZGVycyA9IG9yZGVycyB8fCBSdW50aW1lLm9yZGVycztcbiAgICAgICAgICAgICQuZWFjaCggb3JkZXJzLnNwbGl0KCAvXFxzKixcXHMqL2cgKSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKCBmYWN0b3JpZXNbIHRoaXMgXSApIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZSA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgIHR5cGUgPSB0eXBlIHx8IGdldEZpcnN0S2V5KCBmYWN0b3JpZXMgKTtcbiAgICBcbiAgICAgICAgICAgIGlmICggIXR5cGUgKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdSdW50aW1lIEVycm9yJyk7XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICBydW50aW1lID0gbmV3IGZhY3Rvcmllc1sgdHlwZSBdKCBvcHRzICk7XG4gICAgICAgICAgICByZXR1cm4gcnVudGltZTtcbiAgICAgICAgfTtcbiAgICBcbiAgICAgICAgTWVkaWF0b3IuaW5zdGFsbFRvKCBSdW50aW1lLnByb3RvdHlwZSApO1xuICAgICAgICByZXR1cm4gUnVudGltZTtcbiAgICB9KTtcbiAgICBcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IFJ1bnRpbWXnrqHnkIblmajvvIzotJ/otKNSdW50aW1l55qE6YCJ5oupLCDov57mjqVcbiAgICAgKi9cbiAgICBkZWZpbmUoJ3J1bnRpbWUvY2xpZW50JyxbXG4gICAgICAgICdiYXNlJyxcbiAgICAgICAgJ21lZGlhdG9yJyxcbiAgICAgICAgJ3J1bnRpbWUvcnVudGltZSdcbiAgICBdLCBmdW5jdGlvbiggQmFzZSwgTWVkaWF0b3IsIFJ1bnRpbWUgKSB7XG4gICAgXG4gICAgICAgIHZhciBjYWNoZTtcbiAgICBcbiAgICAgICAgY2FjaGUgPSAoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgb2JqID0ge307XG4gICAgXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGFkZDogZnVuY3Rpb24oIHJ1bnRpbWUgKSB7XG4gICAgICAgICAgICAgICAgICAgIG9ialsgcnVudGltZS51aWQgXSA9IHJ1bnRpbWU7XG4gICAgICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKCBydWlkLCBzdGFuZGFsb25lICkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBydWlkICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9ialsgcnVpZCBdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGZvciAoIGkgaW4gb2JqICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5pyJ5Lqb57G75Z6L5LiN6IO96YeN55So77yM5q+U5aaCZmlsZXBpY2tlci5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggc3RhbmRhbG9uZSAmJiBvYmpbIGkgXS5fX3N0YW5kYWxvbmUgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2JqWyBpIF07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgICAgICByZW1vdmU6IGZ1bmN0aW9uKCBydW50aW1lICkge1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgb2JqWyBydW50aW1lLnVpZCBdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pKCk7XG4gICAgXG4gICAgICAgIGZ1bmN0aW9uIFJ1bnRpbWVDbGllbnQoIGNvbXBvbmVudCwgc3RhbmRhbG9uZSApIHtcbiAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9IEJhc2UuRGVmZXJyZWQoKSxcbiAgICAgICAgICAgICAgICBydW50aW1lO1xuICAgIFxuICAgICAgICAgICAgdGhpcy51aWQgPSBCYXNlLmd1aWQoJ2NsaWVudF8nKTtcbiAgICBcbiAgICAgICAgICAgIC8vIOWFgeiuuHJ1bnRpbWXmsqHmnInliJ3lp4vljJbkuYvliY3vvIzms6jlhozkuIDkupvmlrnms5XlnKjliJ3lp4vljJblkI7miafooYzjgIJcbiAgICAgICAgICAgIHRoaXMucnVudGltZVJlYWR5ID0gZnVuY3Rpb24oIGNiICkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5kb25lKCBjYiApO1xuICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgIHRoaXMuY29ubmVjdFJ1bnRpbWUgPSBmdW5jdGlvbiggb3B0cywgY2IgKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8gYWxyZWFkeSBjb25uZWN0ZWQuXG4gICAgICAgICAgICAgICAgaWYgKCBydW50aW1lICkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2FscmVhZHkgY29ubmVjdGVkIScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBkZWZlcnJlZC5kb25lKCBjYiApO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggdHlwZW9mIG9wdHMgPT09ICdzdHJpbmcnICYmIGNhY2hlLmdldCggb3B0cyApICkge1xuICAgICAgICAgICAgICAgICAgICBydW50aW1lID0gY2FjaGUuZ2V0KCBvcHRzICk7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIC8vIOWDj2ZpbGVQaWNrZXLlj6rog73ni6znq4vlrZjlnKjvvIzkuI3og73lhaznlKjjgIJcbiAgICAgICAgICAgICAgICBydW50aW1lID0gcnVudGltZSB8fCBjYWNoZS5nZXQoIG51bGwsIHN0YW5kYWxvbmUgKTtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDpnIDopoHliJvlu7pcbiAgICAgICAgICAgICAgICBpZiAoICFydW50aW1lICkge1xuICAgICAgICAgICAgICAgICAgICBydW50aW1lID0gUnVudGltZS5jcmVhdGUoIG9wdHMsIG9wdHMucnVudGltZU9yZGVyICk7XG4gICAgICAgICAgICAgICAgICAgIHJ1bnRpbWUuX19wcm9taXNlID0gZGVmZXJyZWQucHJvbWlzZSgpO1xuICAgICAgICAgICAgICAgICAgICBydW50aW1lLm9uY2UoICdyZWFkeScsIGRlZmVycmVkLnJlc29sdmUgKTtcbiAgICAgICAgICAgICAgICAgICAgcnVudGltZS5pbml0KCk7XG4gICAgICAgICAgICAgICAgICAgIGNhY2hlLmFkZCggcnVudGltZSApO1xuICAgICAgICAgICAgICAgICAgICBydW50aW1lLl9fY2xpZW50ID0gMTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyDmnaXoh6pjYWNoZVxuICAgICAgICAgICAgICAgICAgICBCYXNlLiQuZXh0ZW5kKCBydW50aW1lLm9wdGlvbnMsIG9wdHMgKTtcbiAgICAgICAgICAgICAgICAgICAgcnVudGltZS5fX3Byb21pc2UudGhlbiggZGVmZXJyZWQucmVzb2x2ZSApO1xuICAgICAgICAgICAgICAgICAgICBydW50aW1lLl9fY2xpZW50Kys7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIHN0YW5kYWxvbmUgJiYgKHJ1bnRpbWUuX19zdGFuZGFsb25lID0gc3RhbmRhbG9uZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJ1bnRpbWU7XG4gICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgdGhpcy5nZXRSdW50aW1lID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJ1bnRpbWU7XG4gICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgdGhpcy5kaXNjb25uZWN0UnVudGltZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmICggIXJ1bnRpbWUgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgcnVudGltZS5fX2NsaWVudC0tO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggcnVudGltZS5fX2NsaWVudCA8PSAwICkge1xuICAgICAgICAgICAgICAgICAgICBjYWNoZS5yZW1vdmUoIHJ1bnRpbWUgKTtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHJ1bnRpbWUuX19wcm9taXNlO1xuICAgICAgICAgICAgICAgICAgICBydW50aW1lLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgcnVudGltZSA9IG51bGw7XG4gICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgdGhpcy5leGVjID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKCAhcnVudGltZSApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICB2YXIgYXJncyA9IEJhc2Uuc2xpY2UoIGFyZ3VtZW50cyApO1xuICAgICAgICAgICAgICAgIGNvbXBvbmVudCAmJiBhcmdzLnVuc2hpZnQoIGNvbXBvbmVudCApO1xuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBydW50aW1lLmV4ZWMuYXBwbHkoIHRoaXMsIGFyZ3MgKTtcbiAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgICAgICB0aGlzLmdldFJ1aWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcnVudGltZSAmJiBydW50aW1lLnVpZDtcbiAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgICAgICB0aGlzLmRlc3Ryb3kgPSAoZnVuY3Rpb24oIGRlc3Ryb3kgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBkZXN0cm95ICYmIGRlc3Ryb3kuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXIoJ2Rlc3Ryb3knKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vZmYoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5leGVjKCdkZXN0cm95Jyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzY29ubmVjdFJ1bnRpbWUoKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSkoIHRoaXMuZGVzdHJveSApO1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIE1lZGlhdG9yLmluc3RhbGxUbyggUnVudGltZUNsaWVudC5wcm90b3R5cGUgKTtcbiAgICAgICAgcmV0dXJuIFJ1bnRpbWVDbGllbnQ7XG4gICAgfSk7XG4gICAgLyoqXG4gICAgICogQGZpbGVPdmVydmlldyBCbG9iXG4gICAgICovXG4gICAgZGVmaW5lKCdsaWIvYmxvYicsW1xuICAgICAgICAnYmFzZScsXG4gICAgICAgICdydW50aW1lL2NsaWVudCdcbiAgICBdLCBmdW5jdGlvbiggQmFzZSwgUnVudGltZUNsaWVudCApIHtcbiAgICBcbiAgICAgICAgZnVuY3Rpb24gQmxvYiggcnVpZCwgc291cmNlICkge1xuICAgICAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICBcbiAgICAgICAgICAgIG1lLnNvdXJjZSA9IHNvdXJjZTtcbiAgICAgICAgICAgIG1lLnJ1aWQgPSBydWlkO1xuICAgIFxuICAgICAgICAgICAgUnVudGltZUNsaWVudC5jYWxsKCBtZSwgJ0Jsb2InICk7XG4gICAgXG4gICAgICAgICAgICB0aGlzLnVpZCA9IHNvdXJjZS51aWQgfHwgdGhpcy51aWQ7XG4gICAgICAgICAgICB0aGlzLnR5cGUgPSBzb3VyY2UudHlwZSB8fCAnJztcbiAgICAgICAgICAgIHRoaXMuc2l6ZSA9IHNvdXJjZS5zaXplIHx8IDA7XG4gICAgXG4gICAgICAgICAgICBpZiAoIHJ1aWQgKSB7XG4gICAgICAgICAgICAgICAgbWUuY29ubmVjdFJ1bnRpbWUoIHJ1aWQgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIFxuICAgICAgICBCYXNlLmluaGVyaXRzKCBSdW50aW1lQ2xpZW50LCB7XG4gICAgICAgICAgICBjb25zdHJ1Y3RvcjogQmxvYixcbiAgICBcbiAgICAgICAgICAgIHNsaWNlOiBmdW5jdGlvbiggc3RhcnQsIGVuZCApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5leGVjKCAnc2xpY2UnLCBzdGFydCwgZW5kICk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgZ2V0U291cmNlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zb3VyY2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIFxuICAgICAgICByZXR1cm4gQmxvYjtcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiDkuLrkuobnu5/kuIDljJZGbGFzaOeahEZpbGXlkoxIVE1MNeeahEZpbGXogIzlrZjlnKjjgIJcbiAgICAgKiDku6Xoh7Pkuo7opoHosIPnlKhGbGFzaOmHjOmdoueahEZpbGXvvIzkuZ/lj6/ku6Xlg4/osIPnlKhIVE1MNeeJiOacrOeahEZpbGXkuIDkuIvjgIJcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IEZpbGVcbiAgICAgKi9cbiAgICBkZWZpbmUoJ2xpYi9maWxlJyxbXG4gICAgICAgICdiYXNlJyxcbiAgICAgICAgJ2xpYi9ibG9iJ1xuICAgIF0sIGZ1bmN0aW9uKCBCYXNlLCBCbG9iICkge1xuICAgIFxuICAgICAgICB2YXIgdWlkID0gMSxcbiAgICAgICAgICAgIHJFeHQgPSAvXFwuKFteLl0rKSQvO1xuICAgIFxuICAgICAgICBmdW5jdGlvbiBGaWxlKCBydWlkLCBmaWxlICkge1xuICAgICAgICAgICAgdmFyIGV4dDtcbiAgICBcbiAgICAgICAgICAgIEJsb2IuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuICAgICAgICAgICAgdGhpcy5uYW1lID0gZmlsZS5uYW1lIHx8ICgndW50aXRsZWQnICsgdWlkKyspO1xuICAgICAgICAgICAgZXh0ID0gckV4dC5leGVjKCBmaWxlLm5hbWUgKSA/IFJlZ0V4cC4kMS50b0xvd2VyQ2FzZSgpIDogJyc7XG4gICAgXG4gICAgICAgICAgICAvLyB0b2RvIOaUr+aMgeWFtuS7luexu+Wei+aWh+S7tueahOi9rOaNouOAglxuICAgIFxuICAgICAgICAgICAgLy8g5aaC5p6c5pyJbWltZXR5cGUsIOS9huaYr+aWh+S7tuWQjemHjOmdouayoeacieaJvuWHuuWQjue8gOinhOW+i1xuICAgICAgICAgICAgaWYgKCAhZXh0ICYmIHRoaXMudHlwZSApIHtcbiAgICAgICAgICAgICAgICBleHQgPSAvXFwvKGpwZ3xqcGVnfHBuZ3xnaWZ8Ym1wKSQvaS5leGVjKCB0aGlzLnR5cGUgKSA/XG4gICAgICAgICAgICAgICAgICAgICAgICBSZWdFeHAuJDEudG9Mb3dlckNhc2UoKSA6ICcnO1xuICAgICAgICAgICAgICAgIHRoaXMubmFtZSArPSAnLicgKyBleHQ7XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAvLyDlpoLmnpzmsqHmnInmjIflrpptaW1ldHlwZSwg5L2G5piv55+l6YGT5paH5Lu25ZCO57yA44CCXG4gICAgICAgICAgICBpZiAoICF0aGlzLnR5cGUgJiYgIH4nanBnLGpwZWcscG5nLGdpZixibXAnLmluZGV4T2YoIGV4dCApICkge1xuICAgICAgICAgICAgICAgIHRoaXMudHlwZSA9ICdpbWFnZS8nICsgKGV4dCA9PT0gJ2pwZycgPyAnanBlZycgOiBleHQpO1xuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgdGhpcy5leHQgPSBleHQ7XG4gICAgICAgICAgICB0aGlzLmxhc3RNb2RpZmllZERhdGUgPSBmaWxlLmxhc3RNb2RpZmllZERhdGUgfHxcbiAgICAgICAgICAgICAgICAgICAgKG5ldyBEYXRlKCkpLnRvTG9jYWxlU3RyaW5nKCk7XG4gICAgICAgIH1cbiAgICBcbiAgICAgICAgcmV0dXJuIEJhc2UuaW5oZXJpdHMoIEJsb2IsIEZpbGUgKTtcbiAgICB9KTtcbiAgICBcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IOmUmeivr+S/oeaBr1xuICAgICAqL1xuICAgIGRlZmluZSgnbGliL2ZpbGVwaWNrZXInLFtcbiAgICAgICAgJ2Jhc2UnLFxuICAgICAgICAncnVudGltZS9jbGllbnQnLFxuICAgICAgICAnbGliL2ZpbGUnXG4gICAgXSwgZnVuY3Rpb24oIEJhc2UsIFJ1bnRpbWVDbGVudCwgRmlsZSApIHtcbiAgICBcbiAgICAgICAgdmFyICQgPSBCYXNlLiQ7XG4gICAgXG4gICAgICAgIGZ1bmN0aW9uIEZpbGVQaWNrZXIoIG9wdHMgKSB7XG4gICAgICAgICAgICBvcHRzID0gdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIEZpbGVQaWNrZXIub3B0aW9ucywgb3B0cyApO1xuICAgIFxuICAgICAgICAgICAgb3B0cy5jb250YWluZXIgPSAkKCBvcHRzLmlkICk7XG4gICAgXG4gICAgICAgICAgICBpZiAoICFvcHRzLmNvbnRhaW5lci5sZW5ndGggKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfmjInpkq7mjIflrprplJnor68nKTtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgIG9wdHMuaW5uZXJIVE1MID0gb3B0cy5pbm5lckhUTUwgfHwgb3B0cy5sYWJlbCB8fFxuICAgICAgICAgICAgICAgICAgICBvcHRzLmNvbnRhaW5lci5odG1sKCkgfHwgJyc7XG4gICAgXG4gICAgICAgICAgICBvcHRzLmJ1dHRvbiA9ICQoIG9wdHMuYnV0dG9uIHx8IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpICk7XG4gICAgICAgICAgICBvcHRzLmJ1dHRvbi5odG1sKCBvcHRzLmlubmVySFRNTCApO1xuICAgICAgICAgICAgb3B0cy5jb250YWluZXIuaHRtbCggb3B0cy5idXR0b24gKTtcbiAgICBcbiAgICAgICAgICAgIFJ1bnRpbWVDbGVudC5jYWxsKCB0aGlzLCAnRmlsZVBpY2tlcicsIHRydWUgKTtcbiAgICAgICAgfVxuICAgIFxuICAgICAgICBGaWxlUGlja2VyLm9wdGlvbnMgPSB7XG4gICAgICAgICAgICBidXR0b246IG51bGwsXG4gICAgICAgICAgICBjb250YWluZXI6IG51bGwsXG4gICAgICAgICAgICBsYWJlbDogbnVsbCxcbiAgICAgICAgICAgIGlubmVySFRNTDogbnVsbCxcbiAgICAgICAgICAgIG11bHRpcGxlOiB0cnVlLFxuICAgICAgICAgICAgYWNjZXB0OiBudWxsLFxuICAgICAgICAgICAgbmFtZTogJ2ZpbGUnXG4gICAgICAgIH07XG4gICAgXG4gICAgICAgIEJhc2UuaW5oZXJpdHMoIFJ1bnRpbWVDbGVudCwge1xuICAgICAgICAgICAgY29uc3RydWN0b3I6IEZpbGVQaWNrZXIsXG4gICAgXG4gICAgICAgICAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWUgPSB0aGlzLFxuICAgICAgICAgICAgICAgICAgICBvcHRzID0gbWUub3B0aW9ucyxcbiAgICAgICAgICAgICAgICAgICAgYnV0dG9uID0gb3B0cy5idXR0b247XG4gICAgXG4gICAgICAgICAgICAgICAgYnV0dG9uLmFkZENsYXNzKCd3ZWJ1cGxvYWRlci1waWNrJyk7XG4gICAgXG4gICAgICAgICAgICAgICAgbWUub24oICdhbGwnLCBmdW5jdGlvbiggdHlwZSApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZpbGVzO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKCB0eXBlICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnbW91c2VlbnRlcic6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnV0dG9uLmFkZENsYXNzKCd3ZWJ1cGxvYWRlci1waWNrLWhvdmVyJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdtb3VzZWxlYXZlJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidXR0b24ucmVtb3ZlQ2xhc3MoJ3dlYnVwbG9hZGVyLXBpY2staG92ZXInKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2NoYW5nZSc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZXMgPSBtZS5leGVjKCdnZXRGaWxlcycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lLnRyaWdnZXIoICdzZWxlY3QnLCAkLm1hcCggZmlsZXMsIGZ1bmN0aW9uKCBmaWxlICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlID0gbmV3IEZpbGUoIG1lLmdldFJ1aWQoKSwgZmlsZSApO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDorrDlvZXmnaXmupDjgIJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZS5fcmVmZXIgPSBvcHRzLmNvbnRhaW5lcjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZpbGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSksIG9wdHMuY29udGFpbmVyICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICBtZS5jb25uZWN0UnVudGltZSggb3B0cywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lLnJlZnJlc2goKTtcbiAgICAgICAgICAgICAgICAgICAgbWUuZXhlYyggJ2luaXQnLCBvcHRzICk7XG4gICAgICAgICAgICAgICAgICAgIG1lLnRyaWdnZXIoJ3JlYWR5Jyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgJCggd2luZG93ICkub24oICdyZXNpemUnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgbWUucmVmcmVzaCgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIHJlZnJlc2g6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBzaGltQ29udGFpbmVyID0gdGhpcy5nZXRSdW50aW1lKCkuZ2V0Q29udGFpbmVyKCksXG4gICAgICAgICAgICAgICAgICAgIGJ1dHRvbiA9IHRoaXMub3B0aW9ucy5idXR0b24sXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoID0gYnV0dG9uLm91dGVyV2lkdGggP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1dHRvbi5vdXRlcldpZHRoKCkgOiBidXR0b24ud2lkdGgoKSxcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ID0gYnV0dG9uLm91dGVySGVpZ2h0ID9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidXR0b24ub3V0ZXJIZWlnaHQoKSA6IGJ1dHRvbi5oZWlnaHQoKSxcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgcG9zID0gYnV0dG9uLm9mZnNldCgpO1xuICAgIFxuICAgICAgICAgICAgICAgIHdpZHRoICYmIGhlaWdodCAmJiBzaGltQ29udGFpbmVyLmNzcyh7XG4gICAgICAgICAgICAgICAgICAgIGJvdHRvbTogJ2F1dG8nLFxuICAgICAgICAgICAgICAgICAgICByaWdodDogJ2F1dG8nLFxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogd2lkdGggKyAncHgnLFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCArICdweCdcbiAgICAgICAgICAgICAgICB9KS5vZmZzZXQoIHBvcyApO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGVuYWJsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIGJ0biA9IHRoaXMub3B0aW9ucy5idXR0b247XG4gICAgXG4gICAgICAgICAgICAgICAgYnRuLnJlbW92ZUNsYXNzKCd3ZWJ1cGxvYWRlci1waWNrLWRpc2FibGUnKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlZnJlc2goKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBkaXNhYmxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgYnRuID0gdGhpcy5vcHRpb25zLmJ1dHRvbjtcbiAgICBcbiAgICAgICAgICAgICAgICB0aGlzLmdldFJ1bnRpbWUoKS5nZXRDb250YWluZXIoKS5jc3Moe1xuICAgICAgICAgICAgICAgICAgICB0b3A6ICctOTk5OTlweCdcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICBidG4uYWRkQ2xhc3MoJ3dlYnVwbG9hZGVyLXBpY2stZGlzYWJsZScpO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmICggdGhpcy5ydW50aW1lICkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmV4ZWMoJ2Rlc3Ryb3knKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNjb25uZWN0UnVudGltZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgXG4gICAgICAgIHJldHVybiBGaWxlUGlja2VyO1xuICAgIH0pO1xuICAgIFxuICAgIC8qKlxuICAgICAqIEBmaWxlT3ZlcnZpZXcg57uE5Lu25Z+657G744CCXG4gICAgICovXG4gICAgZGVmaW5lKCd3aWRnZXRzL3dpZGdldCcsW1xuICAgICAgICAnYmFzZScsXG4gICAgICAgICd1cGxvYWRlcidcbiAgICBdLCBmdW5jdGlvbiggQmFzZSwgVXBsb2FkZXIgKSB7XG4gICAgXG4gICAgICAgIHZhciAkID0gQmFzZS4kLFxuICAgICAgICAgICAgX2luaXQgPSBVcGxvYWRlci5wcm90b3R5cGUuX2luaXQsXG4gICAgICAgICAgICBJR05PUkUgPSB7fSxcbiAgICAgICAgICAgIHdpZGdldENsYXNzID0gW107XG4gICAgXG4gICAgICAgIGZ1bmN0aW9uIGlzQXJyYXlMaWtlKCBvYmogKSB7XG4gICAgICAgICAgICBpZiAoICFvYmogKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgdmFyIGxlbmd0aCA9IG9iai5sZW5ndGgsXG4gICAgICAgICAgICAgICAgdHlwZSA9ICQudHlwZSggb2JqICk7XG4gICAgXG4gICAgICAgICAgICBpZiAoIG9iai5ub2RlVHlwZSA9PT0gMSAmJiBsZW5ndGggKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICByZXR1cm4gdHlwZSA9PT0gJ2FycmF5JyB8fCB0eXBlICE9PSAnZnVuY3Rpb24nICYmIHR5cGUgIT09ICdzdHJpbmcnICYmXG4gICAgICAgICAgICAgICAgICAgIChsZW5ndGggPT09IDAgfHwgdHlwZW9mIGxlbmd0aCA9PT0gJ251bWJlcicgJiYgbGVuZ3RoID4gMCAmJlxuICAgICAgICAgICAgICAgICAgICAobGVuZ3RoIC0gMSkgaW4gb2JqKTtcbiAgICAgICAgfVxuICAgIFxuICAgICAgICBmdW5jdGlvbiBXaWRnZXQoIHVwbG9hZGVyICkge1xuICAgICAgICAgICAgdGhpcy5vd25lciA9IHVwbG9hZGVyO1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zID0gdXBsb2FkZXIub3B0aW9ucztcbiAgICAgICAgfVxuICAgIFxuICAgICAgICAkLmV4dGVuZCggV2lkZ2V0LnByb3RvdHlwZSwge1xuICAgIFxuICAgICAgICAgICAgaW5pdDogQmFzZS5ub29wLFxuICAgIFxuICAgICAgICAgICAgLy8g57G7QmFja2JvbmXnmoTkuovku7bnm5HlkKzlo7DmmI7vvIznm5HlkKx1cGxvYWRlcuWunuS+i+S4iueahOS6i+S7tlxuICAgICAgICAgICAgLy8gd2lkZ2V055u05o6l5peg5rOV55uR5ZCs5LqL5Lu277yM5LqL5Lu25Y+q6IO96YCa6L+HdXBsb2FkZXLmnaXkvKDpgJJcbiAgICAgICAgICAgIGludm9rZTogZnVuY3Rpb24oIGFwaU5hbWUsIGFyZ3MgKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ21ha2UtdGh1bWInOiAnbWFrZVRodW1iJ1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgdmFyIG1hcCA9IHRoaXMucmVzcG9uc2VNYXA7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g5aaC5p6c5pegQVBJ5ZON5bqU5aOw5piO5YiZ5b+955WlXG4gICAgICAgICAgICAgICAgaWYgKCAhbWFwIHx8ICEoYXBpTmFtZSBpbiBtYXApIHx8ICEobWFwWyBhcGlOYW1lIF0gaW4gdGhpcykgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICEkLmlzRnVuY3Rpb24oIHRoaXNbIG1hcFsgYXBpTmFtZSBdIF0gKSApIHtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIElHTk9SRTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNbIG1hcFsgYXBpTmFtZSBdIF0uYXBwbHkoIHRoaXMsIGFyZ3MgKTtcbiAgICBcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOWPkemAgeWRveS7pOOAguW9k+S8oOWFpWBjYWxsYmFja2DmiJbogIVgaGFuZGxlcmDkuK3ov5Tlm55gcHJvbWlzZWDml7bjgILov5Tlm57kuIDkuKrlvZPmiYDmnIlgaGFuZGxlcmDkuK3nmoRwcm9taXNl6YO95a6M5oiQ5ZCO5a6M5oiQ55qE5pawYHByb21pc2Vg44CCXG4gICAgICAgICAgICAgKiBAbWV0aG9kIHJlcXVlc3RcbiAgICAgICAgICAgICAqIEBncmFtbWFyIHJlcXVlc3QoIGNvbW1hbmQsIGFyZ3MgKSA9PiAqIHwgUHJvbWlzZVxuICAgICAgICAgICAgICogQGdyYW1tYXIgcmVxdWVzdCggY29tbWFuZCwgYXJncywgY2FsbGJhY2sgKSA9PiBQcm9taXNlXG4gICAgICAgICAgICAgKiBAZm9yICBVcGxvYWRlclxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICByZXF1ZXN0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5vd25lci5yZXF1ZXN0LmFwcGx5KCB0aGlzLm93bmVyLCBhcmd1bWVudHMgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgXG4gICAgICAgIC8vIOaJqeWxlVVwbG9hZGVyLlxuICAgICAgICAkLmV4dGVuZCggVXBsb2FkZXIucHJvdG90eXBlLCB7XG4gICAgXG4gICAgICAgICAgICAvLyDopoblhplfaW5pdOeUqOadpeWIneWni+WMlndpZGdldHNcbiAgICAgICAgICAgIF9pbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWUgPSB0aGlzLFxuICAgICAgICAgICAgICAgICAgICB3aWRnZXRzID0gbWUuX3dpZGdldHMgPSBbXTtcbiAgICBcbiAgICAgICAgICAgICAgICAkLmVhY2goIHdpZGdldENsYXNzLCBmdW5jdGlvbiggXywga2xhc3MgKSB7XG4gICAgICAgICAgICAgICAgICAgIHdpZGdldHMucHVzaCggbmV3IGtsYXNzKCBtZSApICk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIF9pbml0LmFwcGx5KCBtZSwgYXJndW1lbnRzICk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgcmVxdWVzdDogZnVuY3Rpb24oIGFwaU5hbWUsIGFyZ3MsIGNhbGxiYWNrICkge1xuICAgICAgICAgICAgICAgIHZhciBpID0gMCxcbiAgICAgICAgICAgICAgICAgICAgd2lkZ2V0cyA9IHRoaXMuX3dpZGdldHMsXG4gICAgICAgICAgICAgICAgICAgIGxlbiA9IHdpZGdldHMubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICBybHRzID0gW10sXG4gICAgICAgICAgICAgICAgICAgIGRmZHMgPSBbXSxcbiAgICAgICAgICAgICAgICAgICAgd2lkZ2V0LCBybHQsIHByb21pc2UsIGtleTtcbiAgICBcbiAgICAgICAgICAgICAgICBhcmdzID0gaXNBcnJheUxpa2UoIGFyZ3MgKSA/IGFyZ3MgOiBbIGFyZ3MgXTtcbiAgICBcbiAgICAgICAgICAgICAgICBmb3IgKCA7IGkgPCBsZW47IGkrKyApIHtcbiAgICAgICAgICAgICAgICAgICAgd2lkZ2V0ID0gd2lkZ2V0c1sgaSBdO1xuICAgICAgICAgICAgICAgICAgICBybHQgPSB3aWRnZXQuaW52b2tlKCBhcGlOYW1lLCBhcmdzICk7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGlmICggcmx0ICE9PSBJR05PUkUgKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBEZWZlcnJlZOWvueixoVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBCYXNlLmlzUHJvbWlzZSggcmx0ICkgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGZkcy5wdXNoKCBybHQgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmx0cy5wdXNoKCBybHQgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAvLyDlpoLmnpzmnIljYWxsYmFja++8jOWImeeUqOW8guatpeaWueW8j+OAglxuICAgICAgICAgICAgICAgIGlmICggY2FsbGJhY2sgfHwgZGZkcy5sZW5ndGggKSB7XG4gICAgICAgICAgICAgICAgICAgIHByb21pc2UgPSBCYXNlLndoZW4uYXBwbHkoIEJhc2UsIGRmZHMgKTtcbiAgICAgICAgICAgICAgICAgICAga2V5ID0gcHJvbWlzZS5waXBlID8gJ3BpcGUnIDogJ3RoZW4nO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyDlvojph43opoHkuI3og73liKDpmaTjgILliKDpmaTkuobkvJrmrbvlvqrnjq/jgIJcbiAgICAgICAgICAgICAgICAgICAgLy8g5L+d6K+B5omn6KGM6aG65bqP44CC6K6pY2FsbGJhY2vmgLvmmK/lnKjkuIvkuIDkuKp0aWNr5Lit5omn6KGM44CCXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwcm9taXNlWyBrZXkgXShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRlZmVycmVkID0gQmFzZS5EZWZlcnJlZCgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJncyA9IGFyZ3VtZW50cztcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUuYXBwbHkoIGRlZmVycmVkLCBhcmdzICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIDEgKTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVsga2V5IF0oIGNhbGxiYWNrIHx8IEJhc2Uubm9vcCApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBybHRzWyAwIF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICAqIOa3u+WKoOe7hOS7tlxuICAgICAgICAgKiBAcGFyYW0gIHtvYmplY3R9IHdpZGdldFByb3RvIOe7hOS7tuWOn+Wei++8jOaehOmAoOWHveaVsOmAmui/h2NvbnN0cnVjdG9y5bGe5oCn5a6a5LmJXG4gICAgICAgICAqIEBwYXJhbSAge29iamVjdH0gcmVzcG9uc2VNYXAgQVBJ5ZCN56ew5LiO5Ye95pWw5a6e546w55qE5pig5bCEXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqICAgICBVcGxvYWRlci5yZWdpc3Rlcigge1xuICAgICAgICAgKiAgICAgICAgIGluaXQ6IGZ1bmN0aW9uKCBvcHRpb25zICkge30sXG4gICAgICAgICAqICAgICAgICAgbWFrZVRodW1iOiBmdW5jdGlvbigpIHt9XG4gICAgICAgICAqICAgICB9LCB7XG4gICAgICAgICAqICAgICAgICAgJ21ha2UtdGh1bWInOiAnbWFrZVRodW1iJ1xuICAgICAgICAgKiAgICAgfSApO1xuICAgICAgICAgKi9cbiAgICAgICAgVXBsb2FkZXIucmVnaXN0ZXIgPSBXaWRnZXQucmVnaXN0ZXIgPSBmdW5jdGlvbiggcmVzcG9uc2VNYXAsIHdpZGdldFByb3RvICkge1xuICAgICAgICAgICAgdmFyIG1hcCA9IHsgaW5pdDogJ2luaXQnIH0sXG4gICAgICAgICAgICAgICAga2xhc3M7XG4gICAgXG4gICAgICAgICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT09IDEgKSB7XG4gICAgICAgICAgICAgICAgd2lkZ2V0UHJvdG8gPSByZXNwb25zZU1hcDtcbiAgICAgICAgICAgICAgICB3aWRnZXRQcm90by5yZXNwb25zZU1hcCA9IG1hcDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgd2lkZ2V0UHJvdG8ucmVzcG9uc2VNYXAgPSAkLmV4dGVuZCggbWFwLCByZXNwb25zZU1hcCApO1xuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAga2xhc3MgPSBCYXNlLmluaGVyaXRzKCBXaWRnZXQsIHdpZGdldFByb3RvICk7XG4gICAgICAgICAgICB3aWRnZXRDbGFzcy5wdXNoKCBrbGFzcyApO1xuICAgIFxuICAgICAgICAgICAgcmV0dXJuIGtsYXNzO1xuICAgICAgICB9O1xuICAgIFxuICAgICAgICByZXR1cm4gV2lkZ2V0O1xuICAgIH0pO1xuICAgIC8qKlxuICAgICAqIEBmaWxlT3ZlcnZpZXcg5paH5Lu26YCJ5oup55u45YWzXG4gICAgICovXG4gICAgZGVmaW5lKCd3aWRnZXRzL2ZpbGVwaWNrZXInLFtcbiAgICAgICAgJ2Jhc2UnLFxuICAgICAgICAndXBsb2FkZXInLFxuICAgICAgICAnbGliL2ZpbGVwaWNrZXInLFxuICAgICAgICAnd2lkZ2V0cy93aWRnZXQnXG4gICAgXSwgZnVuY3Rpb24oIEJhc2UsIFVwbG9hZGVyLCBGaWxlUGlja2VyICkge1xuICAgICAgICB2YXIgJCA9IEJhc2UuJDtcbiAgICBcbiAgICAgICAgJC5leHRlbmQoIFVwbG9hZGVyLm9wdGlvbnMsIHtcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQHByb3BlcnR5IHtTZWxlY3RvciB8IE9iamVjdH0gW3BpY2s9dW5kZWZpbmVkXVxuICAgICAgICAgICAgICogQG5hbWVzcGFjZSBvcHRpb25zXG4gICAgICAgICAgICAgKiBAZm9yIFVwbG9hZGVyXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24g5oyH5a6a6YCJ5oup5paH5Lu255qE5oyJ6ZKu5a655Zmo77yM5LiN5oyH5a6a5YiZ5LiN5Yib5bu65oyJ6ZKu44CCXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogKiBgaWRgIHtTZWxldG9yfSDmjIflrprpgInmi6nmlofku7bnmoTmjInpkq7lrrnlmajvvIzkuI3mjIflrprliJnkuI3liJvlu7rmjInpkq7jgIJcbiAgICAgICAgICAgICAqICogYGxhYmVsYCB7U3RyaW5nfSDor7fph4fnlKggYGlubmVySFRNTGAg5Luj5pu/XG4gICAgICAgICAgICAgKiAqIGBpbm5lckhUTUxgIHtTdHJpbmd9IOaMh+WumuaMiemSruaWh+Wtl+OAguS4jeaMh+WumuaXtuS8mOWFiOS7juaMh+WumueahOWuueWZqOS4reeci+aYr+WQpuiHquW4puaWh+Wtl+OAglxuICAgICAgICAgICAgICogKiBgbXVsdGlwbGVgIHtCb29sZWFufSDmmK/lkKblvIDotbflkIzml7bpgInmi6nlpJrkuKrmlofku7bog73lipvjgIJcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgcGljazogbnVsbCxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQHByb3BlcnR5IHtBcnJveX0gW2FjY2VwdD1udWxsXVxuICAgICAgICAgICAgICogQG5hbWVzcGFjZSBvcHRpb25zXG4gICAgICAgICAgICAgKiBAZm9yIFVwbG9hZGVyXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24g5oyH5a6a5o6l5Y+X5ZOq5Lqb57G75Z6L55qE5paH5Lu244CCIOeUseS6juebruWJjei/mOaciWV4dOi9rG1pbWVUeXBl6KGo77yM5omA5Lul6L+Z6YeM6ZyA6KaB5YiG5byA5oyH5a6a44CCXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogKiBgdGl0bGVgIHtTdHJpbmd9IOaWh+Wtl+aPj+i/sFxuICAgICAgICAgICAgICogKiBgZXh0ZW5zaW9uc2Age1N0cmluZ30g5YWB6K6455qE5paH5Lu25ZCO57yA77yM5LiN5bim54K577yM5aSa5Liq55So6YCX5Y+35YiG5Ymy44CCXG4gICAgICAgICAgICAgKiAqIGBtaW1lVHlwZXNgIHtTdHJpbmd9IOWkmuS4queUqOmAl+WPt+WIhuWJsuOAglxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIOWmgu+8mlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIGBgYFxuICAgICAgICAgICAgICoge1xuICAgICAgICAgICAgICogICAgIHRpdGxlOiAnSW1hZ2VzJyxcbiAgICAgICAgICAgICAqICAgICBleHRlbnNpb25zOiAnZ2lmLGpwZyxqcGVnLGJtcCxwbmcnLFxuICAgICAgICAgICAgICogICAgIG1pbWVUeXBlczogJ2ltYWdlLyonXG4gICAgICAgICAgICAgKiB9XG4gICAgICAgICAgICAgKiBgYGBcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgYWNjZXB0OiBudWxsLyp7XG4gICAgICAgICAgICAgICAgdGl0bGU6ICdJbWFnZXMnLFxuICAgICAgICAgICAgICAgIGV4dGVuc2lvbnM6ICdnaWYsanBnLGpwZWcsYm1wLHBuZycsXG4gICAgICAgICAgICAgICAgbWltZVR5cGVzOiAnaW1hZ2UvKidcbiAgICAgICAgICAgIH0qL1xuICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgcmV0dXJuIFVwbG9hZGVyLnJlZ2lzdGVyKHtcbiAgICAgICAgICAgICdhZGQtYnRuJzogJ2FkZEJ1dHRvbicsXG4gICAgICAgICAgICByZWZyZXNoOiAncmVmcmVzaCcsXG4gICAgICAgICAgICBkaXNhYmxlOiAnZGlzYWJsZScsXG4gICAgICAgICAgICBlbmFibGU6ICdlbmFibGUnXG4gICAgICAgIH0sIHtcbiAgICBcbiAgICAgICAgICAgIGluaXQ6IGZ1bmN0aW9uKCBvcHRzICkge1xuICAgICAgICAgICAgICAgIHRoaXMucGlja2VycyA9IFtdO1xuICAgICAgICAgICAgICAgIHJldHVybiBvcHRzLnBpY2sgJiYgdGhpcy5hZGRCdXR0b24oIG9wdHMucGljayApO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIHJlZnJlc2g6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICQuZWFjaCggdGhpcy5waWNrZXJzLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZWZyZXNoKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAbWV0aG9kIGFkZEJ1dHRvblxuICAgICAgICAgICAgICogQGZvciBVcGxvYWRlclxuICAgICAgICAgICAgICogQGdyYW1tYXIgYWRkQnV0dG9uKCBwaWNrICkgPT4gUHJvbWlzZVxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uXG4gICAgICAgICAgICAgKiDmt7vliqDmlofku7bpgInmi6nmjInpkq7vvIzlpoLmnpzkuIDkuKrmjInpkq7kuI3lpJ/vvIzpnIDopoHosIPnlKjmraTmlrnms5XmnaXmt7vliqDjgILlj4LmlbDot59bb3B0aW9ucy5waWNrXSgjV2ViVXBsb2FkZXI6VXBsb2FkZXI6b3B0aW9ucynkuIDoh7TjgIJcbiAgICAgICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAgICAgKiB1cGxvYWRlci5hZGRCdXR0b24oe1xuICAgICAgICAgICAgICogICAgIGlkOiAnI2J0bkNvbnRhaW5lcicsXG4gICAgICAgICAgICAgKiAgICAgaW5uZXJIVE1MOiAn6YCJ5oup5paH5Lu2J1xuICAgICAgICAgICAgICogfSk7XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGFkZEJ1dHRvbjogZnVuY3Rpb24oIHBpY2sgKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgb3B0cyA9IG1lLm9wdGlvbnMsXG4gICAgICAgICAgICAgICAgICAgIGFjY2VwdCA9IG9wdHMuYWNjZXB0LFxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLCBwaWNrZXIsIGRlZmVycmVkO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggIXBpY2sgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgZGVmZXJyZWQgPSBCYXNlLkRlZmVycmVkKCk7XG4gICAgICAgICAgICAgICAgJC5pc1BsYWluT2JqZWN0KCBwaWNrICkgfHwgKHBpY2sgPSB7XG4gICAgICAgICAgICAgICAgICAgIGlkOiBwaWNrXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBwaWNrLCB7XG4gICAgICAgICAgICAgICAgICAgIGFjY2VwdDogJC5pc1BsYWluT2JqZWN0KCBhY2NlcHQgKSA/IFsgYWNjZXB0IF0gOiBhY2NlcHQsXG4gICAgICAgICAgICAgICAgICAgIHN3Zjogb3B0cy5zd2YsXG4gICAgICAgICAgICAgICAgICAgIHJ1bnRpbWVPcmRlcjogb3B0cy5ydW50aW1lT3JkZXJcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICBwaWNrZXIgPSBuZXcgRmlsZVBpY2tlciggb3B0aW9ucyApO1xuICAgIFxuICAgICAgICAgICAgICAgIHBpY2tlci5vbmNlKCAncmVhZHknLCBkZWZlcnJlZC5yZXNvbHZlICk7XG4gICAgICAgICAgICAgICAgcGlja2VyLm9uKCAnc2VsZWN0JywgZnVuY3Rpb24oIGZpbGVzICkge1xuICAgICAgICAgICAgICAgICAgICBtZS5vd25lci5yZXF1ZXN0KCAnYWRkLWZpbGUnLCBbIGZpbGVzIF0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHBpY2tlci5pbml0KCk7XG4gICAgXG4gICAgICAgICAgICAgICAgdGhpcy5waWNrZXJzLnB1c2goIHBpY2tlciApO1xuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlKCk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgZGlzYWJsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgJC5lYWNoKCB0aGlzLnBpY2tlcnMsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc2FibGUoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBlbmFibGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICQuZWFjaCggdGhpcy5waWNrZXJzLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbmFibGUoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgLyoqXG4gICAgICogQGZpbGVPdmVydmlldyBJbWFnZVxuICAgICAqL1xuICAgIGRlZmluZSgnbGliL2ltYWdlJyxbXG4gICAgICAgICdiYXNlJyxcbiAgICAgICAgJ3J1bnRpbWUvY2xpZW50JyxcbiAgICAgICAgJ2xpYi9ibG9iJ1xuICAgIF0sIGZ1bmN0aW9uKCBCYXNlLCBSdW50aW1lQ2xpZW50LCBCbG9iICkge1xuICAgICAgICB2YXIgJCA9IEJhc2UuJDtcbiAgICBcbiAgICAgICAgLy8g5p6E6YCg5Zmo44CCXG4gICAgICAgIGZ1bmN0aW9uIEltYWdlKCBvcHRzICkge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIEltYWdlLm9wdGlvbnMsIG9wdHMgKTtcbiAgICAgICAgICAgIFJ1bnRpbWVDbGllbnQuY2FsbCggdGhpcywgJ0ltYWdlJyApO1xuICAgIFxuICAgICAgICAgICAgdGhpcy5vbiggJ2xvYWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9pbmZvID0gdGhpcy5leGVjKCdpbmZvJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5fbWV0YSA9IHRoaXMuZXhlYygnbWV0YScpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICBcbiAgICAgICAgLy8g6buY6K6k6YCJ6aG544CCXG4gICAgICAgIEltYWdlLm9wdGlvbnMgPSB7XG4gICAgXG4gICAgICAgICAgICAvLyDpu5jorqTnmoTlm77niYflpITnkIbotKjph49cbiAgICAgICAgICAgIHF1YWxpdHk6IDkwLFxuICAgIFxuICAgICAgICAgICAgLy8g5piv5ZCm6KOB5YmqXG4gICAgICAgICAgICBjcm9wOiBmYWxzZSxcbiAgICBcbiAgICAgICAgICAgIC8vIOaYr+WQpuS/neeVmeWktOmDqOS/oeaBr1xuICAgICAgICAgICAgcHJlc2VydmVIZWFkZXJzOiB0cnVlLFxuICAgIFxuICAgICAgICAgICAgLy8g5piv5ZCm5YWB6K645pS+5aSn44CCXG4gICAgICAgICAgICBhbGxvd01hZ25pZnk6IHRydWVcbiAgICAgICAgfTtcbiAgICBcbiAgICAgICAgLy8g57un5om/UnVudGltZUNsaWVudC5cbiAgICAgICAgQmFzZS5pbmhlcml0cyggUnVudGltZUNsaWVudCwge1xuICAgICAgICAgICAgY29uc3RydWN0b3I6IEltYWdlLFxuICAgIFxuICAgICAgICAgICAgaW5mbzogZnVuY3Rpb24oIHZhbCApIHtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyBzZXR0ZXJcbiAgICAgICAgICAgICAgICBpZiAoIHZhbCApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5faW5mbyA9IHZhbDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIC8vIGdldHRlclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9pbmZvO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIG1ldGE6IGZ1bmN0aW9uKCB2YWwgKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8gc2V0dGVyXG4gICAgICAgICAgICAgICAgaWYgKCB2YWwgKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX21ldGEgPSB2YWw7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAvLyBnZXR0ZXJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fbWV0YTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBsb2FkRnJvbUJsb2I6IGZ1bmN0aW9uKCBibG9iICkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIHJ1aWQgPSBibG9iLmdldFJ1aWQoKTtcbiAgICBcbiAgICAgICAgICAgICAgICB0aGlzLmNvbm5lY3RSdW50aW1lKCBydWlkLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgbWUuZXhlYyggJ2luaXQnLCBtZS5vcHRpb25zICk7XG4gICAgICAgICAgICAgICAgICAgIG1lLmV4ZWMoICdsb2FkRnJvbUJsb2InLCBibG9iICk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgcmVzaXplOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgYXJncyA9IEJhc2Uuc2xpY2UoIGFyZ3VtZW50cyApO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmV4ZWMuYXBwbHkoIHRoaXMsIFsgJ3Jlc2l6ZScgXS5jb25jYXQoIGFyZ3MgKSApO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGdldEFzRGF0YVVybDogZnVuY3Rpb24oIHR5cGUgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZXhlYyggJ2dldEFzRGF0YVVybCcsIHR5cGUgKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBnZXRBc0Jsb2I6IGZ1bmN0aW9uKCB0eXBlICkge1xuICAgICAgICAgICAgICAgIHZhciBibG9iID0gdGhpcy5leGVjKCAnZ2V0QXNCbG9iJywgdHlwZSApO1xuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQmxvYiggdGhpcy5nZXRSdWlkKCksIGJsb2IgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgXG4gICAgICAgIHJldHVybiBJbWFnZTtcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IOWbvueJh+aTjeS9nCwg6LSf6LSj6aKE6KeI5Zu+54mH5ZKM5LiK5Lyg5YmN5Y6L57yp5Zu+54mHXG4gICAgICovXG4gICAgZGVmaW5lKCd3aWRnZXRzL2ltYWdlJyxbXG4gICAgICAgICdiYXNlJyxcbiAgICAgICAgJ3VwbG9hZGVyJyxcbiAgICAgICAgJ2xpYi9pbWFnZScsXG4gICAgICAgICd3aWRnZXRzL3dpZGdldCdcbiAgICBdLCBmdW5jdGlvbiggQmFzZSwgVXBsb2FkZXIsIEltYWdlICkge1xuICAgIFxuICAgICAgICB2YXIgJCA9IEJhc2UuJCxcbiAgICAgICAgICAgIHRocm90dGxlO1xuICAgIFxuICAgICAgICAvLyDmoLnmja7opoHlpITnkIbnmoTmlofku7blpKflsI/mnaXoioLmtYHvvIzkuIDmrKHkuI3og73lpITnkIblpKrlpJrvvIzkvJrljaHjgIJcbiAgICAgICAgdGhyb3R0bGUgPSAoZnVuY3Rpb24oIG1heCApIHtcbiAgICAgICAgICAgIHZhciBvY2N1cGllZCA9IDAsXG4gICAgICAgICAgICAgICAgd2FpdGluZyA9IFtdLFxuICAgICAgICAgICAgICAgIHRpY2sgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGl0ZW07XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlICggd2FpdGluZy5sZW5ndGggJiYgb2NjdXBpZWQgPCBtYXggKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtID0gd2FpdGluZy5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgb2NjdXBpZWQgKz0gaXRlbVsgMCBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbVsgMSBdKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCBlbWl0ZXIsIHNpemUsIGNiICkge1xuICAgICAgICAgICAgICAgIHdhaXRpbmcucHVzaChbIHNpemUsIGNiIF0pO1xuICAgICAgICAgICAgICAgIGVtaXRlci5vbmNlKCAnZGVzdHJveScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBvY2N1cGllZCAtPSBzaXplO1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCB0aWNrLCAxICk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCggdGljaywgMSApO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSkoIDUgKiAxMDI0ICogMTAyNCApO1xuICAgIFxuICAgICAgICAkLmV4dGVuZCggVXBsb2FkZXIub3B0aW9ucywge1xuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkge09iamVjdH0gW3RodW1iXVxuICAgICAgICAgICAgICogQG5hbWVzcGFjZSBvcHRpb25zXG4gICAgICAgICAgICAgKiBAZm9yIFVwbG9hZGVyXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24g6YWN572u55Sf5oiQ57yp55Wl5Zu+55qE6YCJ6aG544CCXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICog6buY6K6k5Li677yaXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogYGBgamF2YXNjcmlwdFxuICAgICAgICAgICAgICoge1xuICAgICAgICAgICAgICogICAgIHdpZHRoOiAxMTAsXG4gICAgICAgICAgICAgKiAgICAgaGVpZ2h0OiAxMTAsXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogICAgIC8vIOWbvueJh+i0qOmHj++8jOWPquaciXR5cGXkuLpgaW1hZ2UvanBlZ2DnmoTml7blgJnmiY3mnInmlYjjgIJcbiAgICAgICAgICAgICAqICAgICBxdWFsaXR5OiA3MCxcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiAgICAgLy8g5piv5ZCm5YWB6K645pS+5aSn77yM5aaC5p6c5oOz6KaB55Sf5oiQ5bCP5Zu+55qE5pe25YCZ5LiN5aSx55yf77yM5q2k6YCJ6aG55bqU6K+l6K6+572u5Li6ZmFsc2UuXG4gICAgICAgICAgICAgKiAgICAgYWxsb3dNYWduaWZ5OiB0cnVlLFxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqICAgICAvLyDmmK/lkKblhYHorrjoo4HliarjgIJcbiAgICAgICAgICAgICAqICAgICBjcm9wOiB0cnVlLFxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqICAgICAvLyDmmK/lkKbkv53nlZnlpLTpg6htZXRh5L+h5oGv44CCXG4gICAgICAgICAgICAgKiAgICAgcHJlc2VydmVIZWFkZXJzOiBmYWxzZSxcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiAgICAgLy8g5Li656m655qE6K+d5YiZ5L+d55WZ5Y6f5pyJ5Zu+54mH5qC85byP44CCXG4gICAgICAgICAgICAgKiAgICAgLy8g5ZCm5YiZ5by65Yi26L2s5o2i5oiQ5oyH5a6a55qE57G75Z6L44CCXG4gICAgICAgICAgICAgKiAgICAgdHlwZTogJ2ltYWdlL2pwZWcnXG4gICAgICAgICAgICAgKiB9XG4gICAgICAgICAgICAgKiBgYGBcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdGh1bWI6IHtcbiAgICAgICAgICAgICAgICB3aWR0aDogMTEwLFxuICAgICAgICAgICAgICAgIGhlaWdodDogMTEwLFxuICAgICAgICAgICAgICAgIHF1YWxpdHk6IDcwLFxuICAgICAgICAgICAgICAgIGFsbG93TWFnbmlmeTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjcm9wOiB0cnVlLFxuICAgICAgICAgICAgICAgIHByZXNlcnZlSGVhZGVyczogZmFsc2UsXG4gICAgXG4gICAgICAgICAgICAgICAgLy8g5Li656m655qE6K+d5YiZ5L+d55WZ5Y6f5pyJ5Zu+54mH5qC85byP44CCXG4gICAgICAgICAgICAgICAgLy8g5ZCm5YiZ5by65Yi26L2s5o2i5oiQ5oyH5a6a55qE57G75Z6L44CCXG4gICAgICAgICAgICAgICAgLy8gSUUgOOS4i+mdoiBiYXNlNjQg5aSn5bCP5LiN6IO96LaF6L+HIDMySyDlkKbliJnpooTop4jlpLHotKXvvIzogIzpnZ4ganBlZyDnvJbnoIHnmoTlm77niYflvojlj69cbiAgICAgICAgICAgICAgICAvLyDog73kvJrotoXov4cgMzJrLCDmiYDku6Xov5nph4zorr7nva7miJDpooTop4jnmoTml7blgJnpg73mmK8gaW1hZ2UvanBlZ1xuICAgICAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9qcGVnJ1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQHByb3BlcnR5IHtPYmplY3R9IFtjb21wcmVzc11cbiAgICAgICAgICAgICAqIEBuYW1lc3BhY2Ugb3B0aW9uc1xuICAgICAgICAgICAgICogQGZvciBVcGxvYWRlclxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIOmFjee9ruWOi+e8qeeahOWbvueJh+eahOmAiemhueOAguWmguaenOatpOmAiemhueS4umBmYWxzZWAsIOWImeWbvueJh+WcqOS4iuS8oOWJjeS4jei/m+ihjOWOi+e8qeOAglxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIOm7mOiupOS4uu+8mlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIGBgYGphdmFzY3JpcHRcbiAgICAgICAgICAgICAqIHtcbiAgICAgICAgICAgICAqICAgICB3aWR0aDogMTYwMCxcbiAgICAgICAgICAgICAqICAgICBoZWlnaHQ6IDE2MDAsXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogICAgIC8vIOWbvueJh+i0qOmHj++8jOWPquaciXR5cGXkuLpgaW1hZ2UvanBlZ2DnmoTml7blgJnmiY3mnInmlYjjgIJcbiAgICAgICAgICAgICAqICAgICBxdWFsaXR5OiA5MCxcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiAgICAgLy8g5piv5ZCm5YWB6K645pS+5aSn77yM5aaC5p6c5oOz6KaB55Sf5oiQ5bCP5Zu+55qE5pe25YCZ5LiN5aSx55yf77yM5q2k6YCJ6aG55bqU6K+l6K6+572u5Li6ZmFsc2UuXG4gICAgICAgICAgICAgKiAgICAgYWxsb3dNYWduaWZ5OiBmYWxzZSxcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiAgICAgLy8g5piv5ZCm5YWB6K646KOB5Ymq44CCXG4gICAgICAgICAgICAgKiAgICAgY3JvcDogZmFsc2UsXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogICAgIC8vIOaYr+WQpuS/neeVmeWktOmDqG1ldGHkv6Hmga/jgIJcbiAgICAgICAgICAgICAqICAgICBwcmVzZXJ2ZUhlYWRlcnM6IHRydWVcbiAgICAgICAgICAgICAqIH1cbiAgICAgICAgICAgICAqIGBgYFxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBjb21wcmVzczoge1xuICAgICAgICAgICAgICAgIHdpZHRoOiAxNjAwLFxuICAgICAgICAgICAgICAgIGhlaWdodDogMTYwMCxcbiAgICAgICAgICAgICAgICBxdWFsaXR5OiA5MCxcbiAgICAgICAgICAgICAgICBhbGxvd01hZ25pZnk6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGNyb3A6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHByZXNlcnZlSGVhZGVyczogdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgcmV0dXJuIFVwbG9hZGVyLnJlZ2lzdGVyKHtcbiAgICAgICAgICAgICdtYWtlLXRodW1iJzogJ21ha2VUaHVtYicsXG4gICAgICAgICAgICAnYmVmb3JlLXNlbmQtZmlsZSc6ICdjb21wcmVzc0ltYWdlJ1xuICAgICAgICB9LCB7XG4gICAgXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOeUn+aIkOe8qeeVpeWbvu+8jOatpOi/h+eoi+S4uuW8guatpe+8jOaJgOS7pemcgOimgeS8oOWFpWBjYWxsYmFja2DjgIJcbiAgICAgICAgICAgICAqIOmAmuW4uOaDheWGteWcqOWbvueJh+WKoOWFpemYn+mHjOWQjuiwg+eUqOatpOaWueazleadpeeUn+aIkOmihOiniOWbvuS7peWinuW8uuS6pOS6kuaViOaenOOAglxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIGBjYWxsYmFja2DkuK3lj6/ku6XmjqXmlLbliLDkuKTkuKrlj4LmlbDjgIJcbiAgICAgICAgICAgICAqICog56ys5LiA5Liq5Li6ZXJyb3LvvIzlpoLmnpznlJ/miJDnvKnnlaXlm77mnInplJnor6/vvIzmraRlcnJvcuWwhuS4uuecn+OAglxuICAgICAgICAgICAgICogKiDnrKzkuozkuKrkuLpyZXQsIOe8qeeVpeWbvueahERhdGEgVVJM5YC844CCXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogKirms6jmhI8qKlxuICAgICAgICAgICAgICogRGF0ZSBVUkzlnKhJRTYvN+S4reS4jeaUr+aMge+8jOaJgOS7peS4jeeUqOiwg+eUqOatpOaWueazleS6hu+8jOebtOaOpeaYvuekuuS4gOW8oOaaguS4jeaUr+aMgemihOiniOWbvueJh+WlveS6huOAglxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAbWV0aG9kIG1ha2VUaHVtYlxuICAgICAgICAgICAgICogQGdyYW1tYXIgbWFrZVRodW1iKCBmaWxlLCBjYWxsYmFjayApID0+IHVuZGVmaW5lZFxuICAgICAgICAgICAgICogQGdyYW1tYXIgbWFrZVRodW1iKCBmaWxlLCBjYWxsYmFjaywgd2lkdGgsIGhlaWdodCApID0+IHVuZGVmaW5lZFxuICAgICAgICAgICAgICogQGZvciBVcGxvYWRlclxuICAgICAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiB1cGxvYWRlci5vbiggJ2ZpbGVRdWV1ZWQnLCBmdW5jdGlvbiggZmlsZSApIHtcbiAgICAgICAgICAgICAqICAgICB2YXIgJGxpID0gLi4uO1xuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqICAgICB1cGxvYWRlci5tYWtlVGh1bWIoIGZpbGUsIGZ1bmN0aW9uKCBlcnJvciwgcmV0ICkge1xuICAgICAgICAgICAgICogICAgICAgICBpZiAoIGVycm9yICkge1xuICAgICAgICAgICAgICogICAgICAgICAgICAgJGxpLnRleHQoJ+mihOiniOmUmeivrycpO1xuICAgICAgICAgICAgICogICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICogICAgICAgICAgICAgJGxpLmFwcGVuZCgnPGltZyBhbHQ9XCJcIiBzcmM9XCInICsgcmV0ICsgJ1wiIC8+Jyk7XG4gICAgICAgICAgICAgKiAgICAgICAgIH1cbiAgICAgICAgICAgICAqICAgICB9KTtcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiB9KTtcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgbWFrZVRodW1iOiBmdW5jdGlvbiggZmlsZSwgY2IsIHdpZHRoLCBoZWlnaHQgKSB7XG4gICAgICAgICAgICAgICAgdmFyIG9wdHMsIGltYWdlO1xuICAgIFxuICAgICAgICAgICAgICAgIGZpbGUgPSB0aGlzLnJlcXVlc3QoICdnZXQtZmlsZScsIGZpbGUgKTtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDlj6rpooTop4jlm77niYfmoLzlvI/jgIJcbiAgICAgICAgICAgICAgICBpZiAoICFmaWxlLnR5cGUubWF0Y2goIC9eaW1hZ2UvICkgKSB7XG4gICAgICAgICAgICAgICAgICAgIGNiKCB0cnVlICk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgb3B0cyA9ICQuZXh0ZW5kKHt9LCB0aGlzLm9wdGlvbnMudGh1bWIgKTtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDlpoLmnpzkvKDlhaXnmoTmmK9vYmplY3QuXG4gICAgICAgICAgICAgICAgaWYgKCAkLmlzUGxhaW5PYmplY3QoIHdpZHRoICkgKSB7XG4gICAgICAgICAgICAgICAgICAgIG9wdHMgPSAkLmV4dGVuZCggb3B0cywgd2lkdGggKTtcbiAgICAgICAgICAgICAgICAgICAgd2lkdGggPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICB3aWR0aCA9IHdpZHRoIHx8IG9wdHMud2lkdGg7XG4gICAgICAgICAgICAgICAgaGVpZ2h0ID0gaGVpZ2h0IHx8IG9wdHMuaGVpZ2h0O1xuICAgIFxuICAgICAgICAgICAgICAgIGltYWdlID0gbmV3IEltYWdlKCBvcHRzICk7XG4gICAgXG4gICAgICAgICAgICAgICAgaW1hZ2Uub25jZSggJ2xvYWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsZS5faW5mbyA9IGZpbGUuX2luZm8gfHwgaW1hZ2UuaW5mbygpO1xuICAgICAgICAgICAgICAgICAgICBmaWxlLl9tZXRhID0gZmlsZS5fbWV0YSB8fCBpbWFnZS5tZXRhKCk7XG4gICAgICAgICAgICAgICAgICAgIGltYWdlLnJlc2l6ZSggd2lkdGgsIGhlaWdodCApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIGltYWdlLm9uY2UoICdjb21wbGV0ZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBjYiggZmFsc2UsIGltYWdlLmdldEFzRGF0YVVybCggb3B0cy50eXBlICkgKTtcbiAgICAgICAgICAgICAgICAgICAgaW1hZ2UuZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIGltYWdlLm9uY2UoICdlcnJvcicsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBjYiggdHJ1ZSApO1xuICAgICAgICAgICAgICAgICAgICBpbWFnZS5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgdGhyb3R0bGUoIGltYWdlLCBmaWxlLnNvdXJjZS5zaXplLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsZS5faW5mbyAmJiBpbWFnZS5pbmZvKCBmaWxlLl9pbmZvICk7XG4gICAgICAgICAgICAgICAgICAgIGZpbGUuX21ldGEgJiYgaW1hZ2UubWV0YSggZmlsZS5fbWV0YSApO1xuICAgICAgICAgICAgICAgICAgICBpbWFnZS5sb2FkRnJvbUJsb2IoIGZpbGUuc291cmNlICk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgY29tcHJlc3NJbWFnZTogZnVuY3Rpb24oIGZpbGUgKSB7XG4gICAgICAgICAgICAgICAgdmFyIG9wdHMgPSB0aGlzLm9wdGlvbnMuY29tcHJlc3MgfHwgdGhpcy5vcHRpb25zLnJlc2l6ZSxcbiAgICAgICAgICAgICAgICAgICAgY29tcHJlc3NTaXplID0gb3B0cyAmJiBvcHRzLmNvbXByZXNzU2l6ZSB8fCAzMDAgKiAxMDI0LFxuICAgICAgICAgICAgICAgICAgICBpbWFnZSwgZGVmZXJyZWQ7XG4gICAgXG4gICAgICAgICAgICAgICAgZmlsZSA9IHRoaXMucmVxdWVzdCggJ2dldC1maWxlJywgZmlsZSApO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIOWPqumihOiniOWbvueJh+agvOW8j+OAglxuICAgICAgICAgICAgICAgIGlmICggIW9wdHMgfHwgIX4naW1hZ2UvanBlZyxpbWFnZS9qcGcnLmluZGV4T2YoIGZpbGUudHlwZSApIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlLnNpemUgPCBjb21wcmVzc1NpemUgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUuX2NvbXByZXNzZWQgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgb3B0cyA9ICQuZXh0ZW5kKHt9LCBvcHRzICk7XG4gICAgICAgICAgICAgICAgZGVmZXJyZWQgPSBCYXNlLkRlZmVycmVkKCk7XG4gICAgXG4gICAgICAgICAgICAgICAgaW1hZ2UgPSBuZXcgSW1hZ2UoIG9wdHMgKTtcbiAgICBcbiAgICAgICAgICAgICAgICBkZWZlcnJlZC5hbHdheXMoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGltYWdlLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAgICAgaW1hZ2UgPSBudWxsO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGltYWdlLm9uY2UoICdlcnJvcicsIGRlZmVycmVkLnJlamVjdCApO1xuICAgICAgICAgICAgICAgIGltYWdlLm9uY2UoICdsb2FkJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbGUuX2luZm8gPSBmaWxlLl9pbmZvIHx8IGltYWdlLmluZm8oKTtcbiAgICAgICAgICAgICAgICAgICAgZmlsZS5fbWV0YSA9IGZpbGUuX21ldGEgfHwgaW1hZ2UubWV0YSgpO1xuICAgICAgICAgICAgICAgICAgICBpbWFnZS5yZXNpemUoIG9wdHMud2lkdGgsIG9wdHMuaGVpZ2h0ICk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgaW1hZ2Uub25jZSggJ2NvbXBsZXRlJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBibG9iLCBzaXplO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyDnp7vliqjnq68gVUMgLyBxcSDmtY/op4jlmajnmoTml6Dlm77mqKHlvI/kuItcbiAgICAgICAgICAgICAgICAgICAgLy8gY3R4LmdldEltYWdlRGF0YSDlpITnkIblpKflm77nmoTml7blgJnkvJrmiqUgRXhjZXB0aW9uXG4gICAgICAgICAgICAgICAgICAgIC8vIElOREVYX1NJWkVfRVJSOiBET00gRXhjZXB0aW9uIDFcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJsb2IgPSBpbWFnZS5nZXRBc0Jsb2IoIG9wdHMudHlwZSApO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZSA9IGZpbGUuc2l6ZTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOWmguaenOWOi+e8qeWQju+8jOavlOWOn+adpei/mOWkp+WImeS4jeeUqOWOi+e8qeWQjueahOOAglxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBibG9iLnNpemUgPCBzaXplICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZpbGUuc291cmNlLmRlc3Ryb3kgJiYgZmlsZS5zb3VyY2UuZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUuc291cmNlID0gYmxvYjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlLnNpemUgPSBibG9iLnNpemU7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZS50cmlnZ2VyKCAncmVzaXplJywgYmxvYi5zaXplLCBzaXplICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDmoIforrDvvIzpgb/lhY3ph43lpI3ljovnvKnjgIJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUuX2NvbXByZXNzZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoICggZSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOWHuumUmeS6huebtOaOpee7p+e7re+8jOiuqeWFtuS4iuS8oOWOn+Wni+WbvueJh1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgZmlsZS5faW5mbyAmJiBpbWFnZS5pbmZvKCBmaWxlLl9pbmZvICk7XG4gICAgICAgICAgICAgICAgZmlsZS5fbWV0YSAmJiBpbWFnZS5tZXRhKCBmaWxlLl9tZXRhICk7XG4gICAgXG4gICAgICAgICAgICAgICAgaW1hZ2UubG9hZEZyb21CbG9iKCBmaWxlLnNvdXJjZSApO1xuICAgICAgICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIC8qKlxuICAgICAqIEBmaWxlT3ZlcnZpZXcg5paH5Lu25bGe5oCn5bCB6KOFXG4gICAgICovXG4gICAgZGVmaW5lKCdmaWxlJyxbXG4gICAgICAgICdiYXNlJyxcbiAgICAgICAgJ21lZGlhdG9yJ1xuICAgIF0sIGZ1bmN0aW9uKCBCYXNlLCBNZWRpYXRvciApIHtcbiAgICBcbiAgICAgICAgdmFyICQgPSBCYXNlLiQsXG4gICAgICAgICAgICBpZFByZWZpeCA9ICdXVV9GSUxFXycsXG4gICAgICAgICAgICBpZFN1ZmZpeCA9IDAsXG4gICAgICAgICAgICByRXh0ID0gL1xcLihbXi5dKykkLyxcbiAgICAgICAgICAgIHN0YXR1c01hcCA9IHt9O1xuICAgIFxuICAgICAgICBmdW5jdGlvbiBnaWQoKSB7XG4gICAgICAgICAgICByZXR1cm4gaWRQcmVmaXggKyBpZFN1ZmZpeCsrO1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDmlofku7bnsbtcbiAgICAgICAgICogQGNsYXNzIEZpbGVcbiAgICAgICAgICogQGNvbnN0cnVjdG9yIOaehOmAoOWHveaVsFxuICAgICAgICAgKiBAZ3JhbW1hciBuZXcgRmlsZSggc291cmNlICkgPT4gRmlsZVxuICAgICAgICAgKiBAcGFyYW0ge0xpYi5GaWxlfSBzb3VyY2UgW2xpYi5GaWxlXSgjTGliLkZpbGUp5a6e5L6LLCDmraRzb3VyY2Xlr7nosaHmmK/luKbmnIlSdW50aW1l5L+h5oGv55qE44CCXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBXVUZpbGUoIHNvdXJjZSApIHtcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5paH5Lu25ZCN77yM5YyF5ous5omp5bGV5ZCN77yI5ZCO57yA77yJXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkgbmFtZVxuICAgICAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdGhpcy5uYW1lID0gc291cmNlLm5hbWUgfHwgJ1VudGl0bGVkJztcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5paH5Lu25L2T56ev77yI5a2X6IqC77yJXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkgc2l6ZVxuICAgICAgICAgICAgICogQHR5cGUge3VpbnR9XG4gICAgICAgICAgICAgKiBAZGVmYXVsdCAwXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRoaXMuc2l6ZSA9IHNvdXJjZS5zaXplIHx8IDA7XG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOaWh+S7tk1JTUVUWVBF57G75Z6L77yM5LiO5paH5Lu257G75Z6L55qE5a+55bqU5YWz57O76K+35Y+C6ICDW2h0dHA6Ly90LmNuL3o4Wm5GbnldKGh0dHA6Ly90LmNuL3o4Wm5GbnkpXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkgdHlwZVxuICAgICAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICAgICAqIEBkZWZhdWx0ICdhcHBsaWNhdGlvbidcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdGhpcy50eXBlID0gc291cmNlLnR5cGUgfHwgJ2FwcGxpY2F0aW9uJztcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5paH5Lu25pyA5ZCO5L+u5pS55pel5pyfXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkgbGFzdE1vZGlmaWVkRGF0ZVxuICAgICAgICAgICAgICogQHR5cGUge2ludH1cbiAgICAgICAgICAgICAqIEBkZWZhdWx0IOW9k+WJjeaXtumXtOaIs1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLmxhc3RNb2RpZmllZERhdGUgPSBzb3VyY2UubGFzdE1vZGlmaWVkRGF0ZSB8fCAobmV3IERhdGUoKSAqIDEpO1xuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDmlofku7ZJRO+8jOavj+S4quWvueixoeWFt+acieWUr+S4gElE77yM5LiO5paH5Lu25ZCN5peg5YWzXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkgaWRcbiAgICAgICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRoaXMuaWQgPSBnaWQoKTtcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5paH5Lu25omp5bGV5ZCN77yM6YCa6L+H5paH5Lu25ZCN6I635Y+W77yM5L6L5aaCdGVzdC5wbmfnmoTmianlsZXlkI3kuLpwbmdcbiAgICAgICAgICAgICAqIEBwcm9wZXJ0eSBleHRcbiAgICAgICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRoaXMuZXh0ID0gckV4dC5leGVjKCB0aGlzLm5hbWUgKSA/IFJlZ0V4cC4kMSA6ICcnO1xuICAgIFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDnirbmgIHmloflrZfor7TmmI7jgILlnKjkuI3lkIznmoRzdGF0dXPor63looPkuIvmnInkuI3lkIznmoTnlKjpgJTjgIJcbiAgICAgICAgICAgICAqIEBwcm9wZXJ0eSBzdGF0dXNUZXh0XG4gICAgICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLnN0YXR1c1RleHQgPSAnJztcbiAgICBcbiAgICAgICAgICAgIC8vIOWtmOWCqOaWh+S7tueKtuaAge+8jOmYsuatoumAmui/h+WxnuaAp+ebtOaOpeS/ruaUuVxuICAgICAgICAgICAgc3RhdHVzTWFwWyB0aGlzLmlkIF0gPSBXVUZpbGUuU3RhdHVzLklOSVRFRDtcbiAgICBcbiAgICAgICAgICAgIHRoaXMuc291cmNlID0gc291cmNlO1xuICAgICAgICAgICAgdGhpcy5sb2FkZWQgPSAwO1xuICAgIFxuICAgICAgICAgICAgdGhpcy5vbiggJ2Vycm9yJywgZnVuY3Rpb24oIG1zZyApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXR1cyggV1VGaWxlLlN0YXR1cy5FUlJPUiwgbXNnICk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIFxuICAgICAgICAkLmV4dGVuZCggV1VGaWxlLnByb3RvdHlwZSwge1xuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDorr7nva7nirbmgIHvvIznirbmgIHlj5jljJbml7bkvJrop6blj5FgY2hhbmdlYOS6i+S7tuOAglxuICAgICAgICAgICAgICogQG1ldGhvZCBzZXRTdGF0dXNcbiAgICAgICAgICAgICAqIEBncmFtbWFyIHNldFN0YXR1cyggc3RhdHVzWywgc3RhdHVzVGV4dF0gKTtcbiAgICAgICAgICAgICAqIEBwYXJhbSB7RmlsZS5TdGF0dXN8U3RyaW5nfSBzdGF0dXMgW+aWh+S7tueKtuaAgeWAvF0oI1dlYlVwbG9hZGVyOkZpbGU6RmlsZS5TdGF0dXMpXG4gICAgICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gW3N0YXR1c1RleHQ9JyddIOeKtuaAgeivtOaYju+8jOW4uOWcqGVycm9y5pe25L2/55So77yM55SoaHR0cCwgYWJvcnQsc2VydmVy562J5p2l5qCH6K6w5piv55Sx5LqO5LuA5LmI5Y6f5Zug5a+86Ie05paH5Lu26ZSZ6K+v44CCXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHNldFN0YXR1czogZnVuY3Rpb24oIHN0YXR1cywgdGV4dCApIHtcbiAgICBcbiAgICAgICAgICAgICAgICB2YXIgcHJldlN0YXR1cyA9IHN0YXR1c01hcFsgdGhpcy5pZCBdO1xuICAgIFxuICAgICAgICAgICAgICAgIHR5cGVvZiB0ZXh0ICE9PSAndW5kZWZpbmVkJyAmJiAodGhpcy5zdGF0dXNUZXh0ID0gdGV4dCk7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCBzdGF0dXMgIT09IHByZXZTdGF0dXMgKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXR1c01hcFsgdGhpcy5pZCBdID0gc3RhdHVzO1xuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICog5paH5Lu254q25oCB5Y+Y5YyWXG4gICAgICAgICAgICAgICAgICAgICAqIEBldmVudCBzdGF0dXNjaGFuZ2VcbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlciggJ3N0YXR1c2NoYW5nZScsIHN0YXR1cywgcHJldlN0YXR1cyApO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOiOt+WPluaWh+S7tueKtuaAgVxuICAgICAgICAgICAgICogQHJldHVybiB7RmlsZS5TdGF0dXN9XG4gICAgICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgICAgICAgICAgICAg5paH5Lu254q25oCB5YW35L2T5YyF5ous5Lul5LiL5Yeg56eN57G75Z6L77yaXG4gICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgLy8g5Yid5aeL5YyWXG4gICAgICAgICAgICAgICAgICAgICAgICBJTklURUQ6ICAgICAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5bey5YWl6Zif5YiXXG4gICAgICAgICAgICAgICAgICAgICAgICBRVUVVRUQ6ICAgICAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5q2j5Zyo5LiK5LygXG4gICAgICAgICAgICAgICAgICAgICAgICBQUk9HUkVTUzogICAgIDIsXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDkuIrkvKDlh7rplJlcbiAgICAgICAgICAgICAgICAgICAgICAgIEVSUk9SOiAgICAgICAgIDMsXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDkuIrkvKDmiJDlip9cbiAgICAgICAgICAgICAgICAgICAgICAgIENPTVBMRVRFOiAgICAgNCxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOS4iuS8oOWPlua2iFxuICAgICAgICAgICAgICAgICAgICAgICAgQ0FOQ0VMTEVEOiAgICAgNVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGdldFN0YXR1czogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0YXR1c01hcFsgdGhpcy5pZCBdO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog6I635Y+W5paH5Lu25Y6f5aeL5L+h5oGv44CCXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBnZXRTb3VyY2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNvdXJjZTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBkZXN0b3J5OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgc3RhdHVzTWFwWyB0aGlzLmlkIF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIFxuICAgICAgICBNZWRpYXRvci5pbnN0YWxsVG8oIFdVRmlsZS5wcm90b3R5cGUgKTtcbiAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICAqIOaWh+S7tueKtuaAgeWAvO+8jOWFt+S9k+WMheaLrOS7peS4i+WHoOenjeexu+Wei++8mlxuICAgICAgICAgKiAqIGBpbml0ZWRgIOWIneWni+eKtuaAgVxuICAgICAgICAgKiAqIGBxdWV1ZWRgIOW3sue7j+i/m+WFpemYn+WIlywg562J5b6F5LiK5LygXG4gICAgICAgICAqICogYHByb2dyZXNzYCDkuIrkvKDkuK1cbiAgICAgICAgICogKiBgY29tcGxldGVgIOS4iuS8oOWujOaIkOOAglxuICAgICAgICAgKiAqIGBlcnJvcmAg5LiK5Lyg5Ye66ZSZ77yM5Y+v6YeN6K+VXG4gICAgICAgICAqICogYGludGVycnVwdGAg5LiK5Lyg5Lit5pat77yM5Y+v57ut5Lyg44CCXG4gICAgICAgICAqICogYGludmFsaWRgIOaWh+S7tuS4jeWQiOagvO+8jOS4jeiDvemHjeivleS4iuS8oOOAguS8muiHquWKqOS7jumYn+WIl+S4reenu+mZpOOAglxuICAgICAgICAgKiAqIGBjYW5jZWxsZWRgIOaWh+S7tuiiq+enu+mZpOOAglxuICAgICAgICAgKiBAcHJvcGVydHkge09iamVjdH0gU3RhdHVzXG4gICAgICAgICAqIEBuYW1lc3BhY2UgRmlsZVxuICAgICAgICAgKiBAY2xhc3MgRmlsZVxuICAgICAgICAgKiBAc3RhdGljXG4gICAgICAgICAqL1xuICAgICAgICBXVUZpbGUuU3RhdHVzID0ge1xuICAgICAgICAgICAgSU5JVEVEOiAgICAgJ2luaXRlZCcsICAgIC8vIOWIneWni+eKtuaAgVxuICAgICAgICAgICAgUVVFVUVEOiAgICAgJ3F1ZXVlZCcsICAgIC8vIOW3sue7j+i/m+WFpemYn+WIlywg562J5b6F5LiK5LygXG4gICAgICAgICAgICBQUk9HUkVTUzogICAncHJvZ3Jlc3MnLCAgICAvLyDkuIrkvKDkuK1cbiAgICAgICAgICAgIEVSUk9SOiAgICAgICdlcnJvcicsICAgIC8vIOS4iuS8oOWHuumUme+8jOWPr+mHjeivlVxuICAgICAgICAgICAgQ09NUExFVEU6ICAgJ2NvbXBsZXRlJywgICAgLy8g5LiK5Lyg5a6M5oiQ44CCXG4gICAgICAgICAgICBDQU5DRUxMRUQ6ICAnY2FuY2VsbGVkJywgICAgLy8g5LiK5Lyg5Y+W5raI44CCXG4gICAgICAgICAgICBJTlRFUlJVUFQ6ICAnaW50ZXJydXB0JywgICAgLy8g5LiK5Lyg5Lit5pat77yM5Y+v57ut5Lyg44CCXG4gICAgICAgICAgICBJTlZBTElEOiAgICAnaW52YWxpZCcgICAgLy8g5paH5Lu25LiN5ZCI5qC877yM5LiN6IO96YeN6K+V5LiK5Lyg44CCXG4gICAgICAgIH07XG4gICAgXG4gICAgICAgIHJldHVybiBXVUZpbGU7XG4gICAgfSk7XG4gICAgXG4gICAgLyoqXG4gICAgICogQGZpbGVPdmVydmlldyDmlofku7bpmJ/liJdcbiAgICAgKi9cbiAgICBkZWZpbmUoJ3F1ZXVlJyxbXG4gICAgICAgICdiYXNlJyxcbiAgICAgICAgJ21lZGlhdG9yJyxcbiAgICAgICAgJ2ZpbGUnXG4gICAgXSwgZnVuY3Rpb24oIEJhc2UsIE1lZGlhdG9yLCBXVUZpbGUgKSB7XG4gICAgXG4gICAgICAgIHZhciAkID0gQmFzZS4kLFxuICAgICAgICAgICAgU1RBVFVTID0gV1VGaWxlLlN0YXR1cztcbiAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICAqIOaWh+S7tumYn+WIlywg55So5p2l5a2Y5YKo5ZCE5Liq54q25oCB5Lit55qE5paH5Lu244CCXG4gICAgICAgICAqIEBjbGFzcyBRdWV1ZVxuICAgICAgICAgKiBAZXh0ZW5kcyBNZWRpYXRvclxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gUXVldWUoKSB7XG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOe7n+iuoeaWh+S7tuaVsOOAglxuICAgICAgICAgICAgICogKiBgbnVtT2ZRdWV1ZWAg6Zif5YiX5Lit55qE5paH5Lu25pWw44CCXG4gICAgICAgICAgICAgKiAqIGBudW1PZlN1Y2Nlc3NgIOS4iuS8oOaIkOWKn+eahOaWh+S7tuaVsFxuICAgICAgICAgICAgICogKiBgbnVtT2ZDYW5jZWxgIOiiq+enu+mZpOeahOaWh+S7tuaVsFxuICAgICAgICAgICAgICogKiBgbnVtT2ZQcm9ncmVzc2Ag5q2j5Zyo5LiK5Lyg5Lit55qE5paH5Lu25pWwXG4gICAgICAgICAgICAgKiAqIGBudW1PZlVwbG9hZEZhaWxlZGAg5LiK5Lyg6ZSZ6K+v55qE5paH5Lu25pWw44CCXG4gICAgICAgICAgICAgKiAqIGBudW1PZkludmFsaWRgIOaXoOaViOeahOaWh+S7tuaVsOOAglxuICAgICAgICAgICAgICogQHByb3BlcnR5IHtPYmplY3R9IHN0YXRzXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRoaXMuc3RhdHMgPSB7XG4gICAgICAgICAgICAgICAgbnVtT2ZRdWV1ZTogMCxcbiAgICAgICAgICAgICAgICBudW1PZlN1Y2Nlc3M6IDAsXG4gICAgICAgICAgICAgICAgbnVtT2ZDYW5jZWw6IDAsXG4gICAgICAgICAgICAgICAgbnVtT2ZQcm9ncmVzczogMCxcbiAgICAgICAgICAgICAgICBudW1PZlVwbG9hZEZhaWxlZDogMCxcbiAgICAgICAgICAgICAgICBudW1PZkludmFsaWQ6IDBcbiAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgICAgICAvLyDkuIrkvKDpmJ/liJfvvIzku4XljIXmi6znrYnlvoXkuIrkvKDnmoTmlofku7ZcbiAgICAgICAgICAgIHRoaXMuX3F1ZXVlID0gW107XG4gICAgXG4gICAgICAgICAgICAvLyDlrZjlgqjmiYDmnInmlofku7ZcbiAgICAgICAgICAgIHRoaXMuX21hcCA9IHt9O1xuICAgICAgICB9XG4gICAgXG4gICAgICAgICQuZXh0ZW5kKCBRdWV1ZS5wcm90b3R5cGUsIHtcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5bCG5paw5paH5Lu25Yqg5YWl5a+56Zif5YiX5bC+6YOoXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQG1ldGhvZCBhcHBlbmRcbiAgICAgICAgICAgICAqIEBwYXJhbSAge0ZpbGV9IGZpbGUgICDmlofku7blr7nosaFcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgYXBwZW5kOiBmdW5jdGlvbiggZmlsZSApIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9xdWV1ZS5wdXNoKCBmaWxlICk7XG4gICAgICAgICAgICAgICAgdGhpcy5fZmlsZUFkZGVkKCBmaWxlICk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDlsIbmlrDmlofku7bliqDlhaXlr7npmJ/liJflpLTpg6hcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAbWV0aG9kIHByZXBlbmRcbiAgICAgICAgICAgICAqIEBwYXJhbSAge0ZpbGV9IGZpbGUgICDmlofku7blr7nosaFcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgcHJlcGVuZDogZnVuY3Rpb24oIGZpbGUgKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcXVldWUudW5zaGlmdCggZmlsZSApO1xuICAgICAgICAgICAgICAgIHRoaXMuX2ZpbGVBZGRlZCggZmlsZSApO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog6I635Y+W5paH5Lu25a+56LGhXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQG1ldGhvZCBnZXRGaWxlXG4gICAgICAgICAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IGZpbGVJZCAgIOaWh+S7tklEXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtGaWxlfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBnZXRGaWxlOiBmdW5jdGlvbiggZmlsZUlkICkge1xuICAgICAgICAgICAgICAgIGlmICggdHlwZW9mIGZpbGVJZCAhPT0gJ3N0cmluZycgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmaWxlSWQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9tYXBbIGZpbGVJZCBdO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5LuO6Zif5YiX5Lit5Y+W5Ye65LiA5Liq5oyH5a6a54q25oCB55qE5paH5Lu244CCXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBmZXRjaCggc3RhdHVzICkgPT4gRmlsZVxuICAgICAgICAgICAgICogQG1ldGhvZCBmZXRjaFxuICAgICAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IHN0YXR1cyBb5paH5Lu254q25oCB5YC8XSgjV2ViVXBsb2FkZXI6RmlsZTpGaWxlLlN0YXR1cylcbiAgICAgICAgICAgICAqIEByZXR1cm4ge0ZpbGV9IFtGaWxlXSgjV2ViVXBsb2FkZXI6RmlsZSlcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZmV0Y2g6IGZ1bmN0aW9uKCBzdGF0dXMgKSB7XG4gICAgICAgICAgICAgICAgdmFyIGxlbiA9IHRoaXMuX3F1ZXVlLmxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgaSwgZmlsZTtcbiAgICBcbiAgICAgICAgICAgICAgICBzdGF0dXMgPSBzdGF0dXMgfHwgU1RBVFVTLlFVRVVFRDtcbiAgICBcbiAgICAgICAgICAgICAgICBmb3IgKCBpID0gMDsgaSA8IGxlbjsgaSsrICkge1xuICAgICAgICAgICAgICAgICAgICBmaWxlID0gdGhpcy5fcXVldWVbIGkgXTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBzdGF0dXMgPT09IGZpbGUuZ2V0U3RhdHVzKCkgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmlsZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOWvuemYn+WIl+i/m+ihjOaOkuW6j++8jOiDveWkn+aOp+WItuaWh+S7tuS4iuS8oOmhuuW6j+OAglxuICAgICAgICAgICAgICogQGdyYW1tYXIgc29ydCggZm4gKSA9PiB1bmRlZmluZWRcbiAgICAgICAgICAgICAqIEBtZXRob2Qgc29ydFxuICAgICAgICAgICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4g5o6S5bqP5pa55rOVXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHNvcnQ6IGZ1bmN0aW9uKCBmbiApIHtcbiAgICAgICAgICAgICAgICBpZiAoIHR5cGVvZiBmbiA9PT0gJ2Z1bmN0aW9uJyApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcXVldWUuc29ydCggZm4gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDojrflj5bmjIflrprnsbvlnovnmoTmlofku7bliJfooagsIOWIl+ihqOS4reavj+S4gOS4quaIkOWRmOS4ultGaWxlXSgjV2ViVXBsb2FkZXI6RmlsZSnlr7nosaHjgIJcbiAgICAgICAgICAgICAqIEBncmFtbWFyIGdldEZpbGVzKCBbc3RhdHVzMVssIHN0YXR1czIgLi4uXV0gKSA9PiBBcnJheVxuICAgICAgICAgICAgICogQG1ldGhvZCBnZXRGaWxlc1xuICAgICAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IFtzdGF0dXNdIFvmlofku7bnirbmgIHlgLxdKCNXZWJVcGxvYWRlcjpGaWxlOkZpbGUuU3RhdHVzKVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBnZXRGaWxlczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0cyA9IFtdLnNsaWNlLmNhbGwoIGFyZ3VtZW50cywgMCApLFxuICAgICAgICAgICAgICAgICAgICByZXQgPSBbXSxcbiAgICAgICAgICAgICAgICAgICAgaSA9IDAsXG4gICAgICAgICAgICAgICAgICAgIGxlbiA9IHRoaXMuX3F1ZXVlLmxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgZmlsZTtcbiAgICBcbiAgICAgICAgICAgICAgICBmb3IgKCA7IGkgPCBsZW47IGkrKyApIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsZSA9IHRoaXMuX3F1ZXVlWyBpIF07XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGlmICggc3RzLmxlbmd0aCAmJiAhfiQuaW5BcnJheSggZmlsZS5nZXRTdGF0dXMoKSwgc3RzICkgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgICAgICByZXQucHVzaCggZmlsZSApO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIF9maWxlQWRkZWQ6IGZ1bmN0aW9uKCBmaWxlICkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIGV4aXN0aW5nID0gdGhpcy5fbWFwWyBmaWxlLmlkIF07XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCAhZXhpc3RpbmcgKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX21hcFsgZmlsZS5pZCBdID0gZmlsZTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgZmlsZS5vbiggJ3N0YXR1c2NoYW5nZScsIGZ1bmN0aW9uKCBjdXIsIHByZSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lLl9vbkZpbGVTdGF0dXNDaGFuZ2UoIGN1ciwgcHJlICk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBmaWxlLnNldFN0YXR1cyggU1RBVFVTLlFVRVVFRCApO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIF9vbkZpbGVTdGF0dXNDaGFuZ2U6IGZ1bmN0aW9uKCBjdXJTdGF0dXMsIHByZVN0YXR1cyApIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RhdHMgPSB0aGlzLnN0YXRzO1xuICAgIFxuICAgICAgICAgICAgICAgIHN3aXRjaCAoIHByZVN0YXR1cyApIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBTVEFUVVMuUFJPR1JFU1M6XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0cy5udW1PZlByb2dyZXNzLS07XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBTVEFUVVMuUVVFVUVEOlxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHMubnVtT2ZRdWV1ZSAtLTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBjYXNlIFNUQVRVUy5FUlJPUjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRzLm51bU9mVXBsb2FkRmFpbGVkLS07XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBTVEFUVVMuSU5WQUxJRDpcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRzLm51bU9mSW52YWxpZC0tO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIHN3aXRjaCAoIGN1clN0YXR1cyApIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBTVEFUVVMuUVVFVUVEOlxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHMubnVtT2ZRdWV1ZSsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgU1RBVFVTLlBST0dSRVNTOlxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHMubnVtT2ZQcm9ncmVzcysrO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgU1RBVFVTLkVSUk9SOlxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHMubnVtT2ZVcGxvYWRGYWlsZWQrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBjYXNlIFNUQVRVUy5DT01QTEVURTpcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRzLm51bU9mU3VjY2VzcysrO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgU1RBVFVTLkNBTkNFTExFRDpcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRzLm51bU9mQ2FuY2VsKys7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBTVEFUVVMuSU5WQUxJRDpcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRzLm51bU9mSW52YWxpZCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgTWVkaWF0b3IuaW5zdGFsbFRvKCBRdWV1ZS5wcm90b3R5cGUgKTtcbiAgICBcbiAgICAgICAgcmV0dXJuIFF1ZXVlO1xuICAgIH0pO1xuICAgIC8qKlxuICAgICAqIEBmaWxlT3ZlcnZpZXcg6Zif5YiXXG4gICAgICovXG4gICAgZGVmaW5lKCd3aWRnZXRzL3F1ZXVlJyxbXG4gICAgICAgICdiYXNlJyxcbiAgICAgICAgJ3VwbG9hZGVyJyxcbiAgICAgICAgJ3F1ZXVlJyxcbiAgICAgICAgJ2ZpbGUnLFxuICAgICAgICAnbGliL2ZpbGUnLFxuICAgICAgICAncnVudGltZS9jbGllbnQnLFxuICAgICAgICAnd2lkZ2V0cy93aWRnZXQnXG4gICAgXSwgZnVuY3Rpb24oIEJhc2UsIFVwbG9hZGVyLCBRdWV1ZSwgV1VGaWxlLCBGaWxlLCBSdW50aW1lQ2xpZW50ICkge1xuICAgIFxuICAgICAgICB2YXIgJCA9IEJhc2UuJCxcbiAgICAgICAgICAgIHJFeHQgPSAvXFwuXFx3KyQvLFxuICAgICAgICAgICAgU3RhdHVzID0gV1VGaWxlLlN0YXR1cztcbiAgICBcbiAgICAgICAgcmV0dXJuIFVwbG9hZGVyLnJlZ2lzdGVyKHtcbiAgICAgICAgICAgICdzb3J0LWZpbGVzJzogJ3NvcnRGaWxlcycsXG4gICAgICAgICAgICAnYWRkLWZpbGUnOiAnYWRkRmlsZXMnLFxuICAgICAgICAgICAgJ2dldC1maWxlJzogJ2dldEZpbGUnLFxuICAgICAgICAgICAgJ2ZldGNoLWZpbGUnOiAnZmV0Y2hGaWxlJyxcbiAgICAgICAgICAgICdnZXQtc3RhdHMnOiAnZ2V0U3RhdHMnLFxuICAgICAgICAgICAgJ2dldC1maWxlcyc6ICdnZXRGaWxlcycsXG4gICAgICAgICAgICAncmVtb3ZlLWZpbGUnOiAncmVtb3ZlRmlsZScsXG4gICAgICAgICAgICAncmV0cnknOiAncmV0cnknLFxuICAgICAgICAgICAgJ3Jlc2V0JzogJ3Jlc2V0JyxcbiAgICAgICAgICAgICdhY2NlcHQtZmlsZSc6ICdhY2NlcHRGaWxlJ1xuICAgICAgICB9LCB7XG4gICAgXG4gICAgICAgICAgICBpbml0OiBmdW5jdGlvbiggb3B0cyApIHtcbiAgICAgICAgICAgICAgICB2YXIgbWUgPSB0aGlzLFxuICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZCwgbGVuLCBpLCBpdGVtLCBhcnIsIGFjY2VwdCwgcnVudGltZTtcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoICQuaXNQbGFpbk9iamVjdCggb3B0cy5hY2NlcHQgKSApIHtcbiAgICAgICAgICAgICAgICAgICAgb3B0cy5hY2NlcHQgPSBbIG9wdHMuYWNjZXB0IF07XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIC8vIGFjY2VwdOS4reeahOS4reeUn+aIkOWMuemFjeato+WImeOAglxuICAgICAgICAgICAgICAgIGlmICggb3B0cy5hY2NlcHQgKSB7XG4gICAgICAgICAgICAgICAgICAgIGFyciA9IFtdO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBmb3IgKCBpID0gMCwgbGVuID0gb3B0cy5hY2NlcHQubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtID0gb3B0cy5hY2NlcHRbIGkgXS5leHRlbnNpb25zO1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbSAmJiBhcnIucHVzaCggaXRlbSApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGlmICggYXJyLmxlbmd0aCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjY2VwdCA9ICdcXFxcLicgKyBhcnIuam9pbignLCcpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKCAvLC9nLCAnJHxcXFxcLicgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSggL1xcKi9nLCAnLionICkgKyAnJCc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgbWUuYWNjZXB0ID0gbmV3IFJlZ0V4cCggYWNjZXB0LCAnaScgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgbWUucXVldWUgPSBuZXcgUXVldWUoKTtcbiAgICAgICAgICAgICAgICBtZS5zdGF0cyA9IG1lLnF1ZXVlLnN0YXRzO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIOWmguaenOW9k+WJjeS4jeaYr2h0bWw16L+Q6KGM5pe277yM6YKj5bCx566X5LqG44CCXG4gICAgICAgICAgICAgICAgLy8g5LiN5omn6KGM5ZCO57ut5pON5L2cXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLnJlcXVlc3QoJ3ByZWRpY3QtcnVudGltZS10eXBlJykgIT09ICdodG1sNScgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g5Yib5bu65LiA5LiqIGh0bWw1IOi/kOihjOaXtueahCBwbGFjZWhvbGRlclxuICAgICAgICAgICAgICAgIC8vIOS7peiHs+S6juWklumDqOa3u+WKoOWOn+eUnyBGaWxlIOWvueixoeeahOaXtuWAmeiDveato+ehruWMheijueS4gOS4i+S+myB3ZWJ1cGxvYWRlciDkvb/nlKjjgIJcbiAgICAgICAgICAgICAgICBkZWZlcnJlZCA9IEJhc2UuRGVmZXJyZWQoKTtcbiAgICAgICAgICAgICAgICBydW50aW1lID0gbmV3IFJ1bnRpbWVDbGllbnQoJ1BsYWNlaG9sZGVyJyk7XG4gICAgICAgICAgICAgICAgcnVudGltZS5jb25uZWN0UnVudGltZSh7XG4gICAgICAgICAgICAgICAgICAgIHJ1bnRpbWVPcmRlcjogJ2h0bWw1J1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBtZS5fcnVpZCA9IHJ1bnRpbWUuZ2V0UnVpZCgpO1xuICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2UoKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgXG4gICAgICAgICAgICAvLyDkuLrkuobmlK/mjIHlpJbpg6jnm7TmjqXmt7vliqDkuIDkuKrljp/nlJ9GaWxl5a+56LGh44CCXG4gICAgICAgICAgICBfd3JhcEZpbGU6IGZ1bmN0aW9uKCBmaWxlICkge1xuICAgICAgICAgICAgICAgIGlmICggIShmaWxlIGluc3RhbmNlb2YgV1VGaWxlKSApIHtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKCAhKGZpbGUgaW5zdGFuY2VvZiBGaWxlKSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggIXRoaXMuX3J1aWQgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5cXCd0IGFkZCBleHRlcm5hbCBmaWxlcy4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUgPSBuZXcgRmlsZSggdGhpcy5fcnVpZCwgZmlsZSApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGZpbGUgPSBuZXcgV1VGaWxlKCBmaWxlICk7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBmaWxlO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8vIOWIpOaWreaWh+S7tuaYr+WQpuWPr+S7peiiq+WKoOWFpemYn+WIl1xuICAgICAgICAgICAgYWNjZXB0RmlsZTogZnVuY3Rpb24oIGZpbGUgKSB7XG4gICAgICAgICAgICAgICAgdmFyIGludmFsaWQgPSAhZmlsZSB8fCBmaWxlLnNpemUgPCA2IHx8IHRoaXMuYWNjZXB0ICYmXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDlpoLmnpzlkI3lrZfkuK3mnInlkI7nvIDvvIzmiY3lgZrlkI7nvIDnmb3lkI3ljZXlpITnkIbjgIJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJFeHQuZXhlYyggZmlsZS5uYW1lICkgJiYgIXRoaXMuYWNjZXB0LnRlc3QoIGZpbGUubmFtZSApO1xuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiAhaW52YWxpZDtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBldmVudCBiZWZvcmVGaWxlUXVldWVkXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0ZpbGV9IGZpbGUgRmlsZeWvueixoVxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIOW9k+aWh+S7tuiiq+WKoOWFpemYn+WIl+S5i+WJjeinpuWPke+8jOatpOS6i+S7tueahGhhbmRsZXLov5Tlm57lgLzkuLpgZmFsc2Vg77yM5YiZ5q2k5paH5Lu25LiN5Lya6KKr5re75Yqg6L+b5YWl6Zif5YiX44CCXG4gICAgICAgICAgICAgKiBAZm9yICBVcGxvYWRlclxuICAgICAgICAgICAgICovXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBldmVudCBmaWxlUXVldWVkXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0ZpbGV9IGZpbGUgRmlsZeWvueixoVxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIOW9k+aWh+S7tuiiq+WKoOWFpemYn+WIl+S7peWQjuinpuWPkeOAglxuICAgICAgICAgICAgICogQGZvciAgVXBsb2FkZXJcbiAgICAgICAgICAgICAqL1xuICAgIFxuICAgICAgICAgICAgX2FkZEZpbGU6IGZ1bmN0aW9uKCBmaWxlICkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgXG4gICAgICAgICAgICAgICAgZmlsZSA9IG1lLl93cmFwRmlsZSggZmlsZSApO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIOS4jei/h+exu+Wei+WIpOaWreWFgeiuuOS4jeWFgeiuuO+8jOWFiOa0vumAgSBgYmVmb3JlRmlsZVF1ZXVlZGBcbiAgICAgICAgICAgICAgICBpZiAoICFtZS5vd25lci50cmlnZ2VyKCAnYmVmb3JlRmlsZVF1ZXVlZCcsIGZpbGUgKSApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAvLyDnsbvlnovkuI3ljLnphY3vvIzliJnmtL7pgIHplJnor6/kuovku7bvvIzlubbov5Tlm57jgIJcbiAgICAgICAgICAgICAgICBpZiAoICFtZS5hY2NlcHRGaWxlKCBmaWxlICkgKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lLm93bmVyLnRyaWdnZXIoICdlcnJvcicsICdRX1RZUEVfREVOSUVEJywgZmlsZSApO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIG1lLnF1ZXVlLmFwcGVuZCggZmlsZSApO1xuICAgICAgICAgICAgICAgIG1lLm93bmVyLnRyaWdnZXIoICdmaWxlUXVldWVkJywgZmlsZSApO1xuICAgICAgICAgICAgICAgIHJldHVybiBmaWxlO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGdldEZpbGU6IGZ1bmN0aW9uKCBmaWxlSWQgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucXVldWUuZ2V0RmlsZSggZmlsZUlkICk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAZXZlbnQgZmlsZXNRdWV1ZWRcbiAgICAgICAgICAgICAqIEBwYXJhbSB7RmlsZX0gZmlsZXMg5pWw57uE77yM5YaF5a655Li65Y6f5aeLRmlsZShsaWIvRmlsZe+8ieWvueixoeOAglxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIOW9k+S4gOaJueaWh+S7tua3u+WKoOi/m+mYn+WIl+S7peWQjuinpuWPkeOAglxuICAgICAgICAgICAgICogQGZvciAgVXBsb2FkZXJcbiAgICAgICAgICAgICAqL1xuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAbWV0aG9kIGFkZEZpbGVzXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBhZGRGaWxlcyggZmlsZSApID0+IHVuZGVmaW5lZFxuICAgICAgICAgICAgICogQGdyYW1tYXIgYWRkRmlsZXMoIFtmaWxlMSwgZmlsZTIgLi4uXSApID0+IHVuZGVmaW5lZFxuICAgICAgICAgICAgICogQHBhcmFtIHtBcnJheSBvZiBGaWxlIG9yIEZpbGV9IFtmaWxlc10gRmlsZXMg5a+56LGhIOaVsOe7hFxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIOa3u+WKoOaWh+S7tuWIsOmYn+WIl1xuICAgICAgICAgICAgICogQGZvciAgVXBsb2FkZXJcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgYWRkRmlsZXM6IGZ1bmN0aW9uKCBmaWxlcyApIHtcbiAgICAgICAgICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggIWZpbGVzLmxlbmd0aCApIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsZXMgPSBbIGZpbGVzIF07XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIGZpbGVzID0gJC5tYXAoIGZpbGVzLCBmdW5jdGlvbiggZmlsZSApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1lLl9hZGRGaWxlKCBmaWxlICk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgbWUub3duZXIudHJpZ2dlciggJ2ZpbGVzUXVldWVkJywgZmlsZXMgKTtcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoIG1lLm9wdGlvbnMuYXV0byApIHtcbiAgICAgICAgICAgICAgICAgICAgbWUucmVxdWVzdCgnc3RhcnQtdXBsb2FkJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGdldFN0YXRzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zdGF0cztcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBldmVudCBmaWxlRGVxdWV1ZWRcbiAgICAgICAgICAgICAqIEBwYXJhbSB7RmlsZX0gZmlsZSBGaWxl5a+56LGhXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24g5b2T5paH5Lu26KKr56e76Zmk6Zif5YiX5ZCO6Kem5Y+R44CCXG4gICAgICAgICAgICAgKiBAZm9yICBVcGxvYWRlclxuICAgICAgICAgICAgICovXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBtZXRob2QgcmVtb3ZlRmlsZVxuICAgICAgICAgICAgICogQGdyYW1tYXIgcmVtb3ZlRmlsZSggZmlsZSApID0+IHVuZGVmaW5lZFxuICAgICAgICAgICAgICogQGdyYW1tYXIgcmVtb3ZlRmlsZSggaWQgKSA9PiB1bmRlZmluZWRcbiAgICAgICAgICAgICAqIEBwYXJhbSB7RmlsZXxpZH0gZmlsZSBGaWxl5a+56LGh5oiW6L+ZRmlsZeWvueixoeeahGlkXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24g56e76Zmk5p+Q5LiA5paH5Lu244CCXG4gICAgICAgICAgICAgKiBAZm9yICBVcGxvYWRlclxuICAgICAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiAkbGkub24oJ2NsaWNrJywgJy5yZW1vdmUtdGhpcycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICogICAgIHVwbG9hZGVyLnJlbW92ZUZpbGUoIGZpbGUgKTtcbiAgICAgICAgICAgICAqIH0pXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHJlbW92ZUZpbGU6IGZ1bmN0aW9uKCBmaWxlICkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgXG4gICAgICAgICAgICAgICAgZmlsZSA9IGZpbGUuaWQgPyBmaWxlIDogbWUucXVldWUuZ2V0RmlsZSggZmlsZSApO1xuICAgIFxuICAgICAgICAgICAgICAgIGZpbGUuc2V0U3RhdHVzKCBTdGF0dXMuQ0FOQ0VMTEVEICk7XG4gICAgICAgICAgICAgICAgbWUub3duZXIudHJpZ2dlciggJ2ZpbGVEZXF1ZXVlZCcsIGZpbGUgKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBtZXRob2QgZ2V0RmlsZXNcbiAgICAgICAgICAgICAqIEBncmFtbWFyIGdldEZpbGVzKCkgPT4gQXJyYXlcbiAgICAgICAgICAgICAqIEBncmFtbWFyIGdldEZpbGVzKCBzdGF0dXMxLCBzdGF0dXMyLCBzdGF0dXMuLi4gKSA9PiBBcnJheVxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIOi/lOWbnuaMh+WumueKtuaAgeeahOaWh+S7tumbhuWQiO+8jOS4jeS8oOWPguaVsOWwhui/lOWbnuaJgOacieeKtuaAgeeahOaWh+S7tuOAglxuICAgICAgICAgICAgICogQGZvciAgVXBsb2FkZXJcbiAgICAgICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAgICAgKiBjb25zb2xlLmxvZyggdXBsb2FkZXIuZ2V0RmlsZXMoKSApOyAgICAvLyA9PiBhbGwgZmlsZXNcbiAgICAgICAgICAgICAqIGNvbnNvbGUubG9nKCB1cGxvYWRlci5nZXRGaWxlcygnZXJyb3InKSApICAgIC8vID0+IGFsbCBlcnJvciBmaWxlcy5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZ2V0RmlsZXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnF1ZXVlLmdldEZpbGVzLmFwcGx5KCB0aGlzLnF1ZXVlLCBhcmd1bWVudHMgKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBmZXRjaEZpbGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnF1ZXVlLmZldGNoLmFwcGx5KCB0aGlzLnF1ZXVlLCBhcmd1bWVudHMgKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBtZXRob2QgcmV0cnlcbiAgICAgICAgICAgICAqIEBncmFtbWFyIHJldHJ5KCkgPT4gdW5kZWZpbmVkXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciByZXRyeSggZmlsZSApID0+IHVuZGVmaW5lZFxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIOmHjeivleS4iuS8oO+8jOmHjeivleaMh+WumuaWh+S7tu+8jOaIluiAheS7juWHuumUmeeahOaWh+S7tuW8gOWni+mHjeaWsOS4iuS8oOOAglxuICAgICAgICAgICAgICogQGZvciAgVXBsb2FkZXJcbiAgICAgICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAgICAgKiBmdW5jdGlvbiByZXRyeSgpIHtcbiAgICAgICAgICAgICAqICAgICB1cGxvYWRlci5yZXRyeSgpO1xuICAgICAgICAgICAgICogfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICByZXRyeTogZnVuY3Rpb24oIGZpbGUsIG5vRm9yY2VTdGFydCApIHtcbiAgICAgICAgICAgICAgICB2YXIgbWUgPSB0aGlzLFxuICAgICAgICAgICAgICAgICAgICBmaWxlcywgaSwgbGVuO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggZmlsZSApIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsZSA9IGZpbGUuaWQgPyBmaWxlIDogbWUucXVldWUuZ2V0RmlsZSggZmlsZSApO1xuICAgICAgICAgICAgICAgICAgICBmaWxlLnNldFN0YXR1cyggU3RhdHVzLlFVRVVFRCApO1xuICAgICAgICAgICAgICAgICAgICBub0ZvcmNlU3RhcnQgfHwgbWUucmVxdWVzdCgnc3RhcnQtdXBsb2FkJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgZmlsZXMgPSBtZS5xdWV1ZS5nZXRGaWxlcyggU3RhdHVzLkVSUk9SICk7XG4gICAgICAgICAgICAgICAgaSA9IDA7XG4gICAgICAgICAgICAgICAgbGVuID0gZmlsZXMubGVuZ3RoO1xuICAgIFxuICAgICAgICAgICAgICAgIGZvciAoIDsgaSA8IGxlbjsgaSsrICkge1xuICAgICAgICAgICAgICAgICAgICBmaWxlID0gZmlsZXNbIGkgXTtcbiAgICAgICAgICAgICAgICAgICAgZmlsZS5zZXRTdGF0dXMoIFN0YXR1cy5RVUVVRUQgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgbWUucmVxdWVzdCgnc3RhcnQtdXBsb2FkJyk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAbWV0aG9kIHNvcnRcbiAgICAgICAgICAgICAqIEBncmFtbWFyIHNvcnQoIGZuICkgPT4gdW5kZWZpbmVkXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24g5o6S5bqP6Zif5YiX5Lit55qE5paH5Lu277yM5Zyo5LiK5Lyg5LmL5YmN6LCD5pW05Y+v5Lul5o6n5Yi25LiK5Lyg6aG65bqP44CCXG4gICAgICAgICAgICAgKiBAZm9yICBVcGxvYWRlclxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBzb3J0RmlsZXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnF1ZXVlLnNvcnQuYXBwbHkoIHRoaXMucXVldWUsIGFyZ3VtZW50cyApO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQG1ldGhvZCByZXNldFxuICAgICAgICAgICAgICogQGdyYW1tYXIgcmVzZXQoKSA9PiB1bmRlZmluZWRcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDph43nva51cGxvYWRlcuOAguebruWJjeWPqumHjee9ruS6humYn+WIl+OAglxuICAgICAgICAgICAgICogQGZvciAgVXBsb2FkZXJcbiAgICAgICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAgICAgKiB1cGxvYWRlci5yZXNldCgpO1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICByZXNldDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5xdWV1ZSA9IG5ldyBRdWV1ZSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdHMgPSB0aGlzLnF1ZXVlLnN0YXRzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICBcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IOa3u+WKoOiOt+WPllJ1bnRpbWXnm7jlhbPkv6Hmga/nmoTmlrnms5XjgIJcbiAgICAgKi9cbiAgICBkZWZpbmUoJ3dpZGdldHMvcnVudGltZScsW1xuICAgICAgICAndXBsb2FkZXInLFxuICAgICAgICAncnVudGltZS9ydW50aW1lJyxcbiAgICAgICAgJ3dpZGdldHMvd2lkZ2V0J1xuICAgIF0sIGZ1bmN0aW9uKCBVcGxvYWRlciwgUnVudGltZSApIHtcbiAgICBcbiAgICAgICAgVXBsb2FkZXIuc3VwcG9ydCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIFJ1bnRpbWUuaGFzUnVudGltZS5hcHBseSggUnVudGltZSwgYXJndW1lbnRzICk7XG4gICAgICAgIH07XG4gICAgXG4gICAgICAgIHJldHVybiBVcGxvYWRlci5yZWdpc3Rlcih7XG4gICAgICAgICAgICAncHJlZGljdC1ydW50aW1lLXR5cGUnOiAncHJlZGljdFJ1bnRtZVR5cGUnXG4gICAgICAgIH0sIHtcbiAgICBcbiAgICAgICAgICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmICggIXRoaXMucHJlZGljdFJ1bnRtZVR5cGUoKSApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ1J1bnRpbWUgRXJyb3InKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDpooTmtYtVcGxvYWRlcuWwhumHh+eUqOWTquS4qmBSdW50aW1lYFxuICAgICAgICAgICAgICogQGdyYW1tYXIgcHJlZGljdFJ1bnRtZVR5cGUoKSA9PiBTdHJpbmdcbiAgICAgICAgICAgICAqIEBtZXRob2QgcHJlZGljdFJ1bnRtZVR5cGVcbiAgICAgICAgICAgICAqIEBmb3IgIFVwbG9hZGVyXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHByZWRpY3RSdW50bWVUeXBlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgb3JkZXJzID0gdGhpcy5vcHRpb25zLnJ1bnRpbWVPcmRlciB8fCBSdW50aW1lLm9yZGVycyxcbiAgICAgICAgICAgICAgICAgICAgdHlwZSA9IHRoaXMudHlwZSxcbiAgICAgICAgICAgICAgICAgICAgaSwgbGVuO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggIXR5cGUgKSB7XG4gICAgICAgICAgICAgICAgICAgIG9yZGVycyA9IG9yZGVycy5zcGxpdCggL1xccyosXFxzKi9nICk7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGZvciAoIGkgPSAwLCBsZW4gPSBvcmRlcnMubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIFJ1bnRpbWUuaGFzUnVudGltZSggb3JkZXJzWyBpIF0gKSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnR5cGUgPSB0eXBlID0gb3JkZXJzWyBpIF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIHR5cGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIC8qKlxuICAgICAqIEBmaWxlT3ZlcnZpZXcgVHJhbnNwb3J0XG4gICAgICovXG4gICAgZGVmaW5lKCdsaWIvdHJhbnNwb3J0JyxbXG4gICAgICAgICdiYXNlJyxcbiAgICAgICAgJ3J1bnRpbWUvY2xpZW50JyxcbiAgICAgICAgJ21lZGlhdG9yJ1xuICAgIF0sIGZ1bmN0aW9uKCBCYXNlLCBSdW50aW1lQ2xpZW50LCBNZWRpYXRvciApIHtcbiAgICBcbiAgICAgICAgdmFyICQgPSBCYXNlLiQ7XG4gICAgXG4gICAgICAgIGZ1bmN0aW9uIFRyYW5zcG9ydCggb3B0cyApIHtcbiAgICAgICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgXG4gICAgICAgICAgICBvcHRzID0gbWUub3B0aW9ucyA9ICQuZXh0ZW5kKCB0cnVlLCB7fSwgVHJhbnNwb3J0Lm9wdGlvbnMsIG9wdHMgfHwge30gKTtcbiAgICAgICAgICAgIFJ1bnRpbWVDbGllbnQuY2FsbCggdGhpcywgJ1RyYW5zcG9ydCcgKTtcbiAgICBcbiAgICAgICAgICAgIHRoaXMuX2Jsb2IgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5fZm9ybURhdGEgPSBvcHRzLmZvcm1EYXRhIHx8IHt9O1xuICAgICAgICAgICAgdGhpcy5faGVhZGVycyA9IG9wdHMuaGVhZGVycyB8fCB7fTtcbiAgICBcbiAgICAgICAgICAgIHRoaXMub24oICdwcm9ncmVzcycsIHRoaXMuX3RpbWVvdXQgKTtcbiAgICAgICAgICAgIHRoaXMub24oICdsb2FkIGVycm9yJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgbWUudHJpZ2dlciggJ3Byb2dyZXNzJywgMSApO1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCggbWUuX3RpbWVyICk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIFxuICAgICAgICBUcmFuc3BvcnQub3B0aW9ucyA9IHtcbiAgICAgICAgICAgIHNlcnZlcjogJycsXG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICBcbiAgICAgICAgICAgIC8vIOi3qOWfn+aXtu+8jOaYr+WQpuWFgeiuuOaQuuW4pmNvb2tpZSwg5Y+q5pyJaHRtbDUgcnVudGltZeaJjeacieaViFxuICAgICAgICAgICAgd2l0aENyZWRlbnRpYWxzOiBmYWxzZSxcbiAgICAgICAgICAgIGZpbGVWYWw6ICdmaWxlJyxcbiAgICAgICAgICAgIHRpbWVvdXQ6IDIgKiA2MCAqIDEwMDAsICAgIC8vIDLliIbpkp9cbiAgICAgICAgICAgIGZvcm1EYXRhOiB7fSxcbiAgICAgICAgICAgIGhlYWRlcnM6IHt9LFxuICAgICAgICAgICAgc2VuZEFzQmluYXJ5OiBmYWxzZVxuICAgICAgICB9O1xuICAgIFxuICAgICAgICAkLmV4dGVuZCggVHJhbnNwb3J0LnByb3RvdHlwZSwge1xuICAgIFxuICAgICAgICAgICAgLy8g5re75YqgQmxvYiwg5Y+q6IO95re75Yqg5LiA5qyh77yM5pyA5ZCO5LiA5qyh5pyJ5pWI44CCXG4gICAgICAgICAgICBhcHBlbmRCbG9iOiBmdW5jdGlvbigga2V5LCBibG9iLCBmaWxlbmFtZSApIHtcbiAgICAgICAgICAgICAgICB2YXIgbWUgPSB0aGlzLFxuICAgICAgICAgICAgICAgICAgICBvcHRzID0gbWUub3B0aW9ucztcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoIG1lLmdldFJ1aWQoKSApIHtcbiAgICAgICAgICAgICAgICAgICAgbWUuZGlzY29ubmVjdFJ1bnRpbWUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g6L+e5o6l5YiwYmxvYuW9kuWxnueahOWQjOS4gOS4qnJ1bnRpbWUuXG4gICAgICAgICAgICAgICAgbWUuY29ubmVjdFJ1bnRpbWUoIGJsb2IucnVpZCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lLmV4ZWMoJ2luaXQnKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICBtZS5fYmxvYiA9IGJsb2I7XG4gICAgICAgICAgICAgICAgb3B0cy5maWxlVmFsID0ga2V5IHx8IG9wdHMuZmlsZVZhbDtcbiAgICAgICAgICAgICAgICBvcHRzLmZpbGVuYW1lID0gZmlsZW5hbWUgfHwgb3B0cy5maWxlbmFtZTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvLyDmt7vliqDlhbbku5blrZfmrrVcbiAgICAgICAgICAgIGFwcGVuZDogZnVuY3Rpb24oIGtleSwgdmFsdWUgKSB7XG4gICAgICAgICAgICAgICAgaWYgKCB0eXBlb2Yga2V5ID09PSAnb2JqZWN0JyApIHtcbiAgICAgICAgICAgICAgICAgICAgJC5leHRlbmQoIHRoaXMuX2Zvcm1EYXRhLCBrZXkgKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9mb3JtRGF0YVsga2V5IF0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgc2V0UmVxdWVzdEhlYWRlcjogZnVuY3Rpb24oIGtleSwgdmFsdWUgKSB7XG4gICAgICAgICAgICAgICAgaWYgKCB0eXBlb2Yga2V5ID09PSAnb2JqZWN0JyApIHtcbiAgICAgICAgICAgICAgICAgICAgJC5leHRlbmQoIHRoaXMuX2hlYWRlcnMsIGtleSApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2hlYWRlcnNbIGtleSBdID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIHNlbmQ6IGZ1bmN0aW9uKCBtZXRob2QgKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5leGVjKCAnc2VuZCcsIG1ldGhvZCApO1xuICAgICAgICAgICAgICAgIHRoaXMuX3RpbWVvdXQoKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBhYm9ydDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KCB0aGlzLl90aW1lciApO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmV4ZWMoJ2Fib3J0Jyk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyKCdkZXN0cm95Jyk7XG4gICAgICAgICAgICAgICAgdGhpcy5vZmYoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmV4ZWMoJ2Rlc3Ryb3knKTtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc2Nvbm5lY3RSdW50aW1lKCk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgZ2V0UmVzcG9uc2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmV4ZWMoJ2dldFJlc3BvbnNlJyk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgZ2V0UmVzcG9uc2VBc0pzb246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmV4ZWMoJ2dldFJlc3BvbnNlQXNKc29uJyk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgZ2V0U3RhdHVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5leGVjKCdnZXRTdGF0dXMnKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBfdGltZW91dDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgZHVyYXRpb24gPSBtZS5vcHRpb25zLnRpbWVvdXQ7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCAhZHVyYXRpb24gKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KCBtZS5fdGltZXIgKTtcbiAgICAgICAgICAgICAgICBtZS5fdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBtZS5hYm9ydCgpO1xuICAgICAgICAgICAgICAgICAgICBtZS50cmlnZ2VyKCAnZXJyb3InLCAndGltZW91dCcgKTtcbiAgICAgICAgICAgICAgICB9LCBkdXJhdGlvbiApO1xuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgLy8g6K6pVHJhbnNwb3J05YW35aSH5LqL5Lu25Yqf6IO944CCXG4gICAgICAgIE1lZGlhdG9yLmluc3RhbGxUbyggVHJhbnNwb3J0LnByb3RvdHlwZSApO1xuICAgIFxuICAgICAgICByZXR1cm4gVHJhbnNwb3J0O1xuICAgIH0pO1xuICAgIC8qKlxuICAgICAqIEBmaWxlT3ZlcnZpZXcg6LSf6LSj5paH5Lu25LiK5Lyg55u45YWz44CCXG4gICAgICovXG4gICAgZGVmaW5lKCd3aWRnZXRzL3VwbG9hZCcsW1xuICAgICAgICAnYmFzZScsXG4gICAgICAgICd1cGxvYWRlcicsXG4gICAgICAgICdmaWxlJyxcbiAgICAgICAgJ2xpYi90cmFuc3BvcnQnLFxuICAgICAgICAnd2lkZ2V0cy93aWRnZXQnXG4gICAgXSwgZnVuY3Rpb24oIEJhc2UsIFVwbG9hZGVyLCBXVUZpbGUsIFRyYW5zcG9ydCApIHtcbiAgICBcbiAgICAgICAgdmFyICQgPSBCYXNlLiQsXG4gICAgICAgICAgICBpc1Byb21pc2UgPSBCYXNlLmlzUHJvbWlzZSxcbiAgICAgICAgICAgIFN0YXR1cyA9IFdVRmlsZS5TdGF0dXM7XG4gICAgXG4gICAgICAgIC8vIOa3u+WKoOm7mOiupOmFjee9rumhuVxuICAgICAgICAkLmV4dGVuZCggVXBsb2FkZXIub3B0aW9ucywge1xuICAgIFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkge0Jvb2xlYW59IFtwcmVwYXJlTmV4dEZpbGU9ZmFsc2VdXG4gICAgICAgICAgICAgKiBAbmFtZXNwYWNlIG9wdGlvbnNcbiAgICAgICAgICAgICAqIEBmb3IgVXBsb2FkZXJcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDmmK/lkKblhYHorrjlnKjmlofku7bkvKDovpPml7bmj5DliY3miorkuIvkuIDkuKrmlofku7blh4blpIflpb3jgIJcbiAgICAgICAgICAgICAqIOWvueS6juS4gOS4quaWh+S7tueahOWHhuWkh+W3peS9nOavlOi+g+iAl+aXtu+8jOavlOWmguWbvueJh+WOi+e8qe+8jG1kNeW6j+WIl+WMluOAglxuICAgICAgICAgICAgICog5aaC5p6c6IO95o+Q5YmN5Zyo5b2T5YmN5paH5Lu25Lyg6L6T5pyf5aSE55CG77yM5Y+v5Lul6IqC55yB5oC75L2T6ICX5pe244CCXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHByZXBhcmVOZXh0RmlsZTogZmFsc2UsXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBwcm9wZXJ0eSB7Qm9vbGVhbn0gW2NodW5rZWQ9ZmFsc2VdXG4gICAgICAgICAgICAgKiBAbmFtZXNwYWNlIG9wdGlvbnNcbiAgICAgICAgICAgICAqIEBmb3IgVXBsb2FkZXJcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDmmK/lkKbopoHliIbniYflpITnkIblpKfmlofku7bkuIrkvKDjgIJcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgY2h1bmtlZDogZmFsc2UsXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBwcm9wZXJ0eSB7Qm9vbGVhbn0gW2NodW5rU2l6ZT01MjQyODgwXVxuICAgICAgICAgICAgICogQG5hbWVzcGFjZSBvcHRpb25zXG4gICAgICAgICAgICAgKiBAZm9yIFVwbG9hZGVyXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24g5aaC5p6c6KaB5YiG54mH77yM5YiG5aSa5aSn5LiA54mH77yfIOm7mOiupOWkp+Wwj+S4ujVNLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBjaHVua1NpemU6IDUgKiAxMDI0ICogMTAyNCxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQHByb3BlcnR5IHtCb29sZWFufSBbY2h1bmtSZXRyeT0yXVxuICAgICAgICAgICAgICogQG5hbWVzcGFjZSBvcHRpb25zXG4gICAgICAgICAgICAgKiBAZm9yIFVwbG9hZGVyXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24g5aaC5p6c5p+Q5Liq5YiG54mH55Sx5LqO572R57uc6Zeu6aKY5Ye66ZSZ77yM5YWB6K646Ieq5Yqo6YeN5Lyg5aSa5bCR5qyh77yfXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGNodW5rUmV0cnk6IDIsXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBwcm9wZXJ0eSB7Qm9vbGVhbn0gW3RocmVhZHM9M11cbiAgICAgICAgICAgICAqIEBuYW1lc3BhY2Ugb3B0aW9uc1xuICAgICAgICAgICAgICogQGZvciBVcGxvYWRlclxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIOS4iuS8oOW5tuWPkeaVsOOAguWFgeiuuOWQjOaXtuacgOWkp+S4iuS8oOi/m+eoi+aVsOOAglxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aHJlYWRzOiAzLFxuICAgIFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkge09iamVjdH0gW2Zvcm1EYXRhXVxuICAgICAgICAgICAgICogQG5hbWVzcGFjZSBvcHRpb25zXG4gICAgICAgICAgICAgKiBAZm9yIFVwbG9hZGVyXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24g5paH5Lu25LiK5Lyg6K+35rGC55qE5Y+C5pWw6KGo77yM5q+P5qyh5Y+R6YCB6YO95Lya5Y+R6YCB5q2k5a+56LGh5Lit55qE5Y+C5pWw44CCXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGZvcm1EYXRhOiBudWxsXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBwcm9wZXJ0eSB7T2JqZWN0fSBbZmlsZVZhbD0nZmlsZSddXG4gICAgICAgICAgICAgKiBAbmFtZXNwYWNlIG9wdGlvbnNcbiAgICAgICAgICAgICAqIEBmb3IgVXBsb2FkZXJcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDorr7nva7mlofku7bkuIrkvKDln5/nmoRuYW1l44CCXG4gICAgICAgICAgICAgKi9cbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQHByb3BlcnR5IHtPYmplY3R9IFttZXRob2Q9J1BPU1QnXVxuICAgICAgICAgICAgICogQG5hbWVzcGFjZSBvcHRpb25zXG4gICAgICAgICAgICAgKiBAZm9yIFVwbG9hZGVyXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24g5paH5Lu25LiK5Lyg5pa55byP77yMYFBPU1Rg5oiW6ICFYEdFVGDjgIJcbiAgICAgICAgICAgICAqL1xuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkge09iamVjdH0gW3NlbmRBc0JpbmFyeT1mYWxzZV1cbiAgICAgICAgICAgICAqIEBuYW1lc3BhY2Ugb3B0aW9uc1xuICAgICAgICAgICAgICogQGZvciBVcGxvYWRlclxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIOaYr+WQpuW3suS6jOi/m+WItueahOa1geeahOaWueW8j+WPkemAgeaWh+S7tu+8jOi/meagt+aVtOS4quS4iuS8oOWGheWuuWBwaHA6Ly9pbnB1dGDpg73kuLrmlofku7blhoXlrrnvvIxcbiAgICAgICAgICAgICAqIOWFtuS7luWPguaVsOWcqCRfR0VU5pWw57uE5Lit44CCXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgfSk7XG4gICAgXG4gICAgICAgIC8vIOi0n+i0o+WwhuaWh+S7tuWIh+eJh+OAglxuICAgICAgICBmdW5jdGlvbiBDdXRlRmlsZSggZmlsZSwgY2h1bmtTaXplICkge1xuICAgICAgICAgICAgdmFyIHBlbmRpbmcgPSBbXSxcbiAgICAgICAgICAgICAgICBibG9iID0gZmlsZS5zb3VyY2UsXG4gICAgICAgICAgICAgICAgdG90YWwgPSBibG9iLnNpemUsXG4gICAgICAgICAgICAgICAgY2h1bmtzID0gY2h1bmtTaXplID8gTWF0aC5jZWlsKCB0b3RhbCAvIGNodW5rU2l6ZSApIDogMSxcbiAgICAgICAgICAgICAgICBzdGFydCA9IDAsXG4gICAgICAgICAgICAgICAgaW5kZXggPSAwLFxuICAgICAgICAgICAgICAgIGxlbjtcbiAgICBcbiAgICAgICAgICAgIHdoaWxlICggaW5kZXggPCBjaHVua3MgKSB7XG4gICAgICAgICAgICAgICAgbGVuID0gTWF0aC5taW4oIGNodW5rU2l6ZSwgdG90YWwgLSBzdGFydCApO1xuICAgIFxuICAgICAgICAgICAgICAgIHBlbmRpbmcucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGZpbGU6IGZpbGUsXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0OiBzdGFydCxcbiAgICAgICAgICAgICAgICAgICAgZW5kOiBjaHVua1NpemUgPyAoc3RhcnQgKyBsZW4pIDogdG90YWwsXG4gICAgICAgICAgICAgICAgICAgIHRvdGFsOiB0b3RhbCxcbiAgICAgICAgICAgICAgICAgICAgY2h1bmtzOiBjaHVua3MsXG4gICAgICAgICAgICAgICAgICAgIGNodW5rOiBpbmRleCsrXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgc3RhcnQgKz0gbGVuO1xuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgZmlsZS5ibG9ja3MgPSBwZW5kaW5nLmNvbmNhdCgpO1xuICAgICAgICAgICAgZmlsZS5yZW1hbmluZyA9IHBlbmRpbmcubGVuZ3RoO1xuICAgIFxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBmaWxlOiBmaWxlLFxuICAgIFxuICAgICAgICAgICAgICAgIGhhczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAhIXBlbmRpbmcubGVuZ3RoO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAgICAgZmV0Y2g6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGVuZGluZy5zaGlmdCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICBcbiAgICAgICAgVXBsb2FkZXIucmVnaXN0ZXIoe1xuICAgICAgICAgICAgJ3N0YXJ0LXVwbG9hZCc6ICdzdGFydCcsXG4gICAgICAgICAgICAnc3RvcC11cGxvYWQnOiAnc3RvcCcsXG4gICAgICAgICAgICAnc2tpcC1maWxlJzogJ3NraXBGaWxlJyxcbiAgICAgICAgICAgICdpcy1pbi1wcm9ncmVzcyc6ICdpc0luUHJvZ3Jlc3MnXG4gICAgICAgIH0sIHtcbiAgICBcbiAgICAgICAgICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBvd25lciA9IHRoaXMub3duZXI7XG4gICAgXG4gICAgICAgICAgICAgICAgdGhpcy5ydW5pbmcgPSBmYWxzZTtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDorrDlvZXlvZPliY3mraPlnKjkvKDnmoTmlbDmja7vvIzot590aHJlYWRz55u45YWzXG4gICAgICAgICAgICAgICAgdGhpcy5wb29sID0gW107XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g57yT5a2Y5Y2z5bCG5LiK5Lyg55qE5paH5Lu244CCXG4gICAgICAgICAgICAgICAgdGhpcy5wZW5kaW5nID0gW107XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g6Lef6Liq6L+Y5pyJ5aSa5bCR5YiG54mH5rKh5pyJ5a6M5oiQ5LiK5Lyg44CCXG4gICAgICAgICAgICAgICAgdGhpcy5yZW1hbmluZyA9IDA7XG4gICAgICAgICAgICAgICAgdGhpcy5fX3RpY2sgPSBCYXNlLmJpbmRGbiggdGhpcy5fdGljaywgdGhpcyApO1xuICAgIFxuICAgICAgICAgICAgICAgIG93bmVyLm9uKCAndXBsb2FkQ29tcGxldGUnLCBmdW5jdGlvbiggZmlsZSApIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5oqK5YW25LuW5Z2X5Y+W5raI5LqG44CCXG4gICAgICAgICAgICAgICAgICAgIGZpbGUuYmxvY2tzICYmICQuZWFjaCggZmlsZS5ibG9ja3MsIGZ1bmN0aW9uKCBfLCB2ICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdi50cmFuc3BvcnQgJiYgKHYudHJhbnNwb3J0LmFib3J0KCksIHYudHJhbnNwb3J0LmRlc3Ryb3koKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgdi50cmFuc3BvcnQ7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBkZWxldGUgZmlsZS5ibG9ja3M7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBmaWxlLnJlbWFuaW5nO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQGV2ZW50IHN0YXJ0VXBsb2FkXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24g5b2T5byA5aeL5LiK5Lyg5rWB56iL5pe26Kem5Y+R44CCXG4gICAgICAgICAgICAgKiBAZm9yICBVcGxvYWRlclxuICAgICAgICAgICAgICovXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOW8gOWni+S4iuS8oOOAguatpOaWueazleWPr+S7peS7juWIneWni+eKtuaAgeiwg+eUqOW8gOWni+S4iuS8oOa1geeoi++8jOS5n+WPr+S7peS7juaaguWBnOeKtuaAgeiwg+eUqO+8jOe7p+e7reS4iuS8oOa1geeoi+OAglxuICAgICAgICAgICAgICogQGdyYW1tYXIgdXBsb2FkKCkgPT4gdW5kZWZpbmVkXG4gICAgICAgICAgICAgKiBAbWV0aG9kIHVwbG9hZFxuICAgICAgICAgICAgICogQGZvciAgVXBsb2FkZXJcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgc3RhcnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g56e75Ye6aW52YWxpZOeahOaWh+S7tlxuICAgICAgICAgICAgICAgICQuZWFjaCggbWUucmVxdWVzdCggJ2dldC1maWxlcycsIFN0YXR1cy5JTlZBTElEICksIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBtZS5yZXF1ZXN0KCAncmVtb3ZlLWZpbGUnLCB0aGlzICk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCBtZS5ydW5pbmcgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgbWUucnVuaW5nID0gdHJ1ZTtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDlpoLmnpzmnInmmoLlgZznmoTvvIzliJnnu63kvKBcbiAgICAgICAgICAgICAgICAkLmVhY2goIG1lLnBvb2wsIGZ1bmN0aW9uKCBfLCB2ICkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZmlsZSA9IHYuZmlsZTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBmaWxlLmdldFN0YXR1cygpID09PSBTdGF0dXMuSU5URVJSVVBUICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZS5zZXRTdGF0dXMoIFN0YXR1cy5QUk9HUkVTUyApO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWUuX3RyaWdnZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHYudHJhbnNwb3J0ICYmIHYudHJhbnNwb3J0LnNlbmQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIG1lLl90cmlnZ2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgbWUub3duZXIudHJpZ2dlcignc3RhcnRVcGxvYWQnKTtcbiAgICAgICAgICAgICAgICBCYXNlLm5leHRUaWNrKCBtZS5fX3RpY2sgKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBldmVudCBzdG9wVXBsb2FkXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24g5b2T5byA5aeL5LiK5Lyg5rWB56iL5pqC5YGc5pe26Kem5Y+R44CCXG4gICAgICAgICAgICAgKiBAZm9yICBVcGxvYWRlclxuICAgICAgICAgICAgICovXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOaaguWBnOS4iuS8oOOAguesrOS4gOS4quWPguaVsOS4uuaYr+WQpuS4reaWreS4iuS8oOW9k+WJjeato+WcqOS4iuS8oOeahOaWh+S7tuOAglxuICAgICAgICAgICAgICogQGdyYW1tYXIgc3RvcCgpID0+IHVuZGVmaW5lZFxuICAgICAgICAgICAgICogQGdyYW1tYXIgc3RvcCggdHJ1ZSApID0+IHVuZGVmaW5lZFxuICAgICAgICAgICAgICogQG1ldGhvZCBzdG9wXG4gICAgICAgICAgICAgKiBAZm9yICBVcGxvYWRlclxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBzdG9wOiBmdW5jdGlvbiggaW50ZXJydXB0ICkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCBtZS5ydW5pbmcgPT09IGZhbHNlICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIG1lLnJ1bmluZyA9IGZhbHNlO1xuICAgIFxuICAgICAgICAgICAgICAgIGludGVycnVwdCAmJiAkLmVhY2goIG1lLnBvb2wsIGZ1bmN0aW9uKCBfLCB2ICkge1xuICAgICAgICAgICAgICAgICAgICB2LnRyYW5zcG9ydCAmJiB2LnRyYW5zcG9ydC5hYm9ydCgpO1xuICAgICAgICAgICAgICAgICAgICB2LmZpbGUuc2V0U3RhdHVzKCBTdGF0dXMuSU5URVJSVVBUICk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgbWUub3duZXIudHJpZ2dlcignc3RvcFVwbG9hZCcpO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5Yik5patYFVwbGFvZGVgcuaYr+WQpuato+WcqOS4iuS8oOS4reOAglxuICAgICAgICAgICAgICogQGdyYW1tYXIgaXNJblByb2dyZXNzKCkgPT4gQm9vbGVhblxuICAgICAgICAgICAgICogQG1ldGhvZCBpc0luUHJvZ3Jlc3NcbiAgICAgICAgICAgICAqIEBmb3IgIFVwbG9hZGVyXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGlzSW5Qcm9ncmVzczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICEhdGhpcy5ydW5pbmc7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgZ2V0U3RhdHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnJlcXVlc3QoJ2dldC1zdGF0cycpO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5o6J6L+H5LiA5Liq5paH5Lu25LiK5Lyg77yM55u05o6l5qCH6K6w5oyH5a6a5paH5Lu25Li65bey5LiK5Lyg54q25oCB44CCXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBza2lwRmlsZSggZmlsZSApID0+IHVuZGVmaW5lZFxuICAgICAgICAgICAgICogQG1ldGhvZCBza2lwRmlsZVxuICAgICAgICAgICAgICogQGZvciAgVXBsb2FkZXJcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgc2tpcEZpbGU6IGZ1bmN0aW9uKCBmaWxlLCBzdGF0dXMgKSB7XG4gICAgICAgICAgICAgICAgZmlsZSA9IHRoaXMucmVxdWVzdCggJ2dldC1maWxlJywgZmlsZSApO1xuICAgIFxuICAgICAgICAgICAgICAgIGZpbGUuc2V0U3RhdHVzKCBzdGF0dXMgfHwgU3RhdHVzLkNPTVBMRVRFICk7XG4gICAgICAgICAgICAgICAgZmlsZS5za2lwcGVkID0gdHJ1ZTtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDlpoLmnpzmraPlnKjkuIrkvKDjgIJcbiAgICAgICAgICAgICAgICBmaWxlLmJsb2NrcyAmJiAkLmVhY2goIGZpbGUuYmxvY2tzLCBmdW5jdGlvbiggXywgdiApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIF90ciA9IHYudHJhbnNwb3J0O1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAoIF90ciApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF90ci5hYm9ydCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgX3RyLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB2LnRyYW5zcG9ydDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIHRoaXMub3duZXIudHJpZ2dlciggJ3VwbG9hZFNraXAnLCBmaWxlICk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAZXZlbnQgdXBsb2FkRmluaXNoZWRcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDlvZPmiYDmnInmlofku7bkuIrkvKDnu5PmnZ/ml7bop6blj5HjgIJcbiAgICAgICAgICAgICAqIEBmb3IgIFVwbG9hZGVyXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIF90aWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWUgPSB0aGlzLFxuICAgICAgICAgICAgICAgICAgICBvcHRzID0gbWUub3B0aW9ucyxcbiAgICAgICAgICAgICAgICAgICAgZm4sIHZhbDtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDkuIrkuIDkuKpwcm9taXNl6L+Y5rKh5pyJ57uT5p2f77yM5YiZ562J5b6F5a6M5oiQ5ZCO5YaN5omn6KGM44CCXG4gICAgICAgICAgICAgICAgaWYgKCBtZS5fcHJvbWlzZSApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1lLl9wcm9taXNlLmFsd2F5cyggbWUuX190aWNrICk7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIC8vIOi/mOacieS9jee9ru+8jOS4lOi/mOacieaWh+S7tuimgeWkhOeQhueahOivneOAglxuICAgICAgICAgICAgICAgIGlmICggbWUucG9vbC5sZW5ndGggPCBvcHRzLnRocmVhZHMgJiYgKHZhbCA9IG1lLl9uZXh0QmxvY2soKSkgKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lLl90cmlnZ2VkID0gZmFsc2U7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGZuID0gZnVuY3Rpb24oIHZhbCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lLl9wcm9taXNlID0gbnVsbDtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOacieWPr+iDveaYr3JlamVjdOi/h+adpeeahO+8jOaJgOS7peimgeajgOa1i3ZhbOeahOexu+Wei+OAglxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsICYmIHZhbC5maWxlICYmIG1lLl9zdGFydFNlbmQoIHZhbCApO1xuICAgICAgICAgICAgICAgICAgICAgICAgQmFzZS5uZXh0VGljayggbWUuX190aWNrICk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIG1lLl9wcm9taXNlID0gaXNQcm9taXNlKCB2YWwgKSA/IHZhbC5hbHdheXMoIGZuICkgOiBmbiggdmFsICk7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g5rKh5pyJ6KaB5LiK5Lyg55qE5LqG77yM5LiU5rKh5pyJ5q2j5Zyo5Lyg6L6T55qE5LqG44CCXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICggIW1lLnJlbWFuaW5nICYmICFtZS5nZXRTdGF0cygpLm51bU9mUXVldWUgKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lLnJ1bmluZyA9IGZhbHNlO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBtZS5fdHJpZ2dlZCB8fCBCYXNlLm5leHRUaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWUub3duZXIudHJpZ2dlcigndXBsb2FkRmluaXNoZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIG1lLl90cmlnZ2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgX25leHRCbG9jazogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgYWN0ID0gbWUuX2FjdCxcbiAgICAgICAgICAgICAgICAgICAgb3B0cyA9IG1lLm9wdGlvbnMsXG4gICAgICAgICAgICAgICAgICAgIG5leHQsIGRvbmU7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g5aaC5p6c5b2T5YmN5paH5Lu26L+Y5pyJ5rKh5pyJ6ZyA6KaB5Lyg6L6T55qE77yM5YiZ55u05o6l6L+U5Zue5Ymp5LiL55qE44CCXG4gICAgICAgICAgICAgICAgaWYgKCBhY3QgJiYgYWN0LmhhcygpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3QuZmlsZS5nZXRTdGF0dXMoKSA9PT0gU3RhdHVzLlBST0dSRVNTICkge1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyDmmK/lkKbmj5DliY3lh4blpIfkuIvkuIDkuKrmlofku7ZcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBvcHRzLnByZXBhcmVOZXh0RmlsZSAmJiAhbWUucGVuZGluZy5sZW5ndGggKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZS5fcHJlcGFyZU5leHRGaWxlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFjdC5mZXRjaCgpO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIOWQpuWIme+8jOWmguaenOato+WcqOi/kOihjO+8jOWImeWHhuWkh+S4i+S4gOS4quaWh+S7tu+8jOW5tuetieW+heWujOaIkOWQjui/lOWbnuS4i+S4quWIhueJh+OAglxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIG1lLnJ1bmluZyApIHtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8g5aaC5p6c57yT5a2Y5Lit5pyJ77yM5YiZ55u05o6l5Zyo57yT5a2Y5Lit5Y+W77yM5rKh5pyJ5YiZ5Y67cXVldWXkuK3lj5bjgIJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCAhbWUucGVuZGluZy5sZW5ndGggJiYgbWUuZ2V0U3RhdHMoKS5udW1PZlF1ZXVlICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWUuX3ByZXBhcmVOZXh0RmlsZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIG5leHQgPSBtZS5wZW5kaW5nLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgIGRvbmUgPSBmdW5jdGlvbiggZmlsZSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggIWZpbGUgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3QgPSBDdXRlRmlsZSggZmlsZSwgb3B0cy5jaHVua2VkID8gb3B0cy5jaHVua1NpemUgOiAwICk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZS5fYWN0ID0gYWN0O1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFjdC5mZXRjaCgpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyDmlofku7blj6/og73ov5jlnKhwcmVwYXJl5Lit77yM5Lmf5pyJ5Y+v6IO95bey57uP5a6M5YWo5YeG5aSH5aW95LqG44CCXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpc1Byb21pc2UoIG5leHQgKSA/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV4dFsgbmV4dC5waXBlID8gJ3BpcGUnIDogJ3RoZW4nXSggZG9uZSApIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb25lKCBuZXh0ICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICBcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQGV2ZW50IHVwbG9hZFN0YXJ0XG4gICAgICAgICAgICAgKiBAcGFyYW0ge0ZpbGV9IGZpbGUgRmlsZeWvueixoVxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIOafkOS4quaWh+S7tuW8gOWni+S4iuS8oOWJjeinpuWPke+8jOS4gOS4quaWh+S7tuWPquS8muinpuWPkeS4gOasoeOAglxuICAgICAgICAgICAgICogQGZvciAgVXBsb2FkZXJcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgX3ByZXBhcmVOZXh0RmlsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgZmlsZSA9IG1lLnJlcXVlc3QoJ2ZldGNoLWZpbGUnKSxcbiAgICAgICAgICAgICAgICAgICAgcGVuZGluZyA9IG1lLnBlbmRpbmcsXG4gICAgICAgICAgICAgICAgICAgIHByb21pc2U7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCBmaWxlICkge1xuICAgICAgICAgICAgICAgICAgICBwcm9taXNlID0gbWUucmVxdWVzdCggJ2JlZm9yZS1zZW5kLWZpbGUnLCBmaWxlLCBmdW5jdGlvbigpIHtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOacieWPr+iDveaWh+S7tuiiq3NraXDmjonkuobjgILmlofku7booqtza2lw5o6J5ZCO77yM54q25oCB5Z2R5a6a5LiN5pivUXVldWVkLlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBmaWxlLmdldFN0YXR1cygpID09PSBTdGF0dXMuUVVFVUVEICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lLm93bmVyLnRyaWdnZXIoICd1cGxvYWRTdGFydCcsIGZpbGUgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlLnNldFN0YXR1cyggU3RhdHVzLlBST0dSRVNTICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZpbGU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWUuX2ZpbmlzaEZpbGUoIGZpbGUgKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIOWmguaenOi/mOWcqHBlbmRpbmfkuK3vvIzliJnmm7/mjaLmiJDmlofku7bmnKzouqvjgIJcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZS5kb25lKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlkeCA9ICQuaW5BcnJheSggcHJvbWlzZSwgcGVuZGluZyApO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgfmlkeCAmJiBwZW5kaW5nLnNwbGljZSggaWR4LCAxLCBmaWxlICk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyBiZWZlb3JlLXNlbmQtZmlsZeeahOmSqeWtkOWwseaciemUmeivr+WPkeeUn+OAglxuICAgICAgICAgICAgICAgICAgICBwcm9taXNlLmZhaWwoZnVuY3Rpb24oIHJlYXNvbiApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUuc2V0U3RhdHVzKCBTdGF0dXMuRVJST1IsIHJlYXNvbiApO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWUub3duZXIudHJpZ2dlciggJ3VwbG9hZEVycm9yJywgZmlsZSwgcmVhc29uICk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZS5vd25lci50cmlnZ2VyKCAndXBsb2FkQ29tcGxldGUnLCBmaWxlICk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBwZW5kaW5nLnB1c2goIHByb21pc2UgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLy8g6K6p5Ye65L2N572u5LqG77yM5Y+v5Lul6K6p5YW25LuW5YiG54mH5byA5aeL5LiK5LygXG4gICAgICAgICAgICBfcG9wQmxvY2s6IGZ1bmN0aW9uKCBibG9jayApIHtcbiAgICAgICAgICAgICAgICB2YXIgaWR4ID0gJC5pbkFycmF5KCBibG9jaywgdGhpcy5wb29sICk7XG4gICAgXG4gICAgICAgICAgICAgICAgdGhpcy5wb29sLnNwbGljZSggaWR4LCAxICk7XG4gICAgICAgICAgICAgICAgYmxvY2suZmlsZS5yZW1hbmluZy0tO1xuICAgICAgICAgICAgICAgIHRoaXMucmVtYW5pbmctLTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvLyDlvIDlp4vkuIrkvKDvvIzlj6/ku6Xooqvmjonov4fjgILlpoLmnpxwcm9taXNl6KKrcmVqZWN05LqG77yM5YiZ6KGo56S66Lez6L+H5q2k5YiG54mH44CCXG4gICAgICAgICAgICBfc3RhcnRTZW5kOiBmdW5jdGlvbiggYmxvY2sgKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgZmlsZSA9IGJsb2NrLmZpbGUsXG4gICAgICAgICAgICAgICAgICAgIHByb21pc2U7XG4gICAgXG4gICAgICAgICAgICAgICAgbWUucG9vbC5wdXNoKCBibG9jayApO1xuICAgICAgICAgICAgICAgIG1lLnJlbWFuaW5nKys7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g5aaC5p6c5rKh5pyJ5YiG54mH77yM5YiZ55u05o6l5L2/55So5Y6f5aeL55qE44CCXG4gICAgICAgICAgICAgICAgLy8g5LiN5Lya5Lii5aSxY29udGVudC10eXBl5L+h5oGv44CCXG4gICAgICAgICAgICAgICAgYmxvY2suYmxvYiA9IGJsb2NrLmNodW5rcyA9PT0gMSA/IGZpbGUuc291cmNlIDpcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUuc291cmNlLnNsaWNlKCBibG9jay5zdGFydCwgYmxvY2suZW5kICk7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8gaG9vaywg5q+P5Liq5YiG54mH5Y+R6YCB5LmL5YmN5Y+v6IO96KaB5YGa5Lqb5byC5q2l55qE5LqL5oOF44CCXG4gICAgICAgICAgICAgICAgcHJvbWlzZSA9IG1lLnJlcXVlc3QoICdiZWZvcmUtc2VuZCcsIGJsb2NrLCBmdW5jdGlvbigpIHtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8g5pyJ5Y+v6IO95paH5Lu25bey57uP5LiK5Lyg5Ye66ZSZ5LqG77yM5omA5Lul5LiN6ZyA6KaB5YaN5Lyg6L6T5LqG44CCXG4gICAgICAgICAgICAgICAgICAgIGlmICggZmlsZS5nZXRTdGF0dXMoKSA9PT0gU3RhdHVzLlBST0dSRVNTICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWUuX2RvU2VuZCggYmxvY2sgKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lLl9wb3BCbG9jayggYmxvY2sgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIEJhc2UubmV4dFRpY2soIG1lLl9fdGljayApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g5aaC5p6c5Li6ZmFpbOS6hu+8jOWImei3s+i/h+atpOWIhueJh+OAglxuICAgICAgICAgICAgICAgIHByb21pc2UuZmFpbChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBmaWxlLnJlbWFuaW5nID09PSAxICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWUuX2ZpbmlzaEZpbGUoIGZpbGUgKS5hbHdheXMoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmxvY2sucGVyY2VudGFnZSA9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWUuX3BvcEJsb2NrKCBibG9jayApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lLm93bmVyLnRyaWdnZXIoICd1cGxvYWRDb21wbGV0ZScsIGZpbGUgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBCYXNlLm5leHRUaWNrKCBtZS5fX3RpY2sgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgYmxvY2sucGVyY2VudGFnZSA9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZS5fcG9wQmxvY2soIGJsb2NrICk7XG4gICAgICAgICAgICAgICAgICAgICAgICBCYXNlLm5leHRUaWNrKCBtZS5fX3RpY2sgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQGV2ZW50IHVwbG9hZEJlZm9yZVNlbmRcbiAgICAgICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3RcbiAgICAgICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIOm7mOiupOeahOS4iuS8oOWPguaVsO+8jOWPr+S7peaJqeWxleatpOWvueixoeadpeaOp+WItuS4iuS8oOWPguaVsOOAglxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIOW9k+afkOS4quaWh+S7tueahOWIhuWdl+WcqOWPkemAgeWJjeinpuWPke+8jOS4u+imgeeUqOadpeivoumXruaYr+WQpuimgea3u+WKoOmZhOW4puWPguaVsO+8jOWkp+aWh+S7tuWcqOW8gOi1t+WIhueJh+S4iuS8oOeahOWJjeaPkOS4i+atpOS6i+S7tuWPr+iDveS8muinpuWPkeWkmuasoeOAglxuICAgICAgICAgICAgICogQGZvciAgVXBsb2FkZXJcbiAgICAgICAgICAgICAqL1xuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAZXZlbnQgdXBsb2FkQWNjZXB0XG4gICAgICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0XG4gICAgICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gcmV0IOacjeWKoeerr+eahOi/lOWbnuaVsOaNru+8jGpzb27moLzlvI/vvIzlpoLmnpzmnI3liqHnq6/kuI3mmK9qc29u5qC85byP77yM5LuOcmV0Ll9yYXfkuK3lj5bmlbDmja7vvIzoh6rooYzop6PmnpDjgIJcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDlvZPmn5DkuKrmlofku7bkuIrkvKDliLDmnI3liqHnq6/lk43lupTlkI7vvIzkvJrmtL7pgIHmraTkuovku7bmnaXor6Lpl67mnI3liqHnq6/lk43lupTmmK/lkKbmnInmlYjjgILlpoLmnpzmraTkuovku7ZoYW5kbGVy6L+U5Zue5YC85Li6YGZhbHNlYCwg5YiZ5q2k5paH5Lu25bCG5rS+6YCBYHNlcnZlcmDnsbvlnovnmoRgdXBsb2FkRXJyb3Jg5LqL5Lu244CCXG4gICAgICAgICAgICAgKiBAZm9yICBVcGxvYWRlclxuICAgICAgICAgICAgICovXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBldmVudCB1cGxvYWRQcm9ncmVzc1xuICAgICAgICAgICAgICogQHBhcmFtIHtGaWxlfSBmaWxlIEZpbGXlr7nosaFcbiAgICAgICAgICAgICAqIEBwYXJhbSB7TnVtYmVyfSBwZXJjZW50YWdlIOS4iuS8oOi/m+W6plxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIOS4iuS8oOi/h+eoi+S4reinpuWPke+8jOaQuuW4puS4iuS8oOi/m+W6puOAglxuICAgICAgICAgICAgICogQGZvciAgVXBsb2FkZXJcbiAgICAgICAgICAgICAqL1xuICAgIFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAZXZlbnQgdXBsb2FkRXJyb3JcbiAgICAgICAgICAgICAqIEBwYXJhbSB7RmlsZX0gZmlsZSBGaWxl5a+56LGhXG4gICAgICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gcmVhc29uIOWHuumUmeeahGNvZGVcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDlvZPmlofku7bkuIrkvKDlh7rplJnml7bop6blj5HjgIJcbiAgICAgICAgICAgICAqIEBmb3IgIFVwbG9hZGVyXG4gICAgICAgICAgICAgKi9cbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQGV2ZW50IHVwbG9hZFN1Y2Nlc3NcbiAgICAgICAgICAgICAqIEBwYXJhbSB7RmlsZX0gZmlsZSBGaWxl5a+56LGhXG4gICAgICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gcmVzcG9uc2Ug5pyN5Yqh56uv6L+U5Zue55qE5pWw5o2uXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24g5b2T5paH5Lu25LiK5Lyg5oiQ5Yqf5pe26Kem5Y+R44CCXG4gICAgICAgICAgICAgKiBAZm9yICBVcGxvYWRlclxuICAgICAgICAgICAgICovXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBldmVudCB1cGxvYWRDb21wbGV0ZVxuICAgICAgICAgICAgICogQHBhcmFtIHtGaWxlfSBbZmlsZV0gRmlsZeWvueixoVxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIOS4jeeuoeaIkOWKn+aIluiAheWksei0pe+8jOaWh+S7tuS4iuS8oOWujOaIkOaXtuinpuWPkeOAglxuICAgICAgICAgICAgICogQGZvciAgVXBsb2FkZXJcbiAgICAgICAgICAgICAqL1xuICAgIFxuICAgICAgICAgICAgLy8g5YGa5LiK5Lyg5pON5L2c44CCXG4gICAgICAgICAgICBfZG9TZW5kOiBmdW5jdGlvbiggYmxvY2sgKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgb3duZXIgPSBtZS5vd25lcixcbiAgICAgICAgICAgICAgICAgICAgb3B0cyA9IG1lLm9wdGlvbnMsXG4gICAgICAgICAgICAgICAgICAgIGZpbGUgPSBibG9jay5maWxlLFxuICAgICAgICAgICAgICAgICAgICB0ciA9IG5ldyBUcmFuc3BvcnQoIG9wdHMgKSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YSA9ICQuZXh0ZW5kKHt9LCBvcHRzLmZvcm1EYXRhICksXG4gICAgICAgICAgICAgICAgICAgIGhlYWRlcnMgPSAkLmV4dGVuZCh7fSwgb3B0cy5oZWFkZXJzICksXG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3RBY2NlcHQsIHJldDtcbiAgICBcbiAgICAgICAgICAgICAgICBibG9jay50cmFuc3BvcnQgPSB0cjtcbiAgICBcbiAgICAgICAgICAgICAgICB0ci5vbiggJ2Rlc3Ryb3knLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGJsb2NrLnRyYW5zcG9ydDtcbiAgICAgICAgICAgICAgICAgICAgbWUuX3BvcEJsb2NrKCBibG9jayApO1xuICAgICAgICAgICAgICAgICAgICBCYXNlLm5leHRUaWNrKCBtZS5fX3RpY2sgKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDlub/mkq3kuIrkvKDov5vluqbjgILku6Xmlofku7bkuLrljZXkvY3jgIJcbiAgICAgICAgICAgICAgICB0ci5vbiggJ3Byb2dyZXNzJywgZnVuY3Rpb24oIHBlcmNlbnRhZ2UgKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0b3RhbFBlcmNlbnQgPSAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgdXBsb2FkZWQgPSAwO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyDlj6/og73msqHmnIlhYm9ydOaOie+8jHByb2dyZXNz6L+Y5piv5omn6KGM6L+b5p2l5LqG44CCXG4gICAgICAgICAgICAgICAgICAgIC8vIGlmICggIWZpbGUuYmxvY2tzICkge1xuICAgICAgICAgICAgICAgICAgICAvLyAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAvLyB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIHRvdGFsUGVyY2VudCA9IGJsb2NrLnBlcmNlbnRhZ2UgPSBwZXJjZW50YWdlO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAoIGJsb2NrLmNodW5rcyA+IDEgKSB7ICAgIC8vIOiuoeeul+aWh+S7tueahOaVtOS9k+mAn+W6puOAglxuICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKCBmaWxlLmJsb2NrcywgZnVuY3Rpb24oIF8sIHYgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXBsb2FkZWQgKz0gKHYucGVyY2VudGFnZSB8fCAwKSAqICh2LmVuZCAtIHYuc3RhcnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICB0b3RhbFBlcmNlbnQgPSB1cGxvYWRlZCAvIGZpbGUuc2l6ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgICAgICBvd25lci50cmlnZ2VyKCAndXBsb2FkUHJvZ3Jlc3MnLCBmaWxlLCB0b3RhbFBlcmNlbnQgfHwgMCApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIOeUqOadpeivoumXru+8jOaYr+WQpui/lOWbnueahOe7k+aenOaYr+aciemUmeivr+eahOOAglxuICAgICAgICAgICAgICAgIHJlcXVlc3RBY2NlcHQgPSBmdW5jdGlvbiggcmVqZWN0ICkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm47XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIHJldCA9IHRyLmdldFJlc3BvbnNlQXNKc29uKCkgfHwge307XG4gICAgICAgICAgICAgICAgICAgIHJldC5fcmF3ID0gdHIuZ2V0UmVzcG9uc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgZm4gPSBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8g5pyN5Yqh56uv5ZON5bqU5LqG77yM5LiN5Luj6KGo5oiQ5Yqf5LqG77yM6K+i6Zeu5piv5ZCm5ZON5bqU5q2j56Gu44CCXG4gICAgICAgICAgICAgICAgICAgIGlmICggIW93bmVyLnRyaWdnZXIoICd1cGxvYWRBY2NlcHQnLCBibG9jaywgcmV0LCBmbiApICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0ID0gcmVqZWN0IHx8ICdzZXJ2ZXInO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3Q7XG4gICAgICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDlsJ3or5Xph43or5XvvIznhLblkI7lub/mkq3mlofku7bkuIrkvKDlh7rplJnjgIJcbiAgICAgICAgICAgICAgICB0ci5vbiggJ2Vycm9yJywgZnVuY3Rpb24oIHR5cGUsIGZsYWcgKSB7XG4gICAgICAgICAgICAgICAgICAgIGJsb2NrLnJldHJpZWQgPSBibG9jay5yZXRyaWVkIHx8IDA7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIOiHquWKqOmHjeivlVxuICAgICAgICAgICAgICAgICAgICBpZiAoIGJsb2NrLmNodW5rcyA+IDEgJiYgfidodHRwLGFib3J0Jy5pbmRleE9mKCB0eXBlICkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBibG9jay5yZXRyaWVkIDwgb3B0cy5jaHVua1JldHJ5ICkge1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgYmxvY2sucmV0cmllZCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgdHIuc2VuZCgpO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaHR0cCBzdGF0dXMgNTAwIH4gNjAwXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoICFmbGFnICYmIHR5cGUgPT09ICdzZXJ2ZXInICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSByZXF1ZXN0QWNjZXB0KCB0eXBlICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlLnNldFN0YXR1cyggU3RhdHVzLkVSUk9SLCB0eXBlICk7XG4gICAgICAgICAgICAgICAgICAgICAgICBvd25lci50cmlnZ2VyKCAndXBsb2FkRXJyb3InLCBmaWxlLCB0eXBlICk7XG4gICAgICAgICAgICAgICAgICAgICAgICBvd25lci50cmlnZ2VyKCAndXBsb2FkQ29tcGxldGUnLCBmaWxlICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDkuIrkvKDmiJDlip9cbiAgICAgICAgICAgICAgICB0ci5vbiggJ2xvYWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlYXNvbjtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8g5aaC5p6c6Z2e6aKE5pyf77yM6L2s5ZCR5LiK5Lyg5Ye66ZSZ44CCXG4gICAgICAgICAgICAgICAgICAgIGlmICggKHJlYXNvbiA9IHJlcXVlc3RBY2NlcHQoKSkgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ci50cmlnZ2VyKCAnZXJyb3InLCByZWFzb24sIHRydWUgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyDlhajpg6jkuIrkvKDlrozmiJDjgIJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBmaWxlLnJlbWFuaW5nID09PSAxICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWUuX2ZpbmlzaEZpbGUoIGZpbGUsIHJldCApO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHIuZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g6YWN572u6buY6K6k55qE5LiK5Lyg5a2X5q6144CCXG4gICAgICAgICAgICAgICAgZGF0YSA9ICQuZXh0ZW5kKCBkYXRhLCB7XG4gICAgICAgICAgICAgICAgICAgIGlkOiBmaWxlLmlkLFxuICAgICAgICAgICAgICAgICAgICBuYW1lOiBmaWxlLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IGZpbGUudHlwZSxcbiAgICAgICAgICAgICAgICAgICAgbGFzdE1vZGlmaWVkRGF0ZTogZmlsZS5sYXN0TW9kaWZpZWREYXRlLFxuICAgICAgICAgICAgICAgICAgICBzaXplOiBmaWxlLnNpemVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICBibG9jay5jaHVua3MgPiAxICYmICQuZXh0ZW5kKCBkYXRhLCB7XG4gICAgICAgICAgICAgICAgICAgIGNodW5rczogYmxvY2suY2h1bmtzLFxuICAgICAgICAgICAgICAgICAgICBjaHVuazogYmxvY2suY2h1bmtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDlnKjlj5HpgIHkuYvpl7Tlj6/ku6Xmt7vliqDlrZfmrrXku4DkuYjnmoTjgILjgILjgIJcbiAgICAgICAgICAgICAgICAvLyDlpoLmnpzpu5jorqTnmoTlrZfmrrXkuI3lpJ/kvb/nlKjvvIzlj6/ku6XpgJrov4fnm5HlkKzmraTkuovku7bmnaXmianlsZVcbiAgICAgICAgICAgICAgICBvd25lci50cmlnZ2VyKCAndXBsb2FkQmVmb3JlU2VuZCcsIGJsb2NrLCBkYXRhLCBoZWFkZXJzICk7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g5byA5aeL5Y+R6YCB44CCXG4gICAgICAgICAgICAgICAgdHIuYXBwZW5kQmxvYiggb3B0cy5maWxlVmFsLCBibG9jay5ibG9iLCBmaWxlLm5hbWUgKTtcbiAgICAgICAgICAgICAgICB0ci5hcHBlbmQoIGRhdGEgKTtcbiAgICAgICAgICAgICAgICB0ci5zZXRSZXF1ZXN0SGVhZGVyKCBoZWFkZXJzICk7XG4gICAgICAgICAgICAgICAgdHIuc2VuZCgpO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8vIOWujOaIkOS4iuS8oOOAglxuICAgICAgICAgICAgX2ZpbmlzaEZpbGU6IGZ1bmN0aW9uKCBmaWxlLCByZXQsIGhkcyApIHtcbiAgICAgICAgICAgICAgICB2YXIgb3duZXIgPSB0aGlzLm93bmVyO1xuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBvd25lclxuICAgICAgICAgICAgICAgICAgICAgICAgLnJlcXVlc3QoICdhZnRlci1zZW5kLWZpbGUnLCBhcmd1bWVudHMsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUuc2V0U3RhdHVzKCBTdGF0dXMuQ09NUExFVEUgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvd25lci50cmlnZ2VyKCAndXBsb2FkU3VjY2VzcycsIGZpbGUsIHJldCwgaGRzICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgLmZhaWwoZnVuY3Rpb24oIHJlYXNvbiApIHtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDlpoLmnpzlpJbpg6jlt7Lnu4/moIforrDkuLppbnZhbGlk5LuA5LmI55qE77yM5LiN5YaN5pS554q25oCB44CCXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBmaWxlLmdldFN0YXR1cygpID09PSBTdGF0dXMuUFJPR1JFU1MgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUuc2V0U3RhdHVzKCBTdGF0dXMuRVJST1IsIHJlYXNvbiApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvd25lci50cmlnZ2VyKCAndXBsb2FkRXJyb3InLCBmaWxlLCByZWFzb24gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAuYWx3YXlzKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG93bmVyLnRyaWdnZXIoICd1cGxvYWRDb21wbGV0ZScsIGZpbGUgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IFJ1bnRpbWXnrqHnkIblmajvvIzotJ/otKNSdW50aW1l55qE6YCJ5oupLCDov57mjqVcbiAgICAgKi9cbiAgICBkZWZpbmUoJ3J1bnRpbWUvY29tcGJhc2UnLFtdLGZ1bmN0aW9uKCkge1xuICAgIFxuICAgICAgICBmdW5jdGlvbiBDb21wQmFzZSggb3duZXIsIHJ1bnRpbWUgKSB7XG4gICAgXG4gICAgICAgICAgICB0aGlzLm93bmVyID0gb3duZXI7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMgPSBvd25lci5vcHRpb25zO1xuICAgIFxuICAgICAgICAgICAgdGhpcy5nZXRSdW50aW1lID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJ1bnRpbWU7XG4gICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgdGhpcy5nZXRSdWlkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJ1bnRpbWUudWlkO1xuICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBvd25lci50cmlnZ2VyLmFwcGx5KCBvd25lciwgYXJndW1lbnRzICk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIHJldHVybiBDb21wQmFzZTtcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IEh0bWw1UnVudGltZVxuICAgICAqL1xuICAgIGRlZmluZSgncnVudGltZS9odG1sNS9ydW50aW1lJyxbXG4gICAgICAgICdiYXNlJyxcbiAgICAgICAgJ3J1bnRpbWUvcnVudGltZScsXG4gICAgICAgICdydW50aW1lL2NvbXBiYXNlJ1xuICAgIF0sIGZ1bmN0aW9uKCBCYXNlLCBSdW50aW1lLCBDb21wQmFzZSApIHtcbiAgICBcbiAgICAgICAgdmFyIHR5cGUgPSAnaHRtbDUnLFxuICAgICAgICAgICAgY29tcG9uZW50cyA9IHt9O1xuICAgIFxuICAgICAgICBmdW5jdGlvbiBIdG1sNVJ1bnRpbWUoKSB7XG4gICAgICAgICAgICB2YXIgcG9vbCA9IHt9LFxuICAgICAgICAgICAgICAgIG1lID0gdGhpcyxcbiAgICAgICAgICAgICAgICBkZXN0b3J5ID0gdGhpcy5kZXN0b3J5O1xuICAgIFxuICAgICAgICAgICAgUnVudGltZS5hcHBseSggbWUsIGFyZ3VtZW50cyApO1xuICAgICAgICAgICAgbWUudHlwZSA9IHR5cGU7XG4gICAgXG4gICAgXG4gICAgICAgICAgICAvLyDov5nkuKrmlrnms5XnmoTosIPnlKjogIXvvIzlrp7pmYXkuIrmmK9SdW50aW1lQ2xpZW50XG4gICAgICAgICAgICBtZS5leGVjID0gZnVuY3Rpb24oIGNvbXAsIGZuLyosIGFyZ3MuLi4qLykge1xuICAgICAgICAgICAgICAgIHZhciBjbGllbnQgPSB0aGlzLFxuICAgICAgICAgICAgICAgICAgICB1aWQgPSBjbGllbnQudWlkLFxuICAgICAgICAgICAgICAgICAgICBhcmdzID0gQmFzZS5zbGljZSggYXJndW1lbnRzLCAyICksXG4gICAgICAgICAgICAgICAgICAgIGluc3RhbmNlO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggY29tcG9uZW50c1sgY29tcCBdICkge1xuICAgICAgICAgICAgICAgICAgICBpbnN0YW5jZSA9IHBvb2xbIHVpZCBdID0gcG9vbFsgdWlkIF0gfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXcgY29tcG9uZW50c1sgY29tcCBdKCBjbGllbnQsIG1lICk7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGlmICggaW5zdGFuY2VbIGZuIF0gKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaW5zdGFuY2VbIGZuIF0uYXBwbHkoIGluc3RhbmNlLCBhcmdzICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgbWUuZGVzdG9yeSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIC8vIEB0b2RvIOWIoOmZpOaxoOWtkOS4reeahOaJgOacieWunuS+i1xuICAgICAgICAgICAgICAgIHJldHVybiBkZXN0b3J5ICYmIGRlc3RvcnkuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIFxuICAgICAgICBCYXNlLmluaGVyaXRzKCBSdW50aW1lLCB7XG4gICAgICAgICAgICBjb25zdHJ1Y3RvcjogSHRtbDVSdW50aW1lLFxuICAgIFxuICAgICAgICAgICAgLy8g5LiN6ZyA6KaB6L+e5o6l5YW25LuW56iL5bqP77yM55u05o6l5omn6KGMY2FsbGJhY2tcbiAgICAgICAgICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgbWUudHJpZ2dlcigncmVhZHknKTtcbiAgICAgICAgICAgICAgICB9LCAxICk7XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgIH0pO1xuICAgIFxuICAgICAgICAvLyDms6jlhoxDb21wb25lbnRzXG4gICAgICAgIEh0bWw1UnVudGltZS5yZWdpc3RlciA9IGZ1bmN0aW9uKCBuYW1lLCBjb21wb25lbnQgKSB7XG4gICAgICAgICAgICB2YXIga2xhc3MgPSBjb21wb25lbnRzWyBuYW1lIF0gPSBCYXNlLmluaGVyaXRzKCBDb21wQmFzZSwgY29tcG9uZW50ICk7XG4gICAgICAgICAgICByZXR1cm4ga2xhc3M7XG4gICAgICAgIH07XG4gICAgXG4gICAgICAgIC8vIOazqOWGjGh0bWw16L+Q6KGM5pe244CCXG4gICAgICAgIC8vIOWPquacieWcqOaUr+aMgeeahOWJjeaPkOS4i+azqOWGjOOAglxuICAgICAgICBpZiAoIHdpbmRvdy5CbG9iICYmIHdpbmRvdy5GaWxlUmVhZGVyICYmIHdpbmRvdy5EYXRhVmlldyApIHtcbiAgICAgICAgICAgIFJ1bnRpbWUuYWRkUnVudGltZSggdHlwZSwgSHRtbDVSdW50aW1lICk7XG4gICAgICAgIH1cbiAgICBcbiAgICAgICAgcmV0dXJuIEh0bWw1UnVudGltZTtcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IEJsb2IgSHRtbOWunueOsFxuICAgICAqL1xuICAgIGRlZmluZSgncnVudGltZS9odG1sNS9ibG9iJyxbXG4gICAgICAgICdydW50aW1lL2h0bWw1L3J1bnRpbWUnLFxuICAgICAgICAnbGliL2Jsb2InXG4gICAgXSwgZnVuY3Rpb24oIEh0bWw1UnVudGltZSwgQmxvYiApIHtcbiAgICBcbiAgICAgICAgcmV0dXJuIEh0bWw1UnVudGltZS5yZWdpc3RlciggJ0Jsb2InLCB7XG4gICAgICAgICAgICBzbGljZTogZnVuY3Rpb24oIHN0YXJ0LCBlbmQgKSB7XG4gICAgICAgICAgICAgICAgdmFyIGJsb2IgPSB0aGlzLm93bmVyLnNvdXJjZSxcbiAgICAgICAgICAgICAgICAgICAgc2xpY2UgPSBibG9iLnNsaWNlIHx8IGJsb2Iud2Via2l0U2xpY2UgfHwgYmxvYi5tb3pTbGljZTtcbiAgICBcbiAgICAgICAgICAgICAgICBibG9iID0gc2xpY2UuY2FsbCggYmxvYiwgc3RhcnQsIGVuZCApO1xuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQmxvYiggdGhpcy5nZXRSdWlkKCksIGJsb2IgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgLyoqXG4gICAgICogQGZpbGVPdmVydmlldyBGaWxlUGlja2VyXG4gICAgICovXG4gICAgZGVmaW5lKCdydW50aW1lL2h0bWw1L2ZpbGVwaWNrZXInLFtcbiAgICAgICAgJ2Jhc2UnLFxuICAgICAgICAncnVudGltZS9odG1sNS9ydW50aW1lJ1xuICAgIF0sIGZ1bmN0aW9uKCBCYXNlLCBIdG1sNVJ1bnRpbWUgKSB7XG4gICAgXG4gICAgICAgIHZhciAkID0gQmFzZS4kO1xuICAgIFxuICAgICAgICByZXR1cm4gSHRtbDVSdW50aW1lLnJlZ2lzdGVyKCAnRmlsZVBpY2tlcicsIHtcbiAgICAgICAgICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBjb250YWluZXIgPSB0aGlzLmdldFJ1bnRpbWUoKS5nZXRDb250YWluZXIoKSxcbiAgICAgICAgICAgICAgICAgICAgbWUgPSB0aGlzLFxuICAgICAgICAgICAgICAgICAgICBvd25lciA9IG1lLm93bmVyLFxuICAgICAgICAgICAgICAgICAgICBvcHRzID0gbWUub3B0aW9ucyxcbiAgICAgICAgICAgICAgICAgICAgbGFibGUgPSAkKCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsYWJlbCcpICksXG4gICAgICAgICAgICAgICAgICAgIGlucHV0ID0gJCggZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKSApLFxuICAgICAgICAgICAgICAgICAgICBhcnIsIGksIGxlbiwgbW91c2VIYW5kbGVyO1xuICAgIFxuICAgICAgICAgICAgICAgIGlucHV0LmF0dHIoICd0eXBlJywgJ2ZpbGUnICk7XG4gICAgICAgICAgICAgICAgaW5wdXQuYXR0ciggJ25hbWUnLCBvcHRzLm5hbWUgKTtcbiAgICAgICAgICAgICAgICBpbnB1dC5hZGRDbGFzcygnd2VidXBsb2FkZXItZWxlbWVudC1pbnZpc2libGUnKTtcbiAgICBcbiAgICAgICAgICAgICAgICBsYWJsZS5vbiggJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGlucHV0LnRyaWdnZXIoJ2NsaWNrJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgbGFibGUuY3NzKHtcbiAgICAgICAgICAgICAgICAgICAgb3BhY2l0eTogMCxcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICcxMDAlJyxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAnMTAwJScsXG4gICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdibG9jaycsXG4gICAgICAgICAgICAgICAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxuICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAnI2ZmZmZmZidcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoIG9wdHMubXVsdGlwbGUgKSB7XG4gICAgICAgICAgICAgICAgICAgIGlucHV0LmF0dHIoICdtdWx0aXBsZScsICdtdWx0aXBsZScgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgLy8gQHRvZG8gRmlyZWZveOS4jeaUr+aMgeWNleeLrOaMh+WumuWQjue8gFxuICAgICAgICAgICAgICAgIGlmICggb3B0cy5hY2NlcHQgJiYgb3B0cy5hY2NlcHQubGVuZ3RoID4gMCApIHtcbiAgICAgICAgICAgICAgICAgICAgYXJyID0gW107XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGZvciAoIGkgPSAwLCBsZW4gPSBvcHRzLmFjY2VwdC5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyci5wdXNoKCBvcHRzLmFjY2VwdFsgaSBdLm1pbWVUeXBlcyApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGlucHV0LmF0dHIoICdhY2NlcHQnLCBhcnIuam9pbignLCcpICk7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIGNvbnRhaW5lci5hcHBlbmQoIGlucHV0ICk7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyLmFwcGVuZCggbGFibGUgKTtcbiAgICBcbiAgICAgICAgICAgICAgICBtb3VzZUhhbmRsZXIgPSBmdW5jdGlvbiggZSApIHtcbiAgICAgICAgICAgICAgICAgICAgb3duZXIudHJpZ2dlciggZS50eXBlICk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgICAgICBpbnB1dC5vbiggJ2NoYW5nZScsIGZ1bmN0aW9uKCBlICkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSBhcmd1bWVudHMuY2FsbGVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmU7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIG1lLmZpbGVzID0gZS50YXJnZXQuZmlsZXM7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIHJlc2V0IGlucHV0XG4gICAgICAgICAgICAgICAgICAgIGNsb25lID0gdGhpcy5jbG9uZU5vZGUoIHRydWUgKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZCggY2xvbmUsIHRoaXMgKTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaW5wdXQub2ZmKCk7XG4gICAgICAgICAgICAgICAgICAgIGlucHV0ID0gJCggY2xvbmUgKS5vbiggJ2NoYW5nZScsIGZuIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAub24oICdtb3VzZWVudGVyIG1vdXNlbGVhdmUnLCBtb3VzZUhhbmRsZXIgKTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgb3duZXIudHJpZ2dlcignY2hhbmdlJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgbGFibGUub24oICdtb3VzZWVudGVyIG1vdXNlbGVhdmUnLCBtb3VzZUhhbmRsZXIgKTtcbiAgICBcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgXG4gICAgICAgICAgICBnZXRGaWxlczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmlsZXM7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgLy8gdG9kb1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBUZXJtczpcbiAgICAgKlxuICAgICAqIFVpbnQ4QXJyYXksIEZpbGVSZWFkZXIsIEJsb2JCdWlsZGVyLCBhdG9iLCBBcnJheUJ1ZmZlclxuICAgICAqIEBmaWxlT3ZlcnZpZXcgSW1hZ2Xmjqfku7ZcbiAgICAgKi9cbiAgICBkZWZpbmUoJ3J1bnRpbWUvaHRtbDUvdXRpbCcsW1xuICAgICAgICAnYmFzZSdcbiAgICBdLCBmdW5jdGlvbiggQmFzZSApIHtcbiAgICBcbiAgICAgICAgdmFyIHVybEFQSSA9IHdpbmRvdy5jcmVhdGVPYmplY3RVUkwgJiYgd2luZG93IHx8XG4gICAgICAgICAgICAgICAgd2luZG93LlVSTCAmJiBVUkwucmV2b2tlT2JqZWN0VVJMICYmIFVSTCB8fFxuICAgICAgICAgICAgICAgIHdpbmRvdy53ZWJraXRVUkwsXG4gICAgICAgICAgICBjcmVhdGVPYmplY3RVUkwgPSBCYXNlLm5vb3AsXG4gICAgICAgICAgICByZXZva2VPYmplY3RVUkwgPSBjcmVhdGVPYmplY3RVUkw7XG4gICAgXG4gICAgICAgIGlmICggdXJsQVBJICkge1xuICAgIFxuICAgICAgICAgICAgLy8g5pu05a6J5YWo55qE5pa55byP6LCD55So77yM5q+U5aaCYW5kcm9pZOmHjOmdouWwseiDveaKimNvbnRleHTmlLnmiJDlhbbku5bnmoTlr7nosaHjgIJcbiAgICAgICAgICAgIGNyZWF0ZU9iamVjdFVSTCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB1cmxBUEkuY3JlYXRlT2JqZWN0VVJMLmFwcGx5KCB1cmxBUEksIGFyZ3VtZW50cyApO1xuICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgIHJldm9rZU9iamVjdFVSTCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB1cmxBUEkucmV2b2tlT2JqZWN0VVJMLmFwcGx5KCB1cmxBUEksIGFyZ3VtZW50cyApO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIFxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY3JlYXRlT2JqZWN0VVJMOiBjcmVhdGVPYmplY3RVUkwsXG4gICAgICAgICAgICByZXZva2VPYmplY3RVUkw6IHJldm9rZU9iamVjdFVSTCxcbiAgICBcbiAgICAgICAgICAgIGRhdGFVUkwyQmxvYjogZnVuY3Rpb24oIGRhdGFVUkkgKSB7XG4gICAgICAgICAgICAgICAgdmFyIGJ5dGVTdHIsIGludEFycmF5LCBhYiwgaSwgbWltZXR5cGUsIHBhcnRzO1xuICAgIFxuICAgICAgICAgICAgICAgIHBhcnRzID0gZGF0YVVSSS5zcGxpdCgnLCcpO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggfnBhcnRzWyAwIF0uaW5kZXhPZignYmFzZTY0JykgKSB7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGVTdHIgPSBhdG9iKCBwYXJ0c1sgMSBdICk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYnl0ZVN0ciA9IGRlY29kZVVSSUNvbXBvbmVudCggcGFydHNbIDEgXSApO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBhYiA9IG5ldyBBcnJheUJ1ZmZlciggYnl0ZVN0ci5sZW5ndGggKTtcbiAgICAgICAgICAgICAgICBpbnRBcnJheSA9IG5ldyBVaW50OEFycmF5KCBhYiApO1xuICAgIFxuICAgICAgICAgICAgICAgIGZvciAoIGkgPSAwOyBpIDwgYnl0ZVN0ci5sZW5ndGg7IGkrKyApIHtcbiAgICAgICAgICAgICAgICAgICAgaW50QXJyYXlbIGkgXSA9IGJ5dGVTdHIuY2hhckNvZGVBdCggaSApO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBtaW1ldHlwZSA9IHBhcnRzWyAwIF0uc3BsaXQoJzonKVsgMSBdLnNwbGl0KCc7JylbIDAgXTtcbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5hcnJheUJ1ZmZlclRvQmxvYiggYWIsIG1pbWV0eXBlICk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgZGF0YVVSTDJBcnJheUJ1ZmZlcjogZnVuY3Rpb24oIGRhdGFVUkkgKSB7XG4gICAgICAgICAgICAgICAgdmFyIGJ5dGVTdHIsIGludEFycmF5LCBpLCBwYXJ0cztcbiAgICBcbiAgICAgICAgICAgICAgICBwYXJ0cyA9IGRhdGFVUkkuc3BsaXQoJywnKTtcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoIH5wYXJ0c1sgMCBdLmluZGV4T2YoJ2Jhc2U2NCcpICkge1xuICAgICAgICAgICAgICAgICAgICBieXRlU3RyID0gYXRvYiggcGFydHNbIDEgXSApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGVTdHIgPSBkZWNvZGVVUklDb21wb25lbnQoIHBhcnRzWyAxIF0gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgaW50QXJyYXkgPSBuZXcgVWludDhBcnJheSggYnl0ZVN0ci5sZW5ndGggKTtcbiAgICBcbiAgICAgICAgICAgICAgICBmb3IgKCBpID0gMDsgaSA8IGJ5dGVTdHIubGVuZ3RoOyBpKysgKSB7XG4gICAgICAgICAgICAgICAgICAgIGludEFycmF5WyBpIF0gPSBieXRlU3RyLmNoYXJDb2RlQXQoIGkgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIGludEFycmF5LmJ1ZmZlcjtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBhcnJheUJ1ZmZlclRvQmxvYjogZnVuY3Rpb24oIGJ1ZmZlciwgdHlwZSApIHtcbiAgICAgICAgICAgICAgICB2YXIgYnVpbGRlciA9IHdpbmRvdy5CbG9iQnVpbGRlciB8fCB3aW5kb3cuV2ViS2l0QmxvYkJ1aWxkZXIsXG4gICAgICAgICAgICAgICAgICAgIGJiO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIGFuZHJvaWTkuI3mlK/mjIHnm7TmjqVuZXcgQmxvYiwg5Y+q6IO95YCf5YqpYmxvYmJ1aWxkZXIuXG4gICAgICAgICAgICAgICAgaWYgKCBidWlsZGVyICkge1xuICAgICAgICAgICAgICAgICAgICBiYiA9IG5ldyBidWlsZGVyKCk7XG4gICAgICAgICAgICAgICAgICAgIGJiLmFwcGVuZCggYnVmZmVyICk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBiYi5nZXRCbG9iKCB0eXBlICk7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQmxvYihbIGJ1ZmZlciBdLCB0eXBlID8geyB0eXBlOiB0eXBlIH0gOiB7fSApO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8vIOaKveWHuuadpeS4u+imgeaYr+S4uuS6huino+WGs2FuZHJvaWTkuIvpnaJjYW52YXMudG9EYXRhVXJs5LiN5pSv5oyBanBlZy5cbiAgICAgICAgICAgIC8vIOS9oOW+l+WIsOeahOe7k+aenOaYr3BuZy5cbiAgICAgICAgICAgIGNhbnZhc1RvRGF0YVVybDogZnVuY3Rpb24oIGNhbnZhcywgdHlwZSwgcXVhbGl0eSApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FudmFzLnRvRGF0YVVSTCggdHlwZSwgcXVhbGl0eSAvIDEwMCApO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8vIGltYWdlbWVhdOS8muWkjeWGmei/meS4quaWueazle+8jOWmguaenOeUqOaIt+mAieaLqeWKoOi9vemCo+S4quaWh+S7tuS6hueahOivneOAglxuICAgICAgICAgICAgcGFyc2VNZXRhOiBmdW5jdGlvbiggYmxvYiwgY2FsbGJhY2sgKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soIGZhbHNlLCB7fSk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLy8gaW1hZ2VtZWF05Lya5aSN5YaZ6L+Z5Liq5pa55rOV77yM5aaC5p6c55So5oi36YCJ5oup5Yqg6L296YKj5Liq5paH5Lu25LqG55qE6K+d44CCXG4gICAgICAgICAgICB1cGRhdGVJbWFnZUhlYWQ6IGZ1bmN0aW9uKCBkYXRhICkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkYXRhO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0pO1xuICAgIC8qKlxuICAgICAqIFRlcm1zOlxuICAgICAqXG4gICAgICogVWludDhBcnJheSwgRmlsZVJlYWRlciwgQmxvYkJ1aWxkZXIsIGF0b2IsIEFycmF5QnVmZmVyXG4gICAgICogQGZpbGVPdmVydmlldyBJbWFnZeaOp+S7tlxuICAgICAqL1xuICAgIGRlZmluZSgncnVudGltZS9odG1sNS9pbWFnZW1ldGEnLFtcbiAgICAgICAgJ3J1bnRpbWUvaHRtbDUvdXRpbCdcbiAgICBdLCBmdW5jdGlvbiggVXRpbCApIHtcbiAgICBcbiAgICAgICAgdmFyIGFwaTtcbiAgICBcbiAgICAgICAgYXBpID0ge1xuICAgICAgICAgICAgcGFyc2Vyczoge1xuICAgICAgICAgICAgICAgIDB4ZmZlMTogW11cbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBtYXhNZXRhRGF0YVNpemU6IDI2MjE0NCxcbiAgICBcbiAgICAgICAgICAgIHBhcnNlOiBmdW5jdGlvbiggYmxvYiwgY2IgKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgZnIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgIFxuICAgICAgICAgICAgICAgIGZyLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBjYiggZmFsc2UsIG1lLl9wYXJzZSggdGhpcy5yZXN1bHQgKSApO1xuICAgICAgICAgICAgICAgICAgICBmciA9IGZyLm9ubG9hZCA9IGZyLm9uZXJyb3IgPSBudWxsO1xuICAgICAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgICAgICAgICAgZnIub25lcnJvciA9IGZ1bmN0aW9uKCBlICkge1xuICAgICAgICAgICAgICAgICAgICBjYiggZS5tZXNzYWdlICk7XG4gICAgICAgICAgICAgICAgICAgIGZyID0gZnIub25sb2FkID0gZnIub25lcnJvciA9IG51bGw7XG4gICAgICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgICAgICBibG9iID0gYmxvYi5zbGljZSggMCwgbWUubWF4TWV0YURhdGFTaXplICk7XG4gICAgICAgICAgICAgICAgZnIucmVhZEFzQXJyYXlCdWZmZXIoIGJsb2IuZ2V0U291cmNlKCkgKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBfcGFyc2U6IGZ1bmN0aW9uKCBidWZmZXIsIG5vUGFyc2UgKSB7XG4gICAgICAgICAgICAgICAgaWYgKCBidWZmZXIuYnl0ZUxlbmd0aCA8IDYgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgdmFyIGRhdGF2aWV3ID0gbmV3IERhdGFWaWV3KCBidWZmZXIgKSxcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ID0gMixcbiAgICAgICAgICAgICAgICAgICAgbWF4T2Zmc2V0ID0gZGF0YXZpZXcuYnl0ZUxlbmd0aCAtIDQsXG4gICAgICAgICAgICAgICAgICAgIGhlYWRMZW5ndGggPSBvZmZzZXQsXG4gICAgICAgICAgICAgICAgICAgIHJldCA9IHt9LFxuICAgICAgICAgICAgICAgICAgICBtYXJrZXJCeXRlcywgbWFya2VyTGVuZ3RoLCBwYXJzZXJzLCBpO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggZGF0YXZpZXcuZ2V0VWludDE2KCAwICkgPT09IDB4ZmZkOCApIHtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKCBvZmZzZXQgPCBtYXhPZmZzZXQgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXJCeXRlcyA9IGRhdGF2aWV3LmdldFVpbnQxNiggb2Zmc2V0ICk7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIG1hcmtlckJ5dGVzID49IDB4ZmZlMCAmJiBtYXJrZXJCeXRlcyA8PSAweGZmZWYgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyQnl0ZXMgPT09IDB4ZmZmZSApIHtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXJMZW5ndGggPSBkYXRhdmlldy5nZXRVaW50MTYoIG9mZnNldCArIDIgKSArIDI7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBvZmZzZXQgKyBtYXJrZXJMZW5ndGggPiBkYXRhdmlldy5ieXRlTGVuZ3RoICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VycyA9IGFwaS5wYXJzZXJzWyBtYXJrZXJCeXRlcyBdO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggIW5vUGFyc2UgJiYgcGFyc2VycyApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICggaSA9IDA7IGkgPCBwYXJzZXJzLmxlbmd0aDsgaSArPSAxICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2Vyc1sgaSBdLmNhbGwoIGFwaSwgZGF0YXZpZXcsIG9mZnNldCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyTGVuZ3RoLCByZXQgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXQgKz0gbWFya2VyTGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlYWRMZW5ndGggPSBvZmZzZXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGlmICggaGVhZExlbmd0aCA+IDYgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGJ1ZmZlci5zbGljZSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXQuaW1hZ2VIZWFkID0gYnVmZmVyLnNsaWNlKCAyLCBoZWFkTGVuZ3RoICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdvcmthcm91bmQgZm9yIElFMTAsIHdoaWNoIGRvZXMgbm90IHlldFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHN1cHBvcnQgQXJyYXlCdWZmZXIuc2xpY2U6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0LmltYWdlSGVhZCA9IG5ldyBVaW50OEFycmF5KCBidWZmZXIgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnN1YmFycmF5KCAyLCBoZWFkTGVuZ3RoICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICB1cGRhdGVJbWFnZUhlYWQ6IGZ1bmN0aW9uKCBidWZmZXIsIGhlYWQgKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRhdGEgPSB0aGlzLl9wYXJzZSggYnVmZmVyLCB0cnVlICksXG4gICAgICAgICAgICAgICAgICAgIGJ1ZjEsIGJ1ZjIsIGJvZHlvZmZzZXQ7XG4gICAgXG4gICAgXG4gICAgICAgICAgICAgICAgYm9keW9mZnNldCA9IDI7XG4gICAgICAgICAgICAgICAgaWYgKCBkYXRhLmltYWdlSGVhZCApIHtcbiAgICAgICAgICAgICAgICAgICAgYm9keW9mZnNldCA9IDIgKyBkYXRhLmltYWdlSGVhZC5ieXRlTGVuZ3RoO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoIGJ1ZmZlci5zbGljZSApIHtcbiAgICAgICAgICAgICAgICAgICAgYnVmMiA9IGJ1ZmZlci5zbGljZSggYm9keW9mZnNldCApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGJ1ZjIgPSBuZXcgVWludDhBcnJheSggYnVmZmVyICkuc3ViYXJyYXkoIGJvZHlvZmZzZXQgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgYnVmMSA9IG5ldyBVaW50OEFycmF5KCBoZWFkLmJ5dGVMZW5ndGggKyAyICsgYnVmMi5ieXRlTGVuZ3RoICk7XG4gICAgXG4gICAgICAgICAgICAgICAgYnVmMVsgMCBdID0gMHhGRjtcbiAgICAgICAgICAgICAgICBidWYxWyAxIF0gPSAweEQ4O1xuICAgICAgICAgICAgICAgIGJ1ZjEuc2V0KCBuZXcgVWludDhBcnJheSggaGVhZCApLCAyICk7XG4gICAgICAgICAgICAgICAgYnVmMS5zZXQoIG5ldyBVaW50OEFycmF5KCBidWYyICksIGhlYWQuYnl0ZUxlbmd0aCArIDIgKTtcbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gYnVmMS5idWZmZXI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgXG4gICAgICAgIFV0aWwucGFyc2VNZXRhID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gYXBpLnBhcnNlLmFwcGx5KCBhcGksIGFyZ3VtZW50cyApO1xuICAgICAgICB9O1xuICAgIFxuICAgICAgICBVdGlsLnVwZGF0ZUltYWdlSGVhZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIGFwaS51cGRhdGVJbWFnZUhlYWQuYXBwbHkoIGFwaSwgYXJndW1lbnRzICk7XG4gICAgICAgIH07XG4gICAgXG4gICAgICAgIHJldHVybiBhcGk7XG4gICAgfSk7XG4gICAgLyoqXG4gICAgICog5Luj56CB5p2l6Ieq5LqO77yaaHR0cHM6Ly9naXRodWIuY29tL2JsdWVpbXAvSmF2YVNjcmlwdC1Mb2FkLUltYWdlXG4gICAgICog5pqC5pe26aG555uu5Lit5Y+q55So5LqGb3JpZW50YXRpb24uXG4gICAgICpcbiAgICAgKiDljrvpmaTkuoYgRXhpZiBTdWIgSUZEIFBvaW50ZXIsIEdQUyBJbmZvIElGRCBQb2ludGVyLCBFeGlmIFRodW1ibmFpbC5cbiAgICAgKiBAZmlsZU92ZXJ2aWV3IEVYSUbop6PmnpBcbiAgICAgKi9cbiAgICBcbiAgICAvLyBTYW1wbGVcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyBNYWtlIDogQXBwbGVcbiAgICAvLyBNb2RlbCA6IGlQaG9uZSA0U1xuICAgIC8vIE9yaWVudGF0aW9uIDogMVxuICAgIC8vIFhSZXNvbHV0aW9uIDogNzIgWzcyLzFdXG4gICAgLy8gWVJlc29sdXRpb24gOiA3MiBbNzIvMV1cbiAgICAvLyBSZXNvbHV0aW9uVW5pdCA6IDJcbiAgICAvLyBTb2Z0d2FyZSA6IFF1aWNrVGltZSA3LjcuMVxuICAgIC8vIERhdGVUaW1lIDogMjAxMzowOTowMSAyMjo1Mzo1NVxuICAgIC8vIEV4aWZJRkRQb2ludGVyIDogMTkwXG4gICAgLy8gRXhwb3N1cmVUaW1lIDogMC4wNTg4MjM1Mjk0MTE3NjQ3MDUgWzEvMTddXG4gICAgLy8gRk51bWJlciA6IDIuNCBbMTIvNV1cbiAgICAvLyBFeHBvc3VyZVByb2dyYW0gOiBOb3JtYWwgcHJvZ3JhbVxuICAgIC8vIElTT1NwZWVkUmF0aW5ncyA6IDgwMFxuICAgIC8vIEV4aWZWZXJzaW9uIDogMDIyMFxuICAgIC8vIERhdGVUaW1lT3JpZ2luYWwgOiAyMDEzOjA5OjAxIDIyOjUyOjUxXG4gICAgLy8gRGF0ZVRpbWVEaWdpdGl6ZWQgOiAyMDEzOjA5OjAxIDIyOjUyOjUxXG4gICAgLy8gQ29tcG9uZW50c0NvbmZpZ3VyYXRpb24gOiBZQ2JDclxuICAgIC8vIFNodXR0ZXJTcGVlZFZhbHVlIDogNC4wNTg4OTM1MTU3NjQ0MjZcbiAgICAvLyBBcGVydHVyZVZhbHVlIDogMi41MjYwNjg4MjE2ODkyNTk3IFs0ODQ1LzE5MThdXG4gICAgLy8gQnJpZ2h0bmVzc1ZhbHVlIDogLTAuMzEyNjY4NjYwMTk5ODM5NVxuICAgIC8vIE1ldGVyaW5nTW9kZSA6IFBhdHRlcm5cbiAgICAvLyBGbGFzaCA6IEZsYXNoIGRpZCBub3QgZmlyZSwgY29tcHVsc29yeSBmbGFzaCBtb2RlXG4gICAgLy8gRm9jYWxMZW5ndGggOiA0LjI4IFsxMDcvMjVdXG4gICAgLy8gU3ViamVjdEFyZWEgOiBbNCB2YWx1ZXNdXG4gICAgLy8gRmxhc2hwaXhWZXJzaW9uIDogMDEwMFxuICAgIC8vIENvbG9yU3BhY2UgOiAxXG4gICAgLy8gUGl4ZWxYRGltZW5zaW9uIDogMjQ0OFxuICAgIC8vIFBpeGVsWURpbWVuc2lvbiA6IDMyNjRcbiAgICAvLyBTZW5zaW5nTWV0aG9kIDogT25lLWNoaXAgY29sb3IgYXJlYSBzZW5zb3JcbiAgICAvLyBFeHBvc3VyZU1vZGUgOiAwXG4gICAgLy8gV2hpdGVCYWxhbmNlIDogQXV0byB3aGl0ZSBiYWxhbmNlXG4gICAgLy8gRm9jYWxMZW5ndGhJbjM1bW1GaWxtIDogMzVcbiAgICAvLyBTY2VuZUNhcHR1cmVUeXBlIDogU3RhbmRhcmRcbiAgICBkZWZpbmUoJ3J1bnRpbWUvaHRtbDUvaW1hZ2VtZXRhL2V4aWYnLFtcbiAgICAgICAgJ2Jhc2UnLFxuICAgICAgICAncnVudGltZS9odG1sNS9pbWFnZW1ldGEnXG4gICAgXSwgZnVuY3Rpb24oIEJhc2UsIEltYWdlTWV0YSApIHtcbiAgICBcbiAgICAgICAgdmFyIEVYSUYgPSB7fTtcbiAgICBcbiAgICAgICAgRVhJRi5FeGlmTWFwID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfTtcbiAgICBcbiAgICAgICAgRVhJRi5FeGlmTWFwLnByb3RvdHlwZS5tYXAgPSB7XG4gICAgICAgICAgICAnT3JpZW50YXRpb24nOiAweDAxMTJcbiAgICAgICAgfTtcbiAgICBcbiAgICAgICAgRVhJRi5FeGlmTWFwLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiggaWQgKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpc1sgaWQgXSB8fCB0aGlzWyB0aGlzLm1hcFsgaWQgXSBdO1xuICAgICAgICB9O1xuICAgIFxuICAgICAgICBFWElGLmV4aWZUYWdUeXBlcyA9IHtcbiAgICAgICAgICAgIC8vIGJ5dGUsIDgtYml0IHVuc2lnbmVkIGludDpcbiAgICAgICAgICAgIDE6IHtcbiAgICAgICAgICAgICAgICBnZXRWYWx1ZTogZnVuY3Rpb24oIGRhdGFWaWV3LCBkYXRhT2Zmc2V0ICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGF0YVZpZXcuZ2V0VWludDgoIGRhdGFPZmZzZXQgKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHNpemU6IDFcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvLyBhc2NpaSwgOC1iaXQgYnl0ZTpcbiAgICAgICAgICAgIDI6IHtcbiAgICAgICAgICAgICAgICBnZXRWYWx1ZTogZnVuY3Rpb24oIGRhdGFWaWV3LCBkYXRhT2Zmc2V0ICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZSggZGF0YVZpZXcuZ2V0VWludDgoIGRhdGFPZmZzZXQgKSApO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc2l6ZTogMSxcbiAgICAgICAgICAgICAgICBhc2NpaTogdHJ1ZVxuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8vIHNob3J0LCAxNiBiaXQgaW50OlxuICAgICAgICAgICAgMzoge1xuICAgICAgICAgICAgICAgIGdldFZhbHVlOiBmdW5jdGlvbiggZGF0YVZpZXcsIGRhdGFPZmZzZXQsIGxpdHRsZUVuZGlhbiApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRhdGFWaWV3LmdldFVpbnQxNiggZGF0YU9mZnNldCwgbGl0dGxlRW5kaWFuICk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzaXplOiAyXG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLy8gbG9uZywgMzIgYml0IGludDpcbiAgICAgICAgICAgIDQ6IHtcbiAgICAgICAgICAgICAgICBnZXRWYWx1ZTogZnVuY3Rpb24oIGRhdGFWaWV3LCBkYXRhT2Zmc2V0LCBsaXR0bGVFbmRpYW4gKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkYXRhVmlldy5nZXRVaW50MzIoIGRhdGFPZmZzZXQsIGxpdHRsZUVuZGlhbiApO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc2l6ZTogNFxuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8vIHJhdGlvbmFsID0gdHdvIGxvbmcgdmFsdWVzLFxuICAgICAgICAgICAgLy8gZmlyc3QgaXMgbnVtZXJhdG9yLCBzZWNvbmQgaXMgZGVub21pbmF0b3I6XG4gICAgICAgICAgICA1OiB7XG4gICAgICAgICAgICAgICAgZ2V0VmFsdWU6IGZ1bmN0aW9uKCBkYXRhVmlldywgZGF0YU9mZnNldCwgbGl0dGxlRW5kaWFuICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGF0YVZpZXcuZ2V0VWludDMyKCBkYXRhT2Zmc2V0LCBsaXR0bGVFbmRpYW4gKSAvXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhVmlldy5nZXRVaW50MzIoIGRhdGFPZmZzZXQgKyA0LCBsaXR0bGVFbmRpYW4gKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHNpemU6IDhcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvLyBzbG9uZywgMzIgYml0IHNpZ25lZCBpbnQ6XG4gICAgICAgICAgICA5OiB7XG4gICAgICAgICAgICAgICAgZ2V0VmFsdWU6IGZ1bmN0aW9uKCBkYXRhVmlldywgZGF0YU9mZnNldCwgbGl0dGxlRW5kaWFuICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGF0YVZpZXcuZ2V0SW50MzIoIGRhdGFPZmZzZXQsIGxpdHRsZUVuZGlhbiApO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc2l6ZTogNFxuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8vIHNyYXRpb25hbCwgdHdvIHNsb25ncywgZmlyc3QgaXMgbnVtZXJhdG9yLCBzZWNvbmQgaXMgZGVub21pbmF0b3I6XG4gICAgICAgICAgICAxMDoge1xuICAgICAgICAgICAgICAgIGdldFZhbHVlOiBmdW5jdGlvbiggZGF0YVZpZXcsIGRhdGFPZmZzZXQsIGxpdHRsZUVuZGlhbiApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRhdGFWaWV3LmdldEludDMyKCBkYXRhT2Zmc2V0LCBsaXR0bGVFbmRpYW4gKSAvXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhVmlldy5nZXRJbnQzMiggZGF0YU9mZnNldCArIDQsIGxpdHRsZUVuZGlhbiApO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc2l6ZTogOFxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIFxuICAgICAgICAvLyB1bmRlZmluZWQsIDgtYml0IGJ5dGUsIHZhbHVlIGRlcGVuZGluZyBvbiBmaWVsZDpcbiAgICAgICAgRVhJRi5leGlmVGFnVHlwZXNbIDcgXSA9IEVYSUYuZXhpZlRhZ1R5cGVzWyAxIF07XG4gICAgXG4gICAgICAgIEVYSUYuZ2V0RXhpZlZhbHVlID0gZnVuY3Rpb24oIGRhdGFWaWV3LCB0aWZmT2Zmc2V0LCBvZmZzZXQsIHR5cGUsIGxlbmd0aCxcbiAgICAgICAgICAgICAgICBsaXR0bGVFbmRpYW4gKSB7XG4gICAgXG4gICAgICAgICAgICB2YXIgdGFnVHlwZSA9IEVYSUYuZXhpZlRhZ1R5cGVzWyB0eXBlIF0sXG4gICAgICAgICAgICAgICAgdGFnU2l6ZSwgZGF0YU9mZnNldCwgdmFsdWVzLCBpLCBzdHIsIGM7XG4gICAgXG4gICAgICAgICAgICBpZiAoICF0YWdUeXBlICkge1xuICAgICAgICAgICAgICAgIEJhc2UubG9nKCdJbnZhbGlkIEV4aWYgZGF0YTogSW52YWxpZCB0YWcgdHlwZS4nKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICB0YWdTaXplID0gdGFnVHlwZS5zaXplICogbGVuZ3RoO1xuICAgIFxuICAgICAgICAgICAgLy8gRGV0ZXJtaW5lIGlmIHRoZSB2YWx1ZSBpcyBjb250YWluZWQgaW4gdGhlIGRhdGFPZmZzZXQgYnl0ZXMsXG4gICAgICAgICAgICAvLyBvciBpZiB0aGUgdmFsdWUgYXQgdGhlIGRhdGFPZmZzZXQgaXMgYSBwb2ludGVyIHRvIHRoZSBhY3R1YWwgZGF0YTpcbiAgICAgICAgICAgIGRhdGFPZmZzZXQgPSB0YWdTaXplID4gNCA/IHRpZmZPZmZzZXQgKyBkYXRhVmlldy5nZXRVaW50MzIoIG9mZnNldCArIDgsXG4gICAgICAgICAgICAgICAgICAgIGxpdHRsZUVuZGlhbiApIDogKG9mZnNldCArIDgpO1xuICAgIFxuICAgICAgICAgICAgaWYgKCBkYXRhT2Zmc2V0ICsgdGFnU2l6ZSA+IGRhdGFWaWV3LmJ5dGVMZW5ndGggKSB7XG4gICAgICAgICAgICAgICAgQmFzZS5sb2coJ0ludmFsaWQgRXhpZiBkYXRhOiBJbnZhbGlkIGRhdGEgb2Zmc2V0LicpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgIGlmICggbGVuZ3RoID09PSAxICkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0YWdUeXBlLmdldFZhbHVlKCBkYXRhVmlldywgZGF0YU9mZnNldCwgbGl0dGxlRW5kaWFuICk7XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICB2YWx1ZXMgPSBbXTtcbiAgICBcbiAgICAgICAgICAgIGZvciAoIGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEgKSB7XG4gICAgICAgICAgICAgICAgdmFsdWVzWyBpIF0gPSB0YWdUeXBlLmdldFZhbHVlKCBkYXRhVmlldyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFPZmZzZXQgKyBpICogdGFnVHlwZS5zaXplLCBsaXR0bGVFbmRpYW4gKTtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgIGlmICggdGFnVHlwZS5hc2NpaSApIHtcbiAgICAgICAgICAgICAgICBzdHIgPSAnJztcbiAgICBcbiAgICAgICAgICAgICAgICAvLyBDb25jYXRlbmF0ZSB0aGUgY2hhcnM6XG4gICAgICAgICAgICAgICAgZm9yICggaSA9IDA7IGkgPCB2YWx1ZXMubGVuZ3RoOyBpICs9IDEgKSB7XG4gICAgICAgICAgICAgICAgICAgIGMgPSB2YWx1ZXNbIGkgXTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8gSWdub3JlIHRoZSB0ZXJtaW5hdGluZyBOVUxMIGJ5dGUocyk6XG4gICAgICAgICAgICAgICAgICAgIGlmICggYyA9PT0gJ1xcdTAwMDAnICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc3RyICs9IGM7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBzdHI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdmFsdWVzO1xuICAgICAgICB9O1xuICAgIFxuICAgICAgICBFWElGLnBhcnNlRXhpZlRhZyA9IGZ1bmN0aW9uKCBkYXRhVmlldywgdGlmZk9mZnNldCwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sXG4gICAgICAgICAgICAgICAgZGF0YSApIHtcbiAgICBcbiAgICAgICAgICAgIHZhciB0YWcgPSBkYXRhVmlldy5nZXRVaW50MTYoIG9mZnNldCwgbGl0dGxlRW5kaWFuICk7XG4gICAgICAgICAgICBkYXRhLmV4aWZbIHRhZyBdID0gRVhJRi5nZXRFeGlmVmFsdWUoIGRhdGFWaWV3LCB0aWZmT2Zmc2V0LCBvZmZzZXQsXG4gICAgICAgICAgICAgICAgICAgIGRhdGFWaWV3LmdldFVpbnQxNiggb2Zmc2V0ICsgMiwgbGl0dGxlRW5kaWFuICksICAgIC8vIHRhZyB0eXBlXG4gICAgICAgICAgICAgICAgICAgIGRhdGFWaWV3LmdldFVpbnQzMiggb2Zmc2V0ICsgNCwgbGl0dGxlRW5kaWFuICksICAgIC8vIHRhZyBsZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgbGl0dGxlRW5kaWFuICk7XG4gICAgICAgIH07XG4gICAgXG4gICAgICAgIEVYSUYucGFyc2VFeGlmVGFncyA9IGZ1bmN0aW9uKCBkYXRhVmlldywgdGlmZk9mZnNldCwgZGlyT2Zmc2V0LFxuICAgICAgICAgICAgICAgIGxpdHRsZUVuZGlhbiwgZGF0YSApIHtcbiAgICBcbiAgICAgICAgICAgIHZhciB0YWdzTnVtYmVyLCBkaXJFbmRPZmZzZXQsIGk7XG4gICAgXG4gICAgICAgICAgICBpZiAoIGRpck9mZnNldCArIDYgPiBkYXRhVmlldy5ieXRlTGVuZ3RoICkge1xuICAgICAgICAgICAgICAgIEJhc2UubG9nKCdJbnZhbGlkIEV4aWYgZGF0YTogSW52YWxpZCBkaXJlY3Rvcnkgb2Zmc2V0LicpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgIHRhZ3NOdW1iZXIgPSBkYXRhVmlldy5nZXRVaW50MTYoIGRpck9mZnNldCwgbGl0dGxlRW5kaWFuICk7XG4gICAgICAgICAgICBkaXJFbmRPZmZzZXQgPSBkaXJPZmZzZXQgKyAyICsgMTIgKiB0YWdzTnVtYmVyO1xuICAgIFxuICAgICAgICAgICAgaWYgKCBkaXJFbmRPZmZzZXQgKyA0ID4gZGF0YVZpZXcuYnl0ZUxlbmd0aCApIHtcbiAgICAgICAgICAgICAgICBCYXNlLmxvZygnSW52YWxpZCBFeGlmIGRhdGE6IEludmFsaWQgZGlyZWN0b3J5IHNpemUuJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgZm9yICggaSA9IDA7IGkgPCB0YWdzTnVtYmVyOyBpICs9IDEgKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wYXJzZUV4aWZUYWcoIGRhdGFWaWV3LCB0aWZmT2Zmc2V0LFxuICAgICAgICAgICAgICAgICAgICAgICAgZGlyT2Zmc2V0ICsgMiArIDEyICogaSwgICAgLy8gdGFnIG9mZnNldFxuICAgICAgICAgICAgICAgICAgICAgICAgbGl0dGxlRW5kaWFuLCBkYXRhICk7XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAvLyBSZXR1cm4gdGhlIG9mZnNldCB0byB0aGUgbmV4dCBkaXJlY3Rvcnk6XG4gICAgICAgICAgICByZXR1cm4gZGF0YVZpZXcuZ2V0VWludDMyKCBkaXJFbmRPZmZzZXQsIGxpdHRsZUVuZGlhbiApO1xuICAgICAgICB9O1xuICAgIFxuICAgICAgICAvLyBFWElGLmdldEV4aWZUaHVtYm5haWwgPSBmdW5jdGlvbihkYXRhVmlldywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgICAgICAgLy8gICAgIHZhciBoZXhEYXRhLFxuICAgICAgICAvLyAgICAgICAgIGksXG4gICAgICAgIC8vICAgICAgICAgYjtcbiAgICAgICAgLy8gICAgIGlmICghbGVuZ3RoIHx8IG9mZnNldCArIGxlbmd0aCA+IGRhdGFWaWV3LmJ5dGVMZW5ndGgpIHtcbiAgICAgICAgLy8gICAgICAgICBCYXNlLmxvZygnSW52YWxpZCBFeGlmIGRhdGE6IEludmFsaWQgdGh1bWJuYWlsIGRhdGEuJyk7XG4gICAgICAgIC8vICAgICAgICAgcmV0dXJuO1xuICAgICAgICAvLyAgICAgfVxuICAgICAgICAvLyAgICAgaGV4RGF0YSA9IFtdO1xuICAgICAgICAvLyAgICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIC8vICAgICAgICAgYiA9IGRhdGFWaWV3LmdldFVpbnQ4KG9mZnNldCArIGkpO1xuICAgICAgICAvLyAgICAgICAgIGhleERhdGEucHVzaCgoYiA8IDE2ID8gJzAnIDogJycpICsgYi50b1N0cmluZygxNikpO1xuICAgICAgICAvLyAgICAgfVxuICAgICAgICAvLyAgICAgcmV0dXJuICdkYXRhOmltYWdlL2pwZWcsJScgKyBoZXhEYXRhLmpvaW4oJyUnKTtcbiAgICAgICAgLy8gfTtcbiAgICBcbiAgICAgICAgRVhJRi5wYXJzZUV4aWZEYXRhID0gZnVuY3Rpb24oIGRhdGFWaWV3LCBvZmZzZXQsIGxlbmd0aCwgZGF0YSApIHtcbiAgICBcbiAgICAgICAgICAgIHZhciB0aWZmT2Zmc2V0ID0gb2Zmc2V0ICsgMTAsXG4gICAgICAgICAgICAgICAgbGl0dGxlRW5kaWFuLCBkaXJPZmZzZXQ7XG4gICAgXG4gICAgICAgICAgICAvLyBDaGVjayBmb3IgdGhlIEFTQ0lJIGNvZGUgZm9yIFwiRXhpZlwiICgweDQ1Nzg2OTY2KTpcbiAgICAgICAgICAgIGlmICggZGF0YVZpZXcuZ2V0VWludDMyKCBvZmZzZXQgKyA0ICkgIT09IDB4NDU3ODY5NjYgKSB7XG4gICAgICAgICAgICAgICAgLy8gTm8gRXhpZiBkYXRhLCBtaWdodCBiZSBYTVAgZGF0YSBpbnN0ZWFkXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCB0aWZmT2Zmc2V0ICsgOCA+IGRhdGFWaWV3LmJ5dGVMZW5ndGggKSB7XG4gICAgICAgICAgICAgICAgQmFzZS5sb2coJ0ludmFsaWQgRXhpZiBkYXRhOiBJbnZhbGlkIHNlZ21lbnQgc2l6ZS4nKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAvLyBDaGVjayBmb3IgdGhlIHR3byBudWxsIGJ5dGVzOlxuICAgICAgICAgICAgaWYgKCBkYXRhVmlldy5nZXRVaW50MTYoIG9mZnNldCArIDggKSAhPT0gMHgwMDAwICkge1xuICAgICAgICAgICAgICAgIEJhc2UubG9nKCdJbnZhbGlkIEV4aWYgZGF0YTogTWlzc2luZyBieXRlIGFsaWdubWVudCBvZmZzZXQuJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgLy8gQ2hlY2sgdGhlIGJ5dGUgYWxpZ25tZW50OlxuICAgICAgICAgICAgc3dpdGNoICggZGF0YVZpZXcuZ2V0VWludDE2KCB0aWZmT2Zmc2V0ICkgKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAweDQ5NDk6XG4gICAgICAgICAgICAgICAgICAgIGxpdHRsZUVuZGlhbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgIFxuICAgICAgICAgICAgICAgIGNhc2UgMHg0RDREOlxuICAgICAgICAgICAgICAgICAgICBsaXR0bGVFbmRpYW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgQmFzZS5sb2coJ0ludmFsaWQgRXhpZiBkYXRhOiBJbnZhbGlkIGJ5dGUgYWxpZ25tZW50IG1hcmtlci4nKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIHRoZSBUSUZGIHRhZyBtYXJrZXIgKDB4MDAyQSk6XG4gICAgICAgICAgICBpZiAoIGRhdGFWaWV3LmdldFVpbnQxNiggdGlmZk9mZnNldCArIDIsIGxpdHRsZUVuZGlhbiApICE9PSAweDAwMkEgKSB7XG4gICAgICAgICAgICAgICAgQmFzZS5sb2coJ0ludmFsaWQgRXhpZiBkYXRhOiBNaXNzaW5nIFRJRkYgbWFya2VyLicpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgIC8vIFJldHJpZXZlIHRoZSBkaXJlY3Rvcnkgb2Zmc2V0IGJ5dGVzLCB1c3VhbGx5IDB4MDAwMDAwMDggb3IgOCBkZWNpbWFsOlxuICAgICAgICAgICAgZGlyT2Zmc2V0ID0gZGF0YVZpZXcuZ2V0VWludDMyKCB0aWZmT2Zmc2V0ICsgNCwgbGl0dGxlRW5kaWFuICk7XG4gICAgICAgICAgICAvLyBDcmVhdGUgdGhlIGV4aWYgb2JqZWN0IHRvIHN0b3JlIHRoZSB0YWdzOlxuICAgICAgICAgICAgZGF0YS5leGlmID0gbmV3IEVYSUYuRXhpZk1hcCgpO1xuICAgICAgICAgICAgLy8gUGFyc2UgdGhlIHRhZ3Mgb2YgdGhlIG1haW4gaW1hZ2UgZGlyZWN0b3J5IGFuZCByZXRyaWV2ZSB0aGVcbiAgICAgICAgICAgIC8vIG9mZnNldCB0byB0aGUgbmV4dCBkaXJlY3RvcnksIHVzdWFsbHkgdGhlIHRodW1ibmFpbCBkaXJlY3Rvcnk6XG4gICAgICAgICAgICBkaXJPZmZzZXQgPSBFWElGLnBhcnNlRXhpZlRhZ3MoIGRhdGFWaWV3LCB0aWZmT2Zmc2V0LFxuICAgICAgICAgICAgICAgICAgICB0aWZmT2Zmc2V0ICsgZGlyT2Zmc2V0LCBsaXR0bGVFbmRpYW4sIGRhdGEgKTtcbiAgICBcbiAgICAgICAgICAgIC8vIOWwneivleivu+WPlue8qeeVpeWbvlxuICAgICAgICAgICAgLy8gaWYgKCBkaXJPZmZzZXQgKSB7XG4gICAgICAgICAgICAvLyAgICAgdGh1bWJuYWlsRGF0YSA9IHtleGlmOiB7fX07XG4gICAgICAgICAgICAvLyAgICAgZGlyT2Zmc2V0ID0gRVhJRi5wYXJzZUV4aWZUYWdzKFxuICAgICAgICAgICAgLy8gICAgICAgICBkYXRhVmlldyxcbiAgICAgICAgICAgIC8vICAgICAgICAgdGlmZk9mZnNldCxcbiAgICAgICAgICAgIC8vICAgICAgICAgdGlmZk9mZnNldCArIGRpck9mZnNldCxcbiAgICAgICAgICAgIC8vICAgICAgICAgbGl0dGxlRW5kaWFuLFxuICAgICAgICAgICAgLy8gICAgICAgICB0aHVtYm5haWxEYXRhXG4gICAgICAgICAgICAvLyAgICAgKTtcbiAgICBcbiAgICAgICAgICAgIC8vICAgICAvLyBDaGVjayBmb3IgSlBFRyBUaHVtYm5haWwgb2Zmc2V0OlxuICAgICAgICAgICAgLy8gICAgIGlmICh0aHVtYm5haWxEYXRhLmV4aWZbMHgwMjAxXSkge1xuICAgICAgICAgICAgLy8gICAgICAgICBkYXRhLmV4aWYuVGh1bWJuYWlsID0gRVhJRi5nZXRFeGlmVGh1bWJuYWlsKFxuICAgICAgICAgICAgLy8gICAgICAgICAgICAgZGF0YVZpZXcsXG4gICAgICAgICAgICAvLyAgICAgICAgICAgICB0aWZmT2Zmc2V0ICsgdGh1bWJuYWlsRGF0YS5leGlmWzB4MDIwMV0sXG4gICAgICAgICAgICAvLyAgICAgICAgICAgICB0aHVtYm5haWxEYXRhLmV4aWZbMHgwMjAyXSAvLyBUaHVtYm5haWwgZGF0YSBsZW5ndGhcbiAgICAgICAgICAgIC8vICAgICAgICAgKTtcbiAgICAgICAgICAgIC8vICAgICB9XG4gICAgICAgICAgICAvLyB9XG4gICAgICAgIH07XG4gICAgXG4gICAgICAgIEltYWdlTWV0YS5wYXJzZXJzWyAweGZmZTEgXS5wdXNoKCBFWElGLnBhcnNlRXhpZkRhdGEgKTtcbiAgICAgICAgcmV0dXJuIEVYSUY7XG4gICAgfSk7XG4gICAgLyoqXG4gICAgICogQGZpbGVPdmVydmlldyBJbWFnZVxuICAgICAqL1xuICAgIGRlZmluZSgncnVudGltZS9odG1sNS9pbWFnZScsW1xuICAgICAgICAnYmFzZScsXG4gICAgICAgICdydW50aW1lL2h0bWw1L3J1bnRpbWUnLFxuICAgICAgICAncnVudGltZS9odG1sNS91dGlsJ1xuICAgIF0sIGZ1bmN0aW9uKCBCYXNlLCBIdG1sNVJ1bnRpbWUsIFV0aWwgKSB7XG4gICAgXG4gICAgICAgIHZhciBCTEFOSyA9ICdkYXRhOmltYWdlL2dpZjtiYXNlNjQsUjBsR09EbGhBUUFCQUFEL0FDd0FBQUFBQVFBQkFBQUNBRHMlM0QnO1xuICAgIFxuICAgICAgICByZXR1cm4gSHRtbDVSdW50aW1lLnJlZ2lzdGVyKCAnSW1hZ2UnLCB7XG4gICAgXG4gICAgICAgICAgICAvLyBmbGFnOiDmoIforrDmmK/lkKbooqvkv67mlLnov4fjgIJcbiAgICAgICAgICAgIG1vZGlmaWVkOiBmYWxzZSxcbiAgICBcbiAgICAgICAgICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIGltZyA9IG5ldyBJbWFnZSgpO1xuICAgIFxuICAgICAgICAgICAgICAgIGltZy5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgbWUuX2luZm8gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBtZS50eXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IHRoaXMud2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IHRoaXMuaGVpZ2h0XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIOivu+WPlm1ldGHkv6Hmga/jgIJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCAhbWUuX21ldGFzICYmICdpbWFnZS9qcGVnJyA9PT0gbWUudHlwZSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFV0aWwucGFyc2VNZXRhKCBtZS5fYmxvYiwgZnVuY3Rpb24oIGVycm9yLCByZXQgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWUuX21ldGFzID0gcmV0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lLm93bmVyLnRyaWdnZXIoJ2xvYWQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWUub3duZXIudHJpZ2dlcignbG9hZCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgICAgICBpbWcub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBtZS5vd25lci50cmlnZ2VyKCdlcnJvcicpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgICAgICAgICAgbWUuX2ltZyA9IGltZztcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBsb2FkRnJvbUJsb2I6IGZ1bmN0aW9uKCBibG9iICkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIGltZyA9IG1lLl9pbWc7XG4gICAgXG4gICAgICAgICAgICAgICAgbWUuX2Jsb2IgPSBibG9iO1xuICAgICAgICAgICAgICAgIG1lLnR5cGUgPSBibG9iLnR5cGU7XG4gICAgICAgICAgICAgICAgaW1nLnNyYyA9IFV0aWwuY3JlYXRlT2JqZWN0VVJMKCBibG9iLmdldFNvdXJjZSgpICk7XG4gICAgICAgICAgICAgICAgbWUub3duZXIub25jZSggJ2xvYWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgVXRpbC5yZXZva2VPYmplY3RVUkwoIGltZy5zcmMgKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICByZXNpemU6IGZ1bmN0aW9uKCB3aWR0aCwgaGVpZ2h0ICkge1xuICAgICAgICAgICAgICAgIHZhciBjYW52YXMgPSB0aGlzLl9jYW52YXMgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICh0aGlzLl9jYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKSk7XG4gICAgXG4gICAgICAgICAgICAgICAgdGhpcy5fcmVzaXplKCB0aGlzLl9pbWcsIGNhbnZhcywgd2lkdGgsIGhlaWdodCApO1xuICAgICAgICAgICAgICAgIHRoaXMuX2Jsb2IgPSBudWxsOyAgICAvLyDmsqHnlKjkuobvvIzlj6/ku6XliKDmjonkuobjgIJcbiAgICAgICAgICAgICAgICB0aGlzLm1vZGlmaWVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLm93bmVyLnRyaWdnZXIoJ2NvbXBsZXRlJyk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgZ2V0QXNCbG9iOiBmdW5jdGlvbiggdHlwZSApIHtcbiAgICAgICAgICAgICAgICB2YXIgYmxvYiA9IHRoaXMuX2Jsb2IsXG4gICAgICAgICAgICAgICAgICAgIG9wdHMgPSB0aGlzLm9wdGlvbnMsXG4gICAgICAgICAgICAgICAgICAgIGNhbnZhcztcbiAgICBcbiAgICAgICAgICAgICAgICB0eXBlID0gdHlwZSB8fCB0aGlzLnR5cGU7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8gYmxvYumcgOimgemHjeaWsOeUn+aIkOOAglxuICAgICAgICAgICAgICAgIGlmICggdGhpcy5tb2RpZmllZCB8fCB0aGlzLnR5cGUgIT09IHR5cGUgKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbnZhcyA9IHRoaXMuX2NhbnZhcztcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0eXBlID09PSAnaW1hZ2UvanBlZycgKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBibG9iID0gVXRpbC5jYW52YXNUb0RhdGFVcmwoIGNhbnZhcywgJ2ltYWdlL2pwZWcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRzLnF1YWxpdHkgKTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggb3B0cy5wcmVzZXJ2ZUhlYWRlcnMgJiYgdGhpcy5fbWV0YXMgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fbWV0YXMuaW1hZ2VIZWFkICkge1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJsb2IgPSBVdGlsLmRhdGFVUkwyQXJyYXlCdWZmZXIoIGJsb2IgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBibG9iID0gVXRpbC51cGRhdGVJbWFnZUhlYWQoIGJsb2IsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9tZXRhcy5pbWFnZUhlYWQgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBibG9iID0gVXRpbC5hcnJheUJ1ZmZlclRvQmxvYiggYmxvYiwgdHlwZSApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBibG9iO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgYmxvYiA9IFV0aWwuY2FudmFzVG9EYXRhVXJsKCBjYW52YXMsIHR5cGUgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgICAgICBibG9iID0gVXRpbC5kYXRhVVJMMkJsb2IoIGJsb2IgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIGJsb2I7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgZ2V0QXNEYXRhVXJsOiBmdW5jdGlvbiggdHlwZSApIHtcbiAgICAgICAgICAgICAgICB2YXIgb3B0cyA9IHRoaXMub3B0aW9ucztcbiAgICBcbiAgICAgICAgICAgICAgICB0eXBlID0gdHlwZSB8fCB0aGlzLnR5cGU7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCB0eXBlID09PSAnaW1hZ2UvanBlZycgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBVdGlsLmNhbnZhc1RvRGF0YVVybCggdGhpcy5fY2FudmFzLCB0eXBlLCBvcHRzLnF1YWxpdHkgKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fY2FudmFzLnRvRGF0YVVSTCggdHlwZSApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBnZXRPcmllbnRhdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX21ldGFzICYmIHRoaXMuX21ldGFzLmV4aWYgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX21ldGFzLmV4aWYuZ2V0KCdPcmllbnRhdGlvbicpIHx8IDE7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgaW5mbzogZnVuY3Rpb24oIHZhbCApIHtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyBzZXR0ZXJcbiAgICAgICAgICAgICAgICBpZiAoIHZhbCApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5faW5mbyA9IHZhbDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIC8vIGdldHRlclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9pbmZvO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIG1ldGE6IGZ1bmN0aW9uKCB2YWwgKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8gc2V0dGVyXG4gICAgICAgICAgICAgICAgaWYgKCB2YWwgKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX21ldGEgPSB2YWw7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAvLyBnZXR0ZXJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fbWV0YTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgY2FudmFzID0gdGhpcy5fY2FudmFzO1xuICAgICAgICAgICAgICAgIHRoaXMuX2ltZy5vbmxvYWQgPSBudWxsO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggY2FudmFzICkge1xuICAgICAgICAgICAgICAgICAgICBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5jbGVhclJlY3QoIDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCApO1xuICAgICAgICAgICAgICAgICAgICBjYW52YXMud2lkdGggPSBjYW52YXMuaGVpZ2h0ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fY2FudmFzID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g6YeK5pS+5YaF5a2Y44CC6Z2e5bi46YeN6KaB77yM5ZCm5YiZ6YeK5pS+5LiN5LqGaW1hZ2XnmoTlhoXlrZjjgIJcbiAgICAgICAgICAgICAgICB0aGlzLl9pbWcuc3JjID0gQkxBTks7XG4gICAgICAgICAgICAgICAgdGhpcy5faW1nID0gdGhpcy5fYmxvYiA9IG51bGw7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgX3Jlc2l6ZTogZnVuY3Rpb24oIGltZywgY3ZzLCB3aWR0aCwgaGVpZ2h0ICkge1xuICAgICAgICAgICAgICAgIHZhciBvcHRzID0gdGhpcy5vcHRpb25zLFxuICAgICAgICAgICAgICAgICAgICBuYXR1cmFsV2lkdGggPSBpbWcud2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIG5hdHVyYWxIZWlnaHQgPSBpbWcuaGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICBvcmllbnRhdGlvbiA9IHRoaXMuZ2V0T3JpZW50YXRpb24oKSxcbiAgICAgICAgICAgICAgICAgICAgc2NhbGUsIHcsIGgsIHgsIHk7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8gdmFsdWVzIHRoYXQgcmVxdWlyZSA5MCBkZWdyZWUgcm90YXRpb25cbiAgICAgICAgICAgICAgICBpZiAoIH5bIDUsIDYsIDcsIDggXS5pbmRleE9mKCBvcmllbnRhdGlvbiApICkge1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyDkuqTmjaJ3aWR0aCwgaGVpZ2h055qE5YC844CCXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoIF49IGhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0IF49IHdpZHRoO1xuICAgICAgICAgICAgICAgICAgICB3aWR0aCBePSBoZWlnaHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIHNjYWxlID0gTWF0aFsgb3B0cy5jcm9wID8gJ21heCcgOiAnbWluJyBdKCB3aWR0aCAvIG5hdHVyYWxXaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodCAvIG5hdHVyYWxIZWlnaHQgKTtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDkuI3lhYHorrjmlL7lpKfjgIJcbiAgICAgICAgICAgICAgICBvcHRzLmFsbG93TWFnbmlmeSB8fCAoc2NhbGUgPSBNYXRoLm1pbiggMSwgc2NhbGUgKSk7XG4gICAgXG4gICAgICAgICAgICAgICAgdyA9IG5hdHVyYWxXaWR0aCAqIHNjYWxlO1xuICAgICAgICAgICAgICAgIGggPSBuYXR1cmFsSGVpZ2h0ICogc2NhbGU7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCBvcHRzLmNyb3AgKSB7XG4gICAgICAgICAgICAgICAgICAgIGN2cy53aWR0aCA9IHdpZHRoO1xuICAgICAgICAgICAgICAgICAgICBjdnMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGN2cy53aWR0aCA9IHc7XG4gICAgICAgICAgICAgICAgICAgIGN2cy5oZWlnaHQgPSBoO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICB4ID0gKGN2cy53aWR0aCAtIHcpIC8gMjtcbiAgICAgICAgICAgICAgICB5ID0gKGN2cy5oZWlnaHQgLSBoKSAvIDI7XG4gICAgXG4gICAgICAgICAgICAgICAgb3B0cy5wcmVzZXJ2ZUhlYWRlcnMgfHwgdGhpcy5fcm90YXRlMk9yaWVudGFpb24oIGN2cywgb3JpZW50YXRpb24gKTtcbiAgICBcbiAgICAgICAgICAgICAgICB0aGlzLl9yZW5kZXJJbWFnZVRvQ2FudmFzKCBjdnMsIGltZywgeCwgeSwgdywgaCApO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIF9yb3RhdGUyT3JpZW50YWlvbjogZnVuY3Rpb24oIGNhbnZhcywgb3JpZW50YXRpb24gKSB7XG4gICAgICAgICAgICAgICAgdmFyIHdpZHRoID0gY2FudmFzLndpZHRoLFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQgPSBjYW52YXMuaGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICBcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKCBvcmllbnRhdGlvbiApIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSA1OlxuICAgICAgICAgICAgICAgICAgICBjYXNlIDY6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgNzpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSA4OlxuICAgICAgICAgICAgICAgICAgICAgICAgY2FudmFzLndpZHRoID0gaGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FudmFzLmhlaWdodCA9IHdpZHRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIHN3aXRjaCAoIG9yaWVudGF0aW9uICkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDI6ICAgIC8vIGhvcml6b250YWwgZmxpcFxuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZSggd2lkdGgsIDAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5zY2FsZSggLTEsIDEgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBjYXNlIDM6ICAgIC8vIDE4MCByb3RhdGUgbGVmdFxuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZSggd2lkdGgsIGhlaWdodCApO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LnJvdGF0ZSggTWF0aC5QSSApO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgNDogICAgLy8gdmVydGljYWwgZmxpcFxuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZSggMCwgaGVpZ2h0ICk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHguc2NhbGUoIDEsIC0xICk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgY2FzZSA1OiAgICAvLyB2ZXJ0aWNhbCBmbGlwICsgOTAgcm90YXRlIHJpZ2h0XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHgucm90YXRlKCAwLjUgKiBNYXRoLlBJICk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHguc2NhbGUoIDEsIC0xICk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgY2FzZSA2OiAgICAvLyA5MCByb3RhdGUgcmlnaHRcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5yb3RhdGUoIDAuNSAqIE1hdGguUEkgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC50cmFuc2xhdGUoIDAsIC1oZWlnaHQgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBjYXNlIDc6ICAgIC8vIGhvcml6b250YWwgZmxpcCArIDkwIHJvdGF0ZSByaWdodFxuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LnJvdGF0ZSggMC41ICogTWF0aC5QSSApO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZSggd2lkdGgsIC1oZWlnaHQgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5zY2FsZSggLTEsIDEgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBjYXNlIDg6ICAgIC8vIDkwIHJvdGF0ZSBsZWZ0XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHgucm90YXRlKCAtMC41ICogTWF0aC5QSSApO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZSggLXdpZHRoLCAwICk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3N0b21pdGEvaW9zLWltYWdlZmlsZS1tZWdhcGl4ZWwvXG4gICAgICAgICAgICAvLyBibG9iL21hc3Rlci9zcmMvbWVnYXBpeC1pbWFnZS5qc1xuICAgICAgICAgICAgX3JlbmRlckltYWdlVG9DYW52YXM6IChmdW5jdGlvbigpIHtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDlpoLmnpzkuI3mmK9pb3MsIOS4jemcgOimgei/meS5iOWkjeadgu+8gVxuICAgICAgICAgICAgICAgIGlmICggIUJhc2Uub3MuaW9zICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oIGNhbnZhcywgaW1nLCB4LCB5LCB3LCBoICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FudmFzLmdldENvbnRleHQoJzJkJykuZHJhd0ltYWdlKCBpbWcsIHgsIHksIHcsIGggKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogRGV0ZWN0aW5nIHZlcnRpY2FsIHNxdWFzaCBpbiBsb2FkZWQgaW1hZ2UuXG4gICAgICAgICAgICAgICAgICogRml4ZXMgYSBidWcgd2hpY2ggc3F1YXNoIGltYWdlIHZlcnRpY2FsbHkgd2hpbGUgZHJhd2luZyBpbnRvXG4gICAgICAgICAgICAgICAgICogY2FudmFzIGZvciBzb21lIGltYWdlcy5cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBkZXRlY3RWZXJ0aWNhbFNxdWFzaCggaW1nLCBpdywgaWggKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3kgPSAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXkgPSBpaCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHB5ID0gaWgsXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhLCBhbHBoYSwgcmF0aW87XG4gICAgXG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGNhbnZhcy53aWR0aCA9IDE7XG4gICAgICAgICAgICAgICAgICAgIGNhbnZhcy5oZWlnaHQgPSBpaDtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmRyYXdJbWFnZSggaW1nLCAwLCAwICk7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEgPSBjdHguZ2V0SW1hZ2VEYXRhKCAwLCAwLCAxLCBpaCApLmRhdGE7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIHNlYXJjaCBpbWFnZSBlZGdlIHBpeGVsIHBvc2l0aW9uIGluIGNhc2VcbiAgICAgICAgICAgICAgICAgICAgLy8gaXQgaXMgc3F1YXNoZWQgdmVydGljYWxseS5cbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKCBweSA+IHN5ICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWxwaGEgPSBkYXRhWyAocHkgLSAxKSAqIDQgKyAzIF07XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGFscGhhID09PSAwICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV5ID0gcHk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN5ID0gcHk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBweSA9IChleSArIHN5KSA+PiAxO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIHJhdGlvID0gKHB5IC8gaWgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKHJhdGlvID09PSAwKSA/IDEgOiByYXRpbztcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgLy8gZml4IGllNyBidWdcbiAgICAgICAgICAgICAgICAvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzExOTI5MDk5L1xuICAgICAgICAgICAgICAgIC8vIGh0bWw1LWNhbnZhcy1kcmF3aW1hZ2UtcmF0aW8tYnVnLWlvc1xuICAgICAgICAgICAgICAgIGlmICggQmFzZS5vcy5pb3MgPj0gNyApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCBjYW52YXMsIGltZywgeCwgeSwgdywgaCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpdyA9IGltZy5uYXR1cmFsV2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWggPSBpbWcubmF0dXJhbEhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2ZXJ0U3F1YXNoUmF0aW8gPSBkZXRlY3RWZXJ0aWNhbFNxdWFzaCggaW1nLCBpdywgaWggKTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKS5kcmF3SW1hZ2UoIGltZywgMCwgMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdyAqIHZlcnRTcXVhc2hSYXRpbywgaWggKiB2ZXJ0U3F1YXNoUmF0aW8sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeCwgeSwgdywgaCApO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBEZXRlY3Qgc3Vic2FtcGxpbmcgaW4gbG9hZGVkIGltYWdlLlxuICAgICAgICAgICAgICAgICAqIEluIGlPUywgbGFyZ2VyIGltYWdlcyB0aGFuIDJNIHBpeGVscyBtYXkgYmVcbiAgICAgICAgICAgICAgICAgKiBzdWJzYW1wbGVkIGluIHJlbmRlcmluZy5cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBkZXRlY3RTdWJzYW1wbGluZyggaW1nICkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaXcgPSBpbWcubmF0dXJhbFdpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgaWggPSBpbWcubmF0dXJhbEhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbnZhcywgY3R4O1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyBzdWJzYW1wbGluZyBtYXkgaGFwcGVuIG92ZXJtZWdhcGl4ZWwgaW1hZ2VcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBpdyAqIGloID4gMTAyNCAqIDEwMjQgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbnZhcy53aWR0aCA9IGNhbnZhcy5oZWlnaHQgPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHguZHJhd0ltYWdlKCBpbWcsIC1pdyArIDEsIDAgKTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHN1YnNhbXBsZWQgaW1hZ2UgYmVjb21lcyBoYWxmIHNtYWxsZXIgaW4gcmVuZGVyaW5nIHNpemUuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjaGVjayBhbHBoYSBjaGFubmVsIHZhbHVlIHRvIGNvbmZpcm0gaW1hZ2UgaXMgY292ZXJpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGVkZ2UgcGl4ZWwgb3Igbm90LiBpZiBhbHBoYSB2YWx1ZSBpcyAwXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpbWFnZSBpcyBub3QgY292ZXJpbmcsIGhlbmNlIHN1YnNhbXBsZWQuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY3R4LmdldEltYWdlRGF0YSggMCwgMCwgMSwgMSApLmRhdGFbIDMgXSA9PT0gMDtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oIGNhbnZhcywgaW1nLCB4LCB5LCB3aWR0aCwgaGVpZ2h0ICkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaXcgPSBpbWcubmF0dXJhbFdpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgaWggPSBpbWcubmF0dXJhbEhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3Vic2FtcGxlZCA9IGRldGVjdFN1YnNhbXBsaW5nKCBpbWcgKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvU3F1YXNoID0gdGhpcy50eXBlID09PSAnaW1hZ2UvanBlZycsXG4gICAgICAgICAgICAgICAgICAgICAgICBkID0gMTAyNCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN5ID0gMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGR5ID0gMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRtcENhbnZhcywgdG1wQ3R4LCB2ZXJ0U3F1YXNoUmF0aW8sIGR3LCBkaCwgc3gsIGR4O1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAoIHN1YnNhbXBsZWQgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdyAvPSAyO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWggLz0gMjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgICAgICBjdHguc2F2ZSgpO1xuICAgICAgICAgICAgICAgICAgICB0bXBDYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgICAgICAgICAgICAgdG1wQ2FudmFzLndpZHRoID0gdG1wQ2FudmFzLmhlaWdodCA9IGQ7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIHRtcEN0eCA9IHRtcENhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICAgICAgICAgICAgICB2ZXJ0U3F1YXNoUmF0aW8gPSBkb1NxdWFzaCA/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGV0ZWN0VmVydGljYWxTcXVhc2goIGltZywgaXcsIGloICkgOiAxO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBkdyA9IE1hdGguY2VpbCggZCAqIHdpZHRoIC8gaXcgKTtcbiAgICAgICAgICAgICAgICAgICAgZGggPSBNYXRoLmNlaWwoIGQgKiBoZWlnaHQgLyBpaCAvIHZlcnRTcXVhc2hSYXRpbyApO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoIHN5IDwgaWggKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzeCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICBkeCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoIHN4IDwgaXcgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG1wQ3R4LmNsZWFyUmVjdCggMCwgMCwgZCwgZCApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRtcEN0eC5kcmF3SW1hZ2UoIGltZywgLXN4LCAtc3kgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHguZHJhd0ltYWdlKCB0bXBDYW52YXMsIDAsIDAsIGQsIGQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4ICsgZHgsIHkgKyBkeSwgZHcsIGRoICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ggKz0gZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkeCArPSBkdztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHN5ICs9IGQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBkeSArPSBkaDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjdHgucmVzdG9yZSgpO1xuICAgICAgICAgICAgICAgICAgICB0bXBDYW52YXMgPSB0bXBDdHggPSBudWxsO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9KSgpXG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIC8qKlxuICAgICAqIOi/meS4quaWueW8j+aAp+iDveS4jeihjO+8jOS9huaYr+WPr+S7peino+WGs2FuZHJvaWTph4zpnaLnmoR0b0RhdGFVcmznmoRidWdcbiAgICAgKiBhbmRyb2lk6YeM6Z2idG9EYXRhVXJsKCdpbWFnZS9qcGVnZScp5b6X5Yiw55qE57uT5p6c5Y205pivcG5nLlxuICAgICAqXG4gICAgICog5omA5Lul6L+Z6YeM5rKh6L6Z77yM5Y+q6IO95YCf5Yqp6L+Z5Liq5bel5YW3XG4gICAgICogQGZpbGVPdmVydmlldyBqcGVnIGVuY29kZXJcbiAgICAgKi9cbiAgICBkZWZpbmUoJ3J1bnRpbWUvaHRtbDUvanBlZ2VuY29kZXInLFtdLCBmdW5jdGlvbiggcmVxdWlyZSwgZXhwb3J0cywgbW9kdWxlICkge1xuICAgIFxuICAgICAgICAvKlxuICAgICAgICAgIENvcHlyaWdodCAoYykgMjAwOCwgQWRvYmUgU3lzdGVtcyBJbmNvcnBvcmF0ZWRcbiAgICAgICAgICBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICAgIFxuICAgICAgICAgIFJlZGlzdHJpYnV0aW9uIGFuZCB1c2UgaW4gc291cmNlIGFuZCBiaW5hcnkgZm9ybXMsIHdpdGggb3Igd2l0aG91dFxuICAgICAgICAgIG1vZGlmaWNhdGlvbiwgYXJlIHBlcm1pdHRlZCBwcm92aWRlZCB0aGF0IHRoZSBmb2xsb3dpbmcgY29uZGl0aW9ucyBhcmVcbiAgICAgICAgICBtZXQ6XG4gICAgXG4gICAgICAgICAgKiBSZWRpc3RyaWJ1dGlvbnMgb2Ygc291cmNlIGNvZGUgbXVzdCByZXRhaW4gdGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UsXG4gICAgICAgICAgICB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyLlxuICAgIFxuICAgICAgICAgICogUmVkaXN0cmlidXRpb25zIGluIGJpbmFyeSBmb3JtIG11c3QgcmVwcm9kdWNlIHRoZSBhYm92ZSBjb3B5cmlnaHRcbiAgICAgICAgICAgIG5vdGljZSwgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lciBpbiB0aGVcbiAgICAgICAgICAgIGRvY3VtZW50YXRpb24gYW5kL29yIG90aGVyIG1hdGVyaWFscyBwcm92aWRlZCB3aXRoIHRoZSBkaXN0cmlidXRpb24uXG4gICAgXG4gICAgICAgICAgKiBOZWl0aGVyIHRoZSBuYW1lIG9mIEFkb2JlIFN5c3RlbXMgSW5jb3Jwb3JhdGVkIG5vciB0aGUgbmFtZXMgb2YgaXRzXG4gICAgICAgICAgICBjb250cmlidXRvcnMgbWF5IGJlIHVzZWQgdG8gZW5kb3JzZSBvciBwcm9tb3RlIHByb2R1Y3RzIGRlcml2ZWQgZnJvbVxuICAgICAgICAgICAgdGhpcyBzb2Z0d2FyZSB3aXRob3V0IHNwZWNpZmljIHByaW9yIHdyaXR0ZW4gcGVybWlzc2lvbi5cbiAgICBcbiAgICAgICAgICBUSElTIFNPRlRXQVJFIElTIFBST1ZJREVEIEJZIFRIRSBDT1BZUklHSFQgSE9MREVSUyBBTkQgQ09OVFJJQlVUT1JTIFwiQVNcbiAgICAgICAgICBJU1wiIEFORCBBTlkgRVhQUkVTUyBPUiBJTVBMSUVEIFdBUlJBTlRJRVMsIElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLFxuICAgICAgICAgIFRIRSBJTVBMSUVEIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZIEFORCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVJcbiAgICAgICAgICBQVVJQT1NFIEFSRSBESVNDTEFJTUVELiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQ09QWVJJR0hUIE9XTkVSIE9SXG4gICAgICAgICAgQ09OVFJJQlVUT1JTIEJFIExJQUJMRSBGT1IgQU5ZIERJUkVDVCwgSU5ESVJFQ1QsIElOQ0lERU5UQUwsIFNQRUNJQUwsXG4gICAgICAgICAgRVhFTVBMQVJZLCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVMgKElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLFxuICAgICAgICAgIFBST0NVUkVNRU5UIE9GIFNVQlNUSVRVVEUgR09PRFMgT1IgU0VSVklDRVM7IExPU1MgT0YgVVNFLCBEQVRBLCBPUlxuICAgICAgICAgIFBST0ZJVFM7IE9SIEJVU0lORVNTIElOVEVSUlVQVElPTikgSE9XRVZFUiBDQVVTRUQgQU5EIE9OIEFOWSBUSEVPUlkgT0ZcbiAgICAgICAgICBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQ09OVFJBQ1QsIFNUUklDVCBMSUFCSUxJVFksIE9SIFRPUlQgKElOQ0xVRElOR1xuICAgICAgICAgIE5FR0xJR0VOQ0UgT1IgT1RIRVJXSVNFKSBBUklTSU5HIElOIEFOWSBXQVkgT1VUIE9GIFRIRSBVU0UgT0YgVEhJU1xuICAgICAgICAgIFNPRlRXQVJFLCBFVkVOIElGIEFEVklTRUQgT0YgVEhFIFBPU1NJQklMSVRZIE9GIFNVQ0ggREFNQUdFLlxuICAgICAgICAqL1xuICAgICAgICAvKlxuICAgICAgICBKUEVHIGVuY29kZXIgcG9ydGVkIHRvIEphdmFTY3JpcHQgYW5kIG9wdGltaXplZCBieSBBbmRyZWFzIFJpdHRlciwgd3d3LmJ5dGVzdHJvbS5ldSwgMTEvMjAwOVxuICAgIFxuICAgICAgICBCYXNpYyBHVUkgYmxvY2tpbmcganBlZyBlbmNvZGVyXG4gICAgICAgICovXG4gICAgXG4gICAgICAgIGZ1bmN0aW9uIEpQRUdFbmNvZGVyKHF1YWxpdHkpIHtcbiAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICB2YXIgZnJvdW5kID0gTWF0aC5yb3VuZDtcbiAgICAgICAgICAgIHZhciBmZmxvb3IgPSBNYXRoLmZsb29yO1xuICAgICAgICAgICAgdmFyIFlUYWJsZSA9IG5ldyBBcnJheSg2NCk7XG4gICAgICAgICAgICB2YXIgVVZUYWJsZSA9IG5ldyBBcnJheSg2NCk7XG4gICAgICAgICAgICB2YXIgZmR0YmxfWSA9IG5ldyBBcnJheSg2NCk7XG4gICAgICAgICAgICB2YXIgZmR0YmxfVVYgPSBuZXcgQXJyYXkoNjQpO1xuICAgICAgICAgICAgdmFyIFlEQ19IVDtcbiAgICAgICAgICAgIHZhciBVVkRDX0hUO1xuICAgICAgICAgICAgdmFyIFlBQ19IVDtcbiAgICAgICAgICAgIHZhciBVVkFDX0hUO1xuICAgIFxuICAgICAgICAgICAgdmFyIGJpdGNvZGUgPSBuZXcgQXJyYXkoNjU1MzUpO1xuICAgICAgICAgICAgdmFyIGNhdGVnb3J5ID0gbmV3IEFycmF5KDY1NTM1KTtcbiAgICAgICAgICAgIHZhciBvdXRwdXRmRENUUXVhbnQgPSBuZXcgQXJyYXkoNjQpO1xuICAgICAgICAgICAgdmFyIERVID0gbmV3IEFycmF5KDY0KTtcbiAgICAgICAgICAgIHZhciBieXRlb3V0ID0gW107XG4gICAgICAgICAgICB2YXIgYnl0ZW5ldyA9IDA7XG4gICAgICAgICAgICB2YXIgYnl0ZXBvcyA9IDc7XG4gICAgXG4gICAgICAgICAgICB2YXIgWURVID0gbmV3IEFycmF5KDY0KTtcbiAgICAgICAgICAgIHZhciBVRFUgPSBuZXcgQXJyYXkoNjQpO1xuICAgICAgICAgICAgdmFyIFZEVSA9IG5ldyBBcnJheSg2NCk7XG4gICAgICAgICAgICB2YXIgY2x0ID0gbmV3IEFycmF5KDI1Nik7XG4gICAgICAgICAgICB2YXIgUkdCX1lVVl9UQUJMRSA9IG5ldyBBcnJheSgyMDQ4KTtcbiAgICAgICAgICAgIHZhciBjdXJyZW50UXVhbGl0eTtcbiAgICBcbiAgICAgICAgICAgIHZhciBaaWdaYWcgPSBbXG4gICAgICAgICAgICAgICAgICAgICAwLCAxLCA1LCA2LDE0LDE1LDI3LDI4LFxuICAgICAgICAgICAgICAgICAgICAgMiwgNCwgNywxMywxNiwyNiwyOSw0MixcbiAgICAgICAgICAgICAgICAgICAgIDMsIDgsMTIsMTcsMjUsMzAsNDEsNDMsXG4gICAgICAgICAgICAgICAgICAgICA5LDExLDE4LDI0LDMxLDQwLDQ0LDUzLFxuICAgICAgICAgICAgICAgICAgICAxMCwxOSwyMywzMiwzOSw0NSw1Miw1NCxcbiAgICAgICAgICAgICAgICAgICAgMjAsMjIsMzMsMzgsNDYsNTEsNTUsNjAsXG4gICAgICAgICAgICAgICAgICAgIDIxLDM0LDM3LDQ3LDUwLDU2LDU5LDYxLFxuICAgICAgICAgICAgICAgICAgICAzNSwzNiw0OCw0OSw1Nyw1OCw2Miw2M1xuICAgICAgICAgICAgICAgIF07XG4gICAgXG4gICAgICAgICAgICB2YXIgc3RkX2RjX2x1bWluYW5jZV9ucmNvZGVzID0gWzAsMCwxLDUsMSwxLDEsMSwxLDEsMCwwLDAsMCwwLDAsMF07XG4gICAgICAgICAgICB2YXIgc3RkX2RjX2x1bWluYW5jZV92YWx1ZXMgPSBbMCwxLDIsMyw0LDUsNiw3LDgsOSwxMCwxMV07XG4gICAgICAgICAgICB2YXIgc3RkX2FjX2x1bWluYW5jZV9ucmNvZGVzID0gWzAsMCwyLDEsMywzLDIsNCwzLDUsNSw0LDQsMCwwLDEsMHg3ZF07XG4gICAgICAgICAgICB2YXIgc3RkX2FjX2x1bWluYW5jZV92YWx1ZXMgPSBbXG4gICAgICAgICAgICAgICAgICAgIDB4MDEsMHgwMiwweDAzLDB4MDAsMHgwNCwweDExLDB4MDUsMHgxMixcbiAgICAgICAgICAgICAgICAgICAgMHgyMSwweDMxLDB4NDEsMHgwNiwweDEzLDB4NTEsMHg2MSwweDA3LFxuICAgICAgICAgICAgICAgICAgICAweDIyLDB4NzEsMHgxNCwweDMyLDB4ODEsMHg5MSwweGExLDB4MDgsXG4gICAgICAgICAgICAgICAgICAgIDB4MjMsMHg0MiwweGIxLDB4YzEsMHgxNSwweDUyLDB4ZDEsMHhmMCxcbiAgICAgICAgICAgICAgICAgICAgMHgyNCwweDMzLDB4NjIsMHg3MiwweDgyLDB4MDksMHgwYSwweDE2LFxuICAgICAgICAgICAgICAgICAgICAweDE3LDB4MTgsMHgxOSwweDFhLDB4MjUsMHgyNiwweDI3LDB4MjgsXG4gICAgICAgICAgICAgICAgICAgIDB4MjksMHgyYSwweDM0LDB4MzUsMHgzNiwweDM3LDB4MzgsMHgzOSxcbiAgICAgICAgICAgICAgICAgICAgMHgzYSwweDQzLDB4NDQsMHg0NSwweDQ2LDB4NDcsMHg0OCwweDQ5LFxuICAgICAgICAgICAgICAgICAgICAweDRhLDB4NTMsMHg1NCwweDU1LDB4NTYsMHg1NywweDU4LDB4NTksXG4gICAgICAgICAgICAgICAgICAgIDB4NWEsMHg2MywweDY0LDB4NjUsMHg2NiwweDY3LDB4NjgsMHg2OSxcbiAgICAgICAgICAgICAgICAgICAgMHg2YSwweDczLDB4NzQsMHg3NSwweDc2LDB4NzcsMHg3OCwweDc5LFxuICAgICAgICAgICAgICAgICAgICAweDdhLDB4ODMsMHg4NCwweDg1LDB4ODYsMHg4NywweDg4LDB4ODksXG4gICAgICAgICAgICAgICAgICAgIDB4OGEsMHg5MiwweDkzLDB4OTQsMHg5NSwweDk2LDB4OTcsMHg5OCxcbiAgICAgICAgICAgICAgICAgICAgMHg5OSwweDlhLDB4YTIsMHhhMywweGE0LDB4YTUsMHhhNiwweGE3LFxuICAgICAgICAgICAgICAgICAgICAweGE4LDB4YTksMHhhYSwweGIyLDB4YjMsMHhiNCwweGI1LDB4YjYsXG4gICAgICAgICAgICAgICAgICAgIDB4YjcsMHhiOCwweGI5LDB4YmEsMHhjMiwweGMzLDB4YzQsMHhjNSxcbiAgICAgICAgICAgICAgICAgICAgMHhjNiwweGM3LDB4YzgsMHhjOSwweGNhLDB4ZDIsMHhkMywweGQ0LFxuICAgICAgICAgICAgICAgICAgICAweGQ1LDB4ZDYsMHhkNywweGQ4LDB4ZDksMHhkYSwweGUxLDB4ZTIsXG4gICAgICAgICAgICAgICAgICAgIDB4ZTMsMHhlNCwweGU1LDB4ZTYsMHhlNywweGU4LDB4ZTksMHhlYSxcbiAgICAgICAgICAgICAgICAgICAgMHhmMSwweGYyLDB4ZjMsMHhmNCwweGY1LDB4ZjYsMHhmNywweGY4LFxuICAgICAgICAgICAgICAgICAgICAweGY5LDB4ZmFcbiAgICAgICAgICAgICAgICBdO1xuICAgIFxuICAgICAgICAgICAgdmFyIHN0ZF9kY19jaHJvbWluYW5jZV9ucmNvZGVzID0gWzAsMCwzLDEsMSwxLDEsMSwxLDEsMSwxLDAsMCwwLDAsMF07XG4gICAgICAgICAgICB2YXIgc3RkX2RjX2Nocm9taW5hbmNlX3ZhbHVlcyA9IFswLDEsMiwzLDQsNSw2LDcsOCw5LDEwLDExXTtcbiAgICAgICAgICAgIHZhciBzdGRfYWNfY2hyb21pbmFuY2VfbnJjb2RlcyA9IFswLDAsMiwxLDIsNCw0LDMsNCw3LDUsNCw0LDAsMSwyLDB4NzddO1xuICAgICAgICAgICAgdmFyIHN0ZF9hY19jaHJvbWluYW5jZV92YWx1ZXMgPSBbXG4gICAgICAgICAgICAgICAgICAgIDB4MDAsMHgwMSwweDAyLDB4MDMsMHgxMSwweDA0LDB4MDUsMHgyMSxcbiAgICAgICAgICAgICAgICAgICAgMHgzMSwweDA2LDB4MTIsMHg0MSwweDUxLDB4MDcsMHg2MSwweDcxLFxuICAgICAgICAgICAgICAgICAgICAweDEzLDB4MjIsMHgzMiwweDgxLDB4MDgsMHgxNCwweDQyLDB4OTEsXG4gICAgICAgICAgICAgICAgICAgIDB4YTEsMHhiMSwweGMxLDB4MDksMHgyMywweDMzLDB4NTIsMHhmMCxcbiAgICAgICAgICAgICAgICAgICAgMHgxNSwweDYyLDB4NzIsMHhkMSwweDBhLDB4MTYsMHgyNCwweDM0LFxuICAgICAgICAgICAgICAgICAgICAweGUxLDB4MjUsMHhmMSwweDE3LDB4MTgsMHgxOSwweDFhLDB4MjYsXG4gICAgICAgICAgICAgICAgICAgIDB4MjcsMHgyOCwweDI5LDB4MmEsMHgzNSwweDM2LDB4MzcsMHgzOCxcbiAgICAgICAgICAgICAgICAgICAgMHgzOSwweDNhLDB4NDMsMHg0NCwweDQ1LDB4NDYsMHg0NywweDQ4LFxuICAgICAgICAgICAgICAgICAgICAweDQ5LDB4NGEsMHg1MywweDU0LDB4NTUsMHg1NiwweDU3LDB4NTgsXG4gICAgICAgICAgICAgICAgICAgIDB4NTksMHg1YSwweDYzLDB4NjQsMHg2NSwweDY2LDB4NjcsMHg2OCxcbiAgICAgICAgICAgICAgICAgICAgMHg2OSwweDZhLDB4NzMsMHg3NCwweDc1LDB4NzYsMHg3NywweDc4LFxuICAgICAgICAgICAgICAgICAgICAweDc5LDB4N2EsMHg4MiwweDgzLDB4ODQsMHg4NSwweDg2LDB4ODcsXG4gICAgICAgICAgICAgICAgICAgIDB4ODgsMHg4OSwweDhhLDB4OTIsMHg5MywweDk0LDB4OTUsMHg5NixcbiAgICAgICAgICAgICAgICAgICAgMHg5NywweDk4LDB4OTksMHg5YSwweGEyLDB4YTMsMHhhNCwweGE1LFxuICAgICAgICAgICAgICAgICAgICAweGE2LDB4YTcsMHhhOCwweGE5LDB4YWEsMHhiMiwweGIzLDB4YjQsXG4gICAgICAgICAgICAgICAgICAgIDB4YjUsMHhiNiwweGI3LDB4YjgsMHhiOSwweGJhLDB4YzIsMHhjMyxcbiAgICAgICAgICAgICAgICAgICAgMHhjNCwweGM1LDB4YzYsMHhjNywweGM4LDB4YzksMHhjYSwweGQyLFxuICAgICAgICAgICAgICAgICAgICAweGQzLDB4ZDQsMHhkNSwweGQ2LDB4ZDcsMHhkOCwweGQ5LDB4ZGEsXG4gICAgICAgICAgICAgICAgICAgIDB4ZTIsMHhlMywweGU0LDB4ZTUsMHhlNiwweGU3LDB4ZTgsMHhlOSxcbiAgICAgICAgICAgICAgICAgICAgMHhlYSwweGYyLDB4ZjMsMHhmNCwweGY1LDB4ZjYsMHhmNywweGY4LFxuICAgICAgICAgICAgICAgICAgICAweGY5LDB4ZmFcbiAgICAgICAgICAgICAgICBdO1xuICAgIFxuICAgICAgICAgICAgZnVuY3Rpb24gaW5pdFF1YW50VGFibGVzKHNmKXtcbiAgICAgICAgICAgICAgICAgICAgdmFyIFlRVCA9IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIDE2LCAxMSwgMTAsIDE2LCAyNCwgNDAsIDUxLCA2MSxcbiAgICAgICAgICAgICAgICAgICAgICAgIDEyLCAxMiwgMTQsIDE5LCAyNiwgNTgsIDYwLCA1NSxcbiAgICAgICAgICAgICAgICAgICAgICAgIDE0LCAxMywgMTYsIDI0LCA0MCwgNTcsIDY5LCA1NixcbiAgICAgICAgICAgICAgICAgICAgICAgIDE0LCAxNywgMjIsIDI5LCA1MSwgODcsIDgwLCA2MixcbiAgICAgICAgICAgICAgICAgICAgICAgIDE4LCAyMiwgMzcsIDU2LCA2OCwxMDksMTAzLCA3NyxcbiAgICAgICAgICAgICAgICAgICAgICAgIDI0LCAzNSwgNTUsIDY0LCA4MSwxMDQsMTEzLCA5MixcbiAgICAgICAgICAgICAgICAgICAgICAgIDQ5LCA2NCwgNzgsIDg3LDEwMywxMjEsMTIwLDEwMSxcbiAgICAgICAgICAgICAgICAgICAgICAgIDcyLCA5MiwgOTUsIDk4LDExMiwxMDAsMTAzLCA5OVxuICAgICAgICAgICAgICAgICAgICBdO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDY0OyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0ID0gZmZsb29yKChZUVRbaV0qc2YrNTApLzEwMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodCA8IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ID0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodCA+IDI1NSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHQgPSAyNTU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBZVGFibGVbWmlnWmFnW2ldXSA9IHQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdmFyIFVWUVQgPSBbXG4gICAgICAgICAgICAgICAgICAgICAgICAxNywgMTgsIDI0LCA0NywgOTksIDk5LCA5OSwgOTksXG4gICAgICAgICAgICAgICAgICAgICAgICAxOCwgMjEsIDI2LCA2NiwgOTksIDk5LCA5OSwgOTksXG4gICAgICAgICAgICAgICAgICAgICAgICAyNCwgMjYsIDU2LCA5OSwgOTksIDk5LCA5OSwgOTksXG4gICAgICAgICAgICAgICAgICAgICAgICA0NywgNjYsIDk5LCA5OSwgOTksIDk5LCA5OSwgOTksXG4gICAgICAgICAgICAgICAgICAgICAgICA5OSwgOTksIDk5LCA5OSwgOTksIDk5LCA5OSwgOTksXG4gICAgICAgICAgICAgICAgICAgICAgICA5OSwgOTksIDk5LCA5OSwgOTksIDk5LCA5OSwgOTksXG4gICAgICAgICAgICAgICAgICAgICAgICA5OSwgOTksIDk5LCA5OSwgOTksIDk5LCA5OSwgOTksXG4gICAgICAgICAgICAgICAgICAgICAgICA5OSwgOTksIDk5LCA5OSwgOTksIDk5LCA5OSwgOTlcbiAgICAgICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCA2NDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdSA9IGZmbG9vcigoVVZRVFtqXSpzZis1MCkvMTAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh1IDwgMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHUgPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh1ID4gMjU1KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdSA9IDI1NTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIFVWVGFibGVbWmlnWmFnW2pdXSA9IHU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdmFyIGFhc2YgPSBbXG4gICAgICAgICAgICAgICAgICAgICAgICAxLjAsIDEuMzg3MDM5ODQ1LCAxLjMwNjU2Mjk2NSwgMS4xNzU4NzU2MDIsXG4gICAgICAgICAgICAgICAgICAgICAgICAxLjAsIDAuNzg1Njk0OTU4LCAwLjU0MTE5NjEwMCwgMC4yNzU4OTkzNzlcbiAgICAgICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGsgPSAwO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciByb3cgPSAwOyByb3cgPCA4OyByb3crKylcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgY29sID0gMDsgY29sIDwgODsgY29sKyspXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmR0YmxfWVtrXSAgPSAoMS4wIC8gKFlUYWJsZSBbWmlnWmFnW2tdXSAqIGFhc2Zbcm93XSAqIGFhc2ZbY29sXSAqIDguMCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZkdGJsX1VWW2tdID0gKDEuMCAvIChVVlRhYmxlW1ppZ1phZ1trXV0gKiBhYXNmW3Jvd10gKiBhYXNmW2NvbF0gKiA4LjApKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBrKys7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gY29tcHV0ZUh1ZmZtYW5UYmwobnJjb2Rlcywgc3RkX3RhYmxlKXtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvZGV2YWx1ZSA9IDA7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwb3NfaW5fdGFibGUgPSAwO1xuICAgICAgICAgICAgICAgICAgICB2YXIgSFQgPSBuZXcgQXJyYXkoKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgayA9IDE7IGsgPD0gMTY7IGsrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDE7IGogPD0gbnJjb2Rlc1trXTsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgSFRbc3RkX3RhYmxlW3Bvc19pbl90YWJsZV1dID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgSFRbc3RkX3RhYmxlW3Bvc19pbl90YWJsZV1dWzBdID0gY29kZXZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEhUW3N0ZF90YWJsZVtwb3NfaW5fdGFibGVdXVsxXSA9IGs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zX2luX3RhYmxlKys7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29kZXZhbHVlKys7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RldmFsdWUqPTI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEhUO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBpbml0SHVmZm1hblRibCgpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBZRENfSFQgPSBjb21wdXRlSHVmZm1hblRibChzdGRfZGNfbHVtaW5hbmNlX25yY29kZXMsc3RkX2RjX2x1bWluYW5jZV92YWx1ZXMpO1xuICAgICAgICAgICAgICAgICAgICBVVkRDX0hUID0gY29tcHV0ZUh1ZmZtYW5UYmwoc3RkX2RjX2Nocm9taW5hbmNlX25yY29kZXMsc3RkX2RjX2Nocm9taW5hbmNlX3ZhbHVlcyk7XG4gICAgICAgICAgICAgICAgICAgIFlBQ19IVCA9IGNvbXB1dGVIdWZmbWFuVGJsKHN0ZF9hY19sdW1pbmFuY2VfbnJjb2RlcyxzdGRfYWNfbHVtaW5hbmNlX3ZhbHVlcyk7XG4gICAgICAgICAgICAgICAgICAgIFVWQUNfSFQgPSBjb21wdXRlSHVmZm1hblRibChzdGRfYWNfY2hyb21pbmFuY2VfbnJjb2RlcyxzdGRfYWNfY2hyb21pbmFuY2VfdmFsdWVzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gaW5pdENhdGVnb3J5TnVtYmVyKClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBucmxvd2VyID0gMTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5ydXBwZXIgPSAyO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBjYXQgPSAxOyBjYXQgPD0gMTU7IGNhdCsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL1Bvc2l0aXZlIG51bWJlcnNcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIG5yID0gbnJsb3dlcjsgbnI8bnJ1cHBlcjsgbnIrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhdGVnb3J5WzMyNzY3K25yXSA9IGNhdDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiaXRjb2RlWzMyNzY3K25yXSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJpdGNvZGVbMzI3NjcrbnJdWzFdID0gY2F0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJpdGNvZGVbMzI3NjcrbnJdWzBdID0gbnI7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvL05lZ2F0aXZlIG51bWJlcnNcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIG5ybmVnID0tKG5ydXBwZXItMSk7IG5ybmVnPD0tbnJsb3dlcjsgbnJuZWcrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhdGVnb3J5WzMyNzY3K25ybmVnXSA9IGNhdDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiaXRjb2RlWzMyNzY3K25ybmVnXSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJpdGNvZGVbMzI3NjcrbnJuZWddWzFdID0gY2F0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJpdGNvZGVbMzI3NjcrbnJuZWddWzBdID0gbnJ1cHBlci0xK25ybmVnO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgbnJsb3dlciA8PD0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ydXBwZXIgPDw9IDE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gaW5pdFJHQllVVlRhYmxlKCkge1xuICAgICAgICAgICAgICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgMjU2O2krKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgUkdCX1lVVl9UQUJMRVtpXSAgICAgICAgICAgID0gIDE5NTk1ICogaTtcbiAgICAgICAgICAgICAgICAgICAgICAgIFJHQl9ZVVZfVEFCTEVbKGkrIDI1Nik+PjBdICA9ICAzODQ3MCAqIGk7XG4gICAgICAgICAgICAgICAgICAgICAgICBSR0JfWVVWX1RBQkxFWyhpKyA1MTIpPj4wXSAgPSAgIDc0NzEgKiBpICsgMHg4MDAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgUkdCX1lVVl9UQUJMRVsoaSsgNzY4KT4+MF0gID0gLTExMDU5ICogaTtcbiAgICAgICAgICAgICAgICAgICAgICAgIFJHQl9ZVVZfVEFCTEVbKGkrMTAyNCk+PjBdICA9IC0yMTcwOSAqIGk7XG4gICAgICAgICAgICAgICAgICAgICAgICBSR0JfWVVWX1RBQkxFWyhpKzEyODApPj4wXSAgPSAgMzI3NjggKiBpICsgMHg4MDdGRkY7XG4gICAgICAgICAgICAgICAgICAgICAgICBSR0JfWVVWX1RBQkxFWyhpKzE1MzYpPj4wXSAgPSAtMjc0MzkgKiBpO1xuICAgICAgICAgICAgICAgICAgICAgICAgUkdCX1lVVl9UQUJMRVsoaSsxNzkyKT4+MF0gID0gLSA1MzI5ICogaTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAvLyBJTyBmdW5jdGlvbnNcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiB3cml0ZUJpdHMoYnMpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBic1swXTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBvc3ZhbCA9IGJzWzFdLTE7XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlICggcG9zdmFsID49IDAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgJiAoMSA8PCBwb3N2YWwpICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ5dGVuZXcgfD0gKDEgPDwgYnl0ZXBvcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBwb3N2YWwtLTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ5dGVwb3MtLTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChieXRlcG9zIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChieXRlbmV3ID09IDB4RkYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd3JpdGVCeXRlKDB4RkYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3cml0ZUJ5dGUoMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3cml0ZUJ5dGUoYnl0ZW5ldyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ5dGVwb3M9NztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBieXRlbmV3PTA7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gd3JpdGVCeXRlKHZhbHVlKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgYnl0ZW91dC5wdXNoKGNsdFt2YWx1ZV0pOyAvLyB3cml0ZSBjaGFyIGRpcmVjdGx5IGluc3RlYWQgb2YgY29udmVydGluZyBsYXRlclxuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiB3cml0ZVdvcmQodmFsdWUpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB3cml0ZUJ5dGUoKHZhbHVlPj44KSYweEZGKTtcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVCeXRlKCh2YWx1ZSAgICkmMHhGRik7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIC8vIERDVCAmIHF1YW50aXphdGlvbiBjb3JlXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gZkRDVFF1YW50KGRhdGEsIGZkdGJsKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGQwLCBkMSwgZDIsIGQzLCBkNCwgZDUsIGQ2LCBkNztcbiAgICAgICAgICAgICAgICAgICAgLyogUGFzcyAxOiBwcm9jZXNzIHJvd3MuICovXG4gICAgICAgICAgICAgICAgICAgIHZhciBkYXRhT2ZmPTA7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgSTggPSA4O1xuICAgICAgICAgICAgICAgICAgICB2YXIgSTY0ID0gNjQ7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoaT0wOyBpPEk4OyArK2kpXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGQwID0gZGF0YVtkYXRhT2ZmXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGQxID0gZGF0YVtkYXRhT2ZmKzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZDIgPSBkYXRhW2RhdGFPZmYrMl07XG4gICAgICAgICAgICAgICAgICAgICAgICBkMyA9IGRhdGFbZGF0YU9mZiszXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGQ0ID0gZGF0YVtkYXRhT2ZmKzRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZDUgPSBkYXRhW2RhdGFPZmYrNV07XG4gICAgICAgICAgICAgICAgICAgICAgICBkNiA9IGRhdGFbZGF0YU9mZis2XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGQ3ID0gZGF0YVtkYXRhT2ZmKzddO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRtcDAgPSBkMCArIGQ3O1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRtcDcgPSBkMCAtIGQ3O1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRtcDEgPSBkMSArIGQ2O1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRtcDYgPSBkMSAtIGQ2O1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRtcDIgPSBkMiArIGQ1O1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRtcDUgPSBkMiAtIGQ1O1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRtcDMgPSBkMyArIGQ0O1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRtcDQgPSBkMyAtIGQ0O1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgLyogRXZlbiBwYXJ0ICovXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdG1wMTAgPSB0bXAwICsgdG1wMzsgICAgLyogcGhhc2UgMiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRtcDEzID0gdG1wMCAtIHRtcDM7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdG1wMTEgPSB0bXAxICsgdG1wMjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0bXAxMiA9IHRtcDEgLSB0bXAyO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVtkYXRhT2ZmXSA9IHRtcDEwICsgdG1wMTE7IC8qIHBoYXNlIDMgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFbZGF0YU9mZis0XSA9IHRtcDEwIC0gdG1wMTE7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgejEgPSAodG1wMTIgKyB0bXAxMykgKiAwLjcwNzEwNjc4MTsgLyogYzQgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFbZGF0YU9mZisyXSA9IHRtcDEzICsgejE7IC8qIHBoYXNlIDUgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFbZGF0YU9mZis2XSA9IHRtcDEzIC0gejE7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBPZGQgcGFydCAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgdG1wMTAgPSB0bXA0ICsgdG1wNTsgLyogcGhhc2UgMiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgdG1wMTEgPSB0bXA1ICsgdG1wNjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRtcDEyID0gdG1wNiArIHRtcDc7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBUaGUgcm90YXRvciBpcyBtb2RpZmllZCBmcm9tIGZpZyA0LTggdG8gYXZvaWQgZXh0cmEgbmVnYXRpb25zLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHo1ID0gKHRtcDEwIC0gdG1wMTIpICogMC4zODI2ODM0MzM7IC8qIGM2ICovXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgejIgPSAwLjU0MTE5NjEwMCAqIHRtcDEwICsgejU7IC8qIGMyLWM2ICovXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgejQgPSAxLjMwNjU2Mjk2NSAqIHRtcDEyICsgejU7IC8qIGMyK2M2ICovXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgejMgPSB0bXAxMSAqIDAuNzA3MTA2NzgxOyAvKiBjNCAqL1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHoxMSA9IHRtcDcgKyB6MzsgICAgLyogcGhhc2UgNSAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHoxMyA9IHRtcDcgLSB6MztcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFbZGF0YU9mZis1XSA9IHoxMyArIHoyOyAvKiBwaGFzZSA2ICovXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhW2RhdGFPZmYrM10gPSB6MTMgLSB6MjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFbZGF0YU9mZisxXSA9IHoxMSArIHo0O1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVtkYXRhT2ZmKzddID0gejExIC0gejQ7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhT2ZmICs9IDg7IC8qIGFkdmFuY2UgcG9pbnRlciB0byBuZXh0IHJvdyAqL1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIC8qIFBhc3MgMjogcHJvY2VzcyBjb2x1bW5zLiAqL1xuICAgICAgICAgICAgICAgICAgICBkYXRhT2ZmID0gMDtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChpPTA7IGk8STg7ICsraSlcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgZDAgPSBkYXRhW2RhdGFPZmZdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZDEgPSBkYXRhW2RhdGFPZmYgKyA4XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGQyID0gZGF0YVtkYXRhT2ZmICsgMTZdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZDMgPSBkYXRhW2RhdGFPZmYgKyAyNF07XG4gICAgICAgICAgICAgICAgICAgICAgICBkNCA9IGRhdGFbZGF0YU9mZiArIDMyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGQ1ID0gZGF0YVtkYXRhT2ZmICsgNDBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZDYgPSBkYXRhW2RhdGFPZmYgKyA0OF07XG4gICAgICAgICAgICAgICAgICAgICAgICBkNyA9IGRhdGFbZGF0YU9mZiArIDU2XTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0bXAwcDIgPSBkMCArIGQ3O1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRtcDdwMiA9IGQwIC0gZDc7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdG1wMXAyID0gZDEgKyBkNjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0bXA2cDIgPSBkMSAtIGQ2O1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRtcDJwMiA9IGQyICsgZDU7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdG1wNXAyID0gZDIgLSBkNTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0bXAzcDIgPSBkMyArIGQ0O1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRtcDRwMiA9IGQzIC0gZDQ7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBFdmVuIHBhcnQgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0bXAxMHAyID0gdG1wMHAyICsgdG1wM3AyOyAgLyogcGhhc2UgMiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRtcDEzcDIgPSB0bXAwcDIgLSB0bXAzcDI7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdG1wMTFwMiA9IHRtcDFwMiArIHRtcDJwMjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0bXAxMnAyID0gdG1wMXAyIC0gdG1wMnAyO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVtkYXRhT2ZmXSA9IHRtcDEwcDIgKyB0bXAxMXAyOyAvKiBwaGFzZSAzICovXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhW2RhdGFPZmYrMzJdID0gdG1wMTBwMiAtIHRtcDExcDI7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgejFwMiA9ICh0bXAxMnAyICsgdG1wMTNwMikgKiAwLjcwNzEwNjc4MTsgLyogYzQgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFbZGF0YU9mZisxNl0gPSB0bXAxM3AyICsgejFwMjsgLyogcGhhc2UgNSAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVtkYXRhT2ZmKzQ4XSA9IHRtcDEzcDIgLSB6MXAyO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgLyogT2RkIHBhcnQgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHRtcDEwcDIgPSB0bXA0cDIgKyB0bXA1cDI7IC8qIHBoYXNlIDIgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHRtcDExcDIgPSB0bXA1cDIgKyB0bXA2cDI7XG4gICAgICAgICAgICAgICAgICAgICAgICB0bXAxMnAyID0gdG1wNnAyICsgdG1wN3AyO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgLyogVGhlIHJvdGF0b3IgaXMgbW9kaWZpZWQgZnJvbSBmaWcgNC04IHRvIGF2b2lkIGV4dHJhIG5lZ2F0aW9ucy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB6NXAyID0gKHRtcDEwcDIgLSB0bXAxMnAyKSAqIDAuMzgyNjgzNDMzOyAvKiBjNiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHoycDIgPSAwLjU0MTE5NjEwMCAqIHRtcDEwcDIgKyB6NXAyOyAvKiBjMi1jNiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHo0cDIgPSAxLjMwNjU2Mjk2NSAqIHRtcDEycDIgKyB6NXAyOyAvKiBjMitjNiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHozcDIgPSB0bXAxMXAyICogMC43MDcxMDY3ODE7IC8qIGM0ICovXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgejExcDIgPSB0bXA3cDIgKyB6M3AyOyAgLyogcGhhc2UgNSAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHoxM3AyID0gdG1wN3AyIC0gejNwMjtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFbZGF0YU9mZis0MF0gPSB6MTNwMiArIHoycDI7IC8qIHBoYXNlIDYgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFbZGF0YU9mZisyNF0gPSB6MTNwMiAtIHoycDI7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhW2RhdGFPZmYrIDhdID0gejExcDIgKyB6NHAyO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVtkYXRhT2ZmKzU2XSA9IHoxMXAyIC0gejRwMjtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFPZmYrKzsgLyogYWR2YW5jZSBwb2ludGVyIHRvIG5leHQgY29sdW1uICovXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8gUXVhbnRpemUvZGVzY2FsZSB0aGUgY29lZmZpY2llbnRzXG4gICAgICAgICAgICAgICAgICAgIHZhciBmRENUUXVhbnQ7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoaT0wOyBpPEk2NDsgKytpKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBBcHBseSB0aGUgcXVhbnRpemF0aW9uIGFuZCBzY2FsaW5nIGZhY3RvciAmIFJvdW5kIHRvIG5lYXJlc3QgaW50ZWdlclxuICAgICAgICAgICAgICAgICAgICAgICAgZkRDVFF1YW50ID0gZGF0YVtpXSpmZHRibFtpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dGZEQ1RRdWFudFtpXSA9IChmRENUUXVhbnQgPiAwLjApID8gKChmRENUUXVhbnQgKyAwLjUpfDApIDogKChmRENUUXVhbnQgLSAwLjUpfDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9vdXRwdXRmRENUUXVhbnRbaV0gPSBmcm91bmQoZkRDVFF1YW50KTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3V0cHV0ZkRDVFF1YW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiB3cml0ZUFQUDAoKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVXb3JkKDB4RkZFMCk7IC8vIG1hcmtlclxuICAgICAgICAgICAgICAgICAgICB3cml0ZVdvcmQoMTYpOyAvLyBsZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVCeXRlKDB4NEEpOyAvLyBKXG4gICAgICAgICAgICAgICAgICAgIHdyaXRlQnl0ZSgweDQ2KTsgLy8gRlxuICAgICAgICAgICAgICAgICAgICB3cml0ZUJ5dGUoMHg0OSk7IC8vIElcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVCeXRlKDB4NDYpOyAvLyBGXG4gICAgICAgICAgICAgICAgICAgIHdyaXRlQnl0ZSgwKTsgLy8gPSBcIkpGSUZcIiwnXFwwJ1xuICAgICAgICAgICAgICAgICAgICB3cml0ZUJ5dGUoMSk7IC8vIHZlcnNpb25oaVxuICAgICAgICAgICAgICAgICAgICB3cml0ZUJ5dGUoMSk7IC8vIHZlcnNpb25sb1xuICAgICAgICAgICAgICAgICAgICB3cml0ZUJ5dGUoMCk7IC8vIHh5dW5pdHNcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVXb3JkKDEpOyAvLyB4ZGVuc2l0eVxuICAgICAgICAgICAgICAgICAgICB3cml0ZVdvcmQoMSk7IC8vIHlkZW5zaXR5XG4gICAgICAgICAgICAgICAgICAgIHdyaXRlQnl0ZSgwKTsgLy8gdGh1bWJud2lkdGhcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVCeXRlKDApOyAvLyB0aHVtYm5oZWlnaHRcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gd3JpdGVTT0YwKHdpZHRoLCBoZWlnaHQpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB3cml0ZVdvcmQoMHhGRkMwKTsgLy8gbWFya2VyXG4gICAgICAgICAgICAgICAgICAgIHdyaXRlV29yZCgxNyk7ICAgLy8gbGVuZ3RoLCB0cnVlY29sb3IgWVVWIEpQR1xuICAgICAgICAgICAgICAgICAgICB3cml0ZUJ5dGUoOCk7ICAgIC8vIHByZWNpc2lvblxuICAgICAgICAgICAgICAgICAgICB3cml0ZVdvcmQoaGVpZ2h0KTtcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVXb3JkKHdpZHRoKTtcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVCeXRlKDMpOyAgICAvLyBucm9mY29tcG9uZW50c1xuICAgICAgICAgICAgICAgICAgICB3cml0ZUJ5dGUoMSk7ICAgIC8vIElkWVxuICAgICAgICAgICAgICAgICAgICB3cml0ZUJ5dGUoMHgxMSk7IC8vIEhWWVxuICAgICAgICAgICAgICAgICAgICB3cml0ZUJ5dGUoMCk7ICAgIC8vIFFUWVxuICAgICAgICAgICAgICAgICAgICB3cml0ZUJ5dGUoMik7ICAgIC8vIElkVVxuICAgICAgICAgICAgICAgICAgICB3cml0ZUJ5dGUoMHgxMSk7IC8vIEhWVVxuICAgICAgICAgICAgICAgICAgICB3cml0ZUJ5dGUoMSk7ICAgIC8vIFFUVVxuICAgICAgICAgICAgICAgICAgICB3cml0ZUJ5dGUoMyk7ICAgIC8vIElkVlxuICAgICAgICAgICAgICAgICAgICB3cml0ZUJ5dGUoMHgxMSk7IC8vIEhWVlxuICAgICAgICAgICAgICAgICAgICB3cml0ZUJ5dGUoMSk7ICAgIC8vIFFUVlxuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiB3cml0ZURRVCgpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB3cml0ZVdvcmQoMHhGRkRCKTsgLy8gbWFya2VyXG4gICAgICAgICAgICAgICAgICAgIHdyaXRlV29yZCgxMzIpOyAgICAvLyBsZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVCeXRlKDApO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpPTA7IGk8NjQ7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgd3JpdGVCeXRlKFlUYWJsZVtpXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgd3JpdGVCeXRlKDEpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBqPTA7IGo8NjQ7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgd3JpdGVCeXRlKFVWVGFibGVbal0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHdyaXRlREhUKClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHdyaXRlV29yZCgweEZGQzQpOyAvLyBtYXJrZXJcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVXb3JkKDB4MDFBMik7IC8vIGxlbmd0aFxuICAgIFxuICAgICAgICAgICAgICAgICAgICB3cml0ZUJ5dGUoMCk7IC8vIEhUWURDaW5mb1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpPTA7IGk8MTY7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgd3JpdGVCeXRlKHN0ZF9kY19sdW1pbmFuY2VfbnJjb2Rlc1tpKzFdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBqPTA7IGo8PTExOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdyaXRlQnl0ZShzdGRfZGNfbHVtaW5hbmNlX3ZhbHVlc1tqXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVCeXRlKDB4MTApOyAvLyBIVFlBQ2luZm9cbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaz0wOyBrPDE2OyBrKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdyaXRlQnl0ZShzdGRfYWNfbHVtaW5hbmNlX25yY29kZXNbaysxXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgbD0wOyBsPD0xNjE7IGwrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgd3JpdGVCeXRlKHN0ZF9hY19sdW1pbmFuY2VfdmFsdWVzW2xdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgICAgICB3cml0ZUJ5dGUoMSk7IC8vIEhUVURDaW5mb1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBtPTA7IG08MTY7IG0rKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgd3JpdGVCeXRlKHN0ZF9kY19jaHJvbWluYW5jZV9ucmNvZGVzW20rMV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIG49MDsgbjw9MTE7IG4rKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgd3JpdGVCeXRlKHN0ZF9kY19jaHJvbWluYW5jZV92YWx1ZXNbbl0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIHdyaXRlQnl0ZSgweDExKTsgLy8gSFRVQUNpbmZvXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIG89MDsgbzwxNjsgbysrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3cml0ZUJ5dGUoc3RkX2FjX2Nocm9taW5hbmNlX25yY29kZXNbbysxXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgcD0wOyBwPD0xNjE7IHArKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgd3JpdGVCeXRlKHN0ZF9hY19jaHJvbWluYW5jZV92YWx1ZXNbcF0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHdyaXRlU09TKClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHdyaXRlV29yZCgweEZGREEpOyAvLyBtYXJrZXJcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVXb3JkKDEyKTsgLy8gbGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIHdyaXRlQnl0ZSgzKTsgLy8gbnJvZmNvbXBvbmVudHNcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVCeXRlKDEpOyAvLyBJZFlcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVCeXRlKDApOyAvLyBIVFlcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVCeXRlKDIpOyAvLyBJZFVcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVCeXRlKDB4MTEpOyAvLyBIVFVcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVCeXRlKDMpOyAvLyBJZFZcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVCeXRlKDB4MTEpOyAvLyBIVFZcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVCeXRlKDApOyAvLyBTc1xuICAgICAgICAgICAgICAgICAgICB3cml0ZUJ5dGUoMHgzZik7IC8vIFNlXG4gICAgICAgICAgICAgICAgICAgIHdyaXRlQnl0ZSgwKTsgLy8gQmZcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gcHJvY2Vzc0RVKENEVSwgZmR0YmwsIERDLCBIVERDLCBIVEFDKXtcbiAgICAgICAgICAgICAgICAgICAgdmFyIEVPQiA9IEhUQUNbMHgwMF07XG4gICAgICAgICAgICAgICAgICAgIHZhciBNMTZ6ZXJvZXMgPSBIVEFDWzB4RjBdO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcG9zO1xuICAgICAgICAgICAgICAgICAgICB2YXIgSTE2ID0gMTY7XG4gICAgICAgICAgICAgICAgICAgIHZhciBJNjMgPSA2MztcbiAgICAgICAgICAgICAgICAgICAgdmFyIEk2NCA9IDY0O1xuICAgICAgICAgICAgICAgICAgICB2YXIgRFVfRENUID0gZkRDVFF1YW50KENEVSwgZmR0YmwpO1xuICAgICAgICAgICAgICAgICAgICAvL1ppZ1phZyByZW9yZGVyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGo9MDtqPEk2NDsrK2opIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIERVW1ppZ1phZ1tqXV09RFVfRENUW2pdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciBEaWZmID0gRFVbMF0gLSBEQzsgREMgPSBEVVswXTtcbiAgICAgICAgICAgICAgICAgICAgLy9FbmNvZGUgRENcbiAgICAgICAgICAgICAgICAgICAgaWYgKERpZmY9PTApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdyaXRlQml0cyhIVERDWzBdKTsgLy8gRGlmZiBtaWdodCBiZSAwXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwb3MgPSAzMjc2NytEaWZmO1xuICAgICAgICAgICAgICAgICAgICAgICAgd3JpdGVCaXRzKEhURENbY2F0ZWdvcnlbcG9zXV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgd3JpdGVCaXRzKGJpdGNvZGVbcG9zXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy9FbmNvZGUgQUNzXG4gICAgICAgICAgICAgICAgICAgIHZhciBlbmQwcG9zID0gNjM7IC8vIHdhcyBjb25zdC4uLiB3aGljaCBpcyBjcmF6eVxuICAgICAgICAgICAgICAgICAgICBmb3IgKDsgKGVuZDBwb3M+MCkmJihEVVtlbmQwcG9zXT09MCk7IGVuZDBwb3MtLSkge307XG4gICAgICAgICAgICAgICAgICAgIC8vZW5kMHBvcyA9IGZpcnN0IGVsZW1lbnQgaW4gcmV2ZXJzZSBvcmRlciAhPTBcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBlbmQwcG9zID09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdyaXRlQml0cyhFT0IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIERDO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciBpID0gMTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxuZztcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKCBpIDw9IGVuZDBwb3MgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc3RhcnRwb3MgPSBpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICg7IChEVVtpXT09MCkgJiYgKGk8PWVuZDBwb3MpOyArK2kpIHt9XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbnJ6ZXJvZXMgPSBpLXN0YXJ0cG9zO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBucnplcm9lcyA+PSBJMTYgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG5nID0gbnJ6ZXJvZXM+PjQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgbnJtYXJrZXI9MTsgbnJtYXJrZXIgPD0gbG5nOyArK25ybWFya2VyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3cml0ZUJpdHMoTTE2emVyb2VzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBucnplcm9lcyA9IG5yemVyb2VzJjB4RjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHBvcyA9IDMyNzY3K0RVW2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgd3JpdGVCaXRzKEhUQUNbKG5yemVyb2VzPDw0KStjYXRlZ29yeVtwb3NdXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB3cml0ZUJpdHMoYml0Y29kZVtwb3NdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoIGVuZDBwb3MgIT0gSTYzICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgd3JpdGVCaXRzKEVPQik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIERDO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBpbml0Q2hhckxvb2t1cFRhYmxlKCl7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzZmNjID0gU3RyaW5nLmZyb21DaGFyQ29kZTtcbiAgICAgICAgICAgICAgICAgICAgZm9yKHZhciBpPTA7IGkgPCAyNTY7IGkrKyl7IC8vLy8vIEFDSFRVTkcgLy8gMjU1XG4gICAgICAgICAgICAgICAgICAgICAgICBjbHRbaV0gPSBzZmNjKGkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIHRoaXMuZW5jb2RlID0gZnVuY3Rpb24oaW1hZ2UscXVhbGl0eSkgLy8gaW1hZ2UgZGF0YSBvYmplY3RcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHZhciB0aW1lX3N0YXJ0ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGlmKHF1YWxpdHkpIHNldFF1YWxpdHkocXVhbGl0eSk7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIEluaXRpYWxpemUgYml0IHdyaXRlclxuICAgICAgICAgICAgICAgICAgICBieXRlb3V0ID0gbmV3IEFycmF5KCk7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGVuZXc9MDtcbiAgICAgICAgICAgICAgICAgICAgYnl0ZXBvcz03O1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyBBZGQgSlBFRyBoZWFkZXJzXG4gICAgICAgICAgICAgICAgICAgIHdyaXRlV29yZCgweEZGRDgpOyAvLyBTT0lcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVBUFAwKCk7XG4gICAgICAgICAgICAgICAgICAgIHdyaXRlRFFUKCk7XG4gICAgICAgICAgICAgICAgICAgIHdyaXRlU09GMChpbWFnZS53aWR0aCxpbWFnZS5oZWlnaHQpO1xuICAgICAgICAgICAgICAgICAgICB3cml0ZURIVCgpO1xuICAgICAgICAgICAgICAgICAgICB3cml0ZVNPUygpO1xuICAgIFxuICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyBFbmNvZGUgOHg4IG1hY3JvYmxvY2tzXG4gICAgICAgICAgICAgICAgICAgIHZhciBEQ1k9MDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIERDVT0wO1xuICAgICAgICAgICAgICAgICAgICB2YXIgRENWPTA7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGJ5dGVuZXc9MDtcbiAgICAgICAgICAgICAgICAgICAgYnl0ZXBvcz03O1xuICAgIFxuICAgIFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVuY29kZS5kaXNwbGF5TmFtZSA9IFwiX2VuY29kZV9cIjtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgdmFyIGltYWdlRGF0YSA9IGltYWdlLmRhdGE7XG4gICAgICAgICAgICAgICAgICAgIHZhciB3aWR0aCA9IGltYWdlLndpZHRoO1xuICAgICAgICAgICAgICAgICAgICB2YXIgaGVpZ2h0ID0gaW1hZ2UuaGVpZ2h0O1xuICAgIFxuICAgICAgICAgICAgICAgICAgICB2YXIgcXVhZFdpZHRoID0gd2lkdGgqNDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRyaXBsZVdpZHRoID0gd2lkdGgqMztcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgdmFyIHgsIHkgPSAwO1xuICAgICAgICAgICAgICAgICAgICB2YXIgciwgZywgYjtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN0YXJ0LHAsIGNvbCxyb3cscG9zO1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSh5IDwgaGVpZ2h0KXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHggPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUoeCA8IHF1YWRXaWR0aCl7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydCA9IHF1YWRXaWR0aCAqIHkgKyB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgcCA9IHN0YXJ0O1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sID0gLTE7XG4gICAgICAgICAgICAgICAgICAgICAgICByb3cgPSAwO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yKHBvcz0wOyBwb3MgPCA2NDsgcG9zKyspe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvdyA9IHBvcyA+PiAzOy8vIC84XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sID0gKCBwb3MgJiA3ICkgKiA0OyAvLyAlOFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHAgPSBzdGFydCArICggcm93ICogcXVhZFdpZHRoICkgKyBjb2w7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoeStyb3cgPj0gaGVpZ2h0KXsgLy8gcGFkZGluZyBib3R0b21cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcC09IChxdWFkV2lkdGgqKHkrMStyb3ctaGVpZ2h0KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKHgrY29sID49IHF1YWRXaWR0aCl7IC8vIHBhZGRpbmcgcmlnaHRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcC09ICgoeCtjb2wpIC0gcXVhZFdpZHRoICs0KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByID0gaW1hZ2VEYXRhWyBwKysgXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnID0gaW1hZ2VEYXRhWyBwKysgXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiID0gaW1hZ2VEYXRhWyBwKysgXTtcbiAgICBcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiAvLyBjYWxjdWxhdGUgWVVWIHZhbHVlcyBkeW5hbWljYWxseVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFlEVVtwb3NdPSgoKCAwLjI5OTAwKSpyKyggMC41ODcwMCkqZysoIDAuMTE0MDApKmIpKS0xMjg7IC8vLTB4ODBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBVRFVbcG9zXT0oKCgtMC4xNjg3NCkqcisoLTAuMzMxMjYpKmcrKCAwLjUwMDAwKSpiKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgVkRVW3Bvc109KCgoIDAuNTAwMDApKnIrKC0wLjQxODY5KSpnKygtMC4wODEzMSkqYikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICovXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdXNlIGxvb2t1cCB0YWJsZSAoc2xpZ2h0bHkgZmFzdGVyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFlEVVtwb3NdID0gKChSR0JfWVVWX1RBQkxFW3JdICAgICAgICAgICAgICsgUkdCX1lVVl9UQUJMRVsoZyArICAyNTYpPj4wXSArIFJHQl9ZVVZfVEFCTEVbKGIgKyAgNTEyKT4+MF0pID4+IDE2KS0xMjg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgVURVW3Bvc10gPSAoKFJHQl9ZVVZfVEFCTEVbKHIgKyAgNzY4KT4+MF0gKyBSR0JfWVVWX1RBQkxFWyhnICsgMTAyNCk+PjBdICsgUkdCX1lVVl9UQUJMRVsoYiArIDEyODApPj4wXSkgPj4gMTYpLTEyODtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBWRFVbcG9zXSA9ICgoUkdCX1lVVl9UQUJMRVsociArIDEyODApPj4wXSArIFJHQl9ZVVZfVEFCTEVbKGcgKyAxNTM2KT4+MF0gKyBSR0JfWVVWX1RBQkxFWyhiICsgMTc5Mik+PjBdKSA+PiAxNiktMTI4O1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgRENZID0gcHJvY2Vzc0RVKFlEVSwgZmR0YmxfWSwgRENZLCBZRENfSFQsIFlBQ19IVCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBEQ1UgPSBwcm9jZXNzRFUoVURVLCBmZHRibF9VViwgRENVLCBVVkRDX0hULCBVVkFDX0hUKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIERDViA9IHByb2Nlc3NEVShWRFUsIGZkdGJsX1VWLCBEQ1YsIFVWRENfSFQsIFVWQUNfSFQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgeCs9MzI7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB5Kz04O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgXG4gICAgICAgICAgICAgICAgICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8gRG8gdGhlIGJpdCBhbGlnbm1lbnQgb2YgdGhlIEVPSSBtYXJrZXJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBieXRlcG9zID49IDAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZmlsbGJpdHMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGxiaXRzWzFdID0gYnl0ZXBvcysxO1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlsbGJpdHNbMF0gPSAoMTw8KGJ5dGVwb3MrMSkpLTE7XG4gICAgICAgICAgICAgICAgICAgICAgICB3cml0ZUJpdHMoZmlsbGJpdHMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIHdyaXRlV29yZCgweEZGRDkpOyAvL0VPSVxuICAgIFxuICAgICAgICAgICAgICAgICAgICB2YXIganBlZ0RhdGFVcmkgPSAnZGF0YTppbWFnZS9qcGVnO2Jhc2U2NCwnICsgYnRvYShieXRlb3V0LmpvaW4oJycpKTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgYnl0ZW91dCA9IFtdO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyBiZW5jaG1hcmtpbmdcbiAgICAgICAgICAgICAgICAgICAgLy8gdmFyIGR1cmF0aW9uID0gbmV3IERhdGUoKS5nZXRUaW1lKCkgLSB0aW1lX3N0YXJ0O1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnRW5jb2RpbmcgdGltZTogJysgY3VycmVudFF1YWxpdHkgKyAnbXMnKTtcbiAgICAgICAgICAgICAgICAgICAgLy9cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGpwZWdEYXRhVXJpXG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICBmdW5jdGlvbiBzZXRRdWFsaXR5KHF1YWxpdHkpe1xuICAgICAgICAgICAgICAgIGlmIChxdWFsaXR5IDw9IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcXVhbGl0eSA9IDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChxdWFsaXR5ID4gMTAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHF1YWxpdHkgPSAxMDA7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIGlmKGN1cnJlbnRRdWFsaXR5ID09IHF1YWxpdHkpIHJldHVybiAvLyBkb24ndCByZWNhbGMgaWYgdW5jaGFuZ2VkXG4gICAgXG4gICAgICAgICAgICAgICAgdmFyIHNmID0gMDtcbiAgICAgICAgICAgICAgICBpZiAocXVhbGl0eSA8IDUwKSB7XG4gICAgICAgICAgICAgICAgICAgIHNmID0gTWF0aC5mbG9vcig1MDAwIC8gcXVhbGl0eSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2YgPSBNYXRoLmZsb29yKDIwMCAtIHF1YWxpdHkqMik7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIGluaXRRdWFudFRhYmxlcyhzZik7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1YWxpdHkgPSBxdWFsaXR5O1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdRdWFsaXR5IHNldCB0bzogJytxdWFsaXR5ICsnJScpO1xuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgZnVuY3Rpb24gaW5pdCgpe1xuICAgICAgICAgICAgICAgIC8vIHZhciB0aW1lX3N0YXJ0ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICAgICAgICAgICAgaWYoIXF1YWxpdHkpIHF1YWxpdHkgPSA1MDtcbiAgICAgICAgICAgICAgICAvLyBDcmVhdGUgdGFibGVzXG4gICAgICAgICAgICAgICAgaW5pdENoYXJMb29rdXBUYWJsZSgpXG4gICAgICAgICAgICAgICAgaW5pdEh1ZmZtYW5UYmwoKTtcbiAgICAgICAgICAgICAgICBpbml0Q2F0ZWdvcnlOdW1iZXIoKTtcbiAgICAgICAgICAgICAgICBpbml0UkdCWVVWVGFibGUoKTtcbiAgICBcbiAgICAgICAgICAgICAgICBzZXRRdWFsaXR5KHF1YWxpdHkpO1xuICAgICAgICAgICAgICAgIC8vIHZhciBkdXJhdGlvbiA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gdGltZV9zdGFydDtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnSW5pdGlhbGl6YXRpb24gJysgZHVyYXRpb24gKyAnbXMnKTtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgIGluaXQoKTtcbiAgICBcbiAgICAgICAgfTtcbiAgICBcbiAgICAgICAgSlBFR0VuY29kZXIuZW5jb2RlID0gZnVuY3Rpb24oIGRhdGEsIHF1YWxpdHkgKSB7XG4gICAgICAgICAgICB2YXIgZW5jb2RlciA9IG5ldyBKUEVHRW5jb2RlciggcXVhbGl0eSApO1xuICAgIFxuICAgICAgICAgICAgcmV0dXJuIGVuY29kZXIuZW5jb2RlKCBkYXRhICk7XG4gICAgICAgIH1cbiAgICBcbiAgICAgICAgcmV0dXJuIEpQRUdFbmNvZGVyO1xuICAgIH0pO1xuICAgIC8qKlxuICAgICAqIEBmaWxlT3ZlcnZpZXcgRml4IGFuZHJvaWQgY2FudmFzLnRvRGF0YVVybCBidWcuXG4gICAgICovXG4gICAgZGVmaW5lKCdydW50aW1lL2h0bWw1L2FuZHJvaWRwYXRjaCcsW1xuICAgICAgICAncnVudGltZS9odG1sNS91dGlsJyxcbiAgICAgICAgJ3J1bnRpbWUvaHRtbDUvanBlZ2VuY29kZXInLFxuICAgICAgICAnYmFzZSdcbiAgICBdLCBmdW5jdGlvbiggVXRpbCwgZW5jb2RlciwgQmFzZSApIHtcbiAgICAgICAgdmFyIG9yaWdpbiA9IFV0aWwuY2FudmFzVG9EYXRhVXJsLFxuICAgICAgICAgICAgc3VwcG9ydEpwZWc7XG4gICAgXG4gICAgICAgIFV0aWwuY2FudmFzVG9EYXRhVXJsID0gZnVuY3Rpb24oIGNhbnZhcywgdHlwZSwgcXVhbGl0eSApIHtcbiAgICAgICAgICAgIHZhciBjdHgsIHcsIGgsIGZyYWdlbWVudCwgcGFydHM7XG4gICAgXG4gICAgICAgICAgICAvLyDpnZ5hbmRyb2lk5omL5py655u05o6l6Lez6L+H44CCXG4gICAgICAgICAgICBpZiAoICFCYXNlLm9zLmFuZHJvaWQgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9yaWdpbi5hcHBseSggbnVsbCwgYXJndW1lbnRzICk7XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAvLyDmo4DmtYvmmK/lkKZjYW52YXPmlK/mjIFqcGVn5a+85Ye677yM5qC55o2u5pWw5o2u5qC85byP5p2l5Yik5pat44CCXG4gICAgICAgICAgICAvLyBKUEVHIOWJjeS4pOS9jeWIhuWIq+aYr++8mjI1NSwgMjE2XG4gICAgICAgICAgICBpZiAoIHR5cGUgPT09ICdpbWFnZS9qcGVnJyAmJiB0eXBlb2Ygc3VwcG9ydEpwZWcgPT09ICd1bmRlZmluZWQnICkge1xuICAgICAgICAgICAgICAgIGZyYWdlbWVudCA9IG9yaWdpbi5hcHBseSggbnVsbCwgYXJndW1lbnRzICk7XG4gICAgXG4gICAgICAgICAgICAgICAgcGFydHMgPSBmcmFnZW1lbnQuc3BsaXQoJywnKTtcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoIH5wYXJ0c1sgMCBdLmluZGV4T2YoJ2Jhc2U2NCcpICkge1xuICAgICAgICAgICAgICAgICAgICBmcmFnZW1lbnQgPSBhdG9iKCBwYXJ0c1sgMSBdICk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZnJhZ2VtZW50ID0gZGVjb2RlVVJJQ29tcG9uZW50KCBwYXJ0c1sgMSBdICk7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIGZyYWdlbWVudCA9IGZyYWdlbWVudC5zdWJzdHJpbmcoIDAsIDIgKTtcbiAgICBcbiAgICAgICAgICAgICAgICBzdXBwb3J0SnBlZyA9IGZyYWdlbWVudC5jaGFyQ29kZUF0KCAwICkgPT09IDI1NSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgZnJhZ2VtZW50LmNoYXJDb2RlQXQoIDEgKSA9PT0gMjE2O1xuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgLy8g5Y+q5pyJ5ZyoYW5kcm9pZOeOr+Wig+S4i+aJjeS/ruWkjVxuICAgICAgICAgICAgaWYgKCB0eXBlID09PSAnaW1hZ2UvanBlZycgJiYgIXN1cHBvcnRKcGVnICkge1xuICAgICAgICAgICAgICAgIHcgPSBjYW52YXMud2lkdGg7XG4gICAgICAgICAgICAgICAgaCA9IGNhbnZhcy5oZWlnaHQ7XG4gICAgICAgICAgICAgICAgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVuY29kZXIuZW5jb2RlKCBjdHguZ2V0SW1hZ2VEYXRhKCAwLCAwLCB3LCBoICksIHF1YWxpdHkgKTtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgIHJldHVybiBvcmlnaW4uYXBwbHkoIG51bGwsIGFyZ3VtZW50cyApO1xuICAgICAgICB9O1xuICAgIH0pO1xuICAgIC8qKlxuICAgICAqIEBmaWxlT3ZlcnZpZXcgVHJhbnNwb3J0XG4gICAgICogQHRvZG8g5pSv5oyBY2h1bmtlZOS8oOi+k++8jOS8mOWKv++8mlxuICAgICAqIOWPr+S7peWwhuWkp+aWh+S7tuWIhuaIkOWwj+Wdl++8jOaMqOS4quS8oOi+k++8jOWPr+S7peaPkOmrmOWkp+aWh+S7tuaIkOWKn+eOh++8jOW9k+Wksei0peeahOaXtuWAme+8jOS5n+WPqumcgOimgemHjeS8oOmCo+Wwj+mDqOWIhu+8jFxuICAgICAqIOiAjOS4jemcgOimgemHjeWktOWGjeS8oOS4gOasoeOAguWPpuWkluaWreeCuee7reS8oOS5n+mcgOimgeeUqGNodW5rZWTmlrnlvI/jgIJcbiAgICAgKi9cbiAgICBkZWZpbmUoJ3J1bnRpbWUvaHRtbDUvdHJhbnNwb3J0JyxbXG4gICAgICAgICdiYXNlJyxcbiAgICAgICAgJ3J1bnRpbWUvaHRtbDUvcnVudGltZSdcbiAgICBdLCBmdW5jdGlvbiggQmFzZSwgSHRtbDVSdW50aW1lICkge1xuICAgIFxuICAgICAgICB2YXIgbm9vcCA9IEJhc2Uubm9vcCxcbiAgICAgICAgICAgICQgPSBCYXNlLiQ7XG4gICAgXG4gICAgICAgIHJldHVybiBIdG1sNVJ1bnRpbWUucmVnaXN0ZXIoICdUcmFuc3BvcnQnLCB7XG4gICAgICAgICAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zdGF0dXMgPSAwO1xuICAgICAgICAgICAgICAgIHRoaXMuX3Jlc3BvbnNlID0gbnVsbDtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBzZW5kOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgb3duZXIgPSB0aGlzLm93bmVyLFxuICAgICAgICAgICAgICAgICAgICBvcHRzID0gdGhpcy5vcHRpb25zLFxuICAgICAgICAgICAgICAgICAgICB4aHIgPSB0aGlzLl9pbml0QWpheCgpLFxuICAgICAgICAgICAgICAgICAgICBibG9iID0gb3duZXIuX2Jsb2IsXG4gICAgICAgICAgICAgICAgICAgIHNlcnZlciA9IG9wdHMuc2VydmVyLFxuICAgICAgICAgICAgICAgICAgICBmb3JtRGF0YSwgYmluYXJ5LCBmcjtcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoIG9wdHMuc2VuZEFzQmluYXJ5ICkge1xuICAgICAgICAgICAgICAgICAgICBzZXJ2ZXIgKz0gKC9cXD8vLnRlc3QoIHNlcnZlciApID8gJyYnIDogJz8nKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5wYXJhbSggb3duZXIuX2Zvcm1EYXRhICk7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGJpbmFyeSA9IGJsb2IuZ2V0U291cmNlKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZm9ybURhdGEgPSBuZXcgRm9ybURhdGEoKTtcbiAgICAgICAgICAgICAgICAgICAgJC5lYWNoKCBvd25lci5fZm9ybURhdGEsIGZ1bmN0aW9uKCBrLCB2ICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9ybURhdGEuYXBwZW5kKCBrLCB2ICk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBmb3JtRGF0YS5hcHBlbmQoIG9wdHMuZmlsZVZhbCwgYmxvYi5nZXRTb3VyY2UoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRzLmZpbGVuYW1lIHx8IG93bmVyLl9mb3JtRGF0YS5uYW1lIHx8ICcnICk7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIGlmICggb3B0cy53aXRoQ3JlZGVudGlhbHMgJiYgJ3dpdGhDcmVkZW50aWFscycgaW4geGhyICkge1xuICAgICAgICAgICAgICAgICAgICB4aHIub3Blbiggb3B0cy5tZXRob2QsIHNlcnZlciwgdHJ1ZSApO1xuICAgICAgICAgICAgICAgICAgICB4aHIud2l0aENyZWRlbnRpYWxzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB4aHIub3Blbiggb3B0cy5tZXRob2QsIHNlcnZlciApO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICB0aGlzLl9zZXRSZXF1ZXN0SGVhZGVyKCB4aHIsIG9wdHMuaGVhZGVycyApO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggYmluYXJ5ICkge1xuICAgICAgICAgICAgICAgICAgICB4aHIub3ZlcnJpZGVNaW1lVHlwZSgnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJyk7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIGFuZHJvaWTnm7TmjqXlj5HpgIFibG9i5Lya5a+86Ie05pyN5Yqh56uv5o6l5pS25Yiw55qE5piv56m65paH5Lu244CCXG4gICAgICAgICAgICAgICAgICAgIC8vIGJ1Z+ivpuaDheOAglxuICAgICAgICAgICAgICAgICAgICAvLyBodHRwczovL2NvZGUuZ29vZ2xlLmNvbS9wL2FuZHJvaWQvaXNzdWVzL2RldGFpbD9pZD0zOTg4MlxuICAgICAgICAgICAgICAgICAgICAvLyDmiYDku6XlhYjnlKhmaWxlUmVhZGVy6K+75Y+W5Ye65p2l5YaN6YCa6L+HYXJyYXlidWZmZXLnmoTmlrnlvI/lj5HpgIHjgIJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBCYXNlLm9zLmFuZHJvaWQgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBmci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4aHIuc2VuZCggdGhpcy5yZXN1bHQgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmciA9IGZyLm9ubG9hZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgZnIucmVhZEFzQXJyYXlCdWZmZXIoIGJpbmFyeSApO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgeGhyLnNlbmQoIGJpbmFyeSApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgeGhyLnNlbmQoIGZvcm1EYXRhICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGdldFJlc3BvbnNlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fcmVzcG9uc2U7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgZ2V0UmVzcG9uc2VBc0pzb246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9wYXJzZUpzb24oIHRoaXMuX3Jlc3BvbnNlICk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgZ2V0U3RhdHVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fc3RhdHVzO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGFib3J0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgeGhyID0gdGhpcy5feGhyO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggeGhyICkge1xuICAgICAgICAgICAgICAgICAgICB4aHIudXBsb2FkLm9ucHJvZ3Jlc3MgPSBub29wO1xuICAgICAgICAgICAgICAgICAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gbm9vcDtcbiAgICAgICAgICAgICAgICAgICAgeGhyLmFib3J0KCk7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3hociA9IHhociA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuYWJvcnQoKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBfaW5pdEFqYXg6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpLFxuICAgICAgICAgICAgICAgICAgICBvcHRzID0gdGhpcy5vcHRpb25zO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggb3B0cy53aXRoQ3JlZGVudGlhbHMgJiYgISgnd2l0aENyZWRlbnRpYWxzJyBpbiB4aHIpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlb2YgWERvbWFpblJlcXVlc3QgIT09ICd1bmRlZmluZWQnICkge1xuICAgICAgICAgICAgICAgICAgICB4aHIgPSBuZXcgWERvbWFpblJlcXVlc3QoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgeGhyLnVwbG9hZC5vbnByb2dyZXNzID0gZnVuY3Rpb24oIGUgKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwZXJjZW50YWdlID0gMDtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBlLmxlbmd0aENvbXB1dGFibGUgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwZXJjZW50YWdlID0gZS5sb2FkZWQgLyBlLnRvdGFsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtZS50cmlnZ2VyKCAncHJvZ3Jlc3MnLCBwZXJjZW50YWdlICk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgICAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGlmICggeGhyLnJlYWR5U3RhdGUgIT09IDQgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgeGhyLnVwbG9hZC5vbnByb2dyZXNzID0gbm9vcDtcbiAgICAgICAgICAgICAgICAgICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IG5vb3A7XG4gICAgICAgICAgICAgICAgICAgIG1lLl94aHIgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBtZS5fc3RhdHVzID0geGhyLnN0YXR1cztcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB4aHIuc3RhdHVzID49IDIwMCAmJiB4aHIuc3RhdHVzIDwgMzAwICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWUuX3Jlc3BvbnNlID0geGhyLnJlc3BvbnNlVGV4dDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBtZS50cmlnZ2VyKCdsb2FkJyk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIHhoci5zdGF0dXMgPj0gNTAwICYmIHhoci5zdGF0dXMgPCA2MDAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZS5fcmVzcG9uc2UgPSB4aHIucmVzcG9uc2VUZXh0O1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1lLnRyaWdnZXIoICdlcnJvcicsICdzZXJ2ZXInICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1lLnRyaWdnZXIoICdlcnJvcicsIG1lLl9zdGF0dXMgPyAnaHR0cCcgOiAnYWJvcnQnICk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgICAgICBtZS5feGhyID0geGhyO1xuICAgICAgICAgICAgICAgIHJldHVybiB4aHI7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgX3NldFJlcXVlc3RIZWFkZXI6IGZ1bmN0aW9uKCB4aHIsIGhlYWRlcnMgKSB7XG4gICAgICAgICAgICAgICAgJC5lYWNoKCBoZWFkZXJzLCBmdW5jdGlvbigga2V5LCB2YWwgKSB7XG4gICAgICAgICAgICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKCBrZXksIHZhbCApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIF9wYXJzZUpzb246IGZ1bmN0aW9uKCBzdHIgKSB7XG4gICAgICAgICAgICAgICAgdmFyIGpzb247XG4gICAgXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAganNvbiA9IEpTT04ucGFyc2UoIHN0ciApO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKCBleCApIHtcbiAgICAgICAgICAgICAgICAgICAganNvbiA9IHt9O1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4ganNvbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgZGVmaW5lKCd3ZWJ1cGxvYWRlcicsW1xuICAgICAgICAnYmFzZScsXG4gICAgICAgICd3aWRnZXRzL2ZpbGVwaWNrZXInLFxuICAgICAgICAnd2lkZ2V0cy9pbWFnZScsXG4gICAgICAgICd3aWRnZXRzL3F1ZXVlJyxcbiAgICAgICAgJ3dpZGdldHMvcnVudGltZScsXG4gICAgICAgICd3aWRnZXRzL3VwbG9hZCcsXG4gICAgICAgICdydW50aW1lL2h0bWw1L2Jsb2InLFxuICAgICAgICAncnVudGltZS9odG1sNS9maWxlcGlja2VyJyxcbiAgICAgICAgJ3J1bnRpbWUvaHRtbDUvaW1hZ2VtZXRhL2V4aWYnLFxuICAgICAgICAncnVudGltZS9odG1sNS9pbWFnZScsXG4gICAgICAgICdydW50aW1lL2h0bWw1L2FuZHJvaWRwYXRjaCcsXG4gICAgICAgICdydW50aW1lL2h0bWw1L3RyYW5zcG9ydCdcbiAgICBdLCBmdW5jdGlvbiggQmFzZSApIHtcbiAgICAgICAgcmV0dXJuIEJhc2U7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlcXVpcmUoJ3dlYnVwbG9hZGVyJyk7XG59KTtcbiJdLCJmaWxlIjoicGx1Z2lucy91ZWRpdG9yL3RoaXJkLXBhcnR5L3dlYnVwbG9hZGVyL3dlYnVwbG9hZGVyLmN1c3RvbS5qcyJ9
